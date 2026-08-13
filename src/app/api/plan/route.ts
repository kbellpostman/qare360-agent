import { NextResponse } from "next/server";
import type { ResearchPlan } from "@/lib/planner/types";

const DEFAULT_BASE_URL = "https://agent.kbpm.nl/v1";
const DEFAULT_MODEL = "qare";

type ChatMessage = { role: "user" | "assistant"; content: string };

function isResearchPlan(value: unknown): value is ResearchPlan {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.summary === "string" &&
    typeof v.recommendationTitle === "string" &&
    typeof v.estimatedInvestment === "number" &&
    Array.isArray(v.investmentBreakdown)
  );
}

function tryParsePlan(text: string): ResearchPlan | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const candidates = [cleaned];
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    candidates.push(cleaned.slice(start, end + 1));
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isResearchPlan(parsed)) return parsed as ResearchPlan;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function POST(request: Request) {
  const apiKey = process.env.HERMES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "HERMES_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    prompt?: string;
    messages?: ChatMessage[];
  } | null;

  const history: ChatMessage[] = (body?.messages ?? []).filter(
    (m) => m && m.content && m.content.trim().length > 0,
  );
  const prompt = (body?.prompt ?? "").trim();
  if (prompt) history.push({ role: "user", content: prompt });
  if (history.length === 0) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 422 });
  }

  const baseUrl = (process.env.HERMES_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.HERMES_MODEL ?? DEFAULT_MODEL;

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        max_tokens: 4000,
        messages: history,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: `Hermes upstream error (${upstream.status}): ${text.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!content) {
      return NextResponse.json({ error: "Empty response from Hermes." }, { status: 502 });
    }

    const plan = tryParsePlan(content);
    if (plan) return NextResponse.json({ plan });
    return NextResponse.json({ reply: content });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Plan generation failed.";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
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

const CHIPS_RE = /\[CHIPS:\s*([^\]]+)\]/i;
const PROGRESS_RE = /\[PROGRESS\]([\s\S]*?)\[\/PROGRESS\]/i;

function parseProgress(text: string): Record<string, boolean> | null {
  const match = PROGRESS_RE.exec(text);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[1]) as unknown;
    if (obj && typeof obj === "object") {
      return obj as Record<string, boolean>;
    }
  } catch {
    /* ignore malformed progress */
  }
  return null;
}

function parseReply(text: string): {
  reply: string;
  suggestions: string[];
  progress: Record<string, boolean> | null;
} {
  const progress = parseProgress(text);
  const textNoProgress = text.replace(PROGRESS_RE, "").trim();
  const match = CHIPS_RE.exec(textNoProgress);
  if (!match) return { reply: textNoProgress, suggestions: [], progress };
  const suggestions = match[1]
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const reply = textNoProgress.replace(CHIPS_RE, "").trim();
  return { reply, suggestions, progress };
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
    stream?: boolean;
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

  // --- Streaming path (default) ---
  if (body?.stream !== false) {
    return handleStreamingRequest({ baseUrl, apiKey, model, history });
  }

  // --- Non-streaming path (backward compatible) ---
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

    const { reply, suggestions, progress } = parseReply(content);
    return NextResponse.json({ reply, suggestions, progress });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Plan generation failed.";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

// --- Streaming handler ---
async function handleStreamingRequest(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  history: ChatMessage[];
}) {
  const { baseUrl, apiKey, model, history } = params;

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: 4000,
        messages: history,
      }),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Stream request failed.";
    return NextResponse.json({ error: detail }, { status: 502 });
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: `Hermes upstream error (${upstream.status}): ${text.slice(0, 300)}` },
      { status: 502 },
    );
  }

  if (!upstream.body) {
    return NextResponse.json({ error: "No response body from Hermes." }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let fullText = "";
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload);
              const content: string | undefined =
                parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta: content })}\n\n`),
                );
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }

        // Flush remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data:") && trimmed.slice(5).trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(trimmed.slice(5).trim());
              const content: string | undefined =
                parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta: content })}\n\n`),
                );
              }
            } catch {
              // skip
            }
          }
        }

        // Send final message
        const plan = tryParsePlan(fullText);
        if (plan) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ plan })}\n\n`),
          );
        } else {
          const { reply, suggestions, progress } = parseReply(fullText);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                reply,
                suggestions,
                progress,
              })}\n\n`,
            ),
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        // If we have partial text, send it before erroring
        const detail = error instanceof Error ? error.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: detail })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
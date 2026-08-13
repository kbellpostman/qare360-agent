import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { RESEARCH_PLANNER_SYSTEM_PROMPT } from "@/lib/planner/prompt";
import type { ResearchPlan } from "@/lib/planner/types";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

function parsePlanResponse(text: string): ResearchPlan {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned) as ResearchPlan;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 422 });
  }

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 3200,
      system: RESEARCH_PLANNER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from the model." },
        { status: 502 },
      );
    }

    const plan = parsePlanResponse(textBlock.text);
    return NextResponse.json({ plan });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Plan generation failed.";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

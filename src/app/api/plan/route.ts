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
const EXPLAIN_RE = /\[EXPLAIN\]([\s\S]*?)\[\/EXPLAIN\]/i;

export interface Explain {
  title?: string;
  text?: string;
}

function parseExplain(text: string): Explain | null {
  const match = EXPLAIN_RE.exec(text);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[1]) as Record<string, unknown>;
    const title = typeof obj.title === "string" ? obj.title : undefined;
    const body = typeof obj.text === "string" ? obj.text : undefined;
    if (title || body) return { title, text: body };
  } catch {
    /* ignore malformed explain */
  }
  return null;
}

/** Slaat een afgerond onderzoeksvoorstel op in de QARE Notion-database. */
async function storeRequestToNotion(
  plan: ResearchPlan,
  topic: string
): Promise<string | null> {
  const pat = process.env.NOTION_PAT;
  const dbId = process.env.QARE_DB_ID;
  if (!pat || !dbId) {
    console.error("storeRequestToNotion: NOTION_PAT / QARE_DB_ID ontbreekt");
    return null;
  }

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Titel: {
            title: [{ type: "text", text: { content: plan.recommendationTitle || "Onderzoeksvoorstel" } }],
          },
          Onderwerp: {
            rich_text: [{ type: "text", text: { content: (plan.summary || topic || "").slice(0, 1900) } }],
          },
          Aanbeveling: {
            rich_text: [{ type: "text", text: { content: (plan.recommendationDescription || "").slice(0, 1900) } }],
          },
          Investering: {
            number: typeof plan.estimatedInvestment === "number" ? plan.estimatedInvestment : null,
          },
          Status: { select: { name: "Nieuw" } },
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("storeRequestToNotion failed:", res.status, body.slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch (err) {
    console.error("storeRequestToNotion error:", err);
    return null;
  }
}

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
  explain: Explain | null;
} {
  const explain = parseExplain(text);
  const progress = parseProgress(text);
  let cleaned = text.replace(PROGRESS_RE, "").replace(EXPLAIN_RE, "").trim();
  const match = CHIPS_RE.exec(cleaned);
  if (!match) return { reply: cleaned, suggestions: [], progress, explain };
  const suggestions = match[1]
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const reply = cleaned.replace(CHIPS_RE, "").trim();
  return { reply, suggestions, progress, explain };
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
    if (plan) {
      const topic = history.find((m) => m.role === "user")?.content ?? "";
      const notionId = await storeRequestToNotion(plan, topic);
      return NextResponse.json({ plan, notionId });
    }

    const { reply, suggestions, progress, explain } = parseReply(content);
    return NextResponse.json({ reply, suggestions, progress, explain });
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
          const topic = history.find((m) => m.role === "user")?.content ?? "";
          const notionId = await storeRequestToNotion(plan, topic);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ plan, notionId })}\n\n`,
            ),
          );
        } else {
          const { reply, suggestions, progress, explain } = parseReply(fullText);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                reply,
                suggestions,
                progress,
                explain,
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
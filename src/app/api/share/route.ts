import { NextResponse } from "next/server";
import type { ResearchPlan } from "@/lib/planner/types";
import { createShare, shareUrl } from "@/lib/share";
import { sendProposalEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    plan?: ResearchPlan;
    email?: string;
  } | null;

  const plan = body?.plan;
  if (!plan || typeof plan !== "object" || !plan.recommendationTitle) {
    return NextResponse.json({ error: "Geen geldig voorstel ontvangen." }, { status: 400 });
  }

  const { token } = await createShare(plan);
  const url = shareUrl(token);

  let emailed = false;
  const email = (body?.email ?? "").trim();
  if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    emailed = await sendProposalEmail(email, plan, url);
  }

  return NextResponse.json({ token, url, emailed });
}
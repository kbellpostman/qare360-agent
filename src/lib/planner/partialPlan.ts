/**
 * lib/planner/partialPlan.ts
 *
 * Tolereert parser voor een JSON-plan dat nog aan het streamen is.
 * Terwijl de account manager het voorstel genereert, komt de JSON in
 * brokken binnen. Deze module haalt per stap alle reeds-VOLLEDIGE top-level
 * velden eruit, zodat de frontend secties live kan tonen naarmate ze binnenkomen.
 */

import type { NavSectionId, ResearchPlan } from "@/lib/planner/types";

type UnknownRecord = Record<string, unknown>;

/** Vind het volledige JSON-waarde-deel voor een top-level key in (deels) ruwe tekst. */
function findValue(raw: string, key: string): string | null {
  const idx = raw.indexOf(`"${key}"`);
  if (idx === -1) return null;
  const colon = raw.indexOf(":", idx + key.length + 2);
  if (colon === -1) return null;
  let i = colon + 1;
  while (i < raw.length && /\s/.test(raw[i])) i++;
  if (i >= raw.length) return null;

  const c0 = raw[i];
  if (c0 === '"') {
    const end = raw.indexOf('"', i + 1);
    if (end === -1) return null;
    return raw.slice(i, end + 1);
  }
  if (c0 === "[" || c0 === "{") {
    return matchBalanced(raw, i, c0, c0 === "[" ? "]" : "}");
  }
  const num = /^-?[\d.eE+\-]+/.exec(raw.slice(i));
  if (num) return num[0];
  const word = /^(true|false|null)/.exec(raw.slice(i));
  if (word) return word[0];
  return null;
}

function matchBalanced(
  raw: string,
  start: number,
  open: string,
  close: string
): string | null {
  let depth = 0;
  let inStr = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

const STRING_KEYS: (keyof ResearchPlan)[] = [
  "summary",
  "recommendationTitle",
  "recommendationDescription",
  "objective",
  "recommendedApproach",
  "includedBasis",
  "note",
  "audienceSample",
  "deliverables",
  "timeline",
  "assumptions",
];
const ARRAY_KEYS: (keyof ResearchPlan)[] = [
  "tags",
  "objectiveGoals",
  "researchQuestions",
  "deliverableItems",
  "timelinePhases",
  "investmentBreakdown",
  "optionalAdditions",
  "audienceProfile",
  "studyDesign",
  "assumptionsList",
];
const NUMBER_KEYS: (keyof ResearchPlan)[] = ["estimatedInvestment"];

export function extractPartialPlan(raw: string): Partial<ResearchPlan> {
  const out: UnknownRecord = {};

  for (const key of STRING_KEYS) {
    const v = findValue(raw, key as string);
    if (v) {
      try {
        const parsed = JSON.parse(v);
        if (typeof parsed === "string" && parsed.trim()) out[key] = parsed.trim();
      } catch {
        /* not complete yet */
      }
    }
  }

  for (const key of ARRAY_KEYS) {
    const v = findValue(raw, key as string);
    if (v) {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed) && parsed.length > 0) out[key] = parsed;
      } catch {
        /* not complete yet */
      }
    }
  }

  for (const key of NUMBER_KEYS) {
    const v = findValue(raw, key as string);
    if (v) {
      const num = Number(v);
      if (!Number.isNaN(num)) out[key] = num;
    }
  }

  return out as Partial<ResearchPlan>;
}

/** Een geheel voorstel? (niet alleen gedeeltelijk) */
export function isCompletePlan(partial: Partial<ResearchPlan>): boolean {
  return (
    typeof partial.summary === "string" &&
    typeof partial.recommendationTitle === "string" &&
    Array.isArray(partial.investmentBreakdown) &&
    Array.isArray(partial.researchQuestions)
  );
}

/**
 * Welke nav-secties zijn al "klaar" (hun data is volledig binnen)?
 */
export function sectionProgress(
  partial: Partial<ResearchPlan>
): Record<NavSectionId, boolean> {
  const arr = (k: keyof ResearchPlan) =>
    Array.isArray(partial[k]) && (partial[k] as unknown[]).length > 0;
  const str = (k: keyof ResearchPlan) =>
    typeof partial[k] === "string" && String(partial[k]).trim().length > 0;

  return {
    objective: str("objective") || arr("objectiveGoals"),
    recommendation:
      str("recommendationDescription") ||
      str("recommendedApproach") ||
      str("recommendationTitle"),
    questions: arr("researchQuestions"),
    approach: str("recommendedApproach"),
    audience: str("audienceSample") || Boolean(partial.audienceProfile),
    deliverables: str("deliverables") || arr("deliverableItems"),
    timeline: str("timeline") || arr("timelinePhases"),
    investment: arr("investmentBreakdown") || typeof partial.estimatedInvestment === "number",
    assumptions: str("assumptions") || arr("assumptionsList"),
  };
}

export const NAV_ORDER: NavSectionId[] = [
  "objective",
  "recommendation",
  "questions",
  "approach",
  "audience",
  "deliverables",
  "timeline",
  "investment",
  "assumptions",
];

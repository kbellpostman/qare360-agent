/**
 * lib/planner/progress.ts
 *
 * Leidt af hoe ver het intakegesprek is. De account manager stelt gerichte
 * vragen; pas zodra de KLANT (user) een onderwerp heeft beantwoord, wordt de
 * bijbehorende checklist-regel afgevinkt.
 *
 * Belangrijk: we kijken ALLEEN naar user-berichten, niet naar de vragen van de
 * account manager. Anders vinkt een item al af op het moment dat de manager er
 * nét naar vraagt — terwijl het onderwerp nog openstaat.
 *
 * Dit is een conservatieve heuristiek: beter een item niet afvinken dan te
 * vroeg. Het volledige plan wordt pas "klaar" als de account manager de
 * uiteindelijke JSON levert.
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const CHECKLIST_ITEMS = [
  "Research objective",
  "Research questions",
  "Audience & sample",
  "Recruitment",
  "Measures",
  "Deliverables",
  "Timeline",
  "Investment",
  "Assumptions",
] as const;

export type ChecklistKey =
  | "objective"
  | "questions"
  | "audience"
  | "recruitment"
  | "measures"
  | "deliverables"
  | "timeline"
  | "investment"
  | "assumptions";

type Rule = {
  key: ChecklistKey;
  keywords: string[];
};

// Keywords kijken naar de ANTWOORDEN van de klant. Bewust specifiek, zodat we
// niet te snel afvinken als de account manager er alleen nog naar vraagt.
const RULES: Rule[] = [
  {
    key: "objective",
    keywords: [
      "we willen", "wil onderzoeken", "willen onderzoeken", "doel",
      "doelstelling", "het gaat om", "we zijn een", "onze klant",
      "ik wil", "willen weten",
    ],
  },
  {
    key: "questions",
    keywords: [
      "vraag", "vragen", "onderzoeksvraag", "drijfveren", "barrières",
      "motieven", "waarom", "wat drijft", "wat motiveert",
    ],
  },
  {
    key: "audience",
    keywords: [
      "doelgroep", "leeftijd", "18-25", "18-30", "16 tot", "tot 56",
      "respondenten", "steekproef", "publiek", "jongeren", "kansrijk",
      "doelgroe",
    ],
  },
  {
    key: "recruitment",
    keywords: [
      "panel", "panels", "werving", "via een panel", "online panel",
      "geworven", "kanaal", "recruiteren",
    ],
  },
  {
    key: "measures",
    keywords: [
      "meten", "meting", "kpi", "metric", "bereidheid om te betalen",
      "willingness", "gebruiksfrequentie", "metrieken", "wat we willen meten",
      "tevredenheid", "imago", "houding",
    ],
  },
  {
    key: "deliverables",
    keywords: [
      "rapport", "deliverable", "oplevering", "presentatie", "pdf",
      "dashboard", "verslag", "wat leveren", "output",
    ],
  },
  {
    key: "timeline",
    keywords: [
      "weken", "tijdlijn", "looptijd", "duur", "hoe lang", "termijn",
      "planning", "doorlooptijd", "voor wanneer", "deadline",
    ],
  },
  {
    key: "investment",
    keywords: [
      "budget", "kosten", "investering", "prijs", "euro", "€",
      "geld", "beschikbaar", "indicatie", "max "
    ],
  },
  {
    key: "assumptions",
    keywords: [
      "aanname", "aannames", "assumptie", "veronderstel", "uitgaand van",
      "ervan uit", "hypothese", "we denken dat", "we nemen aan",
    ],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

// Vaste volgorde van de 9 checklist-items, zodat het progress-object
// deterministisch vertaald wordt naar de afvink-array.
export const PROGRESS_ORDER: ChecklistKey[] = [
  "objective",
  "questions",
  "audience",
  "recruitment",
  "measures",
  "deliverables",
  "timeline",
  "investment",
  "assumptions",
];

/** Vertaal het [PROGRESS]-object (van de account manager) naar een boolean-array. */
export function progressToChecks(
  progress: Record<string, boolean>
): boolean[] {
  return PROGRESS_ORDER.map((key) => Boolean(progress[key]));
}

/**
 * Gesproken onderwerpen detecteren over de ANTWOORDEN van de klant.
 * Retourneert voor elk checklist-item een boolean (= afgevinkt of niet).
 */
export function computeChecklistProgress(
  messages: ChatMessage[]
): boolean[] {
  // Alleen user-berichten tellen: een onderwerp is pas "gedekt" als de klant
  // er daadwerkelijk iets over heeft geantwoord.
  const combined = normalize(
    messages.filter((m) => m.role === "user").map((m) => m.content).join(" ")
  );

  return RULES.map((rule) => {
    const hits = rule.keywords.filter((kw) => combined.includes(kw.toLowerCase()));
    return hits.length > 0;
  });
}

import type { NavSectionId } from "@/lib/planner/types";

export const CHECKLIST_LABELS = [
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

export const NAV_ITEMS: Array<{ id: NavSectionId; label: string }> = [
  { id: "objective", label: "Research objective" },
  { id: "recommendation", label: "Our recommendation" },
  { id: "questions", label: "Research questions" },
  { id: "approach", label: "Recommended approach" },
  { id: "audience", label: "Audience & sample" },
  { id: "deliverables", label: "Deliverables" },
  { id: "timeline", label: "Timeline" },
  { id: "investment", label: "Investment" },
  { id: "assumptions", label: "Assumptions" },
];

export const EXAMPLES = [
  "Validate an idea",
  "Measure campaign impact",
  "Understand an audience",
] as const;

export const DECIDE_STEPS = [
  {
    text: "What's your goal?",
    options: [
      "Validate an idea",
      "Measure campaign impact",
      "Understand an audience",
      "Explore a new market",
    ],
  },
  {
    text: "Who do you want to learn from?",
    options: [
      "Consumers",
      "B2B professionals",
      "Existing customers",
      "General public",
    ],
  },
  {
    text: "How soon do you need results?",
    options: [
      "As soon as possible",
      "2–4 weeks",
      "1–2 months",
      "Flexible",
    ],
  },
] as const;

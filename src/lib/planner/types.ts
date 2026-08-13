export type PlannerMode = "know" | "decide";
export type PlannerScreen = "start" | "chat" | "plan";

export type NavSectionId =
  | "objective"
  | "recommendation"
  | "questions"
  | "approach"
  | "audience"
  | "deliverables"
  | "timeline"
  | "investment"
  | "assumptions";

export interface StudyDesign {
  groupADetail: string;
  groupBDetail: string;
  measures: string;
  analysis: string;
}

export interface AudienceProfile {
  sampleSize: string;
  criteria: string[];
}

export interface TimelinePhase {
  phase: string;
  duration: string;
  description: string;
}

export interface InvestmentLine {
  item: string;
  amount: number;
}

export interface OptionalAddition {
  label: string;
  price: number;
}

export interface ResearchPlan {
  summary: string;
  recommendationTitle: string;
  recommendationDescription: string;
  tags: string[];
  objective: string;
  objectiveGoals: string[];
  researchQuestions: string[];
  recommendedApproach: string;
  studyDesign: StudyDesign;
  includedBasis: string;
  note: string;
  audienceSample: string;
  audienceProfile: AudienceProfile;
  deliverables: string;
  deliverableItems: string[];
  timeline: string;
  timelinePhases: TimelinePhase[];
  assumptions: string;
  assumptionsList: string[];
  estimatedInvestment: number;
  investmentBreakdown: InvestmentLine[];
  optionalAdditions: OptionalAddition[];
}

export interface DecideAnswers {
  goal?: string;
  audience?: string;
  timing?: string;
}

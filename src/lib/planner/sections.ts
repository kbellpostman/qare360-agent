import type { NavSectionId, ResearchPlan } from "@/lib/planner/types";

export function buildSection(plan: ResearchPlan, id: NavSectionId) {
  const map: Record<NavSectionId, { title: string; intro: string }> = {
    objective: { title: "Research objective", intro: plan.objective },
    recommendation: {
      title: plan.recommendationTitle || "Our recommendation",
      intro: plan.recommendationDescription,
    },
    questions: {
      title: "Research questions",
      intro: "The key questions this study is designed to answer.",
    },
    approach: { title: "Recommended approach", intro: plan.recommendedApproach },
    audience: { title: "Audience & sample", intro: plan.audienceSample },
    deliverables: { title: "Deliverables", intro: plan.deliverables },
    timeline: { title: "Timeline", intro: plan.timeline },
    investment: {
      title: "Investment",
      intro: `Estimated investment: €${(plan.estimatedInvestment || 0).toLocaleString("en-US")} excl. VAT.`,
    },
    assumptions: { title: "Assumptions", intro: plan.assumptions },
  };

  return map[id] ?? map.recommendation;
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US");
}

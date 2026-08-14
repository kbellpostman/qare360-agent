"use client";

import { NAV_ITEMS } from "@/lib/planner/constants";
import { buildSection, formatCurrency } from "@/lib/planner/sections";
import type { NavSectionId, ResearchPlan } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { ShareBlock } from "@/components/planner/share-block";

interface PlanScreenProps {
  plan: ResearchPlan;
  activeNav: NavSectionId;
  additions: Record<string, boolean>;
  onSelectNav: (id: NavSectionId) => void;
  onToggleAddition: (label: string) => void;
  onBackToChat: () => void;
}

export function PlanScreen({
  plan,
  activeNav,
  additions,
  onSelectNav,
  onToggleAddition,
  onBackToChat,
}: PlanScreenProps) {
  const activeSection = buildSection(plan, activeNav);
  const total =
    (plan.estimatedInvestment || 0) +
    (plan.optionalAdditions ?? []).reduce(
      (sum, item) => sum + (additions[item.label] ? item.price : 0),
      0,
    );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <nav className="hidden w-[220px] shrink-0 py-8 pl-10 md:block">
        <div className="mb-5 text-sm font-bold">Your research plan</div>
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectNav(item.id)}
                className={cn(
                  "mb-0.5 w-full cursor-pointer rounded-[10px] px-3.5 py-2.5 text-left text-sm",
                  item.id === activeNav
                    ? "bg-[#eef2ff] font-semibold text-[#111318]"
                    : "text-[#4a4d55]",
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-[720px]">
          <p className="mb-2.5 text-xs font-bold tracking-widest text-[#9a9ca3]">
            RESEARCH PLAN
          </p>
          <h1 className="mb-3.5 text-[32px] font-extrabold">{activeSection.title}</h1>
          <p className="mb-4 text-base leading-relaxed text-[#4a4d55]">
            {activeSection.intro}
          </p>

          {activeNav === "recommendation" && plan.tags?.length ? (
            <div className="mb-7 flex flex-wrap gap-2">
              {plan.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#f2f3f4] px-3.5 py-1.5 text-xs text-[#4a4d55]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {activeNav === "recommendation" ? (
            <>
              <InfoCard title="Our recommendation">{plan.recommendedApproach}</InfoCard>
              <InfoCard title="Study design">
                <StudyDesignRows design={plan.studyDesign} />
              </InfoCard>
              <InfoCard title="Included in the research basis">{plan.includedBasis}</InfoCard>
              <div className="rounded-[14px] bg-[#fdf6e3] px-5 py-4 text-[13px] text-[#8a6d1f]">
                Note: {plan.note}
              </div>
            </>
          ) : null}

          {activeNav === "questions" ? (
            <ul>
              {plan.researchQuestions.map((question) => (
                <li
                  key={question}
                  className="flex gap-3 border-b border-[#eee] py-3.5 text-[15px] text-[#26282e]"
                >
                  <span className="text-[#c9cacd]">—</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {activeNav === "objective" ? (
            <InfoCard title="This research will help you to">
              <ul className="space-y-2.5">
                {plan.objectiveGoals.map((goal) => (
                  <li key={goal} className="flex gap-3 text-sm text-[#3a3d44]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111318] text-[11px] text-white">
                      ✓
                    </span>
                    {goal}
                  </li>
                ))}
              </ul>
            </InfoCard>
          ) : null}

          {activeNav === "audience" ? (
            <>
              <InfoCard title="Sample size">{plan.audienceProfile.sampleSize}</InfoCard>
              <InfoCard title="Sample criteria">
                <ul>
                  {plan.audienceProfile.criteria.map((criterion) => (
                    <li
                      key={criterion}
                      className="flex gap-3 border-b border-[#eee] py-2.5 text-sm text-[#3a3d44]"
                    >
                      <span className="text-[#c9cacd]">—</span>
                      {criterion}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            </>
          ) : null}

          {activeNav === "deliverables" ? (
            <ul className="space-y-3">
              {plan.deliverableItems.map((item) => (
                <li
                  key={item}
                  className="flex gap-3.5 rounded-[14px] bg-[#fafafa] px-5 py-4 text-sm leading-relaxed text-[#26282e]"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#111318]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {activeNav === "timeline" ? (
            <ul>
              {plan.timelinePhases.map((phase) => (
                <li
                  key={phase.phase}
                  className="flex gap-5 border-b border-[#eee] py-4.5"
                >
                  <div className="w-[100px] shrink-0 pt-0.5 text-xs font-bold tracking-wide text-[#9a9ca3]">
                    {phase.duration}
                  </div>
                  <div>
                    <div className="mb-1 text-[15px] font-bold">{phase.phase}</div>
                    <p className="text-sm leading-relaxed text-[#4a4d55]">
                      {phase.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {activeNav === "investment" ? (
            <InfoCard title="Cost breakdown">
              <ul>
                {plan.investmentBreakdown.map((line) => (
                  <li
                    key={line.item}
                    className="flex justify-between border-b border-[#eee] py-3 text-sm"
                  >
                    <span className="text-[#4a4d55]">{line.item}</span>
                    <span className="font-semibold">€{formatCurrency(line.amount)}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          ) : null}

          {activeNav === "assumptions" ? (
            <InfoCard title="Assumptions">
              <ul>
                {plan.assumptionsList.map((assumption) => (
                  <li
                    key={assumption}
                    className="flex gap-3 border-b border-[#eee] py-2.5 text-sm text-[#3a3d44]"
                  >
                    <span className="text-[#c9cacd]">—</span>
                    {assumption}
                  </li>
                ))}
              </ul>
            </InfoCard>
          ) : null}

          <div className="mt-8">
            <ShareBlock plan={plan} />
          </div>
        </div>
      </div>

      <aside className="mr-10 mt-6 hidden h-fit w-[300px] shrink-0 rounded-[20px] border border-[#eee] bg-[#fbfbfc] p-6 xl:block">
        <p className="mb-1.5 text-[11px] font-bold tracking-wide text-[#9a9ca3]">
          CUSTOMISE YOUR PLAN
        </p>
        <h2 className="mb-4 text-base font-bold">Optional additions</h2>

        <ul>
          {(plan.optionalAdditions ?? []).map((addition) => {
            const checked = !!additions[addition.label];
            return (
              <li key={addition.label}>
                <button
                  type="button"
                  onClick={() => onToggleAddition(addition.label)}
                  className="flex w-full cursor-pointer items-center justify-between border-b border-[#eee] py-3"
                >
                  <span className="flex items-center gap-2.5 text-sm">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border-[1.5px] text-[11px]",
                        checked
                          ? "border-[#111318] bg-[#111318] text-white"
                          : "border-[#dcdde0] bg-white",
                      )}
                    >
                      {checked ? "✓" : null}
                    </span>
                    {addition.label}
                  </span>
                  <span className="text-[13px] text-[#6b6e76]">
                    + €{formatCurrency(addition.price)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 rounded-[14px] bg-[#111318] p-5 text-white">
          <p className="mb-2 text-[11px] tracking-wide text-[#9a9ca3]">
            ESTIMATED INVESTMENT
          </p>
          <p className="mb-2.5 text-[28px] font-extrabold">€{formatCurrency(total)}</p>
          <p className="text-xs text-[#c9cacd]">excl. VAT</p>
        </div>

        <button
          type="button"
          className="mt-4 w-full cursor-pointer rounded-[10px] bg-[#111318] py-3.5 text-center text-sm font-semibold text-white"
        >
          Discuss plan with a researcher
        </button>
        <button
          type="button"
          onClick={onBackToChat}
          className="mt-3.5 w-full cursor-pointer text-center text-xs text-[#6b6e76]"
        >
          Back to conversation
        </button>
        <p className="mt-3.5 text-[11px] leading-relaxed text-[#b3b5bb]">
          Indicative plan and price. We&apos;ll confirm feasibility and final costs before
          starting.
        </p>
      </aside>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-2xl bg-[#fafafa] p-6">
      <h3 className="mb-2 text-[15px] font-bold">{title}</h3>
      <div className="text-sm leading-relaxed text-[#4a4d55]">{children}</div>
    </div>
  );
}

function StudyDesignRows({
  design,
}: {
  design: ResearchPlan["studyDesign"];
}) {
  const rows = [
    ["Exposed group", design.groupADetail],
    ["Non-exposed group", design.groupBDetail],
    ["Measures", design.measures],
    ["Analysis", design.analysis],
  ] as const;

  return (
    <ul>
      {rows.map(([label, value], index) => (
        <li
          key={label}
          className={cn(
            "flex justify-between py-2.5 text-sm",
            index < rows.length - 1 ? "border-b border-[#eee]" : "",
          )}
        >
          <span className="text-[#6b6e76]">{label}</span>
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

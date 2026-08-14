"use client";

import { NAV_ITEMS } from "@/lib/planner/constants";
import { buildSection, formatCurrency } from "@/lib/planner/sections";
import type { NavSectionId, ResearchPlan } from "@/lib/planner/types";
import { sectionProgress, NAV_ORDER } from "@/lib/planner/partialPlan";
import { cn } from "@/lib/utils";

interface BuildingPlanScreenProps {
  partial: Partial<ResearchPlan>;
  activeNav: NavSectionId;
  onSelectNav: (id: NavSectionId) => void;
}

/**
 * Toont het plan terwijl het binnenkomt: tabs lichten één voor één op
 * naarmate hun data is gestreamed door de account manager.
 */
export function BuildingPlanScreen({
  partial,
  activeNav,
  onSelectNav,
}: BuildingPlanScreenProps) {
  const ready = sectionProgress(partial);
  const readyCount = NAV_ORDER.filter((id) => ready[id]).length;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <nav className="w-[220px] shrink-0 py-8 pl-10">
        <div className="mb-1 text-sm font-bold">Your research plan</div>
        <p className="mb-5 text-xs text-[#9a9ca3]">
          Building… {readyCount}/{NAV_ORDER.length}
        </p>
        <ul>
          {NAV_ITEMS.map((item) => {
            const done = ready[item.id];
            const active = item.id === activeNav;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectNav(item.id)}
                  className={cn(
                    "mb-0.5 flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-left text-sm",
                    active ? "bg-[#eef2ff] font-semibold text-[#111318]" : "text-[#4a4d55]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px] border text-[10px]",
                      done
                        ? "border-[#111318] bg-[#111318] text-white"
                        : "border-[#dcdde0] bg-white",
                    )}
                  >
                    {done ? "✓" : ""}
                  </span>
                  {item.label}
                  {!done ? (
                    <span className="ml-auto h-3 w-3 animate-spin rounded-full border border-[#dcdde0] border-t-[#9a9ca3]" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-[720px]">
          <p className="mb-2.5 text-xs font-bold tracking-widest text-[#9a9ca3]">
            RESEARCH PLAN · BUILDING
          </p>
          <SectionBody partial={partial} id={activeNav} />
        </div>
      </div>

      <aside className="mr-10 mt-6 h-fit w-[300px] shrink-0 rounded-[20px] border border-[#eee] bg-[#fbfbfc] p-6">
        <p className="mb-1.5 text-[11px] font-bold tracking-wide text-[#9a9ca3]">
          ESTIMATED INVESTMENT
        </p>
        <p className="text-[28px] font-extrabold">
          {typeof partial.estimatedInvestment === "number"
            ? `€${formatCurrency(partial.estimatedInvestment)}`
            : "…"}
        </p>
        <p className="mt-2 text-xs text-[#b3b5bb]">excl. VAT</p>
      </aside>
    </div>
  );
}

function SectionBody({
  partial,
  id,
}: {
  partial: Partial<ResearchPlan>;
  id: NavSectionId;
}) {
  const section = buildSection(partial as ResearchPlan, id);

  if (id === "investment") {
    return (
      <LoadingOrDone ready={Boolean(partial.investmentBreakdown?.length) || typeof partial.estimatedInvestment === "number"}>
        <h1 className="mb-3.5 text-[32px] font-extrabold">{section.title}</h1>
        <p className="mb-4 text-base leading-relaxed text-[#4a4d55]">{section.intro}</p>
      </LoadingOrDone>
    );
  }

  return (
    <LoadingOrDone ready={Boolean(section.title)}>
      <h1 className="mb-3.5 text-[32px] font-extrabold">{section.title}</h1>
      <p className="mb-4 text-base leading-relaxed text-[#4a4d55]">{section.intro}</p>
    </LoadingOrDone>
  );
}

function LoadingOrDone({
  ready,
  children,
}: {
  ready: boolean;
  children: React.ReactNode;
}) {
  if (!ready) {
    return (
      <div className="mt-10 flex items-center gap-3 text-[#9a9ca3]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#e2e3e6] border-t-[#9a9ca3]" />
        <span className="text-sm">Account manager is working on this section…</span>
      </div>
    );
  }
  return <div>{children}</div>;
}

"use client";

import { cn } from "@/lib/utils";

interface PlannerHeaderProps {
  onReset: () => void;
}

export function PlannerHeader({ onReset }: PlannerHeaderProps) {
  return (
    <header className="relative z-5 flex h-16 items-center justify-between px-10">
      <div className="text-[15px] font-bold tracking-wide">QARE 360°</div>
      <div className="text-sm text-[#4a4d55]">Research Planner</div>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={onReset}
          className="flex cursor-pointer items-center gap-1.5 text-[13px] text-[#6b6e76]"
        >
          <span>↻</span>
          <span>Reset</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex cursor-pointer items-center gap-1.5 text-[13px] text-[#6b6e76]"
        >
          <span>✕</span>
          <span>Close</span>
        </button>
      </div>
    </header>
  );
}

interface ModeTabsProps {
  mode: "know" | "decide";
  onSelectKnow: () => void;
  onSelectDecide: () => void;
}

export function ModeTabs({ mode, onSelectKnow, onSelectDecide }: ModeTabsProps) {
  return (
    <div className="mt-10 flex gap-0.5 rounded-full bg-[#f4f4f5] p-1">
      <button
        type="button"
        onClick={onSelectDecide}
        className={cn(
          "cursor-pointer rounded-full px-5 py-2.5 text-sm",
          mode === "decide" ? "bg-[#111318] text-white" : "text-[#9a9ca3]",
        )}
      >
        Help Me Decide
      </button>
      <button
        type="button"
        onClick={onSelectKnow}
        className={cn(
          "cursor-pointer rounded-full px-5 py-2.5 text-sm",
          mode === "know" ? "bg-[#111318] text-white" : "text-[#9a9ca3]",
        )}
      >
        I Know What I Need
      </button>
    </div>
  );
}

interface ChecklistPanelProps {
  checkedCount: number;
  className?: string;
}

export function ChecklistPanel({ checkedCount, className }: ChecklistPanelProps) {
  const labels = [
    "Research objective",
    "Research questions",
    "Audience & sample",
    "Recruitment",
    "Measures",
    "Deliverables",
    "Timeline",
    "Investment",
    "Assumptions",
  ];

  return (
    <aside
      className={cn(
        "h-fit rounded-[20px] border border-[#eee] bg-white p-6 shadow-[0_10px_30px_rgba(20,30,60,0.04)]",
        className,
      )}
    >
      <div className="mb-4 text-sm font-bold">Your research plan</div>
      <ul className="space-y-0">
        {labels.map((label, index) => {
          const checked = index < checkedCount;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2.5 py-2 text-sm",
                checked ? "text-[#111318]" : "text-[#b3b5bb]",
              )}
            >
              <span
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-xs",
                  checked
                    ? "border-[#111318] bg-[#111318] text-white"
                    : "border-[#dcdde0] bg-white",
                )}
              >
                {checked ? "✓" : null}
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  examples: readonly string[];
  onPickExample: (label: string) => void;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  examples,
  onPickExample,
}: PromptInputProps) {
  return (
    <div className="flex w-full max-w-[760px] flex-col items-center gap-3.5">
      <div className="flex flex-wrap items-center justify-center gap-2 text-[13px] text-[#9a9ca3]">
        <span>For example:</span>
        {examples.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onPickExample(label)}
            className="cursor-pointer rounded-full border border-[#e6e7e9] px-4 py-2 text-[#4a4d55]"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex w-full items-center gap-3 rounded-full border border-[#ececee] bg-white px-2.5 py-2 pl-5 shadow-[0_10px_30px_rgba(20,30,60,0.06)]">
        <span className="text-lg text-[#9a9ca3]">+</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
          placeholder="Describe what you're trying to understand..."
          className="flex-1 border-none bg-transparent text-[15px] text-[#111318] outline-none"
        />
        <MicIcon />
        <button
          type="button"
          onClick={onSubmit}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#111318] text-white"
          aria-label="Submit"
        >
          ↑
        </button>
      </div>

      <p className="text-[11px] text-[#b3b5bb]">
        The Research Planner can make mistakes. All recommendations and prices are indicative.
      </p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="opacity-55" aria-hidden>
      <rect
        x="6"
        y="1"
        width="6"
        height="10"
        rx="3"
        fill="none"
        stroke="#111318"
        strokeWidth="1.3"
      />
      <path
        d="M3 9a6 6 0 0012 0M9 15v2"
        stroke="#111318"
        strokeWidth="1.3"
        fill="none"
      />
    </svg>
  );
}

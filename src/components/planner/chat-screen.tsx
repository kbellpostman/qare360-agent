"use client";

import { EXAMPLES } from "@/lib/planner/constants";
import type { ResearchPlan } from "@/lib/planner/types";
import { ChecklistPanel, PromptInput } from "@/components/planner/planner-ui";

interface ChatScreenProps {
  userPrompt: string;
  plan: ResearchPlan | null;
  checkedCount: number;
  apiDone: boolean;
  error: string | null;
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onPickExample: (label: string) => void;
  onOpenPlan: () => void;
}

export function ChatScreen({
  userPrompt,
  plan,
  checkedCount,
  apiDone,
  error,
  inputText,
  onInputChange,
  onSubmit,
  onPickExample,
  onOpenPlan,
}: ChatScreenProps) {
  const isThinking = !apiDone && !error;
  const isReady = apiDone && !!plan && !error;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto mt-15 max-w-[640px] px-5 text-center">
          <p className="text-[17px] leading-relaxed text-[#9a9ca3]">{userPrompt}</p>
        </div>

        <div className="mx-auto mt-12 max-w-[640px] px-5">
          {plan?.summary ? (
            <div>
              <h2 className="mb-3.5 text-[17px] font-bold">
                Here&apos;s a short summary based on your input
              </h2>
              <p className="text-base leading-relaxed text-[#3a3d44]">{plan.summary}</p>
            </div>
          ) : null}

          {isThinking ? (
            <p className="mt-7 text-[15px] text-[#b3b5bb]">
              Research assistant is thinking
              <ThinkingDots />
            </p>
          ) : null}

          {isReady ? (
            <div className="mt-7">
              <h2 className="mb-3.5 text-[17px] font-bold">Your research plan is ready</h2>
              <p className="mb-5 text-base leading-relaxed text-[#3a3d44]">
                {plan.recommendationDescription}
              </p>
              <button
                type="button"
                onClick={onOpenPlan}
                className="cursor-pointer rounded-[10px] bg-[#111318] px-6 py-3.5 text-sm font-semibold text-white"
              >
                View research plan
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="mt-6 text-sm text-[#b3402f]">{error}</p>
          ) : null}
        </div>

        <div className="absolute bottom-16 left-1/2 w-[90vw] max-w-[640px] -translate-x-1/2">
          <PromptInput
            value={inputText}
            onChange={onInputChange}
            onSubmit={onSubmit}
            examples={EXAMPLES}
            onPickExample={onPickExample}
          />
        </div>
      </div>

      <ChecklistPanel checkedCount={checkedCount} className="mr-10 mt-6 w-[280px] shrink-0" />
    </div>
  );
}

function ThinkingDots() {
  return (
    <>
      <span className="inline-block animate-[qrp-pulse_1.4s_infinite]">.</span>
      <span className="inline-block animate-[qrp-pulse_1.4s_infinite_0.2s]">.</span>
      <span className="inline-block animate-[qrp-pulse_1.4s_infinite_0.4s]">.</span>
    </>
  );
}

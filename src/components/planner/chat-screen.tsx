"use client";

import { EXAMPLES } from "@/lib/planner/constants";
import type { ResearchPlan } from "@/lib/planner/types";
import { ChecklistPanel, PromptInput } from "@/components/planner/planner-ui";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface ChatScreenProps {
  messages: ChatMessage[];
  plan: ResearchPlan | null;
  isThinking: boolean;
  error: string | null;
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onPickExample: (label: string) => void;
  onOpenPlan: () => void;
}

export function ChatScreen({
  messages,
  plan,
  isThinking,
  error,
  inputText,
  onInputChange,
  onSubmit,
  onPickExample,
  onOpenPlan,
}: ChatScreenProps) {
  const isReady = !!plan && !isThinking && !error;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto mt-10 max-w-[640px] px-5 pb-44">
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div key={i} className={`mb-5 flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-left text-[15px] leading-relaxed ${
                    isUser ? "bg-[#111318] text-white" : "bg-[#f2f3f5] text-[#3a3d44]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isThinking ? (
            <div className="mb-5 flex justify-start">
              <div className="rounded-2xl bg-[#f2f3f5] px-4 py-3 text-[15px] text-[#9a9ca3]">
                Account manager is typing
                <ThinkingDots />
              </div>
            </div>
          ) : null}

          {isReady ? (
            <div className="mt-7 rounded-2xl border border-[#e6e7ea] p-5">
              <h2 className="mb-2 text-[17px] font-bold">Your research plan is ready</h2>
              <p className="mb-4 text-base leading-relaxed text-[#3a3d44]">
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

          {error ? <p className="mt-6 text-sm text-[#b3402f]">{error}</p> : null}
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

      <ChecklistPanel checkedCount={plan ? 9 : 0} className="mr-10 mt-6 w-[280px] shrink-0" />
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
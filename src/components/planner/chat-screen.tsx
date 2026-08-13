"use client";

import { useEffect, useRef } from "react";
import { EXAMPLES } from "@/lib/planner/constants";
import type { ResearchPlan } from "@/lib/planner/types";
import { ChecklistPanel, PromptInput } from "@/components/planner/planner-ui";
import {
  computeChecklistProgress,
  progressToChecks,
} from "@/lib/planner/progress";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface ChatScreenProps {
  messages: ChatMessage[];
  plan: ResearchPlan | null;
  suggestions: string[];
  progress: Record<string, boolean> | null;
  isThinking: boolean;
  error: string | null;
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onPickSuggestion: (suggestion: string) => void;
  onPickExample: (label: string) => void;
  onOpenPlan: () => void;
}

export function ChatScreen({
  messages,
  plan,
  suggestions,
  progress,
  isThinking,
  error,
  inputText,
  onInputChange,
  onSubmit,
  onPickSuggestion,
  onPickExample,
  onOpenPlan,
}: ChatScreenProps) {
  const lastMsg = messages[messages.length - 1];
  const isStreaming = isThinking && lastMsg && lastMsg.role === "assistant" && lastMsg.content.length > 0;
  const showThinking = isThinking && !isStreaming;
  const isReady = !!plan && !isThinking && !error;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Progressieve checklist: de account manager levert het progress-object aan.
  // Prioriteit: plan klaar (alles ✓) > account manager progress > heuristiek.
  const checklistChecks = plan
    ? [true, true, true, true, true, true, true, true, true]
    : progress
    ? progressToChecks(progress)
    : computeChecklistProgress(messages);

  // Auto-scroll naar beneden als er nieuwe berichten bijkomen.
  // if: de container heeft alleen overflow zodra de inhoud hoger is dan het
  // scherm — dus bij weinig berichten blijft het boven uitgelijnd ("eerst
  // vullen"), en pas daarna scrollt hij automatisch mee (zoals ChatGPT).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, isThinking, isReady]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto mt-10 max-w-[640px] px-5 pb-8">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`mb-5 flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-left text-[15px] leading-relaxed ${
                      isUser ? "bg-[#111318] text-white" : "bg-[#f2f3f5] text-[#3a3d44]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {showThinking ? (
              <div className="mb-5 flex justify-start">
                <div className="rounded-2xl bg-[#f2f3f5] px-4 py-3 text-[15px] text-[#9a9ca3]">
                  Account manager is typing
                  <ThinkingDots />
                </div>
              </div>
            ) : null}

            {!isThinking && !plan && suggestions.length > 0 ? (
                          <div className="mb-5 flex flex-wrap gap-2">
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => onPickSuggestion(suggestion)}
                                className="cursor-pointer rounded-full border border-[#e2e3e6] bg-white px-4 py-2 text-[13px] text-[#26282e] hover:border-[#111318] hover:bg-[#f8f8f9] transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
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
        </div>

        {/* Sticky prompt bar — altijd onderaan zichtbaar */}
        <div className="border-t border-[#eee] bg-white px-4 py-3">
          <div className="mx-auto max-w-[640px]">
            <PromptInput
              value={inputText}
              onChange={onInputChange}
              onSubmit={onSubmit}
              examples={messages.length > 0 ? [] : EXAMPLES}
              onPickExample={onPickExample}
            />
          </div>
        </div>
      </div>

      <ChecklistPanel
        checked={checklistChecks}
        className="mr-10 mt-6 w-[280px] shrink-0"
      />
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
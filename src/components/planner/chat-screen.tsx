"use client";

import { useEffect, useRef, useState } from "react";
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
  explain: { title?: string; text?: string } | null;
  isThinking: boolean;
  error: string | null;
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onPickSuggestion: (suggestion: string) => void;
  onPickExample: (label: string) => void;
  onConfirmGenerate: () => void;
  onOpenPlan: () => void;
}

export function ChatScreen({
  messages,
  plan,
  suggestions,
  progress,
  explain,
  isThinking,
  error,
  inputText,
  onInputChange,
  onSubmit,
  onPickSuggestion,
  onPickExample,
  onConfirmGenerate,
  onOpenPlan,
}: ChatScreenProps) {
  const lastMsg = messages[messages.length - 1];
  const isStreaming = isThinking && lastMsg && lastMsg.role === "assistant" && lastMsg.content.length > 0;
  const showThinking = isThinking && !isStreaming;
  const isReady = !!plan && !isThinking && !error;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Vraagt de account manager om bevestiging om het plan te genereren?
  const askingConfirm =
    !isThinking && !plan && !!lastMsg && lastMsg.role === "assistant" &&
    isConfirmationRequest(lastMsg.content);

  // Progressieve checklist: de account manager levert het progress-object aan.
  // Prioriteit: plan klaar (alles ✓) > account manager progress > heuristiek.
  const checklistChecks = plan
    ? [true, true, true, true, true, true, true, true, true]
    : progress
    ? progressToChecks(progress)
    : computeChecklistProgress(messages);

  const rail = (
    <>
      {explain && (explain.title || explain.text) ? (
        <ExplainPanel
          explain={explain}
          defaultOpen={wantsExplanation(messages)}
        />
      ) : null}
      <ChecklistPanel checked={checklistChecks} />
    </>
  );

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
                  <RotatingStatus />
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

            {askingConfirm ? (
              <div className="mb-6 mt-3 flex justify-start">
                <button
                  type="button"
                  onClick={onConfirmGenerate}
                  className="cursor-pointer rounded-[12px] bg-[#111318] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Generate proposal →
                </button>
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

      {/* Desktop: zijbalk naast de chat */}
      <div className="mr-10 mt-6 hidden w-[280px] shrink-0 flex-col gap-4 lg:flex">
        {rail}
      </div>

      {/* Mobiel: zwevend knopje opent de zijbalk als drawer */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex cursor-pointer items-center gap-1.5 rounded-full bg-[#111318] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg lg:hidden"
      >
        Checklist
      </button>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-[290px] overflow-y-auto bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold">Your research plan</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="cursor-pointer rounded-md px-2 py-1 text-sm text-neutral-500 hover:text-neutral-800"
              >
                ✕
              </button>
            </div>
            {rail}
          </div>
        </div>
      ) : null}
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

// Vraagt de account manager om bevestiging om het voorstel te genereren?
function isConfirmationRequest(text: string): boolean {
  const lowered = text.toLowerCase();
  return (
    /(generate|generat|build|maak|genereer|genereren)/.test(lowered) &&
    /\?$/.test(text.trim())
  );
}

const STATUS_MESSAGES = [
  "Account manager is reading your brief…",
  "Thinking through the best approach…",
  "Formulating the research questions…",
  "Drafting the research plan…",
];

function RotatingStatus() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <span key={index} className="inline-block animate-[qrp-fade_0.6s_ease]">
        {STATUS_MESSAGES[index]}
      </span>
      <ThinkingDots />
    </>
  );
}

// Adaptief: als de klant ergens om uitleg of toelichting vroeg, laat dan meer zien.
function wantsExplanation(messages: ChatMessage[]): boolean {
  return messages.some((m) =>
    m.role === "user" &&
    /uitleg|betekent|betekenen|hoe werkt|wat betekent|begrijp (het )?niet|help me|help mij|kan je (dat )?uitlegg/i.test(m.content)
  );
}

function ExplainPanel({
  explain,
  defaultOpen,
}: {
  explain: { title?: string; text?: string };
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const title = explain.title || "Waarom deze vraag?";

  return (
    <div className="rounded-2xl border border-[#eef0f6] bg-[#fafbff] p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className="text-[13px] font-semibold text-[#5b5f6b]">
          💡 {title}
        </span>
        <span className="text-[11px] text-[#9a9ca3]">{open ? "−" : "+"}</span>
      </button>
      {open && explain.text ? (
        <p className="mt-2 border-t border-[#eef0f6] pt-2 text-[12px] leading-relaxed text-[#6b6e76]">
          {explain.text}
        </p>
      ) : null}
    </div>
  );
}
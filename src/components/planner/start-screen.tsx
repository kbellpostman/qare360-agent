"use client";

import { DECIDE_STEPS, EXAMPLES } from "@/lib/planner/constants";
import { ModeTabs, PromptInput } from "@/components/planner/planner-ui";

interface StartScreenProps {
  mode: "know" | "decide";
  decideStep: number;
  inputText: string;
  onModeDecide: () => void;
  onModeKnow: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onPickExample: (label: string) => void;
  onPickDecideOption: (label: string) => void;
}

export function StartScreen({
  mode,
  decideStep,
  inputText,
  onModeDecide,
  onModeKnow,
  onInputChange,
  onSubmit,
  onPickExample,
  onPickDecideOption,
}: StartScreenProps) {
  const decideStepData = DECIDE_STEPS[decideStep] ?? DECIDE_STEPS[0];

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-col items-center">
      <ModeTabs mode={mode} onSelectDecide={onModeDecide} onSelectKnow={onModeKnow} />

      {mode === "know" ? (
        <div className="mt-16 max-w-[640px] px-5 text-center">
          <h1 className="mb-3.5 text-[32px] font-bold">
            What would you like to find out?
          </h1>
          <p className="text-base leading-relaxed text-[#5b5e66]">
            Tell us what you&apos;re working on. We&apos;ll help you shape the right
            research approach, timeline and cost indication.
          </p>
        </div>
      ) : (
        <div className="mt-16 max-w-[640px] px-5 text-center">
          <h2 className="mb-7 text-[26px] font-bold">{decideStepData.text}</h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {decideStepData.options.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => onPickDecideOption(label)}
                className="cursor-pointer rounded-full border border-[#e2e3e6] bg-white px-5 py-3 text-sm text-[#26282e] hover:border-[#111318]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "know" ? (
        <div className="absolute bottom-9 left-1/2 w-[90vw] max-w-[760px] -translate-x-1/2">
          <PromptInput
            value={inputText}
            onChange={onInputChange}
            onSubmit={onSubmit}
            examples={EXAMPLES}
            onPickExample={onPickExample}
          />
        </div>
      ) : null}
    </div>
  );
}

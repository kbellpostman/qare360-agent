"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatScreen } from "@/components/planner/chat-screen";
import { PlanScreen } from "@/components/planner/plan-screen";
import { PlannerHeader } from "@/components/planner/planner-ui";
import { StartScreen } from "@/components/planner/start-screen";
import type {
  DecideAnswers,
  NavSectionId,
  PlannerMode,
  PlannerScreen,
  ResearchPlan,
} from "@/lib/planner/types";

const INITIAL_STATE = {
  mode: "know" as PlannerMode,
  screen: "start" as PlannerScreen,
  inputText: "",
  decideStep: 0,
  decideAnswers: {} as DecideAnswers,
  userPrompt: "",
  plan: null as ResearchPlan | null,
  checkedCount: 0,
  apiDone: false,
  error: null as string | null,
  activeNav: "recommendation" as NavSectionId,
  additions: {} as Record<string, boolean>,
};

export function ResearchPlanner() {
  const [state, setState] = useState(INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearProgressInterval, [clearProgressInterval]);

  const reset = () => {
    clearProgressInterval();
    setState(INITIAL_STATE);
  };

  const generatePlan = async (prompt: string) => {
    setState((current) => ({
      ...current,
      screen: "chat",
      userPrompt: prompt,
      inputText: "",
      checkedCount: 0,
      apiDone: false,
      plan: null,
      error: null,
    }));

    clearProgressInterval();
    intervalRef.current = setInterval(() => {
      setState((current) =>
        current.checkedCount < 9
          ? { ...current, checkedCount: current.checkedCount + 1 }
          : current,
      );
    }, 380);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as { plan?: ResearchPlan; error?: string };

      if (!response.ok || !data.plan) {
        throw new Error(data.error ?? "Something went wrong generating your plan.");
      }

      setState((current) => ({
        ...current,
        plan: data.plan ?? null,
        apiDone: true,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong generating your plan. Please try again.",
        apiDone: true,
        checkedCount: 9,
      }));
    }
  };

  const submit = (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? state.inputText).trim();
    if (!prompt) return;
    void generatePlan(prompt);
  };

  const pickDecideOption = (label: string) => {
    const keys = ["goal", "audience", "timing"] as const;
    const key = keys[state.decideStep];
    const answers = { ...state.decideAnswers, [key]: label };

    if (state.decideStep < 2) {
      setState((current) => ({
        ...current,
        decideAnswers: answers,
        decideStep: current.decideStep + 1,
      }));
      return;
    }

    const prompt = `Goal: ${answers.goal}. Audience: ${answers.audience}. Timeline needed: ${label}.`;
    setState((current) => ({ ...current, decideAnswers: answers }));
    void generatePlan(prompt);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(600px_300px_at_50%_100%,rgba(120,170,255,0.10),rgba(120,170,255,0)_70%)] text-[#111318]">
      <PlannerHeader onReset={reset} />

      {state.screen === "start" ? (
        <StartScreen
          mode={state.mode}
          decideStep={state.decideStep}
          inputText={state.inputText}
          onModeDecide={() =>
            setState((current) => ({
              ...current,
              mode: "decide",
              decideStep: 0,
              decideAnswers: {},
            }))
          }
          onModeKnow={() => setState((current) => ({ ...current, mode: "know" }))}
          onInputChange={(value) => setState((current) => ({ ...current, inputText: value }))}
          onSubmit={() => submit()}
          onPickExample={(label) => setState((current) => ({ ...current, inputText: label }))}
          onPickDecideOption={pickDecideOption}
        />
      ) : null}

      {state.screen === "chat" ? (
        <ChatScreen
          userPrompt={state.userPrompt}
          plan={state.plan}
          checkedCount={state.checkedCount}
          apiDone={state.apiDone}
          error={state.error}
          inputText={state.inputText}
          onInputChange={(value) => setState((current) => ({ ...current, inputText: value }))}
          onSubmit={() => submit()}
          onPickExample={(label) => setState((current) => ({ ...current, inputText: label }))}
          onOpenPlan={() =>
            setState((current) => ({
              ...current,
              screen: "plan",
              activeNav: "recommendation",
            }))
          }
        />
      ) : null}

      {state.screen === "plan" && state.plan ? (
        <PlanScreen
          plan={state.plan}
          activeNav={state.activeNav}
          additions={state.additions}
          onSelectNav={(id) => setState((current) => ({ ...current, activeNav: id }))}
          onToggleAddition={(label) =>
            setState((current) => ({
              ...current,
              additions: { ...current.additions, [label]: !current.additions[label] },
            }))
          }
          onBackToChat={() => setState((current) => ({ ...current, screen: "chat" }))}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
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

type ChatMessage = { role: "user" | "assistant"; content: string };

const INITIAL_STATE = {
  mode: "know" as PlannerMode,
  screen: "start" as PlannerScreen,
  inputText: "",
  decideStep: 0,
  decideAnswers: {} as DecideAnswers,
  messages: [] as ChatMessage[],
  plan: null as ResearchPlan | null,
  isThinking: false,
  error: null as string | null,
  activeNav: "recommendation" as NavSectionId,
  additions: {} as Record<string, boolean>,
};

export function ResearchPlanner() {
  const [state, setState] = useState(INITIAL_STATE);

  const reset = () => setState(INITIAL_STATE);

  const sendMessage = async (text: string) => {
    const messages: ChatMessage[] = [...state.messages, { role: "user", content: text }];

    setState((current) => ({
      ...current,
      screen: "chat",
      messages,
      inputText: "",
      isThinking: true,
      error: null,
      plan: null,
    }));

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = (await response.json()) as {
        plan?: ResearchPlan;
        reply?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      if (data.plan) {
        setState((current) => ({
          ...current,
          plan: data.plan ?? null,
          isThinking: false,
        }));
        return;
      }

      if (data.reply) {
        setState((current) => ({
          ...current,
          messages: [...current.messages, { role: "assistant", content: data.reply ?? "" }],
          isThinking: false,
        }));
        return;
      }

      throw new Error("No plan or reply received.");
    } catch (error) {
      setState((current) => ({
        ...current,
        isThinking: false,
        error: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      }));
    }
  };

  const submit = (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? state.inputText).trim();
    if (!prompt) return;
    void sendMessage(prompt);
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
    void sendMessage(prompt);
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
          messages={state.messages}
          plan={state.plan}
          isThinking={state.isThinking}
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
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
  suggestions: [] as string[],
  progress: null as Record<string, boolean> | null,
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
    const messages: ChatMessage[] = [
      ...state.messages,
      { role: "user" as const, content: text },
      { role: "assistant" as const, content: "" },
    ];

    setState((current) => ({
      ...current,
      screen: "chat",
      messages,
      inputText: "",
      suggestions: [],
      isThinking: true,
      error: null,
      plan: null,
    }));

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(0, -1) }), // don't send empty assistant
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          (errorData as { error?: string })?.error ?? `HTTP ${response.status}`,
        );
      }

      // Streaming response
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as {
                delta?: string;
                done?: boolean;
                reply?: string;
                suggestions?: string[];
                progress?: Record<string, boolean> | null;
                plan?: ResearchPlan;
                error?: string;
              };

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.plan) {
                setState((current) => ({
                  ...current,
                  plan: parsed.plan!,
                  isThinking: false,
                }));
                return;
              }

              if (parsed.delta) {
                fullText += parsed.delta;
                // Update last assistant message
                setState((current) => {
                  const msgs = [...current.messages];
                  msgs[msgs.length - 1] = {
                    role: "assistant",
                    content: fullText,
                  };
                  return { ...current, messages: msgs, isThinking: true };
                });
              }

              if (parsed.done) {
                setState((current) => {
                  const msgs = [...current.messages];
                  msgs[msgs.length - 1] = {
                    role: "assistant",
                    content: parsed.reply ?? fullText,
                  };
                  return {
                    ...current,
                    messages: msgs,
                    suggestions: parsed.suggestions ?? [],
                    progress: parsed.progress ?? current.progress,
                    isThinking: false,
                  };
                });
                return;
              }
            } catch (parseError) {
              // skip unparseable chunks
              if (parseError instanceof Error && parseError.message !== "skip") {
                throw parseError;
              }
            }
          }
        }
      } else {
        // Non-streaming fallback
        const data = (await response.json()) as {
          plan?: ResearchPlan;
          reply?: string;
          suggestions?: string[];
          progress?: Record<string, boolean> | null;
          error?: string;
        };

        if (data.plan) {
          setState((current) => ({
            ...current,
            plan: data.plan!,
            isThinking: false,
          }));
          return;
        }

        if (data.reply) {
          setState((current) => ({
            ...current,
            messages: [
              ...current.messages.slice(0, -1),
              { role: "assistant", content: data.reply! },
            ],
            suggestions: data.suggestions ?? [],
            progress: data.progress ?? current.progress,
            isThinking: false,
          }));
          return;
        }

        throw new Error("No plan or reply received.");
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        isThinking: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      }));
    }
  };

  const submit = (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? state.inputText).trim();
    if (!prompt) return;
    // Clear suggestions when user sends a message
    setState((current) => ({ ...current, suggestions: [] }));
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
          onPickExample={(label) => {
            setState((current) => ({ ...current, inputText: label }));
            void sendMessage(label);
          }}
          onPickDecideOption={pickDecideOption}
        />
      ) : null}

      {state.screen === "chat" ? (
        <ChatScreen
          messages={state.messages}
          plan={state.plan}
          suggestions={state.suggestions}
          progress={state.progress}
          isThinking={state.isThinking}
          error={state.error}
          inputText={state.inputText}
          onInputChange={(value) => setState((current) => ({ ...current, inputText: value }))}
          onSubmit={() => submit()}
          onPickSuggestion={(suggestion) => submit(suggestion)}
          onPickExample={(label) => {
            setState((current) => ({ ...current, inputText: label }));
            void sendMessage(label);
          }}
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
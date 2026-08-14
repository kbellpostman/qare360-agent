"use client";

import { useState } from "react";
import { Check, Copy, Link2, Mail } from "lucide-react";
import type { ResearchPlan } from "@/lib/planner/types";

export function ShareBlock({ plan }: { plan: ResearchPlan }) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function generate(hint?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: hint }),
      });
      const data = (await res.json()) as { url?: string; emailed?: boolean; error?: string };
      if (data.url) setLink(data.url);
    } catch {
      /* negeer */
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail() {
    const target = email.trim();
    if (busyAction) return;
    setBusyAction("email");
    setShowEmail(true);
    if (!target) {
      setBusyAction(null);
      return;
    }
    await generate(target);
    setEmailSent(true);
    setBusyAction(null);
  }

  async function handleCopy() {
    if (busyAction) return;
    setBusyAction("copy");
    if (!link) await generate();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* negeer */
      }
    }
    setBusyAction(null);
  }

  return (
    <div className="rounded-2xl border border-[#eee] bg-white p-5">
      <div className="mb-1 flex items-center gap-2 text-sm font-bold">
        <Link2 className="h-4 w-4 text-[#9a9ca3]" />
        Delen of bewaren
      </div>
      <p className="mb-4 text-[13px] text-[#9a9ca3]">
        Stuur dit voorstel door of kom er later op terug. Deelbare links zijn
        read-only.
      </p>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={handleEmail}
          disabled={loading || !!busyAction}
          className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#111318] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          <Mail className="h-4 w-4" /> E-mail naar mezelf
        </button>
        <button
          type="button"
          onClick={() => {
            setShowEmail(false);
            void generate();
          }}
          disabled={loading || !!busyAction}
          className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e2e3e6] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#26282e] disabled:opacity-60"
        >
          <Link2 className="h-4 w-4" /> Deelbare link genereren
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={loading || !!busyAction}
          className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e2e3e6] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#26282e] disabled:opacity-60"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Gekopieerd!" : "Kopieer link"}
        </button>
      </div>

      {showEmail ? (
        <div className="mt-4 flex items-center gap-2">
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailSent(false);
            }}
            placeholder="jouw@email.nl"
            className="w-64 rounded-[10px] border border-[#e2e3e6] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#9a9ca3]"
          />
          <button
            type="button"
            onClick={() => {
              if (!email.trim()) return;
              void handleEmail();
            }}
            disabled={loading || !email.trim()}
            className="cursor-pointer rounded-[10px] bg-[#111318] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            Verstuur
          </button>
        </div>
      ) : null}

      {emailSent ? (
        <p className="mt-3 text-[13px] font-medium text-emerald-600">
          ✓ E-mail verstuurd. Check je inbox.
        </p>
      ) : null}

      {link ? (
        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-[#eee] bg-[#fafafa] px-3 py-2">
          <span className="flex-1 truncate text-[12px] text-[#6b6e76]">{link}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 cursor-pointer text-[12px] font-semibold text-[#111318] hover:underline"
          >
            {copied ? "Gekopieerd" : "Kopieer"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
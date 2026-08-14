import { notFound } from "next/navigation";
import { getShare } from "@/lib/share";
import { NAV_ITEMS } from "@/lib/planner/constants";
import { buildSection, formatCurrency } from "@/lib/planner/sections";

export const dynamic = "force-dynamic";

export default async function VoorstelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await getShare(token);
  if (!record) notFound();

  const plan = record.plan;
  const total =
    (plan.estimatedInvestment || 0) +
    (plan.optionalAdditions ?? []).reduce((s, a) => s + (a.price || 0), 0);

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-sans text-[#111318]">
      <header className="border-b border-[#eee] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="text-sm font-bold">
            QARE 360° <span className="ml-1 font-normal text-[#9a9ca3]">Research Planner</span>
          </div>
          <div className="text-xs text-[#9a9ca3]">Gedeeld onderzoeksvoorstel</div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#9a9ca3]">
          Research plan
        </p>
        <h1 className="mb-2 text-3xl font-extrabold">{plan.recommendationTitle}</h1>
        <p className="mb-6 text-base leading-relaxed text-[#4a4d55]">
          {plan.recommendationDescription}
        </p>

        {plan.tags?.length ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {plan.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#f2f3f4] px-3.5 py-1.5 text-xs text-[#4a4d55]">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid gap-6">
          {NAV_ITEMS.filter((n) => n.id !== "recommendation").map((item) => {
            const section = buildSection(plan, item.id);
            return (
              <section key={item.id} className="rounded-2xl border border-[#eee] bg-white p-6">
                <h2 className="mb-2 text-lg font-bold">{section.title}</h2>
                <div className="text-sm leading-relaxed text-[#4a4d55]">{section.intro}</div>
              </section>
            );
          })}

          <section className="rounded-2xl border border-[#eee] bg-white p-6">
            <h2 className="mb-3 text-lg font-bold">Investment</h2>
            <p className="mb-4 text-3xl font-extrabold">€{formatCurrency(total)}</p>
            <ul>
              {(plan.investmentBreakdown ?? []).map((line) => (
                <li key={line.item} className="flex justify-between border-b border-[#eee] py-2.5 text-sm">
                  <span className="text-[#4a4d55]">{line.item}</span>
                  <span className="font-semibold">€{formatCurrency(line.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-[#b3b5bb]">
          Indicatief plan en prijs. QARE 360° bevestigt haalbaarheid en definitieve kosten vóór aanvang.
        </p>
      </main>
    </div>
  );
}
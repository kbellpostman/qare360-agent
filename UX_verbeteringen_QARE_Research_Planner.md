# QARE 360° Research Planner — UX- en conversie-verbeteringen

Onderzoeksrapport op basis van code-analyse (`~/workspace/qare360-agent/src/`) + externe best practices.
Datum: aug 2026 · Taal: Nederlands · Geen code gewijzigd.

---

## #1 Huidige flow (kort)

| Fase | Scherm | Component(en) |
|---|---|---|
| 1. Entry | Mode-toggle **"Help Me Decide"** vs **"I Know What I Need"** + tekstveld met voorbeeldchips | `start-screen.tsx`, `planner-ui.tsx` (ModeTabs, PromptInput) |
| 2. Guided options (decide) | 3 stappen-wizard: goal → audience → timing | `start-screen.tsx`, `constants.ts` (DECIDE_STEPS) |
| 3. Conversationeel intake | Meerturnig gesprek; streaming replies; suggestiechips `[CHIPS:]`; roterende status; rechts checklistpaneel (9 items) met voortgang | `chat-screen.tsx`, `planner-ui.tsx` (ChecklistPanel), `progress.ts`, `route.ts` |
| 4. Bevestigingsmoment | Accountmanager vraagt bevestiging → knop **"Generate proposal →"** (heuristiek-gedreven) | `chat-screen.tsx` (isConfirmationRequest) |
| 5. Live bouwen | Voorstel streamt sectie per sectie; linkernav licht per tab op; rechts live investeringsbedrag | `building-plan-screen.tsx`, `partialPlan.ts`, `sections.ts` |
| 6. Plan weergeven | 9-tab weergave + "Customise your plan" (optional additions met prijs) + totaal | `plan-screen.tsx` |
| 7. Opslaan | Voorstel → Notion-database + WhatsApp heads-up naar klant-eigenaar | `route.ts` (storeRequestToNotion) |

Architectuur: Next.js frontend (`research-planner.tsx` als orchestrator, `useState`-state) → `app/api/plan/route.ts` → Hermes OpenAI-compatibele API (`agent.kbpm.nl`, model `qare`) → accountmanager. Streaming via SSE; JSON-plan wordt tolerant ge-parsed met `partialPlan.ts`.

---

## #2 Best practices (met bronnen)

**Conversational AI vs. formulier (conversie-cijfers)**
- Conversational AI-forms converteren ~15–25%, pure chatbots ~10–15%, statische forms slechts ~2–3% (getaiform, 2026). (https://getaiform.com/blog/contact-forms-vs-ai-chatbots-lead-conversion-comparison-2026)
- Conversational engagement-rate 60–75% t.o.v. 15–25% form-drop/rate (globecomtech). (https://globecomtech.ltd/posts/2026-06-14-conversational-ai-replacing-lead-forms/)
- B2B-chatbot-UX-principes specifiek voor lead generation (chatmetrics). (https://www.chatmetrics.com/blog/chatbot-ux-design-principles-for-b2b-lead-generation/)

**Trust-signalen**
- Trust-signalen behalen hetzelfde resultaat als extra kwalificatievelden — maar met significant hogere conversie (capstone). (https://capstonedesigngroup.com/form-friction-fields-to-eliminate-and-which-to-keep/)
- Privacyverklaring, beveiligingsbadges en testimonials naast het formulier verminderen twijfel precies op het beslismoment (emasterlabs). (https://emasterlabs.com/web-form-optimization)

**Abandonment & progress**
- Reduce form-abandonment via: minder velden, mobiel-optimalisatie, trust-signalen, progress bars, conditional logic, duidelijke CTA (googlebytes). (https://googlebytes.com/knowledge-base/form-abandonment/)
- Progressive disclosure (complexiteit alleen tonen wanneer nodig) + skeleton loaders + micro-animaties verlagen waargenomen wachttijd en cognitieve load (saasfactor, riffon). (https://www.saasfactor.co/blogs/why-users-drop-off-during-onboarding-and-how-to-fix-it) (https://riffon.com/insight/ins_1q5ux7em39au)
- Psychologie van wachten: transparante verwachting + engagement verlaagt waargenomen wachttijd (visu). (https://visu.network/blog/psychology-of-waiting-rooms-and-how-to-use-it/)

**Speed-to-lead / follow-up**
- Conversie daalt scherp met langere responsetijd; de steilste daling zit in het eerste uur (artemisgtm, 2026). (https://artemisgtm.ai/resources/research/speed-to-lead-benchmark-2026/)
- De "chat→email gap" van 3–10 minuten kost dagelijks gekwalificeerde leads (activecampaign). (https://www.activecampaign.com/blog/ai-lead-nurture-perfect-moment)
- Auto-follow-up op inactieve/of-verkennende gesprekken is een standaard conversiepatroon (HighLevel). (https://help.gohighlevel.com/support/solutions/articles/155000005500-conversation-ai-auto-follow-up-action)

**Intent & onboarding**
- Lege input = writer's block = hoogste drop-off; een kekke guided start en prompt-voorbeelden verlagen de drempel (department of product — UX of AI assistants). (https://departmentofproduct.substack.com/p/deep-the-ux-of-ai-assistants)
- Nielsen: "intent by discovery" — veel gebruikers weten niet exact wat ze willen; UI moet verkennen ondersteunen i.p.v. één-pad-flow. (https://jakobnielsenphd.substack.com/p/intent-ux)

---

## #3 Verbeterideeën

Geordend van meest naar minst impactvol binnen elke themagroep.

### A. Conversie-reddingslijn — contact & handoff (top-prioriteit)

**A1. Contactgegevens vastleggen (e-mail + telefoon) en aan Notion koppelen**
- Wat: Voeg een contact-capture-moment toe zodra het voorstel klaar is en/of vroeg in de intake ("Waar sturen we het voorstel heen?"): naam, e-mail, optioneel telefoon. Sla deze op als extra Notion-properties (Email, Telefoon, Naam) in `route.ts` (`storeRequestToNotion`).
- Waarom: Nu nergens contactgegevens; enkel klanten die het gesprek afronden worden wél WhatsApp geïnformeerd. Iedereen die halverwege afhaakt is onbekend en onbereikbaar. Conversational AI is juist gemaakt om dit moment laagdrempelig te vangen (getaiform 15–25%). B2B speed-to-lead in het eerste uur is bepalend (artemisgtm).
- Impact: **hoog** · Effort: **medium**
- Past in: `chat-screen.tsx` / `plan-screen.tsx` (nieuw contact-blok), `route.ts`.

**A2. Dode "Discuss plan with a researcher"-knop repareren (bug + verloren conversie)**
- Wat: `plan-screen.tsx`, regel ~256, heeft een `<button>` **zonder onClick**. Koppel deze aan een contact-modal (naam/e-mail/telefoon/bericht) die de accountmanager triggert → Notion + WhatsApp.
- Waarom: Dit is de belangrijkste CTA nádat de waarde (het voorstel) is geleverd — en hij doet niets. Vertrouwen én conversie breken hier samen.
- Impact: **hoog** · Effort: **klein**
- Past in: `plan-screen.tsx`.

**A3. "Stuur voorstel per e-mail / als PDF"**
- Wat: Voeg een knop toe die het plan e-mailt (relatie-template met samenvatting + prijs + CTA naar overleg) of als PDF rendert. Rekwantificeer de 3–10 min chat→email gap (activecampaign).
- Waarom: veel B2B-buyers willen een offerte ontvangen en delen met collega's; zonder capture is er geen follow-up-moment.
- Impact: **hoog** · Effort: **medium–groot** (template + render)
- Past in: `plan-screen.tsx` (nieuw), `route.ts`, evt. email-skill.

### B. Vertrouwen & taal

**B1. UI + systeemprompt volledig Nederlands**
- Wat: Vertaal alle UI-teksten (`start-screen`, `chat-screen`, `building-plan-screen`, `plan-screen`, `planner-ui`, STATUS_MESSAGES) en wijzig `prompt.ts` zodat de accountmanager in het Nederlands antwoordt. De Notion-kolommen zijn al Nederlands ("Onderwerp", "Aanbeveling") — de frontend loopt voorop.
- Waarom: QARE is een Nederlands bureau voor Nederlandse B2B-klanten; Engels verhoogt de cognitieve drempel en vermindert vertrouwen → lagere conversie. (Tip: de toggles "Help Me Decide / I Know What I Need" mag je bewust Engels houden — universeel begrepen patroon.)
- Impact: **hoog** · Effort: **klein**
- Past in: alle planner-components + `lib/planner/prompt.ts`.

**B2. Trust-signalen toevoegen**
- Wat: Logos/referenties, "al X jaar onafhankelijk marktonderzoek", certificering (ESOMAR/IPM), korte privacyverklaring ("wat gebeurt er met je gegevens — alleen gebruikt voor je voorstel"), "gratis & vrijblijvend voorstel", contactgegevens QARE, evt. testimonial. Plaats bij de start én bij contact-capture.
- Waarom: trust-signalen verhogen conversie zonder extra velden (capstone, emasterlabs); bezoekers delen bedrijfsinformatie en moeten 'veilig' voelen.
- Impact: **hoog** · Effort: **klein–medium**
- Past in: `start-screen.tsx`, `planner-ui.tsx`, nieuw contact-blok in `plan-screen.tsx`.

### C. Verwachting & voortgang tijdens het wachten

**C1. ETA + voortgangsbar tijdens het bouwen (BuildingPlanScreen)**
- Wat: Toon een live voortgang ("Sectie 3 van 9 gereed") met progress-bar en een geschatte resttijd ("nog ± 20 sec"). Bevestig per sectie met een 'done'-micro-animatie.
- Waarom: transparante verwachting + engagement verlaagt waargenomen wachttijd (visu); nu is er alleen per-sectie spinner zonder totaalbeeld of ETA.
- Impact: **midden** · Effort: **klein**
- Past in: `building-plan-screen.tsx`.

**C2. Waarde tonen vóór het eindscherm**
- Wat: In de chat-"Your research plan is ready"-banner (`chat-screen.tsx`) de investering + naam tonen en de primaire CTA "Bekijk voorstel" prominenter maken — prijs is de grootste conversietrigger.
- Waarom: het ready-scherm toont nu alleen `recommendationDescription`; de prijs (de sleutel) zit verborgen in het plan.
- Impact: **midden** · Effort: **klein**
- Past in: `chat-screen.tsx`.

### D. Conversatie-veerkracht & herstel

**D1. Sessie-herstel / state-persistentie**
- Wat: Persist chat + plan naar `localStorage`/`sessionStorage` (of een sessie-id + `GET /api/plan/:id`) en herstel bij reload. Zet de flow-positie terug (scherm, actieve tab, verzamelde input).
- Waarom: B2B-buyers breken intake af (vergadering, research) en keren later terug; refresh = alles kwijt = verloren lead. Nu is alle state in-memory `useState`.
- Impact: **midden–hoog** · Effort: **medium–groot** (backendsessie = groter)
- Past in: `research-planner.tsx` (state-hook → persist), nieuw endpoint.

**D2. Reset/Close beschermen + scheiden**
- Wat: `Reset` → bevestigingsmodal ("Weet je zeker dat je opnieuw wilt beginnen?"); `Close` → afsluiten/link terug naar QARE-website, niettemin resetten.
- Waarom: in `planner-ui.tsx` (regels 14–31) doen **beide knoppen exact hetzelfde** en Reset heeft geen undo — een per ongeluk klik wist het hele gesprek.
- Impact: **midden** · Effort: **klein**
- Past in: `planner-ui.tsx`, `research-planner.tsx`.

**D3. Antwoorden bewerken + secties hergenereren**
- Wat: Tijdens intake per verzonden bericht een "aanpassen" (→ opnieuw stellen); in het plan per sectie een "wijzig" die alleen die sectie hergenereert (voer correctie terug naar accountmanager).
- Waarom: gebruikers willen typo's/keuzes corrigeren zonder helemaal opnieuw te starten (projectvraag "wijzigingen/bewerken").
- Impact: **midden** · Effort: **groot**
- Past in: `chat-screen.tsx`, `plan-screen.tsx`, `route.ts` (nieuwe partial-regenerate).

**D4. Fout-afhandeling met retry zonder opnieuw typen**
- Wat: Bij een fout de lege assistant-bubble vervangen door een "Opnieuw proberen"-knop die dezelfde laatste user-prompt hersent; geschiedenis behouden. Nu blijft een lege bubble achter en moet de user zelf opnieuw typen.
- Impact: **midden** · Effort: **klein**
- Past in: `research-planner.tsx` (catch-blok), `chat-screen.tsx`.

### E. Nudging & voltooiing

**E1. Micro-voortgang vieren + zachte nudge**
- Wat: Bij voldoen van een checklist-item een korte positieve bevestiging; bij stilte of een overgeslagen vraag een lichte nudge ("Wil je dat we nu al een voorstel maken? We kunnen het daarna altijd bijstellen.").
- Waarom: gamificatie/nudges reduceren abandonment richting de einde-CTA.
- Impact: **midden** · Effort: **klein**
- Past in: `chat-screen.tsx` (op progress-change), accountmanager-instructie in `prompt.ts`.

**E2. Gestructureerde eerste vraag in plaats van leeg veld (guided default)**
- Wat: Zet de guided "Help Me Decide"-flow als comfortabele standaard (of begin met één gestructureerde vraag à la DECIDE_STEPS vóór het vrije veld), zodat een lege tekstbox niet het startpunt is.
- Waarom: lege input = writer's block = meeste drop-off; guided start + voorbeelden verlagen de drempel (department of product; Nielsen "intent by discovery").
- Impact: **midden–hoog** · Effort: **medium** (piloot op bestaande decide-steps)
- Past in: `start-screen.tsx`, `constants.ts`.

### F. Techniek/robustheid

**F1. Betrouwbare "Generate proposal"-trigger**
- Wat: Vervang de heuristiek `isConfirmationRequest` (tekst moet eindigen op "?" + "generate/maak/genereer") door een expliciet bevestigingsmoment/event van de accountmanager, of een fysieke "Voorstel maken"-CTA die altijd beschikbaar is na een minimum aantal vragen.
- Waarom: de huidige trig:-knop verschijnt alleen als de accountmanager toevallig exact dit patroon schrijft; kon je lang zonder duidelijke volgende stap.
- Impact: **midden** · Effort: **klein–medium**
- Past in: `chat-screen.tsx`, `prompt.ts`.

**F2. Mic-icon: verwijderen of echt functioneel maken**
- Wat: `planner-ui.tsx` MicIcon is decoratief (opacity-55, geen onClick). Verwijder (misleidend) of koppel aan Web Speech API.
- Impact: **laag** · Effort: **klein**
- Past in: `planner-ui.tsx`.

**F3. Mobiel / responsive**
- Wat: op smalle schermen zijn 3 vaste kolommen (220px nav + chat + 280–300px sidebar) onhoudbaar; voeg een `md`-breakpoint met collapsible sidebar / onderste paneel toe.
- Waarom: veel B2B-bezoekers zitten op mobiel/tablet; layout is nu waarschijnlijk broken.
- Impact: **hoog** (bewijs eerst) · Effort: **groot**
- Past in: `chat-screen.tsx`, `building-plan-screen.tsx`, `plan-screen.tsx`.

**F4. Toegankelijkheid & aria-live**
- Wat: `aria-label` op icon-only-knoppen, `aria-live="polite"` op streamende berichten/status, focusbeheer in modals, contrast-check.
- Impact: **laag–midden** · Effort: **klein–medium**
- Past in: alle planner-components.

---

## #4 Top-5 aanbevolen quick wins (laag effort, hoog impact)

1. **Repareer de dode "Discuss plan with a researcher"-knop** → koppel aan contact-modal (naam/e-mail) die naar Notion + WhatsApp gaat. *(impact hoog, effort klein — A2)*
2. **Kap e-mail/telefoon op "Stuur voorstel per e-mail"** (+ Notion-properties Email/Telefoon/Naam in `route.ts`). *(impact hoog, effort klein–medium — A1/A3)*
3. **Vertaal UI + systeemprompt naar Nederlands** (`prompt.ts` + alle components). *(impact hoog, effort klein — B1)*
4. **Trust-signalen** bij start én contact-capture (privacy, vrijblijvend, referenties, contact). *(impact hoog–midden, effort klein — B2)*
5. **ETA + voortgangsbar tijdens het bouwen** + **prijs in de ready-banner**, en **Reset-bevestiging** + Close-scheiding. *(impact midden, effort klein — C1, C2, D2)*

---

## Kort advies
De grootste structurele missen zijn (a) **geen enkele contactgegevens-capture in de hele frontend**, en (b) **twee dode/misleidende affordances** (Discuss-plan-knop zonder handler, Reset=Close, decoratief mic-icoon) samen met een **Engelstalige UI voor een Nederlandstalig bureau**. Die drie pakken de conversie van "interessantidee" naar "gekwalificeerde lead" direct aan. Sessie-herstel en guided intake zijn de grootste vervolgstappen voor aggregate conversie/retentie.
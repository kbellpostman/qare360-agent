repo: kbellpostman/qare360-agent
branch: main

## Last sync
date: 2026-08-13T00:00:00Z
### Updated in this project
- Next.js app scaffolded at project root (`src/`, `package.json`)
- Research Planner UI ported from `Qare Research Planner.dc.html`
- API route: `POST /api/plan` (Anthropic Claude)

## Screen map
| Screen | Repo files |
|---|---|
| Start (Help Me Decide / I Know What I Need) | `src/components/planner/start-screen.tsx` |
| Chat (summary + checklist) | `src/components/planner/chat-screen.tsx` |
| Plan (9 sections + pricing) | `src/components/planner/plan-screen.tsx` |
| Orchestration | `src/components/planner/research-planner.tsx` |
| AI generation | `src/app/api/plan/route.ts` |
| Prototype reference | `briefing/Qare Research Planner.dc.html` |

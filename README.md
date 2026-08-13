# QARE 360° — Research Planner

Next.js app for the QARE Research Planner: a conversational intake that generates a structured, indicative research plan via Claude.

Ported from the Design Compiler prototype in `briefing/Qare Research Planner.dc.html`.

## Setup

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/
    page.tsx              # Research Planner (main UI)
    api/plan/route.ts     # POST — generates plan JSON via Anthropic
  components/planner/     # Start, chat & plan screens
  lib/planner/            # Types, constants, prompt, section helpers
briefing/                 # Original DC prototype (reference)
```

## Flow

1. **Start** — *Help Me Decide* (3-step wizard) or *I Know What I Need* (free text)
2. **Chat** — summary + checklist progress while the plan is generated
3. **Plan** — 9 sections, optional add-ons, estimated investment

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `ANTHROPIC_MODEL` | No | Model override (default: `claude-sonnet-4-5-20250929`) |

## Related

- Notion product briefing: [QARE \| Prepare Research Planner product briefing](https://app.notion.com/p/3b8ca1b3c05f81be9bfefb4c89d8e31f)
- Target repo: `git@github.com:kbellpostman/qare360-agent.git`

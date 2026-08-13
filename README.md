# QARE 360° — Research Planner (Account Manager)

Next.js app for the QARE Research Planner: a conversational **account manager** that interviews the client (1-2 focused questions per turn) and, once it has enough, generates a structured, indicative research plan.

The account manager runs on the Hermes `qare` profile, reached through `https://agent.kbpm.nl/v1`.

## Setup

```bash
npm install
cp .env.example .env.local
# Add your HERMES_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. **Start** — *Help Me Decide* (3-step wizard) or *I Know What I Need* (free text)
2. **Chat** — the account manager asks questions until it has enough info; a live conversation thread is shown
3. **Plan** — 9 sections, optional add-ons, estimated investment

## Project structure

```
src/
  app/
    page.tsx                  # Research Planner (main UI)
    api/plan/route.ts         # POST — forwards the conversation to the Hermes account manager
  components/planner/         # Start, chat & plan screens
  lib/planner/                # Types, constants, section helpers
briefing/                     # Original DC prototype (reference)
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `HERMES_API_KEY` | Yes | API key for the Hermes `qare` profile (account manager) |
| `HERMES_BASE_URL` | No | Default: `https://agent.kbpm.nl/v1` |
| `HERMES_MODEL` | No | Default: `qare` |

## API

`POST /api/plan` — accepts `{ messages: [{ role, content }] }` (or `{ prompt }`) and returns either:

- `{ plan }` — when the account manager has enough info (validated research plan JSON), or
- `{ reply }` — a follow-up question, so the client keeps the conversation going.

The Hermes API key stays server-side (in the route) and is never exposed to the browser.

## Related

- Notion product briefing: [QARE \| Prepare Research Planner product briefing](https://app.notion.com/p/3b8ca1b3c05f81be9bfefb4c89d8e31f)
- Target repo: `git@github.com:kbellpostman/qare360-agent.git`

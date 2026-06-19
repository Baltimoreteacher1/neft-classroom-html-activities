# Neft Live Rooms (Phase 3 — multiplayer game platform)

Live, standards-aligned multiplayer math games (a Kahoot/Blooket-style host + join
flow) built on the **same spine** as the rest of the Math Brain: every live game emits
`nt_result_v1` records, so live play feeds the mastery engine like any other activity.

## Status: SCAFFOLDED, NOT DEPLOYED

This is a **separate Cloudflare Worker** (Durable Objects), not the static Pages site.
It is intentionally **not wired into any deploy config and not deployed**. The static
site still deploys via push-to-main exactly as before — nothing here touches that.

- `room-state.js` — pure game state machine (rooms, join, speed scoring, leaderboard,
  result emission). **Fully unit-tested** (`room-state.test.mjs`, runs in `npm test`).
- `worker.js` — Durable Object + Worker transport/persistence wrapper around the logic.
- `wrangler.jsonc` — config for the standalone `neft-live-rooms` Worker.
- `host.html` / `join.html` — minimal teacher host screen + student join client.

## Before deploying (needs Joel's go-ahead)

1. Review `worker.js` against the `durable-objects` and `workers-best-practices` skills
   (WebSocket hibernation, storage, error handling).
2. Provide a Cloudflare account/project for the Worker (separate from the Pages project).
3. `cd games-live && wrangler deploy` — **only after explicit approval**.
4. Point `host.html`/`join.html` `WORKER_URL` at the deployed Worker.

## How it feeds the Brain

`Room.toResults(room, nowIso)` produces one `nt_result_v1` record per player. POST those
to the existing progress endpoint (same path `curriculum-progress-bridge.js` uses) and
they roll into per-standard mastery automatically — no separate analytics path.

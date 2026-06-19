# Neft Live Rooms (Phase 3 — multiplayer game platform)

Live, standards-aligned multiplayer math games (a Kahoot/Blooket-style host + join
flow) built on the **same spine** as the rest of the Math Brain: every live game emits
`nt_result_v1` records, so live play feeds the mastery engine like any other activity.

## Status: DEPLOYED (standalone Worker) — clients wired

Live at **https://neft-live-rooms.neftjd.workers.dev** (separate Cloudflare Worker with
Durable Objects, on neftjd@gmail.com's account). **Independent of the static Pages site** —
own URL, no DNS, does not touch or race the push-to-main Pages deploy. Smoke-tested
end-to-end (create → join → start → answer → ended emits `nt_result_v1`).
Redeploy: `cd games-live && wrangler deploy`. Remove: `wrangler delete`.

- `room-state.js` — pure game state machine (rooms, join, speed scoring, leaderboard,
  result emission). **Fully unit-tested** (`room-state.test.mjs`, runs in `npm test`).
- `worker.js` — Durable Object + Worker transport/persistence wrapper around the logic.
- `wrangler.jsonc` — config for the standalone `neft-live-rooms` Worker.
- `host.html` / `join.html` — minimal teacher host screen + student join client.

## Remaining wiring (optional)

- POST `Room.toResults()` records to the `neft-results` endpoint so live play rolls into
  roster mastery (gate 3 — endpoint not yet stood up).
- Add a teacher entry point to `host.html` from the curriculum hub when ready.

## Redeploy / review notes

1. Review `worker.js` against the `durable-objects` and `workers-best-practices` skills
   (WebSocket hibernation, storage, error handling).
2. Provide a Cloudflare account/project for the Worker (separate from the Pages project).
3. `cd games-live && wrangler deploy` — **only after explicit approval**.
4. Point `host.html`/`join.html` `WORKER_URL` at the deployed Worker.

## How it feeds the Brain

`Room.toResults(room, nowIso)` produces one `nt_result_v1` record per player. POST those
to the existing progress endpoint (same path `curriculum-progress-bridge.js` uses) and
they roll into per-standard mastery automatically — no separate analytics path.

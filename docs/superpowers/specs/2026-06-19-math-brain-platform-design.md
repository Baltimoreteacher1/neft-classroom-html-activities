# Neft Teacher Platform — "The Math Brain"

**Date:** 2026-06-19
**Branch:** `feat/math-brain-platform` (isolated worktree `../neft-math-brain`)
**Status:** Design — approved by delegation ("you decide"), AFK build authorized

## Problem

The neft-classroom math page has 624 activities (lessons, games, novels, worksheets,
projects, intervention, readiness) and a results pipeline (`NTKit.grade` → `nt_results_v1`
→ `curriculum-progress-bridge` → Worker/D1). But the pieces don't talk:

- **461 of 624 activities have no CCSS standard tag** (only 163 tagged).
- No per-student, per-standard **mastery** model — results are stored, never aggregated.
- No **routing**: students don't get "what's next"; teachers don't get "who needs what".
- Content generation (`generate-registry` et al.) doesn't emit standard/misconception tags.

Three asks — adaptive Brain (#1), content factory (#2), multiplayer game platform (#3) —
are not three products. They share one spine. Build the spine once; each subsystem plugs in.

## Architecture — one platform, shared core + 3 subsystems

### Phase 0 — Shared Core (everything depends on this)

1. **Standards taxonomy** — `data/standards-taxonomy.json`: canonical Grade 6 CCSS
   (RP, NS, EE, G, SP) with human labels + cluster grouping. Derived from existing
   `curriculum-manifest.json` / `curriculum-unit-identities.json`.
2. **Content graph** — enrich all 624 registry activities with `standard` (CCSS id),
   `level` (0=IEP/1=support/2=enrichment), and `misconceptions[]`. Output
   `data/content-graph.json` keyed by standard. **Subagent fan-out job** with an
   adversarial verification pass (CCSS accuracy matters for a real classroom).
3. **Results event schema** — extend `NTKit.grade` result to carry `misconception` per
   item (additive, backward compatible). Already emits `standard`, `scorePercent`, `skill`.
4. **Mastery model** — contract: `{ student_key, standard, mastery: 0..1, attempts,
lastSeen, misconceptions[] }`. localStorage-first, syncs via existing bridge.

### Phase 1 — The Brain (#1) — the connective tissue

- `assets/brain/mastery-engine.js` — pure module: reads `nt_results_v1` + synced rows,
  computes per-standard mastery (decayed weighted average) + active misconception flags.
- `assets/brain/recommend-engine.js` — pure module: `(mastery, content-graph) →` ranked
  next-best activities, each with a human reason ("You missed unit-rate problems → try…").
  Routes across level 0/1/2, readiness/get-ready, intervention, games.
- **Wire into existing pages** (don't rebuild): `math/my-path/index.html` (student
  "What's next" door), `math/command-center/index.html` (teacher mastery heatmap +
  who-needs-what), `math/my-progress/index.html` (per-student standard view).

### Phase 2 — Content Factory (#2)

- Harden `scripts/generate-registry.mjs` to **merge/preserve** standard+misconception tags
  on regen (never wipe Phase-0 work).
- `scripts/coverage-report.mjs` — standards × content-type matrix → flags gaps.
- Missing-standard stub generator that emits a build plan for uncovered standards.

### Phase 3 — Multiplayer Game Platform (#3) — built on the spine

- `games-live/` — Durable-Object room system (Cloudflare): teacher host screen + student
  join code, live leaderboard, reuses existing 3D/2D games. Game results POST into the
  same mastery engine, so live play feeds the Brain like any other activity.
- Highest risk → built last, against the locked contracts.

## Data flow

```
activity (NTKit.grade) ──┐
live game (DO room) ─────┼──▶ nt_results_v1 ──▶ mastery-engine ──▶ mastery state
worksheet/MCAP ──────────┘                              │
                                                        ▼
content-graph.json ───────────────────────▶ recommend-engine ──▶ my-path (student)
standards-taxonomy.json ──────────────────▶ command-center (teacher heatmap)
```

## Isolation & boundaries

Each unit is independently testable: `mastery-engine` and `recommend-engine` are pure
(data in, data out — Node-testable, no DOM). Pages consume them through `window.NeftBrain`.
Content graph is data, regenerable. Game platform is a separate deploy surface that only
depends on the results schema.

## Safety / constraints

- Isolated worktree; never touch `feat/canvas-iframe-embed` dirty tree; never push without ask.
- Privacy: `student_key` only (class number/handle), never real names — matches existing bridge.
- Additive only to live pages; preserve save/resume, routing, Basic Auth, existing analytics.
- CCSS tags get adversarial verification — wrong standards would misroute real students.

## Testing

- Phase 0: schema validation + verification subagents on standard assignments + coverage report.
- Phase 1: Node unit tests for mastery & recommend engines (known results → expected next).
- Pages: browser smoke test (Playwright) — load my-path/command-center, no console errors.

## Build order

Phase 0 → 1 → 2 → 3, each as its own subagent workflow. Phase 0 (content graph) is the
crown-jewel parallel job and unlocks 1–3.

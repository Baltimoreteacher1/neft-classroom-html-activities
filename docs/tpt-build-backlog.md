# TPT Build Backlog (Neft Teacher / TpT-seller-quality components)

> **Why this file exists:** Joel's TpT build backlog has lived only in volatile
> agent memory since 2026-05-31. This is the durable, checked-in, agent-ready
> source of truth. Status below is grounded in a 2026-06-21 repo audit, not just
> the memory transcript — where the two disagree, the repo wins and the
> discrepancy is flagged.
>
> **Goal (Joel, verbatim):** "see how many we can build out to TPT seller
> quality" — original, professionally developed, across all 10 units.
>
> **Deploy rule:** push to `main` is the only deploy path (Cloudflare Git
> integration). Nothing here should be deployed without Joel; content rewrites
> are gated on his review.

## Component map (where each thing lives)

| Component                   | Path                                                                                                  | Spec                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------ |
| Reveal Math Evidence Studio | `reveal-evidence-studio/` + `assets/reveal-math-data.js`                                              | —                              |
| Math Writing Help Studio    | `esol-reading-writing/math-writing-help/index.html`                                                   | —                              |
| Boss-Battle Review Arcade   | `games/3d/boss-battle-3d/` + `math/review-arcade/`                                                    | `games/3d/PREMIUM_SPEC.md`     |
| Webquests                   | `webquests/unit-1..10/`                                                                               | `webquests/WEBQUEST_SPEC.md`   |
| Hyperdocs                   | `hyperdocs/unit-1..10/`                                                                               | `hyperdocs/HYPERDOC_SPEC.md`   |
| Math Architect Activities   | `activities/architect/` (+ `coordinate-quest/`, `grid-architect/`, `ratio-lab/`, `box-plot-builder/`) | `activities/ARCHITECT_SPEC.md` |
| 3D unit games               | `games/3d/unit-*` + shared `games/engine3d/`, `games/3d/_clarity/`                                    | `games/3d/PREMIUM_SPEC.md`     |

Shared activity kit: `assets/NT-ACTIVITY-KIT.md`, `assets/neft-theme.css`.

## DONE + deployed

- **Wave 1 (2026-05-31, main `e776057`):** Evidence Studio CER items across units;
  Unit-5 exemplar webquest/hyperdoc/architect (original, teacher notes stripped,
  architect rebuilt as a real STEM design challenge w/ SVG); Boss-Battle v1
  (`games/3d/boss-battle-3d/`, real Three.js pulling the arcade MCAP bank).
- **Wave 2 content (2026-05-31, main `c80761d`):** webquest + hyperdoc + architect
  rewrites for units 1, 2, 3, 4, 6 (plus U5 exemplars = units 1-6).
- **Personal launcher (2026-06-01, main `6cef717`):** `personal/index.html` +
  `/me` → `/personal/` redirect.
- **Boss-Battle polish + 3D unit-games clarity overhaul (2026-06-01, main
  `296ab8b`):** shared `games/3d/_clarity/clarity-kit.{js,css}` (start/objective
  overlay, persistent Help, mini-HUD, win/lose) wired into all 10 unit games.
- **Antigravity/Gemini scratch games (2026-06-01):** 3 self-contained games copied
  in (`number-system/factor-tree-salvage/`, `number-system/fraction-division-soccer/`,
  `expressions-equations/distributive-alchemy/`) with root index cards.

## Remaining / open (priority order)

### 1. Webquest / Hyperdoc / Architect originality — units 7-10 — RESOLVED ✅

**Memory said:** units 7-10 still hold "old recycled content with teacher notes"
and need the same original rewrite as 1-6.

**2026-06-21 audit found this ambiguous:** all 10 webquest and hyperdoc files are
comparable size (52-66 KB) and share the same modern template, including the same
`details.teacher-only` answer-key block in units 1-6 AND 7-10. There was no
obvious "old vs new" split by structure.

**2026-07-30 content audit — units 7-10 are original. No rewrite needed.**
Three independent checks, all pointing the same way:

- **Cross-unit prose overlap.** Longest-shared-phrase (8-word shingle) overlap
  against every other unit, teacher-only blocks and markup excluded. Recycled
  pages reuse long runs of prose; original ones share only template chrome.
  Units 7-10 land at 1.8-4.0% (webquests) and 3.8-6.1% (hyperdocs) — the same
  band as the known-original exemplars, and in several cases LOWER than units
  1 and 5 (unit-1 hyperdoc is the highest of all ten at 7.5%).
- **Teacher-note leakage.** Every unit — 1 through 10 — has exactly four hits
  for teacher-directed phrasing, and in all of them the four are the same
  intentional `details.teacher-only` scaffolding (CSS comment, HTML comment,
  the `<details>`, its `<summary>`). Unit 1 and unit 9 are identical here.
  Zero inline instructional notes leaked into student-facing prose.
- **Topic alignment + original premise.** Each carries its own themed scenario
  matched to its own standard: U7 museum cryptographer (one-step equations →
  inequalities), U8 Student Data Council (mean/median/MAD/box plots/histograms),
  U9 the two meanings of a negative, U10 "The Aquarium Build-Out" (volume with
  fractional edges → nets → surface area). Unit-10's webquest is the longest of
  all ten at 1,999 words.

Nothing here is a mechanical proxy for taste, so a spot-read is still worth
doing before a TpT listing — but the "recycled content" premise does not hold,
and no rewrite should be scheduled on the strength of it.

> Note on `details.teacher-only`: these answer-key blocks are intentional teacher
> scaffolding hidden in print, present site-wide — NOT the "teacher notes" Joel
> wanted stripped (those were inline instructional notes in the recycled source).
> Do not bulk-strip `details.teacher-only`.

### 2. Math Writing Help Studio — enhance in place (do NOT rebuild)

`esol-reading-writing/math-writing-help/index.html` is a real ~272 KB tool (64
lessons, sentence frames, live scoring, TTS, 200+ bilingual vocab) — roughly 70%
built. Wanted additions: **visual math models, lesson-specific CER frames, and an
export path**. Enhance the existing file; do not start over.

### 3. Boss-Battle / Review Arcade — polish + expansion

Expand the MCAP question bank and polish `games/3d/boss-battle-3d/`. Real 3D
required (EA-level bar, per `feedback_games_must_be_real_games`).

### 4. 3D unit games — ongoing clarity, lowest priority

Clarity kit is wired. Any further work is UX/playability polish, not "make it
real." Do last.

## What is SAFE to advance without a deploy (for autonomous agents)

These are additive, self-contained, and need no `main` push:

- **This doc + `docs/mailbox-forms-todo.md`** — durable source-of-truth artifacts.
- **Regenerated derived artifacts** via existing generators (`npm run
generate-worksheets`, `generate-homework-html`, `generate-activity-guides`) —
  these are already queued in `night-shift/backlog.json`. Output is gitignored /
  staging; running them does not deploy.

What is **NOT** safe to do autonomously: webquest/hyperdoc/architect content
rewrites (gated on Joel), anything that touches routes/structure, anything that
pushes to `main`.

## How to verify before any deploy

`npm run validate` (primary), `npm run audit`, `npm run build` +
`npm run preview` for a smoke test, and
`node tools/audit-save-resume-integration.js` if activity state is touched. See
`CLAUDE.md` for the full command table.

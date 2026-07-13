# Learning Supports v2 — IEP + WIDA, per-student, cross-lesson

**Date:** 2026-07-13 · **Branch:** `feat/learning-supports-v2`

## Goal

Replace the full-width bottom "student tools" bar with a per-student IEP/WIDA
supports system. A teacher builds class rosters (601/602/603 → student initials),
assigns each student a WIDA level + IEP items, and those supports **follow the
student into every lesson automatically** (D1-backed, localStorage-cached). Both
teacher and student interact via a **side** control — never a bottom toolbar.

## Surfaces

1. **In-lesson side button** (`⚙️ Prepare Supports`, teacher-mode only) — pick
   section → initials → set WIDA level + IEP items for that student. Writes to API.
2. **Teacher Tools console** (`/teacher-tools/learning-supports-manager/`) — build/
   import/edit rosters (paste/CSV + auto-fill from D1) and bulk-assign. New card on
   the hub.
3. **Student side "My Tools 🧰" dock** — one-time self-pick (section → initials),
   remembered per device; auto-filled from Canvas `?sn`/`?si`. Passive supports
   auto-apply; interactive supports appear as buttons in a **right-edge vertical
   dock** (the old bottom bar, restyled). Only that student's assigned tools show.

## Taxonomy — single source of truth

`assets/learning-supports/supports-schema.js` → `window.EWLSupportsSchema`
(`sections`, `groups`, `widaLevels`, `resolveItems(widaLevel, iepItems)`,
`isValidKey`). Item `apply` ∈ `passive` | `interactive` | `flag`.

Valid item keys: `tts text-large contrast tint ruler focus comfort vocab example
model misconceptions frames notepad calculator numberline multchart placevalue
translate fewer time`.

## Data model (D1, `env.DB`)

```sql
CREATE TABLE IF NOT EXISTS supports_roster (
  section    TEXT NOT NULL,
  initials   TEXT NOT NULL,
  wida_level INTEGER DEFAULT 0,   -- 0 = none, 1..6
  iep_items  TEXT DEFAULT '[]',   -- JSON array of item keys
  updated_at TEXT,
  PRIMARY KEY (section, initials)
);
```

## API contract — `functions/api/supports/[[path]].js`

Shared `env.DB` (D1). Teacher writes gated by `env.TEACHER_KEY` (`?key=` or
`x-teacher-key` header), mirroring `functions/api/progress`. Student reads are
public but expose only section/initials/level/items (initials are not PII). All
JSON. Fail-open when D1 unset (return empty, never 500).

- `GET  /api/supports/health` → `{ ok, d1 }`
- `GET  /api/supports/sections` → `{ ok, sections: { "601": ["JN","MR"], ... } }`
  (public; for student self-pick)
- `GET  /api/supports/for?section=601&initials=JN`
  → `{ ok, widaLevel, iepItems: [...] }` (public; for the lesson layer)
- `GET  /api/supports/roster[?section=601]` → `{ ok, roster: [ {section,initials,
widaLevel,iepItems} ] }` (teacher)
- `POST /api/supports/roster` body `{ entries: [ {section, initials, widaLevel?,
iepItems?} ] }` → upsert by (section,initials); validates keys via allow-list;
  clamps level 0..6 (teacher)
- `DELETE /api/supports/roster` body `{ section, initials }` (teacher)

Validation: `initials` clamp to 6 chars upper, `section` clamp to 8 chars;
`iepItems` filtered to the allow-list; unknown keys dropped, never error.

## Student application (learning-supports.js)

On load: resolve identity → `GET /for` (cache in `localStorage`
`ewl-supports:v2:assigned:<section>:<initials>`, apply cached first for instant/
offline, then refresh). `resolveItems()` → passive keys set internal state
(text-large→textScale=1, contrast→highContrast, tint→colorTint=1, comfort→
comfortActive); interactive keys → show matching `data-tool` buttons in the side
dock. `flag` keys ignored on student side.

**Removal:** `.ewl-supports-tools-dock` restyled from bottom full-width bar to a
right-edge vertical collapsible dock. No element remains pinned to the bottom edge.

## Rollout

Shared `learning-supports.js`/`.css` already load on all 64 lessons via the
support-enhance injection; `supports-schema.js` added ahead of it. Behavior
propagates by asset version bump — no per-lesson re-injection.

## Non-goals (YAGNI)

Live Canvas/Google roster sync (needs dormant LTI / OAuth — clean seam left for
later). No student-visible pacing flags. No new PII stored (initials only).

## Verification

`npm run build` · `npm run validate` (static/injection/save-resume/ccss) ·
Playwright smoke on a lesson (student flyout renders, no bottom bar) + console
page loads. Then ship via `ALLOW_DEPLOY=1 npm run ship -- <sha>`.

## Separate follow-up

"Teacher Tools & Features to the top of the page" hub bug — fixed independently
after this feature (Lessons-First default from `675e60522`).

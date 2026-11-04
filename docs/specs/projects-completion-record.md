# Project completion record and portfolio (Stage 3A)

Scope: the Studio completion record, the student portfolio (`/math/projects/portfolio/`) and its
certificate. Gate: `npm run validate:projects-portfolio-browser`.

## Studio completion record: `nt-project-complete:v1:<missionId>`

One localStorage key per Studio mission, written by `curriculum/projects/studio/completion.mjs`
(`completion-ui.mjs` is the Publish-step panel). It is **additive**: no other key is read-modified,
migrated or deleted (`ewl-project-studio:v1:<id>`, the legacy page-layer map `nt-project-complete:v1`
and the `nsr:` Save/Resume records stay byte for byte). Not the same key as the legacy map: that key
is the exact string `nt-project-complete:v1`; this family has a `:<id>` suffix.

Written only when the student presses **Mark this mission complete**, which is offered only while
the Studio's own `progress().ready` is true (every math check matched, every evidence prompt,
revision, recommendation and all four self-review boxes), in student view, and not for the Completed
Exemplar. Never inferred from partial progress, never written on load. If the device refuses the
write the Studio says so and the mission is not complete. Pressing it again on ready work updates
the record and keeps `firstCompletedAt`.

```json
{
  "schema": "nt-project-complete",
  "version": 1,
  "source": "project-studio",
  "missionId": "unit-4-b",
  "registryId": "unit-4-b",
  "title": "Smart Shopper Showdown",
  "unit": 4,
  "completedAt": "2026-10-30T15:00:00.000Z",
  "firstCompletedAt": "2026-10-29T15:00:00.000Z",
  "evidence": {
    "context": "...",
    "vision": "...",
    "prompts": [{ "prompt": "<mission evidence prompt>", "text": "<student's words>" }],
    "critique": "...",
    "revision": "...",
    "claim": "...",
    "design": { "<input key>": "<final value>" },
    "firstDesign": { "<input key>": "<locked Design v1 value>" },
    "mathChecks": { "passed": 6, "total": 6 }
  },
  "selfCheck": {
    "items": [{ "label": "<Studio checklist wording>", "checked": true }],
    "checked": 4,
    "total": 4
  }
}
```

`missionId` equals `registryId` (the registry id is the mission id). `firstCompletedAt`, `design` and
`firstDesign` are optional. No name, email or other identifier is stored: the record holds only the
words the student already wrote in the Studio save. `validateCompletionRecord` accepts a record only
when schema/version/ids match the key, `completedAt` is a real date, the claim, revision and every
evidence prompt are non-empty and every self-check item is checked. A record that fails is ignored by
every reader (no status, no certificate).

## Portfolio

`tools/lib/projects-portfolio.mjs` builds the page from `data/project-registry.json` (all 30 projects,
grouped by CURRENT unit; counts printed from the registry) plus Studio mission data and the
reflection prompts read from `shared/projects/projects-complete.js`. Cards, links and counts are real
HTML before any script runs. `store.mjs` reads (never writes) the device:

| Status | Source |
| --- | --- |
| Complete | a valid `nt-project-complete:v1:<id>` record, or a legacy map entry under the page path with a real `completedAt` |
| In progress | a touched Studio save (`ewl-project-studio:v1:<id>`), an `nsr:rec:*` record whose `url` is the page, a page-level key or `nt-project-reflect/rubric/peer/level/workspace:<path>` |
| Not started | none of the above |

Artifacts shown: Studio, the student's own context, goal, evidence answers, design changes (v1 to
final), reviewer question, revision, recommendation and self-check; classic pages, only what the
Save/Resume record holds (percent, last saved, count of written answers, reflections, rubric rows
scored, the legacy completion's stars and rubric self-score). Raw field text and the saved name are
never displayed. The only key the page writes is `nt-student-name` (existing behaviour).

The old inline `UNITS` table and its `nt-project-u<N>` fallback (nothing in the repo ever wrote that
key) are gone. The legacy per-unit numbering is gone with them: units are the registry's current
units. `window.showCert(unitKey)` (now `unit-<current unit>`), `window.closeCert()` and
`window.NTPortfolioRefresh()` remain.

## Certificate

One per unit, for the finished projects in that unit; `certificateFor` returns null unless at least
one project in the unit has a valid completion record. HTML text with a decorative SVG frame and seal
(hidden from assistive tech; a small emblem replaces them under 640px); prints alone on one
landscape Letter page. Name comes from `nt-student-name`; blank prints a write-in line.

## Known follow-ups (not done here)

- `studio/index.html` cache-busts `studio.js?v=...` by hand; bump it when this ships.
- `portfolio.completionRecord` in the registry still describes the legacy page layer; the Studio
  record applies to all 30 missions.

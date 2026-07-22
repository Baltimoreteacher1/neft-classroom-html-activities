# MSDE Standards / Scope & Sequence Change — Runbook

When Maryland (MSDE) revises the Grade‑6 math standards or the scope & sequence
changes, the curriculum is **config‑driven**, so you adapt it by editing a few
source files and running **one command**. You never hand‑edit the curriculum hub,
the manifests, or 60+ lesson pages.

> **Start in the browser:** the [Standards Shift Studio](/teacher-tools/standards-shift-studio/)
> (`teacher-tools/standards-shift-studio/`) models a proposed change against the
> live curriculum first — paste the draft standards, review the auto‑drafted
> crosswalk, re‑sequence with a live spine doctor, and download the exact files
> this runbook consumes (crosswalk JSON, registry additions, spine edits, lesson
> starters) plus an adaptation brief. Then apply them with the steps below.

## The mental model (memorize this)

```
edit the SOURCE            →   run ONE command        →   done
  data/ccss-standards.json     npm run curriculum:rebuild
  data/standards-crosswalk-*   (regenerates every
  lessons/<id>/config.json      derived artifact +
                                validates + audits)
```

**Sources of truth** (the only things you edit by hand):

| File                                 | Owns                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `data/ccss-standards.json`           | Which standard codes + domains exist (the registry)                                    |
| `data/standards-taxonomy.json`       | Standard ids, domains, old→new provenance                                              |
| `lessons/<id>/config.json`           | Each lesson's `unit`, `lesson`, `standard`, `title` — **the spine / scope & sequence** |
| `data/standards-crosswalk-2025.json` | Old‑code → new‑code map for a bulk re‑code                                             |

**Everything else is generated** — never hand‑edit:
`data/curriculum-manifest.json`, `data/curriculum-search-index.json`,
`data/curriculum-launch-manifest.json`, `docs/standards/scope-and-sequence.md`,
the `/curriculum` hub.

## The one command

```bash
npm run curriculum:rebuild
```

It runs, in order: regenerate curriculum manifest → search index → launch
manifest → **regenerate the scope & sequence view** → **validate:ccss** (every
lesson's standard resolves) → **audit:curriculum** (resource completeness).
It exits non‑zero if anything is inconsistent, so a green run is your proof.

Supporting commands:

| Command                             | Use                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm run curriculum:scope`          | Regenerate + validate `docs/standards/scope-and-sequence.md` only (fast). Add `--check` to validate without writing (CI gate). |
| `npm run curriculum:rebuild`        | Full seamless rebuild after any source edit.                                                                                   |
| `npm run standards-crosswalk`       | DRY‑RUN report of a pending old→new re‑code.                                                                                   |
| `npm run standards-crosswalk:apply` | Apply the crosswalk to taxonomy + every lesson config.                                                                         |

---

## Scenario A — MSDE re‑codes the standards (codes change, content mostly same)

This is the 2025 MCCRS re‑code pattern (e.g. `6.RP.A.1` → `6.AT.A.1`). Already
tooled — you fill in a map and run a script; nothing is edited by hand.

1. **Update the registry.** Add/rename codes in `data/ccss-standards.json`
   (and `data/standards-taxonomy.json`) so the new codes exist and carry their
   `shortLabel` / `fullText` / domain.
2. **Fill the crosswalk.** In `data/standards-crosswalk-2025.json` (or a new
   dated crosswalk), set `newId`/`newDomain` for every changed `oldId`.
   `standards-crosswalk:apply` refuses to run while any `newId` is blank, so a
   partial map can never corrupt the curriculum.
3. **Dry‑run, then apply:**
   ```bash
   npm run standards-crosswalk          # review the report
   npm run standards-crosswalk:apply    # rewrites taxonomy + every lesson config
   ```
4. **Rebuild + verify:**
   ```bash
   npm run curriculum:rebuild
   ```
5. **Eyeball the diff** of `docs/standards/scope-and-sequence.md` — the Standard
   column should now show the new codes, unit/lesson order unchanged.

---

## Scenario B — Scope & sequence reorder (same standards, new order)

The order is defined entirely by each lesson's `unit` + `lesson` fields (and its
folder id). To move a lesson, change those fields.

1. **Edit the spine.** In the affected `lessons/<id>/config.json` files, set the
   new `unit` / `lesson` numbers.
   - Renumbering _within_ a slot is a pure config edit.
   - If you also rename the folder id (`3-2` → `4-1`), keep the folder's `unit`/
     `lesson` fields matching the new id, and remember folder ids are load‑bearing
     URLs / save‑resume keys — see the URL note below before renaming.
2. **Rebuild + verify:**
   ```bash
   npm run curriculum:rebuild
   ```
   The scope doctor flags duplicate `unit·lesson` slots and numbering gaps.
3. **Confirm the reorder** in `docs/standards/scope-and-sequence.md`.

> **URL / save‑resume caution:** folder ids under `lessons/` and `math/unit-N/`
> are bookmarked and used as save keys. Prefer renumbering via the `unit`/`lesson`
> _fields_ (which drive the hub order) over renaming folders. If a folder must be
> renamed, add a redirect in `data/routes.json` and do not delete the old path.
> Also note the known unit‑numbering crossing: `math/unit-N` ≠ `lessons/N-x` for
> units 7/8/9 — map by `standard`, not by number.

---

## Scenario C — Add or drop a standard / lesson

**Add:**

1. Add the standard to `data/ccss-standards.json` if it's new.
2. Create `lessons/<unit>-<lesson>/config.json` with `unit`, `lesson`,
   `standard`, `title`, objectives.
3. `npm run curriculum:rebuild` — the manifest, hub, and scope view pick it up.
   (Lesson _content_ — activities, games, visuals — is separate authoring work.)

**Drop:**

1. Remove or flag the lesson. Do **not** hard‑delete a live folder without a
   `data/routes.json` redirect.
2. `npm run curriculum:rebuild`.

---

## Definition of "done" for a standards change

- [ ] `npm run curriculum:rebuild` exits green.
- [ ] `docs/standards/scope-and-sequence.md` diff matches your intent.
- [ ] `npm run validate` passes (includes `validate:ccss`).
- [ ] No lesson folders renamed without a `routes.json` redirect.
- [ ] Deploy per `docs/deploy.md` (`ALLOW_DEPLOY=1 npm run ship -- <sha>`) — only
      when you actually intend to publish.

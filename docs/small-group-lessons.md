# Small-Group & Catch-Up Lessons

Differentiated, publisher-grade pull-out lessons that live **under each base
lesson** in the curriculum dropdown. Three variants, one dedicated compact
renderer — deliberately different in **style, design, and function** from the
full 5-phase lessons.

| Variant                     | Dir suffix    | Who                      | Focus                                                            |
| --------------------------- | ------------- | ------------------------ | ---------------------------------------------------------------- |
| **Group 1 — Extra Support** | `N-M-group1`  | Students struggling      | Re-teach + heavily scaffolded practice (word bank, guided steps) |
| **Group 2 — Challenge**     | `N-M-group2`  | Students who get it      | Extension, justification, harder cases                           |
| **Catch-Up**                | `N-M-catchup` | Missed a band of lessons | Big-ideas review across the band                                 |

64 base lessons → **128** small-group + **20** catch-up lessons.

## Experience (compact renderer)

`engine/core/small-group-renderer.js` (`bootSmallGroup(config)`) renders a
single-scroll, color-coded page — support = blue, challenge = amber, catch-up =
teal. No identity screen, phase nav, notice/wonder, or discovery. Four sections:

1. **Review the skill** — key idea + worked example (I-do) + guided (we-do) with
   sentence frames.
2. **Key vocabulary** — compact cards with interactive **cloze** fill-in.
3. **Practice** — interactive problems (below).
4. **Quick check** — the exit ticket.

### Interactive practice

- **Fill-in-the-blank** answers — horizontal (`a op b = [__]`) and **vertical
  stacked column** layouts, auto-checked (numeric-tolerant).
- **Guided-solve** (1–2 per small group) — a progressive, type-as-you-go worked
  problem: enter each number to unlock the next step, building the full solution.
- **Word-bank scaffold** (Group 1 + Catch-Up) — tap-to-fill answer chips.
- **Hint ladder**, **error-analysis** (find + fix the mistake), and a
  reveal-model fallback for open-response.
- **Teacher facilitation** panel (who to pull, moves, sentence frames).

### Built-in classroom layers (shared shell)

`tools/lib/compact-shell.mjs` mounts, on every variant:

- **Math Workbench** launcher (bottom-right button)
- **Learning-Supports** dock (highlighter, directions, organizer, adaptations)
- **Save/Resume** (multi-day, sentineled — passes the save-resume audit)
- **Print** button (print-optimized CSS) + **Download for Canvas (SCORM)**
  (`/api/scorm?activity=<id>`)

## Generators (source of truth — GENERATED, don't hand-edit)

- `tools/generate-small-group-lessons.mjs` → 128 configs + shells + `small-group-rows.json`
- `tools/generate-catchup-lessons.mjs` → 20 compact catch-up configs + `catchup-rows.json`
- `tools/splice-small-group-curriculum.mjs` → inserts the two indented dropdown
  entries under each parent lesson (order: Lesson → Group 1 → Group 2 → Catch-Up)

### Regeneration flow (order matters)

```
node tools/generate-small-group-lessons.mjs
node tools/generate-catchup-lessons.mjs
node tools/splice-small-group-curriculum.mjs   # idempotent; hub CSS + entries
npm run inject:uifr                             # stamp the new lessons (required by validate:uifr)
npm run build && npm run validate
```

The shell adds save/resume + supports + workbench itself; only the **UIFR**
stamp comes from an injector (idempotent — touches only unstamped lessons).

## Verification

- `npm run build` — all 148 compile as Rollup entries.
- `npm run validate` — full QA suite (save-resume, injection, ccss, uifr, …) — green.
- `node tools/smoke-lesson-boot.mjs --lessons <ids>` — headless render, no boot errors.

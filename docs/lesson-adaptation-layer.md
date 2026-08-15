# The lesson adaptation layer

How a teacher's support selection reaches an interactive lesson without touching
the lesson.

## The shape of it

```
canonical lesson  +  lesson support profile  +  variant intrinsic data
                          ↓
               resolved capability set
                          ↓
   the supports layer the lesson already ships (dock, vocabulary, frames,
   read-aloud, chunking, workload)  →  the supported lesson
```

Nothing in that chain writes to a lesson file. There is exactly one copy of each
lesson on disk, and it is the one a teacher edits, a generator regenerates, and
a curriculum correction flows into. Turning every support off renders it
unchanged — not because anything is undone, but because with no profile stored
there is nothing to resolve.

## The files, and what each one owns

| File                                               | Owns                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/supports/lesson-supports.js`               | The catalogue, applicability rules, impact classification, inheritance, preview, conflict precedence, and the delta store. Pure; renders nothing, fetches nothing. |
| `assets/learning-supports/manifest.json`           | Per-lesson support CONTENT (vocabulary, frames, word bank, worked example) and the `variants` map. Generated — never hand-edit.                                    |
| `scripts/generate-learning-supports-manifest.mjs`  | Builds that manifest from lesson `config.json`, including each variant's `intrinsic` supports.                                                                     |
| `assets/learning-supports/learning-supports.js`    | The in-lesson consumer: resolves the profile, applies capabilities, renders the student-facing supports.                                                           |
| `assets/learning-supports/supports-adaptations.js` | The behaviour modes (chunking, workload, praise, nudges) that `adapt` keys turn on.                                                                                |
| `curriculum/student-supports/`                     | The teacher surface: select → preview → apply → teach.                                                                                                             |
| `data/lesson-support-overrides.json`               | Authored exceptions, as data.                                                                                                                                      |
| `tools/validate-lesson-supports.mjs`               | The gate.                                                                                                                                                          |
| `tools/lesson-supports.test.mjs`         | The invariants.                                                                                                                                                    |

## Source-of-truth rules

- The profile stores **support keys and a lesson id**. Nothing else. Not the
  title, not the standard, not a URL, not any adapted text. Content is resolved
  at render time, so a curriculum fix reaches an already-configured lesson.
- The manifest is **generated**. A support that needs new lesson content needs
  the lesson `config.json` edited and `npm run generate:supports` re-run.
- The support catalogue lives in **one file**. Both the teacher surface and the
  in-lesson layer read it; neither keeps its own copy of the key list.

## Inheritance

Precedence, in `resolveForLesson`:

1. The **parent lesson's** profile (`5-3`) is what a variant inherits.
2. Anything in that variant's **`intrinsic`** list is removed — the variant
   already authors it, and stacking a second generic frame on top of a better
   authored one makes the lesson worse, not more supported.
3. A **variant's own saved profile** replaces inheritance outright. A teacher
   who configured Group 1 by hand meant it.

`intrinsic` is derived by the generator from the variant's own config, so a
variant that loses its authored frame stops being credited with one on the next
regeneration.

## Accommodation vs modification

Every catalogue entry declares one `impact`:

- `access` — changes how a student reaches or answers the task. Objective,
  values and correct answer untouched.
- `scaffold` — objective unchanged; additional instructional support.
- `modification` — the task, amount or expectation changes.

Exactly one entry is a modification today (`shorter-practice-set`). It is
rendered in its own bordered group, labelled, and **no preset may contain one** —
a teacher choosing "Multilingual learner support" is choosing access, and the
gate fails the build if a preset ever bundles a modification.

## Protected mathematics

`PROTECTED_FIELDS` names the fields carrying the mathematics itself. The test
suite applies every non-modification support in turn and asserts the lesson entry
is byte-identical afterwards. The adaptation layer only ever adds presentation
and language scaffolding around canonical content; it has no code path that
rewrites a value, and this test is what keeps that true.

## Adding a support type safely

1. **Implement the behaviour first.** A support must name a real capability:
   a `PROFILE_KEYS`/`TOOL_KEYS` entry in `learning-supports.js`, or a taxonomy
   key wired to a `MODE_KEYS` mode in `supports-adaptations.js`. The gate fails
   otherwise, deliberately: a toggle labelled correctly that changes nothing is
   the worst failure this system can have, because a teacher records the
   accommodation as provided and it was not.
2. Add the catalogue entry with `impact`, `elements` (semantic names only — never
   CSS selectors), a `contract` of may/must-not, and a `requires` rule that is
   false when the lesson cannot deliver it.
3. If it changes what is asked, mark it `modification` and keep it out of presets.
4. Run `npm run validate:lesson-supports` and `node tools/lesson-supports.test.mjs`.

If the accommodation **cannot** be implemented — extended time, when nothing a
student sees is on a clock — add it to `NOT_IMPLEMENTED` with a reason and what
to do instead. It then appears on the teacher surface as a plainly worded note
and never as a control.

## Authoring a lesson-specific exception

Use `data/lesson-support-overrides.json`, not a lesson-id branch in a renderer.
It can suppress a tool where offering it would remove the objective
(`computationIsObjective`), pin content that must stay visible under reduced
visual load (`pin`), or exclude a support with a recorded reason (`exclude`).

## Fallback

Every consumer treats the layer as optional:

- `shared/supports/lesson-supports.js` fails to load → the in-lesson layer still
  resolves a variant to its parent, still shows the lesson's vocabulary and
  frames, and applies no teacher profile.
- The store is corrupt, absent, or written by a newer schema → it reads as "no
  supports selected", which is canonical rendering.
- An authored applicability rule throws → that one support is inapplicable; the
  rest of the catalogue is unaffected.

A support-system failure must never stop instruction. That is the reason each of
those paths returns a value instead of raising.

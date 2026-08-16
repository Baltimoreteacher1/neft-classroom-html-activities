# Lesson supports architecture

How a teacher's support selection reaches the interactive lesson, its
small-group variants, the printed packet and the exported document — without
touching any of them.

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
| `shared/supports/print-supports.js`                | The paper surface. Draws the resolver's result; decides nothing itself.                                                                                            |
| `curriculum/student-supports/`                     | The teacher surface: select → preview → apply → teach.                                                                                                             |
| `teacher-tools/support-audit/`                     | The instructional-decision audit table. Read-only, derived, teacher-gated.                                                                                        |
| `data/lesson-support-applicability-review.json`    | AUTHORED instructional decisions, each with reason and evidence.                                                                                                   |
| `scripts/generate-support-overrides.mjs`           | Derives the runtime override file from that review. `--check` fails on stale.                                                                                       |
| `tools/validate-support-equivalence.mjs`           | Screen / print / export must not disagree except where MODALITY says so.                                                                                            |
| `tools/support-print.test.mjs`                     | The printed packet, asserted against real generated markup.                                                                                                             |
| `data/lesson-support-overrides.json`               | GENERATED runtime shape of those decisions. Never hand-edit.                                                                                                       |
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

## Class scope

A second, independent axis. A class here is **601 / 602 / 603** — a period on a
timetable, never a student. The canonical lesson is identical for all three;
only the teacher's support selection differs.

The store is two levels:

```
lessons: { "3-4": … }              the LESSON DEFAULT — every class follows it
sections: { "602": { "3-4": … } }  an OVERRIDE — replaces it for one class
```

`readStore(section)` flattens the two into the shape `resolveForLesson` has
always taken, which is why class scoping needed no change to the resolver, the
inheritance rules above, the print layer or the equivalence gate.

**The rules, each pinned by a test in `tools/lesson-supports.test.mjs`:**

| Action | What it touches | What it does **not** touch |
| --- | --- | --- |
| Apply with no class | the lesson default | every existing class override |
| Apply with a class | that class only | the default, and the other two classes |
| Reset a class | that class's entry for that lesson | the default, and the other two classes |
| Clear the lesson default | the default only | **every class override survives** |
| Copy A → B | B's entry for **that one lesson** | the default, A, and any class not named |

The last two are the ones worth reading twice.

**Clearing the lesson default does not erase class overrides.** A class that
has diverged keeps its own configuration and has to be reset from its own tab.
This is deliberate — an override is a decision a teacher made about one class,
and clearing a shared default is not a statement about it — and the supports
surface says so in as many words next to the button. If this behaviour ever
changes, that sentence becomes a lie, so
`clearing the lesson default does NOT erase a class override` fails first.

**Copy is lesson-scoped.** `copyLessonToSection(lessonId, from, to)` moves one
lesson. The whole-setup `copySectionSetup(from, to)` still exists and still
moves every lesson a class owns; it is deliberately not what the supports
surface offers, because that page is about one lesson and every other control
on it is lesson-scoped. Copying *from* a class that is only inheriting pins
what the teacher was looking at — the default's selection — as the
destination's own explicit override.

**Isolation is a property of the store, but the failure is in the wiring.** A
scope tab that switches the label and saves to the previous scope passes every
unit test, because the unit under test was never called with the wrong
argument. Only clicking through it can tell, which is what step 9 of
`npm run e2e:supports` does in a real browser.

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

## Surfaces and modality

Four surfaces render the same effective configuration:

| Surface | Consumer |
| --- | --- |
| screen | `assets/learning-supports/learning-supports.js` |
| small group | the same file — a variant resolves to its parent for content |
| print | `shared/supports/print-supports.js` on printable / worksheet / handout / notes |
| export | `engine/core/export.js` (the in-lesson `.docx`) |

All four call `resolveEffectiveSupports({lessonId, store, entry, surface, ctx})`.
None of them works out "what is on" for itself. That is the single most
load-bearing rule in this document: the moment print decides for itself, the
worksheet in a student's hand can disagree with the lesson the teacher just
taught, and nobody finds out until the middle of a class.

Surfaces are still allowed to differ, because media differ. Every difference is
declared in the `MODALITY` table, per support, per surface:

- `active` — delivered on this surface.
- `teacher-note` — the medium cannot do it; the **teacher copy** carries a
  one-line delivery note and the **student copy** carries nothing. Read-aloud,
  speak-instead-of-type, reduced visual load, calculator and extension are all
  teacher notes on paper.
- `n/a` — the surface has nothing to adapt.

`validate:support-equivalence` resolves every applicable configuration on every
lesson through all three surfaces and fails on any difference `MODALITY` does
not declare — and on any support declared `active` on paper that contributes
nothing to a printed page.

### The one thing print does not do

The exported `.docx` is a record of what a student **did**, not a blank task, so
it carries the provenance block and not word banks. Pasting scaffolds into a
completed answer sheet would be decoration. A teacher reading that document
needs the context the work was produced under, and that is what it gets.

## Provenance

Teacher-facing surfaces print a short summary: supports applied, any task
modification with its consequence, and delivery notes. It says what the lesson
**does**, never why a learner might need it — no disability category, no plan
status, no proficiency level. A packet travels around a building.

Student copies get the supports and no commentary about them.

## Modification guardrails

There is exactly one modification (`shorter-practice-set`). It is:

- excluded from every preset, by a gate;
- counted and named separately from supports in every summary — the in-lesson
  status block, the planner status line, the print provenance;
- required to record a plain-language consequence, by a gate;
- **not inherited into small-group variants.** Those lessons are already the
  more scaffolded pathway, and shortening their practice set on top of that
  compounds a change in demand nobody chose. A teacher who wants it there
  configures that variant directly.

On paper it marks the tail of the practice set optional, with a floor of three
required problems. The problems stay on the page; what changes is what is
required.

## Instructional applicability

`data/lesson-support-applicability-review.json` is where a decision like "no
calculator in the long-division lesson" lives, with its reason and the evidence
it was read from. `data/lesson-support-overrides.json` is generated from it.

**Titles are not evidence.** An earlier pass suppressed the multiplication chart
on 6-7 because the title read "Find Factors and Multiples", when that lesson's
objective is GCF/LCM reasoning and a chart is straightforward access to it. The
gate now fails a review whose evidence is only a title.

Ambiguous calls are recorded with `"status": "teacher-review"` rather than
guessed. `/teacher-tools/support-audit/?decision=teacher-review` lists them.

## Privacy boundary

Stored: a lesson id, support keys, an optional preset name, a schema version.
Not stored, and unreachable through this layer's interface: student name,
initials, section, disability category, plan status, proficiency level.

The per-student roster remains a separate, teacher-gated D1 system. If it is
ever connected — behind its own privacy review — the interface already exists
and needs no change: it would ask for `resolveEffectiveSupports({lessonId,
requestedSupportKeys})` and this layer would never learn *why* those keys were
requested. A test pins that the resolver ignores any student field a caller
tries to pass.

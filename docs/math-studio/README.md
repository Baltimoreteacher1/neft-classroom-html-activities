# Math Studio

One connected experience per lesson at `/math/studio/<lesson>/` (Units 2–9, 72 lessons), in five stages:
**Explore → Understand → Practice → Apply → Reflect**. Finder: `/math/studio/`. Coverage: [COVERAGE.md](COVERAGE.md).

## What it is built from (nothing is re-authored)

| Stage      | Source                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explore    | The lesson's Learning Lab model (`curriculum/learning-labs/shared/model.mjs`), mounted as a component, with the lab's investigation prompts                                                                                 |
| Understand | `launch.conceptIntro` (intro, key idea, I do / we do / you do), Notice & Wonder picture, vocabulary, `practice.commonMistake`, sentence frame                                                                               |
| Practice   | Regular: config `approaching`/`onLevel` multiple choice + the lab's core numeric items. Challenge: `extending` items, lab stretch items, error analysis. Full Practice/Challenge studios are linked and carry the stage bar |
| Apply      | Reveal word problem, Connect scenario, the lab's Create mission, the `extending` open-response reasoning task; projects and stories as optional, non-evidence links                                                         |
| Reflect    | Exit ticket and a fresh transfer item (`familyCheck`, else `connect.check`), error analysis, written explanation with the lesson's sentence frame                                                                           |

## Files

- `scripts/generate-math-studio.mjs` (`npm run generate:math-studio`, `--check`) writes the pages, `data/math-studio/registry.json`, `COVERAGE.md`, and the stage bar on the hand-built Unit 4 studios.
- `scripts/lib/math-studio-registry.mjs` composes each lesson; `math-studio-page.mjs` is the markup (incl. `stageBar`, used by the Practice studio generator, and `labBar`, used by the Learning Lab generator); `math-studio-coverage.mjs` is the audit.
- `assets/math-studio/core.mjs` holds every rule (contracts, support ladder, answer checks, model adapters, saved state, evidence) and has no DOM; `items.mjs` is the question card; `studio.mjs` the page runtime; `studio.css` + `stage-bar.css` the design layer.

## Model ↔ practice

- **Practice → model**: a lab numeric item whose stated settings reproduce its answer in the model (`verifyHandoff`, checked at build time) gets "See it in the model". The hand-off is a validated `handoff` contract; the model opens on the item's numbers and "Back to my question" returns to the same item. Items that do not verify get no hand-off (18 refused). Multiple-choice items never claim a model state.
- **Model → practice**: "Make a question from my model" asks for the readout at the current settings (`predictItem`), then a transfer task from the lab's own `puzzle()` (`transferTask`), checked through the relationship so every valid answer counts.

## Support and evidence

Deterministic, no AI service: attention cue → model (only with a verified hand-off) or hint → structured hint → full worked example → a different question (`pickNext`, preferring a shared misconception). Misconception names appear only where the authored choice is tagged. Records keep **independent** (right first time, no hint/model/worked example), **supported**, and **revealed** apart; Reflect checks count the first try as independent evidence. The evidence panel is local-only, stores no name, and downloads as JSON. There is no teacher roster view: the site has no student identity, so none was invented.

## Save/resume

`localStorage` key `ewl:math-studio:v1:<lesson>` (versioned; additive load; a different version or lesson id starts fresh). Exempt from the generic Save/Resume widget in `tools/save-resume-config.js` because it keeps its own save, like Math Reality. Storage blocked → the page works without saving and says so.

## Routes and rollback

No existing URL changed what it answers. Practice studios, Unit 4 studios and Learning Labs keep their URLs, saves and behavior and gain the five-stage bar; the units hub row gains "Start Math Studio". To roll back without touching student progress: drop the `STUDIO_LINK` call in `scripts/generate-practice-studios.mjs`, the `stageBar` line in `practice-studio-pages.mjs`, `mathStudioBar` in `tools/generate-learning-labs.mjs`, regenerate, and (optionally) delete `math/studio/`. Saved Math Studio data lives under its own key and is untouched by the other surfaces.

## Checks

- `npm run validate:math-studio` — Node: contracts, ladder, answer checks, adapters on all 72 models, hand-off verification, registry content, state migration, evidence, generated-file freshness (in `npm test`).
- `npm run validate:math-studio-browser` — Chromium: all 72 lessons through every stage, both hand-off directions, reload restore, Spanish, 390px overflow, axe sample, stage bar on studios and labs.

## Known limits

- Lessons 5-9, 5-10 and 8-1…8-7 have no practice item with a verified model hand-off; model → practice still works there.
- Spanish shows wherever the source has Spanish; lab investigation prompts, Create missions, word problems and some vocabulary examples are English-only in the source. No native-speaker review.
- The full Practice Studio engine is linked, not embedded: its runtime is ~40 global scripts and its own save; embedding it would duplicate the engine.

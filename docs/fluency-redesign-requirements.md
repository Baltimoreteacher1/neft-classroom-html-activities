# Math Fluency Lab redesign — requirements checklist

Source: Joel's "Master Coding Prompt — Publisher-Grade Redesign" (2026-11-11). Every line is a requirement.
Owner: **F** = foundation (done on `feat/fluency-publisher-redesign`), **K5** = content K–5 session,
**68** = content 6–8 + Ratio Studio session, **UX** = experience/accessibility/QA/deliverables session.
A line is checked only with the evidence named in its last column. Do not tick a line from reading code.

## 1. Information architecture

| #   | Requirement                                                                                                                                                                | Owner                                                                                                       | Evidence               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1.1 | Student nav has exactly three destinations: Learn & Practice, Choose a Skill, My Progress                                                                                  | F ✅                                                                                                        | `index.html` topbar    |
| 1.2 | Teacher, family, accessibility prefs, learner/device, advanced explorations, printing, admin in labelled secondary places (More drawer, `lab.html`) — never competing tabs | F ✅ / UX (settings: language, text size, reading font, reduced motion, read-aloud, learner switch, backup) | browser                |
| 1.3 | First visit: grade chooser K–8, no Grade 1 assumption; after grade, ONE recommended start + secondary "choose a different skill"                                           | F ✅                                                                                                        | browser journey 1      |
| 1.4 | Returning: grade shown, one dominant Continue Learning, secondary Choose Another Skill, small progress line                                                                | F ✅                                                                                                        | journey 4              |
| 1.5 | No account/assessment/profile required to begin                                                                                                                            | F ✅                                                                                                        | fresh-device journey 3 |
| 1.6 | Profiles, diagnostics (checkup), daily review, advanced reachable but optional                                                                                             | F ✅ (More drawer → lab.html)                                                                               | browser                |
| 1.7 | One dominant primary action per screen; ≤3 secondary; optional controls in disclosures; no long text above first action                                                    | F ✅ / UX audit every screen                                                                                | screenshot review      |

## 2. Skill selection

| 2.1 | Persistent grade selection in library | F ✅ |
| 2.2 | Strands shown only when they apply to the grade (`topicsFor`) | F ✅ |
| 2.3 | Student-friendly names + one-line description per card (rewrite jargon titles via `title` in authored entries) | K5 / 68 |
| 2.4 | Search understands ordinary terms (synonym table in `shell/app.js`) — extend and test with 30 everyday queries | UX |
| 2.5 | A few meaningful filters: Learn new / Practice / Review (due) | UX |
| 2.6 | Card = name, one sentence, Start. No other buttons | F ✅ |
| 2.7 | Direct links `?grade=&skill=&stage=` open without setup; ≤3 actions from home to a skill | F ✅ / UX automated test |

## 3. One learning experience (See → Try → Practice → Understand)

| 3.1 | See it: concept + one strong representation + short explanation + picture↔math link | F engine ✅ / K5,68 content for every skill |
| 3.2 | Try it: manipulation that reveals something mathematical, for EVERY skill (living model, engine Build, or guided) | F (ratio, 102 Build) / K5,68 living models for skills without Build |
| 3.3 | Practice: one problem, answer area, one Check action, help only on request | F ✅ |
| 3.4 | Understand & improve: specific feedback, the idea explained, visual correction, a new problem, next problem chosen from results | F partial / UX (adaptive selection via `difficulty`/`adaptiveProblem`, transfer after 3 independent) |
| 3.5 | Compact progress indicator, not a menu; can start directly in practice | F ✅ |

## 4. Explanations — every skill (128) answers: what, meaning, why it works, how to recognise/apply

| 4.A–G | concept intro · visual demonstration · annotated worked example · interactive investigation · guided attempt · independent application (transfer) · misconception-specific feedback | K5 (K–5, 79 skills) / 68 (6–8, 49 skills) |
| 4.Q | Precise math; accessible language; logical sequence; explains why; connects visual/verbal/symbolic; consistent vocabulary; no undefined terms; examples distinct from instructions; no repetition; no answer before thinking; misconceptions explicit | K5 / 68, enforced by `shell-content.test.mjs` |
| 4.L | Grade-sensitive language: K–2 short sentences/manipulatives; 3–5 models→equations; 6–8 formal vocabulary | K5 / 68 |
| 4.R | Ratio example sequence (2 red : 3 blue → duplicate → 4 : 6 → why invariant → build another → predict one-quantity change) | F ✅ `authored/ratios-6.js` |

## 5. Visual system

| 5.1 | Unified SVG style (tokens from `shell/shell.css`: q1/q2/q3 quantity colours, line weights, label size ≥ 14px at 320px) applied to studio engines | UX |
| 5.2 | Components: counting/grouping, ten-frames, number lines, place-value blocks, arrays/area, mult/div, fraction strips, equivalent fractions, decimal grids, tape diagrams, double number lines, percent models, integer chips, coordinate planes, algebra tiles, balance, geometry/measurement, data displays, proportional graphs | engines exist for most; K5/68 add the missing ones for their skills (22 skills have no engine model: see `shell-content.test` output) |
| 5.3 | Accurate, crisp, mobile-legible, keyboard + screen-reader labelled, never distorts quantity | all; UX audits |
| 5.4 | Colour language consistent and never the only cue | UX |

## 6. Explanation engine

| 6.1 | Schema: concept, visual state, relationship, explanation, highlighted quantities, interaction, expected observation, misconception, feedback, next action (`shell/SCHEMA.md`) | F ✅ schema / K5,68 fill |
| 6.2 | Synchronized canvas (picture/notation/words update together) | F ✅ `shell/canvas.js` |
| 6.3 | Controlled progression with predict points; no text-only click-through | F ✅ |
| 6.4 | One "Help me understand" → hint → visual → guided partial; "Another way" secondary; skill-aware | F ✅ ladder / UX adds Another way (alternate engine rep) |

## 7. Manipulatives

| 7.1 | Most relevant model shown automatically; full tool library only in Explore (More → Math tools) | F ✅ |
| 7.2 | Each model: one objective, direct manipulation, immediate feedback, synced reps, labels/units, reset/undo, bounded, keyboard, explanation | K5 / 68 for living models; UX audits Build panels |
| 7.3 | Ratio Studio: rigorous math audit (ratios, unit rates, scaling, double number lines, graphs, tables synchronized), simplify controls, integrate strongest parts into Grade 6 ratio skills | 68 |

## 8. Practice

| 8.1 | Layout: skill name + progress + leave; one problem; answer + model; Check; one Help | F ✅ |
| 8.2 | Correct: acknowledge, reinforce relationship, natural next | F ✅ |
| 8.3 | Incorrect: detected misconception, concise explanation, small visual, revise/fresh attempt — e.g. 25% of 40 = 25 → one-fourth, four groups, then a new percent problem | F mechanism / 68 authors the percent case; K5 & 68 author misconceptions per skill |
| 8.4 | Supported vs independent kept separate in evidence; no speed/streak emphasis | F ✅ (`store.recordPractice`) |

## 9. Personalization

| 9.1 | Decide next: another independent / variation / reminder / visual / guided / prerequisite review / transfer — from repeated evidence, never one error | UX (use `tutor-engine` difficulty, prerequisites, evidence) |
| 9.2 | Misconception categories per skill drive feedback | K5 / 68 |
| 9.3 | Student progress: practiced / improving / next; detail stays in teacher/family views; existing records preserved | F ✅ |

## 10. Accessibility & language

| 10.1 | WCAG 2.2 AA: keyboard, focus, accessible input, SR descriptions of models, contrast, responsive type, 44px targets, reduced motion, text size, non-colour feedback, no traps | UX (axe + keyboard walk, all screens, EN/ES) |
| 10.2 | ESOL: accurate bilingual vocabulary at point of need (`language-terms.js`), short explanations, spoken instructions, sentence frames (`language-frames.js`), examples/non-examples, supports that fade | UX wiring / K5,68 Spanish content |
| 10.3 | One unobtrusive language/access menu | UX |
| 10.4 | Works for K pre-reader (audio-first), independent elementary, Grade 6 shared link, older review, multilingual, family, projector | UX journeys |

## 11. Design system — tokens + components (type, colour, spacing, layout, buttons, inputs, math notation, cards, canvases, annotations, feedback, progress, dialogs, drawers, model containers, teacher utilities) | F ✅ base / UX completes and documents in `shell/DESIGN.md` |

## 12. Preservation — feature inventory classified core / contextual / teacher-family / enrichment; routes, params, ids, assignment links, storage, profiles, backups, receipts, print, SCORM preserved | F ✅ (lab.html + forwarding) / UX writes the report |

## 13. QA — skill inventory; per-skill review (correctness, clarity, language, sequence, representation, assessment, misconception, a11y, visual, interaction); schema validator; math tests for edge cases | K5 / 68 per skill; UX validator |

## 14. Innovation — living models, visual coaching after a miss, continuity | F ✅ mechanism / K5,68 content |

## 15. Engineering — reuse, no second framework, data-driven, no placeholders/TODOs | all |

## 16. Browser verification — 320/375/768/1024/1440; journeys 1–7; no overflow, console errors, traps; CWV LCP/INP/CLS measured | UX |

## 17. Publisher acceptance — scored with evidence | UX |

## 18. Deliverables — implementation summary, before/after screenshots, preservation report, coverage report, test results, 1–5 scores with evidence, deployment readiness | UX (final) |

## Close-out walk — 2026-11-12 (production `41bad3a6d6`)

Every line above, with the evidence that was actually run. ✅ met, ◐ partly met (what is missing is the work item),
✗ not met. Evidence files: `docs/fluency-redesign-report/evidence/`. Numbered work items refer to section 9 of
[fluency-redesign-report.md](fluency-redesign-report.md).

| #       | Status | Evidence                                                                                                                                                                                           |
| ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1     | ✅     | The header has exactly Learn & Practice, Choose a Skill, My Progress (live page snapshot, every journey).                                                                                          |
| 1.2     | ✅     | More drawer: Explore more, For families, For teachers, Settings (Larger text, Reading font, Reduce motion, Read aloud, Learner on this device, Back up or restore); 12 destinations.               |
| 1.3     | ✅     | Journey 1, 10 runs: grade chooser lists K–8, nothing preselected, then one primary action and "Choose a different skill".                                                                          |
| 1.4     | ✅     | Journey 4, 10 runs: returning learner sees the grade and one Continue action.                                                                                                                      |
| 1.5     | ✅     | Journey 3: a fresh browser opens a direct practice link and answers with no account or setup.                                                                                                      |
| 1.6     | ✅     | More → Starting-point checkup, Daily mix, Full lab; 23 / 23 legacy routes reach the lab.                                                                                                           |
| 1.7     | ◐      | Exactly one primary action on home (journeys 1, 4). Other screens judged from 12 screenshots only; "no long text above the first action" is not measured. Work: audit each screen.                 |
| 2.1     | ✅     | Grade chosen once, then the library opened with no grade in the address shows it selected.                                                                                                         |
| 2.2     | ✅     | All 9 grades: strands shown equal the grade's strands (4, 4, 8, 6, 8, 6, 9, 5, 5), 0 empty strands.                                                                                                |
| 2.3     | ✅     | All 128 cards have a name and a one-line sentence. K–5 titles are plain and task-shaped; formal vocabulary appears only in grades 6–8 (16 titles), as 4.L asks.                                    |
| 2.4     | ✅     | `search.test.mjs`: 35 everyday queries (13 Spanish) find their strand. Before this pass "take away" and Spanish queries found nothing.                                                             |
| 2.5     | ◐      | Learn new / Keep practicing / Review chips render with counts and filter. "Review (due)" with seeded practice history was not driven in a browser.                                                 |
| 2.6     | ✅     | 128 / 128 cards are name + sentence + exactly one Start button (a mini meter appears once started).                                                                                                |
| 2.7     | ✅     | Grade → Start is 2 actions; every one of the 128 skills opens from `?grade=&skill=&stage=` with no setup (640 / 640 loads).                                                                        |
| 3.1     | ✅     | See it has a picture on all 128 skills in both languages; concept and worked example 128 / 128.                                                                                                    |
| 3.2     | ✅     | Try it: 35 living models + 93 engine builds, 0 guided fallbacks; a model is present on all 128.                                                                                                    |
| 3.3     | ✅     | Practice: one problem, answer box, Check, help only on request (640 / 640 loads, journeys 3 and 4).                                                                                                |
| 3.4     | ✅     | Misconception feedback 128 / 128 (286 detectors), "Picture it" correction after a miss, a new problem, difficulty chosen from the record, transfer after 3 independent answers (seen live as "Problem 4 · New context"). |
| 3.5     | ✅     | Compact 8-segment meter; direct practice links work.                                                                                                                                               |
| 4.A–G   | ✅     | Concept, example, Try it, guided attempt, transfer, misconceptions: 128 / 128 each (`fluency-redesign-coverage.md`).                                                                               |
| 4.Q     | ◐      | Tested: no answer in any help rung (0 leaks), steps match the models (6,400 items). Not machine-checked: consistent vocabulary, no undefined terms, no repetition. No outside reader. Work: item 5. |
| 4.L     | ◐      | Written per grade band by the content sessions; there is no readability gate. Work: add one.                                                                                                       |
| 4.R     | ✅     | `authored/ratios-6.js`; ratio-tape model agrees with an independent count on 144 settings (`studio-model-ratio-tape.test.mjs`).                                                                    |
| 5.1     | ✅     | One SVG style; labels at least 14px and no overlap at 320px (`legible.js`, measured when shipped in `9d0db672dd`); 0 overflow in 70 runs.                                                          |
| 5.2     | ◐      | 106 / 128 skills are drawn by an engine; 22 are not (help ladder has no picture). Work: item 2.                                                                                                    |
| 5.3     | ✅     | Quantities agree with the models (alignment test); descriptions follow the language (27,185 / 27,185); axe 0 serious or critical.                                                                  |
| 5.4     | ◐      | Colour is paired with labels by design; axe checks contrast, not whether colour is the only cue. Work: item 4.                                                                                     |
| 6.1     | ✅     | `shell/SCHEMA.md`; `shell-content.test.mjs` validates all 128.                                                                                                                                     |
| 6.2     | ✅     | One frame carries picture, notation and caption; the equation line and description now follow the language.                                                                                        |
| 6.3     | ✅     | Predict points before the reveal; no text-only click-through.                                                                                                                                      |
| 6.4     | ✅     | One "Help me understand" ladder (hint → picture → steps) plus "Another way"; 15,600 leak checks.                                                                                                   |
| 7.1     | ✅     | The relevant model opens on Try it; the full library is More → Math tools and models.                                                                                                              |
| 7.2     | ◐      | Models are tested for synchronization (`authored/g68.test.mjs`, `fluency-studio.test.mjs`); keyboard, reset, undo and bounds are not audited model by model. Work: item 4.                         |
| 7.3     | ✅     | Ratio Studio audit shipped in `aeef14e9da`; `studio-model-ratio-tape.test.mjs` passes.                                                                                                             |
| 8.1     | ✅     | Practice layout verified in screenshots and 640 loads.                                                                                                                                             |
| 8.2     | ✅     | Correct answers acknowledged; the meter and celebration follow (`meter-awards.test.mjs`).                                                                                                          |
| 8.3     | ✅     | On production, answering 50 for "50% of 8" shows the authored "25% is one-fourth: 25% of 40 means split 40 into four equal groups" with a picture.                                                  |
| 8.4     | ✅     | The meter counts independent first-try answers only; supported work shows "counted separately".                                                                                                    |
| 9.1     | ✅     | Next problem from the learner's record (`difficulty`, evidence), prerequisites, transfer; next-skill strip. Unit-tested; never validated against learner outcomes.                                  |
| 9.2     | ✅     | Misconception categories per skill drive feedback, 128 / 128.                                                                                                                                      |
| 9.3     | ✅     | My Progress shows remembered / improving / next; existing records preserved (backup round trip tested).                                                                                            |
| 10.1    | ◐      | axe WCAG 2.2 AA 0 serious or critical on 1,274 + 120 page states; no keyboard traps; 3px focus ring; 44px targets; reduced motion verified. Not run: screen reader, forced colors, 200% zoom, 400% reflow. Work: item 4. |
| 10.2    | ◐      | Bilingual vocabulary, frames, read-aloud wired; Spanish covered by sweeps but never reviewed by a native speaker. Work: item 3.                                                                    |
| 10.3    | ✅     | One Español / English button plus More → Settings.                                                                                                                                                 |
| 10.4    | ◐      | K pre-reader: read-aloud control and picture verified (journey 5). The full audio-first flow, a family session and a projector run were not driven end to end.                                      |
| 11      | ✅     | **Was ✗ at the start of this pass.** `shell/DESIGN.md` now documents the tokens, components, rules and guarding tests.                                                                             |
| 12      | ◐      | Routes and parameters 23 / 23; storage keys shared; profiles and backup tested. Print, SCORM and receipts not re-verified.                                                                         |
| 13      | ◐      | Every skill is reviewed by automated tests and the 640-page sweep; no human per-skill review. Work: item 5.                                                                                        |
| 14      | ✅     | 35 living models, "Picture it" coaching after a miss, continuity (meter, next-skill strip, the language switch keeps your place).                                                                  |
| 15      | ✅     | Reuses the rewards record (no second economy), no second framework, data-driven Spanish and search, 0 TODO or placeholder text in the new code.                                                    |
| 16      | ◐      | 5 widths, journeys 1–7, no overflow, no console errors; LCP / INP / CLS measured. Phone LCP misses 2.5s (home 3.4s, skill 4.9s). Work: item 1.                                                      |
| 17      | ✅     | Scored with evidence in section 7 of the report.                                                                                                                                                   |
| 18      | ✅     | Report, before/after screenshots, preservation and coverage reports, test results, scores, readiness and work list.                                                                                |

**Tally:** 53 lines. 40 met, 13 partly met, 0 wholly unmet. The partial lines are 1.7, 2.5, 4.Q, 4.L, 5.2, 5.4, 7.2,
10.1, 10.2, 10.4, 12, 13 and 16.

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

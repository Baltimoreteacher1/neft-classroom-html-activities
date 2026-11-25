# The Language Page — logic model

**Status:** a theory of change, written 2026-11-25. It states what the product is built to do and how each step could be
measured. **It is not evidence of impact, and the site makes no efficacy claim** (`claims-ledger.md`, C-006: "An efficacy
study is in planning" ships only with `efficacy-plan.md` present). Counts below are measured from the repository on
2026-11-24; outcomes are hypotheses.

## The problem
Multilingual learners in grades K–8 need to learn English for school while learning school subjects. Their teachers have
little time to differentiate practice, can rarely tell whether a learner did a task alone or with support, and families who
speak another language have few ways to take part.

## Inputs
| Input | What exists today (measured) |
| --- | --- |
| Authored practice | 933 core activities (K 35, Gr 1 59, Gr 2–3 90, Gr 3–5 286, Gr 6–8 463); 22 Writing Studio tasks; 34 Speaking Studio tasks; 1,432 vocabulary words with Spanish glosses; 774 sentence-level practice items |
| Supports | Three levels on every studio task: frames and words, word bank, on my own; Spanish directions for K–3; Spanish interface for all grades |
| Platform | Local-first lab (progress stays on the device), optional class codes with alias-only joining, teacher hub, WIDA Data Studio (teacher-typed scores, runs in the browser) |
| Human input | Teacher time to choose tasks and read evidence. **No human content review has been recorded** (`reviewStatus: "automated-checks-only"` on all 508 reviewed fields) |

## Activities
1. A learner chooses a task and a support level, does the task, and gets specific feedback that describes what is on the page.
2. Work done **on my own** is recorded as independent; work done with frames, a word bank or a model is recorded as supported.
3. A teacher reads class evidence (supports used, independence, misconceptions) and picks the next small-group task.
4. A family sees what the learner practised, in English and Spanish, and is offered a short at-home task.

## Outputs (countable now or soon)
- Tasks started and finished, by domain and grade band (stored on the device; class totals when a class is joined).
- Share of finished tasks done independently versus with support, per learner and per task type.
- Drafts kept per writing task, so first and later drafts can be compared.
- Teacher actions: tasks assigned, evidence read, small groups formed (not yet instrumented; see the future Evidence Graph).

## Outcomes (hypotheses)
| Horizon | Outcome | How it could be measured | Status |
| --- | --- | --- | --- |
| Short (weeks) | Learners complete more language practice at an appropriate level of support | Output counts above | measurable |
| Short | Learners need fewer supports on repeated task types | Independence share over time | measurable |
| Medium (a term) | Writing and speaking quality rises on the practice rubric (a classroom rubric, **not** WIDA's) | Rubric dimensions on kept drafts, scored by a teacher | needs scoring protocol |
| Medium | Teachers spend less time deciding what to teach next | Teacher survey, time log | not yet designed |
| Long (a year) | Growth on the official ACCESS for ELLs result | Official scores typed by a teacher, with the 2025–26 scale reset handled (`wida-score-rules.md`) | requires a comparison design (`efficacy-plan.md`) |

## Assumptions and risks
- Learners and teachers use the product with fidelity (see `pilot-kit.md`).
- Practice transfers to the official test and to classroom work. This is the central untested assumption.
- Spanish and any other language text is machine-drafted until a bilingual reviewer signs it off (H-05, H-13).
- Recorded human listening audio does not exist yet; listening uses synthesized speech (audit E1).
- Practice scores are classroom feedback, never a WIDA level, prediction or placement.

## What this model does not claim
No improvement in test scores, no research basis beyond the authors' design choices, no district adoption, no award.

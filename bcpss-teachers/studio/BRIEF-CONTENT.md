# Content-author brief (lesson packs, vocabulary, activities)

Read first: BRIEF-COMMON.md, STUDIO-SPEC.md (lesson pack, vocab collection, activity data, standards registry, hard rules), the engine schema docs `engines/*.schema.md` for every engine you use, and the finished examples `data/activities/gold-*.js` and `data/vocab/gold-*.js`. Visual specs render through `core/visuals.js` (see its JSDoc for the spec shape of every kind; icon names via `listIcons()`).

You author, for each lesson in your allocation:
1. `data/lessons/<id>.js` — a COMPLETE pack per the spec (every section; no thin sections). Sequence reads like a real teacher-ready plan: concrete teacher moves, actual problems/prompts/passages, real answers and worked solutions, misconceptions with the wrong thinking named, pacing. Original passages, problems and examples only; no publisher text.
2. `data/vocab/<collection>.js` — 8–14 entries for the lesson (18+ if your allocation says COMPREHENSIVE). Every entry with a purposeful visual spec (diagram, model, annotated scene) — not decoration. Spanish only when you are certain; otherwise omit `es`. Honest `noVisualReason` for connector/abstract words.
3. `data/activities/<id>.js` — the activities assigned to your lessons, using the engines named in your allocation, in the exact shape of the engine schema docs; each with real misconception feedback, 3 graduated hints that never state the answer, tiered supports (ee/dev/exp/br), reflection frames for all four tiers, and a transfer item where the engine supports one.
4. `data/standards/<yourworkerid>.js` — registry entries for every standard code you cite (framework per taxonomy.js; paraphrased text; only codes you are certain exist). Do not duplicate codes another worker is adding: check `data/standards/*.js` first (use `rg -n "code:" data/standards`).

Gate: `node tools/validate-studio.mjs --only <your-file-fragment>` must be clean for every file you add (run often). Also load each activity in the real player and click through it with Playwright (wrong answer -> hint -> model path included) at least once per engine; fix content/engine mismatches by editing YOUR content; report engine bugs to the lead in your final report with exact repro (do not edit engine files).

Content standards (the editorial pipeline stages: accuracy, curriculum alignment, WIDA/language review, usefulness, design, accessibility, functional, approval):
- Accuracy: every math answer recomputed (add `calc` where an item is arithmetic); every science/history/ELA fact is one you are certain of; if unsure leave it out. Spanish only if certain.
- Curriculum honesty: `curriculum.status:"standards-aligned"` and a `note` ("Aligned to <standards>; not mapped to a district unit sequence") unless a BCPSS seed unit really matches (check with `node -e` against data/bcpss-curriculum-seed.mjs: grade, subject, unit_title) — then use `district-referenced` + `unitId`.
- Language: language objective names a function and a structure; `languageDemands` lists real barriers (polysemy, idioms, long noun phrases) specific to YOUR text; supports change by tier but the task and answers never change. Frames are natural classroom language.
- Subject authenticity: use the activity types, visuals, discourse and strategies that belong to the discipline (SUBJECT_PROFILE in taxonomy.js). A kindergarten science lesson looks nothing like a high school argument lesson: age-appropriate text length, picture-first for PK–2, analytic text for 9–12, no sentence-frame baby talk for older learners.
- No fabricated curriculum, no invented textbook lesson numbers, no claims of district adoption, no official WIDA items. Standards text is paraphrase.
- 10–12 sentence-per-section limit on prose blocks; teachers skim. Student-facing text at an appropriate reading level for the grade.
- Everything must read as finished: no TODO, no "example here", no lorem, no "...".


## SCOPE: K–8 ONLY
Allocations are K–8. No Pre-K, no grades 9–12. Where an old note says high school, author the grade 7–8 equivalent.

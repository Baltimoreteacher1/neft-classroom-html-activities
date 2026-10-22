# Practice Studio v3 roadmap

Rebuilt 2026-10-21 from the build brief after the original scratchpad roadmap was lost. Companion specs:
`practice-studio-v2.md`, `AUDIT_REPORT.md`, `data/audit/studio-audit/`.

## Rules (every wave)

- Every feature applies to ALL lessons in Units 2-9 (practice and challenge), fitted to each lesson's skill. Check every lesson, not a sample.
- English + Spanish only. Nothing timed. A wrong answer never reveals the answer. WCAG 2.2 AA. No formula before the lesson that teaches it.
- Change sources and generators, regenerate, commit both. Never patch generated pages by hand.
- Fresh worktree off origin/main (`npm ci && npm run build` first). Gates run bare. One ship at a time; rebase before shipping.
- Ship only through `ALLOW_DEPLOY=1 npm run ship -- <sha>...`, then `npm run ship -- --verify`. Never `--no-verify`, never force-push, never manual wrangler.

## Waves

| Wave | Scope | Status |
| ---- | ----- | ------ |
| W0 | P0 defect fixes | LIVE |
| W1a | Content intelligence: misconception taxonomy (`data/practice-studio/misconceptions.json`), every MC distractor tagged in Units 2, 3, 5-9, generated and converted distractors named | LIVE |
| W1b | Clarity: problem-first layout, "I can" target, Context/Ask styling, "Hint 1 of 3" labels, feedback anatomy, exit card, header Menu, word-bank preview, typeset fractions | LIVE |
| W1c | Visual system v2 / dark theme: neutral reading text, stepped surfaces, per-world hue families, `prefers-color-scheme` default, on-accent tokens, contrast test for 12 worlds x light/dark | LIVE |
| W-U4 | Bring Unit 4's 10 hand-built pages (`math/unit-4/`, `assets/u4-studio.{js,css}`) to parity incl. taxonomy tags. Migrate to `data/practice-studio/4-x.json` only if every item, figure and story card is kept 1:1; otherwise port into u4-studio. Never lose content. Decision: ported into u4-studio, not migrated (bespoke renderers). Dark theme + Theme control LIVE; taxonomy tags, named wrong-answer help and My thinking for all 466 wrong choices built; Context/Ask stems, stacked fractions, hint ladders on T1-T3/T5, word bank and mission card still open | in progress |
| W2 | Learner model, rewards v2, repair loop, confidence tap, seals (spec: `studio-v3-w2.md`) | LIVE |
| W3 | Worked examples + fading, "Which move?" kind, two-tier diagnostic, Trap Book UI (spec: `studio-v3-w3.md`) | W3a (Trap Book, tier two) LIVE; W3b (worked examples) LIVE; W3c ("Which move?") built, shipping |
| W4 | Explore-first opener, linked-representations workbench, models for the 13 lessons in AUDIT_REPORT.md | |
| W5 | Teach the Rookie, The Guide (existing /api/tutor), math-to-speech, portfolio | |
| W6 | Data Drops, Teacher Pulse stage A, offline PWA | |

Open question on W1b: the brief lists a "skill checklist" next to the "I can" target; no definition survived. The chip shows the
lesson's `contentObjective`. A per-skill checklist needs a skill field on items, which the data does not have yet; decide with W2's learner model.

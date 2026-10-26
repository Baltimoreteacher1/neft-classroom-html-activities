# Fluency Lab family upgrade: implementation matrix

This matrix records verified delivered work and remaining master-prompt scope. Partial means a bounded working slice, not full prompt completion. The last independently verified production stamp in this run was `a227172269`; `origin/main` has since advanced to `54226503f3`. The nightly family experience is live. This follow-up adds configured teacher-to-family links and remains unreleased until its guarded ship completes.

## Nonnegotiable requirements

| # | Requirement | State | Implementation / evidence |
|---|---|---|---|
| 1 | Implement every specified feature | Open | This change delivers the family entry page and shared-engine links only. See phase matrix. |
| 2 | Preserve existing Fluency Lab behavior and records | Partial | Existing problem bank, local profile store, adaptive mission, practice, games, path and language services remain in use. Query entry points were added in `math/fluency-lab/app.js`; change-scoped release checks passed. |
| 3 | Reuse shared architecture | Partial | `family/family.js` uses `tutor-engine.js`, `school-tools.js`, `i18n.js` and `problem-bank.js`; no new practice engine. |
| 4 | Every control works; no fabricated results | Partial | Grade/profile/language selection, skill links, five-stage nightly session controls, evidence-based session summary, mission/practice/game/progress navigation, and print coaching control are wired. Browser and core tests cover complete, paused, resumed, and profile-isolated nightly sessions. |
| 5 | Correct, grade-appropriate math | Partial | Added eight Kindergarten skills with validated generated practice, visual lessons, Fact Trail coverage, and grade 0 persistence. Grades 1–8 remain intact; comprehensive standards and content review remains open. |
| 6 | Multi-device learner experience | Partial | Responsive layouts and reduced-motion CSS added. Local 390 px and 1365 px checks passed; the live family route was verified at 390 px. Broader device coverage remains open. |
| 7 | Premium original design and game mechanics | Partial | Ten named math-driven game experiences now span the existing signature games and interactive puzzle worlds. Comprehensive publisher visual review remains open. |
| 8 | Free, accountless core and minimal child data | Partial | No account/network/data collection added; launch URLs include only grade, local profile slot, skill and mode. |
| 9 | Accessibility, English/Spanish and scaffolding | Partial | Semantic controls, focus styles, reduced motion, bilingual family copy and existing learner language engine integration. WCAG review is open. |
| 10 | Integrate learner state and feedback | Partial | Family entry reads profile-scoped tutor evidence. The nightly session now records retrieval and independent answers with `recordAnswer`, lesson completion with the existing visual lesson, and family challenge answers as supported evidence. |
| 11 | Automated math, integration, accessibility, performance and E2E tests | Partial | Added seeded Kindergarten correctness/attribution tests, all nine puzzle worlds, and a five-stage nightly E2E including pause/resume, English/Spanish, Axe, mobile layout, and independent-versus-supported evidence. Broader performance, assistive-technology, and device coverage remains open. |
| 12 | Requirement-to-evidence checklist | Partial | This matrix documents the current slice and every prompt phase; each phase still has open work. |
| 13 | Do not call unfinished work complete | Met | Final report will distinguish delivered, verified, and open items. |
| 14 | Fix release-gate findings | Met | Fixed the test-read manifest conflicts and generated catalog drift found while assembling the release. Final pre-push QA passed. |
| 15 | Preserve production if gates fail | Met | The guarded `ship` path blocked two attempts until dependencies and test-read coverage were corrected. No bypass was used. |
| 16 | Deploy only after validation and verify live pages | Met for Kindergarten/game-world release | Commit `a227172269` passed the build-stamp check and all 41/41 production smoke checks; direct route loads, internal family links and real practice launch were verified. `origin/main` later advanced to `54226503f3`; this session has not independently checked that unrelated release. The nightly-session follow-up remains pending release. |
| 17 | Report exact external blockers | Met | There is no infrastructure blocker. The unimplemented requirements below remain product scope, not external blockers. |
| 18 | Begin with actual repository inspection | Met | Owning Cloudflare Pages repository, current feature worktree, repo instructions, local adaptive engine, profiles and release guard inspected. |

## Phase coverage

| Phase | State | Source changes and verification evidence |
|---|---|---|
| 1. Architecture audit and foundation | Partial | Existing app, profiles, evidence, skill bank, family summary and release scripts inspected. Complete inventory and compatibility migration remain open. |
| 2. Family Math Tonight | Partial | Landing page, profile selector, Kindergarten–8 grade/skill selection, evidence-based recommendation, mission/practice/game/progress links, seven-day entry list, bilingual coaching card, and print control are wired. The follow-up adds Retrieval → Conceptual model → Independent practice → Family challenge → Reflection/next step, with generated problems, actual tutor evidence, interruption recovery, and independent/support distinction. QR link builder, notifications, household nicknames, and fully cooperative turn-taking games remain open. |
| 3. Learning intelligence | Partial | Family recommendations use current `recommendations()`, `difficulty()`, `adaptiveProblem()`, and `recordAnswer()` evidence, including due review skills and prerequisites for a first warm-up. Full skill DNA, misconception taxonomy, strategy fingerprinting, and support-fading policy remain open. |
| 4. Thinking Studio and feedback | Partial | Nightly sessions reuse `mountVisualLesson()` and generated question validation/hints. The full family-side explain/revise/transfer cycle and additional manipulatives remain open. |
| 5. Ten premium games | Partial | Number Garden, Ten-Frame Factory, Array Architects, Division Harbor, Fraction Forge, Decimal Dashboards, Ratio Racers, Integer Expedition, Equation Engineers, and Graph City are represented. Added worlds include interactive models, exact checks, hints/revisions, levels, local rewards, and evidence attribution. Expanded asset, replayability, sound, and accessibility review remains open; existing games are preserved. |
| 6. Premium UI/UX | Partial | Family page design tokens, responsive layout, custom math illustration, focus treatment, print styling and reduced-motion handling added. Broader age-band design system and browser review remain open. |
| 7. Family reporting | Partial | Family page links to the existing profile-specific progress view and uses actual local evidence to generate skill-specific English/Spanish coaching prompts. The coaching card separates recent independent checks from supported practice and explicitly identifies when a skill has not been measured. A broader evidence dashboard, weekly summaries and family conversation history remain open. |
| 8. Teacher command center | Partial | Existing teacher studio now creates Family Math Tonight links with grade/skill, 5- or 10-minute length, English/Spanish, challenge range and support settings. Links contain no profile or learner record, provide preview/copy/QR/print actions, and launch the existing nightly engine. Browser validation covers Spanish, 10-minute, skill-building, extra-support link creation and same-site launch. Roster-based evidence, intervention groups, secured teacher reporting and content review remain open. |
| 9. Content publishing | Partial | `familyLaunch()` validates grades, profiles, modes and grade-scoped skill IDs. Authoring, standards audit, content version workflow and comprehensive edge-case suites remain open. |
| 10. Accessibility and language | Partial | English/Spanish family copy, semantic labels, focus, reduced motion, and 1,157-string Spanish placeholder coverage including Kindergarten and new game worlds. Full WCAG 2.2 AA and screen-reader review remains open. |
| 11. Privacy and persistence | Partial | No server storage; existing profile-scoped local evidence is read; no learner data enters share URLs. Migration/export/recovery review remains open. |
| 12. Learning impact | Open | No analytics or observatory added. |
| 13. QA and release gates | Partial | Family launch contracts, seeded Kindergarten answers/evidence/lessons/trail/persistence, exact puzzle solutions, and complete five-stage nightly E2E with English/Spanish, Axe, profile isolation, pause/resume, and route boundaries are tested. Full performance, assistive-technology, and prompt-wide content coverage remains open. |
| 14. Workflow and deployment | Partial | Prior family and game releases were pushed and production-verified. This follow-up passes focused family-session, tutor, family-route, fluency-bank, browser and custom teacher-link checks; commit and guarded production release are pending. |

## Current route contract

- Family landing: `/math/fluency-lab/family/`
- Family nightly session: `/math/fluency-lab/family/tonight.html?grade={grade}&skill={skill-id}&lang={en|es}&minutes={5|10}&challenge={range}&support={standard|extra}` (teacher links omit profile; learner selects the local profile) (no learner name, response, or progress in the URL)
- Nightly mission: `/math/fluency-lab/?profile={slot}&grade={grade}&start=mission`
- Skill practice: `/math/fluency-lab/?profile={slot}&grade={grade}&skill={grade}:{skill-id}&start=practice`
- Games: `/math/fluency-lab/?profile={slot}&grade={grade}&view=games`
- Progress: `/math/fluency-lab/?profile={slot}&grade={grade}&view=path`
- Starting-point checkup: `/math/fluency-lab/?profile={slot}&grade={grade}&start=checkup`
- Everyday story practice (where supported): `/math/fluency-lab/?profile={slot}&grade={grade}&start=realworld`

Launch links contain no learner names, answers, explanations, or progress values. The shared bank now supports Kindergarten (grade 0) and Grades 1–8.

All live family-page anchors were checked in a browser: they resolve to `/math/fluency-lab/` or `/math/fluency-lab/family/`; none point to the EduWonderLab homepage or another product section. Skill launch was verified to open a real Fluency Lab problem.

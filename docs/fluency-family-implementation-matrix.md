# Fluency Lab family upgrade: implementation matrix

This matrix records the deployed family-entry slice. “Partial” means a working, bounded slice exists; it does not mean the full prompt requirement is complete. Production serves commit `24aadedce4` (October 26, 2026). The master transformation remains unfinished; open scope is listed below.

## Nonnegotiable requirements

| # | Requirement | State | Implementation / evidence |
|---|---|---|---|
| 1 | Implement every specified feature | Open | This change delivers the family entry page and shared-engine links only. See phase matrix. |
| 2 | Preserve existing Fluency Lab behavior and records | Partial | Existing problem bank, local profile store, adaptive mission, practice, games, path and language services remain in use. Query entry points were added in `math/fluency-lab/app.js`; change-scoped release checks passed. |
| 3 | Reuse shared architecture | Partial | `family/family.js` uses `tutor-engine.js`, `school-tools.js`, `i18n.js` and `problem-bank.js`; no new practice engine. |
| 4 | Every control works; no fabricated results | Partial | Grade/profile/language selection, skill links, mission/practice/game/progress navigation, and print coaching control are wired. Planner, browser, accessibility and live-route checks passed for this slice. |
| 5 | Correct, grade-appropriate math | Partial | Family route launches the existing validated grade 1–8 bank. Kindergarten and expanded content are not implemented here. |
| 6 | Multi-device learner experience | Partial | Responsive layouts and reduced-motion CSS added. Local 390 px and 1365 px checks passed; the live family route was verified at 390 px. Broader device coverage remains open. |
| 7 | Premium original design and game mechanics | Partial | New family visual system and illustration are implemented. Signature-game expansion is open. |
| 8 | Free, accountless core and minimal child data | Partial | No account/network/data collection added; launch URLs include only grade, local profile slot, skill and mode. |
| 9 | Accessibility, English/Spanish and scaffolding | Partial | Semantic controls, focus styles, reduced motion, bilingual family copy and existing learner language engine integration. WCAG review is open. |
| 10 | Integrate learner state and feedback | Partial | Reads profile-scoped tutor evidence and routes practice into the existing state/evidence pipeline. Family-specific session result state is open. |
| 11 | Automated math, integration, accessibility, performance and E2E tests | Partial | Added planner contract test and an Axe + Playwright family/practice route test. Change-scoped release QA passed 14/14 and the production smoke passed 41/41. Comprehensive K–8, game, performance, assistive-technology and session-persistence coverage remains open. |
| 12 | Requirement-to-evidence checklist | Partial | This matrix documents the current slice and every prompt phase; each phase still has open work. |
| 13 | Do not call unfinished work complete | Met | Final report will distinguish delivered, verified, and open items. |
| 14 | Fix release-gate findings | Met | Fixed the test-read manifest conflicts and generated catalog drift found while assembling the release. Final pre-push QA passed. |
| 15 | Preserve production if gates fail | Met | The guarded `ship` path blocked two attempts until dependencies and test-read coverage were corrected. No bypass was used. |
| 16 | Deploy only after validation and verify live pages | Met for this slice | Commit `24aadedce4` is live. Build stamp, 41/41 production smoke checks, direct route loads, internal family links and real practice launch were verified. |
| 17 | Report exact external blockers | Met | There is no infrastructure blocker. The unimplemented requirements below remain product scope, not external blockers. |
| 18 | Begin with actual repository inspection | Met | Owning Cloudflare Pages repository, current feature worktree, repo instructions, local adaptive engine, profiles and release guard inspected. |

## Phase coverage

| Phase | State | Source changes and verification evidence |
|---|---|---|
| 1. Architecture audit and foundation | Partial | Existing app, profiles, evidence, skill bank, family summary and release scripts inspected. Complete inventory and compatibility migration remain open. |
| 2. Family Math Tonight | Partial | New `/math/fluency-lab/family/` landing experience; profile selector; grade and skill choice; recommendation from stored learner evidence; mission/practice/checkup/story-practice/game/progress links; seven-day entry list; bilingual coaching card; print control; visible notice if a family preference cannot save. Full family session sequence, share QR builder, notifications, household nicknames and family co-op flows remain open. Story prompts currently apply only where the existing bank has a safe whole-number story form. |
| 3. Learning intelligence | Partial | Family recommendations use current `recommendations()` evidence and mission/practice flows. Full skill DNA, misconception taxonomy, support fading and content mutation expansion remain open. |
| 4. Thinking Studio and feedback | Partial | Existing visual lesson and feedback flows are reused. New family-side models and full explain/revise/transfer cycle remain open. |
| 5. Ten premium games | Open | Existing games are linked; no new signature game is delivered in this slice. |
| 6. Premium UI/UX | Partial | Family page design tokens, responsive layout, custom math illustration, focus treatment, print styling and reduced-motion handling added. Broader age-band design system and browser review remain open. |
| 7. Family reporting | Partial | Family page links to the existing profile-specific progress view and uses actual evidence for next-skill coaching focus. New evidence dashboard, summaries and conversation generator remain open. |
| 8. Teacher command center | Open | No teacher tools added in this slice. |
| 9. Content publishing | Partial | `familyLaunch()` validates grades, profiles, modes and grade-scoped skill IDs. Authoring, standards audit, content version workflow and comprehensive edge-case suites remain open. |
| 10. Accessibility and language | Partial | English/Spanish family copy, semantic labels, keyboard focus and reduced-motion styles. Automated/manual WCAG 2.2 AA and screen-reader review remain open. |
| 11. Privacy and persistence | Partial | No server storage; existing profile-scoped local evidence is read; no learner data enters share URLs. Migration/export/recovery review remains open. |
| 12. Learning impact | Open | No analytics or observatory added. |
| 13. QA and release gates | Partial | `tools/fluency-family.test.mjs` covers route validation and every current Grade 1–8 skill link; `tools/verify-fluency-family-browser.mjs` covers generated practice launch, profile selection, bilingual copy, mobile/desktop overflow, first keyboard focus and serious/critical Axe violations. Change-scoped QA passed 14/14, the deploy smoke passed 41/41, and both public routes plus in-scope links were verified. Full prompt-wide assistive-technology, performance and content coverage remains open. |
| 14. Workflow and deployment | Met for this slice | Commits `6e4e532ee0` and `3b73d41d97` were assembled on current `main`; release commit `24aadedce4` was pushed, deployed and verified with the repository's guarded ship workflow. |

## Current route contract

- Family landing: `/math/fluency-lab/family/`
- Nightly mission: `/math/fluency-lab/?profile={slot}&grade={grade}&start=mission`
- Skill practice: `/math/fluency-lab/?profile={slot}&grade={grade}&skill={grade}:{skill-id}&start=practice`
- Games: `/math/fluency-lab/?profile={slot}&grade={grade}&view=games`
- Progress: `/math/fluency-lab/?profile={slot}&grade={grade}&view=path`
- Starting-point checkup: `/math/fluency-lab/?profile={slot}&grade={grade}&start=checkup`
- Everyday story practice (where supported): `/math/fluency-lab/?profile={slot}&grade={grade}&start=realworld`

Launch links contain no learner names, answers, explanations, or progress values. The current shared bank supports Grades 1–8; Kindergarten is not available and is intentionally not presented as supported on this page.

All live family-page anchors were checked in a browser: they resolve to `/math/fluency-lab/` or `/math/fluency-lab/family/`; none point to the EduWonderLab homepage or another product section. Skill launch was verified to open a real Fluency Lab problem.

# Fluency Lab family upgrade: implementation matrix

This matrix records what this implementation actually covers. “Partial” means a working, bounded slice exists; it does not mean the full prompt requirement is complete. Production release remains gated on the repository's complete release checks.

## Nonnegotiable requirements

| # | Requirement | State | Implementation / evidence |
|---|---|---|---|
| 1 | Implement every specified feature | Open | This change delivers the family entry page and shared-engine links only. See phase matrix. |
| 2 | Preserve existing Fluency Lab behavior and records | Partial | Existing problem bank, local profile store, adaptive mission, practice, games, path and language services remain in use. Query entry points were added in `math/fluency-lab/app.js`; regression validation pending. |
| 3 | Reuse shared architecture | Partial | `family/family.js` uses `tutor-engine.js`, `school-tools.js`, `i18n.js` and `problem-bank.js`; no new practice engine. |
| 4 | Every control works; no fabricated results | Partial | Grade/profile/language selection, skill links, mission/practice/game/progress navigation, and print coaching control are wired. Browser verification pending. |
| 5 | Correct, grade-appropriate math | Partial | Family route launches the existing validated grade 1–8 bank. Kindergarten and expanded content are not implemented here. |
| 6 | Multi-device learner experience | Partial | Responsive layouts and reduced-motion CSS added; device/browser checks pending. |
| 7 | Premium original design and game mechanics | Partial | New family visual system and illustration are implemented. Signature-game expansion is open. |
| 8 | Free, accountless core and minimal child data | Partial | No account/network/data collection added; launch URLs include only grade, local profile slot, skill and mode. |
| 9 | Accessibility, English/Spanish and scaffolding | Partial | Semantic controls, focus styles, reduced motion, bilingual family copy and existing learner language engine integration. WCAG review is open. |
| 10 | Integrate learner state and feedback | Partial | Reads profile-scoped tutor evidence and routes practice into the existing state/evidence pipeline. Family-specific session result state is open. |
| 11 | Automated math, integration, accessibility, performance and E2E tests | Partial | Added planner contract test and an Axe + Playwright family/practice route test. Comprehensive K–8, game, performance, assistive-technology and session persistence coverage remains open. |
| 12 | Requirement-to-evidence checklist | Partial | This matrix documents the current slice and every prompt phase; each phase still has open work. |
| 13 | Do not call unfinished work complete | Met | Final report will distinguish delivered, verified, and open items. |
| 14 | Fix release-gate findings | Open | Gate execution is pending. |
| 15 | Preserve production if gates fail | Met | Repository deployment guard and `ship` gate will be used; no direct deploy path. |
| 16 | Deploy only after validation and verify live pages | Open | Explicitly authorized by the user; release awaits passing gates and successful live verification. |
| 17 | Report exact external blockers | Open | Will be updated after release checks. |
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
| 13. QA and release gates | Partial | `tools/fluency-family.test.mjs` covers route validation and every current Grade 1–8 skill link; `tools/verify-fluency-family-browser.mjs` covers generated practice launch, profile selection, bilingual copy, mobile/desktop overflow, first keyboard focus and serious/critical Axe violations. Full release QA, assistive-technology, performance and production checks remain pending. |
| 14. Workflow and deployment | Partial | Existing guarded release path identified. Commit, push/deploy and public verification are pending gates. |

## Current route contract

- Family landing: `/math/fluency-lab/family/`
- Nightly mission: `/math/fluency-lab/?profile={slot}&grade={grade}&start=mission`
- Skill practice: `/math/fluency-lab/?profile={slot}&grade={grade}&skill={grade}:{skill-id}&start=practice`
- Games: `/math/fluency-lab/?profile={slot}&grade={grade}&view=games`
- Progress: `/math/fluency-lab/?profile={slot}&grade={grade}&view=path`
- Starting-point checkup: `/math/fluency-lab/?profile={slot}&grade={grade}&start=checkup`
- Everyday story practice (where supported): `/math/fluency-lab/?profile={slot}&grade={grade}&start=realworld`

Launch links contain no learner names, answers, explanations, or progress values. The current shared bank supports Grades 1–8; Kindergarten is not available and is intentionally not presented as supported on this page.

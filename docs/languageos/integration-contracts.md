# Integration contracts: world engine and Science Investigation Lab

Hard rules: no timers or student-visible time limits; no accounts or cloud student data; no AI or network calls; no recordings stored;
no scores, levels or predictions shown; help never states an answer; opening any help marks the attempt `supported`; English and Spanish only;
learner text never enters the ledger.

## Files (disjoint ownership)
Engine worker: `access-practice-lab/src/content/science-lab.js`, `access-practice-lab/src/lang/science-lab.js`, `tools/access-science-lab.test.mjs`.
View worker: `access-practice-lab/src/views/science-lab.js`, `access-practice-lab/science-lab.css`, intercept in `src/views/worlds.js`,
`<link>` in `index.html`, whitelist entry in `src/store.js`, `tools/access-science-lab-e2e.mjs`, `tools/access-visual-qa.mjs` row, `package.json` wiring,
`PLATFORM.md` row, then `node tools/sync-access-shell.mjs`.

## Route and state
- Routes: `/worlds/science-lab` (hub) and `/worlds/science-lab/<stage>` where stage is one of the 12 ids below. `?case=<id>` selects a case.
- State key `accessPracticeLab:v1:science-lab`. Must be added to the import whitelist and merge in `store.js` so the Passport carries it.

## Stages (STAGES, in order)
`notice, question, hypothesis, plan, collect, represent, claim, evidence, reasoning, revise, present, reflect`.

## Content (`src/content/science-lab.js`)
`export const CASES = { "6-8": [...], "3-5": [...] }`, `export const STAGES`, `export const STAGE_META = {id:{title:{en,es}, domain, klu}}`.
A case: `{ id, band, title:{en,es}, phenomenon:{en,es}, vocab:[...], variables:[{id,label:{en,es},values:[...]}], dataset:{rows:[{conditions:{...}, measures:{...}}], unit, note},
transfer:{...} }`. Datasets are authored classroom sample data, labelled as such, never presented as real measurements.

## Engine (`src/lang/science-lab.js`, pure, no DOM/storage)
`parseState(raw)`, `caseState(state, band, caseId)`, `updateStage(state, band, caseId, stage, patch)`, `setSupport(state, band, caseId, level)`,
`noteHelp(state, band, caseId, stage, helpId)`, `workKind(caseState, stage)` -> `"supported" | "independent"`, `stageStatus(...)`, `progress(...)`,
`checkQuestion(text, caseDef)`, `checkHypothesis(text, caseDef)`, `checkPlan(plan, caseDef)`, `checkClaim(text, caseDef)`,
`checkReasoning({claim, evidenceIds, text}, caseDef)`, `checkRevision(before, after, caseDef)`, `reflectionPrompts(caseState)`,
`toLedgerEntries(stage, result, ctx)` -> partial entries for `appendEntry` with `src:"science-lab"`.
Every check returns `{ok: boolean, notes: [{id, quote, ask}]}`: `quote` is a span of the learner's own text, `ask` is a question, never an answer or a score.

## Ledger
Only `kind:"first"` entries reach the skill graph. Write `domain` Writing (question..reasoning, revise, reflect) or Speaking (present, typed transcript),
`use` from Key Language Use (Narrate/Inform/Explain/Argue), numeric `m` from `analyzeResponse(...).ledger`. Never store text.

## Tests
`tools/access-science-lab.test.mjs` (node:test): case completeness, help never states an answer, no score claims, every check quotes learner text and asks a question,
supported-vs-independent, ledger entries carry no text, state round-trips through Passport import. `tools/access-science-lab-e2e.mjs`: Playwright + axe at 375 and 1440,
complete all 12 stages, reload resume, Spanish, no console errors, no timers.

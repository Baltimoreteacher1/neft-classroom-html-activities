# ACCESS Practice Lab: item bank quality record

This records how the 320-item practice bank was checked, what was found, and what has **not** been done. It is an honest account, not a certification.

## How the bank was checked

1. **Automated validators** (`npm run validate:access-bank`, 27 mutation tests in `tools/access-acc-bank.test.mjs`): schema, one key per item, a reason for every wrong choice, word limits, duplicate and near-duplicate detection (including prompts for speaking and writing), WIDA catalog ids that match the framework file, original provenance, honest review status, no timer language, no "official" or level claims.
2. **Simulated sittings** (`tools/access-acc-bank-smoke.test.mjs`, `tools/access-acc-bank-e2e.mjs`): every item renders; every key scores right and every wrong choice scores wrong; one full set per domain and grade band taken through the real interface.
3. **Independent reviewer pass**: four separate AI reviewers each audited one domain's 80 items without having written them (accuracy, a single defensible key, answer cues, supports that give the answer away, cultural load, grade fit, near-duplicates). Findings: about 197 (13 errors, the rest warnings and uncertain items). No arithmetic errors. Recurring issues: answer-length cues, supports that mirrored the key, items in the same set revealing each other, shaky science details, near-duplicate scenarios, word-limit overages.
4. **Fix pass**: four fix agents addressed every error and warning in their domain. A small number of suggestions were declined where the fix would have broken a protected field (item type, Key Language Use, context, band, WIDA ids); each was handled another way and logged.
5. **Re-validation** after the fixes: 40 sets, 0 errors, 0 warnings; all tests above pass against the delivered files.
6. **Computed grouping**: `tools/access-acc-bank-parallel.mjs` assigns `meta.parallel` (54 groups, 135 items) from grade band, domain, context, Key Language Use and first language function. `--check` fails if a file drifts.
7. **Quantitative report**: `npm run report:access-bank` (writes `reports/access-bank-report.md`).

## What has not been done

- **No item has been reviewed by a person.** Every set says `reviewStatus: "automated-checks-only"`. A teacher or subject specialist should read the science, history, geography and mathematics claims. Each item lists them in `meta.facts` (454 claims) to make that quick.
- **No psychometric study.** Practice bands (early, building, strong) are authors' estimates, not calibrated difficulty.
- **No test of real voices.** Listening uses the browser's text-to-speech; intelligibility depends on each device's voices and was not tested on classroom hardware. The simulated sittings use a stub speech engine.
- **Microphone levels and speaker output** were exercised only with a synthetic capture device.
- **Spanish** is interface text only, machine-assisted, and not reviewed by a human translator. Item content, rubric text and language-function names are English.
- **Not WIDA material.** The bank is original. It does not reproduce or imitate secure WIDA/DRC items, passages, recordings or rubrics. Standard identifiers come only from the framework catalog in this repo; combinations the framework does not list are labelled supplementary.

## Items worth a human look first

- `b68-read-03` was rewritten around the transcontinental railroad (dates and figures are standard but unchecked by a person).
- `b35-read-02` garden table now measures healthy seedlings after three weeks.
- Fictional data in speaking and writing prompts (bridge numbers, market survey, science-fair times, typing rates, ant passage) is invented practice material.
- `b68l04-2` (a matching item) can still be solved partly by a plausible insulation order.
- Spoken "Mr." titles in listening clips should be heard once on the real voice.
- The b35 writing sets ask for roughly 300 to 340 minimum words in 40 minutes; a teacher may want to adjust the sitting time.

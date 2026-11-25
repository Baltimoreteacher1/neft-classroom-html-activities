# The Language Page platform expansion: coverage map, 2026-11-24

The request was a 24-section brief for a premium, integrated K-8 language platform. Discovery showed the lab
(`access-practice-lab/`, live at thelanguagepage.com) already has a surface for most sections. Rebuilding those under new
names would have added duplicate navigation, which the brief itself forbids (section 19), so this pass built only the gaps
that could be verified, and this file records what each section maps to today.

## Built in this pass

| Route                          | What                                                                                                                        | Section |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| `/demand`                      | Language Demand Analyzer: paste a task, see language barriers with quoted evidence, steps, pre-teach words, frames, checks. | 12      |
| `/teach-back`                  | Teach It Back: 24 concepts (3-5, 6-8), type or record, rule-based feedback quoting the learner, revise, new idea unaided.   | 16      |
| `/claim-check`                 | Misconception Detective: find the flawed line, sort evidence from assumption, fix it, explain.                              | 16      |
| `src/platform/entitlements.js` | Feature entitlement foundation: every feature free, nothing enforced, no payment code.                                      | 20      |

Docs: `DEMAND.md`, `TEACH-BACK.md`, `CLAIM-CHECK.md` under `access-practice-lab/`. Tests: `tools/demand.test.mjs`,
`tools/teach-back.test.mjs`, `tools/claim-check.test.mjs`, `tools/entitlements.test.mjs`, plus browser checks
`tools/demand-e2e.mjs`, `tools/teach-back-e2e.mjs`, `tools/claim-check-e2e.mjs` (shared harness `tools/lib/lab-e2e.mjs`).
The three views are in the Explore directory and search; none is in the top navigation or on the home screen.

## Brief section to what already exists

| Brief section                     | Existing surface (route)                                                                                                                                            | Status                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 3 Adaptive journeys               | Skill check-in `/diagnostic`, My Language Path `/path`, Connected Pathways `/pathways`, Journey `/journey`, Language DNA, gradual release `src/lang/fade.js`        | Exists. Not re-planned in this pass.                                                |
| 4 Language worlds                 | Language City `/city`, Language Worlds `/worlds`, Living Simulations `/simulations`, Real-Life Scenarios `/scenarios`, Adventure Worlds, Science Exhibition         | Exists (7 worlds, 27 scenarios). Space station, airport, marketplace not confirmed. |
| 5 Speaking and conversation       | Speaking Studio `/speak`, Voice Lab `/voice`, Conversation Simulator, Argument Arena `/arena`, Partner Talk                                                         | Exists. Local recording only.                                                       |
| 6 Academic language laboratory    | Writing Studio `/write`, TWR `/twr`, Sentence Lab `/sentences`, Evidence Studio `/evidence`, Academic missions `/missions`                                          | Exists. Discipline pathways for health, technology, arts not confirmed.             |
| 7 Literacy ecosystem              | Reading Path, Science of Reading Studio, Reading Room, Reading Ladder, Immersive Reader, Book Studio, graphic novels                                                | Exists.                                                                             |
| 8 Vocabulary discovery            | Word Lab `/wordlab` (755 words, cognates, morphemes), Vocabulary Academy, Word Builder, BCPSS term bank                                                             | Exists. Cross-activity word encounter tracking not built.                           |
| 9 Writing workshop                | Writing Studio, Sentence Lab, Mentor Text Explorer, Language Time Machine (draft comparison)                                                                        | Exists.                                                                             |
| 10 Cross-curricular missions      | Academic missions, Language Expeditions, Experience Builder (teacher text to playable mission)                                                                      | Exists. The ten example projects are not each authored.                             |
| 11 Teacher resource studio        | Activity Studio, Lesson Builder, Launch Studio, Book Studio templates, Experience Builder                                                                           | Exists.                                                                             |
| 12 Curriculum intelligence layer  | BCPSS Language Studio and Writing Lab (`/bcpss-teachers/`, 162 units, 1,584 lesson companions); **demand analyzer added here**                                      | Partly new. Verified district mapping exists for BCPSS units only.                  |
| 13 Instructional dashboard        | WIDA Data Studio, Teacher Hub, Forecast Engine                                                                                                                      | Exists. Not changed.                                                                |
| 14 Digital portfolio              | My portfolio `/portfolio`, Passport `/passport`, Time Machine                                                                                                       | Exists. Teach It Back adds ledger entries it can read.                              |
| 15 Family companion               | Talk Table, Families hub, Family Corner, family guides, Family app shells                                                                                           | Exists.                                                                             |
| 16 Signature features             | Language Time Machine (Replay), Pathways (One Concept), Story Creator, Language Transfer in Teach It Back; **Teach It Back and Misconception Detective added here** | Mixed. See not built.                                                               |
| 17 Game ecosystem                 | 23 games (`LAB-INVENTORY.md`), Arcade, Language Quest                                                                                                               | Exists. Not changed.                                                                |
| 18 Visual standard                | `ds.css` tokens, DESIGN-SYSTEM.md                                                                                                                                   | Followed by every new view.                                                         |
| 19 Integration without complexity | Registry-driven nav and Explore (`sitemap.js`)                                                                                                                      | New views are directory-only.                                                       |
| 20 Commercial readiness           | Feature flags `src/lang/feature-flags.js`; **entitlement foundation added here**                                                                                    | Foundation only. No consumers yet.                                                  |

## Not built, and why

- School-level collections, organisation settings and usage analytics (section 20): need accounts and a data
  model that does not exist; adding them without that would be a placeholder.
- A site-wide "Language Lens" overlay and cross-activity word-encounter tracking (sections 8, 16): a cross-cutting
  change to every view, too large to do safely alongside the above.
- Cross-curricular missions for health, technology and arts, and the ten named example missions (sections 6, 10).
- Illustrations, neural audio and speech recognition: no keys or authorisation; recording stays on the device.
- No new navigation entries, home-screen tiles or tours were added, on purpose.

## Review status

All Spanish text was written without native review. Rule-based feedback is a heuristic: it can miss a correct
explanation phrased unexpectedly, which is why each tool shows the learner's quoted words and offers a self-check.
No review from external roles (students, teachers, families, accessibility specialist) has taken place; checks were
automated axe plus real-browser runs. That has not replaced a person using it.

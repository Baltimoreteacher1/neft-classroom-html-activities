# Claude Code prompt — The Language Page Award Program (v2, extended)

> Paste everything below the line into Claude Code, opened at the root of `neft-classroom-html-activities`.
> It is written to be run across many sessions. Each session picks up at the first unfinished phase in
> `docs/language-page/program-state.md`.

---

## ROLE AND MISSION

You are the lead engineer, editor-in-chief and program director for **The Language Page** (`https://thelanguagepage.com`). It is the ACCESS Practice Lab (`access-practice-lab/`), served from this repo under its own hostname. Host routing is in `functions/_lib/language-page.js`. Sibling surfaces are `access-teacher/` (Teacher Hub + WIDA Data Studio), `/studios` (proxied Worker), `learning-studios/`, `language-studio/`, `language-adventures/`, `bcpss-teachers/`, `wida-access/`.

**North star.** Every multilingual learner in grades K–8 gets three things:

- a clear path through academic English;
- support in their own language that fades as they grow;
- an honest record of what they can do independently.

Their teacher knows what to teach tomorrow. Their family can take part in their language. Every claim the product makes is true.

Your mission is to make The Language Page the product that juries in six domains point to as the reference standard:

- curriculum;
- ESOL/ELD;
- writing;
- educational technology;
- innovation in education;
- futures of learning.

Make it genuinely excellent and provably honest. Never make it merely look excellent. Where the field's norm is weak, set a better one and document why.

The baseline is `docs/language-page/award-panel-audit-2026-11-24.md`. Read it fully before anything else. Every finding ID in it (C1–C6, E1–E7, W1–W5, T1–T8, X1–X5) must end this program in one of three states:

- **closed, with proof**;
- **handed to a named human** in `docs/language-page/human-required.md`;
- **declined by Joel**, with his words recorded.

New findings you discover are added to the same ledger with new IDs and held to the same rule.

The composite score today is 6.1/10. Two exit bars apply:

1. The project's roadmap gate: **every panel lens ≥ 8/10**.
2. This program's stretch bar: **every lens ≥ 9/10 from an independent mock jury** (see Operating Model).

Both are scored against evidence in `docs/language-page/reports/panel-<phase>.md`.

No shortcuts:

- Do not trim scope to save tokens.
- Do not stub a feature and call it done.
- Do not lower a gate to make it pass.
- Do not substitute a document for a working feature where a working feature is asked for.

## STEP 0 — MAKE SURE THE BASELINE FILES ARE HERE (every session, before anything else)

The audit and this prompt were added on branch `claude/dreamy-lamport-ryoydb` (PR #230). Until that PR is merged into `main`, a fresh checkout of `main` does not contain them.

1. Check for the audit:

   `test -f docs/language-page/award-panel-audit-2026-11-24.md && echo present || echo missing`

2. If it is **missing**, fetch the branch that holds it:

   `git fetch origin claude/dreamy-lamport-ryoydb`

   Then:
   - **Starting the program:** run `git checkout -b language-page-award-program FETCH_HEAD`, and commit all program work on `language-page-award-program`.
   - **Already on a program work branch:** run `git merge --no-edit FETCH_HEAD`. If the merge is refused or conflicts, stop and tell Joel.
   - **Never** push to `main` to get the file, and never cherry-pick it onto `main`.
3. If the fetch fails (branch deleted, no network), check whether PR #230 was merged:

   `git fetch origin main && git log origin/main --oneline -- docs/language-page/award-panel-audit-2026-11-24.md`

   - If merged: branch from `origin/main`.
   - If not merged: stop and ask Joel for the audit. Do not reconstruct it from memory, and do not continue without it.
4. Confirm both files exist:
   - `docs/language-page/award-panel-audit-2026-11-24.md`
   - `docs/language-page/award-program-prompt.md`

   Record which branch they came from in `program-state.md`.

## READ FIRST (in this order, every session)

1. `CLAUDE.md` and `AGENTS.md`: the Closed-Loop QA Protocol, hard constraints, v6.0 release rules, and *Regression pins vs product decisions*.
2. The skills `generated-files`, `qa-gate-triage`, `student-experience-review`, `deploy`, and `curriculum-alignment` (for standards work). Load each before the work it covers.
3. `docs/language-page/award-panel-audit-2026-11-24.md`, `roadmap.md`, `human-required.md` and `claims-ledger.md`.
4. All `access-practice-lab/*.md`, especially:
   - `PLATFORM.md`, `CONTENT.md`, `CONTENT-QA.md`, `DESIGN-SYSTEM.md`, `ARCHITECTURE_PLAN.md`;
   - `BOOK-STUDIO.md`, `EXPERIENCE-BUILDER.md`, `FAMILY.md`, `JOURNEY.md`;
   - `LANGUAGE-INTELLIGENCE.md`, `PATHWAYS.md`, `TIME-MACHINE.md`, `VOCAB-ACADEMY.md`.
5. Platform, data and quality docs:
   - `docs/class-platform.md`, `docs/wida-*.md`, `docs/language-page-migration.md`;
   - `docs/languageos/*.md`, `docs/family-app/language-page-*.md`;
   - `reports/language-page-quality/REPORT.md` and `RUBRIC.md`;
   - `data/product-decisions.json`.
6. `docs/language-page/program-state.md`. Create it on first run, using the schema in **Operating Model**.

## NON-NEGOTIABLES (override anything later in this prompt)

1. **Never change what an existing URL answers without asking Joel first.**
   - That covers redirects, gates, moves and renames.
   - `validate:route-contract` is the backstop, not the permission.
   - New routes are fine. Existing routes keep answering.
2. **Product decisions belong to Joel.**
   - Look up any decision-shaped behaviour in `data/product-decisions.json` before touching it.
   - Never create or reverse a decision yourself.
   - When Joel decides, record his exact words and flip the check in the same commit.
3. **Never fabricate.** Never invent:
   - testimonials, quotes, efficacy numbers, research citations or study results;
   - awards, adoptions, partnerships or logos;
   - human review sign-offs or native-speaker approval;
   - recorded human audio or sign-language video;
   - official WIDA, DRC, CCSS or NGSS text.

   What a person must do goes into `human-required.md` with an owner and a drop-in point, and the pipeline accepts their work without code changes. Content you author keeps `reviewStatus: "automated-checks-only"` until a human signs it off. Machine-drafted languages stay labelled as drafts.
4. **Honesty rules stay intact.**
   - "Original practice aligned to WIDA… not an official assessment."
   - "Stamps are not a score."
   - No invented proficiency, levels or exit predictions on student surfaces.
   - Scaffolded work is never counted as independent.
5. **Children's privacy.**
   - Identity and recordings stay on-device unless the learner explicitly shares them.
   - No third-party analytics unless Joel approves, and the privacy text then names it exactly.
   - No student initials, IEP or 504 status, or SPED labels on student-facing surfaces.
   - No PII is ever sent to a model.
   - Data minimisation by default: collect nothing you do not use, and delete on schedule.
6. **AI contract.**
   - The model *selects among authored moves*, *asks questions*, or *plays an authored character inside authored bounds*.
   - It never writes the student's work, never scores, and never sees identity.
   - Every AI endpoint is listed in `PLATFORM.md` with payload, storage and retention.
   - Every endpoint has a model card and an eval suite (WS9).
7. **Visual rules (v6.0).**
   - Palette: navy `#17324D`, teal `#1FA6A2`, warm off-white `#F7F4EC`, amber `#F2C15B`, body text `#24323F`. Coral may distinguish speaking.
   - No violet, purple or indigo. Run `npm run validate:no-purple`.
   - 44 px targets, visible 3 px focus, reduced motion, semantic landmarks, WCAG 2.2 AA minimum.
8. **Generated files.**
   - Never hand-edit generated output.
   - Trace each change to its generator.
   - Regenerate indexes, import maps, cache hashes, critical CSS, printables, the service worker and illustrations.
9. **No added teacher prep and no physical manipulatives.**
10. **No manipulative engagement design.**
    - No streak-loss pressure, countdown timers by default, or loot-box mechanics.
    - No variable-reward loops tied to time-on-app, and no shaming copy.
    - Rewards celebrate effort and independence, never mere screen time.
11. **Security by default.**
    - Strict CSP, SRI on any third-party script, least-privilege API keys and input validation on every endpoint.
    - No secrets in the repo; run `validate:secrets`.
    - Auth stays frozen per `AUTH_CONTRACT.md`.
12. **Representation and cultural safety.**
    - Names, contexts and images reflect the multilingual communities the product serves.
    - No stereotypes, and no deficit framing of home languages or cultures. Home languages are assets.
13. **Independent judging.** Mock-jury agents (Operating Model) never see your self-assessment, your scores or your conclusions. They get the product, routes, code and the program's published criteria only.
14. **Git and deploy.**
    - Work on a feature branch and commit per workstream.
    - Never run `wrangler` or `npm run deploy`.
    - No push to `main` and no ship until Joel says so. Then use only `ALLOW_DEPLOY=1 npm run ship -- <sha…>`, followed by `npm run smoke:live`.
15. **Closed loop.**
    - Nothing is "done" without the gate that proves it, its output, and a real-browser check per `student-experience-review`.
    - A red gate means you fix the code or the detector (`qa-gate-triage`). Never weaken the gate.

## STAGE 0 — DECISIONS ONLY JOEL CAN MAKE (ask before building)

Use `AskUserQuestion` in batches of up to four. Put your recommendation first, marked "(Recommended)". Record every answer in `data/product-decisions.json` with his words. Until a decision is made, build only what does not depend on it.

| ID | Decision | Recommended default |
| --- | --- | --- |
| D1 | **Identity**: one name and one promise. | *The Language Page*, with a plain promise line ("English for school, in your language, K–8"). "ACCESS Practice Lab" becomes one section. |
| D2 | **Cloudflare analytics beacon** on all 85 pages vs. the "no third-party analytics" privacy text. | Remove it from this host and keep the first-party aggregate `/api/signal`. Alternative: keep it and rewrite the privacy text exactly. |
| D3 | **Teacher Hub and Data Studio served with no password** (`LAB_HOST_OPEN`, his decision of 2026-11-17). | Keep it open. Add a "Teacher area — no student data stored here" banner, and prove that no answer keys or scoring anchors are reachable from student navigation. |
| D4 | **Data Studio forecasts** vs. the v6.0 rule "never predict ACCESS scores or placement". | Teacher-only, validated-only, interval-only, with a written scoped exception in v6.0. Alternative: remove the forecasts. |
| D5 | **Sibling apps** `language-studio/` and `language-adventures/`: no source in the repo, a separate design, failing 44 px. | Retire them into the lab as rebuilt lab routes. Old URLs keep answering; redirects only with approval. |
| D6 | **"BCPSS Teachers" door on the public home.** | Move it to a district landing linked from the Teachers door. |
| D7 | **Grade-band label**: 3–5 vs 4–5. | "Grades 3–5" everywhere. |
| D8 | **Home-language packs**, in priority order. | Order by district enrolment data. Default: Arabic, Dari, Pashto, Haitian Creole, Portuguese, Mandarin, Vietnamese, French. |
| D9 | **Human-review owners and budget**: bilingual reviewer, WIDA-trained reviewer, voice talent, accessibility reviewer, legal/privacy reviewer, usability lead, sensitivity reviewer, ASL interpreter. | Named owners in `human-required.md`. Tooling is built regardless. |
| D10 | **Award targets this cycle.** | One per domain from audit §4. Verify current criteria and deadlines on the official sites. |
| D11 | **Accounts and rostering** (roadmap listed them as out of scope; `/api/class` already exists). | Keep alias-only class codes as the default. Add LTI 1.3 + OneRoster import behind a district flag, with no student PII at rest beyond the alias map held by the teacher. |
| D12 | **Grades 9–12.** | Out of scope this cycle. State the scope honestly everywhere. |
| D13 | **AI conversation partner** for speaking practice (authored characters, bounded turns, no free generation of student work). | Pilot behind a teacher toggle, only after the WS9 eval suite passes. |
| D14 | **Content licence.** | Keep content all-rights-reserved. Publish the *schemas, gates and method* under an open licence so others can adopt the standard. |
| D15 | **Pilot partner and advisory board**: a school or classes for usability and pilot work, and an advisory board of a multilingual educator, a family member, a researcher, an accessibility expert and a student voice (via a protocol). | Joel names people. Build the protocols now. |
| D16 | **Public transparency.** | Publish a changelog, a quarterly transparency report (data, AI, review coverage) and a public roadmap on `/trust`. |

## OPERATING MODEL

- **Phases follow `docs/language-page/roadmap.md` (P0–P9).** Workstreams map onto them. A phase closes only when:
  - its gates are green;
  - its browser checks are done;
  - `docs/language-page/reports/panel-<phase>.md` meets both exit bars, or names the exact human-only blockers.
- **Self-panel.** For each lens plus Trust & Evidence, report:
  - a score;
  - three strengths, with proof;
  - remaining gaps, by finding ID;
  - what would raise the score one point.

  Score adversarially.
- **Independent mock jury** (at the end of every phase, and for every award target in WS15).
  - Spawn one fresh subagent per lens: curriculum, ESOL/ELD, writing, edtech, innovation, futures, plus one for trust.
  - Each gets only:
    - the live or preview URL;
    - the route list;
    - read access to the repo;
    - that lens's criteria, written from public award rubrics and professional standards (TESOL 6 Principles, WIDA 2020 framework, UDL 3.0, WCAG 2.2, ISTE Standards, Digital Promise certification criteria, ESSA evidence tiers).
  - It never sees your notes.
  - It must cite routes, files or measurements for every score.
  - Record its report verbatim in `docs/language-page/reports/jury/<phase>-<lens>.md`. Act on what it finds, and log disagreements with evidence.
- **Program state.** Keep `docs/language-page/program-state.md` current with:
  - the phase;
  - workstream status (`not started` / `in progress` / `blocked: <who>` / `done: <commit>`);
  - the finding ledger;
  - the decisions log;
  - the human-required queue;
  - a risk register (risk, likelihood, impact, mitigation, owner);
  - the last gate results.

  Update it at the end of every session.
- **Dependency order.** WS1 first. WS2 and WS6 next (shell and performance unblock everything). WS3 before WS4/WS5 content volume. WS9 before any new AI feature. WS15 starts in P2 and runs throughout.
- **Parallelism.**
  - Independent workstreams run in parallel subagents with narrow briefs, explicit files and their own gates.
  - Use `isolation: "worktree"` when files overlap.
  - If Joel says "use a workflow", run workstreams as a workflow with a review-and-verify stage each.
  - Merge sequentially and run the gates after every merge.
- **Commit hygiene.** One logical change per commit. Messages name the finding IDs. Never use `--no-verify`.

---

## WORKSTREAM 1 — TRUTH & TRUST (P2, start immediately; closes X1–X5, E4)

1. **Privacy truth (X1).**
   - Implement D2.
   - Build `tools/validate-language-page-network.mjs`:
     - It loads every sitemap route in Chromium on the `thelanguagepage.com` host model and records every third-party host contacted.
     - It fails on any host missing from `data/language-page-third-parties.json` (purpose, data sent, retention) or not named on the privacy page.
     - It self-tests on a fixture that loads a disallowed host.
   - Correct "Audio is never uploaded" to the real opt-in behaviour everywhere: the privacy view, C-004, `FAMILY.md` and family pages.
   - Wire the gate into `validate:access-lab` and `qa:fast` COVERAGE.
2. **Claims gate (X4).**
   - Build `tools/access-lab-claims.test.mjs`:
     - Rendered claims carry `data-claim="C-00x"`.
     - A claim without a `verified` row in `claims-ledger.md` fails.
     - Any evidence, efficacy, award or "research shows" phrase without a claim id fails.
   - Write negative fixtures first. Add the test to `npm test`.
3. **Spanish tagging (E4, corrected).**
   - Measured live: in Spanish mode ~99% of Spanish text is already inside `lang="es"`, and `<html lang>` stays `en` by design. Do not "fix" `<html lang>` without asking Joel.
   - Build a browser gate across the sitemap in `?lang=es` and EN+ES: Spanish text nodes inside `lang="es"` must be ≥ 98%. Report the untagged strings by route.
   - Do not auto-wrap breadcrumbs or other plain `I.S` strings: they can also carry English activity titles, and wrapping them would mislabel English as Spanish.
   - Extend `scan:access-es` to rendered output.
4. **Governance alignment (X5).**
   - Record D3, D4, D5 and the AI-writing endpoint.
   - Add `/api/class/ai/writing` and `/api/class/ai/hint` to the `PLATFORM.md` AI list.
   - Rewrite the four docs that contradict `language-page.js`.
   - Build `tools/language-page-docs-truth.test.mjs`, which reads exported constants and fails when a doc states the opposite. Self-test it.
5. **Trust centre.** New routes, EN and ES, each with meta description, OG image and correct `lang`:
   - `/access-practice-lab/trust`:
     - plain-language privacy, and what is stored where;
     - AI use, with model cards (WS9);
     - accessibility statement and ACR link;
     - live review-coverage counts generated from content metadata;
     - security contact (`/.well-known/security.txt`);
     - changelog;
     - transparency report (D16).
   - `/access-practice-lab/method`:
     - how the product teaches: WIDA "aligned to", gradual release, integrity rules, feedback design, translanguaging stance;
     - every claim carries a claim id.
6. **Data rights.**
   - A learner-facing "My data" page: see, export (JSON and print) and delete everything stored on this device.
   - A teacher class-data export and delete on `/api/class`.
   - Prove deletion with a test.

**Proof:**
- all new gates green, with their self-tests;
- the network gate fails when the beacon is re-added in a scratch fixture;
- screen-reader spot check with `@guidepup/virtual-screen-reader` if installed, else log H-10.

## WORKSTREAM 2 — IDENTITY, SHELL & NAVIGATION (P1–P3; closes C6, E7, T2, T3, T5)

1. **One identity (D1)** across:
   - masthead, `brand.js`, titles, OG tags and manifest;
   - Teacher Hub (it currently reads "ACCESS Practice Lab — Teacher Hub") and the Data Studio.

   Extend `tools/access-move.test.mjs` brand pins to the hub.
2. **Audience-first home.**
   - **Students:** choose a grade band, then see **one** "Today" card and **one** "Continue" card. Everything else is one tap away.
   - **Adults:** the promise, the signature innovations (WS10), a trust line, and doors for Teachers, Families and District (D6).
   - An "I'm new to English" door leads to the newcomer and SLIFE path (WS4).
   - Every existing URL keeps answering.
3. **Role default (E7).**
   - The home door sets the role, and the role persists.
   - With no choice yet, student routes default to Student.
   - Teacher and Family toggles appear only after those doors, or on teacher routes.
   - An e2e test in a fresh context on 10 student routes asserts the Student view.
4. **Chrome budget (T2).**
   - One header: logo, search, language (once), grade, role menu.
   - One contextual section nav.
   - The duplicate language banner is removed once a choice is stored.
   - Budget: content `h1` at **≤ 140 px** from the top at 1366×768 and **≤ 180 px** at 390×844. No header wrap at 1280 px.
   - Gate it with a browser measurement.
5. **Plain names.**
   - Rename student-facing features to what a 10-year-old would say. For example, "Interactive Language Learning Engine" becomes "Learn a language move", and "Echo-Self Time-Lapse Growth Mirror" becomes "See how my writing grew".
   - Keep the route slugs.
   - Put the old→new table in `docs/language-page/naming.md`.
   - `sitemap.js` is the single source of names (EN/ES).
6. **Wayfinding.**
   - Every activity ends with a "Keep going" strip: the next mission step, one related practice, and back to path.
   - Search is ranked by the learner's band and current mission.
   - Fix `/access-expedition/` silently leaving the host.
7. **Siblings (D5, T3, T4).**
   - Implement Joel's choice.
   - Ported content lives on the lab shell and tokens; old paths keep answering.
   - Survivors pass the 44 px, contrast, palette and axe gates.
8. **SEO and sharing (T5).**
   - Generate per-route title, meta description and OG image from `sitemap.js` (EN/ES), plus `hreflang` alternates and JSON-LD (`EducationalApplication`, `LearningResource` with `educationalAlignment`).
   - Fix the 9 duplicate titles and the 2 missing descriptions.
   - Gate: unique titles, descriptions 50–160 characters, OG image resolves, JSON-LD valid.

## WORKSTREAM 3 — CURRICULUM SPINE (P4A, P4D; closes C1–C5)

1. **Scope and sequence.**
   - Build `access-practice-lab/content/spine/<band>.json`: Units → Weeks → Missions. Each mission declares:
     - WIDA Key Language Use;
     - content area;
     - domains;
     - can-do targets;
     - language objective;
     - success criteria;
     - stations (existing tasks, games and worlds, by id);
     - formative check;
     - independence check;
     - a unit **performance task** (an authentic multi-domain product with an audience).
   - Every activity is placed in a mission or marked `bank-only` with a reason.
   - Generate from this data: the student "My Path" map, a teacher unit planner, printable unit overviews, and a public scope-and-sequence page.
   - Gate `validate:language-page-spine`:
     - every mission resolves;
     - no orphaned flagship content;
     - KLU balance within ±10% of target;
     - every unit covers every domain;
     - prerequisites are acyclic;
     - every unit has a performance task with a rubric.
2. **Standards crosswalks.**
   - Map every mission to WIDA ELD Standards Framework 2020: standard, KLU, language expectations, proficiency-level descriptors range. Use codes and names only; never reproduce WIDA text.
   - Map content connections to CCSS ELA, NGSS and C3 by code.
   - Mark inferred mappings for H-03.
   - Generate a crosswalk report and a public alignment page.
   - Gate: no unknown codes, against the code lists in `data/`.
3. **Single phonics scope (C2).**
   - Consolidate on `src/sor/` Phonics Path.
   - Add an oral-first **phonemic awareness strand**: rhyme, onset-rime, blending, segmenting, deletion, substitution.
   - Map the Reading Path decodables and `early/phonics-progression.js` onto it, or retire them behind existing URLs.
   - Fix the duplicate "said" and the 19-consonant Unit 1.
   - Add L1-transfer notes per phoneme for D8 languages, marked for linguist review (H-06).
   - Gate:
     - cumulative-code check on every decodable;
     - no sight word introduced twice;
     - a new-element limit per lesson.
4. **Tagging schema (C3).**
   - Write a controlled vocabulary in `content/metadata/vocab.json`.
   - Backfill tags for all 933 core activities, 320 bank items, 183 Reading Room lessons and all studio tasks.
   - Inferred tags carry `inferred: true`.
   - Gate: 100% tagged, vocabulary-only values, and a coverage matrix in `docs/language-page/reports/coverage-matrix.md`.
5. **K–2 parity (C4).** Per band:
   - ≥ 24 Speaking Studio tasks;
   - ≥ 24 Writing tasks (draw-label-tell → shared → guided → independent);
   - ≥ 60 Listening and ≥ 60 Reading activities, KLU-tagged;
   - 2 practice-test forms, labelled as practice.

   Everything original, with Spanish directions and `automated-checks-only`.
6. **Sustained reading (C5).**
   - 6–8: 300–900-word informational and literary texts; 3–5: 200–600 words. Each has quantitative and qualitative complexity notes.
   - Scaffolded entry: preview, key vocabulary, audio, chunking. The text is never replaced by a simplified version.
   - Text-dependent questions at DOK 1–3, plus a written response.
   - Gate: length bands met, distractor rationales present, answer positions balanced.
7. **Core-curriculum bridges.**
   - Generalise the BCPSS bridge pattern into a district-agnostic **Curriculum Bridge** schema: a core unit maps to a language demands analysis, missions and frames.
   - Ship at least the existing BCPSS mappings on it.
   - Document how a district adds its own.

## WORKSTREAM 4 — ESOL/ELD DEPTH (P4A–P4C; closes E1–E3, E5, E6)

1. **Human-audio pipeline (E1).**
   - Audio manifest `content/audio/manifest.json`. Each entry holds: item id, script hash, speaker id, variety/accent, pace, duration, VTT, transcript, `status: placeholder | recorded | reviewed`.
   - An adult **Recording Studio** route:
     - script, level meter, retake, trim;
     - VTT generated from the script;
     - export named by item id;
     - local storage only.
   - A player that prefers recorded audio and falls back to TTS with a visible "computer voice" label.
   - A target speaker mix: at least 6 speakers across varieties of English, including multilingual speakers of English.
   - Gate:
     - every listening item has a manifest row;
     - every recording has captions and a transcript;
     - a script edit invalidates its recording through the hash.

   Recording is human-required. Never synthesize "human" audio.
2. **Spanish completion (E3).**
   - `directionsEs` on all 749 grade 3–8 activities.
   - Translated task titles, video titles and captions.
   - `ES-REVIEW` markers stay until H-05.
   - Gate: 0 missing, and the WS1 rendered leak gate is green.
3. **Language packs (E2, D8).**
   - `content/lang/<code>/` holds UI strings, directions, glossary, cognates and false friends, family letters, Family Companion and RTL metadata.
   - The renderer supports RTL with logical properties and per-block `dir`.
   - Draft packs in D8 order with machine-draft labels and per-string review status. A visible "Draft translation — not yet reviewed" notice shows on unreviewed packs.
   - Gate:
     - completeness per declared scope;
     - Arabic, Dari and Pashto render RTL with no overflow at 390 px;
     - no pack is marked reviewed without a reviewer id.
4. **Translanguaging by design.**
   - Every studio task has an optional "Think in my language first" step: plan or rehearse in L1 by typing or recording, then produce in English. This is recorded as support, never as independent English.
   - Add cross-linguistic "Compare my languages" moments: cognates, word order, sounds.
   - Add bilingual glossaries that learners can extend themselves.
5. **Oral language and academic conversation.**
   - Structured academic-conversation routines: paraphrase, build on, challenge, clarify. Each has frames, models and a partner protocol.
   - Speaking tasks become conversation cycles with a partner (in person or via the AI conversation partner if D13 allows).
   - Add listening-for-gist and listening-for-detail progressions.
6. **Newcomer and SLIFE path (E5).**
   - A welcome kit: survival language, school routines, a picture dictionary with audio.
   - An age-respectful foundational-literacy track for ages 10–14:
     - mature-themed decodables;
     - a numeracy–literacy bridge;
     - oral-first missions.
   - A heritage-language literacy corner: read-along in L1 where a pack exists.
   - Entered from home with no test.
   - A teacher note on how to use it.
7. **Can-do portfolio (E6).**
   - Passport v2 shows can-dos with evidence, support level and independence status.
   - Learners reflect in L1 or English.
   - It never states a WIDA level.

## WORKSTREAM 5 — WRITING (P4C; closes W1–W5)

1. **Volume and progression (W1).**
   - Per band (3–5, 6–8): **≥ 8 tasks per form** across CER, paragraph, summary, narrative, report, letter and essay, balanced across KLUs and content areas.
   - Each task has:
     - situation, task and audience;
     - sources;
     - organizer;
     - success criteria;
     - three annotated exemplars (early/building/strong) on the existing 8-dimension rubric;
     - revision prompts.
   - Gate: counts, KLU balance, exemplar annotations reference real rubric dimensions, and no repeated exemplar text.
2. **Genre pedagogy.**
   - Each form follows a Teaching–Learning Cycle:
     1. build the field (content and vocabulary);
     2. deconstruct a mentor text (from the 32 in Mentor Text Explorer, plus new ones);
     3. joint construction with the class or the coach's frames;
     4. independent construction.
   - Each stage is a distinct, skippable step with its own support level.
3. **Embedded sentence moves (W2).** Offer the matching TWR-style move *on the student's own sentence*, drawn from the 774 existing items:
   - because/but/so;
   - appositives;
   - sentence combining;
   - transitions.
4. **Translanguaging drafts.** Students may draft ideas in L1. The coach's prompts help them carry the ideas into English. The L1 draft is kept beside the English draft and recorded as support.
5. **Focused task page (W3).**
   - One source panel, one writing surface, one feedback panel.
   - Tools act only on the student's draft, when invoked.
   - The first screen at 1366×768 shows the task, the support choice and the start of the writing surface.
6. **Audience loop (W4)**, on `/api/class`:
   - a class gallery;
   - praise / question / polish peer response with frames;
   - teacher moderation before anything is visible;
   - conference notes;
   - publishing to the named audience.
7. **Publishing.**
   - A class anthology builder from approved pieces and Book Studio books.
   - Export to print-ready PDF and EPUB 3 (accessible: alt text, reading order, `lang`).
   - A "Young Authors" showcase page per class, alias-only and teacher-approved.
8. **Writing portfolio (W5).**
   - A timeline across tasks on shared rubric dimensions.
   - Learner annotations.
   - Conference export (print/PDF/Word).
   - Feeds the Evidence Graph.

## WORKSTREAM 6 — PERFORMANCE, RESILIENCE & SECURITY (P6–P8; closes T1, T4, T6, T7)

1. **Budgets** in `data/language-page-perf-budget.json`, using the ratchet pattern of `validate:family-performance`:
   - home first view **≤ 350 KB** transferred, **≤ 50 requests**;
   - one critical inline style block plus one shell sheet, and nothing else render-blocking;
   - Lighthouse mobile (Moto G Power, Slow 4G) **≥ 90**: LCP ≤ 2.5 s, CLS ≤ 0.05, INP ≤ 200 ms;
   - measured on home, `/path`, `/write`, `/speak`, `/early` and `/reading-room`.
2. **CSS.**
   - Collapse the 145 lab CSS files into a token sheet, a shell sheet and route-scoped sheets loaded by the router.
   - Remove the 120 render-blocking links.
   - Regenerate critical CSS.
3. **JS.**
   - Audit the 133 modulepreloads and preload only the home graph.
   - Lazy-load each route.
   - Keep offline mode working (`e2e:access-lab` plus an offline-pack test).
4. **Low-bandwidth mode.**
   - Detected via `navigator.connection` or a user toggle.
   - Text-first, with no autoplay video and deferred images.
   - Offline packs per unit, sized and labelled.
5. **Media.** Lazy loading, explicit dimensions, modern formats through the generators.
6. **Siblings and contrast (T4, T6).** Bring every survivor under the 44 px gate, fix the `/wida-access/` contrast, and add them to the axe sweep in EN and ES.
7. **Same-origin assets (T7).** Cover with the WS1 network gate.
8. **Security.**
   - Strict CSP with nonces or hashes (report-only first, then enforce).
   - SRI, Permissions-Policy review, and `security.txt`.
   - A threat model in `docs/language-page/threat-model.md` covering class codes, share links, AI endpoints and uploads.
   - `audit:deps` green.
   - Rate limits verified on every `/api/class` and AI endpoint.

## WORKSTREAM 7 — ACCESSIBILITY & INCLUSIVE DESIGN BEYOND COMPLIANCE (P8)

1. **Cognitive accessibility.**
   - An **Easy-read mode**: plain language, one idea per screen, larger type, icons with labels.
   - Consistent step patterns across studios.
   - Error recovery everywhere: undo, and draft autosave visible.
   - Follow the W3C COGA guidance.
2. **Input diversity.**
   - Full keyboard and switch access.
   - Voice-control-friendly labels: the visible label equals the accessible name.
   - Drag alternatives on every drag interaction.
   - Gate: an automated "label in name" check plus drag-alternative detection.
3. **Reading supports.**
   - The dyslexia option (Atkinson Hyperlegible) is extended to all studios.
   - Syllable and morpheme highlighting in read-aloud.
   - A focus ruler, with Reading Comfort settings applied everywhere.
4. **Deaf and hard-of-hearing.**
   - Captions and transcripts on every video and listening item.
   - An ASL video slot pipeline (manifest + player) for directions and stories. Recording is human-required.
   - Visual alternatives to all audio cues.
5. **Representation audit.**
   - A generated report counting names, cultures, regions, family structures, disabilities and gender across content and illustrations.
   - Targets set with Joel and the sensitivity reviewer.
   - A bias and sensitivity checklist in `docs/language-page/sensitivity-review.md`, with review status per item. Review is human-required.
6. **Assistive-tech matrix.** Manual test scripts for NVDA+Chrome, JAWS+Chrome, VoiceOver+Safari (macOS, iOS) and TalkBack+Chrome, in `docs/language-page/at-matrix.md`. Results come from humans (H-10).

## WORKSTREAM 8 — ASSESSMENT & FEEDBACK QUALITY (P4A, P9)

1. **Item quality.**
   - Raise every activity family to a mean of **≥ 4.2/5** on the existing 11-dimension rubric (`reports/language-page-quality/RUBRIC.md`).
   - Re-score with the mock jury, not yourself.
   - Fix the open items in the quality report:
     - bare "Correct!/Try again" in the early and prep players;
     - unshuffled Quest answers;
     - ~230 unreviewed listening scripts, flagged for review;
     - vocab-hub gold/XP rewards.
2. **Item analytics (privacy-preserving).**
   - Per-item difficulty and distractor-choice distributions, aggregated per class on `/api/class` only, with a minimum cell size of 10.
   - A teacher view, "Items that confused my class", linked to reteach moves.
   - An authors' view to retire or repair weak items.
3. **Rubric calibration.**
   - A teacher calibration tool: score anchor samples blind, compare with the annotated exemplars, and see agreement.
   - Exemplar library growth through the human-review pipeline.
4. **Feedback quality harness.**
   - An eval set of ≥ 300 real-shaped (synthetic, no student data) learner responses per studio, with expected feedback moves.
   - The rule-based and AI-selected feedback must hit ≥ 90% appropriate-move accuracy and 0 answer leakage.
   - Run in `npm test`.
5. **Fairness checks.**
   - Items whose wording depends on culture-specific knowledge are flagged by a lexicon plus review.
   - Directions are written below the band's reading level, checked by the readability gate.

## WORKSTREAM 9 — RESPONSIBLE AI (P6; required before any new AI feature)

1. **Model cards** for every AI endpoint, on `/trust`. Each covers purpose, inputs, outputs, providers and fallbacks, retention, known limits and evaluation results.
2. **Eval and red-team suite** `tools/language-page-ai-evals.mjs`, using a recorded-response mode for CI and a live mode for releases. Per endpoint, it tests:
   - prompt injection from student text;
   - PII echo and leakage;
   - answer leakage;
   - scoring or level language;
   - unsafe content;
   - Spanish and pack-language behaviour;
   - refusal correctness;
   - output schema validity.

   Thresholds are 0 critical failures and ≥ 98% schema validity. Results are published in the model cards.
3. **AI conversation partner (D13).**
   - Authored characters and scenarios (school office, lab partner, library, sports team).
   - The model chooses among authored response intents and may paraphrase within authored bounds.
   - Turn limits, topic fences and a visible "practice partner, not a person" label.
   - Speech in via on-device STT where available.
   - Never scores. Transcript stays on device.
   - Teacher toggle, off by default.
   - Ships only after its eval suite passes.
4. **AI literacy for learners and families.** A short EN/ES explainer of what the AI does and does not do, linked wherever AI appears.

## WORKSTREAM 10 — INNOVATION SPOTLIGHT (P5, P9)

Signature innovations:

- Book Studio 2.0;
- Experience Builder;
- WIDA Data Studio;
- Responsible AI ("AI that chooses, never writes");
- the Integrity Ledger: supports recorded, independence earned.

For each:

- a plain name and a one-line promise;
- a 60-second guided demo path in demo mode, with no account and no real data;
- a "How it works / Why it matters / What we know / What we don't know yet" page (EN/ES), with claim ids;
- a presenter view;
- an e2e test of the demo path in Chromium and WebKit;
- a 2-page technical brief in `docs/language-page/innovations/<name>.md`.

## WORKSTREAM 11 — FUTURES LAYER (P5–P6)

1. **Language Evidence Graph.**
   - A local-first IndexedDB store normalizing every attempt into: domain, KLU, can-do, support level, independence, content area, date and artifact reference.
   - Path, Growth Map, Passport, Journey and Teacher Hub are migrated behind a compatibility layer.
   - A Save/Resume integrity test proves old keys load.
2. **Passport v2.**
   - Learner-held, exportable as JSON and print.
   - Optional Open Badges 3.0 shape.
   - Explicit consent; alias only.
3. **Tomorrow's Lesson.**
   - From class evidence: a 15-minute small-group plan with grouping, one authored task, frames and an exit check.
   - Chosen from authored materials.
   - The teacher edits and approves, and it prints on one page.
4. **Family Companion.**
   - A weekly 5-minute at-home talk task in EN, ES and the D8 packs.
   - An optional voice or text reply to the teacher via `/api/class`.
5. **Multimodal Composer.** Image, voice and text, assessed on the writing rubric dimensions, exported to the portfolio.
6. **Language Time Machine.**
   - The learner compares their own earliest and latest artifacts in the same task family.
   - Guided reflection.
   - No scores.
7. **Bounded adaptive practice.**
   - Next-item selection from the Evidence Graph, using transparent rules the teacher can read and override.
   - The learner can always see why an item was chosen: "Because you are working on ___".

## WORKSTREAM 12 — TEACHER PROFESSIONAL LEARNING (P5, P9)

1. **Micro-PD modules** (10–15 minutes each, EN):
   - gradual release with the support levels;
   - reading the evidence matrix;
   - running academic conversations;
   - translanguaging in practice;
   - using the writing cycle;
   - calibrating with exemplars.

   Each has a demo-mode walkthrough, a try-it task, a reflection and a self-attested completion record (not a credential claim).
2. **PLC protocols.** Printable protocols for looking at student language evidence together, plus a facilitator guide.
3. **Coaching cycle kit.** Goal → observe (with a language-look-for tool) → debrief → next step, all stored in the teacher's browser.
4. **Implementation guide.**
   - Minimum effective dose (minutes/week per band).
   - Fidelity indicators the teacher can self-check.
   - Feeds the WS15 efficacy plan.

## WORKSTREAM 13 — FAMILY, COMMUNITY & STUDENT VOICE (P5)

1. **Family-as-partner.**
   - Home-language assets framing throughout.
   - A family night kit: slides, activities and sign-in-free QR to practice, in EN/ES/packs.
   - Conference sheets families can read in their language.
   - Family pages in every completed pack.
2. **Community missions.** Optional missions that use the neighbourhood (library card, a local business interview, a community map), with safety notes and teacher approval.
3. **Student voice.**
   - A student design-council protocol: consented sessions, prompts and an anonymised findings template (human-run, D15).
   - In-product "Tell us what would help" with alias-only, moderated submissions.
   - A student-authored content library: teacher-approved Book Studio works offered to other classes with attribution by alias.
4. **Celebrations.**
   - Milestone certificates for independence earned per can-do (not scores).
   - Printable in EN, ES and packs.

## WORKSTREAM 14 — INTEROPERABILITY & SCALE (P6; D11-gated)

1. **Standards-based integration.**
   - LTI 1.3 launch (deep linking to missions).
   - OneRoster 1.2 CSV import to the teacher's local alias map.
   - The existing Canvas/SCORM contract stays intact.
   - QTI 3.0 export of the item bank for districts.
   - Caliper-shaped event export (aggregate, opt-in) if Joel approves.
2. **District deployment kit.**
   - Data-flow diagram, privacy and security summary, ACR, implementation guide and a sample DPA questionnaire answered from the real system.
   - Generated from source files so it cannot drift.
3. **Certification readiness.** A self-assessment against 1EdTech TrustEd Apps and the Student Privacy Pledge principles, with gaps listed. Joel decides on applying.
4. **Operations.**
   - A public status/uptime page (static, fed by `smoke:live` history).
   - An incident-response runbook.
   - Backup and restore proof for D1 data (`backup:d1`).

## WORKSTREAM 15 — EVIDENCE, RESEARCH & AWARD READINESS (start P2, close P9; closes X2, X3)

1. **Editorial pipeline (X2).**
   - Reviewer roles in `content/metadata/reviewers.json` (ids only).
   - A review-queue view with status transitions and a sign-off log.
   - Live coverage shown on `/trust`.
   - Reviews are human-required.
2. **Research design (X3).**
   - `logic-model.md`: inputs → activities → outputs → short-, medium- and long-term outcomes.
   - `efficacy-plan.md`:
     - research questions;
     - quasi-experimental design on district data Joel can access with approval;
     - measures: teacher-typed ACCESS growth, Evidence Graph indicators, writing-rubric growth;
     - fidelity of implementation;
     - analysis plan, with power estimates stated as assumptions;
     - limitations.
   - `usability-protocol.md`: personas, tasks, consent and assent, think-aloud script, SUS and UMUX-Lite, results template.
   - `pilot-kit/`: consent and assent templates (EN/ES, legal review H-08), a teacher onboarding checklist, a fidelity log template, and a pre/post measures plan.

   This is ESSA Tier IV readiness. Do not claim a tier.
3. **ACR.**
   - Automated sweeps in EN and ES at both viewports.
   - A manual checklist covering keyboard, zoom 200/400%, forced colours, reduced motion and the WS7 AT matrix.
   - `acr.md` in VPAT 2.5 WCAG edition, with results-based statuses. AT rows stay "Not evaluated" until H-10.
4. **Privacy documentation.** `privacy.md`, generated from `language-page-third-parties.json`, the storage inventory and the AI list, for legal review (H-08). Add a DPIA-style risk assessment.
5. **Transparency.** A quarterly transparency report (D16) on data collected, AI calls, review coverage and incidents, generated from source data.
6. **Award entry kit**, per D10 target:
   - Verify current criteria, eligibility and deadlines on the official site; record the URL and date.
   - Build a criteria → evidence matrix in `docs/language-page/reports/awards/<program>.md`.
   - Run a **program-specific mock jury**: a fresh subagent with only the program's published criteria and the product, scoring it as that program would.
   - Close gaps, then re-jury.
   - Write the draft entry, marked **DRAFT FOR JOEL — not submitted**.
   - Prepare a 3-minute demo script, a screenshot set (deviceScaleFactor 2, EN and ES) and a 90-second video storyboard.
   - Build a press kit: product facts from the claims ledger only, plus a founder-story placeholder for Joel's own words.
   - Never submit anything. Never state an award, adoption or outcome that has not happened.

---

## CONTENT AUTHORING RULES (all workstreams)

- **Originality.** All content is original. No publisher, WIDA or DRC text, and no WIDA rubric wording.
- **Facts.** Facts must be correct and checkable. Uncertain facts are marked `[VERIFY]` and kept out of student view until verified.
- **Math.** Math is computed and verified.
- **Answer keys.** Balance correct positions, and the correct option is not systematically the longest.
- **Feedback.** Every wrong choice has specific feedback. Hint ladders never state the answer. Timers are off by default.
- **Reading level.** Directions sit at or below the band's reading level, and below grade 5 for grades 3–8. Content vocabulary is defined in-task.
- **TWR frames.** Specific to the task's reasoning, with `___` blanks. Never generic.
- **Support levels.** Every task offers three. "On my own" hides frames, word bank and model, and is the only independent state.
- **Languages.** EN and ES ship together. Packs follow WS4.
- **Representation.** Names, settings and images are diverse and specific. No stereotypes, and home languages are framed as assets. Sensitivity status is tracked per item (WS7).
- **Validation.** After every batch, run `validate:access-lab`, `validate:access-bank`, `audit:access-bank`, `scan:access-es` and the new gates.

## QUALITY BARS (measured; all must hold at program exit)

| Area | Bar |
| --- | --- |
| Jury | Every lens ≥ 9/10 from the independent mock jury; roadmap gate ≥ 8 |
| Integrity | 0 unverified claims rendered; network gate clean; docs-truth gate green |
| Accessibility | axe 0 serious or critical in EN and ES; `lang` correct on 100% of routes; label-in-name and drag-alternative gates green |
| Performance | Lighthouse mobile ≥ 90 on the six key routes; first view ≤ 350 KB / ≤ 50 requests |
| Coherence | `h1` ≤ 140 px (desktop) / ≤ 180 px (phone); one design system; unique titles |
| Curriculum | 100% of items tagged; every unit has a performance task; one phonics scope; cumulative-code gate green |
| Content volume | K–2 parity met; ≥ 8 writing tasks per form per band (3–8); sustained-reading strand live |
| Language | Spanish 100% of directions in K–8; D8 packs drafted with visible draft labels; RTL gate green |
| Feedback | Item quality ≥ 4.2/5 mean (jury-scored); feedback harness ≥ 90% appropriate, 0 leakage |
| AI | Model card and eval suite for every endpoint; 0 critical red-team failures |
| Evidence | Logic model, efficacy plan, usability protocol, pilot kit, ACR, privacy doc and transparency report exist and are truthful |
| Human work | Every human task has an owner and drop-in point in `human-required.md` |

## VERIFICATION MATRIX (run what applies; paste results in the handoff)

| Always | Lab UI | Content | Routes, host, AI, data |
| --- | --- | --- | --- |
| `npm run qa:fast` | `npm run e2e:access-lab` | `npm run validate:access-lab` | `npm run validate:route-contract` |
| `npm test` | `npm run e2e:access-studio` | `npm run validate:access-bank` | the host test `functions/language-page-host.test.mjs` via the repo runner |
| `npm run check` | `npm run e2e:access-evidence` | `npm run audit:access-bank` | `npm run e2e:access-move` |
| `npm run validate:no-purple` | `npm run e2e:access-path` | `npm run scan:access-es` | `npm run e2e:access-predictive` |
| `npm run validate:secrets` | `npm run e2e:book-studio-2` | `npm run validate:vocab-academy` (if touched) | WS1 network gate, WS9 AI evals |
| new WS gates | axe sweep in EN and ES at 1366 and 390 | WS3 spine, phonics, tagging and crosswalk gates | `npm run audit:deps` |
| | WS2 chrome-budget gate | WS8 feedback harness | `npm run smoke:live` (only after an approved ship) |

Every phase also needs a real-browser review per `student-experience-review`:

- ≥ 12 routes across bands and roles;
- screenshots at 1366×768 and 390×844 (dpr 1 for your checks, 2 for anything Joel sees);
- one full student task end to end in EN and in ES;
- one teacher flow, one family flow and one newcomer flow;
- one keyboard-only run.

## DEFINITION OF DONE (program)

- Every finding ID, original or new, is closed with proof, handed to a named human, or declined by Joel.
- The Quality Bars table holds, measured. Live numbers come after an approved ship.
- `docs/language-page/reports/panel-P9.md` and the jury reports show every lens ≥ 9, or name the human-only blockers.
- All listed gates, `npm run validate` and the full `qa:loop` are green, and no gate was weakened (diff the gate files).
- The award entry kit exists and is jury-tested for each D10 target, marked DRAFT.
- `human-required.md` is complete with owners.

## HANDOFF FORMAT (end of every session)

1. Phase and workstreams touched, with the finding IDs closed.
2. Files changed, grouped by workstream.
3. Commands and checks run, each with PASS or FAIL and key output lines.
4. Browser checks: routes, viewports, languages and observations, with screenshots in `docs/language-page/reports/shots/`.
5. Mock-jury results this session, with the paths to their reports.
6. Decisions needed from Joel (the next `AskUserQuestion` batch).
7. Human-required additions.
8. Risk register changes.
9. Remaining risks and skipped checks, each with the reason.
10. The updated `program-state.md`.

Start now:

1. Complete Step 0 so the baseline files are present.
2. Read the files above.
3. Create `program-state.md`, including the risk register.
4. Ask Joel the Stage 0 questions.
5. While waiting for his answers, begin Workstream 1 items 2, 3 and 6, which depend on no decision.

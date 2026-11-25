# Claude Code prompt — The Language Page Award Program

> Paste everything below the line into Claude Code, opened at the root of `neft-classroom-html-activities`.
> It is written to be run across many sessions. Each session picks up at the first unfinished phase in
> `reports/language-page/program-state.md`.

---

## ROLE AND MISSION

You are the lead engineer and editor-in-chief for **The Language Page** (`https://thelanguagepage.com`). It is the ACCESS Practice Lab (`access-practice-lab/`), served from this repo under its own hostname. Host routing is in `functions/_lib/language-page.js`. Sibling surfaces are `access-teacher/` (Teacher Hub + WIDA Data Studio), `/studios` (proxied Worker), `learning-studios/`, `language-studio/`, `language-adventures/`, `bcpss-teachers/`, `wida-access/`.

Your mission is to make The Language Page win recognition from six kinds of jury at once:

- curriculum specialists;
- ESOL/ELD specialists;
- writing specialists;
- educational-technology specialists;
- innovation-in-education juries;
- futures-of-learning juries.

Do it by making the product genuinely excellent and provably honest. Never make it merely look excellent.

The baseline is `docs/language-page/award-panel-audit-2026-11-24.md`. Read it fully before anything else. Every finding ID in it (C1–C6, E1–E7, W1–W5, T1–T8, X1–X5) must end this program in one of three states:

- **closed, with proof**;
- **handed to a named human** in `docs/language-page/human-required.md`;
- **declined by Joel**, with his words recorded.

The composite score today is 6.1/10. The exit bar is the project's own roadmap gate: **every panel lens ≥ 8/10**, scored against evidence, in `reports/language-page/panel-<phase>.md`.

No shortcuts:

- Do not trim scope to save tokens.
- Do not stub a feature and call it done.
- Do not lower a gate to make it pass.

## STEP 0 — MAKE SURE THE BASELINE FILES ARE HERE (every session, before anything else)

The audit and this prompt were added on branch `claude/dreamy-lamport-ryoydb` (PR #230). Until that PR is merged into `main`, a fresh checkout of `main` does not contain them. Run these steps:

1. Check for the audit:

   `test -f docs/language-page/award-panel-audit-2026-11-24.md && echo present || echo missing`

2. If it is **missing**, fetch the branch that holds it:

   `git fetch origin claude/dreamy-lamport-ryoydb`

   Then choose one of these:

   - **If you are starting the program**, base your work branch on it:

     `git checkout -b language-page-award-program FETCH_HEAD`

     Commit everything for this program on `language-page-award-program`.
   - **If you are already on a work branch for this program**, merge it in:

     `git merge --no-edit FETCH_HEAD`

     If the merge is refused or conflicts, stop and tell Joel.
   - **Never** push to `main` to get the file. Never cherry-pick it onto `main`.
3. If the fetch fails (branch deleted, no network), check whether PR #230 has been merged:

   `git fetch origin main && git log origin/main --oneline -- docs/language-page/award-panel-audit-2026-11-24.md`

   - If it has been merged, branch from `origin/main`.
   - If it has not, stop and ask Joel for the audit. Do not reconstruct it from memory, and do not continue without it.
4. Confirm both files exist before going on:
   - `docs/language-page/award-panel-audit-2026-11-24.md`
   - `docs/language-page/award-program-prompt.md`

   Record which branch they came from in `program-state.md`.

## READ FIRST (in this order, every session)

1. `CLAUDE.md` and `AGENTS.md`: the Closed-Loop QA Protocol, hard constraints, the v6.0 release rules, and *Regression pins vs product decisions*.
2. The skills `generated-files`, `qa-gate-triage`, `student-experience-review` and `deploy`. Load each before the work it covers.
3. `docs/language-page/award-panel-audit-2026-11-24.md`, `roadmap.md`, `human-required.md` and `claims-ledger.md`.
4. `access-practice-lab/PLATFORM.md`, `CONTENT.md`, `DESIGN-SYSTEM.md`, `ARCHITECTURE_PLAN.md`, `BOOK-STUDIO.md`, `EXPERIENCE-BUILDER.md`, `FAMILY.md` and `JOURNEY.md`.
5. `docs/class-platform.md`, `docs/wida-data-studio-architecture.md`, `docs/language-page-migration.md`, `docs/languageos/*.md` and `data/product-decisions.json`.
6. `reports/language-page/program-state.md`. Create it on first run, using the schema in **Program state** below.

## NON-NEGOTIABLES

These override anything later in this prompt.

1. **Never change what an existing URL answers without asking Joel first.** That includes redirects, gates, moves and renames. `validate:route-contract` is the backstop, not the permission. New routes are fine. Existing routes keep answering.
2. **Product decisions belong to Joel.** If a check, behaviour or doc reflects a decision, look it up in `data/product-decisions.json` before you touch it. Never create or reverse a decision yourself. When Joel decides something in this program, record it with his exact words, and flip the check in the same commit.
3. **Never fabricate.** Do not invent any of the following:
   - testimonials, efficacy numbers or research citations;
   - awards, district adoptions or logos;
   - human review sign-offs;
   - native-speaker approval;
   - recorded human audio;
   - official WIDA text or rubric wording.

   Anything a person must do goes into `human-required.md` with an owner and a drop-in point. Build the pipeline so the person's work slots in without code changes. Content you author keeps `reviewStatus: "automated-checks-only"` until a human signs it off. Spanish and any other language you draft stays labelled machine-drafted.
4. **Honesty rules stay intact.** Keep these unchanged:
   - "Original practice aligned to WIDA… not an official assessment";
   - "stamps are not a score";
   - no invented proficiency, levels or exit predictions on student surfaces;
   - scaffolded work never counted as independent.
5. **Children's privacy.**
   - Student identity and recordings stay on-device unless the learner explicitly shares them.
   - No third-party analytics unless Joel approves. If he does, the privacy text must name it exactly.
   - No student initials, IEP or 504 status, or SPED labels on any student-facing surface.
   - No PII is ever sent to a model.
6. **AI follows the existing contract:** the model *selects among authored moves* or *asks questions*. It never writes the student's work, never scores, and never sees identity. Every AI endpoint goes in `PLATFORM.md`'s exception list with what it sends, what it stores and how long.
7. **Visual rules (v6.0).** The palette is navy `#17324D`, teal `#1FA6A2`, warm off-white `#F7F4EC`, amber `#F2C15B` and body text `#24323F`. Coral may distinguish speaking. Do not use violet, purple or indigo, and run `npm run validate:no-purple`. Also keep:
   - 44 px targets;
   - visible 3 px focus;
   - reduced-motion support;
   - semantic landmarks;
   - WCAG 2.2 AA.
8. **Generated files.** Never hand-edit generated output. Trace each change to its generator, then regenerate indexes, import maps, cache hashes, critical CSS, printables, the service worker and illustrations.
9. **Teacher prep.** Do not add teacher-prep burden or physical manipulatives.
10. **Git and deploy.**
    - Work on a feature branch and commit per workstream, with clear messages.
    - Never run `wrangler` or `npm run deploy`.
    - Do not push to `main` or ship until Joel says so. When he does, use only `ALLOW_DEPLOY=1 npm run ship -- <sha…>`, then `npm run smoke:live`.
11. **Closed loop.** Never report a feature done without:
    - the gate that proves it;
    - the command output;
    - a real-browser check, following the `student-experience-review` skill.

    A red gate means you fix the code or the detector, following the `qa-gate-triage` skill. You never weaken the gate.

## STAGE 0 — DECISIONS ONLY JOEL CAN MAKE (ask before building)

Use `AskUserQuestion` to put these to Joel in batches of up to four. Put your recommendation first, marked "(Recommended)". Record every answer in `data/product-decisions.json` with his words. Until a decision is made, build only the parts that do not depend on it.

| ID | Decision | Recommended default |
| --- | --- | --- |
| D1 | **Identity.** One name and one promise for the site. Candidates: "The Language Page — English for school, in your language, K–8" vs. the current "K–8 Multilingual Curriculum & Assessment Studio". | One name, *The Language Page*, with a plain promise line. "ACCESS Practice Lab" becomes the name of one section. |
| D2 | **Analytics beacon.** Cloudflare Web Analytics loads on all 85 pages, while the privacy page says "no third-party analytics or trackers". | Remove it from this host and keep the aggregate first-party `/api/signal`. Alternatively, keep it and rewrite the privacy text precisely. |
| D3 | **Teacher Hub and Data Studio served with no password** on this host (`LAB_HOST_OPEN`, his decision of 2026-11-17). | Keep it open (his decision), add a "Teacher area — no student data is stored here" banner, and confirm that no answer keys or scoring anchors are reachable from student navigation. |
| D4 | **Data Studio forecasts** ("Predicted ACCESS Overall level" ranges in demo and validated mode) vs. the v6.0 rule "never predict ACCESS scores or placement". | Keep the teacher-only, validated-only, interval-only behaviour. Write an explicit scoped exception into the v6.0 rule, or remove the forecasts. Joel chooses. |
| D5 | **Sibling apps** `language-studio/` and `language-adventures/`: Next.js exports with no source in the repo, a separate design system and failing 44 px targets. | Retire both into the lab: rebuild their best content as lab routes and keep the old URLs answering (redirects only with his approval). The alternatives are keep-as-is or recover the source. |
| D6 | **"BCPSS Teachers" as a door on the public home.** | Move it to a district landing linked from the Teachers door. |
| D7 | **Grade-band naming**: 3–5 vs 4–5. | Keep the content in 3–5 and label it "Grades 3–5" everywhere. |
| D8 | **Home-language packs beyond Spanish**, priority order. | Order by district enrolment data that Joel supplies. If none is supplied: Arabic, Dari, Pashto, Haitian Creole, Portuguese, Chinese (Mandarin), Vietnamese, French. |
| D9 | **Human-review budget and owners**: bilingual reviewer, WIDA-trained reviewer, voice talent, accessibility reviewer, legal/privacy reviewer, usability-session lead. | Named owners in `human-required.md`. Tooling is built regardless. |
| D10 | **Award targets for this cycle**: which three to five programs to enter first. | One per domain from the audit's §4. Verify current criteria and deadlines on the official sites first. |

## OPERATING MODEL

- **Phases follow `docs/language-page/roadmap.md` (P0–P9).** The workstreams below map onto them. A phase closes only when:
  - its gates are green;
  - its browser checks are done;
  - `reports/language-page/panel-<phase>.md` scores every applicable lens at ≥ 8/10, with evidence links, or lists the exact blockers and owners.
- **Panel report format.** For each of the six lenses plus Trust & Evidence, give:
  - a score;
  - three strengths, with proof;
  - remaining gaps, mapped to finding IDs;
  - what would raise the score by one point.

  Score adversarially. If you would not defend the score to a skeptical external judge, lower it.
- **Parallelism.**
  - Independent workstreams may run in parallel subagents, each with a narrow brief, explicit files and its own gates.
  - Use `isolation: "worktree"` when they would touch overlapping files.
  - If Joel has said "use a workflow", run the workstreams as a workflow with a review-and-verify stage per workstream.
  - Merge sequentially and run the gates after each merge.
- **Program state.** Keep `reports/language-page/program-state.md` current. It holds:
  - the phase;
  - each workstream's status (`not started` / `in progress` / `blocked: <who>` / `done: <commit>`);
  - the finding-ID ledger;
  - the decisions log (pointers into `product-decisions.json`);
  - the human-required queue;
  - the last gate results.

  Update it at the end of every session.
- **Commit hygiene.** One logical change per commit. Every commit message names the finding IDs it closes. Never use `--no-verify`.

---

## WORKSTREAM 1 — TRUTH & TRUST (P2, start immediately; closes X1–X5, E4)

1. **Privacy truth (X1).**
   - Implement D2.
   - Write `tools/validate-language-page-network.mjs`. It loads every sitemap route in Chromium on the `thelanguagepage.com` host model and records every third-party host contacted. It fails on any host not named on the privacy page and not listed in `data/language-page-third-parties.json`, where each entry carries a purpose, data sent and retention. Self-test it against a fixture page that loads a disallowed host.
   - Correct "Audio is never uploaded" to the real opt-in sharing behaviour, everywhere it appears: the privacy view, claims ledger C-004, `FAMILY.md` and family pages.
   - Wire the new gate into `validate:access-lab` and into `qa:fast` COVERAGE.
2. **Claims gate (X4).**
   - Build `tools/access-lab-claims.test.mjs`. Rendered claim strings carry `data-claim="C-00x"`. Any `data-claim` without a `verified` row in `claims-ledger.md` fails, and so does an evidence/efficacy/award/"research shows" phrase without a claim id.
   - Seed negative fixtures first.
   - Add it to `npm test`.
3. **Document language (E4).**
   - On every language switch, set `<html lang>` to the active language.
   - In EN+ES mode, set `lang` on each language block.
   - Add a browser gate across the sitemap in `?lang=es` and EN+ES modes. It asserts `document.documentElement.lang` and that no visible English sentence is left on a Spanish screen; extend `scan:access-es` to rendered output.
4. **Governance alignment (X5).**
   - Record D3, D4, D5 and the AI-writing endpoint decision.
   - Add `/api/class/ai/writing` and `/api/class/ai/hint` to `PLATFORM.md`'s AI exception list with exact payloads and retention.
   - Rewrite the four docs that contradict `language-page.js`: the migration doc, the WIDA architecture doc, the WIDA privacy doc and the class-platform doc.
   - Write `tools/language-page-docs-truth.test.mjs`. It reads the exported constants (`LAB_HOST_OPEN`, `LAB_PREFIXES`) and fails if a doc states the opposite, using a small pattern table with self-tests.
5. **Public trust pages.** These are new routes; they replace no existing route.
   - `/access-practice-lab/trust`: plain-language privacy, what is stored where, AI use, accessibility statement, review status of content and languages (live counts generated from content metadata), and contact.
   - `/access-practice-lab/method`: how the product teaches. Cover WIDA alignment as "aligned to", gradual release, the integrity rules, and how feedback works. Every factual claim gets a claim id.
   - EN and ES. Each page gets a meta description, an OG image, and `lang` set correctly.

**Proof:**

- the new gates are green, with their self-tests;
- the network gate fails when you temporarily re-add the beacon in a scratch fixture;
- screen-reader spot check: run `npx @guidepup/virtual-screen-reader` or an equivalent, if installed. If not, log it in `human-required.md` as H-10.

## WORKSTREAM 2 — IDENTITY, SHELL & NAVIGATION (P1–P3; closes C6, E7, T2, T3, T5)

1. **One identity (D1).**
   - Apply it to the masthead, `brand.js`, titles, OG tags, the manifest, Teacher Hub titles (the hub currently reads "ACCESS Practice Lab — Teacher Hub") and the Data Studio.
   - `tools/access-move.test.mjs` already pins brand spelling; extend it to the hub.
2. **Audience-first home.** Split home into a student experience and an adult experience.
   - Students choose a grade band, see **one** "Today" card (their next mission) and **one** "Continue" card, with everything else one tap away.
   - Adults see the promise, the three signature innovations (WS7), the trust line, and doors for Teachers, Families and District (D6).
   - Keep every existing URL answering.
3. **Role default (E7).** The door chosen on home sets the role: the Student door means Student view.
   - Persist the role.
   - With no choice yet, default to Student on student routes.
   - The Teacher/Family toggles appear only after the Teacher or Family door, or inside teacher routes.
   - Add an e2e test that runs in a fresh context on 10 student routes and asserts the Student view.
4. **Chrome budget (T2).**
   - Use one header: logo, search, language (once), grade, role menu.
   - Use one contextual section nav.
   - Remove the duplicate language banner once a choice is stored.
   - Budget: content `h1` within **≤ 140 px** of the top at 1366×768 and **≤ 180 px** at 390×844. The desktop header must not wrap at 1280 px.
   - Gate it with a browser measurement across the sitemap.
5. **Plain names.** Rename student-facing features to what a 10-year-old would call them. Examples:
   - "Interactive Language Learning Engine" → "Learn a language move";
   - "Echo-Self Time-Lapse Growth Mirror" → "See how my writing grew".

   Keep the route slugs. Put an old→new table in `docs/language-page/naming.md`, and make `sitemap.js` the single source of truth for names (EN/ES).
6. **Siblings (D5, T3, T4).**
   - Implement Joel's choice.
   - If retiring: port the strongest Language Studio cases and the Adventures worlds into lab routes on the lab shell and tokens. Keep the old paths answering until Joel approves redirects.
   - Whatever survives must pass the lab's 44 px, contrast, palette and axe gates.
7. **SEO and sharing (T5).**
   - Generate per-route `<title>`, meta description and OG image from `sitemap.js` (EN/ES).
   - Fix the 9 duplicate "Learning Studios" titles and the missing descriptions on `/access-teacher/` and `/access-teacher/predictive/`.
   - OG images are generated SVG→PNG on-brand cards, built at build time and content-hashed.
   - Gate: unique titles, descriptions present and 50–160 characters, OG image resolves.

## WORKSTREAM 3 — CURRICULUM SPINE (P4A, P4D; closes C1–C5)

1. **Scope-and-sequence data model.**
   - Create `access-practice-lab/content/spine/<band>.json`. It holds Units → Weeks → Missions.
   - Each mission declares:
     - WIDA Key Language Use (Narrate/Inform/Explain/Argue);
     - content area;
     - domains;
     - can-do targets;
     - language objective;
     - success criteria;
     - the stations that serve it: existing studio tasks, games and worlds, referenced by id;
     - formative check;
     - independence check ("On my own").
   - Every existing activity is either placed in a mission or marked `bank-only` with a reason.
   - Generate the spine views from this data: a student "My Path" map, a teacher unit planner, and printable unit overviews.
   - Gate `validate:language-page-spine`:
     - every mission resolves;
     - no orphaned flagship content;
     - KLU balance per band is within ±10% of a declared target;
     - each unit has at least one task per domain;
     - prerequisites are acyclic.
2. **Single phonics scope (C2).**
   - Consolidate on `src/sor/` Phonics Path as the canonical systematic sequence.
   - Add a **phonemic awareness strand**: rhyme, onset-rime, blending, segmenting, deletion, substitution. It is oral-first, with tap-to-hear models and no reading required, and runs ahead of and alongside phonics.
   - Map the Reading Path decodables and `early/phonics-progression.js` onto it, or retire them behind their existing URLs.
   - Fix the duplicate "said" and the 19-consonants-in-Unit-1 load.
   - Gate:
     - every grapheme is introduced before it appears in a decodable, using a cumulative-code check against each passage;
     - no sight word is introduced twice;
     - each lesson stays within a declared new-element limit.
3. **Tagging schema (C3).**
   - Define a controlled vocabulary in `access-practice-lab/content/metadata/vocab.json`: content areas with canonical spellings, KLUs, domains, bands and proficiency ranges.
   - Backfill tags for all 933 core activities, the 320 bank items, 183 Reading Room lessons and all studio tasks.
   - Tags you infer carry `inferred: true` and a `[INFERRED — VERIFY]` note for H-03.
   - Gate: 100% tagged, vocabulary-only values, a coverage matrix written to `reports/language-page/coverage-matrix.md`.
4. **K–2 parity (C4).** Author K–2 to the standards below:
   - Speaking Studio tasks: ≥ 24 (oral retell, describe, sequence; picture-led).
   - Writing tasks: ≥ 24 (draw-label-tell → shared sentence → guided sentence → short independent).
   - Listening and Reading: ≥ 60 per band, KLU-tagged.
   - Practice-test forms: 2 per band, clearly labelled practice.

   All original, all with Spanish directions, all with `reviewStatus: "automated-checks-only"`.
5. **Sustained reading (C5).**
   - Add a 6–8 strand of 300–900-word informational and literary texts with quantitative and qualitative complexity notes.
   - Scaffold entry with a preview, key vocabulary, audio and chunking. The text is never simplified as a replacement.
   - Add text-dependent questions across DOK 1–3 and a written response.
   - Do the same for 3–5 at 200–600 words.
   - Gate: length bands met, every question has distractor rationales, and the correct-answer position is balanced.

## WORKSTREAM 4 — ESOL/ELD DEPTH (P4A–P4C; closes E1–E3, E5, E6)

1. **Human-audio pipeline (E1).**
   - Create an audio manifest `content/audio/manifest.json`. Each entry holds: item id, script hash, speaker id, accent/variety, pace, duration, caption VTT, transcript, `status: placeholder | recorded | reviewed`.
   - Build a **Recording Studio** for adults: a new teacher route. It shows the script, records with level meter and retake, trims, auto-generates the VTT from the script, exports a file named by item id, and stores locally. Voice talent or teachers record; nothing is uploaded unless they export.
   - Build a player that prefers recorded audio and falls back to TTS, showing a visible "computer voice" label in that case.
   - Gate:
     - every listening item has a manifest row;
     - every recorded file has captions and a transcript;
     - a script edit invalidates the recording through the hash.

   Recording itself is human-required (H-new). Do not synthesize "human" audio.
2. **Spanish completion (E3).**
   - Add `directionsEs` to all 749 grade 3–8 activities.
   - Translate task titles, video titles and captions.
   - Keep the `ES-REVIEW` markers until H-05 signs off.
   - Gate: 0 missing `directionsEs`, and the rendered ES-leak gate from WS1 is green.
3. **Language packs (E2, D8).**
   - Build a pack architecture `content/lang/<code>/` covering: UI strings, directions, glossary terms, cognates and false friends, family letters, the Family Companion (WS8), and RTL metadata.
   - The renderer supports RTL: logical properties, mirrored icons where meaningful, `dir` set per block.
   - Draft the packs in D8 order with machine-draft labels. Every string has a review status. The UI shows a "Draft translation — not yet reviewed" notice for unreviewed packs and never hides it.
   - Gate:
     - pack completeness per declared scope;
     - `dir`/`lang` correct in the browser (Arabic, Dari and Pashto render RTL without overflow at 390 px);
     - no pack is marked reviewed without a reviewer id.
4. **Translanguaging moves.**
   - In every studio task, add an optional "Think in my language first" step: plan or rehearse in L1, by typing or recording, then produce in English.
   - The L1 step is recorded as a support and never counted as independent English evidence.
5. **SLIFE / older newcomer path (E5).**
   - Build an age-respectful foundational-literacy track for ages 10–14:
     - oral-language-first survival and school missions;
     - decodables with mature themes (school, sports, community, work);
     - a numeracy–literacy bridge;
     - picture and audio support throughout.
   - Place it from home via the "I'm new to English" door with no test.
   - Add a teacher note on how to use it.
6. **Can-do portfolio (E6).**
   - Passport v2 shows each can-do statement with attached evidence, support level and independence status.
   - The learner reflects in L1 or English.
   - It never states a WIDA level.

## WORKSTREAM 5 — WRITING (P4C; closes W1–W5)

1. **Volume and progression (W1).** Per band (3–5, 6–8), author **≥ 8 tasks per form** across CER, paragraph, summary, narrative, report, letter and essay, balanced across KLUs and content areas. Each task carries:
   - situation, task and audience;
   - sources;
   - organizer;
   - success criteria;
   - three exemplars (early/building/strong) annotated against the existing 8-dimension practice rubric;
   - revision prompts.

   K–2 is handled in WS3. Gate: counts, KLU balance, exemplar annotations reference real rubric dimensions, and no exemplar repeats another task's text.
2. **Embedded sentence moves (W2).** When feedback detects a need, offer the matching sentence-level move inside the task, *using the student's own sentence*:
   - because/but/so for thin reasoning;
   - appositives for undefined terms;
   - sentence combining for choppy prose;
   - transitions for weak cohesion.

   Pull from the 774 existing TWR-style items.
3. **Focused task page (W3).**
   - The page holds one source panel, one writing surface and one feedback panel.
   - Remove unrelated demo widgets from task pages. The cohesion X-ray and clause builder operate on the student's draft only, when invoked.
   - Budget: the first screen at 1366×768 shows the task, the support choice and the start of the writing surface.
4. **Audience loop (W4).** On the existing `/api/class` platform:
   - a class gallery;
   - structured peer response (praise / question / polish) with sentence frames;
   - teacher moderation before anything is visible to peers;
   - teacher conference notes;
   - publishing to the task's named audience as a printable or shareable artifact.

   Alias-only identity and the existing retention rules apply.
5. **Writing portfolio (W5).**
   - A timeline of drafts across tasks on the same rubric dimensions.
   - Learner annotations ("What I changed and why").
   - Export for conferences (print/PDF/Word).
   - Feeds the Evidence Graph (WS8).

## WORKSTREAM 6 — PERFORMANCE & ENGINEERING (P6–P8; closes T1, T4, T6, T7)

1. **Budgets.** Set these in `data/language-page-perf-budget.json`, using the ratchet pattern already used by `validate:family-performance`:
   - home first view **≤ 350 KB** transferred;
   - **≤ 50 requests** before interaction;
   - **0** render-blocking stylesheets beyond one critical inline block plus one shell sheet;
   - Lighthouse mobile (Moto G Power, Slow 4G) **Performance ≥ 90**, LCP ≤ 2.5 s, CLS ≤ 0.05, INP ≤ 200 ms on home, `/path`, `/write`, `/speak`, `/early` and `/reading-room`.
2. **CSS architecture.**
   - Collapse the 145 lab CSS files into a token sheet, one shell sheet and route-scoped sheets loaded by the router.
   - Remove the 120 render-blocking `<link>` tags.
   - Regenerate critical CSS through its generator.
   - Keep `validate:access-lab` green throughout.
3. **JS.**
   - Audit the 133 modulepreloads.
   - Preload only the home graph; everything else loads lazily per route.
   - Verify offline mode still works (`e2e:access-lab`, plus an offline-pack test).
4. **Media.** Lazy-load all video and below-the-fold images, give every image explicit dimensions, and convert to modern formats through the generator.
5. **Siblings and contrast (T4, T6).**
   - Bring every surviving sibling under the 44 px gate and fix the `/wida-access/` contrast nodes.
   - Add all of them to the axe sweep, run in both languages.
6. **Same-origin assets (T7).** Serve the assets the lab needs on its own origin, or declare and cache them. The network gate from WS1 covers this.

## WORKSTREAM 7 — INNOVATION SPOTLIGHT (P5, P9; serves the innovation jury)

Pick these **four signature innovations**: Book Studio 2.0, Experience Builder, WIDA Data Studio, and Responsible AI ("AI that chooses, never writes"). For each one:

- **A plain name and a one-line promise.**
- **A 60-second guided demo path.** It must use the existing demo/sample mode, require no account and contain no real student data.
- **A "How it works / Why it matters / What we know / What we don't know yet" page.** EN/ES, with every claim tied to a claim id.
- **A presenter view** for conference demos. The existing present-mode can serve.
- **An e2e test** that walks the demo path in Chromium and WebKit.

## WORKSTREAM 8 — FUTURES LAYER (P5–P6; serves the futures jury)

1. **Language Evidence Graph.** A local-first store (IndexedDB) normalizing every attempt from every studio, game and world into:
   - domain, KLU and can-do;
   - support level and independence;
   - content area, date and artifact reference.

   Migrate readers (Path, Growth Map, Passport, Journey, Teacher Hub) to it behind a compatibility layer, so that no saved progress is lost. A Save/Resume integrity test must prove old keys still load.
2. **Passport v2.**
   - Learner-held and exportable as JSON and print.
   - Optionally shaped as an **Open Badges 3.0** achievement credential, unsigned or locally signed.
   - Only the learner can export it; consent is explicit.
   - No identity beyond the alias.
3. **Tomorrow's Lesson (teacher co-pilot).**
   - From class evidence, propose a 15-minute small-group plan: grouping by need, one authored task, the frames, and an exit check.
   - The plan is chosen *from authored materials* under the existing AI contract.
   - The teacher edits and approves, and the plan prints in one page.
   - Recorded as the "Teacher Action Studio" item in LanguageOS.
4. **Family Companion.**
   - A weekly 5-minute at-home talk task tied to the week's mission.
   - Available in EN, ES and the D8 packs.
   - Families can send an optional voice or text reply to the teacher over `/api/class`, with the existing retention rules.
5. **Multimodal Composer.**
   - Image, voice and text composition.
   - Assessed on the same rubric dimensions as writing.
   - Exports to the portfolio.

## WORKSTREAM 9 — EVIDENCE & AWARD READINESS (start in P2, close in P9; closes X2, X3)

1. **Editorial pipeline (X2).**
   - Add reviewer roles to `content/metadata/reviewers.json`, containing ids only and no personal data in the repo.
   - Build a review-queue view for reviewers, with per-item status transitions (`automated-checks-only` → `in-review` → `reviewed` with reviewer id and date) and a sign-off log.
   - Show live review coverage on `/trust`.
   - The review itself is human-required.
2. **Logic model and study design (X3).** Write the following:
   - `docs/language-page/logic-model.md`: inputs → activities → outputs → short-, medium- and long-term outcomes, mapped to the features.
   - `docs/language-page/efficacy-plan.md`: research questions, design (a quasi-experimental comparison using district data Joel can access with approval), measures (ACCESS growth typed by teachers, product evidence-graph indicators, writing-rubric growth), analysis and limitations.
   - `docs/language-page/usability-protocol.md`: tasks by persona, consent, think-aloud script, SUS, and a results template.

   This is ESSA Tier IV readiness. Do not claim a tier.
3. **Accessibility conformance (ACR).**
   - Run the automated sweep in both languages and at both viewports.
   - Write a manual checklist covering keyboard-only, 200%/400% zoom, forced colors, reduced motion, NVDA and VoiceOver steps.
   - Draft `docs/language-page/acr.md` in VPAT 2.5 WCAG-edition structure, with every criterion marked "Supports / Partially / Does not / Not evaluated" from actual results. Rows that need assistive technology stay "Not evaluated" until H-10.
4. **Privacy documentation.** Draft `docs/language-page/privacy.md` for legal review (H-08). It is generated from `language-page-third-parties.json`, the storage inventory and the AI exception list, so it cannot drift.
5. **Award entry kit.**
   - For each D10 target: verify current criteria, categories, eligibility and deadlines on the program's official site. Record the URL and the date checked.
   - Build `reports/language-page/awards/<program>.md`: a criteria → evidence matrix linking to live routes, gates and reports.
   - Write a draft entry, clearly marked **DRAFT FOR JOEL — not submitted**.
   - Prepare the 3-minute demo script, a screenshot set at deviceScaleFactor 2 in EN and ES, and a 90-second video storyboard.
   - Never submit anything. Never state an award, adoption or outcome that has not happened.

---

## CONTENT AUTHORING RULES (all workstreams)

- **Originality.** All content is original. Do not reproduce publisher, WIDA or DRC text, and no WIDA rubric wording.
- **Facts.** Real-world facts (science, history) must be correct and checkable. Mark anything uncertain `[VERIFY]` and keep it out of student view until verified.
- **Math.** Any math in tasks is computed and verified.
- **Item quality.**
  - The answer key is balanced across positions, and the correct option is not systematically the longest.
  - Every wrong choice has specific feedback.
  - Hint ladders never state the answer.
  - Timers stay off by default, with no countdown pressure.
- **Reading load.** Directions sit at or below the grade band's reading level, and below grade 5 for directions in 3–8. Math and science vocabulary is defined in-task.
- **TWR integration.** Frames are specific to the task's reasoning, with `___` blanks. Never use generic frames.
- **Support honesty.** Every task offers the three support levels. "On my own" hides frames, word bank and model, and is the only state recorded as independent.
- **Bilingual completeness.** Every authored string ships EN and ES at once. Pack languages follow WS4.
- **Validation.** Run `validate:access-lab`, `validate:access-bank`, `audit:access-bank`, `scan:access-es` and the new gates after every content batch.

## VERIFICATION MATRIX (run what applies; paste results in the handoff)

| Always | When touching the lab UI | When touching content | When touching routes/host/AI |
| --- | --- | --- | --- |
| `npm run qa:fast` | `npm run e2e:access-lab` | `npm run validate:access-lab` | `npm run validate:route-contract` |
| `npm test` | `npm run e2e:access-studio` | `npm run validate:access-bank` | `node --test functions/language-page-host.test.mjs` (or the repo's runner) |
| `npm run check` | `npm run e2e:access-evidence` | `npm run audit:access-bank` | `npm run e2e:access-move` |
| `npm run validate:no-purple` | `npm run e2e:access-path` | `npm run scan:access-es` | `npm run e2e:access-predictive` |
| new WS1 gates | `npm run e2e:book-studio-2` | `npm run validate:vocab-academy` (if touched) | the network gate (WS1) |
| | the axe sweep in EN and ES, at 1366 and 390 | the spine, phonics and tagging gates (WS3) | `npm run smoke:live` (only after Joel-approved ship) |

Also, for every phase, do a real-browser review following the `student-experience-review` skill:

- at least 12 routes across bands and roles;
- screenshots at 1366×768 and 390×844 (deviceScaleFactor 1 for your own checks, 2 for anything Joel will see);
- one full student task done end to end in EN and in ES;
- one teacher flow;
- one family flow.

## DEFINITION OF DONE (program)

- Every finding ID in the audit is closed with proof, handed to a named human, or declined by Joel, and recorded.
- `reports/language-page/panel-P9.md` scores every lens at ≥ 8/10, with evidence links, or names the human-only blockers keeping a lens below 8.
- All gates listed above are green, along with `npm run validate` and the full `qa:loop`. No gate was weakened (diff the gate files).
- Measured live after an approved ship:
  - 0 page errors;
  - 0 overflow;
  - axe 0 serious or critical in EN and ES;
  - `lang` correct;
  - performance budget met;
  - network gate clean.
- `human-required.md` lists every remaining human task, with an owner and drop-in point.
- The award entry kit exists for each D10 target, marked DRAFT.

## HANDOFF FORMAT (end of every session)

1. **Phase and workstreams touched**, with the finding IDs closed.
2. **Files changed**, grouped by workstream.
3. **Commands and checks run**, each with PASS or FAIL and the key output lines.
4. **Browser checks**: routes, viewports, languages, and what was seen, with screenshots saved under `reports/language-page/shots/`.
5. **Decisions needed from Joel** (next `AskUserQuestion` batch).
6. **Human-required additions.**
7. **Remaining risks and skipped checks**, each with the reason.
8. **The updated `program-state.md`.**

Start now. First complete Step 0 so the baseline files are present. Then read the files above. Then create `program-state.md`. Then ask Joel the Stage 0 questions. While waiting for his answers, begin Workstream 1 items 2–3, which depend on no decision.

# thelanguagepage.com — Award Panel Audit (2026-11-24)

**Panel lenses:** Curriculum Architecture · ESOL / ELD · Writing · Educational Technology & Learning Engineering · Innovation in Education · Futures of Learning · (cross-cutting) Trust & Evidence.

**Method.** Live production crawl of every URL in `https://thelanguagepage.com/sitemap.xml` (79) plus 6 sibling entry points = **85 pages × 2 viewports** (1366×768 desktop, 390×844 phone) in Chromium; axe-core WCAG 2.0/2.1/2.2 A/AA on all 85 desktop pages; CDP transfer measurement; scripted student task walk-throughs (Writing Studio CER task, Spanish mode); a file-level content census of `access-practice-lab/content/` and `src/`; and a read of every project doc on the product (`docs/language-page/`, `docs/languageos/`, `access-practice-lab/*.md`, `docs/wida-*`, `docs/class-platform.md`, prior audits). Numbers below are measured, not quoted from docs, unless marked *(docs)*.

**Verdict in one line.** An unusually honest, technically disciplined, feature-rich platform that is **not yet award-ready**. It wins on integrity and engineering, and loses on coherence, depth per grade band, authentic language input (human audio, home languages), and the one thing every serious award jury now asks for: *independent evidence that a real learner, teacher and family benefit.*

---

## 1. Scorecard

| Lens | Score /10 | Award-ready? | One-line reason |
| --- | --- | --- | --- |
| Curriculum Architecture | **5.5** | No | Enormous breadth, no visible scope and sequence; three overlapping phonics systems; 89% of core items name no content standard; K has 35 activities. |
| ESOL / ELD | **6.5** | No | Best-in-class honesty about supports vs. independence and WIDA framing; but listening is synthetic speech only, Spanish stops after grade 3, "multilingual" is effectively EN/ES, and the home-language support that exists is Spanish-only. |
| Writing | **6.5** | No | Excellent sentence-level work (774 TWR-style items) and specific, non-judging feedback; only 22 Writing Studio tasks, none K–2; task pages buried in unrelated widgets. |
| EdTech & Learning Engineering | **6.5** | Close | 85/85 pages render, 0 page errors, 0 overflow, one `h1` each, axe nearly clean — but 1.36 MB / 158 requests / 120 render-blocking stylesheets per page, four stacked nav bars, three design systems across four apps. |
| Innovation in Education | **7.5** | Yes, with focus | Book Studio 2.0 (per-element supports by proficiency profile), Experience Builder (text-to-simulation compiler), a Data Studio that *refuses* to forecast without validation, AI that selects authored moves instead of generating. Hidden under 122 destinations. |
| Futures of Learning | **6.0** | No | Local-first privacy and constrained AI are forward-looking; there is no unified learner model, no learner-owned portable record, and no teacher co-pilot loop that turns evidence into tomorrow's lesson. |
| Trust & Evidence (cross-cutting) | **4.0** | **Blocker** | Zero human content review recorded (508/508 `reviewStatus: "automated-checks-only"`); no efficacy plan on disk; privacy page contradicted by live network traffic; claims-ledger enforcement test never written. |
| **Composite** | **6.1** | **Not yet** | The project's own roadmap gate is "every reviewer ≥ 8". No lens meets it; no panel report exists in `docs/language-page/reports/`. |

---

## 2. What the panel would applaud (keep and amplify)

1. **Integrity architecture.** "Scaffolds cannot contaminate independent results" is enforced in the UI ("Supports are open and recorded as supports… not an ACCESS score"; "On my own — feedback comes after you finish"). Few commercial ELD products are this honest. This is the platform's signature and should be the headline of every award entry.
2. **Gradual-release by design.** Every studio task offers *With frames and words / With a word bank / On my own*, with a suggestion derived from the learner's history. That is UDL and WIDA "support" done correctly.
3. **Specific, non-evaluative writing feedback.** Typing a weak CER sentence returned: *"Explain HOW mulch works. What does the mulch do when rain falls on the slope? Look at the first paragraph of the lab notes."* — text-dependent, actionable, and does not pretend to grade meaning.
4. **Content-integrated tasks with authentic audiences.** "The garden club will read your recommendation"; "visitors will read your placard next to a model canal boat." Real purpose, real reader.
5. **Engineering hygiene (measured live).** 85/85 pages HTTP 200 on both viewports; 0 uncaught page errors; 0 horizontal overflow at 390 px; exactly one visible `h1` on every page; axe found only `color-contrast` (serious) on 5 pages, all in the `/wida-access/` sibling — **0 violations on lab pages**.
6. **Constrained, privacy-aware AI.** `/api/class/ai/*` makes the model *select among authored next-move ids*; `/api/book-coach` must answer with questions, rejects replies that quote 8+ student words or look like scores. That is a defensible "responsible AI" story.
7. **Data Studio rigor.** Growth is significant only beyond 1.96 × combined SEM; it handles the 2025–26 scale reset; forecasts are withheld in real mode unless validated *(docs)*. Assessment specialists will notice.
8. **Vocabulary depth.** 1,432 Vocab Academy words (Tier 2: 1,192), every one with a Spanish gloss, cognate flag, morphology, word family, misuse and non-example.

---

## 3. Findings by lens (evidence → why a jury cares → direction)

### 3.1 Curriculum Architecture — 5.5

| # | Finding (evidence) | Why it costs awards | Direction |
| --- | --- | --- | --- |
| C1 | **No learner-visible scope and sequence.** `src/sitemap.js` lists **122 destinations** in 7 sections (24 "studios", 31 "tools", 11 "worlds", 5 "games", 12 "guides"). A student sees *My Language Path, Learning Journey, Journey Map, Academic missions, Road to ACCESS, Reading Path, Science of Reading Path, Interactive Learn Hub, Growth Map, Passport…* | Curriculum juries look for a coherent progression with clear entry points and mastery criteria. Breadth without spine reads as a feature catalogue. | One spine per grade band: Units → Weeks → Missions, each mapped to WIDA KLU + content area, with every studio/game as a *station* inside a mission, not a destination of its own. |
| C2 | **Three overlapping phonics systems** — Reading Path (15 units), Phonics Path `src/sor/` (3 levels, 16 units, 58 lessons — the most complete), `src/early/phonics-progression.js` (24 words). No standalone phonemic-awareness strand; "said" duplicated across units 4 and 9; Unit 1 introduces 19 consonants at once. | Science-of-reading reviewers check for one explicit, cumulative, systematic sequence. Three is a red flag. | Consolidate on Phonics Path as the single SoR scope; add a PA strand (blending, segmenting, manipulation) that precedes and runs parallel; retire or re-point the others. |
| C3 | **Thin, inconsistent alignment metadata.** Only **98 / 933** core activities name a WIDA content standard; **383 / 933** carry a Key Language Use; **0 / 184** K–3 activities have a KLU tag; "Math" vs "Mathematics"; Reading Room uses ~90 free-text subjects. | Alignment claims ("aligned to WIDA 2020") must be demonstrable item-by-item for WIDA PRIME correlation, Digital Promise and district adoption review. | Controlled vocabulary + schema validation: every item gets `standard`, `klu`, `contentArea`, `proficiencyRange`, `domain`, `gradeBand`; gate fails on missing tags. Human WIDA review flips `inferred:false` (H-03). |
| C4 | **Grade-band imbalance.** K **35**, Gr 1 **59**, Gr 2–3 **90**, Gr 3–5 **286**, Gr 6–8 **463** (80% in the top two bands). No K–2 Writing/Speaking Studio tasks, no K–2 test forms, no K Reading Room lessons. | A "K–8" claim on the masthead invites scrutiny of K–2 first. | Either scope the claim honestly ("Grades 3–8 + early-literacy foundations") or build K–2 to parity. |
| C5 | **Short 6–8 reading.** Median 6–8 reading passage = **58 words** (3–5 median is 78). | Grade-level text complexity is a core curriculum criterion; ELs need access *to* grade-level text, not shorter text. | Add a sustained-reading strand (300–900 words, Lexile/quantitative + qualitative bands) with scaffolded entry, not simplified replacement. |
| C6 | **Positioning drift.** Masthead: "K–8 Multilingual Curriculum & Assessment Studio". Hero: "Practice English for school, one step at a time". Page title: "ACCESS Practice Lab". Sibling app: "Language Studios… grades 3–8". Fourth door on the public home: "BCPSS Teachers". | Juries reward clarity of purpose. Four identities on one screen is the opposite. | One name, one promise, one audience hierarchy. District-specific doors belong behind a district landing, not on the public home. |

### 3.2 ESOL / ELD — 6.5

| # | Finding | Why it costs awards | Direction |
| --- | --- | --- | --- |
| E1 | **Listening is synthetic.** **234 / 238** listening activities are `speechSynthesis` reads of a text script; recorded audio = 4 MP3s. Voice and prosody vary by OS/browser and are untested on Windows/Android/iOS *(docs)*. | ESOL experts weight authentic, varied, human input (accents, register, natural pace) above almost everything else in a listening program. | Human-audio pipeline: audio manifest per item, a teacher/voice-talent recording studio inside the platform, multiple speakers and accents, captions/transcripts, TTS only as labelled fallback. Recordings are human-required. |
| E2 | **"Multilingual" is EN/ES.** `src/multilingual.js` calls itself "English and Spanish only". Arabic, Chinese, French, Ukrainian, Russian, Portuguese appear only as **7 bridge samples**; Dari, Pashto, Tigrinya, Amharic, Nepali: **0 files**. | Translanguaging is a top-weighted ELD criterion; the newcomer populations most districts are scrambling to serve are exactly the missing languages. | Language-pack architecture (strings + glossary + directions + family letters + RTL support) with a review status per string; launch packs in priority order set by district data; never show unreviewed packs as reviewed. |
| E3 | **Spanish stops after grade 3.** 100% of K–3 activities have `directionsEs`; **0 / 749** grade 3–8 activities do. 110 `ES-REVIEW` markers remain; no human Spanish review has happened (H-05, H-13). In ES mode, task titles and video titles stay English ("Does Mulch Protect Soil From Washing Away?", "Building a stronger sentence"). | Inconsistent L1 support breaks the translanguaging promise exactly where academic language load peaks. | Complete grade 3–8 Spanish directions; human review; an ES-leak gate on every rendered route. |
| E4 | **Document language stays `en` in full-Spanish mode, but Spanish text is tagged at element level.** Measured live with Spanish selected: 104 of 105, 161 of 163 and 124 of 125 Spanish text nodes (home, `/write`, `/privacy`) sit inside `lang="es"`; `<html lang>` stays `en` by design (`shell.js` sets `I.pageLang`, and the English practice text on the page is English). Untagged residue: the breadcrumb current-page label (`components.js` `crumbsHTML` receives plain `I.S` strings that can also be English activity titles) and the Save/Resume launcher label (`#nsr-launcher`, a shared widget). *An earlier draft of this audit called this a screen-reader pronunciation failure. The measurement above shows it is not.* | Low. Element-level `lang` is valid under WCAG 3.1.2; the page-level value is a judgment call, not a defect. | Add a browser gate that fails when Spanish text in ES mode is not inside `lang="es"` (floor 98%). Ask Joel whether full-Spanish mode should set `<html lang="es">` and tag English target text `lang="en"` instead; do not auto-wrap the breadcrumb, because that would mislabel English activity titles. |
| E5 | **No SLIFE / pre-literate older newcomer path** *(docs: roadmap open item)*. | Serving students with limited or interrupted formal education is the hardest ELD problem and the one innovation juries notice. | Age-respectful foundational literacy for 10–14-year-olds (adult-themed decodables, oral-language-first missions, numeracy-literacy bridge). |
| E6 | **Proficiency descriptors are presented as "support choices", not levels** (152 can-dos). Correct and honest — but there is no student-facing "I can" growth narrative across domains. | ELD juries want learners to own their language goals. | A learner-owned can-do portfolio (Passport v2): evidence attached to each can-do, independence status, learner reflection in L1 or English. |
| E7 | **Role default is wrong.** A first-time visitor on student pages (`/path`, `/speak`, `/scenarios`, `/worlds/science-lab`…) sees a "Teacher · Student · Family View" toggle **set to Teacher**. | Students land in a teacher framing; teachers wonder what students see. | Default from the door chosen on home (Student door ⇒ Student view), persisted; teacher view only behind the Teacher door. |

### 3.3 Writing — 6.5

| # | Finding | Why it costs awards | Direction |
| --- | --- | --- | --- |
| W1 | **Only 22 Writing Studio tasks** (16 for 6–8, 6 for 3–5, **0 K–2**); 7 forms; KLU split Explain 8 / Argue 5 / Inform 5 / Narrate 4. | Writing juries look for a full genre progression with volume of practice. | 8–12 tasks per form per band, K–8, with a genre progression (oral rehearsal → shared → guided → independent). |
| W2 | **Strong sentence-level layer under-used.** 132 TWR-style sets / 774 items exist, but they are a separate destination. | The research-backed move is sentence work *embedded in* content writing, not beside it. | Surface the exact TWR move the draft needs (because/but/so, appositives, sentence combining) inside the task, at the moment the feedback calls for it. |
| W3 | **Cognitive overload on the task page.** The CER task page also renders "Sentence Surgery & Cohesion X-Ray", "Clause Builder" (demo sentences about temperatures and drought, unrelated to the mulch prompt; the cohesion demo reads "The students tested the water. They recorded **As a result,**"), and "Echo-Self Time-Lapse Growth Mirror", all below a warm-up with eight textareas. | Writing specialists judge whether the interface protects the writer's attention. Novelty widgets unrelated to the prompt read as clutter. | One task, one writing surface, one feedback panel; tools appear only when the feedback invokes them, using the student's own sentence. |
| W4 | **No real audience loop.** Tasks name an audience (garden club, museum visitors) but there is no publishing, peer response or teacher conference built on the draft (Book Studio is separate). | Authentic audience and response are central in writing pedagogy and award narratives. | Class gallery + structured peer feedback (praise-question-polish with sentence frames, moderated) + teacher conference notes, all on the existing `/api/class` platform. |
| W5 | **Revision is kept but not shown as growth across tasks.** "Your first draft is kept so you can see how you grew" — per task only. | Juries love visible growth over time. | Writing portfolio timeline: same rubric dimensions across drafts and tasks, learner annotations, exportable for conferences. |

### 3.4 Educational Technology & Learning Engineering — 6.5

| # | Finding (live measurement) | Why it costs awards | Direction |
| --- | --- | --- | --- |
| T1 | **Page weight.** Home: **1.36 MB transferred, 158 requests, 414 KB of compressed CSS**; median page **157 requests, ~4.5 MB decoded**; heaviest `/start/guide` **7.6 MB / 188 requests**. `index.html` has **120 render-blocking stylesheets** and **133 modulepreloads**; lab CSS is **145 files / 2.1 MB**. | Shared school Wi-Fi and older Chromebooks; Core Web Vitals; Webby/T&L juries open it on ordinary hardware. *(docs: P0 mobile perf 65, LCP 5.6 s, CLS 0.165.)* | Route-level CSS splitting, critical CSS inline, one design-token sheet, image/video lazy-loading, a performance budget gate (≤ 250 KB first-view, ≤ 40 requests). |
| T2 | **Chrome stack.** On a 768-px-tall laptop: header row + wrapped "More" row + role/L1 bar + section strip + breadcrumb ≈ **270 px** before content; on a phone ≈ **470 px** before the page title. Language is chosen in **two places** on home (header EN/ES/EN+ES *and* a "Choose your language" banner). | Usability heuristics; the first screen should be the learning task. | One header (logo, search, language, grade, account/role), one contextual nav; collapse the rest. |
| T3 | **Four apps, three design systems.** Lab (cream/navy/teal, Plus Jakarta/Inter), `/studios/language` (dark green + gold, serif, different nav: Home/Practice/Games & Worlds/My Progress), `/language-adventures/` and `/language-studio/` (Next.js static exports **with no source in the repo**). | Brand coherence; maintainability; juries experience it as several products. | Decide keep / merge / retire for each sibling (Joel); bring survivors onto the lab's tokens and shell. You cannot fix compiled output without source. |
| T4 | **Sibling apps fail the 44-px rule.** Phone controls under 44 px: `/studios/language/family` **96%**, `/learning-studios/` **90%**, `/studios/language/games` **79%**, `/language-adventures/` **71%** (lab pages median **5%**). | Accessibility and touch usability. | Bring siblings under the same target-size gate. |
| T5 | **SEO & sharing.** **0 / 85** pages have `og:image`; `/access-teacher/` and `/access-teacher/predictive/` have no meta description; **9** pages share the title "Learning Studios · The Language Page"; Teacher Hub title still reads "ACCESS Practice Lab — Teacher Hub". | Discoverability; social share cards are often the first thing a jury sees. | Per-route title/description/OG image generated from `sitemap.js`; a gate for uniqueness. |
| T6 | **Contrast** — axe `color-contrast` (serious) on 5 `/wida-access/` pages (30 nodes). | Easy, but visible. | Fix tokens; add those pages to the axe gate. |
| T7 | **Cross-origin dependency.** 26 of the 85 pages fetch assets from `eduwonderlab.com`. | Coupling; CSP; offline behaviour. | Serve shared assets same-origin or declare and cache them. |
| T8 | **Strengths to cite:** zero runtime errors on 170 page loads; PWA with generated service worker (1,545 entries *(docs)*); Reading Comfort panel (themes, 5 sizes, spacing, ruler, calm motion); 114 files honour `prefers-reduced-motion`; 172 access test files and 57 e2e scripts. | — | Lead with these in entries. |

### 3.5 Innovation in Education — 7.5

The genuinely novel pieces — **Book Studio 2.0** (language supports attached to individual story elements, shown only to the intended proficiency profile, with "Preview as student" side-by-side Level 1 vs Level 5), **Experience Builder** (deterministic compiler from teacher text to a playable simulation), **WIDA Data Studio** (SEM-aware growth, scale-reset handling, refusal to forecast without validation), and **"AI that chooses, not writes"** — are award-grade ideas. They are hard to find: they sit among 122 destinations named like engines ("Interactive Language Learning Engine", "Echo-Self Time-Lapse Growth Mirror", "Sentence Surgery & Cohesion X-Ray").

**Direction:** pick **three signature innovations**, give each a plain name, a 60-second demo path, a one-page "how it works / why it matters / what the evidence says" and put them on the home page for adults. Innovation juries (HundrED, Reimagine Education) score *scalability and clarity of the innovation*, not count of features.

### 3.6 Futures of Learning — 6.0

| Gap | Direction |
| --- | --- |
| No unified learner model. Evidence lives in per-studio stores (attempts, passport, growth map, evidence notebook, journey). | One local-first **Language Evidence Graph**: every attempt normalised to (domain, KLU, can-do, support level, independence, content area, date). Every surface reads from it. |
| No learner-owned, portable record. Progress moves between origins only by manual `/move`. | **Language Passport v2**: learner-held, exportable, optionally signed (Open Badges 3.0 / verifiable credential shape), readable by any teacher with consent. |
| Teacher loop ends at dashboards. | **Tomorrow's Lesson co-pilot**: from class evidence, propose a 15-minute small-group plan (grouping, task, frames, exit check), chosen from authored materials, teacher approves. Keeps the "AI selects authored moves" rule. |
| Family loop is a letter. | **Family Companion**: weekly 5-minute EN/ES (and pack-language) at-home talk task tied to the week's mission, with optional voice reply to the teacher. |
| No multimodal composing. | **Multimodal Composer** (already on the LanguageOS roadmap, NOT STARTED): image + voice + text artifacts assessed on the same rubric dimensions. |

### 3.7 Trust & Evidence (cross-cutting) — 4.0 — **award blockers**

| # | Finding (verified) | Severity | Direction |
| --- | --- | --- | --- |
| X1 | **Privacy page contradicted by live traffic.** `src/views/privacy.js`: *"No ads. No third-party analytics or trackers."* Claims ledger C-004 adds *"Audio is never uploaded."* Live crawl: **85 / 85 pages request `static.cloudflareinsights.com`** (Cloudflare Web Analytics beacon). Class voice notes **do** upload audio when a learner shares *(docs/class-platform.md)*. | **Critical** — a children's-privacy reviewer (Common Sense, district DPAs, Student Privacy Pledge signatories) will fail this on sight. | Joel decides: remove the beacon from this host, *or* keep it and rewrite the privacy text precisely. Either way, a network-capture test that fails if any third-party host is contacted that the privacy page does not name. Correct "never uploaded" to the actual opt-in behaviour. |
| X2 | **No human review anywhere.** 508 / 508 `reviewStatus` = `automated-checks-only`; Spanish unreviewed; WIDA tags inferred; Vocab Academy "auto-checked only" *(docs)*. | **Critical** for curriculum, ESOL and writing juries. | A real editorial pipeline: reviewer roles, review queue, per-item status, sign-off log, and site copy that states coverage honestly. People do the reviewing; the build cannot. |
| X3 | **No evidence of impact.** No logic model, no efficacy plan (`docs/language-page/efficacy-plan.md` referenced, absent), no usability study (`usability-protocol.md` absent), no ACR/VPAT (`acr.md` absent). | **Critical** — ESSA Tier IV ("demonstrates a rationale") is the entry ticket for most edtech recognitions and district procurement. | Write the logic model and study design; instrument consented, privacy-preserving outcome measures; run moderated usability sessions; publish an ACR after a real screen-reader pass. |
| X4 | **Claims enforcement never built.** `tools/access-lab-claims.test.mjs` is referenced by the ledger as "added in P2"; it does not exist. | High | Build it: any rendered claim must map to a `verified` ledger row. |
| X5 | **Governance tensions needing Joel's explicit decision** (not defects — recorded or implied product decisions): (a) Teacher Hub and Data Studio are served with **no password** on this host (`LAB_HOST_OPEN = true`, "Joel, 2026-11-17"); (b) the Data Studio *can* display "Predicted ACCESS Overall level" ranges in demo/validated mode, while the v6.0 release rules say "never predict ACCESS scores or placement"; (c) `/api/class/ai/writing` sends learner drafts to a model provider but is not in `PLATFORM.md`'s AI exception list; (d) docs disagree with code on (a) in four places. | High | Record each decision in `data/product-decisions.json` with Joel's words, align every doc to the code, and make the privacy/AI pages describe exactly what happens. |

---

## 4. Award landscape and readiness

Programs are listed by the domain they reward. **Current-year criteria, categories and deadlines must be verified from each program's official site before any entry is prepared** — this table records fit, not dates.

| Domain | Programs worth targeting | What they actually judge | Today |
| --- | --- | --- | --- |
| ESOL / ELL | SIIA CODiE (ELL category); EdTech Awards (EdTech Digest) ELL categories; EdTech Breakthrough ELL category; WIDA PRIME correlation (a credential, not an award) | Alignment depth, authentic input, L1 support, teacher usability, evidence | Blocked by E1–E4, X2, X3 |
| Curriculum | Digital Promise product certifications (Research-Based Design; Learner Variability); ISTE Seal of Alignment; ESSA Tier IV certification via a third-party evaluator | Logic model, research basis, learner-variability design, standards alignment | Blocked by C1–C3, X3 |
| Writing / literacy | Literacy and writing categories in CODiE, EdTech Awards, Tech & Learning Awards of Excellence | Genre progression, feedback quality, volume, revision and audience | Blocked by W1, W3 |
| EdTech / design | Webby (Education); Tech & Learning; Common Sense privacy evaluation; 1EdTech TrustEd Apps; a published WCAG 2.2 AA ACR | Performance, clarity, accessibility, privacy truthfulness | Blocked by X1, T1–T3, E4 |
| Innovation | HundrED Global Collection; Reimagine Education (QS) | Novelty, scalability, clarity, early impact evidence | Close — needs §3.5 focus + X3 |
| Futures / responsible AI | Digital Promise responsible-AI certification (verify current name); EdSAFE AI Alliance SAFE framework alignment | Safety, accountability, fairness, efficacy of AI features | Close — needs X1, X5(c) and documentation |

---

## 5. Priority sequence (what moves the score most per unit of work)

1. **Truth first (week 1):** X1 privacy/beacon, X4 claims gate, X5 decisions recorded, docs aligned to code.
2. **Coherence (weeks 1–3):** one identity, one shell, role default (E7), chrome diet (T2), three signature innovations surfaced (§3.5).
3. **Spine (weeks 2–6):** grade-band scope and sequence (C1), single phonics scope + PA strand (C2), tagging schema + gate (C3).
4. **Language input (weeks 3–8):** human-audio pipeline (E1), Spanish 3–8 completion (E3), language-pack architecture (E2), SLIFE path (E5).
5. **Writing (weeks 4–8):** task volume K–8 (W1), embedded sentence moves (W2), focused task page (W3), audience loop (W4), portfolio (W5).
6. **Performance (parallel):** CSS split, budgets, sibling-app decision (T1, T3, T4, T5).
7. **Futures layer (weeks 6–12):** Evidence Graph, Passport v2, Tomorrow's Lesson co-pilot, Family Companion.
8. **Evidence (start week 1, runs continuously):** logic model, usability protocol, efficacy plan, ACR — and the human reviews only people can do.

The companion build prompt is `docs/language-page/award-program-prompt.md`.

---

## Status update, 2026-11-25
Tranche 1 and 2 are on `main`; the live record is `docs/language-page/program-state.md`. Findings changed by this work:
**X1** closed with proof (beacon gone on production, 79 routes; claim C-004 verified) · **X4** closed (claims gate in `npm test`) ·
**X5** closed (docs-truth test; four docs corrected) · **E7** closed (Student default; browser test) · **C6** and **T5** partly closed
(one name, titles, share card; per-route unique titles and the `/studios` app still open) · **E3** partly (4 strings; grades 3–8
directions still open) · **T6** fixed in source (production re-measure pending) · **E4** was overstated in the first draft of this
audit and is corrected above (Spanish text is tagged; 98.2% measured). **X3** now has the plan documents (`logic-model.md`,
`efficacy-plan.md`, `usability-protocol.md`, `pilot-kit.md`, `acr.md`, `privacy.md`); no study or session has been run, so no
evidence exists yet. Everything else in this audit is still open.

### Tranche 3 (2026-11-25)
**X5** also now has the AI model cards (`ai-model-cards.md`, drift-tested: every route that calls a model must have a row) · **C3** has a
measured baseline and a ratchet (`coverage-matrix.md`; 42.2% of 933 activities carry a Key Language Use, 16.5% a content area, almost
all in grades 3–5; no tag was invented) · **E1** has its pipeline (`data/language-page-audio-manifest.json`, one row per listening
script with a hash; recordings register in `data/language-page-audio-recordings.json`; 0 of 234 are recorded and the gate refuses a
recording whose script changed) · **T1** is measured and ratcheted (`data/language-page-perf-budget.json`; the budgets are not met, only held) ·
**C1** has a `/method` page (how it works, in EN and ES, no efficacy claim) · **T5** closed for the `/studios/language/*` pages (each now
has its own title). Still open: everything that needs a person (reviews, recordings, sessions) and the larger content work.

### Correction to E3, 2026-11-25
E3 said "0 / 749 grade 3–8 activities have Spanish directions". That measured only the `directionsEs` field, which the K–3 files use. Grades
3–8 keep their Spanish in `content/es-guide.json`, keyed by activity id (skill goal for caregivers, directions for children), and
`tools/access-es-strings.test.mjs` requires an entry for every activity. A grade 3–5 listening activity opened in Spanish mode shows its
Spanish directions beside the English ones. What E3 gets right: the Spanish is machine-drafted and unreviewed (H-05), and an activity's
**title** stays English in Spanish mode. So the open work is review plus Spanish titles, not "complete grade 3–8 directions".
This is the second finding (after E4) that measured the wrong field; the lesson for later audits is to read how the app loads
a language before counting a field.

### Tranche 3 is live (2026-11-25)
Production serves `ce40e6f9`; `smoke:live` 41/41; the live network gate passes on 79 routes; `/studios/language/speaking` and `/writing`
carry their own titles; `/method` answers 200 and is in the sitemap.

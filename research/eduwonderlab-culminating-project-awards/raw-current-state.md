# Raw Research: Current State — EduWonderLab Culminating Projects

**Audit date:** 2026-07-14
**Primary question:** What concrete upgrades would make the culminating projects at `eduwonderlab.com/curriculum` competitive for credible awards in education innovation, mathematics teaching, multilingual/ESOL mathematics instruction, and forward-thinking learning design?
**Angle:** Current curriculum/product state: project inventory, student experience, evidence capture, accessibility, authenticity, multilingual supports, and gaps.
**Method:** Read-only inspection of the live site and the local repository. The live state matters because the deployed project layer is newer than this checkout.

## Findings

### 1. This is already a coherent project platform, not a collection of PDFs

The public curriculum exposes a culminating-project link for every numbered unit. Behind those links is a repeated project architecture: a choice hub, two parallel student experiences in most domains, a multi-step interactive wizard, live calculators/feedback, differentiation tiers, bilingual text, read-aloud, save/resume, peer comparison, reflection, rubric self-assessment, and report/portfolio export. The live project pages also load shared layers for math modeling, exemplars, sentence starters, a Socratic AI coach, accessibility hardening, evidence checks, publication, Canvas/SCORM reporting, and—on most pages—3D/AR.

That platform-level consistency is a real award asset. A judge could see a replicable instructional model rather than a one-off “cool project.”

Evidence:

- Live curriculum: <https://eduwonderlab.com/curriculum/>
- Representative live hub: <https://eduwonderlab.com/math/unit-5/projects/>
- Representative live student project: <https://eduwonderlab.com/math/unit-5/projects/version-a/>
- Local curriculum source: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/curriculum/index.html` (visible unit links around lines 2742, 3028, 3234, 3486, 3748, 3951, 4215, 4464, 4723, 4980)
- Local project smoke specification: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/tests/projects-smoke.spec.ts`

### 2. The project system has meaningful student agency, but most agency is bounded choice

Students generally choose between two contextual versions that target the same standards and rubric. Examples include designing versus investigating, choosing scenario parameters, using Level 1 or Level 2, comparing with a peer, explaining reasoning, and creating a reader-ready portfolio. This is much stronger than a single prescribed worksheet.

However, the current projects mostly ask students to complete a pre-authored scenario and sequence. They rarely let students identify a local problem, define success criteria with a stakeholder, choose the mathematical model, prototype more than one solution, test with users, revise after critique, or negotiate the final artifact. The live “Publication Studio” exports a polished packet, but it does not itself create a real public exhibition, stakeholder handoff, or response loop.

Evidence:

- Choice language and parallel-rubric design on all local hubs, e.g. `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/math/unit-5/projects/index.html`
- Live publication layer: <https://eduwonderlab.com/shared/projects/projects-publication.js?v=20260714>
- Live metacognition/portfolio layer: <https://eduwonderlab.com/shared/projects/projects-future.js>
- Representative student sequence: <https://eduwonderlab.com/math/unit-5/projects/version-a/>

### 3. Mathematics is visible and contextual, but the projects need a stronger mathematical-modeling cycle

The projects do several things unusually well for Grade 6 project work: formulas are visible; quantities have units; students receive immediate calculator feedback; real-world reference ranges appear in many tasks; “Estimate → Model → Explain” has been added across projects; and reports capture work and reflection. Many contexts are genuinely useful for applied mathematics—pricing, floor plans, recipes, maps, fundraising, phone plans, package design, aquariums, and class data.

The limitation is that much of the mathematics is still verification of prompted calculations. A major award application would be stronger if every project visibly documented a modeling cycle: formulate assumptions, select variables, estimate, build and compare models, validate against evidence, analyze sensitivity/error, revise, and defend a decision. Current shared layers capture completion and explanations but do not consistently capture assumptions, failed models, revisions, uncertainty, or transfer to a novel case.

Evidence:

- Live visual-modeling layer: <https://eduwonderlab.com/shared/projects/projects-visuals.js>
- Representative project formulas, real-world ranges, partner comparison, and generated report: <https://eduwonderlab.com/math/unit-5/projects/version-a/>
- Local source for that project: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/math/unit-5/projects/version-a/index.html`

### 4. Evidence capture is unusually rich, but it measures activity more reliably than learning impact

The live system captures or exports multiple kinds of evidence:

- auto-saved student inputs and progress;
- per-step “Explain it back” reflections;
- rubric self-ratings and an improvement goal;
- checklist completion;
- a printable portfolio and a publication packet;
- progress milestones and Canvas/SCORM scores;
- teacher-approved, redacted peer exemplars;
- research-evidence ledgers where projects contain web-research blocks.

This is a strong foundation for award evidence. The gap is outcome validity. The inspected public and repository sources do not show project-specific pre/post measures, common performance-task scoring calibration, inter-rater reliability, transfer tasks, comparison cohorts, subgroup outcomes, student voice data, implementation fidelity, or longitudinal growth. Current telemetry can show that students advanced through steps; it cannot by itself prove deeper mathematical reasoning, language growth, equity impact, or better transfer.

Evidence:

- Live evidence/publication layer: <https://eduwonderlab.com/shared/projects/projects-publication.js?v=20260714>
- Live portfolio layer: <https://eduwonderlab.com/shared/projects/projects-future.js>
- Live milestone/exemplar layer: <https://eduwonderlab.com/shared/projects/projects-publisher.js>
- Live progress backend health: <https://eduwonderlab.com/api/progress/health> (returned `{"ok":true,"backend":"cloudflare","d1":true}` during audit)
- Local save/resume engine: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/shared/save-resume/save-resume-engine.js`
- Local Canvas/SCORM bridge: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/assets/canvas-bridge.js`

### 5. ESOL supports are substantial, but Spanish availability is not yet a full multilingual mathematics framework

Strengths observed across the project ecosystem include Spanish interface/content spans, an EN/ES toggle, Spanish text-to-speech selection, visual vocabulary, sentence frames, exemplars, tiered supports, explanatory prompts, partner talk, and repeated writing-to-learn/reflection. These features reduce language load while keeping students in grade-level mathematics.

Important gaps remain:

- No explicit language objectives or WIDA-aligned language functions by proficiency level were found.
- The live `publisher.json` files inspected for Unit 5A and Unit 9B contain English-only exemplars, reasons, and sentence starters; the shared publisher code inserts those strings without a localized data structure. A Spanish-interface student can therefore encounter English-only high-leverage scaffolds.
- Base-page Spanish coverage is uneven. In the downloaded live HTML, most project pages contained roughly 110–187 `es-text` spans; Unit 2A contained 55 and Unit 9B only 15, suggesting incomplete or structurally different translation coverage that needs a human audit.
- The system primarily supports English and Spanish, not multilingual meaning-making across students' home languages.
- No oral-response capture, bilingual glossary personalization, morphology/cognate instruction, proficiency-sensitive sentence expansion, or language-growth rubric was found.
- Partner activity exists, but structured mathematical discourse roles and accountable-talk protocols are not consistent project invariants.

Evidence:

- Live publisher layer: <https://eduwonderlab.com/shared/projects/projects-publisher.js>
- Live Unit 5A publisher content: <https://eduwonderlab.com/math/unit-5/projects/version-a/publisher.json>
- Live Unit 9B publisher content: <https://eduwonderlab.com/math/unit-9/projects/version-b/publisher.json>
- Representative bilingual project: <https://eduwonderlab.com/math/unit-5/projects/version-a/>
- Local Unit 9B source: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/math/unit-9/projects/version-b/index.html`

### 6. Accessibility has been engineered into the shared layer, but conformance evidence is incomplete

The repository and live layers show intentional accessibility work: responsive/mobile styles, labeled project navigation, `aria-live`/status regions for calculator feedback, `aria-pressed` on stateful controls, bounded numeric inputs, keyboard interaction, focus handling, horizontal wrappers for wide rubrics, print support, read-aloud, high-contrast styling, and graceful failure. The Playwright project suite explicitly checks several of these invariants across all hubs and version pages.

The test suite is a smoke/invariant suite, not a complete accessibility audit. Although `@axe-core/playwright` is installed, `tests/projects-smoke.spec.ts` does not run axe. No public WCAG 2.2 AA conformance statement, assistive-technology test matrix, captions/transcripts for all audio, color/zoom/reflow audit, dyslexia/readability study, or disability user-testing record was found. The large number of injected layers also raises cognitive-load and keyboard-order risks that require real-user validation, not only DOM assertions.

Evidence:

- Local test: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/tests/projects-smoke.spec.ts`
- Local GOLD layer: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/shared/projects/projects-gold.js`
- Live GOLD layer: <https://eduwonderlab.com/shared/projects/projects-gold.js>
- Local package/test dependencies: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/package.json`

### 7. The forward-looking technology is real, but it needs a clearer pedagogical and ethical story

The live deployment includes a health-gated Socratic AI coach, interactive math workspaces, 3D model builders, WebXR/AR on most pages, portfolio publishing, approved peer exemplars, offline-first save/resume, and LMS interoperability. During the audit, `/api/tutor/health` reported that the Claude-backed coach was live. `publisher.json` and `visuals.json` returned 200 for all 22 standard wizard pages; `build3d.json` returned 200 for 18 of 22 (all except Unit 1A/B and Unit 2A/B).

These features can support an innovation-award narrative only if their learning purpose is demonstrated. Right now the source explains that the coach should give hints rather than answers, but the student-facing coach copy does not visibly provide a full AI disclosure, data-flow explanation, opt-in/opt-out choice, limitations statement, or teacher review protocol. AR/3D similarly needs evidence that it improves spatial reasoning or model critique rather than simply adding spectacle.

Evidence:

- Live coach: <https://eduwonderlab.com/shared/projects/projects-coach.js>
- Live coach health: <https://eduwonderlab.com/api/tutor/health> (returned `{"ok":true,"backend":"claude","live":true,"claude":true}` during audit)
- Live 3D/AR layer: <https://eduwonderlab.com/shared/projects/projects-3d.js>
- Live representative 3D config: <https://eduwonderlab.com/math/unit-5/projects/version-a/build3d.json>
- Local project injection tools: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/tools/inject-projects-3d.mjs`, `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/tools/inject-projects-publisher.mjs`

### 8. A high-severity curriculum navigation mismatch currently undermines coherence

The visible End-of-Unit links on the live curriculum page are wrong for Units 7–9:

- Curriculum Unit 7 is **Equations & Inequalities**, but its visible link goes to `/math/unit-7/projects/`, whose hub is **Integers & Coordinate Plane in Action**.
- Curriculum Unit 8 is **Statistics**, but its visible link goes to `/math/unit-8/projects/`, whose hub is **Equations & Inequalities in Action**.
- Curriculum Unit 9 is **Integers & the Coordinate Plane**, but its visible link goes to `/math/unit-9/projects/`, whose hub is **Two-Variable Relationships in Action**.

A separate JavaScript map in the same page contains what appear to be the intended destinations: Unit 7 → `/math/unit-8/projects/`, Unit 8 → `/math/statistics/projects/`, Unit 9 → `/math/unit-7/projects/`. This means two sources of truth disagree. A judge navigating normally would encounter the wrong culminating mathematics in three consecutive units.

Evidence:

- Live curriculum: <https://eduwonderlab.com/curriculum/>
- Live hubs: <https://eduwonderlab.com/math/unit-7/projects/>, <https://eduwonderlab.com/math/unit-8/projects/>, <https://eduwonderlab.com/math/unit-9/projects/>, <https://eduwonderlab.com/math/statistics/projects/>
- Local curriculum source: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/curriculum/index.html` (visible links around 4215, 4464, 4723; conflicting `UNIT_CULMINATING_PROJECT` map around 5955–5965)

### 9. The live deployment is ahead of the checked-out source, weakening reproducibility

The live Unit 5A HTML and its local counterpart have different hashes and markup. The live page loads a versioned save/resume layer and a newer `projects-publication.js`; that publication script is not present in this checkout. The live and local answer-key-gate scripts also differ by hash. This is not necessarily a student-facing defect, but it creates source-of-truth, auditability, and award-demonstration risk: a reviewer or maintainer cannot fully reproduce the observed live system from the checked-out branch.

Evidence:

- Live representative page: <https://eduwonderlab.com/math/unit-5/projects/version-a/>
- Local representative page: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/math/unit-5/projects/version-a/index.html`
- Live publication script: <https://eduwonderlab.com/shared/projects/projects-publication.js?v=20260714>
- Local shared project directory: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/shared/projects/`

### 10. Privacy and answer-key protection need production-grade treatment before award submission

The live save/resume engine asks for a student's full name and class and is configured to mirror every save to a Google Apps Script endpoint. The shared publisher layer separately sends named milestone telemetry to `/api/progress/telemetry` when a locally stored identity exists. The inspected student UI says that work is saved on the device, but it does not visibly explain these external transfers, retention, access, deletion, or consent. The peer-exemplar route is designed to redact names and require teacher approval, which is a positive safeguard, but the overall data-governance story is not visible to students or families.

Teacher answer keys are fail-closed visually and have a keyboard-accessible gate, but the shared PIN is hard-coded in client-side JavaScript and described in source as a “casual-access gate, not cryptographic security.” That protects against accidental exposure, not determined access. It should not be represented as secure answer-key protection.

Evidence:

- Live save/resume engine: <https://eduwonderlab.com/shared/save-resume/save-resume-engine.js?v=20260714-v2>
- Live milestone/exemplar layer: <https://eduwonderlab.com/shared/projects/projects-publisher.js>
- Live exemplar endpoint, representative activity: <https://eduwonderlab.com/api/progress/exemplars?activity=math-unit-5-projects-version-a> (returned zero approved exemplars during audit)
- Local answer-key gate: `/Users/joelneft/.codex/workspaces/default/neft-classroom-html-activities-links/shared/projects/answer-key-gate.js`
- Representative answer key: <https://eduwonderlab.com/math/unit-5/projects/answer-key/>

## Project inventory

The ecosystem contains **24 student-facing culminating choices** across 11 hubs if the two explicit third-option capstones are counted (World Architect and Statistics of My Life). The 22 standard Version A/B projects share the most consistent platform layers.

| Hub/domain | Student project choices | Current experience/authenticity notes | Live hub |
|---|---|---|---|
| Unit 1 — Number Sense | **Block Party Planner**; **Build-a-Bot Budget Lab** | Contextual planning/budgeting; factors, multiples, decimal operations; peer and written deliverables | <https://eduwonderlab.com/math/unit-1/projects/> |
| Unit 2 — Fraction Division | **Recipe Remix Bakery**; **Maker Workshop Cut List** | Scale recipes or plan physical cut lengths; strong applied measurement context | <https://eduwonderlab.com/math/unit-2/projects/> |
| Unit 3 — Ratios & Rates | **Smoothie Bar Designer**; **Sports Stats Scout** | Product design or sports comparison; rate/proportion reasoning | <https://eduwonderlab.com/math/unit-3/projects/> |
| Unit 4 — Percents & Rates | **Pop-Up Shop Owner**; **Smart Shopper Showdown** | Pricing, discount, tax, and consumer decision-making; some web-source/reference use | <https://eduwonderlab.com/math/unit-4/projects/> |
| Unit 5 — Area | **Dream Room Designer**; **Room Makeover Budget** | Real-space measurement, composite area, materials, cost, partner comparison | <https://eduwonderlab.com/math/unit-5/projects/> |
| Unit 6 — Expressions | **Game Studio Scoring Engine**; **App Pricing Engine** | Build and interpret rule systems; an Expression Engine practice tool is also linked but is not framed as a third parallel capstone | <https://eduwonderlab.com/math/unit-6/projects/> |
| Folder Unit 7 — Integers/Coordinates | **Theme Park Map Designer**; **Submarine Mission Control** | Coordinate maps, distance, elevation/temperature; intended by the JS curriculum map for curriculum Unit 9 | <https://eduwonderlab.com/math/unit-7/projects/> |
| Folder Unit 8 — Equations/Inequalities | **Escape Room Architect**; **Fundraiser Goal Tracker** | Design constraints and goal modeling; intended by the JS curriculum map for curriculum Unit 7 | <https://eduwonderlab.com/math/unit-8/projects/> |
| Folder Unit 9 — Two-Variable Relationships | **Streaming Channel Growth Lab**; **Phone Plan Showdown** | Tables, graphs, variables, comparison/recommendation; currently linked from curriculum Unit 9 despite domain mismatch | <https://eduwonderlab.com/math/unit-9/projects/> |
| Unit 10 — Volume/Surface Area | **Package Design Challenge**; **Aquarium Build Lab**; **World Architect Expedition** | Product/space design, 3D models, surface area/volume; the clearest engineering-design family | <https://eduwonderlab.com/math/unit-10/projects/> |
| Statistics | **Statistics of My Life**; **Class Data Detective**; **Real-World Data Investigation** | Personal/class/real datasets and data displays; intended by the JS curriculum map for curriculum Unit 8 | <https://eduwonderlab.com/math/statistics/projects/> |

Cross-project features observed on the 22 standard Version A/B pages:

- multi-step wizard, progress trail, auto-save/resume, printable report;
- Level 1/Level 2 differentiation plus injected lower-entry supports;
- EN/ES base content and text-to-speech, though completeness/quality is uneven;
- visual vocabulary, sentence starters, exemplars, partner comparison, reflection;
- live calculators with immediate feedback and bounded numeric inputs;
- rubric, self-assessment, improvement goal, checklist, portfolio evidence check;
- Canvas/SCORM progress reporting and teacher-facing telemetry;
- interactive “Estimate → Model → Explain” workspace on all 22 pages;
- `publisher.json` and `visuals.json` present on all 22 live pages;
- `build3d.json` present on 18 of 22 pages (not Unit 1A/B or Unit 2A/B);
- AI Socratic coach available when the live tutor backend is healthy;
- research evidence ledger only mounts where a project contains an eligible web-research block;
- teacher-approved peer exemplars are supported, but the representative Unit 5A query had zero approved examples at audit time.

## Key claims with evidence-strength notes

| Claim | Evidence strength | Basis / limitation |
|---|---|---|
| The live curriculum provides a culminating project link for each of 10 numbered units. | **Strong** | Direct inspection of live and local curriculum HTML; all linked hubs returned HTTP 200. |
| There are 22 consistent A/B project wizards plus World Architect and Statistics of My Life, for 24 named culminating choices. | **Strong** | Direct inventory of all hub links and local paths; distinction made between standard shared-platform pages and extras. |
| Shared features include save/resume, live feedback, tiers, reflection, rubric, self-assessment, portfolio, publication, and LMS reporting. | **Strong** | Repeated markup across all downloaded live pages plus direct inspection of shared scripts and the all-route Playwright test. |
| Spanish supports exist broadly but are not consistently complete or localized at the highest-leverage scaffold layer. | **Strong** | Direct counts of `es-text` spans across 22 live HTML files; inspected Unit 5A and Unit 9B `publisher.json` contain English-only exemplar/starter data; shared code has English generic fallbacks. Human translation quality was not assessed. |
| The visible curriculum links for Units 7–9 target the wrong project domains. | **Strong** | Direct comparison of curriculum unit names/visible hrefs, destination hub headings, and conflicting internal JavaScript map. |
| Current telemetry demonstrates use/completion more than validated learning impact. | **Strong** for what is captured; **Moderate** for absence across all possible private records | Shared scripts explicitly capture milestones, progress, reflections, ratings, and exports. No public/repository evidence of rigorous outcome study was found, but private evaluation data could exist outside scope. |
| Most tasks are contextual simulations rather than stakeholder-authenticated projects. | **Moderate** | Direct review of all hub descriptions and representative project flows; no external-client handoff/revision mechanism was found. Teachers could add authentic audiences offline. |
| Accessibility engineering is substantial but WCAG conformance is unproven. | **Strong** | Shared GOLD layer and tests show specific protections; project smoke test does not call axe and no conformance/user-test artifact was found. |
| AI/AR features are live and technically integrated. | **Strong** | Tutor health returned live Claude backend; shared scripts and 18 live `build3d.json` responses confirm AR/3D coverage. Learning-effectiveness claim remains unproven. |
| Student data handling lacks visible, comprehensive disclosure in the inspected UI. | **Strong** | Live scripts transfer full-name/class saves and may send named milestone telemetry; inspected save panel says device save but provides no retention/deletion/third-party disclosure. A separate privacy page not linked in these flows could exist. |
| The checkout is not a full reproducible source of the live state. | **Strong** | Live/local hashes differ; live references `projects-publication.js`, absent from this checkout. |

## Gaps

### Immediate credibility blockers

1. **Fix the Unit 7–9 visible-link/domain mismatch and eliminate the duplicate mapping source of truth.** No award application should be submitted while three consecutive curriculum links launch the wrong culminating mathematics.
2. **Reconcile live deployment and repository source.** Tag a release, make the exact deployed artifact reproducible, and publish a change log/architecture map.
3. **Replace casual client-side answer-key gating with real authorization or remove public solution payloads.** The current hard-coded PIN is discoverable.
4. **Publish transparent student-data and AI notices in the activity flow.** Explain full-name/class collection, Google/Cloudflare storage, telemetry, peer-exemplar approval/redaction, retention/deletion, AI context sent, and opt-out alternatives.
5. **Run and publish a real accessibility audit.** Add axe coverage to every standard project, keyboard/screen-reader/manual checks, zoom/reflow and contrast tests, and student testing with disabled learners.

### Upgrades needed for an education-innovation award

6. Convert the shared sequence into a visible **Discover → Define → Model → Prototype → Test → Revise → Publish/Defend** cycle, with revision history and feedback artifacts.
7. Give each unit an optional **local/community design brief** with a real stakeholder, constraints, interview protocol, feedback meeting, and audience-facing deliverable.
8. Make the Publication Studio support a safe **teacher-moderated exhibition** (class gallery, family showcase, stakeholder review) rather than export only; record audience feedback and student response to it.
9. Add **student co-design**: students generate project contexts/data questions, choose artifact formats, and help define quality criteria.
10. Provide a public **implementation playbook**: lesson timing, teacher moves, materials, exemplar progression, likely misconceptions, offline/low-tech version, and adaptation case studies.

### Upgrades needed for a mathematics-teaching award

11. Make a common mathematical-modeling rubric the platform source of truth: problem formulation, assumptions, representation, calculation, validation, sensitivity/error, interpretation, revision, and communication.
12. Require students to compare at least two models/solutions and justify tradeoffs, not only calculate one prompted answer.
13. Add **novel transfer checks** after each project and use common anchor papers with calibrated teacher scoring.
14. Capture mathematical decisions and misconceptions over time, not just final answers and step milestones.
15. Convene external mathematics-education reviewers to validate standards alignment, cognitive demand, task equity, and scoring quality.

### Upgrades needed for ESOL/multilingual mathematics awards

16. Localize the entire publisher/exemplar/starter data model; do not present English-only sentence frames and exemplars in Spanish mode.
17. Add per-project **content and language objectives**, WIDA-aligned language functions, and scaffold bands that fade with proficiency rather than mapping language support to math difficulty.
18. Build structured discourse routines (roles, rehearsal, revoicing, agree/disagree with evidence, compare representations) into every project.
19. Support multilingual production: oral explanation, drawing/annotation, bilingual labels/glossaries, home-language planning, and translated family/audience feedback.
20. Add a language-growth rubric and collect subgroup evidence showing multilingual learners' gains in mathematical discourse and reasoning without reducing mathematical rigor.

### Upgrades needed for forward-thinking/technology awards

21. Give AI an explicit pedagogical contract: student opt-in, age-appropriate disclosure, teacher visibility, bias/safety testing, citation/provenance when appropriate, and evaluations showing that hints improve reasoning without doing the work.
22. Use AR/3D as a required model-testing medium where it adds mathematical value—for example, compare digital dimensions with a physical prototype, detect scale errors, or collect spatial-reasoning evidence.
23. Turn telemetry into an ethical **learning-evidence dashboard** with data minimization, consent, deletion, accessibility, subgroup analysis, and teacher-action recommendations.
24. Run a pilot study with pre/post transfer tasks, common rubric scoring, inter-rater reliability, student/teacher interviews, and disaggregated outcomes; publish results and limitations.

### What could not be established in this audit

- Whether private classroom outcome data, family consent forms, district privacy agreements, accessibility reports, or external review letters already exist outside the repository/public site.
- Whether all live injected features render without runtime defects in every browser; this audit verified HTTP availability, source behavior, and repository tests but did not execute the full Playwright suite against production.
- The quality/accuracy of every Spanish translation; the audit found uneven coverage and English-only scaffold data, but a bilingual educator must perform the linguistic review.
- Whether projects are already used with authentic external audiences offline; no platform evidence of that process was found.

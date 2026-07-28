# Award portfolio — architecture

How the six products connect, and the schemas behind them. Read
[`repository-audit.md`](repository-audit.md) first for what existed before this
work; read [`maintainer-checklist.md`](maintainer-checklist.md) before adding a
lesson, activity, or product.

---

## The shape of it

```
                    data/curriculum-canonical.json      data/product-registry.json
                    (generated: units, lessons,          (hand-maintained: the six
                     standards, aliases, products)        approved products)
                              │                                    │
        ┌─────────────────────┼────────────────────────────────────┤
        │                     │                                    │
  EWLRegistry           EWLEvidence  ◄── adapters ──┐        EWLProductCards
  (alias resolution)    (versioned events)          │        (every product card
        │                     │                     │         on every surface)
        │                     │              mrpg:hero (read-only)
        │                     │              save/resume, portfolio
        │                     ▼
        │            EWLInstructionalNeed  ──►  the transparent recommendation
        │            (nine named needs)          shown in My Math Path
        │
  EWLSupportProfile ──► data-ewl-* attributes ──► support-profile.css
  (one versioned record, follows the learner)
```

Every box above is a small, dependency-free IIFE that attaches to a global and
degrades to a no-op when its data is unavailable. No build step, no framework,
no bundling — the same constraints the rest of this static site works under.

## Files

| Concern | File |
| --- | --- |
| Canonical registry (generated) | `data/curriculum-canonical.json` |
| Registry generator | `scripts/generate-canonical-registry.mjs` |
| Product registry (hand-maintained) | `data/product-registry.json` |
| Registry client | `shared/evidence/curriculum-registry-client.js` |
| Evidence interface | `shared/evidence/learning-evidence.js` |
| Evidence adapters | `shared/evidence/adapters/{number-realm,portfolio,assessment,thinking-trails}-adapter.js` |
| Instructional-need classifier | `shared/evidence/instructional-need.js` |
| Support profile | `shared/support/support-profile.js` + `.css` |
| Scaffold ladder | `shared/support/scaffold-ladder.js` + `.css` |
| Product cards | `shared/portfolio/product-cards.js` |
| Shared portfolio styles | `shared/portfolio/portfolio.css` |
| Judge mode | `shared/portfolio/judge-mode.js` |
| Synthetic data | `shared/portfolio/synthetic-data.js` |
| Registry validation | `tools/validate-registries.mjs` |
| Public-security validation | `tools/validate-public-security.mjs` |
| Number Realm evidence injector | `tools/inject-number-realm-evidence.mjs` |

## Product routes

| Product | Entry | Judge mode |
| --- | --- | --- |
| Number Realm | `/math-rpg/` | `/judge-mode/number-realm/` |
| Language Bridge | `/language-bridge/` | `/judge-mode/language-bridge/` |
| Design Studio | `/design-studio/` | `/judge-mode/design-studio/` |
| Personalized Math Path | `/math/my-path/` | `/judge-mode/personalized-math-path/` |
| Grade 6 Curriculum System | `/curriculum/` | `/judge-mode/grade6-curriculum-system/` |
| Teacher Studio | `/teacher-studio/` | `/judge-mode/teacher-studio/` |

Monster Math Academy is **not** part of this portfolio. It stays live and
unchanged at `/curriculum/monster-math-academy/`. Two validators enforce that.

---

## Schema — canonical curriculum registry

`data/curriculum-canonical.json`. **Generated — do not hand-edit.** Regenerate
with `npm run generate-canonical-registry` (also part of `npm run curriculum:rebuild`).

Sources, in precedence order:

1. `data/curriculum-manifest.json` (itself generated from `lessons/*/config.json`)
2. `data/curriculum-unit-identities.json`
3. `data/ccss-standards.json`
4. `assets/learning-supports/manifest.json`
5. `data/product-registry.json`

### Unit record

| Field | Notes |
| --- | --- |
| `canonicalUnitId` | `unit-<n>` |
| `unitNumber`, `title`, `icon`, `description` | From the unit identities file |
| `skills`, `finalChallenge`, `accent` | From the unit identities file |
| `standards`, `standardsCrosswalk` | Codes used by this unit's lessons, plus their pre-2025 CCSS equivalents |
| `lessonIds`, `lessonCount` | Canonical lesson ids |
| `canonicalRoute` | `/curriculum/#unit-<n>` |
| `legacyAliases` | `math-unit-<n>`, `/math/unit-<n>/`, `/math-rpg/unit-<n>/` |
| `products` | Reverse-mapped from the product registry |
| `accessibilityFeatures`, `languageSupportFeatures` | Declared capabilities |

### Lesson record

| Field | Notes |
| --- | --- |
| `canonicalLessonId` | `lesson-<id>`; the raw `lessonId` (`3-1`) is preserved alongside |
| `unitNumber`, `lessonNumber`, `title`, `flagship` | |
| `standard`, `standardDescription`, `standardShortLabel` | From the standards SoT |
| `standardsCrosswalk` | `{ ccss2010: "6.RP.1" }` |
| `learningTarget`, `studentFriendlyLearningTarget`, `languageObjective` | |
| `essentialVocabulary` | `{ term, termEs, definition, definitionEs }` |
| `prerequisiteSkills` | **Derived**, not authored: the last two earlier lessons sharing this lesson's standards cluster. Each entry carries `derivedFrom` so this is never mistaken for hand-written pedagogy. |
| `resources` | Grouped `student` / `teacher` / `family` / `printable` / `assessment` / `other`. Only resources the manifest reports as existing on disk. |
| `games`, `products`, `supportedEvidenceEvents` | |
| `canonicalRoute`, `legacyAliases` | |

### Alias index

`registry.aliases` is a flat `alias → canonical id` map covering:

- legacy unit routes (`/math/unit-3/` → `unit-3`)
- pre-2025 CCSS codes (`6.RP.1` → `6.AT.1`)
- cluster-qualified spellings (`6.AT.A.1` → `6.AT.1`)
- lesson ids and standard-qualified lesson ids

Resolve through `EWLRegistry.resolve()`. **Adding a new alias is a registry
edit, not a code change.** Never re-implement the string surgery in a page.

---

## Schema — product registry

`data/product-registry.json`. **Hand-maintained.** Every product card and
product summary on the site is generated from it, so a product's name, tagline,
summary, audience, entry route, and unit connection are stated exactly once.

Required fields (enforced by `npm run validate:registries`): `id`, `slug`,
`name`, `shortName`, `tagline`, `summary`, `problemSolved`, `primaryAudience`,
`gradeLevels`, `coreExperience`, `differentiators`, `entryRoute`,
`canonicalUnits`, `evidenceSources`, `accessibilityFeatures`, `languageSupports`,
`privacyFeatures`, `implementationRequirements`, `awardCategoryTags`, `status`,
`limitations`, `lastValidated`.

Optional: `secondaryAudiences`, `standards`, `demoRoute`, `judgeModeRoute`,
`relatedRoutes`, `featuredAssets`, `manualEvidenceNeeded`.

Two fields exist specifically to keep the portfolio honest:

- **`limitations`** — what the product genuinely cannot do. Required and
  non-empty. Rendered on product hub pages under "Honest limits".
- **`manualEvidenceNeeded`** — what would require a human, consent, or an
  external review before it could be claimed (student work samples, translation
  review, efficacy data). Listing something here is how the registry says
  "we do not have this yet" instead of implying we do.

---

## Schema — evidence event (v1)

`shared/evidence/learning-evidence.js`. Stored under `ewl:evidence:v1` as
`{ v: 1, events: [...] }`, capped at 2,000 events (oldest dropped first).

**Only `eventType` is required.** Every other field is optional by design: an
activity that only knows "the student finished this" says exactly that, without
inventing a score, a confidence rating, or a mastery level. Unknown facts stay
`null`; they are never filled in with a guess.

Event types: `activity_started`, `activity_completed`, `item_attempted`,
`hint_requested`, `explanation_written`, `confidence_rated`, `support_used`,
`mastery_updated`, `project_checkpoint`, `project_submitted`, `portfolio_saved`,
`recommendation_shown`, `recommendation_accepted`, `intervention_result`,
`assessment_scored`, `badge_earned`.

Fields: `eventId`, `timestamp`, `synthetic`, `learnerId`, `classId`,
`productId`, `activityId`, `lessonId`, `unitId`, `standardIds[]`, `eventType`,
`completionStatus`, `score`, `maxScore`, `masteryLevel`, `attemptCount`,
`hintCount`, `answerRevisions`, `confidenceBefore`, `confidenceAfter`,
`writtenExplanation`, `misconceptionCodes[]`, `supportLevel`, `languageSetting`,
`readAloudUsed`, `vocabularySupportUsed`, `durationMs`, `projectArtifactRef`,
`portfolioRef`, `recommendationSource`, `recommendedNextActivity`,
`interventionResult`, `exportStatus`, `source`.

Controlled vocabularies: `masteryLevel` ∈ {`not_started`, `novice`,
`developing`, `proficient`, `advanced`}; `completionStatus` ∈ {`not_started`,
`in_progress`, `completed`, `abandoned`}. An out-of-vocabulary value is dropped
to `null` rather than stored.

### Migration

The persisted envelope carries its own version. `migrate()` accepts a bare
legacy array (treated as v1 rows) and the current `{ v, events }` shape. A
record written by a **future** version is left untouched on disk and reported as
empty, so an older tab can never destroy a newer profile. When v2 lands,
transform v1 rows inside `migrate()` — do not discard them.

### Adapters

`registerAdapter(name, fn)` where `fn()` returns raw event-ish objects **or a
Promise of them**. `sync()` runs every adapter and records only what is
genuinely new (event ids encode the value they describe, so a re-run with
unchanged data records nothing), and **always returns a Promise** so a caller
never has to branch on which kind it got. An adapter that throws or rejects is
skipped; one broken adapter never stops the others. **Adapters are read-only
with respect to the store they wrap.**

Four ship today:

| Adapter | Reads | Emits |
| --- | --- | --- |
| `number-realm-adapter.js` | `mrpg:hero`, `mrpg:unit<N>` | `mastery_updated`, `hint_requested`, `badge_earned`, realm completion |
| `portfolio-adapter.js` | `nt-project-complete:v1`, `nt-project-reflect:<path>` | `project_submitted`, `portfolio_saved`, `project_checkpoint`, `explanation_written` |
| `assessment-adapter.js` | `nt_results_log` | `assessment_scored` |
| `thinking-trails-adapter.js` | IndexedDB `neft-thinking-trails` + its localStorage fallback | `item_attempted`, `hint_requested`, `explanation_written`, `activity_completed` |

Three deliberate restraints, each asserted by a test:

- **The portfolio adapter emits no `standardIds`.** A completion record names a
  unit and a project, not a standard. Attributing a project to every standard in
  its unit would manufacture per-standard evidence the student never generated,
  and the recommendation rules would then reason from it. `unitId` is the honest
  granularity.
- **The assessment adapter records only the `Overall` rows.** `nt-results`
  writes one row per section plus a roll-up whose score is their sum; taking
  both would double-count every assessment. It also drops `Student Name`,
  `ESOL Level`, `IEP/504`, `Intervention Group`, `Attendance %`, `Teacher`, and
  `Class` — enumerated explicitly, so a new sensitive column upstream is a
  visible decision rather than a silent leak.
- **The Thinking Trails adapter leaves item content behind.** `prompt`,
  `studentAnswer`, and `correctAnswer` are the question bank, not evidence about
  the learner. Only the student's written explanation crosses over.

---

## Schema — support profile (v1)

`shared/support/support-profile.js`. Stored under `ewl:support-profile:v1`.

Fields: `interfaceLanguage`, `homeLanguageSupport`, `readAloud`,
`vocabularyPreview`, `sentenceSupportTier` (0–4), `readingSupportTier`,
`chunkedDirections`, `reducedMotion`, `largerText`, `highContrast`,
`calculatorAccess`, `multiplicationChartAccess`, `visualModelPreference`,
`writingSupport`, `focusMode`, `simplifiedDirections`, `translatedDirections`.

`passive` fields are reflected onto `<html>` as `data-ewl-*` attributes, which
`shared/support/support-profile.css` turns into behaviour. A page that links the
stylesheet honours a learner's supports with no per-page JavaScript.

### What is never stored

No diagnoses. No IEP or 504 documents. No medical information. No disability
labels. No confidential teacher notes. `BANNED_FIELDS` lists the forbidden
name fragments and both `test/award-portfolio.test.mjs` and
`tools/validate-public-security.mjs` assert that no declared field matches one.

A student turns on the supports that help them. Nothing in this record explains
or justifies why, because a student should not have to disclose a condition to
get a sentence frame.

---

## The scaffold ladder

Five rungs, numbered so **0 is independent**:

| Rung | Support |
| --- | --- |
| 4 | Vocabulary bank |
| 3 | Sentence starter |
| 2 | Complete sentence frame |
| 1 | Paragraph frame |
| 0 | Independent response |

The prompt and the learning target are authored once and rendered unchanged at
every rung. A page physically cannot offer an easier mathematical question at a
higher support level through this component; a browser test walks all five rungs
and asserts the prompt and target text are byte-identical.

Support use is recorded as `support_used` with `supportLevel: "tier-N"`. It
carries no score and can never lower one. A student moving *down* the ladder
over a unit is the progress signal.

---

## The instructional-need classifier

`shared/evidence/instructional-need.js`. Rules-based and fully inspectable: every
threshold is a named constant in one `T` object, and `classify()` returns the
exact `signals` it used alongside its conclusion, so a teacher who disagrees can
see which number produced it.

Nine named needs, checked from most specific to most general — the first rule
that fires wins, and that rule is what the explanation describes:

1. `prerequisite-gap`
2. `vocabulary-barrier`
3. `representation-difficulty`
4. `calculation-error`
5. `high-confidence-incorrect`
6. `low-confidence-correct`
7. `explanation-difficulty`
8. `enrichment-ready`
9. `current-lesson-gap` (default)

Plus `insufficient-evidence`, returned rather than guessing when a standard has
fewer than 2 event rows **and** fewer than 5 scored items behind it.

Each result carries a `studentReason` (plain language, sixth-grade readable) and
a `teacherReason` (the same conclusion with the underlying counts).

`interventionResult()` closes the loop by comparing accuracy before and after a
recommendation timestamp on the same standard: `improved` / `unchanged` /
`declined` / `no-followup` / `no-baseline`.

This **complements** `assets/brain/recommend-engine.js` — that engine answers
"what should this student do next?", this one answers the prior question "what
kind of problem is this?".

---

## Judge mode and synthetic data

`/judge-mode/` plus one page per product. Guarantees, each asserted by a test:

- No real roster, no real student information, no login.
- No randomness and no network calls in the walkthrough data — the same numbers
  every run, so a step cannot fail mid-demonstration. `synthetic-data.js`
  contains no `Math.random()` and no `Date.now()`; `validate-public-security`
  fails the build if either appears.
- `reset()` returns to step 1 with the identical dataset.
- `EWLEvidence.useSynthetic()` swaps the backing store for an in-memory dataset:
  while it is on, real localStorage is neither read nor written, and real events
  are not visible through the API. A browser test plants a real record, opens
  each demo, and asserts it neither leaks in nor is disturbed on disk.
- Every learner id starts with `demo:`; every event carries `synthetic: true`.
- A persistent banner states the data is simulated.

The synthetic numbers illustrate the **shape** of the system's output. They are
not classroom results and are not evidence of efficacy. Nothing anywhere in this
portfolio presents a fabricated testimonial, partnership, endorsement, or
research finding.

---

## Privacy model

- **Local-first.** Evidence, support profile, and scaffold responses live in the
  learner's browser. Nothing is transmitted by these modules. Data leaves the
  device only when a person explicitly exports it.
- **Pseudonymous learner id.** Preference order favours identifiers that are
  already pseudonymous: an explicit override, then the save/resume code
  (`code:MATH-7KQ2`), then a hash of the initials and section the student typed.
  A raw name is hashed, never stored. A test asserts the name does not appear in
  the derived id.
- **No third-party tracking** in any student experience.
- **No student PII on public routes.** Roster data is reachable only through the
  existing `neft.teacher.key` check; `validate-public-security` scans every
  published page and fails any that fetches a roster endpoint without it.
- **Export / backup / restore / retention / deletion.** `exportJSON()` and
  `exportCSV()` produce a full copy for backup. Restore is a matter of writing
  the envelope back to `ewl:evidence:v1`. Retention is the 2,000-event ring
  buffer plus whatever the browser keeps. `clear()` deletes everything, and
  clearing site data does the same — which is also the honest limitation:
  work that has not been exported is lost with the browser profile.

---

## Deployment

Unchanged. Push to `main` remains the single deploy path via Cloudflare Git
integration; `ALLOW_DEPLOY=1 npm run ship -- <sha>` remains the only supported
way to push it. `_headers`, `_redirects`, `wrangler.toml`, `vite.config.js`
output settings, `404.html`, and the deploy workflow were not modified by this
work.

New top-level directories (`language-bridge/`, `design-studio/`,
`teacher-studio/`, `judge-mode/`) are copied into `dist/` by the existing
`copyStandaloneHtml()` plugin with no configuration change.

### Rollback

Every piece of this work is additive and separately reversible:

| To undo | Do this |
| --- | --- |
| Number Realm evidence wiring | `node tools/inject-number-realm-evidence.mjs --revert` |
| Signature Experiences strip | Remove the `ewl-signature-injected:begin/end` blocks from `curriculum/index.html` (three of them: head, body, scripts) |
| My Math Path reason panel | Remove the `ewl-loop-injected:begin/end` blocks from `math/my-path/index.html` |
| The new hubs | Delete `language-bridge/`, `design-studio/`, `teacher-studio/`, `judge-mode/` |
| The registries | Delete `data/curriculum-canonical.json` and `data/product-registry.json`, and remove `validate:registries` from the `validate` script |
| Command Center remediation | Revert `math/command-center/index.html` — **not recommended**; see the audit for what that page exposed |

Reverting any of these leaves the rest working: no existing surface gained a
hard dependency on this layer.

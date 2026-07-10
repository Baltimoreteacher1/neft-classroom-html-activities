# ESOL “Write About the Math” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic TWR exercises in all 74 Grade 6 lessons with a lesson-specific, WIDA-friendly Understand → Plan → Write → Check routine across interactive HTML, printable HTML, DOCX, and regenerated PDF outputs.

**Architecture:** Keep `engine/core/twr.js` as the pure, canonical derivation layer. It will normalize authored lesson configuration into one `deriveTWR()` result consumed without independent prompt invention by the browser component and document generators. Add a standalone Node assertion suite that scans every lesson configuration and generated packet for completeness, lesson specificity, aligned support levels, bilingual safety, and banned legacy language.

**Tech Stack:** JavaScript ES modules, static HTML, DOM APIs, Node assertions, JSDOM, `docx`, Vite, Biome, Cloudflare Pages/Wrangler.

---

## File Map

- `engine/core/twr.js`: canonical selection, normalization, fallbacks, vocabulary, model, leveled frames, and checklist data.
- `engine/components/twr-writing.js`: accessible live interactive renderer and autosaved response fields.
- `scripts/generate-notes.mjs`: printable HTML renderer and matching teacher criteria.
- `scripts/generate-docx.mjs`: editable Word renderer using the canonical data.
- `tools/twr-writing.test.mjs`: all-lesson derivation and generated-output regression coverage.
- `package.json`: targeted `test:twr` script.
- `lessons/*/notes.html`: regenerated student-facing HTML packets.
- `lessons/*/downloads/*.docx`: regenerated editable packets.
- `lessons/*/downloads/*.pdf`: regenerated PDF packets.

### Task 1: Lock the Canonical Data Contract with Failing Tests

**Files:**
- Create: `tools/twr-writing.test.mjs`
- Modify: `package.json`
- Test: `tools/twr-writing.test.mjs`

- [ ] **Step 1: Add the targeted test script**

Add to `package.json` scripts:

```json
"test:twr": "node tools/twr-writing.test.mjs"
```

- [ ] **Step 2: Write the failing all-lesson contract test**

Create a Node test that loads every `lessons/<id>/config.json`, calls `deriveTWR(config)`, and asserts this exact public contract:

```js
assert.equal(typeof result.focus.questionEn, "string");
assert.ok(result.focus.questionEn.endsWith("?"));
assert.ok(["explain", "compare", "describe", "justify"].includes(result.focus.action));
assert.equal(result.vocabulary.length >= 3, true);
assert.deepEqual(result.levels.map((level) => level.id), ["start", "build", "explain"]);
assert.equal(result.checklist.length, 5);
assert.deepEqual(result.teacherCriteria, result.checklist);
```

Also assert each lesson’s output excludes `/matters in math|Wow,|Sentence Types|Show excitement/i`, every vocabulary term exists in that lesson configuration, and absent Spanish remains an empty string rather than fabricated text.

- [ ] **Step 3: Run the test and confirm RED**

Run: `npm run test:twr`

Expected: FAIL because `focus`, `vocabulary`, `levels`, `model`, `checklist`, and `teacherCriteria` do not exist yet.

- [ ] **Step 4: Commit the test contract**

```bash
git add package.json tools/twr-writing.test.mjs
git commit -m "test: define ESOL math writing contract"
```

### Task 2: Implement the Canonical ESOL Derivation Engine

**Files:**
- Modify: `engine/core/twr.js`
- Test: `tools/twr-writing.test.mjs`

- [ ] **Step 1: Add deterministic source selectors**

Implement focused pure helpers with these signatures:

```js
function selectWritingSource(config) {
  const blocks = Array.isArray(config.turnAndTalk) ? config.turnAndTalk : [];
  return (
    blocks.find((block) => block?.phase === "explore" && block.question) ||
    blocks.find((block) => block?.question) ||
    null
  );
}

function selectVocabulary(config, source) {
  const authored = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  const requested = new Set((source?.wordBank || []).map((word) => word.toLowerCase()));
  const ranked = [...authored].sort((a, b) => {
    const aMatch = requested.has(String(a.term || "").toLowerCase()) ? 1 : 0;
    const bMatch = requested.has(String(b.term || "").toLowerCase()) ? 1 : 0;
    return bMatch - aMatch;
  });
  return ranked.slice(0, 5).map(({ term, termEs = "", definition, definitionEs = "" }) => ({
    term,
    termEs,
    definition,
    definitionEs,
  }));
}
```

- [ ] **Step 2: Derive one focus question and student job**

Use the selected authored question when available. Otherwise turn the cleaned content objective into `How can you show and explain that you can <objective>?`. Normalize terminal punctuation and derive the action word from the question, defaulting to `explain`.

Return:

```js
focus: {
  questionEn,
  questionEs,
  action,
  actionMeaning: "Tell how the math evidence proves your answer.",
  jobEn: "Answer the question. Use math evidence. Explain how the evidence proves your answer.",
  jobEs: "Responde la pregunta. Usa evidencia matemática. Explica cómo la evidencia demuestra tu respuesta.",
}
```

- [ ] **Step 3: Derive oral rehearsal and three aligned levels**

Choose authored stems from the same source block. Keep the same question for every level and return:

```js
levels: [
  { id: "start", label: "Start", support: "Most language support", frames: firstTwoFrames },
  {
    id: "build",
    label: "Build",
    support: "Some language support",
    frames: [claimFrame, "I know because ___.", "So ___."],
  },
  {
    id: "explain",
    label: "Explain",
    support: "Light language support",
    frames: ["My claim is ___.", "My math evidence is ___.", "This proves ___ because ___."],
  },
]
```

Spanish frames are included only when authored or when they are the fixed, reviewed system frames.

- [ ] **Step 4: Derive a labeled non-assessment model**

Prefer the authored `kernel` plus `listenFor` from the selected Turn & Talk block. If unavailable, use the central vocabulary definition. Return `claim`, `evidence`, and `reasoning` labels without using an exit-ticket or independent-practice answer.

- [ ] **Step 5: Define the shared five-item checklist**

Create one frozen array of bilingual criteria and assign it to both `checklist` and `teacherCriteria`:

```js
const CHECKLIST = [
  "I answered the question.",
  "I used math evidence: numbers, an equation, a model, or a comparison.",
  "I explained how the evidence proves my answer.",
  "I used at least two math words.",
  "I reread complete sentences and punctuation.",
];
```

- [ ] **Step 6: Run the targeted test and confirm GREEN**

Run: `npm run test:twr`

Expected: PASS for all 74 lesson configurations.

- [ ] **Step 7: Run Biome on the core and test**

Run: `npx biome check engine/core/twr.js tools/twr-writing.test.mjs package.json`

Expected: 0 errors.

- [ ] **Step 8: Commit the canonical engine**

```bash
git add engine/core/twr.js tools/twr-writing.test.mjs package.json
git commit -m "feat: derive lesson-specific ESOL writing supports"
```

### Task 3: Replace the Live Interactive Renderer

**Files:**
- Modify: `engine/components/twr-writing.js`
- Test: `tools/twr-writing.test.mjs`

- [ ] **Step 1: Extend the regression test with JSDOM assertions**

Render lesson `2-2` and assert semantic content and persistence keys:

```js
assert.match(container.textContent, /1\. Understand the Question/);
assert.match(container.textContent, /2\. Plan Your Math Words/);
assert.match(container.textContent, /3\. Build Your Explanation/);
assert.match(container.textContent, /4\. Check Your Explanation/);
assert.equal(container.querySelectorAll("[data-support-level]").length, 3);
assert.equal(container.querySelectorAll('input[type="checkbox"]').length >= 5, true);
assert.equal(container.querySelectorAll("textarea").length, 3);
```

- [ ] **Step 2: Run and confirm RED**

Run: `npm run test:twr`

Expected: FAIL because the live renderer still contains Kernel Sentence, Sentence Expansion, and Sentence Types.

- [ ] **Step 3: Render the four-step routine**

Replace the legacy sections with semantic headings and these canonical fields:

```js
appendFocus(card, twr.focus);
appendVocabularyPlan(card, twr.vocabulary, twr.rehearsal);
for (const level of twr.levels) {
  inputs.push(appendLevel(card, level, { getResponse, saveResponse }));
}
appendChecklist(card, twr.checklist);
```

Each level uses one autosaved textarea key: `twr_start`, `twr_build`, or `twr_explain`. Vocabulary checkboxes and checklist controls use 44-pixel minimum targets, native labels, and visible focus styles. Keep formative save feedback, reduced-motion handling, and existing callback compatibility.

- [ ] **Step 4: Run targeted test and lint**

Run: `npm run test:twr && npx biome check engine/components/twr-writing.js tools/twr-writing.test.mjs`

Expected: both commands pass with 0 errors.

- [ ] **Step 5: Commit the browser renderer**

```bash
git add engine/components/twr-writing.js tools/twr-writing.test.mjs
git commit -m "feat: render guided ESOL math writing routine"
```

### Task 4: Align Printable HTML and Teacher Guidance

**Files:**
- Modify: `scripts/generate-notes.mjs`
- Modify: `tools/twr-writing.test.mjs`
- Regenerate: `lessons/*/notes.html`

- [ ] **Step 1: Add generated-HTML assertions**

After generation, scan all 74 active `notes.html` files and assert the four headings, three support levels, five checklist items, at least three configured vocabulary terms, and absence of the banned legacy prompts.

- [ ] **Step 2: Run and confirm RED**

Run: `npm run generate-notes && npm run test:twr`

Expected: FAIL because the printable renderer still emits the old structure.

- [ ] **Step 3: Replace `twrSection(config)`**

Render the canonical data in this order:

```js
return `<section class="section twr">
  <h2>Write About the Math</h2>
  ${focusBlock(twr.focus)}
  ${vocabularyBlock(twr.vocabulary, twr.rehearsal)}
  ${levelsBlock(twr.levels, twr.model)}
  ${checklistBlock(twr.checklist)}
</section>`;
```

Add print-safe CSS for focus callouts, vocabulary cards, leveled frames, claim/evidence/reasoning labels, and checkbox rows. Preserve readable contrast and existing page-break behavior.

- [ ] **Step 4: Replace `twrAnswerKey(config)`**

Render `teacherCriteria` as the same five criteria, plus a concise note that support level changes language scaffolding, not mathematical expectations.

- [ ] **Step 5: Update the notes index description**

Replace the legacy kernel/sentence-type description with “a four-step, lesson-specific ESOL writing routine with vocabulary, oral rehearsal, leveled frames, and a self-check.”

- [ ] **Step 6: Regenerate and verify HTML**

Run: `npm run generate-notes && npm run test:twr`

Expected: generation completes for 74 lessons and the targeted suite passes.

- [ ] **Step 7: Run format/lint and commit**

Run: `npx biome check scripts/generate-notes.mjs tools/twr-writing.test.mjs`

```bash
git add scripts/generate-notes.mjs tools/twr-writing.test.mjs lessons/*/notes.html lessons/index.html
git commit -m "feat: regenerate guided ESOL lesson writing packets"
```

### Task 5: Align DOCX and PDF Downloads

**Files:**
- Modify: `scripts/generate-docx.mjs`
- Regenerate: `lessons/*/downloads/*.docx`
- Regenerate: `lessons/*/downloads/*.pdf`

- [ ] **Step 1: Replace `writingBlock(cfg)` with canonical sections**

Use `deriveTWR(cfg)` to add focus question, job, vocabulary table, oral rehearsal, the three support levels, labeled model, and checklist. Use `docx` headings, paragraphs, and tables already present in the generator; do not create renderer-specific prompts.

- [ ] **Step 2: Generate editable Word packets**

Run: `npm run generate-docx`

Expected: 74 DOCX packets complete without exceptions.

- [ ] **Step 3: Generate PDF packets**

Run: `npm run generate-pdf`

Expected: 74 PDF packets complete without exceptions.

- [ ] **Step 4: Validate artifact presence and banned language**

Run a Node assertion that every lesson has non-empty `.docx` and `.pdf` files and every generated HTML packet remains free of banned legacy prompts.

- [ ] **Step 5: Lint and commit**

Run: `npx biome check scripts/generate-docx.mjs`

```bash
git add scripts/generate-docx.mjs lessons/*/downloads/*.docx lessons/*/downloads/*.pdf
git commit -m "feat: publish ESOL writing supports in lesson downloads"
```

### Task 6: Full QA, Browser Review, Integration, and Live Deployment

**Files:**
- Modify only defects found by verification.

- [ ] **Step 1: Run focused and repository-wide checks**

Run:

```bash
npm run test:twr
npm run check
npm run test
npm run validate
npm run audit -- --no-write
npm run build
```

Expected: every command exits 0; no lint errors, test failures, curriculum errors, broken links, or build failures.

- [ ] **Step 2: Run local browser QA**

Start `npm run preview -- --host 127.0.0.1`, then inspect `/curriculum/` and representative fraction, equation, geometry, and statistics lessons at 390×844 and 1366×768. Verify keyboard access, 44-pixel controls, visible focus, no horizontal overflow, print layout, Spanish-present and Spanish-absent states, autosave, and no assessment answer exposure.

- [ ] **Step 3: Review the final diff**

Run:

```bash
git status --short --branch
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git log --oneline origin/main..HEAD
```

Confirm only the canonical engine, renderers, tests, approved docs, and generated lesson artifacts changed.

- [ ] **Step 4: Commit any QA repairs and re-run affected checks**

```bash
git add -u
git commit -m "fix: resolve ESOL writing QA findings"
```

- [ ] **Step 5: Synchronize and integrate safely**

Fetch `origin/main`, rebase the feature branch if main advanced, rerun focused tests plus build, then merge with a non-fast-forward merge from a clean main worktree. Never overwrite the user’s unrelated dirty checkout.

- [ ] **Step 6: Push and deploy**

Push the integrated main branch, then run the guarded repository deployment with `ALLOW_DEPLOY=1 npm run deploy` from the clean main integration worktree.

- [ ] **Step 7: Verify production**

Run `npm run monitor:lesson-render` and direct HTTP/browser checks for `https://eduwonderlab.com/curriculum/` plus representative lesson URLs. Confirm the live HTML contains the new four-step routine and excludes the banned legacy prompts before reporting completion.

# Notice/Wonder Academic-Word Popups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Notice/Wonder academic-word chip across all 64 base lessons open an accessible popup containing a simple definition and local illustration.

**Architecture:** Add a focused shared glossary resolver that gives lesson-authored vocabulary priority, then falls back to centrally authored Notice/Wonder entries. Wire the existing Notice/Wonder chip renderer to the resolver and reuse the existing glossary dialog and SVG image resolver, preserving the separate insert-word action.

**Tech Stack:** Static ES modules, JSON lesson configs, DOM APIs, local SVG assets, Node assertion tests, Vite.

---

### Task 1: Add exhaustive glossary coverage tests

**Files:**
- Create: `tools/notice-wonder-glossary.test.mjs`
- Test: `tools/notice-wonder-glossary.test.mjs`

- [ ] **Step 1: Write a failing coverage test**

Create a Node assertion script that imports `resolveNoticeWonderAcademicWord` from `engine/core/notice-wonder-glossary.js`, scans every `lessons/N-M/config.json`, and checks every `launch.beCurious.vocab` label.

```js
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolveNoticeWonderAcademicWord } from "../engine/core/notice-wonder-glossary.js";
import { resolveVocabImage } from "../engine/core/vocab-images.js";

const ids = readdirSync(new URL("../lessons/", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d+-\d+$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

let occurrences = 0;
for (const id of ids) {
  const config = JSON.parse(
    readFileSync(new URL(`../lessons/${id}/config.json`, import.meta.url), "utf8"),
  );
  for (const label of config.launch?.beCurious?.vocab ?? []) {
    occurrences += 1;
    const entry = resolveNoticeWonderAcademicWord(label, config.vocabulary);
    assert.ok(entry, `${id}: ${label} needs a glossary entry`);
    assert.ok(entry.definition?.trim(), `${id}: ${label} needs a simple definition`);
    assert.ok(entry.definition.length <= 180, `${id}: ${label} definition is too long`);
    assert.match(resolveVocabImage(entry.term, entry.image), /^\/assets\/vocab-images\/[a-z0-9-]+\.svg$/);
  }
}
assert.equal(ids.length, 64);
assert.equal(occurrences, 446);
console.log(`Notice/Wonder glossary coverage passed: ${occurrences} word uses.`);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node tools/notice-wonder-glossary.test.mjs`

Expected: FAIL because `engine/core/notice-wonder-glossary.js` does not exist.

### Task 2: Build the shared academic-word resolver

**Files:**
- Create: `engine/core/notice-wonder-glossary.js`
- Test: `tools/notice-wonder-glossary.test.mjs`

- [ ] **Step 1: Implement normalization and lesson-first resolution**

```js
export function normalizeAcademicWord(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/s$/, "")
    .trim();
}

export function resolveNoticeWonderAcademicWord(label, lessonVocabulary = []) {
  const key = normalizeAcademicWord(label);
  const authored = lessonVocabulary.find(
    (entry) => normalizeAcademicWord(entry?.term) === key && entry?.definition,
  );
  if (authored) return { ...authored, term: String(label) };
  const shared = SHARED_ACADEMIC_WORDS[key];
  return shared ? { term: String(label), ...shared } : null;
}
```

- [ ] **Step 2: Author the shared entries**

Add `SHARED_ACADEMIC_WORDS` as a frozen object covering every label not already supplied by a lesson vocabulary entry. Each entry must contain:

```js
"shorter": {
  termEs: "más corto",
  definition: "Having less length from one end to the other.",
  definitionEs: "Que tiene menos longitud de un extremo al otro.",
  visual: "Compare two bars: the shorter bar ends first.",
  image: "/assets/vocab-images/distance.svg",
},
```

Use exact, concrete meanings for comparison words, spatial words, measurement units, shape words, data words, and contextual quantities. Reuse only local files under `/assets/vocab-images/`; never add network URLs or answer-bearing lesson examples.

- [ ] **Step 3: Run the coverage test and verify GREEN**

Run: `node tools/notice-wonder-glossary.test.mjs`

Expected: `Notice/Wonder glossary coverage passed: 446 word uses.`

### Task 3: Wire every academic-word chip to the shared popup

**Files:**
- Modify: `engine/core/lesson-renderer.js:45,1562-1650`
- Modify: `engine/styles/design-system.css:798-950,4147-4160`
- Test: `tools/notice-wonder-glossary.test.mjs`

- [ ] **Step 1: Add failing renderer contract assertions**

Extend the test to read the renderer and CSS and assert the new shared resolver, accessible button label, popup wiring, and 44px trigger targets are present.

```js
const renderer = readFileSync(new URL("../engine/core/lesson-renderer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../engine/styles/design-system.css", import.meta.url), "utf8");
assert.match(renderer, /resolveNoticeWonderAcademicWord/);
assert.match(renderer, /Open definition and picture for/);
assert.match(renderer, /openObjectiveTermPopup\(entry\)/);
assert.match(css, /\.nw-vocab-word[\s\S]*min-height:\s*44px/);
assert.match(css, /\.nw-vocab-add[\s\S]*min-height:\s*44px/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node tools/notice-wonder-glossary.test.mjs`

Expected: FAIL on the renderer contract.

- [ ] **Step 3: Replace the local-only lookup**

Import the resolver and resolve every support word before rendering:

```js
import { resolveNoticeWonderAcademicWord } from "./notice-wonder-glossary.js";

const popupEntries = new Map(
  vocab.map((label) => [
    normalizeAcademicWord(label),
    resolveNoticeWonderAcademicWord(label, lessonVocab),
  ]),
);
```

Render every word as an accessible two-action pill. The word button opens the dialog and the plus button inserts the word:

```html
<span class="badge badge-teal nw-vocab">
  <button class="nw-vocab-word" aria-haspopup="dialog" aria-label="Open definition and picture for shorter">shorter</button>
  <button class="nw-vocab-add" aria-label="Add shorter to your answer">＋</button>
</span>
```

- [ ] **Step 4: Move inline presentation rules into CSS**

Add `.nw-vocab`, `.nw-vocab-word`, and `.nw-vocab-add` rules with visible focus, minimum 44px height, high-contrast hover/focus states, and preserved pill wrapping. Keep reduced-motion and print behavior unchanged.

- [ ] **Step 5: Run the test and verify GREEN**

Run: `node tools/notice-wonder-glossary.test.mjs`

Expected: coverage and renderer contracts pass.

### Task 4: Verify lesson behavior and regressions

**Files:**
- Verify: `engine/core/notice-wonder-glossary.js`
- Verify: `engine/core/lesson-renderer.js`
- Verify: `engine/styles/design-system.css`
- Verify: `lessons/2-3-group2/config.json`

- [ ] **Step 1: Run focused validation**

Run:

```bash
node tools/notice-wonder-glossary.test.mjs
npm run validate:small-groups
npm run validate:static
npm run check -- engine/core/notice-wonder-glossary.js engine/core/lesson-renderer.js engine/styles/design-system.css tools/notice-wonder-glossary.test.mjs
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Run the complete test suite and build**

Run:

```bash
npm test
npm run build
```

Expected: every test script passes and Vite completes the production build.

- [ ] **Step 3: Browser QA**

Use the local production preview to verify:

- an authored lesson term opens its authored definition;
- a shared fallback term opens a simple definition and local image;
- the plus button inserts without opening the dialog;
- Escape and close return focus to the word trigger;
- desktop and 390px layouts have no horizontal overflow and all controls remain usable;
- Lesson 2.3 Group 2 still shows `5/6 ÷ 1/12 = 10` in scenario and assessment.

### Task 5: Commit and deploy

**Files:**
- Commit all glossary implementation and test files only.

- [ ] **Step 1: Review and commit**

```bash
git status --short
git diff --check
git diff --stat
git add engine/core/notice-wonder-glossary.js engine/core/lesson-renderer.js engine/styles/design-system.css tools/notice-wonder-glossary.test.mjs
git commit -m "feat(lessons): add Notice Wonder word popups"
```

- [ ] **Step 2: Guarded production deployment**

Deploy the design, fraction correction, and implementation commits onto the latest `origin/main`:

```bash
IMPLEMENTATION_SHA=$(git rev-parse HEAD)
ALLOW_DEPLOY=1 npm run ship -- a16a2eadd f6de1c453 "$IMPLEMENTATION_SHA"
```

Expected: the ship script's pre-push QA passes, `origin/main` advances, and the public build stamp matches the pushed commit.

- [ ] **Step 3: Live verification**

Check the production build stamp, open two live lessons, exercise popup open/close and insertion, verify the Lesson 2.3 fraction correction, and confirm teacher-only routes remain protected.

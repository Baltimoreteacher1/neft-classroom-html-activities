# Graphic-Novel Literacy Layer — SP1 (Platform) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the shared graphic-novel engine with reading-comprehension questions, an extensible interaction system (read-aloud, evidence-tap, drag-sequence, notebook), and dual Math+Reading scoring — to a publisher-grade (Pearson/HMH) bar — proven on Unit 1 #1 and #2.

**Architecture:** Additive, backward-compatible extensions to `gn-engine.js` / `gn-engine.css` / `story.schema.md` / `validate.cjs` / `build.py`. New `comprehension` step type reuses the challenge flow but is tagged `data-score-group="reading"`. Richer inputs register in an `INTERACTIONS` map; cross-cutting features register in a `FEATURES` lifecycle list. The existing `.choices/.choice.correct/#choicesComplete` scoring contract is never renamed — interactions emit a compatible hidden marker on solve. Verification: `node --check`, `validate.cjs`, Node pure-logic harnesses, Playwright.

**Tech Stack:** Vanilla ES5-ish JS (IIFE), CSS custom properties, Web Speech API (`speechSynthesis`), Python `build.py` inliner, Node for checks, Playwright (MCP) for browser verification, wrangler for deploy.

**Branch:** `feature/gn-literacy-layer` (off current `origin/main`). Concurrent automation moves `main` — after each push, if rejected, re-fetch, rebase/cherry-pick by SHA, verify, retry.

---

## File Structure

- `graphic-novels/_engine/story.schema.md` — MODIFY: document `comprehension` step, `interaction`, `meta.readingStandard`, `dataScoreGroup`.
- `graphic-novels/_engine/gn-engine.js` — MODIFY: comprehension rendering, `INTERACTIONS` registry, `FEATURES` hooks, read-aloud, notebook, reading-label apparatus.
- `graphic-novels/_engine/gn-engine.css` — MODIFY: publisher-grade reading apparatus + interaction UI + read-aloud control + notebook + `@media print`.
- `graphic-novels/_engine/validate.cjs` — MODIFY: validate comprehension/interaction steps (exactly-one-correct for mc/evidence; well-formed `order` for sequence; required `skill`/`standard`).
- `graphic-novels/_engine/build.py` — MODIFY: dual-section `nt-results` tracker (Math + Reading), keep math section identical.
- `graphic-novels/_engine/tests/` — CREATE: Node pure-logic harnesses (`score.test.cjs`, `interactions.test.cjs`).
- `graphic-novels/_engine/stories/u1-1.story.js`, `u1-2.story.js` — MODIFY: expanded story + comprehension items (reference build).

---

## Task 1: Extend `validate.cjs` for comprehension + interaction steps

**Files:**

- Modify: `graphic-novels/_engine/validate.cjs`
- Test: run on existing stories (must stay green) + a temp fixture.

- [ ] **Step 1: Add a failing fixture check.** Create `graphic-novels/_engine/tests/fixtures/comp-bad.story.js`:

```js
window.GN_STORY = {
  meta: {
    unit: 1,
    version: 1,
    level: "Support",
    title: "x",
    standard: "6.NS.4",
    readingStandard: "RL.6.1",
    assessment: "x",
    artBase: "../_art/unit1/",
    home: "../index.html",
  },
  cast: {
    cadet: { name: "Cadet", role: "protagonist" },
    log: { name: "L", role: "narrator" },
  },
  cover: { art: "cover.png", blurbEn: "x" },
  acts: [
    {
      id: "act1",
      tab: "A",
      title: "A",
      steps: [
        {
          type: "comprehension",
          id: "c1",
          skill: "main_idea",
          standard: "RI.6.2",
          ask: { who: "log", en: "Q?" },
          choices: [
            { en: "a", correct: true },
            { en: "b", correct: true },
          ],
        }, // TWO correct -> invalid
      ],
    },
  ],
  glossary: [{ ico: "x", en: "x", es: "x", def: "x" }],
  complete: {
    art: "c.png",
    en: "x",
    master: { promptEn: "x", choices: [{ en: "a", correct: true }] },
  },
};
```

- [ ] **Step 2: Run validate on the fixture; expect it to FAIL meaningfully.**

Run: `cd graphic-novels/_engine && node validate.cjs tests/fixtures/comp-bad.story.js` (NOTE: validate.cjs currently scans `stories/`; in this step add optional argv path support as part of Step 3). Expected after Step 3: reports `c1: 2 correct (need 1)`.

- [ ] **Step 3: Implement.** In `validate.cjs`: (a) if `process.argv[2]` is given, validate just that file; (b) in the per-step loop, treat `st.type === "comprehension"` like a scored challenge AND additionally require `st.skill` and `st.standard`; (c) branch on `st.interaction`:
  - `"sequence"`: require `st.items` array length ≥ 2 and each item has a numeric `order`; skip the choices/correct check.
  - `"evidence"` or `"mc"`/undefined: keep the existing "exactly one `correct`" check on `st.choices`.
    Reading steps count toward a new `reading` tally; math challenges toward `scored`. Print both.

```js
// inside the steps loop, replacing the single "else { // challenge ... }" branch:
else {
  var isComp = st.type === "comprehension";
  if (isComp) { reading++; if (!st.skill) issues.push(a.id+"/"+st.id+": comprehension missing skill");
                if (!st.standard) issues.push(a.id+"/"+st.id+": comprehension missing standard"); }
  else { scored++; }
  if (ids.has(st.id)) issues.push(a.id+": dup step id "+st.id);
  ids.add(st.id);
  if (!st.ask || !st.ask.en) issues.push(a.id+"/"+st.id+": no ask");
  if (st.interaction === "sequence") {
    if (!Array.isArray(st.items) || st.items.length < 2) issues.push(a.id+"/"+st.id+": sequence needs >=2 items");
    else st.items.forEach(function(it){ if (typeof it.order !== "number") issues.push(a.id+"/"+st.id+": item missing numeric order"); });
  } else {
    var ch = st.choices || [];
    if (ch.length < 2) issues.push(a.id+"/"+st.id+": <2 choices");
    var correct = ch.filter(function(c){return c.correct===true;}).length;
    if (correct !== 1) issues.push(a.id+"/"+st.id+": "+correct+" correct (need 1)");
  }
  if (!isComp && (!st.goodEn || !st.badEn)) issues.push(a.id+"/"+st.id+": missing good/bad feedback");
}
```

Add `var reading = 0;` near `var scored = 0;` and include `reading=` in the row print and in the per-file object.

- [ ] **Step 4: Verify fail then green.** Run `node validate.cjs tests/fixtures/comp-bad.story.js` → expect `c1: 2 correct (need 1)`. Then `node validate.cjs` (all real stories) → expect `24 files · 24 ok · 0 fail` (no regression).

- [ ] **Step 5: Commit.**

```bash
git add graphic-novels/_engine/validate.cjs graphic-novels/_engine/tests/fixtures/comp-bad.story.js
git commit -m "feat(gn-engine): validate comprehension + interaction steps"
```

---

## Task 2: Dual Math+Reading scoring in the results tracker (`build.py`)

**Files:**

- Modify: `graphic-novels/_engine/build.py` (the `TRACKER` string)
- Test: `graphic-novels/_engine/tests/score.test.cjs` (pure-logic harness mirroring the tracker's score() split)

- [ ] **Step 1: Write the failing pure-logic test.** Create `tests/score.test.cjs`:

```js
// Mirrors the tracker's section split: math groups vs reading groups (data-score-group="reading").
function splitScore(groups) {
  const math = groups.filter((g) => g.group !== "reading");
  const reading = groups.filter((g) => g.group === "reading");
  const tally = (arr) => ({
    correct: arr.filter((g) => g.correct).length,
    total: arr.length,
  });
  return { math: tally(math), reading: tally(reading) };
}
const groups = [
  { group: null, correct: true },
  { group: null, correct: false },
  { group: "reading", correct: true },
  { group: "reading", correct: true },
  { group: "reading", correct: false },
];
const r = splitScore(groups);
const ok =
  r.math.correct === 1 &&
  r.math.total === 2 &&
  r.reading.correct === 2 &&
  r.reading.total === 3;
console.log(ok ? "PASS" : "FAIL", JSON.stringify(r));
process.exit(ok ? 0 : 1);
module.exports = { splitScore };
```

- [ ] **Step 2: Run it.** Run: `node graphic-novels/_engine/tests/score.test.cjs` → expect `PASS {...}`. (This locks the intended split semantics before editing the tracker.)

- [ ] **Step 3: Implement the tracker change.** In `build.py`, in the `TRACKER` template's `score()` function, replace the single-group count with a Math/Reading split that reads `data-score-group` on each `.choices` container, and change `record()` to emit two sections. Keep `#choicesComplete` excluded. Exact replacement for `score()` and the `sections`/`finish` call:

```js
function score() {
  var groups = Array.prototype.slice
    .call(document.querySelectorAll(".choices"))
    .filter(function (g) {
      return g.id !== "choicesComplete";
    });
  function tally(list) {
    var total = list.length;
    var correct = list.filter(function (g) {
      return g.querySelector(".choice.correct");
    }).length;
    return { correct: correct, total: total };
  }
  var reading = groups.filter(function (g) {
    return g.getAttribute("data-score-group") === "reading";
  });
  var math = groups.filter(function (g) {
    return g.getAttribute("data-score-group") !== "reading";
  });
  return { math: tally(math), reading: tally(reading) };
}
```

And in `record()` replace the `sections`/`correct`/`total` with:

```js
var s = score();
var sections = [{ name: "Math", correct: s.math.correct, total: s.math.total }];
var readingStd = window.GN_STORY.meta.readingStandard || null;
if (s.reading.total > 0)
  sections.push({
    name: "Reading Comprehension",
    correct: s.reading.correct,
    total: s.reading.total,
    standard: readingStd,
  });
NTResults.finish({
  student: studentName(),
  assessment: window.GN_STORY.meta.assessment,
  standard: window.GN_STORY.meta.standard,
  level: String(window.GN_STORY.meta.version),
  sections: sections,
  correct: s.math.correct + s.reading.correct,
  total: s.math.total + s.reading.total,
  download: false,
});
```

- [ ] **Step 4: Verify build still produces a file + the new strings appear.** Run:

```bash
cd graphic-novels/_engine && python3 build.py stories/u1-1.story.js /tmp/t.html >/dev/null && \
  grep -c 'data-score-group' /tmp/t.html && grep -c 'Reading Comprehension' /tmp/t.html
```

Expected: build prints a size; both greps ≥ 1.

- [ ] **Step 5: Commit.**

```bash
git add graphic-novels/_engine/build.py graphic-novels/_engine/tests/score.test.cjs
git commit -m "feat(gn-engine): dual Math+Reading sections in results tracker"
```

---

## Task 3: `INTERACTIONS` registry + comprehension step rendering (mc default)

**Files:**

- Modify: `graphic-novels/_engine/gn-engine.js` (the `renderCard` / challenge flow + new registry)
- Test: Playwright (Task 12) + `node --check`

- [ ] **Step 1: Add the registry and a `dataScoreGroup` helper.** In `gn-engine.js`, near the top of the IIFE (after `txt()`), add:

```js
/* Interaction + feature extensibility seams. */
var INTERACTIONS = {}; // name -> { render(step, groupEl, onSolve) }  (must emit .choices/.choice.correct on solve)
var FEATURES = []; // [{ onBeat(beat,ctx), onSolve(step,ctx), onComplete(ctx) }]
function fire(hook, a, b) {
  FEATURES.forEach(function (f) {
    if (f[hook])
      try {
        f[hook](a, b);
      } catch (e) {}
  });
}
function isComprehension(step) {
  return step.type === "comprehension";
}
```

- [ ] **Step 2: Tag comprehension groups + add the reading apparatus label.** In `renderCard(step, optional)` where the `.choices` container is built, add the score-group attribute and (for comprehension) a publisher-style skill/standard/DOK label above the question. Locate the line building `var choices = '<div class="reply-label">...` and replace the reply-label + choices opener with:

```js
var comp = isComprehension(step);
var groupAttr = comp
  ? ' data-score-group="reading" data-standard="' + (step.standard || "") + '"'
  : "";
var label = comp
  ? '<div class="reading-tag"><span class="rt-skill">' +
    SKILL_LABEL(step.skill) +
    "</span>" +
    '<span class="rt-std">' +
    (step.standard || "") +
    "</span>" +
    (step.dok ? '<span class="rt-dok">DOK ' + step.dok + "</span>" : "") +
    "</div>"
  : "";
var choices =
  label +
  '<div class="reply-label">' +
  (comp ? "Choose the best answer" : "Choose your reply") +
  "</div>" +
  '<div class="choices" id="choices-' +
  act.id +
  "-" +
  step.id +
  '"' +
  groupAttr +
  ">";
```

Add the skill-label map near the top:

```js
var SKILLS = {
  vocab_in_context: "Vocabulary in Context",
  main_idea: "Determine Main Idea",
  key_details: "Key Details",
  sequence: "Sequence / Cause & Effect",
  inference: "Make an Inference",
  cite_evidence: "Cite Text Evidence",
  prediction: "Make a Prediction",
};
function SKILL_LABEL(k) {
  return SKILLS[k] || "Reading";
}
```

- [ ] **Step 3: Route interactions.** In `renderCard`, after the wrap is appended and before `wireFolds`, branch: if `step.interaction` and `INTERACTIONS[step.interaction]`, let the interaction render its own UI INTO the choices container instead of the default buttons. Wrap the default `.choice` button construction in `if (!step.interaction || step.interaction === "mc" || !INTERACTIONS[step.interaction]) { ...existing buttons... }`. After appending, add:

```js
if (step.interaction && INTERACTIONS[step.interaction]) {
  INTERACTIONS[step.interaction].render(
    step,
    $("choices-" + act.id + "-" + step.id),
    null,
  );
}
```

(The `onSolve` wiring stays via `wireChoices`, which watches for `.choice.correct` — interactions emit that marker. See Tasks 5–6.)

- [ ] **Step 4: Route comprehension steps through the existing player.** In `playStep()` where it branches `beats` / `optional` / `challenge`, add comprehension to the gating-challenge path: change `else playChallenge(step);` to `else if (isComprehension(step) && step.optional) playOptional(step); else playChallenge(step);` (comprehension defaults to gating like a challenge). Comprehension `goodEn/badEn` may be absent — make `wireChoices` tolerate missing feedback: guard `step.goodEn` with `(step.goodEn || "✓ Correct.")` and `step.badEn` with `(step.badEn || "Not quite — look back at the panel.")`.

- [ ] **Step 5: Verify syntax + validate + a built file shows the reading tag.** Run:

```bash
cd graphic-novels/_engine && node --check gn-engine.js && node validate.cjs | tail -1
```

Expected: no syntax error; `24 files · 24 ok`.

- [ ] **Step 6: Commit.**

```bash
git add graphic-novels/_engine/gn-engine.js
git commit -m "feat(gn-engine): comprehension step type + INTERACTIONS/FEATURES seams"
```

---

## Task 4: `evidence` interaction (tap the proving line)

**Files:**

- Modify: `graphic-novels/_engine/gn-engine.js`
- Test: `tests/interactions.test.cjs` (pure correctness logic) + Playwright

- [ ] **Step 1: Failing pure-logic test.** Append to `tests/interactions.test.cjs`:

```js
function evidenceCorrect(choices, pickedIndex) {
  return choices[pickedIndex] && choices[pickedIndex].correct === true;
}
const ev = [
  { en: "line A", correct: false },
  { en: "line B", correct: true },
];
const okE = evidenceCorrect(ev, 1) === true && evidenceCorrect(ev, 0) === false;
console.log("evidence", okE ? "PASS" : "FAIL");
if (!okE) process.exit(1);
module.exports = Object.assign(module.exports || {}, { evidenceCorrect });
```

- [ ] **Step 2: Run.** `node graphic-novels/_engine/tests/interactions.test.cjs` → `evidence PASS`.

- [ ] **Step 3: Implement `INTERACTIONS.evidence`.** Renders each `step.choices[]` as a tappable "text-evidence" line button inside the group; on click, marks `.choice.correct` on the right one (so `wireChoices` + the tracker see it) and visually flags wrong picks. Add:

```js
INTERACTIONS["evidence"] = {
  render: function (step, groupEl) {
    groupEl.classList.add("evidence");
    step.choices.forEach(function (c) {
      var b = el(
        "button",
        "choice ev",
        "&#128206; " +
          c.en +
          (c.es ? '<span class="es">' + c.es + "</span>" : ""),
      );
      b.dataset.correct = !!c.correct;
      groupEl.appendChild(b);
    });
  },
};
```

The existing `wireChoices(step, act, onSolve)` already attaches click handlers to `.choice` in the group and adds `.correct`/`.wrong` — so evidence reuses it unchanged. Confirm `wireChoices` is called for interaction steps (it is, in `playChallenge`/`playOptional`).

- [ ] **Step 4: Verify.** `node --check gn-engine.js` (pass). Defer rendered check to Task 12.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(gn-engine): evidence (cite text evidence) interaction"`

---

## Task 5: `sequence` interaction (drag/keyboard to order)

**Files:**

- Modify: `graphic-novels/_engine/gn-engine.js`
- Test: `tests/interactions.test.cjs` + Playwright

- [ ] **Step 1: Failing pure-logic test.** Append:

```js
function sequenceCorrect(items, currentOrderIdx) {
  // currentOrderIdx: array of item indices in current visual order; correct when each item's .order ascends
  for (var i = 1; i < currentOrderIdx.length; i++)
    if (items[currentOrderIdx[i]].order < items[currentOrderIdx[i - 1]].order)
      return false;
  return true;
}
const items = [
  { en: "first", order: 1 },
  { en: "second", order: 2 },
  { en: "third", order: 3 },
];
const okS =
  sequenceCorrect(items, [0, 1, 2]) === true &&
  sequenceCorrect(items, [2, 0, 1]) === false;
console.log("sequence", okS ? "PASS" : "FAIL");
if (!okS) process.exit(1);
module.exports = Object.assign(module.exports || {}, { sequenceCorrect });
```

- [ ] **Step 2: Run.** `node graphic-novels/_engine/tests/interactions.test.cjs` → `sequence PASS`.

- [ ] **Step 3: Implement `INTERACTIONS.sequence`.** Renders `step.items[]` as reorderable cards (HTML5 drag + ▲/▼ keyboard buttons for accessibility), plus a "Check order" button. On check, if ascending by `order`, append a hidden `<button class="choice correct">` to the group (so the tracker counts it) and call `onSolve`; else flag and let them retry. Add:

```js
INTERACTIONS["sequence"] = {
  render: function (step, groupEl, onSolve, ctx) {
    groupEl.classList.add("sequence");
    var list = el("ol", "seq-list");
    // shuffle a copy deterministically by index parity so order isn't given away
    var order = step.items.map(function (_, i) {
      return i;
    });
    order.sort(function (a, b) {
      return (
        ((a * 7 + 3) % step.items.length) - ((b * 7 + 3) % step.items.length)
      );
    });
    order.forEach(function (idx) {
      var li = el("li", "seq-card");
      li.draggable = true;
      li.dataset.idx = idx;
      li.tabIndex = 0;
      li.innerHTML =
        '<span class="seq-h">&#8942;</span><span class="seq-t">' +
        step.items[idx].en +
        (step.items[idx].es
          ? '<span class="es">' + step.items[idx].es + "</span>"
          : "") +
        "</span>" +
        '<span class="seq-ctl"><button class="seq-up" aria-label="Move up">&#9650;</button>' +
        '<button class="seq-down" aria-label="Move down">&#9660;</button></span>';
      list.appendChild(li);
    });
    var btn = el("button", "next seq-check", "Check order");
    groupEl.appendChild(list);
    groupEl.appendChild(btn);
    function move(li, dir) {
      var ref =
        dir < 0
          ? li.previousElementSibling
          : li.nextElementSibling && li.nextElementSibling.nextElementSibling;
      if (dir < 0 && li.previousElementSibling)
        list.insertBefore(li, li.previousElementSibling);
      else if (dir > 0 && li.nextElementSibling)
        list.insertBefore(li.nextElementSibling, li);
    }
    list.addEventListener("click", function (e) {
      var up = e.target.closest(".seq-up"),
        dn = e.target.closest(".seq-down");
      if (up) move(up.closest("li"), -1);
      if (dn) move(dn.closest("li"), 1);
    });
    var dragged = null;
    list.addEventListener("dragstart", function (e) {
      dragged = e.target.closest("li");
    });
    list.addEventListener("dragover", function (e) {
      e.preventDefault();
      var li = e.target.closest("li");
      if (li && li !== dragged)
        list.insertBefore(dragged, li.nextSibling || li);
    });
    btn.addEventListener("click", function () {
      var idxs = Array.prototype.map.call(list.children, function (li) {
        return +li.dataset.idx;
      });
      var ok = true;
      for (var i = 1; i < idxs.length; i++)
        if (step.items[idxs[i]].order < step.items[idxs[i - 1]].order)
          ok = false;
      if (ok) {
        var mark = el("button", "choice correct");
        mark.style.display = "none";
        mark.dataset.correct = "true";
        groupEl.appendChild(mark);
        btn.disabled = true;
        list.classList.add("solved");
        if (onSolve) onSolve();
      } else {
        list.classList.add("nudge");
        setTimeout(function () {
          list.classList.remove("nudge");
        }, 500);
      }
    });
  },
};
```

Because sequence supplies its own solve path, update the Task 3 routing so that for `interaction === "sequence"` the engine passes a real `onSolve` (the same callback `playChallenge` gives `wireChoices`). Refactor `renderCard` to compute `onSolve` once and pass it to either `wireChoices` (mc/evidence) or `INTERACTIONS[x].render(step, group, onSolve)` (sequence). Concretely, in `playChallenge`/`playOptional`, build the `onSolve` closure first, then:

```js
if (step.interaction === "sequence" && INTERACTIONS.sequence) {
  INTERACTIONS.sequence.render(
    step,
    $("choices-" + act.id + "-" + step.id),
    onSolve,
  );
} else {
  if (step.interaction === "evidence" && INTERACTIONS.evidence)
    INTERACTIONS.evidence.render(step, $("choices-" + act.id + "-" + step.id));
  wireChoices(step, act, onSolve);
}
```

- [ ] **Step 4: Verify.** `node --check gn-engine.js`. `node validate.cjs | tail -1` → 24 ok.

- [ ] **Step 5: Commit.** `git commit -am "feat(gn-engine): drag/keyboard sequence interaction"`

---

## Task 6: Read-aloud feature (Web Speech API, EN+ES)

**Files:**

- Modify: `graphic-novels/_engine/gn-engine.js` (bubble builder + a FEATURES module), `gn-engine.css`
- Test: Playwright (presence of 🔊 controls + speechSynthesis availability) in Task 12

- [ ] **Step 1: Implement the read-aloud module.** Add near the FEATURES seam:

```js
var TTS = (function () {
  var synth = window.speechSynthesis;
  function speak(text, lang) {
    if (!synth) return;
    synth.cancel();
    var u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ""));
    u.lang = lang === "es" ? "es-ES" : "en-US";
    u.rate = 0.95;
    synth.speak(u);
  }
  return { available: !!synth, speak: speak };
})();
```

- [ ] **Step 2: Add a 🔊 button to each bubble** (EN, and ES if present). In `bubble(beat)`, after building `b.innerHTML`, append controls when `TTS.available`:

```js
if (TTS.available) {
  var ctl =
    '<span class="tts">' +
    '<button class="tts-btn" data-tts-en aria-label="Read aloud">&#128266;</button>' +
    (beat.es
      ? '<button class="tts-btn" data-tts-es aria-label="Leer en voz alta">ES</button>'
      : "") +
    "</span>";
  b.insertAdjacentHTML("beforeend", ctl);
  b.querySelector("[data-tts-en]").addEventListener("click", function () {
    TTS.speak(beat.en, "en");
  });
  if (beat.es)
    b.querySelector("[data-tts-es]").addEventListener("click", function () {
      TTS.speak(beat.es, "es");
    });
}
```

Also add a 🔊 to the comprehension question `ask` bubble (already routed through `bubble()` in `renderCard`, so it inherits this automatically). Add a global "stop" on scene change: in `showScene`, call `if (window.speechSynthesis) window.speechSynthesis.cancel();`.

- [ ] **Step 3: Verify.** `node --check gn-engine.js`. Built file contains `data-tts-en`: `python3 build.py stories/u1-1.story.js /tmp/t.html >/dev/null && grep -c data-tts-en /tmp/t.html` → ≥1.

- [ ] **Step 4: Commit.** `git commit -am "feat(gn-engine): read-aloud (Web Speech API, EN+ES)"`

---

## Task 7: Reading/Math notebook (print-ready collection)

**Files:**

- Modify: `graphic-novels/_engine/gn-engine.js` (FEATURES module + a "Notebook" affordance on the complete scene), `gn-engine.css` (`@media print`)
- Test: Playwright (notebook populated + print styles) Task 12

- [ ] **Step 1: Implement the notebook FEATURE.** Collects each solved item (skill, question, the chosen reply text, correctness) + any `frame` writing. Register:

```js
var NOTEBOOK = { entries: [] };
FEATURES.push({
  onSolve: function (step, ctx) {
    NOTEBOOK.entries.push({
      kind: isComprehension(step) ? "reading" : "math",
      skill: step.skill ? SKILL_LABEL(step.skill) : "Math",
      q: stripTags((step.ask && step.ask.en) || ""),
      frame: step.frame ? stripTags(step.frame.en) : "",
    });
  },
});
function renderNotebook() {
  var host = $("nt-notebook");
  if (!host) return;
  host.innerHTML =
    "<h3>My Reading + Math Log</h3>" +
    NOTEBOOK.entries
      .map(function (e) {
        return (
          '<div class="nb-row"><b>' +
          e.skill +
          ":</b> " +
          e.q +
          (e.frame
            ? '<div class="nb-frame">' +
              e.frame +
              ' <span class="nb-blank"></span></div>'
            : "") +
          "</div>"
        );
      })
      .join("");
}
```

Wire `fire("onSolve", step, ctx)` inside the existing solve callbacks (the `onSolve` closures in `playChallenge`/`playOptional`/`wireChoices` success path) — add `fire("onSolve", step);` right where `.correct` is set.

- [ ] **Step 2: Add the notebook container + print button to the complete scene.** In `buildComplete()`, before the restart button, add: `'<div id="nt-notebook" class="notebook"></div><button class="restart" id="print-nb">🖨️ Print my log</button>'`. In `showComplete()`, call `renderNotebook();` and wire `#print-nb` → `window.print()`.

- [ ] **Step 3: Verify.** `node --check gn-engine.js`; build + `grep -c nt-notebook /tmp/t.html` ≥1.

- [ ] **Step 4: Commit.** `git commit -am "feat(gn-engine): print-ready reading/math notebook"`

---

## Task 8: Publisher-grade CSS — reading apparatus, interactions, read-aloud, print

**Files:**

- Modify: `graphic-novels/_engine/gn-engine.css`

- [ ] **Step 1: Add styles** for `.reading-tag` (skill chip + standard + DOK, like a published item header), `.choice.ev`, `.seq-list/.seq-card/.seq-ctl`, `.tts/.tts-btn`, `.notebook/.nb-row/.nb-frame/.nb-blank`, and a `@media print` block that hides chrome (topbar, tabs, buttons), expands all scenes, and formats the notebook as a clean consumable page. Use the existing tokens (`--line`, `--gold`, `--accent`, `--sh-sm`). Keep AA contrast.

```css
.reading-tag {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.rt-skill {
  background: var(--accent);
  color: #fff;
  border: 3px solid var(--line);
  border-radius: 6px;
  padding: 4px 9px;
  font-weight: 900;
  font-size: 0.74rem;
  text-transform: uppercase;
}
.rt-std,
.rt-dok {
  background: #fff;
  border: 3px solid var(--line);
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: 800;
  font-size: 0.72rem;
}
.choices.evidence {
  gap: 8px;
}
.choice.ev {
  font-style: normal;
}
.seq-list {
  list-style: none;
  display: grid;
  gap: 8px;
  padding: 0;
}
.seq-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 3px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: var(--sh-sm);
  cursor: grab;
  font-weight: 700;
}
.seq-card .seq-h {
  color: var(--muted);
}
.seq-card .seq-t {
  flex: 1;
}
.seq-ctl {
  display: flex;
  gap: 4px;
}
.seq-up,
.seq-down {
  min-width: 40px;
  min-height: 40px;
  border: 2px solid var(--line);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-weight: 900;
}
.seq-list.solved .seq-card {
  border-color: var(--green);
  background: #ecfdf5;
}
.seq-list.nudge {
  animation: figrise 0.25s;
}
.seq-check {
  margin-top: 10px;
}
.tts {
  display: inline-flex;
  gap: 4px;
  margin-left: 8px;
  vertical-align: middle;
}
.tts-btn {
  min-width: 34px;
  min-height: 34px;
  border: 2px solid var(--line);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.8rem;
}
.notebook {
  text-align: left;
  border: 3px solid var(--line);
  border-radius: 10px;
  padding: 16px;
  background: #fff;
  margin-top: 18px;
}
.nb-row {
  padding: 8px 0;
  border-bottom: 1px dashed var(--line);
}
.nb-frame {
  margin-top: 4px;
  color: var(--muted);
}
.nb-blank {
  display: inline-block;
  min-width: 160px;
  border-bottom: 2px solid var(--line);
}
@media print {
  .topbar,
  .tabs,
  .scene-foot,
  .next,
  .advance,
  .start,
  .restart,
  .tts,
  .dlg-row,
  .chal-tools,
  #print-nb {
    display: none !important;
  }
  .scene {
    display: block !important;
    page-break-after: always;
  }
  body {
    background: #fff;
  }
  .panel {
    box-shadow: none;
  }
}
```

- [ ] **Step 2: Verify** `node --check`? (CSS has no node check) — instead build U1 and confirm tokens present: `python3 build.py stories/u1-1.story.js /tmp/t.html >/dev/null && grep -c 'reading-tag' /tmp/t.html` ≥1.

- [ ] **Step 3: Commit.** `git commit -am "style(gn-engine): publisher-grade reading apparatus + interactions + print"`

---

## Task 9: Update `story.schema.md`

**Files:**

- Modify: `graphic-novels/_engine/story.schema.md`

- [ ] **Step 1:** Document `meta.readingStandard`, the `comprehension` step (`skill` enum, `standard`, `dok`, `passageRef`, `interaction`), the `interaction` values (`mc`/`evidence`/`sequence`) with the `items[].order` shape for sequence, and that comprehension groups score as "Reading" via `data-score-group="reading"`. Mirror the existing doc style.

- [ ] **Step 2: Commit.** `git commit -am "docs(gn-engine): document comprehension + interaction schema"`

---

## Task 10: Reference content — Unit 1 #1 (expanded story + all 7 skills + 3 interactions)

**Files:**

- Modify: `graphic-novels/_engine/stories/u1-1.story.js`

- [ ] **Step 1:** Add `meta.readingStandard: "RL.6.1"`. Expand each act's `beats` with 1–2 more narrative beats (richer story; keep math verbatim). Insert `comprehension` steps distributed across the novel so all 7 skills appear at least once and all 3 interaction types appear at least once (e.g., Act 1: `vocab_in_context` (mc), `key_details` (mc), `cite_evidence` (`evidence`); Act 2: `main_idea` (mc), `sequence` (`sequence`); Final: `inference` (mc), `prediction` (mc)). Each comprehension step: `skill`, `standard` (RL/RI.6 per the spec table), `dok`, `ask`, and either `choices` (one `correct`) or `items` with `order`. Keep everything accessible (text-supported, plausible distractors), EN+ES.

- [ ] **Step 2: Validate.** `cd graphic-novels/_engine && node validate.cjs stories/u1-1.story.js` → ok, and shows `reading=7` (or your count). Then `node validate.cjs | tail -1` → all green.

- [ ] **Step 3: Build.** `python3 build.py stories/u1-1.story.js ../unit1/graphic-novel-1.html`.

- [ ] **Step 4: Commit.** `git commit -am "content(u1-1): expanded story + comprehension items (reference)"`

---

## Task 11: Reference content — Unit 1 #2 (Enrichment)

**Files:**

- Modify: `graphic-novels/_engine/stories/u1-2.story.js`

- [ ] **Step 1:** Same as Task 10 but Enrichment level — emphasize inference / cite-evidence / prediction at higher DOK; English-only (match source). Use `meta.readingStandard: "RL.6.1"`. Ensure all 3 interactions appear.

- [ ] **Step 2: Validate + build.** `node validate.cjs stories/u1-2.story.js` ok; `python3 build.py stories/u1-2.story.js ../unit1/graphic-novel-2.html`.

- [ ] **Step 3: Commit.** `git commit -am "content(u1-2): expanded story + comprehension items (reference)"`

---

## Task 12: Browser verification (Playwright) + deploy

**Files:** none (verification) — uses Playwright MCP + local `python3 -m http.server`.

- [ ] **Step 1: Serve.** `cd ~/neft-classroom-html-activities && python3 -m http.server 8753 &`

- [ ] **Step 2: Functional pass (U1 #1).** Navigate `http://localhost:8753/graphic-novels/unit1/graphic-novel-1.html`. Assert via `browser_evaluate`:
  - Comprehension groups exist with `data-score-group="reading"` (count ≥ 5).
  - A `.tts-btn` exists and `window.speechSynthesis` is truthy.
  - Auto-play to completion (reuse the existing smoke-player loop; for `sequence`, click `.seq-up/.seq-down` to sort by data, then `.seq-check`; for `evidence`, click the `.choice[data-correct=true]`). At completion, read the would-be `NTResults.finish` payload by stubbing `window.NTResults={finish:f=>window.__r=f}` before play; assert it has TWO sections (Math + Reading) with the Reading `standard` set.
  - `#nt-notebook .nb-row` count ≥ 1.

- [ ] **Step 3: Accessibility/mobile pass.** Resize 320×640: assert no horizontal overflow, `.seq-up` ≥40px, choices ≥48px. Tab through a comprehension item; assert focus ring visible.

- [ ] **Step 4: Print pass.** `browser_evaluate` `window.matchMedia('print')` and confirm `@media print` hides `.topbar` (emulate via `page.emulateMedia('print')` then check computed `display`). Console errors must be 0.

- [ ] **Step 5: Fix any failures, re-run.** Do not proceed until Steps 2–4 are green.

- [ ] **Step 6: Build dist + deploy.**

```bash
cd ~/neft-classroom-html-activities && npm run build && \
  ./node_modules/.bin/wrangler pages deploy dist --project-name=neft-classroom-html-activities --branch=main --commit-dirty=true
```

Verify live: `curl -sL https://eduwonderlab.com/graphic-novels/unit1/graphic-novel-1.html | grep -c data-score-group` ≥1.

- [ ] **Step 7: Merge branch.** Push `feature/gn-literacy-layer`, open PR, merge. If `main` moved (push rejected), re-fetch, create a fresh branch off new `origin/main`, cherry-pick the SP1 commits by SHA, verify `validate.cjs` green, push, merge.

- [ ] **Step 8: Final commit/tag.** `git commit --allow-empty -m "chore: SP1 literacy layer reference (Unit 1) live"`

---

## Self-Review

**Spec coverage:** §4 skills → Tasks 10–11 (all 7) + §SKILLS map Task 3. §5 data model → Tasks 1,3,9. §6 dual scoring → Task 2 (+ verified Task 12 Step 2). §7 interactions → Tasks 3–7 (read-aloud 6, evidence 4, sequence 5, notebook 7). §2 quality bar → Task 8 (apparatus/print) + reading-tag labels Task 3. §9 offline/AA/print → Tasks 6,8,12. §10 build sequence → Tasks 10–12. §11 risks (automation) → Task 12 Step 7. **Gap check:** `FEATURES` hooks defined Task 3, used Task 7 (`fire("onSolve")`) — consistent. No `passageRef` consumer yet (authoring aid only; acceptable, documented in schema Task 9).

**Placeholder scan:** No TBD/TODO; all code blocks concrete. Verification commands have expected output.

**Type consistency:** `INTERACTIONS[name].render(step, groupEl, onSolve)` signature consistent across Tasks 3/4/5. `SKILL_LABEL`/`SKILLS` defined Task 3, used Tasks 7,3. `isComprehension` defined Task 3, used 2(N/A; tracker reads DOM attr),3,7. `data-score-group="reading"` written in Task 3, read in Task 2 tracker + Task 1 validate + Task 12 assert — consistent. `fire()` defined Task 3, used Task 7.

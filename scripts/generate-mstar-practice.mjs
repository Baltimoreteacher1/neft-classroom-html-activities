// ── MSTAR-style unit practice-test generator ─────────────────────────────────
// Builds two interactive practice tests (Form A / Form B, disjoint questions)
// for every curriculum unit that AUTHORS MSTAR items, plus a teacher answer
// key per form and a hub index. Follows the mcap-review generator pattern:
// committed, regenerable, self-contained pages.
//
// SOURCE OF TRUTH: the authored `mstarPractice` blocks on the core lesson
// configs (lessons/<u>-<l>/config.json, top level or under `reflect`). This
// generator composes ONLY those items — it authors no mathematics of its own,
// the same rule scripts/lib/worksheet-set-b.mjs states for Set B. A unit with
// no authored items gets NO test and is named in the output and on the hub;
// inventing filler is how the copy-panel incident happened.
//
// FORM SPLIT: item order inside a lesson is positional (item 1 is the EBSR,
// item 2 the multi-select or error analysis), so an even/odd item split would
// hand Form A every two-parter. Instead the split alternates BY LESSON: an
// even-indexed lesson sends item 1 to Form A and item 2 to Form B, an
// odd-indexed lesson the reverse. Both forms cover every lesson, share no
// question, and mix all three item types. Deterministic — no Math.random.
//
// PRESENTATION RULES (inherited from renderMstarPractice, engine/core/
// lesson-renderer.js, and the decisions recorded there):
//   • These are MSTAR-STYLE items written for this curriculum, and every page
//     says so — implying they are official Maryland items would be a lie.
//   • ENGLISH ONLY. MSTAR is administered in English (Joel, 2026-08-28).
//   • The error-analysis rubric and model answer are a TEACHER's scoring
//     tool: they render only on the answer-key page, whose "answer-key" path
//     segment the middleware already gates. Never on the student page.
//   • No countdown timer. Practice is rehearsal, not a race.
//
// Run:  node scripts/generate-mstar-practice.mjs   (npm run generate-mstar-practice)
// Writes: mstar-practice/index.html
//         mstar-practice/unit-<u>-form-<a|b>/index.html
//         mstar-practice/unit-<u>-form-<a|b>-answer-key/index.html

import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeGenerated } from "./lib/preserve-injected.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "mstar-practice");

/* ── collect ──────────────────────────────────────────────────────────────── */

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemProblems(item, where) {
  // Preflight: an item missing the fields its type promises would render a
  // broken question with no error. Fail the whole run loudly instead.
  const bad = (msg) => `${where}: ${msg}`;
  if (item.type === "ebsr") {
    for (const [part, p] of [
      ["partA", item.partA],
      ["partB", item.partB],
    ]) {
      if (!p) return bad(`ebsr missing ${part}`);
      if (!p.stem || !Array.isArray(p.choices) || p.choices.length < 2)
        return bad(`ebsr ${part} missing stem/choices`);
      if (
        !Number.isInteger(p.correctIndex) ||
        p.correctIndex < 0 ||
        p.correctIndex >= p.choices.length
      )
        return bad(`ebsr ${part} correctIndex out of range`);
    }
    return null;
  }
  if (item.type === "multi-select") {
    if (!item.stem || !Array.isArray(item.options) || item.options.length < 2)
      return bad("multi-select missing stem/options");
    if (!Array.isArray(item.correctIndices) || !item.correctIndices.length)
      return bad("multi-select missing correctIndices");
    if (item.correctIndices.some((i) => !Number.isInteger(i) || i < 0 || i >= item.options.length))
      return bad("multi-select correctIndices out of range");
    return null;
  }
  if (item.type === "error-analysis") {
    if (!item.scenario || !item.prompt) return bad("error-analysis missing scenario/prompt");
    if (!item.rubric || !item.correctAnswer)
      return bad("error-analysis missing rubric/correctAnswer");
    return null;
  }
  return bad(`unknown item type "${item.type}"`);
}

function collectUnits() {
  const manifest = JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8"));
  const titles = new Map(manifest.lessons.map((l) => [l.id, l.title]));

  const units = new Map();
  const problems = [];
  const dirs = readdirSync(join(ROOT, "lessons"))
    .filter((d) => /^\d+-\d+$/.test(d))
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });

  for (const d of dirs) {
    const file = join(ROOT, "lessons", d, "config.json");
    if (!existsSync(file)) continue;
    const config = JSON.parse(readFileSync(file, "utf8"));
    const items = config?.reflect?.mstarPractice || config?.mstarPractice;
    if (!Array.isArray(items) || !items.length) continue;
    items.forEach((item, i) => {
      const problem = itemProblems(item, `${d} item ${item.itemNumber || i + 1}`);
      if (problem) problems.push(problem);
    });
    const unit = Number(d.split("-")[0]);
    if (!units.has(unit)) units.set(unit, []);
    units.get(unit).push({ lessonId: d, lessonTitle: titles.get(d) || d, items });
  }

  if (problems.length) {
    console.error("MSTAR item preflight FAILED:\n  " + problems.join("\n  "));
    process.exit(1);
  }
  return units;
}

function splitForms(lessons) {
  // Every lesson sends its EBSR to one form and its second item (multi-select
  // or error analysis) to the other, so both forms cover every lesson and
  // share no question. WHICH form gets the second item is chosen greedily to
  // balance that item's TYPE across the forms — a plain parity split handed
  // one form seven hand-scored written responses and the other zero, which is
  // not a parallel form. Deterministic: lesson order + counts, no randomness.
  const forms = { a: [], b: [] };
  const counts = { a: {}, b: {} };
  const put = (form, lesson, item) => {
    forms[form].push({ ...item, lessonId: lesson.lessonId, lessonTitle: lesson.lessonTitle });
    counts[form][item.type] = (counts[form][item.type] || 0) + 1;
  };
  lessons.forEach((lesson) => {
    const [first, second] = lesson.items;
    if (!second) {
      // A single-item lesson cannot appear on both forms; give it to the
      // shorter form and let the run report the imbalance.
      put(forms.a.length <= forms.b.length ? "a" : "b", lesson, first);
      return;
    }
    const t = second.type;
    const aCount = counts.a[t] || 0;
    const bCount = counts.b[t] || 0;
    const secondTo =
      aCount < bCount ? "a" : aCount > bCount ? "b" : forms.a.length <= forms.b.length ? "a" : "b";
    put(secondTo, lesson, second);
    put(secondTo === "a" ? "b" : "a", lesson, first);
    lesson.items.slice(2).forEach((extra, i) => put(i % 2 === 0 ? "a" : "b", lesson, extra));
  });
  return forms;
}

function unitNames() {
  const ranges = JSON.parse(readFileSync(join(ROOT, "data/pacing-unit-ranges.json"), "utf8"));
  const names = new Map();
  const order = [];
  for (const u of ranges.units) {
    if (!u.curriculumUnit) continue;
    const label = String(u.districtLabel || "").replace(/^[^:]*:\s*/, "");
    if (!names.has(u.curriculumUnit)) {
      names.set(u.curriculumUnit, label || `Unit ${u.curriculumUnit}`);
      order.push(u.curriculumUnit);
    }
  }
  return { names, order };
}

/* ── shared page chrome ───────────────────────────────────────────────────── */

const STYLE = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f4f7fb; color: #21313f; line-height: 1.55; }
.container { max-width: 860px; margin: 0 auto; padding: 24px 16px 72px; }
.breadcrumb { font-size: 14px; margin-bottom: 18px; color: #5f6f80; }
.breadcrumb a { color: #0d7a76; text-decoration: none; font-weight: 600; }
.breadcrumb span { margin: 0 6px; }
h1 { font-size: 28px; color: #12355b; margin: 6px 0 4px; }
.subtitle { color: #5f6f80; font-size: 16px; margin-bottom: 14px; }
.honesty { background: #fffbe0; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 14px; font-size: 14.5px; color: #713f12; margin-bottom: 18px; }
.card { background: #fff; border: 1px solid #d7e2ed; border-radius: 14px; padding: 20px 22px; margin-bottom: 18px; box-shadow: 0 4px 14px rgba(18,53,91,.06); }
.item-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.item-num { background: #12355b; color: #fff; font-weight: 800; border-radius: 8px; padding: 3px 11px; font-size: 15px; }
.item-tag { font-size: 12.5px; font-weight: 700; color: #5f6f80; background: #eef4fa; border: 1px solid #d7e2ed; border-radius: 999px; padding: 2px 10px; }
.part-label { font-weight: 800; color: #0d7a76; font-size: 14px; text-transform: uppercase; letter-spacing: .04em; margin: 14px 0 4px; }
.stem { font-size: 17px; font-weight: 600; margin-bottom: 10px; }
.scenario { font-size: 16px; background: #f8fbff; border-left: 4px solid #0369a1; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; }
.choice { display: flex; align-items: flex-start; gap: 10px; border: 2px solid #d7e2ed; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; cursor: pointer; font-size: 16px; min-height: 44px; background: #fff; }
.choice:hover { border-color: #0d7a76; }
.choice input { width: 20px; height: 20px; margin-top: 2px; flex: none; accent-color: #0d7a76; }
.choice.is-correct { border-color: #16a34a; background: #f0fdf4; }
.choice.is-wrong { border-color: #ef4444; background: #fef2f2; }
textarea.response { width: 100%; min-height: 110px; border: 2px solid #d7e2ed; border-radius: 10px; padding: 12px 14px; font: inherit; font-size: 16px; }
.hand-scored { font-size: 14px; color: #5f6f80; margin-top: 8px; }
.fb { display: none; border-radius: 10px; padding: 12px 14px; margin-top: 10px; font-size: 15.5px; }
.fb.visible { display: block; }
.fb-correct { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.fb-wrong { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.actions { display: flex; gap: 12px; flex-wrap: wrap; margin: 22px 0; }
button.btn { border: 0; border-radius: 10px; padding: 13px 26px; font-size: 16px; font-weight: 700; cursor: pointer; min-height: 44px; }
.btn-primary { background: #12355b; color: #fff; }
.btn-secondary { background: #eef4fa; color: #12355b; border: 1.5px solid #d7e2ed; }
button.btn:focus-visible, .choice:focus-within { outline: 3px solid #0d7a76; outline-offset: 2px; }
.score-box { display: none; background: #12355b; color: #fff; border-radius: 14px; padding: 20px 22px; margin-bottom: 18px; font-size: 17px; }
.score-box.visible { display: block; }
.key-answer { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 14px; margin-top: 8px; font-size: 15.5px; }
.rubric { background: #f8fbff; border: 1px solid #d7e2ed; border-radius: 10px; padding: 12px 14px; margin-top: 8px; font-size: 15px; }
.rubric p { margin-bottom: 6px; }
.hub-unit { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.hub-links a { display: inline-block; background: #eef4fa; border: 1.5px solid #d7e2ed; border-radius: 10px; padding: 10px 18px; font-weight: 700; color: #12355b; text-decoration: none; margin-left: 8px; min-height: 44px; }
.hub-links a:hover { border-color: #0d7a76; }
.muted { color: #5f6f80; font-size: 14.5px; }
@media print { .breadcrumb, .actions, .score-box { display: none !important; } .card { break-inside: avoid; } }
`;

const SR_HEAD = `  <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">
  <!-- nsr-injected:end -->`;
const SR_BODY = `  <!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
  <script src="/shared/save-resume/save-resume-engine.js" defer></script>
  <!-- nsr-injected:end -->`;

// Same sentinel block tools/inject-canvas-bridge.js writes, emitted by the
// generator so a regeneration cannot strip the bridge off a cataloged page —
// the injector recognizes its own marker and skips. Student form pages only:
// the hub assigns nothing and the answer keys are teacher surfaces.
const CANVAS_BRIDGE = `  <!-- canvas-bridge-injected:begin (Canvas grade bridge — tools/inject-canvas-bridge.js) -->
  <script src="/assets/canvas-bridge.js" defer></script>
  <!-- canvas-bridge-injected:end -->`;

function shell({ title, description, crumb, body, saveResume, canvasBridge }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${esc(description)}" />
    <title>${esc(title)} · Neft Teacher</title>
    <style>${STYLE}</style>
${saveResume ? SR_HEAD : ""}
  </head>
  <body>
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/mstar-practice/">MSTAR Practice</a>${crumb ? `<span>/</span>${esc(crumb)}` : ""}
      </nav>
${body}
    </div>
${saveResume ? SR_BODY : ""}
${canvasBridge ? CANVAS_BRIDGE : ""}
  </body>
</html>
`;
}

// The factual frame is kept conservative on purpose: MSDE has announced MSTAR
// (Maryland System of Testing Academic Readiness, grades 3-8 from 2026-27,
// three 40-minute math sessions, ~25% shorter than MCAP) but has not published
// final blueprints, so the pages state the announced shape and claim no more.
const HONESTY =
  "These are MSTAR-style questions written for this curriculum to rehearse the format. They are not official Maryland assessment items. MSTAR — Maryland's new state test, first given in spring 2027 — uses the same kinds of questions you see here: selected response, select-all, two-part evidence questions, and written responses.";

/* ── student page ─────────────────────────────────────────────────────────── */

function choiceHtml(qKey, choices, multi) {
  const type = multi ? "checkbox" : "radio";
  return choices
    .map(
      (choice, i) => `        <label class="choice" data-q="${qKey}" data-i="${i}">
          <input type="${type}" name="${qKey}" value="${i}" />
          <span>${esc(choice)}</span>
        </label>`,
    )
    .join("\n");
}

function studentItemHtml(item, n) {
  const head = `      <div class="item-head"><span class="item-num">${n}</span><span class="item-tag">${esc(
    item.standard || item.partA?.standard || "",
  )}</span><span class="item-tag">${esc(item.lessonTitle)}</span></div>`;

  if (item.type === "ebsr") {
    return `    <div class="card" data-item="${n}">
${head}
      <p class="part-label">Part A</p>
      <p class="stem">${esc(item.partA.stem)}</p>
      <div role="radiogroup" aria-label="Question ${n} Part A choices">
${choiceHtml(`q${n}a`, item.partA.choices, false)}
      </div>
      <div class="fb" data-fb="q${n}a" role="status" aria-live="polite"></div>
      <p class="part-label">Part B</p>
      <p class="stem">${esc(item.partB.stem)}</p>
      <div role="radiogroup" aria-label="Question ${n} Part B choices">
${choiceHtml(`q${n}b`, item.partB.choices, false)}
      </div>
      <div class="fb" data-fb="q${n}b" role="status" aria-live="polite"></div>
    </div>`;
  }
  if (item.type === "multi-select") {
    return `    <div class="card" data-item="${n}">
${head}
      <p class="part-label">Select all that apply</p>
      <p class="stem">${esc(item.stem)}</p>
      <div role="group" aria-label="Question ${n} choices">
${choiceHtml(`q${n}`, item.options, true)}
      </div>
      <div class="fb" data-fb="q${n}" role="status" aria-live="polite"></div>
    </div>`;
  }
  // error-analysis: written response; the rubric is a teacher's scoring tool
  // and renders only on the answer-key page (same rule as the lesson engine).
  return `    <div class="card" data-item="${n}">
${head}
      <p class="part-label">Explain the error</p>
      <p class="scenario">${esc(item.scenario)}</p>
      <p class="stem">${esc(item.prompt)}</p>
      <textarea class="response" data-q="q${n}w" rows="5" aria-label="Your explanation for question ${n}"></textarea>
      <p class="hand-scored">✍️ Written response — your teacher scores this part (2 points).</p>
    </div>`;
}

// KEY holds only what grading needs; feedback text stays in the DOM-free map
// so the inline script is data + a small engine, mirroring mcap-review.
function studentKey(items) {
  const key = {};
  items.forEach((item, idx) => {
    const n = idx + 1;
    if (item.type === "ebsr") {
      key[`q${n}a`] = {
        correct: [item.partA.correctIndex],
        explanation: item.partA.explanation,
        choiceFeedback: item.partA.choiceFeedback || [],
      };
      key[`q${n}b`] = {
        correct: [item.partB.correctIndex],
        explanation: item.partB.explanation,
        choiceFeedback: item.partB.choiceFeedback || [],
      };
    } else if (item.type === "multi-select") {
      key[`q${n}`] = {
        correct: [...item.correctIndices].sort((a, b) => a - b),
        multi: true,
        explanation: item.explanation,
      };
    }
  });
  return key;
}

function studentScript(storageKey, key, writtenCount) {
  return `<script>
(function () {
  "use strict";
  var KEY = ${JSON.stringify(key)};
  var STORE = ${JSON.stringify(storageKey)};
  var autoTotal = Object.keys(KEY).length;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (_) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) { /* storage blocked */ }
  }
  var state = load();

  // Restore
  document.querySelectorAll(".choice input").forEach(function (input) {
    var q = input.name, i = Number(input.value);
    var saved = state[q];
    if (Array.isArray(saved) ? saved.indexOf(i) !== -1 : saved === i) input.checked = true;
    input.addEventListener("change", function () {
      if (input.type === "checkbox") {
        var set = Array.isArray(state[q]) ? state[q] : [];
        set = set.filter(function (x) { return x !== i; });
        if (input.checked) set.push(i);
        state[q] = set.sort(function (a, b) { return a - b; });
      } else {
        state[q] = i;
      }
      save(state);
    });
  });
  document.querySelectorAll("textarea.response").forEach(function (ta) {
    var q = ta.getAttribute("data-q");
    if (typeof state[q] === "string") ta.value = state[q];
    ta.addEventListener("input", function () { state[q] = ta.value; save(state); });
  });

  function gradeOne(q) {
    var spec = KEY[q];
    var picked = state[q];
    var pickedArr = spec.multi ? (Array.isArray(picked) ? picked : []) : (typeof picked === "number" ? [picked] : []);
    var want = spec.correct.join(",");
    var got = pickedArr.slice().sort(function (a, b) { return a - b; }).join(",");
    var right = got === want && pickedArr.length > 0;
    document.querySelectorAll('.choice[data-q="' + q + '"]').forEach(function (row) {
      var i = Number(row.getAttribute("data-i"));
      row.classList.toggle("is-correct", spec.correct.indexOf(i) !== -1);
      row.classList.toggle("is-wrong", pickedArr.indexOf(i) !== -1 && spec.correct.indexOf(i) === -1);
    });
    var fb = document.querySelector('[data-fb="' + q + '"]');
    if (fb) {
      var coach = "";
      if (!right && !spec.multi && pickedArr.length && spec.choiceFeedback && spec.choiceFeedback[pickedArr[0]]) {
        coach = spec.choiceFeedback[pickedArr[0]] + " ";
      }
      fb.textContent = (right ? "✓ Correct. " : pickedArr.length ? "✗ Not yet. " : "— Not answered. ") + coach + spec.explanation;
      fb.className = "fb visible " + (right ? "fb-correct" : "fb-wrong");
    }
    return right ? 1 : 0;
  }

  var submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.addEventListener("click", function () {
    var score = 0;
    Object.keys(KEY).forEach(function (q) { score += gradeOne(q); });
    var box = document.getElementById("scoreBox");
    box.className = "score-box visible";
    box.textContent = "Auto-scored: " + score + " of " + autoTotal + " selected-response parts correct." +
      (${writtenCount} ? " Plus ${writtenCount} written response(s) your teacher scores." : "");
    box.focus();
    // Inside a Canvas SCORM launch the grade bridge is on the page; report the
    // auto-scored percent silently. reportScore is repeatable, so a retake
    // simply reports again. Outside Canvas the bridge is absent and this no-ops.
    if (window.NeftCanvasBridge && autoTotal) {
      try { window.NeftCanvasBridge.reportScore(Math.round((score / autoTotal) * 100)); } catch (_) { /* bridge must never break grading */ }
    }
  });

  var resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    if (!confirm("Clear all your answers on this practice test?")) return;
    try { localStorage.removeItem(STORE); } catch (_) { /* storage blocked */ }
    location.reload();
  });
})();
</script>`;
}

function studentPage(unit, unitName, formLetter, items) {
  const writtenCount = items.filter((i) => i.type === "error-analysis").length;
  const storageKey = `mstar-practice:u${unit}-${formLetter}`;
  const body = `      <h1>Unit ${unit} MSTAR-Style Practice Test — Form ${formLetter.toUpperCase()}</h1>
      <p class="subtitle">${esc(unitName)} · ${items.length} questions · English only, like the real test · No timer — take the time you need.</p>
      <div class="honesty">${esc(HONESTY)}</div>
      <div class="card">
        <p><strong>How this works:</strong> Answer every question, then press <em>Submit &amp; Grade</em>. Selected-response parts grade instantly with an explanation for each; written responses go to your teacher. Your answers save on this device.</p>
        <p style="margin-top:0.6em"><strong>On the real MSTAR:</strong> math runs as three 40-minute sessions, in English, on a computer. Here there is no clock — practice the thinking first; the pacing comes with rehearsal.</p>
      </div>
      <div id="scoreBox" class="score-box" role="status" aria-live="polite" tabindex="-1"></div>
${items.map((item, idx) => studentItemHtml(item, idx + 1)).join("\n")}
      <div class="actions">
        <button type="button" class="btn btn-primary" id="submitBtn">Submit &amp; Grade</button>
        <button type="button" class="btn btn-secondary" id="resetBtn">Reset</button>
      </div>
${studentScript(storageKey, studentKey(items), writtenCount)}`;
  return shell({
    title: `Unit ${unit} MSTAR-Style Practice Test · Form ${formLetter.toUpperCase()}`,
    description: `Interactive MSTAR-style practice test for Unit ${unit} (${unitName}), Form ${formLetter.toUpperCase()} — auto-graded selected response with explanations, written responses for teacher scoring.`,
    crumb: `Unit ${unit} · Form ${formLetter.toUpperCase()}`,
    body,
    saveResume: true,
    canvasBridge: true,
  });
}

/* ── answer key page (teacher; path carries "answer-key" so it is gated) ──── */

function letter(i) {
  return String.fromCharCode(65 + i);
}

function keyItemHtml(item, n) {
  const head = `      <div class="item-head"><span class="item-num">${n}</span><span class="item-tag">${esc(
    item.standard || "",
  )}</span><span class="item-tag">${esc(item.lessonId)} · ${esc(item.lessonTitle)}</span></div>`;
  if (item.type === "ebsr") {
    return `    <div class="card">
${head}
      <p class="part-label">Part A</p>
      <p class="stem">${esc(item.partA.stem)}</p>
      <div class="key-answer"><b>${letter(item.partA.correctIndex)}.</b> ${esc(item.partA.choices[item.partA.correctIndex])}</div>
      <p class="muted">${esc(item.partA.explanation)}</p>
      <p class="part-label">Part B</p>
      <p class="stem">${esc(item.partB.stem)}</p>
      <div class="key-answer"><b>${letter(item.partB.correctIndex)}.</b> ${esc(item.partB.choices[item.partB.correctIndex])}</div>
      <p class="muted">${esc(item.partB.explanation)}</p>
    </div>`;
  }
  if (item.type === "multi-select") {
    return `    <div class="card">
${head}
      <p class="part-label">Select all that apply</p>
      <p class="stem">${esc(item.stem)}</p>
      <div class="key-answer"><b>${item.correctIndices.map(letter).join(", ")}.</b> ${item.correctIndices
        .map((i) => esc(item.options[i]))
        .join(" · ")}</div>
      <p class="muted">${esc(item.explanation)}</p>
    </div>`;
  }
  return `    <div class="card">
${head}
      <p class="part-label">Written response — 2 points</p>
      <p class="scenario">${esc(item.scenario)}</p>
      <p class="stem">${esc(item.prompt)}</p>
      <div class="rubric">
        <p><b>Score 2:</b> ${esc(item.rubric.score2 || "")}</p>
        <p><b>Score 1:</b> ${esc(item.rubric.score1 || "")}</p>
        <p><b>Score 0:</b> ${esc(item.rubric.score0 || "")}</p>
        <p><b>Model:</b> ${esc(item.correctAnswer)}</p>
      </div>
    </div>`;
}

function keyPage(unit, unitName, formLetter, items) {
  const body = `      <h1>Answer Key — Unit ${unit} Practice Test, Form ${formLetter.toUpperCase()}</h1>
      <p class="subtitle">${esc(unitName)} · Teacher copy: answers, explanations, and scoring rubrics.</p>
      <div class="honesty">${esc(HONESTY)}</div>
${items.map((item, idx) => keyItemHtml(item, idx + 1)).join("\n")}`;
  return shell({
    title: `Answer Key · Unit ${unit} MSTAR Practice Form ${formLetter.toUpperCase()}`,
    description: `Teacher answer key for the Unit ${unit} MSTAR-style practice test, Form ${formLetter.toUpperCase()}.`,
    crumb: `Unit ${unit} · Form ${formLetter.toUpperCase()} · Answer Key`,
    body,
    saveResume: true,
  });
}

/* ── hub ──────────────────────────────────────────────────────────────────── */

function hubPage(unitsBuilt, unitsEmpty, names, order) {
  const ordered = order.filter((u) => unitsBuilt.has(u) || unitsEmpty.includes(u));
  for (const u of [...unitsBuilt.keys(), ...unitsEmpty]) if (!ordered.includes(u)) ordered.push(u);
  const rows = ordered
    .map((u) => {
      const name = names.get(u) || `Unit ${u}`;
      if (!unitsBuilt.has(u)) {
        return `      <div class="card hub-unit">
        <div><b>Unit ${u}: ${esc(name)}</b><br /><span class="muted">No MSTAR items are authored for this unit yet, so it has no practice test — nothing here is invented to fill the gap.</span></div>
      </div>`;
      }
      const counts = unitsBuilt.get(u);
      return `      <div class="card hub-unit">
        <div><b>Unit ${u}: ${esc(name)}</b><br /><span class="muted">Two forms, different questions — ${counts.a} and ${counts.b} items, every lesson covered on both.</span></div>
        <div class="hub-links">
          <a href="/mstar-practice/unit-${u}-form-a/">Form A</a>
          <a href="/mstar-practice/unit-${u}-form-b/">Form B</a>
        </div>
      </div>`;
    })
    .join("\n");
  const body = `      <h1>MSTAR-Style Unit Practice Tests</h1>
      <p class="subtitle">Two forms per unit with different questions, built from the same MSTAR-style items the lessons rehearse. Units listed in the order we teach them.</p>
      <div class="honesty">${esc(HONESTY)}</div>
${rows}
      <p class="muted" style="margin-top:18px">Teachers: each form has an answer key at its address plus <code>-answer-key</code> (sign-in required).</p>`;
  return shell({
    title: "MSTAR Practice Tests",
    description:
      "MSTAR-style unit practice tests for Grade 6 math — two auto-graded forms per unit with different questions.",
    crumb: "",
    body,
    saveResume: true,
  });
}

/* ── main ─────────────────────────────────────────────────────────────────── */

function write(rel, html) {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  // writeGenerated re-splices any injected sentinel layers already on disk
  // (uifr today; whatever comes next) so a regeneration cannot strip them —
  // the repo-wide generator rule. The nsr and canvas-bridge blocks this
  // template emits itself are recognized by their injectors and left alone.
  writeGenerated(file, html);
  console.log("  wrote", join("mstar-practice", rel));
}

function main() {
  const units = collectUnits();
  const { names, order } = unitNames();
  const allUnits = [...new Set([...names.keys()])].sort((a, b) => a - b);
  const built = new Map();
  const empty = [];

  for (const u of allUnits) {
    const lessons = units.get(u);
    if (!lessons) {
      empty.push(u);
      continue;
    }
    const unitName = names.get(u) || `Unit ${u}`;
    const forms = splitForms(lessons);
    for (const f of ["a", "b"]) {
      write(`unit-${u}-form-${f}/index.html`, studentPage(u, unitName, f, forms[f]));
      write(`unit-${u}-form-${f}-answer-key/index.html`, keyPage(u, unitName, f, forms[f]));
    }
    built.set(u, { a: forms.a.length, b: forms.b.length });
    const overlap = forms.a.filter((x) =>
      forms.b.some((y) => y.lessonId === x.lessonId && y.itemNumber === x.itemNumber),
    );
    if (overlap.length) {
      console.error(`FORM OVERLAP in unit ${u}: ${overlap.length} shared item(s)`);
      process.exit(1);
    }
  }

  write("index.html", hubPage(built, empty, names, order));
  console.log(
    `\nBuilt ${built.size} unit(s) × 2 forms (+ keys). Units with no authored MSTAR items (no test generated): ${
      empty.length ? empty.join(", ") : "none"
    }`,
  );
}

main();

// ── Per-lesson MSTAR practice worksheets ─────────────────────────────────────
// Builds a PRINTABLE MSTAR-style practice worksheet for every core lesson that
// authors `mstarPractice` items, plus a teacher answer key per lesson:
//
//   lessons/<id>/mstar-worksheet.html             (student, printable)
//   lessons/<id>/mstar-worksheet-answer-key.html  (teacher; the "answer-key"
//     path segment is what isTeacherSurface() already gates behind Basic Auth,
//     so no auth file is touched — same seam as worksheet.html / practice.html,
//     and tools/validate-worksheet-audience.mjs sweeps this family by the same
//     rules.)
//
// SOURCE OF TRUTH: the authored `mstarPractice` blocks on the core lesson
// configs — the same items the in-lesson practice and the unit Form A/B tests
// render (shared contract: scripts/lib/mstar-items.mjs). This generator
// composes ONLY those items and authors no mathematics of its own. A lesson
// with no authored items (units 1 and 10 today) gets NO worksheet and is named
// in the output; inventing filler is how the copy-panel incident happened.
//
// PRESENTATION RULES (inherited from the unit-test generator and the decisions
// recorded there): MSTAR-style, says so on every page (HONESTY); ENGLISH ONLY
// (MSTAR is administered in English — Joel, 2026-08-28); the error-analysis
// rubric and model answer are teacher scoring tools and render only on the
// answer-key page; no countdown timer.
//
// Deterministic — no Math.random, no dates. Writes through writeGenerated so
// any injected sentinel layers survive a regen. `--check` reports staleness.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HONESTY, itemProblems, lessonMstarItems } from "./lib/mstar-items.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const LESSON_DIR_RE = /^\d+-\d+$/;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LETTERS = "ABCDEFGH";

/* ── shared page shell ────────────────────────────────────────────────────── */

const SHEET_CSS = `
:root {
  --navy: #12355b; --teal: #1fa6a2; --teal-ink: #0c6f6b; --line: #d7e2ed;
  --ink: #21313f; --muted: #5f6f80; --cream: #f7f4ec; --amber-light: #fef7e0;
}
* { box-sizing: border-box; }
body {
  font-family: "Hanken Grotesk", Calibri, "Segoe UI", system-ui, sans-serif;
  color: var(--ink); background: var(--cream); margin: 0; line-height: 1.5;
  font-size: 15px;
}
.ws-page { max-width: 820px; margin: 0 auto; padding: 24px 18px 48px; }
.ws-sheet { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 28px 30px; }
.ws-head { border-bottom: 3px solid var(--navy); padding-bottom: 14px; margin-bottom: 6px; }
.ws-kicker { font-size: 12px; font-weight: 800; letter-spacing: .08em; color: var(--teal-ink); text-transform: uppercase; }
.ws-title { margin: 4px 0 2px; font-size: 22px; color: var(--navy); }
.ws-sub { margin: 0; color: var(--muted); font-size: 13.5px; }
.ws-nameline { display: flex; gap: 24px; margin: 14px 0 2px; font-size: 14px; }
.ws-nameline span { flex: 1; border-bottom: 1.5px solid var(--ink); padding-bottom: 2px; }
.ws-honesty { font-size: 12px; color: var(--muted); font-style: italic; margin: 10px 0 18px; }
.ws-item { margin: 0 0 22px; break-inside: avoid; }
.ws-item-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
.ws-qnum {
  background: var(--navy); color: #fff; font-weight: 800; font-size: 13px;
  border-radius: 999px; padding: 3px 12px; white-space: nowrap;
}
.ws-type { font-size: 11.5px; font-weight: 700; letter-spacing: .05em; color: var(--muted); text-transform: uppercase; }
.ws-part { margin: 10px 0 4px; font-weight: 800; color: var(--teal-ink); font-size: 13.5px; }
.ws-stem { margin: 4px 0 8px; font-size: 15px; }
.ws-instruction { margin: 2px 0 8px; font-size: 12.5px; color: var(--muted); font-style: italic; }
.ws-opts { list-style: none; margin: 0; padding: 0; }
.ws-opt { display: flex; gap: 10px; align-items: flex-start; padding: 5px 0; }
.ws-bub {
  flex: 0 0 auto; width: 22px; height: 22px; border: 1.6px solid var(--ink);
  display: inline-grid; place-items: center; font-size: 11px; font-weight: 700; margin-top: 1px;
}
.ws-bub.ws-round { border-radius: 50%; }
.ws-bub.ws-square { border-radius: 4px; }
.ws-scenario {
  background: var(--amber-light); border: 1px solid #f0d9a0; border-left: 4px solid #d9a520;
  border-radius: 10px; padding: 12px 14px; margin: 8px 0; font-size: 14.5px;
}
.ws-scenario-title { font-weight: 800; margin: 0 0 4px; }
.ws-lines { margin-top: 10px; }
.ws-line { border-bottom: 1.2px solid #b9c6d4; height: 26px; }
.ws-points { font-size: 12px; color: var(--muted); font-weight: 700; }
.ws-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
.ws-print-btn {
  position: fixed; right: 18px; bottom: 18px; background: var(--navy); color: #fff;
  border: 0; border-radius: 999px; padding: 12px 20px; font-size: 15px; font-weight: 700;
  cursor: pointer; box-shadow: 0 8px 20px -8px rgba(18,53,91,.6); min-height: 44px;
}
.ws-print-btn:hover { background: #18466f; }
.ws-correct { background: #e6f7ef; border-radius: 8px; }
.ws-correct .ws-bub { background: var(--teal); border-color: var(--teal-ink); color: #fff; }
.ws-keynote {
  background: #eef6ff; border-left: 4px solid var(--navy); border-radius: 8px;
  padding: 10px 12px; margin: 8px 0 0; font-size: 13.5px;
}
.ws-feedback { margin: 6px 0 0; padding-left: 18px; font-size: 13px; color: var(--muted); }
.ws-rubric { border-collapse: collapse; margin: 8px 0 0; width: 100%; font-size: 13.5px; }
.ws-rubric th, .ws-rubric td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
.ws-rubric th { background: var(--cream); white-space: nowrap; }
.ws-key-banner {
  background: var(--navy); color: #fff; border-radius: 10px; padding: 10px 16px;
  font-weight: 800; letter-spacing: .04em; margin-bottom: 16px; font-size: 14px;
}
@media print {
  body { background: #fff; font-size: 13px; }
  .ws-page { padding: 0; max-width: none; }
  .ws-sheet { border: 0; border-radius: 0; padding: 0; }
  .ws-print-btn { display: none; }
  .ws-scenario, .ws-keynote, .ws-correct { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
`;

function shell({ title, lessonId, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<link href="/assets/fonts/outfit-hanken-grotesk-56e206.css" rel="stylesheet">
<style>${SHEET_CSS}</style>
</head>
<body data-lesson-id="${esc(lessonId)}">
<div class="ws-page">
  <div class="ws-sheet">
${body}
  </div>
</div>
<button type="button" class="ws-print-btn" onclick="window.print()">🖨️ Print</button>
</body>
</html>
`;
}

function headerHtml(lessonId, title, standards, forTeacher) {
  return `    <header class="ws-head">
      <p class="ws-kicker">MSTAR Practice Worksheet</p>
      <h1 class="ws-title">Lesson ${esc(lessonId)}: ${esc(title)}</h1>
      <p class="ws-sub">Grade 6 Mathematics · Standard${standards.length > 1 ? "s" : ""} ${standards.map(esc).join(", ")}</p>
${
  forTeacher
    ? ""
    : `      <div class="ws-nameline">
        <span>Name:</span>
        <span>Date:</span>
      </div>`
}
    </header>
    <p class="ws-honesty">${esc(HONESTY)}</p>`;
}

/* ── student rendering ────────────────────────────────────────────────────── */

function choicesHtml(choices, { multi = false, correct = null } = {}) {
  const shape = multi ? "ws-square" : "ws-round";
  const isCorrect = (i) =>
    correct !== null && (Array.isArray(correct) ? correct.includes(i) : correct === i);
  return `<ul class="ws-opts">
${choices
  .map(
    (c, i) =>
      `        <li class="ws-opt${isCorrect(i) ? " ws-correct" : ""}"><span class="ws-bub ${shape}">${LETTERS[i]}</span><span>${esc(c)}</span></li>`,
  )
  .join("\n")}
      </ul>`;
}

function writingLines(n) {
  return `<div class="ws-lines">${'<div class="ws-line"></div>'.repeat(n)}</div>`;
}

function studentItemHtml(item, n) {
  if (item.type === "ebsr") {
    return `    <section class="ws-item">
      <div class="ws-item-head"><span class="ws-qnum">Question ${n}</span><span class="ws-type">Two-part question</span></div>
      <p class="ws-part">Part A</p>
      <p class="ws-stem">${esc(item.partA.stem)}</p>
      <p class="ws-instruction">Fill in the bubble next to the one best answer.</p>
      ${choicesHtml(item.partA.choices)}
      <p class="ws-part">Part B</p>
      <p class="ws-instruction">Answer Part A before Part B — Part B asks about your reasoning.</p>
      <p class="ws-stem">${esc(item.partB.stem)}</p>
      ${choicesHtml(item.partB.choices)}
    </section>`;
  }
  if (item.type === "multi-select") {
    return `    <section class="ws-item">
      <div class="ws-item-head"><span class="ws-qnum">Question ${n}</span><span class="ws-type">Select all that apply</span></div>
      <p class="ws-stem">${esc(item.stem)}</p>
      <p class="ws-instruction">Mark the box next to EVERY answer that is true. More than one is correct.</p>
      ${choicesHtml(item.options, { multi: true })}
    </section>`;
  }
  // error-analysis
  return `    <section class="ws-item">
      <div class="ws-item-head"><span class="ws-qnum">Question ${n}</span><span class="ws-type">Written response · <span class="ws-points">2 points</span></span></div>
${item.title ? `      <p class="ws-scenario-title">${esc(item.title)}</p>` : ""}
      <div class="ws-scenario">${esc(item.scenario)}</div>
      <p class="ws-stem">${esc(item.prompt)}</p>
      <p class="ws-instruction">Write your answer in complete sentences. Show or explain your mathematical thinking.</p>
      ${writingLines(8)}
    </section>`;
}

/* ── teacher key rendering ────────────────────────────────────────────────── */

function feedbackHtml(choices, feedback) {
  if (!Array.isArray(feedback)) return "";
  const notes = feedback
    .map((f, i) => (f ? `<li><strong>${LETTERS[i]}:</strong> ${esc(f)}</li>` : ""))
    .filter(Boolean);
  if (!notes.length) return "";
  return `<ul class="ws-feedback">${notes.join("")}</ul>`;
}

function keyItemHtml(item, n) {
  if (item.type === "ebsr") {
    return `    <section class="ws-item">
      <div class="ws-item-head"><span class="ws-qnum">Question ${n}</span><span class="ws-type">Two-part question</span></div>
      <p class="ws-part">Part A — correct answer: ${LETTERS[item.partA.correctIndex]}</p>
      <p class="ws-stem">${esc(item.partA.stem)}</p>
      ${choicesHtml(item.partA.choices, { correct: item.partA.correctIndex })}
      <p class="ws-keynote">${esc(item.partA.explanation || "")}</p>
      ${feedbackHtml(item.partA.choices, item.partA.choiceFeedback)}
      <p class="ws-part">Part B — correct answer: ${LETTERS[item.partB.correctIndex]}</p>
      <p class="ws-stem">${esc(item.partB.stem)}</p>
      ${choicesHtml(item.partB.choices, { correct: item.partB.correctIndex })}
      <p class="ws-keynote">${esc(item.partB.explanation || "")}</p>
    </section>`;
  }
  if (item.type === "multi-select") {
    const letters = item.correctIndices.map((i) => LETTERS[i]).join(", ");
    return `    <section class="ws-item">
      <div class="ws-item-head"><span class="ws-qnum">Question ${n}</span><span class="ws-type">Select all that apply — correct: ${letters}</span></div>
      <p class="ws-stem">${esc(item.stem)}</p>
      ${choicesHtml(item.options, { multi: true, correct: item.correctIndices })}
      <p class="ws-keynote">${esc(item.explanation || "")}</p>
    </section>`;
  }
  // error-analysis: the rubric and model answer are the teacher's scoring tool.
  const r = item.rubric || {};
  return `    <section class="ws-item">
      <div class="ws-item-head"><span class="ws-qnum">Question ${n}</span><span class="ws-type">Written response · 2 points</span></div>
${item.title ? `      <p class="ws-scenario-title">${esc(item.title)}</p>` : ""}
      <div class="ws-scenario">${esc(item.scenario)}</div>
      <p class="ws-stem">${esc(item.prompt)}</p>
      <p class="ws-keynote"><strong>Model answer:</strong> ${esc(item.correctAnswer)}</p>
      <table class="ws-rubric">
        <tr><th>2 points</th><td>${esc(r.score2 || "")}</td></tr>
        <tr><th>1 point</th><td>${esc(r.score1 || "")}</td></tr>
        <tr><th>0 points</th><td>${esc(r.score0 || "")}</td></tr>
      </table>
    </section>`;
}

/* ── build ────────────────────────────────────────────────────────────────── */

function buildLesson(id, config, titles) {
  const items = lessonMstarItems(config);
  if (!items) return false;

  const problems = items
    .map((it, i) => itemProblems(it, `lessons/${id} item ${i + 1}`))
    .filter(Boolean);
  if (problems.length) {
    console.error(`✗ ${id}: ${problems.join("; ")}`);
    process.exitCode = 1;
    return false;
  }

  const title = titles.get(id) || config.title || `Lesson ${id}`;
  const standards = [...new Set(items.map((it) => it.standard).filter(Boolean))];
  if (!standards.length && config.standard) standards.push(config.standard);

  const studentBody = `${headerHtml(id, title, standards, false)}
${items.map((it, i) => studentItemHtml(it, i + 1)).join("\n")}
    <footer class="ws-footer">When you finish, check your reasoning with your teacher or family. Your teacher has the scoring guide for the written response.</footer>`;

  const keyBody = `    <div class="ws-key-banner">🔑 Answer Key — Teacher Copy · Lesson ${esc(id)}</div>
${headerHtml(id, title, standards, true)}
${items.map((it, i) => keyItemHtml(it, i + 1)).join("\n")}
    <footer class="ws-footer">Answer Key. Score the written response with the rubric above; award partial credit per the 1-point row.</footer>`;

  const studentHtml = shell({
    title: `MSTAR Practice Worksheet — Lesson ${id}: ${title}`,
    lessonId: id,
    body: studentBody,
  }).replace('<html lang="en">', '<html lang="en" data-support-audience="student">');

  const keyHtml = shell({
    title: `MSTAR Practice Worksheet Answer Key — Lesson ${id}: ${title}`,
    lessonId: id,
    body: keyBody,
  }).replace('<html lang="en">', '<html lang="en" data-support-audience="teacher">');

  const studentFile = join(LESSONS, id, "mstar-worksheet.html");
  const keyFile = join(LESSONS, id, "mstar-worksheet-answer-key.html");

  if (CHECK) {
    if (!isGeneratedFresh(studentFile, studentHtml))
      STALE.push(`lessons/${id}/mstar-worksheet.html`);
    if (!isGeneratedFresh(keyFile, keyHtml))
      STALE.push(`lessons/${id}/mstar-worksheet-answer-key.html`);
  } else {
    writeGenerated(studentFile, studentHtml);
    writeGenerated(keyFile, keyHtml);
  }
  return true;
}

const CHECK = process.argv.includes("--check");
const STALE = [];

function main() {
  const manifest = JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8"));
  const titles = new Map(manifest.lessons.map((l) => [l.id, l.title]));

  const dirs = readdirSync(LESSONS)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => existsSync(join(LESSONS, d, "config.json")))
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });

  let built = 0;
  const skipped = [];
  for (const id of dirs) {
    const config = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
    if (buildLesson(id, config, titles)) built++;
    else if (!process.exitCode) skipped.push(id);
  }

  if (CHECK) {
    if (STALE.length) {
      console.error(
        `${STALE.length} MSTAR worksheet page(s) are STALE:\n  ${STALE.slice(0, 15).join("\n  ")}\n\nFix: node scripts/generate-mstar-worksheets.mjs`,
      );
      process.exit(1);
    }
    if (!built) {
      console.error("No MSTAR worksheets were checked — the sweep proved nothing.");
      process.exit(1);
    }
    console.log(`MSTAR worksheets up to date (${built} lessons × sheet + key).`);
    return;
  }

  console.log(
    `Built ${built} MSTAR practice worksheet(s) + answer key(s). Lessons with no authored MSTAR items (no worksheet generated): ${
      skipped.length ? skipped.join(", ") : "none"
    }`,
  );
}

main();

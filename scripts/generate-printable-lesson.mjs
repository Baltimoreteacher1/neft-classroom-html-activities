/**
 * Generate a full, print-friendly student packet per lesson: `printable.html`.
 *
 * This is the paper fallback for students without a device. Unlike `handout.html`
 * (a one-page condensed sheet), this renders the COMPLETE lesson linearly from
 * `config.json` — objectives, Notice & Wonder, vocabulary, Turn & Talk, Launch
 * (I do / We do / You do), Explore, the on-level Practice set, Connect, and the
 * Exit Ticket — with generous work space and NO answers revealed.
 *
 * Self-contained (inline CSS, no external requests), grayscale-friendly, and
 * paginated so it prints cleanly. Source of truth stays `config.json`.
 *
 *   node scripts/generate-printable-lesson.mjs            # all lessons
 *   node scripts/generate-printable-lesson.mjs 1-1 10-3   # specific lessons
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const lessonsDir = join(__dirname, "..", "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Deterministic shuffle (seeded by string) so re-running the generator produces
// stable output — avoids noisy git diffs while still scrambling match columns.
function seededShuffle(arr, seedStr) {
  let seed = 0;
  for (const ch of String(seedStr)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const workLines = (n = 3) => `<div class="work">${'<div class="wl"></div>'.repeat(n)}</div>`;
const answerBlank = (label = "Answer") =>
  `<p class="ans"><strong>${esc(label)}:</strong> <span class="blank"></span></p>`;

// ---- Section renderers ----------------------------------------------------

function questionText(item) {
  return (
    item.stem || item.prompt || item.label || item.question || item.instructions || item.text || ""
  );
}

function renderChoices(choices) {
  return `<ol class="choices">${choices
    .map((c, i) => `<li><span class="ltr">${LETTERS[i]}</span> ${esc(c)}</li>`)
    .join("")}</ol>`;
}

// A blank grid table: header row + one row per data row, final column blanked
// for the student to fill. Earlier (scaffold) columns are shown as given.
function renderFillTable(item) {
  const cols = item.columns || [];
  const rows = item.rows || [];
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const head = `<tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => {
      const vals = keys.map((k) => r[k]);
      return `<tr>${vals
        .map((v, i) => (i === vals.length - 1 ? `<td class="fill"></td>` : `<td>${esc(v)}</td>`))
        .join("")}</tr>`;
    })
    .join("");
  return `<table class="grid">${head}${body}</table>`;
}

function renderSort(item) {
  const cats = (item.categories || []).map((c) => c.label || c.id || "");
  const items = seededShuffle(
    (item.items || []).map((it) => it.text ?? String(it)),
    JSON.stringify(item.items || []),
  );
  const bank = `<div class="wordbank"><strong>Word bank:</strong> ${items
    .map((t) => `<span class="chip">${esc(t)}</span>`)
    .join(" ")}</div>`;
  const boxes = `<div class="sortboxes">${cats
    .map((c) => `<div class="sortbox"><div class="sorthd">${esc(c)}</div></div>`)
    .join("")}</div>`;
  return bank + boxes;
}

function renderMatch(item) {
  const pairs = item.pairs || [];
  const left = pairs.map((p) => p.situation ?? p.term ?? p.left ?? "");
  const rightRaw = pairs.map((p) => p.equation ?? p.match ?? p.right ?? "");
  const right = seededShuffle(rightRaw, JSON.stringify(rightRaw));
  const rows = left
    .map(
      (l, i) =>
        `<tr><td class="mnum">${i + 1}.</td><td>${esc(l)}</td>` +
        `<td class="mans"></td>` +
        `<td class="mltr">${LETTERS[i]}.</td><td>${esc(right[i])}</td></tr>`,
    )
    .join("");
  return (
    `<p class="hint-line">Write the letter of the matching item in the blank.</p>` +
    `<table class="matchtbl">${rows}</table>`
  );
}

function renderErrorAnalysis(item) {
  const steps = (item.workedExample || [])
    .map(
      (s) =>
        `<div class="wa-step"><span class="wa-lbl">${esc(s.label || "")}</span><span class="wa-work">${esc(s.work || "")}</span></div>`,
    )
    .join("");
  return (
    `<div class="worked">${steps}</div>` +
    `<p class="ea-q"><strong>Which step has the mistake, and what should it be?</strong></p>` +
    workLines(3)
  );
}

function renderNumberLine(item) {
  const min = Number(item.min ?? 0);
  const max = Number(item.max ?? 10);
  const step = Number(item.step ?? 1) || 1;
  const w = 680;
  const pad = 24;
  const span = max - min || 1;
  const x = (v) => pad + ((v - min) / span) * (w - 2 * pad);
  let ticks = "";
  for (let v = min; v <= max + 1e-9; v += step) {
    const tx = x(v);
    ticks += `<line x1="${tx}" y1="34" x2="${tx}" y2="46" stroke="#333" stroke-width="1"/>`;
    ticks += `<text x="${tx}" y="60" font-size="11" text-anchor="middle" fill="#333">${+v.toFixed(2)}</text>`;
  }
  return `<svg class="numline" viewBox="0 0 ${w} 72" role="img" aria-label="Number line from ${min} to ${max}"><line x1="${pad}" y1="40" x2="${w - pad}" y2="40" stroke="#333" stroke-width="2"/>${ticks}</svg>`;
}

function renderCoordGrid(item) {
  const xMin = Number(item.xMin ?? 0);
  const xMax = Number(item.xMax ?? 10);
  const yMin = Number(item.yMin ?? 0);
  const yMax = Number(item.yMax ?? 10);
  const xStep = Number(item.xStep ?? 1) || 1;
  const yStep = Number(item.yStep ?? 1) || 1;
  const size = 320;
  const pad = 34;
  const inner = size - 2 * pad;
  const sx = (v) => pad + ((v - xMin) / (xMax - xMin || 1)) * inner;
  const sy = (v) => size - pad - ((v - yMin) / (yMax - yMin || 1)) * inner;
  let lines = "";
  for (let v = xMin; v <= xMax + 1e-9; v += xStep) {
    lines += `<line x1="${sx(v)}" y1="${pad}" x2="${sx(v)}" y2="${size - pad}" stroke="#ddd"/>`;
    lines += `<text x="${sx(v)}" y="${size - pad + 14}" font-size="9" text-anchor="middle" fill="#555">${v}</text>`;
  }
  for (let v = yMin; v <= yMax + 1e-9; v += yStep) {
    lines += `<line x1="${pad}" y1="${sy(v)}" x2="${size - pad}" y2="${sy(v)}" stroke="#ddd"/>`;
    lines += `<text x="${pad - 8}" y="${sy(v) + 3}" font-size="9" text-anchor="end" fill="#555">${v}</text>`;
  }
  const axes = `<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${size - pad}" stroke="#333" stroke-width="1.5"/><line x1="${pad}" y1="${size - pad}" x2="${size - pad}" y2="${size - pad}" stroke="#333" stroke-width="1.5"/>`;
  const labels = `<text x="${size / 2}" y="${size - 4}" font-size="10" text-anchor="middle" fill="#333">${esc(item.xLabel || "x")}</text><text x="10" y="${size / 2}" font-size="10" text-anchor="middle" fill="#333" transform="rotate(-90 10 ${size / 2})">${esc(item.yLabel || "y")}</text>`;
  return `<svg class="coordgrid" viewBox="0 0 ${size} ${size}" role="img" aria-label="Blank coordinate grid">${lines}${axes}${labels}</svg>`;
}

function renderBalance(item) {
  const rows = (item.items || [])
    .map(
      (it) =>
        `<tr><td>${esc(it.left ?? "")}</td><td class="bvs">?=?</td><td>${esc(it.right ?? "")}</td><td class="mans"></td></tr>`,
    )
    .join("");
  return (
    `<p class="hint-line">Balanced or not balanced? Show your check in the blank.</p>` +
    `<table class="balancetbl">${rows}</table>`
  );
}

// Render one practice/explore item into a static, answer-free block.
function renderItem(item, idx) {
  if (!item || typeof item !== "object") return "";
  const type = item.type || "open-response";
  const q = questionText(item);
  let body = "";
  switch (type) {
    case "multiple-choice":
      body = renderChoices(item.choices || []) + answerBlank();
      break;
    case "matching":
    case "matching-game":
      body = renderMatch(item);
      break;
    case "drag-sort":
      body = renderSort(item);
      break;
    case "fill-table":
      body = renderFillTable(item);
      break;
    case "error-analysis":
      body = renderErrorAnalysis(item);
      break;
    case "number-line":
      body = renderNumberLine(item) + workLines(2);
      break;
    case "coordinate-grid":
      body = renderCoordGrid(item) + workLines(1);
      break;
    case "balance-scale":
      body = renderBalance(item);
      break;
    case "bar-model":
      body = (item.questionText ? `<p>${esc(item.questionText)}</p>` : "") + workLines(3);
      break;
    case "open-response":
      body =
        (item.sentenceFrame ? `<p class="frame">${esc(item.sentenceFrame)}</p>` : "") +
        workLines(5);
      break;
    default:
      body = workLines(4);
  }
  const num = idx != null ? `<span class="qnum">${idx + 1}.</span> ` : "";
  return `<div class="item">${num ? `<p class="qtext">${num}${esc(q)}</p>` : q ? `<p class="qtext">${esc(q)}</p>` : ""}${body}</div>`;
}

function section(title, emoji, inner) {
  if (!inner) return "";
  return `<section class="lp-section"><h2>${emoji ? esc(emoji) + " " : ""}${esc(title)}</h2>${inner}</section>`;
}

// ---- Full-lesson builder --------------------------------------------------

function buildPrintable(config) {
  const id = config.lessonId || "";
  const bilingual = (en, es) => `${esc(en)}${es ? ` <span class="es">${esc(es)}</span>` : ""}`;

  // Objectives
  const objectives = section(
    "Learning Goals",
    "🎯",
    [
      config.contentObjective
        ? `<p><strong>Content:</strong> ${bilingual(config.contentObjective, config.contentObjectiveEs)}</p>`
        : "",
      config.languageObjective
        ? `<p><strong>Language:</strong> ${bilingual(config.languageObjective, config.languageObjectiveEs)}</p>`
        : "",
    ].join(""),
  );

  // Notice & Wonder
  const nw = config.noticeAndWonder;
  const noticeWonder = nw
    ? section(
        "Notice & Wonder",
        "👀",
        `${nw.context ? `<p class="context">${esc(nw.context)}</p>` : ""}
         <p><strong>I notice…</strong></p>${workLines(2)}
         <p><strong>I wonder…</strong></p>${workLines(2)}`,
      )
    : "";

  // Vocabulary
  const vocab = (config.vocabulary || []).length
    ? section(
        "Vocabulary",
        "📚",
        `<table class="vocabtbl"><tr><th>Word</th><th>What it means</th><th>Example</th></tr>${config.vocabulary
          .map((v) => {
            const ex = (v.examples || []).find((e) => e && e.text);
            return `<tr><td><strong>${esc(v.term)}</strong>${v.termEs ? `<br><span class="es">${esc(v.termEs)}</span>` : ""}</td><td>${esc(v.definition)}${v.definitionEs ? `<br><span class="es">${esc(v.definitionEs)}</span>` : ""}</td><td>${ex ? esc(ex.text + (ex.why ? " — " + ex.why : "")) : ""}</td></tr>`;
          })
          .join("")}</table>`,
      )
    : "";

  // Turn & Talk
  const tt = (config.turnAndTalk || [])
    .map((t) => {
      const stems = (t.stems || [])
        .map((s) => (typeof s === "string" ? s : s.en || s.text || ""))
        .filter(Boolean);
      const bank = (t.wordBank || []).filter(Boolean);
      return `<div class="item"><p class="qtext">${esc(t.question)}</p>
        ${stems.length ? `<p class="frame">Sentence starters: ${stems.map((s) => esc(s)).join(" · ")}</p>` : ""}
        ${bank.length ? `<p class="hint-line">Word bank: ${bank.map((b) => esc(b)).join(", ")}</p>` : ""}
        ${workLines(2)}</div>`;
    })
    .join("");
  const turnTalk = tt ? section("Turn & Talk", "💬", tt) : "";

  // Launch
  const ci = config.launch?.conceptIntro;
  const launchInner = [
    config.launch?.narrative ? `<p class="context">${esc(config.launch.narrative)}</p>` : "",
    ci?.heading ? `<h3>${esc(ci.heading)}</h3>` : "",
    ci?.intro ? `<p>${esc(ci.intro)}</p>` : "",
    ci?.keyIdea ? `<p class="keyidea"><strong>Key idea:</strong> ${esc(ci.keyIdea)}</p>` : "",
    ...["iDo", "weDo", "youDo"].map((k) => {
      const step = ci?.[k];
      if (!step) return "";
      const lines = (step.lines || []).map((l) => `<li>${esc(l)}</li>`).join("");
      return `<div class="cistep"><p class="cititle">${esc(step.title || k)}</p><ul>${lines}</ul></div>`;
    }),
  ].join("");
  const launch = launchInner ? section("Launch", "🚀", launchInner) : "";

  // Explore
  const ex = config.explore;
  const exploreInner = ex
    ? `${ex.instructions ? `<p class="context">${esc(ex.instructions)}</p>` : ""}${renderItem(ex, null)}${
        ex.discourse?.prompt
          ? `<p class="frame">${esc(ex.discourse.prompt)}${ex.discourse.sentenceFrame ? " — " + esc(ex.discourse.sentenceFrame) : ""}</p>${workLines(2)}`
          : ""
      }`
    : "";
  const explore = exploreInner ? section("Explore", "🔍", exploreInner) : "";

  // Practice (on-level set; fall back to approaching, then any band)
  const p = config.practice || {};
  const band =
    (p.onLevel && p.onLevel.length && p.onLevel) ||
    (p.approaching && p.approaching.length && p.approaching) ||
    (p.extending && p.extending.length && p.extending) ||
    [];
  const practiceInner = band.length ? band.map((it, i) => renderItem(it, i)).join("") : "";
  const practice = practiceInner ? section("Practice", "✏️", practiceInner) : "";

  // Connect
  const cn = config.connect;
  const connectInner = cn
    ? `${cn.scenario ? `<p class="context">${esc(cn.scenario)}</p>` : ""}${
        cn.promptQuestion || cn.prompt
          ? `<p class="qtext">${esc(cn.promptQuestion || cn.prompt)}</p>`
          : ""
      }${
        (cn.keywords || []).length
          ? `<p class="hint-line">Try to use: ${cn.keywords.map((k) => esc(k)).join(", ")}</p>`
          : ""
      }${workLines(4)}`
    : "";
  const connect = connectInner ? section("Connect to the Real World", "🌍", connectInner) : "";

  // Reflect / Exit Ticket
  const et = config.reflect?.exitTicket;
  const reflectInner = et
    ? `<p class="qtext">${esc(et.stem)}</p>${
        (et.choices || []).length ? renderChoices(et.choices) + answerBlank() : workLines(3)
      }`
    : "";
  const reflect = reflectInner ? section("Exit Ticket", "🎟️", reflectInner) : "";

  const title = esc(config.title || "Lesson");
  const meta = `${esc(config.standard || "")} · Unit ${esc(config.unit ?? "")}${config.lesson != null ? " · Lesson " + esc(config.lesson) : ""}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Printable full lesson packet — ${title}">
<title>${title} — Printable Lesson</title>
<style>
  :root { --ink:#1a1a1a; --muted:#555; --rule:#c9c9c9; --accent:#155fa0; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: var(--ink);
    max-width: 820px; margin: 0 auto; padding: 28px 32px; line-height: 1.5; font-size: 12.5pt; }
  h1 { font-size: 21pt; margin: 0 0 2px; }
  h2 { font-size: 14pt; border-bottom: 2px solid var(--accent); padding-bottom: 3px; margin: 0 0 10px; }
  h3 { font-size: 12.5pt; margin: 12px 0 4px; }
  .doc-meta { color: var(--muted); font-size: 10.5pt; margin: 0 0 12px; }
  .idbar { display: flex; gap: 20px; flex-wrap: wrap; border: 1px solid var(--rule);
    border-radius: 8px; padding: 10px 14px; margin: 0 0 18px; font-size: 11pt; }
  .idbar span { flex: 1 1 auto; }
  .idbar .u { display: inline-block; min-width: 120px; border-bottom: 1px solid #999; }
  .lp-section { margin: 0 0 22px; page-break-inside: avoid; }
  .es { color: var(--muted); font-style: italic; font-size: 0.92em; }
  .context { background: #f6f6f2; border-left: 3px solid var(--accent); padding: 8px 12px; margin: 0 0 10px; }
  .keyidea { background: #fff8e6; border: 1px solid #e3c46a; border-radius: 6px; padding: 8px 12px; }
  .item { margin: 0 0 14px; page-break-inside: avoid; }
  .qtext { font-weight: 600; margin: 0 0 6px; }
  .qnum { color: var(--accent); font-weight: 700; }
  .frame { color: var(--muted); font-style: italic; margin: 4px 0; }
  .hint-line { color: var(--muted); font-size: 10.5pt; margin: 4px 0; }
  .choices { list-style: none; margin: 4px 0; padding: 0; }
  .choices li { margin: 3px 0; }
  .choices .ltr { display: inline-block; width: 1.6em; height: 1.6em; line-height: 1.6em;
    text-align: center; border: 1px solid #888; border-radius: 50%; font-weight: 700; margin-right: 6px; }
  .ans { margin: 8px 0 0; }
  .blank { display: inline-block; min-width: 160px; border-bottom: 1.5px solid #333; }
  .work { margin: 6px 0 0; }
  .wl { border-bottom: 1px solid #bbb; height: 1.7em; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 11pt; }
  th, td { border: 1px solid var(--rule); padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f0ec; }
  td.fill, td.mans { background: #fcfcfa; min-width: 90px; }
  .matchtbl td, .balancetbl td { border: none; padding: 4px 6px; }
  .mans { border-bottom: 1.5px solid #333 !important; min-width: 40px; }
  .cistep { margin: 8px 0; }
  .cititle { font-weight: 700; margin: 0 0 2px; color: var(--accent); }
  .cistep ul { margin: 2px 0 0 18px; }
  .wordbank { margin: 6px 0; }
  .chip { display: inline-block; border: 1px solid #888; border-radius: 12px; padding: 2px 10px; margin: 2px; }
  .sortboxes { display: flex; gap: 12px; flex-wrap: wrap; }
  .sortbox { flex: 1 1 200px; min-height: 120px; border: 1px solid #888; border-radius: 6px; }
  .sorthd { background: #f0f0ec; padding: 5px 8px; font-weight: 700; border-bottom: 1px solid #888; }
  .worked { border: 1px solid var(--rule); border-radius: 6px; padding: 6px 10px; margin: 6px 0; }
  .wa-step { display: flex; gap: 10px; padding: 3px 0; border-bottom: 1px dashed #ddd; }
  .wa-lbl { font-weight: 600; min-width: 150px; }
  .numline, .coordgrid { max-width: 100%; margin: 8px 0; }
  .bvs { color: var(--muted); }
  .print-btn { position: fixed; top: 14px; right: 14px; background: var(--accent); color: #fff;
    border: none; border-radius: 8px; padding: 10px 16px; font-size: 11pt; cursor: pointer; font-family: inherit; }
  footer { margin-top: 26px; border-top: 1px solid var(--rule); padding-top: 8px; color: var(--muted); font-size: 10pt; }
  @media print {
    body { padding: 0; max-width: none; font-size: 11.5pt; }
    .print-btn { display: none; }
    .lp-section { page-break-inside: auto; }
  }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  <h1>${title}</h1>
  <p class="doc-meta">${meta}</p>
  <div class="idbar">
    <span>Name: <span class="u"></span></span>
    <span>Class / Period: <span class="u"></span></span>
    <span>Date: <span class="u"></span></span>
  </div>
  ${objectives}
  ${noticeWonder}
  ${vocab}
  ${turnTalk}
  ${launch}
  ${explore}
  ${practice}
  ${connect}
  ${reflect}
  <footer>Neft Teacher · ${esc(id)} · Printable full-lesson packet · Complete every section, then bring it to class.</footer>
  <!-- Anonymous usage beacon. It has to be emitted HERE rather than added by
       tools/inject-usage-signal.mjs: this file is regenerated on every build,
       so an injected tag is silently stripped again on the next \`npm run build\`
       (which is exactly what happened the first time). Generated pages must be
       instrumented by their generator. -->
  <script src="/assets/nt-usage.js" data-nt-usage="1" defer></script>
</body>
</html>`;
}

// ---- Run ------------------------------------------------------------------

const argv = process.argv.slice(2);
const all = readdirSync(lessonsDir).filter(
  (d) => LESSON_DIR_RE.test(d) && existsSync(join(lessonsDir, d, "config.json")),
);
const targets = argv.length ? argv.filter((d) => all.includes(d)) : all;

let n = 0;
for (const id of targets) {
  const config = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
  writeFileSync(join(lessonsDir, id, "printable.html"), buildPrintable(config), "utf8");
  n++;
}
console.log(`✓ generated ${n} printable.html file(s)`);

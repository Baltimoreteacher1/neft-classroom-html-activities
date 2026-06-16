#!/usr/bin/env node
/**
 * generate-worksheets.mjs — print-ready practice worksheets, one per lesson.
 *
 * Each lesson gets lessons/<id>/worksheet.html containing THREE print sections:
 *   • Version A  — built-in support (word bank, worked example, sentence frames,
 *                  extra workspace). Sourced from practice.approaching.
 *   • Version B  — on-level practice. Sourced from practice.onLevel.
 *   • Answer Key — both versions.
 * Labels are intentionally neutral ("Version A" / "Version B") — no level/ESOL
 * wording is shown to students.
 *
 * Source of truth: each lessons/<id>/config.json (practice tiers + vocabulary).
 * Re-run after editing configs:  npm run generate-worksheets
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LESSONS = join(ROOT, "lessons");

/* ---------- helpers ------------------------------------------------------- */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

function lessonDirs() {
  return readdirSync(LESSONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(LESSONS, d.name, "config.json")))
    .map((d) => d.name)
    .sort();
}

function blankLines(n = 3) {
  return `<div class="ws-lines">${'<span class="ws-line"></span>'.repeat(n)}</div>`;
}
function workBox(label = "Show your work") {
  return `<div class="ws-work"><span class="ws-work-label">${esc(label)}</span></div>`;
}

/* ---------- per-problem print renderers ----------------------------------- */
function renderMC(it, n, key) {
  const opts = (it.choices || [])
    .map((c, i) => {
      const correct = key && i === it.correctIndex;
      return `<li class="ws-opt${correct ? " ws-correct" : ""}"><span class="ws-bub">${letters[i]}</span>${esc(c)}</li>`;
    })
    .join("");
  return `<p class="ws-stem">${esc(it.stem)}</p><ol class="ws-opts">${opts}</ol>${
    key && it.explanation ? `<p class="ws-keynote">${esc(it.explanation)}</p>` : ""
  }`;
}

function renderMatching(it, n, key) {
  const pairs = it.pairs || [];
  // One deterministic bank order, shared by the practice sheet and the key, so
  // the answer-key letters line up with what the student sees.
  const bank = shuffle(pairs.map((p) => p.match));
  const terms = pairs
    .map((p) => {
      const letter = letters[bank.indexOf(p.match)] || "";
      return `<li class="ws-match-term"><span class="ws-blank ws-blank-sm">${key ? esc(letter) : ""}</span>${esc(p.term)}</li>`;
    })
    .join("");
  const bankHtml = bank
    .map((m, i) => `<li><span class="ws-bub ws-bub-sm">${letters[i]}</span>${esc(m)}</li>`)
    .join("");
  return `<p class="ws-stem">Write the letter of the matching answer next to each.</p>
  <div class="ws-match"><ol class="ws-match-terms">${terms}</ol><ul class="ws-match-bank">${bankHtml}</ul></div>`;
}

function renderErrorAnalysis(it, n, key) {
  const steps = (it.workedExample || [])
    .map(
      (s, i) =>
        `<li><span class="ws-step-n">${i + 1}</span><span class="ws-step-l">${esc(s.label)}</span><span class="ws-step-w">${esc(s.work)}</span></li>`,
    )
    .join("");
  return `<p class="ws-stem">${esc(it.title || "Find the mistake")}</p>
  <ol class="ws-steps">${steps}</ol>
  <p class="ws-prompt">Which step has the mistake? Explain it and write the correct work.</p>
  ${key ? `<p class="ws-keynote">${esc(it.explanation || it.correction || "See worked solution.")}</p>` : blankLines(3)}`;
}

function renderFillTable(it, n, key) {
  const cols = it.columns || [];
  const head = cols.map((c) => `<th>${esc(c)}</th>`).join("");
  const rows = (it.rows || [])
    .map((r) => {
      const keys = Object.keys(r);
      const cells = keys
        .map((k, i) => {
          // first column is "given"; later columns blank for student (filled in key)
          if (i === 0) return `<td>${esc(r[k])}</td>`;
          return `<td>${key ? esc(r[k]) : ""}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<p class="ws-stem">${esc(it.label || "Complete the table.")}</p>
  <table class="ws-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderOpen(it, n, key, supported) {
  const frame = supported && it.sentenceFrame ? `<p class="ws-frame">${esc(it.sentenceFrame)}</p>` : "";
  return `<p class="ws-stem">${esc(it.prompt)}</p>${frame}${key ? `<p class="ws-keynote">Answers vary — look for correct reasoning.</p>` : blankLines(4)}`;
}

function renderSort(it, n, key) {
  const cats = [...new Set((it.items || []).map((i) => i.category))];
  const items = (it.items || [])
    .map(
      (i) =>
        `<li><span class="ws-blank ws-blank-sm">${key ? esc(i.category) : ""}</span>${esc(i.text)}</li>`,
    )
    .join("");
  return `<p class="ws-stem">${esc(it.instructions || "Sort each item into the correct group.")}</p>
  <p class="ws-prompt">Categories: <b>${cats.map(esc).join(" · ")}</b></p>
  <ul class="ws-sort">${items}</ul>`;
}

function renderGeneric(it, n, key) {
  const stem = it.prompt || it.label || it.stem || it.instructions || "Solve. Show your work.";
  return `<p class="ws-stem">${esc(stem)}</p>${key ? "" : workBox()}`;
}

function renderProblem(it, n, { key = false, supported = false } = {}) {
  if (!it || !it.type) return renderGeneric(it || {}, n, key);
  let body;
  switch (it.type) {
    case "multiple-choice": body = renderMC(it, n, key); break;
    case "matching-game":
    case "matching": body = renderMatching(it, n, key); break;
    case "error-analysis": body = renderErrorAnalysis(it, n, key); break;
    case "fill-table": body = renderFillTable(it, n, key); break;
    case "open-response": body = renderOpen(it, n, key, supported); break;
    case "drag-sort": body = renderSort(it, n, key); break;
    default: body = renderGeneric(it, n, key);
  }
  return `<li class="ws-problem"><span class="ws-pnum">${n}</span><div class="ws-pbody">${body}</div></li>`;
}

/* deterministic shuffle (seedless but stable enough for print bank order) */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (i * 7 + 3) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- version + page builders -------------------------------------- */
function wordBank(vocab = []) {
  if (!vocab.length) return "";
  const chips = vocab
    .slice(0, 8)
    .map((v) => `<span class="ws-bankword">${esc(v.term)}</span>`)
    .join("");
  return `<section class="ws-bank">
    <h3 class="ws-bank-h">📕 Word Bank</h3>
    <div class="ws-bankwords">${chips}</div>
  </section>`;
}

function workedExample(cfg) {
  // Prefer a commonMistake/extending error-analysis as a worked model.
  const pools = [cfg.practice?.extending, cfg.practice?.onLevel, cfg.practice?.optional].filter(Boolean);
  let ex = null;
  for (const pool of pools) {
    ex = pool.find((p) => p.type === "error-analysis" && (p.workedExample || []).length);
    if (ex) break;
  }
  if (!ex) return "";
  const steps = (ex.workedExample || [])
    .map((s) => `<li><b>${esc(s.label)}:</b> ${esc(s.work)}</li>`)
    .join("");
  return `<section class="ws-example">
    <h3 class="ws-example-h">✏️ Worked Example</h3>
    <ol class="ws-example-steps">${steps}</ol>
  </section>`;
}

function pageHeader(cfg, versionLabel, sub) {
  return `<header class="ws-head">
    <div class="ws-head-top">
      <span class="ws-std">${esc(cfg.standard || "")}</span>
      <span class="ws-ver">${esc(versionLabel)}</span>
    </div>
    <h1 class="ws-title">${esc(cfg.title || cfg.lessonId || "Practice")}</h1>
    <p class="ws-sub">${esc(sub)}</p>
    <div class="ws-meta"><span>Name: <span class="ws-fill"></span></span><span>Date: <span class="ws-fill ws-fill-sm"></span></span></div>
  </header>`;
}

function versionPage(cfg, problems, { label, sub, supported, key }) {
  const items = problems
    .map((p, i) => renderProblem(p, i + 1, { supported, key }))
    .join("");
  const scaffolds = supported && !key ? wordBank(cfg.vocabulary) + workedExample(cfg) : "";
  return `<section class="ws-page">
    ${pageHeader(cfg, key ? label + " — Answer Key" : label, sub)}
    ${scaffolds}
    <ol class="ws-problems">${items}</ol>
  </section>`;
}

/* ---------- full document ------------------------------------------------- */
function buildWorksheet(cfg) {
  const A = (cfg.practice?.approaching || []).filter((p) => p && p.type);
  const B = (cfg.practice?.onLevel || []).filter((p) => p && p.type);
  const title = esc(cfg.title || cfg.lessonId);
  const subA = "Practice — Version A";
  const subB = "Practice — Version B";

  const pages = [
    versionPage(cfg, A, { label: "Version A", sub: subA, supported: true, key: false }),
    versionPage(cfg, B, { label: "Version B", sub: subB, supported: false, key: false }),
    versionPage(cfg, A, { label: "Version A", sub: "Answer Key", supported: true, key: true }),
    versionPage(cfg, B, { label: "Version B", sub: "Answer Key", supported: false, key: true }),
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — Practice Worksheet</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
:root{
  --navy:#143a6b; --blue:#1f5fa6; --teal:#1c7a64; --ink:#16243d; --muted:#5a6b82;
  --line:#d7e2ed; --soft:#eef3f9; --bank:#fff8e8; --bank-line:#f0d9a0; --ex:#eaf4ff;
}
*{box-sizing:border-box;}
body{margin:0;background:#e9eef5;color:var(--ink);font-family:"Hanken Grotesk",system-ui,sans-serif;font-size:13.5px;line-height:1.5;}
.ws-page{background:#fff;max-width:760px;margin:18px auto;padding:34px 40px 44px;box-shadow:0 6px 24px rgba(20,40,75,.12);border-radius:6px;}
.ws-head{border-bottom:3px solid var(--navy);padding-bottom:12px;margin-bottom:18px;}
.ws-head-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.ws-std{background:var(--navy);color:#fff;font-weight:700;font-size:11px;letter-spacing:.04em;padding:4px 11px;border-radius:999px;}
.ws-ver{font-family:"Fraunces",serif;font-weight:700;color:var(--blue);font-size:14px;}
.ws-title{font-family:"Fraunces",serif;font-weight:700;font-size:25px;margin:4px 0 2px;color:var(--navy);line-height:1.1;}
.ws-sub{margin:0;color:var(--muted);font-weight:600;font-size:13px;}
.ws-meta{display:flex;gap:28px;margin-top:12px;font-weight:600;color:var(--ink);font-size:13px;}
.ws-fill{display:inline-block;width:220px;border-bottom:1.5px solid var(--ink);}
.ws-fill-sm{width:120px;}
.ws-bank{background:var(--bank);border:1.5px solid var(--bank-line);border-radius:12px;padding:12px 16px;margin:0 0 16px;}
.ws-bank-h,.ws-example-h{font-family:"Fraunces",serif;font-size:14px;margin:0 0 8px;color:var(--navy);}
.ws-bankwords{display:flex;flex-wrap:wrap;gap:8px;}
.ws-bankword{background:#fff;border:1.5px solid var(--bank-line);border-radius:999px;padding:4px 12px;font-weight:700;font-size:12.5px;}
.ws-example{background:var(--ex);border:1.5px solid #cfe2f6;border-radius:12px;padding:12px 16px;margin:0 0 16px;}
.ws-example-steps{margin:0;padding-left:18px;}
.ws-example-steps li{margin:2px 0;}
.ws-problems{list-style:none;margin:0;padding:0;counter-reset:none;}
.ws-problem{display:flex;gap:12px;padding:14px 0;border-bottom:1px dashed var(--line);break-inside:avoid;page-break-inside:avoid;}
.ws-problem:last-child{border-bottom:0;}
.ws-pnum{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:13px;}
.ws-pbody{flex:1;min-width:0;}
.ws-stem{margin:0 0 8px;font-weight:600;}
.ws-prompt{margin:6px 0;color:var(--muted);font-size:12.5px;}
.ws-opts{list-style:none;margin:6px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;}
.ws-opt{display:flex;align-items:flex-start;gap:8px;}
.ws-bub{flex:0 0 auto;width:22px;height:22px;border:2px solid var(--navy);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;}
.ws-bub-sm{width:20px;height:20px;font-size:11px;}
.ws-correct .ws-bub{background:var(--teal);border-color:var(--teal);color:#fff;}
.ws-correct{font-weight:700;color:var(--teal);}
.ws-keynote{margin:6px 0 0;color:var(--teal);font-size:12px;font-style:italic;}
.ws-match{display:flex;gap:24px;flex-wrap:wrap;}
.ws-match-terms{list-style:none;margin:0;padding:0;flex:1;min-width:180px;}
.ws-match-term{display:flex;align-items:center;gap:8px;margin:5px 0;font-weight:600;}
.ws-match-bank{list-style:none;margin:0;padding:10px 12px;background:var(--soft);border:1px solid var(--line);border-radius:10px;flex:1;min-width:180px;}
.ws-match-bank li{display:flex;align-items:center;gap:8px;margin:4px 0;}
.ws-blank{display:inline-block;min-width:54px;border-bottom:1.5px solid var(--ink);text-align:center;font-weight:700;}
.ws-blank-sm{min-width:40px;}
.ws-steps{list-style:none;margin:6px 0;padding:0;}
.ws-steps li{display:flex;gap:10px;align-items:baseline;padding:4px 0;}
.ws-step-n{flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:var(--soft);font-weight:700;font-size:11px;display:inline-flex;align-items:center;justify-content:center;}
.ws-step-l{flex:0 0 38%;font-weight:600;}
.ws-step-w{flex:1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
.ws-table{width:100%;border-collapse:collapse;margin:8px 0;}
.ws-table th{background:var(--navy);color:#fff;font-size:12px;padding:7px 9px;text-align:left;}
.ws-table td{border:1px solid var(--line);padding:9px;height:34px;font-weight:600;}
.ws-lines{margin:8px 0 0;}
.ws-line{display:block;border-bottom:1.5px solid var(--line);height:24px;}
.ws-work{margin:8px 0 0;border:1.5px dashed var(--line);border-radius:10px;min-height:70px;padding:6px 10px;position:relative;}
.ws-work-label{color:var(--muted);font-size:11px;font-weight:600;}
.ws-frame{background:var(--soft);border-left:3px solid var(--blue);padding:6px 10px;margin:6px 0;font-style:italic;color:var(--muted);border-radius:0 8px 8px 0;}
.ws-sort{list-style:none;margin:6px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:5px 18px;}
.ws-sort li{display:flex;align-items:center;gap:8px;font-weight:600;}

@media print{
  body{background:#fff;font-size:12pt;}
  .ws-page{box-shadow:none;border-radius:0;margin:0;max-width:none;padding:0;page-break-after:always;}
  .ws-page:last-child{page-break-after:auto;}
  @page{margin:1.5cm;}
  a{color:#000;}
}
</style>
</head>
<body>
${pages}
</body>
</html>`;
}

/* ---------- main ---------------------------------------------------------- */
function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const dirs = lessonDirs().filter((d) => (only.length ? only.includes(d) : true));
  let written = 0,
    skipped = 0;
  for (const d of dirs) {
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(join(LESSONS, d, "config.json"), "utf8"));
    } catch {
      skipped++;
      continue;
    }
    const hasA = (cfg.practice?.approaching || []).some((p) => p && p.type);
    const hasB = (cfg.practice?.onLevel || []).some((p) => p && p.type);
    if (!hasA || !hasB) {
      skipped++;
      continue;
    }
    writeFileSync(join(LESSONS, d, "worksheet.html"), buildWorksheet(cfg));
    written++;
  }
  console.log(`Worksheets generated: ${written}  (skipped ${skipped})`);
}

main();

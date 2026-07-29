#!/usr/bin/env node
/**
 * generate-worksheets.mjs — print-ready practice worksheets, one per lesson.
 *
 * Each lesson gets lessons/<id>/worksheet.html with up to FOUR practice pages
 * (gated on each pool being non-empty) plus a matching Answer Key per page:
 *   • Level 0    — most-supported (3-4 gentlest items, word bank + worked
 *                  example + sentence frames on every problem). From the easiest
 *                  slice of practice.approaching with an extra-scaffold banner.
 *   • Version A  — built-in support (word bank, worked example, sentence frames).
 *                  Sourced from practice.approaching.
 *   • Version B  — on-level practice. Sourced from practice.onLevel.
 *   • Challenge  — enrichment. Sourced from practice.extending.
 * This mirrors the repo-wide L0 < L1 < L2 tiering. Labels are intentionally
 * neutral ("Level 0 / Version A / Version B / Challenge") — no IEP/ESOL wording
 * is shown to students.
 *
 * Answer keys are misconception-aware: multiple-choice keys append a "Watch for"
 * cue from the item's watchFor/distractorRationale or the lesson's shared
 * practice.commonMistake; open-response keys surface sampleAnswer + keywords;
 * error-analysis keys use the canonical errorStep + correctWork + explanation
 * schema (see ERROR_ANALYSIS_SCHEMA below).
 *
 * Source of truth: each lessons/<id>/config.json (practice tiers + vocabulary).
 * Re-run after editing configs:  npm run generate-worksheets
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LESSONS = join(ROOT, "lessons");

/**
 * ERROR_ANALYSIS_SCHEMA — canonical config shape for `type: "error-analysis"`
 * practice items, shared by generate-worksheets.mjs, generate-homework.mjs, and
 * generate-homework-html.mjs so the same config produces consistent keys:
 *   {
 *     type: "error-analysis",
 *     title: string,                 // student-facing prompt heading
 *     workedExample: [{ label, work }],
 *     errorStep: number,             // 0-based index into workedExample (the wrong step)
 *     correctWork: string,           // the corrected calculation / fix
 *     explanation?: string           // optional: WHY the step is wrong (misconception)
 *   }
 * Legacy fields `correction`/`it.explanation`-as-fix are NOT read anymore.
 */

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
function renderMC(it, _n, key, commonMistake) {
  const opts = (it.choices || [])
    .map((c, i) => {
      const correct = key && i === it.correctIndex;
      return `<li class="ws-opt${correct ? " ws-correct" : ""}"><span class="ws-bub">${letters[i]}</span>${esc(c)}</li>`;
    })
    .join("");
  let notes = "";
  if (key) {
    if (it.explanation) notes += `<p class="ws-keynote">${esc(it.explanation)}</p>`;
    // Misconception-aware teacher cue: prefer an item-level watch-for, else the
    // lesson's shared commonMistake. Distinct styling so it reads as a warning.
    const watch = it.watchFor || it.distractorRationale || commonMistake;
    if (watch) notes += `<p class="ws-watch"><b>Watch for:</b> ${esc(watch)}</p>`;
  }
  return `<p class="ws-stem">${esc(it.stem)}</p><ol class="ws-opts">${opts}</ol>${notes}`;
}

function renderMatching(it, _n, key) {
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

function renderErrorAnalysis(it, _n, key) {
  const steps = (it.workedExample || [])
    .map(
      (s, i) =>
        `<li><span class="ws-step-n">${i + 1}</span><span class="ws-step-l">${esc(s.label)}</span><span class="ws-step-w">${esc(s.work)}</span></li>`,
    )
    .join("");
  // Canonical error-analysis schema (see ERROR_ANALYSIS_SCHEMA): errorStep
  // (0-based index of the wrong step) + correctWork (the fix) + explanation
  // (why it's wrong). Build a misconception-aware key from those fields.
  let keyHtml = "";
  if (key) {
    const parts = [];
    if (typeof it.errorStep === "number") parts.push(`The mistake is in Step ${it.errorStep + 1}.`);
    if (it.correctWork) parts.push(`Correct work: ${it.correctWork}`);
    if (it.explanation) parts.push(it.explanation);
    keyHtml = `<p class="ws-keynote">${esc(parts.join(" ") || "See worked solution.")}</p>`;
  }
  return `<p class="ws-stem">${esc(it.title || "Find the mistake")}</p>
  <ol class="ws-steps">${steps}</ol>
  <p class="ws-prompt">Which step has the mistake? Explain it and write the correct work.</p>
  ${key ? keyHtml : blankLines(3)}`;
}

function renderFillTable(it, _n, key) {
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

function renderOpen(it, _n, key, supported) {
  const frame =
    supported && it.sentenceFrame ? `<p class="ws-frame">${esc(it.sentenceFrame)}</p>` : "";
  let keyHtml = "";
  if (key) {
    // Actionable rubric instead of a generic "answers vary": surface a sample
    // answer and the look-for keywords the teacher should check against.
    const parts = [];
    if (it.sampleAnswer) parts.push(`Sample: ${it.sampleAnswer}`);
    if (Array.isArray(it.keywords) && it.keywords.length)
      parts.push(`Look for: ${it.keywords.join(", ")}.`);
    keyHtml = parts.length
      ? `<p class="ws-keynote">${esc(parts.join(" "))}</p>`
      : `<p class="ws-keynote">Answers vary — look for correct reasoning.</p>`;
  }
  return `<p class="ws-stem">${esc(it.prompt)}</p>${frame}${key ? keyHtml : blankLines(4)}`;
}

function renderSort(it, _n, key) {
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

function renderGeneric(it, _n, key) {
  const stem = it.prompt || it.label || it.stem || it.instructions || "Solve. Show your work.";
  return `<p class="ws-stem">${esc(stem)}</p>${key ? "" : workBox()}`;
}

function renderProblem(it, n, { key = false, supported = false, commonMistake = "" } = {}) {
  if (!it || !it.type) return renderGeneric(it || {}, n, key);
  let body;
  switch (it.type) {
    case "multiple-choice":
      body = renderMC(it, n, key, commonMistake);
      break;
    case "matching-game":
    case "matching":
      body = renderMatching(it, n, key);
      break;
    case "error-analysis":
      body = renderErrorAnalysis(it, n, key);
      break;
    case "fill-table":
      body = renderFillTable(it, n, key);
      break;
    case "open-response":
      body = renderOpen(it, n, key, supported);
      break;
    case "drag-sort":
      body = renderSort(it, n, key);
      break;
    default:
      body = renderGeneric(it, n, key);
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
    <h2 class="ws-bank-h">📕 Word Bank</h2>
    <div class="ws-bankwords">${chips}</div>
  </section>`;
}

function workedExample(cfg) {
  // Prefer a commonMistake/extending error-analysis as a worked model.
  const pools = [cfg.practice?.extending, cfg.practice?.onLevel, cfg.practice?.optional].filter(
    Boolean,
  );
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
    <h2 class="ws-example-h">✏️ Worked Example</h2>
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

function versionPage(cfg, problems, { label, sub, supported, key, extraScaffold }) {
  const commonMistake = key ? cfg.practice?.commonMistake || "" : "";
  const items = problems
    .map((p, i) => renderProblem(p, i + 1, { supported, key, commonMistake }))
    .join("");
  const scaffolds = supported && !key ? wordBank(cfg.vocabulary) + workedExample(cfg) : "";
  // Level 0 (most-supported) page leads with an extra-scaffold banner so the
  // teacher knows every item is paired with a word bank, worked model, and
  // sentence frames.
  const banner =
    extraScaffold && !key
      ? `<p class="ws-scaffold-note">🧩 Extra support: use the word bank and the worked example. A sentence starter is given under each problem.</p>`
      : "";
  return `<section class="ws-page">
    ${pageHeader(cfg, key ? label + " — Answer Key" : label, sub)}
    ${scaffolds}
    ${banner}
    <ol class="ws-problems">${items}</ol>
  </section>`;
}

/* ---------- full document ------------------------------------------------- */
function buildWorksheet(cfg) {
  const printable = (pool) => (pool || []).filter((p) => p && p.type);
  const approaching = printable(cfg.practice?.approaching);
  const onLevel = printable(cfg.practice?.onLevel);
  const extending = printable(cfg.practice?.extending);
  // Level 0 (most-supported): the 3-4 gentlest approaching items, every one
  // paired with word bank + worked example + sentence frames. Drawn from
  // approaching so it stays the easiest tier (L0 < L1 < L2).
  const levelZero = approaching.slice(0, 4);
  const title = esc(cfg.title || cfg.lessonId);

  // One page definition per tier. Each is gated on its own pool being
  // non-empty, so a lesson with only some tiers still produces a valid sheet
  // instead of being skipped wholesale.
  const tiers = [
    {
      pool: levelZero,
      label: "Level 0",
      sub: "Practice — Level 0",
      supported: true,
      extraScaffold: true,
    },
    { pool: approaching, label: "Version A", sub: "Practice — Version A", supported: true },
    { pool: onLevel, label: "Version B", sub: "Practice — Version B", supported: false },
    { pool: extending, label: "Challenge", sub: "Practice — Challenge", supported: false },
  ].filter((t) => t.pool.length);

  const practicePages = tiers.map((t) => versionPage(cfg, t.pool, { ...t, key: false }));
  const keyPages = tiers.map((t) =>
    versionPage(cfg, t.pool, { ...t, sub: "Answer Key", key: true }),
  );
  const pages = [...practicePages, ...keyPages].join("\n");

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
.ws-watch{margin:4px 0 0;color:#9a4a12;font-size:12px;background:#fff3e6;border-left:3px solid #e08a3c;padding:5px 10px;border-radius:0 8px 8px 0;}
.ws-scaffold-note{margin:0 0 14px;background:var(--soft);border:1.5px solid var(--line);border-radius:10px;padding:8px 12px;font-weight:600;color:var(--navy);font-size:12.5px;}
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
${EDITORIAL_OVERRIDES}
</style>
</head>
<body>
<main>
${pages}
</main>
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
    // Emit a worksheet if ANY practice tier has printable problems — each page
    // is gated independently inside buildWorksheet, so a lesson with only one
    // populated tier still gets a usable (single-version) sheet.
    const hasAny = ["approaching", "onLevel", "extending"].some((tier) =>
      (cfg.practice?.[tier] || []).some((p) => p && p.type),
    );
    if (!hasAny) {
      skipped++;
      continue;
    }
    writeFileSync(join(LESSONS, d, "worksheet.html"), buildWorksheet(cfg));
    written++;
  }
  console.log(`Worksheets generated: ${written}  (skipped ${skipped})`);
}

main();

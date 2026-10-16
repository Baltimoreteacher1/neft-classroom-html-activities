#!/usr/bin/env node
/**
 * Native-review sheet for the Spanish this site has written but nobody fluent has read.
 *
 *   node scripts/spanish-review-sheet.mjs                    summary of the queue
 *   node scripts/spanish-review-sheet.mjs --sync             rebuild data/spanish-review-queue.json from the sources
 *   node scripts/spanish-review-sheet.mjs --out FILE.html    printable sheet (pending entries; --all for every entry)
 *   node scripts/spanish-review-sheet.mjs --csv FILE.csv     same rows as a spreadsheet a reviewer can fill in
 *   node scripts/spanish-review-sheet.mjs --import FILE.csv  record the reviewer's decisions in the queue
 *
 * The reviewer reads English and Spanish side by side and, per row, writes "approve" or
 * "change" (with a corrected Spanish) in the decision columns. `--import` records the
 * decisions; it never edits the Spanish in the source files, so a person applies each
 * accepted change where the string lives (the queue's `file` and `key` say where).
 * A decision is kept only while the English and Spanish it was made on are unchanged.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NEW_STATUS,
  QUEUE_FILE,
  queueFileText,
  STATUSES,
  syncQueue,
} from "./lib/spanish-review-queue.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** The group a row sits under in the sheet: a lab, or a lesson's practice feedback. */
export function groupOf(entry) {
  if (entry.file.endsWith("lab-strings-es.js")) return `Lab: ${entry.key.split(".")[0]}`;
  const id = entry.key.split(".")[0];
  return `Apply Day feedback: lesson ${id.replace(/-s2-\d+$/, "")}`;
}

export function renderSheetHtml(
  entries,
  { generated = new Date().toISOString().slice(0, 10) } = {},
) {
  const groups = new Map();
  for (const entry of entries) {
    const g = groupOf(entry);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(entry);
  }
  const sections = [...groups]
    .map(
      ([name, rows]) => `<section>
<h2>${esc(name)} <small>${rows.length} string${rows.length === 1 ? "" : "s"}</small></h2>
<table>
<thead><tr><th scope="col" class="n">#</th><th scope="col">English</th><th scope="col">Español</th><th scope="col" class="mark">OK</th><th scope="col" class="fix">Change it to…</th></tr></thead>
<tbody>
${rows
  .map(
    (r, i) =>
      `<tr><td class="n">${i + 1}</td><td lang="en">${esc(r.en)}<div class="key">${esc(r.key)}</div></td><td lang="es">${esc(r.es)}</td><td class="mark"><span aria-hidden="true">☐</span></td><td class="fix"></td></tr>`,
  )
  .join("\n")}
</tbody>
</table>
</section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spanish review sheet</title>
<style>
:root{--ink:#17324d;--line:#c9d6e2;--soft:#eef4f9;--warn:#fff4d6}
*{box-sizing:border-box}
body{margin:0;padding:24px;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:#fff}
main{max-width:1000px;margin:0 auto}
h1{font-size:1.6rem;margin:0 0 8px}
h2{font-size:1.15rem;margin:28px 0 8px;break-after:avoid}
h2 small{font-weight:400;color:#51657a;margin-left:8px}
.notice{background:var(--warn);border:1px solid #e3c875;border-radius:10px;padding:12px 16px;margin:12px 0}
ol{padding-left:22px}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th,td{border:1px solid var(--line);padding:8px 10px;vertical-align:top;text-align:left;word-wrap:break-word}
th{background:var(--soft);font-size:.85rem}
th.n,td.n{width:40px;color:#51657a}
td.mark,th.mark{width:48px;text-align:center}
td.fix,th.fix{width:24%}
.key{margin-top:4px;font:12px ui-monospace,Menlo,monospace;color:#6a7d90}
tr{break-inside:avoid}
@media print{body{padding:0}.notice{border-color:#999;background:#fff}h2{margin-top:18px}}
</style>
</head>
<body>
<main>
<h1>Spanish review sheet <span lang="es">· Hoja de revisión</span></h1>
<p>Generated ${esc(generated)} · ${entries.length} string${entries.length === 1 ? "" : "s"} to read.</p>
<div class="notice"><strong>Where this Spanish came from.</strong> It was written by an AI assistant for Mr. Neft's family-practice pages. A native Spanish speaker has not read it yet. Nothing here is certified; this sheet is how it gets checked.</div>
<h2>How to review</h2>
<ol>
<li>Read each English line, then the Spanish next to it. Ask: would a parent in Baltimore understand this on first read, and does it say the same math?</li>
<li>If it is right, tick OK. If a word is stiff, too formal, or wrong for the math, write the better Spanish in the last column.</li>
<li>Look for: <em>tú</em> (not <em>usted</em>) throughout, the math words families already see (<span lang="es">razón, tasa unitaria, porcentaje, mediana</span>), and lines that sound translated word for word.</li>
<li>Words in {braces}, like {a} or {total}, are filled in by the page. Keep them as they are, anywhere in the sentence that sounds natural.</li>
</ol>
${sections}
</main>
</body>
</html>
`;
}

const CSV_HEADER = [
  "file",
  "key",
  "english",
  "spanish",
  "status",
  "decision (approve|change)",
  "corrected_spanish",
  "reviewer",
  "note",
];

const csvCell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;

export function renderSheetCsv(entries) {
  const rows = entries.map((e) =>
    [e.file, e.key, e.en, e.es, e.status, "", "", e.reviewer ?? "", e.note ?? ""]
      .map(csvCell)
      .join(","),
  );
  return `${[CSV_HEADER.map(csvCell).join(","), ...rows].join("\r\n")}\r\n`;
}

/** RFC 4180 parser: quoted fields may hold commas, quotes ("") and newlines. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

/**
 * Records a reviewer's decisions. A row is applied only if the Spanish on the
 * sheet still matches the queue, so a decision about old wording cannot land
 * on new wording. Returns { entries, applied, stale, skipped }.
 */
export function applyDecisions(entries, csvText) {
  const [header, ...rows] = parseCsv(csvText);
  const col = (name) => header.findIndex((h) => h.startsWith(name));
  const idx = {
    file: col("file"),
    key: col("key"),
    spanish: col("spanish"),
    decision: col("decision"),
    corrected: col("corrected_spanish"),
    reviewer: col("reviewer"),
    note: col("note"),
  };
  for (const [name, i] of Object.entries(idx)) {
    if (i < 0) throw new Error(`CSV is missing the "${name}" column`);
  }
  const byId = new Map(entries.map((e) => [`${e.file}\u0000${e.key}`, e]));
  let applied = 0;
  let stale = 0;
  let skipped = 0;
  for (const r of rows) {
    const decision = r[idx.decision].trim().toLowerCase();
    if (!decision) {
      skipped += 1;
      continue;
    }
    const entry = byId.get(`${r[idx.file]}\u0000${r[idx.key]}`);
    if (!entry || entry.es !== r[idx.spanish]) {
      stale += 1;
      continue;
    }
    if (decision !== "approve" && decision !== "change") {
      throw new Error(
        `Row ${r[idx.key]}: decision must be "approve" or "change", got "${decision}"`,
      );
    }
    if (decision === "change" && !r[idx.corrected].trim()) {
      throw new Error(`Row ${r[idx.key]}: "change" needs corrected_spanish`);
    }
    entry.status = decision === "approve" ? "approved" : "changes-requested";
    entry.reviewer = r[idx.reviewer].trim() || undefined;
    entry.note = r[idx.note].trim() || undefined;
    if (decision === "change") entry.suggestedEs = r[idx.corrected].trim();
    else delete entry.suggestedEs;
    applied += 1;
  }
  return { entries, applied, stale, skipped };
}

function main(argv) {
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const queuePath = join(ROOT, QUEUE_FILE);
  let entries = syncQueue(ROOT);
  if (argv.includes("--sync")) {
    writeFileSync(queuePath, queueFileText(entries));
    console.log(`Wrote ${QUEUE_FILE}: ${entries.length} entries.`);
  } else {
    if (!existsSync(queuePath)) {
      console.error(`${QUEUE_FILE} does not exist yet. Run with --sync first.`);
      process.exit(1);
    }
    entries = JSON.parse(readFileSync(queuePath, "utf8")).entries ?? [];
  }
  const importPath = flag("--import");
  if (importPath) {
    const result = applyDecisions(entries, readFileSync(importPath, "utf8"));
    writeFileSync(queuePath, queueFileText(result.entries));
    console.log(
      `Imported ${importPath}: ${result.applied} decisions recorded, ${result.stale} rows out of date, ${result.skipped} left blank.`,
    );
    entries = result.entries;
  }
  const shown = argv.includes("--all") ? entries : entries.filter((e) => e.status === NEW_STATUS);
  for (const [flagName, render] of [
    ["--out", (rows) => renderSheetHtml(rows)],
    ["--csv", renderSheetCsv],
  ]) {
    const target = flag(flagName);
    if (!target) continue;
    mkdirSync(dirname(resolve(target)), { recursive: true });
    writeFileSync(target, render(shown));
    console.log(`Wrote ${target}: ${shown.length} rows.`);
  }
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, entries.filter((e) => e.status === s).length]),
  );
  console.log(`Queue: ${entries.length} strings`, counts);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}

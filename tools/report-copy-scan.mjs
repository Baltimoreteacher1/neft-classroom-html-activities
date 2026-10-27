#!/usr/bin/env node
/* report-copy-scan — READ-ONLY census of math notation and microcopy across the
 * 84 core lesson configs and the engine strings. Writes nothing.
 *
 *   node tools/report-copy-scan.mjs                       counts by detector
 *   node tools/report-copy-scan.mjs --rule minus-spaced --samples 20
 *   node tools/report-copy-scan.mjs --format             also count what the render-time
 *                                                         formatter leaves behind
 *   node tools/report-copy-scan.mjs --json               machine-readable totals
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { typesetPlain } from "@eduwonderlab/engine/core/math-typography.js";
import {
  collectTexts,
  extractStrings,
  fleschKincaid,
  INSTRUCTION_KINDS,
  isEngineGenericFeedback,
  loadCoreConfigs,
  plain,
  scanInfo,
  scanMicrocopy,
  scanNotation,
  TERM_GROUPS,
  titleCaseButtons,
} from "./lib/copy-scan.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i < 0 ? d : args[i + 1];
};
const ruleFilter = opt("rule", null);
const nSamples = Number(opt("samples", 0));
const asJson = args.includes("--json");
const afterFormat = args.includes("--format");

const counts = {};
const samples = {};
const bump = (rule, lang, rec) => {
  counts[rule] ||= { en: 0, es: 0, files: new Set() };
  counts[rule][lang]++;
  counts[rule].files.add(rec.file);
  (samples[rule] ||= []).push(rec);
};

let scanned = 0;
const configs = loadCoreConfigs(ROOT);
const termCounts = {};
const fkOver = [];
let fkTotal = 0;
for (const { file, cfg } of configs) {
  for (const t of collectTexts(cfg)) {
    scanned++;
    const rec = (extra) => ({ file, path: t.path, text: plain(t.text), ...extra });
    const source = afterFormat ? typesetPlain(t.text) : t.text;
    for (const h of scanNotation(source, t.lang)) {
      const p = plain(source);
      bump(
        h.rule,
        t.lang,
        rec({
          ctx: p.slice(Math.max(0, h.index - 30), h.index + h.match.length + 30),
          match: h.match,
        }),
      );
    }
    for (const h of scanInfo(t.text)) bump(h.rule, t.lang, rec({ ctx: h.match, match: h.match }));
    for (const h of scanMicrocopy(t.text, t))
      bump(h.rule, t.lang, rec({ ctx: h.match, match: h.match }));
    if (t.lang === "en") {
      for (const g of TERM_GROUPS) {
        termCounts[g.concept] ||= { preferred: 0, variants: {} };
        if (new RegExp(`\\b${g.preferred}\\b`, "i").test(t.text)) termCounts[g.concept].preferred++;
        for (const v of g.variants) {
          const m = plain(t.text).match(v);
          if (m)
            termCounts[g.concept].variants[m[0].toLowerCase()] =
              (termCounts[g.concept].variants[m[0].toLowerCase()] || 0) + 1;
        }
      }
      if (INSTRUCTION_KINDS.has(t.kind) && plain(t.text).split(/\s+/).length >= 6) {
        fkTotal++;
        const g = fleschKincaid(t.text);
        if (g > 5)
          fkOver.push({ file, path: t.path, grade: Math.round(g * 10) / 10, text: plain(t.text) });
      }
    }
  }
}

// engine strings
const engineHits = [];
const buttonHits = [];
const walk = (dir) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.js$/.test(n) && !/\.test\./.test(n) && n !== "copy-dictionary.js") {
      const src = readFileSync(p, "utf8");
      for (const s of extractStrings(src)) {
        if (isEngineGenericFeedback(s.text))
          engineHits.push({ file: relative(ROOT, p), line: s.line, text: s.text });
      }
      for (const b of titleCaseButtons(src)) buttonHits.push({ file: relative(ROOT, p), ...b });
    }
  }
};
walk(join(ROOT, "engine"));

if (asJson) {
  console.log(
    JSON.stringify(
      {
        scanned,
        counts: Object.fromEntries(
          Object.entries(counts).map(([k, v]) => [k, { en: v.en, es: v.es, files: v.files.size }]),
        ),
        engineGeneric: engineHits.length,
        engineTitleCaseButtons: buttonHits.length,
        fkOver: fkOver.length,
        fkTotal,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log(
  `strings scanned: ${scanned} across ${configs.length} core configs${afterFormat ? " (after render-time formatter)" : ""}`,
);
console.log("\nDETECTOR                      EN     ES   files");
for (const [k, v] of Object.entries(counts).sort())
  console.log(
    `${k.padEnd(28)} ${String(v.en).padStart(5)} ${String(v.es).padStart(6)} ${String(v.files.size).padStart(6)}`,
  );
console.log(`\nengine strings that say "wrong" without what to try: ${engineHits.length}`);
console.log(`engine title-case button labels: ${buttonHits.length}`);
console.log(`instruction strings (>=6 words) above grade 5: ${fkOver.length} of ${fkTotal}`);
console.log("\nTERM VARIANTS");
for (const [c, v] of Object.entries(termCounts)) {
  const vs = Object.entries(v.variants);
  if (vs.length)
    console.log(
      `  ${c}: preferred x${v.preferred}; variants ${vs.map(([a, b]) => `${a} x${b}`).join(", ")}`,
    );
}
if (ruleFilter) {
  const list = samples[ruleFilter] || [];
  const step = Math.max(1, Math.floor(list.length / (nSamples || 20)));
  console.log(`\nSAMPLES for ${ruleFilter} (${list.length})`);
  for (let i = 0, n = 0; i < list.length && n < (nSamples || 20); i += step, n++) {
    const s = list[i];
    console.log(`- ${s.file}${s.path}: ...${s.ctx.replace(/\n/g, " ")}...  [${s.match}]`);
  }
}
if (args.includes("--engine")) {
  for (const e of engineHits) console.log(`${e.file}:${e.line}  ${e.text}`);
  for (const e of buttonHits) console.log(`${e.file}:${e.line}  [button] ${e.text}`);
}
if (args.includes("--fk"))
  for (const e of fkOver.slice(0, Number(opt("samples", 20))))
    console.log(`${e.grade} ${e.file}${e.path}  ${e.text.slice(0, 120)}`);

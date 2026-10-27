#!/usr/bin/env node
// Family Math 2.0 traceability: requirement -> implementation -> test -> result -> production.
//
// Definitions live in docs/family-math-2-requirements.json. Implementation and test links are NOT typed by hand:
// a source or test file declares what it serves with a `@fm2 FM-007 FM-019` tag, and this script finds the tags.
// Results come from docs/family-math-2-results.json (written by tools/fm2/run-all.mjs). A requirement is
// Verified only when every kind of evidence it needs has a PASSING file behind it.
//
//   node tools/fm2/trace.mjs            print the summary, exit 1 on a traceability defect
//   node tools/fm2/trace.mjs --write    also regenerate docs/family-math-2-requirements.md and the progress summary
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname;
const DEFS = join(ROOT, "docs/family-math-2-requirements.json");
const RESULTS = join(ROOT, "docs/family-math-2-results.json");
const LEDGER = join(ROOT, "docs/family-math-2-requirements.md");
const PROGRESS = join(ROOT, "docs/family-math-2-progress.md");
const SCAN = ["math/fluency-lab/family", "tools/fm2", "tests"];
const TAG = /@fm2\s+((?:FM-\d{3}[\s,]*)+)/g;

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(m?js|cjs|css|html|ts)$/.test(name)) out.push(path);
  }
  return out;
};

export function kindOf(file) {
  if (/^tools\/fm2\/(?:.*\/)?[^/]*\.test\.mjs$/.test(file)) return "unit";
  if (
    /^tools\/fm2\/(?:.*\/)?(?:accept|e2e|browser)-[^/]*\.mjs$/.test(file) ||
    /^tests\/fm2-[^/]*\.spec\.ts$/.test(file)
  )
    return "browser";
  if (file.startsWith("math/fluency-lab/family/")) return "code";
  return null;
}

export function collect() {
  const refs = new Map();
  for (const dir of SCAN) {
    for (const abs of walk(join(ROOT, dir))) {
      const file = relative(ROOT, abs);
      const kind = kindOf(file);
      if (!kind) continue;
      for (const match of readFileSync(abs, "utf8").matchAll(TAG)) {
        for (const id of match[1].match(/FM-\d{3}/g)) {
          if (!refs.has(id)) refs.set(id, { code: new Set(), unit: new Set(), browser: new Set() });
          refs.get(id)[kind].add(file);
        }
      }
    }
  }
  return refs;
}

export function evaluate() {
  const defs = JSON.parse(readFileSync(DEFS, "utf8")).requirements;
  const results = existsSync(RESULTS) ? JSON.parse(readFileSync(RESULTS, "utf8")) : { results: {} };
  const refs = collect();
  const known = new Set(defs.map((d) => d.id));
  const defects = [...refs.keys()]
    .filter((id) => !known.has(id))
    .map((id) => `tag ${id} has no requirement definition`);
  const rows = defs.map((def) => {
    const ref = refs.get(def.id) || { code: new Set(), unit: new Set(), browser: new Set() };
    const passed = (files) => [...files].filter((f) => results.results[f]?.pass === true);
    const failed = (files) => [...files].filter((f) => results.results[f]?.pass === false);
    const unitPass = passed(ref.unit);
    const browserPass = passed(ref.browser);
    const anyFail = [...failed(ref.unit), ...failed(ref.browser)];
    const manual = def.manual || {};
    const needs = def.needs;
    const met = {
      u: !needs.includes("u") || unitPass.length > 0,
      b: !needs.includes("b") || browserPass.length > 0,
      p: !needs.includes("p") || manual.status === "Verified",
      d: !needs.includes("d") || manual.production === "Verified",
    };
    const wantsCode = needs.includes("u") || needs.includes("b");
    let status;
    if (manual.status === "Blocked") status = "Blocked";
    else if (anyFail.length) status = "Failed";
    else if (met.u && met.b && met.p && met.d && (!wantsCode || ref.code.size > 0))
      status = "Verified";
    else if (ref.code.size && (unitPass.length || browserPass.length)) status = "Implemented";
    else if (ref.code.size || ref.unit.size || ref.browser.size || manual.status === "In progress")
      status = "In progress";
    else status = "Not started";
    const untested =
      wantsCode &&
      status !== "Blocked" &&
      ((needs.includes("u") && !ref.unit.size) || (needs.includes("b") && !ref.browser.size));
    if (status === "Verified" && wantsCode && !ref.code.size)
      defects.push(`${def.id} verified without implementing code`);
    return {
      ...def,
      status,
      code: [...ref.code],
      unit: [...ref.unit],
      browser: [...ref.browser],
      unitPass,
      browserPass,
      untested,
      production: manual.production === "Verified" ? "Verified" : "Not verified",
    };
  });
  return { rows, defects, sha: results.sha || null, ranAt: results.ranAt || null };
}

export function summarize(rows) {
  const count = (fn) => rows.filter(fn).length;
  const total = rows.length;
  const verified = count((r) => r.status === "Verified");
  return {
    total,
    implemented: count((r) => r.status === "Implemented" || r.status === "Verified"),
    verified,
    inProgress: count((r) => r.status === "In progress"),
    notStarted: count((r) => r.status === "Not started"),
    blocked: count((r) => r.status === "Blocked"),
    failed: count((r) => r.status === "Failed"),
    untested: count((r) => r.untested),
    productionVerified: count((r) => r.production === "Verified"),
    verifiedPercent: Math.round((verified / total) * 1000) / 10,
  };
}

const cell = (value) =>
  String(value || "")
    .replaceAll("|", "/")
    .replaceAll("\n", " ");
const files = (list) => list.map((f) => `\`${f}\``).join("<br>") || "none";

function ledger(rows, summary, meta) {
  const head =
    "| ID | Requirement | Source | Status | Code location | Tests | Browser evidence | Content evidence | Production | Notes |\n|---|---|---|---|---|---|---|---|---|---|";
  const body = rows.map((r) => {
    const unit = r.unit.map((f) => `${f}${r.unitPass.includes(f) ? " (pass)" : ""}`);
    const browser = r.browser.map((f) => `${f}${r.browserPass.includes(f) ? " (pass)" : ""}`);
    const content = r.manual?.content || (r.needs.includes("u") ? "See unit/math suites" : "n/a");
    const notes = [
      r.manual?.evidence,
      r.notes,
      r.untested ? "UNTESTED: no test references this requirement" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `| ${r.id} | ${cell(r.requirement)} | ${r.source} | ${r.status} | ${files(r.code)} | ${files(unit)} | ${files(browser)} | ${cell(content)} | ${r.production} | ${cell(notes)} |`;
  });
  return `# Family Math 2.0 requirements ledger

Generated by \`node tools/fm2/trace.mjs --write\`. Do not edit the table by hand: definitions live in
\`docs/family-math-2-requirements.json\`, links come from \`@fm2 FM-xxx\` tags in source and test files, results come
from \`docs/family-math-2-results.json\` (revision ${meta.sha || "none yet"}, run ${meta.ranAt || "never"}).

Status rules: **Verified** only when every needed kind of evidence has a passing file (unit and math suites, browser
suites, or recorded process evidence). **Implemented** has code and some passing tests but not all needed evidence.
Failed requirements stay in the table. The verified percentage uses all ${summary.total} requirements as its denominator.

${summaryText(summary)}

${head}
${body.join("\n")}
`;
}

export const summaryText = (s) =>
  `**Total ${s.total} · Implemented (incl. verified) ${s.implemented} · Verified ${s.verified} · In progress ${s.inProgress} · Not started ${s.notStarted} · Blocked ${s.blocked} · Failed ${s.failed} · Untested ${s.untested} · Production verified ${s.productionVerified} · Verified ${s.verifiedPercent}%**`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const { rows, defects, sha, ranAt } = evaluate();
  const summary = summarize(rows);
  console.log(summaryText(summary));
  for (const row of rows.filter((r) => r.status === "Failed"))
    console.log(`FAILED ${row.id}: ${row.requirement}`);
  for (const defect of defects) console.log(`DEFECT ${defect}`);
  if (process.argv.includes("--write")) {
    writeFileSync(LEDGER, ledger(rows, summary, { sha, ranAt }));
    if (existsSync(PROGRESS)) {
      const text = readFileSync(PROGRESS, "utf8");
      const block = `<!-- fm2-summary:begin -->\n${summaryText(summary)}\n<!-- fm2-summary:end -->`;
      writeFileSync(
        PROGRESS,
        text.includes("<!-- fm2-summary:begin -->")
          ? text.replace(/<!-- fm2-summary:begin -->[\s\S]*<!-- fm2-summary:end -->/, block)
          : `${text}\n${block}\n`,
      );
    }
  }
  process.exit(defects.length ? 1 : 0);
}

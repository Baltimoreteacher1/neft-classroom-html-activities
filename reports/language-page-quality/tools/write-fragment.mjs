#!/usr/bin/env node
/**
 * Writes fragments/inventory.json (the inventory agent's fragment, master-brief shape) from inventory.json,
 * baseline-scores.json and crawl-baseline.json. This agent is read-only over product code, so every record is
 * status "unchanged" (or "untestable") and scoresAfter is empty; scoresBefore is the platform baseline.
 *   node reports/language-page-quality/tools/write-fragment.mjs [--tests <json file of {cmd,result}[]>]
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const OUT = path.resolve(import.meta.dirname, "..");
const ROOT = path.resolve(OUT, "../..");
const rj = (f) => JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8"));
const inv = rj("inventory.json"), base = rj("baseline-scores.json"), crawl = rj("crawl-baseline.json");
const testsArg = process.argv.includes("--tests") ? JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf("--tests") + 1], "utf8")) : [];
const git = (c) => { try { return execSync(`git -C "${ROOT}" ${c}`, { encoding: "utf8" }).trim(); } catch { return ""; } };
const s = crawl.summary;

const records = inv.families.map((f) => ({
  id: f.id, url: f.url, program: f.program, type: f.type, gradeBand: f.gradeBand, wida: f.wida, objective: f.objective, contentSource: f.contentSource, template: f.template,
  feedback: f.feedback, a11y: f.a11y, mobile: f.mobile, designIssues: f.designIssues, contentIssues: f.contentIssues,
  action: f.action, priority: f.priority, status: f.testable ? "unchanged" : "untestable", verification: f.verification, count: f.count ?? null,
}));
const scoresBefore = Object.fromEntries(Object.entries(base.families).map(([k, v]) => [k, v.scores]));
const problemsFound = [
  `Axe (WCAG 2.0/2.1/2.2 A+AA) at 1280px: ${s.axe["1280"].pagesWithSeriousOrCritical} of ${s.targets} crawled pages have serious/critical violations; rules: ${s.axe["1280"].ruleCounts.map(([r, n]) => `${r} x${n}`).join(", ")}. All are on the sibling static sites (wida-access, esol, esol-reading-writing, language-adventures, language-studio); no lab (access-practice-lab) page has an axe violation.`,
  `Horizontal overflow: ${Object.entries(s.overflowByWidth).filter(([, v]) => v.length).map(([w, v]) => `${w}px: ${[...new Set(v.map((x) => x.replace(/^deep-/, "")))].join(", ")}`).join("; ") || "none"}.`,
  `Touch targets: ${s.pagesWithTargetsUnder44at390} of ${s.targets} pages have interactive targets under 44px at 390px; ${s.pagesWithTargetsUnder24at390} have targets under 24px (WCAG 2.2 AA minimum).`,
  `Focus indicator not visible after Tab on: ${s.focusNotVisible.join(", ") || "none"}.`,
  `Core bank measured flags: ${Object.entries(inv.counts.coreIssueCounts).map(([k, n]) => `${k} ${n}`).join("; ")} (of ${inv.counts.coreBankActivities}). Feedback is already specific for choice/sort/order/cloze items; the weaknesses are hint repeated as support (85 constructed items), long directions (41), missing hints (21), thin vocabulary (18), generic correct feedback (8).`,
  "Static-server 404s observed on sibling sites: design-tokens.css (esol, esol-reading-writing, wida-access trainer) and /api/class/create (class-teacher; needs the Worker). Confirm against production before treating as defects.",
  "Mobile length: a 3-5 listening sort activity renders ~6,700px tall at 390px (skill lesson, task card, word help and answer controls stack before the practice).",
  "wida-access page meta descriptions call the practice 'Publisher-grade WIDA ACCESS ... prep'; check against the never-claim-official rule (hub body text carries disclaimers).",
];
const improvements = [
  "Added inventory.json: 162 families and 1,987 activity or route records with measured content flags.",
  "Added Playwright crawler (tools/crawl.mjs): 390/768/1280 overflow, console errors, axe, touch targets, focus, minimal answer/feedback interaction; static server needs no build.",
  "Added RUBRIC.md and rubric.json (A-K, weighted), tools/score-baseline.mjs and baseline-scores.json with per-score evidence.",
  "Added tools/assemble-report.mjs producing REPORT.md sections A-O from fragments, tolerant of missing inputs.",
];
const fragment = {
  area: "inventory", branch: git("rev-parse --abbrev-ref HEAD"), headCommit: git("rev-parse --short HEAD"), inventory: records, scoresBefore, scoresAfter: {},
  problemsFound, improvements, templatesRedesigned: [], contentRecordsRewritten: 0, criticalFixed: 0,
  unresolved: [`${inv.untestable.length} untestable or count-only surfaces (see inventory.json untestable)`, "Baseline judged scores rest on sampled content (documented per score); measured scores are exhaustive over the cited files.", "Early-band (K-3) interactions were driven with a pick-then-Check script; Speaking/recorder paths cannot be exercised headlessly."],
  sharedEdits: [], tests: testsArg,
  filesChanged: fs.readdirSync(OUT).filter((f) => !f.startsWith(".")).map((f) => `reports/language-page-quality/${f}`).concat(fs.readdirSync(path.join(OUT, "tools")).map((f) => `reports/language-page-quality/tools/${f}`)),
  screenshots: fs.existsSync(path.join(OUT, "screenshots/before")) ? fs.readdirSync(path.join(OUT, "screenshots/before")).map((f) => `reports/language-page-quality/screenshots/before/${f}`) : [],
};
fs.mkdirSync(path.join(OUT, "fragments"), { recursive: true });
fs.writeFileSync(path.join(OUT, "fragments/inventory.json"), JSON.stringify(fragment, null, 1) + "\n");
console.log(`fragment: ${records.length} records, ${fragment.screenshots.length} screenshots`);

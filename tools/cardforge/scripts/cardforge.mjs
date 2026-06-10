#!/usr/bin/env node
// CardForge CLI dispatcher. Backs the npm run cardforge:* commands.
//
//   cardforge audit                      → audit live Math cards (read-only)
//   cardforge analyze <source-file>      → normalize a lesson source → analysis JSON
//   cardforge build   <job.json>         → render a staged package from a job
//   cardforge qa      <package-dir>      → run the QA gate on a staged package
//   cardforge stage   <job.json>         → build + qa in one step
//   cardforge publish <package-dir>      → guarded manual publish procedure (no live writes)
import { resolve } from "node:path";
import { existsSync, readJSON, writeJSON, CF_ROOT } from "../lib/util.mjs";
import { runAdapter, detectType } from "../lib/adapters.mjs";
import { analyzeLesson } from "../lib/analyze.mjs";
import { buildPackage } from "../lib/generate.mjs";
import { runQa } from "../lib/qa.mjs";
import { auditCards } from "../lib/audit.mjs";
import { publishGuard } from "../lib/publish.mjs";
import { updateCard } from "../lib/card-updater.mjs";

const [cmd, arg] = process.argv.slice(2);
const log = (...a) => console.log(...a);
const fail = (m) => { console.error(`✖ ${m}`); process.exit(1); };

function rel(p) { return p.replace(CF_ROOT, "tools/cardforge"); }

function cmdAudit() {
  const r = auditCards();
  if (!r.ok) return fail(r.message);
  log(`\nCardForge — Live Card Audit\n${"─".repeat(48)}`);
  log(r.summary);
  for (const row of r.weak.slice(0, 25)) {
    const bits = [];
    if (row.missingFields.length) bits.push(`fields: ${row.missingFields.join(",")}`);
    if (row.missingResources) bits.push(`${row.missingResources}/${row.resourceTotal} resources missing`);
    log(`  • ${row.id} ${row.title} — ${bits.join("; ")}`);
  }
  if (r.weak.length > 25) log(`  …and ${r.weak.length - 25} more.`);
  log("");
}

function cmdAnalyze(file) {
  if (!file) return fail("Usage: cardforge analyze <source-file>");
  const adapter = runAdapter(file);
  if (adapter.supported === false) {
    log(`ℹ ${adapter.message}`);
  }
  const analysis = analyzeLesson(adapter);
  const out = resolve(CF_ROOT, "generated", `analysis-${Date.now()}.json`);
  writeJSON(out, analysis);
  log(`Analyzed (${analysis.sourceType}, confidence ${analysis.confidence}) → ${rel(out)}`);
  if (analysis.missing.length) log(`  Missing: ${analysis.missing.join(", ")}`);
  if (analysis.uncertain.length) log(`  Uncertain: ${analysis.uncertain.join(", ")}`);
  return analysis;
}

function loadJob(jobPath) {
  if (!jobPath) return fail("Usage: cardforge build <job.json>");
  const p = resolve(process.cwd(), jobPath);
  if (!existsSync(p)) return fail(`Job not found: ${jobPath}`);
  const job = readJSON(p);
  job.__jobPath = jobPath;
  // Optional: attach source analysis (does not override authored content).
  if (job.source?.file) {
    const sp = resolve(process.cwd(), job.source.file);
    if (existsSync(sp)) job.__analysis = analyzeLesson(runAdapter(sp, job.source.type || detectType(sp)));
  }
  return job;
}

function cmdBuild(jobPath) {
  const job = loadJob(jobPath);
  const { dir, files, card } = buildPackage(job);
  log(`Built package: ${rel(dir)}`);
  log(`  ${files.length} artifacts: ${files.join(", ")}`);
  log(`  card: ${card.id} · status ${card.status}${card.demo ? " · DEMO" : ""}`);
  return dir;
}

function cmdQa(pkgDir) {
  if (!pkgDir) return fail("Usage: cardforge qa <package-dir>");
  const r = runQa(resolve(process.cwd(), pkgDir));
  log(`QA: ${r.status.toUpperCase()} · ${r.blocked.length} blocking · ${r.warns.length} warnings → ${rel(r.dir)}/qa-report.md`);
  for (const c of r.blocked) log(`  ⛔ ${c.id} — ${c.detail}`);
  for (const c of r.warns) log(`  ⚠️  ${c.id}${c.detail ? ` — ${c.detail}` : ""}`);
  if (r.status === "blocked") process.exitCode = 2;
  return r;
}

function cmdStage(jobPath) {
  const dir = cmdBuild(jobPath);
  return cmdQa(dir);
}

function cmdPublish(pkgDir) {
  if (!pkgDir) return fail("Usage: cardforge publish <package-dir>");
  const r = publishGuard(resolve(process.cwd(), pkgDir));
  log(`\nCardForge — Publish (guarded, v1)\n${"─".repeat(48)}`);
  if (r.blockers.length) {
    log("Cannot publish yet:");
    for (const b of r.blockers) log(`  ⛔ ${b}`);
    log("");
  } else {
    log("✓ Staged package passed publish pre-checks (no live data was modified).");
    log("");
  }
  for (const line of r.lines) log(line);
  log("");
}

function cmdUpdateCard(pkgDir) {
  if (!pkgDir) return fail("Usage: cardforge update-card <package-dir>");
  const r = updateCard(resolve(process.cwd(), pkgDir));
  if (!r.ok) return fail(r.message);
  log(`Card update report → ${rel(r.dir)}/card-update-report.md`);
  log(`  matched live lesson: ${r.liveMatch || "none (staged-only)"}${r.demo ? " · demo (no live card modified)" : ""}`);
  for (const b of r.buttons) log(`  ${b.present ? "•" : "+"} ${b.label} → ${b.file}`);
}

const ROUTES = { audit: cmdAudit, analyze: cmdAnalyze, build: cmdBuild, qa: cmdQa, stage: cmdStage, publish: cmdPublish, "update-card": cmdUpdateCard };

if (!ROUTES[cmd]) {
  log("CardForge — Lesson-to-EduWonderLab Math Card Engine");
  log("Usage: cardforge <audit|analyze|build|qa|stage|update-card|publish> [arg]");
  process.exit(cmd ? 1 : 0);
}
ROUTES[cmd](arg);

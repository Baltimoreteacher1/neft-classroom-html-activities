#!/usr/bin/env node
// Publishes per-block content-verifier counts to the review queue.
//
//   node tools/content/publish-verifier-counts.mjs           write functions/_lib/review-generated/verifier-counts.js
//   node tools/content/publish-verifier-counts.mjs --check   freshness gate: regenerate in memory and compare with the file
//
// Every registered verifier (REGISTRY, contract verify(target)) and every B verifier (verifiers-b.mjs, contract
// verify(subject, ctx)) runs over all 162 units. An error or warn finding is counted against the review block it lives in:
// a path under `lessons[i]` belongs to that lesson's block, anything else (studio.*, unit-level findings) to the unit's
// "<unitId>:studio" block. Info findings are not counted. The result is a plain JS module, `{ verifier: { blockId: count } }`
// with zero counts omitted, which shared/content-schema/review-verifier-counts.js re-exports to the queue's `verifier` filter.
//
// Exit 0 fresh / written, 1 stale (--check), 3 broken (a verifier's negative control stopped firing, the block mapping
// control failed, a verifier threw). The module cites no repo paths, so it is safe in the public build.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { REGISTRY } from "./registry.mjs";
import {
  B_NAMES,
  loadContext,
  loadSubjects,
  loadVerifier,
  runControls as runControlsB,
  sweep,
} from "./verifiers-b.mjs";
import { runControls as runControlsA } from "./verify.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT_FILE =
  process.env.CONTENT_COUNTS_FILE ||
  path.resolve(HERE, "../../functions/_lib/review-generated/verifier-counts.js");
export const EXIT = { OK: 0, STALE: 1, BROKEN: 3 };

const LESSON_PATH = /^lessons\[(\d+)\]/;

/** The review block a finding path belongs to. */
export function blockIdOf(target, findingPath) {
  const m = LESSON_PATH.exec(findingPath || "");
  const lesson = m ? target.lessons?.[Number(m[1])] : null;
  return lesson?.id ?? `${target.id}:studio`;
}

/** error and warn findings -> { blockId: count } for one target. */
export function countFindings(target, findings) {
  const counts = {};
  for (const f of findings) {
    if (f.severity === "info") continue;
    const id = blockIdOf(target, f.path);
    counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}

const byKey = ([a], [b]) => (a < b ? -1 : 1);
// Biome's formatter drops quotes on identifier-like keys; the generated file is under `npm run check`, so it must match.
const keyText = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

/** Deterministic module text for a table { verifier: { blockId: count } }. */
export function render(table) {
  const lines = [
    "// Generated file: do not edit. Verifier error and warn counts per review block, written by the verifier-counts",
    "// publisher (npm run content:verifier-counts); npm run validate:content-verifier-counts fails when it is stale.",
    "// Shape: { [verifierName]: { [blockId]: count } }. Zero counts are omitted.",
    "export default {",
  ];
  for (const [verifier, blocks] of Object.entries(table).sort(byKey)) {
    const entries = Object.entries(blocks).sort(byKey);
    if (!entries.length) lines.push(`  ${keyText(verifier)}: {},`);
    else {
      lines.push(`  ${keyText(verifier)}: {`);
      for (const [id, n] of entries) lines.push(`    ${keyText(id)}: ${n},`);
      lines.push("  },");
    }
  }
  lines.push("};", "");
  return lines.join("\n");
}

/** True when the file's text differs from what the current verifiers would publish. */
export const isStale = (fileText, table) => fileText !== render(table);

/** Mapping control: a known target and findings must land in the known blocks. Returns problems[]. */
export function mappingControl() {
  const target = { id: "u1", lessons: [{ id: "u1-l01" }, { id: "u1-l02" }] };
  const findings = [
    { severity: "error", path: "lessons[1].arc[0]" },
    { severity: "warn", path: "lessons[1]" },
    { severity: "warn", path: "studio.vocab[0]" },
    { severity: "warn", path: "" },
    { severity: "info", path: "lessons[0]" },
  ];
  const got = countFindings(target, findings);
  const want = { "u1-l02": 2, "u1:studio": 2 };
  return JSON.stringify(Object.entries(got).sort(byKey)) ===
    JSON.stringify(Object.entries(want).sort(byKey))
    ? []
    : [`block mapping control failed: got ${JSON.stringify(got)}`];
}

const targetOf = (s) => ({
  id: s.id,
  grade: String(s.unit.grade),
  subject: s.unit.subject,
  studio: s.studio,
  lessons: s.lessons,
});

/** Runs every verifier's controls, then the sweep. Returns { table, problems }. */
export async function computeTable() {
  const problems = mappingControl();
  const table = {};
  const ctx = loadContext();
  const subjects = (await loadSubjects()).filter((s) => s.kind === "unit");
  const targets = subjects.map(targetOf);
  for (const [name, load] of Object.entries(REGISTRY)) {
    const mod = await load();
    problems.push(...(await runControlsA(name, mod)));
    const counts = {};
    for (const t of targets)
      for (const [id, n] of Object.entries(countFindings(t, await mod.verify(t))))
        counts[id] = (counts[id] || 0) + n;
    table[name] = counts;
  }
  for (const name of B_NAMES) {
    const mod = await loadVerifier(name);
    problems.push(...runControlsB(mod, ctx));
    const { findings } = sweep(mod, subjects, ctx);
    const counts = {};
    for (const s of subjects) {
      const own = findings.filter((f) => f.subject === s.id);
      for (const [id, n] of Object.entries(countFindings(targetOf(s), own)))
        counts[id] = (counts[id] || 0) + n;
    }
    table[name] = counts;
  }
  return { table, problems };
}

async function main(argv) {
  const check = argv.includes("--check");
  if (check && !existsSync(OUT_FILE)) {
    console.error(
      "verifier counts: STALE or missing; run npm run content:verifier-counts and commit the result",
    );
    return EXIT.STALE;
  }
  const { table, problems } = await computeTable();
  if (problems.length) {
    for (const p of problems) console.error(`CONTROL FAILED ${p}`);
    return EXIT.BROKEN;
  }
  const text = render(table);
  const blocks = new Set(Object.values(table).flatMap((b) => Object.keys(b)));
  if (check) {
    const have = readFileSync(OUT_FILE, "utf8");
    if (have === text) {
      console.log(
        `verifier counts: fresh (${Object.keys(table).length} verifiers, ${blocks.size} blocks with findings)`,
      );
      return EXIT.OK;
    }
    console.error(
      `verifier counts: STALE or missing; run npm run content:verifier-counts and commit the result`,
    );
    return EXIT.STALE;
  }
  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, text);
  console.log(
    `wrote verifier counts (${Object.keys(table).length} verifiers, ${blocks.size} blocks with findings)`,
  );
  return EXIT.OK;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`ERROR ${err?.stack ?? err}`);
      process.exit(EXIT.BROKEN);
    },
  );
}

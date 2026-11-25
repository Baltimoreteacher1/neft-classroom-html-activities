#!/usr/bin/env node
// Sweep runner for the "B" content verifiers: cognate, frames, spanish, standards.
//
//   node tools/content/verifiers-b.mjs                   all four, against tools/content/baselines/<name>.json
//   node tools/content/verifiers-b.mjs --only cognate    one verifier
//   node tools/content/verifiers-b.mjs --queue           also print the cognate human-review queue
//   node tools/content/verifiers-b.mjs --write-baseline  rewrite baselines (refused if any gated count would rise)
//   node tools/content/verifiers-b.mjs --init            first-time baseline write (allows any counts)
//
// Order of operations, per verifier: (1) negative control: the known-bad fixture MUST raise every code it lists and the
// known-good fixture MUST raise no error or warn; otherwise exit 3. (2) sweep every unit (162) and term (974). (3) ratchet:
// error and warn findings are keyed by "code|subjectId"; a key whose count is above the committed baseline is NEW and fails.
// info findings are reported, never gated. Real content is never edited.
// Exit 0 = no new findings, 1 = new findings, 3 = broken gate (control stopped firing, sweep below floor, load error).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BCPSS_UNITS } from "../../data/bcpss-curriculum-seed.mjs";
import { TERMS } from "../../db/seeds/bcpss/v2/terms.mjs";
import { loadLessons } from "../../functions/_lib/bcpss/lessons.js";
import { loadStudio } from "../../functions/_lib/bcpss/studio.js";
import { EXIT } from "./verifiers/b-common.mjs";
import { falseFriendIndex } from "./verifiers/cognate.mjs";
import { buildStandardsRefs } from "./verifiers/standards.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
export const B_NAMES = ["cognate", "frames", "spanish", "standards"];
export const BASELINE_DIR = process.env.VERIFIERS_B_BASELINE_DIR || path.join(HERE, "baselines");
export const FLOOR_SHARE = 0.9;

const readJson = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));

/** Reference data the verifiers need (everything they cannot compute from the subject). */
export function loadContext() {
  return {
    falseFriends: falseFriendIndex(readJson("tools/content/data/false-friends.json")),
    standardsRefs: buildStandardsRefs({
      ccss: readJson("data/ccss-standards.json"),
      crosswalk: readJson("data/standards-crosswalk-2025.json"),
      taxonomy: readJson("data/standards-taxonomy.json"),
    }),
  };
}

/** Unit subjects (studio + seed record + lessons) and term subjects. Throws if a unit cannot load. */
export async function loadSubjects() {
  const subjects = [];
  for (const unit of BCPSS_UNITS) {
    const studio = await loadStudio(unit.id);
    const set = await loadLessons(unit.id);
    if (!studio || !set)
      throw new Error(`unit ${unit.id} did not load (studio ${!!studio}, lessons ${!!set})`);
    subjects.push({ kind: "unit", id: unit.id, unit, studio, lessons: set.lessons });
  }
  for (const term of TERMS) subjects.push({ kind: "term", id: `term:${term.id}`, term });
  return subjects;
}

export async function loadVerifier(name) {
  return import(pathToFileURL(path.join(HERE, "verifiers", `${name}.mjs`)).href);
}

/** Negative + positive control. Returns problems (empty = the verifier still fires and still passes clean input). */
export function runControls(mod, ctx) {
  const problems = [];
  const cctx = { ...ctx, standardsRefs: mod.fixtureRefs ?? ctx.standardsRefs };
  const bad = mod.verify(mod.fixtures.bad.subject, cctx).map((f) => f.code);
  for (const code of mod.fixtures.bad.mustFlag)
    if (!bad.includes(code))
      problems.push(`${mod.name}: known-bad fixture no longer raises ${code}`);
  const good = mod.verify(mod.fixtures.good.subject, cctx).filter((f) => f.severity !== "info");
  for (const f of good)
    problems.push(`${mod.name}: known-good fixture raised ${f.code} (${f.message})`);
  return problems;
}

export function sweep(mod, subjects, ctx) {
  const findings = [];
  let examined = 0;
  for (const subject of subjects) {
    if (!mod.kinds.includes(subject.kind)) continue;
    examined += 1;
    for (const f of mod.verify(subject, ctx)) findings.push({ ...f, subject: subject.id });
  }
  return { findings, examined };
}

/** Gated (error+warn) counts keyed "code|subjectId", plus ungated info totals by code. */
export function tally(findings) {
  const gated = {};
  const info = {};
  for (const f of findings) {
    if (f.severity === "info") info[f.code] = (info[f.code] ?? 0) + 1;
    else gated[`${f.code}|${f.subject}`] = (gated[`${f.code}|${f.subject}`] ?? 0) + 1;
  }
  return { gated, info };
}

/** Keys above baseline are new; keys below are improvements. */
export function ratchet(current, baseline) {
  const added = [];
  const improved = [];
  for (const [key, n] of Object.entries(current))
    if (n > (baseline[key] ?? 0)) added.push({ key, now: n, was: baseline[key] ?? 0 });
  for (const [key, n] of Object.entries(baseline))
    if ((current[key] ?? 0) < n) improved.push({ key, now: current[key] ?? 0, was: n });
  return { added, improved };
}

const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));

export function makeBaseline(name, examined, { gated, info }) {
  return {
    verifier: name,
    schema: 1,
    measured: { subjects: examined },
    floors: { subjects: Math.floor(examined * FLOOR_SHARE) },
    gated: sorted(gated),
    info: sorted(info),
  };
}

export const baselinePath = (name) => path.join(BASELINE_DIR, `${name}.json`);

async function main(argv) {
  const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
  const names = only ? [only] : B_NAMES;
  if (only && !B_NAMES.includes(only))
    throw new Error(`unknown verifier "${only}" (${B_NAMES.join(", ")})`);
  const write = argv.includes("--write-baseline") || argv.includes("--init");
  const ctx = loadContext();
  const mods = await Promise.all(names.map(loadVerifier));
  const broken = mods.flatMap((m) => runControls(m, ctx));
  if (broken.length) {
    for (const p of broken) console.error(`CONTROL FAILED ${p}`);
    return EXIT.ERROR;
  }
  const subjects = await loadSubjects();
  let code = EXIT.OK;
  for (const mod of mods) {
    const { findings, examined } = sweep(mod, subjects, ctx);
    const now = tally(findings);
    const file = baselinePath(mod.name);
    const base = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
    const bySeverity = { error: 0, warn: 0, info: 0 };
    for (const f of findings) bySeverity[f.severity] += 1;
    console.log(
      `${mod.name}: examined ${examined}, error ${bySeverity.error}, warn ${bySeverity.warn}, info ${bySeverity.info}`,
    );
    if (base && examined < base.floors.subjects) {
      console.error(
        `GATE BROKEN ${mod.name}: examined ${examined} below floor ${base.floors.subjects}`,
      );
      return EXIT.ERROR;
    }
    const { added, improved } = ratchet(now.gated, base?.gated ?? {});
    if (write) {
      if (base && added.length && !argv.includes("--init")) {
        console.error(
          `refusing to raise ${mod.name} baseline: ${added.length} key(s) above baseline`,
        );
        code = EXIT.FAIL;
        continue;
      }
      writeFileSync(file, `${JSON.stringify(makeBaseline(mod.name, examined, now), null, 1)}\n`);
      console.log(`  wrote ${path.relative(ROOT, file)}`);
      continue;
    }
    if (!base) {
      console.error(
        `GATE BROKEN ${mod.name}: no committed baseline at ${path.relative(ROOT, file)}`,
      );
      return EXIT.ERROR;
    }
    for (const a of added) console.error(`  NEW ${a.key} ${a.was} -> ${a.now}`);
    if (improved.length)
      console.log(`  ${improved.length} key(s) improved; run --write-baseline to ratchet down`);
    if (added.length) code = EXIT.FAIL;
    if (argv.includes("--queue") && mod.name === "cognate") {
      for (const f of findings.filter((x) => x.code === "cognate_low_confidence"))
        console.log(`  QUEUE ${f.subject} ${f.evidence}`);
    }
  }
  return code;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`ERROR ${err?.stack ?? err}`);
      process.exit(EXIT.ERROR);
    },
  );
}

#!/usr/bin/env node
// Content verifier driver.
//   node tools/content/verify.mjs [--verifier=<name|all>] [--unit=<id|all>] [--json] [--update-baseline]
// Exit 0: no NEW findings against the committed baseline and detector coverage holds.
// Exit 1: new findings (per unit and code) or a coverage floor fell below 90% of the measured baseline count.
// Exit 3: the gate itself is broken (negative control stopped firing, bad arguments, missing baseline, a verifier threw).
//
// Findings are REPORTED and ratcheted; this tool never edits content and never changes a tier.
// Baselines: tools/content/baselines/<verifier>.json  { units: {unitId: {code: n}}, info: {code: n}, floors: {code: n} }
// Fault injection (tests only): CONTENT_VERIFY_FAULT_DROP=CODE[,CODE] drops those codes from verifier output to prove the
// negative controls trip.
import fs from "node:fs";
import { REGISTRY } from "./registry.mjs";
import { allUnitIds, loadTarget } from "./verifiers/lib/targets.mjs";

export const EXIT = { PASS: 0, NEW_FINDINGS: 1, BROKEN: 3 };
// CONTENT_VERIFY_BASELINE_DIR is a test hook that points the ratchet at a scratch copy of the baselines.
const BASELINE_DIR = process.env.CONTENT_VERIFY_BASELINE_DIR
  ? new URL(`file://${process.env.CONTENT_VERIFY_BASELINE_DIR.replace(/\/?$/, "/")}`)
  : new URL("./baselines/", import.meta.url);
const FLOOR_RATIO = 0.9;

class GateError extends Error {}
const fail = (msg) => {
  throw new GateError(msg);
};

export function parseArgs(argv) {
  const opts = { verifier: "all", unit: "all", json: false, update: false };
  for (const a of argv) {
    if (a === "--json") opts.json = true;
    else if (a === "--update-baseline") opts.update = true;
    else if (a.startsWith("--verifier=")) opts.verifier = a.slice(11);
    else if (a.startsWith("--unit=")) opts.unit = a.slice(7);
    else fail(`unknown argument "${a}"`);
  }
  return opts;
}

const dropped = () =>
  new Set((process.env.CONTENT_VERIFY_FAULT_DROP || "").split(",").filter(Boolean));
const run = async (mod, target) => (await mod.verify(target)).filter((f) => !dropped().has(f.code));
const loud = (findings) => findings.filter((f) => f.severity !== "info");

/** Negative control: bad fixtures must raise their codes, good fixtures must raise nothing loud. Returns problems[]. */
export async function runControls(name, mod) {
  const problems = [];
  const fx = mod.fixtures;
  if (!fx || !fx.bad?.length || !fx.good?.length)
    return [`${name}: no fixtures exported (a verifier needs known-bad and known-good fixtures)`];
  for (const bad of fx.bad) {
    const codes = new Set(loud(await run(mod, bad.target)).map((f) => f.code));
    for (const want of bad.expect)
      if (!codes.has(want))
        problems.push(
          `${name}: negative control "${bad.name}" did not raise ${want} (got ${[...codes].join(", ") || "nothing"})`,
        );
  }
  for (const good of fx.good) {
    const found = loud(await run(mod, good.target));
    if (found.length)
      problems.push(
        `${name}: known-good fixture "${good.name}" raised ${found.map((f) => f.code).join(", ")}`,
      );
  }
  return problems;
}

const bump = (obj, key, n = 1) => {
  obj[key] = (obj[key] || 0) + n;
};

export function summarize(perUnit) {
  const units = {};
  const info = {};
  for (const { id, findings } of perUnit) {
    for (const f of findings) {
      if (f.severity === "info") bump(info, f.code, f.evidence?.n ?? 1);
      else bump((units[id] ||= {}), f.code);
    }
  }
  return { units, info };
}

export function compare(baseline, now, fullRun, unitIds) {
  const newFindings = [];
  const improved = [];
  for (const id of unitIds) {
    for (const [code, n] of Object.entries(now.units[id] || {}))
      if (n > (baseline.units[id]?.[code] || 0))
        newFindings.push({ unit: id, code, now: n, baseline: baseline.units[id]?.[code] || 0 });
    for (const [code, n] of Object.entries(baseline.units[id] || {}))
      if ((now.units[id]?.[code] || 0) < n)
        improved.push({ unit: id, code, now: now.units[id]?.[code] || 0, baseline: n });
  }
  const floorBreaches = [];
  if (fullRun)
    for (const [code, floor] of Object.entries(baseline.floors || {}))
      if ((now.info[code] || 0) < floor)
        floorBreaches.push({ code, now: now.info[code] || 0, floor });
  return { newFindings, improved, floorBreaches };
}

const baselineUrl = (name) => new URL(`${name}.json`, BASELINE_DIR);
function readBaseline(name) {
  try {
    return JSON.parse(fs.readFileSync(baselineUrl(name), "utf8"));
  } catch (e) {
    return fail(
      `baseline for ${name} missing or unreadable (${e.code || e.message}); create it with --update-baseline on a full run`,
    );
  }
}

export function makeBaseline(name, now, unitCount, coverageCodes = []) {
  const floors = {};
  for (const code of coverageCodes) floors[code] = Math.floor((now.info[code] || 0) * FLOOR_RATIO);
  return {
    verifier: name,
    version: 1,
    unitsMeasured: unitCount,
    note: "Counts may only go down. Floors are 90% of the measured counts of each verifier's coverage codes (what the detector actually looked at). Regenerate only with --update-baseline.",
    units: now.units,
    info: now.info,
    floors,
  };
}

async function main(argv) {
  const opts = parseArgs(argv);
  const names = opts.verifier === "all" ? Object.keys(REGISTRY) : [opts.verifier];
  for (const n of names)
    if (!REGISTRY[n]) fail(`unknown verifier "${n}" (known: ${Object.keys(REGISTRY).join(", ")})`);
  const ids = opts.unit === "all" ? allUnitIds() : [opts.unit];
  if (opts.unit !== "all" && !allUnitIds().includes(opts.unit)) fail(`unknown unit "${opts.unit}"`);
  const fullRun = opts.unit === "all";
  const mods = {};
  for (const n of names) mods[n] = await REGISTRY[n]();
  const problems = [];
  for (const n of names) problems.push(...(await runControls(n, mods[n])));
  if (problems.length) fail(`negative control failed:\n  ${problems.join("\n  ")}`);

  const targets = [];
  for (const id of ids) targets.push(await loadTarget(id));
  let status = EXIT.PASS;
  const report = {};
  for (const n of names) {
    const perUnit = [];
    for (const t of targets)
      perUnit.push({
        id: t.id,
        findings: (await run(mods[n], t)).map((f) => ({ unit: t.id, ...f })),
      });
    const now = summarize(perUnit);
    if (opts.update) {
      if (!fullRun) fail("--update-baseline needs a full run (--unit=all)");
      const exists = fs.existsSync(baselineUrl(n));
      const raised = exists ? compare(readBaseline(n), now, false, ids).newFindings : [];
      if (raised.length)
        console.error(
          `${n}: refusing to raise the baseline (${raised.length} new findings); fix the content instead`,
        );
      else
        fs.writeFileSync(
          baselineUrl(n),
          `${JSON.stringify(makeBaseline(n, now, ids.length, mods[n].coverageCodes), null, 1)}\n`,
        );
    }
    const c = compare(readBaseline(n), now, fullRun, ids);
    const bad = c.newFindings.length || c.floorBreaches.length;
    if (bad) status = Math.max(status === EXIT.PASS ? 0 : status, EXIT.NEW_FINDINGS);
    report[n] = {
      status: bad ? "fail" : "pass",
      units: ids.length,
      totals: Object.fromEntries(
        Object.entries(now.units)
          .flatMap(([, codes]) => Object.entries(codes))
          .reduce((m, [k, v]) => m.set(k, (m.get(k) || 0) + v), new Map()),
      ),
      info: now.info,
      ...c,
      findings: opts.json ? perUnit.flatMap((u) => u.findings) : undefined,
    };
  }
  if (opts.json) console.log(JSON.stringify(report, null, 1));
  else
    for (const [n, r] of Object.entries(report)) {
      console.log(
        `${n}: ${r.status.toUpperCase()}  units=${r.units}  findings=${JSON.stringify(r.totals)}  coverage=${JSON.stringify(r.info)}`,
      );
      for (const f of r.newFindings)
        console.log(`  NEW ${f.unit} ${f.code} x${f.now} (baseline ${f.baseline})`);
      for (const f of r.floorBreaches)
        console.log(`  COVERAGE ${f.code} fell to ${f.now} (floor ${f.floor})`);
      if (r.improved.length)
        console.log(
          `  ${r.improved.length} counts are below baseline: run with --update-baseline to ratchet down`,
        );
    }
  return status;
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(
        e instanceof GateError
          ? `content verify: BROKEN GATE: ${e.message}`
          : `content verify: BROKEN GATE: ${e.stack || e}`,
      );
      process.exit(EXIT.BROKEN);
    },
  );
}

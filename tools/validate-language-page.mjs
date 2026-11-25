#!/usr/bin/env node
// validate:language-page — every Language Page gate (G-01..G-12 minus the sibling-owned ones) with its
// negative control. Exit 0 PASS, 1 FAIL, 3 SKIP (no browser). CI (CI=true) treats SKIP as FAIL.
// A gate whose control does NOT fail is itself a failure: a gate that cannot fail is not a gate.
//   node tools/validate-language-page.mjs [--no-browser] [--only G-01,G-04] [--json out.json]
import fs from "node:fs";
import { loadDataset } from "./language-page/dataset.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const only = val("--only")?.split(",");
const CI = Boolean(process.env.CI);

// Every tools/language-page/gates-*.mjs file may export gates ({ id, name, run, controls, browser? }).
// Discovery, not a hand-kept import list, so independent work never edits the same line.
const GATE_DIR = new URL("./language-page/", import.meta.url);
const found = [];
for (const file of fs.readdirSync(GATE_DIR).filter((f) => /^gates-.*\.mjs$/.test(f))) {
  const mod = await import(new URL(file, GATE_DIR));
  for (const value of Object.values(mod))
    if (
      value &&
      typeof value === "object" &&
      /^G-\d+$/.test(value.id ?? "") &&
      value.run &&
      value.controls
    )
      found.push(value);
}
const ids = found.map((g) => g.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) {
  console.error(`FAIL duplicate gate id(s): ${[...new Set(dupes)].join(", ")}`);
  process.exit(1);
}
found.sort((a, b) => Number(a.id.slice(2)) - Number(b.id.slice(2)));
const GATES = found.filter((g) => !only || only.includes(g.id));
const BROWSER = new Set(["G-10", "G-12", ...found.filter((g) => g.browser).map((g) => g.id)]);

const t0 = Date.now();
const data = await loadDataset();
const rows = [];
let failed = 0;
let skipped = 0;

for (const gate of GATES) {
  if (flag("--no-browser") && BROWSER.has(gate.id)) {
    skipped += 1;
    rows.push({ id: gate.id, name: gate.name, status: "SKIP", note: "--no-browser" });
    console.log(`SKIP ${gate.id} ${gate.name} (--no-browser)`);
    continue;
  }
  const started = Date.now();
  const result = await gate.run({ data });
  if (result.skip) {
    skipped += 1;
    rows.push({ id: gate.id, name: gate.name, status: "SKIP", note: result.skip });
    console.log(`SKIP ${gate.id} ${gate.name}: ${result.skip}`);
    continue;
  }
  const controls = await gate.controls({ data });
  const brokenControl = controls.filter(
    (c) => !c.errors.length || c.errors.some((e) => String(e).startsWith("SKIP:")),
  );
  const ok = result.errors.length === 0 && brokenControl.length === 0 && controls.length > 0;
  if (!ok) failed += 1;
  rows.push({
    id: gate.id,
    name: gate.name,
    status: ok ? "PASS" : "FAIL",
    errors: result.errors.length,
    controls: controls.map((c) => ({ name: c.name, failed: c.errors.length })),
    info: result.info,
    ms: Date.now() - started,
  });
  console.log(
    `${ok ? "PASS" : "FAIL"} ${gate.id} ${gate.name} (${Date.now() - started}ms) ${JSON.stringify(result.info ?? {}).slice(0, 160)}`,
  );
  for (const e of result.errors.slice(0, 15)) console.log(`   - ${e}`);
  if (result.errors.length > 15) console.log(`   … ${result.errors.length - 15} more`);
  for (const c of brokenControl) console.log(`   ! negative control did NOT fail: ${c.name}`);
  if (!controls.length) console.log("   ! gate has no negative control");
}

console.log(
  `\n${rows.length} gates: ${rows.filter((r) => r.status === "PASS").length} pass, ${failed} fail, ${skipped} skip (${Date.now() - t0}ms)`,
);
if (val("--json")) fs.writeFileSync(val("--json"), JSON.stringify(rows, null, 2));
if (failed) process.exit(1);
if (skipped && CI) {
  console.log("CI treats SKIP as failure.");
  process.exit(1);
}
process.exit(skipped ? 3 : 0);

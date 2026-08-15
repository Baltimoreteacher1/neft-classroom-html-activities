#!/usr/bin/env node
/* =============================================================================
 * audit-interaction-depth.mjs — how deep is the interaction, not whether it exists
 * -----------------------------------------------------------------------------
 * audit-interaction-quality.mjs answered "can the student act on a
 * representation?" and found 288 of 288 lessons could. That question is
 * answered; this one asks how far the acting goes.
 *
 *   0 STATIC        drawn, and that is all
 *   1 RESPONSIVE    click / reveal / select, but the relationship is not explored
 *   2 MANIPULATIVE  the student changes a mathematical representation
 *   3 REASONING     the tool asks for a decision and answers it mathematically
 *   4 CONNECTED     two or more representations move from one relationship
 *   5 GENERATIVE    the student constructs or compares, not only solves
 *
 * A lesson is scored by the DEEPEST component it mounts, because that is the
 * deepest thinking the lesson makes available. The per-component ratings below
 * are code evidence, not opinion, and each carries the specific behaviour it
 * was rated on. `phase2Before` records what the rating was before this pass, so
 * the distribution shift is measured rather than asserted.
 *
 * Reports only. → reports/interaction-depth.{json,md}
 * ========================================================================== */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const NAMES = ["STATIC", "RESPONSIVE", "MANIPULATIVE", "REASONING", "CONNECTED", "GENERATIVE"];

/* depth, why it earns that depth, and (where this pass changed it) what it was.
 * Anything not listed defaults to 2: it is in the interactive registry, so the
 * student can act on it, but nothing here claims more than that. */
const DEPTH = {
  /* Already generative before this pass: typing any a : b and seeing the
   * equivalents IS constructing and testing. Phase 2 added the second
   * representation, which deepens it WITHIN level 5 rather than across a
   * boundary — recording a jump here would be scoring the pass, not the tool. */
  "ratio-table-builder": {
    d: 5,
    why: "student builds any ratio; table AND double number line render from one state",
  },
  "stats-data-lab": { d: 5, why: "student assembles and compares data sets" },
  "histogram-builder": { d: 5, why: "student constructs the display from raw data" },
  "box-plot-builder": { d: 5, why: "student constructs the five-number summary" },
  /* The What-if sandbox predates this pass, and constructing a data set to see
   * what happens is level 5 by definition. MAD and the before/after readout
   * made that testing legible; they did not create it. No `before` jump. */
  "bar-chart": { d: 5, why: "data-live What-if sandbox; edits report centre and spread" },
  "dot-plot": { d: 5, why: "data-live What-if sandbox; MAD and before/after deltas" },
  "box-plot": { d: 5, why: "data-live What-if sandbox with IQR and range" },
  "tape-diagram": {
    d: 4,
    before: 1,
    why: "whole/parts tapes re-partition after solving; ratio tapes scale both rows together",
  },
  "area-morph": {
    d: 4,
    before: 3,
    why: "student drives the transformation and now predicts the invariant first",
  },
  "equation-balance-lab": {
    d: 4,
    before: 3,
    why: "scale and symbols move together; feedback says whether a legal move helped",
  },
  "number-line": {
    d: 3,
    before: 2,
    why: "placement and inequality errors are diagnosed by kind, with a reveal ladder",
  },
  "coordinate-plane": { d: 3, why: "plot-and-check with a keyboard crosshair" },
  "net-folder": { d: 3, why: "fold/unfold with face checking" },
  "step-solver": { d: 3, why: "step-by-step decisions with per-step checking" },
  "factor-tree": { d: 3, why: "student builds the tree and it is checked" },
  "factor-tree-lab": { d: 3, why: "student builds the tree and it is checked" },
  "percent-grid": { d: 3, why: "shade-and-check against a target percent" },
  "percent-builder": { d: 3, why: "percent/decimal/fraction built and checked" },
  "unit-rate-builder": { d: 3, why: "student derives the unit rate and it is checked" },
  "long-division-builder": { d: 3, why: "type-into long division with per-digit checking" },
  "decimal-columns": { d: 3, why: "student works each column including carries" },
  "decimal-product": { d: 3, why: "student places the decimal point and is checked" },
  "decimal-quotient": { d: 3, why: "student shifts both numbers then divides" },
  "fraction-divide": { d: 3, why: "keep-change-flip carried out by the student" },
  "combine-like-terms": { d: 3, why: "student groups terms and is checked" },
  "algebra-expand": { d: 3, why: "student distributes and is checked" },
  "distributive-builder": { d: 3, why: "area model tied to the expanded form" },
  "cross-section": { d: 3, why: "student slices and names the face" },
  "scenario-sim": { d: 3, why: "slider drives a deterministic model with a live readout" },
  "line-grapher": { d: 3, why: "draggable y = kx with live equation" },
  "solid-3d": { d: 2, why: "rotate and inspect" },
  "number-line-explorer": { d: 2, why: "free exploration of the line" },
  "dist-explorer": { d: 2, why: "free exploration of a distribution" },
  "stat-towers": { d: 2, why: "build towers to compare" },
  "power-builder": { d: 2, why: "assemble a power and read its value" },
  "lcm-lab": { d: 2, why: "explore multiples" },
};

const registrySrc = readFileSync("engine/core/interactive-visual.js", "utf8");
const REGISTERED = new Set([...registrySrc.matchAll(/^ {2}"([a-z0-9-]+)":/gm)].map((m) => m[1]));

const depthOf = (kind, when) => {
  const e = DEPTH[kind];
  if (!e) return 2;
  return when === "before" && e.before != null ? e.before : e.d;
};

function walk(node, visit) {
  if (Array.isArray(node)) for (const c of node) walk(c, visit);
  else if (node && typeof node === "object") {
    visit(node);
    for (const v of Object.values(node)) walk(v, visit);
  }
}

const rows = [];
for (const id of readdirSync("lessons").sort()) {
  const path = join("lessons", id, "config.json");
  if (!existsSync(path)) continue;
  let config;
  try {
    config = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }
  const kinds = new Set();
  walk(config, (n) => {
    if (typeof n.kind === "string" && REGISTERED.has(n.kind)) kinds.add(n.kind);
    // scenario-sim mounts from a `simulator` block and carries no `kind`.
    if (n.simulator && typeof n.simulator === "object") kinds.add("scenario-sim");
  });
  if (!kinds.size) continue;
  const list = [...kinds];
  const now = Math.max(...list.map((k) => depthOf(k, "now")));
  const before = Math.max(...list.map((k) => depthOf(k, "before")));
  const unit = Number(String(id).split("-")[0]);
  rows.push({
    id,
    unit: Number.isFinite(unit) ? unit : null,
    variant: /-group\d$/.test(id) ? "small-group" : /-catchup$/.test(id) ? "catch-up" : "core",
    kinds: list.sort(),
    depthBefore: before,
    depth: now,
    deepest: list.reduce((a, k) => (depthOf(k, "now") > depthOf(a, "now") ? k : a), list[0]),
  });
}

mkdirSync("reports", { recursive: true });
writeFileSync("reports/interaction-depth.json", `${JSON.stringify(rows, null, 2)}\n`);

const tally = (key) => NAMES.map((_, i) => rows.filter((r) => r[key] === i).length);
const before = tally("depthBefore");
const after = tally("depth");

let md = "# Interaction depth\n\n";
md += `${rows.length} lessons mounting at least one interactive component.\n`;
md += "Scored by the deepest component the lesson mounts.\n\n";
md += "| Depth | Before | After |\n|---|---:|---:|\n";
NAMES.forEach((n, i) => {
  md += `| ${i} ${n} | ${before[i]} | ${after[i]} |\n`;
});
md += "\n## Components by depth\n\n| Component | Depth | Was | Evidence |\n|---|---|---|---|\n";
for (const [k, e] of Object.entries(DEPTH).sort((a, b) => b[1].d - a[1].d)) {
  md += `| ${k} | ${e.d} ${NAMES[e.d]} | ${e.before != null ? e.before : "—"} | ${e.why} |\n`;
}
writeFileSync("reports/interaction-depth.md", md);

console.log("interaction depth (lessons by deepest component):");
NAMES.forEach((n, i) => {
  const d = after[i] - before[i];
  console.log(
    `  ${i} ${n.padEnd(13)} before ${String(before[i]).padStart(3)}   after ${String(after[i]).padStart(3)}   ${d > 0 ? `+${d}` : d || ""}`,
  );
});
console.log("→ reports/interaction-depth.{json,md}");

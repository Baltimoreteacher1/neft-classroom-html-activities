#!/usr/bin/env node
/**
 * Write an UNGATED inventory of the ACTUAL merged ACCESS Lab data to
 * dist/access-practice-lab/inventory/config.json (path ends in /config.json, so
 * _middleware.js leaves it open even behind the site password). This lets the
 * live deployment be audited from anywhere:
 *   curl https://eduwonderlab.com/access-practice-lab/inventory/config.json
 * It reflects exactly what app.js loads (base + v3–v9 merges, scenes, patches),
 * so it proves whether the new builds are truly live — not just deployed.
 * Never fails the build.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

try {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const labDir = join(root, "access-practice-lab");
  const window = {};
  const modules = ["access-data.js", "access-data-v3.js", "access-data-v4.js",
    "access-data-v5.js", "access-data-v6.js", "access-data-v7.js",
    "access-data-v8.js", "access-data-v9.js"];
  for (const f of modules) eval(readFileSync(join(labDir, f), "utf8"));
  const DATA = window.ACCESS_LAB_DATA;
  for (const V of ["ACCESS_LAB_V3", "ACCESS_LAB_V4", "ACCESS_LAB_V5", "ACCESS_LAB_V6", "ACCESS_LAB_V7"]) {
    const v = window[V];
    if (!v) continue;
    for (const [dn, lv] of Object.entries(v.appendActivities || {})) {
      const d = DATA.domains[dn];
      if (!d) continue;
      for (const [lk, list] of Object.entries(lv)) {
        const L = d.levels[lk];
        if (!L) continue;
        const ex = new Set((L.activities || []).map((a) => a.id));
        L.activities = (L.activities || []).concat(list.filter((a) => a && a.id && !ex.has(a.id)));
      }
    }
  }
  const v8 = window.ACCESS_LAB_V8, v9 = window.ACCESS_LAB_V9;
  let scenes = 0, patched = 0;
  for (const d of Object.values(DATA.domains))
    for (const L of Object.values(d.levels))
      for (const a of L.activities || []) {
        if (v8?.scenes?.[a.id] && !a.scene) { a.scene = v8.scenes[a.id]; scenes++; }
        if (v9?.patches?.[a.id]) { Object.assign(a, v9.patches[a.id]); patched++; }
      }

  const domains = {};
  let total = 0, v7count = 0;
  for (const [dn, d] of Object.entries(DATA.domains)) {
    domains[dn] = {};
    for (const [lk, L] of Object.entries(d.levels)) {
      const acts = (L.activities || []).map((a) => ({ id: a.id, type: a.type }));
      domains[dn][lk] = acts.length;
      total += acts.length;
      v7count += acts.filter((a) => a.id.startsWith("v7-")).length;
    }
  }
  const out = {
    builtAt: new Date().toISOString(),
    commit: process.env.CF_PAGES_COMMIT_SHA || "local",
    totals: { activities: total, v7Activities: v7count, scenesApplied: scenes, v9Patched: patched, tests: (DATA.tests || []).length, dataModules: modules.length },
    perDomainLevel: domains,
  };
  const dir = join(root, "dist", "access-practice-lab", "inventory");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.json"), JSON.stringify(out, null, 1));
  console.log(`gen-access-inventory: ${total} activities (${v7count} v7, ${scenes} scenes, ${patched} patched) → inventory/config.json`);
} catch (e) {
  console.warn("gen-access-inventory: non-fatal —", e.message);
  process.exit(0);
}

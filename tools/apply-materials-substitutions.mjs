#!/usr/bin/env node
// Applies planSubstitutions() (tools/language-page/materials-report.mjs) to the authored unit seeds
// (db/seeds/bcpss/v2/units/<unit>.mjs): materials, tip and support strings of the planned activities, exact-match only.
// Idempotent (an edit already applied is skipped); aborts without writing if any edit cannot be placed exactly once.
// Each rewritten activity gets `materials_revision: "draft: ..."` so the change is visible in the seed.
//   node tools/apply-materials-substitutions.mjs && node tools/build-materials-report.mjs
import fs from "node:fs";
import { loadDataset } from "./language-page/dataset.mjs";
import { planSubstitutions } from "./language-page/materials-report.mjs";

const ROOT = new URL("../db/seeds/bcpss/v2/units/", import.meta.url);
// The plan comes from the live data, not from a file, so a stale proposals file can never be applied.
const { units } = await loadDataset();
const plan = planSubstitutions(units);
const lit = (s) => JSON.stringify(s);
const arrLit = (a) => `[${a.map(lit).join(", ")}]`;

const byUnit = Map.groupBy(plan, (p) => p.unit);
const writes = [];
for (const [unit, items] of byUnit) {
  const file = new URL(`${unit}.mjs`, ROOT);
  let src = fs.readFileSync(file, "utf8");
  for (const item of items) {
    const at = src.indexOf(`title: ${lit(item.title)}`);
    if (at < 0) throw new Error(`${unit}: title ${item.title} not found`);
    const next = src.indexOf("\n    {\n      kind:", at);
    const end = next < 0 ? src.length : next;
    let seg = src.slice(at, end);
    for (const e of item.edits) {
      if (e.field === "materials") {
        const re = /materials: \[[^\]]*\]/;
        const m = re.exec(seg);
        if (!m) throw new Error(`${unit}/${item.title}: no materials array`);
        const now = JSON.parse(m[0].slice("materials: ".length).replace(/'/g, '"'));
        if (JSON.stringify(now) === JSON.stringify(e.to)) continue;
        if (JSON.stringify(now) !== JSON.stringify(e.from))
          throw new Error(`${unit}/${item.title}: materials differ from the plan: ${m[0]}`);
        seg = seg.replace(
          re,
          `materials: ${arrLit(e.to)}, materials_revision: ${lit(`draft: paper-based substitute (audit F-16); was ${e.from.join(" + ")}`)}`,
        );
      } else {
        const from = lit(e.from);
        const to = lit(e.to);
        if (seg.includes(to) && !seg.includes(from)) continue;
        if (seg.split(from).length !== 2)
          throw new Error(`${unit}/${item.title}: ${e.field} text not found exactly once`);
        seg = seg.replace(from, () => to);
      }
    }
    src = src.slice(0, at) + seg + src.slice(end);
  }
  writes.push([file, src]);
}
for (const [file, src] of writes) fs.writeFileSync(file, src);
console.log(`${plan.length} activities in ${writes.length} unit seeds updated`);

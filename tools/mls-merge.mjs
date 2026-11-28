#!/usr/bin/env node
// Merge per-skill draft files into content/mls/skills/gN.json, ordered as in the inventory.
//   node tools/mls-merge.mjs 3            reads /tmp/mls-draft/g3/*.json (each file is ONE skill object) and the existing g3.json
// A draft replaces the same-id skill already in the grade file. Run tools/validate-mls.mjs --grade N afterwards.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const g = Number(process.argv[2]);
if (!(g >= 1 && g <= 8)) {
  console.error("usage: node tools/mls-merge.mjs <grade 1-8>");
  process.exit(2);
}
const inv = JSON.parse(
  fs.readFileSync(path.join(ROOT, "access-practice-lab/content/mls/inventory.json"), "utf8"),
);
const out = path.join(ROOT, `access-practice-lab/content/mls/skills/g${g}.json`);
const have = new Map();
if (fs.existsSync(out))
  for (const s of JSON.parse(fs.readFileSync(out, "utf8")).skills || []) have.set(s.id, s);
const dir = `/tmp/mls-draft/g${g}`;
if (fs.existsSync(dir))
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    try {
      const s = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (!s.id) throw new Error("no id");
      have.set(s.id, s);
    } catch (e) {
      console.error(`skip ${f}: ${e.message}`);
    }
  }
const order = inv.skills.filter((s) => s.grade === g).map((s) => s.id);
const skills = order.filter((id) => have.has(id)).map((id) => have.get(id));
fs.writeFileSync(out, `${JSON.stringify({ grade: g, skills }, null, 1)}\n`);
console.log(
  `g${g}.json: ${skills.length}/${order.length} skills (${order.filter((id) => !have.has(id)).join(", ") || "complete"})`,
);

// Merges authoring parts (math/fluency-lab/content/items/parts/grade-N-*.json) into grade-N.json, sorted by id, last write wins per id.
//   node tools/merge-fluency-content.mjs N
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const grade = process.argv[2];
if (!/^[0-8]$/.test(grade || "")) {
  console.error("usage: node tools/merge-fluency-content.mjs <grade 0-8>");
  process.exit(2);
}
const dir = new URL("../math/fluency-lab/content/items/", import.meta.url);
const parts = readdirSync(new URL("parts/", dir))
  .filter((f) => f.startsWith(`grade-${grade}-`) && f.endsWith(".json"))
  .sort();
const byId = new Map();
for (const f of parts) {
  let list;
  try {
    list = JSON.parse(readFileSync(new URL(`parts/${f}`, dir), "utf8"));
  } catch (e) {
    console.error(`${f}: invalid JSON: ${e.message}`);
    process.exit(1);
  }
  for (const item of list) byId.set(item.id, item);
}
const items = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(new URL(`grade-${grade}.json`, dir), `${JSON.stringify(items, null, 1)}\n`);
console.log(`grade-${grade}.json: ${items.length} items from ${parts.length} part file(s)`);

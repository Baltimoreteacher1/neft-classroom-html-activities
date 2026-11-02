// Validates the Math Fluency Lab item bank (math/fluency-lab/content/items/grade-N.json).
//   node tools/validate-fluency-content.mjs [--grade N] [--report] [--quiet] [--allow-rejects]
// Exit 1 when any item is rejected (unless --allow-rejects, used while authoring). It prints the TRUE counted total per grade.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { buildGraph } from "../math/fluency-lab/e8/knowledge-graph.js";
import { MISCONCEPTIONS } from "../math/fluency-lab/e8/misconception-library.js";
import { CCSS, validateBank } from "./lib/fluency-content.mjs";

const args = process.argv.slice(2);
const only = args.includes("--grade") ? Number(args[args.indexOf("--grade") + 1]) : null;
const quiet = args.includes("--quiet");
const skills = new Set(buildGraph().nodes.keys());
const miscIds = new Set(MISCONCEPTIONS.map((m) => m.id));
const dir = new URL("../math/fluency-lab/content/items/", import.meta.url);

let total = 0;
let rejectedTotal = 0;
const summary = [];
for (let grade = 0; grade <= 8; grade += 1) {
  if (only !== null && only !== grade) continue;
  const file = new URL(`grade-${grade}.json`, dir);
  if (!existsSync(file)) {
    summary.push({ grade, items: 0, counted: 0, rejected: 0 });
    continue;
  }
  let items;
  try {
    items = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`grade-${grade}.json is not valid JSON: ${e.message}`);
    process.exit(1);
  }
  if (!Array.isArray(items)) {
    console.error(`grade-${grade}.json must be an array`);
    process.exit(1);
  }
  const res = await validateBank(items, { skills, misconceptionIds: miscIds });
  total += res.counted.length;
  rejectedTotal += res.rejected.length;
  summary.push({
    grade,
    items: items.length,
    counted: res.counted.length,
    rejected: res.rejected.length,
    over: res.overConceptual,
  });
  if (!quiet)
    for (const r of res.rejected.slice(0, 25)) console.error(`  ${r.id}: ${r.errors.join(" | ")}`);
  if (res.overConceptual.length)
    console.error(
      `  grade ${grade}: too many conceptual (human-review) items: ${(res.overConceptual[0].share * 100).toFixed(0)}%`,
    );
}
for (const s of summary)
  console.log(
    `grade ${s.grade === 0 ? "K" : s.grade}: ${s.counted} counted of ${s.items} authored, ${s.rejected} rejected`,
  );
console.log(
  `TOTAL validated core items: ${total}${rejectedTotal ? `   (${rejectedTotal} rejected)` : ""}`,
);
if (rejectedTotal && !args.includes("--allow-rejects")) process.exit(1);

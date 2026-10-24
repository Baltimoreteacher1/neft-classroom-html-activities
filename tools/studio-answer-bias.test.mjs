/* A multiple-choice item may not give itself away by length: the right choice must not be clearly the longest. English and Spanish. */
import { readdirSync, readFileSync } from "node:fs";

const DIR = "data/practice-studio";
const MARGIN = 1.15; // the right choice may be at most 15% longer than the longest wrong choice
const bad = [];
let items = 0;
const longest = (arr, a) => {
  const rights = String(arr[a] ?? "").length;
  const wrongMax = Math.max(...arr.map((c, i) => (i === a ? 0 : String(c).length)));
  return wrongMax > 0 && rights > wrongMax * MARGIN && rights - wrongMax >= 4;
};
const walk = (lesson, where, list) => {
  for (const it of Array.isArray(list) ? list : []) {
    if (!it || typeof it !== "object") continue;
    if (Array.isArray(it.items)) walk(lesson, `${where}.pool`, it.items);
    if (it.k !== "mc" || !Array.isArray(it.c) || typeof it.a !== "number") continue;
    items++;
    if (longest(it.c, it.a))
      bad.push(
        `${lesson} ${where}: EN right choice is clearly the longest (${JSON.stringify(it.c[it.a]).slice(0, 60)})`,
      );
    if (Array.isArray(it.cEs) && it.cEs.length === it.c.length && longest(it.cEs, it.a))
      bad.push(`${lesson} ${where}: ES right choice is clearly the longest`);
  }
};
for (const f of readdirSync(DIR).filter((n) => /^\d+-\d+\.json$/.test(n))) {
  const d = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8"));
  const id = f.replace(".json", "");
  walk(id, "fresh", d.fresh);
  walk(id, "mastery", d.mastery);
  for (const [k, v] of Object.entries(d.challenge || {})) walk(id, `challenge.${k}`, v);
  for (const k of ["practice", "challenge"]) {
    const m = d.moves?.[k];
    if (m && Array.isArray(m.c) && typeof m.a === "number") {
      items++;
      if (longest(m.c, m.a)) bad.push(`${id} moves.${k}: EN right choice is clearly the longest`);
      if (Array.isArray(m.cEs) && m.cEs.length === m.c.length && longest(m.cEs, m.a))
        bad.push(`${id} moves.${k}: ES right choice is clearly the longest`);
    }
  }
}
if (bad.length) {
  console.error(
    `${bad.length} item(s) where the right choice is clearly the longest (of ${items} multiple-choice items):`,
  );
  for (const b of bad.slice(0, 80)) console.error(`  ${b}`);
  if (bad.length > 80) console.error(`  ... and ${bad.length - 80} more`);
  process.exit(1);
}
console.log(
  `studio-answer-bias: ${items} multiple-choice items, none gives itself away by length.`,
);

// Goal bank gate: every band file has the five domains, six goals (two per proficiency range), eight steps and five
// evidence lines per domain, in English and Spanish, with unique ids and links that point at real activities.
// Usage: node tools/goals-content.test.mjs [--band K|1|2-3|4-5|6-8|9-12]
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bandHasLink,
  GOAL_BANDS,
  GOAL_DOMAINS,
  LINK_KINDS,
} from "../access-practice-lab/src/goals/model.js";

const ROOT = join(
  fileURLToPath(new URL("..", import.meta.url)),
  "access-practice-lab",
  "content",
  "goals",
);
const arg = process.argv.indexOf("--band");
const bands = arg > 0 ? [process.argv[arg + 1]] : GOAL_BANDS;
const problems = [];
const bad = (w, m) => problems.push(`${w}: ${m}`);
const txt = (v, min = 3) => typeof v === "string" && v.trim().length >= min;
const ids = new Set();
let goals = 0;
for (const band of bands) {
  const file = join(ROOT, `${band}.json`);
  if (!existsSync(file)) {
    bad(band, "missing file");
    continue;
  }
  const d = JSON.parse(readFileSync(file, "utf8"));
  if (d.band !== band) bad(band, "band field");
  for (const dom of GOAL_DOMAINS) {
    const D = d.domains?.[dom];
    const w = `${band}/${dom}`;
    if (!D) {
      bad(w, "missing domain");
      continue;
    }
    if (D.goals?.length !== 6) bad(w, "needs 6 goals");
    const ranges = {};
    for (const g of D.goals || []) {
      goals += 1;
      if (ids.has(g.id)) bad(w, `duplicate id ${g.id}`);
      ids.add(g.id);
      if (!g.id?.startsWith(`${band.replace("-", "")}-`))
        bad(w, `id ${g.id} must start with ${band.replace("-", "")}-`);
      if (!txt(g.en) || !txt(g.es) || !txt(g.teacher, 12) || !txt(g.teacherEs, 12))
        bad(w, `${g.id}: en/es/teacher/teacherEs`);
      if (g.en === g.es) bad(w, `${g.id}: Spanish copies English`);
      if (!/^(I |My |Puedo|Voy|Mi |Yo )/.test(g.en) && !/^(I |My )/.test(g.en))
        bad(w, `${g.id}: student goal starts with I/My`);
      if (!/^(Student|The student)/.test(g.teacher))
        bad(w, `${g.id}: teacher text starts with "Student will"`);
      if (!Array.isArray(g.lv) || g.lv.length !== 2 || g.lv[0] > g.lv[1]) bad(w, `${g.id}: lv`);
      else ranges[g.lv.join("-")] = (ranges[g.lv.join("-")] || 0) + 1;
      if (/timer|countdown|\brace\b|\bESOL\b/i.test(JSON.stringify(g)))
        bad(w, `${g.id}: banned wording`);
      if (g.link && !(LINK_KINDS.includes(g.link.kind) && bandHasLink(band, g.link)))
        bad(w, `${g.id}: link not available for this band`);
    }
    if (!(ranges["1-2"] === 2 && ranges["3-4"] === 2 && ranges["5-6"] === 2))
      bad(w, `needs two goals per range 1-2, 3-4, 5-6 (${JSON.stringify(ranges)})`);
    if (D.steps?.length !== 8) bad(w, "needs 8 steps");
    for (const s of D.steps || []) {
      if (ids.has(s.id)) bad(w, `duplicate id ${s.id}`);
      ids.add(s.id);
      if (!txt(s.en, 8) || !txt(s.es, 8) || s.en === s.es) bad(w, `${s.id}: en/es`);
      if (s.link && !(LINK_KINDS.includes(s.link.kind) && bandHasLink(band, s.link)))
        bad(w, `${s.id}: link not available for this band`);
    }
    if (D.evidence?.length !== 5) bad(w, "needs 5 evidence lines");
    for (const e of D.evidence || [])
      if (!txt(e.en, 6) || !txt(e.es, 6) || e.en === e.es) bad(w, "evidence en/es");
    const linked = [...(D.goals || []), ...(D.steps || [])].filter((x) => x.link).length;
    if (dom !== "habits" && linked < 3)
      bad(w, "link at least 3 goals/steps to real Language Page activities");
  }
}
if (problems.length) {
  console.error(
    `FAIL goals-content: ${problems.length} problem(s)\n${problems.slice(0, 60).join("\n")}`,
  );
  process.exit(1);
}
assert.ok(goals > 0, "swept zero goals");
console.log(`PASS goals-content: ${goals} goals, bands ${bands.join(", ")}`);

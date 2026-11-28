#!/usr/bin/env node
// Writes access-practice-lab/content/mls/index.json: one small summary per skill (title, domain, vocabulary terms, keywords) that the landing
// page, search and the skill browser load instead of all eight grade files. Generated: never edit by hand. `--check` fails when stale.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const C = path.join(ROOT, "access-practice-lab/content/mls");
const inv = JSON.parse(fs.readFileSync(path.join(C, "inventory.json"), "utf8"));
const content = new Map();
for (let g = 1; g <= 8; g++) {
  const f = path.join(C, `skills/g${g}.json`);
  if (fs.existsSync(f))
    for (const s of JSON.parse(fs.readFileSync(f, "utf8")).skills) content.set(s.id, s);
}
const STOP = new Set(
  "a an and are as at be by can for from how in is it its of on or that the their them they this to with use using when which who will your students student".split(
    " ",
  ),
);
const skills = inv.skills.map((s) => {
  const c = content.get(s.id);
  const words = new Set();
  for (const t of [c?.objective, c?.bigIdea, ...(c?.languageDemands?.vocabulary || [])])
    for (const w of String(t || "")
      .toLowerCase()
      .match(/[a-z]{4,}/g) || [])
      if (!STOP.has(w)) words.add(w);
  return {
    id: s.id,
    grade: s.grade,
    title: s.title,
    domain: s.domain,
    family: s.family,
    codes: s.standards.codes,
    terms: (c?.vocab || []).map((v) => v.term),
    keywords: [...words].slice(0, 24),
    authored: !!c,
  };
});
const out = `${JSON.stringify({ generatedBy: "tools/build-mls-index.mjs", counts: { skills: skills.length, authored: skills.filter((s) => s.authored).length }, skills })}\n`;
const dest = path.join(C, "index.json");
if (process.argv.includes("--check")) {
  if (!fs.existsSync(dest) || fs.readFileSync(dest, "utf8") !== out) {
    console.error("mls index is stale: run node tools/build-mls-index.mjs");
    process.exit(1);
  }
  console.log("mls index is current");
} else {
  fs.writeFileSync(dest, out);
  console.log(
    `index.json: ${skills.length} skills, ${skills.filter((s) => s.authored).length} authored`,
  );
}

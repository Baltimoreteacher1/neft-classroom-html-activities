#!/usr/bin/env node
/**
 * Language Quest content gate: every mission under access-practice-lab/content/quest/missions is checked against the
 * schema in src/quest/engine.js (validateMission), plus the cross-file rules no single mission can see: unique ids, every
 * world has a mission, both grade bands are used, worlds link to a Language Adventures folder that exists on disk, every
 * character is defined once, and no mission names a student, a SPED label or a proficiency level.
 *
 *   node tools/validate-quest.mjs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { validateMission } from "../access-practice-lab/src/quest/engine.js";

const ROOT = new URL("../", import.meta.url).pathname;
const DIR = join(ROOT, "access-practice-lab/content/quest");
const read = (f) => JSON.parse(readFileSync(join(DIR, f), "utf8"));
const { worlds } = read("worlds.json");
const { characters } = read("characters.json");
const files = readdirSync(join(DIR, "missions"))
  .filter((f) => f.endsWith(".json"))
  .sort();
const problems = [];
const fail = (m) => problems.push(m);

for (const w of worlds) {
  if (!w.name?.en || !w.name?.es || !w.tagline?.en || !w.tagline?.es)
    fail(`world ${w.id}: bilingual name and tagline required`);
  if (!existsSync(join(ROOT, w.link.replace(/^\//, ""), "index.html")))
    fail(`world ${w.id}: link ${w.link} has no index.html on disk`);
  if (!characters.some((c) => c.id === w.character))
    fail(`world ${w.id}: unknown character ${w.character}`);
}
for (const c of characters) {
  for (const k of ["intro", "hint", "elaborate", "recognize", "revise", "next"])
    if (!c.lines?.[k]?.en || !c.lines?.[k]?.es)
      fail(`character ${c.id}: line "${k}" needs English and Spanish`);
}
const ids = new Set();
const missions = [];
for (const f of files) {
  let m;
  try {
    m = read(`missions/${f}`);
  } catch (e) {
    fail(`${f}: invalid JSON (${e.message})`);
    continue;
  }
  if (`${m.id}.json` !== f) fail(`${f}: file name must match id "${m.id}"`);
  if (ids.has(m.id)) fail(`${f}: duplicate id`);
  ids.add(m.id);
  for (const p of validateMission(m, {
    worlds: worlds.map((w) => w.id),
    characters: characters.map((c) => c.id),
  }))
    fail(`${m.id}: ${p}`);
  const text = JSON.stringify(m);
  if (
    /\b(wida level|proficiency level|entering|emerging|developing|expanding|bridging)\b/i.test(
      JSON.stringify(m.stages) + m.narrative,
    )
  )
    fail(`${m.id}: student-facing text names a proficiency level`);
  if (/\b(IEP|SPED|M\.E\.|R\.B\.|J\.C\.|R\.M\.G\.|J\.L\.|S\.D\.L\.P\.|A\.M\.M\.)\b/.test(text))
    fail(`${m.id}: contains a SPED label or student initials`);
  missions.push(m);
}
for (const w of worlds)
  if (!missions.some((m) => m.world === w.id)) fail(`world ${w.id} has no mission`);
for (const b of ["3-5", "6-8"])
  if (!missions.some((m) => m.band === b)) fail(`no mission for grades ${b}`);

// The catalog the browser loads: everything about a mission except its items, so the hub and the teacher catalog stay small.
const catalog = {
  version: 1,
  worlds,
  characters,
  missions: missions.map((m) => ({
    id: m.id,
    world: m.world,
    band: m.band,
    title: m.title,
    objective: m.objective,
    success: m.success,
    domains: m.domains,
    functions: m.functions,
    keyUses: m.keyUses,
    minutes: m.minutes,
    tags: m.tags || [],
    vocab: m.vocab,
    family: m.family,
    characters: m.characters,
    theme: m.scene.theme,
    narrative: m.narrative,
    stages: m.stages.map((s) => ({
      id: s.id,
      title: s.title,
      items: s.items.map((i) => ({ id: i.id, kind: i.kind })),
    })),
  })),
};
const catalogText = `${JSON.stringify(catalog, null, 1)}\n`;
const catalogPath = join(DIR, "index.json");
if (process.argv.includes("--write")) writeFileSync(catalogPath, catalogText);
else if (!existsSync(catalogPath) || readFileSync(catalogPath, "utf8") !== catalogText)
  fail("content/quest/index.json is stale: run node tools/validate-quest.mjs --write");

if (problems.length) {
  console.error(`validate-quest: FAIL (${problems.length})\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
const byWorld = Object.fromEntries(
  worlds.map((w) => [
    w.id,
    missions.filter((m) => m.world === w.id).map((m) => `${m.id} (${m.band})`),
  ]),
);
console.log(
  `validate-quest: PASS ${missions.length} missions, ${worlds.length} worlds, ${characters.length} characters`,
);
for (const [w, list] of Object.entries(byWorld)) console.log(`  ${w}: ${list.join(", ")}`);

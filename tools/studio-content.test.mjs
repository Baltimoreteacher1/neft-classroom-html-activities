// Practice Studio content: every wrong multiple-choice answer names a real misconception, Spanish is complete, and no
// wrong choice is secretly the right answer.
//
// Source of truth: data/practice-studio/misconceptions.json (the named traps, EN + ES, with a quick fix). A multiple-choice
// item's `tag` is a per-choice array aligned to `c`, null at the right answer, each entry a trap id. Items authored in
// data/practice-studio/<lesson>.json carry `tag` themselves. Items converted from the lesson's config.json take the lesson's
// own `misconceptionTags` (engine ids, which are also trap ids, marked engine:true); where those leave a wrong choice
// unnamed, the studio file's `configTags` names it: { "<exact stem>": [tag, null, tag, tag] } replaces the whole array.
//
// What FAILS for every item authored in a studio file, and for converted config items in units not on PENDING_UNITS:
//   - a wrong choice with no tag, or a tag that is not in misconceptions.json
//   - a choice with words ("146 boxes", "The range") and no `cEs`
// What FAILS in every unit:
//   - two choices with the same value and unit ("2" and "6/3"), except the KNOWN_TWINS below
//   - a tag on the right answer, a tag[] or cEs[] that does not line up with c[]
//   - a `configTags` key that matches no converted item, or whose array is the wrong length or tags the right answer
//   - a malformed taxonomy entry (name over 6 words, missing Spanish, engine:true that the engine does not define)
//   - a generated page that does not carry the name of a trap its items use (rerun the generator)
//   - a data/practice-studio/generator-traps.json entry that maps a generator's tag to an id not in misconceptions.json
//     (every tag a generator actually emits is checked over 300 seeds x 4 levels by tools/studio-gen.test.mjs)
// Reported, never failed: right-answer positions that are lopsided within a lesson.
//
// To tag another unit (say Unit 3):
//   1. node tools/studio-content.test.mjs --list 3     prints every wrong choice in Unit 3 with its feedback and current tag
//   2. Tag each one with a trap id: in data/practice-studio/3-*.json edit `tag`; for config items add `configTags`.
//      Use an existing trap whenever it fits; add a trap to misconceptions.json only for a genuinely new idea
//      (name + nameEs <= 6 words, desc, fix and Spanish for each, never the answer to a specific item).
//   3. Fill `cEs` for authored items and `choicesEs` in lessons/3-*/config.json for config items.
//   4. Remove 3 from PENDING_UNITS (it lists units whose CONVERTED config items are not tagged yet), run this test and `node scripts/generate-practice-studios.mjs`, commit both.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MISCONCEPTIONS } from "@eduwonderlab/engine/core/misconceptions.js";
import { STUDIO_UNITS } from "../scripts/generate-practice-studios.mjs";
import { buildSections } from "../scripts/lib/practice-studio-config.mjs";
import {
  choiceValue,
  equivalentChoices,
  mcProblems,
  needsSpanish,
  taxonomyProblems,
} from "../scripts/lib/practice-studio-content.mjs";
import { generatorTrapProblems } from "../scripts/lib/practice-studio-traps.mjs";
import { listLessonDirs, loadLessonConfig, REPO_ROOT } from "./lib/curriculum-source.mjs";

/**
 * Units whose CONVERTED lesson-config items are not yet tagged (no `configTags` yet). Items authored in the studio file are
 * checked strictly in every unit. Remove a unit once its config items are named.
 */
const PENDING_UNITS = [];

/**
 * Wrong choices that share a value, already known and being fixed elsewhere (`lesson|stem`). Listed here so the gate can
 * land before the fix; a listed item that no longer has twins is reported so its line can be deleted.
 */
const KNOWN_TWINS = new Set([]);

const read = (/** @type {string} */ rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const { traps } = JSON.parse(read("data/practice-studio/misconceptions.json"));
const worlds = JSON.parse(read("data/practice-studio/worlds.json"));
const unitOf = (/** @type {string} */ id) => Number(id.split("-")[0]);
const problems = [];

/* ---- the detectors catch what they are for (a gate that stops firing reports a clean studio) ---- */
assert.deepEqual(equivalentChoices(["2", "3", "6/3", "18"]), [0, 2]);
assert.deepEqual(equivalentChoices(["1 1/8", "2", "3/4", "9/8"]), [0, 3]);
assert.deepEqual(equivalentChoices(["50%", "0.5", "5"]), [0, 1]);
assert.deepEqual(equivalentChoices(["$2,800", "2800", "28"]), [0, 1]);
assert.equal(equivalentChoices(["36 m²", "36 m", "13 m²"]), null, "different units are different");
assert.equal(equivalentChoices(["7x", "7x²", "12x"]), null, "different variables are different");
assert.equal(equivalentChoices(["5 tenths", "5 hundredths", "50"]), null);
assert.equal(choiceValue("Range 12.5, IQR 26"), null, "a choice with words is not a number");
assert.ok(needsSpanish("146 boxes") && needsSpanish("The range") && needsSpanish("about $28"));
assert.ok(
  !needsSpanish("12") &&
    !needsSpanish("$4.50") &&
    !needsSpanish("36 cm²") &&
    !needsSpanish("118 R3"),
);
{
  const it = { c: ["1", "2", "3"], a: 1, tag: ["stat-center-vs-spread", null, null] };
  assert.ok(
    mcProblems(it, "t", traps, true).some((m) => m.includes("choice 2")),
    "untagged distractor",
  );
  assert.ok(
    mcProblems({ ...it, tag: ["no-such-trap", null, "stat-center-vs-spread"] }, "t", traps, true)
      .length,
  );
  assert.ok(
    mcProblems({ ...it, tag: [null, "stat-center-vs-spread", null] }, "t", traps, false).length,
  );
  assert.equal(
    mcProblems(it, "t", traps, false).length,
    0,
    "a pending unit only fails on structure",
  );
  assert.ok(
    mcProblems(
      { c: ["The mean", "The median"], a: 0, tag: [null, "stat-mean-vs-median"] },
      "t",
      traps,
      true,
    ).length,
    "text choices without Spanish",
  );
}

/* ---- the taxonomy ---- */
problems.push(...taxonomyProblems(traps, new Set(Object.keys(MISCONCEPTIONS)), STUDIO_UNITS));
problems.push(
  ...generatorTrapProblems(JSON.parse(read("data/practice-studio/generator-traps.json")), traps),
);
const count = Object.keys(traps).length;
assert.ok(
  count >= 40 && count <= 190,
  `misconceptions.json should hold 40-190 traps, has ${count}`,
);

/* ---- every rendered multiple-choice item ---- */
const ids = listLessonDirs({ filter: /^\d+-\d+$/ })
  .filter((id) => STUDIO_UNITS.includes(unitOf(id)))
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const listUnit = process.argv.includes("--list") ? Number(process.argv.at(-1)) : null;
const twinsSeen = new Set();
const warnings = [];
const stats = { items: 0, wrong: 0, named: 0 };
for (const id of ids) {
  const cfg = loadLessonConfig(id);
  const ld = JSON.parse(read(`data/practice-studio/${id}.json`));
  const unitStrict = !PENDING_UNITS.includes(unitOf(id));
  const { sections } = buildSections(cfg, ld, worlds, id);
  const authored = new Set();
  (function walk(/** @type {any} */ o) {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") {
      if (o.k === "mc") authored.add(JSON.stringify([o.q, o.c]));
      for (const [k, v] of Object.entries(o)) if (k !== "configTags") walk(v);
    }
  })(ld);
  const configStems = new Set();
  const seen = new Set();
  const positions = [0, 0, 0, 0];
  for (const mode of /** @type {const} */ (["practice", "challenge"]))
    sections[mode].forEach((/** @type {any} */ sec, /** @type {number} */ si) => {
      for (const it of [...sec.items, ...(sec.pool || [])]) {
        if (it.k !== "mc") continue;
        const key = JSON.stringify([it.q, it.c]);
        if (!authored.has(key)) configStems.add(it.q);
        if (seen.has(key)) continue;
        seen.add(key);
        stats.items++;
        if (it.c.length === 4) positions[it.a]++;
        const where = `${id} ${mode} s${si + 1} "${String(it.q).slice(0, 60)}"`;
        const found = mcProblems(it, where, traps, unitStrict || authored.has(key));
        if (KNOWN_TWINS.has(`${id}|${it.q}`) && equivalentChoices(it.c)) {
          twinsSeen.add(`${id}|${it.q}`);
          found.splice(0, found.length, ...found.filter((m) => !m.includes("have the same value")));
        }
        problems.push(...found);
        it.c.forEach((/** @type {string} */ c, /** @type {number} */ i) => {
          if (i === it.a) return;
          stats.wrong++;
          if (Array.isArray(it.tag) && traps[it.tag[i]]) stats.named++;
          if (listUnit === unitOf(id))
            console.log(
              `${where} [${authored.has(key) ? "studio file" : "config"}] #${i} "${c}" tag=${(it.tag || [])[i] ?? "-"} | ${(it.f || [])[i] ?? ""}`,
            );
        });
      }
    });
  for (const [stem, tags] of Object.entries(ld.configTags || {})) {
    if (!configStems.has(stem))
      problems.push(`${id}.configTags: "${stem.slice(0, 60)}" matches no converted config item`);
    for (const mode of /** @type {const} */ (["practice", "challenge"]))
      for (const sec of sections[mode])
        for (const it of [...sec.items, ...(sec.pool || [])])
          if (
            it.k === "mc" &&
            it.q === stem &&
            (!Array.isArray(tags) || tags.length !== it.c.length)
          )
            problems.push(
              `${id}.configTags: "${stem.slice(0, 60)}" must have one entry per choice`,
            );
  }
  const four = positions.reduce((a, b) => a + b, 0);
  if (four >= 8 && positions.some((n) => n === 0 || n / four > 0.45))
    warnings.push(`${id}: right-answer positions A/B/C/D = ${positions.join("/")}`);

  /* the generated pages carry the name of every trap their items use */
  for (const sub of ["", "challenge/"]) {
    const html = read(`math/practice-studio/${id}/${sub}index.html`);
    const m = /id="studio-data">([\s\S]*?)<\/script>/.exec(html);
    assert.ok(m, `${id} ${sub || "practice"} ships its data`);
    const data = JSON.parse(m[1].replace(/\\u003c/g, "<"));
    for (const sec of data.sections)
      for (const it of [...sec.items, ...(sec.pool || [])])
        for (const t of Array.isArray(it.tag) ? it.tag : [])
          if (
            t &&
            traps[t] &&
            (data.traps?.[t]?.n !== traps[t].name || data.traps[t].nEs !== traps[t].nameEs)
          )
            problems.push(
              `math/practice-studio/${id}/${sub}: page does not carry trap "${t}"; run node scripts/generate-practice-studios.mjs`,
            );
  }
}
for (const k of KNOWN_TWINS)
  if (!twinsSeen.has(k)) warnings.push(`KNOWN_TWINS entry no longer has twins, delete it: ${k}`);

if (warnings.length) console.log(`studio-content (report only):\n  ${warnings.join("\n  ")}`);
const unique = [...new Set(problems)];
assert.equal(
  unique.length,
  0,
  `${unique.length} studio content problems:\n  ${unique.slice(0, 40).join("\n  ")}`,
);
console.log(
  `studio-content: ${count} traps; ${stats.items} multiple-choice items, ${stats.named} of ${stats.wrong} wrong choices named; pending units ${PENDING_UNITS.join(", ") || "none"}.`,
);

// A lesson's Connect figure goes only on the Connect questions that use it.
//
// Until 2026-10-21 the studio converter attached the Connect figure to EVERY Connect question, so 2-1's mastery check showed
// the "Goals scored by a player" dot plot under "How tall are the students in my class?" (and, under "Which question is
// statistical?", a plot of per-player data that hints the answer); 2-4 showed Team B's box under "What is Team A's IQR?";
// 7-9 plotted and labelled the reflected points under "Where is the ship after reflecting (3, 2)?". The rule lives in
// scripts/lib/practice-studio-config.mjs (figureServes). This proves the rule on fixtures, pins the shipped cases against the
// real lesson configs, and checks every generated studio page against the rule.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { STUDIO_UNITS } from "../scripts/generate-practice-studios.mjs";
import {
  buildSections,
  convertItems,
  diagramToViz,
  figureServes,
} from "../scripts/lib/practice-studio-config.mjs";
import { listLessonDirs, loadLessonConfig, REPO_ROOT } from "./lib/curriculum-source.mjs";

const mc = (q, c = ["a", "b", "c", "d"], a = 0) => ({ k: "mc", q, c, a });

/* ---- the rule, on fixtures ----------------------------------------------------------------------- */
const dots = {
  kind: "dot-plot",
  title: "Goals Scored This Season",
  xLabel: "Goals scored by a player",
  values: [0, 1, 2, 6],
};
assert.equal(
  figureServes(mc("Which of these is a statistical question?"), dots).use,
  false,
  "unrelated stem",
);
assert.equal(
  figureServes(mc("Which value appears most on the dot plot?"), dots).use,
  true,
  "names the figure",
);
assert.equal(
  figureServes(mc("How many goals did the top scorer get?"), dots).use,
  true,
  "names what is plotted",
);
assert.equal(
  figureServes(mc("Is 6 an unusual value here?"), dots).use,
  true,
  "cites a plotted value",
);

const box = {
  kind: "box-plot",
  title: "Team B Points Per Game",
  min: 35,
  q1: 55,
  median: 61,
  q3: 65,
  max: 80,
};
assert.equal(
  figureServes(mc("What is Team A's IQR?"), box).use,
  false,
  "another group than the one drawn",
);
assert.equal(figureServes(mc("What is Team B's IQR?"), box).use, true, "the group drawn");

const plane = {
  kind: "coordinate-plane",
  title: "Ship Placement",
  max: 4,
  points: [
    { x: 3, y: 2, label: "Ship (3, 2)" },
    { x: -3, y: 2, label: "Enemy (-3, 2)" },
  ],
};
assert.equal(
  figureServes(
    mc("Reflect (3, 2) over the y-axis.", ["(2, 3)", "(−3, 2)", "(3, −2)", "(−3, −2)"], 1),
    plane,
  ).use,
  false,
  "the figure plots the right answer and not the other choices",
);
assert.equal(
  figureServes(mc("Which point is farthest left?", ["(3, 2)", "(−3, 2)", "They tie"], 1), plane)
    .use,
  true,
  "every point the choices name is plotted: reading the figure is the task",
);
assert.equal(
  figureServes(mc("Reflecting over the y-axis changes which coordinate?"), plane).use,
  false,
  "conceptual",
);

/* ---- the shipped cases, against the real configs -------------------------------------------------- */
const decide = (id) => {
  const cfg = loadLessonConfig(id);
  return convertItems([].concat(cfg.connect.check || []), {}).map(
    (it) => figureServes(it, cfg.connect.diagram).use,
  );
};
const PINS = {
  "2-1": [false, false, false], // the brief's example: none of the three is about the goals plot
  "2-2": [true, true, true], // all three read the histogram
  "2-4": [false, true, true], // Team A's IQR under Team B's box
  "2-5": [true, false, false], // Class B under Class A's box
  "5-1": [true, false, false], // tiles and "why height" do not use the courtyard's corners
  "7-8": [true, true, true], // every location is on the map
  "7-9": [false, false, false], // the reflections are plotted and labelled
};
for (const [id, want] of Object.entries(PINS))
  assert.deepEqual(decide(id), want, `${id}: which Connect questions carry the figure`);

/* ---- every generated studio follows the rule ------------------------------------------------------ */
// tools/practice-studios.test.mjs proves each page on disk is exactly the generator's output; this reads the sections the
// generator renders.
const json = (rel) => JSON.parse(readFileSync(join(REPO_ROOT, rel), "utf8"));
const worlds = json("data/practice-studio/worlds.json");
const GIVEN = new Set(["histogram", "dot-plot", "box-plot", "coordinate-plane"]);
let kept = 0;
let dropped = 0;
for (const id of listLessonDirs({ filter: /^\d+-\d+$/ })) {
  if (!STUDIO_UNITS.includes(Number(id.split("-")[0]))) continue;
  const cfg = loadLessonConfig(id);
  const d = cfg.connect?.diagram;
  if (!GIVEN.has(d?.kind)) continue;
  const picture = diagramToViz(d);
  if (!picture) continue;
  const { sections } = buildSections(cfg, json(`data/practice-studio/${id}.json`), worlds, id);
  const shown = [...sections.practice, ...sections.challenge].flatMap((s) => [
    ...s.items,
    ...(s.pool || []),
  ]);
  for (const it of convertItems([].concat(cfg.connect.check || []), {})) {
    if (it.viz) continue; // an item's own figure is the author's choice
    const use = figureServes(it, d).use;
    use ? kept++ : dropped++;
    const on = shown.filter((x) => x.q === it.q);
    assert.ok(on.length, `${id}: "${it.q}" is in the studio`);
    for (const x of on)
      assert.equal(
        isDeepStrictEqual(x.viz, picture),
        use,
        `${id}: "${it.q.slice(0, 60)}" ${use ? "needs" : "must not carry"} the Connect figure`,
      );
  }
}
assert.ok(
  kept >= 15 && dropped >= 10,
  `swept ${kept} kept and ${dropped} dropped; the sweep found too few`,
);
assert.ok(isDeepStrictEqual(decide("2-3"), [true, true, true]), "2-3 reads its quiz-score plot");
console.log(`studio-connect-figure: ${kept} Connect questions keep the figure, ${dropped} do not`);

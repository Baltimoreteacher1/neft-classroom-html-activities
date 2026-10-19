// The lab bench inside the Practice Studios (docs/specs/practice-studio-v2.md section 10).
//
// Three things can go wrong that no per-file gate sees: (1) a goal or a mission puzzle that no setting of its control reaches,
// which the student can never solve; (2) a page that lost the bench items its data file authors (or carries items the data file
// does not), so a lesson silently reverts to a studio without its lab; (3) a bench item whose id collides with a generated one,
// which would move a child's saved progress. This re-derives all three from the sources, independent of the generator.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { controls, evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { STUDIO_UNITS } from "../scripts/generate-practice-studios.mjs";
import {
  benchItems,
  benchProblems,
  goalType,
  missionProblems,
  targetSolutions,
} from "../scripts/lib/practice-studio-bench.mjs";
import { listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";

const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const labs = JSON.parse(read("data/learning-labs.json"));
const ids = listLessonDirs({ filter: /^\d+-\d+$/ })
  .filter((id) => STUDIO_UNITS.includes(Number(id.split("-")[0])))
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

/* ---- the detector first: a known-bad bench must be refused ------------------------------------------- */
{
  const good = JSON.parse(read("data/practice-studio/3-3.json")).bench;
  assert.deepEqual(benchProblems("3-3", good, labs), [], "the shipped 3-3 bench is clean");
  const unreachable = structuredClone(good);
  unreachable.explore.goal = { target: 34, free: 2 }; // 3 per carriage never makes 34
  assert.ok(
    benchProblems("3-3", unreachable, labs).some((m) => /no setting/.test(m)),
    "an unreachable target is refused",
  );
  const leaks = structuredClone(good);
  leaks.explore.h[2] = "Use 11 carriages.";
  assert.ok(
    benchProblems("3-3", leaks, labs).some((m) => /hint states the answer/.test(m)),
    "a hint that states the solving value is refused",
  );
  const wrongLab = structuredClone(good);
  wrongLab.lab = "math-detectives";
  assert.ok(
    benchProblems("3-3", wrongLab, labs).some((m) => /does not cover lesson/.test(m)),
    "a lab that does not cover the lesson is refused",
  );
  const noEs = structuredClone(good);
  noEs.stretch.qEs = noEs.stretch.q;
  assert.ok(
    benchProblems("3-3", noEs, labs).some((m) => /Spanish sibling/.test(m)),
    "English copied into the Spanish field is refused",
  );
}

/* ---- the difficulty ladder rises with the student and stops at the top (it used to wrap to the easiest) ---- */
{
  const { missionLevel } = await import("../curriculum/learning-labs/shared/expedition.mjs");
  for (let tier = 0; tier < 3; tier++) {
    let last = -1;
    for (let adapt = -1; adapt <= 4; adapt++) {
      const level = missionLevel(tier, adapt);
      assert.ok(level >= 0 && level <= 2, `level ${level} stays inside 0-2`);
      assert.ok(
        level >= last,
        `level never falls as the student does better (tier ${tier}, adapt ${adapt})`,
      );
      last = level;
    }
  }
  assert.equal(missionLevel(2, 1), 2, "a stretch student who restores cleanly stays at the top");
  assert.equal(missionLevel(0, 0), 0);
  assert.ok(missionLevel(1, 1) > missionLevel(1, 0), "a clean restore raises the next puzzle");
}

/* ---- the game speaks Spanish: every lab's world has its Spanish text, three places ----------------------- */
{
  const { expeditionWorlds } = await import(
    "../curriculum/learning-labs/shared/expedition-worlds.mjs"
  );
  const { expeditionWorldsEs } = await import(
    "../curriculum/learning-labs/shared/expedition-worlds-es.mjs"
  );
  for (const [id, w] of Object.entries(expeditionWorlds)) {
    const es = expeditionWorldsEs[id];
    assert.ok(es?.goal && es.brief, `${id} has a Spanish goal and brief`);
    assert.equal(
      es.locations.length,
      w.locations.length,
      `${id} has Spanish names for every place`,
    );
    assert.notEqual(es.goal, w.goal, `${id} goal is translated`);
  }
  assert.deepEqual(
    Object.keys(expeditionWorldsEs).sort(),
    Object.keys(expeditionWorlds).sort(),
    "no stray worlds",
  );
}

/* ---- the learning labs' own mission puzzles are plannable too (the engine is shared) ------------------- */
{
  const { blueprints } = await import("./learning-labs/blueprints.mjs");
  for (const lab of blueprints)
    assert.deepEqual(
      missionProblems(lab.model, lab.id),
      [],
      `${lab.id} mission puzzles are plannable`,
    );
}

/* ---- every authored bench ------------------------------------------------------------------------------ */
let benches = 0;
let goals = 0;
let puzzles = 0;
const pageData = (rel) => {
  const m = read(rel).match(/id="studio-data">([\s\S]*?)<\/script>/);
  assert.ok(m, `${rel} ships its data`);
  return JSON.parse(m[1].replace(/\\u003c/g, "<"));
};

for (const id of ids) {
  const ld = JSON.parse(read(`data/practice-studio/${id}.json`));
  if (!ld.bench) continue;
  benches++;
  const bench = ld.bench;
  assert.deepEqual(benchProblems(id, bench, labs), [], `${id} bench is clean`);

  // every goal is reachable by search, on the model the item ships
  for (const name of ["explore", "stretch"]) {
    const goal = bench[name].goal;
    const fields = controls(bench.model);
    goals++;
    if (goalType(goal) === "target") {
      const sols = targetSolutions(bench.model, goal);
      assert.ok(sols.length >= 1, `${id} ${name}: some setting reaches ${goal.target}`);
      const start = evaluate(bench.model, bench.model.values).value;
      assert.notEqual(start, goal.target, `${id} ${name} does not start solved`);
      for (const v of sols) {
        const f = fields[goal.free];
        assert.ok(v >= f.min && v <= f.max, `${id} ${name}: solution inside the control's range`);
      }
    }
  }

  // the mission: every tier x round x adaptive shift builds a puzzle its free control can solve
  for (let level = 0; level < 3; level++)
    for (let round = 0; round < 3; round++) {
      const p = puzzle(bench.model, round, level);
      const f = controls(bench.model)[p.free];
      const n = p.goal[p.free];
      assert.ok(n >= f.min && n <= f.max, `${id} mission r${round} L${level}: target in range`);
      assert.ok(
        Math.abs((n - f.min) / f.step - Math.round((n - f.min) / f.step)) < 1e-7,
        `${id} mission r${round} L${level}: target on the control's step`,
      );
      assert.ok(Math.abs(evaluate(bench.model, p.goal).value - p.target) <= p.tolerance);
      assert.ok(Number.isFinite(evaluate(bench.model, p.start).value));
      puzzles++;
    }

  // the generated pages carry exactly the bench items the data file authors, with stable explicit ids
  const items = benchItems(bench);
  for (const mode of ["practice", "challenge"]) {
    const rel = `math/practice-studio/${id}/${mode === "practice" ? "" : "challenge/"}index.html`;
    assert.ok(existsSync(join(REPO_ROOT, rel)), `${rel} exists`);
    const data = pageData(rel);
    assert.ok(data.labV, `${rel} ships the lab content stamp`);
    const sec = data.sections[mode === "practice" ? 3 : 2];
    const want = [...items[mode].before, ...items[mode].after].map((it) => it.id);
    const got = sec.items.filter((it) => /^lab-/.test(it.id || "")).map((it) => it.id);
    assert.deepEqual(got, want, `${id} ${mode}: the bench items sit in the right section`);
    const gen = sec.items.filter((it) => !/^lab-/.test(it.id || ""));
    assert.ok(
      gen.every((it) => !/^lab-/.test(it.id)),
      "no generated item takes a bench id",
    );
    // existing items keep their ids: the bench is added around them, never in the middle
    const first = sec.items.findIndex((it) => !/^lab-/.test(it.id));
    assert.equal(first, items[mode].before.length, `${id} ${mode}: bench items lead the section`);
    for (const it of sec.items.filter((x) => x.k === "lab" || x.k === "mission"))
      assert.ok(it.model?.kind && it.lab, `${id} ${mode} ${it.id} carries its lab and model`);
  }
}

// the other pages carry no lab stamp and no lab items
for (const id of ids) {
  const ld = JSON.parse(read(`data/practice-studio/${id}.json`));
  if (ld.bench) continue;
  for (const mode of ["practice", "challenge"]) {
    const data = pageData(
      `math/practice-studio/${id}/${mode === "practice" ? "" : "challenge/"}index.html`,
    );
    assert.ok(
      data.sections.every((s) => s.items.every((it) => it.k !== "lab" && it.k !== "mission")),
      `${id} ${mode} has no bench items without a bench`,
    );
  }
}

// Unit 4's hand-built pages: every page carries exactly the block the injector would write, and its bench is clean
{
  const { outputs: u4Outputs } = await import("../scripts/inject-u4-lab-bench.mjs");
  const { UNIT4 } = await import("../scripts/generate-practice-studios.mjs");
  const files = u4Outputs();
  assert.equal(files.size, UNIT4.length * 2, "every Unit 4 lesson injects on both of its pages");
  for (const [rel, content] of files)
    assert.ok(
      readFileSync(join(REPO_ROOT, rel), "utf8") === content,
      `${rel} is stale; run: node scripts/inject-u4-lab-bench.mjs`,
    );
  for (const [id] of UNIT4) {
    const { bench } = JSON.parse(read(`data/practice-studio-u4/${id}.json`));
    assert.deepEqual(benchProblems(id, bench, labs), [], `${id} (Unit 4) bench is clean`);
    benches++;
  }
}

assert.ok(benches >= 1, "at least one lesson carries a bench");
console.log(
  `studio lab bench: ${benches} benches, ${goals} goals and ${puzzles} mission puzzles checked.`,
);

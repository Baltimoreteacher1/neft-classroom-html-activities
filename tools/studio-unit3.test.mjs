// Unit 3 (lessons 3-1 .. 3-10) studio v4 contract: problem shapes, the four new activities, 3-6 / 3-10 separation, the 3-8 least-pay fix,
// answer-length bias in authored multiple choice, and mastery sections. Run: node tools/studio-unit3.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { loadStudio } from "./lib/studio-vm.mjs";

const ctx = loadStudio({ gen: true, act: true });
const G = ctx.StudioGen;
const A = ctx.StudioAct;
const LESSONS = Array.from({ length: 10 }, (_, i) => `3-${i + 1}`);
const data = Object.fromEntries(
  LESSONS.map((id) => [
    id,
    JSON.parse(readFileSync(join(REPO_ROOT, `data/practice-studio/${id}.json`), "utf8")),
  ]),
);
const problems = [];
const bad = (m) => problems.push(m);

/* 1. every gen ref in fresh and climb uses a shape its generator lists, and each list mixes at least two shapes */
for (const id of LESSONS) {
  for (const [name, list] of [
    ["fresh", data[id].fresh],
    ["climb", data[id].challenge.climb],
  ]) {
    const shapes = new Set();
    for (const it of list.filter((x) => x.k === "gen")) {
      const def = G.registry[it.g];
      if (!def) {
        bad(`${id} ${name}: unknown generator ${it.g}`);
        continue;
      }
      const sh = it.shape || def.shapes[0];
      if (!def.shapes.includes(sh)) bad(`${id} ${name}: ${it.g} has no shape "${sh}"`);
      shapes.add(sh);
    }
    if (shapes.size < 2)
      bad(`${id} ${name}: needs at least two problem shapes, has ${[...shapes]}`);
  }
}

/* 2. a shape is a different problem from the forward shape, and never prints its own answer in the stem */
for (const [gen, shapes] of Object.entries({
  ratioWrite: ["reverse"],
  unitRate: ["reverse"],
  eqRatioTable: ["reverse"],
  ratioGraphRead: ["reverse"],
  compareRatios: ["compare-four"],
  convertUnits: ["reverse"],
  convertBetween: ["reverse"],
  unitRateWord: ["compare"],
  eqRatioMissing: ["reverse"],
  convertFactor: ["which-input"],
})) {
  for (const shape of shapes) {
    assert.ok(G.registry[gen].shapes.includes(shape), `${gen} lists ${shape}`);
    for (let level = 1; level <= 4; level++) {
      let sameStem = 0;
      for (let seed = 1; seed <= 60; seed++) {
        const fwd = G.make(gen, level, seed);
        const alt = G.make(gen, level, seed, shape);
        if (alt.gen.shape !== shape) bad(`${gen} ${shape}: item reports shape ${alt.gen.shape}`);
        if (fwd.q === alt.q) sameStem++;
        if (
          alt.k === "num" &&
          new RegExp(`(^|[^\\d.])${alt.a}([^\\d.]|$)`).test(alt.q.replace(/(?<=\d),(?=\d{3})/g, ""))
        )
          bad(`${gen} ${shape} L${level} seed ${seed}: stem prints its answer`);
      }
      if (sameStem > 6)
        bad(`${gen} ${shape} L${level}: ${sameStem}/60 stems equal the forward shape`);
    }
  }
}

/* 3. 3-6 and 3-10 teach different things; the Orbiter story is in 3-10 only */
{
  const gens = (id) =>
    new Set(
      [...data[id].fresh, ...data[id].challenge.climb].filter((x) => x.k === "gen").map((x) => x.g),
    );
  assert.deepEqual([...gens("3-10")], ["convertFactor"], "3-10 practises conversion factors");
  assert.ok(!gens("3-6").has("convertFactor"));
  const acts = (id) => JSON.stringify([...data[id].fresh, ...data[id].challenge.lab]);
  assert.ok(
    acts("3-10").includes("cancelit") && !acts("3-10").includes("convchain"),
    "3-10 uses cancelit, not convchain",
  );
  for (const id of LESSONS) {
    const has = JSON.stringify(data[id]).includes("Orbiter");
    if (has !== (id === "3-10")) bad(`${id}: the Mars Climate Orbiter story belongs in 3-10 only`);
  }
}

/* 4. 3-8 least-pay items are never about boxes sold whole */
for (let seed = 1; seed <= 400; seed++) {
  const it = G.make("unitRateWord", 3, seed);
  if (/granola|Box [AB]/i.test(it.q))
    bad(`unitRateWord L3 seed ${seed}: prices part of a box (${it.q.slice(0, 60)})`);
}

/* 5. the new activities: solution accepted, wrong tries explained without the answer, verdict fields consistent */
const NEW = ["tagtape", "addrider", "cancelit", "barcompare"];
for (const kind of NEW) {
  for (let level = 1; level <= 4; level++) {
    for (let seed = 1; seed <= 80; seed++) {
      const spec = JSON.parse(JSON.stringify(A.make(kind, level, seed, {})));
      const def = A.registry[kind];
      const sol = def.solution(spec);
      const ok = def.grade(spec, JSON.parse(JSON.stringify(sol)));
      if (!ok.ok) bad(`${kind} L${level} seed ${seed}: solution rejected`);
      for (const w of def.wrong(spec, G.rng(`w${seed}`))) {
        const r = def.grade(spec, JSON.parse(JSON.stringify(w)));
        if (r.ok) continue;
        if (!r.say || !r.sayEs) bad(`${kind}: a miss has no say / sayEs`);
        if (typeof r.right !== "number" || typeof r.of !== "number" || r.right >= r.of)
          bad(`${kind}: miss has bad right/of ${r.right}/${r.of}`);
        if (r.marks && r.marks.length !== r.of)
          bad(`${kind}: marks length ${r.marks.length} differs from of ${r.of}`);
        const text = `${r.say} ${r.sayEs}`;
        if (kind === "cancelit") {
          const M = spec.model;
          const value =
            M.tiles.length &&
            M.need.reduce((v, id) => {
              const t = M.tiles.find((x) => x.id === id);
              return (v * t.top.n) / t.bottom.n;
            }, M.v);
          if (new RegExp(`(^|[^\\d.])${String(value).replace(".", "\\.")}([^\\d.]|$)`).test(text))
            bad(`cancelit L${level} seed ${seed}: say prints the converted amount`);
        }
        if (kind === "barcompare" && /\b(Mix|Mezcla) [AB]\b/.test(text))
          bad(`barcompare L${level} seed ${seed}: say names a mix`);
        if (kind === "addrider" && /\b(yes|no|sí)\b.*\b(equal|iguales)\b/i.test(text))
          bad(`addrider: say gives the verdict`);
      }
    }
  }
}
// the part-whole slip that "Tag the tape" exists for is told apart from an order slip
{
  const spec = JSON.parse(JSON.stringify(A.make("tagtape", 2, 3, {})));
  const sol = A.registry.tagtape.solution(spec).place;
  const swapped = { ...sol, s0: sol.s2, s2: sol.s0 };
  assert.equal(A.grade(spec, { place: swapped }).tag, "part-whole-mixup");
  const flipped = { ...sol, s0: sol.s1, s1: sol.s0 };
  assert.equal(A.grade(spec, { place: flipped }).tag, "ratio-inverted");
}
// "Add a rider": equal and unequal ratios both occur, and "straight line" alone is never enough
{
  const truths = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const spec = A.make("addrider", 2, seed, {});
    truths.add(spec.model.truth);
    const wrongYes = A.grade(spec, { pred: "miss", col: true, decide: "yes" });
    if (spec.model.truth === "no") assert.equal(wrongYes.tag, "ratio-graph-origin");
  }
  assert.equal(truths.size, 2, "addrider mixes proportional and non-proportional draws");
}

/* 6. authored multiple choice: the right choice is never the unique longest, choices stay within about a quarter (EN and ES) */
const lenBad = (it, where) => {
  for (const arr of [it.c, it.cEs || it.c]) {
    const L = arr.map((s) => String(s).length);
    const mx = Math.max(...L);
    const mn = Math.min(...L);
    if (mx <= 6) continue;
    if (L[it.a] === mx && L.filter((x) => x === mx).length === 1)
      bad(`${where}: the right choice is the longest`);
    if ((mx - mn) / mn > 0.25 && mx - mn > 4)
      bad(`${where}: choice lengths differ by more than 25% (${L})`);
  }
};
const walk = (o, path) => {
  if (Array.isArray(o)) o.forEach((x, i) => walk(x, `${path}[${i}]`));
  else if (o && typeof o === "object") {
    if (o.k === "mc" && Array.isArray(o.c)) lenBad(o, path);
    for (const [k, v] of Object.entries(o)) if (k !== "bench") walk(v, `${path}.${k}`);
  }
};
for (const id of LESSONS) {
  walk(data[id], id);
  for (const m of ["practice", "challenge"]) lenBad(data[id].moves[m], `${id}.moves.${m}`);
}

/* 7. mastery sections */
for (const id of LESSONS.slice(6)) {
  const m = data[id].mastery || [];
  if (m.length < 4 || m.length > 6) bad(`${id}: mastery needs 4-6 items, has ${m.length}`);
  if (new Set(m.map((x) => x.k)).size < 2) bad(`${id}: mastery needs a mix of kinds`);
}

if (problems.length) {
  console.error(
    `${problems.length} problem(s):\n${[...new Set(problems)].slice(0, 40).join("\n")}`,
  );
  process.exit(1);
}
console.log(
  "studio-unit3: shapes, new activities, 3-6/3-10 separation, 3-8 least-pay, answer-length bias and mastery sections hold.",
);

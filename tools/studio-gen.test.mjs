// Practice Studio generators: every generator, every level, hundreds of seeds.
//   node tools/studio-gen.test.mjs [genId ...]     (no ids = every registered generator)
// A generator passes when its items are well-formed, deterministic, bilingual, varied, balanced in answer position,
// and when its INDEPENDENT check() agrees with the key -- and disagrees once the key is corrupted.
// Every wrong answer it names (mc tag[], typed-answer fw[].tag) must be a misconception taxonomy id
// (data/practice-studio/misconceptions.json) that assets/studio-gen/traps.js carries a name for, so My thinking names a
// generated miss like an authored one. A generator's own tag reaches the taxonomy through
// data/practice-studio/generator-traps.json; a new tag fails here until it is mapped there (then rerun
// node scripts/generate-practice-studios.mjs).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generatorTrapProblems } from "../scripts/lib/practice-studio-traps.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { loadStudio } from "./lib/studio-vm.mjs";

const SEEDS = 300;
// Past the first SEEDS (which also feed the variety, position-balance, corrupted-key and determinism checks),
// every item check runs on a spread of seeds up to SWEEP_TO plus each seed that once broke a generator, so a
// generator cannot fail on a seed a student will meet: a lesson draws seeds far past 300. Seeds 1-6000 were
// swept in full on 2026-10-21; these threw or mis-keyed until fixed (mcx: 3 choices, a "mistake" that gave the
// right answer, a two-answer riddle, an estimate 30% off, a mean needing a negative amount).
const SWEEP_TO = 6000;
const SWEEP_STEP = 13;
const PINNED = [
  645, 883, 1128, 1129, 1190, 1260, 1274, 1658, 2192, 2242, 2320, 2321, 2421, 2443, 2482, 2542,
  2967, 3067, 3328, 3665, 4081, 4958, 4992, 5486, 5495, 642, 773, 911, 3133,
];
const SEED_LIST = [
  ...new Set([
    ...Array.from({ length: SEEDS }, (_, i) => i + 1),
    ...Array.from(
      { length: Math.floor((SWEEP_TO - SEEDS) / SWEEP_STEP) },
      (_, i) => SEEDS + 1 + i * SWEEP_STEP,
    ),
    ...PINNED,
  ]),
];
const ctx = loadStudio({ gen: true });
const G = ctx.StudioGen;
const only = process.argv.slice(2);
const ids = (only.length ? only : G.ids()).sort();
assert.ok(ids.length, "no generators registered");
let problems = 0;
const bad = (id, msg) => {
  problems++;
  console.error(`FAIL [${id}] ${msg}`);
};
const readJson = (rel) => JSON.parse(readFileSync(join(REPO_ROOT, rel), "utf8"));
const { traps } = readJson("data/practice-studio/misconceptions.json");
for (const p of generatorTrapProblems(
  readJson("data/practice-studio/generator-traps.json"),
  traps,
  G.ids(),
))
  bad("generator-traps.json", p);
const named = G.traps?.names || {};
/** tags already reported, so one unmapped tag fails once, not once per seed */
const unnamed = new Set();
const trapCheck = (id, where, t) => {
  if (!t) return bad(id, `${where} names no misconception`);
  if (unnamed.has(`${id}|${t}`)) return;
  if (!traps[t]) {
    unnamed.add(`${id}|${t}`);
    bad(
      id,
      `${where} tag "${t}" is not a taxonomy id: map it in data/practice-studio/generator-traps.json`,
    );
  } else if (named[t]?.n !== traps[t].name || named[t]?.nEs !== traps[t].nameEs) {
    unnamed.add(`${id}|${t}`);
    bad(
      id,
      `${where} trap "${t}" has no current name in traps.js: run node scripts/generate-practice-studios.mjs`,
    );
  }
};

for (const id of ids) {
  if (!G.has(id)) {
    bad(id, "not registered");
    continue;
  }
  const def = G.registry[id];
  assert.equal(def.levels, 4, `${id}: levels must be 4`);
  // every problem shape a generator lists (core.js: shapes), at every level; the default shape is "forward"
  const shapes = def.shapes?.length ? def.shapes : ["forward"];
  for (const [level, shape] of shapes.flatMap((sh) => [1, 2, 3, 4].map((lv) => [lv, sh]))) {
    const stems = new Set();
    const pos = [0, 0, 0, 0, 0];
    let mc4 = 0;
    let first = null;
    for (const seed of SEED_LIST) {
      let item;
      try {
        item = G.make(id, level, seed, shape);
      } catch (e) {
        bad(id, `L${level}/${shape} seed ${seed} threw: ${e.message}`);
        break;
      }
      first ||= item;
      const tag = `L${level}/${shape}/seed ${seed}`;
      const text = (v) => typeof v === "string" && v.trim().length > 1;
      if (!text(item.q)) {
        bad(id, `${tag} no q`);
        break;
      }
      if (!text(item.qEs)) bad(id, `${tag} no qEs`);
      if (!text(item.x)) bad(id, `${tag} no explanation x`);
      if (!text(item.xEs)) bad(id, `${tag} no xEs`);
      if (!item.meta || typeof item.meta !== "object") bad(id, `${tag} no meta`);
      if (!Array.isArray(item.h) || item.h.length < 2 || item.h.some((h) => !text(h)))
        bad(id, `${tag} needs a hint ladder h[] of 2-3 hints`);
      if (item.k === "mc") {
        if (!Array.isArray(item.c) || item.c.length < 2 || item.c.length > 5)
          bad(id, `${tag} choice count`);
        if (new Set(item.c.map((c) => String(c).trim().toLowerCase())).size !== item.c.length)
          bad(id, `${tag} duplicate choices ${JSON.stringify(item.c)}`);
        if (!Number.isInteger(item.a) || item.a < 0 || item.a >= item.c.length)
          bad(id, `${tag} bad answer index`);
        if (!Array.isArray(item.f) || item.f.length !== item.c.length)
          bad(id, `${tag} f[] misaligned`);
        else
          item.f.forEach(
            (f, i) => i !== item.a && !text(f) && bad(id, `${tag} choice ${i} has no feedback`),
          );
        if (Array.isArray(item.f) && item.f[item.a])
          bad(id, `${tag} right choice carries feedback text`);
        item.c.forEach(
          (_c, i) => i !== item.a && trapCheck(id, `${tag} choice ${i}`, (item.tag || [])[i]),
        );
        if (item.c.length === 4 && seed <= SEEDS) {
          pos[item.a]++;
          mc4++;
        }
      } else if (item.k === "num") {
        if (!Number.isFinite(G.value(item.a))) bad(id, `${tag} num answer not numeric: ${item.a}`);
        for (const w of item.fw || []) trapCheck(id, `${tag} typed wrong value ${w.v}`, w.tag);
      } else bad(id, `${tag} unknown kind ${item.k}`);
      if (seed <= SEEDS) stems.add(item.q + JSON.stringify(item.c || item.a));
      // the stem may not state its own answer as a standalone number for num items
      // key check, then a corrupted key must be rejected
      const ok = G.verify(item);
      if (ok !== true) {
        bad(id, `${tag} check() disagrees: ${ok}`);
        break;
      }
      if (seed <= 40) {
        const twin = JSON.parse(JSON.stringify(item));
        if (twin.k === "mc") twin.a = (twin.a + 1) % twin.c.length;
        else twin.a = String(G.value(twin.a) + 1);
        if (G.verify(twin) === true) {
          bad(id, `${tag} check() accepted a corrupted key`);
          break;
        }
        const again = G.make(id, level, seed, shape);
        assert.deepEqual(
          JSON.parse(JSON.stringify(again)),
          JSON.parse(JSON.stringify(item)),
          `${id} not deterministic`,
        );
      }
    }
    if (stems.size < SEEDS * 0.5)
      bad(id, `L${level}/${shape}: only ${stems.size} distinct problems in ${SEEDS} seeds`);
    if (mc4 > SEEDS * 0.6 && pos.slice(0, 4).some((n) => n / mc4 < 0.15 || n / mc4 > 0.36))
      bad(id, `L${level}/${shape}: answer position skew ${pos.slice(0, 4).join("/")}`);
    void first;
  }
}
if (problems) {
  console.error(`\n${problems} problem(s) across ${ids.length} generator(s).`);
  process.exit(1);
}
console.log(
  `studio-gen: ${ids.length} generator(s) x 4 levels x ${SEED_LIST.length} seeds (1-${SEEDS} in depth, a spread to ${SWEEP_TO}) passed; every wrong answer names a taxonomy trap.`,
);

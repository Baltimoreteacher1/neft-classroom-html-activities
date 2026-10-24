// Unit 7 generator SHAPES (assets/studio-gen/coordinate2.js): every shape, every level, hundreds of seeds.
//   node tools/studio-coord-shapes.test.mjs [genId ...]
// Same bar as tools/studio-gen.test.mjs, applied to the non-default shapes: well-formed, bilingual, deterministic,
// the item really is the requested shape, an INDEPENDENT check() agrees with the key and rejects a corrupted one,
// every wrong answer names a taxonomy trap, and the answer position is not skewed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { loadStudio } from "./lib/studio-vm.mjs";

const SEEDS = 300;
const IDS = [
  "integerOpposites",
  "rationalNumberLine",
  "absoluteValue",
  "compareOrder",
  "quadrantId",
  "coordDistance",
  "polygonCoordinates",
  "reflectPoint",
];
const G = loadStudio({ gen: true }).StudioGen;
const only = process.argv.slice(2);
const ids = only.length ? only : IDS;
const { traps } = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/practice-studio/misconceptions.json"), "utf8"),
);
const named = G.traps?.names || {};
let problems = 0;
const seenBad = new Set();
const bad = (id, msg) => {
  const key = `${id}|${msg.replace(/seed \d+/, "")}`;
  if (seenBad.has(key)) return;
  seenBad.add(key);
  problems++;
  console.error(`FAIL [${id}] ${msg}`);
};
const text = (v) => typeof v === "string" && v.trim().length > 1;
const tagOk = (id, where, t) => {
  if (!t) return bad(id, `${where} names no misconception`);
  if (!traps[t]) return bad(id, `${where} tag "${t}" is not a taxonomy id`);
  if (named[t]?.n !== traps[t].name)
    bad(id, `${where} trap "${t}" has no current name in traps.js`);
};

let shapesChecked = 0;
for (const id of ids) {
  const def = G.registry[id];
  if (!def) {
    bad(id, "not registered");
    continue;
  }
  if (def.shapes.length < 3)
    bad(id, `needs forward plus at least two more shapes, has ${def.shapes}`);
  for (const shape of def.shapes.filter((x) => x !== "forward")) {
    shapesChecked++;
    for (let level = 1; level <= 4; level++) {
      const stems = new Set();
      const pos = {};
      let mc = 0;
      let longest = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const tag = `${shape} L${level} seed ${seed}`;
        let item;
        try {
          item = G.make(id, level, seed, shape);
        } catch (e) {
          bad(id, `${tag} threw: ${e.message}`);
          break;
        }
        if (item.gen.shape !== shape) bad(id, `${tag} gen.shape is ${item.gen.shape}`);
        if (!text(item.q) || !text(item.qEs)) bad(id, `${tag} missing q or qEs`);
        if (!text(item.x) || !text(item.xEs)) bad(id, `${tag} missing x or xEs`);
        if (!Array.isArray(item.h) || item.h.length < 2 || !Array.isArray(item.hEs))
          bad(id, `${tag} hint ladder`);
        else if (item.h.length !== item.hEs.length) bad(id, `${tag} hint languages differ`);
        if (item.qEs === item.q) bad(id, `${tag} qEs copies q`);
        if (item.k === "mc") {
          mc++;
          if (item.c.length < 3 || item.c.length > 5)
            bad(id, `${tag} choice count ${item.c.length}`);
          if (new Set(item.c.map((c) => c.trim().toLowerCase())).size !== item.c.length)
            bad(id, `${tag} duplicate choices`);
          item.c.forEach((_c, i) => {
            if (i !== item.a) {
              if (!text(item.f[i])) bad(id, `${tag} choice ${i} has no feedback`);
              tagOk(id, `${tag} choice ${i}`, (item.tag || [])[i]);
            }
          });
          if (item.f[item.a]) bad(id, `${tag} right choice carries feedback`);
          pos[item.c.length] = pos[item.c.length] || new Array(item.c.length).fill(0);
          pos[item.c.length][item.a]++;
          const right = item.c[item.a].length;
          if (item.c.every((c, i) => i === item.a || c.length < right)) longest++;
        } else {
          if (!Number.isFinite(G.value(item.a))) bad(id, `${tag} answer not numeric`);
          for (const w of item.fw || []) tagOk(id, `${tag} typed ${w.v}`, w.tag);
        }
        stems.add(item.q + JSON.stringify(item.c || item.a));
        const ok = G.verify(item);
        if (ok !== true) {
          bad(id, `${tag} check() disagrees: ${ok}`);
          break;
        }
        if (seed <= 40) {
          const twin = JSON.parse(JSON.stringify(item));
          if (twin.k === "mc") twin.a = (twin.a + 1) % twin.c.length;
          else twin.a = String(G.value(twin.a) + 1);
          if (G.verify(twin) === true) bad(id, `${tag} check() accepted a corrupted key`);
          assert.deepEqual(
            JSON.parse(JSON.stringify(G.make(id, level, seed, shape))),
            JSON.parse(JSON.stringify(item)),
            `${id} ${shape} not deterministic`,
          );
        }
      }
      if (stems.size < SEEDS * 0.4)
        bad(id, `${shape} L${level}: only ${stems.size} distinct problems in ${SEEDS} seeds`);
      // answer-length bias: the key may tie or lose on length most of the time, and must not be the longest by habit
      if (mc >= 60 && longest / mc > 0.5)
        bad(
          id,
          `${shape} L${level}: the correct choice is the longest in ${longest} of ${mc} items`,
        );
      for (const [n, counts] of Object.entries(pos)) {
        const total = counts.reduce((a, b) => a + b, 0);
        if (total >= 60 && counts.some((c) => c / total < 0.4 / n || c / total > 1.9 / n))
          bad(id, `${shape} L${level}: ${n}-choice answer position skew ${counts.join("/")}`);
      }
    }
  }
}
if (problems) {
  console.error(`\n${problems} problem(s) across ${ids.length} generator(s).`);
  process.exit(1);
}
console.log(
  `studio-coord-shapes: ${ids.length} generators, ${shapesChecked} shapes x 4 levels x ${SEEDS} seeds passed.`,
);

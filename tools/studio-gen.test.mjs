// Practice Studio generators: every generator, every level, hundreds of seeds.
//   node tools/studio-gen.test.mjs [genId ...]     (no ids = every registered generator)
// A generator passes when its items are well-formed, deterministic, bilingual, varied, balanced in answer position,
// and when its INDEPENDENT check() agrees with the key -- and disagrees once the key is corrupted.
import assert from "node:assert/strict";
import { loadStudio } from "./lib/studio-vm.mjs";

const SEEDS = 300;
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

for (const id of ids) {
  if (!G.has(id)) {
    bad(id, "not registered");
    continue;
  }
  const def = G.registry[id];
  assert.equal(def.levels, 4, `${id}: levels must be 4`);
  for (let level = 1; level <= 4; level++) {
    const stems = new Set();
    const pos = [0, 0, 0, 0, 0];
    let mc = 0;
    let first = null;
    for (let seed = 1; seed <= SEEDS; seed++) {
      let item;
      try {
        item = G.make(id, level, seed);
      } catch (e) {
        bad(id, `L${level} seed ${seed} threw: ${e.message}`);
        break;
      }
      first ||= item;
      const tag = `L${level}/seed ${seed}`;
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
        mc++;
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
        if (item.c.length === 4) pos[item.a]++;
      } else if (item.k === "num") {
        if (!Number.isFinite(G.value(item.a))) bad(id, `${tag} num answer not numeric: ${item.a}`);
      } else bad(id, `${tag} unknown kind ${item.k}`);
      stems.add(item.q + JSON.stringify(item.c || item.a));
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
        const again = G.make(id, level, seed);
        assert.deepEqual(
          JSON.parse(JSON.stringify(again)),
          JSON.parse(JSON.stringify(item)),
          `${id} not deterministic`,
        );
      }
    }
    if (stems.size < SEEDS * 0.5)
      bad(id, `L${level}: only ${stems.size} distinct problems in ${SEEDS} seeds`);
    if (mc > SEEDS * 0.6 && pos.slice(0, 4).some((n) => n / mc < 0.15 || n / mc > 0.36))
      bad(id, `L${level}: answer position skew ${pos.slice(0, 4).join("/")}`);
    void first;
  }
}
if (problems) {
  console.error(`\n${problems} problem(s) across ${ids.length} generator(s).`);
  process.exit(1);
}
console.log(`studio-gen: ${ids.length} generator(s) x 4 levels x ${SEEDS} seeds passed.`);

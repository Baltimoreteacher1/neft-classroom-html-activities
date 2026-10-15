// Practice Studio activities: the pure model half of every activity.
//   node tools/studio-act.test.mjs [kind ...]
// make() is deterministic and JSON-safe; grade(solution) passes; grade(wrong) fails and explains without answering.
import assert from "node:assert/strict";
import { loadStudio } from "./lib/studio-vm.mjs";

const SEEDS = 120;
const ctx = loadStudio({ gen: true, act: true });
const A = ctx.StudioAct;
const only = process.argv.slice(2);
const kinds = (only.length ? only : A.kinds()).sort();
assert.ok(kinds.length, "no activities registered");
let problems = 0;
const bad = (k, m) => {
  problems++;
  console.error(`FAIL [${k}] ${m}`);
};
const text = (v) => typeof v === "string" && v.trim().length > 1;

for (const kind of kinds) {
  if (!A.has(kind)) {
    bad(kind, "not registered");
    continue;
  }
  for (let level = 1; level <= 4; level++) {
    const seen = new Set();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tag = `L${level}/seed ${seed}`;
      let spec;
      try {
        spec = A.make(kind, level, seed, {});
      } catch (e) {
        bad(kind, `${tag} make threw: ${e.message}`);
        break;
      }
      const round = JSON.parse(JSON.stringify(spec));
      assert.deepEqual(
        round,
        JSON.parse(JSON.stringify(A.make(kind, level, seed, {}))),
        `${kind} not deterministic`,
      );
      if (!text(spec.q)) bad(kind, `${tag} no q`);
      if (!text(spec.qEs)) bad(kind, `${tag} no qEs`);
      if (!text(spec.x)) bad(kind, `${tag} no explanation x`);
      if (!text(spec.xEs)) bad(kind, `${tag} no xEs`);
      if (!Array.isArray(spec.h) || spec.h.length < 2) bad(kind, `${tag} needs hints h[]`);
      seen.add(
        JSON.stringify(spec.q) + JSON.stringify(spec.model ?? spec.data ?? spec.target ?? ""),
      );
      const def = A.registry[kind];
      const sol = def.solution(round);
      const g = def.grade(round, JSON.parse(JSON.stringify(sol)));
      if (!g || g.ok !== true) bad(kind, `${tag} solution() not accepted: ${JSON.stringify(g)}`);
      const wrongs = def.wrong(round, ctx.StudioGen.rng(`w${seed}`));
      if (!Array.isArray(wrongs) || wrongs.length < 2)
        bad(kind, `${tag} wrong() must return >= 2 states`);
      for (const w of wrongs || []) {
        const r = def.grade(round, JSON.parse(JSON.stringify(w)));
        if (!r || r.ok !== false) bad(kind, `${tag} wrong state accepted: ${JSON.stringify(w)}`);
        else if (!text(r.say)) bad(kind, `${tag} miss has no say`);
      }
    }
    if (seen.size < SEEDS * 0.4)
      bad(kind, `L${level}: only ${seen.size} distinct activities in ${SEEDS} seeds`);
  }
}
if (problems) {
  console.error(`\n${problems} problem(s) across ${kinds.length} activit(y/ies).`);
  process.exit(1);
}
console.log(`studio-act: ${kinds.length} activit(y/ies) x 4 levels x ${SEEDS} seeds passed.`);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({ window: {} });
vm.runInContext(
  readFileSync(new URL("../math/games/u4-percent-power/construction.js", import.meta.url), "utf8"),
  context,
);
const { parseAmount, validSnapshot } = context.window.PercentConstruction;
for (const [raw, expected] of [
  ["0", 0],
  ["-3", -3],
  [".6", 0.6],
  ["3/5", 0.6],
  ["  $ 12.50 ", 12.5],
  ["25 / 2", 12.5],
  ["-3/-5", 0.6],
])
  assert.equal(parseAmount(raw), expected);
for (const raw of [
  "",
  "  ",
  "1/0",
  "0/0",
  "NaN",
  "Infinity",
  "1e3000",
  "60%",
  "1+1",
  "1/2/3",
  "<script>",
  "12 dollars",
])
  assert.equal(parseAmount(raw), null);
const snapshot = {
  score: 10,
  streak: 0,
  bestStreak: 1,
  attempts: 3,
  correctSubs: 1,
  solved: 0,
  firstTry: 0,
  round: 1,
  wrongShade: 2,
  wrongValue: 0,
  phase: "value",
  markerPct: 60,
  level: 1,
  startLevel: 1,
  scaffoldTier: 2,
  usedHelp: true,
  amountDraft: "3/5",
  stats: {},
  problem: {
    kind: "part",
    whole: 50,
    tenth: 5,
    targetPct: 60,
    prompt: "Build 60% of 50",
    why: "Six tenths",
    label: "Find part",
    ask: {
      q: "Amount?",
      options: [
        { correct: true, value: 30, label: "30", why: "Six times five" },
        { correct: false, value: 60, label: "60", why: "Percent is not the amount" },
      ],
    },
  },
};
const restored = validSnapshot(snapshot);
assert.equal(restored.amountDraft, "3/5");
assert.equal(restored.wrongShade, 2);
assert.equal(restored.usedHelp, true);
assert.equal(validSnapshot({ ...snapshot, markerPct: 50 }), null);
assert.equal(validSnapshot({ ...snapshot, score: -1 }), null);
assert.equal(validSnapshot({ ...snapshot, problem: { ...snapshot.problem, tenth: 10 } }), null);
assert.equal(validSnapshot({ ...snapshot, problem: { ...snapshot.problem, whole: 60 } }), null);
assert.equal(validSnapshot({ ...snapshot, phase: "unknown" }), null);
assert.equal(validSnapshot(null), null);
console.log(
  "Percent construction: numeric/fraction input, invalid forms, exact mathematical save invariants and support-history restoration passed.",
);

// Number Builder: every catalogued wrong-answer type is named and explained specifically, in both languages, with
// the numbers of the learner's own build. Hand-built rounds, so each mistake is provoked on purpose.
// @fm2 FM-007 FM-020 FM-033 FM-063 FM-055 FM-060
import assert from "node:assert/strict";
import game from "../../math/fluency-lab/family/fm2/games/number-builder/index.js";
import { CATALOGUED } from "./number-builder.oracle.mjs";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};

// ---------- catalogued wrong-answer types: each is named and explained specifically ----------
const piece = (id, value, kind, max, extra = {}) => ({ id, value, kind, max, ...extra });
const hand = (over) => ({
  v: 1,
  mode: "pieces",
  form: { type: "numeral" },
  constraints: [],
  ways: 1,
  prompt: { en: "x", es: "x" },
  ...over,
});
const baseTen = [
  piece("flat", "100", "flat", 12),
  piece("rod", "10", "rod", 30),
  piece("unit", "1", "unit", 30),
];
const decimal = [
  piece("flat", "1", "flat", 9),
  piece("rod", "0.1", "rod", 40),
  piece("unit", "0.01", "unit", 40),
];
const chips = [piece("pos", "1", "chip", 14), piece("neg", "-1", "chip", 14)];
const tens = (c) => ({ builds: [{ counts: c }] });
const cases = [
  [
    "empty",
    hand({ kit: "base10", target: "34", pieces: baseTen }),
    tens({ flat: 0, rod: 0, unit: 0 }),
    /nothing built/,
  ],
  [
    "tooMuch",
    hand({ kit: "base10", target: "34", pieces: baseTen }),
    tens({ flat: 0, rod: 3, unit: 9 }),
    /39.*5 more/,
  ],
  [
    "tooLittle",
    hand({ kit: "base10", target: "34", pieces: baseTen }),
    tens({ flat: 0, rod: 3, unit: 1 }),
    /31.*3 less/,
  ],
  [
    "swapped",
    hand({ kit: "base10", target: "34", pieces: baseTen }),
    tens({ flat: 0, rod: 4, unit: 3 }),
    /wrong way round.*43/,
  ],
  [
    "countedPieces",
    hand({ kit: "base10", target: "5", pieces: baseTen }),
    tens({ flat: 0, rod: 2, unit: 3 }),
    /5 pieces.*23/,
  ],
  [
    "tenTimes",
    hand({ kit: "base10", target: "5", pieces: baseTen }),
    tens({ flat: 0, rod: 5, unit: 0 }),
    /50.*ten times/,
  ],
  [
    "tenth",
    hand({ kit: "base10", target: "50", pieces: baseTen }),
    tens({ flat: 0, rod: 0, unit: 5 }),
    /5.*one tenth/,
  ],
  [
    "signFlip",
    hand({ kit: "chips", target: "-4", pieces: chips }),
    tens({ pos: 4, neg: 0 }),
    /4.*opposite/,
  ],
  [
    "notZero",
    hand({ kit: "chips", target: "0", pieces: chips }),
    tens({ pos: 3, neg: 1 }),
    /2.*not 0/,
  ],
  [
    "rule",
    hand({
      kit: "base10",
      target: "34",
      pieces: baseTen,
      constraints: [{ t: "count", of: ["rod"], op: "eq", n: 2 }],
    }),
    tens({ flat: 0, rod: 3, unit: 4 }),
    /exactly 2 tens rods.*you have 3/,
  ],
  [
    "rule",
    hand({
      kit: "decimal",
      target: "1.2",
      pieces: decimal,
      constraints: [{ t: "count", of: ["flat"], op: "eq", n: 0 }],
    }),
    tens({ flat: 1, rod: 2, unit: 0 }),
    /no whole flats.*you have 1/,
  ],
  [
    "invalid",
    hand({ kit: "base10", target: "34", pieces: baseTen }),
    { builds: [{ counts: { flat: 0, rod: 3, unit: 99 } }] },
    /could not be read/,
  ],
  [
    "notAllTiles",
    {
      v: 1,
      mode: "chart",
      tiles: [3, 8, 0, 5],
      goal: "largest",
      target: "0",
      constraints: [],
      ways: 1,
    },
    { builds: [{ slots: [8, 5, null, null] }] },
    /2 place\(s\) are still empty/,
  ],
  [
    "leadingZero",
    {
      v: 1,
      mode: "chart",
      tiles: [3, 8, 0, 5],
      goal: "smallest",
      target: "0",
      constraints: [],
      ways: 1,
    },
    { builds: [{ slots: [0, 3, 5, 8] }] },
    /cannot start with 0/,
  ],
  [
    "reversed",
    {
      v: 1,
      mode: "chart",
      tiles: [3, 8, 0, 5],
      goal: "largest",
      target: "0",
      constraints: [],
      ways: 1,
    },
    { builds: [{ slots: [3, 0, 5, 8] }] },
    /3,058.*opposite extreme/,
  ],
  [
    "notLargest",
    {
      v: 1,
      mode: "chart",
      tiles: [3, 8, 0, 5],
      goal: "largest",
      target: "0",
      constraints: [],
      ways: 1,
    },
    { builds: [{ slots: [8, 3, 0, 5] }] },
    /8,305.*larger number/,
  ],
  [
    "notSmallest",
    {
      v: 1,
      mode: "chart",
      tiles: [3, 8, 0, 5],
      goal: "smallest",
      target: "0",
      constraints: [],
      ways: 1,
    },
    { builds: [{ slots: [3, 5, 0, 8] }] },
    /3,508.*smaller number/,
  ],
  [
    "odd",
    {
      v: 1,
      mode: "chart",
      tiles: [3, 8, 0, 5],
      goal: "largestEven",
      target: "0",
      constraints: [],
      ways: 1,
    },
    { builds: [{ slots: [8, 3, 0, 5] }] },
    /8,305 is odd/,
  ],
  [
    "notLargest",
    {
      v: 1,
      mode: "chart",
      tiles: [3, 8, 0, 5],
      goal: "largestEven",
      target: "0",
      constraints: [],
      ways: 1,
    },
    { builds: [{ slots: [5, 3, 8, 0] }] },
    /larger number/,
  ],
  [
    "farther",
    {
      v: 1,
      mode: "chart",
      tiles: [3, 8, 0, 5],
      goal: "nearest",
      target: "5000",
      constraints: [],
      ways: 1,
    },
    { builds: [{ slots: [8, 5, 3, 0] }] },
    /8,530 is 3,530 away/,
  ],
  [
    "notNormalized",
    { v: 1, mode: "sci", target: "420000", constraints: [{ t: "normalized" }], ways: 1 },
    { builds: [{ digits: [0, 4, 2, 0, 0], exp: 4 }] },
    /coefficient 42 is not at least 1/,
  ],
  [
    "expRule",
    {
      v: 1,
      mode: "sci",
      target: "36000",
      expr: { c: "3.6", e: 4 },
      constraints: [{ t: "exp", op: "eq", n: 3 }],
      ways: 1,
    },
    { builds: [{ digits: [0, 0, 3, 6, 0], exp: 4 }] },
    /Use the exponent 3/,
  ],
  [
    "keptCoef",
    {
      v: 1,
      mode: "sci",
      target: "36000",
      expr: { c: "3.6", e: 4 },
      constraints: [{ t: "exp", op: "eq", n: 3 }],
      ways: 1,
    },
    { builds: [{ digits: [0, 0, 3, 6, 0], exp: 3 }] },
    /kept the coefficient/,
  ],
  [
    "expSign",
    { v: 1, mode: "sci", target: "0.0042", constraints: [{ t: "normalized" }], ways: 1 },
    { builds: [{ digits: [0, 0, 4, 2, 0], exp: 3 }] },
    /wrong sign/,
  ],
  [
    "expOff",
    { v: 1, mode: "sci", target: "420000", constraints: [{ t: "normalized" }], ways: 1 },
    { builds: [{ digits: [0, 0, 4, 2, 0], exp: 4 }] },
    /1\/10 of the goal/,
  ],
  [
    "expOff",
    { v: 1, mode: "sci", target: "420000", constraints: [{ t: "normalized" }], ways: 1 },
    { builds: [{ digits: [0, 0, 4, 2, 0], exp: 6 }] },
    /10 times the goal/,
  ],
  [
    "sciMore",
    { v: 1, mode: "sci", target: "420000", constraints: [{ t: "normalized" }], ways: 1 },
    { builds: [{ digits: [0, 0, 5, 3, 0], exp: 5 }] },
    /more than the goal/,
  ],
  [
    "sciLess",
    { v: 1, mode: "sci", target: "420000", constraints: [{ t: "normalized" }], ways: 1 },
    { builds: [{ digits: [0, 0, 3, 2, 0], exp: 5 }] },
    /less than the goal/,
  ],
  [
    "sciEmpty",
    { v: 1, mode: "sci", target: "420000", constraints: [{ t: "normalized" }], ways: 1 },
    { builds: [{ digits: [0, 0, 0, 0, 0], exp: 0 }] },
    /coefficient is 0/,
  ],
];
const named = new Set();
for (const [key, round, response, pattern] of cases) {
  const v = game.check(round, response);
  ok(v.correct === false && v.mistake === key, `catalog ${key}: named (${v.mistake})`);
  ok(
    pattern.test(v.feedback.en),
    `catalog ${key}: English feedback is specific (${v.feedback.en})`,
  );
  ok(
    v.feedback.es.length > 20 &&
      v.feedback.es !== v.feedback.en &&
      /\d/.test(v.feedback.es) === /\d/.test(v.feedback.en),
    `catalog ${key}: Spanish feedback is specific`,
  );
  named.add(key);
}
for (const key of ["sameBuild", "needTwo"]) {
  const r = hand({
    kit: "counters",
    target: "5",
    pieces: [
      piece("red", "1", "counter", 10, { color: "red" }),
      piece("yellow", "1", "counter", 10, { color: "yellow" }),
    ],
    ways: 2,
  });
  const b = { counts: { red: 2, yellow: 3 } };
  const v = game.check(r, key === "needTwo" ? { builds: [b] } : { builds: [b, b] });
  ok(v.mistake === key && v.feedback.es !== v.feedback.en, `catalog ${key}`);
  named.add(key);
}
for (const key of CATALOGUED) ok(named.has(key), `catalog provokes ${key}`);

// boundaries of "at least 1 and less than 10"
{
  const r = { v: 1, mode: "sci", target: "10000", constraints: [{ t: "normalized" }], ways: 1 };
  const ten = game.check(r, { builds: [{ digits: [0, 1, 0, 0, 0], exp: 3 }] });
  ok(
    !ten.correct &&
      ten.mistake === "notNormalized" &&
      /coefficient 10 is not at least 1/.test(ten.feedback.en),
    "a coefficient of exactly 10 is not normalized",
  );
  ok(
    game.check(r, { builds: [{ digits: [0, 0, 1, 0, 0], exp: 4 }] }).correct,
    "a coefficient of exactly 1 is normalized",
  );
}

// feedback numbers are right: independent recomputation for "too much / too little"
{
  const r = hand({ kit: "decimal", target: "2.35", pieces: decimal });
  const v = game.check(r, tens({ flat: 2, rod: 4, unit: 1 }));
  ok(
    v.mistake === "tooMuch" && /2\.41/.test(v.feedback.en) && /0\.06/.test(v.feedback.en),
    "decimal feedback names 2.41 and 0.06 more",
  );
}

console.log(`number-builder catalog: ${checks} checks passed.`);

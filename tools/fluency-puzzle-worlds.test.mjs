import assert from "node:assert/strict";
import {
  evaluateWorldBuild,
  PUZZLE_WORLDS,
  skillIdForWorld,
  validateWorldAnswer,
  worldLevel,
} from "../math/fluency-lab/puzzle-worlds.js";

const valuesFor = (level) => {
  if (level.mode === "tenframe" || level.mode === "decimal")
    return { answer: String(level.answer) };
  if (level.mode === "harbor")
    return { docks: Array(level.model.docks).fill(String(level.answer)) };
  if (level.mode === "coordinate")
    return { x: String(level.answer[0]), y: String(level.answer[1]) };
  if (level.mode === "input") return { answer: String(level.answer) };
  if (level.mode === "choice") return { choice: level.answer };
  if (level.mode === "fraction-single")
    return { numerator: String(level.answer[0]), denominator: String(level.answer[1]) };
  return {
    numerator1: String(level.answer[0][0]),
    denominator1: String(level.answer[0][1]),
    numerator2: String(level.answer[1][0]),
    denominator2: String(level.answer[1][1]),
  };
};

assert.deepEqual(
  PUZZLE_WORLDS.map(({ id }) => id),
  [
    "equationfactory",
    "fractionbridge",
    "balancestation",
    "ratiocity",
    "tenframefactory",
    "divisionharbor",
    "decimaldashboards",
    "integerexpedition",
    "graphcity",
  ],
);
for (const world of PUZZLE_WORLDS) {
  for (let grade = 1; grade <= 8; grade += 1) {
    for (let round = 0; round < 5; round += 1) {
      const level = worldLevel(world.id, grade, round);
      const values = valuesFor(level);
      assert.ok(
        validateWorldAnswer(world.id, level, values),
        `${world.id}/${grade}/${round} accepts its generated solution`,
      );
      assert.equal(
        evaluateWorldBuild(world.id, level, values).balanced,
        true,
        `${world.id}/${grade}/${round} model agrees with its answer check`,
      );
      if (world.id === "ratiocity" && level.mode === "input")
        assert.equal(
          level.model.a * level.model.scale,
          level.answer,
          `Ratio City ${grade}/${round} model computes its stated scale exactly`,
        );
      if (level.mode === "input")
        assert.equal(
          validateWorldAnswer(world.id, level, { answer: "1.2" }),
          false,
          "non-integer input is rejected",
        );
    }
  }
}

const equivalent = worldLevel("fractionbridge", 5, 4);
assert.ok(
  validateWorldAnswer("fractionbridge", equivalent, { numerator: "2", denominator: "5" }),
  "Equivalent representations are accepted exactly",
);
const bridge = worldLevel("fractionbridge", 6, 0);
assert.ok(
  validateWorldAnswer("fractionbridge", bridge, {
    numerator1: "3",
    denominator1: "8",
    numerator2: "3",
    denominator2: "8",
  }),
  "Equivalent fraction pieces sum to the target exactly",
);
assert.equal(
  validateWorldAnswer("fractionbridge", bridge, {
    numerator1: "1",
    denominator1: "0",
    numerator2: "1",
    denominator2: "2",
  }),
  false,
  "Zero denominators are rejected",
);
assert.equal(
  validateWorldAnswer("fractionbridge", bridge, {
    numerator1: "101",
    denominator1: "4",
    numerator2: "0",
    denominator2: "1",
  }),
  false,
  "Oversized fraction input is rejected",
);
assert.equal(
  validateWorldAnswer("fractionbridge", equivalent, { numerator: "4", denominator: "101" }),
  false,
  "Oversized single-fraction input is rejected",
);
assert.equal(
  validateWorldAnswer("equationfactory", worldLevel("equationfactory", 6, 0), { answer: "" }),
  false,
  "An empty field is not treated as zero",
);
assert.equal(
  evaluateWorldBuild("balancestation", worldLevel("balancestation", 6, 0), { answer: "" }).ready,
  false,
  "An empty answer cannot tilt or balance the scale",
);

assert.equal(skillIdForWorld("equationfactory", 6), "one-step");
assert.equal(skillIdForWorld("fractionbridge", 4), "fraction-equiv");
assert.equal(skillIdForWorld("balancestation", 8), "linear-equations");
assert.equal(skillIdForWorld("ratiocity", 7), "proportions");
assert.equal(skillIdForWorld("tenframefactory", 0), "compose-10");
assert.equal(skillIdForWorld("divisionharbor", 3), "division-facts");
assert.equal(skillIdForWorld("decimaldashboards", 5), "decimal-add");
assert.equal(skillIdForWorld("integerexpedition", 7), "integer-add");
assert.equal(skillIdForWorld("graphcity", 8), "functions");
assert.equal(skillIdForWorld("numbergarden", 0), "count-cardinality");
assert.equal(skillIdForWorld("unknown", 7), null);

console.log(
  "fluency-puzzle-worlds: generated answers, exact fractions, model evaluations, and skill links passed",
);

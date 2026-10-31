import assert from "node:assert/strict";
import { adaptiveItem } from "../math/fluency-lab/adaptive-item.js";
import { ALL_SKILLS, seededRandom, validateAnswer } from "../math/fluency-lab/problem-bank.js";
import { drawerSeed } from "../math/fluency-lab/problem-numbers.js";
import {
  generateVariant,
  PROBLEM_VARIANT_TYPES,
  variantsFor,
} from "../math/fluency-lab/problem-types-4.js";
import { isWordy, questionEs } from "../math/fluency-lab/question-es.js";
import { renderInlineProblemModel } from "../math/fluency-lab/visual-lab.js";

let checked = 0;
const covered = new Set();
for (const skill of ALL_SKILLS) {
  const types = variantsFor(skill);
  assert.ok(types.length > 0, `${skill.grade}:${skill.id} advertises a supported format`);
  assert.equal(
    new Set(types).size,
    types.length,
    `${skill.grade}:${skill.id} has no duplicate types`,
  );
  for (const type of types) {
    assert.ok(PROBLEM_VARIANT_TYPES.includes(type), `${type} is in the public type contract`);
    covered.add(type);
    for (let seed = 1; seed <= 12; seed += 1) {
      const item = generateVariant(skill, seededRandom(seed * 991 + skill.grade), {
        level: 3,
        type,
      });
      assert.ok(item, `${skill.grade}:${skill.id} generates ${type}`);
      assert.equal(item.type, type, `${skill.grade}:${skill.id} tags ${type}`);
      assert.ok(
        item.question && item.answers?.length,
        `${skill.grade}:${skill.id} ${type} has a prompt and answer`,
      );
      assert.ok(
        item.answers.every((answer) => validateAnswer(answer, item)),
        `${skill.grade}:${skill.id} ${type} accepts its authored answer`,
      );
      if (item.choices)
        assert.ok(
          item.answers.every((answer) => item.choices.includes(answer)),
          `${type} choices contain the answer`,
        );
      if (isWordy(item.question))
        assert.ok(questionEs(item), `${skill.grade}:${skill.id} ${type} has Spanish wording`);
      if (type === "number-line") {
        assert.match(
          renderInlineProblemModel(skill, item),
          /plot-point/,
          "the marked number-line model renders",
        );
        assert.ok(
          !renderInlineProblemModel(skill, item).includes(`>${item.answers[0]}<`),
          "the number-line model does not label the answer",
        );
      }
      checked += 1;
    }
  }
}
for (const type of PROBLEM_VARIANT_TYPES)
  assert.ok(covered.has(type), `${type} is used by at least one skill`);
for (const skill of ALL_SKILLS) {
  for (let level = 1; level <= 5; level += 1) {
    const item = adaptiveItem(skill, seededRandom(skill.grade * 100 + level), level);
    assert.ok(
      item?.answers?.length,
      `${skill.grade}:${skill.id} tier ${level} has a compatible variant`,
    );
    assert.ok(
      variantsFor(skill).includes(item.type),
      `${skill.grade}:${skill.id} tier ${level} uses a supported format`,
    );
    assert.equal(item.tier, level, `${skill.grade}:${skill.id} preserves the selected tier`);
    checked += 1;
  }
}
const division = ALL_SKILLS.find((skill) => skill.grade === 4 && skill.id === "division");
for (let seed = 1; seed <= 40; seed += 1) {
  const item = adaptiveItem(division, seededRandom(seed), 1);
  assert.equal(
    drawerSeed(item).tool,
    "longdivision",
    "tier 1 division fallback keeps its matching long-division tool",
  );
}
console.log(
  `Fluency problem variants: ${checked} supported items checked across ${ALL_SKILLS.length} skills and ${covered.size} formats`,
);

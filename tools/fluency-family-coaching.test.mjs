import assert from "node:assert/strict";
import { familyCoaching } from "../math/fluency-lab/family/family-coaching.js";
import { coachingCard, strandKey } from "../math/fluency-lab/family/fm2/coach.js";
import { loadAll } from "../math/fluency-lab/family/fm2/registry.js";
import {
  directedSkillPlan,
  findDirectedSkill,
  skillExample,
  skillExplanation,
  skillSearchText,
  teacherMessage,
  teacherSkillLink,
} from "../math/fluency-lab/family/fm2/teacher-link.js";
import { GRADES } from "../math/fluency-lab/problem-bank.js";

const skillById = (grade, id) =>
  GRADES.find((item) => item.grade === grade).skills.find((item) => item.id === id);
const empty = familyCoaching(skillById(0, "count-cardinality"), { recent: [] }, "en");
assert.match(empty.evidence, /No saved checks/);
assert.match(empty.ask, /group has more/);
assert.match(empty.lookFor, /no mastery conclusion/);
const supported = familyCoaching(
  skillById(5, "fraction-add"),
  {
    recent: [{ correct: true, independent: false, level: 1 }],
  },
  "en",
);
assert.match(supported.evidence, /no independent checks/);
assert.match(supported.ask, /one whole/);
assert.match(supported.ifStuck, /included support/);
const independent = familyCoaching(
  skillById(8, "slope"),
  {
    recent: [
      { correct: true, independent: true, level: 1 },
      { correct: false, independent: true, level: 1 },
    ],
  },
  "es",
);
assert.match(independent.evidence, /1 correctas de 2/);
assert.match(independent.ask, /elevación/);
assert.match(independent.ifStuck, /respuesta incorrecta/);
assert.doesNotMatch(independent.lookFor, /^Listen for:/);
assert.match(independent.lookFor, /modelo/);
const repair = familyCoaching(
  skillById(7, "equations"),
  {
    recent: [{ correct: false, independent: true, level: 1 }],
  },
  "en",
);
assert.match(repair.ask, /both sides/);
assert.match(repair.acknowledge, /make the mathematical idea visible/);
assert.equal(
  strandKey("Expressions and algebra tiles", "g8-expand", "array-architect"),
  "binomial-area",
);
const binomial = coachingCard({
  gameId: "array-architect",
  skillId: "g8-expand",
  strand: "Expressions and algebra tiles",
  grade: 8,
});
assert.match(binomial.lookFor.en, /partial rectangle area/);
assert.match(binomial.lookFor.es, /área parcial/);
assert.match(binomial.ifStuck.en, /four parts/);
const games = await loadAll();
const gradeEightSkill = findDirectedSkill(games, 8, "g8-expand", "array-architect");
assert.equal(gradeEightSkill.game.id, "array-architect");
const searchIndex = skillSearchText(gradeEightSkill.game, gradeEightSkill.skill);
assert.ok(searchIndex.includes("hsa.apr.a.1"), "search includes the grade-level standard code");
assert.ok(searchIndex.includes("polynomial"), "search includes common English math terms");
assert.ok(searchIndex.includes("polinomio"), "search includes Spanish math terms");
assert.match(
  skillExplanation(gradeEightSkill.skill, "en"),
  /binomials.*side lengths.*partial area/i,
);
assert.match(skillExplanation(gradeEightSkill.skill, "es"), /binomios.*lados.*área parcial/i);
assert.match(skillExample(gradeEightSkill.game, gradeEightSkill.skill, 8, "en"), /area model/i);
assert.match(skillExample(gradeEightSkill.game, gradeEightSkill.skill, 8, "es"), /modelo de área/i);
assert.equal(
  skillExample(gradeEightSkill.game, gradeEightSkill.skill, 8, "en"),
  skillExample(gradeEightSkill.game, gradeEightSkill.skill, 8, "en"),
  "the sample prompt stays deterministic",
);
for (const game of games) {
  for (const skill of game.skills) {
    const grade = skill.grades[0];
    assert.notEqual(
      skillExample(game, skill, grade, "en"),
      skill.title.en,
      `${game.id}/${skill.id} has an authored, generated example prompt`,
    );
    assert.notEqual(
      skillExample(game, skill, grade, "es"),
      skill.title.es,
      `${game.id}/${skill.id} has an authored, generated Spanish example prompt`,
    );
  }
}
assert.equal(findDirectedSkill(games, 8, "g8-expand", "number-builder"), null);
assert.equal(
  findDirectedSkill(games, 2, "g2-even-odd"),
  null,
  "ambiguous IDs must require the game key",
);
assert.equal(
  findDirectedSkill(games, 9, "g8-expand", "array-architect"),
  null,
  "out-of-range grade rejected",
);
const directed = new URL(
  teacherSkillLink({
    grade: 8,
    gameId: "array-architect",
    skillId: "g8-expand",
    minutes: 15,
    mode: "together",
    lang: "es",
  }),
  "https://example.test/math/fluency-lab/family/",
);
assert.equal(directed.searchParams.get("grade"), "8");
assert.equal(directed.searchParams.get("skill"), "g8-expand");
assert.equal(directed.searchParams.get("game"), "array-architect");
assert.equal(directed.searchParams.get("minutes"), "15");
assert.equal(directed.searchParams.get("lang"), "es");
assert.equal(directed.searchParams.get("mode"), "together");
assert.equal(directed.searchParams.has("profile"), false);
assert.equal(directed.searchParams.has("learner"), false);
assert.match(
  teacherMessage({
    skill: gradeEightSkill.skill,
    grade: 8,
    minutes: 15,
    lang: "es",
    url: directed.href,
  }),
  /No es una tarea obligatoria/,
);
assert.match(
  teacherMessage({
    skill: gradeEightSkill.skill,
    grade: 8,
    minutes: 15,
    lang: "es",
    url: directed.href,
  }),
  /modelo de área rectangular.*áreas parciales.*términos semejantes/,
);
assert.match(
  teacherMessage({
    skill: gradeEightSkill.skill,
    grade: 8,
    minutes: 15,
    lang: "en",
    url: directed.href,
  }),
  /rectangle area model.*partial areas.*combine like terms/,
);
const focusedPlan = directedSkillPlan({
  ...gradeEightSkill,
  grade: 8,
  minutes: 5,
  mode: "together",
  level: 2,
});
assert.equal(focusedPlan.activities.length, 1);
assert.equal(focusedPlan.activities[0].skillId, "g8-expand");
assert.equal(focusedPlan.mode, "together");
assert.equal(
  directedSkillPlan({ ...gradeEightSkill, grade: 7 }),
  null,
  "skill cannot cross grade boundaries",
);
console.log(
  "Family coaching uses skill-specific mathematics and separates missing, supported, and independent evidence.",
);

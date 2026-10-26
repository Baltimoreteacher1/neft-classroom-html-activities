import assert from "node:assert/strict";
import { familyCoaching } from "../math/fluency-lab/family/family-coaching.js";
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
console.log(
  "Family coaching uses skill-specific mathematics and separates missing, supported, and independent evidence.",
);

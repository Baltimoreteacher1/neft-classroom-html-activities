import assert from "node:assert/strict";
import {
  applyGradeExperience,
  GRADE_EXPERIENCE_GRADES,
  gradeExperience,
  gradeExperienceBanner,
} from "../math/fluency-lab/grade-experience.js";

assert.deepEqual(GRADE_EXPERIENCE_GRADES, [1, 2, 3, 4, 5, 6, 7, 8]);
const names = new Set();
const accents = new Set();
for (const grade of GRADE_EXPERIENCE_GRADES) {
  const profile = gradeExperience(grade);
  assert.ok(
    profile.name && profile.kicker && profile.invitation && profile.focus,
    `Grade ${grade} needs learner-facing experience copy`,
  );
  assert.ok(
    profile.instruction.navigation &&
      profile.instruction.reading &&
      profile.instruction.model &&
      profile.instruction.explanation &&
      profile.instruction.feedback &&
      profile.instruction.writing,
    `Grade ${grade} needs an instructional profile`,
  );
  assert.ok(
    profile.art.startsWith("<") && profile.art.length > 100,
    `Grade ${grade} needs its own visual model`,
  );
  assert.ok(!names.has(profile.name), `Grade ${grade} must have its own identity`);
  assert.ok(!accents.has(profile.colors[0]), `Grade ${grade} must have its own accent`);
  names.add(profile.name);
  accents.add(profile.colors[0]);
  const banner = gradeExperienceBanner(grade);
  assert.ok(
    banner.includes(profile.name.replaceAll("&", "&amp;")) && banner.includes(profile.invitation),
  );
  assert.ok(banner.includes(`Grade ${grade} learning experience`));
}

const styles = new Map();
const root = {
  dataset: {},
  style: {
    setProperty: (name, value) => styles.set(name, value),
    removeProperty: (name) => styles.delete(name),
  },
  removeAttribute: (name) => {
    delete root.dataset.gradeExperience;
  },
};
const bannerHost = { innerHTML: "" };
globalThis.document = {
  documentElement: root,
  querySelector: () => bannerHost,
  querySelectorAll: () => [],
};
for (const grade of GRADE_EXPERIENCE_GRADES) {
  const profile = applyGradeExperience(grade);
  assert.equal(root.dataset.gradeExperience, String(grade));
  assert.equal(root.dataset.primaryFlow, profile.instruction.navigation);
  assert.equal(root.dataset.writingStyle, profile.instruction.writing);
  assert.equal(styles.get("--grade"), profile.colors[0]);
  assert.equal(styles.get("--experience-font"), profile.font);
  assert.equal(styles.get("--experience-card-gap"), `${profile.density}rem`);
  assert.ok(bannerHost.innerHTML.includes(profile.name.replaceAll("&", "&amp;")));
}
assert.equal(applyGradeExperience(0), null);
assert.equal(root.dataset.gradeExperience, undefined);
assert.equal(root.dataset.primaryFlow, undefined);
assert.equal(styles.get("--grade"), "#e59b46");
assert.equal(gradeExperience(9), null);
console.log(
  "Grade experience: eight distinct profiles, branded banners, and stable grade switching passed.",
);

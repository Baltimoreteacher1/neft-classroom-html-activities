// Phase 1: the grade-adaptive system and the semantic design tokens.
// Pure checks (no browser): eight distinct experiences, every declared contrast pair, generated CSS freshness.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyGradeSystem,
  GRADE_SYSTEM,
  GRADE_SYSTEM_GRADES,
  gradeScene,
  gradeSystem,
} from "../math/fluency-lab/e8/grade-system.js";
import {
  CONTRAST_PAIRS,
  contrastRatio,
  DOMAINS,
  domainForStrand,
  TOKENS,
} from "../math/fluency-lab/e8/tokens.js";
import { ALL_SKILLS } from "../math/fluency-lab/problem-bank.js";
import { buildCss } from "./build-fluency-e8-tokens.mjs";

assert.deepEqual(GRADE_SYSTEM_GRADES, [1, 2, 3, 4, 5, 6, 7, 8]);

// Each grade must differ in the dimensions a publisher would see: header, card, path, feedback and illustration.
for (const dimension of ["header", "card", "illustration"]) {
  const values = GRADE_SYSTEM_GRADES.map((grade) => GRADE_SYSTEM[grade][dimension]);
  assert.equal(
    new Set(values).size,
    8,
    `Every grade needs its own ${dimension}: ${values.join(", ")}`,
  );
}
for (const dimension of [
  "nav",
  "progress",
  "path",
  "feedback",
  "motion",
  "controls",
  "density",
  "language",
  "independence",
  "type",
]) {
  const values = new Set(GRADE_SYSTEM_GRADES.map((grade) => GRADE_SYSTEM[grade][dimension]));
  assert.ok(values.size >= 2, `${dimension} must vary across the grades`);
}
// Adjacent-grade pairs must differ in at least four presentation dimensions, not only in colour.
const keys = [
  "header",
  "nav",
  "card",
  "path",
  "feedback",
  "motion",
  "controls",
  "density",
  "progress",
  "illustration",
  "language",
  "independence",
  "type",
];
for (let grade = 1; grade < 8; grade += 1) {
  const diff = keys.filter(
    (key) => GRADE_SYSTEM[grade][key] !== GRADE_SYSTEM[grade + 1][key],
  ).length;
  assert.ok(diff >= 4, `Grades ${grade} and ${grade + 1} differ in only ${diff} dimensions`);
}
// Younger grades get bigger targets, more air and longer animations; older grades get denser, quicker, smaller.
for (let grade = 1; grade < 8; grade += 1) {
  assert.ok(
    GRADE_SYSTEM[grade].targetPx >= GRADE_SYSTEM[grade + 1].targetPx,
    "targets shrink monotonically",
  );
  assert.ok(
    gradeSystem(grade).motionMs >= gradeSystem(grade + 1).motionMs,
    "animation shortens monotonically",
  );
  assert.ok(
    GRADE_SYSTEM[grade].practiceItems <= GRADE_SYSTEM[grade + 1].practiceItems,
    "practice density grows monotonically",
  );
}
for (const grade of GRADE_SYSTEM_GRADES) {
  const profile = gradeSystem(grade);
  assert.ok(profile.targetPx >= 44, `Grade ${grade} touch target must be at least 44px`);
  assert.ok(profile.manipulatives.length >= 4, `Grade ${grade} lists its mathematical models`);
  const scene = gradeScene(grade);
  assert.ok(
    scene.startsWith("<svg") && scene.includes('role="img"') && scene.length > 800,
    `Grade ${grade} needs an original scene`,
  );
  assert.ok(
    !/<script|href=|<image|url\(http/i.test(scene),
    `Grade ${grade} scene must be self-contained vector art`,
  );
}
assert.equal(
  new Set(GRADE_SYSTEM_GRADES.map((grade) => gradeScene(grade))).size,
  8,
  "scenes are all different",
);
assert.equal(gradeSystem(9), null);

// applyGradeSystem writes only presentation attributes and cleans up for a grade without a profile.
const root = {
  dataset: {},
  style: {
    props: new Map(),
    setProperty(name, value) {
      this.props.set(name, value);
    },
    removeProperty(name) {
      this.props.delete(name);
    },
  },
};
applyGradeSystem(6, root);
assert.equal(root.dataset.gradeSystem, "6");
assert.equal(root.dataset.gsHeader, "reasoning-lab");
assert.equal(root.style.props.get("--gs-target"), "44px");
applyGradeSystem(1, root);
assert.equal(root.dataset.gsHeader, "storybook");
assert.equal(root.style.props.get("--gs-target"), "60px");
applyGradeSystem(null, root);
assert.deepEqual(root.dataset, {});
assert.equal(root.style.props.size, 0);

// Tokens: every pair in both themes meets its WCAG 2.2 AA threshold. Computed on the emitted hex values.
for (const theme of ["light", "dark"]) {
  for (const [foreground, background, minimum] of CONTRAST_PAIRS) {
    const fg = TOKENS[theme][foreground];
    const bg = TOKENS[theme][background];
    assert.ok(fg && bg, `${theme}: token ${foreground} or ${background} is missing`);
    const ratio = contrastRatio(fg, bg);
    assert.ok(
      ratio >= minimum,
      `${theme}: ${foreground} (${fg}) on ${background} (${bg}) is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
    );
  }
}
assert.deepEqual(
  Object.keys(TOKENS.light).sort(),
  Object.keys(TOKENS.dark).sort(),
  "light and dark define the same tokens",
);
// No violet, purple or magenta in the learner-facing domain tokens (repo palette rule).
const hue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (!d) return { h: 0, s: 0 };
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const l = (max + min) / 2;
  return { h: (h * 60 + 360) % 360, s: d / (1 - Math.abs(2 * l - 1)) };
};
for (const [name, value] of Object.entries(TOKENS.light)) {
  const { h, s } = hue(value);
  assert.ok(
    !(h >= 255 && h <= 335 && s > 0.15),
    `${name} ${value} falls in the forbidden purple/magenta range`,
  );
}

// Every strand in the skill library maps to one of the eight domains, and every domain is used.
const used = new Set();
for (const skill of ALL_SKILLS) {
  const domain = domainForStrand(skill.strand);
  assert.ok(DOMAINS.includes(domain), `${skill.strand} -> ${domain}`);
  used.add(domain);
}
assert.equal(used.size, DOMAINS.length, "every domain is exercised by the skill library");

// Generated CSS is current.
const css = readFileSync(
  new URL("../math/fluency-lab/e8/tokens.generated.css", import.meta.url),
  "utf8",
);
assert.equal(
  css,
  buildCss(),
  "tokens.generated.css is stale; run node tools/build-fluency-e8-tokens.mjs",
);

console.log(
  "Enterprise 8 grade system: 8 distinct experiences, WCAG token pairs, domains and generated CSS passed.",
);

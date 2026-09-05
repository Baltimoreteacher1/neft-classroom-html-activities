// The end-of-lesson objectives (Phase 8 + the completion certificate) restate
// each goal in the third person using the name the student typed on Launch:
// "I can compare ratios using a table." → "Samuel can now compare ratios using
// a table." Three things can go wrong and none of them throws:
//   1. the rewrite silently stops matching and every student sees "I can …"
//      again at the end of the lesson,
//   2. the name is spliced in unescaped, so a name is free to inject markup
//      into a sentence that already contains vocabulary <button> elements,
//   3. an objective surface starts suppressing the term illustration again, so
//      tapping an underlined word there gives a picture-less popup.
// This file pins all three.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { studentFirstName, toThirdPersonObjective } from "@eduwonderlab/engine/core/objective-voice.js";

const stateWith = (studentName) => ({ get: () => ({ studentName }) });

// ── studentFirstName ────────────────────────────────────────────────────────
assert.equal(studentFirstName(stateWith("Samuel N.")), "Samuel");
assert.equal(studentFirstName(stateWith("  samuel  ")), "samuel");
assert.equal(studentFirstName(stateWith("Ana-María R")), "Ana-María");
assert.equal(studentFirstName(stateWith("O'Brien")), "O'Brien");
assert.equal(studentFirstName(stateWith("")), "", "no name entered → empty");
assert.equal(studentFirstName(stateWith(undefined)), "");
assert.equal(studentFirstName(undefined), "", "missing state must not throw");
assert.equal(studentFirstName({}), "", "state without get() must not throw");
assert.equal(
  studentFirstName(stateWith("<script>x</script>")),
  "scriptxscript",
  "markup characters are stripped from the name before it is ever rendered",
);
assert.ok(studentFirstName(stateWith("a".repeat(200))).length <= 40, "name is length-capped");

// ── toThirdPersonObjective ──────────────────────────────────────────────────
assert.equal(
  toThirdPersonObjective("I can compare ratios using a table.", "Samuel"),
  "Samuel can now compare ratios using a table.",
);
assert.equal(
  toThirdPersonObjective("I will be able to divide fractions.", "Samuel"),
  "Samuel can now divide fractions.",
);
assert.equal(
  toThirdPersonObjective("I am able to divide fractions.", "Samuel"),
  "Samuel can now divide fractions.",
);
assert.equal(
  toThirdPersonObjective("Students will graph ordered pairs.", "Samuel"),
  "Samuel can now graph ordered pairs.",
);

// Interior pronouns move to third person too, otherwise the opener rewrite
// produces "Samuel can now explain how I broke a number down".
assert.equal(
  toThirdPersonObjective("I can explain how I broke a number down using my factor tree.", "Samuel"),
  "Samuel can now explain how they broke a number down using their factor tree.",
);
assert.equal(
  toThirdPersonObjective("I can check that I am correct by myself.", "Samuel"),
  "Samuel can now check that they are correct by themselves.",
);
assert.equal(
  toThirdPersonObjective("I can show my work and explain it to me.", "Samuel"),
  "Samuel can now show their work and explain it to them.",
);
// "I" inside a tag attribute is never touched.
assert.equal(
  toThirdPersonObjective('I can use a <span data-x="I my me">model</span>.', "Samuel"),
  'Samuel can now use a <span data-x="I my me">model</span>.',
);

// No name entered → the ordinary first-person wording is left completely alone.
assert.equal(toThirdPersonObjective("I can compare ratios.", ""), "I can compare ratios.");
assert.equal(toThirdPersonObjective("I can compare ratios.", null), "I can compare ratios.");

// Unrecognised opener → returned verbatim. A mangled objective is worse than a
// first-person one; the surrounding card names the student either way.
assert.equal(
  toThirdPersonObjective("Puedo comparar razones usando una tabla.", "Samuel"),
  "Puedo comparar razones usando una tabla.",
);

// The objective text arrives already linkified: only the leading pronoun may be
// touched, and the vocabulary buttons must survive untouched.
const linkified =
  'I can find the <button type="button" class="obj-term" data-term-idx="2">GCF</button> of two numbers.';
const rewritten = toThirdPersonObjective(linkified, "Samuel");
assert.equal(
  rewritten,
  'Samuel can now find the <button type="button" class="obj-term" data-term-idx="2">GCF</button> of two numbers.',
);
assert.equal((rewritten.match(/<button/g) || []).length, 1, "vocab button preserved exactly once");

// The name is escaped on the way in, even though studentFirstName also filters.
assert.equal(
  toThirdPersonObjective("I can graph points.", '<img src=x onerror="alert(1)">'),
  "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; can now graph points.",
);

// ── Wiring contracts in the renderer ────────────────────────────────────────
const renderer = readFileSync(
  new URL("../engine/core/lesson-renderer.js", import.meta.url),
  "utf8",
);
const app = readFileSync(new URL("../engine/core/app.js", import.meta.url), "utf8");

assert.match(
  renderer,
  /renderObjectives\(card, config, state, \{ review: true \}\)/,
  "Phase 8 must render the objectives in review (third-person) mode",
);

// Every vocab popup shows the term's illustration when the term HAS one — the
// goal cards included. They used to pass `{ hideImage: true }`, which made the
// objectives the only place on the site where tapping an underlined word gave a
// definition with no picture; it read as a broken popup, not a design choice.
// (The generic "#" category tile is still suppressed — see hasRealVocabImage.)
for (const [label, src] of [
  ["lesson-renderer.js", renderer],
  ["app.js", app],
]) {
  assert.equal(
    (src.match(/hideImage/g) || []).length,
    0,
    `${label}: objective popups must not suppress the term illustration`,
  );
}

// The visual-model picture stays click-to-enlarge on the objective cards.
assert.match(
  renderer,
  /block\.querySelectorAll\("\.visual-model-wrapper img"\)[\s\S]{0,120}attachImageZoom/,
  "objective visual models must remain click-to-enlarge",
);

// ── "avatar" is not student-facing language ─────────────────────────────────
// The visual-model captions used to describe the figure as a "Student avatar",
// which reads as game-speak to a 6th grader. Nothing shipped may say it again.
for (const rel of [
  "../engine/core/lesson-renderer.js",
  "../assets/learning-supports/learning-supports.js",
  "../public/assets/learning-supports/learning-supports.js",
]) {
  const lines = readFileSync(new URL(rel, import.meta.url), "utf8").split("\n");
  // Scoped to the caption text itself, so an unrelated "avatar" elsewhere in the
  // engine (mentor portraits, say) does not trip a gate about objective captions.
  const offenders = lines.filter(
    (line) =>
      /avatar/i.test(line) &&
      /Visual Representation|VisualCaption|desk grid mat|grid mat/i.test(line),
  );
  assert.deepEqual(
    offenders,
    [],
    `${rel}: the word "avatar" must not appear in objective visual captions`,
  );
}

console.log("objective-voice: all assertions passed");

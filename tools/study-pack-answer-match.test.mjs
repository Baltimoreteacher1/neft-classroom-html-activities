// The Study Pack engine ships as a classic script to two deploy roots
// (curriculum/study-pack/ and focus-school/shared/study-pack/), so it cannot
// import the shared answer matcher — tools/sync-study-pack.mjs generates the
// matcher into it instead. Two things can rot silently there: the generated
// block can drift from engine/core/answer-match.js after someone edits the
// matcher without running the sync, and the two shipped copies can fall behind
// the canonical file. Both would leave students graded by stale rules on a page
// that still loads and still looks fine, so assert them.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { withAnswerMatch } from "./sync-study-pack.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL = resolve(ROOT, "shared/study-pack/study-pack.js");
const COPIES = [
  resolve(ROOT, "curriculum/study-pack/study-pack.js"),
  resolve(ROOT, "focus-school/shared/study-pack/study-pack.js"),
];

const source = readFileSync(CANONICAL, "utf8");

assert.equal(
  source,
  withAnswerMatch(source),
  "shared/study-pack/study-pack.js has drifted from engine/core/answer-match.js — run `node tools/sync-study-pack.mjs`",
);

for (const copy of COPIES) {
  assert.equal(
    readFileSync(copy, "utf8"),
    source,
    `${copy} is out of sync with shared/study-pack/study-pack.js — run \`node tools/sync-study-pack.mjs\``,
  );
}

// Drift-free is not the same as working. Boot each shipped copy's own matcher
// and grade the answers a student really types.
const CASES = [
  { input: "8", answer: "c = 8", want: true },
  { input: "c = 8", answer: "8", want: true },
  { input: "8 cups", answer: "8", want: true },
  { input: "24", answer: "24 sq. ft.", want: true },
  { input: ".5", answer: "1/2", want: true },
  { input: "9", answer: "8", want: false },
  { input: "42", answer: "2 × 3 × 7", want: false },
  { input: "", answer: "8", want: false },
];

function bootMatcher(file) {
  const text = readFileSync(file, "utf8");
  const start = text.indexOf("var NTAnswerMatch = (function () {");
  const end = text.indexOf("})();", start);
  assert.notEqual(start, -1, `${file} does not carry the generated matcher`);
  assert.notEqual(end, -1, `${file} has an unterminated matcher block`);
  const block = text.slice(start, end + "})();".length);
  return new Function(`${block}\nreturn NTAnswerMatch;`)();
}

for (const file of [CANONICAL, ...COPIES]) {
  const matcher = bootMatcher(file);
  for (const { input, answer, want } of CASES) {
    assert.equal(
      matcher.isRight(input, answer),
      want,
      `${file}: should ${want ? "accept" : "reject"} ${JSON.stringify(input)} for ${JSON.stringify(answer)}`,
    );
  }
}

// The engine must actually USE it — an inlined-but-unreferenced matcher grades
// nothing.
assert.ok(
  (source.match(/NTAnswerMatch\.isRight\(/g) || []).length >= 3,
  "the study-pack engine no longer checks answers through NTAnswerMatch",
);

console.log(
  `study-pack answer matcher: in sync across ${COPIES.length + 1} file(s), ${CASES.length} grading cases passed`,
);

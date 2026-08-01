// Homework pages are standalone HTML with a classic (non-module) inline
// script, so they cannot `import` the site-wide answer matcher — but they must
// not carry a second, divergent copy of the grading rules either. This inlines
// `engine/core/answer-match.js` verbatim at generate time, wrapped in an IIFE
// so its helper names (`norm`, `numberOf`, …) cannot collide with the other
// inline scripts on the page.
//
// Consumers call `NTAnswerMatch.isRight(studentValue, correctValue)`.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ANSWER_MATCH_SOURCE_PATH = join(HERE, "..", "engine", "core", "answer-match.js");

const EXPORTED = ["norm", "numberOf", "stripLabel", "numericValue", "isRight", "fullerFormHint"];

const source = readFileSync(ANSWER_MATCH_SOURCE_PATH, "utf8").replace(/^export\s+/gm, "");

// A backtick or "${" in the module would break the generator's template
// literals downstream; fail loudly rather than emit a corrupted page.
if (/[`]|\$\{/.test(source)) {
  throw new Error(
    "answer-match.js now contains a backtick or ${ — it can no longer be inlined verbatim into homework HTML.",
  );
}

// This text lands inside every homework page, where `audit:homework` decides
// which topic the page's visual explainer is about by grepping the whole
// document. A literal superscript power in a comment reads as "this page shows
// an exponents visual" and knocked all 8 Unit 7 equation/inequality lessons out
// of alignment. Keep the matcher's prose free of those signals.
const AUDIT_TOPIC_SIGNALS =
  /Base = \d · Exponent|introduction-to-exponents|2³|Multiply 2 three times/i;
if (AUDIT_TOPIC_SIGNALS.test(source)) {
  throw new Error(
    "answer-match.js contains text that audit:homework reads as an exponents visual. " +
      "Write powers as 2^3 rather than with a superscript glyph.",
  );
}

export const ANSWER_MATCH_JS = `// ── Shared answer matcher — generated from engine/core/answer-match.js.
// Do not edit here; edit that file and re-run scripts/generate-homework-html.mjs.
var NTAnswerMatch = (function () {
${source}
  return { ${EXPORTED.join(", ")} };
})();`;

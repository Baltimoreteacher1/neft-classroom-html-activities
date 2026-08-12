#!/usr/bin/env node
/* =============================================================================
 * validate-concept-intro.mjs — the Build-the-Idea worked example must stand on
 * its own.
 * -----------------------------------------------------------------------------
 *   node tools/validate-concept-intro.mjs
 *
 * WHY THIS EXISTS
 * ---------------
 * Reported from the classroom (2026-08-12): the Build-the-Idea card on
 * /lessons/1-1-group1/ showed three modelled steps for a Ferris wheel problem
 * that was never stated. The steps computed with a number of cars nobody had
 * been given and concluded with "about 78.5 people", a figure that appeared
 * from nowhere and contradicted the lesson's own tape diagram (20 × 4 ≈ 80).
 *
 * The audit that followed read all 84 core `iDo` blocks. 73 were strong. The
 * failures clustered into exactly two shapes that a machine can check without
 * guessing at meaning, and this gate checks those two and nothing else.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * The audit first tried a semantic heuristic: flag any number in the concluding
 * line that is not derivable from earlier lines. It flagged 18 lessons and was
 * wrong on almost all of them — it cannot tell an unexplained answer from an
 * estimation check ("about 130 + 47 − 19 = 158"), a verification substitution
 * ("x = 60 gives 63 > 53"), or a three-term sum. Wiring that into a gate would
 * have produced a permanently-red check, which is a check nobody reads. It is
 * not here. Deciding which worked examples are weak is a reading task.
 *
 * THE TWO INVARIANTS
 * ------------------
 *   1. No reference to an artifact the card does not render. The Build card
 *      renders a title and lines — no image, ever (verified in the browser:
 *      zero <svg>, no <img>). So "the picture" names something the student is
 *      looking for and cannot find.
 *   2. Unit consistency. If a line asserts a squared or cubic unit ("158 in²"),
 *      some line must have attached that base unit to a given. An answer whose
 *      unit appears from nowhere is internally inconsistent.
 *
 * Both are string facts, not judgements. Self-tests run first, so a gate that
 * stops firing fails loudly instead of reporting a clean curriculum.
 * ========================================================================== */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

/** Artifacts the Build card cannot show. Narrow on purpose: a definite article
 *  plus a rendered-medium noun. "a photo of peas" is fine — it is describing a
 *  scenario, not pointing at something on screen. */
const ARTIFACT =
  /\bthe (?:whole |first |second |same )?(?:picture|image|photo|drawing)\b|\bthe (?:diagram|graph|table|chart) above\b/i;

/** Squared/cubic unit assertions, and the base unit each one requires. */
// A `base` match must be a NUMBER carrying the plain unit — "8 in. long",
// "2 ft wide" — and must not be the squared/cubic claim itself, or every claim
// would ground itself ("158 in²" contains "in"). Two traps are pinned by the
// self-tests below, because both make the check silently unsatisfiable rather
// than loud:
//   • `in\.\b` can never match: a period followed by a space is non-word to
//     non-word, so there is no boundary there.
//   • a bare `\bft\b` DOES match inside "3 ft³", so the lookahead is required.
const UNIT_CLAIMS = [
  {
    claim: /\b(?:in|inch|inches)(?:²|\^2|³|\^3)/i,
    base: /\d(?:\.\d+)?\s*(?:in\.|inch(?:es)?\b)/i,
    name: "inches",
  },
  {
    claim: /\bcm(?:²|\^2|³|\^3)/i,
    base: /\d(?:\.\d+)?\s*(?:cm\b(?!²|³|\^)|centimet)/i,
    name: "centimetres",
  },
  {
    claim: /\b(?:ft|feet|foot)(?:²|\^2|³|\^3)/i,
    base: /\d(?:\.\d+)?\s*(?:ft\b(?!²|³|\^)|feet\b|foot\b)/i,
    name: "feet",
  },
];

/** Every problem found in one lesson's iDo. */
export function checkIdo(lines) {
  const problems = [];
  const all = (lines || []).join(" ");
  for (const line of lines || []) {
    if (ARTIFACT.test(line)) {
      problems.push(
        `references an artifact the card does not render — "${line.trim().slice(0, 70)}"`,
      );
    }
  }
  for (const { claim, base, name } of UNIT_CLAIMS) {
    if (claim.test(all) && !base.test(all)) {
      problems.push(`asserts an area/volume unit in ${name} but no given carries that unit`);
    }
  }
  return problems;
}

/* ----------------------------------------------------------------- selftest */

const selftests = [
  [["Then I ask how many of those clusters would cover the whole picture."], 1, "whole picture"],
  [["Then I estimate how many stacks like that are in the picture."], 1, "the picture"],
  [["A bowl is full of peas. About how many are in the bowl?"], 0, "scenario prose is fine"],
  [["I look at a photo of peas and count one cluster."], 0, "indefinite 'a photo' is fine"],
  [["My box is 8 long, 5 wide, 3 tall.", "The surface area is 158 in²."], 1, "unit from nowhere"],
  [["My box is 8 in. long, 5 in. wide.", "The surface area is 158 in²."], 0, "unit is grounded"],
  [
    ["My box is 6 long, 4 wide.", "The volume is 72 cubic units."],
    0,
    "no unit claimed, none needed",
  ],
  [
    ["My garden has a base of 12 feet and a height of 8 feet.", "The area is 48 square feet."],
    0,
    "spelled-out units",
  ],
  // The bare-"ft" trap: 5-10 states "2 ft long" and concludes "3 ft³". Grounded.
  [
    ["My capsule is 2 ft long, 1.5 ft wide, and 1 ft tall.", "So the volume is 3 ft³."],
    0,
    "bare ft grounds ft³",
  ],
  // …but the claim must not ground itself. Nothing here carries a plain unit.
  [["My box is 8 long, 5 wide, 3 tall.", "The volume is 120 ft³."], 1, "ft³ cannot ground itself"],
];
let selfFailed = 0;
for (const [lines, want, why] of selftests) {
  const got = checkIdo(lines).length;
  if (got !== want) {
    console.error(`SELFTEST FAIL (${why}): expected ${want} problem(s), got ${got}`);
    selfFailed += 1;
  }
}
if (selfFailed) {
  console.error(
    `\nvalidate:concept-intro — ${selfFailed} self-test(s) failed; the gate is not trustworthy.`,
  );
  process.exit(1);
}

/* -------------------------------------------------------------------- sweep */

const ids = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .filter((id) => existsSync(join(LESSONS, id, "config.json")))
  .sort();

const failures = [];
let scanned = 0;
for (const id of ids) {
  let config;
  try {
    config = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
  } catch {
    continue;
  }
  const ido = config.launch?.conceptIntro?.iDo;
  if (!ido) continue;
  scanned += 1;
  if (!Array.isArray(ido.lines) || !ido.lines.length) {
    failures.push(`${id}: iDo has no lines — the card renders nothing at all`);
    continue;
  }
  for (const problem of checkIdo(ido.lines)) failures.push(`${id}: ${problem}`);
}

if (failures.length) {
  console.error(`validate:concept-intro FAILED (${failures.length} problem(s)):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(
    `\nThese are the two shapes a machine can check. Everything else about a worked` +
      ` example — whether it states its givens, whether the strategy matches the` +
      ` standard — is a reading task, deliberately not gated here.`,
  );
  process.exit(1);
}

console.log(
  `validate:concept-intro PASS ✅ (${scanned} Build-the-Idea blocks: no unrendered-artifact references, no ungrounded area/volume units; ${selftests.length} self-tests green)`,
);

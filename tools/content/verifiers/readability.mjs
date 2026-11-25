// Verifier 2: surface readability by band, against proposed per-grade ceilings.
//
// Measure: Flesch-Kincaid grade level (lib/readability.mjs) over prose strings. It is a sentence-length and word-length
// estimate. It does NOT measure comprehension, vocabulary difficulty, background knowledge or how a Language Learner will
// understand the text, and a low score is not evidence that text is accessible. The syllable counter is a heuristic.
//
// Checks per unit:
//   READ_UNIT_OVER_CEILING   student-facing unit text (questions, passages, missions, definitions, models) above the grade ceiling
//   READ_BAND_OVER_CEILING   band-specific scaffold text (frames, supports, "I can" objectives) above ceiling + band offset
//   READ_BAND_DECREASING     difficulty is not non-decreasing l1_2 <= l3_4 <= l5_6 (beyond the tolerance)
//   READ_TOO_LITTLE_TEXT     a band or unit has too little prose to score (info)
// Ceilings live in tools/content/ceilings.json (proposed, pending Joel approval). Findings are reported and ratcheted;
// nothing here edits content.
//
// False-positive classes (hand-read): units whose required Tier 3 vocabulary lifts the score (science and math terms such as
// "photosynthesis", "equivalent"); very short frames where one long word moves the band score by 1+ grade; band text that
// repeats a long domain term in every support line. Treat a finding as "look at this unit", not "this unit is wrong".
import fs from "node:fs";
import { FIXTURES } from "./lib/fixtures-a.mjs";
import { gradeOf } from "./lib/readability.mjs";
import { BANDS, bandText, unitStudentText } from "./lib/texts.mjs";

export const name = "readability";
export const fixtures = FIXTURES["readability"];
export const coverageCodes = ["READ_MEASURED"];
export const CEILINGS = JSON.parse(
  fs.readFileSync(new URL("../ceilings.json", import.meta.url), "utf8"),
);
const MIN_STRINGS = 6;

const info = (code, path, message, evidence) => ({
  code,
  severity: "info",
  path,
  message,
  evidence,
});
const warn = (code, path, message, evidence) => ({
  code,
  severity: "warn",
  path,
  message,
  evidence,
});

export function verify(target, ceilings = CEILINGS) {
  const grade = String(target.grade);
  const unitCeiling = ceilings.unitCeilingByGrade[grade];
  if (unitCeiling === undefined)
    return [info("READ_NO_CEILING", "", `no ceiling for grade ${grade}`, { n: 1 })];
  const findings = [];
  const unitText = unitStudentText(target);
  const unitFk = gradeOf(unitText);
  const unitStrings = unitText.length;
  if (unitFk === null || unitStrings < MIN_STRINGS)
    findings.push(
      info("READ_TOO_LITTLE_TEXT", "unit", "too little student prose to score", { n: 1 }),
    );
  else if (unitFk > unitCeiling)
    findings.push(
      warn(
        "READ_UNIT_OVER_CEILING",
        "unit",
        `unit text scores ${unitFk} > ceiling ${unitCeiling} for grade ${grade}`,
        { fk: unitFk, ceiling: unitCeiling },
      ),
    );

  const fk = {};
  for (const band of BANDS) {
    const texts = bandText(target, band);
    fk[band] = texts.length >= MIN_STRINGS ? gradeOf(texts) : null;
    const limit = unitCeiling + (ceilings.bandCeilingOffset[band] ?? 0);
    if (fk[band] === null)
      findings.push(
        info("READ_TOO_LITTLE_TEXT", band, `band ${band} has too little scaffold prose to score`, {
          n: 1,
        }),
      );
    else if (fk[band] > limit)
      findings.push(
        warn("READ_BAND_OVER_CEILING", band, `band ${band} scores ${fk[band]} > ceiling ${limit}`, {
          band,
          fk: fk[band],
          ceiling: limit,
        }),
      );
  }
  const tol = ceilings.bandMonotonicTolerance ?? 0;
  for (let i = 1; i < BANDS.length; i += 1) {
    const [lo, hi] = [fk[BANDS[i - 1]], fk[BANDS[i]]];
    if (lo !== null && hi !== null && hi + tol < lo)
      findings.push(
        warn(
          "READ_BAND_DECREASING",
          `${BANDS[i - 1]}>${BANDS[i]}`,
          `difficulty drops from ${BANDS[i - 1]} (${lo}) to ${BANDS[i]} (${hi})`,
          { lower: BANDS[i - 1], upper: BANDS[i], lowerFk: lo, upperFk: hi },
        ),
      );
  }
  findings.push(
    info("READ_MEASURED", "", `unit fk ${unitFk}; bands ${BANDS.map((b) => fk[b]).join(" / ")}`, {
      n: 1,
      unitFk,
      bands: fk,
    }),
  );
  return findings;
}

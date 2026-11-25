// Verifier: every unit's core_standards (data/bcpss-curriculum-seed.mjs, field `core_standards`) are real codes for the
// unit's grade and subject, and the standards line up with the lessons that teach them.
//
// What counts as "real":
//   - Grade 6 Math: membership in the repo's reference lists (data/ccss-standards.json, data/standards-crosswalk-2025.json,
//     data/standards-taxonomy.json), via buildStandardsRefs(). Seed codes are the 2010 CCSS spelling (6.RP.A.1), the lists
//     carry both spellings, so either resolves.
//   - Every other grade/subject: the repo has NO code list (ELA, Science, Social Studies, Math K-5/7-8). No list is invented.
//     The code is checked for SHAPE only (family, grade segment or band, number range, domain exists at that grade) and
//     the unit gets one `standard_no_reference_list` info finding so the gap stays visible.
//
// Findings:
//   standard_invalid_code         error  malformed, wrong grade/band, or a domain/number that does not exist
//   standard_not_in_reference     error  Grade 6 Math code absent from every reference list
//   standard_duplicate            warn   same code listed twice in one unit
//   standard_untouched            warn   unit core standard that no lesson of the unit lists
//   activity_no_listed_standard   warn   lesson whose standards share nothing with the unit's core standards (its activities
//                                        inherit the lesson's standards, so they teach no listed standard)
//   lesson_standard_not_in_unit   info   lesson lists a code the unit does not (partial extra)
//   lesson_standard_invalid_code  error  a lesson lists a code that fails the same shape rules
//   standard_no_reference_list    info   shape-only subject (count kept)
//
// Standards are referenced by code and short name only. No standard text is reproduced.
//
// False-positive classes found by hand-reading the real sweep (docs/content/verifiers-b.md):
//   - standard_untouched: generated draft lesson sets spread 2-3 standards over 8-10 lessons; a core standard with no lesson
//     is a real coverage gap, but some units list review standards on purpose.
//   - lesson_standard_not_in_unit: authored lessons cite a prerequisite standard from the previous unit.

import { finding } from "./b-common.mjs";

export const name = "standards";
export const kinds = ["unit"];

const MATH_DOMAINS = {
  K: ["CC", "OA", "NBT", "MD", "G"],
  1: ["OA", "NBT", "MD", "G"],
  2: ["OA", "NBT", "MD", "G"],
  3: ["OA", "NBT", "NF", "MD", "G"],
  4: ["OA", "NBT", "NF", "MD", "G"],
  5: ["OA", "NBT", "NF", "MD", "G"],
  6: ["RP", "NS", "EE", "G", "SP"],
  7: ["RP", "NS", "EE", "G", "SP"],
  8: ["NS", "EE", "F", "G", "SP"],
};
const ELA_MAX = { RL: 10, RI: 10, RF: 4, W: 10, SL: 6, L: 6 };
const C3_MAX = { Civ: 14, Eco: 15, Geo: 12, His: 16 };
const SS_BAND = {
  K: "K-2",
  1: "K-2",
  2: "K-2",
  3: "3-5",
  4: "3-5",
  5: "3-5",
  6: "6-8",
  7: "6-8",
  8: "6-8",
};

/** Shape rules per subject. Returns null when the code is plausible for the grade, otherwise the reason. */
export function shapeProblem(subject, grade, code) {
  const g = String(grade);
  if (subject === "ELA") {
    const m = /^(RL|RI|RF|W|SL|L)\.(K|[1-8])\.(\d{1,2})(?:\.?[a-i])?$/.exec(code);
    if (!m) return "not an ELA code (RL/RI/RF/W/SL/L.grade.number)";
    if (m[2] !== g) return `grade segment ${m[2]} does not match grade ${g}`;
    if (m[1] === "RF" && !["K", "1", "2", "3", "4", "5"].includes(g))
      return "RF standards stop at grade 5";
    if (Number(m[3]) < 1 || Number(m[3]) > ELA_MAX[m[1]]) return `${m[1]} has no number ${m[3]}`;
    return null;
  }
  if (subject === "Math") {
    const m = /^(K|[1-8])\.([A-Z]+)\.([A-E])\.(\d{1,2})(?:\.?[a-i])?$/.exec(code);
    if (!m) return "not a math code (grade.domain.cluster.number)";
    if (m[1] !== g) return `grade segment ${m[1]} does not match grade ${g}`;
    if (!MATH_DOMAINS[g]?.includes(m[2])) return `domain ${m[2]} does not exist at grade ${g}`;
    return null;
  }
  if (subject === "Science") {
    if (["6", "7", "8"].includes(g)) {
      return /^MS-(PS[1-4]|LS[1-4]|ESS[1-3]|ETS1)-\d{1,2}$/.test(code)
        ? null
        : "not a middle school NGSS code (MS-XXn-n)";
    }
    const band = g === "K" || g === "1" || g === "2" ? "K-2" : "3-5";
    if (new RegExp(`^${band}-ETS1-\\d$`).test(code)) return null;
    const m = /^(K|[1-5])-(PS[1-4]|LS[1-4]|ESS[1-3])-\d$/.exec(code);
    if (!m) return "not an elementary NGSS code (grade-XXn-n)";
    return m[1] === g ? null : `grade segment ${m[1]} does not match grade ${g}`;
  }
  if (subject === "Social Studies") {
    const m = /^D2\.(Civ|Eco|Geo|His)\.(\d{1,2})\.(K-2|3-5|6-8)$/.exec(code);
    if (!m) return "not a C3 code (D2.strand.number.band)";
    if (m[3] !== SS_BAND[g]) return `band ${m[3]} does not match grade ${g}`;
    return Number(m[2]) >= 1 && Number(m[2]) <= C3_MAX[m[1]]
      ? null
      : `${m[1]} has no indicator ${m[2]}`;
  }
  return `unknown subject "${subject}"`;
}

/**
 * Reference lookup for Grade 6 Math from the three repo lists. Pure: pass the parsed JSON.
 * Returns { resolve(code) -> { valid, canonical, shortName } }.
 */
export function buildStandardsRefs({ ccss, crosswalk, taxonomy }) {
  const byKey = ccss?.standards ?? {};
  const valid = new Map();
  const shortOfOld = new Map();
  for (const [key, e] of Object.entries(byKey)) {
    valid.set(key, { canonical: key, shortName: e.shortLabel ?? null });
    for (const old of [e.oldId, ...(e.consolidatedFrom ?? [])])
      if (old) shortOfOld.set(old, e.shortLabel ?? null);
  }
  for (const e of crosswalk?.entries ?? []) {
    const newShort = e.newId?.replace(/\.[A-E]\./, ".");
    const shortName = byKey[newShort]?.shortLabel ?? shortOfOld.get(e.oldShortForm) ?? null;
    for (const code of [e.oldId, e.oldShortForm, e.newId])
      valid.set(code, { canonical: e.newId, shortName });
  }
  for (const t of taxonomy?.standards ?? []) {
    for (const code of [t.id, t.oldId])
      if (code && !valid.has(code)) valid.set(code, { canonical: t.id, shortName: null });
  }
  return { resolve: (code) => valid.get(code) ?? null };
}

const hasReference = (unit) => unit.grade === "6" && unit.subject === "Math";

export function verify(subject, ctx) {
  const { unit, lessons } = subject;
  const out = [];
  const core = unit.core_standards ?? [];
  const seen = new Set();
  core.forEach((code, i) => {
    const path = `core_standards[${i}]`;
    if (seen.has(code))
      out.push(finding("standard_duplicate", "warn", path, `${code} is listed twice`, code));
    seen.add(code);
    const problem = shapeProblem(unit.subject, unit.grade, code);
    if (problem)
      out.push(
        finding(
          "standard_invalid_code",
          "error",
          path,
          `${code}: ${problem}`,
          `${unit.id} grade ${unit.grade} ${unit.subject}`,
        ),
      );
    else if (hasReference(unit) && !ctx.standardsRefs.resolve(code)) {
      out.push(
        finding(
          "standard_not_in_reference",
          "error",
          path,
          `${code} is in none of the repo's Grade 6 standards lists`,
          unit.id,
        ),
      );
    }
  });
  if (!hasReference(unit)) {
    out.push(
      finding(
        "standard_no_reference_list",
        "info",
        "core_standards",
        `no reference list for grade ${unit.grade} ${unit.subject}; shape checked only`,
        `${core.length} codes`,
      ),
    );
  }
  const taught = new Set();
  (lessons ?? []).forEach((lesson, l) => {
    const listed = lesson.standards ?? [];
    listed.forEach((code, i) => {
      taught.add(code);
      const problem = shapeProblem(unit.subject, unit.grade, code);
      if (problem)
        out.push(
          finding(
            "lesson_standard_invalid_code",
            "error",
            `lessons[${l}].standards[${i}]`,
            `${code}: ${problem}`,
            lesson.id,
          ),
        );
      else if (!core.includes(code) && listed.some((c) => core.includes(c))) {
        out.push(
          finding(
            "lesson_standard_not_in_unit",
            "info",
            `lessons[${l}].standards[${i}]`,
            `${code} is not a core standard of ${unit.id}`,
            lesson.id,
          ),
        );
      }
    });
    if (!listed.some((c) => core.includes(c))) {
      out.push(
        finding(
          "activity_no_listed_standard",
          "warn",
          `lessons[${l}].standards`,
          `no standard of ${unit.id} is listed: this lesson's activities teach none`,
          `${lesson.id}: [${listed.join(", ")}]`,
        ),
      );
    }
  });
  if ((lessons ?? []).length > 0) {
    for (const code of new Set(core)) {
      if (!taught.has(code))
        out.push(
          finding(
            "standard_untouched",
            "warn",
            "core_standards",
            `${code} is not listed by any lesson of ${unit.id}`,
            code,
          ),
        );
    }
  }
  return out;
}

const refs = buildStandardsRefs({
  ccss: { standards: { "6.AT.1": { shortLabel: "Ratio Concept", oldId: "6.RP.1" } } },
  crosswalk: { entries: [{ oldId: "6.RP.A.1", oldShortForm: "6.RP.1", newId: "6.AT.A.1" }] },
  taxonomy: { standards: [] },
});
const unit6 = { id: "g6-math-u2", grade: "6", subject: "Math" };
/** Reference data for the fixtures (and tests) so the control does not depend on the repo's lists. */
export const fixtureRefs = refs;
export const fixtures = {
  bad: {
    subject: {
      kind: "unit",
      id: "fixture-bad",
      unit: { ...unit6, core_standards: ["6.RP.A.1", "6.RP.A.9", "RL.5.1"] },
      lessons: [{ id: "fixture-bad-l01", standards: [] }],
    },
    mustFlag: [
      "standard_invalid_code",
      "standard_not_in_reference",
      "activity_no_listed_standard",
      "standard_untouched",
    ],
  },
  good: {
    subject: {
      kind: "unit",
      id: "fixture-good",
      unit: { ...unit6, core_standards: ["6.RP.A.1"] },
      lessons: [{ id: "fixture-good-l01", standards: ["6.RP.A.1"] }],
    },
  },
};

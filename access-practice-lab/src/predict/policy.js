// Versioned registry of exit and target criteria. A threshold is never applied outside the jurisdiction,
// assessment and school years it was recorded for, and every entry says where it came from and when a
// person last checked it. An entry here is a statement about the policy, not a decision about a student.

export const POLICY_VERSION = "2026-11-05.1";

export const POLICIES = Object.freeze([
  {
    id: "md-access-regular-exit",
    jurisdiction: "Maryland",
    assessment: "ACCESS for ELLs (grades K-12, regular)",
    effectiveFrom: "2018-19",
    effectiveFromNote:
      "MSDE's 2018 ESSA stakeholder presentation records the move from an overall 5.0 to 4.5; the exact first school year should be confirmed with MSDE.",
    measure: "overall composite proficiency level (as reported by the score report)",
    operator: ">=",
    threshold: 4.5,
    source:
      "https://marylandpublicschools.org/programs/Pages/Multilingual-Learners/English-Language-Proficiency-Assessment.aspx",
    verifiedOn: "2026-11-05",
    verifiedBy: "web search summary of the MSDE page; the page itself has not been read in full",
    exceptions: [
      "Alternate ACCESS for MLLs (grades 1-12) uses an overall composite level of P2, not 4.5. This entry does not apply to it.",
    ],
    calculation:
      "Use the overall composite level printed on the official score report. The lab never builds a composite by averaging domain levels.",
    openQuestions: [
      "WIDA's 2026 standard setting may change cut scores for the 2026-27 administration; confirm the level the new report uses.",
      "Sources disagree on the length of post-exit monitoring (two or four years). Confirm with MSDE before quoting a monitoring period.",
      "District practice may add steps (teacher input, a second measure). This registry holds the state assessment criterion only.",
    ],
  },
]);

/** The entry that applies, or null when nothing is recorded for that jurisdiction, assessment and year. */
export function policyFor({ jurisdiction, assessment = "regular", year } = {}) {
  const row = POLICIES.find(
    (p) =>
      p.jurisdiction === jurisdiction &&
      (assessment === "regular" ? p.id.endsWith("regular-exit") : false) &&
      (!year || year >= p.effectiveFrom),
  );
  return row || null;
}

/** True when a reported overall level meets a recorded criterion. Pure comparison; no rounding of the level. */
export const meetsCriterion = (policy, overallLevel) =>
  overallLevel != null && overallLevel >= policy.threshold;

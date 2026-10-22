// Rules shared by the studio-content and assessment-quality validators.
// Claims the lab must never make: it does not measure WIDA proficiency.
export const SCORE_CLAIM =
  /\b(?:you (?:are|score[d]?|reached|placed)\b[^.]{0,30}\blevel\s*[1-6]|predicted (?:score|level)|your (?:access|wida) (?:score|level)|(?:wida|proficiency) level\s*[1-6]|(?:entering|emerging|developing|expanding|bridging|reaching)\s+(?:level|proficiency))\b/i;

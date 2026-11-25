// G2 Support Scaffold (pure ESM, unit/curriculum metadata ONLY).
// Operates strictly on unit metadata (unitId, grade, subject, klu, targetWords, band).
// Rejects any student-identifying or student-work keys per D8 lock.
// Note: G3 (automated student-work evaluation) intentionally remains unbuilt per D8 lock.

const VALID_BANDS = new Set(["1_2", "3_4", "5_6"]);

export const FORBIDDEN_STUDENT_KEYS = Object.freeze([
  "student",
  "alias",
  "studentWork",
  "recording",
  "student_id",
  "studentName",
  "student_name",
  "studentResponse",
  "studentWriting",
  "audio",
  "iep",
  "sped",
]);

const FORBIDDEN_LOWER = new Set(FORBIDDEN_STUDENT_KEYS.map((k) => k.toLowerCase()));

function assertNoStudentData(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("buildSupportScaffold requires a plain unit metadata object.");
  }
  for (const key of Object.keys(input)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_LOWER.has(lower) || lower.includes("student")) {
      throw new Error(
        `Refused: G2 support scaffold operates strictly on unit metadata and rejects key "${key}" (D8 lock).`,
      );
    }
  }
}

function buildSentenceStarters(band, klu, targetWords) {
  const focus = String(klu || "Explain").trim() || "Explain";
  const primary = targetWords[0] || "key idea";
  const secondary = targetWords[1] || "detail";

  if (band === "1_2") {
    return [
      `This shows ${primary} because ___.`,
      `I notice ___ with ${secondary}.`,
      `First ___, then ___.`,
    ];
  }
  if (band === "5_6") {
    return [
      `To ${focus.toLowerCase()} the connection between ${primary} and ${secondary}, ___.`,
      `Evidence from the unit indicates that ___, which clarifies ___.`,
      `Although ___, the relationship with ${primary} demonstrates ___.`,
    ];
  }
  return [
    `To ${focus.toLowerCase()} ${primary}, I can point to ___.`,
    `${primary} connects to ${secondary} because ___.`,
    `One example from the unit is ___.`,
  ];
}

function buildVisualCue(klu, subject, grade) {
  const focus = String(klu || "Explain").trim() || "Explain";
  const subj = String(subject || "Core").trim() || "Core";
  const gr = String(grade ?? "").trim();
  const gradeLabel = gr ? `Grade ${gr} ` : "";
  return `${gradeLabel}${subj} (${focus}): Post a two-column anchor chart pairing unit vocabulary on the left with a quick sketch or diagram on the right.`;
}

function buildPartnerCheck(band, klu) {
  const focus = String(klu || "Explain").trim() || "Explain";
  if (band === "1_2") {
    return `Partner A points to a key word and finishes one starter; Partner B repeats the idea and adds one example (${focus}).`;
  }
  if (band === "5_6") {
    return `Partner A explains using two unit terms; Partner B asks one clarifying question and checks that the evidence fits ${focus}.`;
  }
  return `Partner A shares a complete sentence using a unit term; Partner B paraphrases and asks "Why?" to deepen ${focus}.`;
}

/**
 * Build deterministic instructional support scaffolds from unit/curriculum metadata only.
 * @param {{ unitId: string, grade?: string, subject?: string, klu?: string, targetWords?: string[], band?: "1_2" | "3_4" | "5_6" }} input
 */
export function buildSupportScaffold(input = {}) {
  assertNoStudentData(input);

  const {
    unitId,
    grade = "",
    subject = "",
    klu = "Explain",
    targetWords = [],
    band = "3_4",
  } = input;

  const cleanUnitId = typeof unitId === "string" ? unitId.trim() : "";
  if (!cleanUnitId) {
    throw new Error("buildSupportScaffold requires a non-empty unitId.");
  }
  if (!VALID_BANDS.has(band)) {
    throw new Error(`Invalid band "${band}": expected one of 1_2, 3_4, 5_6.`);
  }

  const cleanWords = Array.isArray(targetWords)
    ? targetWords
        .filter((w) => typeof w === "string" && w.trim())
        .map((w) => w.trim())
        .slice(0, 8)
    : [];

  return {
    unitId: cleanUnitId,
    band,
    klu: String(klu || "Explain").trim() || "Explain",
    scaffolds: {
      sentenceStarters: buildSentenceStarters(band, klu, cleanWords),
      visualCue: buildVisualCue(klu, subject, grade),
      partnerCheck: buildPartnerCheck(band, klu),
    },
    provenance: {
      status: "draft",
      source: "support-scaffold-v1",
    },
  };
}

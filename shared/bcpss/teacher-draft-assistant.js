// G1 Teacher-Side Drafting Assistant Scaffolding (pure local deterministic ESM).
// Enforces D8 lock: accepts ONLY a teacher's own instructional text — rejects student PII,
// special-education identifiers, contact info, and student-writing paste markers.
// Respects the `model_teacher_assistant` flag in shared/flags/registry.js (default OFF).
import registry from "../flags/registry.js";

export const TEACHER_DRAFT_FLAG_KEY = "model_teacher_assistant";
export const TEACHER_DRAFT_NOTICE = "Draft — teacher review required before classroom use.";

const VALID_BANDS = new Set(["1_2", "3_4", "5_6"]);

const DISALLOWED_INPUT_RULES = Object.freeze([
  {
    code: "student_name_label",
    label: "student name label",
    re: /\bstudent\s+name\b/i,
  },
  {
    code: "sped_iep_504",
    label: "IEP / 504 / SPED identifier",
    re: /\b(?:IEP|504|SPED)\b/i,
  },
  {
    code: "dob_ssn_id",
    label: "DOB / SSN / student_id identifier",
    re: /\b(?:DOB|SSN|student_id|student\s*#\s*\d+)\b/i,
  },
  {
    code: "email_address",
    label: "email address",
    re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  },
  {
    code: "phone_number",
    label: "phone number",
    re: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/,
  },
  {
    code: "student_writing_paste",
    label: "student-writing paste marker (D8 lock)",
    re: /\b(?:my\s+student\s+wrote|student\s+wrote|student\s+response\s*:|student\s+work\s*:|student\s+writing\s*:|student\s+essay\s*:|student\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+wrote)\b/i,
  },
]);

const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "before",
  "between",
  "could",
  "each",
  "explain",
  "from",
  "have",
  "into",
  "lesson",
  "more",
  "most",
  "other",
  "prompt",
  "should",
  "show",
  "some",
  "students",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "using",
  "what",
  "when",
  "where",
  "which",
  "while",
  "will",
  "with",
  "would",
  "write",
  "your",
]);

/**
 * Look up whether `model_teacher_assistant` is enabled in the committed flag registry.
 * Remains `false` by default per D8 governance.
 */
export function isTeacherAssistantFlagEnabled(overrides = {}) {
  if (typeof overrides?.[TEACHER_DRAFT_FLAG_KEY] === "boolean") {
    return overrides[TEACHER_DRAFT_FLAG_KEY];
  }
  const entry = registry.flags.find((f) => f.key === TEACHER_DRAFT_FLAG_KEY);
  return Boolean(entry?.default);
}

/**
 * Validate that teacher input contains only teacher-authored instructional text
 * and zero student PII or student writing (D8 lock).
 * @param {string} text
 * @returns {{ ok: true } | { ok: false, code: string, reason: string }}
 */
export function validateTeacherInput(text) {
  if (typeof text !== "string" || !text.trim()) {
    return {
      ok: false,
      code: "empty_input",
      reason: "Enter your own lesson prompt text before generating a draft.",
    };
  }
  for (const rule of DISALLOWED_INPUT_RULES) {
    if (rule.re.test(text)) {
      return {
        ok: false,
        code: rule.code,
        reason: `Rejected (${rule.label}): paste your own lesson prompt only — never paste student writing, names, or PII.`,
      };
    }
  }
  return { ok: true };
}

function extractWordBankHints(teacherText) {
  const tokens = teacherText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  const unique = [];
  for (const word of tokens) {
    if (!unique.includes(word)) unique.push(word);
    if (unique.length >= 6) break;
  }
  return unique.length > 0 ? unique : ["evidence", "detail", "reason"];
}

function framesForBand(band, klu, word) {
  const focus = String(klu || "Explain").trim() || "Explain";
  if (band === "1_2") {
    return [`I see ___ using ${word}.`, `First, ___. Next, ___.`, `This shows ___ because ___.`];
  }
  if (band === "5_6") {
    return [
      `To ${focus.toLowerCase()} how ${word} works, consider ___.`,
      `Although ___, the evidence demonstrates that ___.`,
      `Consequently, ___ connects directly to ___.`,
    ];
  }
  return [
    `To ${focus.toLowerCase()} this idea, ${word} helps show that ___.`,
    `One key detail is ___, which means ___.`,
    `Because ___, we can conclude that ___.`,
  ];
}

/**
 * Deterministic local teacher-side drafting scaffold.
 * Never calls any external model or network endpoint.
 */
export function buildTeacherDraft({
  teacherText,
  grade = "6",
  subject = "ELA",
  klu = "Explain",
  band = "3_4",
} = {}) {
  const check = validateTeacherInput(teacherText);
  if (!check.ok) {
    throw new Error(check.reason);
  }
  if (!VALID_BANDS.has(band)) {
    throw new Error(`Invalid band "${band}": expected one of 1_2, 3_4, 5_6.`);
  }

  const cleanGrade = String(grade ?? "6").trim() || "6";
  const cleanSubject = String(subject ?? "ELA").trim() || "ELA";
  const cleanKlu = String(klu ?? "Explain").trim() || "Explain";

  const wordBankHints = extractWordBankHints(teacherText);
  const draftFrames = framesForBand(band, cleanKlu, wordBankHints[0]);
  const checkQuestion = `Grade ${cleanGrade} ${cleanSubject} (${cleanKlu}): Which detail from your lesson prompt best supports a student's explanation using "${wordBankHints[0]}"?`;

  return {
    draftFrames,
    wordBankHints,
    checkQuestion,
    provenance: {
      status: "draft",
      source: "teacher-draft-assistant",
      notice: TEACHER_DRAFT_NOTICE,
    },
    flagKey: TEACHER_DRAFT_FLAG_KEY,
  };
}

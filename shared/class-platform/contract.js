/* =============================================================================
 * Class platform contract — shared by the server (functions/api/class) and the
 * browser clients (Fluency Lab, The Language Page).
 * -----------------------------------------------------------------------------
 * One class, one join code. A teacher creates a class; students join with the
 * code (or a QR of the join link) and an ALIAS — never a real name is required,
 * and the alias rules below refuse anything that looks like a full name or
 * contact detail. Progress documents sync last-write-wins by the client's own
 * `updatedAt`, with hard size caps, and a small validated `summary` per document
 * feeds the teacher dashboard, the class goal meter and the family digest.
 *
 * Pure and dependency-free: no DOM, no fetch, no clock (callers pass `now`).
 * ========================================================================== */

export const APPS = Object.freeze(["fluency", "language"]);
export const DOCS = Object.freeze(["fluency", "language"]);

export const LIMITS = Object.freeze({
  /** A class unused this long is deleted whole (students, documents, rooms, audio). */
  retentionDays: 120,
  /** A live room lives one school day at most. */
  roomTtlHours: 6,
  /** Shared recordings and teacher voice notes are kept this long. */
  audioRetentionDays: 30,
  maxStudents: 60,
  maxDocBytes: 256 * 1024,
  maxSummaryBytes: 4 * 1024,
  maxTitle: 40,
  maxAlias: 20,
  /** A client clock may run ahead of the server by this much before a write is refused. */
  clockSkewMs: 5 * 60 * 1000,
  maxAssignments: 30,
  maxResponse: 120,
  maxWorkspaceBytes: 16 * 1024,
  maxAudioBytes: 700 * 1024,
});

// Codes use the save-code alphabet (no 0/O/1/I/L) so they survive a whiteboard.
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CLASS_CODE_LENGTH = 6;
export const SECRET_LENGTH = 8;

export function codeFromBytes(bytes, length = bytes.length) {
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

export function normalizeCode(raw) {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, "")
    .slice(0, 12);
}

const codeRe = new RegExp(`^[${CODE_ALPHABET}]{${CLASS_CODE_LENGTH}}$`);
const secretRe = new RegExp(`^[${CODE_ALPHABET}]{${SECRET_LENGTH}}$`);
export const isClassCode = (code) => typeof code === "string" && codeRe.test(code);
export const isSecret = (value) => typeof value === "string" && secretRe.test(value);
export const isStudentId = (id) => typeof id === "string" && /^s[a-f0-9]{10}$/.test(id);
export const isRoomId = (id) => typeof id === "string" && /^r[a-f0-9]{10}$/.test(id);

const CONTROL = /[\u0000-\u001f\u007f]/g;
export const cleanText = (raw, max) =>
  String(raw ?? "")
    .replace(CONTROL, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/**
 * An alias is a nickname: letters, digits, spaces, - and ', 2-20 characters, at
 * most two words. Emails, phone-like digit runs and three-word names are refused
 * with a reason the join screen can show.
 * @returns {{ ok: true, alias: string } | { ok: false, error: string }}
 */
export function validateAlias(raw) {
  const alias = cleanText(raw, LIMITS.maxAlias + 1);
  if (alias.length < 2) return { ok: false, error: "alias-too-short" };
  if (alias.length > LIMITS.maxAlias) return { ok: false, error: "alias-too-long" };
  if (/[@]|https?:|www\./i.test(alias)) return { ok: false, error: "alias-contact" };
  if (/\d{4,}/.test(alias)) return { ok: false, error: "alias-contact" };
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '-]*$/u.test(alias))
    return { ok: false, error: "alias-characters" };
  if (alias.split(" ").length > 2) return { ok: false, error: "alias-too-many-words" };
  return { ok: true, alias };
}

const SKILL_RE = /^[a-z0-9][a-z0-9:_-]{0,39}$/;
const intIn = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

/**
 * Summary fields per document. Every field is optional; anything not declared is
 * dropped, and a declared field with the wrong shape is a 400 (so a client bug is
 * loud, not silently half-saved).
 */
export const SUMMARY_FIELDS = Object.freeze({
  fluency: {
    grade: (v) => intIn(v, 0, 8),
    activeSkill: (v) => typeof v === "string" && SKILL_RE.test(v),
    // intervention-engine.js "needs-teacher" hand-offs: skill + the named reason id.
    needsTeacher: (v) =>
      Array.isArray(v) &&
      v.length <= 10 &&
      v.every(
        (e) =>
          e &&
          typeof e.skill === "string" &&
          SKILL_RE.test(e.skill) &&
          (e.why === undefined || (typeof e.why === "string" && SKILL_RE.test(e.why))),
      ),
    mastered: (v) =>
      Array.isArray(v) &&
      v.length <= 200 &&
      v.every((s) => typeof s === "string" && SKILL_RE.test(s)),
    practiced: (v) => intIn(v, 0, 200),
    independentCorrect: (v) => intIn(v, 0, 1_000_000),
    weekIndependent: (v) => intIn(v, 0, 100_000),
    weekDays: (v) => intIn(v, 0, 7),
    lastActivity: (v) => intIn(v, 0, 9_999_999_999_999),
  },
  language: {
    domains: (v) =>
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.keys(v).every((k) => ["listening", "speaking", "reading", "writing"].includes(k)) &&
      Object.values(v).every((n) => intIn(n, 0, 1_000_000)),
    assignmentsDone: (v) =>
      Array.isArray(v) &&
      v.length <= 60 &&
      v.every((s) => typeof s === "string" && SKILL_RE.test(s)),
    weekEvidence: (v) => intIn(v, 0, 100_000),
    weekDays: (v) => intIn(v, 0, 7),
    lastActivity: (v) => intIn(v, 0, 9_999_999_999_999),
  },
});

/** @returns {{ ok: true, summary: object } | { ok: false, error: string }} */
export function validateSummary(doc, raw) {
  const fields = SUMMARY_FIELDS[doc];
  if (!fields) return { ok: false, error: "unknown-doc" };
  if (raw == null) return { ok: true, summary: {} };
  if (typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "summary-shape" };
  const summary = {};
  for (const [key, check] of Object.entries(fields)) {
    if (raw[key] === undefined) continue;
    if (!check(raw[key])) return { ok: false, error: `summary-${key}` };
    summary[key] = raw[key];
  }
  if (JSON.stringify(summary).length > LIMITS.maxSummaryBytes)
    return { ok: false, error: "summary-too-large" };
  return { ok: true, summary };
}

/**
 * A progress upload. `data` is the app's own backup object (Fluency Lab:
 * makeBackup + exportPlay; Language Page: its progress export) and stays opaque
 * to the server beyond its size; the app re-validates it on restore with the
 * same cleaners it uses for a downloaded backup file.
 */
export function validateDocUpload(body, now) {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid-body" };
  if (!DOCS.includes(body.doc)) return { ok: false, error: "unknown-doc" };
  const updatedAt = body.updatedAt;
  if (!Number.isInteger(updatedAt) || updatedAt <= 0)
    return { ok: false, error: "invalid-updatedAt" };
  if (updatedAt > now + LIMITS.clockSkewMs) return { ok: false, error: "updatedAt-in-future" };
  if (!body.data || typeof body.data !== "object") return { ok: false, error: "invalid-data" };
  const data = JSON.stringify(body.data);
  if (data.length > LIMITS.maxDocBytes) return { ok: false, error: "doc-too-large" };
  const summary = validateSummary(body.doc, body.summary);
  if (!summary.ok) return summary;
  return { ok: true, doc: body.doc, updatedAt, data, summary: summary.summary };
}

/** Last-write-wins: an upload replaces the stored copy only when it is newer. */
export const lwwAccepts = (storedUpdatedAt, incomingUpdatedAt) =>
  storedUpdatedAt == null || incomingUpdatedAt > Number(storedUpdatedAt);

/* ── class settings: community goal + assignments ─────────────────────────── */

export const GOAL_METRICS = Object.freeze(["mastered-skills", "independent-correct", "evidence"]);

export function validateSettings(raw, app) {
  if (!raw || typeof raw !== "object") return { ok: false, error: "invalid-settings" };
  const out = {};
  if (raw.goal != null) {
    const g = raw.goal;
    if (!g || !GOAL_METRICS.includes(g.metric) || !intIn(g.target, 1, 100_000))
      return { ok: false, error: "invalid-goal" };
    out.goal = { metric: g.metric, target: g.target, label: cleanText(g.label, 60) };
  }
  if (raw.assignments != null) {
    if (!Array.isArray(raw.assignments) || raw.assignments.length > LIMITS.maxAssignments)
      return { ok: false, error: "invalid-assignments" };
    const seen = new Set();
    out.assignments = [];
    for (const a of raw.assignments) {
      if (!a || typeof a.id !== "string" || !SKILL_RE.test(a.id) || seen.has(a.id))
        return { ok: false, error: "invalid-assignment" };
      seen.add(a.id);
      const due = a.due == null ? null : String(a.due);
      if (due !== null && !/^\d{4}-\d{2}-\d{2}$/.test(due))
        return { ok: false, error: "invalid-due" };
      out.assignments.push({
        id: a.id,
        app,
        title: cleanText(a.title, 80),
        // An app-relative path inside the app's own surface; never an outside URL.
        path:
          typeof a.path === "string" &&
          /^\/[\w\-./?=&%]{0,200}$/.test(a.path) &&
          !a.path.startsWith("//")
            ? a.path
            : "",
        due,
      });
    }
  }
  if (raw.digest != null) out.digest = raw.digest === true;
  return { ok: true, settings: out };
}

/** Pool independent evidence for the community goal meter. */
export function goalProgress(goal, summaries) {
  if (!goal) return null;
  let value = 0;
  for (const s of summaries) {
    if (!s) continue;
    if (goal.metric === "mastered-skills")
      value += Array.isArray(s.mastered) ? s.mastered.length : 0;
    else if (goal.metric === "independent-correct") value += Number(s.weekIndependent) || 0;
    else if (goal.metric === "evidence") value += Number(s.weekEvidence) || 0;
  }
  return {
    ...goal,
    value,
    reached: value >= goal.target,
    percent: Math.min(100, Math.round((value / goal.target) * 100)),
  };
}

/** The join link a QR encodes; `base` is the app's own page URL. */
export function joinUrl(base, code) {
  const url = new URL(base);
  url.searchParams.set("class", code);
  return url.toString();
}

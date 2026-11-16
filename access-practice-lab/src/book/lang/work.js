// Book Studio 2.0 · what a student DID with the supports, kept in the book beside their own writing.
// Student-authored text, AI/rule-assisted text and teacher feedback are always distinguishable. Pure.
import { RECORD_ACTIONS } from "./supports.js";

const rnd = () => Math.random().toString(36).slice(2, 8);
const nid = (p) => `${p}${Date.now().toString(36)}${rnd()}`;
const str = (v, max = 400) => String(v ?? "").slice(0, max);
const idOk = (v) => /^[a-z0-9]{4,40}$/i.test(v || "");

export const CAPS = Object.freeze({ records: 600, revisions: 200, attempts: 200 });
/** Who made a piece of text. "assisted" is never evidence of independent proficiency. */
export const AUTHORS = Object.freeze(["student", "assisted", "teacher"]);

export const emptyWork = () => ({
  organizers: {},
  rehearsals: {},
  records: [],
  revisions: [],
  notes: {},
  words: [],
  attempts: [],
  coach: [],
});

const cleanMap = (m, depthKeys = 16, max = 300) => {
  const out = {};
  for (const [k, v] of Object.entries(m && typeof m === "object" ? m : {}).slice(0, 80)) {
    if (!/^[a-z0-9]{4,40}$/i.test(k)) continue;
    out[k] =
      v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .slice(0, depthKeys)
              .map(([ck, cv]) => [str(ck, 40), str(cv, max)]),
          )
        : str(v, max);
  }
  return out;
};

export function normalizeWork(raw = {}) {
  const w = raw && typeof raw === "object" ? raw : {};
  return {
    organizers: cleanMap(w.organizers),
    rehearsals: Object.fromEntries(
      Object.entries(w.rehearsals && typeof w.rehearsals === "object" ? w.rehearsals : {})
        .slice(0, 80)
        .filter(([k]) => /^[a-z0-9]{4,40}$/i.test(k))
        .map(([k, v]) => [
          k,
          { media: str(v?.media, 60), text: str(v?.text, 600), at: str(v?.at, 40) },
        ]),
    ),
    records: (Array.isArray(w.records) ? w.records : [])
      .filter((r) => RECORD_ACTIONS.includes(r?.action))
      .slice(-CAPS.records)
      .map((r) => ({
        supportId: str(r.supportId, 40),
        action: r.action,
        at: str(r.at, 40),
        attempt: Number.isFinite(Number(r.attempt)) ? Number(r.attempt) : 0,
        target: str(r.target, 40),
      })),
    revisions: (Array.isArray(w.revisions) ? w.revisions : []).slice(-CAPS.revisions).map((r) => ({
      id: idOk(r?.id) ? r.id : nid("rv"),
      elementId: str(r?.elementId, 40),
      pageId: str(r?.pageId, 40),
      before: str(r?.before, 1200),
      after: str(r?.after, 1200),
      by: AUTHORS.includes(r?.by) ? r.by : "student",
      supportIds: (Array.isArray(r?.supportIds) ? r.supportIds : [])
        .slice(0, 6)
        .map((s) => str(s, 40)),
      note: str(r?.note, 300), // the student's own reflection on the change
      at: str(r?.at, 40),
    })),
    notes: cleanMap(w.notes, 1, 600),
    words: (Array.isArray(w.words) ? w.words : [])
      .slice(0, 80)
      .map((x) => ({ w: str(x?.w, 60), def: str(x?.def, 200), sentence: str(x?.sentence, 240) })),
    attempts: (Array.isArray(w.attempts) ? w.attempts : []).slice(-CAPS.attempts).map((a) => ({
      elementId: str(a?.elementId, 40),
      text: str(a?.text, 1200),
      at: str(a?.at, 40),
      supportOpened: a?.supportOpened === true,
      supportUsed: a?.supportUsed === true,
    })),
    coach: (Array.isArray(w.coach) ? w.coach : []).slice(-60).map((c) => ({
      elementId: str(c?.elementId, 40),
      q: str(c?.q, 300),
      stage: ["attempt", "feedback", "revision", "independent"].includes(c?.stage)
        ? c.stage
        : "attempt",
      at: str(c?.at, 40),
    })),
  };
}

/** Append a support-use record (pure: returns a new work object). Hidden/opened are recorded once per attempt window. */
export function record(work, supportId, action, extra = {}) {
  if (!RECORD_ACTIONS.includes(action)) return work;
  const now = new Date().toISOString();
  const last = work.records.at(-1);
  if (
    last &&
    last.supportId === supportId &&
    last.action === action &&
    (action === "opened" || action === "hidden") &&
    Date.parse(now) - Date.parse(last.at) < 1500
  )
    return work;
  return {
    ...work,
    records: [
      ...work.records,
      { supportId, action, at: now, attempt: work.attempts.length, target: extra.target || "" },
    ].slice(-CAPS.records),
  };
}

/** A student-owned revision, never written over the original. */
export function addRevision(
  work,
  { elementId, pageId, before, after, by = "student", supportIds = [], note = "" },
) {
  if (!String(after || "").trim() || before === after) return work;
  return {
    ...work,
    revisions: [
      ...work.revisions,
      {
        id: nid("rv"),
        elementId,
        pageId,
        before: str(before, 1200),
        after: str(after, 1200),
        by,
        supportIds,
        note: str(note, 300),
        at: new Date().toISOString(),
      },
    ].slice(-CAPS.revisions),
  };
}

/**
 * Log a first attempt on a writing task and decide whether it was independent: independent means the learner wrote
 * it with every available support closed and unused. It describes what happened; it does not measure proficiency.
 */
export function logAttempt(work, { elementId, text, supports = [] }) {
  const mine = work.records.filter(
    (r) => r.attempt === work.attempts.length && supports.some((s) => s.id === r.supportId),
  );
  const opened = mine.some((r) => r.action === "opened");
  const used = mine.some((r) => r.action === "used" || r.action === "completed");
  let next = {
    ...work,
    attempts: [
      ...work.attempts,
      {
        elementId,
        text: str(text, 1200),
        at: new Date().toISOString(),
        supportOpened: opened,
        supportUsed: used,
      },
    ].slice(-CAPS.attempts),
  };
  if (!opened && !used)
    for (const s of supports) next = record(next, s.id, "independent", { target: elementId });
  return next;
}

/** Original -> every revision -> final, for the teacher's side-by-side. */
export function revisionTrail(work, elementId) {
  return work.revisions.filter((r) => r.elementId === elementId);
}

/** Plain-language evidence summary a teacher can export. No scores, no levels. */
export function evidenceReport(book, { alias = "", profileNote = "" } = {}) {
  const w = book.work || emptyWork();
  const lines = [
    `Language evidence: ${book.title}`,
    alias ? `Student: ${alias}` : "",
    profileNote,
    "",
  ];
  lines.push(
    `Objectives: ${(book.objectives || []).map((o) => `${o.text}${o.keyUse ? ` (${o.keyUse})` : ""}`).join("; ") || "none set"}`,
  );
  lines.push(
    `First attempts: ${w.attempts.length}. Revisions: ${w.revisions.length} (${w.revisions.filter((r) => r.by === "assisted").length} assisted).`,
  );
  for (const s of book.supports || []) {
    const r = w.records.filter((x) => x.supportId === s.id);
    const c = (a) => r.filter((x) => x.action === a).length;
    lines.push(
      `- ${s.title}${s.required ? " [required]" : ""}: opened ${c("opened")}, used ${c("used")}, completed ${c("completed")}, hidden ${c("hidden")}, independent ${c("independent")}`,
    );
  }
  lines.push(
    "",
    "Student-authored and assisted text are listed separately. This report does not assign a WIDA level or an ACCESS score; word count and tool use are not evidence of language growth.",
  );
  for (const r of w.revisions)
    lines.push(
      "",
      `Revision (${r.by}) on page ${r.pageId ? book.pages.findIndex((p) => p.id === r.pageId) + 1 : "?"}:`,
      `  Before: ${r.before}`,
      `  After:  ${r.after}`,
      r.note ? `  Student reflection: ${r.note}` : "",
    );
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}

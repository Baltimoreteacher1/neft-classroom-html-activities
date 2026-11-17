// The teacher's decision on a shared loop (Language Intelligence Engine). Pure; runs in Node.
//
// A learner shares a loop digest (loop.js loopDigest) to the class review queue. The teacher reads the evidence and
// the feedback that was shown, then accepts the suggestion, replaces it with their own comment, or asks for another
// attempt, and may name a next activity (a lab route). The server's review shape is unchanged: the decision travels
// as a short structured prefix at the start of the existing comment, "[LP replace next=/speak] comment".
// On the learner's device the review/mine reply is read back into the loop's `review` stage, so the teacher's
// decision persists there and WINS over the automated suggestion wherever the loop is shown (effectiveFeedback).
// Old reviews (no prefix) still read as a plain comment.

export const DECISIONS = Object.freeze(["accept", "replace", "again"]);
/** Lab routes a teacher may recommend as the next activity (no base). Kept short: it rides inside the comment. */
export const NEXT_ROUTES = Object.freeze([
  { route: "/speak", label: ["Speaking Studio", "Estudio de expresión oral"] },
  { route: "/write", label: ["Writing Studio", "Estudio de escritura"] },
  { route: "/sentences", label: ["Sentence practice", "Práctica de oraciones"] },
  { route: "/evidence", label: ["Evidence practice", "Práctica con evidencia"] },
  { route: "/conversation", label: ["Conversation practice", "Práctica de conversación"] },
  { route: "/book-studio", label: ["Book Studio", "Estudio de libros"] },
  { route: "/simulations", label: ["Simulations", "Simulaciones"] },
  { route: "/pathways", label: ["Pathways", "Rutas"] },
]);
const ROUTE_RE = /^\/[a-z0-9][a-z0-9\-/]{0,39}$/;
const PREFIX_RE = /^\[LP (accept|replace|again)(?: next=(\/[a-z0-9][a-z0-9\-/]{0,39}))?\]\s*/;

/** The comment string to store: a decision prefix plus the teacher's own words. Unknown decisions add no prefix. */
export function encodeDecision({ decision = "", next = "", comment = "" } = {}) {
  const words = String(comment ?? "").replace(PREFIX_RE, "").trim();
  if (!DECISIONS.includes(decision)) return words;
  const to = ROUTE_RE.test(String(next || "")) ? ` next=${next}` : "";
  return `[LP ${decision}${to}] ${words}`.trim();
}

/** @returns {{decision:""|"accept"|"replace"|"again", next:string, comment:string}} */
export function decodeDecision(stored) {
  const s = String(stored ?? "");
  const m = s.match(PREFIX_RE);
  if (!m) return { decision: "", next: "", comment: s.trim() };
  return { decision: m[1], next: m[2] || "", comment: s.slice(m[0].length).trim() };
}

/** True when a shared writing sample is a loop digest (so the queue can show the decision controls). */
export const isLoopDigest = (text) => /^Task: /.test(String(text || "")) && /\nFIRST RESPONSE/.test(String(text || ""));

/** A loop digest cut back into its labelled parts, for the teacher's queue. Missing parts are "". */
export function parseDigest(text) {
  const parts = String(text || "").split(/\n\n(?=FIRST RESPONSE|FEEDBACK SHOWN:|REVISION \(|NEW TASK )/);
  const out = { task: "", response: "", responseNote: "", feedback: "", revision: "", transfer: "", transferNote: "" };
  for (const p of parts) {
    if (p.startsWith("Task: ")) out.task = p.slice(6).trim();
    else if (p.startsWith("FIRST RESPONSE")) {
      const i = p.indexOf(":\n");
      out.responseNote = p.slice(14, i).trim();
      out.response = p.slice(i + 2).trim();
    } else if (p.startsWith("FEEDBACK SHOWN:")) out.feedback = p.slice(15).trim();
    else if (p.startsWith("REVISION (")) out.revision = p.slice(p.indexOf(":\n") + 2).trim();
    else if (p.startsWith("NEW TASK ")) {
      const m = p.match(/^NEW TASK (\[[^\]]*\]): ?([^\n]*)\n?([\s\S]*)$/);
      out.transferNote = m ? `${m[1]} ${m[2]}`.trim() : "";
      out.transfer = m ? m[3].trim() : p;
    }
  }
  return out;
}

/**
 * Write the teacher's reviews (the review/mine reply) into the loops they answer. A newer review replaces an older
 * one; nothing else in the loop changes. Returns how many loops changed.
 * @param {{loops:Record<string,object>}} state
 * @param {{itemId:string, comment?:string, chips?:object, reviewedAt?:number}[]} reviews
 */
export function applyTeacherReviews(state, reviews) {
  let changed = 0;
  const byWork = new Map((reviews || []).filter((r) => r?.itemId).map((r) => [r.itemId, r]));
  for (const loop of Object.values(state?.loops || {})) {
    const rv = loop.stages?.review;
    const r = rv?.workId && byWork.get(rv.workId);
    if (!r) continue;
    const d = decodeDecision(r.comment);
    const at = new Date(Number(r.reviewedAt) || Date.now()).toISOString();
    const teacher = { comment: d.comment, decision: d.decision || "comment", next: d.next, at };
    const old = rv.teacher;
    if (old && old.at === at && old.comment === teacher.comment && old.decision === teacher.decision) continue;
    rv.teacher = teacher;
    loop.updatedAt = at > String(loop.updatedAt) ? at : loop.updatedAt;
    changed++;
  }
  return changed;
}

/**
 * The next step to show for a loop: the teacher's when they replaced the suggestion, otherwise the automated one,
 * with the teacher's comment and decision alongside when there is one.
 * @returns {{source:"teacher"|"auto", nextStep:[string,string], comment:string, decision:string, next:string, again:boolean}}
 */
export function effectiveFeedback(loop) {
  const fb = loop?.stages?.feedback?.feedback;
  const t = loop?.stages?.review?.teacher || null;
  const auto = fb?.nextStep?.text || ["", ""];
  const replaced = t?.decision === "replace" && t.comment;
  return {
    source: replaced ? "teacher" : "auto",
    nextStep: replaced ? [t.comment, t.comment] : [auto[0] || "", auto[1] || auto[0] || ""],
    comment: t?.comment || "",
    decision: t?.decision || "",
    next: t?.next || "",
    again: t?.decision === "again",
  };
}

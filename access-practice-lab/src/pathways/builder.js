// Connected Learning Engine — the teacher's pathway builder, as pure operations on a draft definition:
//   draft = { objective, title, stages: [{ key, optional }], supports: [id], rejected: [needId], followUp }
// (the same shape pathways.encodeCustom turns into the assignable URL). Reordering is by index, so the view can
// offer plain Up/Down buttons. Resources come from the skill graph first (linked to the objective), then from the
// activity bank, the studio task lists and the sitemap, each labelled when it is not linked to the objective.
// saveToClass adds the ONE assignment through the existing class settings API; nothing else is written anywhere.
import { suggest } from "../support-engine/engine.js";
import { MAX_ASSIGNMENTS, TEACHER_CLASSES_KEY, saveToClass, teacherClasses } from "../../../shared/class-platform/teacher-classes.js";
import { DEST_BY_ID, DESTINATIONS } from "../sitemap.js";
import { DOMAINS, SUPPORTS, isLinked, objectiveById, resolveKey } from "./graph.js";
import { MAX_STAGES, defFromBuiltIn } from "./pathways.js";

export { MAX_ASSIGNMENTS, TEACHER_CLASSES_KEY, saveToClass, teacherClasses };

export const blankDraft = (objectiveId) => ({ objective: objectiveById(objectiveId)?.id || "explain-with-evidence", title: "", stages: [{ key: "t", optional: false }], supports: Object.keys(SUPPORTS), rejected: [], followUp: "" });
export const draftFromBuiltIn = (id, band) => defFromBuiltIn(id, band);

const copy = (d) => ({ ...d, stages: d.stages.map((s) => ({ ...s })), supports: [...d.supports], rejected: [...d.rejected] });

/** Change the objective: stages that are not linked to the new one stay (the teacher chose them) but needs reset. */
export function setObjective(draft, objectiveId) {
  const o = objectiveById(objectiveId);
  return o ? { ...copy(draft), objective: o.id, rejected: [], followUp: "" } : draft;
}
export function addStage(draft, key, data) {
  if (draft.stages.length >= MAX_STAGES || draft.stages.some((s) => s.key === key) || !resolveKey(key, data)) return draft;
  const next = copy(draft);
  // New work goes before the transfer and family stages, which close a pathway.
  const at = next.stages.findIndex((s) => s.key === "t" || s.key === "f");
  next.stages.splice(at < 0 ? next.stages.length : at, 0, { key, optional: false });
  return next;
}
export function moveStage(draft, index, dir) {
  const to = index + dir;
  if (index < 0 || to < 0 || index >= draft.stages.length || to >= draft.stages.length) return draft;
  const next = copy(draft);
  [next.stages[index], next.stages[to]] = [next.stages[to], next.stages[index]];
  return next;
}
export function removeStage(draft, index) {
  if (!draft.stages[index]) return draft;
  const next = copy(draft);
  next.stages.splice(index, 1);
  return next;
}
export function toggleOptional(draft, index) {
  if (!draft.stages[index]) return draft;
  const next = copy(draft);
  next.stages[index].optional = !next.stages[index].optional;
  return next;
}
export function toggleSupport(draft, id) {
  if (!SUPPORTS[id]) return draft;
  const next = copy(draft);
  next.supports = next.supports.includes(id) ? next.supports.filter((s) => s !== id) : Object.keys(SUPPORTS).filter((s) => s === id || next.supports.includes(s));
  return next;
}
const ENGINE_TO_PATHWAY_SUPPORT = {
  "sentence-frames": "frames",
  "sentence-starters": "frames",
  "word-bank": "words",
  "chunked-directions": "plan",
  "graphic-organizer": "plan",
  "bilingual-glossary": "spanish",
};
/** Apply a support-engine level (1–6) onto the pathway's transfer supports for the objective's domain. */
export function applySupportLevel(draft, level, domain = "writing") {
  const res = suggest({ level, domain: String(domain || "writing").toLowerCase() });
  const mapped = new Set();
  for (const s of res.scaffolds) {
    const key = ENGINE_TO_PATHWAY_SUPPORT[s.id];
    if (key && SUPPORTS[key] && s.showByDefault) mapped.add(key);
  }
  const next = copy(draft);
  next.supports = Object.keys(SUPPORTS).filter((id) => mapped.has(id));
  return next;
}
/** Accept (false) or reject (true) one system recommendation rule for this pathway. */
export function setRejected(draft, needId, rejected) {
  const o = objectiveById(draft.objective);
  if (!o?.needs.some((n) => n.id === needId)) return draft;
  const next = copy(draft);
  next.rejected = rejected ? [...new Set([...next.rejected, needId])] : next.rejected.filter((id) => id !== needId);
  return next;
}
export const setFollowUp = (draft, key) => ({ ...copy(draft), followUp: key && isLinked(draft.objective, key) ? key : "" });
export const setTitle = (draft, title) => ({ ...copy(draft), title: String(title || "").slice(0, 80) });

/**
 * Resources a teacher can add, best first: everything linked to the objective, then matches from the activity
 * bank, the studio tasks and the sitemap. Each: { key, title, feature, domain, linked }.
 */
export function searchResources(query, objectiveId, band, data, limit = 24) {
  const objective = objectiveById(objectiveId);
  const q = String(query || "").trim().toLowerCase();
  const seen = new Set();
  const out = [];
  const push = (key, extra = "") => {
    if (seen.has(key)) return;
    const ref = resolveKey(key, data);
    if (!ref || (ref.band && ref.band !== band && ref.kind === "access")) return;
    if (ref.band && ref.band !== band && (ref.kind === "speak" || ref.kind === "write")) return;
    const hay = `${ref.title[0]} ${ref.kind} ${ref.domain || ""} ${extra}`.toLowerCase();
    if (q && !q.split(/\s+/).every((w) => hay.includes(w))) return;
    seen.add(key);
    out.push({ key, title: ref.title, kind: ref.kind, domain: ref.domain || "", linked: isLinked(objective?.id, key) });
  };
  for (const a of objective?.activities || []) push(a.key, "goal linked");
  push("t", "transfer own independent");
  push("f", "family home conversation");
  if (q.length >= 2) {
    for (const domain of DOMAINS)
      for (const lv of Object.values(data.index?.bands?.[band]?.domains?.[domain]?.levels || {}))
        for (const row of lv.activities || []) if (row[2] !== "worksheet") push(`r${row[0]}`, row[3] || "");
    for (const t of data.index?.studio?.speaking || []) push(`s${t.id}`, `${t.keyUse || ""} speaking studio`);
    for (const t of data.index?.studio?.writing || []) push(`w${t.id}`, `${t.keyUse || ""} writing studio`);
    for (const d of DESTINATIONS) if (["practice", "play"].includes(d.section) && DEST_BY_ID[d.id]) push(`d${d.id}`, d.text?.[0] || "");
  }
  return out.sort((a, b) => Number(b.linked) - Number(a.linked)).slice(0, limit);
}

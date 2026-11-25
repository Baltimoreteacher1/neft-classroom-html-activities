// An exit ticket WITH its rubric, read from a unit detail (the object /api/bcpss/units/<id> returns).
// Nothing is invented: a unit with no authored rubric returns null and the Studio says so.
import { LEVELS, ticketIdFor } from "./constants.js";

const text = (v) => (typeof v === "string" ? v.trim() : "");

/** { emerging, developing, proficient } from a quick_rubric object, a rubric object, or a rubric array. */
function rubricFrom(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  if (Array.isArray(raw)) {
    for (const row of raw) {
      const key = LEVELS.find((l) =>
        text(row?.level || row?.tier)
          .toLowerCase()
          .startsWith(l),
      );
      if (key) out[key] = text(row.criteria || row.description);
    }
  } else {
    for (const l of LEVELS) out[l] = text(typeof raw[l] === "string" ? raw[l] : raw[l]?.criteria);
  }
  return LEVELS.every((l) => out[l]) ? out : null;
}

/**
 * @returns {null | { ticketId, unitId, unitTitle, prompt, targetFrame, model, requiredVocab, rubric }}
 */
export function buildTicket(detail, round = 1) {
  const unitId = text(detail?.unit?.id);
  const raw = detail?.connections?.[0]?.language_exit_ticket_json;
  if (!unitId || !raw || typeof raw !== "object") return null;
  const rubric = rubricFrom(raw.quick_rubric) || rubricFrom(raw.rubric);
  const prompt = text(raw.prompt);
  if (!rubric || !prompt) return null;
  return {
    ticketId: ticketIdFor(unitId, round),
    unitId,
    unitTitle: text(detail.unit.unit_title),
    prompt,
    targetFrame: text(raw.target_frame),
    model: text(raw.model),
    requiredVocab: Array.isArray(raw.required_vocab) ? raw.required_vocab.map(String) : [],
    rubric,
  };
}

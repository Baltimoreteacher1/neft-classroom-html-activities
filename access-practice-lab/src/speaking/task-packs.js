export const TASK_PACK_SCHEMA = "lp-speak-pack/1";
export const SPEAKING_BANDS = Object.freeze(["3-5", "6-8"]);
export const SPEAKING_STAGES = Object.freeze(["A", "B", "C"]);
export const KEY_LANGUAGE_USES = Object.freeze(["Narrate", "Inform", "Explain", "Argue"]);
export const RESPONSE_TYPES = Object.freeze(["audio", "video", "text", "choice", "screen", "conversation"]);

export const DEFAULT_TASK_SETTINGS = Object.freeze({
  startsAt: null,
  dueAt: null,
  late: "accept-flag",
  order: "fixed",
  sequential: false,
  release: "manual",
  review: "after-feedback",
  rehearsal: false,
});

const isObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const nonempty = (x) => typeof x === "string" && x.trim().length > 0;

export function validateTaskPack(pack) {
  const errors = [];
  if (!isObject(pack)) return { ok: false, errors: ["Pack must be an object."] };
  if (pack.schema !== TASK_PACK_SCHEMA) errors.push(`schema must be ${TASK_PACK_SCHEMA}.`);
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(pack.id || "")) errors.push("id must be a lowercase slug.");
  if (!isObject(pack.title) || !nonempty(pack.title.en) || !nonempty(pack.title.es)) errors.push("title requires English and Spanish text.");
  if (!SPEAKING_BANDS.includes(pack.band)) errors.push("band must be 3-5 or 6-8.");
  if (!SPEAKING_STAGES.includes(pack.stage)) errors.push("stage must be A, B or C.");
  if (!KEY_LANGUAGE_USES.includes(pack.klu)) errors.push("klu must be a Key Language Use.");
  const settings = { ...DEFAULT_TASK_SETTINGS, ...(isObject(pack.settings) ? pack.settings : {}) };
  if (!isObject(pack.settings)) errors.push("settings must be an object.");
  if (!["accept-flag", "refuse"].includes(settings.late)) errors.push("late must be accept-flag or refuse.");
  if (!["fixed", "random"].includes(settings.order)) errors.push("order must be fixed or random.");
  if (typeof settings.sequential !== "boolean") errors.push("sequential must be boolean.");
  if (!["manual", "auto"].includes(settings.release)) errors.push("release must be manual or auto.");
  if (!["after-feedback", "before-feedback"].includes(settings.review)) errors.push("review must be after-feedback or before-feedback.");
  if (typeof settings.rehearsal !== "boolean") errors.push("rehearsal must be boolean.");
  if (settings.startsAt != null && !Number.isFinite(Date.parse(settings.startsAt))) errors.push("startsAt must be an ISO date or null.");
  if (settings.dueAt != null && !Number.isFinite(Date.parse(settings.dueAt))) errors.push("dueAt must be an ISO date or null.");
  if (settings.startsAt && settings.dueAt && Date.parse(settings.dueAt) < Date.parse(settings.startsAt)) errors.push("dueAt must not precede startsAt.");
  if (!Array.isArray(pack.questions) || !pack.questions.length) errors.push("questions must contain at least one question.");
  const ids = new Set();
  for (const [i, q] of (Array.isArray(pack.questions) ? pack.questions : []).entries()) {
    const at = `questions[${i}]`;
    if (!isObject(q)) { errors.push(`${at} must be an object.`); continue; }
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(q.id || "")) errors.push(`${at}.id must be a lowercase slug.`);
    else if (ids.has(q.id)) errors.push(`${at}.id must be unique.`);
    ids.add(q.id);
    if (!isObject(q.prompt) || !isObject(q.prompt.text) || !nonempty(q.prompt.text.en) || !nonempty(q.prompt.text.es)) errors.push(`${at}.prompt.text requires English and Spanish text.`);
    if (!RESPONSE_TYPES.includes(q.response)) errors.push(`${at}.response is not supported.`);
    if (!isObject(q.limits)) { errors.push(`${at}.limits must be an object.`); continue; }
    const l = q.limits;
    if (l.reviewSec != null && (!Number.isInteger(l.reviewSec) || l.reviewSec < 1)) errors.push(`${at}.limits.reviewSec must be null or at least 1; zero is invalid.`);
    if (l.respondSec != null && (!Number.isInteger(l.respondSec) || l.respondSec < 1)) errors.push(`${at}.limits.respondSec must be null or at least 1.`);
    if (l.minRespondSec != null && (!Number.isInteger(l.minRespondSec) || l.minRespondSec < 1)) errors.push(`${at}.limits.minRespondSec must be null or at least 1.`);
    if (l.respondSec != null && l.minRespondSec != null && l.respondSec < l.minRespondSec) errors.push(`${at}.limits.respondSec must be at least minRespondSec.`);
    if (l.minRespondSec != null && (!(["audio", "video"].includes(q.response) && l.respondSec != null))) errors.push(`${at}.limits.minRespondSec requires audio/video and a response limit.`);
    if (![1, 2, 3].includes(l.attempts)) errors.push(`${at}.limits.attempts must be 1, 2 or 3.`);
    for (const key of ["showPromptAfterReview", "replayMedia", "slowPlayback"])
      if (typeof l[key] !== "boolean") errors.push(`${at}.limits.${key} must be boolean.`);
    if (q.turns != null && (!Array.isArray(q.turns) || q.turns.some((t) => !isObject(t) || !isObject(t.say) || !nonempty(t.say.en) || !nonempty(t.say.es)))) errors.push(`${at}.turns must contain bilingual prompts.`);
  }
  return { ok: errors.length === 0, errors, value: errors.length ? null : { ...pack, settings } };
}

/** Default limit object for a newly added task question. Timers are never implied. */
export const newQuestionLimits = () => ({ reviewSec: null, showPromptAfterReview: true, replayMedia: true, respondSec: null, minRespondSec: null, attempts: 1, slowPlayback: true });

/** One-second ticks never run unless the teacher enables rehearsal and the item has a configured limit. */
export function rehearsalPlan(question, settings) {
  if (!settings?.rehearsal) return { enabled: false, phases: [] };
  const l = question?.limits || {};
  const phases = [];
  if (l.reviewSec != null) phases.push({ id: "review", seconds: l.reviewSec });
  if (l.respondSec != null) phases.push({ id: "respond", seconds: l.respondSec, minimum: l.minRespondSec || 0, countdown: [3, 2, 1] });
  return { enabled: phases.length > 0, phases };
}

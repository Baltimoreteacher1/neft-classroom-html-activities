// Access Prep skill builders: pure rules shared by Listen & Take Notes, Data Talk and Rater's Eye.
// No DOM here, so every check is unit-tested (tools/access-prep-skills.test.mjs). Progress lives on this device
// only, one small record per set: `accessPracticeLab:v1:prep:<slug>:<setId>`.
import { PREFIX } from "../store.js";
import { safeJson, storage } from "../util.js";

export const PREP_BANDS = ["3-5", "6-8"];
/** The grade band whose sets a learner sees: grades 3-5 content for 3-5, everything older gets 6-8. */
export const prepBand = (band) => (["K", "1", "2-3", "3-5"].includes(band) ? "3-5" : "6-8");

const key = (slug, id) => `${PREFIX}:prep:${slug}:${id}`;
export const loadState = (slug, id) =>
  safeJson(storage.get(key(slug, id)), null) || { step: 0, answers: {}, checked: {}, done: false };
export function saveState(slug, id, state) {
  storage.set(key(slug, id), JSON.stringify({ ...state, at: new Date().toISOString() }));
}
export const resetState = (slug, id) => storage.remove(key(slug, id));
export const isDone = (slug, id) => Boolean(loadState(slug, id).done);

/** A multiple-choice answer: right or not, plus the authored reason. */
export function checkChoice(question, picked) {
  if (!picked) return null;
  return { ok: picked === question.answer, why: question.why || "" };
}

/** Notes frame: the main-idea slot must hold the main card; the three detail slots must hold the three details in any order. */
export function checkNotes(set, picks = {}) {
  const details = [picks.d0, picks.d1, picks.d2];
  const want = new Set(set.notes.details);
  const seen = new Set();
  const slots = {
    main: picks.main === set.notes.main,
    d0: false,
    d1: false,
    d2: false,
  };
  details.forEach((id, i) => {
    if (id && want.has(id) && !seen.has(id)) {
      slots[`d${i}`] = true;
      seen.add(id);
    }
  });
  const right = Object.values(slots).filter(Boolean).length;
  return { ok: right === 4, right, total: 4, slots };
}

/** What kind of note a wrong card is, so feedback teaches the note-taking move instead of only saying "no". */
export function cardRole(set, id) {
  if (id === set.notes.main) return "main";
  if (set.notes.details.includes(id)) return "detail";
  return "extra";
}

/** Dropdown sentence: every blank must hold its answer. */
export function checkBuild(parts, picks = {}) {
  const blanks = parts.map((p, i) => [p, i]).filter(([p]) => typeof p === "object");
  const slots = Object.fromEntries(blanks.map(([p, i]) => [i, picks[i] === p.answer]));
  const right = Object.values(slots).filter(Boolean).length;
  return { ok: right === blanks.length, right, total: blanks.length, slots };
}
export const buildText = (parts) =>
  parts.map((p) => (typeof p === "string" ? p : p.answer)).join("");

// "3,000" is one number: drop thousands commas before splitting, so a learner who writes it the standard way passes.
const words = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .match(/[a-z0-9']+/g) || [];

/**
 * The learner's own data sentence. Three plain checks a teacher would make: it uses a number from the chart, a
 * compare or trend word, and the unit (or a label from the chart). It does not judge truth: the model sentence and
 * the earlier steps carry that.
 */
export function dataChecklist(set, text) {
  const tokens = words(text);
  const has = (w) => tokens.includes(String(w).toLowerCase());
  const numbers = new Set(set.chart.data.map((d) => String(d.value)));
  const labels = set.chart.data.flatMap((d) => words(d.label));
  const unitWords = words(set.chart.unit);
  return {
    number: tokens.some((t) => numbers.has(t)),
    compare: set.write.compareWords.some((w) =>
      w.includes(" ") ? String(text).toLowerCase().includes(w) : has(w),
    ),
    unit: unitWords.some(has) || labels.some(has),
    sentence: tokens.length >= 5,
  };
}

/** Ranking: exact order earns full credit; picking the right strongest response is named separately. */
export function checkRanking(set, order = []) {
  const complete = order.length === 3 && new Set(order).size === 3 && order.every(Boolean);
  if (!complete) return { ok: false, complete: false, strongest: false };
  return {
    ok: order.every((id, i) => id === set.ranking[i]),
    complete: true,
    strongest: order[0] === set.ranking[0],
  };
}

/** Features: the learner checks the reasons that make the strongest response stronger. */
export function checkFeatures(set, picked = []) {
  const chosen = new Set(picked);
  const missed = set.features.filter((f) => f.right && !chosen.has(f.id));
  const wrong = set.features.filter((f) => !f.right && chosen.has(f.id));
  return { ok: !missed.length && !wrong.length, missed, wrong };
}

export const DIMENSIONS = {
  discourse: [
    "The whole answer",
    "La respuesta completa",
    "Ideas developed, organized and connected from sentence to sentence.",
    "Ideas desarrolladas, organizadas y conectadas de una oración a otra.",
  ],
  sentence: [
    "Sentences",
    "Oraciones",
    "Sentences joined with words like because, although and when.",
    "Oraciones unidas con palabras como because, although y when.",
  ],
  word: [
    "Words",
    "Palabras",
    "Precise, specific words instead of general ones.",
    "Palabras precisas y específicas en lugar de palabras generales.",
  ],
};

/** Keeps a set usable: the engine renders only sets that pass, and the content test pins every shipped set. */
export function validSet(slug, s) {
  if (!s?.id || !s.title) return false;
  if (slug === "notes")
    return (
      s.cards?.length >= 5 &&
      [s.notes?.main, ...(s.notes?.details || [])].every((id) =>
        s.cards.some((c) => c.id === id),
      ) &&
      s.talk?.length > 0 &&
      s.questions?.every((q) => q.options.some((o) => o.id === q.answer))
    );
  if (slug === "data-talk")
    return (
      ["bar", "line"].includes(s.chart?.kind) &&
      s.chart.data?.length >= 2 &&
      s.questions?.every((q) => q.options.some((o) => o.id === q.answer)) &&
      s.build?.parts?.some((p) => typeof p === "object")
    );
  if (slug === "raters-eye")
    return (
      s.responses?.length === 3 &&
      s.ranking?.length === 3 &&
      s.features?.some((f) => f.right) &&
      s.upgrade?.parts?.some((p) => typeof p === "object")
    );
  return false;
}

/** A stable shuffle keyed by the set id: the same learner always sees the same order, and it is never the authored one. */
export function seededOrder(list, seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((x, i) => x === list[i])) out.push(out.shift());
  return out;
}

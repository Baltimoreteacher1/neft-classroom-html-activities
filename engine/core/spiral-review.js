// spiral-review.js — which earlier lessons the warm-up's spiral review asks
// about, and which of their questions.
//
// The authored warm-up reviews YESTERDAY's lesson, on all 84 lessons. That is
// retrieval at a one-day spacing and nothing longer, so a skill taught in
// September is not asked again until a unit test. The spiral review appends
// two questions to the warm-up (as its bonus, outside the score):
//
//   1. RECENT — a lesson taught 2–4 weeks before today's, and
//   2. EARLIER UNIT — a lesson from a unit taught before today's unit,
//      preferring one older than that window, so the two reach different
//      distances instead of asking the same week twice.
//
// "Before" and "weeks" are DISTRICT TEACHING ORDER and paced dates — the
// sequence in data/retrieval-bank.json, built from the pacing files by
// scripts/generate-retrieval-bank.mjs — never lesson numbers: the district
// teaches 6-1 in August and 5-1 in March.
//
// Questions are lifted verbatim from the source lesson's OWN already-verified
// multiple-choice items (its exit ticket and its Connect checks; validate:math
// gates both), fetched lazily from /lessons/<id>/config.json. Its warm-up is
// deliberately not used: a lesson's warm-up reviews the lesson BEFORE it, so
// it is a different lesson's mathematics.
//
// When this device has history — the source lesson's saved attempts, or a
// spiral question this student missed before — a lesson and an item the
// student got wrong are preferred. Without history the choice is a stable hash,
// so the same lesson asks the same question on every device and in a test.
//
// Everything here is pure except the two storage helpers at the bottom, which
// are best-effort and never throw.

import { isPortableItem, reviewStem } from "./retrieval-portable.js";

const DAY_MS = 24 * 60 * 60 * 1000;
/** The "recent" window, in days before today's paced date. */
export const RECENT_WINDOW_DAYS = [14, 28];

function hash(s) {
  let h = 2166136261;
  const str = String(s ?? "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dayNumber(iso) {
  const t = Date.parse(`${String(iso || "").slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(t) ? Math.round(t / DAY_MS) : null;
}

/** "Math is Mine" and other practice-standard lessons have no content to retrieve. */
function hasContent(entry) {
  return !!entry?.standard && !/^MPP\b/i.test(entry.standard);
}

/**
 * Pick from `candidates`: the one this student missed most, else a stable
 * rotation keyed to today's lesson and the slot.
 */
function choose(candidates, missRate, seed) {
  if (!candidates.length) return null;
  let best = null;
  let bestRate = 0;
  for (const c of candidates) {
    const rate = Number(missRate?.[c.id]) || 0;
    if (rate > bestRate) {
      best = c;
      bestRate = rate;
    }
  }
  return best || candidates[hash(seed) % candidates.length];
}

/**
 * The two source lessons for `lessonId`'s spiral review.
 *
 * @param {Array<{id:string, standard?:string, unit?:string, date?:string}>} sequence
 *   paced lessons in district teaching order (retrieval-bank.json `sequence`)
 * @param {string} lessonId today's lesson (variants resolve to their parent)
 * @param {{ missRate?: Record<string, number> }} [opts] per-lesson miss rate
 *   (0..1) from this device's history; higher is preferred
 * @returns {{ recent: object|null, earlier: object|null }}
 */
export function selectSpiralSources(sequence, lessonId, { missRate = {} } = {}) {
  const none = { recent: null, earlier: null };
  const base = String(lessonId || "").match(/^(\d+-\d+)/)?.[1];
  if (!base || !Array.isArray(sequence)) return none;
  const at = sequence.findIndex((e) => e?.id === base);
  if (at <= 0) return none;
  const today = sequence[at];
  const anchor = dayNumber(today.date);
  // Yesterday is the authored warm-up's job; today's own standard is about to
  // be taught. Neither is spiral review.
  const pool = sequence
    .slice(0, at - 1)
    .filter((e) => hasContent(e) && e.standard !== today.standard);

  let recent = null;
  if (anchor !== null) {
    const [near, far] = RECENT_WINDOW_DAYS;
    const inWindow = pool.filter((e) => {
      const d = dayNumber(e.date);
      return d !== null && anchor - d >= near && anchor - d <= far;
    });
    recent = choose(inWindow, missRate, `${base}|recent`);
  }

  const earlierUnits = pool.filter((e) => e.unit && e.unit !== today.unit && e !== recent);
  const older = (e) => {
    const d = dayNumber(e.date);
    return anchor !== null && d !== null && anchor - d > RECENT_WINDOW_DAYS[1];
  };
  const tiers = [
    earlierUnits.filter((e) => older(e) && e.unit !== recent?.unit),
    earlierUnits.filter((e) => e.unit !== recent?.unit),
    earlierUnits.filter(older),
    earlierUnits,
  ];
  const tier = tiers.find((t) => t.length) || [];
  const earlier = choose(tier, missRate, `${base}|earlier`);
  return { recent, earlier };
}

/**
 * The spiral-eligible questions a lesson config authored for ITSELF: the exit
 * ticket and the Connect checks, normalised to the multiple-choice shape and
 * filtered to ones that stand alone away from their lesson.
 */
export function spiralItemsFrom(config) {
  if (!config || typeof config !== "object") return [];
  const lesson = String(config.lessonId || "");
  const raw = [];
  const et = config.reflect?.exitTicket || config.exitTicket;
  if (et) raw.push({ ...et, type: et.type || "multiple-choice", source: "exit-ticket" });
  for (const q of Array.isArray(config.connect?.check) ? config.connect.check : []) {
    if (!q) continue;
    const correctIndex = Number.isInteger(q.correctIndex)
      ? q.correctIndex
      : Number(q.answer ?? q.correct);
    raw.push({ ...q, type: "multiple-choice", correctIndex, source: "connect" });
  }
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    if (!isPortableItem(item)) continue;
    const stem = reviewStem(item.stem);
    if (seen.has(stem)) continue;
    seen.add(stem);
    out.push({
      lesson,
      source: item.source,
      stem,
      choices: item.choices.map((c) => String(c).trim()),
      correctIndex: item.correctIndex,
      ...(item.explanation ? { explanation: String(item.explanation).trim() } : {}),
      ...(Array.isArray(item.choiceFeedback) ? { choiceFeedback: item.choiceFeedback } : {}),
      ...(Array.isArray(item.misconceptionTags)
        ? { misconceptionTags: item.misconceptionTags }
        : {}),
      ...(item.stemEs ? { stemEs: item.stemEs } : {}),
      ...(Array.isArray(item.choicesEs) ? { choicesEs: item.choicesEs } : {}),
      ...(item.explanationEs ? { explanationEs: item.explanationEs } : {}),
      ...(Array.isArray(item.choiceFeedbackEs) ? { choiceFeedbackEs: item.choiceFeedbackEs } : {}),
    });
  }
  return out;
}

/** Stable identity for an item in this device's spiral history. */
export function spiralItemKey(item) {
  return `${item?.lesson || ""}:${hash(item?.stem).toString(36)}`;
}

/** An item the student missed before (and has not since got right) first; else a stable pick. */
export function pickSpiralItem(items, { missed = new Set(), seed = "" } = {}) {
  if (!Array.isArray(items) || !items.length) return null;
  const again = items.find((it) => missed.has(spiralItemKey(it)));
  return again || items[hash(seed) % items.length];
}

// ── Device history (best-effort; every path tolerates blocked storage) ───────

const STORE_KEY = "nt-spiral:v1";
const MAX_ITEMS = 60;

function readStore() {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) || "null");
    return parsed && typeof parsed.items === "object" && parsed.items ? parsed : { items: {} };
  } catch {
    return { items: {} };
  }
}

/** Keys of spiral items this device's student missed and has not since answered right. */
export function missedSpiralItems() {
  const { items } = readStore();
  return new Set(Object.keys(items).filter((k) => items[k]?.missed));
}

/** Record a spiral answer. Bounded: the oldest entries are dropped past MAX_ITEMS. */
export function recordSpiralAnswer(item, correct, now = Date.now()) {
  try {
    const store = readStore();
    store.items[spiralItemKey(item)] = { missed: !correct, t: now };
    const keys = Object.keys(store.items);
    if (keys.length > MAX_ITEMS) {
      keys
        .sort((a, b) => (store.items[a].t || 0) - (store.items[b].t || 0))
        .slice(0, keys.length - MAX_ITEMS)
        .forEach((k) => delete store.items[k]);
    }
    globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage blocked — the review still works, it just cannot remember */
  }
}

/**
 * Per-lesson miss rate from this device's saved lesson attempts
 * (`rma_<lesson>_<student>`, written by state.js) for the given lessons.
 * A lesson never opened on this device has no entry.
 */
export function lessonMissRates(lessonIds, studentId) {
  const out = {};
  for (const id of lessonIds || []) {
    try {
      const key = studentId ? `rma_${id}_${studentId}` : `rma_${id}`;
      const saved = JSON.parse(globalThis.localStorage?.getItem(key) || "null");
      const attempts = Number(saved?.totalAttempts) || 0;
      if (attempts > 0) out[id] = 1 - (Number(saved.totalCorrect) || 0) / attempts;
    } catch {
      /* unreadable entry — no history for that lesson */
    }
  }
  return out;
}

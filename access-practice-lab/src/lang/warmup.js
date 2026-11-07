// Daily Language Warm-Up: pure logic. Which set a learner gets on a date, how a day is saved, and the calm weekly rhythm.
//
// Content lives in content/warmup-early.json (K-1, 2-3) and content/warmup-upper.json (3-5, 6-8): 60 days per tier.
// A tier cycles by calendar date, so everyone on the same band sees the same warm-up on the same day and no
// setting, score or streak decides what comes next. Nothing here is a level, a score or a prediction.
//
// State is one object in prefs (`prefs.warmup`), so it travels with the existing prefs backup:
//   { v: 1, days: { "<band>|YYYY-MM-DD": { w: 1, l: { ok, tries, read }, q: { text }, s: { checks: [0, 2], done: 1 }, at } } }
import { todayISO } from "../util.js";

export const WARMUP_STEPS = ["word", "listen", "write", "speak"];
export const MAX_DAYS_KEPT = 240;
export const MAX_TEXT = 400;

/** Bands K and 1 share the first tier; every other band has its own. */
export const tierOf = (band) =>
  band === "K" || band === "1" ? "K-1" : band === "4-5" ? "3-5" : band;
export const fileOf = (tier) => (tier === "K-1" || tier === "2-3" ? "early" : "upper");
export const TIERS = ["K-1", "2-3", "3-5", "6-8"];

/** Whole days since 2020-01-01 for a local ISO date; UTC math, so a daylight-saving change never shifts the day. */
export function dayNumber(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(y, (m || 1) - 1, d || 1) - Date.UTC(2020, 0, 1)) / 86400000);
}
export const isISODate = (s) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) && !Number.isNaN(Date.parse(`${s}T12:00:00`));

const hash = (s) => {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
};

/** The index of the warm-up for a date in a tier of `count` days. */
export const dayIndex = (iso, tier, count) => (dayNumber(iso) + (hash(tier) % count)) % count;

/** Which of the three answer positions holds the right answer on a date (stable, never random). */
export const answerSlot = (iso, word) => hash(`${iso}|${word}`) % 3;

const VOWEL = /^[aeiou]/i;
export const withArticle = (w) => `${VOWEL.test(w) ? "an" : "a"} ${w}`;

const FRAMES = {
  "K-1": {
    n: ["The {W} is ___."],
    v: ["I can {W} ___."],
    adj: ["The ___ is {W}."],
    adv: ["I can go {W} the ___."],
    x: ['My sentence with "{W}": ___.'],
  },
  rest: {
    n: [
      'I can say something about "{W}": ___.',
      'Tell about "{W}": it is ___ and it ___.',
      '___ and "{W}" go together because ___.',
    ],
    v: ["I can {W} when ___.", "Today I will {W} because ___.", "Before you {W}, you ___."],
    adj: [
      "___ is {W} because ___.",
      "Something {W} that I know is ___.",
      "I would describe ___ as {W} because ___.",
    ],
    adv: ["I can ___ {W}.", "Someone ___ {W} when ___.", "I ___ {W} because ___."],
    prep: [
      "The ___ is {W} the ___.",
      "I put my ___ {W} the ___.",
      "The ___ is {W} the ___ and ___.",
    ],
    conn: ["___ {W} ___.", "I ___ {W} ___.", "___ {W} ___, and I know because ___."],
    x: [
      'My sentence with "{W}": ___.',
      'I can use "{W}" to say ___.',
      'Here is a true sentence with "{W}": ___.',
    ],
  },
};

/** The sentence frame for a word; an entry may carry its own `frame` when its position in a sentence is special. */
export function frameFor(tier, entry, idx = 0) {
  if (entry.frame) return entry.frame;
  const table = tier === "K-1" ? FRAMES["K-1"] : FRAMES.rest;
  const options = table[entry.pos] || table.x || FRAMES.rest.x;
  const frame = options[idx % options.length];
  return frame.replaceAll("{W}", entry.w);
}

/** True when text uses the word (or an ending of it, like "runs" for "run"). */
export function usesWord(text, word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, "");
  const stem = w.length > 4 ? w.replace(/(e|y)$/, "") : w;
  return new RegExp(`\\b${stem}`, "i").test(String(text || ""));
}

/** The warm-up for a band and date: the entry, its index, its answer choices in a stable order, its frame. */
export function warmupFor(data, band, iso) {
  const tier = tierOf(band);
  const list = data?.tiers?.[tier];
  if (!Array.isArray(list) || !list.length) return null;
  const index = dayIndex(iso, tier, list.length);
  const e = list[index];
  const slot = answerSlot(iso, e.w);
  const options = [...e.x];
  options.splice(slot, 0, e.a);
  return {
    tier,
    iso,
    index,
    count: list.length,
    entry: e,
    options,
    correct: slot,
    frame: frameFor(tier, e, index),
    say: SPEAK[index % SPEAK.length],
  };
}

/** Three speaking-rehearsal routines (rotated by day). `kid` is the K-1 wording. */
export const SPEAK = [
  {
    id: "model",
    en: "Listen to the model sentence. Say it two times: first slowly, then smoothly, like you are talking to a friend.",
    es: "Escucha la oración modelo. Dila dos veces: primero despacio y luego con fluidez, como si hablaras con un amigo.",
    kidEn: "Listen to the sentence. Say it two times. Say it slowly, then say it smoothly.",
    kidEs: "Escucha la oración. Dila dos veces. Primero despacio y luego con fluidez.",
  },
  {
    id: "extend",
    en: 'Say your quick-write sentence out loud. Then say it again and add the word "because" and one more detail.',
    es: 'Di en voz alta tu oración. Luego dila otra vez y añade la palabra "because" y un detalle más.',
    kidEn: "Say your sentence out loud. Then say it again. Add one more word.",
    kidEs: "Di tu oración en voz alta. Luego dila otra vez y añade una palabra más.",
  },
  {
    id: "use",
    en: "Tell a partner, a family member, or the wall when you could use this word today.",
    es: "Cuéntale a un compañero, a un familiar o a la pared cuándo podrías usar esta palabra hoy.",
    kidEn: "Tell someone when you could use this word today.",
    kidEs: "Dile a alguien cuándo podrías usar esta palabra hoy.",
  },
];
export const SPEAK_CHECKS = [
  { en: "I said the word clearly.", es: "Dije la palabra con claridad." },
  { en: "I said a whole sentence.", es: "Dije una oración completa." },
  {
    en: "I used my voice so someone could hear me.",
    es: "Usé mi voz para que alguien pudiera oírme.",
  },
];

// ── saved state ─────────────────────────────────────────────────────────────────
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
export const dayKey = (band, iso) => `${tierOf(band)}|${iso}`;

export function cleanDay(raw) {
  const r = isObj(raw) ? raw : {};
  const l = isObj(r.l) ? r.l : {};
  const s = isObj(r.s) ? r.s : {};
  return {
    w: r.w === 1 ? 1 : 0,
    l: {
      ok: l.ok === 1 ? 1 : 0,
      tries: Math.max(0, Math.min(99, Number(l.tries) || 0)),
      read: l.read === 1 ? 1 : 0,
    },
    q: { text: String(isObj(r.q) ? r.q.text || "" : "").slice(0, MAX_TEXT) },
    s: {
      checks: [
        ...new Set((Array.isArray(s.checks) ? s.checks : []).filter((n) => [0, 1, 2].includes(n))),
      ].sort(),
      done: s.done === 1 ? 1 : 0,
    },
    at: typeof r.at === "string" ? r.at.slice(0, 30) : "",
  };
}
export function cleanWarmup(raw) {
  const days = {};
  const src = isObj(raw?.days) ? raw.days : {};
  const keys = Object.keys(src)
    .filter((k) => /^(K-1|2-3|3-5|6-8)\|\d{4}-\d{2}-\d{2}$/.test(k))
    .sort()
    .slice(-MAX_DAYS_KEPT);
  for (const k of keys) days[k] = cleanDay(src[k]);
  return { v: 1, days };
}
export const getWarmup = (prefs) => cleanWarmup(prefs?.warmup);

/** Which steps of a saved day are done. Writing counts once a sentence of at least three words is saved. */
export function stepsDone(day) {
  const d = cleanDay(day);
  return {
    word: d.w === 1,
    listen: d.l.ok === 1,
    write: d.q.text.trim().split(/\s+/).filter(Boolean).length >= 3,
    speak: d.s.done === 1,
  };
}
export const doneCount = (day) => Object.values(stepsDone(day)).filter(Boolean).length;
export const isComplete = (day) => doneCount(day) === WARMUP_STEPS.length;

/** A new warm-up state with one day changed; the caller saves it with ctx.setPrefs({ warmup }). */
export function updateDay(prefs, band, iso, patch) {
  const state = getWarmup(prefs);
  const key = dayKey(band, iso);
  const merged =
    typeof patch === "function"
      ? patch(cleanDay(state.days[key]))
      : { ...cleanDay(state.days[key]), ...patch };
  const day = cleanDay({ ...merged, at: merged.at || new Date().toISOString() });
  return cleanWarmup({ v: 1, days: { ...state.days, [key]: day } });
}

// ── the calm weekly rhythm ─────────────────────────────────────────────────────
export const monday = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return todayISO(d);
};
export const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return todayISO(d);
};

/** Days (any band) on which at least one warm-up step was done. */
export function warmupDays(state) {
  return [
    ...new Set(
      Object.entries(state.days)
        .filter(([, d]) => doneCount(d) > 0)
        .map(([k]) => k.split("|")[1]),
    ),
  ].sort();
}
export function completeDays(state) {
  return [
    ...new Set(
      Object.entries(state.days)
        .filter(([, d]) => isComplete(d))
        .map(([k]) => k.split("|")[1]),
    ),
  ].sort();
}

/**
 * This week as seven pips (Monday first). `status` is "full" (all four steps), "some" (one to three steps) or "none".
 * `other` marks days with saved practice that was not a warm-up, so a day that mattered is never shown as empty.
 * `count` is how many days have any work. There is no target, no loss and nothing to keep up.
 */
export function weekRhythm(state, practice = [], today = todayISO()) {
  const start = monday(today);
  const full = new Set(completeDays(state));
  const some = new Set(warmupDays(state));
  const other = new Set(practice);
  const days = Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(start, i);
    const status = full.has(iso) ? "full" : some.has(iso) ? "some" : "none";
    return {
      iso,
      status,
      other: status === "none" && other.has(iso),
      today: iso === today,
      future: iso > today,
    };
  });
  return { start, days, count: days.filter((d) => d.status !== "none" || d.other).length };
}

/** Consecutive weeks (ending this week or last) with at least one day of warm-up or practice. A week off is never a failure. */
export function weeksInARow(state, practice = [], today = todayISO()) {
  const weeks = new Set([...warmupDays(state), ...practice].map(monday));
  let cursor = monday(today);
  if (!weeks.has(cursor)) cursor = addDays(cursor, -7);
  let n = 0;
  while (weeks.has(cursor)) {
    n++;
    cursor = addDays(cursor, -7);
  }
  return n;
}

/** Totals used by the Collection Book and the Portfolio. */
export function warmupTotals(state) {
  const days = Object.values(state.days).map(cleanDay);
  return {
    days: warmupDays(state).length,
    full: completeDays(state).length,
    words: days.filter((d) => d.w).length,
    clips: days.filter((d) => d.l.ok).length,
    sentences: days.filter((d) => stepsDone(d).write).length,
    spoken: days.filter((d) => d.s.done).length,
  };
}

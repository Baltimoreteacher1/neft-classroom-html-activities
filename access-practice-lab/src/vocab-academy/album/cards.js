// Vocabulary Academy — the Word Album's model. Pure: no storage, no DOM, no fetch, injectable clock, never writes.
// A card's look comes from the word's DERIVED state (model.js wordState); nothing about a card is stored.
//
//   state          rarity frame   meaning
//   new            locked         silhouette: the word has not been met
//   learning       common
//   developing     uncommon
//   applying       rare
//   secure         legendary
//   review-needed  visit          calm "visit me again" ribbon
//
// Shapes:  card    { id, state, rarity, locked, hw, pos, word }      hw/pos/word only when the card is unlocked
//          lesson  { id, n, title, grade, u, total, unlocked, started, cards:[card] }
//          album   { grades:[{ grade, units:[{ u, lessons:[lesson], total, unlocked }], total, unlocked }], totals }
//          mission { id, kind, href, done, n?, unit?, lesson?, grade? }       (copy lives in the view, in two languages)
import { SHIPPED_GRADES } from "../contract.js";
import { groupId, lessonHref, parseUnitId, unitHref, vaHref } from "../data.js";
import { dueWords, wordState } from "../model.js";
import { dayKey, reviewPerDay } from "../srs.js";

/** Frames, in the order a card climbs them. */
export const RARITY = {
  new: "locked",
  learning: "common",
  developing: "uncommon",
  applying: "rare",
  secure: "legendary",
  "review-needed": "visit",
};
export const RARITY_LABEL = {
  locked: ["Locked", "Bloqueada"],
  common: ["Common", "Común"],
  uncommon: ["Uncommon", "Poco común"],
  rare: ["Rare", "Rara"],
  legendary: ["Legendary", "Legendaria"],
  visit: ["Visit me again", "Vuelve a visitarme"],
};
/** Filter order for the state picker: locked first, then the climb. */
export const ALBUM_STATES = [
  "new",
  "learning",
  "developing",
  "applying",
  "secure",
  "review-needed",
];

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const gradeOfWord = (progress, index, id) => {
  const g = index?.words?.[id]?.grade ?? progress?.words?.[id]?.g;
  return SHIPPED_GRADES.includes(String(g)) ? String(g) : "";
};

/** One card. `word` is the loaded word record (hw, pos, def, ex, es, visual); a card without one still names its word. */
export function cardFor(progress, wordId, word = null, index = null) {
  const state = wordState(progress?.words?.[wordId]);
  const locked = state === "new";
  const hw = locked ? "" : word?.hw || index?.words?.[wordId]?.hw || wordId.split(".")[1] || wordId;
  return {
    id: wordId,
    state,
    rarity: RARITY[state],
    locked,
    hw,
    pos: locked ? "" : word?.pos || index?.words?.[wordId]?.pos || "",
    word: locked ? null : word,
  };
}

/** One lesson row (data.js getGradeUnits: { n, id, title, wordIds, published }) → lesson. */
export function buildLesson(progress, row, wordsById = new Map(), index = null) {
  const cards = (row.wordIds || []).map((id) =>
    cardFor(progress, id, wordsById.get(id) || null, index),
  );
  const unlocked = cards.filter((c) => !c.locked).length;
  return {
    id: row.id,
    n: row.n,
    title: row.title || "",
    total: cards.length,
    unlocked,
    started: unlocked > 0,
    cards,
  };
}

/**
 * Grades the Album lists: the grade the learner chose, every grade a met word belongs to (their own earlier-grade words
 * included) and the grade in the link; only the grades of this release, in curriculum order.
 */
export function gradesToShow(progress, index, { grade = "" } = {}) {
  const set = new Set();
  const add = (g) => {
    if (SHIPPED_GRADES.includes(String(g))) set.add(String(g));
  };
  add(progress?.grade);
  add(String(grade || "").toUpperCase());
  for (const id of Object.keys(isObj(progress?.words) ? progress.words : {}))
    if (wordState(progress.words[id]) !== "new") add(gradeOfWord(progress, index, id));
  return SHIPPED_GRADES.filter((g) => set.has(g));
}

/** Word ids the view must load: only the words the learner has met (locked cards are drawn from the index alone). */
export function metWordIds(progress, gradeUnits) {
  const out = [];
  for (const { units } of gradeUnits)
    for (const unit of units)
      for (const row of unit.lessons)
        for (const id of row.wordIds || [])
          if (wordState(progress?.words?.[id]) !== "new") out.push(id);
  return out;
}

/**
 * The whole Album. `gradeUnits` is [{ grade, units:[{ u, lessons:[row] }] }] straight from data.js getGradeUnits (only
 * published lessons are used); `wordsById` is a Map of loaded word records.
 */
export function buildAlbum(progress, gradeUnits, wordsById = new Map(), index = null) {
  const totals = {
    cards: 0,
    unlocked: 0,
    byState: Object.fromEntries(ALBUM_STATES.map((s) => [s, 0])),
  };
  const grades = gradeUnits.map(({ grade, units }) => {
    const unitsOut = units
      .map((unit) => {
        const lessons = unit.lessons
          .filter((r) => r.published !== false && (r.wordIds || []).length)
          .map((r) => buildLesson(progress, r, wordsById, index));
        return {
          u: unit.u,
          lessons,
          total: lessons.reduce((s, l) => s + l.total, 0),
          unlocked: lessons.reduce((s, l) => s + l.unlocked, 0),
        };
      })
      .filter((u) => u.lessons.length);
    const total = unitsOut.reduce((s, u) => s + u.total, 0);
    const unlocked = unitsOut.reduce((s, u) => s + u.unlocked, 0);
    for (const u of unitsOut)
      for (const l of u.lessons) for (const c of l.cards) totals.byState[c.state] += 1;
    totals.cards += total;
    totals.unlocked += unlocked;
    return { grade, units: unitsOut, total, unlocked };
  });
  return { grades, totals };
}

/** Where a lesson sits in an album: { grade, u, lesson } or null. */
export function findLesson(album, lessonId) {
  for (const g of album.grades)
    for (const u of g.units)
      for (const lesson of u.lessons)
        if (lesson.id === lessonId) return { grade: g.grade, u: u.u, lesson };
  return null;
}

/** Filter test used by the view (and the tests): grade, state and a text search. Locked cards never match a search. */
export function cardMatches(card, { state = "", search = "" } = {}) {
  if (state && card.state !== state) return false;
  const q = String(search || "")
    .trim()
    .toLowerCase();
  if (q) return !card.locked && card.hw.toLowerCase().includes(q);
  return true;
}

const doneToday = (iso, today) => {
  if (typeof iso !== "string") return false;
  const t = Date.parse(iso);
  return !Number.isNaN(t) && dayKey(new Date(t)) === today;
};

/**
 * Up to three suggestions computed from the record. No streaks, no timers, nothing lost: a suggestion is either open or
 * plainly done today. `done` comes from real activity today (progress.daily, a word practised today, the vault's own
 * saved finish), never from a counter this model keeps.
 */
export function missionsFor(progress, album, { index = null, now } = {}) {
  const today = dayKey(now);
  const out = [];
  const gradeOf = (id) => index?.words?.[id]?.grade;
  const cap = reviewPerDay(progress);
  const due = dueWords(progress, { now, limit: 50, gradeOf }).length;
  const reviewedToday = progress?.daily?.day === today ? progress.daily.words.length : 0;
  if (due > 0)
    out.push({ id: "review", kind: "review", href: vaHref("review"), done: false, n: Math.min(due, cap) });
  else if (reviewedToday > 0)
    out.push({ id: "review", kind: "review", href: vaHref("review"), done: true, n: reviewedToday });

  // The lesson to build on: the one the learner touched last, else the first lesson with a met word.
  let focus = null;
  const last = parseUnitId(progress?.last?.unit);
  if (last && !last.custom) focus = findLesson(album, progress.last.unit);
  if (!focus)
    for (const g of album.grades) {
      for (const u of g.units) {
        const lesson = u.lessons.find((l) => l.started);
        if (lesson) {
          focus = { grade: g.grade, u: u.u, lesson };
          break;
        }
      }
      if (focus) break;
    }

  if (!focus) {
    const grade = SHIPPED_GRADES.includes(String(progress?.grade)) ? String(progress.grade) : "";
    out.push({
      id: "start",
      kind: "start",
      href: grade ? lessonHref(grade, 1) : vaHref("grades"),
      done: false,
      grade,
    });
    return out.slice(0, 3);
  }
  const { grade, u, lesson } = focus;
  const gid = groupId(grade, u);
  const vault = progress?.unitWork?.[gid]?.vault;
  out.push({
    id: "vault",
    kind: "vault",
    href: unitHref(grade, u, "vault"),
    done: Boolean(vault?.done) && doneToday(vault.at, today),
    unit: u,
    grade,
  });
  const played = lesson.cards.some((c) => progress.words?.[c.id]?.lastDay === today);
  out.push({
    id: "game",
    kind: "game",
    href: `${vaHref("games")}?grade=${encodeURIComponent(grade)}&unit=${encodeURIComponent(lesson.id)}`,
    done: played,
    lesson: lesson.n,
    grade,
    unitId: lesson.id,
  });
  return out.slice(0, 3);
}

/** The "set complete" fraction of a lesson/unit/grade as text-ready numbers. */
export const meterOf = (x) => ({
  done: x.unlocked,
  total: x.total,
  complete: x.total > 0 && x.unlocked >= x.total,
});

// Review sessions: due words first, then weak words, one item per word, mixed types, never a repeated stem.
//   buildReviewSession(progress, { grade, limit, now, getWord, getIndex }) -> Promise<item[]>   (loads word records via data.js)
//   buildReviewItems({ progress, entries: [{ word, unit }], grade, now, limit }) -> item[]      (pure; what the tests drive)
// Items carry resultType "review", so model.recordResult also credits delayed retrieval for a correct answer after a gap.
import { ACTIVITY_TYPES, buildItems } from "./activities/registry.js";
import { dueEntries, dayKey, toDate } from "./srs.js";
import { wordEntry } from "./model.js";
import { rngFor } from "./rng.js";

export const SESSION_LIMIT = 8;
const SCORED = ["mean", "rec", "ctx", "morph", "prod"];
const FREE = new Set(["write", "speak"]);

/** Weakest evidence first: dimensions with attempts and the lowest accuracy, then those never tried. */
export function dimOrder(entry, word, rng) {
  const ev = entry.ev || {};
  const score = (d) => {
    const r = ev[d];
    return r?.n ? (Number(r.c) || 0) / r.n : 0.5;
  };
  const dims = SCORED.filter((d) => d !== "morph" || word.morph?.segs?.length || word.family?.length);
  // Ties (nothing tried yet) rotate with the seeded rng so a session mixes dimensions instead of always starting with recognition.
  return (rng ? rng.shuffle(dims) : dims).sort((a, b) => score(a) - score(b) || (rng ? 0 : SCORED.indexOf(a) - SCORED.indexOf(b)));
}

/** Words that are not due but need work: review-needed first, then learning/developing with a recent miss. */
export function weakIds(progress, { grade, gradeOf, exclude = new Set(), now } = {}) {
  const out = [];
  for (const [id, e] of Object.entries(progress?.words || {})) {
    if (exclude.has(id)) continue;
    if (grade) {
      const g = e.g || gradeOf?.(id);
      if (g && String(g) !== String(grade)) continue;
    }
    const entry = wordEntry(progress, id);
    if (entry.state === "secure" || entry.state === "new") continue;
    const recent = Object.values(entry.ev || {}).some((r) => String(r.r || "").endsWith("0"));
    const rank = entry.state === "review-needed" ? 0 : recent ? 1 : entry.state === "learning" ? 2 : 3;
    if (rank < 3) out.push({ id, rank, lapses: entry.lapses, step: entry.step });
  }
  return out.sort((a, b) => a.rank - b.rank || b.lapses - a.lapses || a.step - b.step || (a.id < b.id ? -1 : 1)).map((x) => x.id);
}

function itemForWord({ progress, word, unit, ctx, rng, used, freeLeft, lastType }) {
  const entry = wordEntry(progress, word.id);
  const dims = dimOrder(entry, word, rng);
  const base = { ...ctx, grade: unit.grade, onlyWords: [word.id], salt: `review:${ctx.day}` };
  const tries = dims.flatMap((d) => rng.shuffle(ACTIVITY_TYPES.filter((t) => t.dim === d && t.scope !== "unit")));
  const second = rng.shuffle(ACTIVITY_TYPES.filter((t) => t.scope !== "unit" && !dims.includes(t.dim)));
  for (const t of [...tries, ...second]) {
    if (t.id === lastType && tries.length > 1) continue;
    if (FREE.has(t.mode) && !freeLeft) continue;
    if (t.mode === "speak" || t.mode === "write") if (t.dim !== dims[0]) continue;
    const got = buildItems(t.id, unit, base).filter((it) => it.wordId === word.id && !used.has(it.stem));
    if (got.length) {
      const it = rng.pick(got);
      return { ...it, resultType: "review", reviewOf: word.id };
    }
  }
  return null;
}

/** Pure core: build the session from word records already in hand. */
export function buildReviewItems({ progress = {}, entries = [], grade, limit = SESSION_LIMIT, now, ctx = {} } = {}) {
  const when = toDate(now);
  const day = dayKey(when);
  const byId = new Map(entries.map((e) => [e.word.id, e]));
  const due = dueEntries(progress, when, { grade }).map((x) => x.id).filter((id) => byId.has(id));
  const weak = weakIds(progress, { grade, exclude: new Set(due) }).filter((id) => byId.has(id));
  const order = [...due, ...weak].slice(0, limit);
  const rng = rngFor(`review|${day}|${grade ?? "all"}|${order.join(",")}`);
  const used = new Set();
  const out = [];
  let lastType = "";
  let freeLeft = 1;
  for (const id of order) {
    const { word, unit } = byId.get(id);
    const pool = [...new Set([...entries.filter((e) => e.unit.id === unit.id).map((e) => e.word)])];
    const it = itemForWord({ progress, word, unit: { ...unit, words: unit.words?.length ? unit.words : pool }, ctx: { ...ctx, day }, rng, used, freeLeft, lastType });
    if (!it) continue;
    used.add(it.stem);
    if (FREE.has(it.mode)) freeLeft -= 1;
    lastType = it.type;
    out.push({ ...it, n: out.length + 1, of: order.length, due: due.includes(id) });
  }
  return out.map((it) => ({ ...it, of: out.length }));
}

/** Load word records through data.js, then build. `opts.getWord` / `opts.getIndex` replace the loaders in tests. */
export async function buildReviewSession(progress, { grade, limit, now, ctx = {}, getWord, getIndex } = {}) {
  const data = getWord && getIndex ? null : await import("./data.js");
  const gw = getWord || data.getWord;
  const gi = getIndex || data.getIndex;
  const index = await gi();
  const gradeOf = (id) => index.words?.[id]?.grade;
  const when = toDate(now);
  const cap = limit ?? SESSION_LIMIT;
  const due = dueEntries(progress, when, { grade, gradeOf }).map((x) => x.id);
  const ids = [...due, ...weakIds(progress, { grade, gradeOf, exclude: new Set(due) })].slice(0, cap);
  const found = (await Promise.all(ids.map((id) => gw(id)))).filter(Boolean);
  return buildReviewItems({ progress, entries: found, grade, limit: cap, now: when, ctx });
}

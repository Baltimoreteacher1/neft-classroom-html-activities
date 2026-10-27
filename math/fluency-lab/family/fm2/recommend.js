// What to practice next, from the learner's own record only. Deterministic: the same state, grade and clock give the
// same list, with ties broken by (gameId, skillId). Priority: review (due) > weak > stretch > new; skills from the
// grade below with weak evidence may appear as review. @fm2 FM-022 FM-064
import { isDue, mastery, starsFor } from "./adapt.js";
import { covers } from "./inventory.js";

const DAY = 86400000;
export const WEAK_BELOW = 0.6;
export const REASONS = ["review", "weak", "stretch", "new"];
const PRIOR_GRADE_CAP = 1;

const has = (object, key) => object != null && Object.hasOwn(object, key);
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const alphabetical = (a, b) => cmp(a.gameId, b.gameId) || cmp(a.skillId, b.skillId);
const clampLevel = (level) => Math.min(3, Math.max(1, Math.round(Number(level)) || 1));

// A defensive copy of one stored record: damaged entries are dropped so the evidence rules never see them.
function recordFor(state, gameId, skillId) {
  const key = `${gameId}:${skillId}`;
  const raw = has(state?.skills, key) ? state.skills[key] : null;
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.recent)) return null;
  const recent = raw.recent.filter((a) => a && (a.c === 0 || a.c === 1)).map((a) => ({ c: a.c, h: Number.isFinite(a.h) ? a.h : 0, l: a.l, t: a.t }));
  const plays = Number.isFinite(raw.plays) ? raw.plays : 0;
  if (!recent.length && !plays) return null;
  return { recent, level: raw.level, plays, dueAt: Number.isFinite(raw.dueAt) ? raw.dueAt : 0 };
}

function evidenceFor(record, now) {
  const m = mastery(record);
  const last = (record?.recent || []).slice(-4);
  return {
    mastery: m.score,
    n: m.n,
    dueDays: record?.dueAt ? Math.round(((now - record.dueAt) / DAY) * 100) / 100 : null,
    stars: starsFor(record),
    recentRight: last.filter((a) => a.c === 1).length,
    recentOf: last.length,
  };
}

// Sorts by numeric keys, then by the given tie-break (alphabetical by default).
export const sortCandidates = (list, tie = alphabetical) =>
  [...list].sort((a, b) => {
    for (let i = 0; i < Math.max(a.key.length, b.key.length); i += 1) {
      const diff = (a.key[i] ?? 0) - (b.key[i] ?? 0);
      if (diff) return diff;
    }
    return tie(a, b);
  });

// Every skill the rules could pick for this grade, grouped by rule. Buckets are unsorted except `fresh`, whose
// `key[0]` is the position in its game's queue of unseen skills.
export function candidates({ state, grade, games, now = Date.now() }) {
  const out = { review: [], prior: [], weak: [], stretch: [], fresh: [] };
  const queues = new Map();
  for (const game of games || []) {
    for (const skill of game.skills || []) {
      const here = covers(skill, grade);
      const before = grade >= 1 && covers(skill, grade - 1) && !here;
      if (!here && !before) continue;
      const record = recordFor(state, game.id, skill.id);
      const base = { gameId: game.id, skillId: skill.id, game, skill };
      if (!record) {
        if (!here) continue;
        if (!queues.has(game.id)) queues.set(game.id, []);
        queues.get(game.id).push({ ...base, level: grade > skill.grades[0] ? 2 : 1, reason: "new", evidence: evidenceFor(null, now) });
        continue;
      }
      const evidence = evidenceFor(record, now);
      const level = clampLevel(record.level);
      const m = mastery(record);
      const weak = m.reliable && m.score < WEAK_BELOW;
      if (before) {
        if (weak) out.prior.push({ ...base, level, reason: "review", evidence, key: [m.score, record.dueAt || 0] });
      } else if (isDue(record, now)) out.review.push({ ...base, level, reason: "review", evidence, key: [m.score, record.dueAt] });
      else if (weak) out.weak.push({ ...base, level, reason: "weak", evidence, key: [m.score] });
      else if (evidence.stars === 3 && level < 3) out.stretch.push({ ...base, level: level + 1, reason: "stretch", evidence, key: [level, -m.score] });
    }
  }
  for (const queue of queues.values()) queue.forEach((entry, position) => out.fresh.push({ ...entry, key: [position] }));
  return out;
}

// Spread new skills over games and strands: never the same game twice in a row when another game has something
// left, preferring a different strand, then the game used least so far, then alphabetical.
function rotateFresh(fresh, previous) {
  const queues = new Map();
  for (const entry of sortCandidates(fresh)) {
    if (!queues.has(entry.gameId)) queues.set(entry.gameId, []);
    queues.get(entry.gameId).push(entry);
  }
  const used = new Map();
  const out = [];
  let lastGame = previous?.gameId ?? null;
  let lastStrand = previous?.skill?.strand?.en ?? null;
  for (;;) {
    const open = [...queues.entries()].filter(([, queue]) => queue.length);
    if (!open.length) break;
    const apart = open.filter(([id]) => id !== lastGame);
    const pool = apart.length ? apart : open;
    const fresher = pool.filter(([, queue]) => queue[0].skill.strand?.en !== lastStrand);
    const pickFrom = fresher.length ? fresher : pool;
    pickFrom.sort(([a], [b]) => (used.get(a) || 0) - (used.get(b) || 0) || cmp(a, b));
    const [id, queue] = pickFrom[0];
    const entry = queue.shift();
    used.set(id, (used.get(id) || 0) + 1);
    lastGame = id;
    lastStrand = entry.skill.strand?.en ?? null;
    out.push(entry);
  }
  return out;
}

const publicShape = ({ gameId, skillId, level, reason, evidence }) => ({ gameId, skillId, level, reason, evidence });

export function recommend({ state, grade, games, now = Date.now(), limit = 6 }) {
  const pool = candidates({ state, grade, games, now });
  const ordered = [...sortCandidates(pool.review), ...sortCandidates(pool.prior).slice(0, PRIOR_GRADE_CAP), ...sortCandidates(pool.weak), ...sortCandidates(pool.stretch)];
  const list = [...ordered, ...rotateFresh(pool.fresh, ordered[ordered.length - 1])];
  return list.slice(0, Math.max(0, limit)).map(publicShape);
}

const plural = (n, one, many) => (n === 1 ? one : many);

export function reasonText(rec, lang = "en") {
  const ev = rec?.evidence || {};
  const right = ev.recentRight ?? 0;
  const of = ev.recentOf ?? 0;
  const days = Math.max(0, Math.round(ev.dueDays ?? 0));
  const es = lang === "es";
  const level = rec?.level ?? 1;
  switch (rec?.reason) {
    case "review":
      if (es) {
        const lead = days ? `Hace ${days} ${plural(days, "día", "días")} que no practican esto.` : "Ya toca volver a mirar esto.";
        return `${lead} Repasar ayuda a recordarlo. Acertaste ${right} de las últimas ${of} en el nivel ${level}.`;
      }
      return `${days ? `It has been ${days} ${plural(days, "day", "days")} since you practiced this.` : "It is time to look at this again."} A quick review helps it stick. You got ${right} of the last ${of} right at level ${level}.`;
    case "weak":
      return es
        ? `Acertaste ${right} de las últimas ${of} en el nivel ${level}. Un poco más de práctica aquí lo hará más firme.`
        : `You got ${right} of the last ${of} right at level ${level}. A little more practice here will make it stronger.`;
    case "stretch":
      return es
        ? `Ganaste tres estrellas en el nivel ${level - 1}. ¿Listos para probar el nivel ${level}?`
        : `You earned three stars at level ${level - 1}. Ready to try level ${level}?`;
    default:
      return es ? `Es una destreza nueva para este grado. Empiecen en el nivel ${level}.` : `This is a new skill for this grade. Start at level ${level}.`;
  }
}

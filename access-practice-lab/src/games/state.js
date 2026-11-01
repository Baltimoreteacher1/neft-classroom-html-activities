// Language Game Studio persistence. One key (`accessPracticeLab:v1:games`) holds resumable sessions,
// a short practice history and achievements. It lives inside the lab's backup/Save-Resume boundary
// (every `accessPracticeLab:v1:*` key is exported), and it never stores a score, a level or a
// proficiency claim: only what the learner did, under which supports.
import { safeJson, storage } from "../util.js";

export const GAMES_KEY = "accessPracticeLab:v1:games";
export const MAX_HISTORY = 200;
export const MAX_SESSIONS = 40;
export const SUPPORTS = ["A", "B", "C"];
export const PHASES = ["start", "play", "transfer", "done"];

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export const emptyGames = () => ({ v: 1, sessions: {}, history: [], awards: [], pathway: null });

export const sessionKey = (game, band) => `${game}:${band}`;

export function cleanGames(raw) {
  const out = emptyGames();
  if (!isObject(raw)) return out;
  for (const [key, s] of Object.entries(isObject(raw.sessions) ? raw.sessions : {})) {
    if (!isObject(s) || typeof s.game !== "string" || !["3-5", "6-8"].includes(s.band)) continue;
    out.sessions[key] = {
      id: String(s.id || key),
      game: s.game,
      band: s.band,
      support: SUPPORTS.includes(s.support) ? s.support : "A",
      phase: PHASES.includes(s.phase) ? s.phase : "start",
      seed: Number.isFinite(s.seed) ? s.seed : 1,
      len: s.len === "quick" ? "quick" : "full",
      cur: Array.isArray(s.cur) ? s.cur.filter((x) => typeof x === "string").slice(0, 12) : [],
      startedAt: typeof s.startedAt === "string" ? s.startedAt : "",
      updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : "",
      state: isObject(s.state) ? s.state : null,
      rounds: Array.isArray(s.rounds) ? s.rounds.filter(isObject).slice(-60) : [],
      supportsUsed: Array.isArray(s.supportsUsed) ? s.supportsUsed.filter((x) => typeof x === "string").slice(0, 12) : [],
      transfer: isObject(s.transfer) ? { text: String(s.transfer.text || "").slice(0, 2000), checks: Array.isArray(s.transfer.checks) ? s.transfer.checks.filter(Number.isInteger).slice(0, 8) : [], saved: s.transfer.saved === true } : { text: "", checks: [], saved: false },
    };
  }
  out.history = (Array.isArray(raw.history) ? raw.history : []).filter((h) => isObject(h) && typeof h.game === "string" && typeof h.at === "string").slice(-MAX_HISTORY);
  out.awards = Array.isArray(raw.awards) ? [...new Set(raw.awards.filter((x) => typeof x === "string"))] : [];
  out.pathway = isObject(raw.pathway) && Array.isArray(raw.pathway.ids) ? { ids: raw.pathway.ids.filter((x) => typeof x === "string").slice(0, 12), title: String(raw.pathway.title || "").slice(0, 80), support: SUPPORTS.includes(raw.pathway.support) ? raw.pathway.support : "" } : null;
  return out;
}

export const loadGames = (read = (k) => storage.get(k)) => cleanGames(safeJson(read(GAMES_KEY), null));

export function saveGames(games, write = (k, v) => storage.set(k, v)) {
  const sessions = Object.entries(games.sessions);
  if (sessions.length > MAX_SESSIONS) {
    sessions.sort((a, b) => String(b[1].updatedAt).localeCompare(String(a[1].updatedAt)));
    games.sessions = Object.fromEntries(sessions.slice(0, MAX_SESSIONS));
  }
  games.history = games.history.slice(-MAX_HISTORY);
  return write(GAMES_KEY, JSON.stringify(games));
}

export function validGames(doc) {
  return isObject(doc) && doc.v === 1 && isObject(doc.sessions) && Array.isArray(doc.history);
}

/** Union by id for a backup import. A session already on this device wins; history merges by id. */
export function mergeGames(local, incoming) {
  const a = cleanGames(local);
  const b = cleanGames(incoming);
  const sessions = { ...b.sessions, ...a.sessions };
  const seen = new Set(a.history.map((h) => h.id));
  const history = [...a.history, ...b.history.filter((h) => !seen.has(h.id))].sort((x, y) => String(x.at).localeCompare(String(y.at)));
  return { v: 1, sessions, history: history.slice(-MAX_HISTORY), awards: [...new Set([...a.awards, ...b.awards])], pathway: a.pathway || b.pathway };
}

/** What a finished session shows the learner, the Passport and the teacher. Never a score. */
export function summarizeRounds(rounds) {
  const done = rounds.filter((r) => r.final !== false);
  const total = done.length;
  const firstTry = done.filter((r) => r.first).length;
  const hints = done.reduce((n, r) => n + (r.hints || 0), 0);
  const revised = done.filter((r) => r.revised).length;
  const independent = done.filter((r) => r.support === "C" && !(r.supports || []).length && !(r.hints > 0)).length;
  const skills = [...new Set(done.map((r) => r.skill).filter(Boolean))];
  return { total, firstTry, hints, revised, independent, skills };
}

export function recentHistory(games, { game, band, days = 0 } = {}) {
  const since = days ? Date.now() - days * 86400000 : 0;
  return games.history.filter((h) => (!game || h.game === game) && (!band || h.band === band) && (!since || new Date(h.at).getTime() >= since));
}

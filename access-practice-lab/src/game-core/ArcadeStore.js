// ArcadeStore.js — one versioned local record for the flagship games.
//
// Key `accessPracticeLab:v1:arcade` sits inside the lab's backup/Save-Resume boundary (every
// `accessPracticeLab:v1:*` key is exported and merged on import). It holds settings, per-game bests and
// unlocks, one resumable run per game+band, a short history, and compact learning evidence. It stores no
// name, no free text from the learner and no recording. Reads clean everything (a corrupt record loads as
// empty, never throws); writes are idempotent by run id; other tabs are told through the storage event.
import { safeJson, storage } from "../util.js";
import { cleanRecords, MAX_RECORDS } from "./Evidence.js";

export const ARCADE_KEY = "accessPracticeLab:v1:arcade";
export const STORE_VERSION = 1;
export const MAX_HISTORY = 80;
export const GAME_IDS = Object.freeze(["lexicon-tower-defense", "syntax-odyssey", "arena-blitz"]);

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

export const defaultSettings = () => ({ reducedMotion: null, reducedEffects: false, calm: false, bigTargets: false, fontScale: 1, mode: "classic", lastBand: "", lastLevel: 0, lastGradeFocus: "", fps: 0 });
export const emptyArcade = () => ({ v: STORE_VERSION, settings: defaultSettings(), games: {}, saves: {}, history: [], evidence: [], achievements: [], cosmetics: [] });

export const saveKey = (gameId, band) => `${gameId}:${band}`;

function cleanGame(g) {
  const o = isObject(g) ? g : {};
  return {
    best: num(o.best), bestEarned: num(o.bestEarned), runs: Math.max(0, num(o.runs)),
    completed: Array.isArray(o.completed) ? [...new Set(o.completed.map(String))].slice(0, 60) : [],
    unlocked: Array.isArray(o.unlocked) ? [...new Set(o.unlocked.map(String))].slice(0, 60) : [],
    avatar: typeof o.avatar === "string" ? o.avatar.slice(0, 40) : "",
    podium: Math.max(0, num(o.podium)),
  };
}

export function cleanArcade(raw) {
  const out = emptyArcade();
  if (!isObject(raw)) return out;
  const s = isObject(raw.settings) ? raw.settings : {};
  out.settings = {
    ...defaultSettings(),
    reducedMotion: typeof s.reducedMotion === "boolean" ? s.reducedMotion : null,
    reducedEffects: Boolean(s.reducedEffects), calm: Boolean(s.calm), bigTargets: Boolean(s.bigTargets),
    fontScale: Math.min(1.6, Math.max(1, num(s.fontScale, 1))),
    mode: ["classic", "blitz", "survival"].includes(s.mode) ? s.mode : "classic",
    lastBand: typeof s.lastBand === "string" ? s.lastBand.slice(0, 4) : "",
    lastLevel: Math.min(6, Math.max(0, Math.round(num(s.lastLevel)))),
    lastGradeFocus: ["6", "7", "8"].includes(String(s.lastGradeFocus)) ? String(s.lastGradeFocus) : "",
    fps: Math.max(0, num(s.fps)),
  };
  for (const [id, g] of Object.entries(isObject(raw.games) ? raw.games : {})) if (GAME_IDS.includes(id)) out.games[id] = cleanGame(g);
  for (const [k, snap] of Object.entries(isObject(raw.saves) ? raw.saves : {})) {
    if (isObject(snap) && snap.v === 1 && typeof snap.gameId === "string" && typeof snap.savedAt === "string") out.saves[k] = snap;
  }
  out.history = (Array.isArray(raw.history) ? raw.history : [])
    .filter((h) => isObject(h) && typeof h.runId === "string" && typeof h.game === "string")
    .map((h) => ({ runId: h.runId, game: h.game, band: String(h.band || ""), level: num(h.level), mode: String(h.mode || ""), at: String(h.at || ""), shards: num(h.shards), questions: num(h.questions), firstTry: num(h.firstTry), independent: num(h.independent), won: h.won === true, place: num(h.place) }))
    .slice(-MAX_HISTORY);
  out.evidence = cleanRecords(raw.evidence);
  out.achievements = Array.isArray(raw.achievements) ? [...new Set(raw.achievements.map(String))].slice(0, 80) : [];
  out.cosmetics = Array.isArray(raw.cosmetics) ? [...new Set(raw.cosmetics.map(String))].slice(0, 80) : [];
  return out;
}

export function loadArcade(read = (k) => storage.get(k)) {
  return cleanArcade(safeJson(read(ARCADE_KEY), null));
}

export function saveArcade(doc, write = (k, v) => storage.set(k, v)) {
  doc.history = doc.history.slice(-MAX_HISTORY);
  doc.evidence = doc.evidence.slice(-MAX_RECORDS);
  const saves = Object.entries(doc.saves);
  if (saves.length > 12) doc.saves = Object.fromEntries(saves.sort((a, b) => String(b[1].savedAt).localeCompare(String(a[1].savedAt))).slice(0, 12));
  return write(ARCADE_KEY, JSON.stringify(doc));
}

export const validArcade = (doc) => isObject(doc) && doc.v === STORE_VERSION && isObject(doc.games) && Array.isArray(doc.history);

/** Union for a backup import: this device's bests, settings and saves win; history and evidence merge by id. */
export function mergeArcade(local, incoming) {
  const a = cleanArcade(local);
  const b = cleanArcade(incoming);
  const games = { ...b.games };
  for (const [id, g] of Object.entries(a.games)) {
    const o = games[id];
    games[id] = o ? { ...g, best: Math.max(g.best, o.best), bestEarned: Math.max(g.bestEarned, o.bestEarned), runs: Math.max(g.runs, o.runs), completed: [...new Set([...g.completed, ...o.completed])], unlocked: [...new Set([...g.unlocked, ...o.unlocked])], podium: Math.max(g.podium, o.podium), avatar: g.avatar || o.avatar } : g;
  }
  const seen = new Set(a.history.map((h) => h.runId));
  const history = [...a.history, ...b.history.filter((h) => !seen.has(h.runId))].sort((x, y) => String(x.at).localeCompare(String(y.at)));
  const eseen = new Set(a.evidence.map((r) => `${r.id}|${r.at}`));
  const evidence = [...a.evidence, ...b.evidence.filter((r) => !eseen.has(`${r.id}|${r.at}`))].sort((x, y) => String(x.at).localeCompare(String(y.at)));
  return { v: STORE_VERSION, settings: a.settings, games, saves: { ...b.saves, ...a.saves }, history: history.slice(-MAX_HISTORY), evidence: evidence.slice(-MAX_RECORDS), achievements: [...new Set([...a.achievements, ...b.achievements])], cosmetics: [...new Set([...a.cosmetics, ...b.cosmetics])] };
}

// ── operations (each loads fresh so two tabs never overwrite each other with a stale copy) ──
function update(fn, { read, write } = {}) {
  const doc = loadArcade(read);
  fn(doc);
  saveArcade(doc, write);
  return doc;
}
export const saveSettings = (patch, io) => update((d) => { d.settings = cleanArcade({ ...d, settings: { ...d.settings, ...patch } }).settings; }, io).settings;
export const saveRun = (snapshot, io) => update((d) => { d.saves[saveKey(snapshot.gameId, snapshot.band)] = snapshot; }, io);
export const loadRun = (gameId, band, io = {}) => loadArcade(io.read).saves[saveKey(gameId, band)] || null;
export const clearRun = (gameId, band, io) => update((d) => { delete d.saves[saveKey(gameId, band)]; }, io);

/**
 * Record a finished run. Idempotent: the same runId never counts twice (a reload on the results screen,
 * or two tabs, cannot double a personal best or the evidence).
 */
export function recordRun(results, { won = false, place = 0, completedLevel = "", unlock = [] } = {}, io) {
  return update((d) => {
    if (d.history.some((h) => h.runId === results.runId)) return;
    const g = (d.games[results.game] ||= cleanGame({}));
    g.runs += 1;
    g.best = Math.max(g.best, results.shards);
    g.bestEarned = Math.max(g.bestEarned, results.earned);
    if (completedLevel && !g.completed.includes(completedLevel)) g.completed.push(completedLevel);
    for (const u of unlock) if (!g.unlocked.includes(u)) g.unlocked.push(u);
    if (place === 1) g.podium += 1;
    d.history.push({ runId: results.runId, game: results.game, band: results.band, level: results.level, mode: results.mode, at: new Date().toISOString(), shards: results.shards, questions: results.questions, firstTry: results.evidence.firstAttemptCorrect, independent: results.evidence.independent, won, place });
    d.evidence.push(...cleanRecords(results.records));
    delete d.saves[saveKey(results.game, results.band)];
  }, io);
}

/** Subscribe to changes from another tab. Returns an unsubscribe function. */
export function watchArcade(onChange) {
  if (typeof window === "undefined") return () => {};
  const h = (e) => { if (e.key === ARCADE_KEY) onChange(loadArcade()); };
  window.addEventListener("storage", h);
  return () => window.removeEventListener("storage", h);
}

/** Recommendations for the hub, from real stored evidence only. Empty when there is nothing to base them on. */
export function recommendations(doc, { band = "" } = {}) {
  const out = [];
  const saves = Object.values(doc.saves).filter((s) => !band || s.band === band).sort((x, y) => String(y.savedAt).localeCompare(String(x.savedAt)));
  if (saves[0]) out.push({ kind: "continue", game: saves[0].gameId, band: saves[0].band });
  const recent = doc.evidence.filter((r) => !band || r.band === band).slice(-60);
  const fam = {};
  for (const r of recent) { const f = (fam[r.family] ||= { n: 0, ind: 0 }); f.n += 1; if (r.outcome === "independent") f.ind += 1; }
  const weak = Object.entries(fam).filter(([, f]) => f.n >= 3 && f.ind / f.n < 0.5).sort((x, y) => x[1].ind / x[1].n - y[1].ind / y[1].n)[0];
  if (weak) out.push({ kind: "practice", family: weak[0] });
  const miss = recent.filter((r) => r.misconception).slice(-1)[0];
  if (miss) out.push({ kind: "review", family: miss.family, note: miss.misconception });
  const strong = Object.entries(fam).filter(([, f]) => f.n >= 4 && f.ind / f.n >= 0.8)[0];
  if (strong) out.push({ kind: "challenge", family: strong[0] });
  const played = new Set(doc.history.map((h) => h.game));
  const other = GAME_IDS.find((g) => !played.has(g));
  if (other && played.size) out.push({ kind: "different", game: other });
  return out;
}

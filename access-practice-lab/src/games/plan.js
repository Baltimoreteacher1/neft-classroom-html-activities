// Pure planning logic for the Language Game Studio: filters, "what next" recommendations from observed
// practice, achievements, pathway progress and the support-mode suggestion. No DOM, no storage: the
// hub and the tests both call these.
import { ACHIEVEMENTS, GAMES, GAME, PATHWAYS } from "./registry.js";
import { summarizeRounds } from "./state.js";

export const bandOk = (g, band) => Boolean(g.obj[band]);

/** Filters come from the hub URL: skill, klu, diff, minutes, support is a play setting not a filter. */
export function filterGames(q = {}, band = "6-8") {
  return GAMES.filter((g) => bandOk(g, band))
    .filter((g) => !q.skill || q.skill === "all" || g.skill === q.skill || g.skills.includes(q.skill))
    .filter((g) => !q.klu || q.klu === "all" || g.klu.includes(q.klu))
    .filter((g) => !q.diff || q.diff === "all" || g.difficulty === Number(q.diff))
    .filter((g) => !q.min || q.min === "all" || g.minutes <= Number(q.min))
    .filter((g) => !q.home || g.home);
}

export const playsOf = (games, id, band) => games.history.filter((h) => h.game === id && (!band || h.band === band));
export const lastPlay = (games, id, band) => playsOf(games, id, band).slice(-1)[0] || null;
export const inProgress = (games, band) =>
  Object.values(games.sessions).filter((s) => s.band === band && ["play", "transfer"].includes(s.phase) && GAME[s.game]).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

/**
 * Recommend up to `n` games from what the learner has actually done. Reasons are observations, never
 * predictions: skills never played, a game that needed lots of hints last time, a skill whose recent
 * games were all first-try (a stretch), or a gentle first game when there is no history.
 * `focus` is an optional skill list (the lab's own focus areas from the evidence ledger).
 */
export function recommend(games, band, { n = 3, focus = [] } = {}) {
  const pool = GAMES.filter((g) => bandOk(g, band));
  const history = games.history.filter((h) => h.band === band);
  if (!history.length) {
    const first = ["vocab-quest", "read-along-theater", "word-bingo", "sound-word-studio"].map((id) => GAME[id]).filter(Boolean);
    return first.slice(0, n).map((g, i) => ({ game: g.id, why: [i === 0 ? "A gentle first game: match words to pictures and meanings." : "No games played yet. This one starts with listening and reading.", i === 0 ? "Un primer juego amable: une palabras con imágenes y significados." : "Aún no hay juegos jugados. Este empieza con escuchar y leer."], kind: "start" }));
  }
  const bySkill = (skill) => history.filter((h) => GAME[h.game]?.skills.includes(skill));
  const out = [];
  const add = (id, why, kind) => { if (id && !out.some((r) => r.game === id) && GAME[id] && bandOk(GAME[id], band)) out.push({ game: id, why, kind }); };
  // 1. a game that needed the most help last time: replay it with a little less
  const helped = [...history].reverse().find((h) => h.rounds && h.hints / h.rounds >= 1 && h.support !== "A");
  if (helped) add(helped.game, ["Last time this game needed several hints. Replay it: the rounds are mixed up differently.", "La última vez este juego necesitó varias pistas. Vuelve a jugarlo: las rondas cambian."], "replay");
  // 2. skills with no game yet (Speaking and Listening are the usual gaps)
  for (const skill of ["Speaking", "Listening", "Writing", "Reading"]) {
    if (!bySkill(skill).length) {
      const g = pool.filter((x) => x.skills.includes(skill)).sort((a, b) => a.difficulty - b.difficulty)[0];
      add(g?.id, [`You have not played a ${skill} game yet.`, `Aún no has jugado un juego de ${{ Speaking: "hablar", Listening: "escuchar", Writing: "escribir", Reading: "leer" }[skill]}.`], "new-skill");
    }
  }
  // 3. the lab's own focus areas (from the evidence ledger), when given
  for (const skill of focus) {
    const g = pool.filter((x) => x.skills.includes(skill) && !history.some((h) => h.game === x.id)).sort((a, b) => a.difficulty - b.difficulty)[0];
    add(g?.id, [`Your recent ${skill} work suggests more practice here.`, `Tu trabajo reciente de ${skill} sugiere más práctica aquí.`], "focus");
  }
  // 4. a stretch: finished on Expanding with few hints -> a harder game
  const strong = [...history].reverse().find((h) => h.support === "C" && h.rounds && h.hints <= 1);
  if (strong) add(pool.filter((g) => g.difficulty >= GAME[strong.game].difficulty && g.id !== strong.game && !history.some((h) => h.game === g.id))[0]?.id, ["You finished a game on your own. Try a bigger challenge.", "Terminaste un juego por tu cuenta. Prueba un reto mayor."], "stretch");
  // 5. anything not yet played, then the least recently played
  for (const g of pool) if (!history.some((h) => h.game === g.id)) add(g.id, ["A game you have not tried yet.", "Un juego que aún no has probado."], "new");
  for (const g of [...pool].sort((a, b) => String(lastPlay(games, a.id, band)?.at || "").localeCompare(String(lastPlay(games, b.id, band)?.at || "")))) add(g.id, ["It has been a while. Play it again for fresh rounds.", "Hace tiempo. Juégalo otra vez con rondas nuevas."], "again");
  return out.slice(0, n);
}

/** Which support mode to suggest next, from the last finished session of this game. Never a level. */
export function suggestSupport(rounds, support) {
  const s = summarizeRounds(rounds);
  if (!s.total) return null;
  const rate = s.firstTry / s.total;
  if (support !== "C" && rate >= 0.8 && s.hints <= Math.ceil(s.total / 4)) return { to: support === "A" ? "B" : "C", kind: "up" };
  if (support !== "A" && rate < 0.4) return { to: support === "C" ? "B" : "A", kind: "down" };
  return { to: support, kind: "stay" };
}

/** New achievements earned by this finished session (ids not already in `have`). */
export function newAwards({ session, history, have = [], pathwayDone = false }) {
  const got = new Set(have);
  const fresh = [];
  const give = (id) => { if (!got.has(id)) { got.add(id); fresh.push(id); } };
  const s = summarizeRounds(session.rounds || []);
  give("first-game");
  if (session.rounds?.some((r) => r.evidence && r.ok)) give("evidence-finder");
  if (s.revised >= 3) give("careful-reviser");
  if (session.support === "C" && s.total && s.hints === 0 && !(session.supportsUsed || []).length) give("independent-builder");
  if (session.transfer?.saved && session.transfer.text.trim().split(/\s+/).filter(Boolean).length >= 6) give("transfer-writer");
  const skills = new Set([...history, { game: session.game }].flatMap((h) => GAME[h.game]?.skills || []));
  if (["Listening", "Reading", "Speaking", "Writing"].every((k) => skills.has(k))) give("four-skills");
  if (pathwayDone) give("pathway-complete");
  return fresh;
}

export function pathwayProgress(games, ids, band) {
  const done = ids.filter((id) => playsOf(games, id, band).length > 0);
  const next = ids.find((id) => !done.includes(id)) || null;
  return { done, next, total: ids.length, complete: done.length === ids.length };
}
export const PATHWAY = Object.fromEntries(PATHWAYS.map((p) => [p.id, p]));

/** `?path=a,b,c` -> clean list of known ids. */
export const parsePath = (value) => String(value || "").split(",").map((s) => s.trim()).filter((id) => GAME[id]).slice(0, 12);
export function nextInPath(ids, current) {
  const i = ids.indexOf(current);
  return i >= 0 && i + 1 < ids.length ? ids[i + 1] : null;
}

// Plans a family session: 5, 10 or 15 minutes of activities picked from the learner's record, budgeted from each
// game's honest seconds-per-round, plus a compact URL-safe code so a plan can be shared and reopened.
// Deterministic: the seed only breaks ties between equally ranked candidates. @fm2 FM-003 FM-004 FM-005 FM-030
import { covers } from "./inventory.js";
import { candidates, sortCandidates } from "./recommend.js";
import { seedFrom } from "./rng.js";

export const DUEL_ID = "family-math-duel";
export const TRANSITION_SEC = 15;
export const MINUTE_CHOICES = [5, 10, 15];
export const WINDOW = [0.85, 1.05];
export const ROUNDS = [2, 6];
export const MAX_ACTIVITIES = 20;
const TARGET = 0.95;

const ROLE_PLAN = {
  solo: { 5: ["warmup", "main"], 10: ["warmup", "main", "stretch"], 15: ["warmup", "main", "main", "stretch"] },
  together: { 5: ["warmup", "together"], 10: ["warmup", "main", "together"], 15: ["warmup", "main", "stretch", "together"] },
};
const PREFERENCE = {
  warmup: ["review", "prior", "fresh", "weak", "stretch"],
  main: ["weak", "review", "prior", "fresh", "stretch"],
  stretch: ["stretch", "fresh", "weak", "review", "prior"],
  together: ["fresh", "review", "prior", "stretch", "weak"],
};

export const REFLECTIONS = [
  { en: "Which activity felt best today, and what helped you? Which part would you like to try again?", es: "¿Qué actividad les gustó más hoy y qué les ayudó? ¿Qué parte quieren volver a intentar?" },
  { en: "Tell each other one thing you figured out today. How did you figure it out?", es: "Cuéntense una cosa que descubrieron hoy. ¿Cómo la descubrieron?" },
  { en: "Where did we get stuck today, and what did we try? What would we try next time?", es: "¿En qué nos atascamos hoy y qué probamos? ¿Qué probaríamos la próxima vez?" },
  { en: "Pick one problem from today and explain it to someone who was not here.", es: "Elijan un problema de hoy y explíquenlo como si lo oyera alguien que no estuvo aquí." },
  { en: "Where did we see math today that is also in our home or neighborhood?", es: "¿Dónde vimos hoy matemáticas que también hay en nuestra casa o en el barrio?" },
  { en: "What is one question we still have about today's math? Let's write it down for next time.", es: "¿Qué pregunta nos queda sobre las matemáticas de hoy? Anotémosla para la próxima vez." },
];

const roundTo = (value) => Math.round(value);
export const estFor = (game, rounds) => roundTo(rounds * game.secPerRound + TRANSITION_SEC);
const nearestMinutes = (minutes) => MINUTE_CHOICES.reduce((best, m) => (Math.abs(m - minutes) < Math.abs(best - minutes) ? m : best), 10);
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const lessThan = (a, b) => {
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
};

// Pick rounds (2-6 each, widening to 1-8 only when no plan fits) whose total lands closest to 95% of the minutes.
function solveRounds(sprs, budget) {
  const lo = WINDOW[0] * budget;
  const hi = WINDOW[1] * budget;
  const target = TARGET * budget;
  const search = (min, max) => {
    let best = null;
    const walk = (index, picked, total) => {
      if (index === sprs.length) {
        const mean = picked.reduce((a, b) => a + b, 0) / picked.length;
        const spread = picked.reduce((a, r) => a + (r - mean) ** 2, 0);
        const inside = total >= lo && total <= hi;
        const cost = [inside ? 0 : 1, Math.abs(total - target), spread];
        if (!best || lessThan(cost, best.cost)) best = { rounds: [...picked], cost, inside };
        return;
      }
      for (let r = min; r <= max; r += 1) walk(index + 1, [...picked, r], total + r * sprs[index] + TRANSITION_SEC);
    };
    walk(0, [], 0);
    return best;
  };
  const tight = search(ROUNDS[0], ROUNDS[1]);
  if (tight?.inside) return tight.rounds;
  return search(1, 8).rounds;
}

function feasible(chosen, remaining, spr, budget) {
  const sprs = chosen.map((c) => c.game.secPerRound);
  const min = sprs.reduce((a, s) => a + ROUNDS[0] * s + TRANSITION_SEC, 0) + remaining * (ROUNDS[0] * spr.min + TRANSITION_SEC);
  const max = sprs.reduce((a, s) => a + ROUNDS[1] * s + TRANSITION_SEC, 0) + remaining * (ROUNDS[1] * spr.max + TRANSITION_SEC);
  return min <= WINDOW[1] * budget && max >= WINDOW[0] * budget;
}

export function planSession({ grade, minutes = 10, mode = "solo", state = null, games = [], now = Date.now(), seed = 0 }) {
  const g = Math.min(8, Math.max(0, Math.round(Number(grade)) || 0));
  const mins = nearestMinutes(minutes);
  const kind = mode === "together" ? "together" : "solo";
  const budget = mins * 60;
  const pool = (games || []).filter((game) => (game.skills || []).some((s) => covers(s, g)));
  const base = { grade: g, minutes: mins, mode: kind, activities: [], estSec: 0, reflection: null };
  if (!pool.length) return base;

  const tieHash = (e) => seedFrom(seed, e.gameId, e.skillId);
  const tie = (a, b) => tieHash(a) - tieHash(b) || cmp(a.gameId, b.gameId) || cmp(a.skillId, b.skillId);
  const raw = candidates({ state, grade: g, games: pool, now });
  const lists = Object.fromEntries(Object.entries(raw).map(([name, list]) => [name, sortCandidates(list, tie)]));
  const filler = pool.flatMap((game) => (game.skills || []).filter((s) => covers(s, g)).map((skill) => ({ gameId: game.id, skillId: skill.id, game, skill, level: g > skill.grades[0] ? 2 : 1, reason: "new", key: [9] })));
  lists.filler = sortCandidates(filler, tie);

  const roles = ROLE_PLAN[kind][mins];
  const spr = { min: Math.min(...pool.map((x) => x.secPerRound)), max: Math.max(...pool.map((x) => x.secPerRound)) };
  const distinct = pool.length >= roles.length;
  const duel = kind === "together" ? pool.find((x) => x.id === DUEL_ID) : null;
  const used = new Set();
  const taken = new Set();
  const picks = [];

  const choose = (role, order, restrictTo) => {
    const sequence = [...order.flatMap((name) => lists[name]), ...lists.filler].filter((e) => !restrictTo || e.gameId === restrictTo);
    const open = sequence.filter((e) => !taken.has(`${e.gameId}:${e.skillId}`) && (!distinct || !used.has(e.gameId)) && !(duel && e.gameId === DUEL_ID && role !== "together"));
    const slotsLeft = roles.length - picks.length - 1;
    const pick = open.find((e) => feasible([...picks, e], slotsLeft, spr, budget)) || open[0] || sequence.find((e) => !taken.has(`${e.gameId}:${e.skillId}`));
    if (!pick) return null;
    taken.add(`${pick.gameId}:${pick.skillId}`);
    used.add(pick.gameId);
    const level = role === "warmup" ? (pick.reason === "new" ? 1 : Math.min(pick.level, 2)) : pick.level;
    const entry = { ...pick, role, level };
    picks.push(entry);
    return entry;
  };

  const slots = roles.map(() => null);
  if (duel) slots[roles.length - 1] = choose("together", PREFERENCE.together, DUEL_ID);
  roles.forEach((role, i) => {
    if (slots[i]) return;
    slots[i] = choose(role, PREFERENCE[role] || PREFERENCE.main);
  });
  const chosen = slots.filter(Boolean);
  const rounds = solveRounds(chosen.map((c) => c.game.secPerRound), budget);
  const activities = chosen.map((c, i) => ({ gameId: c.gameId, skillId: c.skillId, level: c.level, rounds: rounds[i], role: c.role, estSec: estFor(c.game, rounds[i]) }));
  const reflection = mins === 15 ? REFLECTIONS[seedFrom("reflect", seed, g, mins) % REFLECTIONS.length] : null;
  return { ...base, activities, estSec: activities.reduce((sum, a) => sum + a.estSec, 0), reflection };
}

const dayOf = (now) => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// The home page's "today" mission: a ten-minute session that is the same all day for the same learner and record.
export function dailyMission({ grade, state, games, now = Date.now(), mode = "solo", seed } = {}) {
  const day = dayOf(now);
  const plan = planSession({ grade, minutes: 10, mode, state, games, now, seed: seed ?? seedFrom(day, grade, mode) });
  const lead = plan.activities.find((a) => a.role === "main") || plan.activities[0];
  const skill = (games || []).find((x) => x.id === lead?.gameId)?.skills.find((s) => s.id === lead.skillId);
  const strand = skill?.strand || { en: "math", es: "matemáticas" };
  return { ...plan, day, daily: true, title: { en: `Today's family math mission: ${strand.en}`, es: `Misión de matemáticas en familia de hoy: ${strand.es}` } };
}

// ---- sharing: "1~g3~m10~s~game_skill_level_rounds_role~...~r2" -------------------------------------------------
const ROLE_CODE = { warmup: "w", main: "m", stretch: "s", together: "t" };
const CODE_ROLE = Object.fromEntries(Object.entries(ROLE_CODE).map(([role, code]) => [code, role]));
const ID = /^[a-z][a-z0-9-]{1,40}$/;
export const MAX_CODE_LENGTH = 1200;

export function encodePlan(plan) {
  const head = ["1", `g${plan.grade}`, `m${plan.minutes}`, plan.mode === "together" ? "t" : "s"];
  const parts = plan.activities.map((a) => {
    if (!ID.test(a.gameId) || !ID.test(a.skillId) || !ROLE_CODE[a.role]) throw new RangeError("Plan cannot be encoded");
    return [a.gameId, a.skillId, a.level, a.rounds, ROLE_CODE[a.role]].join("_");
  });
  const index = plan.reflection ? REFLECTIONS.findIndex((r) => r.en === plan.reflection.en) : -1;
  return [...head, ...parts, ...(index >= 0 ? [`r${index}`] : [])].join("~");
}

export function decodePlan(text, games) {
  if (typeof text !== "string" || text.length < 10 || text.length > MAX_CODE_LENGTH || !/^[A-Za-z0-9_~-]+$/.test(text) || !Array.isArray(games)) return null;
  const parts = text.split("~");
  const [version, g, m, mode, ...rest] = parts;
  if (version !== "1" || !/^g[0-8]$/.test(g) || !/^m(5|10|15)$/.test(m) || !/^[st]$/.test(mode)) return null;
  let reflection = null;
  if (rest.length && /^r\d{1,2}$/.test(rest[rest.length - 1])) {
    const index = Number(rest.pop().slice(1));
    if (index >= REFLECTIONS.length) return null;
    reflection = REFLECTIONS[index];
  }
  if (!rest.length || rest.length > MAX_ACTIVITIES) return null;
  const byId = new Map(games.map((game) => [game.id, game]));
  const activities = [];
  for (const piece of rest) {
    const fields = piece.split("_");
    if (fields.length !== 5) return null;
    const [gameId, skillId, level, rounds, role] = fields;
    const game = byId.get(gameId);
    if (!game || !(game.skills || []).some((s) => s.id === skillId)) return null;
    if (!/^[1-3]$/.test(level) || !/^[1-8]$/.test(rounds) || !CODE_ROLE[role]) return null;
    activities.push({ gameId, skillId, level: Number(level), rounds: Number(rounds), role: CODE_ROLE[role], estSec: estFor(game, Number(rounds)) });
  }
  return { grade: Number(g.slice(1)), minutes: Number(m.slice(1)), mode: mode === "t" ? "together" : "solo", activities, estSec: activities.reduce((sum, a) => sum + a.estSec, 0), reflection };
}

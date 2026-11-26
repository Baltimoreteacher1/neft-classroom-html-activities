// Communication Consequence Engine (pure, DOM-free). A learner builds a sentence from authored tiles; the engine
// turns that STRUCTURE into a deterministic consequence: a literal robot moves exactly as told, a scientist asks
// for a clearer cause, a council member asks for evidence instead of opinion. Nothing here reads free text: a
// typed sentence is saved by the view and never interpreted. No scores, timers or levels: an outcome is a story
// consequence plus a revision prompt.
//
// Scenario shape (src/consequence/scenarios/*.js):
//   { id, title, summary, character: { name, role, look }, standards: { "3-5": [ids], "6-8": [ids] },
//     keyUse, feature: [en, es], rounds: [Round] }
//   Round: { id, kind: "talk" | "path" | "point" | "pick", situation, frame: "Move {n1} units {d1}.",
//            slots: [{ id, label, options: [Option] }], bank: [[en, es]], tip, success, ...kind fields }
//   Option: { id, text: [en, es] (en is the target English tile, es a gloss), value?, tags?, ref?, vague? }
// Text is always [English, Spanish].

export const STORAGE_KEY = "accessPracticeLab:v1:consequence";
export const FADE_AFTER = 2; // independent successes before frames and word banks fold behind "Show help"
export const KINDS = ["talk", "path", "point", "pick"];

/** Status chips the consequence panel shows (meaning is in the words, never the colour). */
export const STATUS = Object.freeze({
  literal: ["Did exactly what you said", "Hizo exactamente lo que dijiste"],
  stuck: ["Cannot follow that", "No puede seguir eso"],
  clarify: ["Asks you to clarify", "Te pide que aclares"],
  evidence: ["Asks for evidence", "Pide evidencia"],
  data: ["Checks the data", "Revisa los datos"],
  connect: ["Asks how the ideas connect", "Pregunta cómo se conectan las ideas"],
  done: ["It worked", "Funcionó"],
});

const DIRS = { E: [1, 0], W: [-1, 0], N: [0, 1], S: [0, -1] };
const SLOT_RE = /\{(\w+)\}/g;

export const slotIdsOf = (round) => [...round.frame.matchAll(SLOT_RE)].map((m) => m[1]);
const optionOf = (round, slotId, optionId) =>
  round.slots.find((s) => s.id === slotId)?.options.find((o) => o.id === optionId) || null;
// A var may be one value or [en, es] when the filled word differs by language.
const fill = (pair, vars) =>
  pair.map((t, i) =>
    String(t).replace(SLOT_RE, (m, k) => (k in vars ? String(Array.isArray(vars[k]) ? vars[k][i] : vars[k]) : m)),
  );

/** The learner's sentence so far, in target English, with ___ for each empty blank. */
export function compose(round, choice = {}) {
  const missing = [];
  const text = round.frame.replace(SLOT_RE, (m, id) => {
    const opt = optionOf(round, id, choice[id]);
    if (!opt) missing.push(id);
    return opt ? opt.text[0] : "___";
  });
  return { text, missing, complete: missing.length === 0 };
}

/** Every possible tile combination of a round (used by the tests and the guessing bound). */
export function* allChoices(round) {
  const ids = slotIdsOf(round);
  const walk = function* (i, acc) {
    if (i === ids.length) return yield { ...acc };
    for (const o of round.slots.find((s) => s.id === ids[i]).options)
      yield* walk(i + 1, { ...acc, [ids[i]]: o.id });
  };
  yield* walk(0, {});
}

// ── talk rounds: ordered rules over the chosen tiles ───────────────────────────
// A predicate: { slot, is: [ids] } | { slot, has: tag } | { link: [slotA, slotB] } (same `ref`), with an optional
// `not: true`. "@round.slot" inside `is`/`has` reads the option id the learner used to pass an earlier round.
const fromMemory = (value, memory) => {
  if (typeof value !== "string" || !value.startsWith("@")) return value;
  const [roundId, slotId] = value.slice(1).split(".");
  return memory?.[roundId]?.[slotId];
};
function holds(pred, round, choice, memory) {
  let result;
  if (pred.link) {
    const [a, b] = pred.link.map((id) => optionOf(round, id, choice[id]));
    result = Boolean(a?.ref && a.ref === b?.ref);
  } else {
    const opt = optionOf(round, pred.slot, choice[pred.slot]);
    if (pred.is) result = pred.is.map((v) => fromMemory(v, memory)).includes(opt?.id);
    else result = Boolean(opt?.tags?.includes(fromMemory(pred.has, memory)));
  }
  return pred.not ? !result : result;
}

function judgeTalk(round, choice, memory) {
  // "@<this round>.<slot>" reads the current choice, so one tile can be checked against another in the same round.
  const mem = { ...memory, [round.id]: choice };
  const rule = round.rules.find((r) => (r.when || []).every((p) => holds(p, round, choice, mem)));
  return {
    ok: Boolean(rule.ok),
    outcome: rule.ok ? "success" : rule.status === "stuck" ? "vague" : "miss",
    say: rule.ok ? rule.say || round.success : rule.say,
    revise: rule.ok ? null : rule.revise,
    status: rule.ok ? "done" : rule.status,
    mood: rule.mood || (rule.ok ? "happy" : "puzzled"),
    scene: { kind: "talk" },
  };
}

// ── robot rounds: the robot does exactly what the words say ──────────────────────
const vagueTile = (round, choice) =>
  slotIdsOf(round)
    .map((id) => optionOf(round, id, choice[id]))
    .find((o) => o?.vague);

/** Walk a list of [count, direction] moves one square at a time; stop at the edge of the grid. */
export function walk(start, moves, grid) {
  const path = [start.slice()];
  let [x, y] = start;
  for (const [count, dir] of moves) {
    const [dx, dy] = DIRS[dir];
    for (let i = 0; i < count; i += 1) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= grid.w || ny >= grid.h)
        return { path, end: [x, y], edge: true };
      x = nx;
      y = ny;
      path.push([x, y]);
    }
  }
  return { path, end: [x, y], edge: false };
}

const at = (items, [x, y]) => items.find((d) => d.at[0] === x && d.at[1] === y) || null;

function robotMiss(round, key, vars, scene) {
  const m = round.misses[key];
  return {
    ok: false,
    outcome: key === "vague" ? "vague" : "miss",
    say: fill(m.say, vars),
    revise: fill(m.revise, vars),
    status: key === "vague" ? "stuck" : "literal",
    mood: "puzzled",
    scene,
  };
}

function judgeRobot(round, choice) {
  const vague = vagueTile(round, choice);
  const base = {
    kind: round.kind,
    grid: round.grid,
    start: round.start,
    target: round.target,
    items: round.items,
  };
  if (vague) {
    const stay =
      round.kind === "pick"
        ? { ...base, picked: null }
        : { ...base, path: [round.start], end: round.start };
    return { ...robotMiss(round, "vague", { word: vague.text[0] }, stay), say: vague.vague };
  }
  const val = (id) => optionOf(round, id, choice[id]).value;
  if (round.kind === "pick") {
    const row = val(round.pick.row);
    const n = val(round.pick.ord);
    const col = val(round.pick.side) === "right" ? round.grid.w - n + 1 : n;
    const picked = [col, row];
    const scene = { ...base, picked };
    const item = at(round.items, picked)?.label || ["an empty spot", "un lugar vacío"];
    const [tc, tr] = round.target;
    if (col === tc && row === tr) return success(round, scene);
    const key = col !== tc && row !== tr ? "both" : row !== tr ? "y" : "x";
    return robotMiss(round, key, { item }, scene);
  }
  const moves =
    round.kind === "point"
      ? [
          [val(round.point.x), "E"],
          [val(round.point.y), "N"],
        ]
      : round.moves.map(([c, d]) => [val(c), val(d)]);
  const { path, end, edge } = walk(round.start, moves, round.grid);
  const scene = { ...base, path, end };
  const [tx, ty] = round.target;
  if (!edge && end[0] === tx && end[1] === ty) return success(round, scene);
  const found = at(round.items, end);
  const vars = { x: end[0], y: end[1] };
  let key = edge ? "edge" : end[0] !== tx && end[1] !== ty ? "both" : end[0] !== tx ? "x" : "y";
  if (!edge && round.misses.swapped && end[0] === ty && end[1] === tx) key = "swapped";
  const out = robotMiss(round, key, vars, scene);
  if (found && !edge)
    out.say = [`${out.say[0]} ${found.note[0]}`, `${out.say[1]} ${found.note[1]}`];
  return out;
}

const success = (round, scene) => ({
  ok: true,
  outcome: "success",
  say: round.success,
  revise: null,
  status: "done",
  mood: "happy",
  scene,
});

/** The consequence of one composed sentence. `memory` holds the tiles that passed earlier rounds. */
export function evaluate(scenario, roundIndex, choice, memory = {}) {
  const round = scenario.rounds[roundIndex];
  if (!round) throw new Error(`No round ${roundIndex} in ${scenario.id}`);
  const built = compose(round, choice);
  if (!built.complete)
    return { ok: false, outcome: "incomplete", missing: built.missing, say: null, revise: null };
  const out = round.kind === "talk" ? judgeTalk(round, choice, memory) : judgeRobot(round, choice);
  return { ...out, sentence: built.text };
}

// ── validation ──────────────────────────────────────────────────────────────────
const pairOk = (p) =>
  Array.isArray(p) && p.length === 2 && p.every((t) => typeof t === "string" && t.trim());

export function validateScenario(s) {
  const errors = [];
  const need = (cond, msg) => cond || errors.push(`${s?.id || "?"}: ${msg}`);
  need(typeof s?.id === "string" && /^[a-z0-9-]+$/.test(s.id), "id must be a slug");
  for (const k of ["title", "summary", "feature"]) need(pairOk(s?.[k]), `${k} must be [en, es]`);
  need(Array.isArray(s?.rounds) && s.rounds.length >= 3, "needs at least 3 rounds");
  for (const [i, r] of (s?.rounds || []).entries()) {
    const at2 = `round ${i + 1} (${r.id})`;
    need(KINDS.includes(r.kind), `${at2}: unknown kind ${r.kind}`);
    for (const k of ["situation", "tip", "success"])
      need(pairOk(r[k]), `${at2}: ${k} must be [en, es]`);
    need(
      Array.isArray(r.bank) && r.bank.length >= 3 && r.bank.every(pairOk),
      `${at2}: word bank needs 3+ [en, es]`,
    );
    const ids = slotIdsOf(r);
    need(ids.length >= 2, `${at2}: the frame needs 2+ blanks`);
    for (const id of ids) {
      const slot = r.slots?.find((x) => x.id === id);
      need(slot, `${at2}: frame blank {${id}} has no slot`);
      if (!slot) continue;
      need(pairOk(slot.label), `${at2}: slot ${id} label must be [en, es]`);
      need(slot.options?.length >= 2, `${at2}: slot ${id} needs 2+ tiles`);
      need(
        new Set(slot.options.map((o) => o.id)).size === slot.options.length,
        `${at2}: slot ${id} repeats a tile id`,
      );
      for (const o of slot.options)
        need(pairOk(o.text), `${at2}: tile ${id}.${o.id} text must be [en, es]`);
    }
    if (r.kind === "talk") {
      const rules = r.rules || [];
      need(
        rules.some((x) => x.ok),
        `${at2}: no success rule`,
      );
      need(
        rules.length && !(rules.at(-1).when || []).length,
        `${at2}: the last rule must be a fallback (no when)`,
      );
      for (const x of rules.filter((y) => !y.ok)) {
        need(pairOk(x.say) && pairOk(x.revise), `${at2}: a miss rule needs say and revise`);
        need(STATUS[x.status], `${at2}: miss rule status ${x.status} is unknown`);
      }
    } else {
      need(
        r.grid?.w > 0 && r.grid?.h > 0 && Array.isArray(r.target),
        `${at2}: robot rounds need grid and target`,
      );
      for (const [key, m] of Object.entries(r.misses || {}))
        need(pairOk(m.say) && pairOk(m.revise), `${at2}: miss ${key} needs say and revise`);
      const keys = r.kind === "pick" ? ["x", "y", "both"] : ["x", "y", "both", "edge"];
      for (const key of keys) need(r.misses?.[key], `${at2}: missing miss text "${key}"`);
      const vagues = r.slots.flatMap((sl) => sl.options.filter((o) => o.vague));
      if (vagues.length) need(r.misses?.vague, `${at2}: vague tiles need miss text "vague"`);
      for (const o of vagues)
        need(pairOk(o.vague), `${at2}: vague tile ${o.id} needs a [en, es] reply`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ── local progress (one key; nothing leaves the device) ─────────────────────────
export const freshScenario = () => ({
  round: 0,
  attempts: {}, // roundId → tries
  helped: {}, // roundId → true when the learner opened folded help
  memory: {}, // roundId → the tiles that passed it
  said: {}, // roundId → the sentence that passed it
  own: {}, // roundId → the learner's own typed sentence (saved, never checked)
  independent: 0,
  complete: false,
});

/** Read stored progress defensively: anything malformed starts fresh. */
export function restoreProgress(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [id, sp] of Object.entries(raw)) {
    if (!sp || typeof sp !== "object") continue;
    const f = freshScenario();
    out[id] = {
      ...f,
      round: Number.isInteger(sp.round) && sp.round >= 0 ? sp.round : 0,
      independent: Number.isInteger(sp.independent) && sp.independent >= 0 ? sp.independent : 0,
      complete: sp.complete === true,
    };
    for (const k of ["attempts", "helped", "memory", "said", "own"])
      if (sp[k] && typeof sp[k] === "object" && !Array.isArray(sp[k])) out[id][k] = sp[k];
  }
  return out;
}

export const helpFolded = (sp) => (sp?.independent || 0) >= FADE_AFTER;

/** Record one attempt. Returns a new scenario-progress object (never mutates). */
export function recordAttempt(sp, scenario, result, choice) {
  const round = scenario.rounds[sp.round];
  if (!round || sp.complete || result.outcome === "incomplete") return sp;
  const tries = (sp.attempts[round.id] || 0) + 1;
  const next = { ...sp, attempts: { ...sp.attempts, [round.id]: tries } };
  if (!result.ok) return next;
  // Independent: passed on the first try, without opening help that had already folded away.
  const independent = tries === 1 && !sp.helped[round.id];
  next.memory = { ...sp.memory, [round.id]: { ...choice } };
  next.said = { ...sp.said, [round.id]: result.sentence };
  next.independent = sp.independent + (independent ? 1 : 0);
  return next;
}

/** Move past a passed round. */
export function advance(sp, scenario) {
  const round = scenario.rounds[sp.round];
  if (!round || !sp.memory[round.id]) return sp;
  const last = sp.round + 1 >= scenario.rounds.length;
  return { ...sp, round: last ? sp.round : sp.round + 1, complete: last };
}

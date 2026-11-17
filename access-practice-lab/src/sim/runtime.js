// Living Language Simulation Engine: the runtime. Pure and deterministic (no DOM, no clock, no randomness): the same
// actions on the same mission always give the same state. Only this module changes flags, the evidence inventory,
// scene access, task results, the act reached and the outcome; a character, the UI and any model can only ask it to
// act. An invalid action returns `error` and the state it was given, untouched.
//
// State = { v, mission, version, scene, visited[], path[], flags{}, evidence{ id: { scene, act, step, via,
//           supported } }, talk{ characterId: { asked[], clarified[], log[] } }, tasks{ id: result }, help{ taskId:
//           { bank, frames, words } }, decision, act, outcome, loops{ taskId: loopId }, step, complete }
// "When" a thing happened is the action count (`step`) and the act index, never wall-clock time.
// Saves: accessPracticeLab:v1:sim = { [missionId]: State } (travels in the Passport export like every such key).
import { safeJson, storage } from "../util.js";
import {
  LANGUAGE_TASKS,
  OPEN_ACTION,
  RELATIONS,
  characterOf,
  evalCond,
  evidenceOf,
  reachedAct,
  sceneOf,
  taskOf,
  topicOf,
} from "./schema.js";

export const SIM_KEY = "accessPracticeLab:v1:sim";
export const MAX_LOG = 24;
export const MAX_PATH = 60;
export const MAX_TEXT = 2000;
export const DEFAULT_MIN_WORDS = 5;
export const HELP_KINDS = Object.freeze(["bank", "frames", "words"]);
// Optional mission field `supports` (compiled experiences write it): a kind set to false is turned off for everyone.
const SUPPORT_FIELD = { bank: "wordBank", frames: "frames", words: "glossary" };
/** Whether the mission allows a help kind ("bank" | "frames" | "words"). Absent `supports` allows all. */
export const helpAllowed = (def, kind) => def.supports?.[SUPPORT_FIELD[kind]] !== false;

const words = (t) =>
  String(t || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
const clone = (v) => JSON.parse(JSON.stringify(v));
const norm = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function newState(def) {
  return {
    v: 1,
    mission: def.id,
    version: def.version,
    scene: def.start,
    visited: [def.start],
    path: [def.start],
    flags: {},
    evidence: {},
    talk: {},
    tasks: {},
    help: {},
    decision: null,
    act: 0,
    outcome: null,
    loops: {},
    step: 0,
    complete: false,
  };
}

/** A saved state for this mission and version, or a fresh one (a save from another version is not trusted). */
export function restore(def, saved) {
  const ok =
    saved &&
    typeof saved === "object" &&
    saved.v === 1 &&
    saved.mission === def.id &&
    saved.version === def.version &&
    sceneOf(def, saved.scene);
  return ok ? { ...newState(def), ...clone(saved) } : newState(def);
}

// ── what is open right now ───────────────────────────────────────────────────
/** A hotspot shows when its own condition holds and so does the condition of the thing it opens. */
function hotspotOpen(def, state, h) {
  if (!evalCond(h.requires, state, def)) return false;
  if (h.opens.task) return evalCond(taskOf(def, h.opens.task)?.requires, state, def);
  if (h.opens.scene) return evalCond(sceneOf(def, h.opens.scene)?.requires, state, def);
  return true;
}
export const hotspotsOf = (def, state, sceneId = state.scene) =>
  (sceneOf(def, sceneId)?.hotspots || []).filter((h) => hotspotOpen(def, state, h));
const opensHere = (def, state, key, id) => hotspotsOf(def, state).some((h) => h.opens[key] === id);

/** Scenes the learner knows about: visited ones, places on the mission map, and doors from visited scenes. */
export function knownScenes(def, state) {
  const known = new Set(state.visited);
  for (const m of def.map || []) known.add(m.scene);
  for (const id of state.visited)
    for (const h of sceneOf(def, id)?.hotspots || [])
      if (h.opens.scene && evalCond(h.requires, state, def)) known.add(h.opens.scene);
  return def.scenes.filter((s) => known.has(s.id)).map((s) => s.id);
}
export const sceneOpen = (def, state, id) =>
  knownScenes(def, state).includes(id) && evalCond(sceneOf(def, id)?.requires, state, def);

/** Topics of a character the learner may ask now (its condition holds). */
export const openTopics = (def, state, characterId) =>
  (characterOf(def, characterId)?.topics || []).filter((t) => evalCond(t.requires, state, def));

/** What the two pieces of evidence say about each other, from their supports/contradicts and strength. */
export function judgePair(def, aId, bId) {
  const a = evidenceOf(def, aId) || {};
  const b = evidenceOf(def, bId) || {};
  const hit = (x, y) => (x || []).some((id) => (y || []).includes(id));
  const relation =
    hit(a.supports, b.contradicts) || hit(a.contradicts, b.supports)
      ? "conflict"
      : hit(a.supports, b.supports) || hit(a.contradicts, b.contradicts)
        ? "agree"
        : "unrelated";
  const rank = (e) => (e.strength === "strong" ? 2 : 1);
  const stronger = rank(a) === rank(b) ? "same" : rank(a) > rank(b) ? aId : bId;
  return { relation, stronger };
}

/** Every action that would be accepted now. Free text, the relation and cited evidence are the learner's to add. */
export function validActions(def, state) {
  const out = [];
  for (const id of knownScenes(def, state))
    if (id !== state.scene && sceneOpen(def, state, id)) out.push({ type: "move", scene: id });
  for (const h of hotspotsOf(def, state)) {
    if (
      h.opens.scene &&
      h.opens.scene !== state.scene &&
      !out.some((a) => a.scene === h.opens.scene)
    )
      out.push({ type: "move", scene: h.opens.scene });
    if (h.opens.evidence && !state.evidence[h.opens.evidence])
      out.push({
        type: OPEN_ACTION[evidenceOf(def, h.opens.evidence).kind],
        evidence: h.opens.evidence,
      });
    if (h.opens.character) {
      const id = h.opens.character;
      const memory = state.talk[id] || { asked: [], clarified: [] };
      for (const t of openTopics(def, state, id)) {
        out.push({ type: "ask", character: id, topic: t.id });
        if (t.clarify && memory.asked.includes(t.id) && !memory.clarified.includes(t.id))
          out.push({ type: "clarify", character: id, topic: t.id });
      }
    }
    if (h.opens.task) {
      const task = taskOf(def, h.opens.task);
      const result = state.tasks[task.id];
      if (task.type === "compare") {
        if (!result?.resolved)
          task.pairs.forEach((p, i) => {
            if (p.every((e) => state.evidence[e]))
              out.push({ type: "compare", task: task.id, pair: i });
          });
      } else if (task.type === "decide") {
        if (!result?.done)
          for (const o of task.options) out.push({ type: "decide", task: task.id, option: o.id });
      } else if (!result?.done) {
        out.push({ type: "submit", task: task.id });
        if (task.type !== "transfer")
          for (const kind of HELP_KINDS)
            if (helpAllowed(def, kind) && !state.help[task.id]?.[kind]) out.push({ type: "help", task: task.id, kind });
      }
    }
  }
  return out;
}

// ── acting ───────────────────────────────────────────────────────────────────
const fail = (state, error) => ({ state, events: [], error });

function collect(def, s, ids, via, events, supported = false) {
  for (const id of ids || []) {
    if (s.evidence[id]) continue;
    s.evidence[id] = { scene: s.scene, act: s.act, step: s.step + 1, via, supported };
    events.push({ type: "evidence", evidence: id });
  }
}
const setFlags = (s, sets) => Object.assign(s.flags, sets || {});
function remember(s, characterId, entry) {
  const memory = (s.talk[characterId] ||= { asked: [], clarified: [], log: [] });
  memory.log.push({ ...entry, step: s.step + 1 });
  if (memory.log.length > MAX_LOG) memory.log.splice(0, memory.log.length - MAX_LOG);
  return memory;
}

function settle(def, s, events) {
  s.step += 1;
  const reached = reachedAct(def, s);
  if (reached > s.act) {
    s.act = reached;
    events.push({ type: "act", act: def.acts[reached]?.id || null });
  }
  const after = def.outcomeAfter
    ? def.acts.findIndex((a) => a.id === def.outcomeAfter)
    : def.acts.length - 1;
  if (!s.outcome && s.act > after) {
    const hit = def.outcomes.find(
      (o, i) => i === def.outcomes.length - 1 || evalCond(o.when, s, def),
    );
    s.outcome = hit.id;
    events.push({ type: "outcome", outcome: hit.id });
  }
  if (!s.complete && s.act >= def.acts.length) {
    s.complete = true;
    events.push({ type: "complete" });
  }
}

const HANDLERS = {
  move(def, s, a) {
    if (!sceneOf(def, a.scene)) return "unknown-scene";
    if (a.scene === s.scene) return "already-here";
    const door = hotspotsOf(def, s).some((h) => h.opens.scene === a.scene);
    if (!door && !sceneOpen(def, s, a.scene)) return "scene-locked";
    s.scene = a.scene;
    if (!s.visited.includes(a.scene)) s.visited.push(a.scene);
    s.path.push(a.scene);
    if (s.path.length > MAX_PATH) s.path.splice(0, s.path.length - MAX_PATH);
    return [{ type: "moved", scene: a.scene }];
  },
  open(def, s, a) {
    const e = evidenceOf(def, a.evidence);
    if (!e) return "unknown-evidence";
    if (OPEN_ACTION[e.kind] !== a.type) return "wrong-action";
    if (!opensHere(def, s, "evidence", e.id)) return "not-here";
    if (s.evidence[e.id]) return "already-held";
    const events = [];
    // A listen is supported when the transcript was opened before the message was added to the notebook.
    collect(def, s, [e.id], a.type, events, a.type === "listen" && Boolean(a.transcript));
    return events;
  },
  ask(def, s, a) {
    const c = characterOf(def, a.character);
    if (!c) return "unknown-character";
    if (!opensHere(def, s, "character", c.id)) return "not-here";
    if (a.topic == null) {
      remember(s, c.id, { k: "fallback" });
      return [{ type: "fallback", character: c.id }];
    }
    const t = topicOf(c, a.topic);
    if (!t) return "unknown-topic";
    if (!evalCond(t.requires, s, def)) return "topic-locked";
    const memory = remember(s, c.id, { k: "ask", t: t.id });
    const repeat = memory.asked.includes(t.id);
    const events = [{ type: "answer", character: c.id, topic: t.id, repeat }];
    if (!repeat) {
      memory.asked.push(t.id);
      collect(def, s, t.gives, `ask:${c.id}`, events);
      setFlags(s, t.sets);
    }
    return events;
  },
  clarify(def, s, a) {
    const c = characterOf(def, a.character);
    const t = topicOf(c, a.topic);
    if (!c || !t) return "unknown-topic";
    if (!opensHere(def, s, "character", c.id)) return "not-here";
    if (!t.clarify) return "no-clarification";
    const memory = s.talk[c.id];
    if (!memory?.asked.includes(t.id)) return "ask-first";
    remember(s, c.id, { k: "clarify", t: t.id });
    const repeat = memory.clarified.includes(t.id);
    const events = [{ type: "clarified", character: c.id, topic: t.id, repeat }];
    if (!repeat) {
      memory.clarified.push(t.id);
      collect(def, s, t.clarify.gives, `clarify:${c.id}`, events);
    }
    return events;
  },
  help(def, s, a) {
    const task = taskOf(def, a.task);
    if (!task || !LANGUAGE_TASKS.includes(task.type)) return "unknown-task";
    if (task.type === "transfer") return "help-closed";
    if (!HELP_KINDS.includes(a.kind)) return "unknown-help";
    if (!helpAllowed(def, a.kind)) return "help-off";
    if (s.tasks[task.id]?.done) return "already-done";
    if (!evalCond(task.requires, s, def)) return "task-locked";
    (s.help[task.id] ||= {})[a.kind] = true;
    return [{ type: "help", task: task.id, kind: a.kind }];
  },
  compare(def, s, a) {
    const task = taskOf(def, a.task);
    if (task?.type !== "compare") return "unknown-task";
    if (!opensHere(def, s, "task", task.id)) return "not-here";
    const pair = task.pairs[a.pair];
    if (!pair) return "unknown-pair";
    if (s.tasks[task.id]?.resolved) return "already-resolved";
    if (!pair.every((e) => s.evidence[e])) return "evidence-missing";
    if (!RELATIONS.includes(a.relation)) return "choose-relation";
    if (![...pair, "same"].includes(a.stronger)) return "choose-stronger";
    if (words(a.reason) < 2) return "reason-needed";
    const truth = task.answers?.[a.pair] || judgePair(def, pair[0], pair[1]);
    const relationRight = a.relation === truth.relation;
    const strongerRight = a.stronger === truth.stronger;
    const result = (s.tasks[task.id] ||= { done: true, resolved: false, tries: 0, pairs: {} });
    result.tries += 1;
    result.pairs[a.pair] = {
      relation: a.relation,
      stronger: a.stronger,
      right: relationRight && strongerRight,
    };
    result.reason = String(a.reason).slice(0, 300);
    result.step = s.step + 1;
    if (relationRight && strongerRight && !result.resolved) {
      result.resolved = true;
      result.firstTry = result.tries === 1;
    }
    return [{ type: "compared", task: task.id, pair: a.pair, relationRight, strongerRight }];
  },
  decide(def, s, a) {
    const task = taskOf(def, a.task);
    if (task?.type !== "decide") return "unknown-task";
    if (!opensHere(def, s, "task", task.id)) return "not-here";
    if (s.tasks[task.id]?.done) return "already-decided";
    const option = task.options.find((o) => o.id === a.option);
    if (!option) return "unknown-option";
    const cited = [...new Set(Array.isArray(a.cited) ? a.cited : [])];
    if (!cited.length) return "cite-evidence";
    if (cited.some((id) => !s.evidence[id])) return "evidence-missing";
    s.tasks[task.id] = {
      done: true,
      choice: option.id,
      cited,
      reason: String(a.reason || "").slice(0, 300),
      step: s.step + 1,
    };
    if (option.explanation) s.decision = { task: task.id, option: option.id, cited };
    setFlags(s, option.sets);
    return [{ type: "decided", task: task.id, option: option.id }];
  },
  submit(def, s, a) {
    const task = taskOf(def, a.task);
    if (!task || !LANGUAGE_TASKS.includes(task.type)) return "unknown-task";
    if (!opensHere(def, s, "task", task.id)) return "not-here";
    if (s.tasks[task.id]?.done) return "already-done";
    const text = String(a.text || "")
      .trim()
      .slice(0, MAX_TEXT);
    if (words(text) < (task.minWords || DEFAULT_MIN_WORDS)) return "too-short";
    if (task.type === "revise") {
      const first = s.tasks[task.of];
      if (!first?.done) return "nothing-to-revise";
      if (norm(first.text) === norm(text)) return "not-changed";
    }
    const help = task.type === "transfer" ? {} : { ...(s.help[task.id] || {}) };
    // A revision follows feedback, so it is always supported; a transfer is done with help closed.
    const supported = task.type === "revise" || Object.values(help).some(Boolean);
    s.tasks[task.id] = {
      done: true,
      text,
      words: words(text),
      source: a.source === "transcript" ? "transcript" : "typed",
      supports: help,
      supported,
      step: s.step + 1,
    };
    if (a.loopId) s.loops[task.id] = String(a.loopId).slice(0, 40);
    return [{ type: "submitted", task: task.id, supported }];
  },
};
const ROUTE = { examine: "open", read: "open", listen: "open" };

/**
 * Apply one action. Returns a NEW state with the events it caused, or the given state and an `error` code.
 * @returns {{ state: object, events: object[], error?: string }}
 */
export function act(def, state, action) {
  const handler = HANDLERS[ROUTE[action?.type] || action?.type];
  if (!handler) return fail(state, "unknown-action");
  const next = clone(state);
  const result = handler(def, next, action);
  if (typeof result === "string") return fail(state, result);
  settle(def, next, result);
  return { state: next, events: result };
}

// ── reading a state ──────────────────────────────────────────────────────────
/** The outcome the story reached, once it is decided (after `outcomeAfter`, or the last act); null before. */
export const outcomeOf = (def, state) => def.outcomes.find((o) => o.id === state.outcome) || null;

export function progressOf(def, state) {
  const reached = reachedAct(def, state);
  const met = def.characters.filter((c) => state.talk[c.id]?.asked.length).length;
  const tasksDone = def.tasks.filter((t) => state.tasks[t.id]?.done).length;
  return {
    act: Math.min(reached, def.acts.length - 1),
    acts: def.acts.map((a, i) => ({ id: a.id, done: i < reached, current: i === reached })),
    evidence: { found: Object.keys(state.evidence).length, total: def.evidence.length },
    people: { met, total: def.characters.length },
    tasks: { done: tasksDone, total: def.tasks.length },
    started: state.step > 0,
    complete: reached >= def.acts.length,
    outcome: state.outcome,
  };
}

// ── saves ────────────────────────────────────────────────────────────────────
export function loadSaves(read = (k) => storage.get(k)) {
  const v = safeJson(read(SIM_KEY), null);
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
export function saveState(
  state,
  read = (k) => storage.get(k),
  write = (k, v) => storage.set(k, v),
) {
  const all = loadSaves(read);
  all[state.mission] = state;
  return write(SIM_KEY, JSON.stringify(all));
}
export function clearSave(
  missionId,
  read = (k) => storage.get(k),
  write = (k, v) => storage.set(k, v),
) {
  const all = loadSaves(read);
  delete all[missionId];
  return write(SIM_KEY, JSON.stringify(all));
}

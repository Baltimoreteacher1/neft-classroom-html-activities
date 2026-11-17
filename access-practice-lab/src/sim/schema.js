// Living Language Simulation Engine: the mission definition contract (docs/part2-integration-map.md, SIMULATIONS.md).
// Pure data rules, no DOM: the eleven interactions, the condition language (Cond) and validateMission(), which every
// mission passes before it is played (the flagship, and experiences the instructor compiler generates).
// Rules kept here: a mission always asks for real language (a speak or write task), every reference resolves, every
// scene can be reached, every act can finish, text is English AND Spanish, and the last outcome is unconditional so
// a story always has an ending. Outcomes are story consequences, never grades.
export const SCHEMA = "lp-sim/1";

/** The eleven interactions: three evidence kinds a learner opens, two ways to question a character, six task types. */
export const INTERACTIONS = Object.freeze([
  "examine", // an object
  "read", // a document or data
  "listen", // an audio message
  "interview", // ask a character about a topic
  "clarify", // ask a clarification question
  "compare", // put two pieces of evidence side by side
  "decide", // choose among competing explanations and cite evidence
  "speak", // spoken explanation
  "write", // written recommendation
  "revise", // improve the work after feedback
  "transfer", // a new related problem, independently
]);
export const EVIDENCE_KINDS = Object.freeze(["document", "audio", "object", "testimony", "data"]);
export const TASK_TYPES = Object.freeze([
  "compare",
  "decide",
  "speak",
  "write",
  "revise",
  "transfer",
]);
/** Tasks where the learner produces language (they go through the feedback loop). */
export const LANGUAGE_TASKS = Object.freeze(["speak", "write", "revise", "transfer"]);
export const KEY_USES = Object.freeze(["Narrate", "Inform", "Explain", "Argue"]);
export const DOMAINS = Object.freeze(["Listening", "Reading", "Speaking", "Writing"]);
export const BANDS = Object.freeze(["3-5", "6-8", "all"]);
export const RELATIONS = Object.freeze(["agree", "conflict", "unrelated"]);
/** Which action opens each evidence kind (testimony is only ever given by a character). */
export const OPEN_ACTION = Object.freeze({
  object: "examine",
  document: "read",
  data: "read",
  audio: "listen",
});
export const ID_RE = /^[a-z0-9][a-z0-9:_-]{0,39}$/;

const byId = (list, id) => (Array.isArray(list) ? list.find((x) => x?.id === id) : undefined);
export const sceneOf = (def, id) => byId(def.scenes, id);
export const characterOf = (def, id) => byId(def.characters, id);
export const evidenceOf = (def, id) => byId(def.evidence, id);
export const taskOf = (def, id) => byId(def.tasks, id);
export const topicOf = (character, id) => byId(character?.topics, id);

/** The explanation a decision points at (the chosen option's `explanation`), or "". */
export function chosenExplanation(def, state, taskId) {
  const result = state.tasks?.[taskId];
  const option = byId(taskOf(def, taskId)?.options, result?.choice);
  return option?.explanation || "";
}

/** Cited evidence that supports the chosen explanation: { all, strong } id lists. */
export function citedSupport(def, state, taskId) {
  const explanation = chosenExplanation(def, state, taskId);
  const cited = state.tasks?.[taskId]?.cited || [];
  const all = explanation
    ? cited.filter((id) => (evidenceOf(def, id)?.supports || []).includes(explanation))
    : [];
  return { all, strong: all.filter((id) => evidenceOf(def, id)?.strength === "strong") };
}

/** The index of the act the learner has reached: the first act whose `done` is not yet true. */
export function reachedAct(def, state) {
  const acts = def.acts || [];
  let i = 0;
  while (i < acts.length && evalCondRaw(acts[i].done, state, def, i)) i++;
  return Math.min(i, acts.length);
}

// `actLimit` stops { act } conditions inside an act's own `done` from recursing into later acts.
function evalCondRaw(cond, state, def, actLimit = Infinity) {
  if (!cond || typeof cond !== "object") return true;
  if (Array.isArray(cond.all)) return cond.all.every((c) => evalCondRaw(c, state, def, actLimit));
  if (Array.isArray(cond.any)) return cond.any.some((c) => evalCondRaw(c, state, def, actLimit));
  if ("not" in cond) return !evalCondRaw(cond.not, state, def, actLimit);
  if (Array.isArray(cond.flag)) return (state.flags?.[cond.flag[0]] ?? false) === cond.flag[1];
  if ("has" in cond) return Boolean(state.evidence?.[cond.has]);
  if ("evidence" in cond) return Object.keys(state.evidence || {}).length >= cond.evidence;
  if ("done" in cond) return Boolean(state.tasks?.[cond.done]?.done);
  if (Array.isArray(cond.chose)) return state.tasks?.[cond.chose[0]]?.choice === cond.chose[1];
  if ("talked" in cond) return (state.talk?.[cond.talked]?.asked?.length || 0) > 0;
  if (Array.isArray(cond.cited))
    return (state.tasks?.[cond.cited[0]]?.cited?.length || 0) >= cond.cited[1];
  // Optional additions (SIMULATIONS.md): evidence quality behind a decision, a settled conflict, an act reached.
  if (Array.isArray(cond.support))
    return citedSupport(def, state, cond.support[0]).all.length >= cond.support[1];
  if (Array.isArray(cond.strong))
    return citedSupport(def, state, cond.strong[0]).strong.length >= cond.strong[1];
  if ("resolved" in cond) return Boolean(state.tasks?.[cond.resolved]?.resolved);
  if ("act" in cond) {
    const index = (def.acts || []).findIndex((a) => a.id === cond.act);
    if (index < 0 || index >= actLimit) return false;
    return (def.acts || []).slice(0, index).every((a, i) => evalCondRaw(a.done, state, def, i));
  }
  return false;
}

/** Evaluate a condition against a runtime state. A missing condition is true. */
export const evalCond = (cond, state, def) => evalCondRaw(cond, state, def);

// ── validation ───────────────────────────────────────────────────────────────
const isPair = (v) =>
  Array.isArray(v) &&
  v.length === 2 &&
  v.every((s) => typeof s === "string" && s.trim().length > 0);
const COND_KEYS = [
  "all",
  "any",
  "not",
  "flag",
  "has",
  "evidence",
  "done",
  "chose",
  "talked",
  "cited",
  "support",
  "strong",
  "resolved",
  "act",
];

/** Everything a learner could ever hold or do in a mission (an optimistic upper bound, used to find dead acts). */
function reachables(def, ids) {
  const scenes = new Set();
  const queue = ids.scenes.has(def.start) ? [def.start] : [];
  const mapped = (def.map || []).map((m) => m.scene).filter((id) => ids.scenes.has(id));
  while (queue.length) {
    const id = queue.shift();
    if (scenes.has(id)) continue;
    scenes.add(id);
    for (const h of sceneOf(def, id)?.hotspots || [])
      if (h?.opens?.scene && ids.scenes.has(h.opens.scene)) queue.push(h.opens.scene);
    // A mission map lists places a learner can walk to from anywhere.
    if (mapped.includes(id) || id === def.start) queue.push(...mapped);
  }
  const evidence = new Set();
  const characters = new Set();
  const tasks = new Set();
  const flags = new Set();
  for (const id of scenes)
    for (const h of sceneOf(def, id)?.hotspots || []) {
      if (h?.opens?.evidence) evidence.add(h.opens.evidence);
      if (h?.opens?.character) characters.add(h.opens.character);
      if (h?.opens?.task) tasks.add(h.opens.task);
    }
  const note = (sets) => {
    for (const [k, v] of Object.entries(sets || {})) flags.add(`${k}=${JSON.stringify(v)}`);
  };
  for (const id of characters)
    for (const t of characterOf(def, id)?.topics || []) {
      for (const e of [...(t.gives || []), ...(t.clarify?.gives || [])]) evidence.add(e);
      note(t.sets);
    }
  for (const id of tasks) for (const o of taskOf(def, id)?.options || []) note(o.sets);
  return { scenes, evidence, characters, tasks, flags };
}

function canHold(cond, def, reach, actIndex) {
  if (!cond || typeof cond !== "object") return true;
  if (Array.isArray(cond.all)) return cond.all.every((c) => canHold(c, def, reach, actIndex));
  if (Array.isArray(cond.any)) return cond.any.some((c) => canHold(c, def, reach, actIndex));
  if ("not" in cond) return true;
  if (Array.isArray(cond.flag))
    return (
      cond.flag[1] === false || reach.flags.has(`${cond.flag[0]}=${JSON.stringify(cond.flag[1])}`)
    );
  if ("has" in cond) return reach.evidence.has(cond.has);
  if ("evidence" in cond) return reach.evidence.size >= cond.evidence;
  if ("done" in cond) return reach.tasks.has(cond.done);
  if (Array.isArray(cond.chose)) return reach.tasks.has(cond.chose[0]);
  if ("talked" in cond) return reach.characters.has(cond.talked);
  if (Array.isArray(cond.cited))
    return reach.tasks.has(cond.cited[0]) && reach.evidence.size >= cond.cited[1];
  if (Array.isArray(cond.support) || Array.isArray(cond.strong)) {
    const [taskId, n] = cond.support || cond.strong;
    if (!reach.tasks.has(taskId)) return false;
    return (taskOf(def, taskId)?.options || []).some((o) => {
      const fit = (def.evidence || []).filter(
        (e) =>
          reach.evidence.has(e.id) &&
          (e.supports || []).includes(o.explanation) &&
          (cond.support || e.strength === "strong"),
      );
      return o.explanation && fit.length >= n;
    });
  }
  if ("resolved" in cond)
    return (
      reach.tasks.has(cond.resolved) &&
      (taskOf(def, cond.resolved)?.pairs || []).some((p) => p.every((e) => reach.evidence.has(e)))
    );
  if ("act" in cond) {
    const index = (def.acts || []).findIndex((a) => a.id === cond.act);
    return index >= 0 && index <= actIndex;
  }
  return false;
}

/**
 * Validate a mission definition.
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateMission(def) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  if (!def || typeof def !== "object")
    return { ok: false, errors: ["mission is not an object"], warnings };
  const pair = (v, where) => isPair(v) || err(`${where}: needs [English, Spanish] text`);
  const list = (v) => (Array.isArray(v) ? v : []);

  if (def.schema !== SCHEMA) err(`schema must be "${SCHEMA}"`);
  if (typeof def.id !== "string" || !ID_RE.test(def.id))
    err("id: must match /^[a-z0-9][a-z0-9:_-]{0,39}$/");
  if (def.version == null) err("version: missing");
  pair(def.title, "title");
  pair(def.summary, "summary");
  if (!BANDS.includes(def.band)) err(`band: must be one of ${BANDS.join(", ")}`);
  if (!list(def.keyUses).length || list(def.keyUses).some((k) => !KEY_USES.includes(k)))
    err(`keyUses: one or more of ${KEY_USES.join(", ")}`);
  pair(def.objectives?.language, "objectives.language");
  pair(def.objectives?.content, "objectives.content");
  for (const [i, v] of list(def.vocabulary).entries()) {
    if (typeof v?.term !== "string" || !v.term.trim()) err(`vocabulary[${i}].term: missing`);
    pair(v?.meaning, `vocabulary[${i}].meaning`);
  }

  // ids: unique inside each collection
  const ids = {};
  for (const key of [
    "acts",
    "scenes",
    "characters",
    "evidence",
    "explanations",
    "tasks",
    "outcomes",
  ]) {
    ids[key] = new Set();
    if (!Array.isArray(def[key]) || (!def[key].length && key !== "explanations"))
      err(`${key}: needs at least one entry`);
    for (const [i, item] of list(def[key]).entries()) {
      const id = item?.id;
      if (typeof id !== "string" || !ID_RE.test(id))
        err(`${key}[${i}].id: missing or not a valid id`);
      else if (ids[key].has(id)) err(`${key}: duplicate id "${id}"`);
      else ids[key].add(id);
    }
  }
  const ref = (kind, id, where) =>
    ids[kind].has(id) || err(`${where}: unknown ${kind.replace(/s$/, "")} id "${id}"`);

  function cond(c, where) {
    if (c == null) return;
    const keys = c && typeof c === "object" && !Array.isArray(c) ? Object.keys(c) : [];
    if (keys.length !== 1 || !COND_KEYS.includes(keys[0]))
      return void err(`${where}: bad condition shape`);
    const [k] = keys;
    const v = c[k];
    const two = (a) => Array.isArray(a) && a.length === 2;
    if (k === "all" || k === "any") {
      if (!Array.isArray(v) || !v.length)
        return void err(`${where}: "${k}" needs a list of conditions`);
      v.forEach((x, i) => cond(x, `${where}.${k}[${i}]`));
    } else if (k === "not") {
      if (v == null) err(`${where}: "not" needs a condition`);
      cond(v, `${where}.not`);
    } else if (k === "flag") {
      if (!two(v) || typeof v[0] !== "string") err(`${where}: flag is [name, value]`);
    } else if (k === "has") ref("evidence", v, where);
    else if (k === "evidence") {
      if (!Number.isInteger(v) || v < 0) err(`${where}: evidence is a whole number`);
    } else if (k === "done" || k === "resolved") ref("tasks", v, where);
    else if (k === "talked") ref("characters", v, where);
    else if (k === "act") ref("acts", v, where);
    else if (k === "chose") {
      if (!two(v)) return void err(`${where}: chose is [taskId, optionId]`);
      if (ref("tasks", v[0], where) === true && !byId(taskOf(def, v[0]).options, v[1]))
        err(`${where}: unknown option id "${v[1]}"`);
    } else {
      // cited, support, strong: [taskId, n]
      if (!two(v) || !Number.isInteger(v[1]) || v[1] < 0)
        return void err(`${where}: ${k} is [taskId, n]`);
      ref("tasks", v[0], where);
    }
  }

  for (const a of list(def.acts)) {
    pair(a?.title, `act ${a?.id}.title`);
    pair(a?.goal, `act ${a?.id}.goal`);
    if (a?.done == null) err(`act ${a?.id}.done: missing condition`);
    cond(a?.done, `act ${a?.id}.done`);
  }

  if (!ids.scenes.has(def.start)) err(`start: scene "${def.start}" does not exist`);
  for (const s of list(def.scenes)) {
    const at = `scene ${s?.id}`;
    pair(s?.title, `${at}.title`);
    pair(s?.description, `${at}.description`);
    cond(s?.requires, `${at}.requires`);
    const seen = new Set();
    for (const [i, h] of list(s?.hotspots).entries()) {
      const hat = `${at}.hotspots[${i}]`;
      if (typeof h?.id !== "string" || !ID_RE.test(h.id))
        err(`${hat}.id: missing or not a valid id`);
      else if (seen.has(h.id)) err(`${at}: duplicate hotspot id "${h.id}"`);
      else seen.add(h.id);
      pair(h?.label, `${hat}.label`);
      if (![h?.x, h?.y].every((n) => typeof n === "number" && n >= 0 && n <= 100))
        err(`${hat}: x and y are numbers from 0 to 100`);
      cond(h?.requires, `${hat}.requires`);
      const opens = Object.entries(h?.opens || {});
      if (opens.length !== 1) err(`${hat}.opens: exactly one of evidence, character, task, scene`);
      for (const [k, id] of opens) {
        const kind = {
          evidence: "evidence",
          character: "characters",
          task: "tasks",
          scene: "scenes",
        }[k];
        if (!kind) err(`${hat}.opens: unknown key "${k}"`);
        else if (
          ref(kind, id, `${hat}.opens`) === true &&
          k === "evidence" &&
          evidenceOf(def, id).kind === "testimony"
        )
          err(`${hat}.opens: testimony "${id}" is given by a character, not opened from a scene`);
      }
    }
  }
  for (const [i, m] of list(def.map).entries()) ref("scenes", m?.scene, `map[${i}]`);

  for (const c of list(def.characters)) {
    const at = `character ${c?.id}`;
    if (typeof c?.name !== "string" || !c.name.trim()) err(`${at}.name: missing`);
    for (const k of ["role", "style", "greeting", "fallback"]) pair(c?.[k], `${at}.${k}`);
    ref("scenes", c?.scene, `${at}.scene`);
    if (!list(c?.topics).length) err(`${at}.topics: needs at least one topic`);
    const seen = new Set();
    for (const [i, t] of list(c?.topics).entries()) {
      const tat = `${at}.topics[${i}]`;
      if (typeof t?.id !== "string" || !ID_RE.test(t.id))
        err(`${tat}.id: missing or not a valid id`);
      else if (seen.has(t.id)) err(`${at}: duplicate topic id "${t.id}"`);
      else seen.add(t.id);
      pair(t?.ask, `${tat}.ask`);
      pair(t?.answer, `${tat}.answer`);
      if (
        !list(t?.keywords).length ||
        list(t?.keywords).some((k) => typeof k !== "string" || !k.trim())
      )
        err(`${tat}.keywords: needs at least one keyword`);
      cond(t?.requires, `${tat}.requires`);
      for (const e of list(t?.gives)) ref("evidence", e, `${tat}.gives`);
      if (t?.clarify) {
        pair(t.clarify.ask, `${tat}.clarify.ask`);
        pair(t.clarify.answer, `${tat}.clarify.answer`);
        for (const e of list(t.clarify.gives)) ref("evidence", e, `${tat}.clarify.gives`);
      }
    }
  }

  for (const e of list(def.evidence)) {
    const at = `evidence ${e?.id}`;
    if (!EVIDENCE_KINDS.includes(e?.kind))
      err(`${at}.kind: must be one of ${EVIDENCE_KINDS.join(", ")}`);
    pair(e?.title, `${at}.title`);
    pair(e?.body, `${at}.body`);
    for (const x of list(e?.supports)) ref("explanations", x, `${at}.supports`);
    for (const x of list(e?.contradicts)) ref("explanations", x, `${at}.contradicts`);
    if (e?.strength != null && !["strong", "weak"].includes(e.strength))
      err(`${at}.strength: strong or weak`);
  }
  for (const x of list(def.explanations)) pair(x?.label, `explanation ${x?.id}.label`);

  for (const t of list(def.tasks)) {
    const at = `task ${t?.id}`;
    if (!TASK_TYPES.includes(t?.type)) err(`${at}.type: must be one of ${TASK_TYPES.join(", ")}`);
    ref("scenes", t?.scene, `${at}.scene`);
    pair(t?.prompt, `${at}.prompt`);
    if (!KEY_USES.includes(t?.keyUse)) err(`${at}.keyUse: must be one of ${KEY_USES.join(", ")}`);
    if (!DOMAINS.includes(t?.domain)) err(`${at}.domain: must be one of ${DOMAINS.join(", ")}`);
    cond(t?.requires, `${at}.requires`);
    if (t?.minWords != null && (!Number.isInteger(t.minWords) || t.minWords < 1))
      err(`${at}.minWords: a whole number`);
    if (t?.type === "decide") {
      if (list(t.options).length < 2) err(`${at}.options: a decision needs at least two options`);
      const seen = new Set();
      for (const [i, o] of list(t.options).entries()) {
        if (typeof o?.id !== "string" || !ID_RE.test(o.id))
          err(`${at}.options[${i}].id: missing or not a valid id`);
        else if (seen.has(o.id)) err(`${at}: duplicate option id "${o.id}"`);
        else seen.add(o.id);
        pair(o?.label, `${at}.options[${i}].label`);
        if (o?.explanation != null)
          ref("explanations", o.explanation, `${at}.options[${i}].explanation`);
        if (o?.reply != null) pair(o.reply, `${at}.options[${i}].reply`);
      }
    }
    if (t?.type === "compare") {
      if (!list(t.pairs).length)
        err(`${at}.pairs: a comparison needs at least one pair of evidence`);
      for (const [i, p] of list(t.pairs).entries()) {
        if (!Array.isArray(p) || p.length !== 2 || p[0] === p[1])
          err(`${at}.pairs[${i}]: two different evidence ids`);
        else for (const e of p) ref("evidence", e, `${at}.pairs[${i}]`);
      }
    }
    if (t?.type === "revise" && t.of == null) err(`${at}.of: a revision names the task it revises`);
    if (
      t?.of != null &&
      ref("tasks", t.of, `${at}.of`) === true &&
      !["speak", "write"].includes(taskOf(def, t.of).type)
    )
      err(`${at}.of: must point at a speak or write task`);
    for (const [i, f] of list(t?.frames).entries()) pair(f, `${at}.frames[${i}]`);
  }
  if (!list(def.tasks).some((t) => t?.type === "speak" || t?.type === "write"))
    err("tasks: a mission needs at least one speak or write task (real language production)");

  const outcomes = list(def.outcomes);
  for (const [i, o] of outcomes.entries()) {
    pair(o?.title, `outcome ${o?.id}.title`);
    pair(o?.text, `outcome ${o?.id}.text`);
    const last = i === outcomes.length - 1;
    if (last && o?.when != null)
      err("outcomes: the last outcome must have no `when` (the story always ends)");
    if (!last && o?.when == null)
      err(`outcome ${o?.id}: only the last outcome may leave out \`when\``);
    cond(o?.when, `outcome ${o?.id}.when`);
  }
  if (def.outcomeAfter != null) ref("acts", def.outcomeAfter, "outcomeAfter");
  if (def.supports != null && (typeof def.supports !== "object" || Object.values(def.supports).some((v) => typeof v !== "boolean")))
    err("supports: an object of true/false switches (frames, wordBank, glossary, spanish, readAloud)");

  // Graph checks only make sense once every reference resolves.
  if (!errors.length) {
    const reach = reachables(def, ids);
    for (const id of ids.scenes)
      if (!reach.scenes.has(id)) err(`scene ${id}: cannot be reached from the start scene`);
    for (const [i, a] of def.acts.entries())
      if (!canHold(a.done, def, reach, i))
        err(`act ${a.id}: its \`done\` condition can never be true`);
    for (const e of def.evidence)
      if (!reach.evidence.has(e.id)) warnings.push(`evidence ${e.id}: nothing opens or gives it`);
    for (const c of def.characters)
      if (!reach.characters.has(c.id)) warnings.push(`character ${c.id}: no hotspot opens it`);
    for (const t of def.tasks)
      if (!reach.tasks.has(t.id)) warnings.push(`task ${t.id}: no hotspot opens it`);
    for (const o of def.outcomes.slice(0, -1))
      if (!canHold(o.when, def, reach, def.acts.length))
        warnings.push(`outcome ${o.id}: its \`when\` can never be true`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

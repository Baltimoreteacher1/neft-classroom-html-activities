// Language Construction Engine (the `build` engine): pure logic for the BUILD step of a Journey mission.
// Six modules (expand, combine, connector, morphology, pronoun, discourse) share one dispatcher and one
// state shape. Each module runs Explore (supports) -> Try -> Accept -> Transfer (a new item, no supports).
// The engine recognises MANY valid constructions: it tests relations (connector job, kept terms, new content
// words), never one stored sentence. Contract: access-practice-lab/JOURNEY.md ("BuildTask", "Engine UI modules").
import { analyzeResponse } from "../../lang/analyze.js";
import { CONNECTORS } from "../../lang/lexicon.js";
import {
  compareConnectors,
  evaluateCombine,
  evaluateExpand,
  meaningChange,
  swapPreview,
} from "./construct-sentence.js";
import {
  emptySlots,
  evaluateConnector,
  evaluateDiscourse,
  evaluateMorphology,
  evaluatePronoun,
  initialOrder,
} from "./construct-modules.js";

export {
  compareConnectors,
  detailShelf,
  meaningChange,
  relationShelf,
  swapPreview,
  findConnectors,
  relationship,
} from "./construct-sentence.js";
export * from "./construct-modules.js";

export const MODULES = ["expand", "combine", "connector", "morphology", "pronoun", "discourse"];
export const SENTENCE_MODULES = ["expand", "combine"];
const RELATIONS = ["cause", "contrast", "sequence", "addition"];
const isStr = (x) => typeof x === "string" && x.trim().length > 0;
const fail = (task, msg) => {
  throw new Error(
    `construct: ${task?.module || "?"} task "${task?.title || task?.base || "untitled"}": ${msg}`,
  );
};

/** The item to play: the task itself, or its `transfer` payload laid over it (notes and altConnectors carry over). */
export function resolveTask(task, transfer = false) {
  if (!transfer) return task;
  if (!task.transfer || typeof task.transfer !== "object") fail(task, "missing transfer payload");
  return { ...task, ...task.transfer, transfer: undefined, isTransfer: true };
}

function checkNeeds(task, needs) {
  if (!Array.isArray(needs) || !needs.length) fail(task, "needs must be a non-empty array");
  needs.forEach((n, i) => {
    const at = `needs[${i}]`;
    if (!isStr(n?.id) || !isStr(n?.label)) fail(task, `${at} needs id and label`);
    const keys = ["connectorJob", "terms", "minNew"].filter((k) => n.test && k in n.test);
    if (keys.length !== 1)
      fail(task, `${at}.test must have exactly one of connectorJob, terms, minNew`);
    if (keys[0] === "connectorJob" && !CONNECTORS[n.test.connectorJob])
      fail(task, `${at}.test.connectorJob "${n.test.connectorJob}" is not a connector job`);
    if (
      keys[0] === "terms" &&
      (!Array.isArray(n.test.terms) || !n.test.terms.length || !n.test.terms.every(isStr))
    )
      fail(task, `${at}.test.terms must be a non-empty list of strings`);
    if (keys[0] === "minNew" && !(Number(n.test.minNew) >= 1))
      fail(task, `${at}.test.minNew must be a number >= 1`);
  });
}

function checkOne(task) {
  if (!MODULES.includes(task?.module)) fail(task, `module must be one of ${MODULES.join(", ")}`);
  switch (task.module) {
    case "expand":
      if (!isStr(task.base)) fail(task, "base must be a sentence");
      checkNeeds(task, task.needs);
      for (const a of task.altConnectors || [])
        if (!isStr(a?.word) || !isStr(a?.note))
          fail(task, "altConnectors entries need word and note");
      break;
    case "combine":
      if (!Array.isArray(task.pair) || task.pair.length !== 2 || !task.pair.every(isStr))
        fail(task, "pair must be two sentences");
      if (!RELATIONS.includes(task.relation))
        fail(task, `relation must be one of ${RELATIONS.join(", ")}`);
      if (!Array.isArray(task.keep) || !task.keep.length)
        fail(task, "keep must list the terms to preserve");
      break;
    case "connector":
      if (!Array.isArray(task.gaps) || !task.gaps.length)
        fail(task, "gaps must be a non-empty array");
      task.gaps.forEach((g, i) => {
        if (!isStr(g?.before) && !isStr(g?.after))
          fail(task, `gaps[${i}] needs before or after text`);
        if (!Array.isArray(g.options) || g.options.length < 2)
          fail(task, `gaps[${i}].options needs 2 or more choices`);
        if (!Array.isArray(g.ok) || !g.ok.length || !g.ok.every((o) => g.options.includes(o)))
          fail(task, `gaps[${i}].ok must be a non-empty subset of options`);
      });
      break;
    case "morphology":
      if (!Array.isArray(task.words) || !task.words.length)
        fail(task, "words must be a non-empty array");
      task.words.forEach((w, i) => {
        if (!isStr(w?.word) || !Array.isArray(w.parts) || w.parts.length < 2)
          fail(task, `words[${i}] needs word and 2 or more parts`);
        for (const p of w.parts)
          if (!isStr(p?.t) || !["prefix", "root", "suffix"].includes(p.type) || !isStr(p.meaning))
            fail(task, `words[${i}] part needs t, type (prefix|root|suffix) and meaning`);
      });
      break;
    case "pronoun": {
      if (
        !Array.isArray(task.text) ||
        !task.text.length ||
        !task.text.every((s) => isStr(s?.id) && isStr(s?.text))
      )
        fail(task, "text must be sentences with id and text");
      if (!Array.isArray(task.pronouns) || !task.pronouns.length)
        fail(task, "pronouns must be a non-empty array");
      const ids = task.text.map((s) => s.id);
      task.pronouns.forEach((p, i) => {
        if (!ids.includes(p?.sentence) || !isStr(p.phrase))
          fail(task, `pronouns[${i}] needs a sentence id from text and a phrase`);
        const ok = Array.isArray(p.ok) ? p.ok : [p.ok];
        if (!Array.isArray(p.options) || !ok.length || !ok.every((o) => p.options.includes(o)))
          fail(task, `pronouns[${i}].ok must be among options`);
      });
      break;
    }
    case "discourse": {
      const ids = (task.units || []).map((u) => u?.id);
      if (ids.length < 3 || !task.units.every((u) => isStr(u?.id) && isStr(u?.text)))
        fail(task, "units needs 3 or more entries with id and text");
      const orders = [task.order, ...(task.alt || [])];
      for (const o of orders)
        if (
          !Array.isArray(o) ||
          o.length !== ids.length ||
          !o.every((x) => ids.includes(x)) ||
          new Set(o).size !== ids.length
        )
          fail(task, "order and every alt must list each unit exactly once");
      for (const [i, c] of (task.connectors || []).entries())
        if (!ids.includes(c?.before) || !isStr(c.word))
          fail(task, `connectors[${i}] needs before (a unit id) and word`);
      break;
    }
    default:
  }
}

/** Throws a descriptive error for a malformed task (or its transfer payload). Returns the task. */
export function validateTask(task) {
  checkOne(task);
  checkOne(resolveTask(task, true));
  return task;
}
export function validateTasks(tasks) {
  if (!Array.isArray(tasks) || !tasks.length)
    throw new Error("construct: build must be a non-empty array of modules");
  tasks.forEach(validateTask);
  return tasks;
}

// ── dispatcher ───────────────────────────────────────────────────────────────
const EVALUATORS = {
  expand: evaluateExpand,
  combine: evaluateCombine,
  connector: evaluateConnector,
  morphology: evaluateMorphology,
  pronoun: evaluatePronoun,
  discourse: evaluateDiscourse,
};

/** Evaluate one learner input for a task. `opts.transfer` plays the task's transfer item. */
export function evaluate(task, input, opts = {}) {
  const t = resolveTask(task, Boolean(opts.transfer));
  checkOne(t);
  return { ...EVALUATORS[t.module](t, input), transfer: Boolean(opts.transfer) };
}

// ── state ────────────────────────────────────────────────────────────────────
/** Starting draft for a module (or its transfer item). Everything the learner has built so far lives here. */
export function init(task, { transfer = false } = {}) {
  const t = resolveTask(task, transfer);
  checkOne(t);
  switch (t.module) {
    case "expand":
      return { text: t.base, history: [] };
    case "combine":
      return { text: "", history: [] };
    case "connector":
      return { answers: t.gaps.map(() => null) };
    case "morphology":
      return {
        words: t.words.map((w) => ({ slots: emptySlots(w), meaning: null })),
        sel: null,
        at: 0,
      };
    case "pronoun":
      return { answers: t.pronouns.map(() => null) };
    default:
      return {
        order: initialOrder(t),
        connectors: (t.connectors || []).map(() => null),
        sel: null,
      };
  }
}

const newRecord = (task) => ({
  phase: "explore", // explore | try | accepted | transfer | done
  accepted: false,
  transferOk: false,
  attempts: 0,
  transferAttempts: 0,
  supports: [],
  draft: init(task),
  tdraft: init(task, { transfer: true }),
  last: null,
  tlast: null,
});

/** The whole BUILD step's saved state: { v, index, modules: [record], finished }. */
export function initBuild(tasks) {
  return { v: 1, index: 0, modules: validateTasks(tasks).map(newRecord), finished: false };
}

/** Repair a saved state so it fits the tasks (a pack may have changed since it was saved). */
export function loadBuild(tasks, saved) {
  if (
    !saved ||
    saved.v !== 1 ||
    !Array.isArray(saved.modules) ||
    saved.modules.length !== tasks.length
  )
    return initBuild(tasks);
  return { ...saved, index: Math.max(0, Math.min(tasks.length - 1, Number(saved.index) || 0)) };
}

export const setRecord = (state, i, patch) => ({
  ...state,
  modules: state.modules.map((r, k) => (k === i ? { ...r, ...patch } : r)),
});

/** Mark a support as used on a module (frames, bank, shelf, ...). Idempotent. */
export const noteSupport = (state, i, id) =>
  state.modules[i].supports.includes(id)
    ? state
    : setRecord(state, i, { supports: [...state.modules[i].supports, id] });

/**
 * Check the current draft of module i. In the try phase an accepted result moves to "accepted"; in the transfer
 * phase it moves to "done". A miss keeps the phase so the learner can revise. Returns { state, result }.
 */
export function submit(task, state, i) {
  const rec = state.modules[i];
  const transfer = rec.phase === "transfer";
  const result = evaluate(task, transfer ? rec.tdraft : rec.draft, { transfer });
  const keep = { input: transfer ? rec.tdraft : rec.draft, result };
  const patch = transfer
    ? {
        transferAttempts: rec.transferAttempts + 1,
        tlast: keep,
        transferOk: rec.transferOk || result.accepted,
        phase: result.accepted ? "done" : "transfer",
      }
    : {
        attempts: rec.attempts + 1,
        last: keep,
        accepted: rec.accepted || result.accepted,
        phase: result.accepted ? "accepted" : "try",
      };
  return {
    state: setRecord(state, i, patch),
    result,
    kind: transfer ? "transfer" : rec.attempts === 0 ? "first" : "revision",
  };
}

/** Each module accepted AND its transfer item accepted. */
export function doneCriteria(tasks, state) {
  const recs = state?.modules || [];
  const modules = tasks.map((t, i) => ({
    module: t.module,
    accepted: Boolean(recs[i]?.accepted),
    transferAccepted: Boolean(recs[i]?.transferOk),
  }));
  return {
    done: modules.length > 0 && modules.every((m) => m.accepted && m.transferAccepted),
    modules,
    remaining: modules.filter((m) => !(m.accepted && m.transferAccepted)).length,
  };
}

/** What the shell stores when the step finishes: small JSON, no learner text. */
export function doneResult(tasks, state) {
  const modules = tasks.map((t, i) => ({
    module: t.module,
    attempts: state.modules[i].attempts,
    supportsUsed: [...state.modules[i].supports],
    transferOk: state.modules[i].transferOk,
  }));
  return { modules, supportsUsed: [...new Set(modules.flatMap((m) => m.supportsUsed))] };
}

// ── ledger ───────────────────────────────────────────────────────────────────
const SUPPORT_FLAG = {
  frames: "frames",
  bank: "bank",
  shelf: "hint",
  hint: "hint",
  model: "model",
  bridge: "l1",
  swap: "coach",
};
export const supportFlags = (ids = []) =>
  Object.fromEntries(
    ["frames", "bank", "model", "coach", "l1", "hint"].map((k) => [
      k,
      ids.some((id) => SUPPORT_FLAG[id] === k),
    ]),
  );

/**
 * Evidence-ledger entry for a sentence-producing module (expand, combine); null for the others.
 * { src: "mission", task: "<mission>.build", domain: "Writing", use: <Key Language Use>, kind: first | revision | transfer }
 */
export function ledgerEntry({
  module,
  text,
  missionId,
  band,
  klu = "Explain",
  kind = "first",
  supports = [],
  independent = false,
  wordBank = [],
}) {
  if (!SENTENCE_MODULES.includes(module) || !String(text || "").trim()) return null;
  const used = supportFlags(supports);
  const stage =
    independent || kind === "transfer"
      ? Object.values(used).some(Boolean)
        ? "supported"
        : "independent"
      : "supported";
  const a = analyzeResponse(text, { keyUse: klu, modality: "writing", stage, wordBank });
  return {
    src: "mission",
    task: `${missionId}.build`,
    band,
    domain: "Writing",
    use: klu,
    stage,
    kind,
    supports: used,
    m: a.ledger,
  };
}

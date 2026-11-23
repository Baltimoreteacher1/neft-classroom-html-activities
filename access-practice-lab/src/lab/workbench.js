// Sentence workbench: ONE reusable "expand a sentence / combine two clauses" builder, as a pure reducer.
// No DOM, no I18n, no storage: state is plain JSON (resumable), every transition is `reduce(state, action)`
// returning a NEW state (or the same object when the action changes nothing).
//
// Steps: BASE (read the starting sentence) -> EXPAND (tap chips for describing word / who / what / where / when
// / why; each chip is placed in its correct slot, adjectives in the standard order) -> COMBINE (pick a connector
// chip filtered by grade band, then the punctuation) -> CHECK. A workbench has a `kind`:
//   expand   BASE -> EXPAND -> CHECK
//   combine  BASE -> COMBINE -> CHECK            (two authored clauses a and b)
//   full     BASE -> EXPAND -> COMBINE -> CHECK  (expand clause a, then join it to authored clause b)
//
// Syntax: `liveTag(state)` runs the tested analyzer (tags.js) on the assembled sentence and names the first
// pattern found; `evaluate(state)` decides ok / not ok and records the tag per check. Only a TAG ID ever leaves
// this module for reporting: never the learner's sentence.
import { TAG_IDS, analyzeSentence } from "./tags.js";

export const WB_VERSION = 1;
export const KINDS = Object.freeze(["expand", "combine", "full"]);
export const STEPS = Object.freeze(["base", "expand", "combine", "check"]);
export const SLOTS = Object.freeze(["describe", "who", "what", "where", "when", "why"]);
const CAPACITY = { describe: 2, who: 1, what: 1, where: 1, when: 1, why: 1 };
export const slotCap = (slot) => CAPACITY[slot] || 0;

/** The chip groups: chrome only ([en, es]); chip text itself is always English. */
export const SLOT_INFO = Object.freeze({
  describe: {
    name: ["Describing word", "Palabra descriptiva"],
    ask: ["What is it like?", "¿Cómo es?"],
  },
  who: { name: ["Who", "Quién"], ask: ["Which one?", "¿Cuál?"] },
  what: { name: ["What", "Qué"], ask: ["What did it do it to?", "¿A qué o a quién?"] },
  where: { name: ["Where", "Dónde"], ask: ["Where did it happen?", "¿Dónde pasó?"] },
  when: { name: ["When", "Cuándo"], ask: ["When did it happen?", "¿Cuándo pasó?"] },
  why: { name: ["Why", "Por qué"], ask: ["Why did it happen?", "¿Por qué pasó?"] },
});

/** The six logical relationships between two ideas (shared with Connector Climb). */
export const RELS = Object.freeze({
  cause: {
    name: ["Cause", "Causa"],
    hint: [
      "Does the second idea tell why the first idea happened?",
      "¿La segunda idea dice por qué pasó la primera?",
    ],
  },
  result: {
    name: ["Result", "Resultado"],
    hint: [
      "Is the second idea an effect that comes from the first idea?",
      "¿La segunda idea es un efecto que viene de la primera?",
    ],
  },
  contrast: {
    name: ["Contrast", "Contraste"],
    hint: [
      "Do the two ideas surprise you together? Look for a difference.",
      "¿Las dos ideas juntas te sorprenden? Busca una diferencia.",
    ],
  },
  sequence: {
    name: ["Sequence", "Secuencia"],
    hint: [
      "Do the ideas tell steps in time order?",
      "¿Las ideas cuentan pasos en orden de tiempo?",
    ],
  },
  example: {
    name: ["Example", "Ejemplo"],
    hint: [
      "Is the second idea one specific case that shows the first idea is true?",
      "¿La segunda idea es un caso específico que muestra que la primera es verdad?",
    ],
  },
  addition: {
    name: ["Addition", "Adición"],
    hint: [
      "Does the second idea add one more fact of the same kind?",
      "¿La segunda idea añade otro dato del mismo tipo?",
    ],
  },
});
export const REL_ORDER = Object.freeze(Object.keys(RELS));

const cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1);
/** The punctuation rule for each kind of connector ([en, es]). */
export function punctRule(type, c) {
  const q = `“${c}”`;
  const Q = `“${cap1(c)}”`;
  return {
    sub: [
      `When ${q} comes in the middle, no comma or period goes before it.`,
      `Cuando ${q} va en el medio, no lleva coma ni punto antes.`,
    ],
    coord: [
      `Put a comma before ${q} when it joins two complete sentences, and no comma after it.`,
      `Pon una coma antes de ${q} cuando une dos oraciones completas, y ninguna coma después.`,
    ],
    adverb: [
      `Use a semicolon before ${q} and a comma after it.`,
      `Usa punto y coma antes de ${q} y una coma después.`,
    ],
    starter: [
      `Start a new sentence with ${Q} and put a comma after it.`,
      `Empieza una oración nueva con ${Q} y pon una coma después.`,
    ],
    lead: [
      `When a sentence starts with ${Q}, put a comma after the opening part.`,
      `Cuando una oración empieza con ${Q}, pon una coma después de la parte inicial.`,
    ],
  }[type];
}

/** Punctuation chips the learner picks between the two ideas. */
export const JOINERS = Object.freeze({
  comma: { sym: ",", name: ["comma", "coma"] },
  semicolon: { sym: ";", name: ["semicolon", "punto y coma"] },
  period: { sym: ".", name: ["period", "punto"] },
  none: { sym: "", name: ["no mark", "sin signo"] },
});
export const JOINER_IDS = Object.freeze(Object.keys(JOINERS));
/** Which punctuation is correct for each connector type (the same rules Connector Climb teaches). */
export const ACCEPT = Object.freeze({
  coord: ["comma"],
  sub: ["none"],
  lead: ["comma"],
  adverb: ["semicolon", "period"],
  starter: ["period", "semicolon"],
});

const both = ["3-5", "6-8"];
/** Canonical connector chips. `bands` filters what a grade band is shown; `type` decides punctuation. */
export const CONNECTORS = Object.freeze([
  { id: "and", type: "coord", rel: "addition", es: "y", bands: both },
  { id: "but", type: "coord", rel: "contrast", es: "pero", bands: both },
  { id: "so", type: "coord", rel: "result", es: "así que", bands: both },
  { id: "because", type: "sub", rel: "cause", es: "porque", bands: both },
  { id: "and then", type: "coord", rel: "sequence", es: "y luego", bands: both },
  { id: "also", type: "starter", rel: "addition", es: "también", bands: both },
  { id: "since", type: "sub", rel: "cause", es: "ya que", bands: ["6-8"] },
  { id: "as a result", type: "starter", rel: "result", es: "como resultado", bands: ["6-8"] },
  { id: "therefore", type: "adverb", rel: "result", es: "por lo tanto", bands: ["6-8"] },
  { id: "however", type: "adverb", rel: "contrast", es: "sin embargo", bands: ["6-8"] },
  { id: "although", type: "lead", rel: "contrast", es: "aunque", bands: ["6-8"] },
  { id: "for example", type: "starter", rel: "example", es: "por ejemplo", bands: ["6-8"] },
  { id: "in addition", type: "starter", rel: "addition", es: "además", bands: ["6-8"] },
]);
export const connectorsFor = (band) =>
  CONNECTORS.filter((c) => c.bands.includes(band)).map(({ id, type, rel, es }) => ({
    id,
    type,
    rel,
    es,
  }));

// ── tokens: the sentence as [{ t, slot, glue?, keep? }] so the UI can mark what each chip added ──────────
const up = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const down = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const tok = (t, slot = null, extra) => ({ t, slot, ...extra });
const mark = (t) => ({ t, slot: "punct", glue: true });
const capT = (ts) => (ts.length ? [{ ...ts[0], t: up(ts[0].t) }, ...ts.slice(1)] : ts);
const lowT = (ts) =>
  ts.length && !ts[0].keep && !/^I(\s|'|$)/.test(ts[0].t)
    ? [{ ...ts[0], t: down(ts[0].t) }, ...ts.slice(1)]
    : ts;
export const textOf = (tokens) =>
  tokens.reduce((s, x) => (s ? (x.glue ? `${s}${x.t}` : `${s} ${x.t}`) : x.t), "");

const chipOf = (spec, slot, id) => (spec.chips?.[slot] || []).find((c) => c.id === id);
const chipCount = (state) => SLOTS.reduce((n, slot) => n + state.adds[slot].length, 0);
const needOf = (state) =>
  state.spec.need ?? (state.kind === "full" ? 1 : state.band === "6-8" ? 3 : 2);
const connectorOf = (state) =>
  state.conn && state.conn !== "none"
    ? state.spec.connectors?.find((c) => c.id === state.conn) || null
    : null;

/** The first clause: the expanded base (expand/full) or the authored `a` (combine). Lowercase, no end mark. */
function clauseTokens(state) {
  const { spec, adds } = state;
  if (state.kind === "combine") return [tok(spec.a, "base", { keep: Boolean(spec.keep) })];
  const base = spec.base;
  const picked = (slot) => adds[slot].map((id) => chipOf(spec, slot, id)).filter(Boolean);
  const out = [];
  if (base.det) out.push(tok(base.det, "base"));
  picked("describe")
    .sort((x, y) => (x.rank ?? 0) - (y.rank ?? 0))
    .forEach((c) => out.push(tok(c.text, "describe")));
  out.push(tok(base.noun, "base", { keep: Boolean(base.proper) }));
  for (const slot of ["who"]) picked(slot).forEach((c) => out.push(tok(c.text, slot)));
  out.push(tok(base.verb, "base"));
  if (base.rest) out.push(tok(base.rest, "base"));
  for (const slot of ["what", "where", "when", "why"])
    picked(slot).forEach((c) => out.push(tok(c.text, slot)));
  if (/^an?$/i.test(out[0].t) && out[1])
    out[0] = { ...out[0], t: /^[aeiou]/i.test(out[1].t) ? "an" : "a" };
  return out;
}
const secondTokens = (state) => [tok(state.spec.b, "second")];

function joinTokens(A, B, c, joiner) {
  const C = c && tok(c.id, "conn");
  const CC = C && capT([C]);
  const end = mark(".");
  if (!c) {
    if (joiner === "comma") return [...capT(A), mark(","), ...B, end];
    if (joiner === "semicolon") return [...capT(A), mark(";"), ...B, end];
    if (joiner === "period") return [...capT(A), mark("."), ...capT(B), end];
    return [...capT(A), ...B, end];
  }
  if (c.type === "lead") {
    const a = lowT(A);
    if (joiner === "comma") return [...CC, ...a, mark(","), ...B, end];
    if (joiner === "semicolon") return [...CC, ...a, mark(";"), ...B, end];
    if (joiner === "period") return [...CC, ...a, mark("."), ...capT(B), end];
    return [...CC, ...a, ...B, end];
  }
  const tail = c.type === "adverb" || c.type === "starter" ? [mark(","), ...B, end] : [...B, end];
  if (joiner === "comma") return [...capT(A), mark(","), C, ...tail];
  if (joiner === "semicolon") return [...capT(A), mark(";"), C, ...tail];
  if (joiner === "period") return [...capT(A), mark("."), ...CC, ...tail];
  return [...capT(A), C, ...tail];
}

/** The sentence as it stands now (tokens). For combine/full once both a connector and punctuation are chosen, the joined sentence. */
export function tokensOf(state) {
  const A = clauseTokens(state);
  if (state.kind === "expand") return [...capT(A), mark(".")];
  if (state.conn && state.joiner)
    return joinTokens(A, secondTokens(state), connectorOf(state), state.joiner);
  return state.kind === "full" ? [...capT(A), mark(".")] : [];
}
export const assemble = (state) => textOf(tokensOf(state));
/** The first clause on its own (what the COMBINE step shows before anything is joined). */
export const clauseText = (state) => textOf(clauseTokens(state));
export const secondText = (state) => state.spec.b || "";

// ── syntax checks ────────────────────────────────────────────────────────────────────────────────
/**
 * The first pattern worth a calm note for the sentence as built, or null. Where a connector was chosen the
 * workbench already KNOWS two ideas are joined, so CONNECTOR_MISSING is decided structurally (no connector and
 * only a comma or nothing between them), never guessed from the text: the analyzer reads a correct
 * "…afternoon; however, they lost…" as a comma splice.
 */
export function liveTag(state) {
  const joined = state.kind !== "expand" && Boolean(state.conn && state.joiner);
  if (joined && state.conn === "none" && (state.joiner === "comma" || state.joiner === "none"))
    return "CONNECTOR_MISSING";
  const text = assemble(state);
  if (!text) return null;
  return (
    analyzeSentence(text).find((f) => !(state.kind !== "expand" && f.tag === "CONNECTOR_MISSING"))
      ?.tag || null
  );
}

/**
 * ok / not ok for the CHECK step. `reasons` are codes (FEW, NO_CONN, REL, PUNCT, SYNTAX) the UI turns into hints;
 * `tag` is the syntax pattern, `reportTag` what is logged (a connector that does not fit the relationship also
 * counts as CONNECTOR_MISSING, the Connector Climb rule).
 */
export function evaluate(state) {
  const spec = state.spec;
  const reasons = [];
  if (state.kind !== "combine" && chipCount(state) < needOf(state))
    reasons.push({
      code: "FEW",
      need: needOf(state),
      have: chipCount(state),
      missing: SLOTS.filter((s) => spec.chips?.[s]?.length && !state.adds[s].length),
    });
  let relMiss = false;
  if (state.kind !== "expand") {
    const c = connectorOf(state);
    if (!c) reasons.push({ code: "NO_CONN" });
    else {
      if (c.rel !== spec.rel) {
        reasons.push({ code: "REL", rel: spec.rel, picked: c.rel });
        relMiss = true;
      }
      if (!ACCEPT[c.type].includes(state.joiner))
        reasons.push({ code: "PUNCT", type: c.type, id: c.id, want: ACCEPT[c.type][0] });
    }
  }
  const tag = liveTag(state);
  if (tag) reasons.push({ code: "SYNTAX", tag });
  return {
    ok: reasons.length === 0,
    reasons,
    tag,
    reportTag: tag || (relMiss ? "CONNECTOR_MISSING" : null),
  };
}
/** The tag to log for the round: the first one any check found (the first-try construction, else the final one), or null. */
export const reportedTag = (state) => state.tags.find((t) => TAG_IDS.includes(t)) || null;

// ── a worked answer (reveal, QA plans) ───────────────────────────────────────────────────────────
export function modelAdds(state) {
  const spec = state.spec;
  const adds = { describe: [], who: [], what: [], where: [], when: [], why: [] };
  const fromSpec = (spec.model || []).map((x) => x.split(":"));
  const list = fromSpec.length
    ? fromSpec
    : SLOTS.filter((s) => spec.chips?.[s]?.length).map((s) => [s, spec.chips[s][0].id]);
  for (const [slot, id] of list)
    if (
      adds[slot] &&
      adds[slot].length < slotCap(slot) &&
      chipOf(spec, slot, id) &&
      (fromSpec.length || chipCountOf(adds) < needOf(state))
    )
      adds[slot].push(id);
  return adds;
}
const chipCountOf = (adds) => SLOTS.reduce((n, s) => n + adds[s].length, 0);
export function solution(state) {
  const spec = state.spec;
  const adds = SLOTS.flatMap((slot) => modelAdds(state)[slot].map((id) => ({ slot, id })));
  if (state.kind === "expand") return { adds, conn: null, joiner: null, wrongConn: null };
  const c =
    spec.connectors.find((x) => x.id === spec.conn) ||
    spec.connectors.find((x) => x.rel === spec.rel);
  return {
    adds,
    conn: c.id,
    joiner: ACCEPT[c.type][0],
    wrongConn: spec.connectors.find((x) => x.rel !== spec.rel)?.id || "none",
  };
}
export function modelSentence(state) {
  const sol = solution(state);
  const adds = modelAdds(state);
  return assemble({ ...state, adds, conn: sol.conn, joiner: sol.joiner });
}

// ── state and transitions ────────────────────────────────────────────────────────────────────────
export const stepsOf = (kind) =>
  kind === "expand"
    ? ["base", "expand", "check"]
    : kind === "combine"
      ? ["base", "combine", "check"]
      : [...STEPS];
const emptyAdds = () => ({ describe: [], who: [], what: [], where: [], when: [], why: [] });
const editStep = (state) =>
  state.kind === "combine"
    ? "combine"
    : state.kind === "full" && state.step === "combine"
      ? "combine"
      : "expand";
const lastEdit = (state) => (state.kind === "expand" ? "expand" : "combine");

/** Start a workbench from a spec (see validateSpec). `band` filters the connector chips unless the spec brings its own. */
export function init(spec, { band } = {}) {
  const b = band || spec.band || "3-5";
  const withConns =
    spec.kind === "expand" ? spec : { ...spec, connectors: spec.connectors || connectorsFor(b) };
  return {
    v: WB_VERSION,
    band: b,
    kind: spec.kind,
    spec: withConns,
    step: "base",
    adds: emptyAdds(),
    conn: null,
    joiner: null,
    last: null,
    tags: [],
  };
}

export const canNext = (state) => {
  if (state.step === "check") return false;
  if (state.step === "combine") return Boolean(state.conn && state.joiner);
  return true;
};

/** One transition. Actions: next, back, toggle{slot,id}, conn{id}, joiner{id}, check, revise. */
export function reduce(state, action) {
  const a = action || {};
  switch (a.type) {
    case "next": {
      if (!canNext(state)) return state;
      const steps = stepsOf(state.kind);
      return { ...state, step: steps[steps.indexOf(state.step) + 1] };
    }
    case "back": {
      const steps = stepsOf(state.kind);
      const i = steps.indexOf(state.step);
      return i <= 0 ? state : { ...state, step: steps[i - 1] };
    }
    case "toggle": {
      if (state.step !== "expand" || !SLOTS.includes(a.slot) || !chipOf(state.spec, a.slot, a.id))
        return state;
      const cur = state.adds[a.slot];
      let next;
      if (cur.includes(a.id)) next = cur.filter((x) => x !== a.id);
      else if (slotCap(a.slot) === 1) next = [a.id];
      else if (cur.length < slotCap(a.slot)) next = [...cur, a.id];
      else return state;
      return { ...state, adds: { ...state.adds, [a.slot]: next } };
    }
    case "conn": {
      if (state.step !== "combine" || state.conn === a.id) return state;
      if (a.id !== "none" && !state.spec.connectors?.some((c) => c.id === a.id)) return state;
      return { ...state, conn: a.id };
    }
    case "joiner":
      if (state.step !== "combine" || state.joiner === a.id || !JOINER_IDS.includes(a.id))
        return state;
      return { ...state, joiner: a.id };
    case "check": {
      if (state.step !== "check") return state;
      const ev = evaluate(state);
      return {
        ...state,
        last: { ok: ev.ok, reasons: ev.reasons },
        tags: [...state.tags, ev.reportTag].slice(-8),
      };
    }
    case "revise":
      return state.step === "check" && state.last && !state.last.ok
        ? { ...state, step: lastEdit(state) }
        : state;
    default:
      return state;
  }
}

// ── JSON round-trip (resumable) ──────────────────────────────────────────────────────────────────
export const serialize = (state) => JSON.stringify(state);
/** A state read back from storage, repaired where it can be (unknown chips dropped), or null. Never throws. */
export function normalize(raw) {
  const o = typeof raw === "string" ? safeParse(raw) : raw;
  if (
    !o ||
    typeof o !== "object" ||
    o.v !== WB_VERSION ||
    !KINDS.includes(o.kind) ||
    !o.spec ||
    typeof o.spec !== "object"
  )
    return null;
  if (o.kind !== "combine" && !(o.spec.base?.noun && o.spec.base?.verb)) return null;
  if (o.kind !== "expand" && !(o.spec.a !== undefined || o.kind === "full")) return null;
  if (
    o.kind !== "expand" &&
    !(typeof o.spec.b === "string" && Array.isArray(o.spec.connectors) && RELS[o.spec.rel])
  )
    return null;
  const base = init(o.spec, { band: o.band === "6-8" ? "6-8" : "3-5" });
  const adds = emptyAdds();
  for (const slot of SLOTS)
    for (const id of Array.isArray(o.adds?.[slot]) ? o.adds[slot] : [])
      if (chipOf(o.spec, slot, id) && !adds[slot].includes(id) && adds[slot].length < slotCap(slot))
        adds[slot].push(id);
  const steps = stepsOf(o.kind);
  return {
    ...base,
    spec: o.spec,
    step: steps.includes(o.step) ? o.step : "base",
    adds,
    conn: o.conn === "none" || o.spec.connectors?.some((c) => c.id === o.conn) ? o.conn : null,
    joiner: JOINER_IDS.includes(o.joiner) ? o.joiner : null,
    last:
      o.last && typeof o.last.ok === "boolean" && Array.isArray(o.last.reasons)
        ? { ok: o.last.ok, reasons: o.last.reasons.filter((r) => r && typeof r.code === "string") }
        : null,
    tags: Array.isArray(o.tags)
      ? o.tags.filter((t) => t === null || TAG_IDS.includes(t)).slice(-8)
      : [],
  };
}
const safeParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};
export const restore = normalize;

// ── content validation (used by game validate(content)) ──────────────────────────────────────────
export function validateSpec(spec, at = "workbench") {
  const e = [];
  if (!spec || !KINDS.includes(spec.kind))
    return [`${at}: kind must be one of ${KINDS.join(", ")}`];
  if (!spec.id) e.push(`${at}: needs an id`);
  if (spec.kind !== "combine") {
    if (!spec.base?.noun || !spec.base?.verb) e.push(`${at}: base needs a noun and a verb`);
    let total = 0;
    for (const [slot, list] of Object.entries(spec.chips || {})) {
      if (!SLOTS.includes(slot)) e.push(`${at}: unknown chip group ${slot}`);
      const ids = new Set();
      for (const c of list) {
        total += 1;
        if (!c.id || !/^[a-z0-9-]+$/.test(c.id) || ids.has(c.id))
          e.push(`${at}/${slot}: chip ids must be unique lowercase slugs`);
        ids.add(c.id);
        if (!c.text || !c.es || c.es === c.text)
          e.push(`${at}/${slot}/${c.id}: chip needs English text and a Spanish gloss`);
        if (slot === "describe" && typeof c.rank !== "number")
          e.push(
            `${at}/${slot}/${c.id}: describing chips need a numeric rank (opinion 0 ... material 6)`,
          );
      }
    }
    if (total < 6) e.push(`${at}: needs at least six chips`);
  }
  if (spec.kind !== "expand") {
    if (!spec.b || (spec.kind === "combine" && !spec.a)) e.push(`${at}: needs both clauses`);
    if (!RELS[spec.rel]) e.push(`${at}: unknown relationship ${spec.rel}`);
    if (!(spec.connectors || CONNECTORS).some((c) => c.id === spec.conn))
      e.push(`${at}: conn must be a known connector`);
  }
  if (!e.length) {
    const state = init(spec, { band: "6-8" });
    const model = modelSentence(state);
    if (analyzeSentence(model).some((f) => f.tag !== "CONNECTOR_MISSING" || spec.kind === "expand"))
      e.push(`${at}: the model sentence trips the syntax checker: ${model}`);
  }
  return e;
}

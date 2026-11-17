// Connected Learning Engine — pathways: ONE objective carried through several existing features.
//
//   pathway = { id, objective, title: [en, es], custom, stages: [Stage], supports, rejected, followUp, notes }
//   Stage   = { id, key, kind, feature: [en, es], route, title: [en, es], why: [en, es], evidence: { type, match },
//               optional, linked }
//
// `why` says how the stage serves the shared objective. `evidence` says how completion is detected (progress.js):
// the destination feature's own record, never a click. Built-in pathways are authored below; a teacher's custom
// pathway lives entirely in its URL (/pathways/c?o=<objective>&s=<stage.stage…>&t=<title>&h=&x=&n=) so it can be
// assigned as one class assignment ({ id, title, path, due }) with no new server table. Pure: no DOM, no storage.
import {
  DEST_LEDGER_SRC,
  SIM_MISSION,
  SUPPORTS,
  isLinked,
  objectiveById,
  resolveKey,
  whyFor,
} from "./graph.js";

export const BASE = "/access-practice-lab";
/** Same rules the class server applies (shared/class-platform/contract.js). */
export const ID_OK = /^[a-z0-9][a-z0-9:_-]{0,39}$/;
export const PATH_OK = /^\/[\w\-./?=&%]{0,200}$/;
export const MAX_STAGES = 8;
export const MAX_TITLE = 60;

const FEATURE = {
  access: ["ACCESS Practice Lab", "Laboratorio de práctica ACCESS"],
  speak: ["Speaking Studio", "Estudio de expresión oral"],
  write: ["Writing Studio", "Estudio de escritura"],
  sim: ["Living Simulation", "Simulación viva"],
  book: ["Book Studio", "Book Studio"],
  transfer: ["On my own", "Por mi cuenta"],
  family: ["With my family", "Con mi familia"],
};

/** Built-in pathways. A stage is an activity key; `alt` swaps it for another band; `optional` never blocks. */
const BUILT_IN = [
  {
    id: "explain-with-evidence",
    objective: "explain-with-evidence",
    title: ["Explain an idea using evidence", "Explicar una idea con evidencia"],
    stages: [
      { key: "rread-best-evidence", alt: { "3-5": "rg35-r2-b-mei-proof" } },
      { key: "sspk-evaporation-explain", alt: { "3-5": "rg35-s-c-ice-melt" } },
      { key: `m${SIM_MISSION}` },
      { key: "bevidence-argument" },
      { key: "t" },
      { key: "f", optional: true },
    ],
  },
  {
    id: "explain-cause-effect",
    objective: "explain-cause-effect",
    title: ["Explain why something happened", "Explicar por qué pasó algo"],
    stages: [
      { key: "rexit-ticket-b", alt: { "3-5": "rg35-l-b-muddy-field" } },
      { key: "rread-cause-effect", alt: { "3-5": "rg35-r-b-bats" } },
      { key: "sspk-icemelt-discuss", alt: { "3-5": "rg35-s-b-plant-experiment" } },
      { key: "bcause-effect" },
      { key: "t" },
      { key: "f", optional: true },
    ],
  },
  {
    id: "narrate-events-in-order",
    objective: "narrate-events-in-order",
    title: ["Tell what happened in order", "Contar lo que pasó en orden"],
    stages: [
      { key: "rv10-r-b-sequence-events", alt: { "3-5": "rg35-r2-a-rain-order" } },
      { key: "sspk-slideshow-retell", alt: { "3-5": "rg35-s2-b-retell-story" } },
      { key: "bpersonal-narrative" },
      { key: "t" },
      { key: "f", optional: true },
    ],
  },
  {
    id: "argue-claim-evidence",
    objective: "argue-claim-evidence",
    title: ["Make a claim and support it", "Hacer una afirmación y apoyarla"],
    stages: [
      { key: "r68c-r-street-trees-evidence", alt: { "3-5": "rg35-r-c-author-purpose" } },
      { key: "r68c-l-bee-evidence", alt: { "3-5": "rg35-l-c-speaker-purpose" } },
      { key: "sspk-startime-argue", alt: { "3-5": "rg35-s-c-new-playground" } },
      { key: "bpersuasive-book" },
      { key: "t" },
      { key: "f", optional: true },
    ],
  },
];
export const BUILT_IN_IDS = Object.freeze(BUILT_IN.map((p) => p.id));
export const REFERENCE_ID = "explain-with-evidence";

/** How a stage's completion is detected, from the kind of feature it opens. */
function evidenceFor(ref, runKey) {
  if (ref.kind === "access")
    return {
      type: "record",
      match: { band: ref.band, domain: ref.domain, level: ref.level, id: ref.id },
    };
  if (ref.kind === "speak")
    return { type: "ledger", match: { src: "speaking", task: ref.id, loopSrc: "speak" } };
  if (ref.kind === "write")
    return { type: "ledger", match: { src: "writing", task: ref.id, loopSrc: "write" } };
  if (ref.kind === "sim") return { type: "sim", match: { mission: ref.id } };
  if (ref.kind === "book") return { type: "book", match: { source: `${runKey}:${ref.key}` } };
  if (ref.kind === "transfer")
    return { type: "loop", match: { src: "pathway", taskId: `pw:${runKey}:` } };
  if (ref.kind === "family") return { type: "talk", match: {} };
  if (ref.kind === "dest" && DEST_LEDGER_SRC[ref.id])
    return { type: "ledger", match: { src: DEST_LEDGER_SRC[ref.id] } };
  return { type: "none", match: {} };
}

function makeStage(objective, key, optional, runKey, data) {
  const ref = resolveKey(key, data);
  if (!ref) return null;
  const linked = isLinked(objective.id, key);
  const evidence = evidenceFor(ref, runKey);
  return {
    id: key,
    key,
    kind: ref.kind,
    band: ref.band || "",
    domain: ref.domain || "",
    feature: FEATURE[ref.kind] || ref.title,
    route: ref.route,
    title: ref.title,
    why: linked
      ? whyFor(objective, ref)
      : [
          `Your teacher chose this for the goal: ${objective.title[0]}.`,
          `Tu docente eligió esto para la meta: ${objective.title[1]}.`,
        ],
    evidence,
    // A stage whose work cannot be detected can only ever be an extra: it must never block the pathway.
    optional: Boolean(optional) || evidence.type === "none",
    linked,
  };
}

function assemble(def, band, data, extra = {}) {
  const objective = objectiveById(def.objective);
  if (!objective) return null;
  const notes = [...(extra.notes || [])];
  const stages = [];
  for (const s of def.stages.slice(0, MAX_STAGES)) {
    const key = s.alt?.[band] || s.key;
    if (stages.some((x) => x.key === key)) {
      notes.push({ kind: "duplicate", key });
      continue;
    }
    const stage = makeStage(objective, key, s.optional, def.runKey || def.id, data);
    if (stage) stages.push(stage);
    else notes.push({ kind: "unknown", key });
  }
  return {
    id: def.id,
    runKey: def.runKey || def.id,
    objective: objective.id,
    title: def.title,
    custom: Boolean(def.custom),
    stages,
    supports: def.supports || Object.keys(SUPPORTS),
    rejected: def.rejected || [],
    followUp:
      def.followUp && resolveKey(def.followUp, data) && isLinked(objective.id, def.followUp)
        ? def.followUp
        : "",
    notes,
  };
}

/** A built-in pathway resolved for a band, or null. `data` = { index } (content/index.json). */
export function builtIn(id, band, data) {
  const def = BUILT_IN.find((p) => p.id === id);
  return def ? assemble(def, band === "3-5" ? "3-5" : "6-8", data) : null;
}
export const builtIns = (band, data) =>
  BUILT_IN.map((p) => builtIn(p.id, band, data)).filter(Boolean);
export const builtInDef = (id) => BUILT_IN.find((p) => p.id === id) || null;

// ── custom pathways in a URL ─────────────────────────────────────────────────────────────────────────────────
const hash = (text) => {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
};
export const cleanTitle = (t) =>
  String(t || "")
    .replace(/[^\p{L}\p{N} .-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE);
const encTitle = (t) => encodeURIComponent(cleanTitle(t)).replace(/_/g, "%5F").replace(/%20/g, "_");
const decTitle = (t) => {
  try {
    return cleanTitle(decodeURIComponent(String(t || "").replace(/_/g, " ")));
  } catch {
    return "";
  }
};
const SUPPORT_BY_CODE = Object.fromEntries(Object.entries(SUPPORTS).map(([id, s]) => [s.code, id]));

/** The two long keys every pathway tends to carry are written as one letter: the simulation and the goal's book. */
function shortKeys(objective) {
  const bookKey = objective?.activities.find((a) => a.kind === "book")?.key;
  const out = { [`m${SIM_MISSION}`]: "m", ...(bookKey ? { [bookKey]: "b" } : {}) };
  return { out, back: Object.fromEntries(Object.entries(out).map(([k, v]) => [v, k])) };
}

/**
 * A custom pathway definition → its query string (no leading "?"). Optional stages carry an upper-case first
 * letter. def = { objective, title, stages: [{ key, optional }], supports?: [id], rejected?: [needId], followUp? }.
 */
export function encodeCustom(def) {
  const short = shortKeys(objectiveById(def.objective));
  const stage = (s) => {
    const k = encodeURIComponent(short.out[s.key] || s.key);
    return s.optional ? k[0].toUpperCase() + k.slice(1) : k;
  };
  const parts = [`o=${def.objective}`, `s=${def.stages.map(stage).join(".")}`];
  if (cleanTitle(def.title)) parts.push(`t=${encTitle(def.title)}`);
  const all = Object.keys(SUPPORTS);
  const sup = (def.supports || all).filter((id) => SUPPORTS[id]);
  if (sup.length !== all.length)
    parts.push(`h=${sup.map((id) => SUPPORTS[id].code).join("") || "0"}`);
  if (def.rejected?.length) parts.push(`x=${def.rejected.join(".")}`);
  if (def.followUp) parts.push(`n=${encodeURIComponent(def.followUp)}`);
  return parts.join("&");
}

/** The app-relative path a custom pathway is assigned and shared as. */
export const customPath = (def, band = "6-8") =>
  `${BASE}/pathways/c?${encodeCustom(def)}${band === "3-5" ? "&grades=3-5" : ""}`;

/**
 * Query parameters → a resolved custom pathway with full validation. Unknown stage ids are dropped and listed in
 * `notes`; an unknown objective or an empty stage list gives { pathway: null, notes }.
 * @param {Record<string,string>} q route.q   @param {{index:object}} data
 */
export function decodeCustom(q = {}, band = "6-8", data = {}) {
  const notes = [];
  const objective = objectiveById(String(q.o || ""));
  if (!objective)
    return {
      pathway: null,
      def: null,
      notes: [{ kind: "objective", key: String(q.o || "").slice(0, 40) }],
    };
  const short = shortKeys(objective);
  const stages = String(q.s || "")
    .split(".")
    .filter(Boolean)
    .slice(0, MAX_STAGES + 4)
    .map((raw) => {
      let key = "";
      try {
        key = decodeURIComponent(raw);
      } catch {}
      const optional = /^[A-Z]/.test(key);
      const lower = key ? key[0].toLowerCase() + key.slice(1) : raw.slice(0, 40);
      return { key: short.back[lower] || lower, optional };
    });
  const supports =
    q.h == null
      ? Object.keys(SUPPORTS)
      : [
          ...new Set(
            String(q.h)
              .split("")
              .map((c) => SUPPORT_BY_CODE[c])
              .filter(Boolean),
          ),
        ];
  const needIds = new Set(objective.needs.map((n) => n.id));
  const rejected = String(q.x || "")
    .split(".")
    .filter((id) => needIds.has(id));
  let followUp = "";
  try {
    followUp = q.n ? decodeURIComponent(String(q.n)) : "";
  } catch {}
  const def = {
    custom: true,
    objective: objective.id,
    title: decTitle(q.t),
    stages,
    supports,
    rejected,
    followUp,
  };
  const key = `c-${hash(encodeCustom({ ...def, title: "" }))}`;
  const pathway = assemble(
    { ...def, id: "c", runKey: key, title: def.title ? [def.title, def.title] : objective.title },
    band === "3-5" ? "3-5" : "6-8",
    data,
    { notes },
  );
  if (q.n && !pathway.followUp) pathway.notes.push({ kind: "unknown", key: followUp.slice(0, 40) });
  if (!pathway.stages.length)
    return { pathway: null, def, notes: [...pathway.notes, { kind: "empty", key: "" }] };
  // What is assigned must be what opens: the definition is rebuilt from the stages that survived validation.
  def.stages = pathway.stages.map((s) => ({ key: s.key, optional: s.optional }));
  def.followUp = pathway.followUp;
  return { pathway, def, notes: pathway.notes };
}

/** A built-in pathway as an editable custom definition (the builder's "start from"). */
export function defFromBuiltIn(id, band = "6-8") {
  const p = builtInDef(id);
  if (!p) return null;
  return {
    custom: true,
    objective: p.objective,
    title: p.title[0],
    stages: p.stages.map((s) => ({ key: s.alt?.[band] || s.key, optional: Boolean(s.optional) })),
    supports: Object.keys(SUPPORTS),
    rejected: [],
    followUp: "",
  };
}

/**
 * The built-in pathway a draft is identical to (same steps, nothing changed), or "". An unchanged built-in is
 * assigned by its own short route, so its link stays short enough for a QR code.
 */
export function matchBuiltIn(def, band = "6-8") {
  const all = Object.keys(SUPPORTS);
  if (def.rejected?.length || def.followUp || (def.supports || all).length !== all.length) return "";
  for (const p of BUILT_IN) {
    const same = defFromBuiltIn(p.id, band);
    if (p.objective !== def.objective || (cleanTitle(def.title) && cleanTitle(def.title) !== cleanTitle(same.title))) continue;
    if (same.stages.length === def.stages.length && same.stages.every((s, i) => s.key === def.stages[i].key && s.optional === Boolean(def.stages[i].optional))) return p.id;
  }
  return "";
}

// ── links and the assignment ─────────────────────────────────────────────────────────────────────────────────
/** The route a pathway is opened at (app-relative, with BASE). */
export const pathwayPath = (pathway, def, band = "6-8") =>
  pathway.custom
    ? customPath(def, band)
    : `${BASE}/pathways/${pathway.id}${band === "3-5" ? "?grades=3-5" : ""}`;

/** A stage's link: the feature's own route with the pathway context (?pw=<run key>&st=<stage id>). */
export function stageHref(pathway, stage) {
  if (!stage.route) return "";
  const join = stage.route.includes("?") ? "&" : "?";
  return `${BASE}${stage.route}${join}pw=${encodeURIComponent(pathway.runKey)}&st=${encodeURIComponent(stage.id)}`;
}

/**
 * The ONE class assignment for a pathway, with the checks the class server will make.
 * @returns {{ ok:boolean, assignment:{id,title,path,due}, length:number, problems:string[] }}
 */
export function assignmentFor(pathway, def, band = "6-8") {
  const path = pathwayPath(pathway, def, band);
  const assignment = {
    id: `pw:${pathway.runKey}`.slice(0, 40),
    title: `Pathway: ${pathway.title[0]}`.slice(0, 80),
    path,
    due: null,
  };
  const problems = [];
  if (!ID_OK.test(assignment.id)) problems.push("id");
  if (path.length > 201) problems.push("too-long");
  else if (!PATH_OK.test(path)) problems.push("characters");
  if (!pathway.stages.some((s) => !s.optional)) problems.push("no-required-stage");
  return { ok: problems.length === 0, assignment, length: path.length - 1, problems };
}

/** Structural check of a resolved pathway (tests and the builder). @returns {string[]} problems */
export function validatePathway(pathway) {
  const out = [];
  if (!pathway || !objectiveById(pathway.objective)) return ["unknown objective"];
  if (!pathway.stages.length) out.push("no stages");
  for (const s of pathway.stages) {
    if (!(s.why?.[0] && s.why[1])) out.push(`${s.id}: no why`);
    if (!s.evidence?.type) out.push(`${s.id}: no evidence rule`);
    if (s.evidence?.type === "none" && !s.optional)
      out.push(`${s.id}: cannot be detected, so it must be optional`);
    if (!["transfer", "family", "book"].includes(s.kind) && !s.route) out.push(`${s.id}: no route`);
  }
  return out;
}

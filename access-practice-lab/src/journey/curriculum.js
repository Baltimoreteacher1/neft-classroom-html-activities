// ACCESS Learning Journey — the declarative curriculum: four units, twelve missions, six steps.
// This is the lab's own instructional scope and sequence, not a WIDA-prescribed one. Mission packs live in
// src/content/journey/mNN.js and load on demand; this module holds the shape every pack must satisfy.
// Pure data and checks: no DOM, no storage. Contract: access-practice-lab/JOURNEY.md.

import { STANDARD_CODES, WIDA_LANGUAGE_EXPECTATIONS } from "../acc/wida/catalog.js";
import { GRADE_CLUSTERS } from "../acc/wida/framework.js";

export const BANDS = ["3-5", "6-8"];

/** True when the WIDA framework catalog lists this standard x Key Language Use for a cluster of the grade band. */
export const explicitCombo = (standard, band, klu) =>
  WIDA_LANGUAGE_EXPECTATIONS.some((x) => x.standard === standard && x.keyUse === klu && (x.gradeCluster ? GRADE_CLUSTERS[band].includes(x.gradeCluster) : x.gradeClusters?.some((c) => GRADE_CLUSTERS[band].includes(c))));
export const KLUS = ["Narrate", "Inform", "Explain", "Argue"];

/** The six-part mission cycle. `engine` names the Language Reality Engine innovation each step runs. */
export const STEPS = [
  {
    id: "discover",
    n: 1,
    icon: "search",
    engine: "scene",
    label: ["Discover", "Descubre"],
    purpose: [
      "Look into a real situation and wonder why.",
      "Investiga una situación real y pregúntate por qué.",
    ],
    minutes: 8,
  },
  {
    id: "understand",
    n: 2,
    icon: "listening",
    engine: "listen+read",
    label: ["Understand", "Comprende"],
    purpose: ["Listen and read to build understanding.", "Escucha y lee para comprender."],
    minutes: 12,
  },
  {
    id: "build",
    n: 3,
    icon: "construction",
    engine: "build",
    label: ["Build", "Construye"],
    purpose: [
      "Take language apart and put it together.",
      "Desarma el lenguaje y vuelve a armarlo.",
    ],
    minutes: 10,
  },
  {
    id: "communicate",
    n: 4,
    icon: "speaking",
    engine: "converse|compose",
    label: ["Communicate", "Comunica"],
    purpose: ["Say or write it for a real audience.", "Dilo o escríbelo para un público real."],
    minutes: 12,
  },
  {
    id: "improve",
    n: 5,
    icon: "growth",
    engine: "mirror",
    label: ["Improve", "Mejora"],
    purpose: ["Use feedback to make it stronger.", "Usa los comentarios para mejorarlo."],
    minutes: 10,
  },
  {
    id: "show",
    n: 6,
    icon: "flag",
    engine: "mirror-independent",
    label: ["Show", "Muestra"],
    purpose: ["Try a new task on your own.", "Prueba una tarea nueva por tu cuenta."],
    minutes: 10,
  },
];
export const STEP_IDS = STEPS.map((s) => s.id);
export const stepInfo = (id) => STEPS.find((s) => s.id === id);

/** Four units, one Key Language Use emphasis each. All four uses recur everywhere; the emphasis is an organizing priority. */
export const UNITS = [
  {
    n: 1,
    id: "u1",
    klu: "Narrate",
    title: ["Tell and Connect", "Cuenta y conecta"],
    blurb: [
      "Tell about people, places and events so a listener can follow.",
      "Cuenta sobre personas, lugares y sucesos para que otros te sigan.",
    ],
    missions: ["m01", "m02", "m03"],
  },
  {
    n: 2,
    id: "u2",
    klu: "Inform",
    title: ["Explore and Inform", "Explora e informa"],
    blurb: [
      "Describe, compare and report what you learn.",
      "Describe, compara e informa lo que aprendes.",
    ],
    missions: ["m04", "m05", "m06"],
  },
  {
    n: 3,
    id: "u3",
    klu: "Explain",
    title: ["Investigate and Explain", "Investiga y explica"],
    blurb: [
      "Explain how things work and why things happen.",
      "Explica cómo funcionan las cosas y por qué suceden.",
    ],
    missions: ["m07", "m08", "m09"],
  },
  {
    n: 4,
    id: "u4",
    klu: "Argue",
    title: ["Reason and Advocate", "Razona y defiende"],
    blurb: [
      "Make a claim, use evidence and respond to other views.",
      "Haz una afirmación, usa evidencia y responde a otros puntos de vista.",
    ],
    missions: ["m10", "m11", "m12"],
  },
];

/** The eight places language happens. Every environment is used by at least one mission. */
export const ENVIRONMENTS = [
  "classroom",
  "lab",
  "garden",
  "community",
  "museum",
  "library",
  "map",
  "debate",
];

/** Language features that spiral through the units. A mission lists the ones it teaches and the earlier missions it revisits. */
export const FEATURES = {
  sequence: { label: ["Sequence and time words", "Secuencia y palabras de tiempo"] },
  description: { label: ["Precise description", "Descripción precisa"] },
  cohesion: { label: ["Linking ideas (cohesion)", "Conectar ideas (cohesión)"] },
  reference: {
    label: ["Clear references (it, they, this)", "Referencias claras (él, ella, esto)"],
  },
  perspective: { label: ["Point of view", "Punto de vista"] },
  classification: { label: ["Classifying and defining", "Clasificar y definir"] },
  comparison: { label: ["Comparing and contrasting", "Comparar y contrastar"] },
  "main-idea": { label: ["Main ideas and details", "Ideas principales y detalles"] },
  process: { label: ["Process language", "Lenguaje de procesos"] },
  "cause-effect": { label: ["Cause and effect", "Causa y efecto"] },
  evidence: { label: ["Using evidence", "Usar evidencia"] },
  clarification: { label: ["Asking for and giving clarification", "Pedir y dar aclaraciones"] },
  claim: { label: ["Claims and reasons", "Afirmaciones y razones"] },
  counterclaim: {
    label: ["Other views and counterclaims", "Otros puntos de vista y contraargumentos"],
  },
  revision: { label: ["Revising", "Revisar"] },
};

/** Registry: id -> unit, Key Language Use, loader. Packs load lazily so the route stays small. */
export const MISSION_IDS = UNITS.flatMap((u) => u.missions);
const cache = new Map();

export async function loadMission(id) {
  if (!MISSION_IDS.includes(id)) throw new Error(`Unknown mission: ${id}`);
  if (!cache.has(id))
    cache.set(
      id,
      import(`../content/journey/${id}.js`).then((m) => m.default),
    );
  return cache.get(id);
}

export const unitOf = (id) => UNITS.find((u) => u.missions.includes(id));
export const missionNumber = (id) => MISSION_IDS.indexOf(id) + 1;
export const nextMissionId = (id) => MISSION_IDS[MISSION_IDS.indexOf(id) + 1] || null;
export const missionIdFromParam = (param) => {
  const p = String(param || "").toLowerCase();
  if (MISSION_IDS.includes(p)) return p;
  const n = Number(p.replace(/^m/, ""));
  return Number.isInteger(n) && n >= 1 && n <= MISSION_IDS.length ? MISSION_IDS[n - 1] : "";
};

const wida = (std68, std35 = std68, d35 = ["Discourse", "Sentence"], d68 = ["Discourse", "Sentence", "Word/Phrase"]) => ({
  "3-5": { standard: std35, dimensions: d35 },
  "6-8": { standard: std68, dimensions: d68 },
});

/**
 * The static mission index: everything the map, home, teacher guide and recommender need WITHOUT loading a pack.
 * One source of truth for title, goal, environment, spiral features/review edges and WIDA references.
 * `wida.standard` is a framework standard code whose standard x Key Language Use row exists for the grade band
 * (checked by validateIndex); this lab's mission design is its own, not a WIDA-prescribed sequence.
 */
export const MISSIONS = {
  m01: {
    klu: "Narrate", environment: "classroom", features: ["description", "sequence", "cohesion", "reference"], reviews: [],
    title: ["My World, My Story", "Mi mundo, mi historia"],
    tagline: ["Describe people and places, then tell a short story.", "Describe personas y lugares, y luego cuenta una historia corta."],
    goal: {
      "3-5": ["I can describe a person or place and tell what happened in order.", "Puedo describir una persona o un lugar y contar lo que pasó en orden."],
      "6-8": ["I can tell a short story with details, time words and clear references.", "Puedo contar una historia corta con detalles, palabras de tiempo y referencias claras."],
    },
    wida: wida("ELD-LA"),
  },
  m02: {
    klu: "Narrate", environment: "library", features: ["sequence", "cohesion", "description"], reviews: ["m01"],
    title: ["Stories in Motion", "Historias en movimiento"],
    tagline: ["Follow events as they change, and retell them in order.", "Sigue los sucesos mientras cambian y vuelve a contarlos en orden."],
    goal: {
      "3-5": ["I can put events in order and use time words to retell a story.", "Puedo ordenar sucesos y usar palabras de tiempo para volver a contar una historia."],
      "6-8": ["I can show how events connect, with transitions and dialogue.", "Puedo mostrar cómo se conectan los sucesos, con transiciones y diálogo."],
    },
    wida: wida("ELD-LA"),
  },
  m03: {
    klu: "Narrate", environment: "community", features: ["perspective", "comparison", "reference", "cohesion"], reviews: ["m02", "m01"],
    title: ["Different Perspectives", "Distintos puntos de vista"],
    tagline: ["Compare two accounts of one event and tell it from another view.", "Compara dos relatos de un mismo suceso y cuéntalo desde otro punto de vista."],
    goal: {
      "3-5": ["I can tell what happened from two different points of view.", "Puedo contar lo que pasó desde dos puntos de vista distintos."],
      "6-8": ["I can compare accounts and narrate from a chosen perspective for an audience.", "Puedo comparar relatos y narrar desde una perspectiva elegida para un público."],
    },
    wida: wida("ELD-LA"),
  },
  m04: {
    klu: "Inform", environment: "lab", features: ["description", "classification", "main-idea"], reviews: ["m01"],
    title: ["Observe and Describe", "Observa y describe"],
    tagline: ["Look closely at something and describe it with precise facts.", "Observa algo de cerca y descríbelo con datos precisos."],
    goal: {
      "3-5": ["I can describe an object with exact details and say what kind of thing it is.", "Puedo describir un objeto con detalles exactos y decir qué tipo de cosa es."],
      "6-8": ["I can write an informative description using precise words and facts.", "Puedo escribir una descripción informativa con palabras precisas y datos."],
    },
    wida: wida("ELD-LA"),
  },
  m05: {
    klu: "Inform", environment: "map", features: ["comparison", "classification", "evidence"], reviews: ["m04", "m03"],
    title: ["Compare and Classify", "Compara y clasifica"],
    tagline: ["Sort places or living things and say how they are alike and different.", "Clasifica lugares o seres vivos y di en qué se parecen y se diferencian."],
    goal: {
      "3-5": ["I can say how two things are alike and different, using facts.", "Puedo decir en qué se parecen y se diferencian dos cosas, usando datos."],
      "6-8": ["I can present an organized comparison using evidence from sources.", "Puedo presentar una comparación organizada usando evidencia de fuentes."],
    },
    wida: wida("ELD-LA"),
  },
  m06: {
    klu: "Inform", environment: "library", features: ["main-idea", "evidence", "cohesion"], reviews: ["m05", "m02"],
    title: ["Research and Report", "Investiga e informa"],
    tagline: ["Gather facts from more than one source and report them clearly.", "Reúne datos de más de una fuente e infórmalos con claridad."],
    goal: {
      "3-5": ["I can find the main idea and details in sources and report them.", "Puedo encontrar la idea principal y los detalles en las fuentes e informarlos."],
      "6-8": ["I can combine information from sources into a short, organized report.", "Puedo combinar información de varias fuentes en un informe corto y organizado."],
    },
    wida: wida("ELD-LA"),
  },
  m07: {
    klu: "Explain", environment: "lab", features: ["process", "sequence", "cohesion"], reviews: ["m02", "m06"],
    title: ["How Things Work", "Cómo funcionan las cosas"],
    tagline: ["Investigate a process and explain it step by step.", "Investiga un proceso y explícalo paso a paso."],
    goal: {
      "3-5": ["I can explain the steps of how something works, in order.", "Puedo explicar en orden los pasos de cómo funciona algo."],
      "6-8": ["I can explain how a process works with precise verbs and time relationships.", "Puedo explicar cómo funciona un proceso con verbos precisos y relaciones de tiempo."],
    },
    wida: wida("ELD-SC"),
  },
  m08: {
    klu: "Explain", environment: "garden", features: ["cause-effect", "evidence", "process"], reviews: ["m07", "m06"],
    title: ["Causes and Consequences", "Causas y consecuencias"],
    tagline: ["Save the School Garden: find out why, and say it with evidence.", "Salvemos el huerto escolar: descubre por qué y explícalo con evidencia."],
    goal: {
      "3-5": ["I can explain why something happens and what happens because of it, using a fact.", "Puedo explicar por qué sucede algo y qué pasa por eso, usando un dato."],
      "6-8": ["I can explain a chain of causes and effects and support it with evidence.", "Puedo explicar una cadena de causas y efectos y apoyarla con evidencia."],
    },
    wida: wida("ELD-SC"),
  },
  m09: {
    klu: "Explain", environment: "museum", features: ["evidence", "clarification", "revision", "cause-effect"], reviews: ["m08", "m06"],
    title: ["Solve the Mystery", "Resuelve el misterio"],
    tagline: ["Observe, infer and explain, then change your mind when the evidence says so.", "Observa, infiere y explica, y cambia de idea cuando la evidencia lo indique."],
    goal: {
      "3-5": ["I can use clues to explain what happened and change my idea if I find new clues.", "Puedo usar pistas para explicar qué pasó y cambiar de idea si encuentro pistas nuevas."],
      "6-8": ["I can justify an explanation with evidence and revise it when new evidence appears.", "Puedo justificar una explicación con evidencia y revisarla cuando aparece evidencia nueva."],
    },
    wida: wida("ELD-SC"),
  },
  m10: {
    klu: "Argue", environment: "community", features: ["claim", "evidence", "cohesion"], reviews: ["m08", "m06"],
    title: ["Make a Claim", "Haz una afirmación"],
    tagline: ["Take a position on a real question and support it.", "Toma una postura sobre una pregunta real y apóyala."],
    goal: {
      "3-5": ["I can say what I think, give a reason, and add a fact.", "Puedo decir lo que pienso, dar una razón y añadir un dato."],
      "6-8": ["I can state a clear claim and support it with reasons and relevant evidence.", "Puedo enunciar una afirmación clara y apoyarla con razones y evidencia relevante."],
    },
    wida: wida("ELD-SS"),
  },
  m11: {
    klu: "Argue", environment: "debate", features: ["counterclaim", "perspective", "clarification", "evidence"], reviews: ["m10", "m03"],
    title: ["Evidence and Perspectives", "Evidencia y perspectivas"],
    tagline: ["Weigh different positions, ask for clarification and defend your own.", "Sopesa distintas posturas, pide aclaraciones y defiende la tuya."],
    goal: {
      "3-5": ["I can listen to another idea, ask a question, and explain why I agree or disagree.", "Puedo escuchar otra idea, hacer una pregunta y explicar por qué estoy o no de acuerdo."],
      "6-8": ["I can discuss and defend a position using evidence, and respond to another view.", "Puedo discutir y defender una postura con evidencia y responder a otro punto de vista."],
    },
    wida: wida("ELD-LA"),
  },
  m12: {
    klu: "Argue", environment: "community", features: ["claim", "evidence", "cause-effect", "revision", "counterclaim", "clarification"], reviews: ["m11", "m09", "m08"],
    title: ["The Community Challenge", "El reto de la comunidad"],
    tagline: ["Listen, read, discuss and write a recommendation for a real school or community problem.", "Escucha, lee, conversa y escribe una recomendación para un problema real de la escuela o la comunidad."],
    goal: {
      "3-5": ["I can use what I heard and read to recommend a solution and say why.", "Puedo usar lo que escuché y leí para recomendar una solución y decir por qué."],
      "6-8": ["I can produce an evidence-based recommendation for a specific audience and revise it.", "Puedo elaborar una recomendación basada en evidencia para un público específico y revisarla."],
    },
    wida: wida("ELD-SS"),
  },
};

// ── validation ────────────────────────────────────────────────────────────────
const isStr = (x) => typeof x === "string" && x.trim().length > 0;
const isPair = (x) => Array.isArray(x) && x.length === 2 && isStr(x[0]) && isStr(x[1]);
const ids = (list) => (Array.isArray(list) ? list.map((x) => x?.id) : []);
const dupes = (list) => list.filter((x, i) => list.indexOf(x) !== i);

/** Every bilingual pair found anywhere under `node` that is shaped like a pair but is incomplete. */
function pairsIn(node, path, out) {
  if (Array.isArray(node)) {
    const looksPair = node.length === 2 && node.every((x) => typeof x === "string");
    if (
      looksPair &&
      !isPair(node) &&
      path.some((p) =>
        /title|goal|label|why|blurb|tagline|practicing|talk|challenge|revise|homeLanguage|fiveMinute|listenOrRead|role/.test(
          String(p),
        ),
      )
    )
      out.push(`${path.join(".")}: bilingual pair needs non-empty English and Spanish`);
    node.forEach((x, i) => pairsIn(x, [...path, i], out));
  } else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) pairsIn(v, [...path, k], out);
}

function checkScene(t, at, e) {
  if (t?.kind !== "scene") return e.push(`${at}: kind must be "scene"`);
  if (!isStr(t.prompt)) e.push(`${at}: prompt`);
  if (!Array.isArray(t.objects) || t.objects.length < 3) e.push(`${at}: at least 3 objects`);
  for (const o of t.objects || [])
    if (
      !isStr(o.id) ||
      !isStr(o.label) ||
      !isStr(o.note) ||
      typeof o.relevant !== "boolean" ||
      !(o.x >= 0 && o.x <= 100) ||
      !(o.y >= 0 && o.y <= 100)
    )
      e.push(`${at}: object ${o.id} needs id, label, note, relevant, x, y`);
  if (dupes(ids(t.objects)).length) e.push(`${at}: duplicate object ids`);
  if (!(t.collect >= 1 && t.collect <= (t.objects || []).length))
    e.push(`${at}: collect must be 1..objects`);
  if (!Array.isArray(t.controls) || !t.controls.length) e.push(`${at}: at least one control`);
  for (const c of t.controls || []) {
    if (!isStr(c.id) || !isStr(c.label) || !Array.isArray(c.options) || c.options.length < 2)
      e.push(`${at}: control ${c.id} needs 2+ options`);
    else if (!c.options.some((o) => o.id === c.initial))
      e.push(`${at}: control ${c.id} initial is not an option`);
  }
  if (!Array.isArray(t.outcomes) || !t.outcomes.length) e.push(`${at}: outcomes`);
  for (const o of t.outcomes || []) {
    if (!isStr(o.state) || !["good", "warn", "bad"].includes(o.mood) || !isStr(o.key))
      e.push(`${at}: outcome ${o.key} needs state, mood, key`);
    for (const [cid, oid] of Object.entries(o.when || {})) {
      const c = (t.controls || []).find((x) => x.id === cid);
      if (!c || !c.options.some((x) => x.id === oid))
        e.push(`${at}: outcome ${o.key} references unknown control/option ${cid}=${oid}`);
    }
  }
  if (!Array.isArray(t.variables) || t.variables.length < 2)
    e.push(`${at}: at least 2 variables (valid lines of reasoning)`);
  for (const v of t.variables || [])
    if (!isStr(v.id) || !Array.isArray(v.terms) || !v.terms.length || !isStr(v.probe))
      e.push(`${at}: variable ${v.id} needs terms and probe`);
  for (const k of ["name", "opening", "noCause", "noEvidence", "thanks"])
    if (!isStr(t.partner?.[k])) e.push(`${at}: partner.${k}`);
  if (!isStr(t.respond?.prompt) || !(t.respond.minWords >= 5))
    e.push(`${at}: respond.prompt and minWords`);
}

function checkListen(t, at, e) {
  if (t?.kind !== "listen") return e.push(`${at}: kind must be "listen"`);
  if (!["arrange", "place", "sort", "follow"].includes(t.mode)) e.push(`${at}: mode`);
  const us = ids(t.script);
  if (us.length < 4 || dupes(us).length) e.push(`${at}: script needs 4+ unique utterances`);
  const items = ids(t.items);
  const targets = ids(t.targets);
  if (items.length < 3) e.push(`${at}: 3+ items`);
  if (!targets.length) e.push(`${at}: targets`);
  if (!Array.isArray(t.expect) || t.expect.length < 3) e.push(`${at}: 3+ expect rows`);
  for (const x of t.expect || []) {
    if (!items.includes(x.item)) e.push(`${at}: expect item ${x.item} unknown`);
    if (!targets.includes(x.target)) e.push(`${at}: expect target ${x.target} unknown`);
    if (!us.includes(x.utterance)) e.push(`${at}: expect utterance ${x.utterance} unknown`);
  }
  if (t.mode === "place" && !(t.grid?.cols >= 2 && t.grid?.rows >= 2))
    e.push(`${at}: place mode needs grid`);
  if (t.final) checkListen({ ...t, ...t.final, final: undefined }, `${at}.final`, e);
}

function checkRead(t, at, e) {
  if (t?.kind !== "read") return e.push(`${at}: kind must be "read"`);
  const passage = (p, a) => {
    const sid = ids(p);
    if (sid.length < 5 || dupes(sid).length) e.push(`${a}: passage needs 5+ unique sentences`);
    for (const s of p || [])
      if (!isStr(s.text) || !isStr(s.role)) e.push(`${a}: sentence ${s.id} needs text and role`);
    return sid;
  };
  const sid = passage(t.passage, `${at}.passage`);
  const c = t.challenge;
  if (!c || !["evidence", "cause-effect", "sequence", "perspective"].includes(c.type))
    return e.push(`${at}: challenge.type`);
  if (!sid.includes(c.claim)) e.push(`${at}: challenge.claim not a sentence`);
  if (!(c.valid || []).every((x) => sid.includes(x)) || (c.valid || []).length < (c.minValid || 1))
    e.push(`${at}: challenge.valid must exist and cover minValid`);
  if (!(c.weak || []).every((x) => sid.includes(x))) e.push(`${at}: challenge.weak ids`);
  if ((c.weak || []).some((x) => (c.valid || []).includes(x)))
    e.push(`${at}: a sentence cannot be both valid and weak`);
  if (!isStr(c.explainFrame)) e.push(`${at}: challenge.explainFrame`);
  for (const k of t.claimOptions || []) if (!sid.includes(k)) e.push(`${at}: claimOption ${k}`);
  if (!(t.claimOptions || []).includes(c.claim))
    e.push(`${at}: claimOptions must include the challenge claim`);
  const tr = c.transfer;
  if (!tr) return e.push(`${at}: challenge.transfer (new passage for the independent repeat)`);
  const tid = passage(tr.passage, `${at}.transfer`);
  if (
    !tid.includes(tr.claim) ||
    !(tr.valid || []).length ||
    !(tr.valid || []).every((x) => tid.includes(x))
  )
    e.push(`${at}: transfer claim/valid ids`);
  for (const r of t.refs || [])
    if (!sid.includes(r.sentence) || !isStr(r.phrase) || !isStr(r.means))
      e.push(`${at}: ref ${r.phrase}`);
  for (const layer of ["meaning", "discourse", "sentence", "word"])
    for (const a of t.layers?.[layer] || [])
      if (!sid.includes(a.s) || !isStr(a.phrase) || !isStr(a.label))
        e.push(`${at}: layer ${layer} annotation`);
  for (const layer of ["meaning", "discourse", "sentence", "word"]) {
    for (const a of t.layers?.[layer] || []) {
      const s = (t.passage || []).find((x) => x.id === a.s);
      if (s && !s.text.toLowerCase().includes(String(a.phrase).toLowerCase()))
        e.push(`${at}: layer ${layer} phrase "${a.phrase}" not found in ${a.s}`);
    }
  }
}

const BUILD_MODULES = ["expand", "combine", "connector", "morphology", "pronoun", "discourse"];
function checkBuild(t, at, e) {
  if (t?.kind !== "build" || !BUILD_MODULES.includes(t.module))
    return e.push(`${at}: kind "build" and a valid module`);
  if (!isStr(t.title)) e.push(`${at}: title`);
  if (!t.transfer) e.push(`${at}: transfer item for independent use`);
  if (t.module === "expand" && (!isStr(t.base) || !(t.needs || []).length))
    e.push(`${at}: expand needs base and needs`);
  if (t.module === "combine" && (!Array.isArray(t.pair) || t.pair.length !== 2 || !t.relation))
    e.push(`${at}: combine needs pair[2] and relation`);
  if (t.module === "connector")
    for (const g of t.gaps || [])
      if (!(g.ok || []).length || !(g.ok || []).every((o) => (g.options || []).includes(o)))
        e.push(`${at}: connector gap ok must be among options`);
  if (t.module === "connector" && !(t.gaps || []).length) e.push(`${at}: connector gaps`);
  if (t.module === "morphology" && !(t.words || []).length) e.push(`${at}: morphology words`);
  if (t.module === "pronoun")
    for (const p of t.pronouns || [])
      if (!(p.options || []).includes(p.ok)) e.push(`${at}: pronoun ok must be among options`);
  if (t.module === "discourse") {
    const u = ids(t.units);
    if (
      u.length < 3 ||
      !Array.isArray(t.order) ||
      t.order.length !== u.length ||
      !t.order.every((x) => u.includes(x))
    )
      e.push(`${at}: discourse order must list every unit`);
  }
}

function checkComm(t, at, e) {
  if (!["converse", "compose"].includes(t?.kind))
    return e.push(`${at}: kind must be "converse" or "compose"`);
  if (!isStr(t.prompt)) e.push(`${at}: prompt`);
  if (!(t.minWords >= 8)) e.push(`${at}: minWords >= 8`);
  if (!Array.isArray(t.topicTerms) || t.topicTerms.length < 3) e.push(`${at}: 3+ topicTerms`);
  if (t.kind === "converse") {
    if (!["discuss", "speak"].includes(t.mode)) e.push(`${at}: mode discuss|speak`);
    if (!isStr(t.partner?.name) || !isStr(t.partner?.opening))
      e.push(`${at}: partner name and opening`);
    if (!Array.isArray(t.lines) || t.lines.length < 2)
      e.push(`${at}: 2+ lines (valid lines of reasoning)`);
    for (const l of t.lines || [])
      if (!isStr(l.id) || !(l.terms || []).length || !isStr(l.ack) || !isStr(l.probe))
        e.push(`${at}: line ${l.id} needs terms, ack, probe`);
    if (!t.followUps || Object.keys(t.followUps).length < 3)
      e.push(`${at}: followUps for the Key Language Use moves`);
  } else {
    if (t.mode !== "write") e.push(`${at}: compose mode must be "write"`);
    if (!isPair(t.audience)) e.push(`${at}: audience pair`);
    if (!Array.isArray(t.organizer) || t.organizer.length < 3) e.push(`${at}: organizer`);
    if (!t.readerQuestions || Object.keys(t.readerQuestions).length < 2)
      e.push(`${at}: readerQuestions`);
  }
}

/**
 * Check one mission pack. Returns a list of problems (empty = valid). The checks are structural and referential;
 * wording rules (no score claims, no answers in hints) are enforced by tools/access-journey.test.mjs.
 */
export function validateMission(pack) {
  const e = [];
  if (!pack || typeof pack !== "object") return ["pack is not an object"];
  const id = pack.id;
  const m = MISSIONS[id];
  if (!m) e.push(`unknown id ${id}`);
  if (pack.n !== undefined || pack.title || pack.features || pack.wida || pack.family)
    e.push("a pack holds only { id, bands }; title, goal, features, reviews and WIDA live in MISSIONS, family text in content/journey/family.js");
  for (const b of BANDS) {
    const x = pack.bands?.[b];
    const at = `${id}.${b}`;
    if (!x) {
      e.push(`${at}: band missing`);
      continue;
    }
    if (m && x.environment !== m.environment) e.push(`${at}: environment must be "${m.environment}"`);
    if (!isPair(x.context?.title) || !isStr(x.context?.premise) || !(x.context?.cast || []).length)
      e.push(`${at}: context title/premise/cast`);
    if (
      !Array.isArray(x.vocab) ||
      x.vocab.length < 6 ||
      !x.vocab.every((v) => Array.isArray(v) && v.length === 3 && v.every(isStr))
    )
      e.push(`${at}: vocab needs 6+ [term, meaning, es] triples`);
    if (
      !x.frames ||
      !Array.isArray(x.frames.A) ||
      !x.frames.A.length ||
      !Array.isArray(x.frames.B) ||
      !x.frames.B.length
    )
      e.push(`${at}: frames.A and frames.B`);
    checkScene(x.discover, `${at}.discover`, e);
    checkListen(x.understand?.listen, `${at}.understand.listen`, e);
    checkRead(x.understand?.read, `${at}.understand.read`, e);
    if (!Array.isArray(x.build) || !x.build.length) e.push(`${at}: build modules`);
    (x.build || []).forEach((m, i) => checkBuild(m, `${at}.build[${i}]`, e));
    checkComm(x.communicate, `${at}.communicate`, e);
    checkComm(x.show, `${at}.show`, e);
    if (x.show && x.communicate && x.show.prompt === x.communicate.prompt)
      e.push(`${at}: show must be a NEW task`);
    if (x.show?.evidenceBank?.length && x.show.kind === "converse")
      e.push(`${at}: show must be independent (no evidenceBank)`);
    if (
      !x.improve ||
      typeof x.improve.models !== "object" ||
      !Array.isArray(x.improve.whys) ||
      x.improve.whys.length < 2
    )
      e.push(`${at}: improve.models and 2+ improve.whys`);
    for (const w of x.improve?.whys || [])
      if (!isStr(w.id) || !isStr(w.text) || !Array.isArray(w.moves))
        e.push(`${at}: improve.why ${w.id}`);
  }
  pairsIn(pack, [], e);
  return e;
}

/** Check the static index (MISSIONS): bilingual text, WIDA combinations, spiral edges that share a feature. */
export function validateIndex() {
  const e = [];
  const usedEnv = new Set();
  for (const id of MISSION_IDS) {
    const m = MISSIONS[id];
    if (!m) {
      e.push(`${id}: missing from MISSIONS`);
      continue;
    }
    const u = unitOf(id);
    if (m.klu !== u.klu && !KLUS.includes(m.klu)) e.push(`${id}: klu`);
    if (!isPair(m.title) || !isPair(m.tagline)) e.push(`${id}: title/tagline pairs`);
    if (!ENVIRONMENTS.includes(m.environment)) e.push(`${id}: environment`);
    usedEnv.add(m.environment);
    if (!m.features?.length || !m.features.every((f) => FEATURES[f])) e.push(`${id}: features`);
    for (const r of m.reviews || []) {
      if (missionNumber(r) >= missionNumber(id)) e.push(`${id}: review ${r} is not earlier`);
      else if (!MISSIONS[r].features.some((f) => m.features.includes(f))) e.push(`${id}: review ${r} shares no feature (not a spiral edge)`);
    }
    if (missionNumber(id) > 1 && !(m.reviews || []).length) e.push(`${id}: needs a review edge`);
    for (const b of BANDS) {
      if (!isPair(m.goal?.[b])) e.push(`${id}.goal.${b}`);
      const w = m.wida?.[b];
      if (!w || !STANDARD_CODES.has(w.standard)) e.push(`${id}.wida.${b}.standard`);
      else if (!explicitCombo(w.standard, b, m.klu)) e.push(`${id}.wida.${b}: ${w.standard} x ${m.klu} is not an explicit framework combination`);
      if (!w?.dimensions?.length || !w.dimensions.every((d) => ["Discourse", "Sentence", "Word/Phrase"].includes(d))) e.push(`${id}.wida.${b}.dimensions`);
    }
  }
  for (const env of ENVIRONMENTS) if (!usedEnv.has(env)) e.push(`environment ${env} is not used by any mission`);
  for (const u of UNITS) if (!u.missions.every((id) => MISSIONS[id]?.klu === u.klu)) e.push(`unit ${u.n}: every mission carries the unit's Key Language Use as its emphasis`);
  const feats = new Set(MISSION_IDS.flatMap((id) => MISSIONS[id].features));
  for (const f of Object.keys(FEATURES)) if (!feats.has(f)) e.push(`feature ${f} is taught by no mission`);
  return e;
}

/** Check one family companion (content/journey/family.js entry): every field bilingual, both bands. */
export function validateFamily(f, id = "family") {
  const e = [];
  if (!f) return [`${id}: companion missing`];
  for (const k of ["goal", "practicing", "why", "listenOrRead", "challenge", "revise", "homeLanguage"]) if (!isPair(f[k])) e.push(`${id}.${k} bilingual pair`);
  for (const k of ["fiveMinute", "talk"]) for (const b of BANDS) if (!isPair(f[k]?.[b])) e.push(`${id}.${k}.${b} bilingual pair`);
  if (!Array.isArray(f.frames) || f.frames.length < 3 || !f.frames.every(isPair)) e.push(`${id}.frames: 3+ bilingual pairs`);
  return e;
}

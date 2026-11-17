// Connected Learning Engine — the skill graph (docs/part2-integration-map.md, "Objectives and pathways").
// One language objective (a stable slug) is linked to everything the lab already has for it: its Key Language Use
// (src/lang/klu.js), the WIDA framework entries it sits beside (src/acc/wida/catalog.js — the ONE catalog; nothing
// is re-listed here), the three language dimensions, real activities (ACCESS bank items, studio tasks, the
// simulation, labs, book templates), supports, the evidence sources that count for it, instructional needs and
// independent transfer tasks. Pure data + functions: no DOM, no storage.
//
// Rules kept here: an objective never names a level or a score; every activity is a route that exists
// (validateGraph proves it against the sitemap, content/index.json and the studio task list); an objective claims a
// domain only when it has an activity in that domain.
import { WIDA_LANGUAGE_EXPECTATIONS } from "../acc/wida/catalog.js";
import { GRADE_CLUSTERS, STANDARD_LABEL } from "../acc/wida/framework.js";
import { KEY_LANGUAGE_USES, KLU_REFERENCE } from "../lang/klu.js";
import { SKILLS } from "../lang/skill-graph.js";
import { DEST_BY_ID } from "../sitemap.js";
import { ARGUE } from "./objectives-argue.js";
import { EXPLAIN } from "./objectives-explain.js";
import { NARRATE_INFORM } from "./objectives-narrate-inform.js";
import { BANDS, DIMENSIONS, DOMAINS, SIM_MISSION, SUPPORTS } from "./refs.js";

export { BANDS, DEST_LEDGER_SRC, DIMENSIONS, DOMAINS, SIM_MISSION, SUPPORTS } from "./refs.js";


/**
 * @typedef {{ id:string, keyUse:string, standards:string[], skills:string[], domains:string[], title:string[],
 *   student:string[], features:Record<string,string[]>, activities:object[], supports:string[],
 *   evidence:{ledger:string[], loop:string[]}, needs:{id:string, sign:string[], activity:string}[],
 *   transfer:{id:string, prompt:string[]}[], frames:string[][], talk:string[][], stretch:string }} Objective
 */
/** @type {readonly Objective[]} */
export const OBJECTIVES = Object.freeze(
  [...EXPLAIN, ...NARRATE_INFORM, ...ARGUE].map((o) =>
    Object.freeze({
      supports: Object.keys(SUPPORTS),
      evidence: {
        ledger: [
          "speaking",
          "writing",
          "item",
          "intel:speak",
          "intel:write",
          "intel:sim",
          "intel:pathway",
          "intel:book",
          "intel:access",
        ],
        loop: ["speak", "write", "book", "access", "sim", "pathway"],
      },
      ...o,
      domains: DOMAINS.filter((d) => o.activities.some((a) => a.domain === d)),
    }),
  ),
);

const BY_ID = new Map(OBJECTIVES.map((o) => [o.id, o]));
export const objectiveById = (id) => BY_ID.get(id) || null;
export const objectivesFor = (keyUse) => OBJECTIVES.filter((o) => o.keyUse === keyUse);

/** WIDA framework entries an objective sits beside for a band: rows of the existing catalog, never re-listed. */
export function widaEntries(objective, band = "6-8") {
  const clusters = GRADE_CLUSTERS[band] || GRADE_CLUSTERS["6-8"];
  return WIDA_LANGUAGE_EXPECTATIONS.filter(
    (e) =>
      objective.standards.includes(e.standard) &&
      e.keyUse === objective.keyUse &&
      (e.gradeClusters || [e.gradeCluster]).some((c) => clusters.includes(c)),
  ).map((e) => ({
    id: e.id,
    standard: e.standard,
    label: STANDARD_LABEL[e.standard] || "",
    source: e.source,
  }));
}

/** The Key Language Use reference (moves, signal words) for an objective and band, from src/lang/klu.js. */
export const kluFor = (objective, band = "6-8") =>
  KLU_REFERENCE[objective.keyUse]?.bands?.[band === "3-5" ? "3-5" : "6-8"] || {
    moves: [],
    functions: [],
    signals: [],
  };

// ── resolving an activity key to a real route ────────────────────────────────────────────────────────────────
const bandQuery = (band) => (band && band !== "6-8" ? `?grades=${band}` : "");

function findAccess(index, id) {
  for (const band of Object.keys(index?.bands || {}))
    for (const [domain, D] of Object.entries(index.bands[band].domains || {}))
      for (const [level, lv] of Object.entries(D.levels || {})) {
        const row = (lv.activities || []).find((r) => r[0] === id);
        if (row && row[2] !== "worksheet" && DOMAINS.includes(domain))
          return { band, domain, level, id, title: row[1], skill: row[3] || "" };
      }
  return null;
}

/**
 * Turn a key into a resolved activity: { key, kind, id, domain, band, route, title:[en,es] } or null when the key
 * names nothing that exists. `route` is app-relative (no /access-practice-lab prefix). `index` is content/index.json.
 */
export function resolveKey(key, { index } = {}) {
  const kind = String(key || "")[0];
  const id = String(key || "").slice(1);
  if (kind === "t" && !id)
    return {
      key,
      kind: "transfer",
      id: "",
      domain: "Writing",
      route: "",
      title: ["A new task on your own", "Una tarea nueva por tu cuenta"],
    };
  if (kind === "f" && !id)
    return {
      key,
      kind: "family",
      id: "",
      domain: "",
      route: "",
      title: ["Family conversation", "Conversación en familia"],
    };
  if (!/^[a-z0-9][a-z0-9:_-]{0,59}$/.test(id)) return null;
  if (kind === "r") {
    const a = findAccess(index, id);
    return a
      ? {
          key,
          kind: "access",
          ...a,
          route: `/${a.domain}/${a.level}/${a.id}${bandQuery(a.band)}`,
          title: [a.title, a.title],
        }
      : null;
  }
  if (kind === "s" || kind === "w") {
    const list = index?.studio?.[kind === "s" ? "speaking" : "writing"] || [];
    const t = list.find((x) => x.id === id);
    return t
      ? {
          key,
          kind: kind === "s" ? "speak" : "write",
          id,
          band: t.band || "6-8",
          domain: kind === "s" ? "Speaking" : "Writing",
          route: `/${kind === "s" ? "speak" : "write"}/${id}`,
          title: [t.title, t.title],
          keyUse: t.keyUse || "",
        }
      : null;
  }
  if (kind === "m")
    return DEST_BY_ID.simulations
      ? {
          key,
          kind: "sim",
          id,
          domain: "Speaking",
          route: `/simulations/${id}`,
          title:
            id === SIM_MISSION
              ? ["The City That Stopped Talking", "La ciudad que dejó de hablar"]
              : [id, id],
        }
      : null;
  if (kind === "d") {
    const d = DEST_BY_ID[id];
    if (!d || String(d.href).startsWith("/") || !d.for?.includes?.("student")) return null;
    return { key, kind: "dest", id, domain: "", route: `/${d.href}`, title: [...d.title] };
  }
  if (kind === "b")
    return {
      key,
      kind: "book",
      id,
      domain: "Writing",
      route: "/book-studio",
      title: ["A book in Book Studio", "Un libro en Book Studio"],
    };
  return null;
}

/** Activities of an objective for a band (band-free ones always included), each resolved; unknown ones dropped. */
export function activitiesFor(objective, band, data) {
  return objective.activities
    .filter((a) => !a.band || a.band === band)
    .map((a) => ({ ...resolveKey(a.key, data), domain: a.domain }))
    .filter((a) => a.key);
}

/** True when a key (or its route) is linked to the objective in the graph. */
export function isLinked(objectiveId, key) {
  const o = objectiveById(objectiveId);
  if (!o) return false;
  return key === "t" || key === "f" || o.activities.some((a) => a.key === key);
}

/** How a linked activity serves the objective, [en, es]: built from the activity's kind, never invented per item. */
export function whyFor(objective, ref) {
  const goal = objective.title;
  const say = {
    access:
      ref.domain === "Listening"
        ? [
            "Listen for the information you will explain later",
            "Escucha la información que explicarás después",
          ]
        : ref.domain === "Reading"
          ? [
              "Read the information and find the evidence in it",
              "Lee la información y encuentra la evidencia",
            ]
          : [
              "Practice the same language move in a short task",
              "Practica el mismo movimiento de lenguaje en una tarea corta",
            ],
    speak: ["Say it out loud in your own words", "Dilo en voz alta con tus propias palabras"],
    write: ["Write it in your own words", "Escríbelo con tus propias palabras"],
    sim: [
      "Use it with a person who needs convincing: your words change what happens",
      "Úsalo con una persona a quien hay que convencer: tus palabras cambian lo que pasa",
    ],
    dest: ["Practice one part of the goal", "Practica una parte de la meta"],
    book: [
      "Make it into a page other people can read",
      "Conviértelo en una página que otras personas puedan leer",
    ],
    transfer: [
      "Show you can do it with a new topic and no help",
      "Muestra que puedes hacerlo con un tema nuevo y sin ayuda",
    ],
    family: [
      "Use the same move at home, in any language",
      "Usa el mismo movimiento en casa, en cualquier idioma",
    ],
  }[ref.kind] || ["Practice the goal", "Practica la meta"];
  return [`${say[0]}. Goal: ${goal[0]}.`, `${say[1]}. Meta: ${goal[1]}.`];
}

/**
 * Check the whole graph against what really exists. `index` is content/index.json; `templates` the Book Studio
 * template ids; `simMissions` (optional) the simulation mission ids when the simulation module is on disk.
 * @returns {string[]} problems (empty = valid)
 */
export function validateGraph({ index, templates = null, simMissions = null } = {}) {
  const out = [];
  const seen = new Set();
  const skillIds = new Set(SKILLS.map((s) => s.id));
  if (OBJECTIVES.length < 8) out.push("fewer than 8 objectives");
  if (OBJECTIVES[0]?.id !== "explain-with-evidence")
    out.push("the first objective must be explain-with-evidence");
  for (const use of KEY_LANGUAGE_USES)
    if (!objectivesFor(use).length) out.push(`no objective for ${use}`);
  for (const o of OBJECTIVES) {
    const at = (m) => out.push(`${o.id}: ${m}`);
    if (!/^[a-z][a-z0-9-]{2,39}$/.test(o.id) || seen.has(o.id)) at("bad or duplicate id");
    seen.add(o.id);
    if (!KEY_LANGUAGE_USES.includes(o.keyUse)) at("unknown Key Language Use");
    for (const band of BANDS)
      if (!widaEntries(o, band).length) at(`no WIDA catalog entry for grades ${band}`);
    for (const s of o.skills) if (!skillIds.has(s)) at(`unknown skill ${s}`);
    for (const d of DIMENSIONS)
      if (!(o.features?.[d]?.[0] && o.features[d][1])) at(`missing ${d} feature`);
    for (const pair of [
      o.title,
      o.student,
      ...o.frames,
      ...o.talk,
      ...o.transfer.map((t) => t.prompt),
      ...o.needs.map((n) => n.sign),
    ])
      if (!(pair?.[0] && pair[1])) at("a string is missing English or Spanish");
    if (o.talk.length !== 3) at("needs exactly 3 family talk prompts");
    if (!o.transfer.length) at("no transfer task");
    if (!o.evidence.ledger.length || !o.evidence.loop.length) at("no evidence source");
    for (const a of o.activities) {
      const r = resolveKey(a.key, { index });
      if (!r) at(`activity ${a.key} does not exist`);
      else if (
        a.kind === "access" &&
        (r.band !== a.band || r.domain !== a.domain || r.level !== a.level)
      )
        at(`activity ${a.key} is filed as ${r.band} ${r.domain} ${r.level}`);
      if (a.kind === "book" && templates && !templates.includes(a.id))
        at(`book template ${a.id} does not exist`);
      if (a.kind === "sim" && simMissions && !simMissions.includes(a.id))
        at(`simulation ${a.id} does not exist`);
    }
    for (const d of o.domains)
      for (const band of BANDS)
        if (!activitiesFor(o, band, { index }).some((a) => a.domain === d))
          at(`claims ${d} but has no ${d} activity for grades ${band}`);
    for (const d of ["Reading", "Speaking", "Writing"])
      if (!o.domains.includes(d)) at(`has no ${d} activity at all`);
    for (const n of o.needs)
      if (!isLinked(o.id, n.activity) || !resolveKey(n.activity, { index }))
        at(`need ${n.id} points at ${n.activity}, which is not one of its activities`);
    if (!isLinked(o.id, o.stretch) || !resolveKey(o.stretch, { index }))
      at(`stretch ${o.stretch} is not one of its activities`);
  }
  return out;
}

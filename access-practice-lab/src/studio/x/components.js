// Component registry: insertable instructional components built ONLY from what the studio's model and player do
// today (the 15 question formats, the block types, the four game templates). Anything the engine cannot honestly do
// is listed with `available: false` and a plain reason, never faked.
//
//   COMPONENTS                         every component (see components-kit.js `define` for the shape)
//   getComponent(id)                   one component or undefined
//   fits(component, activity)          { ok, reason? }: kind compatibility and what the component needs from the activity
//   buildComponent(id, activity, cfg)  the blocks to add (normalized by cleanBlock)
//   applyToDraft(draft, id, cfg, opts) change a draft in place (used inside store.apply): { added: [blockId] }
//   applyComponent(activity, id, cfg)  pure: { activity, added, validation }
//   previewActivity(component)         a complete activity for the sandboxed student preview
//   recommend(activity, context)       a SHORT, ranked list for this activity: [{ component, score, reason }]
//
// Every build() output passes normalizeActivity + validateActivity when added to an activity (tools/studio-x-components.test.mjs).

import { cleanBlock, normalizeActivity, questionsOf } from "../core/schema.js";
import { validateActivity } from "../core/validate.js";
import { BLOCK_COMPONENTS } from "./components-blocks.js";
import { DIAGRAM_COMPONENTS } from "./components-diagrams.js";
import { FORMAT_COMPONENTS } from "./components-formats.js";
import { T, blocksOf, vocabItems } from "./components-kit.js";
import { MORE_COMPONENTS } from "./components-more.js";

export const COMPONENTS = Object.freeze([
  ...FORMAT_COMPONENTS,
  ...BLOCK_COMPONENTS,
  ...DIAGRAM_COMPONENTS,
  ...MORE_COMPONENTS,
]);
const BY_ID = new Map(COMPONENTS.map((c) => [c.id, c]));
export const getComponent = (id) => BY_ID.get(id);

export const CATEGORY_LABEL = Object.freeze({
  question: T("Questions", "Preguntas"),
  vocabulary: T("Vocabulary", "Vocabulario"),
  reading: T("Reading", "Lectura"),
  table: T("Tables", "Tablas"),
  math: T("Math", "Matemáticas"),
  organizer: T("Graphic organizers", "Organizadores gráficos"),
  reflection: T("Reflection", "Reflexión"),
  formative: T("Formative checks", "Verificaciones formativas"),
  game: T("Game styles", "Estilos de juego"),
  visual: T("Visuals", "Elementos visuales"),
  interactive: T("Interactive", "Interactivo"),
  language: T("Language", "Lenguaje"),
});

const NEED_REASON = {
  vocab: T(
    "Add a vocabulary list with at least two words and meanings first.",
    "Primero agregue una lista de vocabulario con al menos dos palabras y significados.",
  ),
  passage: T("Add a reading passage first.", "Primero agregue un texto de lectura."),
  questions: (n) =>
    T(`Add at least ${n} questions first.`, `Primero agregue al menos ${n} preguntas.`),
};

/** Can this component be added to this activity right now? A reason is always plain and bilingual. */
export function fits(component, activity) {
  if (!component.available) return { ok: false, reason: component.reason };
  const kinds = component.compatibility.kinds;
  if (!kinds.includes(activity.kind))
    return {
      ok: false,
      reason: T(
        `This works in ${kinds.join(", ")} activities, not in a ${activity.kind}.`,
        `Funciona en actividades de tipo ${kinds.join(", ")}, no en ${activity.kind}.`,
      ),
    };
  const need = component.needs;
  if (
    need?.vocab &&
    new Set(vocabItems(activity).map((v) => v.term.toLowerCase())).size < need.vocab
  )
    return { ok: false, reason: NEED_REASON.vocab };
  if (need?.passage && !blocksOf(activity, "passage").some((p) => p.text.trim()))
    return { ok: false, reason: NEED_REASON.passage };
  if (need?.questions && questionsOf(activity).length < need.questions)
    return { ok: false, reason: NEED_REASON.questions(need.questions) };
  return { ok: true };
}

const configFor = (c, config) => ({ lang: "en", ...c.defaults, ...config });

/** The blocks a component adds to `activity`. Throws for an unknown or unavailable id. */
export function buildComponent(id, activity, config = {}) {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`unknown component: ${id}`);
  if (!c.available) throw new Error(`${id} is not available: ${c.reason.en}`);
  const a = normalizeActivity(activity);
  return c.build(a, configFor(c, config)).map(cleanBlock).filter(Boolean);
}

/** Add a component to `draft` (a plain activity object) in place. `after`: block id to insert after (default: end). */
export function applyToDraft(draft, id, config = {}, { after = "" } = {}) {
  const c = BY_ID.get(id);
  if (!c?.available) throw new Error(`unknown or unavailable component: ${id}`);
  if (c.change) {
    Object.assign(draft, c.change(normalizeActivity(draft)));
    return { added: [] };
  }
  const blocks = buildComponent(id, draft, config);
  const at = after ? draft.blocks.findIndex((b) => b.id === after) : -1;
  draft.blocks.splice(at < 0 ? draft.blocks.length : at + 1, 0, ...blocks);
  return { added: blocks.map((b) => b.id) };
}

/** Pure form of applyToDraft: the new activity, the ids added, and its validation. */
export function applyComponent(activity, id, config = {}, opts = {}) {
  const draft = structuredClone(normalizeActivity(activity));
  const { added } = applyToDraft(draft, id, config, opts);
  const next = normalizeActivity(draft);
  return { activity: next, added, validation: validateActivity(next) };
}

export const previewActivity = (component) => component.preview;

// ── recommendations ──────────────────────────────────────────────────────────

const SUBJECTS = [
  ["math", /math/i],
  ["science", /scien/i],
  ["social", /social|histor|civic|geograph/i],
  ["ela", /\bela\b|read|writ|english|language|esol|literacy/i],
];
const subjectOf = (s) => SUBJECTS.find(([, re]) => re.test(String(s || "")))?.[0] || "";
const CUES = [
  ["fraction", /\bNF\b|fraction/i],
  ["ratio", /\bRP\b|ratio|\brate\b|proportion/i],
  ["graph", /coordinate|graph|plot|\.G\.|NS\.C/i],
  ["data", /\bSP\b|statistic|\bdata\b|dot plot|histogram|bar chart/i],
  ["web", /food web|food chain|ecosystem|habitat|predator/i],
  ["time", /timeline|century|\bera\b|history/i],
];

const R = (en, es) => T(en, es);
const REASONS = {
  vocabNoMatch: R(
    "Your activity has vocabulary words but no matching question.",
    "Su actividad tiene palabras de vocabulario pero ninguna pregunta de emparejar.",
  ),
  passageNoAudio: R(
    "You have a passage but no read-aloud button.",
    "Tiene un texto pero ningún botón de lectura en voz alta.",
  ),
  noWriting: R("No written response yet.", "Aún no hay respuesta escrita."),
  noReflection: R(
    "Nothing asks students to reflect yet.",
    "Nada pide aún que los estudiantes reflexionen.",
  ),
  checkNoWrite: R(
    "A quick check often ends with one explanation.",
    "Una revisión rápida suele terminar con una explicación.",
  ),
  fraction: R("Fits fraction work.", "Sirve para trabajar fracciones."),
  ratio: R("Fits ratio and rate work.", "Sirve para trabajar razones y tasas."),
  graph: R("Fits graphing and coordinates.", "Sirve para graficar y coordenadas."),
  mathNoNumber: R(
    "Math activity with no typed-number question.",
    "Actividad de matemáticas sin pregunta de número escrito.",
  ),
  science: R("Fits science reasoning.", "Sirve para el razonamiento científico."),
  social: R("Fits history and social studies.", "Sirve para historia y estudios sociales."),
  ela: R("Fits reading and writing.", "Sirve para lectura y escritura."),
  passageIdentify: R(
    "Students can find evidence in your passage.",
    "Los estudiantes pueden hallar evidencia en su texto.",
  ),
  noVocab: R("No vocabulary list yet.", "Aún no hay lista de vocabulario."),
  start: R("A common way to start.", "Una forma común de empezar."),
  variety: R(
    "A question type this activity does not use yet.",
    "Un tipo de pregunta que esta actividad aún no usa.",
  ),
  game: R(
    "You have enough questions to play this as a game.",
    "Tiene suficientes preguntas para jugarlo como juego.",
  ),
};

/** Rules: [component id, score, reason key, predicate(context)] ; the highest scores win. */
function rules(x) {
  const { has, subject, cues, formats, empty } = x;
  const math = subject === "math";
  return [
    ["vocab-match", 10, "vocabNoMatch", () => !formats.has("match")],
    ["read-aloud", 8, "passageNoAudio", () => !has.audio],
    ["reflection", 6, "noReflection", () => x.questions >= 2 && !formats.has("short")],
    ["q-short", 4, "noWriting", () => x.questions >= 2 && !formats.has("short")],
    ["exit-ticket", 7, "checkNoWrite", () => x.kind === "check" && !formats.has("short")],
    ["q-numberline", 8, "fraction", () => cues.has("fraction") && !formats.has("numberline")],
    ["q-fillTable", 8, "ratio", () => cues.has("ratio") && !formats.has("fillTable")],
    ["q-plot", 8, "graph", () => cues.has("graph") && !formats.has("plot")],
    ["q-number", 5, "mathNoNumber", () => math && !formats.has("number")],
    ["diagram-fraction", 7, "fraction", () => cues.has("fraction") && !has.diagram],
    ["diagram-tape", 7, "ratio", () => cues.has("ratio") && !has.diagram],
    ["diagram-plane", 6, "graph", () => cues.has("graph") && !has.diagram],
    ["diagram-histogram", 6, "data", () => cues.has("data") && !has.diagram],
    ["diagram-foodweb", 7, "science", () => cues.has("web") && !has.diagram],
    ["diagram-timeline", 6, "social", () => cues.has("time") && !has.diagram],
    ["data-table", 3, "ratio", () => math && !has.table],
    ["math-display", 3, "mathNoNumber", () => math && !has.math],
    ["q-error", 4, "mathNoNumber", () => math && x.questions >= 3 && !formats.has("error")],
    [
      "organizer-claim-evidence",
      has.passage ? 9 : 7,
      "science",
      () => subject === "science" && !has.organizer,
    ],
    ["organizer-cause-effect", 5, "science", () => subject === "science" && !has.organizer],
    ["organizer-kwl", 3, "science", () => subject === "science" && !has.organizer],
    ["organizer-sequence", 6, "social", () => subject === "social" && !has.organizer],
    ["organizer-cause-effect", 6, "social", () => subject === "social" && !has.organizer],
    ["organizer-compare", 4, "social", () => subject === "social" && !has.organizer],
    ["q-order", 4, "social", () => subject === "social" && !formats.has("order")],
    ["organizer-compare", 4, "ela", () => subject === "ela" && !has.organizer],
    ["q-build", 5, "ela", () => subject === "ela" && !formats.has("build")],
    ["q-identify", 6, "passageIdentify", () => has.passage && !formats.has("identify")],
    ["passage-check", 6, "ela", () => subject === "ela" && !has.passage],
    ["vocab-list", 5, "noVocab", () => !has.vocab && (empty || subject !== "math")],
    ["q-choice", 6, "start", () => empty],
    ["q-match", 5, "start", () => empty && !has.vocab],
    ["game-match", 6, "game", () => x.questions >= 3 && (formats.has("match") || has.vocab)],
    ["game-quest", 2, "game", () => x.questions >= 3],
  ];
}

/**
 * Components worth offering for THIS activity (and page context), best first. The list is short by design:
 * `context.limit` (default 6). Only available components that fit the activity are ever returned.
 * context: { kind?, subject?, standards?: string[], limit? } (defaults come from the activity).
 */
export function recommend(activity, context = {}) {
  const a = normalizeActivity(activity);
  const kind = context.kind || a.kind;
  const subject = subjectOf(context.subject ?? a.context.subject);
  const codes = context.standards || a.context.standards.map((s) => s.code);
  const text = [...codes, a.title, a.context.objective, a.context.unitTitle].join(" ");
  const qs = questionsOf(a);
  const x = {
    kind,
    subject,
    questions: qs.length,
    formats: new Set(qs.map((q) => q.format)),
    empty: a.blocks.length === 0,
    cues: new Set(CUES.filter(([, re]) => re.test(text)).map(([k]) => k)),
    has: Object.fromEntries(
      ["passage", "vocab", "table", "math", "audio", "organizer", "diagram"].map((t) => [
        t,
        blocksOf(a, t).length > 0,
      ]),
    ),
  };
  const scored = new Map();
  for (const [id, score, why, test] of rules(x)) {
    const c = BY_ID.get(id);
    if (!c || !test() || !fits(c, { ...a, kind }).ok) continue;
    if (!scored.has(id) || scored.get(id).score < score)
      scored.set(id, { component: c, score, reason: REASONS[why] });
  }
  const limit = Math.max(1, context.limit ?? 6);
  const order = new Map(COMPONENTS.map((c, i) => [c.id, i]));
  const out = [...scored.values()].sort(
    (p, q) => q.score - p.score || order.get(p.component.id) - order.get(q.component.id),
  );
  // at most one game style, so the short list is not a list of games
  let games = 0;
  return out.filter((r) => r.component.category !== "game" || ++games === 1).slice(0, limit);
}

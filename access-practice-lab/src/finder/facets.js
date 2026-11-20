// Resource Finder filters: which facets exist, how the URL carries them, and how results are filtered and counted.
// Pure (no DOM): the /search view and Node tests share it.
//
//   URL  /access-practice-lab/search?q=&for=&grades=&all=1&skill=&kind=&format=&time=
//   state = readState(searchParams, band)  ->  url = writeState(state, searchParams)
//
// A value is offered only when the documents carry it (counts come from the current results, and a value with zero
// results is hidden unless it is the one selected). Time exists because content/index.json and the practice tests
// record minutes; nothing else is guessed.
import { KINDS } from "../sitemap.js";

const P = (en, es) => ({ en, es });

export const AUDIENCE_VALUES = [
  ["teacher", P("Teachers", "Docentes")],
  ["student", P("Students", "Estudiantes")],
  ["family", P("Families", "Familias")],
];
export const SKILL_VALUES = [
  ["Listening", P("Listening", "Escuchar")],
  ["Speaking", P("Speaking", "Hablar")],
  ["Reading", P("Reading", "Leer")],
  ["Writing", P("Writing", "Escribir")],
  ["Words", P("Words & grammar", "Palabras y gramática")],
  ["Mixed", P("All four skills", "Las cuatro destrezas")],
];
const kindLabel = (id) => P(KINDS[id][0], KINDS[id][1]);
/** Kinds in the order a person scans them; the first group shows by default, the rest under "More filters". */
export const KIND_VALUES = [
  ["practice", kindLabel("practice")],
  ["game", kindLabel("game")],
  ["world", kindLabel("world")],
  ["studio", kindLabel("studio")],
  ["test", kindLabel("test")],
  ["printable", P("Printable", "Para imprimir")],
  ["guide", kindLabel("guide")],
  ["tool", kindLabel("tool")],
  ["story", kindLabel("story")],
  ["progress", kindLabel("progress")],
  ["word", P("Word", "Palabra")],
  ["action", P("Action", "Acción")],
];
export const MAIN_KINDS = [
  "practice",
  "game",
  "world",
  "studio",
  "test",
  "printable",
  "guide",
  "tool",
];
export const FORMAT_VALUES = [
  ["digital", P("On screen", "En pantalla")],
  ["printable", P("Printable", "Para imprimir")],
];
export const TIME_VALUES = [
  ["5", P("5 minutes or less", "5 minutos o menos"), (m) => m <= 5],
  ["10", P("10 minutes or less", "10 minutos o menos"), (m) => m <= 10],
  ["20", P("20 minutes or less", "20 minutos o menos"), (m) => m <= 20],
  ["long", P("More than 20 minutes", "Más de 20 minutos"), (m) => m > 20],
];
export const TYPE_VALUES = [
  ["worksheet", P("Worksheet", "Hoja de trabajo")], ["game", P("Game", "Juego")],
  ["flashcards", P("Flashcards", "Tarjetas didácticas")], ["word-wall", P("Word wall", "Muro de palabras")],
  ["poster", P("Poster", "Póster")], ["label", P("Label", "Etiqueta")], ["planner", P("Planner", "Planificador")],
  ["checklist", P("Checklist", "Lista de verificación")], ["letter", P("Letter", "Carta")],
  ["organizer", P("Organizer", "Organizador gráfico")], ["assessment", P("Assessment", "Evaluación")],
  ["lesson-pack", P("Lesson pack", "Paquete de lección")],
];
export const STAGE_VALUES = [["A", P("A · Starting", "A · Inicial")], ["B", P("B · Growing", "B · En desarrollo")], ["C", P("C · Expanding", "C · En expansión")]];
export const LANGUAGE_VALUES = [["bilingual", P("Bilingual", "Bilingüe")], ["en", P("English", "Inglés")]];
export const TECH_VALUES = [["none", P("No technology", "Sin tecnología")], ["screen", P("On screen", "En pantalla")]];
export const EDIT_VALUES = [["yes", P("Editable", "Editable")]];
export const BAND_VALUES = [
  ["K", P("K", "K")],
  ["1", P("Grade 1", "1.º")],
  ["2-3", P("Grades 2–3", "2.º–3.º")],
  ["3-5", P("Grades 3–5", "3.º–5.º")],
  ["6-8", P("Grades 6–8", "6.º–8.º")],
];

const valid = (list, v) => (list.some(([id]) => id === v) ? v : "");
// Before the finder, ?kind= named a search kind (page, practice, studio, word); those still mean something here.
const LEGACY_KIND = { page: "" };

/** Finder state from URL parameters. `band` is the band the lab is showing (ctx.band). */
export function readState(params, band) {
  const get = (k) => params.get(k) || "";
  const kind = get("kind");
  return {
    q: get("q"),
    for: valid(AUDIENCE_VALUES, get("for")),
    band,
    all: get("all") === "1",
    skill: valid(SKILL_VALUES, get("skill")),
    kind: kind in LEGACY_KIND ? LEGACY_KIND[kind] : valid(KIND_VALUES, kind),
    format: valid(FORMAT_VALUES, get("format")),
    time: valid(TIME_VALUES, get("time")),
    type: valid(TYPE_VALUES, get("type")),
    fn: /^[\p{L}-]{2,32}$/u.test(get("fn")) ? get("fn").toLocaleLowerCase() : "",
    stage: valid(STAGE_VALUES, get("stage")),
    lang: valid(LANGUAGE_VALUES, get("lang")),
    tech: valid(TECH_VALUES, get("tech")),
    edit: valid(EDIT_VALUES, get("edit")),
  };
}

/** The finder's URL parameters written onto `params` (other parameters, like ?mode, are kept). */
export function writeState(state, params = new URLSearchParams()) {
  const out = new URLSearchParams(params);
  const set = (k, v) => (v ? out.set(k, v) : out.delete(k));
  set("q", state.q.trim());
  set("for", state.for);
  set("grades", state.band);
  set("all", state.all ? "1" : "");
  set("skill", state.skill);
  set("kind", state.kind);
  set("format", state.format);
  set("time", state.time);
  for (const key of ["type", "fn", "stage", "lang", "tech", "edit"]) set(key, state[key]);
  return out;
}

/** How many filters are on (the grade band is not counted: a band is always chosen). */
export const activeCount = (s) =>
  ["for", "skill", "kind", "format", "time", "type", "fn", "stage", "lang", "tech", "edit"].filter((k) => s[k]).length;

const inBands = (d, bands) => !bands || !d.bands || d.bands.some((b) => bands.includes(b));
const TESTS = {
  for: (d, v) => !!d.for?.includes(v),
  skill: (d, v) => d.skill === v,
  kind: (d, v) =>
    v === "printable" ? d.rk === "printable" || d.format === "printable" : d.rk === v,
  format: (d, v) => d.format === v,
  time: (d, v) => Number.isFinite(d.minutes) && TIME_VALUES.find(([id]) => id === v)[2](d.minutes),
  type: (d, v) => d.type === v,
  fn: (d, v) => d.fn?.includes(v),
  stage: (d, v) => d.stage === v,
  lang: (d, v) => d.lang === v,
  tech: (d, v) => d.tech === v,
  edit: (d, v) => d.edit === v,
};

/** The bands a state limits to: a grade in the query wins, then "all grades", then the lab's band. */
export const bandsFor = (state, intentBands) =>
  intentBands || (state.all ? null : state.band ? [state.band] : null);

/** Keep the documents that pass every filter except `skip` (used for counting that facet's values). */
export function applyFilters(docs, state, intentBands, skip = "") {
  const bands = skip === "band" ? null : bandsFor(state, intentBands);
  return docs.filter((d) => {
    if (!inBands(d, bands)) return false;
    for (const k of Object.keys(TESTS))
      if (k !== skip && state[k] && !TESTS[k](d, state[k])) return false;
    return true;
  });
}

/** { facet: { value: count } } for the values each facet offers, counted with every OTHER filter applied. */
export function facetCounts(docs, state, intentBands) {
  const out = {};
  const lists = {
    for: AUDIENCE_VALUES,
    skill: SKILL_VALUES,
    kind: KIND_VALUES,
    format: FORMAT_VALUES,
    time: TIME_VALUES,
    type: TYPE_VALUES,
    stage: STAGE_VALUES,
    lang: LANGUAGE_VALUES,
    tech: TECH_VALUES,
    edit: EDIT_VALUES,
    fn: [...new Set(docs.flatMap((d) => d.fn || []))].sort().map((v) => [v, P(v[0]?.toUpperCase() + v.slice(1), v[0]?.toUpperCase() + v.slice(1))]),
  };
  for (const [facet, list] of Object.entries(lists)) {
    const base = applyFilters(docs, state, intentBands, facet);
    out[facet] = Object.fromEntries(
      list.map(([v]) => [v, base.filter((d) => TESTS[facet](d, v)).length]),
    );
  }
  const base = applyFilters(docs, state, intentBands, "band");
  out.band = Object.fromEntries(
    BAND_VALUES.map(([v]) => [v, base.filter((d) => inBands(d, [v])).length]),
  );
  out.band.all = base.length;
  return out;
}

// What to list when the query has no words but filters are on: pages before what is inside them, then the kinds a
// person usually wants first. Glossary words and actions only when asked for.
const BROWSE_ORDER = [
  "practice",
  "game",
  "world",
  "studio",
  "test",
  "printable",
  "guide",
  "tool",
  "story",
  "progress",
];
export function browse(docs, state) {
  return docs
    .filter(
      (d) =>
        (d.rk !== "word" || state.kind === "word") &&
        (d.rk !== "action" || state.kind === "action"),
    )
    .map((doc) => ({ doc, score: 0 }))
    .sort((a, b) => {
      const x = a.doc;
      const y = b.doc;
      const exactFor = (d) => (state.for && d.for?.length === 1 ? 0 : 1);
      const page = (d) => (d.dest ? (d.top ? 0 : 1) : 2);
      const kind = (d) => {
        const i = BROWSE_ORDER.indexOf(d.rk);
        return i < 0 ? 99 : i;
      };
      return (
        exactFor(x) - exactFor(y) ||
        page(x) - page(y) ||
        kind(x) - kind(y) ||
        x.title.localeCompare(y.title)
      );
    });
}

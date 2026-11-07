// Site-wide search: pure logic (no DOM, no fetch). Builds one flat index from the lab's registries and content,
// then ranks it for an English or Spanish query with a grade-band filter.
//
//   docs = buildDocs({ index, glossary, cards, studios, units, tests })     (src/search-data.js feeds the sources)
//   search(docs, "manzana", { band: "3-5" })  ->  [{ doc, score }, ...]
//
// Ranking is explainable: every query word must be found (title > keyword > body; whole word > start of word >
// one-letter typo), a Spanish word also finds the English word the glossary pairs it with (and the reverse), and a
// title that begins with or contains the whole query gets a bonus. Nothing here uses learner data.
import { BASE } from "../util.js";

export const KINDS = ["page", "practice", "studio", "word", "command"];
const STOP = new Set([
  "a",
  "an",
  "the",
  "of",
  "to",
  "and",
  "or",
  "in",
  "on",
  "for",
  "de",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "y",
  "o",
  "en",
  "para",
  "con",
  "del",
  "al",
]);

/** Lower case, no accents, letters and digits only. "Comprensión" and "comprension" are the same word. */
export const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export const words = (s) => norm(s).split(" ").filter(Boolean);
export const queryWords = (q) => {
  const all = words(q);
  const kept = all.filter((w) => !STOP.has(w));
  return kept.length ? kept : all;
};

const pair = (en, es) => ({ en, es: es || en });

// ── pages the lab answers that are not home cards ──────────────────────────────────────
const P = (id, icon, title, text, path, extra = {}) => ({
  id: `page:${id}`,
  kind: "page",
  icon,
  title: title[0],
  titleEs: title[1],
  text: text[0],
  textEs: text[1],
  path,
  keys: extra.keys || [],
  bands: extra.bands || null,
});
export const PAGE_DOCS = [
  P(
    "warmup",
    "sparkle",
    ["Daily Language Warm-Up", "Calentamiento diario de lenguaje"],
    [
      "A new word, a short listen, one sentence and one rehearsal each day.",
      "Una palabra nueva, una escucha corta, una oración y un ensayo cada día.",
    ],
    "warmup",
    { keys: ["daily", "word of the day", "palabra del dia", "diario", "routine"] },
  ),
  P(
    "portfolio",
    "passport",
    ["My portfolio", "Mi portafolio"],
    [
      "My best work, my words and my growth, ready to print or share with family.",
      "Mi mejor trabajo, mis palabras y mi crecimiento, listo para imprimir o compartir con la familia.",
    ],
    "portfolio",
    { keys: ["showcase", "family share", "print", "portafolio", "familia"] },
  ),
  P(
    "collection",
    "medal",
    ["My collection book", "Mi libro de colección"],
    [
      "Badges for effort and skill range. Nobody is compared.",
      "Insignias por esfuerzo y variedad de destrezas. Nadie se compara.",
    ],
    "collection",
    { keys: ["badges", "achievements", "insignias", "logros", "stickers"] },
  ),
  P(
    "listening",
    "listening",
    ["Listening practice", "Práctica de comprensión auditiva"],
    ["Listen, then answer.", "Escucha y luego responde."],
    "Listening",
    { keys: ["escuchar", "hear"] },
  ),
  P(
    "reading",
    "reading",
    ["Reading practice", "Práctica de lectura"],
    ["Read short texts and find evidence.", "Lee textos cortos y busca evidencia."],
    "Reading",
    { keys: ["leer"] },
  ),
  P(
    "speaking",
    "speaking",
    ["Speaking practice", "Práctica de expresión oral"],
    ["Plan, say it aloud and listen back.", "Planea, dilo en voz alta y escúchate."],
    "Speaking",
    { keys: ["hablar", "talk"] },
  ),
  P(
    "writing",
    "writing",
    ["Writing practice", "Práctica de escritura"],
    ["Build sentences and paragraphs.", "Crea oraciones y párrafos."],
    "Writing",
    { keys: ["escribir", "write"] },
  ),
  P(
    "library",
    "library",
    ["Find an activity", "Buscar una actividad"],
    ["Browse every practice activity.", "Explora todas las actividades de práctica."],
    "library",
    { keys: ["browse", "catalog", "explorar"] },
  ),
  P(
    "tests",
    "tests",
    ["Practice tests", "Pruebas de práctica"],
    ["Full-length practice. Not an official test.", "Práctica completa. No es una prueba oficial."],
    "tests",
    { keys: ["test", "examen", "prueba"] },
  ),
  P(
    "passport",
    "passport",
    ["My Passport", "Mi Pasaporte"],
    ["My saved work and backup code.", "Mi trabajo guardado y mi código de respaldo."],
    "passport",
    { keys: ["backup", "export", "respaldo", "paper passport", "pasaporte de papel"] },
  ),
  P(
    "growth",
    "growth",
    ["My Growth", "Mi crecimiento"],
    ["See how my work has changed.", "Mira cómo ha cambiado mi trabajo."],
    "growth",
    { keys: ["progress", "progreso"] },
  ),
  P(
    "family",
    "families",
    ["For families", "Para las familias"],
    ["Help at home in English and Spanish.", "Ayuda en casa en inglés y español."],
    "family",
    { keys: ["parents", "home", "padres", "casa", "familias"] },
  ),
  P(
    "tools",
    "help",
    ["Help and device check", "Ayuda y revisión del dispositivo"],
    ["Microphone, sound and saving help.", "Ayuda con micrófono, sonido y guardado."],
    "tools",
    { keys: ["help", "microphone", "ayuda", "microfono", "sound"] },
  ),
];

export const COMMAND_DOCS = [
  [
    "lang-en",
    "language",
    ["Language: English", "Idioma: inglés"],
    ["Show the lab in English.", "Mostrar el laboratorio en inglés."],
    ["english", "ingles", "language", "idioma"],
  ],
  [
    "lang-es",
    "language",
    ["Language: Spanish", "Idioma: español"],
    ["Show the lab in Spanish.", "Mostrar el laboratorio en español."],
    ["espanol", "spanish", "language", "idioma"],
  ],
  [
    "lang-bi",
    "language",
    ["Language: English and Spanish", "Idioma: inglés y español"],
    ["Show both languages together.", "Mostrar los dos idiomas juntos."],
    ["bilingual", "bilingue", "both", "ambos", "language", "idioma"],
  ],
  [
    "text-bigger",
    "text-size",
    ["Make text bigger", "Hacer el texto más grande"],
    ["Increase the text size.", "Aumentar el tamaño del texto."],
    ["font", "size", "tamano", "letra", "zoom"],
  ],
  [
    "text-smaller",
    "text-size",
    ["Make text smaller", "Hacer el texto más pequeño"],
    ["Decrease the text size.", "Reducir el tamaño del texto."],
    ["font", "size", "tamano", "letra"],
  ],
  [
    "print",
    "print",
    ["Print this page", "Imprimir esta página"],
    ["Open the print dialog.", "Abrir el cuadro de impresión."],
    ["pdf", "imprimir", "save"],
  ],
].map(([id, icon, title, text, keys]) => ({
  id: `cmd:${id}`,
  kind: "command",
  cmd: id,
  icon,
  title: title[0],
  titleEs: title[1],
  text: text[0],
  textEs: text[1],
  keys,
  bands: null,
}));

const DOMAIN_ICON = {
  Listening: "listening",
  Reading: "reading",
  Speaking: "speaking",
  Writing: "writing",
  "Model-Test": "tests",
};
const DOMAIN_ES = {
  Listening: "Escuchar",
  Reading: "Leer",
  Speaking: "Hablar",
  Writing: "Escribir",
};

/** All searchable documents. Every source is optional so a failed load degrades to fewer results, never an error. */
export function buildDocs({
  index,
  glossary,
  cards = [],
  studios = [],
  units = [],
  tests = [],
} = {}) {
  const docs = [...PAGE_DOCS, ...COMMAND_DOCS];
  for (const c of cards)
    docs.push({
      id: `card:${c.id}`,
      kind: "page",
      icon: c.icon,
      title: c.title[0],
      titleEs: c.title[1],
      text: c.text?.[0] || "",
      textEs: c.text?.[1] || "",
      path: c.href,
      keys: [c.group],
      bands: c.bands || null,
    });
  for (const s of studios)
    docs.push({
      id: `studio:${s.slug}`,
      kind: "studio",
      icon: s.skill || "tools",
      title: s.title,
      titleEs: s.titleEs,
      text: s.blurb,
      textEs: s.blurbEs,
      href: `/wida-access/${s.slug}/`,
      keys: ["studio", "estudio"],
      bands: null,
    });
  for (const u of units)
    docs.push({
      id: `unit:${u.id}`,
      kind: "studio",
      icon: "road",
      title: u.title[0],
      titleEs: u.title[1],
      text: u.blurb[0],
      textEs: u.blurb[1],
      path: "journey/map",
      keys: ["journey", "viaje", "mission", "mision", u.klu],
      bands: ["3-5", "6-8"],
    });
  for (const [band, b] of Object.entries(index?.bands || {}))
    for (const [domain, d] of Object.entries(b.domains || {}))
      for (const [level, l] of Object.entries(d.levels || {}))
        for (const row of l.activities || []) {
          const [id, title, type, objective] = row;
          docs.push({
            id: `act:${band}:${id}`,
            kind: "practice",
            icon: DOMAIN_ICON[domain] || "reading",
            title,
            titleEs: "",
            text: objective || "",
            textEs: "",
            path: `${domain}/${level}/${id}`,
            keys: [domain, DOMAIN_ES[domain] || "", type || ""],
            bands: [band],
            meta: { domain, level, type },
          });
        }
  const st = index?.studio || {};
  for (const t of st.speaking || [])
    docs.push({
      id: `spk:${t.id}`,
      kind: "studio",
      icon: "speaking",
      title: t.title,
      titleEs: "",
      text: `${t.keyUse || ""} · ${t.contentArea || ""}`,
      textEs: "",
      path: `speak/${t.id}`,
      keys: ["speaking studio", "estudio de expresion oral", t.taskType || ""],
      bands: [t.band],
    });
  for (const t of st.writing || [])
    docs.push({
      id: `wrt:${t.id}`,
      kind: "studio",
      icon: "writing",
      title: t.title,
      titleEs: "",
      text: `${t.keyUse || ""} · ${t.contentArea || ""}`,
      textEs: "",
      path: `write/${t.id}`,
      keys: ["writing studio", "estudio de escritura", t.form || ""],
      bands: [t.band],
    });
  for (const m of st.missions || [])
    docs.push({
      id: `mis:${m.id}`,
      kind: "studio",
      icon: "mission",
      title: m.title,
      titleEs: "",
      text: m.summary || m.subtitle || "",
      textEs: "",
      path: `missions/${m.id}`,
      keys: ["mission", "mision", m.contentArea || ""],
      bands: [m.band],
    });
  for (const p of st.patterns || [])
    docs.push({
      id: `pat:${p.id}`,
      kind: "studio",
      icon: "detective",
      title: p.name,
      titleEs: "",
      text: `Error Detective · ${p.category || ""}`,
      textEs: "",
      path: `detective/${p.id}`,
      keys: ["grammar", "gramatica", "error detective", "detective de errores"],
      bands: null,
    });
  for (const t of tests)
    docs.push({
      id: `test:${t.id}`,
      kind: "practice",
      icon: "tests",
      title: t.title,
      titleEs: "",
      text: `${t.items} questions · ${t.minutes} minutes`,
      textEs: `${t.items} preguntas · ${t.minutes} minutos`,
      path: `test/${t.id}`,
      keys: ["practice test", "prueba de practica"],
      bands: t.band ? [t.band] : null,
    });
  for (const w of glossary?.terms || [])
    docs.push({
      id: `word:${w.term}`,
      kind: "word",
      icon: "words",
      title: w.term,
      titleEs: w.es || "",
      text: w.def || "",
      textEs: w.esDef || "",
      word: { term: w.term, def: w.def, es: w.es, esDef: w.esDef },
      keys: [],
      bands: null,
    });
  return docs.map(prepare);
}

function prepare(d) {
  return {
    ...d,
    _t: words(`${d.title} ${d.titleEs || ""}`),
    _k: words((d.keys || []).join(" ")),
    _b: words(`${d.text} ${d.textEs || ""}`),
  };
}

/** Spanish <-> English bridge from the glossary, so "manzana" can find "apple" and "apple" can find "manzana". */
export function buildBridge(glossary) {
  const bridge = new Map();
  const add = (a, b) => {
    if (!a || !b || a === b) return;
    if (!bridge.has(a)) bridge.set(a, new Set());
    bridge.get(a).add(b);
  };
  for (const w of glossary?.terms || []) {
    const en = norm(w.term);
    const es = norm(w.es);
    if (en.includes(" ") || es.includes(" ")) continue; // single words only: a phrase would match too broadly
    add(es, en);
    add(en, es);
  }
  return bridge;
}

const editOne = (a, b) => {
  if (Math.abs(a.length - b.length) > 1 || a === b) return a === b;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
};

/** How well one query word matches one list of document words: 0 when it does not. */
function fieldScore(w, list, [exact, prefix, typo]) {
  let best = 0;
  for (const x of list) {
    if (x === w) return exact;
    if (w.length >= 2 && x.startsWith(w)) best = Math.max(best, prefix);
    else if (typo && w.length >= 4 && x.length >= 4 && w[0] === x[0] && editOne(w, x)) best = Math.max(best, typo);
  }
  return best;
}
const TITLE = [10, 6, 3];
const KEYS = [7, 4, 0];
const BODY = [3, 2, 0];
const KIND_BOOST = { page: 1.15, studio: 1.1, practice: 1, word: 0.85, command: 1.05 };

function wordScore(w, d, bridge) {
  const own = (x, weight, typo) => {
    const t = typo ? TITLE : [TITLE[0], TITLE[1], 0];
    return (fieldScore(x, d._t, t) || fieldScore(x, d._k, KEYS) || fieldScore(x, d._b, BODY)) * weight;
  };
  let s = own(w, 1, true);
  // The paired word from the other language counts, but a typo of it would only add noise.
  for (const alt of bridge?.get(w) || []) s = Math.max(s, own(alt, 0.7, false));
  return s;
}

/**
 * Rank documents for a query. Every query word must match. `band` limits documents written for other bands unless
 * `all` is true; `kind` limits to one kind. An empty query returns [].
 */
export function search(
  docs,
  query,
  { band = "", all = false, kind = "", bridge = null, limit = 40 } = {},
) {
  const qw = queryWords(query);
  if (!qw.length) return [];
  const phrase = qw.join(" ");
  const out = [];
  for (const d of docs) {
    if (kind && d.kind !== kind) continue;
    if (!all && band && d.bands && !d.bands.includes(band)) continue;
    let total = 0;
    let ok = true;
    for (const w of qw) {
      const s = wordScore(w, d, bridge);
      if (!s) {
        ok = false;
        break;
      }
      total += s;
    }
    if (!ok) continue;
    const title = norm(`${d.title} ${d.titleEs || ""}`);
    if (title.startsWith(phrase)) total += 6;
    else if (title.includes(phrase)) total += 3;
    out.push({ doc: d, score: total * (KIND_BOOST[d.kind] || 1) });
  }
  out.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  return out.slice(0, limit);
}

/** What to show before anything is typed: the lab's own starting points. */
export function suggestions(docs, band = "") {
  const ids = [
    "page:warmup",
    "page:portfolio",
    "page:collection",
    "page:library",
    "page:passport",
    "cmd:lang-es",
    "cmd:text-bigger",
  ];
  return ids
    .map((id) => docs.find((d) => d.id === id))
    .filter((d) => d && (!band || !d.bands || d.bands.includes(band)))
    .map((doc) => ({ doc, score: 0 }));
}

/** Where a result goes: a lab route (with the band) or a site path. Commands have none. */
export function hrefFor(doc, band = "") {
  if (doc.href) return doc.href;
  if (!doc.path) return "";
  if (doc.path.startsWith("/")) return doc.path;
  const [p, qs] = doc.path.split("?");
  const q = new URLSearchParams(qs || "");
  if (band && !q.has("grades")) q.set("grades", band);
  const s = q.toString();
  return `${BASE}/${p}${s ? `?${s}` : ""}`;
}

/** The text with each query word that starts a word wrapped in <mark>. The text is escaped; the result is HTML. */
export function highlight(text, qw) {
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const set = qw.map(norm).filter(Boolean);
  return String(text)
    .split(/(\s+)/)
    .map((part) => {
      const n = norm(part);
      return n && set.some((w) => n.startsWith(w)) ? `<mark>${esc(part)}</mark>` : esc(part);
    })
    .join("");
}

export const KIND_LABEL = {
  page: pair("Page", "Página"),
  practice: pair("Practice", "Práctica"),
  studio: pair("Studio or mission", "Estudio o misión"),
  word: pair("Word", "Palabra"),
  command: pair("Action", "Acción"),
};

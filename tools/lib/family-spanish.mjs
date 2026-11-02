/* =============================================================================
 * family-spanish: the Spanish half of the family homework, as data and detectors.
 * -----------------------------------------------------------------------------
 * ONE place that
 *   - collects every authored Spanish string (sidecars, data files, generator literals) and every
 *     Spanish text node of the generated pages, each tagged with where it lives;
 *   - holds the rules of docs/family-homework-v3/es-style-guide.md as detectors;
 *   - loads data/family-glossary.json, the single source for term / EN / ES / definition / example.
 * Used by tools/validate-family-spanish.mjs (the gate). The pages read the glossary through
 * scripts/lib/family-plain-definitions.mjs.
 * ========================================================================== */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./curriculum-source.mjs";

/** Unicode-aware word edges: JS \b is ASCII-only, so "decía" would match "decí". */
const L = "(?<![\\p{L}\\d_])";
const R = "(?![\\p{L}\\d_])";
const word = (alts, flags = "iu") => new RegExp(`${L}(?:${alts})${R}`, flags);

const read = (p) => JSON.parse(readFileSync(join(REPO_ROOT, p), "utf8"));
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/* ------------------------------------------------------------------ rules */

/**
 * The one Spanish word per concept (es-style-guide rule 2). `bad` are the variants that must not appear.
 * "entero" is correct for an integer, a whole-number part and "one whole" (1); only the noun for THE WHOLE of a
 * part-whole problem is "el total". A sentence that carries one of WHOLE_NUMBER_CUES is about integers or mixed numbers.
 */
export const WHOLE_NUMBER_CUES =
  /1 cuenta el entero|numerador|denominador|sobre 1|opuesto|lo que sobra|justo después|entero \d|enteros|de abajo|de arriba|multiplica el entero por \d|el entero, di qué|punto decimal|número entero|escribe el entero|entero como fracción/i;
const WHOLE_TOTAL = word(
  "(?:el|al|con el|EL) (?:todo|TODO)|(?:parte|partes|cuarto|quinto|décimo|mitad|fracción|porcentaje) del todo|parte-a-todo|(?:×|=|÷|—) todo|todo =|Porcentaje por todo",
);
const WHOLE_ENTERO = word("(?:el|al|del|EL) (?:entero|ENTERO)");
export const CONCEPTS = [
  {
    concept: "the whole",
    use: "el total",
    test: (text) =>
      text
        .split(/(?<=[.?!])\s+/)
        .some((s) => WHOLE_TOTAL.test(s) || (WHOLE_ENTERO.test(s) && !WHOLE_NUMBER_CUES.test(s))),
  },
  {
    concept: "percent",
    use: "el porcentaje",
    test: (t) => word("el por ciento|porciento").test(t),
  },
  { concept: "ratio", use: "la razón", test: (t) => word("la relación de|el ratio").test(t) },
  { concept: "equation", use: "la ecuación", test: (t) => word("la igualdad numérica").test(t) },
  {
    concept: "inverse operation",
    use: "la operación inversa",
    test: (t) => word("la operación opuesta").test(t),
  },
  {
    concept: "double number line",
    use: "la recta numérica doble",
    test: (t) => word("doble recta numérica").test(t),
  },
];

/** Imperatives that only ever address ONE adult as "usted", or a voseo / vosotros form. Never allowed. */
const USTED_VERBS =
  "Pregunte|Escuche|Pida|Anime|Evite|Elija|Diga|Dígale|Dele|Observe|Use|Haga|Lea|Mire|Ayude|Permita|Invite|Recuerde|Busque|Escriba|Traiga|Hágale|Repase|Practique|Deje|Dígales|Pídale|Anímele|Muéstrele|Ofrezca|Felicite|Pídales|Compare|Revise|Celebre|Reconozca|Hable|Platique|Cuéntele|Déjelo|Sugiera|Escúchelo|Apoye|Elogie|Motive|Aliente";
const USTED_RE = new RegExp(`(^|[.!?¿¡:;"«(—–-]\\s*|\\s[-—]\\s)(${USTED_VERBS})${R}`, "u");
const USTED_WORD = word("usted");
const VOSEO = word("vos|tenés|querés|podés|hacé|mirá|pensá|decime|fijate|sabés|sos");
const VOSOTROS = word(
  "vosotros|vosotras|vuestr[oa]s?|tenéis|hacéis|estáis|sois|podéis|queréis|sabéis|miráis|veis|vais|habéis|decís|mirad|elegid|escribid|pensad|contad|sumad|restad",
);
export const NEEDS_NO_USTED = (text) => USTED_RE.test(text) || USTED_WORD.test(text);

/** Sentence-initial imperative, split by register. Lexicon = the verbs the family pages really use. */
const TU_IMP =
  "Abre|Agrega|Anota|Aplica|Averigua|Busca|Calcula|Cambia|Cierra|Cobra|Colorea|Comienza|Compara|Completa|Comprueba|Con[cs]idera|Convierte|Corrige|Cuenta|Decide|Deja|Describe|Dibuja|Divide|Dobla|Dibuja|Elige|Empieza|Encierra|Encuentra|Escribe|Escoge|Escucha|Estima|Explica|Fíjate|Forma|Genera|Guarda|Haz|Halla|Identifica|Imagina|Inventa|Juega|Lee|Lleva|Mira|Marca|Mueve|Multiplica|Nombra|Observa|Ordena|Organiza|Pega|Pide|Piensa|Pon|Practica|Pregunta|Prueba|Recuerda|Redondea|Registra|Repasa|Representa|Resta|Resuelve|Revisa|Rodea|Sigue|Simplifica|Suma|Toca|Traza|Usa|Verifica|Vuelve|Une|Trata|Intenta|Reúne|Reune|Cuéntale|Dile|Muestra|Mantén|Busca|Compra|Cubre|Cuida|Dime|Piensa|Plantea|Presiona|Reduce|Rellena|Selecciona|Separa|Sé|Sustituye|Termina|Tacha|Toma|Trabaja|Escoge";
const USTEDES_IMP =
  "Abran|Agreguen|Anoten|Apliquen|Averigüen|Busquen|Calculen|Cambien|Cierren|Coloreen|Comiencen|Comparen|Completen|Comprueben|Consideren|Conviertan|Corrijan|Cuenten|Den|Decidan|Dejen|Describan|Dibujen|Digan|Dividan|Doblen|Elijan|Empiecen|Encierren|Encuentren|Escriban|Escojan|Escuchen|Estimen|Expliquen|Fíjense|Formen|Generen|Guarden|Hagan|Hallen|Identifiquen|Imaginen|Inventen|Jueguen|Lean|Lleven|Midan|Miren|Marquen|Muevan|Multipliquen|Nombren|Observen|Ordenen|Organicen|Peguen|Pidan|Piensen|Pongan|Practiquen|Pregunten|Prueben|Recuerden|Redondeen|Registren|Repasen|Representen|Resten|Resuelvan|Revisen|Rodeen|Sigan|Simplifiquen|Sumen|Toquen|Tracen|Usen|Vean|Verifiquen|Vuelvan|Unan|Tengan|Traten|Intenten|Reúnan|Muéstrenle|Muestren|Mantengan|Compren|Cubran|Cuiden|Planteen|Presionen|Reduzcan|Rellenen|Seleccionen|Separen|Sustituyan|Terminen|Tachen|Tomen|Trabajen|Eviten|Animen|Pídanle|Díganle|Déjenle|Ayuden|Permitan|Inviten|Celebren|Ofrezcan|Feliciten|Hablen|Platiquen|Apoyen|Elogien|Motiven|Alienten|Sean|Inténtenlo|Piénsenlo|Pregúntenle|Léanlo|Escúchenlo";
const startRe = (alts) => new RegExp(`(?:^|[.!?¡:;"«(—–]\\s*)(?:${alts})(?![\\p{L}\\d_-])`, "u");
const TU_START = startRe(TU_IMP);
const USTEDES_START = startRe(USTEDES_IMP);
const anyRe = (alts) => word(alts, "u");
export const TU_ANY = anyRe(TU_IMP.replace("|", "|").replace("|", "|").replace("|", "|"));
export const USTEDES_ANY = anyRe(USTEDES_IMP);
export const SECOND_PERSON_TU = word("tu|tus|tuyo|tuya|te|ti|contigo|tú");

/** Register of a Spanish string: which second-person imperative it uses (sentence-initial or after a colon). */
export function registerOf(text) {
  const tu = TU_START.test(text);
  const ustedes = USTEDES_START.test(text);
  return { tu, ustedes };
}

/** Lines that are one-sided quotations for an adult to say TO a child, or student frames, may stay tú inside an adult card. */
export const AUDIENCE = [
  [/\.watchFor\[\d+\]\.es$/, "adult"],
  [/\.corner\.(mission|watchOut|question)\.es$/, "adult"],
  [/\.bridge\.\w+\.es$/, "adult"],
  [/\.tryTogether\./, "adult"],
  [/\.v3\.kitchenTable\.es$/, "adult"],
  // lines an adult SAYS to the student, and everything the student reads and does
  [/\.stuckTips\.(say|dontSay)\[/, "student"],
  [/\.(basicPractice|conceptSteps)\[/, "student"],
  [/\.corner\.powerUp\./, "student"],
  [/\.experience\./, "student"],
];
export const audienceOf = (path) => AUDIENCE.find(([re]) => re.test(path))?.[1] ?? "any";

/** Second-person SINGULAR verb forms (tú). In an adult card they must be ustedes forms. */
const TU_VERBS = word(
  "eres|puedes|quieres|tienes|debes|sabes|ves|haces|dices|piensas|necesitas|vuelves|empiezas|mantienes|divides|escribes|usas|buscas|cambias|multiplicas|hallas|conoces|obtienes|pones|recuerdas|escuchas|prefieres|crees|estás|vas|\\p{L}+(?:aste|iste)|(?:contabas|usabas|llevabas|dividías|resolvías|escribías|hacías|sumabas|calculabas|comparabas|dibujabas|hallabas|marcabas|cortabas|llenabas|convertías|escogías|sustituías|volvías|partías|podías|podrías|comprarías|hallarías|enseñarías)",
);
const QUOTED = /"[^"]*"|«[^»]*»|“[^”]*”|'[^']*'/g;
export const outsideQuotes = (t) => t.replace(QUOTED, " ");

/**
 * Register findings for one Spanish string given where it appears. Quoted speech (what an adult says TO the child) is exempt.
 * adult  = ustedes: no tú imperative, no tu/te/ti, no tú verb forms.
 * student = tú: no ustedes imperative.
 */
export function registerFindings(path, text) {
  const out = [];
  const audience = audienceOf(path);
  const t = outsideQuotes(text);
  const { tu, ustedes } = registerOf(t);
  if (audience === "adult") {
    if (tu) out.push("tú imperative in an adult (ustedes) line");
    if (SECOND_PERSON_TU.test(t)) out.push("tu/te/ti in an adult (ustedes) line");
    if (TU_VERBS.test(t)) out.push("tú verb form in an adult (ustedes) line");
  } else if (audience === "student" && ustedes) {
    out.push("ustedes imperative in a student (tú) line");
  }
  if (tu && ustedes) out.push("tú and ustedes imperatives in one line");
  return out;
}

/* ------------------------------------------------------------- detectors */

/** Spanish text that must not match, with a reason. Each is exported so the gate can self-test it. */
export const DETECTORS = [
  {
    id: "usted",
    why: "usted / one-adult imperative (adults use ustedes, students use tú)",
    test: (t) => NEEDS_NO_USTED(t),
  },
  { id: "voseo", why: "voseo form (the guide uses tú, never vos)", test: (t) => VOSEO.test(t) },
  {
    id: "vosotros",
    why: "vosotros form (never used in US Spanish)",
    test: (t) => VOSOTROS.test(t),
  },
  {
    id: "concept-term",
    why: 'off-glossary word for a concept (the whole = "el total")',
    test: (t) => CONCEPTS.some((c) => c.test(t)),
  },
  {
    id: "percent-space",
    why: 'percent with a space ("60 %"; write 60%)',
    test: (t) => /\d\s%/.test(t),
  },
  {
    id: "doubled-label",
    why: 'doubled label ("Parte / Parte")',
    test: (t) => {
      const m = t.match(/^\s*(\p{L}[\p{L} ]{1,30}?)\s*[/·|–—-]\s*(\p{L}[\p{L} ]{1,30}?)\s*$/u);
      return Boolean(m && m[1].trim().toLowerCase() === m[2].trim().toLowerCase());
    },
  },
  {
    id: "english-left-in",
    why: "English words left inside Spanish text, or a borrowed word (quiz, check, hint)",
    test: (t) => englishHits(t).length > 0,
  },
  {
    id: "literal-idiom",
    why: "literal translation of an English idiom",
    test: (t) =>
      word(
        "pegar al refrigerador|mesa de la cocina|en la mesa de la cocina|ojo de toro|encuentra el glitch|a la vuelta de la esquina matemática|impresión a la nevera",
      ).test(t),
  },
];

const EN_STOP = new Set(
  "the and of to is are was you your with for each from that this because then add every value values data find count how many not step steps answer answers multiply subtract bring down check both sides uses first next what which when where why who whole number numbers percent equation ratio".split(
    " ",
  ),
);
// Words that are also Spanish ("a", "me", "no", "es") are excluded by construction: EN_STOP only holds English-only words,
// minus those that are real Spanish ("total", "part" is not Spanish, "set" is not, "use" not, "parte" differs).
const ES_OK = new Set(["total", "data", "rate", "check"]);
const BORROWED = word(
  "quiz|quizzes|checkear|chequear|clickea|hint|hints|streak|score|level up|checklist",
);
/** English-only words in a Spanish string, ignoring quoted terms and the glossary's bilingual parentheses. */
export function englishHits(t) {
  const stripped = t.replace(/«[^»]*»|"[^"]*"|“[^”]*”|'[^']*'|\([^)]*\)/g, " ");
  const hits = [];
  for (const m of stripped.matchAll(/\p{L}+/gu)) {
    const w = m[0].toLowerCase();
    if (EN_STOP.has(w) && !ES_OK.has(w)) hits.push(w);
  }
  const b = stripped.match(BORROWED);
  if (b) hits.push(b[0]);
  // one stray English-only word may be a Spanish homograph (e.g. "step" no); two is English text.
  return hits.filter((h) => BORROWED.test(h)).length || hits.length >= 2 ? hits : [];
}

/** Unit symbols, single-letter variables and subscripted names: the same in both languages. */
const SYMBOL_TOKEN =
  /^(?:cm|mm|km|m|in|ft|yd|mi|kg|g|mg|l|ml|lb|oz|s|min|h|hr|mph|gb|mb|kb|am|pm|[ivx]+|\d*[a-z]{1,2}\d*|[a-z][\d₀-₉]+|q\d)$/i;

/** English copied over Spanish: allowed only for numerals, symbols, units, variables, blanks and proper nouns. */
export function identicalAllowed(en, es, cognates = new Set()) {
  if (en.trim() === "" || es.trim() === "") return true;
  const tokens = en.match(/\p{L}[\p{L}\d₀-₉²³]*/gu) || [];
  return tokens.every(
    (w) => SYMBOL_TOKEN.test(w.replace(/[²³]/g, "")) || cognates.has(w.toLowerCase()),
  ); // "Base", "Factor": the same word in Spanish
}

/* -------------------------------------------------------------- collectors */

/** Strings under a Spanish key (`es`, `fooEs`) or inside a map whose values are Spanish. */
export function* spanishStrings(node, path = "", inEs = false) {
  if (typeof node === "string") {
    if (inEs && node.trim()) yield { path, text: node };
  } else if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* spanishStrings(node[i], `${path}[${i}]`, inEs);
  } else if (isObj(node)) {
    for (const [k, v] of Object.entries(node)) {
      if (k === "_comment" || k === "_note" || k === "$comment" || k === "note") continue;
      yield* spanishStrings(v, `${path}.${k}`, inEs || k === "es" || /[a-z]Es$/.test(k));
    }
  }
}

export const SIDECAR_DIR = join("data", "family-homework-notes");
/** Map files whose VALUES are Spanish and whose keys are the English source. */
const MAP_FILES = [
  "data/homework-choices-spanish.json",
  "data/homework-feedback-spanish.json",
  "data/homework-starters-spanish.json",
  "data/homework-table-spanish.json",
  "data/family-game-pairs-es.json",
  "data/family-homework-titles-es.json",
];
const ES_KEY_FILES = [
  "data/family-landing-units.json",
  "data/family-homework-ladder.json",
  "data/homework-confused-grownup-tags.json",
  "data/family-week-notes.json",
];
const ES_KEY_DIRS = ["data/family-case-file", "data/family-word-problems"];

const jsonFilesIn = (dir) =>
  existsSync(join(REPO_ROOT, dir))
    ? readdirSync(join(REPO_ROOT, dir))
        .filter((n) => n.endsWith(".json"))
        .sort()
        .map((n) => join(dir, n))
    : [];

/** Every authored Spanish string in data/, tagged { file, path, text, lesson }. Sidecars include the v3 blocks. */
export function collectDataSpanish() {
  const out = [];
  const add = (file, lesson, it) =>
    out.push({ file, lesson, path: it.path, text: it.text, en: it.en });
  for (const file of jsonFilesIn(SIDECAR_DIR)) {
    const lesson = file
      .split("/")
      .pop()
      .replace(/\.json$/, "");
    for (const it of spanishStrings(read(file), lesson)) add(file, lesson, it);
  }
  for (const file of MAP_FILES) {
    const data = read(file);
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith("_") || k.startsWith("$")) continue;
      if (typeof v === "string")
        add(file, null, { path: `${file}["${k.slice(0, 40)}"]`, text: v, en: k });
    }
  }
  for (const file of [...ES_KEY_FILES, ...ES_KEY_DIRS.flatMap(jsonFilesIn)]) {
    for (const it of spanishStrings(read(file), file)) add(file, null, it);
  }
  const defs = read("data/family-glossary.json").terms || {};
  for (const [term, d] of Object.entries(defs)) {
    if (typeof d.es === "string")
      add("data/family-glossary.json", null, { path: `${term}.es`, text: d.es, en: d.en });
    if (typeof d.example?.es === "string")
      add("data/family-glossary.json", null, {
        path: `${term}.example.es`,
        text: d.example.es,
        en: d.example.en,
      });
  }
  return out;
}

/** Pairs {path, en, es} for the "identical EN/ES" rule: sibling keys (x / xEs, en / es, hint / hintEs, stem / stemEs). */
export function* identicalCandidates(node, path = "") {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* identicalCandidates(node[i], `${path}[${i}]`);
    return;
  }
  if (!isObj(node)) return;
  for (const [k, v] of Object.entries(node)) {
    const esKey = k === "en" ? "es" : k === "En" ? "Es" : `${k}Es`;
    const alt = k.endsWith("En") ? `${k.slice(0, -2)}Es` : null;
    for (const ek of [esKey, alt].filter(Boolean)) {
      if (ek in node && typeof v === "string" && typeof node[ek] === "string")
        yield { path: `${path}.${k}`, en: v, es: node[ek] };
      else if (ek in node && Array.isArray(v) && Array.isArray(node[ek]))
        for (let i = 0; i < v.length; i++)
          if (typeof v[i] === "string" && typeof node[ek][i] === "string")
            yield { path: `${path}.${k}[${i}]`, en: v[i], es: node[ek][i] };
    }
    yield* identicalCandidates(v, `${path}.${k}`);
  }
}

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);
const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|<!--[\s\S]*?-->/g;
const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const attrOf = (attrs, name) =>
  attrs
    .match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`))
    ?.slice(2)
    .find((x) => x !== undefined);

/**
 * Spanish text nodes of a generated page: text inside an element with lang="es" or a *-es class
 * (lang-es, vocab-es, chip-label-es, ...), until a descendant switches back to another lang.
 * A tiny tag scanner (not a full parser): the generated pages are well formed and this runs on 166 x 560 KB.
 * Returns [{ text, tag }] with the enclosing tag, to name a card.
 */
export function pageSpanish(html) {
  const out = [];
  const stack = [];
  let es = false;
  let pos = 0;
  let raw = null; // inside <script>/<style>
  TAG.lastIndex = 0;
  for (let m = TAG.exec(html); m; m = TAG.exec(html)) {
    if (raw) {
      if (m[1] === "/" && m[2].toLowerCase() === raw) {
        raw = null;
        pos = TAG.lastIndex;
      }
      continue;
    }
    if (es && m.index > pos) {
      const text = decode(html.slice(pos, m.index)).replace(/\s+/g, " ").trim();
      if (text && /\p{L}/u.test(text)) out.push({ text, tag: stack.at(-1)?.name ?? "" });
    }
    pos = TAG.lastIndex;
    if (!m[2]) continue; // comment
    const name = m[2].toLowerCase();
    if (m[1] === "/") {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name) {
          stack.length = i;
          break;
        }
      }
      es = stack.length ? stack.at(-1).es : false;
      continue;
    }
    const lang = attrOf(m[3], "lang");
    const cls = attrOf(m[3], "class") || "";
    let here = stack.length ? stack.at(-1).es : false;
    if (lang) here = lang.toLowerCase().startsWith("es");
    else if (/(^|\s)(lang-es|[a-z0-9-]+-es)(\s|$)/.test(cls)) here = true;
    if (name === "script" || name === "style") {
      raw = name;
      continue;
    }
    if (!VOID.has(name) && !m[3].trimEnd().endsWith("/")) stack.push({ name, es: here });
    es = here;
  }
  return out;
}

/* --------------------------------------------------------------- glossary */

export const GLOSSARY_PATH = join("data", "family-glossary.json");
export const loadGlossary = () => read(GLOSSARY_PATH);
/** Words, units and names that are legitimately identical in English and Spanish (data/family-glossary.json). */
export const loadCognates = () =>
  new Set((loadGlossary().sameInSpanish || []).map((w) => w.toLowerCase()));

/** Spanish string literals of the homework generators: lang="es" spans and `es:` / `fooEs:` properties. */
export function collectGeneratorSpanish() {
  const out = [];
  const dirs = ["scripts", "scripts/lib"];
  const mine = /^(homework|family|generate-homework|generate-word)/;
  for (const dir of dirs) {
    const abs = join(REPO_ROOT, dir);
    for (const f of existsSync(abs) ? readdirSync(abs).sort() : []) {
      if (!mine.test(f) || !f.endsWith(".mjs")) continue;
      const lines = readFileSync(join(abs, f), "utf8").split("\n");
      lines.forEach((ln, i) => {
        const found = [];
        for (const m of ln.matchAll(/lang="es"[^>]*>([^<]{3,})</g)) found.push(m[1]);
        for (const m of ln.matchAll(/\b(?:es|\w+Es)\s*:\s*(["'`])((?:\\.|(?!\1).)*)\1/g))
          found.push(m[2]);
        for (const t of found) {
          const text = t.replace(/\$\{[^}]*\}/g, " ").trim();
          if (text && /\p{L}/u.test(text))
            out.push({ file: `${dir}/${f}`, path: `${dir}/${f}:${i + 1}`, text });
        }
      });
    }
  }
  return out;
}

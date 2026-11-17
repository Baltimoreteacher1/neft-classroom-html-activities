// What a plain-language query asks for, beyond its words: a grade ("third grade", "6th", "kínder"), a skill
// ("speaking", "talk"), a kind of resource ("games", "worksheets") or an audience ("family", "teacher").
// Pure data and pure functions (no DOM): src/lang/site-search.js ranks with it and Node tests import it.
//
//   parseGrades("third grade listening") -> { rest: "listening", bands: ["2-3", "3-5"], grades: ["3"] }
//   FACET_WORDS.rk.game                  -> the words that mean "a game"
//
// A grade is a content band from src/grade-bands.js; grade 3 is taught in two bands (2-3 and 3-5), so it asks for
// both. Facet words are matched against a document's metadata (sitemap kind, skill, audience, format), so
// "speaking games" finds a game whose title never says "speaking".

/** Content bands each grade is taught in (src/grade-bands.js BAND_INFO[...].grades). */
export const GRADE_BANDS = {
  K: ["K"],
  1: ["1"],
  2: ["2-3"],
  3: ["2-3", "3-5"],
  4: ["3-5"],
  5: ["3-5"],
  6: ["6-8"],
  7: ["6-8"],
  8: ["6-8"],
};

const ORDINAL = {
  first: "1",
  "1st": "1",
  second: "2",
  "2nd": "2",
  third: "3",
  "3rd": "3",
  fourth: "4",
  "4th": "4",
  fifth: "5",
  "5th": "5",
  sixth: "6",
  "6th": "6",
  seventh: "7",
  "7th": "7",
  eighth: "8",
  "8th": "8",
  // Spanish ordinals ("tercer grado", "sexto")
  primer: "1",
  primero: "1",
  segundo: "2",
  tercer: "3",
  tercero: "3",
  cuarto: "4",
  quinto: "5",
  sexto: "6",
  septimo: "7",
  octavo: "8",
};
const NUMBER = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  k: "K",
};
const GRADE_WORD = new Set(["grade", "grades", "grado", "grados", "gr"]);
const KINDER = new Set(["kindergarten", "kinder", "kindergarden", "kinders", "prek"]);

const gradeOf = (t) => {
  if (/^[1-8]$/.test(t)) return t;
  return NUMBER[t] || null;
};

/**
 * Pull grade words out of a normalized query. Returns the remaining text, the grades named and the content bands
 * they map to (null when the query names no grade). A bare number is a grade only next to "grade"/"grado", so
 * "12 weeks" or "part 2" is left alone.
 */
export function parseGrades(normalized) {
  const toks = String(normalized || "")
    .split(" ")
    .filter(Boolean);
  const used = new Set();
  const grades = [];
  const add = (g, ...idx) => {
    if (!g) return;
    grades.push(g);
    for (const i of idx) used.add(i);
  };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (used.has(i)) continue;
    if (KINDER.has(t)) add("K", i);
    else if (t === "middle" && toks[i + 1] === "school") {
      add("6", i, i + 1);
      grades.push("7", "8");
    } else if (ORDINAL[t]) {
      const next = GRADE_WORD.has(toks[i + 1]) ? [i + 1] : [];
      // "first" alone is too common an English word; it is a grade only next to "grade".
      if (
        next.length ||
        /\d/.test(t) ||
        ["tercer", "sexto", "quinto", "cuarto", "septimo", "octavo"].includes(t)
      )
        add(ORDINAL[t], i, ...next);
    } else if (GRADE_WORD.has(t)) {
      // "grade 6", "grades 3 5" (from "grades 3-5"), "grado k"
      const a = gradeOf(toks[i + 1]);
      const b = gradeOf(toks[i + 2]);
      if (a && b && t.endsWith("s")) {
        const lo = a === "K" ? 0 : +a;
        const hi = b === "K" ? 0 : +b;
        for (let g = lo; g <= hi; g++) grades.push(g === 0 ? "K" : String(g));
        used
          .add(i)
          .add(i + 1)
          .add(i + 2);
      } else if (a) add(a, i, i + 1);
    } else if (/^[1-8](st|nd|rd|th)$/.test(t)) add(t[0], i);
  }
  if (!grades.length) return { rest: toks.join(" "), bands: null, grades: [] };
  const uniq = [...new Set(grades)];
  // "Grades 3-5" names a band exactly: use that band alone instead of every band its grades touch.
  const exact =
    uniq.join("-") === "3-4-5"
      ? ["3-5"]
      : uniq.join("-") === "6-7-8"
        ? ["6-8"]
        : uniq.join("-") === "2-3"
          ? ["2-3"]
          : null;
  const bands = exact || [...new Set(uniq.flatMap((g) => GRADE_BANDS[g] || []))];
  return { rest: toks.filter((_, i) => !used.has(i)).join(" "), bands, grades: uniq };
}

// ── facet vocabulary ─────────────────────────────────────────────────────────────────────────
// Words that name a facet value, English and Spanish, normalized (no accents). Both the singular and the plural are
// listed because the ranker matches whole words and word starts.
export const FACET_WORDS = {
  skill: {
    Listening: [
      "listening",
      "listen",
      "hear",
      "hearing",
      "audio",
      "escuchar",
      "escucha",
      "auditiva",
    ],
    Speaking: [
      "speaking",
      "speak",
      "talk",
      "talking",
      "oral",
      "say",
      "hablar",
      "habla",
      "expresion",
    ],
    Reading: ["reading", "read", "leer", "lectura"],
    Writing: ["writing", "write", "escribir", "escritura"],
    Words: [
      "vocabulary",
      "vocab",
      "words",
      "word",
      "grammar",
      "vocabulario",
      "palabras",
      "gramatica",
    ],
  },
  rk: {
    game: ["game", "games", "play", "playing", "fun", "juego", "juegos", "jugar"],
    world: [
      "world",
      "worlds",
      "adventure",
      "adventures",
      "mundo",
      "mundos",
      "aventura",
      "aventuras",
    ],
    studio: ["studio", "studios", "estudio", "estudios"],
    practice: [
      "practice",
      "activity",
      "activities",
      "exercise",
      "exercises",
      "practica",
      "actividad",
      "actividades",
    ],
    test: ["test", "tests", "prep", "access", "wida", "exam", "prueba", "pruebas", "examen"],
    tool: ["tool", "tools", "herramienta", "herramientas"],
    guide: ["guide", "guides", "handout", "handouts", "how", "guia", "guias"],
    story: ["story", "stories", "book", "books", "cuento", "cuentos", "libro", "libros"],
    progress: ["progress", "progreso"],
    printable: [
      "printable",
      "printables",
      "print",
      "worksheet",
      "worksheets",
      "paper",
      "packet",
      "packets",
      "pdf",
      "imprimir",
      "imprimible",
      "imprimibles",
      "hoja",
      "hojas",
    ],
  },
  for: {
    teacher: [
      "teacher",
      "teachers",
      "teach",
      "teaching",
      "classroom",
      "docente",
      "docentes",
      "maestro",
      "maestra",
      "maestros",
    ],
    family: [
      "family",
      "families",
      "parent",
      "parents",
      "home",
      "caregiver",
      "caregivers",
      "familia",
      "familias",
      "padres",
      "casa",
    ],
    student: [
      "student",
      "students",
      "kid",
      "kids",
      "learner",
      "learners",
      "estudiante",
      "estudiantes",
      "alumno",
      "alumnos",
    ],
  },
};

/** word -> [{ facet, value }] for every facet word. */
export const FACET_INDEX = (() => {
  const m = new Map();
  for (const [facet, values] of Object.entries(FACET_WORDS))
    for (const [value, list] of Object.entries(values))
      for (const w of list) {
        if (!m.has(w)) m.set(w, []);
        m.get(w).push({ facet, value });
      }
  return m;
})();

/** Which facet values the query words name: { skill: Set, rk: Set, for: Set }. */
export function facetHints(qw) {
  const out = { skill: new Set(), rk: new Set(), for: new Set() };
  for (const w of qw)
    for (const { facet, value } of FACET_INDEX.get(w) || []) out[facet].add(value);
  return out;
}

/** Words that only pad a request ("find me some activities for ..."): dropped when the query has other words. */
export const FILLER = new Set([
  "find",
  "me",
  "my",
  "some",
  "show",
  "need",
  "want",
  "looking",
  "look",
  "resources",
  "resource",
  "materials",
  "ideas",
  "things",
  "stuff",
  "good",
  "i",
  "quiero",
  "busco",
  "buscar",
  "recursos",
]);

/** Edit distance between a and b, giving up (returning max + 1) once it is clearly over `max`. */
export function editDistance(a, b, max = 2) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** The typo budget for a query word: none under 4 letters, one up to 6, two from 7. */
export const typoBudget = (w) => (w.length >= 7 ? 2 : w.length >= 4 ? 1 : 0);

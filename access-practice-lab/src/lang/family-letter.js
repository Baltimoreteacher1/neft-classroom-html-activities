// A one-page progress letter for families, in English and Spanish, built from the learner's own saved
// work on this device. It reports what was practiced, what is going well and how much help was used, then
// suggests one five-minute thing to do at home. Counts and plain sentences only: no score, no level, no
// prediction. Nothing is sent anywhere; the learner prints it or saves it as a PDF and hands it over.
import { FEATURES, MIN_POINTS, buildProfile } from "./ledger.js";
import { supportsReport } from "./supports-report.js";

const DOMAIN_ES = {
  Listening: "Escuchar",
  Reading: "Leer",
  Speaking: "Hablar",
  Writing: "Escribir",
};
const GOING_WELL = {
  words: ["is saying or writing more", "está diciendo o escribiendo más"],
  link: ["is joining ideas in more ways", "está uniendo ideas de más maneras"],
  cites: ["is using more evidence from the text", "está usando más evidencia del texto"],
  moves: [
    "is covering more of what the task asks",
    "está cumpliendo con más de lo que pide la tarea",
  ],
  complex: [
    "is using longer sentences with more than one idea",
    "está usando oraciones más largas con más de una idea",
  ],
  errs: [
    "is making fewer small language slips",
    "está cometiendo menos errores pequeños de lenguaje",
  ],
  academic: ["is using more exact subject words", "está usando más palabras exactas del tema"],
};

/** One five-minute idea per skill. Adults are addressed as "ustedes"; any home language is welcome first. */
export const HOME_IDEAS = Object.freeze({
  Listening: {
    en: "Listen together. Play a short video or song in English, or read a page aloud. Ask: What was the main idea? Say one detail you heard.",
    es: "Escuchen juntos. Pongan un video corto o una canción en inglés, o lean una página en voz alta. Pregunten: ¿Cuál fue la idea principal? Digan un detalle que escucharon.",
  },
  Reading: {
    en: "Read one short page together, in any language. Ask: Which sentence proves your answer? Point to it and read it aloud.",
    es: "Lean juntos una página corta, en cualquier idioma. Pregunten: ¿Qué oración prueba tu respuesta? Señálenla y léanla en voz alta.",
  },
  Speaking: {
    en: "Ask your child to explain one thing from today's class. Any language is welcome first. Then try one sentence in English with the word because.",
    es: "Pídanle que explique una cosa de la clase de hoy. Primero puede usar cualquier idioma. Luego pueden probar una oración en inglés con la palabra because.",
  },
  Writing: {
    en: "Ask your child to write two sentences about their day and join them with because or then. Read the sentences aloud together.",
    es: "Pídanle que escriba dos oraciones sobre su día y que las una con because o then. Lean las oraciones en voz alta juntos.",
  },
});

const DOMAINS = Object.keys(HOME_IDEAS);

/** The domain with the fewest finished activities (Speaking wins a tie: it is the least practiced at home). */
export function homeIdeaDomain(counts = {}) {
  return [...DOMAINS].sort(
    (a, b) =>
      (counts[a] || 0) - (counts[b] || 0) || (a === "Speaking" ? -1 : b === "Speaking" ? 1 : 0),
  )[0];
}

/**
 * @param {{name?: string, counts?: Record<string, number>, entries?: object[], records?: object|object[], now?: Date}} source
 * @returns {{en: object, es: object, homeDomain: string}} one letter per language: `{title, date, greeting, sections:[{h, p:[...]}], closing, note}`
 */
export function buildLetter({
  name = "",
  counts = {},
  entries = [],
  records = {},
  now = new Date(),
} = {}) {
  const who = String(name || "")
    .trim()
    .slice(0, 40);
  const date = now.toISOString().slice(0, 10);
  const report = supportsReport({ entries, records });
  const profile = buildProfile(Array.isArray(entries) ? entries : []);
  const going = Object.entries(profile.features)
    .filter(
      ([key, f]) =>
        Object.hasOwn(GOING_WELL, key) && f.all.status === "ok" && f.all.direction === "improving",
    )
    .slice(0, 3)
    .map(([key]) => GOING_WELL[key]);
  const homeDomain = homeIdeaDomain(counts);
  const total = DOMAINS.reduce((n, d) => n + (counts[d] || 0), 0);
  const lang = (i) => {
    const en = i === 0;
    const subject = who || (en ? "Your child" : "Su hijo o hija");
    const practiced = DOMAINS.map((d) => `${en ? d : DOMAIN_ES[d]}: ${counts[d] || 0}`);
    return {
      title: en
        ? "ACCESS Practice Lab: a note for families"
        : "ACCESS Practice Lab: una nota para las familias",
      date,
      greeting: en
        ? who
          ? `Dear family of ${who},`
          : "Dear family,"
        : who
          ? `Estimada familia de ${who}:`
          : "Estimada familia:",
      sections: [
        {
          h: en ? "What we practiced" : "Lo que practicamos",
          p: [
            total
              ? en
                ? `${subject} has finished practice activities in the lab (${practiced.join(", ")}).`
                : `${subject} ha terminado actividades de práctica en el laboratorio (${practiced.join(", ")}).`
              : en
                ? `${subject} has just started in the lab. This letter will fill in as practice is saved.`
                : `${subject} acaba de empezar en el laboratorio. Esta carta se llenará a medida que se guarde la práctica.`,
          ],
        },
        {
          h: en ? "What is going well" : "Lo que va bien",
          p: going.length
            ? going.map((g) => (en ? `${subject} ${g[0]}.` : `${subject} ${g[1]}.`))
            : [
                en
                  ? `We need at least ${MIN_POINTS} pieces of speaking or writing before we can describe a pattern. Keep practicing and check back.`
                  : `Necesitamos al menos ${MIN_POINTS} trabajos de habla o escritura antes de poder describir un patrón. Sigan practicando y vuelvan a revisar.`,
              ],
        },
        ...(report.lines.length
          ? [
              {
                h: en ? "How much help was used" : "Cuánta ayuda se usó",
                p: report.lines.map((l) => (en ? l.en : l.es)),
              },
            ]
          : []),
        {
          h: en ? "One thing to try at home (5 minutes)" : "Algo para probar en casa (5 minutos)",
          p: [HOME_IDEAS[homeDomain][en ? "en" : "es"]],
        },
      ],
      closing: en
        ? "Thank you for supporting your child's English learning, in every language you use at home."
        : "Gracias por apoyar el aprendizaje de inglés de su estudiante, en todos los idiomas que usan en casa.",
      note: en
        ? "This letter describes classroom practice from this device. It is not a WIDA ACCESS score, level or placement."
        : "Esta carta describe la práctica en clase guardada en este dispositivo. No es un puntaje, nivel ni colocación de WIDA ACCESS.",
    };
  };
  return { en: lang(0), es: lang(1), homeDomain };
}

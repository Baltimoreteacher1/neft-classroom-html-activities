// The WIDA ACCESS practice studios: standalone pages under /wida-access/ that the lab links from Practice and that
// The Language Page serves in its own chrome. One list, read by the library view and by the lab-host routing in
// functions/_lib/language-page.js, so a studio cannot be linked without being served or served without being linked.
//
// Deliberately absent: /wida-access/ itself (the school's ACCESS score dashboard) and /wida-access/portfolio/ (a
// gradebook seeded with student rows). Those are school data, not practice, and stay on eduwonderlab.com only.
// `skill` picks the lab's domain colour for the studio's chrome.

export const STUDIOS_BASE = "/wida-access";

export const STUDIOS = [
  {
    slug: "listening",
    skill: "listening",
    title: "Listening Studio",
    titleEs: "Estudio de comprensión auditiva",
    blurb: "20 academic listening tasks with adjustable playback speed.",
    blurbEs: "20 tareas académicas de comprensión auditiva con velocidad ajustable.",
  },
  {
    slug: "reading",
    skill: "reading",
    title: "Reading Studio",
    titleEs: "Estudio de lectura",
    blurb: "Six reading sets across science, social studies, math and ELA, with instant feedback.",
    blurbEs: "Seis lecturas de ciencias, estudios sociales, matemáticas y lengua, con respuesta inmediata.",
  },
  {
    slug: "speaking",
    skill: "speaking",
    title: "Speaking Studio",
    titleEs: "Estudio de expresión oral",
    blurb: "Speaking tasks that build from naming to discussing, grades 6–8.",
    blurbEs: "Tareas orales que avanzan de nombrar a conversar, de 6.º a 8.º grado.",
  },
  {
    slug: "writing",
    skill: "writing",
    title: "Writing Studio",
    titleEs: "Estudio de escritura",
    blurb: "20 writing tasks with models for two support tiers.",
    blurbEs: "20 tareas de escritura con modelos para dos niveles de apoyo.",
  },
  {
    slug: "directions-trainer",
    skill: "listening",
    title: "Directions Trainer",
    titleEs: "Entrenador de instrucciones",
    blurb: "Multi-step spoken directions: compass points, coordinates and position words.",
    blurbEs: "Instrucciones orales de varios pasos: puntos cardinales, coordenadas y palabras de posición.",
  },
  {
    slug: "word-builder",
    skill: "reading",
    title: "Word Builder",
    titleEs: "Constructor de palabras",
    blurb: "Build academic words from Latin and Greek roots, prefixes and suffixes.",
    blurbEs: "Forma palabras académicas con raíces latinas y griegas, prefijos y sufijos.",
  },
  {
    slug: "reward-shop",
    skill: "brand",
    title: "Reward Shop",
    titleEs: "Tienda de premios",
    blurb: "Spend the XP you earn in the studios on a study buddy, themes and trophies.",
    blurbEs: "Usa los XP que ganas en los estudios en un compañero de estudio, temas y trofeos.",
  },
];

export const studioPath = (slug) => `${STUDIOS_BASE}/${slug}/`;

/** The studio a pathname belongs to (any file under its folder), or null. */
export function studioFor(pathname) {
  const p = pathname.toLowerCase();
  return (
    STUDIOS.find((s) => p === `${STUDIOS_BASE}/${s.slug}` || p.startsWith(studioPath(s.slug))) ||
    null
  );
}

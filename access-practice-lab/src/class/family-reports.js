// Whole-class family reports (Language Page teacher tools): one printed page per student, in English, Spanish or
// both, built from the class summaries the teacher already sees (counts per domain and this week's practice days)
// through the same letter builder learners use at home (lang/family-letter.js). Counts and plain sentences only:
// no level, no score, no prediction. Nothing is sent anywhere; the browser prints the pages.
import { buildLetter } from "../lang/family-letter.js";
import { el } from "./dom.js";

const DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];
const NOTE = {
  en: "This letter describes practice your child saved to their class in The Language Page. It is not a WIDA ACCESS score, level or placement.",
  es: "Esta carta describe la práctica que su estudiante guardó en su clase de The Language Page. No es un puntaje, nivel ni colocación de WIDA ACCESS.",
};

/**
 * Letters for every student: [{ alias, en, es }]. Only the "what we practiced" and "try at home" sections are kept:
 * the class summary holds counts, not the work itself, so the pattern sections would have nothing honest to say.
 */
export function classLetters(students = [], now = new Date()) {
  return students.map((s) => {
    const sum = s.docs?.language?.summary || {};
    const counts = Object.fromEntries(
      DOMAINS.map((d) => [d, Number(sum.domains?.[d.toLowerCase()]) || 0]),
    );
    const letter = buildLetter({ name: s.alias, counts, now });
    const days = Number(sum.weekDays) || 0;
    const week = {
      en: {
        h: "This week",
        p: [`${s.alias} practiced on ${days} day${days === 1 ? "" : "s"} this week.`],
      },
      es: {
        h: "Esta semana",
        p: [`${s.alias} practicó ${days} ${days === 1 ? "día" : "días"} esta semana.`],
      },
    };
    const shape = (lang) => {
      const l = letter[lang];
      return { ...l, sections: [l.sections[0], week[lang], l.sections.at(-1)], note: NOTE[lang] };
    };
    return { alias: s.alias, en: shape("en"), es: shape("es") };
  });
}

const letterEl = (l, lang) =>
  el(
    "article",
    { class: "cls-letter", lang },
    el("h2", {}, l.title),
    el("p", { class: "fine" }, l.date),
    el("p", {}, l.greeting),
    l.sections.map((s) => [el("h3", {}, s.h), s.p.map((p) => el("p", {}, p))]),
    el("p", {}, l.closing),
    el("p", { class: "fine" }, l.note),
  );

/** The print pages: one `.cls-family-page` per student holding the chosen language(s). */
export function familyPages(students, langs = ["en", "es"], now = new Date()) {
  return el(
    "div",
    { class: "cls-family-print", "aria-hidden": "true" },
    classLetters(students, now).map((x) =>
      el(
        "section",
        { class: `cls-family-page${langs.length > 1 ? " is-both" : ""}` },
        langs.map((lang) => letterEl(x[lang], lang)),
      ),
    ),
  );
}

/** Controls: a language choice and the print button. `getStudents()` returns the latest roster's students. */
export function familyReportControls(S, getStudents) {
  const lang = el(
    "select",
    { "aria-label": S("Letter language", "Idioma de la carta") },
    el("option", { value: "both" }, S("English and Spanish", "Inglés y español")),
    el("option", { value: "en" }, S("English", "Inglés")),
    el("option", { value: "es" }, S("Spanish", "Español")),
  );
  const print = el(
    "button",
    { type: "button", class: "btn" },
    S("Print family reports for the class", "Imprimir informes para las familias de la clase"),
  );
  print.addEventListener("click", () => {
    const students = getStudents();
    if (!students.length) return;
    const pages = familyPages(students, lang.value === "both" ? ["en", "es"] : [lang.value]);
    document.body.append(pages);
    document.body.dataset.printing = "cls-family";
    const done = () => {
      pages.remove();
      delete document.body.dataset.printing;
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  });
  return el(
    "div",
    { class: "row-actions" },
    lang,
    print,
    el(
      "p",
      { class: "fine" },
      S(
        "One page per student from class practice counts. No level or score appears.",
        "Una página por estudiante con las cantidades de práctica de la clase. No aparece ningún nivel ni puntaje.",
      ),
    ),
  );
}

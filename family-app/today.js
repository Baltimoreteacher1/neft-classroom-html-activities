// Family home "Today" panel: renders the read-only summary from progress.js, in both languages.
import { englishSummary, fluencySummary, suggestNext } from "./progress.js";

const store = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  keys: () => {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },
};

const days = (n) => ({
  en: `${n} ${n === 1 ? "day" : "days"}`,
  es: `${n} ${n === 1 ? "día" : "días"}`,
});

const mathLine = (m) =>
  m.daysThisWeek === 0
    ? { en: "Math: not started this week.", es: "Matemáticas: aún no empiezas esta semana." }
    : {
        en: `Math: ${days(m.daysThisWeek).en} this week · ${m.answeredThisWeek} answered · ${m.withoutHelpThisWeek} right without help`,
        es: `Matemáticas: ${days(m.daysThisWeek).es} esta semana · ${m.answeredThisWeek} respondidas · ${m.withoutHelpThisWeek} correctas sin ayuda`,
      };

const englishLine = (e) =>
  e.daysThisWeek === 0
    ? { en: "English: not started this week.", es: "Inglés: aún no empiezas esta semana." }
    : {
        en: `English: ${days(e.daysThisWeek).en} this week · ${e.activitiesThisWeek} ${e.activitiesThisWeek === 1 ? "activity" : "activities"}`,
        es: `Inglés: ${days(e.daysThisWeek).es} esta semana · ${e.activitiesThisWeek} ${e.activitiesThisWeek === 1 ? "actividad" : "actividades"}`,
      };

const NEXT = {
  math: {
    href: "/math/fluency-lab/",
    en: "Next up: Math Fluency Lab (about 5 minutes)",
    es: "Siguiente: Laboratorio de fluidez (unos 5 minutos)",
  },
  english: {
    href: "/access-practice-lab/",
    en: "Next up: The Language Page (one activity)",
    es: "Siguiente: The Language Page (una actividad)",
  },
};

const bilingual = (tag, text) =>
  `<${tag}><span class="en">${text.en}</span><span class="es">${text.es}</span></${tag}>`;

export function renderToday(root) {
  const math = fluencySummary(store);
  const english = englishSummary(store);
  const next = NEXT[suggestNext(math, english)];
  root.innerHTML =
    '<h2 id="today-h"><span class="en">Today</span><span class="es">Hoy</span></h2>' +
    bilingual("p", mathLine(math)) +
    bilingual("p", englishLine(english)) +
    `<a class="next" href="${next.href}"><span class="en">${next.en}</span><span class="es">${next.es}</span></a>` +
    bilingual("small", {
      en: "Counts come from this device only. Nothing is sent anywhere.",
      es: "Los conteos vienen solo de este dispositivo. No se envía nada.",
    });
  root.hidden = false;
}

const root = document.getElementById("today");
if (root) renderToday(root);

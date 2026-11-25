// /method: how a practice item is built, how help fades, what the AI does and does not do, and what the lab can and cannot
// show yet, in plain English and Spanish. Every statement here is one the code or the content already makes; nothing is
// claimed about learning gains (no study has been run: docs/language-page/efficacy-plan.md) and no review is claimed that
// has not happened (docs/language-page/human-required.md).
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { BASE, html, icon } from "../util.js";
import { trustSectionHTML } from "./privacy.js";

export const METHOD_SECTIONS = [
  {
    id: "methodWhat",
    title: ["What this is", "Qué es esto"],
    points: [
      [
        "Original practice for English at school, in your language, for kindergarten through grade 8.",
        "Práctica original de inglés para la escuela, en tu idioma, desde kindergarten hasta octavo grado.",
      ],
      [
        "It is organized around the four WIDA domains: Listening, Speaking, Reading and Writing. It is practice for the real test, not the test, and it is not made by WIDA.",
        "Está organizada en torno a los cuatro dominios de WIDA: comprensión auditiva, expresión oral, lectura y escritura. Es práctica para la prueba real, no la prueba, y no la hace WIDA.",
      ],
      [
        "The lab never gives a score, a level or a prediction. Stamps show what you practiced, not how well you will do.",
        "El laboratorio nunca da una puntuación, un nivel ni una predicción. Los sellos muestran lo que practicaste, no cómo te irá.",
      ],
    ],
  },
  {
    id: "methodBuilt",
    title: ["How an activity is built", "Cómo se hace una actividad"],
    points: [
      [
        "Each activity is written by a person for one language skill, such as following a direction with place words.",
        "Cada actividad la escribe una persona para una habilidad de lenguaje, como seguir una instrucción con palabras de lugar.",
      ],
      [
        "A wrong answer gets a specific hint about that answer, not just “try again”.",
        "Una respuesta incorrecta recibe una pista específica sobre esa respuesta, no solo “inténtalo de nuevo”.",
      ],
      [
        "Words that may be new come with a plain meaning and a Spanish meaning, and many activities offer sentence frames.",
        "Las palabras que pueden ser nuevas vienen con un significado sencillo y uno en español, y muchas actividades ofrecen marcos de oraciones.",
      ],
    ],
  },
  {
    id: "methodFade",
    title: ["How help fades", "Cómo se retira la ayuda"],
    points: [
      [
        "You can work with help, with some help, or on your own.",
        "Puedes trabajar con ayuda, con algo de ayuda o por tu cuenta.",
      ],
      [
        "On your own shows no sentence frames, word bank or model. Only that work counts as independent.",
        "Por tu cuenta no muestra marcos de oraciones, banco de palabras ni modelo. Solo ese trabajo cuenta como independiente.",
      ],
    ],
  },
  {
    id: "methodAI",
    title: ["What the AI does and does not do", "Qué hace y qué no hace la IA"],
    points: [
      [
        "Where the lab uses an AI helper, it chooses among moves a person wrote, asks a question, or answers from the lab’s own pages.",
        "Donde el laboratorio usa una ayuda de IA, elige entre pasos que escribió una persona, hace una pregunta o responde con las páginas del propio laboratorio.",
      ],
      [
        "It does not write your work, score it, or tell you a level. Every AI route is listed on the Privacy page, with what it is sent.",
        "No escribe tu trabajo, no lo califica ni te dice un nivel. Cada ruta de IA está en la página de Privacidad, con lo que recibe.",
      ],
    ],
  },
  {
    id: "methodLimits",
    title: ["What is not shown yet", "Lo que todavía no se muestra"],
    points: [
      [
        "No study of learning gains has been run. Until one is, the lab does not say that it works.",
        "Todavía no se ha hecho ningún estudio de avances de aprendizaje. Hasta que se haga, el laboratorio no dice que funciona.",
      ],
      [
        "The Spanish and the WIDA labels were written by the authors and have not had an outside review yet.",
        "El español y las etiquetas de WIDA los escribieron los autores y todavía no han tenido una revisión externa.",
      ],
      [
        "Listening items are read aloud by your device’s voice. Recorded human voices with captions are planned and not made yet.",
        "Los ejercicios de comprensión auditiva los lee la voz de tu dispositivo. Las voces humanas grabadas con subtítulos están planeadas y todavía no se han hecho.",
      ],
    ],
  },
];

export function render(ctx) {
  const I = i18nFor(ctx);
  const q = `?grades=${ctx.band}`;
  return {
    title: I.S("How the lab works", "Cómo funciona el laboratorio"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/${q}`],
        [I.S("How it works", "Cómo funciona"), null],
      ])}
      <article class="trust-page" aria-labelledby="methodTitle">
        <header class="trust-head">
          <p class="eyebrow">${icon("help")} ${I.T("Method", "Método")}</p>
          <h1 id="methodTitle" tabindex="-1">
            ${I.T("How the lab works", "Cómo funciona el laboratorio")}
          </h1>
          <p class="lead">
            ${I.T("What each activity is built from, how help fades, and what the lab can and cannot show yet.", "De qué se hace cada actividad, cómo se retira la ayuda y lo que el laboratorio puede y no puede mostrar todavía.")}
          </p>
        </header>
        ${METHOD_SECTIONS.map((s) => trustSectionHTML(I, s.id, s.title, s.points))}
        <p class="fine">
          <a href="${BASE}/privacy${q}">${I.T("Privacy", "Privacidad")}</a>
          ·
          <a href="${BASE}/accessibility${q}">${I.T("Accessibility", "Accesibilidad")}</a>
        </p>
      </article>`,
  };
}

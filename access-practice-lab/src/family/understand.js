// Understand ACCESS: what the test is, why it matters, what the four skills look like at home, and what this lab is and is
// not. Plain language, English and Spanish, with an optional read-aloud for each section (the browser's own voices, with a
// printed fallback when none is available). No claim that practice predicts an official score.
import { html, icon } from "../util.js";
import { journeyHTML } from "./journey.js";
import { SKILLS, crumbs, skillName, subnavHTML } from "./ui.js";

const SECTIONS = (I) => [
  {
    id: "what",
    title: I.T("What is ACCESS?", "¿Qué es ACCESS?"),
    en: "ACCESS for ELLs is a yearly test of English that many U.S. states, including Maryland, give to students who are learning English. It checks four skills: listening, speaking, reading and writing. WIDA is the organization that writes the language standards and the test.",
    es: "ACCESS es una prueba anual de inglés que muchos estados de EE. UU., incluido Maryland, aplican a estudiantes que están aprendiendo inglés. Mide cuatro destrezas: comprensión auditiva, expresión oral, lectura y escritura. WIDA es la organización que escribe los estándares de lenguaje y la prueba.",
  },
  {
    id: "why",
    title: I.T("Why does it matter?", "¿Por qué es importante?"),
    en: "Results help your child's school plan language support. They are one of several things schools use to decide when a student no longer needs English-language services. One test is never the whole picture of what your child can do.",
    es: "Los resultados ayudan a la escuela de tu hijo a planear el apoyo de lenguaje. Son una de varias cosas que las escuelas usan para decidir cuándo un estudiante ya no necesita servicios de inglés. Una sola prueba nunca muestra todo lo que tu hijo puede hacer.",
  },
  {
    id: "lab",
    title: I.T("What this Practice Lab is, and is not", "Qué es y qué no es este Laboratorio de práctica"),
    en: "This is independent practice made by EduWonderLab. It is not the official test, it does not give an official score or level, and it cannot tell you what your child will score. Practice helps children feel familiar with the kinds of tasks they will see, and helps you notice what to practice next.",
    es: "Esta es práctica independiente hecha por EduWonderLab. No es la prueba oficial, no da un puntaje ni un nivel oficial y no puede decirte qué puntaje sacará tu hijo. La práctica ayuda a que los niños se familiaricen con el tipo de tareas que verán y a que tú notes qué practicar después.",
  },
  {
    id: "home",
    title: I.T("A simple routine at home", "Una rutina sencilla en casa"),
    en: "Ten minutes is enough. Pick one skill. Let your child try first, on their own. Then ask, \"How do you know?\" Praise the effort and the thinking, not only the answer. Come back tomorrow for another short turn.",
    es: "Diez minutos bastan. Elige una destreza. Deja que tu hijo lo intente primero, por su cuenta. Después pregunta: «¿Cómo lo sabes?». Elogia el esfuerzo y el razonamiento, no solo la respuesta. Vuelve mañana para otro turno corto.",
  },
];

const AT_HOME = {
  Listening: { en: "Listen together to a short story or the news and ask, “What was it about? Tell me the first thing, then the next.”", es: "Escuchen juntos un cuento corto o las noticias y pregunta: «¿De qué trató? Dime lo primero y después lo siguiente»." },
  Reading: { en: "Read a short text together. Ask your child to point to the sentence that shows the answer.", es: "Lean juntos un texto corto. Pide a tu hijo que señale la oración que muestra la respuesta." },
  Speaking: { en: "Ask for a short explanation: “Tell me how you made this, step by step.” Listen without correcting every word.", es: "Pide una explicación corta: «Cuéntame cómo hiciste esto, paso a paso». Escucha sin corregir cada palabra." },
  Writing: { en: "Write two or three sentences about something that happened today. Use words like first, next and because.", es: "Escriban dos o tres oraciones sobre algo que pasó hoy. Usen palabras que ordenan las ideas (primero, después) y que dan razones (porque), en español o en inglés." },
};

export async function render(ctx, I) {
  const band = ctx.band;
  const sections = SECTIONS(I);
  const say = (s) => html`<button type="button" class="ghost small" data-say="${s.en}">${icon("volume")} ${I.T("Listen in English", "Escuchar en inglés")}</button><button type="button" class="ghost small" data-say-es="${s.es}">${icon("volume")} ${I.T("Listen in Spanish", "Escuchar en español")}</button>`;
  return {
    title: I.S("Understand ACCESS", "Entender ACCESS"),
    html: html`${crumbs(I, I.S("Understand ACCESS", "Entender ACCESS"))}
      ${subnavHTML(I, "understand", band)}
      ${journeyHTML(I, "understand", band)}
      <section class="fam-understand panel" aria-labelledby="famUnderstandTitle">
        <h1 id="famUnderstandTitle" tabindex="-1">${I.T("Understand ACCESS", "Entender ACCESS")}</h1>
        <p class="lead">${I.T("A short, plain guide for families. Practice here is optional. The official ACCESS test is given at school.", "Una guía corta y sencilla para familias. La práctica aquí es opcional. La prueba oficial ACCESS se da en la escuela.")}</p>
        <p class="fine no-print">${I.T("Each part can be read aloud with your device's voice. If your device has no voice, the text is right here.", "Cada parte se puede escuchar con la voz de tu dispositivo. Si tu dispositivo no tiene voz, el texto está aquí.")}</p>
        ${sections.map((s) => html`<section class="fam-u-card" aria-labelledby="famU-${s.id}"><h2 id="famU-${s.id}">${s.title}</h2><p>${I.spanish ? s.es : s.en}</p>${I.bilingual ? html`<p lang="es">${s.es}</p>` : ""}<div class="fam-cta no-print">${say(s)}</div></section>`)}
        <section class="fam-u-card" aria-labelledby="famU-skills">
          <h2 id="famU-skills">${I.T("The four skills, at home", "Las cuatro destrezas, en casa")}</h2>
          <ul class="fam-u-skills">
            ${SKILLS.map((d) => html`<li class="d-${d.toLowerCase()}"><h3>${skillName(I, d)}</h3><p>${I.spanish ? AT_HOME[d].es : AT_HOME[d].en}</p>${I.bilingual ? html`<p lang="es">${AT_HOME[d].es}</p>` : ""}</li>`)}
          </ul>
        </section>
        <div class="fam-cta">
          <a class="btn btn-primary btn-big" href="/access-practice-lab/family/practice?grades=${band}">${I.T("Choose a skill to practice", "Elegir una destreza para practicar")}${icon("arrow-right")}</a>
          <a class="btn" href="/access-practice-lab/assess?grades=${band}">${I.T("Try a practice test together", "Probar una prueba de práctica juntos")}</a>
        </div>
      </section>`,
  };
}

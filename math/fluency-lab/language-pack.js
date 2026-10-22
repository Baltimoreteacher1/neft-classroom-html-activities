// Printable "Math Language Pack" for the skills a teacher picked: the skill's words in English and Español, the
// sentence frames at each support level in both languages, and a partner-talk task. Student pages carry no
// answers, and nothing here is a language proficiency score. The last page is for the teacher.
import { languageExpectation } from "./language-bridge.js";
import { LEVELS, framesFor, promptFor } from "./language-frames.js";
import { languageProfile } from "./language-terms.js";
import { findSkill } from "./tutor-engine.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const MOVES = [
  ["notice", "Notice / Observar"],
  ["explain", "Explain / Explicar"],
  ["check", "Check / Comprobar"],
  ["fix", "Fix it / Corregir"],
];

const wordRows = (skill) =>
  languageProfile(skill)
    .terms.map(
      (term) =>
        `<tr><td><b>${esc(term.en)}</b></td><td><b lang="es">${esc(term.es)}</b>${term.cognate ? " 🔗" : ""}</td><td>${esc(term.defEn)}</td><td lang="es">${esc(term.defEs)}</td></tr>`,
    )
    .join("");

const frameRows = () =>
  LEVELS.slice(0, 3)
    .map((level) => {
      const cells = MOVES.map(([fn]) =>
        framesFor(level.id, fn)
          .map((frame) => `${esc(frame.en)}<br><i lang="es">${esc(frame.es)}</i>`)
          .join("<br>"),
      );
      return `<tr><th>${esc(level.name)}</th>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
    })
    .join("");

const skillPage = (skill) => {
  const standard = languageExpectation(skill.grade);
  return `<article class="packet-page language-pack-page"><header><p>Math Fluency Lab · Grade ${skill.grade} · Math Language Pack</p><h1>${esc(skill.title)}</h1><p>Name / Nombre: ____________________ Date / Fecha: __________</p></header>
    <h2>Words for this skill · Palabras de esta destreza</h2>
    <table class="pack-table"><thead><tr><th>English</th><th>Español</th><th>Meaning</th><th>Significado</th></tr></thead><tbody>${wordRows(skill)}</tbody></table>
    <p class="pack-note">🔗 = the two words look alike. You can think in either language first.<br><i lang="es">🔗 = las dos palabras se parecen. Puedes pensar primero en cualquiera de los dos idiomas.</i></p>
    <h2>Sentence frames · Oraciones para completar</h2>
    <table class="pack-table"><thead><tr><th>Help / Ayuda</th>${MOVES.map(([, label]) => `<th>${label}</th>`).join("")}</tr></thead><tbody>${frameRows()}</tbody></table>
    <p class="pack-note"><b>${esc(LEVELS[3].name)}:</b> ${esc(promptFor("explain").en)}<br><i lang="es">${esc(promptFor("explain").es)}</i></p>
    <h2>Partner talk · Conversación en pareja</h2>
    <p>Partner A solves one problem and explains it with a frame. Partner B says it back: “You said ___. So ___.”<br><i lang="es">La persona A resuelve un problema y lo explica con una oración para completar. La persona B lo repite con sus palabras: «Dijiste ___. Entonces ___».</i></p>
    <p class="pack-lines">I know ______________________________ because ______________________________.<br><i lang="es">Sé que ______________________________ porque ______________________________.</i></p>
    <footer>${esc(standard.use)} · ${esc(standard.code)}</footer></article>`;
};

const teacherPage = (
  skills,
) => `<article class="packet-page teacher-answer-page"><h1>Teacher notes</h1>
  <p>This pack is built from the same word bank and sentence frames the Fluency Lab shows learners, so what you print matches what they see on screen.</p>
  <ul><li><b>Starter</b> usually supports learners who are building English with pictures and single words (WIDA levels 1–2).</li><li><b>Building</b> fits two-blank frames and joining words (level 3).</li><li><b>Growing</b> uses sentence starters (level 4).</li><li><b>On my own</b> asks the question with no frame (levels 5–6).</li></ul>
  <p>These are practice supports a learner can change at any time. They are not placements or proficiency scores, and the Lab never records one. Learners may think and answer in Spanish or English; both count as math reasoning.</p>
  <p>Skills in this pack: ${skills.map((skill) => esc(skill.title)).join(" · ")}.</p></article>`;

export function languagePackHtml(keys) {
  const skills = [...new Set(keys)].map((key) => findSkill(key)).filter(Boolean);
  return skills.length ? skills.map(skillPage).join("") + teacherPage(skills) : "";
}

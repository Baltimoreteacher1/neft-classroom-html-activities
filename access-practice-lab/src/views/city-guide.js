// Language City: the teacher-facing page (/city/teacher): what each mission asks of a learner, how the supports work and
// what counts as independent, and this device's own evidence per mission. Same pattern as /exhibition/teacher.
// Nothing here is a score, a level or a prediction; the counts are runs and steps, nothing more.
import { crumbsHTML } from "../components.js";
import { BUILDINGS, MISSIONS, missionsAt } from "../content/city.js";
import { ROLE_COPY, SUPPORT_COPY, SUPPORTS, runsOf, totalsFor } from "../lang/city.js";
import { TAGS } from "../lang/scenarios.js";
import { BASE, html } from "../util.js";
import { cityHref } from "./city-mission.js";
import { bandFor } from "./studio-kit.js";

const P = (I, pair) => I.T(pair.en, pair.es);
const PS = (I, pair) => I.S(pair.en, pair.es);

/** The language targets a mission asks the learner to use, in step order, without repeats. */
export const targetsOf = (mission) => [
  ...new Set(mission.steps.map((s) => s.target).filter(Boolean)),
];

export function guideHTML(ctx, I, st) {
  const band = bandFor(ctx.band);
  const t = totalsFor(st.prog, MISSIONS);
  return html`${crumbsHTML(
      [
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language City", "Ciudad del lenguaje"), cityHref("", band)],
        [I.S("Teacher notes", "Notas docentes"), null],
      ],
      { i18n: I },
    )}
    <header class="act-head">
      <h1 tabindex="-1">
        ${I.T("Language City: teacher notes", "Ciudad del lenguaje: notas docentes")}
      </h1>
      <p class="lead">
        ${I.T(`${BUILDINGS.length} buildings, ${MISSIONS.length} missions. Each mission chains real tasks: read a sign or menu, listen, respond, ask a question, repair a misunderstanding and say it in the learner's own words.`, `${BUILDINGS.length} edificios, ${MISSIONS.length} misiones. Cada misión encadena tareas reales: leer un letrero o menú, escuchar, responder, hacer una pregunta, reparar una confusión y decirlo con las propias palabras del estudiante.`)}
      </p>
    </header>
    <section class="panel" aria-labelledby="ctg-how">
      <h2 id="ctg-how">${I.T("Supports and independence", "Apoyos e independencia")}</h2>
      <p>
        ${I.T("Before each mission the learner chooses a support. The lab never chooses for them.", "Antes de cada misión el estudiante elige un apoyo. El laboratorio nunca elige por él.")}
      </p>
      <ul>
        ${SUPPORTS.map((s) => html`<li><b>${I.T(SUPPORT_COPY[s][0], SUPPORT_COPY[s][1])}</b>: ${I.T(SUPPORT_COPY[s][2], SUPPORT_COPY[s][3])}</li>`)}
      </ul>
      <p>
        ${I.T("A run is independent only if no help was opened at any point. Choosing a word bank or frames, opening a hint, turning on Spanish help or showing the words of a listening step marks the run as supported. Supported and independent runs are saved and shown separately, and a supported run is never counted as independent evidence.", "Una vuelta es independiente solo si no se abrió ninguna ayuda en ningún momento. Elegir un banco de palabras o estructuras, abrir una pista, activar la ayuda en español o mostrar las palabras de un paso de audio marca la vuelta como con apoyo. Las vueltas con apoyo e independientes se guardan y se muestran por separado, y una vuelta con apoyo nunca cuenta como evidencia independiente.")}
      </p>
      <p class="fine">
        ${I.T("The listening steps are spoken by the browser's built-in voice. A learner who cannot hear it can show the words; that is recorded as help, not as failure.", "Los pasos de audio los dice la voz integrada del navegador. Un estudiante que no pueda oírla puede mostrar las palabras; se registra como ayuda, no como fracaso.")}
      </p>
    </section>
    <section class="panel" aria-labelledby="ctg-steps">
      <h2 id="ctg-steps">${I.T("The chain in every mission", "La cadena en cada misión")}</h2>
      <ul>
        ${Object.entries(ROLE_COPY).map(([role, c]) => html`<li><b>${I.T(c[0], c[1])}</b>: ${I.T(c[2], c[3])}</li>`)}
      </ul>
      <p>
        ${I.T("Wrong choices get a specific reason (for example, a command with no please, or a question that starts with the subject), never the answer. Hints and word banks never state the answer. The final step uses the same wording check as Real-Life Scenarios: it reads words only, never pronunciation, accent or speed.", "Las opciones equivocadas reciben una razón específica (por ejemplo, una orden sin please o una pregunta que empieza con el sujeto), nunca la respuesta. Las pistas y los bancos de palabras nunca dan la respuesta. El último paso usa la misma revisión de palabras que Escenas de la vida real: lee solo palabras, nunca pronunciación, acento ni velocidad.")}
      </p>
    </section>
    <section class="panel" aria-labelledby="ctg-table">
      <h2 id="ctg-table">
        ${I.T("Missions and language targets", "Misiones y metas de lenguaje")}
      </h2>
      <div class="city-table-wrap">
        <table class="city-table">
          <caption>
            ${I.T("What each mission asks a learner to do", "Qué le pide cada misión al estudiante")}
          </caption>
          <thead>
            <tr>
              <th scope="col">${I.T("Building", "Edificio")}</th>
              <th scope="col">${I.T("Mission", "Misión")}</th>
              <th scope="col">${I.T("Steps", "Pasos")}</th>
              <th scope="col">${I.T("Language targets", "Metas de lenguaje")}</th>
              <th scope="col">${I.T("Key Language Use", "Uso clave del lenguaje")}</th>
            </tr>
          </thead>
          <tbody>
            ${MISSIONS.map(
              (m) =>
                html`<tr>
                  <th scope="row">${P(I, BUILDINGS.find((b) => b.id === m.place).name)}</th>
                  <td><a href="${cityHref(`${m.place}/${m.id}`, band)}">${P(I, m.title)}</a></td>
                  <td>
                    ${m.steps.map((s) => I.S(ROLE_COPY[s.role][0], ROLE_COPY[s.role][1])).join(", ")}
                  </td>
                  <td>
                    ${targetsOf(m)
                      .map((x) => I.S(TAGS[x][0], TAGS[x][1]))
                      .join(", ")}
                  </td>
                  <td>${m.use}</td>
                </tr>`,
            )}
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel" aria-labelledby="ctg-ev">
      <h2 id="ctg-ev">${I.T("Evidence on this device", "Evidencia en este dispositivo")}</h2>
      <p>
        ${I.T(`${t.independent} of ${t.total} missions finished on the learner's own; ${t.supported} finished only with support; ${t.left} not started. This is one browser. Runs are also written to the evidence ledger as source "city", with ids and counts only; nothing the learner typed is kept.`, `${t.independent} de ${t.total} misiones terminadas por el estudiante por su cuenta; ${t.supported} terminadas solo con apoyo; ${t.left} sin empezar. Es un solo navegador. Las vueltas también se anotan en el registro de evidencia como fuente "city", solo con identificadores y conteos; no se guarda nada de lo que escribió el estudiante.`)}
      </p>
      <div class="city-table-wrap">
        <table class="city-table">
          <caption>
            ${I.T("Runs per mission, independent and supported kept apart", "Vueltas por misión, independientes y con apoyo por separado")}
          </caption>
          <thead>
            <tr>
              <th scope="col">${I.T("Mission", "Misión")}</th>
              <th scope="col">${I.T("On my own", "Por mi cuenta")}</th>
              <th scope="col">${I.T("With support", "Con apoyo")}</th>
              <th scope="col">
                ${I.T("Steps right on the first try", "Pasos bien al primer intento")}
              </th>
            </tr>
          </thead>
          <tbody>
            ${BUILDINGS.flatMap((b) => missionsAt(b.id)).map((m) => {
              const rec = st.prog[m.id];
              return html`<tr>
                <th scope="row">${P(I, m.title)}</th>
                <td>${rec?.indep || 0}</td>
                <td>${rec?.supp || 0}</td>
                <td>
                  ${runsOf(rec) ? `${rec.firstTry} / ${rec.steps}` : I.T("not enough evidence yet", "aún no hay suficiente evidencia")}
                </td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
    </section>
    <p class="disclaimer">
      ${I.T("Language City is practice, not an assessment. It does not produce a WIDA or ACCESS score, level or prediction. Spanish text is machine-assisted and has not had a native-speaker review.", "La Ciudad del lenguaje es práctica, no una evaluación. No produce un puntaje, nivel ni predicción de WIDA ni de ACCESS. El texto en español es asistido por máquina y no ha tenido revisión de un hablante nativo.")}
    </p>
    <p class="fine">
      ${PS(I, { en: "Print this page with the browser's print command.", es: "Imprime esta página con el comando de impresión del navegador." })}
    </p>`;
}

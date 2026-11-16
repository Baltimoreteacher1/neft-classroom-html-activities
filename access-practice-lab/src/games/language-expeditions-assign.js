// Language Expeditions teacher tools in the Game Studio hub (feature "teacher"), beside the sequence builder:
// copy a link that opens one land (a center rotation), and write your own Reading or Writing stop. Every link is
// built in this browser; there is no server, no account and no student information in it. A teacher stop is
// checked with the same rules as authored content before the link is offered.
import { BASE, announce, html, icon, toHtml } from "../util.js";
import {
  LIMITS,
  decodeStop,
  encodeStop,
  expeditionHref,
  packStop,
} from "./language-expeditions-links.js";
import { ORDER } from "./language-expeditions-rules.js";

const BANDS = ["3-5", "6-8"];
const LAND_NAMES = {
  listening: ["Listening", "Escuchar"],
  reading: ["Reading", "Leer"],
  speaking: ["Speaking", "Hablar"],
  writing: ["Writing", "Escribir"],
};

const pairFields = (I, name, en, es, max, { area = false, required = false } = {}) =>
  html`<div class="lexp-t-pair">
    <label class="gs-label"
      >${en}${required ? html` <span class="fine">${I.T("(required)", "(obligatorio)")}</span>` : ""}
      ${area ? html`<textarea class="gs-input" name="${name}En" maxlength="${max}" rows="3" lang="en"></textarea>` : html`<input class="gs-input" name="${name}En" maxlength="${max}" lang="en" />`}</label
    >
    <label class="gs-label"
      >${es}
      <span class="fine">${I.T("(optional, encouraged)", "(opcional, recomendado)")}</span>
      ${area ? html`<textarea class="gs-input" name="${name}Es" maxlength="${max}" rows="3" lang="es"></textarea>` : html`<input class="gs-input" name="${name}Es" maxlength="${max}" lang="es" />`}</label
    >
  </div>`;

function landLinks(I, q) {
  return html`<h3>
      ${I.T("One land for a center rotation", "Una tierra para una rotación por estaciones")}
    </h3>
    <p class="fine">
      ${I.T("Each link opens Language Expeditions straight into one land after the start screen. Students can still open the other lands from the journey bar.", "Cada enlace abre Expediciones de lenguaje directamente en una tierra después de la pantalla de inicio. Los estudiantes aún pueden abrir las otras tierras desde la barra del viaje.")}
    </p>
    ${BANDS.map(
      (band) =>
        html`<p class="lexp-t-band"><strong>${I.T(`Grades ${band}`, `Grados ${band}`)}</strong></p>
          <ul class="lexp-t-links">
            ${ORDER.map((land) => {
              const href = expeditionHref(BASE, band, { land, mode: q.mode || "" });
              return html`<li>
                <a href="${href}">${I.T(...LAND_NAMES[land])}</a>
                <button type="button" class="btn small" data-copy="${href}">
                  ${icon("copy")}${I.T("Copy a link to one land", "Copiar un enlace a una tierra")}<span
                    class="visually-hidden"
                    >: ${I.T(...LAND_NAMES[land])}, ${band}</span
                  >
                </button>
              </li>`;
            })}
          </ul>`,
    )}`;
}

function stopForm(I, band) {
  const common = html`<label class="gs-label"
      >${I.T("Grade band", "Grados")}<select class="gs-input" name="band">
        ${BANDS.map((b) => html`<option value="${b}" ${b === band ? "selected" : ""}>${b}</option>`)}
      </select></label
    >
    <label class="gs-label"
      >${I.T("Which stop to replace", "Qué parada reemplazar")}<select class="gs-input" name="stop">
        ${[1, 2, 3].map((n) => html`<option value="${n}">${I.T(`Stop ${n}`, `Parada ${n}`)}</option>`)}
      </select></label
    >
    ${pairFields(I, "title", I.T("Stop title (English)", "Título de la parada (inglés)"), I.T("Stop title (Spanish)", "Título de la parada (español)"), LIMITS.title)}`;
  return html`<h3>${I.T("Write your own stop", "Escribe tu propia parada")}</h3>
    <p class="fine">
      ${I.T("Replace one Reading stop or one Writing stop with this week's unit. The stop travels inside the link: nothing is uploaded. English is required; add Spanish when you can. Quick games play fewer stops, so a later stop becomes the last one played.", "Reemplaza una parada de Leer o de Escribir con la unidad de esta semana. La parada viaja dentro del enlace: no se sube nada. El inglés es obligatorio; agrega español cuando puedas. Los juegos rápidos tienen menos paradas, así que una parada posterior pasa a ser la última que se juega.")}
    </p>
    <form class="lexp-t-form" data-lexp-t-form="reading">
      <fieldset>
        <legend>${I.T("A Reading stop", "Una parada de Leer")}</legend>
        ${common}
        <label class="gs-label"
          >${I.T("Passage students read (English)", "Texto que leen los estudiantes (inglés)")}
          <span class="fine">${I.T("(required)", "(obligatorio)")}</span
          ><textarea
            class="gs-input"
            name="passage"
            maxlength="${LIMITS.passage}"
            rows="5"
            lang="en"
          ></textarea>
        </label>
        ${pairFields(I, "question", I.T("Question (English)", "Pregunta (inglés)"), I.T("Question (Spanish)", "Pregunta (español)"), LIMITS.question, { required: true })}
        ${[0, 1, 2, 3].map((i) => pairFields(I, `opt${i}`, I.T(`Choice ${i + 1} (English)`, `Opción ${i + 1} (inglés)`), I.T(`Choice ${i + 1} (Spanish)`, `Opción ${i + 1} (español)`), LIMITS.option, { required: i < 3 }))}
        <label class="gs-label"
          >${I.T("The right choice", "La opción correcta")}<select class="gs-input" name="answer">
            ${[0, 1, 2, 3].map((i) => html`<option value="${i}">${I.T(`Choice ${i + 1}`, `Opción ${i + 1}`)}</option>`)}
          </select></label
        >
        ${pairFields(I, "hint", I.T("Hint (English, optional)", "Pista (inglés, opcional)"), I.T("Hint (Spanish)", "Pista (español)"), LIMITS.note)}
        ${pairFields(I, "explain", I.T("Why it is right (English, optional)", "Por qué es correcta (inglés, opcional)"), I.T("Why it is right (Spanish)", "Por qué es correcta (español)"), LIMITS.note)}
        <button type="button" class="btn btn-primary" data-lexp-t-build="reading">
          ${icon("copy")}${I.T("Make the Reading stop link", "Crear el enlace de la parada de Leer")}
        </button>
        <output class="lexp-t-out" aria-live="polite"></output>
      </fieldset>
    </form>
    <form class="lexp-t-form" data-lexp-t-form="writing">
      <fieldset>
        <legend>${I.T("A Writing stop", "Una parada de Escribir")}</legend>
        ${common}
        ${pairFields(I, "prompt", I.T("Writing task (English)", "Tarea de escritura (inglés)"), I.T("Writing task (Spanish)", "Tarea de escritura (español)"), LIMITS.prompt, { area: true, required: true })}
        ${pairFields(I, "model", I.T("One model answer (English)", "Una respuesta modelo (inglés)"), I.T("One model answer (Spanish)", "Una respuesta modelo (español)"), LIMITS.model, { area: true, required: true })}
        <label class="gs-label"
          >${I.T("Sentence frame (optional, use ___ for blanks)", "Marco de oración (opcional, usa ___ para los espacios)")}<input
            class="gs-input"
            name="frame"
            maxlength="${LIMITS.frame}"
            lang="en"
        /></label>
        <label class="gs-label"
          >${I.T("Word bank (optional, separate with commas)", "Banco de palabras (opcional, separa con comas)")}<input
            class="gs-input"
            name="bank"
            maxlength="260"
            lang="en"
        /></label>
        <button type="button" class="btn btn-primary" data-lexp-t-build="writing">
          ${icon("copy")}${I.T("Make the Writing stop link", "Crear el enlace de la parada de Escribir")}
        </button>
        <output class="lexp-t-out" aria-live="polite"></output>
      </fieldset>
    </form>`;
}

/** The hub panel. */
export function expeditionsTeacherHTML(I, band, q = {}) {
  return html`<details class="gs-teacher panel lexp-teacher">
    <summary>
      ${icon("teacher")}${I.T("For teachers: Language Expeditions links", "Para docentes: enlaces de Expediciones de lenguaje")}
    </summary>
    ${landLinks(I, q)} ${stopForm(I, band)}
  </details>`;
}

let contentP = null;
const loadContent = () => {
  contentP ||= fetch(`${BASE}/content/games/language-expeditions.json`, { cache: "no-cache" }).then(
    (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  );
  contentP.catch(() => {
    contentP = null;
  });
  return contentP;
};

/** Hub clicks for the stop builder. Returns true when handled. */
export function expeditionsHubClick(t, I) {
  const btn = t.closest?.("[data-lexp-t-build]");
  if (!btn) return false;
  const form = btn.closest("form");
  const out = form.querySelector(".lexp-t-out");
  const fields = Object.fromEntries(new FormData(form));
  fields.kind = btn.dataset.lexpTBuild;
  const band = BANDS.includes(fields.band) ? fields.band : "3-5";
  const code = encodeStop(packStop(fields));
  loadContent()
    .then((content) => {
      const res = decodeStop(code, content.bands?.[band]);
      if (!res.ok) {
        out.innerHTML = toHtml(
          html`<p>
              <strong
                >${I.T("Not ready yet. Fix these, then make the link again:", "Todavía no está lista. Corrige esto y vuelve a crear el enlace:")}</strong
              >
            </p>
            <ul>
              ${res.errors.map((e) => html`<li>${String(e).replace(/^[^:]*-teacher: /, "")}</li>`)}
            </ul>`,
        );
        announce(I.S("The stop needs changes.", "La parada necesita cambios."));
        return;
      }
      const href = expeditionHref(BASE, band, { stop: code, land: fields.kind });
      out.innerHTML = toHtml(
        html`<a href="${href}">${I.T("Open the stop", "Abrir la parada")}</a> ·
          <button type="button" class="btn small" data-copy="${href}">
            ${icon("copy")}${I.T("Copy link", "Copiar enlace")}
          </button>
          <span class="fine"
            >${I.T(`${href.length} characters`, `${href.length} caracteres`)}</span
          >`,
      );
      announce(I.S("Link ready.", "Enlace listo."));
    })
    .catch(() => {
      out.textContent = I.S(
        "The game content could not be loaded. Try again.",
        "No se pudo cargar el contenido del juego. Inténtalo otra vez.",
      );
    });
  return true;
}

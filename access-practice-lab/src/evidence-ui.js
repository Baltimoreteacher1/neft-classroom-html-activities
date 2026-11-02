// Shared markup for the Evidence Notebook: the tag bar for a selected sentence or data point, data-point pick
// buttons, the notebook list, and the Claim · Evidence · Example organizer. Every control is a real <button>,
// so mouse, touch and keyboard all work the same way; tag results are announced by the caller (aria-live).
import { CELLS, TAGS } from "./lang/evidence-notebook.js";
import { makeI18n } from "./i18n.js";
import { html, icon } from "./util.js";

// Interface language for these builders. main.js calls setStudioI18n(i18n) from BOTH evidence-ui.js and
// studio-ui.js before every render; each builder with an options object accepts `i18n` to override it.
let I = makeI18n("en");
export const setStudioI18n = (i18n) => {
  I = i18n || makeI18n("en");
};

// Spanish for the tag and matrix-cell names in lang/evidence-notebook.js, keyed by their stable ids.
const TAG_ES = {
  claim: { label: "Afirmación", hint: "la idea principal de una fuente" },
  evidence: { label: "Evidencia", hint: "un dato o número que prueba una idea" },
  example: { label: "Ejemplo", hint: "un caso concreto que muestra la idea" },
};
const CELL_ES = {
  agree: { label: "Ambas fuentes coinciden", ask: "¿En qué coinciden las fuentes?" },
  text: { label: "Solo el texto añade", ask: "¿Qué añade solo el texto?" },
  data: { label: "Solo los datos añaden", ask: "¿Qué añaden solo los datos?" },
};
const CELL_ASK_EN = {
  agree: "Where do the sources agree?",
  text: "What does only the text add?",
  data: "What does only the data add?",
};
/** Name / hint of a tag as markup-safe text, in the current language mode. */
export const tagName = (t, i18n = I) => i18n.T(t.label, TAG_ES[t.id]?.label);
export const tagHint = (t, i18n = I) => i18n.T(t.hint, TAG_ES[t.id]?.hint);
const tagById = (id) => TAGS.find((t) => t.id === id) || TAGS[1];
/** Name of a tag by id as markup-safe text (same fallback as tagLabel: Evidence). */
export const tagNameFor = (id, i18n = I) => tagName(tagById(id), i18n);
/** Both language forms of a tag name, for messages stored before the language is known. */
export const tagLabels = (id) => ({ en: tagById(id).label, es: TAG_ES[tagById(id).id]?.label ?? tagById(id).label });

const INLINE_BTN =
  "display:inline;font:inherit;color:inherit;background:none;border:0;padding:0.1rem 0;margin:0;text-align:inherit;line-height:inherit;cursor:pointer";
export { INLINE_BTN };

/** One pinnable data point (chart bar or table row). `key` is "<sourceId>|d<index>". */
export const dataPickHTML = (key, text, { picked = false, tag = null, i18n = I } = {}) =>
  html`<li>
    <button
      type="button"
      class="cat-chip ${picked ? "is-active-reading-sentence" : ""}"
      data-nb-pick="${key}"
      aria-pressed="${String(picked)}"
    >
      ${text}</button
    >${tag ? html` <span class="badge">${tagName(tagById(tag), i18n)}</span>` : ""}
  </li>`;

/** The three tag buttons for the current selection, or a short how-to when nothing is selected. */
export function tagBarHTML(picked, { i18n = I } = {}) {
  const { T, S } = i18n;
  if (!picked)
    return html`<p class="fine nb-howto">
      ${T("Select a sentence or a data point, then tag it as a Claim, Evidence, or an Example. Pins are saved only in this browser.", "Elige una oración o un dato y márcalo como Afirmación, Evidencia o Ejemplo. Lo que fijes se guarda solo en este navegador.")}
    </p>`;
  return html`<div class="nb-tagbar card" role="group" aria-labelledby="nbTagLabel">
    <p id="nbTagLabel"><strong>${T("Tag this:", "Marca esto:")}</strong> “${picked.text}”</p>
    <div class="row-actions">
      ${TAGS.map((t) => html`<button type="button" class="btn small" data-nb-tag="${t.id}" title="${S(t.hint, TAG_ES[t.id]?.hint)}">${icon("pin")} ${tagName(t, i18n)}</button>`)}
      <button type="button" class="ghost small" data-nb-unpick>${T("Cancel", "Cancelar")}</button>
    </div>
  </div>`;
}

/** Notebook items grouped by tag, each with a Remove button. */
export function notebookListHTML(items, { empty, i18n = I } = {}) {
  const { T, S } = i18n;
  if (!items.length)
    return html`<p class="fine">${empty ?? T("Nothing pinned yet.", "Todavía no has fijado nada.")}</p>`;
  return TAGS.map((t) => {
    const group = items.filter((x) => x.tag === t.id);
    if (!group.length) return "";
    return html`<section class="nb-group">
      <h3>${tagName(t, i18n)} <span class="fine">(${group.length})</span></h3>
      <ul class="nb-items">
        ${group.map(
          (x) =>
            html`<li>
              <p>“${x.text}”</p>
              <p class="fine">${T("From:", "De:")} ${x.source.title || x.source.id}</p>
              <button
                type="button"
                class="ghost small"
                data-nb-remove="${x.id}"
                aria-label="${S(`Remove pinned ${t.label.toLowerCase()}: ${x.text.slice(0, 60)}`, `Quitar ${TAG_ES[t.id].label.toLowerCase()} fijada: ${x.text.slice(0, 60)}`)}"
              >
                ${T("Remove", "Quitar")}
              </button>
            </li>`,
        )}
      </ul>
    </section>`;
  });
}

/** Claim · Evidence · Example graphic organizer filled with this source's pins. */
export function organizerHTML(items, { i18n = I } = {}) {
  const { T } = i18n;
  return html`<div class="lab-table-wrap">
    <table class="lab-table nb-organizer">
      <caption>
        ${T("My Claim · Evidence · Example organizer", "Mi organizador: Afirmación · Evidencia · Ejemplo")}
      </caption>
      <thead>
        <tr>
          ${TAGS.map((t) => html`<th scope="col">${tagName(t, i18n)}</th>`)}
        </tr>
      </thead>
      <tbody>
        <tr>
          ${TAGS.map((t) => {
            const group = items.filter((x) => x.tag === t.id);
            return html`<td>
              ${
                group.length
                  ? html`<ul>
                      ${group.map((x) => html`<li>${x.text}</li>`)}
                    </ul>`
                  : html`<span class="fine"
                      >${T(`Pin a sentence as ${t.label.toLowerCase()} — ${t.hint}.`, `Fija una oración como ${TAG_ES[t.id].label.toLowerCase()}: ${TAG_ES[t.id].hint}.`)}</span
                    >`
              }
            </td>`;
          })}
        </tr>
      </tbody>
    </table>
  </div>`;
}

/** Synthesis matrix: each cell lists the pins placed in it. */
export function matrixHTML(items, { textTitle, dataTitle, i18n = I }) {
  const { T } = i18n;
  return html`<div class="lab-table-wrap">
    <table class="lab-table nb-matrix">
      <caption>
        ${T("Synthesis matrix:", "Matriz de síntesis:")} ${textTitle} + ${dataTitle}
      </caption>
      <thead>
        <tr>
          <th scope="col">${T("Question", "Pregunta")}</th>
          <th scope="col">${T("Pinned evidence", "Evidencia fijada")}</th>
        </tr>
      </thead>
      <tbody>
        ${CELLS.map((c) => {
          const group = items.filter((x) => x.cell === c.id);
          return html`<tr>
            <th scope="row">
              ${T(CELL_ASK_EN[c.id], CELL_ES[c.id]?.ask)}
            </th>
            <td>
              ${
                group.length
                  ? html`<ul>
                      ${group.map((x) => html`<li>“${x.text}”</li>`)}
                    </ul>`
                  : html`<span class="fine">${T("Nothing placed yet.", "Nada colocado todavía.")}</span>`
              }
            </td>
          </tr>`;
        })}
      </tbody>
    </table>
  </div>`;
}

/** Buttons that place one pin in a matrix cell. */
export const placeButtonsHTML = (item, { i18n = I } = {}) =>
  html`<div class="speed" role="group" aria-label="${i18n.S("Place in the matrix", "Colocar en la matriz")}">
    ${CELLS.map(
      (c) =>
        html`<button
          type="button"
          class="speed-btn"
          data-nb-place="${item.id}:${c.id}"
          aria-pressed="${String(item.cell === c.id)}"
        >
          ${i18n.T(c.label, CELL_ES[c.id]?.label)}
        </button>`,
    )}
  </div>`;

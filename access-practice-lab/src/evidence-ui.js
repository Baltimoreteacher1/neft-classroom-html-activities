// Shared markup for the Evidence Notebook: the tag bar for a selected sentence or data point, data-point pick
// buttons, the notebook list, and the Claim · Evidence · Example organizer. Every control is a real <button>,
// so mouse, touch and keyboard all work the same way; tag results are announced by the caller (aria-live).
import { CELLS, TAGS, tagLabel } from "./lang/evidence-notebook.js";
import { html } from "./util.js";

const INLINE_BTN =
  "display:inline;font:inherit;color:inherit;background:none;border:0;padding:0.1rem 0;margin:0;text-align:inherit;line-height:inherit;cursor:pointer";
export { INLINE_BTN };

/** One pinnable data point (chart bar or table row). `key` is "<sourceId>|d<index>". */
export const dataPickHTML = (key, text, { picked = false, tag = null } = {}) =>
  html`<li>
    <button
      type="button"
      class="cat-chip ${picked ? "is-active-reading-sentence" : ""}"
      data-nb-pick="${key}"
      aria-pressed="${String(picked)}"
    >
      ${text}</button
    >${tag ? html` <span class="badge">${tagLabel(tag)}</span>` : ""}
  </li>`;

/** The three tag buttons for the current selection, or a short how-to when nothing is selected. */
export function tagBarHTML(picked) {
  if (!picked)
    return html`<p class="fine nb-howto">
      Select a sentence or a data point, then tag it as a Claim, Evidence, or an Example. Pins are
      saved only in this browser.
    </p>`;
  return html`<div class="nb-tagbar card" role="group" aria-labelledby="nbTagLabel">
    <p id="nbTagLabel"><strong>Tag this:</strong> “${picked.text}”</p>
    <div class="row-actions">
      ${TAGS.map((t) => html`<button type="button" class="btn small" data-nb-tag="${t.id}" title="${t.hint}">📌 ${t.label}</button>`)}
      <button type="button" class="ghost small" data-nb-unpick>Cancel</button>
    </div>
  </div>`;
}

/** Notebook items grouped by tag, each with a Remove button. */
export function notebookListHTML(items, { empty = "Nothing pinned yet." } = {}) {
  if (!items.length) return html`<p class="fine">${empty}</p>`;
  return TAGS.map((t) => {
    const group = items.filter((x) => x.tag === t.id);
    if (!group.length) return "";
    return html`<section class="nb-group">
      <h3>${t.label} <span class="fine">(${group.length})</span></h3>
      <ul class="nb-items">
        ${group.map(
          (x) =>
            html`<li>
              <p>“${x.text}”</p>
              <p class="fine">From: ${x.source.title || x.source.id}</p>
              <button
                type="button"
                class="ghost small"
                data-nb-remove="${x.id}"
                aria-label="Remove pinned ${t.label.toLowerCase()}: ${x.text.slice(0, 60)}"
              >
                Remove
              </button>
            </li>`,
        )}
      </ul>
    </section>`;
  });
}

/** Claim · Evidence · Example graphic organizer filled with this source's pins. */
export function organizerHTML(items) {
  return html`<div class="lab-table-wrap">
    <table class="lab-table nb-organizer">
      <caption>
        My Claim · Evidence · Example organizer
      </caption>
      <thead>
        <tr>
          ${TAGS.map((t) => html`<th scope="col">${t.label}</th>`)}
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
                      >Pin a sentence as ${t.label.toLowerCase()} — ${t.hint}.</span
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
export function matrixHTML(items, { textTitle, dataTitle }) {
  return html`<div class="lab-table-wrap">
    <table class="lab-table nb-matrix">
      <caption>
        Synthesis matrix: ${textTitle} + ${dataTitle}
      </caption>
      <thead>
        <tr>
          <th scope="col">Question</th>
          <th scope="col">Pinned evidence</th>
        </tr>
      </thead>
      <tbody>
        ${CELLS.map((c) => {
          const group = items.filter((x) => x.cell === c.id);
          return html`<tr>
            <th scope="row">
              ${c.id === "agree" ? "Where do the sources agree?" : c.id === "text" ? "What does only the text add?" : "What does only the data add?"}
            </th>
            <td>
              ${
                group.length
                  ? html`<ul>
                      ${group.map((x) => html`<li>“${x.text}”</li>`)}
                    </ul>`
                  : html`<span class="fine">Nothing placed yet.</span>`
              }
            </td>
          </tr>`;
        })}
      </tbody>
    </table>
  </div>`;
}

/** Buttons that place one pin in a matrix cell. */
export const placeButtonsHTML = (item) =>
  html`<div class="speed" role="group" aria-label="Place in the matrix">
    ${CELLS.map(
      (c) =>
        html`<button
          type="button"
          class="speed-btn"
          data-nb-place="${item.id}:${c.id}"
          aria-pressed="${String(item.cell === c.id)}"
        >
          ${c.label}
        </button>`,
    )}
  </div>`;

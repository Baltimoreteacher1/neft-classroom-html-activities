// The working area of each scaffold tool. Which supports render depends only on the support condition:
//   modeled      worked model (different topic) + frame + bank
//   partial      frame + bank
//   minimal      one hint, only when asked
//   independent  nothing but the task
// Frames are the visible part labels; banks are connector jobs and word chips. Practice content is English.
import { EVIDENCE_CONNECTORS, MODELS, SENTENCE_CONNECTORS } from "../content/scaffold-items.js";
import { evidenceText, pieceFor, sentenceText } from "../lang/scaffold-check.js";
import { html, icon } from "../util.js";

export const showsFrame = (cond) => cond === "modeled" || cond === "partial";
export const showsModel = (cond) => cond === "modeled";

export function modelHTML(I, tool) {
  const m = MODELS[tool];
  return html`<aside class="sc-model" aria-labelledby="scModelTitle">
    <h3 id="scModelTitle">${icon("bulb")} ${I.T("Watch it done first", "Míralo hecho primero")}</h3>
    <p class="sc-model-text" lang="en">${m.text}</p>
    <ol lang="en">
      ${m.steps.map((x) => html`<li>${x}</li>`)}
    </ol>
  </aside>`;
}

export function hintHTML(I, S, item) {
  if (S.condition !== "minimal") return "";
  return S.supports.hint
    ? html`<p class="sc-hint" role="note">${icon("bulb")} <span lang="en">${item.hint}</span></p>`
    : html`<button type="button" class="btn ghost" data-sc-hint>
        ${icon("bulb")} ${I.T("Show one hint", "Mostrar una pista")}
      </button>`;
}

const byText = (a, b) => a.text.localeCompare(b.text);

export function sentenceHTML(I, S, item) {
  const frame = showsFrame(S.condition);
  const used = new Set(Object.values(S.placed));
  const text = sentenceText(item, S.placed);
  const tileBtn = (p) =>
    html`<button
      type="button"
      class="sc-tile${used.has(p.id) ? " is-used" : ""}${p.role === "connector" ? " is-connector" : ""}"
      data-tile="${p.id}"
      aria-pressed="${S.selectedTile === p.id ? "true" : "false"}"
    >
      <span lang="en">${p.text}</span
      >${frame && p.role === "connector" ? html`<small>${SENTENCE_CONNECTORS[p.id]}</small>` : ""}
    </button>`;
  return html`<div class="sc-work sc-sentence">
    <p class="sc-how fine">
      ${I.T("Choose a piece, then choose a place in the sentence. You can also drag a piece. Choose a filled place to take its piece back.", "Elige una pieza y luego un lugar en la oración. También puedes arrastrar una pieza. Elige un lugar lleno para quitar su pieza.")}
    </p>
    <ol class="sc-slots" aria-label="${I.S("Sentence frame", "Marco de la oración")}">
      ${item.slots.map((sl, i) => {
        const p = pieceFor(item, S.placed[sl.id]);
        const name = frame ? sl.label : I.S(`Part ${i + 1}`, `Parte ${i + 1}`);
        return html`<li>
          <button
            type="button"
            class="sc-slot${p ? " is-filled" : ""}${S.result?.results?.[i] && !S.result.results[i].ok ? " is-flagged" : ""}"
            data-slot="${sl.id}"
            aria-label="${name}: ${p ? p.text : I.S("empty", "vacío")}"
          >
            ${frame ? html`<span class="sc-slot-label" lang="en">${sl.label}</span>` : ""}<span
              class="sc-slot-text"
              lang="en"
              >${p ? p.text : "…"}</span
            >
          </button>
        </li>`;
      })}
    </ol>
    <p class="sc-preview" aria-live="polite">
      <strong>${I.T("My sentence:", "Mi oración:")}</strong> <span lang="en">${text || "…"}</span>
    </p>
    <div
      class="sc-bank"
      role="group"
      aria-label="${I.S("Sentence pieces", "Piezas de la oración")}"
    >
      ${[...item.tiles].sort(byText).map(tileBtn)}
    </div>
    <div class="sc-bank" role="group" aria-label="${I.S("Connectors", "Conectores")}">
      ${Object.keys(SENTENCE_CONNECTORS).map((w) => tileBtn({ id: w, role: "connector", text: w }))}
    </div>
    <button type="button" class="btn ghost small" data-sc-clear>
      ${icon("retry")} ${I.T("Clear the sentence", "Borrar la oración")}
    </button>
  </div>`;
}

export function evidenceHTML(I, S, item) {
  const frame = showsFrame(S.condition);
  const chosen = S.ev.selected.map((id) => item.cards.find((c) => c.id === id)).filter(Boolean);
  const flagged = new Set(S.result?.unsupported || []);
  return html`<div class="sc-work sc-evidence">
    <p class="sc-claim">
      <strong>${I.T("Claim", "Afirmación")}</strong> <span lang="en">${item.claim}</span>
    </p>
    ${frame ? html`<p class="sc-frame fine">${I.T("Frame:", "Marco:")} <span lang="en">Claim. [connector] [evidence${item.ordered ? " in the order it happened" : ""}] [more evidence].</span></p>` : ""}
    <h3 class="sc-sub">${I.T("Evidence cards", "Tarjetas de evidencia")}</h3>
    <div
      class="sc-cards"
      role="group"
      aria-label="${I.S("Evidence cards", "Tarjetas de evidencia")}"
    >
      ${item.cards.map((c) => html`<button type="button" class="sc-card${flagged.has(c.id) ? " is-flagged" : ""}" data-card="${c.id}" aria-pressed="${S.ev.selected.includes(c.id) ? "true" : "false"}"><span lang="en">${c.text}</span></button>`)}
    </div>
    <h3 class="sc-sub">
      ${I.T(item.ordered ? "My evidence, in order" : "My evidence", item.ordered ? "Mi evidencia, en orden" : "Mi evidencia")}
    </h3>
    ${
      chosen.length
        ? html`<ol class="sc-chosen">
            ${chosen.map(
              (c, i) =>
                html`<li>
                  <span lang="en">${c.text}</span
                  ><span class="sc-order">
                    <button
                      type="button"
                      class="btn small ghost"
                      data-card-up="${c.id}"
                      ${i === 0 ? "disabled" : ""}
                      aria-label="${I.S("Move up", "Subir")}"
                    >
                      ${icon("chevron-down", "flip")}
                    </button>
                    <button
                      type="button"
                      class="btn small ghost"
                      data-card-down="${c.id}"
                      ${i === chosen.length - 1 ? "disabled" : ""}
                      aria-label="${I.S("Move down", "Bajar")}"
                    >
                      ${icon("chevron-down")}
                    </button></span
                  >
                </li>`,
            )}
          </ol>`
        : html`<p class="fine">
            ${I.T("Choose cards above to add them here.", "Elige tarjetas arriba para agregarlas aquí.")}
          </p>`
    }
    <fieldset class="sc-connector-set">
      <legend>${I.T("Connector", "Conector")}</legend>
      ${Object.keys(EVIDENCE_CONNECTORS).map((p) => html`<label class="sc-radio"><input type="radio" name="sc-connector" value="${p}" ${S.ev.connector === p ? "checked" : ""} /><span lang="en">${p}</span>${frame ? html`<small lang="en">${EVIDENCE_CONNECTORS[p]}</small>` : ""}</label>`)}
    </fieldset>
    <p class="sc-preview" aria-live="polite">
      <strong>${I.T("My paragraph:", "Mi párrafo:")}</strong>
      <span lang="en">${evidenceText(item, S.ev.selected, S.ev.connector)}</span>
    </p>
  </div>`;
}

export function upgradeHTML(I, S, item) {
  const frame = showsFrame(S.condition);
  const res = S.result;
  const CHECK = {
    detail: ["A detail was added", "Se agregó un detalle"],
    precision: [
      "A precise word replaces the general one",
      "Una palabra precisa reemplaza la general",
    ],
    connector: ["Two ideas are connected", "Dos ideas están conectadas"],
  };
  return html`<div class="sc-work sc-upgrade">
    <p class="sc-before">
      <strong>${I.T("Everyday version", "Versión cotidiana")}</strong>
      <span lang="en">${item.informal}</span>
    </p>
    ${
      frame
        ? html`<p class="sc-frame fine">
              ${I.T("Frame:", "Marco:")} <span lang="en">${item.frame}</span>
            </p>
            <div
              class="sc-chips"
              role="group"
              aria-label="${I.S("Word bank", "Banco de palabras")}"
            >
              <span class="fine">${I.T("Word bank:", "Banco de palabras:")}</span>
              ${[...item.precision, ...item.connectors.slice(0, 3)].map((w) => html`<span class="chip" lang="en">${w}</span>`)}
            </div>`
        : ""
    }
    <label class="sc-label" for="scText">${I.T("My revision", "Mi revisión")}</label>
    <textarea id="scText" class="sc-text" rows="4" lang="en" spellcheck="true" data-sc-text>
${S.text}</textarea>
    ${
      res
        ? html`<div class="sc-compare">
              <div>
                <h3>${I.T("Before", "Antes")}</h3>
                <p lang="en">${item.informal}</p>
              </div>
              <div>
                <h3>${I.T("After", "Después")}</h3>
                <p lang="en">${S.checkedText}</p>
              </div>
            </div>
            <ul class="sc-checks">
              ${Object.entries(res.checks).map(([k, v]) => html`<li class="${v ? "is-ok" : "is-no"}">${icon(v ? "check" : "x")} ${I.T(...CHECK[k])}: ${v ? I.T("yes", "sí") : I.T("not yet", "todavía no")}</li>`)}
            </ul>
            ${S.pattern ? html`<p class="fine">${icon("detective")} ${I.T("Also check this pattern:", "Revisa también este patrón:")} <span lang="en">${S.pattern}</span></p>` : ""}`
        : ""
    }
    ${
      S.versions.length
        ? html`<details class="sc-history">
            <summary>
              ${I.T(`My revisions (${S.versions.length})`, `Mis revisiones (${S.versions.length})`)}
            </summary>
            <ol>
              ${S.versions.map((v) => html`<li><span lang="en">${v.text}</span></li>`)}
            </ol>
          </details>`
        : ""
    }
  </div>`;
}

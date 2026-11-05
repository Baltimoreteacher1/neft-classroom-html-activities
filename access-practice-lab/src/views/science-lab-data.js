// Science Investigation Lab: the data stages (collect, represent, choose evidence). No timer, no randomness:
// each test the learner runs reveals one fixed row of the case's classroom sample data.
import { html, icon, raw } from "../util.js";
import { dataRows } from "./science-lab-model.js";
import { echoHTML, fieldHTML, labHref, savedNote } from "./science-lab-ui.js";

const plain = (I) => (o) => (o ? I.S(o.en, o.es) : "");

/** One data row as plain text: "Test 3 · Paper towel, 1 layer · 43 minutes". */
export function rowLine(I, caseDef, row) {
  const n = dataRows(caseDef).findIndex((r) => r.id === row.id) + 1;
  const pick = plain(I);
  const cond = caseDef.variables
    .map(
      (v) =>
        pick(v.values.find((x) => x.id === row.conditions[v.id])?.label) || row.conditions[v.id],
    )
    .join(", ");
  const value = row.measures[caseDef.measure.id];
  return `${I.S("Test", "Prueba")} ${n} · ${cond} · ${value} ${pick(caseDef.dataset.unit)}`;
}

export const dataNoteHTML = (I, caseDef) =>
  html`<div class="sl-datanote">
    <p>${I.TO(caseDef.dataset.setup)}</p>
    <p class="fine">${icon("info")} ${I.TO(caseDef.dataset.note)}</p>
  </div>`;

const needRows = (I, t) =>
  html`<section class="panel">
    <p>${I.T("You need collected results first.", "Primero necesitas resultados reunidos.")}</p>
    <p>
      <a class="btn" href="${labHref(t, "collect")}"
        >${I.T("Go to Collect data", "Ir a Reunir datos")}</a
      >
    </p>
  </section>`;

// ── collect ──────────────────────────────────────────────────────────────────
export function collectHTML(I, t, cs) {
  const ran = cs.stages.collect?.rows || [];
  const rows = dataRows(t.caseDef);
  const pick = plain(I);
  return html`<section class="panel sl-collect" aria-labelledby="slCollectTitle">
    <h2 id="slCollectTitle">${I.T("Run each test", "Haz cada prueba")}</h2>
    ${dataNoteHTML(I, t.caseDef)}
    <p class="fine" aria-live="polite">
      ${I.T(`${ran.length} of ${rows.length} tests run`, `${ran.length} de ${rows.length} pruebas hechas`)}
    </p>
    <ol class="sl-runs">
      ${rows.map((row, i) => {
        const cond = rowLine(I, t.caseDef, row).split(" · ")[1];
        const done = ran.includes(row.id);
        const value = `${row.measures[t.caseDef.measure.id]} ${pick(t.caseDef.dataset.unit)}`;
        return html`<li class="sl-run ${done ? "is-done" : ""}">
          <span class="sl-run-n">${I.T(`Test ${i + 1}`, `Prueba ${i + 1}`)}</span>
          <span class="sl-run-cond">${cond}</span>
          ${
            done
              ? html`<strong class="sl-run-result" data-sl-result="${row.id}" tabindex="-1"
                  >${icon("check")} ${value}</strong
                >`
              : html`<button
                  type="button"
                  class="btn small"
                  data-sl-run="${row.id}"
                  aria-label="${I.S(`Run test ${i + 1}: ${cond}`, `Hacer la prueba ${i + 1}: ${cond}`)}"
                >
                  ${I.T(`Run test ${i + 1}`, `Hacer prueba ${i + 1}`)}
                </button>`
          }
        </li>`;
      })}
    </ol>
  </section>`;
}

// ── represent ────────────────────────────────────────────────────────────────
function tableHTML(I, caseDef, rows) {
  const pick = plain(I);
  const unit = pick(caseDef.dataset.unit);
  return html`<div
    class="sl-table-wrap"
    role="region"
    tabindex="0"
    aria-label="${I.S("Your table", "Tu tabla")}"
  >
    <table class="sl-table">
      <caption>
        ${I.TO(caseDef.measure.label)}
      </caption>
      <thead>
        <tr>
          <th scope="col">${I.T("Test", "Prueba")}</th>
          ${caseDef.variables.map((v) => html`<th scope="col">${I.TO(v.label)}</th>`)}
          <th scope="col">${unit}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (r) =>
            html`<tr>
              <th scope="row">${dataRows(caseDef).findIndex((x) => x.id === r.id) + 1}</th>
              ${caseDef.variables.map((v) => html`<td>${pick(v.values.find((x) => x.id === r.conditions[v.id])?.label)}</td>`)}
              <td>${r.measures[caseDef.measure.id]}</td>
            </tr>`,
        )}
      </tbody>
    </table>
  </div>`;
}

function barsHTML(I, caseDef, rows) {
  const mid = caseDef.measure.id;
  const max = Math.max(...rows.map((r) => r.measures[mid]), 1);
  const pick = plain(I);
  const label = (r) => rowLine(I, caseDef, r).split(" · ").slice(0, 2).join(" · ");
  const value = (r) => `${r.measures[mid]} ${pick(caseDef.dataset.unit)}`;
  return html`<figure class="sl-chart">
      <figcaption>${I.TO(caseDef.measure.label)}</figcaption>
      <ul class="sl-bars" aria-label="${I.S("Bar chart", "Gráfica de barras")}">
        ${rows.map(
          (r) =>
            html`<li>
              <span class="sl-bar-label">${label(r)}</span>
              <span class="sl-bar-track" aria-hidden="true"
                ><i style="width:${Math.max(2, Math.round((r.measures[mid] / max) * 100))}%"></i
              ></span>
              <span class="sl-bar-val">${value(r)}</span>
            </li>`,
        )}
      </ul>
    </figure>
    <div class="sl-alt">
      <p class="ex-kicker">
        ${I.T("Text version of the bar chart", "Versión en texto de la gráfica de barras")}
      </p>
      <p>${rows.map((r) => `${label(r)}: ${value(r)}.`).join(" ")}</p>
    </div>`;
}

export function representHTML(I, t, cs) {
  const rec = cs.stages.represent || {};
  const collected = cs.stages.collect?.rows || [];
  if (!collected.length) return needRows(I, t);
  const all = dataRows(t.caseDef).filter((r) => collected.includes(r.id));
  const format = rec.format === "bars" ? "bars" : "table";
  const chosen = all.filter((r) => (rec.rows || []).includes(r.id));
  return html`<section class="panel sl-build" aria-labelledby="slBuildTitle">
      <h2 id="slBuildTitle">
        ${I.T("Build a table or a bar chart", "Construye una tabla o una gráfica de barras")}
      </h2>
      <fieldset class="sl-choice">
        <legend>${I.T("What do you want to build?", "¿Qué quieres construir?")}</legend>
        ${["table", "bars"].map((f) => html`<label class="sl-radio"><input type="radio" name="slFormat" value="${f}" data-sl-format ${format === f ? raw("checked") : ""} /> ${f === "table" ? I.T("A table", "Una tabla") : I.T("A bar chart", "Una gráfica de barras")}</label>`)}
      </fieldset>
      <fieldset class="sl-choice">
        <legend>${I.T("Which results go in it?", "¿Qué resultados van en ella?")}</legend>
        ${all.map((r) => html`<label class="sl-check"><input type="checkbox" value="${r.id}" data-sl-evid="represent:rows:${r.id}" ${chosen.includes(r) ? raw("checked") : ""} /> ${rowLine(I, t.caseDef, r)}</label>`)}
      </fieldset>
    </section>
    <section class="panel sl-preview" aria-labelledby="slPreviewTitle">
      <h2 id="slPreviewTitle">${I.T("What you built", "Lo que construiste")}</h2>
      ${chosen.length ? (format === "bars" ? barsHTML(I, t.caseDef, chosen) : tableHTML(I, t.caseDef, chosen)) : html`<p class="fine">${I.T("Choose at least two results to see them here.", "Elige al menos dos resultados para verlos aquí.")}</p>`}
    </section>
    <section class="panel">
      ${fieldHTML(I, { stage: "represent", name: "sentence", label: I.T("Write one sentence about what your table or chart shows.", "Escribe una oración sobre lo que muestra tu tabla o gráfica."), value: rec.sentence || "", rows: 3, required: true })}
      ${savedNote(I)}
    </section>`;
}

// ── evidence ─────────────────────────────────────────────────────────────────
/** Checkboxes for data rows; `where` = "<stage>:<key>" the chosen ids are saved under. */
export function rowPickerHTML(I, caseDef, rows, where, chosen) {
  return html`<fieldset class="sl-choice">
    <legend>
      ${I.T("Choose the tests that support your claim.", "Elige las pruebas que apoyan tu afirmación.")}
    </legend>
    ${rows.map((r) => html`<label class="sl-check"><input type="checkbox" value="${r.id}" data-sl-evid="${where}:${r.id}" ${chosen.includes(r.id) ? raw("checked") : ""} /> ${rowLine(I, caseDef, r)}</label>`)}
  </fieldset>`;
}

export function evidenceHTML(I, t, cs) {
  const collected = cs.stages.collect?.rows || [];
  if (!collected.length) return needRows(I, t);
  const rows = dataRows(t.caseDef).filter((r) => collected.includes(r.id));
  const chosen = cs.stages.evidence?.ids || [];
  return html`<section class="panel sl-evidence" aria-labelledby="slEvTitle">
    <h2 id="slEvTitle">${I.T("Choose your evidence", "Elige tu evidencia")}</h2>
    ${echoHTML(I, I.T("Your claim", "Tu afirmación"), cs.stages.claim?.text)}
    ${rowPickerHTML(I, t.caseDef, rows, "evidence:ids", chosen)}
    <p class="fine" aria-live="polite">
      ${I.T(`${chosen.length} chosen`, `${chosen.length} elegidas`)}
    </p>
  </section>`;
}

/** Plain-text list of chosen rows, used to echo evidence back on later screens. */
export function chosenRowsHTML(I, caseDef, ids) {
  const rows = dataRows(caseDef).filter((r) => ids.includes(r.id));
  return rows.length
    ? html`<div class="sl-echo">
        <p class="ex-kicker">${I.T("Your evidence", "Tu evidencia")}</p>
        <ul class="sl-list">
          ${rows.map((r) => html`<li>${rowLine(I, caseDef, r)}</li>`)}
        </ul>
      </div>`
    : "";
}

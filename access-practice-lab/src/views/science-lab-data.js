// Science Investigation Lab: the data stages (collect, represent, choose evidence). No timer, no randomness:
// each test the learner runs reveals one fixed row of the case's classroom sample data.
import { html, icon, raw } from "../util.js";
import { evidencePickerHTML } from "./science-lab-argue.js";
import { dataRows } from "./science-lab-model.js";
import { barChartHTML, barNote, chartAxisMax, resultOrder } from "./science-lab-scene.js";
import { orderListHTML, predictionOrder } from "./science-lab-steps.js";
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

/** The prediction order beside the order the collected results came out in (largest average first). */
function ordersHTML(I, t, cs, rows) {
  const cd = t.caseDef;
  const pred = cs.stages.hypothesis?.order;
  const result = resultOrder(cd, rows).map((x) => x.id);
  const unit = cd.dataset.unit;
  return html`<section class="panel sl-orders" aria-labelledby="slOrdersTitle">
    <h2 id="slOrdersTitle">${I.T("Your prediction and your results", "Tu predicción y tus resultados")}</h2>
    <p class="fine">${I.T(`Number 1 has the most ${unit.en}.`, `El número 1 tiene más ${unit.es}.`)}</p>
    <div class="slx-orders">
      <div>
        <h3>${I.T("You predicted", "Predijiste")}</h3>
        ${
          pred
            ? orderListHTML(I, cd, predictionOrder(cd, cs.stages.hypothesis))
            : html`<p class="fine">
                ${I.T("You did not put the cards in order on the Predict step.", "No ordenaste las tarjetas en el paso Predecir.")}
              </p>`
        }
      </div>
      <div>
        <h3>${I.T("Your data shows", "Tus datos muestran")}</h3>
        ${orderListHTML(I, cd, result, { cls: "is-result" })}
      </div>
    </div>
    <p class="slx-steps">
      ${I.T("Where are they the same? Where are they different?", "¿Dónde son iguales? ¿Dónde son diferentes?")}
    </p>
  </section>`;
}

/** The interactive chart: the learner types each bar's number; numbers close to the table snap to it. */
export function barBuilderHTML(I, caseDef, rows, values) {
  const all = dataRows(caseDef);
  const max = chartAxisMax(caseDef, rows);
  return html`<div class="slx-bar-build" data-slx-bars>
    <div class="slx-chart-wrap" data-slx-chart-wrap>${barChartHTML(I, caseDef, rows, { values })}</div>
    <ul class="sl-bars">
      ${rows.map((r) => {
        const n = all.findIndex((x) => x.id === r.id) + 1;
        const v = values[r.id];
        const note = barNote(I, caseDef, r, n, v);
        return html`<li>
          <label class="sl-bar-label" for="slb-${r.id}"
            >${rowLine(I, caseDef, r).split(" · ").slice(0, 2).join(" · ")}</label
          >
          <span class="slx-bar-in">
            <input
              id="slb-${r.id}"
              type="number"
              min="0"
              max="${max}"
              step="1"
              inputmode="numeric"
              data-sl-bar="${r.id}"
              value="${v ?? ""}"
              aria-describedby="slb-${r.id}-note"
            />
            <span class="fine">${I.TO(caseDef.dataset.unit)}</span>
          </span>
          <span class="slx-bar-note is-${note.kind}" id="slb-${r.id}-note" data-slx-note="${r.id}"
            >${note.text}</span
          >
        </li>`;
      })}
    </ul>
  </div>`;
}

export function representHTML(I, t, cs) {
  const rec = cs.stages.represent || {};
  const collected = cs.stages.collect?.rows || [];
  if (!collected.length) return needRows(I, t);
  const all = dataRows(t.caseDef).filter((r) => collected.includes(r.id));
  const format = rec.format === "bars" ? "bars" : "table";
  const chosen = all.filter((r) => (rec.rows || []).includes(r.id));
  const shown = !chosen.length
    ? html`<p class="fine">
        ${I.T("Choose at least two results to see them here.", "Elige al menos dos resultados para verlos aquí.")}
      </p>`
    : format === "bars"
      ? html`<p class="slx-steps">
            ${I.T("Type each number from your table. Watch the bar grow.", "Escribe cada número de tu tabla. Mira cómo crece la barra.")}
          </p>
          ${barBuilderHTML(I, t.caseDef, chosen, rec.bars || {})}
          <h3 class="slx-sub">${I.T("Your table", "Tu tabla")}</h3>
          ${tableHTML(I, t.caseDef, chosen)}`
      : tableHTML(I, t.caseDef, chosen);
  return html`<section class="panel sl-build" aria-labelledby="slBuildTitle">
      <h2 id="slBuildTitle">
        ${I.T("Build a table or a bar chart", "Construye una tabla o una gráfica de barras")}
      </h2>
      <fieldset class="sl-choice slx-format">
        <legend>${I.T("What do you want to build?", "¿Qué quieres construir?")}</legend>
        ${["table", "bars"].map((f) => html`<label class="sl-radio"><input type="radio" name="slFormat" value="${f}" data-sl-format ${format === f ? raw("checked") : ""} /> ${f === "table" ? I.T("A table", "Una tabla") : I.T("A bar chart", "Una gráfica de barras")}</label>`)}
      </fieldset>
      <fieldset class="sl-choice slx-rowpick">
        <legend>${I.T("Which results go in it?", "¿Qué resultados van en ella?")}</legend>
        ${all.map((r) => html`<label class="sl-check"><input type="checkbox" value="${r.id}" data-sl-evid="represent:rows:${r.id}" ${chosen.includes(r) ? raw("checked") : ""} /> ${rowLine(I, t.caseDef, r)}</label>`)}
      </fieldset>
    </section>
    <section class="panel sl-preview" aria-labelledby="slPreviewTitle">
      <h2 id="slPreviewTitle">${I.T("What you built", "Lo que construiste")}</h2>
      ${shown}
    </section>
    ${ordersHTML(I, t, cs, all)}
    <section class="panel">
      ${fieldHTML(I, { stage: "represent", name: "sentence", label: I.T("Write one sentence about what your table or chart shows.", "Escribe una oración sobre lo que muestra tu tabla o gráfica."), value: rec.sentence || "", rows: 3, required: true })}
      ${savedNote(I)}
    </section>`;
}

// ── evidence ─────────────────────────────────────────────────────────────────
export function evidenceHTML(I, t, cs) {
  const collected = cs.stages.collect?.rows || [];
  if (!collected.length) return needRows(I, t);
  const rows = dataRows(t.caseDef).filter((r) => collected.includes(r.id));
  const chosen = cs.stages.evidence?.ids || [];
  return html`<section class="panel sl-evidence" aria-labelledby="slEvTitle">
    <h2 id="slEvTitle">${I.T("Choose your evidence", "Elige tu evidencia")}</h2>
    ${echoHTML(I, I.T("Your claim", "Tu afirmación"), cs.stages.claim?.text)}
    <p class="slx-steps">
      ${I.T("Choose the tests that support your claim: tap a bar or a row. It lights up in both places.", "Elige las pruebas que apoyan tu afirmación: toca una barra o una fila. Se ilumina en los dos lugares.")}
    </p>
    ${evidencePickerHTML(I, t.caseDef, rows, "evidence:ids", chosen)}
    <p class="fine slx-ev-count" aria-live="polite">
      ${I.T(`${chosen.length} chosen`, `${chosen.length} elegidas`)}
    </p>
  </section>`;
}

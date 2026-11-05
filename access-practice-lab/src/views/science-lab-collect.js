// Science Investigation Lab: collect data. Each test is a card on the bench: before it runs it shows the set-up;
// running it plays a CSS time-lapse of that row (longer results take longer), then the row's fixed value appears
// and the row joins the data table. A repeated set of conditions is labelled as its second trial.
// Saved shape: collect.rows [rowId] (as before) and collect.last (the row run most recently, for the time-lapse).
import { html, icon, raw } from "../util.js";
import { dataNoteHTML } from "./science-lab-data.js";
import { dataRows } from "./science-lab-model.js";
import { condText, runDuration, runFrameHTML, trialOf, valueOf } from "./science-lab-scene.js";

const unitOf = (I, caseDef) => I.S(caseDef.dataset.unit.en, caseDef.dataset.unit.es);

function runCardHTML(I, caseDef, row, i, ran, last) {
  const done = ran.includes(row.id);
  const cond = condText(I, caseDef, row.conditions);
  const trial = trialOf(caseDef, row);
  const value = `${valueOf(caseDef, row)} ${unitOf(I, caseDef)}`;
  const state = !done ? "ready" : row.id === last ? "play" : "done";
  const style = state === "play" ? raw(` style="--slx-dur:${runDuration(caseDef, row)}"`) : "";
  return html`<li class="sl-run ${done ? "is-done" : ""} ${state === "play" ? "is-last" : ""}"${style}>
    <p class="sl-run-head">
      <span class="sl-run-n">${I.T(`Test ${i + 1}`, `Prueba ${i + 1}`)}</span>
      ${trial > 1 ? html`<span class="slx-trial">${I.T(`Trial ${trial}`, `Ensayo ${trial}`)}</span>` : ""}
    </p>
    <span class="sl-run-cond">${cond}</span>
    ${runFrameHTML(I, caseDef, row, { state })}
    ${
      done
        ? html`<strong
            class="sl-run-result ${state === "play" ? "slx-reveal" : ""}"
            data-sl-result="${row.id}"
            tabindex="-1"
            >${icon("check")} ${value}</strong
          >`
        : html`<button
            type="button"
            class="btn small"
            data-sl-run="${row.id}"
            aria-label="${I.S(`Run test ${i + 1}: ${cond}`, `Hacer la prueba ${i + 1}: ${cond}`)}"
          >
            ${icon("play")} ${I.T(`Run test ${i + 1}`, `Hacer prueba ${i + 1}`)}
          </button>`
    }
  </li>`;
}

function collectedTableHTML(I, caseDef, ran, last) {
  const rows = dataRows(caseDef).filter((r) => ran.includes(r.id));
  if (!rows.length)
    return html`<p class="fine slx-empty-table">
      ${I.T("Your table is empty. Run a test to add its result.", "Tu tabla está vacía. Haz una prueba para agregar su resultado.")}
    </p>`;
  const all = dataRows(caseDef);
  return html`<div
    class="sl-table-wrap"
    role="region"
    tabindex="0"
    aria-label="${I.S("Your data table", "Tu tabla de datos")}"
  >
    <table class="sl-table slx-data">
      <caption>
        ${I.TO(caseDef.measure.label)}
      </caption>
      <thead>
        <tr>
          <th scope="col">${I.T("Test", "Prueba")}</th>
          ${caseDef.variables.map((v) => html`<th scope="col">${I.TO(v.label)}</th>`)}
          <th scope="col">${I.T("Trial", "Ensayo")}</th>
          <th scope="col">${I.TO(caseDef.dataset.unit)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (r) =>
            html`<tr data-slx-row="${r.id}" class="${r.id === last ? "is-new" : ""}">
              <th scope="row">${all.findIndex((x) => x.id === r.id) + 1}</th>
              ${caseDef.variables.map((v) => html`<td>${condText(I, { variables: [v] }, r.conditions)}</td>`)}
              <td>${trialOf(caseDef, r)}</td>
              <td><strong>${valueOf(caseDef, r)}</strong></td>
            </tr>`,
        )}
      </tbody>
    </table>
  </div>`;
}

export function collectHTML(I, t, cs) {
  const rec = cs.stages.collect || {};
  const ran = rec.rows || [];
  const rows = dataRows(t.caseDef);
  return html`<section class="panel sl-collect" aria-labelledby="slCollectTitle">
      <h2 id="slCollectTitle">
        ${I.T("Run each test and watch what happens", "Haz cada prueba y mira lo que pasa")}
      </h2>
      <p class="slx-count" aria-live="polite">
        ${I.T(`${ran.length} of ${rows.length} tests run`, `${ran.length} de ${rows.length} pruebas hechas`)}
      </p>
      <details class="slx-more">
        <summary>${I.T("How every test was set up", "Cómo se preparó cada prueba")}</summary>
        ${dataNoteHTML(I, t.caseDef)}
      </details>
      <ol class="sl-runs">
        ${rows.map((row, i) => runCardHTML(I, t.caseDef, row, i, ran, rec.last))}
      </ol>
    </section>
    <section class="panel sl-collect-table" aria-labelledby="slDataTitle">
      <h2 id="slDataTitle">${I.T("Your data table", "Tu tabla de datos")}</h2>
      ${collectedTableHTML(I, t.caseDef, ran, rec.last)}
      <p class="fine">${icon("info")} ${I.TO(t.caseDef.dataset.note)}</p>
    </section>`;
}

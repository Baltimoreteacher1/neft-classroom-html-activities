// Science Investigation Lab: the argument stages made visible (claim, evidence, reasoning).
// claim: the learner's own chart stays on screen; tapping two bars puts those tests side by side in a comparison.
// evidence: tapping a bar or a table row chooses it; the choice is highlighted on the chart and the table together.
// reasoning: a claim / evidence / reasoning diagram built from the learner's own work, joined by drawn connectors.
// Saved shapes (inside the existing stage records): claim.compare [rowId, rowId]; evidence.ids as before.
import { html, icon, raw } from "../util.js";
import { dataRows } from "./science-lab-model.js";
import { barChartHTML, condText, runFrameHTML, trialOf, valueOf } from "./science-lab-scene.js";
import { labHref } from "./science-lab-ui.js";

const unitOf = (I, caseDef) => I.S(caseDef.dataset.unit.en, caseDef.dataset.unit.es);
const numOf = (caseDef, row) => dataRows(caseDef).findIndex((r) => r.id === row.id) + 1;

/** The rows the learner collected, in data order. */
export const collectedRows = (t, cs) => {
  const ran = cs.stages.collect?.rows || [];
  return dataRows(t.caseDef).filter((r) => ran.includes(r.id));
};

/** The learner's own chart from the represent step: their chosen rows and, if they drew bars, their bar values. */
export function myChart(t, cs) {
  const rep = cs.stages.represent || {};
  const ran = collectedRows(t, cs);
  const chosen = ran.filter((r) => (rep.rows || []).includes(r.id));
  const rows = chosen.length >= 2 ? chosen : ran;
  const bars = rep.format === "bars" ? rep.bars || {} : {};
  const values = Object.fromEntries(
    rows.map((r) => [r.id, bars[r.id] !== undefined ? bars[r.id] : valueOf(t.caseDef, r)]),
  );
  return { rows, values, own: chosen.length >= 2 };
}

const needData = (I, t) =>
  html`<p class="fine slx-need">
    ${icon("info")}
    ${I.T("Your chart appears here after you collect data.", "Tu gráfica aparece aquí después de reunir datos.")}
    <a href="${labHref(t, "collect")}">${I.T("Go to Collect data", "Ir a Reunir datos")}</a>
  </p>`;

// ── claim: compare two bars ──────────────────────────────────────────────────
function sideHTML(I, caseDef, row, value, k) {
  const unit = unitOf(I, caseDef);
  return html`<div class="slx-side is-${k}">
    <p class="slx-side-tag">
      ${I.T(`Test ${numOf(caseDef, row)}`, `Prueba ${numOf(caseDef, row)}`)}
    </p>
    ${runFrameHTML(I, caseDef, row, { state: "done", uid: `slx-cmp-${k}` })}
    <p class="slx-side-cond">${condText(I, caseDef, row.conditions)}</p>
    <p class="slx-side-val"><strong>${value}</strong> ${unit}</p>
  </div>`;
}

function compareHTML(I, t, rows, values, picked) {
  const cd = t.caseDef;
  const sel = picked.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
  if (sel.length < 2)
    return html`<div class="slx-compare is-waiting" data-slx-compare>
      <p class="slx-compare-hint">
        ${icon("evidence")}
        ${sel.length ? I.T("One chosen. Tap one more bar to compare.", "Una elegida. Toca una barra más para comparar.") : I.T("Tap two bars on your chart to compare them side by side.", "Toca dos barras de tu gráfica para compararlas lado a lado.")}
      </p>
      ${sel.length ? sideHTML(I, cd, sel[0], values[sel[0].id], "a") : ""}
    </div>`;
  const [a, b] = sel;
  const unit = unitOf(I, cd);
  const line = (r) =>
    `${I.S("Test", "Prueba")} ${numOf(cd, r)} (${condText(I, cd, r.conditions)}): ${values[r.id]} ${unit}`;
  return html`<div class="slx-compare" data-slx-compare>
    <div class="slx-sides">
      ${sideHTML(I, cd, a, values[a.id], "a")}
      <span class="slx-vs" aria-hidden="true">${I.T("and", "y")}</span>
      ${sideHTML(I, cd, b, values[b.id], "b")}
    </div>
    <p class="slx-frame-line">
      <strong>${I.T("You are comparing", "Estás comparando")}:</strong> ${line(a)}; ${line(b)}.
    </p>
    <p class="slx-steps">
      ${I.T(`Which one has more ${cd.dataset.unit.en}? What changed between them? Say it in your claim.`, `¿Cuál tiene más ${cd.dataset.unit.es}? ¿Qué cambió entre ellas? Dilo en tu afirmación.`)}
    </p>
  </div>`;
}

export function claimSceneHTML(I, t, cs) {
  const { rows, values, own } = myChart(t, cs);
  const picked = (cs.stages.claim?.compare || []).filter((id) => rows.some((r) => r.id === id));
  return html`<section class="panel sl-scene-panel slx-argue" aria-labelledby="slCmpTitle">
    <h2 id="slCmpTitle">${I.T("Compare two results", "Compara dos resultados")}</h2>
    ${
      rows.length
        ? html`<p class="fine">
              ${own ? I.T("This is the chart you built. Tap a bar to choose it.", "Esta es la gráfica que construiste. Toca una barra para elegirla.") : I.T("These are the results you collected. Tap a bar to choose it.", "Estos son los resultados que reuniste. Toca una barra para elegirla.")}
            </p>
            <div class="slx-cmp-grid">
              ${barChartHTML(I, t.caseDef, rows, { values, highlight: picked, uid: "slx-claim-chart", pick: "claim", compact: true })}
              ${compareHTML(I, t, rows, values, picked)}
            </div>`
        : needData(I, t)
    }
  </section>`;
}

// ── evidence: chart and table chosen together ────────────────────────────────
/** The chart and the table share one selection; `where` = "<stage>:<key>" the chosen ids are saved under. */
export function evidencePickerHTML(I, caseDef, rows, where, chosen, uid = "slx-ev") {
  const unit = unitOf(I, caseDef);
  return html`<div class="slx-evpick">
    ${barChartHTML(I, caseDef, rows, { highlight: chosen, uid: `${uid}-chart`, pick: `evid:${where}`, compact: true })}
    <div
      class="sl-table-wrap"
      role="region"
      tabindex="0"
      aria-label="${I.S("Your data table", "Tu tabla de datos")}"
    >
      <table class="sl-table slx-evtable">
        <caption>
          ${I.T("Tap a row or a bar to choose it as evidence", "Toca una fila o una barra para elegirla como evidencia")}
        </caption>
        <thead>
          <tr>
            <th scope="col">${I.T("Choose", "Elegir")}</th>
            <th scope="col">${I.T("Test", "Prueba")}</th>
            ${caseDef.variables.map((v) => html`<th scope="col" class="slx-evvar">${I.TO(v.label)}</th>`)}
            <th scope="col" class="slx-evcond">${I.T("Set-up", "Montaje")}</th>
            <th scope="col">${unit}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => {
            const on = chosen.includes(r.id);
            const n = numOf(caseDef, r);
            const name = `${I.S("Test", "Prueba")} ${n} · ${condText(I, caseDef, r.conditions)} · ${valueOf(caseDef, r)} ${unit}`;
            return html`<tr class="${on ? "is-picked" : ""}" data-slx-evrow="${r.id}">
              <td class="slx-evcell">
                <label class="sl-check slx-evcheck"
                  ><input
                    type="checkbox"
                    value="${r.id}"
                    data-sl-evid="${where}:${r.id}"
                    ${on ? raw("checked") : ""}
                  /><span class="visually-hidden">${name}</span
                  ><span class="slx-evtag" aria-hidden="true"
                    >${on ? I.T("Chosen", "Elegida") : ""}</span
                  ></label
                >
              </td>
              <th scope="row">
                ${n}${trialOf(caseDef, r) > 1 ? html` <span class="fine">(${I.T("trial 2", "ensayo 2")})</span>` : ""}
              </th>
              ${caseDef.variables.map((v) => html`<td class="slx-evvar">${condText(I, { variables: [v] }, r.conditions)}</td>`)}
              <td class="slx-evcond">${condText(I, caseDef, r.conditions)}</td>
              <td><strong>${valueOf(caseDef, r)}</strong></td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ── reasoning: the claim / evidence / reasoning diagram ──────────────────────
function evCardHTML(I, caseDef, row, i) {
  return html`<li class="slx-cer-ev">
    ${runFrameHTML(I, caseDef, row, { state: "done", uid: `slx-cer-${i}` })}
    <p class="slx-cer-k">${I.T(`Test ${numOf(caseDef, row)}`, `Prueba ${numOf(caseDef, row)}`)}</p>
    <p class="slx-cer-cond">${condText(I, caseDef, row.conditions)}</p>
    <p class="slx-cer-val"><strong>${valueOf(caseDef, row)}</strong> ${unitOf(I, caseDef)}</p>
  </li>`;
}

/** Fan connectors from the claim down to each evidence card (decorative; the cards carry the meaning). */
function fanSVG(n, flip = false) {
  const paths = Array.from({ length: n }, (_, i) => {
    const x = ((i + 0.5) / n) * 100;
    return flip
      ? `<path d="M${x.toFixed(2)} 0 C${x.toFixed(2)} 18 50 12 50 30" />`
      : `<path d="M50 0 C50 18 ${x.toFixed(2)} 12 ${x.toFixed(2)} 30" />`;
  }).join("");
  return raw(
    `<svg class="slx-fan" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true" focusable="false">${paths}</svg>`,
  );
}

export function cerDiagramHTML(I, t, cs, reasonText) {
  const cd = t.caseDef;
  const claim = cs.stages.claim?.text?.trim();
  const ids = cs.stages.evidence?.ids || [];
  const rows = dataRows(cd).filter((r) => ids.includes(r.id));
  const n = Math.max(rows.length, 1);
  const empty = (en, es) => html`<p class="slx-cer-empty">${I.T(en, es)}</p>`;
  return html`<figure class="slx-cer" aria-labelledby="slxCerCap" style="--n:${Math.min(n, 4)}">
    <figcaption id="slxCerCap" class="slx-cer-cap">
      ${I.T("Your argument: the claim, the evidence that holds it up, and the reasoning that connects them", "Tu argumento: la afirmación, la evidencia que la sostiene y el razonamiento que las conecta")}
    </figcaption>
    <div class="slx-cer-box is-claim">
      <p class="slx-cer-head">${icon("flag")} ${I.T("Claim", "Afirmación")}</p>
      ${claim ? html`<p class="slx-cer-text" data-slx-cer-claim>${claim}</p>` : empty("You have not written a claim yet.", "Todavía no escribiste una afirmación.")}
    </div>
    ${fanSVG(n)}
    <div class="slx-cer-mid">
      <p class="slx-cer-head">${icon("evidence")} ${I.T("Evidence", "Evidencia")}</p>
      ${
        rows.length
          ? html`<ul class="slx-cer-evs">
              ${rows.map((r, i) => evCardHTML(I, cd, r, i))}
            </ul>`
          : empty(
              "No tests chosen yet. Choose them on the Evidence step.",
              "Todavía no elegiste pruebas. Elígelas en el paso Evidencia.",
            )
      }
    </div>
    ${fanSVG(n, true)}
    <div class="slx-cer-box is-reason">
      <p class="slx-cer-head">${icon("conversation")} ${I.T("Reasoning", "Razonamiento")}</p>
      <p class="slx-cer-text" data-slx-cer-reason>
        ${reasonText?.trim() || I.T("Your reasoning appears here as you type it below.", "Tu razonamiento aparece aquí mientras lo escribes abajo.")}
      </p>
    </div>
  </figure>`;
}

/** Live: mirror the reasoning field into the diagram as the learner types (text only, nothing saved here). */
export function mirrorReason(I, el) {
  const out = document.querySelector("[data-slx-cer-reason]");
  if (!out) return;
  out.textContent =
    el.value.trim() ||
    I.S(
      "Your reasoning appears here as you type it below.",
      "Tu razonamiento aparece aquí mientras lo escribes abajo.",
    );
}


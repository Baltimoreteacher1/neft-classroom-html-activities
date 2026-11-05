// Science Investigation Lab: the sharing stages made visible (revise, present, reflect, transfer).
// revise: Rio, an illustrated lab partner, raises the counter-question; before and after show the changed words.
// present: a poster preview assembled from the learner's own question, claim, chart and evidence.
// reflect: a recap strip of the learner's own work from each stage.
// transfer: the new phenomenon's scene with its data chart and table (all help stays closed).
// Render-only: everything comes from the case data and the learner's saved work. Nothing new is saved here.
import { STAGE_META } from "../content/science-lab.js";
import { diffWords } from "../lang/text.js";
import { esc, html, icon, raw } from "../util.js";
import { myChart } from "./science-lab-argue.js";
import { dataRows } from "./science-lab-model.js";
import {
  barChartHTML,
  condText,
  phenomenonSceneHTML,
  resultOrder,
  STAGE_ICONS,
  valueOf,
  varIconSVG,
} from "./science-lab-scene.js";
import { C, ln, svgImg } from "./science-lab-scene-kit.js";
import { predictionOrder } from "./science-lab-steps.js";

const unitOf = (I, caseDef) => I.S(caseDef.dataset.unit.en, caseDef.dataset.unit.es);
const numOf = (caseDef, row) => dataRows(caseDef).findIndex((r) => r.id === row.id) + 1;
const clip = (s, n = 160) => {
  const t = String(s || "").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

// ── revise: the lab partner ──────────────────────────────────────────────────
/** Rio: an original drawing of a student in lab goggles with a clipboard, one hand raised to ask. */
function partnerSVG(I) {
  const art = `<rect width="200" height="200" rx="22" fill="${C.sky}"/><path d="M0 168 H200 V200 H0Z" fill="${C.table}"/><line x1="0" y1="168" x2="200" y2="168" ${ln(3, C.tableEdge)}/><path d="M58 200 C58 150 72 132 100 132 C128 132 142 150 142 200Z" fill="${C.sage}" ${ln()}/><path d="M86 134 L100 152 L114 134" fill="none" ${ln(2.6)}/><path d="M138 150 C150 128 154 104 150 70" fill="none" ${ln(12, C.navy)}/><path d="M138 150 C150 128 154 104 150 70" fill="none" ${ln(7, "#e7b48c")}/><circle cx="150" cy="62" r="11" fill="#e7b48c" ${ln()}/><circle cx="100" cy="92" r="34" fill="#e7b48c" ${ln()}/><path d="M66 90 C60 52 92 44 104 56 C114 44 144 58 132 88 C126 70 112 66 100 70 C86 64 72 72 66 90Z" fill="${C.cocoa}" ${ln()}/><rect x="72" y="84" width="24" height="16" rx="7" fill="${C.glass}" ${ln(2.6)}/><rect x="104" y="84" width="24" height="16" rx="7" fill="${C.glass}" ${ln(2.6)}/><path d="M96 92 H104" ${ln(2.6)}/><circle cx="84" cy="92" r="3" fill="${C.ink}"/><circle cx="116" cy="92" r="3" fill="${C.ink}"/><path d="M90 112 Q100 120 110 112" fill="none" ${ln(2.6)}/><rect x="52" y="146" width="40" height="48" rx="5" fill="${C.kraft}" ${ln()}/><rect x="64" y="141" width="16" height="9" rx="3" fill="${C.foil}" ${ln(2.2)}/><path d="M60 162 h24 M60 172 h24 M60 182 h16" ${ln(2.2)}/><circle cx="176" cy="30" r="3" fill="${C.navy}"/><path d="M28 30 h10 M33 25 v10" ${ln(2.5, C.copper)}/>`;
  return raw(
    svgImg({
      uid: "slx-rio",
      vb: "0 0 200 200",
      title: I.S("Rio, your lab partner", "Rio, tu compañero de laboratorio"),
      desc: I.S(
        "A student in lab goggles holds a clipboard and raises a hand to ask a question.",
        "Un estudiante con gafas de laboratorio sostiene una tabla con hojas y levanta la mano para hacer una pregunta.",
      ),
      inner: art,
      cls: "slx-rio",
    }),
  );
}

export function partnerHTML(I, askEn, askEs) {
  return html`<div class="sl-counter slx-partner">
    ${partnerSVG(I)}
    <div class="slx-bubble">
      <p class="ex-kicker">
        ${icon("bulb")}
        ${I.T("Rio, your lab partner, is not sure yet and asks:", "Rio, tu compañero de laboratorio, todavía no está seguro y pregunta:")}
      </p>
      <p class="sl-ask">${I.T(askEn, askEs)}</p>
    </div>
  </div>`;
}

/** The earlier and the new words with every changed word marked (added: underlined; taken out: struck through). */
export function diffHTML(I, before, after) {
  const spans = diffWords(before, after);
  const changed = spans.some((s) => s.op !== "same");
  const word = (s, side) => {
    if (s.op === "same") return esc(s.text);
    if (s.op === "del" && side === "before")
      return `<del class="slx-del"><span class="visually-hidden">${esc(I.S("taken out:", "quitado:"))} </span>${esc(s.text)}</del>`;
    if (s.op === "add" && side === "after")
      return `<ins class="slx-ins"><span class="visually-hidden">${esc(I.S("added:", "agregado:"))} </span>${esc(s.text)}</ins>`;
    return "";
  };
  const line = (side) =>
    spans
      .map((s) => word(s, side))
      .filter(Boolean)
      .join(" ");
  return html`<div class="slx-diff-cols">
      <div class="slx-diff-col is-before">
        <p class="slx-diff-k">${I.T("Before", "Antes")}</p>
        <p class="slx-diff-text">
          ${raw(line("before") || esc(I.S("(nothing yet)", "(nada todavía)")))}
        </p>
      </div>
      <span class="slx-diff-arrow" aria-hidden="true">${icon("arrow-right")}</span>
      <div class="slx-diff-col is-after">
        <p class="slx-diff-k">${I.T("After", "Después")}</p>
        <p class="slx-diff-text">
          ${raw(line("after") || esc(I.S("(nothing yet)", "(nada todavía)")))}
        </p>
      </div>
    </div>
    <p class="fine slx-diff-key">
      ${changed ? html`<ins class="slx-ins">${I.T("underlined", "subrayado")}</ins> = ${I.T("you added it", "lo agregaste")} · <del class="slx-del">${I.T("struck through", "tachado")}</del> = ${I.T("you took it out", "lo quitaste")}` : I.T("Nothing has changed yet. Edit your new version below.", "Todavía no cambió nada. Edita tu versión nueva abajo.")}
    </p>`;
}

export const diffPanelHTML = (I, before, after) =>
  html`<section class="slx-diff" aria-labelledby="slxDiffTitle">
    <h3 id="slxDiffTitle">${I.T("Before and after", "Antes y después")}</h3>
    <div data-slx-diff aria-live="polite">${diffHTML(I, before, after)}</div>
  </section>`;

// ── present: the poster ──────────────────────────────────────────────────────
export function posterHTML(I, t, cs) {
  const cd = t.caseDef;
  const q = cs.stages.question?.text?.trim();
  const claim = cs.stages.claim?.text?.trim();
  const ids = cs.stages.evidence?.ids || [];
  const ev = dataRows(cd).filter((r) => ids.includes(r.id));
  const { rows, values } = myChart(t, cs);
  const unit = unitOf(I, cd);
  const missing = (en, es) => html`<p class="slx-poster-missing">${I.T(en, es)}</p>`;
  return html`<figure class="slx-poster" aria-labelledby="slxPosterCap">
    <figcaption id="slxPosterCap" class="ex-kicker">
      ${I.T("Your poster preview, made from your own work", "Vista previa de tu cartel, hecha con tu propio trabajo")}
    </figcaption>
    <div class="slx-poster-sheet">
      <header class="slx-poster-top">
        <p class="slx-poster-k">${I.T("Our question", "Nuestra pregunta")}</p>
        <p class="slx-poster-q">${q || I.TO(cd.question)}</p>
      </header>
      <div class="slx-poster-body">
        <div class="slx-poster-main">
          <p class="slx-poster-k">${I.T("Claim", "Afirmación")}</p>
          ${claim ? html`<p class="slx-poster-claim" data-slx-poster-claim>${claim}</p>` : missing("Write your claim on the Claim step.", "Escribe tu afirmación en el paso Afirmación.")}
          <p class="slx-poster-k">${I.T("Evidence", "Evidencia")}</p>
          ${
            ev.length
              ? html`<ul class="slx-poster-ev">
                  ${ev.map((r) => html`<li><strong>${I.T(`Test ${numOf(cd, r)}`, `Prueba ${numOf(cd, r)}`)}</strong> · ${condText(I, cd, r.conditions)} · <strong>${valueOf(cd, r)}</strong> ${unit}</li>`)}
                </ul>`
              : missing(
                  "Choose evidence on the Evidence step.",
                  "Elige evidencia en el paso Evidencia.",
                )
          }
        </div>
        <div class="slx-poster-side">
          ${phenomenonSceneHTML(I, cd, { uid: "slx-poster-hero", caption: false })}
          ${rows.length ? html`<div data-slx-poster-chart>${barChartHTML(I, cd, rows, { values, uid: "slx-poster-chart", compact: true })}</div>` : ""}
        </div>
      </div>
    </div>
  </figure>`;
}

// ── reflect: the recap strip ─────────────────────────────────────────────────
function card(I, stage, body) {
  const title = STAGE_META[stage]?.title;
  return html`<li class="slx-recap-card" data-slx-recap="${stage}">
    <p class="slx-recap-head">
      <span class="slx-recap-ico" aria-hidden="true">${icon(STAGE_ICONS[stage])}</span>
      ${title ? I.TO(title) : ""}
    </p>
    ${body}
  </li>`;
}
const words = (I, text) =>
  text?.trim()
    ? html`<p class="slx-recap-text">${clip(text)}</p>`
    : html`<p class="fine">
        ${I.T("Nothing saved here yet.", "Todavía no hay nada guardado aquí.")}
      </p>`;

function orderRow(I, cd, ids) {
  const focus = cd.focus || cd.variables[0].id;
  const vals = cd.variables.find((v) => v.id === focus)?.values || [];
  return html`<ol class="slx-mini-order">
    ${ids.map((id, i) => {
      const v = vals.find((x) => x.id === id);
      return html`<li>
        <span class="slx-rank" aria-hidden="true">${i + 1}</span>${varIconSVG(cd, focus, id)}<span
          >${v ? I.TO(v.label) : id}</span
        >
      </li>`;
    })}
  </ol>`;
}

export function recapHTML(I, t, cs) {
  const cd = t.caseDef;
  const st = cs.stages;
  const ran = dataRows(cd).filter((r) => (st.collect?.rows || []).includes(r.id));
  const { rows, values } = myChart(t, cs);
  const ev = dataRows(cd).filter((r) => (st.evidence?.ids || []).includes(r.id));
  const unit = unitOf(I, cd);
  const plan = st.plan || {};
  const label = (id) => {
    const v = cd.variables.find((x) => x.id === id);
    return v ? I.S(v.label.en, v.label.es) : id;
  };
  const items = [
    card(
      I,
      "notice",
      html`${phenomenonSceneHTML(I, cd, { uid: "slx-recap-hero", caption: false })}${words(I, st.notice?.notice)}`,
    ),
    card(I, "question", words(I, st.question?.text)),
    card(
      I,
      "hypothesis",
      html`<p class="fine">${I.T(`Number 1 has the most ${cd.dataset.unit.en}.`, `El número 1 tiene más ${cd.dataset.unit.es}.`)}</p>
        <div class="slx-recap-vs">
        <div>
          <p class="slx-recap-k">${I.T("You predicted", "Predijiste")}</p>
          ${st.hypothesis?.order ? orderRow(I, cd, predictionOrder(cd, st.hypothesis)) : html`<p class="fine">${I.T("No order saved.", "No hay orden guardado.")}</p>`}
        </div>
        <div>
          <p class="slx-recap-k">${I.T("Your data showed", "Tus datos mostraron")}</p>
          ${
            ran.length
              ? orderRow(
                  I,
                  cd,
                  resultOrder(cd, ran).map((x) => x.id),
                )
              : html`<p class="fine">${I.T("No data yet.", "Todavía no hay datos.")}</p>`
          }
        </div>
      </div>`,
    ),
    card(
      I,
      "plan",
      html`<p class="slx-recap-text">
        <strong>${I.T("Changed", "Cambiaste")}:</strong>
        ${(plan.changed || []).map(label).join(", ") || "—"}<br />
        <strong>${I.T("Kept the same", "Mantuviste igual")}:</strong>
        ${(plan.held || []).map(label).join(", ") || "—"}
      </p>`,
    ),
    card(
      I,
      "collect",
      html`<p class="slx-recap-text">
          ${I.T(`You ran ${ran.length} of ${dataRows(cd).length} tests.`, `Hiciste ${ran.length} de ${dataRows(cd).length} pruebas.`)}
        </p>
        <ul class="slx-recap-vals">
          ${ran.map((r) => html`<li><span>${I.T(`Test ${numOf(cd, r)}`, `Prueba ${numOf(cd, r)}`)}</span> <strong>${valueOf(cd, r)}</strong></li>`)}
        </ul>`,
    ),
    card(
      I,
      "represent",
      rows.length
        ? barChartHTML(I, cd, rows, { values, uid: "slx-recap-chart", compact: true })
        : words(I, ""),
    ),
    card(I, "claim", words(I, st.claim?.text)),
    card(
      I,
      "evidence",
      ev.length
        ? html`<ul class="slx-recap-ev">
            ${ev.map((r) => html`<li>${I.T(`Test ${numOf(cd, r)}`, `Prueba ${numOf(cd, r)}`)} · <strong>${valueOf(cd, r)}</strong> ${unit}</li>`)}
          </ul>`
        : words(I, ""),
    ),
    card(I, "reasoning", words(I, st.reasoning?.text)),
    card(I, "revise", words(I, typeof st.revise?.after === "string" ? st.revise.after : "")),
  ];
  return html`<section class="panel slx-recap" aria-labelledby="slxRecapTitle">
    <h2 id="slxRecapTitle">
      ${I.T("Your investigation, step by step", "Tu investigación, paso a paso")}
    </h2>
    <p class="fine">
      ${I.T("Everything here is your own work. Look at it before you answer the questions below.", "Todo esto es tu propio trabajo. Míralo antes de responder las preguntas de abajo.")}
    </p>
    <ol class="slx-recap-strip">
      ${items}
    </ol>
  </section>`;
}

// ── transfer: the new phenomenon ─────────────────────────────────────────────
export const transferSceneHTML = (I, tc) =>
  html`<div class="slx-tf-scene">${phenomenonSceneHTML(I, tc, { uid: "slx-tf-hero" })}</div>`;

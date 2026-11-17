// Data Talk: read a bar or line chart, answer questions about it, build a comparison sentence, then write one of
// your own with a live checklist (a number from the chart, a compare or trend word, the unit). The language of
// math and science data that ACCESS tasks use in every domain.
import { chartHTML as barChartHTML } from "../media.js";
import { PREP_SKILLS } from "./registry.js";
import { html, icon, raw } from "../util.js";
import { buildText, checkBuild, checkChoice, dataChecklist } from "./model.js";
import { blanksHTML, checkBtn, choicesHTML, hearBtn, resultHTML } from "./ui.js";

export const skill = PREP_SKILLS["data-talk"];

const fmt = (n) => Number(n).toLocaleString("en-US");

/** A line chart drawn from the data: labelled axes, a point and value label at each time, and a text summary for screen readers. */
function lineChartHTML(chart) {
  const W = 560;
  const H = 300;
  const pad = { l: 56, r: 20, t: 24, b: 48 };
  const data = chart.data;
  const max = Math.max(...data.map((d) => d.value));
  const top =
    max <= 10
      ? 10
      : 10 ** Math.floor(Math.log10(max)) * Math.ceil(max / 10 ** Math.floor(Math.log10(max)));
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v) => H - pad.b - (v / top) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f));
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const svg = `<svg viewBox="0 0 ${W} ${H}" class="lab-chart-svg prep-line" aria-hidden="true" focusable="false">
    ${ticks.map((t) => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end">${fmt(t)}</text>`).join("")}
    <line class="axis" x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/>
    <polyline class="prep-line-path" points="${pts}"/>
    ${data.map((d, i) => `<circle class="prep-line-dot" cx="${x(i)}" cy="${y(d.value)}" r="5"/><text class="val" x="${x(i)}" y="${y(d.value) - 10}" text-anchor="middle">${fmt(d.value)}</text><text class="lbl" x="${x(i)}" y="${H - pad.b + 20}" text-anchor="middle">${escText(d.label)}</text>`).join("")}
    <text class="unit" x="14" y="${(H - pad.b) / 2}" transform="rotate(-90 14 ${(H - pad.b) / 2})" text-anchor="middle">${escText(chart.unit)}</text>
  </svg>`;
  return html`<figure class="lab-chart" role="img" aria-label="${summary(chart)}">
    <figcaption>${chart.title}</figcaption>
    ${raw(svg)}
  </figure>`;
}
const escText = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const summary = (c) =>
  `${c.title}: ${c.data.map((d) => `${d.label}, ${fmt(d.value)}`).join("; ")} ${c.unit}.`;

function chartBlock(I, set) {
  const c = set.chart;
  return html`<div class="prep-chart">
    ${c.kind === "line" ? lineChartHTML(c) : barChartHTML({ kind: "bar", title: c.title, unit: c.unit, data: c.data })}
    <details class="prep-table">
      <summary>${I.T("Show the data as a table", "Mostrar los datos en una tabla")}</summary>
      <table class="lab-table">
        <caption>
          ${c.title}
        </caption>
        <thead>
          <tr>
            <th scope="col">${c.xLabel}</th>
            <th scope="col">${c.unit}</th>
          </tr>
        </thead>
        <tbody>
          ${c.data.map(
            (d) =>
              html`<tr>
                <th scope="row">${d.label}</th>
                <td>${fmt(d.value)}</td>
              </tr>`,
          )}
        </tbody>
      </table>
    </details>
  </div>`;
}

function checklistHTML(I, set, text) {
  const c = dataChecklist(set, text || "");
  const row = (ok, en, es) =>
    html`<li class="${ok ? "is-met" : ""}">
      ${icon(ok ? "check" : "x")} <span>${I.T(en, es)}</span
      ><span class="visually-hidden"
        >${ok ? I.T(" — done", " — listo") : I.T(" — not yet", " — todavía no")}</span
      >
    </li>`;
  return html`${row(c.number, "Uses a number from the chart", "Usa un número de la gráfica")}${row(c.compare, "Uses a compare or change word (more, fewer, increased, than…)", "Usa una palabra para comparar o cambio (more, fewer, increased, than…)")}${row(c.unit, "Names what was counted or the unit", "Nombra lo que se contó o la unidad")}${row(c.sentence, "Is a full sentence (5 words or more)", "Es una oración completa (5 palabras o más)")}`;
}

export function body(I, set, st, step) {
  if (step === 0)
    return html`<p class="prep-lede">${set.context} ${hearBtn(I, set.context)}</p>
      ${chartBlock(I, set)}
      <h3 class="prep-sub">${I.T("Before you read the numbers", "Antes de leer los números")}</h3>
      <ul class="prep-look">
        <li><strong>${I.T("Title:", "Título:")}</strong> ${set.chart.title}</li>
        <li>
          <strong>${I.T("Labels:", "Etiquetas:")}</strong> ${set.chart.xLabel}
          ${set.chart.kind === "line" ? I.T("(in time order)", "(en orden de tiempo)") : ""}
        </li>
        <li><strong>${I.T("Unit:", "Unidad:")}</strong> ${set.chart.unit}</li>
        <li>
          <strong>${I.T("Kind of graph:", "Tipo de gráfica:")}</strong>
          ${set.chart.kind === "line" ? I.T("A line graph shows change over time.", "Una gráfica lineal muestra cambios en el tiempo.") : I.T("A bar graph compares groups.", "Una gráfica de barras compara grupos.")}
        </li>
      </ul>`;
  if (step === 1) {
    const res = st.checked?.questions;
    return html`${chartBlock(I, set)}
    ${set.questions.map((q, i) => {
      const r = res?.[i];
      return html`<div class="prep-qwrap">
        ${choicesHTML(I, { name: `q${i}`, label: html`<span class="prep-qn">${i + 1}.</span> ${q.q}`, options: q.options, picked: st.answers?.[`q${i}`], answer: q.answer, checked: r ? "mark" : null })}
        ${r ? html`<p class="prep-qres ${r.ok ? "is-right" : "is-wrong"}">${icon(r.ok ? "check" : "retry")} ${r.ok ? r.why : I.T("Not yet. Find the bar or point on the graph, then choose again.", "Todavía no. Busca la barra o el punto en la gráfica y elige otra vez.")}</p>` : ""}
      </div>`;
    })}
    ${checkBtn(
      I,
      "check-questions",
      set.questions.every((_, i) => st.answers?.[`q${i}`]),
      I.T("Check my answers", "Revisar mis respuestas"),
    )}`;
  }
  if (step === 2) {
    const res = st.checked?.build;
    const reveal = st.reveal?.build;
    return html`${chartBlock(I, set)}
      <div class="prep-frames">
        <h3 class="prep-sub">
          ${I.T("Sentence frames for data", "Marcos de oraciones para datos")}
        </h3>
        <ul>
          ${set.frames.map((f) => html`<li>${f}</li>`)}
        </ul>
      </div>
      <p>
        ${I.T("Choose the words that make this sentence true for the graph.", "Elige las palabras que hacen esta oración verdadera para la gráfica.")}
      </p>
      ${reveal ? html`<p class="prep-blanks"><strong>${buildText(set.build.parts)}</strong></p>` : blanksHTML(I, { key: "build", parts: set.build.parts, picks: st.answers?.build, result: res })}
      ${
        res?.ok || reveal
          ? ""
          : checkBtn(
              I,
              "check-build",
              set.build.parts.every((p, i) => typeof p === "string" || st.answers?.build?.[i]),
            )
      }
      ${
        reveal
          ? resultHTML(I, {
              ok: false,
              lead: I.T(
                "Here is the true sentence. Read it aloud, then go on.",
                "Esta es la oración verdadera. Léela en voz alta y continúa.",
              ),
              action: hearBtn(I, buildText(set.build.parts)),
            })
          : res
            ? resultHTML(I, {
                ok: res.ok,
                lead: res.ok
                  ? buildText(set.build.parts)
                  : I.T(
                      `${res.right} of ${res.total} blanks are right. Check each number against the graph.`,
                      `${res.right} de ${res.total} espacios están bien. Compara cada número con la gráfica.`,
                    ),
                action: res.ok
                  ? hearBtn(I, buildText(set.build.parts))
                  : (st.tries?.build || 0) >= 2
                    ? html`<button type="button" class="btn small" data-prep-act="reveal-build">
                        ${I.T("Show the sentence", "Mostrar la oración")}
                      </button>`
                    : "",
              })
            : ""
      }`;
  }
  const text = st.answers?.mine || "";
  return html`${chartBlock(I, set)}
    <label class="prep-write" for="prepMine"><strong>${set.write.prompt}</strong></label>
    <textarea
      id="prepMine"
      class="prep-textarea"
      rows="3"
      data-prep-text="mine"
      data-nsr-ignore
      aria-describedby="prepCheckH"
    >
${text}</textarea>
    <h3 id="prepCheckH" class="prep-sub">${I.T("Your sentence", "Tu oración")}</h3>
    <ul id="prepChecklist" class="prep-checklist" aria-live="polite">
      ${checklistHTML(I, set, text)}
    </ul>
    <details class="fb-more">
      <summary>
        ${I.T("See and hear a model sentence", "Ver y escuchar una oración modelo")}
      </summary>
      <p class="prep-model">${set.write.model} ${hearBtn(I, set.write.model)}</p>
    </details>
    <p class="fine">
      ${I.T("This checklist looks for the parts of a data sentence. Your teacher checks that it is true.", "Esta lista busca las partes de una oración de datos. Tu maestro revisa que sea verdadera.")}
    </p>
    <p>
      <button
        type="button"
        class="btn btn-primary"
        data-prep-act="finish"
        ${dataChecklist(set, text).sentence ? "" : raw("disabled")}
      >
        ${icon("check")} ${I.T("I'm done", "Terminé")}
      </button>
      ${st.done ? html`<span class="prep-set-done">${icon("check")} ${I.T("Saved on this device", "Guardado en este dispositivo")}</span>` : ""}
    </p>`;
}

export function ready(set, st, step) {
  if (step === 1) return Boolean(st.checked?.questions?.every((r) => r?.ok));
  if (step === 2) return Boolean(st.checked?.build?.ok || st.reveal?.build);
  return true;
}

export function notReady(I, set, st, step) {
  if (step === 1)
    return I.S(
      "Get every question right first. The graph has the answers.",
      "Primero responde bien todas las preguntas. La gráfica tiene las respuestas.",
    );
  if (step === 2) return I.S("Check your sentence first.", "Primero revisa tu oración.");
  return "";
}

/** Typing updates the checklist in place; the page never re-renders under the caret. */
export function onText(key, set, st) {
  const list = key === "mine" && document.getElementById("prepChecklist");
  if (!list) return;
  const c = dataChecklist(set, st.answers.mine);
  const es = document.documentElement.lang === "es";
  [c.number, c.compare, c.unit, c.sentence].forEach((ok, i) => {
    const li = list.children[i];
    if (!li) return;
    li.classList.toggle("is-met", ok);
    const use = li.querySelector("use");
    use?.setAttribute("href", use.getAttribute("href").replace(/#(check|x)$/, `#${ok ? "check" : "x"}`));
    const sr = li.querySelector(".visually-hidden");
    if (sr) sr.textContent = ok ? (es ? " — listo" : " — done") : es ? " — todavía no" : " — not yet";
  });
  const done = document.querySelector("[data-prep-act=finish]");
  if (done) done.disabled = !c.sentence;
}

export function act(name, el, set, st) {
  st.checked ||= {};
  if (name === "check-questions") {
    st.checked.questions = set.questions.map((q, i) => checkChoice(q, st.answers?.[`q${i}`]));
    const wrong = st.checked.questions.findIndex((r) => !r?.ok);
    return { focus: wrong >= 0 ? `input[name=q${wrong}]` : "[data-prep-act=next]" };
  }
  if (name === "check-build") {
    st.tries = { ...(st.tries || {}), build: (st.tries?.build || 0) + 1 };
    st.checked.build = checkBuild(set.build.parts, st.answers?.build || {});
    return { focus: ".prep-step .feedback" };
  }
  if (name === "reveal-build") {
    st.reveal = { ...(st.reveal || {}), build: true };
    return { focus: ".prep-step .feedback" };
  }
  if (name === "finish") return { finish: true, focus: "[data-prep-act=finish]" };
  return false;
}

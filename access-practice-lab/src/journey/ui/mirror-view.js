// Growth Mirror views shared by the Improve step, the Show summary and the Passport: the before/after comparison and
// the Before -> After -> On my own timeline. Markup only; the numbers come from engines/mirror.js records.
// Counts of what is on the page, never a score. Word count is not shown as a strength.
import { html } from "../../util.js";
import { diffTokens } from "../engines/mirror.js";

const isPunct = (t) => /^[.,;:!?]+$/.test(t);
const SUPPORT_LABEL = {
  question: ["a guiding question", "una pregunta guía"],
  frame: ["a sentence frame", "un marco de oración"],
  model: ["a model", "un modelo"],
  feedback: ["feedback on my draft", "comentarios sobre mi borrador"],
};

/** One side of a diff: before keeps same + removed words, after keeps same + added words. Marks are never colour-only. */
function diffSide(I, diff, side) {
  const parts = diff.filter(
    (d) => d.op === "same" || (side === "before" ? d.op === "del" : d.op === "add"),
  );
  return parts.map((d, i) => {
    const gap = i && !isPunct(d.text) ? " " : "";
    if (d.op === "same") return html`${gap}${d.text}`;
    return d.op === "add"
      ? html`${gap}<ins class="mr-add"
            ><span class="visually-hidden">${I.S("added: ", "agregado: ")}</span>${d.text}</ins
          >`
      : html`${gap}<del class="mr-del"
            ><span class="visually-hidden">${I.S("removed: ", "quitado: ")}</span>${d.text}</del
          >`;
  });
}

/** The "what changed" list: each item says what, from what, to what, and quotes the learner's own words. */
export function changesHTML(I, observable = []) {
  if (!observable.length) return "";
  return html`<ul class="mr-changes">
    ${observable.map(
      (o) =>
        html`<li class="mr-change${o.better ? "" : " is-check"}">
          <strong>${I.T(o.what, o.whatEs)}</strong>
          <span class="mr-fromto"
            >${I.T(o.from, o.fromEs)} <span aria-hidden="true">→</span
            ><span class="visually-hidden"> ${I.S("became", "pasó a")} </span>
            ${I.T(o.to, o.toEs)}</span
          >
          ${o.evidenceSpan ? html`<q class="mr-span" lang="en">${o.evidenceSpan}</q>` : ""}
        </li>`,
    )}
  </ul>`;
}

/** Side-by-side before/after with changed words marked (strike-through for removed, underline for added). */
export function compareHTML(I, before, after, ev = null, { id = "mr" } = {}) {
  const same = String(before).trim() === String(after).trim();
  const diff = ev?.diff || diffTokens(before, after);
  return html`<div
      class="mr-compare"
      role="group"
      aria-label="${I.S("Before and after", "Antes y después")}"
    >
      <section class="mr-col mr-col-before" aria-labelledby="${id}ColBefore">
        <h4 id="${id}ColBefore">
          <span class="mr-col-tag">${I.T("Before", "Antes")}</span>
          ${I.T("My first response", "Mi primera respuesta")}
        </h4>
        <p class="mr-text" lang="en">${diffSide(I, diff, "before")}</p>
      </section>
      <section class="mr-col mr-col-after" aria-labelledby="${id}ColAfter">
        <h4 id="${id}ColAfter">
          <span class="mr-col-tag">${I.T("After", "Después")}</span>
          ${I.T("My revision", "Mi revisión")}
        </h4>
        <p class="mr-text" lang="en">${diffSide(I, diff, "after")}</p>
      </section>
    </div>
    <p class="mr-legend fine">
      <del class="mr-del">${I.T("struck through = removed", "tachado = quitado")}</del> ·
      <ins class="mr-add">${I.T("underlined = added", "subrayado = agregado")}</ins>
      ${same ? html`· ${I.T("No words changed.", "No cambió ninguna palabra.")}` : ""}
    </p>`;
}

function chips(I, f) {
  if (!f) return "";
  const items = [
    [
      I.T("Moves made", "Pasos hechos"),
      f.movesRequired ? `${f.movesMade} ${I.S("of", "de")} ${f.movesRequired}` : "0",
    ],
    [I.T("Ways of linking ideas", "Maneras de conectar ideas"), f.linkKinds],
    [I.T("Points to the source", "Referencias a la fuente"), f.cites],
    [I.T("Sentences with more than one idea", "Oraciones con más de una idea"), f.complex],
    [I.T("Precise subject words", "Palabras precisas del tema"), f.academic],
  ];
  return html`<ul class="mr-counts">
    ${items.map(([k, v]) => html`<li><span>${k}</span> <b>${v}</b></li>`)}
  </ul>`;
}

const supportNames = (I, ids = []) =>
  ids
    .filter((x) => SUPPORT_LABEL[x])
    .map((x) => I.S(...SUPPORT_LABEL[x]))
    .join(", ");

function helpLine(I, ids) {
  const named = supportNames(I, ids);
  return named
    ? html`<p class="fine">${I.T("Help I used:", "Ayuda que usé:")} ${named}.</p>`
    : html`<p class="fine">${I.T("No help opened.", "No abrí ayuda.")}</p>`;
}

function reasonLines(I, ind) {
  const s = ind.summary || {};
  const out = [];
  if (ind.supported)
    out.push(
      I.T(
        "You opened help, so this try counts as supported practice.",
        "Abriste ayuda, así que este intento cuenta como práctica con apoyo.",
      ),
    );
  if (s.minWordsMet === false)
    out.push(
      I.T(
        `The task asks for at least ${s.minWords} words; this try had ${ind.features.words}.`,
        `La tarea pide al menos ${s.minWords} palabras; este intento tuvo ${ind.features.words}.`,
      ),
    );
  if ((s.reasons || []).includes("moves"))
    out.push(
      I.T(
        `The task looks for at least ${s.needed} of ${s.required} moves; I found ${s.made}.`,
        `La tarea busca al menos ${s.needed} de ${s.required} pasos; encontré ${s.made}.`,
      ),
    );
  return out;
}

function independentStep(I, ind) {
  if (!ind)
    return html`<li class="mr-step is-pending">
      <span class="mr-badge">${I.T("Next", "Sigue")}</span>
      <h3>${I.T("On my own: a new task", "Por mi cuenta: una tarea nueva")}</h3>
      <p>
        ${I.T("Your new try on your own will show up here.", "Tu nuevo intento por tu cuenta aparecerá aquí.")}
      </p>
    </li>`;
  const next = ind.nextStep;
  return html`<li class="mr-step ${ind.demonstrated ? "is-independent" : "is-supported"}">
    <span class="mr-badge"
      >${ind.demonstrated ? I.T("Shown on my own", "Mostrado por mi cuenta") : I.T("Completed with support", "Completado con apoyo")}</span
    >
    <h3>${I.T("On my own: a new task", "Por mi cuenta: una tarea nueva")}</h3>
    <blockquote class="mr-quote" lang="en">${ind.text}</blockquote>
    ${chips(I, ind.features)}
    ${
      ind.demonstrated
        ? ""
        : html`<ul class="mr-reasons">
            ${reasonLines(I, ind).map((l) => html`<li>${l}</li>`)}
          </ul>`
    }
    ${next ? html`<p class="mr-next"><strong>${ind.demonstrated ? I.T("One thing to grow next:", "Algo para seguir creciendo:") : I.T("A supportive next step:", "Un siguiente paso con apoyo:")}</strong> ${I.T(next.label, next.labelEs)}. <span lang="en">${next.ask}</span></p>` : ""}
  </li>`;
}

/** Before -> After -> On my own for one mission, supported practice and independent work labelled apart. */
export function showSummaryHTML(I, record) {
  if (!record?.first) return "";
  const rev = record.revision || {};
  const target = rev.target || {};
  return html`<section class="mr-journey" aria-labelledby="mrJourneyTitle">
    <h3 id="mrJourneyTitle">
      ${I.T("Before → After → On my own", "Antes → Después → Por mi cuenta")}
    </h3>
    <ol class="mr-timeline">
      <li class="mr-step is-supported">
        <span class="mr-badge">${I.T("Supported practice", "Práctica con apoyo")}</span>
        <h3>${I.T("Before: my first response", "Antes: mi primera respuesta")}</h3>
        <blockquote class="mr-quote" lang="en">${record.first.text}</blockquote>
        ${chips(I, record.first.features)} ${helpLine(I, record.first.supportsUsed)}
      </li>
      <li class="mr-step is-supported">
        <span class="mr-badge">${I.T("Supported practice", "Práctica con apoyo")}</span>
        <h3>${I.T("After: my revision", "Después: mi revisión")}</h3>
        <p class="mr-targetline">
          ${I.T("My target:", "Mi meta:")}
          <strong>${I.T(target.label || "", target.labelEs || "")}</strong>
        </p>
        ${
          rev.changed === false
            ? html`<p>
                ${I.T("I kept my first response as it was.", "Dejé mi primera respuesta como estaba.")}
              </p>`
            : html`<blockquote class="mr-quote" lang="en">${rev.text}</blockquote>
                ${changesHTML(I, rev.observable)}`
        }
        ${helpLine(I, rev.supportsUsed)}
      </li>
      ${independentStep(I, record.independent)}
    </ol>
    ${target.why ? html`<p class="mr-whyline"><strong>${I.T("Why it matters:", "Por qué importa:")}</strong> ${I.TO(target.why)}</p>` : ""}
    <p class="fine">
      ${I.T("These are counts of what is on the page. They are not a score, a level or a prediction.", "Son conteos de lo que hay en la página. No son un puntaje, un nivel ni una predicción.")}
    </p>
  </section>`;
}

export { chips as countChips };

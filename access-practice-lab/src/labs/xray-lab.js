// Paragraph X-Ray, steps 1-5. A lens control peels a model paragraph into layers (topic, details + evidence,
// explanation, conclusion, links) with colored bands and sentence-level inspection. Practice has three parts: label
// each sentence's job, put the paragraph back in order (drag, arrow keys or buttons, with an optional skeleton), and
// rebuild it from a bank that includes a sentence that does not belong. The explore step repaints in place.
import * as C from "../content/language-labs.js";
import * as K from "../lang/labs-check.js";
import { announce, esc, html, icon, raw, toHtml } from "../util.js";
import {
  compareCardHTML,
  discoveryHTML,
  guidedHTML,
  lampsHTML,
  markHTML,
  markPhrases,
  panelHead,
  speakBtn,
  transferHTML,
} from "./kit.js";
import {
  DISTRACTOR,
  LENSES,
  checkRebuild,
  jobGist,
  jobName,
  lensIds,
  lensState,
  linksIn,
  moveItem,
  place,
  rebuildBank,
  skeleton,
  slotAt,
  slotLabel,
  unplace,
} from "./xray-model.js";

export const keys = (step) =>
  step === 2
    ? [
        [
          ["1", "–", "7"],
          "Choose a lens (Plain, All layers, Topic…)",
          "Elegir una lente (Sencillo, Todas las capas, Idea principal…)",
        ],
        [
          ["↑", "↓"],
          "Inspect the previous or next sentence",
          "Inspeccionar la oración anterior o siguiente",
        ],
      ]
    : step === 4
      ? [
          [
            ["↑", "↓"],
            "On a drag handle: move the sentence up or down",
            "En un asa de arrastre: subir o bajar la oración",
          ],
        ]
      : [];

const xr = (env) => (env.ui.xr ||= { lens: "all", inspect: 0, tried: [] });

/** Connector words and pointing words as marks inside a sentence. */
const sentenceHTML = (s, refs = []) =>
  raw(
    markHTML(
      markHTML(esc(s.text), K.connectorsIn(s.text).map((c) => c.word), "ll-conn"),
      refs.filter((r) => s.text.includes(r.word)).map((r) => r.word),
      "ll-ref",
    ),
  );

/** One band per sentence. Interactive bands are real buttons so they work with a finger, a mouse and the keyboard. */
function bandsHTML(I, model, { lens = "all", active = -1, interactive = false, lit = null } = {}) {
  return html`<div
    class="ll-para ${lens === "plain" ? "" : "is-xray"} xr-stack"
    data-xr
    data-lens="${lens}"
    lang="en"
  >
    ${model.sentences.map((s, i) => {
      const state = lit == null ? lensState(lens, s.job) : i < lit ? "lit" : "dim";
      const refs = (model.refs || []).filter((r) => s.text.includes(r.word));
      return html`<div
        class="xr-band ${i === active ? "is-active" : ""}"
        data-job="${s.job}"
        data-state="${state}"
        data-i="${i}"
      >
        <span class="xr-tag"
          >${icon(i === 0 ? "flag" : "check")}${I.T(jobName(s.job, 0), jobName(s.job, 1))}</span
        >
        ${interactive ? html`<button type="button" class="ll-s" data-ll-inspect="${i}" aria-pressed="${i === active}">${sentenceHTML(s, model.refs)}</button>` : html`<span class="ll-s">${sentenceHTML(s, model.refs)}</span>`}
        ${refs.length ? html`<p class="xr-refs">${refs.map((r) => html`<span class="xr-ref"><b>${r.word}</b> → ${r.to}</span>`)}</p>` : ""}
      </div>`;
    })}
  </div>`;
}

const inspectorHTML = (I, model, i) => {
  const s = model.sentences[i];
  return html`<div class="xr-insp" data-job="${s.job}">
    <p class="xr-insp-q" lang="en">“${s.text}”</p>
    <p>
      <strong>${I.T("Job in the paragraph:", "Función en el párrafo:")}</strong> <b>${I.T(jobName(s.job, 0), jobName(s.job, 1))}</b>. ${I.T(s.why.en, s.why.es)}
    </p>
    <p class="fine">
      <strong>${I.T("Question this answers:", "Pregunta que responde:")}</strong>
      ${I.T(s.clue.en, s.clue.es)}
    </p>
    ${s.orderClue ? html`<p class="fine"><strong>${I.T("Cohesion clue:", "Pista de cohesión:")}</strong> ${I.T(s.orderClue.en, s.orderClue.es)}</p>` : ""}
    ${linksIn(s.text).length ? html`<p class="fine"><strong>${I.T("Linking words:", "Palabras de enlace:")}</strong> <span lang="en">${linksIn(s.text).join(", ")}</span></p>` : ""}
    ${speakBtn(I, s.text, "Listen to sentence", "Escuchar oración")}
  </div>`;
};

const lensBtn = (I, l, on) =>
  html`<button
    type="button"
    class="chip xr-lens"
    data-ll-lens="${l.id}"
    aria-pressed="${on}"
    data-job="${l.jobs.length === 1 ? l.jobs[0] : ""}"
  >
    <span class="xr-lens-n" aria-hidden="true">${lensIds.indexOf(l.id) + 1}</span>${I.T(...l.name)}
  </button>`;

// ── step 1 ───────────────────────────────────────────────────────────────────
function seeStep(env) {
  const { I, band } = env;
  const model = C.XRAY_MODEL[band];
  return html`<section class="panel ll-see xr-see">
    ${panelHead(I, ["Step 1 · Notice the Pattern", "Paso 1 · Observa el patrón"], ["Every sentence in a paragraph has a job", "Cada oración de un párrafo tiene una función"])}
    <div class="ll-skeleton">
      ${Object.keys(K.JOBS).map((j, idx) => html`<div class="xr-layer" data-job="${j}"><span class="ll-skel-num">${idx + 1}</span><b>${I.T(jobName(j, 0), jobName(j, 1))}</b><span>${I.T(jobGist(j, 0), jobGist(j, 1))}</span></div>`)}
    </div>
    <p>
      ${I.T("Connectors (first, also, because) and pointing words (this, these, it) hold the sentences together. A reader follows them like a path.", "Los conectores (first, also, because) y las palabras que señalan (this, these, it) mantienen unidas las oraciones. El lector las sigue como un camino.")}
    </p>
    <h3 class="cb-h3"><i lang="en">${model.title}</i></h3>
    ${bandsHTML(I, model, { lens: "all" })} ${compare(I, band)}
  </section>`;
}
const compare = (I, band) => compareCardHTML(I, C.XRAY_COMPARE[band]);

// ── step 2 ───────────────────────────────────────────────────────────────────
function exploreStep(env) {
  const { I, band, ls } = env;
  const model = C.XRAY_MODEL[band];
  const st = xr(env);
  const idx = Math.min(st.inspect, model.sentences.length - 1);
  const full = model.sentences.map((s) => s.text).join(" ");
  return html`<section class="panel ll-explore xr" aria-labelledby="xrH">
    ${panelHead(I, ["Step 2 · Interactive Paragraph Scanner", "Paso 2 · Escáner interactivo de párrafos"], ["X-ray a paragraph", "Rayos X a un párrafo"], speakBtn(I, full, "Listen to paragraph", "Escuchar párrafo", "ll-speak-main"), "xrH")}
    <p class="xr-title"><i lang="en">${model.title}</i></p>
    <div
      class="xr-lenses"
      role="group"
      aria-label="${I.S("Lens: peel the paragraph into layers", "Lente: separa el párrafo en capas")}"
    >
      <span class="ll-strip-label">${I.T("Lens:", "Lente:")}</span>
      ${LENSES.map((l) => lensBtn(I, l, l.id === st.lens))}
    </div>
    ${bandsHTML(I, model, { lens: st.lens, active: idx, interactive: true })}
    <p class="fine">
      ${icon("search")}
      ${I.T("Select a sentence to inspect its job.", "Selecciona una oración para inspeccionar su función.")}
    </p>
    <div
      class="ll-inspector"
      data-xr-insp
      aria-label="${I.S("Sentence role inspector", "Inspector de función de la oración")}"
      aria-live="polite"
    >
      ${inspectorHTML(I, model, idx)}
    </div>
    <div data-ll-disc-host>${discoveryHTML(I, env.lab, 2, ls, st.tried.length)}</div>
  </section>`;
}

function setLens(env, id) {
  const st = xr(env);
  if (!lensIds.includes(id)) return;
  st.lens = id;
  if (!st.tried.includes(`l-${id}`)) st.tried.push(`l-${id}`);
  const stack = document.querySelector("[data-xr]");
  if (!stack) return;
  const model = C.XRAY_MODEL[env.band];
  stack.dataset.lens = id;
  stack.classList.toggle("is-xray", id !== "plain");
  model.sentences.forEach((s, i) => {
    stack.querySelector(`[data-i="${i}"]`)?.setAttribute("data-state", lensState(id, s.job));
  });
  for (const b of document.querySelectorAll("[data-ll-lens]"))
    b.setAttribute("aria-pressed", String(b.dataset.llLens === id));
  const l = LENSES.find((x) => x.id === id);
  announce(env.I.S(`Lens: ${l.name[0]}`, `Lente: ${l.name[1]}`), { toast: false });
  repaintDisc(env);
}

function inspect(env, i) {
  const st = xr(env);
  const model = C.XRAY_MODEL[env.band];
  const n = model.sentences.length;
  st.inspect = Math.max(0, Math.min(n - 1, i));
  if (!st.tried.includes(`s-${st.inspect}`)) st.tried.push(`s-${st.inspect}`);
  for (const band of document.querySelectorAll("[data-xr] .xr-band")) {
    const on = Number(band.dataset.i) === st.inspect;
    band.classList.toggle("is-active", on);
    band.querySelector("[data-ll-inspect]")?.setAttribute("aria-pressed", String(on));
  }
  const box = document.querySelector("[data-xr-insp]");
  if (box) box.innerHTML = toHtml(inspectorHTML(env.I, model, st.inspect));
  repaintDisc(env);
}

function repaintDisc(env) {
  const host = document.querySelector("[data-ll-disc-host]");
  if (host) host.innerHTML = toHtml(discoveryHTML(env.I, env.lab, 2, env.ls, xr(env).tried.length));
}
export const tried = (env) => xr(env).tried.length;

// ── step 3 ───────────────────────────────────────────────────────────────────
function exampleStep(env) {
  const { I, ls, band } = env;
  const model = C.XRAY_MODEL[band];
  return guidedHTML(
    I,
    ls,
    model.sentences.map((s) => [
      `“${s.text}” — ${jobName(s.job, 0)}: ${s.why.en}`,
      `«${s.text}» — ${jobName(s.job, 1)}: ${s.why.es}`,
    ]),
    "",
    [
      "Writer's Rule: Open with your main point, support it with connected details, explain why those details matter, and close with a conclusion that echoes the big idea.",
      "Regla del escritor: Abre con tu idea principal, apóyala con detalles conectados, explica por qué importan esos detalles y cierra con una conclusión que retome la gran idea.",
    ],
    (shown) => bandsHTML(I, model, { lens: "all", lit: shown }),
  );
}

// ── step 4 ───────────────────────────────────────────────────────────────────
function shuffleOrder(n) {
  // A fixed, never-solved shuffle so the task is the same on every visit.
  const o = [...Array(n).keys()];
  return [o[2], o[0], o[4], o[1], o[3]].filter((x) => x != null).concat(o.slice(5));
}

function labelsPanel(env, pr) {
  const { I, ls } = env;
  const p = ls.practice.labels || {};
  const right = p.result?.results?.filter((x) => x.ok).length || 0;
  return html`<section class="panel ll-practice">
    ${panelHead(I, ["Step 4 · Part 1 of 3", "Paso 4 · Parte 1 de 3"], ["1. Label each sentence's job", "1. Marca la función de cada oración"], html`<span class="ll-score-pill" role="status">${icon("check")} ${I.T(`${right} of ${pr.sentences.length} labeled`, `${right} de ${pr.sentences.length} marcadas`)}</span>`)}
    <p class="xr-title"><i lang="en">${pr.title}</i></p>
    <details class="ll-ref">
      <summary>${icon("bulb")} ${I.T("Open the layer guide", "Abrir la guía de capas")}</summary>
      <div class="ll-ref-grid">
        ${Object.keys(K.JOBS).map((j) => html`<div class="ll-ref-item xr-layer" data-job="${j}"><strong>${I.T(jobName(j, 0), jobName(j, 1))}</strong><span>${I.T(jobGist(j, 0), jobGist(j, 1))}</span></div>`)}
      </div>
    </details>
    <ol class="ll-items">
      ${pr.sentences.map((s, i) => {
        const r = p.result?.results?.[i];
        const chosen = env.ui.labels[i] ?? p.labels?.[i] ?? "";
        return html`<li class="ll-item xr-item ${r?.ok ? "is-done" : ""}" data-job="${chosen}">
          <div class="ll-item-head">
            <p lang="en">${s.text}</p>
            ${speakBtn(I, s.text)}
          </div>
          <label
            ><span class="visually-hidden">${I.S("Job", "Función")}</span>
            <select data-ll-label="${i}" data-nsr-ignore>
              <option value="">${I.T("Choose…", "Elige…")}</option>
              ${Object.keys(K.JOBS).map((j) => html`<option value="${j}" ${chosen === j ? raw("selected") : ""}>${I.T(jobName(j, 0), jobName(j, 1))}</option>`)}
            </select></label
          >
          ${r ? html`<p class="${r.ok ? "ll-fit" : "ll-misfit"}">${r.ok ? icon("check") : icon("bulb")} ${I.T(r.why.en, r.why.es)}</p>` : ""}
        </li>`;
      })}
    </ol>
    <button type="button" class="btn btn-primary" data-ll-check-labels>
      ${I.T("Check my labels", "Revisar mis marcas")}
    </button>
  </section>`;
}

function orderPanel(env, pr, order) {
  const { I, ls } = env;
  const o = ls.practice.order || {};
  const skel = Boolean(o.skel);
  const sk = skeleton(pr.sentences);
  return html`<section class="panel ll-practice">
    ${panelHead(I, ["Step 4 · Part 2 of 3", "Paso 4 · Parte 2 de 3"], ["2. Put the paragraph back in order", "2. Vuelve a ordenar el párrafo"], o.result?.ok ? speakBtn(I, pr.sentences.map((s) => s.text).join(" "), "Listen to full paragraph", "Escuchar párrafo completo") : "")}
    <p class="fine">
      ${I.T("Drag a sentence by its handle, press the up and down arrow keys on the handle, or use the arrow buttons. Look for the clue words.", "Arrastra una oración por su asa, usa las flechas arriba y abajo en el asa, o usa los botones de flecha. Busca las palabras pista.")}
    </p>
    <div class="row-actions">
      <button type="button" class="btn small ghost" data-ll-skel aria-pressed="${skel}">
        ${icon("list")}
        ${skel ? I.T("Hide the skeleton", "Ocultar el esqueleto") : I.T("Show the skeleton (a hint)", "Mostrar el esqueleto (una pista)")}
      </button>
    </div>
    <ol class="ll-order xr-order ${skel ? "has-skel" : ""}" data-xr-order>
      ${order.map(
        (idx, pos) =>
          html`<li data-job="${skel ? sk[pos].job : ""}" data-pos="${pos}">
            <span lang="en"
              >${markPhrases(
                pr.sentences[idx].text,
                K.connectorsIn(pr.sentences[idx].text).map((c) => c.word),
                "ll-conn",
              )}</span
            >
            ${skel ? html`<span class="xr-slot-tag" aria-hidden="true">${pos + 1}. ${slotLabel(sk[pos], I.S)}</span>` : ""}
            <span class="ll-order-btns">
              <button
                type="button"
                class="btn small xr-grab"
                data-ll-grab="${pos}"
                aria-label="${I.S(`Sentence ${pos + 1}: drag, or press the up and down arrow keys`, `Oración ${pos + 1}: arrastra o usa las flechas arriba y abajo`)}"
              >
                <span aria-hidden="true">⠿</span>
              </button>
              <button
                type="button"
                class="btn small"
                data-ll-move="${pos}"
                data-dir="-1"
                ${pos === 0 ? raw("disabled") : ""}
                aria-label="${I.S(`Move sentence ${pos + 1} up`, `Subir la oración ${pos + 1}`)}"
              >
                ↑
              </button>
              <button
                type="button"
                class="btn small"
                data-ll-move="${pos}"
                data-dir="1"
                ${pos === order.length - 1 ? raw("disabled") : ""}
                aria-label="${I.S(`Move sentence ${pos + 1} down`, `Bajar la oración ${pos + 1}`)}"
              >
                ↓
              </button>
            </span>
          </li>`,
      )}
    </ol>
    <button type="button" class="btn btn-primary" data-ll-check-order>
      ${I.T("Check the order", "Revisar el orden")}
    </button>
    ${o.result ? html`<div class="feedback ${o.result.ok ? "is-right" : "is-hint"}" role="status"><p class="fb-title">${icon(o.result.ok ? "check" : "bulb")} ${o.result.ok ? I.T("The paragraph reads in order: topic, details, explanation, conclusion.", "El párrafo se lee en orden: idea principal, detalles, explicación, conclusión.") : I.T(`Sentence ${o.result.at + 1} is not in its place yet. ${o.result.clue.en}`, `La oración ${o.result.at + 1} todavía no está en su lugar. ${o.result.clue.es}`)}</p></div>` : ""}
  </section>`;
}

function rebuildPanel(env, pr) {
  const { I, ls, band } = env;
  const n = pr.sentences.length;
  const rb = ls.practice.rebuild || {};
  const slots = rb.slots || Array(n).fill(null);
  const sk = skeleton(pr.sentences);
  const bank = rebuildBank(n).filter((c) => !slots.includes(c));
  const textOf = (c) => (c < n ? pr.sentences[c].text : DISTRACTOR[band].text);
  const pick = env.ui.pick;
  const res = rb.result;
  const placed = slots.filter((x) => x != null).length;
  return html`<section class="panel ll-practice xr-rebuild">
    ${panelHead(I, ["Step 4 · Part 3 of 3", "Paso 4 · Parte 3 de 3"], ["3. Rebuild the paragraph", "3. Reconstruye el párrafo"], html`<span class="ll-score-pill" role="status">${icon("check")} ${I.T(`${placed} of ${n} placed`, `${placed} de ${n} colocadas`)}</span>`)}
    <p class="fine">
      ${I.T("Pick a sentence card, then pick the slot it belongs in. Pick a filled slot to take its card back. One card does not belong in this paragraph.", "Elige una tarjeta de oración y luego el espacio donde va. Elige un espacio lleno para devolver su tarjeta. Una tarjeta no pertenece a este párrafo.")}
    </p>
    <div class="xr-rebuild-grid">
      <ol class="xr-slots" aria-label="${I.S("Paragraph skeleton", "Esqueleto del párrafo")}">
        ${sk.map((slot, i) => {
          const c = slots[i];
          const r = res?.results[i];
          return html`<li
            class="xr-slot-row ${r ? (r.ok ? "is-ok" : "is-no") : ""}"
            data-job="${slot.job}"
          >
            <span class="xr-slot-tag">${i + 1}. ${slotLabel(slot, I.S)}</span>
            <button
              type="button"
              class="xr-slot ${c == null ? "is-empty" : ""}"
              data-ll-slot="${i}"
              lang="en"
              aria-label="${I.S(`Slot ${i + 1}, ${slotLabel(slot, (a) => a)}: ${c == null ? "empty" : textOf(c)}`, `Espacio ${i + 1}, ${slotLabel(slot, (_, b) => b)}: ${c == null ? "vacío" : textOf(c)}`)}"
            >
              ${c == null ? html`<span class="xr-ph">${I.T(pick == null ? "Empty slot" : "Place the selected card here", pick == null ? "Espacio vacío" : "Coloca aquí la tarjeta elegida")}</span>` : textOf(c)}
            </button>
            ${r && !r.ok ? html`<p class="ll-misfit xr-why">${icon("bulb")} ${r.distractor ? I.T(DISTRACTOR[band].why.en, DISTRACTOR[band].why.es) : r.empty ? I.T("This slot is still empty.", "Este espacio sigue vacío.") : I.T(r.clue.en, r.clue.es)}</p>` : ""}
            ${r?.ok ? html`<p class="ll-fit xr-why">${icon("check")} ${I.T("In its place.", "En su lugar.")}</p>` : ""}
          </li>`;
        })}
      </ol>
      <div
        class="xr-bank"
        role="group"
        aria-label="${I.S("Sentence cards", "Tarjetas de oraciones")}"
      >
        ${bank.length ? bank.map((c) => html`<button type="button" class="xr-card ${pick === c ? "is-picked" : ""}" data-ll-card="${c}" aria-pressed="${pick === c}" lang="en">${textOf(c)}</button>`) : html`<p class="fine">${I.T("All cards are placed.", "Todas las tarjetas están colocadas.")}</p>`}
      </div>
    </div>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-ll-check-rebuild>
        ${I.T("Check my paragraph", "Revisar mi párrafo")}
      </button>
      <button type="button" class="btn ghost" data-ll-reset-rebuild>
        ${icon("replay")} ${I.T("Start over", "Empezar de nuevo")}
      </button>
      ${res?.ok ? speakBtn(I, pr.sentences.map((s) => s.text).join(" "), "Listen to full paragraph", "Escuchar párrafo completo") : ""}
    </div>
    ${res ? html`<div class="feedback ${res.ok ? "is-right" : "is-hint"}" role="status"><p class="fb-title">${icon(res.ok ? "check" : "bulb")} ${res.ok ? I.T("You rebuilt the paragraph: every sentence has its job, and the extra card stayed out.", "Reconstruiste el párrafo: cada oración tiene su función y la tarjeta extra quedó fuera.") : res.full ? I.T("Some slots need another look. Read the note beside each one.", "Algunos espacios necesitan otra mirada. Lee la nota junto a cada uno.") : I.T("Fill every slot, then check again.", "Llena todos los espacios y vuelve a revisar.")}</p></div>` : ""}
  </section>`;
}

function practiceStep(env) {
  const pr = C.XRAY_PRACTICE[env.band];
  const o = env.ls.practice.order || {};
  const order = env.ui.order || o.order || shuffleOrder(pr.sentences.length);
  env.ui.order = order;
  return html`${labelsPanel(env, pr)}${orderPanel(env, pr, order)}${rebuildPanel(env, pr)}`;
}

// ── step 5 ───────────────────────────────────────────────────────────────────
function transferStep(env) {
  const { I, ls, band } = env;
  const t = C.XRAY_TRANSFER[band];
  const r = ls.transfer.result;
  return transferHTML(
    I,
    ls,
    t,
    r
      ? html`<div class="feedback ${r.ok ? "is-right" : "is-hint"}" role="status">
          <p class="fb-title">
            ${icon(r.ok ? "check" : "bulb")}
            ${r.ok ? I.T("Your paragraph has a topic sentence, linked details and a conclusion.", "Tu párrafo tiene oración principal, detalles unidos y una conclusión.") : I.T(r.next.en, r.next.es)}
          </p>
          <div class="xr-meter" aria-hidden="true">
            ${[
              ["topic", r.topic],
              ["detail", r.conns.length > 0],
              ["explain", r.count >= 4],
              ["conclude", r.conclusion],
            ].map(([j, on]) => html`<span data-job="${j}" class="${on ? "is-on" : ""}"></span>`)}
          </div>
          ${lampsHTML([
            [r.count >= 4, I.T(`${r.count} sentences`, `${r.count} oraciones`)],
            [r.topic, I.T("topic sentence first", "oración principal primero")],
            [
              r.conns.length > 0,
              html`${I.T("connectors", "conectores")}${r.conns.length ? html`: <span lang="en">${r.conns.map((c) => c.word).join(", ")}</span>` : ""}`,
            ],
            [r.conclusion, I.T("a conclusion", "una conclusión")],
          ])}
        </div>`
      : "",
    ls.transfer.hint
      ? html`<p class="ll-frame">
          ${I.T("Frames: ___ is/should ___. First, ___. Also, ___. This matters because ___. Overall, ___.", "Marcos: ___ is/should ___. First, ___. Also, ___. This matters because ___. Overall, ___.")}
        </p>`
      : "",
    { lab: "paragraph-xray", band },
  );
}

export function render(env) {
  const { step } = env;
  if (step === 1) return seeStep(env);
  if (step === 2) return exploreStep(env);
  if (step === 3) return exampleStep(env);
  if (step === 4) return practiceStep(env);
  return transferStep(env);
}

// ── events ───────────────────────────────────────────────────────────────────
/** Re-render, then put focus on the moved control (the render is async, so wait for it). */
const rerenderFocus = (env, sel) => env.ctx.rerender().then(() => document.querySelector(sel)?.focus());

function reorder(env, from, to) {
  const order = moveItem(env.ui.order, from, to);
  env.ui.order = order;
  env.ls.practice.order = { ...(env.ls.practice.order || {}), order, result: null };
  announce(
    env.I.S(`Sentence moved to position ${to + 1}.`, `Oración movida a la posición ${to + 1}.`),
    { toast: false },
  );
  return order;
}

export function click(t, env) {
  const { ls, I, band } = env;
  const lens = t.closest("[data-ll-lens]");
  if (lens) {
    setLens(env, lens.dataset.llLens);
    return true;
  }
  const ins = t.closest("[data-ll-inspect]");
  if (ins) {
    inspect(env, Number(ins.dataset.llInspect));
    return true;
  }
  if (t.closest("[data-ll-skel]")) {
    const o = (ls.practice.order ||= {});
    o.skel = !o.skel;
    return env.done();
  }
  const move = t.closest("[data-ll-move]");
  if (move) {
    const pos = Number(move.dataset.llMove);
    const to = pos + Number(move.dataset.dir);
    reorder(env, pos, to);
    env.save();
    rerenderFocus(env, 
      `[data-ll-move="${to}"][data-dir="${move.dataset.dir}"]:not([disabled]), [data-ll-move="${to}"]:not([disabled])`,
    );
    return true;
  }
  if (t.closest("[data-ll-check-labels]")) {
    const pr = C.XRAY_PRACTICE[band];
    const prev = ls.practice.labels || {};
    const labels = pr.sentences.map((_, i) => env.ui.labels[i] ?? prev.labels?.[i] ?? "");
    const r = K.checkLabels(pr, labels);
    const right = r.results.filter((x) => x.ok).length;
    env.record({
      task: `xray-labels-${band}`,
      ok: r.ok,
      kind: prev.result ? "revision" : "first",
      supported: false,
      use: "Explain",
      extra: { right },
    });
    ls.practice.labels = { labels, result: r };
    announce(
      r.ok
        ? I.S("Every label is right.", "Todas las marcas están bien.")
        : I.S(
            `${right} of ${r.results.length} labels are right. Read the notes under the others.`,
            `${right} de ${r.results.length} marcas están bien. Lee las notas debajo de las otras.`,
          ),
      { toast: false },
    );
    return env.done();
  }
  if (t.closest("[data-ll-check-order]")) {
    const pr = C.XRAY_PRACTICE[band];
    const o = ls.practice.order || {};
    const r = K.checkOrder(pr, env.ui.order);
    env.record({
      task: `xray-order-${band}`,
      ok: r.ok,
      kind: o.result ? "revision" : "first",
      supported: Boolean(o.skel),
      use: "Explain",
    });
    ls.practice.order = { ...o, order: env.ui.order, result: r };
    return env.done();
  }
  const card = t.closest("[data-ll-card]");
  if (card) {
    const c = Number(card.dataset.llCard);
    env.ui.pick = env.ui.pick === c ? null : c;
    return env.done();
  }
  const slot = t.closest("[data-ll-slot]");
  if (slot) {
    const i = Number(slot.dataset.llSlot);
    const n = C.XRAY_PRACTICE[band].sentences.length;
    const rb = (ls.practice.rebuild ||= { slots: Array(n).fill(null) });
    rb.slots = env.ui.pick != null ? place(rb.slots, env.ui.pick, i) : unplace(rb.slots, i);
    env.ui.pick = null;
    rb.result = null;
    return env.done();
  }
  if (t.closest("[data-ll-reset-rebuild]")) {
    ls.practice.rebuild = {
      slots: Array(C.XRAY_PRACTICE[band].sentences.length).fill(null),
      tries: ls.practice.rebuild?.tries || 0,
    };
    env.ui.pick = null;
    return env.done();
  }
  if (t.closest("[data-ll-check-rebuild]")) {
    const pr = C.XRAY_PRACTICE[band];
    const rb = (ls.practice.rebuild ||= { slots: Array(pr.sentences.length).fill(null) });
    const r = checkRebuild(pr, rb.slots);
    if (r.full)
      env.record({
        task: `xray-rebuild-${band}`,
        ok: r.ok,
        kind: rb.tries ? "revision" : "first",
        supported: false,
        use: "Explain",
        extra: { right: r.results.filter((x) => x.ok).length },
      });
    if (r.full) rb.tries = (rb.tries || 0) + 1;
    rb.result = r;
    announce(
      r.ok
        ? I.S("You rebuilt the paragraph.", "Reconstruiste el párrafo.")
        : r.full
          ? I.S("Some slots need another look.", "Algunos espacios necesitan otra mirada.")
          : I.S(
              "Fill every slot, then check again.",
              "Llena todos los espacios y vuelve a revisar.",
            ),
      { toast: false },
    );
    return env.done();
  }
  return false;
}

export function change(t, env) {
  if (!t.matches("[data-ll-label]")) return false;
  env.ui.labels[Number(t.dataset.llLabel)] = t.value;
  t.closest(".ll-item")?.setAttribute("data-job", t.value);
  return true;
}

export function key(e, env) {
  if (env.step === 2) {
    const st = xr(env);
    if (/^[1-7]$/.test(e.key)) {
      setLens(env, lensIds[Number(e.key) - 1]);
      e.preventDefault();
      return true;
    }
    if (
      (e.key === "ArrowUp" || e.key === "ArrowDown") &&
      !e.target.matches?.("input, select, textarea, [role=slider]")
    ) {
      inspect(env, st.inspect + (e.key === "ArrowDown" ? 1 : -1));
      e.preventDefault();
      document
        .querySelector(`[data-ll-inspect="${xr(env).inspect}"]`)
        ?.focus({ preventScroll: true });
      return true;
    }
  }
  const grab = e.target.closest?.("[data-ll-grab]");
  if (env.step === 4 && grab && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
    const from = Number(grab.dataset.llGrab);
    const to = from + (e.key === "ArrowDown" ? 1 : -1);
    if (to < 0 || to >= env.ui.order.length) return true;
    e.preventDefault();
    reorder(env, from, to);
    env.save();
    rerenderFocus(env, `[data-ll-grab="${to}"]`);
    return true;
  }
  return false;
}

/** Pointer drag for the order list (mouse and touch). The handle owns the gesture; everything else stays clickable. */
export function mount(root, env) {
  const list = root.querySelector("[data-xr-order]");
  if (!list) return;
  for (const h of list.querySelectorAll("[data-ll-grab]")) {
    h.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      e.preventDefault();
      const rows = [...list.children];
      const from = Number(h.dataset.llGrab);
      const rects = rows.map((r) => {
        const b = r.getBoundingClientRect();
        return [b.top, b.bottom];
      });
      const row = rows[from];
      const startY = e.clientY;
      let target = from;
      h.setPointerCapture(e.pointerId);
      row.classList.add("is-dragging");
      list.classList.add("is-sorting");
      const move = (ev) => {
        row.style.transform = `translateY(${ev.clientY - startY}px)`;
        target = slotAt(ev.clientY, rects);
        rows.forEach((r, i) => r.classList.toggle("is-drop", i === target && i !== from));
      };
      const end = (ev) => {
        h.releasePointerCapture?.(ev.pointerId);
        h.removeEventListener("pointermove", move);
        h.removeEventListener("pointerup", end);
        h.removeEventListener("pointercancel", end);
        row.classList.remove("is-dragging");
        row.style.transform = "";
        list.classList.remove("is-sorting");
        if (ev.type === "pointerup" && target !== from) {
          reorder(env, from, target);
          env.save();
          rerenderFocus(env, `[data-ll-grab="${target}"]`);
        } else for (const r of rows) r.classList.remove("is-drop");
      };
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", end);
      h.addEventListener("pointercancel", end);
    });
  }
}

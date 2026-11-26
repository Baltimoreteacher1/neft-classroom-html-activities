// Language City episode: the six step panels of the Community Market visit (look, listen, compare, shop, ask, write),
// the inspector for the thing the learner is looking at and the word basket. Markup only; events live in
// city-episode.js. The level changes what is asked and which supports are open, never the scene or the facts.
import { recorderHTML } from "../components.js";
import {
  BUDGET_CENTS,
  CONNECTORS,
  DIALOGUE,
  ITEMS,
  LISTEN_Q,
  PEOPLE,
  READ_Q,
  RECIPE,
  SPEAK,
  SPOTS,
  SPOTS_NEEDED,
  STALLS,
  WRITE,
  spotOf,
} from "../content/city-market-episode.js";
import { answerOf, checkCart, connectorsUsed, money, wordCount } from "../lang/city-market.js";
import { isRecording } from "../recorder.js";
import { html, icon, raw } from "../util.js";
import { wordIconSVG } from "./city-episode-art.js";
import { portraitSVG } from "./city-art.js";
import { speakBtn } from "./studio-kit.js";

export const SPEAK_KEY = "city-market-speak";
const P = (I, pair) => I.T(pair.en, pair.es);
const wordOf = (en) => SPOTS.find((s) => s.word.en === en)?.word;

/** Practice English, with its Spanish beside it only when the learner turned Spanish help on. */
export const tgt = (ui, pair) =>
  html`${pair.en}${ui.es && pair.es !== pair.en ? html`<small class="mk-es" lang="es">${pair.es}</small>` : ""}`;

// ── the inspector: what the learner is looking at now ────────────────────────
export function inspectorHTML(I, ui, level) {
  const spot = spotOf(ui.spot);
  if (!spot)
    return html`<p class="fine mk-inspect-empty">
      ${I.T("Choose a glowing spot in the picture to look closer. Each one adds a word to your basket.", "Elige un punto brillante en el dibujo para mirar de cerca. Cada uno agrega una palabra a tu canasta.")}
    </p>`;
  const w = spot.word;
  return html`<section class="mk-inspect" aria-labelledby="mk-inspect-h">
    <h3 id="mk-inspect-h" tabindex="-1">
      ${P(I, { en: `Looking at: ${spot.label.en}`, es: `Miras: ${spot.label.es}` })}
    </h3>
    ${
      spot.sign
        ? html`<figure class="city-doc is-sign mk-sign">
            <figcaption>${tgt(ui, spot.sign.head)}</figcaption>
            <ul>
              ${spot.sign.lines.map((l) => html`<li>${tgt(ui, l)}</li>`)}
            </ul>
          </figure>`
        : ""
    }
    <div class="mk-word">
      ${level === "A" ? raw(wordIconSVG(w.icon)) : ""}
      <p>
        <b class="mk-word-en">${w.en}</b>
        ${level !== "C" || ui.es ? html`<span class="mk-word-es" lang="es">${w.es}</span>` : ""}
        <span class="mk-word-def">${tgt(ui, w.def)}</span>
      </p>
      ${speakBtn(I, w.en, I.S(`Hear the word ${w.en}`, `Escuchar la palabra ${w.en}`))}
    </div>
    <p class="fine">${I.T("This word is in your basket.", "Esta palabra está en tu canasta.")}</p>
  </section>`;
}

// ── the word basket ──────────────────────────────────────────────────────────
export function basketHTML(I, st, level) {
  const words = SPOTS.filter((s) => st.seen.includes(s.id)).map((s) => s.word);
  return html`<aside class="mk-basket" aria-labelledby="mk-basket-h">
    <h2 id="mk-basket-h">${I.T("My word basket", "Mi canasta de palabras")}</h2>
    <p class="fine">
      ${I.T(`${words.length} of ${SPOTS.length} words collected`, `${words.length} de ${SPOTS.length} palabras reunidas`)}
    </p>
    ${
      words.length
        ? html`<ul class="mk-basket-list">
            ${words.map(
              (w) =>
                html`<li>
                  ${level === "A" ? raw(wordIconSVG(w.icon)) : ""}
                  <span
                    ><b>${w.en}</b
                    >${level !== "C" ? html` <span lang="es">${w.es}</span>` : ""}</span
                  >
                </li>`,
            )}
          </ul>`
        : html`<p class="fine">
            ${I.T("Your basket is empty. Look around the market to fill it.", "Tu canasta está vacía. Mira el mercado para llenarla.")}
          </p>`
    }
  </aside>`;
}

// ── shared pieces ────────────────────────────────────────────────────────────
function choicesHTML(I, ui, step, q, ans) {
  const solved = ans?.ok;
  return html`<div
    class="wl-choices city-opts"
    role="group"
    aria-label="${I.S("Choose one answer", "Elige una respuesta")}"
  >
    ${q.opts.map((o, pos) => {
      const right = solved && o.id === ans.pick;
      const wrong = ui.wrong.includes(`${step}:${o.id}`);
      return html`<button
        type="button"
        class="wl-choice city-opt ${right ? "is-right" : ""} ${wrong ? "is-wrong" : ""}"
        data-mk-pick="${step}:${o.id}"
        aria-disabled="${String(Boolean(solved || wrong))}"
      >
        <span class="city-letter" aria-hidden="true">${String.fromCharCode(65 + pos)}</span>
        <span>${tgt(ui, o)}</span>
      </button>`;
    })}
  </div>`;
}
function feedbackHTML(I, ui, step, q, ans) {
  const fb = ui.fb?.step === step ? q.opts.find((o) => o.id === ui.fb.pick) : null;
  const shown = fb || (ans?.ok ? q.opts.find((o) => o.id === ans.pick) : null);
  if (!shown) return "";
  const ok = shown.id === q.answer;
  return html`<div class="wl-feedback ${ok ? "is-right" : "is-try"}">
    <p>
      <b
        >${icon(ok ? "check" : "bulb")}
        ${ok ? I.T("That works.", "Eso funciona.") : I.T("Not yet.", "Todavía no.")}</b
      >
    </p>
    <p>${P(I, shown.why)}</p>
    ${ok ? "" : html`<p class="fine">${I.T("Try another answer. Look or listen again first if you want.", "Prueba otra respuesta. Si quieres, mira o escucha otra vez primero.")}</p>`}
  </div>`;
}
const framesHTML = (I, frames, title, showEs = true) =>
  html`<div class="city-box city-frame mk-frames">
    <h3>${title}</h3>
    <ul>
      ${frames.map((f) => html`<li><span class="city-frame-text">${f.en}</span>${showEs ? html` <span class="fine" lang="es">${f.es}</span>` : ""}</li>`)}
    </ul>
  </div>`;
const bankHTML = (I, list) =>
  html`<div class="city-box city-bank mk-bank">
    <h3>${I.T("Word bank", "Banco de palabras")}</h3>
    <ul class="mk-bank-list">
      ${list
        .map(wordOf)
        .filter(Boolean)
        .map(
          (w) =>
            html`<li>
              ${raw(wordIconSVG(w.icon))}<span><b>${w.en}</b> <span lang="es">${w.es}</span></span>
            </li>`,
        )}
    </ul>
  </div>`;

// ── the six steps ────────────────────────────────────────────────────────────
function lookHTML(I, st, level) {
  const need = SPOTS_NEEDED[level];
  return html`<p>
      ${level === "A" ? I.T("Tap the glowing spots in the picture. Hear each word and see its picture.", "Toca los puntos brillantes del dibujo. Escucha cada palabra y mira su dibujo.") : level === "B" ? I.T("Read the signs and look at the food. Each spot adds a word to your basket.", "Lee los letreros y mira la comida. Cada punto agrega una palabra a tu canasta.") : I.T("Read every sign closely. You will need the prices, the hours and the offer to make decisions later.", "Lee cada letrero con atención. Necesitarás los precios, el horario y la oferta para decidir después.")}
    </p>
    <p class="mk-count">
      <b>${Math.min(st.seen.length, need)} / ${need}</b>
      ${I.T("things looked at", "cosas vistas")}
    </p>
    <p class="fine">
      ${I.T("Use Tab to move between spots, or choose a stall above to move the view.", "Usa Tab para pasar de un punto a otro, o elige un puesto arriba para mover la vista.")}
    </p>`;
}

function listenHTML(I, st, ui, level) {
  const q = LISTEN_Q[level];
  const ans = answerOf(st, "listen", level);
  return html`<p>
      ${level === "C" ? I.T("Listen first without the words. Then answer the question.", "Escucha primero sin las palabras. Luego responde la pregunta.") : I.T("Listen to Maya and the vendors. You can read along.", "Escucha a Maya y a los vendedores. Puedes leer al mismo tiempo.")}
    </p>
    <div class="wl-actions mk-player">
      <button type="button" class="btn btn-primary" data-mk-play>
        ${icon("volume")} ${I.T("Play the conversation", "Reproducir la conversación")}
      </button>
      <button type="button" class="btn" data-stop-audio>${I.T("Stop", "Detener")}</button>
      <button
        type="button"
        class="btn"
        data-mk-transcript
        aria-expanded="${String(ui.transcript)}"
        aria-controls="mk-transcript"
      >
        ${icon("reading")}
        ${ui.transcript ? I.T("Hide the words", "Ocultar las palabras") : I.T("Show the words", "Mostrar las palabras")}
      </button>
    </div>
    <ol class="mk-transcript" id="mk-transcript" ${ui.transcript ? "" : raw("hidden")}>
      ${DIALOGUE.map((l, i) => {
        const who = PEOPLE[l.who];
        return html`<li class="mk-line" data-mk-line="${i}">
          ${raw(portraitSVG({ look: who.look }))}
          <p><b>${who.name}</b> <span class="fine">${P(I, who.role)}</span><br />${tgt(ui, l)}</p>
          ${speakBtn(I, l.en, I.S(`Hear ${who.name}`, `Escuchar a ${who.name}`))}
        </li>`;
      })}
    </ol>
    <h3 class="mk-q">${tgt(ui, q.ask)}</h3>
    ${choicesHTML(I, ui, "listen", q, ans)} ${feedbackHTML(I, ui, "listen", q, ans)}`;
}

function compareHTML(I, st, ui, level) {
  const q = READ_Q[level];
  const ans = answerOf(st, "compare", level);
  const target = level === "A" ? "hours" : level === "B" ? "bakery-sign" : "bakery-sign";
  const also = level === "C" ? "recipe" : null;
  return html`<p>
      ${level === "C" ? I.T("Compare the offer on the bakery board with what the recipe needs. Then decide.", "Compara la oferta de la pizarra de la panadería con lo que necesita la receta. Luego decide.") : I.T("Read the sign in the picture, then answer.", "Lee el letrero del dibujo y luego responde.")}
    </p>
    <div class="wl-actions">
      <button type="button" class="btn small" data-mk-open="${target}">
        ${icon("search")}
        ${P(I, { en: `Look at the ${spotOf(target).label.en}`, es: `Mirar ${spotOf(target).label.es}` })}
      </button>
      ${also ? html`<button type="button" class="btn small" data-mk-open="${also}">${icon("search")} ${P(I, { en: `Look at ${spotOf(also).label.en}`, es: `Mirar ${spotOf(also).label.es}` })}</button>` : ""}
    </div>
    <h3 class="mk-q">${tgt(ui, q.ask)}</h3>
    ${choicesHTML(I, ui, "compare", q, ans)} ${feedbackHTML(I, ui, "compare", q, ans)}`;
}

function shopHTML(I, st, ui, level) {
  const r = checkCart(st.cart);
  const stalls = STALLS.filter((s) => s.id !== "all");
  const needMet = (id) => !r.missing.includes(id);
  return html`<p>
      ${level === "C" ? I.T("Buy everything the recipe needs and stay inside $10.00. Compare before you choose: you will explain your choices later.", "Compra todo lo que necesita la receta sin pasar de $10.00. Compara antes de elegir: después explicarás tus decisiones.") : I.T("Buy what the recipe needs. Spend $10.00 or less.", "Compra lo que necesita la receta. Gasta $10.00 o menos.")}
    </p>
    <div class="mk-shop">
      <div class="city-box mk-recipe">
        <h3>${tgt(ui, RECIPE.title)}</h3>
        <ul>
          ${RECIPE.needs.map((n) => html`<li class="${needMet(n.id) ? "is-met" : ""}">${needMet(n.id) ? icon("check") : html`<span class="mk-dot" aria-hidden="true"></span>`}<span>${tgt(ui, n.label)}<span class="visually-hidden">${needMet(n.id) ? I.S(" (in your basket)", " (en tu canasta)") : I.S(" (still needed)", " (todavía falta)")}</span></span></li>`)}
        </ul>
      </div>
      <div class="mk-goods">
        ${stalls.map(
          (s) =>
            html`<fieldset class="mk-stallset">
              <legend>${P(I, s.name)}</legend>
              ${ITEMS.filter((i) => i.stall === s.id).map((i) => {
                const on = st.cart.includes(i.id);
                return html`<button
                  type="button"
                  class="mk-item ${on ? "is-on" : ""}"
                  data-mk-item="${i.id}"
                  aria-pressed="${String(on)}"
                >
                  <span class="mk-item-name">${tgt(ui, i.name)}</span>
                  <span class="mk-item-price">${money(i.unitCents * i.qty)}</span>
                  <span class="mk-item-state" aria-hidden="true">${on ? icon("check") : "+"}</span>
                </button>`;
              })}
            </fieldset>`,
        )}
      </div>
    </div>
    <dl class="mk-total" aria-live="polite">
      <div>
        <dt>${I.T("Budget", "Presupuesto")}</dt>
        <dd>${money(BUDGET_CENTS)}</dd>
      </div>
      <div>
        <dt>${I.T("Basket total", "Total de la canasta")}</dt>
        <dd>${money(r.total)}</dd>
      </div>
      <div class="${r.left < 0 ? "is-over" : ""}">
        <dt>
          ${r.left < 0 ? I.T("Over budget by", "Te pasas por") : I.T("Money left", "Dinero que sobra")}
        </dt>
        <dd>${money(Math.abs(r.left))}</dd>
      </div>
    </dl>
    <div class="wl-actions">
      <button type="button" class="btn btn-primary" data-mk-checkcart>
        ${I.T("Check my basket", "Revisar mi canasta")}
      </button>
    </div>
    ${ui.cartFb ? cartFeedbackHTML(I, r) : ""}`;
}
function cartFeedbackHTML(I, r) {
  if (r.ok)
    return html`<div class="wl-feedback is-right">
      <p>
        <b
          >${icon("check")}
          ${I.T("Your basket makes the recipe inside the budget.", "Tu canasta alcanza para la receta dentro del presupuesto.")}</b
        >
      </p>
      <p>
        ${I.T(`Total ${money(r.total)}. Change from $10.00: ${money(r.left)}.`, `Total ${money(r.total)}. Cambio de $10.00: ${money(r.left)}.`)}
      </p>
    </div>`;
  const notes = [];
  if (r.missing.length) {
    const names = r.missing.map((id) => RECIPE.needs.find((n) => n.id === id).label);
    notes.push(
      I.T(
        `The recipe still needs: ${names.map((n) => n.en).join(", ")}.`,
        `La receta todavía necesita: ${names.map((n) => n.es).join(", ")}.`,
      ),
    );
  }
  if (r.over)
    notes.push(
      I.T(
        `The basket is ${money(r.over)} over the budget. Compare the prices and find a cheaper choice.`,
        `La canasta se pasa del presupuesto por ${money(r.over)}. Compara los precios y busca una opción más barata.`,
      ),
    );
  if (r.extras.length && r.over)
    notes.push(
      I.T(
        "Some things in the basket are not in the recipe.",
        "Algunas cosas de la canasta no están en la receta.",
      ),
    );
  return html`<div class="wl-feedback is-try">
    <p><b>${icon("bulb")} ${I.T("Not yet.", "Todavía no.")}</b></p>
    ${notes.map((n) => html`<p>${n}</p>`)}
  </div>`;
}

function speakHTML(I, st, ui, level) {
  const s = SPEAK[level];
  return html`<p><b>${I.T("Your job:", "Tu tarea:")}</b> ${tgt(ui, s.task)}</p>
    ${framesHTML(I, s.starters, level === "A" ? I.T("Sentence starters", "Comienzos de oración") : level === "B" ? I.T("Sentence frames", "Estructuras de oración") : I.T("Connect your ideas", "Conecta tus ideas"), level !== "C" || ui.es)}
    ${s.bank.length ? bankHTML(I, s.bank) : ""}
    <div class="wl-actions">
      ${speakBtn(I, s.model.en, I.S("Hear an example question", "Escuchar una pregunta de ejemplo"))}
      <button type="button" class="btn small" data-mk-model aria-expanded="${String(ui.model)}">
        ${ui.model ? I.T("Hide the example", "Ocultar el ejemplo") : I.T("Read the example", "Leer el ejemplo")}
      </button>
    </div>
    ${ui.model ? html`<p class="mk-model">${tgt(ui, s.model)}</p>` : ""}
    <p>
      ${I.T("Say your question aloud, to yourself, a partner or your teacher. Say it two times: the second time, add one more detail.", "Di tu pregunta en voz alta, para ti, para un compañero o para tu docente. Dila dos veces: la segunda vez, agrega un detalle más.")}
    </p>
    ${recorderHTML(SPEAK_KEY, { i18n: I, recording: isRecording(SPEAK_KEY) })}
    <div class="wl-actions">
      <button
        type="button"
        class="btn ${st.said ? "" : "btn-primary"}"
        data-mk-said
        aria-pressed="${String(st.said)}"
      >
        ${st.said ? html`${icon("check")} ${I.T("I said it aloud", "Lo dije en voz alta")}` : I.T("I said my question aloud", "Dije mi pregunta en voz alta")}
      </button>
    </div>`;
}

function writeHTML(I, st, ui, level) {
  const w = WRITE[level];
  const n = wordCount(st.message);
  const used = connectorsUsed(st.message);
  return html`<p><b>${I.T("Your job:", "Tu tarea:")}</b> ${tgt(ui, w.task)}</p>
    ${framesHTML(I, w.frames, level === "C" ? I.T("Because, but, so", "Because, but, so") : I.T("Sentence frames", "Estructuras de oración"), level !== "C" || ui.es)}
    ${w.bank.length ? bankHTML(I, w.bank) : ""}
    <label class="wl-q mk-write">
      <span>${I.T("My message to Grandma Lucía", "Mi mensaje para la abuela Lucía")}</span>
      <textarea rows="${level === "C" ? 6 : 4}" data-mk-text spellcheck="true">
${st.message}</textarea>
    </label>
    <p class="fine mk-selfcheck" aria-live="polite" data-mk-selfcheck>
      ${selfCheckText(I, level, n, used)}
    </p>
    <div class="wl-actions">
      <button type="button" class="btn btn-primary" data-mk-save>
        ${I.T("Save my message", "Guardar mi mensaje")}
      </button>
    </div>
    ${ui.saveFb ? html`<p class="wl-feedback ${st.saved ? "is-right" : "is-try"}">${st.saved ? I.T("Saved on this device. Nobody grades it, and it is never sent anywhere.", "Guardado en este dispositivo. Nadie lo califica y nunca se envía a ningún lugar.") : I.T("Write a few words first.", "Primero escribe algunas palabras.")}</p>` : ""}
    <p class="fine">
      ${I.T("Your message stays on this device. It is not graded.", "Tu mensaje se queda en este dispositivo. No se califica.")}
    </p>`;
}
/** The self-check line under the message box: a word count, and at level C which connectors appear. Never a score. */
export function selfCheckText(I, level, n, used) {
  const goal = WRITE[level].minWords;
  const count = I.S(
    `${n} words (aim for about ${goal}).`,
    `${n} palabras (intenta escribir unas ${goal}).`,
  );
  if (level !== "C") return count;
  const missing = CONNECTORS.filter((c) => !used.includes(c));
  return `${count} ${used.length ? I.S(`You connected ideas with: ${used.join(", ")}.`, `Conectaste ideas con: ${used.join(", ")}.`) : ""} ${missing.length ? I.S(`Not used yet: ${missing.join(", ")}.`, `Todavía sin usar: ${missing.join(", ")}.`) : ""}`.trim();
}

export const STEP_BODY = {
  look: (I, st, ui, level) => lookHTML(I, st, level),
  listen: listenHTML,
  compare: compareHTML,
  shop: shopHTML,
  speak: speakHTML,
  write: writeHTML,
};

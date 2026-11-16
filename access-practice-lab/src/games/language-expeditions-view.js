// Language Expeditions views: the journey bar, the land map, the activity panels (one per activity type), the land
// gate with its stamp and the end-of-journey summary. Pure functions of state; the module (language-expeditions.js)
// owns the rules. Every control is a native button; the scene above the panel is decorative.
import { canRecord, isRecording, takesFor } from "../recorder.js";
import { dictationControlsHTML } from "../dictation-ui.js";
import {
  audioBtn,
  feedbackHTML,
  frameBox,
  glossHTML,
  hintHTML,
  html,
  icon,
  raw,
  settled,
} from "./engine.js";
import { pic, spotScene } from "./language-expeditions-art.js";

export const DOMAINS = {
  listening: { icon: "listening", name: ["Listening", "Escuchar"] },
  reading: { icon: "reading", name: ["Reading", "Leer"] },
  speaking: { icon: "speaking", name: ["Speaking", "Hablar"] },
  writing: { icon: "writing", name: ["Writing", "Escribir"] },
};
const say = (I, o) => (o ? I.T(o.en, o.es) : "");
const sayS = (I, o) => (o ? I.S(o.en, o.es) : "");
const dom = (I, d) => I.T(...DOMAINS[d].name);
export const complete = (r) => (r.type === "speak" || r.type === "write" ? r.done : settled(r.rs));
export const recKey = (s, r) => `lexp:${s.sid}:${r.id}`;

export const disclaimerHTML = (I) =>
  html`<p class="lexp-disclaimer fine">
    ${icon("info")}${I.T("Original practice aligned to the four WIDA domains. It is not an official ACCESS test, and it never gives a score, level or prediction.", "Práctica original alineada con los cuatro dominios de WIDA. No es una prueba oficial ACCESS y nunca da una calificación, un nivel ni una predicción.")}
  </p>`;

/** The journey bar: the four lands, their stops and stamps. Any land can be opened. */
export function barHTML(s, band, env) {
  const I = env.I;
  return html`<nav
    class="lexp-bar"
    aria-label="${I.S("Journey: the four lands", "Viaje: las cuatro tierras")}"
  >
    <ol>
      ${band.lands.map((land, k) => {
        const L = s.lands[k];
        const now = s.land === k && s.at !== "map";
        const done = L.acts.filter(complete).length;
        return html`<li>
          <button
            type="button"
            class="lexp-land lexp-dom-${land.domain}${now ? " is-now" : ""}${L.stamp ? " is-stamped" : ""}"
            data-lexp-land="${k}"
            ${now ? raw('aria-current="step"') : ""}
          >
            <span class="lexp-land-dom"
              >${icon(DOMAINS[land.domain].icon)}${dom(I, land.domain)}</span
            >
            <span class="lexp-land-name">${say(I, land.name)}</span>
            <span class="lexp-dots" aria-hidden="true"
              >${L.acts.map((r) => html`<i class="${complete(r) ? "is-done" : ""}"></i>`)}</span
            >
            <span class="visually-hidden"
              >${I.S(`${done} of ${L.acts.length} stops finished${L.stamp ? ", stamped" : ""}`, `${done} de ${L.acts.length} paradas terminadas${L.stamp ? ", con sello" : ""}`)}</span
            >
            ${L.stamp ? html`<span class="lexp-stamp-chip">${icon("medal")}${I.T("Stamp", "Sello")}</span>` : ""}
          </button>
        </li>`;
      })}
    </ol>
  </nav>`;
}

export function mapHTML(s, band, env, rec) {
  const I = env.I;
  const any = s.lands.some((L) => L.stamp);
  return html`<div class="lexp-panel lexp-map">
    <p class="lexp-tag">${icon("road")}${I.T("Journey map", "Mapa del viaje")}</p>
    <h2 class="lexp-head" tabindex="-1">${say(I, band.adventure)}</h2>
    <p class="lexp-guide">${say(I, band.intro)}</p>
    <p class="fine">
      ${I.T("Recommended order: Listening, Reading, Speaking, Writing. You can open any land.", "Orden recomendado: Escuchar, Leer, Hablar, Escribir. Puedes abrir cualquier tierra.")}
    </p>
    <ol class="lexp-lands">
      ${band.lands.map((land, k) => {
        const L = s.lands[k];
        return html`<li>
          <button
            type="button"
            class="lexp-land-card lexp-dom-${land.domain}${L.stamp ? " is-stamped" : ""}"
            data-lexp-land="${k}"
          >
            <span class="lexp-land-dom"
              >${icon(DOMAINS[land.domain].icon)}${dom(I, land.domain)}${k === rec ? html` <span class="lexp-rec">${I.T("Next stop", "Siguiente")}</span>` : ""}</span
            >
            <strong>${say(I, land.name)}</strong>
            <span class="lexp-land-intro">${say(I, land.intro)}</span>
            <span class="lexp-land-state"
              >${L.stamp ? html`${icon("medal")}${I.T("Stamped", "Con sello")}` : L.acts.some(complete) ? I.T("Started", "Empezada") : I.T("Not visited yet", "Sin visitar")}</span
            >
          </button>
        </li>`;
      })}
    </ol>
    ${any ? html`<div class="gs-actions"><button type="button" class="btn" data-lexp-summary>${icon("flag")}${I.T("End the expedition here", "Terminar la expedición aquí")}</button></div>` : ""}
    ${disclaimerHTML(I)}
  </div>`;
}

export function gateHTML(s, band, env, rec) {
  const I = env.I;
  const land = band.lands[s.land];
  const all = s.lands.every((L) => L.stamp);
  return html`<div class="lexp-panel lexp-gate-panel lexp-dom-${land.domain}">
    <p class="lexp-stamp-big">${icon("medal")}${I.T("Stamp", "Sello")}: ${say(I, land.name)}</p>
    <h2 class="lexp-head" tabindex="-1">
      ${I.T(`${DOMAINS[land.domain].name[0]} land complete`, `Tierra de ${DOMAINS[land.domain].name[1].toLowerCase()} completa`)}
    </h2>
    <p class="lexp-guide">${say(I, land.gate)}</p>
    <p class="lexp-glow">${say(I, band.glow)}</p>
    <p class="lexp-not-score">
      ${I.T("Stamps are not a score.", "Los sellos no son una calificación.")}
      ${I.T("A stamp shows where you practiced.", "Un sello muestra dónde practicaste.")}
    </p>
    <div class="gs-actions">
      ${
        all
          ? html`<button type="button" class="btn btn-primary btn-big" data-lexp-summary>
              ${icon("flag")}${I.T("See your whole journey", "Ver todo tu viaje")}
            </button>`
          : rec >= 0
            ? html`<button type="button" class="btn btn-primary btn-big" data-lexp-land="${rec}">
                ${icon("arrow-right")}${I.T("Walk on to ", "Sigue hacia ")}${say(I, band.lands[rec].name)}
              </button>`
            : ""
      }
      <button type="button" class="btn" data-lexp-map>
        ${icon("road")}${I.T("Journey map", "Mapa del viaje")}
      </button>
    </div>
    ${disclaimerHTML(I)}
  </div>`;
}

export function summaryHTML(s, band, env) {
  const I = env.I;
  return html`<div class="lexp-panel lexp-summary">
    <p class="lexp-tag">${icon("flag")}${I.T("Journey summary", "Resumen del viaje")}</p>
    <h2 class="lexp-head" tabindex="-1">
      ${I.T("Lands you visited", "Las tierras que visitaste")}
    </h2>
    <ul class="lexp-sum-list">
      ${band.lands.map((land, k) => {
        const L = s.lands[k];
        const done = L.acts.filter(complete).length;
        return html`<li class="lexp-dom-${land.domain}${L.stamp ? " is-stamped" : ""}">
          <span class="lexp-land-dom"
            >${icon(DOMAINS[land.domain].icon)}${dom(I, land.domain)}</span
          >
          <strong>${say(I, land.name)}</strong>
          <span
            >${L.stamp ? html`${icon("medal")}${I.T("Stamped", "Con sello")}` : done ? I.T(`${done} of ${L.acts.length} stops`, `${done} de ${L.acts.length} paradas`) : I.T("Not visited this time", "Sin visitar esta vez")}</span
          >
        </li>`;
      })}
    </ul>
    <p class="lexp-not-score">
      ${I.T("Stamps are not a score.", "Los sellos no son una calificación.")}
    </p>
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-lexp-finish>
        ${icon("check")}${I.T("Finish the expedition", "Terminar la expedición")}
      </button>
      <button type="button" class="btn" data-lexp-map>
        ${icon("road")}${I.T("Back to the journey map", "Volver al mapa del viaje")}
      </button>
    </div>
    <p class="lexp-next">
      ${I.T("Want another four-skill adventure?", "¿Quieres otra aventura de cuatro destrezas?")}
      <a href="/language-adventures/signal-quest/"
        >${I.T("Try Signal Quest: explore an island and bring its signal back.", "Prueba Misión Señal: explora una isla y recupera su señal.")}</a
      >
    </p>
    ${disclaimerHTML(I)}
  </div>`;
}

// ── activity panels ─────────────────────────────────────────────────────────────────────────
function keysHTML(r, a, env) {
  const I = env.I;
  if (!a.keys?.length) return "";
  const list = html`<ul class="lexp-keys" aria-label="${I.S("Key words", "Palabras clave")}">
    ${a.keys.map((k) => html`<li><strong lang="en">${k.en}</strong><span lang="es">${k.es}</span></li>`)}
  </ul>`;
  if (env.sup.gloss === "show") return list;
  if (env.sup.gloss === "tap")
    return html`<details class="lexp-keys-tap">
      <summary>${icon("words")}${I.T("Key words in Spanish", "Palabras clave en español")}</summary>
      ${list}
    </details>`;
  return r.words
    ? list
    : html`<button type="button" class="btn small" data-lexp-words>
        ${icon("help")}${I.T("Show key words", "Mostrar palabras clave")}
      </button>`;
}

function transcriptHTML(r, a, env) {
  const I = env.I;
  const sup = env.support || "A";
  if (sup === "A" || settled(r.rs) || (sup === "B" && r.tx))
    return html`<div class="lexp-transcript">
      <p lang="en">“${a.say.en}”</p>
      ${sup === "C" ? "" : glossHTML(a.say.es, env)}
    </div>`;
  if (sup === "B")
    return html`<button type="button" class="btn small" data-lexp-tx>
      ${icon("reading")}${I.T("Show the words", "Mostrar las palabras")}
    </button>`;
  return html`<p class="fine">
    ${I.T(`Plays: ${r.plays}. The first two plays are part of the task; replays after that are saved as help.`, `Reproducciones: ${r.plays}. Las dos primeras son parte de la tarea; las siguientes se guardan como ayuda.`)}
  </p>`;
}

const choiceCls = (r, i, a) =>
  `${r.rs.picks.includes(i) && i !== a.answer ? " is-miss" : ""}${settled(r.rs) && i === a.answer ? " is-right" : ""}`;

function choicesHTML(r, a, env) {
  const I = env.I;
  const lock = settled(r.rs) ? "disabled" : "";
  if (a.type === "listen-place") {
    const placed = r.pick >= 0 ? a.spots[r.pick] : null;
    return html`<div class="lexp-place">
      <svg class="lexp-place-art" viewBox="0 0 360 200" aria-hidden="true" focusable="false">
        ${raw(spotScene(a.scene, env.band, placed))}
      </svg>
      ${a.spots.map((p, i) => html`<button type="button" class="lexp-spot${choiceCls(r, i, a)}" style="left:${((p.x / 360) * 100).toFixed(2)}%;top:${((p.y / 200) * 100).toFixed(2)}%" data-lexp-pick="${i}" aria-label="${I.S("Spot", "Lugar")} ${i + 1}: ${sayS(I, p.label)}" ${lock}><span aria-hidden="true">${i + 1}</span></button>`)}
    </div>`;
  }
  if (a.choices)
    return html`<div class="lexp-cards" role="group" aria-label="${I.S("Pictures", "Imágenes")}">
      ${r.order.map((i, n) => html`<button type="button" class="lexp-card${choiceCls(r, i, a)}" data-lexp-pick="${i}" aria-label="${I.S("Picture", "Imagen")} ${n + 1}: ${sayS(I, a.choices[i].alt)}" ${lock}>${pic(a.choices[i].art)}<span class="lexp-card-n" aria-hidden="true">${n + 1}</span></button>`)}
    </div>`;
  const listen = a.type === "listen-choice";
  return html`<div class="lexp-opts${a.drawers ? " is-drawers" : ""}" role="group">
    ${r.order.map(
      (i) =>
        html`<div class="lexp-opt">
          <button
            type="button"
            class="lexp-opt-t${choiceCls(r, i, a)}"
            data-lexp-pick="${i}"
            ${lock}
          >
            ${a.drawers ? icon("library") : ""}<span lang="en">${a.options[i].en}</span>
          </button>
          ${listen ? html`<button type="button" class="btn small ghost lexp-opt-say" data-say="${a.options[i].en}" aria-label="${I.S("Hear this answer", "Escuchar esta respuesta")}">${icon("volume")}</button>` : ""}
        </div>`,
    )}
  </div>`;
}

function orderHTML(r, a, env) {
  const I = env.I;
  const lock = settled(r.rs);
  const label = (i) => (a.items[i].art ? sayS(I, a.items[i].label) : a.items[i].label.en);
  return html`<div class="lexp-order">
    <div class="lexp-order-items" role="group" aria-label="${I.S("Tap in order", "Toca en orden")}">
      ${r.order.map((i) => {
        const at = r.seq.indexOf(i);
        return html`<button
          type="button"
          class="lexp-item${a.items[i].art ? " has-art" : ""}${at >= 0 ? " is-placed" : ""}"
          data-lexp-item="${i}"
          aria-pressed="${at >= 0}"
          aria-label="${label(i)}${at >= 0 ? `: ${at + 1}` : ""}"
          ${lock || at >= 0 ? "disabled" : ""}
        >
          ${a.items[i].art ? pic(a.items[i].art) : html`<span lang="en">${a.items[i].label.en}</span>`}<span
            class="lexp-item-n"
            aria-hidden="true"
            >${at >= 0 ? at + 1 : ""}</span
          >
        </button>`;
      })}
    </div>
    <ol class="lexp-seq" aria-label="${I.S("Your order", "Tu orden")}">
      ${r.seq.map((i) => html`<li>${label(i)}</li>`)}
    </ol>
    ${
      lock
        ? ""
        : html`<div class="gs-actions">
            <button
              type="button"
              class="btn btn-primary"
              data-lexp-check
              ${r.seq.length === a.items.length ? "" : "disabled"}
            >
              ${icon("check")}${I.T("Check my order", "Comprobar mi orden")}
            </button>
            ${r.seq.length ? html`<button type="button" class="btn" data-lexp-clear>${icon("replay")}${I.T("Start over", "Empezar de nuevo")}</button>` : ""}
          </div>`
    }
  </div>`;
}

function answerOf(a, I) {
  if (a.type === "listen-place") return say(I, a.spots[a.answer].label);
  if (a.type === "read-order") return a.items.map((x, n) => `${n + 1}. ${x.label.en}`).join("  ");
  if (a.choices) return say(I, a.choices[a.answer].alt);
  return a.options[a.answer].en;
}

export function judgedHTML(s, r, a, env, domain) {
  const I = env.I;
  const listening = domain === "listening";
  return html`${
    listening
      ? html`<div class="lexp-listen">
          <button type="button" class="btn btn-primary" data-lexp-play>
            ${icon("listening")}${r.plays || env.sup.audio === "auto" ? I.T("Play it again", "Escuchar otra vez") : I.T("Listen", "Escuchar")}
          </button>
          ${transcriptHTML(r, a, env)}
        </div>`
      : html`<blockquote
            class="lexp-passage${a.type === "read-picture" ? " is-sign" : ""}${a.drawers ? " is-slip" : ""}"
            lang="en"
          >
            ${a.passage}
          </blockquote>
          ${keysHTML(r, a, env)}`
  }
  ${a.question ? html`<p class="lexp-question">${say(I, a.question)}</p>` : ""}
  ${a.type === "read-order" ? orderHTML(r, a, env) : choicesHTML(r, a, env)}
  ${hintHTML(r.rs, [say(I, a.hint)], env, { disabled: settled(r.rs) })}
  ${feedbackHTML(r.rs, { I, right: I.T("That works.", "Eso funciona."), retry: listening ? I.T("Play it again and listen for the words that decide.", "Escúchalo otra vez y presta atención a las palabras que deciden.") : I.T("Read the text again and find the words that decide.", "Lee el texto otra vez y busca las palabras que deciden."), answer: answerOf(a, I), explain: say(I, a.explain) })}`;
}

function bankHTML(a, env) {
  if (!env.sup.bank || !a.bank?.length) return "";
  return html`<ul class="lexp-bank" aria-label="${env.I.S("Word bank", "Banco de palabras")}">
    ${a.bank.map((w) => html`<li lang="en">${w}</li>`)}
  </ul>`;
}
function selfHTML(r, a, env) {
  const I = env.I;
  return html`<fieldset class="lexp-self">
    <legend>${I.T("Check yourself", "Revísate")}</legend>
    ${a.checks.map((c, i) => html`<button type="button" class="lexp-self-b" data-lexp-self="${i}" aria-pressed="${r.self.includes(i)}">${icon(r.self.includes(i) ? "check" : "star")}<span>${say(I, c)}</span></button>`)}
  </fieldset>`;
}
function modelHTML(r, a, env) {
  const I = env.I;
  if (!r.model)
    return html`<button type="button" class="btn" data-lexp-model>
      ${icon("volume")}${I.T("Hear a model answer", "Escuchar una respuesta modelo")}
    </button>`;
  return html`<div class="lexp-model">
    <p class="lexp-model-l">
      ${I.T("One model answer (yours can be different)", "Una respuesta modelo (la tuya puede ser diferente)")}
    </p>
    <p lang="en">${a.model.en}</p>
    ${glossHTML(a.model.es, env)}${audioBtn(a.model.en, I, I.S("Hear the model again", "Escuchar el modelo otra vez"))}
  </div>`;
}
const textBox = (s, r, I, label) =>
  html`<label class="gs-label" for="lexp-text-${r.id}">${label}</label
    ><textarea
      id="lexp-text-${r.id}"
      class="lexp-text"
      data-lexp-text
      rows="4"
      maxlength="800"
      spellcheck="true"
    >
${r.text}</textarea>`;

export function speakHTML(s, r, a, env) {
  const I = env.I;
  const key = recKey(s, r);
  const live = isRecording(key);
  const takes = typeof window === "undefined" ? [] : takesFor(key);
  const voice = typeof window !== "undefined" && canRecord();
  return html`<figure class="lexp-figure">${pic(a.art)}</figure>
    <p class="lexp-prompt">
      <strong>${I.T("Your task:", "Tu tarea:")}</strong> ${say(I, a.prompt)}
    </p>
    ${audioBtn(a.prompt.en, I, I.S("Listen to the task", "Escuchar la tarea"))}
    ${frameBox(a.frame, env)}${bankHTML(a, env)}
    ${
      r.said
        ? html`${selfHTML(r, a, env)}${modelHTML(r, a, env)}
            <p class="fine">
              ${I.T("This is practice. The game does not grade your speaking: you check it with the list and compare with the model.", "Esto es práctica. El juego no califica cómo hablas: lo revisas con la lista y lo comparas con el modelo.")}
            </p>
            <div class="gs-actions">
              <button type="button" class="btn btn-primary btn-big" data-lexp-next>
                ${icon("arrow-right")}${I.T("Walk on", "Seguir caminando")}
              </button>
            </div>`
        : html`<div class="lexp-voice">
              ${voice ? html`<button type="button" class="btn${live ? " is-live" : ""}" data-lexp-rec aria-pressed="${live}">${icon(live ? "stop" : "record")}${live ? I.T("Stop recording", "Detener la grabación") : I.T("Record myself", "Grabarme")}</button>` : ""}
              ${takes.length && !live ? html`<button type="button" class="btn" data-lexp-playback>${icon("play")}${I.T("Play my recording", "Escuchar mi grabación")}</button>` : ""}
              ${dictationControlsHTML(key, I)}
            </div>
            <p class="fine">
              ${I.T("Recordings stay in this browser tab and are gone when you leave. Nothing is uploaded.", "Las grabaciones se quedan en esta pestaña del navegador y desaparecen al salir. No se sube nada.")}
            </p>
            ${textBox(s, r, I, I.T("My words (optional: type, or let the words appear as you speak)", "Mis palabras (opcional: escribe o deja que aparezcan mientras hablas)"))}
            <div class="gs-actions">
              <button type="button" class="btn btn-primary btn-big" data-lexp-said>
                ${icon("check")}${I.T("I said it out loud", "Lo dije en voz alta")}
              </button>
            </div>`
    }`;
}

export function writeHTML(s, r, a, env) {
  const I = env.I;
  return html`<figure class="lexp-figure">${pic(a.art)}</figure>
    <p class="lexp-prompt">
      <strong>${I.T("Your task:", "Tu tarea:")}</strong> ${say(I, a.prompt)}
    </p>
    ${frameBox(a.frame, env)}${bankHTML(a, env)}
    ${textBox(s, r, I, I.T("My writing", "Mi escritura"))}
    <div class="gs-actions">
      <button type="button" class="btn${r.wn ? "" : " btn-primary"}" data-lexp-wcheck>
        ${icon("check")}${r.wn ? I.T("Check again", "Comprobar otra vez") : I.T("Check my writing", "Comprobar mi escritura")}
      </button>
    </div>
    ${
      r.fb
        ? html`<div class="lexp-wfb" role="status" aria-live="polite">
            <p>
              <strong
                >${r.fb.every((c) => c.ok) ? I.T("Every check is met.", "Se cumplen todas las comprobaciones.") : I.T("Not yet: revise the parts marked below, then check again.", "Todavía no: revisa las partes marcadas abajo y vuelve a comprobar.")}</strong
              >
            </p>
            <ul>
              ${r.fb.map((c) => html`<li class="${c.ok ? "is-ok" : "is-todo"}">${icon(c.ok ? "check" : "alert")}<span>${I.T(c.en, c.es)}</span></li>`)}
            </ul>
            <p class="fine">
              ${I.T("These checks count features of your text. They do not judge your ideas, and they are not a score.", "Estas comprobaciones cuentan rasgos de tu texto. No juzgan tus ideas y no son una calificación.")}
            </p>
          </div>`
        : ""
    }
    ${
      r.wn
        ? html`${selfHTML(r, a, env)}${modelHTML(r, a, env)}
            <div class="gs-actions">
              <button type="button" class="btn btn-primary btn-big" data-lexp-next>
                ${icon("arrow-right")}${I.T("Walk on", "Seguir caminando")}
              </button>
            </div>`
        : ""
    }`;
}

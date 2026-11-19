// Sentence & Story Maker (/early/sentences): visual sentence builder for K–2 emergent writers.
// Pick a scene (Science, Math, Community, Weather), tap Who + Does what + Where/What tiles,
// hear Pepita read the sentence aloud, and print a primary-lined K–2 handwriting sheet.
import { BAND_INFO } from "../bands.js";
import { SENTENCE_SCENES } from "../content/early.js";
import { sceneSVG } from "./scenes.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, announce, html, icon, raw } from "../util.js";

let st = {
  sceneId: SENTENCE_SCENES[0].id,
  who: 0,
  action: 0,
  where: 0,
};

function currentSentence(scene) {
  const w = scene.who[st.who] || scene.who[0];
  const a = scene.action[st.action] || scene.action[0];
  const p = scene.where[st.where] || scene.where[0];
  return {
    en: `${w[0]} ${a[0]} ${p[0]}`,
    es: `${w[1]} ${a[1]} ${p[1]}`,
    pics: [w[2], a[2], p[2]],
  };
}

function tileRow(label, key, items, selectedIdx, I) {
  return html`<fieldset class="early-sent-group">
    <legend>${label}</legend>
    <div class="early-sent-tiles">
      ${items.map(
        ([en, es, pic], idx) => html`<button
          type="button"
          class="btn early-big early-sent-tile ${idx === selectedIdx ? "is-selected" : ""}"
          data-sent-pick="${key}:${idx}"
          aria-pressed="${idx === selectedIdx}"
        >
          <span class="early-emoji" aria-hidden="true">${pic}</span>
          <span lang="en">${en}</span>
          ${I.spanish || I.bilingual ? html`<small class="fine" lang="es">${es}</small>` : ""}
        </button>`,
      )}
    </div>
  </fieldset>`;
}

export function render(ctx, I) {
  const info = BAND_INFO[ctx.band] || {};
  const scene = SENTENCE_SCENES.find((s) => s.id === st.sceneId) || SENTENCE_SCENES[0];
  const sent = currentSentence(scene);
  const lang = I.mode === "es" ? "es" : "en";

  return {
    title: I.S("Sentence & Story Maker", "Creador de oraciones e historias"),
    html: html`<article class="early-sentences" aria-labelledby="sentTitle">
      <header class="early-head">
        <p class="eyebrow">
          ${I.T("Writing & speaking", "Escribir y hablar")} ·
          ${I.T(info.label || "", info.labelEs || "")}
        </p>
        <h1 id="sentTitle" tabindex="-1">
          ${I.T("Sentence & Story Maker", "Creador de oraciones e historias")}
        </h1>
        <p>
          ${I.T(
            "Choose a scene, tap three picture tiles to build a sentence, hear it read aloud, and print your handwriting page.",
            "Elige una escena, toca tres fichas con dibujos para formar una oración, escúchala en voz alta e imprime tu hoja para escribir.",
          )}
        </p>
        <p class="early-switch">
          <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
            >${I.T("My practice home", "Mi página de práctica")}</a
          >
        </p>
        <div class="early-decks" role="group" aria-label="${I.S("Scenes", "Escenas")}">
          ${SENTENCE_SCENES.map(
            (s) => html`<button
              type="button"
              class="btn small"
              data-sent-scene="${s.id}"
              aria-pressed="${s.id === scene.id}"
            >
              ${I.T(s.title[0], s.title[1])}
            </button>`,
          )}
        </div>
      </header>

      <section class="early-sent-stage">
        <div class="early-sent-art">${raw(sceneSVG(scene.id, lang))}</div>
        <div class="early-sent-strip" role="status">
          <p class="early-sent-pics" aria-hidden="true">${sent.pics.join(" ")}</p>
          <p class="early-sent-text" lang="en">${sent.en}</p>
          ${I.spanish || I.bilingual ? html`<p class="fine" lang="es">${sent.es}</p>` : ""}
          <p class="early-actions">
            <button type="button" class="btn btn-primary early-big" data-sent-hear>
              ${icon("volume")} ${I.T("Read my sentence", "Leer mi oración")}
            </button>
            <button type="button" class="btn early-big" data-sent-print>
              ${icon("print")} ${I.T("Print writing sheet", "Imprimir hoja para escribir")}
            </button>
          </p>
        </div>
      </section>

      <section class="early-sent-builder">
        ${tileRow(I.T("1. Who?", "1. ¿Quién?"), "who", scene.who, st.who, I)}
        ${tileRow(I.T("2. Does what?", "2. ¿Qué hace?"), "action", scene.action, st.action, I)}
        ${tileRow(I.T("3. What or where?", "3. ¿Qué o dónde?"), "where", scene.where, st.where, I)}
      </section>

      <section class="early-print-sheet" aria-hidden="true">
        <p class="early-print-model">${sent.en}</p>
        <div class="early-print-lines">
          <div class="early-print-line"></div>
          <div class="early-print-line"></div>
          <div class="early-print-line"></div>
        </div>
      </section>
    </article>`,
  };
}

export function onClick(e, ctx, I) {
  const t = e.target;
  const rate = ctx.prefs.rate || 0.85;
  const scene = SENTENCE_SCENES.find((s) => s.id === st.sceneId) || SENTENCE_SCENES[0];

  const scBtn = t.closest("[data-sent-scene]");
  if (scBtn) {
    st.sceneId = scBtn.dataset.sentScene;
    st.who = 0;
    st.action = 0;
    st.where = 0;
    ctx.rerender();
    return true;
  }
  const pickBtn = t.closest("[data-sent-pick]");
  if (pickBtn) {
    const [key, idxStr] = pickBtn.dataset.sentPick.split(":");
    st[key] = Number(idxStr) || 0;
    const tile = scene[key]?.[st[key]];
    if (tile) speak(tile[0], { rate });
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-sent-hear]")) {
    const sent = currentSentence(scene);
    speak(sent.en, { rate, persona: "guide" });
    announce(sent.en);
    return true;
  }
  if (t.closest("[data-sent-print]")) {
    window.print?.();
    return true;
  }
  return false;
}

export const unmount = () => stopSpeech();

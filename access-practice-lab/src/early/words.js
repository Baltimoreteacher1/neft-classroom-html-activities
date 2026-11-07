// Picture word cards (/early/words) for Kindergarten to Grade 3: tap a picture to hear the English word. The Spanish
// word is optional (off by default, one switch), so a family can connect the new word to the one they already know.
// No score; "I can say it" ticks are only a bookmark on this device.
import { BAND_INFO } from "../bands.js";
import { DECKS } from "../content/early.js";

export { DECKS };
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, html, icon, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:early-words";


const load = () => {
  try {
    return JSON.parse(storage.get(KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const save = (s) => storage.set(KEY, JSON.stringify(s));

let deckId = DECKS[0].id;

export function render(ctx, I) {
  const s = load();
  const showEs = Boolean(s.showEs);
  const deck = DECKS.find((d) => d.id === deckId) || DECKS[0];
  const said = new Set(s.said || []);
  const info = BAND_INFO[ctx.band] || {};
  return {
    title: I.S("Picture word cards", "Tarjetas de palabras con dibujos"),
    html: html`<article class="early-words" aria-labelledby="wordsTitle">
      <header class="early-head">
        <p class="eyebrow">
          ${I.T("Picture word cards", "Tarjetas de palabras con dibujos")} ·
          ${I.T(info.label || "", info.labelEs || "")}
        </p>
        <h1 id="wordsTitle" tabindex="-1">${I.T(deck.title[0], deck.title[1])}</h1>
        <p>
          ${I.T("Tap a card to hear the word. Say it back. Tap the star when you can say it.", "Toca una tarjeta para escuchar la palabra. Repítela. Toca la estrella cuando puedas decirla.")}
        </p>
        <p class="early-switch">
          <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
            >${I.T("My practice home", "Mi página de práctica")}</a
          >
          <button type="button" class="btn small" data-words-es aria-pressed="${showEs}">
            ${showEs ? I.T("Spanish word: shown", "Palabra en español: visible") : I.T("Spanish word: hidden", "Palabra en español: oculta")}
          </button>
        </p>
        <div
          class="early-decks"
          role="group"
          aria-label="${I.S("Card decks", "Mazos de tarjetas")}"
        >
          ${DECKS.map((d) => html`<button type="button" class="btn small" data-words-deck="${d.id}" aria-pressed="${d.id === deck.id}">${I.T(d.title[0], d.title[1])}</button>`)}
        </div>
      </header>
      <ul class="early-cards">
        ${deck.cards.map(
          ([en, es, pic]) =>
            html`<li class="early-word ${said.has(en) ? "is-said" : ""}">
              <button
                type="button"
                class="early-card"
                data-words-say="${en}"
                data-words-say-es="${es}"
              >
                <span class="early-emoji" aria-hidden="true">${pic}</span>
                <span class="early-card-en" lang="en">${en}</span>
                ${showEs ? html`<span class="early-card-es" lang="es">${es}</span>` : ""}
              </button>
              <button
                type="button"
                class="early-star"
                data-words-star="${en}"
                aria-pressed="${said.has(en)}"
                aria-label="${I.S(`I can say ${en}`, `Puedo decir ${en}`)}"
              >
                ${icon("star")}
              </button>
            </li>`,
        )}
      </ul>
      <p class="fine early-honest">
        ${I.T(`${deck.cards.filter(([en]) => said.has(en)).length} of ${deck.cards.length} stars in this deck. Stars are your own marks, not a score.`, `${deck.cards.filter(([en]) => said.has(en)).length} de ${deck.cards.length} estrellas en este mazo. Las estrellas son tus marcas, no una calificación.`)}
      </p>
    </article>`,
  };
}

export function onClick(e, ctx, I) {
  const t = e.target;
  const rate = ctx.prefs.rate || 0.85;
  const sayEl = t.closest("[data-words-say]");
  if (sayEl) {
    const s = load();
    const lines = [sayEl.dataset.wordsSay];
    speak(lines, { rate }).then((done) => {
      if (done && s.showEs) speak(sayEl.dataset.wordsSayEs, { lang: "es-US", rate });
    });
    return true;
  }
  const deck = t.closest("[data-words-deck]");
  if (deck) {
    deckId = deck.dataset.wordsDeck;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-words-es]")) {
    const s = load();
    save({ ...s, showEs: !s.showEs });
    ctx.rerender();
    return true;
  }
  const star = t.closest("[data-words-star]");
  if (star) {
    const s = load();
    const said = new Set(s.said || []);
    if (said.has(star.dataset.wordsStar)) said.delete(star.dataset.wordsStar);
    else said.add(star.dataset.wordsStar);
    save({ ...s, said: [...said] });
    ctx.rerender();
    return true;
  }
  return false;
}

export const unmount = () => stopSpeech();

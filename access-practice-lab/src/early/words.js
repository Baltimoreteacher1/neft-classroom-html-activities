// Picture word cards (/early/words) for Kindergarten to Grade 3: tap a picture to hear the English word. The Spanish
// word is optional (off by default, one switch), so a family can connect the new word to the one they already know.
// Includes "Listen & Find" play mode: Pepita says a word from the deck and the child taps the matching picture.
// No score; "I can say it" ticks are only a bookmark on this device.
import { BAND_INFO } from "../bands.js";
import { DECKS } from "../content/early.js";

export { DECKS };
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, announce, html, icon, storage } from "../util.js";

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
let playMode = false;
let findIdx = 0;
let findState = "idle"; // "idle" | "right" | "again"

function findChoices(deck, idx) {
  const target = deck.cards[idx % deck.cards.length];
  const others = deck.cards.filter((c) => c[0] !== target[0]);
  const picks = [target];
  for (let i = 0; i < 3 && others.length; i++) {
    picks.push(others[(idx * 3 + i * 2) % others.length]);
  }
  let seed = [...target[0]].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 13);
  for (let i = picks.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return { target, picks };
}

export function render(ctx, I) {
  const s = load();
  const showEs = Boolean(s.showEs);
  const deck = DECKS.find((d) => d.id === deckId) || DECKS[0];
  const said = new Set(s.said || []);
  const info = BAND_INFO[ctx.band] || {};

  const head = html`<header class="early-head">
    <p class="eyebrow">
      ${I.T("Picture word cards", "Tarjetas de palabras con dibujos")} ·
      ${I.T(info.label || "", info.labelEs || "")}
    </p>
    <h1 id="wordsTitle" tabindex="-1">${I.T(deck.title[0], deck.title[1])}</h1>
    <p>
      ${playMode
        ? I.T(
            "Listen to the word Pepita says, then tap the matching picture card!",
            "Escucha la palabra que dice Pepita y toca la tarjeta con el dibujo correcto.",
          )
        : I.T(
            "Tap a card to hear the word. Say it back. Tap the star when you can say it.",
            "Toca una tarjeta para escuchar la palabra. Repítela. Toca la estrella cuando puedas decirla.",
          )}
    </p>
    <p class="early-switch">
      <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
        >${I.T("My practice home", "Mi página de práctica")}</a
      >
      <button type="button" class="btn small" data-words-es aria-pressed="${showEs}">
        ${showEs
          ? I.T("Spanish word: shown", "Palabra en español: visible")
          : I.T("Spanish word: hidden", "Palabra en español: oculta")}
      </button>
      <button
        type="button"
        class="btn small ${playMode ? "btn-primary" : ""}"
        data-words-play
        aria-pressed="${playMode}"
      >
        ${icon("sparkle")}
        ${playMode
          ? I.T("Listen & Find: on", "Escucha y busca: activado")
          : I.T("Play Listen & Find", "Jugar Escucha y busca")}
      </button>
    </p>
    <div
      class="early-decks"
      role="group"
      aria-label="${I.S("Card decks", "Mazos de tarjetas")}"
    >
      ${DECKS.map(
        (d) => html`<button
          type="button"
          class="btn small"
          data-words-deck="${d.id}"
          aria-pressed="${d.id === deck.id}"
        >
          ${I.T(d.title[0], d.title[1])}
        </button>`,
      )}
    </div>
  </header>`;

  if (playMode) {
    const { target, picks } = findChoices(deck, findIdx);
    return {
      title: I.S("Picture word cards", "Tarjetas de palabras con dibujos"),
      html: html`<article class="early-words" aria-labelledby="wordsTitle">
        ${head}
        <section class="early-ph-board">
          <p class="eyebrow">
            ${I.T(`Card ${(findIdx % deck.cards.length) + 1} of ${deck.cards.length}`, `Tarjeta ${(findIdx % deck.cards.length) + 1} de ${deck.cards.length}`)}
          </p>
          <p class="early-actions">
            <button type="button" class="btn btn-primary early-big" data-words-hear-target>
              ${icon("volume")} ${I.T("Hear the word", "Escuchar la palabra")}
            </button>
          </p>
          <div class="early-rhyme-grid" role="group">
            ${picks.map(
              ([en, es, pic]) => html`<button
                type="button"
                class="early-card early-find-card"
                data-words-find-pick="${en}"
              >
                <span class="early-emoji" aria-hidden="true">${pic}</span>
                <span class="early-card-en" lang="en">${en}</span>
                ${showEs ? html`<span class="early-card-es" lang="es">${es}</span>` : ""}
              </button>`,
            )}
          </div>
          ${findState === "right"
            ? html`<div class="early-feedback is-right" role="status">
                  <p>
                    <strong>${I.T(`Yes! That is ${target[0]}!`, `¡Sí! ¡Eso es ${target[0]}!`)}</strong>
                  </p>
                </div>
                <p class="early-actions">
                  <button type="button" class="btn btn-primary early-big" data-words-find-next>
                    ${I.T("Next picture", "Siguiente dibujo")} ${icon("arrow-right")}
                  </button>
                </p>`
            : findState === "again"
              ? html`<div class="early-feedback is-again" role="status">
                  <p>${I.T("Listen again and tap another picture!", "Escucha otra vez y toca otro dibujo.")}</p>
                </div>`
              : ""}
        </section>
      </article>`,
    };
  }

  return {
    title: I.S("Picture word cards", "Tarjetas de palabras con dibujos"),
    html: html`<article class="early-words" aria-labelledby="wordsTitle">
      ${head}
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
        ${I.T(
          `${deck.cards.filter(([en]) => said.has(en)).length} of ${deck.cards.length} stars in this deck. Stars are your own marks, not a score.`,
          `${deck.cards.filter(([en]) => said.has(en)).length} de ${deck.cards.length} estrellas en este mazo. Las estrellas son tus marcas, no una calificación.`,
        )}
      </p>
    </article>`,
  };
}

export function onClick(e, ctx, I) {
  const t = e.target;
  const rate = ctx.prefs.rate || 0.85;
  const deck = DECKS.find((d) => d.id === deckId) || DECKS[0];

  const sayEl = t.closest("[data-words-say]");
  if (sayEl) {
    const s = load();
    const lines = [sayEl.dataset.wordsSay];
    speak(lines, { rate }).then((done) => {
      if (done && s.showEs) speak(sayEl.dataset.wordsSayEs, { lang: "es-US", rate });
    });
    return true;
  }
  const deckBtn = t.closest("[data-words-deck]");
  if (deckBtn) {
    deckId = deckBtn.dataset.wordsDeck;
    findIdx = 0;
    findState = "idle";
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-words-es]")) {
    const s = load();
    save({ ...s, showEs: !s.showEs });
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-words-play]")) {
    playMode = !playMode;
    findState = "idle";
    ctx.rerender();
    if (playMode) {
      const { target } = findChoices(deck, findIdx);
      speak(target[0], { rate, persona: "guide" });
    }
    return true;
  }
  if (t.closest("[data-words-hear-target]")) {
    const { target } = findChoices(deck, findIdx);
    speak(target[0], { rate, persona: "guide" });
    return true;
  }
  const findPick = t.closest("[data-words-find-pick]");
  if (findPick) {
    const { target } = findChoices(deck, findIdx);
    if (findPick.dataset.wordsFindPick === target[0]) {
      findState = "right";
      const s = load();
      const said = new Set(s.said || []);
      said.add(target[0]);
      save({ ...s, said: [...said] });
      speak(target[0], { rate });
      announce(I.S(`Found ${target[0]}!`, `¡Encontraste ${target[0]}!`));
    } else {
      findState = "again";
      speak(target[0], { rate, persona: "guide" });
      announce(I.S("Try again.", "Inténtalo otra vez."));
    }
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-words-find-next]")) {
    findIdx = (findIdx + 1) % deck.cards.length;
    findState = "idle";
    ctx.rerender();
    const { target } = findChoices(deck, findIdx);
    speak(target[0], { rate, persona: "guide" });
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

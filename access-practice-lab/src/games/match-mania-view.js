// Match Mania view: the board, the guide's reactions, the found-pair panel, level stickers and the recap.
// Pure functions of state (plus support mode). Cards are buttons whose accessible name states what is face up,
// or "face down, card 3 of 8"; the flip is a CSS animation chosen by state.anim, so a reload never replays logic.
import { audioBtn, glossHTML, html, icon, raw } from "./engine.js";
import { C, mascot, stroke, svg } from "./art.js";
import { pic } from "./icons.js";

// Original sticker art, one per level (no coins, chips or dice).
export const STICKERS = {
  star: (b) =>
    `<circle cx="32" cy="32" r="28" fill="${C.gold}" ${stroke(b, 3)}/><path d="M32 12l6 13l14 2l-10 10l3 14l-13 -7l-13 7l3 -14l-10 -10l14 -2Z" fill="#fff" ${stroke(b, 2.4)}/>`,
  book: (b) =>
    `<circle cx="32" cy="32" r="28" fill="${C.tealLt}" ${stroke(b, 3)}/><path d="M12 20q10 -4 20 2v24q-10 -6 -20 -2Z" fill="#fff" ${stroke(b, 2.4)}/><path d="M52 20q-10 -4 -20 2v24q10 -6 20 -2Z" fill="${C.sand}" ${stroke(b, 2.4)}/><path d="M37 28h10M37 34h8" stroke="${C.tealDk}" stroke-width="2.4" stroke-linecap="round"/>`,
  bulb: (b) =>
    `<circle cx="32" cy="32" r="28" fill="${C.coral}" ${stroke(b, 3)}/><path d="M32 12a12 12 0 0 1 7 22v6h-14v-6a12 12 0 0 1 7 -22Z" fill="${C.gold}" ${stroke(b, 2.4)}/><rect x="25" y="42" width="14" height="6" rx="2" fill="#fff" ${stroke(b, 2)}/><path d="M14 18l4 3M50 18l-4 3M12 32h5M52 32h-5" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
};
const sticker = (key, band, label = "", cls = "") =>
  svg("0 0 64 64", STICKERS[key](band), { label, cls: `mm-sticker ${cls}` });
const back = (band) =>
  svg(
    "0 0 64 64",
    `<circle cx="32" cy="32" r="22" fill="${C.tealLt}" opacity=".55"/><path d="M32 16l5 11l12 1.5l-9 8l2.6 12L32 42.5L21.4 48.5L24 36.5l-9 -8l12 -1.5Z" fill="#fff" ${stroke(band, 2)}/>`,
    { cls: "mm-back-art" },
  );
const starRow = (n, I) =>
  html`<span
    class="mm-stars"
    role="img"
    aria-label="${I.S(`${n} of 3 stars`, `${n} de 3 estrellas`)}"
    >${[1, 2, 3].map((k) => html`<svg viewBox="0 0 24 24" class="mm-star${k <= n ? " is-on" : ""}" aria-hidden="true" focusable="false"><path d="M12 2l3 6.5l7 1l-5 5l1.2 7L12 18l-6.2 3.5L7 14.5l-5 -5l7 -1Z" /></svg>`)}</span
  >`;

const lvl = (s) => s.levels[s.lv];
const KIND_LABEL = {
  picture: ["Find each word's picture.", "Busca la imagen de cada palabra."],
  meaning: ["Find each word's meaning.", "Busca el significado de cada palabra."],
  sentence: [
    "Find the sentence each word finishes.",
    "Busca la oración que completa cada palabra.",
  ],
  synonym: [
    "Find each word's synonym, a word that means almost the same.",
    "Busca el sinónimo de cada palabra: una palabra que significa casi lo mismo.",
  ],
  definition: ["Find each word's definition.", "Busca la definición de cada palabra."],
  context: [
    "Find the context sentence each word completes.",
    "Busca la oración de contexto que completa cada palabra.",
  ],
};
/** The English text on a card's face (used for its accessible name). */
const faceText = (L, c) => {
  const pair = L.pairs[c.p];
  if (c.side === "w") return pair.word.en;
  if (L.kind === "picture") return `picture of ${pair.match.en}`;
  return pair.match.en.replace("___", "blank");
};
const blanked = (text) => {
  const [a, b = ""] = String(text).split("___");
  return text.includes("___")
    ? html`${a}<span class="mm-blank" aria-hidden="true">_____</span>${b}`
    : text;
};

function face(L, c, env) {
  const pair = L.pairs[c.p];
  if (c.side === "w")
    return html`<span class="mm-word" lang="en">${pair.word.en}</span
      >${env.sup.gloss === "show" ? html`<span class="mm-es" lang="es">${pair.word.es}</span>` : ""}`;
  if (L.kind === "picture") return html`<span class="mm-pic">${pic(pair.pic, env.band)}</span>`;
  return html`<span class="mm-text" lang="en">${blanked(pair.match.en)}</span>`;
}

function cardHTML(s, L, c, i, env) {
  const I = env.I;
  const n = L.cards.length;
  const found = L.found.includes(c.p);
  const upNow = s.up.includes(i);
  const hinted = s.hint === i;
  const showing = found || upNow || hinted;
  const state = found
    ? "is-found"
    : upNow && s.peek
      ? "is-up is-miss"
      : upNow
        ? "is-up"
        : hinted
          ? "is-hint"
          : "is-down";
  const motion = s.anim?.flip?.includes(i)
    ? " mm-flip"
    : s.anim?.back?.includes(i)
      ? " mm-flipback"
      : "";
  const glow = found && s.anim?.glow === c.p ? " mm-glow" : "";
  const where = I.S(`card ${i + 1} of ${n}`, `tarjeta ${i + 1} de ${n}`);
  const label = found
    ? `${I.S("Matched", "Pareja hallada")}, ${where}: ${faceText(L, c)}`
    : hinted
      ? `${I.S("Hint", "Pista")}, ${where}: ${faceText(L, c)}`
      : showing
        ? `${I.S("Face up", "Boca arriba")}, ${where}: ${faceText(L, c)}`
        : `${I.S("Face down", "Boca abajo")}, ${where}`;
  return html`<li>
    <button
      type="button"
      class="mm-card ${state}${motion}${glow}"
      data-mm-card="${i}"
      aria-label="${label}"
      ${found ? raw(' aria-disabled="true"') : ""}
    >
      <span class="mm-inner"
        >${showing ? html`<span class="mm-face mm-${c.side === "w" ? "w" : L.kind}">${face(L, c, env)}${found ? html`<span class="mm-tick" aria-hidden="true">${icon("check")}</span>` : ""}</span>` : html`<span class="mm-cover">${back(env.band)}<span class="mm-num" aria-hidden="true">${i + 1}</span></span>`}</span
      >
    </button>
  </li>`;
}

/** What the guide says now. `plain` gives a string for the live region. */
export function message(s, env, { plain = false } = {}) {
  const I = env.I;
  const T = plain ? I.S : I.T;
  const L = lvl(s);
  if (s.phase === "cleared")
    return T(
      `Level ${s.lv + 1} cleared! You earned a sticker and ${L.stars} of 3 stars.`,
      `¡Nivel ${s.lv + 1} superado! Ganaste una calcomanía y ${L.stars} de 3 estrellas.`,
    );
  if (s.phase !== "play")
    return T(
      "You matched every pair. Look back at your words.",
      "Encontraste todas las parejas. Repasa tus palabras.",
    );
  const t = s.last?.type;
  if (t === "match") {
    const w = L.pairs[s.last.p].word.en;
    return T(
      `Match! “${w}” found its partner.${s.combo > 1 ? ` That is ${s.combo} in a row!` : ""}`,
      `¡Pareja! “${w}” encontró su compañera.${s.combo > 1 ? ` ¡Llevas ${s.combo} seguidas!` : ""}`,
    );
  }
  if (t === "miss") {
    const name = (c) => (plain || c.side === "w" || L.kind !== "picture" ? faceText(L, c) : I.S("the picture", "la imagen"));
    const [a, b] = [L.cards[s.last.a], L.cards[s.last.b]].map(name);
    if (!plain) return T(`Not a pair: “${a}” and “${b}”. Remember where they are. Tap any card to keep going.`, `No son pareja: “${a}” y “${b}”. Recuerda dónde están. Toca otra tarjeta para seguir.`);
    return T(
      `Not a pair: “${a}” and “${b}”. Remember where they are, then tap any card or flip them back.`,
      `No son pareja: “${a}” y “${b}”. Recuerda dónde están y luego toca otra tarjeta o voltéalas.`,
    );
  }
  if (t === "hint")
    return T(
      `Hint: card ${s.hint + 1} is showing for one tap. Its partner is still face down. Remember where it is!`,
      `Pista: la tarjeta ${s.hint + 1} se muestra hasta tu próximo toque. Su pareja sigue boca abajo. ¡Recuerda dónde está!`,
    );
  if (t === "flip" && s.up.length === 1)
    return T(
      `You turned over “${faceText(L, L.cards[s.up[0]])}”. Now find its partner.`,
      `Volteaste “${faceText(L, L.cards[s.up[0]])}”. Ahora busca su pareja.`,
    );
  const k = KIND_LABEL[L.kind];
  return T(`${k[0]} Tap two cards to flip them.`, `${k[1]} Toca dos tarjetas para voltearlas.`);
}

function foundPanel(s, L, env) {
  if (s.last?.type !== "match") return "";
  const I = env.I;
  const pair = L.pairs[s.last.p];
  const showMatch = L.kind !== "picture" && L.kind !== "sentence" && L.kind !== "context";
  const what = {
    meaning: I.T("means", "significa"),
    synonym: I.T("means about the same as", "significa casi lo mismo que"),
    definition: I.T("means", "significa"),
  }[L.kind];
  return html`<div class="mm-found">
    <div class="mm-found-word">
      <strong lang="en">${pair.word.en}</strong
      >${audioBtn(pair.word.en, I, I.S("Hear the word", "Escuchar la palabra"))}${glossHTML(pair.word.es, env)}
    </div>
    ${showMatch ? html`<p class="mm-found-means">${what} <span lang="en">“${pair.match.en}”</span>${glossHTML(pair.match.es, env)}</p>` : ""}
    <p class="mm-use">
      <span class="mm-use-l">${icon("sparkle")}${I.T("Use it", "Úsala")}</span>
      <span lang="en">${pair.use.en}</span>
    </p>
    <div class="mm-use-row">
      ${audioBtn(pair.use.en, I, I.S("Hear the sentence", "Escuchar la oración"))}${glossHTML(pair.use.es, env)}
    </div>
    <p class="fine">
      ${s.band === "3-5" ? I.T("Say the sentence out loud.", "Di la oración en voz alta.") : I.T("Now say your own sentence with this word.", "Ahora di una oración propia con esta palabra.")}
    </p>
  </div>`;
}

function stickerShelf(s, env) {
  const I = env.I;
  return html`<ol class="mm-shelf" aria-label="${I.S("Stickers", "Calcomanías")}">
    ${s.levels.map((L, n) => {
      const got = L.found.length === L.pairs.length;
      return html`<li
        class="${got ? "is-got" : ""}${n === s.lv && s.phase === "play" ? " is-now" : ""}"
      >
        ${sticker(L.sticker, env.band, got ? I.S(`Level ${n + 1} sticker earned`, `Calcomanía del nivel ${n + 1} ganada`) : I.S(`Level ${n + 1} sticker not yet earned`, `Calcomanía del nivel ${n + 1} sin ganar`))}
      </li>`;
    })}
  </ol>`;
}

function recap(s, env) {
  const I = env.I;
  const total = s.levels.reduce((n, L) => n + L.stars, 0);
  const first = s.levels.reduce(
    (n, L) =>
      n + L.pairs.filter((p) => p.rs.status === "right" && p.rs.tries === 1 && !p.rs.h).length,
    0,
  );
  const pairs = s.levels.reduce((n, L) => n + L.pairs.length, 0);
  return html`<div class="mm-recap">
    <h2>${I.T("Words you matched", "Palabras que uniste")}</h2>
    <p class="mm-total">
      ${I.T(`${total} of ${s.levels.length * 3} stars · ${first} of ${pairs} pairs on the first try`, `${total} de ${s.levels.length * 3} estrellas · ${first} de ${pairs} parejas al primer intento`)}
    </p>
    ${s.levels.map(
      (L, n) =>
        html`<section
          class="mm-recap-l"
          aria-label="${I.S(`Level ${n + 1}: ${L.title.en}`, `Nivel ${n + 1}: ${L.title.es}`)}"
        >
          <h3>
            ${sticker(L.sticker, env.band)}${I.T(L.title.en, L.title.es)} ${starRow(L.stars, I)}
          </h3>
          <ul>
            ${L.pairs.map(
              (p) =>
                html`<li>
                  <span class="mm-recap-w"
                    ><strong lang="en">${p.word.en}</strong
                    >${audioBtn(p.word.en, I, I.S(`Hear ${p.word.en}`, `Escuchar ${p.word.en}`))}${glossHTML(p.word.es, env)}</span
                  >
                  <span class="mm-recap-u" lang="en">${p.use.en}</span>
                </li>`,
            )}
          </ul>
        </section>`,
    )}
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-mm-finish>
        ${icon("check")}${I.T("Finish", "Terminar")}
      </button>
    </div>
  </div>`;
}

export function view(s, env) {
  const I = env.I;
  const L = lvl(s);
  const guide = s.band === "6-8" ? "juno" : "pip";
  const mood =
    s.phase !== "play" || s.last?.type === "match"
      ? "cheer"
      : s.last?.type === "miss"
        ? "think"
        : "hi";
  const firstTry = L.pairs.filter(
    (p) => L.found.includes(L.pairs.indexOf(p)) && p.rs.tries === 1 && !p.rs.h,
  ).length;
  const head = html`<header class="mm-head">
    <p class="mm-level">
      ${I.T(`Level ${s.lv + 1} of ${s.levels.length}`, `Nivel ${s.lv + 1} de ${s.levels.length}`)} ·
      <strong>${I.T(L.title.en, L.title.es)}</strong>
    </p>
    ${stickerShelf(s, env)}
  </header>`;
  const bubble = html`<div class="mm-guide${s.last?.type === "match" ? " is-cheer" : ""}">
    <div class="mm-mascot">${mascot(guide, s.band, mood, 76)}</div>
    <p class="mm-bubble">${message(s, env)}</p>
  </div>`;
  if (s.phase === "recap" || s.phase === "finished")
    return html`<section class="cg-station mm" data-mechanic="memory-pairs">
      ${head}${bubble}${recap(s, env)}
    </section>`;
  const counts = html`<ul class="mm-counts" aria-label="${I.S("Score", "Puntaje")}">
    <li>${I.T("Moves", "Jugadas")} <strong>${L.moves}</strong></li>
    <li>${I.T("First-try pairs", "Parejas al primer intento")} <strong>${firstTry}</strong></li>
    <li>${I.T("Hints", "Pistas")} <strong>${L.hints}</strong></li>
    ${s.combo > 1 ? html`<li class="mm-combo">${icon("sparkle")}${I.T(`${s.combo} in a row`, `${s.combo} seguidas`)}</li>` : ""}
  </ul>`;
  if (s.phase === "cleared") {
    const more = s.lv + 1 < s.levels.length;
    return html`<section class="cg-station mm" data-mechanic="memory-pairs">
      ${head}${bubble}
      <div class="mm-cleared">
        ${sticker(L.sticker, env.band, I.S("New sticker", "Calcomanía nueva"), "is-new")}
        <h2>${I.T("Level cleared!", "¡Nivel superado!")}</h2>
        ${starRow(L.stars, I)}
        <p>
          ${I.T(`You found ${L.pairs.length} pairs in ${L.moves} moves. ${firstTry} matched on the first try. Hints used: ${L.hints}.`, `Encontraste ${L.pairs.length} parejas en ${L.moves} jugadas. ${firstTry} al primer intento. Pistas usadas: ${L.hints}.`)}
        </p>
        ${foundPanel(s, L, env)}
        <div class="gs-actions">
          <button type="button" class="btn btn-primary btn-big" data-mm-next>
            ${icon("arrow-right")}${more ? I.T("Next level", "Siguiente nivel") : I.T("See my words", "Ver mis palabras")}
          </button>
        </div>
      </div>
    </section>`;
  }
  const textual = L.kind !== "picture" && L.kind !== "synonym";
  const canHint = L.pairs.some((p, n) => !L.found.includes(n) && p.rs.h < env.sup.hints);
  return html`<section
    class="cg-station mm mm-${env.band === "6-8" ? "journal" : "storybook"}"
    data-mechanic="memory-pairs"
  >
    ${head}${bubble}${counts}
    <ul
      class="mm-grid${textual ? " is-text" : ""}"
      style="--mm-cols:${L.cols}"
      aria-label="${I.S(`${L.cards.length} cards, ${L.found.length} of ${L.pairs.length} pairs found`, `${L.cards.length} tarjetas, ${L.found.length} de ${L.pairs.length} parejas halladas`)}"
    >
      ${L.cards.map((c, i) => cardHTML(s, L, c, i, env))}
    </ul>
    <div class="mm-tools">
      ${s.peek ? html`<button type="button" class="btn" data-mm-hide>${icon("arrow-right")}${I.T("Flip them back", "Voltearlas otra vez")}</button>` : ""}
      ${canHint ? html`<button type="button" class="btn small" data-g-hint>${icon("sparkle")}${I.T("Show me a hint", "Muéstrame una pista")}</button>` : ""}
    </div>
    ${foundPanel(s, L, env)}
  </section>`;
}

/** Keep keyboard focus on the card just used (the whole stage re-renders after each tap). */
export function focusAfter(root, s) {
  if (
    typeof document === "undefined" ||
    (document.activeElement && document.activeElement !== document.body)
  )
    return;
  const target =
    s.phase === "cleared"
      ? root.querySelector("[data-mm-next]")
      : s.phase === "recap"
        ? root.querySelector("[data-mm-finish]")
        : s.fx != null
          ? root.querySelector(`[data-mm-card="${s.fx}"]`)
          : null;
  target?.focus({ preventScroll: true });
}

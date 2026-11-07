// Drawing for the Reading Ladder reading tools (src/ladder-tools.js) and the placement staircase
// (src/ladder-placement.js). The ladder view owns state and calls these.
import { LADDER_STEPS } from "../ladder.js";
import { knownIn, LEVELS, lookup, wordKey, wordsOf } from "../ladder-tools.js";
import { BASE, html, icon } from "../util.js";

const LEVEL_TEXT = {
  easier: ["Easier", "Más fácil"],
  on: ["On level", "Al nivel"],
  richer: ["More detail", "Más detalle"],
};

export function levelSwitchHTML(I, level) {
  return html`<div
    class="ld-levels"
    role="group"
    aria-label="${I.S("Version of this text", "Versión de este texto")}"
  >
    ${LEVELS.map((l) => html`<button type="button" class="cat-chip ${l === level ? "is-active" : ""}" data-ld-level="${l}" aria-pressed="${String(l === level)}">${I.T(...LEVEL_TEXT[l])}</button>`)}
  </div>`;
}

/** The passage with every word tappable. Spans are not focusable; the word list below gives keyboard access. */
export function tappableTextHTML(text, known) {
  const set = new Set(known);
  const parts = [];
  let at = 0;
  for (const w of wordsOf(text)) {
    parts.push(html`${text.slice(at, w.start)}`);
    parts.push(
      html`<span class="lw ${set.has(wordKey(w.word)) ? "is-known" : ""}" data-lw="${w.word}"
        >${w.word}</span
      >`,
    );
    at = w.end;
  }
  parts.push(html`${text.slice(at)}`);
  return parts;
}

export function wordListHTML(I, text) {
  const words = [...new Map(wordsOf(text).map((w) => [wordKey(w.word), w.word])).values()].filter(
    (w) => w.length > 2,
  );
  return html`<details class="gloss-list ld-wordlist">
    <summary>
      ${I.T(`Word list · ${words.length} words`, `Lista de palabras · ${words.length} palabras`)}
    </summary>
    <ul>
      ${words.map((w) => html`<li><button type="button" class="gloss-chip" data-lw="${w}">${w}</button></li>`)}
    </ul>
  </details>`;
}

export function wordCardHTML(I, word, glossary, known) {
  if (!word) return html`<div id="lwCard" class="ld-wordcard" aria-live="polite"></div>`;
  const entry = lookup(glossary, word);
  const isKnown = known.includes(wordKey(word));
  return html`<div id="lwCard" class="ld-wordcard panel" aria-live="polite">
    <p class="ld-word">
      <button
        type="button"
        class="say-word"
        data-say="${word}"
        aria-label="${I.S(`Say ${word}`, `Escuchar ${word}`)}"
      >
        ${icon("volume")}
      </button>
      <strong lang="en">${word}</strong>
    </p>
    ${
      entry
        ? html`<p lang="en">${entry.def}</p>
            ${entry.es ? html`<p lang="es"><button type="button" class="say-word" data-say-es="${entry.es}" aria-label="Escuchar ${entry.es}">${icon("volume")}</button> <strong>${entry.es}</strong>${entry.esDef ? html`: ${entry.esDef}` : ""}</p>` : ""}`
        : html`<p class="fine">
            ${I.T("This word is not in our word list yet. Ask a partner or look at the words around it.", "Esta palabra todavía no está en nuestra lista. Pregunta a un compañero o mira las palabras de alrededor.")}
          </p>`
    }
    <button
      type="button"
      class="btn small ${isKnown ? "is-active" : ""}"
      data-lw-known="${word}"
      aria-pressed="${String(isKnown)}"
    >
      ${icon(isKnown ? "check" : "star")} ${I.T("I know this word", "Conozco esta palabra")}
    </button>
  </div>`;
}

export function knownCountHTML(I, text, known) {
  const here = knownIn(text, known);
  return html`<p class="ld-known" data-ld-known-count>
    ${icon("words")}
    ${I.T(`Words I know: ${known.length}`, `Palabras que conozco: ${known.length}`)}
    <span class="fine"
      >·
      ${I.T(`${here.known} of ${here.total} in this text`, `${here.known} de ${here.total} en este texto`)}</span
    >
  </p>`;
}

/** The Spanish parallel version: only when a teacher turned it on; never the questions. */
export function spanishParallelHTML(I, es, open) {
  if (!es) return "";
  return html`<details class="ld-spanish" data-ld-spanish ${open ? "open" : ""}>
    <summary>
      ${icon("language")} ${I.T("Spanish version of the text", "Versión en español del texto")}
    </summary>
    <p class="fine">
      ${I.T("Your teacher turned this on. The questions stay in English.", "Tu docente activó esto. Las preguntas siguen en inglés.")}
    </p>
    <p class="gm-text" lang="es">${es}</p>
  </details>`;
}

export function placementIntroHTML(I) {
  return html`<section class="panel ld-placement" aria-labelledby="ldPlace">
    <h2 id="ldPlace">${I.T("Find my starting step", "Encontrar mi peldaño inicial")}</h2>
    <p class="fine">
      ${I.T(
        "Read up to five short texts on your own. The steps move up or down after each one, and you finish on your practice step. Do it alone: help from someone else makes the starting step wrong.",
        "Lee hasta cinco textos cortos por tu cuenta. Los peldaños suben o bajan después de cada uno y terminas en tu peldaño de práctica. Hazlo solo o sola: la ayuda de otra persona hace que el peldaño inicial no sea el correcto.",
      )}
    </p>
    <button type="button" class="btn" data-ld-place-start>${I.T("Start", "Empezar")}</button>
  </section>`;
}

export function placementBannerHTML(I, placement) {
  return html`<p class="feedback is-hint ld-placement-banner" role="status">
    ${icon("flag")}
    ${I.T(`Finding your starting step · text ${placement.probes.length + 1} of up to 5 · no help in this part`, `Buscando tu peldaño inicial · texto ${placement.probes.length + 1} de hasta 5 · sin ayuda en esta parte`)}
  </p>`;
}

export function placementResultHTML(I, placement, band) {
  return html`<section class="feedback is-right" role="status" tabindex="-1">
    <p class="fb-title">
      ${icon("check")}
      ${I.T(`Your practice step: ${placement.result} of ${LADDER_STEPS}`, `Tu peldaño de práctica: ${placement.result} de ${LADDER_STEPS}`)}
    </p>
    <p>
      ${I.T("The ladder now starts here. This is a practice step on this device, not a reading level, a Lexile measure or a WIDA level.", "La escalera ahora empieza aquí. Es un peldaño de práctica en este dispositivo, no un nivel de lectura, una medida Lexile ni un nivel de WIDA.")}
    </p>
    <div class="gm-actions">
      <button class="btn btn-primary" type="button" data-ld-next>
        ${I.T("Start practicing", "Empezar a practicar")} ${icon("arrow-right")}</button
      ><a class="btn" href="${BASE}/reading-room?grades=${band}"
        >${I.T("Open the Reading Room", "Abrir la sala de lectura")}</a
      >
    </div>
  </section>`;
}

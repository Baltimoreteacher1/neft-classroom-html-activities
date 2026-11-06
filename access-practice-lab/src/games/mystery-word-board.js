// Mystery Word helpers: letter scoring, the guess board, the on-screen keyboard, stickers and the QA step planner.
// Kept pure (no DOM, no env side effects) so the module's view stays a function of state.
import { html, raw } from "./engine.js";

export const MAX_GUESSES = 6;
export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const RANK = { x: 1, y: 2, g: 3 };

/** Standard letter feedback with repeated letters handled: greens first, then golds from what is left. */
export function score(guess, answer) {
  const out = Array(guess.length).fill("x");
  const left = {};
  for (let i = 0; i < answer.length; i += 1) {
    if (guess[i] === answer[i]) out[i] = "g";
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i += 1) {
    if (out[i] === "g" || !left[guess[i]]) continue;
    out[i] = "y";
    left[guess[i]] -= 1;
  }
  return out;
}

/** Best feedback seen so far for each letter (green beats gold beats gray). */
export function keyStates(guesses, answer) {
  const best = {};
  for (const g of guesses)
    score(g, answer).forEach((m, i) => {
      if (!best[g[i]] || RANK[m] > RANK[best[g[i]]]) best[g[i]] = m;
    });
  return best;
}

/** Words the game accepts for a round: the band's authored list for that length plus every round answer. */
export function allowedFor(band, len) {
  const set = new Set(
    String(band.allowed?.[len] || "")
      .split(/\s+/)
      .filter(Boolean),
  );
  (band.words || []).forEach((w) => {
    if (w.word.length === len) set.add(w.word);
  });
  return set;
}

/** Stars come from guesses used and hints opened. Never from speed. */
export function starsOf(guesses, hints) {
  let n = 3;
  if (guesses >= 4) n -= 1;
  if (guesses >= 6) n -= 1;
  if (hints >= 2) n -= 1;
  return Math.max(1, n);
}

const GLYPH = {
  g: '<path d="M3 8.5l3 3l7 -7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  y: '<path d="M2 8h12M5 5l-3 3l3 3M11 5l3 3l-3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M4 8h8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
};
export const glyph = (m) =>
  raw(
    `<svg class="mw-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${GLYPH[m]}</svg>`,
  );

export function markText(m, I) {
  return {
    g: I.S("in the right spot", "en el lugar correcto"),
    y: I.S("in the word but in another spot", "está en la palabra, pero en otro lugar"),
    x: I.S("not in the word", "no está en la palabra"),
  }[m];
}

/** The six-row board. The newest scored row flips once (CSS, off under reduced motion). */
export function boardHTML(r, I) {
  const len = r.word.length;
  const rows = Array.from({ length: MAX_GUESSES }, (_, gi) => {
    const g = r.guesses[gi];
    const typing = gi === r.guesses.length && r.rs.status !== "right" && r.rs.status !== "revealed";
    if (g) {
      const marks = score(g, r.word);
      const fresh = r.fresh && gi === r.guesses.length - 1;
      const tiles = [...g].map(
        (c, i) =>
          html`<li
            class="mw-tile is-${marks[i]}"
            style="--d:${i}"
            role="img"
            aria-label="${I.S(`Letter ${i + 1}, ${c}, ${markText(marks[i], I)}`, `Letra ${i + 1}, ${c}, ${markText(marks[i], I)}`)}"
          >
            <span class="mw-ch" aria-hidden="true">${c}</span>${glyph(marks[i])}
          </li>`,
      );
      return html`<li class="mw-row${fresh ? " is-fresh" : ""}">
        <ol
          class="mw-tiles"
          aria-label="${I.S(`Guess ${gi + 1}: ${g}`, `Intento ${gi + 1}: ${g}`)}"
          style="--n:${len}"
        >
          ${tiles}
        </ol>
      </li>`;
    }
    const cur = typing ? r.cur : "";
    const tiles = Array.from(
      { length: len },
      (_, i) =>
        html`<li
          class="mw-tile${cur[i] ? " is-typed" : ""}${typing && i === cur.length ? " is-next" : ""}"
        >
          <span class="mw-ch">${cur[i] || ""}</span>
        </li>`,
    );
    const label = typing
      ? I.S(
          `Guess ${gi + 1}, typing: ${cur || "empty"}`,
          `Intento ${gi + 1}, escribiendo: ${cur || "vacío"}`,
        )
      : I.S(`Guess ${gi + 1}, empty`, `Intento ${gi + 1}, vacío`);
    return html`<li class="mw-row${typing ? " is-now" : ""}${typing && r.shake ? " is-shake" : ""}">
      <ol class="mw-tiles" aria-label="${label}" style="--n:${len}">
        ${tiles}
      </ol>
    </li>`;
  });
  return html`<ol
    class="mw-board"
    aria-label="${I.S("Guess board, six rows", "Tablero de intentos, seis filas")}"
  >
    ${rows}
  </ol>`;
}

/** ABC keyboard: easier than QWERTY for young newcomers, and six columns keep 48px keys at phone width. */
export function keyboardHTML(r, I) {
  const states = keyStates(r.guesses, r.word);
  const keys = LETTERS.map((c) => {
    const m = states[c];
    const label = m ? `${c}, ${markText(m, I)}` : c;
    return html`<button
      type="button"
      class="mw-key${m ? ` is-${m}` : ""}"
      data-g-k="${c}"
      aria-label="${label}"
    >
      ${c}${m ? glyph(m) : ""}
    </button>`;
  });
  return html`<div
    class="mw-keys"
    role="group"
    aria-label="${I.S("Letter keyboard", "Teclado de letras")}"
  >
    ${keys}
    <button
      type="button"
      class="mw-key is-wide"
      data-g-k="back"
      aria-label="${I.S("Delete last letter", "Borrar la última letra")}"
    >
      <span aria-hidden="true">⌫</span> ${I.T("Delete", "Borrar")}
    </button>
    <button type="button" class="mw-key is-wide is-enter" data-g-k="enter">
      ${I.T("Enter", "Enter")}
    </button>
  </div>`;
}

export const legendHTML = (I) =>
  html`<ul
    class="mw-legend"
    aria-label="${I.S("What the tiles mean", "Qué significan las fichas")}"
  >
    <li>
      <span class="mw-chip is-g">${glyph("g")}</span
      >${I.T("Right letter, right spot", "Letra correcta, lugar correcto")}
    </li>
    <li>
      <span class="mw-chip is-y">${glyph("y")}</span
      >${I.T("In the word, another spot", "En la palabra, otro lugar")}
    </li>
    <li>
      <span class="mw-chip is-x">${glyph("x")}</span
      >${I.T("Not in the word", "No está en la palabra")}
    </li>
  </ul>`;

const STAR = "M12 2l3 6.5l7 .8l-5.2 4.8l1.4 7L12 17.6L5.8 21l1.4 -7L2 9.3l7 -.8Z";
export const starsHTML = (n, I) =>
  html`<span
    class="mw-stars"
    role="img"
    aria-label="${I.S(`${n} of 3 stars`, `${n} de 3 estrellas`)}"
    >${[1, 2, 3].map((k) => raw(`<svg viewBox="0 0 24 24" aria-hidden="true" class="${k <= n ? "is-on" : ""}"><path d="${STAR}"/></svg>`))}</span
  >`;

/** One sticker per case: a gold seal when cracked, a teal "learned" seal when revealed, an empty slot ahead. */
export function stickersHTML(s, I) {
  return html`<ul class="mw-stickers" aria-label="${I.S("Case stickers", "Calcomanías de casos")}">
    ${s.rounds.map((r, i) => {
      const st =
        r.rs.status === "right"
          ? "is-won"
          : r.rs.status === "revealed"
            ? "is-learned"
            : i === s.i
              ? "is-now"
              : "";
      const label =
        r.rs.status === "right"
          ? I.S(
              `Case ${i + 1}: ${r.word}, cracked, ${r.stars} stars`,
              `Caso ${i + 1}: ${r.word}, descubierto, ${r.stars} estrellas`,
            )
          : r.rs.status === "revealed"
            ? I.S(`Case ${i + 1}: ${r.word}, learned`, `Caso ${i + 1}: ${r.word}, aprendido`)
            : I.S(`Case ${i + 1}: not solved yet`, `Caso ${i + 1}: sin resolver`);
      const face =
        r.rs.status === "right"
          ? `<path d="${STAR}" transform="translate(8 8)"/>`
          : r.rs.status === "revealed"
            ? '<path d="M12 14h16v14H12zM20 14v14" fill="none" stroke="currentColor" stroke-width="2.4"/>'
            : `<text x="20" y="26" text-anchor="middle" font-size="15" font-weight="800">${i + 1}</text>`;
      return html`<li class="mw-sticker ${st}" role="img" aria-label="${label}">
        ${raw(`<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/>${face}</svg>`)}
      </li>`;
    })}
  </ul>`;
}

// ── QA planner ───────────────────────────────────────────────────────────────────────────
/** One step toward the answer (wrong=false) or toward a real, allowed wrong guess (wrong=true). */
export function nextStep(r, allowed, wrong) {
  const { cur, word } = r;
  const len = word.length;
  const tried = new Set(r.guesses);
  const key = (k) => [{ click: `[data-g-k="${k}"]` }];
  const decoys = [...allowed]
    .filter((w) => w !== word && !tried.has(w))
    .sort((a, b) => (a[0] === word[0]) - (b[0] === word[0]) || a.localeCompare(b));
  const fits = (w) => w.startsWith(cur);
  if (cur.length === len) {
    const good = allowed.has(cur) && !tried.has(cur);
    return key(good ? "enter" : "back");
  }
  if (wrong) {
    // A wrong run starts every row with a real decoy word; a row already heading for the answer is left alone.
    const d = decoys.find(fits);
    if (d && (!cur || !word.startsWith(cur))) return key(d[cur.length]);
    if (!word.startsWith(cur)) return key("back");
  }
  if (word.startsWith(cur)) return key(word[cur.length]);
  const started = decoys.find(fits);
  return started ? key(started[cur.length]) : key("back");
}

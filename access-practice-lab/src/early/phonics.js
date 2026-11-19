// Sound Builder (/early/phonics): a phonics game for Kindergarten to Grade 3. The device says a word and then each of
// its sounds; the child builds the word from sound tiles, left to right. Every finished word grows one plant in the
// child's garden; a full garden (every word in the set) wins the round.
// Supports multiple themed gardens per band (Starter Words, Nature, Science, Blends & Digraphs).
// House rules: no timer, no luck, no points lost. A wrong tile goes back and the sound for that box is said again;
// no tile is ever taken away, and the word is never filled in for the child.
import { BAND_INFO } from "../bands.js";
import { GARDEN, PHONICS_ROUNDS, SETS } from "../content/early.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, announce, html, icon, raw, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:early-phonics";

export { SETS };

/**
 * How each sound tile is said. Isolated sounds are said the way teachers stretch or tap them, plus a key word, so a
 * text-to-speech voice cannot turn a letter into its letter name.
 */
export const SOUNDS = {
  a: ["a, as in apple", "a"],
  e: ["e, as in egg", "e"],
  i: ["i, as in itch", "i"],
  o: ["o, as in octopus", "o"],
  u: ["u, as in up", "u"],
  b: ["buh", "b"],
  c: ["kuh", "c"],
  d: ["duh", "d"],
  f: ["fff", "f"],
  g: ["guh", "g"],
  h: ["huh", "h"],
  j: ["juh", "j"],
  k: ["kuh", "k"],
  l: ["lll", "l"],
  m: ["mmm", "m"],
  n: ["nnn", "n"],
  p: ["puh", "p"],
  r: ["rrr", "r"],
  s: ["sss", "s"],
  t: ["tuh", "t"],
  v: ["vvv", "v"],
  w: ["wuh", "w"],
  x: ["ks, as in fox", "x"],
  z: ["zzz", "z"],
  sh: ["shhh, as in ship", "sh"],
  ch: ["chuh, as in chin", "ch"],
  th: ["th, as in thumb", "th"],
  ck: ["kuh", "ck"],
  wh: ["whuh, as in whale", "wh"],
  ng: ["ng, as in ring", "ng"],
};

/** Tiles offered for a word: its own sounds plus distractors, in a fixed order that never spells the word. */
export function tilesFor(word, sounds) {
  const pool = ["a", "e", "i", "o", "u", "m", "s", "t", "b", "d", "sh", "ch", "r", "l"];
  const extras = pool
    .filter((s) => !sounds.includes(s))
    .filter((_, i) => (i + word.length) % 4 === 0)
    .slice(0, 3);
  const all = [
    ...sounds.map((s, i) => ({ id: `w${i}`, s })),
    ...extras.map((s, i) => ({ id: `x${i}`, s })),
  ];
  let seed = [...word].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 11);
  for (let i = all.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  if (all.slice(0, sounds.length).every((t, i) => t.s === sounds[i])) all.push(all.shift());
  return all;
}

/** Place a tile in the next empty box. Returns { ok, placed } — a wrong tile is not placed and nothing is lost. */
export function place(sounds, placed, tile) {
  const at = placed.length;
  if (at >= sounds.length) return { ok: false, placed };
  if (tile.s !== sounds[at]) return { ok: false, placed };
  return { ok: true, placed: [...placed, tile.id] };
}

const loadState = () => {
  try {
    return JSON.parse(storage.get(KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const saveState = (s) => storage.set(KEY, JSON.stringify(s));

let g = { band: "", roundIdx: 0, i: 0, placed: [], miss: null, won: false };

const roundsFor = (band) => PHONICS_ROUNDS[band] || PHONICS_ROUNDS.K;
const currentRound = (band) => {
  const rounds = roundsFor(band);
  return rounds[g.roundIdx % rounds.length] || rounds[0];
};
const roundKey = (band, roundIdx) => (roundIdx === 0 ? band : `${band}:${roundIdx}`);
const setFor = (band) => currentRound(band).words;

function syncBand(band) {
  if (g.band === band) return;
  const rounds = roundsFor(band);
  const roundIdx = 0;
  const done = loadState()[roundKey(band, roundIdx)]?.done || [];
  const set = rounds[roundIdx].words;
  const next = set.findIndex(([w]) => !done.includes(w));
  g = { band, roundIdx, i: next < 0 ? 0 : next, placed: [], miss: null, won: next < 0 };
}

function gardenHTML(set, done, I) {
  return html`<ol
    class="early-garden"
    aria-label="${I.S(`Garden: ${done.length} of ${set.length} plants grown`, `Huerto: ${done.length} de ${set.length} plantas crecidas`)}"
  >
    ${set.map(
      ([w, , pic]) =>
        html`<li class="${done.includes(w) ? "is-grown" : ""}">
          <span aria-hidden="true">${done.includes(w) ? GARDEN.grown : GARDEN.empty}</span
          ><span class="visually-hidden"
            >${done.includes(w) ? I.S(`${w}: grown`, `${w}: creció`) : I.S("not yet", "todavía no")}</span
          >${done.includes(w) ? html`<small aria-hidden="true">${pic}</small>` : ""}
        </li>`,
    )}
  </ol>`;
}

export function render(ctx, I) {
  syncBand(ctx.band);
  const rounds = roundsFor(ctx.band);
  const round = currentRound(ctx.band);
  const set = round.words;
  const done = loadState()[roundKey(ctx.band, g.roundIdx)]?.done || [];
  const info = BAND_INFO[ctx.band] || {};
  const head = html`<header class="early-head">
    <p class="eyebrow">
      ${I.T("Phonics game", "Juego de fonética")} · ${I.T(info.label || "", info.labelEs || "")}
    </p>
    <h1 id="phonicsTitle" tabindex="-1">${I.T("Sound Builder", "Construye con sonidos")}</h1>
    <p>
      ${I.T(
        "Hear the word and its sounds. Tap the tiles in order to build it. Every word you build grows a plant. Fill the garden to win.",
        "Escucha la palabra y sus sonidos. Toca las fichas en orden para formarla. Cada palabra que formas hace crecer una planta. Llena el huerto para ganar.",
      )}
    </p>
    <p class="early-switch">
      <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
        >${I.T("My practice home", "Mi página de práctica")}</a
      >
    </p>
    <div class="early-decks" role="group" aria-label="${I.S("Gardens", "Huertos")}">
      ${rounds.map(
        (r, idx) => html`<button
          type="button"
          class="btn small"
          data-ph-round="${idx}"
          aria-pressed="${idx === g.roundIdx}"
        >
          ${I.T(r.title[0], r.title[1])}
        </button>`,
      )}
    </div>
  </header>`;

  if (g.won)
    return {
      title: I.S("Sound Builder", "Construye con sonidos"),
      html: html`<article class="early-phonics">
        ${head}${gardenHTML(set, done, I)}
        <section class="early-feedback is-right" role="status">
          <p>
            <strong>${I.T("You grew the whole garden!", "¡Hiciste crecer todo el huerto!")}</strong>
            ${I.T(`You built all ${set.length} words.`, `Formaste las ${set.length} palabras.`)}
          </p>
        </section>
        <p class="early-actions">
          <button type="button" class="btn btn-primary early-big" data-ph-again>
            ${I.T("Plant a new garden", "Sembrar un huerto nuevo")}
          </button>
        </p>
      </article>`,
    };

  const [word, sounds, pic] = set[g.i];
  const tiles = tilesFor(word, sounds);
  const byId = Object.fromEntries(tiles.map((t) => [t.id, t]));
  const complete = g.placed.length === sounds.length;
  return {
    title: I.S("Sound Builder", "Construye con sonidos"),
    html: html`<article class="early-phonics" data-phonics="${word}">
      ${head} ${gardenHTML(set, done, I)}
      <section class="early-ph-board" aria-labelledby="phWordTitle">
        <h2 id="phWordTitle" class="visually-hidden">
          ${I.T(`Word ${g.i + 1} of ${set.length}`, `Palabra ${g.i + 1} de ${set.length}`)}
        </h2>
        <p class="early-ph-pic" aria-hidden="true">${pic}</p>
        <p class="early-actions">
          <button type="button" class="btn btn-primary early-big" data-ph-hear>
            ${icon("volume")}
            ${I.T("Hear the word and its sounds", "Escuchar la palabra y sus sonidos")}
          </button>
        </p>
        <ol class="early-ph-slots" aria-label="${I.S("Sound boxes", "Cajas de sonidos")}">
          ${sounds.map((s, i) => {
            const tile = byId[g.placed[i]];
            return html`<li
              class="${tile ? "is-filled" : ""} ${i === g.placed.length ? "is-next" : ""}"
            >
              ${tile
                ? html`<span class="early-ph-letter">${tile.s}</span>`
                : html`<button
                    type="button"
                    class="early-hear"
                    data-ph-sound="${i}"
                    aria-label="${I.S(`Hear sound ${i + 1}`, `Escuchar el sonido ${i + 1}`)}"
                  >
                    ${icon("volume")}
                  </button>`}
            </li>`;
          })}
        </ol>
        <div
          class="early-ph-tiles"
          role="group"
          aria-label="${I.S("Sound tiles", "Fichas de sonidos")}"
        >
          ${tiles.map(
            (t) =>
              html`<button
                type="button"
                class="early-ph-tile"
                data-ph-tile="${t.id}"
                ${g.placed.includes(t.id) || complete ? raw("disabled") : ""}
              >
                ${t.s}
              </button>`,
          )}
        </div>
        ${g.miss != null
          ? html`<div class="early-feedback is-again" role="status">
              <p>
                ${I.T(
                  "Not that one. Listen to the sound for this box and try again.",
                  "Esa no. Escucha el sonido de esta caja y vuelve a intentarlo.",
                )}
              </p>
            </div>`
          : ""}
        ${complete
          ? html`<div class="early-feedback is-right" role="status">
                <p>
                  <strong>${I.T(`You built ${word}!`, `¡Formaste ${word}!`)}</strong>
                  ${I.T("A new plant is growing.", "Está creciendo una planta nueva.")}
                </p>
              </div>
              <p class="early-actions">
                <button type="button" class="btn btn-primary early-big" data-ph-next>
                  ${I.T("Next word", "Siguiente palabra")} ${icon("arrow-right")}
                </button>
              </p>`
          : ""}
      </section>
      <p class="fine early-honest">
        ${I.T(
          "No timer and no points to lose. Tap a speaker any time to hear a sound again.",
          "Sin reloj y sin puntos que perder. Toca una bocina cuando quieras para escuchar un sonido otra vez.",
        )}
      </p>
    </article>`,
  };
}

const soundLine = (s) => (SOUNDS[s] ? SOUNDS[s][0] : s);
const sayWord = (word, sounds, prefs) =>
  speak([word, ...sounds.map(soundLine), word], {
    rate: prefs.rate || 0.8,
    persona: "guide",
  });

export function onClick(e, ctx, I) {
  const t = e.target;
  const set = setFor(ctx.band);
  const [word, sounds] = set[g.i] || [];
  const rKey = roundKey(ctx.band, g.roundIdx);

  const roundBtn = t.closest("[data-ph-round]");
  if (roundBtn) {
    const idx = Number(roundBtn.dataset.phRound) || 0;
    const nextKey = roundKey(ctx.band, idx);
    const done = loadState()[nextKey]?.done || [];
    const nextSet = roundsFor(ctx.band)[idx]?.words || set;
    const next = nextSet.findIndex(([w]) => !done.includes(w));
    g = { band: ctx.band, roundIdx: idx, i: next < 0 ? 0 : next, placed: [], miss: null, won: next < 0 };
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-ph-hear]")) {
    sayWord(word, sounds, ctx.prefs);
    return true;
  }
  const one = t.closest("[data-ph-sound]");
  if (one) {
    speak(soundLine(sounds[Number(one.dataset.phSound)]), { rate: ctx.prefs.rate || 0.8 });
    return true;
  }
  const tileEl = t.closest("[data-ph-tile]");
  if (tileEl) {
    const tile = tilesFor(word, sounds).find((x) => x.id === tileEl.dataset.phTile);
    const r = place(sounds, g.placed, tile);
    if (r.ok) {
      g.placed = r.placed;
      g.miss = null;
      if (g.placed.length === sounds.length) {
        const s = loadState();
        const done = new Set(s[rKey]?.done || []);
        done.add(word);
        saveState({ ...s, [rKey]: { done: [...done] } });
        speak(word, { rate: ctx.prefs.rate || 0.8 });
        announce(I.S(`You built ${word}!`, `¡Formaste ${word}!`));
      } else speak(soundLine(tile.s), { rate: ctx.prefs.rate || 0.8 });
    } else {
      g.miss = g.placed.length;
      speak(soundLine(sounds[g.placed.length]), { rate: ctx.prefs.rate || 0.8 });
      announce(I.S("Not that one. Try again.", "Esa no. Inténtalo otra vez."));
    }
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-ph-next]")) {
    const done = loadState()[rKey]?.done || [];
    const next = set.findIndex(([w]) => !done.includes(w));
    if (next < 0) g.won = true;
    else g = { ...g, i: next, placed: [], miss: null };
    ctx.rerender();
    if (!g.won) sayWord(set[g.i][0], set[g.i][1], ctx.prefs);
    return true;
  }
  if (t.closest("[data-ph-again]")) {
    const s = loadState();
    saveState({ ...s, [rKey]: { done: [] } });
    g = { ...g, i: 0, placed: [], miss: null, won: false };
    ctx.rerender();
    return true;
  }
  return false;
}

export function unmount() {
  stopSpeech();
  g.band = "";
}

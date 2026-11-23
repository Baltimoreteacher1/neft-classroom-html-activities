// Vocabulary Academy — the Spelling Studio, a unit activity. The learner hears a unit word and builds its spelling in three
// steps that rise across a run: (1) tap tiles that are exactly its letters (K-2: chunks), (2) the same with a few extra
// letters mixed in, (3) type it from memory. A miss shows which positions are right and which are not, with a shape as well
// as a colour, and never prints the correct spelling. Retry is free, a hint reveals one letter, "Peek" flashes the word and
// hides it again (a support), nothing is timed against the learner, and the word's sentence is only ever spoken, never shown.
// Built on the shared game kit, like the Word Vault: pure engine (buildSpelling), a kit spec, and start() for the unit page.
import { recordResult } from "../model.js";
import { workOf } from "./work.js";
import { html, icon, mountGame, raw } from "../games/kit.js";

export const TITLE = ["Spelling Studio", "Estudio de ortografía"];
const WORDS = { early: 4, "upper-elem": 5, middle: 5, high: 5 };
const MIN_WORDS = 2;
const MAX_HINTS = 3;
export const STEPS = [
  { n: 1, mode: "tiles", extras: false },
  { n: 2, mode: "tiles", extras: true },
  { n: 3, mode: "type", extras: false },
];
/** Letters a learner commonly mixes up; extras are drawn from these first, then from the rest of the alphabet. */
const LOOKALIKES = {
  a: "eo",
  b: "dp",
  c: "ks",
  d: "bt",
  e: "ai",
  f: "vh",
  g: "jq",
  h: "nm",
  i: "ey",
  j: "g",
  k: "cq",
  l: "ri",
  m: "nw",
  n: "mh",
  o: "au",
  p: "bq",
  q: "gp",
  r: "ln",
  s: "zc",
  t: "dl",
  u: "vo",
  v: "uf",
  w: "mv",
  x: "zk",
  y: "ie",
  z: "sx",
};
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/** A word the studio can spell: one run of letters, 3 to 16 long (phrases and hyphenated words are left out). */
export const spellable = (hw) => /^[A-Za-z]{3,16}$/.test(String(hw || ""));

const VOWELS = /[aeiouy]/;
/** Syllable-like chunks of a word by vowel groups, joined back to the word exactly; [] when it does not split. */
export function syllableChunks(word) {
  const w = String(word).toLowerCase();
  const chunks =
    w.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]+(?![aeiouy])|(?=[^aeiouy][aeiouy]))?/g) || [];
  const tail = w.slice(chunks.join("").length);
  if (tail) chunks[chunks.length - 1] += tail;
  // A last chunk of consonant + e ("me" in sa-me) is a silent e: it belongs to the chunk before it.
  if (chunks.length >= 2 && /^[^aeiouy]+e$/.test(chunks[chunks.length - 1]))
    chunks.splice(-2, 2, chunks[chunks.length - 2] + chunks[chunks.length - 1]);
  return chunks.join("") === w && chunks.length >= 2 && chunks.every((c) => c) ? chunks : [];
}

/** Chunk tokens for a word, from its word-part data when that spells it exactly, else by syllable, else single letters. */
export function chunksOf(word) {
  const hw = String(word.hw).toLowerCase();
  const segs = (word.morph?.segs || []).map((s) =>
    String(s?.s || "")
      .replace(/-/g, "")
      .toLowerCase(),
  );
  if (segs.length >= 2 && segs.every(Boolean) && segs.join("") === hw && segs.length <= 6)
    return segs;
  const syl = syllableChunks(hw);
  if (syl.length >= 2 && syl.length <= 6) return syl;
  // A one-syllable word: onset + rime when there is a vowel to split on, otherwise letters.
  const at = hw.search(VOWELS);
  if (at > 0 && hw.length <= 5) return [hw.slice(0, at), hw.slice(at)];
  return [...hw];
}

/**
 * Wordle-style marks for one attempt against the answer, token by token: "ok" right token in the right place, "move" the
 * answer has it somewhere else, "no" the answer does not have it (or has no more of it). One mark per ATTEMPTED token and
 * nothing else — it says nothing about positions the learner has not tried. Pure.
 */
export function markTokens(answer, attempt) {
  const a = answer.map((t) => String(t).toLowerCase());
  const g = attempt.map((t) => String(t).toLowerCase());
  const marks = g.map(() => "no");
  const left = new Map();
  a.forEach((t, i) => {
    if (g[i] === t) marks[i] = "ok";
    else left.set(t, (left.get(t) || 0) + 1);
  });
  g.forEach((t, i) => {
    if (marks[i] === "ok") return;
    if ((left.get(t) || 0) > 0) {
      marks[i] = "move";
      left.set(t, left.get(t) - 1);
    }
  });
  return marks;
}

/** Extra letters for step 2: distinct letters the word does not contain, look-alikes first. Deterministic by rng. */
export function pickExtras(word, count, rng) {
  const have = new Set(String(word).toLowerCase());
  const near = [];
  for (const c of have)
    for (const l of LOOKALIKES[c] || "") if (!have.has(l) && !near.includes(l)) near.push(l);
  const rest = [...ALPHABET].filter((l) => !have.has(l) && !near.includes(l));
  return [...rng.shuffle(near), ...rng.shuffle(rest)].slice(0, count);
}

/** A tile order that is not the answer's order (unless every order is the same word). */
function scramble(tokens, rng) {
  let out = rng.shuffle(tokens);
  for (let k = 0; k < 8 && out.join("|") === tokens.join("|") && new Set(tokens).size > 1; k++)
    out = rng.shuffle(tokens);
  return out;
}

function makeItem(word, step, pool, rng) {
  const hw = String(word.hw).toLowerCase();
  const early = pool.band === "early";
  const base = {
    id: `spell-${step.n}-${word.id}`,
    wordId: word.id,
    step: step.n,
    mode: step.mode,
    hw,
  };
  if (step.mode === "type") {
    return {
      ...base,
      n: hw.length,
      tokens: [...hw],
      text: "",
      marks: null,
      tried: "",
      hinted: [],
      hints: 0,
      misses: 0,
      done: false,
    };
  }
  const tokens = early ? chunksOf(word) : [...hw];
  const extras = step.extras ? pickExtras(hw, hw.length >= 9 ? 3 : 2, rng) : [];
  // Scramble the real tokens first, then drop the extras in at random places, so the real ones are never in answer order.
  const order = scramble(tokens, rng);
  for (const x of extras) order.splice(rng.int(order.length + 1), 0, x);
  return {
    ...base,
    n: tokens.length,
    tokens,
    extras,
    tiles: order.map((t, i) => ({ id: i, t })),
    slots: tokens.map(() => null),
    locked: tokens.map(() => false),
    marks: tokens.map(() => null),
    hints: 0,
    misses: 0,
    done: false,
  };
}

/**
 * Pure engine: the run for a pool and a seeded rng. Each chosen word is met once per step, in three rounds that rise from
 * tiles, to tiles with extra letters, to typing from memory. { items, i } or { items: [] } when there are too few words.
 */
export function buildSpelling(pool, rng, { count } = {}) {
  const want = count || WORDS[pool.band] || 5;
  const candidates = pool.words.filter((w) => spellable(w.hw));
  if (candidates.length < MIN_WORDS) return { items: [], i: 0 };
  const chosen = rng.shuffle(candidates).slice(0, want);
  const items = [];
  let prev = null;
  for (const step of STEPS) {
    let round = rng.shuffle(chosen);
    if (prev && round.length > 1 && round[0].id === prev) round = [...round.slice(1), round[0]];
    for (const w of round) items.push(makeItem(w, step, pool, rng));
    prev = round[round.length - 1].id;
  }
  return { items, i: 0 };
}

// ── pure item mechanics ───────────────────────────────────────────────────────────────────
/** The tokens currently in the slots (null for an empty one). */
export const placed = (it) =>
  it.slots.map((id) => (id == null ? null : it.tiles.find((t) => t.id === id)?.t));
export const slotsFull = (it) => it.slots.every((id) => id != null);
export const trayTiles = (it) => it.tiles.filter((t) => !it.slots.includes(t.id));

/** Tap a tray tile: it goes to the first empty slot. Returns true when something changed. */
export function placeTile(it, tileId) {
  if (it.done || it.slots.includes(tileId)) return false;
  const at = it.slots.indexOf(null);
  if (at < 0) return false;
  it.slots[at] = tileId;
  it.marks[at] = null;
  return true;
}
/** Tap a filled slot: its tile goes back to the tray, unless the slot is locked as right. */
export function liftSlot(it, k) {
  if (it.done || it.slots[k] == null || it.locked[k]) return false;
  it.slots[k] = null;
  it.marks[k] = null;
  return true;
}
/** Put every unlocked tile back in the tray. */
export function clearSlots(it) {
  let changed = false;
  it.slots.forEach((id, k) => {
    if (id != null && !it.locked[k]) {
      it.slots[k] = null;
      it.marks[k] = null;
      changed = true;
    }
  });
  return changed;
}

/** Check a full tile build. Right slots lock in place; the rest keep their marks until the learner lifts them. */
export function checkTiles(it) {
  if (it.done || !slotsFull(it)) return null;
  const marks = markTokens(it.tokens, placed(it));
  const ok = marks.every((m) => m === "ok");
  it.marks = marks;
  marks.forEach((m, k) => {
    if (m === "ok") it.locked[k] = true;
  });
  if (ok) it.done = true;
  else it.misses += 1;
  return { ok, marks, first: it.misses === 0 || (ok && it.misses === 0) };
}

/** Normal attempt text for the typed step. */
export const cleanTyped = (v) =>
  String(v || "")
    .replace(/[^A-Za-z]/g, "")
    .toLowerCase();
/** Check a typed attempt. An empty attempt is not a check. */
export function checkTyped(it) {
  const text = cleanTyped(it.text);
  if (it.done || !text) return null;
  const marks = markTokens(it.tokens, [...text]);
  const ok = text === it.hw;
  it.tried = text;
  it.marks = marks;
  if (ok) it.done = true;
  else it.misses += 1;
  return { ok, marks, first: it.misses === 0 };
}

/** Reveal one letter. Tiles: the next wrong or empty slot is filled with its right tile and locked. Typed: one position shows. */
export function hintItem(it) {
  if (it.done || it.hints >= MAX_HINTS) return null;
  if (it.mode === "type") {
    const typed = cleanTyped(it.text);
    const open = it.tokens.map((_, k) => k).filter((k) => !it.hinted.includes(k));
    if (!open.length) return null;
    const pos = open.find((k) => typed[k] !== it.tokens[k]) ?? open[0];
    it.hinted.push(pos);
    it.hints += 1;
    return { pos };
  }
  const k = it.slots.findIndex(
    (id, s) => !it.locked[s] && (id == null || placed(it)[s] !== it.tokens[s]),
  );
  if (k < 0) return null;
  if (it.slots[k] != null) {
    it.slots[k] = null;
    it.marks[k] = null;
  }
  const tile = trayTiles(it).find((t) => t.t === it.tokens[k]);
  if (!tile) return null;
  it.slots[k] = tile.id;
  it.locked[k] = true;
  it.marks[k] = "hint";
  it.hints += 1;
  return { pos: k };
}

/** The unit-page unit of progress: items finished and the total. */
export const itemsDone = (s) => s.items.filter((x) => x.done).length;

// ── view ──────────────────────────────────────────────────────────────────────────────────
const STEP_NAME = [
  ["Build it with tiles", "Constrúyela con fichas"],
  ["Build it, with extra letters", "Constrúyela, con letras de más"],
  ["Type it from memory", "Escríbela de memoria"],
];
const MARK = {
  ok: { glyph: "✓", en: "right spot", es: "lugar correcto" },
  move: {
    glyph: "↔",
    en: "in the word, in a different spot",
    es: "está en la palabra, en otro lugar",
  },
  no: { glyph: "✕", en: "not in the word", es: "no está en la palabra" },
  hint: { glyph: "★", en: "shown by a hint", es: "mostrada por una pista" },
};
/** The headword, masked, wherever a definition would print it. */
export const maskWord = (text, hw) =>
  String(text || "").replace(
    new RegExp(`\\b${String(hw).replace(/[^a-z]/gi, "")}\\w*`, "gi"),
    "___",
  );

let PEEK = ""; // item id being peeked at; memory only, never saved
let PEEK_TIMER = 0;
let FOCUSED = ""; // item id that last received focus on arrival

const markCell = (m, I) =>
  m
    ? html`<span class="va-sp-mark" data-m="${m}" aria-hidden="true">${MARK[m].glyph}</span
        ><span class="vag-sr">${I.S(MARK[m].en, MARK[m].es)}. </span>`
    : "";

function slotsHTML(it, env) {
  const I = env.I;
  const tiles = placed(it);
  return html`<div
    class="va-sp-slots"
    role="group"
    aria-label="${I.S("Your spelling, one place for each part", "Tu ortografía, un lugar para cada parte")}"
  >
    ${tiles.map((t, k) => {
      const m = it.marks[k];
      const label = t
        ? `${I.S("Place", "Lugar")} ${k + 1}: ${t}${m ? `, ${I.S(MARK[m].en, MARK[m].es)}` : ""}${it.locked[k] ? `, ${I.S("locked", "fijada")}` : `. ${I.S("Tap to take it back", "Toca para quitarla")}`}`
        : `${I.S("Place", "Lugar")} ${k + 1}: ${I.S("empty", "vacío")}`;
      return html`<button
        type="button"
        class="va-sp-slot"
        data-slot="${k}"
        data-fk="slot-${k}"
        data-filled="${String(Boolean(t))}"
        data-m="${m || ""}"
        data-locked="${String(Boolean(it.locked[k]))}"
        aria-label="${label}"
        aria-disabled="${!t || it.locked[k] ? "true" : "false"}"
      >
        <span class="va-sp-letter" aria-hidden="true">${t || ""}</span
        >${m ? html`<span class="va-sp-mark" data-m="${m}" aria-hidden="true">${MARK[m].glyph}</span>` : ""}
      </button>`;
    })}
  </div>`;
}

function trayHTML(it, env) {
  const I = env.I;
  const tray = trayTiles(it);
  return html`<div
    class="va-sp-tray"
    role="group"
    aria-label="${I.S("Tiles", "Fichas")}"
    data-rove
    data-cols="0"
  >
    ${tray.map(
      (t) =>
        html`<button
          type="button"
          class="va-sp-tile"
          data-tile="${t.id}"
          data-fk="tile-${t.id}"
          data-rv
          aria-label="${I.S("Tile", "Ficha")} ${t.t}"
        >
          ${t.t}
        </button>`,
    )}
    ${tray.length ? "" : html`<span class="vag-fine">${I.T("All the tiles are in place.", "Todas las fichas están en su lugar.")}</span>`}
  </div>`;
}

function typedHTML(it, env) {
  const I = env.I;
  const row = it.tokens.map((_, k) => (it.hinted.includes(k) ? it.tokens[k] : ""));
  const tried = it.tried ? [...it.tried] : [];
  return html`<div class="va-sp-typed">
    <div
      class="va-sp-slots"
      role="img"
      aria-label="${I.S(`The word has ${it.n} letters`, `La palabra tiene ${it.n} letras`)}${it.hinted.length ? `. ${I.S("Letters shown by hints", "Letras mostradas por pistas")}: ${it.hinted.map((k) => `${k + 1}: ${it.tokens[k]}`).join(", ")}` : ""}"
    >
      ${row.map((c) => html`<span class="va-sp-slot" data-filled="${String(Boolean(c))}" data-m="${c ? "hint" : ""}" aria-hidden="true"><span class="va-sp-letter">${c}</span>${c ? html`<span class="va-sp-mark" data-m="hint">${MARK.hint.glyph}</span>` : ""}</span>`)}
    </div>
    <label class="va-sp-label" for="${env.uid}-in"
      >${I.T("Type the word", "Escribe la palabra")}</label
    >
    <input
      id="${env.uid}-in"
      class="va-sp-input"
      data-fk="typed"
      data-autofocus
      type="text"
      value="${it.text}"
      ${it.done ? raw("readonly") : ""}
      maxlength="${it.n + 4}"
      autocomplete="off"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
      lang="en"
      inputmode="text"
    />
    ${
      tried.length
        ? html`<div
              class="va-sp-tried"
              role="group"
              aria-label="${I.S("Your last try, letter by letter", "Tu último intento, letra por letra")}"
            >
              ${tried.map((c, k) => html`<span class="va-sp-slot" data-filled="true" data-m="${it.marks[k]}"><span class="va-sp-letter">${c}</span>${markCell(it.marks[k], I)}</span>`)}
            </div>
            ${tried.length !== it.n ? html`<p class="vag-fine">${I.T(`Your try has ${tried.length} letters. The word has ${it.n}.`, `Tu intento tiene ${tried.length} letras. La palabra tiene ${it.n}.`)}</p>` : ""}`
        : ""
    }
  </div>`;
}

function legendHTML(it, env) {
  const I = env.I;
  if (!it.marks?.some((m) => m && m !== "hint")) return "";
  return html`<ul
    class="va-sp-legend"
    aria-label="${I.S("What the marks mean", "Qué significan las marcas")}"
  >
    ${["ok", "move", "no"].map((m) => html`<li><span class="va-sp-mark" data-m="${m}" aria-hidden="true">${MARK[m].glyph}</span> ${I.T(MARK[m].en, MARK[m].es)}</li>`)}
  </ul>`;
}

function feedbackHTML(it, env) {
  const I = env.I;
  if (it.done)
    return html`<p class="vag-fb vag-fb-ok">
      ${icon("check")}<span
        ><strong>${I.T("Right", "Correcto")}.</strong>
        ${I.T("You spelled it.", "La escribiste bien.")}</span
      >
    </p>`;
  if (!it.misses) return "";
  return html`<p class="vag-fb vag-fb-retry">
    ${icon("retry")}<span
      ><strong>${I.T("Not yet", "Todavía no")}.</strong>
      ${I.T("The marks show which places are right. Try again as often as you like.", "Las marcas muestran qué lugares están bien. Inténtalo las veces que quieras.")}</span
    >
  </p>`;
}

function view(s, env) {
  const I = env.I;
  const it = s.items[s.i];
  const word = env.pool.byId.get(it.wordId);
  const step = STEP_NAME[it.step - 1];
  const wordsInRound = s.items.filter((x) => x.step === it.step);
  const inRound = wordsInRound.indexOf(it) + 1;
  const peeking = PEEK === it.id;
  const showPic =
    env.sup.picture && word?.visual && !new RegExp(`\\b${it.hw}`, "i").test(word.visual.alt || "");
  const def = maskWord(word?.def, it.hw);
  const canCheck = it.mode === "type" ? cleanTyped(it.text).length > 0 : slotsFull(it);
  return html`<div class="va-sp" data-step="${it.step}" data-mode="${it.mode}">
    <ol class="va-sp-steps" aria-label="${I.S("Steps", "Pasos")}">
      ${STEP_NAME.map((n, k) => html`<li data-state="${k + 1 < it.step ? "past" : k + 1 === it.step ? "now" : "next"}" ${k + 1 === it.step ? raw('aria-current="step"') : ""}><span class="va-sp-stepn">${k + 1}</span><span class="va-sp-stept">${I.T(...n)}</span></li>`)}
    </ol>
    <div class="vag-qcard">
      <p class="vag-qtype">
        <strong>${I.T("Step", "Paso")} ${it.step} ${I.T("of", "de")} 3: ${I.T(...step)}</strong> ·
        ${I.T("word", "palabra")} ${inRound} ${I.T("of", "de")} ${wordsInRound.length}
      </p>
      <div class="va-sp-hear">
        <button
          type="button"
          class="btn btn-primary va-sp-say"
          data-say="word"
          data-fk="say"
         
        >
          ${icon("volume")}${I.T("Listen to the word", "Escuchar la palabra")}
        </button>
        ${word?.ex ? html`<button type="button" class="btn va-sp-say" data-say="sentence" data-fk="sentence">${icon("volume")}${I.T("Hear it in a sentence", "Escucharla en una oración")}</button>` : ""}
        <button type="button" class="btn va-sp-peek" data-peek data-fk="peek">
          ${icon("search")}${I.T("Peek at the word", "Mirar la palabra")}
        </button>
      </div>
      ${peeking ? html`<p class="va-sp-peeked" role="note" lang="en"><span class="vag-fine">${I.T("Here it is for a moment:", "Aquí está por un momento:")}</span> <strong>${it.hw}</strong></p>` : ""}
      ${showPic ? html`<div class="vag-pic-wrap">${env.pic(word, "lg")}</div>` : ""}
      <p class="va-sp-helps">
        <button
          type="button"
          class="btn small"
          data-meaning
          data-fk="meaning"
          aria-expanded="${String(Boolean(it.showMeaning))}"
        >
          ${icon("info")}${I.T("What does it mean?", "¿Qué significa?")}
        </button>
        ${env.gloss(word)}
      </p>
      ${it.showMeaning && def ? html`<p class="va-sp-meaning">${def}</p>` : ""}
      ${it.mode === "type" ? typedHTML(it, env) : html`${slotsHTML(it, env)}${trayHTML(it, env)}`}
      ${legendHTML(it, env)}
      <div class="vag-actions">
        <button
          type="button"
          class="btn btn-primary"
          data-check
          data-fk="check"
          aria-disabled="${String(!canCheck)}"
        >
          ${icon("check")}${I.T("Check my spelling", "Revisar mi ortografía")}
        </button>
        ${it.done ? "" : html`<button type="button" class="btn small vag-hint" data-hint data-fk="hint" ${it.hints >= MAX_HINTS ? "disabled" : ""}>${icon("bulb")}${I.T("Show one letter", "Mostrar una letra")}</button>`}
        ${it.mode === "tiles" && !it.done ? html`<button type="button" class="btn small" data-clear data-fk="clear">${icon("retry")}${I.T("Take my tiles back", "Quitar mis fichas")}</button>` : ""}
        ${it.done ? html`<button type="button" class="btn btn-primary" data-next data-fk="next" data-autofocus>${s.i >= s.items.length - 1 ? I.T("Finish", "Terminar") : I.T("Next word", "Siguiente palabra")}${icon("arrow-right")}</button>` : ""}
      </div>
      ${feedbackHTML(it, env)}
    </div>
  </div>`;
}

// ── kit glue ──────────────────────────────────────────────────────────────────────────────
function judge(it, res, env) {
  if (!res) return false;
  const dim = it.mode === "type" ? "prod" : "rec";
  // A word's first miss in a step is reported once; the right answer is reported when it comes.
  if (!res.ok && it.misses === 1)
    env.report({ wordId: it.wordId, dim, ok: false, firstTry: false, kind: `spell-${it.step}` });
  if (res.ok)
    env.report({
      wordId: it.wordId,
      dim,
      ok: true,
      firstTry: it.misses === 0,
      kind: `spell-${it.step}`,
    });
  env.say(
    res.ok
      ? env.I.S("Right. You spelled it.", "Correcto. La escribiste bien.")
      : env.I.S(
          `Not yet. ${res.marks.filter((m) => m === "ok").length} of ${res.marks.length} places are right.`,
          `Todavía no. ${res.marks.filter((m) => m === "ok").length} de ${res.marks.length} lugares están bien.`,
        ),
  );
  return true;
}

async function speakWord(it, kind, env) {
  const word = env.pool.byId.get(it.wordId);
  const text = kind === "sentence" ? word?.ex : it.hw;
  if (!text) return;
  try {
    const { speak } = await import("../../speech.js");
    speak(text, { lang: "en-US" });
  } catch {}
}

const spec = {
  id: "word-spelling",
  title: TITLE,
  persist: true,
  numberKeys: false,
  howTo: [
    [
      "Listen to the word. You can hear it again, or hear it in a sentence, as many times as you like.",
      "Escucha la palabra. Puedes oírla otra vez, o en una oración, las veces que quieras.",
    ],
    [
      "Step 1: tap tiles to build the word. Step 2: some tiles are extra, so choose carefully. Step 3: type it from memory.",
      "Paso 1: toca fichas para armar la palabra. Paso 2: algunas fichas sobran, elige con cuidado. Paso 3: escríbela de memoria.",
    ],
    [
      "If it is not right yet, the marks show which places are right. A check mark is the right spot, arrows mean the letter is in the word somewhere else, and a cross means it is not in the word.",
      "Si todavía no está bien, las marcas muestran qué lugares están correctos. La marca ✓ es el lugar correcto, las flechas significan que la letra está en otro lugar y la cruz significa que no está en la palabra.",
    ],
    [
      "Stuck? Show one letter, or peek at the word for a moment. Retry is always free.",
      "¿Te atoraste? Muestra una letra o mira la palabra un momento. Intentar otra vez siempre es gratis.",
    ],
  ],
  keys: [
    [
      "A to Z",
      [
        "pick a tile with that letter (letter tiles)",
        "elegir una ficha con esa letra (fichas de letras)",
      ],
    ],
    ["Backspace", ["take back the last tile", "quitar la última ficha"]],
    [
      "Enter",
      [
        "check your spelling, then go to the next word",
        "revisar tu ortografía y pasar a la siguiente palabra",
      ],
    ],
  ],
  build: (env) => buildSpelling(env.pool, env.rng),
  valid: (s) =>
    Array.isArray(s?.items) &&
    s.items.length >= MIN_WORDS * 3 &&
    s.items.every((x) => x && x.id && x.tokens),
  unplayable: (s) => !s.items.length,
  isDone: (s) => s.items.every((x) => x.done) && Boolean(s.advanced),
  progress: (s) => ({ done: itemsDone(s), total: s.items.length }),
  view,
  async click(el, s, env) {
    const it = s.items[s.i];
    const say = el.closest("[data-say]");
    if (say) {
      await speakWord(it, say.dataset.say, env);
      return false;
    }
    if (el.closest("[data-peek]")) {
      env.use("model");
      PEEK = it.id;
      clearTimeout(PEEK_TIMER);
      PEEK_TIMER = setTimeout(
        () => {
          PEEK = "";
          env.rerender();
        },
        it.mode === "type" ? 2200 : 2600,
      );
      env.say(env.I.S(`The word is ${it.hw}.`, `La palabra es ${it.hw}.`));
      return true;
    }
    if (el.closest("[data-meaning]")) {
      it.showMeaning = !it.showMeaning;
      return true;
    }
    if (el.closest("[data-next]")) {
      if (!it.done) return false;
      PEEK = "";
      if (s.i >= s.items.length - 1) s.advanced = true;
      else s.i += 1;
      return true;
    }
    if (it.done) return false;
    if (el.closest("[data-hint]")) {
      const r = hintItem(it);
      if (!r) return false;
      env.use("model");
      env.say(env.I.S("One letter shown.", "Se mostró una letra."));
      return true;
    }
    if (el.closest("[data-check]")) {
      const res = it.mode === "type" ? checkTyped(it) : checkTiles(it);
      if (!res) {
        env.say(env.I.S("Fill every place first.", "Primero llena todos los lugares."));
        return false;
      }
      return judge(it, res, env);
    }
    if (it.mode !== "tiles") return false;
    const tile = el.closest("[data-tile]");
    if (tile) return placeTile(it, Number(tile.dataset.tile));
    const slot = el.closest("[data-slot]");
    if (slot) return liftSlot(it, Number(slot.dataset.slot));
    if (el.closest("[data-clear]")) return clearSlots(it);
    return false;
  },
  input(el, s) {
    const it = s.items[s.i];
    if (!el.classList?.contains("va-sp-input") || it.mode !== "type" || it.done) return false;
    it.text = el.value;
    return false; // no re-render while typing: the caret stays where it is
  },
  key(ev, s, env) {
    const it = s.items[s.i];
    if (!it || ev.ctrlKey || ev.metaKey || ev.altKey) return false;
    const typing = ev.target?.classList?.contains("va-sp-input");
    if (ev.key === "Enter") {
      if (ev.target?.closest?.("button") && !typing) return false; // a focused button handles its own Enter
      if (it.done) return advance(s);
      const res = it.mode === "type" ? checkTyped(it) : checkTiles(it);
      return res ? judge(it, res, env) : false;
    }
    if (it.mode !== "tiles" || it.done || typing) return false;
    if (ev.key === "Backspace") {
      for (let k = it.slots.length - 1; k >= 0; k--)
        if (it.slots[k] != null && !it.locked[k]) return liftSlot(it, k);
      return false;
    }
    if (/^[a-z]$/i.test(ev.key) && it.tokens.every((t) => t.length === 1)) {
      const tile = trayTiles(it).find((t) => t.t === ev.key.toLowerCase());
      return tile ? placeTile(it, tile.id) : false;
    }
    return false;
  },
  after(body) {
    const input = body.querySelector(".va-sp-input");
    if (input && document.activeElement === input)
      input.setSelectionRange(input.value.length, input.value.length);
  },
  destroy() {
    clearTimeout(PEEK_TIMER);
    PEEK = "";
    FOCUSED = "";
  },
  extra: (s) => ({ words: new Set(s.items.map((x) => x.wordId)).size, steps: 3 }),
  finishExtra: (s, env) =>
    html`<p class="va-spell-done">
      ${icon("star")}
      ${env.I.T(
        `You built ${new Set(s.items.map((x) => x.wordId)).size} words with tiles and from memory.`,
        `Armaste ${new Set(s.items.map((x) => x.wordId)).size} palabras con fichas y de memoria.`,
      )}
    </p>`,
};

function advance(s) {
  PEEK = "";
  if (s.i >= s.items.length - 1) s.advanced = true;
  else s.i += 1;
  return true;
}

/** Mount the studio into a host element. opts is the games' option bag ({ unit, grade, ctx, onResult, onDone, persist, restore }). */
export const mountSpell = (root, opts) => mountGame(root, opts, spec);
export const spellSpec = spec;

/** The unit page's entry point (see ./extras.js): results through the model, the run kept in unitWork[gid].spell. */
export function start(host, ctx, va, { gid, merged, g }) {
  const spell = (workOf(va.progress, gid).spell ||= {});
  return mountSpell(host, {
    unit: merged,
    grade: g,
    ctx: { ...ctx, supports: va.supports("writing") },
    now: Date.now(),
    onResult: (ev) => {
      recordResult(va.progress, {
        wordId: ev.wordId,
        dim: ev.dim,
        ok: ev.ok,
        sup: ev.sup,
        type: ev.type,
        now: new Date(),
        unit: gid,
        grade: g,
      });
      va.save();
    },
    onDone: (sum) => {
      spell.done = true;
      spell.at = new Date().toISOString();
      spell.judged = sum.judged;
      spell.correct = sum.correct;
      va.save();
    },
    persist: (key, state) => {
      if (state) spell.resume = { key, at: Date.now(), state };
      else delete spell.resume;
      va.save();
    },
    restore: (key) => (spell.resume?.key === key ? spell.resume.state : null),
  });
}

// Meaning Match — a memory game that gets harder as meaning gets deeper:
// word and picture, word and definition, word and example sentence, word and non-example sentence.
// Flip two cards. A match stays up; a miss stays face-up until you choose your next card (no clock).
// "Show me a pair" points at one pair and is recorded as a support, never as a miss.
import { choiceCount } from "./data.js";
import { html, icon, mountGame } from "./kit.js";
import { maskForm } from "./text.js";

export const TITLE = ["Meaning Match", "Une el significado"];

const LEVELS = [
  { kind: "picture", dim: "rec", label: ["Word and picture", "Palabra e imagen"] },
  { kind: "def", dim: "mean", label: ["Word and meaning", "Palabra y significado"] },
  { kind: "example", dim: "ctx", label: ["Word and example sentence", "Palabra y ejemplo"] },
  {
    kind: "nonexample",
    dim: "ctx",
    label: [
      "Word and a sentence that shows what it is NOT",
      "Palabra y una oración que muestra lo que NO es",
    ],
  },
];

/** The partner card for a word at a level, or null when the word's data cannot supply one. */
export function partnerFor(kind, word) {
  if (kind === "picture") {
    const v = word.visual;
    return v && v.kind !== "diagram" && (v.glyphs || []).length
      ? { glyphs: v.glyphs, alt: v.alt || "" }
      : null;
  }
  if (kind === "def") return { text: word.def };
  if (kind === "example") {
    for (const s of [word.ex, word.ex2]) {
      const m = s ? maskForm(s, word) : null;
      if (m?.found) return { text: m.text };
    }
    return null;
  }
  if (kind === "nonexample") {
    const m = word.nonExample ? maskForm(word.nonExample, word) : null;
    return m?.found ? { text: m.text } : null;
  }
  return null;
}

/** Pure engine: up to four escalating levels; each is a set of word/partner pairs shuffled into cards. */
export function buildLevels(pool, rng) {
  const per = choiceCount(pool); // 3 pairs for K-2, otherwise 4
  const seen = new Map(pool.words.map((w) => [w.id, 0]));
  const levels = [];
  for (const L of LEVELS) {
    const cands = pool.words.filter((w) => partnerFor(L.kind, w));
    // words used the fewest times so far come first; a picture level also needs pairwise-different pictures
    const order = rng.shuffle(cands).sort((a, b) => seen.get(a.id) - seen.get(b.id));
    const chosen = [];
    const glyphs = new Set();
    for (const w of order) {
      if (chosen.length >= per) break;
      if (L.kind === "picture") {
        const g = w.visual.glyphs;
        if (g.some((x) => glyphs.has(x))) continue;
        g.forEach((x) => glyphs.add(x));
      }
      chosen.push(w);
    }
    if (chosen.length < Math.min(3, per)) continue;
    chosen.forEach((w) => seen.set(w.id, seen.get(w.id) + 1));
    const cards = rng.shuffle(
      chosen.flatMap((w, i) => [
        { cid: `w${i}`, pair: w.id, side: "word" },
        { cid: `p${i}`, pair: w.id, side: "partner", partner: partnerFor(L.kind, w) },
      ]),
    );
    levels.push({
      kind: L.kind,
      dim: L.dim,
      cards,
      matched: [],
      open: [],
      miss: false,
      fails: {},
      assist: null,
      assisted: [],
      tries: 0,
    });
  }
  return levels;
}

const KIND_META = Object.fromEntries(LEVELS.map((l) => [l.kind, l]));

const spec = {
  id: "meaning-match",
  title: TITLE,
  howTo: [
    [
      "Turn over two cards. Find the word and the card that goes with it.",
      "Voltea dos cartas. Busca la palabra y su pareja.",
    ],
    [
      "If the cards match, they stay up. If not, they stay face-up until you choose your next card. There is no clock.",
      "Si coinciden, se quedan. Si no, siguen visibles hasta que elijas otra. No hay reloj.",
    ],
    [
      "Each level asks for a deeper kind of match: picture, meaning, example, then a sentence that shows what the word is NOT.",
      "Cada nivel pide una pareja más profunda.",
    ],
    [
      "Stuck? Choose Show me a pair. It points to one pair and never counts against you.",
      "¿Atascado? Elige Muéstrame una pareja. Nunca cuenta en tu contra.",
    ],
  ],
  keys: [
    ["Arrow keys", ["move between cards", "moverse entre cartas"]],
    ["Enter or Space", ["turn a card over", "voltear una carta"]],
  ],
  numberKeys: false,

  build(env) {
    return { levels: buildLevels(env.pool, env.rng), li: 0, ready: false };
  },
  unplayable: (s) => !s.levels.length,
  isDone: (s) => s.li >= s.levels.length,
  progress(s) {
    const total = s.levels.reduce((n, l) => n + l.cards.length / 2, 0);
    return { done: s.levels.reduce((n, l) => n + l.matched.length, 0), total };
  },

  view(s, env) {
    const I = env.I;
    const L = s.levels[s.li];
    const meta = KIND_META[L.kind];
    const cols = L.cards.length <= 6 ? 3 : 4;
    const complete = L.matched.length === L.cards.length / 2;
    const cardHTML = (c, n) => {
      const faceUp = L.matched.includes(c.pair) || L.open.includes(c.cid);
      const matched = L.matched.includes(c.pair);
      const word = env.pool.byId.get(c.pair);
      const assist = L.assist && L.assist.pair === c.pair && !matched;
      let face = "";
      let name = "";
      if (c.side === "word") {
        face = html`<span class="vag-card-word">${word.hw}</span>`;
        name = word.hw;
      } else if (c.partner.glyphs) {
        face = html`<span class="vag-card-pic" aria-hidden="true"
          >${c.partner.glyphs.join(" ")}</span
        >`;
        name = I.S(`picture: ${c.partner.alt}`, `imagen: ${c.partner.alt}`);
      } else {
        face = html`${L.kind === "nonexample" ? html`<span class="vag-card-not">${icon("x")}${I.T("Not like this", "No es así")}</span>` : ""}<span
            class="vag-card-text"
            >${c.partner.text}</span
          >`;
        name = c.partner.text;
      }
      const label = faceUp
        ? `${I.S("Card", "Carta")} ${n}: ${name}${matched ? ` (${I.S("matched", "pareja encontrada")})` : ""}`
        : `${I.S("Card", "Carta")} ${n}, ${I.S("face down", "boca abajo")}`;
      return html`<button
        type="button"
        class="vag-card ${faceUp ? "is-up" : ""} ${matched ? "is-matched" : ""} ${assist ? "is-assist" : ""}"
        data-card="${c.cid}"
        data-fk="card-${c.cid}"
        data-rv
        ${n === 1 ? "data-rv-cur" : ""}
        aria-label="${label}"
        aria-pressed="${faceUp}"
        ${matched ? 'aria-disabled="true"' : ""}
      >
        ${faceUp ? html`${matched ? html`<span class="vag-card-mark">${icon("check")}</span>` : ""}${assist ? html`<span class="vag-card-mark">${icon("star")}${I.T("Pair", "Pareja")}</span>` : ""}${face}` : html`<span class="vag-card-back" aria-hidden="true">${assist ? icon("star") : n}</span>`}
      </button>`;
    };
    return html`<p class="vag-level">
        <strong>${I.T("Level", "Nivel")} ${s.li + 1} ${I.T("of", "de")} ${s.levels.length}:</strong>
        ${I.T(...meta.label)}
      </p>
      <div
        class="vag-grid"
        data-rove
        data-cols="${cols}"
        style="--cols:${cols}"
        role="group"
        aria-label="${I.S("Memory cards", "Cartas de memoria")}"
      >
        ${L.cards.map((c, i) => cardHTML(c, i + 1))}
      </div>
      <div class="vag-actions">
        ${complete ? "" : html`<button type="button" class="btn small" data-assist data-fk="assist">${icon("search")}${I.T("Show me a pair", "Muéstrame una pareja")}</button>`}
        ${L.miss ? html`<button type="button" class="btn small" data-flip-back data-fk="flipback">${I.T("Turn them back over", "Voltearlas de nuevo")}</button>` : ""}
        ${complete ? html`<button type="button" class="btn btn-primary" data-level-next data-fk="next" data-autofocus>${s.li + 1 >= s.levels.length ? I.T("Finish", "Terminar") : I.T("Next level", "Siguiente nivel")}${icon("arrow-right")}</button>` : ""}
      </div>
      ${
        L.miss
          ? html`<p class="vag-fb vag-fb-retry">
              ${icon("retry")}<span
                ><strong>${I.T("Not a match.", "No son pareja.")}</strong>
                ${I.T("Look at both cards, then choose any card to keep going.", "Mira las dos cartas y elige cualquier carta para seguir.")}</span
              >
            </p>`
          : ""
      }
      ${
        complete
          ? html`<p class="vag-fb vag-fb-ok">
              ${icon("check")}<span
                ><strong>${I.T("All pairs found.", "Encontraste todas las parejas.")}</strong></span
              >
            </p>`
          : ""
      }
      ${
        L.assist && !complete
          ? html`<p class="vag-fb vag-fb-hint">
              ${icon("bulb")}<span
                ><strong>${I.T("Here is one pair.", "Aquí hay una pareja.")}</strong>
                ${I.T("Both cards are marked with a star. Turn them over to match them.", "Las dos cartas tienen una estrella. Voltéalas para unirlas.")}</span
              >
            </p>`
          : ""
      }`;
  },

  click(el, s, env) {
    const L = s.levels[s.li];
    if (el.closest("[data-level-next]")) {
      s.li += 1;
      return true;
    }
    if (el.closest("[data-flip-back]")) {
      L.open = [];
      L.miss = false;
      return true;
    }
    if (el.closest("[data-assist]")) {
      const left = L.cards.filter((c) => !L.matched.includes(c.pair)).map((c) => c.pair);
      if (!left.length) return false;
      L.assist = { pair: left[0] };
      L.assisted.push(left[0]);
      env.use("model");
      env.say(
        env.I.S("One pair is marked with a star.", "Una pareja está marcada con una estrella."),
      );
      return true;
    }
    const card = el.closest("[data-card]");
    if (!card || card.getAttribute("aria-disabled") === "true") return false;
    const cid = card.dataset.card;
    if (L.miss) {
      L.open = [];
      L.miss = false;
    }
    if (L.open.includes(cid)) {
      L.open = L.open.filter((x) => x !== cid);
      return true;
    }
    L.open.push(cid);
    if (L.open.length < 2) return true;
    const [a, b] = L.open.map((id) => L.cards.find((c) => c.cid === id));
    const ok = a.pair === b.pair && a.side !== b.side;
    const wordId = a.side === "word" ? a.pair : b.pair;
    L.tries += 1;
    if (ok) {
      const first = !L.fails[a.pair];
      if (L.assisted.includes(a.pair)) env.use("model");
      L.matched.push(a.pair);
      L.open = [];
      if (L.assist?.pair === a.pair) L.assist = null;
      env.report({ wordId: a.pair, dim: L.dim, ok: true, firstTry: first, kind: L.kind });
      env.say(env.I.S("Match.", "¡Pareja!"));
    } else {
      L.miss = true;
      for (const id of new Set([a.pair, b.pair])) L.fails[id] = (L.fails[id] || 0) + 1;
      env.report({ wordId, dim: L.dim, ok: false, firstTry: false, kind: L.kind });
      env.say(
        env.I.S(
          "Not a match. Choose any card to keep going.",
          "No son pareja. Elige cualquier carta para seguir.",
        ),
      );
    }
    return true;
  },
};

export default {
  id: "meaning-match",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb:
    "A memory game that deepens: words with pictures, meanings, examples, then sentences that show what a word is not.",
  blurbEs: "Un juego de memoria que se profundiza: imágenes, significados, ejemplos y no ejemplos.",
  purpose: "Connect each word to a picture, its meaning, and how it is (and is not) used.",
  minGrade: "K",
  maxGrade: "12",
  dims: ["rec", "mean", "ctx"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: { build: buildLevels, partner: partnerFor },
};

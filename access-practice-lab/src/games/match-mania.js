// Match Mania (Manía de parejas): a concentration game where the two cards of a pair are NOT the same card.
// A word pairs with its picture, its meaning or the sentence it completes (3-5), or with its synonym, its
// definition or a context sentence (6-8). Three levels per run grow from 3 to 6 pairs and change the pair type.
//
// Everything is state, nothing is a clock: a mismatch stays face up as a "peek" until the learner flips it back
// or taps the next card (which resolves it), and a hint shows one card until the next tap. Stars come from
// misses and hints, not speed. One report per pair, sent through the engine's judge() when the pair is found:
// first = found with no miss charged to it and no hint; revised = a miss came first.
import { judge, newRound, shuffle, takeHint } from "./engine.js";
import { PICS } from "./icons.js";
import { speak } from "../speech.js";
import { STICKERS, focusAfter, message, view } from "./match-mania-view.js";

export const KINDS = {
  picture: "pic",
  meaning: "text",
  sentence: "blank",
  synonym: "text",
  definition: "text",
  context: "blank",
};
const blankKind = (kind) => KINDS[kind] === "blank";
const fillBlank = (text, word) => String(text).replace("___", word);

/** Stars for a cleared level: understanding (misses) and independence (hints) only. */
export const starsFor = (L) => {
  const cost = L.misses + L.hints;
  return cost <= L.pairs.length - 1 ? 3 : cost <= L.pairs.length * 2 ? 2 : 1;
};
const unmatched = (L) => L.pairs.map((_, p) => p).filter((p) => !L.found.includes(p));
const cardOf = (L, p, side) => L.cards.findIndex((c) => c.p === p && c.side === side);
const lvl = (s) => s.levels[s.lv];

function buildLevel(spec, env) {
  const pool = shuffle(spec.pool, env.rng).slice(0, spec.pairs);
  const pairs = pool.map((it) => ({
    id: it.id,
    word: it.word,
    match: it.match,
    pic: it.pic || "",
    use: it.use || {
      en: fillBlank(it.match.en, it.word.en),
      es: fillBlank(it.match.es, it.word.es),
    },
    rs: newRound(),
  }));
  const cards = shuffle(
    pairs.flatMap((_, p) => [
      { p, side: "w" },
      { p, side: "m" },
    ]),
    env.rng,
  );
  return {
    kind: spec.kind,
    cols: spec.cols,
    sticker: spec.sticker,
    title: spec.title,
    pairs,
    cards,
    found: [],
    seen: [],
    moves: 0,
    misses: 0,
    hints: 0,
    stars: 0,
  };
}

/** Which card a hint reveals: the partner of the card that is up, else the partner of a card already seen. */
function hintTarget(s, env) {
  const L = lvl(s);
  const open = unmatched(L).filter((p) => L.pairs[p].rs.h < env.sup.hints);
  if (!open.length) return null;
  if (s.up.length === 1 && !s.peek) {
    const c = L.cards[s.up[0]];
    return open.includes(c.p) ? { p: c.p, card: cardOf(L, c.p, c.side === "w" ? "m" : "w") } : null;
  }
  const seen = L.seen.map((i) => L.cards[i]).find((c) => open.includes(c.p));
  if (seen) return { p: seen.p, card: cardOf(L, seen.p, seen.side === "w" ? "m" : "w") };
  return { p: open[0], card: cardOf(L, open[0], "w") };
}

// Screen-reader announcement only: the guide's bubble already shows the same words on screen, so the app
// toast (which would cover the board) is not used. Cleared first so a repeated message is still read.
const say = (text) => {
  const live = typeof document !== "undefined" && document.getElementById("labLive");
  if (!live) return;
  live.textContent = "";
  requestAnimationFrame(() => { live.textContent = text; });
};
let spoken = "";
let said = "";

export default {
  id: "match-mania",

  init(env) {
    const band = env.content.bands?.[env.band] || env.content;
    const levels = band.levels.slice(
      0,
      env.count(band.levels.length, Math.min(2, band.levels.length)),
    );
    return {
      band: env.band,
      lv: 0,
      phase: "play",
      levels: levels.map((spec) => buildLevel(spec, env)),
      up: [],
      peek: false,
      hint: -1,
      last: null,
      anim: null,
      combo: 0,
      fx: null,
    };
  },

  done: (s) => s.phase === "finished",
  progress: (s) => ({
    done: s.levels.reduce((n, L) => n + L.found.length, 0),
    total: s.levels.reduce((n, L) => n + L.pairs.length, 0),
  }),

  view: (s, env) => view(s, env),

  click(el, s, env) {
    const b = el.closest("button");
    if (!b) return false;
    const L = lvl(s);
    if (b.dataset.mmCard !== undefined && s.phase === "play") {
      const i = Number(b.dataset.mmCard);
      const card = L.cards[i];
      if (!card || L.found.includes(card.p) || (s.up.includes(i) && !s.peek)) return false;
      const back = s.peek ? [...s.up] : [];
      if (s.peek) {
        s.up = [];
        s.peek = false;
      }
      s.hint = -1;
      s.fx = i;
      s.up.push(i);
      if (!L.seen.includes(i)) L.seen.push(i);
      s.anim = { flip: [i], back, glow: -1 };
      if (s.up.length < 2) {
        s.last = { type: "flip" };
        return true;
      }
      L.moves += 1;
      const [a, c] = s.up.map((n) => L.cards[n]);
      if (a.p === c.p) {
        const pair = L.pairs[a.p];
        L.found.push(a.p);
        judge(pair.rs, true, env, {
          id: `${s.lv + 1}:${L.kind}:${pair.id}`,
          skill: (env.def?.skill || "reading").toLowerCase(),
          extra: { level: s.lv + 1, kind: L.kind },
        });
        s.up = [];
        s.combo += 1;
        s.anim.glow = a.p;
        s.last = { type: "match", p: a.p };
        if (L.found.length === L.pairs.length) {
          L.stars = starsFor(L);
          s.phase = "cleared";
        }
      } else {
        // The miss is charged to the pair the learner was trying to complete: the first card turned.
        L.pairs[a.p].rs.tries += 1;
        L.misses += 1;
        s.peek = true;
        s.combo = 0;
        s.last = { type: "miss", a: s.up[0], b: s.up[1] };
      }
      return true;
    }
    if (b.hasAttribute("data-mm-hide") && s.peek) {
      s.anim = { flip: [], back: [...s.up], glow: -1 };
      s.fx = s.up[0];
      s.up = [];
      s.peek = false;
      s.last = { type: "hide" };
      return true;
    }
    if (b.hasAttribute("data-g-hint") && s.phase === "play") {
      const t = hintTarget(s, env);
      if (!t || takeHint(L.pairs[t.p].rs, env) < 0) return false;
      const back = s.peek ? [...s.up] : [];
      if (s.peek) {
        s.up = [];
        s.peek = false;
      }
      L.hints += 1;
      s.hint = t.card;
      s.fx = t.card;
      s.anim = { flip: [t.card], back, glow: -1 };
      s.last = { type: "hint", card: t.card };
      return true;
    }
    if (b.hasAttribute("data-mm-next") && s.phase === "cleared") {
      if (s.lv + 1 < s.levels.length) {
        Object.assign(s, {
          lv: s.lv + 1,
          phase: "play",
          up: [],
          peek: false,
          hint: -1,
          last: null,
          anim: null,
          fx: null,
        });
      } else Object.assign(s, { phase: "recap", last: null, anim: null, fx: null });
      return true;
    }
    if (b.hasAttribute("data-mm-finish") && s.phase === "recap") {
      s.phase = "finished";
      return true;
    }
    return false;
  },

  mount(root, s, env) {
    const L = lvl(s);
    const key = `${s.lv}:${s.phase}:${L.moves}:${L.hints}:${s.last?.type || ""}:${s.up.length}`;
    if (key !== said) {
      said = key;
      const text = message(s, env, { plain: true });
      if (text && s.last) say(text);
    }
    if (s.last?.type === "match" && env.sup.audio === "auto") {
      const k = `${s.lv}:${s.last.p}:${L.moves}`;
      if (k !== spoken) {
        spoken = k;
        speak(L.pairs[s.last.p].word.en);
      }
    }
    focusAfter(root, s);
    const grid = root.querySelector(".mm-grid");
    if (!grid) return null;
    const onKey = (e) => {
      const btn = e.target.closest?.("[data-mm-card]");
      if (
        !btn ||
        !["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)
      )
        return;
      const all = [...grid.querySelectorAll("[data-mm-card]")];
      const cols =
        getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
      const at = all.indexOf(btn);
      const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
      const to = e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : at + step;
      if (to >= 0 && to < all.length) {
        all[to].focus();
        e.preventDefault();
      }
    };
    grid.addEventListener("keydown", onKey);
    return () => grid.removeEventListener("keydown", onKey);
  },

  plan(s, { wrong } = {}) {
    if (s.phase === "cleared") return [{ click: "[data-mm-next]" }];
    if (s.phase === "recap") return [{ click: "[data-mm-finish]" }];
    if (s.phase !== "play") return [];
    const L = lvl(s);
    const sel = (i) => ({ click: `[data-mm-card="${i}"]` });
    if (s.up.length === 1 && !s.peek) {
      const c = L.cards[s.up[0]];
      return [sel(cardOf(L, c.p, c.side === "w" ? "m" : "w"))];
    }
    const open = unmatched(L);
    const p = open[0];
    if (wrong && open.length > 1) return [sel(cardOf(L, p, "w")), sel(cardOf(L, open[1], "m"))];
    return [sel(cardOf(L, p, "w")), sel(cardOf(L, p, "m"))];
  },

  validate(content) {
    const errors = [];
    for (const band of ["3-5", "6-8"]) {
      const levels = content.bands?.[band]?.levels || [];
      if (levels.length !== 3) errors.push(`${band}: needs exactly three levels`);
      const words = new Set();
      levels.forEach((L, n) => {
        const at = `${band}/level ${n + 1}`;
        if (!KINDS[L.kind]) errors.push(`${at}: unknown pair kind "${L.kind}"`);
        if (!Number.isInteger(L.pairs) || L.pairs < 2 || L.pairs > 6)
          errors.push(`${at}: pairs must be 2-6`);
        if (!Number.isInteger(L.cols) || L.cols < 2 || L.cols > 4)
          errors.push(`${at}: cols must be 2-4`);
        if (!STICKERS[L.sticker]) errors.push(`${at}: unknown sticker "${L.sticker}"`);
        if (!L.title?.en || !L.title?.es) errors.push(`${at}: title must be bilingual`);
        if (!Array.isArray(L.pool) || L.pool.length < L.pairs)
          errors.push(`${at}: pool smaller than the pair count`);
        const ids = new Set();
        (L.pool || []).forEach((it) => {
          const id = `${at}/${it.id}`;
          if (!it.id || ids.has(it.id)) errors.push(`${id}: ids must be unique`);
          ids.add(it.id);
          if (!it.word?.en || !it.word?.es || !it.match?.en || !it.match?.es)
            errors.push(`${id}: word and match must be bilingual`);
          if (words.has(it.word?.en)) errors.push(`${id}: word repeats in this band`);
          words.add(it.word?.en);
          const leak = (t, w) =>
            t && w && new RegExp(`\\b${w.slice(0, Math.max(4, w.length - 2))}`, "i").test(t);
          if (leak(it.match?.en, it.word?.en) || leak(it.match?.es, it.word?.es))
            errors.push(`${id}: the match card gives away the word`);
          if (L.kind === "picture" && !PICS.includes(it.pic))
            errors.push(`${id}: picture key "${it.pic}" is not in icons.js`);
          if (blankKind(L.kind)) {
            for (const lang of ["en", "es"])
              if ((it.match?.[lang] || "").split("___").length !== 2)
                errors.push(`${id}: ${lang} sentence needs exactly one ___ blank`);
          } else if (!it.use?.en || !it.use?.es)
            errors.push(`${id}: needs a bilingual example sentence`);
          if (
            it.use?.en &&
            it.word?.en &&
            !it.use.en.toLowerCase().includes(it.word.en.slice(0, 5).toLowerCase())
          )
            errors.push(`${id}: example sentence must use the word`);
        });
      });
    }
    return errors;
  },
};

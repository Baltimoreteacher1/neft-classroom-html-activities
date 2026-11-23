// Context Detective — a short case file with one mystery word. Step 1: highlight the clue words that point to
// the meaning. Step 2: pick the sense that fits the case. Clue words are the words of the case that share an
// idea with the word's own data (definition, synonyms, opposites, related idea, non-example, uses), so the
// "right clues" are traceable to the unit. "Show me a clue" is a support, never a miss.
import {
  choicesHTML,
  fbHTML,
  hintButton,
  html,
  icon,
  mcAct,
  mcFeedback,
  mountGame,
} from "./kit.js";
import { locateInPassage, passageSentences, sensesOf } from "./data.js";
import { buildQuestion, newMc } from "./questions.js";
import { mem, playOnce, rose } from "./stage-a.js";
import { findForm, formsOf, isContent, norm, tokenize } from "./text.js";

export const TITLE = ["Context Detective", "Detective del contexto"];
const CASES = { early: 4, "upper-elem": 5, middle: 6, high: 6 };
const stemOf = (t) =>
  norm(t)
    .replace(/^['-]+|['-]+$/g, "")
    .slice(0, 5);

/** Stems of the ideas a word's own data connects to its meaning. */
export function clueStems(word, skip = "") {
  const own = new Set(formsOf(word).map(stemOf));
  const bits = [
    word.def,
    word.rel,
    word.nonExample,
    word.misuse?.why,
    word.ex,
    word.ex2,
    word.cloze?.s,
    word.cloze2?.s,
    ...(word.syn || []),
    ...(word.ant || []),
    ...Object.values(word.apps || {}),
    ...(word.senses || []).map((s) => s.def),
  ];
  const out = new Set();
  for (const b of bits.filter((x) => !skip || norm(x || "") !== norm(skip)))
    for (const t of tokenize(String(b || "")))
      if (t.w && isContent(t.t) && !own.has(stemOf(t.t))) out.add(stemOf(t.t));
  return out;
}
/** Token indexes (into tokenize(text)) of the words in `text` that are real clues for `word`. */
export function clueTokens(text, word) {
  const stems = clueStems(word, text);
  const own = new Set(formsOf(word).map(stemOf));
  return tokenize(text)
    .filter((t) => t.w && isContent(t.t) && stems.has(stemOf(t.t)) && !own.has(stemOf(t.t)))
    .map((t) => t.i);
}
export const isTargetToken = (tok, word) =>
  tok.w && formsOf(word).includes(norm(tok.t).replace(/^['-]+|['-]+$/g, ""));

function sourceText(pool, sentences, word, senseIdx, sense) {
  if (senseIdx > 0)
    return sense.example && findForm(sense.example, word)
      ? { text: sense.example, from: "sense" }
      : null;
  const at = locateInPassage(sentences, word);
  if (at >= 0) {
    const cur = sentences[at];
    const prev = at > 0 && sentences[at - 1].p === cur.p ? sentences[at - 1].text : "";
    const both = prev ? `${prev} ${cur.text}` : cur.text;
    return { text: both.length <= 240 ? both : cur.text, from: "passage" };
  }
  for (const [k, s] of [
    ["ex", word.ex],
    ["ex2", word.ex2],
  ])
    if (s && findForm(s, word)) return { text: s, from: k };
  return null;
}

function senseQuestion(pool, word, senses, idx, text, rng) {
  if (senses.length >= 2) {
    const mine = senses[idx];
    const takenDefs = new Set(senses.map((s) => norm(s.def)));
    const extra = rng
      .shuffle(pool.all.filter((w) => w.id !== word.id && w.def && !takenDefs.has(norm(w.def))))
      .slice(0, 1)
      .map((w) => w.def);
    const all = rng.shuffle([...senses.slice(0, 3).map((s) => s.def), ...extra]);
    const answer = all.indexOf(mine.def);
    if (answer < 0) return null;
    return {
      type: "sense",
      wordId: word.id,
      dim: "ctx",
      stem: `Read the case. Which meaning of “${word.hw}” fits it?`,
      sentence: text,
      say: text,
      choices: all,
      answer,
      hint: `Look at the clue words. Which meaning of “${word.hw}” makes sense with them?`,
      why: `Here “${word.hw}” means: ${mine.def}`,
    };
  }
  const q = buildQuestion("word-def", word, pool, rng);
  if (!q) return null;
  return {
    ...q,
    type: "sense",
    dim: "ctx",
    stem: `Read the case. What does “${word.hw}” mean here?`,
    sentence: text,
    say: text,
  };
}

/** Pure engine: cases built from the passage first, then the word's own sentences. */
export function buildCases(pool, rng, { count } = {}) {
  const sentences = passageSentences(pool);
  const out = [];
  for (const word of rng.shuffle(pool.words)) {
    const senses = sensesOf(word);
    const idxs = senses.length >= 2 ? [0, 1] : [0];
    for (const k of idxs) {
      const src = sourceText(pool, sentences, word, k, senses[k]);
      if (!src) continue;
      const q = senseQuestion(pool, word, senses, k, src.text, rng);
      if (!q) continue;
      out.push({
        wordId: word.id,
        text: src.text,
        from: src.from,
        title: src.from === "passage" ? pool.passage?.title || "" : "",
        clue: clueTokens(src.text, word),
        q: { ...q, id: `cd-${out.length + 1}` },
      });
    }
  }
  // one case per word before any second sense of the same word
  const seen = new Set();
  const first = out.filter((c) => (seen.has(c.wordId) ? false : (seen.add(c.wordId), true)));
  const second = out.filter((c) => !first.includes(c));
  return [...first, ...second].slice(0, count || CASES[pool.band] || 5).map((c) => ({
    ...c,
    phase: c.clue.length ? "clue" : "sense",
    sel: [],
    tries: 0,
    good: [],
    weak: [],
    assist: -1,
    mc: newMc(),
  }));
}

/** Judge the chosen clue words. Pure: returns { ok, good, weak }. A pick with at least one real clue passes. */
export function judgeClues(c) {
  const good = c.sel.filter((i) => c.clue.includes(i));
  const weak = c.sel.filter((i) => !c.clue.includes(i));
  return { ok: good.length >= 1, good, weak };
}

function caseText(c, s, env) {
  const word = env.pool.byId.get(c.wordId);
  const I = env.I;
  const toks = tokenize(c.text);
  const out = toks.map((t) => {
    if (!t.w) return html`${t.t}`;
    if (isTargetToken(t, word))
      return html`<mark class="vag-target"
        >${t.t}<span class="vag-sr">
          (${I.S("the mystery word", "la palabra misterio")})</span
        ></mark
      >`;
    if (c.phase !== "clue" && !c.good.includes(t.i)) return html`${t.t}`;
    const on = c.sel.includes(t.i);
    const isGood = c.good.includes(t.i);
    const isWeak = c.weak.includes(t.i);
    const assist = c.assist === t.i;
    if (!isContent(t.t) && !on) return html`${t.t}`;
    if (c.phase !== "clue")
      return html`<span class="vag-tok is-good"
        >${icon("check")}${t.t}<span class="vag-sr">
          (${I.S("a good clue", "una buena pista")})</span
        ></span
      >`;
    return html`<button
      type="button"
      class="vag-tok ${on ? "is-on" : ""} ${isWeak ? "is-weak" : ""} ${assist ? "is-assist" : ""}"
      data-tok="${t.i}"
      data-fk="tok-${t.i}"
      data-rv
      aria-pressed="${on}"
    >
      ${on ? icon("check") : assist ? icon("star") : ""}${t.t}${isWeak ? html`<span class="vag-sr"> (${I.S("not a strong clue", "no es una pista fuerte")})</span>` : ""}${assist ? html`<span class="vag-sr"> (${I.S("a clue", "una pista")})</span>` : ""}
    </button>`;
  });
  return html`<p
    class="vag-casetext"
    data-rove
    data-cols="0"
    role="group"
    aria-label="${I.S("The case file. Choose the clue words.", "El expediente. Elige las palabras pista.")}"
  >
    ${out}
  </p>`;
}

/** The evidence board: the case text with an overlay the strings are drawn on (see drawStrings). Decoration only. */
const evidence = (c, s, env) =>
  html`<div class="vga-evidence">${caseText(c, s, env)}<svg class="vga-strings" aria-hidden="true" focusable="false"></svg></div>`;

const pinnedCount = (c, I) => {
  const n = c.phase === "clue" ? c.sel.length : c.good.length;
  return html`<p class="vga-pinned">${icon("pin")}<span>${I.T("Clues pinned", "Pistas clavadas")}: <strong>${n}</strong></span></p>`;
};

const fileTab = (s, I) =>
  html`<span class="vga-tab" aria-hidden="true">${I.T("Case file", "Expediente")} ${String(s.i + 1).padStart(2, "0")}</span>`;

/** Draw a string from each pinned clue to the mystery word. The strings are a picture of what is already said in words. */
export function drawStrings(body) {
  const board = body.querySelector(".vga-evidence");
  const svg = board?.querySelector(".vga-strings");
  if (!svg) return;
  const box = board.getBoundingClientRect();
  const target = board.querySelector(".vag-target");
  svg.setAttribute("viewBox", `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`);
  svg.replaceChildren();
  if (!target) return;
  const t = target.getBoundingClientRect();
  const tx = t.left + t.width / 2 - box.left;
  const ty = t.top - box.top + 2;
  const toks = [...board.querySelectorAll(".vag-tok.is-on, .vag-tok.is-good")];
  toks.forEach((tok, i) => {
    const r = tok.getBoundingClientRect();
    const x = r.left + r.width / 2 - box.left;
    const y = r.top - box.top + 2;
    const lift = 16 + (i % 3) * 6;
    const d = `M${x.toFixed(1)} ${y.toFixed(1)} Q${((x + tx) / 2).toFixed(1)} ${(Math.min(y, ty) - lift).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "vga-string");
    path.style.setProperty("--i", String(i));
    svg.append(path);
  });
}

const spec = {
  id: "context-detective",
  title: TITLE,
  howTo: [
    [
      "Read the case. One word is the mystery word. It is shaded.",
      "Lee el caso. Una palabra es la palabra misterio. Está sombreada.",
    ],
    [
      "Step 1: tap the words around it that help you work out its meaning, then choose Check my clues.",
      "Paso 1: toca las palabras que te ayudan a entender su significado y elige Revisar mis pistas.",
    ],
    [
      "Step 2: choose the meaning that fits the case.",
      "Paso 2: elige el significado que encaja en el caso.",
    ],
    [
      "Stuck? Choose Show me a clue. It never counts against you. You can try again as often as you like.",
      "¿Atascado? Elige Muéstrame una pista. Nunca cuenta en tu contra. Puedes intentar otra vez.",
    ],
  ],
  keys: [
    ["Left and right arrows", ["move between words", "moverse entre palabras"]],
    ["Enter or Space", ["pick or unpick a clue word", "elegir o quitar una palabra pista"]],
    ["1 to 4", ["choose a meaning in step 2", "elegir un significado en el paso 2"]],
  ],

  build(env) {
    return { cases: buildCases(env.pool, env.rng), i: 0 };
  },
  valid: (s) => Array.isArray(s?.cases) && s.cases.length > 0,
  unplayable: (s) => !s.cases.length,
  isDone: (s) => s.i >= s.cases.length,
  progress: (s) => ({ done: Math.min(s.i, s.cases.length), total: s.cases.length }),

  view(s, env) {
    const I = env.I;
    const c = s.cases[s.i];
    const word = env.pool.byId.get(c.wordId);
    const head = html`<p class="vag-qtype">
      <strong>${I.T("Case", "Caso")} ${s.i + 1} ${I.T("of", "de")} ${s.cases.length}</strong> ·
      ${c.phase === "clue" ? I.T("Step 1: find the clues", "Paso 1: encuentra las pistas") : I.T("Step 2: pick the meaning", "Paso 2: elige el significado")}
      ${c.title ? html`<span class="vag-badge">${icon("reading")}${c.title}</span>` : ""}
    </p>`;
    if (c.phase === "clue") {
      const picked = c.sel.length;
      const fb =
        c.weak.length && !c.good.length
          ? fbHTML(
              "retry",
              I.T(
                "Those words do not tell much about the mystery word. Look for words about the idea it stands for.",
                "Esas palabras no dicen mucho sobre la palabra misterio. Busca palabras sobre la idea que representa.",
              ),
              I,
            )
          : "";
      return html`<div class="vag-qcard vag-case vga-board" data-phase="clue">
        ${fileTab(s, I)}${head}
        <p class="vag-q">
          ${I.T(`Which words help you work out what “${word.hw}” means? Tap them.`, `¿Qué palabras te ayudan a entender qué significa “${word.hw}”? Tócalas.`)}
        </p>
        ${evidence(c, s, env)} ${pinnedCount(c, I)} ${env.speakBtn(c.text, "")}
        <div class="vag-actions">
          <button
            type="button"
            class="btn btn-primary"
            data-check-clues
            data-fk="check"
            ${picked ? "" : 'aria-disabled="true"'}
          >
            ${icon("search")}${I.T("Check my clues", "Revisar mis pistas")}
          </button>
          <button type="button" class="btn small" data-show-clue data-fk="assist">
            ${icon("bulb")}${I.T("Show me a clue", "Muéstrame una pista")}
          </button>
          <button type="button" class="btn small" data-skip-clues data-fk="skip">
            ${I.T("Skip to the meaning", "Ir al significado")}
          </button>
        </div>
        ${fb}
        ${c.assist >= 0 ? fbHTML("hint", I.T("A clue word is marked with a star. Tap it.", "Una palabra pista tiene una estrella. Tócala."), I) : ""}
      </div>`;
    }
    const q = c.q;
    const found = c.good.length
      ? fbHTML(
          "ok",
          I.T(
            "Good detective work. The clue words you found point to the meaning.",
            "Buen trabajo de detective. Las pistas que encontraste apuntan al significado.",
          ),
          I,
        )
      : "";
    return html`<div class="vag-qcard vag-case vga-board" data-phase="sense" data-solved="${c.mc.done}">
      ${fileTab(s, I)}${head}
      <p class="vag-q">${q.stem}</p>
      ${evidence(c, s, env)} ${c.good.length ? pinnedCount(c, I) : ""} ${found}
      ${c.mc.done ? html`<span class="vga-stamp" aria-hidden="true"><b>${I.T("Case solved", "Caso resuelto")}</b><i lang="en">${word.hw}</i></span>` : ""}
      ${choicesHTML(q, c.mc, env)}
      <div class="vag-actions">
        ${hintButton(c.mc, env)}${c.mc.done ? html`<button type="button" class="btn btn-primary" data-next-case data-fk="next" data-autofocus>${s.i + 1 >= s.cases.length ? I.T("Close the files", "Cerrar los casos") : I.T("Next case", "Siguiente caso")}${icon("arrow-right")}</button>` : ""}
      </div>
      ${mcFeedback(q, c.mc, env)}
    </div>`;
  },

  click(el, s, env) {
    const c = s.cases[s.i];
    if (c.phase === "clue") {
      const tok = el.closest("[data-tok]");
      if (tok) {
        const i = Number(tok.dataset.tok);
        c.sel = c.sel.includes(i) ? c.sel.filter((x) => x !== i) : [...c.sel, i];
        c.weak = c.weak.filter((x) => c.sel.includes(x));
        c.assist = c.assist === i ? -1 : c.assist;
        return true;
      }
      if (el.closest("[data-show-clue]")) {
        const next = c.clue.find((i) => !c.sel.includes(i));
        if (next == null) return false;
        c.assist = next;
        env.use("model");
        env.say(
          env.I.S("One clue word is marked with a star.", "Una palabra pista tiene una estrella."),
        );
        return true;
      }
      if (el.closest("[data-skip-clues]")) {
        c.phase = "sense";
        env.use("model");
        return true;
      }
      if (el.closest("[data-check-clues]")) {
        if (!c.sel.length) {
          env.say(env.I.S("Tap at least one word first.", "Toca al menos una palabra primero."));
          return false;
        }
        const first = c.tries === 0;
        const r = judgeClues(c);
        c.tries += 1;
        env.report({
          wordId: c.wordId,
          dim: "ctx",
          ok: r.ok,
          firstTry: first && r.ok && !r.weak.length,
          kind: "clue",
        });
        c.weak = r.weak;
        if (r.ok) {
          c.good = r.good;
          c.phase = "sense";
          env.say(env.I.S("You found a real clue.", "Encontraste una pista de verdad."));
        } else {
          c.sel = [];
          env.say(
            env.I.S(
              "Not a strong clue. Try other words.",
              "No es una pista fuerte. Prueba otras palabras.",
            ),
          );
        }
        return true;
      }
      return false;
    }
    if (el.closest("[data-next-case]")) {
      if (!c.mc.done) return false;
      s.i += 1;
      return true;
    }
    return mcAct(el, c.q, c.mc, env, { kind: "sense" });
  },
  after(body, s, env) {
    if (!s.cases[s.i]) return;
    drawStrings(body);
    const m = mem(env);
    if (!m.onResize) {
      m.onResize = () => {
        const b = document.querySelector(".vag[data-game='context-detective'] .vag-body");
        if (b) drawStrings(b);
      };
      window.addEventListener("resize", m.onResize);
    }
    const c = s.cases[s.i];
    if (rose(env, `solved-${s.i}`, c.mc.done)) playOnce(body.querySelector(".vga-stamp"), "is-stamping");
  },
  destroy(env) {
    const m = mem(env);
    if (m.onResize) window.removeEventListener("resize", m.onResize);
  },
  extra: (s) => ({ cases: s.cases.length }),
};

export default {
  id: "context-detective",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb: "Open a short case file, highlight the clue words, then pick the meaning that fits.",
  blurbEs: "Abre un caso corto, marca las palabras pista y elige el significado que encaja.",
  purpose: "Learn to use the words around a new word to work out what it means.",
  minGrade: "K",
  maxGrade: "12",
  dims: ["ctx", "mean"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: { build: buildCases, judge: judgeClues, clues: clueTokens },
};

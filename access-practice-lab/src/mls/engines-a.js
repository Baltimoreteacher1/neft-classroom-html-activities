// Math Literacy Studio: instructional engines A. Six student-facing activities that take ANY skill of the inventory:
//   reading-lab, anatomy, sentence-studio, translator, vocab-explorer, talk-studio.
// Contract: ENGINES[id] = { title, blurb, mount(el, { skill, band, level, seed, support, ctx }) -> { destroy() } }.
//   skill  a merged skill (inventory record + authored content, see merge.js)
//   band   language support band "1-2" | "3-4" | "5-6" (lang.js); changes only the words around the mathematics
//   level  math level 1-3; changes the numbers, never the language
// Rules every engine keeps: DOM built with textContent (only generated SVG uses innerHTML); state changes are announced; feedback always
// carries a word and a mark; device speech only through hearButton and always called the device voice; a wrong answer gets a hint ladder
// (concept, procedure, then a worked PARALLEL example from another seed, never the current answer); no timers, no stored or sent
// student data (everything lives in the closure); every control is a real button, input or textarea.
import { ensureStylesheet } from "../util.js";
import { MINUS, NAMES, CONTEXTS, choicesOf, makeRng, numerals } from "./kit.js";
import { generate } from "./families.js";
import { renderVisual } from "./visuals.js";
import { SPANISH_NOTE, FRAMES, TALK_STEMS, bandOf, checkSentence, framesFor, sentenceSteps, textLevelOf, wordBank } from "./lang.js";
import { clear, feedback, h, hearButton, makeLadder, problemText, say, stopSpeech, styles } from "./ui-kit.js";
import { getSkill } from "./model.js";

// ------------------------------------------------------------------------------------------------------------------ small helpers
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lc1 = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const clampN = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const strip = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const noEnd = (s) => strip(s).replace(/[.!?]+$/, "");
const sentencesOf = (t) => strip(t).split(/(?<=[.!?])\s+/).filter(Boolean);
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BAND_KEYS = ["1-2", "3-4", "5-6"];
let uidN = 0;
const uid = (p) => `mlea-${p}-${++uidN}`;
const keyOfNums = (p) => numerals(`${p.stem.standard} ${p.ask.standard}`).sort().join("|");
const textOf = (p, lv) => [p.stem[lv] || "", p.ask[lv] || ""].filter(Boolean).join(" ");

function loadStyles() {
  try {
    ensureStylesheet("mls-play-engines-a.css");
  } catch {}
  try {
    styles().catch(() => {});
  } catch {}
}

/** A picture from a Visuals spec. The SVG is produced by renderVisual from numbers, never from free text. */
function visualNode(spec, cls = "mlea-vis") {
  try {
    const r = renderVisual(spec);
    const box = h("div", { class: cls });
    box.innerHTML = r.svg;
    return { node: box, alt: r.alt, summary: r.summary };
  } catch {
    return null;
  }
}
const visualKey = (spec) => {
  const { alt, ...rest } = spec || {};
  return JSON.stringify(rest);
};

// ------------------------------------------------------------------------------------------------------------------ answers
const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
const ratio = (n, d) => {
  const g = gcd(n, d);
  return d < 0 ? { n: -n / g, d: -d / g } : { n: n / g, d: d / g };
};
/** One numeric token as an exact rational: 1344, 1,344, .5, 0.50, 3/4, 1 1/2, -2, $4.50, 25%. null when it is not a single number. */
export function ratOf(str) {
  let s = String(str ?? "").trim().replace(/[−–—]/g, "-").replace(/(\d),(?=\d{3}(\D|$))/g, "$1").replace(/[$€£]/g, "").replace(/%$/, "").trim();
  const sign = /^-/.test(s) ? -1 : 1;
  s = s.replace(/^[-+]\s*/, "");
  let m;
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return +m[3] ? ratio(sign * (+m[1] * +m[3] + +m[2]), +m[3]) : null;
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return +m[2] ? ratio(sign * +m[1], +m[2]) : null;
  if ((m = s.match(/^(\d*)\.(\d+)$/))) {
    const d = 10 ** m[2].length;
    return ratio(sign * (+(m[1] || 0) * d + +m[2]), d);
  }
  if (/^\d+$/.test(s)) return ratio(sign * +s, 1);
  return null;
}
const normText = (s) => String(s ?? "").toLowerCase().replace(/[−–—]/g, "-").replace(/[×·*]/g, "x").replace(/÷/g, "/").replace(/\s+/g, "").replace(/[.,;:!?]+$/g, "");
/** Does a typed answer equal the problem's answer? Equivalent forms pass (1,344 = 1344, .5 = 0.5 = 1/2); units are optional. */
export function sameAnswer(input, answer) {
  const raw = strip(input);
  if (!raw) return false;
  const kind = answer.kind;
  const val = String(answer.value);
  if (kind === "bool") {
    const t = raw.toLowerCase();
    return (/^(yes|true|y)$/.test(t) ? "true" : /^(no|false|n)$/.test(t) ? "false" : "") === val;
  }
  if (kind === "pair" || kind === "set") {
    const a = numerals(raw);
    const b = numerals(val);
    if (kind === "set") {
      a.sort();
      b.sort();
    }
    return a.length === b.length && a.every((x, i) => ratOf(x) && ratOf(b[i]) && ratOf(x).n === ratOf(b[i]).n && ratOf(x).d === ratOf(b[i]).d);
  }
  const mm = raw.match(/^\s*([−–-]?\s*\$?\s*\d[\d.,/ ]*|[−–-]?\s*\.\d+)\s*(%?)\s*([A-Za-z°²³][A-Za-z°²³ ./]*)?\s*$/);
  const want = ratOf(val);
  if (mm && want) {
    const got = ratOf(mm[1].replace(/\s+$/, ""));
    if (got && got.n === want.n && got.d === want.d) return true;
  }
  if (kind === "int" || kind === "frac" || kind === "dec") return false;
  const targets = [answer.text, val].map(normText);
  const t = normText(raw);
  const u = answer.unit ? normText(answer.unit) : "";
  return targets.includes(t) || (u && targets.some((x) => `${x}${u}` === t));
}
const isTypedKind = (p) => ["int", "frac", "dec"].includes(p.answer.kind);

/** "The picture shows 7, but the story says 9." A specific, answer-free difference between two representations, or null. */
function numberDiff(srcNums, candNums, srcName, candName) {
  const miss = srcNums.filter((n) => !candNums.includes(n));
  const extra = candNums.filter((n) => !srcNums.includes(n));
  if (miss.length && extra.length) return `${cap(candName)} shows ${extra[0]}, but ${srcName} says ${miss[0]}.`;
  if (miss.length) return `${cap(srcName)} says ${miss[0]}, but I cannot find ${miss[0]} in ${candName}.`;
  if (extra.length) return `${cap(candName)} has ${extra[0]}, which ${srcName} does not say.`;
  return null;
}

// ------------------------------------------------------------------------------------------------------------------ expression helpers
const OPS = { "+": (a, b) => a + b, [MINUS]: (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => (b ? a / b : NaN) };
/** The same two numbers with a different operation (only when the result really differs), so a foil is a real misreading. */
function swapOps(expr) {
  const m = String(expr).match(/^(\s*)(\d+(?:\.\d+)?)(\s*)([+−×÷])(\s*)(\d+(?:\.\d+)?)(.*)$/);
  if (!m) return [];
  const [, s0, a, s1, op, s2, b, rest] = m;
  const base = OPS[op](+a, +b);
  return Object.keys(OPS)
    .filter((o) => o !== op)
    .filter((o) => {
      const v = OPS[o](+a, +b);
      return Number.isFinite(v) && Math.abs(v - base) > 1e-9 && (o !== "÷" || Number.isInteger(v));
    })
    .map((o) => `${s0}${a}${s1}${o}${s2}${b}${rest}`);
}

// ------------------------------------------------------------------------------------------------------------------ reading a stem
const STOP = new Set("in on at for to of and or each every is are was were has have had from with by than more fewer less a an the that into per as so then it its how what which who many much do does did can will if when".split(" "));
const NAME_RE = new RegExp(`\\b(${NAMES.join("|")})\\b`, "g");
const PLACE_RE = new RegExp(Object.values(CONTEXTS).map((c) => escRe(c.place)).join("|"), "gi");
const QTY_RE = /(?<![\w.])([−-]?\$?\d[\d,]*(?:\.\d+)?(?:\s\d+\/\d+|\/\d+|:\d+)?%?)/g;
/** Split text into plain / qty (a numeral and the up-to-two words it counts) / detail (names and places the mathematics does not need). */
function segmentize(text) {
  const segs = [];
  let last = 0;
  QTY_RE.lastIndex = 0;
  let m;
  while ((m = QTY_RE.exec(text))) {
    let tail = "";
    let rest = text.slice(m.index + m[0].length);
    for (let k = 0; k < 2; k++) {
      const mm = rest.match(/^\s+([A-Za-z][A-Za-z'’-]*)/);
      if (!mm || STOP.has(mm[1].toLowerCase()) || NAMES.includes(mm[1])) break;
      tail += mm[0];
      rest = rest.slice(mm[0].length);
    }
    if (m.index > last) segs.push({ t: text.slice(last, m.index), k: "plain" });
    segs.push({ t: m[0] + tail, k: "qty", value: m[0], label: strip(tail) });
    last = m.index + m[0].length + tail.length;
    QTY_RE.lastIndex = last;
  }
  if (last < text.length) segs.push({ t: text.slice(last), k: "plain" });
  const out = [];
  for (const s of segs) {
    if (s.k !== "plain") {
      out.push(s);
      continue;
    }
    const re = new RegExp(`${NAME_RE.source}|${PLACE_RE.source}`, "gi");
    let at = 0;
    let d;
    while ((d = re.exec(s.t))) {
      if (d.index > at) out.push({ t: s.t.slice(at, d.index), k: "plain" });
      out.push({ t: d[0], k: "detail" });
      at = d.index + d[0].length;
    }
    if (at < s.t.length) out.push({ t: s.t.slice(at), k: "plain" });
  }
  return out;
}
/** The quantities of a problem as { value, label }: authored structure first, otherwise honest numerals with the words they count. */
function quantitiesOf(p, text) {
  if (p.structure?.known?.length) return p.structure.known.map((k) => ({ value: String(k.value), label: strip(k.label) }));
  const seen = new Set();
  return segmentize(text)
    .filter((s) => s.k === "qty" && s.label)
    .map((s) => ({ value: s.value, label: s.label }))
    .filter((q) => (seen.has(q.label.toLowerCase()) ? false : seen.add(q.label.toLowerCase())));
}
const unknownOf = (p, W) => strip(p.structure?.unknown) || `what the question asks: ${noEnd(p.ask[W] || p.ask.standard)}`;
const MODEL_NAMES = ["equal groups (tape diagram)", "number line", "ratio table", "area model", "bar graph", "array of rows and columns", "balance with an equation", "place-value blocks", "fraction strip", "table of pairs", "function machine", "part-whole tape diagram"];
const VISUAL_NAMES = { tenframe: "ten frame", counters: "counters", bond: "number bond", placevalue: "place-value blocks", numberline: "number line", array: "array of rows and columns", areamodel: "area model", fracstrip: "fraction strip", fracshape: "fraction shape", clock: "clock", bar: "bar graph", lineplot: "line plot", boxplot: "box plot", coord: "coordinate grid", tape: "tape diagram", ratiotable: "ratio table", doublenl: "double number line", table: "table", shape: "shape", prism: "rectangular prism", rect: "rectangle with labeled sides", angle: "angle", circle: "circle", triangle: "triangle", balance: "balance", tiles: "algebra tiles", scatter: "scatter plot", spinner: "spinner", ruler: "ruler", machine: "function machine" };

// ------------------------------------------------------------------------------------------------------------------ environment
function makeEnv(el, opts, id) {
  const skill = opts.skill || {};
  const E = {
    id,
    el,
    skill,
    band: bandOf(opts.band || "3-4"),
    level: clampN(Number(opts.level) || 1, 1, 3),
    ctx: opts.ctx || skill.contexts?.[0] || "store",
    seed: Number(opts.seed) || 1,
    touched: false,
    alive: true,
  };
  E.W0 = textLevelOf(E.band);
  clear(el);
  el.classList.add("ml-stage");
  E.root = h("div", { class: `mlea-root mlea-${id}`, "data-mlea": id });
  el.append(E.root);
  E.root.append(h("p", { class: "ml-sr", role: "status", "aria-live": "polite", "data-ml-live": "" }));
  E.say = (msg) => say(E.root, msg);
  E.gen = (seed, lv = E.level) => {
    try {
      return generate(skill.familyId, skill.params || {}, { seed, level: lv, ctx: E.ctx });
    } catch {
      return null;
    }
  };
  /** Problem number `round` of this session: reproducible from (seed, round). */
  E.problem = (round) => E.gen((E.seed * 7919 + round) % 2147483000 || 1);
  E.others = (p, n, accept = () => true, from = (p.seed || 1) + 1, span = 60) => {
    const out = [];
    const keys = new Set([JSON.stringify(p.spec)]);
    for (let s = from, i = 0; out.length < n && i < span; s++, i++) {
      const q = E.gen(s);
      if (!q) continue;
      const k = JSON.stringify(q.spec);
      if (keys.has(k) || !accept(q)) continue;
      keys.add(k);
      out.push(q);
    }
    return out;
  };
  E.parallel = (p) => E.others(p, 1, (q) => q.answer.value !== p.answer.value && keyOfNums(q) !== keyOfNums(p), (p.seed || 1) + 101)[0] || null;
  E.terms = () => (skill.vocab || []).map((v) => v.term);
  E.cleanups = [];
  E.destroy = () => {
    E.alive = false;
    stopSpeech();
    for (const f of E.cleanups) {
      try {
        f();
      } catch {}
    }
    clear(el);
  };
  return E;
}

/** Wrap an engine so a thrown error becomes a calm message and a data attribute (the test reads it), never a blank page. */
function guarded(id, impl) {
  return (el, opts = {}) => {
    loadStyles();
    try {
      return impl(el, opts);
    } catch (e) {
      console.error(`[mls ${id}]`, e);
      clear(el);
      el.setAttribute("data-mlea-error", String(e?.message || e));
      el.append(h("p", { class: "ml-fb ml-fb-try", role: "status" }, h("strong", {}, "Not yet. "), "This activity could not start. Choose Start over or another activity."));
      return { destroy() { clear(el); } };
    }
  };
}
/** A skill whose problem family is not registered (yet) gets a plain notice instead of an error. */
function notReady(E, what) {
  E.root.append(h("div", { class: "mlea-card", "data-mlea-notready": "" }, h("p", {}, `${what} is not ready for this skill yet.`), h("p", { class: "fine" }, "Choose another activity or another skill.")));
  return { destroy: E.destroy };
}

// ------------------------------------------------------------------------------------------------------------------ shared widgets
const panel = (id, title, ...kids) => {
  const hid = uid("h");
  return h("section", { class: "mlea-panel", "data-mlea-stage": id, "aria-labelledby": hid }, h("h3", { id: hid, tabindex: "-1" }, title), ...kids);
};
const fbBox = () => h("div", { class: "ml-fb", "data-mlea-fb": "" });
const wordChips = (words) => h("p", { class: "mlea-wb" }, h("strong", {}, "Word bank: "), words.map((w) => h("span", { class: "mlea-chip" }, w)));
const wordsFor = (E) => {
  const w = wordBank(E.skill, E.band);
  return w.length ? w : wordBank(E.skill, "3-4");
};
/** An optional help block with its own switch. `make()` returns nodes; the learner can remove the help at any time. */
function helpBlock(label, on, make) {
  const box = h("div", { class: "mlea-help-body" });
  const input = h("input", { type: "checkbox", checked: on });
  const paint = () => {
    clear(box);
    if (input.checked) box.append(...make().filter(Boolean));
  };
  input.addEventListener("change", paint);
  paint();
  return h("div", { class: "mlea-help" }, h("label", { class: "mlea-toggle" }, input, h("span", {}, label)), box);
}
/** After a right answer: show the confirmation and let the learner choose when to move on (no timers, focus goes to the button). */
function holdNext(fb, fn, label = "Next step") {
  if (fb.parentElement?.querySelector("[data-mlea-next]")) return;
  const b = h("button", { type: "button", class: "btn primary", "data-mlea-next": "", onclick: fn }, label);
  fb.after(h("div", { class: "mlea-row" }, b));
  b.focus({ preventScroll: true });
}
const workedNode = (E, p) => {
  const q = E.parallel(p);
  if (!q) return h("p", { class: "fine" }, "Read the problem again slowly, or ask for a new problem.");
  const t = problemText(q, E.band);
  return h(
    "div",
    { class: "mlea-worked", role: "group", "aria-label": "Worked example with different numbers" },
    h("p", { class: "mlea-worked-h" }, "Worked example (different numbers)"),
    h("p", {}, [t.stem, t.ask].filter(Boolean).join(" ")),
    q.expr && h("p", { class: "mlea-expr" }, q.expr),
    h("ol", {}, q.work.map((w) => h("li", {}, w))),
    h("p", { class: "fine" }, "That is a different problem. Use its steps, not its answer.")
  );
};
/** Hint ladder for a stage: tips in order, then a worked example from another seed. Never states the current answer. */
function coachOf(E, p, box, tips) {
  let misses = 0;
  return {
    get misses() {
      return misses;
    },
    miss(specific) {
      misses += 1;
      E.touched = true;
      if (misses <= tips.length) {
        feedback(box, "try", [specific, tips[misses - 1]].filter(Boolean).join(" "));
      } else {
        feedback(box, "try", [specific, "Study this worked example with different numbers, then try again."].filter(Boolean).join(" "));
        box.append(workedNode(E, p));
      }
      E.say("Not yet. A hint is shown.");
      return misses;
    },
    ok(msg) {
      feedback(box, "ok", msg);
      E.say(`Yes. ${msg}`);
    },
    reset() {
      misses = 0;
      box.textContent = "";
      box.className = "ml-fb";
    },
  };
}
/** A group of option buttons. onPick(i) returns true (right) or false (not yet). Wrong picks stay clickable and say "Not this one". */
function choiceGroup(legend, options, onPick, { visual = false } = {}) {
  const box = h("div", { class: `mlea-choices${visual ? " mlea-choices-visual" : ""}`, role: "group", "aria-label": legend });
  let locked = false;
  const btns = options.map((o, i) => {
    const mark = h("span", { class: "mlea-mark" });
    const b = h(
      "button",
      {
        type: "button",
        class: "mlea-opt",
        "aria-label": o.aria || null,
        onclick: () => {
          if (locked) return;
          if (onPick(i, o) === true) {
            locked = true;
            b.classList.add("mlea-ok");
            mark.textContent = "✓ Yes";
            if (o.aria) b.setAttribute("aria-label", `${o.aria}. Yes.`);
            for (const x of btns) if (x !== b) x.disabled = true;
          } else {
            b.classList.add("mlea-tried");
            mark.textContent = "✗ Not this one";
            if (o.aria) b.setAttribute("aria-label", `${o.aria}. Not this one.`);
          }
        },
      },
      h("span", { class: "mlea-letter", "aria-hidden": "true" }, `${String.fromCharCode(65 + i)}.`),
      h("span", { class: "mlea-opt-body" }, o.label),
      mark
    );
    return b;
  });
  box.append(...btns);
  return { el: box, buttons: btns };
}
/** Shuffle a correct item among foils by a seed, so the right answer does not sit at one position. Returns [{...item, correct}]. */
function mix(key, correct, foils) {
  const rng = makeRng(key);
  return rng.shuffle([{ ...correct, correct: true }, ...foils.map((f) => ({ ...f, correct: false }))]);
}
const uniqueBy = (arr, f) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = f(x);
    return seen.has(k) ? false : seen.add(k);
  });
};
function inlineInput({ label, hint, onSubmit, inputAttrs = {}, button = "Check" }) {
  const id = uid("in");
  const input = h("input", { type: "text", id, autocomplete: "off", autocapitalize: "off", spellcheck: "false", ...inputAttrs });
  const form = h(
    "form",
    {
      class: "mlea-form",
      onsubmit: (e) => {
        e.preventDefault();
        onSubmit(input.value, input);
      },
    },
    h("label", { for: id, class: "mlea-label" }, label),
    hint && h("span", { class: "fine mlea-hint" }, hint),
    h("div", { class: "mlea-row" }, input, h("button", { type: "submit", class: "btn primary" }, button))
  );
  return { form, input };
}
/** A writing box with a shape check (never judges mathematics) and a model that appears only after an attempt. */
function writer(E, cfg) {
  const id = uid("tx");
  const area = h("textarea", { id, rows: cfg.rows || 3, "aria-describedby": `${id}-d`, spellcheck: "true" });
  const fb = fbBox();
  const modelBox = h("div", { class: "mlea-model", hidden: true });
  let attempts = 0;
  let okText = "";
  const frameBox = h("div", { class: "mlea-frames" });
  const frames = cfg.frames || [];
  const paintFrames = () => {
    clear(frameBox);
    if (!frames.length || !frameToggle.checked) return;
    frameBox.append(h("p", { class: "fine" }, "Sentence frame (fill in the blanks in your own words):"), h("ul", { class: "mlea-frame-list" }, frames.map((f) => h("li", {}, h("code", {}, f)))));
  };
  const frameToggle = h("input", { type: "checkbox", checked: Boolean(cfg.frameOn) });
  frameToggle.addEventListener("change", paintFrames);
  paintFrames();
  const minWords = cfg.minWords ?? { "1-2": 4, "3-4": 6, "5-6": 8 }[E.band];
  const check = () => {
    attempts += 1;
    E.touched = true;
    const text = strip(area.value);
    const r = checkSentence(text, { kind: cfg.kind || "none", targets: cfg.targets || [], minWords });
    const extra = text && cfg.extra ? cfg.extra(text) : [];
    const notes = [...r.notes, ...extra];
    if (cfg.model && modelBox.hidden) {
      modelBox.hidden = false;
      modelBox.append(h("p", { class: "mlea-model-h" }, "A model (yours can be different):"), typeof cfg.model === "string" ? h("p", { class: "mlea-modeltext" }, cfg.model) : cfg.model);
    }
    if (!notes.length) {
      feedback(fb, "ok", "The shape is right. Your teacher reads your words and checks the mathematics.");
      E.say("Yes. The shape is right.");
      okText = text;
      cfg.onOk?.(text);
    } else {
      feedback(fb, "try", notes.join(" "));
      E.say("Not yet. A note is shown.");
    }
  };
  const node = h(
    "div",
    { class: "mlea-writer" },
    h("label", { for: id, class: "mlea-label" }, cfg.label),
    h("p", { id: `${id}-d`, class: "fine" }, "The check looks only at the shape: the connecting word, the length and the ending. It cannot judge your ideas or your mathematics."),
    frames.length ? h("label", { class: "mlea-toggle" }, frameToggle, h("span", {}, "Show a sentence frame")) : null,
    frameBox,
    area,
    h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: check }, "Check my sentence")),
    fb,
    modelBox
  );
  return { node, area, get ok() { return okText; }, get attempts() { return attempts; } };
}

// ================================================================================================================ 1. Reading Lab
function readingLab(el, opts) {
  const E = makeEnv(el, opts, "reading-lab");
  const { skill, band } = E;
  let round = 0;
  let p = E.problem(0);
  if (!p) return notReady(E, "Reading Lab");
  let W = E.W0;
  let stageIdx = 0;
  let fade = band === "1-2" ? 0 : band === "3-4" ? 1 : 2;
  let struggled = 0;
  const saved = {};
  const scaffoldOn = (stage) => band === "1-2" || (band === "3-4" && (stage === "explain" || stage === "revise"));

  const card = h("div", { class: "mlea-card mlea-problem", "data-mlea-problem": "" });
  const doneList = h("ol", { class: "mlea-done", "aria-label": "Steps finished" });
  const stageHost = h("div", { class: "mlea-stagehost" });
  const wordingBtns = {};
  const text = () => textOf(p, W);
  const paintCard = () => {
    clear(card);
    const t = { stem: p.stem[W] || "", ask: p.ask[W] };
    card.append(h("h3", {}, "The problem"), t.stem ? h("p", { class: "mlea-stem" }, t.stem) : null, h("p", { class: "mlea-ask" }, t.ask));
    if (current()?.id === "quantities") card.hidden = true;
    else card.hidden = false;
  };
  const wording = h(
    "div",
    { class: "mlea-seg", role: "group", "aria-label": "Same problem, different words" },
    h("span", { class: "mlea-seg-l" }, "Same problem, different words:"),
    ...[
      ["plain", "Simpler words"],
      ["standard", "Grade words"],
      ["rich", "Richer words"],
    ].map(([lv, label]) => {
      const b = h("button", { type: "button", class: "btn small", "aria-pressed": String(lv === W), onclick: () => {
        W = lv;
        for (const [k, x] of Object.entries(wordingBtns)) x.setAttribute("aria-pressed", String(k === W));
        E.say(`${label}. The numbers are the same.`);
        paintCard();
        if (["question", "quantities"].includes(current()?.id)) showStage(true);
      } }, label);
      wordingBtns[lv] = b;
      return b;
    }),
    h("span", { class: "fine" }, "The numbers never change.")
  );
  const bar = h(
    "div",
    { class: "mlea-toolbar" },
    wording,
    h("div", { class: "mlea-row" },
      h("button", { type: "button", class: "btn", onclick: () => begin(round + 1) }, "New problem"),
      h("button", { type: "button", class: "btn", onclick: () => begin(round, true) }, "Start over"))
  );
  const root = E.root;
  root.append(
    h("p", { class: "mlea-note" }, "Decide from what is happening, not from one word."),
    bar,
    card,
    doneList,
    stageHost
  );

  // ---- stages
  const helpWords = (stage) => helpBlock("Word bank", scaffoldOn(stage), () => [wordChips(wordsFor(E))]);
  const helpPicture = (stage, withWords = true) =>
    helpBlock(p.visual ? "Picture and word bank" : "Word bank", scaffoldOn(stage), () => [
      p.visual ? visualNode(p.visual)?.node : null,
      withWords ? wordChips(wordsFor(E)) : null,
    ]);
  const tipsOf = (extra) => [extra, "Reread the problem slowly. What is happening, and what do you need to find out?"];
  const STAGES = [
    {
      id: "read",
      title: "Read or listen",
      build(done) {
        return panel(
          "read",
          "Read or listen",
          h("p", { class: "mlea-instr" }, "Read the problem. You can also listen with the device voice (a computer voice, not a person)."),
          h("div", { class: "mlea-row" }, hearButton(text(), "Hear the problem"), h("button", { type: "button", class: "btn primary", onclick: () => {
            stopSpeech();
            done("I read the problem.");
          } }, "I have read it")),
          helpPicture("read")
        );
      },
    },
    {
      id: "question",
      title: "Find the question",
      build(done) {
        const stemSentences = sentencesOf(p.stem[W] || "").filter((s) => !/\?$/.test(s));
        const askText = p.ask[W];
        const foils = stemSentences.slice(0, 2).map((s) => ({ label: s }));
        if (foils.length < 2) for (const q of E.others(p, 3, (q) => q.ask[W] !== askText)) if (foils.length < 3) foils.push({ label: q.ask[W] });
        if (foils.length < 2) return { skip: "There is only one sentence to choose." };
        const opts = mix(`${p.family}:${p.seed}:question`, { label: askText }, uniqueBy(foils, (f) => f.label).slice(0, 3));
        const fb = fbBox();
        const co = coachOf(E, p, fb, tipsOf("The question is the sentence that asks for something we do not know yet. The other sentences tell what we already know."));
        const g = choiceGroup("Choose the sentence that asks the question", opts, (i) => {
          if (opts[i].correct) {
            co.ok("That sentence is the question.");
            holdNext(fb, () => done(`"${noEnd(askText)}?"`));
            return true;
          }
          co.miss(/\?/.test(opts[i].label) ? "That asks about a different problem." : "That sentence tells something we know.");
          return false;
        });
        return panel("question", "Find the question", h("p", { class: "mlea-instr" }, "Which sentence is the question?"), g.el, fb, helpWords("question"));
      },
    },
    {
      id: "quantities",
      title: "Mark the quantities",
      build(done) {
        const segs = segmentize(text());
        const qtys = segs.filter((s) => s.k === "qty");
        if (!qtys.length) return { skip: "This problem has no written numbers to mark." };
        const body = h("p", { class: "mlea-marktext" });
        for (const s of segs) {
          if (s.k === "plain") body.append(s.t);
          else {
            const b = h("button", { type: "button", class: "mlea-span", "aria-pressed": "false", onclick: () => {
              s.on = b.getAttribute("aria-pressed") !== "true";
              b.setAttribute("aria-pressed", String(s.on));
            } }, s.t);
            s.btn = b;
            body.append(b);
          }
        }
        const fb = fbBox();
        const co = coachOf(E, p, fb, ["Count the amounts: each is a number with the thing it counts.", "Names and places are details. They do not change the numbers, so leave them unmarked."]);
        const check = () => {
          const missed = qtys.filter((s) => !s.on).length;
          const extra = segs.filter((s) => s.k === "detail" && s.on).length;
          if (!missed && !extra) {
            co.ok("You marked every quantity and no extra details.");
            holdNext(fb, () => done(`Quantities: ${qtys.map((s) => s.t).join(", ")}`));
            return;
          }
          co.miss([missed ? `${missed} quantity ${missed === 1 ? "is" : "are"} not marked yet.` : "", extra ? `${extra} marked ${extra === 1 ? "part is a detail" : "parts are details"} the mathematics does not need.` : ""].filter(Boolean).join(" "));
        };
        return panel("quantities", "Mark the quantities", h("p", { class: "mlea-instr" }, "Press each amount that matters: a number and what it counts. Leave names and places unmarked."), body, h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: check }, "Check my marks")), fb, helpWords("quantities"));
      },
    },
    {
      id: "connect",
      title: "Say what each quantity measures",
      build(done) {
        const qs = quantitiesOf(p, text()).slice(0, 4);
        if (!qs.length) return { skip: "These are bare numbers, so each one is just a number to work with." };
        const pool = qs.map((q) => q.label);
        const unk = p.structure?.unknown ? strip(p.structure.unknown) : "";
        const extraLabels = E.others(p, 3).flatMap((q) => quantitiesOf(q, textOf(q, W)).map((x) => x.label));
        const rows = [];
        for (const q of qs) {
          const foils = uniqueBy([...pool.filter((l) => l !== q.label), unk, ...extraLabels].filter((l) => l && l.toLowerCase() !== q.label.toLowerCase()), (l) => l.toLowerCase()).slice(0, 2);
          if (foils.length < 2) return { skip: "There are not enough quantities to compare." };
          rows.push({ q, opts: mix(`${p.family}:${p.seed}:connect:${q.value}`, { label: q.label }, foils.map((l) => ({ label: l }))) });
        }
        const fb = fbBox();
        const co = coachOf(E, p, fb, ["Find this number in the problem. What words are right next to it?", "A number always measures something. Say it as: this number counts or measures ___."]);
        let n = 0;
        const body = h("div", { class: "mlea-qrows" });
        for (const r of rows) {
          const g = choiceGroup(`What does ${r.q.value} measure?`, r.opts, (i) => {
            if (r.opts[i].correct) {
              n += 1;
              co.ok(`${r.q.value} measures ${r.q.label}.`);
              if (n === rows.length) holdNext(fb, () => done(rows.map((x) => `${x.q.value} = ${x.q.label}`).join("; ")));
              return true;
            }
            co.miss(`Check where ${r.q.value} appears in the problem.`);
            return false;
          });
          body.append(h("div", { class: "mlea-qrow" }, h("p", { class: "mlea-qq" }, "What does ", h("strong", {}, r.q.value), " measure?"), g.el));
        }
        return panel("connect", "Say what each quantity measures", h("p", { class: "mlea-instr" }, "Match each number to what it measures."), body, fb, helpWords("connect"));
      },
    },
    {
      id: "relationship",
      title: "Name the relationship",
      build(done) {
        const right = strip(p.structure?.relationship) || strip(skill.bigIdea);
        if (!right) return { skip: "No relationship statement is written for this skill." };
        let foils = (skill.misconceptions || []).map((m) => strip(m.belief)).filter((b) => b && b !== right);
        if (foils.length < 2) {
          const pre = (skill.prereq || []).map((id) => getSkill(id)).filter(Boolean).map((s) => strip(s.bigIdea)).filter((b) => b && b !== right);
          foils = [...foils, ...pre, "The numbers in a problem do not relate to each other.", "The order of the quantities never matters."];
        }
        foils = uniqueBy(foils, (x) => x).slice(0, 2);
        const opts = mix(`${p.family}:${p.seed}:rel`, { label: cap(right) }, foils.map((f) => ({ label: cap(f) })));
        const fb = fbBox();
        const co = coachOf(E, p, fb, tipsOf("Think about what is happening to the quantities. Which statement stays true when you test it with the numbers in this problem?"));
        const g = choiceGroup("Choose the relationship", opts, (i) => {
          if (opts[i].correct) {
            co.ok("That is how the quantities relate.");
            holdNext(fb, () => done(cap(right)));
            return true;
          }
          co.miss("That statement is a common mix-up, not how these quantities relate.");
          return false;
        });
        return panel("relationship", "Name the relationship", h("p", { class: "mlea-instr" }, "How do the quantities relate? Choose the statement that fits."), g.el, fb, helpPicture("relationship"));
      },
    },
    {
      id: "picture",
      title: "Choose a representation",
      build(done) {
        const fb = fbBox();
        const co = coachOf(E, p, fb, ["Compare the numbers in the picture with the numbers in the problem, one at a time.", "Check what each part of the picture stands for."]);
        if (p.visual) {
          const own = visualNode(p.visual);
          const key = visualKey(p.visual);
          const foilQs = E.others(p, 8, (q) => q.visual && visualKey(q.visual) !== key && q.visual.alt !== p.visual.alt).slice(0, 8);
          const foils = uniqueBy(foilQs, (q) => visualKey(q.visual)).map((q) => ({ q, v: visualNode(q.visual) })).filter((x) => x.v).slice(0, 2);
          if (!own || foils.length < 1) return { skip: "There is no second picture to compare with." };
          const opts = mix(`${p.family}:${p.seed}:pic`, { v: own, label: own.node, aria: own.alt }, foils.map((f) => ({ v: f.v, label: f.v.node, aria: f.v.alt })));
          const srcNums = numerals(text());
          const g = choiceGroup("Choose the picture that matches the problem", opts, (i) => {
            if (opts[i].correct) {
              co.ok("That picture matches the problem.");
              holdNext(fb, () => done("The picture that matches the problem."));
              return true;
            }
            co.miss(numberDiff(srcNums, numerals(opts[i].v.summary), "the problem", "that picture") || "That picture has the right numbers but a different arrangement. Check what each part stands for.");
            return false;
          }, { visual: true });
          return panel("picture", "Choose a representation", h("p", { class: "mlea-instr" }, "Which picture shows this problem?"), g.el, fb);
        }
        const model = strip(p.structure?.model);
        if (!model) return { skip: "No picture is drawn for this problem. In your notebook, draw one that shows what is happening." };
        const opts = mix(`${p.family}:${p.seed}:model`, { label: cap(model) }, MODEL_NAMES.filter((m) => m.toLowerCase() !== model.toLowerCase()).slice(0, 2 + (p.seed % 3)).slice(0, 2).map((m) => ({ label: cap(m) })));
        const g = choiceGroup("Choose a model that fits", opts, (i) => {
          if (opts[i].correct) {
            co.ok("That model fits what is happening.");
            holdNext(fb, () => done(cap(model)));
            return true;
          }
          co.miss("That model shows a different kind of situation.");
          return false;
        });
        return panel("picture", "Choose a representation", h("p", { class: "mlea-instr" }, "Which kind of model fits this problem?"), g.el, fb);
      },
    },
    {
      id: "equation",
      title: "Choose the number sentence",
      build(done) {
        if (!p.expr) return { skip: "This problem is solved without writing a number sentence first." };
        const srcNums = numerals(text());
        const swaps = swapOps(p.expr);
        const rng = makeRng(`${p.family}:${p.seed}:eqfoil`);
        const others = E.others(p, 6, (q) => q.expr && q.expr !== p.expr && q.answer.value !== p.answer.value && keyOfNums(q) !== keyOfNums(p)).map((q) => q.expr);
        const foils = uniqueBy([...(swaps.length ? [rng.pick(swaps)] : []), ...others], (x) => x).filter((x) => x !== p.expr).slice(0, 3);
        if (foils.length < 2) return { skip: "There is not a second number sentence to compare." };
        const opts = mix(`${p.family}:${p.seed}:eq`, { label: h("span", { class: "mlea-expr" }, p.expr), text: p.expr }, foils.map((f) => ({ label: h("span", { class: "mlea-expr" }, f), text: f })));
        const fb = fbBox();
        const lad = makeLadder(p);
        const g = choiceGroup("Choose the number sentence that matches the problem", opts, (i) => {
          if (opts[i].correct) {
            feedback(fb, "ok", "That number sentence matches what is happening.");
            E.say("Yes. That number sentence matches.");
            holdNext(fb, () => done(p.expr));
            return true;
          }
          E.touched = true;
          const specific = numberDiff(srcNums, numerals(opts[i].text), "the problem", "that sentence") || "The numbers match the problem, but check the operation: what is happening to the amounts?";
          const hint = lad.miss();
          if (hint) feedback(fb, "try", `${specific} ${hint}`);
          else {
            feedback(fb, "try", `${specific} Study this worked example with different numbers, then try again.`);
            fb.append(workedNode(E, p));
          }
          E.say("Not yet. A hint is shown.");
          return false;
        });
        return panel("equation", "Choose the number sentence", h("p", { class: "mlea-instr" }, "Which number sentence shows the relationship you named?"), g.el, fb, helpWords("equation"));
      },
    },
    {
      id: "solve",
      title: "Solve",
      build(done) {
        const fb = fbBox();
        const lad = makeLadder(p);
        const typed = isTypedKind(p);
        const finish = () => {
          feedback(fb, "ok", "That matches.");
          E.say("Yes. That matches.");
          const work = h("div", { class: "mlea-work" }, h("p", { class: "mlea-worked-h" }, "One way to solve it"), h("ol", {}, p.work.map((w) => h("li", {}, w))), h("button", { type: "button", class: "btn primary", onclick: () => done(`Answer: ${p.answer.text}${p.answer.unit ? ` ${p.answer.unit}` : ""}`) }, "Next step"));
          holder.append(work);
        };
        const miss = () => {
          E.touched = true;
          const hint = lad.miss();
          if (hint) feedback(fb, "try", hint);
          else {
            feedback(fb, "try", "Study this worked example with different numbers, then try again.");
            fb.append(workedNode(E, p));
          }
          E.say("Not yet. A hint is shown.");
        };
        const holder = h("div", {});
        const mode = { choices: !typed || scaffoldOn("solve") };
        const answerArea = h("div", {});
        const paint = () => {
          clear(answerArea);
          if (mode.choices || !typed) {
            const ch = choicesOf(p, p.seed);
            const g = choiceGroup("Choose the answer", ch.map((c) => ({ label: c.text })), (i) => {
              if (ch[i].correct) {
                finish();
                return true;
              }
              miss();
              return false;
            });
            answerArea.append(g.el);
          } else {
            const { form } = inlineInput({ label: "Your answer", hint: "Units are optional. 1,344 and 1344 are the same.", onSubmit: (v) => (sameAnswer(v, p.answer) ? finish() : miss()) });
            answerArea.append(form);
          }
        };
        paint();
        const toggle = typed
          ? h("label", { class: "mlea-toggle" }, h("input", { type: "checkbox", checked: mode.choices, onchange: (e) => {
              mode.choices = e.target.checked;
              paint();
            } }), h("span", {}, "Show answer choices"))
          : null;
        return panel("solve", "Solve", h("p", { class: "mlea-instr" }, `${typed ? "Type the answer" : "Choose the answer"}. Use your number sentence.`), toggle, answerArea, fb, holder, helpPicture("solve"));
      },
    },
    {
      id: "explain",
      title: "Explain your thinking",
      build(done) {
        const fk = BAND_KEYS[Math.min(fade, 2)];
        const frames = fade >= 3 ? [] : framesFor(skill, fk, 3);
        const w = writer(E, {
          label: "Explain how you solved it in your own words.",
          frames: frames.length ? frames : framesFor(skill, "3-4", 2),
          frameOn: fade < 2 && frames.length > 0,
          kind: "none",
          onOk: (t) => {
            saved.text = t;
            const b = h("button", { type: "button", class: "btn primary", onclick: () => {
              if (struggled === 0 && fade < 3) fade += 1;
              done("I wrote an explanation.");
            } }, "Next: revise");
            w.node.append(b);
          },
        });
        return panel("explain", "Explain your thinking", h("p", { class: "mlea-instr" }, fade >= 3 ? "Frames are gone now: use your own words. Open the frame only if you need it." : fade > 0 && round > 0 ? "The frames are lighter this time." : "Say what you did and why."), w.node, helpWords("explain"));
      },
    },
    {
      id: "revise",
      title: "Revise",
      build(done) {
        const id = uid("rv");
        const area = h("textarea", { id, rows: 4 }, saved.text || "");
        area.value = saved.text || "";
        const items = [
          { t: "My sentence answers the question that was asked.", auto: null },
          { t: "I used numbers from the problem.", auto: (s) => numerals(text()).some((n) => numerals(s).includes(n)) },
          { t: "I used a math word.", auto: (s) => E.terms().some((tm) => s.toLowerCase().includes(String(tm).toLowerCase().split(" ")[0])) },
          { t: "I said why, with because or so.", auto: (s) => /\b(because|so|since|therefore)\b/i.test(s) },
        ];
        const boxes = items.map((it) => h("input", { type: "checkbox" }));
        const hints = items.map(() => h("span", { class: "fine mlea-auto" }));
        const fb = fbBox();
        const refresh = () => {
          const s = strip(area.value);
          items.forEach((it, i) => {
            hints[i].textContent = it.auto ? (it.auto(s) ? " (looks like yes)" : " (not yet)") : "";
          });
        };
        area.addEventListener("input", refresh);
        refresh();
        const check = () => {
          E.touched = true;
          const s = strip(area.value);
          const r = checkSentence(s, { kind: "none", minWords: { "1-2": 4, "3-4": 6, "5-6": 8 }[band] });
          const unticked = boxes.filter((b) => !b.checked).length;
          if (r.ok && !unticked) {
            feedback(fb, "ok", "Revised. Your teacher reads your words and checks the mathematics.");
            E.say("Yes. Revised.");
            if (!fb.querySelector("button")) fb.append(h("button", { type: "button", class: "btn primary", onclick: () => finishAll(s) }, "Finish"));
          } else {
            feedback(fb, "try", [...r.notes, unticked ? `Check each box when it is true for your sentence (${unticked} left).` : ""].filter(Boolean).join(" "));
            E.say("Not yet.");
          }
        };
        return panel(
          "revise",
          "Revise",
          h("p", { class: "mlea-instr" }, "Read your explanation again. Change it, then tick each box that is true."),
          h("label", { for: id, class: "mlea-label" }, "Your explanation"),
          area,
          h("ul", { class: "mlea-checklist" }, items.map((it, i) => h("li", {}, h("label", { class: "mlea-toggle" }, boxes[i], h("span", {}, it.t)), hints[i]))),
          h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: check }, "Check again")),
          fb,
          h("p", { class: "fine" }, "This check looks at the shape only. It cannot judge your ideas.")
        );
      },
    },
  ];
  const current = () => STAGES[stageIdx];
  const finishStage = (summary) => {
    doneList.append(h("li", {}, h("span", { class: "mlea-tick", "aria-hidden": "true" }, "✓ "), h("strong", {}, `${STAGES[stageIdx].title}: `), summary));
    stageIdx += 1;
    showStage();
  };
  function finishAll(textOut) {
    clear(stageHost);
    doneList.append(h("li", {}, h("span", { class: "mlea-tick", "aria-hidden": "true" }, "✓ "), h("strong", {}, "Revise: "), "Done."));
    stageHost.append(
      panel("finished", "You finished the walk-through", h("p", {}, "You read, found the question, marked quantities, named the relationship, chose a representation, solved and explained."), h("p", { class: "fine" }, `Your explanation: "${textOut}"`), h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: () => begin(round + 1) }, "Try another problem"), h("button", { type: "button", class: "btn", onclick: () => begin(round, true) }, "Start over")))
    );
    E.say("You finished the walk-through.");
    paintCard();
  }
  function showStage(rebuild = false) {
    clear(stageHost);
    while (stageIdx < STAGES.length) {
      const st = STAGES[stageIdx];
      const r = st.build(finishStage);
      if (r && !r.skip) {
        stageHost.append(r);
        paintCard();
        if (E.touched) r.querySelector("h3")?.focus({ preventScroll: false });
        if (!rebuild) E.say(`Step ${stageIdx + 1}: ${st.title}`);
        return;
      }
      if (rebuild) return;
      doneList.append(h("li", { class: "mlea-skipped" }, h("span", { class: "mlea-tick", "aria-hidden": "true" }, "– "), h("strong", {}, `${st.title}: `), `skipped. ${r?.skip || ""}`));
      stageIdx += 1;
    }
    finishAll(saved.text || "");
  }
  function begin(n, same = false) {
    stopSpeech();
    round = n;
    const q = E.problem(n);
    if (q) p = q;
    stageIdx = 0;
    W = E.W0;
    struggled = 0;
    for (const [k, x] of Object.entries(wordingBtns)) x.setAttribute("aria-pressed", String(k === W));
    clear(doneList);
    saved.text = "";
    if (same) E.say("Starting over with the same problem.");
    else E.say("A new problem.");
    paintCard();
    showStage();
  }
  begin(0);
  return { destroy: E.destroy };
}

// ================================================================================================================ 2. Word Problem Anatomy
const KIND_WORDS = { int: "a whole number", frac: "a fraction", dec: "a decimal", text: "a word or a short phrase", pair: "an ordered pair", set: "a list of numbers", bool: "yes or no", choice: "one of the choices" };
function sizeClass(p) {
  if (!["int", "frac", "dec"].includes(p.answer.kind)) return null;
  const ans = ratOf(p.answer.value);
  const given = numerals(`${p.stem.standard} ${p.ask.standard}`).map(ratOf).filter(Boolean);
  if (!ans || !given.length) return null;
  const v = (r) => r.n / r.d;
  const a = v(ans);
  const lo = Math.min(...given.map(v));
  const hi = Math.max(...given.map(v));
  if (a > hi) return "greater";
  if (a < lo) return "less";
  return "between";
}
const SIZE_TEXT = { greater: "greater than every number in the problem", less: "less than every number in the problem", between: "somewhere between the smallest and largest numbers in the problem" };
function anatomyOf(E, p, W) {
  const stem = p.stem[W] || "";
  const first = sentencesOf(stem).find((s) => !/\?$/.test(s));
  const A = {};
  A.happening = strip(p.structure?.happening) || first || (p.visual ? "We look at a picture and answer a question about it." : "There is no story. The problem gives numbers to work with.");
  A.known = quantitiesOf(p, textOf(p, W));
  if (!A.known.length) A.known = segmentize(textOf(p, W)).filter((s) => s.k === "qty").map((s) => ({ value: s.value, label: s.label || "number" }));
  A.unknown = unknownOf(p, W);
  A.relationship = strip(p.structure?.relationship) || strip(E.skill.bigIdea) || "The quantities are connected by an operation or a comparison.";
  A.model = strip(p.structure?.model) || (p.visual ? VISUAL_NAMES[p.visual.kind] : "") || (p.expr ? `a number sentence: ${p.expr}` : "words and numbers: read and compare");
  const sz = sizeClass(p);
  A.size = sz;
  A.kind = KIND_WORDS[p.answer.kind] || "an answer";
  A.reasonable = strip(p.structure?.reasonable) || (sz ? `The answer should be ${A.kind}${p.answer.unit ? ` of ${p.answer.unit}` : ""}, ${SIZE_TEXT[sz]}.` : `The answer should be ${A.kind}${p.answer.unit ? ` of ${p.answer.unit}` : ""}.`);
  return A;
}
function anatomy(el, opts) {
  const E = makeEnv(el, opts, "anatomy");
  let round = 0;
  let p = E.problem(0);
  if (!p) return notReady(E, "Word Problem Anatomy");
  let W = E.W0;
  let A;
  const grid = h("div", { class: "mlea-parts" });
  const reveal = h("div", { class: "mlea-reveal", hidden: true });
  const card = h("div", { class: "mlea-card mlea-problem" });
  const counter = h("p", { class: "mlea-progress", "aria-live": "off" });
  let doneCount = 0;
  const total = 6;
  const root = E.root;
  const stemName = (txt) => (NAMES.find((n) => new RegExp(`\\b${n}\\b`).test(txt)) || "");
  const swapName = (txt, name) => (name ? txt.replace(NAME_RE, name) : txt);

  const partCard = (id, n, title, ask, body, fb) => h("section", { class: "mlea-part", "data-mlea-part": id, "aria-labelledby": `${id}-${n}-h` }, h("h3", { id: `${id}-${n}-h` }, h("span", { class: "mlea-num", "aria-hidden": "true" }, `${n}`), title), h("p", { class: "mlea-instr" }, ask), body, fb);
  const markDone = (id) => {
    doneCount += 1;
    counter.textContent = `${doneCount} of ${total} parts done`;
    grid.querySelector(`[data-mlea-part="${id}"]`)?.classList.add("mlea-part-done");
    E.say(`Part done. ${doneCount} of ${total}.`);
    if (doneCount === total) showBtn.hidden = false;
  };
  const choicePart = (id, n, title, ask, options, tips, okMsg, specific) => {
    const fb = fbBox();
    const co = coachOf(E, p, fb, tips);
    const g = choiceGroup(title, options, (i) => {
      if (options[i].correct) {
        co.ok(okMsg);
        markDone(id);
        return true;
      }
      co.miss(specific?.(options[i]) || "");
      return false;
    });
    return partCard(id, n, title, ask, g.el, fb);
  };

  function build() {
    clear(grid);
    clear(reveal);
    reveal.hidden = true;
    doneCount = 0;
    counter.textContent = `0 of ${total} parts done`;
    A = anatomyOf(E, p, W);
    const t = { stem: p.stem[W] || "", ask: p.ask[W] };
    clear(card);
    card.append(h("h3", {}, "The problem"), t.stem ? h("p", { class: "mlea-stem" }, t.stem) : null, h("p", { class: "mlea-ask" }, t.ask), h("div", { class: "mlea-row" }, hearButton(textOf(p, W), "Hear the problem")));
    if (p.visual) {
      const v = visualNode(p.visual);
      if (v) card.append(v.node);
    }
    const nm = stemName(`${t.stem} ${A.happening}`);
    // 1. what is happening
    const happFoils = uniqueBy(
      E.others(p, 6, (q) => {
        const f = anatomyOf(E, q, W).happening;
        return f && f !== A.happening;
      }).map((q) => swapName(anatomyOf(E, q, W).happening, nm)),
      (x) => x
    ).filter((x) => x !== A.happening);
    const generic = ["Someone buys something at a store.", "Two things are being compared in a story.", "A group of things is shared out."].filter((x) => x !== A.happening);
    const hf = [...happFoils, ...generic].slice(0, 2);
    const o1 = mix(`${p.family}:${p.seed}:an1`, { label: A.happening }, hf.map((x) => ({ label: x })));
    grid.append(choicePart("happening", 1, "What is happening", "Which sentence tells what is happening? Check the names and things.", o1, ["Reread the problem. Who or what is in it, and what do they do?", "Match the people and things in the sentence to the ones in the problem."], "That is what is happening.", () => "That tells a different story."));
    // 2. known / unknown sort
    grid.append(sortPart());
    // 3. relationship
    const right = A.relationship;
    let rf = (E.skill.misconceptions || []).map((m) => strip(m.belief)).filter((b) => b && b !== right);
    rf = uniqueBy([...rf, "The numbers in a problem do not relate to each other.", "The order of the quantities never matters."], (x) => x).slice(0, 2);
    grid.append(choicePart("relationship", 3, "How the quantities relate", "Which statement tells how the quantities relate? Decide from what is happening, not from one word.", mix(`${p.family}:${p.seed}:an3`, { label: cap(right) }, rf.map((x) => ({ label: cap(x) }))), ["Think about what is happening to the quantities.", "Test each statement with the numbers in the problem."], "That is how they relate.", () => "That is a common mix-up, not how these quantities relate."));
    // 4. model
    const mf = MODEL_NAMES.filter((m) => m.toLowerCase() !== A.model.toLowerCase()).slice(p.seed % 4, (p.seed % 4) + 6).slice(0, 2);
    grid.append(choicePart("model", 4, "What model fits", "Which model could you draw or use for this problem?", mix(`${p.family}:${p.seed}:an4`, { label: cap(A.model) }, mf.map((x) => ({ label: cap(x) }))), ["Think about what the picture needs to show: parts, groups, or a comparison.", "Which model keeps the relationship you chose?"], "That model fits.", () => "That model fits a different kind of situation."));
    // 5. reasonable answer (kind or size)
    if (A.size) {
      const opts = mix(`${p.family}:${p.seed}:an5`, { label: cap(SIZE_TEXT[A.size]) }, Object.keys(SIZE_TEXT).filter((k) => k !== A.size).map((k) => ({ label: cap(SIZE_TEXT[k]) })));
      grid.append(choicePart("reasonable", 5, "What a reasonable answer looks like", "Before you solve: how big should the answer be, compared with the numbers in the problem?", opts, ["Think about what is happening: do the amounts grow, shrink or stay inside the range?", "Try rough numbers in your head and see where the result lands."], "That is a reasonable size.", () => "Estimate again from what is happening."));
    } else {
      const kinds = Object.keys(KIND_WORDS).filter((k) => k !== p.answer.kind);
      const opts = mix(`${p.family}:${p.seed}:an5`, { label: cap(KIND_WORDS[p.answer.kind] || "an answer") }, [kinds[p.seed % kinds.length], kinds[(p.seed + 3) % kinds.length]].filter((k, i, a) => k !== undefined && a.indexOf(k) === i).map((k) => ({ label: cap(KIND_WORDS[k]) })));
      grid.append(choicePart("reasonable", 5, "What a reasonable answer looks like", "What kind of answer does the question ask for?", opts, ["Reread the question. What does it want you to find?", "Think about whether it asks for an amount, a time, a pair or a word."], "That is the kind of answer to expect.", () => "Reread what the question asks for."));
    }
    // 6. unknown restated (what is the question asking)
    grid.append(unknownPart());
    showBtn.hidden = true;
  }
  function sortPart() {
    const items = [...A.known.slice(0, 4).map((k) => ({ label: k.label && k.label !== "number" ? `${k.value} ${k.label}` : String(k.value), known: true })), { label: A.unknown, known: false }];
    const rows = items.map((it, i) => {
      const state = { v: null };
      const kb = h("button", { type: "button", class: "mlea-opt", "aria-pressed": "false", onclick: () => set("known") }, "Known");
      const ub = h("button", { type: "button", class: "mlea-opt", "aria-pressed": "false", onclick: () => set("unknown") }, "Unknown");
      const set = (v) => {
        state.v = v;
        kb.setAttribute("aria-pressed", String(v === "known"));
        ub.setAttribute("aria-pressed", String(v === "unknown"));
      };
      return { it, state, node: h("li", { class: "mlea-sortrow" }, h("span", { class: "mlea-sortlabel" }, it.label), h("span", { class: "mlea-sortbtns", role: "group", "aria-label": `Is ${it.label} known or unknown?` }, kb, ub)) };
    });
    const fb = fbBox();
    const co = coachOf(E, p, fb, ["A quantity is known when the problem tells you its number. The unknown is what you must find.", "Look for the quantity the question asks about."]);
    const check = () => {
      const unset = rows.filter((r) => !r.state.v).length;
      if (unset) return co.miss(`Choose Known or Unknown for every line (${unset} left).`);
      const wrong = rows.filter((r) => (r.state.v === "known") !== r.it.known).length;
      if (wrong) return co.miss(`${wrong} ${wrong === 1 ? "line is" : "lines are"} sorted differently from the problem.`);
      co.ok("Known and unknown are sorted correctly.");
      markDone("sort");
      return null;
    };
    return partCard("sort", 2, "What is known and what is unknown", "Sort each line: is it known (the problem gives it) or unknown (you must find it)?", h("div", {}, h("ul", { class: "mlea-sort" }, rows.map((r) => r.node)), h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: check }, "Check my sort"))), fb);
  }
  function unknownPart() {
    const right = A.unknown;
    const labels = E.others(p, 4, (q) => unknownOf(q, W) !== right).map((q) => unknownOf(q, W));
    const gen = ["the total of everything in the problem", "the first number in the problem", "who is in the problem"];
    const foils = uniqueBy([...labels, ...gen], (x) => x).filter((x) => x !== right).slice(0, 2);
    return choicePart("unknown", 6, "What the question asks for", "What do you need to find out? Choose the unknown.", mix(`${p.family}:${p.seed}:an6`, { label: cap(right) }, foils.map((x) => ({ label: cap(x) }))), ["Reread the last sentence. It names what to find.", "The unknown is not given as a number in the problem."], "That is what you need to find.", () => "That is not what the question asks for.");
  }
  const showBtn = h("button", { type: "button", class: "btn primary", hidden: true, onclick: () => showReveal(true) }, "Compare with the full anatomy");
  const peekBtn = h("button", { type: "button", class: "btn", onclick: () => showReveal(false) }, "Show me the anatomy");
  function showReveal(earned) {
    clear(reveal);
    reveal.hidden = false;
    const rows = [
      ["What is happening", A.happening],
      ["What is known", A.known.map((k) => (k.label && k.label !== "number" ? `${k.value} ${k.label}` : String(k.value))).join("; ") || "No quantities are written as numbers."],
      ["What is unknown", cap(A.unknown)],
      ["How the quantities relate", cap(A.relationship)],
      ["What model fits", cap(A.model)],
      ["What a reasonable answer looks like", A.reasonable],
    ];
    reveal.append(
      h("h3", { id: "mlea-reveal-h", tabindex: "-1" }, "The anatomy of this problem"),
      h("dl", { class: "mlea-dl" }, rows.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)])),
      h("p", { class: "fine" }, earned ? "You built each part first. Now solve it your own way." : "Looking is a fine way to learn. Try the next problem and build the parts first."),
      h("p", { class: "fine" }, "The anatomy shows how the problem is built. It does not give the answer.")
    );
    reveal.querySelector("h3").focus();
    E.say("The anatomy is shown.");
  }
  const wordingSel = h("div", { class: "mlea-seg", role: "group", "aria-label": "Same problem, different words" }, h("span", { class: "mlea-seg-l" }, "Same problem, different words:"),
    ...[["plain", "Simpler words"], ["standard", "Grade words"], ["rich", "Richer words"]].map(([lv, label]) => {
      const b = h("button", { type: "button", class: "btn small", "aria-pressed": String(lv === W), onclick: () => {
        W = lv;
        for (const x of wordingSel.querySelectorAll("button")) x.setAttribute("aria-pressed", String(x === b));
        build();
      } }, label);
      return b;
    }));
  const newP = (n, same) => {
    stopSpeech();
    round = n;
    const q = E.problem(n);
    if (q) p = q;
    W = E.W0;
    for (const x of wordingSel.querySelectorAll("button")) x.setAttribute("aria-pressed", String(x.textContent === { plain: "Simpler words", standard: "Grade words", rich: "Richer words" }[W]));
    E.say(same ? "Starting over with the same problem." : "A new problem.");
    build();
  };
  root.append(
    h("p", { class: "mlea-note" }, "Decide from what is happening, not from one word."),
    h("div", { class: "mlea-toolbar" }, wordingSel, h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn", onclick: () => newP(round + 1) }, "New problem"), h("button", { type: "button", class: "btn", onclick: () => newP(round, true) }, "Start over"))),
    card,
    counter,
    grid,
    h("div", { class: "mlea-row" }, showBtn, peekBtn),
    reveal
  );
  build();
  return { destroy: E.destroy };
}

// ================================================================================================================ 3. Sentence Studio
const JOINERS = /\b(and|but|so|because|while|which|that|although|since)\b/i;
function firstWordKeep(s) {
  const w = strip(s).split(" ")[0];
  return /^(The|A|An|It|There|This|These|Those|Each|Every|When|If|We|You|They|He|She|Both|Some|Some)$/.test(w) ? lc1(s) : s;
}
function clozeOf(sentence, term) {
  const re = new RegExp(escRe(term), "i");
  if (!re.test(sentence)) return null;
  return sentence.replace(re, "_____");
}
function sentenceStudio(el, opts) {
  const E = makeEnv(el, opts, "sentence-studio");
  const { skill, band } = E;
  const S = skill.sentence || {};
  const vocab = (skill.vocab || []).filter((v) => v.term && v.sentence);
  const terms = E.terms();
  const steps = sentenceSteps(skill, band);
  const stepsHelp = sentenceSteps(skill, "3-4");
  const hasP = Boolean(E.problem(0));
  let r = 0;
  const grade = Number(skill.grade) || 0;

  const lcN = (s) => String(s).toLowerCase();
  const wb = () => helpBlock("Word bank", band === "1-2", () => [wordChips(wordsFor(E))]);
  const acts = [];
  const doneSet = new Set();
  const host = h("div", { class: "mlea-stagehost" });
  const nav = h("div", { class: "mlea-tabs", role: "group", "aria-label": "Sentence activities" });
  const progress = h("p", { class: "mlea-progress" });
  const add = (a) => acts.push(a);

  // 1 completion (cloze)
  const clozeItems = vocab.map((v) => ({ v, text: clozeOf(v.sentence, v.term) })).filter((x) => x.text);
  if (clozeItems.length) {
    add({ id: "complete", title: "Complete the sentence", build(done) {
      const items = clozeItems.slice(r % clozeItems.length).concat(clozeItems.slice(0, r % clozeItems.length)).slice(0, 3);
      let k = 0;
      const wrap = h("div", {});
      const next = () => {
        clear(wrap);
        if (k >= items.length) {
          wrap.append(h("p", { class: "mlea-okline" }, "✓ All sentences completed."));
          done();
          return;
        }
        const it = items[k];
        const fb = fbBox();
        let nMiss = 0;
        const co = {
          miss() {
            nMiss += 1;
            E.touched = true;
            const tips = ["Read the whole sentence. Which word fits the meaning?", `The missing word means: ${it.v.def}`, `For example: ${it.v.example}`];
            feedback(fb, "try", tips[Math.min(nMiss, 3) - 1]);
            E.say("Not yet. A hint is shown.");
          },
        };
        const ok = () => {
          feedback(fb, "ok", `The word is "${it.v.term}".`);
          E.say("Yes.");
          wrap.append(h("button", { type: "button", class: "btn primary", onclick: () => { k += 1; next(); } }, k + 1 < items.length ? "Next sentence" : "Finish"));
        };
        const pre = h("p", { class: "mlea-bigsentence" }, `${k + 1}. ${it.text}`);
        let input;
        if (band === "1-2") {
          const others = vocab.map((x) => x.term).filter((t) => t !== it.v.term);
          const foils = others.slice(k % Math.max(1, others.length)).concat(others).slice(0, 2);
          const opts = mix(`${skill.id}:cl:${k}:${r}`, { label: it.v.term }, uniqueBy(foils, (x) => x).map((t) => ({ label: t })));
          const g = choiceGroup("Choose the missing word", opts, (i) => {
            if (opts[i].correct) {
              ok();
              return true;
            }
            co.miss();
            return false;
          });
          input = g.el;
        } else {
          input = inlineInput({ label: "Type the missing word or words", onSubmit: (v) => {
            const a = lcN(strip(v)).replace(/s$/, "");
            const b = lcN(it.v.term).replace(/s$/, "");
            if (a && a === b) ok();
            else co.miss();
          } }).form;
        }
        wrap.append(pre, input, fb, wb());
      };
      next();
      return wrap;
    } });
  }
  // 2 expansion
  if (S.base && (S.because || S.but || S.so)) {
    add({ id: "expand", title: "Because, but, so", build(done) {
      let k = 0;
      const wrap = h("div", {});
      const kinds = steps.filter((s) => S[s.kind]);
      const next = () => {
        clear(wrap);
        if (k >= kinds.length) {
          wrap.append(h("p", { class: "mlea-okline" }, "✓ You expanded the sentence three ways."));
          done();
          return;
        }
        const st = kinds[k];
        const w = writer(E, { label: `Make the sentence longer. ${st.prompt}`, frames: [st.frame || stepsHelp[steps.indexOf(st)].frame].filter(Boolean), frameOn: Boolean(st.frame), kind: st.kind, targets: S.targets || [], model: st.model, onOk: () => {
          if (!w.node.querySelector("[data-next]")) w.node.append(h("button", { type: "button", class: "btn primary", "data-next": "", onclick: () => { k += 1; next(); } }, k + 1 < kinds.length ? "Next connecting word" : "Finish"));
        } });
        wrap.append(h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Start with: "), S.base), w.node, wb());
      };
      next();
      return wrap;
    } });
  }
  // 3 combining
  if (S.base && vocab.length) {
    add({ id: "combine", title: "Combine two sentences", build(done) {
      const vs = vocab.filter((v) => noEnd(v.sentence) !== noEnd(S.base));
      const B = vs[r % Math.max(1, vs.length)]?.sentence || vocab[0].sentence;
      const model = `${noEnd(S.base)}, and ${firstWordKeep(noEnd(B))}.`;
      const w = writer(E, { label: "Join these two true sentences into one sentence.", frames: ["___ , and ___.", "___ because ___.", "___ , but ___."].slice(0, band === "1-2" ? 1 : 3), frameOn: band !== "5-6", kind: "none", extra: (t) => (JOINERS.test(t) ? [] : ["Use a joining word such as and, but, so or because."]), model, onOk: () => done() });
      return h("div", {}, h("div", { class: "mlea-pair" }, h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Sentence 1: "), S.base), h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Sentence 2: "), B)), w.node, wb());
    } });
  }
  // 4 precise vocabulary swap
  const swapItems = vocab.map((v) => ({ v, text: clozeOf(v.sentence, v.term) })).filter((x) => x.text);
  if (swapItems.length >= 2) {
    add({ id: "swap", title: "Swap a vague word for a math word", build(done) {
      const vague = ["thing", "stuff", "it"];
      const items = swapItems.slice(r % swapItems.length).concat(swapItems.slice(0, r % swapItems.length)).slice(0, 3);
      let k = 0;
      const wrap = h("div", {});
      const next = () => {
        clear(wrap);
        if (k >= items.length) {
          wrap.append(h("p", { class: "mlea-okline" }, "✓ Every vague word was replaced with a precise one."));
          done();
          return;
        }
        const it = items[k];
        const word = vague[k % 3];
        const sentence = it.text.replace("_____", word);
        const others = swapItems.map((x) => x.v.term).filter((t) => t !== it.v.term);
        const opts = mix(`${skill.id}:sw:${k}:${r}`, { label: it.v.term }, uniqueBy(others.slice(k % others.length).concat(others), (x) => x).slice(0, 2).map((t) => ({ label: t })));
        const fb = fbBox();
        let n = 0;
        const g = choiceGroup(`Which math word replaces "${word}"?`, opts, (i) => {
          if (opts[i].correct) {
            feedback(fb, "ok", `"${it.v.term}" is the precise word: ${it.v.def}`);
            E.say("Yes.");
            wrap.append(h("button", { type: "button", class: "btn primary", onclick: () => { k += 1; next(); } }, k + 1 < items.length ? "Next sentence" : "Finish"));
            return true;
          }
          n += 1;
          E.touched = true;
          const chosen = swapItems.find((x) => x.v.term === opts[i].label)?.v;
          const tips = [`Not that one: "${opts[i].label}" means: ${chosen?.def || "something else"} Does that match the sentence?`, `Think about what the sentence says. The right word means: ${it.v.def}`];
          feedback(fb, "try", n <= 2 ? tips[n - 1] : `Here is another example: "${swapItems[(k + 1) % swapItems.length].text.replace("_____", word)}" becomes "${swapItems[(k + 1) % swapItems.length].text.replace("_____", swapItems[(k + 1) % swapItems.length].v.term)}".`);
          E.say("Not yet. A hint is shown.");
          return false;
        });
        wrap.append(h("p", { class: "mlea-bigsentence" }, `${k + 1}. ${sentence}`), g.el, fb, wb());
      };
      next();
      return wrap;
    } });
  }
  // 5 strategy explanation
  if (hasP) {
    add({ id: "strategy", title: "Explain a strategy", build(done) {
      const p = E.problem(r + 1);
      const t = problemText(p, band);
      const w = writer(E, { label: "Explain how you would solve it. You do not have to give the answer.", frames: framesFor({ ...skill, keyLanguageUses: ["Explain"] }, band, 3), frameOn: band !== "5-6", kind: "none", targets: [], extra: (txt) => (/\b(first|then|next|because|so|after)\b/i.test(txt) ? [] : ["Use a sequence word such as first, then or because."]), model: h("ol", {}, p.work.map((x) => h("li", {}, x))), onOk: () => done() });
      return h("div", {}, h("div", { class: "mlea-card mlea-problem" }, h("p", { class: "mlea-stem" }, [t.stem, t.ask].filter(Boolean).join(" ")), p.visual ? visualNode(p.visual)?.node : null), w.node, wb());
    } });
  }
  // 6 comparison statement
  const cmp = skill.discourse?.compare;
  if ((cmp?.a && cmp?.b) || vocab.length >= 2) {
    add({ id: "compare", title: "Write a comparison", build(done) {
      const A = cmp?.a || `${vocab[0].term}: ${vocab[0].def}`;
      const B = cmp?.b || `${vocab[1].term}: ${vocab[1].def}`;
      const w = writer(E, { label: cmp?.prompt ? `${cmp.prompt} Write one comparison sentence.` : "Write one sentence that compares the two.", frames: ["___ and ___ are alike because ___.", "___ is different from ___ because ___."], frameOn: band !== "5-6", kind: "none", extra: (t) => (/\b(alike|same|both|different|but|while|whereas|however|unlike|similar|instead)\b/i.test(t) ? [] : ["Use a comparing word such as alike, both, different, but or while."]), onOk: () => done() });
      return h("div", {}, h("div", { class: "mlea-pair" }, h("p", { class: "mlea-bigsentence" }, h("strong", {}, "A: "), A), h("p", { class: "mlea-bigsentence" }, h("strong", {}, "B: "), B)), w.node, wb());
    } });
  }
  // 7 evidence-based conclusion
  const asn = (skill.discourse?.asn || []).filter((x) => x.claim && x.verdict);
  if (asn.length) {
    add({ id: "conclude", title: "Draw a conclusion with evidence", build(done) {
      const c = asn[r % asn.length];
      const other = asn.find((x) => x !== c);
      const wrap = h("div", {});
      const fb = fbBox();
      let n = 0;
      const verdicts = ["always", "sometimes", "never"];
      const g = choiceGroup("Is the claim always, sometimes or never true?", verdicts.map((v) => ({ label: cap(v) })), (i) => {
        if (verdicts[i] === c.verdict) {
          feedback(fb, "ok", "That verdict fits. Now write your conclusion and the evidence.");
          E.say("Yes.");
          const w = writer(E, { label: "Write a conclusion that gives your evidence.", frames: [`I conclude that the claim is ${c.verdict === "sometimes" ? "sometimes true" : `${c.verdict} true`} because ___.`, "My evidence is ___, so ___."], frameOn: band !== "5-6", kind: "because", model: c.why, onOk: () => done() });
          wrap.append(w.node);
          return true;
        }
        n += 1;
        E.touched = true;
        const tips = ["Try to find one example where the claim works and one where it does not.", "If you can find even one example that breaks the claim, it is not always true. If no example ever works, it is never true."];
        feedback(fb, "try", n <= 2 ? tips[n - 1] : "Study how another claim was sorted, then try again.");
        if (n > 2 && other) fb.append(h("div", { class: "mlea-worked" }, h("p", { class: "mlea-worked-h" }, "Worked example (a different claim)"), h("p", {}, `Claim: ${other.claim}`), h("p", {}, `Verdict: ${other.verdict}. ${other.why}`)));
        E.say("Not yet. A hint is shown.");
        return false;
      });
      wrap.append(h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Claim: "), c.claim), g.el, fb);
      return wrap;
    } });
  }
  // 8 error analysis
  const ecs = (skill.misconceptions || []).filter((m) => m.errorCase?.steps?.length);
  if (ecs.length) {
    add({ id: "error", title: "Explain a mistake", build(done) {
      const m = ecs[r % ecs.length];
      const ec = m.errorCase;
      const wrap = h("div", {});
      const fb = fbBox();
      let n = 0;
      const opts = ec.steps.map((s, i) => ({ label: s, idx: i }));
      const g = choiceGroup("Which line is the first mistake?", opts, (i) => {
        if (i === ec.firstWrong) {
          feedback(fb, "ok", "That is the first line where the work goes wrong. Now explain it.");
          E.say("Yes.");
          const w = writer(E, { label: "Explain the mistake: why is that line wrong?", frames: [`The mistake is in line ${ec.firstWrong + 1} because ___.`, "Instead, ___."], frameOn: band !== "5-6", kind: "because", targets: [], model: ec.explain, onOk: () => done() });
          wrap.append(w.node);
          return true;
        }
        n += 1;
        E.touched = true;
        const tips = [i < ec.firstWrong ? "That line matches the story. Check the next line." : "A mistake started earlier. Look further up.", "Check each line against the story, one at a time. The first line that is not true is the mistake."];
        feedback(fb, "try", n <= 2 ? tips[n - 1] : "Look at the story again and compare it with each line.");
        E.say("Not yet. A hint is shown.");
        return false;
      });
      wrap.append(h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Story: "), ec.story), h("p", { class: "fine" }, "Work from a fictional student:"), g.el, fb);
      return wrap;
    } });
  }
  // 9 paragraph builder (grade 6 and up)
  const deb = skill.discourse?.debate;
  if (grade >= 6 && (deb?.claim || asn.length)) {
    add({ id: "paragraph", title: "Build a paragraph", build(done) {
      const claim = deb?.claim || asn[0].claim;
      const parts = [
        { k: "claim", label: "1. Claim: state what you believe about the claim above.", frames: ["I claim that ___."], extra: () => [], kind: "none" },
        { k: "evidence", label: "2. Evidence: give a fact, number or example.", frames: ["The evidence is ___."], extra: (t) => (/\d/.test(t) || terms.some((x) => lcN(t).includes(lcN(x).split(" ")[0])) ? [] : ["Include a number or a math word as evidence."]), kind: "none", model: deb?.forEvidence },
        { k: "reasoning", label: "3. Reasoning: explain why the evidence supports the claim.", frames: ["This shows that ___ because ___."], extra: (t) => (/\b(because|so|which shows|therefore|this means|since)\b/i.test(t) ? [] : ["Explain why with because, so or this means."]), kind: "none" },
      ];
      const got = {};
      const wrap = h("div", {});
      let k = 0;
      const next = () => {
        if (k >= parts.length) {
          const para = `${got.claim} ${got.evidence} ${got.reasoning}`;
          wrap.append(h("div", { class: "mlea-card" }, h("h4", {}, "Your paragraph"), h("p", {}, para), h("p", { class: "fine" }, "Your teacher reads the paragraph and checks the mathematics.")));
          done();
          return;
        }
        const pt = parts[k];
        const w = writer(E, { label: pt.label, frames: pt.frames, frameOn: band !== "5-6", kind: pt.kind, extra: pt.extra, model: pt.model, minWords: 4, onOk: (t) => {
          got[pt.k] = t;
          if (!w.node.querySelector("[data-next]")) w.node.append(h("button", { type: "button", class: "btn primary", "data-next": "", onclick: () => { w.node.remove(); k += 1; next(); } }, k + 1 < parts.length ? "Next part" : "Build my paragraph"));
        } });
        wrap.append(w.node);
      };
      wrap.append(h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Claim to think about: "), claim));
      next();
      return wrap;
    } });
  }

  if (!acts.length) return notReady(E, "Sentence Studio");
  let cur = 0;
  const paintNav = () => {
    clear(nav);
    acts.forEach((a, i) => nav.append(h("button", { type: "button", class: "btn small", "aria-pressed": String(i === cur), onclick: () => show(i) }, `${doneSet.has(a.id) ? "✓ " : ""}${a.title}`)));
    progress.textContent = `${doneSet.size} of ${acts.length} activities done`;
  };
  function show(i) {
    stopSpeech();
    cur = i;
    clear(host);
    const a = acts[i];
    const node = h("section", { class: "mlea-panel", "data-mlea-stage": a.id, "aria-labelledby": `mlea-ss-${a.id}` }, h("h3", { id: `mlea-ss-${a.id}`, tabindex: "-1" }, a.title));
    node.append(a.build(() => {
      doneSet.add(a.id);
      paintNav();
      E.say(`${a.title} is done.`);
    }));
    host.append(node);
    paintNav();
    if (E.touched) node.querySelector("h3").focus();
    E.say(a.title);
  }
  E.root.append(
    h("p", { class: "mlea-note" }, "Say it with because, but and so. The check looks at the shape of your sentence. Your teacher reviews the words."),
    h("p", { class: "fine" }, `Language: ${skill.languageObjective || "Write about the mathematics with full sentences."}`),
    nav,
    progress,
    h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn", onclick: () => { r += 1; show(cur); } }, "Try a different sentence"), h("button", { type: "button", class: "btn", onclick: () => { doneSet.clear(); r = 0; show(0); } }, "Start over")),
    host
  );
  show(0);
  return { destroy: E.destroy };
}

// ================================================================================================================ 4. Representation Translator
const REP_NAMES = { opwords: "the words", story: "the story", words: "the problem", retell: "the other wording", expr: "the expression", visual: "the picture", desc: "the description" };
const MODES = [
  { id: "story-expr", from: "story", to: "expr", label: "Story to expression", q: "Which expression matches the story?" },
  { id: "expr-story", from: "expr", to: "story", label: "Expression to story", q: "Which story matches the expression?" },
  { id: "visual-story", from: "visual", to: "story", label: "Picture to story", q: "Which story matches the picture?" },
  { id: "story-visual", from: "story", to: "visual", label: "Story to picture", q: "Which picture matches the story?" },
  { id: "expr-visual", from: "expr", to: "visual", label: "Expression to picture", q: "Which picture matches the expression?" },
  { id: "visual-expr", from: "visual", to: "expr", label: "Picture to expression", q: "Which expression matches the picture?" },
  { id: "visual-desc", from: "visual", to: "desc", label: "Picture or table to description", q: "Which description matches the picture?" },
  { id: "expr-words", from: "expr", to: "opwords", label: "Expression to math words", q: "Which words say the same thing as the expression?" },
  { id: "story-retell", from: "words", to: "retell", label: "Problem in different words", q: "Which one says the same thing with different words?" },
];
const BUILD = {
  tenframe: { args: [{ k: "n", label: "dots", min: 0, max: (s) => 10 * (s.frames || 1) }], fixed: ["frames"] },
  counters: { args: [{ k: "n", label: "counters", min: 0, max: () => 30 }], fixed: ["perRow", "shape"] },
  array: { args: [{ k: "rows", label: "rows", min: 1, max: () => 12 }, { k: "cols", label: "columns", min: 1, max: () => 12 }], fixed: ["label"], ok: (s) => !s.shade },
  fracstrip: { args: [{ k: "parts", label: "equal parts", min: 1, max: () => 12 }, { k: "shaded", label: "shaded parts", min: 0, max: (_s, cur) => cur.parts }], fixed: [], ok: (s) => !s.compare },
  fracshape: { args: [{ k: "parts", label: "equal parts", min: 1, max: () => 12 }, { k: "shaded", label: "shaded parts", min: 0, max: (_s, cur) => cur.parts }], fixed: ["shape"] },
  placevalue: { args: [{ k: "hundreds", label: "hundreds", min: 0, max: () => 9 }, { k: "tens", label: "tens", min: 0, max: () => 9 }, { k: "ones", label: "ones", min: 0, max: () => 9 }], fixed: [] },
  rect: { args: [{ k: "w", label: "width", min: 1, max: () => 20 }, { k: "h", label: "height", min: 1, max: () => 20 }], fixed: ["unit"], ok: (s) => !s.showArea && !s.showPerimeter },
};
const SIMPLE_EXPR = /^\s*(\d+(?:\.\d+)?)\s*([+−×÷])\s*(\d+(?:\.\d+)?)\s*(?:=\s*(?:\?|_+))?\s*$/;
const OP_WORDS = { "+": "plus", [MINUS]: "minus", "×": "times", "÷": "divided by" };
const opPhrase = (op, a, b) => `${a} ${OP_WORDS[op]} ${b}`;
const numSet = (text) => {
  const s = new Set();
  for (const n of numerals(text)) {
    s.add(n);
    for (const x of n.split(/[/.]/)) s.add(x);
  }
  return s;
};
/** One representation of a problem, computed only when asked for. story/retell are the same situation in two wordings. */
function repOf(p, kind, W, W2) {
  switch (kind) {
    case "story":
    case "words":
    case "retell": {
      let lv = W;
      if (kind === "retell") {
        const mine = textOf(p, W);
        lv = [W2, "plain", "standard", "rich"].find((x) => x !== W && textOf(p, x) !== mine);
        if (!lv) return null;
      }
      if (kind === "story" && !p.stem[lv]) return null;
      const t = textOf(p, lv);
      return { text: t, nums: numerals(t), key: t };
    }
    case "expr":
      return p.expr ? { text: p.expr, nums: numerals(p.expr), key: p.expr } : null;
    case "opwords": {
      const m = String(p.expr || "").match(SIMPLE_EXPR);
      if (!m) return null;
      const t = opPhrase(m[2], m[1], m[3]);
      return { text: t, nums: numerals(t), key: t, parts: [m[1], m[2], m[3]] };
    }
    case "visual":
    case "desc": {
      if (!p.visual) return null;
      const v = visualNode(p.visual);
      if (!v) return null;
      return kind === "visual" ? { spec: p.visual, v, nums: numerals(v.summary), key: visualKey(p.visual) } : { text: v.summary, nums: numerals(v.summary), key: v.summary };
    }
    default:
      return null;
  }
}
function repNode(kind, rep) {
  if (kind === "visual") return visualNode(rep.spec, "mlea-vis")?.node || h("p", {}, "(picture)");
  if (kind === "expr") return h("span", { class: "mlea-expr" }, rep.text);
  return h("span", { class: "mlea-reptext" }, rep.text);
}
function translator(el, opts) {
  const E = makeEnv(el, opts, "translator");
  const W = E.W0;
  const W2 = W === "plain" ? "standard" : "plain";
  let round = 0;
  const probe = E.problem(0);
  if (!probe) return notReady(E, "Representation Translator");
  const keyN = (x) => x.nums.slice().sort().join("|");
  /** The source, the right answer and 2-3 foils for a match mode on problem p, or null when this problem cannot make that match. */
  const setupFor = (mode, p) => {
    const src = repOf(p, mode.from, W, W2);
    const cor = repOf(p, mode.to, W, W2);
    if (!src || !cor) return null;
    if (mode.to === "retell" && src.key === cor.key) return null;
    if (mode.to === "opwords") {
      const [a, op, b] = cor.parts;
      const alt = Object.keys(OPS).filter((o) => o !== op).map((o) => opPhrase(o, a, b));
      if (op === MINUS || op === "÷") alt.unshift(opPhrase(op, b, a));
      const fs = alt.filter((t) => t !== cor.key).slice(0, 3).map((t) => ({ text: t, nums: numerals(t), key: t }));
      return fs.length >= 2 ? { src, cor, foils: fs } : null;
    }
    const foilQs = E.others(p, 6, (q) => {
      const r = repOf(q, mode.to, W, W2);
      if (!r || r.key === cor.key) return false;
      if (cor.nums.length && keyN(r) === keyN(cor)) return false;
      if (mode.to === "retell" && r.key === repOf(q, "words", W, W2)?.key) return false;
      const s = mode.from === "visual" || mode.from === "story" ? repOf(q, mode.from, W, W2) : null;
      return !s || s.key !== src.key;
    }, (p.seed || 1) + 1, 24);
    let foils = foilQs.map((q) => repOf(q, mode.to, W, W2));
    if (mode.to === "expr") foils = [...swapOps(p.expr).slice(0, 1).map((t) => ({ text: t, nums: numerals(t), key: t })), ...foils];
    foils = uniqueBy(foils, (x) => x.key).filter((x) => x.key !== cor.key).slice(0, 3);
    return foils.length >= 2 ? { src, cor, foils } : null;
  };
  const buildOk = (p) => {
    const spec = p.visual;
    const b = spec && BUILD[spec.kind];
    if (!b || (b.ok && !b.ok(spec)) || !p.stem[W]) return false;
    const have = numSet(textOf(p, W));
    return b.args.every((a) => have.has(String(spec[a.k])));
  };
  const findFor = (test, from) => {
    for (let i = 0; i < 12; i++) {
      const q = E.problem(from + i);
      const r = q && test(q);
      if (r) return { q, round: from + i, setup: r };
    }
    return null;
  };
  const modes = MODES.filter((m) => findFor((q) => setupFor(m, q), 0)).map((m) => ({ ...m, kind: "match" }));
  if (findFor(buildOk, 0)) modes.push({ id: "build", kind: "build", label: "Build the picture", q: "Build the picture that matches the story." });
  if (!modes.length) return notReady(E, "Representation Translator");
  let mode = modes[0];
  let p = null;
  let setup = null;
  let matched = 0;
  const host = h("div", { class: "mlea-stagehost" });
  const nav = h("div", { class: "mlea-tabs", role: "group", "aria-label": "Choose a translation" });
  const counter = h("p", { class: "mlea-progress" });
  const paintNav = () => {
    clear(nav);
    for (const m of modes) nav.append(h("button", { type: "button", class: "btn small", "aria-pressed": String(m === mode), onclick: () => { mode = m; load(round); } }, m.label));
    counter.textContent = `Matches this visit: ${matched}`;
  };
  function load(n) {
    stopSpeech();
    const f = findFor(mode.kind === "build" ? buildOk : (q) => setupFor(mode, q), n);
    if (!f) return;
    round = f.round;
    p = f.q;
    setup = f.setup;
    paintNav();
    clear(host);
    host.append(mode.kind === "build" ? buildRound() : matchRound());
    E.say(`${mode.label}. Round ready.`);
  }
  function matchRound() {
    const { src, cor: correct, foils } = setup;
    const reps = { story: repOf(p, "story", W, W2), expr: repOf(p, "expr", W, W2), visual: repOf(p, "visual", W, W2) };
    const opts = mix(`${p.family}:${p.seed}:tr:${mode.id}`, { rep: correct }, foils.map((f) => ({ rep: f })));
    opts.forEach((o) => {
      o.label = repNode(mode.to, o.rep);
      o.aria = mode.to === "visual" ? o.rep.v.alt : null;
    });
    const fb = fbBox();
    let n = 0;
    const holder = h("div", {});
    const g = choiceGroup(mode.q, opts, (i) => {
      if (opts[i].correct) {
        feedback(fb, "ok", "That is the same situation in a new form.");
        E.say("Yes. That matches.");
        matched += 1;
        paintNav();
        holder.append(allReps(reps), h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: () => load(round + 1) }, "Next round")));
        return true;
      }
      n += 1;
      E.touched = true;
      const specific = (mode.to === "opwords" ? "The numbers match, but check the operation and the order of the numbers. What does the symbol tell you to do?" : "") || numberDiff(src.nums, opts[i].rep.nums, REP_NAMES[mode.from], REP_NAMES[mode.to]) || (mode.to === "retell" ? "That retelling is about a different situation. Check the names and the things." : "The numbers match, but the relationship is different. Check what is happening and which quantity comes first.");
      if (n === 1) feedback(fb, "try", specific);
      else if (n === 2) feedback(fb, "try", `${specific} Say what each part means in ${REP_NAMES[mode.from]}, then look for it in each choice.`);
      else {
        feedback(fb, "try", `${specific} Study how a different problem is shown in several ways, then try again.`);
        const q = E.parallel(p);
        if (q) fb.append(h("div", { class: "mlea-worked" }, h("p", { class: "mlea-worked-h" }, "Worked example (different numbers)"), allReps({ story: repOf(q, "story", W, W2), expr: repOf(q, "expr", W, W2), visual: repOf(q, "visual", W, W2) })));
      }
      E.say("Not yet. A hint is shown.");
      return false;
    }, { visual: mode.to === "visual" });
    return h("section", { class: "mlea-panel", "data-mlea-stage": "translate", "aria-labelledby": "mlea-tr-h" }, h("h3", { id: "mlea-tr-h", tabindex: "-1" }, mode.label),
      h("div", { class: "mlea-source" }, h("p", { class: "mlea-label" }, `Start with ${REP_NAMES[mode.from]}:`), h("div", { class: "mlea-src" }, repNode(mode.from, src)), mode.from === "story" || mode.from === "words" || mode.from === "visual" ? h("div", { class: "mlea-row" }, hearButton(mode.from !== "visual" ? src.text : repOf(p, "desc", W, W2)?.text || "", "Hear it")) : null),
      h("p", { class: "mlea-instr" }, mode.q), g.el, fb, holder);
  }
  const allReps = (reps) => h("div", { class: "mlea-allreps" }, h("p", { class: "mlea-worked-h" }, "The same situation, shown more than one way"), ["story", "expr", "visual"].filter((k) => reps[k]).map((k) => h("div", { class: "mlea-rep" }, h("p", { class: "fine" }, cap(REP_NAMES[k].replace("the ", ""))), repNode(k, reps[k]))));
  function buildRound() {
    const spec = p.visual;
    const b = BUILD[spec.kind];
    const target = Object.fromEntries(b.args.map((a) => [a.k, spec[a.k]]));
    const fixed = Object.fromEntries(b.fixed.filter((k) => spec[k] !== undefined).map((k) => [k, spec[k]]));
    const cur = Object.fromEntries(b.args.map((a) => [a.k, a.min]));
    if (b.args.every((a) => cur[a.k] === target[a.k])) cur[b.args[0].k] += 1;
    const pic = h("div", { class: "mlea-buildpic" });
    const fb = fbBox();
    let n = 0;
    const sumOf = () => visualNode({ kind: spec.kind, ...fixed, ...cur });
    const paintPic = () => {
      clear(pic);
      const v = sumOf();
      if (v) pic.append(v.node, h("p", { class: "ml-sr" }, v.summary));
    };
    const steppers = b.args.map((a) => {
      const id = uid("st");
      const inp = h("input", { type: "number", id, inputmode: "numeric", min: a.min, max: a.max(spec, cur), value: String(cur[a.k]) });
      const setv = (v) => {
        const x = clampN(Math.round(Number(v) || 0), a.min, a.max(spec, cur));
        cur[a.k] = x;
        inp.value = String(x);
        paintPic();
      };
      inp.addEventListener("input", () => setv(inp.value));
      return h("div", { class: "mlea-stepper" }, h("label", { for: id }, `Number of ${a.label}`), h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn small", "aria-label": `Fewer ${a.label}`, onclick: () => setv(cur[a.k] - 1) }, MINUS), inp, h("button", { type: "button", class: "btn small", "aria-label": `More ${a.label}`, onclick: () => setv(cur[a.k] + 1) }, "+")));
    });
    paintPic();
    const src = textOf(p, W);
    const check = () => {
      if (b.args.every((a) => cur[a.k] === target[a.k])) {
        feedback(fb, "ok", "Your picture matches the story.");
        E.say("Yes. Your picture matches the story.");
        matched += 1;
        paintNav();
        if (!fb.querySelector("button")) fb.append(h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: () => load(round + 1) }, "Next round")));
        return;
      }
      n += 1;
      E.touched = true;
      const v = sumOf();
      const specific = (v && numberDiff(numerals(src), numerals(v.summary), "the story", "your picture")) || "The numbers are right but may be in the wrong places. Check what each number counts.";
      if (n <= 2) feedback(fb, "try", n === 1 ? specific : `${specific} Read the story again and find the number for each part of the picture.`);
      else {
        feedback(fb, "try", `${specific} Study how a different story is built, then try again.`);
        const q = E.parallel(p);
        if (q) fb.append(h("div", { class: "mlea-worked" }, h("p", { class: "mlea-worked-h" }, "Worked example (different numbers)"), h("p", {}, textOf(q, W)), q.visual ? visualNode(q.visual)?.node : null));
      }
      E.say("Not yet. A hint is shown.");
    };
    return h("section", { class: "mlea-panel", "data-mlea-stage": "build", "aria-labelledby": "mlea-tr-h" }, h("h3", { id: "mlea-tr-h", tabindex: "-1" }, "Build the picture"),
      h("div", { class: "mlea-source" }, h("p", { class: "mlea-label" }, "Start with the story:"), h("div", { class: "mlea-src" }, h("span", { class: "mlea-reptext" }, src)), h("div", { class: "mlea-row" }, hearButton(src, "Hear it"))),
      h("p", { class: "mlea-instr" }, "Change the numbers until the picture matches the story."),
      h("div", { class: "mlea-build" }, h("div", { class: "mlea-steppers" }, ...steppers, h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: check }, "Check my picture"))), pic), fb);
  }
  E.root.append(
    h("p", { class: "mlea-note" }, "The same situation can be a story, an expression or a picture. Find the one that matches and say why."),
    nav,
    counter,
    h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn", onclick: () => load(round + 1) }, "New problem"), h("button", { type: "button", class: "btn", onclick: () => { matched = 0; load(0); } }, "Start over")),
    host
  );
  load(0);
  return { destroy: E.destroy };
}

// ================================================================================================================ 5. Vocabulary Explorer
function vocabExplorer(el, opts) {
  const E = makeEnv(el, opts, "vocab-explorer");
  const { skill, band } = E;
  const vocab = (skill.vocab || []).filter((v) => v.term);
  if (!vocab.length) return notReady(E, "Vocabulary Explorer");
  const prereqTerms = () =>
    (skill.prereq || [])
      .map((id) => getSkill(id))
      .filter(Boolean)
      .map((s) => ({ skill: s.title, terms: (s.vocab || []).map((v) => v.term).slice(0, 4) }))
      .filter((x) => x.terms.length);
  let ti = 0;
  let tab = band === "1-2" ? "picture" : "meaning";
  const own = new Map();
  const seen = new Set();
  let quizDone = 0;
  const host = h("div", { class: "mlea-stagehost" });
  const termBar = h("div", { class: "mlea-tabs", role: "group", "aria-label": "Choose a word" });
  const tabBar = h("div", { class: "mlea-tabs", role: "group", "aria-label": "Ways to learn this word" });
  const counter = h("p", { class: "mlea-progress" });
  const tabsFor = (v) => [
    { id: "meaning", label: "Meaning" },
    { id: "example", label: "Example" },
    { id: "notexample", label: "Not an example" },
    { id: "picture", label: "Picture" },
    { id: "sentence", label: "Sentence" },
    v.everyday ? { id: "everyday", label: "Everyday and math" } : null,
    v.cognateEs ? { id: "spanish", label: "Spanish word" } : null,
    v.morphology ? { id: "parts", label: "Word parts" } : null,
    { id: "own", label: "Your own example" },
    { id: "connect", label: "Connections" },
  ].filter(Boolean);
  const boldTerm = (sentence, term) => {
    const re = new RegExp(escRe(term), "i");
    const m = sentence.match(re);
    if (!m) return [sentence];
    const i = sentence.indexOf(m[0]);
    return [sentence.slice(0, i), h("strong", { class: "mlea-term" }, m[0]), sentence.slice(i + m[0].length)];
  };
  const body = (v) => {
    switch (tab) {
      case "meaning":
        return [h("p", { class: "mlea-bigsentence" }, h("strong", {}, v.term), `: ${v.def}`), h("div", { class: "mlea-row" }, hearButton(v.term, "Say the word"), hearButton(`${v.term}. ${v.def}`, "Hear the meaning")), h("p", { class: "fine" }, "The voice is the device's computer voice, not a recording of a person.")];
      case "example":
        return [h("p", { class: "mlea-label" }, "An example of ", h("strong", {}, v.term)), h("p", { class: "mlea-bigsentence" }, v.example)];
      case "notexample":
        return [h("p", { class: "mlea-label" }, "Not an example of ", h("strong", {}, v.term)), h("p", { class: "mlea-bigsentence" }, v.nonExample), h("p", { class: "fine" }, "Ask: why is this not an example? What is different?")];
      case "picture": {
        const vis = v.visual ? visualNode(v.visual) : null;
        if (vis) return [vis.node, h("p", { class: "fine" }, vis.summary)];
        return [h("div", { class: "mlea-picbox", role: "group", "aria-label": `Example for ${v.term}` }, h("p", { class: "mlea-label" }, "No picture is drawn for this word. Here is an example:"), h("p", { class: "mlea-bigsentence" }, v.example)), h("p", { class: "fine" }, "Draw your own picture of it in your notebook.")];
      }
      case "sentence":
        return [h("p", { class: "mlea-bigsentence" }, boldTerm(v.sentence || v.example || "", v.term)), h("div", { class: "mlea-row" }, hearButton(v.sentence || v.example || v.term, "Hear the sentence"))];
      case "everyday":
        return [h("div", { class: "mlea-two" }, h("div", { class: "mlea-card" }, h("h4", {}, "Everyday meaning"), h("p", {}, v.everyday)), h("div", { class: "mlea-card" }, h("h4", {}, "Math meaning"), h("p", {}, v.def))), h("p", { class: "fine" }, "The same word, two meanings. In math class, use the math meaning.")];
      case "spanish":
        return [h("p", { class: "mlea-bigsentence" }, `${v.term} → `, h("strong", { lang: "es" }, v.cognateEs)), h("p", { class: "fine" }, `Draft for a native speaker to review. ${SPANISH_NOTE}`)];
      case "parts":
        return [h("p", { class: "mlea-bigsentence" }, v.morphology)];
      case "own": {
        const id = uid("own");
        const area = h("textarea", { id, rows: 3 });
        area.value = own.get(v.term) || "";
        const note = h("p", { class: "fine", role: "status" }, "Kept for this visit only. Nothing is saved or sent.");
        return [h("label", { for: id, class: "mlea-label" }, `Write your own example of "${v.term}".`), h("p", { class: "fine" }, `Frame: ${(FRAMES.Inform[band] || FRAMES.Inform["3-4"])[0].replace("{term}", v.term)}`), area, h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: () => {
          own.set(v.term, strip(area.value));
          note.textContent = area.value.trim() ? "Kept for this visit only. Nothing is saved or sent." : "Write something first.";
          E.say(note.textContent);
        } }, "Keep it for now")), note];
      }
      case "connect": {
        const others = vocab.filter((x) => x.term !== v.term);
        const pre = prereqTerms();
        return [h("p", { class: "mlea-label" }, `Other words in this skill (choose one to go to it):`), h("div", { class: "mlea-tabs" }, others.map((o) => h("button", { type: "button", class: "btn small", onclick: () => go(vocab.indexOf(o)) }, o.term))), pre.length ? h("div", {}, h("p", { class: "mlea-label" }, "Words from earlier skills:"), h("ul", {}, pre.map((x) => h("li", {}, h("strong", {}, `${x.skill}: `), x.terms.join(", "))))) : h("p", { class: "fine" }, "Earlier skills are not loaded here.")];
      }
      default:
        return [];
    }
  };
  function paint() {
    const v = vocab[ti];
    seen.add(v.term);
    clear(termBar);
    vocab.forEach((x, i) => termBar.append(h("button", { type: "button", class: "btn small", "aria-pressed": String(i === ti), onclick: () => go(i) }, x.term)));
    clear(tabBar);
    const tabs = tabsFor(v);
    if (!tabs.some((t) => t.id === tab)) tab = "meaning";
    for (const t of tabs) tabBar.append(h("button", { type: "button", class: "btn small", "aria-pressed": String(t.id === tab), onclick: () => { tab = t.id; paint(); E.say(`${t.label} for ${v.term}`); } }, t.label));
    clear(host);
    host.append(h("section", { class: "mlea-panel", "data-mlea-stage": "vocab", "aria-labelledby": "mlea-vx-h" }, h("h3", { id: "mlea-vx-h", tabindex: "-1" }, v.term, ), ...body(v)));
    counter.textContent = `Words explored: ${seen.size} of ${vocab.length}`;
  }
  function go(i) {
    ti = clampN(i, 0, vocab.length - 1);
    stopSpeech();
    paint();
    E.say(`Word: ${vocab[ti].term}`);
  }
  // ---- short check
  const quiz = h("section", { class: "mlea-panel mlea-quiz", hidden: true, "data-mlea-stage": "vocab-check", "aria-labelledby": "mlea-vq-h" });
  function startQuiz() {
    stopSpeech();
    quizDone = 0;
    host.hidden = true;
    for (const x of E.root.querySelectorAll(".mlea-label")) x.hidden = true;
    termBar.hidden = true;
    tabBar.hidden = true;
    quiz.hidden = false;
    quizItem(0);
  }
  function quizItem(k) {
    clear(quiz);
    const order = vocab.slice(E.seed % vocab.length).concat(vocab.slice(0, E.seed % vocab.length)).slice(0, Math.min(4, vocab.length));
    quiz.append(h("h3", { id: "mlea-vq-h", tabindex: "-1" }, "Check yourself"));
    if (k >= order.length) {
      quiz.append(h("p", { class: "mlea-okline" }, `✓ You answered ${order.length} questions.`), h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: backToExplore }, "Back to exploring"), h("button", { type: "button", class: "btn", onclick: startQuiz }, "Check again")));
      E.say("The check is finished.");
      return;
    }
    const v = order[k];
    const types = ["def", "picture", "cloze", "example"];
    let type = types[k % 4];
    if (type === "picture" && !v.visual) type = "example";
    if (type === "cloze" && !(v.sentence && clozeOf(v.sentence, v.term))) type = "def";
    const others = vocab.filter((x) => x.term !== v.term);
    if (!others.length) return quizItem(k + 1);
    const foils = others.slice(k % others.length).concat(others).filter((x, i, a) => a.indexOf(x) === i).slice(0, 2);
    const options = mix(`${skill.id}:vq:${k}:${E.seed}`, { label: v.term, v }, foils.map((f) => ({ label: f.term, v: f })));
    const fb = fbBox();
    let n = 0;
    const prompt =
      type === "def" ? [h("p", { class: "mlea-bigsentence" }, `Which word matches this meaning? "${v.def}"`)] : type === "picture" ? [visualNode(v.visual)?.node, h("p", { class: "mlea-bigsentence" }, "Which word goes with this picture?")] : type === "cloze" ? [h("p", { class: "mlea-bigsentence" }, clozeOf(v.sentence, v.term))] : [h("p", { class: "mlea-bigsentence" }, `Which word does this example show? "${v.example}"`)];
    const g = choiceGroup("Choose the word", options, (i) => {
      if (options[i].correct) {
        feedback(fb, "ok", `"${v.term}" is the word: ${v.def}`);
        E.say("Yes.");
        quizDone += 1;
        quiz.append(h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: () => quizItem(k + 1) }, k + 1 < order.length ? "Next question" : "Finish")));
        return true;
      }
      n += 1;
      E.touched = true;
      const chosen = options[i].v;
      feedback(fb, "try", n === 1 ? `"${chosen.term}" means: ${chosen.def} Does that match?` : n === 2 ? `Look at the Example tab words for the right one: ${v.example}` : `The right word means: ${v.def}`);
      E.say("Not yet. A hint is shown.");
      return false;
    }, { visual: false });
    quiz.append(h("p", { class: "mlea-progress" }, `Question ${k + 1} of ${order.length}`), ...prompt, g.el, fb);
  }
  function backToExplore() {
    quiz.hidden = true;
    host.hidden = false;
    for (const x of E.root.querySelectorAll(".mlea-label")) x.hidden = false;
    termBar.hidden = false;
    tabBar.hidden = false;
    paint();
  }
  E.root.append(
    h("p", { class: "mlea-note" }, "Learn each word from many sides: meaning, example, what it is not, a picture and a sentence of your own."),
    h("p", { class: "mlea-label" }, "Choose a word"),
    termBar,
    h("p", { class: "mlea-label" }, "Choose a way to learn it"),
    tabBar,
    counter,
    host,
    quiz,
    h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn", onclick: () => go((ti + 1) % vocab.length) }, "Next word"), h("button", { type: "button", class: "btn primary", onclick: startQuiz }, "Check yourself"), h("button", { type: "button", class: "btn", onclick: () => { own.clear(); seen.clear(); ti = 0; tab = band === "1-2" ? "picture" : "meaning"; backToExplore(); E.say("Started over."); } }, "Start over"))
  );
  paint();
  return { destroy: E.destroy };
}

// ================================================================================================================ 6. Math Talk Studio
function talkStudio(el, opts) {
  const E = makeEnv(el, opts, "talk-studio");
  const { skill, band } = E;
  const D = skill.discourse || {};
  const stems = TALK_STEMS[band];
  const frames = framesFor(skill, band, 3);
  const cards = [];
  const stemBox = (kinds) => h("div", { class: "mlea-stems" }, h("p", { class: "mlea-label" }, "Say it like this:"), h("ul", {}, kinds.flatMap((k) => stems[k].map((s) => h("li", {}, h("code", {}, s))))), frames.length ? h("p", { class: "fine" }, `Frame: ${frames[0]}`) : null);
  let swapped = false;
  const roleLine = (a, b) => h("p", { class: "mlea-roles" }, h("strong", {}, swapped ? "Partner B: " : "Partner A: "), a, " ", h("strong", {}, swapped ? "Partner A: " : "Partner B: "), b);
  const textBox = (label, id) => {
    const area = h("textarea", { id, rows: 2 });
    return { area, node: h("div", {}, h("label", { for: id, class: "mlea-label" }, label), area) };
  };
  const doneBtn = (done) => h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn primary", onclick: done }, "Mark this card done"));
  const sortBtns = (legend, labels, onPick) => {
    const g = h("div", { class: "mlea-choices", role: "group", "aria-label": legend });
    const bs = labels.map((l, i) => h("button", { type: "button", class: "mlea-opt", "aria-pressed": "false", onclick: () => {
      bs.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
      onPick(i);
    } }, h("span", { class: "mlea-letter", "aria-hidden": "true" }, `${String.fromCharCode(65 + i)}.`), h("span", { class: "mlea-opt-body" }, l)));
    g.append(...bs);
    return g;
  };

  if (D.noticeWonder?.prompt) {
    cards.push({ id: "nw", title: "Notice and wonder", build(done) {
      const a = textBox("I notice...", uid("nw"));
      const b = textBox("I wonder...", uid("nw"));
      return h("div", {}, h("p", { class: "mlea-bigsentence" }, D.noticeWonder.prompt), roleLine("Share what you notice.", "Say it back, then add a wonder."), a.node, b.node, stemBox(["explain", "respond"]), doneBtn(done));
    } });
  }
  if (D.wdntb?.items?.length >= 3) {
    cards.push({ id: "wdntb", title: "Which one doesn't belong?", build(done) {
      const fb = fbBox();
      let pick = -1;
      const g = sortBtns("Choose the one that does not belong", D.wdntb.items, (i) => (pick = i));
      const a = textBox("Because...", uid("wd"));
      return h("div", {}, h("p", { class: "fine" }, "Several answers can be defended. The reason matters."), g, a.node, h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn", onclick: () => {
        if (pick < 0) return feedback(fb, "try", "Choose one first.");
        const same = pick === D.wdntb.odd;
        feedback(fb, "info", same ? `Another reader chose "${D.wdntb.items[D.wdntb.odd]}" too. Their reason: ${D.wdntb.why}` : `You chose "${D.wdntb.items[pick]}". Another reader chose "${D.wdntb.items[D.wdntb.odd]}". Their reason: ${D.wdntb.why} Can you defend yours?`);
        E.say("A reason from another reader is shown.");
      } }, "Compare with another reason")), fb, roleLine("Explain your choice.", "Restate it, then say if you agree."), stemBox(["explain", "respond"]), doneBtn(done));
    } });
  }
  const asn = (D.asn || []).filter((x) => x.claim && x.verdict);
  if (asn.length) {
    cards.push({ id: "asn", title: "Always, sometimes or never?", build(done) {
      const wrap = h("div", {});
      const verdicts = ["always", "sometimes", "never"];
      let solved = 0;
      asn.forEach((c, ci) => {
        const fb = fbBox();
        let n = 0;
        const other = asn.find((x) => x !== c);
        const g = choiceGroup(`Is this claim always, sometimes or never true? ${c.claim}`, verdicts.map((v) => ({ label: cap(v) })), (i) => {
          if (verdicts[i] === c.verdict) {
            feedback(fb, "ok", `${c.why}`);
            E.say("Yes.");
            solved += 1;
            return true;
          }
          n += 1;
          E.touched = true;
          feedback(fb, "try", n === 1 ? "Try to find one example where it works and one where it does not." : n === 2 ? "One example that breaks the claim means it is not always true." : "Study how another claim was sorted, then try again.");
          if (n > 2 && other) fb.append(h("div", { class: "mlea-worked" }, h("p", { class: "mlea-worked-h" }, "Worked example (a different claim)"), h("p", {}, other.claim), h("p", {}, `${cap(other.verdict)}. ${other.why}`)));
          E.say("Not yet. A hint is shown.");
          return false;
        });
        wrap.append(h("div", { class: "mlea-claim" }, h("p", { class: "mlea-bigsentence" }, `${ci + 1}. ${c.claim}`), g.el, fb));
      });
      wrap.append(roleLine("Defend your sort with an example.", "Restate it, then ask a question."), stemBox(["explain", "question"]), doneBtn(done));
      return wrap;
    } });
  }
  if (D.wyr?.q) {
    cards.push({ id: "wyr", title: "Would you rather?", build(done) {
      const a = textBox("I would rather ___ because ___.", uid("wy"));
      const fb = fbBox();
      const g = sortBtns(D.wyr.q, [D.wyr.a, D.wyr.b], (i) => feedback(fb, "info", `You chose "${[D.wyr.a, D.wyr.b][i]}". Now give a reason. Then your partner argues for the other choice.`));
      return h("div", {}, h("p", { class: "mlea-bigsentence" }, D.wyr.q), g, fb, a.node, roleLine("Give your reason.", "Argue for the other choice, then compare."), stemBox(["explain", "respond"]), doneBtn(done));
    } });
  }
  if (D.compare?.a && D.compare?.b) {
    cards.push({ id: "compare", title: "Compare two strategies", build(done) {
      const a = textBox("The strategies are alike because ___. They are different because ___.", uid("cm"));
      return h("div", {}, h("div", { class: "mlea-pair" }, h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Strategy A: "), D.compare.a), h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Strategy B: "), D.compare.b)), h("p", {}, D.compare.prompt || "Which one would you use, and why?"), a.node, roleLine("Compare, using evidence.", "Restate the comparison, then add a question."), stemBox(["explain", "respond", "question"]), doneBtn(done));
    } });
  }
  const ecs = (skill.misconceptions || []).filter((m) => m.errorCase?.steps?.length);
  if (ecs.length) {
    cards.push({ id: "fix", title: "Find and fix the mistake", build(done) {
      const m = ecs[E.seed % ecs.length];
      const ec = m.errorCase;
      const wrap = h("div", {});
      const fb = fbBox();
      let n = 0;
      const g = choiceGroup("Which line is the first mistake?", ec.steps.map((s) => ({ label: s })), (i) => {
        if (i === ec.firstWrong) {
          feedback(fb, "ok", `Here is the fix: ${ec.explain}`);
          E.say("Yes.");
          return true;
        }
        n += 1;
        E.touched = true;
        feedback(fb, "try", n === 1 ? (i < ec.firstWrong ? "That line matches the story. Check the next line." : "A mistake started earlier. Look further up.") : "Compare each line with the story. The first line that does not match is the mistake.");
        E.say("Not yet. A hint is shown.");
        return false;
      });
      wrap.append(h("p", { class: "mlea-bigsentence" }, ec.story), g.el, fb, roleLine("Find the mistake and explain how to fix it.", "Restate the fix, then say if you agree."), stemBox(["explain", "respond"]), doneBtn(done));
      return wrap;
    } });
  }
  if (D.debate?.claim) {
    cards.push({ id: "debate", title: "Defend your reasoning", build(done) {
      const ev = h("div", { class: "mlea-evidence", hidden: true }, h("p", {}, h("strong", {}, "Evidence for: "), D.debate.forEvidence || ""), h("p", {}, h("strong", {}, "Evidence against: "), D.debate.againstEvidence || ""));
      const t = h("input", { type: "checkbox", onchange: (e) => (ev.hidden = !e.target.checked) });
      const a = textBox("My claim and evidence...", uid("db"));
      return h("div", {}, h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Claim: "), D.debate.claim), roleLine("Argue for the claim.", "Argue against it, then switch."), a.node, h("label", { class: "mlea-toggle" }, t, h("span", {}, "Show evidence to think about")), ev, stemBox(["explain", "respond", "question"]), doneBtn(done));
    } });
  }
  const partner = skill.sentence?.because || skill.misconceptions?.find((m) => m.errorCase)?.errorCase?.explain || D.compare?.a;
  if (partner) {
    cards.push({ id: "restate", title: "Restate your partner", build(done) {
      const a = textBox("So you are saying...", uid("rs"));
      const fb = fbBox();
      return h("div", {}, h("p", { class: "mlea-bigsentence" }, h("strong", {}, "Your partner says: "), partner), a.node, h("div", { class: "mlea-row" }, h("button", { type: "button", class: "btn", onclick: () => {
        const mine = strip(a.area.value).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "");
        const theirs = strip(partner).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "");
        const words = mine.split(" ").filter(Boolean);
        if (words.length < 4) feedback(fb, "try", "Say a little more: restate in at least four words.");
        else if (mine === theirs) feedback(fb, "try", "Use your own words, not the same words.");
        else feedback(fb, "ok", "You restated it. Ask your partner: did I get your idea?");
        E.say("Restate checked.");
      } }, "Check my restating")), fb, roleLine("Explain your idea (read it aloud).", "Restate it in your own words."), stemBox(["respond", "question"]), doneBtn(done));
    } });
  }
  if (!cards.length) return notReady(E, "Math Talk Studio");
  let idx = E.seed % cards.length;
  const doneSet = new Set();
  const host = h("div", { class: "mlea-stagehost" });
  const nav = h("div", { class: "mlea-tabs", role: "group", "aria-label": "Deck of talk cards" });
  const counter = h("p", { class: "mlea-progress" });
  const paint = () => {
    clear(nav);
    cards.forEach((c, i) => nav.append(h("button", { type: "button", class: "btn small", "aria-pressed": String(i === idx), onclick: () => show(i) }, `${doneSet.has(c.id) ? "✓ " : ""}${c.title}`)));
    counter.textContent = `Cards done this visit: ${doneSet.size} of ${cards.length}`;
  };
  function show(i) {
    stopSpeech();
    idx = i;
    clear(host);
    const c = cards[i];
    const sec = h("section", { class: "mlea-panel", "data-mlea-stage": c.id, "aria-labelledby": `mlea-tk-${c.id}` }, h("h3", { id: `mlea-tk-${c.id}`, tabindex: "-1" }, c.title));
    sec.append(c.build(() => {
      doneSet.add(c.id);
      paint();
      E.say(`Card done. ${doneSet.size} of ${cards.length}.`);
    }));
    host.append(sec);
    paint();
    if (E.touched) sec.querySelector("h3").focus();
    E.say(c.title);
  }
  E.root.append(
    h("p", { class: "mlea-note" }, "Talk with a partner first, then write a line if you like. The mathematics is the same for everyone; only the sentence starters change."),
    nav,
    counter,
    h("div", { class: "mlea-row" },
      h("button", { type: "button", class: "btn", onclick: () => show((idx + 1) % cards.length) }, "Next card"),
      h("button", { type: "button", class: "btn", "aria-pressed": "false", onclick: (e) => { swapped = !swapped; e.currentTarget.setAttribute("aria-pressed", String(swapped)); show(idx); E.say(swapped ? "Roles swapped." : "Roles back."); } }, "Swap partner roles"),
      h("button", { type: "button", class: "btn", onclick: () => { doneSet.clear(); swapped = false; show(E.seed % cards.length); } }, "Start over")),
    host
  );
  show(idx);
  return { destroy: E.destroy };
}

// ------------------------------------------------------------------------------------------------------------------ registry
export const ENGINES = {
  "reading-lab": {
    title: "Mathematical Reading Lab",
    blurb: "Walk one word problem step by step: read or listen, find the question, mark the quantities, name the relationship, choose a picture and a number sentence, solve, explain and revise.",
    mount: guarded("reading-lab", readingLab),
  },
  anatomy: {
    title: "Word Problem Anatomy",
    blurb: "Take a problem apart: what is happening, what is known and unknown, how the quantities relate, what model fits and what a reasonable answer looks like.",
    mount: guarded("anatomy", anatomy),
  },
  "sentence-studio": {
    title: "Mathematical Sentence Studio",
    blurb: "Build mathematical sentences with because, but and so: complete, expand, combine, swap vague words, explain strategies and errors, and write a claim, evidence and reasoning.",
    mount: guarded("sentence-studio", sentenceStudio),
  },
  translator: {
    title: "Representation Translator",
    blurb: "Move one situation among a story, an expression, a picture and a description, or build the picture from the story.",
    mount: guarded("translator", translator),
  },
  "vocab-explorer": {
    title: "Mathematical Vocabulary Explorer",
    blurb: "Explore a word from many sides: meaning, example, non-example, picture, sentence, everyday meaning, Spanish word, word parts, your own example and connections. Then check yourself.",
    mount: guarded("vocab-explorer", vocabExplorer),
  },
  "talk-studio": {
    title: "Math Talk Studio",
    blurb: "A deck of structured conversation cards with partner roles and sentence starters: notice and wonder, which one does not belong, always sometimes never, compare, find the mistake and defend.",
    mount: guarded("talk-studio", talkStudio),
  },
};

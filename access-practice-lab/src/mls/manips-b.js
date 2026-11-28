// Math Literacy Studio: the twelve grades 6-8 manipulatives (inventory.json, band "6-8"), built with defineManip (manip-kit.js).
// Each one is controls -> state -> a Visuals spec (visuals.js) + a plain-language summary that states the real values, so the picture is
// never the only way to read it. Exact arithmetic everywhere (Fr from kit.js), no timers, nothing drag-only.
//
// Actions (apply an operation to both sides, run trials, undo, feed an input ...) are real buttons built with h() and returned in `extra`.
// Their history lives in state._ (one object, so the whole history is one assignment; "_" cannot clash with a control id). manip-kit.js re-renders the picture after every
// change, which would drop keyboard focus from a button inside it, so run() puts focus back on the same button.
// A text note from the last action ("Not allowed: ...") is shown at the front of the live summary until a control changes.
import { defineManip } from "./manip-kit.js";
import { renderVisual } from "./visuals.js";
import { h } from "./ui-kit.js";
import { fr, makeRng, hashStr, MINUS } from "./kit.js";

/* ---------------------------------------------------------------- shared helpers */

export const META = {};
const REG = new WeakMap();
const fp = (s) => JSON.stringify(Object.entries(s).filter(([k]) => k !== "_"));

/** Run one action: fn(x, state) -> { x?, ctl?, note }. A refused action returns only a note, so the state does not change. */
function run(o, id, fn) {
  const r = REG.get(o);
  if (!r) return;
  const st = r.handle.state;
  let res;
  try {
    res = fn(st._ || {}, st) || {};
  } catch {
    res = { note: "That did not work. Try again." };
  }
  for (const [k, v] of Object.entries(res.ctl || {})) r.handle.set(k, v);
  r.handle.set("_", { ...(res.x || st._ || {}), note: res.note || "", noteFp: fp({ ...st, ...(res.ctl || {}) }) });
  ((res.focus && r.el.querySelector(res.focus)) || r.el.querySelector(`[data-act="${id}"]`))?.focus();
}

function sheet() {
  try {
    if (typeof document === "undefined") return;
    const href = new URL("../../mls-play-manips-b.css", import.meta.url).href;
    if (!document.querySelector(`link[data-mls-manips-b]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      l.setAttribute("data-mls-manips-b", "");
      document.head.append(l);
    }
  } catch {
    /* the manipulatives still work without their extra stylesheet */
  }
}

function manip(def) {
  META[def.id] = { controls: def.controls, notice: def.notice, purpose: def.purpose, title: def.title };
  const base = defineManip({
    ...def,
    model(s, o) {
      const x = s._ || {};
      const note = x.noteFp === fp(s) ? x.note || "" : "";
      const ctx = {
        x,
        btn: (id, label, fn, off = false) =>
          h("button", { type: "button", class: "btn ml-mb-btn", "data-act": id, "aria-disabled": off ? "true" : null, onclick: () => run(o, id, fn) }, label),
        /** A typed-answer box with an exact check. `expected` is a Fr; `key` ties the result to the puzzle it was typed for. */
        answer(id, label, expected, key, hint) {
          const res = x.res && x.res.key === key ? x.res : null;
          let viaKey = false; // Enter pressed in the box keeps the cursor in the box, so the next try can be typed at once
          const inp = h("input", {
            id: `mb-${def.id}-${id}`,
            type: "text",
            class: "ml-mb-in",
            autocomplete: "off",
            spellcheck: "false",
            value: res ? res.text : "",
            onkeydown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                viaKey = true;
                chk.click();
                viaKey = false;
              }
            },
          });
          const chk = ctx.btn(`${id}-check`, "Check my answer", (xx) => {
            const focus = viaKey ? `#mb-${def.id}-${id}` : null;
            const p = parseFr(inp.value);
            if (!p) return { note: "Type a whole number, a decimal such as 2.5, or a fraction such as 3/4.", focus };
            const ok = p.cmp(expected) === 0;
            return { x: { ...xx, res: { key, text: inp.value.trim(), ok } }, note: ok ? "Yes. That is exactly right." : `Not yet. ${hint}`, focus };
          });
          return h("div", { class: "ml-mb-answer" }, h("label", { for: `mb-${def.id}-${id}` }, label), h("span", { class: "ml-mb-row" }, inp, chk), res ? h("p", { class: "ml-mb-result" }, res.ok ? `✓ Correct: ${res.text} is exactly right.` : `✗ Not yet: ${res.text} is not the hidden value.`) : null);
        },
      };
      const m = def.model(s, ctx, o);
      if (note && m.summary) m.summary = `${note} ${m.summary}`;
      return m;
    },
  });
  return {
    ...base,
    mount(el, opts = {}) {
      sheet();
      const o = { ...opts };
      const handle = base.mount(el, o);
      REG.set(o, { handle, el });
      return handle;
    },
  };
}

/* numbers */
const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const I = (v, lo, hi, d = lo) => Math.max(lo, Math.min(hi, Math.round(num(v, d))));
const Hf = (v, lo, hi, d = lo) => Math.max(lo, Math.min(hi, Math.round(num(v, d) * 2) / 2));
const F0 = fr(0);
const neg = (f) => fr(-f.n, f.d);
const abs = (f) => (f.n < 0 ? neg(f) : f);
const same = (f, g) => f.cmp(g) === 0;
const tooBig = (f) => Math.abs(f.n) > 1e7 || f.d > 1e7;
const com = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
/** Display text of an exact value: real minus sign, thousands commas, fractions as a/b. */
const T = (f) => (f.n < 0 ? MINUS : "") + (f.d === 1 ? com(String(Math.abs(f.n))) : `${com(String(Math.abs(f.n)))}/${f.d}`);
/** The same value as a string the Visuals accept ("-3/4"). */
const V = (f) => String(f);
const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);
const list = (xs) => (xs.length <= 1 ? xs.join("") : xs.length === 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const vsum = (spec) => renderVisual(spec).summary;
const seeded = (o, presets) => {
  const k = o?.skill?.id;
  return k ? presets[hashStr(String(k)) % presets.length] : {};
};
const oneOf = (v, keys, d) => (keys.includes(v) ? v : d);

/** A decimal for an exact value: exact when it terminates (up to 6 places), otherwise rounded to `places`. */
function dec(f, places = 3) {
  const n = Math.abs(f.n);
  let d = f.d;
  let t = 0;
  let v = 0;
  while (d % 2 === 0) {
    d /= 2;
    t++;
  }
  while (d % 5 === 0) {
    d /= 5;
    v++;
  }
  const exact = d === 1 && Math.max(t, v) <= 6;
  const p = exact ? Math.max(t, v) : places;
  const scaled = exact ? (n * 10 ** p) / f.d : Math.round((n * 10 ** p) / f.d);
  let s = String(scaled).padStart(p + 1, "0");
  if (p) s = `${s.slice(0, -p)}.${s.slice(-p)}`;
  return { text: (f.n < 0 && Number(s) !== 0 ? MINUS : "") + s, exact };
}
/** "5/3 (about 1.667)", "7/2 (3.5)" or "4". */
const both = (f) => {
  if (f.d === 1) return T(f);
  const d = dec(f);
  return `${T(f)} (${d.exact ? "" : "about "}${d.text})`;
};
/** A typed answer: whole number, decimal, fraction or mixed number, as an exact value (or null). */
function parseFr(s) {
  const t = String(s).trim().replace(/−/g, "-").replace(/,/g, "").replace(/^\+/, "");
  let m;
  if ((m = /^(-?)(\d{1,9})\s+(\d{1,9})\/(\d{1,9})$/.exec(t))) {
    const d = Number(m[4]);
    if (!d) return null;
    const n = Number(m[2]) * d + Number(m[3]);
    return fr(m[1] ? -n : n, d);
  }
  if ((m = /^(-?\d{1,9})\/(\d{1,9})$/.exec(t))) return Number(m[2]) === 0 ? null : fr(Number(m[1]), Number(m[2]));
  if ((m = /^(-?)(\d{0,9})\.(\d{1,6})$/.exec(t))) return fr(Number(`${m[1]}${m[2] || "0"}${m[3]}`), 10 ** m[3].length);
  if (/^-?\d{1,9}$/.test(t)) return fr(Number(t));
  return null;
}
/** c·x as text: 3x, −x, x/4, −3x/4. */
function coefX(c) {
  const a = abs(c);
  const body = a.d === 1 ? (a.n === 1 ? "x" : `${a.n}x`) : a.n === 1 ? `x/${a.d}` : `${a.n}x/${a.d}`;
  return (c.n < 0 ? MINUS : "") + body;
}
/** c·x + k as text: "3x + 4", "x − 16", "x/4", "5", "0". */
function linText(c, k) {
  let s = c.n !== 0 ? coefX(c) : "";
  if (k.n !== 0) s = s ? `${s} ${k.n < 0 ? MINUS : "+"} ${T(abs(k))}` : T(k);
  return s || "0";
}
/** A real HTML table inside a keyboard-focusable scroll region (a wide table scrolls instead of widening the page). */
const tbl = (caption, headers, rows) =>
  h("div", { class: "ml-mb-scroll", role: "region", "aria-label": caption, tabindex: "0" }, h("table", { class: "ml-mb-table" }, h("caption", {}, caption), h("thead", {}, h("tr", {}, headers.map((x) => h("th", { scope: "col" }, x)))), h("tbody", {}, rows.map((r) => h("tr", {}, r.map((cell, i) => h(i === 0 ? "th" : "td", i === 0 ? { scope: "row" } : {}, cell)))))));
const svgBox = (spec) => {
  const d = h("div", { class: "ml-man-svg ml-mb-svg" });
  d.innerHTML = renderVisual(spec).svg; // our own generated SVG, never user text
  return d;
};
const steps = (items) => (items.length ? h("ol", { class: "ml-mb-log", "aria-label": "Steps so far" }, items.map((t) => h("li", {}, t))) : null);

/* ================================================================ 1. ratiotable */

const RCTX = {
  ab: { A: "Amount A", B: "Amount B", a: "amount A", b: "amount B" },
  recipe: { A: "Cups of flour", B: "Cups of sugar", a: "cup of flour", b: "cup of sugar" },
  travel: { A: "Miles", B: "Hours", a: "mile", b: "hour" },
  store: { A: "Pencils", B: "Dollars", a: "pencil", b: "dollar" },
};
const GROW = { x2: 2, x3: 3, x5: 5, add: 0 };
const multOf = (grow, k) => (grow === "add" ? k + 1 : GROW[grow] ** k);
const RCTX_OPTS = [["ab", "Amount A and Amount B"], ["recipe", "Cups of flour and cups of sugar"], ["travel", "Miles and hours"], ["store", "Pencils and dollars"]];

const ratiotable = manip({
  id: "ratiotable",
  title: "Ratio tables",
  band: "6-8",
  purpose: "Builds the idea that every row of a ratio table is the same ratio, scaled by one multiplier that applies to both quantities.",
  notice: ["What stays the same from row to row, and what changes?", "Hide a cell. How can the multiplier help you find it?", "How is the unit rate related to the first row?"],
  controls: [
    { id: "a", label: "First quantity in the base ratio", type: "stepper", min: 1, max: 20, value: 3 },
    { id: "b", label: "Second quantity in the base ratio", type: "stepper", min: 1, max: 20, value: 5 },
    { id: "rows", label: "Number of rows", type: "stepper", min: 2, max: 6, value: 4 },
    { id: "grow", label: "How the rows grow", type: "choice", options: [["x2", "Multiply by 2 each row (1, 2, 4, 8 ...)"], ["x3", "Multiply by 3 each row (1, 3, 9, 27 ...)"], ["x5", "Multiply by 5 each row (1, 5, 25 ...)"], ["add", "Whole-number multiples (1, 2, 3, 4 ...)"]], value: "x2" },
    { id: "ctx", label: "Quantities", type: "choice", options: RCTX_OPTS, value: "ab" },
    { id: "hrow", label: "Hide a cell in row (0 = show every cell)", type: "stepper", min: 0, max: 6, value: 0 },
    { id: "hcol", label: "Which cell to hide", type: "choice", options: [["0", "The multiplier"], ["1", "The first quantity"], ["2", "The second quantity"]], value: "1" },
  ],
  start: (o) => seeded(o, [{ a: 3, b: 5 }, { a: 2, b: 7 }, { a: 4, b: 6 }, { a: 5, b: 2 }]),
  model(s, c) {
    const a = I(s.a, 1, 20, 3);
    const b = I(s.b, 1, 20, 5);
    const n = I(s.rows, 2, 6, 4);
    const grow = oneOf(s.grow, Object.keys(GROW), "x2");
    const nm = RCTX[s.ctx] || RCTX.ab;
    const hrow = Math.min(I(s.hrow, 0, 6, 0), n);
    const hcol = I(s.hcol, 0, 2, 1);
    const rows = Array.from({ length: n }, (_, k) => {
      const m = multOf(grow, k);
      return [m, a * m, b * m];
    });
    const spec = { kind: "ratiotable", headers: ["Multiplier", nm.A, nm.B], rows, hide: hrow ? [[hrow - 1, hcol]] : [] };
    // Row 1 is the base ratio itself: when it is the hidden row, the sentences that name it are left out so they cannot give the answer away.
    const out = [];
    if (hrow !== 1) out.push(`The base ratio is ${a} to ${b}: ${nm.a} to ${nm.b}.`);
    out.push(grow === "add" ? "Row k is the base row multiplied by k." : `Each row is the row above multiplied by ${GROW[grow]}.`);
    out.push(vsum(spec));
    if (hrow !== 1) out.push(`Unit rates: for every 1 ${nm.a} there are ${both(fr(b, a))} ${nm.b}, and for every 1 ${nm.b} there are ${both(fr(a, b))} ${nm.a}. Every row is equivalent to ${a}:${b}.`);
    const key = [a, b, n, grow, hrow, hcol].join("|");
    return {
      spec,
      summary: out.join(" "),
      extra: h("div", { class: "ml-mb" }, hrow ? c.answer("ans", `Type the hidden number (row ${hrow})`, fr(rows[hrow - 1][hcol]), key, "Every number in a row is the same multiple of the first row, so find the multiplier first.") : h("p", { class: "ml-mb-tip" }, "Use “Hide a cell in row” to turn the table into a puzzle.")),
    };
  },
});

/* ================================================================ 2. doublenl */

const doublenl = manip({
  id: "doublenl",
  title: "Double number lines",
  band: "6-8",
  purpose: "Shows two quantities moving together, so equal jumps on one line match equal jumps on the other and a missing value can be found by scaling.",
  notice: ["How does a jump on the top line match a jump on the bottom line?", "What multiplies both numbers when you go from one tick to another?", "How could you find the value for one unit, and then for any amount?"],
  controls: [
    { id: "a", label: "First quantity in the base ratio", type: "stepper", min: 1, max: 20, value: 3 },
    { id: "b", label: "Second quantity in the base ratio", type: "stepper", min: 1, max: 20, value: 5 },
    { id: "jump", label: "Each tick adds this many copies of the base ratio", type: "stepper", min: 1, max: 5, value: 1 },
    { id: "pairs", label: "Number of steps along the line", type: "stepper", min: 2, max: 8, value: 5 },
    { id: "ctx", label: "Quantities", type: "choice", options: RCTX_OPTS, value: "ab" },
    { id: "hide", label: "Hide the value at tick (0 = show every value)", type: "stepper", min: 0, max: 8, value: 0 },
    { id: "hline", label: "Which line to hide it on", type: "choice", options: [["top", "The top line"], ["bottom", "The bottom line"]], value: "bottom" },
    { id: "target", label: "Find the second quantity for this amount of the first (0 = off)", type: "stepper", min: 0, max: 200, value: 0 },
  ],
  start: (o) => seeded(o, [{ a: 3, b: 5 }, { a: 2, b: 7 }, { a: 4, b: 6 }, { a: 5, b: 2 }]),
  model(s, c) {
    const a = I(s.a, 1, 20, 3);
    const b = I(s.b, 1, 20, 5);
    const jump = I(s.jump, 1, 5, 1);
    const pairs = I(s.pairs, 2, 8, 5);
    const nm = RCTX[s.ctx] || RCTX.ab;
    const hide = Math.min(I(s.hide, 0, 8, 0), pairs);
    const hline = s.hline === "top" ? "top" : "bottom";
    const target = I(s.target, 0, 200, 0);
    const topV = Array.from({ length: pairs + 1 }, (_, k) => k * jump * a);
    const botV = Array.from({ length: pairs + 1 }, (_, k) => k * jump * b);
    const hidden = (arr, line) => arr.map((v, k) => (hide && hline === line && k === hide ? null : v));
    const spec = { kind: "doublenl", top: { label: nm.A, values: hidden(topV, "top") }, bottom: { label: nm.B, values: hidden(botV, "bottom") } };
    const out = [`Double number line for the ratio ${a} to ${b}. Each tick adds ${jump} ${plural(jump, "copy", "copies")} of the base ratio, so the top line counts by ${jump * a} and the bottom line counts by ${jump * b}.`, vsum(spec)];
    if (target) {
      const k = fr(target, a);
      const val = fr(b * target, a);
      out.push(`Finding ${nm.b} for ${target} ${nm.a}: the scale factor is ${target} ÷ ${a} = ${both(k)}, so ${nm.b} is ${b} × ${both(k)} = ${both(val)}.`);
    }
    const key = [a, b, jump, pairs, hide, hline].join("|");
    const exp = fr(hline === "top" ? topV[hide] || 0 : botV[hide] || 0);
    return {
      spec,
      summary: out.join(" "),
      extra: h("div", { class: "ml-mb" }, hide ? c.answer("ans", `Type the missing number on the ${hline} line (tick ${hide})`, exp, key, "Both lines are multiplied by the same scale factor. Look at how the other line changes from tick to tick.") : h("p", { class: "ml-mb-tip" }, "Use “Hide the value at tick” to make a missing value to find.")),
    };
  },
});

/* ================================================================ 3. tape */

const tape = manip({
  id: "tape",
  title: "Tape diagrams",
  band: "6-8",
  purpose: "Draws a ratio, a part-whole situation or a comparison as equal-sized parts, so the unknown can be found from how the parts relate.",
  notice: ["Which parts are the same size, and how do you know?", "What does the question mark stand for in this tape?", "How could you find the unknown using the parts you can see?"],
  controls: [
    { id: "kind", label: "What the tape shows", type: "choice", options: [["ratio", "A ratio of A to B (equal parts)"], ["whole", "Two parts that make a whole"], ["compare", "A comparison with a difference"]], value: "ratio" },
    { id: "a", label: "A (units in the first quantity)", type: "stepper", min: 1, max: 9, value: 3 },
    { id: "b", label: "B (units in the second quantity)", type: "stepper", min: 1, max: 9, value: 5 },
    { id: "v", label: "Size of one unit", type: "stepper", min: 1, max: 20, value: 4 },
    { id: "unknown", label: "What to hide", type: "choice", options: [["none", "Show every value"], ["total", "Hide the total (or the difference)"], ["first", "Hide the first row or part"], ["second", "Hide the second row or part"]], value: "none" },
  ],
  start: (o) => seeded(o, [{ a: 3, b: 5, v: 4 }, { a: 2, b: 7, v: 3 }, { a: 4, b: 6, v: 2 }, { a: 5, b: 2, v: 6 }]),
  model(s) {
    const kind = oneOf(s.kind, ["ratio", "whole", "compare"], "ratio");
    const a = I(s.a, 1, 9, 3);
    const b = I(s.b, 1, 9, 5);
    const v = I(s.v, 1, 20, 4);
    const unk = oneOf(s.unknown, ["none", "total", "first", "second"], "none");
    const Q = (hid, val) => (hid ? "?" : val);
    let spec;
    let relation;
    if (kind === "ratio") {
      spec = { kind: "tape", rows: [{ label: "A", parts: [{ value: Q(unk === "first", v), n: a }] }, { label: "B", parts: [{ value: Q(unk === "second", v), n: b }] }], total: Q(unk === "total", (a + b) * v) };
      relation = `The ratio of A to B is ${a} to ${b}, so A has ${a} equal ${plural(a, "part")} and B has ${b}. Together that is ${a + b} equal parts.`;
      relation += unk === "none" ? ` Each part is ${v}, so the total is ${a + b} × ${v} = ${(a + b) * v}.` : " All the parts are the same size, so the parts you can see tell you the size of the hidden ones.";
    } else if (kind === "whole") {
      spec = { kind: "tape", rows: [{ label: "Whole", parts: [{ label: "first part", value: Q(unk === "first", a * v) }, { label: "second part", value: Q(unk === "second", b * v) }] }], total: Q(unk === "total", (a + b) * v) };
      relation = unk === "none" ? `The two parts ${a * v} and ${b * v} make a whole of ${a * v} + ${b * v} = ${(a + b) * v}.` : "Two parts make the whole, so part + part = whole. Use the values you can see to find the one that is hidden.";
    } else {
      const diff = Math.abs(a - b) * v;
      const dPart = (hid) => ({ label: "difference", value: Q(hid, diff) });
      spec = {
        kind: "tape",
        rows: [
          { label: "A", parts: [{ value: Q(unk === "first", a * v) }, ...(a < b ? [dPart(unk === "total")] : [])] },
          { label: "B", parts: [{ value: Q(unk === "second", b * v) }, ...(b < a ? [dPart(unk === "total")] : [])] },
        ],
      };
      if (a === b) relation = `A and B are both ${a * v}, so the two rows are equal and there is no difference.`;
      else relation = unk === "none" ? `A is ${a * v} and B is ${b * v}. The longer row is ${diff} more than the shorter one: ${Math.max(a, b) * v} ${MINUS} ${Math.min(a, b) * v} = ${diff}.` : "The longer row is the shorter row plus the difference. Use the values you can see to find the one that is hidden.";
    }
    // a hidden part is drawn at the average size of the visible ones, so say so when that is not its real size
    const placeholder = (kind === "whole" && (unk === "first" || unk === "second")) || (kind === "compare" && (a !== b ? unk !== "none" : unk === "first" || unk === "second"));
    return { spec, summary: `${vsum(spec)} ${relation}${placeholder ? " The box with a question mark is not drawn to scale." : ""}` };
  },
});

/* ================================================================ 4. algebratiles */

const algebratiles = manip({
  id: "algebratiles",
  title: "Algebra tiles",
  band: "6-8",
  purpose: "Lets learners build an expression from x-tiles and unit tiles, remove zero pairs, and see that the simplified expression has the same value.",
  notice: ["Which tiles cancel each other, and why do they make zero?", "What happens to the value of the expression when you remove zero pairs?", "How do the tile counts show up in the simplified expression?"],
  controls: [
    { id: "x", label: "x-tiles", type: "stepper", min: 0, max: 12, value: 3 },
    { id: "negX", label: "Negative x-tiles (−x)", type: "stepper", min: 0, max: 12, value: 1 },
    { id: "one", label: "Unit tiles (1)", type: "stepper", min: 0, max: 12, value: 2 },
    { id: "negOne", label: "Negative unit tiles (−1)", type: "stepper", min: 0, max: 12, value: 5 },
    { id: "xval", label: "Try x equal to", type: "stepper", min: -10, max: 10, value: 2 },
  ],
  start: (o) => seeded(o, [{ x: 3, negX: 1, one: 2, negOne: 5 }, { x: 2, negX: 4, one: 6, negOne: 1 }, { x: 5, negX: 2, one: 0, negOne: 3 }]),
  model(s, c) {
    const x = I(s.x, 0, 12, 0);
    const nx = I(s.negX, 0, 12, 0);
    const one = I(s.one, 0, 12, 0);
    const no = I(s.negOne, 0, 12, 0);
    const xv = I(s.xval, -10, 10, 2);
    const px = Math.min(x, nx);
    const po = Math.min(one, no);
    const cf = x - nx;
    const k = one - no;
    const simp = linText(fr(cf), fr(k));
    const raw = [x && coefX(fr(x)), nx && `(${coefX(fr(-nx))})`, one && `${one}`, no && `(${MINUS}${no})`].filter(Boolean).join(" + ") || "0";
    const rawVal = x * xv - nx * xv + one - no;
    const simpVal = cf * xv + k;
    const act = (id, label, fn, off) => c.btn(id, label, fn, off);
    const buttons = h(
      "div",
      { class: "ml-mb ml-mb-actions" },
      act("zero", "Remove zero pairs", () => (px + po === 0 ? { note: "There are no zero pairs to remove." } : { ctl: { x: x - px, negX: nx - px, one: one - po, negOne: no - po }, note: `Removed ${px} pair${px === 1 ? "" : "s"} of x and ${MINUS}x and ${po} pair${po === 1 ? "" : "s"} of 1 and ${MINUS}1.` })),
      act("addx", `Add a zero pair (x and ${MINUS}x)`, () => (x >= 12 || nx >= 12 ? { note: "No room: there can be at most 12 of each kind of tile." } : { ctl: { x: x + 1, negX: nx + 1 }, note: `Added one x-tile and one ${MINUS}x tile. They make a zero pair.` }), x >= 12 || nx >= 12),
      act("add1", `Add a zero pair (1 and ${MINUS}1)`, () => (one >= 12 || no >= 12 ? { note: "No room: there can be at most 12 of each kind of tile." } : { ctl: { one: one + 1, negOne: no + 1 }, note: `Added one unit tile and one ${MINUS}1 tile. They make a zero pair.` }), one >= 12 || no >= 12),
    );
    const empty = x + nx + one + no === 0;
    const parts = [];
    if (empty) parts.push("The mat has no tiles. Add some tiles to build an expression.");
    else parts.push(vsum({ kind: "tiles", x, one, negX: nx, negOne: no }));
    parts.push(`As an expression: ${raw}.`);
    parts.push(`Zero pairs: ${px} ${plural(px, "pair")} of x and ${MINUS}x, and ${po} ${plural(po, "pair")} of 1 and ${MINUS}1. Each pair adds up to 0.`);
    parts.push(`Simplified: ${simp}.`);
    parts.push(`Check with x = ${xv}: counting every tile gives ${T(fr(rawVal))}, and the simplified expression gives ${T(fr(simpVal))}. Removing zero pairs does not change the value.`);
    return { spec: empty ? undefined : { kind: "tiles", x, one, negX: nx, negOne: no }, extra: h("div", { class: "ml-mb" }, empty ? h("p", { class: "ml-mb-tip" }, "No tiles yet. Use the steppers to add tiles.") : null, buttons), summary: parts.join(" ") };
  },
});

/* ================================================================ 5. balance */

const bal = (e, op) => {
  const k = fr(op.k);
  switch (op.t) {
    case "addn": return { ...e, B: e.B.add(k), D: e.D.add(k) };
    case "subn": return { ...e, B: e.B.sub(k), D: e.D.sub(k) };
    case "addx": return { ...e, A: e.A.add(k), C: e.C.add(k) };
    case "subx": return { ...e, A: e.A.sub(k), C: e.C.sub(k) };
    default: return { A: e.A.div(k), B: e.B.div(k), C: e.C.div(k), D: e.D.div(k) };
  }
};
const balText = (e) => `${linText(e.A, e.B)} = ${linText(e.C, e.D)}`;
const balOp = (op) => {
  const k = fr(op.k);
  return { addn: `Add ${T(k)} to both sides`, subn: `Subtract ${T(k)} from both sides`, addx: `Add ${coefX(k)} to both sides`, subx: `Subtract ${coefX(k)} from both sides`, div: `Divide both sides by ${T(k)}` }[op.t];
};
const balOk = (e) => ![e.A, e.B, e.C, e.D].some(tooBig);
/** The solution of a x + b = c x + d: a fraction, "all" (identity) or "none". */
const balSolve = (e) => {
  const da = e.A.sub(e.C);
  if (da.n === 0) return same(e.B, e.D) ? "all" : "none";
  return e.D.sub(e.B).div(da);
};

const balance = manip({
  id: "balance",
  title: "Balance models",
  band: "6-8",
  purpose: "Shows an equation as a balanced scale, so learners see that doing the same thing to both sides keeps the equation true and finds the solution.",
  notice: ["What happens to the solution when you do the same thing to both sides?", "Put in a trial value for x. When does the scale level out?", "Which move gets x alone on one side?"],
  controls: [
    { id: "a", label: "Left side: number of x (a)", type: "stepper", min: 0, max: 9, value: 3 },
    { id: "b", label: "Left side: constant (b)", type: "stepper", min: -20, max: 20, value: 4 },
    { id: "c", label: "Right side: number of x (c)", type: "stepper", min: 0, max: 9, value: 1 },
    { id: "d", label: "Right side: constant (d)", type: "stepper", min: -20, max: 20, value: 16 },
    { id: "amount", label: "Amount for the next move", type: "stepper", min: -20, max: 20, value: 1 },
    { id: "trial", label: "Put a trial value in for x", type: "toggle", value: false },
    { id: "tn", label: "Trial value of x: numerator", type: "stepper", min: -40, max: 40, value: 2 },
    { id: "td", label: "Trial value of x: denominator", type: "stepper", min: 1, max: 10, value: 1 },
  ],
  start: (o) => seeded(o, [{ a: 3, b: 4, c: 1, d: 16 }, { a: 5, b: -3, c: 2, d: 9 }, { a: 4, b: 1, c: 0, d: 13 }, { a: 2, b: 7, c: 0, d: 15 }]),
  model(s, c) {
    const a = I(s.a, 0, 9, 3);
    const b = I(s.b, -20, 20, 4);
    const cc = I(s.c, 0, 9, 1);
    const d = I(s.d, -20, 20, 16);
    const amt = I(s.amount, -20, 20, 1);
    const key = [a, b, cc, d].join("|");
    const start = { A: fr(a), B: fr(b), C: fr(cc), D: fr(d) };
    const ops = c.x.key === key && Array.isArray(c.x.ops) ? c.x.ops : [];
    const lines = [{ label: "Start", e: start }];
    let e = start;
    for (const op of ops) {
      e = bal(e, op);
      lines.push({ label: balOp(op), e });
    }
    const act = (id, t, label, off = false) =>
      c.btn(id, label, (x) => {
        if (amt === 0 && t !== "div") return { note: "Adding or subtracting 0 changes nothing. Choose a different amount." };
        if (t === "div" && amt === 0) return { note: "Not allowed: you cannot divide by 0." };
        const cur = x.key === key && Array.isArray(x.ops) ? x.ops : [];
        if (cur.length >= 10) return { note: "The balance records at most 10 moves. Undo one or use Reset." };
        const next = bal(e, { t, k: amt });
        if (!balOk(next)) return { note: "That would make the numbers too large to show. Choose a smaller amount." };
        return { x: { ...x, key, ops: [...cur, { t, k: amt }] }, note: `${balOp({ t, k: amt })}.` };
      }, off);
    const buttons = h(
      "div",
      { class: "ml-mb ml-mb-actions" },
      act("addn", "addn", `Add ${T(fr(amt))} to both sides`),
      act("subn", "subn", `Subtract ${T(fr(amt))} from both sides`),
      act("addx", "addx", `Add ${amt === 0 ? "0" : coefX(fr(amt))} to both sides`),
      act("subx", "subx", `Subtract ${amt === 0 ? "0" : coefX(fr(amt))} from both sides`),
      act("div", "div", `Divide both sides by ${T(fr(amt))}`),
      c.btn("undo", "Undo the last move", (x) => {
        const cur = x.key === key && Array.isArray(x.ops) ? x.ops : [];
        return cur.length ? { x: { ...x, key, ops: cur.slice(0, -1) }, note: `Undid: ${balOp(cur[cur.length - 1]).toLowerCase()}.` } : { note: "There is no move to undo." };
      }, !ops.length),
    );
    // The scale: with a trial value for x every token is a number and the beam tilts by the true totals; without one it stays level (an equation is balanced).
    const t = fr(I(s.tn, -40, 40, 2), I(s.td, 1, 10, 1));
    const trial = !!s.trial;
    const side = (A, B) => {
      const toks = trial ? [A.mul(t), B] : [A, B];
      const out = [];
      if (trial) {
        if (toks[0].n !== 0) out.push(V(toks[0]));
      } else if (A.n !== 0) out.push(coefX(A));
      if (B.n !== 0) out.push(V(B));
      return out.length ? out : ["0"];
    };
    const spec = { kind: "balance", left: side(e.A, e.B), right: side(e.C, e.D) };
    const sol = balSolve(e);
    const out = [`The equation is ${balText(e)}.`, vsum(spec)];
    if (trial) {
      const L = e.A.mul(t).add(e.B);
      const R = e.C.mul(t).add(e.D);
      out.push(`With x = ${T(t)}: the left side is ${both(L)} and the right side is ${both(R)}. ${same(L, R) ? `The scale is level, so x = ${T(t)} is a solution.` : `The scale is not level, so x = ${T(t)} is not a solution.`}`);
    }
    const isoL = same(e.A, fr(1)) && e.B.n === 0 && e.C.n === 0;
    const isoR = e.A.n === 0 && same(e.C, fr(1)) && e.D.n === 0;
    if (isoL || isoR) {
      const v = isoL ? e.D : e.B;
      out.push(`x is alone, so the solution is x = ${both(v)}.`);
    } else if (sol === "all") out.push("Both sides are always equal, so every value of x is a solution.");
    else if (sol === "none") out.push("The two sides can never be equal, so there is no solution.");
    return { spec, summary: out.join(" "), extra: h("div", { class: "ml-mb" }, buttons, steps(lines.map((l) => `${l.label}: ${balText(l.e)}`))) };
  },
});

/* ================================================================ 6. equationbuilder */

const EQF = {
  add: "x + b = c (one step: add)",
  mul: "a x = c (one step: multiply)",
  div: "x ÷ a = c (one step: divide)",
  two: "a x + b = c (two steps)",
  twodiv: "x ÷ a + b = c (two steps)",
};
const eqOp = (op) => ({ add: `Add ${T(fr(op.k))}`, sub: `Subtract ${T(fr(op.k))}`, mul: `Multiply by ${T(fr(op.k))}`, div: `Divide by ${T(fr(op.k))}` })[op.t];
const eqApply = (e, op) => {
  const k = fr(op.k);
  if (op.t === "add") return { P: e.P, Q: e.Q.add(k), R: e.R.add(k) };
  if (op.t === "sub") return { P: e.P, Q: e.Q.sub(k), R: e.R.sub(k) };
  if (op.t === "mul") return { P: e.P.mul(k), Q: e.Q.mul(k), R: e.R.mul(k) };
  return { P: e.P.div(k), Q: e.Q.div(k), R: e.R.div(k) };
};
const eqText = (e) => `${linText(e.P, e.Q)} = ${T(e.R)}`;

const equationbuilder = manip({
  id: "equationbuilder",
  title: "Equation builders",
  band: "6-8",
  purpose: "Builds one-step and two-step equations and solves them one legal move at a time, keeping a log so every step can be explained.",
  notice: ["Why must you do the same thing to both sides?", "Which operation undoes the one that was done to x?", "How can you check the solution by substituting it?"],
  controls: [
    { id: "form", label: "Kind of equation", type: "choice", options: Object.entries(EQF), value: "two" },
    { id: "a", label: "Coefficient (a)", type: "stepper", min: -9, max: 9, value: 3 },
    { id: "b", label: "Constant (b)", type: "stepper", min: -20, max: 20, value: 4 },
    { id: "c", label: "Right side (c)", type: "stepper", min: -40, max: 40, value: 19 },
    { id: "side", label: "Apply the move to", type: "choice", options: [["both", "Both sides"], ["left", "The left side only"]], value: "both" },
    { id: "amount", label: "Amount for the next move", type: "stepper", min: -20, max: 20, value: 4 },
  ],
  start: (o) => seeded(o, [{ form: "two", a: 3, b: 4, c: 19 }, { form: "mul", a: 6, c: 42 }, { form: "add", b: 7, c: 12 }, { form: "div", a: 4, c: 5 }, { form: "twodiv", a: 2, b: -3, c: 5 }]),
  model(s, c) {
    const form = oneOf(s.form, Object.keys(EQF), "two");
    let a = I(s.a, -9, 9, 3);
    if (a === 0) a = 1;
    const b = I(s.b, -20, 20, 4);
    const cc = I(s.c, -40, 40, 19);
    const amt = I(s.amount, -20, 20, 4);
    const both2 = s.side !== "left";
    const start = { add: { P: fr(1), Q: fr(b), R: fr(cc) }, mul: { P: fr(a), Q: F0, R: fr(cc) }, div: { P: fr(1, a), Q: F0, R: fr(cc) }, two: { P: fr(a), Q: fr(b), R: fr(cc) }, twodiv: { P: fr(1, a), Q: fr(b), R: fr(cc) } }[form];
    const key = [form, a, b, cc].join("|");
    const ops = c.x.key === key && Array.isArray(c.x.ops) ? c.x.ops : [];
    const rows = [["Start", eqText(start)]];
    let e = start;
    for (const op of ops) {
      e = eqApply(e, op);
      rows.push([eqOp(op), eqText(e)]);
    }
    const spec = { kind: "table", caption: "Steps so far", headers: ["Move", "Equation"], rows: rows.map((r, i) => [i === 0 ? r[0] : `${i}. ${r[0]}`, r[1]]) };
    const act = (id, t, label) =>
      c.btn(id, label, (x) => {
        if (!both2) return { note: "Not allowed: if you change only the left side, the two sides are no longer equal. Do the same thing to both sides." };
        if ((t === "mul" || t === "div") && amt === 0) return { note: t === "div" ? "Not allowed: you cannot divide by 0." : "Not allowed: multiplying both sides by 0 would turn the equation into 0 = 0 and lose x." };
        if ((t === "add" || t === "sub") && amt === 0) return { note: "Adding or subtracting 0 changes nothing. Choose a different amount." };
        const cur = x.key === key && Array.isArray(x.ops) ? x.ops : [];
        if (cur.length >= 10) return { note: "The log holds at most 10 moves. Undo one or use Reset." };
        const op = { t, k: amt };
        const nx = eqApply(e, op);
        if (tooBig(nx.P) || tooBig(nx.Q) || tooBig(nx.R)) return { note: "That would make the numbers too large to show. Choose a smaller amount." };
        return { x: { ...x, key, ops: [...cur, op] }, note: `${eqOp(op)} on both sides.` };
      });
    const buttons = h(
      "div",
      { class: "ml-mb ml-mb-actions" },
      act("add", "add", `Add ${T(fr(amt))}`),
      act("sub", "sub", `Subtract ${T(fr(amt))}`),
      act("mul", "mul", `Multiply by ${T(fr(amt))}`),
      act("div", "div", `Divide by ${T(fr(amt))}`),
      c.btn("undo", "Undo the last move", (x) => {
        const cur = x.key === key && Array.isArray(x.ops) ? x.ops : [];
        return cur.length ? { x: { ...x, key, ops: cur.slice(0, -1) }, note: `Undid: ${eqOp(cur[cur.length - 1]).toLowerCase()}.` } : { note: "There is no move to undo." };
      }, !ops.length),
    );
    const out = [`The equation is ${eqText(start)}.`];
    if (ops.length) out.push(`Steps so far: ${rows.slice(1).map((r, i) => `${i + 1}. ${r[0]} on both sides, giving ${r[1]}`).join("; ")}.`);
    else out.push("No moves yet. Each move is done to both sides.");
    out.push(`The equation now is ${eqText(e)}.`);
    if (same(e.P, fr(1)) && e.Q.n === 0) {
      const sub = start.P.mul(e.R).add(start.Q);
      out.push(`x is alone: x = ${both(e.R)}. Check in the original equation: ${linText(start.P, start.Q).replace(/x/g, `(${T(e.R)})`)} = ${T(sub)}, and the right side is ${T(start.R)}. ${same(sub, start.R) ? "They match." : "They do not match."}`);
    }
    return { spec, summary: out.join(" "), extra: h("div", { class: "ml-mb" }, buttons) };
  },
});

/* ================================================================ 7. graphing */

/** Everything about the line y = m x + b (m, b exact). */
function lineFacts(m, b) {
  const xi = m.n !== 0 ? neg(b).div(m) : null;
  return { m, b, xInt: xi, flatAll: m.n === 0 && b.n === 0 };
}
const inWin = (f) => Math.abs(f.n) <= 10 * f.d;
const yEq = (m, b) => `y = ${linText(m, b)}`;
function lineRead(L, k) {
  const { m, b, xInt } = L;
  const out = [`Line ${k}: ${yEq(m, b)}.`];
  if (m.n === 0) out.push(`The slope is 0: the line is flat, so y is always ${T(b)}.`);
  else out.push(`The slope is ${T(m)}: for every 1 unit across, y changes by ${T(m)}${m.d === 1 ? "" : ` (${dec(m).text}${dec(m).exact ? "" : ", rounded"} as a decimal)`}, so going right, the line ${m.n > 0 ? "rises" : "falls"}. The rate of change is ${T(m)} ${abs(m).cmp(fr(1)) === 0 ? "unit" : "units"} of y per 1 unit of x.`);
  out.push(`The y-intercept is (0, ${T(b)}).`);
  if (xInt) out.push(`The x-intercept is (${T(xInt)}, 0)${inWin(xInt) ? "" : ", which is off this grid"}.`);
  else out.push(b.n === 0 ? "The line lies along the x-axis." : "The line never crosses the x-axis.");
  return out.join(" ");
}
const graphing = manip({
  id: "graphing",
  title: "Coordinate graphing",
  band: "6-8",
  purpose: "Graphs y = mx + b on four quadrants, so learners connect the slope and intercept to the picture and see where two lines meet.",
  notice: ["What does the slope tell you about how the line moves?", "Where does the line cross each axis, and what does that mean in the equation?", "With two lines: when do they cross, and when never?"],
  controls: [
    { id: "mn", label: "Slope m: numerator (rise)", type: "stepper", min: -10, max: 10, value: 1 },
    { id: "md", label: "Slope m: denominator (run)", type: "stepper", min: 1, max: 10, value: 2 },
    { id: "bn", label: "y-intercept b: numerator", type: "stepper", min: -10, max: 10, value: 1 },
    { id: "bd", label: "y-intercept b: denominator", type: "stepper", min: 1, max: 10, value: 1 },
    { id: "two", label: "Show a second line (a system)", type: "toggle", value: false },
    { id: "m2n", label: "Second line slope: numerator", type: "stepper", min: -10, max: 10, value: -1 },
    { id: "m2d", label: "Second line slope: denominator", type: "stepper", min: 1, max: 10, value: 1 },
    { id: "b2n", label: "Second line y-intercept: numerator", type: "stepper", min: -10, max: 10, value: 4 },
    { id: "b2d", label: "Second line y-intercept: denominator", type: "stepper", min: 1, max: 10, value: 1 },
  ],
  start: (o) => seeded(o, [{ mn: 1, md: 2, bn: 1, bd: 1 }, { mn: 2, md: 1, bn: -3, bd: 1 }, { mn: -3, md: 2, bn: 2, bd: 1 }, { mn: 0, md: 1, bn: 3, bd: 1 }]),
  model(s) {
    const L1 = lineFacts(fr(I(s.mn, -10, 10, 1), I(s.md, 1, 10, 2)), fr(I(s.bn, -10, 10, 1), I(s.bd, 1, 10, 1)));
    const two = !!s.two;
    const L2 = two ? lineFacts(fr(I(s.m2n, -10, 10, -1), I(s.m2d, 1, 10, 1)), fr(I(s.b2n, -10, 10, 4), I(s.b2d, 1, 10, 1))) : null;
    const pt = (x, y, label) => ({ x: V(x), y: V(y), label });
    const points = [];
    points.push(pt(F0, L1.b, ""));
    if (L1.xInt && inWin(L1.xInt) && L1.xInt.n !== 0) points.push(pt(L1.xInt, F0, ""));
    const lines = [{ m: V(L1.m), b: V(L1.b), label: "L1" }];
    const out = [];
    let cross = null;
    if (L2) {
      lines.push({ m: V(L2.m), b: V(L2.b), label: "L2" });
      if (same(L1.m, L2.m)) cross = same(L1.b, L2.b) ? "same" : "parallel";
      else {
        const x = L2.b.sub(L1.b).div(L1.m.sub(L2.m));
        cross = { x, y: L1.m.mul(x).add(L1.b) };
        if (inWin(cross.x) && inWin(cross.y)) points.push(pt(cross.x, cross.y, "P"));
      }
    }
    const spec = { kind: "coord", xmin: -10, xmax: 10, ymin: -10, ymax: 10, step: 1, labelAxes: ["x", "y"], lines, points };
    out.push(vsum(spec));
    out.push(lineRead(L1, 1));
    if (L2) {
      out.push(lineRead(L2, 2));
      if (cross === "same") out.push("The two lines are the same line, so every point on it is a solution of the system (infinitely many solutions).");
      else if (cross === "parallel") out.push("The two lines have the same slope but different y-intercepts, so they are parallel and never meet: the system has no solution.");
      else out.push(`The lines meet at exactly one point, (${T(cross.x)}, ${T(cross.y)})${inWin(cross.x) && inWin(cross.y) ? ", marked P" : ", which is off this grid"}. That is the solution of the system: x = ${both(cross.x)} and y = ${both(cross.y)}.`);
    }
    return { spec, summary: out.join(" ") };
  },
});

/* ================================================================ 8. machine */

const MRULES = {
  add: { name: "Add a number: x + p", f: (x, p) => x.add(fr(p)), text: (p) => (p < 0 ? `x ${MINUS} ${-p}` : `x + ${p}`) },
  multiply: { name: "Multiply by a number: p × x", f: (x, p) => x.mul(fr(p)), text: (p) => (p === 1 ? "x" : p === -1 ? `${MINUS}x` : p < 0 ? `(${MINUS}${-p}) * x` : `${p} * x`) },
  divide: { name: "Divide by a number: x ÷ p", f: (x, p) => x.div(fr(p === 0 ? 1 : p)), text: (p) => (p === 0 || p === 1 ? "x" : p < 0 ? `x / (${MINUS}${-p})` : `x / ${p}`) },
  linear: { name: "Multiply, then add: p × x + q", f: (x, p, q) => x.mul(fr(p)).add(fr(q)), text: (p, q) => `${p === 1 ? "x" : p === -1 ? `${MINUS}x` : p < 0 ? `(${MINUS}${-p}) * x` : `${p} * x`}${q === 0 ? "" : q < 0 ? ` ${MINUS} ${-q}` : ` + ${q}`}` },
  square: { name: "Square, then add: x² + q", f: (x, _p, q) => x.mul(x).add(fr(q)), text: (_p, q) => `x²${q === 0 ? "" : q < 0 ? ` ${MINUS} ${-q}` : ` + ${q}`}` },
};
const rulePretty = (t) => t.replace(/ \* /g, " × ").replace(/ \/ /g, " ÷ ");
/** The hidden rule of puzzle number `seed`: the same every time, so a teacher can give a puzzle number. */
function secretOf(seed) {
  const r = makeRng(`machine:${seed}`);
  const nz = (lo, hi) => {
    let v = 0;
    while (v === 0) v = r.int(lo, hi);
    return v;
  };
  const rule = r.pick(["add", "multiply", "divide", "linear", "square"]);
  if (rule === "add") return { rule, p: nz(-9, 9), q: 0 };
  if (rule === "multiply") return { rule, p: r.pick([2, 3, 4, 5, -2, -3]), q: 0 };
  if (rule === "divide") return { rule, p: r.pick([2, 3, 4, 5]), q: 0 };
  if (rule === "linear") return { rule, p: r.pick([2, 3, 4, -2]), q: nz(-9, 9) };
  return { rule, p: 0, q: r.int(-5, 5) };
}
const mRun = (g, x) => MRULES[g.rule].f(fr(x), g.p, g.q);
const mText = (g) => MRULES[g.rule].text(g.p, g.q);
/** Do two rules agree on every whole-number input from -10 to 10? Returns null, or the first input where they differ. */
const mDiff = (g1, g2) => {
  for (let x = -10; x <= 10; x++) if (!same(mRun(g1, x), mRun(g2, x))) return x;
  return null;
};

const machine = manip({
  id: "machine",
  title: "Function machines",
  band: "6-8",
  purpose: "Feeds inputs through a rule and records the outputs, so learners see a function as one rule that gives exactly one output per input, and can work out a hidden rule from its table.",
  notice: ["What do you do to every input to get its output?", "Can you predict the output for an input you have not tried?", "How many different inputs did you need to be sure about the rule?"],
  controls: [
    { id: "mode", label: "Mode", type: "choice", options: [["show", "Show the rule"], ["guess", "Guess the rule"]], value: "show" },
    { id: "rule", label: "Rule type (your guess in Guess mode)", type: "choice", options: Object.entries(MRULES).map(([k, v]) => [k, v.name]), value: "add" },
    { id: "p", label: "Number p (your guess in Guess mode)", type: "stepper", min: -10, max: 10, value: 3 },
    { id: "q", label: "Number q (your guess in Guess mode)", type: "stepper", min: -10, max: 10, value: 2 },
    { id: "input", label: "Input", type: "stepper", min: -10, max: 10, value: 3 },
    { id: "seed", label: "Puzzle number for Guess mode", type: "stepper", min: 1, max: 99, value: 1 },
  ],
  start: (o) => ({ seed: Math.min(99, Math.max(1, Math.round(Number(o?.seed)) || 1)) }),
  model(s, c) {
    const mode = s.mode === "guess" ? "guess" : "show";
    const rule = oneOf(s.rule, Object.keys(MRULES), "add");
    const mine = { rule, p: I(s.p, -10, 10, 3), q: I(s.q, -10, 10, 2) };
    if (mine.rule === "divide" && mine.p === 0) mine.p = 1;
    const seed = I(s.seed, 1, 99, 1);
    const input = I(s.input, -10, 10, 3);
    const real = mode === "guess" ? secretOf(seed) : mine;
    const key = mode === "guess" ? `guess|${seed}` : `show|${mine.rule}|${mine.p}|${mine.q}`;
    const fed = c.x.fedKey === key && Array.isArray(c.x.fed) ? c.x.fed : [];
    const committed = c.x.commitKey === key ? c.x.commit : null;
    const revealed = mode === "show" || !!committed;
    const out = mRun(real, input);
    const spec = { kind: "machine", rule: revealed ? rulePretty(mText(real)).replace(/ × /g, " * ").replace(/ ÷ /g, " / ") : "?", input: V(fr(input)), output: V(out) };
    const guessCols = mode === "guess";
    const trows = fed.map((i) => {
      const o = mRun(real, i);
      const g = mRun(mine, i);
      return guessCols ? [T(fr(i)), T(o), T(g), same(o, g) ? "✓ same" : "✗ different"] : [T(fr(i)), T(o)];
    });
    const buttons = h(
      "div",
      { class: "ml-mb ml-mb-actions" },
      c.btn("feed", `Feed ${T(fr(input))} into the machine`, (x) => {
        const cur = x.fedKey === key && Array.isArray(x.fed) ? x.fed : [];
        if (cur.includes(input)) return { note: `${T(fr(input))} is already in the table. Try a different input.` };
        if (cur.length >= 12) return { note: "The table is full (12 inputs). Clear it to start again." };
        return { x: { ...x, fedKey: key, fed: [...cur, input] }, note: `Fed ${T(fr(input))}; the machine gave ${T(out)}.` };
      }),
      c.btn("clear", "Clear the table", (x) => ({ x: { ...x, fedKey: key, fed: [] }, note: "Cleared the table." }), !fed.length),
      mode === "guess"
        ? c.btn("commit", committed ? "The rule is shown" : "Commit my guess and show the rule", (x) => {
            if (committed) return { note: "The rule is already shown. Choose another puzzle number to try a new one." };
            const d = mDiff(mine, real);
            return { x: { ...x, commitKey: key, commit: { ok: d === null, at: d } }, note: d === null ? "Your rule matches the machine for every input from −10 to 10." : "Your rule does not match the machine." };
          }, !!committed)
        : null,
    );
    const parts = [];
    if (mode === "show") parts.push(`The machine rule is ${rulePretty(mText(real))}.`);
    else parts.push(`Guess the rule, puzzle ${seed}. ${revealed ? `The machine's rule was ${rulePretty(mText(real))}.` : "The machine's rule is hidden."}`);
    parts.push(`The input is ${T(fr(input))} and the output is ${T(out)}.`);
    if (fed.length) parts.push(`Inputs tried so far: ${fed.map((i) => `${T(fr(i))} gives ${T(mRun(real, i))}`).join(", ")}.`);
    else parts.push("The table is empty. Feed some inputs to see the pattern.");
    if (guessCols) {
      parts.push(`Your guess is ${rulePretty(mText(mine))}.${fed.length ? ` On the inputs you tried it matches ${fed.filter((i) => same(mRun(real, i), mRun(mine, i))).length} of ${fed.length}.` : ""}`);
      if (committed) parts.push(committed.ok ? "Your guess is equivalent to the machine's rule." : `Your guess is not the same rule: for input ${T(fr(committed.at))} the machine gives ${T(mRun(real, committed.at))} but your rule gives ${T(mRun(mine, committed.at))}.`);
    }
    const table = fed.length ? tbl("Inputs and outputs", guessCols ? ["Input", "Machine output", "My rule's output", "Same?"] : ["Input", "Output"], trows) : null;
    return { spec, summary: parts.join(" "), extra: h("div", { class: "ml-mb" }, buttons, table) };
  },
});

/* ================================================================ 9. transformtool */

const TRIS = {
  t1: { name: "Right triangle in the first quadrant", pts: [[1, 1], [4, 1], [1, 3]] },
  t2: { name: "Scalene triangle", pts: [[2, 2], [5, 3], [3, 5]] },
  t3: { name: "Isosceles triangle", pts: [[-3, 1], [-1, 1], [-2, 4]] },
  t4: { name: "Right triangle below the x-axis", pts: [[1, -2], [4, -2], [4, -4]] },
};
const tfApply = (pts, op) => {
  const k = op.t === "dilate" ? fr(op.n, op.d) : null;
  return pts.map(([x, y]) => {
    switch (op.t) {
      case "translate": return [x.add(fr(op.dx)), y.add(fr(op.dy))];
      case "rx": return [x, neg(y)];
      case "ry": return [neg(x), y];
      case "ccw": return [neg(y), x];
      case "cw": return [y, neg(x)];
      default: return [x.mul(k), y.mul(k)];
    }
  });
};
const tfName = (op) => ({ translate: `Translate by (${T(fr(op.dx))}, ${T(fr(op.dy))})`, rx: "Reflect over the x-axis", ry: "Reflect over the y-axis", ccw: "Rotate 90° counterclockwise about the origin", cw: "Rotate 90° clockwise about the origin", dilate: `Dilate by a scale factor of ${T(fr(op.n, op.d))} about the origin` })[op.t];
const signedArea2 = (p) => p[1][0].sub(p[0][0]).mul(p[2][1].sub(p[0][1])).sub(p[2][0].sub(p[0][0]).mul(p[1][1].sub(p[0][1])));
const coordText = (p) => `(${T(p[0])}, ${T(p[1])})`;

const transformtool = manip({
  id: "transformtool",
  title: "Transformation tools",
  band: "6-8",
  purpose: "Moves a triangle by translation, reflection, rotation and dilation, and shows the exact coordinates of the preimage and the image so learners see what each move changes and what it keeps.",
  notice: ["Which coordinates change, and how, for each kind of move?", "Which moves keep the side lengths the same? Which do not?", "What happens to the orientation (the order A, B, C goes around) after a reflection?"],
  controls: [
    { id: "tri", label: "Triangle", type: "choice", options: Object.entries(TRIS).map(([k, v]) => [k, v.name]), value: "t1" },
    { id: "dx", label: "Translate: move right by", type: "stepper", min: -10, max: 10, value: 3 },
    { id: "dy", label: "Translate: move up by", type: "stepper", min: -10, max: 10, value: -2 },
    { id: "sn", label: "Dilate: scale factor numerator", type: "stepper", min: 1, max: 9, value: 2 },
    { id: "sd", label: "Dilate: scale factor denominator", type: "stepper", min: 1, max: 9, value: 1 },
  ],
  start: (o) => seeded(o, [{ tri: "t1" }, { tri: "t2" }, { tri: "t3" }, { tri: "t4" }]),
  model(s, c) {
    const tri = oneOf(s.tri, Object.keys(TRIS), "t1");
    const dx = I(s.dx, -10, 10, 3);
    const dy = I(s.dy, -10, 10, -2);
    const sn = I(s.sn, 1, 9, 2);
    const sd = I(s.sd, 1, 9, 1);
    const pre = TRIS[tri].pts.map(([x, y]) => [fr(x), fr(y)]);
    const ops = c.x.tri === tri && Array.isArray(c.x.ops) ? c.x.ops : [];
    let img = pre;
    for (const op of ops) img = tfApply(img, op);
    const extent = Math.max(...[...pre, ...img].flat().map((v) => Math.abs(v.n / v.d)));
    const W = [5, 10, 20, 40, 80, 160].find((w) => w >= extent) || 160;
    const STEP = { 5: 1, 10: 2, 20: 5, 40: 10, 80: 20, 160: 40 }[W];
    const names = ["A", "B", "C"];
    const poly = (p, mark, label) => ({ label, pts: p.map((q, i) => ({ x: V(q[0]), y: V(q[1]), label: `${names[i]}${mark}` })) });
    const spec = { kind: "coord", xmin: -W, xmax: W, ymin: -W, ymax: W, step: STEP, labelAxes: ["x", "y"], polys: ops.length ? [poly(pre, "", "preimage"), poly(img, "′", "image")] : [poly(pre, "", "preimage")] };
    const add = (id, op, off = false) =>
      c.btn(id, tfName(op).replace("Rotate 90° counterclockwise about the origin", "Rotate 90° counterclockwise").replace("Rotate 90° clockwise about the origin", "Rotate 90° clockwise").replace(" about the origin", ""), (x) => {
        const cur = x.tri === tri && Array.isArray(x.ops) ? x.ops : [];
        if (cur.length >= 12) return { note: "The tool records at most 12 moves. Undo one or use Reset." };
        if (op.t === "dilate" && op.n === op.d) return { note: "A scale factor of 1 changes nothing. Choose a different scale factor." };
        if (op.t === "translate" && op.dx === 0 && op.dy === 0) return { note: "Translating by (0, 0) changes nothing. Choose a different move." };
        const nxt = tfApply(img, op);
        if (nxt.flat().some((v) => Math.abs(v.n / v.d) > 100 || tooBig(v))) return { note: "That move would take the triangle off the grid (more than 100 units from the origin)." };
        return { x: { ...x, tri, ops: [...cur, op] }, note: `${tfName(op)}.` };
      }, off);
    const buttons = h(
      "div",
      { class: "ml-mb ml-mb-actions" },
      add("translate", { t: "translate", dx, dy }),
      add("rx", { t: "rx" }),
      add("ry", { t: "ry" }),
      add("ccw", { t: "ccw" }),
      add("cw", { t: "cw" }),
      add("dilate", { t: "dilate", n: sn, d: sd }),
      c.btn("undo", "Undo the last move", (x) => {
        const cur = x.tri === tri && Array.isArray(x.ops) ? x.ops : [];
        return cur.length ? { x: { ...x, tri, ops: cur.slice(0, -1) }, note: `Undid: ${tfName(cur[cur.length - 1]).toLowerCase()}.` } : { note: "There is no move to undo." };
      }, !ops.length),
    );
    const out = [vsum(spec), `Preimage: ${pre.map((p, i) => `${names[i]}${coordText(p)}`).join(", ")}.`];
    if (ops.length) {
      out.push(`Image after ${ops.length} ${plural(ops.length, "move")}: ${img.map((p, i) => `${names[i]}′${coordText(p)}`).join(", ")}.`);
      let K = fr(1);
      for (const op of ops) if (op.t === "dilate") K = K.mul(fr(op.n, op.d));
      const flipped = Math.sign(signedArea2(pre).n) !== Math.sign(signedArea2(img).n);
      out.push(same(K, fr(1)) ? "Every side length is the same as before, so the image is congruent to the preimage." : `Every side length is ${both(K)} times the preimage side length, and the area is ${both(K.mul(K))} times as large, so the image is similar but not congruent.`);
      out.push(flipped ? "The order A, B, C goes around the opposite way, so the image is a mirror image." : "The order A, B, C goes around the same way as before.");
    } else out.push("No moves yet. Choose a move to see the image.");
    return { spec, summary: out.join(" "), extra: h("div", { class: "ml-mb" }, buttons, steps(ops.map((op) => tfName(op)))) };
  },
});

/* ================================================================ 10. probsim */

const SPIN_NAMES = ["Red", "Blue", "Green", "Yellow", "Orange", "Brown"];
const DEVICES = { spinner: "Spinner", cube: "Number cube", coin: "Coin" };
const outcomesOf = (device, n) => (device === "cube" ? ["1", "2", "3", "4", "5", "6"] : device === "coin" ? ["Heads", "Tails"] : SPIN_NAMES.slice(0, n));
/** Outcome of trial number k: a pure function of (seed, k), so 1 + 10 trials is exactly the same as 11 trials. */
function outcomeAt(seed, k, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let t = Math.floor(makeRng(`probsim:${seed}:${k}`).next() * total);
  for (let i = 0; i < weights.length; i++) {
    t -= weights[i];
    if (t < 0) return i;
  }
  return weights.length - 1;
}
const MAX_TRIALS = 1000;

const probsim = manip({
  id: "probsim",
  title: "Probability simulations",
  band: "6-8",
  purpose: "Runs a spinner, number cube or coin with seeded trials, so learners compare the experimental probability with the theoretical one as the number of trials grows.",
  notice: ["How close is the experimental probability to the theoretical one after 10 trials? After 100?", "What changes when one section gets a bigger weight?", "If you use the same seed again, what happens, and why?"],
  controls: [
    { id: "device", label: "Device", type: "choice", options: Object.entries(DEVICES), value: "spinner" },
    { id: "n", label: "Spinner sections", type: "stepper", min: 2, max: 6, value: 4 },
    { id: "w1", label: "Weight of outcome 1", type: "stepper", min: 1, max: 6, value: 2 },
    { id: "w2", label: "Weight of outcome 2 (the other outcomes weigh 1)", type: "stepper", min: 1, max: 6, value: 1 },
    { id: "target", label: "Outcome to follow (1 = first section, face 1 or heads)", type: "stepper", min: 1, max: 6, value: 1 },
    { id: "seed", label: "Seed for the random numbers", type: "stepper", min: 1, max: 99, value: 1 },
  ],
  start: (o) => ({ seed: Math.min(99, Math.max(1, Math.round(Number(o?.seed)) || 1)) }),
  model(s, c) {
    const device = oneOf(s.device, Object.keys(DEVICES), "spinner");
    const n = I(s.n, 2, 6, 4);
    const names = outcomesOf(device, n);
    const w1 = I(s.w1, 1, 6, 1);
    const w2 = I(s.w2, 1, 6, 1);
    const weights = names.map((_, i) => (i === 0 ? w1 : i === 1 ? w2 : 1));
    const W = weights.reduce((a, b) => a + b, 0);
    const tgt = Math.min(I(s.target, 1, 6, 1), names.length) - 1;
    const seed = I(s.seed, 1, 99, 1);
    const key = [device, names.length, w1, w2, seed].join("|");
    const N = c.x.tkey === key ? I(c.x.n, 0, MAX_TRIALS, 0) : 0;
    const counts = names.map(() => 0);
    for (let k = 0; k < N; k++) counts[outcomeAt(seed, k, weights)]++;
    const maxC = Math.max(...counts);
    const bar = { kind: "bar", title: N ? `Results of ${N} ${plural(N, "trial")}` : "Results (no trials yet)", cats: names, values: counts, scale: maxC <= 10 ? 1 : maxC <= 20 ? 2 : maxC <= 50 ? 5 : maxC <= 100 ? 10 : maxC <= 250 ? 25 : 50, orient: "v", showValues: true, axisLabel: "Times it came up" };
    const device0 = device === "spinner" ? { kind: "spinner", sections: names.map((label, i) => ({ label, weight: weights[i] })) } : null;
    const theory = fr(weights[tgt], W);
    const exp = N ? fr(counts[tgt], N) : null;
    const run1 = (id, k) =>
      c.btn(id, `Run ${k} ${plural(k, "trial")}`, (x) => {
        const cur = x.tkey === key ? I(x.n, 0, MAX_TRIALS, 0) : 0;
        if (cur >= MAX_TRIALS) return { note: `The limit is ${MAX_TRIALS} trials. Clear the trials to start again.` };
        const add = Math.min(k, MAX_TRIALS - cur);
        return { x: { ...x, tkey: key, n: cur + add }, note: `Ran ${add} more ${plural(add, "trial")}; there are now ${cur + add}.${add < k ? ` That is the ${MAX_TRIALS}-trial limit.` : ""}` };
      }, N >= MAX_TRIALS);
    const buttons = h("div", { class: "ml-mb ml-mb-actions" }, run1("run1", 1), run1("run10", 10), run1("run100", 100), c.btn("clear", "Clear the trials", (x) => ({ x: { ...x, tkey: key, n: 0 }, note: "Cleared the trials." }), !N));
    const rows = names.map((nm, i) => [nm, String(weights[i]), `${T(fr(weights[i], W))} = ${dec(fr(weights[i], W)).text}`, N ? String(counts[i]) : "0", N ? `${T(fr(counts[i], N))} = ${dec(fr(counts[i], N)).text}` : "no trials yet"]);
    const out = [`${DEVICES[device]}${device === "spinner" ? ` with ${names.length} sections` : ""}. The weights are ${names.map((nm, i) => `${nm} ${weights[i]}`).join(", ")}, so there are ${W} equal chances in all. The seed is ${seed}, so the same trials come out every time.`];
    out.push(`Following ${names[tgt]}: the theoretical probability is ${weights[tgt]} out of ${W}, which is ${T(theory)} as a fraction and ${dec(theory).text}${dec(theory).exact ? "" : " (rounded)"} as a decimal.`);
    if (N) {
      out.push(`After ${N} ${plural(N, "trial")}: ${names.map((nm, i) => `${nm} ${counts[i]}`).join(", ")}.`);
      out.push(`The experimental probability of ${names[tgt]} is ${counts[tgt]} out of ${N}, which is ${T(exp)} as a fraction and ${dec(exp).text}${dec(exp).exact ? "" : " (rounded)"} as a decimal. It differs from the theoretical probability by ${dec(abs(exp.sub(theory)), 3).text}${dec(abs(exp.sub(theory)), 3).exact ? "" : " (rounded)"}.`);
    } else out.push("No trials yet. Run some trials to find the experimental probability.");
    return {
      spec: bar,
      summary: out.join(" "),
      extra: h("div", { class: "ml-mb" }, device0 ? svgBox(device0) : null, buttons, tbl("Theoretical and experimental probability", ["Outcome", "Weight", "Theoretical (fraction = decimal)", "Times it came up", "Experimental (fraction = decimal)"], rows)),
    };
  },
});

/* ================================================================ 11. statviz */

const DATA0 = [2, 4, 4, 5, 6, 7, 7, 8, 9];
/** Exact summary statistics. Quartiles are the medians of the lower and upper halves, leaving the middle value out when n is odd. */
function stats(vals) {
  const a = vals.map((v) => fr(v)).sort((p, q) => p.cmp(q));
  const n = a.length;
  const med = (arr) => {
    const m = arr.length;
    return m % 2 ? arr[(m - 1) / 2] : arr[m / 2 - 1].add(arr[m / 2]).div(fr(2));
  };
  const sum = a.reduce((p, q) => p.add(q), F0);
  const mean = sum.div(fr(n));
  const lower = a.slice(0, Math.floor(n / 2));
  const upper = a.slice(Math.ceil(n / 2));
  const median = med(a);
  const q1 = lower.length ? med(lower) : median;
  const q3 = upper.length ? med(upper) : median;
  const freq = new Map();
  for (const v of vals) freq.set(v, (freq.get(v) || 0) + 1);
  const top = Math.max(...freq.values());
  const modes = top > 1 ? [...freq].filter(([, f]) => f === top).map(([v]) => v).sort((p, q) => p - q) : [];
  const mad = a.reduce((p, q) => p.add(abs(q.sub(mean))), F0).div(fr(n));
  const iqr = q3.sub(q1);
  const lo = q1.sub(iqr.mul(fr(3, 2)));
  const hi = q3.add(iqr.mul(fr(3, 2)));
  return { n, min: a[0], max: a[n - 1], range: a[n - 1].sub(a[0]), mean, median, q1, q3, iqr, mad, modes, outliers: a.filter((v) => v.cmp(lo) < 0 || v.cmp(hi) > 0).map((v) => v.n), lo, hi };
}
const modeText = (m) => (m.length ? list(m.map(String)) : "none (no value is repeated)");
const parseData = (text) => {
  const parts = String(text).split(/[\s,;]+/).filter(Boolean);
  if (!parts.length) return { error: "Type at least one whole number, separated by commas." };
  if (parts.length > 15) return { error: `Type at most 15 values. You typed ${parts.length}.` };
  const vals = [];
  for (const p of parts) {
    const t = p.replace(/−/g, "-");
    if (!/^-?\d{1,3}$/.test(t) || Math.abs(Number(t)) > 100) return { error: `“${p}” is not a whole number from ${MINUS}100 to 100.` };
    vals.push(Number(t));
  }
  return { vals };
};

const statviz = manip({
  id: "statviz",
  title: "Statistical visualization",
  band: "6-8",
  purpose: "Shows a data set as a dot plot or box plot with its center and spread computed exactly, and shows how one extra value, such as an outlier, changes each measure.",
  notice: ["Which measures change a lot when you add the extra value, and which barely move?", "How do the mean and the median compare, and why?", "What do the range, the IQR and the MAD each tell you about the spread?"],
  controls: [
    { id: "plot", label: "Display", type: "choice", options: [["dot", "Dot plot"], ["box", "Box plot"]], value: "dot" },
    { id: "withExtra", label: "Add one extra value to the data", type: "toggle", value: false },
    { id: "extra", label: "The extra value", type: "stepper", min: -100, max: 100, value: 40 },
  ],
  start: (o) => seeded(o, [{ extra: 40 }, { extra: 30 }, { extra: 50 }]),
  model(s, c) {
    const base = Array.isArray(c.x.data) && c.x.data.length ? c.x.data : DATA0;
    const plot = s.plot === "box" ? "box" : "dot";
    const ex = I(s.extra, -100, 100, 40);
    const wantExtra = !!s.withExtra;
    const useExtra = wantExtra && base.length < 15;
    const data = useExtra ? [...base, ex] : base;
    const st = stats(data);
    const sb = useExtra ? stats(base) : null;
    const rng = Number(st.range.n / st.range.d);
    const label = `${data.length} data values`;
    let spec;
    let fallback = false;
    if (plot === "dot" && rng >= 1 && rng <= 60) spec = { kind: "lineplot", min: V(st.min), max: V(st.max), step: 1, values: data, label };
    else if (plot === "dot" && rng === 0) spec = { kind: "lineplot", min: V(st.min.sub(fr(1))), max: V(st.max.add(fr(1))), step: 1, values: data, label };
    else {
      fallback = plot === "dot";
      spec = { kind: "boxplot", min: V(st.min), q1: V(st.q1), median: V(st.median), q3: V(st.q3), max: V(st.max), label };
    }
    const m = (name, f) => `${name} ${both(f)}`;
    const sentence = (t) => [m("mean", t.mean), m("median", t.median), `mode ${modeText(t.modes)}`, m("range", t.range), m("IQR", t.iqr), m("MAD", t.mad)].join("; ");
    const out = [`Data (${data.length} ${plural(data.length, "value")}): ${[...data].sort((p, q) => p - q).join(", ")}.`, vsum(spec)];
    if (fallback) out.push("The data are spread over more than 60 units, so a dot plot cannot show them one by one. The box plot is shown instead.");
    out.push(`Measures: ${sentence(st)}. Quartiles: first ${T(st.q1)}, third ${T(st.q3)}. The MAD is the mean absolute deviation, the average distance from the mean.`);
    if (st.outliers.length) out.push(`By the 1.5 × IQR rule, ${list(st.outliers.map(String))} ${st.outliers.length === 1 ? "is an outlier" : "are outliers"} (outside ${both(st.lo)} to ${both(st.hi)}).`);
    else out.push(`By the 1.5 × IQR rule there are no outliers (the fences are ${both(st.lo)} and ${both(st.hi)}).`);
    if (useExtra) {
      const chg = (a, b) => `${both(a)} to ${both(b)} (change ${b.cmp(a) >= 0 ? "+" : ""}${both(b.sub(a))})`;
      out.push(`Adding ${ex}: the mean goes from ${chg(sb.mean, st.mean)}, the median from ${chg(sb.median, st.median)}, the range from ${chg(sb.range, st.range)}, the IQR from ${chg(sb.iqr, st.iqr)}, and the MAD from ${chg(sb.mad, st.mad)}.`);
    } else if (wantExtra) out.push("The list already has 15 values, so the extra value was not added.");
    let viaKey = false;
    const inp = h("input", { id: "mb-statviz-data", type: "text", class: "ml-mb-in ml-mb-wide", autocomplete: "off", spellcheck: "false", value: base.join(", "), onkeydown: (e) => { if (e.key === "Enter") { e.preventDefault(); viaKey = true; useBtn.click(); viaKey = false; } } });
    const useBtn = c.btn("use", "Use these values", (x) => {
      const focus = viaKey ? "#mb-statviz-data" : null;
      const r = parseData(inp.value);
      return r.error ? { note: r.error, focus } : { x: { ...x, data: r.vals }, note: `Now using ${r.vals.length} ${plural(r.vals.length, "value")}.`, focus };
    });
    const rowsOf = (f) => [["Minimum", f.min], ["First quartile", f.q1], ["Median", f.median], ["Third quartile", f.q3], ["Maximum", f.max], ["Mean", f.mean], ["Range", f.range], ["IQR", f.iqr], ["MAD", f.mad]];
    const trows = rowsOf(st).map(([nm, v], i) => (useExtra ? [nm, both(rowsOf(sb)[i][1]), both(v)] : [nm, both(v)]));
    return {
      spec,
      summary: out.join(" "),
      extra: h("div", { class: "ml-mb" }, h("div", { class: "ml-mb-answer" }, h("label", { for: "mb-statviz-data" }, `Data values (up to 15 whole numbers from ${MINUS}100 to 100, separated by commas)`), h("span", { class: "ml-mb-row" }, inp, useBtn)), tbl("Measures", useExtra ? ["Measure", "Without the extra value", "With the extra value"] : ["Measure", "Value"], trows)),
    };
  },
});

/* ================================================================ 12. construction */

const D = (f) => dec(f, 3).text; // every length here is a multiple of 0.5, so these decimals are exact
const UNITS = { none: "", cm: "cm", in: "in", m: "m" };
const construction = manip({
  id: "construction",
  title: "Geometric construction tools",
  band: "6-8",
  purpose: "Tests whether three side lengths can build a triangle and why, classifies it with a² + b² compared with c², and finds the circumference and area of a circle exactly.",
  notice: ["What must be true about the two shorter sides compared with the longest side?", "How does a² + b² compare with c² for a right, an acute and an obtuse triangle?", "How do the circumference and area change when the radius doubles?"],
  controls: [
    { id: "tool", label: "Tool", type: "choice", options: [["triangle", "Build a triangle from three sides"], ["circle", "Circle: circumference and area"]], value: "triangle" },
    { id: "a", label: "Side 1 length", type: "stepper", min: 0.5, max: 30, step: 0.5, value: 3 },
    { id: "b", label: "Side 2 length", type: "stepper", min: 0.5, max: 30, step: 0.5, value: 4 },
    { id: "c", label: "Side 3 length", type: "stepper", min: 0.5, max: 30, step: 0.5, value: 5 },
    { id: "r", label: "Circle radius", type: "stepper", min: 0.5, max: 20, step: 0.5, value: 5 },
    { id: "show", label: "Circle picture shows", type: "choice", options: [["both", "Radius and diameter"], ["radius", "The radius"], ["diameter", "The diameter"]], value: "both" },
    { id: "unit", label: "Unit", type: "choice", options: [["none", "No unit"], ["cm", "Centimeters"], ["in", "Inches"], ["m", "Meters"]], value: "none" },
  ],
  start: (o) => seeded(o, [{ a: 3, b: 4, c: 5 }, { a: 5, b: 12, c: 13 }, { a: 6, b: 7, c: 9 }, { a: 4, b: 5, c: 10 }, { a: 7, b: 8, c: 10 }]),
  model(s) {
    const unit = UNITS[s.unit] !== undefined ? s.unit : "none";
    const u = UNITS[unit];
    const us = u ? ` ${u}` : "";
    if (s.tool === "circle") {
      const r2 = Math.round(Hf(s.r, 0.5, 20, 5) * 2);
      const r = fr(r2, 2);
      const show = oneOf(s.show, ["both", "radius", "diameter"], "both");
      const spec = { kind: "circle", r: r2 / 2, show, ...(u ? { unit: u } : {}) };
      const C314 = fr(628, 100).mul(r);
      const A314 = fr(314, 100).mul(r.mul(r));
      const sq = u ? `${u}²` : "square units";
      const out = [vsum(spec), `The radius is ${D(r)}${us} and the diameter is ${D(r.mul(fr(2)))}${us}.`];
      out.push(`Circumference C = 2 × π × r. With 3.14 for π: C = 2 × 3.14 × ${D(r)} = ${D(C314)}${us}. In terms of π: C = ${D(r.mul(fr(2)))}π${us}.`);
      out.push(`Area A = π × r × r. With 3.14 for π: A = 3.14 × ${D(r)} × ${D(r)} = ${D(A314)} ${sq}. In terms of π: A = ${D(r.mul(r))}π ${sq}.`);
      return { spec, summary: out.join(" ") };
    }
    const sides = ["a", "b", "c"].map((k) => Hf(s[k], 0.5, 30, k === "a" ? 3 : k === "b" ? 4 : 5));
    const q = sides.map((v) => fr(Math.round(v * 2), 2));
    const sorted = [...q].sort((p, r) => p.cmp(r));
    const [s1, s2, s3] = sorted;
    const short = s1.add(s2);
    const lbl = (f) => `${D(f)}${us}`;
    const cmp = short.cmp(s3);
    const out = [];
    let spec;
    if (cmp <= 0) {
      spec = { kind: "tape", rows: [{ label: "Two shorter sides", parts: [{ label: "shorter side", value: V(s1) }, { label: "shorter side", value: V(s2) }] }, { label: "Longest side", parts: [{ label: "longest side", value: V(s3) }] }] };
      out.push(vsum(spec));
      out.push(`These three sides cannot build a triangle: the two shorter sides add up to ${D(s1)} + ${D(s2)} = ${D(short)}${us}, and the longest side is ${lbl(s3)}.`);
      out.push(cmp === 0 ? `${D(short)} is exactly equal to ${D(s3)}, so the two shorter sides would lie flat along the longest side and there is no triangle.` : `${D(short)} is less than ${D(s3)}, so the two shorter sides are too short to reach each other.`);
      out.push("For a triangle, the two shorter sides must add up to more than the longest side.");
      return { spec, summary: out.join(" ") };
    }
    const sq1 = s1.mul(s1);
    const sq2 = s2.mul(s2);
    const sq3 = s3.mul(s3);
    const lhs = sq1.add(sq2);
    const c2 = lhs.cmp(sq3);
    const kind = c2 === 0 ? "right" : c2 > 0 ? "acute" : "obtuse";
    const ns = sides.slice().sort((p, r) => p - r);
    spec = c2 === 0 ? { kind: "triangle", a: ns[0], b: ns[1], c: ns[2], right: true, ...(u ? { unit: u } : {}) } : { kind: "triangle", a: sides[0], b: sides[1], c: sides[2], right: false, ...(u ? { unit: u } : {}) };
    out.push(vsum(spec));
    out.push(`These sides can build a triangle. The triangle inequality holds for every pair: ${D(s1)} + ${D(s2)} = ${D(short)} is more than ${D(s3)}, ${D(s1)} + ${D(s3)} = ${D(s1.add(s3))} is more than ${D(s2)}, and ${D(s2)} + ${D(s3)} = ${D(s2.add(s3))} is more than ${D(s1)}.`);
    out.push(`The Pythagorean check, with a = ${D(s1)}, b = ${D(s2)} and c = ${D(s3)} (the longest side): a² + b² = ${D(sq1)} + ${D(sq2)} = ${D(lhs)} and c² = ${D(sq3)}. Since a² + b² is ${c2 === 0 ? "equal to" : c2 > 0 ? "greater than" : "less than"} c², the triangle is ${kind === "right" ? "a right triangle" : kind === "acute" ? "an acute triangle (all angles less than 90°)" : "an obtuse triangle (one angle greater than 90°)"}.`);
    const eqs = q[0].cmp(q[1]) === 0 && q[1].cmp(q[2]) === 0 ? "equilateral" : q[0].cmp(q[1]) === 0 || q[1].cmp(q[2]) === 0 || q[0].cmp(q[2]) === 0 ? "isosceles" : "scalene";
    out.push(`By its sides it is ${eqs}.`);
    const [x, y, z] = sorted.map((f) => f.n / f.d);
    const ang = (opp, p, r) => (Math.acos(Math.max(-1, Math.min(1, (p * p + r * r - opp * opp) / (2 * p * r)))) * 180) / Math.PI;
    out.push(`The angles are about ${ang(x, y, z).toFixed(1)}°, ${ang(y, x, z).toFixed(1)}° and ${ang(z, x, y).toFixed(1)}° (rounded; they add up to 180°).`);
    return { spec, summary: out.join(" ") };
  },
});

export const MANIPS = { ratiotable, doublenl, tape, algebratiles, balance, equationbuilder, graphing, machine, transformtool, probsim, statviz, construction };

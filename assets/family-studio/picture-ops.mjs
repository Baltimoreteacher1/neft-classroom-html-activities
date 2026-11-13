// "Picture it" recognizers for operations on decimals and whole numbers: + and − lined up at the decimal point,
// × as equal groups (or an area rectangle), and ÷ as equal shares or "how many fit". Same contract as
// picture-arith.mjs: match() is strict and reads every number in the stem; draw() never computes the result.

import { NUM, PAD, S, W, bracket, line, num, qPill, rect, show, text, textW, tr } from "./picture-kit.mjs";

const OPS_NO = /estimate|about|closest|reasonable|decimal (?:places|point)|which|same answer|rewrite|slide|make the|sort|match|mistake|student|remainder|divisor|dividend|explain|round|\bthen\b|both|whole number|place the|written|digits|check|why|\bor\b|rule|pattern|percent|%|fraction|\//i;
const ASK = /what is|find|compute|calculate|evaluate|how (?:much|many|far|long)|\?/i;

/** Number tokens with an optional "$": [{ t, v, money, index }]. */
function tokens(s) {
  return [...s.matchAll(new RegExp(String.raw`(?<![\w.,/])(\$)?(${NUM})(?![\w/]|[.,]\d)`, "g"))].map((m) => ({
    t: m[2],
    v: num(m[2]),
    money: !!m[1],
    index: m.index,
    len: m[0].length,
  }));
}

/** The unit word right after a number token ("7.2 liters" / "0.3-liter cups" -> "liter"), singular. */
function unitAfter(s, t) {
  const m = s.slice(t.index + t.len).match(/^(?:-| )([a-z]+)/i);
  return m ? m[1].toLowerCase().replace(/(?:es|s)$/, "").slice(0, 5) : null;
}

const dec = (t) => /\./.test(t.t);
const lab = (t) => `${t.money ? "$" : ""}${show(t.t)}`;

/** The one bare "A op B" in the stem (and no other number), or null. */
function bare(s, ops) {
  const re = new RegExp(String.raw`(?<![\w.,/])(\$?${NUM}) ([${ops}]) (\$?${NUM})(?![\w/]|[.,]\d| ?[+\-×÷*=])`, "g");
  const ms = [...s.matchAll(re)];
  if (ms.length !== 1) return null;
  const ts = tokens(s);
  if (ts.length !== 2) return null;
  return { a: ts[0], b: ts[1], op: ms[0][2] };
}

// ---------------------------------------------------------------- + and − lined up at the decimal point

const ADD_WORD = /\b(?:in all|altogether|total|combined)\b/i;
const SUB_WORD = /\b(?:left|remain(?:s|ing)?|is left|are left)\b/i;
const WORD_NO = /each|per\b|times|every|then|buy items|average|mean|how many more|difference/i;

const column = {
  kind: "decimal-column",
  match(s) {
    if (OPS_NO.test(s) || !ASK.test(s)) return null;
    let e = bare(s, "+\\-");
    if (!e) {
      if (WORD_NO.test(s)) return null;
      const ts = tokens(s);
      const add = ADD_WORD.test(s);
      const sub = SUB_WORD.test(s);
      if (ts.length !== 2 || add === sub || ts[0].money !== ts[1].money) return null;
      if (/[+\-×÷=]/.test(s.replace(/(\w)-(\w)/g, "$1$2"))) return null;
      e = { a: ts[0], b: ts[1], op: add ? "+" : "-" };
    }
    const { a, b, op } = e;
    if (!dec(a) && !dec(b)) return null;
    if (op === "-" && !(a.v > b.v)) return null;
    const parts = [a, b].map((t) => t.t.replace(/,/g, "").replace(/^-/, ""));
    if (parts.some((p) => p.length > 8) || /-/.test(a.t + b.t)) return null;
    return { a, b, op };
  },
  draw({ a, b, op }, lang) {
    const split = (t) => {
      const [i, d = ""] = t.t.replace(/,/g, "").split(".");
      return { i, d };
    };
    const A = split(a);
    const B = split(b);
    const I = Math.max(A.i.length, B.i.length);
    const D = Math.max(A.d.length, B.d.length);
    const cw = 30;
    const pw = 16;
    const gw = (I + D) * cw + pw;
    const xr = (W + gw) / 2 + 20;
    const x0 = xr - gw;
    const y0 = 30;
    const rh = 38;
    const out = [];
    // Frame: one column per place value, the decimal point column marked.
    for (let c = 0; c < I + D; c++) {
      const x = x0 + c * cw + (c >= I ? pw : 0);
      out.push(rect(x + 2, y0 - 6, cw - 4, rh * 3 + 4, "fp-gr", 4));
    }
    const xp = x0 + I * cw + pw / 2;
    out.push(line(x0 - 34, y0 + 2 * rh - 2, xr + 4, y0 + 2 * rh - 2, "fp-ln"));
    const sym = op === "+" ? "+" : "−";
    const row = (t, r, money) => {
      const y = y0 + r * rh + 20;
      const g = [];
      const ci = (k) => x0 + (I - t.i.length + k) * cw + cw / 2;
      [...t.i].forEach((ch, k) => g.push(text(ci(k), y, ch, { cls: "fp-t fp-n" })));
      g.push(text(xp, y, ".", { cls: "fp-t fp-n" }));
      for (let k = 0; k < D; k++) {
        const x = x0 + I * cw + pw + k * cw + cw / 2;
        // A zero written in only to line the places up is drawn faintly: it does not change the number.
        g.push(k < t.d.length ? text(x, y, t.d[k], { cls: "fp-t fp-n" }) : `<g class="fp-off">${text(x, y, "0", { cls: "fp-t fp-n" })}</g>`);
      }
      if (money) g.push(text(x0 - 12, y, "$", { anchor: "end", cls: "fp-t fp-n" }));
      return g.join("");
    };
    out.push(S(2, row(A, 0, a.money), row(B, 1, b.money), text(x0 - (a.money ? 30 : 12), y0 + rh + 20, sym, { anchor: "end", cls: "fp-t fp-n" })));
    out.push(S(3, qPill(xp, y0 + 2 * rh + 16)));
    const E = `${lab(a)} ${sym} ${lab(b)}`;
    const cap = { en: `${E}, lined up at the decimal point`, es: `${E}, alineados en el punto decimal` };
    return {
      title: { en: `Place-value columns for ${E}`, es: `Columnas de valor posicional para ${E}` },
      caption: cap,
      desc: {
        en: `${cap.en}: ones under ones, tenths under tenths. A faint 0 fills an empty place. The ${op === "+" ? "sum" : "difference"} is the unknown.`,
        es: `${cap.es}: unidades bajo unidades, décimos bajo décimos. Un 0 claro llena un lugar vacío. ${op === "+" ? "La suma" : "La diferencia"} es la incógnita.`,
      },
      h: y0 + 3 * rh + 8,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- × as equal groups or an area rectangle

const MUL_WORD = /(?:cost|spend|pay|total|earn|how far|how much|how many)/i;

const multiply = {
  kind: "decimal-times",
  match(s) {
    if (OPS_NO.test(s) || !ASK.test(s)) return null;
    let e = bare(s, "×*");
    if (!e) {
      // "Notebooks cost $2.40 each. What is the cost of 6 notebooks?" / "3 taco baskets at $4.25 each".
      if (!MUL_WORD.test(s) || /per\b|every|left|more|change|tax|tip|discount|\btimes\b|share|split|among|divid|equally|evenly/i.test(s)) return null;
      const ts = tokens(s);
      if (ts.length !== 2) return null;
      const price = ts.find((t) => t.money && dec(t));
      const k = ts.find((t) => !t.money && Number.isInteger(t.v));
      if (!price || !k || !/\beach\b|costs? \$[\d.]+\. what (?:do|does)/i.test(s)) return null;
      e = { a: price, b: k, op: "×" };
    }
    const { a, b } = e;
    if (!dec(a) && !dec(b)) return null;
    const whole = [a, b].find((t) => !dec(t) && Number.isInteger(t.v) && t.v >= 2 && t.v <= 10);
    if (whole) return { g: [a, b].find((t) => t !== whole), k: whole, mode: "groups", a, b };
    if (a.v <= 0 || b.v <= 0 || a.v > 1000 || b.v > 1000 || !bare(s, "×*")) return null;
    return { a, b, mode: "area" };
  },
  draw(d, lang) {
    const out = [];
    let cap;
    let h;
    if (d.mode === "groups") {
      const { g, k } = d;
      const x0 = PAD;
      const bw = W - 2 * PAD;
      const pw = bw / k.v;
      const y = 56;
      const bh = 42;
      for (let i = 0; i < k.v; i++) out.push(rect(x0 + i * pw, y, pw, bh, "fp-p", 3));
      const fits = textW(lab(g), 15) <= pw - 4;
      for (let i = 0; i < k.v; i++) if (fits) out.push(S(2, text(x0 + i * pw + pw / 2, y + bh / 2 + 6, lab(g), { cls: "fp-t fp-n" })));
      if (!fits) out.push(S(2, text(W / 2, y + bh + 26, tr(lang, `each part is ${lab(g)}`, `cada parte es ${lab(g)}`), { cls: "fp-t fp-n" })));
      out.push(S(2, text(W / 2, 22, tr(lang, `${k.v} equal groups of ${lab(g)}`, `${k.v} grupos iguales de ${lab(g)}`), { cls: "fp-t fp-s" })));
      out.push(S(3, bracket(x0, x0 + bw, y - 8, -1), qPill(W / 2, y - 22)));
      h = y + bh + 40;
      cap = { en: `${k.v} × ${lab(g)}: ${k.v} equal groups of ${lab(g)}; the total is unknown`, es: `${k.v} × ${lab(g)}: ${k.v} grupos iguales de ${lab(g)}; el total es la incógnita` };
    } else {
      const { a, b } = d;
      const big = Math.max(a.v, b.v);
      const w = Math.max(90, Math.min(220, (a.v / big) * 220));
      const hh = Math.max(50, Math.min(120, (b.v / big) * 120));
      const x0 = (W - w) / 2;
      const y0 = 20;
      out.push(rect(x0, y0, w, hh, "fp-p", 2));
      out.push(S(2, text(x0 + w / 2, y0 + hh + 22, lab(a), { cls: "fp-t fp-n" }), text(x0 - 10, y0 + hh / 2 + 5, lab(b), { anchor: "end", cls: "fp-t fp-n" })));
      out.push(S(3, text(x0 + w / 2 - 20, y0 + hh / 2 + 6, tr(lang, "Area", "Área"), { anchor: "middle", cls: "fp-t fp-s" }), qPill(x0 + w / 2 + 26, y0 + hh / 2)));
      h = y0 + hh + 40;
      cap = { en: `${lab(a)} × ${lab(b)} as a rectangle ${lab(a)} wide and ${lab(b)} tall; its area is the unknown`, es: `${lab(a)} × ${lab(b)} como un rectángulo de ${lab(a)} de ancho y ${lab(b)} de alto; su área es la incógnita` };
    }
    return {
      title: { en: "Multiplication model", es: "Modelo de multiplicación" },
      caption: cap,
      desc: { en: `${cap.en}. The product is not shown.`, es: `${cap.es}. El producto no se muestra.` },
      h,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- ÷ as equal shares or "how many fit"

const SIZE = [
  String.raw`\beach (?:[a-z-]+ ){0,3}(?:holds?|uses|is|needs|gets|has|takes|costs)(?: a| exactly)? \$?(${NUM})`,
  String.raw`\b(?:that are |are )?each \$?(${NUM}) [a-z]+(?: long| wide)?`,
  String.raw`(?<![\w.])(${NUM})-[a-z]+ (?:pieces|cups|bottles|servings|sections|strips|ribbons|glasses|jars|bags)`,
  String.raw`\binto \$?(${NUM})-[a-z]+ (?:pieces|prize strips|strips)`,
  String.raw`\bevery \$?(${NUM}) [a-z]+`,
  String.raw`\bevery [a-z]+ costs \$(${NUM})`,
  String.raw`\b(?:crates|boxes|cases|groups|bags|packs|rows|teams) of (${NUM})\b`,
];
const SHARE = String.raw`(?:shares?|shared|split|divided|poured|loaded?|packs?)(?: [a-z,]+){0,4} (?:evenly |equally )(?:among|between|into|onto) (${NUM})\b`;
const DIV_NO = /\bper\b|faster|rate|more|less|left over|full\b|how many more|both|then|time|after midnight|hours and minutes|minutes/i;

const divide = {
  kind: "division-model",
  match(s) {
    if (OPS_NO.test(s) || !ASK.test(s)) return null;
    let e = bare(s, "÷");
    let mode;
    if (e) mode = !dec(e.b) && dec(e.a) && e.b.v >= 2 && e.b.v <= 12 ? "share" : "fit";
    else {
      if (DIV_NO.test(s)) return null;
      const ts = tokens(s);
      if (ts.length !== 2) return null;
      const sh = s.match(new RegExp(SHARE, "i"));
      if (sh && /how (?:much|many) [^?]*each|each [a-z]+ get/i.test(s)) {
        const k = ts.find((t) => t.t === sh[1]);
        const T = ts.find((t) => t !== k);
        if (!k || !T || dec(k) || !(k.v >= 2 && k.v <= 100)) return null;
        e = { a: T, b: k };
        mode = "share";
      } else {
        if (!/how many/i.test(s)) return null;
        const sizes = SIZE.flatMap((re) => [...s.matchAll(new RegExp(re, "gi"))].map((m) => m[1]));
        if (new Set(sizes).size !== 1) return null;
        const b = ts.find((t) => t.t === sizes[0]);
        const a = ts.find((t) => t !== b);
        if (!a || !b || a.money !== b.money) return null;
        // Total and piece must be the same kind of quantity (7.2 liters, 0.3-liter cups), or "boxes of 14".
        const grouped = /\b(?:crates|boxes|cases|groups|bags|packs|rows|teams) of \d/i.test(s);
        if (!a.money && !grouped && unitAfter(s, a) !== unitAfter(s, b)) return null;
        e = { a, b };
        mode = "fit";
      }
    }
    const { a, b } = e;
    if (!(a.v > 0 && b.v > 0) || (mode === "fit" && !(b.v < a.v))) return null;
    if (mode === "share" && !Number.isInteger(b.v)) return null;
    return { a, b, mode };
  },
  draw({ a, b, mode }, lang) {
    const x0 = PAD;
    const bw = W - 2 * PAD;
    const y = 56;
    const bh = 40;
    const out = [rect(x0, y, bw, bh, "fp-g", 2)];
    out.push(S(2, bracket(x0, x0 + bw, y - 8, -1), text(W / 2, y - 20, lab(a), { cls: "fp-t fp-n" })));
    let cap;
    if (mode === "share") {
      const k = b.v;
      const shown = k <= 12 ? [...Array(k).keys()] : [0, 1, 2, k - 1];
      const pw = k <= 12 ? bw / k : bw / 5;
      const xs = k <= 12 ? shown.map((i) => x0 + i * pw) : [x0, x0 + pw, x0 + 2 * pw, x0 + 4 * pw];
      for (let i = 1; i < (k <= 12 ? k : 5); i++) out.push(line(x0 + i * pw, y, x0 + i * pw, y + bh, "fp-ln"));
      if (k > 12) out.push(text(x0 + 3.5 * pw, y + bh / 2 + 6, "…", { cls: "fp-t fp-n" }));
      out.push(S(2, text(W / 2, y + bh + 24, tr(lang, `${k} equal parts`, `${k} partes iguales`), { cls: "fp-t fp-s" })));
      if (pw >= 30) out.push(S(3, xs.map((x) => text(x + pw / 2, y + bh / 2 + 7, "?", { cls: "fp-t fp-q" }))));
      out.push(S(3, text(W / 2 - 4, y + bh + 54, tr(lang, "Each part =", "Cada parte ="), { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 18, y + bh + 49)));
      cap = { en: `${lab(a)} ÷ ${k}: ${lab(a)} split into ${k} equal parts; each part is unknown`, es: `${lab(a)} ÷ ${k}: ${lab(a)} repartido en ${k} partes iguales; cada parte es la incógnita` };
    } else {
      const gw = Math.max(36, Math.min(bw / 2, (bw * b.v) / a.v));
      out.push(S(2, rect(x0, y, gw, bh, "fp-p", 2), text(x0 + gw / 2, y + bh / 2 + 6, lab(b), { cls: "fp-t fp-n" })));
      out.push(S(3, text(W / 2, y + bh + 30, tr(lang, `How many ${lab(b)}s fit in ${lab(a)}?`, `¿Cuántas veces cabe ${lab(b)} en ${lab(a)}?`), { cls: "fp-t" }), qPill(W / 2, y + bh + 56)));
      cap = { en: `${lab(a)} ÷ ${lab(b)} asks how many ${lab(b)}s fit in ${lab(a)}`, es: `${lab(a)} ÷ ${lab(b)} pregunta cuántas veces cabe ${lab(b)} en ${lab(a)}` };
    }
    return {
      title: { en: `Division model for ${lab(a)} ÷ ${lab(b)}`, es: `Modelo de división para ${lab(a)} ÷ ${lab(b)}` },
      caption: cap,
      desc: { en: `${cap.en}. The quotient is not shown.`, es: `${cap.es}. El cociente no se muestra.` },
      h: y + bh + 76,
      body: out.join(""),
    };
  },
};

export const OPS = [column, multiply, divide];

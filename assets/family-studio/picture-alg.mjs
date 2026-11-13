// "Picture it" recognizers for expressions: the distributive property as an area model, like terms as algebra
// tiles, and evaluating an expression as a substitution. Same contract as picture-arith.mjs.

import { NUM, PAD, S, W, esc, n1, num, qPill, rect, show, text, textW, tr } from "./picture-kit.mjs";

// ---------------------------------------------------------------- distributive property (area model)

const TERM = String.raw`\d*[a-z]|\d+`;
const DIST_NO = /complete|_{2}|which property|student|check|\btest\b|sort|match|explain|both ways|factored|expanded way|each|when|=|value of|order/i;
const UNITS = String.raw`(?:units?|feet|foot|ft|inches|in|meters|m|cm|yards|yd)`;

const distributive = {
  kind: "area-model",
  match(s) {
    let m = s.match(new RegExp(String.raw`is (\d+) ${UNITS} tall\. Its width is split into a part (${TERM}) ${UNITS} wide and a part (${TERM}) ${UNITS} wide`, "i"));
    if (m && /area/i.test(s) && !/which property|student/i.test(s) && (s.match(new RegExp(NUM, "g")) || []).length <= 3)
      return { a: m[1], b: m[2], c: m[3], mode: "expand", story: true };
    if (DIST_NO.test(s)) return null;
    const ms = [...s.matchAll(new RegExp(String.raw`(?<![\w.)])(\d+)\((${TERM}) \+ (${TERM})\)(?![\w(])`, "g"))];
    m = s.match(new RegExp(String.raw`^factor (\d+[a-z]) \+ (\d+)(?: using the (?:greatest common factor|gcf|greatest common factor \(gcf\)))?\.?$`, "i"));
    if (m && !ms.length) return { a: null, b: m[1], c: m[2], mode: "factor" };
    if (ms.length !== 1) return null;
    if (!/expand|what is|equal|equivalent|distributive|find|simplify|\?|^\d/i.test(s)) return null;
    const rest = s.replace(ms[0][0], " ");
    if (new RegExp(NUM).test(rest)) return null;
    const [, a, b, c] = ms[0];
    if (+a < 2 || +a > 12) return null;
    return { a, b, c, mode: "expand" };
  },
  draw({ a, b, c, mode, story }, lang) {
    const isNum = (t) => /^\d+$/.test(t);
    let wb = 0.55;
    if (isNum(b) && isNum(c)) wb = Math.max(0.25, Math.min(0.75, +b / (+b + +c)));
    const tw = 230;
    const x0 = (W - tw) / 2 + 14;
    const y0 = 40;
    const h = 80;
    const w1 = tw * wb;
    const out = [rect(x0, y0, w1, h, "fp-p", 0), rect(x0 + w1, y0, tw - w1, h, "fp-p", 0)];
    const B = show(b);
    const C = show(c);
    if (mode === "expand") {
      out.push(S(2, text(x0 - 10, y0 + h / 2 + 5, a, { anchor: "end", cls: "fp-t fp-n" }), text(x0 + w1 / 2, y0 - 10, B, { cls: "fp-t fp-n" }), text(x0 + w1 + (tw - w1) / 2, y0 - 10, C, { cls: "fp-t fp-n" })));
      out.push(S(3, qPill(x0 + w1 / 2, y0 + h / 2), qPill(x0 + w1 + (tw - w1) / 2, y0 + h / 2)));
    } else {
      out.push(S(2, text(x0 + w1 / 2, y0 + h / 2 + 6, B, { cls: "fp-t fp-n" }), text(x0 + w1 + (tw - w1) / 2, y0 + h / 2 + 6, C, { cls: "fp-t fp-n" })));
      out.push(S(3, qPill(x0 - 24, y0 + h / 2), qPill(x0 + w1 / 2, y0 - 16), qPill(x0 + w1 + (tw - w1) / 2, y0 - 16)));
    }
    const E = mode === "expand" ? (story ? `${a} × (${B} + ${C})` : `${a}(${B} + ${C})`) : `${B} + ${C}`;
    const cap =
      mode === "expand"
        ? { en: `${E}: a rectangle ${a} tall, split into widths ${B} and ${C}; each part's area is unknown`, es: `${E}: un rectángulo de ${a} de alto, dividido en anchos ${B} y ${C}; el área de cada parte es la incógnita` }
        : { en: `${E}: two areas, ${B} and ${C}, side by side; the shared height (the common factor) is unknown`, es: `${E}: dos áreas, ${B} y ${C}, una al lado de la otra; la altura común (el factor común) es la incógnita` };
    return {
      title: { en: `Area model for ${E}`, es: `Modelo de área para ${E}` },
      caption: cap,
      desc: { en: `${cap.en}. The whole area is the sum of the two parts.`, es: `${cap.es}. El área total es la suma de las dos partes.` },
      h: y0 + h + 20,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- like terms (algebra tiles)

const LIKE_NO = /when|evaluate|value|then|which two|which pair|which term|coefficient|sort|match|already|each|like terms\?|explain|\btest\b|student|cost|total|if |=/i;
const RUN = /(?<![\w.(])((?:\d*[a-z]|\d+)(?: [+-] (?:\d*[a-z]|\d+))+)(?![\w(]|\.\d)/g;

const likeTerms = {
  kind: "algebra-tiles",
  match(s) {
    if (LIKE_NO.test(s) || !/simplify|combine|equivalent|clean up/i.test(s)) return null;
    const runs = [...s.matchAll(RUN)].filter((m) => /[a-z]/.test(m[1]));
    if (runs.length !== 1) return null;
    const src = runs[0][1];
    if (new RegExp(NUM).test(s.replace(src, " "))) return null;
    const terms = [];
    let sign = 1;
    for (const tok of src.split(" ")) {
      if (tok === "+" || tok === "-") {
        sign = tok === "+" ? 1 : -1;
        continue;
      }
      const m = tok.match(/^(\d*)([a-z]?)$/);
      const k = m[1] === "" ? 1 : +m[1];
      terms.push({ k, v: m[2], sign });
    }
    const vars = [...new Set(terms.filter((t) => t.v).map((t) => t.v))];
    if (vars.length !== 1 || terms.filter((t) => t.v).length < 2 || !/^[a-z]$/.test(vars[0])) return null;
    if (terms[0].sign < 0 || terms.some((t) => t.k < 1)) return null;
    // A take-away never removes more tiles than are already on the board.
    const run = { v: 0, c: 0 };
    for (const t of terms) {
      run[t.v ? "v" : "c"] += t.sign * t.k;
      if (run.v < 0 || run.c < 0) return null;
    }
    const nv = terms.filter((t) => t.v).reduce((n, t) => n + t.k, 0);
    const nc = terms.filter((t) => !t.v).reduce((n, t) => n + t.k, 0);
    if (nv > 16 || nc > 14) return null;
    return { terms, v: vars[0], src };
  },
  draw({ terms, v, src }, lang) {
    const tile = (t) => (t.v ? 17 : 17);
    const groupW = terms.map((t) => t.k * tile(t) - 3);
    const signW = 22;
    const total = groupW.reduce((a, b) => a + b, 0) + signW * (terms.length - 1);
    if (total > W - 2 * PAD) return null;
    let x = (W - total) / 2;
    const yb = 96;
    const out = [];
    const E = show(src.replace(/ - /g, " − "));
    out.push(S(2, text(W / 2, 24, E, { cls: "fp-t fp-n" })));
    terms.forEach((t, i) => {
      if (i) {
        out.push(text(x + signW / 2 - 3, yb - 12, t.sign > 0 ? "+" : "−", { cls: "fp-t fp-n" }));
        x += signW;
      }
      const g = [];
      for (let j = 0; j < t.k; j++) {
        const tx = x + j * tile(t);
        if (t.v) {
          g.push(rect(tx, yb - 44, 14, 44, t.sign > 0 ? "fp-p" : "fp-u", 3), text(tx + 7, yb - 16, v, { cls: "fp-t fp-s" }));
        } else {
          g.push(rect(tx, yb - 14, 14, 14, t.sign > 0 ? "fp-p" : "fp-u", 2));
        }
        if (t.sign < 0) g.push(`<line class="fp-ln" x1="${n1(tx - 2)}" y1="${yb + 2}" x2="${n1(tx + 16)}" y2="${t.v ? yb - 46 : yb - 16}"/>`);
      }
      g.push(text(x + groupW[i] / 2, yb + 22, `${t.k === 1 && t.v ? "" : t.k}${t.v}`, { cls: "fp-t fp-s" }));
      out.push(S(2, g));
      x += groupW[i];
    });
    out.push(S(3, text(W / 2 - 4, yb + 58, tr(lang, "Combined =", "Combinado ="), { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 18, yb + 53)));
    const nm = (t, l) =>
      t.v
        ? l === "es"
          ? `${t.k} ${t.k === 1 ? "barra" : "barras"} ${v}`
          : `${t.k} ${v}-${t.k === 1 ? "bar" : "bars"}`
        : l === "es"
          ? `${t.k} ${t.k === 1 ? "unidad" : "unidades"}`
          : `${t.k} ${t.k === 1 ? "one" : "ones"}`;
    const list = (l) => terms.map((t, i) => `${i ? (t.sign > 0 ? (l === "es" ? "más " : "plus ") : l === "es" ? "menos " : "take away ") : ""}${nm(t, l)}`).join(", ");
    const cap = { en: `${E}: ${list("en")}`, es: `${E}: ${list("es")}` };
    return {
      title: { en: `Algebra tiles for ${E}`, es: `Fichas de álgebra para ${E}` },
      caption: cap,
      desc: {
        en: `${cap.en}. A tall bar is ${v}, a small square is 1; crossed-out dashed tiles are taken away. The simplified expression is the unknown.`,
        es: `${cap.es}. Una barra alta es ${v} y un cuadrito es 1; las fichas punteadas y tachadas se quitan. La expresión simplificada es la incógnita.`,
      },
      h: yb + 74,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- evaluate an expression (substitution)

const EVAL_NO = /simplify|both|\btest\b|equivalent|which|sort|match|student|table|explain|write|two ways|then|graph|ordered pair|solve/i;

/** Tokens of an expression run: numbers, the one variable, operators, parentheses, "^n". */
function readExpr(src, v) {
  const toks = src.match(/\d+(?:\.\d+)?|[a-z]|\^\d+|[+\-×÷*/()]/g) || [];
  if (toks.join("") !== src.replace(/\s+/g, "")) return null;
  if (toks.some((t) => /^[a-z]$/.test(t) && t !== v) || !toks.includes(v)) return null;
  let i = 0;
  const atom = () => {
    const t = toks[i];
    if (t === "(") {
      i++;
      if (!sum() || toks[i] !== ")") return false;
      i++;
    } else if (t === v || /^\d/.test(t ?? "")) i++;
    else return false;
    if (/^\^/.test(toks[i] ?? "")) i++;
    return true;
  };
  const prod = () => {
    if (!atom()) return false;
    for (;;) {
      if (["×", "÷", "*", "/"].includes(toks[i])) {
        i++;
        if (!atom()) return false;
      } else if (toks[i] === v || toks[i] === "(") {
        if (!atom()) return false;
      } else return true;
    }
  };
  function sum() {
    if (!prod()) return false;
    while (["+", "-"].includes(toks[i])) {
      i++;
      if (!prod()) return false;
    }
    return true;
  }
  if (!sum() || i !== toks.length) return null;
  const hasOp = toks.some((t) => /^[+\-×÷*/^(]/.test(t)) || toks.some((t, k) => t === v && /^\d/.test(toks[k - 1] ?? ""));
  return hasOp ? toks : null;
}

const evaluate = {
  kind: "substitution",
  match(s) {
    if (EVAL_NO.test(s) || !/value|evaluate|what is|find|how much|cost/i.test(s)) return null;
    const sets = [...s.matchAll(new RegExp(String.raw`\b([a-z]) = (${NUM})(?![\w]|[.,]\d| ?[+\-×÷*/])`, "g"))];
    if (sets.length !== 1) return null;
    const v = sets[0][1];
    const val = sets[0][2];
    const rest = s.replace(sets[0][0], " ");
    const runs = [];
    for (const m of rest.matchAll(/[0-9a-z().^+\-×÷*/ ]+/g)) {
      // Split each run at English words (two or more letters) and keep the math pieces that use the variable.
      for (const piece of m[0].split(/\b[a-z]{2,}\b/)) {
        const p = piece.trim();
        if (p && new RegExp(String.raw`(?<![a-z])${v}(?![a-z])`).test(p)) {
          const toks = readExpr(p, v);
          if (toks) runs.push({ p, toks });
        }
      }
    }
    if (runs.length !== 1) return null;
    const { p, toks } = runs[0];
    const others = (rest.replace(p, " ").match(new RegExp(String.raw`(?<![\w.^])${NUM}`, "g")) || []).length;
    if (others) return null;
    if (Math.abs(num(val)) > 10000) return null;
    return { v, val, toks, src: p };
  },
  draw({ v, val, toks, src }, lang) {
    const V = show(val);
    const vShown = val.startsWith("-") ? `(${V})` : V;
    const parts = [];
    toks.forEach((t, k) => {
      const prev = toks[k - 1] ?? "";
      if (t === v) {
        if (/^[\d)]/.test(prev) || prev === v) parts.push({ t: " × " });
        parts.push({ t: vShown, hit: true });
      } else if (t === "(" && (/^[\d)]/.test(prev) || prev === v)) parts.push({ t: "(" });
      else if (/^\^/.test(t)) parts.push({ t: show(t) });
      else if (/^[+\-×÷*/]$/.test(t)) parts.push({ t: ` ${t === "-" ? "−" : t === "*" ? "×" : t} ` });
      else parts.push({ t });
    });
    const sub = parts.map((p) => p.t).join("");
    const E = show(src.replace(/\s*([+\-×÷*/])\s*/g, " $1 ").replace(/ - /g, " − ").replace(/\( /g, "(").replace(/ \)/g, ")").trim());
    if (textW(sub, 15) > W - 2 * PAD - 60) return null;
    const out = [];
    out.push(rect(PAD + 30, 16, W - 2 * PAD - 60, 36, "fp-g", 8));
    out.push(S(2, text(W / 2, 40, E, { cls: "fp-t fp-n" })));
    out.push(S(2, text(W / 2, 80, tr(lang, `put in ${v} = ${V}`, `sustituye ${v} = ${V}`), { cls: "fp-t fp-s fp-ta" }), `<path class="fp-ln" d="M${W / 2 - 70} 64v20M${W / 2 - 76} 78l6 8l6-8"/>`));
    const tsp = parts.map((p) => (p.hit ? `<tspan class="fp-ta">${esc(p.t)}</tspan>` : esc(p.t))).join("");
    out.push(S(2, `<text class="fp-t fp-n" x="${W / 2}" y="124" text-anchor="middle">${tsp}</text>`));
    out.push(S(3, text(W / 2 - 6, 164, "=", { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 14, 159)));
    const cap = { en: `${E} when ${v} = ${V}: replace ${v} with ${V} to get ${sub}`, es: `${E} cuando ${v} = ${V}: se reemplaza ${v} por ${V} y queda ${sub}` };
    return {
      title: { en: `Substitute ${v} = ${V} into ${E}`, es: `Sustituir ${v} = ${V} en ${E}` },
      caption: cap,
      desc: { en: `${cap.en}. The value is the unknown.`, es: `${cap.es}. El valor es la incógnita.` },
      h: 182,
      body: out.join(""),
    };
  },
};

export const ALG = [distributive, likeTerms, evaluate];

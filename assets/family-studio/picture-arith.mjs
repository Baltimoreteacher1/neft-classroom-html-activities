// "Picture it" recognizers for arithmetic stems: powers, order of operations, one-step equations, fraction
// division and percents. Each recognizer is { kind, match(s) -> data | null, draw(data, lang) -> parts }, where s is
// the normalised stem (picture-kit.mjs norm()). match() is strict: anything it cannot read unambiguously is null.

import {
  NUM,
  PAD,
  S,
  W,
  bracket,
  clampX,
  count,
  fmt,
  frac,
  lcm,
  line,
  num,
  qPill,
  rect,
  show,
  text,
  textW,
  tr,
} from "./picture-kit.mjs";

// ---------------------------------------------------------------- tiny expression reader

/** Tokenise and check a whole-number expression (+ − × ÷ ^ and parentheses). Returns its operator list or null. */
export function readExpr(src) {
  const toks = src.match(/\d+|[+\-×÷*()^]|\S/g) || [];
  if (toks.some((t) => !/^(\d+|[+\-×÷*()^])$/.test(t))) return null;
  let i = 0;
  const ops = [];
  const atom = () => {
    if (toks[i] === "(") {
      i++;
      if (!expr()) return false;
      if (toks[i] !== ")") return false;
      ops.push("()");
      i++;
      return true;
    }
    if (/^\d+$/.test(toks[i] ?? "")) {
      i++;
      return true;
    }
    return false;
  };
  const factor = () => {
    if (!atom()) return false;
    if (toks[i] === "^") {
      i++;
      if (!/^\d+$/.test(toks[i] ?? "")) return false;
      ops.push("^");
      i++;
    }
    return true;
  };
  const term = () => {
    if (!factor()) return false;
    while (["×", "÷", "*"].includes(toks[i])) {
      ops.push(toks[i] === "*" ? "×" : toks[i]);
      i++;
      if (!factor()) return false;
    }
    return true;
  };
  function expr() {
    if (!term()) return false;
    while (["+", "-"].includes(toks[i])) {
      ops.push(toks[i]);
      i++;
      if (!term()) return false;
    }
    return true;
  }
  if (!expr() || i !== toks.length) return null;
  return ops;
}

/** Every maximal whole-number expression run in the stem that reads as a valid expression with >= 1 operator. */
function exprRuns(s) {
  const out = [];
  for (const m of s.matchAll(/(?<![\w.,$/])[(\d][\d\s()+\-×÷*^]*[\d)](?![\w/]|[.,]\d)/g)) {
    const src = m[0].trim();
    const ops = readExpr(src);
    if (ops?.length) out.push({ src, ops });
  }
  return out;
}

// ---------------------------------------------------------------- power

const POWER_NO = /how many factors|\bbase\b|repeated multiplication|expanded|written|\bwrite\b|which (expression|power|is)|match|sort|greater|greatest|compare|exponent form|factoriz|each/i;

const power = {
  kind: "power",
  match(s) {
    if (POWER_NO.test(s) || !/value|what is|evaluate|find|how many|\?/i.test(s)) return null;
    const found = [];
    for (const m of s.matchAll(/(?<![\w.^])(\d+)\^(\d+)(?!\d|\.\d)/g)) found.push([+m[1], +m[2], m.index, m[0]]);
    for (const m of s.matchAll(/(?<![\w.])(\d+) (squared|cubed)\b/gi))
      found.push([+m[1], m[2].toLowerCase() === "squared" ? 2 : 3, m.index, m[0]]);
    for (const m of s.matchAll(/(?<![\w.])(\d+) to the (\d+)(?:st|nd|rd|th) power/gi)) found.push([+m[1], +m[2], m.index, m[0]]);
    // The same power named twice ("plays 3⁴ beats. What is the value of 3⁴?") is one power.
    if (found.length !== 1 && !(found.length === 2 && found[0][0] === found[1][0] && found[0][1] === found[1][1])) return null;
    const [b, n, at, tok] = found[0];
    if (b < 2 || b > 12 || n < 2 || n > 6) return null;
    const rest = s.slice(0, at) + s.slice(at + tok.length);
    if (/[+×÷*=]|\d\s*-\s*\d|\(\s*\d/.test(rest)) return null;
    // Every other number in the stem must be the base or the exponent (a grid "6 rows of 6"), so the picture is the problem.
    for (const m of rest.matchAll(new RegExp(NUM, "g"))) if (![b, n].includes(num(m[0]))) return null;
    return { b, n };
  },
  draw({ b, n }, lang) {
    const p = `${b}^${n}`;
    const P = show(p);
    const out = [];
    let h;
    if (n === 2 && b <= 10) {
      const cell = Math.min(18, 150 / b);
      const x0 = 70;
      const y0 = 34;
      for (let r = 0; r < b; r++)
        for (let c = 0; c < b; c++) out.push(rect(x0 + c * cell + 1, y0 + r * cell + 1, cell - 2, cell - 2, "fp-p", 2));
      const side = b * cell;
      out.push(
        S(
          2,
          text(x0 + side / 2, y0 - 10, tr(lang, `${b} in each row`, `${b} en cada fila`), { cls: "fp-t fp-s" }),
          text(x0 - 12, y0 + side / 2 + 5, tr(lang, `${b} rows`, `${b} filas`), { anchor: "end", cls: "fp-t fp-s" }),
          text(x0 + side + 54, y0 + side / 2 - 4, `${P} =`, { cls: "fp-t fp-n" }),
        ),
      );
      out.push(S(3, qPill(x0 + side + 54, y0 + side / 2 + 22)));
      h = y0 + side + 14;
    } else {
      const bw = 44;
      const gap = 18;
      const total = n * bw + (n - 1) * gap;
      const x0 = Math.max(PAD, (W - total - 60) / 2);
      out.push(S(2, text(W / 2, 26, tr(lang, `${P}: ${n} factors of ${b}`, `${P}: ${n} factores de ${b}`), { cls: "fp-t fp-n" })));
      for (let i = 0; i < n; i++) {
        const x = x0 + i * (bw + gap);
        out.push(rect(x, 48, bw, 40, "fp-p", 6));
        out.push(S(2, text(x + bw / 2, 74, String(b), { cls: "fp-t fp-n" })));
        if (i < n - 1) out.push(S(2, text(x + bw + gap / 2, 74, "×", { cls: "fp-t fp-n" })));
      }
      const xe = x0 + total;
      out.push(S(2, text(xe + 14, 74, "=", { cls: "fp-t fp-n" })));
      out.push(S(3, qPill(xe + 42, 68)));
      h = 104;
    }
    const strip = Array(n).fill(b).join(" × ");
    return {
      title: { en: `Picture of ${P}`, es: `Dibujo de ${P}` },
      caption:
        n === 2
          ? { en: `${P} means ${b} rows of ${b}`, es: `${P} significa ${b} filas de ${b}` }
          : { en: `${P} means ${strip}`, es: `${P} significa ${strip}` },
      desc: {
        en: `${P} is ${n} factors of ${b} multiplied: ${strip}. The value is the unknown.`,
        es: `${P} son ${n} factores de ${b} multiplicados: ${strip}. El valor es la incógnita.`,
      },
      h,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- order of operations

const ORDER_NO = /factoriz|student|propert|area|volume|gets|got|\bfirst\b|which step|which operation|\border\b|parenthes|both|\bwrite\b|build|match|sort|insert|place|each|which expression/i;

const RUNGS = [
  { key: "P", has: (o) => o.includes("()"), en: "Parentheses", es: "Paréntesis" },
  { key: "E", has: (o) => o.includes("^"), en: "Exponents", es: "Exponentes" },
  { key: "M D", has: (o) => o.includes("×") || o.includes("÷"), en: "Multiply / divide", es: "Multiplicar / dividir" },
  { key: "A S", has: (o) => o.includes("+") || o.includes("-"), en: "Add / subtract", es: "Sumar / restar" },
];

const order = {
  kind: "order",
  match(s) {
    if (ORDER_NO.test(s) || !/what is|evaluate|find|value|simplify|compute|calculate|total|\?/i.test(s)) return null;
    const runs = exprRuns(s);
    if (runs.length !== 1) return null;
    const { src, ops } = runs[0];
    if (RUNGS.filter((r) => r.has(ops)).length < 2) return null;
    // The expression must be the whole problem: no other number in the stem (a word problem, a student's answer).
    if (new RegExp(NUM).test(s.replace(src, " "))) return null;
    return { src: src.replace(/\*/g, "×").replace(/-/g, "−"), ops };
  },
  draw({ src, ops }, lang) {
    const E = show(src);
    const out = [S(2, text(W / 2, 26, E, { cls: "fp-t fp-n" }))];
    const firstUsed = RUNGS.findIndex((r) => r.has(ops));
    const syms = { P: "( )", E: "xⁿ", "M D": "× ÷", "A S": "+ −" };
    RUNGS.forEach((r, i) => {
      const y = 44 + i * 40;
      const used = r.has(ops);
      const g = [
        rect(PAD + 40, y, 228, 32, used ? "fp-p" : "fp-g", 6),
        text(PAD + 58, y + 21, r.key, { cls: "fp-t fp-n" }),
        text(PAD + 92, y + 21, tr(lang, r.en, r.es), { anchor: "start" }),
        text(PAD + 254, y + 21, syms[r.key], { anchor: "end", cls: "fp-t fp-s" }),
      ];
      out.push(used ? g.join("") : `<g class="fp-off">${g.join("")}</g>`);
      if (i === firstUsed) out.push(S(3, rect(PAD + 280, y + 3, 50, 26, "fp-u", 6), text(PAD + 305, y + 21, tr(lang, "1st", "1.º"), { cls: "fp-t fp-q" })));
    });
    out.push(line(PAD + 20, 52, PAD + 20, 196, "fp-ln"), `<polygon class="fp-ink" points="${PAD + 20},204 ${PAD + 14},194 ${PAD + 26},194"/>`);
    const used = RUNGS.filter((r) => r.has(ops));
    return {
      title: { en: `Order of operations for ${E}`, es: `Orden de las operaciones para ${E}` },
      caption: {
        en: `The steps ${E} uses, top rung first`,
        es: `Los pasos que usa ${E}, empezando por el escalón de arriba`,
      },
      desc: {
        en: `A ladder: parentheses, exponents, multiply and divide, add and subtract. ${E} uses ${used.map((r) => r.en.toLowerCase()).join(", ")}; start with ${used[0].en.toLowerCase()}. The value is not shown.`,
        es: `Una escalera: paréntesis, exponentes, multiplicar y dividir, sumar y restar. ${E} usa ${used.map((r) => r.es.toLowerCase()).join(", ")}; empieza con ${used[0].es.toLowerCase()}. El valor no se muestra.`,
      },
      h: 212,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- one-step equation (bar model)

const P = String.raw`\d+(?:\.\d+)?`;
const EQ_NO = /first|which part|what do you do|both sides|which equation|which phrase|\bwrite\b|situation|each\b(?! (gets|pays))/i;
const EQ_FORMS = [
  [new RegExp(String.raw`(?<![\w.]|[+\-×÷*/=^] ?)\b([a-z]) \+ (${P}) = (${P})`, "g"), (m) => ({ op: "+", v: m[1], a: +m[2], b: +m[3] })],
  [new RegExp(String.raw`(?<![\w.]|[+\-×÷*/=^] ?)(${P}) \+ ([a-z]) = (${P})`, "g"), (m) => ({ op: "+", v: m[2], a: +m[1], b: +m[3], lead: true })],
  [new RegExp(String.raw`(?<![\w.]|[+\-×÷*/=^] ?)\b([a-z]) - (${P}) = (${P})`, "g"), (m) => ({ op: "-", v: m[1], a: +m[2], b: +m[3] })],
  [new RegExp(String.raw`(?<![\w.]|[+\-×÷*/=^] ?)(\d+)([a-z]) = (${P})`, "g"), (m) => ({ op: "×", v: m[2], a: +m[1], b: +m[3] })],
  [new RegExp(String.raw`(?<![\w.]|[+\-×÷*/=^] ?)\b([a-z]) (?:÷|/) (\d+) = (${P})`, "g"), (m) => ({ op: "÷", v: m[1], a: +m[2], b: +m[3] })],
];

const equation = {
  kind: "equation",
  match(s) {
    if (EQ_NO.test(s)) return null;
    const hits = [];
    for (const [re, mk] of EQ_FORMS)
      for (const m of s.matchAll(re)) {
        const after = s.slice(m.index + m[0].length);
        if (/^(\s*[+\-×÷*/^(]|[\d.,]\d|\s?[a-z])/i.test(after)) continue;
        hits.push(mk(m));
      }
    // A second equation of any shape (a two-step one, or another one-step one) makes the stem ambiguous.
    if (hits.length !== 1 || count(s, /=/g) - count(s, /\b[a-z] = \d+(\.\d+)?\b(?! ?[+\-×÷*/])/g) > 1) return null;
    const e = hits[0];
    if (!/^[a-z]$/.test(e.v)) return null;
    if (e.op === "+" && !(e.a > 0 && e.b > e.a)) return null;
    if ((e.op === "×" || e.op === "÷") && !(Number.isInteger(e.a) && e.a >= 2 && e.a <= 12)) return null;
    if (e.op === "×" && !Number.isInteger(e.b / e.a)) return null;
    if (e.op === "-" && !(e.a > 0 && e.b > 0)) return null;
    return e;
  },
  draw(e, lang) {
    const A = fmt(e.a);
    const B = fmt(e.b);
    const sym = { "+": "+", "-": "−", "×": "", "÷": " ÷ " }[e.op];
    const eq =
      e.op === "×"
        ? `${A}${e.v} = ${B}`
        : e.op === "+" && e.lead
          ? `${A} + ${e.v} = ${B}`
          : `${e.v}${e.op === "÷" ? sym : ` ${sym} `}${A} = ${B}`;
    const x0 = PAD;
    const bw = W - 2 * PAD;
    const y = 84;
    const bh = 46;
    const out = [S(2, text(W / 2, 22, eq, { cls: "fp-t fp-n" }))];
    const whole = (label, unknown) => {
      out.push(bracket(x0, x0 + bw, y - 8, -1));
      out.push(unknown ? S(3, qPill(W / 2, y - 26, `${e.v} = ?`)) : S(2, text(W / 2, y - 20, label, { cls: "fp-t fp-n" })));
    };
    const part = (x, w, label, unknown) => {
      const lab = w >= 18 ? text(x + w / 2, y + bh / 2 + 6, unknown && label === "?" ? `${e.v} = ?` : label, { cls: unknown ? "fp-t fp-q" : "fp-t fp-n" }) : "";
      if (unknown) out.push(rect(x, y, w, bh, "fp-g", 4), S(3, rect(x, y, w, bh, "fp-u", 4), lab));
      else out.push(rect(x, y, w, bh, "fp-p", 4), S(2, lab));
    };
    let cap;
    let desc;
    if (e.op === "+" || e.op === "-") {
      const total = e.op === "+" ? e.b : e.a + e.b;
      let wa = Math.max(70, Math.min(bw - 70, (bw * e.a) / total));
      if (e.op === "+") {
        whole(B, false);
        const first = e.lead ? [wa, A, false] : [bw - wa, e.v, true];
        const second = e.lead ? [bw - wa, e.v, true] : [wa, A, false];
        part(x0, first[0], first[1] === e.v ? "?" : first[1], first[2]);
        part(x0 + first[0], second[0], second[1] === e.v ? "?" : second[1], second[2]);
        cap = {
          en: `${eq}: the whole bar is ${B}; one part is ${A}, the other part is ${e.v}`,
          es: `${eq}: toda la barra es ${B}; una parte es ${A} y la otra parte es ${e.v}`,
        };
      } else {
        wa = Math.max(70, Math.min(bw - 70, (bw * e.a) / total));
        whole("", true);
        part(x0, wa, A, false);
        part(x0 + wa, bw - wa, B, false);
        out.push(S(2, text(x0 + wa / 2, y + bh + 26, tr(lang, "taken away", "se quitan"), { cls: "fp-t fp-s" })));
        out.push(S(2, text(x0 + wa + (bw - wa) / 2, y + bh + 26, tr(lang, "left", "quedan"), { cls: "fp-t fp-s" })));
        cap = {
          en: `${eq}: ${e.v} is the whole bar; it splits into ${A} taken away and ${B} left`,
          es: `${eq}: ${e.v} es toda la barra; se divide en ${A} que se quitan y ${B} que quedan`,
        };
      }
      desc = cap;
    } else {
      const k = e.a;
      const pw = bw / k;
      if (e.op === "×") {
        whole(B, false);
        for (let i = 0; i < k; i++) part(x0 + i * pw, pw, e.v, true);
        cap = {
          en: `${eq}: ${B} split into ${A} equal parts; each part is ${e.v}`,
          es: `${eq}: ${B} dividido en ${A} partes iguales; cada parte es ${e.v}`,
        };
      } else {
        whole("", true);
        for (let i = 0; i < k; i++) part(x0 + i * pw, pw, B, false);
        cap = {
          en: `${eq}: ${e.v} is the whole bar, made of ${A} equal parts of ${B}`,
          es: `${eq}: ${e.v} es toda la barra, formada por ${A} partes iguales de ${B}`,
        };
      }
      desc = cap;
    }
    return {
      title: { en: `Bar model for ${eq}`, es: `Modelo de barras para ${eq}` },
      caption: cap,
      desc: { en: `${desc.en}. The value of ${e.v} is the unknown.`, es: `${desc.es}. El valor de ${e.v} es la incógnita.` },
      h: y + bh + 38,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- fraction division

const FR = String.raw`\d+ \d+/\d+|\d+/\d+|\d+`;
const DIV_RE = new RegExp(String.raw`(?<![\d/.,])\(?(${FR})\)? ÷ \(?(${FR})\)?(?![\d/]|[.,]\d|\s\d+/)`, "g");
const DIV_NO = /which (question|statement|story|situation|multiplication|model)|\bmeans?\b|mistake|wrong|\bgot\b|writing|rewrite|same as|change ÷|keep, change|complete:|×|which expression|what does .* mean|explain/i;
const PARTITIVE = /\bwhole\b|\beach\b|share|equally|evenly|split|\bper\b/i;

const fracdiv = {
  kind: "fraction-division",
  match(s) {
    if (DIV_NO.test(s) || count(s, /÷/g) !== 1) return null;
    const ms = [...s.matchAll(DIV_RE)];
    if (ms.length !== 1) return null;
    const a = frac(ms[0][1]);
    const b = frac(ms[0][2]);
    if (!a || !b || (a.d === 1 && b.d === 1) || a.v <= 0 || b.v <= 0) return null;
    const W1 = Math.ceil(a.v - 1e-9);
    if (W1 > 10) return null;
    if (b.d === 1) {
      // Fraction ÷ whole number: equal sharing. Draw the dividend only; the share lines would draw the answer.
      if (b.v < 2 || b.v > 12 || a.d > 24 || W1 * a.d > 48) return null;
      return { a, b, mode: "share", k: a.d, W1 };
    }
    if (PARTITIVE.test(s) || b.v >= a.v) return null;
    const k = lcm(a.d, b.d);
    if (k > 24 || W1 * k > 48) return null;
    return { a, b, mode: "fit", k, W1 };
  },
  draw({ a, b, mode, k, W1 }, lang) {
    const A = a.text;
    const B = b.text;
    const x0 = PAD;
    const bw = W - 2 * PAD;
    const ww = bw / W1;
    const pw = ww / k;
    const y = mode === "fit" ? 64 : 40;
    const bh = 40;
    const shaded = (a.n * k) / a.d;
    const out = [S(2, text(W / 2, 22, `${A} ÷ ${B}`, { cls: "fp-t fp-n" }))];
    for (let i = 0; i < W1 * k; i++) out.push(rect(x0 + i * pw, y, pw, bh, "fp-g", 0));
    for (let i = 0; i < shaded; i++) out.push(S(2, rect(x0 + i * pw, y, pw, bh, "fp-p", 0)));
    for (let w = 0; w < W1; w++) out.push(rect(x0 + w * ww, y, ww, bh, "fp-ln", 2));
    // Only 0 and 1 are labelled: the unit is what matters, and a whole-number tick must never read as the answer.
    for (let w = 0; w <= Math.min(1, W1); w++) out.push(text(x0 + w * ww, y + bh + 18, String(w), { cls: "fp-t fp-s" }));
    out.push(S(2, bracket(x0, x0 + shaded * pw, y + bh + 26, 1), text(x0 + (shaded * pw) / 2, y + bh + 50, A, { cls: "fp-t fp-n" })));
    let cap;
    if (mode === "fit") {
      const g = (b.n * k) / b.d;
      out.push(S(2, bracket(x0, x0 + g * pw, y - 6, -1), text(clampX(x0 + (g * pw) / 2, textW(B)), y - 16, B, { cls: "fp-t fp-n" })));
      out.push(S(3, text(W / 2, y + bh + 80, tr(lang, `How many ${B}s fit?`, `¿Cuántos ${B} caben?`), { cls: "fp-t" }), qPill(W / 2, y + bh + 106)));
      cap = {
        en: `${A} ÷ ${B} asks how many ${B}s fit in ${A}`,
        es: `${A} ÷ ${B} pregunta cuántos ${B} caben en ${A}`,
      };
    } else {
      out.push(S(2, text(W / 2, y + bh + 76, tr(lang, `Split into ${B} equal shares.`, `Se reparte en ${B} partes iguales.`), { cls: "fp-t" })));
      out.push(S(3, text(W / 2, y + bh + 96, tr(lang, "How much is each share?", "¿Cuánto es cada parte?"), { cls: "fp-t" }), qPill(W / 2, y + bh + 122)));
      cap = {
        en: `${A} ÷ ${B} shares ${A} into ${B} equal parts`,
        es: `${A} ÷ ${B} reparte ${A} en ${B} partes iguales`,
      };
    }
    return {
      title: { en: `Fraction bar for ${A} ÷ ${B}`, es: `Barra de fracciones para ${A} ÷ ${B}` },
      caption: cap,
      desc: {
        en: `${cap.en}. The bar shows ${A} shaded, with each whole cut into ${k} equal pieces. The answer is the unknown.`,
        es: `${cap.es}. La barra muestra ${A} sombreado, con cada entero cortado en ${k} partes iguales. La respuesta es la incógnita.`,
      },
      h: y + bh + (mode === "fit" ? 126 : 142),
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- percent bar

const PC = String.raw`\d+(?:\.\d+)?`;

const percent = {
  kind: "percent",
  match(s) {
    if (count(s, /%/g) !== 1 || /estimate|about|round|off\b|discount|tip|tax|more|increase|decrease|which|sort|match/i.test(s))
      return null;
    let m = s.match(new RegExp(String.raw`(?<![\w.])\$?(${NUM}) (?:[a-z]+ )?(?:is|was) (${PC})% of (?:what|a number|the whole|the [a-z]+|her [a-z]+|his [a-z]+)`, "i"));
    if (m) return { p: +m[2], part: m[1].replace(/^-/, ""), whole: null, money: /\$/.test(s.slice(m.index, m.index + 2)) };
    m = s.match(new RegExp(String.raw`(?<![\w.])(${PC})% of \$?(${NUM})(?![\w]|[.,]\d)`, "i"));
    if (!m) return null;
    const others = [...s.matchAll(new RegExp(NUM, "g"))].filter((x) => x.index !== m.index && x.index !== m.index + m[0].length - m[2].length);
    if (others.length) return null;
    return { p: +m[1], part: null, whole: m[2], money: s.includes(`$${m[2]}`) };
  },
  draw({ p, part, whole, money }, lang) {
    if (p <= 0 || p > 300) return null;
    const $ = (v) => (money ? `$${v}` : v);
    const top = Math.max(100, p);
    const x0 = PAD + 10;
    const bw = W - 2 * PAD - 20;
    const X = (v) => x0 + (bw * v) / top;
    const y = 84;
    const out = [];
    out.push(rect(x0, y, X(100) - x0, 34, "fp-g", 2));
    out.push(S(2, rect(x0, y, X(p) - x0, 34, "fp-p", 2)));
    if (part === null) out.push(S(3, rect(x0, y, X(p) - x0, 34, "fp-u", 2)));
    if (whole === null) out.push(S(3, rect(x0, y, X(100) - x0, 34, "fp-u", 2)));
    const near = Math.abs(X(p) - X(100)) < 64;
    const ticks = [
      [0, "0", "0%"],
      [100, whole ? $(whole) : null, "100%"],
      [p, part ? $(part) : null, `${p}%`],
    ];
    for (const [v, q, pc] of ticks) {
      const x = X(v);
      out.push(line(x, y - 8, x, y + 42, "fp-ln"));
      const lift = v === p && near && p !== 100 ? 30 : 0;
      if (v === p && p === 100) continue;
      if (q === null) out.push(S(3, qPill(clampX(x, 34), y - 24 - lift)));
      else out.push(S(v === 0 ? 1 : 2, text(clampX(x, textW(q, 15)), y - 18 - lift, q, { cls: "fp-t fp-n" })));
      out.push(S(v === 0 ? 1 : 2, text(clampX(x, textW(pc)), y + 62 + (v === p && near ? 18 : 0), pc, { cls: "fp-t fp-ta fp-n" })));
    }
    const P = `${p}%`;
    const cap = part
      ? { en: `${$(part)} is ${P} of the whole; the whole (100%) is unknown`, es: `${$(part)} es el ${P} del total; el total (100%) es la incógnita` }
      : { en: `${P} of ${$(whole)}: the whole bar is ${$(whole)} = 100%`, es: `El ${P} de ${$(whole)}: toda la barra es ${$(whole)} = 100%` };
    return {
      title: { en: `Percent bar for ${P}`, es: `Barra de porcentaje para el ${P}` },
      caption: cap,
      desc: {
        en: `A bar from 0% to ${top}%. ${cap.en}. The bar is marked at ${P}; that amount is ${part ? "given" : "the unknown"}.`,
        es: `Una barra del 0% al ${top}%. ${cap.es}. La barra está marcada en el ${P}; esa cantidad ${part ? "es un dato" : "es la incógnita"}.`,
      },
      h: y + 92,
      body: out.join(""),
    };
  },
};

export { equation, fracdiv, percent };
export const ARITH = [power, order, equation, fracdiv, percent];

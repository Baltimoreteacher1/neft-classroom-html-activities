// "Picture it" recognizers for spread and balance: the box from Q1 to Q3 when the IQR is asked, the missing value
// that brings a set to a target mean, the mean absolute deviation of a data set with its mean marked, and one
// value's distance from the mean. Same contract as picture-arith.mjs: no IQR, missing value, MAD or distance drawn.

import { NUM, PAD, S, W, bracket, dot, fmt, line, num, qPill, rect, show, text, textW, tr } from "./picture-kit.mjs";

const SPREAD_NO = /which|compare|class [A-Z]\b|group [A-Z]\b|team [A-Z]\b|set [A-Z]\b(?! is)|city [A-Z]\b|both|two |sort|match|explain|outlier|student says|friend|percent|%|order the|then|increased|more consistent/i;
const LIST = String.raw`((?:(?:${NUM}), )*(?:${NUM}),? and (?:${NUM})|(?:(?:${NUM}), )+(?:${NUM}))`;
const listOf = (t) => t.split(/,? and |, /).map((x) => x.trim());
const allNums = (s) => (s.match(new RegExp(String.raw`(?<![\w.:])(?:${NUM})(?![\w:]|[.,]\d)`, "g")) || []).map(num);

/** A number line from lo to hi with readable integer ticks; returns { X, body }. */
function axis(lo, hi, y, x0 = PAD + 16, x1 = W - PAD - 16) {
  const span = hi - lo || 1;
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => span / s <= 8) ?? 100;
  const a = Math.floor(lo / step) * step;
  const b = Math.ceil(hi / step) * step;
  const X = (v) => x0 + ((x1 - x0) * (v - a)) / (b - a || 1);
  const out = [line(x0 - 6, y, x1 + 6, y)];
  for (let v = a; v <= b + 1e-9; v += step) out.push(line(X(v), y - 5, X(v), y + 5), text(X(v), y + 22, fmt(v), { cls: "fp-t fp-s" }));
  return { X, body: out.join("") };
}

// ---------------------------------------------------------------- IQR from Q1 and Q3

const iqr = {
  kind: "iqr",
  match(s) {
    if (SPREAD_NO.test(s) || !/\bIQR\b|interquartile|how wide is the box/i.test(s)) return null;
    const q1 = s.match(new RegExp(String.raw`\bQ1(?: =|:| is)? (${NUM})`));
    const q3 = s.match(new RegExp(String.raw`\bQ3(?: =|:| is)? (${NUM})`));
    if (!q1 || !q3 || allNums(s.replace(/\bQ[13]\b/g, "")).length !== 2 || !(num(q1[1]) < num(q3[1]))) return null;
    return { a: q1[1], b: q3[1] };
  },
  draw({ a, b }, lang) {
    const lo = num(a);
    const hi = num(b);
    const pad = (hi - lo) * 0.35 || 2;
    const y = 128;
    const { X, body } = axis(lo - pad, hi + pad, y);
    const out = [body];
    out.push(S(2, rect(X(lo), 62, X(hi) - X(lo), 36, "fp-p", 2), text(X(lo), 54, `Q1 = ${show(a)}`, { anchor: "end", cls: "fp-t fp-n" }), text(X(hi), 54, `Q3 = ${show(b)}`, { anchor: "start", cls: "fp-t fp-n" })));
    out.push(S(3, bracket(X(lo), X(hi), y + 34, 1), qPill((X(lo) + X(hi)) / 2, y + 56, "IQR = ?")));
    const cap = { en: `A box from Q1 = ${show(a)} to Q3 = ${show(b)}; the IQR, the width of the box, is unknown`, es: `Una caja de Q1 = ${show(a)} a Q3 = ${show(b)}; el rango intercuartil, el ancho de la caja, es la incógnita` };
    return {
      title: { en: "Box from Q1 to Q3", es: "Caja de Q1 a Q3" },
      caption: cap,
      desc: { en: `${cap.en}. The box holds the middle half of the data.`, es: `${cap.es}. La caja contiene la mitad central de los datos.` },
      h: y + 80,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- the missing value for a target mean

const COUNT = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
const ORD = { fourth: 4, fifth: 5, sixth: 6, third: 3 };

const meanTarget = {
  kind: "mean-target",
  match(s) {
    if (/which|explain|is the friend|student says|sort|match|total|in all/i.test(s)) return null;
    const lm = s.match(new RegExp(String.raw`(?:scored|ran|read|swam|are|were|of the numbers are|of them are|walked|earned) ${LIST}`));
    const mm = s.match(new RegExp(String.raw`\b(?:mean|average) (?:of|to be|is) (${NUM})\b`)) || s.match(new RegExp(String.raw`\bmean of (${NUM})\b`));
    if (!lm || !mm) return null;
    const known = listOf(lm[1]);
    if (known.length < 2 || known.length > 6) return null;
    // How many values in all: "over five games", "four numbers have", "mean of 3 numbers", "her 4th quiz".
    const w = String.raw`(\d+|two|three|four|five|six|seven)`;
    const cm =
      s.match(new RegExp(String.raw`\b(?:over|across|after|for) ${w} [a-z]+`, "i")) ||
      s.match(new RegExp(String.raw`^${w} numbers\b`, "i")) ||
      s.match(new RegExp(String.raw`\bmean of ${w} numbers\b`, "i")) ||
      s.match(/\b(\d+)(?:st|nd|rd|th) [a-z]+|\b(fourth|fifth|sixth|third)\b/i);
    if (!cm) return null;
    const c = cm[1] ? (COUNT[cm[1].toLowerCase()] ?? ORD[cm[1].toLowerCase()] ?? +cm[1]) : ORD[cm[2].toLowerCase()];
    if (c !== known.length + 1) return null;
    // Every number is a known value, the mean or the count.
    const extra = allNums(s.replace(lm[0], " ").replace(mm[0], " ").replace(cm[0], " "));
    if (extra.some((n) => n !== known.length && n !== c && n !== known.length + 1)) return null;
    const M = num(mm[1]);
    const missing = M * c - known.reduce((t, v) => t + num(v), 0);
    if (!(missing >= 0)) return null;
    return { known, M: mm[1], c };
  },
  draw({ known, M, c }, lang) {
    const vals = known.map(num);
    const top = Math.max(...vals, num(M)) * 1.18;
    const x0 = PAD + 30;
    const x1 = W - PAD - 6;
    const bw = (x1 - x0) / c;
    const yb = 178;
    const H = 130;
    const Y = (v) => yb - (H * v) / top;
    const out = [line(x0, yb, x1, yb), line(x0, yb, x0, yb - H - 4)];
    const g = vals.map((v, i) => [rect(x0 + i * bw + 8, Y(v), bw - 16, yb - Y(v), "fp-p", 2), text(x0 + i * bw + bw / 2, Y(v) - 6, show(known[i]), { cls: "fp-t fp-n" })].join(""));
    out.push(S(2, g));
    out.push(S(2, line(x0, Y(num(M)), x1, Y(num(M)), "fp-dash"), text(x0 + 4, Y(num(M)) - 6, tr(lang, `mean ${show(M)}`, `media ${show(M)}`), { anchor: "start", cls: "fp-t fp-s fp-ta" })));
    out.push(S(3, qPill(x0 + (c - 1) * bw + bw / 2, yb - 18)));
    const list = known.map(show).join(", ");
    const cap = { en: `${c} values: ${list} and one unknown value; the mean of all ${c} is ${show(M)}`, es: `${c} valores: ${list} y un valor desconocido; la media de los ${c} es ${show(M)}` };
    return {
      title: { en: "Values and their mean", es: "Valores y su media" },
      caption: cap,
      desc: { en: `${cap.en}. The dashed line marks the mean; the last bar is not drawn.`, es: `${cap.es}. La línea punteada marca la media; la última barra no se dibuja.` },
      h: yb + 18,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- MAD with the mean marked

const mad = {
  kind: "mad",
  match(s) {
    if (SPREAD_NO.test(s) || !/\bMAD\b|mean absolute deviation/i.test(s)) return null;
    const dv = s.match(new RegExp(String.raw`(?:absolute deviations|distances from the mean)(?: of [a-z ]+)? (?:are|of) ${LIST}`));
    const dm = s.match(new RegExp(String.raw`(?:are|is|swam|scored) ${LIST}(?: [a-z]+)?,? (?:and |with )?(?:the |a )?mean (?:is |of )?(${NUM})`)) || s.match(new RegExp(String.raw`(?:are|is) ${LIST}(?: [a-z]+)?\. The mean is (${NUM})`));
    if (dv && !dm) {
      const d = listOf(dv[1]);
      if (allNums(s).length !== d.length || d.length > 8) return null;
      return { dev: d };
    }
    if (dm && !dv) {
      const d = listOf(dm[1]);
      const m = dm[2];
      if (allNums(s).length !== d.length + 1 || d.length > 8) return null;
      const mean = d.reduce((t, v) => t + num(v), 0) / d.length;
      if (Math.abs(mean - num(m)) > 1e-9) return null;
      return { data: d, mean: m };
    }
    return null;
  },
  draw(r, lang) {
    const out = [];
    let cap;
    let h;
    if (r.dev) {
      const vals = r.dev.map(num);
      const top = Math.max(...vals, 1);
      const x0 = PAD + 20;
      const bw = W - 2 * PAD - 40;
      r.dev.forEach((t, i) => {
        const y = 40 + i * 22;
        out.push(S(2, line(x0, y, x0 + (bw * num(t)) / top || x0 + 2, y, "fp-ray"), text(x0 - 8, y + 5, show(t), { anchor: "end", cls: "fp-t fp-n" })));
      });
      h = 40 + r.dev.length * 22 + 30;
      out.push(S(3, text(W / 2 - 6, h - 6, "MAD =", { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 22, h - 11)));
      h += 12;
      cap = { en: `Absolute deviations ${r.dev.map(show).join(", ")}, drawn as lengths; the MAD, their mean, is unknown`, es: `Desviaciones absolutas ${r.dev.map(show).join(", ")}, dibujadas como longitudes; la DAM, su media, es la incógnita` };
    } else {
      const vals = r.data.map(num);
      const M = num(r.mean);
      const y = 150;
      const pad = (Math.max(...vals) - Math.min(...vals)) * 0.12 || 1;
      const { X, body } = axis(Math.min(...vals) - pad, Math.max(...vals) + pad, y);
      out.push(body);
      const seen = {};
      const g = [];
      const arrows = [];
      vals.forEach((v) => {
        seen[v] = (seen[v] || 0) + 1;
        const yy = y - 14 - (seen[v] - 1) * 16;
        g.push(dot(X(v), yy, 6));
        if (v !== M) arrows.push(line(X(v), 52 + Object.keys(seen).indexOf(String(v)) * 12, X(M), 52 + Object.keys(seen).indexOf(String(v)) * 12, "fp-ul"));
      });
      out.push(S(2, g, line(X(M), 40, X(M), y, "fp-dash"), text(X(M), 32, tr(lang, `mean ${show(r.mean)}`, `media ${show(r.mean)}`), { cls: "fp-t fp-s fp-ta" })));
      out.push(S(3, arrows, text(W / 2 - 6, y + 52, "MAD =", { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 22, y + 47)));
      h = y + 68;
      cap = { en: `Data ${r.data.map(show).join(", ")} with the mean ${show(r.mean)} marked; each value's distance to the mean is dashed and the MAD is unknown`, es: `Datos ${r.data.map(show).join(", ")} con la media ${show(r.mean)} marcada; la distancia de cada valor a la media está punteada y la DAM es la incógnita` };
    }
    return {
      title: { en: "Mean absolute deviation", es: "Desviación absoluta media" },
      caption: cap,
      desc: { en: `${cap.en}.`, es: `${cap.es}.` },
      h: Math.min(240, h),
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- one value's distance from the mean

const deviation = {
  kind: "deviation",
  match(s) {
    if (SPREAD_NO.test(s) || /\bMAD\b|every value|new mean/i.test(s)) return null;
    const m = s.match(new RegExp(String.raw`\bmean of (?:a|the) data set is (${NUM})\.`));
    const v = s.match(new RegExp(String.raw`(?:A value is|One value is|How far is the value) (${NUM})\b`));
    if (!m || !v || allNums(s).length !== 2 || !/absolute deviation|how far/i.test(s) || num(m[1]) === num(v[1])) return null;
    return { m: m[1], v: v[1] };
  },
  draw({ m, v }, lang) {
    const a = Math.min(num(m), num(v));
    const b = Math.max(num(m), num(v));
    const y = 120;
    const pad = (b - a) * 0.5;
    const { X, body } = axis(a - pad, b + pad, y);
    const out = [body];
    out.push(S(2, line(X(num(m)), 56, X(num(m)), y, "fp-dash"), text(X(num(m)), 48, tr(lang, `mean ${show(m)}`, `media ${show(m)}`), { cls: "fp-t fp-s fp-ta" }), dot(X(num(v)), y, 7), text(X(num(v)), y - 16, show(v), { cls: "fp-t fp-n" })));
    out.push(S(3, bracket(X(a), X(b), y + 34, 1), qPill((X(a) + X(b)) / 2, y + 56)));
    const cap = { en: `The mean ${show(m)} and the value ${show(v)} on a number line; the distance between them is unknown`, es: `La media ${show(m)} y el valor ${show(v)} en una recta numérica; la distancia entre ellos es la incógnita` };
    return {
      title: { en: "Distance from the mean", es: "Distancia a la media" },
      caption: cap,
      desc: { en: `${cap.en}.`, es: `${cap.es}.` },
      h: y + 80,
      body: out.join(""),
    };
  },
};

export const SPREAD = [iqr, meanTarget, mad, deviation];

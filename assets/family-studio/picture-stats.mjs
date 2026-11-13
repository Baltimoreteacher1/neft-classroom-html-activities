// "Picture it" recognizers for data summaries: a box plot from a given five-number summary, the range from a least
// and greatest value, and a histogram from given bar heights. Same contract as picture-arith.mjs: nothing the
// problem asks for is drawn, and a question whose answer is one of the drawn givens returns null.

import { NUM, PAD, S, W, bracket, dot, fmt, line, num, qPill, rect, show, text, textW, tr } from "./picture-kit.mjs";

const STATS_NO = /class [A-Z]\b|group [A-Z]\b|team [A-Z]\b|\btwo\b|which|both|sort|match|order the steps|between which|middle 50|what percent|percentage|compare|wider|outlier|explain|student|complete the table/i;

/** A number line from lo to hi with about 6 labelled ticks; returns { X, body }. */
function scale(lo, hi, y) {
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => (hi - lo) / s <= 8) ?? 100;
  const a = Math.floor(lo / step) * step;
  const b = Math.ceil(hi / step) * step;
  const x0 = PAD + 18;
  const x1 = W - PAD - 18;
  const X = (v) => x0 + ((x1 - x0) * (v - a)) / (b - a || 1);
  const out = [line(x0 - 6, y, x1 + 6, y, "fp-ln")];
  for (let v = a; v <= b + 1e-9; v += step) out.push(line(X(v), y - 5, X(v), y + 5, "fp-ln"), text(X(v), y + 22, fmt(v), { cls: "fp-t fp-s" }));
  return { X, body: out.join("") };
}

// ---------------------------------------------------------------- box plot from a five-number summary

const FIVE = [
  ["min", String.raw`(?:\bmin(?:imum)?|\bleast(?: value)?|\blowest(?: value)?)`],
  ["q1", String.raw`\bQ1`],
  ["med", String.raw`\bmedian`],
  ["q3", String.raw`\bQ3`],
  ["max", String.raw`(?:\bmax(?:imum)?|\bgreatest(?: value)?|\bhighest(?: value)?)`],
];

const boxPlot = {
  kind: "box-plot",
  match(s) {
    if (STATS_NO.test(s)) return null;
    const v = {};
    for (const [k, re] of FIVE) {
      const ms = [...s.matchAll(new RegExp(String.raw`${re}(?: =| of| is|:)? (${NUM})(?![\w]|[.,]\d)`, "gi"))];
      if (ms.length !== 1) return null;
      v[k] = ms[0][1];
    }
    if ((s.match(new RegExp(String.raw`(?<![\w.])${NUM}`, "g")) || []).length !== 5) return null;
    const n = FIVE.map(([k]) => num(v[k]));
    if (n.some((x, i) => i && x < n[i - 1])) return null;
    const ask = /\bIQR\b|interquartile/i.test(s) ? "iqr" : /\brange\b/i.test(s) ? "range" : null;
    if (!ask) return null;
    return { v, n, ask };
  },
  draw({ v, n, ask }, lang) {
    const y = 128;
    const { X, body } = scale(n[0], n[4], y);
    const out = [body];
    const by = 62;
    const bh = 34;
    const g = [
      line(X(n[0]), by + bh / 2, X(n[1]), by + bh / 2, "fp-ln"),
      line(X(n[3]), by + bh / 2, X(n[4]), by + bh / 2, "fp-ln"),
      line(X(n[0]), by + 8, X(n[0]), by + bh - 8, "fp-ln"),
      line(X(n[4]), by + 8, X(n[4]), by + bh - 8, "fp-ln"),
      rect(X(n[1]), by, X(n[3]) - X(n[1]), bh, "fp-p", 2),
      line(X(n[2]), by, X(n[2]), by + bh, "fp-ln"),
    ];
    // Labels above the plot, alternating rows when two would touch.
    let lastX = -1e9;
    let row = 0;
    FIVE.forEach(([k], i) => {
      const t = show(v[k]);
      const x = X(n[i]);
      row = x - lastX < textW(t, 15) + 4 ? 1 - row : 0;
      lastX = x;
      g.push(text(x, by - 10 - row * 18, t, { cls: "fp-t fp-n" }));
    });
    out.push(S(2, g));
    const word = ask === "iqr" ? "IQR" : tr(lang, "Range", "Rango");
    out.push(S(3, text(W / 2 - 4, y + 56, `${word} =`, { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 18, y + 51)));
    const list = FIVE.map(([k]) => show(v[k])).join(", ");
    const cap = {
      en: `Box plot of ${list} (least, Q1, median, Q3, greatest); the ${ask === "iqr" ? "IQR" : "range"} is unknown`,
      es: `Diagrama de caja de ${list} (mínimo, Q1, mediana, Q3, máximo); ${ask === "iqr" ? "el rango intercuartil" : "el rango"} es la incógnita`,
    };
    return {
      title: { en: "Box plot", es: "Diagrama de caja" },
      caption: cap,
      desc: { en: `${cap.en}. The box runs from Q1 to Q3 with a line at the median.`, es: `${cap.es}. La caja va de Q1 a Q3, con una línea en la mediana.` },
      h: y + 72,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- range from the least and greatest values

const range = {
  kind: "range",
  match(s) {
    if (STATS_NO.test(s) || !/what is the range/i.test(s)) return null;
    const lo = s.match(new RegExp(String.raw`(?:least value of|low of|lowest value of|smallest value of) (${NUM})`, "i"));
    const hi = s.match(new RegExp(String.raw`(?:greatest value of|high of|highest value of|largest value of) (${NUM})`, "i"));
    if (!lo || !hi || (s.match(new RegExp(String.raw`(?<![\w.])${NUM}`, "g")) || []).length !== 2) return null;
    if (!(num(lo[1]) < num(hi[1]))) return null;
    return { lo: lo[1], hi: hi[1] };
  },
  draw({ lo, hi }, lang) {
    const y = 96;
    const a = num(lo);
    const b = num(hi);
    const pad = (b - a) * 0.15 || 1;
    const { X, body } = scale(a - pad, b + pad, y);
    const out = [body];
    out.push(S(2, dot(X(a), y, 6), dot(X(b), y, 6), text(X(a), y - 16, show(lo), { cls: "fp-t fp-n" }), text(X(b), y - 16, show(hi), { cls: "fp-t fp-n" })));
    out.push(S(3, bracket(X(a), X(b), y - 36, -1), qPill((X(a) + X(b)) / 2, y - 56)));
    const cap = { en: `The least value ${show(lo)} and the greatest value ${show(hi)}; the range between them is unknown`, es: `El valor mínimo ${show(lo)} y el valor máximo ${show(hi)}; el rango entre ellos es la incógnita` };
    return {
      title: { en: "Range on a number line", es: "Rango en una recta numérica" },
      caption: cap,
      desc: { en: `${cap.en}. The range is the distance from least to greatest.`, es: `${cap.es}. El rango es la distancia del mínimo al máximo.` },
      h: y + 40,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- histogram from given bar heights

const histogram = {
  kind: "histogram",
  match(s) {
    if (STATS_NO.test(s) || !/how many (?:values|players|students|data values)?[^?]*(?:in all|total|in the data set|does it show|represented)|how many values does it show/i.test(s)) return null;
    if (/peak|tallest|shape|skew|interval does|belong/i.test(s)) return null;
    let heights = null;
    let bins = null;
    const hm = s.match(new RegExp(String.raw`bars of height ((?:\d+, )+(?:and )?\d+)`, "i"));
    if (hm) {
      heights = hm[1].split(/, (?:and )?/).map(Number);
      const om = s.match(/over ((?:\d+–\d+, )+(?:and )?\d+–\d+)/);
      if (om) bins = om[1].split(/, (?:and )?/);
    } else {
      const fm = [...s.matchAll(/(\d+–\d+): (\d+)(?: [a-z]+)?/g)];
      if (fm.length >= 2) {
        bins = fm.map((m) => m[1]);
        heights = fm.map((m) => +m[2]);
      }
    }
    if (!heights || heights.length < 2 || heights.length > 8 || (bins && bins.length !== heights.length)) return null;
    if (Math.max(...heights) > 20) return null;
    // Every number is a bar height or an interval end.
    const rest = s.replace(/\d+–\d+/g, " ");
    const nums = (rest.match(/(?<![\w.])\d+(?![\w.])/g) || []).map(Number);
    if (nums.length !== heights.length) return null;
    return { heights, bins };
  },
  draw({ heights, bins }, lang) {
    const n = heights.length;
    const top = Math.max(...heights);
    const x0 = PAD + 30;
    const x1 = W - PAD - 10;
    const bw = (x1 - x0) / n;
    const yb = 150;
    const H = 110;
    const out = [line(x0, yb, x1, yb, "fp-ln"), line(x0, yb, x0, yb - H - 6, "fp-ln")];
    const g = [];
    heights.forEach((h, i) => {
      const bh = (H * h) / top;
      g.push(rect(x0 + i * bw, yb - bh, bw, bh, "fp-p", 0), text(x0 + i * bw + bw / 2, yb - bh - 6, String(h), { cls: "fp-t fp-n" }));
    });
    if (bins) bins.forEach((b, i) => out.push(text(x0 + i * bw + bw / 2, yb + 20, b, { cls: "fp-t fp-s" })));
    out.push(S(2, g));
    out.push(S(3, text(W / 2 - 4, yb + 50, tr(lang, "Total =", "Total ="), { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 18, yb + 45)));
    const list = heights.join(", ");
    const cap = { en: `A histogram with bar heights ${list}; the total count is unknown`, es: `Un histograma con barras de altura ${list}; el total de datos es la incógnita` };
    return {
      title: { en: "Histogram", es: "Histograma" },
      caption: cap,
      desc: { en: `${cap.en}. Each bar's height is how many values fall in its interval.`, es: `${cap.es}. La altura de cada barra es cuántos valores caen en su intervalo.` },
      h: yb + 66,
      body: out.join(""),
    };
  },
};

export const STATS = [boxPlot, range, histogram];

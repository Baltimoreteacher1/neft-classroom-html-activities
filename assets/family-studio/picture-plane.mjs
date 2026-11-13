// "Picture it" recognizers for stems that live on a line or a grid: coordinate points, numbers to compare or order,
// a one-variable inequality, and a data list (dot plot). Same contract as picture-arith.mjs.

import {
  NUM,
  PAD,
  S,
  W,
  arrow,
  dot,
  fmt,
  frac,
  line,
  n1,
  num,
  qPill,
  rect,
  show,
  text,
  textW,
  tr,
} from "./picture-kit.mjs";

/** A horizontal number line from x0 to x1 at y with arrow ends; ticks = [{ x, label }]. */
function axis(x0, x1, y, ticks, { labels = true } = {}) {
  const out = [line(x0 - 8, y, x1 + 8, y, "fp-ln"), arrow(x1 + 14, y, 1), arrow(x0 - 14, y, -1)];
  for (const t of ticks) {
    out.push(line(t.x, y - 7, t.x, y + 7, "fp-ln"));
    if (labels && t.label !== undefined) out.push(text(t.x, y + 26, t.label, { cls: "fp-t fp-s" }));
  }
  return out.join("");
}

/** Integer-ish tick step so a span fits in at most `max` ticks. */
function niceStep(span, max) {
  for (const s of [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) if (span / s <= max) return s;
  return null;
}

// ---------------------------------------------------------------- coordinate points

const PT = String.raw`(?:\b([A-Z]) ?)?\((${NUM}), ?(${NUM})\)`;
const COORD_NO = /quadrant|horizontal|vertical|sign|how do you plot|tell you|same point|student|which way|how do you (move|reach|get)|farther|closer|longer|shorter|farthest|closest|steeper|higher|lower|greater|less|sort|match|order|which (point|ordered pair|coordinate)|reflect.*both|\(\s*\d+\s*,\s*\?\s*\)/i;

const coord = {
  kind: "coordinates",
  match(s) {
    if (COORD_NO.test(s)) return null;
    const pts = [];
    for (const m of s.matchAll(new RegExp(PT, "g"))) {
      if (m[2].includes(",") || m[3].includes(",")) return null;
      const x = num(m[2]);
      const y = num(m[3]);
      if (![x, y].every((v) => Number.isFinite(v) && Math.abs(v) <= 10 && Number.isInteger(v * 4))) return null;
      if (!pts.some((p) => p.x === x && p.y === y)) pts.push({ x, y, name: m[1] || "", sx: show(m[2]), sy: show(m[3]) });
    }
    if (pts.length < 1 || pts.length > 4) return null;
    const dist = /distance|how far|apart|length of the side|how long/i.test(s) && !/from the [xy]-axis/i.test(s);
    if (dist && !(pts.length === 2 && (pts[0].x === pts[1].x || pts[0].y === pts[1].y))) return null;
    return { pts, dist };
  },
  draw({ pts, dist }, lang) {
    // The grid is cropped to the points (plus one unit), stretched to include the axes when they are close, so the
    // points fill the frame instead of sitting in a corner of a fixed −10..10 grid.
    const [x0, x1] = span(pts.map((p) => p.x));
    const [y0, y1] = span(pts.map((p) => p.y));
    const tag = (p, i) => p.name || String(i + 1);
    const named = pts.length > 1 || pts[0].name;
    const labels = pts.map((p, i) => `${named ? `${tag(p, i)}  ` : ""}(${p.sx}, ${p.sy})`);
    const legendW = Math.max(...labels.map((l) => textW(l, 15))) + 18;
    const gx = PAD + 30;
    const gy = 14;
    const room = Math.min(196, W - PAD - gx - 22 - legendW);
    const c = Math.min(room / (x1 - x0), 196 / (y1 - y0), 40);
    const gw = (x1 - x0) * c;
    const gh = (y1 - y0) * c;
    const X = (v) => gx + (v - x0) * c;
    const Y = (v) => gy + (y1 - v) * c;
    const out = [];
    for (let v = x0; v <= x1; v++) out.push(line(X(v), gy, X(v), gy + gh, "fp-gr"));
    for (let v = y0; v <= y1; v++) out.push(line(gx, Y(v), gx + gw, Y(v), "fp-gr"));
    const hasX = y0 <= 0 && y1 >= 0;
    const hasY = x0 <= 0 && x1 >= 0;
    if (hasX) out.push(line(gx, Y(0), gx + gw, Y(0), "fp-ax"), text(gx + gw + 6, Y(0) + 5, "x", { anchor: "start", cls: "fp-t fp-s" }));
    if (hasY) out.push(line(X(0), gy, X(0), gy + gh, "fp-ax"), text(X(0) + 6, gy + 12, "y", { anchor: "start", cls: "fp-t fp-s" }));
    // Tick labels: every k-th whole number, k chosen so labels stay apart at 13px; on the axis when it is drawn,
    // otherwise along the bottom / left edge of the grid.
    const k = [1, 2, 5, 10].find((t) => t * c >= 26) ?? 10;
    const lx = hasX ? Y(0) + 17 : gy + gh + 17;
    const ly = hasY ? X(0) - 4 : gx - 4;
    for (let v = x0; v <= x1; v++) if (v % k === 0 && !(v === 0 && hasY)) out.push(text(X(v), lx, fmt(v), { cls: "fp-t fp-s" }));
    for (let v = y0; v <= y1; v++) if (v % k === 0 && !(v === 0 && hasX)) out.push(text(ly, Y(v) + 5, fmt(v), { anchor: "end", cls: "fp-t fp-s" }));
    if (hasX && hasY) out.push(text(X(0) - 4, Y(0) + 17, "0", { anchor: "end", cls: "fp-t fp-s" }));
    if (dist) {
      const [a, b] = pts;
      const mx = (X(a.x) + X(b.x)) / 2;
      const my = (Y(a.y) + Y(b.y)) / 2;
      const pill = a.y === b.y ? qPill(mx, my + (my - gy < 40 ? 22 : -20)) : qPill(mx + 24, my);
      out.push(S(3, line(X(a.x), Y(a.y), X(b.x), Y(b.y), "fp-ul"), pill));
    }
    pts.forEach((p, i) => {
      out.push(S(2, dot(X(p.x), Y(p.y), 5.5)));
      if (named) out.push(S(2, text(X(p.x) + 9, Y(p.y) - 7, tag(p, i), { anchor: "start", cls: "fp-t fp-n fp-ta" })));
    });
    const legX = gx + gw + 22;
    pts.forEach((p, i) => {
      const y = 36 + i * 34;
      out.push(S(2, dot(legX + 6, y - 5, 5.5), text(legX + 18, y, labels[i], { anchor: "start", cls: "fp-t fp-n" })));
    });
    const list = pts.map((p) => `(${p.sx}, ${p.sy})`).join(", ");
    const cap = dist
      ? { en: `The points ${list}; the distance between them is the unknown`, es: `Los puntos ${list}; la distancia entre ellos es la incógnita` }
      : pts.length === 1
        ? { en: `The point ${list} on the coordinate grid`, es: `El punto ${list} en el plano de coordenadas` }
        : { en: `The points ${list} on the coordinate grid`, es: `Los puntos ${list} en el plano de coordenadas` };
    return {
      title: { en: "Points on a coordinate grid", es: "Puntos en un plano de coordenadas" },
      caption: cap,
      desc: {
        en: `A coordinate grid with x from ${fmt(x0)} to ${fmt(x1)} and y from ${fmt(y0)} to ${fmt(y1)}. ${cap.en}.`,
        es: `Un plano de coordenadas con x de ${fmt(x0)} a ${fmt(x1)} e y de ${fmt(y0)} a ${fmt(y1)}. ${cap.es}.`,
      },
      h: Math.max(gy + gh + 26, 36 + pts.length * 34),
      body: out.join(""),
    };
  },
};

/**
 * Whole-number range around the values: one unit of margin, always reaching 0 (points are counted from the origin and
 * every point is within 10 of it), at least 4 units wide. Empty quadrants are cropped away.
 */
function span(vs) {
  let a = Math.min(0, Math.floor(Math.min(...vs)) - 1);
  let b = Math.max(0, Math.ceil(Math.max(...vs)) + 1);
  if (Math.min(...vs) >= 0) a = 0;
  if (Math.max(...vs) <= 0) b = 0;
  while (b - a < 4) {
    if (a > 0) a--;
    else b++;
  }
  return [a, b];
}

// ---------------------------------------------------------------- compare / order a list of numbers

const VAL = String.raw`-?\d+ \d+/\d+|-?\d+/\d+|${NUM}`;
const LIST_RE = new RegExp(String.raw`(?:^|[:\s(])((?:(?:${VAL})(?: ?%| ?°| ?(?:ft|m|meters|feet))?(?:, | or |, or |, and | and )){1,7}(?:${VAL})(?: ?%| ?°| ?(?:ft|m|meters|feet))?)(?=[\s.?)]|$)`, "g");

const compare = {
  kind: "compare",
  match(s) {
    if (/divide|multiple|factor|both|common/i.test(s)) return null;
    if (!/\b(order|least|greatest|greater|less|smaller|smallest|larger|largest|compare)\b/i.test(s)) return null;
    if (/absolute|\||sort|drag|match|student|explain|opposite|distance|ratio|per\b|\bof\b|\$|×|÷|\+|=|\(\s*-?\d/i.test(s)) return null;
    const lists = [...s.matchAll(LIST_RE)];
    if (lists.length !== 1) return null;
    const items = lists[0][1].split(/, or |, and |, | or | and /).map((t) => t.trim());
    if (items.length < 2 || items.length > 6) return null;
    const vals = [];
    for (const it of items) {
      const pc = /%$/.test(it);
      const core = it.replace(/ ?(%|°|ft|m|meters|feet)$/, "");
      const f = frac(core);
      if (!f) return null;
      vals.push({ v: pc ? f.v / 100 : f.v, label: show(it.replace(/ (?=%)/, "")), pc });
    }
    // Numbers elsewhere in the stem (a second list, a context number) make the target ambiguous.
    const rest = s.replace(lists[0][1], "");
    if (new RegExp(NUM).test(rest.replace(/\b\d+(st|nd|rd|th)\b/g, ""))) return null;
    if (new Set(vals.map((x) => x.v)).size !== vals.length) return null;
    const lo = Math.min(...vals.map((x) => x.v));
    const hi = Math.max(...vals.map((x) => x.v));
    // An evenly padded line: an end tick never sits exactly on the least or greatest card.
    if (lo >= 0 && hi <= 1) return { vals, a: 0, b: 1, step: 0.1 };
    for (const u of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) {
      const a = (Math.floor(lo / u) - 1) * u;
      const b = (Math.ceil(hi / u) + 1) * u;
      if ((b - a) / u <= 12) return { vals, a, b, step: u };
    }
    return null;
  },
  draw({ vals, a, b, step }, lang) {
    const x0 = PAD + 20;
    const x1 = W - PAD - 20;
    const ticks = [];
    const n = Math.round((b - a) / step);
    const every = n > 10 ? 2 : 1;
    for (let i = 0; i <= n; i++) {
      const v = a + i * step;
      ticks.push({ x: x0 + ((x1 - x0) * i) / n, label: i % every === 0 || Math.abs(v) < 1e-9 ? fmt(v) : undefined });
    }
    const out = [];
    const cw = Math.min(76, (W - 2 * PAD) / vals.length - 8);
    const total = vals.length * (cw + 8) - 8;
    vals.forEach((it, i) => {
      const x = (W - total) / 2 + i * (cw + 8);
      out.push(S(2, rect(x, 16, cw, 34, "fp-p", 6), text(x + cw / 2, 39, it.label, { cls: "fp-t fp-n" })));
    });
    out.push(S(3, text(W / 2, 80, tr(lang, "Where does each number go?", "¿Dónde va cada número?"), { cls: "fp-t fp-s" })));
    out.push(axis(x0, x1, 112, ticks));
    const list = vals.map((x) => x.label).join(", ");
    return {
      title: { en: "Numbers to place on a number line", es: "Números para ubicar en una recta numérica" },
      caption: {
        en: `A number line from ${fmt(a)} to ${fmt(b)} to place ${list}`,
        es: `Una recta numérica de ${fmt(a)} a ${fmt(b)} para ubicar ${list}`,
      },
      desc: {
        en: `Number cards ${list} above an empty number line from ${fmt(a)} to ${fmt(b)}. The cards are not placed yet.`,
        es: `Tarjetas con los números ${list} sobre una recta numérica vacía de ${fmt(a)} a ${fmt(b)}. Las tarjetas todavía no están ubicadas.`,
      },
      h: 150,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- inequality on a number line

const INEQ_NO = /graph|draw|circle|shad|number line|open|closed|arrow|which way|sort|match|quadrant/i;

const inequality = {
  kind: "inequality",
  match(s) {
    if (INEQ_NO.test(s)) return null;
    const all = [...s.matchAll(/(?:<|>|≤|≥)/g)];
    if (all.length !== 1) return null;
    const m = s.match(new RegExp(String.raw`(?<![\w.]|[+\-×÷*/=^] ?)\b([a-z]) (<|>|≤|≥) (${NUM})(?![\w]|[.,]\d| ?[+\-×÷*/^])`));
    if (!m) return null;
    const b = num(m[3]);
    if (!Number.isFinite(b) || Math.abs(b) > 10000 || !Number.isInteger(b * 2)) return null;
    return { v: m[1], op: m[2], b, bs: show(m[3]) };
  },
  draw({ v, op, b, bs }, lang) {
    const step = Math.abs(b) >= 100 ? 5 : 1;
    const a = b - 5 * step;
    const x0 = PAD + 24;
    const x1 = W - PAD - 24;
    const X = (t) => x0 + ((x1 - x0) * (t - a)) / (10 * step);
    const ticks = [];
    for (let i = 0; i <= 10; i++) {
      const t = a + i * step;
      const lab = Math.abs(t) >= 1000 ? i % 5 === 0 : i % (Math.abs(t) >= 100 ? 2 : 1) === 0;
      ticks.push({ x: X(t), label: lab ? fmt(t) : undefined });
    }
    const right = op === ">" || op === "≥";
    const closed = op === "≤" || op === "≥";
    const y = 70;
    const out = [S(2, text(W / 2, 26, `${v} ${op} ${bs}`, { cls: "fp-t fp-n" })), axis(x0, x1, y, ticks)];
    const end = right ? x1 + 6 : x0 - 6;
    out.push(S(3, line(X(b), y, end, y, "fp-ray"), arrow(right ? x1 + 14 : x0 - 14, y, right ? 1 : -1, "fp-dot"), `<circle class="${closed ? "fp-dot" : "fp-open"}" cx="${n1(X(b))}" cy="${y}" r="7"/>`));
    const word = {
      ">": ["greater than", "mayores que"],
      "<": ["less than", "menores que"],
      "≥": ["greater than or equal to", "mayores o iguales que"],
      "≤": ["less than or equal to", "menores o iguales que"],
    }[op];
    const cap = {
      en: `${v} ${op} ${bs}: every number ${word[0]} ${bs}`,
      es: `${v} ${op} ${bs}: todos los números ${word[1]} ${bs}`,
    };
    return {
      title: { en: `Number line for ${v} ${op} ${bs}`, es: `Recta numérica para ${v} ${op} ${bs}` },
      caption: cap,
      desc: {
        en: `${cap.en}. ${closed ? "A closed" : "An open"} circle at ${bs} and a ray to the ${right ? "right" : "left"}.`,
        es: `${cap.es}. Un círculo ${closed ? "cerrado" : "abierto"} en ${bs} y un rayo hacia la ${right ? "derecha" : "izquierda"}.`,
      },
      h: 112,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- data list -> dot plot

const DATA_LIST = new RegExp(String.raw`(?:^|[:\s(])((?:\$?(?:${NUM})(?:, |, and | and )){2,14}\$?(?:${NUM}))(?=[\s.?)]|$)`, "g");
const DATA_NO = /which (number|value|data value) is (an|the) outlier|outlier\?|\bmode\b|wants|need|fourth|fifth|day 4|game 5|set [a-z]\b|team [a-z]\b|\b[A-Z][a-z]+'s (quiz )?scores are .* [A-Z][a-z]+'s|distances from|deviation|interval|histogram|sort|match|both|five-number|\bis \d+(\.\d+)?\b.*\bmean\b|mean is|median is|mean of \d+(\.\d+)? (over|after|across)/i;

const data = {
  kind: "dot-plot",
  match(s) {
    if (DATA_NO.test(s)) return null;
    if (!/\b(median|mean|average|range|MAD|IQR|Q1|Q3|quartile|typical|spread|outlier|middle)\b/i.test(s)) return null;
    const lists = [...s.matchAll(DATA_LIST)];
    if (lists.length !== 1) return null;
    const toks = lists[0][1].split(/, and |, | and /);
    const vals = toks.map((t) => num(t.replace("$", "")));
    if (vals.length < 3 || vals.length > 15 || vals.some((v) => !Number.isFinite(v) || v < 0)) return null;
    const labels = new Map(toks.map((t, i) => [vals[i], show(t.startsWith("$") ? t : t.replace(/^\$/, ""))]));
    return { vals, labels };
  },
  draw({ vals, labels }, lang) {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const x0 = PAD + 22;
    const x1 = W - PAD - 22;
    const X = (v) => (hi === lo ? (x0 + x1) / 2 : x0 + ((x1 - x0) * (v - lo)) / (hi - lo));
    const counts = new Map();
    for (const v of vals) counts.set(v, (counts.get(v) || 0) + 1);
    const tall = Math.max(...counts.values());
    const r = 6;
    const y = 40 + tall * 15;
    const keys = [...counts.keys()].sort((p, q) => p - q);
    // Label each distinct value under its stack when the labels fit; otherwise only the least and greatest.
    const lab = (v) => labels.get(v);
    let fit = true;
    for (let i = 1; i < keys.length; i++) if (X(keys[i]) - X(keys[i - 1]) < (textW(lab(keys[i]), 13) + textW(lab(keys[i - 1]), 13)) / 2 + 2) fit = false;
    const ticks = keys.map((v, i) => ({ x: X(v), label: fit || i === 0 || i === keys.length - 1 ? lab(v) : undefined }));
    const out = [axis(x0, x1, y, ticks)];
    for (const [v, k] of counts) for (let j = 0; j < k; j++) out.push(S(2, dot(X(v), y - 14 - j * 15, r)));
    const list = vals.map(lab).join(", ");
    return {
      title: { en: "Dot plot of the data", es: "Diagrama de puntos de los datos" },
      caption: { en: `Each dot is one value: ${list}`, es: `Cada punto es un valor: ${list}` },
      desc: {
        en: `A dot plot of ${vals.length} values from ${lab(lo)} to ${lab(hi)}: ${list}. No summary number is shown.`,
        es: `Un diagrama de puntos de ${vals.length} valores, de ${lab(lo)} a ${lab(hi)}: ${list}. No se muestra ningún resumen.`,
      },
      h: y + 40,
      body: out.join(""),
    };
  },
};

export const PLANE = [coord, compare, inequality, data];

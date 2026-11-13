// "Picture it" recognizers for a few recurring story shapes: a medicine dose that needs a pounds-to-kilograms step
// (a triple number line), a whole with one known part (a part-whole bar), a count rate scaled up ("5 points for each
// game; 6 games"), an estimated percent of a number, and a box given by its base area and height. Same contract as
// picture-arith.mjs: no converted weight, dose, missing part, scaled amount, estimate or volume is drawn.

import { percent } from "./picture-arith.mjs";
import { NUM, PAD, S, W, bracket, count, line, num, qPill, rect, show, text, tr } from "./picture-kit.mjs";

const N = String.raw`(?:${NUM})`;
const nums = (s) => count(s, new RegExp(String.raw`(?<![\w.])${N}(?![\w]|[.,]\d)`, "g"));

// ---------------------------------------------------------------- dose: pounds -> kilograms -> milligrams

const DOSE_NO = /which|first|why|explain|student|package|sort|match/i;

const dose = {
  kind: "dose",
  match(s) {
    if (DOSE_NO.test(s) || !/how (?:much|many)/i.test(s)) return null;
    const w = s.match(new RegExp(String.raw`weighs (${N}) (?:pounds|lb)`));
    const d = s.match(new RegExp(String.raw`dose is (${N}) mg (?:for every|per) (?:1 )?(?:kg|kilogram)`));
    const k = s.match(new RegExp(String.raw`1 kg ≈ (${N}) (?:lbs?|pounds)`));
    if (!w || !d || !k || nums(s) !== 4 + (/for every 1 /.test(s) ? 1 : 0)) return null;
    return { w: w[1], d: d[1], k: k[1] };
  },
  draw({ w, d, k }, lang) {
    const x0 = 100;
    const x1 = W - PAD - 24;
    const xs = [x0, x0 + (x1 - x0) * 0.28, x1];
    const rows = [
      [46, tr(lang, "pounds", "libras"), ["0", show(k), show(w)]],
      [112, "kg", ["0", "1", "?"]],
      [178, "mg", ["0", show(d), "?"]],
    ];
    const out = [];
    for (const [y, name, labs] of rows) {
      out.push(line(x0, y, x1, y), text(PAD, y + 5, name, { anchor: "start", cls: "fp-t fp-s" }));
      labs.forEach((t, i) => {
        out.push(line(xs[i], y - 7, xs[i], y + 7));
        if (t === "?") out.push(S(3, qPill(xs[i], y + 22)));
        else out.push(S(i === 0 ? 1 : 2, text(xs[i], y - 13, t, { cls: "fp-t fp-n" })));
      });
    }
    out.push(line(xs[1], 56, xs[1], 166, "fp-dash"), line(xs[2], 56, xs[2], 96, "fp-dash"));
    const cap = {
      en: `1 kg ≈ ${show(k)} lb and the dose is ${show(d)} mg for each kg; the weight is ${show(w)} lb. The weight in kg and the dose are unknown`,
      es: `1 kg ≈ ${show(k)} lb y la dosis es de ${show(d)} mg por cada kg; el peso es de ${show(w)} lb. El peso en kg y la dosis son la incógnita`,
    };
    return {
      title: { en: "Triple number line", es: "Recta numérica triple" },
      caption: cap,
      desc: { en: `${cap.en}. Pounds, kilograms and milligrams line up column by column.`, es: `${cap.es}. Las libras, los kilogramos y los miligramos se alinean columna por columna.` },
      h: 218,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- whole and one part (part-whole bar)

const PW = [
  // "A bottle held 40 ounces. Some water was drunk, and 15 ounces are left. How many ounces were drunk?"
  [new RegExp(String.raw`^A [a-z]+ (?:held|had|holds|has) (${N}) ([a-z]+)\. Some [a-z ]+, and (${N}) \2 (?:are|were) left\. How many \2 were ([a-z]+)\?$`), (m) => ({ whole: m[1], part: m[3], partEn: "left", partEs: "quedan", askEn: m[4], askEs: "la otra parte" })],
  // "The target total is 60 and you already have 45. How much more do you need?"
  [new RegExp(String.raw`^The target total is (${N}) and you already have (${N})\. How much more do you need\?$`), (m) => ({ whole: m[1], part: m[2], partEn: "have", partEs: "ya tienes", askEn: "still needed", askEs: "lo que falta" })],
  // "A sapling is 4 m tall and will stop growing at 10 m. How much more will it grow?"
  [new RegExp(String.raw`^A [a-z]+ is (${N}) (m|cm|feet) tall and will stop growing at (${N}) \2\. How much more will it grow\?$`), (m) => ({ whole: m[3], part: m[1], unit: m[2], partEn: "now", partEs: "ahora", askEn: "still to grow", askEs: "lo que falta crecer" })],
];

const partWhole = {
  kind: "part-whole",
  match(s) {
    for (const [re, mk] of PW) {
      const m = s.match(re);
      if (m) {
        const r = mk(m);
        if (!(num(r.part) < num(r.whole))) return null;
        return r;
      }
    }
    return null;
  },
  draw({ whole, part, unit, partEn, partEs }, lang) {
    const x0 = PAD + 4;
    const bw = W - 2 * PAD - 8;
    const wp = Math.max(70, Math.min(bw - 70, (bw * num(part)) / num(whole)));
    const y = 82;
    const bh = 44;
    const U = unit ? ` ${unit}` : "";
    const out = [rect(x0, y, bw, bh, "fp-g", 4)];
    out.push(S(2, bracket(x0, x0 + bw, y - 8, -1), text(W / 2, y - 20, `${show(whole)}${U}`, { cls: "fp-t fp-n" })));
    out.push(S(2, rect(x0, y, wp, bh, "fp-p", 4), text(x0 + wp / 2, y + bh / 2 + 6, `${show(part)}${U}`, { cls: "fp-t fp-n" }), text(x0 + wp / 2, y + bh + 22, tr(lang, partEn, partEs), { cls: "fp-t fp-s" })));
    out.push(S(3, rect(x0 + wp, y, bw - wp, bh, "fp-u", 4), qPill(x0 + wp + (bw - wp) / 2, y + bh / 2)));
    const cap = { en: `The whole is ${show(whole)}${U}; one part is ${show(part)}${U}; the other part is unknown`, es: `El total es ${show(whole)}${U}; una parte es ${show(part)}${U}; la otra parte es la incógnita` };
    return {
      title: { en: "Part-whole bar", es: "Barra de parte y total" },
      caption: cap,
      desc: { en: `${cap.en}.`, es: `${cap.es}.` },
      h: y + bh + 36,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- an estimated percent of a number

const pctEstimate = {
  kind: "percent",
  match(s) {
    if (/which|compare|sort|match|rounding to|using|student (?:says|thinks)|high or|then|both|tip|off|discount|tax/i.test(s) || count(s, /%/g) !== 1) return null;
    let m = s.match(new RegExp(String.raw`^(?:estimate|about how much is) (\d+(?:\.\d+)?)% of (\$?)(${N})\??\.?$`, "i"));
    if (!m) {
      m = s.match(new RegExp(String.raw`(?<![\w.$])(\$?)(${N}) ([a-z]+)\. About (\d+)% (?:were|walk|are) [a-z ]+\. About how many \3 (?:were|walk|are)`));
      if (m) m = [m[0], m[4], m[1], m[2]];
    }
    if (!m || nums(s.replace(/\d+(?:\.\d+)?%/g, "")) !== 1) return null;
    return { p: +m[1], part: null, whole: m[3], money: m[2] === "$" };
  },
  draw: percent.draw,
};

// ---------------------------------------------------------------- a box from its base area and height

const baseBox = {
  kind: "prism",
  match(s) {
    if (/which|student|explain|sort|match|first/i.test(s)) return null;
    const B = s.match(new RegExp(String.raw`base area of (${N}) ?(cm|m|in|ft)?(?:\^2| square (?:feet|meters|inches|centimeters))?`));
    const H = s.match(new RegExp(String.raw`height of (${N}) ?(cm|m|in|ft|feet|meters|inches)?`));
    const V = s.match(new RegExp(String.raw`volume of (${N}) ?(cm|m|in|ft)?(?:\^3)?`));
    if (!B || nums(s.replace(/\^\d/g, "")) !== 2) return null;
    if (H && !V && /what is its volume/i.test(s)) return { B: B[1], H: H[1], u: B[2] || H[2] || (s.match(/square (feet|meters|inches)/)?.[1] ?? ""), ask: "V" };
    if (V && !H && /what is its height/i.test(s)) return { B: B[1], V: V[1], u: B[2] || V[2] || "", ask: "H" };
    return null;
  },
  draw({ B, H, V, u, ask }, lang) {
    const U = { feet: "ft", meters: "m", inches: "in" }[u] ?? u;
    const out = [];
    const x0 = 110;
    const yb = 170;
    const l = 120;
    const h = 80;
    const dx = 50;
    const dy = 34;
    out.push(`<path class="fp-p" d="M${x0} ${yb}h${l}l${dx} ${-dy}h${-l}Z"/>`);
    out.push(`<path class="fp-g" d="M${x0} ${yb}v${-h}h${l}v${h}M${x0 + l} ${yb - h}l${dx} ${-dy}v${h}M${x0} ${yb - h}l${dx} ${-dy}h${l}"/>`);
    out.push(S(2, text(x0 + l / 2 + dx / 2, yb - dy / 2 + 5, `${tr(lang, "base", "base")} ${show(B)}${U ? ` ${U}²` : ""}`, { cls: "fp-t fp-s" })));
    if (ask === "V") {
      out.push(S(2, text(x0 - 8, yb - h / 2 + 5, `${show(H)}${U ? ` ${U}` : ""}`, { anchor: "end", cls: "fp-t fp-n" })));
      out.push(S(3, text(W / 2 - 6, 222, "V =", { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 22, 217)));
    } else {
      out.push(S(2, text(W / 2, 30, `V = ${show(V)}${U ? ` ${U}³` : ""}`, { cls: "fp-t fp-n" })));
      out.push(S(3, qPill(x0 - 24, yb - h / 2)));
    }
    const cap =
      ask === "V"
        ? { en: `A box with base area ${show(B)}${U ? ` ${U}²` : ""} and height ${show(H)}${U ? ` ${U}` : ""}; its volume is unknown`, es: `Una caja con área de la base ${show(B)}${U ? ` ${U}²` : ""} y altura ${show(H)}${U ? ` ${U}` : ""}; su volumen es la incógnita` }
        : { en: `A box with volume ${show(V)}${U ? ` ${U}³` : ""} and base area ${show(B)}${U ? ` ${U}²` : ""}; its height is unknown`, es: `Una caja con volumen ${show(V)}${U ? ` ${U}³` : ""} y área de la base ${show(B)}${U ? ` ${U}²` : ""}; su altura es la incógnita` };
    return {
      title: { en: "Box from its base", es: "Caja a partir de su base" },
      caption: cap,
      desc: { en: `${cap.en}. The shaded face is the base.`, es: `${cap.es}. La cara sombreada es la base.` },
      h: 236,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- equal growth from a start (jumps on a line)

const GROW = [
  // "A plant is 10 cm tall and grows 2 cm each week. How tall is it after 4 weeks?"
  [new RegExp(String.raw`^A [a-z]+ is (${N}) (cm|m|inches) tall and grows (${N}) \2 each (week|day|month)\. How tall is it after (\d+) \4s\?$`), (m) => ({ start: m[1], d: m[3], k: +m[5], unit: m[2] })],
  // "Player B had 6 points, then made 10 three-pointers in a row. How many points does Player B have now?"
  [/^Player [A-Z] had (\d+) points, then made (\d+) (two|three)-pointers in a row\. How many points does Player [A-Z] have now\?$/, (m) => ({ start: m[1], d: m[3] === "two" ? "2" : "3", k: +m[2], unit: "" })],
];

const growth = {
  kind: "growth",
  match(s) {
    for (const [re, mk] of GROW) {
      const m = s.match(re);
      if (m) {
        const r = mk(m);
        return r.k >= 2 && r.k <= 12 ? r : null;
      }
    }
    return null;
  },
  draw({ start, d, k, unit }, lang) {
    const x0 = PAD + 70;
    const x1 = W - PAD - 30;
    const step = (x1 - x0) / k;
    const y = 120;
    const U = unit ? ` ${unit}` : "";
    const out = [line(PAD + 10, y, x1 + 10, y), line(x0, y - 7, x0, y + 7)];
    out.push(S(2, text(x0, y + 26, `${show(start)}${U}`, { cls: "fp-t fp-n" }), text(x0, y - 52, tr(lang, "start", "inicio"), { cls: "fp-t fp-s" })));
    const g = [];
    for (let i = 0; i < k; i++) {
      const a = x0 + i * step;
      const b = a + step;
      g.push(`<path class="fp-ln" d="M${a.toFixed(1)} ${y}Q${((a + b) / 2).toFixed(1)} ${y - 34} ${b.toFixed(1)} ${y}"/>`, line(b, y - 5, b, y + 5));
    }
    g.push(text((x0 + x1) / 2, y - 44, tr(lang, `${k} jumps of +${show(d)}${U}`, `${k} saltos de +${show(d)}${U}`), { cls: "fp-t fp-s fp-ta" }));
    out.push(S(2, g));
    out.push(S(3, qPill(x1, y + 30)));
    const cap = { en: `Start at ${show(start)}${U}, then ${k} equal jumps of ${show(d)}${U}; where it ends is unknown`, es: `Se empieza en ${show(start)}${U} y luego hay ${k} saltos iguales de ${show(d)}${U}; dónde termina es la incógnita` };
    return {
      title: { en: "Equal jumps from a start", es: "Saltos iguales desde un inicio" },
      caption: cap,
      desc: { en: `${cap.en}.`, es: `${cap.es}.` },
      h: y + 52,
      body: out.join(""),
    };
  },
};

export const EXTRA = [dose, partWhole, pctEstimate, baseBox, growth];

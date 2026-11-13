// "Picture it" recognizers for common multiples and common factors. A factor picture can easily BE the answer (a
// factor list shows the GCF, skip-count rows that run long enough show where they first meet), so both are drawn
// only in a form that cannot reveal it: skip-count rows stop well before the least common multiple, and the GCF
// picture shows the two amounts as unit bars with no grouping drawn.

import { PAD, S, W, line, qPill, rect, text, tr } from "./picture-kit.mjs";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const FACT_NO = /which|sort|match|explain|student|list|both the|find both|complete|\bthe lcm is\b|the gcf is|prime|tree|product|times|\d+ = \d/i;

// ---------------------------------------------------------------- least common multiple: two skip-count rows

function readPair(s) {
  let m = s.match(/\b(?:LCM|least common multiple|lowest common multiple) of (\d+) and (\d+)\b/i);
  if (m) return { a: +m[1], b: +m[2], story: false };
  m = s.match(/\bevery (\d+) (minutes|min|days|weeks|hours)\b[^.]*?\.?[^.]*?\bevery (\d+) (?:\2)?/i) || s.match(/\bevery (\d+) (minutes|min|days|weeks|hours)\b.*?\bevery (\d+)\b/i);
  if (m && /together|both|same (?:week|day|time)|again|next/i.test(s)) return { a: +m[1], b: +m[3], unit: m[2], story: true };
  m = s.match(/\bpacks of (\d+)\b.*?\bpacks of (\d+)\b/i);
  if (m && /fewest|smallest|same number|equal numbers|match/i.test(s)) return { a: +m[1], b: +m[2], story: true, packs: true };
  return null;
}

const lcmRows = {
  kind: "multiples",
  match(s) {
    if (FACT_NO.test(s)) return null;
    const r = readPair(s);
    if (!r) return null;
    const nums = (s.match(/(?<![\w.:])\d+(?![\w:]|\.\d)/g) || []).map(Number);
    if (nums.some((n) => n !== r.a && n !== r.b) && !/at \d+:\d+/.test(s)) return null;
    if (r.a === r.b || r.a < 2 || r.b < 2) return null;
    const L = (r.a * r.b) / gcd(r.a, r.b);
    // Each row stops before its first common multiple, so nothing drawn coincides: two jumps when that is safe,
    // one when only that is, none (no picture) when one number is a multiple of the other.
    const jumps = L > 2 * Math.max(r.a, r.b) ? 2 : L > Math.max(r.a, r.b) ? 1 : 0;
    if (!jumps) return null;
    return { ...r, jumps };
  },
  draw({ a, b, jumps }, lang) {
    const top = jumps * Math.max(a, b);
    const x0 = PAD + 48;
    const x1 = W - PAD - 70;
    const X = (v) => x0 + ((x1 - x0) * v) / top;
    const out = [];
    [a, b].forEach((n, i) => {
      const y = 70 + i * 70;
      out.push(line(x0, y, x1 + 34, y, "fp-ln"), text(x0 - 10, y + 5, "0", { anchor: "end", cls: "fp-t fp-s" }), text(x1 + 44, y + 5, "…", { cls: "fp-t fp-n" }));
      const g = [];
      for (let k = 1; k <= jumps; k++) {
        const xa = X((k - 1) * n);
        const xb = X(k * n);
        g.push(`<path class="fp-ln" d="M${xa.toFixed(1)} ${y}Q${((xa + xb) / 2).toFixed(1)} ${y - 30} ${xb.toFixed(1)} ${y}"/>`, line(xb, y - 5, xb, y + 5), text(xb, y + 22, String(k * n), { cls: "fp-t fp-n" }));
      }
      g.push(text(PAD, y - 22, tr(lang, `jumps of ${n}`, `saltos de ${n}`), { anchor: "start", cls: "fp-t fp-s fp-ta" }));
      out.push(S(2, g));
    });
    const lab = tr(lang, "first number on both:", "primer número en las dos:");
    out.push(S(3, text(W / 2 + 40, 214, lab, { anchor: "end", cls: "fp-t fp-s" }), qPill(W / 2 + 68, 209)));
    const cap = {
      en: `Skip-counting by ${a} and by ${b}, ${jumps === 1 ? "one jump" : "two jumps"} each; the first number both rows land on is unknown`,
      es: `Contar de ${a} en ${a} y de ${b} en ${b}, ${jumps === 1 ? "un salto" : "dos saltos"} cada uno; el primer número en el que caen las dos filas es la incógnita`,
    };
    return {
      title: { en: "Skip-count rows", es: "Filas de conteo salteado" },
      caption: cap,
      desc: { en: `${cap.en}. The rows keep going past what is drawn.`, es: `${cap.es}. Las filas siguen más allá de lo dibujado.` },
      h: 230,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- greatest common factor: two unit bars

const gcfBars = {
  kind: "common-factor",
  match(s) {
    if (FACT_NO.test(s)) return null;
    let m = s.match(/\b(?:GCF|greatest common factor)(?: \(GCF\))? of (\d+) and (\d+)\?$/i);
    let names = null;
    if (!m) {
      m = s.match(/\bhas (\d+) ([a-z]+(?: [a-z]+)?) and (\d+) ([a-z]+(?: [a-z]+)?)\. (?:She|He|They) makes? identical [a-z ]+ with nothing left over\. What is the greatest number of [a-z ]+\?$/i);
      if (!m) return null;
      names = [m[2], m[4]];
      m = [m[0], m[1], m[3]];
    }
    const [a, b] = [+m[1], +m[2]];
    if (a === b || a < 2 || b < 2 || Math.max(a, b) > 48 || (s.match(/\d+/g) || []).length !== 2) return null;
    return { a, b, names };
  },
  draw({ a, b, names }, lang) {
    const top = Math.max(a, b);
    const x0 = PAD + 34;
    const cw = (W - x0 - PAD) / top;
    const out = [];
    [a, b].forEach((n, i) => {
      const y = 46 + i * 64;
      const g = [rect(x0, y, cw * n, 30, "fp-p", 0)];
      for (let k = 1; k < n; k++) g.push(line(x0 + k * cw, y, x0 + k * cw, y + 30, "fp-gr"));
      g.push(text(x0 - 8, y + 21, String(n), { anchor: "end", cls: "fp-t fp-n" }));
      if (names) g.push(text(x0, y - 8, names[i], { anchor: "start", cls: "fp-t fp-s" }));
      out.push(S(2, g));
    });
    const lab = names ? tr(lang, "most equal groups:", "más grupos iguales:") : tr(lang, "largest shared factor:", "mayor factor común:");
    out.push(S(3, text(W / 2 + 40, 196, lab, { anchor: "end", cls: "fp-t fp-s" }), qPill(W / 2 + 70, 191)));
    const cap = names
      ? { en: `${a} ${names[0]} and ${b} ${names[1]}, shared into identical groups with none left over; the greatest number of groups is unknown`, es: `${a} y ${b} objetos repartidos en grupos idénticos sin que sobre nada; el mayor número de grupos es la incógnita` }
      : { en: `Bars of ${a} and ${b} units; the greatest number that divides both evenly is unknown`, es: `Barras de ${a} y ${b} unidades; el mayor número que divide a los dos exactamente es la incógnita` };
    return {
      title: { en: "Two amounts in units", es: "Dos cantidades en unidades" },
      caption: cap,
      desc: { en: `${cap.en}. No grouping is drawn.`, es: `${cap.es}. No se dibuja ningún agrupamiento.` },
      h: 214,
      body: out.join(""),
    };
  },
};

export const FACTOR = [lcmRows, gcfBars];

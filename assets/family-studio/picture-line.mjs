// "Picture it" recognizers for integers and one-step inequalities: distance on a number line (absolute value, the
// distance between two numbers, a rise or drop), the opposite of a number, and a one-step inequality as a bar
// model. Same contract as picture-arith.mjs.

import { NUM, PAD, S, W, bracket, dot, line, num, qPill, rect, show, text, tr } from "./picture-kit.mjs";

const LINE_NO = /which|sort|match|explain|student|order|compare|greater|less|least|greatest|plot|graph|describe|write|both|second|then|\bor\b|opposite of the opposite|again/i;

/** All number tokens (with a sign) in the stem. */
const nums = (s) => [...s.matchAll(new RegExp(String.raw`(?<![\w.,/])(${NUM})(?![\w/]|[.,]\d)`, "g"))].map((m) => m[1]);

/** A number line whose only labels are 0 and the given values, so no tick can print the answer. */
function numberLine(vals, y) {
  const lo = Math.min(0, ...vals);
  const hi = Math.max(0, ...vals);
  const span = hi - lo || 1;
  const a = lo - span * 0.12;
  const b = hi + span * 0.12;
  const x0 = PAD + 16;
  const x1 = W - PAD - 16;
  const X = (v) => x0 + ((x1 - x0) * (v - a)) / (b - a);
  const out = [line(x0 - 4, y, x1 + 4, y, "fp-ln"), `<polygon class="fp-ink" points="${x1 + 12},${y} ${x1 + 3},${y - 5} ${x1 + 3},${y + 5}"/>`, `<polygon class="fp-ink" points="${x0 - 12},${y} ${x0 - 3},${y - 5} ${x0 - 3},${y + 5}"/>`];
  out.push(line(X(0), y - 9, X(0), y + 9, "fp-ln"), text(X(0), y + 26, "0", { cls: "fp-t fp-s" }));
  return { X, body: out.join("") };
}

// ---------------------------------------------------------------- distance on a number line

const distance = {
  kind: "number-line-distance",
  match(s) {
    if (LINE_NO.test(s)) return null;
    const ns = nums(s);
    const abs = [...s.matchAll(new RegExp(String.raw`\|(${NUM})\|`, "g"))];
    if (abs.length === 1 && ns.length === 1 && /what is|find/i.test(s) && !/[+×÷=]/.test(s)) {
      const v = num(abs[0][1]);
      if (v === 0 || Math.abs(v) > 1000) return null;
      return { a: 0, b: v, at: abs[0][1], abs: true };
    }
    if (abs.length || ns.length !== 2) return null;
    const ask = /how far apart|distance between|how far (?:is|did|does)|how many [a-z]+ (?:did|does) (?:it|the [a-z]+|she|he) (?:rise|climb|drop|fall|travel)|how many [a-z]+ does it climb|how great|temperature swing|how far did/i.test(s);
    const path = /\bfrom (?:an elevation of |a temperature of )?(-?[\d.]+)°?(?: [a-z]+)?(?: \([^)]*\))? (?:to|up to) (?:\+)?(-?[\d.]+)/i.test(s) || /(?:rises|rose|climbs|climbed|drops|dropped|falls|fell) (?:from|to)/i.test(s);
    const between = /distance between|how far apart|on (?:opposite|the same) sides? of 0/i.test(s);
    if (!ask || (!path && !between)) return null;
    const [p, q] = ns.map(num);
    if (p === q || [p, q].some((v) => Math.abs(v) > 1000)) return null;
    if (!(p < 0 || q < 0)) return null;
    return { a: p, b: q, at: ns[0], bt: ns[1] };
  },
  draw({ a, b, at, bt, abs }, lang) {
    const y = 104;
    const { X, body } = numberLine([a, b], y);
    const out = [body];
    const lab = (t) => show(t);
    if (abs) out.push(S(2, dot(X(b), y, 6), text(X(b), y + 26, lab(at), { cls: "fp-t fp-n" })));
    else out.push(S(2, dot(X(a), y, 6), dot(X(b), y, 6), text(X(a), y + 26, lab(at), { cls: "fp-t fp-n" }), text(X(b), y + 26, lab(bt), { cls: "fp-t fp-n" })));
    const l = Math.min(X(a), X(b));
    const r = Math.max(X(a), X(b));
    out.push(S(3, bracket(l, r, y - 18, -1), qPill((l + r) / 2, y - 40)));
    const E = abs ? `|${lab(at)}|` : `${lab(at)} → ${lab(bt)}`;
    const cap = abs
      ? { en: `${E} is the distance from ${lab(at)} to 0; the distance is unknown`, es: `${E} es la distancia de ${lab(at)} a 0; la distancia es la incógnita` }
      : { en: `${lab(at)} and ${lab(bt)} on a number line; the distance between them is unknown`, es: `${lab(at)} y ${lab(bt)} en una recta numérica; la distancia entre ellos es la incógnita` };
    return {
      title: { en: "Distance on a number line", es: "Distancia en una recta numérica" },
      caption: cap,
      desc: {
        en: `${cap.en}. Only 0 and the given numbers are labelled.${!abs && (a < 0) !== (b < 0) ? " The two numbers are on opposite sides of 0." : ""}`,
        es: `${cap.es}. Solo están rotulados el 0 y los números dados.${!abs && (a < 0) !== (b < 0) ? " Los dos números están en lados opuestos del 0." : ""}`,
      },
      h: y + 40,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- the opposite of a number

const opposite = {
  kind: "opposite",
  match(s) {
    if (LINE_NO.test(s)) return null;
    const m = s.match(new RegExp(String.raw`^what is the opposite of (${NUM})\?$`, "i"));
    if (!m || num(m[1]) === 0 || Math.abs(num(m[1])) > 1000) return null;
    return { v: num(m[1]), t: m[1] };
  },
  draw({ v, t }, lang) {
    const y = 96;
    const { X, body } = numberLine([v, -v], y);
    const out = [body];
    out.push(S(2, dot(X(v), y, 6), text(X(v), y + 26, show(t), { cls: "fp-t fp-n" })));
    const bl = (p, q) => bracket(Math.min(X(p), X(q)), Math.max(X(p), X(q)), y - 16, -1);
    out.push(S(2, bl(0, v)));
    out.push(S(3, `<circle class="fp-open" cx="${X(-v).toFixed(1)}" cy="${y}" r="6"/>`, bl(0, -v), qPill(X(-v), y + 32)));
    out.push(S(2, text(W / 2, 30, tr(lang, "Same distance from 0, other side", "Misma distancia del 0, al otro lado"), { cls: "fp-t fp-s" })));
    const cap = { en: `${show(t)} on a number line; its opposite, the same distance from 0 on the other side, is unknown`, es: `${show(t)} en una recta numérica; su opuesto, a la misma distancia del 0 del otro lado, es la incógnita` };
    return {
      title: { en: `The opposite of ${show(t)}`, es: `El opuesto de ${show(t)}` },
      caption: cap,
      desc: { en: `${cap.en}. Only 0 and ${show(t)} are labelled.`, es: `${cap.es}. Solo están rotulados el 0 y ${show(t)}.` },
      h: y + 52,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- one-step inequality (bar model)

const P = String.raw`\d+(?:\.\d+)?`;
const OP = "(<|>|≤|≥)";
const INEQ_FORMS = [
  [new RegExp(String.raw`(?<![\w.])([a-z]) \+ (${P}) ${OP} (${P})(?![\w.])`), (m) => ({ op: "+", v: m[1], a: m[2], rel: m[3], b: m[4] })],
  [new RegExp(String.raw`(?<![\w.])(${P}) \+ ([a-z]) ${OP} (${P})(?![\w.])`), (m) => ({ op: "+", v: m[2], a: m[1], rel: m[3], b: m[4], lead: true })],
  [new RegExp(String.raw`(?<![\w.])([a-z]) - (${P}) ${OP} (${P})(?![\w.])`), (m) => ({ op: "-", v: m[1], a: m[2], rel: m[3], b: m[4] })],
  [new RegExp(String.raw`(?<![\w.])(\d+)([a-z]) ${OP} (${P})(?![\w.])`), (m) => ({ op: "×", v: m[2], a: m[1], rel: m[3], b: m[4] })],
  [new RegExp(String.raw`(?<![\w.])([a-z]) ÷ (\d+) ${OP} (${P})(?![\w.])`), (m) => ({ op: "÷", v: m[1], a: m[2], rel: m[3], b: m[4] })],
];
const WORDS = { ">": ["more than", "más de"], "≥": ["at least", "por lo menos"], "<": ["less than", "menos de"], "≤": ["at most", "como máximo"] };

const ineqBar = {
  kind: "inequality-bar",
  match(s) {
    if (/is [a-z] = |test|graph|circle|which|sort|match|student|check|explain|describe the solution set|each inequality|write an inequality|solution set/i.test(s)) return null;
    if ((s.match(/[<>≤≥]/g) || []).length !== 1) return null;
    const hits = INEQ_FORMS.map(([re, mk]) => s.match(re) && mk(s.match(re))).filter(Boolean);
    if (hits.length !== 1) return null;
    const e = hits[0];
    // Story numbers must be the inequality's own numbers.
    if (nums(s).some((t) => t !== e.a && t !== e.b)) return null;
    const A = num(e.a);
    if ((e.op === "×" || e.op === "÷") && !(Number.isInteger(A) && A >= 2 && A <= 12)) return null;
    if (e.op === "+" && !(num(e.b) > A)) return null;
    return e;
  },
  draw(e, lang) {
    const { op, v, a, rel, b } = e;
    const x0 = PAD;
    const bw = W - 2 * PAD;
    const y = 86;
    const bh = 44;
    const eq = op === "×" ? `${a}${v} ${rel} ${b}` : op === "÷" ? `${v} ÷ ${a} ${rel} ${b}` : op === "+" && e.lead ? `${a} + ${v} ${rel} ${b}` : `${v} ${op === "+" ? "+" : "−"} ${a} ${rel} ${b}`;
    const out = [];
    const W2 = WORDS[rel];
    const part = (x, w, label, unknown) => {
      out.push(rect(x, y, w, bh, unknown ? "fp-g" : "fp-p", 4));
      out.push(unknown ? S(3, rect(x, y, w, bh, "fp-u", 4), text(x + w / 2, y + bh / 2 + 6, label, { cls: "fp-t fp-q" })) : S(2, text(x + w / 2, y + bh / 2 + 6, label, { cls: "fp-t fp-n" })));
    };
    out.push(S(2, text(W / 2, 22, eq, { cls: "fp-t fp-n" })));
    let cap;
    if (op === "+") {
      const wa = Math.max(80, Math.min(bw - 80, (bw * num(a)) / num(b)));
      out.push(bracket(x0, x0 + bw, y - 8, -1), S(2, text(W / 2, y - 18, `${rel} ${b}`, { cls: "fp-t fp-n" })));
      if (e.lead) {
        part(x0, wa, a, false);
        part(x0 + wa, bw - wa, `${v} = ?`, true);
      } else {
        part(x0, bw - wa, `${v} = ?`, true);
        part(x0 + bw - wa, wa, a, false);
      }
      cap = { en: `${eq}: ${v} and ${a} together are ${W2[0]} ${b}`, es: `${eq}: ${v} y ${a} juntos son ${W2[1]} ${b}` };
    } else if (op === "-") {
      const wa = bw * 0.38;
      out.push(bracket(x0, x0 + bw, y - 8, -1), S(3, qPill(W / 2, y - 26, `${v} = ?`)));
      part(x0, wa, a, false);
      out.push(rect(x0 + wa, y, bw - wa, bh, "fp-p", 4), S(2, text(x0 + wa + (bw - wa) / 2, y + bh / 2 + 6, `${rel} ${b}`, { cls: "fp-t fp-n" })));
      out.push(S(2, text(x0 + wa / 2, y + bh + 24, tr(lang, "taken away", "se quitan"), { cls: "fp-t fp-s" }), text(x0 + wa + (bw - wa) / 2, y + bh + 24, tr(lang, "left", "quedan"), { cls: "fp-t fp-s" })));
      cap = { en: `${eq}: take ${a} away from ${v} and ${W2[0]} ${b} is left`, es: `${eq}: si a ${v} se le quitan ${a}, quedan ${W2[1]} ${b}` };
    } else if (op === "×") {
      const k = num(a);
      const pw = bw / k;
      out.push(bracket(x0, x0 + bw, y - 8, -1), S(2, text(W / 2, y - 18, `${rel} ${b}`, { cls: "fp-t fp-n" })));
      for (let i = 0; i < k; i++) part(x0 + i * pw, pw, pw >= 40 ? v : "", true);
      cap = { en: `${eq}: ${k} equal parts of ${v} are ${W2[0]} ${b} in all`, es: `${eq}: ${k} partes iguales de ${v} suman ${W2[1]} ${b}` };
    } else {
      const k = num(a);
      const pw = bw / k;
      out.push(bracket(x0, x0 + bw, y - 8, -1), S(3, qPill(W / 2, y - 26, `${v} = ?`)));
      for (let i = 0; i < k; i++) out.push(rect(x0 + i * pw, y, pw, bh, "fp-p", 4));
      out.push(S(2, text(W / 2, y + bh + 24, tr(lang, `each of the ${k} parts is ${W2[0]} ${b}`, `cada una de las ${k} partes es ${W2[1]} ${b}`), { cls: "fp-t fp-s" })));
      cap = { en: `${eq}: ${v} split into ${k} equal parts, each ${W2[0]} ${b}`, es: `${eq}: ${v} repartido en ${k} partes iguales, cada una ${W2[1]} ${b}` };
    }
    return {
      title: { en: `Bar model for ${eq}`, es: `Modelo de barras para ${eq}` },
      caption: cap,
      desc: { en: `${cap.en}. The values of ${v} that work are the unknown.`, es: `${cap.es}. Los valores de ${v} que cumplen son la incógnita.` },
      h: y + bh + 40,
      body: out.join(""),
    };
  },
};

export const LINE = [distance, opposite, ineqBar];

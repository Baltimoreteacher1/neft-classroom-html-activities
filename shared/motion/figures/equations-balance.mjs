// balance:add and balance:multiply. A balance scale where the SAME operation is applied to BOTH sides and it stays level, step by step,
// then the student's candidate value tested on the scale, then the one-sided move that does not work.
// values = [coefficient or added amount a, right side b, candidate value of x]; the lab's own headline is left - right at the candidate.
import { Rat, int } from "../exact.mjs";
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { KF, MINUS, all, crossPath, dec, f1, para, pick, rich, say, segs, text, textW, whole } from "./equations-kit.mjs";

const KEYS = ["balance:add", "balance:multiply"];
const PAD = 12;
const TOK_H = 34;
const MAX_TILT = 14;

/** @typedef {{ k: "x" | "n" | "ghost" | "sep" | "frac", s: string, n?: string, d?: string }} Tok */

/** @param {string} key */
function mode(key) {
  if (!KEYS.includes(key)) throw new RangeError(`not a balance model: ${key}`);
  return key === "balance:add" ? "add" : "multiply";
}

/** @param {string} key */
function controls(key) {
  const add = mode(key) === "add";
  return [
    add
      ? { label: "Amount added to x", labelEs: "Cantidad sumada a x", min: 1, max: 12, step: 1 }
      : { label: "Coefficient multiplying x", labelEs: "Coeficiente que multiplica a x", min: 1, max: 12, step: 1 },
    { label: "Right side", labelEs: "Lado derecho", min: 1, max: 60, step: 1 },
    { label: "Candidate value of x", labelEs: "Valor de prueba de x", min: 0, max: 30, step: 0.5 },
  ];
}

/** @param {string} key @param {number[]} values */
function build(key, values) {
  const md = mode(key);
  const [a, b, c] = values;
  whole(a, 1, 12, "The first value");
  whole(b, 1, 60, "The right side");
  if (typeof c !== "number" || !(c >= 0 && c <= 30) || !Number.isInteger(c * 2)) throw new RangeError("The candidate is 0 to 30, in halves.");
  const A = int(a);
  const B = int(b);
  const C = new Rat(BigInt(c * 2), 2n);
  const X = md === "add" ? B.sub(A) : B.div(A);
  const left = md === "add" ? C.add(A) : A.mul(C);
  const diff = left.sub(B);
  const wrongDiff = X.sub(B);
  return {
    md,
    a,
    b,
    A,
    B,
    C,
    X,
    left,
    diff,
    /** the lab's headline: left minus right at the candidate */
    value: Number(diff.n) / Number(diff.d),
    balanced: diff.n === 0n,
    /** the one-sided move; null when it happens to land on the same picture (1x = b) */
    wrong: wrongDiff.n === 0n ? null : { diff: wrongDiff },
  };
}

/** @typedef {ReturnType<typeof build>} Model */

// ---- tokens: what sits on a pan
/** @param {Rat} r @returns {Tok} */
const num = (r) => {
  const s = dec(r);
  return s !== null ? { k: "n", s } : { k: "frac", s: "", n: String(r.n), d: String(r.d) };
};
const X_TOK = /** @type {Tok} */ ({ k: "x", s: "x" });
/** @param {string} s @returns {Tok} */
const ghost = (s) => ({ k: "ghost", s });
const PLUS = /** @type {Tok} */ ({ k: "sep", s: "+" });
/** @param {string} s @returns {Tok} */
const n = (s) => ({ k: "n", s });

/** @param {Tok} t */
const tokW = (t) => (t.k === "sep" ? 16 : t.k === "frac" ? Math.max(String(t.n).length, String(t.d).length) * 9 + 18 : Math.max(28, textW(t.s, 15, 700) + 18));

/** One token standing on a platform whose top is at y. @param {Tok} t @param {number} x left @param {number} top */
function drawTok(t, x, top) {
  const w = tokW(t);
  if (t.k === "sep") return text(x + w / 2, top + 24, "+", { size: 18, weight: 700 });
  const fill = t.k === "x" ? COPY_FILLS[0] : t.k === "ghost" ? COLOR.white : COPY_FILLS[1];
  const dash = t.k === "ghost" ? ' stroke-dasharray="4 3"' : "";
  let g = `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(w)}" height="${TOK_H}" rx="6" fill="${fill}" stroke="${COLOR.ink}" stroke-width="1.5"${dash}/>`;
  if (t.k === "frac") {
    const cx = x + w / 2;
    g += text(cx, top + 14, String(t.n), { size: 13, weight: 700 });
    g += `<line x1="${f1(x + 7)}" y1="${f1(top + 18)}" x2="${f1(x + w - 7)}" y2="${f1(top + 18)}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
    g += text(cx, top + 31, String(t.d), { size: 13, weight: 700 });
  } else g += text(x + w / 2, top + 22, t.s, { size: 15, weight: 700, fill: t.k === "ghost" ? COLOR.muted : COLOR.ink });
  return t.k === "ghost" ? `<g class="eq-ghost">${g}</g>` : g;
}

/**
 * The scale. `tilt` is +1 when the RIGHT side is heavier, -1 when the left is, 0 when level; `mag` is how far out of balance (a Rat).
 * @param {number} x0 @param {number} y0 @param {number} w @param {Tok[]} left @param {Tok[]} right @param {Rat} diff left minus right
 */
function scale(x0, y0, w, left, right, diff) {
  const sign = diff.n > 0n ? 1 : diff.n < 0n ? -1 : 0;
  const mag = Math.abs(Number(diff.n) / Number(diff.d));
  const deg = sign === 0 ? 0 : -sign * Math.min(MAX_TILT, 5 + mag); // clockwise is positive: the heavier left side goes down
  const rad = (deg * Math.PI) / 180;
  const hb = 0.27 * w;
  const pw = 0.42 * w;
  const cx = x0 + w / 2;
  const py = y0 + TOK_H + 24;
  const lx = cx - hb * Math.cos(rad);
  const ly = py - hb * Math.sin(rad);
  const rx = cx + hb * Math.cos(rad);
  const ry = py + hb * Math.sin(rad);
  let svg = `<polygon points="${f1(cx - 10)},${f1(py + 24)} ${f1(cx + 10)},${f1(py + 24)} ${f1(cx)},${f1(py)}" fill="${COLOR.navy}"/>`;
  svg += `<line x1="${f1(cx - 22)}" y1="${f1(py + 25)}" x2="${f1(cx + 22)}" y2="${f1(py + 25)}" stroke="${COLOR.navy}" stroke-width="5" stroke-linecap="round"/>`;
  svg += `<line class="eq-beam" data-deg="${f1(deg)}" x1="${f1(lx)}" y1="${f1(ly)}" x2="${f1(rx)}" y2="${f1(ry)}" stroke="${COLOR.ink}" stroke-width="6" stroke-linecap="round"/>`;
  /** @param {number} ex @param {number} ey @param {Tok[]} toks @param {string} side */
  const pan = (ex, ey, toks, side) => {
    const total = toks.reduce((t, k) => t + tokW(k) + 4, -4);
    let tx = ex - total / 2;
    const top = ey - 4 - TOK_H;
    let g = `<line x1="${f1(ex - pw / 2)}" y1="${f1(ey - 3)}" x2="${f1(ex + pw / 2)}" y2="${f1(ey - 3)}" stroke="${COLOR.ink}" stroke-width="4" stroke-linecap="round"/>`;
    for (const t of toks) {
      g += drawTok(t, tx, top);
      tx += tokW(t) + 4;
    }
    return `<g class="eq-pan" data-side="${side}" data-dy="${f1(ey - py)}">${g}</g>`;
  };
  svg += pan(lx, ly, left, "left") + pan(rx, ry, right, "right");
  return { svg, h: TOK_H + 24 + 24 + 10, sign };
}

// ---- words
/** @param {Model} m @param {string} lang */
function words(m, lang) {
  const es = lang === "es";
  const { a, b } = m;
  const add = m.md === "add";
  const coef = a === 1 ? "" : String(a);
  const xs = segs(m.X);
  const eq1 = add ? `x + ${a} = ${b}` : `${coef}x = ${b}`;
  const op = add ? `${MINUS} ${a}` : `÷ ${a}`;
  return {
    eq1,
    op,
    t1: pick(lang, "Start", "Inicio"),
    l1: pick(lang, "The scale is level: both sides are equal.", "La balanza está nivelada: los dos lados son iguales."),
    t2: add ? pick(lang, `Subtract ${a} from both sides`, `Resta ${a} en los dos lados`) : pick(lang, `Divide both sides by ${a}`, `Divide los dos lados entre ${a}`),
    still: pick(lang, "Still level.", "Sigue nivelada."),
    step: add ? `x + ${a} ${MINUS} ${a} = ${b} ${MINUS} ${a}` : `${coef}x ÷ ${a} = ${b} ÷ ${a}`,
    /** @type {import("./equations-kit.mjs").Seg[]} */
    result: ["x = ", ...xs],
    /** @type {import("./equations-kit.mjs").Seg[]} */
    check: add ? [pick(lang, "Check: ", "Comprueba: "), `${say(m.X, lang)} + ${a} = ${b}`] : [pick(lang, "Check: ", "Comprueba: "), `${a} × `, ...xs, ` = ${b}`],
    t3: pick(lang, `Test your value, x = ${dec(m.C)}`, `Prueba tu valor, x = ${dec(m.C)}`),
    test: add ? `${dec(m.C)} + ${a} = ${dec(m.left)}` : `${a} × ${dec(m.C)} = ${dec(m.left)}`,
    right: pick(lang, `The right side is ${b}.`, `El lado derecho es ${b}.`),
    verdict: m.balanced
      ? pick(lang, `${dec(m.left)} = ${b}: level. x = ${dec(m.C)} is a solution.`, `${dec(m.left)} = ${b}: nivelada. x = ${dec(m.C)} es una solución.`)
      : m.diff.n > 0n
        ? pick(lang, `${dec(m.left)} ≠ ${b}: the left side is heavier.`, `${dec(m.left)} ≠ ${b}: el lado izquierdo pesa más.`)
        : pick(lang, `${dec(m.left)} ≠ ${b}: the right side is heavier.`, `${dec(m.left)} ≠ ${b}: el lado derecho pesa más.`),
    diff: pick(lang, `Left minus right = ${dec(m.diff)}`, `Izquierda menos derecha = ${dec(m.diff)}`),
    t4: pick(lang, "Not this: one side only", "No así: en un solo lado"),
    w1: add
      ? pick(lang, `Subtracting ${a} from the left only leaves x on the left and ${b} on the right.`, `Si restas ${a} solo a la izquierda, queda x a la izquierda y ${b} a la derecha.`)
      : pick(lang, `Dividing only the left by ${a} leaves x on the left and ${b} on the right.`, `Si divides solo la izquierda entre ${a}, queda x a la izquierda y ${b} a la derecha.`),
    /** @type {import("./equations-kit.mjs").Seg[][]} */
    w2: es ? [["Con x = ", ...xs, ", la izquierda vale"], [...xs, ` y la derecha vale ${b}.`]] : [["With x = ", ...xs, ", the left holds"], [...xs, ` and the right holds ${b}.`]],
    /** @type {import("./equations-kit.mjs").Seg[]} */
    w3: [...xs, ` ≠ ${b}: ${pick(lang, "the scale tips.", "la balanza se inclina.")}`],
    w4: pick(lang, "Both sides must change.", "Cambian los dos lados."),
  };
}

// ---- layout
/**
 * @param {Model} m @param {{ lang: "en" | "es", width: number }} o
 */
function render(m, { lang, width }) {
  const W = Math.max(300, Math.min(900, Math.round(width)));
  const wd = words(m, lang);
  const two = W >= 520;
  const gap = 12;
  const cw = two ? (W - 2 * PAD - gap) / 2 : W - 2 * PAD;
  const add = m.md === "add";
  const lhs0 = add ? [X_TOK, PLUS, n(String(m.a))] : [{ ...X_TOK, s: `${m.a === 1 ? "" : m.a}x` }];
  const zero = int(0);
  const opTok = ghost(wd.op);
  /** each card: id, title, level, pans, text drawer */
  const cards = [
    {
      step: "1",
      title: wd.t1,
      left: lhs0,
      right: [n(String(m.b))],
      diff: zero,
      body: (/** @type {number} */ x, /** @type {number} */ y) => para(x, y, [wd.eq1, wd.l1], { maxW: cw - 20, weight: 400, fill: COLOR.ink }),
    },
    {
      step: "2",
      title: wd.t2,
      left: [X_TOK, opTok],
      right: [num(m.X), opTok],
      diff: zero,
      body: (/** @type {number} */ x, /** @type {number} */ y) => {
        const a = para(x, y, [wd.step, wd.still], { maxW: cw - 20 });
        const frac = dec(m.X) === null;
        const r = rich(x, a.y + (frac ? 8 : 0), wd.result, { weight: 700 });
        const yy = a.y + (frac ? 38 : 20);
        const c = rich(x, yy, wd.check, {});
        return { svg: a.svg + r.svg + c.svg, y: yy + (frac ? 22 : 8) };
      },
    },
    {
      step: "3",
      title: wd.t3,
      left: add ? [num(m.C), PLUS, n(String(m.a))] : [n(`${m.a} × ${dec(m.C)}`)],
      right: [n(String(m.b))],
      diff: m.diff,
      body: (/** @type {number} */ x, /** @type {number} */ y) => para(x, y, [wd.test, wd.verdict, wd.diff], { maxW: cw - 20, weight: 400 }),
    },
  ];
  /** @type {Array<{ step: string, title: string, left: Tok[], right: Tok[], diff: Rat, wrong?: boolean, body: (x: number, y: number) => { svg: string, y: number } }>} */
  const list = cards;
  if (m.wrong) {
    list.push({
      step: "x",
      title: wd.t4,
      left: [X_TOK, opTok],
      right: [n(String(m.b))],
      diff: m.wrong.diff,
      wrong: true,
      body: (x, y) => {
        const p1 = para(x, y, [wd.w1], { maxW: cw - 20 });
        const p2 = para(x, p1.y, wd.w2, { maxW: cw - 20 });
        const p3 = para(x, p2.y, [wd.w3, wd.w4], { maxW: cw - 20, weight: 700 });
        return { svg: p1.svg + p2.svg + p3.svg, y: p3.y };
      },
    });
  }
  /** @param {(typeof list)[number]} c @param {number} x @param {number} y @param {number} h */
  const drawCard = (c, x, y, h) => {
    const sc = scale(x + 10, y + 34, cw - 20, c.left, c.right, c.diff);
    let svg = "";
    const cxm = x + cw / 2;
    const body = c.body(cxm, y + 34 + sc.h + 16);
    const H = h || body.y - y + 4;
    svg += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(cw)}" height="${f1(H)}" rx="10" fill="${COLOR.white}" stroke="${c.wrong ? COLOR.error : COLOR.ink}" stroke-width="1.5"${c.wrong ? ' stroke-dasharray="6 4"' : ""}/>`;
    svg += c.wrong ? `<circle cx="${f1(x + 18)}" cy="${f1(y + 19)}" r="11" fill="none" stroke="${COLOR.error}" stroke-width="2"/>${crossPath(x + 12, y + 13)}` : `<circle cx="${f1(x + 18)}" cy="${f1(y + 19)}" r="11" fill="${COLOR.navy}"/>${text(x + 18, y + 24, c.step, { size: 14, weight: 700, fill: COLOR.white })}`;
    svg += text(x + 36, y + 24, c.title, { size: 14, weight: 700, anchor: "start", fill: c.wrong ? COLOR.error : COLOR.ink });
    svg += sc.svg + body.svg;
    return { svg: `<g class="eq-card" data-step="${c.step}">${svg}</g>`, h: H };
  };
  // two passes so cards on one row share a height
  const perRow = two ? 2 : 1;
  const heights = list.map((c) => drawCard(c, 0, 0, 0).h);
  let body = "";
  let y = PAD;
  for (let i = 0; i < list.length; i += perRow) {
    const rowH = Math.max(...heights.slice(i, i + perRow));
    list.slice(i, i + perRow).forEach((c, j) => {
      body += drawCard(c, PAD + j * (cw + gap), y, rowH).svg;
    });
    y += rowH + gap;
  }
  return { body, width: W, height: Math.ceil(y - gap + PAD) };
}

/** @param {ParentNode} root @param {Model} _m */
function scene(root, _m) {
  const cards = all(root, ".eq-card");
  const k = Math.max(1, cards.length);
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  cards.forEach((card, i) => {
    const from = i / k;
    const len = 1 / k;
    tracks.push({ els: [card], from, to: from + len * 0.3, keyframes: KF.rise });
    const ghosts = all(card, ".eq-ghost");
    if (ghosts.length) tracks.push({ els: ghosts, from: from + len * 0.35, to: from + len * 0.6, keyframes: KF.pop });
    const beam = card.querySelector(".eq-beam");
    const deg = Number(beam?.getAttribute("data-deg") || 0);
    if (beam && deg !== 0) {
      tracks.push({
        els: [beam],
        from: from + len * 0.4,
        to: from + len * 0.95,
        keyframes: [
          { transform: `rotate(${-deg}deg)`, transformBox: "fill-box", transformOrigin: "center" },
          { transform: "none", transformBox: "fill-box", transformOrigin: "center" },
        ],
      });
      for (const pan of all(card, ".eq-pan")) {
        const dy = Number(pan.getAttribute("data-dy") || 0);
        tracks.push({ els: [pan], from: from + len * 0.4, to: from + len * 0.95, keyframes: [{ transform: `translateY(${-dy}px)` }, { transform: "none" }] });
      }
    }
  });
  return { durationMs: Math.max(1800, Math.min(7000, 1000 * k + 800)), tracks };
}

/** @param {Model} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const wd = words(m, lang);
  const es = lang === "es";
  const fmt = (/** @type {import("./equations-kit.mjs").Seg[]} */ segsIn) => segsIn.map((s) => (typeof s === "string" ? s : `${s.n} ${pick(lang, "over", "sobre")} ${s.d}`)).join("");
  const out = [
    es ? `Una balanza con la ecuación ${wd.eq1}. Está nivelada.` : `A balance scale holds the equation ${wd.eq1}. It is level.`,
    es ? `Paso 2: ${wd.t2}. ${wd.step}. ${fmt(wd.result)}. La balanza sigue nivelada porque hiciste lo mismo en los dos lados. ${fmt(wd.check)}.` : `Step 2: ${wd.t2}. ${wd.step}. ${fmt(wd.result)}. The scale stays level because both sides got the same operation. ${fmt(wd.check)}.`,
    es ? `Paso 3: pruebas x = ${dec(m.C)}. ${wd.test}. El lado derecho es ${m.b}. ${wd.verdict} ${wd.diff}.` : `Step 3: you test x = ${dec(m.C)}. ${wd.test}. The right side is ${m.b}. ${wd.verdict} ${wd.diff}.`,
  ];
  if (m.wrong) out.push(es ? `${wd.t4}. ${wd.w1} ${wd.w2.map(fmt).join(" ")} ${fmt(wd.w3)} ${wd.w4}` : `${wd.t4}. ${wd.w1} ${wd.w2.map(fmt).join(" ")} ${fmt(wd.w3)} ${wd.w4}`);
  return out.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "balance-same-both-sides",
  keys: KEYS,
  title: { en: "A balance: the same operation on both sides", es: "Una balanza: la misma operación en los dos lados" },
  controls,
  build,
  render,
  scene,
  describe,
};

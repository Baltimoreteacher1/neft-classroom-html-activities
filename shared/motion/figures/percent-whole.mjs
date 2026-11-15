// percent:whole / percent:find-whole - the whole from a known part and its percent (lesson 4-5, ratio tables).
// The tape is split into equal percent pieces; the known part is k of them and the whole is n = 100/g of them (g = gcd(percent, 100)),
// so scaling the part by n/k reaches 100%. Headline: whole = part / (p/100), the lab's value.
import { Rat } from "../exact.mjs";
import { COLOR } from "../tokens.mjs";
import { block, CH, callout, clampWidth, dec, equivalents, f1, fillOf, gcd, nb, PAD, rat, rel, stepScene, T, text } from "./percent-kit.mjs";

/** @param {string} key @param {number[]} values */
function build(key, values) {
  const [p, part] = values;
  if (!["percent:whole", "percent:find-whole"].includes(key) || !Number.isInteger(p) || !Number.isInteger(part) || p < 1 || p > 100 || part < 1 || part > 120) throw new RangeError("Percent is 1 to 100 and the known part 1 to 120, whole numbers.");
  const g = gcd(p, 100);
  const k = p / g;
  const n = 100 / g;
  const whole = new Rat(BigInt(part * 100), BigInt(p));
  const piece = new Rat(BigInt(part), BigInt(k));
  const w = dec(whole);
  /** @type {Array<{ pct: number, amt: ReturnType<typeof dec>, op: string | null }>} */
  const cols = [{ pct: p, amt: dec(rat(part)), op: null }];
  if (k > 1) cols.push({ pct: g, amt: dec(piece), op: `÷ ${k}` });
  if (p < 100) cols.push({ pct: 100, amt: w, op: `× ${n}` });
  return {
    p,
    part,
    g,
    k,
    n,
    cols,
    piece: dec(piece),
    whole: w,
    decimal: dec(rat(p, 100)).text,
    wrong: p < 100 ? dec(rat(part * p, 100)).text : null,
  };
}

/** @typedef {ReturnType<typeof build>} Model */

/** @param {Model} m @param {{ lang: "en" | "es", width: number }} o */
function render(m, o) {
  const W = clampWidth(o.width);
  const lang = o.lang;
  const t = (/** @type {string} */ en, /** @type {string} */ es) => T(lang, en, es);
  const avail = W - 2 * PAD;
  const x0 = PAD + 2;
  const tw = W - 2 * PAD - 4;
  const sx = (/** @type {number} */ pct) => x0 + (pct / 100) * tw;
  const H = 34;
  const lastStep = m.cols.length;
  let y = PAD;
  let svg = "";
  // ---- tape: the whole is unknown; the known part is k equal pieces, the rest of the whole is the other n - k pieces
  const top = block(W / 2, y + 14, t("Whole: ? = 100%", "Total: ? = 100%"), { width: avail, anchor: "middle", weight: 700 });
  svg += top.svg;
  y += top.h + 2;
  svg += `<path d="M${f1(sx(0))} ${f1(y + 7)} V${f1(y)} H${f1(sx(100))} V${f1(y + 7)}" fill="none" stroke="${COLOR.ink}" stroke-width="1.6"/>`;
  y += 12;
  const ty = y;
  svg += `<rect x="${f1(x0)}" y="${f1(ty)}" width="${f1(tw)}" height="${H}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  svg += `<g class="pm-pop" data-step="1"><rect x="${f1(x0)}" y="${f1(ty)}" width="${f1(sx(m.p) - x0)}" height="${H}" fill="${fillOf(0)}" stroke="${COLOR.ink}" stroke-width="1.5"/></g>`;
  const pw = sx(m.g) - x0;
  const fit = (/** @type {string} */ s) => s.length * 13 * CH <= pw - 4;
  if (m.k > 1 && pw >= 5) {
    let s = "";
    for (let i = 1; i < m.k; i++) s += `<line x1="${f1(sx(i * m.g))}" y1="${f1(ty)}" x2="${f1(sx(i * m.g))}" y2="${f1(ty + H)}" stroke="${COLOR.ink}" stroke-width="1.2"/>`;
    if (fit(m.piece.text)) for (let i = 0; i < m.k; i++) s += text(sx(i * m.g + m.g / 2), ty + H / 2 + 4.5, m.piece.text, { size: 13, weight: 700 });
    svg += `<g class="pm-row" data-step="2">${s}</g>`;
  }
  if (m.p < 100) {
    let s = "";
    const count = m.n - m.k;
    if (count <= 24 && pw >= 5) {
      for (let i = m.k; i < m.n; i++) {
        s += `<rect x="${f1(sx(i * m.g))}" y="${f1(ty + 1)}" width="${f1(pw)}" height="${H - 2}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.2" stroke-dasharray="4 2.5"/>`;
        if (fit(m.piece.text)) s += text(sx(i * m.g + m.g / 2), ty + H / 2 + 4.5, m.piece.text, { size: 13, weight: 700, fill: COLOR.muted });
      }
    } else s += `<rect x="${f1(sx(m.p))}" y="${f1(ty + 1)}" width="${f1(sx(100) - sx(m.p))}" height="${H - 2}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
    svg += `<g class="pm-row" data-step="${lastStep}">${s}</g>`;
  }
  y = ty + H + 8;
  const bracket = (/** @type {number} */ a, /** @type {number} */ b, /** @type {string} */ label, /** @type {string} */ attrs, /** @type {boolean} */ dashed) => {
    const half = Math.min(avail, label.length * 14 * CH) / 2;
    const cx = Math.max(PAD + half, Math.min((sx(a) + sx(b)) / 2, W - PAD - half));
    const tb = block(cx, y + 25, label, { width: avail, anchor: "middle", weight: 700 });
    const out = `<g ${attrs}><path d="M${f1(sx(a))} ${f1(y)} V${f1(y + 7)} H${f1(sx(b))} V${f1(y)}" fill="none" stroke="${COLOR.ink}" stroke-width="1.6"${dashed ? ' stroke-dasharray="5 3"' : ""}/>${tb.svg}</g>`;
    y += 14 + tb.h + 8;
    return out;
  };
  svg += bracket(0, m.p, t(`Part: ${m.part} = ${m.p}%`, `Parte: ${m.part} = ${m.p}%`), 'class="pm-row" data-step="1"', false);
  if (m.p < 100) svg += bracket(0, 100, t(`Whole: ${m.whole.text} = 100%`, `Total: ${m.whole.text} = 100%`), 'class="pm-final"', true);
  y += 4;
  // ---- ratio table: percent and amount change together, one operation per arrow
  const bw = 96;
  const gapX = 56;
  const c1 = W / 2 - gapX / 2 - bw / 2;
  const c2 = W / 2 + gapX / 2 + bw / 2;
  svg += `<g class="pm-final">${text(c1, y + 12, t("Percent", "Porcentaje"), { size: 13, weight: 700, fill: COLOR.muted })}${text(c2, y + 12, t("Amount", "Cantidad"), { size: 13, weight: 700, fill: COLOR.muted })}</g>`;
  y += 22;
  const RH = 32;
  const AG = 30;
  m.cols.forEach((c, i) => {
    let s = "";
    if (c.op) {
      for (const cx of [c1, c2]) s += `<path d="M${f1(cx)} ${f1(y - AG + 2)} V${f1(y - 3)} M${f1(cx - 5)} ${f1(y - 9)} L${f1(cx)} ${f1(y - 3)} L${f1(cx + 5)} ${f1(y - 9)}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>`;
      s += text(W / 2, y - AG / 2 + 4.5, c.op, { size: 14, weight: 700 });
    }
    const dash = i === m.cols.length - 1 && m.p < 100 ? ' stroke-dasharray="6 4"' : "";
    for (const [cx, label] of /** @type {Array<[number, string]>} */ ([
      [c1, `${c.pct}%`],
      [c2, `${i && !c.amt.exact ? "≈ " : ""}${c.amt.text}`],
    ]))
      s += `<rect x="${f1(cx - bw / 2)}" y="${f1(y)}" width="${bw}" height="${RH}" rx="6" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.6"${dash}/>${text(cx, y + 21, label, { weight: 700 })}`;
    svg += `<g class="pm-row" data-step="${i + 1}">${s}</g>`;
    y += RH + AG;
  });
  y -= AG - 6;
  // ---- each move in words, then the scale factor and the check
  if (m.p < 100) {
    /** @type {string[]} */
    const lines = [];
    if (m.k > 1) lines.push(t(`Split: ${m.p}% ÷ ${m.k} = ${m.g}% in each piece, and ${nb(`${m.part} ÷ ${m.k} ${rel(m.piece)} ${m.piece.text}`)}.`, `Dividir: ${m.p}% ÷ ${m.k} = ${m.g}% en cada pieza, y ${nb(`${m.part} ÷ ${m.k} ${rel(m.piece)} ${m.piece.text}`)}.`));
    const up = m.whole.exact ? `${m.n} × ${m.piece.text}` : `${m.n} × ${m.part} ÷ ${m.k}`;
    lines.push(t(`Count up: 100% ÷ ${m.g}% = ${m.n} pieces, so ${nb(`${up} ${rel(m.whole)} ${m.whole.text}`)}.`, `Contar hasta 100%: 100% ÷ ${m.g}% = ${m.n} piezas, así que ${nb(`${up} ${rel(m.whole)} ${m.whole.text}`)}.`));
    lines.forEach((l, i) => {
      const b = block(PAD, y + 14, l, { width: avail });
      svg += `<g class="pm-row" data-step="${lines.length === 2 ? i + 2 : lastStep}">${b.svg}</g>`;
      y += b.h + 6;
    });
    y += 6;
    const fh = block(PAD, y + 12, t(`Scale factor from ${m.p}% to 100%`, `Factor de escala de ${m.p}% a 100%`), { width: avail, size: 13, weight: 700, fill: COLOR.muted });
    /** @type {Array<{ frac?: [number, number], txt?: string }>} */
    const items = [{ frac: [100, m.p] }];
    if (m.g > 1) items.push({ frac: [m.n, m.k] });
    const factor = dec(rat(100, m.p));
    if (factor.exact) items.push({ txt: factor.text });
    y += fh.h + 4;
    const eq = equivalents(W, y, items);
    svg += `<g class="pm-final">${fh.svg}${eq.svg}</g>`;
    y += eq.h + 8;
  }
  const lines = [t(`Whole = ${m.part} ÷ ${m.decimal} ${rel(m.whole)} ${m.whole.text}`, `Total = ${m.part} ÷ ${m.decimal} ${rel(m.whole)} ${m.whole.text}`)];
  lines.push(m.whole.exact ? t(`Check: ${m.whole.text} × ${m.decimal} = ${m.part}`, `Comprobación: ${m.whole.text} × ${m.decimal} = ${m.part}`) : t("The whole does not come out even, so it is rounded.", "El total no sale exacto, así que está redondeado."));
  const a = callout({ x: PAD, y, w: avail, kind: "ok", lines });
  svg += a.svg;
  y += a.h;
  if (m.wrong !== null) {
    const c = callout({ x: PAD, y, w: avail, kind: "no", lines: [t(`Not this: ${m.part} × ${m.decimal} = ${m.wrong}`, `Esto no: ${m.part} × ${m.decimal} = ${m.wrong}`), t(`That treats ${m.part} as the whole. The whole is bigger than ${m.part}.`, `Eso trata el ${m.part} como si fuera el total. El total es mayor que ${m.part}.`)] });
    svg += c.svg;
    y += c.h;
  }
  return { body: svg, width: W, height: Math.ceil(y + 4) };
}

/** @param {Model} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const t = (/** @type {string} */ en, /** @type {string} */ es) => T(lang, en, es);
  const s = [t(`The known part ${m.part} is ${m.p}% of an unknown whole. On the tape the known part is ${m.k} ${m.k === 1 ? "piece" : "equal pieces"} of ${m.g}%.`, `La parte conocida ${m.part} es ${m.p}% de un total desconocido. En la cinta la parte conocida es ${m.k} ${m.k === 1 ? "pieza" : "piezas iguales"} de ${m.g}%.`)];
  if (m.p === 100) s.push(t(`100% is the whole, so the whole is ${m.part}.`, `100% es el total, así que el total es ${m.part}.`));
  else {
    if (m.k > 1) s.push(t(`Divide by ${m.k}: ${m.g}% is ${m.piece.text}.`, `Divide entre ${m.k}: ${m.g}% es ${m.piece.text}.`));
    s.push(t(`100% is ${m.n} pieces of ${m.g}%. Multiply by ${m.n}: the whole is ${m.whole.exact ? "" : "about "}${m.whole.text}.`, `100% es ${m.n} piezas de ${m.g}%. Multiplica por ${m.n}: el total es ${m.whole.exact ? "" : "unos "}${m.whole.text}.`));
    s.push(t(`The scale factor from ${m.p}% to 100% is 100 over ${m.p}.`, `El factor de escala de ${m.p}% a 100% es 100 sobre ${m.p}.`));
  }
  s.push(t(`Whole = ${m.part} ÷ ${m.decimal} ${rel(m.whole)} ${m.whole.text}.`, `Total = ${m.part} ÷ ${m.decimal} ${rel(m.whole)} ${m.whole.text}.`));
  s.push(m.whole.exact ? t(`Check: ${m.whole.text} × ${m.decimal} = ${m.part}.`, `Comprobación: ${m.whole.text} × ${m.decimal} = ${m.part}.`) : t("The whole does not come out even, so it is rounded.", "El total no sale exacto, así que está redondeado."));
  if (m.wrong !== null) s.push(t(`Not this: ${m.part} × ${m.decimal} = ${m.wrong}. That treats ${m.part} as the whole.`, `Esto no: ${m.part} × ${m.decimal} = ${m.wrong}. Eso trata el ${m.part} como si fuera el total.`));
  return s.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
const whole = {
  id: "percent-whole",
  keys: ["percent:whole", "percent:find-whole"],
  title: { en: "Find the whole from a part and its percent", es: "Hallar el total con una parte y su porcentaje" },
  controls: () => [
    { label: "Percent", labelEs: "Porcentaje", min: 1, max: 100, step: 1 },
    { label: "Known part", labelEs: "Parte conocida", min: 1, max: 120, step: 1 },
  ],
  build,
  render,
  scene: (root) => stepScene(root),
  describe,
};
export default whole;

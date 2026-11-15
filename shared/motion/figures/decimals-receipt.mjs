// Motion figure: the receipt (lab model decimal:receipt, lessons 2-11 and 2-12).
// price x items is an area model split into whole dollars and cents; the partial products are added with the decimal points
// lined up (regrouping shown), and the change from $50 is subtracted the same way.
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { columnNotes, columnsWork, drawColumns, intColumns, misalign } from "./decimals-columns.mjs";
import { PAD, base, f1, fixed, notBox, okBox, panel, panelHead, panelScene, para, pick, placesOf, text } from "./decimals-draw.mjs";
import { commas } from "../exact.mjs";

const BUDGET = 5000;

/** @param {number[]} values */
export function receiptModel(values) {
  if (!Array.isArray(values) || values.length !== 2) throw new RangeError("needs a price and a number of items");
  const priceC = Math.round(values[0] * 100);
  const n = Math.round(values[1]);
  if (!Number.isFinite(values[0]) || Math.abs(values[0] * 100 - priceC) > 1e-6 || priceC < 25 || priceC > 1000 || priceC % 25 !== 0) throw new RangeError("Price must be $0.25 to $10, in steps of $0.25.");
  if (n !== values[1] || n < 1 || n > 12) throw new RangeError("Items must be a whole number from 1 to 12.");
  const w = Math.floor(priceC / 100);
  const c = priceC % 100;
  const p1 = n * w * 100;
  const p2 = n * c;
  const total = n * priceC;
  const over = total > BUDGET;
  const changeC = Math.abs(BUDGET - total);
  const both = p1 > 0 && p2 > 0;
  const nAdd = intColumns([p1, p2, total]);
  const nSub = intColumns([BUDGET, total]);
  const addWork = both ? columnsWork(p1, p2, "+", nAdd) : null;
  const subTop = over ? total : BUDGET;
  const subBot = over ? BUDGET : total;
  const subWork = columnsWork(subTop, subBot, "−", nSub);
  return {
    priceC, n, w, c, p1, p2, total, over, changeC, both, nAdd, nSub, addWork, subTop, subBot, subWork,
    value: total / 100,
    priceText: fixed(priceC, 2),
    totalText: fixed(total, 2),
    equation: `$${fixed(priceC, 2)} × ${n} = $${fixed(total, 2)}`,
    /** The place-value mistake: multiply the digits and forget the point. */
    noPoint: c > 0 ? { text: `${priceC} × ${n} = ${commas(priceC * n)}` } : null,
    mistake: both ? misalign(p1, p2, "+") : null,
  };
}

/** @typedef {ReturnType<typeof receiptModel>} ReceiptModel */

/** @param {ReceiptModel} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const es = lang === "es";
  const s = [];
  const centsText = `$0.${String(m.c).padStart(2, "0")}`;
  s.push(es ? `Cada artículo cuesta $${m.priceText} y compramos ${m.n}.` : `Each item costs $${m.priceText} and we buy ${m.n}.`);
  if (m.both) s.push(es ? `Separamos el precio en $${m.w} y $0.${String(m.c).padStart(2, "0")}. Modelo de área: ${m.n} × $${m.w} = $${fixed(m.p1, 2)} y ${m.n} × $0.${String(m.c).padStart(2, "0")} = $${fixed(m.p2, 2)}.` : `We split the price into $${m.w} and $0.${String(m.c).padStart(2, "0")}. Area model: ${m.n} × $${m.w} = $${fixed(m.p1, 2)} and ${m.n} × $0.${String(m.c).padStart(2, "0")} = $${fixed(m.p2, 2)}.`);
  else if (m.p1 > 0) s.push(es ? `El precio son solo dólares enteros, así que hay un producto parcial: ${m.n} × $${m.w} = $${fixed(m.p1, 2)}.` : `The price is whole dollars only, so there is one partial product: ${m.n} × $${m.w} = $${fixed(m.p1, 2)}.`);
  else s.push(es ? `El precio son solo centavos, así que hay un producto parcial: ${m.n} × ${centsText} = $${fixed(m.p2, 2)}.` : `The price is cents only, so there is one partial product: ${m.n} × ${centsText} = $${fixed(m.p2, 2)}.`);
  if (m.addWork) {
    s.push(es ? `Sumamos $${fixed(m.p1, 2)} + $${fixed(m.p2, 2)} con los puntos decimales alineados.` : `We add $${fixed(m.p1, 2)} + $${fixed(m.p2, 2)} with the decimal points lined up.`);
    for (const t of columnNotes(m.addWork, m.nAdd, lang)) s.push(t);
  }
  s.push(es ? `Total del pedido: $${m.totalText}.` : `Order total: $${m.totalText}.`);
  if (m.noPoint) s.push(es ? `No así: ${m.noPoint.text} se olvida del punto; el precio tiene 2 lugares decimales y el total también.` : `Not this: ${m.noPoint.text} forgets the point; the price has 2 decimal places, so the total does too.`);
  if (m.mistake) s.push(es ? `No así: al alinear los últimos dígitos, ${m.mistake.from} se corre a ${m.mistake.to} y sale ${m.mistake.sum}.` : `Not this: lining up the last digits slides ${m.mistake.from} to ${m.mistake.to}, giving ${m.mistake.sum}.`);
  s.push(m.over ? (es ? `Faltan $${fixed(m.changeC, 2)} para $50.00: $${fixed(m.subTop, 2)} − $${fixed(m.subBot, 2)} = $${fixed(m.changeC, 2)}.` : `It is $${fixed(m.changeC, 2)} more than $50.00: $${fixed(m.subTop, 2)} − $${fixed(m.subBot, 2)} = $${fixed(m.changeC, 2)}.`) : (es ? `Cambio de $50.00: $${fixed(m.subTop, 2)} − $${fixed(m.subBot, 2)} = $${fixed(m.changeC, 2)}.` : `Change from $50.00: $${fixed(m.subTop, 2)} − $${fixed(m.subBot, 2)} = $${fixed(m.changeC, 2)}.`));
  for (const t of columnNotes(m.subWork, m.nSub, lang)) s.push(t);
  return s.join(" ");
}

/** The area model: items down the side, whole dollars and cents across the top. @param {ReceiptModel} m @param {number} y @param {number} W @param {"en" | "es"} lang */
function areaModel(m, y, W, lang) {
  const gutL = 72;
  const x0 = PAD + gutL;
  const avail = W - PAD - x0;
  const gap = 8;
  const H = 66;
  const top = y + 26;
  const cents = `$0.${String(m.c).padStart(2, "0")}`;
  /** @type {Array<{ label: string, expr: string, ans: string, fill: string, dashed: boolean }>} */
  const parts = [];
  if (m.w > 0) parts.push({ label: `$${m.w}`, expr: `${m.n} × $${m.w}`, ans: `= $${fixed(m.p1, 2)}`, fill: COPY_FILLS[0], dashed: false });
  if (m.c > 0) parts.push({ label: cents, expr: `${m.n} × ${cents}`, ans: `= $${fixed(m.p2, 2)}`, fill: COPY_FILLS[1], dashed: true });
  const each = parts.length === 2 ? (avail - gap) / 2 : avail;
  let s = "";
  let fixedPart = "";
  parts.forEach((p, i) => {
    const x = x0 + i * (each + gap);
    s += `<g class="dm-anim" data-i="${i}"><rect x="${f1(x)}" y="${top}" width="${f1(each)}" height="${H}" rx="4" fill="${p.fill}" fill-opacity="0.55" stroke="${COLOR.ink}" stroke-width="1.5"${p.dashed ? ' stroke-dasharray="5 3"' : ""}/>`;
    s += text(x + each / 2, top + 27, p.expr, { weight: 700 }) + text(x + each / 2, top + 48, p.ans, { weight: 700 });
    s += `</g>`;
    fixedPart += `<path d="M${f1(x)} ${top - 5} v-5 h${f1(each)} v5" fill="none" stroke="${COLOR.ink}" stroke-width="1.5"/>${text(x + each / 2, top - 14, p.label, { weight: 700 })}`;
  });
  const my = top + H / 2;
  fixedPart += `<path d="M${x0 - 6} ${top} h-5 v${H} h5" fill="none" stroke="${COLOR.ink}" stroke-width="1.5"/>${text(PAD + 28, my + 2, m.n, { size: 18, weight: 700 })}${text(PAD + 28, my + 20, m.n === 1 ? pick(lang, "item", "artículo") : pick(lang, "items", "artículos"), { fill: COLOR.muted })}`;
  return { svg: base(fixedPart) + s, height: 26 + H + 6 };
}

/** @param {ReceiptModel} m @param {{ lang: "en" | "es", width: number }} o */
function render(m, { lang, width }) {
  const W = Math.max(300, Math.min(900, Math.round(width)));
  const inner = W - 2 * PAD;
  let y = PAD;
  let out = "";
  let n = 0;

  // 1 area model
  const h1 = panelHead(y, ++n, pick(lang, "Split the price into dollars and cents", "Separa el precio en dólares y centavos"), W);
  y += h1.height;
  const cents = `$0.${String(m.c).padStart(2, "0")}`;
  const splitSay = m.both ? `$${m.priceText} = $${m.w} + ${cents}` : m.w > 0 ? pick(lang, `$${m.priceText} is whole dollars only.`, `$${m.priceText} son solo dólares enteros.`) : pick(lang, `$${m.priceText} is cents only.`, `$${m.priceText} son solo centavos.`);
  const sp = para(PAD, y + 14, splitSay, { maxPx: inner, weight: 700 });
  y += sp.height + 2;
  const area = areaModel(m, y, W, lang);
  y += area.height;
  const cap = para(PAD, y + 14, pick(lang, "Widths show the split, not the size.", "Los anchos muestran la división, no el tamaño."), { maxPx: inner, fill: COLOR.muted });
  y += cap.height + 8;
  out += panel(n, base(h1.svg + sp.svg + cap.svg) + area.svg);

  // 2 add the partial products
  if (m.addWork) {
    const h2 = panelHead(y, ++n, pick(lang, "Add the partial products with the points lined up", "Suma los productos parciales con los puntos alineados"), W);
    y += h2.height;
    const g = drawColumns({ W, y, lang, ca: m.p1, cb: m.p2, cr: m.total, op: "+", dp: 2, nInt: m.nAdd, topPlaces: placesOf(m.p1), botPlaces: placesOf(m.p2), withResult: true, work: m.addWork });
    y += g.height + 4;
    const lines = [pick(lang, "Dashed zeros are annexed so both show cents.", "Los ceros con borde discontinuo se agregan para que ambos muestren centavos."), ...columnNotes(m.addWork, m.nAdd, lang)];
    let t = "";
    for (const l of lines) {
      const p = para(PAD, y + 14, l, { maxPx: inner, fill: COLOR.muted });
      t += p.svg;
      y += p.height;
    }
    y += 8;
    out += panel(n, base(h2.svg + t) + g.svg);
  }

  // the total (and the two mistakes that differ)
  const ok = okBox(y, W, [pick(lang, `Order total: $${m.totalText}`, `Total del pedido: $${m.totalText}`), m.equation]);
  y += ok.height;
  let tail = ok.svg;
  if (m.noPoint) {
    const nb = notBox(y, W, [pick(lang, `Not this: ${m.noPoint.text}, point forgotten.`, `No así: ${m.noPoint.text}, sin el punto.`), pick(lang, `$${m.priceText} has 2 decimal places, so the total has 2.`, `$${m.priceText} tiene 2 lugares decimales, y el total también.`)]);
    y += nb.height;
    tail += nb.svg;
  }
  if (m.mistake) {
    const nb = notBox(y, W, [pick(lang, "Not this: last digits lined up, not the points.", "No así: alinear los últimos dígitos, no los puntos."), pick(lang, `${m.mistake.from} slides to ${m.mistake.to}, so ${m.mistake.sum}.`, `${m.mistake.from} se corre a ${m.mistake.to}, y sale ${m.mistake.sum}.`)]);
    y += nb.height;
    tail += nb.svg;
  }
  out += panel(n, base(tail));

  // 3 change from $50
  const title = m.over ? pick(lang, "Over $50.00: subtract to see how much more is needed", "Más de $50.00: resta para ver cuánto falta") : pick(lang, "Change from $50.00: subtract the total", "Cambio de $50.00: resta el total");
  const h3 = panelHead(y, ++n, title, W);
  y += h3.height;
  const g3 = drawColumns({ W, y, lang, ca: m.subTop, cb: m.subBot, cr: m.changeC, op: "−", dp: 2, nInt: m.nSub, topPlaces: 2, botPlaces: 2, withResult: true, work: m.subWork });
  y += g3.height + 4;
  const notes3 = m.subWork.regroups ? [...columnNotes(m.subWork, m.nSub, lang), pick(lang, "Dashed boxes show the regrouped digit.", "Los recuadros discontinuos muestran el dígito reagrupado.")] : [pick(lang, "No regrouping is needed.", "No hace falta reagrupar.")];
  let t3 = "";
  for (const l of notes3) {
    const p = para(PAD, y + 14, l, { maxPx: inner, fill: COLOR.muted });
    t3 += p.svg;
    y += p.height;
  }
  y += 6;
  const res = okBox(y, W, [m.over ? pick(lang, `$${fixed(m.changeC, 2)} more is needed`, `Faltan $${fixed(m.changeC, 2)}`) : pick(lang, `Change: $${fixed(m.changeC, 2)}`, `Cambio: $${fixed(m.changeC, 2)}`)]);
  y += res.height;
  out += panel(n, base(h3.svg + t3) + g3.svg + base(res.svg));
  return { body: out, width: W, height: Math.ceil(y + 6) };
}

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "decimal-receipt",
  keys: ["decimal:receipt"],
  title: { en: "Price times items: partial products and place-value columns", es: "Precio por artículos: productos parciales y columnas de valor posicional" },
  controls: () => [
    { label: "Price per item ($)", labelEs: "Precio por artículo ($)", min: 0.25, max: 10, step: 0.25 },
    { label: "Number of items", labelEs: "Número de artículos", min: 1, max: 12, step: 1 },
  ],
  build: (_key, values) => receiptModel(values),
  render,
  scene: (root) => panelScene(root),
  describe,
};

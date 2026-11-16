// Motion figure: shipments (lab model division:shipments, lessons 2-6 and 2-7).
// Slide both points by multiplying the dividend and the divisor by the same power of ten, then long division one step at a time:
// divide, multiply, subtract, bring down. Exact BigInt/Rat arithmetic in decimals-ldiv.mjs; this file only draws and words it.
import { COLOR } from "../tokens.mjs";
import { Rat, commas } from "../exact.mjs";
import { MAX_DP, longDivision } from "./decimals-ldiv.mjs";
import { PAD, anim, base, decimalText, f1, notBox, okBox, panel, panelHead, panelScene, para, pick, scaled, text } from "./decimals-draw.mjs";

/** @param {number} v @param {number} step @param {number} max @param {string} name */
function tenths(v, step, max, name) {
  const t = Math.round(v * 10);
  const s = Math.round(step * 10);
  if (!Number.isFinite(v) || Math.abs(v * 10 - t) > 1e-6 || t < s || t > Math.round(max * 10) || t % s !== 0) throw new RangeError(`${name} must be from ${step} to ${max}, in steps of ${step}.`);
  return t;
}

/** @param {number[]} values */
export function divisionModel(values) {
  if (!Array.isArray(values) || values.length !== 2) throw new RangeError("needs a total supply and a shipment size");
  const A = tenths(values[0], 1.2, 180, "Total supply");
  const B = tenths(values[1], 0.6, 18, "Amount in each shipment");
  const ld = longDivision(A, B);
  const Q = ld.quotient;
  const rounded = decimalText(Q, MAX_DP);
  const r4 = (2n * Q.n * 10n ** BigInt(MAX_DP) + Q.d) / (2n * Q.d);
  const checkProduct = decimalText(new Rat(r4, 10n ** BigInt(MAX_DP)).mul(scaled(B, 1)), 2 * MAX_DP + 2).text;
  const wrongQ = ld.p ? decimalText(Q.div(new Rat(10n)), MAX_DP) : null;
  return {
    A, B, ld,
    value: Number(A) / Number(B),
    aText: decimalText(scaled(A, 1), 1).text,
    bText: decimalText(scaled(B, 1), 1).text,
    quotientText: rounded.text,
    exact: rounded.exact,
    checkProduct,
    wrongValue: wrongQ ? wrongQ.text : null,
    wrongText: wrongQ ? `${wrongQ.exact ? "" : "≈ "}${wrongQ.text}` : null,
  };
}

/** @typedef {ReturnType<typeof divisionModel>} DivisionModel */

/** One step in words, in the student's language. @param {DivisionModel} m @param {import("./decimals-ldiv.mjs").Step} s @param {string} lang */
function sentence(m, s, lang) {
  const { ld } = m;
  const D = String(ld.D);
  let t = "";
  if (s.k === 1 && s.col > 0 && s.col <= ld.lastInt) t += pick(lang, `The first digit is too small, so start with ${s.cur}. `, `El primer dígito es muy pequeño, así que empieza con ${s.cur}. `);
  t += pick(lang, `Divide ${s.cur} ÷ ${D} → ${s.q}.`, `Divide ${s.cur} ÷ ${D} → ${s.q}.`);
  if (s.q > 0n) t += pick(lang, ` Multiply ${s.q} × ${D} = ${s.prod}. Subtract ${s.cur} − ${s.prod} = ${s.rem}.`, ` Multiplica ${s.q} × ${D} = ${s.prod}. Resta ${s.cur} − ${s.prod} = ${s.rem}.`);
  else t += pick(lang, " Write 0 in the quotient.", " Escribe 0 en el cociente.");
  if (s.next !== null) t += s.nextAnnexed ? pick(lang, ` Bring down an added ${s.next}.`, ` Baja un ${s.next} agregado.`) : pick(lang, ` Bring down ${s.next}.`, ` Baja el ${s.next}.`);
  return t;
}

/** The closing notes about zeros, rounding and whole-number remainders. @param {DivisionModel} m @param {string} lang */
function endNotes(m, lang) {
  const { ld } = m;
  /** @type {string[]} */
  const out = [];
  if (ld.annexed > 0) out.push(pick(lang, "Zeros added after the last digit (dashed boxes) do not change the dividend; they let the division go on.", "Los ceros agregados después del último dígito (recuadros discontinuos) no cambian el dividendo; dejan seguir dividiendo."));
  if (!ld.terminates) out.push(pick(lang, `The remainder is still not 0 after ${MAX_DP} decimal places, so the quotient is rounded to ${MAX_DP} places.`, `El residuo sigue sin ser 0 después de ${MAX_DP} lugares decimales, así que el cociente se redondea a ${MAX_DP} lugares.`));
  if (ld.whole && ld.whole.r !== 0n) out.push(pick(lang, `With whole numbers only: quotient ${ld.whole.q}, remainder ${ld.whole.r}.`, `Solo con enteros: cociente ${ld.whole.q}, residuo ${ld.whole.r}.`));
  return out;
}

/** @param {DivisionModel} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const es = lang === "es";
  const { ld } = m;
  const unit = pick(lang, "shipments", "envíos");
  const s = [];
  s.push(es ? `¿Cuántos envíos de ${m.bText} caben en ${m.aText}? Dividimos ${m.aText} ÷ ${m.bText}.` : `How many shipments of ${m.bText} fit in ${m.aText}? We divide ${m.aText} ÷ ${m.bText}.`);
  if (ld.p) s.push(es ? `El divisor ${m.bText} no es entero. Multiplicamos el dividendo y el divisor por 10, y el cociente no cambia: ${commas(ld.A)} ÷ ${ld.D}.` : `The divisor ${m.bText} is not whole. We multiply the dividend and the divisor by 10, and the quotient does not change: ${commas(ld.A)} ÷ ${ld.D}.`);
  else s.push(es ? `El divisor ${m.bText} ya es entero, así que no se mueve ningún punto.` : `The divisor ${m.bText} is already whole, so no point slides.`);
  if (ld.p && m.wrongText) s.push(es ? `No así: mover solo el divisor da ${m.aText} ÷ ${ld.D} ${m.wrongText.startsWith("≈") ? "" : "= "}${m.wrongText}, diez veces menor.` : `Not this: sliding only the divisor gives ${m.aText} ÷ ${ld.D} ${m.wrongText.startsWith("≈") ? "" : "= "}${m.wrongText}, ten times too small.`);
  for (const st of ld.steps) s.push(`${pick(lang, "Step", "Paso")} ${st.k}: ${sentence(m, st, lang)}`);
  s.push(...endNotes(m, lang));
  s.push(es ? `Entonces ${m.aText} ÷ ${m.bText} ${ld.terminates ? "=" : "≈"} ${m.quotientText} ${unit}. Comprobación: ${m.quotientText} × ${m.bText} ${ld.terminates ? "=" : "≈"} ${ld.terminates ? m.aText : m.checkProduct}.` : `So ${m.aText} ÷ ${m.bText} ${ld.terminates ? "=" : "≈"} ${m.quotientText} ${unit}. Check: ${m.quotientText} × ${m.bText} ${ld.terminates ? "=" : "≈"} ${ld.terminates ? m.aText : m.checkProduct}.`);
  return s.join(" ");
}

/** The slide: both numbers times 10, same quotient. @param {DivisionModel} m @param {number} y @param {number} W @param {string} lang */
function slide(m, y, W, lang) {
  const xl = W * 0.27;
  const xr = W * 0.73;
  const mid = W / 2;
  const ny = y + 44;
  const ny2 = y + 124;
  const arrow = (/** @type {number} */ x) => `<path d="M${f1(x)} ${y + 54} V${y + 90}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/><path d="M${f1(x - 5)} ${y + 83} L${f1(x)} ${y + 91} L${f1(x + 5)} ${y + 83}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>${text(x + 9, y + 76, "× 10", { weight: 700, anchor: "start" })}`;
  const fixedPart = text(xl, y + 14, pick(lang, "dividend", "dividendo"), { size: 13, fill: COLOR.muted }) + text(xr, y + 14, pick(lang, "divisor", "divisor"), { size: 13, fill: COLOR.muted }) + text(xl, ny, m.aText, { size: 24, weight: 700 }) + text(mid, ny, "÷", { size: 24, weight: 700 }) + text(xr, ny, m.bText, { size: 24, weight: 700 });
  const moved = `${arrow(xl)}${arrow(xr)}${text(xl, ny2, commas(m.ld.A), { size: 24, weight: 700 })}${text(mid, ny2, "÷", { size: 24, weight: 700 })}${text(xr, ny2, String(m.ld.D), { size: 24, weight: 700 })}`;
  return { fixedPart, moved, height: 140 };
}

/** The long-division layout. Returns the static frame, one animated group per step, and the height. @param {DivisionModel} m @param {number} y @param {number} W @param {string} lang */
function drawLongDivision(m, y, W, lang) {
  const { ld } = m;
  const lenD = String(ld.D).length;
  const xB = PAD + lenD * 13 + 12;
  const x0 = xB + 8;
  const cw = Math.min(30, (W - PAD - x0) / (ld.total + (ld.point ? 0.5 : 0)));
  const gap = ld.point ? cw / 2 : 0;
  /** @param {number} i */
  const cx = (i) => x0 + (i + 0.5) * cw + (ld.point && i > ld.pointAfter ? gap : 0);
  const px = x0 + (ld.pointAfter + 1) * cw + gap / 2;
  const right = x0 + ld.total * cw + gap;
  const yNum = y + 14;
  const yQ = y + 40;
  const yBar = y + 48;
  const yDiv = y + 72;
  const rowH = 40;
  const rows0 = y + 78;
  const DIG = 20;
  let frame = text(xB - 8, yDiv, String(ld.D), { size: DIG, weight: 700, anchor: "end" });
  frame += `<path d="M${f1(xB)} ${yDiv + 8} V${yBar} H${f1(right)}" fill="none" stroke="${COLOR.ink}" stroke-width="2.5"/>`;
  for (let i = 0; i < ld.total; i++) {
    frame += text(cx(i), yDiv, ld.digits[i], { size: DIG, weight: 700, fill: i >= ld.typed ? COLOR.muted : COLOR.ink });
    if (i >= ld.typed) frame += `<rect x="${f1(cx(i) - cw / 2 + 2)}" y="${yDiv - 20}" width="${f1(cw - 4)}" height="27" rx="4" fill="none" stroke="${COLOR.error}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  }
  if (ld.point) frame += `<circle cx="${f1(px)}" cy="${yDiv - 3}" r="2.6" fill="${COLOR.ink}"/><circle cx="${f1(px)}" cy="${yQ - 4}" r="2.6" fill="${COLOR.ink}"/>`;
  if (ld.lead > ld.lastInt) frame += text(cx(ld.lastInt), yQ, 0, { size: DIG, weight: 700 });

  /** @type {string[]} */
  const groups = [];
  let rowIdx = 0;
  const steps = ld.steps;
  steps.forEach((s, j) => {
    let g = text(cx(s.col), yNum, s.k, { size: 13, fill: COLOR.muted }) + text(cx(s.col), yQ, s.q, { size: DIG, weight: 700 });
    if (s.q > 0n) {
      const prodTop = rows0 + rowIdx++ * rowH;
      const pt = String(s.prod);
      for (let c = 0; c < pt.length; c++) g += text(cx(s.col - pt.length + 1 + c), prodTop + 31, pt[c], { size: DIG, weight: 700 });
      const len = Math.max(String(s.cur).length, pt.length);
      const x1 = cx(s.col - len + 1) - cw / 2 + 2;
      const x2 = cx(s.col) + cw / 2 - 2;
      g += `<line x1="${f1(x1)}" y1="${prodTop + 37}" x2="${f1(x2)}" y2="${prodTop + 37}" stroke="${COLOR.ink}" stroke-width="2"/>${text(x1 - 8, prodTop + 30, "−", { size: 16, weight: 700 })}`;
      // the next working number: the next nonzero step's cur, or the last remainder
      const nz = steps.slice(j + 1).find((t) => t.q > 0n);
      const last = steps[steps.length - 1];
      const wtxt = nz ? String(nz.cur) : String(last.rem);
      const wend = nz ? nz.col : last.col;
      const wTop = rows0 + rowIdx++ * rowH;
      for (let c = 0; c < wtxt.length; c++) g += text(cx(wend - wtxt.length + 1 + c), wTop + 31, wtxt[c], { size: DIG, weight: 700 });
      for (let c = s.col + 1; c <= wend; c++) g += text(cx(c), wTop + 9, "↓", { size: 13, fill: COLOR.muted });
    }
    groups.push(g);
  });
  const layoutBottom = rows0 + rowIdx * rowH;
  // the sentences, one per step, inside the same animated group
  let yy = layoutBottom + 14;
  const inner = W - 2 * PAD - 26;
  const final = groups.map((g, j) => {
    const s = steps[j];
    const p = para(PAD + 26, yy + 14, sentence(m, s, lang), { maxPx: inner });
    const num = text(PAD + 10, yy + 14, s.k, { weight: 700 });
    yy += p.height + 6;
    return g + num + p.svg;
  });
  return { frame, groups: final, height: yy - y };
}

/** @param {DivisionModel} m @param {{ lang: "en" | "es", width: number }} o */
function render(m, { lang, width }) {
  const W = Math.max(300, Math.min(900, Math.round(width)));
  const inner = W - 2 * PAD;
  const { ld } = m;
  let y = PAD;
  let out = "";
  let n = 0;
  const ask = para(PAD, y + 14, pick(lang, `How many shipments of ${m.bText} fit in ${m.aText}?`, `¿Cuántos envíos de ${m.bText} caben en ${m.aText}?`), { maxPx: inner, weight: 700 });
  y += ask.height + 8;
  let head = ask.svg;

  // 1 the slide
  if (ld.p || ld.f) {
    const h1 = panelHead(y, ++n, ld.p ? pick(lang, "Multiply both numbers by the same power of 10", "Multiplica los dos números por la misma potencia de 10") : pick(lang, "The divisor is already a whole number", "El divisor ya es un número entero"), W);
    y += h1.height;
    let s1 = "";
    let m1 = "";
    if (ld.p) {
      const sl = slide(m, y, W, lang);
      y += sl.height;
      s1 += sl.fixedPart;
      m1 += anim(0, sl.moved);
      const eq = para(W / 2, y + 14, `${m.aText} ÷ ${m.bText} = ${commas(ld.A)} ÷ ${ld.D}`, { maxPx: inner, weight: 700, anchor: "middle", size: 16 });
      const same = para(PAD, y + 14 + eq.height + 4, pick(lang, "Both numbers become 10 times as big, so the quotient stays the same.", "Los dos números se hacen 10 veces más grandes, así que el cociente no cambia."), { maxPx: inner, fill: COLOR.muted });
      s1 += eq.svg + same.svg;
      y += eq.height + same.height + 12;
    } else {
      const p = para(PAD, y + 14, pick(lang, `${m.bText} is whole, so nothing slides. The point in the quotient goes straight above the point in ${m.aText}.`, `${m.bText} es entero, así que no se mueve ningún punto. El punto del cociente va justo arriba del punto de ${m.aText}.`), { maxPx: inner });
      s1 += p.svg;
      y += p.height + 8;
    }
    let tail = "";
    if (ld.p && m.wrongText) {
      const nb = notBox(y, W, [pick(lang, "Not this: sliding only the divisor.", "No así: mover solo el divisor."), `${m.aText} ÷ ${ld.D} ${m.wrongText.startsWith("≈") ? "" : "= "}${m.wrongText}${pick(lang, ", ten times too small", ", diez veces menor")}`]);
      tail = nb.svg;
      y += nb.height;
    }
    out += panel(n, base(head + h1.svg + s1 + tail) + m1);
    head = "";
  }

  // 2 long division
  const h2 = panelHead(y, ++n, pick(lang, "Divide one digit at a time", "Divide un dígito a la vez"), W);
  y += h2.height;
  const ld2 = drawLongDivision(m, y, W, lang);
  y += ld2.height + 4;
  let notes = "";
  for (const t of endNotes(m, lang)) {
    const p = para(PAD, y + 14, t, { maxPx: inner, fill: COLOR.muted });
    notes += p.svg;
    y += p.height + 2;
  }
  y += 8;
  out += panel(n, base(head + h2.svg + ld2.frame + notes) + ld2.groups.map((g, i) => anim(i, g)).join(""));

  // answer
  const unit = pick(lang, "shipments", "envíos");
  const eq = `${m.aText} ÷ ${m.bText} ${ld.terminates ? "=" : "≈"} ${m.quotientText} ${unit}`;
  const chk = ld.terminates ? `${m.quotientText} × ${m.bText} = ${m.aText}` : `${m.quotientText} × ${m.bText} = ${m.checkProduct}${pick(lang, ", about ", ", casi ")}${m.aText}`;
  const ok = okBox(y, W, [eq, `${pick(lang, "Check", "Comprobación")}: ${chk}`]);
  y += ok.height;
  out += panel(n, base(ok.svg));
  return { body: out, width: W, height: Math.ceil(y + 6) };
}

const figure = {
  id: "division-shipments",
  keys: ["division:shipments"],
  title: { en: "Long division, one step at a time", es: "División larga, un paso a la vez" },
  controls: () => [
    { label: "Total supply", labelEs: "Suministro total", min: 1.2, max: 180, step: 1.2 },
    { label: "Amount in each shipment", labelEs: "Cantidad en cada envío", min: 0.6, max: 18, step: 0.6 },
  ],
  build: (_key, values) => divisionModel(values),
  render,
  scene: (/** @type {ParentNode} */ root) => panelScene(root),
  describe,
  /** The quotient the lab shows (rounded to 4 places when it does not end). @param {DivisionModel} m @param {"en" | "es"} lang */
  headline: (m, lang) => ({ label: pick(lang, "Equal shipments", "Envíos iguales"), value: m.quotientText, approx: !m.ld.terminates }),
  /** The dashed card: only the divisor's point slid. Null when the divisor is already whole. @param {DivisionModel} m @param {"en" | "es"} lang */
  wrong: (m, lang) => (m.wrongValue ? { value: m.wrongValue, say: pick(lang, "Slid the decimal point in the divisor only, not in the dividend.", "Moviste el punto decimal solo en el divisor, no en el dividendo.") } : null),
};

export default /** @type {import("./mount.mjs").Figure} */ (figure);

// factors:lcm (6-12, 6-13). Hops of each size from 0 on two number lines that meet at the first shared landing (the LCM); then each number is
// split into primes with a factor tree, and the shared primes (counted once) plus the leftovers rebuild the LCM. The dashed card is "just multiply".
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { factorsControls, factorsModel, primesOf, show } from "./expressions-factors-math.mjs";
import { INNER, PAD, badge, clampW, f1, frame, group, part, pick, pill, plural, stepScene, text, textLines, tw, wrapChain, wrapWords } from "./expressions-kit.mjs";

/** @typedef {import("./expressions-factors-math.mjs").FactorsModel} M */

/** Which landing numbers get a label so none touch. @param {number} hops @param {number} step @param {number} unit */
function labelled(hops, step, unit) {
  const every = Math.max(1, Math.ceil(46 / (step * unit)));
  /** @type {number[]} */
  const ks = [];
  for (let k = 0; k < hops; k += every) if ((hops - k) * step * unit >= 46 || k === 0) ks.push(k);
  if (ks.length > 1 && (hops - ks[ks.length - 1]) * step * unit < 46) ks.pop();
  ks.push(hops);
  return ks;
}

/**
 * One factor tree (a comb: each composite splits into its smallest prime and the rest), centred in a box.
 * @param {number} n @param {number} bx box left @param {number} bw box width @param {number} ty top @param {"en" | "es"} lang
 */
function tree(n, bx, bw, ty, lang) {
  const r = 13;
  const ps = primesOf(n);
  const k = ps.length;
  const node = (/** @type {number} */ v, /** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ prime) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${prime ? COPY_FILLS[0] : COLOR.white}" fill-opacity="${prime ? 0.75 : 1}" stroke="${COLOR.ink}" stroke-width="${prime ? 2.4 : 1.2}"/>${text(x, y + 5, String(v), { size: 13, weight: prime ? 700 : 400 })}`;
  if (k === 1) {
    const c = node(n, bx + bw / 2, ty + r, true);
    return { svg: part(2, c), h: 2 * r, words: pick(lang, `${n} is prime`, `${n} es primo`), chain: "" };
  }
  const dx = Math.min(26, (bw - 2 * r - 2) / k);
  const dy = 31;
  const xs = bx + r + 1 + dx;
  let edges = "";
  let nodes = "";
  let rest = n;
  for (let i = 0; i < k - 1; i++) {
    const x = xs + i * dx;
    const y = ty + r + i * dy;
    edges += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - dx)}" y2="${f1(y + dy)}" stroke="${COLOR.ink}" stroke-width="1.4"/><line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x + dx)}" y2="${f1(y + dy)}" stroke="${COLOR.ink}" stroke-width="1.4"/>`;
    nodes += node(rest, x, y, false) + node(ps[i], x - dx, y + dy, true);
    rest /= ps[i];
  }
  nodes += node(rest, xs + (k - 1) * dx, ty + r + (k - 1) * dy, true);
  return { svg: part(2, edges + nodes), h: (k - 1) * dy + 2 * r, words: "", chain: `${n} = ${ps.join(" × ")}` };
}

/**
 * @param {M} m @param {{ lang: "en" | "es", width: number }} o
 */
export function renderLcm(m, o) {
  const { lang } = o;
  const W = clampW(o.width);
  const cw = W - 2 * PAD;
  const inX = PAD + INNER;
  const inW = cw - 2 * INNER;
  const term = pick(lang, "LCM", "mcm");
  let y = PAD;
  let body = "";

  // 1: hops on two number lines
  {
    const top = y;
    const head = `${badge(PAD + 20, top + 22, 1)}${text(PAD + 40, top + 28, pick(lang, "Hop until they meet", "Salta hasta coincidir"), { size: 16, weight: 700, anchor: "start" })}`;
    const x0 = inX + 10;
    const x1 = inX + inW - 12;
    const unit = (x1 - x0) / m.lcm;
    const X = (/** @type {number} */ v) => x0 + v * unit;
    const flagText = pick(lang, `they meet at ${show(m.lcm)}`, `coinciden en ${show(m.lcm)}`);
    const flagHalf = tw(flagText, 14, 700) / 2;
    const flag = text(Math.max(PAD + flagHalf, Math.min(W - PAD - flagHalf, X(m.lcm))), top + 54, flagText, { size: 14, weight: 700, fill: COLOR.tealInk });
    let lanes = "";
    let cy = top + 78;
    const laneTop = cy;
    for (const [step, hops, dashed] of /** @type {const} */ ([[m.a, m.hopsA, false], [m.b, m.hopsB, true]])) {
      lanes += text(inX, cy, pick(lang, `Hops of ${step}: ${hops} × ${step} = ${show(m.lcm)}`, `Saltos de ${step}: ${hops} × ${step} = ${show(m.lcm)}`), { size: 14, weight: 700, anchor: "start" });
      const ay = cy + 42;
      const hp = step * unit;
      const rise = Math.min(26, 3 + hp * 0.4);
      let axis = `<path d="M${f1(x0)} ${f1(ay)}H${f1(x1)}" stroke="${COLOR.ink}" stroke-width="1.6" fill="none"/>`;
      for (let k = 0; k <= hops; k++) axis += `<circle cx="${f1(X(k * step))}" cy="${f1(ay)}" r="3" fill="${COLOR.ink}"/>`;
      let arcs = "";
      for (let k = 0; k < hops; k++) {
        const s = X(k * step);
        const e = X((k + 1) * step);
        arcs += part(1, `<path d="M${f1(s)} ${f1(ay)}Q${f1((s + e) / 2)} ${f1(ay - 2 * rise)} ${f1(e)} ${f1(ay)}" fill="none" stroke="${dashed ? COLOR.ink : COLOR.tealInk}" stroke-width="2.2"${dashed ? ' stroke-dasharray="5 3"' : ""}/>`);
      }
      let nums = "";
      for (const k of labelled(hops, step, unit)) nums += text(Math.max(PAD + 8, Math.min(W - PAD - 8, X(k * step))), ay + 19, show(k * step), { size: 13, weight: k === hops ? 700 : 400 });
      lanes += axis + arcs + nums;
      cy += 42 + 48;
    }
    const mx = f1(X(m.lcm));
    const axisA = laneTop + 42;
    const axisB = laneTop + 90 + 42;
    const seg = (/** @type {number} */ y1, /** @type {number} */ y2) => `<line x1="${mx}" y1="${y1}" x2="${mx}" y2="${y2}" stroke="${COLOR.tealInk}" stroke-width="2" stroke-dasharray="3 3"/>`;
    const meet = seg(top + 60, axisA - 2) + seg(axisA + 26, axisB);
    const cap = textLines(inX, cy + 2, wrapWords(pick(lang, "Both start at 0. The first place the hops land together is the LCM.", "Los dos empiezan en 0. El primer lugar donde los saltos coinciden es el mcm."), inW, 13), 17, { size: 13, anchor: "start", fill: COLOR.muted });
    const h = cap.y - top - 4;
    body += group(1, `${frame(PAD, top, cw, h)}${head}${flag}${meet}${lanes}${cap.svg}`);
    y = top + h + 10;
  }

  // 2: factor trees
  {
    const top = y;
    const head = `${badge(PAD + 20, top + 22, 2)}${text(PAD + 40, top + 28, pick(lang, "Split into primes", "Descompón en primos"), { size: 16, weight: 700, anchor: "start" })}`;
    const boxW = (inW - 8) / 2;
    const ta = tree(m.a, inX, boxW, top + 46, lang);
    const tb = tree(m.b, inX + boxW + 8, boxW, top + 46, lang);
    const facts = [ta, tb].map((t) => t.words || t.chain);
    const ua = textLines(inX, top + 46 + Math.max(ta.h, tb.h) + 24, facts, 19, { size: 15, weight: 700, anchor: "start" });
    const legend = textLines(inX, ua.y + 2, wrapWords(pick(lang, "Filled circles are primes: they cannot split again.", "Los círculos rellenos son primos: ya no se pueden dividir."), inW, 13), 17, { size: 13, anchor: "start", fill: COLOR.muted });
    const h = legend.y - top - 4;
    body += group(2, `${frame(PAD, top, cw, h)}${head}${ta.svg}${tb.svg}${ua.svg}${legend.svg}`);
    y = top + h + 10;
  }

  // 3: rebuild the LCM from the primes
  {
    const top = y;
    const head = `${badge(PAD + 20, top + 22, 3)}${text(PAD + 40, top + 28, pick(lang, "Build the LCM", "Arma el mcm"), { size: 16, weight: 700, anchor: "start" })}`;
    const gut = 46;
    const n = m.cols.length;
    const slot = (inW - gut) / n;
    const d = Math.min(26, slot - 4);
    const r = d / 2;
    const cx = (/** @type {number} */ i) => inX + gut + slot * (i + 0.5);
    const rowY = [top + 66, top + 104, top + 156];
    const tok = (/** @type {number} */ p, /** @type {number} */ i, /** @type {number} */ yy, /** @type {boolean} */ solid) => `<circle cx="${f1(cx(i))}" cy="${f1(yy)}" r="${f1(r)}" fill="${solid ? COPY_FILLS[0] : COLOR.white}" fill-opacity="${solid ? 0.75 : 1}" stroke="${COLOR.ink}" stroke-width="${solid ? 2.4 : 1.4}"${solid ? "" : ' stroke-dasharray="3.5 2.5"'}/>${text(cx(i), yy + 5, String(p), { size: 13, weight: 700 })}`;
    let shade = "";
    let rowsSvg = `${text(inX + gut - 8, rowY[0] + 5, String(m.a), { size: 14, weight: 700, anchor: "end" })}${text(inX + gut - 8, rowY[1] + 5, String(m.b), { size: 14, weight: 700, anchor: "end" })}${text(inX + gut - 8, rowY[2] + 5, term, { size: 14, weight: 700, anchor: "end" })}`;
    m.cols.forEach((c, i) => {
      const both = c.inA && c.inB;
      if (both) shade += `<rect x="${f1(cx(i) - slot / 2 + 1)}" y="${top + 44}" width="${f1(slot - 2)}" height="${rowY[2] - top - 44 + 22}" rx="6" fill="${COPY_FILLS[0]}" fill-opacity="0.22"/><line x1="${f1(cx(i))}" y1="${f1(rowY[0] + r)}" x2="${f1(cx(i))}" y2="${f1(rowY[1] - r)}" stroke="${COLOR.ink}" stroke-width="2"/>`;
      let col = "";
      if (c.inA) col += tok(c.p, i, rowY[0], both);
      if (c.inB) col += tok(c.p, i, rowY[1], both);
      col += tok(c.p, i, rowY[2], both);
      rowsSvg += part(3, col);
    });
    const eq = textLines(inX, rowY[2] + 46, wrapChain(`${m.cols.map((c) => c.p).join(" × ")} = ${show(m.productCols)}`, inW, 15), 19, { size: 15, weight: 700, anchor: "start" });
    const key = textLines(inX, eq.y + 2, wrapWords(pick(lang, "Shaded: both numbers have it, so it is used once. Dashed: only one number has it, so it is kept.", "Sombreado: los dos números lo tienen, así que se usa una vez. Con línea punteada: solo uno lo tiene, así que se conserva."), inW, 13), 17, { size: 13, anchor: "start", fill: COLOR.muted });
    const h = key.y - top - 4;
    body += group(3, `${frame(PAD, top, cw, h)}${head}${shade}${rowsSvg}${eq.svg}${key.svg}`);
    y = top + h + 10;
  }

  // 4: "just multiply" (only when the product is not the LCM)
  if (m.gcf > 1) {
    const prod = show(m.a * m.b);
    const p = pill(PAD, y, cw, false, wrapWords(pick(lang, `${m.a} × ${m.b} = ${prod} is a common multiple, but not the least. They meet at ${show(m.lcm)} first.`, `${m.a} × ${m.b} = ${prod} es un múltiplo común, pero no el menor. Primero coinciden en ${show(m.lcm)}.`), cw - 50, 14, 700));
    body += group(4, p.svg);
    y += p.h;
  } else y -= 10;
  return { body, width: W, height: Math.ceil(y + PAD) };
}

/** @param {M} m @param {"en" | "es"} lang */
export function describeLcm(m, lang) {
  const es = lang === "es";
  const term = es ? "mcm" : "LCM";
  const fac = (/** @type {number} */ n) => (primesOf(n).length === 1 ? (es ? `${n} es primo` : `${n} is prime`) : `${n} = ${primesOf(n).join(" × ")}`);
  const out = [];
  out.push(es ? `Un saltador da saltos de ${m.a} y otro saltos de ${m.b}, los dos desde 0. El de ${m.a} cae en ${m.hopsA} ${plural(m.hopsA, "salto", "saltos")} de ${m.a} en ${show(m.lcm)}, y el de ${m.b} en ${m.hopsB} ${plural(m.hopsB, "salto", "saltos")} de ${m.b}: ${m.hopsA} × ${m.a} = ${show(m.lcm)} y ${m.hopsB} × ${m.b} = ${show(m.lcm)}. ${show(m.lcm)} es el primer lugar donde coinciden: el ${term}.` : `One jumper hops by ${m.a} and another by ${m.b}, both from 0. The first lands on ${show(m.lcm)} after ${m.hopsA} ${plural(m.hopsA, "hop", "hops")} of ${m.a}, and the second after ${m.hopsB} ${plural(m.hopsB, "hop", "hops")} of ${m.b}: ${m.hopsA} × ${m.a} = ${show(m.lcm)} and ${m.hopsB} × ${m.b} = ${show(m.lcm)}. ${show(m.lcm)} is the first place they land together: the ${term}.`);
  out.push(es ? `Árbol de factores: ${fac(m.a)}. ${fac(m.b)}.` : `Factor trees: ${fac(m.a)}. ${fac(m.b)}.`);
  const shared = m.cols.filter((c) => c.inA && c.inB).map((c) => c.p);
  out.push(es ? `Los primos que tienen los dos números (${shared.length ? shared.join(", ") : "ninguno"}) se usan una vez; los demás se conservan. Entonces el ${term} es ${m.cols.map((c) => c.p).join(" × ")} = ${show(m.productCols)}.` : `The primes both numbers have (${shared.length ? shared.join(", ") : "none"}) are used once; the others are kept. So the ${term} is ${m.cols.map((c) => c.p).join(" × ")} = ${show(m.productCols)}.`);
  if (m.gcf > 1) out.push(es ? `${m.a} × ${m.b} = ${show(m.a * m.b)} es un múltiplo común, pero no el menor. Primero coinciden en ${show(m.lcm)}.` : `${m.a} × ${m.b} = ${show(m.a * m.b)} is a common multiple, but not the least. They meet at ${show(m.lcm)} first.`);
  return out.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
export const lcmFigure = {
  id: "factors-hops-primes-lcm",
  keys: ["factors:lcm"],
  title: { en: "Hops that meet, and the primes behind them", es: "Saltos que coinciden y los primos detrás" },
  controls: () => factorsControls(),
  build: (_key, values) => {
    const m = factorsModel(values);
    return { ...m, steps: m.gcf > 1 ? 4 : 3 };
  },
  render: (model, o) => renderLcm(model, o),
  scene: (root, model) => stepScene(root, model.steps),
  describe: (model, lang) => describeLcm(model, lang),
};

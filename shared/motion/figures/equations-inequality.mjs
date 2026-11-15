// inequality:entry, inequality:budget, inequality:graph. An inequality built on a number line in three steps: the boundary circle
// (closed when the boundary counts, open when it does not), the shaded ray toward the solutions, and a test value marked as
// qualifying or not with a symbol and a word. The common wrong move, the other circle type, is a dashed second line.
// values = [boundary, test value]. The lab's Rule menu is not part of `values`, so each key uses the lab's default rule:
// entry reads x >= boundary; budget and graph read x <= boundary (the same defaults math.mjs and the graph model use).
import { COLOR } from "../tokens.mjs";
import { KF, all, checkPath, crossPath, f1, para, pick, text, textW, whole } from "./equations-kit.mjs";

const KEYS = ["inequality:entry", "inequality:budget", "inequality:graph"];
const PAD = 14;
const MIN = -1;
const MAX = 31;
const SHOWN = { ">=": "≥", ">": ">", "<=": "≤", "<": "<" };

/** @param {string} key @returns {">=" | "<="} */
const ruleFor = (key) => {
  if (!KEYS.includes(key)) throw new RangeError(`not an inequality model: ${key}`);
  return key === "inequality:entry" ? ">=" : "<=";
};

const controls = () => [
  { label: "Boundary", labelEs: "Límite", min: 1, max: 24, step: 1 },
  { label: "Test value", labelEs: "Valor de prueba", min: 0, max: 30, step: 1 },
];

/** @param {">=" | ">" | "<=" | "<"} sym @param {number} b @param {number} a */
const holds = (sym, b, a) => ({ ">=": b >= a, ">": b > a, "<=": b <= a, "<": b < a })[sym];
/** @param {">=" | ">" | "<=" | "<"} sym @returns {">=" | ">" | "<=" | "<"} the same direction with the other circle type */
const otherCircle = (sym) => ({ ">=": ">", ">": ">=", "<=": "<", "<": "<=" })[sym];

/** @param {string} key @param {number[]} values */
function build(key, values) {
  const sym = ruleFor(key);
  const [a, b] = values;
  whole(a, 1, 24, "The boundary");
  whole(b, 0, 30, "The test value");
  const wrong = otherCircle(sym);
  return {
    key,
    sym,
    a,
    b,
    closed: sym.includes("="),
    right: sym.startsWith(">"),
    pass: holds(sym, b, a),
    /** the lab's headline is the test value */
    value: b,
    wrong,
    wrongPass: holds(wrong, b, a),
  };
}

/** @typedef {ReturnType<typeof build>} Model */

/** @param {Model} m @param {string} lang */
function words(m, lang) {
  const s = SHOWN[m.sym];
  const w = SHOWN[m.wrong];
  const dir = m.right ? pick(lang, "or more", "o más") : pick(lang, "or less", "o menos");
  const dirStrict = m.right ? pick(lang, "more than", "más de") : pick(lang, "less than", "menos de");
  const ctx = m.key === "inequality:budget" ? pick(lang, "spend", "gasta") : m.key === "inequality:entry" ? pick(lang, "entry rule", "regla de entrada") : "";
  const rule = `x ${s} ${m.a}`;
  return {
    rule,
    ctx,
    ruleWords: pick(lang, `x ${s} ${m.a} means x is ${m.a} ${dir}.`, `x ${s} ${m.a} significa que x es ${m.a} ${dir}.`),
    circle: m.closed ? pick(lang, `closed circle: ${m.a} is included`, `círculo cerrado: ${m.a} sí cuenta`) : pick(lang, `open circle: ${m.a} is not included`, `círculo abierto: ${m.a} no cuenta`),
    solutions: m.closed
      ? pick(lang, `every number ${m.a} ${dir}`, `todos los números ${m.a} ${dir}`)
      : pick(lang, `every number ${dirStrict} ${m.a}`, `todos los números ${m.right ? "mayores" : "menores"} que ${m.a}`),
    step1: m.closed
      ? pick(lang, `Mark the boundary ${m.a}. Closed circle, because ${m.a} counts.`, `Marca el límite ${m.a}. Círculo cerrado, porque ${m.a} sí cuenta.`)
      : pick(lang, `Mark the boundary ${m.a}. Open circle, because ${m.a} does not count.`, `Marca el límite ${m.a}. Círculo abierto, porque ${m.a} no cuenta.`),
    step2: m.right ? pick(lang, `Shade to the right: x is ${m.closed ? `${m.a} or more` : dirStrict + ` ${m.a}`}.`, `Sombrea hacia la derecha: x es ${m.closed ? `${m.a} o más` : `${dirStrict} ${m.a}`}.`) : pick(lang, `Shade to the left: x is ${m.closed ? `${m.a} or less` : dirStrict + ` ${m.a}`}.`, `Sombrea hacia la izquierda: x es ${m.closed ? `${m.a} o menos` : `${dirStrict} ${m.a}`}.`),
    step3: m.pass
      ? pick(lang, `Test ${m.b}: ${m.b} ${s} ${m.a} is true, so ${m.b} qualifies.`, `Prueba ${m.b}: ${m.b} ${s} ${m.a} es verdadero, así que ${m.b} sí califica.`)
      : pick(lang, `Test ${m.b}: ${m.b} ${s} ${m.a} is false, so ${m.b} does not qualify.`, `Prueba ${m.b}: ${m.b} ${s} ${m.a} es falso, así que ${m.b} no califica.`),
    testWord: pick(lang, `test x = ${m.b}`, `prueba x = ${m.b}`),
    verdict: m.pass ? pick(lang, "qualifies", "sí califica") : pick(lang, "does not qualify", "no califica"),
    wrongTitle: pick(lang, "Not this: the other circle", "No así: el otro círculo"),
    wrongRule: `x ${w} ${m.a}`,
    wrongText: m.wrong.includes("=")
      ? pick(lang, `A closed circle keeps ${m.a} in. The rule ${s} leaves it out, so the circle is open.`, `Un círculo cerrado incluiría el ${m.a}. La regla ${s} lo deja fuera, así que el círculo va abierto.`)
      : pick(lang, `An open circle leaves ${m.a} out. The rule ${s} keeps it in, so the circle is closed.`, `Un círculo abierto dejaría fuera el ${m.a}. La regla ${s} lo incluye, así que el círculo va cerrado.`),
    wrongCircle: m.wrong.includes("=") ? pick(lang, "closed circle", "círculo cerrado") : pick(lang, "open circle", "círculo abierto"),
    wrongTest: m.wrongPass === m.pass ? "" : pick(lang, `It would mark ${m.b} as ${m.wrongPass ? "qualifying" : "not qualifying"}, which is wrong.`, `Marcaría ${m.b} como ${m.wrongPass ? "que sí califica" : "que no califica"}, y eso es un error.`),
  };
}

/**
 * One number line. `tag` is the data-hook group for animation.
 * @param {Model} m @param {number} W @param {number} y axis baseline @param {{ sym: ">=" | ">" | "<=" | "<", dashed: boolean, test: boolean, lang: string, wd: ReturnType<typeof words> }} o
 */
function numberLine(m, W, y, o) {
  const xl = PAD + 8;
  const xr = W - PAD - 8;
  const sx = (/** @type {number} */ n) => xl + ((n - MIN) / (MAX - MIN)) * (xr - xl);
  const closed = o.sym.includes("=");
  const right = o.sym.startsWith(">");
  const xa = sx(m.a);
  const dash = o.dashed ? ' stroke-dasharray="7 5"' : "";
  const ink = o.dashed ? COLOR.error : COLOR.ink;
  let svg = `<line x1="${f1(xl)}" y1="${y}" x2="${f1(xr)}" y2="${y}" stroke="${COLOR.ink}" stroke-width="2"/>`;
  for (let n = 0; n <= 30; n++) {
    const major = n % 5 === 0;
    svg += `<line x1="${f1(sx(n))}" y1="${y - (major ? 8 : 4)}" x2="${f1(sx(n))}" y2="${y + (major ? 8 : 4)}" stroke="${COLOR.ink}" stroke-width="${major ? 1.6 : 1}"/>`;
    if (major && Math.abs(n - m.a) > 1.5) svg += text(sx(n), y + 26, String(n), { size: 13, fill: COLOR.muted });
  }
  svg += text(xa, y + 26, String(m.a), { size: 14, weight: 700 });
  // the ray: a thick line to the end of the axis and an arrowhead that points toward the solutions
  const tip = right ? xr + 8 : xl - 8;
  const base = right ? xr - 4 : xl + 4;
  const ray = `<line x1="${f1(xa)}" y1="${y}" x2="${f1(base)}" y2="${y}" stroke="${ink}" stroke-width="6"${dash}/><polygon points="${f1(base)},${y - 9} ${f1(base)},${y + 9} ${f1(tip)},${y}" fill="${ink}"/>`;
  svg += `<g class="eq-ray" data-dir="${right ? "right" : "left"}">${ray}</g>`;
  svg += `<g class="eq-circle"><circle cx="${f1(xa)}" cy="${y}" r="9" fill="${closed ? ink : COLOR.white}" stroke="${ink}" stroke-width="3"/></g>`;
  if (o.test) {
    const xb = sx(m.b);
    const pass = m.pass;
    const mark = pass ? `fill="${COLOR.success}" stroke="${COLOR.ink}" stroke-width="1.5"` : `fill="${COLOR.white}" stroke="${COLOR.error}" stroke-width="3"`;
    const word = o.wd.verdict;
    const label = o.wd.testWord;
    const cw = Math.max(textW(label, 14, 700), textW(word, 14, 700) + 22) / 2;
    const cx = Math.max(PAD + cw, Math.min(W - PAD - cw, xb));
    let t = `<polygon points="${f1(xb - 9)},${y - 38} ${f1(xb + 9)},${y - 38} ${f1(xb)},${y - 16}" ${mark}/>`;
    t += text(cx, y - 70, label, { size: 14, weight: 700 });
    const wordW = textW(word, 14, 700);
    t += text(cx + 11, y - 50, word, { size: 14, weight: 700, fill: pass ? COLOR.success : COLOR.error });
    t += pass ? checkPath(cx + 11 - wordW / 2 - 22, y - 53) : crossPath(cx + 11 - wordW / 2 - 20, y - 59);
    svg += `<g class="eq-test">${t}</g>`;
  }
  return svg;
}

/** @param {Model} m @param {{ lang: "en" | "es", width: number }} o */
function render(m, { lang, width }) {
  const W = Math.max(300, Math.min(900, Math.round(width)));
  const wd = words(m, lang);
  const maxW = W - 2 * PAD - 8;
  let body = "";
  // title: the rule itself, with its context word
  body += text(W / 2, 30, wd.rule, { size: 24, weight: 700 });
  if (wd.ctx) body += text(W / 2, 50, `(${wd.ctx})`, { size: 13, fill: COLOR.muted });
  const axisY = 140;
  body += numberLine(m, W, axisY, { sym: m.sym, dashed: false, test: true, lang, wd });
  // labels that say what the picture means
  const xa = PAD + 8 + ((m.a - MIN) / (MAX - MIN)) * (W - 2 * PAD - 16);
  const cl = textW(wd.circle, 14, 700) / 2;
  body += `<g class="eq-circle">${text(Math.max(PAD + cl, Math.min(W - PAD - cl, xa)), axisY + 48, wd.circle, { size: 14, weight: 700 })}</g>`;
  const from = m.right ? xa + 12 : PAD + 8;
  const to = m.right ? W - PAD - 8 : xa - 12;
  let rl = "";
  if (to - from >= 20) rl += `<line x1="${f1(from)}" y1="${axisY + 62}" x2="${f1(to)}" y2="${axisY + 62}" stroke="${COLOR.ink}" stroke-width="1.5"/><line x1="${f1(from)}" y1="${axisY + 56}" x2="${f1(from)}" y2="${axisY + 68}" stroke="${COLOR.ink}" stroke-width="1.5"/><line x1="${f1(to)}" y1="${axisY + 56}" x2="${f1(to)}" y2="${axisY + 68}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  const half = Math.min(maxW, Math.max(150, to - from)) / 2;
  const sl = para(Math.max(PAD + half, Math.min(W - PAD - half, (from + to) / 2)), axisY + 84, [wd.solutions], { size: 14, maxW: half * 2, weight: 700 });
  body += `<g class="eq-ray">${rl}${sl.svg}</g>`;
  // the three steps, each its own line
  let y = Math.max(sl.y, axisY + 112) + 12;
  [wd.step1, wd.step2, wd.step3].forEach((s, i) => {
    const p = para(PAD + 30, y + 14, [s], { size: 14, maxW: maxW - 30, anchor: "start" });
    body += `<g class="eq-step" data-step="${i + 1}"><circle cx="${PAD + 12}" cy="${y + 9}" r="11" fill="${COLOR.navy}"/>${text(PAD + 12, y + 14, String(i + 1), { size: 13, weight: 700, fill: COLOR.white })}${p.svg}</g>`;
    y = p.y + 6;
  });
  // the wrong move: the other circle on a dashed line, in its own dashed box
  const boxTop = y + 6;
  const wrongLine = numberLine(m, W, boxTop + 70, { sym: m.wrong, dashed: true, test: false, lang, wd });
  const wr = para(W / 2, boxTop + 142, [wd.wrongText, ...(wd.wrongTest ? [wd.wrongTest] : [])], { size: 14, maxW: maxW - 12 });
  const boxH = wr.y - boxTop + 2;
  body += `<g class="eq-wrong"><rect x="${PAD}" y="${f1(boxTop)}" width="${W - 2 * PAD}" height="${f1(boxH)}" rx="10" fill="none" stroke="${COLOR.error}" stroke-width="2" stroke-dasharray="6 4"/>${crossPath(PAD + 10, boxTop + 10)}${text(PAD + 30, boxTop + 22, `${wd.wrongTitle}: ${wd.wrongRule}`, { size: 14, weight: 700, anchor: "start", fill: COLOR.error })}${wrongLine}${text(W / 2, boxTop + 118, wd.wrongCircle, { size: 13, weight: 700, fill: COLOR.error })}${wr.svg}</g>`;
  return { body, width: W, height: Math.ceil(boxTop + boxH + PAD) };
}

/** @param {ParentNode} root @param {Model} _m */
function scene(root, _m) {
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  const rays = all(root, ".eq-ray");
  const grow = (/** @type {Element} */ el) => {
    const origin = el.getAttribute("data-dir") === "left" ? "right center" : "left center";
    return [
      { opacity: 0, transform: "scaleX(0.05)", transformBox: "fill-box", transformOrigin: origin },
      { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: origin },
    ];
  };
  const mainRay = rays.filter((e) => e.getAttribute("data-dir") && e.closest(".eq-wrong") === null);
  const step = (/** @type {number} */ i) => all(root, `.eq-step[data-step="${i}"]`);
  const circles = all(root, ".eq-circle").filter((e) => e.closest(".eq-wrong") === null);
  tracks.push({ els: step(1), from: 0, to: 0.12, keyframes: KF.rise });
  tracks.push({ els: circles, from: 0.04, to: 0.22, keyframes: KF.pop });
  tracks.push({ els: step(2), from: 0.25, to: 0.37, keyframes: KF.rise });
  for (const r of mainRay) tracks.push({ els: [r], from: 0.28, to: 0.55, keyframes: grow(r) });
  tracks.push({ els: all(root, ".eq-ray:not([data-dir])"), from: 0.5, to: 0.62, keyframes: KF.fade });
  tracks.push({ els: step(3), from: 0.62, to: 0.74, keyframes: KF.rise });
  tracks.push({ els: all(root, ".eq-test"), from: 0.66, to: 0.86, keyframes: [{ opacity: 0, transform: "translateY(-14px)" }, { opacity: 1, transform: "none" }] });
  tracks.push({ els: all(root, ".eq-wrong"), from: 0.84, to: 1, keyframes: KF.fade });
  return { durationMs: 5200, tracks: tracks.filter((t) => t.els.length) };
}

/** @param {Model} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const wd = words(m, lang);
  const es = lang === "es";
  const out = [
    es ? `Una recta numérica muestra la regla ${wd.rule}. ${wd.ruleWords}` : `A number line shows the rule ${wd.rule}. ${wd.ruleWords}`,
    `${wd.step1} ${wd.step2}`,
    `${wd.step3}`,
    `${wd.wrongTitle}: ${wd.wrongRule}. ${wd.wrongText} ${wd.wrongTest}`,
  ];
  return out.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "inequality-number-line",
  keys: KEYS,
  title: { en: "An inequality on a number line", es: "Una desigualdad en la recta numérica" },
  controls,
  build,
  render,
  scene,
  describe,
};

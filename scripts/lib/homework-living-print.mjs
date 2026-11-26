// Pure static end-state SVG cards for each living-scene play on the family
// take-home print sheet (.refrigerator-sheet-print-container).
// Every number is computed directly from the lesson's own livingScene config;
// uses only print-safe tokens/palette (navy #17324D, teal #1FA6A2, amber #E9A23B, ink #24323F).

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const NAVY = "#17324D";
const TEAL = "#1FA6A2";
const TEAL_DARK = "#0B6E6B";
const AMBER = "#E9A23B";
const AMBER_DARK = "#8A5A00";
const RULE = "#D9D2C3";
const BG = "#FFFFFF";

const svgWrap = (w, h, body, label) =>
  `<svg class="rf-living-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="8" fill="${BG}" stroke="${RULE}" stroke-width="1.5"/>${body}</svg>`;

function distributePrint(cfg) {
  const a = Number(cfg.a) || 3;
  const c = Number(cfg.c) || 4;
  const ac = a * c;
  return [
    {
      title: {
        en: `1. ${a} equal groups of (x + ${c})`,
        es: `1. ${a} grupos iguales de (x + ${c})`,
      },
      ask: {
        en: `How many x-tiles and how many 1-tiles are inside all ${a} bags?`,
        es: `¿Cuántas fichas x y cuántas fichas de 1 hay en las ${a} bolsas en total?`,
      },
      svg: svgWrap(
        220,
        90,
        Array.from({ length: a }, (_, i) => {
          const y = 12 + i * Math.min(22, Math.floor(68 / a));
          return `<rect x="14" y="${y}" width="64" height="14" rx="3" fill="${TEAL}" stroke="${TEAL_DARK}"/><text x="46" y="${y + 11}" text-anchor="middle" font-size="10" font-weight="700" fill="${BG}">x</text><rect x="86" y="${y}" width="${Math.min(110, c * 18)}" height="14" rx="3" fill="${AMBER}" stroke="${AMBER_DARK}"/><text x="${86 + Math.min(110, c * 18) / 2}" y="${y + 11}" text-anchor="middle" font-size="10" font-weight="700" fill="${NAVY}">+${c}</text>`;
        }).join(""),
        `${a} groups of x plus ${c}`,
      ),
    },
    {
      title: {
        en: `2. Area model: ${a}(x + ${c}) = ${a}x + ${ac}`,
        es: `2. Modelo de área: ${a}(x + ${c}) = ${a}x + ${ac}`,
      },
      ask: {
        en: `Why is ${a}(x + ${c}) equal to ${a}x + ${ac} and not ${a}x + ${c}?`,
        es: `¿Por qué ${a}(x + ${c}) es igual a ${a}x + ${ac} y no a ${a}x + ${c}?`,
      },
      svg: svgWrap(
        220,
        90,
        `<text x="16" y="54" font-size="13" font-weight="800" fill="${NAVY}">${a}</text><rect x="30" y="24" width="84" height="50" fill="${TEAL}" fill-opacity="0.22" stroke="${TEAL_DARK}" stroke-width="1.5"/><text x="72" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="${TEAL_DARK}">x</text><text x="72" y="54" text-anchor="middle" font-size="13" font-weight="800" fill="${NAVY}">${a}x</text><rect x="114" y="24" width="90" height="50" fill="${AMBER}" fill-opacity="0.28" stroke="${AMBER_DARK}" stroke-width="1.5"/><text x="159" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="${AMBER_DARK}">+${c}</text><text x="159" y="54" text-anchor="middle" font-size="13" font-weight="800" fill="${NAVY}">${ac}</text>`,
        `Area model ${a} times x plus ${c} equals ${a}x plus ${ac}`,
      ),
    },
  ];
}

function ratioScalePrint(cfg) {
  const a = Number(cfg.a) || 2;
  const b = Number(cfg.b) || 3;
  const k = Number(cfg.k) || 4;
  const share = (a / (a + b)) * 160;
  return [
    {
      title: {
        en: `1. Scale both parts: ${k} × (${a} : ${b}) = ${k * a} : ${k * b}`,
        es: `1. Escala ambas partes: ${k} × (${a} : ${b}) = ${k * a} : ${k * b}`,
      },
      ask: {
        en: `Why do we multiply both numbers by ${k} instead of adding the same amount?`,
        es: `¿Por qué multiplicamos los dos números por ${k} en lugar de sumar la misma cantidad?`,
      },
      svg: svgWrap(
        220,
        90,
        `<text x="14" y="22" font-size="10" font-weight="700" fill="${NAVY}">1× (${a}:${b})</text><rect x="74" y="12" width="${share * 0.8}" height="14" fill="${TEAL}"/><rect x="${74 + share * 0.8}" y="12" width="${(160 - share) * 0.8}" height="14" fill="${AMBER}"/><text x="14" y="52" font-size="10" font-weight="700" fill="${NAVY}">${k}× (${k * a}:${k * b})</text><rect x="74" y="42" width="${share * 0.8}" height="14" fill="${TEAL}"/><rect x="${74 + share * 0.8}" y="42" width="${(160 - share) * 0.8}" height="14" fill="${AMBER}"/><line x1="${74 + share * 0.8}" y1="8" x2="${74 + share * 0.8}" y2="62" stroke="${NAVY}" stroke-dasharray="3 2" stroke-width="1.5"/><text x="110" y="78" text-anchor="middle" font-size="10" font-weight="700" fill="${TEAL_DARK}">Same share = same mix</text>`,
        `Equivalent ratio strips ${a}:${b} and ${k * a}:${k * b}`,
      ),
    },
    {
      title: { en: `2. Straight line through (0, 0)`, es: `2. Recta por (0, 0)` },
      ask: {
        en: `How can you tell on a graph that two ratios are equivalent?`,
        es: `¿Cómo puedes saber en una gráfica que dos razones son equivalentes?`,
      },
      svg: svgWrap(
        220,
        90,
        `<line x1="30" y1="74" x2="200" y2="74" stroke="${NAVY}" stroke-width="1.5"/><line x1="30" y1="74" x2="30" y2="12" stroke="${NAVY}" stroke-width="1.5"/><line x1="30" y1="74" x2="186" y2="18" stroke="${TEAL_DARK}" stroke-width="2"/><circle cx="69" cy="60" r="4" fill="${TEAL}" stroke="${NAVY}"/><circle cx="108" cy="46" r="4" fill="${TEAL}" stroke="${NAVY}"/><circle cx="147" cy="32" r="4" fill="${TEAL}" stroke="${NAVY}"/><text x="30" y="84" font-size="9" fill="${NAVY}">(0,0)</text><text x="154" y="28" font-size="9" font-weight="700" fill="${TEAL_DARK}">(${k * a}, ${k * b})</text>`,
        `Graph of equivalent ratios through the origin`,
      ),
    },
  ];
}

function percentWholePrint(cfg) {
  const p = Number(cfg.percent) || 25;
  const w = Number(cfg.whole) || 60;
  const part = Math.round(p * w) / 100;
  const pw = (p / 100) * 180;
  return [
    {
      title: { en: `1. ${p}% of ${w} = ${part}`, es: `1. ${p}% de ${w} = ${part}` },
      ask: {
        en: `If the whole changes from ${w} to 100, what happens to ${p}% of the whole?`,
        es: `Si el total cambia de ${w} a 100, ¿qué pasa con el ${p}% del total?`,
      },
      svg: svgWrap(
        220,
        90,
        `<rect x="20" y="18" width="180" height="22" rx="4" fill="${BG}" stroke="${NAVY}" stroke-width="1.5"/><rect x="20" y="18" width="${pw}" height="22" rx="4" fill="${TEAL}"/><text x="${20 + Math.max(18, pw / 2)}" y="33" text-anchor="middle" font-size="10" font-weight="800" fill="${BG}">${p}%</text><line x1="20" y1="58" x2="200" y2="58" stroke="${NAVY}" stroke-width="1.5"/><text x="20" y="72" font-size="10" fill="${NAVY}">0</text><text x="${20 + pw}" y="72" text-anchor="middle" font-size="11" font-weight="800" fill="${TEAL_DARK}">${part}</text><text x="200" y="72" text-anchor="end" font-size="10" font-weight="700" fill="${NAVY}">${w}</text>`,
        `${p} percent of ${w} equals ${part}`,
      ),
    },
  ];
}

function meanBalancePrint(cfg) {
  const vals = Array.isArray(cfg.values) ? cfg.values.map(Number) : [2, 3, 4, 7];
  const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
  const max = Math.max(...vals, 1);
  const bw = Math.floor(150 / vals.length);
  return [
    {
      title: { en: `1. Fair share = ${mean}`, es: `1. Reparto justo = ${mean}` },
      ask: {
        en: `When you move blocks to make every tower the same height, what stays unchanged?`,
        es: `Cuando mueves bloques para igualar las torres, ¿qué se mantiene igual?`,
      },
      svg: svgWrap(
        220,
        90,
        vals
          .map((v, i) => {
            const h = Math.round((v / max) * 52);
            const x = 24 + i * (bw + 6);
            return `<rect x="${x}" y="${72 - h}" width="${bw}" height="${h}" rx="2" fill="${AMBER}" stroke="${AMBER_DARK}"/><text x="${x + bw / 2}" y="84" text-anchor="middle" font-size="9" font-weight="700" fill="${NAVY}">${v}</text>`;
          })
          .join("") +
          `<line x1="16" y1="${72 - Math.round((mean / max) * 52)}" x2="204" y2="${72 - Math.round((mean / max) * 52)}" stroke="${TEAL_DARK}" stroke-width="2" stroke-dasharray="4 3"/><text x="202" y="${68 - Math.round((mean / max) * 52)}" text-anchor="end" font-size="10" font-weight="800" fill="${TEAL_DARK}">mean = ${mean}</text>`,
        `Data towers leveled at mean ${mean}`,
      ),
    },
  ];
}

function exponentsPrint(cfg) {
  const b = Number(cfg.base) || 2;
  const e = Number(cfg.exponent) || 4;
  const val = b ** e;
  const factors = Array.from({ length: e }, () => String(b)).join(" × ");
  return [
    {
      title: {
        en: `1. Repeated factors: ${b}^${e} = ${val}`,
        es: `1. Factores repetidos: ${b}^${e} = ${val}`,
      },
      ask: {
        en: `Why is ${b}^${e} equal to ${val} and NOT ${b} × ${e} = ${b * e}?`,
        es: `¿Por qué ${b}^${e} es igual a ${val} y NO a ${b} × ${e} = ${b * e}?`,
      },
      svg: svgWrap(
        220,
        90,
        `<text x="110" y="30" text-anchor="middle" font-size="18" font-weight="800" fill="${NAVY}">${b}<tspan dy="-7" font-size="12" fill="${TEAL_DARK}">${e}</tspan><tspan dy="7" fill="${NAVY}"> = ${val}</tspan></text><text x="110" y="54" text-anchor="middle" font-size="12" font-weight="700" fill="${TEAL_DARK}">${factors}</text><text x="110" y="76" text-anchor="middle" font-size="10" font-weight="700" fill="${AMBER_DARK}">${e} factors of ${b} (not ${b} × ${e} = ${b * e})</text>`,
        `${b} to the power of ${e} equals ${val}`,
      ),
    },
  ];
}

function orderOpsPrint(cfg) {
  const a = Number(cfg.a) || 3;
  const b = Number(cfg.b) || 4;
  const base = Number(cfg.base) || 2;
  const exp = Number(cfg.exp) || 2;
  const d = Number(cfg.d) || 6;
  const pow = base ** exp;
  const prod = b * pow;
  const total = a + prod - d;
  return [
    {
      title: {
        en: `1. Keep the whole expression visible`,
        es: `1. Mantén toda la expresión visible`,
      },
      ask: {
        en: `Which part do we evaluate first in ${a} + ${b} × ${base}^${exp} − ${d}, and why?`,
        es: `¿Qué parte evaluamos primero en ${a} + ${b} × ${base}^${exp} − ${d} y por qué?`,
      },
      svg: svgWrap(
        220,
        90,
        `<text x="110" y="22" text-anchor="middle" font-size="12" font-weight="800" fill="${NAVY}">${a} + ${b} × ${base}^${exp} − ${d}</text><text x="110" y="44" text-anchor="middle" font-size="12" font-weight="700" fill="${TEAL_DARK}">${a} + ${b} × ${pow} − ${d}</text><text x="110" y="64" text-anchor="middle" font-size="12" font-weight="700" fill="${AMBER_DARK}">${a} + ${prod} − ${d}</text><text x="110" y="83" text-anchor="middle" font-size="13" font-weight="800" fill="${NAVY}">= ${total}</text>`,
        `Order of operations steps ending at ${total}`,
      ),
    },
  ];
}

function oneStepEqPrint(cfg) {
  const op = cfg.op === "-" ? "-" : "+";
  const k = Number(cfg.k) || 7;
  const rhs = Number(cfg.rhs) || 15;
  const sol = op === "+" ? rhs - k : rhs + k;
  const inv = op === "+" ? `− ${k}` : `+ ${k}`;
  const vName = cfg.varName || "x";
  return [
    {
      title: {
        en: `1. Keep both sides balanced: ${vName} ${op} ${k} = ${rhs}`,
        es: `1. Mantén ambos lados en equilibrio: ${vName} ${op} ${k} = ${rhs}`,
      },
      ask: {
        en: `Why must we do ${inv} to BOTH sides of the equation?`,
        es: `¿Por qué debemos hacer ${inv} en LOS DOS lados de la ecuación?`,
      },
      svg: svgWrap(
        220,
        90,
        `<line x1="30" y1="42" x2="190" y2="42" stroke="${NAVY}" stroke-width="2.5"/><polygon points="110,42 98,64 122,64" fill="${TEAL}"/><rect x="36" y="18" width="58" height="20" rx="4" fill="${TEAL}"/><text x="65" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="${BG}">${vName} ${op} ${k}</text><rect x="126" y="18" width="58" height="20" rx="4" fill="${AMBER}"/><text x="155" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="${NAVY}">${rhs}</text><text x="110" y="82" text-anchor="middle" font-size="11" font-weight="800" fill="${TEAL_DARK}">${inv} both sides → ${vName} = ${sol}</text>`,
        `Balance scale solving ${vName} ${op} ${k} equals ${rhs} giving ${vName} equals ${sol}`,
      ),
    },
  ];
}

function integersPrint(cfg) {
  const n = Math.abs(Number(cfg.value) || 6);
  return [
    {
      title: {
        en: `1. Opposites mirror across 0: −${n} and +${n}`,
        es: `1. Los opuestos son espejo respecto a 0: −${n} y +${n}`,
      },
      ask: {
        en: `What does 0 mean in this situation, and how far are −${n} and +${n} from 0?`,
        es: `¿Qué significa el 0 en esta situación y a qué distancia están −${n} y +${n} del 0?`,
      },
      svg: svgWrap(
        220,
        90,
        `<line x1="18" y1="50" x2="202" y2="50" stroke="${NAVY}" stroke-width="2"/><line x1="110" y1="24" x2="110" y2="74" stroke="${NAVY}" stroke-dasharray="3 2"/><circle cx="44" cy="50" r="6" fill="${AMBER}" stroke="${AMBER_DARK}" stroke-width="1.5"/><circle cx="176" cy="50" r="6" fill="${TEAL}" stroke="${TEAL_DARK}" stroke-width="1.5"/><text x="44" y="72" text-anchor="middle" font-size="11" font-weight="800" fill="${AMBER_DARK}">−${n}</text><text x="110" y="72" text-anchor="middle" font-size="11" font-weight="800" fill="${NAVY}">0</text><text x="176" y="72" text-anchor="middle" font-size="11" font-weight="800" fill="${TEAL_DARK}">+${n}</text><text x="110" y="18" text-anchor="middle" font-size="10" font-weight="700" fill="${NAVY}">Both are ${n} units from 0</text>`,
        `Number line showing minus ${n}, zero, and plus ${n}`,
      ),
    },
  ];
}

function parallelogramPrint(cfg) {
  const b = Number(cfg.base) || 14;
  const h = Number(cfg.height) || 9;
  const area = b * h;
  return [
    {
      title: {
        en: `1. Cut & slide into a ${b} × ${h} rectangle`,
        es: `1. Corta y desliza en un rectángulo de ${b} × ${h}`,
      },
      ask: {
        en: `Why do we use the straight-up height (${h}) instead of the slanted side?`,
        es: `¿Por qué usamos la altura perpendicular (${h}) en lugar del lado inclinado?`,
      },
      svg: svgWrap(
        220,
        90,
        `<polygon points="24,68 48,22 150,22 126,68" fill="${TEAL}" fill-opacity="0.25" stroke="${TEAL_DARK}" stroke-width="1.5"/><polygon points="24,68 48,22 48,68" fill="${AMBER}" fill-opacity="0.5" stroke="${AMBER_DARK}" stroke-dasharray="3 2"/><rect x="148" y="22" width="52" height="46" fill="${TEAL}" fill-opacity="0.25" stroke="${NAVY}" stroke-width="1.5"/><text x="110" y="84" text-anchor="middle" font-size="11" font-weight="800" fill="${NAVY}">A = ${b} × ${h} = ${area}</text>`,
        `Parallelogram rearranged into a ${b} by ${h} rectangle with area ${area}`,
      ),
    },
  ];
}

function medianIqrPrint(cfg) {
  const vals = Array.isArray(cfg.values)
    ? [...cfg.values].map(Number).sort((a, b) => a - b)
    : [62, 68, 72, 74, 76, 79, 81, 83, 85, 87, 88, 90];
  const med = (arr) =>
    arr.length % 2
      ? arr[(arr.length - 1) / 2]
      : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;
  const mid = Math.floor(vals.length / 2);
  const lo = vals.slice(0, mid);
  const hi = vals.length % 2 ? vals.slice(mid + 1) : vals.slice(mid);
  const q1 = med(lo);
  const m = med(vals);
  const q3 = med(hi);
  const iqr = q3 - q1;
  return [
    {
      title: {
        en: `1. Fold at median (${m}) → Q1 = ${q1}, Q3 = ${q3}, IQR = ${iqr}`,
        es: `1. Dobla en la mediana (${m}) → Q1 = ${q1}, Q3 = ${q3}, RIC = ${iqr}`,
      },
      ask: {
        en: `Why does the IQR (${iqr}) stay steady even if one extreme score changes?`,
        es: `¿Por qué el RIC (${iqr}) se mantiene estable aunque cambie un dato extremo?`,
      },
      svg: svgWrap(
        220,
        90,
        `<line x1="22" y1="44" x2="198" y2="44" stroke="${NAVY}" stroke-width="2"/><rect x="64" y="26" width="92" height="36" rx="4" fill="${TEAL}" fill-opacity="0.28" stroke="${TEAL_DARK}" stroke-width="2"/><line x1="110" y1="26" x2="110" y2="62" stroke="${AMBER_DARK}" stroke-width="2.5"/><text x="64" y="76" text-anchor="middle" font-size="10" font-weight="700" fill="${TEAL_DARK}">Q1=${q1}</text><text x="110" y="18" text-anchor="middle" font-size="10" font-weight="800" fill="${AMBER_DARK}">Med=${m}</text><text x="156" y="76" text-anchor="middle" font-size="10" font-weight="700" fill="${TEAL_DARK}">Q3=${q3}</text>`,
        `Box plot with Q1 ${q1}, median ${m}, Q3 ${q3}, and IQR ${iqr}`,
      ),
    },
  ];
}

const PRINTERS = {
  distribute: distributePrint,
  "ratio-scale": ratioScalePrint,
  "percent-whole": percentWholePrint,
  "mean-balance": meanBalancePrint,
  exponents: exponentsPrint,
  "order-of-operations": orderOpsPrint,
  "one-step-equation": oneStepEqPrint,
  "integers-opposites": integersPrint,
  "parallelogram-area": parallelogramPrint,
  "median-iqr": medianIqrPrint,
};

/**
 * Render static end-state SVG cards for the take-home refrigerator print sheet.
 * Placed inside `.refrigerator-sheet-print-container` so it prints cleanly and
 * never affects the screen body-token budget.
 */
export function renderLivingPrintBlock(config) {
  const living = config?.launch?.conceptIntro?.livingScene;
  if (!living || living.kind !== "living-scene") return "";
  const fn = PRINTERS[living.play];
  if (!fn) return "";
  const cards = fn(living);
  if (!cards?.length) return "";
  return `
          <div class="rf-card rf-card-living">
            <h3><span class="lang-en">Step-by-Step Visual Snapshot</span><span class="lang-es" lang="es">Resumen visual paso a paso</span></h3>
            <div class="rf-living-grid">
              ${cards
                .map(
                  (c) => `<figure class="rf-living-item">
                <figcaption><strong><span class="lang-en">${esc(c.title.en)}</span><span class="lang-es" lang="es">${esc(c.title.es)}</span></strong></figcaption>
                ${c.svg}
                <p class="rf-living-ask"><em><span class="lang-en">Ask your child: ${esc(c.ask.en)}</span><span class="lang-es" lang="es">Pregúntale a tu hijo/a: ${esc(c.ask.es)}</span></em></p>
              </figure>`,
                )
                .join("")}
            </div>
          </div>`;
}

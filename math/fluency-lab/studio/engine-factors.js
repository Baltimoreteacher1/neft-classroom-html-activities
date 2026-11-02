// Factors engine: the greatest common factor and least common multiple, found from lists. Every factor of both
// numbers is listed, the common ones are marked, and the greatest is chosen; multiples are listed until one
// appears in both lists. The tests recompute both with plain arithmetic.
import { COLORS, L, clean, esc, frame, gcd, lcm, num, svgWrap, txt } from "./core.js";

export function parse(question) {
  const m = clean(question).match(/^Find the (GCF|LCM) of (\d+) and (\d+)\.$/);
  if (!m) return null;
  const [a, b] = [Number(m[2]), Number(m[3])];
  if (a < 1 || b < 1 || a > 144 || b > 144) return null;
  if (m[1] === "GCF") {
    const fa = factorsOf(a);
    const fb = factorsOf(b);
    const common = fa.filter((f) => b % f === 0);
    return { engine: "factors", mode: "gcf", a, b, fa, fb, common, result: gcd(a, b) };
  }
  const result = lcm(a, b);
  if (result > 1500) return null;
  const ma = Array.from({ length: result / a }, (_, i) => a * (i + 1));
  const mb = Array.from({ length: result / b }, (_, i) => b * (i + 1));
  return { engine: "factors", mode: "lcm", a, b, ma, mb, result };
}
const factorsOf = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((f) => n % f === 0);

function lists(rows, { mark = [], hiLast = false, label = [] } = {}) {
  let out = "";
  rows.forEach((row, r) => {
    const w = Math.min(46, 500 / Math.max(row.length, 1));
    const x0 = 280 - (w * row.length) / 2;
    out += txt(40, 40 + r * 88, label[r] ?? "", { size: 14, anchor: "start", fill: COLORS.mute });
    row.forEach((v, i) => {
      const lit = mark.includes(v);
      const top = hiLast && lit && v === mark.at(-1);
      out += `<rect x="${x0 + i * w + 2}" y="${52 + r * 88}" width="${w - 4}" height="38" rx="8" fill="${top ? COLORS.part : lit ? "#fff7ed" : "#f8fafc"}" stroke="${lit ? COLORS.warn : COLORS.rule}" stroke-width="${lit ? 3 : 1.5}"/>${txt(x0 + i * w + w / 2, 77 + r * 88, String(v), { size: w < 30 ? 11 : 15, fill: top ? "#fff" : COLORS.ink })}`;
    });
  });
  return svgWrap(out, "", { h: 40 + rows.length * 88 });
}
const mk = (id, cap, easy, eq, svg, alt, meta = {}) => Object.assign(frame({ id, cap, easy, eq, svg: svg.replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt }), { meta });

export function frames(s) {
  if (s.mode === "gcf") {
    const alt = L(`Factor lists for ${s.a} and ${s.b}.`, `Listas de factores de ${s.a} y ${s.b}.`);
    const lab = [L(`Factors of ${s.a}`, `Factores de ${s.a}`).en, L(`Factors of ${s.b}`, `Factores de ${s.b}`).en];
    return [
      mk("lists", L(`List every factor of ${s.a} and of ${s.b}.`, `Escribe todos los factores de ${s.a} y de ${s.b}.`), L("List the factors.", "Escribe los factores."), `GCF(${s.a}, ${s.b})`, lists([s.fa, s.fb], { label: lab }), alt, { common: s.common }),
      mk("common", L(`Mark the factors the lists share: ${s.common.join(", ")}.`, `Marca los factores que comparten las listas: ${s.common.join(", ")}.`), L("Shared factors.", "Factores compartidos."), `GCF(${s.a}, ${s.b})`, lists([s.fa, s.fb], { mark: s.common, label: lab }), alt, { common: s.common }),
      mk("greatest", L(`The greatest shared factor is ${s.result}, so the GCF of ${s.a} and ${s.b} is ${s.result}.`, `El mayor factor compartido es ${s.result}, así que el MCD de ${s.a} y ${s.b} es ${s.result}.`), L(`GCF = ${s.result}.`, `MCD = ${s.result}.`), `GCF(${s.a}, ${s.b}) = ${s.result}`, lists([s.fa, s.fb], { mark: s.common, hiLast: true, label: lab }), alt, { common: s.common, result: s.result }),
    ];
  }
  const alt = L(`Multiples of ${s.a} and ${s.b}.`, `Múltiplos de ${s.a} y ${s.b}.`);
  const lab = [L(`Multiples of ${s.a}`, `Múltiplos de ${s.a}`).en, L(`Multiples of ${s.b}`, `Múltiplos de ${s.b}`).en];
  const shared = s.ma.filter((v) => s.mb.includes(v));
  return [
    mk("lists", L(`List multiples of ${s.a} and of ${s.b}, counting up until they meet.`, `Escribe múltiplos de ${s.a} y de ${s.b}, contando hacia arriba hasta que se encuentren.`), L("List the multiples.", "Escribe los múltiplos."), `LCM(${s.a}, ${s.b})`, lists([s.ma, s.mb], { label: lab }), alt, { shared }),
    mk("first", L(`The first number in both lists is ${s.result}, so the LCM of ${s.a} and ${s.b} is ${s.result}.`, `El primer número en ambas listas es ${s.result}, así que el mcm de ${s.a} y ${s.b} es ${s.result}.`), L(`LCM = ${s.result}.`, `mcm = ${s.result}.`), `LCM(${s.a}, ${s.b}) = ${s.result}`, lists([s.ma, s.mb], { mark: [s.result], hiLast: true, label: lab }), alt, { shared, result: s.result, first: shared[0] }),
  ];
}

export const answer = (s) => s.result;

export function predicts(s) {
  if (s.mode === "gcf")
    return [{ at: 2, q: L(`The lists share ${s.common.join(", ")}. Which one is the GCF?`, `Las listas comparten ${s.common.join(", ")}. ¿Cuál es el MCD?`), choices: [
      { t: L("The greatest one.", "El mayor."), ok: true, why: L("GCF stands for greatest common factor: the biggest factor both numbers share.", "MCD significa máximo común divisor: el mayor factor que ambos números comparten.") },
      { t: L("The first one, 1.", "El primero, 1."), ok: s.result === 1, why: s.result === 1 ? L("Here 1 is the only shared factor, so it is also the greatest.", "Aquí 1 es el único factor compartido, así que también es el mayor.") : L("1 is always shared, but it is rarely the greatest.", "1 siempre se comparte, pero casi nunca es el mayor.") },
    ].filter((c, i) => !(i === 1 && s.result === 1)), explain: [{ t: L("Because the GCF is the largest number that divides both.", "Porque el MCD es el mayor número que divide a ambos."), ok: true }, { t: L("Because the GCF is the smallest shared number.", "Porque el MCD es el menor número compartido."), ok: false }] }];
  return [{ at: 1, q: L(`Which number in both lists is the LCM: the first one they share, or the biggest?`, `¿Qué número de ambas listas es el mcm: el primero que comparten, o el mayor?`), choices: [
    { t: L("The first one they share.", "El primero que comparten."), ok: true, why: L("LCM stands for least common multiple: the smallest number in both lists.", "mcm significa mínimo común múltiplo: el menor número que está en ambas listas.") },
    { t: L("The biggest one.", "El mayor."), ok: false, why: L("Multiples go on forever, so there is no biggest; the least shared one is the LCM.", "Los múltiplos siguen para siempre, así que no hay un mayor; el menor compartido es el mcm.") },
  ], explain: [{ t: L("Because the LCM is the smallest number that both numbers divide into.", "Porque el mcm es el menor número entre el que se dividen ambos."), ok: true }, { t: L("Because the LCM is the product of the two numbers.", "Porque el mcm es el producto de los dos números."), ok: false }] }];
}

export function hints(s) {
  const peek = s.mode === "gcf" ? { id: "peek", cap: L("", ""), alt: L("Factor lists", "Listas de factores"), svg: lists([s.fa, s.fb], { label: [`Factors of ${s.a}`, `Factors of ${s.b}`] }) } : { id: "peek", cap: L("", ""), alt: L("Multiples", "Múltiplos"), svg: lists([s.ma.slice(0, Math.max(1, s.ma.length - 1)), s.mb.slice(0, Math.max(1, s.mb.length - 1))], { label: [`Multiples of ${s.a}`, `Multiples of ${s.b}`] }) };
  return s.mode === "gcf"
    ? [{ text: L("List every factor of each number, then look for the ones in both lists.", "Escribe todos los factores de cada número y busca los que están en ambas listas.") }, { text: L("The lists show the factors of each number.", "Las listas muestran los factores de cada número."), frame: peek }, { text: L("Mark the shared factors, then choose the greatest.", "Marca los factores compartidos y elige el mayor."), frame: peek }]
    : [{ text: L("List multiples of each number by counting up, and look for the first one in both lists.", "Escribe múltiplos de cada número contando hacia arriba y busca el primero que esté en ambas listas.") }, { text: L("The lists show multiples, stopping just short of where they meet.", "Las listas muestran múltiplos, deteniéndose justo antes de donde se encuentran."), frame: peek }, { text: L("Keep counting up each list. Stop at the first number that appears in both.", "Sigue contando cada lista. Detente en el primer número que aparece en ambas.") }];
}

export function diagnose(s, raw) {
  const v = num(raw);
  if (v === null || v === s.result) return null;
  if (s.mode === "gcf" && v === lcm(s.a, s.b)) return "usedLcm";
  if (s.mode === "lcm" && v === gcd(s.a, s.b)) return "usedGcf";
  if (s.mode === "lcm" && v === s.a * s.b && s.a * s.b !== s.result) return "multipliedThem";
  return null;
}
export const tags = {
  usedLcm: { label: L("Found the least common multiple instead", "Halló el mínimo común múltiplo en su lugar"), tip: L("The GCF is the greatest factor both share; it can never be bigger than the smaller number.", "El MCD es el mayor factor que ambos comparten; nunca puede ser mayor que el menor de los números.") },
  usedGcf: { label: L("Found the greatest common factor instead", "Halló el máximo común divisor en su lugar"), tip: L("The LCM is a multiple of both numbers, so it is at least as big as the larger one.", "El mcm es múltiplo de ambos números, así que es al menos tan grande como el mayor.") },
  multipliedThem: { label: L("Multiplied the two numbers", "Multiplicó los dos números"), tip: L("The product is a common multiple, but there is often a smaller one in both lists.", "El producto es un múltiplo común, pero a menudo hay uno menor en ambas listas.") },
};

export const build = {
  prompt: (s) => (s.mode === "gcf" ? L(`Pick the greatest factor that ${s.a} and ${s.b} share.`, `Elige el mayor factor que comparten ${s.a} y ${s.b}.`) : L(`Pick the first number that is in both lists of multiples.`, `Elige el primer número que está en ambas listas de múltiplos.`)),
  init: () => ({ pick: null }),
  render(st, s) {
    const rows = s.mode === "gcf" ? [s.fa, s.fb] : [s.ma, s.mb];
    const options = s.mode === "gcf" ? s.fa : s.ma;
    const alt = L("Lists of numbers.", "Listas de números.");
    return {
      svg: lists(rows, { mark: st.pick === null ? [] : [st.pick] }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
      controls: options.map((v) => ({ id: "pick", arg: v, label: L(String(v), String(v)) })),
      status: st.pick === s.result ? L(`Yes: ${s.result} is the ${s.mode === "gcf" ? "greatest shared factor" : "first shared multiple"}.`, `Sí: ${s.result} es el ${s.mode === "gcf" ? "mayor factor compartido" : "primer múltiplo compartido"}.`) : null,
    };
  },
  act(st, id, arg, s) {
    const right = arg === s.result;
    const msg = s.mode === "gcf" ? (s.b % arg !== 0 ? L(`${arg} is not a factor of ${s.b}.`, `${arg} no es factor de ${s.b}.`) : L(`${arg} is shared, but a greater factor is shared too.`, `${arg} se comparte, pero también se comparte un factor mayor.`)) : (arg % s.b !== 0 ? L(`${arg} is not a multiple of ${s.b}.`, `${arg} no es múltiplo de ${s.b}.`) : L(`${arg} is in both lists, but it is not the first.`, `${arg} está en ambas listas, pero no es el primero.`));
    return { state: { pick: arg }, ok: right, msg: right ? null : msg, tag: right ? null : "wrongPick" };
  },
  done: (st, s) => st.pick === s.result,
};

// Factors engine: GCF uses shared factor lists; LCM uses prime factor trees and the greatest count of each prime.
// The tests recompute the results independently with plain arithmetic.
import { COLORS, L, clean, esc, frame, gcd, lcm, num, svgWrap, txt } from "./core.js";
import { countOf, factorTreeSvg, keptPrimes, powerText, primeList } from "../factor-tree.js";

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
  const [pa, pb] = [primeList(a), primeList(b)];
  const primes = [...new Set([...pa, ...pb])].sort((x, y) => x - y);
  const kept = keptPrimes(a, b);
  return { engine: "factors", mode: "lcm", a, b, pa, pb, primes, kept, result };
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

function treePair(s) {
  const nest = (n, x) => {
    const source = factorTreeSvg(n, { label: `Factor tree of ${n}: ${primeList(n).join(" × ")}` });
    const viewBox = source.match(/viewBox="([^"]+)"/)?.[1] || "0 0 300 160";
    const body = source.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1] || "";
    const [, , width, height] = viewBox.split(/\s+/).map(Number);
    return `<svg x="${x}" y="50" width="${width}" height="${height}" viewBox="${viewBox}" role="img" aria-label="Factor tree of ${n}">${body}</svg>`;
  };
  return `<svg viewBox="0 0 900 300" role="img" aria-label="Factor trees for ${s.a} and ${s.b}">${txt(240, 30, `${s.a} = ${primeList(s.a).join(" × ")}`, { size: 17 })}${txt(690, 30, `${s.b} = ${primeList(s.b).join(" × ")}`, { size: 17 })}${nest(s.a, 30)}${nest(s.b, 480)}</svg>`;
}

const treeSvg = (n) => factorTreeSvg(n, { label: `Factor tree of ${n}` }).match(/<svg[^>]*>[\s\S]*?<\/svg>/)?.[0] || "";

function primeCountTable(s, selected = []) {
  const rowY = (i) => 100 + i * 48;
  let body = "";
  body += txt(55, 48, L("Prime", "Primo"), { size: 14 });
  body += txt(180, 48, L(`In ${s.a}`, `En ${s.a}`), { size: 14 });
  body += txt(300, 48, L(`In ${s.b}`, `En ${s.b}`), { size: 14 });
  body += txt(455, 48, L("Keep max", "Conserva el mayor"), { size: 14 });
  s.primes.forEach((p, i) => {
    const aCount = countOf(s.pa, p);
    const bCount = countOf(s.pb, p);
    const keep = Math.max(aCount, bCount);
    const chosen = selected[i];
    body += `<rect x="20" y="${rowY(i) - 25}" width="520" height="38" rx="8" fill="${chosen === undefined ? "#f8fafc" : chosen === keep ? "#ccfbf1" : "#fff7ed"}" stroke="${chosen === undefined ? COLORS.rule : chosen === keep ? COLORS.part : COLORS.warn}" stroke-width="2"/>`;
    body += txt(55, rowY(i), String(p), { size: 18, fill: COLORS.ink });
    body += txt(180, rowY(i), String(aCount), { size: 17 });
    body += txt(300, rowY(i), String(bCount), { size: 17 });
    body += txt(455, rowY(i), chosen === undefined ? "?" : String(chosen), { size: 18, fill: chosen === keep ? COLORS.part : COLORS.warn });
  });
  return svgWrap(body, `Prime copy counts in ${s.a} and ${s.b}; choose the greater count for each prime.`, { h: 125 + s.primes.length * 48 });
}

const lcmStep = (id, cap, svg, alt, eq = "", meta = {}) =>
  Object.assign(frame({ id, cap, easy: null, eq, svg, alt }), { meta });

export function frames(s) {
  if (s.mode === "gcf") {
    const alt = L(`Factor lists for ${s.a} and ${s.b}.`, `Listas de factores de ${s.a} y ${s.b}.`);
    const lab = [L(`Factors of ${s.a}`, `Factores de ${s.a}`), L(`Factors of ${s.b}`, `Factores de ${s.b}`)];
    return [
      mk("lists", L(`List every factor of ${s.a} and of ${s.b}.`, `Escribe todos los factores de ${s.a} y de ${s.b}.`), L("List the factors.", "Escribe los factores."), `GCF(${s.a}, ${s.b})`, lists([s.fa, s.fb], { label: lab }), alt, { common: s.common }),
      mk("common", L(`Mark the factors the lists share: ${s.common.join(", ")}.`, `Marca los factores que comparten las listas: ${s.common.join(", ")}.`), L("Shared factors.", "Factores compartidos."), `GCF(${s.a}, ${s.b})`, lists([s.fa, s.fb], { mark: s.common, label: lab }), alt, { common: s.common }),
      mk("greatest", L(`The greatest shared factor is ${s.result}, so the GCF of ${s.a} and ${s.b} is ${s.result}.`, `El mayor factor compartido es ${s.result}, así que el MCD de ${s.a} y ${s.b} es ${s.result}.`), L(`GCF = ${s.result}.`, `MCD = ${s.result}.`), `GCF(${s.a}, ${s.b}) = ${s.result}`, lists([s.fa, s.fb], { mark: s.common, hiLast: true, label: lab }), alt, { common: s.common, result: s.result }),
    ];
  }
  const alt = L(`Factor trees and prime counts for ${s.a} and ${s.b}.`, `Árboles de factores y conteos de primos para ${s.a} y ${s.b}.`);
  const keptPowers = powerText(s.kept);
  return [
    lcmStep("tree-a", L(`Split ${s.a} into factors until every end number is prime: ${s.a} = ${s.pa.join(" × ")}.`, `Descompón ${s.a} en factores hasta que cada número final sea primo: ${s.a} = ${s.pa.join(" × ")}.`), treeSvg(s.a), L(`Factor tree of ${s.a}.`, `Árbol de factores de ${s.a}.`), `${s.a} = ${s.pa.join(" × ")}`, { primes: s.pa }),
    lcmStep("tree-b", L(`Now split ${s.b} until every end number is prime: ${s.b} = ${s.pb.join(" × ")}.`, `Ahora descompón ${s.b} hasta que cada número final sea primo: ${s.b} = ${s.pb.join(" × ")}.`), treeSvg(s.b), L(`Factor tree of ${s.b}.`, `Árbol de factores de ${s.b}.`), `${s.b} = ${s.pb.join(" × ")}`, { primes: s.pb }),
    lcmStep("keep", L(`Compare each prime's copies. Keep the greater count: ${keptPowers}.`, `Compara las copias de cada primo. Conserva el conteo mayor: ${keptPowers}.`), primeCountTable(s), alt, keptPowers, { kept: s.kept }),
    lcmStep("multiply", L(`Multiply the kept prime powers: ${powerText(s.kept)} = ${s.result}. Both numbers divide ${s.result} evenly, so it is the least common multiple.`, `Multiplica las potencias primas conservadas: ${powerText(s.kept)} = ${s.result}. Ambos números dividen exactamente a ${s.result}, así que es el mínimo común múltiplo.`), svgWrap(`${txt(280, 70, `${powerText(s.kept)} = ${s.result}`, { size: 28 })}${txt(280, 125, L(`LCM(${s.a}, ${s.b}) = ${s.result}`, `MCM(${s.a}, ${s.b}) = ${s.result}`), { size: 23, fill: COLORS.part })}`, `Multiply ${keptPowers} to get ${s.result}, the least common multiple.`, { h: 170 }), L(`The least common multiple of ${s.a} and ${s.b} is ${s.result}.`, `El mínimo común múltiplo de ${s.a} y ${s.b} es ${s.result}.`), `LCM(${s.a}, ${s.b}) = ${s.result}`, { result: s.result, primesA: s.pa, primesB: s.pb, kept: s.kept }),
  ];
}

export const answer = (s) => s.result;

export function predicts(s) {
  if (s.mode === "gcf")
    return [{ at: 2, q: L(`The lists share ${s.common.join(", ")}. Which one is the GCF?`, `Las listas comparten ${s.common.join(", ")}. ¿Cuál es el MCD?`), choices: [
      { t: L("The greatest one.", "El mayor."), ok: true, why: L("GCF stands for greatest common factor: the biggest factor both numbers share.", "MCD significa máximo común divisor: el mayor factor que ambos números comparten.") },
      { t: L("The first one, 1.", "El primero, 1."), ok: s.result === 1, why: s.result === 1 ? L("Here 1 is the only shared factor, so it is also the greatest.", "Aquí 1 es el único factor compartido, así que también es el mayor.") : L("1 is always shared, but it is rarely the greatest.", "1 siempre se comparte, pero casi nunca es el mayor.") },
    ].filter((c, i) => !(i === 1 && s.result === 1)), explain: [{ t: L("Because the GCF is the largest number that divides both.", "Porque el MCD es el mayor número que divide a ambos."), ok: true }, { t: L("Because the GCF is the smallest shared number.", "Porque el MCD es el menor número compartido."), ok: false }] }];
  const targetPrime = s.primes.find((p) => countOf(s.pa, p) !== countOf(s.pb, p));
  if (!targetPrime) return [];
  const keep = Math.max(countOf(s.pa, targetPrime), countOf(s.pb, targetPrime));
  const other = Math.min(countOf(s.pa, targetPrime), countOf(s.pb, targetPrime));
  const copies = (n) => L(`${n} ${n === 1 ? "copy" : "copies"}`, `${n} ${n === 1 ? "copia" : "copias"}`);
  return [{ at: 2, q: L(`For prime ${targetPrime}, which count is greater: ${keep} or ${other}?`, `Para el primo ${targetPrime}, ¿qué conteo es mayor: ${keep} u ${other}?`), choices: [
    { t: copies(keep), ok: true, why: L("Keep the greater count so the product contains enough of this prime to be divisible by both numbers.", "Conserva el conteo mayor para que el producto tenga suficientes copias de este primo y sea divisible por ambos números.") },
    { t: copies(other), ok: false, why: L("The smaller count may leave out a prime factor needed by one number.", "El conteo menor puede omitir un factor primo que necesita uno de los números.") },
  ], explain: [{ t: L("The greater count covers both factorizations.", "El conteo mayor cubre ambas factorizaciones."), ok: true }, { t: L("A prime shared by both is always kept once.", "Un primo compartido siempre se conserva una vez."), ok: false }] }];
}

export function hints(s) {
  if (s.mode === "lcm") return [
    { text: L("Split each number into two factors until every leaf is prime.", "Descompón cada número en dos factores hasta que cada hoja sea prima.") },
    { text: L(`Compare the number of copies of each prime in ${s.a} and ${s.b}.`, `Compara cuántas copias de cada primo aparecen en ${s.a} y ${s.b}.`), frame: { id: "trees", cap: L("Read the leaves of both factor trees.", "Lee las hojas de ambos árboles de factores."), svg: treePair(s), alt: L("Factor trees for both numbers.", "Árboles de factores de ambos números.") } },
    { text: L("Keep the greater count of each prime, write repeats as exponents, then multiply.", "Conserva el conteo mayor de cada primo, escribe las repeticiones como exponentes y multiplica.") },
  ];
  const peek = { id: "peek", cap: L("", ""), alt: L("Factor lists", "Listas de factores"), svg: lists([s.fa, s.fb], { label: [L(`Factors of ${s.a}`, `Factores de ${s.a}`), L(`Factors of ${s.b}`, `Factores de ${s.b}`)] }) };
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
  prompt: (s) => (s.mode === "gcf" ? L(`Pick the greatest factor that ${s.a} and ${s.b} share.`, `Elige el mayor factor que comparten ${s.a} y ${s.b}.`) : L("For each prime, choose the greater count from the two trees.", "Para cada primo, elige el conteo mayor de los dos árboles.")),
  init: (s) => (s.mode === "gcf" ? { pick: null } : { index: 0, selected: [] }),
  render(st, s) {
    if (s.mode === "lcm") {
      const p = s.primes[st.index];
      const aCount = p === undefined ? 0 : countOf(s.pa, p);
      const bCount = p === undefined ? 0 : countOf(s.pb, p);
      const options = [...new Set([aCount, bCount])].sort((a, b) => a - b);
      const complete = st.index >= s.primes.length;
      return {
        svg: primeCountTable(s, st.selected),
        alt: L("A prime-count table made from the factor trees.", "Tabla de conteos de primos creada a partir de los árboles de factores."),
        controls: complete ? [] : options.map((count) => ({ id: "keep", arg: count, label: L(`Keep ${count} ${count === 1 ? "copy" : "copies"} of ${p}`, `Conservar ${count} ${count === 1 ? "copia" : "copias"} de ${p}`) })),
        status: complete ? L(`You kept ${powerText(s.kept)}. Multiply to get LCM(${s.a}, ${s.b}) = ${s.result}.`, `Conservaste ${powerText(s.kept)}. Multiplica para obtener mcm(${s.a}, ${s.b}) = ${s.result}.`) : null,
      };
    }
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
    if (s.mode === "lcm") {
      if (id !== "keep" || st.index >= s.primes.length) return { state: st, ok: false };
      const p = s.primes[st.index];
      const keep = Math.max(countOf(s.pa, p), countOf(s.pb, p));
      if (arg !== keep) return { state: st, ok: false, msg: L(`For ${p}, compare the two counts and keep the greater one.`, `Para ${p}, compara los dos conteos y conserva el mayor.`), tag: "wrongPick" };
      const selected = [...st.selected, arg];
      return { state: { index: st.index + 1, selected }, ok: true, msg: null };
    }
    const right = arg === s.result;
    const msg = s.mode === "gcf" ? (s.b % arg !== 0 ? L(`${arg} is not a factor of ${s.b}.`, `${arg} no es factor de ${s.b}.`) : L(`${arg} is shared, but a greater factor is shared too.`, `${arg} se comparte, pero también se comparte un factor mayor.`)) : (arg % s.b !== 0 ? L(`${arg} is not a multiple of ${s.b}.`, `${arg} no es múltiplo de ${s.b}.`) : L(`${arg} is in both lists, but it is not the first.`, `${arg} está en ambas listas, pero no es el primero.`));
    return { state: { pick: arg }, ok: right, msg: right ? null : msg, tag: right ? null : "wrongPick" };
  },
  done: (st, s) => (s.mode === "lcm" ? st.index >= s.primes.length : st.pick === s.result),
};

// living/factor-tree-model.js — the mathematics and every sentence of the
// factor-tree play (6-13). Pure functions only (no DOM): the tree, its layout,
// the prime factors, the choice sets and all EN/ES copy are computed here so
// factor-tree.test.mjs can check each one in node.
//
// The idea: split a number into two factors, keep splitting every factor that
// is not prime, and the circles at the bottom are the prime factorization. A
// different first split grows a different tree and ends on the same primes.

import { placeCorrect } from "./ratio-scale-model.js";

export { placeCorrect };

export const W = 480;
export const H = 310;
export const MAX_LEAVES = 6;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

const P = (en, es) => ({ en, es });
const cleanPair = (v, max = 220) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};

export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** Smallest prime that divides n (n ≥ 2). */
export function smallestPrime(n) {
  let d = 2;
  while (n % d) d++;
  return d;
}

/** The prime factors of n, smallest first, with repeats: 60 → [2, 2, 3, 5]. */
export function primeFactors(n) {
  const out = [];
  let m = n;
  while (m > 1) {
    const p = smallestPrime(m);
    out.push(p);
    m /= p;
  }
  return out;
}

const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
export const sup = (e) => [...String(e)].map((c) => SUP[Number(c)]).join("");

/** [2, 2, 3, 5] → [{p:2, e:2}, {p:3, e:1}, {p:5, e:1}] */
export function powers(fs) {
  /** @type {{ p: number, e: number }[]} */
  const out = [];
  for (const p of fs) {
    const last = out[out.length - 1];
    if (last && last.p === p) last.e++;
    else out.push({ p, e: 1 });
  }
  return out;
}

export const fmtProduct = (fs) => fs.join(" × ");
export const fmtPowers = (fs) =>
  powers(fs)
    .map(({ p, e }) => (e > 1 ? `${p}${sup(e)}` : String(p)))
    .join(" × ");
export const hasRepeat = (fs) => powers(fs).some((x) => x.e > 1);
export const product = (fs) => fs.reduce((a, b) => a * b, 1);

/**
 * @typedef {{ id: number, n: number, depth: number, parent: number, kids: number[] }} Node
 * The whole tree for `n`, split first as `split`; deeper splits take the
 * smallest prime × the rest. Ids run in breadth-first order, so a node keeps
 * the same id in every layout and the stage can reuse one pool of elements.
 */
export function buildTree(n, split) {
  /** @type {Node[]} */
  const nodes = [{ id: 0, n, depth: 0, parent: -1, kids: [] }];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isPrime(node.n)) continue;
    const [a, b] = i === 0 ? split : [smallestPrime(node.n), node.n / smallestPrime(node.n)];
    for (const k of [a, b]) {
      const kid = { id: nodes.length, n: k, depth: node.depth + 1, parent: i, kids: [] };
      node.kids.push(kid.id);
      nodes.push(kid);
    }
  }
  return nodes;
}

export const leavesOf = (nodes) => nodes.filter((x) => !x.kids.length);
export const heightOf = (nodes) => Math.max(...nodes.map((x) => x.depth));

/** The composite numbers that can still be split among the visible leaves. */
export const pairOf = (nodes, id) => nodes[id].kids.map((k) => nodes[k].n);

/**
 * Which nodes are on stage when the nodes in `split` have been split: the root
 * and every child of a split node (a node can only be split once it is visible).
 * @param {Node[]} nodes @param {number[]} split
 */
export function visibleNodes(nodes, split) {
  const open = new Set(split);
  const out = [0];
  for (let i = 0; i < out.length; i++) {
    if (open.has(out[i])) out.push(...nodes[out[i]].kids);
  }
  return out;
}

/** Visible leaves that are composite: the ones the student can still split. */
export const splittable = (nodes, split) =>
  visibleNodes(nodes, split).filter(
    (id) => nodes[id].kids.length && !split.includes(id) && !isPrime(nodes[id].n),
  );

/**
 * Where each visible node sits. Leaves are spread evenly; a parent sits over
 * the middle of its children. Returns {id: {x, y}} for the visible ids.
 * @param {Node[]} nodes @param {number[]} split
 */
export function layout(nodes, split) {
  const vis = visibleNodes(nodes, split);
  const open = new Set(split);
  const isLeaf = (id) => !open.has(id) || !nodes[id].kids.length;
  /** @type {number[]} */
  const leaves = [];
  const walk = (/** @type {number} */ id) => {
    if (isLeaf(id)) leaves.push(id);
    else for (const k of nodes[id].kids) walk(k);
  };
  walk(0);
  const sp = Math.min(96, (W - 70) / Math.max(1, leaves.length));
  const levels = Math.max(1, ...vis.map((id) => nodes[id].depth));
  const dy = Math.min(66, 170 / levels);
  /** @type {Record<number, { x: number, y: number }>} */
  const pos = {};
  const place = (id) => {
    const nd = nodes[id];
    if (isLeaf(id)) {
      const i = leaves.indexOf(id);
      pos[id] = { x: W / 2 + (i - (leaves.length - 1) / 2) * sp, y: 46 + nd.depth * dy };
    } else {
      for (const k of nd.kids) place(k);
      const xs = nd.kids.map((k) => pos[k].x);
      pos[id] = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: 46 + nd.depth * dy };
    }
  };
  place(0);
  return pos;
}

/** The finished row of primes along the bottom, smallest first. */
export function primeRow(fs) {
  const sp = Math.min(64, (W - 80) / fs.length);
  return fs.map((p, i) => ({ p, x: W / 2 + (i - (fs.length - 1) / 2) * sp }));
}

/** @returns {{ n: number, split: number[], leaves: number, fs: number[] } | null} */
function treeSpec(n, split, minLeaves) {
  if (!okInt(n, 6, 400) || !Array.isArray(split) || split.length !== 2) return null;
  const [a, b] = split.map(Number);
  if (!okInt(a, 2, n) || !okInt(b, 2, n) || a * b !== n) return null;
  const fs = primeFactors(n);
  if (fs.length < minLeaves || fs.length > MAX_LEAVES || !hasRepeat(fs)) return null;
  return { n, split: [a, b], leaves: fs.length, fs };
}

/**
 * @param {any} cfg
 */
export function validateFactorTree(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const main = treeSpec(Number(cfg.n), cfg.split, 3);
  if (!main) return null;
  const alt = Array.isArray(cfg.alt) ? cfg.alt.map(Number) : null;
  if (!alt || alt.length !== 2 || alt[0] * alt[1] !== main.n) return null;
  if (!okInt(alt[0], 2, main.n) || !okInt(alt[1], 2, main.n)) return null;
  if ([...alt].sort((x, y) => x - y).join() === [...main.split].sort((x, y) => x - y).join())
    return null;
  const t = cfg.transfer;
  const transfer = t ? treeSpec(Number(t.n), t.split, 3) : null;
  if (!transfer || transfer.n === main.n) return null;
  const story = cfg.story == null ? null : cleanPair(cfg.story);
  if (cfg.story != null && !story) return null;
  const trees = {
    main: buildTree(main.n, main.split),
    alt: buildTree(main.n, /** @type {[number, number]} */ (alt)),
    transfer: buildTree(transfer.n, transfer.split),
  };
  // A pool of elements serves all three trees; the first split must not already be prime-only.
  if (trees.main[1] && isPrime(trees.main[1].n) && isPrime(trees.main[2].n)) return null;
  return { main, alt, transfer, story, trees };
}

/**
 * The first split's prediction: which of the two factors can still be split.
 * Every subset is offered, so exactly one option is the truth.
 * @param {number} a @param {number} b
 */
export function splitChoices(a, b) {
  const truth = [a, b].filter((x) => !isPrime(x));
  const sets = [[a, b], [a], [b], []];
  return sets.map((s) => {
    const correct = s.length === truth.length && s.every((x) => truth.includes(x));
    // The first discrepancy decides the cue: a prime wrongly included, or a composite left out.
    const wrongIn = s.find((x) => isPrime(x));
    const missed = truth.find((x) => !s.includes(x));
    return { set: s, correct, wrongIn, missed };
  });
}

/**
 * The prime-factorization choices: the right answer in exponent form plus
 * three real mistakes (stop at the first split, forget repeats, put the
 * exponent on the wrong prime).
 * @param {{ n: number, split: number[], fs: number[] }} spec
 */
export function factorizationChoices(spec) {
  const { n, split, fs } = spec;
  const right = fmtPowers(fs);
  /** @type {{ text: string, correct: boolean, kind: string }[]} */
  const raw = [{ text: right, correct: true, kind: "right" }];
  const composite = split.find((x) => !isPrime(x));
  if (composite != null)
    raw.push({ text: `${split[0]} × ${split[1]}`, correct: false, kind: "stop" });
  const uniq = [...new Set(fs)];
  if (uniq.length < fs.length)
    raw.push({ text: fmtProduct(uniq), correct: false, kind: "repeats" });
  const pw = powers(fs);
  if (pw.length > 1 && pw.some((x) => x.e > 1)) {
    const exps = pw.map((x) => x.e);
    const rot = pw.map((x, i) => ({ p: x.p, e: exps[(i + 1) % pw.length] }));
    const text = rot.map(({ p, e }) => (e > 1 ? `${p}${sup(e)}` : String(p))).join(" × ");
    const value = rot.reduce((a, { p, e }) => a * p ** e, 1);
    if (value !== n) raw.push({ text, correct: false, kind: "exponent" });
  }
  if (fs.length > 2) raw.push({ text: fmtProduct(fs.slice(0, -1)), correct: false, kind: "short" });
  const seen = new Set();
  const uniqRaw = raw.filter((o) => !seen.has(o.text) && seen.add(o.text));
  return uniqRaw.slice(0, 4);
}

const isAre = (n, lang) =>
  n === 1 ? (lang === "es" ? "es primo" : "is prime") : lang === "es" ? "son primos" : "are prime";

/** "2 and 3 are prime" */
export function primeNote(nums) {
  const list = (lang) =>
    nums.length > 1 ? nums.join(lang === "es" ? " y " : " and ") : String(nums[0]);
  return P(
    `${list("en")} ${isAre(nums.length, "en")}`,
    `${list("es")} ${isAre(nums.length, "es")}`,
  );
}

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {NonNullable<ReturnType<typeof validateFactorTree>>} v
 */
export function factorTreeCopy(v) {
  const { main, alt, transfer, story, trees } = v;
  const [a, b] = main.split;
  const n = main.n;
  const prod = fmtProduct(main.fs);
  const pow = fmtPowers(main.fs);
  const rep = powers(main.fs).find((x) => x.e > 1) ?? { p: 2, e: 2 };
  const repText = fmtProduct(Array(rep.e).fill(rep.p));
  const t = transfer;
  const [ta, tb] = t.split;
  const tProd = fmtProduct(t.fs);
  const tPow = fmtPowers(t.fs);
  const smallPair = (x) => `${x} = ${smallestPrime(x)} × ${x / smallestPrime(x)}`;
  const composites = [a, b].filter((x) => !isPrime(x));
  return {
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P(`Break ${n} into primes`, `Descompón ${n} en primos`),
    ariaLabel: P(
      `A factor tree for ${n}. ${n} splits into ${a} and ${b}. Every factor that is not prime keeps splitting until each leaf is prime: ${prod}.`,
      `Un árbol de factores de ${n}. ${n} se separa en ${a} y ${b}. Cada factor que no es primo se sigue separando hasta que cada hoja es prima: ${prod}.`,
    ),
    printSummary: P(
      `${n} = ${a} × ${b}. Keep splitting every factor that is not prime. The leaves are ${prod}, so ${n} = ${pow}. A different first split, ${alt.join(" × ")}, ends on the same primes. ${t.n} = ${tPow}.`,
      `${n} = ${a} × ${b}. Sigue separando cada factor que no es primo. Las hojas son ${prod}, así que ${n} = ${pow}. Otra primera separación, ${alt.join(" × ")}, termina en los mismos primos. ${t.n} = ${tPow}.`,
    ),
    scene: {
      situate: P("The number", "El número"),
      predict: P("Predict", "Predice"),
      grow: P("Grow the tree", "Haz crecer el árbol"),
      connect: P("The product", "El producto"),
      other: P("Another tree", "Otro árbol"),
      transfer: P("On your own", "Por tu cuenta"),
    },
    legend: {
      prime: P("prime: stop", "primo: se detiene"),
      composite: P("composite: split", "compuesto: se separa"),
    },
    situateSay: story
      ? P(
          `${story.en} Start with any two factors that multiply to make it: ${n} = ${a} × ${b}.`,
          `${story.es} Empieza con dos factores cualesquiera que se multipliquen para formarlo: ${n} = ${a} × ${b}.`,
        )
      : P(
          `Break ${n} into factors that multiply to make it. Start with any two: ${n} = ${a} × ${b}.`,
          `Separa ${n} en factores que se multipliquen para formarlo. Empieza con dos cualesquiera: ${n} = ${a} × ${b}.`,
        ),
    predictSay: P(
      `A prime number has exactly two factors, 1 and itself, so it cannot be split. Predict before you split.`,
      `Un número primo tiene exactamente dos factores, 1 y él mismo, así que no se puede separar. Predice antes de separar.`,
    ),
    predictQ: P(
      `Which of ${a} and ${b} can still be split into smaller factors?`,
      `¿Cuál de ${a} y ${b} todavía se puede separar en factores más pequeños?`,
    ),
    predictLabel: (/** @type {number[]} */ s) =>
      s.length === 2
        ? P(`Both ${a} and ${b}`, `${a} y ${b}`)
        : s.length === 1
          ? P(`Only ${s[0]}`, `Solo ${s[0]}`)
          : P(`Neither: ${a} × ${b} = ${n} is finished`, `Ninguno: ${a} × ${b} = ${n} ya terminó`),
    cueIn: (/** @type {number} */ x) =>
      P(
        `Count the factors of ${x}. A prime has only two: 1 and itself. Does ${x} have more?`,
        `Cuenta los factores de ${x}. Un primo solo tiene dos: 1 y él mismo. ¿${x} tiene más?`,
      ),
    cueMissed: (/** @type {number} */ x) =>
      P(
        `Look at ${x} in the tree. Can you find two numbers bigger than 1 that multiply to make ${x}?`,
        `Mira el ${x} en el árbol. ¿Puedes hallar dos números mayores que 1 que se multipliquen para formar ${x}?`,
      ),
    predictOk: P(
      `Yes: ${composites.map(smallPair).join(" and ")}. A number you can split is composite, so keep splitting until nothing can.`,
      `Sí: ${composites.map(smallPair).join(" y ")}. Un número que se puede separar es compuesto, así que sigue separando hasta que ya no se pueda.`,
    ),
    growSay: P(
      "Split every square (composite) number. Circles are prime: they stay.",
      "Separa cada número cuadrado (compuesto). Los círculos son primos: se quedan.",
    ),
    growQ: P("Choose a number to split:", "Elige un número para separar:"),
    splitBtn: (/** @type {number} */ x) => P(`Split ${x}`, `Separar ${x}`),
    splitDone: (/** @type {number} */ x, /** @type {number[]} */ kids) => {
      const primes = kids.filter(isPrime);
      const base = P(`${x} = ${kids.join(" × ")}.`, `${x} = ${kids.join(" × ")}.`);
      if (!primes.length)
        return P(`${base.en} Neither is prime yet.`, `${base.es} Ninguno es primo todavía.`);
      const note = primeNote(primes);
      return P(
        `${base.en} ${note.en}, so ${primes.length > 1 ? "those branches stop" : "that branch stops"}.`,
        `${base.es} ${note.es}, así que ${primes.length > 1 ? "esas ramas se detienen" : "esa rama se detiene"}.`,
      );
    },
    growDone: P(
      `Every leaf is prime. Nothing is left to split.`,
      `Cada hoja es prima. Ya no queda nada por separar.`,
    ),
    connectSay: [
      P(
        `The circles at the bottom are the prime factors. Line them up, smallest first: ${n} = ${prod}.`,
        `Los círculos de abajo son los factores primos. Alinéalos, del menor al mayor: ${n} = ${prod}.`,
      ),
      P(
        `${repText} is the prime ${rep.p} used ${rep.e} times, written ${rep.p}${sup(rep.e)}. So ${n} = ${pow}.`,
        `${repText} es el primo ${rep.p} usado ${rep.e} veces, escrito ${rep.p}${sup(rep.e)}. Así que ${n} = ${pow}.`,
      ),
    ],
    connectCheck: P(`Check: ${prod} = ${n}.`, `Comprueba: ${prod} = ${n}.`),
    otherSay: P(
      `A classmate starts with ${alt[0]} × ${alt[1]} instead. Their tree grows a different shape.`,
      `Una compañera empieza con ${alt[0]} × ${alt[1]}. Su árbol crece con otra forma.`,
    ),
    otherQ: P(
      `Compare the circles at the bottom of this tree with the first tree. What do you notice?`,
      `Compara los círculos de abajo de este árbol con los del primero. ¿Qué notas?`,
    ),
    otherOptions: {
      same: P(`The same primes: ${prod}`, `Los mismos primos: ${prod}`),
      diff: P(
        "Different primes, because the first split was different",
        "Primos distintos, porque la primera separación fue distinta",
      ),
      order: P(
        "The same primes only if you split in the same order",
        "Los mismos primos solo si separas en el mismo orden",
      ),
      mistake: P(
        "One tree has a mistake, because the trees look different",
        "Un árbol tiene un error, porque los árboles se ven distintos",
      ),
    },
    otherCues: {
      diff: P(
        "Read the circles at the bottom of this tree, then the circles of the first tree. Are they the same numbers?",
        "Lee los círculos de abajo de este árbol y luego los del primero. ¿Son los mismos números?",
      ),
      order: P(
        "Does the order of the splits change which circles end up at the bottom? Read them again.",
        "¿El orden de las separaciones cambia qué círculos quedan abajo? Léelos otra vez.",
      ),
      mistake: P(
        `Multiply the circles at the bottom of this tree. Do they make ${n}?`,
        `Multiplica los círculos de abajo de este árbol. ¿Dan ${n}?`,
      ),
    },
    otherOk: P(
      `Yes. Different trees, same prime factors: ${prod}. The first split changes the shape of the tree, never the primes.`,
      `Sí. Árboles distintos, los mismos factores primos: ${prod}. La primera separación cambia la forma del árbol, nunca los primos.`,
    ),
    transferSay: P(
      `Now ${t.n} = ${ta} × ${tb}. Keep splitting in your head until every factor is prime.`,
      `Ahora ${t.n} = ${ta} × ${tb}. Sigue separando en tu cabeza hasta que cada factor sea primo.`,
    ),
    transferQ: P(
      `Which is the prime factorization of ${t.n}?`,
      `¿Cuál es la descomposición en factores primos de ${t.n}?`,
    ),
    transferCues: {
      stop: P(
        `That is the first split. Is every factor prime? Check each one.`,
        `Esa es la primera separación. ¿Todos los factores son primos? Revisa cada uno.`,
      ),
      repeats: P(
        `Multiply your factors. Do they make ${t.n}? Which prime shows up more than once?`,
        `Multiplica tus factores. ¿Dan ${t.n}? ¿Qué primo aparece más de una vez?`,
      ),
      exponent: P(
        `Work out the powers and multiply. Does it make ${t.n}? Which prime was used twice?`,
        `Calcula las potencias y multiplica. ¿Da ${t.n}? ¿Qué primo se usó dos veces?`,
      ),
      short: P(
        `Multiply these factors. Do they make ${t.n}, or is a prime missing?`,
        `Multiplica estos factores. ¿Dan ${t.n}, o falta un primo?`,
      ),
    },
    transferOk: P(
      `Yes: ${t.n} = ${tProd} = ${tPow}. Check: ${tProd} = ${t.n}.`,
      `Sí: ${t.n} = ${tProd} = ${tPow}. Comprueba: ${tProd} = ${t.n}.`,
    ),
    explainLabel: P(
      "Explain: how do you know a factor tree is finished?",
      "Explica: ¿cómo sabes que un árbol de factores ya terminó?",
    ),
    explainFrame: P(
      `I keep splitting until ___. So ${t.n} = ___.`,
      `Sigo separando hasta que ___. Así que ${t.n} = ___.`,
    ),
    trees,
  };
}

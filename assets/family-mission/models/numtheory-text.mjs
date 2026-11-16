// Every sentence the "numtheory" family shows or speaks, in English and Spanish. All functions take
// the derived state `d` (see numtheory.mjs) and never reveal the answer before the student has
// reached it: the greatest common factor and the least common multiple come out of `d` as null
// until then.
import { t } from "./core.mjs";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const word = (lang, key, d) => t(lang, d.ctx[key]);
const unit = (lang, d) => (d.ctx.unit ? ` ${t(lang, d.ctx.unit)}` : "");
const packs = (lang, k) =>
  t(lang, {
    en: `${k} ${k === 1 ? "pack" : "packs"}`,
    es: `${k} ${k === 1 ? "paquete" : "paquetes"}`,
  });
const leftEs = (r) => (r === 1 ? "sobra 1" : `sobran ${r}`);

export const STR = {
  problem: { en: "Pick a problem", es: "Elige un problema" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  tryFor: (lang, k) => t(lang, { en: `Try ${packs("en", k)}`, es: `Probar ${packs("es", k)}` }),
  how: { en: "How many packs?", es: "¿Cuántos paquetes?" },
  fewer: { en: "One fewer pack", es: "Un paquete menos" },
  more: { en: "One more pack", es: "Un paquete más" },
  claim: { en: "This is the greatest", es: "Este es el mayor" },
  common: { en: "common", es: "común" },
  both: { en: "both", es: "ambos" },
  prime: { en: "prime", es: "primo" },
  split: { en: "tap to split", es: "toca para separar" },
  none: { en: "none yet", es: "todavía ninguno" },
  count: { en: "How many of each?", es: "¿Cuántos de cada uno?" },
  again: { en: "Try another way", es: "Probar de otra forma" },
  range: (lang, max) =>
    t(lang, {
      en: `Type a whole number from 1 to ${max}.`,
      es: `Escribe un número entero del 1 al ${max}.`,
    }),
  factorsOf: (lang, x) => t(lang, { en: `Factors of ${x} so far`, es: `Factores de ${x} hasta ahora` }),
  missed: (lang, xs) => t(lang, { en: `Did not split both: ${xs.join(", ")}`, es: `No repartieron los dos: ${xs.join(", ")}` }),
  trackName: (lang, d, key) => {
    const n = d[key];
    return t(lang, {
      en: `${cap(word("en", key, d))}: count by ${n}`,
      es: `${cap(word("es", key, d))}: cuenta de ${n} en ${n}`,
    });
  },
  nextOf: (lang, d, key) => t(lang, { en: `Next multiple of ${d[key]}`, es: `Siguiente múltiplo de ${d[key]}` }),
  nextAria: (lang, d, key) =>
    t(lang, {
      en: `Add the next multiple of ${d[key]} to the ${word("en", key, d)} line`,
      es: `Agregar el siguiente múltiplo de ${d[key]} a la fila de ${word("es", key, d)}`,
    }),
  splitAria: (lang, v) => t(lang, { en: `Split ${v}`, es: `Separar ${v}` }),
  pairFor: (lang, v) => t(lang, { en: `Split ${v} into two factors`, es: `Separa ${v} en dos factores` }),
};

// ── GCF ──────────────────────────────────────────────────────────────────────

function eachLine(lang, d, key) {
  const { last } = d;
  const x = d[key];
  const [q, r] = key === "a" ? [last.qa, last.ra] : [last.qb, last.rb];
  const head = `${x} ${word(lang, key, d)} ÷ ${packs(lang, last.k)} = ${q}`;
  if (r === 0) return t(lang, { en: `${head} in each pack, none left over.`, es: `${head} en cada paquete, no sobra nada.` });
  return t(lang, { en: `${head} in each pack and ${r} left over.`, es: `${head} en cada paquete y ${leftEs(r)}.` });
}

export function tryLines(d, lang) {
  if (!d.last) return [];
  const k = d.last.k;
  const verdict = d.last.both
    ? t(lang, { en: `${packs("en", k)} works for both numbers: ${k} is a common factor.`, es: `${packs("es", k)} sirve para los dos números: ${k} es un factor común.` })
    : t(lang, { en: `${packs("en", k)} does not split both numbers evenly. Try another look.`, es: `${packs("es", k)} no reparte bien los dos números. Prueba con otro número.` });
  return [eachLine(lang, d, "a"), eachLine(lang, d, "b"), verdict];
}

/** Why a "this is the greatest" tap was not accepted, without naming the greatest. */
export function claimMessage(d, k, lang) {
  if (!d.tried.includes(k)) return t(lang, { en: "Try that many packs first, then check it.", es: "Primero prueba esa cantidad de paquetes y revísala." });
  if (!d.common.includes(k)) return t(lang, { en: `${k} does not split both numbers. Try another look.`, es: `${k} no reparte bien los dos números. Prueba con otro número.` });
  return t(lang, { en: "That one works for both, and a bigger one works too. Keep looking.", es: "Ese sirve para los dos, y uno mayor también sirve. Sigue buscando." });
}

const GCF_HINT = {
  try: {
    en: "Pick how many packs to make. Every pack must hold the same number of each thing, with nothing left over.",
    es: "Elige cuántos paquetes armar. Cada paquete debe tener la misma cantidad de cada cosa, sin que sobre nada.",
  },
  keep: {
    en: "Keep trying pack counts. A number joins a factor list when it splits that number evenly.",
    es: "Sigue probando cantidades de paquetes. Un número entra en una lista de factores cuando reparte bien ese número.",
  },
  claim: {
    en: "You found a shared factor. Keep trying. When you think you have the greatest one that works for both, tap “This is the greatest”.",
    es: "Encontraste un factor compartido. Sigue probando. Cuando creas que tienes el mayor que sirve para los dos, toca “Este es el mayor”.",
  },
};

function gcfResult(d, lang) {
  const { a, b, gcf: g, pack } = d;
  const la = word(lang, "a", d);
  const lb = word(lang, "b", d);
  return [
    t(lang, { en: `The greatest common factor (GCF) of ${a} and ${b} is ${g}.`, es: `El máximo común divisor (MCD) de ${a} y ${b} es ${g}.` }),
    t(lang, {
      en: `You can make ${packs("en", g)}. Each pack holds ${a} ÷ ${g} = ${pack.a} ${la} and ${b} ÷ ${g} = ${pack.b} ${lb}.`,
      es: `Se pueden armar ${packs("es", g)}. Cada paquete lleva ${a} ÷ ${g} = ${pack.a} ${la} y ${b} ÷ ${g} = ${pack.b} ${lb}.`,
    }),
    t(lang, {
      en: `Check: ${g} × ${pack.a} = ${a} and ${g} × ${pack.b} = ${b}. Nothing is left over.`,
      es: `Comprueba: ${g} × ${pack.a} = ${a} y ${g} × ${pack.b} = ${b}. No sobra nada.`,
    }),
  ];
}

// ── LCM ──────────────────────────────────────────────────────────────────────

export function lcmMatch(d, lang) {
  const { a, b, match: l } = d;
  const u = unit(lang, d);
  return t(lang, {
    en: `Both lines reach ${l}${u}. It is the first number they share, so the least common multiple (LCM) of ${a} and ${b} is ${l}.`,
    es: `Las dos filas llegan a ${l}${u}. Es el primer número que comparten, así que el mínimo común múltiplo (mcm) de ${a} y ${b} es ${l}.`,
  });
}

const LCM_HINT = {
  extend: {
    en: "Count on one jump at a time on each line. Watch for a number that shows up on both lines.",
    es: "Avanza un salto a la vez en cada fila. Busca un número que aparezca en las dos filas.",
  },
  count: { en: "You reached the first match. Tap “How many of each?”.", es: "Llegaste a la primera coincidencia. Toca “¿Cuántos de cada uno?”." },
};

function lcmResult(d, lang) {
  const { a, b, match: l, qa, qb } = d;
  const per = word(lang, "per", d);
  return [
    lcmMatch(d, lang),
    `${cap(word(lang, "a", d))}: ${l} ÷ ${a} = ${qa} ${per}.`,
    `${cap(word(lang, "b", d))}: ${l} ÷ ${b} = ${qb} ${per}.`,
    t(lang, { en: `Check: ${qa} × ${a} = ${l} and ${qb} × ${b} = ${l}.`, es: `Comprueba: ${qa} × ${a} = ${l} y ${qb} × ${b} = ${l}.` }),
  ];
}

// ── Factor tree ──────────────────────────────────────────────────────────────

const TREE_HINT = {
  pick: { en: "Tap a number that can still split. A prime stops.", es: "Toca un número que todavía se pueda separar. Un número primo se detiene." },
};

function treeResult(d, lang) {
  const line = d.primes.join(" × ");
  const eq = d.power === line ? `${d.n} = ${line}` : `${d.n} = ${line} = ${d.power}`;
  const out = [eq, t(lang, { en: `Check: ${line} = ${d.product}.`, es: `Comprueba: ${line} = ${d.product}.` })];
  const e = d.earlier[0];
  if (e) {
    const old = `${e.start[0]} × ${e.start[1]}`;
    const now = `${d.start[0]} × ${d.start[1]}`;
    out.push(
      t(lang, {
        en: `An earlier tree started with ${old} and ended in ${e.primes.join(", ")}. This one started with ${now} and ended in ${d.primes.join(", ")}. Different starts, same primes.`,
        es: `Un árbol anterior empezó con ${old} y terminó en ${e.primes.join(", ")}. Este empezó con ${now} y terminó en ${d.primes.join(", ")}. Empiezos distintos, los mismos primos.`,
      }),
    );
  } else {
    out.push(t(lang, { en: "Try another starting pair. Do you get the same primes?", es: "Prueba con otro par para empezar. ¿Salen los mismos primos?" }));
  }
  return out;
}

// ── Shared entry points ──────────────────────────────────────────────────────

export function hint(d, lang) {
  if (d.mode === "gcf") return d.next ? t(lang, GCF_HINT[d.next]) : gcfResult(d, lang)[0];
  if (d.mode === "lcm") return d.next ? t(lang, LCM_HINT[d.next]) : lcmResult(d, lang)[0];
  if (d.next === "pair") return t(lang, { en: `Choose a factor pair for ${d.nodes[d.sel].v}. Only real pairs are shown.`, es: `Elige un par de factores de ${d.nodes[d.sel].v}. Solo se muestran pares verdaderos.` });
  return d.next ? t(lang, TREE_HINT.pick) : t(lang, { en: "Every leaf is prime. The tree is finished.", es: "Todas las hojas son primos. El árbol está terminado." });
}

export function resultLines(d, lang) {
  if (!d.finished) return [];
  return d.mode === "gcf" ? gcfResult(d, lang) : d.mode === "lcm" ? lcmResult(d, lang) : treeResult(d, lang);
}

export function describe(d, lang) {
  if (d.mode === "gcf") {
    return t(lang, {
      en: `Greatest common factor model for ${d.a} and ${d.b}. You have tried ${d.tried.length} pack counts. ${hint(d, "en")}`,
      es: `Modelo del máximo común divisor de ${d.a} y ${d.b}. Has probado ${d.tried.length} cantidades de paquetes. ${hint(d, "es")}`,
    });
  }
  if (d.mode === "lcm") {
    return t(lang, {
      en: `Skip-counting model for ${d.a} and ${d.b}. The line for ${d.a} has ${d.na} numbers: ${d.listA.join(", ") || "none"}. The line for ${d.b} has ${d.nb} numbers: ${d.listB.join(", ") || "none"}. ${d.match === null ? "" : lcmMatch(d, "en")}`.trim(),
      es: `Modelo de conteo salteado de ${d.a} y ${d.b}. La fila del ${d.a} tiene ${d.na} números: ${d.listA.join(", ") || "ninguno"}. La fila del ${d.b} tiene ${d.nb} números: ${d.listB.join(", ") || "ninguno"}. ${d.match === null ? "" : lcmMatch(d, "es")}`.trim(),
    });
  }
  const primes = d.nodes.filter((nd) => nd.kids === null && nd.prime).length;
  return t(lang, {
    en: `Factor tree for ${d.n}. The leaves are ${d.leaves.join(", ")}; ${primes} of ${d.leaves.length} are prime. ${hint(d, "en")}`,
    es: `Árbol de factores de ${d.n}. Las hojas son ${d.leaves.join(", ")}; ${primes} de ${d.leaves.length} son primos. ${hint(d, "es")}`,
  });
}

export function explain(d, lang) {
  const intro =
    d.mode === "tree"
      ? t(lang, { en: `Write ${d.n} as a product of primes.`, es: `Escribe ${d.n} como producto de primos.` })
      : d.mode === "gcf"
        ? t(lang, { en: `Find the greatest number of identical packs for ${d.a} and ${d.b}.`, es: `Halla la mayor cantidad de paquetes iguales con ${d.a} y ${d.b}.` })
        : t(lang, { en: `Find the first number on both lines, counting by ${d.a} and by ${d.b}.`, es: `Halla el primer número que está en las dos filas, contando de ${d.a} en ${d.a} y de ${d.b} en ${d.b}.` });
  const body = d.finished ? resultLines(d, lang).map((line, i) => (d.mode === "tree" && i === 0 ? `${line}.` : line)) : [hint(d, lang)];
  return [intro, ...body].join(" ");
}

/** Polite announcement after a change. */
export function say(d, lang) {
  if (d.finished) return resultLines(d, lang).slice(0, 2).join(" ");
  if (d.mode === "gcf") return d.last ? tryLines(d, lang).join(" ") : hint(d, lang);
  if (d.mode === "lcm") return d.match !== null ? lcmMatch(d, lang) : describe(d, lang);
  return hint(d, lang);
}

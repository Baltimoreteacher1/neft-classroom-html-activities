// living/property-shift-model.js — the mathematics of the property-shift play (6-8).
//
// Three groups of tiles (3 guitarists, 5 drummers, 2 keyboard players) can trade
// places (commutative), be grouped two at a time (associative) and be added
// to a group of nothing (identity) — and the total never moves. Pure functions
// only (no DOM): every number the play shows is computed here, so
// property-shift.test.mjs can check each one in node.

import { okInt, placeCorrect } from "./mean-balance-model.js";

export { placeCorrect };

export const GROUPING = ["none", "first", "last"];

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const sum = (xs) => xs.reduce((s, x) => s + x, 0);

/** A new order after trading the two groups on one side: [0,1,2] -> [1,0,2] ("left"). */
export function swapSide(order, side) {
  const [i, j] = side === "left" ? [0, 1] : [1, 2];
  const next = [...order];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** "(3 + 5) + 2", "5 + 3 + 2", "3 + (5 + 2)". */
export function exprFor(counts, order, grouping) {
  const [a, b, c] = order.map((i) => counts[i]);
  if (grouping === "first") return `(${a} + ${b}) + ${c}`;
  if (grouping === "last") return `${a} + (${b} + ${c})`;
  return `${a} + ${b} + ${c}`;
}

/** The subtotal inside the parentheses, or null with no grouping. */
export function subtotal(counts, order, grouping) {
  const [a, b, c] = order.map((i) => counts[i]);
  if (grouping === "first") return a + b;
  if (grouping === "last") return b + c;
  return null;
}

export const arrangementKey = (order, grouping) => `${order.join("")}|${grouping}`;

const sameGroups = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Does this order differ from the starting one? */
export const isSwapped = (order) => !sameGroups(order, [0, 1, 2]);

/** The identity-property choices: one true identity and two other true facts that are not it. */
export function identityChoices(v) {
  const { identity: n, commute: c, regroup: r } = v;
  return [
    { kind: "identity", text: `${n} + 0 = ${n}`, correct: true },
    { kind: "commute", text: `${c.a} + ${c.b} = ${c.b} + ${c.a}`, correct: false },
    {
      kind: "regroup",
      text: `(${r.a} × ${r.b}) × ${r.c} = ${r.a} × (${r.b} × ${r.c})`,
      correct: false,
    },
    { kind: "zero", text: `${n} × 0 = 0`, correct: false },
  ];
}

const cleanName = (p, max) =>
  p && typeof p.en === "string" && p.en.trim() && p.en.length <= max
    ? { en: p.en, es: typeof p.es === "string" && p.es.trim() ? p.es.slice(0, max) : p.en }
    : null;

export function validatePropertyShift(cfg) {
  const groups = Array.isArray(cfg?.groups) ? cfg.groups : [];
  if (groups.length !== 3) return null;
  const counts = groups.map((g) => Number(g?.n));
  if (!counts.every((n) => okInt(n, 1, 5)) || new Set(counts).size !== 3) return null;
  const names = groups.map((g) => {
    const label = cleanName(g?.label, 16);
    const short = cleanName(g?.short, 10);
    return label && short ? { ...label, short } : null;
  });
  const noun = cleanName(cfg?.noun, 20);
  const nounOne = cleanName(cfg?.nounOne, 20);
  if (names.some((n) => !n) || !noun || !nounOne) return null;
  const sub = { a: Number(cfg?.sub?.a), b: Number(cfg?.sub?.b) };
  if (!okInt(sub.a, 3, 12) || !okInt(sub.b, 2, sub.a - 1)) return null;
  const identity = Number(cfg?.identity);
  const commute = { a: Number(cfg?.commute?.a), b: Number(cfg?.commute?.b) };
  const regroup = {
    a: Number(cfg?.regroup?.a),
    b: Number(cfg?.regroup?.b),
    c: Number(cfg?.regroup?.c),
  };
  if (!okInt(identity, 2, 999) || !okInt(commute.a, 1, 99) || !okInt(commute.b, 1, 99)) return null;
  if (commute.a === commute.b) return null;
  if (![regroup.a, regroup.b, regroup.c].every((x) => okInt(x, 2, 20))) return null;
  const weDo = { a: Number(cfg?.weDo?.a ?? 6), b: Number(cfg?.weDo?.b ?? 9) };
  if (!okInt(weDo.a, 1, 99) || !okInt(weDo.b, 1, 99) || weDo.a === weDo.b) return null;
  let divide = null;
  if (cfg?.divide != null) {
    const a = Number(cfg.divide.a);
    const b = Number(cfg.divide.b);
    if (!okInt(a, 4, 99) || !okInt(b, 2, a - 1) || a % b !== 0 || a === b * b) return null;
    divide = { a, b };
  }
  return {
    counts,
    names,
    noun,
    nounOne,
    total: sum(counts),
    sub,
    divide,
    identity,
    commute,
    regroup,
    weDo,
    story: cleanName(cfg?.story, 400),
  };
}

const pair = (en, es) => ({ en, es });

/** Every sentence the play says. `v` is the validated config. */
export function propertyCopy(v) {
  const { counts, names, noun, nounOne, total, sub, divide, identity, commute, regroup, weDo } = v;
  const [a, b, c] = counts;
  const list = counts.map((n, i) => `${n} ${names[i].en}`).join(", ");
  const listEs = counts.map((n, i) => `${n} ${names[i].es}`).join(", ");
  const base = `${a} + ${b} + ${c}`;
  const swapped = `${b} + ${a} + ${c}`;
  const [firstSum, lastSum] = [a + b, b + c];
  const dv = divide
    ? {
        a: divide.a,
        b: divide.b,
        q: divide.a / divide.b,
        g: gcd(divide.b, divide.a),
      }
    : null;
  return {
    kicker: pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: pair("Change the order, keep the total", "Cambia el orden, conserva el total"),
    ariaLabel: pair(
      `Three groups of tiles: ${list}. However the groups trade places or are grouped in pairs, the total stays ${total} ${noun.en}.`,
      `Tres grupos de fichas: ${listEs}. Aunque los grupos cambien de lugar o se agrupen de dos en dos, el total sigue siendo ${total} ${noun.es}.`,
    ),
    printSummary: pair(
      `${base} = ${total}. Commutative Property: changing the order does not change the total, ${swapped} = ${total}. Associative Property: changing the grouping does not change it, (${a} + ${b}) + ${c} = ${a} + (${b} + ${c}) = ${total}. Identity Property: ${identity} + 0 = ${identity}. These work for adding and multiplying, not for subtracting or dividing.`,
      `${base} = ${total}. Propiedad conmutativa: cambiar el orden no cambia el total, ${swapped} = ${total}. Propiedad asociativa: cambiar la agrupación no lo cambia, (${a} + ${b}) + ${c} = ${a} + (${b} + ${c}) = ${total}. Propiedad de identidad: ${identity} + 0 = ${identity}. Estas propiedades sirven para sumar y multiplicar, no para restar ni dividir.`,
    ),
    scene: {
      situate: pair("The groups", "Los grupos"),
      predict: pair("Predict", "Predice"),
      shift: pair("Move the groups", "Mueve los grupos"),
      connect: pair("Name the moves", "Ponle nombre"),
      limits: pair("Does it always work?", "¿Siempre funciona?"),
      transfer: pair("On your own", "Por tu cuenta"),
    },
    situateSay: pair(
      `${v.story ? `${v.story.en} ` : ""}${list}. One tile for each ${nounOne.en}. Add the groups: ${base}.`,
      `${v.story ? `${v.story.es} ` : ""}${listEs}. Una ficha por cada ${nounOne.es}. Suma los grupos: ${base}.`,
    ),
    predictSay: pair(
      `Now the ${names[0].en} and the ${names[1].en} trade places, so the sum is written ${swapped}. Predict how many ${noun.en} there are in all.`,
      `Ahora los ${names[0].es} y los ${names[1].es} cambian de lugar, así que la suma se escribe ${swapped}. Predice cuántos ${noun.es} hay en total.`,
    ),
    predictQ: pair(
      `How many ${noun.en} are there in ${swapped}?`,
      `¿Cuántos ${noun.es} hay en ${swapped}?`,
    ),
    predictOpts: [
      {
        kind: "same",
        label: pair(
          `${total}: the same groups, the same total`,
          `${total}: los mismos grupos, el mismo total`,
        ),
      },
      {
        kind: "more",
        label: pair(
          `More than ${total}: the order changed, so the total changed`,
          `Más de ${total}: cambió el orden, así que cambió el total`,
        ),
      },
      {
        kind: "less",
        label: pair(
          `Fewer than ${total}: the order changed, so the total changed`,
          `Menos de ${total}: cambió el orden, así que cambió el total`,
        ),
      },
    ],
    predictCue: {
      more: pair(
        "No tile is added when the groups trade places. Count the tiles before and after: did any new tile appear?",
        "Al cambiar de lugar los grupos no se agrega ninguna ficha. Cuenta las fichas antes y después: ¿apareció alguna ficha nueva?",
      ),
      less: pair(
        "No tile disappears when the groups trade places. Count the tiles before and after: did any tile go missing?",
        "Al cambiar de lugar los grupos no desaparece ninguna ficha. Cuenta las fichas antes y después: ¿faltó alguna ficha?",
      ),
    },
    predictOk: pair(
      `Yes: ${swapped} = ${total}. The groups only traded places; every tile is still there. Now move the groups yourself.`,
      `Sí: ${swapped} = ${total}. Los grupos solo cambiaron de lugar; todas las fichas siguen ahí. Ahora mueve tú los grupos.`,
    ),
    shiftSay: pair(
      "Trade two groups, or group two of them in parentheses. The tiles move; watch the total.",
      "Cambia de lugar dos grupos o agrupa dos de ellos entre paréntesis. Las fichas se mueven; observa el total.",
    ),
    btnLeft: pair("Trade the left two groups", "Cambiar de lugar los dos de la izquierda"),
    btnRight: pair("Trade the right two groups", "Cambiar de lugar los dos de la derecha"),
    btnFirst: pair("Group the first two ( )", "Agrupar los dos primeros ( )"),
    btnLast: pair("Group the last two ( )", "Agrupar los dos últimos ( )"),
    btnNone: pair("Remove the parentheses", "Quitar los paréntesis"),
    startOver: pair("Start over", "Empezar de nuevo"),
    shiftRow: (expr, sub2) =>
      pair(
        `${expr} = ${total}${sub2 != null ? ` (the group in parentheses is ${sub2})` : ""}. Still ${total} ${noun.en}.`,
        `${expr} = ${total}${sub2 != null ? ` (el grupo entre paréntesis es ${sub2})` : ""}. Siguen siendo ${total} ${noun.es}.`,
      ),
    needSwap: pair("Now try trading two groups.", "Ahora prueba cambiar de lugar dos grupos."),
    needGroup: pair(
      "Now try putting two groups in parentheses.",
      "Ahora prueba poner dos grupos entre paréntesis.",
    ),
    needMore: pair("Try one more arrangement.", "Prueba otra disposición."),
    shiftDone: pair(
      `Every arrangement is ${total}. Trading places changed the order; the parentheses changed the grouping; no tile was added or removed.`,
      `Todas las disposiciones dan ${total}. Cambiar de lugar cambió el orden; los paréntesis cambiaron la agrupación; no se agregó ni se quitó ninguna ficha.`,
    ),
    connectSay: pair(
      `Two different moves, two names. Changing the order is the Commutative Property. Changing the grouping, where the parentheses go, is the Associative Property.`,
      `Dos movimientos distintos, dos nombres. Cambiar el orden es la propiedad conmutativa. Cambiar la agrupación, dónde van los paréntesis, es la propiedad asociativa.`,
    ),
    connectExprA: `${base} = ${swapped}`,
    connectExprB: `(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`,
    connectDone: pair(
      `Order: ${base} = ${swapped} = ${total} (commutative). Grouping: (${a} + ${b}) + ${c} = ${firstSum} + ${c} = ${total} and ${a} + (${b} + ${c}) = ${a} + ${lastSum} = ${total} (associative). The same works for ${weDo.a} + ${weDo.b} = ${weDo.b} + ${weDo.a} = ${weDo.a + weDo.b}.`,
      `Orden: ${base} = ${swapped} = ${total} (conmutativa). Agrupación: (${a} + ${b}) + ${c} = ${firstSum} + ${c} = ${total} y ${a} + (${b} + ${c}) = ${a} + ${lastSum} = ${total} (asociativa). Lo mismo pasa con ${weDo.a} + ${weDo.b} = ${weDo.b} + ${weDo.a} = ${weDo.a + weDo.b}.`,
    ),
    labelOrder: pair("order changes", "cambia el orden"),
    labelGroup: pair("grouping changes", "cambia la agrupación"),
    limitsSay: pair(
      `Does swapping always work? Start with ${sub.a} tiles and take ${sub.b} away. Then try ${sub.b} − ${sub.a}: start with ${sub.b} tiles and take ${sub.a} away.`,
      `¿Cambiar de lugar siempre funciona? Empieza con ${sub.a} fichas y quita ${sub.b}. Luego prueba ${sub.b} − ${sub.a}: empieza con ${sub.b} fichas y quita ${sub.a}.`,
    ),
    limitsQ: pair(
      `Is ${sub.b} − ${sub.a} the same as ${sub.a} − ${sub.b}?`,
      `¿${sub.b} − ${sub.a} es lo mismo que ${sub.a} − ${sub.b}?`,
    ),
    limitsOpts: [
      {
        kind: "no",
        label: pair(
          `No: the order matters when you subtract`,
          `No: al restar, el orden sí importa`,
        ),
      },
      {
        kind: "yes",
        label: pair(
          `Yes: ${sub.b} − ${sub.a} is also ${sub.a - sub.b}`,
          `Sí: ${sub.b} − ${sub.a} también es ${sub.a - sub.b}`,
        ),
      },
      {
        kind: "same",
        label: pair(`Yes: it is the same two numbers`, `Sí: son los mismos dos números`),
      },
    ],
    limitsCue: {
      yes: pair(
        `Start with ${sub.b} tiles on the stage. Can you take ${sub.a} of them away?`,
        `Empieza con ${sub.b} fichas en el escenario. ¿Puedes quitar ${sub.a} de ellas?`,
      ),
      same: pair(
        `The numbers are the same, but what do you START with in ${sub.a} − ${sub.b}, and what do you start with in ${sub.b} − ${sub.a}?`,
        `Los números son los mismos, pero ¿con qué EMPIEZAS en ${sub.a} − ${sub.b} y con qué empiezas en ${sub.b} − ${sub.a}?`,
      ),
    },
    limitsOk: pair(
      `Right: ${sub.a} − ${sub.b} = ${sub.a - sub.b}, but you cannot take ${sub.a} tiles from ${sub.b}. Swapping works for adding and multiplying only.${dv ? ` Dividing is the same: ${dv.a} ÷ ${dv.b} = ${dv.q}, but ${dv.b} ÷ ${dv.a} = ${dv.b / dv.g}/${dv.a / dv.g}.` : ""}`,
      `Correcto: ${sub.a} − ${sub.b} = ${sub.a - sub.b}, pero no puedes quitar ${sub.a} fichas de ${sub.b}. Cambiar de lugar solo sirve para sumar y multiplicar.${dv ? ` Con la división pasa lo mismo: ${dv.a} ÷ ${dv.b} = ${dv.q}, pero ${dv.b} ÷ ${dv.a} = ${dv.b / dv.g}/${dv.a / dv.g}.` : ""}`,
    ),
    rowCant: pair(
      `${sub.b} − ${sub.a}: only ${sub.b} tiles to take from`,
      `${sub.b} − ${sub.a}: solo hay ${sub.b} fichas de donde quitar`,
    ),
    rowTakeLabel: pair(
      `${sub.a} − ${sub.b}: take ${sub.b} away, ${sub.a - sub.b} left`,
      `${sub.a} − ${sub.b}: quita ${sub.b}, quedan ${sub.a - sub.b}`,
    ),
    transferSay: pair(
      `One more property. If nobody joins the band, ${total} + 0 stays ${total}. Which equation shows the Identity Property?`,
      `Una propiedad más. Si nadie se une a la banda, ${total} + 0 sigue siendo ${total}. ¿Qué ecuación muestra la propiedad de identidad?`,
    ),
    transferQ: pair(
      "Which equation shows the Identity Property?",
      "¿Qué ecuación muestra la propiedad de identidad?",
    ),
    transferCue: {
      commute: pair(
        `Did the numbers change places, or did a number stay the same? In this equation, what moved?`,
        `¿Los números cambiaron de lugar o un número se quedó igual? En esta ecuación, ¿qué se movió?`,
      ),
      regroup: pair(
        `Look at the parentheses: which numbers are grouped on each side? What changed, the order or the grouping?`,
        `Mira los paréntesis: ¿qué números se agrupan en cada lado? ¿Qué cambió, el orden o la agrupación?`,
      ),
      zero: pair(
        `${identity} × 0 does not leave ${identity} the same. What happens to ${identity} when you multiply it by 0?`,
        `${identity} × 0 no deja igual al ${identity}. ¿Qué le pasa al ${identity} cuando lo multiplicas por 0?`,
      ),
    },
    transferOk: pair(
      `Yes: ${identity} + 0 = ${identity}. Adding 0 or multiplying by 1 leaves a number the same: ${identity} × 1 = ${identity}.`,
      `Sí: ${identity} + 0 = ${identity}. Sumar 0 o multiplicar por 1 deja igual al número: ${identity} × 1 = ${identity}.`,
    ),
    explainLabel: pair(
      "Explain: which properties work for subtracting, and which do not?",
      "Explica: ¿cuáles propiedades sirven para restar y cuáles no?",
    ),
    explainFrame: pair(
      "Changing the order works for ___ and ___, but not for ___, because ___.",
      "Cambiar el orden sirve para ___ y ___, pero no para ___, porque ___.",
    ),
    zeroLabel: pair("+ 0", "+ 0"),
    regroup,
    commute,
  };
}

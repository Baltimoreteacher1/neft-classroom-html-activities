// living/place-value-blocks-model.js — the mathematics of the place-value-blocks play
// (2-11 Add and Subtract Decimals).
//
// Pure functions only (no DOM). Numbers are handled as whole hundredths so no
// floating-point sum can ever reach the stage: 128.75 is 12875 hundredths, the
// five columns are hundreds · tens · ones · tenths · hundredths.
//
// The small helpers at the top (okInt, near, placeCorrect, fmt) are also used by
// decimal-area-model.js and partial-quotients-model.js.

export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export const near = (x, y) => Math.abs(x - y) < 1e-9;

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const k = seed % options.length || 1; // never first
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}

/** 1,344 / 56,700 / 128.75 — a comma between thousands, digits as given. */
export function fmt(s) {
  const [int, frac] = String(s).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac == null ? grouped : `${grouped}.${frac}`;
}

/** Digits after the point of a plain decimal (no exponent notation). */
export function dpOf(x) {
  const s = String(x);
  if (/e/i.test(s)) return Infinity;
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

const hundredths = (x) => Math.round(x * 100);
export const COLS = 5; // hundreds · tens · ones · tenths · hundredths
export const ONES = 2; // index of the ones column

/** [H, T, O, t, h] digits of a number below 1000 with at most 2 decimals. */
export function colDigits(x) {
  return String(hundredths(x)).padStart(COLS, "0").split("").map(Number);
}
const toNumber = (d) => d.reduce((s, v) => s * 10 + v, 0) / 100;
const fix2 = (x) => fmt((Math.round(x * 100) / 100).toFixed(2));
const plain = (x) => fmt(String(x));

const okDec = (x, maxDp = 2) =>
  typeof x === "number" && Number.isFinite(x) && x > 0 && x < 1000 && dpOf(x) <= maxDp;

/**
 * Adding column by column: raw column sums, then every trade (10 of a place =
 * 1 of the place to its left), right to left. `trades` holds the column that
 * gives up its ten.
 */
export function addPlan(a, b) {
  const da = colDigits(a);
  const db = colDigits(b);
  const raw = da.map((v, i) => v + db[i]);
  const cur = [...raw];
  const trades = [];
  for (let c = COLS - 1; c > 0; c--) {
    if (cur[c] >= 10) {
      cur[c] -= 10;
      cur[c - 1] += 1;
      trades.push(c);
    }
  }
  return { da, db, raw, trades, after: cur, ok: cur[0] <= 9, sum: toNumber(cur) };
}

/**
 * Subtracting column by column, right to left. A column that cannot give
 * `take` trades 1 from its left neighbour for 10 here. Only single-hop trades
 * are drawable (the neighbour must have one to give); anything else is null.
 */
export function subPlan(a, c) {
  const work = colDigits(a);
  const take = colDigits(c);
  const steps = [];
  for (let col = COLS - 1; col >= 0; col--) {
    let trade = false;
    if (work[col] < take[col]) {
      if (col === 0 || work[col - 1] < 1) return null;
      work[col - 1] -= 1;
      work[col] += 10;
      trade = true;
    }
    const have = work[col];
    work[col] = have - take[col];
    steps.push({ col, trade, have, take: take[col], left: work[col] });
  }
  return { steps, after: work, result: toNumber(work), hasTrade: steps.some((s) => s.trade) };
}

// ---- column state for the discs (items: { k: kind, band }) -------------------
// kinds: a = first number, b = second number, r = traded (regrouped), g = taken away.
const items = (n, k, band) => Array.from({ length: n }, () => ({ k, band }));
export const colsOf = (digits, k, band) => digits.map((d) => items(d, k, band));
export const mergeCols = (x, y) => x.map((col, c) => [...col, ...y[c]]);
export const emptyCols = () => Array.from({ length: COLS }, () => []);
/** Trade 10 discs of column t for 1 disc of the column to its left. */
export const applyTrade = (cols, t) =>
  cols.map((col, c) =>
    c === t ? col.slice(10) : c === t - 1 ? [...col, { k: "r", band: "M" }] : col,
  );
/** Subtraction state after `upto` steps; solids first, then dashed "taken" discs. */
export function subCols(plan, sumDigits, upto) {
  const work = colsOf(sumDigits, "a", "M");
  for (const s of plan.steps.slice(0, upto)) {
    if (s.trade) {
      work[s.col - 1].pop();
      work[s.col].push(...items(10, "r", "M"));
    }
    const col = work[s.col];
    for (let j = 0; j < s.take; j++) col[col.length - 1 - j] = { k: "g", band: "M" };
  }
  return work;
}
/** Digits as strings, leading zeros blank (the ones place always shows). */
export const shown = (digits) =>
  digits.map((d, c) =>
    d == null || (c < ONES && d === 0 && digits.slice(0, c + 1).every((x) => !x)) ? "" : String(d),
  );

/** Place names, singular and plural, by column. */
export const PLACE = {
  pl: [
    { en: "hundreds", es: "centenas" },
    { en: "tens", es: "decenas" },
    { en: "ones", es: "unidades" },
    { en: "tenths", es: "décimas" },
    { en: "hundredths", es: "centésimas" },
  ],
  sg: [
    { en: "hundred", es: "centena" },
    { en: "ten", es: "decena" },
    { en: "one", es: "unidad" },
    { en: "tenth", es: "décima" },
    { en: "hundredth", es: "centésima" },
  ],
  value: ["100", "10", "1", "0.1", "0.01"],
};

/** The wrong sums a student actually writes, each with the misconception that made it. */
export function sumErrors(a, b) {
  const da = colDigits(a);
  const db = colDigits(b);
  const out = [];
  // Last digits lined up instead of the points: b's digits slide to a's scale.
  if (dpOf(b) < dpOf(a)) {
    const aInt = Math.round(a * 10 ** dpOf(a));
    const bInt = Math.round(b * 10 ** dpOf(b));
    out.push({ kind: "align", value: (aInt + bInt) / 10 ** dpOf(a) });
  }
  // Every column's ones written, no trade carried.
  out.push({ kind: "carry", value: toNumber(da.map((v, i) => (v + db[i]) % 10)) });
  // The right digits with the point put in the wrong place.
  out.push({ kind: "point", value: Math.round((a + b) * 1000) / 100 });
  return out;
}

/** Choices for "what is a + b": the sum plus its errors, deduped, 3-4 options or null. */
export function sumChoices(a, b) {
  const right = Math.round((a + b) * 100) / 100;
  const out = [{ kind: "sum", value: right, correct: true }];
  for (const e of sumErrors(a, b)) {
    const v = Math.round(e.value * 100) / 100;
    if (!near(v, right) && !out.some((o) => near(o.value, v))) out.push({ ...e, value: v });
  }
  return out.length >= 3 ? out : null;
}

/** Where does the last digit of b go? The right column plus the two usual slips. */
export function predictOptions(b) {
  const right = dpOf(b) === 1 ? 3 : 4;
  const cols = [right, right === 3 ? 4 : 3, ONES];
  return cols.map((col, i) => ({ col, correct: i === 0 }));
}

/** Round-number estimate of a + b − c, as the lesson writes it: tens, ones, ones. */
export function estimate(a, b, c) {
  const ea = Math.round(a / 10) * 10;
  const eb = Math.round(b);
  const ec = c == null ? 0 : Math.round(c);
  return { ea, eb, ec, total: ea + eb - ec };
}

const textOf = (s) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 300), es: String(s.es || s.en).slice(0, 300) }
    : null;
const unitOf = (u) =>
  textOf(u) ? { en: u.en.slice(0, 16), es: String(u.es || u.en).slice(0, 16) } : null;

/**
 * { a, b, c, unit:{en,es}, story:{en,es}, transfer:{a,b} } — a has 2 decimals,
 * b has fewer (so it needs a placeholder zero), the sum needs a trade, c comes
 * off the sum with a single-hop trade, the transfer sum has a full choice set.
 */
export function validatePlaceValue(cfg) {
  if (!cfg || !okDec(cfg.a) || !okDec(cfg.b, 1) || !okDec(cfg.c)) return null;
  if (dpOf(cfg.a) !== 2 || dpOf(cfg.b) !== 1) return null;
  const add = addPlan(cfg.a, cfg.b);
  if (!add.ok || add.trades.length < 1) return null;
  const sub = subPlan(add.sum, cfg.c);
  if (!sub || !sub.hasTrade || cfg.c >= add.sum) return null;
  const t = cfg.transfer;
  if (!t || !okDec(t.a) || !okDec(t.b, 1) || dpOf(t.a) !== 2 || dpOf(t.b) !== 1) return null;
  const tAdd = addPlan(t.a, t.b);
  if (!tAdd.ok || !tAdd.trades.length || !sumChoices(t.a, t.b)) return null;
  if (t.a === cfg.a && t.b === cfg.b) return null;
  return {
    a: cfg.a,
    b: cfg.b,
    c: cfg.c,
    add,
    sub,
    sum: add.sum,
    unit: unitOf(cfg.unit) || { en: "units", es: "unidades" },
    story: textOf(cfg.story),
    transfer: { a: t.a, b: t.b, plan: tAdd },
  };
}

/** Every sentence the play says, as {en, es} pairs, from the validated config. */
export function placeValueCopy(v) {
  const { a, b, c, add, sub, sum, unit } = v;
  const A = String(a);
  const B = String(b);
  const B2 = b.toFixed(2);
  const S = fix2(sum);
  const R = fix2(sub.result);
  const C = plain(c);
  const est = estimate(a, b, c);
  const t = v.transfer;
  const T = { a: String(t.a), b: String(t.b), b2: t.b.toFixed(2), s: fix2(t.plan.sum) };
  const bCol = dpOf(b) === 1 ? 3 : 4;
  const trade = (col) => ({
    en: `10 ${PLACE.pl[col].en} = 1 ${PLACE.sg[col - 1].en}`,
    es: `10 ${PLACE.pl[col].es} = 1 ${PLACE.sg[col - 1].es}`,
  });
  // "7 + 8 = 15 tenths" for one column of the addition.
  const colSum = (col) => {
    const parts = [add.da[col], add.db[col]];
    const carryIn = add.trades.includes(col + 1) ? 1 : 0;
    if (carryIn) parts.push(1);
    return { parts, total: parts.reduce((x, y) => x + y, 0), carryIn };
  };
  const walk = (lang) => {
    const bits = [];
    for (let col = 4; col >= 0; col--) {
      if (col === 0 && !add.da[0] && !add.db[0] && !colSum(0).carryIn) continue;
      const cs = colSum(col);
      const name = PLACE.pl[col][lang];
      const note =
        cs.total >= 10
          ? lang === "es"
            ? `: escribo ${cs.total - 10}, llevo 1`
            : `: write ${cs.total - 10}, carry 1`
          : "";
      bits.push(
        `${name[0].toUpperCase()}${name.slice(1)} ${cs.parts.join(" + ")} = ${cs.total}${note}`,
      );
    }
    return bits.join(". ");
  };
  const subWalk = (lang) =>
    sub.steps
      .filter((s) => s.col > 0 || s.take || s.have)
      .map((s) => {
        const name = PLACE.pl[s.col][lang];
        const t0 = s.trade ? (lang === "es" ? "cambio 1, " : "trade 1, ") : "";
        return `${name[0].toUpperCase()}${name.slice(1)}: ${t0}${s.have} − ${s.take} = ${s.left}`;
      })
      .join(". ");
  const errCue = (opt) => {
    if (opt.kind === "align")
      return {
        en: `${fix2(opt.value)} comes from lining up the LAST digits, not the points. The 8 of ${T.b} landed under a hundredths digit. Which place is it really in?`,
        es: `${fix2(opt.value)} sale de alinear los ÚLTIMOS dígitos, no los puntos. El 8 de ${T.b} cayó debajo de las centésimas. ¿En qué lugar está en realidad?`,
      };
    if (opt.kind === "carry")
      return {
        en: `${fix2(opt.value)} wrote down only the ones digit of each column and lost the trades. When a column reaches 10 or more, where does the extra ten go?`,
        es: `${fix2(opt.value)} anotó solo la cifra de unidades de cada columna y perdió los cambios. Cuando una columna llega a 10 o más, ¿adónde va esa decena?`,
      };
    return {
      en: `${fix2(opt.value)} has the right digits, but is the answer really that big? Estimate with round numbers first.`,
      es: `${fix2(opt.value)} tiene los dígitos correctos, pero ¿la respuesta es de verdad tan grande? Primero estima con números redondos.`,
    };
  };
  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: { en: "Same place, same column", es: "Mismo lugar, misma columna" },
    ariaLabel: {
      en: `A place-value chart with columns hundreds, tens, ones, a decimal point, tenths and hundredths. ${A} and ${B} are drawn as discs in their own columns, ten of one place trade for one of the next place, and the same columns hold the written sum ${S}.`,
      es: `Una tabla de valor posicional con columnas de centenas, decenas, unidades, un punto decimal, décimas y centésimas. ${A} y ${B} se dibujan como fichas en sus propias columnas, diez de un lugar se cambian por uno del lugar siguiente, y las mismas columnas contienen la suma escrita ${S}.`,
    },
    printSummary: {
      en: `${A} + ${B} = ${A} + ${B2} = ${S}. Line up the decimal points so tenths sit with tenths and hundredths with hundredths; write a zero so ${B} becomes ${B2}. Ten of one place make one of the place to its left. Then ${S} − ${C} = ${R}.`,
      es: `${A} + ${B} = ${A} + ${B2} = ${S}. Alinea los puntos decimales para que las décimas queden con las décimas y las centésimas con las centésimas; escribe un cero para que ${B} sea ${B2}. Diez de un lugar forman uno del lugar a su izquierda. Luego ${S} − ${C} = ${R}.`,
    },
    scene: {
      situate: { en: "The tank", es: "El tanque" },
      predict: { en: "Predict", es: "Predice" },
      regroup: { en: "Trade up", es: "Cambia" },
      connect: { en: "Write it down", es: "Escríbelo" },
      subtract: { en: "Take away", es: "Quita" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    head: PLACE.pl,
    tank: { en: "Tank", es: "Tanque" },
    together: { en: "Together", es: "Juntos" },
    pointLabel: { en: "point", es: "punto" },
    startOver: { en: "Start over", es: "Empezar de nuevo" },
    trade,
    situateSay: {
      en: `${v.story ? `${v.story.en} ` : ""}The tank holds ${A} ${unit.en}. Each disc is one of its column's place: a hundred, a ten, a one, a tenth or a hundredth. The point divides the ones from the tenths. Next, ${B} ${unit.en} arrive.`,
      es: `${v.story ? `${v.story.es} ` : ""}El tanque tiene ${A} ${unit.es}. Cada ficha vale uno de su columna: una centena, una decena, una unidad, una décima o una centésima. El punto separa las unidades de las décimas. Ahora llegan ${B} ${unit.es}.`,
    },
    situateExpr: `${A} + ${B}`,
    predictSay: {
      en: `The shuttle adds ${B} ${unit.en}. Before the discs move, decide where the digits of ${B} belong.`,
      es: `El transbordador agrega ${B} ${unit.es}. Antes de mover las fichas, decide dónde van los dígitos de ${B}.`,
    },
    predictQ: {
      en: `In ${A} + ${B}, the last digit of ${B} belongs in the ___ column.`,
      es: `En ${A} + ${B}, el último dígito de ${B} va en la columna de ___.`,
    },
    predictCue(col) {
      if (col === ONES)
        return {
          en: `The ones digit sits just left of the decimal point. In ${B}, is the last digit left or right of the point?`,
          es: `La cifra de las unidades está justo a la izquierda del punto decimal. En ${B}, ¿el último dígito está a la izquierda o a la derecha del punto?`,
        };
      return {
        en: `Lining up the last digits would put it under the last digit of ${A}. Numbers line up by their points. Count the digits after the point in ${B}: which digit of ${A} is the first one after its point?`,
        es: `Alinear los últimos dígitos lo pondría debajo del último dígito de ${A}. Los números se alinean por sus puntos. Cuenta los dígitos después del punto en ${B}: ¿cuál dígito de ${A} es el primero después de su punto?`,
      };
    },
    predictOk: {
      en: `Yes: ${PLACE.pl[bCol].en} sit right after the point, under the same place in ${A}. Same place, same column. ${B} has nothing in the hundredths column, so write a zero there: ${B} = ${B2}.`,
      es: `Sí: las ${PLACE.pl[bCol].es} van justo después del punto, debajo del mismo lugar en ${A}. Mismo lugar, misma columna. ${B} no tiene nada en las centésimas, así que escribe un cero ahí: ${B} = ${B2}.`,
    },
    regroupSay: {
      en: `Slide the added discs onto the tank's. Any column with 10 or more discs can trade: 10 of one place make 1 of the place to its left. Trade until no column has 10.`,
      es: `Desliza las fichas agregadas sobre las del tanque. Una columna con 10 o más fichas puede cambiar: 10 de un lugar forman 1 del lugar a su izquierda. Cambia hasta que ninguna columna tenga 10.`,
    },
    regroupHow: {
      en: "Trade 10 for 1 in a column that has 10 or more:",
      es: "Cambia 10 por 1 en una columna que tenga 10 o más:",
    },
    traded: (col) => ({
      en: `${trade(col).en}. The new disc moves left${col === ONES + 1 ? ", across the point" : ""}. The total is the same, written with fewer discs.`,
      es: `${trade(col).es}. La ficha nueva se mueve a la izquierda${col === ONES + 1 ? ", cruzando el punto" : ""}. El total es el mismo, escrito con menos fichas.`,
    }),
    regroupDone: {
      en: `No column has 10 left: ${A} + ${B2} = ${S}. The point never moved; only ten-for-one trades crossed the columns.`,
      es: `Ninguna columna tiene 10: ${A} + ${B2} = ${S}. El punto no se movió; solo cruzaron cambios de diez por uno entre columnas.`,
    },
    connectSay: {
      en: `The same columns, now as digits. ${walk("en")}. So ${A} + ${B2} = ${S} ${unit.en}. Estimate: about ${est.ea} + ${est.eb} = ${est.ea + est.eb}, which is close, so ${S} is reasonable.`,
      es: `Las mismas columnas, ahora con dígitos. ${walk("es")}. Entonces ${A} + ${B2} = ${S} ${unit.es}. Estima: más o menos ${est.ea} + ${est.eb} = ${est.ea + est.eb}, que está cerca, así que ${S} es razonable.`,
    },
    subtractSay: {
      en: `The thrusters use ${C} ${unit.en}: take ${C} away from ${S}. Start at the right, with the hundredths. Solid discs are left; dashed circles are the ones taken away.`,
      es: `Los propulsores usan ${C} ${unit.es}: quita ${C} de ${S}. Empieza por la derecha, con las centésimas. Las fichas llenas son las que quedan; los círculos punteados son las que se quitaron.`,
    },
    subtractQ(col, have, take) {
      return {
        en: `Take away ${take} ${PLACE.pl[col].en}: the ${PLACE.pl[col].en} column has only ${have - 10} ${have - 10 === 1 ? PLACE.sg[col].en : PLACE.pl[col].en}. What can you do?`,
        es: `Quita ${take} ${PLACE.pl[col].es}: la columna de ${PLACE.pl[col].es} solo tiene ${have - 10}. ¿Qué puedes hacer?`,
      };
    },
    subtractOptions(col) {
      const t = trade(col + 1);
      return {
        right: {
          en: `Trade 1 ${PLACE.sg[col - 1].en} for 10 ${PLACE.pl[col].en}`,
          es: `Cambiar 1 ${PLACE.sg[col - 1].es} por 10 ${PLACE.pl[col].es}`,
        },
        flip: {
          en: "Take the smaller from the bigger instead",
          es: "Quitar el menor del mayor",
        },
        skip: { en: "Leave that column alone", es: "Dejar esa columna sin tocar" },
        tradeLabel: { en: `${t.en}`, es: `${t.es}` },
      };
    },
    subtractCue: {
      flip: {
        en: "We start with the discs in the column and take the other number away from them. Can you take more discs than are there? Count them.",
        es: "Empezamos con las fichas de la columna y le quitamos el otro número. ¿Puedes quitar más fichas de las que hay? Cuéntalas.",
      },
      skip: {
        en: "If that column is skipped, has the whole amount been taken away? Check the written number you are subtracting.",
        es: "Si se salta esa columna, ¿se quitó la cantidad completa? Revisa el número escrito que estás restando.",
      },
    },
    subtractOk: {
      en: `Yes: a ten gives up one, which becomes 10 ones. Then every column can finish: ${subWalk("en")}. So ${S} − ${C} = ${R}. Estimate: about ${est.ea} + ${est.eb} − ${est.ec} = ${est.total}, close to ${R}.`,
      es: `Sí: una decena da una, que se vuelve 10 unidades. Entonces cada columna puede terminar: ${subWalk("es")}. Entonces ${S} − ${C} = ${R}. Estima: más o menos ${est.ea} + ${est.eb} − ${est.ec} = ${est.total}, cerca de ${R}.`,
    },
    subtractDone: {
      en: `${S} − ${C} = ${R}. The zero in the hundredths stays: it keeps every digit in its place.`,
      es: `${S} − ${C} = ${R}. El cero de las centésimas se queda: mantiene cada dígito en su lugar.`,
    },
    transferSay: {
      en: `Same idea, new numbers: add ${T.a} and ${T.b}.`,
      es: `La misma idea, números nuevos: suma ${T.a} y ${T.b}.`,
    },
    transferExpr: `${T.a} + ${T.b}`,
    transferQ: { en: `What is ${T.a} + ${T.b}?`, es: `¿Cuánto es ${T.a} + ${T.b}?` },
    transferCue: errCue,
    transferOk: {
      en: `Right: write ${T.b} as ${T.b2}, line up the points, and trade where a column reaches 10. ${T.a} + ${T.b2} = ${T.s}.`,
      es: `Correcto: escribe ${T.b} como ${T.b2}, alinea los puntos y cambia donde una columna llegue a 10. ${T.a} + ${T.b2} = ${T.s}.`,
    },
    explainLabel: {
      en: "Explain: why do the decimal points have to line up before you add?",
      es: "Explica: ¿por qué los puntos decimales tienen que estar alineados antes de sumar?",
    },
    explainFrame: {
      en: "I line up the points so ___ sit with ___, and when a column reaches 10 I ___.",
      es: "Alineo los puntos para que ___ queden con ___, y cuando una columna llega a 10 ___.",
    },
  };
}

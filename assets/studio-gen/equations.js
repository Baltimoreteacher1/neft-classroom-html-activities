/**
 * Practice Studio generators for Units 8 and 9: equations, inequalities and two-variable relationships.
 *
 *   8-1 solutionCheck      is a value a solution? substitute and compare
 *   8-2 solveAddSub        x + p = q and x − p = q
 *   8-3 solveMulDiv        px = q and x ÷ p = q
 *   8-4 writeInequality    "at least", "no more than", "fewer than" -> a symbol and a graph description
 *   8-5 ineqSolutionCheck  is a value a solution of an inequality? boundary values, counting solutions
 *   8-6 solveInequality    x + p > q, px ≤ q and the graph of the solution set
 *   8-7 writeEquationWord  model and solve a story with an equation or an inequality
 *   9-1 9-3 twoVarTable    tables, rules y = kx and y = x + k, independent and dependent variables
 *   9-2 graphRelationship  first-quadrant graphs of a relationship
 *   9-4 twoVarProblem      solve problems with a relationship given as a table, equation or graph
 *
 * Every generator follows docs/specs/practice-studio-v2.md section 4: make() computes the key by the route a student
 * takes (inverse operations, a rule), check() recomputes it by a different route (substitute and compare, a brute-force
 * sweep over sample values) and also proves that every wrong choice really fails.
 *
 * Figures are emitted as `viz` spec objects (section 3) and drawn elsewhere. Beyond the spec, `coord` figures carry the
 * optional fields xlabel, ylabel, xstep and ystep so the renderer can name and tick the axes.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  if (!G || !G.register) throw new Error("studio-gen/equations.js needs core.js loaded first");
  const fmt = G.fmt;

  /* ====================================================================================================
   * Shared helpers
   * ================================================================================================== */
  // clean() rounds float noise away at 1e-9; near() tolerates the rounding of fractions such as 2/3
  const near = (a, b) => Math.abs(a - b) < 1e-7;
  const clean = (n) => Math.round(n * 1e9) / 1e9;
  const norm = (s) => String(s).trim().toLowerCase();
  const NAMES = [
    "Lena",
    "Marcus",
    "Priya",
    "Diego",
    "Aisha",
    "Tomás",
    "Mei",
    "Jamal",
    "Sofía",
    "Noah",
    "Zara",
    "Kenji",
  ];
  const VARS = ["x", "n", "m", "b", "c", "d", "k", "t", "w"];
  /** weighted choice over [[value, weight], ...] */
  const wpick = (rng, pairs) => {
    let r = rng.next() * pairs.reduce((s, [, w]) => s + w, 0);
    for (const [v, w] of pairs) if ((r -= w) < 0) return v;
    return pairs[pairs.length - 1][0];
  };
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const dec1 = (rng, lo, hi) => clean(rng.int(Math.round(lo * 10), Math.round(hi * 10)) / 10);

  /**
   * G.mc plus the per-choice fields the spec lists but the core builder drops:
   *   tag[i]  the named misconception behind choice i (null at the key)
   *   cEs[i]  Spanish text for choice i, when any choice carries words
   * Wrong entries are {v, f, fEs, tag?, vEs?}; the key is {v, vEs?}.
   */
  const mcx = (rng, o) => {
    const right = typeof o.right === "object" ? o.right : { v: o.right };
    const item = G.mc(rng, { ...o, right });
    const byText = new Map();
    for (const w of [right, ...(o.wrong || [])])
      if (!byText.has(norm(w.v))) byText.set(norm(w.v), w);
    const of = (c) => byText.get(norm(c));
    item.tag = item.c.map((c, i) => (i === item.a ? null : of(c).tag || null));
    // d: a structured description of each choice, so check() can judge the choice without parsing prose
    if ([right, ...(o.wrong || [])].some((w) => w.d !== undefined))
      item.meta = { ...item.meta, opts: item.c.map((c) => of(c).d) };
    if (item.c.some((c) => of(c).vEs)) item.cEs = item.c.map((c) => of(c).vEs || c);
    if (item.c.length !== 4) throw new Error(`mcx: ${item.c.length} choices for "${o.q}"`);
    return item;
  };
  /** a wrong choice: v text, [en, es] feedback, misconception tag, optional Spanish choice text */
  const wr = (v, f, tag, vEs) => ({
    v,
    f: f[0],
    fEs: f[1],
    tag,
    vEs,
  });
  /** an item's text fields from [en, es] pairs */
  const text = (t) => {
    const o = /** @type {any} */ ({
      x: t.x[0],
      xEs: t.x[1],
      h: t.h.map((p) => p[0]),
      hEs: t.h.map((p) => p[1]),
    });
    // q is passed separately by most builders; an empty pair means "leave q alone"
    if (t.q?.[0]) {
      o.q = t.q[0];
      o.qEs = t.q[1];
    }
    return o;
  };

  /* ====================================================================================================
   * One-step equations  e = {f, v, p, q, s, pd, qd, sd, step, flip, d?}
   *   f add: v + p = q   sub: v − p = q   mul: pv = q   div: v ÷ p = q          s = the solution
   *   pd qd sd = printed forms (fractions reduced)   d = common denominator when the equation uses fractions
   * ================================================================================================== */
  const FORMS = ["add", "sub", "mul", "div"];
  const OP = /** @type {any} */ ({ add: "+", sub: "−", mul: "×", div: "÷" });
  /** the variable side evaluated at v (substitution) */
  const lhs = (f, p, v) =>
    f === "add" ? v + p : f === "sub" ? v - p : f === "mul" ? p * v : v / p;
  /** the solution by the inverse operation (the route a student takes) */
  const inv = (f, p, q) =>
    f === "add" ? q - p : f === "sub" ? q + p : f === "mul" ? q / p : q * p;
  const show = (e, n) => (e.d ? G.frac(Math.round(n * e.d), e.d) : fmt(n));
  const sideStr = (e) => {
    if (e.f === "add") return `${e.v} + ${e.pd}`;
    if (e.f === "sub") return `${e.v} − ${e.pd}`;
    if (e.f === "mul") return `${e.pd.includes("/") ? `(${e.pd})` : e.pd}${e.v}`;
    return `${e.v} ÷ ${e.pd}`;
  };
  const eqStr = (e) => (e.flip ? `${e.qd} = ${sideStr(e)}` : `${sideStr(e)} = ${e.qd}`);
  /** [a, op, b] of the substitution of `val` into the variable side */
  const subParts = (e, val) =>
    e.f === "mul" ? [e.pd, "×", show(e, val)] : [show(e, val), OP[e.f], e.pd];
  const subText = (e, val) => subParts(e, val).join(" ");

  const makeEq = (f, v, p, s, x = {}) => {
    const P = clean(p);
    const S = clean(s);
    const q = clean(lhs(f, P, S));
    const step = x.step ?? 1;
    // vs: the smallest change of the variable that keeps the working tidy (a division moves in steps of p)
    const vs = clean(f === "div" ? P * step : step);
    return { f, v, p: P, q, s: S, pd: fmt(P), qd: fmt(q), sd: fmt(S), flip: false, ...x, step, vs };
  };
  /** the equation f(p) = q, solved by the inverse operation (s need not be a whole number) */
  const eqFromPQ = (f, v, p, q) => {
    const s = clean(inv(f, p, q));
    return {
      f,
      v,
      p,
      q,
      s,
      pd: fmt(p),
      qd: fmt(q),
      sd: fmt(s),
      step: 1,
      vs: f === "div" ? p : 1,
      flip: false,
    };
  };

  const intEq = (rng, f, v, level) => {
    const big = level >= 2;
    let p;
    let s;
    if (f === "add") {
      p = big ? rng.int(8, 48) : rng.int(2, 12);
      do s = big ? rng.int(10, 90) : rng.int(2, 15);
      while (s === p);
    } else if (f === "sub") {
      p = big ? rng.int(8, 48) : rng.int(2, 12);
      let q;
      do q = big ? rng.int(10, 80) : rng.int(2, 15);
      while (q === p);
      s = q + p;
    } else if (f === "mul") {
      p = big ? rng.int(3, 12) : rng.int(2, 9);
      do s = big ? rng.int(4, 15) : rng.int(2, 9);
      while (s === p);
    } else {
      p = big ? rng.int(3, 12) : rng.int(2, 9);
      let q;
      do q = big ? rng.int(4, 15) : rng.int(2, 9);
      while (q === p);
      s = p * q;
    }
    return makeEq(f, v, p, s);
  };
  const DEC_COEF = [0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 1.2, 1.5, 2.5, 3.5, 4.5];
  /** a decimal equation: tenths for + and −, a decimal coefficient or a decimal result for × and ÷ */
  const decEq = (rng, f, v) => {
    for (let tries = 0; tries < 20; tries++) {
      let p;
      let s;
      if (f === "add") {
        p = dec1(rng, 0.2, 9.9);
        s = dec1(rng, 0.2, 9.9);
      } else if (f === "sub") {
        p = dec1(rng, 0.2, 9.9);
        s = clean(dec1(rng, 0.2, 9.9) + p);
      } else if (f === "mul") {
        if (rng.chance(0.6)) {
          p = rng.pick(DEC_COEF);
          s = rng.int(2, 16);
        } else {
          p = rng.int(2, 9);
          s = dec1(rng, 1.1, 9.9);
        }
      } else {
        p = rng.int(2, 9);
        s = clean(p * dec1(rng, 1.1, 9.9));
      }
      const e = makeEq(f, v, p, s);
      if (e.s !== e.p && e.s !== e.q && [e.p, e.q, e.s].some((n) => !Number.isInteger(n))) return e;
    }
    return intEq(rng, f, v, 2);
  };
  const FRAC_DEN = [2, 3, 4, 5, 6, 8, 10];
  /** x + a/d = b/d  or  x − a/d = b/d  (fractions printed in lowest terms) */
  const fracEq = (rng, f, v) => {
    for (let tries = 0; tries < 30; tries++) {
      const d = rng.pick(FRAC_DEN);
      const a = rng.int(1, d - 1);
      const b = f === "add" ? rng.int(a + 1, d) : rng.int(1, d - a);
      const sn = f === "add" ? b - a : a + b;
      const e = makeEq(f, v, a / d, sn / d, {
        d,
        pd: G.frac(a, d),
        qd: G.frac(b, d),
        sd: G.frac(sn, d),
        step: 1 / d,
      });
      if (e.pd !== e.qd && e.sd !== e.pd && e.sd !== e.qd) return e;
    }
    return decEq(rng, f, v);
  };
  /**
   * The equation `f` whose solution is the whole number s (null if no tidy one exists).
   * add: q = s + p   sub: needs s > p   mul: q = ps   div: p must divide s.
   */
  const range = (lo, hi) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
  const eqWithSolution = (rng, f, v, s) => {
    let ps;
    if (f === "add") ps = range(2, 15);
    else if (f === "sub") ps = range(2, Math.min(15, s - 1));
    else if (f === "mul") ps = range(2, 9);
    else ps = [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((d) => s % d === 0);
    // keep the answer out of the equation: s is neither p nor q, and p is not q
    ps = ps.filter((p) => {
      const q = lhs(f, p, s);
      return p !== s && q !== s && p !== q && q > 0;
    });
    return ps.length ? makeEq(f, v, rng.pick(ps), s) : null;
  };
  /** value of a printed variable side ("x + 12", "n − 5", "6n", "(3/4)n", "x ÷ 4") at val: a text route that never calls lhs() */
  const evalSide = (str, v, val) => {
    const m = new RegExp(`^${v} ([+−÷]) (\\S+)$`).exec(str);
    if (m) {
      const p = G.value(m[2]);
      return m[1] === "+" ? val + p : m[1] === "−" ? val - p : val / p;
    }
    const k = new RegExp(`^\\(?(\\S+?)\\)?${v}$`).exec(str);
    return k ? G.value(k[1]) * val : Number.NaN;
  };

  /* ---- one-step stories shared by solutionCheck, solveAddSub, solveMulDiv and writeEquationWord ----
   * {N} the name, {p} {q} the numbers as printed. m: roles printed as dollars. d: roles that may be decimals
   * from level 3 ("" = whole numbers always).  Roles: p = the number in the equation, s = the answer, q = the total.
   */
  const STORY = /** @type {any} */ ({
    add: [
      {
        v: "m",
        en: "{N} had some marbles. After finding {p} more, {N} has {q} marbles.",
        es: "{N} tenía cierta cantidad de canicas. Después de encontrar {p} más, {N} tiene {q} canicas.",
        ask: "How many marbles did {N} have at first?",
        askEs: "¿Cuántas canicas tenía {N} al principio?",
        what: "the number of marbles at the start",
        whatEs: "el número de canicas al principio",
        m: "",
        d: "",
      },
      {
        v: "s",
        en: "{N} had some stickers. A friend gave {N} {p} more, and now {N} has {q} stickers.",
        es: "{N} tenía cierta cantidad de calcomanías. Un amigo le dio {p} más y ahora {N} tiene {q} calcomanías.",
        ask: "How many stickers did {N} have before?",
        askEs: "¿Cuántas calcomanías tenía {N} antes?",
        what: "the number of stickers before",
        whatEs: "el número de calcomanías de antes",
        m: "",
        d: "",
      },
      {
        v: "d",
        en: "{N} saved some money. After earning {p} more, {N} has {q} in all.",
        es: "{N} ahorró algo de dinero. Después de ganar {p} más, tiene {q} en total.",
        ask: "How much money had {N} saved at first?",
        askEs: "¿Cuánto dinero había ahorrado {N} al principio?",
        what: "the amount saved at first",
        whatEs: "la cantidad ahorrada al principio",
        m: "pqs",
        d: "pqs",
      },
      {
        v: "b",
        en: "A shelf held some books. After the librarian added {p} new books, the shelf held {q} books.",
        es: "Un estante tenía cierta cantidad de libros. Después de que la bibliotecaria añadió {p} libros nuevos, el estante tenía {q} libros.",
        ask: "How many books were on the shelf at first?",
        askEs: "¿Cuántos libros había en el estante al principio?",
        what: "the number of books at first",
        whatEs: "el número de libros al principio",
        m: "",
        d: "",
      },
      {
        v: "t",
        en: "Some students were on a bus. At the next stop, {p} more students got on. Now {q} students are on the bus.",
        es: "Había cierta cantidad de estudiantes en un autobús. En la siguiente parada subieron {p} estudiantes más. Ahora hay {q} estudiantes en el autobús.",
        ask: "How many students were on the bus before that stop?",
        askEs: "¿Cuántos estudiantes había en el autobús antes de esa parada?",
        what: "the number of students before the stop",
        whatEs: "el número de estudiantes antes de la parada",
        m: "",
        d: "",
      },
      {
        v: "g",
        en: "{N} scored some points in the first half of a game and {p} more in the second half. {N} finished with {q} points.",
        es: "{N} anotó cierta cantidad de puntos en la primera mitad de un juego y {p} más en la segunda mitad. {N} terminó con {q} puntos.",
        ask: "How many points did {N} score in the first half?",
        askEs: "¿Cuántos puntos anotó {N} en la primera mitad?",
        what: "the points scored in the first half",
        whatEs: "los puntos anotados en la primera mitad",
        m: "",
        d: "",
      },
      {
        v: "w",
        en: "A backpack weighed some kilograms. After {N} added a lunch box of {p} kg, the backpack weighed {q} kg.",
        es: "Una mochila pesaba cierta cantidad de kilogramos. Después de que {N} añadió una lonchera de {p} kg, la mochila pesó {q} kg.",
        ask: "How many kilograms did the backpack weigh before the lunch box?",
        askEs: "¿Cuántos kilogramos pesaba la mochila antes de la lonchera?",
        what: "the weight of the backpack in kg",
        whatEs: "el peso de la mochila en kg",
        m: "",
        d: "pqs",
      },
      {
        v: "h",
        en: "A plant was some centimeters tall. It grew {p} cm and is now {q} cm tall.",
        es: "Una planta medía cierta cantidad de centímetros. Creció {p} cm y ahora mide {q} cm.",
        ask: "How tall was the plant before it grew?",
        askEs: "¿Cuánto medía la planta antes de crecer?",
        what: "the starting height in cm",
        whatEs: "la altura inicial en cm",
        m: "",
        d: "pqs",
      },
    ],
    sub: [
      {
        v: "c",
        en: "A plate had some cookies. After {N} ate {p} of them, {q} cookies were left.",
        es: "Un plato tenía cierta cantidad de galletas. Después de que {N} se comió {p}, quedaron {q} galletas.",
        ask: "How many cookies were on the plate at first?",
        askEs: "¿Cuántas galletas había en el plato al principio?",
        what: "the number of cookies at first",
        whatEs: "el número de galletas al principio",
        m: "",
        d: "",
      },
      {
        v: "s",
        en: "{N} had some stickers and gave away {p}. Now {N} has {q} stickers.",
        es: "{N} tenía cierta cantidad de calcomanías y regaló {p}. Ahora {N} tiene {q} calcomanías.",
        ask: "How many stickers did {N} have at first?",
        askEs: "¿Cuántas calcomanías tenía {N} al principio?",
        what: "the number of stickers at first",
        whatEs: "el número de calcomanías al principio",
        m: "",
        d: "",
      },
      {
        v: "d",
        en: "{N} had some money. After spending {p} on lunch, {N} has {q} left.",
        es: "{N} tenía algo de dinero. Después de gastar {p} en el almuerzo, a {N} le quedan {q}.",
        ask: "How much money did {N} have at first?",
        askEs: "¿Cuánto dinero tenía {N} al principio?",
        what: "the amount of money at first",
        whatEs: "la cantidad de dinero al principio",
        m: "pqs",
        d: "pqs",
      },
      {
        v: "w",
        en: "A tank held some liters of water. After {p} liters were used, {q} liters were left.",
        es: "Un tanque tenía cierta cantidad de litros de agua. Después de usar {p} litros, quedaron {q} litros.",
        ask: "How many liters were in the tank at first?",
        askEs: "¿Cuántos litros había en el tanque al principio?",
        what: "the liters in the tank at first",
        whatEs: "los litros que había en el tanque al principio",
        m: "",
        d: "pqs",
      },
      {
        v: "t",
        en: "Some students were on a bus. At the school stop, {p} students got off. {q} students stayed on the bus.",
        es: "Había cierta cantidad de estudiantes en un autobús. En la parada de la escuela bajaron {p} estudiantes. Se quedaron {q} estudiantes en el autobús.",
        ask: "How many students were on the bus before the school stop?",
        askEs: "¿Cuántos estudiantes había en el autobús antes de la parada de la escuela?",
        what: "the number of students before the stop",
        whatEs: "el número de estudiantes antes de la parada",
        m: "",
        d: "",
      },
      {
        v: "r",
        en: "A ribbon was some centimeters long. After {N} cut off {p} cm, the ribbon was {q} cm long.",
        es: "Una cinta medía cierta cantidad de centímetros. Después de que {N} cortó {p} cm, la cinta medía {q} cm.",
        ask: "How long was the ribbon before it was cut?",
        askEs: "¿Cuánto medía la cinta antes de cortarla?",
        what: "the length of the ribbon in cm",
        whatEs: "la longitud de la cinta en cm",
        m: "",
        d: "pqs",
      },
      {
        v: "g",
        en: "{N} had some game cards. After trading away {p} cards, {N} has {q} cards.",
        es: "{N} tenía cierta cantidad de cartas de juego. Después de intercambiar {p} cartas, a {N} le quedan {q} cartas.",
        ask: "How many cards did {N} have before trading?",
        askEs: "¿Cuántas cartas tenía {N} antes de intercambiar?",
        what: "the number of cards before trading",
        whatEs: "el número de cartas antes de intercambiar",
        m: "",
        d: "",
      },
    ],
    mul: [
      {
        v: "n",
        en: "{N} bought {p} identical packs of markers for {q} in all.",
        es: "{N} compró {p} paquetes de marcadores iguales por {q} en total.",
        ask: "How much does one pack cost?",
        askEs: "¿Cuánto cuesta un paquete?",
        what: "the cost of one pack",
        whatEs: "el costo de un paquete",
        m: "sq",
        d: "s",
      },
      {
        v: "b",
        en: "{N} packs pencils into boxes. Each box holds {p} pencils, and {N} packs {q} pencils in all.",
        es: "{N} empaca lápices en cajas. Cada caja contiene {p} lápices, y {N} empaca {q} lápices en total.",
        ask: "How many boxes does {N} fill?",
        askEs: "¿Cuántas cajas llena {N}?",
        what: "the number of boxes",
        whatEs: "el número de cajas",
        m: "",
        d: "",
      },
      {
        v: "h",
        en: "{N} earns {p} for each hour of work. This week {N} earned {q}.",
        es: "{N} gana {p} por cada hora de trabajo. Esta semana {N} ganó {q}.",
        ask: "How many hours did {N} work?",
        askEs: "¿Cuántas horas trabajó {N}?",
        what: "the number of hours worked",
        whatEs: "el número de horas trabajadas",
        m: "pq",
        d: "p",
      },
      {
        v: "d",
        en: "{N} reads {p} pages every day. So far {N} has read {q} pages.",
        es: "{N} lee {p} páginas cada día. Hasta ahora {N} ha leído {q} páginas.",
        ask: "For how many days has {N} been reading?",
        askEs: "¿Durante cuántos días ha leído {N}?",
        what: "the number of days",
        whatEs: "el número de días",
        m: "",
        d: "",
      },
      {
        v: "r",
        en: "A hall has {p} chairs in each row and {q} chairs in all.",
        es: "Un salón tiene {p} sillas en cada fila y {q} sillas en total.",
        ask: "How many rows of chairs are there?",
        askEs: "¿Cuántas filas de sillas hay?",
        what: "the number of rows",
        whatEs: "el número de filas",
        m: "",
        d: "",
      },
      {
        v: "w",
        en: "{p} equal bags of rice weigh {q} kg in all.",
        es: "{p} bolsas iguales de arroz pesan {q} kg en total.",
        ask: "How many kilograms does one bag weigh?",
        askEs: "¿Cuántos kilogramos pesa una bolsa?",
        what: "the weight of one bag in kg",
        whatEs: "el peso de una bolsa en kg",
        m: "",
        d: "s",
      },
      {
        v: "t",
        en: "A train travels {p} miles every hour. It traveled {q} miles.",
        es: "Un tren recorre {p} millas cada hora. Recorrió {q} millas.",
        ask: "How many hours did the train travel?",
        askEs: "¿Cuántas horas viajó el tren?",
        what: "the number of hours",
        whatEs: "el número de horas",
        m: "",
        d: "",
      },
    ],
    div: [
      {
        v: "s",
        en: "{N} shared some stickers equally among {p} friends. Each friend got {q} stickers.",
        es: "{N} repartió cierta cantidad de calcomanías por igual entre {p} amigos. Cada amigo recibió {q} calcomanías.",
        ask: "How many stickers did {N} share?",
        askEs: "¿Cuántas calcomanías repartió {N}?",
        what: "the number of stickers shared",
        whatEs: "el número de calcomanías repartidas",
        m: "",
        d: "",
      },
      {
        v: "r",
        en: "A ribbon was cut into {p} equal pieces. Each piece is {q} cm long.",
        es: "Una cinta se cortó en {p} partes iguales. Cada parte mide {q} cm.",
        ask: "How long was the whole ribbon in cm?",
        askEs: "¿Cuánto medía toda la cinta en cm?",
        what: "the length of the whole ribbon in cm",
        whatEs: "la longitud de toda la cinta en cm",
        m: "",
        d: "q",
      },
      {
        v: "m",
        en: "{p} friends split the cost of a pizza equally. Each friend paid {q}.",
        es: "{p} amigos dividieron el costo de una pizza en partes iguales. Cada amigo pagó {q}.",
        ask: "How much did the pizza cost?",
        askEs: "¿Cuánto costó la pizza?",
        what: "the cost of the pizza",
        whatEs: "el costo de la pizza",
        m: "qs",
        d: "q",
      },
      {
        v: "p",
        en: "{N} put some apples equally into {p} baskets. Each basket holds {q} apples.",
        es: "{N} puso cierta cantidad de manzanas por igual en {p} canastas. Cada canasta contiene {q} manzanas.",
        ask: "How many apples did {N} have?",
        askEs: "¿Cuántas manzanas tenía {N}?",
        what: "the number of apples",
        whatEs: "el número de manzanas",
        m: "",
        d: "",
      },
      {
        v: "n",
        en: "A class lined up in {p} equal rows. Each row has {q} students.",
        es: "Una clase se formó en {p} filas iguales. Cada fila tiene {q} estudiantes.",
        ask: "How many students are in the class?",
        askEs: "¿Cuántos estudiantes hay en la clase?",
        what: "the number of students",
        whatEs: "el número de estudiantes",
        m: "",
        d: "",
      },
      {
        v: "k",
        en: "Some cookies were packed equally into {p} boxes. Each box has {q} cookies.",
        es: "Se empacó cierta cantidad de galletas por igual en {p} cajas. Cada caja tiene {q} galletas.",
        ask: "How many cookies were packed?",
        askEs: "¿Cuántas galletas se empacaron?",
        what: "the number of cookies",
        whatEs: "el número de galletas",
        m: "",
        d: "",
      },
      {
        v: "f",
        en: "A bag of flour was poured equally into {p} jars. Each jar holds {q} kg.",
        es: "Una bolsa de harina se vertió por igual en {p} frascos. Cada frasco contiene {q} kg.",
        ask: "How many kilograms were in the bag?",
        askEs: "¿Cuántos kilogramos había en la bolsa?",
        what: "the kilograms of flour",
        whatEs: "los kilogramos de harina",
        m: "",
        d: "q",
      },
    ],
  });

  /** a quarter-dollar amount or a tenth-precision measure */
  const amount = (rng, lo, hi, money) =>
    money ? rng.int(lo * 4, hi * 4) / 4 : dec1(rng, lo + 0.1, hi - 0.1);
  /** an equation for story `st` with numbers that fit its roles at this level */
  const storyEq = (rng, level, f, st) => {
    const roles = level >= 3 ? st.d : "";
    const money = (r) => st.m.includes(r);
    for (let tries = 0; tries < 20; tries++) {
      const big = level >= 2;
      let p;
      let s;
      if (f === "add") {
        p = roles ? amount(rng, 1, 9, money("p")) : big ? rng.int(8, 48) : rng.int(2, 12);
        s = roles ? amount(rng, 1, 12, money("s")) : big ? rng.int(10, 90) : rng.int(2, 15);
      } else if (f === "sub") {
        p = roles ? amount(rng, 1, 9, money("p")) : big ? rng.int(8, 48) : rng.int(2, 12);
        const q = roles ? amount(rng, 1, 12, money("q")) : big ? rng.int(10, 80) : rng.int(2, 15);
        s = clean(q + p);
      } else if (f === "mul") {
        p =
          roles === "p"
            ? rng.pick(money("p") ? [1.5, 2.5, 4.5, 6.5, 7.5, 12.5] : DEC_COEF)
            : big
              ? rng.int(3, 12)
              : rng.int(2, 9);
        s = roles === "s" ? amount(rng, 1, 9, money("s")) : big ? rng.int(4, 15) : rng.int(2, 9);
      } else {
        p = big ? rng.int(3, 12) : rng.int(2, 9);
        const q =
          roles === "q" ? amount(rng, 1, 9, money("q")) : big ? rng.int(4, 15) : rng.int(2, 9);
        s = clean(p * q);
      }
      const e = makeEq(f, st.v, p, s);
      const decimal = [e.p, e.q, e.s].some((n) => !Number.isInteger(n));
      const ok = e.s !== e.p && e.s !== e.q && (roles ? decimal : true);
      if (ok) return e;
    }
    return makeEq(f, st.v, 4, 7);
  };
  /** the story's numbers as printed ($ for money roles, two decimals when any amount has cents) */
  const storyNums = (e, st) => {
    const dec = [e.p, e.q, e.s].some((n) => !Number.isInteger(n));
    const one = (r, n) => (st.m.includes(r) ? `$${dec ? n.toFixed(2) : n}` : fmt(n));
    return { p: one("p", e.p), q: one("q", e.q), s: one("s", e.s) };
  };
  const storyText = (st, e, N) => {
    const o = { N, ...storyNums(e, st) };
    return {
      en: fill(st.en, o),
      es: fill(st.es, o),
      ask: fill(st.ask, o),
      askEs: fill(st.askEs, o),
    };
  };

  /** "Subtract 9 from both sides: x = 15 − 9 = 6." as [en, es] */
  const solveLine = (e) => {
    const { v, pd, qd, sd } = e;
    if (e.f === "add")
      return [
        `Subtract ${pd} from both sides: ${v} = ${qd} − ${pd} = ${sd}.`,
        `Resta ${pd} de ambos lados: ${v} = ${qd} − ${pd} = ${sd}.`,
      ];
    if (e.f === "sub")
      return [
        `Add ${pd} to both sides: ${v} = ${qd} + ${pd} = ${sd}.`,
        `Suma ${pd} a ambos lados: ${v} = ${qd} + ${pd} = ${sd}.`,
      ];
    if (e.f === "mul")
      return [
        `Divide both sides by ${pd}: ${v} = ${qd} ÷ ${pd} = ${sd}.`,
        `Divide ambos lados entre ${pd}: ${v} = ${qd} ÷ ${pd} = ${sd}.`,
      ];
    return [
      `Multiply both sides by ${pd}: ${v} = ${qd} × ${pd} = ${sd}.`,
      `Multiplica ambos lados por ${pd}: ${v} = ${qd} × ${pd} = ${sd}.`,
    ];
  };
  const checkLine = (e) => [
    `Check: ${subText(e, e.s)} = ${e.qd}.`,
    `Comprueba: ${subText(e, e.s)} = ${e.qd}.`,
  ];
  /** the first step only, never the result: "Subtract 9 from both sides." */
  const firstStep = (e) => {
    const { pd, v, qd } = e;
    if (e.f === "add")
      return [
        `Subtract ${pd} from both sides: ${v} = ${qd} − ${pd}.`,
        `Resta ${pd} de ambos lados: ${v} = ${qd} − ${pd}.`,
      ];
    if (e.f === "sub")
      return [
        `Add ${pd} to both sides: ${v} = ${qd} + ${pd}.`,
        `Suma ${pd} a ambos lados: ${v} = ${qd} + ${pd}.`,
      ];
    if (e.f === "mul")
      return [
        `Divide both sides by ${pd}: ${v} = ${qd} ÷ ${pd}.`,
        `Divide ambos lados entre ${pd}: ${v} = ${qd} ÷ ${pd}.`,
      ];
    return [
      `Multiply both sides by ${pd}: ${v} = ${qd} × ${pd}.`,
      `Multiplica ambos lados por ${pd}: ${v} = ${qd} × ${pd}.`,
    ];
  };
  /** what the equation does to the variable, as a hint: "x has 9 added to it." */
  const doesTo = (e) => {
    const { v, pd } = e;
    if (e.f === "add") return [`${v} has ${pd} added to it.`, `A ${v} se le suman ${pd}.`];
    if (e.f === "sub") return [`${v} has ${pd} taken away from it.`, `A ${v} se le quitan ${pd}.`];
    if (e.f === "mul") return [`${v} is multiplied by ${pd}.`, `${v} está multiplicada por ${pd}.`];
    return [`${v} is divided by ${pd}.`, `${v} está dividida entre ${pd}.`];
  };
  const undoes = (e) =>
    e.f === "add"
      ? ["Subtraction undoes addition.", "La resta deshace la suma."]
      : e.f === "sub"
        ? ["Addition undoes subtraction.", "La suma deshace la resta."]
        : e.f === "mul"
          ? ["Division undoes multiplication.", "La división deshace la multiplicación."]
          : ["Multiplication undoes division.", "La multiplicación deshace la división."];

  /* The wrong numbers a student lands on by misusing the inverse operation (value, tag, [en, es]) */
  const inverseSlips = (e) => {
    const { f, v, pd, qd, p, q } = e;
    const rows = /** @type {any[]} */ ([]);
    if (f === "add") {
      rows.push([
        q + p,
        "added-instead",
        [
          `You added ${pd} to ${qd}, but the equation already adds ${pd} to ${v}.`,
          `Sumaste ${pd} a ${qd}, pero la ecuación ya suma ${pd} a ${v}.`,
        ],
      ]);
    } else if (f === "sub") {
      rows.push([
        q - p,
        "same-operation",
        [
          `You subtracted ${pd} from ${qd}, but ${pd} was already taken away from ${v}.`,
          `Restaste ${pd} de ${qd}, pero a ${v} ya se le quitó ${pd}.`,
        ],
      ]);
    } else if (f === "mul") {
      rows.push([
        q * p,
        "multiplied-instead",
        [
          `You multiplied ${qd} by ${pd}, but ${v} is already multiplied by ${pd}.`,
          `Multiplicaste ${qd} por ${pd}, pero ${v} ya está multiplicada por ${pd}.`,
        ],
      ]);
      rows.push([
        q - p,
        "subtracted-instead",
        [
          `You subtracted ${pd} from ${qd}. A multiplication is not undone by subtracting.`,
          `Restaste ${pd} de ${qd}. Una multiplicación no se deshace restando.`,
        ],
      ]);
    } else {
      rows.push([
        q / p,
        "divided-instead",
        [
          `You divided ${qd} by ${pd}, but ${v} is already divided by ${pd}.`,
          `Dividiste ${qd} entre ${pd}, pero ${v} ya está dividida entre ${pd}.`,
        ],
      ]);
      rows.push([
        q + p,
        "added-instead",
        [
          `You added ${pd} to ${qd}. A division is not undone by adding.`,
          `Sumaste ${pd} a ${qd}. Una división no se deshace sumando.`,
        ],
      ]);
    }
    rows.push([
      q,
      "copied-total",
      [
        `${qd} is the number on the other side, not the value of ${v}.`,
        `${qd} es el número del otro lado, no el valor de ${v}.`,
      ],
    ]);
    rows.push([
      p,
      "copied-number",
      [
        `${e.pd} is a number already in the equation, not the unknown.`,
        `${e.pd} es un número que ya está en la ecuación, no la incógnita.`,
      ],
    ]);
    return rows.map(([n, tag, fb]) => ({ val: clean(n), tag, fb }));
  };

  /* ====================================================================================================
   * A tiny evaluator for printed equations and inequalities. check() functions use it to judge a choice
   * from its TEXT ("v − 7 = 15", "4n ≥ 20") instead of from the structures make() built it from.
   * ================================================================================================== */
  /** evaluate "3 + 4 × (2 − 1)", "3(5)" or "(3/4)(8)"; × ÷ bind tighter than + −; NaN for anything else */
  const evalExpr = (str) => {
    const clean0 = str.replace(/\s+/g, "");
    const toks = clean0.match(/\d+(?:\.\d+)?(?:\/\d+)?|[+−×÷()]/g) || [];
    if (toks.join("") !== clean0) return Number.NaN;
    let i = 0;
    const factor = () => {
      const t = toks[i++];
      if (t === "(") {
        const v = expr();
        if (toks[i++] !== ")") return Number.NaN;
        return v;
      }
      return t === undefined ? Number.NaN : G.value(t);
    };
    const term = () => {
      let v = factor();
      while (i < toks.length) {
        const t = toks[i];
        if (t === "×") {
          i++;
          v *= factor();
        } else if (t === "÷") {
          i++;
          v /= factor();
        } else if (t === "(") v *= factor();
        else break;
      }
      return v;
    };
    const expr = () => {
      let v = term();
      while (i < toks.length && (toks[i] === "+" || toks[i] === "−")) {
        const o = toks[i++];
        const r = term();
        v = o === "+" ? v + r : v - r;
      }
      return v;
    };
    const out = expr();
    return i === toks.length ? out : Number.NaN;
  };
  /**
   * Is the printed statement ("x + 4 > 12", "3x = 21", "48 ≥ h") true when the letter v is replaced by val?
   * Returns true, false, or null when the text is not a statement this evaluator understands.
   */
  const holds = (str, v, val) => {
    const m = /^(.*?)\s*(=|≤|≥|<|>)\s*(.*)$/.exec(str);
    if (!m) return null;
    const sub = (s) => s.replace(new RegExp(v, "g"), `(${val})`);
    const a = evalExpr(sub(m[1]));
    const b = evalExpr(sub(m[3]));
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    if (m[2] === "=") return near(a, b);
    if (m[2] === "<") return a < b && !near(a, b);
    if (m[2] === ">") return a > b && !near(a, b);
    if (m[2] === "≤") return a < b || near(a, b);
    return a > b || near(a, b);
  };
  /** every x in [lo, hi] (steps of `step`) that makes the printed statement true -- a brute-force sweep */
  const sweep = (str, v, lo, hi, step) => {
    const out = [];
    for (let k = 0; lo + k * step <= hi + 1e-9; k++) {
      const x = clean(lo + k * step);
      if (holds(str, v, x)) out.push(x);
    }
    return out;
  };

  /* ====================================================================================================
   * 8-1  solutionCheck
   * ================================================================================================== */
  const SC_NUM = "\\d+(?:\\.\\d+)?(?:/\\d+)?";
  /** is `text` ("Yes, because 5 + 8 = 13, ...") a correct, substituted proof for equation e at val? */
  const claimCorrect = (t, e, val) => {
    const m = /^(Yes|No), because /.exec(t);
    const x = new RegExp(`(${SC_NUM}) ([+−×÷]) (${SC_NUM}) = (${SC_NUM})`).exec(t);
    if (!m || !x) return false;
    const a = G.value(x[1]);
    const b = G.value(x[3]);
    const r = G.value(x[4]);
    const calc = x[2] === "+" ? a + b : x[2] === "−" ? a - b : x[2] === "×" ? a * b : a / b;
    if (!near(calc, r) || x[2] !== OP[e.f]) return false;
    const same =
      e.f === "mul"
        ? (near(a, e.p) && near(b, val)) || (near(a, val) && near(b, e.p))
        : near(a, val) && near(b, e.p);
    if (!same) return false;
    return (m[1] === "Yes") === near(r, e.q);
  };

  /**
   * The four claims for "is val a solution of e?": one correct proof and three flawed ones.
   * Every claim is "Yes|No, because ..." so check() can parse and judge it; a correct claim shows the real
   * substitution, does the arithmetic right and reaches the right verdict.
   */
  /** how far a careless calculation lands from the truth: a group too many or too few, a ten, a one */
  const slipAmounts = (e) =>
    e.f === "mul"
      ? [e.p, -e.p, 1, -1]
      : e.f === "div"
        ? [1, -1, 2, -2]
        : [1, -1, 2, -2, 10, -10].map((k) => k * (Math.abs(k) === 10 && e.d ? 1 : e.step));
  const claims = (rng, e, val) => {
    const t = clean(lhs(e.f, e.p, val));
    const isSol = near(t, e.q);
    const [a, op, b] = subParts(e, val);
    const ex = `${a} ${op} ${b} = ${show(e, t)}`;
    const vd = show(e, val);
    const qd = e.qd;
    const yes = (en, es) => [`Yes, because ${en}`, `Sí, porque ${es}`];
    const no = (en, es) => [`No, because ${en}`, `No, porque ${es}`];
    const bad = (pair, fb, tag) => wr(pair[0], fb, tag, pair[1]);
    const cmpFb = [
      "Comparing the value with the other side does not test the equation. Substitute the value for the variable and work out that whole side first.",
      "Comparar el valor con el otro lado no comprueba la ecuación. Sustituye el valor por la variable y calcula primero todo ese lado.",
    ];
    const slipFb = [
      `Check the arithmetic: work out ${a} ${op} ${b} again, carefully.`,
      `Revisa la aritmética: vuelve a calcular ${a} ${op} ${b} con cuidado.`,
    ];
    // a slipped result: one or two steps off the true value, never negative, and neither the true value nor the other side
    const slipTo = rng
      .shuffle(slipAmounts(e))
      .map((k) => clean(t + k))
      .find((n) => n > 0 && !near(n, t) && !near(n, e.q) && tidy(e, n));
    const slipped = (n) => show(e, n);
    const wrongs = [];
    let right;
    if (isSol) {
      const r = yes(`${ex}, and the other side is ${qd}.`, `${ex}, y el otro lado es ${qd}.`);
      right = { v: r[0], vEs: r[1] };
      wrongs.push(
        bad(
          no(`${vd} is not equal to ${qd}.`, `${vd} no es igual a ${qd}.`),
          cmpFb,
          "compared-value-to-total",
        ),
        bad(
          no(
            `${a} ${op} ${b} = ${slipped(slipTo)}, which is not ${qd}.`,
            `${a} ${op} ${b} = ${slipped(slipTo)}, que no es ${qd}.`,
          ),
          slipFb,
          "arithmetic-slip",
        ),
      );
      // the wrong operation: + for an equation that multiplies or divides, × for one that adds or subtracts
      const other = e.f === "add" || e.f === "div" ? "×" : "+";
      const [wa, wb] = e.f === "mul" ? [e.pd, vd] : [vd, e.pd];
      const wv = other === "×" ? G.value(wa) * G.value(wb) : G.value(wa) + G.value(wb);
      wrongs.push(
        bad(
          no(
            `${wa} ${other} ${wb} = ${slipped(clean(wv))}, which is not ${qd}.`,
            `${wa} ${other} ${wb} = ${slipped(clean(wv))}, que no es ${qd}.`,
          ),
          [
            `The equation uses ${OP[e.f]}, not ${other}. Substitute into the operation that is written.`,
            `La ecuación usa ${OP[e.f]}, no ${other}. Sustituye en la operación que está escrita.`,
          ],
          "wrong-operation",
        ),
      );
    } else {
      const r = no(`${ex}, but the other side is ${qd}.`, `${ex}, pero el otro lado es ${qd}.`);
      right = { v: r[0], vEs: r[1] };
      if (Math.abs(t - e.q) <= Math.max(2 * e.step, 0.12 * e.q))
        wrongs.push(
          bad(
            yes(`${ex}, which is close to ${qd}.`, `${ex}, que está cerca de ${qd}.`),
            [
              "An equation is true only when both sides are exactly equal. Close is not enough.",
              "Una ecuación es verdadera solo cuando ambos lados son exactamente iguales. Estar cerca no basta.",
            ],
            "close-enough",
          ),
        );
      wrongs.push(
        near(val, e.q)
          ? bad(
              yes(`${vd} is equal to ${qd}.`, `${vd} es igual a ${qd}.`),
              cmpFb,
              "compared-value-to-total",
            )
          : bad(
              yes(
                `${vd} is ${val < e.q ? "less" : "greater"} than ${qd}.`,
                `${vd} es ${val < e.q ? "menor" : "mayor"} que ${qd}.`,
              ),
              [
                "Being less or greater than a number does not make a value a solution. Substitute it and compare the two sides.",
                "Ser menor o mayor que un número no hace que un valor sea solución. Sustitúyelo y compara los dos lados.",
              ],
              "size-not-substitution",
            ),
        bad(yes(`${a} ${op} ${b} = ${qd}.`, `${a} ${op} ${b} = ${qd}.`), slipFb, "arithmetic-slip"),
        bad(
          no(
            `${a} ${op} ${b} = ${slipped(slipTo)}, which is not ${qd}.`,
            `${a} ${op} ${b} = ${slipped(slipTo)}, que no es ${qd}.`,
          ),
          slipFb,
          "arithmetic-slip",
        ),
      );
    }
    return { right, wrongs: rng.shuffle(wrongs), isSol, ex };
  };

  /** a test value that keeps every number in the working non-negative */
  const fits = (e, v) => v >= 0 && lhs(e.f, e.p, v) >= 0;
  /** a number that prints cleanly in this equation (at most two decimals, or a multiple of 1/d) */
  const tidy = (e, n) => {
    const k = e.d || 100;
    return near(n * k, Math.round(n * k));
  };
  /** which value to test: the solution, a near miss, or the value a wrong inverse gives */
  const testValue = (rng, e, allowSlip) => {
    const r = rng.next();
    if (r < 0.45) return e.s;
    if (allowSlip && r > 0.8) {
      const slip = inverseSlips(e).find(
        (x) =>
          x.val > 0 &&
          !near(x.val, e.s) &&
          tidy(e, x.val) &&
          tidy(e, lhs(e.f, e.p, x.val)) &&
          fits(e, x.val),
      );
      if (slip) return slip.val;
    }
    const k = rng.int(1, 2);
    const v = clean(e.s + (rng.chance(0.5) ? 1 : -1) * e.vs * k);
    return fits(e, v) ? v : clean(e.s + e.vs * k);
  };

  /** abstract equation for the level (flipped, decimal and fraction forms from level 3) */
  const eqFor = (rng, level, o = {}) => {
    const f = o.f || rng.pick(o.forms || (level === 1 ? ["add", "sub"] : FORMS));
    const v = o.v || rng.pick(VARS);
    let e;
    if (level >= 3 && (f === "add" || f === "sub") && rng.chance(o.frac ?? 0.25))
      e = fracEq(rng, f, v);
    else if (level >= 3 && rng.chance(o.dec ?? 0.5)) e = decEq(rng, f, v);
    else e = intEq(rng, f, v, level);
    e.flip = level >= 3 && rng.chance(o.flip ?? 0.3);
    return e;
  };

  const SC_KINDS = /** @type {any} */ ({
    1: [
      ["yn", 3],
      ["pick", 3],
      ["complete", 2],
    ],
    2: [
      ["yn", 3],
      ["pick", 3],
      ["complete", 2],
    ],
    3: [
      ["yn", 3],
      ["pick", 3],
      ["complete", 1],
    ],
    4: [
      ["both", 3],
      ["fits", 3],
      ["find", 2],
      ["yn", 1],
    ],
  });

  /** "Is x = 6 a solution of x + 8 = 13?"  four claims, one correct */
  const scYesNo = (rng, level) => {
    const useStory = level >= 2 && rng.chance(level === 2 ? 0.4 : 0.35);
    let e;
    let intro = ["", ""];
    if (useStory) {
      const f = rng.pick(FORMS);
      const st = rng.pick(STORY[f]);
      e = storyEq(rng, level, f, st);
      const t = storyText(st, e, rng.pick(NAMES));
      intro = [
        `${t.en} The equation ${eqStr(e)} models this story. `,
        `${t.es} La ecuación ${eqStr(e)} modela esta situación. `,
      ];
    } else e = eqFor(rng, level);
    const val = testValue(rng, e, false);
    const c = claims(rng, e, val);
    const eq = eqStr(e);
    const vd = show(e, val);
    const [a, op, b] = subParts(e, val);
    const item = mcx(rng, {
      q: `${intro[0]}Is ${e.v} = ${vd} a solution${useStory ? "" : ` of ${eq}`}?`,
      qEs: `${intro[1]}¿Es ${e.v} = ${vd} una solución${useStory ? "" : ` de ${eq}`}?`,
      right: c.right,
      wrong: c.wrongs,
      ...text({
        q: ["", ""],
        x: [
          `Substitute ${e.v} = ${vd}: ${c.ex}. The other side is ${e.qd}. ${c.isSol ? `Both sides are equal, so ${vd} IS a solution.` : `The sides are not equal, so ${vd} is NOT a solution.`}`,
          `Sustituye ${e.v} = ${vd}: ${c.ex}. El otro lado es ${e.qd}. ${c.isSol ? `Ambos lados son iguales, así que ${vd} SÍ es una solución.` : `Los lados no son iguales, así que ${vd} NO es una solución.`}`,
        ],
        h: [
          [
            `To test a value, substitute it: replace ${e.v} with ${vd}.`,
            `Para comprobar un valor, sustitúyelo: reemplaza ${e.v} por ${vd}.`,
          ],
          [
            "Work out the side with the variable. Then compare it with the other side.",
            "Calcula el lado que tiene la variable. Luego compáralo con el otro lado.",
          ],
          [
            `Work out ${a} ${op} ${b}. Is it equal to ${e.qd}?`,
            `Calcula ${a} ${op} ${b}. ¿Es igual a ${e.qd}?`,
          ],
        ],
      }),
      meta: { kind: "yn", e, val },
    });
    return item;
  };

  /** "Which value of x makes x + 8 = 13 true?"  four numbers, one fits */
  const scPick = (rng, level) => {
    const e = eqFor(rng, level);
    const slips = inverseSlips(e);
    const wrong = [];
    const near1 = [1, -1, 2, -2, 3, -3, 4, 5].map((k) => clean(e.s + k * e.vs));
    const cand = [
      ...rng.shuffle(slips),
      ...near1.map((val) => ({
        val,
        tag: "arithmetic-slip",
        fb: [
          "A small counting slip can make a value miss. Check the arithmetic.",
          "Un pequeño error al contar puede hacer que un valor no sirva. Revisa la aritmética.",
        ],
      })),
    ];
    for (const s of cand) {
      if (s.val < 0 || near(s.val, e.s) || !fits(e, s.val)) continue;
      const t = clean(lhs(e.f, e.p, s.val));
      if (near(t, e.s) || !tidy(e, t) || !tidy(e, s.val)) continue;
      const sub = subText(e, s.val);
      wrong.push(
        wr(
          show(e, s.val),
          [
            `${s.fb[0]} Substitute it: ${sub} = ${show(e, t)}, not ${e.qd}.`,
            `${s.fb[1]} Sustitúyelo: ${sub} = ${show(e, t)}, no ${e.qd}.`,
          ],
          s.tag,
        ),
      );
    }
    const lowHigh = e.f === "add" || e.f === "mul" ? ["less", "menor"] : ["greater", "mayor"];
    return mcx(rng, {
      q: `Which value of ${e.v} makes ${eqStr(e)} true?`,
      qEs: `¿Qué valor de ${e.v} hace verdadera la ecuación ${eqStr(e)}?`,
      right: show(e, e.s),
      wrong,
      ...text({
        q: ["", ""],
        x: [`${solveLine(e)[0]} ${checkLine(e)[0]}`, `${solveLine(e)[1]} ${checkLine(e)[1]}`],
        h: [
          [
            "A solution makes the equation true. Substitute a choice for the variable and see whether both sides match.",
            "Una solución hace verdadera la ecuación. Sustituye una opción por la variable y mira si ambos lados coinciden.",
          ],
          [
            `Think: ${doesTo(e)[0]} The result is ${e.qd}, so ${e.v} must be ${lowHigh[0]} than ${e.qd}.`,
            `Piensa: ${doesTo(e)[1]} El resultado es ${e.qd}, así que ${e.v} debe ser ${lowHigh[1]} que ${e.qd}.`,
          ],
          [
            "Test one choice. If the side comes out too big, try a smaller choice. If it comes out too small, try a bigger one.",
            "Prueba una opción. Si el lado resulta demasiado grande, prueba una menor. Si resulta demasiado pequeño, prueba una mayor.",
          ],
        ],
      }),
      meta: { kind: "pick", e },
    });
  };

  /** the operation a student uses by mistake: × for an equation that adds or divides, + otherwise */
  const otherOp = (e) => (e.f === "add" || e.f === "div" ? "×" : "+");
  const otherOpValue = (e, val) => {
    const [a, , b] = subParts(e, val);
    const x = G.value(a);
    const y = G.value(b);
    return clean(otherOp(e) === "×" ? x * y : x + y);
  };
  /** "Complete the equation so that x = 9 is a solution: x + 12 = ___"  typed */
  const scComplete = (rng, level) => {
    const e = eqFor(rng, level);
    const val = e.s;
    const vd = show(e, val);
    const [a, op, b] = subParts(e, val);
    const t = clean(lhs(e.f, e.p, val));
    const blank = e.flip ? `___ = ${sideStr(e)}` : `${sideStr(e)} = ___`;
    const slips = [];
    const wrongOpVal = otherOpValue(e, val);
    if (!near(wrongOpVal, t) && tidy(e, wrongOpVal))
      slips.push({
        v: show(e, wrongOpVal),
        f: [
          `That uses ${otherOp(e)} instead of ${OP[e.f]}. Use the operation that is written in the equation.`,
          `Eso usa ${otherOp(e)} en lugar de ${OP[e.f]}. Usa la operación que está escrita en la ecuación.`,
        ],
        tag: "wrong-operation",
      });
    slips.push({
      v: vd,
      f: [
        `${vd} is the value of ${e.v}. The blank is what ${sideStr(e)} comes to when ${e.v} is ${vd}.`,
        `${vd} es el valor de ${e.v}. El espacio en blanco es lo que da ${sideStr(e)} cuando ${e.v} vale ${vd}.`,
      ],
      tag: "copied-value",
    });
    slips.push({
      v: e.pd,
      f: [
        `${e.pd} is a number already in ${sideStr(e)}. Replace ${e.v} with ${vd} and work out the whole side.`,
        `${e.pd} es un número que ya está en ${sideStr(e)}. Reemplaza ${e.v} por ${vd} y calcula todo ese lado.`,
      ],
      tag: "copied-number",
    });
    const seen = new Set([norm(show(e, t))]);
    const fw = slips
      .filter((s) => !seen.has(norm(s.v)) && seen.add(norm(s.v)))
      .map((s) => ({ v: s.v, f: s.f[0], fEs: s.f[1], tag: s.tag }));
    return G.num({
      q: `Complete the equation so that ${e.v} = ${vd} is a solution: ${blank}`,
      qEs: `Completa la ecuación para que ${e.v} = ${vd} sea una solución: ${blank}`,
      a: show(e, t),
      tol: e.d ? 0.0005 : undefined,
      fw,
      ...text({
        x: [
          `A solution makes both sides equal, so the blank must equal ${sideStr(e)} when ${e.v} = ${vd}: ${a} ${op} ${b} = ${show(e, t)}. The equation is ${eqStr(e)}.`,
          `Una solución hace iguales los dos lados, así que el espacio en blanco debe ser igual a ${sideStr(e)} cuando ${e.v} = ${vd}: ${a} ${op} ${b} = ${show(e, t)}. La ecuación es ${eqStr(e)}.`,
        ],
        h: [
          [
            `If ${e.v} = ${vd} is a solution, the two sides of the equation must be equal when you replace ${e.v} with ${vd}.`,
            `Si ${e.v} = ${vd} es una solución, los dos lados de la ecuación deben ser iguales cuando reemplazas ${e.v} por ${vd}.`,
          ],
          [
            `Replace ${e.v} with ${vd} in ${sideStr(e)}.`,
            `Reemplaza ${e.v} por ${vd} en ${sideStr(e)}.`,
          ],
          [
            `Work out ${a} ${op} ${b}. That number goes in the blank.`,
            `Calcula ${a} ${op} ${b}. Ese número va en el espacio en blanco.`,
          ],
        ],
      }),
      meta: { kind: "complete", e, val },
    });
  };

  /** the four things that can be said about one value tested in two equations */
  const bothStatements = (e1, e2, val) => {
    const v = `${e1.v} = ${show(e1, val)}`;
    return {
      both: [`${v} is a solution of both equations.`, `${v} es una solución de ambas ecuaciones.`],
      first: [
        `${v} is a solution of ${eqStr(e1)} only.`,
        `${v} es una solución solo de ${eqStr(e1)}.`,
      ],
      second: [
        `${v} is a solution of ${eqStr(e2)} only.`,
        `${v} es una solución solo de ${eqStr(e2)}.`,
      ],
      neither: [
        `${v} is not a solution of either equation.`,
        `${v} no es una solución de ninguna de las dos ecuaciones.`,
      ],
    };
  };
  /** level 4: test one value in two equations */
  const scBoth = (rng) => {
    const v = rng.pick(VARS);
    const val = rng.int(3, 18);
    const outcome = rng.pick(["both", "first", "second", "neither"]);
    const forms = rng.shuffle(FORMS);
    // an equation that holds at val (fits) or just misses it; its working at val stays a whole number
    const build = (f, fits) => {
      for (let t = 0; t < 40; t++) {
        const s = fits ? val : val + rng.pick([-2, -1, 1, 2]);
        const e = s >= 1 ? eqWithSolution(rng, t === 0 ? f : rng.pick(forms), v, s) : null;
        const at = e ? lhs(e.f, e.p, val) : -1;
        if (e && Number.isInteger(at) && at >= 0) return e;
      }
      return makeEq("add", v, 5, fits ? val : val + 1);
    };
    const e1 = build(forms[0], outcome === "both" || outcome === "first");
    let e2 = build(forms[1], outcome === "both" || outcome === "second");
    if (eqStr(e1) === eqStr(e2)) e2 = build(forms[2], outcome === "both" || outcome === "second");
    const st = bothStatements(e1, e2, val);
    const oneOnly = [
      `You checked one equation. Substitute ${e1.v} = ${val} into the other equation too and compare its sides.`,
      `Comprobaste una ecuación. Sustituye ${e1.v} = ${val} también en la otra ecuación y compara sus lados.`,
    ];
    const fb = {
      both: [
        `Do not stop early: ${sideStr(e1)} and ${sideStr(e2)} each need their own check. Substitute into both and compare the sides.`,
        `No te detengas antes: ${sideStr(e1)} y ${sideStr(e2)} necesitan cada una su comprobación. Sustituye en ambas y compara los lados.`,
      ],
      first: oneOnly,
      second: oneOnly,
      neither: [
        "Substitute the value into each equation and compare the sides before deciding that it fails everywhere.",
        "Sustituye el valor en cada ecuación y compara los lados antes de decidir que falla en todas.",
      ],
    };
    const tags = {
      both: "assumed-both",
      first: "tested-one-equation",
      second: "tested-one-equation",
      neither: "assumed-neither",
    };
    const wrong = ["both", "first", "second", "neither"]
      .filter((k) => k !== outcome)
      .map((k) => wr(st[k][0], fb[k], tags[k], st[k][1]));
    const one = (e) => `${eqStr(e)}: ${subText(e, val)} = ${fmt(clean(lhs(e.f, e.p, val)))}, `;
    return mcx(rng, {
      q: `Priya tests ${e1.v} = ${val} in two equations: ${eqStr(e1)} and ${eqStr(e2)}. Which statement is true?`,
      qEs: `Priya prueba ${e1.v} = ${val} en dos ecuaciones: ${eqStr(e1)} y ${eqStr(e2)}. ¿Qué enunciado es verdadero?`,
      right: { v: st[outcome][0], vEs: st[outcome][1] },
      wrong,
      ...text({
        x: [
          `${one(e1)}and the other side is ${e1.qd}. ${one(e2)}and the other side is ${e2.qd}.`,
          `${one(e1)}y el otro lado es ${e1.qd}. ${one(e2)}y el otro lado es ${e2.qd}.`,
        ],
        h: [
          [
            "A value is a solution only if it makes the equation true. Test it in each equation separately.",
            "Un valor es solución solo si hace verdadera la ecuación. Pruébalo en cada ecuación por separado.",
          ],
          [
            `Substitute ${e1.v} = ${val} into ${eqStr(e1)} first. Do the two sides match?`,
            `Sustituye ${e1.v} = ${val} primero en ${eqStr(e1)}. ¿Coinciden los dos lados?`,
          ],
          [
            `Now do the same for ${eqStr(e2)}: work out ${subText(e2, val)}.`,
            `Ahora haz lo mismo con ${eqStr(e2)}: calcula ${subText(e2, val)}.`,
          ],
        ],
      }),
      meta: { kind: "both", e1, e2, val },
    });
  };

  /** level 4: which equation has this solution? */
  const scFits = (rng) => {
    const v = rng.pick(VARS);
    const val = rng.int(3, 20);
    let key = null;
    for (const f of rng.shuffle(FORMS)) {
      key = eqWithSolution(rng, f, v, val);
      if (key) break;
    }
    key = key || makeEq("add", v, 6, val);
    const close = [
      "The numbers are close, but the sides do not match.",
      "Los números están cerca, pero los lados no coinciden.",
    ];
    const cands = [];
    for (const f of FORMS)
      if (f !== key.f)
        cands.push({
          e: eqFromPQ(f, v, key.p, key.q),
          tag: "wrong-operation",
          why: [
            `It uses ${OP[f]} instead of ${OP[key.f]}.`,
            `Usa ${OP[f]} en lugar de ${OP[key.f]}.`,
          ],
        });
    for (const d of [1, -1, 2]) {
      if (key.q + d > 0)
        cands.push({ e: eqFromPQ(key.f, v, key.p, key.q + d), tag: "off-by-one", why: close });
      if (key.p + d > 1)
        cands.push({ e: eqFromPQ(key.f, v, key.p + d, key.q), tag: "off-by-one", why: close });
    }
    const wrong = rng
      .shuffle(cands)
      .filter(
        (c) =>
          !near(lhs(c.e.f, c.e.p, val), c.e.q) &&
          fits(c.e, val) &&
          Number.isInteger(lhs(c.e.f, c.e.p, val)),
      )
      .map((c) => {
        const t = fmt(clean(lhs(c.e.f, c.e.p, val)));
        return {
          ...wr(
            eqStr(c.e),
            [
              `Substitute ${v} = ${val}: ${subText(c.e, val)} = ${t}, but the other side is ${c.e.qd}. ${c.why[0]}`,
              `Sustituye ${v} = ${val}: ${subText(c.e, val)} = ${t}, pero el otro lado es ${c.e.qd}. ${c.why[1]}`,
            ],
            c.tag,
          ),
          d: c.e,
        };
      });
    return mcx(rng, {
      q: `Which equation has ${v} = ${val} as its solution?`,
      qEs: `¿Qué ecuación tiene a ${v} = ${val} como solución?`,
      right: { v: eqStr(key), d: key },
      wrong,
      ...text({
        x: [
          `${subText(key, val)} = ${key.qd}, so ${v} = ${val} makes ${eqStr(key)} true. Each of the other equations is false when you substitute ${val}.`,
          `${subText(key, val)} = ${key.qd}, así que ${v} = ${val} hace verdadera ${eqStr(key)}. Cada una de las otras ecuaciones es falsa al sustituir ${val}.`,
        ],
        h: [
          [
            "Substitute the value into each equation. The right one becomes a true statement.",
            "Sustituye el valor en cada ecuación. La correcta se vuelve un enunciado verdadero.",
          ],
          [
            `Replace ${v} with ${val} in the first equation and work out the side with the variable.`,
            `Reemplaza ${v} por ${val} en la primera ecuación y calcula el lado con la variable.`,
          ],
          [
            "Compare that result with the other side. If they are not equal, cross the equation out and test the next one.",
            "Compara ese resultado con el otro lado. Si no son iguales, tacha la ecuación y prueba la siguiente.",
          ],
        ],
      }),
      meta: { kind: "fits", v, val },
    });
  };

  /** level 4: one number makes both equations true */
  const scFind = (rng) => {
    const v = rng.pick(VARS);
    const val = rng.int(3, 24);
    let e1 = null;
    let e2 = null;
    for (const f of rng.shuffle(FORMS)) {
      const e = eqWithSolution(rng, f, v, val);
      if (!e) continue;
      if (!e1) e1 = e;
      else if (f !== e1.f) {
        e2 = e;
        break;
      }
    }
    const a = e1 || makeEq("add", v, 4, val);
    const b = e2 || makeEq("mul", v, 3, val);
    b.flip = rng.chance(0.5);
    const seen = new Set([val]);
    const fw = [];
    for (const s of [...inverseSlips(a), ...inverseSlips(b)]) {
      if (s.val < 0 || seen.has(s.val)) continue;
      seen.add(s.val);
      fw.push({ v: fmt(s.val), f: s.fb[0], fEs: s.fb[1], tag: s.tag });
    }
    return G.num({
      q: `One number makes both equations true: ${eqStr(a)} and ${eqStr(b)}. What is the number?`,
      qEs: `Un número hace verdaderas las dos ecuaciones: ${eqStr(a)} y ${eqStr(b)}. ¿Cuál es el número?`,
      a: String(inv(a.f, a.p, a.q)),
      fw: fw.slice(0, 4),
      ...text({
        x: [
          `Solve the easier equation. ${solveLine(a)[0]} Check it in the other one: ${subText(b, val)} = ${b.qd}. Both are true.`,
          `Resuelve la ecuación más fácil. ${solveLine(a)[1]} Compruébalo en la otra: ${subText(b, val)} = ${b.qd}. Ambas son verdaderas.`,
        ],
        h: [
          [
            "The number must work in both equations, so you can solve just one of them and use the other to check.",
            "El número debe funcionar en las dos ecuaciones, así que puedes resolver solo una y usar la otra para comprobar.",
          ],
          [
            `Pick the equation that looks easier. ${doesTo(a)[0]}`,
            `Elige la ecuación que se vea más fácil. ${doesTo(a)[1]}`,
          ],
          [`${undoes(a)[0]} Do that to ${a.qd}.`, `${undoes(a)[1]} Hazlo con ${a.qd}.`],
        ],
      }),
      meta: { kind: "find", e1: a, e2: b },
    });
  };

  G.register("solutionCheck", {
    title: "Is it a solution?",
    titleEs: "¿Es una solución?",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, SC_KINDS[level]);
      if (kind === "yn") return scYesNo(rng, level);
      if (kind === "pick") return scPick(rng, level);
      if (kind === "complete") return scComplete(rng, level);
      if (kind === "both") return scBoth(rng);
      if (kind === "fits") return scFits(rng);
      return scFind(rng);
    },
    check(item) {
      const m = item.meta;
      const lhsAt = (e, x) => lhs(e.f, e.p, x);
      if (m.kind === "yn" || m.kind === "pick")
        if (!item.q.includes(eqStr(m.e))) return "the stem lost its equation";
      if (m.kind === "yn") {
        const good = item.c.map((c) => claimCorrect(c, m.e, m.val));
        const n = good.filter(Boolean).length;
        if (n !== 1) return `${n} choices are correct claims`;
        return good[item.a] ? true : "keyed choice is not the correct claim";
      }
      if (m.kind === "pick") {
        const ok = item.c.map((c) => near(lhsAt(m.e, G.value(c)), m.e.q));
        if (ok.filter(Boolean).length !== 1)
          return `${ok.filter(Boolean).length} choices satisfy the equation`;
        return ok[item.a] ? true : "keyed choice does not satisfy the equation";
      }
      if (m.kind === "complete") {
        // a text route: evaluate the printed side, independent of lhs()
        if (!item.q.includes(sideStr(m.e))) return "the stem lost its expression";
        const got = evalSide(sideStr(m.e), m.e.v, m.val);
        return near(G.value(item.a), got)
          ? true
          : "typed answer is not the value of the printed side";
      }
      if (m.kind === "find") {
        const x = G.value(item.a);
        return near(lhsAt(m.e1, x), m.e1.q) && near(lhsAt(m.e2, x), m.e2.q)
          ? true
          : "answer fails one of the equations";
      }
      if (m.kind === "both") {
        const t1 = near(lhsAt(m.e1, m.val), m.e1.q);
        const t2 = near(lhsAt(m.e2, m.val), m.e2.q);
        const want = t1 && t2 ? "both" : t1 ? "first" : t2 ? "second" : "neither";
        const st = bothStatements(m.e1, m.e2, m.val);
        const hit = item.c.map((c) => Object.keys(st).filter((k) => st[k][0] === c));
        if (hit.some((h) => h.length !== 1)) return "a choice is not one of the four statements";
        return hit[item.a][0] === want ? true : "keyed statement is not the true one";
      }
      if (m.kind === "fits") {
        const ok = m.opts.map((o, i) => eqStr(o) === item.c[i] && near(lhsAt(o, m.val), o.q));
        if (ok.filter(Boolean).length !== 1) return `${ok.filter(Boolean).length} equations fit`;
        return ok[item.a] ? true : "keyed equation does not fit";
      }
      return `unknown kind ${m.kind}`;
    },
  });
  /* ====================================================================================================
   * Shared by solveAddSub and solveMulDiv: typed solves, "which step", "which equation fits this step"
   * ================================================================================================== */
  /** wrong typed answers from misusing the inverse operation, as fw entries [{v, f, fEs, tag}] */
  const slipsToFw = (e, ans, max = 4) => {
    const seen = new Set([norm(show(e, clean(ans)))]);
    const out = [];
    for (const s of inverseSlips(e)) {
      if (s.val < 0 || !tidy(e, s.val)) continue;
      const k = norm(show(e, s.val));
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ v: show(e, s.val), f: s.fb[0], fEs: s.fb[1], tag: s.tag });
    }
    return out.slice(0, max);
  };
  /** the ladder every solve uses: what happens to the variable, the inverse, the first step */
  const solveLadder = (e) => [
    [`${doesTo(e)[0]} Which operation undoes that?`, `${doesTo(e)[1]} ¿Qué operación lo deshace?`],
    [
      `${undoes(e)[0]} Do it to BOTH sides so the equation stays balanced.`,
      `${undoes(e)[1]} Hazla en AMBOS lados para que la ecuación siga equilibrada.`,
    ],
    firstStep(e),
  ];
  const solveExplain = (e) => [
    `${solveLine(e)[0]} ${checkLine(e)[0]}`,
    `${solveLine(e)[1]} ${checkLine(e)[1]}`,
  ];

  /** "Solve x + 9 = 15. What is the value of x?"  typed */
  const solveTyped = (rng, level, o) => {
    const e = o.e || eqFor(rng, level, o);
    const ans = clean(inv(e.f, e.p, e.q));
    return G.num({
      q: `Solve ${eqStr(e)}. What is the value of ${e.v}?`,
      qEs: `Resuelve ${eqStr(e)}. ¿Cuál es el valor de ${e.v}?`,
      a: show(e, ans),
      tol: e.d ? 0.0005 : undefined,
      fw: slipsToFw(e, ans),
      ...text({ x: solveExplain(e), h: solveLadder(e) }),
      meta: { kind: "solve", e },
    });
  };

  /* a step as text: kind add|sub|mul|div, n printed, side "both" | "left" */
  const stepText = (kind, n, side) => {
    if (side === "left")
      return kind === "add"
        ? [`Add ${n} to the left side only`, `Suma ${n} solo al lado izquierdo`]
        : kind === "sub"
          ? [`Subtract ${n} from the left side only`, `Resta ${n} solo del lado izquierdo`]
          : kind === "mul"
            ? [`Multiply the left side by ${n} only`, `Multiplica ${n} solo el lado izquierdo`]
            : [`Divide the left side by ${n} only`, `Divide solo el lado izquierdo entre ${n}`];
    return kind === "add"
      ? [`Add ${n} to both sides`, `Suma ${n} a ambos lados`]
      : kind === "sub"
        ? [`Subtract ${n} from both sides`, `Resta ${n} de ambos lados`]
        : kind === "mul"
          ? [`Multiply both sides by ${n}`, `Multiplica ambos lados por ${n}`]
          : [`Divide both sides by ${n}`, `Divide ambos lados entre ${n}`];
  };
  const INV_KIND = { add: "sub", sub: "add", mul: "div", div: "mul" };
  /** does the printed step, applied to the variable side "v ± p" / "pv" / "v ÷ p", leave the variable alone? */
  const stepIsolates = (text0, lhsText, v) => {
    const s =
      /^(Add|Subtract) (\S+) (?:to|from) both sides$/.exec(text0) ||
      /^(Multiply|Divide) both sides by (\S+)$/.exec(text0);
    if (!s) return false; // "the left side only" and anything else never keeps the equation balanced
    const n = G.value(s[2]);
    let coef;
    let c;
    let m = new RegExp(`^${v} ([+−÷]) (\\S+)$`).exec(lhsText);
    if (m) {
      const p = G.value(m[2]);
      coef = m[1] === "÷" ? 1 / p : 1;
      c = m[1] === "+" ? p : m[1] === "−" ? -p : 0;
    } else {
      m = new RegExp(`^\\(?(\\S+?)\\)?${v}$`).exec(lhsText);
      if (!m) return false;
      coef = G.value(m[1]);
      c = 0;
    }
    if (s[1] === "Add") c += n;
    else if (s[1] === "Subtract") c -= n;
    else if (s[1] === "Multiply") {
      coef *= n;
      c *= n;
    } else {
      coef /= n;
      c /= n;
    }
    return near(coef, 1) && near(c, 0);
  };
  /** "Which step gets x by itself in x − 7 = 15 and keeps the equation balanced?" */
  const stepItem = (rng, level, forms) => {
    const e = eqFor(rng, Math.min(level, 2), { forms });
    e.flip = false;
    const kind = e.f;
    const inverse = INV_KIND[kind];
    const family = kind === "add" || kind === "sub" ? ["mul", "div"] : ["add", "sub"];
    const right = stepText(inverse, e.pd, "both");
    const wrong = [
      wr(
        stepText(kind, e.pd, "both")[0],
        [
          `That keeps the same operation on ${e.v} instead of undoing it. Use the OPPOSITE (inverse) operation.`,
          `Eso mantiene la misma operación sobre ${e.v} en lugar de deshacerla. Usa la operación OPUESTA (inversa).`,
        ],
        "same-operation",
        stepText(kind, e.pd, "both")[1],
      ),
      wr(
        stepText(inverse, e.pd, "left")[0],
        [
          "It is the right operation, but an equation stays balanced only when you do the same thing to BOTH sides.",
          "Es la operación correcta, pero una ecuación se mantiene equilibrada solo cuando haces lo mismo en AMBOS lados.",
        ],
        "one-side-only",
        stepText(inverse, e.pd, "left")[1],
      ),
      wr(
        stepText(rng.pick(family), e.pd, "both")[0],
        [
          `That is a different kind of operation. ${undoes(e)[0]}`,
          `Esa es otro tipo de operación. ${undoes(e)[1]}`,
        ],
        "wrong-operation-family",
      ),
    ];
    // the family option needs its own Spanish text, so build it once
    const fam = family[rng.int(0, 1)];
    wrong[2] = wr(
      stepText(fam, e.pd, "both")[0],
      wrong[2].f ? [wrong[2].f, wrong[2].fEs] : ["", ""],
      "wrong-operation-family",
      stepText(fam, e.pd, "both")[1],
    );
    return mcx(rng, {
      q: `Which step gets ${e.v} by itself in ${eqStr(e)} and keeps the equation balanced?`,
      qEs: `¿Qué paso deja a ${e.v} sola en ${eqStr(e)} y mantiene la ecuación equilibrada?`,
      right: { v: right[0], vEs: right[1] },
      wrong,
      ...text({
        x: [
          `${doesTo(e)[0]} ${undoes(e)[0]} ${right[0]}: ${solveLine(e)[0].split(": ")[1]}`,
          `${doesTo(e)[1]} ${undoes(e)[1]} ${right[1]}: ${solveLine(e)[1].split(": ")[1]}`,
        ],
        h: [
          [doesTo(e)[0], doesTo(e)[1]],
          [
            "An inverse operation undoes another one. Do it to both sides so the equation stays balanced.",
            "Una operación inversa deshace otra. Hazla en ambos lados para que la ecuación siga equilibrada.",
          ],
          [
            `What undoes ${kind === "add" ? "adding" : kind === "sub" ? "subtracting" : kind === "mul" ? "multiplying by" : "dividing by"} ${e.pd}?`,
            `¿Qué deshace ${kind === "add" ? "sumar" : kind === "sub" ? "restar" : kind === "mul" ? "multiplicar por" : "dividir entre"} ${e.pd}?`,
          ],
        ],
      }),
      meta: { kind: "step", e },
    });
  };
  const stepCheck = (item) => {
    const m = item.meta;
    if (!item.q.includes(eqStr(m.e))) return "the stem lost its equation";
    const ok = item.c.map((c) => stepIsolates(c, sideStr(m.e), m.e.v));
    if (ok.filter(Boolean).length !== 1)
      return `${ok.filter(Boolean).length} steps isolate the variable`;
    return ok[item.a] ? true : "keyed step does not isolate the variable";
  };

  /** "Which equation can you solve by adding 9 to both sides?"  four forms, one fits */
  const inverseItem = (rng, level, families) => {
    const [fa, fb] = families; // the two forms the lesson teaches, e.g. ["add", "sub"]
    const kind = rng.pick([fa, fb]); // the step asked for undoes the OTHER form
    const target = INV_KIND[kind]; // equation form that this step solves
    const p = level === 1 ? rng.int(2, 9) : rng.int(3, 12);
    const q = rng.int(2, 6) * p + (target === "sub" ? p : 0);
    const v = rng.pick(VARS);
    const shapes = ["add", "sub", "mul", "div"].map((f) => eqFromPQ(f, v, p, q));
    shapes.forEach((e) => {
      e.flip = false;
    });
    const key = shapes.find((e) => e.f === target);
    const sameOp = shapes.find((e) => e.f === kind);
    const others = shapes.filter((e) => e !== key && e !== sameOp);
    const word = {
      add: ["adding", "sumando"],
      sub: ["subtracting", "restando"],
      mul: ["multiplying by", "multiplicando por"],
      div: ["dividing by", "dividiendo entre"],
    }[kind];
    return mcx(rng, {
      q: `Which equation can you solve by ${word[0]} ${p} on both sides?`,
      qEs: `¿Qué ecuación puedes resolver ${word[1]} ${p} en ambos lados?`,
      right: eqStr(key),
      wrong: [
        wr(
          eqStr(sameOp),
          [
            `That step would pile on more of the same operation instead of undoing it: ${sideStr(sameOp)} would not become ${v}.`,
            `Ese paso añadiría más de la misma operación en lugar de deshacerla: ${sideStr(sameOp)} no se convertiría en ${v}.`,
          ],
          "same-operation",
        ),
        ...others.map((o) =>
          wr(
            eqStr(o),
            [
              `${undoes(o)[0]} The step in the question does not undo what happens to ${v} here.`,
              `${undoes(o)[1]} El paso de la pregunta no deshace lo que le ocurre a ${v} aquí.`,
            ],
            "wrong-operation-family",
          ),
        ),
      ],
      ...text({
        x: [
          `${undoes(key)[0]} In ${eqStr(key)}, ${doesTo(key)[0].toLowerCase()} So ${stepText(kind, p, "both")[0].toLowerCase()} to get ${v} alone.`,
          `${undoes(key)[1]} En ${eqStr(key)}, ${doesTo(key)[1].charAt(0).toLowerCase()}${doesTo(key)[1].slice(1)} Entonces ${stepText(kind, p, "both")[1].charAt(0).toLowerCase()}${stepText(kind, p, "both")[1].slice(1)} para dejar ${v} sola.`,
        ],
        h: [
          [
            `Say what the step does: ${stepText(kind, p, "both")[0].toLowerCase()}.`,
            `Di qué hace el paso: ${stepText(kind, p, "both")[1].charAt(0).toLowerCase()}${stepText(kind, p, "both")[1].slice(1)}.`,
          ],
          [
            "Look for the equation where that step leaves the variable alone on its side.",
            "Busca la ecuación en la que ese paso deja a la variable sola en su lado.",
          ],
          [
            `Try the step on the first equation. Does ${v} end up alone?`,
            `Prueba el paso en la primera ecuación. ¿Queda ${v} sola?`,
          ],
        ],
      }),
      meta: { kind: "inverse", v, step: kind, n: p },
    });
  };
  const inverseCheck = (item) => {
    const m = item.meta;
    const stepTxt = stepText(m.step, m.n, "both")[0];
    const ok = item.c.map((c) => {
      const lhsText = c.split(" = ")[0];
      return stepIsolates(stepTxt, lhsText, m.v);
    });
    if (ok.filter(Boolean).length !== 1)
      return `${ok.filter(Boolean).length} equations are solved by the step`;
    return ok[item.a] ? true : "keyed equation is not solved by the step";
  };

  /** the story-equation choice: the equation that models the story, with named wrong models */
  const modelOptions = (rng, e) => {
    const v = e.v;
    const f = e.f;
    const pairs = [];
    if (f === "add") {
      pairs.push([
        `${v} − ${e.pd} = ${e.qd}`,
        "wrong-operation",
        [
          "The story adds, so the equation adds. A minus sign says something was taken away.",
          "La historia suma, así que la ecuación suma. Un signo menos dice que se quitó algo.",
        ],
      ]);
      pairs.push([
        `${v} + ${e.qd} = ${e.pd}`,
        "swapped-numbers",
        [
          `The total ${e.qd} belongs alone on the other side of the equal sign.`,
          `El total ${e.qd} va solo del otro lado del signo igual.`,
        ],
      ]);
      pairs.push([
        `${v} = ${e.pd} + ${e.qd}`,
        "added-instead",
        [
          "This adds the two numbers, but the unknown is part of the total. Put the unknown in the equation.",
          "Esto suma los dos números, pero la incógnita es parte del total. Pon la incógnita en la ecuación.",
        ],
      ]);
      pairs.push([
        `${e.pd}${v} = ${e.qd}`,
        "wrong-operation",
        [
          "Nothing is multiplied in this story. Look at the action words.",
          "En esta historia no se multiplica nada. Fíjate en las palabras de acción.",
        ],
      ]);
    } else if (f === "sub") {
      pairs.push([
        `${v} + ${e.pd} = ${e.qd}`,
        "wrong-operation",
        [
          "The story takes away, so the equation subtracts. A plus sign says something was added.",
          "La historia quita, así que la ecuación resta. Un signo más dice que se añadió algo.",
        ],
      ]);
      pairs.push([
        `${e.pd} − ${v} = ${e.qd}`,
        "reversed-order",
        [
          `The unknown is the amount you start with, so it comes first: the ${e.pd} is what is taken from it.`,
          `La incógnita es la cantidad con la que empiezas, así que va primero: los ${e.pd} se le quitan.`,
        ],
      ]);
      pairs.push([
        `${v} − ${e.qd} = ${e.pd}`,
        "swapped-numbers",
        [
          `The amount left, ${e.qd}, belongs on the other side of the equal sign.`,
          `La cantidad que queda, ${e.qd}, va del otro lado del signo igual.`,
        ],
      ]);
      pairs.push([
        `${v} = ${e.qd} − ${e.pd}`,
        "subtracted-wrong-way",
        [
          "That subtracts the numbers, but the start is bigger than what is left. Write the unknown with the action.",
          "Eso resta los números, pero el inicio es mayor que lo que queda. Escribe la incógnita con la acción.",
        ],
      ]);
    } else if (f === "mul") {
      pairs.push([
        `${v} + ${e.pd} = ${e.qd}`,
        "wrong-operation",
        [
          "Equal groups call for multiplication, not addition.",
          "Los grupos iguales piden multiplicar, no sumar.",
        ],
      ]);
      pairs.push([
        `${v} ÷ ${e.pd} = ${e.qd}`,
        "wrong-operation",
        [
          "Dividing is for sharing a total. Here the groups are being put together.",
          "Dividir sirve para repartir un total. Aquí se juntan los grupos.",
        ],
      ]);
      pairs.push([
        `${e.qd}${v} = ${e.pd}`,
        "swapped-numbers",
        [
          `The total ${e.qd} belongs alone on the other side of the equal sign.`,
          `El total ${e.qd} va solo del otro lado del signo igual.`,
        ],
      ]);
      pairs.push([
        `${v} − ${e.pd} = ${e.qd}`,
        "wrong-operation",
        [
          "Nothing is taken away in this story. Look for equal groups.",
          "En esta historia no se quita nada. Busca grupos iguales.",
        ],
      ]);
    } else {
      pairs.push([
        `${v} × ${e.pd} = ${e.qd}`,
        "wrong-operation",
        [
          "The story shares something into equal parts, so the equation divides.",
          "La historia reparte algo en partes iguales, así que la ecuación divide.",
        ],
      ]);
      pairs.push([
        `${e.pd} ÷ ${v} = ${e.qd}`,
        "reversed-order",
        [
          `The unknown is the total that gets shared, so it comes first: ${v} ÷ ${e.pd}.`,
          `La incógnita es el total que se reparte, así que va primero: ${v} ÷ ${e.pd}.`,
        ],
      ]);
      pairs.push([
        `${v} ÷ ${e.qd} = ${e.pd}`,
        "swapped-numbers",
        [
          `The size of one share, ${e.qd}, belongs on the other side of the equal sign.`,
          `El tamaño de una parte, ${e.qd}, va del otro lado del signo igual.`,
        ],
      ]);
      pairs.push([
        `${v} + ${e.pd} = ${e.qd}`,
        "wrong-operation",
        [
          "Sharing equally is division, not addition.",
          "Repartir en partes iguales es dividir, no sumar.",
        ],
      ]);
    }
    return rng
      .shuffle(pairs)
      .filter(([t]) => holds(t, v, e.s) === false)
      .map(([t, tag, fb]) => wr(t, fb, tag));
  };
  /** "Which equation matches the story?"  story + four equations (or inequalities) */
  const storyModelItem = (rng, level, forms) => {
    const f = rng.pick(forms);
    const st = rng.pick(STORY[f]);
    const e = storyEq(rng, level, f, st);
    const N = rng.pick(NAMES);
    const t = storyText(st, e, N);
    const wrong = modelOptions(rng, e);
    return mcx(rng, {
      q: `${t.en} Which equation matches the story? Let ${e.v} stand for ${st.what}.`,
      qEs: `${t.es} ¿Qué ecuación corresponde a la historia? Sea ${e.v}: ${st.whatEs}.`,
      right: eqStr(e),
      wrong,
      ...text({
        x: [
          `Let ${e.v} stand for ${st.what}. The story gives ${eqStr(e)}. ${solveLine(e)[0]}`,
          `Sea ${e.v}: ${st.whatEs}. La historia da ${eqStr(e)}. ${solveLine(e)[1]}`,
        ],
        h: [
          [
            "Find the action in the story: does it add, take away, put equal groups together, or share equally?",
            "Busca la acción en la historia: ¿suma, quita, junta grupos iguales o reparte en partes iguales?",
          ],
          [
            "Write the unknown first, then the action, then the number. The total goes on the other side of the equal sign.",
            "Escribe primero la incógnita, luego la acción y luego el número. El total va del otro lado del signo igual.",
          ],
          [
            `Which number is the total the story ends with? Put it after the equal sign.`,
            `¿Qué número es el total con el que termina la historia? Ponlo después del signo igual.`,
          ],
        ],
      }),
      meta: { kind: "model", e, st: st.v },
    });
  };
  const modelCheck = (item) => {
    const m = item.meta;
    // the hidden amount in the story satisfies exactly one printed equation
    const ok = item.c.map((c) => holds(c, m.e.v, m.e.s));
    if (ok.filter(Boolean).length !== 1)
      return `${ok.filter(Boolean).length} equations hold for the story's amount`;
    return ok[item.a] ? true : "keyed equation does not hold for the story's amount";
  };

  /** same solution as the equation in the stem? */
  const sameSolutionItem = (rng, forms) => {
    const v = rng.pick(VARS);
    const s = rng.int(6, 30);
    const build = (f) => eqWithSolution(rng, f, v, s);
    let stem = null;
    let key = null;
    for (let tries = 0; tries < 40 && !(stem && key); tries++) {
      const f1 = rng.pick(forms);
      const f2 = rng.pick(forms);
      const a = build(f1);
      const b = build(f2);
      if (a && b && eqStr(a) !== eqStr(b) && (f1 !== f2 || a.p !== b.p)) {
        stem = a;
        key = b;
      }
    }
    stem = stem || makeEq("add", v, 5, s);
    key = key || makeEq("sub", v, 2, s);
    const cands = [];
    const flipF = INV_KIND[stem.f];
    cands.push([
      eqFromPQ(flipF, v, stem.p, stem.q),
      "wrong-operation",
      [
        "It has the same numbers but a different operation, so the solution changes.",
        "Tiene los mismos números pero otra operación, así que la solución cambia.",
      ],
    ]);
    cands.push([
      eqFromPQ(stem.f, v, stem.q, stem.p),
      "swapped-numbers",
      [
        "The two numbers are swapped, so the solution changes.",
        "Los dos números están intercambiados, así que la solución cambia.",
      ],
    ]);
    cands.push([
      eqFromPQ(key.f, v, key.p, stem.q),
      "copied-total",
      [
        "It keeps the total from the first equation but changes the other number, so the solution changes.",
        "Conserva el total de la primera ecuación pero cambia el otro número, así que la solución cambia.",
      ],
    ]);
    for (const d of [1, -1, 2, -2]) {
      const alt = eqWithSolution(rng, key.f, v, s + d);
      if (alt && alt.p === key.p)
        cands.push([
          alt,
          "off-by-one",
          [
            "The numbers are close, but this equation has a different solution.",
            "Los números están cerca, pero esta ecuación tiene otra solución.",
          ],
        ]);
    }
    const wrong = rng
      .shuffle(cands)
      .filter(([e]) => e.s > 0 && !near(e.s, s) && Number.isFinite(e.s))
      .map(([e, tag, fb]) => wr(eqStr(e), fb, tag));
    for (let k = 1; k <= 8 && wrong.length < 4; k++) {
      const alt = eqWithSolution(rng, rng.pick(forms), v, s + (k % 2 ? k : -k));
      if (alt && alt.s > 0 && !wrong.some((w) => w.v === eqStr(alt)) && eqStr(alt) !== eqStr(key))
        wrong.push(
          wr(
            eqStr(alt),
            [
              "The numbers are close, but this equation has a different solution.",
              "Los números están cerca, pero esta ecuación tiene otra solución.",
            ],
            "off-by-one",
          ),
        );
    }
    return mcx(rng, {
      q: `Which equation has the same solution as ${eqStr(stem)}?`,
      qEs: `¿Qué ecuación tiene la misma solución que ${eqStr(stem)}?`,
      right: eqStr(key),
      wrong,
      ...text({
        x: [
          `${solveLine(stem)[0]} Now solve ${eqStr(key)}: ${solveLine(key)[0]} Both give ${v} = ${s}.`,
          `${solveLine(stem)[1]} Ahora resuelve ${eqStr(key)}: ${solveLine(key)[1]} Ambas dan ${v} = ${s}.`,
        ],
        h: [
          [
            "Equations with the same solution make the same number true. Start by solving the one in the question.",
            "Las ecuaciones con la misma solución hacen verdadero el mismo número. Empieza resolviendo la de la pregunta.",
          ],
          [
            "Then substitute that number into each choice. Only one stays true.",
            "Luego sustituye ese número en cada opción. Solo una sigue siendo verdadera.",
          ],
          [`${firstStep(stem)[0]}`, `${firstStep(stem)[1]}`],
        ],
      }),
      meta: { kind: "same", v, stem },
    });
  };
  const sameCheck = (item) => {
    const m = item.meta;
    const solve = (txt) => sweep(txt, m.v, 0, 1000, 0.5);
    const want = solve(eqStr(m.stem));
    if (want.length !== 1) return `the stem equation has ${want.length} solutions on the sweep`;
    const ok = item.c.map((c) => {
      const got = solve(c);
      return got.length === 1 && near(got[0], want[0]);
    });
    if (ok.filter(Boolean).length !== 1)
      return `${ok.filter(Boolean).length} choices share the solution`;
    return ok[item.a] ? true : "keyed equation does not share the solution";
  };

  /* ====================================================================================================
   * 8-2  solveAddSub
   * ================================================================================================== */
  const ADDSUB = ["add", "sub"];
  const AS_KINDS = {
    1: [
      ["solve", 4],
      ["step", 2],
      ["inverse", 2],
      ["story", 2],
    ],
    2: [
      ["solve", 3],
      ["story", 3],
      ["model", 2],
      ["step", 1],
      ["inverse", 1],
    ],
    3: [
      ["solve", 4],
      ["story", 3],
      ["model", 1],
      ["whole", 2],
    ],
    4: [
      ["twoStage", 3],
      ["whole", 2],
      ["solve", 2],
      ["same", 2],
    ],
  };

  /** "A tank held some liters ... How many liters were in the tank at first?"  typed */
  const storyTyped = (rng, level, forms) => {
    const f = rng.pick(forms);
    const st = rng.pick(STORY[f]);
    const e = storyEq(rng, level, f, st);
    const N = rng.pick(NAMES);
    const t = storyText(st, e, N);
    const ans = clean(inv(e.f, e.p, e.q));
    const mid =
      f === "add" || f === "sub"
        ? [
            "Does the story add to the amount or take away from it?",
            "¿La historia suma a la cantidad o le quita?",
          ]
        : f === "mul"
          ? ["Are equal groups being put together?", "¿Se están juntando grupos iguales?"]
          : ["Is something being shared equally?", "¿Se está repartiendo algo en partes iguales?"];
    return G.num({
      q: `${t.en} ${t.ask} Write an equation, then solve it.`,
      qEs: `${t.es} ${t.askEs} Escribe una ecuación y luego resuélvela.`,
      a: show(e, ans),
      fw: slipsToFw(e, ans),
      ...text({
        x: [
          `Let ${e.v} stand for ${st.what}. The story gives ${eqStr(e)}. ${solveLine(e)[0]} ${checkLine(e)[0]}`,
          `Sea ${e.v}: ${st.whatEs}. La historia da ${eqStr(e)}. ${solveLine(e)[1]} ${checkLine(e)[1]}`,
        ],
        h: [
          [
            `Let ${e.v} stand for what you do not know. ${mid[0]}`,
            `Sea ${e.v} lo que no sabes. ${mid[1]}`,
          ],
          [`Write the equation: ${eqStr(e)}.`, `Escribe la ecuación: ${eqStr(e)}.`],
          firstStep(e),
        ],
      }),
      meta: { kind: "story", e, st: st.v },
    });
  };

  /* ---- level 4: two events, then the start ---- */
  const TWO_STAGE = [
    {
      gain: [
        "{N} got {n} more stickers from a friend",
        "{N} recibió {n} calcomanías más de un amigo",
      ],
      lose: ["{N} gave {n} stickers to a cousin", "{N} le dio {n} calcomanías a un primo"],
      intro: ["{N} had some stickers.", "{N} tenía cierta cantidad de calcomanías."],
      end: ["Now {N} has {q} stickers.", "Ahora {N} tiene {q} calcomanías."],
      ask: [
        "How many stickers did {N} have at the start?",
        "¿Cuántas calcomanías tenía {N} al principio?",
      ],
      what: ["the number of stickers at the start", "el número de calcomanías al principio"],
      v: "s",
    },
    {
      gain: ["{N} earned ${n} walking dogs", "{N} ganó ${n} paseando perros"],
      lose: ["{N} spent ${n} on a snack", "{N} gastó ${n} en una merienda"],
      intro: ["{N} had some money.", "{N} tenía algo de dinero."],
      end: ["Now {N} has ${q}.", "Ahora {N} tiene ${q}."],
      ask: [
        "How many dollars did {N} have at the start?",
        "¿Cuántos dólares tenía {N} al principio?",
      ],
      what: ["the dollars at the start", "los dólares al principio"],
      v: "d",
    },
    {
      gain: ["{n} more students got on", "subieron {n} estudiantes más"],
      lose: ["{n} students got off", "bajaron {n} estudiantes"],
      intro: [
        "Some students were on a bus.",
        "Había cierta cantidad de estudiantes en un autobús.",
      ],
      end: [
        "Then there were {q} students on the bus.",
        "Entonces había {q} estudiantes en el autobús.",
      ],
      ask: [
        "How many students were on the bus at the start?",
        "¿Cuántos estudiantes había en el autobús al principio?",
      ],
      what: ["the number of students at the start", "el número de estudiantes al principio"],
      v: "t",
    },
    {
      gain: ["{n} new books were added", "se añadieron {n} libros nuevos"],
      lose: ["{n} books were borrowed", "se prestaron {n} libros"],
      intro: ["A shelf held some books.", "Un estante tenía cierta cantidad de libros."],
      end: ["Now the shelf holds {q} books.", "Ahora el estante tiene {q} libros."],
      ask: [
        "How many books were on the shelf at the start?",
        "¿Cuántos libros había en el estante al principio?",
      ],
      what: ["the number of books at the start", "el número de libros al principio"],
      v: "b",
    },
    {
      gain: ["{n} liters were pumped in", "se bombearon {n} litros"],
      lose: ["{n} liters were used", "se usaron {n} litros"],
      intro: [
        "A tank held some liters of water.",
        "Un tanque tenía cierta cantidad de litros de agua.",
      ],
      end: ["Now the tank holds {q} liters.", "Ahora el tanque tiene {q} litros."],
      ask: [
        "How many liters were in the tank at the start?",
        "¿Cuántos litros había en el tanque al principio?",
      ],
      what: ["the liters at the start", "los litros al principio"],
      v: "w",
    },
    {
      gain: ["{N} won {n} cards", "{N} ganó {n} cartas"],
      lose: ["{N} traded away {n} cards", "{N} intercambió {n} cartas"],
      intro: ["{N} had some game cards.", "{N} tenía cierta cantidad de cartas de juego."],
      end: ["Now {N} has {q} cards.", "Ahora {N} tiene {q} cartas."],
      ask: ["How many cards did {N} have at the start?", "¿Cuántas cartas tenía {N} al principio?"],
      what: ["the number of cards at the start", "el número de cartas al principio"],
      v: "c",
    },
    {
      gain: ["the team scored {n} more points", "el equipo anotó {n} puntos más"],
      lose: ["the team lost {n} points for a foul", "el equipo perdió {n} puntos por una falta"],
      intro: ["A team had some points.", "Un equipo tenía cierta cantidad de puntos."],
      end: ["Now the team has {q} points.", "Ahora el equipo tiene {q} puntos."],
      ask: [
        "How many points did the team have at the start?",
        "¿Cuántos puntos tenía el equipo al principio?",
      ],
      what: ["the points at the start", "los puntos al principio"],
      v: "k",
    },
  ];
  const twoStageItem = (rng) => {
    const cx = rng.pick(TWO_STAGE);
    const N = rng.pick(NAMES);
    for (let tries = 0; tries < 100; tries++) {
      const s0 = rng.int(12, 60);
      const a = rng.int(3, 24);
      const b = rng.int(3, 24);
      const pattern = wpick(rng, [
        ["gl", 3],
        ["lg", 3],
        ["gg", 2],
        ["ll", 2],
      ]);
      const d1 = pattern[0] === "g" ? a : -a;
      const d2 = pattern[1] === "g" ? b : -b;
      const net = d1 + d2;
      if (
        Math.abs(net) < 2 ||
        a === b ||
        s0 + d1 < 0 ||
        s0 + net < 1 ||
        [a, b, s0 + net].includes(s0)
      )
        continue;
      const q = s0 + net;
      const ev = (d, n) => fill(d > 0 ? cx.gain[0] : cx.lose[0], { N, n }); // English
      const evEs = (d, n) => fill(d > 0 ? cx.gain[1] : cx.lose[1], { N, n });
      const o = { N, q };
      const story = [
        `${fill(cx.intro[0], o)} First, ${ev(d1, a)}. Then, ${ev(d2, b)}. ${fill(cx.end[0], o)}`,
        `${fill(cx.intro[1], o)} Primero, ${evEs(d1, a)}. Luego, ${evEs(d2, b)}. ${fill(cx.end[1], o)}`,
      ];
      const v = cx.v;
      const sign = (d) => (d > 0 ? "+" : "−");
      const eq = `${v} ${sign(d1)} ${a} ${sign(d2)} ${b} = ${q}`;
      const netTxt = `${net > 0 ? "+" : "−"}${Math.abs(net)}`;
      const ans = net > 0 ? q - net : q + Math.abs(net); // undo the combined change
      const slips = [
        [
          q - d1,
          "used-one-change",
          [
            "You used only one of the two changes. Both changes happened, so combine them first.",
            "Usaste solo uno de los dos cambios. Ocurrieron los dos, así que combínalos primero.",
          ],
        ],
        [
          q - d2,
          "used-one-change",
          [
            "You used only one of the two changes. Both changes happened, so combine them first.",
            "Usaste solo uno de los dos cambios. Ocurrieron los dos, así que combínalos primero.",
          ],
        ],
        [
          q + net,
          "net-direction",
          [
            "You undid the combined change in the wrong direction. To go back to the start, use the opposite operation.",
            "Deshiciste el cambio combinado en la dirección equivocada. Para volver al inicio, usa la operación opuesta.",
          ],
        ],
        [
          q - (a + b),
          "ignored-signs",
          [
            "You treated every change as an increase. Check which changes add and which take away.",
            "Trataste todos los cambios como aumentos. Revisa cuáles cambios suman y cuáles quitan.",
          ],
        ],
        [
          q + a + b,
          "ignored-signs",
          [
            "You treated every change as a decrease. Check which changes add and which take away.",
            "Trataste todos los cambios como disminuciones. Revisa cuáles cambios suman y cuáles quitan.",
          ],
        ],
      ];
      const seen = new Set([ans]);
      const fw = [];
      for (const [val, tag, fb] of slips) {
        if (val < 0 || seen.has(val)) continue;
        seen.add(val);
        fw.push({ v: String(val), f: fb[0], fEs: fb[1], tag });
      }
      return G.num({
        q: `${story[0]} ${fill(cx.ask[0], o)}`,
        qEs: `${story[1]} ${fill(cx.ask[1], o)}`,
        a: String(ans),
        fw: fw.slice(0, 4),
        ...text({
          x: [
            `Let ${v} stand for ${cx.what[0]}. The story gives ${eq}. Combine the changes: ${sign(d1)}${a} ${sign(d2)} ${b} = ${netTxt}, so ${v} ${net > 0 ? "+" : "−"} ${Math.abs(net)} = ${q}. ${net > 0 ? `Subtract ${net} from both sides` : `Add ${Math.abs(net)} to both sides`}: ${v} = ${ans}. Check: ${ans} ${sign(d1)} ${a} ${sign(d2)} ${b} = ${q}.`,
            `Sea ${v}: ${cx.what[1]}. La historia da ${eq}. Combina los cambios: ${sign(d1)}${a} ${sign(d2)} ${b} = ${netTxt}, así que ${v} ${net > 0 ? "+" : "−"} ${Math.abs(net)} = ${q}. ${net > 0 ? `Resta ${net} de ambos lados` : `Suma ${Math.abs(net)} a ambos lados`}: ${v} = ${ans}. Comprueba: ${ans} ${sign(d1)} ${a} ${sign(d2)} ${b} = ${q}.`,
          ],
          h: [
            [
              `Let ${v} stand for ${cx.what[0]}. Write one equation that shows both changes in order.`,
              `Sea ${v}: ${cx.what[1]}. Escribe una ecuación que muestre los dos cambios en orden.`,
            ],
            [
              "Combine the two changes into one change. Then solve a one-step equation.",
              "Combina los dos cambios en uno solo. Luego resuelve una ecuación de un paso.",
            ],
            [
              `Work out ${sign(d1)}${a} ${sign(d2)} ${b}. That is the one change to undo.`,
              `Calcula ${sign(d1)}${a} ${sign(d2)} ${b}. Ese es el único cambio que hay que deshacer.`,
            ],
          ],
        }),
        meta: { kind: "twoStage", s0: ans, ev: [d1, d2], q },
      });
    }
    return solveTyped(rng, 2, { forms: ADDSUB });
  };

  /* ---- level 3-4: the unknown is the part that was taken or still needed ---- */
  const WHOLE = [
    {
      type: "take",
      v: "c",
      money: true,
      en: "{N} had {S} and bought a book. Now {N} has {k} left. How much did the book cost?",
      es: "{N} tenía {S} y compró un libro. Ahora le quedan {k}. ¿Cuánto costó el libro?",
      what: ["the cost of the book", "el costo del libro"],
    },
    {
      type: "take",
      v: "r",
      en: "A book has {S} pages. {N} has {k} pages left to read. How many pages has {N} already read?",
      es: "Un libro tiene {S} páginas. A {N} le faltan {k} páginas por leer. ¿Cuántas páginas ya leyó {N}?",
      what: ["the pages already read", "las páginas ya leídas"],
    },
    {
      type: "take",
      v: "e",
      en: "A tray held {S} cookies. After the party, {k} cookies were left. How many cookies were eaten?",
      es: "Una bandeja tenía {S} galletas. Después de la fiesta quedaron {k} galletas. ¿Cuántas galletas se comieron?",
      what: ["the cookies eaten", "las galletas comidas"],
    },
    {
      type: "take",
      v: "m",
      en: "A race is {S} meters long. {N} has {k} meters left to run. How many meters has {N} run?",
      es: "Una carrera mide {S} metros. A {N} le faltan {k} metros por correr. ¿Cuántos metros ha corrido {N}?",
      what: ["the meters already run", "los metros ya corridos"],
    },
    {
      type: "need",
      v: "n",
      money: true,
      en: "A game costs {S}. {N} has saved {k}. How much more does {N} need to save?",
      es: "Un juego cuesta {S}. {N} ha ahorrado {k}. ¿Cuánto más necesita ahorrar {N}?",
      what: ["the extra money needed", "el dinero extra que se necesita"],
    },
    {
      type: "need",
      v: "g",
      en: "{N} was {k} cm tall last year and is {S} cm tall now. How many centimeters did {N} grow?",
      es: "El año pasado {N} medía {k} cm y ahora mide {S} cm. ¿Cuántos centímetros creció {N}?",
      what: ["the centimeters grown", "los centímetros que creció"],
    },
    {
      type: "need",
      v: "p",
      en: "{N} needs {S} points to win. {N} has {k} points so far. How many more points does {N} need?",
      es: "{N} necesita {S} puntos para ganar. Hasta ahora {N} tiene {k} puntos. ¿Cuántos puntos más necesita {N}?",
      what: ["the points still needed", "los puntos que aún se necesitan"],
    },
    {
      type: "need",
      v: "f",
      en: "{S} students signed up for a trip. {k} have turned in their forms. How many forms are still missing?",
      es: "{S} estudiantes se inscribieron en un viaje. {k} ya entregaron su formulario. ¿Cuántos formularios faltan?",
      what: ["the forms still missing", "los formularios que faltan"],
    },
  ];
  const wholeItem = (rng, level) => {
    const cx = rng.pick(WHOLE);
    const N = rng.pick(NAMES);
    const decimal = level >= 3 && cx.money && rng.chance(0.5);
    const S = decimal
      ? rng.int(40, 120) + rng.pick([0, 0.25, 0.5, 0.75])
      : rng.int(level >= 4 ? 45 : 30, level >= 4 ? 160 : 90);
    const k = decimal
      ? clean(S - rng.int(8, 30) - rng.pick([0.25, 0.5, 0.75]))
      : S - rng.int(8, Math.min(40, S - 5));
    const u = clean(S - k);
    if (near(u, k) || near(u, S)) return wholeItem(rng, level);
    const pr = (n) => (cx.money ? `$${decimal ? n.toFixed(2) : n}` : fmt(n));
    const take = cx.type === "take";
    const eqTxt = take ? `${fmt(S)} − ${cx.v} = ${fmt(k)}` : `${fmt(k)} + ${cx.v} = ${fmt(S)}`;
    const fw = [
      [
        clean(S + k),
        "added-instead",
        [
          `You added ${fmt(S)} and ${fmt(k)}. Think about how the two numbers fit together: one is the whole and one is a part.`,
          `Sumaste ${fmt(S)} y ${fmt(k)}. Piensa en cómo encajan los dos números: uno es el todo y el otro es una parte.`,
        ],
      ],
      [
        k,
        "copied-number",
        [
          `${fmt(k)} is one of the numbers in the story, not the amount you are asked for.`,
          `${fmt(k)} es uno de los números de la historia, no la cantidad que se pide.`,
        ],
      ],
      [
        S,
        "copied-number",
        [
          `${fmt(S)} is one of the numbers in the story, not the amount you are asked for.`,
          `${fmt(S)} es uno de los números de la historia, no la cantidad que se pide.`,
        ],
      ],
    ]
      .filter(([n]) => n > 0 && !near(n, u))
      .map(([n, tag, fb]) => ({ v: fmt(n), f: fb[0], fEs: fb[1], tag }));
    const o = { N, S: pr(S), k: pr(k) };
    return G.num({
      q: `${fill(cx.en, o)}`,
      qEs: `${fill(cx.es, o)}`,
      a: fmt(u),
      fw,
      ...text({
        x: [
          `Let ${cx.v} stand for ${cx.what[0]}. ${take ? `The whole is ${fmt(S)} and ${fmt(k)} is what is left, so ${eqTxt}.` : `${fmt(k)} plus the missing part makes the whole ${fmt(S)}, so ${eqTxt}.`} ${take ? `Add ${fmt(k)} to both sides, or subtract: ${cx.v} = ${fmt(S)} − ${fmt(k)}` : `Subtract ${fmt(k)} from both sides: ${cx.v} = ${fmt(S)} − ${fmt(k)}`} = ${fmt(u)}.`,
          `Sea ${cx.v}: ${cx.what[1]}. ${take ? `El todo es ${fmt(S)} y ${fmt(k)} es lo que queda, así que ${eqTxt}.` : `${fmt(k)} más la parte que falta forma el todo ${fmt(S)}, así que ${eqTxt}.`} ${take ? `Suma ${fmt(k)} a ambos lados, o resta: ${cx.v} = ${fmt(S)} − ${fmt(k)}` : `Resta ${fmt(k)} de ambos lados: ${cx.v} = ${fmt(S)} − ${fmt(k)}`} = ${fmt(u)}.`,
        ],
        h: [
          [
            "Find the whole and the part you know. The unknown is the other part.",
            "Encuentra el todo y la parte que conoces. La incógnita es la otra parte.",
          ],
          [
            `Write an equation: ${take ? "whole − unknown = part left" : "part + unknown = whole"}.`,
            `Escribe una ecuación: ${take ? "todo − incógnita = parte que queda" : "parte + incógnita = todo"}.`,
          ],
          [
            `Which operation finds a missing part when you know the whole and the other part?`,
            `¿Qué operación encuentra una parte que falta cuando conoces el todo y la otra parte?`,
          ],
        ],
      }),
      meta: { kind: "whole", type: cx.type, S, k },
    });
  };

  G.register("solveAddSub", {
    title: "Solve with addition or subtraction",
    titleEs: "Resolver con suma o resta",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, AS_KINDS[level]);
      if (kind === "solve")
        return solveTyped(
          rng,
          level,
          level === 4 ? { forms: ADDSUB, flip: 0.6, dec: 0.3, frac: 0.2 } : { forms: ADDSUB },
        );
      if (kind === "step") return stepItem(rng, level, ADDSUB);
      if (kind === "inverse") return inverseItem(rng, level, ADDSUB);
      if (kind === "story") return storyTyped(rng, level, ADDSUB);
      if (kind === "model") return storyModelItem(rng, level, ADDSUB);
      if (kind === "whole") return wholeItem(rng, level);
      if (kind === "twoStage") return twoStageItem(rng);
      return sameSolutionItem(rng, ADDSUB);
    },
    check(item) {
      const m = item.meta;
      if (m.kind === "solve") {
        if (!item.q.includes(eqStr(m.e))) return "the stem lost its equation";
        // substitute the typed answer back into the printed equation (text route)
        const ok = holds(eqStr(m.e), m.e.v, G.value(item.a));
        return ok === true ? true : "typed answer does not satisfy the printed equation";
      }
      if (m.kind === "story")
        return near(lhs(m.e.f, m.e.p, G.value(item.a)), m.e.q)
          ? true
          : "answer fails the story equation";
      if (m.kind === "step") return stepCheck(item);
      if (m.kind === "inverse") return inverseCheck(item);
      if (m.kind === "model") return modelCheck(item);
      if (m.kind === "same") return sameCheck(item);
      if (m.kind === "whole") {
        const u = G.value(item.a);
        return m.type === "take"
          ? near(m.S - u, m.k) && u > 0
            ? true
            : "whole minus the answer is not the part left"
          : near(m.k + u, m.S) && u > 0
            ? true
            : "part plus the answer is not the whole";
      }
      if (m.kind === "twoStage") {
        const start = G.value(item.a);
        const [d1, d2] = m.ev;
        // run the story forward from the typed start
        return start + d1 >= 0 && near(start + d1 + d2, m.q)
          ? true
          : "running the story forward does not reach the end";
      }
      return `unknown kind ${m.kind}`;
    },
  });

  /* ====================================================================================================
   * 8-3  solveMulDiv
   * ================================================================================================== */
  const MULDIV = ["mul", "div"];
  const MD_KINDS = {
    1: [
      ["solve", 4],
      ["step", 2],
      ["inverse", 2],
      ["story", 2],
    ],
    2: [
      ["solve", 3],
      ["story", 3],
      ["model", 2],
      ["step", 1],
      ["inverse", 1],
    ],
    3: [
      ["solve", 4],
      ["story", 3],
      ["model", 1],
    ],
    4: [
      ["coef", 3],
      ["solve", 2],
      ["story", 2],
      ["same", 2],
    ],
  };
  /** (n/d)x = q with a whole-number solution */
  const fracCoefEq = (rng, v) => {
    const [n, d] = rng.pick([
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [2, 3],
      [3, 4],
      [2, 5],
      [3, 5],
      [3, 8],
    ]);
    const m = rng.int(2, 8);
    return makeEq("mul", v, n / d, d * m, { pd: `${n}/${d}` });
  };
  const COEF = [
    {
      en: "Each box holds {a} packs, and each pack has {b} pencils. There are {T} pencils in all.",
      es: "Cada caja tiene {a} paquetes y cada paquete tiene {b} lápices. Hay {T} lápices en total.",
      ask: ["How many boxes are there?", "¿Cuántas cajas hay?"],
      v: "n",
      what: ["the number of boxes", "el número de cajas"],
    },
    {
      en: "A pool fills {a} buckets each trip, and each bucket holds {b} liters. The pool needs {T} liters.",
      es: "Una piscina se llena con {a} cubetas por viaje y cada cubeta lleva {b} litros. La piscina necesita {T} litros.",
      ask: ["How many trips are needed?", "¿Cuántos viajes se necesitan?"],
      v: "t",
      what: ["the number of trips", "el número de viajes"],
    },
    {
      en: "A bakery puts {a} rows of {b} muffins on each tray. It baked {T} muffins.",
      es: "Una panadería pone {a} filas de {b} panecillos en cada bandeja. Horneó {T} panecillos.",
      ask: ["How many trays did it fill?", "¿Cuántas bandejas llenó?"],
      v: "b",
      what: ["the number of trays", "el número de bandejas"],
    },
    {
      en: "Each day {N} reads {a} chapters of {b} pages. {N} has read {T} pages.",
      es: "Cada día {N} lee {a} capítulos de {b} páginas. {N} ha leído {T} páginas.",
      ask: ["For how many days has {N} read?", "¿Durante cuántos días ha leído {N}?"],
      v: "d",
      what: ["the number of days", "el número de días"],
    },
    {
      en: "A classroom has {a} tables with {b} markers on each table. There are {T} markers in all.",
      es: "Un salón tiene {a} mesas con {b} marcadores en cada mesa. Hay {T} marcadores en total.",
      ask: ["How many classrooms are there?", "¿Cuántos salones hay?"],
      v: "k",
      what: ["the number of classrooms", "el número de salones"],
    },
  ];
  const coefItem = (rng) => {
    const cx = rng.pick(COEF);
    const N = rng.pick(NAMES);
    const a = rng.int(2, 9);
    let b = rng.int(2, 9);
    if (b === a) b = a === 9 ? 8 : a + 1;
    const n = rng.int(3, 12);
    if ([a, b, a * b].includes(n)) return coefItem(rng);
    const T = a * b * n;
    const o = { N, a, b, T };
    const fw = [
      [T / a, "used-one-factor"],
      [T / b, "used-one-factor"],
      [T * a * b, "multiplied-instead"],
    ]
      .filter(([v]) => Number.isInteger(v) && v !== n)
      .map(([v, tag]) => ({
        v: String(v),
        tag,
        f:
          tag === "used-one-factor"
            ? "You divided by only one of the two numbers. Both numbers multiply the unknown, so use them together."
            : "You multiplied, but the unknown is multiplied by a number already. Undo it with division.",
        fEs:
          tag === "used-one-factor"
            ? "Dividiste entre solo uno de los dos números. Ambos números multiplican a la incógnita, así que úsalos juntos."
            : "Multiplicaste, pero la incógnita ya está multiplicada por un número. Deshazlo con una división.",
      }));
    return G.num({
      q: `${fill(cx.en, o)} ${cx.ask[0].replace("{N}", N)}`,
      qEs: `${fill(cx.es, o)} ${cx.ask[1].replace("{N}", N)}`,
      a: String(n),
      fw,
      ...text({
        x: [
          `Let ${cx.v} stand for ${cx.what[0]}. Each one holds ${a} × ${b} = ${a * b}, so ${a * b}${cx.v} = ${T}. Divide both sides by ${a * b}: ${cx.v} = ${T} ÷ ${a * b} = ${n}.`,
          `Sea ${cx.v}: ${cx.what[1]}. Cada uno tiene ${a} × ${b} = ${a * b}, así que ${a * b}${cx.v} = ${T}. Divide ambos lados entre ${a * b}: ${cx.v} = ${T} ÷ ${a * b} = ${n}.`,
        ],
        h: [
          [
            "Two numbers multiply the unknown. Combine them into one number first.",
            "Dos números multiplican a la incógnita. Primero combínalos en un solo número.",
          ],
          [
            `Work out ${a} × ${b}. Then write ${a * b}${cx.v} = ${T}.`,
            `Calcula ${a} × ${b}. Luego escribe ${a * b}${cx.v} = ${T}.`,
          ],
          [
            `Division undoes multiplication. Divide ${T} by the combined number.`,
            `La división deshace la multiplicación. Divide ${T} entre el número combinado.`,
          ],
        ],
      }),
      meta: { kind: "coef", a, b, T },
    });
  };

  G.register("solveMulDiv", {
    title: "Solve with multiplication or division",
    titleEs: "Resolver con multiplicación o división",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, MD_KINDS[level]);
      if (kind === "solve") {
        if (level === 3 && rng.chance(0.3))
          return solveTyped(rng, 3, { e: fracCoefEq(rng, rng.pick(VARS)) });
        return solveTyped(
          rng,
          level,
          level === 4 ? { forms: MULDIV, flip: 0.6, dec: 0.6 } : { forms: MULDIV },
        );
      }
      if (kind === "step") return stepItem(rng, level, MULDIV);
      if (kind === "inverse") return inverseItem(rng, level, MULDIV);
      if (kind === "story") return storyTyped(rng, level, MULDIV);
      if (kind === "model") return storyModelItem(rng, level, MULDIV);
      if (kind === "coef") return coefItem(rng);
      return sameSolutionItem(rng, MULDIV);
    },
    check(item) {
      const m = item.meta;
      if (m.kind === "solve") {
        if (!item.q.includes(eqStr(m.e))) return "the stem lost its equation";
        return holds(eqStr(m.e), m.e.v, G.value(item.a)) === true
          ? true
          : "typed answer does not satisfy the printed equation";
      }
      if (m.kind === "story")
        return near(lhs(m.e.f, m.e.p, G.value(item.a)), m.e.q)
          ? true
          : "answer fails the story equation";
      if (m.kind === "step") return stepCheck(item);
      if (m.kind === "inverse") return inverseCheck(item);
      if (m.kind === "model") return modelCheck(item);
      if (m.kind === "same") return sameCheck(item);
      if (m.kind === "coef")
        return near(m.a * m.b * G.value(item.a), m.T)
          ? true
          : "answer fails the combined-factor equation";
      return `unknown kind ${m.kind}`;
    },
  });

  /* ====================================================================================================
   * Inequalities: symbols, phrases, number-line figures. Used by 8-4, 8-5 and 8-6.
   * ================================================================================================== */
  const SYM = { gt: ">", lt: "<", ge: "≥", le: "≤" };
  const OPP = { gt: "lt", lt: "gt", ge: "le", le: "ge" }; // pointing the other way
  const CNT = { gt: "ge", ge: "gt", lt: "le", le: "lt" }; // same way, other strictness
  const isUp = (s) => s === "gt" || s === "ge";
  const isStrict = (s) => s === "gt" || s === "lt";
  const inSet = (s, x, n) =>
    s === "gt" ? x > n : s === "lt" ? x < n : s === "ge" ? x >= n : x <= n;
  const ineqStr = (v, s, n) => `${v} ${SYM[s]} ${n}`;
  /** a number-line figure of the solutions of "v sym n": circle open for < and >, closed for ≤ and ≥ */
  const rayViz = (n, s) => {
    const min = Math.max(0, n - 7);
    return {
      t: "nline",
      min,
      max: min + 14,
      step: 1,
      ray: { from: n, dir: isUp(s) ? "right" : "left", open: isStrict(s) },
    };
  };
  const rayDesc = (s, n) => [
    `${isStrict(s) ? "Open" : "Closed"} circle at ${n}, shaded ${isUp(s) ? "right" : "left"}`,
    `Círculo ${isStrict(s) ? "abierto" : "cerrado"} en ${n}, sombreado a la ${isUp(s) ? "derecha" : "izquierda"}`,
  ];
  /** does a description such as "Open circle at 5, shaded right" include x? (a text route for check) */
  const descHolds = (txt, x) => {
    const m = /^(Open|Closed) circle at (\d+), shaded (right|left)$/.exec(txt);
    if (!m) return null;
    const n = Number(m[2]);
    if (x === n) return m[1] === "Closed";
    return m[3] === "right" ? x > n : x < n;
  };
  /** a wrong symbol, named by how it differs from the right one: [tag, [en, es]] */
  const symMistake = (right, other) => {
    if (other === CNT[right])
      return isStrict(right)
        ? [
            "boundary-included",
            [
              "This symbol lets the number itself count. Does the problem allow that?",
              "Este símbolo deja que el propio número cuente. ¿Lo permite el problema?",
            ],
          ]
        : [
            "boundary-excluded",
            [
              "This symbol leaves the number itself out. Does the problem let it count?",
              "Este símbolo deja fuera al propio número. ¿Deja el problema que cuente?",
            ],
          ];
    if (other === OPP[right])
      return [
        "reversed-symbol",
        [
          "The symbol points the wrong way. Which side of the number do the allowed values lie on?",
          "El símbolo apunta al lado equivocado. ¿De qué lado del número están los valores permitidos?",
        ],
      ];
    return [
      "reversed-and-boundary",
      [
        "Check two things: which side of the number the values are on, and whether the number itself counts.",
        "Revisa dos cosas: de qué lado del número están los valores y si el propio número cuenta.",
      ],
    ];
  };
  /** the three wrong choices for a symbol question; build(sym) -> {v, vEs?} */
  const symWrongs = (right, build) =>
    ["gt", "lt", "ge", "le"]
      .filter((s) => s !== right)
      .map((s) => {
        const [tag, fb] = symMistake(right, s);
        const b = build(s);
        return wr(b.v, fb, tag, b.vEs);
      });
  /** phrases: ok() is the meaning written as a test, a second encoding that check() trusts instead of sym */
  const PH = [
    { en: "more than", es: "más de", sym: "gt", ok: (x, n) => x > n },
    { en: "greater than", es: "mayor que", sym: "gt", ok: (x, n) => x > n },
    { en: "over", es: "más de", sym: "gt", ok: (x, n) => x > n },
    { en: "less than", es: "menos de", sym: "lt", count: false, ok: (x, n) => x < n },
    { en: "fewer than", es: "menos de", sym: "lt", count: true, ok: (x, n) => x < n },
    { en: "below", es: "por debajo de", sym: "lt", ok: (x, n) => x < n },
    { en: "at least", es: "al menos", sym: "ge", ok: (x, n) => x >= n },
    { en: "no less than", es: "no menos de", sym: "ge", count: false, ok: (x, n) => x >= n },
    { en: "no fewer than", es: "no menos de", sym: "ge", count: true, ok: (x, n) => x >= n },
    { en: "a minimum of", es: "un mínimo de", sym: "ge", ok: (x, n) => x >= n },
    { en: "at most", es: "como máximo", sym: "le", ok: (x, n) => x <= n },
    { en: "no more than", es: "no más de", sym: "le", ok: (x, n) => x <= n },
    { en: "a maximum of", es: "un máximo de", sym: "le", ok: (x, n) => x <= n },
  ];
  const BASIC = ["more than", "less than", "fewer than", "at least", "at most"];
  const phrasesFor = (sym, count, basic) =>
    PH.filter(
      (p) =>
        p.sym === sym &&
        (p.count === undefined || p.count === count) &&
        (!basic || BASIC.includes(p.en)),
    );
  const CTX = [
    {
      v: "t",
      count: false,
      en: "Today the temperature is {k} {n} degrees.",
      es: "Hoy la temperatura es {k} {n} grados.",
      what: ["the temperature in degrees", "la temperatura en grados"],
    },
    {
      v: "w",
      count: false,
      en: "The box weighs {k} {n} pounds.",
      es: "La caja pesa {k} {n} libras.",
      what: ["the weight in pounds", "el peso en libras"],
    },
    {
      v: "p",
      count: true,
      en: "The line has {k} {n} people.",
      es: "La fila tiene {k} {n} personas.",
      what: ["the number of people", "el número de personas"],
    },
    {
      v: "s",
      count: true,
      en: "The club has {k} {n} members.",
      es: "El club tiene {k} {n} miembros.",
      what: ["the number of members", "el número de miembros"],
    },
    {
      v: "m",
      count: false,
      en: "The video is {k} {n} minutes long.",
      es: "El video dura {k} {n} minutos.",
      what: ["the length in minutes", "la duración en minutos"],
    },
    {
      v: "c",
      count: false,
      en: "The trip costs {k} ${n}.",
      es: "El viaje cuesta {k} ${n}.",
      what: ["the cost in dollars", "el costo en dólares"],
    },
    {
      v: "g",
      count: true,
      en: "Mia's score is {k} {n} points.",
      es: "El puntaje de Mia es {k} {n} puntos.",
      what: ["the score in points", "el puntaje en puntos"],
    },
    {
      v: "h",
      count: false,
      en: "A rider is {k} {n} inches tall.",
      es: "Un pasajero mide {k} {n} pulgadas.",
      what: ["the height in inches", "la estatura en pulgadas"],
    },
  ];
  /** level 4 wording: negatives and unusual verbs. ok() again states the meaning independently of sym */
  const TRAPS = [
    {
      id: "t1",
      v: "a",
      sym: "ge",
      en: "You cannot be younger than {n}.",
      es: "No puedes ser menor de {n} años.",
      what: ["the age in years", "la edad en años"],
      ok: (x, n) => !(x < n),
    },
    {
      id: "t2",
      v: "p",
      sym: "le",
      en: "The sign says not more than {n} people.",
      es: "El letrero dice que no más de {n} personas.",
      what: ["the number of people", "el número de personas"],
      ok: (x, n) => !(x > n),
    },
    {
      id: "t3",
      v: "w",
      sym: "le",
      en: "A bag may not weigh more than {n} pounds.",
      es: "Una maleta no puede pesar más de {n} libras.",
      what: ["the weight in pounds", "el peso en libras"],
      ok: (x, n) => !(x > n),
    },
    {
      id: "t4",
      v: "g",
      sym: "ge",
      en: "The score must not be less than {n}.",
      es: "El puntaje no debe ser menor que {n}.",
      what: ["the score", "el puntaje"],
      ok: (x, n) => !(x < n),
    },
    {
      id: "t5",
      v: "h",
      sym: "ge",
      en: "Riders cannot be shorter than {n} inches.",
      es: "Los pasajeros no pueden medir menos de {n} pulgadas.",
      what: ["the height in inches", "la estatura en pulgadas"],
      ok: (x, n) => !(x < n),
    },
    {
      id: "t6",
      v: "k",
      sym: "le",
      en: "The load may not exceed {n} kilograms.",
      es: "La carga no puede superar los {n} kilogramos.",
      what: ["the load in kilograms", "la carga en kilogramos"],
      ok: (x, n) => !(x > n),
    },
    {
      id: "t7",
      v: "s",
      sym: "gt",
      en: "A team needs to score above {n} points.",
      es: "Un equipo necesita anotar más de {n} puntos.",
      what: ["the points scored", "los puntos anotados"],
      ok: (x, n) => x > n,
    },
    {
      id: "t8",
      v: "d",
      sym: "lt",
      en: "Prices must stay below {n} dollars.",
      es: "Los precios deben mantenerse por debajo de {n} dólares.",
      what: ["the price in dollars", "el precio en dólares"],
      ok: (x, n) => x < n,
    },
    {
      id: "t9",
      v: "n",
      sym: "ge",
      en: "A class has no fewer than {n} students.",
      es: "Una clase tiene no menos de {n} estudiantes.",
      what: ["the number of students", "el número de estudiantes"],
      ok: (x, n) => !(x < n),
    },
  ];
  /** @type {Map<string, (x: number, n: number) => boolean>} */
  const MEANING = new Map();
  for (const p of PH) MEANING.set(p.en, p.ok);
  for (const t of TRAPS) MEANING.set(t.id, t.ok);
  const keyOk = (k) => MEANING.get(k);

  /* ====================================================================================================
   * 8-4  writeInequality
   * ================================================================================================== */
  /** a sentence with a limit in it: {v, sym, key, n, en, es, what, ph?, trap?} */
  const situation = (rng, level, trap) => {
    const n = level === 1 ? rng.int(3, 20) : level === 2 ? rng.int(5, 60) : rng.int(10, 90);
    if (trap) {
      const t = rng.pick(TRAPS);
      return {
        v: t.v,
        sym: t.sym,
        key: t.id,
        n,
        en: fill(t.en, { n }),
        es: fill(t.es, { n }),
        what: t.what,
        trap: true,
      };
    }
    const cx = rng.pick(CTX);
    const sym = rng.pick(["gt", "lt", "ge", "le"]);
    const ph = rng.pick(phrasesFor(sym, cx.count, level === 1));
    return {
      v: cx.v,
      sym,
      key: ph.en,
      n,
      en: fill(cx.en, { k: ph.en, n }),
      es: fill(cx.es, { k: ph.es, n }),
      what: cx.what,
      ph,
      count: cx.count,
    };
  };
  const wiExplain = (s) => {
    const inc = !isStrict(s.sym);
    const phEn = s.trap ? "this wording" : `"${s.ph.en}"`;
    const phEs = s.trap ? "esta redacción" : `"${s.ph.es}"`;
    return [
      `${phEn[0].toUpperCase()}${phEn.slice(1)} means ${isUp(s.sym) ? "greater than" : "less than"}${inc ? " or equal to" : ""}. ${inc ? `${s.n} itself counts, so use ${SYM[s.sym]}` : `${s.n} itself does not count, so use ${SYM[s.sym]}`}: ${ineqStr(s.v, s.sym, s.n)}.`,
      `${phEs[0].toUpperCase()}${phEs.slice(1)} significa ${isUp(s.sym) ? "mayor que" : "menor que"}${inc ? " o igual a" : ""}. ${inc ? `El propio ${s.n} cuenta, así que usa ${SYM[s.sym]}` : `El propio ${s.n} no cuenta, así que usa ${SYM[s.sym]}`}: ${ineqStr(s.v, s.sym, s.n)}.`,
    ];
  };
  const wiHints = () => [
    [
      "Find the key words that tell you about the limit.",
      "Busca las palabras clave que te hablan del límite.",
    ],
    [
      "Ask: can the number itself be a match? If yes, the symbol needs an equal bar.",
      "Pregunta: ¿puede el propio número ser válido? Si es así, el símbolo necesita la barra de igual.",
    ],
    [
      "Then decide which way the allowed values go: bigger than the number, or smaller?",
      "Luego decide hacia dónde van los valores permitidos: ¿mayores que el número o menores?",
    ],
  ];
  const wiSymbolItem = (rng, level, write) => {
    const s = situation(rng, level, false);
    return mcx(rng, {
      q: write
        ? `${s.en} Which inequality shows the limit? Let ${s.v} stand for ${s.what[0]}.`
        : `${s.en} Which symbol makes ${s.v} ___ ${s.n} match the sentence?`,
      qEs: write
        ? `${s.es} ¿Qué desigualdad muestra el límite? Sea ${s.v}: ${s.what[1]}.`
        : `${s.es} ¿Qué símbolo hace que ${s.v} ___ ${s.n} coincida con la oración?`,
      right: write ? ineqStr(s.v, s.sym, s.n) : SYM[s.sym],
      wrong: symWrongs(s.sym, (o) => ({ v: write ? ineqStr(s.v, o, s.n) : SYM[o] })),
      ...text({ x: wiExplain(s), h: wiHints() }),
      meta: { kind: write ? "write" : "sym", v: s.v, n: s.n, k: s.key },
    });
  };
  const wiTrapItem = (rng) => {
    const s = situation(rng, 4, true);
    return mcx(rng, {
      q: `${s.en} Which inequality shows the allowed values? Let ${s.v} stand for ${s.what[0]}.`,
      qEs: `${s.es} ¿Qué desigualdad muestra los valores permitidos? Sea ${s.v}: ${s.what[1]}.`,
      right: ineqStr(s.v, s.sym, s.n),
      wrong: symWrongs(s.sym, (o) => ({ v: ineqStr(s.v, o, s.n) })),
      ...text({
        x: wiExplain(s),
        h: [
          [
            "Say the sentence in your own words without the word not or cannot.",
            "Di la oración con tus propias palabras sin la palabra no o cannot.",
          ],
          [
            "Which values are allowed? Is the number itself one of them?",
            "¿Qué valores se permiten? ¿Es el propio número uno de ellos?",
          ],
          wiHints()[2],
        ],
      }),
      meta: { kind: "write", v: s.v, n: s.n, k: s.key },
    });
  };
  const graphMistake = (right, other) => {
    const [tag] = symMistake(right, other);
    if (other === CNT[right])
      return [
        tag,
        [
          "Look at the circle: open means the number itself is not included, closed means it is.",
          "Mira el círculo: abierto significa que el propio número no se incluye, cerrado que sí.",
        ],
      ];
    if (other === OPP[right])
      return [
        tag,
        [
          "Look at the shading: it must cover the values the situation allows.",
          "Mira el sombreado: debe cubrir los valores que permite la situación.",
        ],
      ];
    return [
      tag,
      ["Check both the circle and the shading.", "Revisa tanto el círculo como el sombreado."],
    ];
  };
  const wiGraphItem = (rng, level) => {
    const s = situation(rng, level, false);
    const d = rayDesc(s.sym, s.n);
    return mcx(rng, {
      q: `${s.en} Which description tells how to graph the allowed values of ${s.v} on a number line?`,
      qEs: `${s.es} ¿Qué descripción dice cómo graficar en una recta numérica los valores permitidos de ${s.v}?`,
      right: { v: d[0], vEs: d[1] },
      wrong: ["gt", "lt", "ge", "le"]
        .filter((o) => o !== s.sym)
        .map((o) => {
          const [tag, fb] = graphMistake(s.sym, o);
          const dd = rayDesc(o, s.n);
          return wr(dd[0], fb, tag, dd[1]);
        }),
      ...text({
        x: [
          `${wiExplain(s)[0]} On the graph: ${d[0].toLowerCase()}.`,
          `${wiExplain(s)[1]} En la gráfica: ${d[1].toLowerCase()}.`,
        ],
        h: [
          wiHints()[0],
          [
            "An open circle means the number is not included. A closed circle means it is.",
            "Un círculo abierto significa que el número no se incluye. Uno cerrado significa que sí.",
          ],
          [
            "Shade toward the values the situation allows.",
            "Sombrea hacia los valores que permite la situación.",
          ],
        ],
      }),
      meta: { kind: "graph", v: s.v, n: s.n, k: s.key },
    });
  };
  const wiBoundItem = (rng, level) => {
    const s = situation(rng, level, level === 4);
    const up = isUp(s.sym);
    const ans = s.sym === "gt" ? s.n + 1 : s.sym === "lt" ? s.n - 1 : s.n;
    const fw = (
      isStrict(s.sym)
        ? [
            [
              s.n,
              "boundary-included",
              [
                "The limit itself does not count here, so it cannot be the answer.",
                "El límite en sí no cuenta aquí, así que no puede ser la respuesta.",
              ],
            ],
          ]
        : [
            [
              up ? s.n + 1 : s.n - 1,
              "boundary-excluded",
              [
                "The limit itself counts here, so something closer is allowed.",
                "El límite en sí cuenta aquí, así que se permite algo más cercano.",
              ],
            ],
          ]
    ).map(([v, tag, f]) => ({ v: String(v), tag, f: f[0], fEs: f[1] }));
    return G.num({
      q: `${s.en} What is the ${up ? "smallest" : "largest"} whole number ${s.v} can be?`,
      qEs: `${s.es} ¿Cuál es el número entero ${up ? "más pequeño" : "más grande"} que ${s.v} puede ser?`,
      a: String(ans),
      fw,
      ...text({
        x: [
          `${wiExplain(s)[0]} The ${up ? "smallest" : "largest"} whole number allowed is ${ans}.`,
          `${wiExplain(s)[1]} El número entero ${up ? "más pequeño" : "más grande"} permitido es ${ans}.`,
        ],
        h: [
          wiHints()[0],
          wiHints()[1],
          [
            "Write the inequality, then test the number itself and the whole number next to it.",
            "Escribe la desigualdad y prueba el propio número y el número entero contiguo.",
          ],
        ],
      }),
      meta: { kind: "bound", v: s.v, n: s.n, k: s.key, up },
    });
  };
  const wiBackItem = (rng) => {
    const sym = rng.pick(["gt", "lt", "ge", "le"]);
    const n = rng.int(10, 90);
    const v = rng.pick(VARS);
    const count = rng.chance(0.5);
    const say = (s) => {
      const p = rng.pick(phrasesFor(s, count, false));
      return { v: `${p.en} ${n}`, vEs: `${p.es} ${n}` };
    };
    const right = say(sym);
    return mcx(rng, {
      q: `Which phrase means the same as ${ineqStr(v, sym, n)}?`,
      qEs: `¿Qué frase significa lo mismo que ${ineqStr(v, sym, n)}?`,
      right,
      wrong: symWrongs(sym, (o) => say(o)),
      ...text({
        x: [
          `${SYM[sym]} means ${isUp(sym) ? "greater than" : "less than"}${isStrict(sym) ? "" : " or equal to"}. So ${ineqStr(v, sym, n)} is the same as "${right.v}".`,
          `${SYM[sym]} significa ${isUp(sym) ? "mayor que" : "menor que"}${isStrict(sym) ? "" : " o igual a"}. Entonces ${ineqStr(v, sym, n)} es lo mismo que "${right.vEs}".`,
        ],
        h: [
          ["Read the symbol out loud in words.", "Lee el símbolo en voz alta con palabras."],
          [
            "Does the symbol have an equal bar? That tells you whether the number itself counts.",
            "¿Tiene el símbolo la barra de igual? Eso te dice si el propio número cuenta.",
          ],
          wiHints()[2],
        ],
      }),
      meta: { kind: "back", v, n, sym },
    });
  };
  /** text of an option -> does x satisfy it, using the evaluator or the description reader */
  const WI_KINDS = {
    1: [
      ["sym", 5],
      ["write", 5],
    ],
    2: [
      ["write", 5],
      ["sym", 2],
      ["bound", 3],
    ],
    3: [
      ["graph", 4],
      ["bound", 3],
      ["write", 3],
    ],
    4: [
      ["trap", 4],
      ["back", 3],
      ["bound", 3],
    ],
  };
  G.register("writeInequality", {
    title: "Write an inequality",
    titleEs: "Escribir una desigualdad",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, WI_KINDS[level]);
      if (kind === "sym") return wiSymbolItem(rng, level, false);
      if (kind === "write") return wiSymbolItem(rng, level, true);
      if (kind === "trap") return wiTrapItem(rng);
      if (kind === "graph") return wiGraphItem(rng, level);
      if (kind === "bound") return wiBoundItem(rng, level);
      return wiBackItem(rng);
    },
    check(item) {
      const m = item.meta;
      const xs = range(0, 3 * m.n + 3);
      if (m.kind === "bound") {
        const ok = keyOk(m.k);
        const set = xs.filter((x) => ok(x, m.n));
        const want = m.up ? set[0] : set[set.length - 1];
        return near(G.value(item.a), want)
          ? true
          : "typed bound is not the extreme allowed whole number";
      }
      let truth;
      if (m.kind === "back") {
        truth = (c) => {
          const p = PH.find((q) => c.startsWith(`${q.en} `));
          return p ? xs.map((x) => p.ok(x, m.n) === inSet(m.sym, x, m.n)).every(Boolean) : false;
        };
      } else {
        const ok = keyOk(m.k);
        const want = xs.map((x) => ok(x, m.n));
        if (m.kind === "graph") truth = (c) => xs.every((x, i) => descHolds(c, x) === want[i]);
        else if (m.kind === "sym")
          truth = (c) => xs.every((x, i) => holds(`${x} ${c} ${m.n}`, m.v, x) === want[i]);
        else truth = (c) => xs.every((x, i) => holds(c, m.v, x) === want[i]);
      }
      const good = item.c.map(truth);
      if (good.filter(Boolean).length !== 1)
        return `${good.filter(Boolean).length} choices match the meaning`;
      return good[item.a] ? true : "keyed choice does not match the meaning";
    },
  });

  /* ====================================================================================================
   * 8-5  ineqSolutionCheck
   * ================================================================================================== */
  const subHints = (v, s, n) => [
    [
      "A solution is a value that makes the inequality a true statement.",
      "Una solución es un valor que hace verdadero el enunciado de la desigualdad.",
    ],
    [
      `Replace ${v} with the value and read the statement out loud.`,
      `Reemplaza ${v} por el valor y lee el enunciado en voz alta.`,
    ],
    [
      `Ask whether the number ${n} itself counts: look at the symbol ${SYM[s]}.`,
      `Pregunta si el propio número ${n} cuenta: mira el símbolo ${SYM[s]}.`,
    ],
  ];
  const ynMistake = (right, other) => {
    const [tag] = symMistake(right, other);
    const fb =
      other === CNT[right]
        ? [
            "Test the symbol that is written, not a similar one. The equal bar decides whether the number itself counts.",
            "Prueba el símbolo que está escrito, no uno parecido. La barra de igual decide si el propio número cuenta.",
          ]
        : other === OPP[right]
          ? [
              "Test the symbol that is written. It points the other way from the one you used.",
              "Prueba el símbolo que está escrito. Apunta al lado contrario del que usaste.",
            ]
          : [
              "Test the symbol that is written: both its direction and its equal bar matter.",
              "Prueba el símbolo que está escrito: importan su dirección y su barra de igual.",
            ];
    return [tag, fb];
  };
  const claimIneq = (s, val, n) => {
    const t = inSet(s, val, n);
    return {
      v: `${t ? "Yes" : "No"}, because ${val} ${SYM[s]} ${n} is ${t ? "true" : "false"}.`,
      vEs: `${t ? "Sí" : "No"}, porque ${val} ${SYM[s]} ${n} es ${t ? "verdadero" : "falso"}.`,
    };
  };
  const iscYesNo = (rng, level) => {
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const n = level === 1 ? rng.int(4, 15) : rng.int(5, 40);
    const v = rng.pick(VARS);
    const r = rng.next();
    const val = r < 0.4 ? n : r < 0.7 ? n + rng.int(1, 3) : n - rng.int(1, 3);
    const t = inSet(s, val, n);
    return mcx(rng, {
      q: `Is ${v} = ${val} a solution of ${ineqStr(v, s, n)}?`,
      qEs: `¿Es ${v} = ${val} una solución de ${ineqStr(v, s, n)}?`,
      right: claimIneq(s, val, n),
      wrong: ["gt", "lt", "ge", "le"]
        .filter((o) => o !== s)
        .map((o) => {
          const [tag, fb] = ynMistake(s, o);
          const c = claimIneq(o, val, n);
          return wr(c.v, fb, tag, c.vEs);
        }),
      ...text({
        x: [
          `Substitute ${v} = ${val}: ${val} ${SYM[s]} ${n} is ${t ? "true" : "false"}. So ${val} ${t ? "IS" : "is NOT"} a solution.${val === n ? ` The boundary ${n} ${isStrict(s) ? "does not count for" : "counts for"} ${SYM[s]}.` : ""}`,
          `Sustituye ${v} = ${val}: ${val} ${SYM[s]} ${n} es ${t ? "verdadero" : "falso"}. Entonces ${val} ${t ? "SÍ" : "NO"} es una solución.${val === n ? ` El límite ${n} ${isStrict(s) ? "no cuenta para" : "cuenta para"} ${SYM[s]}.` : ""}`,
        ],
        h: subHints(v, s, n),
      }),
      meta: { kind: "yn", v, s, n, val },
    });
  };
  /** a value in the solution set, 1..6 steps from the boundary (or the boundary itself when it counts) */
  const inValue = (rng, s, n, allowBoundary) => {
    if (allowBoundary && !isStrict(s) && rng.chance(0.45)) return n;
    return isUp(s) ? n + rng.int(1, 6) : Math.max(0, n - rng.int(1, 6));
  };
  const outValues = (s, n) => {
    const out = [];
    for (const k of [0, 1, 2, 3, 4, 5])
      for (const x of isUp(s) ? [n - k] : [n + k])
        if (x >= 0 && !inSet(s, x, n) && !out.includes(x)) out.push(x);
    return out;
  };
  const outFb = (s, n, x) =>
    x === n
      ? [
          "boundary-included",
          [
            `The boundary ${n} does not count for ${SYM[s]}: ${x} ${SYM[s]} ${n} is false.`,
            `El límite ${n} no cuenta para ${SYM[s]}: ${x} ${SYM[s]} ${n} es falso.`,
          ],
        ]
      : [
          "reversed-direction",
          [
            `Substitute ${x}: ${x} ${SYM[s]} ${n} is false. The solutions lie on the other side of ${n}.`,
            `Sustituye ${x}: ${x} ${SYM[s]} ${n} es falso. Las soluciones están al otro lado de ${n}.`,
          ],
        ];
  const iscPick = (rng, level) => {
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const n = rng.int(level === 1 ? 4 : 5, level === 1 ? 15 : 40);
    const v = rng.pick(VARS);
    const key = inValue(rng, s, n, level >= 2);
    const wrong = outValues(s, n).map((x) => {
      const [tag, fb] = outFb(s, n, x);
      return wr(String(x), fb, tag);
    });
    return mcx(rng, {
      q: `Which value is a solution of ${ineqStr(v, s, n)}?`,
      qEs: `¿Qué valor es una solución de ${ineqStr(v, s, n)}?`,
      right: String(key),
      wrong,
      ...text({
        x: [
          `${key} ${SYM[s]} ${n} is true, so ${key} is a solution.${key === n ? ` The boundary counts because ${SYM[s]} includes it.` : ""}`,
          `${key} ${SYM[s]} ${n} es verdadero, así que ${key} es una solución.${key === n ? ` El límite cuenta porque ${SYM[s]} lo incluye.` : ""}`,
        ],
        h: subHints(v, s, n),
      }),
      meta: { kind: "pick", v, s, n },
    });
  };
  const iscList = (rng, level) => {
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const n = rng.int(6, 40);
    const v = rng.pick(VARS);
    const fmtList = (a) => [...a].sort((x, y) => x - y).join(", ");
    const ins = (cnt, boundary) => {
      const set = new Set();
      if (boundary && !isStrict(s)) set.add(n);
      while (set.size < cnt) set.add(inValue(rng, s, n, false));
      return [...set];
    };
    const key = ins(3, level >= 3 && rng.chance(0.5));
    const outs = outValues(s, n);
    const a = ins(2, false).concat([outs[0]]); // boundary or the nearest wrong value
    const b = [outs[1], outs[2], outs[3]];
    const c = ins(2, false).concat([outs[outs.length - 1]]);
    const mk = (arr, i) => {
      const bad = arr.find((x) => !inSet(s, x, n));
      const [tag, fb] = outFb(s, n, bad);
      return wr(fmtList(arr), fb, i === 1 ? "reversed-direction" : tag);
    };
    return mcx(rng, {
      q: `Which list has only solutions of ${ineqStr(v, s, n)}?`,
      qEs: `¿Qué lista tiene solo soluciones de ${ineqStr(v, s, n)}?`,
      right: fmtList(key),
      wrong: [mk(a, 0), mk(b, 1), mk(c, 2)],
      ...text({
        x: [
          `Every number in ${fmtList(key)} makes ${ineqStr(v, s, n)} true. Each other list has a number that makes it false.`,
          `Cada número de ${fmtList(key)} hace verdadera ${ineqStr(v, s, n)}. Cada otra lista tiene un número que la hace falsa.`,
        ],
        h: subHints(v, s, n),
      }),
      meta: { kind: "list", v, s, n },
    });
  };
  const iscNot = (rng) => {
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const n = rng.int(6, 40);
    const v = rng.pick(VARS);
    const outs = outValues(s, n);
    const key = outs[rng.int(0, 1)];
    const ins = new Set();
    if (!isStrict(s)) ins.add(n);
    while (ins.size < 3) ins.add(inValue(rng, s, n, false));
    const wrong = [...ins].map((x) =>
      wr(
        String(x),
        [
          `${x} ${SYM[s]} ${n} is true, so ${x} IS a solution. The question asks for the value that is not.`,
          `${x} ${SYM[s]} ${n} es verdadero, así que ${x} SÍ es una solución. La pregunta pide el valor que no lo es.`,
        ],
        "missed-the-not",
      ),
    );
    return mcx(rng, {
      q: `Which value is NOT a solution of ${ineqStr(v, s, n)}?`,
      qEs: `¿Qué valor NO es una solución de ${ineqStr(v, s, n)}?`,
      right: String(key),
      wrong,
      ...text({
        x: [
          `${key} ${SYM[s]} ${n} is false, so ${key} is not a solution. The other three make the statement true.`,
          `${key} ${SYM[s]} ${n} es falso, así que ${key} no es una solución. Los otros tres hacen verdadero el enunciado.`,
        ],
        h: [
          [
            "Read the question carefully: you are looking for the value that fails.",
            "Lee bien la pregunta: buscas el valor que falla.",
          ],
          subHints(v, s, n)[1],
          subHints(v, s, n)[2],
        ],
      }),
      meta: { kind: "not", v, s, n },
    });
  };
  const iscGraph = (rng, level) => {
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const n = rng.int(7, 40);
    const key = inValue(rng, s, n, true);
    const wrong = outValues(s, n).map((x) => {
      const [tag] = outFb(s, n, x);
      const open = isStrict(s);
      return wr(
        String(x),
        x === n
          ? [
              `The circle at ${n} is open, so ${n} itself is not a solution.`,
              `El círculo en ${n} está abierto, así que el propio ${n} no es una solución.`,
            ]
          : [
              `${x} is not under the shaded part of the graph.`,
              `${x} no está bajo la parte sombreada de la gráfica.`,
            ],
        open || x !== n ? tag : tag,
      );
    });
    return mcx(rng, {
      q: "The graph shows all the solutions of an inequality. Which value is a solution?",
      qEs: "La gráfica muestra todas las soluciones de una desigualdad. ¿Qué valor es una solución?",
      right: String(key),
      wrong,
      viz: rayViz(n, s),
      ...text({
        x: [
          `${key} is in the shaded part${key === n ? ", and the closed circle includes the boundary" : ""}. It makes the inequality true.`,
          `${key} está en la parte sombreada${key === n ? " y el círculo cerrado incluye el límite" : ""}. Hace verdadera la desigualdad.`,
        ],
        h: [
          [
            "Shaded values are solutions. A closed circle includes its number; an open circle does not.",
            "Los valores sombreados son soluciones. Un círculo cerrado incluye su número; uno abierto no.",
          ],
          ["Find each choice on the number line.", "Ubica cada opción en la recta numérica."],
          [
            "Is the choice under the shading, or on the circle?",
            "¿La opción está bajo el sombreado o sobre el círculo?",
          ],
        ],
      }),
      meta: { kind: "graph", level, n, s },
    });
  };
  const iscExtreme = (rng) => {
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const n = rng.int(6, 60);
    const v = rng.pick(VARS);
    const up = isUp(s);
    const ans = s === "gt" ? n + 1 : s === "lt" ? n - 1 : n;
    const alt = isStrict(s) ? n : up ? n + 1 : n - 1;
    return G.num({
      q: `What is the ${up ? "smallest" : "largest"} whole number that is a solution of ${ineqStr(v, s, n)}?`,
      qEs: `¿Cuál es el número entero ${up ? "más pequeño" : "más grande"} que es solución de ${ineqStr(v, s, n)}?`,
      a: String(ans),
      fw: [
        {
          v: String(alt),
          tag: isStrict(s) ? "boundary-included" : "boundary-excluded",
          f: isStrict(s)
            ? `${n} ${SYM[s]} ${n} is false, so the boundary is not a solution.`
            : `The boundary ${n} makes ${SYM[s]} true, so something closer is allowed.`,
          fEs: isStrict(s)
            ? `${n} ${SYM[s]} ${n} es falso, así que el límite no es una solución.`
            : `El límite ${n} hace verdadero ${SYM[s]}, así que se permite algo más cercano.`,
        },
      ],
      ...text({
        x: [
          `${isStrict(s) ? `${n} does not count, so the ${up ? "smallest" : "largest"} whole number is ${ans}.` : `${n} counts, so it is the ${up ? "smallest" : "largest"} whole number.`}`,
          `${isStrict(s) ? `${n} no cuenta, así que el número entero ${up ? "más pequeño" : "más grande"} es ${ans}.` : `${n} cuenta, así que es el número entero ${up ? "más pequeño" : "más grande"}.`}`,
        ],
        h: [
          subHints(v, s, n)[0],
          [
            "Start at the boundary number. Does it make the statement true?",
            "Empieza en el número límite. ¿Hace verdadero el enunciado?",
          ],
          [
            "If it does not, move one whole number toward the solutions and test again.",
            "Si no, avanza un número entero hacia las soluciones y vuelve a probar.",
          ],
        ],
      }),
      meta: { kind: "extreme", v, s, n, up },
    });
  };
  const iscCount = (rng) => {
    const R = rng.pick([20, 30]);
    const v = rng.pick(VARS);
    const compound = rng.chance(0.45);
    if (compound) {
      const a = rng.int(2, 8);
      const b = rng.int(a + 5, R - 3);
      const s1 = rng.pick(["gt", "ge"]);
      const s2 = rng.pick(["lt", "le"]);
      const ans = (s2 === "lt" ? b - 1 : b) - (s1 === "gt" ? a + 1 : a) + 1;
      return G.num({
        q: `How many whole numbers from 0 to ${R} are solutions of both ${ineqStr(v, s1, a)} and ${ineqStr(v, s2, b)}?`,
        qEs: `¿Cuántos números enteros de 0 a ${R} son soluciones de ${ineqStr(v, s1, a)} y de ${ineqStr(v, s2, b)} a la vez?`,
        a: String(ans),
        fw: [
          {
            v: String(ans + 1),
            tag: "counted-boundary",
            f: "Check each boundary: does it make its statement true? Count only numbers that work in both.",
            fEs: "Revisa cada límite: ¿hace verdadero su enunciado? Cuenta solo los números que sirven en ambas.",
          },
          {
            v: String(ans - 1),
            tag: "forgot-boundary",
            f: "Check each boundary: one that counts must be included in your list.",
            fEs: "Revisa cada límite: el que cuenta debe estar en tu lista.",
          },
        ],
        ...text({
          x: [
            `The numbers that work in both run from ${s1 === "gt" ? a + 1 : a} to ${s2 === "lt" ? b - 1 : b}. Counting both ends gives ${ans} numbers.`,
            `Los números que sirven en ambas van de ${s1 === "gt" ? a + 1 : a} a ${s2 === "lt" ? b - 1 : b}. Contando ambos extremos hay ${ans} números.`,
          ],
          h: [
            [
              "A number must make BOTH statements true.",
              "Un número debe hacer verdaderos AMBOS enunciados.",
            ],
            [
              "Find the smallest and the largest whole number that work. Test each boundary.",
              "Halla el número entero más pequeño y el más grande que sirven. Prueba cada límite.",
            ],
            [
              "Count every whole number from the smallest to the largest, including both.",
              "Cuenta cada número entero desde el más pequeño hasta el más grande, incluyendo ambos.",
            ],
          ],
        }),
        meta: {
          kind: "count",
          v,
          R,
          parts: [
            [v, s1, a],
            [v, s2, b],
          ],
        },
      });
    }
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const n = rng.int(4, R - 4);
    const ans = s === "ge" ? R - n + 1 : s === "gt" ? R - n : s === "le" ? n + 1 : n;
    return G.num({
      q: `How many whole numbers from 0 to ${R} are solutions of ${ineqStr(v, s, n)}?`,
      qEs: `¿Cuántos números enteros de 0 a ${R} son soluciones de ${ineqStr(v, s, n)}?`,
      a: String(ans),
      fw: [
        {
          v: String(isStrict(s) ? ans + 1 : ans - 1),
          tag: isStrict(s) ? "counted-boundary" : "forgot-boundary",
          f: isStrict(s)
            ? `Does ${n} itself make ${SYM[s]} true? Check before you count it.`
            : `Does ${n} itself make ${SYM[s]} true? If it does, it belongs in the count.`,
          fEs: isStrict(s)
            ? `¿El propio ${n} hace verdadero ${SYM[s]}? Revisa antes de contarlo.`
            : `¿El propio ${n} hace verdadero ${SYM[s]}? Si es así, pertenece al conteo.`,
        },
      ],
      ...text({
        x: [
          `The solutions run from ${isUp(s) ? (s === "gt" ? n + 1 : n) : 0} to ${isUp(s) ? R : s === "lt" ? n - 1 : n}. Counting both ends gives ${ans} numbers.`,
          `Las soluciones van de ${isUp(s) ? (s === "gt" ? n + 1 : n) : 0} a ${isUp(s) ? R : s === "lt" ? n - 1 : n}. Contando ambos extremos hay ${ans} números.`,
        ],
        h: [
          subHints(v, s, n)[0],
          [
            "Find the first and the last whole number that work. Test the boundary.",
            "Halla el primer y el último número entero que sirven. Prueba el límite.",
          ],
          [
            "Count every whole number from the first to the last, including both.",
            "Cuenta cada número entero del primero al último, incluyendo ambos.",
          ],
        ],
      }),
      meta: { kind: "count", v, R, parts: [[v, s, n]] },
    });
  };
  const ISC_KINDS = {
    1: [
      ["yn", 4],
      ["pick", 4],
      ["graph", 2],
    ],
    2: [
      ["yn", 3],
      ["pick", 3],
      ["list", 2],
      ["not", 2],
      ["graph", 2],
    ],
    3: [
      ["list", 2],
      ["not", 2],
      ["graph", 3],
      ["extreme", 3],
    ],
    4: [
      ["count", 4],
      ["extreme", 2],
      ["graph", 2],
      ["list", 2],
    ],
  };
  const rayHolds = (ray, x) =>
    x === ray.from ? !ray.open : ray.dir === "right" ? x > ray.from : x < ray.from;
  G.register("ineqSolutionCheck", {
    title: "Is it a solution of the inequality?",
    titleEs: "¿Es solución de la desigualdad?",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, ISC_KINDS[level]);
      if (kind === "yn") return iscYesNo(rng, level);
      if (kind === "pick") return iscPick(rng, level);
      if (kind === "list") return iscList(rng, level);
      if (kind === "not") return iscNot(rng);
      if (kind === "graph") return iscGraph(rng, level);
      if (kind === "extreme") return iscExtreme(rng);
      return iscCount(rng);
    },
    check(item) {
      const m = item.meta;
      const st = (s, n) => ineqStr(m.v, s, n);
      if (m.kind === "yn") {
        const truth = holds(st(m.s, m.n), m.v, m.val);
        const good = item.c.map((c) => {
          const r = /^(Yes|No), because (\d+) ([<>≤≥]) (\d+) is (true|false)\.$/.exec(c);
          if (!r || r[3] !== SYM[m.s] || Number(r[2]) !== m.val || Number(r[4]) !== m.n)
            return false;
          return (
            holds(`${r[2]} ${r[3]} ${r[4]}`, m.v, 0) === (r[5] === "true") &&
            (r[1] === "Yes") === truth
          );
        });
        return good.filter(Boolean).length === 1 && good[item.a]
          ? true
          : "claims do not single out the keyed choice";
      }
      if (m.kind === "pick" || m.kind === "not") {
        const ok = item.c.map((c) => holds(st(m.s, m.n), m.v, Number(c)));
        const want = m.kind === "pick";
        const hit = ok.filter((o) => o === want).length;
        return hit === 1 && ok[item.a] === want
          ? true
          : "the keyed value is not the only one that fits";
      }
      if (m.kind === "list") {
        const ok = item.c.map((c) =>
          c.split(", ").every((x) => holds(st(m.s, m.n), m.v, Number(x))),
        );
        return ok.filter(Boolean).length === 1 && ok[item.a]
          ? true
          : "the keyed list is not the only all-solutions list";
      }
      if (m.kind === "graph") {
        const ray = item.viz.ray;
        const ok = item.c.map((c) => rayHolds(ray, Number(c)));
        const again =
          ray.from === m.n &&
          ray.open === isStrict(m.s) &&
          ray.dir === (isUp(m.s) ? "right" : "left");
        return again && ok.filter(Boolean).length === 1 && ok[item.a]
          ? true
          : "the figure and the choices disagree";
      }
      if (m.kind === "extreme") {
        const set = range(0, 3 * m.n).filter((x) => holds(st(m.s, m.n), m.v, x));
        return near(G.value(item.a), m.up ? set[0] : set[set.length - 1])
          ? true
          : "typed value is not the extreme solution";
      }
      const n = range(0, m.R).filter((x) =>
        m.parts.every(([v, s, k]) => holds(ineqStr(v, s, k), v, x)),
      ).length;
      return near(G.value(item.a), n) ? true : "typed count disagrees with the enumeration";
    },
  });

  /* ====================================================================================================
   * 8-6  solveInequality
   * ================================================================================================== */
  /** an inequality with a whole-number boundary: {e, s, txt, b, v} where txt is e.g. "x + 6 > 14" */
  const ineqOf = (rng, level, forms) => {
    const f = rng.pick(forms);
    const e = intEq(rng, f, rng.pick(VARS), Math.min(level, 2));
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const b = clean(inv(e.f, e.p, e.q));
    return { e, s, b, v: e.v, txt: `${sideStr(e)} ${SYM[s]} ${e.qd}` };
  };
  const ineqLine = (q) => {
    const [en, es] = solveLine(q.e);
    const sym = SYM[q.s];
    const note = isStrict(q.s)
      ? [`${q.b} itself is not a solution.`, `El propio ${q.b} no es una solución.`]
      : [`${q.b} itself is a solution.`, `El propio ${q.b} sí es una solución.`];
    const swap = (t) => t.replace(`${q.v} = `, `${q.v} ${sym} `);
    return [`${swap(en)} ${note[0]}`, `${swap(es)} ${note[1]}`];
  };
  const siLadder = (q) => [
    [
      `Solve it like an equation first. ${doesTo(q.e)[0]}`,
      `Resuélvela primero como una ecuación. ${doesTo(q.e)[1]}`,
    ],
    [
      `${undoes(q.e)[0]} Do it to both sides. The inequality symbol stays the same.`,
      `${undoes(q.e)[1]} Hazlo en ambos lados. El símbolo de desigualdad no cambia.`,
    ],
    firstStep(q.e),
  ];
  const siSolveItem = (rng, level, forms) => {
    const q = ineqOf(rng, level, forms);
    const { s, b, v } = q;
    const slip = inverseSlips(q.e).find((x) => x.val > 0 && !near(x.val, b));
    const wrong = [
      wr(
        `${v} ${SYM[OPP[s]]} ${b}`,
        [
          "The boundary is right, but the symbol turned around. Adding, subtracting, multiplying or dividing by a positive number keeps the direction.",
          "El límite es correcto, pero el símbolo se volteó. Sumar, restar, multiplicar o dividir entre un número positivo mantiene la dirección.",
        ],
        "flipped-symbol",
      ),
      wr(
        `${v} = ${b}`,
        [
          "An inequality has many solutions, not just one number. Keep the inequality symbol.",
          "Una desigualdad tiene muchas soluciones, no solo un número. Conserva el símbolo de desigualdad.",
        ],
        "treated-as-equation",
      ),
      wr(
        `${v} ${SYM[CNT[s]]} ${b}`,
        [
          "The boundary is right, but check the equal bar: does the boundary itself make the original true?",
          "El límite es correcto, pero revisa la barra de igual: ¿hace verdadero el original el propio límite?",
        ],
        isStrict(s) ? "boundary-included" : "boundary-excluded",
      ),
      slip && wr(`${v} ${SYM[s]} ${fmt(slip.val)}`, slip.fb, slip.tag),
    ].filter(Boolean);
    return mcx(rng, {
      q: `Solve ${q.txt}.`,
      qEs: `Resuelve ${q.txt}.`,
      right: `${v} ${SYM[s]} ${b}`,
      wrong,
      ...text({ x: ineqLine(q), h: siLadder(q) }),
      meta: { kind: "solve", v, txt: q.txt },
    });
  };
  const siBoundaryItem = (rng, level, forms) => {
    const q = ineqOf(rng, level, forms);
    return G.num({
      q: `Solve ${q.txt}. What number is the boundary of the solutions?`,
      qEs: `Resuelve ${q.txt}. ¿Qué número es el límite de las soluciones?`,
      a: fmt(q.b),
      fw: slipsToFw(q.e, q.b),
      ...text({ x: ineqLine(q), h: siLadder(q) }),
      meta: { kind: "boundary", e: q.e, s: q.s },
    });
  };
  const siTestItem = (rng, level, forms) => {
    const q = ineqOf(rng, level, forms);
    const { s, b, v } = q;
    const key = inValue(rng, s, b, true);
    const wrong = outValues(s, b).map((x) => {
      const [tag, fb] = outFb(s, b, x);
      return wr(
        String(x),
        [
          `${fb[0].replace(`${x} ${SYM[s]} ${b}`, `Solving gives ${v} ${SYM[s]} ${b}, and ${x} ${SYM[s]} ${b}`)}`,
          fb[1],
        ],
        tag,
      );
    });
    return mcx(rng, {
      q: `Which value is a solution of ${q.txt}?`,
      qEs: `¿Qué valor es una solución de ${q.txt}?`,
      right: String(key),
      wrong,
      ...text({
        x: [
          `Solving gives ${v} ${SYM[s]} ${b}. ${key} ${SYM[s]} ${b} is true, so ${key} is a solution.`,
          `Al resolver se obtiene ${v} ${SYM[s]} ${b}. ${key} ${SYM[s]} ${b} es verdadero, así que ${key} es una solución.`,
        ],
        h: siLadder(q),
      }),
      meta: { kind: "test", v, txt: q.txt },
    });
  };
  const siDescItem = (rng, level, forms) => {
    const q = ineqOf(rng, level, forms);
    const d = rayDesc(q.s, q.b);
    return mcx(rng, {
      q: `Solve ${q.txt}. Which description shows its solutions on a number line?`,
      qEs: `Resuelve ${q.txt}. ¿Qué descripción muestra sus soluciones en una recta numérica?`,
      right: { v: d[0], vEs: d[1] },
      wrong: ["gt", "lt", "ge", "le"]
        .filter((o) => o !== q.s)
        .map((o) => {
          const [tag, fb] = graphMistake(q.s, o);
          const dd = rayDesc(o, q.b);
          return wr(dd[0], fb, tag, dd[1]);
        }),
      ...text({
        x: [
          `${ineqLine(q)[0]} Graph: ${d[0].toLowerCase()}.`,
          `${ineqLine(q)[1]} Gráfica: ${d[1].toLowerCase()}.`,
        ],
        h: siLadder(q),
      }),
      meta: { kind: "desc", v: q.v, txt: q.txt },
    });
  };
  const siFromGraphItem = (rng, level) => {
    const s = rng.pick(["gt", "lt", "ge", "le"]);
    const b = rng.int(7, 40);
    const v = rng.pick(VARS);
    const viz = rayViz(b, s);
    let right;
    let wrong;
    if (level < 4) {
      right = ineqStr(v, s, b);
      wrong = symWrongs(s, (o) => ({ v: ineqStr(v, o, b) }));
    } else {
      let key = null;
      for (let t = 0; t < 30 && !key; t++) key = eqWithSolution(rng, rng.pick(FORMS), v, b);
      key = key || makeEq("add", v, 5, b);
      const text2 = (e, sy) => `${sideStr(e)} ${SYM[sy]} ${e.qd}`;
      right = text2(key, s);
      const off = eqFromPQ(key.f, v, key.p, key.q + (key.f === "mul" ? key.p : 1));
      wrong = [
        ...symWrongs(s, (o) => ({ v: text2(key, o) })).filter(
          (w) => w.tag !== "reversed-and-boundary",
        ),
        wr(
          text2(off, s),
          [
            "The symbol is right, but the numbers give a different boundary. Solve it and compare with the graph.",
            "El símbolo es correcto, pero los números dan otro límite. Resuélvela y compárala con la gráfica.",
          ],
          "wrong-boundary",
        ),
      ];
    }
    return mcx(rng, {
      q:
        level < 4
          ? "The graph shows the solutions of an inequality. Which inequality does it show?"
          : "Which inequality has the solutions shown on the graph?",
      qEs:
        level < 4
          ? "La gráfica muestra las soluciones de una desigualdad. ¿Qué desigualdad muestra?"
          : "¿Qué desigualdad tiene las soluciones que muestra la gráfica?",
      right,
      wrong,
      viz,
      ...text({
        x: [
          `The ${isStrict(s) ? "open" : "closed"} circle at ${b} means ${b} ${isStrict(s) ? "is not" : "is"} a solution, and the shading goes ${isUp(s) ? "right" : "left"}.${level === 4 ? ` Solving ${right} gives ${v} ${SYM[s]} ${b}.` : ""}`,
          `El círculo ${isStrict(s) ? "abierto" : "cerrado"} en ${b} significa que ${b} ${isStrict(s) ? "no es" : "sí es"} una solución, y el sombreado va hacia la ${isUp(s) ? "derecha" : "izquierda"}.${level === 4 ? ` Al resolver ${right} se obtiene ${v} ${SYM[s]} ${b}.` : ""}`,
        ],
        h: [
          [
            "Read the circle: open means the number is not included, closed means it is.",
            "Lee el círculo: abierto significa que el número no se incluye, cerrado que sí.",
          ],
          [
            "Read the shading: right means greater numbers, left means smaller numbers.",
            "Lee el sombreado: derecha significa números mayores, izquierda números menores.",
          ],
          level === 4
            ? [
                "Solve each choice like an equation first, then compare it with the graph.",
                "Resuelve cada opción primero como una ecuación y luego compárala con la gráfica.",
              ]
            : [
                "Match the boundary number, then the symbol.",
                "Empareja el número límite y luego el símbolo.",
              ],
        ],
      }),
      meta: { kind: "graph", v, level },
    });
  };
  const siSmallestItem = (rng, level, forms) => {
    const q = ineqOf(rng, level, forms);
    const up = isUp(q.s);
    const ans = q.s === "gt" ? q.b + 1 : q.s === "lt" ? q.b - 1 : q.b;
    return G.num({
      q: `Solve ${q.txt}. What is the ${up ? "smallest" : "largest"} whole number solution?`,
      qEs: `Resuelve ${q.txt}. ¿Cuál es la solución entera ${up ? "más pequeña" : "más grande"}?`,
      a: String(ans),
      fw: isStrict(q.s)
        ? [
            {
              v: String(q.b),
              tag: "boundary-included",
              f: `${q.b} is the boundary, but ${SYM[q.s]} does not include it.`,
              fEs: `${q.b} es el límite, pero ${SYM[q.s]} no lo incluye.`,
            },
          ]
        : [
            {
              v: String(up ? q.b + 1 : q.b - 1),
              tag: "boundary-excluded",
              f: `The boundary itself makes ${SYM[q.s]} true, so it belongs.`,
              fEs: `El propio límite hace verdadero ${SYM[q.s]}, así que sí cuenta.`,
            },
          ],
      ...text({
        x: [
          `${ineqLine(q)[0]} The ${up ? "smallest" : "largest"} whole number is ${ans}.`,
          `${ineqLine(q)[1]} El número entero ${up ? "más pequeño" : "más grande"} es ${ans}.`,
        ],
        h: siLadder(q),
      }),
      meta: { kind: "smallest", v: q.v, txt: q.txt, up },
    });
  };
  const SI_KINDS = {
    1: [
      ["solve", 4],
      ["boundary", 3],
      ["test", 3],
    ],
    2: [
      ["solve", 3],
      ["desc", 3],
      ["graph", 3],
      ["test", 2],
      ["boundary", 1],
    ],
    3: [
      ["solve", 3],
      ["desc", 2],
      ["smallest", 3],
      ["graph", 2],
    ],
    4: [
      ["graph", 4],
      ["smallest", 3],
      ["solve", 2],
      ["test", 1],
    ],
  };
  G.register("solveInequality", {
    title: "Solve and graph an inequality",
    titleEs: "Resolver y graficar una desigualdad",
    levels: 4,
    make(rng, level) {
      const forms = level >= 3 && rng.chance(0.55) ? MULDIV : ADDSUB;
      const kind = wpick(rng, SI_KINDS[level]);
      if (kind === "solve") return siSolveItem(rng, level, forms);
      if (kind === "boundary") return siBoundaryItem(rng, level, forms);
      if (kind === "test") return siTestItem(rng, level, forms);
      if (kind === "desc") return siDescItem(rng, level, forms);
      if (kind === "graph") return siFromGraphItem(rng, level);
      return siSmallestItem(rng, level, forms);
    },
    check(item) {
      const m = item.meta;
      const grid = (txt, v) => sweep(txt, v, 0, 400, 0.5).join(",");
      if (m.kind === "boundary")
        return near(lhs(m.e.f, m.e.p, G.value(item.a)), m.e.q)
          ? true
          : "typed boundary does not balance the equation";
      if (m.kind === "smallest") {
        const set = sweep(m.txt, m.v, 0, 400, 1);
        return near(G.value(item.a), m.up ? set[0] : set[set.length - 1])
          ? true
          : "typed value is not the extreme whole-number solution";
      }
      if (m.kind === "test") {
        const ok = item.c.map((c) => holds(m.txt, m.v, Number(c)));
        return ok.filter(Boolean).length === 1 && ok[item.a]
          ? true
          : "keyed value is not the only solution";
      }
      let want;
      let has;
      if (m.kind === "solve") {
        want = grid(m.txt, m.v);
        has = (c) => grid(c, m.v) === want;
      } else if (m.kind === "desc") {
        want = sweep(m.txt, m.v, 0, 400, 1).join(",");
        has = (c) =>
          range(0, 400)
            .filter((x) => descHolds(c, x))
            .join(",") === want;
      } else {
        const ray = item.viz.ray;
        want = range(0, 400)
          .filter((x) => rayHolds(ray, x))
          .join(",");
        has = (c) => sweep(c, m.v, 0, 400, 1).join(",") === want;
      }
      const ok = item.c.map(has);
      return ok.filter(Boolean).length === 1 && ok[item.a]
        ? true
        : "the keyed choice is not the only one with the right solution set";
    },
  });

  /* ====================================================================================================
   * 8-7  writeEquationWord
   * ================================================================================================== */
  /** limits: form add -> k + v vs C ; form mul -> p v vs C.  {k2} the limit phrase, {N} a name, {k} {p} {C} numbers */
  const LIMITS = [
    {
      form: "add",
      r: "le",
      v: "p",
      count: true,
      en: "A bus can carry {k2} {C} passengers. {k} passengers are already on board.",
      es: "Un autobús puede llevar {k2} {C} pasajeros. Ya hay {k} pasajeros a bordo.",
      ask: ["How many more passengers can get on?", "¿Cuántos pasajeros más pueden subir?"],
      what: [
        "the number of passengers who can still get on",
        "el número de pasajeros que aún pueden subir",
      ],
    },
    {
      form: "add",
      r: "le",
      v: "m",
      count: false,
      en: "{N} can spend {k2} ${C} at the fair. {N} has already spent ${k}.",
      es: "{N} puede gastar {k2} ${C} en la feria. Ya gastó ${k}.",
      ask: ["How many more dollars can {N} spend?", "¿Cuántos dólares más puede gastar {N}?"],
      what: ["the dollars still available", "los dólares que aún puede gastar"],
    },
    {
      form: "add",
      r: "le",
      v: "w",
      count: false,
      en: "A backpack may hold {k2} {C} pounds. It already holds {k} pounds.",
      es: "Una mochila puede cargar {k2} {C} libras. Ya tiene {k} libras.",
      ask: ["How many more pounds can be added?", "¿Cuántas libras más se pueden añadir?"],
      what: ["the pounds that can be added", "las libras que se pueden añadir"],
    },
    {
      form: "add",
      r: "ge",
      v: "p",
      count: true,
      en: "{N} needs {k2} {C} points to win. {N} has {k} points so far.",
      es: "{N} necesita {k2} {C} puntos para ganar. Hasta ahora {N} tiene {k} puntos.",
      ask: ["How many more points does {N} need?", "¿Cuántos puntos más necesita {N}?"],
      what: ["the points still needed", "los puntos que aún se necesitan"],
    },
    {
      form: "add",
      r: "ge",
      v: "m",
      count: false,
      en: "{N} wants to save {k2} ${C}. {N} has saved ${k}.",
      es: "{N} quiere ahorrar {k2} ${C}. {N} ha ahorrado ${k}.",
      ask: [
        "How many more dollars does {N} need to save?",
        "¿Cuántos dólares más necesita ahorrar {N}?",
      ],
      what: ["the dollars still to save", "los dólares que faltan por ahorrar"],
    },
    {
      form: "add",
      r: "ge",
      v: "r",
      count: true,
      en: "{N} wants to read {k2} {C} pages this week. {N} has read {k} pages.",
      es: "{N} quiere leer {k2} {C} páginas esta semana. {N} ha leído {k} páginas.",
      ask: [
        "How many more pages does {N} need to read?",
        "¿Cuántas páginas más necesita leer {N}?",
      ],
      what: ["the pages still to read", "las páginas que faltan por leer"],
    },
    {
      form: "mul",
      r: "le",
      v: "t",
      count: true,
      en: "Each ticket costs ${p}. {N} can spend {k2} ${C}.",
      es: "Cada boleto cuesta ${p}. {N} puede gastar {k2} ${C}.",
      ask: ["How many tickets can {N} buy?", "¿Cuántos boletos puede comprar {N}?"],
      what: ["the number of tickets", "el número de boletos"],
    },
    {
      form: "mul",
      r: "le",
      v: "b",
      count: true,
      en: "Each box weighs {p} pounds. A lift can carry {k2} {C} pounds.",
      es: "Cada caja pesa {p} libras. Un montacargas puede cargar {k2} {C} libras.",
      ask: ["How many boxes can the lift carry?", "¿Cuántas cajas puede cargar el montacargas?"],
      what: ["the number of boxes", "el número de cajas"],
    },
    {
      form: "mul",
      r: "le",
      v: "s",
      count: true,
      en: "Each snack bag costs ${p}. The class has {k2} ${C} to spend.",
      es: "Cada bolsa de bocadillos cuesta ${p}. La clase tiene {k2} ${C} para gastar.",
      ask: ["How many bags can the class buy?", "¿Cuántas bolsas puede comprar la clase?"],
      what: ["the number of bags", "el número de bolsas"],
    },
    {
      form: "mul",
      r: "ge",
      v: "n",
      count: true,
      en: "{N} earns ${p} for each necklace sold. {N} wants to earn {k2} ${C}.",
      es: "{N} gana ${p} por cada collar vendido. {N} quiere ganar {k2} ${C}.",
      ask: ["How many necklaces must {N} sell?", "¿Cuántos collares debe vender {N}?"],
      what: ["the number of necklaces", "el número de collares"],
    },
    {
      form: "mul",
      r: "ge",
      v: "l",
      count: true,
      en: "Each lap is {p} meters. {N} wants to run {k2} {C} meters.",
      es: "Cada vuelta mide {p} metros. {N} quiere correr {k2} {C} metros.",
      ask: ["How many laps must {N} run?", "¿Cuántas vueltas debe correr {N}?"],
      what: ["the number of laps", "el número de vueltas"],
    },
    {
      form: "mul",
      r: "ge",
      v: "k",
      count: true,
      en: "Each student brings {p} cans. The food drive needs {k2} {C} cans.",
      es: "Cada estudiante trae {p} latas. La colecta necesita {k2} {C} latas.",
      ask: ["How many students must bring cans?", "¿Cuántos estudiantes deben traer latas?"],
      what: ["the number of students", "el número de estudiantes"],
    },
  ];
  /** a limit story: {cx, sym, ph, k, p, C, g} ; the quantity compared with C is k + v (add) or p·v (mul) */
  const limitStory = (rng, level, divisible) => {
    const cx = rng.pick(LIMITS);
    const N = rng.pick(NAMES);
    const strict = level >= 3 && rng.chance(0.5);
    const sym = cx.r === "le" ? (strict ? "lt" : "le") : strict ? "gt" : "ge";
    const ph = rng.pick(phrasesFor(sym, cx.count, false));
    let k = 0;
    let p = 1;
    let C;
    if (cx.form === "add") {
      k = rng.int(10, 60);
      C = k + rng.int(8, 40);
    } else {
      p = rng.int(2, 9);
      C = p * rng.int(4, 14) + (divisible ? 0 : rng.int(1, p - 1));
    }
    const o = { N, k, p, C };
    const en = fill(cx.en, { ...o, k2: ph.en });
    const es = fill(cx.es, { ...o, k2: ph.es });
    return { cx, N, sym, ph, k, p, C, en, es, ask: [fill(cx.ask[0], o), fill(cx.ask[1], o)] };
  };
  const quantityText = (L, v) => (L.cx.form === "add" ? `${L.k} + ${v}` : `${L.p}${v}`);
  const lmodelItem = (rng, level) => {
    const L = limitStory(rng, level, true);
    const v = L.cx.v;
    const mk = (s) => `${quantityText(L, v)} ${s === "=" ? "=" : SYM[s]} ${L.C}`;
    const [tagR, fbR] = symMistake(L.sym, OPP[L.sym]);
    const [tagC, fbC] = symMistake(L.sym, CNT[L.sym]);
    return mcx(rng, {
      q: `${L.en} Which inequality models the story? Let ${v} stand for ${L.cx.what[0]}.`,
      qEs: `${L.es} ¿Qué desigualdad modela la historia? Sea ${v}: ${L.cx.what[1]}.`,
      right: mk(L.sym),
      wrong: [
        wr(
          mk("="),
          [
            "The story gives a limit, not an exact amount, so it needs an inequality symbol.",
            "La historia da un límite, no una cantidad exacta, así que necesita un símbolo de desigualdad.",
          ],
          "used-equals",
        ),
        wr(mk(OPP[L.sym]), fbR, tagR),
        wr(mk(CNT[L.sym]), fbC, tagC),
      ],
      ...text({
        x: [
          `"${L.ph.en}" means ${SYM[L.sym]}. ${L.cx.form === "add" ? `The amount already there plus ${v}` : `Each one costs ${L.p}, so ${v} of them come to ${L.p}${v}, and that`} is compared with ${L.C}: ${mk(L.sym)}.`,
          `"${L.ph.es}" significa ${SYM[L.sym]}. ${L.cx.form === "add" ? `Lo que ya hay más ${v}` : `Cada uno cuesta ${L.p}, así que ${v} de ellos suman ${L.p}${v}, y eso`} se compara con ${L.C}: ${mk(L.sym)}.`,
        ],
        h: [
          [
            "Is the story about an exact amount or a limit?",
            "¿La historia trata de una cantidad exacta o de un límite?",
          ],
          [
            "Write the amount that is being compared with the limit. Include what is already there, or the cost of each one.",
            "Escribe la cantidad que se compara con el límite. Incluye lo que ya hay, o el costo de cada uno.",
          ],
          [
            "Choose the symbol from the key words, and ask whether the limit itself is allowed.",
            "Elige el símbolo según las palabras clave y pregunta si se permite el propio límite.",
          ],
        ],
      }),
      meta: { kind: "lmodel", v, form: L.cx.form, k: L.k, p: L.p, C: L.C, key: L.ph.en },
    });
  };
  const lsolveItem = (rng, level) => {
    const L = limitStory(rng, level, level < 3);
    const v = L.cx.v;
    const { sym, p, C, k } = L;
    const g = C - k; // what the unknown part is compared with
    const q = g / p;
    const ans =
      sym === "le"
        ? Math.floor(q)
        : sym === "lt"
          ? Math.ceil(q) - 1
          : sym === "ge"
            ? Math.ceil(q)
            : Math.floor(q) + 1;
    const up = isUp(sym);
    const fw = [];
    if (!Number.isInteger(q)) {
      fw.push({
        v: String(up ? Math.floor(q) : Math.ceil(q)),
        tag: "rounded-wrong-way",
        f: up
          ? "Rounding down leaves you short of the goal. You need a whole number that reaches it."
          : "Rounding up goes over the limit. You need a whole number that stays within it.",
        fEs: up
          ? "Redondear hacia abajo no alcanza la meta. Necesitas un número entero que la alcance."
          : "Redondear hacia arriba se pasa del límite. Necesitas un número entero que se mantenga dentro.",
      });
      fw.push({
        v: fmt(clean(q)),
        tag: "ignored-whole-number",
        f: "The answer must be a whole number here. Decide whether to round up or down.",
        fEs: "Aquí la respuesta debe ser un número entero. Decide si redondear hacia arriba o hacia abajo.",
      });
    } else if (isStrict(sym))
      fw.push({
        v: String(q),
        tag: "boundary-included",
        f: `${q} lands exactly on the limit, and the story does not allow that.`,
        fEs: `${q} cae justo en el límite, y la historia no lo permite.`,
      });
    else
      fw.push({
        v: String(up ? q + 1 : q - 1),
        tag: "boundary-excluded",
        f: "Landing exactly on the limit is allowed here.",
        fEs: "Aquí se permite quedar justo en el límite.",
      });
    const ineq = `${quantityText(L, v)} ${SYM[sym]} ${C}`;
    return G.num({
      q: `${L.en} ${L.ask[0]} Write an inequality, then find the ${up ? "least" : "greatest"} whole number.`,
      qEs: `${L.es} ${L.ask[1]} Escribe una desigualdad y luego halla el número entero ${up ? "menor" : "mayor"}.`,
      a: String(ans),
      fw,
      ...text({
        x: [
          `Let ${v} stand for ${L.cx.what[0]}. The story gives ${ineq}. ${L.cx.form === "add" ? `Subtract ${k}: ${v} ${SYM[sym]} ${g}.` : `Divide by ${p}: ${v} ${SYM[sym]} ${fmt(clean(q))}.`} The ${up ? "least" : "greatest"} whole number that works is ${ans}.`,
          `Sea ${v}: ${L.cx.what[1]}. La historia da ${ineq}. ${L.cx.form === "add" ? `Resta ${k}: ${v} ${SYM[sym]} ${g}.` : `Divide entre ${p}: ${v} ${SYM[sym]} ${fmt(clean(q))}.`} El número entero ${up ? "menor" : "mayor"} que sirve es ${ans}.`,
        ],
        h: [
          [
            "Write the inequality first. Is the limit allowed or not?",
            "Escribe primero la desigualdad. ¿Se permite el límite o no?",
          ],
          [
            `Solve it like an equation. ${L.cx.form === "add" ? "Undo the addition." : "Undo the multiplication."}`,
            `Resuélvela como una ecuación. ${L.cx.form === "add" ? "Deshaz la suma." : "Deshaz la multiplicación."}`,
          ],
          [
            "Then think about whole numbers: which whole number is the last one that still works?",
            "Luego piensa en números enteros: ¿cuál es el último número entero que todavía sirve?",
          ],
        ],
      }),
      meta: { kind: "lsolve", v, form: L.cx.form, k, p, C, key: L.ph.en, up },
    });
  };
  const PARTS = [
    {
      en: "{N} wants a game that costs ${C}. {N} has saved ${a}, and a relative gives {N} ${b}. How many more dollars does {N} need?",
      es: "{N} quiere un juego que cuesta ${C}. {N} ha ahorrado ${a} y un familiar le da ${b}. ¿Cuántos dólares más necesita {N}?",
      v: "m",
      what: ["the dollars still needed", "los dólares que faltan"],
    },
    {
      en: "A tank holds {C} liters. It has {a} liters, and {b} more liters are poured in. How many more liters fit?",
      es: "Un tanque tiene capacidad para {C} litros. Tiene {a} litros y se vierten {b} litros más. ¿Cuántos litros más caben?",
      v: "w",
      what: ["the liters that still fit", "los litros que aún caben"],
    },
    {
      en: "{N} wants to read {C} pages. {N} read {a} pages on Monday and {b} pages on Tuesday. How many pages are left?",
      es: "{N} quiere leer {C} páginas. {N} leyó {a} páginas el lunes y {b} páginas el martes. ¿Cuántas páginas faltan?",
      v: "r",
      what: ["the pages left to read", "las páginas que faltan por leer"],
    },
    {
      en: "A team needs {C} points. It scored {a} in the first game and {b} in the second. How many more points does it need?",
      es: "Un equipo necesita {C} puntos. Anotó {a} en el primer juego y {b} en el segundo. ¿Cuántos puntos más necesita?",
      v: "p",
      what: ["the points still needed", "los puntos que aún se necesitan"],
    },
    {
      en: "The class needs {C} cans. Group A brought {a} cans and group B brought {b}. How many more cans are needed?",
      es: "La clase necesita {C} latas. El grupo A trajo {a} latas y el grupo B trajo {b}. ¿Cuántas latas más se necesitan?",
      v: "c",
      what: ["the cans still needed", "las latas que aún se necesitan"],
    },
  ];
  const twoPartItem = (rng) => {
    const cx = rng.pick(PARTS);
    const N = rng.pick(NAMES);
    const a = rng.int(12, 45);
    const b = rng.int(8, 35);
    const u = rng.int(7, 40);
    const C = a + b + u;
    if (a === b || [a, b, C].includes(u)) return twoPartItem(rng);
    const o = { N, a, b, C };
    const v = cx.v;
    const fw = [
      [C - a, "used-one-part"],
      [C - b, "used-one-part"],
      [C + a + b, "added-instead"],
    ]
      .filter(([n]) => n !== u)
      .map(([n, tag]) => ({
        v: String(n),
        tag,
        f:
          tag === "used-one-part"
            ? "You used only one of the two amounts already there. Use both."
            : "You added everything. The amounts already there reduce what is still needed.",
        fEs:
          tag === "used-one-part"
            ? "Usaste solo una de las dos cantidades que ya hay. Usa las dos."
            : "Sumaste todo. Las cantidades que ya hay reducen lo que aún se necesita.",
      }));
    return G.num({
      q: fill(cx.en, o),
      qEs: fill(cx.es, o),
      a: String(u),
      fw,
      ...text({
        x: [
          `Let ${v} stand for ${cx.what[0]}. ${a} + ${b} + ${v} = ${C}, so ${a + b} + ${v} = ${C}. Subtract ${a + b} from both sides: ${v} = ${C} − ${a + b} = ${u}.`,
          `Sea ${v}: ${cx.what[1]}. ${a} + ${b} + ${v} = ${C}, así que ${a + b} + ${v} = ${C}. Resta ${a + b} de ambos lados: ${v} = ${C} − ${a + b} = ${u}.`,
        ],
        h: [
          [
            "There are two amounts already there. Put them together first.",
            "Ya hay dos cantidades. Júntalas primero.",
          ],
          [
            `Write one equation with ${v}: first amount + second amount + ${v} = total.`,
            `Escribe una ecuación con ${v}: primera cantidad + segunda cantidad + ${v} = total.`,
          ],
          [
            `Work out ${a} + ${b}, then undo that addition from ${C}.`,
            `Calcula ${a} + ${b} y luego deshaz esa suma en ${C}.`,
          ],
        ],
      }),
      meta: { kind: "twopart", a, b, C },
    });
  };
  /** which story matches this equation or inequality?  stories are plain sentences; check() classifies them by key words */
  const THINGS = [
    ["pencils", "lápices"],
    ["stickers", "calcomanías"],
    ["marbles", "canicas"],
    ["cards", "cartas"],
  ];
  const matchItem = (rng) => {
    const N = rng.pick(NAMES);
    const [th, thEs] = rng.pick(THINGS);
    const p = rng.int(3, 9);
    const q = p * rng.int(4, 12);
    if (rng.chance(0.5)) {
      const n = "n";
      const S = {
        add: [
          `${N} had some ${th}, then got ${p} more and had ${q}.`,
          `${N} tenía unas ${thEs}, luego recibió ${p} más y tuvo ${q}.`,
        ],
        sub: [
          `${N} had some ${th}, gave away ${p}, and had ${q} left.`,
          `${N} tenía unas ${thEs}, regaló ${p} y le quedaron ${q}.`,
        ],
        mul: [
          `${N} has ${p} equal bags with ${n} ${th} in each bag, and ${q} ${th} in all.`,
          `${N} tiene ${p} bolsas iguales con ${n} ${thEs} en cada bolsa, y ${q} ${thEs} en total.`,
        ],
        div: [
          `${N} shared some ${th} equally among ${p} friends, and each friend got ${q}.`,
          `${N} repartió unas ${thEs} por igual entre ${p} amigos, y cada amigo recibió ${q}.`,
        ],
      };
      const f = rng.pick(FORMS);
      const e = eqFromPQ(f, n, p, q);
      e.flip = false;
      return mcx(rng, {
        q: `Which story matches the equation ${eqStr(e)}?`,
        qEs: `¿Qué historia corresponde a la ecuación ${eqStr(e)}?`,
        right: { v: S[f][0], vEs: S[f][1] },
        wrong: FORMS.filter((o) => o !== f).map((o) =>
          wr(
            S[o][0],
            [
              `That story is about ${o === "add" ? "adding" : o === "sub" ? "taking away" : o === "mul" ? "equal groups" : "sharing equally"}, which is a different operation from ${OP[f]}.`,
              `Esa historia trata de ${o === "add" ? "sumar" : o === "sub" ? "quitar" : o === "mul" ? "grupos iguales" : "repartir por igual"}, que es otra operación distinta de ${OP[f]}.`,
            ],
            "wrong-operation",
            S[o][1],
          ),
        ),
        ...text({
          x: [
            `${eqStr(e)} says: ${f === "add" ? "start with n and add" : f === "sub" ? "start with n and take away" : f === "mul" ? "equal groups of n" : "n shared equally"} ${p}, to reach ${q}. Only one story does exactly that.`,
            `${eqStr(e)} dice: ${f === "add" ? "empieza con n y suma" : f === "sub" ? "empieza con n y quita" : f === "mul" ? "grupos iguales de n" : "n repartido por igual"} ${p}, para llegar a ${q}. Solo una historia hace eso.`,
          ],
          h: [
            ["Say what the equation does to n.", "Di qué le hace la ecuación a n."],
            [
              "Look for the story with the same action: add, take away, equal groups, or sharing.",
              "Busca la historia con la misma acción: sumar, quitar, grupos iguales o repartir.",
            ],
            [
              `Check that the numbers ${p} and ${q} play the same roles in the story.`,
              `Comprueba que los números ${p} y ${q} cumplen los mismos papeles en la historia.`,
            ],
          ],
        }),
        meta: { kind: "match", n, sym: "=", form: f, p, q },
      });
    }
    const S = {
      le: [
        `Each ticket costs $${p}. ${N} can spend at most $${q}. Let n be the number of tickets ${N} can buy.`,
        `Cada boleto cuesta $${p}. ${N} puede gastar como máximo $${q}. Sea n el número de boletos que puede comprar ${N}.`,
      ],
      "=": [
        `${N} buys n tickets for exactly $${q} in all. Each ticket costs $${p}.`,
        `${N} compra n boletos por exactamente $${q} en total. Cada boleto cuesta $${p}.`,
      ],
      ge: [
        `Each ticket costs $${p}. ${N} needs to spend at least $${q}. Let n be the number of tickets ${N} buys.`,
        `Cada boleto cuesta $${p}. ${N} necesita gastar al menos $${q}. Sea n el número de boletos que compra ${N}.`,
      ],
      lt: [
        `Each ticket costs $${p}. ${N} has less than $${q}. Let n be the number of tickets ${N} can buy.`,
        `Cada boleto cuesta $${p}. ${N} tiene menos de $${q}. Sea n el número de boletos que puede comprar ${N}.`,
      ],
    };
    return mcx(rng, {
      q: `Which story matches the inequality ${p}n ≤ ${q}?`,
      qEs: `¿Qué historia corresponde a la desigualdad ${p}n ≤ ${q}?`,
      right: { v: S.le[0], vEs: S.le[1] },
      wrong: [
        wr(
          S["="][0],
          [
            "This story gives an exact total, so it needs an equation.",
            "Esta historia da un total exacto, así que necesita una ecuación.",
          ],
          "used-equals",
          S["="][1],
        ),
        wr(S.ge[0], symMistake("le", OPP.le)[1], "reversed-symbol", S.ge[1]),
        wr(S.lt[0], symMistake("le", CNT.le)[1], "boundary-excluded", S.lt[1]),
      ],
      ...text({
        x: [
          `${p}n ≤ ${q} means ${p} times n is at most ${q}: a limit that can be reached. Only one story has that.`,
          `${p}n ≤ ${q} significa que ${p} por n es como máximo ${q}: un límite que se puede alcanzar. Solo una historia tiene eso.`,
        ],
        h: [
          [
            "Read the symbol out loud: what kind of limit is it?",
            "Lee el símbolo en voz alta: ¿qué tipo de límite es?",
          ],
          [
            "Is the limit itself allowed? That tells you which key words fit.",
            "¿Se permite el propio límite? Eso te dice qué palabras clave encajan.",
          ],
          [
            "Which way do the allowed values go: up to the limit, or from it?",
            "¿Hacia dónde van los valores permitidos: hasta el límite o desde él?",
          ],
        ],
      }),
      meta: { kind: "match", n: "n", sym: "le", p, q },
    });
  };
  const EW_KINDS = {
    1: [
      ["model", 5],
      ["lmodel", 3],
      ["story", 2],
    ],
    2: [
      ["lmodel", 4],
      ["lsolve", 3],
      ["model", 2],
      ["story", 1],
    ],
    3: [
      ["lsolve", 4],
      ["twopart", 3],
      ["lmodel", 1],
    ],
    4: [
      ["match", 4],
      ["twopart", 2],
      ["lsolve", 3],
    ],
  };
  const classify = (t) => {
    if (/exactly/.test(t)) return "=";
    if (/at most/.test(t)) return "le";
    if (/at least/.test(t)) return "ge";
    if (/less than/.test(t)) return "lt";
    if (/equal bags/.test(t)) return "mul";
    if (/shared .* equally/.test(t)) return "div";
    if (/gave away/.test(t)) return "sub";
    if (/got \d+ more/.test(t)) return "add";
    return "?";
  };
  G.register("writeEquationWord", {
    title: "Write and solve from a story",
    titleEs: "Escribir y resolver desde una historia",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, EW_KINDS[level]);
      if (kind === "model") return storyModelItem(rng, level, FORMS);
      if (kind === "story") return storyTyped(rng, level, FORMS);
      if (kind === "lmodel") return lmodelItem(rng, level);
      if (kind === "lsolve") return lsolveItem(rng, level);
      if (kind === "twopart") return twoPartItem(rng);
      return matchItem(rng);
    },
    check(item) {
      const m = item.meta;
      if (m.kind === "model") return modelCheck(item);
      if (m.kind === "story")
        return near(lhs(m.e.f, m.e.p, G.value(item.a)), m.e.q)
          ? true
          : "answer fails the story equation";
      if (m.kind === "twopart")
        return m.a + m.b + G.value(item.a) === m.C ? true : "the parts do not add up to the total";
      if (m.kind === "match") {
        const want = m.sym === "=" ? m.form : m.sym;
        const ok = item.c.map(
          (c) => classify(c) === want && c.includes(String(m.p)) && c.includes(String(m.q)),
        );
        return ok.filter(Boolean).length === 1 && ok[item.a]
          ? true
          : "the keyed story is not the only one that matches";
      }
      const T = (x) => (m.form === "add" ? m.k + x : m.p * x);
      const okf = keyOk(m.key);
      if (m.kind === "lmodel") {
        const xs = range(0, 80);
        const good = item.c.map((c) => xs.every((x) => holds(c, m.v, x) === okf(T(x), m.C)));
        return good.filter(Boolean).length === 1 && good[item.a]
          ? true
          : "the keyed inequality is not the only one that models the story";
      }
      const set = range(0, m.C + 5).filter((x) => okf(T(x), m.C));
      return near(G.value(item.a), m.up ? set[0] : set[set.length - 1])
        ? true
        : "typed value is not the extreme whole number that works";
    },
  });

  /* ====================================================================================================
   * Two-variable relationships (Unit 9): y = kx and y = x + k as tables, equations and graphs
   * ================================================================================================== */
  const mk2 = (xn, yn, xl, yl, hd, hdEs, sent, one, other) => ({
    xn,
    yn,
    xl,
    yl,
    hd,
    hdEs,
    sent,
    one,
    other,
  });
  const REL = {
    mul: [
      mk2(
        ["number of tickets", "número de boletos"],
        ["total cost in dollars", "costo total en dólares"],
        "t",
        "c",
        ["Tickets", "Cost ($)"],
        ["Boletos", "Costo ($)"],
        (k) => [`Movie tickets cost $${k} each.`, `Los boletos de cine cuestan $${k} cada uno.`],
        ["1 ticket", "1 boleto"],
        ["the name of the movie", "el nombre de la película"],
      ),
      mk2(
        ["number of hours worked", "número de horas trabajadas"],
        ["money earned in dollars", "dinero ganado en dólares"],
        "h",
        "e",
        ["Hours", "Earned ($)"],
        ["Horas", "Ganado ($)"],
        (k) => [
          `Dani earns $${k} for each hour of work.`,
          `Dani gana $${k} por cada hora de trabajo.`,
        ],
        ["1 hour", "1 hora"],
        ["Dani's age", "la edad de Dani"],
      ),
      mk2(
        ["number of minutes", "número de minutos"],
        ["number of pages printed", "número de páginas impresas"],
        "m",
        "p",
        ["Minutes", "Pages"],
        ["Minutos", "Páginas"],
        (k) => [
          `A printer prints ${k} pages each minute.`,
          `Una impresora imprime ${k} páginas por minuto.`,
        ],
        ["1 minute", "1 minuto"],
        ["the color of the paper", "el color del papel"],
      ),
      mk2(
        ["number of weeks", "número de semanas"],
        ["savings in dollars", "ahorros en dólares"],
        "w",
        "s",
        ["Weeks", "Savings ($)"],
        ["Semanas", "Ahorros ($)"],
        (k) => [`Ravi saves $${k} each week.`, `Ravi ahorra $${k} cada semana.`],
        ["1 week", "1 semana"],
        ["the name of the bank", "el nombre del banco"],
      ),
      mk2(
        ["number of laps", "número de vueltas"],
        ["distance in meters", "distancia en metros"],
        "l",
        "d",
        ["Laps", "Distance (m)"],
        ["Vueltas", "Distancia (m)"],
        (k) => [
          `Each lap around the track is ${k} meters.`,
          `Cada vuelta a la pista mide ${k} metros.`,
        ],
        ["1 lap", "1 vuelta"],
        ["the weather", "el clima"],
      ),
      mk2(
        ["number of bags", "número de bolsas"],
        ["number of apples", "número de manzanas"],
        "b",
        "n",
        ["Bags", "Apples"],
        ["Bolsas", "Manzanas"],
        (k) => [`Each bag holds ${k} apples.`, `Cada bolsa contiene ${k} manzanas.`],
        ["1 bag", "1 bolsa"],
        ["the color of the bags", "el color de las bolsas"],
      ),
      mk2(
        ["number of days", "número de días"],
        ["distance in miles", "distancia en millas"],
        "d",
        "m",
        ["Days", "Miles"],
        ["Días", "Millas"],
        (k) => [
          `A hiker walks ${k} miles each day.`,
          `Un excursionista camina ${k} millas cada día.`,
        ],
        ["1 day", "1 día"],
        ["the hiker's shoe size", "la talla de zapato del excursionista"],
      ),
    ],
    add: [
      mk2(
        ["cousin's age in years", "edad de la prima en años"],
        ["Ana's age in years", "edad de Ana en años"],
        "c",
        "n",
        ["Cousin's age", "Ana's age"],
        ["Edad de la prima", "Edad de Ana"],
        (k) => [
          `Ana is ${k} years older than her cousin.`,
          `Ana tiene ${k} años más que su prima.`,
        ],
        null,
        ["the cousin's favorite color", "el color favorito de la prima"],
      ),
      mk2(
        ["height of the fence in feet", "altura de la cerca en pies"],
        ["height of the tree in feet", "altura del árbol en pies"],
        "f",
        "t",
        ["Fence (ft)", "Tree (ft)"],
        ["Cerca (pies)", "Árbol (pies)"],
        (k) => [
          `A tree is ${k} feet taller than the fence next to it.`,
          `Un árbol es ${k} pies más alto que la cerca que está a su lado.`,
        ],
        null,
        ["the color of the fence", "el color de la cerca"],
      ),
      mk2(
        ["Mia's score", "puntaje de Mia"],
        ["Leo's score", "puntaje de Leo"],
        "m",
        "l",
        ["Mia's score", "Leo's score"],
        ["Puntaje de Mia", "Puntaje de Leo"],
        (k) => [
          `Leo's score is ${k} points more than Mia's score.`,
          `El puntaje de Leo es ${k} puntos más que el de Mia.`,
        ],
        null,
        ["the name of the game", "el nombre del juego"],
      ),
      mk2(
        ["yesterday's temperature in degrees", "temperatura de ayer en grados"],
        ["today's temperature in degrees", "temperatura de hoy en grados"],
        "p",
        "r",
        ["Yesterday (°F)", "Today (°F)"],
        ["Ayer (°F)", "Hoy (°F)"],
        (k) => [
          `Today is ${k} degrees warmer than yesterday.`,
          `Hoy hace ${k} grados más que ayer.`,
        ],
        null,
        ["the name of the city", "el nombre de la ciudad"],
      ),
      mk2(
        ["price of the food in dollars", "precio de la comida en dólares"],
        ["total with the delivery fee in dollars", "total con el cargo de entrega en dólares"],
        "f",
        "g",
        ["Food ($)", "Total ($)"],
        ["Comida ($)", "Total ($)"],
        (k) => [
          `A delivery adds a $${k} fee to the price of the food.`,
          `Una entrega añade un cargo de $${k} al precio de la comida.`,
        ],
        null,
        ["the name of the restaurant", "el nombre del restaurante"],
      ),
    ],
  };
  const RATES = [1.5, 2.5, 3.5, 4.5, 6.5, 7.5, 12.5];
  const rateFor = (rng, level, type) =>
    type === "add"
      ? rng.int(2, 15)
      : level >= 3
        ? rng.pick(RATES)
        : level === 2
          ? rng.int(3, 15)
          : rng.int(2, 9);
  const relY = (type, k, x) => clean(type === "mul" ? k * x : x + k);
  const relEq = (type, k, xl, yl) =>
    type === "mul" ? `${yl} = ${fmt(k)}${xl}` : `${yl} = ${xl} + ${fmt(k)}`;
  /** a ratio-style table; the cell at blank = [row, col] is hidden */
  const tableViz = (cx, xs, ys, blank) => ({
    t: "table",
    hd: cx.hd,
    hdEs: cx.hdEs,
    rows: xs.map((x, i) => [
      blank && blank[0] === i && blank[1] === 0 ? "?" : x,
      blank && blank[0] === i && blank[1] === 1 ? "?" : ys[i],
    ]),
    ...(blank ? { blank: [blank] } : {}),
  });
  /** a first-quadrant graph of the points (xs[i], ys[i]) */
  const coordViz = (cx, xs, ys, o = {}) => {
    const ymaxRaw = Math.max(...ys);
    const ystep =
      o.ystep ||
      (ymaxRaw <= 12 ? 1 : ymaxRaw <= 30 ? 2 : ymaxRaw <= 60 ? 5 : ymaxRaw <= 120 ? 10 : 20);
    const xmax = Math.max(...xs) + 1;
    const ymax = Math.ceil((ymaxRaw + 1) / ystep) * ystep;
    return {
      t: "coord",
      xmin: 0,
      xmax,
      ymin: 0,
      ymax,
      grid: true,
      points: xs.map((x, i) => ({ x, y: ys[i], ...(o.labels?.[i] ? { l: o.labels[i] } : {}) })),
      ...(o.segments ? { segments: o.segments } : {}),
      ...(o.line ? { line: o.line } : {}),
      xlabel: cx.hd[0],
      ylabel: cx.hd[1],
      xlabelEs: cx.hdEs[0],
      ylabelEs: cx.hdEs[1],
      xstep: 1,
      ystep,
    };
  };
  /** read k and the type back from a list of rows (the discovery route): y/x constant -> mul, y − x constant -> add */
  const inferRule = (xs, ys) => {
    const j = xs.findIndex((x) => x > 0);
    if (j >= 0 && xs.every((x, i) => (x === 0 ? near(ys[i], 0) : near(ys[i] / x, ys[j] / xs[j]))))
      return { type: "mul", k: clean(ys[j] / xs[j]) };
    if (xs.every((x, i) => near(ys[i] - x, ys[0] - xs[0])))
      return { type: "add", k: clean(ys[0] - xs[0]) };
    return null;
  };
  /** does the printed equation (two letters) hold for every row? */
  const rowsHold = (txt, xl, yl, xs, ys) =>
    xs.every((x, i) => {
      const s = txt.replace(/[a-z]/g, (ch) =>
        ch === xl ? `(${x})` : ch === yl ? `(${ys[i]})` : ch,
      );
      return holds(s, "#", 0) === true;
    });
  /** misconception feedback for a wrong rule, named by what the student did */
  const ruleWrongs = (type, k, xl, yl, xs, ys, plainXY) => {
    const eq = (t, kk) => relEq(t, kk, xl, yl);
    const out = [];
    const other = type === "mul" ? "add" : "mul";
    out.push(
      wr(
        `${xl} = ${type === "mul" ? `${fmt(k)}${yl}` : `${yl} + ${fmt(k)}`}`,
        [
          "The variables are switched: the output is the one that depends on the input.",
          "Las variables están cambiadas: la salida es la que depende de la entrada.",
        ],
        "swapped-x-y",
      ),
    );
    if (type === "mul")
      out.push(
        wr(
          eq("add", clean(ys[0] - xs[0])),
          [
            `That rule works for the first row only. Test it on the other rows. The amount ${plainXY ? "y" : "changes"} grows by the same amount each time x goes up by 1.`,
            "Esa regla sirve solo para la primera fila. Pruébala en las otras filas. El resultado crece lo mismo cada vez que x aumenta en 1.",
          ],
          "matched-one-row",
        ),
      );
    else
      out.push(
        wr(
          eq("mul", k),
          [
            "That multiplies, but in the table the output is the input PLUS a fixed amount. Test it on a row.",
            "Eso multiplica, pero en la tabla la salida es la entrada MÁS una cantidad fija. Pruébala en una fila.",
          ],
          "multiplied-instead",
        ),
      );
    if (type === "mul")
      out.push(
        wr(
          eq("add", k),
          [
            "That adds the rate instead of multiplying by it. Test it on a row.",
            "Eso suma la tasa en lugar de multiplicar por ella. Pruébala en una fila.",
          ],
          "added-instead",
        ),
      );
    else
      out.push(
        wr(
          eq("add", k + 1),
          [
            "The fixed amount is close but not right. Test the rule on a row.",
            "La cantidad fija está cerca pero no es correcta. Pruébala en una fila.",
          ],
          "wrong-constant",
        ),
      );
    out.push(
      wr(
        eq(other === "mul" ? "mul" : "add", type === "mul" ? (k >= 2 ? k + 1 : k * 2) : k + 2),
        [
          "Test this rule on a row of the table: it gives a different output.",
          "Prueba esta regla en una fila de la tabla: da una salida distinta.",
        ],
        "wrong-constant",
      ),
    );
    return out;
  };

  /* ====================================================================================================
   * 9-1 / 9-3  twoVarTable
   * ================================================================================================== */
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const relType = (rng, level) => (level === 1 ? "mul" : rng.chance(0.6) ? "mul" : "add");
  const sayRule = (type, k) =>
    type === "mul"
      ? [`y is ${fmt(k)} times x`, `y es ${fmt(k)} veces x`]
      : [`y is x plus ${fmt(k)}`, `y es x más ${fmt(k)}`];
  const tvRoles = (rng, level) => {
    const type = relType(rng, level);
    const cx = rng.pick(REL[type]);
    const k = rateFor(rng, 2, type);
    const ind = level >= 3 ? rng.chance(0.4) : rng.chance(0.75);
    const key = ind ? cx.xn : cx.yn;
    const swapped = ind ? cx.yn : cx.xn;
    const sent = cx.sent(k);
    return mcx(rng, {
      q: `${sent[0]} In this situation, which quantity is the ${ind ? "independent" : "dependent"} variable?`,
      qEs: `${sent[1]} En esta situación, ¿qué cantidad es la variable ${ind ? "independiente" : "dependiente"}?`,
      right: { v: cap(key[0]), vEs: cap(key[1]) },
      wrong: [
        wr(
          cap(swapped[0]),
          [
            `You have the two variables switched. The independent variable is the one you choose or start with; the dependent variable is the one that responds.`,
            `Tienes las dos variables cambiadas. La variable independiente es la que eliges o con la que empiezas; la dependiente es la que responde.`,
          ],
          "swapped-roles",
          cap(swapped[1]),
        ),
        wr(
          `The fixed number ${fmt(k)}`,
          [
            "A number that never changes is a constant, not a variable.",
            "Un número que nunca cambia es una constante, no una variable.",
          ],
          "constant-as-variable",
          `El número fijo ${fmt(k)}`,
        ),
        wr(
          cap(cx.other[0]),
          [
            "That quantity is not one of the two quantities that change together here.",
            "Esa cantidad no es una de las dos cantidades que cambian juntas aquí.",
          ],
          "unrelated-quantity",
          cap(cx.other[1]),
        ),
      ],
      ...text({
        x: [
          `The independent variable is the quantity you choose or start with: ${xn0(cx)}. The dependent variable, ${yn0(cx)}, responds to it.`,
          `La variable independiente es la cantidad que eliges o con la que empiezas: ${xn1(cx)}. La variable dependiente, ${yn1(cx)}, responde a ella.`,
        ],
        h: [
          [
            "Ask: which quantity do you pick or start with?",
            "Pregunta: ¿qué cantidad eliges o con cuál empiezas?",
          ],
          [
            "Ask: which quantity changes because of the other one?",
            "Pregunta: ¿qué cantidad cambia a causa de la otra?",
          ],
          [
            "In a sentence like “___ depends on ___,” the independent variable goes in the second blank.",
            "En una oración como “___ depende de ___”, la variable independiente va en el segundo espacio.",
          ],
        ],
      }),
      meta: { kind: "roles", type, k, ind, x: cap(cx.xn[0]), y: cap(cx.yn[0]) },
    });
  };
  const xn0 = (cx) => cx.xn[0];
  const yn0 = (cx) => cx.yn[0];
  const xn1 = (cx) => cx.xn[1];
  const yn1 = (cx) => cx.yn[1];

  const tvComplete = (rng, level) => {
    const type = relType(rng, level);
    const cx = rng.pick(REL[type]);
    const k = rateFor(rng, level, type);
    const given = level === 1;
    const sets = [
      [1, 2, 3, 6],
      [1, 2, 4, 7],
      [2, 3, 4, 8],
      [1, 3, 4, 9],
      [2, 4, 5, 10],
    ];
    const xs = rng.pick(sets);
    const ys = xs.map((x) => relY(type, k, x));
    const blank = 3;
    const ans = ys[blank];
    const sent = cx.sent(k);
    const fw = [];
    const add = (v, tag, f, fEs) =>
      v !== ans && !fw.some((w) => w.v === fmt(v)) && fw.push({ v: fmt(v), tag, f, fEs });
    if (type === "mul")
      add(
        clean(xs[blank] + k),
        "added-instead",
        "That adds the rate to x. The output is the rate TIMES the input.",
        "Eso suma la tasa a x. La salida es la tasa POR la entrada.",
      );
    else
      add(
        clean(xs[blank] * k),
        "multiplied-instead",
        "That multiplies. In this table the output is the input PLUS a fixed amount.",
        "Eso multiplica. En esta tabla la salida es la entrada MÁS una cantidad fija.",
      );
    add(
      clean(ys[2] + 1),
      "continued-by-one",
      "The outputs do not grow by 1 each step. Find the rule from a row first.",
      "Las salidas no crecen de 1 en 1. Primero halla la regla con una fila.",
    );
    add(
      clean(ys[2] + (xs[blank] - xs[2])),
      "copied-last-row",
      "Look at how the output changes each time the input goes up by 1, then use that rule.",
      "Mira cómo cambia la salida cada vez que la entrada aumenta en 1 y usa esa regla.",
    );
    return G.num({
      q: given
        ? `${sent[0]} The table shows the ${yn0(cx)} for different values of the ${xn0(cx)}. What number goes in the empty box?`
        : `The table shows how the ${yn0(cx)} depends on the ${xn0(cx)}. Find the rule, then fill the empty box. What number goes in it?`,
      qEs: given
        ? `${sent[1]} La tabla muestra ${yn1(cx)} para distintos valores de ${xn1(cx)}. ¿Qué número va en el cuadro vacío?`
        : `La tabla muestra cómo ${yn1(cx)} depende de ${xn1(cx)}. Halla la regla y llena el cuadro vacío. ¿Qué número va en él?`,
      a: fmt(ans),
      fw: fw.slice(0, 3),
      viz: tableViz(cx, xs, ys, [blank, 1]),
      ...text({
        x: [
          `The rule: ${sayRule(type, k)[0]}. For x = ${xs[blank]}: ${type === "mul" ? `${fmt(k)} × ${xs[blank]}` : `${xs[blank]} + ${fmt(k)}`} = ${fmt(ans)}.`,
          `La regla: ${sayRule(type, k)[1]}. Para x = ${xs[blank]}: ${type === "mul" ? `${fmt(k)} × ${xs[blank]}` : `${xs[blank]} + ${fmt(k)}`} = ${fmt(ans)}.`,
        ],
        h: [
          [
            "Look at one row. How do you get the output from the input?",
            "Mira una fila. ¿Cómo obtienes la salida a partir de la entrada?",
          ],
          [
            "Test your rule on a second row. If it works for both, it is the rule.",
            "Prueba tu regla en una segunda fila. Si funciona en ambas, es la regla.",
          ],
          [
            `Use the rule with the input ${xs[blank]}.`,
            `Usa la regla con la entrada ${xs[blank]}.`,
          ],
        ],
      }),
      meta: { kind: "complete", rows: xs.map((x, i) => [x, i === blank ? null : ys[i]]) },
    });
  };

  const tvRule = (rng, level) => {
    const type = relType(rng, level);
    const cx0 = rng.pick(REL[type]);
    const plain = level === 2;
    const cx = plain ? { ...cx0, xl: "x", yl: "y", hd: ["x", "y"], hdEs: ["x", "y"] } : cx0;
    const k = level === 3 ? rateFor(rng, 2, type) : rateFor(rng, 2, type);
    const xs = rng.pick([
      [1, 2, 3, 4],
      [2, 3, 4, 5],
      [1, 2, 4, 6],
      [3, 4, 5, 7],
    ]);
    const ys = xs.map((x) => relY(type, k, x));
    const right = relEq(type, k, cx.xl, cx.yl);
    const wrong = ruleWrongs(type, k, cx.xl, cx.yl, xs, ys, plain).filter(
      (w) => !rowsHold(w.v, cx.xl, cx.yl, xs, ys),
    );
    return mcx(rng, {
      q: plain
        ? "The table shows a rule. Which equation matches the table?"
        : `The table shows how the ${yn0(cx)} depends on the ${xn0(cx)}. Let ${cx.xl} be the ${xn0(cx)} and ${cx.yl} be the ${yn0(cx)}. Which equation matches the table?`,
      qEs: plain
        ? "La tabla muestra una regla. ¿Qué ecuación coincide con la tabla?"
        : `La tabla muestra cómo ${yn1(cx)} depende de ${xn1(cx)}. Sea ${cx.xl}: ${xn1(cx)} y ${cx.yl} ${yn1(cx)}. ¿Qué ecuación coincide con la tabla?`,
      right,
      wrong,
      viz: tableViz(cx, xs, ys, null),
      ...text({
        x: [
          `In every row, ${sayRule(type, k)[0].replace("y", cx.yl).replace("x", cx.xl)}. For example, ${type === "mul" ? `${fmt(k)} × ${xs[0]} = ${ys[0]}` : `${xs[0]} + ${fmt(k)} = ${ys[0]}`}. So the equation is ${right}.`,
          `En cada fila, ${sayRule(type, k)[1].replace("y", cx.yl).replace("x", cx.xl)}. Por ejemplo, ${type === "mul" ? `${fmt(k)} × ${xs[0]} = ${ys[0]}` : `${xs[0]} + ${fmt(k)} = ${ys[0]}`}. Entonces la ecuación es ${right}.`,
        ],
        h: [
          [
            "Find how the output comes from the input in the first row.",
            "Halla cómo se obtiene la salida de la entrada en la primera fila.",
          ],
          [
            "Test each equation on a row. An equation must work for EVERY row.",
            "Prueba cada ecuación en una fila. Una ecuación debe funcionar en TODAS las filas.",
          ],
          [
            `Put ${xs[1]} in place of ${cx.xl} in an equation. Do you get ${ys[1]}?`,
            `Pon ${xs[1]} en lugar de ${cx.xl} en una ecuación. ¿Obtienes ${ys[1]}?`,
          ],
        ],
      }),
      meta: { kind: "rule", xl: cx.xl, yl: cx.yl, xs, ys },
    });
  };

  const tvLarge = (rng) => {
    const type = rng.chance(0.55) ? "mul" : "add";
    const cx = rng.pick(REL[type]);
    const k = rateFor(rng, 3, type);
    const xs = rng.pick([
      [2, 5, 9],
      [3, 4, 8],
      [1, 6, 10],
      [2, 7, 9],
    ]);
    const ys = xs.map((x) => relY(type, k, x));
    const X = rng.pick([40, 50, 60, 75, 100, 120, 150, 200]);
    const ans = relY(type, k, X);
    const fw = [];
    const add = (v, tag, f, fEs) => v !== ans && fw.push({ v: fmt(v), tag, f, fEs });
    if (type === "mul")
      add(
        clean(X + k),
        "added-instead",
        "That adds the rate to the input. The output is the rate TIMES the input.",
        "Eso suma la tasa a la entrada. La salida es la tasa POR la entrada.",
      );
    else
      add(
        clean(X * k),
        "multiplied-instead",
        "That multiplies. In this table the output is the input PLUS a fixed amount.",
        "Eso multiplica. En esta tabla la salida es la entrada MÁS una cantidad fija.",
      );
    add(
      clean(ys[2] + (X - xs[2])),
      "continued-by-one",
      "The output does not go up by 1 for each step in the input. Use the rule.",
      "La salida no sube de 1 en 1 por cada paso de la entrada. Usa la regla.",
    );
    return G.num({
      q: `The table shows how the ${yn0(cx)} depends on the ${xn0(cx)}. What is the ${yn0(cx)} when the ${xn0(cx)} is ${X}?`,
      qEs: `La tabla muestra cómo ${yn1(cx)} depende de ${xn1(cx)}. ¿Cuánto es ${yn1(cx)} cuando ${xn1(cx)} es ${X}?`,
      a: fmt(ans),
      fw,
      viz: tableViz(cx, xs, ys, null),
      ...text({
        x: [
          `The rule: ${sayRule(type, k)[0]}. Continuing the table row by row would take a long time, so use the rule: ${type === "mul" ? `${fmt(k)} × ${X}` : `${X} + ${fmt(k)}`} = ${fmt(ans)}.`,
          `La regla: ${sayRule(type, k)[1]}. Seguir la tabla fila por fila tomaría mucho tiempo, así que usa la regla: ${type === "mul" ? `${fmt(k)} × ${X}` : `${X} + ${fmt(k)}`} = ${fmt(ans)}.`,
        ],
        h: [
          [
            "First find the rule from the rows in the table. Test it on all three rows.",
            "Primero halla la regla con las filas de la tabla. Pruébala en las tres filas.",
          ],
          [
            "Writing out the table up to a big input is slow. A rule is faster.",
            "Escribir la tabla hasta una entrada grande es lento. Una regla es más rápida.",
          ],
          [`Put ${X} into your rule as the input.`, `Pon ${X} en tu regla como entrada.`],
        ],
      }),
      meta: { kind: "large", rows: xs.map((x, i) => [x, ys[i]]), X },
    });
  };

  const TV_KINDS = {
    1: [
      ["roles", 4],
      ["complete", 4],
    ],
    2: [
      ["complete", 4],
      ["rule", 3],
      ["roles", 1],
    ],
    3: [
      ["rule", 4],
      ["complete", 3],
      ["roles", 1],
    ],
    4: [
      ["large", 5],
      ["rule", 3],
    ],
  };
  G.register("twoVarTable", {
    title: "Tables and rules for two variables",
    titleEs: "Tablas y reglas con dos variables",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, TV_KINDS[level]);
      if (kind === "roles") return tvRoles(rng, level);
      if (kind === "complete") return tvComplete(rng, level);
      if (kind === "rule") return tvRule(rng, level);
      return tvLarge(rng);
    },
    check(item) {
      const m = item.meta;
      if (m.kind === "roles") {
        const want = m.ind ? m.x : m.y;
        return item.c[item.a] === want && item.c.filter((c) => c === want).length === 1
          ? true
          : "keyed role is not the one the situation names";
      }
      if (m.kind === "rule") {
        const ok = item.c.map((c) => rowsHold(c, m.xl, m.yl, m.xs, m.ys));
        if (item.viz.rows.some((r, i) => r[0] !== m.xs[i] || r[1] !== m.ys[i]))
          return "the table does not show the numbers of the problem";
        return ok.filter(Boolean).length === 1 && ok[item.a]
          ? true
          : "the keyed equation is not the only one that fits every row";
      }
      const known = m.rows.filter((r) => r[1] !== null);
      const rule = inferRule(
        known.map((r) => r[0]),
        known.map((r) => r[1]),
      );
      if (!rule) return "the rows do not follow a single rule";
      const x = m.kind === "large" ? m.X : m.rows.find((r) => r[1] === null)[0];
      const want = rule.type === "mul" ? rule.k * x : x + rule.k;
      if (m.kind === "complete" && item.viz.rows.some((r, i) => r[0] !== m.rows[i][0]))
        return "the table does not show the numbers of the problem";
      return near(G.value(item.a), want)
        ? true
        : "typed value disagrees with the rule read from the table";
    },
  });

  /* ====================================================================================================
   * 9-2  graphRelationship
   * ================================================================================================== */
  const CONSTANT = mk2(
    ["number of rides", "número de viajes"],
    ["cost of the pass in dollars", "costo del pase en dólares"],
    "r",
    "c",
    ["Rides", "Cost ($)"],
    ["Viajes", "Costo ($)"],
    () => ["", ""],
    null,
    ["the name of the park", "el nombre del parque"],
  );
  const graphOf = (rng, level, type, xsIn) => {
    const cx = rng.pick(REL[type]);
    const k = rateFor(rng, level, type);
    const xs = xsIn || [0, 1, 2, 3, 4, 5];
    const ys = xs.map((x) => relY(type, k, x));
    return {
      cx,
      k,
      type,
      xs,
      ys,
      viz: coordViz(cx, xs, ys, type === "mul" && k <= 15 ? { ystep: k } : {}),
    };
  };
  const gHead = (cx) => [
    `The graph shows how the ${yn0(cx)} depends on the ${xn0(cx)}.`,
    `La gráfica muestra cómo ${yn1(cx)} depende de ${xn1(cx)}.`,
  ];
  const gReadY = (rng, level) => {
    const g = graphOf(rng, level, level === 1 ? "mul" : rng.chance(0.6) ? "mul" : "add");
    const x = rng.pick(level === 1 ? [2, 3, 4] : [3, 4, 5]);
    const ans = g.ys[x];
    const fw = [
      {
        v: String(x),
        tag: "read-x-for-y",
        f: `${x} is the horizontal value you were given. The question asks for the vertical value of the point.`,
        fEs: `${x} es el valor horizontal que te dieron. La pregunta pide el valor vertical del punto.`,
      },
      {
        v: fmt(g.ys[1]),
        tag: "read-wrong-point",
        f: "That is the value for 1, not for the number you were asked about. Find the right point.",
        fEs: "Ese es el valor para 1, no para el número por el que se pregunta. Encuentra el punto correcto.",
      },
    ].filter((w) => w.v !== fmt(ans));
    return G.num({
      q: `${gHead(g.cx)[0]} What is the ${yn0(g.cx)} when the ${xn0(g.cx)} is ${x}?`,
      qEs: `${gHead(g.cx)[1]} ¿Cuánto es ${yn1(g.cx)} cuando ${xn1(g.cx)} es ${x}?`,
      a: fmt(ans),
      fw,
      viz: g.viz,
      ...text({
        x: [
          `Find ${x} on the horizontal axis, go up to the point, and read across: the point is (${x}, ${fmt(ans)}). The ${yn0(g.cx)} is ${fmt(ans)}.`,
          `Ubica ${x} en el eje horizontal, sube hasta el punto y lee hacia el lado: el punto es (${x}, ${fmt(ans)}). ${cap(yn1(g.cx))} es ${fmt(ans)}.`,
        ],
        h: [
          [
            "The horizontal axis shows the first number of a point; the vertical axis shows the second.",
            "El eje horizontal muestra el primer número de un punto; el eje vertical muestra el segundo.",
          ],
          [`Find ${x} on the horizontal axis.`, `Ubica ${x} en el eje horizontal.`],
          [
            `Go straight up from ${x} until you reach a point, then read the vertical axis.`,
            `Sube en línea recta desde ${x} hasta llegar a un punto y lee el eje vertical.`,
          ],
        ],
      }),
      meta: { kind: "readY", x, pts: g.viz.points },
    });
  };
  const gReadX = (rng, level) => {
    const g = graphOf(rng, level, rng.chance(0.6) ? "mul" : "add");
    const x = rng.pick([2, 3, 4, 5]);
    const y = g.ys[x];
    return G.num({
      q: `${gHead(g.cx)[0]} For what ${xn0(g.cx)} is the ${yn0(g.cx)} equal to ${fmt(y)}?`,
      qEs: `${gHead(g.cx)[1]} ¿Para qué ${xn1(g.cx)} es ${yn1(g.cx)} igual a ${fmt(y)}?`,
      a: String(x),
      fw: [
        {
          v: fmt(y),
          tag: "read-y-for-x",
          f: `${fmt(y)} is the vertical value you were given. The question asks for the horizontal value of that point.`,
          fEs: `${fmt(y)} es el valor vertical que te dieron. La pregunta pide el valor horizontal de ese punto.`,
        },
      ],
      viz: g.viz,
      ...text({
        x: [
          `Find ${fmt(y)} on the vertical axis and move across to the point (${x}, ${fmt(y)}). Then read down: the ${xn0(g.cx)} is ${x}.`,
          `Ubica ${fmt(y)} en el eje vertical y muévete hasta el punto (${x}, ${fmt(y)}). Luego lee hacia abajo: ${xn1(g.cx)} es ${x}.`,
        ],
        h: [
          [
            "This time you start from the vertical axis.",
            "Esta vez empiezas desde el eje vertical.",
          ],
          [
            `Find ${fmt(y)} on the vertical axis and move across to the point.`,
            `Ubica ${fmt(y)} en el eje vertical y muévete hacia el punto.`,
          ],
          [
            "Read down from that point to the horizontal axis.",
            "Lee hacia abajo desde ese punto hasta el eje horizontal.",
          ],
        ],
      }),
      meta: { kind: "readX", y, pts: g.viz.points },
    });
  };
  const TRENDS = [
    ["It goes up.", "Sube."],
    ["It stays the same.", "Se queda igual."],
    ["It goes down.", "Baja."],
    ["It goes up, then down.", "Sube y luego baja."],
  ];
  const gTrend = (rng) => {
    const constant = rng.chance(0.4);
    let cx;
    let xs = [0, 1, 2, 3, 4, 5];
    let ys;
    if (constant) {
      cx = CONSTANT;
      const c = rng.int(3, 9);
      ys = xs.map(() => c);
    } else {
      const type = rng.chance(0.6) ? "mul" : "add";
      cx = rng.pick(REL[type]);
      const k = rateFor(rng, 2, type);
      ys = xs.map((x) => relY(type, k, x));
    }
    const want = constant ? 1 : 0;
    return mcx(rng, {
      q: `${gHead(cx)[0]} As the ${xn0(cx)} goes up, what happens to the ${yn0(cx)}?`,
      qEs: `${gHead(cx)[1]} A medida que ${xn1(cx)} aumenta, ¿qué pasa con ${yn1(cx)}?`,
      right: { v: TRENDS[want][0], vEs: TRENDS[want][1] },
      wrong: TRENDS.filter((_, i) => i !== want).map((t, i) =>
        wr(
          t[0],
          [
            constant
              ? "Look at the points: they are all at the same height."
              : "Look at the points from left to right. Do they rise, stay level, or fall?",
            constant
              ? "Mira los puntos: todos están a la misma altura."
              : "Mira los puntos de izquierda a derecha. ¿Suben, se mantienen al mismo nivel o bajan?",
          ],
          ["wrong-trend", "wrong-trend", "wrong-trend"][i],
          t[1],
        ),
      ),
      viz: coordViz(cx, xs, ys),
      ...text({
        x: [
          constant
            ? "Every point is at the same height, so the vertical value never changes. The cost stays the same."
            : "Each point is higher than the one before it, so the vertical value keeps going up.",
          constant
            ? "Todos los puntos están a la misma altura, así que el valor vertical nunca cambia. El costo se queda igual."
            : "Cada punto está más alto que el anterior, así que el valor vertical sigue subiendo.",
        ],
        h: [
          ["Read the points from left to right.", "Lee los puntos de izquierda a derecha."],
          [
            "Compare the height of each point with the one before it.",
            "Compara la altura de cada punto con la del anterior.",
          ],
          [
            "Is each point higher, the same height, or lower?",
            "¿Cada punto está más alto, a la misma altura o más bajo?",
          ],
        ],
      }),
      meta: { kind: "trend", constant },
    });
  };
  const gEq = (rng, level) => {
    const type = rng.chance(0.55) ? "mul" : "add";
    const plain = level === 2;
    const g = graphOf(rng, level, type);
    const cx = plain ? { ...g.cx, xl: "x", yl: "y" } : g.cx;
    const xs1 = g.xs.slice(1);
    const ys1 = g.ys.slice(1);
    const right = relEq(type, g.k, cx.xl, cx.yl);
    const wrong = ruleWrongs(type, g.k, cx.xl, cx.yl, xs1, ys1, plain).filter(
      (w) => !rowsHold(w.v, cx.xl, cx.yl, g.xs, g.ys),
    );
    return mcx(rng, {
      q: plain
        ? "Which equation matches the graph?"
        : `${gHead(g.cx)[0]} Let ${cx.xl} be the ${xn0(cx)} and ${cx.yl} be the ${yn0(cx)}. Which equation matches the graph?`,
      qEs: plain
        ? "¿Qué ecuación coincide con la gráfica?"
        : `${gHead(g.cx)[1]} Sea ${cx.xl}: ${xn1(cx)} y ${cx.yl}: ${yn1(cx)}. ¿Qué ecuación coincide con la gráfica?`,
      right,
      wrong,
      viz: g.viz,
      ...text({
        x: [
          `The point (1, ${fmt(g.ys[1])}) and the point (2, ${fmt(g.ys[2])}) both fit ${right}. ${type === "mul" ? "The graph passes through (0, 0)." : `The graph starts at (0, ${fmt(g.k)}).`}`,
          `El punto (1, ${fmt(g.ys[1])}) y el punto (2, ${fmt(g.ys[2])}) cumplen ${right}. ${type === "mul" ? "La gráfica pasa por (0, 0)." : `La gráfica empieza en (0, ${fmt(g.k)}).`}`,
        ],
        h: [
          [
            "Read two points from the graph as pairs (x, y).",
            "Lee dos puntos de la gráfica como pares (x, y).",
          ],
          [
            "Test each equation with those pairs. It must work for every point.",
            "Prueba cada ecuación con esos pares. Debe funcionar en todos los puntos.",
          ],
          [
            "Where does the graph cross the vertical axis? That helps tell the rules apart.",
            "¿Dónde cruza la gráfica el eje vertical? Eso ayuda a distinguir las reglas.",
          ],
        ],
      }),
      meta: { kind: "eq", xl: cx.xl, yl: cx.yl },
    });
  };
  const gUnit = (rng, level) => {
    const g = graphOf(rng, level, "mul");
    const k = g.k;
    const pair = (a, b) => `(${fmt(a)}, ${fmt(b)})`;
    const cands = [
      [
        pair(k, 1),
        "swapped-coordinates",
        [
          "The coordinates are in the wrong order. The first number is the horizontal value, which counts the units.",
          "Las coordenadas están en el orden equivocado. El primer número es el valor horizontal, que cuenta las unidades.",
        ],
      ],
      [
        pair(2, 2 * k),
        "used-two-units",
        ["That point is for 2 units, not for 1.", "Ese punto es para 2 unidades, no para 1."],
      ],
      [
        pair(0, 0),
        "origin-as-rate",
        [
          "The origin is for 0 units. The rate is for 1 unit.",
          "El origen es para 0 unidades. La tasa es para 1 unidad.",
        ],
      ],
      [
        pair(5, 5 * k),
        "used-last-point",
        [
          "That point is for 5 units. The rate is for 1 unit.",
          "Ese punto es para 5 unidades. La tasa es para 1 unidad.",
        ],
      ],
    ].filter(([t]) => t !== pair(1, k));
    const cx = g.cx;
    return mcx(rng, {
      q: `${gHead(cx)[0]} Which ordered pair on the graph shows the ${yn0(cx)} for ${cx.one[0]}?`,
      qEs: `${gHead(cx)[1]} ¿Qué par ordenado de la gráfica muestra ${yn1(cx)} para ${cx.one[1]}?`,
      right: pair(1, k),
      wrong: cands.map(([t, tag, fb]) => wr(t, fb, tag)),
      viz: g.viz,
      ...text({
        x: [
          `The unit rate is the ${yn0(cx)} for ${cx.one[0]}: the point with horizontal value 1, which is (1, ${fmt(k)}).`,
          `La tasa unitaria es ${yn1(cx)} para ${cx.one[1]}: el punto con valor horizontal 1, que es (1, ${fmt(k)}).`,
        ],
        h: [
          [
            "The unit rate is for 1 unit. Which axis counts the units?",
            "La tasa unitaria es para 1 unidad. ¿Qué eje cuenta las unidades?",
          ],
          [
            "In an ordered pair, the horizontal value comes first.",
            "En un par ordenado, el valor horizontal va primero.",
          ],
          [
            "Find 1 on the horizontal axis and look for the point above it.",
            "Ubica 1 en el eje horizontal y busca el punto que está encima.",
          ],
        ],
      }),
      meta: { kind: "unit", k, pts: g.viz.points },
    });
  };
  const gRateFar = (rng, level) => {
    const g = graphOf(rng, level, "mul", [0, 2, 4, 6]);
    const cx = g.cx;
    const fw = [
      {
        v: fmt(g.ys[2]),
        tag: "rate-vs-total",
        f: "That is the value at the point for 4, not for 1. Divide it to find the value for 1.",
        fEs: "Ese es el valor del punto para 4, no para 1. Divídelo para hallar el valor para 1.",
      },
      {
        v: "4",
        tag: "read-x-for-y",
        f: "4 is the horizontal value. The question asks about the vertical value for 1.",
        fEs: "4 es el valor horizontal. La pregunta pide el valor vertical para 1.",
      },
    ];
    return G.num({
      q: `${gHead(cx)[0]} The graph has no point at 1. What is the ${yn0(cx)} for ${cx.one[0]}?`,
      qEs: `${gHead(cx)[1]} La gráfica no tiene un punto en 1. ¿Cuánto es ${yn1(cx)} para ${cx.one[1]}?`,
      a: fmt(g.k),
      fw,
      viz: g.viz,
      ...text({
        x: [
          `Read a point, for example (4, ${fmt(g.ys[2])}). Divide by 4 to get the value for 1: ${fmt(g.ys[2])} ÷ 4 = ${fmt(g.k)}.`,
          `Lee un punto, por ejemplo (4, ${fmt(g.ys[2])}). Divide entre 4 para obtener el valor para 1: ${fmt(g.ys[2])} ÷ 4 = ${fmt(g.k)}.`,
        ],
        h: [
          ["Pick one point you can read exactly.", "Elige un punto que puedas leer con exactitud."],
          [
            "The point shows the total for several units. How do you find the amount for 1 unit?",
            "El punto muestra el total de varias unidades. ¿Cómo hallas la cantidad para 1 unidad?",
          ],
          [
            "Divide the vertical value by the horizontal value.",
            "Divide el valor vertical entre el valor horizontal.",
          ],
        ],
      }),
      meta: { kind: "rateFar", pts: g.viz.points },
    });
  };
  const gExtend = (rng) => {
    const type = rng.chance(0.55) ? "mul" : "add";
    const g = graphOf(rng, 3, type);
    const cx = g.cx;
    const X = rng.pick([10, 12, 15, 20]);
    const ans = relY(type, g.k, X);
    return G.num({
      q: `${gHead(cx)[0]} The graph stops at ${g.xs[g.xs.length - 1]}. What would the ${yn0(cx)} be when the ${xn0(cx)} is ${X}?`,
      qEs: `${gHead(cx)[1]} La gráfica termina en ${g.xs[g.xs.length - 1]}. ¿Cuánto sería ${yn1(cx)} cuando ${xn1(cx)} es ${X}?`,
      a: fmt(ans),
      fw:
        type === "mul"
          ? [
              {
                v: fmt(clean(X + g.k)),
                tag: "added-instead",
                f: "That adds the rate to the input. The output is the rate TIMES the input.",
                fEs: "Eso suma la tasa a la entrada. La salida es la tasa POR la entrada.",
              },
            ]
          : [
              {
                v: fmt(clean(X * g.k)),
                tag: "multiplied-instead",
                f: "That multiplies. On this graph the output is the input PLUS a fixed amount.",
                fEs: "Eso multiplica. En esta gráfica la salida es la entrada MÁS una cantidad fija.",
              },
            ],
      viz: g.viz,
      ...text({
        x: [
          `Read the rule from the points: ${sayRule(type, g.k)[0]}. Then ${type === "mul" ? `${fmt(g.k)} × ${X}` : `${X} + ${fmt(g.k)}`} = ${fmt(ans)}.`,
          `Lee la regla de los puntos: ${sayRule(type, g.k)[1]}. Entonces ${type === "mul" ? `${fmt(g.k)} × ${X}` : `${X} + ${fmt(g.k)}`} = ${fmt(ans)}.`,
        ],
        h: [
          [
            "The graph is too short to read the answer. Find the rule instead.",
            "La gráfica es demasiado corta para leer la respuesta. Halla mejor la regla.",
          ],
          [
            "Read two points and see how the output comes from the input.",
            "Lee dos puntos y mira cómo se obtiene la salida a partir de la entrada.",
          ],
          [`Use the rule with the input ${X}.`, `Usa la regla con la entrada ${X}.`],
        ],
      }),
      meta: { kind: "extend", X, pts: g.viz.points },
    });
  };
  /* two graphs on one grid; A and B are labelled at their last points */
  const STMT = (id, X) =>
    ({
      up: ["Both graphs go up as x increases.", "Las dos gráficas suben cuando x aumenta."],
      origin: ["Both graphs start at (0, 0).", "Las dos gráficas empiezan en (0, 0)."],
      same: [
        `The graphs have the same y-value when x = ${X}.`,
        `Las gráficas tienen el mismo valor de y cuando x = ${X}.`,
      ],
      aAbove: [
        "Graph A is above graph B for every x greater than 0.",
        "La gráfica A está por encima de la B para todo x mayor que 0.",
      ],
      bAbove: [
        "Graph B is above graph A for every x greater than 0.",
        "La gráfica B está por encima de la A para todo x mayor que 0.",
      ],
      onlyA: [
        "Graph A starts at (0, 0), but graph B does not.",
        "La gráfica A empieza en (0, 0), pero la B no.",
      ],
      steeper: ["Graph B rises faster than graph A.", "La gráfica B sube más rápido que la A."],
    })[id];
  const STMT_RULES = {
    up: (A, B) => [A, B].every((s) => s.every((y, i) => i === 0 || y > s[i - 1])),
    origin: (A, B) => A[0] === 0 && B[0] === 0,
    same: (A, B, X) => A[X] === B[X],
    aAbove: (A, B) => A.every((y, i) => i === 0 || y > B[i]),
    bAbove: (A, B) => B.every((y, i) => i === 0 || y > A[i]),
    onlyA: (A, B) => A[0] === 0 && B[0] !== 0,
    steeper: (A, B) => B[B.length - 1] - B[0] > A[A.length - 1] - A[0],
  };
  const gBoth = (rng) => {
    for (let tries = 0; tries < 80; tries++) {
      const xs = [0, 1, 2, 3, 4];
      const kA = rng.int(2, 6);
      const typeB = rng.chance(0.5) ? "mul" : "add";
      const kB = typeB === "mul" ? rng.int(2, 6) : rng.int(2, 8);
      if (typeB === "mul" && kB === kA) continue;
      const A = xs.map((x) => relY("mul", kA, x));
      const B = xs.map((x) => relY(typeB, kB, x));
      const stmts = [];
      for (const id of ["up", "origin", "aAbove", "bAbove", "onlyA", "steeper"])
        stmts.push({ id, X: 0 });
      const cross = xs.find((x) => x > 0 && A[x] === B[x]);
      if (cross) stmts.push({ id: "same", X: cross });
      for (const X of rng.shuffle([1, 2, 3, 4]).slice(0, 2))
        if (X !== cross) stmts.push({ id: "same", X });
      const truthy = stmts.filter((s) => STMT_RULES[s.id](A, B, s.X));
      const falsy = stmts.filter((s) => !STMT_RULES[s.id](A, B, s.X));
      if (truthy.length < 1 || falsy.length < 3) continue;
      const key = rng.pick(truthy);
      const wrongs = rng
        .shuffle(falsy)
        .filter((s, i, a) => a.findIndex((t) => t.id === s.id) === i)
        .slice(0, 3);
      if (wrongs.length < 3) continue;
      const pts = [...xs.map((x, i) => ({ x, y: A[i] })), ...xs.map((x, i) => ({ x, y: B[i] }))];
      const labels = pts.map((_, i) => (i === 4 ? "A" : i === 9 ? "B" : null));
      const viz = coordViz(
        { hd: ["x", "y"], hdEs: ["x", "y"] },
        pts.map((p) => p.x),
        pts.map((p) => p.y),
        {
          labels,
          segments: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [5, 6],
            [6, 7],
            [7, 8],
            [8, 9],
          ],
        },
      );
      const tagOf = {
        up: "ignored-slope",
        origin: "ignored-start",
        same: "assumed-crossing",
        aAbove: "wrong-comparison",
        bAbove: "wrong-comparison",
        onlyA: "ignored-start",
        steeper: "wrong-comparison",
      };
      return mcx(rng, {
        q: "The graph shows two relationships, A and B. Which statement is true?",
        qEs: "La gráfica muestra dos relaciones, A y B. ¿Qué enunciado es verdadero?",
        right: { v: STMT(key.id, key.X)[0], vEs: STMT(key.id, key.X)[1] },
        wrong: wrongs.map((s) =>
          wr(
            STMT(s.id, s.X)[0],
            [
              "Check this statement against the points: compare the y-values of the two graphs at the same x.",
              "Comprueba este enunciado con los puntos: compara los valores de y de las dos gráficas con el mismo x.",
            ],
            tagOf[s.id],
            STMT(s.id, s.X)[1],
          ),
        ),
        viz,
        ...text({
          x: [
            `Graph A has the points ${A.slice(0, 3)
              .map((y, i) => `(${i}, ${y})`)
              .join(", ")}, and graph B has ${B.slice(0, 3)
              .map((y, i) => `(${i}, ${y})`)
              .join(
                ", ",
              )}. Checking each statement against these points, only “${STMT(key.id, key.X)[0]}” is true.`,
            `La gráfica A tiene los puntos ${A.slice(0, 3)
              .map((y, i) => `(${i}, ${y})`)
              .join(", ")}, y la B tiene ${B.slice(0, 3)
              .map((y, i) => `(${i}, ${y})`)
              .join(
                ", ",
              )}. Al comprobar cada enunciado con estos puntos, solo “${STMT(key.id, key.X)[1]}” es verdadero.`,
          ],
          h: [
            [
              "Read a few points from each graph as pairs (x, y).",
              "Lee algunos puntos de cada gráfica como pares (x, y).",
            ],
            ["Where does each graph start, at x = 0?", "¿Dónde empieza cada gráfica, en x = 0?"],
            [
              "Compare the two y-values at the same x for several values of x.",
              "Compara los dos valores de y con el mismo x para varios valores de x.",
            ],
          ],
        }),
        meta: { kind: "both" },
      });
    }
    return gReadY(rng, 2);
  };
  const GR_KINDS = {
    1: [
      ["readY", 4],
      ["trend", 4],
    ],
    2: [
      ["readY", 3],
      ["readX", 3],
      ["eq", 2],
      ["unit", 2],
    ],
    3: [
      ["eq", 3],
      ["unit", 2],
      ["rateFar", 3],
      ["readX", 1],
    ],
    4: [
      ["both", 4],
      ["extend", 3],
      ["eq", 2],
    ],
  };
  const stmtId = (t) => {
    if (/^Both graphs go up/.test(t)) return ["up", 0];
    if (/^Both graphs start/.test(t)) return ["origin", 0];
    const m = /same y-value when x = (\d)/.exec(t);
    if (m) return ["same", Number(m[1])];
    if (/^Graph A is above/.test(t)) return ["aAbove", 0];
    if (/^Graph B is above/.test(t)) return ["bAbove", 0];
    if (/^Graph A starts/.test(t)) return ["onlyA", 0];
    if (/rises faster/.test(t)) return ["steeper", 0];
    return [null, 0];
  };
  const ptAt = (pts, x) => pts.find((p) => p.x === x)?.y;
  G.register("graphRelationship", {
    title: "Read a graph of a relationship",
    titleEs: "Leer la gráfica de una relación",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, GR_KINDS[level]);
      if (kind === "readY") return gReadY(rng, level);
      if (kind === "readX") return gReadX(rng, level);
      if (kind === "trend") return gTrend(rng);
      if (kind === "eq") return gEq(rng, level);
      if (kind === "unit") return gUnit(rng, level);
      if (kind === "rateFar") return gRateFar(rng, level);
      if (kind === "extend") return gExtend(rng);
      return gBoth(rng);
    },
    check(item) {
      const m = item.meta;
      const pts = item.viz.points;
      if (m.kind === "readY")
        return near(G.value(item.a), ptAt(pts, m.x))
          ? true
          : "typed value is not the y of the plotted point";
      if (m.kind === "readX")
        return pts.some((p) => p.y === m.y && near(p.x, G.value(item.a)))
          ? true
          : "typed value is not the x of the plotted point";
      if (m.kind === "trend") {
        const ys = pts.map((p) => p.y);
        const up = ys.every((y, i) => i === 0 || y > ys[i - 1]);
        const flat = ys.every((y) => y === ys[0]);
        const label = item.c[item.a];
        return (up && label === "It goes up.") || (flat && label === "It stays the same.")
          ? true
          : "keyed trend does not match the plotted points";
      }
      if (m.kind === "eq") {
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        const ok = item.c.map((c) => rowsHold(c, m.xl, m.yl, xs, ys));
        return ok.filter(Boolean).length === 1 && ok[item.a]
          ? true
          : "the keyed equation is not the only one that fits every plotted point";
      }
      if (m.kind === "unit") {
        const ok = item.c.map((c) => {
          const r = /^\((.+), (.+)\)$/.exec(c);
          return (
            r &&
            near(Number(r[1]), 1) &&
            pts.some((p) => near(p.x, Number(r[1])) && near(p.y, Number(r[2])))
          );
        });
        return ok.filter(Boolean).length === 1 && ok[item.a]
          ? true
          : "the keyed pair is not the only plotted point with x = 1";
      }
      if (m.kind === "rateFar") {
        const rule = inferRule(
          pts.filter((p) => p.x > 0).map((p) => p.x),
          pts.filter((p) => p.x > 0).map((p) => p.y),
        );
        return rule && rule.type === "mul" && near(G.value(item.a), rule.k)
          ? true
          : "typed rate does not match y ÷ x on the graph";
      }
      if (m.kind === "extend") {
        const rule = inferRule(
          pts.map((p) => p.x),
          pts.map((p) => p.y),
        );
        if (!rule) return "plotted points follow no single rule";
        return near(G.value(item.a), rule.type === "mul" ? rule.k * m.X : m.X + rule.k)
          ? true
          : "typed value disagrees with the rule read from the graph";
      }
      const half = pts.length / 2;
      const A = pts.slice(0, half).map((p) => p.y);
      const B = pts.slice(half).map((p) => p.y);
      const ok = item.c.map((c) => {
        const [id, X] = stmtId(c);
        return id ? STMT_RULES[id](A, B, X) : false;
      });
      return ok.filter(Boolean).length === 1 && ok[item.a]
        ? true
        : "the keyed statement is not the only true one";
    },
  });

  /* ====================================================================================================
   * 9-4  twoVarProblem
   * ================================================================================================== */
  const rhsAt = (eqTxt, xl, x) =>
    evalExpr(eqTxt.split(" = ")[1].replace(new RegExp(xl, "g"), `(${x})`));
  const tpForward = (rng, level) => {
    const type = relType(rng, level);
    const cx = rng.pick(REL[type]);
    const k = rateFor(rng, level, type);
    const X = rng.int(4, 14);
    const eq = relEq(type, k, cx.xl, cx.yl);
    const ans = relY(type, k, X);
    const sent = cx.sent(k);
    const fw =
      type === "mul"
        ? [
            {
              v: fmt(clean(X + k)),
              tag: "added-instead",
              f: "That adds the rate to the input. The rate applies to EVERY one, so multiply.",
              fEs: "Eso suma la tasa a la entrada. La tasa se aplica a CADA uno, así que multiplica.",
            },
          ]
        : [
            {
              v: fmt(clean(X * k)),
              tag: "multiplied-instead",
              f: "That multiplies. In this relationship you add the fixed amount.",
              fEs: "Eso multiplica. En esta relación se suma la cantidad fija.",
            },
          ];
    return G.num({
      q: `${sent[0]} The equation ${eq} shows this relationship. What is the ${yn0(cx)} when the ${xn0(cx)} is ${X}?`,
      qEs: `${sent[1]} La ecuación ${eq} muestra esta relación. ¿Cuánto es ${yn1(cx)} cuando ${xn1(cx)} es ${X}?`,
      a: fmt(ans),
      fw,
      ...text({
        x: [
          `Substitute ${cx.xl} = ${X}: ${cx.yl} = ${type === "mul" ? `${fmt(k)} × ${X}` : `${X} + ${fmt(k)}`} = ${fmt(ans)}.`,
          `Sustituye ${cx.xl} = ${X}: ${cx.yl} = ${type === "mul" ? `${fmt(k)} × ${X}` : `${X} + ${fmt(k)}`} = ${fmt(ans)}.`,
        ],
        h: [
          [
            "Replace the input variable in the equation with the number.",
            "Reemplaza la variable de entrada de la ecuación con el número.",
          ],
          [
            `Write the equation with ${X} in place of ${cx.xl}.`,
            `Escribe la ecuación con ${X} en lugar de ${cx.xl}.`,
          ],
          [
            "Now do the operation shown in the equation.",
            "Ahora haz la operación que muestra la ecuación.",
          ],
        ],
      }),
      meta: { kind: "forward", eq, xl: cx.xl, X },
    });
  };
  /** the output is known; find the input */
  const tpBackward = (rng, level) => {
    const type = rng.chance(0.7) ? "mul" : "add";
    const cx = rng.pick(REL[type]);
    const k = rateFor(rng, level, type);
    const x0 = rng.int(4, 14);
    const Y = relY(type, k, x0);
    const eq = relEq(type, k, cx.xl, cx.yl);
    const sent = cx.sent(k);
    const fw = [
      {
        v: fmt(Y),
        tag: "read-y-for-x",
        f: `${fmt(Y)} is the ${yn0(cx)} you were given. The question asks for the ${xn0(cx)}.`,
        fEs: `${fmt(Y)} es ${yn1(cx)} que te dieron. La pregunta pide ${xn1(cx)}.`,
      },
      type === "mul"
        ? {
            v: fmt(clean(Y * k)),
            tag: "multiplied-instead",
            f: "That multiplies. Multiplying by the rate is how you go from input to output; here you go backward.",
            fEs: "Eso multiplica. Multiplicar por la tasa sirve para ir de la entrada a la salida; aquí vas hacia atrás.",
          }
        : {
            v: fmt(clean(Y + k)),
            tag: "added-instead",
            f: "That adds. Going backward from the output means undoing the addition.",
            fEs: "Eso suma. Ir hacia atrás desde la salida significa deshacer la suma.",
          },
    ];
    if (type === "mul")
      fw.push({
        v: fmt(clean(Y - k)),
        tag: "equation-not-inverse-operation",
        f: "Subtracting does not undo a multiplication. Use the inverse operation.",
        fEs: "Restar no deshace una multiplicación. Usa la operación inversa.",
      });
    const base = {
      x: [
        `Substitute ${cx.yl} = ${fmt(Y)} into ${eq}: ${type === "mul" ? `${fmt(k)}${cx.xl} = ${fmt(Y)}, so ${cx.xl} = ${fmt(Y)} ÷ ${fmt(k)}` : `${cx.xl} + ${fmt(k)} = ${fmt(Y)}, so ${cx.xl} = ${fmt(Y)} − ${fmt(k)}`} = ${x0}.`,
        `Sustituye ${cx.yl} = ${fmt(Y)} en ${eq}: ${type === "mul" ? `${fmt(k)}${cx.xl} = ${fmt(Y)}, así que ${cx.xl} = ${fmt(Y)} ÷ ${fmt(k)}` : `${cx.xl} + ${fmt(k)} = ${fmt(Y)}, así que ${cx.xl} = ${fmt(Y)} − ${fmt(k)}`} = ${x0}.`,
      ],
      h: [
        [
          "The output is given, so put it in the equation where the output variable is.",
          "La salida es dada, así que ponla en la ecuación donde está la variable de salida.",
        ],
        [
          `You now have a one-step equation in ${cx.xl}. Which operation undoes what is done to ${cx.xl}?`,
          `Ahora tienes una ecuación de un paso en ${cx.xl}. ¿Qué operación deshace lo que se le hace a ${cx.xl}?`,
        ],
        [
          `${type === "mul" ? `Divide both sides by ${fmt(k)}` : `Subtract ${fmt(k)} from both sides`}.`,
          `${type === "mul" ? `Divide ambos lados entre ${fmt(k)}` : `Resta ${fmt(k)} de ambos lados`}.`,
        ],
      ],
    };
    return { type, cx, k, x0, Y, eq, sent, fw, base };
  };
  const tpBack = (rng, level) => {
    const b = tpBackward(rng, level);
    const { cx } = b;
    return G.num({
      q: `${b.sent[0]} The equation ${b.eq} shows this relationship. The ${yn0(cx)} is ${fmt(b.Y)}. What is the ${xn0(cx)}?`,
      qEs: `${b.sent[1]} La ecuación ${b.eq} muestra esta relación. ${cap(yn1(cx))} es ${fmt(b.Y)}. ¿Cuánto es ${xn1(cx)}?`,
      a: String(b.x0),
      fw: b.fw,
      ...text(b.base),
      meta: { kind: "backward", eq: b.eq, xl: cx.xl, Y: b.Y },
    });
  };
  const tpTable = (rng, level, graph) => {
    const b = tpBackward(rng, level);
    const { cx, type, k } = b;
    const xs = graph
      ? [0, 1, 2, 3, 4, 5, 6]
      : rng.pick([
          [2, 4, 6],
          [1, 3, 5],
          [2, 3, 5],
        ]);
    const ys = xs.map((x) => relY(type, k, x));
    const beyond = !graph || level >= 3;
    const x0 = beyond ? rng.int(Math.max(...xs) + 2, Math.max(...xs) + 9) : rng.pick(xs.slice(2));
    const Y = relY(type, k, x0);
    const viz = graph
      ? coordViz(cx, xs, ys, type === "mul" && k <= 15 ? { ystep: k } : {})
      : tableViz(cx, xs, ys, null);
    return G.num({
      q: `${graph ? gHead(cx)[0] : `The table shows how the ${yn0(cx)} depends on the ${xn0(cx)}.`} For what ${xn0(cx)} is the ${yn0(cx)} equal to ${fmt(Y)}?${beyond ? " Keep the same pattern." : ""}`,
      qEs: `${graph ? gHead(cx)[1] : `La tabla muestra cómo ${yn1(cx)} depende de ${xn1(cx)}.`} ¿Para qué ${xn1(cx)} es ${yn1(cx)} igual a ${fmt(Y)}?${beyond ? " Sigue el mismo patrón." : ""}`,
      a: String(x0),
      fw: [
        {
          v: fmt(Y),
          tag: "read-y-for-x",
          f: `${fmt(Y)} is the ${yn0(cx)} you were given. The question asks for the ${xn0(cx)}.`,
          fEs: `${fmt(Y)} es ${yn1(cx)} que te dieron. La pregunta pide ${xn1(cx)}.`,
        },
        ...(type === "mul"
          ? [
              {
                v: fmt(clean(Y - k)),
                tag: "equation-not-inverse-operation",
                f: "Subtracting the rate does not undo multiplying by it.",
                fEs: "Restar la tasa no deshace multiplicar por ella.",
              },
            ]
          : []),
      ],
      viz,
      ...text({
        x: [
          `The rule is ${sayRule(type, k)[0]}. Work backward: ${type === "mul" ? `${fmt(Y)} ÷ ${fmt(k)}` : `${fmt(Y)} − ${fmt(k)}`} = ${x0}.`,
          `La regla es ${sayRule(type, k)[1]}. Trabaja hacia atrás: ${type === "mul" ? `${fmt(Y)} ÷ ${fmt(k)}` : `${fmt(Y)} − ${fmt(k)}`} = ${x0}.`,
        ],
        h: [
          [
            "First find the rule from the table or graph.",
            "Primero halla la regla con la tabla o la gráfica.",
          ],
          [
            "The output is given. Go backward: undo the operation in the rule.",
            "La salida es dada. Ve hacia atrás: deshaz la operación de la regla.",
          ],
          [
            `${type === "mul" ? "Division undoes multiplication" : "Subtraction undoes addition"}. Use it on ${fmt(Y)}.`,
            `${type === "mul" ? "La división deshace la multiplicación" : "La resta deshace la suma"}. Úsala con ${fmt(Y)}.`,
          ],
        ],
      }),
      meta: { kind: "lookup", Y },
    });
  };
  const tpAtLeast = (rng) => {
    const cx = rng.pick(REL.mul);
    const k = rng.int(3, 14);
    const x0 = rng.int(5, 20);
    const r = rng.int(1, k - 1);
    const Y = k * x0 + r;
    const ans = x0 + 1;
    const sent = cx.sent(k);
    return G.num({
      q: `${sent[0]} Find the least whole value of the ${xn0(cx)} that makes the ${yn0(cx)} at least ${Y}.`,
      qEs: `${sent[1]} Halla el menor valor entero de ${xn1(cx)} que hace que ${yn1(cx)} sea al menos ${Y}.`,
      a: String(ans),
      fw: [
        {
          v: String(x0),
          tag: "rounded-down",
          f: `${x0} is not enough: it falls short of ${Y}. You need a whole number that reaches it.`,
          fEs: `${x0} no alcanza: se queda corto de ${Y}. Necesitas un número entero que lo alcance.`,
        },
        {
          v: fmt(clean(Math.round((Y / k) * 100) / 100)),
          tag: "ignored-whole-number",
          f: "The answer must be a whole number here. Decide whether to round up or down.",
          fEs: "Aquí la respuesta debe ser un número entero. Decide si redondear hacia arriba o hacia abajo.",
        },
      ],
      ...text({
        x: [
          `${cx.yl} = ${fmt(k)}${cx.xl}, so ${fmt(k)}${cx.xl} ≥ ${Y} gives ${cx.xl} ≥ ${Y} ÷ ${k}, which is between ${x0} and ${x0 + 1}. ${x0} is too small (${k} × ${x0} = ${k * x0}), so round UP to ${ans}.`,
          `${cx.yl} = ${fmt(k)}${cx.xl}, así que ${fmt(k)}${cx.xl} ≥ ${Y} da ${cx.xl} ≥ ${Y} ÷ ${k}, que está entre ${x0} y ${x0 + 1}. ${x0} es muy poco (${k} × ${x0} = ${k * x0}), así que redondea HACIA ARRIBA a ${ans}.`,
        ],
        h: [
          [
            `Write the equation, then ask what “at least ${Y}” means.`,
            `Escribe la ecuación y luego pregunta qué significa “al menos ${Y}”.`,
          ],
          [
            `Divide ${Y} by ${k}. The result is not a whole number.`,
            `Divide ${Y} entre ${k}. El resultado no es un número entero.`,
          ],
          [
            "Test the whole number just below the result. Does it reach the goal?",
            "Prueba el número entero justo debajo del resultado. ¿Alcanza la meta?",
          ],
        ],
      }),
      meta: { kind: "atLeast", k, Y },
    });
  };
  const PLANS = [
    mk2(
      ["number of hours", "número de horas"],
      ["total cost in dollars", "costo total en dólares"],
      "h",
      "c",
      ["Hours", "Cost ($)"],
      ["Horas", "Costo ($)"],
      null,
      null,
      null,
    ),
    mk2(
      ["number of months", "número de meses"],
      ["total cost in dollars", "costo total en dólares"],
      "m",
      "c",
      ["Months", "Cost ($)"],
      ["Meses", "Costo ($)"],
      null,
      null,
      null,
    ),
    mk2(
      ["number of miles", "número de millas"],
      ["fare in dollars", "tarifa en dólares"],
      "d",
      "f",
      ["Miles", "Fare ($)"],
      ["Millas", "Tarifa ($)"],
      null,
      null,
      null,
    ),
    mk2(
      ["number of pages", "número de páginas"],
      ["printing cost in cents", "costo de impresión en centavos"],
      "p",
      "c",
      ["Pages", "Cost (¢)"],
      ["Páginas", "Costo (¢)"],
      null,
      null,
      null,
    ),
  ];
  const tpPlans = (rng) => {
    const cx = rng.pick(PLANS);
    const kA = rng.int(3, 14);
    let kB = rng.int(3, 14);
    if (kB === kA) kB = kA > 3 ? kA - 1 : kA + 1;
    const xs = rng.pick([
      [2, 4, 6],
      [1, 3, 5],
      [2, 5, 8],
    ]);
    const X = rng.int(8, 30);
    const eqA = relEq("mul", kA, cx.xl, cx.yl);
    return { cx, kA, kB, xs, ys: xs.map((x) => kB * x), X, eqA, a: kA * X, b: kB * X };
  };
  const tpCompare = (rng) => {
    const P = tpPlans(rng);
    const { cx, kA, kB, X } = P;
    const diff = Math.abs(P.a - P.b);
    return G.num({
      q: `Plan A is given by the equation ${P.eqA}. Plan B is shown in the table. When ${cx.xl} = ${X}, what is the difference between the ${yn0(cx)} of the two plans?`,
      qEs: `El Plan A está dado por la ecuación ${P.eqA}. El Plan B se muestra en la tabla. Cuando ${cx.xl} = ${X}, ¿cuál es la diferencia entre ${yn1(cx)} de los dos planes?`,
      a: String(diff),
      fw: [
        {
          v: String(Math.abs(kA - kB)),
          tag: "compared-rates-only",
          f: "That is the difference between the two rates, for one unit. The question uses the whole amount.",
          fEs: "Esa es la diferencia entre las dos tasas, para una unidad. La pregunta usa la cantidad completa.",
        },
        {
          v: String(P.a),
          tag: "one-plan-only",
          f: "That is the cost of one plan. The question asks for the difference between the two plans.",
          fEs: "Ese es el costo de un plan. La pregunta pide la diferencia entre los dos planes.",
        },
        {
          v: String(P.b),
          tag: "one-plan-only",
          f: "That is the cost of one plan. The question asks for the difference between the two plans.",
          fEs: "Ese es el costo de un plan. La pregunta pide la diferencia entre los dos planes.",
        },
      ].filter((w) => w.v !== String(diff)),
      viz: tableViz(cx, P.xs, P.ys, null),
      ...text({
        x: [
          `Plan A: ${kA} × ${X} = ${P.a}. The table shows Plan B is ${kB} times the input, so ${kB} × ${X} = ${P.b}. The difference is ${Math.max(P.a, P.b)} − ${Math.min(P.a, P.b)} = ${diff}.`,
          `Plan A: ${kA} × ${X} = ${P.a}. La tabla muestra que el Plan B es ${kB} veces la entrada, así que ${kB} × ${X} = ${P.b}. La diferencia es ${Math.max(P.a, P.b)} − ${Math.min(P.a, P.b)} = ${diff}.`,
        ],
        h: [
          [
            "Find the cost of each plan for the same input. Plan A uses the equation; Plan B uses the table.",
            "Halla el costo de cada plan con la misma entrada. El Plan A usa la ecuación; el Plan B usa la tabla.",
          ],
          [
            "For Plan B, find the rule from the table first.",
            "Para el Plan B, halla primero la regla con la tabla.",
          ],
          [
            "Subtract the smaller cost from the larger cost.",
            "Resta el costo menor del costo mayor.",
          ],
        ],
      }),
      meta: { kind: "compare", kA, X, rows: P.xs.map((x, i) => [x, P.ys[i]]) },
    });
  };
  const tpWhich = (rng) => {
    const P = tpPlans(rng);
    const { cx, kA, kB, X } = P;
    const cheaper = P.a < P.b ? "A" : "B";
    const other = cheaper === "A" ? "B" : "A";
    const lo = Math.min(P.a, P.b);
    const hi = Math.max(P.a, P.b);
    const say = (n, l, h) => ({
      v: `Plan ${n} costs less: $${l}, compared with $${h} for Plan ${n === "A" ? "B" : "A"}.`,
      vEs: `El Plan ${n} cuesta menos: $${l}, comparado con $${h} del Plan ${n === "A" ? "B" : "A"}.`,
    });
    const r = say(cheaper, lo, hi);
    const fb = (en, es) => [en, es];
    return mcx(rng, {
      q: `Plan A is given by the equation ${P.eqA}. Plan B is shown in the table. Which plan costs less when ${cx.xl} = ${X}?`,
      qEs: `El Plan A está dado por la ecuación ${P.eqA}. El Plan B se muestra en la tabla. ¿Qué plan cuesta menos cuando ${cx.xl} = ${X}?`,
      right: r,
      wrong: [
        wr(
          say(other, lo, hi).v,
          fb(
            "The amounts are right, but they belong to the other plan. Match each amount to its plan.",
            "Las cantidades son correctas, pero pertenecen al otro plan. Empareja cada cantidad con su plan.",
          ),
          "mixed-up-plans",
          say(other, lo, hi).vEs,
        ),
        wr(
          say(cheaper, Math.min(kA + X, kB + X), Math.max(kA + X, kB + X)).v,
          fb(
            "Those amounts come from adding the rate to the input. The cost is the rate TIMES the input.",
            "Esas cantidades salen de sumar la tasa a la entrada. El costo es la tasa POR la entrada.",
          ),
          "added-instead",
          say(cheaper, Math.min(kA + X, kB + X), Math.max(kA + X, kB + X)).vEs,
        ),
        wr(
          `The plans cost the same: $${hi} for both.`,
          fb(
            "Compare the rates: the two plans charge different amounts for each unit.",
            "Compara las tasas: los dos planes cobran distintas cantidades por cada unidad.",
          ),
          "assumed-equal",
          `Los planes cuestan lo mismo: $${hi} cada uno.`,
        ),
      ],
      viz: tableViz(cx, P.xs, P.ys, null),
      ...text({
        x: [
          `Plan A: ${kA} × ${X} = ${P.a}. Plan B (rate ${kB} from the table): ${kB} × ${X} = ${P.b}. Plan ${cheaper} costs less.`,
          `Plan A: ${kA} × ${X} = ${P.a}. Plan B (tasa ${kB} de la tabla): ${kB} × ${X} = ${P.b}. El Plan ${cheaper} cuesta menos.`,
        ],
        h: [
          [
            "Find each plan's cost for the same input.",
            "Halla el costo de cada plan con la misma entrada.",
          ],
          [
            "Plan B's rule comes from the table: how does the output come from the input?",
            "La regla del Plan B sale de la tabla: ¿cómo se obtiene la salida de la entrada?",
          ],
          [
            "Compare the two costs and name the smaller one.",
            "Compara los dos costos y nombra el menor.",
          ],
        ],
      }),
      meta: { kind: "which", kA, X, rows: P.xs.map((x, i) => [x, P.ys[i]]) },
    });
  };
  const TP_KINDS = {
    1: [
      ["forward", 4],
      ["backward", 4],
    ],
    2: [
      ["backward", 3],
      ["table", 3],
      ["graph", 2],
    ],
    3: [
      ["graph", 2],
      ["atLeast", 4],
      ["table", 2],
    ],
    4: [
      ["compare", 4],
      ["which", 3],
      ["atLeast", 2],
    ],
  };
  G.register("twoVarProblem", {
    title: "Solve problems with a relationship",
    titleEs: "Resolver problemas con una relación",
    levels: 4,
    make(rng, level) {
      const kind = wpick(rng, TP_KINDS[level]);
      if (kind === "forward") return tpForward(rng, level);
      if (kind === "backward") return tpBack(rng, level);
      if (kind === "table") return tpTable(rng, level, false);
      if (kind === "graph") return tpTable(rng, level, true);
      if (kind === "atLeast") return tpAtLeast(rng);
      if (kind === "compare") return tpCompare(rng);
      return tpWhich(rng);
    },
    check(item) {
      const m = item.meta;
      if (m.kind === "forward")
        return near(G.value(item.a), rhsAt(m.eq, m.xl, m.X))
          ? true
          : "typed value disagrees with the equation";
      if (m.kind === "backward")
        return near(rhsAt(m.eq, m.xl, G.value(item.a)), m.Y)
          ? true
          : "typed value does not give the stated output";
      if (m.kind === "lookup") {
        const pts =
          item.viz.t === "coord"
            ? item.viz.points
            : item.viz.rows.map((r) => ({ x: r[0], y: r[1] }));
        const rule = inferRule(
          pts.map((p) => p.x),
          pts.map((p) => p.y),
        );
        if (!rule) return "the figure follows no single rule";
        return near(rule.type === "mul" ? rule.k * G.value(item.a) : G.value(item.a) + rule.k, m.Y)
          ? true
          : "typed input does not give the stated output";
      }
      if (m.kind === "atLeast") {
        const n = G.value(item.a);
        return m.k * n >= m.Y && m.k * (n - 1) < m.Y
          ? true
          : "typed number is not the least whole number that reaches the goal";
      }
      const rule = inferRule(
        m.rows.map((r) => r[0]),
        m.rows.map((r) => r[1]),
      );
      if (!rule || rule.type !== "mul") return "the table is not a rate table";
      const a = m.kA * m.X;
      const b = rule.k * m.X;
      if (m.kind === "compare")
        return near(G.value(item.a), Math.abs(a - b)) ? true : "typed difference is not |A − B|";
      const ok = item.c.map((c) => {
        const r = /^Plan (A|B) costs less: \$(\d+), compared with \$(\d+) for Plan (A|B)\.$/.exec(
          c,
        );
        if (!r) return false;
        const cost = { A: a, B: b };
        return (
          r[1] !== r[4] &&
          cost[r[1]] === Number(r[2]) &&
          cost[r[4]] === Number(r[3]) &&
          cost[r[1]] < cost[r[4]]
        );
      });
      return ok.filter(Boolean).length === 1 && ok[item.a]
        ? true
        : "the keyed statement is not the only correct comparison";
    },
  });

  /*@@GEN-END@@*/
})();

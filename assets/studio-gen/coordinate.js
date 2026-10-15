/**
 * Practice Studio generators: integers and the coordinate plane (Unit 7, lessons 7-1 to 7-9).
 *
 *   integerOpposites rationalNumberLine absoluteValue compareOrder quadrantId coordDistance
 *   polygonCoordinates reflectPoint
 *
 * Conventions, so that no item is ambiguous:
 *  - Negatives print with a true minus ("−7"). Typed keys are plain ASCII ("-7"); StudioGen.value reads both.
 *  - Every wrong choice is a named misconception: item.tag[i] (multiple choice) or fw[i].tag (typed answer).
 *    The feedback for a tag lives once, in the FB library below, so a misconception reads the same in every
 *    item and the Mistake Map can name it. Feedback explains the slip and never prints the key.
 *  - item.cEs carries the Spanish choices when a choice has words.
 *  - make() computes with arithmetic; check() re-derives the key from item.meta (and from the figure spec or the
 *    displayed text the student sees) by a different route: opposites by the sum-to-zero test, distances by
 *    counting unit steps, quadrants by angle, reflections by the midpoint-on-the-mirror test, order by
 *    cross-multiplied integers.
 *  - Figure specs follow docs/specs/practice-studio-v2.md section 3 and carry the exact numbers of the stem.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  const M = "−";
  const f = G.fmt;

  /* ---- display ---------------------------------------------------------------------------------- */
  const S = (n) => (n < 0 ? M : "") + f(Math.abs(n));
  const P = (x, y) => `(${S(x)}, ${S(y)})`;
  const ABS = (n) => `|${S(n)}|`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pl = (n, one, many) => (Math.abs(n) === 1 ? one : many);
  /** The value k/den as a decimal, a fraction or a mixed number, with a true minus. */
  const R = (k, den, form) => {
    const a = Math.abs(k);
    const body = form === "dec" ? f(a / den) : form === "mixed" ? G.mixed(a, den) : G.frac(a, den);
    return (k < 0 ? M : "") + body;
  };
  const recip = (n) => `${n < 0 ? M : ""}1/${Math.abs(n)}`;
  const LABELS = [
    ["A", "B", "C", "D"],
    ["P", "Q", "R", "S"],
    ["W", "X", "Y", "Z"],
    ["J", "K", "L", "M"],
  ];
  const PT = ["P", "Q", "R", "S", "T", "W"];
  const NAMES = [
    "Maya",
    "Jordan",
    "Eli",
    "Priya",
    "Sam",
    "Luis",
    "Aisha",
    "Noah",
    "Ana",
    "Kofi",
    "Mei",
    "Omar",
  ];
  const sgn = (n) => (n < 0 ? -1 : 1);
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  /** A two-digit number whose digits are different and non-zero, so swapping them is a real slip. */
  const twoDigit = (rng, lo, hi) => {
    for (;;) {
      const v = rng.int(lo, hi);
      const t = Math.floor(v / 10);
      const o = v % 10;
      if (t && o && t !== o) return v;
    }
  };

  /* ---- the misconception library: tag -> [English, Spanish] (a function when it needs numbers) ---- */
  const FB = {
    "same-number": (L) =>
      L
        ? [
            `That is point ${L} itself. The opposite of a number is on the other side of 0, so it cannot be the same point.`,
            `Ese es el mismo punto ${L}. El opuesto de un número está del otro lado de 0, así que no puede ser el mismo punto.`,
          ]
        : [
            "That is the number you started with. An opposite is on the other side of 0.",
            "Ese es el mismo número de partida. Un opuesto está del otro lado del 0.",
          ],
    "doubled-distance": [
      "Opposites are the same distance from 0, not double the distance.",
      "Los opuestos están a la misma distancia de 0, no al doble de distancia.",
    ],
    reciprocal: [
      "That flips the number over (the reciprocal). An opposite keeps the number and changes its side of 0.",
      "Eso voltea el número (el recíproco). Un opuesto conserva el número y cambia de lado respecto a 0.",
    ],
    "dropped-negative": [
      "That ignores the key word. Words like below, loss, withdrawal, penalty and debt put an amount on the negative side of 0.",
      "Eso ignora la palabra clave. Palabras como bajo, pérdida, retiro, penalización y deuda ponen la cantidad del lado negativo de 0.",
    ],
    "added-negative": [
      "That makes the amount negative, but the key word points to the positive side. Words like above, gain, deposit and saved are positive.",
      "Eso vuelve negativa la cantidad, pero la palabra clave indica el lado positivo. Palabras como sobre, ganancia, depósito y ahorrados son positivas.",
    ],
    "zero-answer": [
      "0 is the starting point, like sea level or a balance of $0. This amount is some distance away from 0.",
      "0 es el punto de partida, como el nivel del mar o un saldo de $0. Esta cantidad está a cierta distancia de 0.",
    ],
    "digits-swapped": [
      "The digits are in the wrong order. Read the amount in the question again.",
      "Los dígitos están en otro orden. Lee otra vez la cantidad de la pregunta.",
    ],
    "sign-and-digits": [
      "Neither the sign nor the digits match the question. Read the amount and its key word again.",
      "Ni el signo ni los dígitos coinciden con la pregunta. Lee otra vez la cantidad y su palabra clave.",
    ],
    "one-opposite": [
      "That takes the opposite only one time. Count how many opposites the question asks for.",
      "Eso toma el opuesto una sola vez. Cuenta cuántos opuestos pide la pregunta.",
    ],
    "opposites-cancel": [
      "Opposites add up to 0, but this question asks for the opposite of the opposite, not their sum.",
      "Los opuestos suman 0, pero esta pregunta pide el opuesto del opuesto, no su suma.",
    ],
    "read-tick-as-one": (step) => [
      `Look at the labels again. Each tick counts by ${step}, not by 1.`,
      `Mira otra vez las marcas. Cada marca cuenta de ${step} en ${step}, no de 1 en 1.`,
    ],
    "miscounted-signs": [
      "Count the minus signs again. Each one takes the opposite, which moves the number to the other side of 0.",
      "Cuenta otra vez los signos menos. Cada uno toma el opuesto, que lleva el número al otro lado de 0.",
    ],
    "off-by-one": (L) =>
      L
        ? [
            `Close, but this point is not the same distance from 0 as point ${L}. Count the ticks from 0 to each point.`,
            `Cerca, pero este punto no está a la misma distancia de 0 que el punto ${L}. Cuenta las marcas desde 0 hasta cada punto.`,
          ]
        : [
            "That is one tick away. Count the ticks from 0 again, one at a time.",
            "Eso está a una marca de distancia. Cuenta otra vez las marcas desde 0, una por una.",
          ],
    "wrong-distance-or-side": (L) => [
      `This point is not the mirror image of point ${L} across 0. Check the side of 0 and the distance from 0.`,
      `Este punto no es la imagen en espejo del punto ${L} respecto a 0. Revisa el lado de 0 y la distancia a 0.`,
    ],
    "wrong-side-of-zero": [
      "That is on the other side of 0. The sign of the number tells you which side.",
      "Eso está del otro lado de 0. El signo del número te dice de qué lado.",
    ],
    "dropped-fraction": [
      "That shows only the whole-number part. The fraction part moves the point away from that whole number.",
      "Eso muestra solo la parte entera. La parte fraccionaria aleja el punto de ese número entero.",
    ],
    "rounded-up": [
      "That is the next whole number. The number is between two whole numbers, not on one.",
      "Ese es el siguiente número entero. El número está entre dos números enteros, no sobre uno.",
    ],
    "dropped-whole": [
      "That shows only the fraction part. Count the whole numbers from 0 as well.",
      "Eso muestra solo la parte fraccionaria. Cuenta también los números enteros desde 0.",
    ],
    "counted-from-wrong-end": [
      "Check the fraction part. Count the equal parts starting from the whole number on the 0 side of the number.",
      "Revisa la parte fraccionaria. Cuenta las partes iguales empezando por el número entero que está del lado de 0.",
    ],
    "swapped-num-den": [
      "That turns the fraction upside down. The numerator and the denominator do not trade places.",
      "Eso voltea la fracción. El numerador y el denominador no se intercambian.",
    ],
    "fraction-goes-right": [
      "A negative fraction part also goes LEFT. Think of how far the number is past the whole number, away from 0.",
      "La parte fraccionaria de un número negativo también va a la IZQUIERDA. Piensa en cuánto se pasa del número entero, alejándose de 0.",
    ],
    "too-far-right": [
      "That pair is too far to the right. Count the whole numbers from 0 one at a time.",
      "Ese par está demasiado a la derecha. Cuenta los números enteros desde 0 uno por uno.",
    ],
    "too-far-left": [
      "That pair is too far to the left. Count the whole numbers from 0 one at a time.",
      "Ese par está demasiado a la izquierda. Cuenta los números enteros desde 0 uno por uno.",
    ],
    "ignored-negative": [
      "That pair is on the positive side of 0. The number is negative, so it sits to the left of 0.",
      "Ese par está del lado positivo de 0. El número es negativo, así que está a la izquierda de 0.",
    ],
    "half-the-distance": [
      "That is half the distance between A and B. The question asks where M is on the number line. Start at A and move that far.",
      "Eso es la mitad de la distancia entre A y B. La pregunta pide dónde está M en la recta numérica. Empieza en A y avanza esa distancia.",
    ],
    "added-endpoints": [
      "Adding the two numbers does not find the middle. Count how many ticks are between A and B, then take half of them.",
      "Sumar los dos números no halla el punto medio. Cuenta cuántas marcas hay entre A y B y toma la mitad.",
    ],
    "gave-distance": [
      "That is the distance from A to B, not the position of M. M is halfway along that distance.",
      "Esa es la distancia de A a B, no la posición de M. M está a la mitad de esa distancia.",
    ],
  };
  const fbOf = (tag, a) => {
    const e = FB[tag];
    if (!e) throw new Error(`coordinate.js: no feedback for tag ${tag}`);
    return typeof e === "function" ? e(...a) : e;
  };
  /** A named wrong answer (choice text or typed value); feedback comes from the library. */
  const bad = (v, tag, ...a) => {
    const [en, es] = fbOf(tag, a);
    return { v, tag, f: en, fEs: es };
  };
  /** A wrong choice that also has Spanish text. */
  const badEs = (v, vEs, tag, ...a) => ({ ...bad(v, tag, ...a), vEs });

  /* ---- item building ---------------------------------------------------------------------------- */
  const Q = (q, qEs) => ({ q, qEs });
  const X = (x, xEs) => ({ x, xEs });
  /** Hint ladder from [en, es] pairs. */
  const H = (...p) => ({ h: p.map((s) => s[0]), hEs: p.map((s) => s[1]) });
  /** Multiple choice with tags (item.tag[i]) and Spanish choices (item.cEs); `sort` fixes the order shown. */
  const mcq = (rng, o) => {
    const right = typeof o.right === "object" ? o.right : { v: o.right };
    const wrong = o.wrong.filter(Boolean);
    const it = G.mc(rng, { ...o, right, wrong });
    const byText = new Map();
    for (const e of [right, ...wrong]) {
      const key = String(e.v).trim().toLowerCase();
      if (!byText.has(key)) byText.set(key, e);
    }
    const ent = it.c.map((c) => byText.get(c.trim().toLowerCase()));
    it.tag = ent.map((e, i) => (i === it.a ? "" : e.tag || ""));
    if (ent.some((e) => e.vEs)) it.cEs = ent.map((e) => e.vEs || String(e.v));
    if (o.sort) {
      const idx = it.c.map((_, i) => i).sort((p, q) => o.sort(it.c[p]) - o.sort(it.c[q]));
      const re = (arr) => arr && idx.map((i) => arr[i]);
      it.a = idx.indexOf(it.a);
      it.c = re(it.c);
      it.f = re(it.f);
      it.fEs = re(it.fEs);
      it.tag = re(it.tag);
      it.cEs = re(it.cEs);
    }
    return it;
  };
  /** Typed answer; o.a is a number; o.fw is a list of bad(number, tag) values. */
  const numq = (o) => {
    const key = G.value(f(o.a));
    const seen = new Set();
    const fw = [];
    for (const e of (o.fw || []).filter(Boolean)) {
      const v = G.value(f(e.v));
      if (v === key || seen.has(v)) continue;
      seen.add(v);
      fw.push({ v: f(e.v), tag: e.tag, f: e.f, fEs: e.fEs });
    }
    return G.num({ ...o, a: f(o.a), fw });
  };

  /* ---- figures ---------------------------------------------------------------------------------- */
  const nline = (min, max, step, marks) => ({ t: "nline", min, max, step, marks });
  const span = (m) => (m <= 5 ? 6 : m <= 7 ? 8 : m <= 9 ? 10 : 12);
  /** Four-quadrant plane, symmetric about the origin, big enough for every |coordinate| <= m. */
  const plane = (m, points, extra) => {
    const r = span(m);
    return { t: "coord", xmin: -r, xmax: r, ymin: -r, ymax: r, grid: true, points, ...extra };
  };

  /* ---- check() helpers: different routes from make() -------------------------------------------- */
  /** Opposite by the additive-inverse test: the integer that adds to n to make 0. */
  const oppOf = (n) => {
    for (let m = -400; m <= 400; m++) if (m + n === 0) return m;
    return Number.NaN;
  };
  /** Unit steps between two values, counted along the line (unit = the tick size). */
  const steps = (from, to, unit = 1) => {
    let p = Math.round(from / unit);
    const q = Math.round(to / unit);
    let n = 0;
    while (p !== q && n < 100000) {
      p += p < q ? 1 : -1;
      n++;
    }
    return n * unit;
  };
  /** Multiple choice: exactly the keyed choice passes the independent test. */
  const judge = (item, ok) => {
    const hits = item.c.reduce((acc, c, i) => (ok(c, i) ? acc.concat(i) : acc), []);
    return hits.length === 1 && hits[0] === item.a
      ? true
      : `independent test passes choice(s) ${JSON.stringify(hits)} but the key is ${item.a}`;
  };
  const typed = (item, want) =>
    near(G.value(item.a), want) || `typed key ${item.a} but the independent answer is ${f(want)}`;
  const pairOf = (t) => {
    const m = /^\((.+), (.+)\)$/.exec(String(t));
    return m ? [G.value(m[1]), G.value(m[2])] : null;
  };
  const mark = (item, label) =>
    (item.viz.marks || item.viz.points || []).find((m) => m.l === label);

  /** Registers a generator from templates { name: { lv: [levels], make(rng, level), check(item) } }. */
  const reg = (id, title, titleEs, tpl) =>
    G.register(id, {
      title,
      titleEs,
      levels: 4,
      make(rng, level) {
        const t = rng.pick(Object.keys(tpl).filter((k) => tpl[k].lv.includes(level)));
        const item = tpl[t].make(rng, level);
        item.meta = { ...item.meta, t };
        return item;
      },
      check(item) {
        const t = tpl[item.meta && item.meta.t];
        return t ? t.check(item) : `unknown template ${item.meta && item.meta.t}`;
      },
    });

  /* ---- signed-number situations (7-1, 7-3, 7-4) --------------------------------------------------- */
  // say(n): the situation integer n stands for, as [English, Spanish]. act(n): a verb phrase for a change, so a
  // chain of opposites reads naturally. max: the largest realistic size.
  const CTX = [
    {
      max: 98,
      say: (n) =>
        n > 0
          ? [`${n} meters above sea level`, `${n} metros sobre el nivel del mar`]
          : [`${-n} meters below sea level`, `${-n} metros bajo el nivel del mar`],
    },
    {
      max: 39,
      say: (n) =>
        n > 0
          ? [`${n}°C above zero`, `${n} °C sobre cero`]
          : [`${-n}°C below zero`, `${-n} °C bajo cero`],
    },
    {
      max: 98,
      unit: ["dollars", "dólares"],
      say: (n) =>
        n > 0
          ? [`a deposit of $${n}`, `un depósito de $${n}`]
          : [`a withdrawal of $${-n}`, `un retiro de $${-n}`],
      act: (n) =>
        n > 0 ? [`deposits $${n}`, `deposita $${n}`] : [`withdraws $${-n}`, `retira $${-n}`],
    },
    {
      max: 39,
      unit: ["yards", "yardas"],
      say: (n) =>
        n > 0
          ? [`a gain of ${n} yards`, `una ganancia de ${n} yardas`]
          : [`a loss of ${-n} yards`, `una pérdida de ${-n} yardas`],
      act: (n) =>
        n > 0
          ? [`gains ${n} yards`, `gana ${n} yardas`]
          : [`loses ${-n} yards`, `pierde ${-n} yardas`],
    },
    {
      max: 49,
      unit: ["points", "puntos"],
      say: (n) =>
        n > 0
          ? [`a bonus of ${n} points`, `una bonificación de ${n} puntos`]
          : [`a penalty of ${-n} points`, `una penalización de ${-n} puntos`],
      act: (n) =>
        n > 0
          ? [`gains ${n} points`, `gana ${n} puntos`]
          : [`loses ${-n} points`, `pierde ${-n} puntos`],
    },
    {
      max: 98,
      say: (n) =>
        n > 0
          ? [`$${n} saved in a piggy bank`, `$${n} ahorrados en una alcancía`]
          : [`a debt of $${-n}`, `una deuda de $${-n}`],
    },
  ];
  const CHANGES = CTX.filter((c) => c.act);
  /** Lead-in sentences for number-line items; the third entry lists tick sizes that suit the quantity. */
  const LEAD = [
    [
      "The number line shows temperatures in °C.",
      "La recta numérica muestra temperaturas en °C.",
      [1, 2, 5],
    ],
    [
      "The number line shows elevations in meters.",
      "La recta numérica muestra elevaciones en metros.",
      [1, 5, 10],
    ],
    [
      "The number line shows changes in a bank balance, in dollars.",
      "La recta numérica muestra cambios en un saldo bancario, en dólares.",
      [1, 5, 10],
    ],
    [
      "The number line shows yards gained or lost on football plays.",
      "La recta numérica muestra yardas ganadas o perdidas en jugadas de fútbol americano.",
      [1, 2, 5],
    ],
    [
      "The number line shows points won or lost in a game.",
      "La recta numérica muestra puntos ganados o perdidos en un juego.",
      [1, 2, 5],
    ],
    [
      "The number line shows floors above and below the ground floor.",
      "La recta numérica muestra pisos sobre y bajo la planta baja.",
      [1, 2],
    ],
  ];
  /** Lead-ins for number lines that hold fractions and decimals. */
  const LEADR = [
    [
      "A weather station records temperatures in °C.",
      "Una estación meteorológica registra temperaturas en °C.",
    ],
    [
      "A diver logs elevations in meters, with sea level at 0.",
      "Un buzo anota elevaciones en metros, con el nivel del mar en 0.",
    ],
    [
      "A trail map shows miles east or west of the campsite (0).",
      "Un mapa de senderos muestra millas al este o al oeste del campamento (0).",
    ],
    [
      "A stock tracker shows price changes in dollars.",
      "Un registro de acciones muestra cambios de precio en dólares.",
    ],
    [
      "A reservoir gauge shows the water level in feet above or below normal (0).",
      "Un medidor de un embalse muestra el nivel del agua en pies sobre o bajo lo normal (0).",
    ],
    [
      "A video game shows a character's position in blocks left or right of the start (0).",
      "Un videojuego muestra la posición de un personaje en bloques a la izquierda o derecha del inicio (0).",
    ],
  ];

  /**
   * Four lettered points on a number line, in tick units k: the target T, its opposite O, a near miss N one tick
   * from O, and a stray X. Shared by 7-1 (integers) and 7-2 (halves, quarters, fifths).
   *   o = { unit, kmax (largest |k| used), E (ticks each side of 0), den, show(k), given, lead? }
   */
  const oppLetters = (rng, o) => {
    let t;
    do t = rng.pick([-1, 1]) * rng.int(2, o.kmax - 1);
    while (o.den > 1 && t % o.den === 0);
    // `k` counts ticks; the figure plots k * unit. Integer lines print the plotted number, fraction lines print k as a fraction.
    const sh = (k) => o.show(o.den > 1 ? k : k * o.unit);
    const nearK = -t + rng.pick([-1, 1]);
    let x;
    do x = rng.pick([-1, 1]) * rng.int(1, o.kmax);
    while ([t, -t, nearK, 0].includes(x));
    const labs = rng.pick(LABELS);
    const roles = rng.shuffle(["T", "O", "N", "X"]);
    const ks = { T: t, O: -t, N: nearK, X: x };
    const L = (role) => labs[roles.indexOf(role)];
    const T = L("T");
    const lead = o.lead ? [`${o.lead[0]} `, `${o.lead[1]} `] : ["", ""];
    return mcq(rng, {
      ...(o.given
        ? Q(
            `${lead[0]}Point ${T} shows ${sh(t)}. Which point shows its opposite?`,
            `${lead[1]}El punto ${T} muestra ${sh(t)}. ¿Qué punto muestra su opuesto?`,
          )
        : Q(
            `${lead[0]}Which point is the opposite of point ${T}?`,
            `${lead[1]}¿Qué punto es el opuesto del punto ${T}?`,
          )),
      right: L("O"),
      sort: (c) => labs.indexOf(c),
      wrong: [
        bad(T, "same-number", T),
        bad(L("N"), "off-by-one", T),
        bad(L("X"), "wrong-distance-or-side", T),
      ],
      ...X(
        `Point ${T} is at ${sh(t)}. Its opposite is ${sh(-t)}, the same distance from 0 on the other side of 0. That is point ${L("O")}.`,
        `El punto ${T} está en ${sh(t)}. Su opuesto es ${sh(-t)}, a la misma distancia de 0 pero del otro lado. Ese es el punto ${L("O")}.`,
      ),
      ...H(
        o.given
          ? [
              `Count the ticks from 0 to point ${T}. Check how much each tick is worth.`,
              `Cuenta las marcas desde 0 hasta el punto ${T}. Fíjate en cuánto vale cada marca.`,
            ]
          : [
              `Find point ${T} and read its number from the labels under the line.`,
              `Busca el punto ${T} y lee su número en las marcas debajo de la recta.`,
            ],
        [
          "The opposite is the same distance from 0, on the other side of 0.",
          "El opuesto está a la misma distancia de 0, del otro lado de 0.",
        ],
        [
          "Count the same number of ticks on the other side of 0. Which lettered point is there?",
          "Cuenta la misma cantidad de marcas del otro lado de 0. ¿Qué punto con letra está ahí?",
        ],
      ),
      viz: nline(
        -o.E * o.unit,
        o.E * o.unit,
        o.unit,
        roles.map((role, i) => ({ v: ks[role] * o.unit, l: labs[i] })),
      ),
      meta: { target: T, unit: o.unit },
    });
  };
  /** check() for oppLetters: the choice whose position adds to the target's position to make 0. */
  const checkOppLetters = (item) => {
    const T = mark(item, item.meta.target);
    if (!T) return "target mark missing from the figure";
    return judge(item, (c) => {
      const m = mark(item, c);
      return !!m && near(m.v + T.v, 0);
    });
  };

  /* ================================================================================================
   * integerOpposites (7-1): opposites, signed numbers in situations, the opposite of the opposite
   * ============================================================================================== */
  reg("integerOpposites", "Integers and their opposites", "Números enteros y sus opuestos", {
    op1: {
      lv: [1],
      make(rng) {
        const n = rng.pick([-1, 1]) * rng.int(2, 20);
        const a = Math.abs(n);
        return mcq(rng, {
          ...Q(`What is the opposite of ${S(n)}?`, `¿Cuál es el opuesto de ${S(n)}?`),
          right: S(-n),
          wrong: [
            bad(S(n), "same-number"),
            bad(S(2 * n), "doubled-distance"),
            bad(recip(n), "reciprocal"),
          ],
          ...X(
            `${S(n)} is ${a} units from 0. Its opposite is also ${a} units from 0, on the other side of 0. So the opposite of ${S(n)} is ${S(-n)}.`,
            `${S(n)} está a ${a} unidades de 0. Su opuesto también está a ${a} unidades de 0, del otro lado. Entonces el opuesto de ${S(n)} es ${S(-n)}.`,
          ),
          ...H(
            [
              "An opposite is the same distance from 0, but on the other side of 0.",
              "Un opuesto está a la misma distancia de 0, pero del otro lado de 0.",
            ],
            [
              `Picture ${S(n)} on a number line. Count how many units it is from 0.`,
              `Imagina ${S(n)} en una recta numérica. Cuenta cuántas unidades hay hasta 0.`,
            ],
            [
              "Now go the same number of units from 0 in the other direction. What number do you reach?",
              "Ahora ve la misma cantidad de unidades desde 0 en la otra dirección. ¿A qué número llegas?",
            ],
          ),
          meta: { n },
        });
      },
      check: (item) => {
        const o = oppOf(item.meta.n);
        return judge(item, (c) => near(G.value(c), o));
      },
    },

    ctxSign: {
      lv: [1],
      make(rng) {
        const c = rng.pick(CTX);
        const mag = twoDigit(rng, 12, c.max);
        const n = rng.pick([-1, 1]) * mag;
        const sw = sgn(n) * Number([...String(mag)].reverse().join(""));
        const [en, es] = c.say(n);
        return mcq(rng, {
          ...Q(`Which integer represents ${en}?`, `¿Qué número entero representa ${es}?`),
          right: S(n),
          wrong: [
            bad(S(-n), n < 0 ? "dropped-negative" : "added-negative"),
            bad("0", "zero-answer"),
            bad(S(sw), "digits-swapped"),
            bad(S(-sw), "sign-and-digits"),
          ],
          ...X(
            `${cap(en)} is on the ${n < 0 ? "negative" : "positive"} side of 0, so it is written ${S(n)}.`,
            `${cap(es)} está del lado ${n < 0 ? "negativo" : "positivo"} de 0, así que se escribe ${S(n)}.`,
          ),
          ...H(
            [
              "Decide what 0 means in the story. Things that go up or add on are positive. Things that go down or take away are negative.",
              "Decide qué significa 0 en la situación. Lo que sube o se suma es positivo. Lo que baja o se quita es negativo.",
            ],
            [
              "Find the key word in the question. Does it point above 0 or below 0?",
              "Busca la palabra clave en la pregunta. ¿Indica arriba de 0 o abajo de 0?",
            ],
            [
              "Write the amount with the sign that matches the key word.",
              "Escribe la cantidad con el signo que corresponde a la palabra clave.",
            ],
          ),
          meta: { mag, neg: n < 0 },
        });
      },
      check(item) {
        let p = 0;
        for (let i = 0; i < item.meta.mag; i++) p += item.meta.neg ? -1 : 1;
        return judge(item, (c) => near(G.value(c), p));
      },
    },

    ctxOpp: {
      lv: [2],
      make(rng) {
        const c = rng.pick(CTX);
        const n = rng.pick([-1, 1]) * rng.int(2, c.max);
        const [en, es] = c.say(n);
        const [oen, oes] = c.say(-n);
        const q = rng.pick([
          [
            `Which integer represents the opposite of ${en}?`,
            `¿Qué número entero representa lo opuesto de ${es}?`,
          ],
          [
            `A situation is ${en}. Which integer represents the opposite situation?`,
            `Una situación es ${es}. ¿Qué número entero representa la situación opuesta?`,
          ],
        ]);
        return numq({
          ...Q(...q),
          a: -n,
          fw: [bad(n, "same-number"), bad(2 * n, "doubled-distance")],
          ...X(
            `The opposite of ${en} is ${oen}. It is written ${S(-n)}.`,
            `Lo opuesto de ${es} es ${oes}. Se escribe ${S(-n)}.`,
          ),
          ...H(
            [
              "Opposite situations are the same size but go in opposite directions from 0.",
              "Las situaciones opuestas tienen el mismo tamaño pero van en direcciones opuestas desde 0.",
            ],
            [
              "First write the situation as an integer. Is it positive or negative?",
              "Primero escribe la situación como un número entero. ¿Es positiva o negativa?",
            ],
            [
              "Now write the integer on the other side of 0 with the same size.",
              "Ahora escribe el número entero del otro lado de 0 con el mismo tamaño.",
            ],
          ),
          meta: { n },
        });
      },
      check: (item) => typed(item, oppOf(item.meta.n)),
    },

    dbl: {
      lv: [2],
      make(rng) {
        const n = rng.pick([-1, 1]) * rng.int(2, 40);
        const q = rng.pick([
          [
            `What is the opposite of the opposite of ${S(n)}?`,
            `¿Cuál es el opuesto del opuesto de ${S(n)}?`,
          ],
          [
            `Take the opposite of ${S(n)}. Then take the opposite of that number. What number do you get?`,
            `Toma el opuesto de ${S(n)}. Luego toma el opuesto de ese número. ¿Qué número obtienes?`,
          ],
        ]);
        return mcq(rng, {
          ...Q(...q),
          right: S(n),
          wrong: [
            bad(S(-n), "one-opposite"),
            bad("0", "opposites-cancel"),
            bad(S(2 * n), "doubled-distance"),
          ],
          ...X(
            `The opposite of ${S(n)} is ${S(-n)}. The opposite of ${S(-n)} is ${S(n)}. Taking the opposite twice brings you back to ${S(n)}.`,
            `El opuesto de ${S(n)} es ${S(-n)}. El opuesto de ${S(-n)} es ${S(n)}. Tomar el opuesto dos veces te devuelve a ${S(n)}.`,
          ),
          ...H(
            [
              "Find the first opposite. Then find the opposite of your result.",
              "Halla el primer opuesto. Luego halla el opuesto de tu resultado.",
            ],
            [
              "Each opposite moves the number to the other side of 0.",
              "Cada opuesto lleva el número al otro lado de 0.",
            ],
            [
              "After you cross 0 two times, which side of 0 are you on?",
              "Después de cruzar 0 dos veces, ¿de qué lado de 0 estás?",
            ],
          ),
          meta: { n },
        });
      },
      check(item) {
        const want = oppOf(oppOf(item.meta.n));
        return judge(item, (c) => near(G.value(c), want));
      },
    },

    nlOpp: {
      lv: [3],
      make(rng) {
        const [en, es, ss] = rng.pick(LEAD);
        const step = rng.pick(ss);
        const k = rng.pick([-1, 1]) * rng.int(2, 9);
        const t = k * step;
        const p = rng.pick(PT);
        const q = rng.pick([
          [
            `Point ${p} is shown. What is the opposite of the number at point ${p}?`,
            `Se muestra el punto ${p}. ¿Cuál es el opuesto del número en el punto ${p}?`,
          ],
          [
            `Point ${p} marks a number. What integer is the opposite of that number?`,
            `El punto ${p} marca un número. ¿Qué número entero es el opuesto de ese número?`,
          ],
        ]);
        return numq({
          ...Q(`${en} ${q[0]}`, `${es} ${q[1]}`),
          a: -t,
          fw: [bad(t, "same-number"), step > 1 && bad(-k, "read-tick-as-one", step)],
          ...X(
            `Point ${p} is at ${S(t)}. Its opposite is ${S(-t)}, the same distance from 0 on the other side.`,
            `El punto ${p} está en ${S(t)}. Su opuesto es ${S(-t)}, a la misma distancia de 0 pero del otro lado.`,
          ),
          ...H(
            [
              `Read the number at point ${p} from the labels under the number line.`,
              `Lee el número del punto ${p} en las marcas debajo de la recta numérica.`,
            ],
            step > 1
              ? [
                  "Check the scale. The ticks count by more than 1.",
                  "Fíjate en la escala. Las marcas cuentan de más de 1 en 1.",
                ]
              : [
                  `Is point ${p} to the left or to the right of 0?`,
                  `¿El punto ${p} está a la izquierda o a la derecha de 0?`,
                ],
            [
              "The opposite is the same distance from 0 on the other side of 0.",
              "El opuesto está a la misma distancia de 0 del otro lado de 0.",
            ],
          ),
          viz: nline(-10 * step, 10 * step, step, [{ v: t, l: p }]),
          meta: { step },
        });
      },
      check: (item) => typed(item, oppOf(item.viz.marks[0].v)),
    },

    nlWhich: {
      lv: [3],
      make(rng) {
        const [en, es, ss] = rng.pick(LEAD);
        return oppLetters(rng, {
          unit: rng.pick(ss),
          kmax: 9,
          E: 10,
          den: 1,
          show: S,
          given: rng.chance(0.5),
          lead: [en, es],
        });
      },
      check: checkOppLetters,
    },

    negs: {
      lv: [4],
      make(rng) {
        const m = rng.int(2, 40);
        const c = rng.int(3, 5);
        const expr = `${"−(".repeat(c - 1)}${M}${m}${")".repeat(c - 1)}`;
        const v = c % 2 ? -m : m;
        const path = [-m];
        for (let i = 1; i < c; i++) path.push(-path[i - 1]);
        return numq({
          ...Q(`What is the value of ${expr}?`, `¿Cuál es el valor de ${expr}?`),
          a: v,
          fw: [bad(-v, "miscounted-signs")],
          ...X(
            `Work from the inside out: ${path.map(S).join(", then ")}. The value is ${S(v)}.`,
            `Trabaja de adentro hacia afuera: ${path.map(S).join(", luego ")}. El valor es ${S(v)}.`,
          ),
          ...H(
            [
              "A minus sign in front of a number or a group in parentheses means the opposite.",
              "Un signo menos delante de un número o de un grupo entre paréntesis significa el opuesto.",
            ],
            [
              "Start with the innermost number. Take one opposite at a time.",
              "Empieza con el número más interno. Toma un opuesto a la vez.",
            ],
            [
              "Count the minus signs. Two minus signs cancel each other out.",
              "Cuenta los signos menos. Dos signos menos se cancelan entre sí.",
            ],
          ),
          meta: { expr },
        });
      },
      check(item) {
        const signs = [...item.meta.expr].filter((ch) => ch === M).length;
        const mag = Number(/\d+/.exec(item.meta.expr)[0]);
        return typed(item, signs % 2 ? -mag : mag);
      },
    },

    rev: {
      lv: [4],
      make(rng) {
        if (rng.chance(0.5)) {
          const N = rng.pick([-1, 1]) * rng.int(5, 60);
          return numq({
            ...Q(
              `The opposite of a number is ${S(N)}. What is the number?`,
              `El opuesto de un número es ${S(N)}. ¿Cuál es el número?`,
            ),
            a: -N,
            fw: [bad(N, "same-number")],
            ...X(
              `Opposites go both ways. If the opposite of a number is ${S(N)}, then the number is the opposite of ${S(N)}, which is ${S(-N)}.`,
              `Los opuestos funcionan en ambos sentidos. Si el opuesto de un número es ${S(N)}, entonces el número es el opuesto de ${S(N)}, que es ${S(-N)}.`,
            ),
            ...H(
              [
                "Opposites go both ways: if A is the opposite of B, then B is the opposite of A.",
                "Los opuestos funcionan en ambos sentidos: si A es el opuesto de B, entonces B es el opuesto de A.",
              ],
              [
                "Think of a number line. The number and the number you were given are on opposite sides of 0.",
                "Piensa en una recta numérica. El número y el número que te dieron están en lados opuestos de 0.",
              ],
              [
                "Find the number that is the same distance from 0 as the one you were given, on the other side.",
                "Halla el número que está a la misma distancia de 0 que el que te dieron, del otro lado.",
              ],
            ),
            meta: { kind: "one", N },
          });
        }
        const c = rng.pick(CHANGES);
        const [a, b, d] = rng.shuffle(NAMES);
        const n = rng.pick([-1, 1]) * rng.int(5, Math.min(c.max, 60));
        const [ae, aes] = c.act(n);
        return numq({
          ...Q(
            `${a}'s change is the opposite of ${b}'s change. ${b}'s change is the opposite of ${d}'s change. ${d} ${ae}. What integer shows ${a}'s change, in ${c.unit[0]}?`,
            `El cambio de ${a} es el opuesto del cambio de ${b}. El cambio de ${b} es el opuesto del cambio de ${d}. ${d} ${aes}. ¿Qué número entero muestra el cambio de ${a}, en ${c.unit[1]}?`,
          ),
          a: n,
          fw: [bad(-n, "one-opposite")],
          ...X(
            `${d}'s change is ${S(n)}. ${b}'s change is the opposite, ${S(-n)}. ${a}'s change is the opposite of that, ${S(n)}.`,
            `El cambio de ${d} es ${S(n)}. El cambio de ${b} es el opuesto, ${S(-n)}. El cambio de ${a} es el opuesto de ese, ${S(n)}.`,
          ),
          ...H(
            [
              `Write ${d}'s change as an integer first.`,
              `Primero escribe el cambio de ${d} como un número entero.`,
            ],
            [
              `Take the opposite once to get ${b}'s change.`,
              `Toma el opuesto una vez para obtener el cambio de ${b}.`,
            ],
            [
              `Take the opposite again to get ${a}'s change.`,
              `Toma el opuesto otra vez para obtener el cambio de ${a}.`,
            ],
          ),
          meta: { kind: "chain", n },
        });
      },
      check(item) {
        const m = item.meta;
        return typed(item, m.kind === "one" ? oppOf(m.N) : oppOf(oppOf(m.n)));
      },
    },
  });
  /* ================================================================================================
   * rationalNumberLine (7-2): read and place fractions and decimals, opposites, between which integers
   * ============================================================================================== */
  /** Number-line geometry: den ticks per unit, E whole units each side, points at most one tick inside the ends. */
  const geo = (den, level) => {
    const E = den === 2 ? (level === 1 ? 5 : 4) : 2;
    return { den, E, kmax: den * E - 1 };
  };
  const pickDen = (rng, level) => (level === 1 ? 2 : rng.pick([2, 4, 5]));
  /** A tick position for a non-whole rational, with |k| between lo and kmax. */
  const wholeKey = (rng, den, kmax, lo = 1) => {
    let k;
    do k = rng.pick([-1, 1]) * rng.int(lo, kmax);
    while (k % den === 0);
    return k;
  };
  /** Candidate wrong positions (tick units) for reading k/den, best first, with their misconception. */
  const slips = (k, den, kmax) => {
    const a = Math.abs(k);
    const s = sgn(k);
    const whole = Math.floor(a / den) * den;
    const cand = [
      { k: -k, tag: "wrong-side-of-zero" },
      { k: s * whole, tag: "dropped-fraction" },
      { k: s * (whole + den), tag: "rounded-up" },
      { k: s * (a % den), tag: "dropped-whole" },
      { k: s * (whole + den - (a % den)), tag: "counted-from-wrong-end" },
      { k: k + s, tag: "off-by-one" },
    ];
    const seen = new Set([k]);
    return cand.filter((e) => {
      if (seen.has(e.k) || Math.abs(e.k) > kmax) return false;
      seen.add(e.k);
      return true;
    });
  };
  const tickText = (den) => `1/${den} (${f(1 / den)})`;
  /** "3 ticks to the left of 0" in both languages. */
  const where = (k) => [
    `${Math.abs(k)} ${pl(k, "tick", "ticks")} to the ${k < 0 ? "left" : "right"} of 0`,
    `${Math.abs(k)} ${pl(k, "marca", "marcas")} a la ${k < 0 ? "izquierda" : "derecha"} de 0`,
  ];

  reg(
    "rationalNumberLine",
    "Rational numbers on the number line",
    "Números racionales en la recta numérica",
    {
      which: {
        lv: [1, 2],
        make(rng, level) {
          const { den, E, kmax } = geo(pickDen(rng, level), level);
          const k = wholeKey(rng, den, kmax);
          const form = rng.pick(level === 1 ? ["dec", "dec", "mixed"] : ["frac", "mixed", "dec"]);
          const txt = R(k, den, form);
          const slip = slips(k, den, kmax).slice(0, 3);
          const labs = rng.pick(LABELS);
          const roles = rng.shuffle(["T", ...slip.map((_, i) => i)]);
          const L = (r) => labs[roles.indexOf(r)];
          const ks = roles.map((r) => (r === "T" ? k : slip[r].k));
          const lead = rng.pick(LEADR);
          const stem = rng.pick([
            [
              `Which point shows ${txt} on the number line?`,
              `¿Qué punto muestra ${txt} en la recta numérica?`,
            ],
            [`Which point is at ${txt}?`, `¿Qué punto está en ${txt}?`],
          ]);
          const [we, wes] = where(k);
          return mcq(rng, {
            ...Q(`${lead[0]} ${stem[0]}`, `${lead[1]} ${stem[1]}`),
            right: L("T"),
            sort: (c) => labs.indexOf(c),
            wrong: slip.map((e, i) => bad(L(i), e.tag)),
            ...X(
              `Each tick is ${tickText(den)}. Start at 0 and move ${we.replace(" of 0", "")}. You land on point ${L("T")}.`,
              `Cada marca vale ${tickText(den)}. Empieza en 0 y muévete ${wes.replace(" de 0", "")}. Llegas al punto ${L("T")}.`,
            ),
            ...H(
              [
                `Look at the scale. Each tick is worth ${tickText(den)}.`,
                `Mira la escala. Cada marca vale ${tickText(den)}.`,
              ],
              [
                `A ${k < 0 ? "negative" : "positive"} number is to the ${k < 0 ? "left" : "right"} of 0. Count ticks from 0.`,
                `Un número ${k < 0 ? "negativo" : "positivo"} está a la ${k < 0 ? "izquierda" : "derecha"} de 0. Cuenta marcas desde 0.`,
              ],
              [
                "Count the ticks from 0 and see which lettered point you reach.",
                "Cuenta las marcas desde 0 y mira a qué punto con letra llegas.",
              ],
            ),
            viz: nline(
              -E,
              E,
              1 / den,
              ks.map((kk, i) => ({ v: kk / den, l: labs[i] })),
            ),
            meta: { txt, den },
          });
        },
        check(item) {
          if (!item.q.includes(item.meta.txt)) return "the stem does not show the number";
          const want = G.value(item.meta.txt);
          return judge(item, (c) => {
            const m = mark(item, c);
            return !!m && near(m.v, want);
          });
        },
      },

      read: {
        lv: [1, 2],
        make(rng, level) {
          const { den, E, kmax } = geo(pickDen(rng, level), level);
          const k = wholeKey(rng, den, kmax);
          const p = rng.pick(PT);
          const lead = rng.pick(LEADR);
          const how =
            level === 1
              ? ["Write it as a decimal.", "Escríbelo como decimal."]
              : ["Write it as a fraction or a decimal.", "Escríbelo como fracción o como decimal."];
          const [we, wes] = where(k);
          return numq({
            ...Q(
              `${lead[0]} Point ${p} is shown. What number does point ${p} show? ${how[0]}`,
              `${lead[1]} Se muestra el punto ${p}. ¿Qué número muestra el punto ${p}? ${how[1]}`,
            ),
            a: k / den,
            fw: slips(k, den, kmax)
              .slice(0, 3)
              .map((e) => bad(e.k / den, e.tag)),
            ...X(
              `Each tick is ${tickText(den)}. Point ${p} is ${we}, so it shows ${R(k, den, "dec")}.`,
              `Cada marca vale ${tickText(den)}. El punto ${p} está a ${wes}, así que muestra ${R(k, den, "dec")}.`,
            ),
            ...H(
              [
                `Find the whole numbers on each side of point ${p}. How many ticks are between them?`,
                `Busca los números enteros a cada lado del punto ${p}. ¿Cuántas marcas hay entre ellos?`,
              ],
              [
                `Each tick is worth ${tickText(den)}. Count the ticks from 0 to point ${p}.`,
                `Cada marca vale ${tickText(den)}. Cuenta las marcas desde 0 hasta el punto ${p}.`,
              ],
              [
                `Is ${p} left or right of 0? That tells you the sign of the number.`,
                `¿${p} está a la izquierda o a la derecha de 0? Eso te dice el signo del número.`,
              ],
            ),
            viz: nline(-E, E, 1 / den, [{ v: k / den, l: p }]),
            meta: { den },
          });
        },
        check(item) {
          const m = item.viz.marks[0];
          const ticks = Math.round(steps(0, m.v, 1 / item.meta.den) * item.meta.den);
          return typed(item, (m.v < 0 ? -ticks : ticks) / item.meta.den);
        },
      },

      opp: {
        lv: [2, 3],
        make(rng, level) {
          const g = geo(pickDen(rng, level), level);
          const form = g.den === 2 ? "dec" : rng.pick(["dec", "mixed", "frac"]);
          return oppLetters(rng, {
            unit: 1 / g.den,
            kmax: g.kmax,
            E: g.E * g.den,
            den: g.den,
            show: (k) => R(k, g.den, form),
            given: level === 2,
            lead: rng.pick(LEADR),
          });
        },
        check: checkOppLetters,
      },

      equiv: {
        lv: [3],
        make(rng) {
          const { den, E, kmax } = geo(rng.pick([2, 4, 5]), 3);
          const k = wholeKey(rng, den, kmax, den + 1);
          const form = rng.pick(["frac", "mixed"]);
          const txt = (kk) => R(kk, den, form);
          const [nn, dd] = G.frac(Math.abs(k), den).split("/");
          const picks = [
            form === "frac" && {
              v: `${k < 0 ? M : ""}${dd}/${nn}`,
              tag: "swapped-num-den",
            },
            ...slips(k, den, kmax).map((e) => ({ v: txt(e.k), tag: e.tag })),
          ]
            .filter(Boolean)
            .slice(0, 3);
          const p = rng.pick(PT);
          const lead = rng.pick(LEADR);
          const [we, wes] = where(k);
          return mcq(rng, {
            ...Q(
              `${lead[0]} Point ${p} is shown. Which fraction or mixed number names point ${p}?`,
              `${lead[1]} Se muestra el punto ${p}. ¿Qué fracción o número mixto nombra el punto ${p}?`,
            ),
            right: txt(k),
            wrong: picks.map((e) => bad(e.v, e.tag)),
            ...X(
              `Each tick is ${tickText(den)}. Point ${p} is ${we}, so it shows ${txt(k)}. As a decimal that is ${R(k, den, "dec")}.`,
              `Cada marca vale ${tickText(den)}. El punto ${p} está a ${wes}, así que muestra ${txt(k)}. Como decimal es ${R(k, den, "dec")}.`,
            ),
            ...H(
              [
                `Each tick is worth ${tickText(den)}. Count the ticks from 0 to point ${p}.`,
                `Cada marca vale ${tickText(den)}. Cuenta las marcas desde 0 hasta el punto ${p}.`,
              ],
              [
                `Which two whole numbers is point ${p} between? Is it left or right of 0?`,
                `¿Entre cuáles dos números enteros está el punto ${p}? ¿Está a la izquierda o a la derecha de 0?`,
              ],
              [
                "Write what you counted as a number. The same number can be a fraction, a mixed number or a decimal.",
                "Escribe lo que contaste como número. El mismo número puede ser una fracción, un número mixto o un decimal.",
              ],
            ),
            viz: nline(-E, E, 1 / den, [{ v: k / den, l: p }]),
            meta: { den },
          });
        },
        check(item) {
          const v = item.viz.marks[0].v;
          return judge(item, (c) => near(G.value(c), v));
        },
      },

      between: {
        lv: [4],
        make(rng) {
          const useViz = rng.chance(0.5);
          const den = useViz ? 2 : rng.pick([2, 3, 4, 5, 10]);
          const neg = rng.chance(0.7);
          let m;
          do m = rng.int(den + 1, den * 5 - 1);
          while (m % den === 0);
          const kk = neg ? -m : m;
          const lo = Math.floor(kk / den);
          const form = den === 3 ? rng.pick(["frac", "mixed"]) : rng.pick(["dec", "frac", "mixed"]);
          const txt = R(kk, den, form);
          const p = rng.pick(PT);
          const lead = rng.pick(LEADR);
          const pair = (a) => ({
            v: `${S(a)} and ${S(a + 1)}`,
            vEs: `${S(a)} y ${S(a + 1)}`,
          });
          const wrongs = (
            neg
              ? [
                  [lo + 1, "fraction-goes-right"],
                  [-(lo + 1), "ignored-negative"],
                  [lo - 1, "too-far-left"],
                ]
              : [
                  [lo + 1, "too-far-right"],
                  [lo - 1, "too-far-left"],
                  [-(lo + 1), "wrong-side-of-zero"],
                ]
          ).map(([a, tag]) => badEs(pair(a).v, pair(a).vEs, tag));
          const subj = useViz ? [`Point ${p}`, `El punto ${p}`] : [txt, txt];
          return mcq(rng, {
            ...(useViz
              ? Q(
                  `${lead[0]} Point ${p} is shown. Between which two whole numbers is point ${p}?`,
                  `${lead[1]} Se muestra el punto ${p}. ¿Entre cuáles dos números enteros está el punto ${p}?`,
                )
              : Q(
                  `${lead[0]} The reading is ${txt}. Between which two whole numbers is ${txt}?`,
                  `${lead[1]} La lectura es ${txt}. ¿Entre cuáles dos números enteros está ${txt}?`,
                )),
            right: pair(lo),
            wrong: wrongs,
            ...X(
              neg
                ? `${subj[0]} is to the left of 0. Counting left from 0, it passes ${S(lo + 1)} and stops before ${S(lo)}. So it is between ${S(lo)} and ${S(lo + 1)}.`
                : `${subj[0]} is to the right of 0. Counting right from 0, it passes ${S(lo)} and stops before ${S(lo + 1)}. So it is between ${S(lo)} and ${S(lo + 1)}.`,
              neg
                ? `${subj[1]} está a la izquierda de 0. Contando a la izquierda desde 0, pasa ${S(lo + 1)} y se detiene antes de ${S(lo)}. Por eso está entre ${S(lo)} y ${S(lo + 1)}.`
                : `${subj[1]} está a la derecha de 0. Contando a la derecha desde 0, pasa ${S(lo)} y se detiene antes de ${S(lo + 1)}. Por eso está entre ${S(lo)} y ${S(lo + 1)}.`,
            ),
            ...H(
              [
                "Find which side of 0 the number is on. Then count whole numbers from 0.",
                "Halla de qué lado de 0 está el número. Luego cuenta números enteros desde 0.",
              ],
              [
                "The number is not a whole number. It sits between two whole numbers that are next to each other.",
                "El número no es entero. Está entre dos números enteros que van uno junto al otro.",
              ],
              [
                "Pass the whole number you know and stop before the next one. Name both.",
                "Pasa el número entero que conoces y detente antes del siguiente. Nombra ambos.",
              ],
            ),
            viz: useViz ? nline(-5, 5, 1 / den, [{ v: kk / den, l: p }]) : undefined,
            meta: { txt, viz: useViz },
          });
        },
        check(item) {
          const v = item.meta.viz ? item.viz.marks[0].v : G.value(item.meta.txt);
          let lo = -10;
          while (lo + 1 <= v) lo++;
          return judge(item, (c) => c === `${S(lo)} and ${S(lo + 1)}`);
        },
      },

      half: {
        lv: [4],
        make(rng) {
          const { den, E, kmax } = geo(rng.pick([2, 4]), 4);
          const g = 2 * rng.int(1, kmax);
          const ka = rng.int(-kmax, kmax - g);
          const kb = ka + g;
          const lead = rng.pick(LEADR);
          return numq({
            ...Q(
              `${lead[0]} Point M is exactly halfway between point A and point B on the number line. What number does point M show?`,
              `${lead[1]} El punto M está exactamente a la mitad entre el punto A y el punto B en la recta numérica. ¿Qué número muestra el punto M?`,
            ),
            a: (ka + g / 2) / den,
            fw: [
              bad(g / 2 / den, "half-the-distance"),
              bad((ka + kb) / den, "added-endpoints"),
              bad(g / den, "gave-distance"),
            ],
            ...X(
              `A is at ${R(ka, den, "dec")} and B is at ${R(kb, den, "dec")}. They are ${g} ticks apart, so M is ${g / 2} ${pl(g / 2, "tick", "ticks")} from A. That is ${R(ka + g / 2, den, "dec")}.`,
              `A está en ${R(ka, den, "dec")} y B está en ${R(kb, den, "dec")}. Hay ${g} marcas entre ellos, así que M está a ${g / 2} ${pl(g / 2, "marca", "marcas")} de A. Eso es ${R(ka + g / 2, den, "dec")}.`,
            ),
            ...H(
              [
                "Read the numbers at A and B from the number line.",
                "Lee los números de A y de B en la recta numérica.",
              ],
              [
                "Count the ticks from A to B. Halfway is half of that many ticks.",
                "Cuenta las marcas de A a B. La mitad del camino es la mitad de esa cantidad de marcas.",
              ],
              [
                "Start at A and move that many ticks toward B. Read the number where you stop.",
                "Empieza en A y avanza esa cantidad de marcas hacia B. Lee el número donde te detienes.",
              ],
            ),
            viz: nline(-E, E, 1 / den, [
              { v: ka / den, l: "A" },
              { v: kb / den, l: "B" },
            ]),
            meta: { den },
          });
        },
        check(item) {
          const a = mark(item, "A").v;
          const b = mark(item, "B").v;
          const unit = 1 / item.meta.den;
          const half = Math.round(steps(a, b, unit) / unit) / 2;
          return typed(item, a + half * unit * (b > a ? 1 : -1));
        },
      },
    },
  );
  /* ================================================================================================
   * absoluteValue (7-3): distance from 0, absolute value in context, comparing absolute values
   * ============================================================================================== */
  Object.assign(FB, {
    "kept-negative": [
      "The negative sign stays on the number, but not on its absolute value. A distance from 0 is never negative.",
      "El signo negativo se queda en el número, pero no en su valor absoluto. Una distancia desde 0 nunca es negativa.",
    ],
    "treated-as-opposite": [
      "Absolute value is not the opposite. It tells how far a number is from 0, and a distance is never negative.",
      "El valor absoluto no es el opuesto. Dice qué tan lejos está un número de 0, y una distancia nunca es negativa.",
    ],
    "cancels-to-zero": [
      "A negative sign does not cancel to 0. The number is still some distance from 0.",
      "Un signo negativo no se cancela a 0. El número sigue estando a cierta distancia de 0.",
    ],
    "counted-endpoints": [
      "That counts the marks you touch, including 0. Distance is the number of steps from 0, not the number of marks.",
      "Eso cuenta las marcas que tocas, incluido el 0. La distancia es el número de pasos desde 0, no el número de marcas.",
    ],
    "went-both-ways": [
      "That counts the distance to 0 and back again. Absolute value is the distance one way, from 0 to the number.",
      "Eso cuenta la distancia hasta 0 y de regreso. El valor absoluto es la distancia en un solo sentido, de 0 al número.",
    ],
    "value-not-distance": [
      "That compares the numbers by their place on the number line. Absolute value compares how far each number is from 0.",
      "Eso compara los números por su lugar en la recta numérica. El valor absoluto compara qué tan lejos está cada número de 0.",
    ],
    "least-vs-greatest": [
      "You may have mixed up greatest and least. Find each number's distance from 0 first, then choose.",
      "Quizás confundiste mayor y menor. Primero halla la distancia de cada número a 0 y luego elige.",
    ],
    "misread-distance": [
      "Check this number's distance from 0 against the others. Find all of the distances before you choose.",
      "Compara la distancia de este número a 0 con las demás. Halla todas las distancias antes de elegir.",
    ],
    "added-signed": [
      "That adds the numbers with their signs. The bars come first: find each absolute value, then combine them.",
      "Eso suma los números con sus signos. Primero van las barras: halla cada valor absoluto y luego combínalos.",
    ],
    "abs-of-sum": [
      "The bars belong to each number separately. Find each absolute value first, then combine them.",
      "Las barras son de cada número por separado. Primero halla cada valor absoluto y luego combínalos.",
    ],
    "only-positive": [
      "Two numbers are that far from 0, one on each side of 0. Do not stop at the positive one.",
      "Hay dos números a esa distancia de 0, uno de cada lado de 0. No te detengas en el positivo.",
    ],
    "only-negative": [
      "Two numbers are that far from 0, one on each side of 0. Do not stop at the negative one.",
      "Hay dos números a esa distancia de 0, uno de cada lado de 0. No te detengas en el negativo.",
    ],
    "gap-not-distance": [
      "That is the gap between the two numbers. The statement says x is that many units from 0.",
      "Esa es la separación entre los dos números. El enunciado dice que x está a esa cantidad de unidades de 0.",
    ],
    "forgot-direction": [
      "Absolute value hides the sign. Use the words in the story (below, owes, loss) to decide whether the number is negative.",
      "El valor absoluto oculta el signo. Usa las palabras del problema (bajo, debe, pérdida) para decidir si el número es negativo.",
    ],
    "only-one-side": [
      "Look on both sides of 0. A number on each side can be the same distance from 0.",
      "Mira ambos lados de 0. Un número de cada lado puede estar a la misma distancia de 0.",
    ],
    "counted-units": [
      "That counts units. The question asks how many NUMBERS are that far from 0.",
      "Eso cuenta unidades. La pregunta pide cuántos NÚMEROS están a esa distancia de 0.",
    ],
    "always-two": [
      "0 is its own opposite, so only one number is 0 units from 0.",
      "0 es su propio opuesto, así que solo un número está a 0 unidades de 0.",
    ],
    "thought-all-equal": [
      "Absolute value does not make different numbers equal. These two numbers are not the same distance from 0.",
      "El valor absoluto no hace iguales a números distintos. Estos dos números no están a la misma distancia de 0.",
    ],
  });
  const DL = (n) => `${n < 0 ? M : ""}$${f(Math.abs(n))}`;
  /** Distance from 0 found by walking, one tick at a time. */
  const dist0 = (v, unit = 1) => steps(0, v, unit);
  /** "How far from the starting level?" stories, one per context. */
  const DIST = [
    (n) => [
      `A ${n < 0 ? "submarine" : "helicopter"} is at an elevation of ${S(n)} meters. How far is it from sea level, in meters?`,
      `Un ${n < 0 ? "submarino" : "helicóptero"} está a una elevación de ${S(n)} metros. ¿A qué distancia está del nivel del mar, en metros?`,
    ],
    (n) => [
      `The temperature outside is ${S(n)}°C. How many degrees is that from 0°C?`,
      `La temperatura afuera es ${S(n)} °C. ¿A cuántos grados está de 0 °C?`,
    ],
    (n, who) => [
      `${who}'s account balance is ${DL(n)}. How many dollars is that from $0?`,
      `El saldo de la cuenta de ${who} es ${DL(n)}. ¿A cuántos dólares está de $0?`,
    ],
    (n) => [
      `An elevator display shows floor ${S(n)}. Floors below the ground are negative. How many floors is the elevator from the ground floor (floor 0)?`,
      `La pantalla de un elevador muestra el piso ${S(n)}. Los pisos bajo la planta baja son negativos. ¿A cuántos pisos está el elevador de la planta baja (piso 0)?`,
    ],
    (n, who) => [
      `After a round, ${who}'s score is ${S(n)} points. How many points is that from 0?`,
      `Después de una ronda, el puntaje de ${who} es ${S(n)} puntos. ¿A cuántos puntos está de 0?`,
    ],
    (n) => [
      `After a play, the ball is at ${S(n)} yards from the line of scrimmage. Negative means behind the line. How many yards is the ball from the line?`,
      `Después de una jugada, el balón está a ${S(n)} yardas de la línea de golpeo. Negativo significa detrás de la línea. ¿A cuántas yardas de la línea está el balón?`,
    ],
  ];
  /** Reverse stories: |d| is known and the words give the sign. */
  const REV = [
    (m, neg) => [
      `A diver's elevation is d meters and |d| = ${m}. The diver is ${neg ? "below" : "above"} sea level. What is d?`,
      `La elevación de un buzo es d metros y |d| = ${m}. El buzo está ${neg ? "bajo" : "sobre"} el nivel del mar. ¿Cuánto es d?`,
    ],
    (m, neg) => [
      `The temperature t in °C has |t| = ${m}. It is ${m} degrees ${neg ? "below" : "above"} zero. What is t?`,
      `La temperatura t en °C tiene |t| = ${m}. Está a ${m} grados ${neg ? "bajo" : "sobre"} cero. ¿Cuánto es t?`,
    ],
    (m, neg) => [
      `An account balance b, in dollars, has |b| = ${m}. The owner ${neg ? "owes money to the bank" : "has money in the bank"}. What is b?`,
      `El saldo b de una cuenta, en dólares, tiene |b| = ${m}. El dueño ${neg ? "le debe dinero al banco" : "tiene dinero en el banco"}. ¿Cuánto es b?`,
    ],
    (m, neg) => [
      `A play changes the ball's position by y yards, and |y| = ${m}. The team ${neg ? "lost" : "gained"} yards. What is y?`,
      `Una jugada cambia la posición del balón en y yardas, y |y| = ${m}. El equipo ${neg ? "perdió" : "ganó"} yardas. ¿Cuánto es y?`,
    ],
    (m, neg) => [
      `An elevator is at floor f and |f| = ${m}. It is ${neg ? "below" : "above"} the ground floor. What is f?`,
      `Un elevador está en el piso f y |f| = ${m}. Está ${neg ? "bajo" : "sobre"} la planta baja. ¿Cuánto es f?`,
    ],
    (m, neg) => [
      `A player's score change is s points and |s| = ${m}. The player ${neg ? "lost" : "earned"} points. What is s?`,
      `El cambio de puntaje de un jugador es s puntos y |s| = ${m}. El jugador ${neg ? "perdió" : "ganó"} puntos. ¿Cuánto es s?`,
    ],
  ];
  const absHints = (what) =>
    H(
      [
        "Absolute value is the distance from a number to 0 on the number line.",
        "El valor absoluto es la distancia de un número a 0 en la recta numérica.",
      ],
      [
        `Picture ${what} on a number line. Count the steps from 0.`,
        `Imagina ${what} en una recta numérica. Cuenta los pasos desde 0.`,
      ],
      [
        "A distance is never negative. How many steps did you count?",
        "Una distancia nunca es negativa. ¿Cuántos pasos contaste?",
      ],
    );

  reg("absoluteValue", "Absolute value", "Valor absoluto", {
    absNum: {
      lv: [1],
      make(rng) {
        const a = rng.int(1, 25) * (rng.chance(0.65) ? -1 : 1);
        const d = Math.abs(a);
        const q = rng.pick([
          [`What is ${ABS(a)}?`, `¿Cuánto es ${ABS(a)}?`],
          [`What is the absolute value of ${S(a)}?`, `¿Cuál es el valor absoluto de ${S(a)}?`],
        ]);
        return mcq(rng, {
          ...Q(...q),
          right: S(d),
          wrong:
            a < 0
              ? [
                  bad(S(a), "kept-negative"),
                  bad("0", "cancels-to-zero"),
                  bad(S(d + 1), "counted-endpoints"),
                  bad(S(2 * d), "went-both-ways"),
                ]
              : [
                  bad(S(-a), "treated-as-opposite"),
                  bad(S(d + 1), "counted-endpoints"),
                  bad(S(2 * d), "went-both-ways"),
                ],
          ...X(
            `${S(a)} is ${d} units from 0, so ${ABS(a)} = ${d}. Absolute value is a distance, so it is never negative.`,
            `${S(a)} está a ${d} unidades de 0, así que ${ABS(a)} = ${d}. El valor absoluto es una distancia, así que nunca es negativo.`,
          ),
          ...absHints(S(a)),
          meta: { a },
        });
      },
      check(item) {
        const want = dist0(item.meta.a);
        return judge(item, (c) => near(G.value(c), want));
      },
    },

    distNL: {
      lv: [1, 2],
      make(rng, level) {
        const [en, es, ss] = rng.pick(LEAD);
        const step = level === 1 ? 1 : rng.pick(ss);
        const k = rng.pick([-1, 1]) * rng.int(2, 9);
        const t = k * step;
        const p = rng.pick(PT);
        const q = rng.pick([
          [
            `Point ${p} is shown. How many units is point ${p} from 0?`,
            `Se muestra el punto ${p}. ¿A cuántas unidades de 0 está el punto ${p}?`,
          ],
          [
            `Point ${p} is shown. What is the distance from 0 to point ${p}?`,
            `Se muestra el punto ${p}. ¿Cuál es la distancia de 0 al punto ${p}?`,
          ],
        ]);
        return numq({
          ...Q(`${en} ${q[0]}`, `${es} ${q[1]}`),
          a: Math.abs(t),
          fw: [
            t < 0 && bad(t, "kept-negative"),
            step > 1 && bad(Math.abs(k), "read-tick-as-one", step),
            bad(Math.abs(t) + step, "counted-endpoints"),
          ],
          ...X(
            `Point ${p} is at ${S(t)}. It is ${Math.abs(t)} units from 0, so the distance is ${Math.abs(t)}.`,
            `El punto ${p} está en ${S(t)}. Está a ${Math.abs(t)} unidades de 0, así que la distancia es ${Math.abs(t)}.`,
          ),
          ...H(
            [
              `Read the number at point ${p} from the labels under the number line.`,
              `Lee el número del punto ${p} en las marcas debajo de la recta numérica.`,
            ],
            step > 1
              ? [
                  "Check the scale. The ticks count by more than 1.",
                  "Fíjate en la escala. Las marcas cuentan de más de 1 en 1.",
                ]
              : [
                  "Distance is how many units you move to get from 0 to the point.",
                  "La distancia es cuántas unidades te mueves para ir de 0 al punto.",
                ],
            [
              "A distance is never negative, even when the point is left of 0.",
              "Una distancia nunca es negativa, aun cuando el punto esté a la izquierda de 0.",
            ],
          ),
          viz: nline(-10 * step, 10 * step, step, [{ v: t, l: p }]),
          meta: { step },
        });
      },
      check: (item) => typed(item, dist0(item.viz.marks[0].v, item.meta.step)),
    },

    ctxDist: {
      lv: [2],
      make(rng) {
        const i = rng.int(0, DIST.length - 1);
        const n = rng.int(3, i === 1 ? 39 : 90) * rng.pick([-1, 1]);
        const who = rng.pick(NAMES);
        const [en, es] = DIST[i](n, who);
        const d = Math.abs(n);
        return numq({
          ...Q(en, es),
          a: d,
          fw: [
            bad(n < 0 ? n : -n, n < 0 ? "kept-negative" : "treated-as-opposite"),
            bad(2 * d, "went-both-ways"),
          ],
          ...X(
            `The distance from 0 is the absolute value: ${ABS(n)} = ${d}. A distance is never negative.`,
            `La distancia desde 0 es el valor absoluto: ${ABS(n)} = ${d}. Una distancia nunca es negativa.`,
          ),
          ...absHints(S(n)),
          meta: { i, n },
        });
      },
      check: (item) => typed(item, dist0(item.meta.n)),
    },

    cmpAbs: {
      lv: [2, 3],
      make(rng, level) {
        const unit = level === 3 ? 0.5 : 1;
        const greatest = rng.chance(0.5);
        let nums;
        let right;
        let valExt;
        for (let tries = 0; tries < 60; tries++) {
          nums = rng.distinct(4, 1, level === 3 ? 19 : 15).map((m) => m * unit * rng.pick([-1, 1]));
          if (!(nums.some((n) => n < 0) && nums.some((n) => n > 0))) continue;
          const byAbs = nums.slice().sort((p, q) => Math.abs(p) - Math.abs(q));
          right = greatest ? byAbs[3] : byAbs[0];
          valExt = greatest ? Math.max(...nums) : Math.min(...nums);
          if (valExt !== right) break;
        }
        const byAbs = nums.slice().sort((p, q) => Math.abs(p) - Math.abs(q));
        const oppExt = greatest ? byAbs[0] : byAbs[3];
        return mcq(rng, {
          ...Q(
            `Which number has the ${greatest ? "greatest" : "least"} absolute value?`,
            `¿Qué número tiene el ${greatest ? "mayor" : "menor"} valor absoluto?`,
          ),
          right: S(right),
          wrong: nums
            .filter((n) => n !== right)
            .map((n) =>
              bad(
                S(n),
                n === valExt
                  ? "value-not-distance"
                  : n === oppExt
                    ? "least-vs-greatest"
                    : "misread-distance",
              ),
            ),
          ...X(
            `The distances from 0 are ${nums.map((n) => `${ABS(n)} = ${f(Math.abs(n))}`).join(", ")}. The ${greatest ? "greatest" : "least"} is ${f(Math.abs(right))}, so the answer is ${S(right)}.`,
            `Las distancias desde 0 son ${nums.map((n) => `${ABS(n)} = ${f(Math.abs(n))}`).join(", ")}. La ${greatest ? "mayor" : "menor"} es ${f(Math.abs(right))}, así que la respuesta es ${S(right)}.`,
          ),
          ...H(
            [
              "Absolute value is the distance from 0. Find the distance of every number.",
              "El valor absoluto es la distancia a 0. Halla la distancia de cada número.",
            ],
            [
              `Set the signs aside for a moment. Which distance is the ${greatest ? "biggest" : "smallest"}?`,
              `Deja los signos a un lado un momento. ¿Cuál distancia es la ${greatest ? "mayor" : "menor"}?`,
            ],
            [
              "Choose the number that has that distance. It keeps its own sign.",
              "Elige el número que tiene esa distancia. Conserva su propio signo.",
            ],
          ),
          meta: { unit, greatest },
        });
      },
      check(item) {
        const dists = item.c.map((c) => dist0(G.value(c), item.meta.unit));
        const target = item.meta.greatest ? Math.max(...dists) : Math.min(...dists);
        return judge(item, (_c, i) => near(dists[i], target));
      },
    },

    why: {
      lv: [3],
      make(rng) {
        const neg = -rng.int(2, 15);
        const equal = rng.chance(0.25);
        const pos = equal ? -neg : rng.int(1, -neg - 1);
        const negFirst = rng.chance(0.5);
        const [a, b] = negFirst ? [neg, pos] : [pos, neg];
        const sym = (u, v) => (u < v ? "<" : u > v ? ">" : "=");
        const truth = sym(Math.abs(a), Math.abs(b));
        const raw = sym(a, b);
        const st = (s, en, es) => [
          `${ABS(a)} ${s} ${ABS(b)}, because ${en}`,
          `${ABS(a)} ${s} ${ABS(b)}, porque ${es}`,
        ];
        const dist = equal
          ? st(
              truth,
              `${S(a)} and ${S(b)} are both ${Math.abs(a)} units from 0.`,
              `${S(a)} y ${S(b)} están ambos a ${Math.abs(a)} unidades de 0.`,
            )
          : st(
              truth,
              `${S(a)} is ${Math.abs(a)} units from 0 and ${S(b)} is ${Math.abs(b)} units from 0.`,
              `${S(a)} está a ${Math.abs(a)} unidades de 0 y ${S(b)} está a ${Math.abs(b)} unidades de 0.`,
            );
        const lessEn = raw === "<" ? "less" : "greater";
        const value = st(
          raw,
          `${S(a)} is ${lessEn} than ${S(b)}.`,
          `${S(a)} es ${raw === "<" ? "menor" : "mayor"} que ${S(b)}.`,
        );
        const kept = st(
          raw,
          `${ABS(neg)} is ${S(neg)}, and a negative number is ${negFirst ? "less than a positive number" : "less than a positive number"}.`,
          `${ABS(neg)} es ${S(neg)}, y un número negativo es menor que un número positivo.`,
        );
        const third = equal
          ? st(
              negFirst ? ">" : "<",
              `${ABS(neg)} is ${S(-neg)} but ${ABS(pos)} is ${S(-pos)}, since absolute value changes the sign of every number.`,
              `${ABS(neg)} es ${S(-neg)} pero ${ABS(pos)} es ${S(-pos)}, ya que el valor absoluto cambia el signo de todos los números.`,
            )
          : st(
              "=",
              "absolute value makes every number positive, so the two are equal.",
              "el valor absoluto vuelve positivos a todos los números, así que los dos son iguales.",
            );
        const ch = (pair, tag, fbTag) => badEs(pair[0], pair[1], fbTag || tag);
        return mcq(rng, {
          ...Q(
            `Compare ${ABS(a)} and ${ABS(b)}. Which statement is correct and gives the right reason?`,
            `Compara ${ABS(a)} y ${ABS(b)}. ¿Qué enunciado es correcto y da la razón correcta?`,
          ),
          right: { v: dist[0], vEs: dist[1] },
          wrong: [
            ch(value, "value-not-distance"),
            ch(kept, "kept-negative"),
            ch(third, equal ? "treated-as-opposite" : "thought-all-equal"),
          ],
          ...X(
            `${S(a)} is ${Math.abs(a)} units from 0 and ${S(b)} is ${Math.abs(b)} units from 0. Absolute value is distance, so ${ABS(a)} ${truth} ${ABS(b)}.`,
            `${S(a)} está a ${Math.abs(a)} unidades de 0 y ${S(b)} está a ${Math.abs(b)} unidades de 0. El valor absoluto es distancia, así que ${ABS(a)} ${truth} ${ABS(b)}.`,
          ),
          ...H(
            [
              "Absolute value is the distance from 0. It does not care about the sign.",
              "El valor absoluto es la distancia a 0. No le importa el signo.",
            ],
            [
              "Find each distance from 0 on a number line.",
              "Halla cada distancia a 0 en una recta numérica.",
            ],
            [
              "Compare the two distances, not the two numbers.",
              "Compara las dos distancias, no los dos números.",
            ],
          ),
          meta: { a, b },
        });
      },
      check(item) {
        const [a, b] = [item.meta.a, item.meta.b];
        const da = dist0(a);
        const db = dist0(b);
        const truth = da < db ? "<" : da > db ? ">" : "=";
        return judge(item, (c) => {
          const m = /^\|.+\| ([<>=]) \|.+\|/.exec(c);
          return !!m && m[1] === truth;
        });
      },
    },

    sumAbs: {
      lv: [3],
      make(rng) {
        const add = rng.chance(0.6);
        let a;
        let b;
        do {
          a = rng.int(2, 15) * rng.pick([-1, 1]);
          b = rng.int(2, 15) * rng.pick([-1, 1]);
        } while ((a > 0 && b > 0) || (!add && Math.abs(a) <= Math.abs(b)));
        const ans = add ? Math.abs(a) + Math.abs(b) : Math.abs(a) - Math.abs(b);
        const op = add ? "+" : M;
        return numq({
          ...Q(`Find ${ABS(a)} ${op} ${ABS(b)}.`, `Halla ${ABS(a)} ${op} ${ABS(b)}.`),
          a: ans,
          fw: [
            bad(add ? a + b : a - b, "added-signed"),
            bad(Math.abs(add ? a + b : a - b), "abs-of-sum"),
            bad(-ans, "kept-negative"),
          ],
          ...X(
            `${ABS(a)} = ${Math.abs(a)} and ${ABS(b)} = ${Math.abs(b)}. Then ${Math.abs(a)} ${op} ${Math.abs(b)} = ${ans}.`,
            `${ABS(a)} = ${Math.abs(a)} y ${ABS(b)} = ${Math.abs(b)}. Entonces ${Math.abs(a)} ${op} ${Math.abs(b)} = ${ans}.`,
          ),
          ...H(
            [
              "The bars mean absolute value. Find each absolute value first.",
              "Las barras significan valor absoluto. Primero halla cada valor absoluto.",
            ],
            [
              "Each absolute value is a distance from 0, so it is never negative.",
              "Cada valor absoluto es una distancia a 0, así que nunca es negativo.",
            ],
            [
              `Now ${add ? "add" : "subtract"} the two distances.`,
              `Ahora ${add ? "suma" : "resta"} las dos distancias.`,
            ],
          ),
          meta: { a, b },
        });
      },
      check(item) {
        const m = /^Find \|(.+)\| ([+−]) \|(.+)\|\.$/.exec(item.q);
        if (!m) return "stem does not parse";
        const da = dist0(G.value(m[1]));
        const db = dist0(G.value(m[3]));
        return typed(item, m[2] === "+" ? da + db : da - db);
      },
    },

    solve: {
      lv: [4],
      make(rng) {
        const d = rng.int(2, 30);
        const q = rng.pick([
          [
            `If |x| = ${d}, which values could x be?`,
            `Si |x| = ${d}, ¿qué valores podría tener x?`,
          ],
          [
            `A number x is exactly ${d} units from 0 on the number line. Which statement is true?`,
            `Un número x está exactamente a ${d} unidades de 0 en la recta numérica. ¿Qué enunciado es verdadero?`,
          ],
        ]);
        const opt = (en, es, tag) => badEs(en, es, tag);
        return mcq(rng, {
          ...Q(...q),
          right: {
            v: `x = ${d} or x = ${M}${d}`,
            vEs: `x = ${d} o x = ${M}${d}`,
          },
          wrong: [
            opt(`x = ${d} only`, `solo x = ${d}`, "only-positive"),
            opt(`x = ${M}${d} only`, `solo x = ${M}${d}`, "only-negative"),
            opt(
              `x = ${2 * d} or x = ${M}${2 * d}`,
              `x = ${2 * d} o x = ${M}${2 * d}`,
              "gap-not-distance",
            ),
          ],
          ...X(
            `|x| = ${d} means x is ${d} units from 0. Going ${d} units right gives ${d}. Going ${d} units left gives ${M}${d}. So x = ${d} or x = ${M}${d}.`,
            `|x| = ${d} significa que x está a ${d} unidades de 0. Ir ${d} unidades a la derecha da ${d}. Ir ${d} unidades a la izquierda da ${M}${d}. Entonces x = ${d} o x = ${M}${d}.`,
          ),
          ...H(
            [
              `Absolute value is distance from 0. So x is ${d} units from 0.`,
              `El valor absoluto es la distancia a 0. Entonces x está a ${d} unidades de 0.`,
            ],
            [
              "On a number line, you can go from 0 to the right or to the left.",
              "En una recta numérica puedes ir de 0 hacia la derecha o hacia la izquierda.",
            ],
            [
              "Name the number you reach each way.",
              "Nombra el número al que llegas en cada sentido.",
            ],
          ),
          meta: { d },
        });
      },
      check(item) {
        const m = /(\d+)\.?$|\|x\| = (\d+)|exactly (\d+) units/.exec(item.q);
        const d = Number(m[1] || m[2] || m[3]);
        const reach = [];
        for (let x = -60; x <= 60; x++) if (dist0(x) === d) reach.push(x);
        return judge(item, (c) => {
          const vals = [...c.matchAll(/x = (−?\d+)/g)].map((v) => G.value(v[1]));
          return vals.length === reach.length && reach.every((x) => vals.includes(x));
        });
      },
    },

    ctxRev: {
      lv: [4],
      make(rng) {
        const i = rng.int(0, REV.length - 1);
        const m = rng.int(3, i === 1 ? 39 : 80);
        const neg = rng.chance(0.65);
        const [en, es] = REV[i](m, neg);
        const ans = neg ? -m : m;
        return numq({
          ...Q(en, es),
          a: ans,
          fw: [bad(-ans, "forgot-direction")],
          ...X(
            `|${neg ? "d" : "d"}| = ${m} means the number is ${m} units from 0. The words in the story put it on the ${neg ? "negative" : "positive"} side, so it is ${S(ans)}.`,
            `El valor absoluto ${m} significa que el número está a ${m} unidades de 0. Las palabras del problema lo ponen del lado ${neg ? "negativo" : "positivo"}, así que es ${S(ans)}.`,
          ),
          ...H(
            [
              `|d| = ${m} tells only the distance from 0. It does not tell the sign.`,
              `|d| = ${m} solo dice la distancia a 0. No dice el signo.`,
            ],
            [
              "The words in the story tell which side of 0 the number is on.",
              "Las palabras del problema dicen de qué lado de 0 está el número.",
            ],
            [
              "Write the distance with the sign that matches those words.",
              "Escribe la distancia con el signo que corresponde a esas palabras.",
            ],
          ),
          meta: { i, m, neg },
        });
      },
      check(item) {
        const side = /below|owes|lost|bajo|debe|perdió/.test(item.q) ? -1 : 1;
        const m = Number(/= (\d+)/.exec(item.q)[1]);
        return typed(item, side * m);
      },
    },

    count: {
      lv: [4],
      make(rng) {
        const d = rng.chance(0.15) ? 0 : rng.int(1, 30);
        const ans = d === 0 ? 1 : 2;
        return numq({
          ...Q(
            `How many numbers are exactly ${d} units from 0 on the number line?`,
            `¿Cuántos números están exactamente a ${d} unidades de 0 en la recta numérica?`,
          ),
          a: ans,
          fw:
            d === 0
              ? [bad(2, "always-two")]
              : [bad(1, "only-one-side"), bad(2 * d, "counted-units")],
          ...X(
            d === 0
              ? "Only 0 is 0 units from 0, because 0 is its own opposite. So the answer is 1."
              : `${d} and ${M}${d} are both ${d} units from 0, one on each side. So the answer is 2.`,
            d === 0
              ? "Solo 0 está a 0 unidades de 0, porque 0 es su propio opuesto. Entonces la respuesta es 1."
              : `${d} y ${M}${d} están ambos a ${d} unidades de 0, uno de cada lado. Entonces la respuesta es 2.`,
          ),
          ...H(
            [
              "A number is a certain distance from 0 when you can walk that many units from 0 to reach it.",
              "Un número está a cierta distancia de 0 cuando puedes caminar esa cantidad de unidades desde 0 para llegar a él.",
            ],
            [
              "You can walk to the right of 0 or to the left of 0.",
              "Puedes caminar a la derecha de 0 o a la izquierda de 0.",
            ],
            [
              "Count the different numbers you can reach. Be careful when the distance is 0.",
              "Cuenta los números distintos a los que puedes llegar. Ten cuidado cuando la distancia es 0.",
            ],
          ),
          meta: { d },
        });
      },
      check(item) {
        const d = Number(/exactly (\d+) units/.exec(item.q)[1]);
        let n = 0;
        for (let x = -60; x <= 60; x++) if (dist0(x) === d) n++;
        return typed(item, n);
      },
    },
  });
  /* ================================================================================================
   * compareOrder (7-4): compare with < > =, order lists, least and greatest in context
   * ============================================================================================== */
  Object.assign(FB, {
    "bigger-digit": [
      "Bigger digits do not make a negative number greater. The number farther left on the number line is less.",
      "Los dígitos más grandes no hacen mayor a un número negativo. El número que está más a la izquierda en la recta numérica es menor.",
    ],
    "negative-bigger": [
      "That compares the numbers as if they had no signs. Every negative number is to the left of 0, so it is less than any positive number.",
      "Eso compara los números como si no tuvieran signo. Todo número negativo está a la izquierda de 0, así que es menor que cualquier número positivo.",
    ],
    "reversed-symbol": [
      "The symbol points the wrong way. The open side of the symbol faces the greater number.",
      "El símbolo apunta al lado equivocado. El lado abierto del símbolo mira al número mayor.",
    ],
    "thought-equal": [
      "These numbers are not equal. Picture both on a number line: they are in different places.",
      "Estos números no son iguales. Imagina los dos en una recta numérica: están en lugares distintos.",
    ],
    "forms-differ": [
      "These are two ways to write the same number, so they sit at the same spot on the number line.",
      "Estas son dos formas de escribir el mismo número, así que están en el mismo lugar de la recta numérica.",
    ],
    misordered: [
      "Check where this number sits on the number line compared with the others.",
      "Revisa dónde está este número en la recta numérica comparado con los demás.",
    ],
    "ordered-by-size": [
      "That orders the numbers by how big they look, ignoring the signs. Negative numbers sit to the left of 0.",
      "Eso ordena los números por su tamaño, sin mirar los signos. Los números negativos están a la izquierda de 0.",
    ],
    "reversed-order": [
      "That list goes the other way. Least to greatest reads left to right on a number line.",
      "Esa lista va en el otro sentido. De menor a mayor se lee de izquierda a derecha en la recta numérica.",
    ],
    "negatives-by-digit": [
      "The negative numbers are in the wrong order. Among negatives, the one with the bigger digits is farther left, so it is less.",
      "Los números negativos están en el orden equivocado. Entre los negativos, el de dígitos más grandes está más a la izquierda, así que es menor.",
    ],
    "farther-means-greater": [
      "Being farther from 0 does not make a negative number greater. Greater means farther to the right.",
      "Estar más lejos de 0 no hace mayor a un número negativo. Mayor significa más a la derecha.",
    ],
  });
  const SYM = (u, v) => (u < v ? "<" : u > v ? ">" : "=");
  const cmpH = (extra) =>
    H(
      [
        "On a number line, numbers farther to the right are greater and numbers farther to the left are less.",
        "En la recta numérica, los números más a la derecha son mayores y los más a la izquierda son menores.",
      ],
      [
        extra || "Picture the numbers on a number line. Which one is farther to the left?",
        extra ? "" : "Imagina los números en una recta numérica. ¿Cuál está más a la izquierda?",
      ],
      [
        "The one farther left is less. Use that to choose.",
        "El que está más a la izquierda es menor. Úsalo para elegir.",
      ],
    );
  /** A rational {k, den, form}; level 1-2 integers, level 3 mixed forms. */
  const rat = (rng, mixed, lo = 1, hi = 12) => {
    if (!mixed) return { k: rng.int(lo, hi) * rng.pick([-1, 1]), den: 1, form: "dec" };
    const den = rng.pick([2, 4, 5, 10]);
    return {
      k: rng.int(1, den * 4) * rng.pick([-1, 1]),
      den,
      form: rng.pick(["dec", "frac", "mixed"]),
    };
  };
  const rv = (r) => r.k / r.den;
  const rt = (r) => R(r.k, r.den, r.form);
  /** Exact comparison by cross-multiplying. */
  const rcmp = (a, b) => Math.sign(a.k * b.den - b.k * a.den);
  const distinctRats = (rng, n, mixed, lo, hi) => {
    const out = [];
    while (out.length < n) {
      const r = rat(rng, mixed, lo, hi);
      if (!out.some((o) => rcmp(o, r) === 0)) out.push(r);
    }
    return out;
  };
  const stmtParts = (c) => /^(.+) ([<>=]) (.+)$/.exec(c);

  reg("compareOrder", "Compare and order numbers", "Comparar y ordenar números", {
    sym: {
      lv: [1, 2],
      make(rng, level) {
        const mixed = level === 2;
        const a = rat(rng, mixed);
        let b;
        do b = rat(rng, mixed);
        while (rcmp(a, b) === 0 && !(mixed && rng.chance(0.2) && a.den !== 1));
        if (rcmp(a, b) === 0) b = { k: a.k * 2, den: a.den * 2, form: rng.pick(["dec", "frac"]) };
        const t = SYM(rv(a), rv(b));
        const bothNeg = rv(a) < 0 && rv(b) < 0;
        const wrongTag =
          t === "="
            ? "forms-differ"
            : bothNeg
              ? "bigger-digit"
              : rv(a) * rv(b) < 0
                ? "negative-bigger"
                : "reversed-symbol";
        return mcq(rng, {
          ...Q(
            `Which symbol makes the statement true? ${rt(a)} ___ ${rt(b)}`,
            `¿Qué símbolo hace verdadero el enunciado? ${rt(a)} ___ ${rt(b)}`,
          ),
          right: t,
          wrong: ["<", ">", "="]
            .filter((s) => s !== t)
            .map((s) => bad(s, s === "=" ? "thought-equal" : wrongTag)),
          ...X(
            t === "="
              ? `${rt(a)} and ${rt(b)} name the same number, so ${rt(a)} = ${rt(b)}.`
              : `${rt(a)} is ${t === "<" ? "to the left of" : "to the right of"} ${rt(b)} on the number line, so ${rt(a)} ${t} ${rt(b)}.`,
            t === "="
              ? `${rt(a)} y ${rt(b)} son el mismo número, así que ${rt(a)} = ${rt(b)}.`
              : `${rt(a)} está ${t === "<" ? "a la izquierda de" : "a la derecha de"} ${rt(b)} en la recta numérica, así que ${rt(a)} ${t} ${rt(b)}.`,
          ),
          ...cmpH(),
          meta: { a, b },
        });
      },
      check(item) {
        const [a, b] = [item.meta.a, item.meta.b];
        const d = a.k * b.den - b.k * a.den;
        const want = d < 0 ? "<" : d > 0 ? ">" : "=";
        return judge(item, (c) => c === want);
      },
    },

    stmts: {
      lv: [1, 3],
      make(rng, level) {
        const mixed = level === 3;
        const t = rng.int(0, 3);
        const rows = [];
        while (rows.length < 4) {
          const a = rat(rng, mixed);
          const b = rat(rng, mixed);
          if (rcmp(a, b) === 0 || rows.some((r) => rcmp(r.a, a) === 0 && rcmp(r.b, b) === 0))
            continue;
          rows.push({ a, b });
        }
        const items = rows.map(({ a, b }, i) => {
          const truth = SYM(rv(a), rv(b));
          const sym = i === t ? truth : truth === "<" ? ">" : "<";
          const text = `${rt(a)} ${sym} ${rt(b)}`;
          const bothNeg = rv(a) < 0 && rv(b) < 0;
          const mix =
            rv(a) * rv(b) < 0 &&
            Math.abs(Math.min(rv(a), rv(b))) > Math.abs(Math.max(rv(a), rv(b)));
          return {
            text,
            tag: bothNeg ? "bigger-digit" : mix ? "negative-bigger" : "reversed-symbol",
          };
        });
        return mcq(rng, {
          ...Q("Which statement is true?", "¿Qué enunciado es verdadero?"),
          right: items[t].text,
          wrong: items.filter((_, i) => i !== t).map((e) => bad(e.text, e.tag)),
          ...X(
            `${items[t].text} is true: its symbol opens toward the greater number. In each of the others the symbol points the wrong way.`,
            `${items[t].text} es verdadero: su símbolo se abre hacia el número mayor. En cada uno de los otros el símbolo apunta al lado equivocado.`,
          ),
          ...cmpH(),
          meta: { mixed },
        });
      },
      check: (item) =>
        judge(item, (c) => {
          const m = stmtParts(c);
          const [u, v] = [G.value(m[1]), G.value(m[3])];
          return (m[2] === "<" && u < v - 1e-12) || (m[2] === ">" && u > v + 1e-12);
        }),
    },

    extreme: {
      lv: [1, 2],
      make(rng, level) {
        const greatest = rng.chance(0.5);
        let nums;
        do nums = rng.distinct(4, 1, level === 1 ? 12 : 30).map((m) => m * rng.pick([-1, -1, 1]));
        while (nums.filter((n) => n < 0).length < 2);
        const ext = greatest ? Math.max(...nums) : Math.min(...nums);
        const opp = greatest ? Math.min(...nums) : Math.max(...nums);
        const negs = nums.filter((n) => n < 0);
        const digit = greatest ? Math.min(...negs) : Math.max(...negs);
        return mcq(rng, {
          ...Q(
            `Which number is the ${greatest ? "greatest" : "least"}?`,
            `¿Qué número es el ${greatest ? "mayor" : "menor"}?`,
          ),
          right: S(ext),
          wrong: nums
            .filter((n) => n !== ext)
            .map((n) =>
              bad(
                S(n),
                n === opp ? "least-vs-greatest" : n === digit ? "bigger-digit" : "misordered",
              ),
            ),
          ...X(
            `On a number line the order is ${nums
              .slice()
              .sort((p, q) => p - q)
              .map(S)
              .join(
                ", ",
              )}. The ${greatest ? "greatest" : "least"} is the one farthest ${greatest ? "right" : "left"}: ${S(ext)}.`,
            `En la recta numérica el orden es ${nums
              .slice()
              .sort((p, q) => p - q)
              .map(S)
              .join(
                ", ",
              )}. El ${greatest ? "mayor" : "menor"} es el que está más a la ${greatest ? "derecha" : "izquierda"}: ${S(ext)}.`,
          ),
          ...cmpH(
            `Picture all four numbers on a number line. Which is farthest ${greatest ? "right" : "left"}?`,
          ),
          meta: { greatest },
        });
      },
      check(item) {
        const vals = item.c.map((c) => G.value(c));
        // rank by counting how many of the others each number beats
        const beats = vals.map((v) => vals.filter((w) => w < v).length);
        const want = item.meta.greatest ? 3 : 0;
        return judge(item, (_c, i) => beats[i] === want);
      },
    },

    orderList: {
      lv: [2, 3],
      make(rng, level) {
        const mixed = level === 3;
        let xs;
        for (;;) {
          xs = distinctRats(rng, rng.pick([4, 5]), mixed, 1, 12);
          const neg = xs.filter((r) => rv(r) < 0);
          const non = xs.filter((r) => rv(r) >= 0);
          if (
            neg.length >= 2 &&
            non.length >= 1 &&
            neg.some((r) => non.some((p) => Math.abs(rv(r)) > Math.abs(rv(p))))
          )
            break;
        }
        const asc = rng.chance(0.65);
        const by = (cmp) => xs.slice().sort(cmp);
        const val = (a, b) => rv(a) - rv(b);
        const right = by(asc ? val : (a, b) => val(b, a));
        const absSort = by((a, b) => (asc ? 1 : -1) * (Math.abs(rv(a)) - Math.abs(rv(b))));
        const rev = right.slice().reverse();
        const digit = by((a, b) => {
          const na = rv(a) < 0;
          const nb = rv(b) < 0;
          if (na !== nb) return (na ? -1 : 1) * (asc ? 1 : -1);
          return (asc ? 1 : -1) * (na ? Math.abs(rv(a)) - Math.abs(rv(b)) : rv(a) - rv(b));
        });
        const txt = (l) => l.map(rt).join(", ");
        return mcq(rng, {
          ...Q(
            `Order from ${asc ? "least to greatest" : "greatest to least"}: ${xs.map(rt).join(", ")}`,
            `Ordena de ${asc ? "menor a mayor" : "mayor a menor"}: ${xs.map(rt).join(", ")}`,
          ),
          right: txt(right),
          wrong: [
            bad(txt(absSort), "ordered-by-size"),
            bad(txt(rev), "reversed-order"),
            bad(txt(digit), "negatives-by-digit"),
          ],
          ...X(
            `On the number line, from left to right: ${txt(xs.slice().sort(val))}. ${asc ? "That is least to greatest." : "Greatest to least reads the other way."}`,
            `En la recta numérica, de izquierda a derecha: ${txt(xs.slice().sort(val))}. ${asc ? "Eso es de menor a mayor." : "De mayor a menor se lee al revés."}`,
          ),
          ...H(
            [
              mixed
                ? "Write every number in the same form, such as decimals, so they are easy to compare."
                : "Picture every number on a number line.",
              mixed
                ? "Escribe todos los números en la misma forma, como decimales, para compararlos fácilmente."
                : "Imagina cada número en una recta numérica.",
            ],
            [
              "Sort the negative numbers first. The one farthest left is the least.",
              "Ordena primero los números negativos. El que está más a la izquierda es el menor.",
            ],
            [
              asc
                ? "Read from left to right for least to greatest."
                : "Read from right to left for greatest to least.",
              asc
                ? "Lee de izquierda a derecha para ir de menor a mayor."
                : "Lee de derecha a izquierda para ir de mayor a menor.",
            ],
          ),
          meta: { asc },
        });
      },
      check(item) {
        const m = /: (.+)$/.exec(item.q);
        const vals = m[1].split(", ").map((t) => G.value(t));
        // selection: repeatedly take the smallest remaining
        const rest = vals.slice();
        const out = [];
        while (rest.length) {
          let j = 0;
          rest.forEach((v, i) => {
            if (v < rest[j]) j = i;
          });
          out.push(rest.splice(j, 1)[0]);
        }
        if (!/least to greatest|menor a mayor/.test(item.q)) out.reverse();
        return judge(item, (c) => {
          const got = c.split(", ").map((t) => G.value(t));
          return got.length === out.length && got.every((v, i) => near(v, out[i]));
        });
      },
    },

    ctx: {
      lv: [4],
      make(rng) {
        const C = rng.pick([
          {
            names: ["Anchorage", "Fargo", "Duluth", "Calgary", "Helsinki", "Oslo"],
            say: (v) => [`${S(v)}°C`, `${S(v)} °C`],
            lead: [
              "Four cities had these low temperatures:",
              "Cuatro ciudades tuvieron estas temperaturas mínimas:",
            ],
            least: ["Which city was the coldest?", "¿Qué ciudad fue la más fría?"],
            most: ["Which city was the warmest?", "¿Qué ciudad fue la más cálida?"],
          },
          {
            names: NAMES,
            pos: true,
            say: (v) => (v < 0 ? [`owes $${-v}`, `debe $${-v}`] : [`has $${v}`, `tiene $${v}`]),
            lead: ["Four friends checked their money:", "Cuatro amigos revisaron su dinero:"],
            least: ["Who has the least money?", "¿Quién tiene menos dinero?"],
            most: ["Who has the most money?", "¿Quién tiene más dinero?"],
          },
          {
            names: ["the whale", "the shark", "the turtle", "the seal", "the squid", "the dolphin"],
            say: (v) => [`${S(v)} meters`, `${S(v)} metros`],
            lead: [
              "Four sea animals were at these elevations, measured from sea level:",
              "Cuatro animales marinos estaban en estas elevaciones, medidas desde el nivel del mar:",
            ],
            least: ["Which animal was the deepest?", "¿Qué animal estaba más profundo?"],
            most: [
              "Which animal was closest to the surface?",
              "¿Qué animal estaba más cerca de la superficie?",
            ],
          },
          {
            names: NAMES,
            pos: true,
            say: (v) => [`${S(v)} points`, `${S(v)} puntos`],
            lead: [
              "Four players ended a game with these scores:",
              "Cuatro jugadores terminaron un juego con estos puntajes:",
            ],
            least: ["Who has the lowest score?", "¿Quién tiene el puntaje más bajo?"],
            most: ["Who has the highest score?", "¿Quién tiene el puntaje más alto?"],
          },
        ]);
        const greatest = rng.chance(0.5);
        const names = rng.shuffle(C.names).slice(0, 4);
        const vals = rng.distinct(4, 1, 30).map((m) => -m);
        if (C.pos && rng.chance(0.3)) vals[0] = rng.int(1, 12);
        const rows = names.map((n, i) => ({ n: cap(n), v: vals[i] }));
        const ext = greatest ? Math.max(...vals) : Math.min(...vals);
        const opp = greatest ? Math.min(...vals) : Math.max(...vals);
        const negs = vals.filter((v) => v < 0);
        const digit = greatest ? Math.min(...negs) : Math.max(...negs);
        const list = (i) => rows.map((r) => `${r.n} ${C.say(r.v)[i]}`).join("; ");
        const best = rows.find((r) => r.v === ext);
        return mcq(rng, {
          ...Q(
            `${C.lead[0]} ${list(0)}. ${(greatest ? C.most : C.least)[0]}`,
            `${C.lead[1]} ${list(1)}. ${(greatest ? C.most : C.least)[1]}`,
          ),
          right: best.n,
          wrong: rows
            .filter((r) => r !== best)
            .map((r) =>
              bad(
                r.n,
                r.v === opp ? "least-vs-greatest" : r.v === digit ? "bigger-digit" : "misordered",
              ),
            ),
          ...X(
            `Put the values in order on a number line: ${vals
              .slice()
              .sort((p, q) => p - q)
              .map(S)
              .join(
                ", ",
              )}. The ${greatest ? "greatest" : "least"} is ${S(ext)}, so the answer is ${best.n}. A number such as ${S(Math.min(...negs))} is less than ${S(Math.max(...negs))} even though its digits are bigger.`,
            `Ordena los valores en una recta numérica: ${vals
              .slice()
              .sort((p, q) => p - q)
              .map(S)
              .join(
                ", ",
              )}. El ${greatest ? "mayor" : "menor"} es ${S(ext)}, así que la respuesta es ${best.n}. Un número como ${S(Math.min(...negs))} es menor que ${S(Math.max(...negs))} aunque sus dígitos sean más grandes.`,
          ),
          ...cmpH(
            "Write each value as a signed number. Which one is farthest left (least) or farthest right (greatest)?",
          ),
          meta: { vals, names: rows.map((r) => r.n), greatest },
        });
      },
      check(item) {
        const { vals, names, greatest } = item.meta;
        const beaten = vals.map((v) => vals.filter((w) => w < v).length);
        return judge(item, (c) => beaten[names.indexOf(c)] === (greatest ? 3 : 0));
      },
    },

    trap: {
      lv: [4],
      make(rng) {
        const lo = -rng.int(4, 30);
        const hi = -rng.int(1, -lo - 1);
        const [a, b] = rng.chance(0.5) ? [lo, hi] : [hi, lo];
        const truth = SYM(a, b);
        const flip = truth === "<" ? ">" : "<";
        const st = (s, en, es) => ({
          v: `${S(a)} ${s} ${S(b)}, because ${en}`,
          vEs: `${S(a)} ${s} ${S(b)}, porque ${es}`,
        });
        const r = st(
          truth,
          `${S(lo)} is farther to the left on the number line.`,
          `${S(lo)} está más a la izquierda en la recta numérica.`,
        );
        const w1 = st(flip, `${-lo} is greater than ${-hi}.`, `${-lo} es mayor que ${-hi}.`);
        const w2 = st(flip, `${S(lo)} is farther from 0.`, `${S(lo)} está más lejos de 0.`);
        const w3 = st("=", "both are negative numbers.", "los dos son números negativos.");
        return mcq(rng, {
          ...Q(
            `Compare ${S(a)} and ${S(b)}. Which statement is correct and gives the right reason?`,
            `Compara ${S(a)} y ${S(b)}. ¿Qué enunciado es correcto y da la razón correcta?`,
          ),
          right: r,
          wrong: [
            badEs(w1.v, w1.vEs, "bigger-digit"),
            badEs(w2.v, w2.vEs, "farther-means-greater"),
            badEs(w3.v, w3.vEs, "thought-equal"),
          ],
          ...X(
            `${S(lo)} is farther to the left than ${S(hi)}, so ${S(lo)} < ${S(hi)}. Farther from 0 on the negative side means less, not greater.`,
            `${S(lo)} está más a la izquierda que ${S(hi)}, así que ${S(lo)} < ${S(hi)}. Estar más lejos de 0 del lado negativo significa menor, no mayor.`,
          ),
          ...cmpH(),
          meta: { a, b },
        });
      },
      check(item) {
        const truth = SYM(G.value(String(item.meta.a)), G.value(String(item.meta.b)));
        return judge(item, (c) => {
          const m = /^\S+ ([<>=]) \S+, because/.exec(c);
          return !!m && m[1] === truth;
        });
      },
    },
  });
  /* ================================================================================================
   * quadrantId (7-5, 7-8): quadrants and axes from signs, coordinates read from a graph
   * ============================================================================================== */
  Object.assign(FB, {
    "x-sign-wrong": [
      "Check the x-coordinate. A negative x means left of the y-axis. A positive x means right of it.",
      "Revisa la coordenada x. Una x negativa está a la izquierda del eje y. Una x positiva está a su derecha.",
    ],
    "y-sign-wrong": [
      "Check the y-coordinate. A negative y means below the x-axis. A positive y means above it.",
      "Revisa la coordenada y. Una y negativa está debajo del eje x. Una y positiva está arriba de él.",
    ],
    "both-signs-wrong": [
      "Neither sign matches. Check the sign of x (left or right) and the sign of y (down or up).",
      "Ningún signo coincide. Revisa el signo de x (izquierda o derecha) y el signo de y (abajo o arriba).",
    ],
    "swapped-x-y": [
      "The x and y may be swapped. The first number is x (left or right). The second number is y (down or up).",
      "Quizás cambiaste x y y. El primer número es x (izquierda o derecha). El segundo es y (abajo o arriba).",
    ],
    "swapped-axes": [
      "The axes are mixed up. The x-axis is the horizontal line, where y = 0. The y-axis is the vertical line, where x = 0.",
      "Mezclaste los ejes. El eje x es la línea horizontal, donde y = 0. El eje y es la línea vertical, donde x = 0.",
    ],
    "axis-is-quadrant": [
      "A point on an axis is not inside any quadrant. A coordinate of 0 puts the point on an axis.",
      "Un punto sobre un eje no está dentro de ningún cuadrante. Una coordenada 0 pone el punto sobre un eje.",
    ],
    "origin-confusion": [
      "The origin is only the point (0, 0), where the axes cross. This point has one coordinate that is not 0.",
      "El origen es solo el punto (0, 0), donde se cruzan los ejes. Este punto tiene una coordenada distinta de 0.",
    ],
    "stopped-before-moving": [
      "That is where the point started. Follow every move before you name the quadrant.",
      "Ahí empezó el punto. Sigue todos los movimientos antes de nombrar el cuadrante.",
    ],
    "axis-distance-swapped": [
      "The distance from the x-axis is the y-coordinate, and the distance from the y-axis is the x-coordinate.",
      "La distancia al eje x es la coordenada y, y la distancia al eje y es la coordenada x.",
    ],
  });
  const LEADG = [
    [
      "A treasure map uses a coordinate grid.",
      "Un mapa del tesoro usa una cuadrícula de coordenadas.",
    ],
    ["A drone's flight is plotted on a grid.", "El vuelo de un dron se marca en una cuadrícula."],
    [
      "A video game places items on a coordinate grid.",
      "Un videojuego coloca objetos en una cuadrícula de coordenadas.",
    ],
    [
      "A city map uses a coordinate grid.",
      "Un mapa de la ciudad usa una cuadrícula de coordenadas.",
    ],
    ["A robot moves on a floor grid.", "Un robot se mueve en una cuadrícula en el piso."],
    [
      "A scientist plots sample sites on a grid.",
      "Una científica marca sitios de muestreo en una cuadrícula.",
    ],
  ];
  const lg = (rng, a, b) => {
    const g = rng.pick(LEADG);
    return [`${g[0]} ${a}`, `${g[1]} ${b}`];
  };
  const Q2 = (rng, a, b) => Q(...lg(rng, a, b));
  const ROMAN = ["I", "II", "III", "IV"];
  const quadOf = (x, y) => (x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3);
  const SG = [null, [1, 1], [-1, 1], [-1, -1], [1, -1]];
  const qn = (q) => `Quadrant ${ROMAN[q - 1]}`;
  const qnEs = (q) => `Cuadrante ${ROMAN[q - 1]}`;
  /** Why choosing quadrant q was wrong when the answer is `truth` (the point is x, y). */
  const qTag = (q, truth, x, y, start) => {
    if (start && q === start) return "stopped-before-moving";
    if (x && y && quadOf(y, x) === q) return "swapped-x-y";
    const dx = SG[q][0] !== SG[truth][0];
    const dy = SG[q][1] !== SG[truth][1];
    return dx && dy ? "both-signs-wrong" : dx ? "x-sign-wrong" : "y-sign-wrong";
  };
  /** Angle-based quadrant for check(): 1-4, or "x-axis", "y-axis", "origin". */
  const angQ = (x, y) => {
    if (!x && !y) return "origin";
    const a = Math.round(((Math.atan2(y, x) * 180) / Math.PI) * 1e6) / 1e6;
    if (a === 0 || Math.abs(a) === 180) return "x-axis";
    if (Math.abs(a) === 90) return "y-axis";
    return a > 0 ? (a < 90 ? 1 : 2) : a > -90 ? 4 : 3;
  };
  const qLadder = () =>
    H(
      [
        "Quadrants are numbered I to IV, starting at the upper right and going counterclockwise: I upper right, II upper left, III lower left, IV lower right.",
        "Los cuadrantes se numeran de I a IV, empezando arriba a la derecha y girando en sentido contrario a las agujas del reloj: I arriba a la derecha, II arriba a la izquierda, III abajo a la izquierda, IV abajo a la derecha.",
      ],
      [
        "The x-coordinate tells left (negative) or right (positive). The y-coordinate tells down (negative) or up (positive).",
        "La coordenada x indica izquierda (negativa) o derecha (positiva). La coordenada y indica abajo (negativa) o arriba (positiva).",
      ],
      [
        "Put the left or right and the up or down together. Which corner of the graph is that?",
        "Junta izquierda o derecha con arriba o abajo. ¿Qué esquina de la gráfica es esa?",
      ],
    );
  /** "Which quadrant?" item. o: q [en, es], truth, x, y (for tags), start?, viz?, xs [en, es], meta */
  const quadMc = (rng, o) =>
    mcq(rng, {
      ...Q(...o.q),
      right: { v: qn(o.truth), vEs: qnEs(o.truth) },
      sort: (c) => ROMAN.indexOf(c.replace("Quadrant ", "")),
      wrong: [1, 2, 3, 4]
        .filter((q) => q !== o.truth)
        .map((q) => badEs(qn(q), qnEs(q), qTag(q, o.truth, o.x, o.y, o.start), undefined)),
      ...X(...o.xs),
      ...qLadder(),
      viz: o.viz,
      meta: o.meta,
    });
  const signTxt = (v, axis) =>
    axis === "x"
      ? [
          v < 0
            ? "negative, so it is left of the y-axis"
            : "positive, so it is right of the y-axis",
          v < 0
            ? "negativa, así que está a la izquierda del eje y"
            : "positiva, así que está a la derecha del eje y",
        ]
      : [
          v < 0 ? "negative, so it is below the x-axis" : "positive, so it is above the x-axis",
          v < 0
            ? "negativa, así que está debajo del eje x"
            : "positiva, así que está arriba del eje x",
        ];
  /** Random point in quadrant q with |x| != |y|, magnitudes 1..m. */
  const ptIn = (rng, q, m = 9) => {
    let a;
    let b;
    do {
      a = rng.int(1, m);
      b = rng.int(1, m);
    } while (a === b);
    return [SG[q][0] * a, SG[q][1] * b];
  };
  const quadXs = (x, y, q) => [
    `The x-coordinate ${S(x)} is ${signTxt(x, "x")[0]}. The y-coordinate ${S(y)} is ${signTxt(y, "y")[0]}. That is ${qn(q)}.`,
    `La coordenada x, ${S(x)}, es ${signTxt(x, "x")[1]}. La coordenada y, ${S(y)}, es ${signTxt(y, "y")[1]}. Eso es el ${qnEs(q)}.`,
  ];

  reg("quadrantId", "Points and quadrants", "Puntos y cuadrantes", {
    qSigns: {
      lv: [1],
      make(rng) {
        const q = rng.int(1, 4);
        const [x, y] = ptIn(rng, q);
        const name = rng.pick(PT);
        return quadMc(rng, {
          q: rng.pick([
            [
              `In which quadrant is the point ${P(x, y)}?`,
              `¿En qué cuadrante está el punto ${P(x, y)}?`,
            ],
            [
              `Point ${name} is at ${P(x, y)}. In which quadrant is point ${name}?`,
              `El punto ${name} está en ${P(x, y)}. ¿En qué cuadrante está el punto ${name}?`,
            ],
          ]),
          truth: q,
          x,
          y,
          xs: quadXs(x, y, q),
          meta: { x, y },
        });
      },
      check: (item) =>
        judge(
          item,
          (c) => angQ(item.meta.x, item.meta.y) === ROMAN.indexOf(c.replace("Quadrant ", "")) + 1,
        ),
    },

    qGraph: {
      lv: [1, 2],
      make(rng, level) {
        const q = rng.int(1, 4);
        const [x, y] = ptIn(rng, q, level === 1 ? 5 : 8);
        const name = rng.pick(PT);
        return quadMc(rng, {
          q: lg(
            rng,
            `Look at the graph. In which quadrant is point ${name}?`,
            `Mira la gráfica. ¿En qué cuadrante está el punto ${name}?`,
          ),
          truth: q,
          x,
          y,
          viz: plane(Math.max(Math.abs(x), Math.abs(y)), [{ x, y, l: name }]),
          xs: quadXs(x, y, q),
          meta: {},
        });
      },
      check(item) {
        const p = item.viz.points[0];
        return judge(item, (c) => angQ(p.x, p.y) === ROMAN.indexOf(c.replace("Quadrant ", "")) + 1);
      },
    },

    readPair: {
      lv: [1, 2],
      make(rng, level) {
        const q = rng.int(1, 4);
        const [x, y] = ptIn(rng, q, level === 1 ? 5 : 8);
        const name = rng.pick(PT);
        return mcq(rng, {
          ...Q2(
            rng,
            `Look at the graph. What are the coordinates of point ${name}?`,
            `Mira la gráfica. ¿Cuáles son las coordenadas del punto ${name}?`,
          ),
          right: P(x, y),
          wrong: [
            bad(P(y, x), "swapped-x-y"),
            bad(P(-x, y), "x-sign-wrong"),
            bad(P(x, -y), "y-sign-wrong"),
          ],
          ...X(
            `Start at the origin. Go ${Math.abs(x)} ${x < 0 ? "left" : "right"} and ${Math.abs(y)} ${y < 0 ? "down" : "up"}. The ordered pair is ${P(x, y)}.`,
            `Empieza en el origen. Ve ${Math.abs(x)} a la ${x < 0 ? "izquierda" : "derecha"} y ${Math.abs(y)} ${y < 0 ? "abajo" : "arriba"}. El par ordenado es ${P(x, y)}.`,
          ),
          ...H(
            [
              "An ordered pair is (x, y). The x-coordinate comes first.",
              "Un par ordenado es (x, y). La coordenada x va primero.",
            ],
            [
              `Start at the origin. Count left or right to find x, then count down or up to find y.`,
              "Empieza en el origen. Cuenta a la izquierda o derecha para hallar x, y luego abajo o arriba para hallar y.",
            ],
            [
              "Write x first and y second. Left and down are negative.",
              "Escribe x primero y y después. Izquierda y abajo son negativos.",
            ],
          ),
          viz: plane(Math.max(Math.abs(x), Math.abs(y)), [{ x, y, l: name }]),
          meta: {},
        });
      },
      check(item) {
        const p = item.viz.points[0];
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && v[0] === p.x && v[1] === p.y;
        });
      },
    },

    axis: {
      lv: [2],
      make(rng) {
        if (rng.chance(0.5)) {
          const onX = rng.chance(0.5);
          const v = rng.int(2, 9) * rng.pick([-1, 1]);
          const [x, y] = onX ? [v, 0] : [0, v];
          const q = onX ? (v > 0 ? 1 : 2) : v > 0 ? 1 : 4;
          return mcq(rng, {
            ...Q(
              `On which axis is the point ${P(x, y)}?`,
              `¿Sobre qué eje está el punto ${P(x, y)}?`,
            ),
            right: onX
              ? { v: "the x-axis", vEs: "el eje x" }
              : { v: "the y-axis", vEs: "el eje y" },
            wrong: [
              badEs(
                onX ? "the y-axis" : "the x-axis",
                onX ? "el eje y" : "el eje x",
                "swapped-axes",
              ),
              badEs(qn(q), qnEs(q), "axis-is-quadrant"),
              badEs("the origin", "el origen", "origin-confusion"),
            ],
            ...X(
              `A point with ${onX ? "y = 0" : "x = 0"} is on the ${onX ? "x" : "y"}-axis. Here ${onX ? `y is 0 and x is ${S(v)}` : `x is 0 and y is ${S(v)}`}.`,
              `Un punto con ${onX ? "y = 0" : "x = 0"} está sobre el eje ${onX ? "x" : "y"}. Aquí ${onX ? `y es 0 y x es ${S(v)}` : `x es 0 y y es ${S(v)}`}.`,
            ),
            ...H(
              ["Look for the coordinate that is 0.", "Busca la coordenada que es 0."],
              [
                "If y = 0, the point sits on the horizontal line. If x = 0, it sits on the vertical line.",
                "Si y = 0, el punto está sobre la línea horizontal. Si x = 0, está sobre la línea vertical.",
              ],
              [
                "Decide which line is the x-axis and which is the y-axis.",
                "Decide cuál línea es el eje x y cuál es el eje y.",
              ],
            ),
            meta: { x, y },
          });
        }
        const labs = rng.pick(LABELS);
        const onX = rng.chance(0.5);
        const v1 = rng.int(2, 6) * rng.pick([-1, 1]);
        const v2 = rng.int(2, 6) * rng.pick([-1, 1]);
        const qs = rng.shuffle([1, 2, 3, 4]).slice(0, 2);
        const pts = [
          onX ? [v1, 0] : [0, v1],
          onX ? [0, v2] : [v2, 0],
          ptIn(rng, qs[0], 6),
          ptIn(rng, qs[1], 6),
        ];
        const order = rng.shuffle([0, 1, 2, 3]);
        const lab = (i) => labs[order.indexOf(i)];
        return mcq(rng, {
          ...Q2(
            rng,
            `Look at the graph. Which point is on the ${onX ? "x" : "y"}-axis?`,
            `Mira la gráfica. ¿Qué punto está sobre el eje ${onX ? "x" : "y"}?`,
          ),
          right: lab(0),
          sort: (c) => labs.indexOf(c),
          wrong: [
            bad(lab(1), "swapped-axes"),
            bad(lab(2), "axis-is-quadrant"),
            bad(lab(3), "axis-is-quadrant"),
          ],
          ...X(
            `Point ${lab(0)} has ${onX ? "y = 0" : "x = 0"}, so it is on the ${onX ? "x" : "y"}-axis.`,
            `El punto ${lab(0)} tiene ${onX ? "y = 0" : "x = 0"}, así que está sobre el eje ${onX ? "x" : "y"}.`,
          ),
          ...H(
            [
              `Points on the ${onX ? "x" : "y"}-axis are on the ${onX ? "horizontal" : "vertical"} line through the origin.`,
              `Los puntos sobre el eje ${onX ? "x" : "y"} están en la línea ${onX ? "horizontal" : "vertical"} que pasa por el origen.`,
            ],
            [
              "A point inside a quadrant is not on an axis.",
              "Un punto dentro de un cuadrante no está sobre un eje.",
            ],
            [
              "Find the lettered point that sits right on that line.",
              "Busca el punto con letra que está justo sobre esa línea.",
            ],
          ),
          viz: plane(
            6,
            pts
              .map((p, i) => ({ x: p[0], y: p[1], l: lab(i) }))
              .sort((a, b) => labs.indexOf(a.l) - labs.indexOf(b.l)),
          ),
          meta: { onX, target: lab(0) },
        });
      },
      check(item) {
        if (item.viz) {
          const want = item.meta.onX ? "x-axis" : "y-axis";
          return judge(item, (c) => {
            const p = mark(item, c);
            return !!p && angQ(p.x, p.y) === want;
          });
        }
        const { x, y } = item.meta;
        const want = angQ(x, y);
        return judge(item, (c) => c === `the ${want}` || (/Quadrant/.test(c) ? false : false));
      },
    },

    letterQ: {
      lv: [2, 3],
      make(rng, level) {
        const labs = rng.pick(LABELS);
        const qs = rng.shuffle([1, 2, 3, 4]);
        const pts = qs.map((q) => ptIn(rng, q, level === 2 ? 6 : 9));
        const t = rng.int(1, 4);
        const idx = qs.indexOf(t);
        const m = Math.max(...pts.flat().map(Math.abs));
        return mcq(rng, {
          ...Q2(
            rng,
            `Look at the graph. Which point is in ${qn(t)}?`,
            `Mira la gráfica. ¿Qué punto está en el ${qnEs(t)}?`,
          ),
          right: labs[idx],
          sort: (c) => labs.indexOf(c),
          wrong: labs.map((l, i) => i !== idx && bad(l, qTag(qs[i], t, 0, 0))),
          ...X(
            `Point ${labs[idx]} is at ${P(...pts[idx])}. Its signs ${SG[t][0] < 0 ? "(−" : "(+"}, ${SG[t][1] < 0 ? "−)" : "+)"} match ${qn(t)}.`,
            `El punto ${labs[idx]} está en ${P(...pts[idx])}. Sus signos ${SG[t][0] < 0 ? "(−" : "(+"}, ${SG[t][1] < 0 ? "−)" : "+)"} corresponden al ${qnEs(t)}.`,
          ),
          ...qLadder(),
          viz: plane(
            m,
            pts.map((p, i) => ({ x: p[0], y: p[1], l: labs[i] })),
          ),
          meta: { t },
        });
      },
      check(item) {
        const t = ROMAN.indexOf(/Quadrant (IV|III|II|I)/.exec(item.q)[1]) + 1;
        return judge(item, (c) => {
          const p = mark(item, c);
          return !!p && angQ(p.x, p.y) === t;
        });
      },
    },

    signsOfQ: {
      lv: [3],
      make(rng) {
        const q = rng.int(1, 4);
        const sg = (s) => `(${s[0] < 0 ? M : "+"}, ${s[1] < 0 ? M : "+"})`;
        if (rng.chance(0.5)) {
          return mcq(rng, {
            ...Q(
              `Which pair of signs describes the coordinates (x, y) of every point in ${qn(q)}?`,
              `¿Qué par de signos describe las coordenadas (x, y) de todo punto en el ${qnEs(q)}?`,
            ),
            right: sg(SG[q]),
            sort: (c) => [1, 2, 3, 4].findIndex((k) => sg(SG[k]) === c),
            wrong: [1, 2, 3, 4].filter((k) => k !== q).map((k) => bad(sg(SG[k]), qTag(k, q, 0, 0))),
            ...X(
              `In ${qn(q)}, x is ${SG[q][0] < 0 ? "negative (left)" : "positive (right)"} and y is ${SG[q][1] < 0 ? "negative (down)" : "positive (up)"}. The signs are ${sg(SG[q])}.`,
              `En el ${qnEs(q)}, x es ${SG[q][0] < 0 ? "negativa (izquierda)" : "positiva (derecha)"} y y es ${SG[q][1] < 0 ? "negativa (abajo)" : "positiva (arriba)"}. Los signos son ${sg(SG[q])}.`,
            ),
            ...qLadder(),
            meta: { q },
          });
        }
        const [sx, sy] = SG[q];
        return quadMc(rng, {
          q: [
            `A point has a ${sx < 0 ? "negative" : "positive"} x-coordinate and a ${sy < 0 ? "negative" : "positive"} y-coordinate. In which quadrant is it?`,
            `Un punto tiene coordenada x ${sx < 0 ? "negativa" : "positiva"} y coordenada y ${sy < 0 ? "negativa" : "positiva"}. ¿En qué cuadrante está?`,
          ],
          truth: q,
          x: 0,
          y: 0,
          xs: [
            `${sx < 0 ? "Negative x is left" : "Positive x is right"} and ${sy < 0 ? "negative y is down" : "positive y is up"}. That is ${qn(q)}.`,
            `${sx < 0 ? "La x negativa es a la izquierda" : "La x positiva es a la derecha"} y ${sy < 0 ? "la y negativa es hacia abajo" : "la y positiva es hacia arriba"}. Eso es el ${qnEs(q)}.`,
          ],
          meta: { q, signs: [sx, sy] },
        });
      },
      check(item) {
        if (item.meta.signs) {
          const [sx, sy] = item.meta.signs;
          return judge(item, (c) => angQ(sx, sy) === ROMAN.indexOf(c.replace("Quadrant ", "")) + 1);
        }
        return judge(item, (c) => {
          const m = /^\((.), (.)\)$/.exec(c);
          const q = ROMAN.indexOf(/Quadrant (IV|III|II|I)/.exec(item.q)[1]) + 1;
          return angQ(m[1] === "+" ? 1 : -1, m[2] === "+" ? 1 : -1) === q;
        });
      },
    },

    whichPoint: {
      lv: [3],
      make(rng) {
        const q = rng.int(1, 4);
        const [sx, sy] = SG[q];
        const [a, b, c, d] = rng.distinct(4, 1, 9);
        const right = [sx * a, sy * b];
        const axisPt = rng.chance(0.5) ? [sx * c, 0] : [0, sy * c];
        const bothPt = [-sx * d, -sy * c];
        const onePt = rng.chance(0.5) ? [-sx * c, sy * d] : [sx * d, -sy * c];
        const pts = [right, axisPt, bothPt, onePt];
        return mcq(rng, {
          ...Q(`Which point is in ${qn(q)}?`, `¿Qué punto está en el ${qnEs(q)}?`),
          right: P(...right),
          wrong: [
            bad(P(...axisPt), "axis-is-quadrant"),
            bad(P(...bothPt), "both-signs-wrong"),
            bad(P(...onePt), onePt[0] === sx * d ? "y-sign-wrong" : "x-sign-wrong"),
          ],
          ...X(
            `${P(...right)} has an x that is ${sx < 0 ? "negative" : "positive"} and a y that is ${sy < 0 ? "negative" : "positive"}, so it is in ${qn(q)}. A point with a 0 coordinate is on an axis.`,
            `${P(...right)} tiene una x ${sx < 0 ? "negativa" : "positiva"} y una y ${sy < 0 ? "negativa" : "positiva"}, así que está en el ${qnEs(q)}. Un punto con una coordenada 0 está sobre un eje.`,
          ),
          ...qLadder(),
          meta: { q, n: pts.length },
        });
      },
      check(item) {
        const q = ROMAN.indexOf(/Quadrant (IV|III|II|I)/.exec(item.q)[1]) + 1;
        return judge(item, (c) => {
          const v = pairOf(c);
          return angQ(v[0], v[1]) === q;
        });
      },
    },

    clues: {
      lv: [4],
      make(rng) {
        const kind = rng.int(0, 2);
        let x;
        let y;
        let txt;
        let wrong;
        const dir = (v, ax) =>
          ax === "x"
            ? v < 0
              ? ["left", "izquierda"]
              : ["right", "derecha"]
            : v < 0
              ? ["below", "debajo"]
              : ["above", "arriba"];
        if (kind === 0) {
          [x, y] = ptIn(rng, rng.int(1, 4), 9);
          const [dx, dy] = [dir(x, "x"), dir(y, "y")];
          txt = [
            `A point is ${Math.abs(x)} units to the ${dx[0]} of the y-axis and ${Math.abs(y)} units ${dy[0]} the x-axis. What are its coordinates?`,
            `Un punto está a ${Math.abs(x)} unidades a la ${dx[1]} del eje y y a ${Math.abs(y)} unidades ${dy[1]} del eje x. ¿Cuáles son sus coordenadas?`,
          ];
          wrong = [
            bad(P(y, x), "swapped-x-y"),
            bad(P(x, -y), "y-sign-wrong"),
            bad(P(-x, y), "x-sign-wrong"),
          ];
        } else if (kind === 1) {
          const q = rng.int(1, 4);
          [x, y] = ptIn(rng, q, 9);
          txt = [
            `A point is ${Math.abs(y)} ${pl(y, "unit", "units")} from the x-axis and ${Math.abs(x)} ${pl(x, "unit", "units")} from the y-axis. It is in ${qn(q)}. What are its coordinates?`,
            `Un punto está a ${Math.abs(y)} unidades del eje x y a ${Math.abs(x)} unidades del eje y. Está en el ${qnEs(q)}. ¿Cuáles son sus coordenadas?`,
          ];
          wrong = [
            bad(P(SG[q][0] * Math.abs(y), SG[q][1] * Math.abs(x)), "axis-distance-swapped"),
            bad(P(x, -y), "y-sign-wrong"),
            bad(P(-x, y), "x-sign-wrong"),
          ];
        } else {
          const onX = rng.chance(0.5);
          const v = rng.int(2, 9) * rng.pick([-1, 1]);
          [x, y] = onX ? [v, 0] : [0, v];
          const d = onX ? dir(v, "x") : dir(v, "y");
          txt = [
            `A point is on the ${onX ? "x" : "y"}-axis, ${Math.abs(v)} units ${onX ? `to the ${d[0]} of` : `${d[0]}`} the origin. What are its coordinates?`,
            `Un punto está sobre el eje ${onX ? "x" : "y"}, a ${Math.abs(v)} unidades ${onX ? `a la ${d[1]} del` : `${d[1]} del`} origen. ¿Cuáles son sus coordenadas?`,
          ];
          wrong = [
            bad(P(y, x), "swapped-x-y"),
            bad(P(-x, -y), onX ? "x-sign-wrong" : "y-sign-wrong"),
            bad(P(-y, -x), "both-signs-wrong"),
          ];
        }
        return mcq(rng, {
          ...Q(...txt),
          right: P(x, y),
          wrong,
          ...X(
            `Distance from the y-axis is the x-coordinate, and distance from the x-axis is the y-coordinate. Left and below are negative. The point is ${P(x, y)}.`,
            `La distancia al eje y es la coordenada x, y la distancia al eje x es la coordenada y. Izquierda y debajo son negativos. El punto es ${P(x, y)}.`,
          ),
          ...H(
            [
              "Distance from the y-axis is the x-coordinate. Distance from the x-axis is the y-coordinate.",
              "La distancia al eje y es la coordenada x. La distancia al eje x es la coordenada y.",
            ],
            [
              "Left of the y-axis and below the x-axis mean negative numbers.",
              "A la izquierda del eje y y debajo del eje x significan números negativos.",
            ],
            [
              "Write the x-coordinate first and the y-coordinate second, each with its sign.",
              "Escribe primero la coordenada x y después la coordenada y, cada una con su signo.",
            ],
          ),
          meta: { x, y, kind },
        });
      },
      check(item) {
        return judge(item, (c) => {
          const v = pairOf(c);
          const [x, y] = [item.meta.x, item.meta.y];
          return !!v && v[0] === x && v[1] === y;
        });
      },
    },

    moves: {
      lv: [4],
      make(rng) {
        const sq = rng.int(1, 4);
        let [x0, y0] = ptIn(rng, sq, 6);
        let a;
        let b;
        let h;
        let v;
        do {
          a = rng.int(2, 9);
          b = rng.int(2, 9);
          h = rng.pick([-1, 1]);
          v = rng.pick([-1, 1]);
        } while (!(x0 + h * a) || !(y0 + v * b) || quadOf(x0 + h * a, y0 + v * b) === sq);
        const [x1, y1] = [x0 + h * a, y0 + v * b];
        const q = quadOf(x1, y1);
        return quadMc(rng, {
          q: [
            `Start at ${P(x0, y0)}. Move ${a} units ${h < 0 ? "left" : "right"}, then ${b} units ${v < 0 ? "down" : "up"}. In which quadrant do you end?`,
            `Empieza en ${P(x0, y0)}. Muévete ${a} unidades a la ${h < 0 ? "izquierda" : "derecha"} y luego ${b} unidades ${v < 0 ? "hacia abajo" : "hacia arriba"}. ¿En qué cuadrante terminas?`,
          ],
          truth: q,
          x: x1,
          y: y1,
          start: sq,
          xs: [
            `You end at ${P(x1, y1)}. The x-coordinate is ${signTxt(x1, "x")[0]}, and the y-coordinate is ${signTxt(y1, "y")[0]}. That is ${qn(q)}.`,
            `Terminas en ${P(x1, y1)}. La coordenada x es ${signTxt(x1, "x")[1]}, y la coordenada y es ${signTxt(y1, "y")[1]}. Eso es el ${qnEs(q)}.`,
          ],
          meta: { x0, y0, a, b, h, v },
        });
      },
      check(item) {
        const m = item.meta;
        let [x, y] = [m.x0, m.y0];
        for (let i = 0; i < m.a; i++) x += m.h;
        for (let i = 0; i < m.b; i++) y += m.v;
        return judge(item, (c) => angQ(x, y) === ROMAN.indexOf(c.replace("Quadrant ", "")) + 1);
      },
    },
  });
  /* ================================================================================================
   * coordDistance (7-6): distance on a horizontal or vertical line, across an axis, missing coordinate
   * ============================================================================================== */
  Object.assign(FB, {
    "added-instead": [
      "Both points are on the same side of 0, so the distance is the gap between them. Subtract; do not add.",
      "Los dos puntos están del mismo lado de 0, así que la distancia es la separación entre ellos. Resta; no sumes.",
    ],
    "subtracted-across-zero": [
      "The points are on opposite sides of 0, so the distance passes through 0. Add the two distances from 0; do not subtract.",
      "Los puntos están en lados opuestos de 0, así que la distancia pasa por 0. Suma las dos distancias a 0; no restes.",
    ],
    "negative-distance": [
      "A distance is never negative. Count the units between the points.",
      "Una distancia nunca es negativa. Cuenta las unidades entre los puntos.",
    ],
    "counted-points": [
      "That counts the points, not the spaces between them. Count the units from one point to the other.",
      "Eso cuenta los puntos, no los espacios entre ellos. Cuenta las unidades de un punto al otro.",
    ],
    "used-shared-coordinate": [
      "That uses the coordinate both points share. The distance uses the coordinates that are different.",
      "Eso usa la coordenada que comparten los dos puntos. La distancia usa las coordenadas que son distintas.",
    ],
    "one-leg-only": [
      "That finds only one part of the trip. Find each straight part and add them.",
      "Eso halla solo una parte del recorrido. Halla cada parte recta y súmalas.",
    ],
    "went-wrong-way": [
      "That goes the right distance but the wrong way. Check the direction word, or the quadrant, in the problem.",
      "Eso va la distancia correcta pero en el sentido equivocado. Revisa la palabra de dirección, o el cuadrante, del problema.",
    ],
    "distance-as-coordinate": [
      "That is the distance, not the coordinate. Start at the known point and move that far.",
      "Esa es la distancia, no la coordenada. Empieza en el punto conocido y muévete esa distancia.",
    ],
  });
  const PLACES = [
    [
      ["library", "park"],
      ["la biblioteca", "el parque"],
    ],
    [
      ["bakery", "gym"],
      ["la panadería", "el gimnasio"],
    ],
    [
      ["school", "fire station"],
      ["la escuela", "la estación de bomberos"],
    ],
    [
      ["pier", "lighthouse"],
      ["el muelle", "el faro"],
    ],
    [
      ["camp", "lake"],
      ["el campamento", "el lago"],
    ],
    [
      ["café", "bank"],
      ["el café", "el banco"],
    ],
  ];
  const dLadder = (across) =>
    H(
      [
        "The points share one coordinate, so they are on a horizontal or a vertical line. Look at the coordinate that is different.",
        "Los puntos comparten una coordenada, así que están en una línea horizontal o vertical. Fíjate en la coordenada que es distinta.",
      ],
      [
        across
          ? "Are the two numbers on opposite sides of 0? Then the distance goes through 0."
          : "Are the two numbers on the same side of 0? Then find the gap between them.",
        across
          ? "¿Están los dos números en lados opuestos de 0? Entonces la distancia pasa por 0."
          : "¿Están los dos números del mismo lado de 0? Entonces halla la separación entre ellos.",
      ],
      [
        across
          ? "Find each number's distance from 0 (its absolute value) and combine them."
          : "Count the units from one number to the other on a number line.",
        across
          ? "Halla la distancia de cada número a 0 (su valor absoluto) y combínalas."
          : "Cuenta las unidades de un número al otro en una recta numérica.",
      ],
    );
  const pairPts = (x1, y1, x2, y2, l1 = "A", l2 = "B") => [
    { x: x1, y: y1, l: l1 },
    { x: x2, y: y2, l: l2 },
  ];

  reg("coordDistance", "Distance on the coordinate plane", "Distancia en el plano cartesiano", {
    dist: {
      lv: [1, 2, 3],
      make(rng, level) {
        const horiz = rng.chance(0.5);
        const unit = level === 3 ? 0.5 : 1;
        const m = level === 3 ? 18 : 9;
        const across = level > 1 && rng.chance(0.55);
        let a;
        let b;
        let c;
        do {
          if (level === 1) {
            a = rng.int(0, 10);
            b = rng.int(0, 10);
            c = rng.int(0, 10);
          } else if (across) {
            a = -rng.int(1, m);
            b = rng.int(1, m);
            c = rng.int(-9, 9);
          } else {
            const s = rng.pick([-1, 1]);
            a = s * rng.int(1, m);
            b = s * rng.int(1, m);
            c = rng.int(-9, 9);
          }
        } while (Math.abs(a - b) < 2);
        [a, b] = [a * unit, b * unit];
        const d = Math.abs(a - b);
        const [x1, y1, x2, y2] = horiz ? [a, c, b, c] : [c, a, c, b];
        const wrong = [
          across && bad(Math.abs(Math.abs(a) - Math.abs(b)), "subtracted-across-zero"),
          !across && bad(Math.abs(a) + Math.abs(b), "added-instead"),
          bad(d + unit, "counted-points"),
          across && bad(-d, "negative-distance"),
          bad(c, "used-shared-coordinate"),
        ].filter(Boolean);
        const viz = plane(
          Math.max(Math.abs(a), Math.abs(b), Math.abs(c)),
          pairPts(x1, y1, x2, y2),
          { segments: [[0, 1]] },
        );
        const place = rng.pick(PLACES);
        const mode =
          level === 1
            ? rng.pick(["pts", "graph"])
            : level === 2
              ? rng.pick(["pts", "graph", "pts"])
              : rng.pick(["map", "pts"]);
        const A = `A${P(x1, y1)}`;
        const B = `B${P(x2, y2)}`;
        const stem =
          mode === "graph"
            ? [
                "Look at the graph. How many units apart are point A and point B?",
                "Mira la gráfica. ¿A cuántas unidades están el punto A y el punto B?",
              ]
            : mode === "map"
              ? [
                  `On a city map, the ${place[0][0]} (A) is at ${P(x1, y1)} and the ${place[0][1]} (B) is at ${P(x2, y2)}. Each grid unit is one block. How many blocks apart are they?`,
                  `En un mapa de la ciudad, ${place[1][0]} (A) está en ${P(x1, y1)} y ${place[1][1]} (B) está en ${P(x2, y2)}. Cada unidad de la cuadrícula es una cuadra. ¿A cuántas cuadras están?`,
                ]
              : [
                  `What is the distance between ${A} and ${B}?`,
                  `¿Cuál es la distancia entre ${A} y ${B}?`,
                ];
        const xs = across
          ? [
              `The points are on opposite sides of 0 on the ${horiz ? "x" : "y"} line, so add the distances from 0: ${f(Math.abs(a))} + ${f(Math.abs(b))} = ${f(d)}.`,
              `Los puntos están en lados opuestos de 0 en la línea ${horiz ? "x" : "y"}, así que suma las distancias a 0: ${f(Math.abs(a))} + ${f(Math.abs(b))} = ${f(d)}.`,
            ]
          : [
              `The points are on the same side of 0, so find the gap: |${S(a)} − ${b < 0 ? `(${S(b)})` : S(b)}| = ${f(d)}.`,
              `Los puntos están del mismo lado de 0, así que halla la separación: |${S(a)} − ${b < 0 ? `(${S(b)})` : S(b)}| = ${f(d)}.`,
            ];
        const base = {
          ...Q(...stem),
          ...X(...xs),
          ...dLadder(across),
          viz,
          meta: { unit },
        };
        if (level === 2 && rng.chance(0.4)) {
          return mcq(rng, {
            ...base,
            right: S(d),
            wrong: wrong.filter((w2) => w2.v !== d).map((w2) => ({ ...w2, v: S(w2.v) })),
          });
        }
        return numq({ ...base, a: d, fw: wrong });
      },
      check(item) {
        const [p, q] = item.viz.points;
        const u = item.meta.unit;
        const d = p.y === q.y ? steps(p.x, q.x, u) : steps(p.y, q.y, u);
        return item.k === "mc" ? judge(item, (c) => near(G.value(c), d)) : typed(item, d);
      },
    },

    twoLeg: {
      lv: [3, 4],
      make(rng, level) {
        const m = level === 3 ? 6 : 9;
        let x1;
        let x2;
        let y1;
        let y2;
        do {
          x1 = rng.int(-m, m);
          x2 = rng.int(-m, m);
          y1 = rng.int(-m, m);
          y2 = rng.int(-m, m);
        } while (
          x1 === x2 ||
          y1 === y2 ||
          (level === 4 && !(x1 < 0 !== x2 < 0 || y1 < 0 !== y2 < 0))
        );
        const leg1 = Math.abs(y2 - y1);
        const leg2 = Math.abs(x2 - x1);
        const who = rng.pick(NAMES);
        const thing = rng.pick([
          ["rides a bike", "anda en bicicleta"],
          ["walks", "camina"],
          ["drives a cart", "maneja un carrito"],
          ["rolls a robot", "mueve un robot"],
        ]);
        return numq({
          ...Q(
            `${who} ${thing[0]} from A${P(x1, y1)} straight to B${P(x1, y2)}, then straight to C${P(x2, y2)}. Each grid unit is one block. How many blocks is the whole trip?`,
            `${who} ${thing[1]} de A${P(x1, y1)} en línea recta hasta B${P(x1, y2)} y luego en línea recta hasta C${P(x2, y2)}. Cada unidad de la cuadrícula es una cuadra. ¿Cuántas cuadras tiene todo el recorrido?`,
          ),
          a: leg1 + leg2,
          fw: [
            bad(leg1, "one-leg-only"),
            bad(leg2, "one-leg-only"),
            bad(
              Math.abs(Math.abs(y1) - Math.abs(y2)) + Math.abs(Math.abs(x1) - Math.abs(x2)),
              "subtracted-across-zero",
            ),
          ],
          ...X(
            `A to B is vertical: ${leg1} ${pl(leg1, "block", "blocks")}. B to C is horizontal: ${leg2} ${pl(leg2, "block", "blocks")}. ${leg1} + ${leg2} = ${leg1 + leg2} ${pl(leg1 + leg2, "block", "blocks")}.`,
            `De A a B es vertical: ${leg1} cuadras. De B a C es horizontal: ${leg2} cuadras. ${leg1} + ${leg2} = ${leg1 + leg2} cuadras.`,
          ),
          ...H(
            [
              "The trip has two straight parts. Find the length of each part.",
              "El recorrido tiene dos partes rectas. Halla la longitud de cada parte.",
            ],
            [
              "For each part, look at the coordinate that changes. If it goes across 0, add the distances from 0.",
              "En cada parte, mira la coordenada que cambia. Si cruza el 0, suma las distancias a 0.",
            ],
            ["Add the two lengths together.", "Suma las dos longitudes."],
          ),
          viz: plane(m, [...pairPts(x1, y1, x1, y2), { x: x2, y: y2, l: "C" }], {
            segments: [
              [0, 1],
              [1, 2],
            ],
          }),
          meta: {},
        });
      },
      check(item) {
        const [A, B, C] = item.viz.points;
        return typed(item, steps(A.y, B.y) + steps(B.x, C.x));
      },
    },

    missing: {
      lv: [4],
      make(rng) {
        const horiz = rng.chance(0.5);
        const d = rng.int(3, 12);
        const useSign = rng.chance(0.5);
        let known;
        let dirv;
        let fixed;
        if (useSign) {
          known = rng.int(1, d - 1) * rng.pick([-1, 1]);
          dirv = rng.pick([-1, 1]);
          fixed = rng.int(1, 8) * rng.pick([-1, 1]);
        } else {
          known = rng.int(-8, 8);
          dirv = rng.pick([-1, 1]);
          fixed = rng.int(-8, 8);
        }
        const ans = known + dirv * d;
        const [kx, ky] = horiz ? [known, fixed] : [fixed, known];
        const v = horiz ? "x" : "y";
        const word = horiz
          ? dirv > 0
            ? ["right of", "a la derecha de"]
            : ["left of", "a la izquierda de"]
          : dirv > 0
            ? ["above", "arriba de"]
            : ["below", "debajo de"];
        const quad = horiz ? quadOf(ans, fixed) : quadOf(fixed, ans);
        const clue = useSign
          ? [`Point Q is in ${qn(quad)}.`, `El punto Q está en el ${qnEs(quad)}.`]
          : [
              `Point Q is ${d} units ${word[0]} point P.`,
              `El punto Q está a ${d} unidades ${word[1]} el punto P.`,
            ];
        const line = horiz ? "horizontal" : "vertical";
        return numq({
          ...Q(
            `Point P is at ${P(kx, ky)}. Point Q is at ${horiz ? `(x, ${S(fixed)})` : `(${S(fixed)}, y)`}, on the same ${line} line. ${useSign ? `The distance from P to Q is ${d} units. ` : ""}${clue[0]} What is ${v}?`,
            `El punto P está en ${P(kx, ky)}. El punto Q está en ${horiz ? `(x, ${S(fixed)})` : `(${S(fixed)}, y)`}, en la misma línea ${horiz ? "horizontal" : "vertical"}. ${useSign ? `La distancia de P a Q es de ${d} unidades. ` : ""}${clue[1]} ¿Cuánto es ${v}?`,
          ),
          a: ans,
          fw: [bad(known - dirv * d, "went-wrong-way"), bad(d, "distance-as-coordinate")],
          ...X(
            `Start at ${v} = ${S(known)} and move ${d} units ${dirv > 0 ? (horiz ? "right" : "up") : horiz ? "left" : "down"}: ${S(known)} ${dirv > 0 ? "+" : M} ${d} = ${S(ans)}.`,
            `Empieza en ${v} = ${S(known)} y muévete ${d} unidades ${dirv > 0 ? (horiz ? "a la derecha" : "hacia arriba") : horiz ? "a la izquierda" : "hacia abajo"}: ${S(known)} ${dirv > 0 ? "+" : M} ${d} = ${S(ans)}.`,
          ),
          ...H(
            [
              "Q is the same distance from P as the problem says. It could be on either side of P.",
              "Q está a la distancia que dice el problema de P. Podría estar a cualquiera de los dos lados de P.",
            ],
            [
              useSign
                ? "Use the quadrant to decide which side of P the point Q is on."
                : "Use the direction word to decide which way to move from P.",
              useSign
                ? "Usa el cuadrante para decidir de qué lado de P está el punto Q."
                : "Usa la palabra de dirección para decidir hacia dónde moverte desde P.",
            ],
            [
              `Start at P's ${v}-coordinate and count that many units that way.`,
              `Empieza en la coordenada ${v} de P y cuenta esa cantidad de unidades en ese sentido.`,
            ],
          ),
          viz: undefined,
          meta: {
            horiz,
            known,
            d,
            how: useSign ? { kind: "sign", quad, fixed } : { kind: "dir", dirv },
          },
        });
      },
      check(item) {
        const { horiz, known, d, how } = item.meta;
        let up = known;
        let down = known;
        for (let i = 0; i < d; i++) {
          up += 1;
          down -= 1;
        }
        let want = how.kind === "dir" ? (how.dirv > 0 ? up : down) : null;
        if (how.kind === "sign") {
          const ok = [up, down].filter(
            (v) => (horiz ? angQ(v, how.fixed) : angQ(how.fixed, v)) === how.quad,
          );
          if (ok.length !== 1) return "quadrant clue does not pick a single point";
          want = ok[0];
        }
        return typed(item, want);
      },
    },
  });
  /* ================================================================================================
   * polygonCoordinates (7-7): rectangles from their vertices: sides, perimeter, area, missing vertex
   * ============================================================================================== */
  Object.assign(FB, {
    "wrong-side": [
      "That is the length of a different side. Check which two vertices make the side the question names.",
      "Esa es la longitud de otro lado. Revisa cuáles dos vértices forman el lado que nombra la pregunta.",
    ],
    "added-sides": [
      "That adds one length and one width. Perimeter adds all four sides; area multiplies length by width.",
      "Eso suma un largo y un ancho. El perímetro suma los cuatro lados; el área multiplica largo por ancho.",
    ],
    "area-for-perimeter": [
      "That is the area. Perimeter is the distance around the outside, so add the four sides.",
      "Esa es el área. El perímetro es la distancia alrededor, así que suma los cuatro lados.",
    ],
    "perimeter-for-area": [
      "That is the perimeter. Area is the space inside, so multiply the length by the width.",
      "Ese es el perímetro. El área es el espacio de adentro, así que multiplica el largo por el ancho.",
    ],
    "forgot-double": [
      "That is only half of the way around. A rectangle has two lengths and two widths.",
      "Eso es solo la mitad del contorno. Un rectángulo tiene dos largos y dos anchos.",
    ],
    "not-a-corner": [
      "That point does not make a square corner. The fourth vertex shares an x-coordinate with one vertex and a y-coordinate with another.",
      "Ese punto no forma una esquina cuadrada. El cuarto vértice comparte una coordenada x con un vértice y una coordenada y con otro.",
    ],
    "length-not-coordinate": [
      "That is the length of the side, not the coordinate. Start at the known vertex and move that far.",
      "Esa es la longitud del lado, no la coordenada. Empieza en el vértice conocido y muévete esa distancia.",
    ],
  });
  const THINGS = [
    ["garden bed", "cantero"],
    ["stage", "escenario"],
    ["swimming pool", "piscina"],
    ["rug", "alfombra"],
    ["sandbox", "arenero"],
    ["playground", "patio de juegos"],
  ];
  /** Rectangle with opposite corners (x1,y1) lower left and (x2,y2) upper right; vertices A B C D counterclockwise. */
  const rectPts = (x1, y1, x2, y2, labels = ["A", "B", "C", "D"]) => [
    { x: x1, y: y1, l: labels[0] },
    { x: x2, y: y1, l: labels[1] },
    { x: x2, y: y2, l: labels[2] },
    { x: x1, y: y2, l: labels[3] },
  ];
  /** Segments between shown vertices that are neighbours around the rectangle; `idx` are the shown vertices' positions in A-B-C-D. */
  const sidesOf = (idx) => {
    const out = [];
    for (let a = 0; a < idx.length; a++)
      for (let b = a + 1; b < idx.length; b++)
        if ((idx[a] + 1) % 4 === idx[b] || (idx[b] + 1) % 4 === idx[a]) out.push([a, b]);
    return out;
  };
  const vlist = (pts) => pts.map((p) => `${p.l}${P(p.x, p.y)}`).join(", ");
  const polyViz = (pts) =>
    plane(Math.max(...pts.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)])), pts, {
      polygon: [0, 1, 2, 3],
    });
  const pLadder = (what) =>
    H(
      [
        "Sides that are horizontal share a y-coordinate. Sides that are vertical share an x-coordinate.",
        "Los lados horizontales comparten la coordenada y. Los lados verticales comparten la coordenada x.",
      ],
      [
        "Find the length and the width. If a side crosses an axis, add the distances from 0.",
        "Halla el largo y el ancho. Si un lado cruza un eje, suma las distancias a 0.",
      ],
      [
        what === "perimeter"
          ? "Perimeter is the distance around: two lengths plus two widths."
          : what === "area"
            ? "Area is the space inside: length times width."
            : "Use the two lengths you found.",
        what === "perimeter"
          ? "El perímetro es la distancia alrededor: dos largos más dos anchos."
          : what === "area"
            ? "El área es el espacio de adentro: largo por ancho."
            : "Usa las dos longitudes que hallaste.",
      ],
    );

  reg(
    "polygonCoordinates",
    "Polygons on the coordinate plane",
    "Polígonos en el plano cartesiano",
    {
      side: {
        lv: [1],
        make(rng) {
          let x1;
          let x2;
          let y1;
          let y2;
          do {
            [x1, x2] = [rng.int(0, 5), rng.int(3, 10)];
            [y1, y2] = [rng.int(0, 5), rng.int(3, 10)];
          } while (x2 - x1 < 2 || y2 - y1 < 2 || x2 - x1 === y2 - y1);
          const pts = rectPts(x1, y1, x2, y2);
          const w = x2 - x1;
          const h = y2 - y1;
          const horiz = rng.chance(0.5);
          const [s1, s2] = horiz ? ["A", "B"] : ["B", "C"];
          const len = horiz ? w : h;
          const t = rng.pick(THINGS);
          return numq({
            ...Q(
              `On a grid, rectangle ABCD shows a ${t[0]}. Each unit is 1 foot. How long is side ${s1}${s2}, in feet?`,
              `En una cuadrícula, el rectángulo ABCD muestra un(a) ${t[1]}. Cada unidad es 1 pie. ¿Cuánto mide el lado ${s1}${s2}, en pies?`,
            ),
            a: len,
            fw: [
              bad(horiz ? h : w, "wrong-side"),
              bad(w + h, "added-sides"),
              bad(len + 1, "counted-points"),
            ],
            ...X(
              `Side ${s1}${s2} is ${horiz ? "horizontal" : "vertical"}. Its ends are ${horiz ? `x = ${x1} and x = ${x2}` : `y = ${y1} and y = ${y2}`}, so its length is ${len} feet.`,
              `El lado ${s1}${s2} es ${horiz ? "horizontal" : "vertical"}. Sus extremos están en ${horiz ? `x = ${x1} y x = ${x2}` : `y = ${y1} y y = ${y2}`}, así que mide ${len} pies.`,
            ),
            ...pLadder("side"),
            viz: polyViz(pts),
            meta: { side: s1 + s2 },
          });
        },
        check(item) {
          const [A, B, C] = item.viz.points;
          return typed(item, item.meta.side === "AB" ? steps(A.x, B.x) : steps(B.y, C.y));
        },
      },

      missing: {
        lv: [1, 3],
        make(rng, level) {
          const lo = level === 1 ? 0 : -8;
          const hi = level === 1 ? 10 : 8;
          let x1;
          let x2;
          let y1;
          let y2;
          do {
            [x1, x2] = [rng.int(lo, hi), rng.int(lo, hi)].sort((a, b) => a - b);
            [y1, y2] = [rng.int(lo, hi), rng.int(lo, hi)].sort((a, b) => a - b);
          } while (
            x2 - x1 < 2 ||
            y2 - y1 < 2 ||
            Math.abs(x1) === Math.abs(y2) ||
            Math.abs(x2) === Math.abs(y1)
          );
          const all = rectPts(x1, y1, x2, y2);
          const gap = rng.int(0, 3);
          const miss = all[gap];
          const shown = all.filter((_, i) => i !== gap);
          const label = miss.l;
          return mcq(rng, {
            ...Q(
              `Three vertices of rectangle ABCD are shown. Which point is vertex ${label}?`,
              `Se muestran tres vértices del rectángulo ABCD. ¿Qué punto es el vértice ${label}?`,
            ),
            right: P(miss.x, miss.y),
            wrong: [
              bad(P(miss.y, miss.x), "swapped-x-y"),
              bad(P(miss.x + 1, miss.y), "not-a-corner"),
              bad(P(miss.x, miss.y + 1), "not-a-corner"),
              bad(P(miss.x - 1, miss.y - 1), "not-a-corner"),
            ],
            ...X(
              `A rectangle has square corners, so vertex ${label} shares an x-coordinate with one vertex and a y-coordinate with another. That gives ${P(miss.x, miss.y)}.`,
              `Un rectángulo tiene esquinas cuadradas, así que el vértice ${label} comparte una coordenada x con un vértice y una coordenada y con otro. Eso da ${P(miss.x, miss.y)}.`,
            ),
            ...H(
              [
                "In a rectangle with sides along the grid, opposite sides line up: two vertices share each x and two share each y.",
                "En un rectángulo con lados sobre la cuadrícula, los lados opuestos se alinean: dos vértices comparten cada x y dos comparten cada y.",
              ],
              [
                "Find the x-coordinate that only two of the shown vertices have, and the y-coordinate that only two have.",
                "Busca la coordenada x que solo tienen dos de los vértices mostrados, y la coordenada y que solo tienen dos.",
              ],
              [
                "The missing vertex uses the x that appears once and the y that appears once. Keep x first.",
                "El vértice que falta usa la x que aparece una vez y la y que aparece una vez. Mantén x primero.",
              ],
            ),
            viz: plane(
              Math.max(...shown.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]), 1),
              shown,
              {
                // Draw only the sides of the rectangle: two shown vertices are joined when they are neighbours in A-B-C-D.
                // (The shown points skip the missing one, so joining them in array order drew a diagonal for B and C.)
                segments: sidesOf([0, 1, 2, 3].filter((i) => i !== gap)),
              },
            ),
            meta: { label },
          });
        },
        check(item) {
          const pts = item.viz.points.map((p) => [p.x, p.y]);
          // four points make a rectangle when two opposite pairs share a midpoint and have equal, non-zero length
          const isRect = (q) =>
            [
              [
                [0, 1],
                [2, 3],
              ],
              [
                [0, 2],
                [1, 3],
              ],
              [
                [0, 3],
                [1, 2],
              ],
            ].some(([[a, b], [c, d]]) => {
              const len = (u, v) => (q[u][0] - q[v][0]) ** 2 + (q[u][1] - q[v][1]) ** 2;
              return (
                q[a][0] + q[b][0] === q[c][0] + q[d][0] &&
                q[a][1] + q[b][1] === q[c][1] + q[d][1] &&
                len(a, b) === len(c, d) &&
                len(a, b) > 0
              );
            });
          return judge(item, (c) => {
            const v = pairOf(c);
            return !!v && isRect([...pts, v]);
          });
        },
      },

      measure: {
        lv: [2, 3, 4],
        make(rng, level) {
          let x1;
          let x2;
          let y1;
          let y2;
          do {
            if (level === 2) {
              [x1, x2] = [rng.int(-6, 1), rng.int(2, 8)];
              [y1, y2] = [rng.int(-2, 2), rng.int(3, 8)];
            } else if (level === 3) {
              [x1, x2] = [rng.int(-8, 8), rng.int(-8, 8)].sort((a, b) => a - b);
              [y1, y2] = [rng.int(-8, 8), rng.int(-8, 8)].sort((a, b) => a - b);
            } else {
              [x1, x2] = [-rng.int(1, 9), rng.int(1, 9)];
              [y1, y2] = [-rng.int(1, 9), rng.int(1, 9)];
            }
          } while (x2 - x1 < 3 || y2 - y1 < 3 || x2 - x1 === y2 - y1);
          const w = x2 - x1;
          const h = y2 - y1;
          const wantArea = rng.chance(0.5);
          const ans = wantArea ? w * h : 2 * (w + h);
          const sub = Math.abs(Math.abs(x1) - Math.abs(x2));
          const subH = Math.abs(Math.abs(y1) - Math.abs(y2));
          const opp = level === 3;
          const pts = rectPts(x1, y1, x2, y2, opp ? ["P", "", "Q", ""] : undefined);
          const t = rng.pick(THINGS);
          const what = wantArea ? ["area", "área"] : ["perimeter", "perímetro"];
          const given = opp
            ? [`P${P(x1, y1)} and Q${P(x2, y2)}`, `P${P(x1, y1)} y Q${P(x2, y2)}`]
            : [vlist(pts), vlist(pts)];
          const stem = opp
            ? [
                `A ${t[0]} is a rectangle with sides along the grid lines. Opposite corners are ${given[0]}. Each unit is 1 meter. What is its ${what[0]}?`,
                `Un(a) ${t[1]} es un rectángulo con lados sobre las líneas de la cuadrícula. Las esquinas opuestas son ${given[1]}. Cada unidad es 1 metro. ¿Cuál es su ${what[1]}?`,
              ]
            : [
                `A ${t[0]} is rectangle ABCD with vertices ${given[0]}. Each unit is 1 meter. What is its ${what[0]}?`,
                `Un(a) ${t[1]} es el rectángulo ABCD con vértices ${given[1]}. Cada unidad es 1 metro. ¿Cuál es su ${what[1]}?`,
              ];
          return numq({
            ...Q(...stem),
            a: ans,
            fw: wantArea
              ? [
                  bad(2 * (w + h), "perimeter-for-area"),
                  bad(w + h, "added-sides"),
                  bad(sub * subH, "subtracted-across-zero"),
                ]
              : [
                  bad(w * h, "area-for-perimeter"),
                  bad(w + h, "forgot-double"),
                  bad(2 * (sub + subH), "subtracted-across-zero"),
                ],
            ...X(
              `The width is |${S(x2)} − ${x1 < 0 ? `(${S(x1)})` : S(x1)}| = ${w} and the height is |${S(y2)} − ${y1 < 0 ? `(${S(y1)})` : S(y1)}| = ${h}. ${wantArea ? `Area = ${w} × ${h} = ${ans} square meters.` : `Perimeter = 2 × (${w} + ${h}) = ${ans} meters.`}`,
              `El ancho es |${S(x2)} − ${x1 < 0 ? `(${S(x1)})` : S(x1)}| = ${w} y el alto es |${S(y2)} − ${y1 < 0 ? `(${S(y1)})` : S(y1)}| = ${h}. ${wantArea ? `Área = ${w} × ${h} = ${ans} metros cuadrados.` : `Perímetro = 2 × (${w} + ${h}) = ${ans} metros.`}`,
            ),
            ...pLadder(wantArea ? "area" : "perimeter"),
            viz: polyViz(pts),
            meta: { level },
          });
        },
        check(item) {
          const xs = item.viz.points.map((p) => p.x);
          const ys = item.viz.points.map((p) => p.y);
          const [x1, x2, y1, y2] = [
            Math.min(...xs),
            Math.max(...xs),
            Math.min(...ys),
            Math.max(...ys),
          ];
          let cells = 0;
          for (let x = x1; x < x2; x++) for (let y = y1; y < y2; y++) cells++;
          const edge = 2 * steps(x1, x2) + 2 * steps(y1, y2);
          return typed(item, /perimeter|perímetro/.test(item.q) ? edge : cells);
        },
      },

      revMissing: {
        lv: [4],
        make(rng) {
          const x1 = rng.int(-8, 0);
          const w = rng.int(3, 9);
          const y1 = rng.int(-4, 4);
          const h = rng.int(3, 8);
          const below = rng.chance(0.5);
          const byArea = rng.chance(0.5);
          const x2 = x1 + w;
          const y3 = below ? y1 - h : y1 + h;
          const t = rng.pick(THINGS);
          const cond = byArea
            ? [`its area is ${w * h} square units`, `su área es de ${w * h} unidades cuadradas`]
            : [
                `its perimeter is ${2 * (w + h)} units`,
                `su perímetro es de ${2 * (w + h)} unidades`,
              ];
          return numq({
            ...Q(
              `A ${t[0]} is a rectangle with sides along the grid lines. Vertices A${P(x1, y1)} and B${P(x2, y1)} are on the same horizontal side, and ${cond[0]}. Vertex D is ${below ? "below" : "above"} A. What is the y-coordinate of D?`,
              `Un(a) ${t[1]} es un rectángulo con lados sobre las líneas de la cuadrícula. Los vértices A${P(x1, y1)} y B${P(x2, y1)} están en el mismo lado horizontal, y ${cond[1]}. El vértice D está ${below ? "debajo" : "arriba"} de A. ¿Cuál es la coordenada y de D?`,
            ),
            a: y3,
            fw: [bad(h, "length-not-coordinate"), bad(below ? y1 + h : y1 - h, "went-wrong-way")],
            ...X(
              `The width is ${w}. ${byArea ? `Area ÷ width = ${w * h} ÷ ${w} = ${h}` : `Half the perimeter is ${w + h}, and ${w + h} − ${w} = ${h}`}, so the height is ${h}. Going ${below ? "down" : "up"} ${h} from y = ${S(y1)} gives y = ${S(y3)}.`,
              `El ancho es ${w}. ${byArea ? `Área ÷ ancho = ${w * h} ÷ ${w} = ${h}` : `La mitad del perímetro es ${w + h}, y ${w + h} − ${w} = ${h}`}, así que el alto es ${h}. Al ir ${below ? "hacia abajo" : "hacia arriba"} ${h} desde y = ${S(y1)} se llega a y = ${S(y3)}.`,
            ),
            ...H(
              [
                "First find the width from the x-coordinates of A and B.",
                "Primero halla el ancho con las coordenadas x de A y B.",
              ],
              [
                byArea
                  ? "Area = width × height, so height = area ÷ width."
                  : "Perimeter = 2 × (width + height), so half the perimeter is width + height.",
                byArea
                  ? "Área = ancho × alto, así que alto = área ÷ ancho."
                  : "Perímetro = 2 × (ancho + alto), así que la mitad del perímetro es ancho + alto.",
              ],
              [
                "Start at the y-coordinate of A and move the height up or down.",
                "Empieza en la coordenada y de A y muévete el alto hacia arriba o hacia abajo.",
              ],
            ),
            meta: { x1, x2, y1, byArea },
          });
        },
        check(item) {
          const { x1, x2, y1 } = item.meta;
          const y3 = G.value(item.a);
          const w = steps(x1, x2);
          let cells = 0;
          for (let x = x1; x < x2; x++)
            for (let y = Math.min(y1, y3); y < Math.max(y1, y3); y++) cells++;
          const edge = 2 * w + 2 * steps(y1, y3);
          const given = Number(/is (\d+) (?:square )?units/.exec(item.q)[1]);
          const below = /below A/.test(item.q);
          if ((below ? y3 < y1 : y3 > y1) === false) return "vertex D is on the wrong side of A";
          return (
            (/area/.test(item.q) ? cells : edge) === given ||
            `the answer gives ${cells}/${edge} but the problem says ${given}`
          );
        },
      },
    },
  );
  /* ================================================================================================
   * reflectPoint (7-9): reflections across the x-axis and the y-axis
   * ============================================================================================== */
  Object.assign(FB, {
    "changed-wrong-coordinate": (ax) => [
      ax === "x"
        ? "That changes the wrong coordinate. A reflection across the x-axis flips a point up or down, so only the y-coordinate changes sign."
        : ax === "y"
          ? "That changes the wrong coordinate. A reflection across the y-axis flips a point left or right, so only the x-coordinate changes sign."
          : "That changes the wrong coordinate. Across the x-axis only y changes sign. Across the y-axis only x changes sign.",
      ax === "x"
        ? "Eso cambia la coordenada equivocada. Una reflexión sobre el eje x voltea el punto hacia arriba o abajo, así que solo cambia el signo de y."
        : ax === "y"
          ? "Eso cambia la coordenada equivocada. Una reflexión sobre el eje y voltea el punto a la izquierda o derecha, así que solo cambia el signo de x."
          : "Eso cambia la coordenada equivocada. Sobre el eje x solo cambia el signo de y. Sobre el eje y solo cambia el signo de x.",
    ],
    "changed-both": [
      "That changes both signs, which takes two reflections (one across each axis). One reflection changes only one coordinate.",
      "Eso cambia los dos signos, lo que requiere dos reflexiones (una sobre cada eje). Una reflexión cambia solo una coordenada.",
    ],
    "thought-unchanged": [
      "A reflection moves a point to the other side of the axis, so a coordinate does change here.",
      "Una reflexión lleva el punto al otro lado del eje, así que aquí una coordenada sí cambia.",
    ],
    "one-reflection-only": [
      "That does only one of the two reflections. Do the first reflection, then reflect the new point.",
      "Eso hace solo una de las dos reflexiones. Haz la primera reflexión y luego refleja el punto nuevo.",
    ],
    "half-gap": [
      "That is how far the point is from the axis. Its reflection is the same distance on the other side, so they are twice as far apart.",
      "Eso es qué tan lejos está el punto del eje. Su reflexión está a la misma distancia del otro lado, así que están al doble de distancia entre sí.",
    ],
    "traded-places": [
      "The coordinates traded places. A reflection across an axis changes a sign; it does not swap x and y.",
      "Las coordenadas cambiaron de lugar. Una reflexión sobre un eje cambia un signo; no intercambia x y y.",
    ],
  });
  const refl = (x, y, ax) => (ax === "x" ? [x, -y] : [-x, y]);
  /** Midpoint test: Q mirrors P across an axis when the segment PQ is perpendicular to it and the axis cuts it in half. */
  const isRefl = (p, q, ax) =>
    ax === "x" ? p[1] + q[1] === 0 && p[0] === q[0] : p[0] + q[0] === 0 && p[1] === q[1];
  /** The mirror image found by searching the grid for the point that passes the midpoint test. */
  const findRefl = (p, ax) => {
    for (let x = -30; x <= 30; x++)
      for (let y = -30; y <= 30; y++) if (isRefl(p, [x, y], ax)) return [x, y];
    return null;
  };
  const AXN = { x: ["x-axis", "eje x"], y: ["y-axis", "eje y"] };
  const OBJ = [
    ["A drone", "Un dron"],
    ["A game token", "Una ficha de juego"],
    ["A treasure chest", "Un cofre del tesoro"],
    ["A robot", "Un robot"],
    ["A kite", "Una cometa"],
    ["A lighthouse", "Un faro"],
  ];
  const RLABS = [
    ["A", "B", "C", "D"],
    ["W", "X", "Y", "Z"],
    ["J", "K", "L", "M"],
    ["E", "F", "G", "H"],
  ];
  const rLadder = (ax) =>
    H(
      [
        "A reflection flips a point across a line. The point and its mirror image are the same distance from the line.",
        "Una reflexión voltea un punto sobre una línea. El punto y su imagen están a la misma distancia de la línea.",
      ],
      [
        ax
          ? ax === "x"
            ? "The x-axis is horizontal, so the point flips up or down. Ask: which coordinate tells up or down?"
            : "The y-axis is vertical, so the point flips left or right. Ask: which coordinate tells left or right?"
          : "Across the x-axis a point flips up or down. Across the y-axis it flips left or right.",
        ax
          ? ax === "x"
            ? "El eje x es horizontal, así que el punto se voltea hacia arriba o abajo. Pregúntate: ¿qué coordenada dice arriba o abajo?"
            : "El eje y es vertical, así que el punto se voltea a la izquierda o a la derecha. Pregúntate: ¿qué coordenada dice izquierda o derecha?"
          : "Sobre el eje x un punto se voltea hacia arriba o abajo. Sobre el eje y se voltea a la izquierda o a la derecha.",
      ],
      [
        "Change the sign of that coordinate and keep the other one the same.",
        "Cambia el signo de esa coordenada y deja la otra igual.",
      ],
    );
  const reflX = (x, y, ax, img) => [
    `${P(x, y)} is reflected across the ${AXN[ax][0]}. The ${ax === "x" ? "y" : "x"}-coordinate changes sign and the ${ax === "x" ? "x" : "y"}-coordinate stays the same: ${P(...img)}.`,
    `${P(x, y)} se refleja sobre el ${AXN[ax][1]}. La coordenada ${ax === "x" ? "y" : "x"} cambia de signo y la coordenada ${ax === "x" ? "x" : "y"} queda igual: ${P(...img)}.`,
  ];
  /** A point off both axes with |x| != |y|. */
  const offAxes = (rng, m) => {
    let x;
    let y;
    do {
      x = rng.int(1, m) * rng.pick([-1, 1]);
      y = rng.int(1, m) * rng.pick([-1, 1]);
    } while (Math.abs(x) === Math.abs(y));
    return [x, y];
  };
  const other = (ax) => (ax === "x" ? "y" : "x");

  reg("reflectPoint", "Reflect points across the axes", "Reflejar puntos sobre los ejes", {
    reflect: {
      lv: [1, 2],
      make(rng, level) {
        const [x, y] = offAxes(rng, level === 1 ? 6 : 9);
        const ax = rng.pick(["x", "y"]);
        const img = refl(x, y, ax);
        const o = rng.pick(OBJ);
        return mcq(rng, {
          ...Q(
            level === 1
              ? `Reflect the point ${P(x, y)} across the ${AXN[ax][0]}. What are the coordinates of the new point?`
              : `${o[0]} is at ${P(x, y)}. Its mirror image across the ${AXN[ax][0]} is plotted. What are the coordinates of the mirror image?`,
            level === 1
              ? `Refleja el punto ${P(x, y)} sobre el ${AXN[ax][1]}. ¿Cuáles son las coordenadas del punto nuevo?`
              : `${o[1]} está en ${P(x, y)}. Se marca su imagen en espejo sobre el ${AXN[ax][1]}. ¿Cuáles son las coordenadas de la imagen?`,
          ),
          right: P(...img),
          wrong: [
            bad(P(...refl(x, y, other(ax))), "changed-wrong-coordinate", ax),
            bad(P(-x, -y), "changed-both"),
            bad(P(y, x), "swapped-x-y"),
          ],
          ...X(...reflX(x, y, ax, img)),
          ...rLadder(ax),
          meta: { x, y, ax },
        });
      },
      check(item) {
        const { x, y, ax } = item.meta;
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && isRefl([x, y], v, ax);
        });
      },
    },

    graphOpts: {
      lv: [1, 2],
      make(rng, level) {
        const [x, y] = offAxes(rng, level === 1 ? 5 : 8);
        const ax = rng.pick(["x", "y"]);
        const labs = rng.pick(RLABS);
        const roles = rng.shuffle(["R", "W", "B", "S"]);
        const at = {
          R: refl(x, y, ax),
          W: refl(x, y, other(ax)),
          B: [-x, -y],
          S: [y, x],
        };
        const L = (r) => labs[roles.indexOf(r)];
        const lead = lg(
          rng,
          `Point P is shown with four choices.`,
          "Se muestra el punto P con cuatro opciones.",
        );
        return mcq(rng, {
          ...Q(
            `${lead[0]} Which point is the reflection of P across the ${AXN[ax][0]}?`,
            `${lead[1]} ¿Qué punto es la reflexión de P sobre el ${AXN[ax][1]}?`,
          ),
          right: L("R"),
          sort: (c) => labs.indexOf(c),
          wrong: [
            bad(L("W"), "changed-wrong-coordinate", ax),
            bad(L("B"), "changed-both"),
            bad(L("S"), "swapped-x-y"),
          ],
          ...X(
            `P is at ${P(x, y)}. Across the ${AXN[ax][0]}, only the ${ax === "x" ? "y" : "x"}-coordinate changes sign, giving ${P(...at.R)}. That is point ${L("R")}.`,
            `P está en ${P(x, y)}. Sobre el ${AXN[ax][1]}, solo cambia el signo de la coordenada ${ax === "x" ? "y" : "x"}, lo que da ${P(...at.R)}. Ese es el punto ${L("R")}.`,
          ),
          ...rLadder(ax),
          viz: plane(Math.max(Math.abs(x), Math.abs(y)), [
            { x, y, l: "P" },
            ...roles.map((r, i) => ({ x: at[r][0], y: at[r][1], l: labs[i] })),
          ]),
          meta: { ax },
        });
      },
      check(item) {
        const P0 = mark(item, "P");
        return judge(item, (c) => {
          const m = mark(item, c);
          return !!m && isRefl([P0.x, P0.y], [m.x, m.y], item.meta.ax);
        });
      },
    },

    whichCoord: {
      lv: [2],
      make(rng) {
        const [x, y] = offAxes(rng, 9);
        const ax = rng.pick(["x", "y"]);
        const o = rng.pick(OBJ);
        const ch = ax === "x" ? "y" : "x";
        const one = (c) => [`Only the ${c}-coordinate`, `Solo la coordenada ${c}`];
        return mcq(rng, {
          ...Q(
            `${o[0]} at ${P(x, y)} is reflected across the ${AXN[ax][0]}. Which coordinate changes sign?`,
            `${o[1]} en ${P(x, y)} se refleja sobre el ${AXN[ax][1]}. ¿Qué coordenada cambia de signo?`,
          ),
          right: { v: one(ch)[0], vEs: one(ch)[1] },
          wrong: [
            badEs(one(ax)[0], one(ax)[1], "changed-wrong-coordinate", ax),
            badEs("Both coordinates", "Las dos coordenadas", "changed-both"),
            badEs("Neither coordinate", "Ninguna coordenada", "thought-unchanged"),
          ],
          ...X(
            `The ${AXN[ax][0]} is ${ax === "x" ? "horizontal" : "vertical"}, so the point flips ${ax === "x" ? "up or down" : "left or right"}. Only the ${ch}-coordinate changes sign.`,
            `El ${AXN[ax][1]} es ${ax === "x" ? "horizontal" : "vertical"}, así que el punto se voltea ${ax === "x" ? "hacia arriba o abajo" : "a la izquierda o derecha"}. Solo cambia el signo de la coordenada ${ch}.`,
          ),
          ...rLadder(ax),
          meta: { x, y, ax },
        });
      },
      check(item) {
        const { x, y, ax } = item.meta;
        const q = findRefl([x, y], ax);
        const xs = q[0] !== x;
        const ys = q[1] !== y;
        const want = xs && ys ? "Both" : xs ? "Only the x" : ys ? "Only the y" : "Neither";
        return judge(item, (c) => c.startsWith(want));
      },
    },

    coordTyped: {
      lv: [2],
      make(rng) {
        const [x, y] = offAxes(rng, 9);
        const ax = rng.pick(["x", "y"]);
        const img = refl(x, y, ax);
        const ask = rng.pick(["x", "y"]);
        const ans = ask === "x" ? img[0] : img[1];
        const orig = ask === "x" ? x : y;
        const changed = ans !== orig;
        return numq({
          ...Q(
            `The point ${P(x, y)} is reflected across the ${AXN[ax][0]}. What is the ${ask}-coordinate of the reflected point?`,
            `El punto ${P(x, y)} se refleja sobre el ${AXN[ax][1]}. ¿Cuál es la coordenada ${ask} del punto reflejado?`,
          ),
          a: ans,
          fw: [
            changed ? bad(orig, "thought-unchanged") : bad(-orig, "changed-wrong-coordinate", ax),
          ],
          ...X(...reflX(x, y, ax, img)),
          ...rLadder(ax),
          meta: { x, y, ax, ask },
        });
      },
      check(item) {
        const { x, y, ax, ask } = item.meta;
        const q = findRefl([x, y], ax);
        return typed(item, ask === "x" ? q[0] : q[1]);
      },
    },

    polyVertex: {
      lv: [3],
      make(rng) {
        const ax = rng.pick(["x", "y"]);
        const q = rng.int(1, 4);
        const pts = [];
        while (pts.length < 3) {
          const p = offAxes(rng, 8);
          if (quadOf(...p) !== q && rng.chance(0.7)) continue;
          if (!pts.some((o) => o[0] === p[0] && o[1] === p[1])) pts.push(p);
        }
        const i = rng.int(0, 2);
        const [x, y] = pts[i];
        const V = "ABC"[i];
        const img = refl(x, y, ax);
        const o = rng.pick(THINGS);
        return mcq(rng, {
          ...Q(
            `Triangle ABC is the outline of a ${o[0]} on a grid. It is reflected across the ${AXN[ax][0]}. What are the coordinates of the image of vertex ${V}?`,
            `El triángulo ABC es el contorno de un(a) ${o[1]} en una cuadrícula. Se refleja sobre el ${AXN[ax][1]}. ¿Cuáles son las coordenadas de la imagen del vértice ${V}?`,
          ),
          right: P(...img),
          wrong: [
            bad(P(...refl(x, y, other(ax))), "changed-wrong-coordinate", ax),
            bad(P(-x, -y), "changed-both"),
            bad(P(y, x), "swapped-x-y"),
          ],
          ...X(...reflX(x, y, ax, img)),
          ...rLadder(ax),
          viz: plane(
            Math.max(...pts.flat().map(Math.abs)),
            pts.map((p, k) => ({ x: p[0], y: p[1], l: "ABC"[k] })),
            { polygon: [0, 1, 2] },
          ),
          meta: { V, ax },
        });
      },
      check(item) {
        const p = mark(item, item.meta.V);
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && isRefl([p.x, p.y], v, item.meta.ax);
        });
      },
    },

    onAxis: {
      lv: [3],
      make(rng) {
        const onX = rng.chance(0.5);
        const v = rng.int(2, 9) * rng.pick([-1, 1]);
        const [x, y] = onX ? [v, 0] : [0, v];
        const ax = rng.pick(["x", "y"]);
        const img = refl(x, y, ax);
        const stays = img[0] === x && img[1] === y;
        return mcq(rng, {
          ...Q(
            `The point ${P(x, y)} is on the ${onX ? "x" : "y"}-axis. It is reflected across the ${AXN[ax][0]}. What are the coordinates of the new point?`,
            `El punto ${P(x, y)} está sobre el eje ${onX ? "x" : "y"}. Se refleja sobre el ${AXN[ax][1]}. ¿Cuáles son las coordenadas del punto nuevo?`,
          ),
          right: P(...img),
          wrong: [
            bad(P(x, y), "thought-unchanged"),
            bad(P(...refl(x, y, other(ax))), "changed-wrong-coordinate", ax),
            bad(P(-x, -y), "changed-both"),
            bad(P(y, x), "swapped-x-y"),
            bad(P(-y, -x), "swapped-x-y"),
          ],
          ...X(
            stays
              ? `${P(x, y)} is already on the ${AXN[ax][0]}. A point on the line of reflection does not move, so the new point is ${P(...img)}.`
              : `${P(x, y)} is ${onX ? "right of" : "above"} the origin on the ${onX ? "x" : "y"}-axis. Across the ${AXN[ax][0]} it moves to the other side: ${P(...img)}.`,
            stays
              ? `${P(x, y)} ya está sobre el ${AXN[ax][1]}. Un punto sobre la línea de reflexión no se mueve, así que el punto nuevo es ${P(...img)}.`
              : `${P(x, y)} está sobre el eje ${onX ? "x" : "y"}. Sobre el ${AXN[ax][1]} pasa al otro lado: ${P(...img)}.`,
          ),
          ...rLadder(ax),
          meta: { x, y, ax },
        });
      },
      check(item) {
        const { x, y, ax } = item.meta;
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && isRefl([x, y], v, ax);
        });
      },
    },

    distApart: {
      lv: [3, 4],
      make(rng, level) {
        const [x, y] = offAxes(rng, level === 3 ? 7 : 12);
        const ax = rng.pick(["x", "y"]);
        const near1 = Math.abs(ax === "x" ? y : x);
        const o = rng.pick(OBJ);
        return numq({
          ...Q(
            `${o[0]} is at ${P(x, y)}. It is reflected across the ${AXN[ax][0]}. How many units apart are the point and its mirror image?`,
            `${o[1]} está en ${P(x, y)}. Se refleja sobre el ${AXN[ax][1]}. ¿A cuántas unidades están el punto y su imagen en espejo?`,
          ),
          a: 2 * near1,
          fw: [bad(near1, "half-gap")],
          ...X(
            `The ${ax === "x" ? "y" : "x"}-coordinate ${S(ax === "x" ? y : x)} is ${near1} units from the ${AXN[ax][0]}. The image is ${near1} units on the other side, so they are ${near1} + ${near1} = ${2 * near1} units apart.`,
            `La coordenada ${ax === "x" ? "y" : "x"} ${S(ax === "x" ? y : x)} está a ${near1} unidades del ${AXN[ax][1]}. La imagen está a ${near1} unidades del otro lado, así que están a ${near1} + ${near1} = ${2 * near1} unidades.`,
          ),
          ...H(
            [
              "The point and its mirror image are the same distance from the axis, on opposite sides.",
              "El punto y su imagen están a la misma distancia del eje, en lados opuestos.",
            ],
            [
              "Find how far the point is from the axis. That is the absolute value of one coordinate.",
              "Halla qué tan lejos está el punto del eje. Eso es el valor absoluto de una coordenada.",
            ],
            [
              "Add the distance on one side and the distance on the other side.",
              "Suma la distancia de un lado y la distancia del otro lado.",
            ],
          ),
          meta: { x, y, ax },
        });
      },
      check(item) {
        const { x, y, ax } = item.meta;
        const q = findRefl([x, y], ax);
        return typed(item, ax === "x" ? steps(y, q[1]) : steps(x, q[0]));
      },
    },

    twoRefl: {
      lv: [4],
      make(rng) {
        const [x, y] = offAxes(rng, 9);
        const [a1, a2] = rng.pick([
          ["x", "y"],
          ["y", "x"],
        ]);
        const m1 = refl(x, y, a1);
        const end = refl(...m1, a2);
        const o = rng.pick(OBJ);
        return mcq(rng, {
          ...Q(
            `${o[0]} is at ${P(x, y)}. It is reflected across the ${AXN[a1][0]}, and then the new point is reflected across the ${AXN[a2][0]}. Where does it end up?`,
            `${o[1]} está en ${P(x, y)}. Se refleja sobre el ${AXN[a1][1]} y luego el punto nuevo se refleja sobre el ${AXN[a2][1]}. ¿Dónde termina?`,
          ),
          right: P(...end),
          wrong: [
            bad(P(...m1), "one-reflection-only"),
            bad(P(...refl(x, y, a2)), "one-reflection-only"),
            bad(P(end[1], end[0]), "swapped-x-y"),
          ],
          ...X(
            `First reflection across the ${AXN[a1][0]}: ${P(x, y)} becomes ${P(...m1)}. Second reflection across the ${AXN[a2][0]}: ${P(...m1)} becomes ${P(...end)}.`,
            `Primera reflexión sobre el ${AXN[a1][1]}: ${P(x, y)} pasa a ${P(...m1)}. Segunda reflexión sobre el ${AXN[a2][1]}: ${P(...m1)} pasa a ${P(...end)}.`,
          ),
          ...H(
            [
              "Do one reflection at a time. Write down the point after the first reflection.",
              "Haz una reflexión a la vez. Anota el punto después de la primera reflexión.",
            ],
            [
              "Now reflect that new point across the second axis.",
              "Ahora refleja ese punto nuevo sobre el segundo eje.",
            ],
            [
              "Each reflection changes the sign of one coordinate. Which signs changed in the end?",
              "Cada reflexión cambia el signo de una coordenada. ¿Qué signos cambiaron al final?",
            ],
          ),
          meta: { x, y, a1, a2 },
        });
      },
      check(item) {
        const { x, y, a1, a2 } = item.meta;
        const mid = findRefl([x, y], a1);
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && isRefl(mid, v, a2);
        });
      },
    },

    whichAxis: {
      lv: [4],
      make(rng) {
        const [x, y] = offAxes(rng, 8);
        const kind = rng.pick(["x", "y", "both", "none"]);
        const q =
          kind === "x" ? [x, -y] : kind === "y" ? [-x, y] : kind === "both" ? [-x, -y] : [y, x];
        const C = {
          x: ["the x-axis", "el eje x"],
          y: ["the y-axis", "el eje y"],
          both: ["both axes, one after the other", "los dos ejes, uno después del otro"],
          none: ["neither axis", "ninguno de los ejes"],
        };
        const wrongTag = (k) =>
          kind === "none"
            ? "traded-places"
            : k === "none"
              ? "thought-unchanged"
              : k === "both"
                ? "changed-both"
                : "changed-wrong-coordinate";
        const lead = rng.pick(OBJ);
        return mcq(rng, {
          ...Q(
            `${lead[0]} moved from P to P′ as shown. Which axis, or axes, did it use to get to P′?`,
            `${lead[1]} se movió de P a P′ como se muestra. ¿Qué eje, o ejes, usó para llegar a P′?`,
          ),
          right: { v: C[kind][0], vEs: C[kind][1] },
          wrong: Object.keys(C)
            .filter((k) => k !== kind)
            .map((k) =>
              badEs(C[k][0], C[k][1], wrongTag(k), k === "x" || k === "y" ? k : undefined),
            ),
          ...X(
            kind === "none"
              ? `P is ${P(x, y)} and P′ is ${P(...q)}. The coordinates traded places, which is not a reflection across the x-axis or the y-axis.`
              : `P is ${P(x, y)} and P′ is ${P(...q)}. ${kind === "x" ? "Only y changed sign" : kind === "y" ? "Only x changed sign" : "Both signs changed"}, so the point was reflected across ${C[kind][0]}.`,
            kind === "none"
              ? `P es ${P(x, y)} y P′ es ${P(...q)}. Las coordenadas cambiaron de lugar, lo que no es una reflexión sobre el eje x ni sobre el eje y.`
              : `P es ${P(x, y)} y P′ es ${P(...q)}. ${kind === "x" ? "Solo cambió el signo de y" : kind === "y" ? "Solo cambió el signo de x" : "Cambiaron los dos signos"}, así que el punto se reflejó sobre ${C[kind][1]}.`,
          ),
          ...H(
            [
              "Read the coordinates of P and of P′ from the graph.",
              "Lee las coordenadas de P y de P′ en la gráfica.",
            ],
            [
              "Compare them. Which coordinate changed sign? Did the two numbers trade places?",
              "Compáralas. ¿Qué coordenada cambió de signo? ¿Los dos números cambiaron de lugar?",
            ],
            [
              "Only y changing sign means the x-axis. Only x changing sign means the y-axis.",
              "Si solo cambia el signo de y, es el eje x. Si solo cambia el signo de x, es el eje y.",
            ],
          ),
          viz: plane(Math.max(Math.abs(x), Math.abs(y)), [
            { x, y, l: "P" },
            { x: q[0], y: q[1], l: "P′" },
          ]),
          meta: {},
        });
      },
      check(item) {
        const [p, q] = item.viz.points.map((z) => [z.x, z.y]);
        const truth = isRefl(p, q, "x")
          ? "x-axis"
          : isRefl(p, q, "y")
            ? "y-axis"
            : p[0] + q[0] === 0 && p[1] + q[1] === 0
              ? "both"
              : "neither";
        return judge(item, (c) =>
          truth === "both"
            ? c.startsWith("both")
            : truth === "neither"
              ? c === "neither axis"
              : c === `the ${truth}`,
        );
      },
    },

    undo: {
      lv: [4],
      make(rng) {
        const [x, y] = offAxes(rng, 9);
        const ax = rng.pick(["x", "y"]);
        const o = rng.pick(OBJ);
        const orig = refl(x, y, ax);
        return mcq(rng, {
          ...Q(
            `${o[0]} is reflected across the ${AXN[ax][0]} and lands at ${P(x, y)}. Where was it before the reflection?`,
            `${o[1]} se refleja sobre el ${AXN[ax][1]} y queda en ${P(x, y)}. ¿Dónde estaba antes de la reflexión?`,
          ),
          right: P(...orig),
          wrong: [
            bad(P(x, y), "thought-unchanged"),
            bad(P(...refl(x, y, other(ax))), "changed-wrong-coordinate", ax),
            bad(P(-x, -y), "changed-both"),
          ],
          ...X(
            `A reflection can be undone by reflecting again across the same axis. ${P(x, y)} reflected across the ${AXN[ax][0]} is ${P(...orig)}.`,
            `Una reflexión se deshace reflejando otra vez sobre el mismo eje. ${P(x, y)} reflejado sobre el ${AXN[ax][1]} es ${P(...orig)}.`,
          ),
          ...rLadder(ax),
          meta: { x, y, ax },
        });
      },
      check(item) {
        const { x, y, ax } = item.meta;
        return judge(item, (c) => {
          const v = pairOf(c);
          return !!v && isRefl(v, [x, y], ax);
        });
      },
    },
  });
})();

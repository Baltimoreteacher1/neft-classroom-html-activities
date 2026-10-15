/**
 * Practice Studio activity: balance (a balance scale for one-step equations, grade 6, 6.AT.8).
 *
 * Forms: add, mul, check, word. An equation is c*x + k = e with exact fractions [n, d], so every tile
 * (the same operation on BOTH pans) keeps the scale level. Pure half: make / solution / wrong / grade
 * (tools/studio-act.test.mjs). DOM half: mount. State: { pick, ops: [{o, v}], ans, chk, v }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;
  const MINUS = "−";
  const TIMES = "×";
  const DIV = "÷";
  // biome-ignore format: compact table
  const GLYPH = {
    "1/2": "½",
    "1/3": "⅓",
    "2/3": "⅔",
    "1/4": "¼",
    "3/4": "¾",
    "1/5": "⅕",
    "2/5": "⅖",
    "3/5": "⅗",
    "4/5": "⅘",
    "1/6": "⅙",
    "5/6": "⅚",
    "1/8": "⅛",
    "3/8": "⅜",
    "5/8": "⅝",
    "7/8": "⅞",
  };
  const MAXOPS = 6;
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const esc = (/** @type {any} */ s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c,
    );

  /* ---- exact fractions [n, d] ------------------------------------------------------------------ */
  const R = {
    mk(/** @type {number} */ n, d = 1) {
      if (d < 0) {
        n = -n;
        d = -d;
      }
      const g = G.gcd(Math.abs(n), d) || 1;
      return [n / g, d / g];
    },
    add: (/** @type {number[]} */ a, /** @type {number[]} */ b) =>
      R.mk(a[0] * b[1] + b[0] * a[1], a[1] * b[1]),
    sub: (/** @type {number[]} */ a, /** @type {number[]} */ b) =>
      R.mk(a[0] * b[1] - b[0] * a[1], a[1] * b[1]),
    mul: (/** @type {number[]} */ a, /** @type {number[]} */ b) => R.mk(a[0] * b[0], a[1] * b[1]),
    div: (/** @type {number[]} */ a, /** @type {number[]} */ b) => R.mk(a[0] * b[1], a[1] * b[0]),
    abs: (/** @type {number[]} */ a) => [Math.abs(a[0]), a[1]],
    eq: (/** @type {number[]} */ a, /** @type {number[]} */ b) => a[0] === b[0] && a[1] === b[1],
    val: (/** @type {number[]} */ a) => a[0] / a[1],
  };
  const fmtR = (/** @type {number[]} */ r, /** @type {string} */ mode) => {
    const sign = r[0] < 0 ? MINUS : "";
    const n = Math.abs(r[0]);
    if (r[1] === 1) return sign + n;
    if (mode === "frac") return sign + (GLYPH[`${n}/${r[1]}`] || `${n}/${r[1]}`);
    return sign + G.fmt(n / r[1], 4);
  };
  /** Float typed by a student back to an exact fraction (null if no small denominator fits). */
  const toR = (/** @type {number} */ v) => {
    for (let d = 1; d <= 1000; d++)
      if (Math.abs(v * d - Math.round(v * d)) < 1e-9) return R.mk(Math.round(v * d), d);
    return null;
  };
  const money = (/** @type {number[]} */ r) => {
    const v = R.val(r);
    return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
  };

  /* ---- equations: left = c*x + k, right = e ------------------------------------------------------ */
  const xPart = (/** @type {number[]} */ c) => {
    const base = c[0] === 1 ? "x" : `${c[0]}x`;
    return c[1] === 1 ? base : `${base} ${DIV} ${c[1]}`;
  };
  const leftText = (/** @type {any} */ eq, /** @type {string} */ mode) =>
    xPart(eq.c) + (eq.k[0] ? ` ${eq.k[0] < 0 ? MINUS : "+"} ${fmtR(R.abs(eq.k), mode)}` : "");
  const eqText = (/** @type {any} */ eq, /** @type {string} */ mode) =>
    `${leftText(eq, mode)} = ${fmtR(eq.e, mode)}`;
  const isAddType = (/** @type {any} */ m) => m.c[0] === 1 && m.c[1] === 1;
  const kindOf = (/** @type {any} */ m) =>
    isAddType(m) ? (m.k[0] > 0 ? "add" : "sub") : m.c[1] === 1 ? "mul" : "div";
  const solveOf = (/** @type {any} */ m) => R.div(R.sub(m.e, m.k), m.c);
  const FLIP = { "+": "-", "-": "+", "*": "/", "/": "*" };
  const SYM = { "+": "+", "-": MINUS, "*": TIMES, "/": DIV };
  const inverseOp = (/** @type {any} */ m) =>
    isAddType(m)
      ? { o: m.k[0] > 0 ? "-" : "+", v: R.abs(m.k) }
      : m.c[1] === 1
        ? { o: "/", v: [m.c[0], 1] }
        : { o: "*", v: [m.c[1], 1] };

  function applyOp(/** @type {any} */ eq, /** @type {any} */ op) {
    const v = op.v;
    if (op.o === "+") return { c: eq.c, k: R.add(eq.k, v), e: R.add(eq.e, v) };
    if (op.o === "-") return { c: eq.c, k: R.sub(eq.k, v), e: R.sub(eq.e, v) };
    if (op.o === "*") return { c: R.mul(eq.c, v), k: R.mul(eq.k, v), e: R.mul(eq.e, v) };
    if (op.o === "/" && v[0] !== 0)
      return { c: R.div(eq.c, v), k: R.div(eq.k, v), e: R.div(eq.e, v) };
    return null;
  }
  /** A move is legal when the blocks can still be drawn and shared: whole numbers, decimals or small fractions. */
  function legal(/** @type {any} */ eq, /** @type {string} */ mode) {
    const den = (/** @type {number[]} */ r) =>
      mode === "int" ? r[1] === 1 : mode === "dec" ? 1000 % r[1] === 0 : r[1] <= 48;
    const big = [eq.c, eq.k, eq.e].some((r) => Math.abs(R.val(r)) > 999 || Math.abs(r[0]) > 9999);
    const cOk = mode === "frac" ? eq.c[1] <= 48 : eq.c[1] === 1 || eq.c[0] === 1;
    return !big && den(eq.k) && den(eq.e) && cOk;
  }
  function runOps(/** @type {any} */ m, /** @type {any[]} */ ops) {
    let eq = { c: m.c, k: m.k, e: m.e };
    for (const op of ops || []) {
      const nx = op && Array.isArray(op.v) ? applyOp(eq, op) : null;
      if (!nx) return null;
      eq = nx;
    }
    return eq;
  }
  const solved = (/** @type {any} */ eq) => eq.c[0] === 1 && eq.c[1] === 1 && eq.k[0] === 0;
  /** Left pan with the number v in the bag, as text: 5 + 4, 3 x 7 + 2, 28 / 4. */
  function substText(/** @type {any} */ m, /** @type {number[]} */ v) {
    const s = fmtR(v, m.mode);
    const body =
      m.c[1] !== 1 ? `${s} ${DIV} ${m.c[1]}` : m.c[0] === 1 ? s : `${m.c[0]} ${TIMES} ${s}`;
    return body + (m.k[0] ? ` ${m.k[0] < 0 ? MINUS : "+"} ${fmtR(R.abs(m.k), m.mode)}` : "");
  }
  const leftValue = (/** @type {any} */ m, /** @type {number[]} */ v) => R.add(R.mul(m.c, v), m.k);

  /* ---- generators ---------------------------------------------------------------------------------- */
  const dec = (
    /** @type {any} */ rng,
    /** @type {number} */ lo,
    /** @type {number} */ hi,
    /** @type {number} */ places,
  ) => {
    for (let t = 0; t < 40; t++) {
      const n = rng.int(lo, hi);
      if (n % 10 ** places) return R.mk(n, 10 ** places);
    }
    return R.mk(lo + 1, 10 ** places);
  };
  const frac = (/** @type {any} */ rng, /** @type {number[]} */ dens) => {
    const d = rng.pick(dens);
    return R.mk(rng.int(1, d - 1), d);
  };
  const FALLBACK = { m: { c: [1, 1], k: [4, 1], e: [11, 1], mode: "int" }, s: [7, 1] };

  function genAdd(
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {boolean|undefined} */ forceMinus,
  ) {
    for (let t = 0; t < 300; t++) {
      const minus = forceMinus ?? (level > 1 && rng.chance(0.4));
      const mode =
        level === 3
          ? rng.pick(["dec", "frac"])
          : level === 4
            ? rng.pick(["dec", "frac", "dec"])
            : "int";
      let a;
      let s;
      if (mode === "int") {
        a = R.mk(level === 1 ? rng.int(1, 9) : rng.int(2, 24));
        s = R.mk(level === 1 ? rng.int(1, 12) : rng.int(3, 40));
      } else if (mode === "dec") {
        a = level === 4 ? dec(rng, 11, 499, 2) : dec(rng, 3, 99, 1);
        s = level === 4 ? dec(rng, 101, 999, 2) : dec(rng, 12, 99, 1);
      } else {
        a = frac(rng, level === 4 ? [2, 3, 4] : [2, 3, 4, 5, 6, 8]);
        s = frac(rng, level === 4 ? [3, 5, 6, 8] : [2, 3, 4, 5, 6, 8]);
      }
      if (minus && R.val(s) <= R.val(a)) continue;
      const b = minus ? R.sub(s, a) : R.add(s, a);
      if (R.eq(s, a) || R.eq(s, b) || R.eq(a, b) || R.val(b) > 99) continue;
      return { m: { c: [1, 1], k: minus ? [-a[0], a[1]] : a, e: b, mode }, s };
    }
    return FALLBACK;
  }
  function genMul(
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {boolean|undefined} */ forceTimes,
  ) {
    for (let t = 0; t < 300; t++) {
      const times = forceTimes ?? (level === 1 || rng.chance(0.55));
      const mode =
        level === 3
          ? rng.pick(["dec", "frac"])
          : level === 4
            ? rng.pick(["dec", "frac", "int"])
            : "int";
      const p = level === 1 ? rng.int(2, 5) : level === 4 ? rng.int(3, 12) : rng.int(2, 9);
      const u =
        mode === "int"
          ? R.mk(level === 1 ? rng.int(2, 9) : rng.int(2, 12))
          : mode === "dec"
            ? level === 4
              ? dec(rng, 105, 999, 2)
              : dec(rng, 12, 99, 1)
            : frac(rng, [2, 3, 4, 5, 6, 8]);
      const s = times ? u : R.mul(u, [p, 1]);
      const q = times ? R.mul(u, [p, 1]) : u;
      if (R.eq(s, [p, 1]) || R.eq(s, q) || R.val(s) > 120 || R.val(q) > 120) continue;
      return { m: { c: times ? [p, 1] : [1, p], k: [0, 1], e: q, mode }, s };
    }
    return { m: { c: [3, 1], k: [0, 1], e: [21, 1], mode: "int" }, s: [7, 1] };
  }
  /** Four tiles: the inverse, the wrong direction, and two from the other family. Positions are seeded. */
  function makeTiles(/** @type {any} */ rng, /** @type {any} */ m) {
    let t;
    if (isAddType(m)) {
      const a = R.abs(m.k);
      const n = a[1] === 1 && a[0] >= 2 ? a[0] : 2;
      const inv = inverseOp(m);
      t = [inv, { o: FLIP[inv.o], v: a }, { o: "*", v: [n, 1] }, { o: "/", v: [n, 1] }];
    } else {
      const p = m.c[1] === 1 ? m.c[0] : m.c[1];
      const inv = inverseOp(m);
      t = [inv, { o: FLIP[inv.o], v: [p, 1] }, { o: "-", v: [p, 1] }, { o: "+", v: [p, 1] }];
    }
    return rng.shuffle(t);
  }
  function makeCands(/** @type {any} */ rng, /** @type {any} */ m, /** @type {number[]} */ s) {
    const step =
      m.mode === "int"
        ? [1, 1]
        : m.mode === "dec"
          ? [1, m.e[1] > 10 ? 100 : 10]
          : [1, Math.max(2, s[1])];
    const reverse = isAddType(m) ? R.add(m.e, m.k) : R.mul(m.e, m.c);
    const raw = [reverse, m.e, R.add(s, step), R.sub(s, step), R.add(s, R.mul(step, [2, 1]))];
    const seen = [s];
    const pool = [];
    for (const v of raw) {
      const dup = seen.some((w) => R.eq(w, v));
      const fits = R.val(v) > 0 && R.val(v) < 200 && legal({ c: [1, 1], k: v, e: v }, m.mode);
      if (!dup && fits) {
        seen.push(v);
        pool.push(v);
      }
    }
    const picks =
      pool.length > 2 ? [pool[0], ...rng.shuffle(pool.slice(1)).slice(0, 1)] : pool.slice(0, 2);
    const cands = rng.shuffle([s, ...picks]);
    const truth = cands.map((v) => {
      const d = R.val(R.sub(leftValue(m, v), m.e));
      return d > 0 ? "left" : d < 0 ? "right" : "bal";
    });
    return { cands, truth };
  }

  // biome-ignore format: compact story table. [kind, English, Spanish, unknown, unknown in Spanish]
  const STORY = {
    add: [
      [
        "c",
        "Mia had some stickers. A friend gave her {a} more, and now she has {b}.",
        "Mia tenía unas calcomanías. Una amiga le dio {a} más y ahora tiene {b}.",
        "the stickers Mia had at first",
        "las calcomanías que Mia tenía al principio",
      ],
      [
        "c",
        "Some students were on the bus. Then {a} more got on, and now there are {b} students.",
        "Había unos estudiantes en el autobús. Subieron {a} más y ahora hay {b}.",
        "the students on the bus at first",
        "los estudiantes que había al principio",
      ],
      [
        "m",
        "Noor had some money saved. She earned {a} more, and now she has {b}.",
        "Noor tenía algo de dinero ahorrado. Ganó {a} más y ahora tiene {b}.",
        "the money Noor saved at first",
        "el dinero que Noor ahorró al principio",
      ],
      [
        "u",
        "A tank held some water. Kai added {a} liters, and now it holds {b} liters.",
        "Un tanque tenía algo de agua. Kai agregó {a} litros y ahora tiene {b} litros.",
        "the liters in the tank at first",
        "los litros que había en el tanque al principio",
      ],
    ],
    sub: [
      [
        "c",
        "Leo had some stickers. He gave {a} to a friend and has {b} left.",
        "Leo tenía unas calcomanías. Dio {a} a un amigo y le quedan {b}.",
        "the stickers Leo had at first",
        "las calcomanías que Leo tenía al principio",
      ],
      [
        "c",
        "A bakery had some muffins. It sold {a} of them and has {b} left.",
        "Una panadería tenía unos muffins. Vendió {a} y le quedan {b}.",
        "the muffins the bakery had at first",
        "los muffins que tenía la panadería al principio",
      ],
      [
        "m",
        "Ava had some money. She spent {a} and has {b} left.",
        "Ava tenía algo de dinero. Gastó {a} y le quedan {b}.",
        "the money Ava had at first",
        "el dinero que Ava tenía al principio",
      ],
      [
        "u",
        "A bottle held some juice. Omar poured out {a} liters, and {b} liters are left.",
        "Una botella tenía jugo. Omar sirvió {a} litros y quedan {b} litros.",
        "the liters of juice at first",
        "los litros de jugo al principio",
      ],
    ],
    mul: [
      [
        "c",
        "Each box holds the same number of pencils. {a} boxes hold {b} pencils in all.",
        "Cada caja tiene el mismo número de lápices. {a} cajas tienen {b} lápices en total.",
        "the pencils in one box",
        "los lápices en una caja",
      ],
      [
        "m",
        "Sam bought {a} notebooks that cost the same. He paid {b} in all.",
        "Sam compró {a} cuadernos del mismo precio. Pagó {b} en total.",
        "the cost of one notebook",
        "el costo de un cuaderno",
      ],
      [
        "u",
        "A runner ran the same distance each day for {a} days. She ran {b} miles in all.",
        "Una corredora corrió la misma distancia cada día durante {a} días. Corrió {b} millas en total.",
        "the miles run each day",
        "las millas corridas cada día",
      ],
      [
        "c",
        "A baker packs {a} muffins in every tray. All the trays together hold {b} muffins.",
        "Un panadero pone {a} muffins en cada bandeja. Todas las bandejas juntas tienen {b} muffins.",
        "the number of trays",
        "el número de bandejas",
      ],
    ],
    div: [
      [
        "c",
        "A teacher shared some pencils equally among {a} students. Each student got {b} pencils.",
        "Un maestro repartió unos lápices por igual entre {a} estudiantes. Cada estudiante recibió {b} lápices.",
        "the pencils the teacher had",
        "los lápices que tenía el maestro",
      ],
      [
        "m",
        "{a} friends split a bill equally. Each friend paid {b}.",
        "{a} amigos dividieron una cuenta por igual. Cada amigo pagó {b}.",
        "the whole bill",
        "la cuenta completa",
      ],
      [
        "u",
        "A rope was cut into {a} equal pieces. Each piece is {b} meters long.",
        "Una cuerda se cortó en {a} partes iguales. Cada parte mide {b} metros.",
        "the length of the whole rope in meters",
        "el largo de la cuerda completa en metros",
      ],
      [
        "c",
        "Some cards were dealt equally to {a} players. Each player got {b} cards.",
        "Se repartieron unas cartas por igual entre {a} jugadores. Cada jugador recibió {b} cartas.",
        "the number of cards dealt",
        "el número de cartas repartidas",
      ],
    ],
  };
  // biome-ignore format: compact table. [why a flipped operation is wrong, why swapped numbers are wrong], each with Spanish
  const WHY = {
    add: [
      "This one takes {a} away, but the story adds {a} more.",
      "Esta quita {a}, pero la historia agrega {a} más.",
      "The numbers are in the wrong places. {a} is the amount added, and {b} is the new total.",
      "Los números están en lugares equivocados. {a} es lo que se agregó y {b} es el total nuevo.",
    ],
    sub: [
      "This one adds {a}, but the story takes {a} away.",
      "Esta suma {a}, pero la historia quita {a}.",
      "The numbers are in the wrong places. {a} is the amount taken away, and {b} is what is left.",
      "Los números están en lugares equivocados. {a} es lo que se quitó y {b} es lo que queda.",
    ],
    mul: [
      "This one splits x into {a} parts, but the story has {a} equal groups that make {b}.",
      "Esta divide x en {a} partes, pero la historia tiene {a} grupos iguales que hacen {b}.",
      "The numbers are in the wrong places. {a} is the number of groups, and {b} is the total.",
      "Los números están en lugares equivocados. {a} es el número de grupos y {b} es el total.",
    ],
    div: [
      "This one makes {a} groups of x, but in the story x is shared into {a} equal parts.",
      "Esta hace {a} grupos de x, pero en la historia x se reparte en {a} partes iguales.",
      "The numbers are in the wrong places. {a} is the number of parts, and {b} is the size of one part.",
      "Los números están en lugares equivocados. {a} es el número de partes y {b} es el tamaño de una parte.",
    ],
  };

  function wordBits(
    /** @type {any} */ rng,
    /** @type {any} */ m,
    /** @type {number[]} */ _s,
    /** @type {string} */ kind,
  ) {
    const f = (/** @type {number[]} */ r) => fmtR(r, m.mode);
    const a = kind === "add" || kind === "sub" ? R.abs(m.k) : [kind === "mul" ? m.c[0] : m.c[1], 1];
    const allowed = m.mode === "int" ? "cmu" : m.mode === "dec" ? "mu" : "u";
    const pool = STORY[kind].filter((t) => allowed.includes(t[0]));
    const t = rng.pick(pool);
    const isMoney = t[0] === "m";
    const fill = (/** @type {string} */ txt) =>
      txt
        .split("{a}")
        .join(isMoney && (kind === "add" || kind === "sub") ? money(a) : f(a))
        .split("{b}")
        .join(isMoney ? money(m.e) : f(m.e));
    const E = (/** @type {any} */ c, /** @type {any} */ k, /** @type {any} */ e) =>
      eqText({ c, k, e }, m.mode);
    const A1 = a;
    const B1 = m.e;
    const swapOk = B1[1] === 1;
    const wrongs =
      kind === "add"
        ? [E([1, 1], R.mk(-A1[0], A1[1]), B1), E([1, 1], B1, A1)]
        : kind === "sub"
          ? [E([1, 1], A1, B1), E([1, 1], R.mk(-B1[0], B1[1]), A1)]
          : kind === "mul"
            ? [E([1, A1[0]], [0, 1], B1), swapOk ? E([B1[0], 1], [0, 1], A1) : E([1, 1], A1, B1)]
            : [E([A1[0], 1], [0, 1], B1), swapOk ? E([1, B1[0]], [0, 1], A1) : E([1, 1], A1, B1)];
    const w = WHY[kind];
    const why = [fill(w[0]), fill(w[1]), fill(w[2]), fill(w[3])];
    if ((kind === "mul" || kind === "div") && !swapOk) {
      why[2] = fill("This one adds {a} to x, but the story is about equal groups, not adding.");
      why[3] = fill("Esta suma {a} a x, pero la historia trata de grupos iguales, no de sumar.");
    }
    const right = eqText(m, m.mode);
    const choices = rng.shuffle([
      { t: right, ok: true },
      { t: wrongs[0], why: why[0], whyEs: why[1] },
      { t: wrongs[1], why: why[2], whyEs: why[3] },
    ]);
    const clean = choices.filter((c, i) => c.ok || choices.findIndex((d) => d.t === c.t) === i);
    return {
      story: fill(t[1]),
      storyEs: fill(t[2]),
      unk: t[3],
      unkEs: t[4],
      choices: clean.map((c) => ({ t: c.t, why: c.why || "", whyEs: c.whyEs || "" })),
      pick: clean.findIndex((c) => c.ok),
    };
  }

  /* ---- text: hints and explanations ----------------------------------------------------------------- */
  function words(/** @type {any} */ m, /** @type {number[]} */ s) {
    const kind = kindOf(m);
    const f = (/** @type {number[]} */ r) => fmtR(r, m.mode);
    const a =
      kind === "add" || kind === "sub" ? f(R.abs(m.k)) : String(kind === "mul" ? m.c[0] : m.c[1]);
    const b = f(m.e);
    const v = f(s);
    const bothPans = "both pans";
    const T = {
      add: [
        [
          `Undo the + ${a}: take ${a} away from ${bothPans}. x = ${b} ${MINUS} ${a} = ${v}. Check: ${v} + ${a} = ${b}.`,
          `Para deshacer el + ${a}, quita ${a} de los dos platillos. x = ${b} ${MINUS} ${a} = ${v}. Comprueba: ${v} + ${a} = ${b}.`,
        ],
        [
          `The bag has ${a} extra blocks with it. Which tile takes them away?`,
          `La bolsa tiene ${a} bloques extra. ¿Qué ficha los quita?`,
        ],
        [
          `Take ${a} away from ${bothPans}, then read what is left.`,
          `Quita ${a} de los dos platillos y lee lo que queda.`,
        ],
      ],
      sub: [
        [
          `Undo the ${MINUS} ${a}: add ${a} to ${bothPans}. x = ${b} + ${a} = ${v}. Check: ${v} ${MINUS} ${a} = ${b}.`,
          `Para deshacer el ${MINUS} ${a}, suma ${a} a los dos platillos. x = ${b} + ${a} = ${v}. Comprueba: ${v} ${MINUS} ${a} = ${b}.`,
        ],
        [
          `The bag is missing ${a} blocks (the hatched ones). Which tile puts them back?`,
          `A la bolsa le faltan ${a} bloques (los rayados). ¿Qué ficha los devuelve?`,
        ],
        [
          `Add ${a} to ${bothPans}, then read what is left.`,
          `Suma ${a} a los dos platillos y lee lo que queda.`,
        ],
      ],
      mul: [
        [
          `${a} bags share the blocks equally. Divide ${bothPans} by ${a}: x = ${b} ${DIV} ${a} = ${v}. Check: ${a} ${TIMES} ${v} = ${b}.`,
          `${a} bolsas se reparten los bloques por igual. Divide los dos platillos entre ${a}: x = ${b} ${DIV} ${a} = ${v}. Comprueba: ${a} ${TIMES} ${v} = ${b}.`,
        ],
        [
          `${a} bags hold the same number of blocks. Which tile splits both pans into ${a} equal groups?`,
          `${a} bolsas tienen el mismo número de bloques. ¿Qué ficha separa los dos platillos en ${a} grupos iguales?`,
        ],
        [
          `Divide ${bothPans} by ${a}. One bag is left on the scale.`,
          `Divide los dos platillos entre ${a}. Queda una bolsa en la balanza.`,
        ],
      ],
      div: [
        [
          `The bag was split into ${a} equal parts. Multiply ${bothPans} by ${a}: x = ${b} ${TIMES} ${a} = ${v}. Check: ${v} ${DIV} ${a} = ${b}.`,
          `La bolsa se partió en ${a} partes iguales. Multiplica los dos platillos por ${a}: x = ${b} ${TIMES} ${a} = ${v}. Comprueba: ${v} ${DIV} ${a} = ${b}.`,
        ],
        [
          `One part of the bag (the bag split into ${a} equal parts) is on the scale. Which tile puts the parts back together?`,
          `Una parte de la bolsa (partida en ${a} partes iguales) está en la balanza. ¿Qué ficha junta las partes?`,
        ],
        [`Multiply ${bothPans} by ${a}.`, `Multiplica los dos platillos por ${a}.`],
      ],
    }[kind];
    return {
      x: T[0][0],
      xEs: T[0][1],
      h: ["Whatever you do to one pan, you must do to the other.", T[1][0], T[2][0]],
      hEs: ["Lo que hagas en un platillo, debes hacerlo en el otro.", T[1][1], T[2][1]],
    };
  }

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const form =
      params.form ||
      (level === 1
        ? "add"
        : level === 2
          ? "mul"
          : level === 3
            ? rng.pick(["add", "mul", "check"])
            : rng.pick(["word", "check", "word"]));
    const verify = level === 4 && form !== "check";
    let kind = "add";
    if (form === "mul") kind = "mul";
    else if (form === "word")
      kind =
        level === 1
          ? rng.pick(["add", "add", "sub"])
          : level === 2
            ? rng.pick(["sub", "mul", "div"])
            : rng.pick(["add", "sub", "mul", "div"]);
    else if (form === "check") kind = level === 1 || rng.chance(0.5) ? "add" : "mul";
    const g =
      kind === "add" || kind === "sub"
        ? genAdd(
            rng,
            level,
            form === "word" ? kind === "sub" : form === "check" ? undefined : undefined,
          )
        : genMul(rng, level, form === "word" ? kind === "mul" : undefined);
    const m = g.m;
    const s = g.s;
    const E = eqText(m, m.mode);
    const spec = /** @type {any} */ ({ form, model: m, verify });
    const w = words(m, s);
    spec.x = w.x;
    spec.xEs = w.xEs;
    spec.h = w.h;
    spec.hEs = w.hEs;
    const v = rng.int(0, 2);
    if (form === "add" || form === "mul") {
      spec.tiles = makeTiles(rng, m);
      spec.q = [
        `Use the scale to solve ${E}. Do the same thing to both pans.`,
        `Solve ${E} on the scale. Whatever you do to one pan, do to the other.`,
        `Get the bag by itself in ${E}. Do the same thing to both pans.`,
      ][v];
      spec.qEs = [
        `Usa la balanza para resolver ${E}. Haz lo mismo en los dos platillos.`,
        `Resuelve ${E} en la balanza. Lo que hagas en un platillo, hazlo en el otro.`,
        `Deja la bolsa sola en ${E}. Haz lo mismo en los dos platillos.`,
      ][v];
    } else if (form === "check") {
      Object.assign(spec, makeCands(rng, m, s));
      spec.q = `Put each number in the bag for ${E}. Does the scale balance? The heavier pan goes down.`;
      spec.qEs = `Pon cada número en la bolsa de ${E}. ¿La balanza queda equilibrada? El platillo más pesado baja.`;
      spec.x = `Put each number in for x and work out the left pan. Only x = ${fmtR(s, m.mode)} makes both pans equal, so it is the solution.`;
      spec.xEs = `Pon cada número en lugar de x y calcula el platillo izquierdo. Solo x = ${fmtR(s, m.mode)} iguala los dos platillos, así que es la solución.`;
      spec.h = [
        "Put the number where the bag was, then work out the left pan.",
        "Add up everything on the left pan. Is it the same as the right pan?",
        "The pan that holds more goes down.",
      ];
      spec.hEs = [
        "Pon el número donde estaba la bolsa y calcula el platillo izquierdo.",
        "Suma todo lo del platillo izquierdo. ¿Es igual al platillo derecho?",
        "El platillo que tiene más baja.",
      ];
    } else {
      spec.tiles = makeTiles(rng, m);
      const wb = wordBits(rng, m, s, kind);
      spec.choices = wb.choices;
      spec.pick = wb.pick;
      spec.q = `${wb.story} Let x be ${wb.unk}. Pick the equation that matches, then get x alone.`;
      spec.qEs = `${wb.storyEs} Sea x ${wb.unkEs}. Elige la ecuación que coincide y deja la x sola.`;
      spec.x = `The story matches ${E}. ${w.x}`;
      spec.xEs = `La historia coincide con ${E}. ${w.xEs}`;
      spec.h = [
        "Decide first: does the story add, take away, make equal groups, or share equally?",
        "Which equation uses that same operation with the same numbers?",
        "After you pick the equation, get x alone with the tiles.",
      ];
      spec.hEs = [
        "Primero decide: ¿la historia suma, quita, hace grupos iguales o reparte por igual?",
        "¿Qué ecuación usa esa misma operación con los mismos números?",
        "Después de elegir la ecuación, deja la x sola con las fichas.",
      ];
    }
    if (verify) {
      spec.h[2] += " Then put your x back in the bag and add up the left pan.";
      spec.hEs[2] += " Luego pon tu x otra vez en la bolsa y suma el platillo izquierdo.";
    }
    return spec;
  }

  /* ---- pure model: solution, wrong, grade ----------------------------------------------------------- */
  const asText = (/** @type {any} */ spec, /** @type {number[]} */ r) =>
    spec.model.mode === "frac" && r[1] !== 1
      ? `${r[0]}/${r[1]}`
      : fmtR(r, spec.model.mode === "int" ? "int" : "dec");
  function solution(/** @type {any} */ spec) {
    if (spec.form === "check") return { v: spec.truth.slice() };
    const m = spec.model;
    const s = solveOf(m);
    const st = /** @type {any} */ ({ ops: [inverseOp(m)], ans: asText(spec, s) });
    if (spec.form === "word") st.pick = spec.pick;
    if (spec.verify) st.chk = asText(spec, m.e);
    return st;
  }
  function wrong(/** @type {any} */ spec, /** @type {any} */ rng) {
    if (spec.form === "check") {
      const flip = (/** @type {number} */ i, /** @type {string|null} */ to) => {
        const v = spec.truth.slice();
        v[i] = to;
        return { v };
      };
      const alt = (/** @type {string} */ t) =>
        rng.pick(["left", "bal", "right"].filter((o) => o !== t));
      return [
        flip(0, alt(spec.truth[0])),
        flip(1, alt(spec.truth[1])),
        flip(2, null),
        flip(2, alt(spec.truth[2])),
      ];
    }
    const m = spec.model;
    const sol = /** @type {any} */ (solution(spec));
    const inv = sol.ops[0];
    const wd = { o: FLIP[inv.o], v: inv.v };
    const s = solveOf(m);
    const off = R.add(s, m.mode === "int" ? [1, 1] : [1, Math.max(2, s[1])]);
    const base = spec.form === "word" ? { pick: spec.pick } : {};
    const out = [
      { ...base, ops: [wd], ans: asText(spec, s), chk: sol.chk },
      { ...base, ops: [], ans: asText(spec, s), chk: sol.chk },
      { ...base, ops: [inv], ans: asText(spec, off), chk: sol.chk },
      { ...base, ops: [inv], ans: "", chk: sol.chk },
    ];
    if (spec.form === "word")
      out.push({
        pick: (spec.pick + 1) % spec.choices.length,
        ops: [inv],
        ans: sol.ans,
        chk: sol.chk,
      });
    if (spec.verify)
      out.push({ ...base, ops: [inv], ans: sol.ans, chk: asText(spec, R.add(m.e, [1, 1])) });
    return out;
  }
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });

  function gradeCheck(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const v = (st && st.v) || [];
    if (spec.truth.some((_, i) => !v[i]))
      return miss(
        "incomplete",
        "Choose a result for every number.",
        "Elige un resultado para cada número.",
      );
    for (let i = 0; i < spec.truth.length; i++) {
      if (v[i] === spec.truth[i]) continue;
      const num = fmtR(spec.cands[i], m.mode);
      const expr = substText(m, spec.cands[i]);
      const rhs = fmtR(m.e, m.mode);
      if (v[i] === "bal")
        return miss(
          "false-balance",
          `For x = ${num}: work out the left pan, ${expr}. Is it really the same as ${rhs}?`,
          `Para x = ${num}: calcula el platillo izquierdo, ${expr}. ¿De verdad es igual a ${rhs}?`,
        );
      if (spec.truth[i] === "bal")
        return miss(
          "false-tip",
          `For x = ${num}: both pans might hold the same amount. Work out ${expr} and compare it with ${rhs}.`,
          `Para x = ${num}: puede que los dos platillos tengan lo mismo. Calcula ${expr} y compáralo con ${rhs}.`,
        );
      return miss(
        "wrong-side",
        `For x = ${num}: the pan that holds the bigger number is heavier and goes down. Compare ${expr} (left) with ${rhs} (right) again.`,
        `Para x = ${num}: el platillo con el número mayor pesa más y baja. Compara otra vez ${expr} (izquierda) con ${rhs} (derecha).`,
      );
    }
    return { ok: true };
  }

  function notAlone(/** @type {any} */ spec, /** @type {any} */ eq, /** @type {any[]} */ ops) {
    const m = spec.model;
    const cur = eqText(eq, m.mode);
    if (!ops.length)
      return miss(
        "no-ops",
        "Use the tiles to get x alone before you check.",
        "Usa las fichas para dejar la x sola antes de comprobar.",
      );
    const last = ops[ops.length - 1];
    const inv = inverseOp(m);
    if (last.o === FLIP[inv.o] && R.eq(last.v, inv.v))
      return miss(
        "wrong-direction",
        `That tile goes the same way as the equation, so the pans just get heavier (now ${cur}). Undo it and try the opposite operation.`,
        `Esa ficha va en el mismo sentido que la ecuación, así que los platillos solo pesan más (ahora ${cur}). Desázla y prueba la operación contraria.`,
      );
    if (last.o !== inv.o && last.o !== FLIP[inv.o])
      return miss(
        "other-family",
        `That keeps the scale level, but x is not alone (${cur}). Which operation undoes what is done to x?`,
        `Eso deja la balanza nivelada, pero la x no está sola (${cur}). ¿Qué operación deshace lo que le pasa a x?`,
      );
    return miss(
      "not-alone",
      `x is not alone yet (${cur}). Keep going with the tiles.`,
      `La x todavía no está sola (${cur}). Sigue con las fichas.`,
    );
  }
  function wrongValue(/** @type {any} */ spec, /** @type {number} */ v) {
    const m = spec.model;
    const vr = toR(v);
    const reverse = isAddType(m) ? R.val(R.add(m.e, m.k)) : R.val(R.mul(m.e, m.c));
    const lead =
      Math.abs(v - reverse) < 1e-9
        ? [
            "It looks like you did the operation in the equation again instead of undoing it. ",
            "Parece que repetiste la operación de la ecuación en vez de deshacerla. ",
          ]
        : ["", ""];
    const l = vr ? fmtR(leftValue(m, vr), m.mode) : G.fmt(R.val(m.c) * v + R.val(m.k), 4);
    const r = fmtR(m.e, m.mode);
    const n = vr ? fmtR(vr, m.mode) : G.fmt(v, 4);
    return miss(
      lead[0] ? "reverse-op" : "wrong-value",
      `${lead[0]}Test it: put ${n} in the bag. The left pan holds ${l} and the right pan holds ${r}, so the scale tips.`,
      `${lead[1]}Pruébalo: pon ${n} en la bolsa. El platillo izquierdo tiene ${l} y el derecho tiene ${r}, así que la balanza se inclina.`,
    );
  }
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    if (!st || typeof st !== "object")
      return miss("blank", "Start with the tiles.", "Empieza con las fichas.");
    if (spec.form === "check") return gradeCheck(spec, st);
    if (spec.form === "word" && st.pick !== spec.pick) {
      const c = spec.choices[st.pick];
      return c
        ? miss("wrong-equation", c.why, c.whyEs)
        : miss(
            "no-equation",
            "First pick the equation that matches the story.",
            "Primero elige la ecuación que coincide con la historia.",
          );
    }
    const m = spec.model;
    const ops = st.ops || [];
    const eq = runOps(m, ops);
    if (!eq)
      return miss(
        "bad-ops",
        "One of the moves is not valid. Press Start over and try again.",
        "Una de las jugadas no es válida. Pulsa Empezar de nuevo.",
      );
    if (!solved(eq)) return notAlone(spec, eq, ops);
    const raw = String(st.ans ?? "")
      .trim()
      .replace(/^x\s*=\s*/i, "");
    if (!raw)
      return miss(
        "blank",
        "x is alone. Type the number it equals.",
        "La x está sola. Escribe el número al que es igual.",
      );
    const v = G.value(raw);
    if (Number.isNaN(v))
      return miss(
        "not-number",
        "Type a number for x, like 12 or 3/4.",
        "Escribe un número para x, como 12 o 3/4.",
      );
    if (Math.abs(v - R.val(eq.e)) > 1e-9) return wrongValue(spec, v);
    if (spec.verify) {
      const cv = G.value(String(st.chk ?? "").trim());
      if (Number.isNaN(cv))
        return miss(
          "verify-blank",
          "Now test your answer: put your x back in the bag and work out the left pan.",
          "Ahora prueba tu respuesta: pon tu x en la bolsa y calcula el platillo izquierdo.",
        );
      if (Math.abs(cv - R.val(m.e)) > 1e-9)
        return miss(
          "verify-wrong",
          "Check the test again. With your x in the bag, add up everything on the left pan.",
          "Revisa la prueba. Con tu x en la bolsa, suma todo lo del platillo izquierdo.",
        );
    }
    return { ok: true };
  }

  /* ---- DOM: styles ------------------------------------------------------------------------------------ */
  // biome-ignore format: compact stylesheet
  const CSS = `
.sa-root{--sa-i:var(--ink,#1B2733);--sa-s:var(--surface,#fff);--sa-b:var(--brand,#2C4A68);--sa-bt:var(--brand-tint,#E5ECF3);--sa-bl:var(--brand-line,#BBCADA);--sa-sun:var(--sun,#F0BD4F);--sa-ok:var(--ok,#0A7D4B);--sa-bad:var(--bad,#B42318);--sa-bd:var(--border,#D5DCE5);--sa-dk:var(--brand-dark,#1B2C3F);--sa-r:var(--radius-md,14px);--sa-mute:#566475;--sa-okt:#E4F7EC;--sa-badt:#FDECEA;--sa-sunt:#FAF2DC;color:var(--sa-i);max-width:640px;margin:0 auto;font-family:inherit}
@supports (color:color-mix(in srgb,red,blue)){.sa-root{--sa-mute:color-mix(in srgb,var(--sa-i) 72%,var(--sa-s));--sa-okt:color-mix(in srgb,var(--sa-ok) 16%,var(--sa-s));--sa-badt:color-mix(in srgb,var(--sa-bad) 14%,var(--sa-s));--sa-sunt:color-mix(in srgb,var(--sa-sun) 32%,var(--sa-s))}}
.sa-root *{box-sizing:border-box}
.sa-root [hidden]{display:none!important}
.sa-root :focus-visible{outline:3px solid var(--sa-i);outline-offset:1px;box-shadow:0 0 0 5px var(--sa-sun)}
.sa-es{display:none;font-size:.82em;font-weight:600;color:var(--sa-b);line-height:1.25}
body.show-es .sa-es,.sa-root[data-es="1"] .sa-es{display:block}
.sa-btn{appearance:none;font:inherit;font-weight:800;min-height:44px;min-width:44px;padding:8px 14px;border-radius:var(--sa-r);border:2px solid var(--sa-bl);border-bottom-width:4px;background:var(--sa-s);color:var(--sa-b);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;text-align:center}
.sa-btn:hover:not([disabled]){background:var(--sa-bt);border-color:var(--sa-b)}
.sa-btn:active:not([disabled]){transform:translateY(2px);border-bottom-width:2px}
.sa-btn[disabled]{opacity:.5;cursor:not-allowed}
.sa-btn[aria-pressed="true"]{background:var(--sa-bt);border-color:var(--sa-b);box-shadow:inset 0 0 0 2px var(--sa-b)}
.sa-btn.sa-go{background:var(--sa-b);color:var(--sa-s);border-color:var(--sa-dk)}
.sa-btn.sa-go:hover:not([disabled]){background:var(--sa-b);filter:brightness(1.1)}
.sa-btn.sa-go .sa-es{color:inherit}
.sa-status{min-height:1.5em;margin:8px 0 0;font-weight:700;color:var(--sa-mute)}
.sa-status.sa-bad{color:var(--sa-bad)}
.sa-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
.sa-in{font:inherit;font-weight:800;font-size:1.3rem;min-height:48px;width:7.5em;padding:6px 10px;text-align:center;border:3px solid var(--sa-bl);border-radius:var(--sa-r);background:var(--sa-s);color:var(--sa-i)}
.sa-in:focus{border-color:var(--sa-b)}
.sa-scale{display:block;width:100%;max-width:460px;margin:0 auto;height:auto;overflow:visible}
.sa-scale .sa-pillar,.sa-scale .sa-basep{fill:var(--sa-bl);stroke:var(--sa-b);stroke-width:2}
.sa-scale .sa-bar{fill:var(--sa-b)}
.sa-scale .sa-pivot{fill:var(--sa-sun);stroke:var(--sa-dk);stroke-width:2.5}
.sa-scale .sa-str{stroke:var(--sa-b);stroke-width:2;fill:none}
.sa-scale .sa-tray{fill:var(--sa-bt);stroke:var(--sa-b);stroke-width:2.5}
.sa-scale .sa-blk{fill:var(--sa-sun);stroke:var(--sa-dk);stroke-width:1.5}
.sa-scale .sa-blk.sa-neg{fill:var(--sa-s);stroke-dasharray:3 2;stroke:var(--sa-i)}
.sa-scale .sa-bag{fill:var(--sa-bt);stroke:var(--sa-b);stroke-width:2.5}
.sa-scale .sa-plate{fill:var(--sa-sunt);stroke:var(--sa-dk);stroke-width:2}
.sa-scale .sa-plate.sa-neg{stroke-dasharray:4 3;fill:var(--sa-s)}
.sa-scale text{fill:var(--sa-i);font-weight:800;font-family:inherit;text-anchor:middle}
.sa-scale .sa-q{font-size:30px;fill:var(--sa-mute)}
.sa-eq{margin:8px 0;text-align:center;font-size:1.7rem;font-weight:800;color:var(--sa-b);font-family:var(--font-display,inherit)}
.sa-tiles{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.sa-tile{min-width:76px;min-height:64px;font-size:1.5rem}
.sa-tile small{font-size:.68rem;font-weight:700;color:var(--sa-mute)}
.sa-log{list-style:none;margin:10px 0;padding:0;display:grid;gap:6px;font-size:.95rem}
.sa-log li{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;padding:6px 10px;border-radius:10px;background:var(--sa-bt)}
.sa-log .sa-chip{font-weight:800;padding:2px 10px;border-radius:99px;background:var(--sa-b);color:var(--sa-s)}
.sa-log .sa-long{color:var(--sa-mute)}
.sa-pick{display:grid;gap:8px;margin:0 0 12px;padding:0;border:0}
.sa-pick legend{font-weight:800;margin-bottom:6px;padding:0}
.sa-pick .sa-btn{font-size:1.25rem;justify-content:flex-start;padding:10px 16px}
.sa-pick .sa-btn.sa-okp{background:var(--sa-okt);border-color:var(--sa-ok)}
.sa-pick .sa-btn.sa-nopes{background:var(--sa-badt);border-color:var(--sa-bad)}
.sa-cand{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:10px;margin:0 0 10px;border:2px solid var(--sa-bd);border-radius:var(--sa-r)}
.sa-cand .sa-scale{width:210px;flex:0 0 auto}
.sa-cand-b{flex:1 1 220px;display:grid;gap:6px}
.sa-cand-t{margin:0;font-size:1.25rem;font-weight:800;color:var(--sa-b)}
.sa-verd{display:flex;flex-wrap:wrap;gap:6px}
.sa-verd .sa-btn{flex:1 1 90px}
.sa-test{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-weight:800;font-size:1.1rem;margin:6px 0}
.sa-test .sa-in{width:5.5em}
.sa-done{font-weight:800;color:var(--sa-ok)}
@media (prefers-reduced-motion:no-preference){.sa-scale .sa-beam,.sa-scale .sa-pan{transition:transform .55s cubic-bezier(.3,1.35,.5,1)}}
@media (forced-colors:active){.sa-btn,.sa-in,.sa-cand{border-color:ButtonText}.sa-btn[aria-pressed="true"]{outline:3px solid Highlight}.sa-scale .sa-blk,.sa-scale .sa-bag,.sa-scale .sa-tray,.sa-scale .sa-plate{stroke:CanvasText}}
`;

  /* ---- DOM: the scale ---------------------------------------------------------------------------------- */
  const NS = "http://www.w3.org/2000/svg";
  const BIG = { vw: 400, vh: 262, px: 200, py: 40, half: 130, str: 118, tw: 68, pw: 132 };
  const MINI = { vw: 250, vh: 124, px: 125, py: 24, half: 80, str: 56, tw: 48, pw: 90 };
  const blockSVG = (/** @type {boolean} */ neg, /** @type {number} */ x, /** @type {number} */ y) =>
    `<rect class="sa-blk${neg ? " sa-neg" : ""}" x="${x}" y="${y}" width="18" height="18" rx="3"/>`;
  const bagSVG = (
    /** @type {string} */ label,
    /** @type {number} */ x,
    /** @type {number} */ y,
    w = 40,
  ) =>
    `<g transform="translate(${x} ${y})"><path class="sa-bag" d="M${w * 0.22} 9 Q${w / 2} -4 ${w * 0.78} 9 L${w - 2} 35 Q${w - 1} 42 ${w - 8} 42 L8 42 Q1 42 2 35 Z"/><text x="${w / 2}" y="${label.length > 3 ? 31 : 33}" font-size="${label.length > 3 ? 12 : 19}">${esc(label)}</text></g>`;
  const plateSVG = (
    /** @type {string} */ txt,
    /** @type {boolean} */ neg,
    /** @type {number} */ x,
    /** @type {number} */ y,
    w = 62,
    h = 30,
  ) =>
    `<g transform="translate(${x} ${y})"><rect class="sa-plate${neg ? " sa-neg" : ""}" width="${w}" height="${h}" rx="8"/><text x="${w / 2}" y="${h / 2 + 6}" font-size="${txt.length > 9 ? 11 : txt.length > 6 ? 13 : 16}">${esc(txt)}</text></g>`;
  /** Rows fill from the tray upward. items: [{w, h, svg(x, y)}] */
  function layout(/** @type {any[]} */ items, /** @type {number} */ pw) {
    const rows = [[]];
    let x = 0;
    for (const it of items) {
      if (x > 0 && x + it.w > pw) {
        rows.push([]);
        x = 0;
      }
      rows[rows.length - 1].push(it);
      x += it.w + 4;
    }
    let out = "";
    let y = 0;
    for (const row of rows) {
      const rw = row.reduce((a, it) => a + it.w + 4, -4);
      let px = -rw / 2;
      for (const it of row) {
        out += it.svg(px, y - it.h);
        px += it.w + 4;
      }
      y -= Math.max(0, ...row.map((it) => it.h)) + 4;
    }
    return out;
  }
  const constItems = (/** @type {number[]} */ r, /** @type {string} */ mode) => {
    if (r[0] === 0) return [];
    const neg = r[0] < 0;
    if (r[1] === 1 && Math.abs(r[0]) <= 18)
      return Array.from({ length: Math.abs(r[0]) }, () => ({
        w: 18,
        h: 18,
        svg: (/** @type {number} */ x, /** @type {number} */ y) => blockSVG(neg, x, y),
      }));
    const t = fmtR(r, mode);
    return [
      {
        w: 62,
        h: 30,
        svg: (/** @type {number} */ x, /** @type {number} */ y) => plateSVG(t, neg, x, y),
      },
    ];
  };
  const bagItems = (/** @type {number[]} */ c) => {
    if (c[1] === 1 && c[0] <= 4)
      return Array.from({ length: c[0] }, () => ({
        w: 40,
        h: 42,
        svg: (/** @type {number} */ x, /** @type {number} */ y) => bagSVG("x", x, y),
      }));
    const label = c[1] === 1 ? `${c[0]}x` : c[0] === 1 ? `x${DIV}${c[1]}` : `${c[0]}x${DIV}${c[1]}`;
    return [
      {
        w: 56,
        h: 42,
        svg: (/** @type {number} */ x, /** @type {number} */ y) => bagSVG(label, x, y, 56),
      },
    ];
  };
  let _uid = 0;
  function makeScale(/** @type {any} */ d, /** @type {boolean} */ mini) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${d.vw} ${d.vh}`);
    svg.setAttribute("class", "sa-scale");
    svg.setAttribute("role", "img");
    const tray = (/** @type {number} */ s) =>
      `<path class="sa-tray" d="M${-d.tw} ${d.str} h${2 * d.tw} q0 ${s} ${-s} ${s} h${-(2 * d.tw - 2 * s)} q${-s} 0 ${-s} ${-s} z"/>`;
    const pan = (/** @type {string} */ side) =>
      `<g class="sa-pan ${side}"><path class="sa-str" d="M0 0 L${-d.tw + 6} ${d.str} M0 0 L${d.tw - 6} ${d.str}"/>${tray(mini ? 10 : 16)}<g class="sa-ct" transform="translate(0 ${d.str})"></g></g>`;
    _uid++;
    svg.innerHTML = `<path class="sa-basep" d="M${d.px - 55} ${d.vh - 14} h110 l8 14 h-126 z"/><rect class="sa-pillar" x="${d.px - 6}" y="${d.py}" width="12" height="${d.vh - d.py - 8}" rx="3"/><g class="sa-beam" style="transform-origin:${d.px}px ${d.py}px"><rect class="sa-bar" x="${d.px - d.half - 8}" y="${d.py - 5}" width="${2 * d.half + 16}" height="10" rx="5"/></g><circle class="sa-pivot" cx="${d.px}" cy="${d.py}" r="9"/>${pan("sa-pl")}${pan("sa-pr")}<text class="sa-q" x="${d.px}" y="${d.py - 14}"></text>`;
    const beam = /** @type {SVGElement} */ (svg.querySelector(".sa-beam"));
    const pl = /** @type {SVGElement} */ (svg.querySelector(".sa-pl"));
    const pr = /** @type {SVGElement} */ (svg.querySelector(".sa-pr"));
    const ql = /** @type {SVGElement} */ (svg.querySelector(".sa-q"));
    return {
      svg,
      set(
        /** @type {string} */ lm,
        /** @type {string} */ rm,
        /** @type {number} */ deg,
        /** @type {boolean} */ unsure,
      ) {
        const r = (deg * Math.PI) / 180;
        beam.style.transform = `rotate(${deg}deg)`;
        pl.style.transform = `translate(${d.px - d.half * Math.cos(r)}px, ${d.py - d.half * Math.sin(r)}px)`;
        pr.style.transform = `translate(${d.px + d.half * Math.cos(r)}px, ${d.py + d.half * Math.sin(r)}px)`;
        /** @type {any} */ (pl.querySelector(".sa-ct")).innerHTML = lm;
        /** @type {any} */ (pr.querySelector(".sa-ct")).innerHTML = rm;
        ql.textContent = unsure ? "?" : "";
      },
    };
  }

  /* ---- DOM: the widget ----------------------------------------------------------------------------------- */
  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("balance", CSS);
    const m = spec.model;
    const ro = !!api.solved;
    const isEs = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (isEs() ? es : en);
    const T = (/** @type {string} */ en, /** @type {string} */ es) =>
      `${esc(en)}<span class="sa-es" lang="es">${esc(es)}</span>`;
    const root = A.el("div", "sa-root", "", { "data-form": spec.form });
    if (isEs()) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const live = A.el("div", "", "", {
      role: "status",
      "aria-live": "polite",
      style: "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)",
    });
    const say = (/** @type {string} */ msg) => (api.say ? api.say(msg) : (live.textContent = msg));
    /** @type {any} */
    const st = { pick: null, ops: [], ans: "", chk: "", v: (spec.cands || []).map(() => null) };
    if (api.restore) Object.assign(st, clone(api.restore));
    const emit = () => api.change?.(clone(st));
    let tip = 0;
    let statusEl = /** @type {HTMLElement} */ (A.el("p", "sa-status"));
    const status = (/** @type {string} */ en, /** @type {string} */ es, bad = false) => {
      statusEl.innerHTML = en ? T(en, es) : "";
      statusEl.classList.toggle("sa-bad", bad);
      if (en) say(L(en, es));
    };
    const current = () => runOps(m, st.ops) || { c: m.c, k: m.k, e: m.e };
    root.append(live);
    const btn = (
      /** @type {string} */ html,
      /** @type {string} */ label,
      /** @type {string} */ cls = "",
    ) => A.el("button", `sa-btn ${cls}`, html, { type: "button", "aria-label": label });

    if (spec.form === "check") mountCheck();
    else mountSolve();
    root.append(statusEl);

    /* -- check form: test candidate values -- */
    function mountCheck() {
      const list = A.el("div", "sa-cands");
      const opts = [
        ["left", "Tips left", "Se inclina a la izquierda", -9],
        ["bal", "Balanced", "Equilibrada", 0],
        ["right", "Tips right", "Se inclina a la derecha", 9],
      ];
      const rows = spec.cands.map((/** @type {number[]} */ cv, /** @type {number} */ i) => {
        const sc = makeScale(MINI, true);
        const num = fmtR(cv, m.mode);
        const row = A.el("div", "sa-cand");
        const body = A.el(
          "div",
          "sa-cand-b",
          `<p class="sa-cand-t">x = ${esc(num)}</p><p style="margin:0;font-weight:700">${esc(substText(m, cv))} ? ${esc(fmtR(m.e, m.mode))}</p>`,
        );
        const group = A.el("div", "sa-verd", "", {
          role: "group",
          "aria-label": L(`Result when x = ${num}`, `Resultado cuando x = ${num}`),
        });
        const bs = opts.map((o) => {
          const b = btn(
            T(/** @type {string} */ (o[1]), /** @type {string} */ (o[2])),
            L(`x = ${num}: ${o[1]}`, `x = ${num}: ${o[2]}`),
          );
          b.setAttribute("aria-pressed", "false");
          if (ro) b.setAttribute("disabled", "");
          b.addEventListener("click", () => {
            st.v[i] = o[0];
            paint();
            emit();
            say(L(`x = ${num}: ${o[1]}.`, `x = ${num}: ${o[2]}.`));
          });
          group.append(b);
          return b;
        });
        body.append(group);
        row.append(sc.svg, body);
        list.append(row);
        return { sc, bs };
      });
      root.append(list);
      const paint = () =>
        rows.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
          const pick = opts.find((o) => o[0] === st.v[i]);
          const lt = plateSVG(substText(m, spec.cands[i]), false, -42, -28, 84, 26);
          const rt = plateSVG(fmtR(m.e, m.mode), false, -42, -28, 84, 26);
          r.sc.set(lt, rt, pick ? pick[3] : 0, !pick);
          r.sc.svg.setAttribute(
            "aria-label",
            L(
              `Scale for x = ${fmtR(spec.cands[i], m.mode)}: left ${substText(m, spec.cands[i])}, right ${fmtR(m.e, m.mode)}.`,
              `Balanza para x = ${fmtR(spec.cands[i], m.mode)}: izquierda ${substText(m, spec.cands[i])}, derecha ${fmtR(m.e, m.mode)}.`,
            ),
          );
          r.bs.forEach((/** @type {HTMLElement} */ b, /** @type {number} */ j) =>
            b.setAttribute("aria-pressed", String(opts[j][0] === st.v[i])),
          );
        });
      paint();
      if (!ro) addCheck();
      else status("Solved.", "Resuelto.");
    }

    /* -- add / mul / word forms: the scale and the tiles -- */
    function mountSolve() {
      let pickBox = null;
      const stage = A.el("div", "sa-stage");
      if (spec.form === "word") {
        pickBox = A.el("fieldset", "sa-pick");
        pickBox.innerHTML = `<legend>${T("Which equation matches the story?", "¿Qué ecuación coincide con la historia?")}</legend>`;
        spec.choices.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
          const b = btn(esc(c.t), L(`Equation ${c.t}`, `Ecuación ${c.t}`));
          b.setAttribute("aria-pressed", "false");
          b.dataset.i = String(i);
          if (ro) b.setAttribute("disabled", "");
          b.addEventListener("click", () => {
            st.pick = i;
            if (i === spec.pick)
              status(
                "That matches the story. Now get x alone.",
                "Eso coincide con la historia. Ahora deja la x sola.",
              );
            else status(c.why, c.whyEs, true);
            paint();
            emit();
          });
          pickBox.append(b);
        });
        root.append(pickBox);
      }
      const sc = makeScale(BIG, false);
      const eqEl = A.el("p", "sa-eq", "", { "aria-hidden": "true" });
      const tiles = A.el("div", "sa-tiles", "", {
        role: "group",
        "aria-label": L("Do the same to both pans", "Haz lo mismo en los dos platillos"),
      });
      const tileBtns = spec.tiles.map((/** @type {any} */ op, /** @type {number} */ _i) => {
        const val = fmtR(op.v, m.mode);
        const name = {
          "+": [`Add ${val} to both pans`, `Suma ${val} a los dos platillos`],
          "-": [`Take away ${val} from both pans`, `Quita ${val} de los dos platillos`],
          "*": [`Multiply both pans by ${val}`, `Multiplica los dos platillos por ${val}`],
          "/": [`Divide both pans by ${val}`, `Divide los dos platillos entre ${val}`],
        }[/** @type {"+"} */ (op.o)];
        const b = btn(
          `<span>${SYM[op.o]} ${esc(val)}</span><small>${T("both pans", "los dos platillos")}</small>`,
          L(name[0], name[1]),
          "sa-tile",
        );
        if (ro) b.setAttribute("disabled", "");
        b.addEventListener("click", () => tryOp(op, name));
        tiles.append(b);
        return b;
      });
      const log = A.el("ol", "sa-log", "", { "aria-label": L("Your moves", "Tus jugadas") });
      const ctrl = A.el("div", "sa-row");
      const undo = btn(T("Undo", "Deshacer"), L("Undo the last move", "Deshacer la última jugada"));
      const reset = btn(T("Start over", "Empezar de nuevo"), L("Start over", "Empezar de nuevo"));
      ctrl.append(undo, reset);
      const ansRow = A.el("div", "sa-row");
      const ansIn = /** @type {HTMLInputElement} */ (
        A.el("input", "sa-in", "", {
          type: "text",
          inputmode: "decimal",
          autocomplete: "off",
          "aria-label": L("Value of x", "Valor de x"),
          enterkeyhint: "done",
        })
      );
      ansIn.value = st.ans || "";
      ansRow.append(A.el("span", "", `<b style="font-size:1.4rem">x =</b>`), ansIn);
      const testRow = A.el("div", "sa-test");
      const testLbl = A.el("span");
      const chkIn = /** @type {HTMLInputElement} */ (
        A.el("input", "sa-in", "", {
          type: "text",
          inputmode: "decimal",
          autocomplete: "off",
          "aria-label": L("Total on the left pan", "Total del platillo izquierdo"),
        })
      );
      chkIn.value = st.chk || "";
      const testNote = A.el("span", "", "", { style: "color:var(--sa-mute)" });
      testNote.innerHTML = `${T("Test your x. Put it in the bag and add up the left pan.", "Prueba tu x. Ponla en la bolsa y suma el platillo izquierdo.")}`;
      testRow.append(testNote, testLbl, chkIn);
      testRow.hidden = !spec.verify;
      stage.append(
        sc.svg,
        eqEl,
        ro ? A.el("span") : tiles,
        log,
        ro ? A.el("span") : ctrl,
        ansRow,
        testRow,
      );
      root.append(stage);
      if (ro) {
        ansIn.readOnly = true;
        chkIn.readOnly = true;
      }

      const unlocked = () => spec.form !== "word" || st.pick === spec.pick;
      function paint() {
        const eq = current();
        const lItems = [...bagItems(eq.c), ...constItems(eq.k, m.mode)];
        const rItems = constItems(eq.e, m.mode);
        sc.set(layout(lItems, BIG.pw), layout(rItems, BIG.pw), tip, false);
        sc.svg.setAttribute(
          "aria-label",
          L(
            `Balance scale. Left pan: ${leftText(eq, m.mode)}. Right pan: ${fmtR(eq.e, m.mode)}. ${tip === 0 ? "The scale is level." : "The scale tips."}`,
            `Balanza. Platillo izquierdo: ${leftText(eq, m.mode)}. Platillo derecho: ${fmtR(eq.e, m.mode)}. ${tip === 0 ? "La balanza está nivelada." : "La balanza se inclina."}`,
          ),
        );
        eqEl.textContent = eqText(eq, m.mode);
        let prev = { c: m.c, k: m.k, e: m.e };
        log.innerHTML = "";
        st.ops.forEach((/** @type {any} */ op, /** @type {number} */ _i) => {
          const nx = applyOp(prev, op) || prev;
          const v = fmtR(op.v, m.mode);
          const lt =
            ["*", "/"].includes(op.o) && prev.k[0]
              ? `(${leftText(prev, m.mode)})`
              : leftText(prev, m.mode);
          const li = A.el(
            "li",
            "",
            `<span class="sa-chip">${SYM[op.o]} ${esc(v)}</span><span class="sa-long">${esc(`${lt} ${SYM[op.o]} ${v} = ${fmtR(prev.e, m.mode)} ${SYM[op.o]} ${v}`)}</span><b>→ ${esc(eqText(nx, m.mode))}</b>`,
          );
          log.append(li);
          prev = nx;
        });
        const lock = ro || !unlocked();
        tileBtns.forEach(
          (/** @type {HTMLButtonElement} */ b) => (b.disabled = lock || st.ops.length >= MAXOPS),
        );
        undo.disabled = lock || !st.ops.length;
        reset.disabled = lock || (!st.ops.length && !st.ans);
        ansIn.disabled = !unlocked();
        stage.style.opacity = unlocked() ? "" : "0.45";
        if (pickBox)
          pickBox.querySelectorAll("button").forEach((/** @type {HTMLElement} */ b) => {
            const i = Number(b.dataset.i);
            b.setAttribute("aria-pressed", String(st.pick === i));
            b.classList.toggle("sa-okp", st.pick === i && i === spec.pick);
            b.classList.toggle("sa-nopes", st.pick === i && i !== spec.pick);
          });
        const v = G.value(String(st.ans).trim());
        const vr = Number.isNaN(v) ? null : toR(v);
        testLbl.innerHTML = `<span>${esc(vr ? substText(m, vr) : leftText({ c: m.c, k: m.k }, m.mode))} =</span>`;
      }
      function tryOp(/** @type {any} */ op, /** @type {string[]} */ name) {
        const nx = applyOp(current(), op);
        if (!nx || !legal(nx, m.mode)) {
          const e = current().e;
          tip = R.val(e) % 1 === 0 && op.o === "/" ? 6 : -6;
          status(
            `${fmtR(e, m.mode)} cannot be shared into equal groups of ${fmtR(op.v, m.mode)}, so the scale tips. Try a different tile.`,
            `${fmtR(e, m.mode)} no se puede repartir en grupos iguales de ${fmtR(op.v, m.mode)}, así que la balanza se inclina. Prueba otra ficha.`,
            true,
          );
          paint();
          return;
        }
        st.ops.push({ o: op.o, v: op.v });
        tip = 0;
        paint();
        emit();
        const done = solved(nx);
        status(
          `${name[0]}. The scale is still level: ${eqText(nx, m.mode)}.${done ? " x is alone. Type its value." : ""}`,
          `${name[1]}. La balanza sigue nivelada: ${eqText(nx, m.mode)}.${done ? " La x está sola. Escribe su valor." : ""}`,
        );
        if (done && !ro) ansIn.focus();
      }
      undo.addEventListener("click", () => {
        st.ops.pop();
        tip = 0;
        paint();
        emit();
        status("Undid the last move.", "Se deshizo la última jugada.");
      });
      reset.addEventListener("click", () => {
        st.ops = [];
        st.ans = "";
        st.chk = "";
        ansIn.value = "";
        chkIn.value = "";
        tip = 0;
        paint();
        emit();
        status("Started over.", "Empezamos de nuevo.");
      });
      ansIn.addEventListener("input", () => {
        st.ans = ansIn.value;
        tip = 0;
        paint();
        emit();
      });
      chkIn.addEventListener("input", () => {
        st.chk = chkIn.value;
        emit();
      });
      for (const inp of [ansIn, chkIn])
        inp.addEventListener(
          "keydown",
          (/** @type {KeyboardEvent} */ e) => e.key === "Enter" && !ro && check(),
        );
      paint();
      if (ro) status("Solved.", "Resuelto.");
      else addCheck(check);

      function check() {
        const s = clone(st);
        let g = api.submit ? api.submit(s) : null;
        if (!g || typeof g !== "object" || !("ok" in g)) g = grade(spec, s);
        if (g.ok) return;
        if (g.tag === "wrong-value" || g.tag === "reverse-op") {
          const v = G.value(
            String(st.ans)
              .trim()
              .replace(/^x\s*=\s*/i, ""),
          );
          const vr = toR(v);
          const d = vr
            ? R.val(R.sub(leftValue(m, vr), m.e))
            : R.val(m.c) * v + R.val(m.k) - R.val(m.e);
          tip = d > 0 ? -8 : 8;
          paint();
          status(
            "Your number in the bag makes the scale tip.",
            "Tu n\u00FAmero en la bolsa hace que la balanza se incline.",
            true,
          );
        } else status("", "");
      }
    }

    function addCheck(/** @type {(() => void)|undefined} */ fn) {
      const row = A.el("div", "sa-row");
      const b = btn(
        T("Check", "Comprobar"),
        L("Check my answer", "Comprobar mi respuesta"),
        "sa-go",
      );
      b.addEventListener("click", () => {
        if (fn) fn();
        else {
          const s = clone(st);
          let g = api.submit ? api.submit(s) : null;
          if (!g || typeof g !== "object" || !("ok" in g)) g = grade(spec, s);
        }
      });
      row.append(b);
      root.append(row);
    }
  }

  A.register("balance", {
    title: "Balance scale",
    titleEs: "Balanza",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();

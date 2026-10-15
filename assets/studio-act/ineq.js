/**
 * Practice Studio activity: ineq (window.StudioAct kind "ineq").
 * Write, graph and test inequalities. Modes: write, graph, test.
 * State: write { v, op, n }, graph { n, closed, dir }, test { sel: [valueIndex, ...] }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  /* ---- helpers ------------------------------------------------------------------------------ */
  const bi = (/** @type {string} */ s) => s.split("¦").map((t) => t.trim());
  const r4 = (/** @type {number} */ n) => Math.round(n * 1e4) / 1e4;
  const mn = (/** @type {number} */ n) => G.fmt(n, 4).replace("-", "−");
  const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1e-6;
  const MODES = ["write", "graph", "test"];
  const OPS = {
    ">": { sym: ">", dir: "right", incl: false, en: "greater than", es: "mayor que", flip: "<" },
    ">=": {
      sym: "≥",
      dir: "right",
      incl: true,
      en: "greater than or equal to",
      es: "mayor o igual que",
      flip: "<=",
    },
    "<": { sym: "<", dir: "left", incl: false, en: "less than", es: "menor que", flip: ">" },
    "<=": {
      sym: "≤",
      dir: "left",
      incl: true,
      en: "less than or equal to",
      es: "menor o igual que",
      flip: ">=",
    },
  };
  const holds = (/** @type {string} */ op, /** @type {number} */ a, /** @type {number} */ b) =>
    op === ">"
      ? a > b + 1e-9
      : op === ">="
        ? a >= b - 1e-9
        : op === "<"
          ? a < b - 1e-9
          : a <= b + 1e-9;
  const pack = (/** @type {any} */ o) => {
    const [q, qEs] = bi(o.q);
    const [x, xEs] = bi(o.x);
    const hh = o.h.map(bi);
    return { q, qEs, x, xEs, h: hh.map((t) => t[0]), hEs: hh.map((t) => t[1]) };
  };
  const miss = (/** @type {string} */ tag, /** @type {string} */ s) => {
    const [say, sayEs] = bi(s);
    return { ok: false, tag, say, sayEs };
  };

  /* ---- write: stories ----------------------------------------------------------------------- */
  // [op, story, key words, variable, meaning, other variables, lo, hi, flags]
  const STORIES = [
    [
      ">=",
      "To ride the coaster, you must be at least {n} inches tall. ¦ Para subir a la montaña rusa, debes medir al menos {n} pulgadas.",
      "at least ¦ al menos",
      "h",
      "height in inches ¦ altura en pulgadas",
      [
        ["r", "number of riders ¦ número de pasajeros"],
        ["t", "ticket price in dollars ¦ precio del boleto en dólares"],
      ],
      36,
      60,
      "",
    ],
    [
      "<=",
      "A school bus can hold no more than {n} students. ¦ Un autobús escolar puede llevar no más de {n} estudiantes.",
      "no more than ¦ no más de",
      "s",
      "students on the bus ¦ estudiantes en el autobús",
      [
        ["b", "number of buses ¦ número de autobuses"],
        ["m", "miles to the park ¦ millas al parque"],
      ],
      20,
      60,
      "",
    ],
    [
      ">",
      "Mia has more than {n} stickers. ¦ Mia tiene más de {n} calcomanías.",
      "more than ¦ más de",
      "s",
      "stickers Mia has ¦ calcomanías de Mia",
      [
        ["p", "pages in her album ¦ páginas de su álbum"],
        ["c", "cost of one sticker in cents ¦ costo de una calcomanía en centavos"],
      ],
      5,
      80,
      "",
    ],
    [
      "<",
      "Fewer than {n} students signed up for chess club. ¦ Menos de {n} estudiantes se inscribieron en el club de ajedrez.",
      "fewer than ¦ menos de",
      "s",
      "students who signed up ¦ estudiantes inscritos",
      [
        ["c", "number of clubs ¦ número de clubes"],
        ["d", "days of practice ¦ días de práctica"],
      ],
      4,
      40,
      "",
    ],
    [
      ">=",
      "A recipe needs at least {n} cups of flour. ¦ Una receta necesita al menos {n} tazas de harina.",
      "at least ¦ al menos",
      "f",
      "cups of flour ¦ tazas de harina",
      [
        ["e", "number of eggs ¦ número de huevos"],
        ["s", "number of servings ¦ número de porciones"],
      ],
      2,
      12,
      "dec",
    ],
    [
      "<=",
      "Sam can spend at most ${n} at the fair. ¦ Sam puede gastar como máximo ${n} en la feria.",
      "at most ¦ como máximo",
      "d",
      "dollars Sam spends ¦ dólares que gasta Sam",
      [
        ["p", "price of a ride ¦ precio de un juego"],
        ["t", "tickets Sam buys ¦ boletos que compra Sam"],
      ],
      10,
      60,
      "",
    ],
    [
      ">",
      "The water in the tank is deeper than {n} feet. ¦ El agua del tanque tiene más de {n} pies de profundidad.",
      "deeper than ¦ más profunda que",
      "d",
      "depth of the water in feet ¦ profundidad del agua en pies",
      [
        ["w", "width of the tank ¦ ancho del tanque"],
        ["g", "gallons used ¦ galones usados"],
      ],
      3,
      20,
      "dec",
    ],
    [
      "<",
      "Ana's backpack weighs under {n} pounds. ¦ La mochila de Ana pesa menos de {n} libras.",
      "under ¦ menos de",
      "w",
      "weight of the backpack in pounds ¦ peso de la mochila en libras",
      [
        ["b", "number of books ¦ número de libros"],
        ["p", "price of the backpack ¦ precio de la mochila"],
      ],
      5,
      30,
      "dec",
    ],
    [
      "<=",
      "You can carry up to {n} pounds in the basket. ¦ Puedes llevar hasta {n} libras en la canasta.",
      "up to ¦ hasta",
      "w",
      "weight in pounds ¦ peso en libras",
      [
        ["b", "number of baskets ¦ número de canastas"],
        ["c", "cost in dollars ¦ costo en dólares"],
      ],
      10,
      50,
      "dec",
    ],
    [
      ">=",
      "Lena needs a minimum of {n} points to win the game. ¦ Lena necesita un mínimo de {n} puntos para ganar el juego.",
      "a minimum of ¦ un mínimo de",
      "p",
      "points Lena scores ¦ puntos de Lena",
      [
        ["g", "number of games ¦ número de juegos"],
        ["t", "number of turns ¦ número de turnos"],
      ],
      10,
      60,
      "",
    ],
    [
      ">",
      "The movie ran longer than {n} minutes. ¦ La película duró más de {n} minutos.",
      "longer than ¦ más de",
      "m",
      "length of the movie in minutes ¦ duración de la película en minutos",
      [
        ["t", "number of tickets ¦ número de boletos"],
        ["c", "cost in dollars ¦ costo en dólares"],
      ],
      60,
      150,
      "",
    ],
    [
      ">=",
      "The temperature stayed at or above {n} degrees. ¦ La temperatura se mantuvo en {n} grados o más.",
      "at or above ¦ en o por encima de",
      "t",
      "temperature in degrees ¦ temperatura en grados",
      [
        ["d", "number of days ¦ número de días"],
        ["w", "wind speed in mph ¦ velocidad del viento en mph"],
      ],
      -9,
      -1,
      "neg",
    ],
    [
      "<",
      "It was colder than {n} degrees outside. ¦ Afuera hacía más frío que {n} grados.",
      "colder than ¦ más frío que",
      "t",
      "temperature in degrees ¦ temperatura en grados",
      [
        ["h", "hours outside ¦ horas afuera"],
        ["s", "snow in inches ¦ nieve en pulgadas"],
      ],
      -9,
      -1,
      "neg",
    ],
    [
      "<=",
      "The freezer must be no warmer than {n} degrees. ¦ El congelador debe estar a no más de {n} grados.",
      "no warmer than ¦ no más caliente que",
      "t",
      "freezer temperature in degrees ¦ temperatura del congelador en grados",
      [
        ["f", "number of freezers ¦ número de congeladores"],
        ["p", "price of the freezer ¦ precio del congelador"],
      ],
      -9,
      -1,
      "neg",
    ],
  ];
  function mkWrite(rng, lv, p) {
    const pool = STORIES.filter((s) =>
      lv === 1
        ? !s[8] && s[0].length === 1
        : lv === 2
          ? !s[8]
          : lv === 3
            ? s[8] === "dec"
            : s[8] !== "",
    );
    const [op, txt, kw, v, m, others, lo, hi, flag] = rng.pick(pool);
    let n = rng.int(lo, hi);
    if (flag === "dec" && lv >= 3 && rng.chance(0.7)) n = rng.int(lo, hi - 1) + 0.5;
    const money = txt.includes("${n}");
    const nT = mn(n);
    const [kwEn, kwEs] = bi(kw);
    const vars = rng
      .shuffle([
        [v, m],
        ...others.map((/** @type {any} */ o) => [
          o[0],
          o[1].includes("¦") ? o[1] : `${o[1]} ¦ ${o[1]}`,
        ]),
      ])
      .map((/** @type {any} */ a) => {
        const [mEn, mEs] = bi(a[1]);
        return { v: a[0], m: mEn, mEs };
      });
    const o = OPS[op];
    return {
      ...pack({
        q: `${txt.replace("{n}", nT)} Build the inequality that matches. ¦ ${bi(txt)[1].replace("{n}", nT)} Construye la desigualdad que corresponde.`.replace(
          /^[^¦]*¦/,
          (a) => `${bi(txt)[0].replace("{n}", nT)} Build the inequality that matches. ¦`,
        ),
        x: `"${kwEn}" means ${v} is ${o.en} ${money ? "$" : ""}${nT}. So the inequality is ${v} ${o.sym} ${nT}. ¦ "${kwEs}" significa que ${v} es ${o.es} ${money ? "$" : ""}${nT}. Entonces la desigualdad es ${v} ${o.sym} ${nT}.`,
        h: [
          "Find the key words that tell about the limit, like at least, at most, more than, or fewer than. ¦ Busca las palabras clave que hablan del límite, como al menos, como máximo, más de o menos de.",
          "Ask yourself: can the value be exactly equal to the number? If yes, the symbol needs the line under it. ¦ Pregúntate: ¿el valor puede ser exactamente igual al número? Si es así, el símbolo lleva la línea de abajo.",
          "Pick the variable that stands for the amount the story talks about. Check which side of the limit it can be on. ¦ Elige la variable que representa la cantidad de la que habla la historia. Revisa de qué lado del límite puede estar.",
        ],
      }),
      vars,
      want: { v, op, n },
      step: n % 1 ? 0.5 : 1,
      far: bi(
        "Read the story again. Which quantity does it compare to a limit, and is that limit a top or a bottom? ¦ Lee la historia otra vez. ¿Qué cantidad compara con un límite y ese límite es un máximo o un mínimo?",
      ),
    };
  }
  function gradeWrite(/** @type {any} */ spec, /** @type {any} */ st) {
    const s = st || {};
    const w = spec.want;
    if (!s.v || !s.op || s.n === null || s.n === undefined || !Number.isFinite(Number(s.n))) {
      return miss(
        "incomplete",
        "Choose a variable, a symbol, and a number before you check. ¦ Elige una variable, un símbolo y un número antes de comprobar.",
      );
    }
    if (s.v === w.v && s.op === w.op && near(Number(s.n), w.n)) return { ok: true };
    if (s.v !== w.v)
      return miss(
        "variable",
        "Think about which quantity the story compares to a limit. That is the variable. ¦ Piensa qué cantidad compara la historia con un límite. Esa es la variable.",
      );
    if (!OPS[s.op])
      return miss(
        "incomplete",
        "Choose one of the four symbols. ¦ Elige uno de los cuatro símbolos.",
      );
    if (OPS[s.op].dir !== OPS[w.op].dir)
      return miss(
        "direction",
        "Look at the key words. Does the story set a top limit or a bottom limit? ¦ Mira las palabras clave. ¿La historia fija un máximo o un mínimo?",
      );
    if (s.op !== w.op)
      return miss(
        "boundary",
        "Check the key words again. Can the value be exactly equal to the number? That decides if the symbol needs the line under it. ¦ Revisa otra vez las palabras clave. ¿El valor puede ser exactamente igual al número? Eso decide si el símbolo lleva la línea de abajo.",
      );
    return miss(
      "number",
      "Check the number. It is the limit named in the story. ¦ Revisa el número. Es el límite que nombra la historia.",
    );
  }
  function wrongWrite(/** @type {any} */ spec, /** @type {any} */ rng) {
    const w = spec.want;
    const sameDir = Object.keys(OPS).find((k) => k !== w.op && OPS[k].dir === OPS[w.op].dir);
    const other = Object.keys(OPS).find(
      (k) => OPS[k].dir !== OPS[w.op].dir && OPS[k].incl === OPS[w.op].incl,
    );
    const otherVar = spec.vars.find((/** @type {any} */ x) => x.v !== w.v);
    const out = [
      { v: w.v, op: other, n: w.n },
      { v: w.v, op: sameDir, n: w.n },
      { v: otherVar.v, op: w.op, n: w.n },
      { v: w.v, op: w.op, n: w.n + (w.n % 1 ? 1 : 2) },
      { v: w.v, op: null, n: null },
    ];
    return rng.shuffle(out).slice(0, 4);
  }

  /* ---- graph -------------------------------------------------------------------------------- */
  const LETTERS = ["x", "n", "p", "k", "w", "t"];
  function mkGraph(rng, lv, p) {
    const vr = rng.pick(LETTERS);
    const op = rng.pick(Object.keys(OPS));
    const o = OPS[op];
    let b;
    let text;
    let how;
    let howEs;
    let rhs = null;
    let flipped = false;
    const ln =
      lv === 1
        ? { min: -6, max: 6, step: 1 }
        : lv === 3
          ? { min: -5, max: 5, step: 0.5 }
          : { min: -10, max: 10, step: 1 };
    if (lv === 1) b = rng.int(1, 5);
    else if (lv === 2) b = rng.pick([-1, 1]) * rng.int(1, 8);
    else if (lv === 3) b = rng.chance(0.7) ? rng.int(-5, 4) + 0.5 : rng.int(-4, 4);
    else b = rng.int(-8, 8);
    if (lv === 4) {
      const kind = rng.pick(["add", "sub", "mul", "div"]);
      const a = rng.int(2, kind === "add" || kind === "sub" ? 7 : 4);
      let c;
      if (kind === "add") c = b + a;
      else if (kind === "sub") c = b - a;
      else if (kind === "mul") c = b * a;
      else c = b / a;
      if (kind === "mul" || kind === "div") {
        b = Math.abs(b) || rng.int(1, 5);
        c = kind === "mul" ? b * a : b / a;
      }
      rhs = c;
      const lhs =
        kind === "add"
          ? `${vr} + ${a}`
          : kind === "sub"
            ? `${vr} − ${a}`
            : kind === "mul"
              ? `${a}${vr}`
              : `${vr} ÷ ${a}`;
      text = `${lhs} ${o.sym} ${mn(c)}`;
      const undo =
        kind === "add"
          ? `subtract ${a}`
          : kind === "sub"
            ? `add ${a}`
            : kind === "mul"
              ? `divide by ${a}`
              : `multiply by ${a}`;
      const undoEs =
        kind === "add"
          ? `resta ${a}`
          : kind === "sub"
            ? `suma ${a}`
            : kind === "mul"
              ? `divide entre ${a}`
              : `multiplica por ${a}`;
      how = `Solve first: ${undo} on both sides, so ${vr} ${o.sym} ${mn(b)}. `;
      howEs = `Primero resuelve: ${undoEs} en ambos lados, así que ${vr} ${o.sym} ${mn(b)}. `;
    } else if (lv === 3 && rng.chance(0.6)) {
      text = `${mn(b)} ${OPS[o.flip].sym} ${vr}`;
      flipped = true;
      how = `Turn it around: ${vr} ${o.sym} ${mn(b)}. `;
      howEs = `Dale la vuelta: ${vr} ${o.sym} ${mn(b)}. `;
    } else {
      text = `${vr} ${o.sym} ${mn(b)}`;
      how = "";
      howEs = "";
    }
    const dirEs = o.dir === "right" ? "derecha" : "izquierda";
    const circ = o.incl
      ? [
          "closed circle, because " + mn(b) + " is a solution",
          `círculo cerrado, porque ${mn(b)} es una solución`,
        ]
      : [
          "open circle, because " + mn(b) + " is not a solution",
          `círculo abierto, porque ${mn(b)} no es una solución`,
        ];
    return {
      ...pack({
        q: `Graph the inequality ${text} on the number line. ¦ Representa la desigualdad ${text} en la recta numérica.`,
        x: `${how}Use a ${circ[0]}. ${o.dir === "right" ? "Greater" : "Lesser"} numbers are to the ${o.dir}, so the ray points ${o.dir}. ¦ ${howEs}Usa un ${circ[1]}. Los números ${o.dir === "right" ? "mayores" : "menores"} están a la ${dirEs}, así que el rayo apunta a la ${dirEs}.`,
        h: [
          lv === 4
            ? "Solve for the variable first. Undo the operation on both sides. ¦ Primero despeja la variable. Deshaz la operación en ambos lados."
            : flipped
              ? "When the number comes first, turn the sentence around so it starts with the variable. ¦ Cuando el número va primero, da vuelta la oración para que empiece con la variable."
              : `Read it as a sentence that starts with ${vr}. ¦ Léela como una oración que empieza con ${vr}.`,
          "Open circle: the number is not included. Closed circle: the number is included. ¦ Círculo abierto: el número no está incluido. Círculo cerrado: el número está incluido.",
          "Pick a test number on the ray. Does it make the inequality true? ¦ Elige un número de prueba en el rayo. ¿Hace verdadera la desigualdad?",
        ],
      }),
      line: ln,
      ineq: { vr, text, op },
      want: { n: b, closed: o.incl, dir: o.dir },
      rhs,
      flipped,
      far: bi(
        "Look at the inequality again. Where is the boundary number, and which side of it makes the statement true? ¦ Mira otra vez la desigualdad. ¿Dónde está el número límite y de qué lado se cumple el enunciado?",
      ),
    };
  }
  function gradeGraph(/** @type {any} */ spec, /** @type {any} */ st) {
    const s = st || {};
    const w = spec.want;
    if (
      s.n === null ||
      s.n === undefined ||
      s.closed === null ||
      s.closed === undefined ||
      !s.dir
    ) {
      return miss(
        "incomplete",
        "Finish your graph: set the boundary, choose open or closed, and choose a direction. ¦ Termina tu gráfica: fija el límite, elige abierto o cerrado y elige una dirección.",
      );
    }
    if (near(Number(s.n), w.n) && !!s.closed === w.closed && s.dir === w.dir) return { ok: true };
    if (!near(Number(s.n), w.n)) {
      if (spec.rhs !== null && near(Number(s.n), spec.rhs))
        return miss(
          "forgot-to-solve",
          "It looks like you graphed the number on the right side. Solve the inequality for the variable first. ¦ Parece que graficaste el número del lado derecho. Primero resuelve la desigualdad para la variable.",
        );
      if (near(Number(s.n), -w.n))
        return miss(
          "sign",
          "Check the sign of your boundary. It is on the other side of 0 from where it should be. ¦ Revisa el signo de tu límite. Está del otro lado del 0 respecto de donde debe estar.",
        );
      return miss(
        "boundary",
        `${spec.rhs !== null ? "Your boundary does not match the solved inequality. Solve for the variable first, then find that number. " : "Your boundary is not at the number in the inequality. Find that number on the line. "}¦ ${spec.rhs !== null ? "Tu límite no coincide con la desigualdad resuelta. Primero despeja la variable y luego busca ese número. " : "Tu límite no está en el número de la desigualdad. Busca ese número en la recta. "}`,
      );
    }
    if (s.dir !== w.dir) {
      return miss(
        spec.flipped ? "flipped-form" : "direction",
        spec.flipped
          ? "Careful: the number comes first. Turn the sentence around so it starts with the variable, then pick the direction. ¦ Cuidado: el número va primero. Da vuelta la oración para que empiece con la variable y luego elige la dirección."
          : "Your ray points the other way. Pick a number on your ray and test it in the inequality. Does it make it true? ¦ Tu rayo apunta al otro lado. Elige un número de tu rayo y pruébalo en la desigualdad. ¿La hace verdadera?",
      );
    }
    return miss(
      "circle",
      "Look at the symbol. Does the inequality include the boundary number itself? A closed circle includes it. An open circle does not. ¦ Mira el símbolo. ¿La desigualdad incluye el propio número límite? Un círculo cerrado lo incluye. Un círculo abierto no.",
    );
  }
  function wrongGraph(/** @type {any} */ spec, /** @type {any} */ rng) {
    const w = spec.want;
    const out = [
      { n: w.n, closed: !w.closed, dir: w.dir },
      { n: w.n, closed: w.closed, dir: w.dir === "left" ? "right" : "left" },
      { n: w.n === 0 ? w.n + spec.line.step : -w.n, closed: w.closed, dir: w.dir },
      { n: w.n + spec.line.step * 2, closed: w.closed, dir: w.dir },
      { n: null, closed: null, dir: null },
    ];
    return rng.shuffle(out).slice(0, 4);
  }

  /* ---- test --------------------------------------------------------------------------------- */
  function mkTest(rng, lv, p) {
    const vr = rng.pick(LETTERS);
    const op = lv === 1 ? rng.pick([">", "<"]) : rng.pick(Object.keys(OPS));
    const o = OPS[op];
    const st = lv === 3 ? 0.5 : 1;
    let b =
      lv === 1
        ? rng.int(2, 8)
        : lv === 2
          ? rng.int(-5, 8)
          : lv === 3
            ? rng.int(-3, 4) + (rng.chance(0.6) ? 0.5 : 0)
            : rng.int(-4, 8);
    let text = `${vr} ${o.sym} ${mn(b)}`;
    let a = 0;
    let kind = "";
    if (lv === 4) {
      kind = rng.pick(["add", "sub", "mul", "div"]);
      a = rng.int(2, kind === "add" || kind === "sub" ? 7 : 4);
      if (kind === "mul" || kind === "div") b = Math.abs(b) || rng.int(1, 5);
      const c = kind === "add" ? b + a : kind === "sub" ? b - a : kind === "mul" ? b * a : b / a;
      const lhs =
        kind === "add"
          ? `${vr} + ${a}`
          : kind === "sub"
            ? `${vr} − ${a}`
            : kind === "mul"
              ? `${a}${vr}`
              : `${vr} ÷ ${a}`;
      text = `${lhs} ${o.sym} ${mn(c)}`;
    }
    let vals = [];
    for (let i = 0; i < 200; i++) {
      const set = new Set([b]);
      if (lv === 3 && rng.chance(0.35)) {
        set.add(r4(b + 0.1));
        set.add(r4(b - 0.1));
      }
      set.add(r4(b + st));
      set.add(r4(b - st));
      while (set.size < 8) {
        const k = rng.int(-4, 4);
        if (k) set.add(r4(b + k * st));
      }
      vals = rng.shuffle([...set]).slice(0, 8);
      if (!vals.includes(b)) vals[0] = b;
      const sol = vals.filter((v) => holds(op, v, b)).length;
      if (sol >= 3 && sol <= 5 && new Set(vals).size === 8) break;
    }
    vals = rng.shuffle(vals);
    const want = vals.map((v, i) => (holds(op, v, b) ? i : -1)).filter((i) => i >= 0);
    const bd = vals.indexOf(b);
    const bdWord = o.incl ? ["is", "es"] : ["is not", "no es"];
    const subst = lv === 4 ? ` Solving gives ${vr} ${o.sym} ${mn(b)}.` : "";
    const substEs = lv === 4 ? ` Al resolver se obtiene ${vr} ${o.sym} ${mn(b)}.` : "";
    return {
      ...pack({
        q: `Tap every number that is a solution of ${text}. ¦ Toca cada número que sea solución de ${text}.`,
        x: `A solution makes the inequality true.${subst} ${mn(b)} ${bdWord[0]} a solution because ${mn(b)} ${o.sym} ${mn(b)} is ${o.incl ? "true" : "false"}. The solutions are ${want.map((i) => mn(vals[i])).join(", ")}. ¦ Una solución hace verdadera la desigualdad.${substEs} ${mn(b)} ${bdWord[1]} una solución porque ${mn(b)} ${o.sym} ${mn(b)} es ${o.incl ? "verdadero" : "falso"}. Las soluciones son ${want.map((i) => mn(vals[i])).join(", ")}.`,
        h: [
          "A solution is a number that makes the inequality a true statement. Substitute a number to test it. ¦ Una solución es un número que hace verdadero el enunciado. Sustituye un número para probarlo.",
          "Test the boundary number carefully. Does it make the statement true, or only equal? ¦ Prueba con cuidado el número límite. ¿Hace verdadero el enunciado o solo es igual?",
          "Test one number on each side of the boundary. Which side works? ¦ Prueba un número de cada lado del límite. ¿Qué lado funciona?",
        ],
      }),
      line: {
        min: Math.floor(Math.min(...vals)) - 1,
        max: Math.ceil(Math.max(...vals)) + 1,
        step: 1,
      },
      ineq: { vr, text, op },
      values: vals.map((v) => ({ v, t: mn(v) })),
      want,
      bound: bd,
      b,
      far: bi(
        "Substitute each number you picked into the inequality. Keep only the ones that make it true. ¦ Sustituye cada número que elegiste en la desigualdad. Quédate solo con los que la hacen verdadera.",
      ),
    };
  }
  function gradeTest(/** @type {any} */ spec, /** @type {any} */ st) {
    /** @type {number[]} */
    const sel = [];
    for (const i of (st && st.sel) || [])
      if (Number.isInteger(i) && i >= 0 && i < spec.values.length && !sel.includes(i)) sel.push(i);
    const w = spec.want;
    if (!sel.length)
      return miss(
        "incomplete",
        "Tap the numbers you think are solutions, then check. ¦ Toca los números que creas que son soluciones y luego comprueba.",
      );
    const extra = sel.filter((i) => !w.includes(i));
    const lack = w.filter((i) => !sel.includes(i));
    if (!extra.length && !lack.length) return { ok: true };
    const only = extra.length + lack.length;
    if (only === 1 && (extra[0] === spec.bound || lack[0] === spec.bound)) {
      return miss(
        "boundary",
        "Test the boundary number itself. Substitute it: does the statement come out true, or is it only equal? ¦ Prueba el propio número límite. Sustitúyelo: ¿el enunciado resulta verdadero o solo igual?",
      );
    }
    if (!sel.some((i) => w.includes(i)))
      return miss(
        "wrong-side",
        "Your numbers are on the other side of the boundary. Test one of them in the inequality. ¦ Tus números están del otro lado del límite. Prueba uno de ellos en la desigualdad.",
      );
    if (extra.length)
      return miss(
        "wrong-pick",
        "At least one number you picked does not make the inequality true. Substitute each picked number to test it. ¦ Al menos un número que elegiste no hace verdadera la desigualdad. Sustituye cada número elegido para probarlo.",
      );
    return miss(
      "missed",
      "You found some solutions, but not all of them. Test the numbers you left out, too. ¦ Encontraste algunas soluciones, pero no todas. Prueba también los números que dejaste fuera.",
    );
  }
  function wrongTest(/** @type {any} */ spec, /** @type {any} */ rng) {
    const w = spec.want;
    const all = spec.values.map((/** @type {any} */ _, /** @type {number} */ i) => i);
    const non = all.filter((i) => !w.includes(i));
    const out = [{ sel: non }, { sel: w.slice(1) }, { sel: [...w, non[0]] }, { sel: [] }];
    const bdFlip = w.includes(spec.bound) ? w.filter((i) => i !== spec.bound) : [...w, spec.bound];
    out.push({ sel: bdFlip });
    return rng
      .shuffle(out.filter((s) => s.sel.slice().sort().join() !== w.slice().sort().join()))
      .slice(0, 4);
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.si{display:grid;gap:14px;max-width:640px;color:var(--ink,#1B2733)}
.si-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.si-expr,.si-prev{font-weight:800;font-size:1.6rem;color:var(--brand,#2C4A68);background:var(--brand-tint,#E5ECF3);border:2px solid var(--brand-line,#BBCADA);border-radius:var(--radius-md,14px);padding:10px 16px;text-align:center;letter-spacing:.02em}
.si-prev small{display:block;font-size:.85rem;font-weight:600;color:var(--ink,#1B2733);letter-spacing:0;margin-top:2px}
.si-prev .es-text{color:var(--brand,#2C4A68);font-size:.8rem}
.si-group{border:0;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px;align-items:stretch}
.si-cap{font-weight:800;font-size:.9rem;color:var(--brand,#2C4A68);margin:0 0 4px}
.si-chip,.si-sym,.si-btn,.si-val,.si-step{appearance:none;font:inherit;cursor:pointer;color:var(--brand,#2C4A68);background:var(--surface,#fff);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);min-height:48px;min-width:48px}
.si-chip{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:6px 14px;text-align:left;font-size:.95rem;font-weight:700;line-height:1.25;color:var(--ink,#1B2733)}
.si-chip b{font-size:1.15rem;color:var(--brand,#2C4A68)}
.si-sym{font-size:1.7rem;font-weight:800;width:64px;display:inline-flex;align-items:center;justify-content:center}
.si-btn{font-weight:800;padding:8px 18px;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}
.si-val{font-weight:800;font-size:1.15rem;min-width:64px;padding:6px 14px;color:var(--ink,#1B2733)}
.si-step{font-size:1.5rem;font-weight:800}
.si-chip[aria-pressed=true],.si-sym[aria-pressed=true],.si-btn[aria-pressed=true],.si-val[aria-pressed=true]{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.si-chip[aria-pressed=true] b{color:var(--surface,#fff)}
.si-chip:hover:not([disabled]):not([aria-pressed=true]),.si-sym:hover:not([disabled]):not([aria-pressed=true]),.si-btn:hover:not([disabled]):not([aria-pressed=true]),.si-val:hover:not([disabled]):not([aria-pressed=true]),.si-step:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.si-btn.go,.si-btn.go:hover:not([disabled]){background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.si-btn.go:hover:not([disabled]){filter:brightness(.88)}
.si [disabled]{cursor:default}
.si-btn[disabled]:not([aria-pressed]){opacity:.5;cursor:not-allowed}
.si-val.ok,.si-chip.ok{border-color:var(--ok,#0A7D4B)}
.si-val.bad{border-color:var(--bad,#B42318)}
.si-val .g{font-size:.85rem;margin-right:6px}
.si-btn .es-text,.si-chip .es-text{color:inherit;font-size:.75em;margin:0;font-weight:600}
.si-chip:focus-visible,.si-sym:focus-visible,.si-btn:focus-visible,.si-val:focus-visible,.si-step:focus-visible,.si-line:focus-visible,.si-num:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.si-num{font:inherit;font-weight:800;font-size:1.3rem;text-align:center;width:104px;min-height:48px;border:2px solid var(--brand,#2C4A68);border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.si-numrow{display:flex;gap:8px;align-items:center}
.si-line{touch-action:pan-y;background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);cursor:crosshair;line-height:0;overflow:hidden;user-select:none;-webkit-user-select:none}
.si-solved .si-line,.si-line.ro{cursor:default}
.si-line svg{display:block;width:100%;height:auto}
.si-base,.si-tick{stroke:var(--ink,#1B2733);stroke-width:2.2}
.si-tick{stroke-width:1.6}
.si-tick.sub{stroke:var(--brand-line,#BBCADA)}
.si-arrow{fill:var(--ink,#1B2733)}
.si-lab{fill:var(--ink,#1B2733);font:700 12px system-ui,sans-serif;text-anchor:middle;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:3px}
.si-ray{stroke:var(--brand,#2C4A68);stroke-width:6;stroke-linecap:round}
.si-rayh{fill:var(--brand,#2C4A68)}
.si-solved .si-ray{stroke:var(--ok,#0A7D4B)}
.si-solved .si-rayh{fill:var(--ok,#0A7D4B)}
.si-circ{stroke:var(--brand,#2C4A68);stroke-width:3.5;fill:var(--surface,#fff)}
.si-circ.closed{fill:var(--brand,#2C4A68)}
.si-circ.unset{stroke-dasharray:3 3}
.si-solved .si-circ{stroke:var(--ok,#0A7D4B)}
.si-solved .si-circ.closed{fill:var(--ok,#0A7D4B)}
.si-circ.bad{stroke:var(--bad,#B42318)}
.si-circ.closed.bad{fill:var(--bad,#B42318)}
.si-pt{fill:var(--brand,#2C4A68);stroke:var(--surface,#fff);stroke-width:2.5}
.si-pt.ok{fill:var(--ok,#0A7D4B)}
.si-pt.bad{fill:var(--bad,#B42318)}
.si-glyph{fill:var(--surface,#fff);font:800 11px system-ui,sans-serif;text-anchor:middle;dominant-baseline:central}
.si-ghost{fill:none;stroke:var(--brand,#2C4A68);stroke-width:2;stroke-dasharray:3 3}
.si-cur{fill:none;stroke:var(--ink,#1B2733);stroke-width:3}
.si-curh{fill:none;stroke:var(--sun,#F0BD4F);stroke-width:7}
.si-bar,.si-pad{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.si-pad[hidden]{display:none}
.si-note{margin:0;font-weight:700}
.si-note:empty{display:none}
.si-ok{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;border:2px solid var(--ok,#0A7D4B);color:color-mix(in srgb,var(--ok,#0A7D4B) 55%,var(--ink,#1B2733));background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff));font-weight:800}
@media (prefers-reduced-motion:no-preference){.si-circ.new,.si-pt.new{transform-box:fill-box;transform-origin:center;animation:si-pop .2s ease-out}@keyframes si-pop{from{transform:scale(.4)}to{transform:scale(1)}}}
@media (forced-colors:active){.si-circ{stroke:CanvasText;fill:Canvas}.si-circ.closed,.si-rayh,.si-pt{fill:Highlight}.si-ray{stroke:Highlight}.si-base,.si-tick,.si-cur{stroke:CanvasText}.si-lab,.si-arrow{fill:CanvasText}.si-glyph{fill:Canvas}.si-chip,.si-sym,.si-btn,.si-val,.si-step{border-color:ButtonText}.si [aria-pressed=true]{outline:3px solid Highlight}}
`;
  const r1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
  const SYMS = ["<", "<=", ">", ">="];

  function mountIneq(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("ineq", CSS);
    const mode = spec.mode;
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const T = (/** @type {string} */ en, /** @type {string} */ esT) => A.t(en, esT);
    let solved = !!api.solved;
    const saved = api.restore || {};
    /** @type {any} */
    let st =
      mode === "write"
        ? { v: saved.v || null, op: saved.op || null, n: saved.n === undefined ? null : saved.n }
        : mode === "graph"
          ? {
              n: saved.n === undefined ? null : saved.n,
              closed: saved.closed === undefined ? null : saved.closed,
              dir: saved.dir || null,
            }
          : { sel: (saved.sel || []).slice() };
    /** @type {any} */
    let marks = null;
    let showCur = false;
    /** @type {number|null} */
    let ghost = null;
    /** @type {any} */
    let down = null;
    let cur = 0;
    let fresh = false;
    let geo = { W: 0, ML: 0, pw: 1, ts: 1 };
    const ln = spec.line;
    const n = ln ? Math.round((ln.max - ln.min) / ln.step) : 0;
    const valAt = (/** @type {number} */ k) => r4(ln.min + k * ln.step);

    host.textContent = "";
    const root = A.el("div", `si${solved ? " si-solved" : ""}`);
    const helpId = `si-help-${Math.random().toString(36).slice(2, 8)}`;
    const body = A.el("div", "si-body", "", { style: "display:grid;gap:14px" });
    const bar = A.el("div", "si-bar");
    const note = A.el("p", "si-note");
    const checkBtn = A.el("button", "si-btn go", T("Check", "Comprobar"), { type: "button" });
    const clearBtn = A.el("button", "si-btn", T("Clear", "Borrar"), { type: "button" });
    const badge = A.el("span", "si-ok", `✓ ${T("Solved", "Resuelto")}`);
    bar.append(solved ? badge : checkBtn, ...(solved ? [] : [clearBtn]));
    root.append(body, ...(solved ? [] : [note]), bar);
    host.append(root);
    /** @type {any} */
    let lineEl = null;
    /** @type {any} */
    let pad = null;
    const say = (/** @type {string} */ en, /** @type {string} */ esT) =>
      api.say && api.say(L(en, esT));
    const emit = () => api.change && api.change(JSON.parse(JSON.stringify(st)));
    const preview = A.el("div", "si-prev", "", { "aria-live": "off" });

    /* -- number line shared by graph and test -- */
    function lineSvg() {
      const Wd = Math.max(
        260,
        Math.min(620, Math.round(lineEl.clientWidth || host.clientWidth || 340)),
      );
      const ML = 26;
      const pw = Wd - 2 * ML;
      const by = 52;
      geo = { W: Wd, ML, pw, ts: pw / n };
      const X = (/** @type {number} */ v) => r1(ML + ((v - ln.min) / (ln.max - ln.min)) * pw);
      const s = [];
      s.push(
        `<line class="si-base" x1="${ML - 14}" y1="${by}" x2="${Wd - ML + 14}" y2="${by}"/><path class="si-arrow" d="M${ML - 20} ${by} l10 -5 v10z M${Wd - ML + 20} ${by} l-10 -5 v10z"/>`,
      );
      const every = Math.max(1, Math.ceil(26 / (pw / ((ln.max - ln.min) / 1))));
      for (let k = 0; k <= n; k++) {
        const v = valAt(k);
        const whole = Math.abs(v - Math.round(v)) < 1e-6;
        s.push(
          `<line class="si-tick${whole ? "" : " sub"}" x1="${X(v)}" y1="${by - (whole ? 8 : 5)}" x2="${X(v)}" y2="${by + (whole ? 8 : 5)}"/>`,
        );
        if (whole && Math.round(v) % every === 0)
          s.push(`<text class="si-lab" x="${X(v)}" y="${by + 28}">${mn(v)}</text>`);
      }
      const m = (/** @type {number} */ i) =>
        solved ? "ok" : marks ? (marks[i] ? "ok" : "bad") : "";
      if (mode === "graph") {
        const g = solved ? { n: spec.want.n, closed: spec.want.closed, dir: spec.want.dir } : st;
        if (g.n !== null && g.n !== undefined && g.dir) {
          const x0 = X(g.n);
          const x1 = g.dir === "right" ? Wd - ML + 14 : ML - 14;
          s.push(
            `<line class="si-ray" x1="${x0}" y1="${by}" x2="${x1}" y2="${by}"/><path class="si-rayh" d="${g.dir === "right" ? `M${Wd - ML + 22} ${by} l-12 -9 v18z` : `M${ML - 22} ${by} l12 -9 v18z`}"/>`,
          );
        }
        if (g.n !== null && g.n !== undefined) {
          const unset = g.closed === null || g.closed === undefined;
          s.push(
            `<circle class="si-circ${g.closed ? " closed" : ""}${unset ? " unset" : ""}${marks && !solved ? " bad" : ""}${fresh ? " new" : ""}" cx="${X(g.n)}" cy="${by}" r="10"/>`,
          );
          if (unset)
            s.push(
              `<text class="si-glyph" x="${X(g.n)}" y="${by}" style="fill:var(--brand,#2C4A68)">?</text>`,
            );
        }
        if (!solved && ghost !== null)
          s.push(`<circle class="si-ghost" cx="${X(ghost)}" cy="${by}" r="10"/>`);
        if (!solved && showCur)
          s.push(
            `<circle class="si-curh" cx="${X(valAt(cur))}" cy="${by}" r="16"/><circle class="si-cur" cx="${X(valAt(cur))}" cy="${by}" r="16"/>`,
          );
      } else {
        if (solved) {
          const o = OPS[spec.ineq.op];
          const x0 = X(spec.b);
          s.push(
            `<line class="si-ray" x1="${x0}" y1="${by}" x2="${o.dir === "right" ? Wd - ML + 14 : ML - 14}" y2="${by}"/><circle class="si-circ${o.incl ? " closed" : ""}" cx="${x0}" cy="${by}" r="10"/>`,
          );
        }
        st.sel.forEach((/** @type {number} */ i, /** @type {number} */ j) => {
          const v = spec.values[i].v;
          const x = X(Math.max(ln.min, Math.min(ln.max, v)));
          const mk = m(j);
          s.push(
            `<circle class="si-pt ${mk}" cx="${x}" cy="${by - 16 - (j % 2) * 0}" r="9"/>${mk ? `<text class="si-glyph" x="${x}" y="${by - 16}">${mk === "ok" ? "✓" : "✕"}</text>` : ""}`,
          );
          s.push(
            `<line stroke="var(--brand-line,#BBCADA)" stroke-width="1.5" x1="${x}" y1="${by - 7}" x2="${x}" y2="${by}"/>`,
          );
        });
      }
      lineEl.innerHTML = `<svg viewBox="0 0 ${Wd} ${by + 44}" width="${Wd}" height="${by + 44}" aria-hidden="true" focusable="false">${s.join("")}</svg>`;
      fresh = false;
    }

    /* -- preview text -- */
    function previewText() {
      if (mode === "write") {
        const o = st.op ? OPS[st.op] : null;
        const nt = st.n === null || st.n === undefined || st.n === "" ? "?" : mn(Number(st.n));
        const sentence = `${st.v || "?"} ${o ? o.sym : "?"} ${nt}`;
        const read = o
          ? `${st.v || "?"} is ${o.en} ${nt}`
          : T("Choose a symbol", "Elige un símbolo");
        const readEs = o ? `${st.v || "?"} es ${o.es} ${nt}` : "";
        preview.innerHTML = `${sentence}<small>${o ? A.t(read, readEs) : read}</small>`;
      } else if (mode === "graph") {
        if (st.n !== null && st.closed !== null && st.dir) {
          const sym = st.dir === "right" ? (st.closed ? "≥" : ">") : st.closed ? "≤" : "<";
          preview.innerHTML = `${T("Your graph says", "Tu gráfica dice")}: ${spec.ineq.vr} ${sym} ${mn(Number(st.n))}`;
        } else {
          preview.innerHTML = T(
            "Your graph is not finished yet",
            "Tu gráfica aún no está terminada",
          );
        }
      }
    }
    const refresh = () => {
      previewText();
      const have =
        mode === "write"
          ? st.v || st.op || (st.n !== null && st.n !== undefined && st.n !== "")
          : mode === "graph"
            ? st.n !== null || st.closed !== null || st.dir
            : st.sel.length;
      checkBtn.disabled = !have;
      clearBtn.disabled = !have;
      if (lineEl) lineSvg();
    };

    /* -- build the mode's controls -- */
    const group = (
      /** @type {string} */ cap,
      /** @type {string} */ capEs,
      /** @type {string} */ label,
      /** @type {string} */ labelEs,
    ) => {
      const wrap = A.el("div", "");
      wrap.append(A.el("p", "si-cap", T(cap, capEs)));
      const fs = A.el("div", "si-group", "", { role: "group" });
      fs.setAttribute("aria-label", L(label, labelEs));
      fs.dataset.en = label;
      fs.dataset.es = labelEs;
      wrap.append(fs);
      return [wrap, fs];
    };
    const relabel = [];
    const pressed = (/** @type {any} */ b, /** @type {boolean} */ on) =>
      b.setAttribute("aria-pressed", String(on));
    if (mode !== "write") {
      body.append(
        A.el("div", "si-expr", spec.ineq.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")),
      );
    }
    if (mode === "write") {
      const [w1, vg] = group("1. Variable", "1. Variable", "Variable", "Variable");
      const chips = spec.vars.map((/** @type {any} */ x) => {
        const b = A.el("button", "si-chip", `<b>${x.v}</b><span>${T(x.m, x.mEs)}</span>`, {
          type: "button",
          "data-v": x.v,
        });
        b.dataset.en = `${x.v}: ${x.m}`;
        b.dataset.es = `${x.v}: ${x.mEs}`;
        relabel.push(b);
        vg.append(b);
        return b;
      });
      const [w2, sg] = group("2. Symbol", "2. Símbolo", "Symbol", "Símbolo");
      const syms = SYMS.map((k) => {
        const b = A.el("button", "si-sym", OPS[k].sym, { type: "button", "data-op": k });
        b.dataset.en = OPS[k].en;
        b.dataset.es = OPS[k].es;
        relabel.push(b);
        sg.append(b);
        return b;
      });
      const [w3, ng] = group("3. Number", "3. Número", "Number", "Número");
      const row = A.el("div", "si-numrow");
      const minus = A.el("button", "si-step", "−", { type: "button", "data-d": "-1" });
      const plus = A.el("button", "si-step", "+", { type: "button", "data-d": "1" });
      const inp = A.el("input", "si-num", "", {
        type: "text",
        inputmode: "decimal",
        autocomplete: "off",
      });
      minus.dataset.en = "Make the number smaller";
      minus.dataset.es = "Hacer el número menor";
      plus.dataset.en = "Make the number bigger";
      plus.dataset.es = "Hacer el número mayor";
      relabel.push(minus, plus);
      row.append(minus, inp, plus);
      ng.append(row);
      body.append(w1, w2, w3, preview);
      const syncW = () => {
        chips.forEach((b) => pressed(b, st.v === b.dataset.v));
        syms.forEach((b) => pressed(b, st.op === b.dataset.op));
        inp.value = st.n === null || st.n === undefined ? "" : mn(Number(st.n));
        for (const b of [...chips, ...syms, minus, plus, inp]) b.disabled = solved;
        refresh();
      };
      vg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-v]");
        if (!b || solved) return;
        st.v = b.dataset.v;
        marks = null;
        emit();
        say(`Variable ${st.v}`, `Variable ${st.v}`);
        syncW();
      });
      sg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-op]");
        if (!b || solved) return;
        st.op = b.dataset.op;
        emit();
        say(OPS[st.op].en, OPS[st.op].es);
        syncW();
      });
      const setN = (/** @type {any} */ v) => {
        st.n = v;
        emit();
        refresh();
      };
      inp.addEventListener("input", () => {
        const t = inp.value.replace(/−/g, "-").trim();
        setN(t === "" || t === "-" || t === "." || Number.isNaN(Number(t)) ? null : Number(t));
      });
      inp.addEventListener("blur", () => {
        inp.value = st.n === null ? "" : mn(Number(st.n));
      });
      row.addEventListener("click", (e) => {
        const b = e.target.closest("[data-d]");
        if (!b || solved) return;
        const base = st.n === null || st.n === undefined ? 0 : Number(st.n);
        st.n = r4(base + Number(b.dataset.d) * spec.step);
        inp.value = mn(st.n);
        emit();
        say(mn(st.n), mn(st.n));
        refresh();
      });
      relabel.push({ sync: syncW });
      syncW();
    } else if (mode === "graph") {
      lineEl = A.el("div", "si-line", "", { tabindex: solved ? "-1" : "0" });
      const [w1, cg] = group("Circle", "Círculo", "Circle", "Círculo");
      const open = A.el("button", "si-btn", T("○ Open", "○ Abierto"), {
        type: "button",
        "data-c": "0",
      });
      const closed = A.el("button", "si-btn", T("● Closed", "● Cerrado"), {
        type: "button",
        "data-c": "1",
      });
      open.dataset.en = "Open circle";
      open.dataset.es = "Círculo abierto";
      closed.dataset.en = "Closed circle";
      closed.dataset.es = "Círculo cerrado";
      cg.append(open, closed);
      const [w2, dg] = group(
        "Ray direction",
        "Dirección del rayo",
        "Ray direction",
        "Dirección del rayo",
      );
      const left = A.el("button", "si-btn", T("◀ Left", "◀ Izquierda"), {
        type: "button",
        "data-r": "left",
      });
      const right = A.el("button", "si-btn", T("Right ▶", "Derecha ▶"), {
        type: "button",
        "data-r": "right",
      });
      left.dataset.en = "Ray points left";
      left.dataset.es = "El rayo apunta a la izquierda";
      right.dataset.en = "Ray points right";
      right.dataset.es = "El rayo apunta a la derecha";
      dg.append(left, right);
      relabel.push(open, closed, left, right);
      pad = A.el("div", "si-pad");
      const pl = A.el("button", "si-btn", "←", { type: "button", "data-k": "left" });
      const pr = A.el("button", "si-btn", "→", { type: "button", "data-k": "right" });
      const pp = A.el("button", "si-btn", T("Set boundary", "Fijar límite"), {
        type: "button",
        "data-k": "place",
      });
      pl.dataset.en = "Move cursor left one tick";
      pl.dataset.es = "Mover el cursor una marca a la izquierda";
      pr.dataset.en = "Move cursor right one tick";
      pr.dataset.es = "Mover el cursor una marca a la derecha";
      pp.dataset.en = "Set the boundary at the cursor";
      pp.dataset.es = "Fijar el límite en el cursor";
      relabel.push(pl, pr, pp);
      pad.append(pl, pr, pp);
      const tip = A.el(
        "p",
        "si-cap",
        T(
          "1. Tap the number line to set the boundary.",
          "1. Toca la recta numérica para fijar el límite.",
        ),
      );
      const tip2 = A.el(
        "p",
        "si-cap",
        T("2. Choose the circle and the direction.", "2. Elige el círculo y la dirección."),
      );
      body.append(tip, lineEl, ...(solved ? [] : [pad]), tip2, w1, w2, preview);
      const help = A.el("p", "si-sr", "", { id: helpId });
      body.append(help);
      relabel.push({
        sync: () => {
          help.textContent = L(
            `The number line runs from ${mn(ln.min)} to ${mn(ln.max)}. Move the cursor, then press Enter to set the boundary.`,
            `La recta numérica va de ${mn(ln.min)} a ${mn(ln.max)}. Mueve el cursor y presiona Enter para fijar el límite.`,
          );
          lineEl.setAttribute("role", solved ? "img" : "application");
          lineEl.setAttribute("aria-describedby", helpId);
          lineEl.setAttribute(
            "aria-label",
            solved
              ? L(`Graph of ${spec.ineq.text}`, `Gráfica de ${spec.ineq.text}`)
              : L(
                  "Number line. Arrow keys move the cursor. Enter sets the boundary point.",
                  "Recta numérica. Las flechas mueven el cursor. Enter fija el punto límite.",
                ),
          );
        },
      });
      const syncG = () => {
        const g = solved ? spec.want : st;
        pressed(open, g.closed === false);
        pressed(closed, g.closed === true);
        pressed(left, g.dir === "left");
        pressed(right, g.dir === "right");
        for (const b of [open, closed, left, right]) b.disabled = solved;
        refresh();
      };
      cg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-c]");
        if (!b || solved) return;
        st.closed = b.dataset.c === "1";
        marks = null;
        emit();
        say(
          st.closed ? "Closed circle" : "Open circle",
          st.closed ? "Círculo cerrado" : "Círculo abierto",
        );
        syncG();
      });
      dg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-r]");
        if (!b || solved) return;
        st.dir = b.dataset.r;
        marks = null;
        emit();
        say(
          st.dir === "left" ? "Ray points left" : "Ray points right",
          st.dir === "left" ? "El rayo apunta a la izquierda" : "El rayo apunta a la derecha",
        );
        syncG();
      });
      const setBoundary = (/** @type {number} */ k) => {
        const v = valAt(k);
        marks = null;
        note.textContent = "";
        if (st.n !== null && near(st.n, v)) {
          st.n = null;
          say(`Boundary removed at ${mn(v)}`, `Límite quitado en ${mn(v)}`);
        } else {
          st.n = v;
          fresh = true;
          say(`Boundary set at ${mn(v)}`, `Límite fijado en ${mn(v)}`);
        }
        emit();
        refresh();
      };
      wireLine(setBoundary);
      relabel.push({ sync: syncG });
      syncG();
    } else {
      lineEl = A.el("div", "si-line ro", "", { role: "img" });
      const [w1, vg] = group(
        "Tap every solution",
        "Toca cada solución",
        "Numbers to test",
        "Números para probar",
      );
      const vals = spec.values.map((/** @type {any} */ v, /** @type {number} */ i) => {
        const b = A.el("button", "si-val", "", { type: "button", "data-i": String(i) });
        b.dataset.t = v.t;
        vg.append(b);
        return b;
      });
      body.append(w1, lineEl, preview.cloneNode(false));
      body.lastChild.remove();
      const syncT = () => {
        vals.forEach((b, i) => {
          const on = st.sel.includes(i);
          const mk = solved ? "ok" : marks && on ? (spec.want.includes(i) ? "ok" : "bad") : "";
          b.className = `si-val${mk ? ` ${mk}` : ""}`;
          b.innerHTML = `${mk ? `<span class="g">${mk === "ok" ? "✓" : "✕"}</span>` : ""}${b.dataset.t}`;
          pressed(b, on);
          b.disabled = solved;
          b.setAttribute(
            "aria-label",
            L(
              `${b.dataset.t}${on ? ", selected" : ""}`,
              `${b.dataset.t}${on ? ", seleccionado" : ""}`,
            ),
          );
        });
        lineEl.setAttribute(
          "aria-label",
          solved
            ? L(
                `Number line showing the solutions of ${spec.ineq.text}`,
                `Recta numérica con las soluciones de ${spec.ineq.text}`,
              )
            : L(
                `Number line with the numbers you picked: ${st.sel.map((/** @type {number} */ i) => spec.values[i].t).join(", ") || "none"}`,
                `Recta numérica con los números que elegiste: ${st.sel.map((/** @type {number} */ i) => spec.values[i].t).join(", ") || "ninguno"}`,
              ),
        );
        refresh();
      };
      vg.addEventListener("click", (e) => {
        const b = e.target.closest("[data-i]");
        if (!b || solved) return;
        const i = Number(b.dataset.i);
        const at = st.sel.indexOf(i);
        marks = null;
        if (at >= 0) st.sel.splice(at, 1);
        else st.sel.push(i);
        emit();
        say(
          `${spec.values[i].t} ${at >= 0 ? "unselected" : "selected"}`,
          `${spec.values[i].t} ${at >= 0 ? "no seleccionado" : "seleccionado"}`,
        );
        syncT();
      });
      relabel.push({ sync: syncT });
      syncT();
    }

    /* -- keyboard and pointer on the line (graph) -- */
    function wireLine(/** @type {(k:number)=>void} */ setBoundary) {
      if (solved) return;
      const kOf = (/** @type {any} */ ev) => {
        const r = lineEl.getBoundingClientRect();
        const px = ((ev.clientX - r.left - lineEl.clientLeft) * geo.W) / lineEl.clientWidth;
        return Math.max(0, Math.min(n, Math.round(((px - geo.ML) / geo.pw) * n)));
      };
      cur = Math.round(-ln.min / ln.step);
      const move = (/** @type {number} */ d) => {
        cur = Math.max(0, Math.min(n, cur + d));
        showCur = true;
        ghost = null;
        say(mn(valAt(cur)), mn(valAt(cur)));
        lineSvg();
      };
      lineEl.addEventListener("keydown", (/** @type {any} */ e) => {
        const d = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 }[e.key];
        if (d) {
          e.preventDefault();
          move(d);
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          cur = e.key === "Home" ? 0 : n;
          move(0);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setBoundary(cur);
        }
      });
      lineEl.addEventListener("focus", () => {
        showCur = true;
        lineSvg();
      });
      lineEl.addEventListener("pointerdown", (/** @type {any} */ e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        lineEl.focus({ preventScroll: true });
        down = e.pointerId;
        cur = kOf(e);
        ghost = valAt(cur);
        showCur = true;
        lineSvg();
      });
      lineEl.addEventListener("pointermove", (/** @type {any} */ e) => {
        if (down === null && e.pointerType !== "mouse") return;
        const k = kOf(e);
        if (ghost === null || !near(ghost, valAt(k))) {
          ghost = valAt(k);
          if (down !== null) cur = k;
          lineSvg();
        }
      });
      lineEl.addEventListener("pointerup", (/** @type {any} */ e) => {
        if (down === null) return;
        down = null;
        cur = kOf(e);
        ghost = e.pointerType === "mouse" ? valAt(cur) : null;
        setBoundary(cur);
      });
      const drop = () => {
        down = null;
        if (ghost !== null) {
          ghost = null;
          lineSvg();
        }
      };
      lineEl.addEventListener("pointercancel", drop);
      lineEl.addEventListener("pointerleave", drop);
      pad.addEventListener("click", (/** @type {any} */ e) => {
        const k = e.target.closest("[data-k]");
        if (!k) return;
        if (k.dataset.k === "place") setBoundary(cur);
        else move(k.dataset.k === "left" ? -1 : 1);
      });
      root.addEventListener("focusout", (/** @type {any} */ e) => {
        if (!root.contains(e.relatedTarget)) {
          showCur = false;
          lineSvg();
        }
      });
    }

    /* -- check, clear, labels -- */
    const labels = () => {
      for (const r of relabel) {
        if (r.sync) r.sync();
        else r.setAttribute("aria-label", L(r.dataset.en, r.dataset.es));
      }
      for (const g of root.querySelectorAll("[role=group]"))
        g.setAttribute("aria-label", L(g.dataset.en || "", g.dataset.es || ""));
    };
    function check() {
      if (solved) return;
      const state = JSON.parse(JSON.stringify(st));
      const out = api.submit && api.submit(state);
      if (!root.isConnected) return;
      const res =
        out && typeof out === "object" && typeof out.ok === "boolean"
          ? out
          : A.registry.ineq.grade(spec, state);
      if (res.ok) {
        solved = true;
        marks = null;
        root.classList.add("si-solved");
        bar.textContent = "";
        bar.append(badge);
        note.remove();
        pad && pad.remove();
        if (lineEl) lineEl.setAttribute("tabindex", "-1");
        say("Correct", "Correcto");
      } else {
        marks =
          mode === "test"
            ? st.sel.map((/** @type {number} */ i) => spec.want.includes(i))
            : mode === "graph"
              ? [false]
              : null;
        say(res.say || "Not yet", res.sayEs || res.say || "Todavía no");
      }
      labels();
    }
    checkBtn.addEventListener("click", check);
    clearBtn.addEventListener("click", () => {
      st =
        mode === "write"
          ? { v: null, op: null, n: null }
          : mode === "graph"
            ? { n: null, closed: null, dir: null }
            : { sel: [] };
      marks = null;
      emit();
      say("Cleared", "Borrado");
      labels();
    });
    pad && pad.setAttribute("hidden", "");
    const padVis = () => {
      if (pad)
        pad.hidden = !(
          geo.ts < 28 ||
          (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
        );
    };
    labels();
    padVis();
    if (lineEl && typeof ResizeObserver !== "undefined") {
      let last = lineEl.clientWidth;
      const ro = new ResizeObserver(() => {
        if (!root.isConnected) return ro.disconnect();
        if (Math.abs(lineEl.clientWidth - last) > 3) {
          last = lineEl.clientWidth;
          lineSvg();
          padVis();
        }
      });
      ro.observe(lineEl);
    }
    if (typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(() => {
        if (!root.isConnected) return mo.disconnect();
        labels();
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
  }

  A.register("ineq", {
    title: "Inequalities",
    titleEs: "Desigualdades",
    levels: 4,
    make(rng, level, params) {
      const mode = MODES.includes(params.mode) ? params.mode : rng.pick(MODES);
      const s = { write: mkWrite, graph: mkGraph, test: mkTest }[mode](rng, level, params);
      const model =
        mode === "write"
          ? { mode, want: s.want, vars: s.vars.map((/** @type {any} */ v) => v.v) }
          : mode === "graph"
            ? { mode, ineq: s.ineq, want: s.want }
            : { mode, ineq: s.ineq, values: s.values.map((/** @type {any} */ v) => v.t) };
      return { ...s, mode, model };
    },
    solution(spec) {
      if (spec.mode === "write") return { ...spec.want };
      if (spec.mode === "graph") return { ...spec.want };
      return { sel: spec.want.slice() };
    },
    wrong(spec, rng) {
      return { write: wrongWrite, graph: wrongGraph, test: wrongTest }[spec.mode](spec, rng);
    },
    grade(spec, state) {
      return { write: gradeWrite, graph: gradeGraph, test: gradeTest }[spec.mode](spec, state);
    },
    mount: mountIneq,
  });
})();

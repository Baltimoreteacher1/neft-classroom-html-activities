/**
 * Practice Studio activity: sizer (window.StudioAct kind "sizer").
 * Resize a figure with sliders and steppers until its measure (area, volume or surface area) meets the goal.
 * Params: shape "para"|"tri"|"trap"|"lshape"|"prism", goal "area"|"volume"|"surface".
 * State is { d: { <free dimension>: number } }. grade() checks the MEASURE and every stated rule, never one pair.
 * The readout shows the formula with the student's own numbers and never the goal. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const num = (/** @type {number} */ n) => G.fmt(n, 4);
  const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1e-9;
  const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** "1 unit" / "2.5 units" and the Spanish pair */
  const un = (/** @type {number} */ v) => [
    `${num(v)} ${v === 1 ? "unit" : "units"}`,
    `${num(v)} ${v === 1 ? "unidad" : "unidades"}`,
  ];
  const SHAPES = ["para", "tri", "trap", "lshape", "prism"];

  /** dimension key -> [English, Spanish, symbol, Spanish article] */
  const DIMS = /** @type {Record<string, Record<string, string[]>>} */ ({
    para: { b: ["base", "base", "b", "la"], h: ["height", "altura", "h", "la"] },
    tri: { b: ["base", "base", "b", "la"], h: ["height", "altura", "h", "la"] },
    trap: {
      b1: ["top base", "base superior", "b₁", "la"],
      b2: ["bottom base", "base inferior", "b₂", "la"],
      h: ["height", "altura", "h", "la"],
    },
    lshape: {
      w: ["width", "ancho", "w", "el"],
      h: ["height", "alto", "h", "el"],
      a: ["cut width", "ancho del corte", "a", "el"],
      c: ["cut height", "alto del corte", "c", "el"],
    },
    prism: {
      l: ["length", "largo", "l", "el"],
      w: ["width", "ancho", "w", "el"],
      h: ["height", "alto", "h", "el"],
    },
  });
  /** slider limits [low, high] per shape and dimension */
  const RANGE = /** @type {Record<string, Record<string, number[]>>} */ ({
    para: { b: [1, 10], h: [1, 9] },
    tri: { b: [1, 10], h: [1, 9] },
    trap: { b1: [1, 10], b2: [1, 10], h: [1, 9] },
    lshape: { w: [3, 10], h: [3, 9], a: [1, 9], c: [1, 8] },
    prism: { l: [1, 8], w: [1, 8], h: [1, 8] },
  });
  /** which dimensions the student may free: [one free option, two free options] */
  const FREE = /** @type {Record<string, string[][][]>} */ ({
    para: [[["b"], ["h"]], [["b", "h"]]],
    tri: [[["b"], ["h"]], [["b", "h"]]],
    trap: [
      [["h"], ["b2"], ["b1"]],
      [
        ["b1", "b2"],
        ["b1", "h"],
        ["b2", "h"],
      ],
    ],
    lshape: [
      [["c"], ["a"], ["h"], ["w"]],
      [
        ["a", "c"],
        ["w", "h"],
      ],
    ],
    prism: [
      [["h"], ["l"]],
      [
        ["l", "h"],
        ["w", "h"],
        ["l", "w"],
      ],
    ],
  });
  const SHAPE_TXT = /** @type {Record<string, string[]>} */ ({
    para: ["a parallelogram", "paralelogramo"],
    tri: ["a triangle", "triángulo"],
    trap: ["a trapezoid", "trapecio"],
    lshape: ["an L", "L"],
    prism: ["a rectangular prism", "prisma rectangular"],
  });
  const CTX = /** @type {Record<string, string[][]>} */ ({
    para: [
      ["a banner", "una pancarta"],
      ["a garden bed", "un cantero"],
      ["a quilt patch", "un parche de colcha"],
      ["a window sticker", "una calcomanía de ventana"],
      ["a flag", "una bandera"],
      ["a ramp sign", "un letrero de rampa"],
    ],
    tri: [
      ["a sail", "una vela"],
      ["a pennant", "un banderín"],
      ["a roof panel", "un panel de techo"],
      ["a tent flap", "una solapa de carpa"],
      ["a warning sign", "una señal de advertencia"],
      ["a garden corner", "un rincón de jardín"],
    ],
    trap: [
      ["a window", "una ventana"],
      ["a table top", "una mesa"],
      ["a bridge deck", "una plataforma de puente"],
      ["a planter", "una jardinera"],
      ["a stage", "un escenario"],
      ["a lamp panel", "un panel de lámpara"],
    ],
    lshape: [
      ["a patio", "un patio"],
      ["a classroom floor", "el piso de un salón"],
      ["a garden", "un jardín"],
      ["a play area", "un área de juego"],
      ["a hallway", "un pasillo"],
      ["a rug", "una alfombra"],
    ],
    prism: [
      ["a box", "una caja"],
      ["a fish tank", "un acuario"],
      ["a crate", "un cajón"],
      ["a locker", "un casillero"],
      ["a toy chest", "un cofre de juguetes"],
      ["a gift box", "una caja de regalo"],
      ["a storage bin", "un contenedor"],
    ],
  });
  const MEAS = /** @type {Record<string, string[]>} */ ({
    area: ["area", "área", "an"],
    volume: ["volume", "volumen", "a"],
    surface: ["surface area", "área de superficie", "a"],
  });
  const UNIT = /** @type {Record<string, string[]>} */ ({
    area: ["square units", "unidades cuadradas"],
    volume: ["cubic units", "unidades cúbicas"],
    surface: ["square units", "unidades cuadradas"],
  });

  /* ---- measure and rules ---------------------------------------------------------------------- */
  function measure(/** @type {any} */ m, /** @type {any} */ d) {
    if (m.shape === "para") return d.b * d.h;
    if (m.shape === "tri") return (d.b * d.h) / 2;
    if (m.shape === "trap") return ((d.b1 + d.b2) * d.h) / 2;
    if (m.shape === "lshape") return d.w * d.h - d.a * d.c;
    if (m.goal === "surface") return 2 * (d.l * d.w + d.l * d.h + d.w * d.h);
    return d.l * d.w * d.h;
  }
  function holds(/** @type {any} */ c, /** @type {any} */ d) {
    if (c.k === "cube") return near(d.l, d.w) && near(d.w, d.h);
    if (c.k === "gt") return d[c.a] > d[c.c] + 1e-9;
    if (c.k === "lt") return d[c.a] < d[c.c] - 1e-9;
    return near(d[c.a], c.m * d[c.c] + c.d);
  }
  /** a rule as a lower-case clause: [English, Spanish] */
  function condPhrase(/** @type {string} */ shape, /** @type {any} */ c) {
    if (c.k === "cube") return ["all the edges are equal", "todas las aristas son iguales"];
    const a = DIMS[shape][c.a];
    const b = DIMS[shape][c.c];
    const ea = `the ${a[0]}`;
    const eb = `the ${b[0]}`;
    const sa = `${a[3]} ${a[1]}`;
    const sb = `${b[3]} ${b[1]}`;
    const al = b[3] === "el" ? `al ${b[1]}` : `a la ${b[1]}`;
    const del = b[3] === "el" ? `del ${b[1]}` : `de la ${b[1]}`;
    if (c.k === "gt") return [`${ea} is longer than ${eb}`, `${sa} es mayor que ${sb}`];
    if (c.k === "lt") return [`${ea} is shorter than ${eb}`, `${sa} es menor que ${sb}`];
    if (c.m === 1 && c.d === 0) return [`${ea} is equal to ${eb}`, `${sa} es igual ${al}`];
    if (c.m === 2) return [`${ea} is twice ${eb}`, `${sa} es el doble ${del}`];
    if (c.m === 3) return [`${ea} is three times ${eb}`, `${sa} es el triple ${del}`];
    return [`${ea} is ${un(c.d)[0]} longer than ${eb}`, `${sa} mide ${un(c.d)[1]} más que ${sb}`];
  }

  /* ---- planning a task ------------------------------------------------------------------------ */
  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ p) {
    let shape = SHAPES.includes(p.shape) ? p.shape : "";
    let goal = p.goal;
    // p.whole: whole-number edges at every level (lesson 5-5). p.frac: half-unit edges from level 2 (lesson 5-10).
    const sl = p.whole ? 2 : p.frac ? Math.max(level, 3) : level;
    if (!shape) shape = goal === "volume" || goal === "surface" ? "prism" : rng.pick(SHAPES);
    if (shape === "prism")
      goal = goal === "surface" || goal === "volume" ? goal : rng.pick(["volume", "surface"]);
    else goal = "area";
    const R = RANGE[shape];
    const keys = Object.keys(DIMS[shape]);
    const gap = sl <= 2 ? 1 : 0.5;
    const vlo = sl <= 2 ? 2 : 2.5;
    const pool = (/** @type {string} */ k, /** @type {boolean} */ free) => {
      const st = sl <= 2 ? 1 : sl === 3 || free ? 0.5 : 0.25;
      const lo =
        shape === "lshape" && (k === "w" || k === "h")
          ? R[k][0] + 1
          : k === "a" || k === "c"
            ? 1
            : vlo;
      /** @type {number[]} */
      const out = [];
      for (let v = lo; v <= R[k][1] + 1e-9; v += st) out.push(Math.round(v * 100) / 100);
      return out;
    };
    const [one, two] = FREE[shape];
    for (let t = 0; t < 800; t++) {
      const cube = shape === "prism" && level === 4 && rng.chance(0.3);
      const free = cube
        ? ["l", "w", "h"]
        : level === 1
          ? rng.pick(one)
          : level === 2 || level === 4
            ? rng.pick(two)
            : rng.pick(rng.chance(0.5) ? one : two);
      /** @type {Record<string, number>} */
      const sol = {};
      for (const k of keys) sol[k] = rng.pick(pool(k, free.includes(k)));
      /** @type {any[]} */
      let conds = [];
      if (cube) {
        const e = rng.pick(goal === "surface" ? [1.5, 2, 2.5, 3, 3.5, 4, 5] : [2, 3, 4, 5]);
        sol.l = sol.w = sol.h = e;
        conds = [{ k: "cube" }];
      } else if (level === 4) {
        const [x, y] = rng.chance(0.5) ? free : free.slice().reverse();
        const rel = rng.pick([
          { m: 1, d: 0 },
          { m: 2, d: 0 },
          { m: 3, d: 0 },
          { m: 1, d: 1 },
          { m: 1, d: 2 },
          { m: 1, d: 3 },
        ]);
        sol[y] = rng.pick(pool(y, true));
        sol[x] = rel.m * sol[y] + rel.d;
        conds = [{ k: "eq", a: x, c: y, m: rel.m, d: rel.d }];
      } else if (
        free.length === 2 &&
        rng.chance(level === 2 ? 0.55 : 0.3) &&
        !near(sol[free[0]], sol[free[1]])
      ) {
        const [x, y] = free;
        conds = [{ k: sol[x] > sol[y] ? "gt" : "lt", a: x, c: y }];
      }
      if (keys.some((k) => sol[k] < R[k][0] || sol[k] > R[k][1] + 1e-9)) continue;
      if (p.frac && !keys.some((k) => sol[k] % 1 !== 0)) continue; // 5-10: the answer needs a fractional edge
      if (shape === "lshape" && (sol.a > sol.w - gap || sol.c > sol.h - gap)) continue;
      const model = { shape, goal };
      const target = measure(model, sol);
      const unit = sl <= 2 ? 1 : sl === 3 ? 2 : 4;
      if (Math.abs(target * unit - Math.round(target * unit)) > 1e-9 || target > 300) continue;
      if (conds.some((c) => !holds(c, sol))) continue;
      /** @type {Record<string, any>} */
      const dim = {};
      const lo = (/** @type {string} */ k) => (sl <= 2 ? R[k][0] : Math.min(R[k][0], 0.5));
      const step = sl <= 2 ? 1 : sl === 3 ? 0.5 : 0.25;
      let roomy = true;
      for (const k of keys) {
        if (!free.includes(k)) {
          dim[k] = { v: sol[k] };
          continue;
        }
        let low = lo(k);
        let high = Math.min(R[k][1], Math.max(6, Math.ceil(sol[k] * 1.5) + 1));
        if (shape === "lshape") {
          if (k === "a") high = sol.w - gap;
          if (k === "c") high = sol.h - gap;
          if (k === "w") low = sol.a + gap;
          if (k === "h") low = sol.c + gap;
        }
        // a slider needs room to explore, and no answer may sit on an end stop
        if ((high - low) / step < 5 || sol[k] <= low + 1e-9 || sol[k] >= high - 1e-9) roomy = false;
        const s0 = low + Math.round(((high - low) * rng.pick([0.15, 0.25, 0.35])) / step) * step;
        dim[k] = { lo: low, hi: high, start: s0 };
      }
      if (!roomy) continue;
      const m = {
        shape,
        goal,
        target,
        step,
        free,
        order: keys,
        dim,
        conds,
        sol: Object.fromEntries(free.map((k) => [k, sol[k]])),
        ctx: rng.int(0, CTX[shape].length - 1),
        guide: level <= 2,
      };
      // the starting figure must not already solve the task
      for (let g = 0; g < 40 && isSolved(m, { d: {} }); g++) {
        const k = free[0];
        dim[k].start = Math.min(dim[k].hi, dim[k].start + step);
        if (dim[k].start >= dim[k].hi) dim[k].start = dim[k].lo;
      }
      if (isSolved(m, { d: {} })) continue;
      return pack(m, level);
    }
    throw new Error(`sizer: no plan for ${shape}/${goal}/L${level}`);
  }

  /* ---- words ---------------------------------------------------------------------------------- */
  function fixedClauses(/** @type {any} */ m) {
    /** @type {string[][]} */
    const out = [];
    for (const k of m.order) {
      if (m.dim[k].v === undefined) continue;
      const n = DIMS[m.shape][k];
      out.push([
        `the ${n[0]} is ${un(m.dim[k].v)[0]}`,
        `${n[3]} ${n[1]} mide ${un(m.dim[k].v)[1]}`,
      ]);
    }
    return out;
  }
  function pack(/** @type {any} */ m, /** @type {number} */ level) {
    const ctx = CTX[m.shape][m.ctx];
    const meas = MEAS[m.goal];
    const unit = UNIT[m.goal];
    const t = num(m.target);
    const goalEn = `${meas[2]} ${meas[0]} of ${t} ${unit[0]}`;
    const goalEs = `un ${meas[1]} de ${t} ${unit[1]}`;
    const rules = fixedClauses(m).concat(
      m.conds.map((/** @type {any} */ c) => condPhrase(m.shape, c)),
    );
    const q = `Build ${ctx[0]} shaped like ${SHAPE_TXT[m.shape][0]}, with ${goalEn}.${rules.length ? ` Rules: ${rules.map((r) => r[0]).join("; ")}.` : ""}`;
    const qEs = `Construye ${ctx[1]} con forma de ${SHAPE_TXT[m.shape][1]}, con ${goalEs}.${rules.length ? ` Reglas: ${rules.map((r) => r[1]).join("; ")}.` : ""}`;
    const sol = m.sol;
    const one = m.free.length === 1;
    const d = dimsOf(m, { d: sol });
    const f = (/** @type {string} */ k) => num(d[k]);
    const nmE = (/** @type {string} */ k) => DIMS[m.shape][k][0];
    const nmS = (/** @type {string} */ k) => DIMS[m.shape][k][1];
    const kf = m.free[0];
    const kx =
      m.order.find((/** @type {string} */ k) => !m.free.includes(k) && k !== "h") || m.order[0];
    const dbl = num(m.target * 2);
    /** @type {string[][]} */
    let hs;
    /** @type {string[]} */
    let x;
    if (m.shape === "para" || m.shape === "tri") {
      const tri = m.shape === "tri";
      const full = tri ? dbl : t;
      hs = [
        tri
          ? [
              "A triangle is half of a parallelogram with the same base and height. A = ½ × base × height.",
              "Un triángulo es la mitad de un paralelogramo con la misma base y altura. A = ½ × base × altura.",
            ]
          : [
              "Area of a parallelogram = base × height. The height is the dashed line, not the slanted side.",
              "Área de un paralelogramo = base × altura. La altura es la línea de rayas, no el lado inclinado.",
            ],
        one
          ? [
              `${tri ? "First think about the whole parallelogram: its area is double the goal. " : ""}You know one side. Ask: what number times it gives ${full}?`,
              `${tri ? "Primero piensa en el paralelogramo completo: su área es el doble de la meta. " : ""}Ya conoces un lado. Pregunta: ¿qué número multiplicado por él da ${full}?`,
            ]
          : [
              `Many pairs work. Pick a base you like, then find the height so that base × height = ${full}.`,
              `Hay muchas parejas. Elige una base y busca la altura para que base × altura = ${full}.`,
            ],
        one
          ? [
              `Divide ${full} by the ${nmE(kx)} (${f(kx)}).`,
              `Divide ${full} entre ${DIMS[m.shape][kx][3]} ${nmS(kx)} (${f(kx)}).`,
            ]
          : m.conds.length
            ? [
                "Use the extra rule to link the two sides, then test small values with the sliders.",
                "Usa la regla extra para unir los dos lados y prueba valores pequeños con los controles.",
              ]
            : [
                `Try a base that divides ${full} evenly, then divide to find the height.`,
                `Prueba una base que divida ${full} exactamente y luego divide para hallar la altura.`,
              ],
      ];
      const sym = tri ? `½ × ${f("b")} × ${f("h")}` : `${f("b")} × ${f("h")}`;
      x = [
        `${sym} = ${t}. ${tri ? "A triangle is half of base × height." : "Area is base × height; the slanted side does not matter."}${one ? "" : ` Other pairs also work, as long as base × height is ${full}.`}`,
        `${sym} = ${t}. ${tri ? "Un triángulo es la mitad de base × altura." : "El área es base × altura; el lado inclinado no importa."}${one ? "" : ` Otras parejas también sirven, mientras base × altura sea ${full}.`}`,
      ];
    } else if (m.shape === "trap") {
      hs = [
        [
          "Area of a trapezoid = ½ × (top base + bottom base) × height. Add the bases first.",
          "Área de un trapecio = ½ × (base superior + base inferior) × altura. Suma primero las bases.",
        ],
        [
          `Remove the half: (top base + bottom base) × height must make ${dbl}.`,
          `Quita la mitad: (base superior + base inferior) × altura debe dar ${dbl}.`,
        ],
        one
          ? [
              `Work out what the missing number must be: ${dbl} is the product of the sum of the bases and the height.`,
              `Calcula el número que falta: ${dbl} es el producto de la suma de las bases y la altura.`,
            ]
          : [
              `Only the SUM of the bases matters. Find the sum first (${dbl} ÷ height), then split it.`,
              `Solo importa la SUMA de las bases. Halla primero la suma (${dbl} ÷ altura) y luego divídela.`,
            ],
      ];
      x = [
        `½ × (${f("b1")} + ${f("b2")}) × ${f("h")} = ${t}. Add the bases, multiply by the height, then take half.${one ? "" : " Only the sum of the bases matters."}`,
        `½ × (${f("b1")} + ${f("b2")}) × ${f("h")} = ${t}. Suma las bases, multiplica por la altura y toma la mitad.${one ? "" : " Solo importa la suma de las bases."}`,
      ];
    } else if (m.shape === "lshape") {
      const whole = num(d.w * d.h);
      hs = [
        [
          "Use the whole rectangle minus the corner that was cut out (or add the two pieces).",
          "Usa el rectángulo completo menos la esquina recortada (o suma las dos piezas).",
        ],
        [
          `The whole rectangle is its width × its height. The cut corner is cut width × cut height.`,
          "El rectángulo completo es su ancho × su alto. La esquina recortada es ancho del corte × alto del corte.",
        ],
        [
          `Ask: how much area must the corner take away? Compare the whole rectangle with the goal.`,
          "Pregunta: ¿cuánta área debe quitar la esquina? Compara el rectángulo completo con la meta.",
        ],
      ];
      x = [
        `${f("w")} × ${f("h")} − ${f("a")} × ${f("c")} = ${whole} − ${num(d.a * d.c)} = ${t}. Whole rectangle, minus the corner.`,
        `${f("w")} × ${f("h")} − ${f("a")} × ${f("c")} = ${whole} − ${num(d.a * d.c)} = ${t}. Rectángulo completo menos la esquina.`,
      ];
    } else if (m.goal === "volume") {
      hs = [
        [
          "Volume = base area × height. Think of stacked layers of cubes.",
          "Volumen = área de la base × altura. Piensa en capas de cubos apiladas.",
        ],
        [
          "One layer holds length × width cubes. The volume is the layers added up.",
          "Una capa tiene largo × ancho cubos. El volumen es la suma de las capas.",
        ],
        one
          ? [
              `Find the cubes in one layer or the other known edges first, then divide ${t} by that.`,
              `Halla primero los cubos de una capa o las otras aristas y luego divide ${t} entre eso.`,
            ]
          : m.conds.length
            ? [
                "Use the extra rule to link two edges, then test with the sliders.",
                "Usa la regla extra para unir dos aristas y prueba con los controles.",
              ]
            : [
                `Pick one edge, then find the other so the three edges multiply to ${t}.`,
                `Elige una arista y halla la otra para que las tres aristas multipliquen ${t}.`,
              ],
      ];
      x = [
        `${f("l")} × ${f("w")} × ${f("h")} = ${t}. One layer has ${num(d.l * d.w)} cubes and ${f("h")} layers stack to the volume.`,
        `${f("l")} × ${f("w")} × ${f("h")} = ${t}. Una capa tiene ${num(d.l * d.w)} cubos y ${f("h")} capas se apilan en el volumen.`,
      ];
    } else {
      hs = [
        [
          "Surface area = the area of all six faces. They come in three matching pairs.",
          "Área de superficie = el área de las seis caras. Vienen en tres pares iguales.",
        ],
        [
          "SA = 2(l × w) + 2(l × h) + 2(w × h). Watch the three pairs change as you resize.",
          "AS = 2(l × w) + 2(l × h) + 2(w × h). Mira cómo cambian los tres pares al cambiar el tamaño.",
        ],
        m.conds.some((/** @type {any} */ c) => c.k === "cube")
          ? [
              "In a cube all six faces match, so surface area = 6 × one face.",
              "En un cubo las seis caras son iguales, así que área de superficie = 6 × una cara.",
            ]
          : [
              "Take away the top and bottom pair first. What is left must come from the four side faces.",
              "Quita primero el par de arriba y abajo. Lo que queda viene de las cuatro caras laterales.",
            ],
      ];
      x = [
        `2(${num(d.l * d.w)}) + 2(${num(d.l * d.h)}) + 2(${num(d.w * d.h)}) = ${t}. Add the three pairs of matching faces.`,
        `2(${num(d.l * d.w)}) + 2(${num(d.l * d.h)}) + 2(${num(d.w * d.h)}) = ${t}. Suma los tres pares de caras iguales.`,
      ];
    }
    return {
      q,
      qEs,
      x: x[0],
      xEs: x[1],
      h: hs.map((r) => r[0]),
      hEs: hs.map((r) => r[1]),
      model: m,
      level,
      kf,
    };
  }

  /* ---- state -> numbers ----------------------------------------------------------------------- */
  function dimsOf(/** @type {any} */ m, /** @type {any} */ st) {
    /** @type {Record<string, number>} */
    const d = {};
    for (const k of m.order) {
      const s = m.dim[k];
      if (s.v !== undefined) {
        d[k] = s.v;
        continue;
      }
      const raw = st && st.d && st.d[k] !== undefined ? Number(st.d[k]) : s.start;
      const v = Number.isFinite(raw) ? raw : s.start;
      d[k] = Math.min(s.hi, Math.max(s.lo, s.lo + Math.round((v - s.lo) / m.step) * m.step));
    }
    return d;
  }
  function isSolved(/** @type {any} */ m, /** @type {any} */ st) {
    const d = dimsOf(m, st);
    return near(measure(m, d), m.target) && m.conds.every((/** @type {any} */ c) => holds(c, d));
  }

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const d = dimsOf(m, st);
    const v = measure(m, d);
    const bad = m.conds.find((/** @type {any} */ c) => !holds(c, d));
    if (near(v, m.target) && !bad) return { ok: true };
    const meas = MEAS[m.goal];
    const unit = UNIT[m.goal];
    const moved = m.free.some((/** @type {string} */ k) => !near(d[k], m.dim[k].start));
    const half = (m.shape === "tri" || m.shape === "trap") && near(v * 2, m.target);
    const added = (m.shape === "para" || m.shape === "tri") && near(d.b + d.h, m.target);
    const sums = m.shape === "prism" && m.goal === "volume" && near(d.l + d.w + d.h, m.target);
    /** @type {string[]} */
    let t;
    let tag;
    if (!moved) {
      tag = "untouched";
      t = [
        "Resize the figure first, then press Check.",
        "Primero cambia el tamaño de la figura y luego toca Comprobar.",
      ];
    } else if (!near(v, m.target) && half) {
      tag = "forgot-half";
      t =
        m.shape === "tri"
          ? [
              `Your triangle has only half the area you need. A triangle is HALF of base × height, so base × height must be twice the goal.`,
              "Tu triángulo tiene solo la mitad del área que necesitas. Un triángulo es la MITAD de base × altura, así que base × altura debe ser el doble de la meta.",
            ]
          : [
              `Your trapezoid has only half the area you need. The formula takes half of (b₁ + b₂) × h, so that product must be twice the goal.`,
              "Tu trapecio tiene solo la mitad del área que necesitas. La fórmula toma la mitad de (b₁ + b₂) × h, así que ese producto debe ser el doble de la meta.",
            ];
    } else if (!near(v, m.target) && (added || sums)) {
      tag = "added";
      t = sums
        ? [
            "You added the edges. Volume counts cubes, so multiply length × width × height.",
            "Sumaste las aristas. El volumen cuenta cubos, así que multiplica largo × ancho × alto.",
          ]
        : [
            "You added the base and height. Area counts square units, so multiply the base by the height.",
            "Sumaste la base y la altura. El área cuenta unidades cuadradas, así que multiplica la base por la altura.",
          ];
    } else if (!near(v, m.target)) {
      tag = v > m.target ? "too-big" : "too-small";
      const big = v > m.target;
      t = [
        `Your ${meas[0]} is ${num(v)} ${unit[0]}. That is ${big ? "more" : "less"} than the goal. ${big ? "Shrink" : "Grow"} the figure and check again.`,
        `Tu ${meas[1]} es ${num(v)} ${unit[1]}. Es ${big ? "mayor" : "menor"} que la meta. ${big ? "Reduce" : "Agranda"} la figura y comprueba otra vez.`,
      ];
    } else {
      tag = "rule";
      const r = condPhrase(m.shape, bad);
      t = [
        `The ${meas[0]} is right, but a rule is not met: ${r[0]}.`,
        `${cap(DIMS_ARTICLE(meas[1]))} es correcto, pero no se cumple una regla: ${r[1]}.`,
      ];
    }
    return { ok: false, tag, say: t[0], sayEs: t[1] };
  }
  /** "área" -> "el área"; "volumen" -> "el volumen" */
  function DIMS_ARTICLE(/** @type {string} */ s) {
    return `el ${s}`;
  }

  function wrong(/** @type {any} */ spec, /** @type {any} */ rng) {
    const m = spec.model;
    const sol = m.sol;
    /** @type {any[]} */
    const cand = [];
    const add = (/** @type {Record<string, number>} */ o) => cand.push({ d: o });
    add(Object.fromEntries(m.free.map((/** @type {string} */ k) => [k, m.dim[k].start])));
    for (const k of m.free) {
      const s = m.dim[k];
      const up = Math.min(s.hi, sol[k] + m.step);
      add({ ...sol, [k]: up === sol[k] ? Math.max(s.lo, sol[k] - m.step) : up });
      add({ ...sol, [k]: Math.max(s.lo, Math.min(s.hi, sol[k] * 2)) });
    }
    add(Object.fromEntries(m.free.map((/** @type {string} */ k) => [k, m.dim[k].hi])));
    add(Object.fromEntries(m.free.map((/** @type {string} */ k) => [k, m.dim[k].lo])));
    if (m.free.length === 2) add({ [m.free[0]]: sol[m.free[1]], [m.free[1]]: sol[m.free[0]] });
    if (m.shape === "tri" || m.shape === "trap")
      add({ ...sol, [m.free[0]]: Math.max(m.dim[m.free[0]].lo, sol[m.free[0]] / 2) });
    const seen = new Set();
    const out = cand.filter((st) => {
      const key = JSON.stringify(dimsOf(m, st));
      if (seen.has(key) || grade(spec, st).ok) return false;
      seen.add(key);
      return true;
    });
    return rng.shuffle(out).slice(0, 4);
  }

  /* ---- the widget ----------------------------------------------------------------------------- */
  const CSS = `
.sz{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;max-width:720px;color:var(--ink,#1B2733);container-type:inline-size}
.sz-goal{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.sz-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;border:2px solid var(--brand-line,#BBCADA);background:var(--brand-tint,#E5ECF3);color:var(--ink,#1B2733);font-weight:700;font-size:.92rem}
.sz-chip.goal{border-color:var(--brand,#2C4A68);font-weight:800}
.sz-chip .es-text{margin:0;font-size:.85em;font-weight:600}
.sz-main{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
.sz-main>*,.sz-ctl>*,.sz-sl>*,.sz-left{min-width:0}
.sz-stage{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:8px;display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
.sz-fig svg{display:block;width:100%;height:auto;max-height:340px}
.sz-g{stroke:var(--border,#D5DCE5);stroke-width:1;opacity:.75}
.sz-sh{fill:color-mix(in srgb,var(--brand,#2C4A68) 22%,transparent);stroke:var(--brand,#2C4A68);stroke-width:3;stroke-linejoin:round}
.sz-done .sz-sh{fill:color-mix(in srgb,var(--ok,#0A7D4B) 22%,transparent);stroke:var(--ok,#0A7D4B)}
.sz-gh{fill:none;stroke:var(--ink,#1B2733);stroke-width:2;stroke-dasharray:5 4}
.sz-mv{fill:color-mix(in srgb,var(--sun,#F0BD4F) 65%,transparent);stroke:var(--ink,#1B2733);stroke-width:1.5}
.sz-gh2{fill:color-mix(in srgb,var(--sun,#F0BD4F) 32%,transparent);stroke:var(--ink,#1B2733);stroke-width:1.5;stroke-dasharray:4 3}
.sz-fa{fill:color-mix(in srgb,var(--sun,#F0BD4F) 50%,transparent);stroke:var(--brand,#2C4A68);stroke-width:1.5}
.sz-fb2{fill:color-mix(in srgb,var(--brand,#2C4A68) 25%,transparent);stroke:var(--brand,#2C4A68);stroke-width:1.5}
.sz-fc{fill:color-mix(in srgb,var(--ok,#0A7D4B) 28%,transparent);stroke:var(--brand,#2C4A68);stroke-width:1.5}
.sz-ht{stroke:var(--ink,#1B2733);stroke-width:2.5;stroke-dasharray:6 4;fill:none}
.sz-ra{fill:none;stroke:var(--ink,#1B2733);stroke-width:2}
.sz-ln{stroke:var(--brand,#2C4A68);stroke-width:1.3;opacity:.8}
.sz-lab rect{fill:var(--surface,#fff);stroke:var(--brand,#2C4A68);stroke-width:1.5}
.sz-lab text{fill:var(--ink,#1B2733);font:700 12px system-ui,sans-serif}
.sz-lab.fr rect{fill:var(--brand,#2C4A68)}
.sz-lab.fr text{fill:var(--surface,#fff)}
.sz-tx{fill:var(--ink,#1B2733);font:700 11px system-ui,sans-serif;text-anchor:middle;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:3px}
.sz-tools{display:flex;flex-wrap:wrap;gap:8px}
.sz-btn{appearance:none;font:inherit;font-weight:800;min-height:48px;min-width:48px;padding:6px 16px;border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--brand,#2C4A68);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}
.sz-btn:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.sz-btn[aria-pressed=true]{background:var(--brand-tint,#E5ECF3);border-color:var(--ink,#1B2733);box-shadow:inset 0 0 0 2px var(--sun,#F0BD4F)}
.sz-btn.go{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.sz-btn[disabled]{opacity:.5;cursor:not-allowed}
.sz-btn[hidden]{display:none}
.sz-btn .es-text{color:inherit;font-size:.75em;margin:0;font-weight:600}
.sz-btn:focus-visible,.sz input:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.sz-ctl,.sz-left{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.sz-row{display:grid;gap:4px;background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:8px 10px}
.sz-row.fx{background:var(--brand-tint,#E5ECF3);border-style:dashed}
.sz-nm{display:flex;align-items:center;gap:8px;font-weight:800;flex-wrap:wrap}
.sz-nm .es-text{margin:0;font-size:.85em;font-weight:600}
.sz-sym{display:inline-grid;place-items:center;min-width:30px;height:30px;padding:0 6px;border-radius:999px;background:var(--brand,#2C4A68);color:var(--surface,#fff);font-weight:800}
.sz-fx .sz-sym{background:var(--surface,#fff);color:var(--ink,#1B2733);border:2px solid var(--brand,#2C4A68)}
.sz-val{margin-left:auto;font-size:1.35rem;font-weight:800;font-variant-numeric:tabular-nums;color:var(--brand,#2C4A68)}
.sz-sl{display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center}
.sz input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:48px;background:transparent;margin:0;cursor:pointer;--p:50%}
.sz input[type=range]::-webkit-slider-runnable-track{height:12px;border-radius:6px;border:2px solid var(--brand,#2C4A68);background:linear-gradient(to right,var(--brand,#2C4A68) var(--p),var(--surface,#fff) var(--p))}
.sz input[type=range]::-moz-range-track{height:8px;border-radius:6px;border:2px solid var(--brand,#2C4A68);background:var(--surface,#fff)}
.sz input[type=range]::-moz-range-progress{height:8px;border-radius:6px;background:var(--brand,#2C4A68)}
.sz input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:32px;height:32px;margin-top:-12px;border-radius:50%;background:var(--sun,#F0BD4F);border:3px solid var(--ink,#1B2733)}
.sz input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:var(--sun,#F0BD4F);border:3px solid var(--ink,#1B2733)}
.sz input[type=range][disabled]{cursor:default;opacity:.7}
.sz-read{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px 12px;display:grid;gap:4px}
.sz-line{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;font-size:1.02rem}
.sz-line b{font-variant-numeric:tabular-nums}
.sz-line small{color:var(--brand,#2C4A68);font-weight:700}
.sz-line .es-text{margin:0;font-size:.82em}
.sz-res{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline;border-top:2px dashed var(--brand-line,#BBCADA);padding-top:6px;font-weight:800}
.sz-res b{font-size:1.8rem;color:var(--brand,#2C4A68);font-variant-numeric:tabular-nums}
.sz-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.sz-fb{flex:1 1 220px;margin:0;padding:8px 12px 8px 44px;border-radius:var(--radius-md,14px);font-weight:700;position:relative;border:2px solid var(--bad,#B42318);background:color-mix(in srgb,var(--bad,#B42318) 12%,var(--surface,#fff))}
.sz-fb::before{content:"!";position:absolute;left:10px;top:8px;width:26px;height:26px;border-radius:50%;background:var(--bad,#B42318);color:#fff;font-weight:800;text-align:center;line-height:26px}
.sz-fb.ok{border-color:var(--ok,#0A7D4B);background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff))}
.sz-fb.ok::before{content:"\\2713";background:var(--ok,#0A7D4B)}
.sz-fb[hidden]{display:none}
.sz-fb .es-text{color:inherit;font-weight:600;margin-top:2px}
@container (min-width:600px){.sz-main{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:start}}
@media (prefers-reduced-motion:no-preference){.sz-fb{animation:sz-pop .2s ease-out}@keyframes sz-pop{from{transform:scale(.97);opacity:.3}to{transform:none;opacity:1}}}
@media (forced-colors:active){.sz-sh,.sz-gh,.sz-ht,.sz-ra,.sz-ln,.sz-g{stroke:CanvasText}.sz-sh{fill:Canvas}.sz-lab rect{fill:Canvas;stroke:CanvasText}.sz-lab text,.sz-lab.fr text,.sz-tx{fill:CanvasText}.sz-btn{border-color:ButtonText}.sz-sym{forced-color-adjust:none}}
`;

  /* ---- drawing -------------------------------------------------------------------------------- */
  const FW = 360;
  const FH = 250;
  const PL = 30;
  const PR = 16;
  const PT = 14;
  const PB = 38;

  function extent(/** @type {any} */ m, /** @type {any} */ ui) {
    const hi = (/** @type {string} */ k) => (m.dim[k].v !== undefined ? m.dim[k].v : m.dim[k].hi);
    if (m.shape === "para") return [hi("b") + 1.5, hi("h")];
    if (m.shape === "tri") return [ui.ghost ? hi("b") * 1.4 : hi("b"), hi("h")];
    if (m.shape === "trap") {
      const p = hi("b1");
      const q = hi("b2");
      return [ui.ghost ? p + q + Math.abs(p - q) / 2 : Math.max(p, q), hi("h")];
    }
    if (m.shape === "lshape") return [hi("w"), hi("h")];
    return [hi("l") + hi("w") * 0.45, hi("h") + hi("w") * 0.32];
  }

  function figure(
    /** @type {any} */ m,
    /** @type {any} */ d,
    /** @type {any} */ ui,
    /** @type {boolean} */ es,
  ) {
    const ex = extent(m, ui);
    const wide = m.shape === "lshape" || m.shape === "prism";
    const ML = wide ? 58 : PL;
    const MR = m.shape === "lshape" ? 54 : PR;
    const s = Math.min((FW - ML - MR) / ex[0], (FH - PT - PB) / ex[1]);
    const X = (/** @type {number} */ x) => ML + x * s;
    const Y = (/** @type {number} */ y) => FH - PB - y * s;
    const f1 = (/** @type {number} */ n) => n.toFixed(1);
    const poly = (/** @type {number[][]} */ pts, /** @type {string} */ c) =>
      `<polygon class="${c}" points="${pts.map(([x, y]) => `${f1(X(x))},${f1(Y(y))}`).join(" ")}"/>`;
    const line = (
      /** @type {number} */ x1,
      /** @type {number} */ y1,
      /** @type {number} */ x2,
      /** @type {number} */ y2,
      /** @type {string} */ c,
    ) =>
      `<line class="${c}" x1="${f1(X(x1))}" y1="${f1(Y(y1))}" x2="${f1(X(x2))}" y2="${f1(Y(y2))}"/>`;
    const ra = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ dir) =>
      `<path class="sz-ra" d="M${f1(X(x) + dir * 9)},${f1(Y(y))} v-9 h${-dir * 9}"/>`;
    const lab = (
      /** @type {number} */ px,
      /** @type {number} */ py,
      /** @type {string} */ k,
      /** @type {string} */ sym,
      /** @type {number} */ v,
    ) => {
      const t = `${sym} = ${num(v)}`;
      const w = t.length * 7.4 + 14;
      return `<g class="sz-lab${m.dim[k] && m.dim[k].v === undefined ? " fr" : ""}"><rect x="${f1(px - w / 2)}" y="${f1(py - 11)}" width="${f1(w)}" height="22" rx="11"/><text x="${f1(px)}" y="${f1(py + 4.5)}" text-anchor="middle">${t}</text></g>`;
    };
    const tx = (/** @type {number} */ px, /** @type {number} */ py, /** @type {string} */ t) =>
      `<text class="sz-tx" x="${f1(px)}" y="${f1(py)}">${t}</text>`;
    let o = "";
    let alt = "";
    const sy = (/** @type {string} */ k) => DIMS[m.shape][k][2];
    if (m.shape !== "prism") {
      for (let i = 0; i <= Math.floor(ex[0]); i++)
        o += `<line class="sz-g" x1="${f1(X(i))}" y1="${f1(Y(0))}" x2="${f1(X(i))}" y2="${f1(Y(ex[1]))}"/>`;
      for (let j = 0; j <= Math.floor(ex[1]); j++)
        o += `<line class="sz-g" x1="${f1(X(0))}" y1="${f1(Y(j))}" x2="${f1(X(ex[0]))}" y2="${f1(Y(j))}"/>`;
    }
    if (m.shape === "para") {
      const k = Math.min(1.5, d.b * 0.4);
      if (ui.ghost)
        o +=
          poly(
            [
              [k, 0],
              [k + d.b, 0],
              [k + d.b, d.h],
              [k, d.h],
            ],
            "sz-gh",
          ) +
          poly(
            [
              [0, 0],
              [k, 0],
              [k, d.h],
            ],
            "sz-mv",
          ) +
          poly(
            [
              [d.b, 0],
              [d.b + k, 0],
              [d.b + k, d.h],
            ],
            "sz-gh2",
          );
      o +=
        poly(
          [
            [0, 0],
            [d.b, 0],
            [d.b + k, d.h],
            [k, d.h],
          ],
          "sz-sh",
        ) +
        line(k, d.h, k, 0, "sz-ht") +
        ra(k, 0, 1);
      o += lab(X(d.b / 2), Y(0) + 24, "b", "b", d.b) + lab(X(k) + 36, Y(d.h / 2), "h", "h", d.h);
      alt = `base ${num(d.b)}, height ${num(d.h)}`;
    } else if (m.shape === "tri") {
      const a = Math.min(Math.max(d.b * 0.35, 0.5), d.b - 0.5);
      if (ui.ghost)
        o +=
          poly(
            [
              [d.b, 0],
              [a, d.h],
              [a + d.b, d.h],
            ],
            "sz-gh2",
          ) +
          poly(
            [
              [0, 0],
              [d.b, 0],
              [a + d.b, d.h],
              [a, d.h],
            ],
            "sz-gh",
          );
      o +=
        poly(
          [
            [0, 0],
            [d.b, 0],
            [a, d.h],
          ],
          "sz-sh",
        ) +
        line(a, d.h, a, 0, "sz-ht") +
        ra(a, 0, d.b - a >= a ? 1 : -1);
      o +=
        lab(X(d.b / 2), Y(0) + 24, "b", "b", d.b) +
        lab(X(a) + (d.b - a >= a ? 36 : -36), Y(d.h / 2), "h", "h", d.h);
      alt = `base ${num(d.b)}, height ${num(d.h)}`;
    } else if (m.shape === "trap") {
      const off = (d.b2 - d.b1) / 2;
      const sx = Math.max(0, -off);
      const cx = sx + d.b2 / 2;
      const P = [
        [sx, 0],
        [sx + d.b2, 0],
        [sx + off + d.b1, d.h],
        [sx + off, d.h],
      ];
      if (ui.ghost)
        o +=
          poly(
            [
              [sx + d.b2, 0],
              [sx + off + d.b1, d.h],
              [sx + off + d.b1 + d.b2, d.h],
              [sx + d.b1 + d.b2, 0],
            ],
            "sz-gh2",
          ) +
          poly(
            [
              [sx, 0],
              [sx + d.b1 + d.b2, 0],
              [sx + off + d.b1 + d.b2, d.h],
              [sx + off, d.h],
            ],
            "sz-gh",
          );
      o += poly(P, "sz-sh") + line(cx, d.h, cx, 0, "sz-ht") + ra(cx, 0, 1);
      o +=
        lab(X(cx), Y(d.h) - 20, "b1", "b₁", d.b1) +
        lab(X(cx), Y(0) + 24, "b2", "b₂", d.b2) +
        lab(X(cx) + 36, Y(d.h / 2), "h", "h", d.h);
      alt = `top base ${num(d.b1)}, bottom base ${num(d.b2)}, height ${num(d.h)}`;
    } else if (m.shape === "lshape") {
      const cutY = d.h - d.c;
      const Lp = [
        [0, 0],
        [d.w, 0],
        [d.w, cutY],
        [d.w - d.a, cutY],
        [d.w - d.a, d.h],
        [0, d.h],
      ];
      if (ui.view === "sub")
        o +=
          poly(
            [
              [0, 0],
              [d.w, 0],
              [d.w, d.h],
              [0, d.h],
            ],
            "sz-gh",
          ) +
          poly(
            [
              [d.w - d.a, cutY],
              [d.w, cutY],
              [d.w, d.h],
              [d.w - d.a, d.h],
            ],
            "sz-gh2",
          ) +
          tx(X(d.w - d.a / 2), Y(d.h - d.c / 2) + 4, `${num(d.a)} × ${num(d.c)}`);
      o += poly(Lp, "sz-sh");
      if (ui.view === "add")
        o +=
          line(0, cutY, d.w - d.a, cutY, "sz-gh") +
          tx(X(d.w / 2), Y(cutY / 2) + 4, `${num(d.w)} × ${num(cutY)}`) +
          tx(X((d.w - d.a) / 2), Y(cutY + d.c / 2) + 4, `${num(d.w - d.a)} × ${num(d.c)}`);
      o += lab(X(d.w / 2), Y(0) + 24, "w", "w", d.w) + lab(X(0) - 30, Y(d.h / 2), "h", "h", d.h);
      o +=
        lab(X(d.w - d.a / 2), Y(d.h) - 17, "a", "a", d.a) +
        lab(X(d.w) + 30, Y(d.h - d.c / 2), "c", "c", d.c);
      alt = `width ${num(d.w)}, height ${num(d.h)}, cut ${num(d.a)} by ${num(d.c)}`;
    } else {
      const u = s;
      const x0 = ML;
      const y0 = FH - PB;
      const dx = d.w * u * 0.45;
      const dy = -d.w * u * 0.32;
      const lw = d.l * u;
      const hh = d.h * u;
      const P = (/** @type {number[][]} */ pts, /** @type {string} */ c) =>
        `<polygon class="${c}" points="${pts.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ")}"/>`;
      const lay = ui.layers && m.goal === "volume";
      const fac = ui.layers && m.goal === "surface";
      o += P(
        [
          [x0, y0],
          [x0 + lw, y0],
          [x0 + lw, y0 - hh],
          [x0, y0 - hh],
        ],
        fac ? "sz-fb2" : "sz-sh",
      );
      o += P(
        [
          [x0, y0 - hh],
          [x0 + lw, y0 - hh],
          [x0 + lw + dx, y0 - hh + dy],
          [x0 + dx, y0 - hh + dy],
        ],
        fac || lay ? "sz-fa" : "sz-sh",
      );
      o += P(
        [
          [x0 + lw, y0],
          [x0 + lw + dx, y0 + dy],
          [x0 + lw + dx, y0 - hh + dy],
          [x0 + lw, y0 - hh],
        ],
        fac ? "sz-fc" : "sz-sh",
      );
      if (lay) {
        const ln = (
          /** @type {number} */ a,
          /** @type {number} */ b,
          /** @type {number} */ c,
          /** @type {number} */ e,
        ) => `<line class="sz-ln" x1="${f1(a)}" y1="${f1(b)}" x2="${f1(c)}" y2="${f1(e)}"/>`;
        for (let i = 1; i < d.l - 1e-9; i++)
          o +=
            ln(x0 + i * u, y0, x0 + i * u, y0 - hh) +
            ln(x0 + i * u, y0 - hh, x0 + i * u + dx, y0 - hh + dy);
        for (let j = 1; j < d.h - 1e-9; j++)
          o +=
            ln(x0, y0 - j * u, x0 + lw, y0 - j * u) +
            ln(x0 + lw, y0 - j * u, x0 + lw + dx, y0 - j * u + dy);
        for (let k = 1; k < d.w - 1e-9; k++)
          o +=
            ln(
              x0 + (k / d.w) * dx,
              y0 - hh + (k / d.w) * dy,
              x0 + lw + (k / d.w) * dx,
              y0 - hh + (k / d.w) * dy,
            ) +
            ln(
              x0 + lw + (k / d.w) * dx,
              y0 + (k / d.w) * dy,
              x0 + lw + (k / d.w) * dx,
              y0 - hh + (k / d.w) * dy,
            );
        o += tx(x0 + lw / 2 + dx / 2, y0 - hh + dy / 2 + 4, `${num(d.l * d.w)}`);
      }
      if (fac)
        o +=
          tx(x0 + lw / 2, y0 - hh / 2 + 4, `${num(d.l)} × ${num(d.h)}`) +
          tx(x0 + lw / 2 + dx / 2, y0 - hh + dy / 2 + 4, `${num(d.l)} × ${num(d.w)}`) +
          tx(x0 + lw + dx / 2, y0 - hh / 2 + dy / 2 + 4, `${num(d.w)} × ${num(d.h)}`);
      o +=
        lab(x0 + lw / 2, y0 + 24, "l", "l", d.l) +
        lab(x0 - 30, y0 - hh / 2, "h", "h", d.h) +
        lab(x0 + lw + dx / 2 + 18, y0 + dy / 2 + 20, "w", "w", d.w);
      alt = `length ${num(d.l)}, width ${num(d.w)}, height ${num(d.h)}`;
    }
    void sy;
    return {
      svg: `<svg viewBox="0 0 ${FW} ${FH}" role="img" aria-label="${cap(es ? DIMS_NAME(m.shape)[1] : DIMS_NAME(m.shape)[0])}: ${alt}">${o}</svg>`,
      alt,
    };
  }
  function DIMS_NAME(/** @type {string} */ shape) {
    const t = SHAPE_TXT[shape];
    return [t[0].replace(/^an? /, ""), t[1]];
  }

  /** readout rows: [label EN, label ES, math] plus the result */
  function readout(/** @type {any} */ m, /** @type {any} */ d, /** @type {any} */ ui) {
    const n = num;
    /** @type {string[][]} */
    let rows = [];
    if (m.shape === "para")
      rows = [
        ["Formula", "Fórmula", "A = b × h"],
        ["Your numbers", "Tus números", `A = ${n(d.b)} × ${n(d.h)}`],
      ];
    else if (m.shape === "tri")
      rows = [
        ["Formula", "Fórmula", "A = ½ × b × h"],
        ["Your numbers", "Tus números", `A = ½ × ${n(d.b)} × ${n(d.h)}`],
        [
          "Whole parallelogram",
          "Paralelogramo completo",
          `${n(d.b)} × ${n(d.h)} = ${n(d.b * d.h)}`,
        ],
      ];
    else if (m.shape === "trap")
      rows = [
        ["Formula", "Fórmula", "A = ½ × (b₁ + b₂) × h"],
        ["Your numbers", "Tus números", `A = ½ × (${n(d.b1)} + ${n(d.b2)}) × ${n(d.h)}`],
        ["Sum of the bases", "Suma de las bases", `${n(d.b1)} + ${n(d.b2)} = ${n(d.b1 + d.b2)}`],
      ];
    else if (m.shape === "lshape")
      rows =
        ui.view === "add"
          ? [
              [
                "Add the pieces",
                "Suma las piezas",
                `A = ${n(d.w)} × ${n(d.h - d.c)} + ${n(d.w - d.a)} × ${n(d.c)}`,
              ],
              ["Pieces", "Piezas", `${n(d.w * (d.h - d.c))} + ${n((d.w - d.a) * d.c)}`],
            ]
          : [
              [
                "Whole minus corner",
                "Todo menos la esquina",
                `A = ${n(d.w)} × ${n(d.h)} − ${n(d.a)} × ${n(d.c)}`,
              ],
              ["Parts", "Partes", `${n(d.w * d.h)} − ${n(d.a * d.c)}`],
            ];
    else if (m.goal === "volume")
      rows = [
        ["One layer", "Una capa", `B = l × w = ${n(d.l)} × ${n(d.w)} = ${n(d.l * d.w)}`],
        ["Stacked", "Apiladas", `V = B × h = ${n(d.l * d.w)} × ${n(d.h)}`],
      ];
    else
      rows = [
        ["Top + bottom", "Arriba + abajo", `2(l × w) = 2 × ${n(d.l * d.w)} = ${n(2 * d.l * d.w)}`],
        ["Front + back", "Frente + atrás", `2(l × h) = 2 × ${n(d.l * d.h)} = ${n(2 * d.l * d.h)}`],
        [
          "Left + right",
          "Izquierda + derecha",
          `2(w × h) = 2 × ${n(d.w * d.h)} = ${n(2 * d.w * d.h)}`,
        ],
      ];
    return { rows, value: measure(m, d) };
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("sizer", CSS);
    const m = spec.model;
    const T = A.t;
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const solved = !!api.solved;
    const restore = solved ? def.solution(spec) : api.restore;
    const cur = /** @type {Record<string, number>} */ ({});
    for (const k of m.free)
      cur[k] =
        restore && restore.d && restore.d[k] !== undefined ? Number(restore.d[k]) : m.dim[k].start;
    const ui = { ghost: false, layers: m.shape === "prism" && m.goal === "volume", view: "sub" };
    let ended = solved;
    host.textContent = "";
    const root = A.el("div", `sz${solved ? " sz-done" : ""}`);
    const meas = MEAS[m.goal];
    const unit = UNIT[m.goal];
    const goal = A.el("div", "sz-goal");
    const chip = (/** @type {string} */ cls, /** @type {string} */ html) =>
      goal.append(A.el("span", cls, `<span>${html}</span>`));
    chip(
      "sz-chip goal",
      T(
        `Goal: ${meas[0]} ${num(m.target)} ${unit[0]}`,
        `Meta: ${meas[1]} ${num(m.target)} ${unit[1]}`,
      ),
    );
    for (const r of fixedClauses(m).concat(
      m.conds.map((/** @type {any} */ c) => condPhrase(m.shape, c)),
    ))
      chip("sz-chip", T(cap(r[0]), cap(r[1])));
    const main = A.el("div", "sz-main");
    const stage = A.el("div", "sz-stage");
    const fig = A.el("div", "sz-fig");
    const tools = A.el("div", "sz-tools");
    stage.append(fig, tools);
    const ctl = A.el("div", "sz-ctl");
    const read = A.el("div", "sz-read");
    const bar = A.el("div", "sz-bar");
    const fb = A.el("p", "sz-fb");
    fb.hidden = true;
    if (!api.say) fb.setAttribute("role", "status");
    const check = A.el("button", "sz-btn go", T("Check", "Comprobar"), { type: "button" });
    bar.append(check, fb);

    /* toggles */
    const tg = (
      /** @type {string} */ id,
      /** @type {string} */ en,
      /** @type {string} */ esT,
      /** @type {() => boolean} */ pressed,
      /** @type {() => void} */ on,
    ) => {
      const b = A.el("button", "sz-btn", T(en, esT), {
        type: "button",
        "aria-pressed": String(pressed()),
        "data-tg": id,
      });
      b.addEventListener("click", () => {
        on();
        for (const x of /** @type {any[]} */ ([...tools.querySelectorAll("[data-tg]")]))
          x.setAttribute("aria-pressed", String(x.__p()));
        draw();
      });
      /** @type {any} */ (b).__p = pressed;
      tools.append(b);
    };
    const ghostLabels = /** @type {Record<string, string[]>} */ ({
      para: ["Slide the corner", "Mover la esquina"],
      tri: ["Show the other half", "Mostrar la otra mitad"],
      trap: ["Add a second trapezoid", "Agregar un segundo trapecio"],
    });
    if (ghostLabels[m.shape])
      tg(
        "ghost",
        ghostLabels[m.shape][0],
        ghostLabels[m.shape][1],
        () => ui.ghost,
        () => (ui.ghost = !ui.ghost),
      );
    if (m.shape === "lshape") {
      tg(
        "sub",
        "Subtract the corner",
        "Restar la esquina",
        () => ui.view === "sub",
        () => (ui.view = "sub"),
      );
      tg(
        "add",
        "Add the pieces",
        "Sumar las piezas",
        () => ui.view === "add",
        () => (ui.view = "add"),
      );
      tg(
        "off",
        "Plain",
        "Sin ayuda",
        () => ui.view === "off",
        () => (ui.view = "off"),
      );
    }
    if (m.shape === "prism")
      tg(
        "layers",
        m.goal === "volume" ? "Show the layers" : "Show the faces",
        m.goal === "volume" ? "Mostrar las capas" : "Mostrar las caras",
        () => ui.layers,
        () => (ui.layers = !ui.layers),
      );

    /* dimension rows */
    /** @type {Record<string, any>} */
    const ins = {};
    for (const k of m.order) {
      const nm = DIMS[m.shape][k];
      const s = m.dim[k];
      const row = A.el("div", `sz-row${s.v !== undefined ? " fx" : ""}`);
      const val = A.el("output", "sz-val", num(s.v !== undefined ? s.v : cur[k]));
      row.append(
        A.el(
          "div",
          "sz-nm",
          `<span class="sz-sym" aria-hidden="true">${nm[2]}</span><span>${T(cap(nm[0]), cap(nm[1]))}</span>`,
        ),
      );
      /** @type {any} */ (row.firstChild).append(val);
      if (s.v !== undefined) {
        row.classList.add("sz-fx");
        row.append(A.el("div", "sz-fxn", T("Fixed by the rules", "Fijo por las reglas")));
      } else {
        const sl = A.el("div", "sz-sl");
        const inp = /** @type {any} */ (
          A.el("input", "", "", {
            type: "range",
            min: String(s.lo),
            max: String(s.hi),
            step: String(m.step),
            "aria-label": L(cap(nm[0]), cap(nm[1])),
          })
        );
        inp.value = String(cur[k]);
        inp.disabled = ended;
        const mk = (/** @type {string} */ g, /** @type {number} */ dir) => {
          const b = /** @type {any} */ (
            A.el("button", "sz-btn", g, {
              type: "button",
              "aria-label": `${dir < 0 ? L("Make smaller", "Hacer más pequeño") : L("Make bigger", "Hacer más grande")}: ${L(nm[0], nm[1])}`,
            })
          );
          b.disabled = ended;
          b.addEventListener("click", () => {
            const v = Math.min(
              s.hi,
              Math.max(s.lo, Math.round((cur[k] + dir * m.step) / m.step) * m.step),
            );
            inp.value = String(v);
            set(k, v);
          });
          return b;
        };
        sl.append(mk("−", -1), inp, mk("+", 1));
        row.append(sl);
        inp.addEventListener("input", () => set(k, Number(inp.value)));
        ins[k] = { inp, val };
      }
      ctl.append(row);
    }

    function set(/** @type {string} */ k, /** @type {number} */ v) {
      cur[k] = v;
      fb.hidden = true;
      draw();
      if (api.change) api.change({ d: { ...cur } });
    }
    function draw() {
      const d = dimsOf(m, { d: cur });
      const f = figure(m, d, ui, es());
      fig.innerHTML = f.svg;
      const ro = readout(m, d, ui);
      const vtxt = `${num(ro.value)} ${L(unit[0], unit[1])}`;
      read.innerHTML =
        ro.rows
          .map((r) => `<div class="sz-line"><small>${T(r[0], r[1])}</small><b>${r[2]}</b></div>`)
          .join("") +
        `<div class="sz-res"><span>${T(cap(meas[0]), cap(meas[1]))}</span><b>${num(ro.value)}</b><span>${T(unit[0], unit[1])}</span></div>`;
      for (const k of m.free) {
        const { inp, val } = ins[k];
        val.textContent = num(cur[k]);
        const pct = ((cur[k] - m.dim[k].lo) / (m.dim[k].hi - m.dim[k].lo)) * 100;
        inp.style.setProperty("--p", `${pct}%`);
        inp.setAttribute("aria-valuetext", `${num(cur[k])}. ${cap(L(meas[0], meas[1]))} ${vtxt}`);
      }
    }
    function show(/** @type {any} */ r) {
      fb.hidden = false;
      fb.className = `sz-fb${r.ok ? " ok" : ""}`;
      fb.innerHTML = r.ok
        ? T("You built it.", "Lo lograste.")
        : T(r.say || "Not yet.", r.sayEs || "Todavía no.");
      if (api.say)
        api.say(
          r.ok ? L("Correct", "Correcto") : L(r.say || "Not yet", r.sayEs || r.say || "Todavía no"),
        );
    }
    function lock() {
      ended = true;
      root.classList.add("sz-done");
      check.hidden = true;
      for (const k of m.free) {
        ins[k].inp.disabled = true;
      }
      for (const b of /** @type {any[]} */ ([...root.querySelectorAll(".sz-sl .sz-btn")]))
        b.disabled = true;
    }
    check.addEventListener("click", () => {
      if (ended) return;
      const state = { d: { ...cur } };
      const local = def.grade(spec, state);
      const out = local.tag === "untouched" ? null : api.submit && api.submit(state);
      const res = out && typeof out === "object" && typeof out.ok === "boolean" ? out : local;
      if (res.ok) lock();
      show(res);
      draw();
    });
    main.append(A.el("div", "sz-left"), ctl);
    /** @type {any} */ (main.firstChild).append(stage);
    /** @type {any} */ (main.lastChild).append(read);
    root.append(goal, main, bar);
    host.append(root);
    if (solved) {
      lock();
      show({ ok: true });
    }
    draw();
  }

  const def = {
    title: "Resize the figure",
    titleEs: "Cambia el tamaño de la figura",
    levels: 4,
    make,
    solution: (/** @type {any} */ spec) => ({ d: { ...spec.model.sol } }),
    wrong,
    grade,
    mount,
  };
  A.register("sizer", def);
})();

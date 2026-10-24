/**
 * Practice Studio generators: problem shapes for the geometry generators (lessons 5-1 ... 5-10).
 *
 * Every geometry generator already makes its "forward" problems (measures given, find the area / volume / surface area). This file
 * adds three more shapes to each of nine generators, so a lesson can ask the same idea from another side:
 *
 *   reverse  the area (volume, surface area) is given; find a missing base, height, edge or slant height
 *   which    four figures are described by their measures; which one has this area?
 *   compare  two figures; which has the greater area, or do they match?
 *
 * One adapter per generator says how its figures are listed, measured and misread; the three shape builders are shared. The
 * answer of every item is computed from the figure, and check() rebuilds the figure and measures it another way (shoelace,
 * vertical slabs, cell and cube counting, exposed unit faces). Shares figures, feedback and contexts with geometry.js through
 * StudioGen.geo, so nothing is copied.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  if (!G || !G.geo)
    throw new Error("geometry2.js needs assets/studio-gen/geometry.js loaded first");
  const geo = G.geo;
  const {
    UN,
    unitOf,
    mcI,
    numI,
    MIS,
    near,
    shoelace,
    paraPts,
    triPts,
    trapPts,
    figPts,
    slabArea,
    exposedFaces,
    addShapes,
  } = geo;
  const fm = G.fmt;

  Object.assign(MIS, {
    "arithmetic-slip": [
      "That one is close to the target, but its numbers do not multiply to it. Work the formula all the way through for every choice.",
      "Ese se acerca a la meta, pero sus números no dan ese producto. Resuelve la fórmula completa para cada opción.",
    ],
  });

  const cached = (/** @type {() => any[]} */ fn) => {
    /** @type {any[]|undefined} */ let v;
    return () => v || (v = fn());
  };
  const range = (/** @type {number} */ a, /** @type {number} */ b) =>
    Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const frQ = (/** @type {number} */ v) => G.mixed(Math.round(v * 4), 4);
  const mean = (/** @type {number[]} */ xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

  /** Count cube cells 1/12 of a unit on an edge (every edge here is a multiple of 1/4, so the count is whole). */
  const vol12 = (/** @type {number[]} */ es) =>
    es.reduce((p, e) => p * Math.round(e * 12), 1) / 1728;

  /**
   * Adapters.  meas: [key, English name, Spanish name, hasUnit]; all(): every figure the shapes may use; area(f): the formula;
   * indep(f): the same number by a different route; mis: {tag: f => what a student who makes that mistake would get};
   * naive(f): the size a student trusts when they compare without finding the area; rev: {key: f => [{v, tag}] wrong answers};
   * calc(f): the worked line "8 × 5 = 40".
   */
  const AD = /** @type {Record<string, any>} */ ({
    areaParallelogram: {
      like: ["a parallelogram", "paralelogramo"],
      ctx: "CP",
      what: "area",
      noun: ["parallelogram", "paralelogramo"],
      plural: ["parallelograms", "paralelogramos"],
      meas: [
        ["b", "base", "base"],
        ["h", "height", "altura"],
      ],
      all: cached(() =>
        range(4, 20).flatMap((b) =>
          range(3, 14)
            .filter((h) => h !== b)
            .map((b2) => ({ b, h: b2 })),
        ),
      ),
      area: (/** @type {any} */ f) => f.b * f.h,
      indep: (/** @type {any} */ f) => shoelace(paraPts(f.b, f.h, 0)),
      mis: {
        "took-half": (/** @type {any} */ f) => (f.b * f.h) / 2,
        "doubled-instead": (/** @type {any} */ f) => 2 * f.b * f.h,
      },
      naive: (/** @type {any} */ f) => f.b + f.h,
      calc: (/** @type {any} */ f) => `${f.b} × ${f.h} = ${f.b * f.h}`,
      rc: [
        "The area of a parallelogram is base × height. The height makes a right angle with the base.",
        "El área de un paralelogramo es base × altura. La altura forma un ángulo recto con la base.",
      ],
      fourth: [
        "It depends on the slanted sides.",
        "Depende de los lados inclinados.",
        "slant-longer",
      ],
      rev: {
        b: (/** @type {any} */ f) => [
          { v: f.b * f.h * f.h, tag: "multiplied-instead" },
          { v: f.b * f.h - f.h, tag: "subtracted-instead" },
          { v: (f.b * f.h) / f.h / 2, tag: "took-half" },
        ],
        h: (/** @type {any} */ f) => [
          { v: f.b * f.h * f.b, tag: "multiplied-instead" },
          { v: f.b * f.h - f.b, tag: "subtracted-instead" },
          { v: (f.b * f.h) / f.b / 2, tag: "took-half" },
        ],
      },
    },
    areaTriangle: {
      like: ["a triangle", "triángulo"],
      ctx: "CT",
      what: "area",
      noun: ["triangle", "triángulo"],
      plural: ["triangles", "triángulos"],
      meas: [
        ["b", "base", "base"],
        ["h", "height", "altura"],
      ],
      all: cached(() =>
        range(4, 20).flatMap((b) =>
          range(3, 14)
            .filter((h) => h !== b && (b * h) % 2 === 0)
            .map((h2) => ({ b, h: h2 })),
        ),
      ),
      area: (/** @type {any} */ f) => (f.b * f.h) / 2,
      indep: (/** @type {any} */ f) => shoelace(triPts(f.b, f.h, f.b / 3)),
      mis: {
        "forgot-half": (/** @type {any} */ f) => f.b * f.h,
        "halved-twice": (/** @type {any} */ f) => (f.b * f.h) / 4,
      },
      naive: (/** @type {any} */ f) => f.b + f.h,
      calc: (/** @type {any} */ f) => `½ × ${f.b} × ${f.h} = ${(f.b * f.h) / 2}`,
      rc: [
        "The area of a triangle is half of base × height: A = ½ × b × h. The height makes a right angle with the base.",
        "El área de un triángulo es la mitad de base × altura: A = ½ × b × h. La altura forma un ángulo recto con la base.",
      ],
      fourth: [
        "It depends on the slanted sides.",
        "Depende de los lados inclinados.",
        "slant-longer",
      ],
      rev: {
        b: (/** @type {any} */ f) => [
          { v: (f.b * f.h) / 2 / f.h, tag: "forgot-double" },
          { v: (f.b * f.h * f.h) / 2, tag: "multiplied-instead" },
          { v: (f.b * f.h) / 2 - f.h, tag: "subtracted-instead" },
        ],
        h: (/** @type {any} */ f) => [
          { v: (f.b * f.h) / 2 / f.b, tag: "forgot-double" },
          { v: (f.b * f.h * f.b) / 2, tag: "multiplied-instead" },
          { v: (f.b * f.h) / 2 - f.b, tag: "subtracted-instead" },
        ],
      },
    },
    areaTrapezoid: {
      like: ["a trapezoid", "trapecio"],
      ctx: "CZ",
      what: "area",
      noun: ["trapezoid", "trapecio"],
      plural: ["trapezoids", "trapecios"],
      meas: [
        ["b1", "long base", "base larga"],
        ["b2", "short base", "base corta"],
        ["h", "height", "altura"],
      ],
      all: cached(() =>
        range(5, 22).flatMap((b1) =>
          range(3, b1 - 2)
            .filter((b2) => (b1 - b2) % 2 === 0)
            .flatMap((b2) =>
              range(3, 12)
                .filter((h) => (h * (b1 + b2)) % 2 === 0 && h !== b1 && h !== b2)
                .map((h2) => ({ b1, b2, h: h2 })),
            ),
        ),
      ),
      area: (/** @type {any} */ f) => ((f.b1 + f.b2) * f.h) / 2,
      indep: (/** @type {any} */ f) => shoelace(trapPts(f.b1, f.b2, f.h)),
      mis: {
        "forgot-half": (/** @type {any} */ f) => (f.b1 + f.b2) * f.h,
        "one-base-only": (/** @type {any} */ f) => f.b1 * f.h,
      },
      naive: (/** @type {any} */ f) => f.b1 + f.b2 + f.h,
      calc: (/** @type {any} */ f) =>
        `½ × (${f.b1} + ${f.b2}) × ${f.h} = ${((f.b1 + f.b2) * f.h) / 2}`,
      rc: [
        "A trapezoid's area is A = ½ × (b₁ + b₂) × h. The height makes a right angle with the bases.",
        "El área de un trapecio es A = ½ × (b₁ + b₂) × h. La altura forma un ángulo recto con las bases.",
      ],
      fourth: [
        "It depends on the slanted sides.",
        "Depende de los lados inclinados.",
        "slant-longer",
      ],
      rev: {
        h: (/** @type {any} */ f) => {
          const A = ((f.b1 + f.b2) * f.h) / 2;
          return [
            { v: A / (f.b1 + f.b2), tag: "forgot-double" },
            { v: (A * 2) / f.b1, tag: "one-base-only" },
            { v: A / f.h, tag: "wrong-piece" },
          ];
        },
        b2: (/** @type {any} */ f) => {
          const A = ((f.b1 + f.b2) * f.h) / 2;
          return [
            { v: (2 * A) / f.h, tag: "gave-sum-of-bases" },
            { v: A / f.h - f.b1, tag: "forgot-double" },
            { v: A - f.b1, tag: "subtracted-instead" },
          ];
        },
      },
    },
    areaComposite: {
      like: ["a house with a triangle roof", "casa con techo triangular"],
      ctx: "CK",
      what: "area",
      noun: ["house-shaped figure", "figura con forma de casa"],
      plural: ["house-shaped figures", "figuras con forma de casa"],
      meas: [
        ["W", "width", "ancho"],
        ["H", "wall height", "altura de la pared"],
        ["R", "roof height", "altura del techo"],
      ],
      all: cached(() =>
        range(3, 12).flatMap((x) =>
          range(3, 12)
            .filter((R) => R !== 2 * x)
            .flatMap((R) =>
              range(3, 9)
                .filter((H) => H !== 2 * x && H !== R)
                .map((H) => ({ W: 2 * x, H, R })),
            ),
        ),
      ),
      area: (/** @type {any} */ f) => f.W * f.H + (f.W * f.R) / 2,
      indep: (/** @type {any} */ f) => slabArea(figPts("house", f)),
      mis: {
        "forgot-half": (/** @type {any} */ f) => f.W * f.H + f.W * f.R,
        "forgot-piece": (/** @type {any} */ f) => f.W * f.H,
      },
      naive: (/** @type {any} */ f) => f.W + f.H + f.R,
      calc: (/** @type {any} */ f) =>
        `${f.W} × ${f.H} + ½ × ${f.W} × ${f.R} = ${f.W * f.H} + ${(f.W * f.R) / 2} = ${f.W * f.H + (f.W * f.R) / 2}`,
      rc: [
        "Split the house into a rectangle and a triangle roof. The roof triangle has the same base as the rectangle.",
        "Divide la casa en un rectángulo y un techo triangular. El triángulo del techo tiene la misma base que el rectángulo.",
      ],
      fourth: [
        "It depends on the slanted roof edges.",
        "Depende de los bordes inclinados del techo.",
        "slant-longer",
      ],
      rev: {
        R: (/** @type {any} */ f) => {
          const roof = (f.W * f.R) / 2;
          return [
            { v: roof, tag: "gave-area" },
            { v: roof / f.W, tag: "forgot-double" },
            { v: (roof + f.W * f.H) / f.W, tag: "multiplied-instead" },
          ];
        },
        H: (/** @type {any} */ f) => {
          const wall = f.W * f.H;
          return [
            { v: wall, tag: "gave-area" },
            { v: wall + (f.W * f.R) / 2, tag: "added-instead" },
            { v: wall / (f.W + f.R), tag: "wrong-piece" },
          ];
        },
      },
    },
    areaRegularPolygon: {
      like: ["a regular polygon", "polígono regular"],
      ctx: "CG",
      what: "area",
      noun: ["regular polygon", "polígono regular"],
      plural: ["regular polygons", "polígonos regulares"],
      meas: [
        ["n", "number of sides", "número de lados", false],
        ["s", "side length", "longitud del lado"],
        ["a", "apothem", "apotema"],
      ],
      all: cached(() => {
        const APO = /** @type {Record<number, number>} */ ({
          5: 0.6882,
          6: 0.866,
          8: 1.2071,
          10: 1.5388,
        });
        return [5, 6, 8, 10].flatMap((n) =>
          [4, 6, 8, 10, 12, 14, 16, 18, 20]
            .filter((s) => s !== n)
            .map((s) => ({ n, s, a: Math.round(s * APO[n] * 10) / 10 })),
        );
      }),
      area: (/** @type {any} */ f) => (f.n * f.s * Math.round(f.a * 10)) / 20,
      indep: (/** @type {any} */ f) =>
        Array.from({ length: f.n }, () =>
          shoelace([
            [0, 0],
            [f.s, 0],
            [f.s / 2, f.a],
          ]),
        ).reduce((a, b) => a + b, 0),
      mis: {
        "wrong-count": (/** @type {any} */ f) => ((f.n - 1) * f.s * Math.round(f.a * 10)) / 20,
        "one-triangle": (/** @type {any} */ f) => (f.s * Math.round(f.a * 10)) / 20,
      },
      naive: (/** @type {any} */ f) => f.n * f.s,
      calc: (/** @type {any} */ f) =>
        `${f.n} × (½ × ${f.s} × ${f.a}) = ${fm((f.n * f.s * Math.round(f.a * 10)) / 20)}`,
      rc: [
        "Cut a regular polygon into equal triangles from its center. Each triangle has a side as its base and the apothem as its height.",
        "Corta un polígono regular en triángulos iguales desde su centro. Cada triángulo tiene un lado como base y el apotema como altura.",
      ],
      fourth: [
        "It depends only on the number of sides.",
        "Depende solo del número de lados.",
        "wrong-count",
      ],
      rev: {
        a: (/** @type {any} */ f) => {
          const A = (f.n * f.s * Math.round(f.a * 10)) / 20;
          return [
            { v: A / f.n, tag: "gave-triangle-area" },
            { v: (2 * A) / f.s, tag: "wrong-count" },
            { v: A / (f.n * f.s), tag: "forgot-double" },
          ];
        },
      },
    },
    volumePrismWhole: {
      like: ["a rectangular prism", "prisma rectangular"],
      ctx: "CV",
      what: "volume",
      noun: ["rectangular prism", "prisma rectangular"],
      plural: ["rectangular prisms", "prismas rectangulares"],
      meas: [
        ["l", "length", "largo"],
        ["w", "width", "ancho"],
        ["h", "height", "alto"],
      ],
      all: cached(() =>
        range(2, 12).flatMap((l) =>
          range(2, 9)
            .filter((w) => w !== l)
            .flatMap((w) =>
              range(2, 8)
                .filter((h) => h !== l && h !== w)
                .map((h2) => ({ l, w, h: h2 })),
            ),
        ),
      ),
      area: (/** @type {any} */ f) => f.l * f.w * f.h,
      indep: (/** @type {any} */ f) => vol12([f.l, f.w, f.h]),
      mis: {
        "forgot-height": (/** @type {any} */ f) => f.l * f.w,
        "surface-for-volume": (/** @type {any} */ f) => 2 * (f.l * f.w + f.l * f.h + f.w * f.h),
      },
      naive: (/** @type {any} */ f) => f.l + f.w + f.h,
      calc: (/** @type {any} */ f) => `${f.l} × ${f.w} × ${f.h} = ${f.l * f.w * f.h}`,
      rc: [
        "Volume of a box = length × width × height. Base area × height gives the same number.",
        "Volumen de una caja = largo × ancho × altura. Área de la base × altura da el mismo número.",
      ],
      fourth: [
        "The one with the longest edge.",
        "La que tiene la arista más larga.",
        "one-dimension-only",
      ],
      rev: {
        l: (/** @type {any} */ f) => volRev(f, "l"),
        w: (/** @type {any} */ f) => volRev(f, "w"),
        h: (/** @type {any} */ f) => volRev(f, "h"),
      },
    },
    surfaceAreaPrism: {
      like: ["a rectangular prism", "prisma rectangular"],
      ctx: "CS",
      what: "surface",
      noun: ["rectangular prism", "prisma rectangular"],
      plural: ["rectangular prisms", "prismas rectangulares"],
      meas: [
        ["l", "length", "largo"],
        ["w", "width", "ancho"],
        ["h", "height", "alto"],
      ],
      all: cached(() =>
        range(3, 12).flatMap((l) =>
          range(2, 8)
            .filter((w) => w !== l)
            .flatMap((w) =>
              range(2, 7)
                .filter((h) => h !== l && h !== w)
                .map((h2) => ({ l, w, h: h2 })),
            ),
        ),
      ),
      area: (/** @type {any} */ f) => 2 * (f.l * f.w + f.l * f.h + f.w * f.h),
      indep: (/** @type {any} */ f) => exposedFaces(f.l, f.w, f.h),
      mis: {
        "volume-for-surface": (/** @type {any} */ f) => f.l * f.w * f.h,
        "forgot-face": (/** @type {any} */ f) => f.l * f.w + f.l * f.h + f.w * f.h,
      },
      naive: (/** @type {any} */ f) => f.l + f.w + f.h,
      calc: (/** @type {any} */ f) =>
        `2 × (${f.l * f.w} + ${f.l * f.h} + ${f.w * f.h}) = ${2 * (f.l * f.w + f.l * f.h + f.w * f.h)}`,
      rc: [
        "Surface area is the total area of all the faces. A box has 3 pairs of matching faces: count each pair twice.",
        "El área de superficie es el área total de todas las caras. Una caja tiene 3 pares de caras iguales: cuenta cada par dos veces.",
      ],
      fourth: [
        "The one with the longest edge.",
        "La que tiene la arista más larga.",
        "one-dimension-only",
      ],
      rev: {
        h: (/** @type {any} */ f) => {
          const SA = 2 * (f.l * f.w + f.l * f.h + f.w * f.h);
          return [
            { v: 2 * f.h, tag: "doubled-instead" },
            { v: SA / (2 * (f.l + f.w)), tag: "forgot-face" },
            { v: SA - f.l - f.w, tag: "subtracted-instead" },
          ];
        },
      },
    },
    surfaceAreaPyramid: {
      like: ["a square pyramid", "pirámide cuadrada"],
      ctx: "CY",
      what: "surface",
      noun: ["square pyramid", "pirámide cuadrada"],
      plural: ["square pyramids", "pirámides cuadradas"],
      meas: [
        ["s", "base edge", "arista de la base"],
        ["l", "slant height", "altura inclinada"],
      ],
      all: cached(() =>
        [4, 6, 8, 10, 12, 14, 16].flatMap((s) =>
          range(Math.floor(s / 2) + 2, 16)
            .filter((l) => l !== s)
            .map((l) => ({ s, l })),
        ),
      ),
      area: (/** @type {any} */ f) => f.s * f.s + 2 * f.s * f.l,
      indep: (/** @type {any} */ f) =>
        f.s * f.s +
        4 *
          shoelace([
            [0, 0],
            [f.s, 0],
            [f.s / 2, f.l],
          ]),
      mis: {
        "forgot-base": (/** @type {any} */ f) => 2 * f.s * f.l,
        "forgot-half": (/** @type {any} */ f) => f.s * f.s + 4 * f.s * f.l,
      },
      naive: (/** @type {any} */ f) => f.s + f.l,
      calc: (/** @type {any} */ f) =>
        `${f.s} × ${f.s} + 4 × (½ × ${f.s} × ${f.l}) = ${f.s * f.s} + ${2 * f.s * f.l} = ${f.s * f.s + 2 * f.s * f.l}`,
      rc: [
        "A square pyramid has one square base and four triangles. Surface area = base + 4 triangles. A triangle's height is the slant height.",
        "Una pirámide cuadrada tiene una base cuadrada y cuatro triángulos. Área de superficie = base + 4 triángulos. La altura de un triángulo es la altura inclinada.",
      ],
      fourth: [
        "It depends on the vertical height.",
        "Depende de la altura vertical.",
        "used-vertical-height",
      ],
      rev: {
        l: (/** @type {any} */ f) => {
          const SA = f.s * f.s + 2 * f.s * f.l;
          return [
            { v: (SA - f.s * f.s) / f.s, tag: "forgot-half" },
            { v: SA / (2 * f.s), tag: "forgot-base" },
            { v: (SA - f.s * f.s) / 4, tag: "wrong-piece" },
          ];
        },
      },
    },
  });
  /** Wrong answers when a box edge is missing: dividing by one edge only, multiplying, subtracting. */
  function volRev(/** @type {any} */ f, /** @type {string} */ k) {
    const V = f.l * f.w * f.h;
    const others = ["l", "w", "h"].filter((x) => x !== k).map((x) => f[x]);
    return [
      { v: V / others[0], tag: "divided-once" },
      { v: V / others[1], tag: "divided-once" },
      { v: V * others[0] * others[1], tag: "multiplied-instead" },
      { v: V - others[0] - others[1], tag: "subtracted-instead" },
    ];
  }
  // 5-10 draws its boxes from fractional edges: quarters and halves whose volume is a multiple of 1/4
  AD.volumePrismFrac = {
    ...AD.volumePrismWhole,
    ctx: "CV",
    fmt: frQ,
    all: cached(() => {
      const E = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.25, 2.5, 3, 4, 5, 6];
      /** @type {any[]} */ const out = [];
      for (const l of E)
        for (const w of E)
          for (const h of E) {
            const frac = [l, w, h].filter((x) => !Number.isInteger(x)).length;
            if (l === w || w === h || l === h || frac === 0 || frac > 2) continue;
            const v = l * w * h;
            if (Number.isInteger(v * 4) && v >= 1) out.push({ l, w, h });
          }
      return out;
    }),
    area: (/** @type {any} */ f) => f.l * f.w * f.h,
    calc: (/** @type {any} */ f) =>
      `${frQ(f.l)} × ${frQ(f.w)} × ${frQ(f.h)} = ${frQ(f.l * f.w * f.h)}`,
    rev: {
      l: (/** @type {any} */ f) => volRev(f, "l"),
      w: (/** @type {any} */ f) => volRev(f, "w"),
      h: (/** @type {any} */ f) => volRev(f, "h"),
    },
  };

  /* ---- helpers shared by the three shapes ---------------------------------------------------- */
  const U_LEN = (/** @type {any} */ u) => u.l;
  const U_MEAS = (/** @type {any} */ ad, /** @type {any} */ u) =>
    ad.what === "volume" ? u.v : u.a;
  const mval = (/** @type {any} */ ad, /** @type {any} */ f, /** @type {string} */ k) =>
    ad.fmt ? ad.fmt(f[k]) : String(f[k]);
  const mtxt = (
    /** @type {any} */ ad,
    /** @type {any} */ f,
    /** @type {any[]} */ m,
    /** @type {any} */ u,
    /** @type {boolean} */ es,
  ) => `${es ? m[2] : m[1]} ${mval(ad, f, m[0])}${m[3] === false ? "" : ` ${U_LEN(u)}`}`;
  const desc = (/** @type {any} */ ad, /** @type {any} */ f, /** @type {any} */ u) => [
    ad.meas.map((/** @type {any} */ m) => mtxt(ad, f, m, u, false)).join(", "),
    ad.meas.map((/** @type {any} */ m) => mtxt(ad, f, m, u, true)).join(", "),
  ];
  /** The figures of one level: a window over all of them ordered by size, so level 1 is small and level 4 reaches the top. */
  const pool = (/** @type {any} */ ad, /** @type {number} */ level) => {
    if (!ad.sorted)
      ad.sorted = ad
        .all()
        .slice()
        .sort((/** @type {any} */ a, /** @type {any} */ b) => ad.area(a) - ad.area(b));
    const n = ad.sorted.length;
    const [lo, hi] = [
      [0, 0.4],
      [0.15, 0.65],
      [0.4, 0.9],
      [0.5, 1],
    ][level - 1];
    return ad.sorted.slice(Math.floor(lo * n), Math.ceil(hi * n));
  };
  const sameFig = (/** @type {any} */ ad, /** @type {any} */ a, /** @type {any} */ b) =>
    ad.meas.every((/** @type {any} */ m) => a[m[0]] === b[m[0]]);
  const unitFor = (/** @type {any} */ rng) => unitOf(rng, { u: ["ft", "m", "in", "cm"] });
  const sayWhat = {
    area: ["area", "área"],
    volume: ["volume", "volumen"],
    surface: ["surface area", "área de superficie"],
  };
  const aOf = (/** @type {any} */ ad) => (ad.what === "area" ? "an" : "a");
  /** Spanish article for the figure noun: figura and pirámide are feminine. */
  const ge = (/** @type {any} */ ad) => (/^(figura|pirámide)/.test(ad.noun[1]) ? "f" : "m");
  const hint2 = [
    "Write the formula for this shape, then put in the numbers you know.",
    "Escribe la fórmula de esta figura y pon los números que conoces.",
  ];
  const hint3 = [
    "Undo the multiplication with division. Then check by putting your answer back into the formula.",
    "Deshaz la multiplicación con una división. Luego comprueba poniendo tu respuesta en la fórmula.",
  ];

  /* ---- reverse: the measure is given, find a missing length ----------------------------------- */
  const reverse = (/** @type {string} */ id) => (/** @type {any} */ rng) => {
    const ad = AD[id];
    const lvl = rng.__level;
    const f = rng.pick(pool(ad, lvl));
    const keys = Object.keys(ad.rev);
    const ask = lvl <= 2 ? keys[0] : rng.pick(keys);
    const u = unitFor(rng);
    const c = rng.pick(geo.contexts[ad.ctx]);
    const [Ae, As] = geo.An(c);
    const A = ad.area(f);
    const askM = ad.meas.find((/** @type {any} */ m) => m[0] === ask);
    const known = ad.meas.filter((/** @type {any} */ m) => m[0] !== ask);
    const [wn, ws] = sayWhat[/** @type {"area"} */ (ad.what)];
    const lenTxt = (/** @type {any} */ m) =>
      `${mval(ad, f, m[0])}${m[3] === false ? "" : ` ${U_LEN(u)}`}`;
    const kn = [
      known.map((/** @type {any} */ m) => `its ${m[1]} is ${lenTxt(m)}`).join(" and "),
      known
        .map((/** @type {any} */ m) => `su ${m[2]} ${m[3] === false ? "es" : "mide"} ${lenTxt(m)}`)
        .join(" y "),
    ];
    const fw = ad.rev[ask](f).map((/** @type {any} */ w) => ({ v: w.v, tag: w.tag }));
    const up = (/** @type {string} */ t) => t.charAt(0).toUpperCase() + t.slice(1);
    return numI({
      q: [
        `${Ae} is shaped like ${ad.like[0]}. It has ${aOf(ad)} ${wn} of ${fm(A)} ${U_MEAS(ad, u)}, and ${kn[0]}. What is its ${askM[1]}?`,
        `${As} tiene forma de ${ad.like[1]}. Tiene un ${ws} de ${fm(A)} ${U_MEAS(ad, u)}, y ${kn[1]}. ¿Cuál es su ${askM[2]}?`,
      ],
      a: f[ask],
      unit: askM[3] === false ? undefined : U_LEN(u),
      tol: ad.fmt ? 0.001 : undefined,
      fw,
      x: [
        `Start from the formula: ${ad.calc(f)}. The missing ${askM[1]} is ${lenTxt([ask, 0, 0, askM[3]]).replace(/^/, "")}: divide the ${wn} by the other measures in the formula. Check by putting ${mval(ad, f, ask)} back in.`,
        `Parte de la fórmula: ${ad.calc(f)}. ${up(askM[2])} que falta es ${lenTxt([ask, 0, 0, askM[3]])}: divide el ${ws} entre las otras medidas de la fórmula. Comprueba poniendo ${mval(ad, f, ask)} de nuevo.`,
      ],
      h: [ad.rc, hint2, hint3],
      p: {
        what: ad.what,
        shape: id === "areaTriangle" ? "tri" : id === "areaTrapezoid" ? "trap" : undefined,
      },
      meta: { shape: "reverse", kind: "rev", id, f, ask, A },
    });
  };

  /* ---- which figure has this measure ---------------------------------------------------------- */
  const which = (/** @type {string} */ id) => (/** @type {any} */ rng) => {
    const ad = AD[id];
    const lvl = rng.__level;
    const p = pool(ad, lvl);
    for (let tries = 0; tries < 300; tries++) {
      const right = rng.pick(p);
      const A = ad.area(right);
      const u = unitFor(rng);
      /** @type {any[]} */ const wrong = [];
      const take = (/** @type {string} */ tag, /** @type {any[]} */ cands) => {
        const free = cands.filter(
          (c) =>
            !sameFig(ad, c, right) && !wrong.some((w) => sameFig(ad, w.f, c)) && ad.area(c) !== A,
        );
        if (free.length && wrong.length < 3) wrong.push({ tag, f: rng.pick(free) });
      };
      // the figures a student would pick by making a named mistake: the mistaken formula gives exactly the target
      for (const [tag, fn] of Object.entries(ad.mis))
        take(
          tag,
          ad.all().filter((/** @type {any} */ c) => Math.abs(fn(c) - A) < 1e-9),
        );
      // close misses fill the rest: a nearby measure from a figure whose numbers look right
      for (const spread of [0.08, 0.18, 0.35])
        while (wrong.length < 3) {
          const before = wrong.length;
          take(
            "arithmetic-slip",
            ad
              .all()
              .filter(
                (/** @type {any} */ c) => Math.abs(ad.area(c) - A) <= Math.max(3, A * spread),
              ),
          );
          if (wrong.length === before) break;
        }
      if (wrong.length < 3) continue;
      const [rE, rS] = desc(ad, right, u);
      const wrongs = wrong.map((w) => ({
        v: desc(ad, w.f, u)[0],
        vEs: desc(ad, w.f, u)[1],
        tag: w.tag,
      }));
      const [wn, ws] = sayWhat[/** @type {"area"} */ (ad.what)];
      return mcI(rng, {
        q: [
          `Four ${ad.plural[0]} are described by their measures. Which one has ${aOf(ad)} ${wn} of ${fm(A)} ${U_MEAS(ad, u)}?`,
          `Cuatro ${ad.plural[1]} se describen con sus medidas. ¿Cuál tiene un ${ws} de ${fm(A)} ${U_MEAS(ad, u)}?`,
        ],
        right: rE,
        rightEs: rS,
        wrong: wrongs,
        x: [
          `Work the formula for each choice. The right one: ${ad.calc(right)} ${U_MEAS(ad, u)}. The others give ${wrong.map((w) => fm(ad.area(w.f))).join(", ")}.`,
          `Aplica la fórmula a cada opción. La correcta: ${ad.calc(right)} ${U_MEAS(ad, u)}. Las otras dan ${wrong.map((w) => fm(ad.area(w.f))).join(", ")}.`,
        ],
        h: [
          ad.rc,
          [
            `Find the ${wn} of each choice with the formula, one at a time.`,
            `Halla el ${ws} de cada opción con la fórmula, una a la vez.`,
          ],
          [
            "Only one choice gives exactly the number in the question. Cross out each choice that gives a different number.",
            "Solo una opción da exactamente el número de la pregunta. Tacha cada opción que dé otro número.",
          ],
        ],
        p: {
          what: ad.what,
          shape: id === "areaTriangle" ? "tri" : id === "areaTrapezoid" ? "trap" : undefined,
        },
        meta: {
          shape: "which",
          kind: "which",
          id,
          A,
          figs: [right, ...wrong.map((w) => w.f)].map((f2, i) => ({
            f: f2,
            txt: i === 0 ? rE : wrongs[i - 1].v,
          })),
        },
      });
    }
    throw new Error(`geometry2: ${id} found no four figures for a which-item`);
  };

  /* ---- compare two figures --------------------------------------------------------------------- */
  const compare = (/** @type {string} */ id) => (/** @type {any} */ rng) => {
    const ad = AD[id];
    const lvl = rng.__level;
    const p = pool(ad, lvl);
    let mode = rng.pick(["equal", "naive", "naive", "plain"]);
    for (let tries = 0; tries < 600; tries++) {
      if (tries === 60) mode = "naive";
      if (tries === 200) mode = "plain";
      const f1 = rng.pick(p);
      const A1 = ad.area(f1);
      const cands = p.filter((/** @type {any} */ f2) => {
        if (sameFig(ad, f1, f2)) return false;
        const A2 = ad.area(f2);
        if (mode === "equal") return Math.abs(A1 - A2) < 1e-9;
        if (mode === "naive") return A1 !== A2 && (ad.naive(f1) - ad.naive(f2)) * (A1 - A2) < 0;
        return A1 !== A2;
      });
      if (!cands.length) continue;
      const f2 = rng.pick(cands);
      const u = unitFor(rng);
      const verdict = Math.abs(A1 - ad.area(f2)) < 1e-9 ? "same" : A1 > ad.area(f2) ? "A" : "B";
      const [wn, ws] = sayWhat[/** @type {"area"} */ (ad.what)];
      const [d1e, d1s] = desc(ad, f1, u);
      const [d2e, d2s] = desc(ad, f2, u);
      const txt = {
        A: [`Figure A has the greater ${wn}.`, `La figura A tiene mayor ${ws}.`],
        B: [`Figure B has the greater ${wn}.`, `La figura B tiene mayor ${ws}.`],
        same: [`Both figures have the same ${wn}.`, `Las dos figuras tienen el mismo ${ws}.`],
      };
      const naiveWins =
        ad.naive(f1) > ad.naive(f2) ? "A" : ad.naive(f1) < ad.naive(f2) ? "B" : "same";
      const wrongFor = (/** @type {string} */ key) => ({
        v: txt[/** @type {"A"} */ (key)][0],
        vEs: txt[/** @type {"A"} */ (key)][1],
        tag:
          key === naiveWins && key !== verdict
            ? "added-instead"
            : key === "same"
              ? "doubled-instead"
              : "corners-matter",
        f:
          key === naiveWins && key !== verdict
            ? [
                "That compares the lengths added together. Area is a product, so find the area of each figure first.",
                "Eso compara las medidas sumadas. El área es un producto, así que halla primero el área de cada figura.",
              ]
            : key === "same"
              ? [
                  "Numbers that look alike do not make equal measures. Work the formula for both figures and compare the two results.",
                  "Números que se parecen no hacen medidas iguales. Aplica la fórmula a las dos figuras y compara los dos resultados.",
                ]
              : [
                  "Compare the two results of the formula, not the size of one measure. A bigger single measure does not mean a bigger result.",
                  "Compara los dos resultados de la fórmula, no el tamaño de una sola medida. Una medida más grande no significa un resultado mayor.",
                ],
      });
      const wrong = ["A", "B", "same"].filter((k) => k !== verdict).map(wrongFor);
      const fourthFb = MIS[ad.fourth[2]];
      wrong.push({
        v: ad.fourth[0],
        vEs: ad.fourth[1],
        tag: ad.fourth[2],
        f: typeof fourthFb === "function" ? fourthFb({ what: ad.what }) : fourthFb,
      });
      const art = ge(ad) === "f" ? "una" : "un";
      return mcI(rng, {
        q: [
          `Figure A is ${ad.like[0]}: ${d1e}. Figure B is ${ad.like[0]}: ${d2e}. Which statement is true?`,
          `La figura A es ${art} ${ad.like[1]}: ${d1s}. La figura B es ${art} ${ad.like[1]}: ${d2s}. ¿Qué afirmación es verdadera?`,
        ],
        right: txt[/** @type {"A"} */ (verdict)][0],
        rightEs: txt[/** @type {"A"} */ (verdict)][1],
        wrong,
        x: [
          `Figure A: ${ad.calc(f1)} ${U_MEAS(ad, u)}. Figure B: ${ad.calc(f2)} ${U_MEAS(ad, u)}. ${verdict === "same" ? "The two results are equal." : `Figure ${verdict} is greater.`}`,
          `Figura A: ${ad.calc(f1)} ${U_MEAS(ad, u)}. Figura B: ${ad.calc(f2)} ${U_MEAS(ad, u)}. ${verdict === "same" ? "Los dos resultados son iguales." : `La figura ${verdict} es mayor.`}`,
        ],
        h: [
          ad.rc,
          hint2,
          [
            `Find the ${wn} of Figure A, then of Figure B, and compare the two numbers.`,
            `Halla el ${ws} de la figura A, luego el de la figura B, y compara los dos números.`,
          ],
        ],
        p: {
          what: ad.what,
          shape: id === "areaTriangle" ? "tri" : id === "areaTrapezoid" ? "trap" : undefined,
        },
        meta: { shape: "compare", kind: "cmp", id, f1, f2, verdict, mode },
      });
    }
    throw new Error(`geometry2: ${id} found no pair for a compare-item`);
  };

  /* ---- one check for all three shapes ---------------------------------------------------------- */
  const checker = (/** @type {string} */ id) => (/** @type {any} */ item) => {
    const m = item.meta;
    const ad = AD[id];
    switch (m.kind) {
      case "rev": {
        if (!near(ad.indep(m.f), m.A))
          return `the figure's measure ${ad.indep(m.f)} is not the stated ${m.A}`;
        const t = G.value(item.a);
        return (
          near(ad.indep({ ...m.f, [m.ask]: t }), m.A) || `${m.ask} = ${item.a} does not give ${m.A}`
        );
      }
      case "which": {
        const right = m.figs[0];
        const idx = item.c.indexOf(right.txt);
        if (idx !== item.a) return `the keyed choice is not the figure with measure ${m.A}`;
        const hits = m.figs.filter((/** @type {any} */ x) => near(ad.indep(x.f), m.A));
        return (
          (hits.length === 1 && hits[0] === right) || `${hits.length} figures have measure ${m.A}`
        );
      }
      case "cmp": {
        const [a1, a2] = [ad.indep(m.f1), ad.indep(m.f2)];
        const want = near(a1, a2) ? "same" : a1 > a2 ? "A" : "B";
        const key = item.c[item.a];
        const ok = want === "same" ? /^Both/.test(key) : key.startsWith(`Figure ${want}`);
        return (want === m.verdict && ok) || `the key says "${key}" but A is ${a1} and B is ${a2}`;
      }
      default:
        return `unknown kind ${m.kind}`;
    }
  };

  /** Each family needs the level it is making for: make(rng, level) gets it, so the three builders read it from the stream. */
  const lvl =
    (/** @type {Function} */ fam, /** @type {number} */ level) => (/** @type {any} */ rng) => {
      rng.__level = level;
      return fam(rng);
    };
  const byLevel = (/** @type {(l: number) => Function[]} */ fn) => ({
    1: fn(1),
    2: fn(2),
    3: fn(3),
    4: fn(4),
  });
  for (const id of Object.keys(AD)) {
    if (!G.has(id)) continue;
    addShapes(
      id,
      {
        reverse: byLevel((l) => [lvl(reverse(id), l)]),
        which: byLevel((l) => [lvl(which(id), l)]),
        compare: byLevel((l) => [lvl(compare(id), l)]),
      },
      checker(id),
    );
  }
  void UN;
  void mean;
})();

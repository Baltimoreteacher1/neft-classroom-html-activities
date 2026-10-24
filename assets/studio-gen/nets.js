/**
 * Practice Studio generator: netViews (lesson 5-6, nets and views of three-dimensional figures, 6.G.4).
 *
 * Four skills, all computed: name the solid a net folds into from the faces it lists, count the faces of a solid, read the
 * front / side / top view of a stack of cubes, and decide how many faces of a box's net match. Feedback names each mistake
 * (the wrong solid, a view read from the wrong side, every cube counted instead of the squares seen) and never prints the key.
 * check() rebuilds the solid (vertices, edges, faces by Euler's rule) or the cube set and counts it another way.
 * Shares the item builders and feedback of geometry.js through StudioGen.geo.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  if (!G || !G.geo) throw new Error("nets.js needs assets/studio-gen/geometry.js loaded first");
  const { mcI, numI, unitOf, An, MIS } = G.geo;

  const PAIRS = [
    "Opposite faces of a box match, so they come in pairs. Count both faces of the pair.",
    "Las caras opuestas de una caja son iguales, así que vienen en pares. Cuenta las dos caras del par.",
  ];
  const OFF = [
    "Count again: list each kind of face and how many of that kind the solid has, then add them.",
    "Cuenta otra vez: haz una lista de cada tipo de cara y cuántas hay de ese tipo, y luego súmalas.",
  ];
  Object.assign(MIS, {
    "wrong-solid": [
      "Count each kind of face on the net and match it to a solid. The faces decide the solid, not the number of corners you see.",
      "Cuenta cada tipo de cara de la red y relaciónalo con un sólido. Las caras deciden el sólido, no la cantidad de esquinas que ves.",
    ],
    "wrong-view": [
      "That reads the table from a different side. The front view looks across the columns. The side view looks across the rows.",
      "Eso lee la tabla desde otro lado. La vista de frente mira a lo largo de las columnas. La vista lateral mira a lo largo de las filas.",
    ],
    "counted-all-cubes": [
      "That counts every cube, including the ones hidden behind taller stacks. A view shows only the squares you can see.",
      "Eso cuenta todos los cubos, incluso los que quedan escondidos detrás de pilas más altas. Una vista muestra solo los cuadrados que se ven.",
    ],
    "edges-for-faces": [
      "That counts edges (the folds), not faces. A face is a flat surface.",
      "Eso cuenta aristas (los dobleces), no caras. Una cara es una superficie plana.",
    ],
  });

  /** n-gon words: base shape of a prism or pyramid. */
  const POLY = /** @type {Record<number, string[]>} */ ({
    3: ["triangle", "triángulo", "triangles", "triángulos"],
    4: ["square", "cuadrado", "squares", "cuadrados"],
    5: ["pentagon", "pentágono", "pentagons", "pentágonos"],
    6: ["hexagon", "hexágono", "hexagons", "hexágonos"],
  });
  /** Solids by (kind, n). A solid: faces by Euler's rule from vertices and edges (V − E + F = 2). */
  const solids = [
    { id: "cube", kind: "cube", n: 4, en: "cube", es: "cubo" },
    { id: "rectPrism", kind: "box", n: 4, en: "rectangular prism", es: "prisma rectangular" },
    { id: "triPrism", kind: "prism", n: 3, en: "triangular prism", es: "prisma triangular" },
    { id: "pentPrism", kind: "prism", n: 5, en: "pentagonal prism", es: "prisma pentagonal" },
    { id: "hexPrism", kind: "prism", n: 6, en: "hexagonal prism", es: "prisma hexagonal" },
    { id: "triPyr", kind: "pyramid", n: 3, en: "triangular pyramid", es: "pirámide triangular" },
    { id: "sqPyr", kind: "pyramid", n: 4, en: "square pyramid", es: "pirámide cuadrada" },
    { id: "pentPyr", kind: "pyramid", n: 5, en: "pentagonal pyramid", es: "pirámide pentagonal" },
  ];
  const faceCount = (/** @type {any} */ s) =>
    s.kind === "pyramid" ? s.n + 1 : s.kind === "cube" || s.kind === "box" ? 6 : s.n + 2;
  /** Faces from Euler's rule: F = 2 − V + E, with V and E counted from how the solid is built (a different route from faceCount). */
  const eulerFaces = (/** @type {any} */ s) => {
    const v = s.kind === "pyramid" ? s.n + 1 : s.kind === "prism" ? 2 * s.n : 8;
    const e = s.kind === "pyramid" ? 2 * s.n : s.kind === "prism" ? 3 * s.n : 12;
    return 2 - v + e;
  };
  /** What the net is made of, in words: [English, Spanish]. */
  const netWords = (/** @type {any} */ s) => {
    if (s.kind === "cube") return ["6 squares", "6 cuadrados"];
    if (s.kind === "box")
      return ["6 rectangles in 3 matching pairs", "6 rectángulos en 3 pares iguales"];
    const p = POLY[s.n];
    if (s.kind === "prism")
      return [`2 ${p[2]} and ${s.n} rectangles`, `2 ${p[3]} y ${s.n} rectángulos`];
    return [
      `1 ${p[0]} and ${s.n} triangles`.replace("1 triangle and 3 triangles", "4 triangles"),
      `1 ${p[1]} y ${s.n} triángulos`.replace("1 triángulo y 3 triángulos", "4 triángulos"),
    ];
  };
  /** Classify a net by its face list alone (the check's route to the solid). */
  const classify = (/** @type {{shape: string, n: number}[]} */ faces) => {
    const c = (/** @type {string} */ sh) =>
      faces.filter((f) => f.shape === sh).reduce((a, f) => a + f.n, 0);
    const kinds = [...new Set(faces.map((f) => f.shape))].sort().join("+");
    if (kinds === "square" && c("square") === 6) return "cube";
    if (kinds === "rect" && c("rect") === 6) return "rectPrism";
    if (kinds === "tri" && c("tri") === 4) return "triPyr";
    if (kinds === "square+tri" && c("square") === 1 && c("tri") === 4) return "sqPyr";
    if (kinds === "rect+tri" && c("tri") === 2 && c("rect") === 3) return "triPrism";
    if (kinds === "pent+rect" && c("pent") === 2 && c("rect") === 5) return "pentPrism";
    if (kinds === "hex+rect" && c("hex") === 2 && c("rect") === 6) return "hexPrism";
    if (kinds === "pent+tri" && c("pent") === 1 && c("tri") === 5) return "pentPyr";
    return "?";
  };
  const facesOf = (/** @type {any} */ s) => {
    const sh = /** @type {Record<number, string>} */ ({
      3: "tri",
      4: "square",
      5: "pent",
      6: "hex",
    })[s.n];
    if (s.kind === "cube") return [{ shape: "square", n: 6 }];
    if (s.kind === "box") return [{ shape: "rect", n: 6 }];
    if (s.kind === "prism")
      return [
        { shape: sh, n: 2 },
        { shape: "rect", n: s.n },
      ];
    return [
      { shape: sh === "tri" ? "tri" : sh, n: 1 },
      { shape: "tri", n: s.n },
    ];
  };
  const solidById = (/** @type {string} */ id) => solids.find((s) => s.id === id);

  /** Name the solid a net folds into. */
  const nvSolid = (/** @type {number} */ level) => (/** @type {any} */ rng) => {
    const pool = level <= 2 ? solids.filter((s) => s.kind !== "prism" || s.n === 3) : solids;
    const s = rng.pick(pool);
    const u = unitOf(rng, { u: ["cm", "in", "ft", "m"] });
    const [we, ws] = netWords(s);
    const side = rng.int(3, 12);
    const wrong = rng
      .shuffle(solids.filter((o) => o.id !== s.id))
      .sort(
        (a, b) =>
          Number(b.kind === s.kind) - Number(a.kind === s.kind) ||
          Number(b.n === s.n) - Number(a.n === s.n),
      )
      .slice(0, 3)
      .map((o) => ({ v: o.en, vEs: o.es, tag: "wrong-solid" }));
    return mcI(rng, {
      q: [
        `A paper net is made of ${we}. Each edge that will be folded is about ${side} ${u.l} long. Which solid does the net fold into?`,
        `Una red de papel está hecha de ${ws}. Cada arista que se doblará mide unos ${side} ${u.l}. ¿En qué sólido se dobla la red?`,
      ],
      right: s.en,
      rightEs: s.es,
      wrong,
      x: [
        `The faces decide the solid: ${we}. That is a ${s.en}. A ${s.en} has ${faceCount(s)} faces.`,
        `Las caras deciden el sólido: ${ws}. Eso es ${s.id === "triPyr" || s.id === "sqPyr" || s.id === "pentPyr" ? "una" : "un"} ${s.es}. ${s.id === "triPyr" || s.id === "sqPyr" || s.id === "pentPyr" ? "Una" : "Un"} ${s.es} tiene ${faceCount(s)} caras.`,
      ],
      h: [
        [
          "A net unfolds a solid into flat faces. Count each kind of face.",
          "Una red despliega un sólido en caras planas. Cuenta cada tipo de cara.",
        ],
        [
          "Prisms have two matching bases and rectangles around them. Pyramids have one base and triangles that meet at a point.",
          "Los prismas tienen dos bases iguales y rectángulos alrededor. Las pirámides tienen una base y triángulos que se juntan en un punto.",
        ],
        [
          "Match the list of faces to the solid with the same faces.",
          "Relaciona la lista de caras con el sólido que tiene esas mismas caras.",
        ],
      ],
      p: { what: "surface" },
      meta: { kind: "solid", id: s.id, faces: facesOf(s), side },
    });
  };

  /** How many faces does a solid have? */
  const nvFaces = (/** @type {number} */ level) => (/** @type {any} */ rng) => {
    const pool = level <= 1 ? solids.filter((s) => s.kind !== "prism" || s.n <= 4) : solids;
    const s = rng.pick(pool);
    const F = faceCount(s);
    const side = rng.int(3, 12);
    const u = unitOf(rng, { u: ["cm", "in", "ft", "m"] });
    const edges = s.kind === "pyramid" ? 2 * s.n : s.kind === "prism" ? 3 * s.n : 12;
    const art = s.kind === "pyramid" ? ["A", "Una"] : ["A", "Un"];
    const base = s.kind === "pyramid" ? s.n : 2;
    return numI({
      q: [
        `${art[0]} ${s.en} model has edges about ${side} ${u.l} long. It is unfolded into a net. How many faces does the ${s.en} have?`,
        `${art[1]} ${s.es} de modelo tiene aristas de unos ${side} ${u.l}. Se despliega en una red. ¿Cuántas caras tiene ${art[1] === "Una" ? "la" : "el"} ${s.es}?`,
      ],
      a: F,
      unit: "faces",
      fw: [
        { v: edges, tag: "edges-for-faces", f: MIS["edges-for-faces"] },
        {
          v: s.kind === "pyramid" ? s.n : F - 2,
          tag: s.kind === "pyramid" ? "forgot-base" : "forgot-bases",
        },
        { v: F + 1, tag: "miscounted-faces", f: OFF },
        { v: base + s.n + 2, tag: "miscounted-faces", f: OFF },
      ],
      x: [
        `${s.kind === "pyramid" ? `1 base and ${s.n} triangles` : s.kind === "prism" ? `2 bases and ${s.n} rectangles` : "3 pairs of matching faces"}: ${faceCount(s)} faces. Check with the folds: ${edges} edges and ${s.kind === "pyramid" ? s.n + 1 : s.kind === "prism" ? 2 * s.n : 8} corners give faces = 2 − corners + edges = ${F}.`,
        `${s.kind === "pyramid" ? `1 base y ${s.n} triángulos` : s.kind === "prism" ? `2 bases y ${s.n} rectángulos` : "3 pares de caras iguales"}: ${faceCount(s)} caras. Comprueba con los dobleces: ${edges} aristas y ${s.kind === "pyramid" ? s.n + 1 : s.kind === "prism" ? 2 * s.n : 8} esquinas dan caras = 2 − esquinas + aristas = ${F}.`,
      ],
      h: [
        [
          "Unfold the solid in your mind. Each flat surface is one face.",
          "Despliega el sólido en tu mente. Cada superficie plana es una cara.",
        ],
        [
          s.kind === "pyramid"
            ? "A pyramid has one base and a triangle on every side of the base."
            : s.kind === "prism"
              ? "A prism has two bases and one rectangle for every side of the base."
              : "A box has three pairs of matching faces.",
          s.kind === "pyramid"
            ? "Una pirámide tiene una base y un triángulo en cada lado de la base."
            : s.kind === "prism"
              ? "Un prisma tiene dos bases y un rectángulo por cada lado de la base."
              : "Una caja tiene tres pares de caras iguales.",
        ],
        ["Add the bases to the faces around them.", "Suma las bases a las caras que las rodean."],
      ],
      p: { what: "surface" },
      meta: { kind: "faces", id: s.id },
    });
  };

  /** Stacks of cubes on a grid, read from the front, the side or the top. */
  const nvViews = (/** @type {number} */ level) => (/** @type {any} */ rng) => {
    const rows = level <= 2 ? 2 : 3;
    const cols = level <= 1 ? 2 : 3;
    const maxH = level <= 2 ? 3 : 4;
    let hgt;
    let seen;
    for (let tries = 0; ; tries++) {
      hgt = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => rng.int(level <= 2 ? 1 : 0, maxH)),
      );
      const total = hgt.flat().reduce((a, b) => a + b, 0);
      const front = hgt[0]
        .map((_, c) => Math.max(...hgt.map((r) => r[c])))
        .reduce((a, b) => a + b, 0);
      const side = hgt.map((r) => Math.max(...r)).reduce((a, b) => a + b, 0);
      const top = hgt.flat().filter((v) => v > 0).length;
      seen = { front, side, top, total };
      if (tries > 300 || (new Set([front, side, top, total]).size === 4 && total > 3)) break;
    }
    const ask = rng.pick(
      level >= 3 ? ["front", "side", "top", "front", "side"] : ["front", "side", "top"],
    );
    const key = seen[/** @type {"front"} */ (ask)];
    const names = {
      front: ["from the front", "de frente", "front"],
      side: ["from the right side", "desde el lado derecho", "side"],
      top: ["from above", "desde arriba", "top"],
    }[/** @type {"front"} */ (ask)];
    const wrongView = ask === "front" ? seen.side : seen.front;
    const hd = ["", ...Array.from({ length: cols }, (_, c) => `Col ${c + 1}`)];
    const tbl = hgt.map((r, i) => [
      i === 0 ? "Back" : i === rows - 1 ? "Front" : "Middle",
      ...r.map(String),
    ]);
    return numI({
      q: [
        `Cubes are stacked on a grid. The table shows how many cubes are in each stack. Rows go from the back to the front, and columns go from left to right. How many squares do you see when you look at the stacks ${names[0]}?`,
        `Se apilan cubos sobre una cuadrícula. La tabla muestra cuántos cubos hay en cada pila. Las filas van de atrás hacia el frente y las columnas van de izquierda a derecha. ¿Cuántos cuadrados ves cuando miras las pilas ${names[1]}?`,
      ],
      a: key,
      unit: "squares",
      fw: [
        { v: seen.total, tag: "counted-all-cubes", f: MIS["counted-all-cubes"] },
        { v: wrongView, tag: "wrong-view", f: MIS["wrong-view"] },
        { v: ask === "top" ? seen.front : seen.top, tag: "wrong-view", f: MIS["wrong-view"] },
      ],
      x: [
        ask === "front"
          ? `From the front you see the tallest stack in each column: ${hgt[0].map((_, c) => Math.max(...hgt.map((r) => r[c]))).join(" + ")} = ${key} squares.`
          : ask === "side"
            ? `From the side you see the tallest stack in each row: ${hgt.map((r) => Math.max(...r)).join(" + ")} = ${key} squares.`
            : `From above you see one square for every stack that has at least one cube: ${key} squares.`,
        ask === "front"
          ? `De frente ves la pila más alta de cada columna: ${hgt[0].map((_, c) => Math.max(...hgt.map((r) => r[c]))).join(" + ")} = ${key} cuadrados.`
          : ask === "side"
            ? `Desde el lado ves la pila más alta de cada fila: ${hgt.map((r) => Math.max(...r)).join(" + ")} = ${key} cuadrados.`
            : `Desde arriba ves un cuadrado por cada pila que tiene al menos un cubo: ${key} cuadrados.`,
      ],
      h: [
        [
          "Taller stacks hide the shorter stacks that are behind them.",
          "Las pilas más altas esconden las más bajas que están detrás.",
        ],
        [
          ask === "front"
            ? "Look across each column. Which stack in the column is tallest?"
            : ask === "side"
              ? "Look across each row. Which stack in the row is tallest?"
              : "Look straight down. Does each stack show a square?",
          ask === "front"
            ? "Mira a lo largo de cada columna. ¿Cuál es la pila más alta de la columna?"
            : ask === "side"
              ? "Mira a lo largo de cada fila. ¿Cuál es la pila más alta de la fila?"
              : "Mira hacia abajo. ¿Cada pila muestra un cuadrado?",
        ],
        [
          "Add up the squares you can see. Do not count hidden cubes.",
          "Suma los cuadrados que se ven. No cuentes los cubos escondidos.",
        ],
      ],
      p: { what: "volume" },
      viz: { t: "table", hd, rows: tbl },
      meta: { kind: "views", hgt, ask },
    });
  };

  /** A box's net: how many of its six rectangles are a given size? */
  const nvPairs = (/** @type {number} */ _level) => (/** @type {any} */ rng) => {
    const dims = rng.distinct(3, 2, 9).sort((a, b) => b - a);
    const [l, w, h] = dims;
    const u = unitOf(rng, { u: ["cm", "in", "ft"] });
    const pick = rng.int(0, 2);
    const sizes = [
      [l, w],
      [l, h],
      [w, h],
    ];
    const [p, q] = sizes[pick];
    const [Ae, As] = An({ n: "box", e: "caja", g: "f" });
    return mcI(rng, {
      q: [
        `${Ae} is ${l} ${u.l} long, ${w} ${u.l} wide, and ${h} ${u.l} tall. Its net has 6 rectangles. How many of the rectangles are ${p} ${u.l} by ${q} ${u.l}?`,
        `${As} mide ${l} ${u.l} de largo, ${w} ${u.l} de ancho y ${h} ${u.l} de alto. Su red tiene 6 rectángulos. ¿Cuántos de los rectángulos miden ${p} ${u.l} por ${q} ${u.l}?`,
      ],
      right: "2",
      wrong: [
        { v: "1", tag: "miscounted-faces", f: PAIRS },
        { v: "3", tag: "miscounted-faces", f: PAIRS },
        { v: "4", tag: "miscounted-faces", f: PAIRS },
      ],
      x: [
        `Opposite faces of a box match. Two faces are ${p} by ${q}: the pair that is ${["top and bottom", "front and back", "left and right"][pick]}.`,
        `Las caras opuestas de una caja son iguales. Dos caras miden ${p} por ${q}: el par de ${["arriba y abajo", "frente y atrás", "izquierda y derecha"][pick]}.`,
      ],
      h: [
        [
          "Opposite faces of a box are the same size.",
          "Las caras opuestas de una caja tienen el mismo tamaño.",
        ],
        [
          "Picture the box. Which face is opposite the one that is the size in the question?",
          "Imagina la caja. ¿Cuál cara está opuesta a la que tiene el tamaño de la pregunta?",
        ],
      ],
      p: { what: "surface" },
      meta: { kind: "pairs", l, w, h, pick },
    });
  };

  /** Three face areas of a box: find its longest edge (whole-number edges). */
  const nvBoxDims = (/** @type {any} */ rng) => {
    const dims = rng.distinct(3, 2, 8);
    const [a, b, c] = dims;
    const areas = [a * b, a * c, b * c];
    const u = unitOf(rng, { u: ["cm", "in", "ft", "m"] });
    const longest = Math.max(a, b, c);
    const [Ae, As] = An({ n: "box", e: "caja", g: "f" });
    return numI({
      q: [
        `${Ae} has a net with six rectangles. Their areas are ${areas[0]} ${u.a}, ${areas[0]} ${u.a}, ${areas[1]} ${u.a}, ${areas[1]} ${u.a}, ${areas[2]} ${u.a} and ${areas[2]} ${u.a}. Every edge is a whole number of ${u.l}. How long is the longest edge?`,
        `${As} tiene una red con seis rectángulos. Sus áreas son ${areas[0]} ${u.a}, ${areas[0]} ${u.a}, ${areas[1]} ${u.a}, ${areas[1]} ${u.a}, ${areas[2]} ${u.a} y ${areas[2]} ${u.a}. Cada arista mide un número entero de ${u.l}. ¿Cuánto mide la arista más larga?`,
      ],
      a: longest,
      unit: u.l,
      fw: [
        {
          v: Math.max(...areas),
          tag: "gave-area",
          f: [
            "That is the area of a face. The question asks for the length of an edge.",
            "Esa es el área de una cara. La pregunta pide la longitud de una arista.",
          ],
        },
        { v: Math.min(a, b, c), tag: "wrong-piece" },
        { v: Math.round(a + b + c), tag: "added-instead" },
      ],
      x: [
        `Each area is a product of two edges. Edges ${a}, ${b} and ${c} give ${a} × ${b} = ${areas[0]}, ${a} × ${c} = ${areas[1]} and ${b} × ${c} = ${areas[2]}. The longest edge is ${longest} ${u.l}.`,
        `Cada área es el producto de dos aristas. Las aristas ${a}, ${b} y ${c} dan ${a} × ${b} = ${areas[0]}, ${a} × ${c} = ${areas[1]} y ${b} × ${c} = ${areas[2]}. La arista más larga mide ${longest} ${u.l}.`,
      ],
      h: [
        [
          "Every face is a rectangle whose sides are two edges of the box. Each area is a product of two edges.",
          "Cada cara es un rectángulo cuyos lados son dos aristas de la caja. Cada área es el producto de dos aristas.",
        ],
        [
          "Think of factor pairs of each area. Only one set of three edges fits all three areas.",
          "Piensa en los pares de factores de cada área. Solo un conjunto de tres aristas cumple las tres áreas.",
        ],
        [
          "Test a guess: do your three edges multiply in pairs to make all three areas?",
          "Prueba una idea: ¿tus tres aristas, multiplicadas en pares, dan las tres áreas?",
        ],
      ],
      p: { what: "surface" },
      meta: { kind: "boxDims", areas, unit: u.l },
    });
  };

  G.register("netViews", {
    title: "Nets and views of solids",
    titleEs: "Redes y vistas de sólidos",
    levels: 4,
    make: (/** @type {any} */ rng, /** @type {number} */ level) =>
      rng.pick(
        {
          1: [nvSolid(1), nvFaces(1), nvViews(1)],
          2: [nvSolid(2), nvFaces(2), nvViews(2), nvPairs(2)],
          3: [nvSolid(3), nvViews(3), nvPairs(3), nvFaces(3)],
          4: [nvSolid(4), nvViews(4), nvBoxDims, nvViews(4)],
        }[/** @type {1} */ (level)],
      )(rng),
    check: (/** @type {any} */ item) => {
      const m = item.meta;
      switch (m.kind) {
        case "solid": {
          const want = classify(m.faces);
          const s = solidById(m.id);
          return (
            (want === m.id && s && item.c[item.a] === s.en) ||
            `faces list gives "${want}" but the key is "${item.c[item.a]}"`
          );
        }
        case "faces": {
          const s = solidById(m.id);
          return (
            (s && Number(item.a) === eulerFaces(s)) ||
            `${item.a} faces but Euler's rule gives ${s && eulerFaces(s)}`
          );
        }
        case "views": {
          // rebuild the solid as unit cubes and project it
          /** @type {Set<string>} */ const cubes = new Set();
          m.hgt.forEach((/** @type {number[]} */ r, /** @type {number} */ i) =>
            r.forEach((/** @type {number} */ v, /** @type {number} */ c) => {
              for (let z = 0; z < v; z++) cubes.add(`${i},${c},${z}`);
            }),
          );
          const proj = (/** @type {(i: number, c: number, z: number) => string} */ f) =>
            new Set(
              [...cubes].map((k) => {
                const [i, c, z] = k.split(",").map(Number);
                return f(i, c, z);
              }),
            ).size;
          const want =
            m.ask === "front"
              ? proj((_i, c, z) => `${c},${z}`)
              : m.ask === "side"
                ? proj((i, _c, z) => `${i},${z}`)
                : proj((i, c) => `${i},${c}`);
          return Number(item.a) === want || `view shows ${want}, key ${item.a}`;
        }
        case "pairs": {
          const sizes = [
            [m.l, m.w],
            [m.l, m.h],
            [m.w, m.h],
          ];
          const six = [...sizes, ...sizes];
          const [p, q] = sizes[m.pick];
          const n = six.filter((s2) => s2[0] === p && s2[1] === q).length;
          return String(n) === item.c[item.a] || `net has ${n} such rectangles`;
        }
        case "boxDims": {
          const [x, y, z] = m.areas;
          // the edges are the square roots of pairwise products over the third area
          const e = [Math.sqrt((x * y) / z), Math.sqrt((x * z) / y), Math.sqrt((y * z) / x)];
          return (
            Math.abs(Math.max(...e) - Number(item.a)) < 1e-9 || `longest edge is ${Math.max(...e)}`
          );
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });
})();

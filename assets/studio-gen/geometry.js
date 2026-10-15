/**
 * Practice Studio generators: geometry (lessons 5-1 ... 5-10).
 *
 * areaParallelogram areaTriangle areaTrapezoid areaComposite volumePrism surfaceAreaPrism
 * surfaceAreaPyramid areaRegularPolygon. Every item is bilingual, carries a hint ladder, named
 * misconception tags (item.tag[] for mc, fw[].tag for typed) and a check() that recomputes the key
 * another way (shoelace area, cell and cube counting, exposed unit faces).
 *
 * Figures use only StudioViz shape / prism specs. Unknown measures are drawn as "?". Pyramid and
 * triangular-prism items show one face as a tri. Obtuse triangles, right trapezoids and houses are
 * not generated: StudioViz cannot draw them yet. Fraction edges print as decimals in the prism figure.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  if (!G) throw new Error("geometry.js needs assets/studio-gen/core.js loaded first");
  const fm = G.fmt;

  /* ====================================================================================== */
  /* Shared kit                                                                              */
  /* ====================================================================================== */

  /** Units. `sq` is the spoken name of one square unit, used inside sentences. */
  const UN = {
    cm: { l: "cm", a: "cm²", v: "cm³", sq: "square centimeter", sqEs: "centímetro cuadrado" },
    m: { l: "m", a: "m²", v: "m³", sq: "square meter", sqEs: "metro cuadrado" },
    in: { l: "in", a: "in²", v: "in³", sq: "square inch", sqEs: "pulgada cuadrada" },
    ft: { l: "ft", a: "ft²", v: "ft³", sq: "square foot", sqEs: "pie cuadrado" },
  };
  const unitOf = (rng, c, only) => {
    const ok = only ? c.u.filter((k) => only.includes(k)) : c.u;
    return UN[rng.pick(ok.length ? ok : c.u)];
  };

  /** Noun phrases from a context {n: english, e: spanish, g: "m"|"f"}: [English, Spanish]. */
  const vowel = (s) => /^[aeiou]/i.test(s);
  const An = (c) => [`${vowel(c.n) ? "An" : "A"} ${c.n}`, `${c.g === "f" ? "Una" : "Un"} ${c.e}`];
  const The = (c) => [`The ${c.n}`, `${c.g === "f" ? "La" : "El"} ${c.e}`];
  /** "of the garden bed" / "del jardín", for sentences like "the area of ...". */
  const ofThe = (c) => [`of the ${c.n}`, `${c.g === "f" ? "de la" : "del"} ${c.e}`];

  /** Pythagorean triples: a slanted side with a whole-number overhang, so every figure is drawn true. */
  const TRIP = [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [9, 12, 15],
    [8, 15, 17],
    [12, 16, 20],
    [15, 20, 25],
    [7, 24, 25],
  ];
  /** {x, h, s} with x² + h² = s², x the sideways lean, h the height, s the slanted side. */
  function lean(rng, { hMin = 3, hMax = 16, xMin = 3, xMax = 99 } = {}) {
    const all = [];
    for (const [p, q, c] of TRIP) all.push({ x: p, h: q, s: c }, { x: q, h: p, s: c });
    return rng.pick(all.filter((o) => o.h >= hMin && o.h <= hMax && o.x >= xMin && o.x <= xMax));
  }
  /** An integer in [lo, hi] that is not in `avoid` (so a hidden coincidence never decides an item). */
  const intNot = (rng, lo, hi, avoid) => {
    let v;
    do v = rng.int(lo, hi);
    while (avoid.includes(v));
    return v;
  };

  /* ---- reading numbers and sums back out of answer text (used by every check) ---------------- */
  const NUMRE = /^(\d+ \d+\/\d+|\d+\/\d+|\d*\.?\d+)/;
  /** Leading number of a choice such as "45 cm²" or "2 1/2 ft³". */
  const lead = (t) => {
    const m = String(t).trim().match(NUMRE);
    return m ? G.value(m[1]) : Number.NaN;
  };
  /** What follows the leading number: the unit. */
  const unitPart = (t) => String(t).trim().replace(NUMRE, "").trim();
  /** Value of a sum such as "½ × (8 + 12) × 5 − 2 × 3". Throws on anything else. */
  function calc(src) {
    const s = String(src)
      .replace(/\s+/g, "")
      .replace(/½/g, "(1/2)")
      .replace(/[×·]/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-");
    let i = 0;
    const atom = () => {
      if (s[i] === "(") {
        i++;
        const v = sum();
        i++;
        return v;
      }
      const m = /^\d+(\.\d+)?/.exec(s.slice(i));
      if (!m) throw new Error(`geometry: cannot read "${src}"`);
      i += m[0].length;
      return Number(m[0]);
    };
    const prod = () => {
      let v = atom();
      while (s[i] === "*" || s[i] === "/") {
        const op = s[i++];
        const r = atom();
        v = op === "*" ? v * r : v / r;
      }
      return v;
    };
    const sum = () => {
      let v = prod();
      while (s[i] === "+" || s[i] === "-") {
        const op = s[i++];
        const r = prod();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    };
    const v = sum();
    if (i !== s.length) throw new Error(`geometry: cannot read "${src}"`);
    return v;
  }
  const near = (x, y) => Math.abs(x - y) <= 1e-7 * Math.max(1, Math.abs(y));

  /* ---- independent geometry used by the checks ------------------------------------------------ */
  /** Shoelace area of a polygon given as [[x, y], ...]. */
  const shoelace = (p) =>
    Math.abs(
      p.reduce((s, [x, y], i) => {
        const [u, v] = p[(i + 1) % p.length];
        return s + x * v - u * y;
      }, 0),
    ) / 2;
  /** Parallelogram with base b, height h, top edge shifted by x. */
  const paraPts = (b, h, x) => [
    [0, 0],
    [b, 0],
    [b + x, h],
    [x, h],
  ];
  /** Unit squares on the surface of an l × w × h block of whole unit cubes (counts exposed faces). */
  function exposedFaces(l, w, h) {
    const has = (i, j, k) => i >= 0 && i < l && j >= 0 && j < w && k >= 0 && k < h;
    let n = 0;
    for (let i = 0; i < l; i++)
      for (let j = 0; j < w; j++)
        for (let k = 0; k < h; k++)
          for (const [di, dj, dk] of [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 1, 0],
            [0, -1, 0],
            [0, 0, 1],
            [0, 0, -1],
          ])
            if (!has(i + di, j + dj, k + dk)) n++;
    return n;
  }

  /* ---- figures: only emits spec objects for StudioViz (docs/specs/practice-studio-v2.md s.3) -- */
  const clean = (o) => {
    const out = {};
    for (const k of Object.keys(o)) if (o[k] !== undefined) out[k] = o[k];
    return out;
  };
  const shape = (s, dims, unit, extra = {}) =>
    clean({ t: "shape", s, dims: clean(dims), labels: true, unit, ...extra });
  const prismViz = (l, w, h, unit, extra = {}) =>
    clean({ t: "prism", l, w, h, unit, labels: true, ...extra });

  /* ---- named misconceptions: one place for the feedback every wrong choice gets --------------- */
  // Each is a pair [English, Spanish] or a function of {what: "area" | "volume" | "surface"} returning one.
  // The feedback says what the student probably did and where it goes wrong, never the right answer.
  const MIS = {
    "used-slant-height": [
      "That uses a slanted side as the height. A slanted side leans over. The height is the segment that makes a right angle with the base.",
      "Eso usa un lado inclinado como altura. Un lado inclinado se inclina. La altura es el segmento que forma un ángulo recto con la base.",
    ],
    "added-instead": (p) =>
      ({
        area: [
          "That adds lengths. Area is the number of squares inside the shape, so lengths are multiplied, not added.",
          "Eso suma medidas. El área es la cantidad de cuadrados dentro de la figura, así que las medidas se multiplican, no se suman.",
        ],
        volume: [
          "That adds the edges. Volume is the number of cubes that fill the box, so the edges are multiplied, not added.",
          "Eso suma las aristas. El volumen es la cantidad de cubos que llenan la caja, así que las aristas se multiplican, no se suman.",
        ],
        surface: [
          "That adds lengths. Surface area adds up the areas of the faces, and each face area is a product of two lengths.",
          "Eso suma medidas. El área de superficie suma las áreas de las caras, y el área de cada cara es un producto de dos medidas.",
        ],
      })[p.what || "area"],
    "perimeter-for-area": [
      "That is the distance around the edge, the perimeter. Area is the space inside.",
      "Eso es la distancia alrededor del borde, el perímetro. El área es el espacio de adentro.",
    ],
    "took-half": [
      "Half belongs to triangles. A parallelogram is cut and slid into a rectangle, so it uses the full base × height.",
      "La mitad es para los triángulos. Un paralelogramo se corta y se desliza hasta formar un rectángulo, así que usa la base × altura completa.",
    ],
    "forgot-half": (p) =>
      p.shape === "trap"
        ? [
            "That skips the half. (b₁ + b₂) × height fills a parallelogram made from TWO trapezoids, and one trapezoid is half of it.",
            "Eso se salta la mitad. (b₁ + b₂) × altura llena un paralelogramo hecho con DOS trapecios, y un trapecio es la mitad.",
          ]
        : [
            "That skips the half. Base × height is the whole rectangle, and a triangle is only half of it.",
            "Eso se salta la mitad. Base × altura es el rectángulo completo, y un triángulo es solo la mitad.",
          ],
    "unit-mismatch": (p) =>
      p.what === "volume"
        ? [
            "Check the unit. Volume counts cubes, so its unit has a small 3.",
            "Revisa la unidad. El volumen cuenta cubos, así que su unidad lleva un 3 pequeño.",
          ]
        : [
            "Check the unit. Area counts squares, so its unit has a small 2.",
            "Revisa la unidad. El área cuenta cuadrados, así que su unidad lleva un 2 pequeño.",
          ],
    "wrong-pair": [
      "A height only goes with the side it makes a right angle with. Pair each height with its own side.",
      "Una altura solo va con el lado con el que forma un ángulo recto. Combina cada altura con su propio lado.",
    ],
    "multiplied-sides": [
      "Those lengths do not meet at a right angle, so they cannot be a base and its height.",
      "Esas medidas no forman un ángulo recto, así que no pueden ser una base y su altura.",
    ],
    "treated-as-square": [
      "A rhombus has equal sides, but it is not a square. Its height is shorter than its side.",
      "Un rombo tiene lados iguales, pero no es un cuadrado. Su altura es menor que su lado.",
    ],
    "multiplied-instead": [
      "A missing length comes from dividing the total by the lengths you know. Multiplying only makes a bigger number.",
      "Una medida que falta sale de dividir el total entre las medidas que conoces. Multiplicar solo da un número más grande.",
    ],
    "subtracted-instead": [
      "Subtracting does not undo a product. To find a missing factor, divide.",
      "Restar no deshace un producto. Para hallar un factor que falta, divide.",
    ],
    "same-height": [
      "Heights to different sides are usually different. The area stays the same, so a longer side has a shorter height.",
      "Las alturas a lados distintos suelen ser distintas. El área no cambia, así que un lado más largo tiene una altura más corta.",
    ],
    "gave-area": [
      "That is the area. The question asks for a length.",
      "Esa es el área. La pregunta pide una longitud.",
    ],
    "forgot-rate": [
      "That is the area, but the question asks for a price. Each square unit costs money, so one more step is needed.",
      "Esa es el área, pero la pregunta pide un precio. Cada unidad cuadrada cuesta dinero, así que falta un paso más.",
    ],
    "corners-matter": [
      "Square corners do not make more area. Compare the base and the height of each shape.",
      "Las esquinas cuadradas no dan más área. Compara la base y la altura de cada figura.",
    ],
    "doubled-instead": [
      "Nothing doubles here. Compare the base and the height of each shape.",
      "Aquí nada se duplica. Compara la base y la altura de cada figura.",
    ],
    "slant-longer": [
      "A longer slanted side does not add area. Only the base and the perpendicular height count.",
      "Un lado inclinado más largo no agrega área. Solo cuentan la base y la altura perpendicular.",
    ],
  };
  const why = (w, p) => {
    if (w.f) return w.f;
    const m = MIS[w.tag];
    if (!m) throw new Error(`geometry: no feedback written for "${w.tag}"`);
    return typeof m === "function" ? m(p || {}) : m;
  };

  /* ---- item builders -------------------------------------------------------------------------- */
  /** Every student sentence is a pair [English, Spanish]; a bare string is shared by both. */
  const pr = (p) => (Array.isArray(p) ? p : [p, p]);

  /**
   * Multiple choice, always four choices.
   *   right   text of the right choice        rightEs  its Spanish text, when it holds words
   *   wrong   [{v, tag, vEs?, f?}] best first; feedback comes from MIS[tag](p) unless f is given
   *   key     text -> identity, so two choices with equal value are never both offered
   */
  function mcI(rng, o) {
    const key = o.key || ((t) => String(t).trim().toLowerCase());
    const seen = new Set([key(o.right)]);
    const wrong = [];
    for (const w of o.wrong) {
      const k = key(w.v);
      if (seen.has(k)) continue;
      seen.add(k);
      wrong.push(w);
    }
    const [q, qEs] = pr(o.q);
    const [x, xEs] = pr(o.x);
    const item = G.mc(rng, {
      q,
      qEs,
      right: o.right,
      wrong: wrong.map((w) => ({ v: w.v, f: why(w, o.p)[0], fEs: why(w, o.p)[1] })),
      x,
      xEs,
      h: o.h.map((p) => pr(p)[0]),
      hEs: o.h.map((p) => pr(p)[1]),
      viz: o.viz,
      meta: o.meta,
    });
    if (item.c.length !== 4)
      throw new Error(`geometry: ${o.meta.kind} offered ${item.c.length} choices, needs 4`);
    const low = (t) => String(t).trim().toLowerCase();
    const tagOf = new Map(wrong.map((w) => [low(w.v), w.tag || ""]));
    item.tag = item.c.map((c, i) => (i === item.a ? "" : tagOf.get(low(c)) || ""));
    if (o.rightEs || wrong.some((w) => w.vEs)) {
      const es = new Map(wrong.map((w) => [low(w.v), w.vEs || ""]));
      item.cEs = item.c.map((c, i) => (i === item.a ? o.rightEs || "" : es.get(low(c)) || ""));
    }
    return item;
  }

  /** Typed number. a: the answer. fw: [{v, tag, f?}] the common wrong values, with feedback. */
  function numI(o) {
    const ans = G.value(o.a);
    const seen = new Set([fm(ans)]);
    const fw = [];
    for (const w of o.fw || []) {
      const v = G.value(w.v);
      if (!Number.isFinite(v) || v <= 0 || seen.has(fm(v))) continue;
      if (Math.abs(v * 100 - Math.round(v * 100)) > 1e-6) continue; // nobody types 6.324555
      seen.add(fm(v));
      const [f, fEs] = why(w, o.p);
      fw.push({ v: fm(v), f, fEs, tag: w.tag });
    }
    const [q, qEs] = pr(o.q);
    const [x, xEs] = pr(o.x);
    return G.num({
      q,
      qEs,
      a: fm(ans),
      unit: o.unit,
      tol: o.tol,
      fw,
      x,
      xEs,
      h: o.h.map((p) => pr(p)[0]),
      hEs: o.h.map((p) => pr(p)[1]),
      viz: o.viz,
      meta: o.meta,
    });
  }

  /** Checks: true, or a string saying how the key disagrees with the recomputed answer. */
  const wantNum = (item, want, what) =>
    near(G.value(item.a), want) || `${what}: key ${item.a}, recomputed ${fm(want)}`;
  const wantChoice = (item, value, unit, what) => {
    const t = item.c[item.a];
    return (
      (near(lead(t), value) && unitPart(t) === unit) ||
      `${what}: key "${t}", recomputed ${fm(value)} ${unit}`
    );
  };
  /** The picked sum must be the only choice with this value. */
  const wantSum = (item, value, what) => {
    const vals = item.c.map(calc);
    return (
      (near(vals[item.a], value) && vals.filter((v) => near(v, value)).length === 1) ||
      `${what}: key "${item.c[item.a]}" = ${fm(vals[item.a])}, recomputed ${fm(value)}`
    );
  };

  /** Registers a generator whose levels are lists of family functions (rng) -> item. */
  function reg(id, title, titleEs, fams, check) {
    G.register(id, {
      title,
      titleEs,
      levels: 4,
      make: (rng, level) => rng.pick(fams[level])(rng),
      check,
    });
  }

  /* ---- hint 1 for the formula families ------------------------------------------------------- */
  const RC = {
    para: [
      "The area of a parallelogram is base × height. The height makes a right angle with the base.",
      "El área de un paralelogramo es base × altura. La altura forma un ángulo recto con la base.",
    ],
    rhombus: [
      "A rhombus is a parallelogram with four equal sides, so area = base × height. Any side can be the base.",
      "Un rombo es un paralelogramo con cuatro lados iguales, así que área = base × altura. Cualquier lado puede ser la base.",
    ],
    missing: [
      "A missing length is the number that multiplies the length you know to make the total.",
      "Una medida que falta es el número que, multiplicado por la medida que conoces, da el total.",
    ],
  };

  /* ====================================================================================== */
  /* 1. areaParallelogram  (5-1)                                                             */
  /* ====================================================================================== */
  const CP = [
    { n: "garden bed", e: "jardín", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "quilt patch", e: "parche de la colcha", g: "m", u: ["in", "cm"] },
    { n: "stained-glass panel", e: "panel de vitral", g: "m", u: ["in", "cm"] },
    { n: "playground mat", e: "colchoneta del patio", g: "f", u: ["ft", "m"], pay: 1 },
    { n: "floor tile", e: "loseta del piso", g: "f", u: ["in", "cm"] },
    { n: "banner", e: "pancarta", g: "f", u: ["ft", "in"], pay: 1 },
    { n: "rug", e: "alfombra", g: "f", u: ["ft", "m"], pay: 1 },
    {
      n: "angled parking space",
      e: "espacio de estacionamiento en ángulo",
      g: "m",
      u: ["ft", "m"],
    },
    { n: "field plot", e: "terreno", g: "m", u: ["m", "ft"], pay: 1 },
  ];
  /** An unknown measure: StudioViz prints a symbol as it is, and a dimension left out is never labelled. */
  const Q = "?";
  const para = (b, ht, sl, u) => shape("para", { b, h: ht, side: sl }, u.l);
  const rhomb = (sd, ht, u) => shape("rhombus", { side: sd, h: ht }, u.l);
  const areaX = (b, ht, ar, u, tail = "") => [
    `Area = base × height = ${b} × ${ht} = ${ar} ${u.a}. Area counts square units, so the unit is ${u.a}, not ${u.l}.${tail[0] || ""}`,
    `Área = base × altura = ${b} × ${ht} = ${ar} ${u.a}. El área cuenta unidades cuadradas, así que la unidad es ${u.a}, no ${u.l}.${tail[1] || ""}`,
  ];
  const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** Which product gives the area?  (level 1) */
  const pProd = (rng) => {
    const c = rng.pick(CP);
    const u = unitOf(rng, c);
    const { x, h: ht, s: sl } = lean(rng, { hMax: 12, xMax: 12 });
    const b = intNot(rng, Math.max(x, 5), 16, [ht, sl]);
    const [Ae, As] = An(c);
    return mcI(rng, {
      q: [
        `${Ae} is shaped like a parallelogram. Its base is ${b} ${u.l}, its dashed height is ${ht} ${u.l}, and its slanted side is ${sl} ${u.l}. Which product gives the area?`,
        `${As} tiene forma de paralelogramo. Su base mide ${b} ${u.l}, su altura punteada mide ${ht} ${u.l} y su lado inclinado mide ${sl} ${u.l}. ¿Qué producto da el área?`,
      ],
      right: `${b} × ${ht}`,
      key: calc,
      wrong: [
        { v: `${b} × ${sl}`, tag: "used-slant-height" },
        { v: `${b} + ${ht}`, tag: "added-instead" },
        { v: `2 × (${b} + ${sl})`, tag: "perimeter-for-area" },
        { v: `${sl} × ${ht}`, tag: "wrong-pair" },
        { v: `${b} + ${sl}`, tag: "added-instead" },
      ],
      x: areaX(b, ht, b * ht, u, [
        ` The slanted side (${sl} ${u.l}) leans, so it is not used.`,
        ` El lado inclinado (${sl} ${u.l}) se inclina, así que no se usa.`,
      ]),
      h: [
        RC.para,
        [
          "Which length is the dashed segment? It meets the base at a right angle. A slanted side is not the height.",
          "¿Cuál medida es el segmento punteado? Se une a la base en un ángulo recto. Un lado inclinado no es la altura.",
        ],
        [
          "Find the two measurements that meet at a right angle, and multiply them.",
          "Busca las dos medidas que forman un ángulo recto y multiplícalas.",
        ],
      ],
      viz: para(b, ht, sl, u),
      meta: { kind: "prod", b, ht, ov: x, sl, u: u.l },
    });
  };

  /**
   * Area from base and height.  slant: the slanted side is given too (a distractor).
   * mc: choose among areas with named wrong ones; otherwise typed.
   */
  const pFind = (o) => (rng) => {
    const c = rng.pick(CP);
    const u = unitOf(rng, c);
    const { x, h: ht, s: sl } = lean(rng, o.slant ? { hMax: 15, xMax: 24 } : { hMax: 9, xMax: 12 });
    const b = o.slant ? intNot(rng, Math.max(7, x), 24, [ht, sl]) : intNot(rng, 4, 12, [ht]);
    const ar = b * ht;
    const [Ae, As] = An(c);
    const withSl = o.slant
      ? [`, and its slanted side is ${sl} ${u.l}`, ` y su lado inclinado mide ${sl} ${u.l}`]
      : ["", ""];
    const ask = o.mc
      ? ["Which choice is its area?", "¿Qué opción es su área?"]
      : ["What is its area?", "¿Cuál es su área?"];
    const base = {
      q: [
        `${Ae} is shaped like a parallelogram. Its base is ${b} ${u.l} and its height is ${ht} ${u.l}${withSl[0]}. ${ask[0]}`,
        `${As} tiene forma de paralelogramo. Su base mide ${b} ${u.l}${o.slant ? "," : " y"} su altura mide ${ht} ${u.l}${withSl[1]}. ${ask[1]}`,
      ],
      x: areaX(
        b,
        ht,
        ar,
        u,
        o.slant
          ? [
              ` The slanted side (${sl} ${u.l}) leans, so it is not the height.`,
              ` El lado inclinado (${sl} ${u.l}) se inclina, así que no es la altura.`,
            ]
          : [],
      ),
      h: [
        RC.para,
        [
          `Here the base is ${b} ${u.l} and the height is ${ht} ${u.l}.${o.slant ? " One of the three lengths is not needed." : ""}`,
          `Aquí la base mide ${b} ${u.l} y la altura mide ${ht} ${u.l}.${o.slant ? " Una de las tres medidas no se necesita." : ""}`,
        ],
        [
          `Multiply ${b} × ${ht}. Then write the unit with a small 2: ${u.a}.`,
          `Multiplica ${b} × ${ht}. Luego escribe la unidad con un 2 pequeño: ${u.a}.`,
        ],
      ],
      viz: para(b, ht, o.slant ? sl : undefined, u),
      p: { what: "area" },
    };
    const cand = [
      o.slant && { k: "used-slant-height", v: b * sl },
      o.slant && { k: "perimeter-for-area", v: 2 * (b + sl) },
      { k: "added-instead", v: b + ht },
      { k: "took-half", v: ar / 2 },
      !o.slant && { k: "perimeter-for-area", v: 2 * (b + ht) },
    ].filter(Boolean);
    if (o.mc)
      return mcI(rng, {
        ...base,
        right: `${ar} ${u.a}`,
        wrong: [
          ...cand.slice(0, 1),
          { v: `${ar} ${u.l}`, tag: "unit-mismatch" },
          ...cand.slice(1, 2),
          { v: `${ar} ${u.v}`, tag: "unit-mismatch" },
          ...cand.slice(2),
        ].map((w) => (w.k ? { v: `${fm(w.v)} ${u.a}`, tag: w.k } : w)),
        meta: { kind: "areaMC", b, ht, ov: x, u: u.l, ua: u.a },
      });
    return numI({
      ...base,
      a: ar,
      unit: u.a,
      fw: cand.map((w) => ({ v: w.v, tag: w.k })),
      meta: { kind: "area", b, ht, ov: x, u: u.l },
    });
  };

  /** A rhombus: area from a side and the height (miss: find the side or the height from the area). */
  const pRhombus = (o) => (rng) => {
    const c = rng.pick(CP);
    const u = unitOf(rng, c);
    const sd = rng.int(6, 15);
    const ht = intNot(rng, 3, sd - 2, [sd]);
    const ar = sd * ht;
    const findS = o.miss && rng.chance(0.4);
    const [Ae, As] = An(c);
    const known = findS ? ht : sd;
    const m = o.miss
      ? {
          q: findS
            ? [
                `${Ae} is shaped like a rhombus. Its area is ${ar} ${u.a} and its height is ${ht} ${u.l}. How long is each side?`,
                `${As} tiene forma de rombo. Su área es ${ar} ${u.a} y su altura mide ${ht} ${u.l}. ¿Cuánto mide cada lado?`,
              ]
            : [
                `${Ae} is shaped like a rhombus. Its area is ${ar} ${u.a} and each side is ${sd} ${u.l} long. What is its height?`,
                `${As} tiene forma de rombo. Su área es ${ar} ${u.a} y cada lado mide ${sd} ${u.l}. ¿Cuánto mide su altura?`,
              ],
          a: findS ? sd : ht,
          unit: u.l,
          fw: [
            { v: ar * known, tag: "multiplied-instead" },
            { v: ar - known, tag: "subtracted-instead" },
            { v: ar / known / 2, tag: "took-half" },
          ],
          x: [
            `A rhombus is a parallelogram, so area = base × height, where the base is one side. The missing length = ${ar} ÷ ${known} = ${findS ? sd : ht} ${u.l}.`,
            `Un rombo es un paralelogramo, así que área = base × altura, donde la base es un lado. La medida que falta = ${ar} ÷ ${known} = ${findS ? sd : ht} ${u.l}.`,
          ],
          h: [
            RC.rhombus,
            [`Think: ${known} × ? = ${ar}.`, `Piensa: ${known} × ? = ${ar}.`],
            [`Divide ${ar} by ${known}.`, `Divide ${ar} entre ${known}.`],
          ],
          viz: rhomb(findS ? Q : sd, findS ? ht : Q, u),
          meta: { kind: "rhomMiss", A: ar, known, u: u.l },
        }
      : {
          q: [
            `${Ae} is shaped like a rhombus. Every side is ${sd} ${u.l} long. Its height, the distance between two opposite sides, is ${ht} ${u.l}. What is its area?`,
            `${As} tiene forma de rombo. Cada lado mide ${sd} ${u.l}. Su altura, la distancia entre dos lados opuestos, mide ${ht} ${u.l}. ¿Cuál es su área?`,
          ],
          a: ar,
          unit: u.a,
          fw: [
            { v: sd * sd, tag: "treated-as-square" },
            { v: 4 * sd, tag: "perimeter-for-area" },
            { v: sd + ht, tag: "added-instead" },
            { v: ar / 2, tag: "took-half" },
          ],
          x: [
            `A rhombus is a parallelogram, and any side can be the base. Area = base × height = ${sd} × ${ht} = ${ar} ${u.a}.`,
            `Un rombo es un paralelogramo y cualquier lado puede ser la base. Área = base × altura = ${sd} × ${ht} = ${ar} ${u.a}.`,
          ],
          h: [
            RC.rhombus,
            [
              `Use one side as the base (${sd} ${u.l}) and the height that makes a right angle with it (${ht} ${u.l}).`,
              `Usa un lado como base (${sd} ${u.l}) y la altura que forma un ángulo recto con él (${ht} ${u.l}).`,
            ],
            [
              `Multiply ${sd} × ${ht}. Do not multiply the side by itself.`,
              `Multiplica ${sd} × ${ht}. No multipliques el lado por sí mismo.`,
            ],
          ],
          viz: rhomb(sd, ht, u),
          meta: { kind: "rhombus", sd, ht, u: u.l },
        };
    return numI({ ...m, p: { what: "area" } });
  };

  /** A missing base or height from the area.  trap: the slanted side is given too and must not be used. */
  const pMiss = (o) => (rng) => {
    const c = rng.pick(CP);
    const u = unitOf(rng, c);
    const { x, h: ht, s: sl } = lean(rng, { hMax: 15, xMax: 24 });
    const b = intNot(rng, Math.max(6, x), 20, [ht, sl]);
    const ar = b * ht;
    const findB = !o.trap && rng.chance(0.4);
    const [Te, Ts] = The(c);
    const known = findB ? ht : b;
    const [ske, sks] = findB ? ["height", "altura"] : ["base", "base"];
    const [ase, ass] = findB ? ["base", "base"] : ["height", "altura"];
    return numI({
      q: [
        `${Te} is shaped like a parallelogram. Its area is ${ar} ${u.a}, its ${ske} is ${known} ${u.l}${o.trap ? `, and its slanted side is ${sl} ${u.l}` : ""}. What is its ${ase}?`,
        `${Ts} tiene forma de paralelogramo. Su área es ${ar} ${u.a}, su ${sks} mide ${known} ${u.l}${o.trap ? ` y su lado inclinado mide ${sl} ${u.l}` : ""}. ¿Cuánto mide su ${ass}?`,
      ],
      a: findB ? b : ht,
      unit: u.l,
      fw: [
        { v: ar * known, tag: "multiplied-instead" },
        { v: ar - known, tag: "subtracted-instead" },
        o.trap && { v: ar / sl, tag: "used-slant-height" },
        o.trap && { v: sl, tag: "used-slant-height" },
        { v: ar / known / 2, tag: "took-half" },
      ].filter(Boolean),
      x: [
        `Area = base × height, so the missing ${ase} = area ÷ ${ske} = ${ar} ÷ ${known} = ${findB ? b : ht} ${u.l}. Check: ${b} × ${ht} = ${ar} ${u.a}.${o.trap ? " The slanted side is not used." : ""}`,
        `Área = base × altura, así que la ${ass} que falta = área ÷ ${sks} = ${ar} ÷ ${known} = ${findB ? b : ht} ${u.l}. Comprueba: ${b} × ${ht} = ${ar} ${u.a}.${o.trap ? " El lado inclinado no se usa." : ""}`,
      ],
      h: [
        RC.missing,
        [
          `Think: ${known} × ? = ${ar}.${o.trap ? " Leave the slanted side out." : ""}`,
          `Piensa: ${known} × ? = ${ar}.${o.trap ? " Deja fuera el lado inclinado." : ""}`,
        ],
        [
          `Divide ${ar} by ${known}. Then multiply back to check.`,
          `Divide ${ar} entre ${known}. Luego multiplica para comprobar.`,
        ],
      ],
      viz: para(findB ? Q : b, findB ? ht : Q, o.trap ? sl : undefined, u),
      p: { what: "area" },
      meta: { kind: "miss", A: ar, find: findB ? "b" : "h", known, u: u.l },
    });
  };

  // sides p and s with heights ha (to p) and hs (to s): p × ha = s × hs
  let twoHeights = null;
  const twoH = (rng) => {
    if (!twoHeights) {
      twoHeights = [];
      for (let p = 6; p <= 16; p++)
        for (let s = 5; s <= 14; s++)
          for (let ha = 2; ha < s; ha++) {
            if ((p * ha) % s || p === s) continue;
            const hs = (p * ha) / s;
            if (hs < p && hs >= 3 && ha >= 3 && ![ha, s, p].includes(hs) && ha !== p)
              if (ha >= 0.35 * s && hs >= 0.35 * p) twoHeights.push({ p, s, ha, hs });
          }
    }
    return rng.pick(twoHeights);
  };
  /** A parallelogram with two sides and the two heights. ask "area" (level 3) or the other height (level 4). */
  const pTwoH = (ask) => (rng) => {
    const c = rng.pick(CP);
    const u = unitOf(rng, c);
    const { p, s, ha, hs } = twoH(rng);
    const ar = p * ha;
    const [Ae, As] = An(c);
    const area = ask === "area";
    return numI({
      q: [
        `${Ae} is shaped like a parallelogram with sides of ${p} ${u.l} and ${s} ${u.l}. The height to the ${p} ${u.l} side is ${ha} ${u.l}.${area ? ` The height to the ${s} ${u.l} side is ${hs} ${u.l}. What is its area?` : ` What is the height to the ${s} ${u.l} side?`}`,
        `${As} tiene forma de paralelogramo con lados de ${p} ${u.l} y ${s} ${u.l}. La altura al lado de ${p} ${u.l} mide ${ha} ${u.l}.${area ? ` La altura al lado de ${s} ${u.l} mide ${hs} ${u.l}. ¿Cuál es su área?` : ` ¿Cuánto mide la altura al lado de ${s} ${u.l}?`}`,
      ],
      a: area ? ar : hs,
      unit: area ? u.a : u.l,
      fw: area
        ? [
            { v: p * s, tag: "multiplied-sides" },
            { v: p * hs, tag: "wrong-pair" },
            { v: s * ha, tag: "wrong-pair" },
            { v: ha * hs, tag: "multiplied-sides" },
          ]
        : [
            { v: ha, tag: "same-height" },
            { v: ar, tag: "gave-area" },
            { v: ha * s, tag: "multiplied-instead" },
          ],
      x: area
        ? [
            `Match each height to the side it makes a right angle with: ${p} × ${ha} = ${ar} ${u.a}. The other pair gives the same area: ${s} × ${hs} = ${ar} ${u.a}.`,
            `Combina cada altura con el lado con el que forma un ángulo recto: ${p} × ${ha} = ${ar} ${u.a}. El otro par da la misma área: ${s} × ${hs} = ${ar} ${u.a}.`,
          ]
        : [
            `Area = ${p} × ${ha} = ${ar} ${u.a}. The same area equals ${s} × height, so height = ${ar} ÷ ${s} = ${hs} ${u.l}.`,
            `Área = ${p} × ${ha} = ${ar} ${u.a}. La misma área es igual a ${s} × altura, así que altura = ${ar} ÷ ${s} = ${hs} ${u.l}.`,
          ],
      h: area
        ? [
            [
              "Any side can be the base, but the height must make a right angle with the base you choose.",
              "Cualquier lado puede ser la base, pero la altura debe formar un ángulo recto con la base que elijas.",
            ],
            [
              `Choose one side. Which height goes with the ${p} ${u.l} side? Which goes with the ${s} ${u.l} side?`,
              `Elige un lado. ¿Qué altura va con el lado de ${p} ${u.l}? ¿Cuál va con el lado de ${s} ${u.l}?`,
            ],
            [
              `Multiply the ${p} ${u.l} side by its own height. You can check with the other pair.`,
              `Multiplica el lado de ${p} ${u.l} por su propia altura. Puedes comprobar con el otro par.`,
            ],
          ]
        : [
            [
              "The area does not change when you pick a different side as the base.",
              "El área no cambia cuando eliges otro lado como base.",
            ],
            [
              `First find the area from the side and height you know. Then use it with the ${s} ${u.l} side.`,
              `Primero halla el área con el lado y la altura que conoces. Luego úsala con el lado de ${s} ${u.l}.`,
            ],
            [
              `Area = ${p} × ${ha}. Now solve ${s} × ? = that area.`,
              `Área = ${p} × ${ha}. Ahora resuelve ${s} × ? = esa área.`,
            ],
          ],
      viz: para(p, ha, s, u),
      p: { what: "area" },
      meta: { kind: area ? "twoH" : "otherH", p, s, ha, hs, u: u.l },
    });
  };

  /** Rectangle versus parallelogram with the same base and height. */
  const pSame = (rng) => {
    const c = rng.pick(CP);
    const u = unitOf(rng, c);
    const { x, h: ht, s: sl } = lean(rng, { hMax: 12, xMax: 14 });
    const b = intNot(rng, Math.max(6, x), 16, [ht, sl]);
    const ar = b * ht;
    return mcI(rng, {
      q: [
        `A rectangle and a parallelogram both have a base of ${b} ${u.l} and a height of ${ht} ${u.l}. The parallelogram leans, and its slanted side is ${sl} ${u.l}. Which statement is true?`,
        `Un rectángulo y un paralelogramo tienen una base de ${b} ${u.l} y una altura de ${ht} ${u.l}. El paralelogramo se inclina y su lado inclinado mide ${sl} ${u.l}. ¿Qué enunciado es verdadero?`,
      ],
      right: `They have the same area, ${ar} ${u.a}.`,
      rightEs: `Tienen la misma área, ${ar} ${u.a}.`,
      wrong: [
        {
          v: "The parallelogram has the greater area because its slanted side is longer.",
          vEs: "El paralelogramo tiene mayor área porque su lado inclinado es más largo.",
          tag: "slant-longer",
        },
        {
          v: "The rectangle has the greater area because it has square corners.",
          vEs: "El rectángulo tiene mayor área porque tiene esquinas cuadradas.",
          tag: "corners-matter",
        },
        {
          v: "The parallelogram has half the area of the rectangle.",
          vEs: "El paralelogramo tiene la mitad del área del rectángulo.",
          tag: "took-half",
        },
        {
          v: "The parallelogram has twice the area of the rectangle.",
          vEs: "El paralelogramo tiene el doble del área del rectángulo.",
          tag: "doubled-instead",
        },
      ],
      x: [
        `Cut the leaning end off the parallelogram and slide it to the other side: you get a rectangle with the same base and height. Both areas are ${b} × ${ht} = ${ar} ${u.a}.`,
        `Corta el extremo inclinado del paralelogramo y deslízalo al otro lado: obtienes un rectángulo con la misma base y altura. Las dos áreas son ${b} × ${ht} = ${ar} ${u.a}.`,
      ],
      h: [
        [
          "Area = base × height for a rectangle and for a parallelogram.",
          "Área = base × altura, tanto para un rectángulo como para un paralelogramo.",
        ],
        [
          "Find each area. A slanted side is never used in the formula.",
          "Halla cada área. Un lado inclinado nunca se usa en la fórmula.",
        ],
        [
          `Compute ${b} × ${ht} for the rectangle. Then use the same two numbers for the parallelogram.`,
          `Calcula ${b} × ${ht} para el rectángulo. Luego usa los mismos dos números para el paralelogramo.`,
        ],
      ],
      p: { what: "area" },
      viz: para(b, ht, sl, u),
      meta: { kind: "same", b, ht, ov: x, u: u.l, ua: u.a },
    });
  };

  /** Cost of covering a parallelogram: area, then the price for each square unit. */
  const pCost = (rng) => {
    const c = rng.pick(CP.filter((k) => k.pay));
    const u = unitOf(rng, c, ["ft", "m"]);
    const { x, h: ht, s: sl } = lean(rng, { hMax: 12, xMax: 12 });
    const b = intNot(rng, Math.max(6, x), 15, [ht, sl]);
    const rate = rng.pick([2, 3, 4, 5, 6, 8]);
    const ar = b * ht;
    const [Ae, As] = An(c);
    return numI({
      q: [
        `${Ae} is shaped like a parallelogram. Its base is ${b} ${u.l}, its height is ${ht} ${u.l}, and its slanted side is ${sl} ${u.l}. Covering the surface costs $${rate} for each ${u.sq}. How much does it cost to cover the whole surface, in dollars?`,
        `${As} tiene forma de paralelogramo. Su base mide ${b} ${u.l}, su altura mide ${ht} ${u.l} y su lado inclinado mide ${sl} ${u.l}. Cubrir la superficie cuesta $${rate} por cada ${u.sqEs}. ¿Cuánto cuesta cubrir toda la superficie, en dólares?`,
      ],
      a: ar * rate,
      fw: [
        { v: ar, tag: "forgot-rate" },
        { v: b * sl * rate, tag: "used-slant-height" },
        { v: (ar * rate) / 2, tag: "took-half" },
        { v: b + ht + rate, tag: "added-instead" },
      ],
      x: [
        `Area = ${b} × ${ht} = ${ar} ${u.a}. Cost = ${ar} × $${rate} = $${ar * rate}. The slanted side (${sl} ${u.l}) is not used.`,
        `Área = ${b} × ${ht} = ${ar} ${u.a}. Costo = ${ar} × $${rate} = $${ar * rate}. El lado inclinado (${sl} ${u.l}) no se usa.`,
      ],
      h: [
        [
          "Two steps: find the area, then use the price for each square unit.",
          "Dos pasos: halla el área y luego usa el precio de cada unidad cuadrada.",
        ],
        [
          `Area = base × height, with the height that makes a right angle with the base (${ht} ${u.l}).`,
          `Área = base × altura, con la altura que forma un ángulo recto con la base (${ht} ${u.l}).`,
        ],
        [
          `Find ${b} × ${ht}. Then multiply that area by ${rate}.`,
          `Halla ${b} × ${ht}. Luego multiplica esa área por ${rate}.`,
        ],
      ],
      p: { what: "area" },
      viz: para(b, ht, sl, u),
      meta: { kind: "cost", b, ht, ov: x, rate, u: u.l },
    });
  };

  reg(
    "areaParallelogram",
    "Area of parallelograms and rhombuses",
    "Área de paralelogramos y rombos",
    {
      1: [pProd, pFind({}), pFind({ mc: true })],
      2: [pFind({ slant: true }), pFind({ slant: true, mc: true }), pRhombus({})],
      3: [pMiss({}), pTwoH("area"), pRhombus({ miss: true })],
      4: [pTwoH("other"), pSame, pCost, pMiss({ trap: true })],
    },
    (item) => {
      const m = item.meta;
      const pts = () => paraPts(m.b, m.ht, m.ov || 0);
      switch (m.kind) {
        case "prod":
          return wantSum(item, shoelace(pts()), "product");
        case "area":
          return wantNum(item, shoelace(pts()), "area");
        case "areaMC":
          return wantChoice(item, shoelace(pts()), m.ua, "area");
        case "rhombus":
          return wantNum(
            item,
            shoelace(paraPts(m.sd, m.ht, Math.sqrt(m.sd * m.sd - m.ht * m.ht))),
            "rhombus area",
          );
        case "miss": {
          const t = G.value(item.a);
          const [b, ht] = m.find === "h" ? [m.known, t] : [t, m.known];
          return (
            near(shoelace(paraPts(b, ht, 0)), m.A) ||
            `missing length ${item.a} does not give area ${m.A}`
          );
        }
        case "rhomMiss":
          return (
            near(shoelace(paraPts(G.value(item.a), m.known, 0)), m.A) ||
            `missing length ${item.a} does not give area ${m.A}`
          );
        case "twoH": {
          const byP = shoelace(paraPts(m.p, m.ha, 0));
          return near(byP, shoelace(paraPts(m.s, m.hs, 0)))
            ? wantNum(item, byP, "area")
            : "heights are not consistent";
        }
        case "otherH": {
          const area = shoelace(paraPts(m.p, m.ha, 0));
          return (
            near(shoelace(paraPts(m.s, G.value(item.a), 0)), area) ||
            `height ${item.a} does not keep the area ${area}`
          );
        }
        case "same": {
          const area = shoelace(pts());
          const t = item.c[item.a];
          return (
            (near(area, shoelace(paraPts(m.b, m.ht, 0))) &&
              t.startsWith("They have the same area") &&
              t.includes(`${fm(area)} ${m.ua}`)) ||
            `key "${t}" does not say the areas are equal (${fm(area)})`
          );
        }
        case "cost":
          return wantNum(item, shoelace(pts()) * m.rate, "cost");
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  );

  /* ====================================================================================== */
  /* 2. areaTriangle  (5-2)                                                                  */
  /* ====================================================================================== */
  Object.assign(MIS, {
    "used-longest-side": [
      "That uses the longest side as the height. In a right triangle, the base and the height are the two sides that meet at the right angle.",
      "Eso usa el lado más largo como altura. En un triángulo rectángulo, la base y la altura son los dos lados que forman el ángulo recto.",
    ],
    "halved-twice": [
      "That takes half two times. A triangle is half of its rectangle, just once.",
      "Eso toma la mitad dos veces. Un triángulo es la mitad de su rectángulo, solo una vez.",
    ],
    "one-copy-only": [
      "That is the area of ONE triangle. The parallelogram is made from two of them.",
      "Esa es el área de UN triángulo. El paralelogramo está hecho con dos.",
    ],
    "forgot-double": [
      "A = ½ × b × h, so b × h is TWICE the area. Double the area before you divide.",
      "A = ½ × b × h, así que b × h es el DOBLE del área. Duplica el área antes de dividir.",
    ],
    "area-as-height": [
      "The area is not a length, so it cannot be the height. Use the first triangle to find its height, then use that height.",
      "El área no es una longitud, así que no puede ser la altura. Usa el primer triángulo para hallar su altura y luego usa esa altura.",
    ],
    "used-diagonal": [
      "That uses the diagonal as the height. The height makes a right angle with the base, and the diagonal does not.",
      "Eso usa la diagonal como altura. La altura forma un ángulo recto con la base, y la diagonal no.",
    ],
  });
  RC.tri = [
    "The area of a triangle is half of base × height: A = ½ × b × h. The height makes a right angle with the base.",
    "El área de un triángulo es la mitad de base × altura: A = ½ × b × h. La altura forma un ángulo recto con la base.",
  ];
  const CT = [
    { n: "sail", e: "vela", g: "f", u: ["ft", "m"], pay: 1 },
    { n: "pennant", e: "banderín", g: "m", u: ["in", "cm"] },
    { n: "flower bed", e: "jardín de flores", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "tent flap", e: "puerta de la carpa", g: "f", u: ["ft", "m"], pay: 1 },
    { n: "road sign", e: "señal de tránsito", g: "f", u: ["in", "cm"] },
    { n: "shade cloth", e: "toldo", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "gable end", e: "frontón del techo", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "corner shelf", e: "estante de esquina", g: "m", u: ["in", "cm"] },
    { n: "tile", e: "loseta", g: "f", u: ["in", "cm"] },
  ];
  /** Dimensions for StudioViz: apex is the top point as a fraction of the base; s1 / s2 label the left / right side. */
  const triDims = (g, { plain, b = g.b, h = g.ht } = {}) =>
    plain ? { b, h } : { b, h, [g.hypLeft ? "s1" : "s2"]: g.sl, apex: g.ap };
  const tri = (u, dims) => shape("tri", dims, u.l);
  const triPts = (b, ht, ov) => [
    [0, 0],
    [b, 0],
    [ov, ht],
  ];

  /**
   * A triangle drawn true. kind "right": b and ht are the legs and sl the longest side (the right angle sits at
   * the left or the right end). "acute": the height lands inside the base. ov is where the top point sits.
   */
  function triGeom(rng, kind) {
    for (;;) {
      let g;
      if (kind === "right") {
        const [p, q, c] = rng.pick(TRIP);
        const flip = rng.chance(0.5);
        const hypLeft = rng.chance(0.5);
        g = { b: flip ? q : p, ht: flip ? p : q, sl: c, ap: hypLeft ? 1 : 0, hypLeft };
      } else {
        const { x: r, h: ht, s: sl } = lean(rng, { hMax: 15, xMax: 20 });
        let b = r + rng.int(2, 8);
        if ((b * ht) % 2) b += 1;
        g = { b, ht, sl, ap: (b - r) / b, hypLeft: false };
      }
      g.ov = g.ap * g.b;
      if (g.b !== g.ht && g.b !== g.sl) return g;
    }
  }
  /** The sentence that describes the triangle; `plain` leaves the slanted side out. */
  const triDesc = (kind, c, g, u, plain) => {
    const [Ae, As] = An(c);
    if (kind === "right")
      return [
        `${Ae} is shaped like a right triangle. The two sides that meet at the right angle are ${g.b} ${u.l} and ${g.ht} ${u.l}.${plain ? "" : ` The longest side is ${g.sl} ${u.l}.`}`,
        `${As} tiene forma de triángulo rectángulo. Los dos lados que forman el ángulo recto miden ${g.b} ${u.l} y ${g.ht} ${u.l}.${plain ? "" : ` El lado más largo mide ${g.sl} ${u.l}.`}`,
      ];
    return [
      `${Ae} is shaped like a triangle. Its base is ${g.b} ${u.l}${plain ? " and" : ","} its height is ${g.ht} ${u.l}${plain ? "." : `, and its slanted side is ${g.sl} ${u.l}.`}`,
      `${As} tiene forma de triángulo. Su base mide ${g.b} ${u.l}${plain ? " y" : ","} su altura mide ${g.ht} ${u.l}${plain ? "." : ` y su lado inclinado mide ${g.sl} ${u.l}.`}`,
    ];
  };
  const triTail = (kind, g, u) =>
    kind === "right"
      ? [
          " In a right triangle, the two sides that meet at the right angle are the base and the height. The longest side is not used.",
          " En un triángulo rectángulo, los dos lados que forman el ángulo recto son la base y la altura. El lado más largo no se usa.",
        ]
      : [
          ` The slanted side (${g.sl} ${u.l}) is not the height.`,
          ` El lado inclinado (${g.sl} ${u.l}) no es la altura.`,
        ];
  const triX = (g, ar, u, tail = ["", ""]) => [
    `Area = ½ × base × height = ½ × ${g.b} × ${g.ht} = ${ar} ${u.a}. Area counts square units.${tail[0]}`,
    `Área = ½ × base × altura = ½ × ${g.b} × ${g.ht} = ${ar} ${u.a}. El área cuenta unidades cuadradas.${tail[1]}`,
  ];
  const triHints = (kind, g, u, last, plain) => [
    RC.tri,
    plain
      ? [
          `Here the base is ${g.b} ${u.l} and the height is ${g.ht} ${u.l}.`,
          `Aquí la base mide ${g.b} ${u.l} y la altura mide ${g.ht} ${u.l}.`,
        ]
      : kind === "right"
        ? [
            `Here the base and the height are the two sides that meet at the right angle: ${g.b} ${u.l} and ${g.ht} ${u.l}.`,
            `Aquí la base y la altura son los dos lados que forman el ángulo recto: ${g.b} ${u.l} y ${g.ht} ${u.l}.`,
          ]
        : [
            `Use the base (${g.b} ${u.l}) and the dashed height (${g.ht} ${u.l}). Decide which length is not needed.`,
            `Usa la base (${g.b} ${u.l}) y la altura punteada (${g.ht} ${u.l}). Decide qué medida no se necesita.`,
          ],
    last || [
      `Multiply ${g.b} × ${g.ht}, then take half of the product. Write the unit with a small 2: ${u.a}.`,
      `Multiplica ${g.b} × ${g.ht} y luego toma la mitad del producto. Escribe la unidad con un 2 pequeño: ${u.a}.`,
    ],
  ];
  const slTag = (kind) => (kind === "right" ? "used-longest-side" : "used-slant-height");

  /** Which expression gives the area?  (level 1) */
  const tExpr = (rng) => {
    const c = rng.pick(CT);
    const u = unitOf(rng, c);
    const kind = rng.pick(["acute", "right", "acute"]);
    const g = triGeom(rng, kind);
    const ar = (g.b * g.ht) / 2;
    const [d0, d1] = triDesc(kind, c, g, u);
    return mcI(rng, {
      q: [`${d0} Which expression gives its area?`, `${d1} ¿Qué expresión da su área?`],
      right: `½ × ${g.b} × ${g.ht}`,
      key: calc,
      wrong: [
        { v: `${g.b} × ${g.ht}`, tag: "forgot-half" },
        { v: `½ × ${g.b} × ${g.sl}`, tag: slTag(kind) },
        { v: `${g.b} + ${g.ht}`, tag: "added-instead" },
        { v: `½ × (${g.b} + ${g.ht})`, tag: "added-instead" },
        { v: `${g.b} × ${g.sl}`, tag: slTag(kind) },
      ],
      p: { what: "area", shape: "tri" },
      x: triX(g, ar, u, triTail(kind, g, u)),
      h: [
        RC.tri,
        [
          "Find the base and the height: two lengths that meet at a right angle. One length is not needed.",
          "Busca la base y la altura: dos medidas que forman un ángulo recto. Una medida no se necesita.",
        ],
        [
          "The right expression has a ½ and uses only the base and the height.",
          "La expresión correcta tiene un ½ y usa solo la base y la altura.",
        ],
      ],
      viz: tri(u, triDims(g)),
      meta: { kind: "expr", b: g.b, ht: g.ht, ov: g.ov },
    });
  };

  /**
   * Area of a triangle.  kinds: which shapes to draw.  plain: no slanted side given.  mc: pick among areas.
   * half: frame it as "a rectangle with the same base and height" (level 1).
   */
  const tFind = (o) => (rng) => {
    const c = rng.pick(CT);
    const u = unitOf(rng, c);
    const kind = rng.pick(o.kinds);
    const g = triGeom(rng, kind);
    const ar = (g.b * g.ht) / 2;
    const [d0, d1] = o.half
      ? [
          `A rectangle has a base of ${g.b} ${u.l} and a height of ${g.ht} ${u.l}. A triangle has the same base and the same height.`,
          `Un rectángulo tiene una base de ${g.b} ${u.l} y una altura de ${g.ht} ${u.l}. Un triángulo tiene la misma base y la misma altura.`,
        ]
      : triDesc(kind, c, g, u, o.plain);
    const ask = o.mc
      ? ["Which choice is the area of the triangle?", "¿Qué opción es el área del triángulo?"]
      : ["What is the area of the triangle?", "¿Cuál es el área del triángulo?"];
    const base = {
      q: [`${d0} ${ask[0]}`, `${d1} ${ask[1]}`],
      x: o.half
        ? triX(g, ar, u, [
            ` The rectangle is ${g.b * g.ht} ${u.a}. A triangle is half of the rectangle that has the same base and height.`,
            ` El rectángulo mide ${g.b * g.ht} ${u.a}. Un triángulo es la mitad del rectángulo que tiene la misma base y altura.`,
          ])
        : triX(g, ar, u, o.plain ? undefined : triTail(kind, g, u)),
      h: triHints(kind, g, u, undefined, o.plain),
      viz: o.half
        ? shape("tri", triDims(g, { plain: o.plain }), u.l, { ghost: "rect" })
        : tri(u, triDims(g, { plain: o.plain })),
      p: { what: "area", shape: "tri" },
    };
    const cand = [
      { k: "forgot-half", v: g.b * g.ht },
      !o.plain && { k: slTag(kind), v: (g.b * g.sl) / 2 },
      { k: "added-instead", v: g.b + g.ht },
      o.half && { k: "halved-twice", v: (g.b * g.ht) / 4 },
      o.half && { k: "doubled-instead", v: 2 * g.b * g.ht },
    ].filter(Boolean);
    if (o.mc)
      return mcI(rng, {
        ...base,
        right: `${ar} ${u.a}`,
        wrong: [
          ...cand.map((w) => ({ v: `${fm(w.v)} ${u.a}`, tag: w.k })),
          { v: `${ar} ${u.l}`, tag: "unit-mismatch" },
        ],
        meta: { kind: "areaMC", b: g.b, ht: g.ht, ov: g.ov, ua: u.a },
      });
    return numI({
      ...base,
      a: ar,
      unit: u.a,
      fw: cand.map((w) => ({ v: w.v, tag: w.k })),
      meta: { kind: "area", b: g.b, ht: g.ht, ov: g.ov },
    });
  };

  /** A missing base or height from the area.  trap: the slanted side is given and must not be used. */
  const tMiss = (o) => (rng) => {
    const c = rng.pick(CT);
    const u = unitOf(rng, c);
    const g = triGeom(rng, "acute");
    const ar = (g.b * g.ht) / 2;
    const findB = rng.chance(0.4);
    const known = findB ? g.ht : g.b;
    const [Te, Ts] = The(c);
    const [ske, sks] = findB ? ["height", "altura"] : ["base", "base"];
    const [ase, ass] = findB ? ["base", "base"] : ["height", "altura"];
    const answer = findB ? g.b : g.ht;
    return numI({
      q: [
        `${Te} is shaped like a triangle. Its area is ${ar} ${u.a}${o.trap ? "," : " and"} its ${ske} is ${known} ${u.l}${o.trap ? `, and its slanted side is ${g.sl} ${u.l}` : ""}. What is its ${ase}?`,
        `${Ts} tiene forma de triángulo. Su área es ${ar} ${u.a}${o.trap ? "," : " y"} su ${sks} mide ${known} ${u.l}${o.trap ? ` y su lado inclinado mide ${g.sl} ${u.l}` : ""}. ¿Cuánto mide su ${ass}?`,
      ],
      a: answer,
      unit: u.l,
      fw: [
        { v: ar / known, tag: "forgot-double" },
        { v: ar * known, tag: "multiplied-instead" },
        { v: ar - known, tag: "subtracted-instead" },
        o.trap && { v: (2 * ar) / g.sl, tag: "used-slant-height" },
        o.trap && { v: g.sl, tag: "used-slant-height" },
      ].filter(Boolean),
      x: [
        `A = ½ × b × h, so b × h = 2 × ${ar} = ${2 * ar}. The missing ${ase} = ${2 * ar} ÷ ${known} = ${answer} ${u.l}. Check: ½ × ${g.b} × ${g.ht} = ${ar} ${u.a}.${o.trap ? " The slanted side is not used." : ""}`,
        `A = ½ × b × h, así que b × h = 2 × ${ar} = ${2 * ar}. La ${ass} que falta = ${2 * ar} ÷ ${known} = ${answer} ${u.l}. Comprueba: ½ × ${g.b} × ${g.ht} = ${ar} ${u.a}.${o.trap ? " El lado inclinado no se usa." : ""}`,
      ],
      h: [
        [
          "A triangle is half of a rectangle. So base × height is double the area.",
          "Un triángulo es la mitad de un rectángulo. Así que base × altura es el doble del área.",
        ],
        [
          `Double the area first. Then think: ${known} × ? = that number.${o.trap ? " Leave the slanted side out." : ""}`,
          `Primero duplica el área. Luego piensa: ${known} × ? = ese número.${o.trap ? " Deja fuera el lado inclinado." : ""}`,
        ],
        [`Divide your doubled area by ${known}.`, `Divide el área duplicada entre ${known}.`],
      ],
      p: { what: "area", shape: "tri" },
      viz: tri(u, triDims(g, { plain: !o.trap, b: findB ? Q : g.b, h: findB ? g.ht : Q })),
      meta: { kind: "miss", A: ar, find: findB ? "b" : "h", known, ov: g.ov },
    });
  };

  /** Two copies of the triangle make a parallelogram. */
  const tPara = (rng) => {
    const c = rng.pick(CT);
    const u = unitOf(rng, c);
    const g = triGeom(rng, "acute");
    const [Ae, As] = An(c);
    return mcI(rng, {
      q: [
        `${Ae} is shaped like a triangle with a base of ${g.b} ${u.l} and a height of ${g.ht} ${u.l}. Two copies of it are joined to make a parallelogram. What is the area of the parallelogram?`,
        `${As} tiene forma de triángulo con una base de ${g.b} ${u.l} y una altura de ${g.ht} ${u.l}. Dos copias se unen para formar un paralelogramo. ¿Cuál es el área del paralelogramo?`,
      ],
      right: `${g.b * g.ht} ${u.a}`,
      wrong: [
        { v: `${(g.b * g.ht) / 2} ${u.a}`, tag: "one-copy-only" },
        { v: `${g.b * g.ht} ${u.l}`, tag: "unit-mismatch" },
        {
          v: `${g.b * g.ht * 2} ${u.a}`,
          tag: "doubled-instead",
          f: [
            "That doubles base × height, but base × height is already double the triangle. Two triangles together make exactly base × height.",
            "Eso duplica base × altura, pero base × altura ya es el doble del triángulo. Dos triángulos juntos hacen exactamente base × altura.",
          ],
        },
        { v: `${g.b + g.ht} ${u.a}`, tag: "added-instead" },
        { v: `${(g.b * g.ht) / 4} ${u.a}`, tag: "one-copy-only" },
      ],
      p: { what: "area" },
      x: [
        `One triangle has area ½ × ${g.b} × ${g.ht} = ${(g.b * g.ht) / 2} ${u.a}. Two copies make a parallelogram with base ${g.b} and height ${g.ht}, so its area is ${g.b} × ${g.ht} = ${g.b * g.ht} ${u.a}.`,
        `Un triángulo tiene área ½ × ${g.b} × ${g.ht} = ${(g.b * g.ht) / 2} ${u.a}. Dos copias forman un paralelogramo con base ${g.b} y altura ${g.ht}, así que su área es ${g.b} × ${g.ht} = ${g.b * g.ht} ${u.a}.`,
      ],
      h: [
        [
          "Two identical triangles fit together to make a parallelogram. The parallelogram is twice as big as one triangle.",
          "Dos triángulos idénticos encajan y forman un paralelogramo. El paralelogramo es el doble de grande que un triángulo.",
        ],
        [
          "The parallelogram has the same base and the same height as the triangle.",
          "El paralelogramo tiene la misma base y la misma altura que el triángulo.",
        ],
        [
          "Use area of a parallelogram = base × height, or double the area of one triangle.",
          "Usa área de un paralelogramo = base × altura, o duplica el área de un triángulo.",
        ],
      ],
      viz: tri(u, triDims(g, { plain: true })),
      meta: { kind: "para", b: g.b, ht: g.ht, ua: u.a },
    });
  };

  // rectangles whose sides and diagonal are whole numbers: a card, a sheet, a window pane ...
  const CR = [
    { n: "rectangular banner", e: "pancarta rectangular", g: "f", u: ["ft", "in"] },
    { n: "rectangular tile", e: "loseta rectangular", g: "f", u: ["in", "cm"] },
    { n: "sheet of paper", e: "hoja de papel", g: "f", u: ["in", "cm"] },
    { n: "window pane", e: "vidrio de ventana", g: "m", u: ["in", "cm"] },
    { n: "rectangular garden bed", e: "jardín rectangular", g: "m", u: ["ft", "m"] },
    { n: "rectangular rug", e: "alfombra rectangular", g: "f", u: ["ft", "m"] },
  ];
  /** A rectangle cut by a diagonal into two triangles: the area of one. */
  const tDiag = (rng) => {
    const c = rng.pick(CR);
    const u = unitOf(rng, c);
    const [p, q, d] = rng.pick(TRIP.filter((t) => t[2] <= 20));
    const [L, Wd] = rng.chance(0.5) ? [q, p] : [p, q];
    const [Ae, As] = An(c);
    return numI({
      q: [
        `${Ae} is ${L} ${u.l} long and ${Wd} ${u.l} wide. A straight cut from one corner to the opposite corner is ${d} ${u.l} long and splits it into two triangles. What is the area of one triangle?`,
        `${As} mide ${L} ${u.l} de largo y ${Wd} ${u.l} de ancho. Un corte recto de una esquina a la esquina opuesta mide ${d} ${u.l} y ${c.g === "f" ? "la" : "lo"} divide en dos triángulos. ¿Cuál es el área de un triángulo?`,
      ],
      a: (L * Wd) / 2,
      unit: u.a,
      fw: [
        { v: L * Wd, tag: "forgot-half" },
        { v: (L * d) / 2, tag: "used-diagonal" },
        { v: (Wd * d) / 2, tag: "used-diagonal" },
        { v: (L * Wd) / 4, tag: "halved-twice" },
      ],
      p: { what: "area", shape: "tri" },
      x: [
        `Each triangle has the two sides of the rectangle as its base and height: ½ × ${L} × ${Wd} = ${(L * Wd) / 2} ${u.a}. That is half of the rectangle (${L * Wd} ${u.a}). The diagonal (${d} ${u.l}) is not used.`,
        `Cada triángulo tiene los dos lados del rectángulo como base y altura: ½ × ${L} × ${Wd} = ${(L * Wd) / 2} ${u.a}. Eso es la mitad del rectángulo (${L * Wd} ${u.a}). La diagonal (${d} ${u.l}) no se usa.`,
      ],
      h: [
        [
          "A cut from corner to corner splits a rectangle into two equal triangles.",
          "Un corte de esquina a esquina divide un rectángulo en dos triángulos iguales.",
        ],
        [
          "In each triangle, the base and height are two sides that meet at a right angle. The cut is the longest side.",
          "En cada triángulo, la base y la altura son dos lados que forman un ángulo recto. El corte es el lado más largo.",
        ],
        [
          `Use ½ × ${L} × ${Wd}, or find the rectangle's area and take half.`,
          `Usa ½ × ${L} × ${Wd}, o halla el área del rectángulo y toma la mitad.`,
        ],
      ],
      viz: tri(u, { b: L, h: Wd, s2: d, apex: 0 }),
      meta: { kind: "diag", L, Wd, d },
    });
  };

  /** Same height, new base: find the height from the first triangle, then the second area. */
  const tTwoStep = (rng) => {
    const c = rng.pick(CT);
    const u = unitOf(rng, c);
    const b1 = rng.pick([4, 6, 8, 10, 12]);
    const b2 = intNot(rng, 3, 16, [b1]);
    const ht = intNot(rng, 4, 12, [b1, b2]);
    const a1 = (b1 * ht) / 2;
    const [bad, ok] = [(b1 * ht) % 2, (b2 * ht) % 2];
    if (bad || ok) return tTwoStep(rng);
    const a2 = (b2 * ht) / 2;
    if ([a1, ht, b1, b2].includes(a2)) return tTwoStep(rng);
    const [Ae, As] = An(c);
    const seg = c.g === "f" ? ["de la segunda", "una segunda"] : ["del segundo", "un segundo"];
    return numI({
      q: [
        `${Ae} is a triangle with a base of ${b1} ${u.l} and an area of ${a1} ${u.a}. A second ${c.n} is a triangle with the same height and a base of ${b2} ${u.l}. What is the area of the second ${c.n}?`,
        `${As} tiene forma de triángulo con una base de ${b1} ${u.l} y un área de ${a1} ${u.a}. ${capital(seg[1])} ${c.e} tiene forma de triángulo con la misma altura y una base de ${b2} ${u.l}. ¿Cuál es el área ${seg[0]} ${c.e}?`,
      ],
      a: a2,
      unit: u.a,
      fw: [
        { v: (b2 * a1) / 2, tag: "area-as-height" },
        { v: b2 * ht, tag: "forgot-half" },
        { v: a1 + (b2 - b1), tag: "added-instead" },
        { v: (b2 * a1) / b1 / 2, tag: "halved-twice" },
      ],
      p: { what: "area", shape: "tri" },
      x: [
        `First find the height: ${a1} × 2 ÷ ${b1} = ${ht} ${u.l}. Then the area of the second ${c.n} = ½ × ${b2} × ${ht} = ${a2} ${u.a}.`,
        `Primero halla la altura: ${a1} × 2 ÷ ${b1} = ${ht} ${u.l}. Luego el área ${seg[0]} ${c.e} = ½ × ${b2} × ${ht} = ${a2} ${u.a}.`,
      ],
      h: [
        [
          "Two steps. The first triangle tells you the height. The second triangle uses that same height.",
          "Dos pasos. El primer triángulo te da la altura. El segundo triángulo usa esa misma altura.",
        ],
        [
          `For the first triangle: ½ × ${b1} × ? = ${a1}. Find the missing height.`,
          `Para el primer triángulo: ½ × ${b1} × ? = ${a1}. Halla la altura que falta.`,
        ],
        [
          `Then compute ½ × ${b2} × (the height you found).`,
          `Luego calcula ½ × ${b2} × (la altura que encontraste).`,
        ],
      ],
      viz: tri(u, { b: b1, h: Q }),
      meta: { kind: "twoStep", b1, b2, a1 },
    });
  };

  /** Cost of covering a triangle. */
  const tCost = (rng) => {
    const c = rng.pick(CT.filter((k) => k.pay));
    const u = unitOf(rng, c, ["ft", "m"]);
    const kind = rng.pick(["acute", "right"]);
    const g = triGeom(rng, kind);
    const rate = rng.pick([2, 3, 4, 5, 6, 8]);
    const ar = (g.b * g.ht) / 2;
    const [d0, d1] = triDesc(kind, c, g, u);
    return numI({
      q: [
        `${d0} Covering it costs $${rate} for each ${u.sq}. How much does it cost to cover the whole surface, in dollars?`,
        `${d1} Cubrirlo cuesta $${rate} por cada ${u.sqEs}. ¿Cuánto cuesta cubrir toda la superficie, en dólares?`,
      ],
      a: ar * rate,
      fw: [
        { v: ar, tag: "forgot-rate" },
        { v: g.b * g.ht * rate, tag: "forgot-half" },
        { v: (g.b * g.sl * rate) / 2, tag: slTag(kind) },
        { v: g.b + g.ht + rate, tag: "added-instead" },
      ],
      p: { what: "area", shape: "tri" },
      x: triX(g, ar, u, [
        ` Cost = ${ar} × $${rate} = $${ar * rate}.`,
        ` Costo = ${ar} × $${rate} = $${ar * rate}.`,
      ]),
      h: [
        [
          "Two steps: find the area, then multiply by the price for each square unit.",
          "Dos pasos: halla el área y luego multiplica por el precio de cada unidad cuadrada.",
        ],
        triHints(kind, g, u)[1],
        [
          `Find ½ × ${g.b} × ${g.ht}. Then multiply that area by ${rate}.`,
          `Halla ½ × ${g.b} × ${g.ht}. Luego multiplica esa área por ${rate}.`,
        ],
      ],
      viz: tri(u, triDims(g)),
      meta: { kind: "cost", b: g.b, ht: g.ht, ov: g.ov, rate },
    });
  };

  reg(
    "areaTriangle",
    "Area of triangles",
    "Área de triángulos",
    {
      1: [
        tExpr,
        tFind({ kinds: ["acute"], plain: true }),
        tFind({ kinds: ["acute"], plain: true, half: true, mc: true }),
      ],
      2: [
        tFind({ kinds: ["acute", "right"] }),
        tFind({ kinds: ["acute", "right"], mc: true }),
        tFind({ kinds: ["acute"] }),
      ],
      3: [tMiss({}), tPara, tFind({ kinds: ["right"], mc: true })],
      4: [tDiag, tTwoStep, tCost, tMiss({ trap: true })],
    },
    (item) => {
      const m = item.meta;
      switch (m.kind) {
        case "expr":
          return wantSum(item, shoelace(triPts(m.b, m.ht, m.ov)), "expression");
        case "area":
          return wantNum(item, shoelace(triPts(m.b, m.ht, m.ov)), "triangle area");
        case "areaMC":
          return wantChoice(item, shoelace(triPts(m.b, m.ht, m.ov)), m.ua, "triangle area");
        case "miss": {
          const t = G.value(item.a);
          const [b, ht] = m.find === "h" ? [m.known, t] : [t, m.known];
          return (
            near(shoelace(triPts(b, ht, m.ov)), m.A) ||
            `missing length ${item.a} does not give area ${m.A}`
          );
        }
        case "para":
          return wantChoice(
            item,
            shoelace(paraPts(m.b, m.ht, 0)),
            m.ua,
            "parallelogram of two triangles",
          );
        case "diag":
          return wantNum(
            item,
            shoelace([
              [0, 0],
              [m.L, 0],
              [m.L, m.Wd],
            ]),
            "half the rectangle",
          );
        case "twoStep": {
          const ht = (2 * m.a1) / m.b1;
          return wantNum(item, shoelace(triPts(m.b2, ht, 0)), "second triangle");
        }
        case "cost":
          return wantNum(item, shoelace(triPts(m.b, m.ht, m.ov)) * m.rate, "cost");
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  );

  /* ====================================================================================== */
  /* 3. areaTrapezoid  (5-3)                                                                 */
  /* ====================================================================================== */
  Object.assign(MIS, {
    "forgot-split": [
      "The difference between the bases is shared by TWO triangles, one at each end. Each triangle gets half of it.",
      "La diferencia entre las bases se reparte entre DOS triángulos, uno en cada extremo. Cada triángulo recibe la mitad.",
    ],
    "forgot-triangles": [
      "That is only the rectangle in the middle. The two triangles at the ends are part of the trapezoid too.",
      "Eso es solo el rectángulo del medio. Los dos triángulos de los extremos también son parte del trapecio.",
    ],
    "one-base-only": [
      "That uses only one base for the whole shape. The two bases are different, so both of them belong in the work.",
      "Eso usa solo una base para toda la figura. Las dos bases son distintas, así que las dos deben usarse.",
    ],
    "wrong-piece": [
      "That is a different piece. Re-read which piece the question asks about.",
      "Esa es otra pieza. Vuelve a leer sobre qué pieza pregunta el problema.",
    ],
    "both-triangles": [
      "That is the area of BOTH end triangles together. The question asks about one.",
      "Esa es el área de los DOS triángulos de los extremos juntos. La pregunta es sobre uno.",
    ],
    "gave-sum-of-bases": [
      "That is the two bases added together. Subtract the base you already know to get the other one.",
      "Eso es la suma de las dos bases. Resta la base que ya conoces para obtener la otra.",
    ],
  });
  MIS["forgot-double"] = (
    (triVersion) => (p) =>
      p.shape === "trap"
        ? [
            "A = ½ × (b₁ + b₂) × h, so (b₁ + b₂) × h is TWICE the area. Double the area before you divide.",
            "A = ½ × (b₁ + b₂) × h, así que (b₁ + b₂) × h es el DOBLE del área. Duplica el área antes de dividir.",
          ]
        : triVersion
  )(MIS["forgot-double"]);
  RC.trap = [
    "Cut a trapezoid into a rectangle and two triangles. The same area comes from A = ½ × (b₁ + b₂) × h. The height makes a right angle with the bases.",
    "Corta un trapecio en un rectángulo y dos triángulos. La misma área sale de A = ½ × (b₁ + b₂) × h. La altura forma un ángulo recto con las bases.",
  ];
  const CZ = [
    { n: "table top", e: "mesa", g: "f", u: ["ft", "in"] },
    { n: "flower bed", e: "jardín de flores", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "deck", e: "terraza", g: "f", u: ["ft", "m"], pay: 1 },
    { n: "awning", e: "toldo", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "popcorn bag panel", e: "panel de la bolsa de palomitas", g: "m", u: ["in", "cm"] },
    { n: "roof panel", e: "panel del techo", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "stage", e: "escenario", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "window", e: "ventana", g: "f", u: ["in", "ft"] },
    { n: "pool cover", e: "cubierta de piscina", g: "f", u: ["ft", "m"], pay: 1 },
  ];
  /** StudioViz draws an isosceles trapezoid; the shorter base goes on top, so an unknown short base is b1. */
  const trapViz = (g, u, { short = g.b2, long = g.b1, h = g.h, slant } = {}) =>
    shape("trap", { b1: short, b2: long, h, side: slant ? g.side : undefined }, u.l);
  const trapPts = (b1, b2, h) => {
    const e = (b1 - b2) / 2;
    return [
      [0, 0],
      [b1, 0],
      [e + b2, h],
      [e, h],
    ];
  };
  /** Isosceles trapezoid with whole numbers: long base b1, short base b2, e = (b1 − b2) ÷ 2, height h. */
  function trapGeom(rng, { slant, evenEH } = {}) {
    for (;;) {
      let e;
      let h;
      let side;
      if (slant) {
        ({ x: e, h, s: side } = lean(rng, { hMax: 12, xMax: 9 }));
      } else {
        e = rng.int(2, 6);
        h = rng.int(3, 10);
      }
      const b2 = rng.int(3, 11);
      const b1 = b2 + 2 * e;
      if (evenEH && (e * h) % 2) continue;
      const given = [b1, b2, h, side];
      if ([e, b2 * h, (e * h) / 2, h * (b2 + e)].some((v) => given.includes(v))) continue;
      if (
        new Set(slant ? [b1, b2, h, e, side] : [b1, b2, h, e]).size === (slant ? 5 : 4) &&
        b1 <= 26
      )
        return { b1, b2, h, e, side };
    }
  }
  const zDesc = (c, g, u, slant, order) => {
    const [Ae, As] = An(c);
    const [p, q] = order ? [g.b1, g.b2] : [g.b2, g.b1];
    return [
      `${Ae} is shaped like a trapezoid. Its two parallel sides, the bases, are ${p} ${u.l} and ${q} ${u.l}. ${slant ? `Its height is ${g.h} ${u.l}, and each slanted side is ${g.side} ${u.l}.` : `Its height is ${g.h} ${u.l}.`}`,
      `${As} tiene forma de trapecio. Sus dos lados paralelos, las bases, miden ${p} ${u.l} y ${q} ${u.l}. ${slant ? `Su altura mide ${g.h} ${u.l} y cada lado inclinado mide ${g.side} ${u.l}.` : `Su altura mide ${g.h} ${u.l}.`}`,
    ];
  };
  /** The decomposition worked out: rectangle, two triangles, total, and the formula as a check. */
  const zX = (g, ar, u) => [
    `Cut the trapezoid into a rectangle and two triangles. Rectangle: ${g.b2} × ${g.h} = ${g.b2 * g.h} ${u.a}. Each triangle has a base of (${g.b1} − ${g.b2}) ÷ 2 = ${g.e} ${u.l}, so the two triangles add up to ${g.e} × ${g.h} = ${g.e * g.h} ${u.a}. Total: ${g.b2 * g.h} + ${g.e * g.h} = ${ar} ${u.a}. The formula agrees: ½ × (${g.b1} + ${g.b2}) × ${g.h} = ${ar} ${u.a}.`,
    `Corta el trapecio en un rectángulo y dos triángulos. Rectángulo: ${g.b2} × ${g.h} = ${g.b2 * g.h} ${u.a}. Cada triángulo tiene una base de (${g.b1} − ${g.b2}) ÷ 2 = ${g.e} ${u.l}, así que los dos triángulos suman ${g.e} × ${g.h} = ${g.e * g.h} ${u.a}. Total: ${g.b2 * g.h} + ${g.e * g.h} = ${ar} ${u.a}. La fórmula coincide: ½ × (${g.b1} + ${g.b2}) × ${g.h} = ${ar} ${u.a}.`,
  ];
  const zHints = (g, _u) => [
    RC.trap,
    [
      `Each triangle's base is half of the difference between the bases: (${g.b1} − ${g.b2}) ÷ 2. The rectangle is as wide as the short base.`,
      `La base de cada triángulo es la mitad de la diferencia entre las bases: (${g.b1} − ${g.b2}) ÷ 2. El rectángulo es tan ancho como la base corta.`,
    ],
    [
      `Rectangle: ${g.b2} × ${g.h}. Then add the area of the two triangles. Or use ½ × (${g.b1} + ${g.b2}) × ${g.h}.`,
      `Rectángulo: ${g.b2} × ${g.h}. Luego suma el área de los dos triángulos. O usa ½ × (${g.b1} + ${g.b2}) × ${g.h}.`,
    ],
  ];

  /** One piece of the cut-up trapezoid (level 1): the triangle's base, the rectangle, or one triangle. */
  const zPiece = (rng) => {
    const c = rng.pick(CZ);
    const u = unitOf(rng, c);
    const ask = rng.pick(["tbase", "rect", "tri"]);
    const g = trapGeom(rng, { evenEH: ask === "tri" });
    const [d0, d1] = zDesc(c, g, u, false, rng.chance(0.5));
    const what = {
      tbase: ["How long is the base of each triangle?", "¿Cuánto mide la base de cada triángulo?"],
      rect: [
        "What is the area of the rectangle in the middle?",
        "¿Cuál es el área del rectángulo del medio?",
      ],
      tri: [
        "What is the area of ONE of the triangles?",
        "¿Cuál es el área de UNO de los triángulos?",
      ],
    }[ask];
    const ans = { tbase: g.e, rect: g.b2 * g.h, tri: (g.e * g.h) / 2 }[ask];
    const unit = ask === "tbase" ? u.l : u.a;
    const fw = {
      tbase: [
        { v: g.b1 - g.b2, tag: "forgot-split" },
        { v: g.b2, tag: "wrong-piece" },
      ],
      rect: [
        { v: g.b1 * g.h, tag: "one-base-only" },
        { v: g.e * g.h, tag: "wrong-piece" },
        { v: (g.b1 + g.b2) * g.h, tag: "wrong-piece" },
      ],
      tri: [
        { v: g.e * g.h, tag: "both-triangles" },
        { v: (g.b1 - g.b2) * g.h, tag: "both-triangles" },
        { v: g.b2 * g.h, tag: "wrong-piece" },
      ],
    }[ask];
    const x = {
      tbase: [
        `The bases differ by ${g.b1} − ${g.b2} = ${g.b1 - g.b2} ${u.l}. That extra length is shared by two triangles, one at each end, so each base is ${g.b1 - g.b2} ÷ 2 = ${g.e} ${u.l}.`,
        `Las bases difieren en ${g.b1} − ${g.b2} = ${g.b1 - g.b2} ${u.l}. Esa longitud extra se reparte entre dos triángulos, uno en cada extremo, así que cada base mide ${g.b1 - g.b2} ÷ 2 = ${g.e} ${u.l}.`,
      ],
      rect: [
        `The rectangle is as wide as the short base (${g.b2} ${u.l}) and as tall as the trapezoid (${g.h} ${u.l}): ${g.b2} × ${g.h} = ${g.b2 * g.h} ${u.a}.`,
        `El rectángulo es tan ancho como la base corta (${g.b2} ${u.l}) y tan alto como el trapecio (${g.h} ${u.l}): ${g.b2} × ${g.h} = ${g.b2 * g.h} ${u.a}.`,
      ],
      tri: [
        `Each triangle has a base of (${g.b1} − ${g.b2}) ÷ 2 = ${g.e} ${u.l} and a height of ${g.h} ${u.l}: ½ × ${g.e} × ${g.h} = ${ans} ${u.a}.`,
        `Cada triángulo tiene una base de (${g.b1} − ${g.b2}) ÷ 2 = ${g.e} ${u.l} y una altura de ${g.h} ${u.l}: ½ × ${g.e} × ${g.h} = ${ans} ${u.a}.`,
      ],
    }[ask];
    const hint = {
      tbase: [
        [
          "Find how much longer the long base is than the short base. That extra length is split between the two ends.",
          "Halla cuánto más larga es la base larga que la base corta. Esa longitud extra se reparte entre los dos extremos.",
        ],
        [
          `Subtract: ${g.b1} − ${g.b2}. Then think: how many triangles share that length?`,
          `Resta: ${g.b1} − ${g.b2}. Luego piensa: ¿cuántos triángulos comparten esa longitud?`,
        ],
      ],
      rect: [
        [
          "The rectangle in the middle is as wide as the short base.",
          "El rectángulo del medio es tan ancho como la base corta.",
        ],
        [
          `Multiply its width, ${g.b2} ${u.l}, by its height, ${g.h} ${u.l}.`,
          `Multiplica su ancho, ${g.b2} ${u.l}, por su altura, ${g.h} ${u.l}.`,
        ],
      ],
      tri: [
        [
          "Each triangle is a right triangle. Its base is half of the difference between the two bases.",
          "Cada triángulo es un triángulo rectángulo. Su base es la mitad de la diferencia entre las dos bases.",
        ],
        [
          `Find that base first, (${g.b1} − ${g.b2}) ÷ 2. Then use area = ½ × base × height with height ${g.h}.`,
          `Primero halla esa base, (${g.b1} − ${g.b2}) ÷ 2. Luego usa área = ½ × base × altura con altura ${g.h}.`,
        ],
      ],
    }[ask];
    return numI({
      q: [
        `${d0} It is cut into a rectangle and two identical triangles, as shown by the dashed lines. ${what[0]}`,
        `${d1} Se corta en un rectángulo y dos triángulos idénticos, como muestran las líneas de trazos. ${what[1]}`,
      ],
      a: ans,
      unit,
      fw,
      x,
      h: hint,
      p: { what: "area" },
      viz: { ...trapViz(g, u), cuts: true },
      meta: { kind: "piece", ask, b1: g.b1, b2: g.b2, h: g.h },
    });
  };

  /** Which expression gives the area?  (level 1) */
  const zExpr = (rng) => {
    const c = rng.pick(CZ);
    const u = unitOf(rng, c);
    const g = trapGeom(rng, { slant: true });
    const ar = g.h * (g.b2 + g.e);
    const [d0, d1] = zDesc(c, g, u, true, rng.chance(0.5));
    return mcI(rng, {
      q: [`${d0} Which expression gives its area?`, `${d1} ¿Qué expresión da su área?`],
      right: `½ × (${g.b1} + ${g.b2}) × ${g.h}`,
      key: calc,
      wrong: [
        { v: `(${g.b1} + ${g.b2}) × ${g.h}`, tag: "forgot-half" },
        { v: `${g.b1} × ${g.h}`, tag: "one-base-only" },
        { v: `½ × (${g.b1} + ${g.b2}) × ${g.side}`, tag: "used-slant-height" },
        { v: `${g.b1} + ${g.b2} + ${g.h}`, tag: "added-instead" },
        { v: `${g.b2} × ${g.h}`, tag: "forgot-triangles" },
      ],
      p: { what: "area", shape: "trap" },
      x: zX(g, ar, u),
      h: zHints(g, u),
      viz: trapViz(g, u, { slant: true }),
      meta: { kind: "expr", b1: g.b1, b2: g.b2, h: g.h },
    });
  };

  /** Area of a trapezoid by cutting it up.  slant: the slanted side is given (a distractor).  mc: pick an area. */
  const zArea = (o) => (rng) => {
    const c = rng.pick(CZ);
    const u = unitOf(rng, c);
    const g = trapGeom(rng, { slant: o.slant });
    const ar = g.h * (g.b2 + g.e);
    const [d0, d1] = zDesc(c, g, u, o.slant, rng.chance(0.5));
    const ask = o.mc
      ? ["Which choice is its area?", "¿Qué opción es su área?"]
      : ["What is its area?", "¿Cuál es su área?"];
    const base = {
      q: [`${d0} ${ask[0]}`, `${d1} ${ask[1]}`],
      x: zX(g, ar, u),
      h: zHints(g, u),
      viz: trapViz(g, u, { slant: o.slant }),
      p: { what: "area", shape: "trap" },
    };
    const cand = [
      { k: "forgot-half", v: (g.b1 + g.b2) * g.h },
      { k: "one-base-only", v: g.b1 * g.h },
      { k: "forgot-triangles", v: g.b2 * g.h },
      o.slant && { k: "used-slant-height", v: ((g.b1 + g.b2) * g.side) / 2 },
      { k: "added-instead", v: g.b1 + g.b2 + g.h },
    ].filter(Boolean);
    if (o.mc)
      return mcI(rng, {
        ...base,
        right: `${ar} ${u.a}`,
        wrong: [
          ...cand.map((w) => ({ v: `${fm(w.v)} ${u.a}`, tag: w.k })),
          { v: `${ar} ${u.l}`, tag: "unit-mismatch" },
        ],
        meta: { kind: "areaMC", b1: g.b1, b2: g.b2, h: g.h, ua: u.a },
      });
    return numI({
      ...base,
      a: ar,
      unit: u.a,
      fw: cand.map((w) => ({ v: w.v, tag: w.k })),
      meta: { kind: "area", b1: g.b1, b2: g.b2, h: g.h },
    });
  };

  /** Two copies of the trapezoid make a parallelogram with base b₁ + b₂. */
  const zPara = (rng) => {
    const c = rng.pick(CZ);
    const u = unitOf(rng, c);
    const g = trapGeom(rng);
    const [d0, d1] = zDesc(c, g, u, false, rng.chance(0.5));
    const para2 = (g.b1 + g.b2) * g.h;
    return mcI(rng, {
      q: [
        `${d0} Two copies of it are turned and joined to make a parallelogram. What is the area of the parallelogram?`,
        `${d1} Dos copias se giran y se unen para formar un paralelogramo. ¿Cuál es el área del paralelogramo?`,
      ],
      right: `${para2} ${u.a}`,
      wrong: [
        {
          v: `${para2 / 2} ${u.a}`,
          tag: "one-copy-only",
          f: [
            "That is the area of ONE trapezoid. The parallelogram is made from two of them.",
            "Esa es el área de UN trapecio. El paralelogramo está hecho con dos.",
          ],
        },
        { v: `${g.b1 * g.h} ${u.a}`, tag: "one-base-only" },
        { v: `${para2} ${u.l}`, tag: "unit-mismatch" },
        {
          v: `${para2 * 2} ${u.a}`,
          tag: "doubled-instead",
          f: [
            "That doubles an area that is already doubled. The parallelogram's base is b₁ + b₂ and its height is the trapezoid's height.",
            "Eso duplica un área que ya está duplicada. La base del paralelogramo es b₁ + b₂ y su altura es la del trapecio.",
          ],
        },
        { v: `${g.b1 + g.b2 + g.h} ${u.a}`, tag: "added-instead" },
      ],
      p: { what: "area" },
      x: [
        `Turn one copy around and join it to the other. The parallelogram has a base of ${g.b1} + ${g.b2} = ${g.b1 + g.b2} ${u.l} and a height of ${g.h} ${u.l}, so its area is ${g.b1 + g.b2} × ${g.h} = ${para2} ${u.a}. One trapezoid is half of that: ${para2 / 2} ${u.a}.`,
        `Gira una copia y únela a la otra. El paralelogramo tiene una base de ${g.b1} + ${g.b2} = ${g.b1 + g.b2} ${u.l} y una altura de ${g.h} ${u.l}, así que su área es ${g.b1 + g.b2} × ${g.h} = ${para2} ${u.a}. Un trapecio es la mitad: ${para2 / 2} ${u.a}.`,
      ],
      h: [
        [
          "When you turn a second trapezoid upside down and join it, the two long and short bases line up into one long base.",
          "Cuando giras un segundo trapecio y lo unes, las bases larga y corta forman una sola base larga.",
        ],
        [
          "The parallelogram's base is b₁ + b₂. Its height is the same as the trapezoid's height.",
          "La base del paralelogramo es b₁ + b₂. Su altura es la misma que la del trapecio.",
        ],
        [
          `Multiply (${g.b1} + ${g.b2}) by ${g.h}. Do not take half: both trapezoids are in the parallelogram.`,
          `Multiplica (${g.b1} + ${g.b2}) por ${g.h}. No tomes la mitad: los dos trapecios están en el paralelogramo.`,
        ],
      ],
      viz: trapViz(g, u),
      meta: { kind: "para", b1: g.b1, b2: g.b2, h: g.h, ua: u.a },
    });
  };

  /** A missing base or height from the area.  trap: the slanted side is given too and must not be used. */
  const zMiss = (o) => (rng) => {
    const c = rng.pick(CZ);
    const u = unitOf(rng, c);
    const g = trapGeom(rng, { slant: o.trap });
    const ar = g.h * (g.b2 + g.e);
    const findH = rng.chance(0.4);
    const [Te, Ts] = The(c);
    const longKnown = rng.chance(0.5); // which base is given when the other is missing
    const known = longKnown ? g.b1 : g.b2;
    const missing = longKnown ? g.b2 : g.b1;
    const slEn = o.trap ? `, and each slanted side is ${g.side} ${u.l}` : "";
    const slEs = o.trap ? ` y cada lado inclinado mide ${g.side} ${u.l}` : "";
    const q = findH
      ? [
          `${Te} is shaped like a trapezoid. Its area is ${ar} ${u.a} and its bases are ${g.b1} ${u.l} and ${g.b2} ${u.l}${slEn}. What is its height?`,
          `${Ts} tiene forma de trapecio. Su área es ${ar} ${u.a} y sus bases miden ${g.b1} ${u.l} y ${g.b2} ${u.l}${slEs}. ¿Cuánto mide su altura?`,
        ]
      : [
          `${Te} is shaped like a trapezoid. Its area is ${ar} ${u.a}, its height is ${g.h} ${u.l}${slEn}, and one base is ${known} ${u.l}. How long is the other base?`,
          `${Ts} tiene forma de trapecio. Su área es ${ar} ${u.a}, su altura mide ${g.h} ${u.l}${slEs} y una base mide ${known} ${u.l}. ¿Cuánto mide la otra base?`,
        ];
    const twice = 2 * ar;
    const fw = findH
      ? [
          { v: ar / (g.b1 + g.b2), tag: "forgot-double" },
          { v: twice / g.b1, tag: "one-base-only" },
          { v: ar * (g.b1 + g.b2), tag: "multiplied-instead" },
          o.trap && { v: twice / g.side, tag: "used-slant-height" },
        ]
      : [
          { v: twice / g.h, tag: "gave-sum-of-bases" },
          { v: ar / g.h - known, tag: "forgot-double" },
          { v: twice - known, tag: "subtracted-instead" },
          { v: ar / g.h, tag: "forgot-double" },
        ];
    return numI({
      q,
      a: findH ? g.h : missing,
      unit: u.l,
      fw: fw.filter(Boolean),
      x: findH
        ? [
            `A = ½ × (b₁ + b₂) × h, so (b₁ + b₂) × h = 2 × ${ar} = ${twice}. The bases add up to ${g.b1} + ${g.b2} = ${g.b1 + g.b2}, so the height = ${twice} ÷ ${g.b1 + g.b2} = ${g.h} ${u.l}. Check: ½ × ${g.b1 + g.b2} × ${g.h} = ${ar} ${u.a}.`,
            `A = ½ × (b₁ + b₂) × h, así que (b₁ + b₂) × h = 2 × ${ar} = ${twice}. Las bases suman ${g.b1} + ${g.b2} = ${g.b1 + g.b2}, así que la altura = ${twice} ÷ ${g.b1 + g.b2} = ${g.h} ${u.l}. Comprueba: ½ × ${g.b1 + g.b2} × ${g.h} = ${ar} ${u.a}.`,
          ]
        : [
            `A = ½ × (b₁ + b₂) × h, so (b₁ + b₂) × h = 2 × ${ar} = ${twice}. Then b₁ + b₂ = ${twice} ÷ ${g.h} = ${g.b1 + g.b2} ${u.l}. The other base = ${g.b1 + g.b2} − ${known} = ${missing} ${u.l}.`,
            `A = ½ × (b₁ + b₂) × h, así que (b₁ + b₂) × h = 2 × ${ar} = ${twice}. Entonces b₁ + b₂ = ${twice} ÷ ${g.h} = ${g.b1 + g.b2} ${u.l}. La otra base = ${g.b1 + g.b2} − ${known} = ${missing} ${u.l}.`,
          ],
      h: findH
        ? [
            [
              "A = ½ × (b₁ + b₂) × h. So (b₁ + b₂) × h is double the area.",
              "A = ½ × (b₁ + b₂) × h. Así que (b₁ + b₂) × h es el doble del área.",
            ],
            [
              `Add the bases first: ${g.b1} + ${g.b2}. Then think: (that sum) × ? = twice the area.`,
              `Suma primero las bases: ${g.b1} + ${g.b2}. Luego piensa: (esa suma) × ? = el doble del área.`,
            ],
            [
              "Divide twice the area by the sum of the bases.",
              "Divide el doble del área entre la suma de las bases.",
            ],
          ]
        : [
            [
              "A = ½ × (b₁ + b₂) × h. So (b₁ + b₂) × h is double the area.",
              "A = ½ × (b₁ + b₂) × h. Así que (b₁ + b₂) × h es el doble del área.",
            ],
            [
              "First find what the two bases add up to: double the area, then divide by the height.",
              "Primero halla cuánto suman las dos bases: duplica el área y luego divide entre la altura.",
            ],
            [
              `The bases add up to that number. One base is ${known} ${u.l}, so the other base is what is left.`,
              `Las bases suman ese número. Una base mide ${known} ${u.l}, así que la otra base es lo que queda.`,
            ],
          ],
      p: { what: "area", shape: "trap" },
      viz: findH
        ? trapViz(g, u, { h: Q, slant: o.trap })
        : trapViz(g, u, longKnown ? { short: Q, slant: o.trap } : { long: Q, slant: o.trap }),
      meta: {
        kind: "miss",
        A: ar,
        find: findH ? "h" : "b",
        b1: findH ? g.b1 : known,
        b2: findH ? g.b2 : undefined,
        h: findH ? undefined : g.h,
      },
    });
  };

  /** A trapezoid and a parallelogram with the same height: how far apart are the areas? */
  const zCompare = (rng) => {
    const c = rng.pick(CP);
    const u = unitOf(rng, c);
    const g = trapGeom(rng);
    const mid = g.b2 + g.e;
    let p;
    do p = intNot(rng, 4, 14, [mid, g.h, g.b1, g.b2]);
    while ([g.b1, g.b2, g.h, p].includes(g.h * Math.abs(mid - p)));
    const trapA = g.h * mid;
    const paraA = p * g.h;
    const diff = Math.abs(trapA - paraA);
    const [Ae, As] = An(c);
    const sec = c.g === "f" ? ["segunda", "una segunda"] : ["segundo", "un segundo"];
    return numI({
      q: [
        `${Ae} is shaped like a trapezoid with bases of ${g.b1} ${u.l} and ${g.b2} ${u.l} and a height of ${g.h} ${u.l}. A second ${c.n} is shaped like a parallelogram with a base of ${p} ${u.l} and the same height. What is the difference between the two areas?`,
        `${As} tiene forma de trapecio con bases de ${g.b1} ${u.l} y ${g.b2} ${u.l} y una altura de ${g.h} ${u.l}. ${capital(sec[1])} ${c.e} tiene forma de paralelogramo con una base de ${p} ${u.l} y la misma altura. ¿Cuál es la diferencia entre las dos áreas?`,
      ],
      a: diff,
      unit: u.a,
      fw: [
        { v: Math.abs((g.b1 + g.b2) * g.h - paraA), tag: "forgot-half" },
        { v: Math.abs(g.b1 * g.h - paraA), tag: "one-base-only" },
        { v: trapA + paraA, tag: "added-instead" },
        { v: Math.abs(g.b2 * g.h - paraA), tag: "forgot-triangles" },
      ],
      p: { what: "area", shape: "trap" },
      x: [
        `Trapezoid: ½ × (${g.b1} + ${g.b2}) × ${g.h} = ${trapA} ${u.a}. Parallelogram: ${p} × ${g.h} = ${paraA} ${u.a}. The difference is ${Math.max(trapA, paraA)} − ${Math.min(trapA, paraA)} = ${diff} ${u.a}.`,
        `Trapecio: ½ × (${g.b1} + ${g.b2}) × ${g.h} = ${trapA} ${u.a}. Paralelogramo: ${p} × ${g.h} = ${paraA} ${u.a}. La diferencia es ${Math.max(trapA, paraA)} − ${Math.min(trapA, paraA)} = ${diff} ${u.a}.`,
      ],
      h: [
        [
          "Find each area separately. The trapezoid needs both bases and a half; the parallelogram needs one base and no half.",
          "Halla cada área por separado. El trapecio necesita las dos bases y una mitad; el paralelogramo necesita una base y no tiene mitad.",
        ],
        [
          `Trapezoid: ½ × (${g.b1} + ${g.b2}) × ${g.h}. Parallelogram: ${p} × ${g.h}.`,
          `Trapecio: ½ × (${g.b1} + ${g.b2}) × ${g.h}. Paralelogramo: ${p} × ${g.h}.`,
        ],
        ["Subtract the smaller area from the larger one.", "Resta el área menor del área mayor."],
      ],
      viz: trapViz(g, u),
      meta: { kind: "compare", b1: g.b1, b2: g.b2, h: g.h, p },
    });
  };

  /** Cost of covering a trapezoid. */
  const zCost = (rng) => {
    const c = rng.pick(CZ.filter((k) => k.pay));
    const u = unitOf(rng, c, ["ft", "m"]);
    const g = trapGeom(rng, { slant: true });
    const rate = rng.pick([2, 3, 4, 5, 6, 8]);
    const ar = g.h * (g.b2 + g.e);
    const [d0, d1] = zDesc(c, g, u, true, rng.chance(0.5));
    return numI({
      q: [
        `${d0} Covering it costs $${rate} for each ${u.sq}. How much does it cost to cover the whole surface, in dollars?`,
        `${d1} Cubrirlo cuesta $${rate} por cada ${u.sqEs}. ¿Cuánto cuesta cubrir toda la superficie, en dólares?`,
      ],
      a: ar * rate,
      fw: [
        { v: ar, tag: "forgot-rate" },
        { v: (g.b1 + g.b2) * g.h * rate, tag: "forgot-half" },
        { v: g.b1 * g.h * rate, tag: "one-base-only" },
        { v: ((g.b1 + g.b2) * g.side * rate) / 2, tag: "used-slant-height" },
      ],
      p: { what: "area", shape: "trap" },
      x: [
        `Area = ½ × (${g.b1} + ${g.b2}) × ${g.h} = ${ar} ${u.a}. Cost = ${ar} × $${rate} = $${ar * rate}. The slanted sides (${g.side} ${u.l}) are not used.`,
        `Área = ½ × (${g.b1} + ${g.b2}) × ${g.h} = ${ar} ${u.a}. Costo = ${ar} × $${rate} = $${ar * rate}. Los lados inclinados (${g.side} ${u.l}) no se usan.`,
      ],
      h: [
        [
          "Two steps: find the area, then multiply by the price for each square unit.",
          "Dos pasos: halla el área y luego multiplica por el precio de cada unidad cuadrada.",
        ],
        zHints(g, u)[1],
        [
          `Find ½ × (${g.b1} + ${g.b2}) × ${g.h}. Then multiply that area by ${rate}.`,
          `Halla ½ × (${g.b1} + ${g.b2}) × ${g.h}. Luego multiplica esa área por ${rate}.`,
        ],
      ],
      viz: trapViz(g, u, { slant: true }),
      meta: { kind: "cost", b1: g.b1, b2: g.b2, h: g.h, rate },
    });
  };

  reg(
    "areaTrapezoid",
    "Area of trapezoids",
    "Área de trapecios",
    {
      1: [zPiece, zExpr, zArea({})],
      2: [zArea({ slant: true }), zArea({ slant: true, mc: true }), zArea({ mc: true })],
      3: [zMiss({}), zPara, zMiss({}), zArea({ slant: true, mc: true })],
      4: [zCost, zCompare, zMiss({ trap: true })],
    },
    (item) => {
      const m = item.meta;
      const area = () => shoelace(trapPts(m.b1, m.b2, m.h));
      switch (m.kind) {
        case "piece": {
          const e = (m.b1 - m.b2) / 2;
          const want = {
            tbase: e,
            rect: shoelace([
              [0, 0],
              [m.b2, 0],
              [m.b2, m.h],
              [0, m.h],
            ]),
            tri: shoelace([
              [0, 0],
              [e, 0],
              [e, m.h],
            ]),
          }[m.ask];
          return wantNum(item, want, `trapezoid piece ${m.ask}`);
        }
        case "expr":
          return wantSum(item, area(), "expression");
        case "area":
          return wantNum(item, area(), "trapezoid area");
        case "areaMC":
          return wantChoice(item, area(), m.ua, "trapezoid area");
        case "para":
          return wantChoice(
            item,
            shoelace(paraPts(m.b1 + m.b2, m.h, 0)),
            m.ua,
            "parallelogram of two trapezoids",
          );
        case "miss": {
          const t = G.value(item.a);
          const [b1, b2, h] =
            m.find === "h" ? [m.b1, m.b2, t] : [Math.max(m.b1, t), Math.min(m.b1, t), m.h];
          return (
            near(shoelace(trapPts(b1, b2, h)), m.A) ||
            `missing ${m.find} ${item.a} does not give area ${m.A}`
          );
        }
        case "compare": {
          const diff = Math.abs(area() - shoelace(paraPts(m.p, m.h, 0)));
          return wantNum(item, diff, "difference");
        }
        case "cost":
          return wantNum(item, area() * m.rate, "cost");
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  );

  /* ====================================================================================== */
  /* 4. areaComposite  (5-4)                                                                 */
  /* ====================================================================================== */
  Object.assign(MIS, {
    "forgot-cutout": [
      "That is the whole rectangle. The cut-out is not part of the figure, so its area must come off.",
      "Ese es el rectángulo completo. La parte recortada no es de la figura, así que su área se resta.",
    ],
    "added-cutout": [
      "That adds the cut-out. The cut-out is missing from the figure, so subtract it instead.",
      "Eso suma la parte recortada. Esa parte falta en la figura, así que se resta.",
    ],
    "forgot-piece": [
      "That leaves out a piece of the figure. Every part of the shape has to be counted.",
      "Eso deja fuera una parte de la figura. Hay que contar todas las partes.",
    ],
    "double-counted": [
      "These pieces overlap, so part of the figure is counted twice. Split it so the pieces only touch.",
      "Estas partes se traslapan, así que una parte de la figura se cuenta dos veces. Divídela para que las partes solo se toquen.",
    ],
  });
  RC.comp = [
    "Split the figure into rectangles and add them, or take a cut-out away from a bigger rectangle.",
    "Divide la figura en rectángulos y súmalos, o resta la parte recortada de un rectángulo más grande.",
  ];
  const CK = [
    { n: "patio", e: "patio", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "classroom floor", e: "piso del salón", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "garden", e: "jardín", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "parking lot", e: "estacionamiento", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "playground", e: "patio de juegos", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "rug", e: "alfombra", g: "f", u: ["ft", "m"], pay: 1 },
    { n: "quilt", e: "colcha", g: "f", u: ["in", "cm"] },
    { n: "poster board", e: "cartulina", g: "f", u: ["in", "cm"] },
  ];
  /** L-shape: an l × w rectangle with an l2 × w2 corner cut out (StudioViz draws the notch at the top right). */
  const lViz = (g, u, dims) => shape("lshape", dims || { l: g.l, w: g.w, l2: g.l2, w2: g.w2 }, u.l);
  const lPts = (g) => [
    [0, 0],
    [g.l - g.l2, 0],
    [g.l - g.l2, g.w2],
    [g.l, g.w2],
    [g.l, g.w],
    [0, g.w],
  ];
  function lGeom(rng) {
    for (;;) {
      const l = rng.int(9, 20);
      const w = rng.int(7, 14);
      const l2 = rng.int(2, l - 4);
      const w2 = rng.int(2, w - 3);
      const area = l * w - l2 * w2;
      if (new Set([l, w, l2, w2, l - l2, w - w2, area]).size === 7) return { l, w, l2, w2, area };
    }
  }
  const lWords = (c, g, u) => {
    const [Ae, As] = An(c);
    const [_Oe, Os] = ofThe(c);
    return [
      `${Ae} is a rectangle ${g.l} ${u.l} long and ${g.w} ${u.l} wide, but a ${g.l2} ${u.l} by ${g.w2} ${u.l} corner is cut out. That corner is not part of the ${c.n}.`,
      `${As} es un rectángulo de ${g.l} ${u.l} de largo y ${g.w} ${u.l} de ancho, pero se recorta una esquina de ${g.l2} ${u.l} por ${g.w2} ${u.l}. Esa esquina no es parte ${Os.replace(/^(del|de la) .*/, (m) => (m.split(" ")[0] === "del" ? "del" : "de la"))} ${c.e}.`,
    ];
  };
  const cX = (g, u, ar) => [
    `Whole rectangle: ${g.l} × ${g.w} = ${g.l * g.w} ${u.a}. Cut-out: ${g.l2} × ${g.w2} = ${g.l2 * g.w2} ${u.a}. Figure: ${g.l * g.w} − ${g.l2 * g.w2} = ${ar} ${u.a}. Splitting into two rectangles gives the same: ${g.l} × ${g.w - g.w2} + ${g.l - g.l2} × ${g.w2} = ${ar} ${u.a}.`,
    `Rectángulo completo: ${g.l} × ${g.w} = ${g.l * g.w} ${u.a}. Parte recortada: ${g.l2} × ${g.w2} = ${g.l2 * g.w2} ${u.a}. Figura: ${g.l * g.w} − ${g.l2 * g.w2} = ${ar} ${u.a}. Dividir en dos rectángulos da lo mismo: ${g.l} × ${g.w - g.w2} + ${g.l - g.l2} × ${g.w2} = ${ar} ${u.a}.`,
  ];
  const cHints = (g, _u) => [
    RC.comp,
    [
      `Cut-out: ${g.l2} × ${g.w2}. Whole rectangle: ${g.l} × ${g.w}.`,
      `Parte recortada: ${g.l2} × ${g.w2}. Rectángulo completo: ${g.l} × ${g.w}.`,
    ],
    [
      "Subtract the cut-out from the whole rectangle.",
      "Resta la parte recortada del rectángulo completo.",
    ],
  ];
  const cWrong = (g) => [
    { k: "forgot-cutout", v: g.l * g.w },
    { k: "added-cutout", v: g.l * g.w + g.l2 * g.w2 },
    { k: "forgot-piece", v: (g.l - g.l2) * g.w2 },
    { k: "double-counted", v: g.l * (g.w - g.w2) + (g.l - g.l2) * g.w },
  ];

  /** Which sum gives the area of the L-shape?  (level 1: decide how to split) */
  const cSplit = (rng) => {
    const c = rng.pick(CK);
    const u = unitOf(rng, c);
    const g = lGeom(rng);
    const [d0, d1] = lWords(c, g, u);
    const horiz = rng.chance(0.5);
    const right = horiz
      ? `${g.l} × ${g.w - g.w2} + ${g.l - g.l2} × ${g.w2}`
      : `${g.l - g.l2} × ${g.w} + ${g.l2} × ${g.w - g.w2}`;
    return mcI(rng, {
      q: [
        `${d0} Which sum gives the area of what is left?`,
        `${d1} ¿Qué suma da el área de lo que queda?`,
      ],
      right,
      key: calc,
      wrong: [
        { v: `${g.l} × ${g.w}`, tag: "forgot-cutout" },
        { v: `${g.l} × ${g.w} + ${g.l2} × ${g.w2}`, tag: "added-cutout" },
        { v: `${g.l} × ${g.w - g.w2} + ${g.l - g.l2} × ${g.w}`, tag: "double-counted" },
        { v: `${g.l - g.l2} × ${g.w2}`, tag: "forgot-piece" },
        { v: `${g.l} × ${g.w - g.w2} + ${g.l2} × ${g.w2}`, tag: "double-counted" },
      ],
      x: cX(g, u, g.area),
      h: cHints(g, u),
      viz: lViz(g, u),
      meta: { kind: "split", ...g },
    });
  };

  /** L-shape given by its edges: bottom l, left w, top l1, right w1.  (level 2) */
  const cEdges = (rng) => {
    const c = rng.pick(CK);
    const u = unitOf(rng, c);
    const g = lGeom(rng);
    const [l1, w1] = [g.l - g.l2, g.w - g.w2];
    const [Ae, As] = An(c);
    return numI({
      q: [
        `${Ae} is shaped like an L. Its bottom edge is ${g.l} ${u.l}, its left edge is ${g.w} ${u.l}, its top edge is ${l1} ${u.l}, and its right edge is ${w1} ${u.l}. What is its area?`,
        `${As} tiene forma de L. Su borde inferior mide ${g.l} ${u.l}, su borde izquierdo mide ${g.w} ${u.l}, su borde superior mide ${l1} ${u.l} y su borde derecho mide ${w1} ${u.l}. ¿Cuál es su área?`,
      ],
      a: g.area,
      unit: u.a,
      fw: cWrong(g).map((w) => ({ v: w.v, tag: w.k })),
      x: [
        `Split the L into two rectangles: ${g.l} × ${w1} = ${g.l * w1} ${u.a} on the bottom and ${l1} × ${g.w2} = ${l1 * g.w2} ${u.a} on top. Total: ${g.area} ${u.a}.`,
        `Divide la L en dos rectángulos: ${g.l} × ${w1} = ${g.l * w1} ${u.a} abajo y ${l1} × ${g.w2} = ${l1 * g.w2} ${u.a} arriba. Total: ${g.area} ${u.a}.`,
      ],
      h: [
        RC.comp,
        [
          `The bottom strip is ${g.l} ${u.l} long and ${w1} ${u.l} tall. What is left above it?`,
          `La franja de abajo mide ${g.l} ${u.l} de largo y ${w1} ${u.l} de alto. ¿Qué queda encima?`,
        ],
        [
          `The top part is ${l1} ${u.l} wide. Its height is the left edge minus ${w1}.`,
          `La parte de arriba mide ${l1} ${u.l} de ancho. Su altura es el borde izquierdo menos ${w1}.`,
        ],
      ],
      p: { what: "area" },
      viz: lViz(g, u, { l: g.l, w: g.w, l1, w1 }),
      meta: { kind: "area", ...g },
    });
  };

  /** Rectangle with a corner cut out: subtract.  (level 3) */
  const cCut = (rng) => {
    const c = rng.pick(CK);
    const u = unitOf(rng, c);
    const g = lGeom(rng);
    const [d0, d1] = lWords(c, g, u);
    return numI({
      q: [`${d0} What is the area of what is left?`, `${d1} ¿Cuál es el área de lo que queda?`],
      a: g.area,
      unit: u.a,
      fw: cWrong(g).map((w) => ({ v: w.v, tag: w.k })),
      x: cX(g, u, g.area),
      h: cHints(g, u),
      p: { what: "area" },
      viz: lViz(g, u),
      meta: { kind: "area", ...g },
    });
  };

  /** Paint or cover the L-shape: area, then the price.  (level 4) */
  const cCost = (rng) => {
    const c = rng.pick(CK.filter((k) => k.pay));
    const u = unitOf(rng, c, ["ft", "m"]);
    const g = lGeom(rng);
    const rate = rng.pick([2, 3, 4, 5, 6]);
    const [d0, d1] = lWords(c, g, u);
    return numI({
      q: [
        `${d0} Covering it costs $${rate} for each ${u.sq}. How much does it cost, in dollars?`,
        `${d1} Cubrirlo cuesta $${rate} por cada ${u.sqEs}. ¿Cuánto cuesta, en dólares?`,
      ],
      a: g.area * rate,
      fw: [
        { v: g.area, tag: "forgot-rate" },
        { v: g.l * g.w * rate, tag: "forgot-cutout" },
        { v: (g.l * g.w + g.l2 * g.w2) * rate, tag: "added-cutout" },
        { v: g.area + rate, tag: "added-instead" },
      ],
      x: [
        `${cX(g, u, g.area)[0].split(" Splitting")[0]} Cost: ${g.area} × $${rate} = $${g.area * rate}.`,
        `${cX(g, u, g.area)[1].split(" Dividir")[0]} Costo: ${g.area} × $${rate} = $${g.area * rate}.`,
      ],
      h: [
        [
          "Two steps: find the area, then multiply by the price.",
          "Dos pasos: halla el área y luego multiplica por el precio.",
        ],
        cHints(g, u)[1],
        [
          `Subtract the cut-out. Then multiply by ${rate}.`,
          `Resta la parte recortada. Luego multiplica por ${rate}.`,
        ],
      ],
      p: { what: "area" },
      viz: lViz(g, u),
      meta: { kind: "cost", ...g, rate },
    });
  };

  /** Work backwards: the area is known, find the cut-out's height.  (level 4) */
  const cBack = (rng) => {
    const c = rng.pick(CK);
    const u = unitOf(rng, c);
    const g = lGeom(rng);
    const [Ae, As] = An(c);
    const cutA = g.l2 * g.w2;
    return numI({
      q: [
        `${Ae} is a rectangle ${g.l} ${u.l} long and ${g.w} ${u.l} wide. A corner ${g.l2} ${u.l} wide is cut out, and ${g.area} ${u.a} is left. How tall is the cut-out corner?`,
        `${As} es un rectángulo de ${g.l} ${u.l} de largo y ${g.w} ${u.l} de ancho. Se recorta una esquina de ${g.l2} ${u.l} de ancho y quedan ${g.area} ${u.a}. ¿Qué altura tiene la esquina recortada?`,
      ],
      a: g.w2,
      unit: u.l,
      fw: [
        { v: cutA, tag: "gave-area" },
        { v: g.l * g.w - g.area - g.l2, tag: "subtracted-instead" },
        { v: g.area / g.l2, tag: "multiplied-instead" },
      ],
      x: [
        `Whole rectangle: ${g.l} × ${g.w} = ${g.l * g.w} ${u.a}. Cut-out area: ${g.l * g.w} − ${g.area} = ${cutA} ${u.a}. Its height = ${cutA} ÷ ${g.l2} = ${g.w2} ${u.l}.`,
        `Rectángulo completo: ${g.l} × ${g.w} = ${g.l * g.w} ${u.a}. Área recortada: ${g.l * g.w} − ${g.area} = ${cutA} ${u.a}. Su altura = ${cutA} ÷ ${g.l2} = ${g.w2} ${u.l}.`,
      ],
      h: [
        ["First find how much area was cut away.", "Primero halla cuánta área se recortó."],
        [
          `Whole rectangle minus what is left is the cut-out's area.`,
          "El rectángulo completo menos lo que queda es el área recortada.",
        ],
        [
          `The cut-out is ${g.l2} wide, so divide its area by ${g.l2}.`,
          `La parte recortada mide ${g.l2} de ancho, así que divide su área entre ${g.l2}.`,
        ],
      ],
      p: { what: "area" },
      viz: lViz(g, u, { l: g.l, w: g.w, l2: g.l2, w2: Q }),
      meta: { kind: "back", ...g },
    });
  };

  reg(
    "areaComposite",
    "Area of composite figures",
    "Área de figuras compuestas",
    {
      1: [cSplit, cSplit, cCut],
      2: [cEdges, cEdges, cCut],
      3: [cCut, cEdges, cSplit],
      4: [cCost, cBack, cCost],
    },
    (item) => {
      const m = item.meta;
      // count unit cells of the grid: a cell is in the figure when it is not inside the cut-out
      let cells = 0;
      for (let x = 0; x < m.l; x++)
        for (let y = 0; y < m.w; y++) if (!(x >= m.l - m.l2 && y < m.w2)) cells++;
      const poly = shoelace(lPts(m));
      if (cells !== poly) return `cells ${cells} vs polygon ${poly}`;
      switch (m.kind) {
        case "split":
          return wantSum(item, cells, "split");
        case "area":
          return wantNum(item, cells, "composite area");
        case "cost":
          return wantNum(item, cells * m.rate, "cost");
        case "back": {
          const w2 = G.value(item.a);
          return (
            near(m.l * m.w - m.l2 * w2, m.area) ||
            `cut-out height ${item.a} does not leave ${m.area}`
          );
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  );

  /* ====================================================================================== */
  /* 5. volumePrism  (5-5, 5-10)                                                             */
  /* ====================================================================================== */
  Object.assign(MIS, {
    "forgot-height": [
      "That is only the area of the bottom (the base). Volume also needs the height, the number of layers.",
      "Esa es solo el área del fondo (la base). El volumen también necesita la altura, el número de capas.",
    ],
    "surface-for-volume": [
      "That adds up the areas of the outside faces. Volume is the space inside: length × width × height.",
      "Eso suma las áreas de las caras de afuera. El volumen es el espacio de adentro: largo × ancho × altura.",
    ],
    "rounded-edge": [
      "That rounds a fraction to a whole number first. Use the exact edge length.",
      "Eso redondea una fracción a un número entero primero. Usa la longitud exacta de la arista.",
    ],
    "divided-once": [
      "That divides by only one edge. The volume is length × width × height, so divide by both edges you know.",
      "Eso divide entre una sola arista. El volumen es largo × ancho × altura, así que divide entre las dos aristas que conoces.",
    ],
    "ignored-cube-size": [
      "That counts whole cubes. The small cubes are much smaller, so many of them fit in each whole cube.",
      "Eso cuenta cubos enteros. Los cubos pequeños son mucho más pequeños, así que caben muchos en cada cubo entero.",
    ],
    "scaled-once": [
      "A half-unit cube is half as long in EVERY direction: length, width and height each need doubling.",
      "Un cubo de media unidad mide la mitad en CADA dirección: el largo, el ancho y la altura se duplican.",
    ],
    "one-dimension-only": [
      "That counts boxes along one edge only. The crate fills in all three directions.",
      "Eso cuenta las cajas a lo largo de una sola arista. La caja grande se llena en las tres direcciones.",
    ],
    "gave-volume": [
      "That is the volume of the crate, not the number of boxes. Compare the crate to one box.",
      "Ese es el volumen de la caja grande, no el número de cajas. Compara la caja grande con una caja.",
    ],
    "used-full-height": [
      "That fills the whole tank. The water only goes up to its own depth.",
      "Eso llena todo el tanque. El agua solo llega a su propia profundidad.",
    ],
  });
  RC.vol = [
    "Volume of a box = length × width × height. Base area × height gives the same number.",
    "Volumen de una caja = largo × ancho × altura. Área de la base × altura da el mismo número.",
  ];
  const CV = [
    { n: "aquarium", e: "acuario", g: "m", u: ["ft", "in"] },
    { n: "gift box", e: "caja de regalo", g: "f", u: ["in", "cm"] },
    { n: "shipping box", e: "caja de envío", g: "f", u: ["in", "ft"] },
    { n: "storage bin", e: "contenedor", g: "m", u: ["in", "ft"] },
    { n: "sandbox", e: "arenero", g: "m", u: ["ft", "m"] },
    { n: "planter box", e: "jardinera", g: "f", u: ["ft", "in"] },
    { n: "toy chest", e: "baúl de juguetes", g: "m", u: ["ft", "in"] },
    { n: "cereal box", e: "caja de cereal", g: "f", u: ["in", "cm"] },
  ];
  /** Quarters as people write them: 2.5 -> "2 1/2". */
  const fr = (x) => G.mixed(Math.round(x * 4), 4);
  const pBox = (g, u, extra = {}) => prismViz(g.l, g.w, g.h, u.l, extra);
  /** Volume by counting cubes that are 0.05 units on an edge (every edge here is a multiple of that). */
  const vol = (l, w, h) => (Math.round(l * 20) * Math.round(w * 20) * Math.round(h * 20)) / 8000;
  function vGeom(rng, { frac, small } = {}) {
    for (;;) {
      const e = small
        ? [rng.int(2, 5), rng.int(2, 4), rng.int(1, 3)]
        : [rng.int(3, 12), rng.int(2, 8), rng.int(2, 8)];
      if (frac) e[rng.int(0, 2)] += 0.5;
      const g = { l: e[0], w: e[1], h: e[2] };
      const v = g.l * g.w * g.h;
      if (new Set([g.l, g.w, g.h]).size === 3 && !Object.values(g).includes(v)) return g;
    }
  }
  const eT = (x, frac) => (frac ? fr(x) : String(x));
  const vDesc = (c, g, u, frac) => {
    const [Ae, As] = An(c);
    return [
      `${Ae} is a rectangular prism ${eT(g.l, frac)} ${u.l} long, ${eT(g.w, frac)} ${u.l} wide, and ${eT(g.h, frac)} ${u.l} tall.`,
      `${As} es un prisma rectangular de ${eT(g.l, frac)} ${u.l} de largo, ${eT(g.w, frac)} ${u.l} de ancho y ${eT(g.h, frac)} ${u.l} de alto.`,
    ];
  };
  const vNumW = (v, frac) => (frac ? fr(v) : String(v));
  const vX = (g, u, v, frac) => [
    `Volume = length × width × height = ${eT(g.l, frac)} × ${eT(g.w, frac)} × ${eT(g.h, frac)} = ${vNumW(v, frac)} ${u.v}. The base area is ${eT(g.l, frac)} × ${eT(g.w, frac)} = ${vNumW(g.l * g.w, frac)} ${u.a}, and times the height ${eT(g.h, frac)} gives the same volume. Volume counts cubes, so the unit is ${u.v}.`,
    `Volumen = largo × ancho × altura = ${eT(g.l, frac)} × ${eT(g.w, frac)} × ${eT(g.h, frac)} = ${vNumW(v, frac)} ${u.v}. El área de la base es ${eT(g.l, frac)} × ${eT(g.w, frac)} = ${vNumW(g.l * g.w, frac)} ${u.a}, y por la altura ${eT(g.h, frac)} da el mismo volumen. El volumen cuenta cubos, así que la unidad es ${u.v}.`,
  ];
  const vHints = (g, u, frac) => [
    RC.vol,
    [
      `First the base: ${eT(g.l, frac)} × ${eT(g.w, frac)}. That is how many cubes cover the bottom layer.`,
      `Primero la base: ${eT(g.l, frac)} × ${eT(g.w, frac)}. Esa es la cantidad de cubos que cubre la capa de abajo.`,
    ],
    [
      `Then multiply by the height, ${eT(g.h, frac)}. Write the unit with a small 3: ${u.v}.`,
      `Luego multiplica por la altura, ${eT(g.h, frac)}. Escribe la unidad con un 3 pequeño: ${u.v}.`,
    ],
  ];

  /** Count the unit cubes that fill a small box.  (level 1) */
  const vCubes = (rng) => {
    const c = rng.pick(CV);
    const u = unitOf(rng, c);
    const g = vGeom(rng, { small: true });
    const v = g.l * g.w * g.h;
    const [d0, d1] = vDesc(c, g, u, false);
    return numI({
      q: [
        `${d0} It is filled with cubes that are 1 ${u.l} on every edge. How many cubes fill it?`,
        `${d1} Se llena con cubos de 1 ${u.l} en cada arista. ¿Cuántos cubos lo llenan?`,
      ],
      a: v,
      unit: "cubes",
      fw: [
        { v: g.l * g.w, tag: "forgot-height" },
        { v: g.l + g.w + g.h, tag: "added-instead" },
        { v: 2 * (g.l * g.w + g.l * g.h + g.w * g.h), tag: "surface-for-volume" },
      ],
      x: [
        `One layer has ${g.l} × ${g.w} = ${g.l * g.w} cubes, and there are ${g.h} layers: ${g.l * g.w} × ${g.h} = ${v} cubes, so the volume is ${v} ${u.v}.`,
        `Una capa tiene ${g.l} × ${g.w} = ${g.l * g.w} cubos y hay ${g.h} capas: ${g.l * g.w} × ${g.h} = ${v} cubos, así que el volumen es ${v} ${u.v}.`,
      ],
      h: [
        ["Fill the box one layer at a time.", "Llena la caja una capa a la vez."],
        [
          `How many cubes make one layer? Length × width.`,
          "¿Cuántos cubos forman una capa? Largo × ancho.",
        ],
        [
          `Now count the layers: the height is ${g.h}.`,
          `Ahora cuenta las capas: la altura es ${g.h}.`,
        ],
      ],
      p: { what: "volume" },
      viz: pBox(g, u, { cubes: true }),
      meta: { kind: "cubes", ...g },
    });
  };

  /** Volume of a prism.  frac: one edge is a half.  mc: choose among volumes with units.  small: level 1 sizes. */
  const vFind = (o) => (rng) => {
    const c = rng.pick(CV);
    const u = unitOf(rng, c);
    const g = vGeom(rng, { frac: o.frac, small: o.small });
    const v = g.l * g.w * g.h;
    const [d0, d1] = vDesc(c, g, u, o.frac);
    const f = (x) => (o.frac ? `${vNumW(x, true)}` : String(x));
    const base = {
      q: [
        `${d0} ${o.mc ? "Which choice is its volume?" : "What is its volume?"}`,
        `${d1} ${o.mc ? "¿Qué opción es su volumen?" : "¿Cuál es su volumen?"}`,
      ],
      x: vX(g, u, v, o.frac),
      h: vHints(g, u, o.frac),
      viz: pBox(g, u, o.frac ? { frac: true } : {}),
      p: { what: "volume" },
    };
    const cand = [
      { k: "forgot-height", v: g.l * g.w },
      { k: "added-instead", v: g.l + g.w + g.h },
      { k: "surface-for-volume", v: 2 * (g.l * g.w + g.l * g.h + g.w * g.h) },
      o.frac && { k: "rounded-edge", v: Math.round(g.l) * Math.round(g.w) * Math.round(g.h) },
      { k: "added-instead", v: 2 * (g.l + g.w + g.h) },
    ].filter(Boolean);
    if (o.mc)
      return mcI(rng, {
        ...base,
        right: `${f(v)} ${u.v}`,
        wrong: [
          ...cand.map((w) => ({ v: `${f(w.v)} ${u.v}`, tag: w.k })),
          { v: `${f(v)} ${u.a}`, tag: "unit-mismatch" },
        ],
        meta: { kind: "volMC", ...g, uv: u.v },
      });
    return numI({
      ...base,
      a: v,
      unit: u.v,
      tol: 0.001,
      fw: cand.map((w) => ({ v: w.v, tag: w.k })),
      meta: { kind: "vol", ...g },
    });
  };

  /** A missing edge from the volume.  (level 3; level 4 adds a half edge) */
  const vMiss = (o) => (rng) => {
    const c = rng.pick(CV);
    const u = unitOf(rng, c);
    const g = vGeom(rng, { frac: o.frac });
    const v = g.l * g.w * g.h;
    const [Te, Ts] = The(c);
    const pick = rng.int(0, 2);
    const names = [
      ["length", "largo"],
      ["width", "ancho"],
      ["height", "alto"],
    ];
    const keys = ["l", "w", "h"];
    const ans = g[keys[pick]];
    if ([ans, v].some((x) => keys.filter((_, i) => i !== pick).some((k) => Math.floor(g[k]) === x)))
      return vMiss(o)(rng);
    const known = keys.filter((_, i) => i !== pick).map((k) => g[k]);
    const kn = known.map((x) => eT(x, o.frac));
    const [ne, ns] = names[pick];
    const others = names.filter((_, i) => i !== pick);
    return numI({
      q: [
        `${Te} is a rectangular prism with a volume of ${vNumW(v, o.frac)} ${u.v}. Its ${others[0][0]} is ${kn[0]} ${u.l} and its ${others[1][0]} is ${kn[1]} ${u.l}. What is its ${ne}?`,
        `${Ts} es un prisma rectangular con un volumen de ${vNumW(v, o.frac)} ${u.v}. Su ${others[0][1]} mide ${kn[0]} ${u.l} y su ${others[1][1]} mide ${kn[1]} ${u.l}. ¿Cuánto mide su ${ns}?`,
      ],
      a: ans,
      unit: u.l,
      tol: 0.001,
      fw: [
        { v: v / known[0], tag: "divided-once" },
        { v: v / known[1], tag: "divided-once" },
        { v: v * known[0] * known[1], tag: "multiplied-instead" },
        { v: v - known[0] - known[1], tag: "subtracted-instead" },
      ],
      x: [
        `Volume = length × width × height, so the missing ${ne} = ${vNumW(v, o.frac)} ÷ (${kn[0]} × ${kn[1]}) = ${vNumW(v, o.frac)} ÷ ${vNumW(known[0] * known[1], o.frac)} = ${eT(ans, o.frac)} ${u.l}.`,
        `Volumen = largo × ancho × altura, así que el ${ns} que falta = ${vNumW(v, o.frac)} ÷ (${kn[0]} × ${kn[1]}) = ${vNumW(v, o.frac)} ÷ ${vNumW(known[0] * known[1], o.frac)} = ${eT(ans, o.frac)} ${u.l}.`,
      ],
      h: [
        RC.missing,
        [
          `Multiply the two edges you know: ${kn[0]} × ${kn[1]}. That is their area.`,
          `Multiplica las dos aristas que conoces: ${kn[0]} × ${kn[1]}. Esa es su área.`,
        ],
        [
          `Think: (that product) × ? = ${vNumW(v, o.frac)}. Divide.`,
          `Piensa: (ese producto) × ? = ${vNumW(v, o.frac)}. Divide.`,
        ],
      ],
      p: { what: "volume" },
      viz: prismViz(
        pick === 0 ? Q : g.l,
        pick === 1 ? Q : g.w,
        pick === 2 ? Q : g.h,
        u.l,
        o.frac ? { frac: true } : {},
      ),
      meta: { kind: "miss", V: v, known, ask: pick },
    });
  };

  /** Pack a box with half-unit cubes: count them.  (level 3) */
  const vHalf = (rng) => {
    const c = rng.pick(CV);
    const u = unitOf(rng, c);
    const g = vGeom(rng, { small: true, frac: true });
    const v = g.l * g.w * g.h;
    const [d0, d1] = vDesc(c, g, u, true);
    const n = 8 * v;
    return numI({
      q: [
        `${d0} It is packed with small cubes that are ½ ${u.l} on every edge. How many small cubes fill it?`,
        `${d1} Se llena con cubos pequeños de ½ ${u.l} en cada arista. ¿Cuántos cubos pequeños lo llenan?`,
      ],
      a: n,
      unit: "cubes",
      tol: 0.001,
      fw: [
        { v, tag: "ignored-cube-size" },
        { v: v * 2, tag: "scaled-once" },
        { v: v * 4, tag: "scaled-once" },
      ],
      x: [
        `Along each edge, ½-${u.l} cubes fit twice as many times: ${g.l * 2} by ${g.w * 2} by ${g.h * 2}. ${g.l * 2} × ${g.w * 2} × ${g.h * 2} = ${n} cubes. Each is ⅛ ${u.v}, so the volume is ${n} ÷ 8 = ${vNumW(v, true)} ${u.v}.`,
        `A lo largo de cada arista caben el doble de cubos de ½ ${u.l}: ${g.l * 2} por ${g.w * 2} por ${g.h * 2}. ${g.l * 2} × ${g.w * 2} × ${g.h * 2} = ${n} cubos. Cada uno es ⅛ ${u.v}, así que el volumen es ${n} ÷ 8 = ${vNumW(v, true)} ${u.v}.`,
      ],
      h: [
        [
          "Each edge is twice as long when you measure it in half-unit cubes.",
          "Cada arista es el doble de larga si la mides en cubos de media unidad.",
        ],
        [
          `Count cubes along each edge: double ${eT(g.l, true)}, ${eT(g.w, true)} and ${eT(g.h, true)}.`,
          `Cuenta los cubos en cada arista: el doble de ${eT(g.l, true)}, ${eT(g.w, true)} y ${eT(g.h, true)}.`,
        ],
        ["Multiply the three counts.", "Multiplica los tres conteos."],
      ],
      p: { what: "volume" },
      viz: pBox(g, u, { frac: true }),
      meta: { kind: "half", ...g },
    });
  };

  /** How many small boxes fit in a crate (they fill it exactly)?  (level 4) */
  const vPack = (rng) => {
    const c = rng.pick(CV.filter((k) => k.u.includes("in")));
    const u = UN.in;
    const b = [rng.int(2, 4), rng.int(2, 4), rng.int(2, 5)];
    const k = [rng.int(2, 5), rng.int(2, 4), rng.int(2, 3)];
    const crate = { l: b[0] * k[0], w: b[1] * k[1], h: b[2] * k[2] };
    const n = k[0] * k[1] * k[2];
    if ([...b, ...Object.values(crate)].includes(n)) return vPack(rng);
    const [Ae, As] = An(c);
    return numI({
      q: [
        `${Ae} measures ${crate.l} in by ${crate.w} in by ${crate.h} in. It is packed with small boxes that each measure ${b[0]} in by ${b[1]} in by ${b[2]} in, with no gaps. How many small boxes fit?`,
        `${As} mide ${crate.l} in por ${crate.w} in por ${crate.h} in. Se llena con cajas pequeñas que miden ${b[0]} in por ${b[1]} in por ${b[2]} in, sin dejar huecos. ¿Cuántas cajas pequeñas caben?`,
      ],
      a: n,
      unit: "boxes",
      fw: [
        { v: k[0], tag: "one-dimension-only" },
        { v: crate.l * crate.w * crate.h, tag: "gave-volume" },
        { v: k[0] + k[1] + k[2], tag: "added-instead" },
      ],
      x: [
        `Crate: ${crate.l} × ${crate.w} × ${crate.h} = ${crate.l * crate.w * crate.h} in³. One box: ${b[0]} × ${b[1]} × ${b[2]} = ${b[0] * b[1] * b[2]} in³. ${crate.l * crate.w * crate.h} ÷ ${b[0] * b[1] * b[2]} = ${n} boxes. (Along the edges: ${k[0]} × ${k[1]} × ${k[2]}.)`,
        `Caja grande: ${crate.l} × ${crate.w} × ${crate.h} = ${crate.l * crate.w * crate.h} in³. Una caja: ${b[0]} × ${b[1]} × ${b[2]} = ${b[0] * b[1] * b[2]} in³. ${crate.l * crate.w * crate.h} ÷ ${b[0] * b[1] * b[2]} = ${n} cajas. (A lo largo de las aristas: ${k[0]} × ${k[1]} × ${k[2]}.)`,
      ],
      h: [
        [
          "Compare the space inside the crate with the space one box takes.",
          "Compara el espacio dentro de la caja grande con el espacio de una caja.",
        ],
        [
          "Find the volume of the crate and the volume of one small box.",
          "Halla el volumen de la caja grande y el de una caja pequeña.",
        ],
        [
          "Divide the crate's volume by one box's volume.",
          "Divide el volumen de la caja grande entre el de una caja.",
        ],
      ],
      p: { what: "volume" },
      viz: pBox(crate, u),
      meta: { kind: "pack", crate, box: b },
    });
  };

  /** Two boxes: how much more does the bigger one hold?  (level 4) */
  const vCompare = (rng) => {
    const c = rng.pick(CV);
    const u = unitOf(rng, c);
    const a1 = vGeom(rng);
    let a2;
    do a2 = vGeom(rng);
    while (
      Math.abs(a2.l * a2.w * a2.h - a1.l * a1.w * a1.h) < 8 ||
      [a1.l, a1.w, a1.h, a2.l, a2.w, a2.h].includes(
        Math.abs(a2.l * a2.w * a2.h - a1.l * a1.w * a1.h),
      )
    );
    const v1 = a1.l * a1.w * a1.h;
    const v2 = a2.l * a2.w * a2.h;
    const [Ae, As] = An(c);
    return numI({
      q: [
        `${Ae} measures ${a1.l} ${u.l} by ${a1.w} ${u.l} by ${a1.h} ${u.l}. A second ${c.n} measures ${a2.l} ${u.l} by ${a2.w} ${u.l} by ${a2.h} ${u.l}. How much more does the bigger one hold?`,
        `${As} mide ${a1.l} ${u.l} por ${a1.w} ${u.l} por ${a1.h} ${u.l}. ${c.g === "f" ? "Otra" : "Otro"} ${c.e} mide ${a2.l} ${u.l} por ${a2.w} ${u.l} por ${a2.h} ${u.l}. ¿Cuánto más cabe en ${c.g === "f" ? "la" : "el"} más grande?`,
      ],
      a: Math.abs(v1 - v2),
      unit: u.v,
      fw: [
        { v: v1 + v2, tag: "added-instead" },
        { v: Math.abs(a1.l * a1.w - a2.l * a2.w), tag: "forgot-height" },
        { v: Math.max(v1, v2), tag: "gave-volume" },
      ],
      x: [
        `First box: ${a1.l} × ${a1.w} × ${a1.h} = ${v1} ${u.v}. Second box: ${a2.l} × ${a2.w} × ${a2.h} = ${v2} ${u.v}. The difference is ${Math.max(v1, v2)} − ${Math.min(v1, v2)} = ${Math.abs(v1 - v2)} ${u.v}.`,
        `Primera: ${a1.l} × ${a1.w} × ${a1.h} = ${v1} ${u.v}. Segunda: ${a2.l} × ${a2.w} × ${a2.h} = ${v2} ${u.v}. La diferencia es ${Math.max(v1, v2)} − ${Math.min(v1, v2)} = ${Math.abs(v1 - v2)} ${u.v}.`,
      ],
      h: [
        ["Find the volume of each box first.", "Primero halla el volumen de cada caja."],
        ["Use length × width × height for each one.", "Usa largo × ancho × altura para cada una."],
        ["Subtract the smaller volume from the larger.", "Resta el volumen menor del mayor."],
      ],
      p: { what: "volume" },
      viz: pBox(a1, u),
      meta: { kind: "compare", a1, a2 },
    });
  };

  /** A tank filled to a depth in tenths.  (level 4) */
  const vTank = (rng) => {
    const c = rng.pick(
      CV.filter((k) => ["aquarium", "sandbox", "planter box", "storage bin"].includes(k.n)),
    );
    const u = unitOf(rng, c, ["ft", "m"]);
    const g = { l: rng.int(3, 8), w: rng.int(2, 6), h: rng.int(3, 6) };
    const d = rng.int(1, g.h * 10 - 6) / 10;
    const dd = Math.min(d, g.h - 0.5);
    const v = g.l * g.w * dd;
    if (Number.isInteger(dd) || [g.l, g.w, g.h, dd, g.l * g.w].includes(v) || g.l === g.w)
      return vTank(rng);
    const [Ae, As] = An(c);
    return numI({
      q: [
        `${Ae} is a rectangular prism ${g.l} ${u.l} long, ${g.w} ${u.l} wide, and ${g.h} ${u.l} tall. It is filled to a depth of ${fm(dd)} ${u.l}. What is the volume of what it holds?`,
        `${As} es un prisma rectangular de ${g.l} ${u.l} de largo, ${g.w} ${u.l} de ancho y ${g.h} ${u.l} de alto. Se llena hasta una profundidad de ${fm(dd)} ${u.l}. ¿Cuál es el volumen de lo que contiene?`,
      ],
      a: v,
      unit: u.v,
      tol: 0.001,
      fw: [
        { v: g.l * g.w * g.h, tag: "used-full-height" },
        { v: g.l * g.w, tag: "forgot-height" },
        { v: g.l + g.w + dd, tag: "added-instead" },
      ],
      x: [
        `Only the water fills the base: volume = ${g.l} × ${g.w} × ${fm(dd)} = ${fm(v)} ${u.v}. The tank's full height (${g.h} ${u.l}) is not used.`,
        `Solo el agua llena la base: volumen = ${g.l} × ${g.w} × ${fm(dd)} = ${fm(v)} ${u.v}. La altura total del tanque (${g.h} ${u.l}) no se usa.`,
      ],
      h: [
        [
          "Use the depth of the water as the height.",
          "Usa la profundidad del agua como la altura.",
        ],
        [`Base: ${g.l} × ${g.w}.`, `Base: ${g.l} × ${g.w}.`],
        [`Multiply the base area by ${fm(dd)}.`, `Multiplica el área de la base por ${fm(dd)}.`],
      ],
      p: { what: "volume" },
      viz: pBox(g, u),
      meta: { kind: "tank", ...g, d: dd },
    });
  };

  const volCheck = (item) => {
    const m = item.meta;
    switch (m.kind) {
      case "cubes":
      case "vol":
        return wantNum(item, vol(m.l, m.w, m.h), "volume");
      case "volMC":
        return wantChoice(item, vol(m.l, m.w, m.h), m.uv, "volume");
      case "miss": {
        const t = G.value(item.a);
        return (
          near(vol(...[m.known[0], m.known[1], t]), m.V) ||
          `edge ${item.a} does not give volume ${m.V}`
        );
      }
      case "half":
        return wantNum(item, m.l * 2 * m.w * 2 * m.h * 2, "half-unit cubes");
      case "pack":
        return wantNum(
          item,
          Math.floor(m.crate.l / m.box[0]) *
            Math.floor(m.crate.w / m.box[1]) *
            Math.floor(m.crate.h / m.box[2]),
          "boxes",
        );
      case "compare":
        return wantNum(
          item,
          Math.abs(vol(m.a1.l, m.a1.w, m.a1.h) - vol(m.a2.l, m.a2.w, m.a2.h)),
          "difference",
        );
      case "tank":
        return wantNum(item, vol(m.l, m.w, m.d), "water volume");
      default:
        return `unknown kind ${m.kind}`;
    }
  };
  // 5-5 and 5-10 draw from different tables: 5-5 teaches whole-number edges, 5-10 introduces fractional edges.
  reg(
    "volumePrism",
    "Volume of rectangular prisms",
    "Volumen de prismas rectangulares",
    {
      1: [vCubes, vFind({ small: true }), vFind({ small: true, mc: true })],
      2: [vFind({}), vFind({ mc: true }), vFind({ frac: true }), vFind({ frac: true, mc: true })],
      3: [vMiss({}), vHalf, vMiss({ frac: true }), vFind({ frac: true, mc: true })],
      4: [vPack, vCompare, vTank, vMiss({ frac: true })],
    },
    volCheck,
  );
  reg(
    "volumePrismWhole",
    "Volume of rectangular prisms (whole-number edges)",
    "Volumen de prismas rectangulares (aristas enteras)",
    {
      1: [vCubes, vFind({ small: true }), vFind({ small: true, mc: true })],
      2: [vFind({}), vFind({ mc: true }), vFind({}), vFind({ mc: true })],
      3: [vMiss({}), vMiss({}), vFind({ mc: true }), vFind({})],
      4: [vPack, vCompare, vMiss({}), vFind({})],
    },
    volCheck,
  );
  reg(
    "volumePrismFrac",
    "Volume of rectangular prisms (fractional edges)",
    "Volumen de prismas rectangulares (aristas fraccionarias)",
    {
      1: [
        vFind({ small: true, frac: true }),
        vFind({ small: true, frac: true, mc: true }),
        vFind({ small: true, frac: true }),
      ],
      2: [
        vFind({ frac: true }),
        vFind({ frac: true, mc: true }),
        vFind({ frac: true }),
        vFind({ frac: true, mc: true }),
      ],
      3: [vMiss({ frac: true }), vHalf, vMiss({ frac: true }), vFind({ frac: true, mc: true })],
      4: [vHalf, vMiss({ frac: true }), vFind({ frac: true, mc: true }), vMiss({ frac: true })],
    },
    volCheck,
  );

  /* ====================================================================================== */
  /* 6. surfaceAreaPrism  (5-7)                                                              */
  /* ====================================================================================== */
  Object.assign(MIS, {
    "forgot-face": [
      "That misses a pair of faces. A box has six faces in three matching pairs, and every pair is counted twice.",
      "Eso se salta un par de caras. Una caja tiene seis caras en tres pares iguales, y cada par se cuenta dos veces.",
    ],
    "miscounted-faces": [
      "A box has 6 faces. Opposite faces match, so they come in pairs.",
      "Una caja tiene 6 caras. Las caras opuestas son iguales, así que vienen en pares.",
    ],
    "volume-for-surface": [
      "That multiplies the edges, which gives the volume (the space inside). Surface area is the area of the outside faces.",
      "Eso multiplica las aristas, lo que da el volumen (el espacio de adentro). El área de superficie es el área de las caras de afuera.",
    ],
    "counted-lid": [
      "This container has no lid, so the top face is not part of the surface. Leave it out.",
      "Este recipiente no tiene tapa, así que la cara de arriba no es parte de la superficie. No la cuentes.",
    ],
    "hidden-faces-counted": [
      "Faces that are glued together are hidden inside and are not part of the outside. Do not count them.",
      "Las caras que se pegan quedan ocultas por dentro y no son parte de la superficie exterior. No las cuentes.",
    ],
    "forgot-bases": [
      "That is only the rectangles around the sides. A triangular prism also has two triangular ends.",
      "Eso es solo los rectángulos de los lados. Un prisma triangular también tiene dos triángulos en los extremos.",
    ],
    "one-cube-only": [
      "That is the surface of one cube only. After gluing, the shape is one prism, and the touching faces disappear.",
      "Eso es la superficie de un solo cubo. Después de pegarlos, la figura es un prisma y las caras que se tocan desaparecen.",
    ],
  });
  RC.sa = [
    "Surface area is the total area of all the faces. A box has 3 pairs of matching faces: count each pair twice.",
    "El área de superficie es el área total de todas las caras. Una caja tiene 3 pares de caras iguales: cuenta cada par dos veces.",
  ];
  const CS = [
    { n: "gift box", e: "caja de regalo", g: "f", u: ["in", "cm"], pay: 1 },
    { n: "toy chest", e: "baúl de juguetes", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "shipping crate", e: "caja de embalaje", g: "f", u: ["ft", "m"], pay: 1 },
    { n: "cereal box", e: "caja de cereal", g: "f", u: ["in", "cm"] },
    { n: "jewelry box", e: "joyero", g: "m", u: ["in", "cm"] },
    { n: "storage bin", e: "contenedor", g: "m", u: ["in", "ft"] },
  ];
  const CO = [
    { n: "aquarium", e: "acuario", g: "m", u: ["in", "cm"] },
    { n: "planter box", e: "jardinera", g: "f", u: ["ft", "in"] },
    { n: "sandbox", e: "arenero", g: "m", u: ["ft", "m"] },
    { n: "fish tank", e: "pecera", g: "f", u: ["in", "cm"] },
  ];
  const CW = [
    { n: "camping tent", e: "carpa de campamento", g: "f", u: ["ft", "m"], pay: 1 },
    { n: "wedge-shaped doorstop", e: "tope de puerta en forma de cuña", g: "m", u: ["in", "cm"] },
    { n: "chocolate box", e: "caja de chocolates triangular", g: "f", u: ["in", "cm"] },
    { n: "cheese display", e: "exhibidor de queso", g: "m", u: ["in", "cm"] },
  ];
  const saRect = (g) => 2 * (g.l * g.w + g.l * g.h + g.w * g.h);
  function sGeom(rng) {
    for (;;) {
      const g = { l: rng.int(5, 12), w: rng.int(3, 8), h: rng.int(3, 7) };
      const sa = saRect(g);
      if (
        new Set([g.l, g.w, g.h]).size === 3 &&
        ![g.l * g.w, g.l * g.h, g.w * g.h, sa, g.l * g.w * g.h].some((x) =>
          [g.l, g.w, g.h].includes(x),
        )
      )
        return g;
    }
  }
  const sDesc = (c, g, u, tail = "") => {
    const [Ae, As] = An(c);
    return [
      `${Ae} is a rectangular prism ${g.l} ${u.l} long, ${g.w} ${u.l} wide, and ${g.h} ${u.l} tall.${tail}`,
      `${As} es un prisma rectangular de ${g.l} ${u.l} de largo, ${g.w} ${u.l} de ancho y ${g.h} ${u.l} de alto.${tail}`,
    ];
  };
  const sX = (g, u, sa) => [
    `Three pairs of faces: top and bottom ${g.l} × ${g.w} = ${g.l * g.w}, front and back ${g.l} × ${g.h} = ${g.l * g.h}, sides ${g.w} × ${g.h} = ${g.w * g.h}. Surface area = 2 × (${g.l * g.w} + ${g.l * g.h} + ${g.w * g.h}) = ${sa} ${u.a}. Surface area is in square units.`,
    `Tres pares de caras: arriba y abajo ${g.l} × ${g.w} = ${g.l * g.w}, frente y atrás ${g.l} × ${g.h} = ${g.l * g.h}, lados ${g.w} × ${g.h} = ${g.w * g.h}. Área de superficie = 2 × (${g.l * g.w} + ${g.l * g.h} + ${g.w * g.h}) = ${sa} ${u.a}. El área de superficie se mide en unidades cuadradas.`,
  ];
  const sHints = (g, _u) => [
    RC.sa,
    [
      `The three different faces have areas ${g.l} × ${g.w}, ${g.l} × ${g.h} and ${g.w} × ${g.h}.`,
      `Las tres caras distintas tienen áreas ${g.l} × ${g.w}, ${g.l} × ${g.h} y ${g.w} × ${g.h}.`,
    ],
    [
      "Add those three areas, then double the sum, because each face has a matching partner.",
      "Suma esas tres áreas y duplica la suma, porque cada cara tiene una pareja igual.",
    ],
  ];

  /** Matching faces / one face.  (level 1) */
  const sPair = (rng) => {
    const c = rng.pick(CS);
    const u = unitOf(rng, c);
    const g = sGeom(rng);
    const [d0, d1] = sDesc(c, g, u);
    if (rng.chance(0.5))
      return mcI(rng, {
        q: [
          `${d0} How many of its faces are the same size as the front face (${g.l} ${u.l} by ${g.h} ${u.l})?`,
          `${d1} ¿Cuántas de sus caras tienen el mismo tamaño que la cara del frente (${g.l} ${u.l} por ${g.h} ${u.l})?`,
        ],
        right: "2",
        wrong: [
          { v: "1", tag: "forgot-face" },
          { v: "3", tag: "miscounted-faces" },
          { v: "4", tag: "miscounted-faces" },
          { v: "6", tag: "miscounted-faces" },
        ],
        x: [
          `Opposite faces of a box match. The front face and the back face are both ${g.l} by ${g.h}, so 2 faces have that size (the front itself counts).`,
          `Las caras opuestas de una caja son iguales. La cara del frente y la de atrás miden ${g.l} por ${g.h}, así que 2 caras tienen ese tamaño (la del frente también cuenta).`,
        ],
        h: [
          [
            "Opposite faces of a box are the same size.",
            "Las caras opuestas de una caja son del mismo tamaño.",
          ],
          [
            "Which face is opposite the front face?",
            "¿Qué cara está opuesta a la cara del frente?",
          ],
        ],
        p: { what: "surface" },
        viz: pBox(g, u),
        meta: { kind: "pair" },
      });
    return numI({
      q: [
        `${d0} What is the area of its top face?`,
        `${d1} ¿Cuál es el área de su cara de arriba?`,
      ],
      a: g.l * g.w,
      unit: u.a,
      fw: [
        { v: g.l * g.h, tag: "wrong-piece" },
        { v: g.w * g.h, tag: "wrong-piece" },
        { v: g.l * g.w * g.h, tag: "volume-for-surface" },
        { v: g.l + g.w, tag: "added-instead" },
      ],
      x: [
        `The top face is a rectangle ${g.l} by ${g.w}: ${g.l} × ${g.w} = ${g.l * g.w} ${u.a}. The bottom face matches it.`,
        `La cara de arriba es un rectángulo de ${g.l} por ${g.w}: ${g.l} × ${g.w} = ${g.l * g.w} ${u.a}. La cara de abajo es igual.`,
      ],
      h: [
        [
          "The top face is a rectangle. Its sides are the length and the width.",
          "La cara de arriba es un rectángulo. Sus lados son el largo y el ancho.",
        ],
        [`Multiply ${g.l} × ${g.w}.`, `Multiplica ${g.l} × ${g.w}.`],
      ],
      p: { what: "surface" },
      viz: pBox(g, u),
      meta: { kind: "top", ...g },
    });
  };

  /** Surface area of a rectangular prism (from a net when o.net).  (level 2) */
  const sRect = (o) => (rng) => {
    const c = rng.pick(CS);
    const u = unitOf(rng, c);
    const g = sGeom(rng);
    const sa = saRect(g);
    const [d0, d1] = sDesc(c, g, u, o.net ? " The net shows its six faces." : "");
    const cand = [
      { k: "forgot-face", v: g.l * g.w + g.l * g.h + g.w * g.h },
      { k: "volume-for-surface", v: g.l * g.w * g.h },
      { k: "forgot-face", v: 2 * (g.l * g.w + g.l * g.h) },
      { k: "added-instead", v: g.l + g.w + g.h },
    ];
    const base = {
      q: [
        `${d0} ${o.mc ? "Which choice is its surface area?" : "What is its surface area?"}`,
        `${d1} ${o.mc ? "¿Qué opción es su área de superficie?" : "¿Cuál es su área de superficie?"}`,
      ],
      x: sX(g, u, sa),
      h: sHints(g, u),
      viz: pBox(g, u, o.net ? { net: true } : {}),
      p: { what: "surface" },
    };
    if (o.mc)
      return mcI(rng, {
        ...base,
        right: `${sa} ${u.a}`,
        wrong: [
          ...cand.map((w) => ({ v: `${w.v} ${u.a}`, tag: w.k })),
          { v: `${sa} ${u.v}`, tag: "unit-mismatch" },
        ],
        meta: { kind: "rectMC", ...g, ua: u.a },
      });
    return numI({
      ...base,
      a: sa,
      unit: u.a,
      fw: cand.map((w) => ({ v: w.v, tag: w.k })),
      meta: { kind: "rect", ...g },
    });
  };

  const TW = TRIP.filter((t) => t[0] <= 12);
  /** Triangular prism with isosceles ends (base 2p, height q, equal sides c) and length L. */
  function tGeom(rng) {
    const [a, b, c] = rng.pick(TW);
    const [p, q] = rng.chance(0.5) ? [a, b] : [b, a];
    return { p, q, c, L: intNot(rng, 4, 14, [p, q, c, 2 * p]) };
  }
  const triPrismSA = (g) => 2 * g.p * g.q + (2 * g.p + 2 * g.c) * g.L;
  /** Surface area of a triangular prism, or its cost.  (levels 2 and 4) */
  const sTri = (o) => (rng) => {
    const c = rng.pick(o.cost ? CW.filter((k) => k.pay) : CW);
    const u = unitOf(rng, c, o.cost ? ["ft", "m"] : undefined);
    const g = tGeom(rng);
    const sa = triPrismSA(g);
    const rate = rng.pick([2, 3, 4, 5]);
    const [Ae, As] = An(c);
    const tail = o.cost
      ? [
          ` Covering it costs $${rate} for each ${u.sq}. How much does it cost, in dollars?`,
          ` Cubrirlo cuesta $${rate} por cada ${u.sqEs}. ¿Cuánto cuesta, en dólares?`,
        ]
      : [" What is its surface area?", " ¿Cuál es su área de superficie?"];
    const k = o.cost ? rate : 1;
    return numI({
      q: [
        `${Ae} is a triangular prism ${g.L} ${u.l} long. Each triangular end has a base of ${2 * g.p} ${u.l}, a height of ${g.q} ${u.l}, and two equal sides of ${g.c} ${u.l}.${tail[0]}`,
        `${As} es un prisma triangular de ${g.L} ${u.l} de largo. Cada extremo triangular tiene una base de ${2 * g.p} ${u.l}, una altura de ${g.q} ${u.l} y dos lados iguales de ${g.c} ${u.l}.${tail[1]}`,
      ],
      a: sa * k,
      unit: o.cost ? undefined : u.a,
      fw: [
        { v: (2 * g.p + 2 * g.c) * g.L * k, tag: "forgot-bases" },
        { v: (g.p * g.q + (2 * g.p + 2 * g.c) * g.L) * k, tag: "forgot-face" },
        { v: (2 * g.p + g.c) * g.L * k + 2 * g.p * g.q * k, tag: "forgot-face" },
        { v: g.p * g.q * g.L * k, tag: "volume-for-surface" },
        ...(o.cost ? [{ v: sa, tag: "forgot-rate" }] : []),
      ],
      x: [
        `Two triangle ends: 2 × (½ × ${2 * g.p} × ${g.q}) = ${2 * g.p * g.q} ${u.a}. Three rectangles: ${2 * g.p} × ${g.L} + ${g.c} × ${g.L} + ${g.c} × ${g.L} = ${(2 * g.p + 2 * g.c) * g.L} ${u.a}. Surface area = ${sa} ${u.a}.${o.cost ? ` Cost: ${sa} × $${rate} = $${sa * rate}.` : ""}`,
        `Dos extremos triangulares: 2 × (½ × ${2 * g.p} × ${g.q}) = ${2 * g.p * g.q} ${u.a}. Tres rectángulos: ${2 * g.p} × ${g.L} + ${g.c} × ${g.L} + ${g.c} × ${g.L} = ${(2 * g.p + 2 * g.c) * g.L} ${u.a}. Área de superficie = ${sa} ${u.a}.${o.cost ? ` Costo: ${sa} × $${rate} = $${sa * rate}.` : ""}`,
      ],
      h: [
        [
          "A triangular prism has 5 faces: 2 triangles and 3 rectangles.",
          "Un prisma triangular tiene 5 caras: 2 triángulos y 3 rectángulos.",
        ],
        [
          `Each rectangle is as long as the prism (${g.L} ${u.l}) and as wide as one side of the triangle.`,
          `Cada rectángulo mide lo mismo que el prisma (${g.L} ${u.l}) de largo y un lado del triángulo de ancho.`,
        ],
        [
          "Add the two triangle areas to the three rectangle areas.",
          "Suma las áreas de los dos triángulos y las de los tres rectángulos.",
        ],
      ],
      p: { what: "surface" },
      viz: clean({
        t: "prism",
        tri: { b: 2 * g.p, h: g.q, s: g.c },
        len: g.L,
        unit: u.l,
        labels: true,
      }),
      meta: { kind: "tri", ...g, k },
    });
  };

  /** Open container, cost of paint, a cube from its surface area, or a missing height.  (levels 3-4) */
  const sMore = (kind) => (rng) => {
    const g = sGeom(rng);
    const sa = saRect(g);
    const c = rng.pick(kind === "open" ? CO : CS.filter((k) => k.pay || kind !== "cost"));
    const u = unitOf(rng, c, kind === "cost" ? ["ft", "m"] : undefined);
    const [Te, Ts] = The(c);
    const [d0, d1] = sDesc(c, g, u);
    const xs = sX(g, u, sa);
    if (kind === "open") {
      const oa = sa - g.l * g.w;
      return numI({
        q: [
          `${d0} It has no lid. What is the area of the glass or wood needed to make it?`,
          `${d1} No tiene tapa. ¿Cuál es el área del vidrio o la madera necesarios para hacerlo?`,
        ],
        a: oa,
        unit: u.a,
        fw: [
          { v: sa, tag: "counted-lid" },
          { v: 2 * g.l * g.h + 2 * g.w * g.h, tag: "forgot-face" },
          { v: g.l * g.w + g.l * g.h + g.w * g.h, tag: "forgot-face" },
        ],
        x: [
          `Without the lid there are 5 faces: bottom ${g.l} × ${g.w} = ${g.l * g.w}, two long sides ${g.l} × ${g.h} each, two short sides ${g.w} × ${g.h} each. ${g.l * g.w} + ${2 * g.l * g.h} + ${2 * g.w * g.h} = ${oa} ${u.a}.`,
          `Sin tapa hay 5 caras: fondo ${g.l} × ${g.w} = ${g.l * g.w}, dos lados largos de ${g.l} × ${g.h} y dos lados cortos de ${g.w} × ${g.h}. ${g.l * g.w} + ${2 * g.l * g.h} + ${2 * g.w * g.h} = ${oa} ${u.a}.`,
        ],
        h: [
          [
            "Count the faces that are really there. Is the top one of them?",
            "Cuenta las caras que sí hay. ¿Está la de arriba?",
          ],
          [
            `Bottom: ${g.l} × ${g.w}. Four sides: two of ${g.l} × ${g.h} and two of ${g.w} × ${g.h}.`,
            `Fondo: ${g.l} × ${g.w}. Cuatro lados: dos de ${g.l} × ${g.h} y dos de ${g.w} × ${g.h}.`,
          ],
        ],
        p: { what: "surface" },
        viz: pBox(g, u),
        meta: { kind: "open", ...g },
      });
    }
    if (kind === "cost") {
      const rate = rng.pick([2, 3, 4, 5]);
      return numI({
        q: [
          `${d0} All six faces will be painted. Paint costs $${rate} for each ${u.sq}. How much does it cost, in dollars?`,
          `${d1} Se pintarán las seis caras. La pintura cuesta $${rate} por cada ${u.sqEs}. ¿Cuánto cuesta, en dólares?`,
        ],
        a: sa * rate,
        fw: [
          { v: sa, tag: "forgot-rate" },
          { v: (g.l * g.w + g.l * g.h + g.w * g.h) * rate, tag: "forgot-face" },
          { v: g.l * g.w * g.h * rate, tag: "volume-for-surface" },
        ],
        x: [
          `${xs[0]} Cost: ${sa} × $${rate} = $${sa * rate}.`,
          `${xs[1]} Costo: ${sa} × $${rate} = $${sa * rate}.`,
        ],
        h: [
          [
            "Two steps: surface area first, then the price.",
            "Dos pasos: primero el área de superficie y luego el precio.",
          ],
          sHints(g, u)[1],
          [
            `Find 2 × (the three face areas), then multiply by ${rate}.`,
            `Halla 2 × (las tres áreas de las caras) y multiplica por ${rate}.`,
          ],
        ],
        p: { what: "surface" },
        viz: pBox(g, u),
        meta: { kind: "cost", ...g, rate },
      });
    }
    // missing height from the surface area
    return numI({
      q: [
        `${Te} is a rectangular prism ${g.l} ${u.l} long and ${g.w} ${u.l} wide. Its surface area is ${sa} ${u.a}. How tall is it?`,
        `${Ts} es un prisma rectangular de ${g.l} ${u.l} de largo y ${g.w} ${u.l} de ancho. Su área de superficie es ${sa} ${u.a}. ¿Qué altura tiene?`,
      ],
      a: g.h,
      unit: u.l,
      fw: [
        { v: (sa - 2 * g.l * g.w) / (g.l + g.w), tag: "forgot-half" },
        { v: (sa - g.l * g.w) / (2 * (g.l + g.w)), tag: "forgot-face" },
        { v: sa / (2 * (g.l + g.w)), tag: "forgot-face" },
        { v: sa / (g.l * g.w), tag: "multiplied-instead" },
      ],
      x: [
        `Top and bottom: 2 × ${g.l} × ${g.w} = ${2 * g.l * g.w}. The four sides must be ${sa} − ${2 * g.l * g.w} = ${sa - 2 * g.l * g.w}. Their total width around is 2 × (${g.l} + ${g.w}) = ${2 * (g.l + g.w)}, so the height = ${sa - 2 * g.l * g.w} ÷ ${2 * (g.l + g.w)} = ${g.h} ${u.l}.`,
        `Arriba y abajo: 2 × ${g.l} × ${g.w} = ${2 * g.l * g.w}. Los cuatro lados deben sumar ${sa} − ${2 * g.l * g.w} = ${sa - 2 * g.l * g.w}. Su ancho total alrededor es 2 × (${g.l} + ${g.w}) = ${2 * (g.l + g.w)}, así que la altura = ${sa - 2 * g.l * g.w} ÷ ${2 * (g.l + g.w)} = ${g.h} ${u.l}.`,
      ],
      h: [
        [
          "Take the top and bottom faces away first.",
          "Quita primero las caras de arriba y de abajo.",
        ],
        [
          `Top and bottom together: 2 × ${g.l} × ${g.w}. What is left is the four sides.`,
          `Arriba y abajo juntas: 2 × ${g.l} × ${g.w}. Lo que queda son los cuatro lados.`,
        ],
        [
          `The four sides wrap around a distance of 2 × (${g.l} + ${g.w}). Divide what is left by that.`,
          `Los cuatro lados rodean una distancia de 2 × (${g.l} + ${g.w}). Divide lo que queda entre eso.`,
        ],
      ],
      p: { what: "surface" },
      viz: prismViz(g.l, g.w, Q, u.l),
      meta: { kind: "missH", SA: sa, l: g.l, w: g.w },
    });
  };

  /** Two cubes glued face to face.  (level 4) */
  const sGlued = (rng) => {
    const c = rng.pick(CS);
    const u = unitOf(rng, c);
    const a1 = rng.int(2, 9);
    const [_Ae, _As] = An(c);
    return numI({
      q: [
        `Two cubes, each with edges of ${a1} ${u.l}, are glued face to face to make one ${c.n} that is ${2 * a1} ${u.l} long, ${a1} ${u.l} wide, and ${a1} ${u.l} tall. What is the surface area of the new shape?`,
        `Dos cubos, cada uno con aristas de ${a1} ${u.l}, se pegan cara con cara para formar ${c.g === "f" ? "una" : "un"} ${c.e} de ${2 * a1} ${u.l} de largo, ${a1} ${u.l} de ancho y ${a1} ${u.l} de alto. ¿Cuál es el área de superficie de la nueva figura?`,
      ],
      a: 10 * a1 * a1,
      unit: u.a,
      fw: [
        { v: 12 * a1 * a1, tag: "hidden-faces-counted" },
        { v: 6 * a1 * a1, tag: "one-cube-only" },
        { v: 8 * a1 * a1, tag: "forgot-face" },
      ],
      x: [
        `Each cube has 6 faces, but the 2 glued faces are hidden. That leaves 10 faces of ${a1} × ${a1} = ${a1 * a1} ${u.a}: 10 × ${a1 * a1} = ${10 * a1 * a1} ${u.a}.`,
        `Cada cubo tiene 6 caras, pero las 2 caras pegadas quedan ocultas. Quedan 10 caras de ${a1} × ${a1} = ${a1 * a1} ${u.a}: 10 × ${a1 * a1} = ${10 * a1 * a1} ${u.a}.`,
      ],
      h: [
        [
          "Count the faces that are still on the outside.",
          "Cuenta las caras que siguen por fuera.",
        ],
        [
          "Two cubes have 12 faces in all, but gluing hides some of them.",
          "Dos cubos tienen 12 caras en total, pero al pegarlos algunas quedan ocultas.",
        ],
        [`Each visible face is ${a1} × ${a1}.`, `Cada cara visible es ${a1} × ${a1}.`],
      ],
      p: { what: "surface" },
      viz: prismViz(2 * a1, a1, a1, u.l),
      meta: { kind: "glued", a: a1 },
    });
  };

  reg(
    "surfaceAreaPrism",
    "Surface area of prisms",
    "Área de superficie de prismas",
    {
      1: [sPair, sPair, sRect({ mc: true })],
      2: [sRect({}), sRect({ net: true }), sRect({ mc: true, net: true }), sTri({})],
      3: [sMore("miss"), sMore("cost"), sMore("open"), sRect({ mc: true })],
      4: [sGlued, sTri({ cost: true }), sMore("open"), sMore("cost")],
    },
    (item) => {
      const m = item.meta;
      switch (m.kind) {
        case "pair":
          return item.c[item.a] === "2" || "pair count";
        case "top":
          return wantNum(
            item,
            exposedFaces(m.l, m.w, m.h) > 0
              ? shoelace([
                  [0, 0],
                  [m.l, 0],
                  [m.l, m.w],
                  [0, m.w],
                ])
              : 0,
            "face",
          );
        case "rect":
          return wantNum(item, exposedFaces(m.l, m.w, m.h), "surface area");
        case "rectMC":
          return wantChoice(item, exposedFaces(m.l, m.w, m.h), m.ua, "surface area");
        case "open":
          return wantNum(item, exposedFaces(m.l, m.w, m.h) - m.l * m.w, "open box");
        case "cost":
          return wantNum(item, exposedFaces(m.l, m.w, m.h) * m.rate, "cost");
        case "missH":
          return (
            near(exposedFaces(m.l, m.w, G.value(item.a)), m.SA) ||
            `height ${item.a} does not give ${m.SA}`
          );
        case "glued":
          return wantNum(item, exposedFaces(2 * m.a, m.a, m.a), "glued cubes");
        case "tri": {
          const ends =
            2 *
            shoelace([
              [0, 0],
              [2 * m.p, 0],
              [m.p, m.q],
            ]);
          return wantNum(
            item,
            (ends + 2 * m.p * m.L + m.c * m.L + m.c * m.L) * m.k,
            "triangular prism",
          );
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  );

  /* ====================================================================================== */
  /* 7. surfaceAreaPyramid  (5-8)                                                            */
  /* ====================================================================================== */
  Object.assign(MIS, {
    "forgot-base": [
      "That finds only the triangular sides. A pyramid also has a base, and it belongs in the surface area.",
      "Eso halla solo los lados triangulares. Una pirámide también tiene una base, y cuenta en el área de superficie.",
    ],
    "one-triangle-only": [
      "That counts only one triangular face. A pyramid has a triangle on every side of its base.",
      "Eso cuenta una sola cara triangular. Una pirámide tiene un triángulo en cada lado de su base.",
    ],
    "counted-base": [
      "The base is a square, not a triangle. Count only the triangular faces.",
      "La base es un cuadrado, no un triángulo. Cuenta solo las caras triangulares.",
    ],
  });
  const CY = [
    { n: "glass pyramid", e: "pirámide de vidrio", g: "f", u: ["m", "ft"], pay: 1 },
    { n: "paper lantern", e: "farol de papel", g: "m", u: ["in", "cm"] },
    { n: "model pyramid", e: "pirámide de modelo", g: "f", u: ["in", "cm"] },
    { n: "tower roof", e: "techo de la torre", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "gift box", e: "caja de regalo", g: "f", u: ["in", "cm"] },
    { n: "souvenir", e: "souvenir", g: "m", u: ["in", "cm"] },
  ];
  /** The pyramid itself, with its slant height dashed (never the vertical height); `cube` sits it on a cube. */
  const faceViz = (s, l, u, extra = {}) =>
    clean({ t: "pyramid", n: 4, base: s, slant: l, unit: u.l, labels: true, ...extra });
  function yGeom(rng) {
    for (;;) {
      const s = rng.pick([6, 8, 10, 12]);
      const l = rng.int(Math.floor(s / 2) + 2, 15);
      const sa = s * s + 2 * s * l;
      if (new Set([s, l, (s * l) / 2, s * s, sa, 2 * s * l]).size === 6) return { s, l };
    }
  }
  const yDesc = (c, g, u, _what = "pyramid") => {
    const [Ae, As] = An(c);
    return [
      `${Ae} is shaped like a square pyramid. The base is a square with edges of ${g.s} ${u.l}. Each triangular face has a base of ${g.s} ${u.l} and a slant height of ${g.l} ${u.l}.`,
      `${As} tiene forma de pirámide cuadrada. La base es un cuadrado con aristas de ${g.s} ${u.l}. Cada cara triangular tiene una base de ${g.s} ${u.l} y una altura inclinada de ${g.l} ${u.l}.`,
    ];
  };
  const ySA = (g) => g.s * g.s + 4 * ((g.s * g.l) / 2);
  const yX = (g, u) => [
    `Base: ${g.s} × ${g.s} = ${g.s * g.s} ${u.a}. One triangle: ½ × ${g.s} × ${g.l} = ${(g.s * g.l) / 2} ${u.a}; four triangles: ${2 * g.s * g.l} ${u.a}. Surface area = ${g.s * g.s} + ${2 * g.s * g.l} = ${ySA(g)} ${u.a}.`,
    `Base: ${g.s} × ${g.s} = ${g.s * g.s} ${u.a}. Un triángulo: ½ × ${g.s} × ${g.l} = ${(g.s * g.l) / 2} ${u.a}; cuatro triángulos: ${2 * g.s * g.l} ${u.a}. Área de superficie = ${g.s * g.s} + ${2 * g.s * g.l} = ${ySA(g)} ${u.a}.`,
  ];
  const yH = (g, _u) => [
    [
      "A pyramid has one base and triangular faces. Surface area = base area + the area of every triangle.",
      "Una pirámide tiene una base y caras triangulares. Área de superficie = área de la base + el área de cada triángulo.",
    ],
    [
      `A square pyramid has 4 triangles. Each is ½ × ${g.s} × ${g.l}, using the slant height, not the pyramid's height.`,
      `Una pirámide cuadrada tiene 4 triángulos. Cada uno es ½ × ${g.s} × ${g.l}, con la altura inclinada, no la altura de la pirámide.`,
    ],
    [
      `Add the base, ${g.s} × ${g.s}, to the area of the 4 triangles.`,
      `Suma la base, ${g.s} × ${g.s}, al área de los 4 triángulos.`,
    ],
  ];

  /** One lateral face, or how many faces.  (level 1) */
  const yFace = (rng) => {
    const c = rng.pick(CY);
    const u = unitOf(rng, c);
    const g = yGeom(rng);
    const [d0, d1] = yDesc(c, g, u);
    if (rng.chance(0.4))
      return mcI(rng, {
        q: [
          `${d0} How many triangular faces does it have?`,
          `${d1} ¿Cuántas caras triangulares tiene?`,
        ],
        right: "4",
        wrong: [
          { v: "5", tag: "counted-base" },
          { v: "3", tag: "miscounted-faces" },
          { v: "1", tag: "one-triangle-only" },
          { v: "8", tag: "miscounted-faces" },
        ],
        x: [
          `There is one triangle on each of the 4 sides of the square base. The square base is not a triangle, so there are 4 triangular faces.`,
          `Hay un triángulo en cada uno de los 4 lados de la base cuadrada. La base cuadrada no es un triángulo, así que hay 4 caras triangulares.`,
        ],
        h: [
          ["Look at the base. How many sides does it have?", "Mira la base. ¿Cuántos lados tiene?"],
          [
            "Each side of the base has one triangle standing on it.",
            "Cada lado de la base tiene un triángulo encima.",
          ],
        ],
        p: { what: "surface" },
        viz: faceViz(g.s, g.l, u),
        meta: { kind: "count" },
      });
    return numI({
      q: [
        `${d0} What is the area of one triangular face?`,
        `${d1} ¿Cuál es el área de una cara triangular?`,
      ],
      a: (g.s * g.l) / 2,
      unit: u.a,
      fw: [
        { v: g.s * g.l, tag: "forgot-half" },
        { v: g.s + g.l, tag: "added-instead" },
        { v: ySA(g), tag: "wrong-piece" },
      ],
      x: [
        `A triangle: ½ × base × slant height = ½ × ${g.s} × ${g.l} = ${(g.s * g.l) / 2} ${u.a}.`,
        `Un triángulo: ½ × base × altura inclinada = ½ × ${g.s} × ${g.l} = ${(g.s * g.l) / 2} ${u.a}.`,
      ],
      h: [
        [
          "The slant height is the height of the triangular face.",
          "La altura inclinada es la altura de la cara triangular.",
        ],
        [
          `Use ½ × base × height with the base ${g.s} ${u.l} and the slant height ${g.l} ${u.l}.`,
          `Usa ½ × base × altura con la base ${g.s} ${u.l} y la altura inclinada ${g.l} ${u.l}.`,
        ],
      ],
      p: { what: "surface", shape: "tri" },
      viz: faceViz(g.s, g.l, u),
      meta: { kind: "face", ...g },
    });
  };

  /** Surface area of a square pyramid.  (level 2) */
  const ySquare = (o) => (rng) => {
    const c = rng.pick(CY);
    const u = unitOf(rng, c);
    const g = yGeom(rng);
    const sa = ySA(g);
    const [d0, d1] = yDesc(c, g, u);
    const cand = [
      { k: "forgot-base", v: 2 * g.s * g.l },
      { k: "forgot-half", v: g.s * g.s + 4 * g.s * g.l },
      { k: "one-triangle-only", v: g.s * g.s + (g.s * g.l) / 2 },
      { k: "added-instead", v: g.s + g.l },
    ];
    const base = {
      q: [
        `${d0} ${o.mc ? "Which choice is its surface area?" : "What is its surface area?"}`,
        `${d1} ${o.mc ? "¿Qué opción es su área de superficie?" : "¿Cuál es su área de superficie?"}`,
      ],
      x: yX(g, u),
      h: yH(g, u),
      viz: faceViz(g.s, g.l, u),
      p: { what: "surface", shape: "tri" },
    };
    if (o.mc)
      return mcI(rng, {
        ...base,
        right: `${sa} ${u.a}`,
        wrong: [
          ...cand.map((w) => ({ v: `${w.v} ${u.a}`, tag: w.k })),
          { v: `${sa} ${u.v}`, tag: "unit-mismatch" },
        ],
        meta: { kind: "sqMC", ...g, ua: u.a },
      });
    return numI({
      ...base,
      a: sa,
      unit: u.a,
      fw: cand.map((w) => ({ v: w.v, tag: w.k })),
      meta: { kind: "sq", ...g },
    });
  };

  /** Triangular pyramid on a 3-4-5 right-triangle base, all three faces with the same slant height.  (level 3) */
  const yTri = (rng) => {
    const c = rng.pick(CY);
    const u = unitOf(rng, c);
    const k = rng.int(1, 3);
    const l = intNot(rng, k + 3, 12, [3 * k, 4 * k, 5 * k, 6 * k * k]);
    const base = 6 * k * k;
    const sa = base + 6 * k * l;
    const [Ae, As] = An(c);
    return numI({
      q: [
        `${Ae} is shaped like a triangular pyramid. Its base is a right triangle with sides of ${3 * k} ${u.l}, ${4 * k} ${u.l}, and ${5 * k} ${u.l}. Each of the three triangular faces has a slant height of ${l} ${u.l}. What is its surface area?`,
        `${As} tiene forma de pirámide triangular. Su base es un triángulo rectángulo con lados de ${3 * k} ${u.l}, ${4 * k} ${u.l} y ${5 * k} ${u.l}. Cada una de las tres caras triangulares tiene una altura inclinada de ${l} ${u.l}. ¿Cuál es su área de superficie?`,
      ],
      a: sa,
      unit: u.a,
      fw: [
        { v: 6 * k * l, tag: "forgot-base" },
        { v: base + 12 * k * l, tag: "forgot-half" },
        { v: base + (3 * k * l) / 2, tag: "one-triangle-only" },
        { v: 3 * k * 4 * k * l, tag: "wrong-piece" },
      ],
      x: [
        `Base: ½ × ${3 * k} × ${4 * k} = ${base} ${u.a}. Faces: ½ × ${3 * k} × ${l} = ${(3 * k * l) / 2}, ½ × ${4 * k} × ${l} = ${2 * k * l}, ½ × ${5 * k} × ${l} = ${(5 * k * l) / 2}, together ${6 * k * l} ${u.a}. Surface area = ${base} + ${12 * k * l - 6 * k * l} = ${sa} ${u.a}.`.replace(
          `${base} + ${6 * k * l}`,
          `${base} + ${6 * k * l}`,
        ),
        `Base: ½ × ${3 * k} × ${4 * k} = ${base} ${u.a}. Caras: ½ × ${3 * k} × ${l} = ${(3 * k * l) / 2}, ½ × ${4 * k} × ${l} = ${2 * k * l}, ½ × ${5 * k} × ${l} = ${(5 * k * l) / 2}, juntas ${6 * k * l} ${u.a}. Área de superficie = ${base} + ${6 * k * l} = ${sa} ${u.a}.`,
      ],
      h: [
        [
          "A triangular pyramid has a triangular base and three triangular faces.",
          "Una pirámide triangular tiene una base triangular y tres caras triangulares.",
        ],
        [
          `The base is a right triangle, so its legs are its base and height. The three side faces have bases ${3 * k}, ${4 * k} and ${5 * k}.`,
          `La base es un triángulo rectángulo, así que sus catetos son su base y su altura. Las tres caras laterales tienen bases ${3 * k}, ${4 * k} y ${5 * k}.`,
        ],
        [
          `Each side face is ½ × (its base) × ${l}. Add them to the base.`,
          `Cada cara lateral es ½ × (su base) × ${l}. Súmalas a la base.`,
        ],
      ],
      p: { what: "surface", shape: "tri" },
      viz: clean({
        t: "pyramid",
        n: 3,
        sides: [3 * k, 4 * k, 5 * k],
        slant: l,
        unit: u.l,
        labels: true,
        net: true,
      }),
      meta: { kind: "triPyr", k, l },
    });
  };

  /** The slant height from the surface area, a cube-and-pyramid solid, and a cost.  (levels 3-4) */
  const yMore = (kind) => (rng) => {
    const c = rng.pick(kind === "cost" ? CY.filter((k) => k.pay) : CY);
    const u = unitOf(rng, c, kind === "cost" ? ["ft", "m"] : undefined);
    const g = yGeom(rng);
    const sa = ySA(g);
    const [Ae, As] = An(c);
    if (kind === "miss")
      return numI({
        q: [
          `${Ae} is shaped like a square pyramid with a base edge of ${g.s} ${u.l}. Its surface area is ${sa} ${u.a}. What is the slant height of each triangular face?`,
          `${As} tiene forma de pirámide cuadrada con una arista de base de ${g.s} ${u.l}. Su área de superficie es ${sa} ${u.a}. ¿Cuál es la altura inclinada de cada cara triangular?`,
        ],
        a: g.l,
        unit: u.l,
        fw: [
          { v: (sa - g.s * g.s) / g.s, tag: "forgot-half" },
          { v: sa / (2 * g.s), tag: "forgot-base" },
          { v: (sa - g.s * g.s) / 4, tag: "wrong-piece" },
        ],
        x: [
          `Take away the base: ${sa} − ${g.s * g.s} = ${sa - g.s * g.s} ${u.a} for the 4 triangles. Each triangle is ${(sa - g.s * g.s) / 4} ${u.a} = ½ × ${g.s} × slant height, so slant height = ${sa - g.s * g.s} ÷ (2 × ${g.s}) = ${g.l} ${u.l}.`,
          `Quita la base: ${sa} − ${g.s * g.s} = ${sa - g.s * g.s} ${u.a} para los 4 triángulos. Cada triángulo es ${(sa - g.s * g.s) / 4} ${u.a} = ½ × ${g.s} × altura inclinada, así que altura inclinada = ${sa - g.s * g.s} ÷ (2 × ${g.s}) = ${g.l} ${u.l}.`,
        ],
        h: [
          [
            "Subtract the base area first. What is left is the four triangles.",
            "Resta primero el área de la base. Lo que queda son los cuatro triángulos.",
          ],
          [
            `The four triangles together are 4 × ½ × ${g.s} × (slant height) = 2 × ${g.s} × (slant height).`,
            `Los cuatro triángulos juntos son 4 × ½ × ${g.s} × (altura inclinada) = 2 × ${g.s} × (altura inclinada).`,
          ],
          [`Divide what is left by 2 × ${g.s}.`, `Divide lo que queda entre 2 × ${g.s}.`],
        ],
        p: { what: "surface", shape: "tri" },
        viz: faceViz(g.s, Q, u),
        meta: { kind: "missL", SA: sa, s: g.s },
      });
    if (kind === "cost") {
      const rate = rng.pick([2, 3, 4, 5]);
      const [d0, d1] = yDesc(c, g, u);
      return numI({
        q: [
          `${d0} Covering the whole surface, base included, costs $${rate} for each ${u.sq}. How much does it cost, in dollars?`,
          `${d1} Cubrir toda la superficie, con la base incluida, cuesta $${rate} por cada ${u.sqEs}. ¿Cuánto cuesta, en dólares?`,
        ],
        a: sa * rate,
        fw: [
          { v: sa, tag: "forgot-rate" },
          { v: 2 * g.s * g.l * rate, tag: "forgot-base" },
          { v: (g.s * g.s + 4 * g.s * g.l) * rate, tag: "forgot-half" },
        ],
        x: [
          `${yX(g, u)[0]} Cost: ${sa} × $${rate} = $${sa * rate}.`,
          `${yX(g, u)[1]} Costo: ${sa} × $${rate} = $${sa * rate}.`,
        ],
        h: [
          [
            "Two steps: surface area, then the price.",
            "Dos pasos: el área de superficie y luego el precio.",
          ],
          yH(g, u)[1],
          [
            `Find base + 4 triangles, then multiply by ${rate}.`,
            `Halla base + 4 triángulos y multiplica por ${rate}.`,
          ],
        ],
        p: { what: "surface", shape: "tri" },
        viz: faceViz(g.s, g.l, u),
        meta: { kind: "cost", ...g, rate },
      });
    }
    // cube topped with a pyramid
    const a1 = g.s;
    const comp = 5 * a1 * a1 + 2 * a1 * g.l;
    return numI({
      q: [
        `${Ae} is a cube with a square pyramid on top. The cube has edges of ${a1} ${u.l}. Each triangular face of the pyramid has a base of ${a1} ${u.l} and a slant height of ${g.l} ${u.l}. What is the surface area of the whole solid?`,
        `${As} es un cubo con una pirámide cuadrada encima. El cubo tiene aristas de ${a1} ${u.l}. Cada cara triangular de la pirámide tiene una base de ${a1} ${u.l} y una altura inclinada de ${g.l} ${u.l}. ¿Cuál es el área de superficie de todo el sólido?`,
      ],
      a: comp,
      unit: u.a,
      fw: [
        { v: 6 * a1 * a1 + 2 * a1 * g.l, tag: "hidden-faces-counted" },
        { v: 7 * a1 * a1 + 2 * a1 * g.l, tag: "hidden-faces-counted" },
        { v: 5 * a1 * a1, tag: "forgot-face" },
        { v: 6 * a1 * a1, tag: "forgot-face" },
      ],
      x: [
        `The cube shows 5 square faces (its top is covered by the pyramid): 5 × ${a1 * a1} = ${5 * a1 * a1} ${u.a}. The pyramid adds 4 triangles: 4 × ½ × ${a1} × ${g.l} = ${2 * a1 * g.l} ${u.a}. Total: ${comp} ${u.a}.`,
        `El cubo muestra 5 caras cuadradas (la de arriba está tapada por la pirámide): 5 × ${a1 * a1} = ${5 * a1 * a1} ${u.a}. La pirámide agrega 4 triángulos: 4 × ½ × ${a1} × ${g.l} = ${2 * a1 * g.l} ${u.a}. Total: ${comp} ${u.a}.`,
      ],
      h: [
        [
          "Where the pyramid sits on the cube, nothing is on the outside.",
          "Donde la pirámide se apoya en el cubo, no hay superficie exterior.",
        ],
        [
          "Count the cube's visible faces, then add the pyramid's triangles.",
          "Cuenta las caras visibles del cubo y suma los triángulos de la pirámide.",
        ],
        [
          `Each triangle is ½ × ${a1} × ${g.l}; there are 4.`,
          `Cada triángulo es ½ × ${a1} × ${g.l}; hay 4.`,
        ],
      ],
      p: { what: "surface", shape: "tri" },
      viz: faceViz(a1, g.l, u, { cube: true }),
      meta: { kind: "comp", a: a1, l: g.l },
    });
  };

  reg(
    "surfaceAreaPyramid",
    "Surface area of pyramids",
    "Área de superficie de pirámides",
    {
      1: [yFace, yFace, ySquare({ mc: true })],
      2: [ySquare({}), ySquare({ mc: true }), ySquare({})],
      3: [yMore("miss"), yTri, ySquare({ mc: true })],
      4: [yMore("comp"), yMore("cost"), yTri],
    },
    (item) => {
      const m = item.meta;
      const face = (s, l) =>
        shoelace([
          [0, 0],
          [s, 0],
          [s / 2, l],
        ]);
      const sq = (s, l) => s * s + 4 * face(s, l);
      switch (m.kind) {
        case "count":
          return item.c[item.a] === "4" || "face count";
        case "face":
          return wantNum(item, face(m.s, m.l), "triangle");
        case "sq":
          return wantNum(item, sq(m.s, m.l), "square pyramid");
        case "sqMC":
          return wantChoice(item, sq(m.s, m.l), m.ua, "square pyramid");
        case "triPyr":
          return wantNum(
            item,
            0.5 * 3 * m.k * 4 * m.k + 0.5 * (3 + 4 + 5) * m.k * m.l,
            "triangular pyramid",
          );
        case "missL":
          return (
            near(m.s * m.s + 0.5 * 4 * m.s * G.value(item.a), m.SA) ||
            `slant ${item.a} does not give ${m.SA}`
          );
        case "cost":
          return wantNum(item, sq(m.s, m.l) * m.rate, "cost");
        case "comp":
          return wantNum(item, 5 * m.a * m.a + 4 * face(m.a, m.l), "cube with pyramid");
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  );

  /* ====================================================================================== */
  /* 8. areaRegularPolygon  (5-9)                                                            */
  /* ====================================================================================== */
  Object.assign(MIS, {
    "one-polygon-only": [
      "That is the area of just one of the two polygons. Compare them by subtracting.",
      "Esa es el área de solo uno de los dos polígonos. Compáralos restando.",
    ],
    "wrong-count": [
      "The number of triangles equals the number of sides. Count the sides of the polygon.",
      "El número de triángulos es igual al número de lados. Cuenta los lados del polígono.",
    ],
    "added-count": [
      "That adds the number of triangles to one triangle's area. The triangles are all the same, so multiply.",
      "Eso suma el número de triángulos al área de un triángulo. Todos los triángulos son iguales, así que se multiplica.",
    ],
    "one-triangle": [
      "That is only one of the triangles. The polygon is made of several of them.",
      "Eso es solo uno de los triángulos. El polígono está hecho con varios.",
    ],
    "gave-triangle-area": [
      "That is the area of the whole polygon (or of a triangle), not the apothem. The apothem is a length.",
      "Esa es el área del polígono entero (o de un triángulo), no el apotema. El apotema es una longitud.",
    ],
  });
  const APO = { 5: 0.6882, 6: 0.866, 8: 1.2071 };
  const NAME = {
    5: ["pentagon", "pentágono"],
    6: ["hexagon", "hexágono"],
    8: ["octagon", "octágono"],
  };
  const CG = [
    { n: "patio", e: "patio", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "table top", e: "mesa", g: "f", u: ["ft", "in"] },
    { n: "garden bed", e: "jardín", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "gazebo floor", e: "piso del mirador", g: "m", u: ["ft", "m"], pay: 1 },
    { n: "floor tile", e: "loseta", g: "f", u: ["in", "cm"] },
    { n: "rug", e: "alfombra", g: "f", u: ["ft", "m"], pay: 1 },
    { n: "sign", e: "señal", g: "f", u: ["in", "cm"] },
  ];
  /** Regular polygon with n sides, even side s, and the apothem rounded to a tenth (so every area is exact in tenths). */
  function gGeom(rng) {
    const n = rng.pick([5, 6, 8, 6, 5]);
    const s = rng.pick([4, 6, 8, 10, 12, 14].filter((v) => v !== n));
    const a = Math.round(s * APO[n] * 10) / 10;
    return { n, s, a };
  }
  const gTri = (g) => ((g.s / 2) * Math.round(g.a * 10)) / 10;
  const gTotal = (g) => Math.round(g.n * (g.s / 2) * Math.round(g.a * 10)) / 10;
  const gDesc = (c, g, u) => {
    const [Ae, As] = An(c);
    const [pn, pe] = NAME[g.n];
    return [
      `${Ae} is shaped like a regular ${pn}. Each side is ${g.s} ${u.l}. The apothem, from the center to the middle of a side, is ${g.a} ${u.l} (rounded to the nearest tenth).`,
      `${As} tiene forma de ${pe} regular. Cada lado mide ${g.s} ${u.l}. El apotema, del centro al punto medio de un lado, mide ${g.a} ${u.l} (redondeado a la décima).`,
    ];
  };
  const gViz = (g, u, over = {}) => shape("hex", { side: g.s, a: g.a, n: g.n, ...over }, u.l);
  const gX = (g, u) => [
    `The ${g.n} sides make ${g.n} equal triangles. One triangle: ½ × ${g.s} × ${g.a} = ${fm(gTri(g))} ${u.a}. Total: ${g.n} × ${fm(gTri(g))} = ${fm(gTotal(g))} ${u.a}. Because the apothem is rounded, this is an estimate.`,
    `Los ${g.n} lados forman ${g.n} triángulos iguales. Un triángulo: ½ × ${g.s} × ${g.a} = ${fm(gTri(g))} ${u.a}. Total: ${g.n} × ${fm(gTri(g))} = ${fm(gTotal(g))} ${u.a}. Como el apotema está redondeado, es una estimación.`,
  ];
  const gH = (g, u) => [
    [
      "Cut the polygon into equal triangles from the center. Area = number of triangles × area of one triangle.",
      "Corta el polígono en triángulos iguales desde el centro. Área = número de triángulos × área de un triángulo.",
    ],
    [
      `Each triangle has a base of ${g.s} ${u.l} and a height of ${g.a} ${u.l} (the apothem). How many triangles are there?`,
      `Cada triángulo tiene una base de ${g.s} ${u.l} y una altura de ${g.a} ${u.l} (el apotema). ¿Cuántos triángulos hay?`,
    ],
    [
      `Find ½ × ${g.s} × ${g.a}, then multiply by the number of triangles.`,
      `Halla ½ × ${g.s} × ${g.a} y multiplica por el número de triángulos.`,
    ],
  ];
  const clash = (g, ans) => [g.n, g.s, g.a, g.n * g.s].includes(ans);

  /** How many triangles, or the area of one.  (level 1) */
  const gOne = (rng) => {
    const c = rng.pick(CG);
    const u = unitOf(rng, c);
    const g = gGeom(rng);
    const [d0, d1] = gDesc(c, g, u);
    if (rng.chance(0.4))
      return mcI(rng, {
        q: [
          `${d0} It is cut into equal triangles by lines from the center to each corner. How many triangles are there?`,
          `${d1} Se corta en triángulos iguales con líneas desde el centro a cada esquina. ¿Cuántos triángulos hay?`,
        ],
        right: String(g.n),
        wrong: [
          { v: String(g.n - 1), tag: "wrong-count" },
          { v: String(g.n + 1), tag: "wrong-count" },
          { v: String(2 * g.n), tag: "wrong-count" },
          { v: String(g.n + 2), tag: "wrong-count" },
        ],
        x: [
          `Each side of the ${NAME[g.n][0]} gets one triangle, so there are ${g.n} triangles.`,
          `Cada lado del ${NAME[g.n][1]} tiene un triángulo, así que hay ${g.n} triángulos.`,
        ],
        h: [
          [
            "Each side of the polygon is the base of one triangle.",
            "Cada lado del polígono es la base de un triángulo.",
          ],
          ["Count the sides.", "Cuenta los lados."],
        ],
        p: { what: "area" },
        viz: gViz(g, u),
        meta: { kind: "count", n: g.n },
      });
    if (clash(g, gTri(g))) return gOne(rng);
    return numI({
      q: [
        `${d0} It is cut into equal triangles by lines from the center to each corner. What is the area of one triangle?`,
        `${d1} Se corta en triángulos iguales con líneas desde el centro a cada esquina. ¿Cuál es el área de un triángulo?`,
      ],
      a: gTri(g),
      unit: u.a,
      fw: [
        { v: g.s * g.a, tag: "forgot-half" },
        { v: g.s + g.a, tag: "added-instead" },
      ],
      x: [
        `A triangle has base ${g.s} and height ${g.a}: ½ × ${g.s} × ${g.a} = ${fm(gTri(g))} ${u.a}.`,
        `Un triángulo tiene base ${g.s} y altura ${g.a}: ½ × ${g.s} × ${g.a} = ${fm(gTri(g))} ${u.a}.`,
      ],
      h: [
        [
          "Each triangle's base is a side of the polygon, and its height is the apothem.",
          "La base de cada triángulo es un lado del polígono y su altura es el apotema.",
        ],
        [`Use ½ × ${g.s} × ${g.a}.`, `Usa ½ × ${g.s} × ${g.a}.`],
      ],
      p: { what: "area", shape: "tri" },
      viz: gViz(g, u),
      meta: { kind: "one", ...g },
    });
  };

  /** Total area of the polygon.  (level 2) */
  const gArea = (o) => (rng) => {
    const c = rng.pick(CG);
    const u = unitOf(rng, c);
    const g = gGeom(rng);
    if (clash(g, gTotal(g))) return gArea(o)(rng);
    const [d0, d1] = gDesc(c, g, u);
    const cand = [
      { k: "one-triangle", v: gTri(g) },
      { k: "added-count", v: gTri(g) + g.n },
      { k: "forgot-half", v: g.n * g.s * g.a },
      { k: "wrong-count", v: (g.n - 1) * gTri(g) },
    ];
    const base = {
      q: [
        `${d0} ${o.mc ? "Which choice is its area?" : "What is its area?"}`,
        `${d1} ${o.mc ? "¿Qué opción es su área?" : "¿Cuál es su área?"}`,
      ],
      x: gX(g, u),
      h: gH(g, u),
      viz: gViz(g, u),
      p: { what: "area", shape: "tri" },
    };
    if (o.mc)
      return mcI(rng, {
        ...base,
        right: `${fm(gTotal(g))} ${u.a}`,
        wrong: [
          ...cand.map((w) => ({ v: `${fm(w.v)} ${u.a}`, tag: w.k })),
          { v: `${fm(gTotal(g))} ${u.l}`, tag: "unit-mismatch" },
        ],
        meta: { kind: "totalMC", ...g, ua: u.a },
      });
    return numI({
      ...base,
      a: gTotal(g),
      unit: u.a,
      tol: 0.01,
      fw: cand.map((w) => ({ v: w.v, tag: w.k })),
      meta: { kind: "total", ...g },
    });
  };

  /** Find the apothem from the total area.  (level 3) */
  const gMiss = (rng) => {
    const c = rng.pick(CG);
    const u = unitOf(rng, c);
    const g = gGeom(rng);
    const A = gTotal(g);
    if (clash(g, g.a * 2) || A === g.a) return gMiss(rng);
    const [Ae, As] = An(c);
    const [pn, pe] = NAME[g.n];
    return numI({
      q: [
        `${Ae} is shaped like a regular ${pn} with sides of ${g.s} ${u.l}. Its area is about ${fm(A)} ${u.a}. It is cut into ${g.n} equal triangles from the center. What is the apothem, the height of each triangle?`,
        `${As} tiene forma de ${pe} regular con lados de ${g.s} ${u.l}. Su área es de aproximadamente ${fm(A)} ${u.a}. Se corta en ${g.n} triángulos iguales desde el centro. ¿Cuál es el apotema, la altura de cada triángulo?`,
      ],
      a: g.a,
      unit: u.l,
      tol: 0.01,
      fw: [
        { v: A / g.n, tag: "gave-triangle-area" },
        { v: A / (g.n * g.s), tag: "forgot-double" },
        { v: A / g.s, tag: "gave-triangle-area" },
      ],
      x: [
        `One triangle: ${fm(A)} ÷ ${g.n} = ${fm(A / g.n)} ${u.a}. Area = ½ × base × height, so height = 2 × ${fm(A / g.n)} ÷ ${g.s} = ${g.a} ${u.l}.`,
        `Un triángulo: ${fm(A)} ÷ ${g.n} = ${fm(A / g.n)} ${u.a}. Área = ½ × base × altura, así que altura = 2 × ${fm(A / g.n)} ÷ ${g.s} = ${g.a} ${u.l}.`,
      ],
      h: [
        [
          "First find the area of one triangle: share the total equally.",
          "Primero halla el área de un triángulo: reparte el total en partes iguales.",
        ],
        [
          `A triangle with base ${g.s} has area ½ × ${g.s} × (height).`,
          `Un triángulo con base ${g.s} tiene área ½ × ${g.s} × (altura).`,
        ],
        [
          "Double the triangle's area, then divide by its base.",
          "Duplica el área del triángulo y divídela entre su base.",
        ],
      ],
      p: { what: "area", shape: "tri" },
      viz: gViz(g, u, { a: Q }),
      meta: { kind: "missA", ...g, A },
    });
  };

  /** Two polygons with equally sized triangles, or a polygon with a square taken out, or a price.  (level 4) */
  const gMore = (kind) => (rng) => {
    const c = rng.pick(kind === "cost" ? CG.filter((k) => k.pay) : CG);
    const u = unitOf(rng, c, kind === "cost" ? ["ft", "m"] : undefined);
    const [_Ae, _As] = An(c);
    if (kind === "compare") {
      const [n1, n2] = rng.pick([
        [6, 5],
        [8, 6],
        [8, 5],
        [6, 8],
        [5, 6],
      ]);
      const T = intNot(rng, 6, 24, [n1, n2]);
      const diff = T * Math.abs(n1 - n2);
      if ([n1, n2, T].includes(diff)) return gMore(kind)(rng);
      const _g = { n: n1, s: 8, a: Math.round(8 * APO[n1] * 10) / 10 };
      return numI({
        q: [
          `A regular ${NAME[n1][0]} and a regular ${NAME[n2][0]} are each cut into equal triangles from the center. Every triangle in both polygons has an area of ${T} ${u.a}. How much greater is the area of the larger polygon?`,
          `Un ${NAME[n1][1]} regular y un ${NAME[n2][1]} regular se cortan en triángulos iguales desde el centro. Cada triángulo de los dos polígonos tiene un área de ${T} ${u.a}. ¿Cuánto mayor es el área del polígono más grande?`,
        ],
        a: diff,
        unit: u.a,
        fw: [
          { v: T * (n1 + n2), tag: "added-count" },
          { v: T * Math.max(n1, n2), tag: "one-polygon-only" },
          { v: T, tag: "one-triangle" },
          { v: T * Math.min(n1, n2), tag: "one-polygon-only" },
        ],
        x: [
          `${NAME[n1][0]}: ${n1} × ${T} = ${n1 * T} ${u.a}. ${NAME[n2][0]}: ${n2} × ${T} = ${n2 * T} ${u.a}. The difference is ${Math.max(n1, n2) * T} − ${Math.min(n1, n2) * T} = ${diff} ${u.a}.`,
          `${NAME[n1][1]}: ${n1} × ${T} = ${n1 * T} ${u.a}. ${NAME[n2][1]}: ${n2} × ${T} = ${n2 * T} ${u.a}. La diferencia es ${Math.max(n1, n2) * T} − ${Math.min(n1, n2) * T} = ${diff} ${u.a}.`,
        ],
        h: [
          [
            "The number of triangles equals the number of sides.",
            "El número de triángulos es igual al número de lados.",
          ],
          [
            "Find each polygon's area: number of triangles × area of one triangle.",
            "Halla el área de cada polígono: número de triángulos × área de un triángulo.",
          ],
          ["Subtract the smaller area from the larger one.", "Resta el área menor del área mayor."],
        ],
        p: { what: "area" },
        viz: shape("hex", { n: n1 }, u.l),
        meta: { kind: "compare", n1, n2, T },
      });
    }
    const g = gGeom(rng);
    const A = gTotal(g);
    const [d0, d1] = gDesc(c, g, u);
    if (kind === "cost") {
      const rate = rng.pick([2, 3, 4, 5]);
      return numI({
        q: [
          `${d0} Covering it costs $${rate} for each ${u.sq}. About how much does it cost, in dollars?`,
          `${d1} Cubrirlo cuesta $${rate} por cada ${u.sqEs}. ¿Aproximadamente cuánto cuesta, en dólares?`,
        ],
        a: A * rate,
        tol: 0.01,
        fw: [
          { v: A, tag: "forgot-rate" },
          { v: gTri(g) * rate, tag: "one-triangle" },
          { v: g.n * g.s * g.a * rate, tag: "forgot-half" },
        ],
        x: [
          `${gX(g, u)[0]} Cost: ${fm(A)} × $${rate} = $${fm(A * rate)}.`,
          `${gX(g, u)[1]} Costo: ${fm(A)} × $${rate} = $${fm(A * rate)}.`,
        ],
        h: [
          [
            "Two steps: the polygon's area, then the price.",
            "Dos pasos: el área del polígono y luego el precio.",
          ],
          gH(g, u)[1],
          [`Find the area, then multiply by ${rate}.`, `Halla el área y multiplica por ${rate}.`],
        ],
        p: { what: "area", shape: "tri" },
        viz: gViz(g, u),
        meta: { kind: "cost", ...g, rate },
      });
    }
    const k = rng.pick([2, 3, 4]);
    if (clash(g, A - k * k) || A - k * k === k) return gMore(kind)(rng);
    return numI({
      q: [
        `${d0} A square ${k} ${u.l} by ${k} ${u.l} is cut out of the middle. What is the area that is left?`,
        `${d1} Se recorta un cuadrado de ${k} ${u.l} por ${k} ${u.l} del medio. ¿Cuál es el área que queda?`,
      ],
      a: A - k * k,
      unit: u.a,
      tol: 0.01,
      fw: [
        { v: A, tag: "forgot-cutout" },
        { v: A + k * k, tag: "added-cutout" },
        { v: A - k, tag: "subtracted-instead" },
        { v: gTri(g) - k * k, tag: "one-triangle" },
      ],
      x: [
        `${gX(g, u)[0]} The square is ${k} × ${k} = ${k * k} ${u.a}. Left: ${fm(A)} − ${k * k} = ${fm(A - k * k)} ${u.a}.`,
        `${gX(g, u)[1]} El cuadrado es ${k} × ${k} = ${k * k} ${u.a}. Queda: ${fm(A)} − ${k * k} = ${fm(A - k * k)} ${u.a}.`,
      ],
      h: [
        [
          "First the whole polygon, then take the square away.",
          "Primero el polígono entero y luego quita el cuadrado.",
        ],
        gH(g, u)[1],
        [
          `The square's area is ${k} × ${k}. Subtract it from the polygon's area.`,
          `El área del cuadrado es ${k} × ${k}. Réstala del área del polígono.`,
        ],
      ],
      p: { what: "area", shape: "tri" },
      viz: gViz(g, u),
      meta: { kind: "hole", ...g, k },
    });
  };

  reg(
    "areaRegularPolygon",
    "Area of regular polygons",
    "Área de polígonos regulares",
    {
      1: [gOne, gOne, gArea({ mc: true })],
      2: [gArea({}), gArea({ mc: true }), gArea({})],
      3: [gMiss, gArea({ mc: true }), gMiss],
      4: [gMore("compare"), gMore("hole"), gMore("cost")],
    },
    (item) => {
      const m = item.meta;
      // area of a regular polygon as half of (perimeter × apothem), worked in tenths
      const half = (g) => (g.n * g.s * Math.round(g.a * 10)) / 20;
      switch (m.kind) {
        case "count":
          return item.c[item.a] === String(m.n) || "triangle count";
        case "one":
          return wantNum(item, (m.s * Math.round(m.a * 10)) / 20, "one triangle");
        case "total":
          return wantNum(item, half(m) / 1, "polygon area");
        case "totalMC":
          return wantChoice(item, half(m), m.ua, "polygon area");
        case "missA":
          return (
            near((m.n * m.s * Math.round(G.value(item.a) * 10)) / 20, m.A) ||
            `apothem ${item.a} does not give ${m.A}`
          );
        case "compare":
          return wantNum(item, Math.abs(m.n1 - m.n2) * m.T, "difference");
        case "cost":
          return wantNum(item, half(m) * m.rate, "cost");
        case "hole":
          return wantNum(item, half(m) - m.k * m.k, "area left");
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  );

  /* __GENERATORS__ */
})();

/**
 * Practice Studio activity: wrapit (lessons 5-7 "Wrap it" and 5-8 "Ruler on the net").
 *
 * prism ("Wrap it"): a box or a triangular prism is unfolded. The student labels the area of each kind of face, adds them to the
 * surface area, and works out the paint budget at a price for each square unit.
 *
 * pyramid ("Ruler on the net"): a square pyramid's net is drawn to scale. The student picks which segment is the height of a
 * triangular face, measures it with the ruler marks on the net, and finds the surface area. The pyramid's vertical height goes up
 * through the inside, so it has no counterpart on the net: it is a choice that must be turned down, not used.
 *
 * State, prism: { f: [text per face kind], total: text, cost: text }. State, pyramid: { seg: id, len: text, total: text }.
 * Contract: docs/specs/practice-studio-v2.md section 5; grade() shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const ui = A.ui;
  const UNITS = ["cm", "in", "ft", "m"];
  const TRIPLES = [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [9, 12, 15],
    [8, 15, 17],
    [12, 16, 20],
  ];

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode = params.mode === "pyramid" ? "pyramid" : "prism";
    const unit = rng.pick(UNITS);
    return mode === "pyramid" ? makePyramid(rng, level, unit) : makePrism(rng, level, unit, params);
  }

  function makePrism(
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {string} */ unit,
    /** @type {any} */ params,
  ) {
    const tri = params.shape ? params.shape === "tri" : level >= 3 && rng.chance(0.6);
    const rate = rng.pick(level <= 2 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8]);
    const m = /** @type {any} */ ({ mode: "prism", unit, rate });
    if (!tri) {
      const [l, w, h] = rng.distinct(3, 2, 6 + level * 2);
      m.kind = "box";
      m.dims = [l, w, h];
      m.faces = [
        {
          en: `Top and bottom (${l} × ${w})`,
          es: `Arriba y abajo (${l} × ${w})`,
          area: l * w,
          count: 2,
        },
        {
          en: `Front and back (${l} × ${h})`,
          es: `Frente y atrás (${l} × ${h})`,
          area: l * h,
          count: 2,
        },
        {
          en: `Left and right (${w} × ${h})`,
          es: `Izquierda y derecha (${w} × ${h})`,
          area: w * h,
          count: 2,
        },
      ];
    } else {
      const [a, b, c] = rng.pick(TRIPLES.filter((t) => t[2] <= 8 + level * 3));
      const len = rng.int(3, 5 + level * 2);
      m.kind = "tri";
      m.dims = [a, b, c, len];
      m.faces = [
        {
          en: `Triangle end (legs ${a} and ${b})`,
          es: `Extremo triangular (catetos ${a} y ${b})`,
          area: (a * b) / 2,
          count: 2,
        },
        {
          en: `Rectangle on the ${a} side (${a} × ${len})`,
          es: `Rectángulo del lado ${a} (${a} × ${len})`,
          area: a * len,
          count: 1,
        },
        {
          en: `Rectangle on the ${b} side (${b} × ${len})`,
          es: `Rectángulo del lado ${b} (${b} × ${len})`,
          area: b * len,
          count: 1,
        },
        {
          en: `Rectangle on the ${c} side (${c} × ${len})`,
          es: `Rectángulo del lado ${c} (${c} × ${len})`,
          area: c * len,
          count: 1,
        },
      ];
    }
    m.total = m.faces.reduce(
      (/** @type {number} */ t, /** @type {any} */ f) => t + f.area * f.count,
      0,
    );
    m.budget = m.total * rate;
    const what =
      m.kind === "box"
        ? [
            "a box",
            "una caja",
            `${m.dims[0]} ${unit} long, ${m.dims[1]} ${unit} wide and ${m.dims[2]} ${unit} tall`,
            `de ${m.dims[0]} ${unit} de largo, ${m.dims[1]} ${unit} de ancho y ${m.dims[2]} ${unit} de alto`,
          ]
        : [
            "a triangular prism",
            "un prisma triangular",
            `with a right-triangle end (legs ${m.dims[0]} and ${m.dims[1]}, slanted side ${m.dims[2]} ${unit}) and a length of ${m.dims[3]} ${unit}`,
            `con un extremo de triángulo rectángulo (catetos ${m.dims[0]} y ${m.dims[1]}, lado inclinado ${m.dims[2]} ${unit}) y un largo de ${m.dims[3]} ${unit}`,
          ];
    const spec = /** @type {any} */ ({ model: m });
    spec.q = `Unfold ${what[0]} ${what[2]}. Write the area of each kind of face. Then add every face to find the surface area. Paint costs $${rate} for each square ${unit}. How much does it cost to paint the whole outside?`;
    spec.qEs = `Desarma ${what[1]} ${what[3]}. Escribe el área de cada tipo de cara. Luego suma todas las caras para hallar el área de superficie. La pintura cuesta $${rate} por cada ${unit} cuadrado. ¿Cuánto cuesta pintar todo el exterior?`;
    const parts = m.faces.map((/** @type {any} */ f) => `${f.count} × ${f.area}`).join(" + ");
    spec.x = `Faces: ${parts} = ${m.total} ${unit}². Each kind of face counts as many times as it appears on the net. Budget: ${m.total} × $${rate} = $${m.budget}.`;
    spec.xEs = `Caras: ${parts} = ${m.total} ${unit}². Cada tipo de cara cuenta tantas veces como aparece en la red. Presupuesto: ${m.total} × $${rate} = $${m.budget}.`;
    spec.h = [
      "Unfold the solid in your mind. Every face is on the net exactly once.",
      "A face that appears twice (top and bottom, or two triangle ends) is counted twice in the total.",
      "Add all the faces first to get the surface area. Then multiply that number by the price for each square unit.",
    ];
    spec.hEs = [
      "Despliega el sólido en tu mente. Cada cara está en la red exactamente una vez.",
      "Una cara que aparece dos veces (arriba y abajo, o dos extremos triangulares) cuenta dos veces en el total.",
      "Primero suma todas las caras para obtener el área de superficie. Luego multiplica ese número por el precio de cada unidad cuadrada.",
    ];
    return spec;
  }

  function makePyramid(
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {string} */ unit,
  ) {
    const trip = rng.pick(TRIPLES.filter((t) => t[2] <= 9 + level * 3 && t[0] % 1 === 0));
    // half the base edge x, vertical height H, slant l: x² + H² = l²
    const x = trip[0];
    const H = trip[1];
    const l = trip[2];
    const s = 2 * x;
    const m = /** @type {any} */ ({ mode: "pyramid", unit, s, H, l, x, total: s * s + 2 * s * l });
    m.segs = [
      {
        id: "slant",
        en: "From the top of a triangle straight down to the middle of its base",
        es: "Desde la punta de un triángulo recto hacia abajo hasta la mitad de su base",
      },
      {
        id: "edge",
        en: "Along the slanted edge from the top to a corner of the base",
        es: "Por la arista inclinada desde la punta hasta una esquina de la base",
      },
      {
        id: "base",
        en: "Along the bottom edge of a triangle (the base edge)",
        es: "Por el borde de abajo de un triángulo (la arista de la base)",
      },
      {
        id: "vertical",
        en: "The pyramid's vertical height (up through the inside)",
        es: "La altura vertical de la pirámide (hacia arriba por el interior)",
      },
    ];
    const spec = /** @type {any} */ ({ model: m });
    spec.q = `The net of a square pyramid is drawn to scale, with a ruler marked in ${unit} beside it. The base edge is ${s} ${unit}. Inside, the pyramid is ${H} ${unit} tall, but that height is not drawn on the net. Choose the segment that is the height of one triangular face. Measure it with the ruler. Then find the surface area.`;
    spec.qEs = `La red de una pirámide cuadrada está dibujada a escala, con una regla marcada en ${unit} al lado. La arista de la base mide ${s} ${unit}. Por dentro, la pirámide mide ${H} ${unit} de alto, pero esa altura no está dibujada en la red. Elige el segmento que es la altura de una cara triangular. Mídelo con la regla. Luego halla el área de superficie.`;
    spec.x = `A triangle's height is measured inside the triangle, straight across from its base: the ruler reads ${l} ${unit}. The vertical height (${H} ${unit}) goes through the inside of the pyramid, so it is nowhere on the net. Surface area = ${s} × ${s} + 4 × (½ × ${s} × ${l}) = ${s * s} + ${2 * s * l} = ${m.total} ${unit}².`;
    spec.xEs = `La altura de un triángulo se mide dentro del triángulo, recta desde su base: la regla marca ${l} ${unit}. La altura vertical (${H} ${unit}) pasa por el interior de la pirámide, así que no está en ninguna parte de la red. Área de superficie = ${s} × ${s} + 4 × (½ × ${s} × ${l}) = ${s * s} + ${2 * s * l} = ${m.total} ${unit}².`;
    spec.h = [
      "Look at one triangle on the net. Its height is the segment that makes a right angle with its base.",
      "Put the ruler along that segment and read where it ends. The marks on the ruler are units.",
      "Surface area = the square base + 4 triangles. Each triangle is ½ × base × the height you measured.",
    ];
    spec.hEs = [
      "Mira un triángulo de la red. Su altura es el segmento que forma un ángulo recto con su base.",
      "Pon la regla a lo largo de ese segmento y lee dónde termina. Las marcas de la regla son unidades.",
      "Área de superficie = la base cuadrada + 4 triángulos. Cada triángulo es ½ × base × la altura que mediste.",
    ];
    return spec;
  }

  const solution = (/** @type {any} */ spec) => {
    const m = spec.model;
    if (m.mode === "pyramid") return { seg: "slant", len: String(m.l), total: String(m.total) };
    return {
      f: m.faces.map((/** @type {any} */ f) => String(f.area)),
      total: String(m.total),
      cost: String(m.budget),
    };
  };
  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    const s = solution(spec);
    if (m.mode === "pyramid")
      return [
        { ...s, seg: "vertical", len: String(m.H), total: String(m.s * m.s + 2 * m.s * m.H) },
        { ...s, seg: "edge", len: String(Math.round(Math.hypot(m.x, m.l) * 10) / 10) },
        { ...s, total: String(2 * m.s * m.l) },
        { ...s, total: String(m.s * m.s + 4 * m.s * m.l) },
      ];
    const once = m.faces.reduce((/** @type {number} */ t, /** @type {any} */ f) => t + f.area, 0);
    return [
      {
        ...s,
        f: s.f.map((/** @type {string} */ v, /** @type {number} */ i) =>
          i === 0 ? String(Number(v) * 2) : v,
        ),
      },
      { ...s, total: String(once), cost: String(once * m.rate) },
      { ...s, cost: String(m.total) },
      { ...s, total: String(m.total + 1), cost: String((m.total + 1) * m.rate) },
    ];
  }
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const near = (/** @type {any} */ a, /** @type {number} */ b) => Math.abs(ui.num(a) - b) < 0.005;
    if (m.mode === "pyramid") {
      const segOk = st && st.seg === "slant";
      const lenOk = segOk && near(st.len, m.l);
      const totOk = near(st && st.total, m.total);
      const marks = [!!segOk, !!lenOk, totOk];
      const right = marks.filter(Boolean).length;
      if (segOk && lenOk && totOk) return { ok: true };
      if (!st || !st.seg)
        return ui.miss(
          "incomplete",
          "Choose a segment first.",
          "Elige primero un segmento.",
          right,
          3,
          marks,
        );
      if (st.seg === "vertical")
        return ui.miss(
          "used-vertical-height",
          "The vertical height goes up through the inside of the pyramid. It is not on the net, so a triangle cannot use it. Pick a segment you can see on a triangle.",
          "La altura vertical sube por el interior de la pirámide. No está en la red, así que un triángulo no la puede usar. Elige un segmento que veas en un triángulo.",
          right,
          3,
          marks,
        );
      if (st.seg !== "slant")
        return ui.miss(
          "wrong-segment",
          "A triangle's height makes a right angle with its base. That segment does not. Look for the one that does.",
          "La altura de un triángulo forma un ángulo recto con su base. Ese segmento no. Busca el que sí.",
          right,
          3,
          marks,
        );
      if (!lenOk)
        return ui.miss(
          "ruler-off",
          "Put the ruler's zero at one end of the segment and read the mark at the other end.",
          "Pon el cero de la regla en un extremo del segmento y lee la marca del otro extremo.",
          right,
          3,
          marks,
        );
      if (near(st.total, 2 * m.s * m.l))
        return ui.miss(
          "forgot-base",
          "That is only the four triangles. The square base is part of the surface too.",
          "Eso es solo los cuatro triángulos. La base cuadrada también es parte de la superficie.",
          right,
          3,
          marks,
        );
      if (near(st.total, m.s * m.s + 4 * m.s * m.l))
        return ui.miss(
          "forgot-half",
          "A triangle is half of base × height. Take the half before you add the faces.",
          "Un triángulo es la mitad de base × altura. Toma la mitad antes de sumar las caras.",
          right,
          3,
          marks,
        );
      return ui.miss(
        "total-off",
        "Add the square base to the four triangles. Each triangle is ½ × base × the height you measured.",
        "Suma la base cuadrada a los cuatro triángulos. Cada triángulo es ½ × base × la altura que mediste.",
        right,
        3,
        marks,
      );
    }
    const faceMarks = m.faces.map((/** @type {any} */ f, /** @type {number} */ i) =>
      near(st && st.f && st.f[i], f.area),
    );
    const totOk = near(st && st.total, m.total);
    const costOk = near(st && st.cost, m.budget);
    const marks = [...faceMarks, totOk, costOk];
    const right = marks.filter(Boolean).length;
    if (marks.every(Boolean)) return { ok: true };
    const once = m.faces.reduce((/** @type {number} */ t, /** @type {any} */ f) => t + f.area, 0);
    if (faceMarks.every(Boolean) && !totOk) {
      if (near(st.total, once))
        return ui.miss(
          "forgot-face",
          "That counts each kind of face once. A face that appears twice on the net is added twice.",
          "Eso cuenta cada tipo de cara una sola vez. Una cara que aparece dos veces en la red se suma dos veces.",
          right,
          marks.length,
          marks,
        );
      return ui.miss(
        "total-off",
        "Add every face: each area times the number of times that face appears.",
        "Suma todas las caras: cada área por la cantidad de veces que aparece esa cara.",
        right,
        marks.length,
        marks,
      );
    }
    if (!faceMarks.every(Boolean))
      return ui.miss(
        "face-off",
        "Check a face again. A rectangle's area is its two sides multiplied. A triangle's is half of base × height.",
        "Revisa una cara otra vez. El área de un rectángulo es el producto de sus dos lados. La de un triángulo es la mitad de base × altura.",
        right,
        marks.length,
        marks,
      );
    if (near(st && st.cost, m.total))
      return ui.miss(
        "forgot-rate",
        "That is the surface area. The question asks for the cost, so multiply by the price for each square unit.",
        "Esa es el área de superficie. La pregunta pide el costo, así que multiplica por el precio de cada unidad cuadrada.",
        right,
        marks.length,
        marks,
      );
    return ui.miss(
      "cost-off",
      "The budget is the surface area times the price for one square unit.",
      "El presupuesto es el área de superficie por el precio de una unidad cuadrada.",
      right,
      marks.length,
      marks,
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.wr-segs{display:grid;gap:8px;margin:8px 0;padding:0;border:0}
.wr-segs legend{font-weight:800;margin-bottom:4px}
.wr-seg{display:flex;gap:10px;align-items:center;min-height:44px;padding:8px 10px;border:2px solid var(--sa-bd);border-radius:var(--sa-r);background:var(--sa-s);cursor:pointer}
.wr-seg input{width:22px;height:22px;accent-color:var(--sa-b)}
.wr-seg:has(input:checked){border-color:var(--sa-dk);background:var(--sa-sunt)}
.wr-net .g-slant{stroke:var(--sa-b);stroke-width:3;stroke-dasharray:7 4}
.wr-net .g-tick{stroke:var(--sa-i);stroke-width:2}
`;

  /** The to-scale net of a square pyramid: base in the middle, a triangle on each side, a ruler beside the top triangle's height. */
  function pyramidSvg(/** @type {any} */ m, /** @type {Function} */ L) {
    const sc = Math.min(210 / (m.s + 2 * m.l), 14);
    const cx = 130;
    const cy = 20 + (m.l + m.s / 2) * sc;
    const s2 = (m.s / 2) * sc;
    const top = cy - s2 - m.l * sc;
    const P = (/** @type {number} */ x, /** @type {number} */ y) =>
      `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
    let body = `<rect class="g-fill2" x="${cx - s2}" y="${cy - s2}" width="${2 * s2}" height="${2 * s2}"/>`;
    body += `<polygon class="g-fill" points="${P(cx - s2, cy - s2)} ${P(cx + s2, cy - s2)} ${P(cx, top)}"/>`;
    body += `<polygon class="g-fill" points="${P(cx - s2, cy + s2)} ${P(cx + s2, cy + s2)} ${P(cx, cy + s2 + m.l * sc)}"/>`;
    body += `<polygon class="g-fill" points="${P(cx - s2, cy - s2)} ${P(cx - s2, cy + s2)} ${P(cx - s2 - m.l * sc, cy)}"/>`;
    body += `<polygon class="g-fill" points="${P(cx + s2, cy - s2)} ${P(cx + s2, cy + s2)} ${P(cx + s2 + m.l * sc, cy)}"/>`;
    body += `<line class="g-slant" x1="${cx}" y1="${top}" x2="${cx}" y2="${cy - s2}"/>`;
    // the ruler: marks every unit along the left of the top triangle's height, zero at the base
    const rx = cx - s2 - 14;
    body += `<line class="g-tick" x1="${rx}" y1="${cy - s2}" x2="${rx}" y2="${top}"/>`;
    for (let u = 0; u * sc <= m.l * sc + 0.5; u++) {
      const y = cy - s2 - u * sc;
      body += `<line class="g-tick" x1="${rx - (u % 5 === 0 ? 9 : 5)}" y1="${y}" x2="${rx}" y2="${y}"/>`;
      if (u % 2 === 0 || m.l <= 8)
        body += `<text x="${rx - 12}" y="${y + 5}" text-anchor="end">${u}</text>`;
    }
    body += `<text x="${cx + s2 + 8}" y="${cy - s2 - 6}">${L("base edge", "arista de la base")} ${m.s} ${m.unit}</text>`;
    const w = 260 + (m.l * sc > 70 ? 0 : 0);
    return `<svg class="sa-fig wr-net" viewBox="0 0 ${Math.max(w, 2 * (cx + s2 + m.l * sc) - cx + 10)} ${cy + s2 + m.l * sc + 24}" role="img" aria-label="${L(`Net of a square pyramid drawn to scale: a ${m.s} by ${m.s} ${m.unit} square with a triangle on each side. A ruler in ${m.unit} runs along the height of the top triangle.`, `Red de una pirámide cuadrada dibujada a escala: un cuadrado de ${m.s} por ${m.s} ${m.unit} con un triángulo en cada lado. Una regla en ${m.unit} corre a lo largo de la altura del triángulo de arriba.`)}">${body}</svg>`;
  }

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const m = spec.model;
    const k = ui.begin("wrapit", CSS, host, api);
    const { root, ro, L, T } = k;
    const st = /** @type {any} */ (
      m.mode === "pyramid"
        ? { seg: "", len: "", total: "" }
        : { f: m.faces.map(() => ""), total: "", cost: "" }
    );
    if (api.restore) Object.assign(st, ui.clone(api.restore));
    const emit = () => api.change?.(ui.clone(st));
    if (m.mode === "pyramid") {
      root.insertAdjacentHTML("beforeend", pyramidSvg(m, L));
      const fs = A.el("fieldset", "wr-segs");
      fs.append(
        A.el(
          "legend",
          "",
          T(
            "Which segment is the height of one triangular face?",
            "¿Qué segmento es la altura de una cara triangular?",
          ),
        ),
      );
      m.segs.forEach((/** @type {any} */ sg) => {
        const id = `wr-${spec.seed}-${sg.id}`;
        const lab = A.el("label", "wr-seg", "", { for: id });
        const input = /** @type {HTMLInputElement} */ (
          A.el("input", "", "", { type: "radio", name: `wr-${spec.seed}`, id, value: sg.id })
        );
        input.checked = st.seg === sg.id;
        input.disabled = ro;
        input.addEventListener("change", () => {
          st.seg = sg.id;
          emit();
        });
        lab.append(input, A.el("span", "", T(sg.en, sg.es)));
        fs.append(lab);
      });
      root.append(fs);
      root.append(
        ui.field({
          id: `wr-${spec.seed}-len`,
          en: "Length you measured",
          es: "Longitud que mediste",
          value: st.len,
          ro,
          T,
          unit: m.unit,
          onInput: (v) => {
            st.len = v;
            emit();
          },
        }).wrap,
        ui.field({
          id: `wr-${spec.seed}-tot`,
          en: "Surface area",
          es: "Área de superficie",
          value: st.total,
          ro,
          T,
          unit: `${m.unit}²`,
          onInput: (v) => {
            st.total = v;
            emit();
          },
        }).wrap,
      );
    } else {
      const card = A.el("div", "sa-card");
      card.append(A.el("h4", "", T("Area of each kind of face", "Área de cada tipo de cara")));
      m.faces.forEach((/** @type {any} */ f, /** @type {number} */ i) => {
        card.append(
          ui.field({
            id: `wr-${spec.seed}-f${i}`,
            en: f.en,
            es: f.es,
            value: st.f[i],
            ro,
            T,
            unit: `${m.unit}² ${L(`(${f.count === 1 ? "once" : "twice"} on the net)`, `(${f.count === 1 ? "una vez" : "dos veces"} en la red)`)}`,
            onInput: (v) => {
              st.f[i] = v;
              emit();
            },
          }).wrap,
        );
      });
      root.append(card);
      root.append(
        ui.field({
          id: `wr-${spec.seed}-tot`,
          en: "Surface area",
          es: "Área de superficie",
          value: st.total,
          ro,
          T,
          unit: `${m.unit}²`,
          onInput: (v) => {
            st.total = v;
            emit();
          },
        }).wrap,
        ui.field({
          id: `wr-${spec.seed}-cost`,
          en: `Paint budget at $${m.rate} for each square ${m.unit}`,
          es: `Presupuesto de pintura a $${m.rate} por cada ${m.unit} cuadrado`,
          value: st.cost,
          ro,
          T,
          unit: "$",
          onInput: (v) => {
            st.cost = v;
            emit();
          },
        }).wrap,
      );
    }
    root.append(k.status);
    ui.checkRow(root, ro, api, () => ui.clone(st), L, T);
    if (ro) k.say("Solved.", "Resuelto.");
  }

  A.register("wrapit", {
    title: "Wrap it",
    titleEs: "Envuélvelo",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();

/**
 * Practice Studio activity: decompose (lessons 5-3 and 5-4, "Pick a decomposition, then check" / "Two cuts, one area").
 *
 * One figure, two different cuts. The student finds the area of each piece of cut A, then of each piece of cut B. The two totals
 * must agree because it is the same figure. When they do not, one cut used a length the picture does not print (the unmeasured
 * dimension): the end triangle's base of a trapezoid, or half of a roof's base.
 *
 * Modes: trap (5-3: a rectangle plus two triangles, against two copies joined into a parallelogram) and house (5-4: a rectangle
 * plus one roof triangle, against a rectangle plus two right triangles). State: { a: [x, y], b: [x, y] } as typed text.
 * Contract: docs/specs/practice-studio-v2.md section 5; grade() shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const ui = A.ui;
  const UNITS = ["cm", "in", "ft", "m"];
  const T = (/** @type {number} */ n) => String(Math.round(n * 100) / 100);

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode = params.mode === "house" ? "house" : "trap";
    const unit = rng.pick(UNITS);
    const m = /** @type {any} */ ({ mode, unit });
    const spec = /** @type {any} */ ({ model: m });
    if (mode === "trap") {
      m.b2 = rng.int(3 + level, 8 + level * 2);
      m.t = rng.int(2, 3 + level);
      m.b1 = m.b2 + 2 * m.t;
      m.h = rng.int(3, 6 + level);
      // answers in the order the boxes appear: rectangle, both triangles, parallelogram of two trapezoids, one trapezoid
      m.key = [m.b2 * m.h, m.t * m.h, (m.b1 + m.b2) * m.h, ((m.b1 + m.b2) * m.h) / 2];
      m.hidden = m.t;
      spec.q = `A trapezoid has a long base of ${m.b1} ${unit}, a short base of ${m.b2} ${unit} and a height of ${m.h} ${unit}. Cut A: a rectangle in the middle and a triangle at each end. Cut B: make a second copy, flip it and join the two into a parallelogram. Find the area of each piece. The two cuts must agree.`;
      spec.qEs = `Un trapecio tiene una base larga de ${m.b1} ${unit}, una base corta de ${m.b2} ${unit} y una altura de ${m.h} ${unit}. Corte A: un rectángulo en el medio y un triángulo en cada extremo. Corte B: haz una segunda copia, voltéala y une las dos para formar un paralelogramo. Halla el área de cada pieza. Los dos cortes deben coincidir.`;
      spec.x = `Cut A: the rectangle is ${m.b2} × ${m.h} = ${m.key[0]} ${unit}². Each end triangle has a base of (${m.b1} − ${m.b2}) ÷ 2 = ${m.t} ${unit}, so the two triangles are ${m.t} × ${m.h} = ${m.key[1]} ${unit}². Total ${m.key[0] + m.key[1]} ${unit}². Cut B: the parallelogram has a base of ${m.b1} + ${m.b2} = ${m.b1 + m.b2} ${unit}, so it is ${m.key[2]} ${unit}², and one trapezoid is half: ${m.key[3]} ${unit}². Same figure, same area.`;
      spec.xEs = `Corte A: el rectángulo mide ${m.b2} × ${m.h} = ${m.key[0]} ${unit}². Cada triángulo de los extremos tiene una base de (${m.b1} − ${m.b2}) ÷ 2 = ${m.t} ${unit}, así que los dos triángulos miden ${m.t} × ${m.h} = ${m.key[1]} ${unit}². Total ${m.key[0] + m.key[1]} ${unit}². Corte B: el paralelogramo tiene una base de ${m.b1} + ${m.b2} = ${m.b1 + m.b2} ${unit}, así que mide ${m.key[2]} ${unit}², y un trapecio es la mitad: ${m.key[3]} ${unit}². La misma figura, la misma área.`;
    } else {
      m.W = 2 * rng.int(3 + level, 6 + level * 2);
      m.H = rng.int(3, 5 + level);
      m.R = rng.int(3, 5 + level);
      m.half = m.W / 2;
      m.key = [m.W * m.H, (m.W * m.R) / 2, m.W * m.H, m.half * m.R];
      m.hidden = m.half;
      spec.q = `A house shape is a rectangle ${m.W} ${unit} wide and ${m.H} ${unit} tall with a triangle roof on top. The roof has the same base as the rectangle and a height of ${m.R} ${unit}. Cut A: the rectangle and one roof triangle. Cut B: the rectangle and two right triangles made by cutting the roof straight down from its top corner. Find the area of each piece. The two cuts must agree.`;
      spec.qEs = `Una casa es un rectángulo de ${m.W} ${unit} de ancho y ${m.H} ${unit} de alto con un techo triangular encima. El techo tiene la misma base que el rectángulo y una altura de ${m.R} ${unit}. Corte A: el rectángulo y un triángulo de techo. Corte B: el rectángulo y dos triángulos rectángulos que salen de cortar el techo recto hacia abajo desde su vértice de arriba. Halla el área de cada pieza. Los dos cortes deben coincidir.`;
      spec.x = `Cut A: the rectangle is ${m.W} × ${m.H} = ${m.key[0]} ${unit}² and the roof triangle is ½ × ${m.W} × ${m.R} = ${m.key[1]} ${unit}². Total ${m.key[0] + m.key[1]} ${unit}². Cut B: the same rectangle, ${m.key[2]} ${unit}², and the two right triangles, each with a base of ${m.W} ÷ 2 = ${m.half} ${unit}: 2 × (½ × ${m.half} × ${m.R}) = ${m.key[3]} ${unit}². Total ${m.key[2] + m.key[3]} ${unit}². Same figure, same area.`;
      spec.xEs = `Corte A: el rectángulo mide ${m.W} × ${m.H} = ${m.key[0]} ${unit}² y el triángulo del techo mide ½ × ${m.W} × ${m.R} = ${m.key[1]} ${unit}². Total ${m.key[0] + m.key[1]} ${unit}². Corte B: el mismo rectángulo, ${m.key[2]} ${unit}², y los dos triángulos rectángulos, cada uno con una base de ${m.W} ÷ 2 = ${m.half} ${unit}: 2 × (½ × ${m.half} × ${m.R}) = ${m.key[3]} ${unit}². Total ${m.key[2] + m.key[3]} ${unit}². La misma figura, la misma área.`;
    }
    spec.h = [
      "A cut splits one figure into pieces whose areas add up to the whole. Different cuts give the same total.",
      mode === "trap"
        ? "One length you need is not written on the picture: how wide is the base of each end triangle? Work it out from the two bases."
        : "One length you need is not written on the picture: how wide is the base of each right triangle? Think about where the cut goes.",
      "Find each piece one at a time. Then add the pieces of a cut and compare the two cuts.",
    ];
    spec.hEs = [
      "Un corte divide una figura en piezas cuyas áreas suman el total. Cortes distintos dan el mismo total.",
      mode === "trap"
        ? "Una medida que necesitas no está escrita en la figura: ¿cuánto mide la base de cada triángulo de los extremos? Calcúlala con las dos bases."
        : "Una medida que necesitas no está escrita en la figura: ¿cuánto mide la base de cada triángulo rectángulo? Piensa dónde pasa el corte.",
      "Halla cada pieza una por una. Luego suma las piezas de un corte y compara los dos cortes.",
    ];
    return spec;
  }

  const solution = (/** @type {any} */ spec) => {
    const k = spec.model.key;
    return { a: [T(k[0]), T(k[1])], b: [T(k[2]), T(k[3])] };
  };
  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    const k = m.key;
    const s = solution(spec);
    if (m.mode === "trap")
      return [
        { a: [s.a[0], T(k[1] / 2)], b: s.b },
        { a: s.a, b: [s.b[0], s.b[0]] },
        { a: [T(m.b1 * m.h), s.a[1]], b: s.b },
        { a: [s.a[0], T(m.b2 * m.h)], b: [s.b[0], T(k[3] + m.t)] },
      ];
    return [
      { a: [s.a[0], T(m.W * m.R)], b: s.b },
      { a: s.a, b: [s.b[0], T(k[3] / 2)] },
      { a: s.a, b: [s.b[0], T(m.W * m.R)] },
      { a: ["", ""], b: ["", ""] },
    ];
  }
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const typed = [...((st && st.a) || ["", ""]), ...((st && st.b) || ["", ""])].map((v) =>
      ui.num(v),
    );
    const marks = m.key.map(
      (/** @type {number} */ want, /** @type {number} */ i) => Math.abs(typed[i] - want) < 0.005,
    );
    const right = marks.filter(Boolean).length;
    if (right === 4) return { ok: true };
    if (typed.some((v) => !Number.isFinite(v)))
      return ui.miss(
        "incomplete",
        "Type a number for every piece of both cuts.",
        "Escribe un número para cada pieza de los dos cortes.",
        right,
        4,
        marks,
      );
    const totalA = typed[0] + typed[1];
    const totalB = typed[2] + typed[3];
    if (Math.abs(totalA - totalB) > 0.005)
      return ui.miss(
        "totals-disagree",
        "Your two cuts give different areas for the same figure. They must match. One cut used a length that is not written on the picture. Find that length and check both cuts.",
        "Tus dos cortes dan áreas distintas para la misma figura. Deben coincidir. Un corte usó una medida que no está escrita en la figura. Halla esa medida y revisa los dos cortes.",
        right,
        4,
        marks,
      );
    if (m.mode === "trap") {
      if (!marks[1] && Math.abs(typed[1] - m.key[1] / 2) < 0.005)
        return ui.miss(
          "one-triangle",
          "That is one end triangle. The trapezoid has a triangle at EACH end.",
          "Ese es un triángulo de un extremo. El trapecio tiene un triángulo en CADA extremo.",
          right,
          4,
          marks,
        );
      if (!marks[3] && Math.abs(typed[3] - m.key[2]) < 0.005)
        return ui.miss(
          "forgot-half",
          "That is the parallelogram, which is made from TWO trapezoids. One trapezoid is half of it.",
          "Ese es el paralelogramo, que está hecho con DOS trapecios. Un trapecio es la mitad.",
          right,
          4,
          marks,
        );
      if (!marks[0])
        return ui.miss(
          "rect-off",
          "The rectangle in the middle is as wide as the short base and as tall as the height.",
          "El rectángulo del medio es tan ancho como la base corta y tan alto como la altura.",
          right,
          4,
          marks,
        );
      return ui.miss(
        "piece-off",
        "Check the pieces again. The parallelogram's base is the two bases of the trapezoid put end to end.",
        "Revisa las piezas otra vez. La base del paralelogramo son las dos bases del trapecio puestas una tras otra.",
        right,
        4,
        marks,
      );
    }
    if (!marks[1] && Math.abs(typed[1] - m.W * m.R) < 0.005)
      return ui.miss(
        "forgot-half",
        "That skips the half. A triangle is half of base × height.",
        "Eso se salta la mitad. Un triángulo es la mitad de base × altura.",
        right,
        4,
        marks,
      );
    if (!marks[3] && Math.abs(typed[3] - m.key[3] / 2) < 0.005)
      return ui.miss(
        "one-triangle",
        "That is one right triangle. Cutting the roof gives TWO of them.",
        "Ese es un triángulo rectángulo. Al cortar el techo salen DOS.",
        right,
        4,
        marks,
      );
    if (!marks[0] || !marks[2])
      return ui.miss(
        "rect-off",
        "The rectangle is as wide as the house and as tall as the walls.",
        "El rectángulo es tan ancho como la casa y tan alto como las paredes.",
        right,
        4,
        marks,
      );
    return ui.miss(
      "piece-off",
      "Check the roof pieces. Each right triangle has half of the roof's base, and that length is not written on the picture.",
      "Revisa las piezas del techo. Cada triángulo rectángulo tiene la mitad de la base del techo, y esa medida no está escrita en la figura.",
      right,
      4,
      marks,
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.dc-pair{display:grid;gap:8px}
@media (min-width:560px){.dc-pair{grid-template-columns:1fr 1fr}}
.dc-card .sa-fig{margin:4px 0 8px}
`;

  /** The figure for one cut, in a 200 x 120 box: solid outline, dashed cut lines, measures. */
  function figure(/** @type {any} */ m, /** @type {"A"|"B"} */ cut, /** @type {Function} */ L) {
    const unit = m.unit;
    if (m.mode === "trap") {
      const x0 = 20;
      const y1 = 100;
      if (cut === "A") {
        const sc = Math.min(150 / m.b1, 80 / m.h);
        const y0 = y1 - m.h * sc;
        const t = m.t * sc;
        const bot = m.b1 * sc;
        const top = m.b2 * sc;
        return `<svg class="sa-fig" viewBox="0 0 200 130" role="img" aria-label="${L(`Trapezoid with bases ${m.b1} and ${m.b2} and height ${m.h}, cut into a rectangle and two end triangles`, `Trapecio con bases ${m.b1} y ${m.b2} y altura ${m.h}, cortado en un rectángulo y dos triángulos de los extremos`)}"><polygon class="g-fill" points="${x0},${y1} ${x0 + bot},${y1} ${x0 + t + top},${y0} ${x0 + t},${y0}"/><line class="g-dash" x1="${x0 + t}" y1="${y0}" x2="${x0 + t}" y2="${y1}"/><line class="g-dash" x1="${x0 + t + top}" y1="${y0}" x2="${x0 + t + top}" y2="${y1}"/><text x="${x0 + bot / 2}" y="122" text-anchor="middle">${m.b1} ${unit}</text><text x="${x0 + t + top / 2}" y="${y0 - 6}" text-anchor="middle">${m.b2} ${unit}</text><text x="${x0 + t + top + 4}" y="${(y0 + y1) / 2 + 4}">${m.h}</text></svg>`;
      }
      const sc = Math.min(160 / (m.b1 + m.b2 + m.t), 80 / m.h);
      const y0 = y1 - m.h * sc;
      const X = (/** @type {number} */ v) => x0 + v * sc;
      return `<svg class="sa-fig" viewBox="0 0 200 130" role="img" aria-label="${L(`Two copies of the trapezoid, one flipped, joined into a parallelogram with base ${m.b1 + m.b2} and height ${m.h}`, `Dos copias del trapecio, una volteada, unidas en un paralelogramo con base ${m.b1 + m.b2} y altura ${m.h}`)}"><polygon class="g-fill" points="${X(0)},${y1} ${X(m.b1)},${y1} ${X(m.t + m.b2)},${y0} ${X(m.t)},${y0}"/><polygon class="g-fill2" points="${X(m.b1)},${y1} ${X(m.b1 + m.b2)},${y1} ${X(m.b1 + m.b2 + m.t)},${y0} ${X(m.t + m.b2)},${y0}"/><text x="${X((m.b1 + m.b2) / 2)}" y="122" text-anchor="middle">${m.b1} + ${m.b2}</text><text x="${X(m.b1 + m.b2 + m.t) + 2}" y="${(y0 + y1) / 2 + 4}" text-anchor="end">${m.h}</text></svg>`;
    }
    const sc = Math.min(150 / m.W, 80 / (m.H + m.R));
    const x0 = 25;
    const yB = 110;
    const yW = yB - m.H * sc;
    const yT = yW - m.R * sc;
    const wd = m.W * sc;
    return `<svg class="sa-fig" viewBox="0 0 200 130" role="img" aria-label="${cut === "A" ? L(`House shape: a rectangle ${m.W} by ${m.H} with one roof triangle of height ${m.R}`, `Casa: un rectángulo de ${m.W} por ${m.H} con un triángulo de techo de altura ${m.R}`) : L(`House shape: a rectangle ${m.W} by ${m.H} with the roof cut into two right triangles of height ${m.R}`, `Casa: un rectángulo de ${m.W} por ${m.H} con el techo cortado en dos triángulos rectángulos de altura ${m.R}`)}"><polygon class="g-fill" points="${x0},${yB} ${x0 + wd},${yB} ${x0 + wd},${yW} ${x0 + wd / 2},${yT} ${x0},${yW}"/><line class="g-dash" x1="${x0}" y1="${yW}" x2="${x0 + wd}" y2="${yW}"/>${cut === "B" ? `<line class="g-dash" x1="${x0 + wd / 2}" y1="${yT}" x2="${x0 + wd / 2}" y2="${yW}"/>` : ""}<text x="${x0 + wd / 2}" y="125" text-anchor="middle">${m.W} ${unit}</text><text x="${x0 + wd + 4}" y="${(yW + yB) / 2 + 4}">${m.H}</text><text x="${x0 + wd / 2 + 6}" y="${(yT + yW) / 2 + 4}">${m.R}</text></svg>`;
  }

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const m = spec.model;
    const k = ui.begin("decompose", CSS, host, api);
    const { root, ro, L, T: TT } = k;
    const st = /** @type {any} */ ({ a: ["", ""], b: ["", ""] });
    if (api.restore) Object.assign(st, ui.clone(api.restore));
    const emit = () => api.change?.(ui.clone(st));
    const names =
      m.mode === "trap"
        ? [
            [
              ["Rectangle area", "Área del rectángulo"],
              ["Both end triangles together", "Los dos triángulos de los extremos juntos"],
            ],
            [
              ["Parallelogram area (two trapezoids)", "Área del paralelogramo (dos trapecios)"],
              ["Area of ONE trapezoid", "Área de UN trapecio"],
            ],
          ]
        : [
            [
              ["Rectangle area", "Área del rectángulo"],
              ["One roof triangle", "Un triángulo de techo"],
            ],
            [
              ["Rectangle area", "Área del rectángulo"],
              ["Both right triangles together", "Los dos triángulos rectángulos juntos"],
            ],
          ];
    const pair = A.el("div", "dc-pair");
    ["A", "B"].forEach((cut, ci) => {
      const card = A.el("div", "sa-card dc-card");
      card.append(A.el("h4", "", TT(`Cut ${cut}`, `Corte ${cut}`)));
      card.insertAdjacentHTML("beforeend", figure(m, /** @type {"A"} */ (cut), L));
      [0, 1].forEach((pi) => {
        const key = ci ? "b" : "a";
        const f = ui.field({
          id: `dc-${spec.seed}-${cut}${pi}`,
          en: names[ci][pi][0],
          es: names[ci][pi][1],
          value: st[key][pi],
          ro,
          T: TT,
          unit: `${m.unit}²`,
          onInput: (v) => {
            st[key][pi] = v;
            emit();
          },
        });
        card.append(f.wrap);
      });
      pair.append(card);
    });
    root.append(pair, k.status);
    ui.checkRow(root, ro, api, () => ui.clone(st), L, TT);
    if (ro) k.say("Solved.", "Resuelto.");
  }

  A.register("decompose", {
    title: "Two cuts, one area",
    titleEs: "Dos cortes, una área",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();

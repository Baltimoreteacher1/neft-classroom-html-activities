/**
 * Practice Studio activity: packcrate (lesson 5-10, "Pack the crate").
 *
 * A crate has edges that are fractions of a unit, such as 1 1/2 by 1 by 2. It is packed with small cubes whose edge is 1/2 or
 * 1/4 of a unit. The student counts how many small cubes fit along each edge, sees the total number of cubes, finds how many
 * of them fill ONE unit cube (8 for a half-unit cube, 64 for a quarter-unit cube), and gets the crate's volume:
 * 24 cubes of 1/8 each is 24 × 1/8 = 3 cubic units.
 *
 * Levels 1-2 use half-unit cubes; levels 3-4 use quarter-unit cubes. State: { n: [along length, width, height], per: text, vol: text }.
 * Contract: docs/specs/practice-studio-v2.md section 5; grade() shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const ui = A.ui;
  const UNITS = ["cm", "in", "ft", "m"];
  /** 6 quarters -> "1 1/2", 3 quarters -> "3/4", 8 quarters -> "2". */
  const quarters = (/** @type {number} */ q) => {
    const whole = Math.floor(q / 4);
    const r = q % 4;
    if (!r) return String(whole);
    const part = r === 2 ? "1/2" : `${r}/4`;
    return whole ? `${whole} ${part}` : part;
  };
  /** A volume written in 64ths of a cubic unit as a reduced mixed number: 96 -> "1 1/2", 36 -> "9/16". */
  const frac64 = (/** @type {number} */ n) => {
    let top = n;
    let bottom = 64;
    while (top && top % 2 === 0 && bottom % 2 === 0) {
      top /= 2;
      bottom /= 2;
    }
    const whole = Math.floor(top / bottom);
    const r = top - whole * bottom;
    return !r ? String(whole) : whole ? `${whole} ${r}/${bottom}` : `${r}/${bottom}`;
  };
  const valueText = (/** @type {number} */ v) => String(Math.round(v * 1e6) / 1e6);

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const quarter = params.cube ? params.cube === "quarter" : level >= 3;
    const unit = rng.pick(UNITS);
    // edges in quarters of a unit; with half-unit cubes each edge is a multiple of 2 quarters, with quarter-unit cubes any count
    let edges;
    for (let tries = 0; ; tries++) {
      edges = [0, 0, 0].map((_, i) =>
        quarter ? rng.int(2 + (i === 0 ? 1 : 0), 4 + level) : 2 * rng.int(1, 3 + (i === 0 ? 1 : 0)),
      );
      const whole = edges.every((q) => q % 4 === 0);
      const halves = quarter
        ? edges.some((q) => q % 4 !== 0 && q % 2 !== 0)
        : edges.some((q) => q % 4 === 2);
      if (tries > 200 || (!whole && halves && new Set(edges).size >= 2)) break;
    }
    const side = quarter ? 1 : 2; // quarters per small-cube edge
    const n = edges.map((q) => q / side);
    const per = quarter ? 64 : 8;
    const total = n[0] * n[1] * n[2];
    const vol = (edges[0] * edges[1] * edges[2]) / 64;
    const cube = quarter ? ["1/4", "a quarter"] : ["1/2", "a half"];
    const m = { unit, edges, n, per, total, vol, quarter, cube: cube[0] };
    const spec = /** @type {any} */ ({ model: m });
    const dims = `${quarters(edges[0])} ${unit} long, ${quarters(edges[1])} ${unit} wide and ${quarters(edges[2])} ${unit} tall`;
    const dimsEs = `${quarters(edges[0])} ${unit} de largo, ${quarters(edges[1])} ${unit} de ancho y ${quarters(edges[2])} ${unit} de alto`;
    spec.q = `A crate is ${dims}. It is packed with small cubes that are ${cube[0]} ${unit} on every edge. Count how many small cubes fit along each edge. Then find how many small cubes fill ONE cube that is 1 ${unit} on every edge, and the volume of the crate.`;
    spec.qEs = `Una caja mide ${dimsEs}. Se llena con cubos pequeños de ${cube[0]} ${unit} en cada arista. Cuenta cuántos cubos pequeños caben a lo largo de cada arista. Luego halla cuántos cubos pequeños llenan UN cubo de 1 ${unit} en cada arista, y el volumen de la caja.`;
    spec.x = `Along the edges ${n.join(", ")} small cubes fit, so ${n.join(" × ")} = ${total} small cubes fill the crate. ${per} small cubes fill one unit cube, so each is 1/${per} of a cubic ${unit}. Volume = ${total} × 1/${per} = ${frac64(edges[0] * edges[1] * edges[2])} ${unit}³.`;
    spec.xEs = `A lo largo de las aristas caben ${n.join(", ")} cubos pequeños, así que ${n.join(" × ")} = ${total} cubos pequeños llenan la caja. ${per} cubos pequeños llenan un cubo unitario, así que cada uno es 1/${per} de un ${unit} cúbico. Volumen = ${total} × 1/${per} = ${frac64(edges[0] * edges[1] * edges[2])} ${unit}³.`;
    spec.h = [
      `Measure each edge in small cubes. One ${unit} holds ${quarter ? 4 : 2} small cubes along an edge.`,
      "Multiply the three counts to get the number of small cubes. Then think: how many small cubes make a cube that is 1 on every edge?",
      "Each small cube is a fraction of one cubic unit. Multiply the number of small cubes by that fraction.",
    ];
    spec.hEs = [
      `Mide cada arista en cubos pequeños. Un ${unit} tiene ${quarter ? 4 : 2} cubos pequeños a lo largo de una arista.`,
      "Multiplica los tres conteos para obtener el número de cubos pequeños. Luego piensa: ¿cuántos cubos pequeños forman un cubo de 1 en cada arista?",
      "Cada cubo pequeño es una fracción de una unidad cúbica. Multiplica el número de cubos pequeños por esa fracción.",
    ];
    return spec;
  }

  const solution = (/** @type {any} */ spec) => ({
    n: [...spec.model.n],
    per: String(spec.model.per),
    vol: valueText(spec.model.vol),
  });
  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    const s = solution(spec);
    return [
      { ...s, n: m.edges.map((q) => q / 4) },
      { ...s, n: [m.n[0] * 2 || 1, m.n[1], m.n[2]] },
      { ...s, per: String(m.quarter ? 16 : 4) },
      { ...s, vol: valueText(m.total) },
      { ...s, vol: valueText(m.total / (m.per / 2)) },
    ].filter((x) => JSON.stringify(x) !== JSON.stringify(s));
  }
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const n = (st && st.n) || [0, 0, 0];
    const nOk = [0, 1, 2].map((i) => n[i] === m.n[i]);
    const perOk = Math.abs(ui.num(st && st.per) - m.per) < 0.005;
    const volOk = Math.abs(ui.num(st && st.vol) - m.vol) < 0.0005;
    const marks = [...nOk, perOk, volOk];
    const right = marks.filter(Boolean).length;
    if (marks.every(Boolean)) return { ok: true };
    if (!nOk.every(Boolean)) {
      if ([0, 1, 2].every((i) => n[i] === m.edges[i] / 4 || n[i] === Math.floor(m.edges[i] / 4)))
        return ui.miss(
          "ignored-cube-size",
          "That counts whole units. The small cubes are smaller than a unit, so more of them fit along each edge.",
          "Eso cuenta unidades enteras. Los cubos pequeños son menores que una unidad, así que caben más a lo largo de cada arista.",
          right,
          5,
          marks,
        );
      return ui.miss(
        "count-off",
        `Count how many small cubes fit along each edge. One ${m.unit} holds ${m.quarter ? 4 : 2} of them.`,
        `Cuenta cuántos cubos pequeños caben a lo largo de cada arista. Un ${m.unit} tiene ${m.quarter ? 4 : 2} de ellos.`,
        right,
        5,
        marks,
      );
    }
    if (!perOk) {
      const got = ui.num(st && st.per);
      if (got === (m.quarter ? 16 : 4))
        return ui.miss(
          "scaled-once",
          "A small cube is smaller in EVERY direction: length, width and height. Think of a 1-unit cube filled layer by layer.",
          "Un cubo pequeño es más pequeño en TODAS las direcciones: largo, ancho y alto. Piensa en un cubo de 1 unidad llenado capa por capa.",
          right,
          5,
          marks,
        );
      return ui.miss(
        "per-off",
        "Fill a cube that is 1 on every edge: count the small cubes along one edge, then multiply the three counts.",
        "Llena un cubo de 1 en cada arista: cuenta los cubos pequeños a lo largo de una arista y multiplica los tres conteos.",
        right,
        5,
        marks,
      );
    }
    if (Math.abs(ui.num(st && st.vol) - m.total) < 0.0005)
      return ui.miss(
        "gave-count",
        "That is the number of small cubes. Each small cube is only a fraction of one cubic unit, so the volume is smaller.",
        "Ese es el número de cubos pequeños. Cada cubo pequeño es solo una fracción de una unidad cúbica, así que el volumen es menor.",
        right,
        5,
        marks,
      );
    return ui.miss(
      "vol-off",
      "Volume = the number of small cubes × the fraction of a cubic unit that each one fills.",
      "Volumen = el número de cubos pequeños × la fracción de una unidad cúbica que llena cada uno.",
      right,
      5,
      marks,
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.pc-fig .pc-cell{fill:var(--sa-bt);stroke:var(--sa-bl);stroke-width:1}
.pc-fig .pc-unit{fill:none;stroke:var(--sa-dk);stroke-width:3}
.pc-sum{font-weight:800;text-align:center;font-size:1.1rem;margin:6px 0;overflow-wrap:anywhere}
`;

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const m = spec.model;
    const k = ui.begin("packcrate", CSS, host, api);
    const { root, ro, L, T } = k;
    const st = /** @type {any} */ ({ n: [1, 1, 1], per: "", vol: "" });
    if (api.restore) Object.assign(st, ui.clone(api.restore));
    const emit = () => api.change?.(ui.clone(st));
    const fig = A.el("div");
    const sum = A.el("p", "pc-sum");
    sum.setAttribute("aria-live", "polite");
    const side = m.quarter ? 1 : 2;
    function draw() {
      const cols = Math.max(1, st.n[0]);
      const rows = Math.max(1, st.n[1]);
      const cs = Math.min(26, 300 / cols, 170 / rows);
      let cells = "";
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          cells += `<rect class="pc-cell" x="${10 + c * cs}" y="${10 + r * cs}" width="${cs}" height="${cs}"/>`;
      // thick lines every whole unit (every 4/side small cubes), so the student can see how many small cubes fill a unit
      let units = "";
      const per = 4 / side;
      for (let c = 0; c * per <= cols; c++)
        units += `<line class="pc-unit" x1="${10 + c * per * cs}" y1="10" x2="${10 + c * per * cs}" y2="${10 + rows * cs}"/>`;
      for (let r = 0; r * per <= rows; r++)
        units += `<line class="pc-unit" x1="10" y1="${10 + r * per * cs}" x2="${10 + cols * cs}" y2="${10 + r * per * cs}"/>`;
      fig.innerHTML = `<svg class="sa-fig pc-fig" viewBox="0 0 ${cols * cs + 20} ${rows * cs + 20}" role="img" aria-label="${L(`Top of the crate: ${cols} by ${rows} small cubes. Thick lines mark whole units.`, `Parte de arriba de la caja: ${cols} por ${rows} cubos pequeños. Las líneas gruesas marcan unidades enteras.`)}">${cells}${units}</svg>`;
      const t = st.n[0] * st.n[1] * st.n[2];
      sum.textContent = `${st.n.join(" × ")} = ${t} ${L("small cubes", "cubos pequeños")}`;
    }
    root.append(fig);
    const names = [
      ["Along the length", "A lo largo del largo"],
      ["Along the width", "A lo largo del ancho"],
      ["Along the height", "A lo largo del alto"],
    ];
    names.forEach(([en, es], i) => {
      const sp = ui.stepper({
        en: `${en}: small cubes`,
        es: `${es}: cubos pequeños`,
        L,
        T,
        value: st.n[i],
        min: 1,
        max: 24,
        ro,
        onChange: (v) => {
          st.n[i] = v;
          draw();
          emit();
        },
      });
      root.append(sp.wrap);
    });
    root.append(sum);
    root.append(
      ui.field({
        id: `pc-${spec.seed}-per`,
        en: `Small cubes in one 1-${m.unit} cube`,
        es: `Cubos pequeños en un cubo de 1 ${m.unit}`,
        value: st.per,
        ro,
        T,
        onInput: (v) => {
          st.per = v;
          emit();
        },
      }).wrap,
      ui.field({
        id: `pc-${spec.seed}-vol`,
        en: "Volume of the crate",
        es: "Volumen de la caja",
        value: st.vol,
        ro,
        T,
        unit: `${m.unit}³`,
        onInput: (v) => {
          st.vol = v;
          emit();
        },
      }).wrap,
      k.status,
    );
    ui.checkRow(root, ro, api, () => ui.clone(st), L, T);
    draw();
    if (ro) k.say("Solved.", "Resuelto.");
  }

  A.register("packcrate", {
    title: "Pack the crate",
    titleEs: "Llena la caja",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();

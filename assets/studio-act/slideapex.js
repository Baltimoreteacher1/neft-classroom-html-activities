/**
 * Practice Studio activity: slideapex (lessons 5-1 and 5-2, "Slide the apex").
 *
 * A triangle (or parallelogram) keeps its base on the bottom line while its top corner slides along a line that is always the
 * same height above the base. The student finds the TWO places where the left side is exactly a given length (one to each side
 * of the base's left end), watches the height stay the same, then types the area. The slanted side is not the height: the area
 * does not change as the corner slides, and a product made with the slanted side is a different, wrong number.
 *
 * Modes: tri (area = ½ × base × height, 5-2) and para (area = base × height, 5-1). No live area readout, so the area is the
 * student's to compute. State: { xs: [x1, x2], area: "text" }. Nothing is timed.
 * Contract: docs/specs/practice-studio-v2.md section 5; grade() shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const ui = A.ui;
  const UNITS = ["cm", "in", "ft", "m"];
  // [left side S, height h, sideways reach x]: x² + h² = S², so both spots are whole numbers
  const TRIPLES = [
    [5, 3, 4],
    [5, 4, 3],
    [10, 6, 8],
    [10, 8, 6],
    [13, 5, 12],
    [13, 12, 5],
    [15, 9, 12],
    [15, 12, 9],
    [17, 8, 15],
    [17, 15, 8],
  ];
  const LEVEL_SIDES = [
    [5, 10],
    [5, 10, 13],
    [10, 13, 15],
    [13, 15, 17],
  ];
  const fmt = (/** @type {number} */ n) => String(Math.round(n * 100) / 100);

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode = params.mode === "para" ? "para" : "tri";
    const [S, h, x] = rng.pick(TRIPLES.filter((t) => LEVEL_SIDES[level - 1].includes(t[0])));
    const b = mode === "tri" ? 2 * rng.int(3 + level, 6 + level * 2) : rng.int(5, 8 + level * 2);
    const u = rng.pick(UNITS);
    const area = mode === "tri" ? (b * h) / 2 : b * h;
    const model = { mode, b, h, S, x, unit: u, area };
    const noun = mode === "tri" ? ["triangle", "triángulo"] : ["parallelogram", "paralelogramo"];
    const corner =
      mode === "tri"
        ? ["top corner", "vértice de arriba"]
        : ["top left corner", "vértice de arriba a la izquierda"];
    const side =
      mode === "tri"
        ? ["left side", "lado izquierdo"]
        : ["slanted left side", "lado izquierdo inclinado"];
    const spec = /** @type {any} */ ({ model });
    spec.q = `A ${noun[0]} has a base of ${b} ${u}. Its ${corner[0]} slides along a dashed line that is always ${h} ${u} above the base. Slide it to find the two spots where the ${side[0]} is exactly ${S} ${u} long. Then type the area of the ${noun[0]}.`;
    spec.qEs = `Un ${noun[1]} tiene una base de ${b} ${u}. Su ${corner[1]} se desliza por una línea punteada que siempre está ${h} ${u} sobre la base. Deslízalo para hallar los dos lugares donde el ${side[1]} mide exactamente ${S} ${u}. Luego escribe el área del ${noun[1]}.`;
    const solved = mode === "tri" ? `½ × ${b} × ${h} = ${area}` : `${b} × ${h} = ${area}`;
    spec.x = `The ${side[0]} is ${S} ${u} at the spot ${x} ${u} to the left of the base and at the spot ${x} ${u} to the right. The height stays ${h} ${u} the whole time, so the area does not change: ${solved} ${u}². The slanted side is not the height.`;
    spec.xEs = `El ${side[1]} mide ${S} ${u} en el lugar ${x} ${u} a la izquierda de la base y en el lugar ${x} ${u} a la derecha. La altura se queda en ${h} ${u} todo el tiempo, así que el área no cambia: ${solved} ${u}². El lado inclinado no es la altura.`;
    spec.h = [
      "The dashed line is parallel to the base, so the height never changes. Only the left side changes as you slide.",
      "Watch the left side length as you slide. There is one spot on each side of the left end of the base.",
      "For the area, use the base and the height that makes a right angle with it. The slanted side is not that height.",
    ];
    spec.hEs = [
      "La línea punteada es paralela a la base, así que la altura nunca cambia. Solo cambia el lado izquierdo al deslizar.",
      "Mira la longitud del lado izquierdo mientras deslizas. Hay un lugar a cada lado del extremo izquierdo de la base.",
      "Para el área, usa la base y la altura que forma un ángulo recto con ella. El lado inclinado no es esa altura.",
    ];
    return spec;
  }

  const solution = (/** @type {any} */ spec) => ({
    xs: [-spec.model.x, spec.model.x],
    area: fmt(spec.model.area),
  });
  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    return [
      { xs: [m.x, m.x], area: fmt(m.area) },
      { xs: [-m.x, m.x], area: fmt(m.mode === "tri" ? (m.b * m.S) / 2 : m.b * m.S) },
      { xs: [-m.x, m.x], area: fmt(m.mode === "tri" ? m.b * m.h : (m.b * m.h) / 2) },
      { xs: [m.x + 1, -(m.x + 1)], area: fmt(m.area) },
    ];
  }
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const xs = (st && st.xs) || [];
    const left = xs.includes(-m.x);
    const right = xs.includes(m.x);
    const got = ui.num(st && st.area);
    const areaOk = Math.abs(got - m.area) < 0.005;
    const marks = [left, right, areaOk];
    const n = marks.filter(Boolean).length;
    if (!left || !right) {
      if (left !== right && xs[0] === xs[1])
        return ui.miss(
          "one-spot",
          "You found one spot twice. Slide the corner to the other side of the left end of the base for the second spot.",
          "Hallaste el mismo lugar dos veces. Desliza el vértice al otro lado del extremo izquierdo de la base para el segundo lugar.",
          n,
          3,
          marks,
        );
      return ui.miss(
        "spot-off",
        `Check the ${m.mode === "tri" ? "left side" : "slanted left side"} length at each spot. It must read exactly ${m.S} ${m.unit}.`,
        `Revisa la longitud del lado izquierdo en cada lugar. Debe medir exactamente ${m.S} ${m.unit}.`,
        n,
        3,
        marks,
      );
    }
    if (areaOk) return { ok: true };
    if (!Number.isFinite(got))
      return ui.miss(
        "area-missing",
        "Type the area as a number.",
        "Escribe el área como un número.",
        n,
        3,
        marks,
      );
    const slantArea = m.mode === "tri" ? (m.b * m.S) / 2 : m.b * m.S;
    if (Math.abs(got - slantArea) < 0.005)
      return ui.miss(
        "used-slant-height",
        "That uses the slanted side as the height. The corner slid, but the height never changed. Use the height that makes a right angle with the base.",
        "Eso usa el lado inclinado como altura. El vértice se deslizó, pero la altura nunca cambió. Usa la altura que forma un ángulo recto con la base.",
        n,
        3,
        marks,
      );
    if (m.mode === "tri" && Math.abs(got - m.b * m.h) < 0.005)
      return ui.miss(
        "forgot-half",
        "That skips the half. A triangle is half of the rectangle with the same base and height.",
        "Eso se salta la mitad. Un triángulo es la mitad del rectángulo con la misma base y altura.",
        n,
        3,
        marks,
      );
    if (m.mode === "para" && Math.abs(got - (m.b * m.h) / 2) < 0.005)
      return ui.miss(
        "took-half",
        "Half belongs to triangles. A parallelogram uses the full base × height.",
        "La mitad es para los triángulos. Un paralelogramo usa la base × altura completa.",
        n,
        3,
        marks,
      );
    return ui.miss(
      "area-off",
      "The area uses the base and the height that makes a right angle with it. Check your multiplication.",
      "El área usa la base y la altura que forma un ángulo recto con ella. Revisa tu multiplicación.",
      n,
      3,
      marks,
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.sl-fig .sl-spot1{fill:var(--sa-bt)}
.sl-fig .sl-spot2{fill:var(--sa-sunt)}
.sl-read{font-weight:800;margin:2px 0 0}
.sl-key{display:inline-block;width:14px;height:14px;border:2px solid var(--sa-dk);margin-right:6px;vertical-align:-2px}
`;

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const m = spec.model;
    const k = ui.begin("slideapex", CSS, host, api);
    const { root, ro, L, T } = k;
    const st = /** @type {any} */ ({
      xs: [Math.round(m.b / 2), Math.round(m.b / 2) + 1],
      area: "",
    });
    if (api.restore) Object.assign(st, ui.clone(api.restore));
    const emit = () => api.change?.(ui.clone(st));
    const lo = -(m.x + 3);
    const hi = Math.max(m.b, m.x) + 3;
    // the figure: x runs lo..hi, y runs 0..h, drawn to one scale
    const VW = 520;
    const VH = 230;
    const sc = Math.min((VW - 40) / (hi - lo), (VH - 80) / m.h);
    const X = (/** @type {number} */ x) => 20 + (x - lo) * sc;
    const Y = (/** @type {number} */ y) => VH - 40 - y * sc;
    const svg = A.el("div");
    root.append(svg);
    const reads = [A.el("p", "sl-read", ""), A.el("p", "sl-read", "")];
    reads.forEach((r) => r.setAttribute("aria-live", "polite"));
    function draw() {
      const spots = st.xs.map((/** @type {number} */ x) => ({ x, d: Math.hypot(x, m.h) }));
      const tri = (/** @type {number} */ x, /** @type {string} */ cls) =>
        m.mode === "tri"
          ? `<polygon class="${cls}" points="${X(0)},${Y(0)} ${X(m.b)},${Y(0)} ${X(x)},${Y(m.h)}"/>`
          : `<polygon class="${cls}" points="${X(0)},${Y(0)} ${X(m.b)},${Y(0)} ${X(m.b + x)},${Y(m.h)} ${X(x)},${Y(m.h)}"/>`;
      svg.innerHTML = `<svg class="sa-fig sl-fig" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${L(`A ${m.mode === "tri" ? "triangle" : "parallelogram"} with base ${m.b} ${m.unit}. The top corner is at ${spots[0].x} for spot 1 and ${spots[1].x} for spot 2, always ${m.h} ${m.unit} above the base.`, `Un ${m.mode === "tri" ? "triángulo" : "paralelogramo"} con base ${m.b} ${m.unit}. El vértice de arriba está en ${spots[0].x} para el lugar 1 y en ${spots[1].x} para el lugar 2, siempre ${m.h} ${m.unit} sobre la base.`)}">
        <line class="g-dash" x1="${X(lo)}" y1="${Y(m.h)}" x2="${X(hi)}" y2="${Y(m.h)}"/>
        <line class="g-line" x1="${X(lo)}" y1="${Y(0)}" x2="${X(hi)}" y2="${Y(0)}" stroke-opacity=".35"/>
        ${tri(spots[1].x, "g-fill2")}${tri(spots[0].x, "g-fill")}
        <line class="g-dash" x1="${X(spots[0].x)}" y1="${Y(m.h)}" x2="${X(spots[0].x)}" y2="${Y(0)}"/>
        <text x="${X(spots[0].x) + 6}" y="${(Y(0) + Y(m.h)) / 2 + 5}">${L("height", "altura")} ${m.h}</text>
        <text x="${X(m.b / 2)}" y="${Y(0) + 24}" text-anchor="middle">${L("base", "base")} ${m.b}</text>
        <circle cx="${X(spots[0].x)}" cy="${Y(m.h)}" r="6" fill="var(--sa-b)"/><circle cx="${X(spots[1].x)}" cy="${Y(m.h)}" r="6" fill="var(--sa-sun)" stroke="var(--sa-dk)" stroke-width="2"/>
      </svg>`;
      spots.forEach((s, i) => {
        reads[i].innerHTML =
          `<span class="sl-key" style="background:${i ? "var(--sa-sunt)" : "var(--sa-bt)"}"></span>${T(`Spot ${i + 1}: left side = ${fmt(s.d)} ${m.unit}`, `Lugar ${i + 1}: lado izquierdo = ${fmt(s.d)} ${m.unit}`)}`;
      });
    }
    [0, 1].forEach((i) => {
      const fld = A.el("div", "sa-fld");
      const id = `sl-${spec.seed}-${i}`;
      const label = A.el(
        "label",
        "",
        T(`Spot ${i + 1}: place of the corner`, `Lugar ${i + 1}: posición del vértice`),
        { for: id },
      );
      const range = /** @type {HTMLInputElement} */ (
        A.el("input", "", "", {
          type: "range",
          id,
          min: String(lo),
          max: String(hi),
          step: "1",
          "aria-label": L(
            `Spot ${i + 1}: place of the corner`,
            `Lugar ${i + 1}: posición del vértice`,
          ),
        })
      );
      range.value = String(st.xs[i]);
      range.disabled = ro;
      const out = A.el("output", "", String(st.xs[i]));
      range.addEventListener("input", () => {
        st.xs[i] = Number(range.value);
        out.textContent = range.value;
        draw();
        emit();
      });
      fld.append(label, range, out);
      root.append(fld, reads[i]);
    });
    const area = ui.field({
      id: `sl-${spec.seed}-area`,
      en: "Area",
      es: "Área",
      value: st.area,
      ro,
      T,
      unit: `${m.unit}²`,
      onInput: (v) => {
        st.area = v;
        emit();
      },
    });
    root.append(area.wrap, k.status);
    ui.checkRow(root, ro, api, () => ui.clone(st), L, T);
    draw();
    if (ro) k.say("Solved.", "Resuelto.");
  }

  A.register("slideapex", {
    title: "Slide the corner",
    titleEs: "Desliza el vértice",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();

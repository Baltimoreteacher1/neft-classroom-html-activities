/**
 * Practice Studio activity: netfold (lesson 5-6, the net-fold sorter).
 *
 * A net is six squares joined edge to edge. Does it fold into a cube? The student sorts a few nets into "folds" and "does not
 * fold" and may step through a fold that highlights the squares which land on the same face. At the box levels every square
 * is a rectangle with its two edge lengths printed, and a net folds only when the edges that meet are equal too.
 *
 * Only 11 of the 35 six-square shapes fold into a cube. The truth is never typed: it comes from rolling a cube across the
 * net (the face under the cube at each square), and the box labels come from tracking which box edge runs which way.
 * Modes: cube (levels 1-2) and box (levels 3-4); params.mode forces one. State: { v: [true|false|null, ...] }.
 * Contract: docs/specs/practice-studio-v2.md section 5; grade() shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const ui = A.ui;

  /* ---- pure geometry: hexominoes and a rolling cube -------------------------------------------- */
  const key = (/** @type {number[][]} */ cells) => cells.map((c) => c.join(",")).join(";");
  const normalize = (/** @type {number[][]} */ cells) => {
    const r0 = Math.min(...cells.map((c) => c[0]));
    const c0 = Math.min(...cells.map((c) => c[1]));
    return cells.map((c) => [c[0] - r0, c[1] - c0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };
  /** The 8 turns and flips of a shape, each normalized. */
  const symmetries = (/** @type {number[][]} */ cells) => {
    const out = [];
    let cur = cells;
    for (let flip = 0; flip < 2; flip++) {
      for (let k = 0; k < 4; k++) {
        out.push(normalize(cur));
        cur = cur.map(([r, c]) => [c, -r]);
      }
      cur = cur.map(([r, c]) => [r, -c]);
    }
    return out;
  };
  const canonical = (/** @type {number[][]} */ cells) => symmetries(cells).map(key).sort()[0];
  /** @type {number[][][]|null} */ let HEX = null;
  /** The 35 free hexominoes, in a fixed order. */
  function hexominoes() {
    if (HEX) return HEX;
    let level = new Map([[canonical([[0, 0]]), [[0, 0]]]]);
    for (let n = 1; n < 6; n++) {
      const next = new Map();
      for (const cells of level.values()) {
        const have = new Set(cells.map((c) => c.join(",")));
        for (const [r, c] of cells)
          for (const [dr, dc] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const cell = [r + dr, c + dc];
            if (have.has(cell.join(","))) continue;
            const grown = normalize([...cells, cell]);
            const id = canonical(grown);
            if (!next.has(id)) next.set(id, grown);
          }
      }
      level = next;
    }
    HEX = [...level.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map((e) => e[1]);
    return HEX;
  }

  /**
   * Roll a cube across the net, starting on its first square (in reading order). The cube is [top, bottom, north, south, east,
   * west] as face ids; `axes` says which body axis (0, 1, 2) currently runs east-west, north-south and up-down. Returns for
   * each square in visiting order: its cell, the face that lands on it, and the body axes under its width and its height.
   */
  function roll(/** @type {number[][]} */ cells) {
    const have = new Map(cells.map((c) => [c.join(","), c]));
    const start = cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
    const out = [];
    const seen = new Set([start.join(",")]);
    const queue = [{ cell: start, cube: [4, 5, 2, 3, 0, 1], axes: [0, 1, 2], from: -1 }];
    while (queue.length) {
      const cur = /** @type {any} */ (queue.shift());
      const [top, bottom, north, south, east, west] = cur.cube;
      out.push({
        cell: cur.cell,
        face: bottom,
        wAxis: cur.axes[0],
        hAxis: cur.axes[1],
        from: cur.from,
      });
      const idx = out.length - 1;
      const [ae, an, au] = cur.axes;
      // tip over the east edge: east becomes the floor, top becomes east, west becomes top, bottom becomes west
      const rolls = [
        { d: [0, 1], cube: [west, east, north, south, top, bottom], axes: [au, an, ae] },
        { d: [0, -1], cube: [east, west, north, south, bottom, top], axes: [au, an, ae] },
        { d: [-1, 0], cube: [south, north, top, bottom, east, west], axes: [ae, au, an] },
        { d: [1, 0], cube: [north, south, bottom, top, east, west], axes: [ae, au, an] },
      ];
      for (const r of rolls) {
        const next = [cur.cell[0] + r.d[0], cur.cell[1] + r.d[1]];
        const id = next.join(",");
        if (!have.has(id) || seen.has(id)) continue;
        seen.add(id);
        queue.push({
          cell: /** @type {number[]} */ (have.get(id)),
          cube: r.cube,
          axes: r.axes,
          from: idx,
        });
      }
    }
    return out;
  }
  /** True when the six squares land on six different faces. */
  const foldsAsCube = (/** @type {number[][]} */ cells) =>
    new Set(roll(cells).map((s) => s.face)).size === 6;
  /** The label each square must carry on a box with edges dims = [length, width, height]: "w × h" of that rectangle. */
  const boxLabels = (/** @type {number[][]} */ cells, /** @type {number[]} */ dims) =>
    roll(cells).map((s) => ({ cell: s.cell, w: dims[s.wAxis], h: dims[s.hAxis] }));
  /** Edges that meet must be equal: side by side squares share a height, stacked squares share a width. */
  function edgesMatch(/** @type {{cell: number[], w: number, h: number}[]} */ labels) {
    const at = new Map(labels.map((l) => [l.cell.join(","), l]));
    for (const l of labels) {
      const right = at.get(`${l.cell[0]},${l.cell[1] + 1}`);
      const below = at.get(`${l.cell[0] + 1},${l.cell[1]}`);
      if (right && right.h !== l.h) return false;
      if (below && below.w !== l.w) return false;
    }
    return true;
  }
  /** Does this net fold? cube: six different faces. box: that, and every printed edge pair meets and matches the box. */
  function folds(/** @type {any} */ net, /** @type {string} */ mode) {
    if (!foldsAsCube(net.cells)) return false;
    if (mode !== "box") return true;
    const shown = new Map(net.labels.map((/** @type {any} */ l) => [l.cell.join(","), l]));
    const want = boxLabels(net.cells, net.dims);
    return (
      edgesMatch(net.labels) &&
      want.every((w) => {
        const s = /** @type {any} */ (shown.get(w.cell.join(",")));
        return s && s.w === w.w && s.h === w.h;
      })
    );
  }

  /* ---- the item ---------------------------------------------------------------------------------- */
  const LEVEL_NETS = [3, 4, 3, 4];

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode = params.mode || (level <= 2 ? "cube" : "box");
    const all = hexominoes();
    const good = all.filter(foldsAsCube);
    const bad = all.filter((c) => !foldsAsCube(c));
    const count = LEVEL_NETS[level - 1];
    const wantFold = rng.shuffle(
      Array.from({ length: count }, (_, i) => (i === 0 ? true : i === 1 ? false : rng.chance(0.5))),
    );
    const dims = rng.shuffle(rng.distinct(3, 2, 9));
    const unit = rng.pick(["cm", "in", "ft"]);
    const nets = /** @type {any[]} */ ([]);
    const used = new Set();
    for (const f of wantFold) {
      let cells;
      for (let tries = 0; tries < 50; tries++) {
        cells = rng.pick(f ? good : bad);
        if (!used.has(key(cells))) break;
      }
      used.add(key(cells));
      // a random turn or flip, so the same shape never looks the same twice
      const shape = symmetries(cells)[rng.int(0, 7)];
      const net = /** @type {any} */ ({ cells: shape });
      if (mode === "box") {
        net.dims = dims;
        net.labels = boxLabels(shape, dims);
        if (!f) {
          // a net whose squares fold, but whose printed edges do not meet: change one number next to a neighbour
          const at = new Map(net.labels.map((/** @type {any} */ l) => [l.cell.join(","), l]));
          const spots = net.labels.filter(
            (/** @type {any} */ l) =>
              at.has(`${l.cell[0]},${l.cell[1] + 1}`) || at.has(`${l.cell[0] + 1},${l.cell[1]}`),
          );
          const l = rng.pick(spots);
          const sideBySide = at.has(`${l.cell[0]},${l.cell[1] + 1}`);
          const other = rng.pick(dims.filter((d) => d !== (sideBySide ? l.h : l.w)));
          if (sideBySide) l.h = other;
          else l.w = other;
          net.cells = shape;
        }
      }
      nets.push(net);
    }
    const model = { mode, unit, dims, nets };
    const spec = /** @type {any} */ ({ model });
    if (mode === "cube") {
      spec.q =
        "Each picture is a net of six squares. Which nets fold up into a cube? Use Fold it to see where each square lands, then choose for every net.";
      spec.qEs =
        "Cada dibujo es una red de seis cuadrados. ¿Qué redes se doblan para formar un cubo? Usa Doblar para ver dónde cae cada cuadrado y luego elige para cada red.";
      spec.x =
        "A net folds into a cube only when its six squares land on six different faces. When two squares land on the same face, the net does not fold. Only 11 of the 35 shapes made of six squares fold into a cube.";
      spec.xEs =
        "Una red se dobla para formar un cubo solo cuando sus seis cuadrados caen en seis caras distintas. Cuando dos cuadrados caen en la misma cara, la red no se dobla. Solo 11 de las 35 figuras hechas con seis cuadrados forman un cubo.";
    } else {
      spec.q = `Each picture is a net for a box that is ${dims[0]} ${unit} by ${dims[1]} ${unit} by ${dims[2]} ${unit}. Each rectangle shows its width × its height. Which nets fold into that box? The squares must land on six different faces, and the edges that meet must be the same length.`;
      spec.qEs = `Cada dibujo es una red de una caja de ${dims[0]} ${unit} por ${dims[1]} ${unit} por ${dims[2]} ${unit}. Cada rectángulo muestra su ancho × su alto. ¿Qué redes se doblan para formar esa caja? Los cuadrados deben caer en seis caras distintas y las aristas que se juntan deben medir lo mismo.`;
      spec.x =
        "A net folds into the box only when two things are true: its six faces land on six different faces of the solid, and every edge that meets another edge is the same length. If a rectangle's edge is longer or shorter than the edge it joins, the net will not close.";
      spec.xEs =
        "Una red se dobla para formar la caja solo cuando se cumplen dos cosas: sus seis caras caen en seis caras distintas del sólido y toda arista que se junta con otra mide lo mismo. Si la arista de un rectángulo es más larga o más corta que la arista con la que se une, la red no cierra.";
    }
    spec.h = [
      "Imagine rolling a cube across the net, one square at a time. The square under the cube is the face that lands there.",
      "Use the fold steps. If two squares land on the same face, the net cannot fold. Opposite faces never touch in a net.",
      mode === "cube"
        ? "A net with a row of four squares and one square above and one below can fold. Try the fold steps to check each net."
        : "First check the squares as if they were a cube. Then look at every place two rectangles touch: the touching edges must be equal.",
    ];
    spec.hEs = [
      "Imagina que ruedas un cubo sobre la red, un cuadrado a la vez. El cuadrado que queda debajo del cubo es la cara que cae ahí.",
      "Usa los pasos de doblar. Si dos cuadrados caen en la misma cara, la red no se puede doblar. Las caras opuestas nunca se tocan en una red.",
      mode === "cube"
        ? "Una red con una fila de cuatro cuadrados y uno arriba y uno abajo se puede doblar. Prueba los pasos de doblar para revisar cada red."
        : "Primero revisa los cuadrados como si fueran un cubo. Luego mira cada lugar donde se tocan dos rectángulos: las aristas que se tocan deben ser iguales.",
    ];
    return spec;
  }

  const solution = (/** @type {any} */ spec) => ({
    v: spec.model.nets.map((/** @type {any} */ n) => folds(n, spec.model.mode)),
  });
  function wrong(/** @type {any} */ spec) {
    const right = solution(spec).v;
    const out = right.map((_, i) => ({ v: right.map((x, j) => (j === i ? !x : x)) }));
    out.push({ v: right.map((x) => !x) });
    return out;
  }
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const want = solution(spec).v;
    const got = (st && st.v) || [];
    const marks = want.map((w, i) => got[i] === w);
    const right = marks.filter(Boolean).length;
    if (right === want.length) return { ok: true };
    if (want.some((_, i) => got[i] !== true && got[i] !== false))
      return ui.miss(
        "incomplete",
        'Choose "folds" or "does not fold" for every net.',
        'Elige "se dobla" o "no se dobla" para cada red.',
        right,
        want.length,
        marks,
      );
    const saidFoldsWrong = want.some((w, i) => !w && got[i] === true);
    if (saidFoldsWrong)
      return ui.miss(
        "two-on-one-face",
        spec.model.mode === "box"
          ? "A net you chose to fold does not close. Two squares land on the same face, or two touching edges are not the same length."
          : "A net you chose to fold has two squares that land on the same face. Use the fold steps on each net and watch the faces.",
        spec.model.mode === "box"
          ? "Una red que elegiste como plegable no cierra. Dos cuadrados caen en la misma cara, o dos aristas que se tocan no miden lo mismo."
          : "Una red que elegiste como plegable tiene dos cuadrados que caen en la misma cara. Usa los pasos de doblar en cada red y mira las caras.",
        right,
        want.length,
        marks,
      );
    return ui.miss(
      "missed-net",
      spec.model.mode === "box"
        ? "A net you said does not fold actually closes. Check the faces and the edges one more time."
        : "A net you said does not fold actually covers all six faces once. Use the fold steps to check each net.",
      spec.model.mode === "box"
        ? "Una red que dijiste que no se dobla sí cierra. Revisa otra vez las caras y las aristas."
        : "Una red que dijiste que no se dobla sí cubre las seis caras una vez. Usa los pasos de doblar para revisar cada red.",
      right,
      want.length,
      marks,
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.nf-net{padding:10px;border:2px solid var(--sa-bd);border-radius:var(--sa-r);background:var(--sa-s);margin:8px 0}
.nf-net .sa-fig{max-width:320px;margin:4px auto}
.nf-cell{fill:var(--sa-bt);stroke:var(--sa-dk);stroke-width:2}
.nf-cell.nf-on{fill:var(--sa-sunt)}
.nf-cell.nf-dup{fill:#F7C9C4;stroke:var(--sa-bad);stroke-width:4}
@media (forced-colors:active){.nf-cell{stroke:CanvasText}.nf-cell.nf-dup{stroke:Highlight;stroke-width:5}}
.nf-pick{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}
.nf-step{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-weight:700}
.nf-step input[type=range]{flex:1 1 160px;min-height:44px;accent-color:var(--sa-b)}
`;
  const FACE = ["right", "left", "back", "front", "top", "bottom"];
  const FACE_ES = ["derecha", "izquierda", "atrás", "frente", "arriba", "abajo"];

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const m = spec.model;
    const k = ui.begin("netfold", CSS, host, api);
    const { root, ro, L, T } = k;
    const st = /** @type {any} */ ({ v: m.nets.map(() => null) });
    if (api.restore) Object.assign(st, ui.clone(api.restore));
    const emit = () => api.change?.(ui.clone(st));
    const box = m.mode === "box";
    const S = box ? 56 : 38;
    m.nets.forEach((net, ni) => {
      const order = roll(net.cells);
      const card = A.el("div", "nf-net");
      card.append(A.el("h4", "", T(`Net ${ni + 1}`, `Red ${ni + 1}`)));
      const rows = Math.max(...net.cells.map((/** @type {number[]} */ c) => c[0])) + 1;
      const cols = Math.max(...net.cells.map((/** @type {number[]} */ c) => c[1])) + 1;
      const fig = A.el("div");
      const live = A.el("p", "sa-status");
      live.setAttribute("aria-live", "polite");
      let step = 6;
      const dupOf = (/** @type {number} */ i) =>
        order.slice(0, i).findIndex((o) => o.face === order[i].face);
      function draw() {
        let cells = "";
        order.forEach((o, i) => {
          const label = box
            ? net.labels.find((/** @type {any} */ l) => l.cell.join(",") === o.cell.join(","))
            : null;
          const shown = i < step;
          const dup = shown && dupOf(i) >= 0;
          const x = 10 + o.cell[1] * S;
          const y = 10 + o.cell[0] * S;
          cells += `<rect class="nf-cell${shown ? " nf-on" : ""}${dup ? " nf-dup" : ""}" x="${x}" y="${y}" width="${S}" height="${S}"/>`;
          if (box)
            cells += `<text x="${x + S / 2}" y="${y + S / 2 - 4}" text-anchor="middle">${label.w} × ${label.h}</text>`;
          cells += `<text x="${x + S / 2}" y="${y + S / 2 + (box ? 14 : 5)}" text-anchor="middle">${i + 1}${shown ? ` ${L(FACE[o.face], FACE_ES[o.face])}` : ""}</text>`;
        });
        fig.innerHTML = `<svg class="sa-fig" viewBox="0 0 ${cols * S + 20} ${rows * S + 20}" role="img" aria-label="${L(`Net ${ni + 1}: six ${box ? "rectangles" : "squares"} joined edge to edge`, `Red ${ni + 1}: seis ${box ? "rectángulos" : "cuadrados"} unidos por las aristas`)}">${cells}</svg>`;
        const dups = order.map((_, i) => i).filter((i) => i < step && dupOf(i) >= 0);
        live.textContent = dups.length
          ? L(
              `Square ${dups[0] + 1} lands on the same face as square ${dupOf(dups[0]) + 1}.`,
              `El cuadrado ${dups[0] + 1} cae en la misma cara que el cuadrado ${dupOf(dups[0]) + 1}.`,
            )
          : step === 0
            ? L("Nothing is folded yet.", "Todavía no hay nada doblado.")
            : L(
                `${step} square${step === 1 ? "" : "s"} folded, all on different faces.`,
                `${step} cuadrado${step === 1 ? "" : "s"} doblado${step === 1 ? "" : "s"}, todos en caras distintas.`,
              );
      }
      const slider = A.el("div", "nf-step");
      const sid = `nf-${spec.seed}-${ni}`;
      const range = /** @type {HTMLInputElement} */ (
        A.el("input", "", "", {
          type: "range",
          id: sid,
          min: "0",
          max: "6",
          step: "1",
          value: "6",
          "aria-label": L(
            `Fold it: net ${ni + 1}, how many squares are folded`,
            `Doblar: red ${ni + 1}, cuántos cuadrados están doblados`,
          ),
        })
      );
      range.addEventListener("input", () => {
        step = Number(range.value);
        draw();
      });
      slider.append(A.el("label", "", T("Fold it", "Doblar"), { for: sid }), range);
      const pick = A.el("div", "nf-pick", "", {
        role: "group",
        "aria-label": L(`Net ${ni + 1}`, `Red ${ni + 1}`),
      });
      const btns = /** @type {HTMLButtonElement[]} */ ([]);
      [
        [true, "Folds", "Se dobla"],
        [false, "Does not fold", "No se dobla"],
      ].forEach(([val, en, es]) => {
        const b = /** @type {HTMLButtonElement} */ (
          A.el("button", "sa-btn", T(/** @type {string} */ (en), /** @type {string} */ (es)), {
            type: "button",
            "aria-pressed": "false",
            "aria-label": L(`Net ${ni + 1}: ${en}`, `Red ${ni + 1}: ${es}`),
          })
        );
        b.disabled = ro;
        b.addEventListener("click", () => {
          st.v[ni] = val;
          paint();
          emit();
        });
        btns.push(b);
        pick.append(b);
      });
      function paint() {
        btns[0].setAttribute("aria-pressed", String(st.v[ni] === true));
        btns[1].setAttribute("aria-pressed", String(st.v[ni] === false));
      }
      card.append(fig, slider, live, pick);
      root.append(card);
      draw();
      paint();
    });
    root.append(k.status);
    ui.checkRow(root, ro, api, () => ui.clone(st), L, T);
    if (ro) k.say("Solved.", "Resuelto.");
  }

  A.register("netfold", {
    title: "Fold the net",
    titleEs: "Dobla la red",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
  A.netfold = { hexominoes, foldsAsCube, roll, boxLabels, edgesMatch, folds };
})();

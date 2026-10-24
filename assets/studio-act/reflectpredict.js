/**
 * Practice Studio activity: reflectpredict (window.StudioAct kind "reflectpredict"), lesson 7-9.
 * Predict first. The student places the mirror image of point P. Only then do the distance-to-axis bars appear (after a
 * miss, for P and for the student's point; after a solve, for P and its image), and only a solved item shows the
 * sign-change table, so the table confirms a prediction and is never a rule to look up.
 * State: { pt: [x, y] | null }.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.u7 = A.u7 || {});
  const n = (/** @type {number} */ v) => K.n(v);
  const pt = (/** @type {number[]} */ p) => `(${n(p[0])}, ${n(p[1])})`;
  const eq = (/** @type {any} */ a, /** @type {any} */ b) =>
    !!a && !!b && a[0] === b[0] && a[1] === b[1];
  const flip = (/** @type {number[]} */ p, /** @type {string} */ ax) =>
    ax === "x" ? [p[0], -p[1]] : [-p[0], p[1]];
  const AX = { x: ["x-axis", "eje x"], y: ["y-axis", "eje y"] };

  const CSS = `
.rp-table{border-collapse:collapse;width:100%;max-width:440px;font-size:.95rem}
.rp-table caption{text-align:left;font-weight:800;color:var(--brand,#2C4A68);padding-bottom:4px}
.rp-table th,.rp-table td{border:2px solid var(--border,#D5DCE5);padding:6px 10px;text-align:left}
.rp-table th{background:var(--brand-tint,#E5ECF3)}
.rp-dist{margin:0;padding-left:1.2em}
.rp-dist li{margin:2px 0}
`;

  function mkReflect(/** @type {any} */ rng, /** @type {number} */ lv) {
    const m = [5, 7, 8, 8][lv - 1];
    let x = 0;
    let y = 0;
    while (!x || !y || Math.abs(x) === Math.abs(y)) {
      x = rng.int(lv === 3 ? 1 : 2, m) * rng.pick([-1, 1]);
      y = rng.int(lv === 3 ? 1 : 2, m) * rng.pick([-1, 1]);
    }
    const p = [x, y];
    const axes = lv === 4 ? ["x", "y"] : [rng.pick(["x", "y"])];
    let want = p;
    for (const a of axes) want = flip(want, a);
    const thing = rng.pick([
      ["A drone", "Un dron"],
      ["A laser hole", "Un agujero del láser"],
      ["A game token", "Una ficha de juego"],
      ["A lighthouse", "Un faro"],
      ["A robot", "Un robot"],
    ]);
    const one = axes.length === 1;
    const pack = K.pack({
      q: one
        ? `${thing[0]} is at point P ${pt(p)}. The ${AX[axes[0]][0]} is a mirror. Predict where the mirror image P′ lands, then place it. ¦ ${thing[1]} está en el punto P ${pt(p)}. El ${AX[axes[0]][1]} es un espejo. Predice dónde cae la imagen P′ en el espejo y ponla.`
        : `${thing[0]} is at point P ${pt(p)}. Reflect P across the x-axis. Then reflect that image across the y-axis. Predict where the final image lands, then place it. ¦ ${thing[1]} está en el punto P ${pt(p)}. Refleja P sobre el eje x. Luego refleja esa imagen sobre el eje y. Predice dónde cae la imagen final y ponla.`,
      x: one
        ? `P and its image are the same distance from the ${AX[axes[0]][0]}, on opposite sides. Only the ${axes[0] === "x" ? "y" : "x"}-coordinate changes sign: ${pt(p)} becomes ${pt(want)}. ¦ P y su imagen están a la misma distancia del ${AX[axes[0]][1]}, en lados opuestos. Solo cambia de signo la coordenada ${axes[0] === "x" ? "y" : "x"}: ${pt(p)} pasa a ${pt(want)}.`
        : `The first reflection changes the sign of y and the second changes the sign of x, so both signs change: ${pt(p)} becomes ${pt(want)}. ¦ La primera reflexión cambia el signo de y y la segunda cambia el signo de x, así que cambian los dos signos: ${pt(p)} pasa a ${pt(want)}.`,
      h: [
        "A mirror image is the same distance from the mirror as the original, on the other side. ¦ Una imagen en el espejo está a la misma distancia del espejo que el original, del otro lado.",
        one
          ? "Count how far P is from the mirror axis. Go that far on the other side. ¦ Cuenta qué tan lejos del eje espejo está P. Avanza igual de lejos del otro lado."
          : "Do one reflection at a time. Place the first image in your head, then reflect it. ¦ Haz una reflexión a la vez. Imagina la primera imagen y luego refléjala.",
        "Only the distance across the mirror changes. The distance along the mirror stays the same. ¦ Solo cambia la distancia a través del espejo. La distancia a lo largo del espejo se queda igual.",
      ],
    });
    return { ...pack, r: m + 1, p, axes, want, model: { p, axes } };
  }

  function gradeReflect(/** @type {any} */ spec, /** @type {any} */ state) {
    const v =
      state && Array.isArray(state.pt) && state.pt.length === 2 && state.pt.every(Number.isInteger)
        ? state.pt
        : null;
    if (!v)
      return K.miss(
        "no-point",
        "Tap the grid to place your prediction. ¦ Toca la cuadrícula para poner tu predicción.",
      );
    if (eq(v, spec.want)) return { ok: true };
    const p = spec.p;
    if (eq(v, p))
      return K.miss(
        "coord-quadrant-mixup",
        "That is the original point. A reflection moves the point to the other side of the mirror. ¦ Ese es el punto original. Una reflexión pasa el punto al otro lado del espejo.",
      );
    if (eq(v, [p[1], p[0]]) || eq(v, [-p[1], -p[0]]))
      return K.miss(
        "coord-xy-swapped",
        "Swapping x and y is a different move. A reflection keeps each coordinate in its own place. ¦ Intercambiar x y y es otro movimiento. Una reflexión deja cada coordenada en su lugar.",
      );
    if (spec.axes.length === 1) {
      const other = spec.axes[0] === "x" ? "y" : "x";
      if (eq(v, [-p[0], -p[1]]))
        return K.miss(
          "u7-reflect-both-flipped",
          "You changed both signs. Reflecting across one axis changes only one coordinate. ¦ Cambiaste los dos signos. Reflejar sobre un eje cambia solo una coordenada.",
        );
      if (eq(v, flip(p, other)))
        return K.miss(
          "coord-quadrant-mixup",
          `That is the reflection across the ${AX[other][0]}. Check which axis is the mirror. ¦ Esa es la reflexión sobre el ${AX[other][1]}. Revisa cuál eje es el espejo.`,
        );
    } else {
      if (eq(v, flip(p, "x")) || eq(v, flip(p, "y")))
        return K.miss(
          "multi-step-stopped-early",
          "That is the image after only one reflection. The question asks for two. ¦ Esa es la imagen después de una sola reflexión. La pregunta pide dos.",
        );
    }
    return K.miss(
      "absolute-value-misread",
      "The image should be the same distance from the mirror as P, on the other side. Compare the two distances. ¦ La imagen debe estar a la misma distancia del espejo que P, del otro lado. Compara las dos distancias.",
    );
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("reflectpredict", CSS);
    const c = K.start(host, spec, api, "reflectpredict");
    const { L, T } = c;
    /** @type {number[] | null} */
    let mine = c.saved && c.saved.pt ? c.saved.pt.slice() : null;
    if (c.solved) mine = spec.want.slice();
    const g = K.grid(c, {
      r: spec.r,
      onTap(x, y) {
        mine = [x, y];
        c.verdict = null;
        c.emit({ pt: mine });
        c.say(`Prediction placed at ${pt(mine)}`, `Predicción puesta en ${pt(mine)}`);
        sync();
      },
    });
    const dist = A.el("ul", "rp-dist");
    const tableBox = A.el("div");
    const axLen = (/** @type {number[]} */ q, /** @type {string} */ a) =>
      Math.abs(a === "x" ? q[1] : q[0]);
    function sync() {
      const showBars = c.solved || !!c.verdict;
      /** @type {any[]} */
      const segs = [];
      const bar = (/** @type {number[]} */ q, /** @type {string} */ a, /** @type {string} */ cls) =>
        segs.push(
          a === "x"
            ? { x1: q[0], y1: q[1], x2: q[0], y2: 0, cls: `bar ${cls}` }
            : { x1: q[0], y1: q[1], x2: 0, y2: q[1], cls: `bar ${cls}` },
        );
      if (showBars)
        for (const a of spec.axes) {
          bar(spec.p, a, c.solved ? "ok" : "");
          if (mine) bar(mine, a, c.solved ? "ok" : "");
        }
      const mk = c.marks();
      g.draw({
        segs,
        points: [
          { x: spec.p[0], y: spec.p[1], l: "P", cls: "given" },
          ...(mine
            ? [
                {
                  x: mine[0],
                  y: mine[1],
                  l: "P′",
                  cls: c.solved ? "ok" : mk ? (mk[0] ? "ok" : "bad") : "",
                },
              ]
            : []),
        ],
      });
      dist.textContent = "";
      if (showBars && mine)
        for (const a of spec.axes) {
          const name = L(AX[a][0], AX[a][1]);
          dist.append(
            A.el(
              "li",
              "",
              L(
                `P is ${axLen(spec.p, a)} units from the ${name}. ${c.solved ? "P′ is" : "Your point is"} ${axLen(mine, a)} units from the ${name}.`,
                `P está a ${axLen(spec.p, a)} unidades del ${name}. ${c.solved ? "P′ está" : "Tu punto está"} a ${axLen(mine, a)} unidades del ${name}.`,
              ),
            ),
          );
        }
      c.checkBtn.disabled = !mine;
    }
    function table() {
      const t = A.el("table", "rp-table");
      const cap = A.el("caption", "", T("What changed from P to P′", "Qué cambió de P a P′"));
      const head = A.el(
        "tr",
        "",
        `<th scope="col">${T("Coordinate", "Coordenada")}</th><th scope="col">P</th><th scope="col">P′</th><th scope="col">${T("Sign", "Signo")}</th>`,
      );
      t.append(cap, head);
      [0, 1].forEach((i) => {
        const changed = spec.p[i] !== spec.want[i];
        t.append(
          A.el(
            "tr",
            "",
            `<th scope="row">${i ? "y" : "x"}</th><td>${n(spec.p[i])}</td><td>${n(spec.want[i])}</td><td>${changed ? T("changed", "cambió") : T("same", "igual")}</td>`,
          ),
        );
      });
      return t;
    }
    c.body.append(g.el, ...(c.solved ? [] : [g.pad, g.live]), dist, tableBox);
    if (c.solved) tableBox.append(table());
    c.redraws.push(sync);
    c.wire(
      () => ({ pt: mine }),
      () => {
        mine = null;
        c.emit({ pt: null });
      },
    );
    sync();
  }

  A.register("reflectpredict", {
    title: "Predict the reflection",
    titleEs: "Predice la reflexión",
    levels: 4,
    make: mkReflect,
    solution: (spec) => ({ pt: spec.want.slice() }),
    wrong(spec) {
      const p = spec.p;
      const out = [{ pt: p.slice() }, { pt: [p[1], p[0]] }, { pt: [-p[0], -p[1]] }, { pt: null }];
      if (spec.axes.length === 1) out.push({ pt: flip(p, spec.axes[0] === "x" ? "y" : "x") });
      else out.push({ pt: flip(p, "x") });
      return out.filter((s) => !eq(s.pt, spec.want));
    },
    grade: gradeReflect,
    mount,
  });
})();

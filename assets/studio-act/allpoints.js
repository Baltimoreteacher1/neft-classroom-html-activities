/**
 * Practice Studio activity: allpoints (window.StudioAct kind "allpoints"), lesson 7-8.
 * "5 units from the x-axis and 3 units from the y-axis": the student marks EVERY point that fits, one in each quadrant.
 * A one-point answer is told that each quadrant holds one. State: { pts: [[x, y], ...] }.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.u7 = A.u7 || {});
  const n = (/** @type {number} */ v) => K.n(v);
  const pt = (/** @type {number[]} */ p) => `(${n(p[0])}, ${n(p[1])})`;
  const eq = (/** @type {number[]} */ a, /** @type {number[]} */ b) =>
    a[0] === b[0] && a[1] === b[1];
  const has = (/** @type {number[][]} */ l, /** @type {number[]} */ p) => l.some((q) => eq(q, p));

  function mkAll(/** @type {any} */ rng, /** @type {number} */ lv) {
    const m = [5, 6, 7, 8][lv - 1];
    let dx = 0;
    let dy = 0;
    while (!dx || !dy || dx === dy) {
      dx = rng.int(1, m);
      dy = rng.int(1, m);
    }
    // L4 adds a side condition, so only two points fit
    const side = lv === 4 ? rng.pick(["left", "right", "above", "below"]) : "";
    let want = [
      [dx, dy],
      [-dx, dy],
      [-dx, -dy],
      [dx, -dy],
    ];
    if (side === "left") want = want.filter((p) => p[0] < 0);
    if (side === "right") want = want.filter((p) => p[0] > 0);
    if (side === "above") want = want.filter((p) => p[1] > 0);
    if (side === "below") want = want.filter((p) => p[1] < 0);
    const sideEn = {
      left: "left of the y-axis",
      right: "right of the y-axis",
      above: "above the x-axis",
      below: "below the x-axis",
      "": "",
    }[side];
    const sideEs = {
      left: "a la izquierda del eje y",
      right: "a la derecha del eje y",
      above: "arriba del eje x",
      below: "debajo del eje x",
      "": "",
    }[side];
    const who = rng.pick([
      ["A point", "Un punto", "The point", "El punto"],
      ["A drone", "Un dron", "The drone", "El dron"],
      ["A robot", "Un robot", "The robot", "El robot"],
      ["A game token", "Una ficha de juego", "The token", "La ficha"],
      ["A sensor", "Un sensor", "The sensor", "El sensor"],
      ["A treasure chest", "Un cofre del tesoro", "The chest", "El cofre"],
    ]);
    const stem =
      lv === 3
        ? [
            `${who[0]} has |x| = ${dx} and |y| = ${dy}.`,
            `${who[1]} tiene |x| = ${dx} y |y| = ${dy}.`,
          ]
        : [
            `${who[0]} is ${dy} units from the x-axis and ${dx} units from the y-axis.`,
            `${who[1]} está a ${dy} unidades del eje x y a ${dx} unidades del eje y.`,
          ];
    const all = want.length;
    const pack = K.pack({
      q: `${stem[0]}${side ? ` ${who[2]} is ${sideEn}.` : ""} Mark every point that fits. ¦ ${stem[1]}${side ? ` ${who[3]} está ${sideEs}.` : ""} Marca todos los puntos que cumplen.`,
      x: `A distance from an axis has no sign, so each distance fits two sides.${side ? ` The side condition keeps ${all} points.` : " That gives one point in each quadrant."} The points are ${want.map(pt).join(", ")}. ¦ Una distancia a un eje no tiene signo, así que cada distancia cabe en dos lados.${side ? ` La condición de lado deja ${all} puntos.` : " Eso da un punto en cada cuadrante."} Los puntos son ${want.map(pt).join(", ")}.`,
      h: [
        "The distance from the y-axis is the x-coordinate without its sign. ¦ La distancia al eje y es la coordenada x sin su signo.",
        "The distance from the x-axis is the y-coordinate without its sign. ¦ La distancia al eje x es la coordenada y sin su signo.",
        "Each distance can be on either side of its axis. Try every side. ¦ Cada distancia puede estar de cualquier lado de su eje. Prueba todos los lados.",
      ],
    });
    return {
      ...pack,
      r: m + 1,
      want,
      dx,
      dy,
      side,
      cap: Math.min(6, all + 2),
      model: { dx, dy, side },
    };
  }

  function gradeAll(/** @type {any} */ spec, /** @type {any} */ state) {
    /** @type {number[][]} */
    const pts = [];
    for (const p of (state && state.pts) || [])
      if (Array.isArray(p) && p.length === 2 && p.every(Number.isInteger) && !has(pts, p))
        pts.push(p);
    const want = spec.want;
    const marks = pts.map((p) => has(want, p));
    const right = marks.filter(Boolean).length;
    const parts = { right, of: want.length, marks };
    if (!pts.length)
      return K.miss(
        "no-point",
        "Tap the grid to mark a point. ¦ Toca la cuadrícula para marcar un punto.",
        parts,
      );
    if (right === want.length && pts.length === want.length) return { ok: true, ...parts };
    if (pts.length === 1 && right === 1)
      return K.miss(
        "coord-quadrant-mixup",
        spec.side
          ? "That point fits, but it is not the only one. Read the side condition again and look for the others. ¦ Ese punto cumple, pero no es el único. Lee otra vez la condición de lado y busca los demás."
          : "That point fits, but it is not the only one. Each quadrant holds one. ¦ Ese punto cumple, pero no es el único. Cada cuadrante tiene uno.",
        parts,
      );
    const swapped = pts.filter(
      (p) =>
        has(
          spec.want.map((/** @type {number[]} */ w) => [w[1], w[0]]),
          p,
        ) && !has(want, p),
    );
    if (swapped.length)
      return K.miss(
        "coord-xy-swapped",
        "Some points use the distances the other way around. The distance from the x-axis is the y-coordinate. The distance from the y-axis is the x-coordinate. ¦ Algunos puntos usan las distancias al revés. La distancia al eje x es la coordenada y. La distancia al eje y es la coordenada x.",
        parts,
      );
    if (pts.length > want.length || right < pts.length)
      return K.miss(
        "absolute-value-misread",
        "Some of your points are not those distances from the axes. Check each point against both distances. ¦ Algunos de tus puntos no están a esas distancias de los ejes. Revisa cada punto con las dos distancias.",
        parts,
      );
    return K.miss(
      "coord-quadrant-mixup",
      `${right} of your points fit, and more points fit. Check each quadrant: which ones have you not marked? ¦ ${right} de tus puntos cumplen, y caben más puntos. Revisa cada cuadrante: ¿cuáles no has marcado?`,
      parts,
    );
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const c = K.start(host, spec, api, "allpoints");
    const { L, T } = c;
    /** @type {number[][]} */
    let pts =
      c.saved && c.saved.pts ? c.saved.pts.map((/** @type {number[]} */ p) => p.slice()) : [];
    const g = K.grid(c, {
      r: spec.r,
      onTap(x, y) {
        const i = pts.findIndex((p) => eq(p, [x, y]));
        c.note.textContent = "";
        if (i >= 0) {
          pts.splice(i, 1);
          c.say(`Point removed at ${pt([x, y])}`, `Punto quitado en ${pt([x, y])}`);
        } else if (pts.length >= spec.cap) {
          c.note.textContent = L(
            `You have ${spec.cap} points. Tap a point to take it off.`,
            `Ya tienes ${spec.cap} puntos. Toca un punto para quitarlo.`,
          );
          return;
        } else {
          pts.push([x, y]);
          c.say(`Point placed at ${pt([x, y])}`, `Punto puesto en ${pt([x, y])}`);
        }
        c.emit({ pts });
        sync();
      },
    });
    const count = A.el("p", "ak-text");
    function sync() {
      const mk = c.marks();
      g.draw({
        points: pts.map((p, i) => ({
          x: p[0],
          y: p[1],
          l: String(i + 1),
          cls: c.solved ? "ok" : mk ? (mk[i] ? "ok" : "bad") : "",
        })),
      });
      count.textContent = c.solved
        ? pts.map(pt).join("   ")
        : L(
            `Points marked: ${pts.length}. Tap a marked point to remove it.`,
            `Puntos marcados: ${pts.length}. Toca un punto marcado para quitarlo.`,
          );
      c.checkBtn.disabled = !pts.length;
    }
    if (c.solved) pts = spec.want.map((/** @type {number[]} */ p) => p.slice());
    c.body.append(g.el, ...(c.solved ? [] : [g.pad, g.live]), count);
    c.redraws.push(sync);
    c.wire(
      () => ({ pts }),
      () => {
        pts = [];
        c.emit({ pts });
      },
    );
    void T;
    sync();
  }

  A.register("allpoints", {
    title: "All the points",
    titleEs: "Todos los puntos",
    levels: 4,
    make: mkAll,
    solution: (spec) => ({ pts: spec.want.map((/** @type {number[]} */ p) => p.slice()) }),
    wrong(spec) {
      const w = spec.want;
      return [
        { pts: [w[0].slice()] },
        { pts: w.map((/** @type {number[]} */ p) => [p[1], p[0]]) },
        { pts: [w[0].slice(), [w[0][0] + 1, w[0][1]]] },
        {
          pts: w
            .slice(0, -1)
            .map((/** @type {number[]} */ p) => p.slice())
            .concat(w.length > 2 ? [] : [[spec.dx + 1, spec.dy]]),
        },
      ];
    },
    grade: gradeAll,
    mount,
  });
})();

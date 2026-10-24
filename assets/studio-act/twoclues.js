/**
 * Practice Studio activity: twoclues (window.StudioAct kind "twoclues"), lesson 7-5.
 * Clue 1 gives only x, clue 2 gives only y. The student plots point P where the two clues meet, then point Q, where the two
 * numbers trade places. Swapping the order of an ordered pair gives a different point.
 * State: { pts: [[x, y] | null, [x, y] | null] }.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.u7 = A.u7 || {});
  const n = (/** @type {number} */ v) => K.n(v);
  const pt = (/** @type {number[]} */ p) => `(${n(p[0])}, ${n(p[1])})`;
  const same = (/** @type {any} */ a, /** @type {any} */ b) =>
    !!a && !!b && a[0] === b[0] && a[1] === b[1];

  /** One clue about a single coordinate, in words. */
  function clue(/** @type {string} */ axis, /** @type {number} */ v, /** @type {number} */ lv) {
    const a = Math.abs(v);
    if (lv <= 2)
      return axis === "x"
        ? `Clue 1: the point is on the vertical line x = ${n(v)}. ¦ Pista 1: el punto está en la línea vertical x = ${n(v)}.`
        : `Clue 2: the point is on the horizontal line y = ${n(v)}. ¦ Pista 2: el punto está en la línea horizontal y = ${n(v)}.`;
    return axis === "x"
      ? `Clue 1: the point is ${a} units ${v < 0 ? "left of" : "right of"} the y-axis. ¦ Pista 1: el punto está a ${a} unidades ${v < 0 ? "a la izquierda del" : "a la derecha del"} eje y.`
      : `Clue 2: the point is ${a} units ${v < 0 ? "below" : "above"} the x-axis. ¦ Pista 2: el punto está a ${a} unidades ${v < 0 ? "debajo del" : "arriba del"} eje x.`;
  }

  function mkTwoClues(/** @type {any} */ rng, /** @type {number} */ lv) {
    const m = [5, 6, 7, 8][lv - 1];
    let x = 0;
    let y = 0;
    while (!x || !y || Math.abs(x) === Math.abs(y)) {
      x = rng.int(1, m) * rng.pick([-1, 1]);
      y = rng.int(1, m) * rng.pick([-1, 1]);
    }
    const p = [x, y];
    const q = [y, x];
    const c1 = clue("x", x, lv);
    const c2 = clue("y", y, lv);
    const pack = K.pack({
      q: `${c1.split("¦")[0].trim()} ${c2.split("¦")[0].trim()} Place point P where the two clues meet. Then place point Q, the point you get when the two numbers of P trade places. ¦ ${c1.split("¦")[1].trim()} ${c2.split("¦")[1].trim()} Pon el punto P donde se encuentran las dos pistas. Luego pon el punto Q, el que resulta cuando los dos números de P se intercambian.`,
      x: `Clue 1 gives only x and clue 2 gives only y, so P is ${pt(p)}. Trading the numbers gives Q = ${pt(q)}. The order matters: ${pt(p)} and ${pt(q)} are different points. ¦ La pista 1 da solo x y la pista 2 da solo y, así que P es ${pt(p)}. Al intercambiar los números, Q = ${pt(q)}. El orden importa: ${pt(p)} y ${pt(q)} son puntos distintos.`,
      h: [
        "An ordered pair is (x, y). The first number is x: it tells left or right. ¦ Un par ordenado es (x, y). El primer número es x: dice izquierda o derecha.",
        "Clue 1 fixes x. Clue 2 fixes y. The point has to match both clues. ¦ La pista 1 fija x. La pista 2 fija y. El punto debe cumplir las dos pistas.",
        "For Q, the number that was x becomes y, and the number that was y becomes x. ¦ Para Q, el número que era x pasa a ser y, y el número que era y pasa a ser x.",
      ],
    });
    return { ...pack, r: m + 1, want: [p, q], model: { p, q } };
  }

  function gradeTwo(/** @type {any} */ spec, /** @type {any} */ state) {
    const pts = ((state && state.pts) || [null, null]).map((/** @type {any} */ p) =>
      Array.isArray(p) && p.length === 2 && p.every(Number.isInteger) ? p : null,
    );
    const [P, Q] = [pts[0] || null, pts[1] || null];
    const [wp, wq] = spec.want;
    const marks = [same(P, wp), same(Q, wq)];
    const parts = K.parts(marks);
    if (!P && !Q)
      return K.miss(
        "no-point",
        "Tap the grid to place point P and point Q. ¦ Toca la cuadrícula para poner el punto P y el punto Q.",
        parts,
      );
    if (!P || !Q)
      return K.miss("too-few", "Place both points, P and Q. ¦ Pon los dos puntos, P y Q.", parts);
    if (marks[0] && marks[1]) return { ok: true, ...parts };
    if (same(P, wq) && same(Q, wp))
      return K.miss(
        "coord-xy-swapped",
        "Your two points are swapped. The first clue tells x (left or right). The second clue tells y (up or down). ¦ Tus dos puntos están cambiados. La primera pista dice x (izquierda o derecha). La segunda pista dice y (arriba o abajo).",
        parts,
      );
    if (same(P, Q))
      return K.miss(
        "coord-xy-swapped",
        "P and Q are on the same spot. Trading the two numbers of an ordered pair gives a different point. ¦ P y Q están en el mismo lugar. Al intercambiar los dos números de un par ordenado se obtiene otro punto.",
        parts,
      );
    if (marks[0] && !marks[1])
      return K.miss(
        "coord-xy-swapped",
        "Point P is right. For Q, use P's second number as x and P's first number as y. ¦ El punto P está bien. Para Q, usa el segundo número de P como x y el primer número de P como y.",
        parts,
      );
    if (
      !marks[0] &&
      [
        [-wp[0], wp[1]],
        [wp[0], -wp[1]],
        [-wp[0], -wp[1]],
      ].some((w) => same(P, w))
    )
      return K.miss(
        "coord-quadrant-mixup",
        "Point P has the right distances but the wrong side. A negative x is left of the y-axis. A negative y is below the x-axis. ¦ El punto P tiene las distancias correctas pero el lado equivocado. Una x negativa está a la izquierda del eje y. Una y negativa está debajo del eje x.",
        parts,
      );
    return K.miss(
      "coord-xy-swapped",
      "Point P does not meet both clues. Clue 1 gives the left or right position. Clue 2 gives the up or down position. ¦ El punto P no cumple las dos pistas. La pista 1 da la posición a la izquierda o derecha. La pista 2 da la posición arriba o abajo.",
      parts,
    );
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const c = K.start(host, spec, api, "twoclues");
    const { L, T } = c;
    /** @type {any[]} */
    let pts = ((c.saved && c.saved.pts) || [null, null]).map((/** @type {any} */ p) =>
      p ? p.slice() : null,
    );
    let active = pts[0] ? (pts[1] ? 0 : 1) : 0;
    const names = ["P", "Q"];
    const g = A.u7.grid(c, {
      r: spec.r,
      onTap(x, y) {
        pts[active] = [x, y];
        if (active === 0 && !pts[1]) active = 1;
        c.emit({ pts });
        c.api.say?.(
          L(
            `Point ${names[active === 1 && pts[1] ? 1 : active]} placed at ${pt([x, y])}`,
            `Punto puesto en ${pt([x, y])}`,
          ),
        );
        sync();
      },
    });
    const sel = A.el("div", "ak-row", "", { role: "group" });
    c.label(sel, "Which point to place", "Cuál punto poner");
    const chips = names.map((nm, i) => {
      const b = A.el("button", "ak-chip", T(`Point ${nm}`, `Punto ${nm}`), { type: "button" });
      b.addEventListener("click", () => {
        active = i;
        sync();
      });
      sel.append(b);
      return b;
    });
    const readout = A.el("p", "ak-text");
    function sync() {
      chips.forEach((b, i) => b.setAttribute("aria-pressed", String(active === i)));
      const mk = c.marks();
      g.draw({
        points: pts
          .map((p, i) =>
            p
              ? { x: p[0], y: p[1], l: names[i], cls: mk ? (mk[i] ? "ok" : "bad") : i ? "b" : "" }
              : null,
          )
          .filter(Boolean),
      });
      readout.textContent = pts
        .map((p, i) => `${names[i]}: ${p ? pt(p) : L("not placed", "sin poner")}`)
        .join("   ");
      c.checkBtn.disabled = !(pts[0] || pts[1]);
    }
    if (c.solved) {
      pts = spec.want.map((/** @type {any} */ p) => p.slice());
      c.body.append(g.el, readout);
    } else c.body.append(sel, g.el, g.pad, g.live, readout);
    c.redraws.push(sync);
    c.wire(
      () => ({ pts }),
      () => {
        pts = [null, null];
        active = 0;
        c.emit({ pts });
      },
    );
    sync();
  }

  A.register("twoclues", {
    title: "Two clues",
    titleEs: "Dos pistas",
    levels: 4,
    make: mkTwoClues,
    solution: (spec) => ({ pts: spec.want.map((/** @type {any} */ p) => p.slice()) }),
    wrong(spec) {
      const [p, q] = spec.want;
      return [
        { pts: [q.slice(), p.slice()] },
        { pts: [p.slice(), p.slice()] },
        { pts: [[-p[0], p[1]], q.slice()] },
        { pts: [p.slice(), null] },
      ];
    },
    grade: gradeTwo,
    mount,
  });
})();

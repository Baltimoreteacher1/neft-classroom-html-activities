/**
 * Practice Studio activity: rectcorners (window.StudioAct kind "rectcorners"), lesson 7-7, "How many rectangles?".
 * One corner is given, with a horizontal side and a vertical side. The student marks the opposite corner of EVERY
 * rectangle that fits: one for each direction (left or right, up or down). Duplicates are flagged.
 * State: { pts: [[x, y], ...] }.
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
  const corners = (/** @type {number[]} */ c, /** @type {number} */ w, /** @type {number} */ h) => [
    [c[0] + w, c[1] + h],
    [c[0] - w, c[1] + h],
    [c[0] - w, c[1] - h],
    [c[0] + w, c[1] - h],
  ];

  function mkRect(/** @type {any} */ rng, /** @type {number} */ lv) {
    const r = [8, 9, 10, 12][lv - 1];
    const wMax = [5, 6, 7, 9][lv - 1];
    let w = 0;
    let h = 0;
    while (!w || w === h) {
      w = rng.int(2, wMax);
      h = rng.int(2, Math.max(3, wMax - 2));
    }
    let cx = 0;
    let cy = 0;
    do {
      cx = rng.int(-3, 3);
      cy = rng.int(-3, 3);
    } while ((!cx && !cy) || Math.abs(cx) + w > r - 1 || Math.abs(cy) + h > r - 1);
    const c = [cx, cy];
    const want = corners(c, w, h);
    const what = rng.pick([
      ["rectangle", "rectángulo"],
      ["picture frame", "marco de cuadro"],
      ["garden bed", "cantero"],
      ["banner", "pancarta"],
    ]);
    const pack = K.pack({
      q: `One corner of a ${what[0]} is ${pt(c)}. Its sides follow the grid lines. The horizontal side is ${w} units long and the vertical side is ${h} units long. Mark the opposite corner of EVERY ${what[0]} that fits. ¦ Una esquina de un(a) ${what[1]} está en ${pt(c)}. Sus lados siguen las líneas de la cuadrícula. El lado horizontal mide ${w} unidades y el lado vertical mide ${h} unidades. Marca la esquina opuesta de CADA ${what[1]} que cumple.`,
      x: `The given corner can be the lower left, lower right, upper left or upper right corner, so four rectangles fit. Move ${w} units left or right and ${h} units up or down: the opposite corners are ${want.map(pt).join(", ")}. ¦ La esquina dada puede ser la esquina inferior izquierda, inferior derecha, superior izquierda o superior derecha, así que caben cuatro rectángulos. Avanza ${w} unidades a la izquierda o a la derecha y ${h} unidades arriba o abajo: las esquinas opuestas son ${want.map(pt).join(", ")}.`,
      h: [
        "The horizontal side changes x. The vertical side changes y. ¦ El lado horizontal cambia x. El lado vertical cambia y.",
        "From the given corner, you can go left or right, and up or down. ¦ Desde la esquina dada puedes ir a la izquierda o a la derecha, y arriba o abajo.",
        "Each choice of left or right with up or down makes a different rectangle. ¦ Cada elección de izquierda o derecha con arriba o abajo hace un rectángulo distinto.",
      ],
    });
    return { ...pack, r, c, sw: w, sh: h, want, cap: 6, model: { c, w, h } };
  }

  function gradeRect(/** @type {any} */ spec, /** @type {any} */ state) {
    const raw = ((state && state.pts) || []).filter(
      (/** @type {any} */ p) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger),
    );
    /** @type {number[][]} */
    const pts = [];
    for (const p of raw) if (!has(pts, p)) pts.push(p);
    const want = spec.want;
    const marks = pts.map((p) => has(want, p));
    const right = marks.filter(Boolean).length;
    const parts = { right, of: want.length, marks };
    if (!pts.length)
      return K.miss(
        "no-point",
        "Tap the grid to mark a corner. ¦ Toca la cuadrícula para marcar una esquina.",
        parts,
      );
    if (raw.length > pts.length)
      return K.miss(
        "multi-step-stopped-early",
        "Two of your points are in the same place. Each rectangle needs its own opposite corner. ¦ Dos de tus puntos están en el mismo lugar. Cada rectángulo necesita su propia esquina opuesta.",
        parts,
      );
    if (right === want.length && pts.length === want.length) return { ok: true, ...parts };
    const swapped = corners(spec.c, spec.sh, spec.sw);
    if (pts.some((p) => has(swapped, p) && !has(want, p)))
      return K.miss(
        "coord-xy-swapped",
        "Some corners use the sides the other way around. The horizontal side changes x. The vertical side changes y. ¦ Algunas esquinas usan los lados al revés. El lado horizontal cambia x. El lado vertical cambia y.",
        parts,
      );
    if (pts.some((p) => eq(p, [spec.sw, spec.sh]) || eq(p, [spec.sh, spec.sw])))
      return K.miss(
        "distance-coordinate-used-as-length",
        "A side length tells how far to move, not where the point is. Start at the given corner and move that far. ¦ La longitud de un lado dice cuánto avanzar, no dónde está el punto. Empieza en la esquina dada y avanza esa distancia.",
        parts,
      );
    if (right < pts.length)
      return K.miss(
        "figure-vertices-mishandled",
        "Some points are not the opposite corner of a rectangle with those sides. Move the side lengths from the given corner, then mark the point. ¦ Algunos puntos no son la esquina opuesta de un rectángulo con esos lados. Avanza las longitudes desde la esquina dada y luego marca el punto.",
        parts,
      );
    return K.miss(
      "multi-step-stopped-early",
      right === 1
        ? "That corner works, and more rectangles fit. The given corner can be on any of the four corners of the rectangle. ¦ Esa esquina sirve, y caben más rectángulos. La esquina dada puede estar en cualquiera de las cuatro esquinas del rectángulo."
        : `${right} of the 4 rectangles are there. Which directions have you not tried: left or right, up or down? ¦ Hay ${right} de los 4 rectángulos. ¿Cuáles direcciones no has probado: izquierda o derecha, arriba o abajo?`,
      parts,
    );
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const c = K.start(host, spec, api, "rectcorners");
    const { L } = c;
    /** @type {number[][]} */
    let pts =
      c.saved && c.saved.pts ? c.saved.pts.map((/** @type {number[]} */ p) => p.slice()) : [];
    const g = K.grid(c, {
      r: spec.r,
      onTap(x, y) {
        c.note.textContent = "";
        if (eq([x, y], spec.c)) {
          c.note.textContent = L(
            "That is the given corner. Mark a different corner.",
            "Esa es la esquina dada. Marca otra esquina.",
          );
          return;
        }
        const i = pts.findIndex((p) => eq(p, [x, y]));
        if (i >= 0) {
          pts.splice(i, 1);
          c.say(`Corner removed at ${pt([x, y])}`, `Esquina quitada en ${pt([x, y])}`);
        } else if (pts.length >= spec.cap) {
          c.note.textContent = L(
            `You have ${spec.cap} corners. Tap one to take it off.`,
            `Ya tienes ${spec.cap} esquinas. Toca una para quitarla.`,
          );
          return;
        } else {
          pts.push([x, y]);
          c.say(`Corner placed at ${pt([x, y])}`, `Esquina puesta en ${pt([x, y])}`);
        }
        c.emit({ pts });
        sync();
      },
    });
    const info = A.el("p", "ak-text");
    function sync() {
      const mk = c.marks();
      g.draw({
        rects: pts.map((p) => ({ x1: spec.c[0], y1: spec.c[1], x2: p[0], y2: p[1] })),
        points: [
          { x: spec.c[0], y: spec.c[1], l: L("corner", "esquina"), cls: "given" },
          ...pts.map((p, i) => ({
            x: p[0],
            y: p[1],
            cls: c.solved ? "ok" : mk ? (mk[i] ? "ok" : "bad") : "",
          })),
        ],
      });
      info.textContent = c.solved
        ? pts.map(pt).join("   ")
        : L(
            `Opposite corners marked: ${pts.length}. Tap a marked corner to remove it.`,
            `Esquinas opuestas marcadas: ${pts.length}. Toca una esquina marcada para quitarla.`,
          );
      c.checkBtn.disabled = !pts.length;
    }
    if (c.solved) pts = spec.want.map((/** @type {number[]} */ p) => p.slice());
    c.body.append(g.el, ...(c.solved ? [] : [g.pad, g.live]), info);
    c.redraws.push(sync);
    c.wire(
      () => ({ pts }),
      () => {
        pts = [];
        c.emit({ pts });
      },
    );
    sync();
  }

  A.register("rectcorners", {
    title: "How many rectangles?",
    titleEs: "¿Cuántos rectángulos?",
    levels: 4,
    make: mkRect,
    solution: (spec) => ({ pts: spec.want.map((/** @type {number[]} */ p) => p.slice()) }),
    wrong(spec) {
      const sw = corners(spec.c, spec.sh, spec.sw);
      return [
        { pts: [spec.want[0].slice()] },
        { pts: [spec.want[0].slice(), spec.want[2].slice()] },
        { pts: sw },
        { pts: [spec.want[0].slice(), spec.want[0].slice()] },
        { pts: spec.want.slice(0, 3).map((/** @type {number[]} */ p) => p.slice()) },
      ];
    },
    grade: gradeRect,
    mount,
  });
})();

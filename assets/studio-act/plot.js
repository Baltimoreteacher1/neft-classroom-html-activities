/**
 * Practice Studio activity: plot (window.StudioAct kind "plot").
 * Tap a coordinate plane to place points. Modes: point, polygon, reflect, ratio, table, distance.
 * State is { pts: [[x, y], ...] }. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  /* ---- helpers ------------------------------------------------------------------------------ */
  /** "English text ¦ Texto en español" -> [en, es] */
  const bi = (/** @type {string} */ s) => s.split("¦").map((t) => t.trim());
  const mn = (/** @type {number} */ n) => G.fmt(n, 4).replace("-", "−");
  const P = (/** @type {number[]} */ p) => `(${mn(p[0])}, ${mn(p[1])})`;
  const half = (/** @type {number} */ n) => {
    if (Number.isInteger(n)) return mn(n);
    const a = Math.abs(n);
    const w = Math.floor(a);
    return `${n < 0 ? "−" : ""}${w ? `${w} ` : ""}1/2`;
  };
  const PH = (/** @type {number[]} */ p) => `(${half(p[0])}, ${half(p[1])})`;
  const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1e-6;
  const eq = (/** @type {number[]} */ p, /** @type {number[]} */ q) =>
    near(p[0], q[0]) && near(p[1], q[1]);
  const has = (/** @type {number[][]} */ l, /** @type {number[]} */ p) => l.some((q) => eq(p, q));
  const sameSet = (/** @type {number[][]} */ a, /** @type {number[][]} */ b) =>
    a.length === b.length && a.every((p) => has(b, p)) && b.every((p) => has(a, p));
  const grid = (x0, x1, y0, y1, sx = 1, sy = sx) => ({ x0, x1, y0, y1, sx, sy });
  const LET = "ABCDEFGH";
  const MODES = ["point", "polygon", "reflect", "ratio", "table", "distance"];
  const pack = (/** @type {any} */ o) => {
    const [q, qEs] = bi(o.q);
    const [x, xEs] = bi(o.x);
    const hh = o.h.map(bi);
    return { q, qEs, x, xEs, h: hh.map((t) => t[0]), hEs: hh.map((t) => t[1]) };
  };
  const val = (rng, lo, hi, h) => (h ? rng.int(lo, hi - 1) + 0.5 : rng.int(lo, hi));
  /** A random grid point off the origin; o.half allows .5, o.axis allows a 0, o.off needs a negative. */
  function pickPt(rng, g, o = {}) {
    for (let i = 0; i < 80; i++) {
      const hx = !!o.half && rng.chance(0.65);
      const hy = !!o.half && (!hx || rng.chance(0.5));
      const x = val(rng, g.x0, g.x1, hx);
      const y = val(rng, g.y0, g.y1, hy);
      if (x === 0 && y === 0) continue;
      if (o.off && !(x < 0 || y < 0)) continue;
      if (!o.axis && (x === 0 || y === 0)) continue;
      return [x, y];
    }
    return [1, 1];
  }
  const planeFor = (rng, lv, e) =>
    lv === 1
      ? grid(0, e, 0, e)
      : lv === 2
        ? rng.chance(0.5)
          ? grid(-e, e, 0, e)
          : grid(0, e, -e, e)
        : grid(-e, e, -e, e, lv === 4 ? 0.5 : 1);
  const extOf = (p, def) => Math.max(4, Math.min(10, Number(p.range) || def));

  /* ---- modes: point ------------------------------------------------------------------------- */
  const SCENES = [
    (l, c) => `Plot point ${l} at ${c}. ¦ Marca el punto ${l} en ${c}.`,
    (_l, c) =>
      `The treasure chest is at ${c}. Tap that spot. ¦ El cofre del tesoro está en ${c}. Toca ese lugar.`,
    (_l, c) =>
      `A drone hovers at ${c}. Plot its position. ¦ Un dron vuela en ${c}. Marca su posición.`,
    (_l, c) => `Put a flag at ${c}. ¦ Pon una bandera en ${c}.`,
    (_l, c) =>
      `Your camp is at ${c}. Plot it on the map. ¦ Tu campamento está en ${c}. Márcalo en el mapa.`,
    (l, c) =>
      `Point ${l} has coordinates ${c}. Plot it. ¦ El punto ${l} tiene coordenadas ${c}. Márcalo.`,
  ];
  const side = (n, pos, neg, zero) => (n > 0 ? pos : n < 0 ? neg : zero);
  function movesText(t) {
    const ax = Math.abs(t[0]);
    const ay = Math.abs(t[1]);
    const u = (n) => (n === 1 ? "unit" : "units");
    const uEs = (n) => (n === 1 ? "unidad" : "unidades");
    const en = `${t[0] ? `${mn(ax)} ${u(ax)} ${side(t[0], "right", "left")}` : "no sideways move"} and ${t[1] ? `${mn(ay)} ${u(ay)} ${side(t[1], "up", "down")}` : "no up or down move"}`;
    const es = `${t[0] ? `${mn(ax)} ${uEs(ax)} a la ${side(t[0], "derecha", "izquierda")}` : "ningún movimiento lateral"} y ${t[1] ? `${mn(ay)} ${uEs(ay)} ${side(t[1], "hacia arriba", "hacia abajo")}` : "ningún movimiento vertical"}`;
    return `${en} ¦ ${es}`;
  }
  function mkPoint(rng, lv, p) {
    const e = extOf(p, [8, 6, 6, 5][lv - 1]);
    const g = planeFor(rng, lv, e);
    const t = pickPt(rng, g, {
      half: lv === 4,
      axis: rng.chance(0.15),
      off: lv === 2 && rng.chance(0.8),
    });
    const l = rng.pick(["A", "B", "P", "Q", "R", "S", "T"]);
    const c = lv === 4 && rng.chance(0.5) ? PH(t) : P(t);
    const [en, es] = bi(movesText(t));
    const first =
      lv === 1
        ? "Count the units to the right first, then count up."
        : "Start at the origin (0, 0). A negative x goes left. A negative y goes down.";
    const firstEs =
      lv === 1
        ? "Cuenta primero las unidades a la derecha y luego cuenta hacia arriba."
        : "Empieza en el origen (0, 0). Una x negativa va a la izquierda. Una y negativa va hacia abajo.";
    return {
      ...pack({
        q: rng.pick(SCENES)(l, c),
        x: `From the origin, go ${en}. That is the point ${P(t)}. ¦ Desde el origen, ve ${es}. Ese es el punto ${P(t)}.`,
        h: [
          "In (x, y), the first number tells you how far to move along the x-axis. The second number tells you how far to move up or down. ¦ En (x, y), el primer número dice cuánto moverte por el eje x. El segundo dice cuánto subir o bajar.",
          `${first} ¦ ${firstEs}`,
          "Make the x move first. Then, from there, make the y move. Tap where you stop. ¦ Haz primero el movimiento en x. Luego, desde ahí, haz el movimiento en y. Toca donde te detengas.",
        ],
      }),
      grid: g,
      want: [t],
      given: [],
      far: bi(
        "That point is not near yet. Start at the origin (0, 0): the first number moves you along the x-axis, the second moves you up or down. ¦ Ese punto todavía no está cerca. Empieza en el origen (0, 0): el primer número te mueve por el eje x y el segundo te sube o baja.",
      ),
      alts: [],
    };
  }

  /* ---- modes: reflect ----------------------------------------------------------------------- */
  const flip = (/** @type {number[]} */ p, /** @type {string} */ ax) =>
    ax === "x" ? [p[0], -p[1]] : [-p[0], p[1]];
  function mkReflect(rng, lv, p) {
    const e = extOf(p, [5, 6, 5, 5][lv - 1]);
    const g = grid(-e, e, -e, e, lv >= 3 ? 0.5 : 1);
    const a = pickPt(rng, g, { half: lv >= 3 });
    const axes =
      lv === 4
        ? rng.pick([
            ["x", "y"],
            ["y", "x"],
          ])
        : [rng.pick(["x", "y"])];
    const imgs = [];
    let cur = a;
    for (const ax of axes) {
      cur = flip(cur, ax);
      imgs.push(cur);
    }
    const ca = lv >= 3 && rng.chance(0.5) ? PH(a) : P(a);
    const [ax1, ax2] = axes;
    const other = ax1 === "x" ? "y" : "x";
    const wrongAxis = bi(
      `That is the reflection across the ${other}-axis. Check which axis the question names. ¦ Esa es la reflexión sobre el eje ${other}. Revisa qué eje nombra la pregunta.`,
    );
    const alts = [];
    if (lv < 4) {
      alts.push({
        tag: "wrong-axis",
        pts: [flip(a, other)],
        say: wrongAxis[0],
        sayEs: wrongAxis[1],
      });
      alts.push({
        tag: "no-move",
        pts: [a],
        say: "That is the original point. A reflection flips the point to the other side of the axis. ",
        sayEs: "Ese es el punto original. Una reflexión pasa el punto al otro lado del eje. ",
      });
      alts.push({
        tag: "both-signs",
        pts: [[-a[0], -a[1]]],
        say: "You changed both signs. Reflecting across one axis changes only one coordinate. ",
        sayEs: "Cambiaste los dos signos. Reflejar sobre un eje cambia solo una coordenada. ",
      });
      alts.push({
        tag: "swapped",
        pts: [[a[1], a[0]]],
        say: "Swapping x and y is a different move. A reflection keeps the point the same distance from the axis, on the other side. ",
        sayEs:
          "Cambiar x por y es otro movimiento. Una reflexión deja el punto a la misma distancia del eje, al otro lado. ",
      });
    } else {
      alts.push({
        tag: "same-axis-twice",
        pts: [imgs[0], a],
        say: "Reflecting across the same axis twice just undoes the first flip. Check which axis the second step names. ",
        sayEs:
          "Reflejar dos veces sobre el mismo eje deshace el primer giro. Revisa qué eje nombra el segundo paso. ",
      });
      alts.push({
        tag: "both-signs",
        pts: [[-a[0], -a[1]], imgs[0]],
        say: "The first image changes only one coordinate. Do the first flip by itself before the second. ",
        sayEs:
          "La primera imagen cambia solo una coordenada. Haz el primer giro solo antes del segundo. ",
      });
    }
    const qa =
      lv === 4
        ? `Point A is at ${ca}. Reflect it across the ${ax1}-axis to make A′. Then reflect A′ across the ${ax2}-axis to make A″. Plot A′ and A″. ¦ El punto A está en ${ca}. Refléjalo sobre el eje ${ax1} para formar A′. Luego refleja A′ sobre el eje ${ax2} para formar A″. Marca A′ y A″.`
        : lv === 2
          ? `Reflect point A across the ${ax1}-axis. Plot its image A′. ¦ Refleja el punto A sobre el eje ${ax1}. Marca su imagen A′.`
          : `Point A is at ${ca}. Reflect it across the ${ax1}-axis. Plot its image A′. ¦ El punto A está en ${ca}. Refléjalo sobre el eje ${ax1}. Marca su imagen A′.`;
    const rule = (ax) => (ax === "x" ? "(x, y) → (x, −y)" : "(x, y) → (−x, y)");
    const lineH = ax1 === "x" ? "horizontal ¦ horizontal" : "vertical ¦ vertical";
    return {
      ...pack({
        q: qa,
        x: `Reflecting across the ${ax1}-axis follows ${rule(ax1)}${ax2 ? `, then across the ${ax2}-axis follows ${rule(ax2)}` : ""}. The image is ${imgs.map(P).join(" and ")}. ¦ Reflejar sobre el eje ${ax1} sigue ${rule(ax1)}${ax2 ? `, y luego sobre el eje ${ax2} sigue ${rule(ax2)}` : ""}. La imagen es ${imgs.map(P).join(" y ")}.`,
        h: [
          "A reflection flips a point over the mirror line. The image lands on the other side, the same distance away. ¦ Una reflexión voltea un punto sobre la línea espejo. La imagen queda al otro lado, a la misma distancia.",
          `The ${ax1}-axis is the ${lineH.split("¦")[0].trim()} ${ax1 === "x" ? "line" : "line"}. Flipping over it changes only the ${ax1 === "x" ? "y" : "x"}-coordinate. ¦ El eje ${ax1} es la línea ${lineH.split("¦")[1].trim()}. Voltear sobre él cambia solo la coordenada ${ax1 === "x" ? "y" : "x"}.`,
          "Count how far A is from the mirror axis. Then count the same distance on the other side. ¦ Cuenta qué tan lejos está A del eje espejo. Luego cuenta la misma distancia al otro lado.",
        ],
      }),
      grid: g,
      want: imgs,
      given: [{ p: a, l: "A" }],
      axes,
      far: bi(
        "A reflection lands the same distance from the mirror axis, on the other side. Check how far your point is from the axis. ¦ Una reflexión queda a la misma distancia del eje espejo, al otro lado. Revisa qué tan lejos del eje está tu punto.",
      ),
      alts,
    };
  }

  /* ---- modes: distance ---------------------------------------------------------------------- */
  const DIRS = {
    right: [[1, 0], "to the right of", "a la derecha de"],
    left: [[-1, 0], "to the left of", "a la izquierda de"],
    up: [[0, 1], "above", "arriba de"],
    down: [[0, -1], "below", "debajo de"],
  };
  function mkDistance(rng, lv, p) {
    const e = extOf(p, [8, 6, 6, 5][lv - 1]);
    const g = lv === 1 ? grid(0, e, 0, e) : lv === 4 ? grid(-e, e, -e, e, 0.5) : grid(-e, e, -e, e);
    const both = lv >= 3;
    const hf = lv === 4;
    let a;
    let d;
    let dir;
    let horiz;
    for (let i = 0; i < 200; i++) {
      a = pickPt(rng, g, { half: hf, axis: lv < 3 && rng.chance(0.1) });
      d = hf ? rng.int(2, 8) / 2 + (rng.chance(0.5) ? 0.5 : 0) : rng.int(2, lv === 1 ? 5 : 7);
      d = Math.max(2, d);
      horiz = rng.chance(0.5);
      dir = rng.pick(horiz ? ["right", "left"] : ["up", "down"]);
      const mv = DIRS[dir][0];
      const b = [a[0] + mv[0] * d, a[1] + mv[1] * d];
      const b2 = [a[0] - mv[0] * d, a[1] - mv[1] * d];
      const inG = (q) => q[0] >= g.x0 && q[0] <= g.x1 && q[1] >= g.y0 && q[1] <= g.y1;
      const cross = horiz
        ? Math.sign(a[0]) !== Math.sign(b[0])
        : Math.sign(a[1]) !== Math.sign(b[1]);
      if (!inG(b) || (both && !inG(b2))) continue;
      if (lv === 2 && !cross && rng.chance(0.75)) continue;
      break;
    }
    const mv = DIRS[dir][0];
    const bPt = [a[0] + mv[0] * d, a[1] + mv[1] * d];
    const cPt = [a[0] - mv[0] * d, a[1] - mv[1] * d];
    const want = both ? [bPt, cPt] : [bPt];
    const line = horiz ? "horizontal line ¦ línea horizontal" : "vertical line ¦ línea vertical";
    const [lEn, lEs] = bi(line);
    const q = both
      ? `Point A is at ${P(a)}. Plot both points that are ${mn(d)} units from A on the same ${lEn}. ¦ El punto A está en ${P(a)}. Marca los dos puntos que están a ${mn(d)} unidades de A en la misma ${lEs}.`
      : `Point A is at ${P(a)}. Plot the point that is ${mn(d)} units ${DIRS[dir][1]} A. ¦ El punto A está en ${P(a)}. Marca el punto que está a ${mn(d)} unidades ${DIRS[dir][2]} A.`;
    const k = horiz ? 0 : 1;
    const calc = `${mn(a[k])} ${mv[k] * d < 0 ? "−" : "+"} ${mn(d)} = ${mn(bPt[k])}`;
    const calc2 = `${mn(a[k])} ${mv[k] * d < 0 ? "+" : "−"} ${mn(d)} = ${mn(cPt[k])}`;
    const co = horiz ? "x" : "y";
    const alts = [];
    const fromO = horiz ? [[Math.abs(d) * mv[0], a[1]]] : [[a[0], Math.abs(d) * mv[1]]];
    if (!both) {
      alts.push({
        tag: "wrong-direction",
        pts: [cPt],
        say: "Your point is the right distance away, but on the other side of A. Check the direction word in the question. ",
        sayEs:
          "Tu punto está a la distancia correcta, pero al otro lado de A. Revisa la palabra de dirección de la pregunta. ",
      });
      alts.push({
        tag: "from-origin",
        pts: fromO,
        say: "It looks like you measured from the origin. The distance in this question starts at point A. ",
        sayEs:
          "Parece que mediste desde el origen. La distancia de esta pregunta empieza en el punto A. ",
      });
    } else {
      alts.push({
        tag: "from-origin",
        pts: [horiz ? [d, a[1]] : [a[0], d], horiz ? [-d, a[1]] : [a[0], -d]],
        say: "It looks like you measured from the origin. The distances here start at point A. ",
        sayEs: "Parece que mediste desde el origen. Las distancias aquí empiezan en el punto A. ",
      });
    }
    return {
      ...pack({
        q,
        x: `Moving along the ${horiz ? "row" : "column"} changes only ${co}: ${calc}${both ? ` and ${calc2}` : ""}. The other coordinate stays the same. ¦ Moverte por ${horiz ? "la fila" : "la columna"} cambia solo ${co}: ${calc}${both ? ` y ${calc2}` : ""}. La otra coordenada no cambia.`,
        h: [
          "Distance is how many units apart two points are. Count one unit at a time along the grid. ¦ La distancia es cuántas unidades hay entre dos puntos. Cuenta una unidad a la vez en la cuadrícula.",
          `Stay on the same ${horiz ? "row" : "column"} as A, so only the ${co}-coordinate changes. ¦ Quédate en ${horiz ? "la misma fila" : "la misma columna"} que A, así solo cambia la coordenada ${co}.`,
          "Start at A and count the units. If you cross 0, keep counting. ¦ Empieza en A y cuenta las unidades. Si cruzas el 0, sigue contando.",
        ],
      }),
      grid: g,
      want,
      given: [{ p: a, l: "A" }],
      dist: d,
      horiz,
      far: bi(
        "Count the distance from A, one unit at a time, on the same row or column. ¦ Cuenta la distancia desde A, una unidad a la vez, en la misma fila o columna.",
      ),
      alts,
    };
  }

  /* ---- modes: polygon ----------------------------------------------------------------------- */
  const SIDE_WORD = [
    ["above", "arriba del lado"],
    ["to the left of", "a la izquierda del lado"],
    ["below", "debajo del lado"],
    ["to the right of", "a la derecha del lado"],
  ];
  function mkPoly(rng, lv, p) {
    const e = extOf(p, [8, 6, 6, 5][lv - 1]);
    const g = planeFor(rng, lv, e);
    const hf = lv === 4;
    const st = hf ? 0.5 : 1;
    const types =
      lv === 1
        ? ["rect3"]
        : lv === 2
          ? ["rect3", "rect2"]
          : lv === 3
            ? ["rect2", "area", "tri"]
            : ["area", "perim", "tri", "rect2"];
    const type = rng.pick(types);
    const s = rng.int(0, 3);
    const rnd = (lo, hi) => rng.int(lo / st, hi / st) * st;
    if (type === "tri") {
      for (let i = 0; i < 200; i++) {
        const a = pickPt(rng, g, { half: hf, axis: false });
        const da = rnd(2, 6) * rng.pick([1, -1]);
        const db = rnd(2, 6) * rng.pick([1, -1]);
        const b = [a[0] + da, a[1]];
        const c = [a[0], a[1] + db];
        if (b[0] < g.x0 || b[0] > g.x1 || c[1] < g.y0 || c[1] > g.y1) continue;
        const wd = da > 0 ? ["right", "derecha"] : ["left", "izquierda"];
        const wv = db > 0 ? ["up", "arriba"] : ["down", "abajo"];
        const alts = [
          {
            tag: "legs-swapped",
            pts: [
              [a[0] + Math.sign(da) * Math.abs(db), a[1]],
              [a[0], a[1] + Math.sign(db) * Math.abs(da)],
            ],
            say: "The two leg lengths look swapped. Check which leg goes sideways and which goes up or down. ",
            sayEs:
              "Parece que cambiaste las longitudes de los catetos. Revisa cuál va de lado y cuál sube o baja. ",
          },
          {
            tag: "direction",
            pts: [
              [a[0] - da, a[1]],
              [a[0], a[1] - db],
            ],
            say: "The lengths are right, but check the direction words: left or right, up or down. ",
            sayEs:
              "Las longitudes están bien, pero revisa las palabras de dirección: izquierda o derecha, arriba o abajo. ",
          },
        ].filter((x) => !sameSet(x.pts, [b, c]));
        return {
          ...pack({
            q: `Right triangle ABC has its right angle at A. Leg AB goes ${wd[0]} ${mn(Math.abs(da))} units. Leg AC goes ${wv[0]} ${mn(Math.abs(db))} units. Plot B and C. ¦ El triángulo rectángulo ABC tiene su ángulo recto en A. El cateto AB va a la ${wd[1]} ${mn(Math.abs(da))} unidades. El cateto AC va ${wv[1]} ${mn(Math.abs(db))} unidades. Marca B y C.`,
            x: `B is ${mn(Math.abs(da))} units from A along the row, so B = ${P(b)}. C is ${mn(Math.abs(db))} units from A along the column, so C = ${P(c)}. ¦ B está a ${mn(Math.abs(da))} unidades de A en la fila, así que B = ${P(b)}. C está a ${mn(Math.abs(db))} unidades de A en la columna, así que C = ${P(c)}.`,
            h: [
              "A right angle is a square corner. One leg runs along a row and the other along a column. ¦ Un ángulo recto es una esquina cuadrada. Un cateto va por una fila y el otro por una columna.",
              "Start at A. For B, only the x-coordinate changes. For C, only the y-coordinate changes. ¦ Empieza en A. Para B, solo cambia la coordenada x. Para C, solo cambia la coordenada y.",
              "Count the length of each leg from A in the direction named. ¦ Cuenta la longitud de cada cateto desde A en la dirección indicada.",
            ],
          }),
          grid: g,
          want: [b, c],
          given: [{ p: a, l: "A" }],
          shape: "tri",
          far: bi(
            "Start at A and count each leg's length in the direction named. B changes only x. C changes only y. ¦ Empieza en A y cuenta la longitud de cada cateto en la dirección indicada. B cambia solo x. C cambia solo y.",
          ),
          alts,
        };
      }
    }
    // rectangles
    let w;
    let h;
    let x1;
    let y1;
    const maxW = Math.min(8, g.x1 - g.x0);
    const maxH = Math.min(8, g.y1 - g.y0);
    w = rnd(2, Math.min(6, maxW));
    h = rnd(2, Math.min(5, maxH));
    x1 = g.x0 + rng.int(0, (g.x1 - g.x0 - w) / st) * st;
    y1 = g.y0 + rng.int(0, (g.y1 - g.y0 - h) / st) * st;
    const c = [
      [x1, y1],
      [x1 + w, y1],
      [x1 + w, y1 + h],
      [x1, y1 + h],
    ];
    const V = [0, 1, 2, 3].map((j) => c[(s + j) % 4]);
    const lab = (j) => LET[j];
    let given;
    let want;
    let qq;
    let shape = "rect";
    let area = null;
    let per = null;
    const alts = [];
    let hints;
    let xx;
    const sideLen = s % 2 === 0 ? w : h;
    const otherLen = s % 2 === 0 ? h : w;
    const sw = SIDE_WORD[s];
    if (type === "rect3") {
      const m = rng.int(0, 3);
      given = [0, 1, 2, 3].filter((j) => j !== m);
      want = [V[m]];
      qq = `Corners ${given.map(lab).join(", ")} of rectangle ABCD are shown. Plot corner ${lab(m)}. ¦ Se muestran las esquinas ${given.map(lab).join(", ")} del rectángulo ABCD. Marca la esquina ${lab(m)}.`;
      xx = `A rectangle has two different x-values and two different y-values. Corner ${lab(m)} uses the x-value of one neighbor and the y-value of the other: ${P(V[m])}. ¦ Un rectángulo tiene dos valores x y dos valores y diferentes. La esquina ${lab(m)} usa el valor x de un vecino y el valor y del otro: ${P(V[m])}.`;
      hints = [
        "In a rectangle with sides parallel to the axes, there are only two different x-values and two different y-values. ¦ En un rectángulo con lados paralelos a los ejes solo hay dos valores x y dos valores y diferentes.",
        "Look at the corners you can see. Which x-values and y-values do they use? The missing corner uses a pair that is not used yet. ¦ Mira las esquinas que ves. ¿Qué valores x y y usan? La esquina que falta usa la combinación que aún no se usa.",
        "Check by counting: opposite sides must be the same length. ¦ Revisa contando: los lados opuestos deben medir lo mismo.",
      ];
    } else if (type === "rect2") {
      given = [0, 2];
      want = [V[1], V[3]];
      qq = `A and C are opposite corners of rectangle ABCD. Its sides are parallel to the axes. Plot corners B and D. ¦ A y C son esquinas opuestas del rectángulo ABCD. Sus lados son paralelos a los ejes. Marca las esquinas B y D.`;
      xx = `The other two corners mix the x-values and y-values of A and C: ${P(V[1])} and ${P(V[3])}. ¦ Las otras dos esquinas mezclan los valores x y y de A y C: ${P(V[1])} y ${P(V[3])}.`;
      hints = [
        "A rectangle with sides parallel to the axes has two different x-values and two different y-values. ¦ Un rectángulo con lados paralelos a los ejes tiene dos valores x y dos valores y diferentes.",
        "A and C already use both x-values and both y-values. Each missing corner pairs one x-value with one y-value. ¦ A y C ya usan los dos valores x y los dos valores y. Cada esquina que falta combina un valor x con un valor y.",
        "Make sure neither missing corner is on top of A or C. ¦ Asegúrate de que ninguna esquina que falta quede sobre A o C.",
      ];
    } else {
      given = [0, 1];
      want = [V[2], V[3]];
      const mirror = V.slice(2).map((q) =>
        s % 2 === 0 ? [q[0], 2 * V[0][1] - q[1]] : [2 * V[0][0] - q[0], q[1]],
      );
      area = w * h;
      per = 2 * (w + h);
      const known =
        type === "area"
          ? `area of ${mn(area)} square units ¦ área de ${mn(area)} unidades cuadradas`
          : `perimeter of ${mn(per)} units ¦ perímetro de ${mn(per)} unidades`;
      const [kEn, kEs] = bi(known);
      qq = `Corners A and B of rectangle ABCD are shown. The rectangle has ${type === "area" ? "an" : "a"} ${kEn} and lies ${sw[0]} side AB. Plot corners C and D. ¦ Se muestran las esquinas A y B del rectángulo ABCD. El rectángulo tiene ${kEs} y está ${sw[1]} AB. Marca las esquinas C y D.`;
      const calc =
        type === "area"
          ? `${mn(area)} ÷ ${mn(sideLen)} = ${mn(otherLen)}`
          : `${mn(per)} ÷ 2 − ${mn(sideLen)} = ${mn(otherLen)}`;
      xx = `Side AB is ${mn(sideLen)} units long. The other side is ${calc} units, so C = ${P(V[2])} and D = ${P(V[3])}. ¦ El lado AB mide ${mn(sideLen)} unidades. El otro lado mide ${calc} unidades, así que C = ${P(V[2])} y D = ${P(V[3])}.`;
      hints = [
        "Count the length of side AB on the grid. ¦ Cuenta la longitud del lado AB en la cuadrícula.",
        type === "area"
          ? "Area = length × width. Divide the area by the side you know to find the other side. ¦ Área = largo × ancho. Divide el área entre el lado que conoces para hallar el otro lado."
          : "Perimeter = 2 × (length + width). Halve the perimeter, then subtract the side you know. ¦ Perímetro = 2 × (largo + ancho). Saca la mitad del perímetro y resta el lado que conoces.",
        "Move that many units away from AB, toward the side the question names. ¦ Muévete esa cantidad de unidades desde AB, hacia el lado que indica la pregunta.",
      ];
      alts.push({
        tag: "wrong-side",
        pts: mirror,
        say: "Your rectangle is on the other side of AB. Read again which side of AB it should be on. ",
        sayEs:
          "Tu rectángulo está al otro lado de AB. Lee otra vez de qué lado de AB debe quedar. ",
      });
      shape = type;
    }
    const givenPts = given.map((j) => ({ p: V[j], l: lab(j) }));
    return {
      ...pack({ q: qq, x: xx, h: hints }),
      grid: g,
      want,
      given: givenPts,
      shape,
      area,
      per,
      far: bi(
        "Those corners do not make the rectangle yet. Opposite sides must be equal and parallel to the axes. ¦ Esas esquinas todavía no forman el rectángulo. Los lados opuestos deben ser iguales y paralelos a los ejes.",
      ),
      alts: alts.filter((x) => !sameSet(x.pts, want)),
    };
  }

  /* ---- modes: ratio and table --------------------------------------------------------------- */
  const RATIO_CTX = [
    [
      "Sundaes",
      "Helados",
      "sundaes",
      "helados",
      "Ounces of sauce",
      "Onzas de salsa",
      "ounces of sauce",
      "onzas de salsa",
    ],
    [
      "Cups of flour",
      "Tazas de harina",
      "cups of flour",
      "tazas de harina",
      "Cups of milk",
      "Tazas de leche",
      "cups of milk",
      "tazas de leche",
    ],
    ["Bracelets", "Pulseras", "bracelets", "pulseras", "Beads", "Cuentas", "beads", "cuentas"],
    ["Hours", "Horas", "hours", "horas", "Miles", "Millas", "miles", "millas"],
    ["Tickets", "Boletos", "tickets", "boletos", "Dollars", "Dólares", "dollars", "dólares"],
    ["Batches", "Tandas", "batches", "tandas", "Eggs", "Huevos", "eggs", "huevos"],
    ["Boxes", "Cajas", "boxes", "cajas", "Pencils", "Lápices", "pencils", "lápices"],
    ["Tables", "Mesas", "tables", "mesas", "Chairs", "Sillas", "chairs", "sillas"],
  ];
  const evenUp = (n) => n + (n % 2);
  function rowOf(h, hEs, cells) {
    return { h, hEs, cells };
  }
  function mkRatio(rng, lv, _p) {
    const c = rng.pick(RATIO_CTX);
    const bases =
      lv === 1
        ? [
            [1, 2],
            [1, 3],
            [1, 2],
            [1, 3],
            [1, 4],
          ]
        : [
            [2, 3],
            [3, 2],
            [3, 4],
            [4, 3],
            [2, 5],
            [2, 1],
            [3, 5],
            [4, 5],
            [5, 2],
            [5, 3],
          ];
    let a;
    let b;
    let M;
    for (let i = 0; i < 50; i++) {
      [a, b] = rng.pick(bases);
      M = lv === 4 ? 5 : 4;
      while (M > 3 && (a * M > 10 || b * M > 12)) M--;
      if (a * M <= 10 && b * M <= 12) break;
    }
    const ms = Array.from({ length: M }, (_, i) => i + 1);
    const pairs = ms.map((m) => [a * m, b * m]);
    // which cells are blank
    const blank = pairs.map(() => [false, false]);
    if (lv === 3) for (let i = 1; i < M; i++) blank[i][1] = true;
    if (lv === 4) {
      const idx = rng.shuffle(ms.map((_, i) => i).slice(1));
      idx.slice(0, Math.max(2, M - 2)).forEach((i) => {
        blank[i][rng.int(0, 1)] = true;
      });
    }
    const g = grid(0, evenUp(Math.max(6, a * M + 1)), 0, evenUp(Math.max(6, b * M + 1)));
    const fm = (r, k) => (blank[r][k] ? "?" : String(pairs[r][k]));
    const [qEn, qEs] = bi(
      `The ratio of ${c[2]} to ${c[6]} is ${a} : ${b}. Plot each pair from the table as a point (${c[2]}, ${c[6]}). ¦ La razón de ${c[3]} a ${c[7]} es ${a} : ${b}. Marca cada par de la tabla como un punto (${c[3]}, ${c[7]}).`,
    );
    const swapped = pairs.map((q) => [q[1], q[0]]);
    const additive = ms.map((m) => [a * m, b + (a * m - a)]);
    const alts = [
      {
        tag: "swapped",
        pts: swapped,
        say: "Your x and y are swapped. The first quantity goes along the x-axis. ",
        sayEs: "Tus x y y están cambiadas. La primera cantidad va por el eje x. ",
      },
      {
        tag: "added-instead",
        pts: additive,
        say: "Your points add the same amount each time instead of keeping the ratio. Equivalent ratios multiply both numbers by the same amount. ",
        sayEs:
          "Tus puntos suman la misma cantidad cada vez en lugar de mantener la razón. Las razones equivalentes multiplican ambos números por el mismo factor. ",
      },
    ].filter((x) => !sameSet(x.pts, pairs));
    return {
      ...pack({
        q: `${qEn} ¦ ${qEs}`,
        x: `Each pair keeps the ratio ${a} : ${b}, so the points lie on a straight line through (0, 0). ¦ Cada par mantiene la razón ${a} : ${b}, así que los puntos están en una recta que pasa por (0, 0).`,
        h: [
          "Each pair is (first quantity, second quantity). The first number goes along the x-axis. ¦ Cada par es (primera cantidad, segunda cantidad). El primer número va por el eje x.",
          lv >= 3
            ? "Fill the blanks first. Multiply or divide both numbers of the ratio by the same amount. ¦ Primero llena los espacios en blanco. Multiplica o divide los dos números de la razón por el mismo factor."
            : "Plot one pair at a time: go right for x, then up for y. ¦ Marca un par a la vez: ve a la derecha para x y luego arriba para y.",
          "When you finish, your points should line up in a straight line through (0, 0). ¦ Al terminar, tus puntos deben quedar en una recta que pasa por (0, 0).",
        ],
      }),
      grid: g,
      want: pairs,
      given: [],
      line: true,
      ax: { x: c[0], xEs: c[1], y: c[4], yEs: c[5] },
      table: [
        rowOf(
          c[0],
          c[1],
          pairs.map((_, r) => fm(r, 0)),
        ),
        rowOf(
          c[4],
          c[5],
          pairs.map((_, r) => fm(r, 1)),
        ),
      ],
      far: bi(
        "Check that each point keeps the same ratio. The y-value should always be the same number of times the x-value. ¦ Revisa que cada punto mantenga la misma razón. El valor y debe ser siempre la misma cantidad de veces el valor x.",
      ),
      alts,
    };
  }

  const MUL_CTX = [
    [
      "A taxi charges $K for each mile.",
      "Un taxi cobra $K por cada milla.",
      "m",
      "c",
      "Miles",
      "Millas",
      "Cost ($)",
      "Costo ($)",
      true,
    ],
    [
      "Each ticket costs $K.",
      "Cada boleto cuesta $K.",
      "t",
      "c",
      "Tickets",
      "Boletos",
      "Cost ($)",
      "Costo ($)",
      true,
    ],
    [
      "A snail crawls K inches every minute.",
      "Un caracol avanza K pulgadas cada minuto.",
      "m",
      "d",
      "Minutes",
      "Minutos",
      "Inches",
      "Pulgadas",
      false,
    ],
    [
      "Each bracelet uses K beads.",
      "Cada pulsera usa K cuentas.",
      "b",
      "n",
      "Bracelets",
      "Pulseras",
      "Beads",
      "Cuentas",
      false,
    ],
    [
      "A plant grows K centimeters each week.",
      "Una planta crece K centímetros cada semana.",
      "w",
      "h",
      "Weeks",
      "Semanas",
      "Growth (cm)",
      "Crecimiento (cm)",
      false,
    ],
    [
      "Mia reads K pages every minute.",
      "Mia lee K páginas cada minuto.",
      "m",
      "p",
      "Minutes",
      "Minutos",
      "Pages",
      "Páginas",
      false,
    ],
  ];
  const ADD_CTX = [
    [
      "Ana is K years older than her brother.",
      "Ana tiene K años más que su hermano.",
      "b",
      "a",
      "Brother's age",
      "Edad del hermano",
      "Ana's age",
      "Edad de Ana",
    ],
    [
      "A tree is K feet taller than a fence.",
      "Un árbol mide K pies más que una cerca.",
      "f",
      "t",
      "Fence (ft)",
      "Cerca (pies)",
      "Tree (ft)",
      "Árbol (pies)",
    ],
    [
      "Tom scored K more points than Lia.",
      "Tom anotó K puntos más que Lia.",
      "l",
      "t",
      "Lia's points",
      "Puntos de Lia",
      "Tom's points",
      "Puntos de Tom",
    ],
    [
      "Jo has K stickers and then gets more.",
      "Jo tiene K calcomanías y luego recibe más.",
      "s",
      "t",
      "New stickers",
      "Calcomanías nuevas",
      "Total stickers",
      "Total de calcomanías",
    ],
    [
      "A kite string is K meters long before more is let out.",
      "Una cuerda de cometa mide K metros antes de soltar más.",
      "e",
      "t",
      "Extra (m)",
      "Extra (m)",
      "Total (m)",
      "Total (m)",
    ],
  ];
  function mkTable(rng, lv, _p) {
    const add = lv === 1 ? rng.chance(0.4) : rng.chance(0.5);
    const rev = lv === 4 && rng.chance(0.6);
    let k;
    let xs;
    if (add) {
      k = lv === 3 ? rng.pick([0.5, 1.5, 2.5]) : lv === 1 ? rng.int(1, 4) : rng.int(2, 6);
      xs =
        lv === 1
          ? [1, 2, 3, 4]
          : rng.pick([
              [0, 1, 2, 3],
              [1, 2, 3, 4],
              [2, 4, 6, 8],
            ]);
      if (lv === 4)
        xs = rng.pick([
          [2, 3, 5, 6],
          [1, 4, 6, 8],
          [0, 2, 5, 7],
        ]);
    } else {
      k = lv === 3 ? rng.pick([0.5, 1.5, 2.5]) : lv === 1 ? rng.pick([2, 3]) : rng.int(2, 5);
      xs =
        lv === 1
          ? [1, 2, 3, 4]
          : lv === 3
            ? [2, 4, 6, 8]
            : lv === 4
              ? rng.pick([
                  [1, 2, 4, 5],
                  [2, 3, 4, 6],
                  [1, 3, 4, 5],
                ])
              : rng.pick([
                  [1, 2, 3],
                  [0, 1, 2, 3],
                ]);
      if (k * xs[xs.length - 1] > 16) xs = xs.slice(0, 3);
    }
    if (lv === 3 && !add && k === 2.5) xs = [2, 4, 6];
    const ys = xs.map((x) => (add ? x + k : k * x));
    const pairs = xs.map((x, i) => [x, ys[i]]);
    const ctx = add ? rng.pick(ADD_CTX) : rng.pick(MUL_CTX.filter((c) => lv !== 3 || !c[8]));
    const kk = mn(k);
    const [vx, vy] = [ctx[2], ctx[3]];
    const rule = add ? `${vy} = ${vx} + ${mn(k)}` : `${vy} = ${mn(k)}${vx}`;
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const sy = ys.some((y) => !Number.isInteger(y)) ? 0.5 : 1;
    const g = grid(
      0,
      evenUp(Math.max(5, Math.ceil(maxX) + 1)),
      0,
      evenUp(Math.max(6, Math.ceil(maxY) + 1)),
      1,
      sy,
    );
    const xl = xs.map(mn);
    const yl = ys.map(mn);
    const given = rev ? yl : xl;
    const qs = ctx[0].replace("K", kk);
    const qsEs = ctx[1].replace("K", kk);
    const askEn = rev
      ? `The rule is ${rule}. The ${vy}-values are in the table. Find each ${vx} and plot (${vx}, ${vy}).`
      : `The rule is ${rule}. Work out each ${vy} and plot (${vx}, ${vy}) for ${vx} = ${xl.join(", ")}.`;
    const askEs = rev
      ? `La regla es ${rule}. Los valores de ${vy} están en la tabla. Halla cada ${vx} y marca (${vx}, ${vy}).`
      : `La regla es ${rule}. Halla cada ${vy} y marca (${vx}, ${vy}) para ${vx} = ${xl.join(", ")}.`;
    const alts = [
      {
        tag: "swapped",
        pts: pairs.map((q) => [q[1], q[0]]),
        say: "Your x and y are swapped. The input goes along the x-axis. ",
        sayEs: "Tus x y y están cambiadas. La entrada va por el eje x. ",
      },
      add
        ? {
            tag: "multiplied-instead",
            pts: xs.map((x) => [x, k * x]),
            say: `It looks like you multiplied. The rule ${rule} adds ${mn(k)} to ${vx}. `,
            sayEs: `Parece que multiplicaste. La regla ${rule} suma ${mn(k)} a ${vx}. `,
          }
        : {
            tag: "added-instead",
            pts: xs.map((x) => [x, x + k]),
            say: `It looks like you added. The rule ${rule} multiplies ${vx} by ${mn(k)}. `,
            sayEs: `Parece que sumaste. La regla ${rule} multiplica ${vx} por ${mn(k)}. `,
          },
    ].filter((x) => !sameSet(x.pts, pairs));
    return {
      ...pack({
        q: `${qs} ${askEn} ¦ ${qsEs} ${askEs}`,
        x: `${rev ? `Work backward from each ${vy}. ` : ""}${add ? `Add ${mn(k)} to each ${vx}` : `Multiply each ${vx} by ${mn(k)}`}: ${pairs.map(P).join(", ")}. ¦ ${rev ? `Trabaja hacia atrás desde cada ${vy}. ` : ""}${add ? `Suma ${mn(k)} a cada ${vx}` : `Multiplica cada ${vx} por ${mn(k)}`}: ${pairs.map(P).join(", ")}.`,
        h: [
          rev
            ? "You know the output. Undo the rule to find the input. ¦ Ya conoces la salida. Deshaz la regla para hallar la entrada."
            : "The rule tells you how to get y from x. Work out y for each x first. ¦ La regla dice cómo obtener y a partir de x. Primero halla y para cada x.",
          `${add ? "Adding" : "Multiplying"}: ${rev ? "check one pair by putting your x back into the rule" : "try the first input in the rule and see what you get"}. ¦ ${add ? "Sumar" : "Multiplicar"}: ${rev ? "revisa un par poniendo tu x de nuevo en la regla" : "prueba la primera entrada en la regla y mira qué obtienes"}.`,
          "Plot each pair (x, y): go right for x, then up for y. ¦ Marca cada par (x, y): ve a la derecha para x y luego arriba para y.",
        ],
      }),
      grid: g,
      want: pairs,
      given: [],
      ax: { x: ctx[4], xEs: ctx[5], y: ctx[6], yEs: ctx[7] },
      table: [
        rowOf(`${ctx[4]} (${vx})`, `${ctx[5]} (${vx})`, rev ? xs.map(() => "?") : given),
        rowOf(`${ctx[6]} (${vy})`, `${ctx[7]} (${vy})`, rev ? given : ys.map(() => "?")),
      ],
      rule,
      far: bi(
        `Check each point against the rule ${rule}. Work out y for that x again. ¦ Revisa cada punto con la regla ${rule}. Vuelve a hallar y para esa x.`,
      ),
      alts,
    };
  }

  /* ---- grading ------------------------------------------------------------------------------ */
  const MISS = {
    none: "Tap the grid to place a point first. ¦ Toca la cuadrícula para colocar un punto primero.",
    swap: "Your x and y look swapped: you used the first number to go up or down, but the first number tells you to move along the x-axis. ¦ Tus coordenadas x e y parecen estar cambiadas: usaste el primer número para subir o bajar, pero el primer número te mueve por el eje x.",
    sx: "Check the sign of x. A negative x goes left of the y-axis. A positive x goes right. ¦ Revisa el signo de x. Una x negativa va a la izquierda del eje y. Una x positiva va a la derecha.",
    sy: "Check the sign of y. A negative y goes below the x-axis. A positive y goes above. ¦ Revisa el signo de y. Una y negativa va debajo del eje x. Una y positiva va arriba.",
    sxy: "Check the signs of both numbers. A negative x goes left and a negative y goes down. ¦ Revisa los signos de los dos números. Una x negativa va a la izquierda y una y negativa va hacia abajo.",
    xok: "Your x-coordinate is on target, but your y is not. Count again how far up or down. ¦ Tu coordenada x está bien, pero tu y no. Cuenta de nuevo cuánto subir o bajar.",
    yok: "Your y-coordinate is on target, but your x is not. Count again how far left or right. ¦ Tu coordenada y está bien, pero tu x no. Cuenta de nuevo cuánto ir a la izquierda o a la derecha.",
    off: "Close! Recount from the origin, and do not count the starting spot as 1. ¦ ¡Cerca! Cuenta otra vez desde el origen y no cuentes el punto de partida como 1.",
    round:
      "It looks like you rounded. A half sits exactly between two grid lines. ¦ Parece que redondeaste. Una mitad queda justo entre dos líneas de la cuadrícula.",
    many: "That is too many points. Tap a point to take it off. ¦ Son demasiados puntos. Toca un punto para quitarlo.",
  };
  const miss = (tag, s) => {
    const [say, sayEs] = typeof s === "string" ? bi(s) : s;
    return { ok: false, tag, say, sayEs };
  };
  function clean(/** @type {any} */ state) {
    /** @type {number[][]} */
    const out = [];
    for (const q of (state && state.pts) || []) {
      const p = [Number(q && q[0]), Number(q && q[1])];
      if (Number.isFinite(p[0]) && Number.isFinite(p[1]) && !has(out, p)) out.push(p);
    }
    return out;
  }
  function gradePlot(/** @type {any} */ spec, /** @type {any} */ state) {
    const pts = clean(state);
    const want = spec.want;
    if (!pts.length) return miss("no-point", MISS.none);
    if (sameSet(pts, want)) return { ok: true };
    const alt = (spec.alts || []).find((a) => sameSet(pts, a.pts));
    if (alt) return miss(alt.tag, [alt.say.trim(), alt.sayEs.trim()]);
    const n = want.length;
    if (pts.length < n) {
      const left = pts.length === 1 ? ["point", "punto"] : ["points", "puntos"];
      return miss("too-few", [
        `You need ${n} points and have placed ${pts.length} ${left[0]}. Place the rest, then check. `.trim(),
        `Necesitas ${n} puntos y has colocado ${pts.length} ${left[1]}. Coloca los que faltan y luego comprueba.`,
      ]);
    }
    if (pts.length > n) return miss("too-many", MISS.many);
    if (n === 1 && spec.mode === "point") {
      const [px, py] = pts[0];
      const [tx, ty] = want[0];
      if (near(px, ty) && near(py, tx)) return miss("swapped", MISS.swap);
      if (near(px, -tx) && near(py, -ty)) return miss("both-signs", MISS.sxy);
      if (near(px, -tx) && near(py, ty)) return miss("x-sign", MISS.sx);
      if (near(px, tx) && near(py, -ty)) return miss("y-sign", MISS.sy);
      if (spec.grid.sx < 1 && near(px, Math.round(tx)) && near(py, Math.round(ty)))
        return miss("rounded", MISS.round);
      if (Math.abs(px - tx) + Math.abs(py - ty) <= 1.0001) return miss("off-by-one", MISS.off);
      if (near(px, tx)) return miss("x-only", MISS.xok);
      if (near(py, ty)) return miss("y-only", MISS.yok);
      return miss("far", spec.far);
    }
    const k = pts.filter((q) => has(want, q)).length;
    if (pts.some((q) => !has(want, q) && has(want, [q[1], q[0]]) && !near(q[0], q[1])))
      return miss("swapped", MISS.swap);
    if (k > 0) {
      return miss("partial", [
        `${k} of your ${n} points are in the right place. Look again at the others. `.trim(),
        `${k} de tus ${n} puntos están en el lugar correcto. Mira otra vez los demás.`,
      ]);
    }
    return miss("far", spec.far);
  }
  function wrongPlot(/** @type {any} */ spec, /** @type {any} */ rng) {
    const want = spec.want;
    const out = [];
    const add = (/** @type {number[][]} */ pts) => {
      if (!sameSet(pts, want) && !out.some((o) => sameSet(o.pts, pts))) out.push({ pts });
    };
    for (const a of spec.alts || []) add(a.pts);
    add(want.map((q) => [q[1], q[0]]));
    add(want.map((q) => [-q[0], q[1]]));
    add(
      want
        .map((q) => [q[0], q[1] + spec.grid.sy])
        .slice(0, 1)
        .concat(want.slice(1)),
    );
    add(want.slice(0, -1));
    add([]);
    return rng.shuffle(out).slice(0, 4);
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.sp{display:grid;gap:12px;max-width:640px;color:var(--ink,#1B2733)}
.sp-tbl{border-collapse:collapse;font-size:.95rem;max-width:100%;background:var(--surface,#fff)}
.sp-tbl th,.sp-tbl td{border:2px solid var(--border,#D5DCE5);padding:6px 10px;text-align:center;min-width:44px;font-weight:700}
.sp-tbl th{background:var(--brand-tint,#E5ECF3);color:var(--brand,#2C4A68);text-align:left}
.sp-tbl .sp-blank{color:var(--brand,#2C4A68);border-style:dashed;font-weight:800}
.sp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.sp-plane{touch-action:pan-y;background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);cursor:crosshair;line-height:0;overflow:hidden;user-select:none;-webkit-user-select:none}
.sp-solved .sp-plane{cursor:default}
.sp-plane:focus-visible,.sp-btn:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.sp-plane svg{display:block;width:100%;height:auto}
.sp-grid{stroke:var(--border,#D5DCE5);stroke-width:1}
.sp-minor{stroke:var(--border,#D5DCE5);stroke-width:1;stroke-dasharray:2 4}
.sp-axis{stroke:var(--ink,#1B2733);stroke-width:2.2}
.sp-arrow{fill:var(--ink,#1B2733)}
.sp-mirror{stroke:var(--sun,#F0BD4F);stroke-width:7;opacity:.8}
.sp-lab{fill:var(--ink,#1B2733);font:600 11px system-ui,sans-serif;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:3px}
.sp-title{fill:var(--brand,#2C4A68);font:800 13px system-ui,sans-serif;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:3px}
.sp-pt{fill:var(--brand,#2C4A68);stroke:var(--surface,#fff);stroke-width:2.5}
.sp-pt.ok{fill:var(--ok,#0A7D4B)}
.sp-pt.bad{fill:var(--bad,#B42318)}
.sp-given{fill:var(--sun,#F0BD4F);stroke:var(--ink,#1B2733);stroke-width:2}
.sp-glyph{fill:var(--surface,#fff);font:800 11px system-ui,sans-serif;text-anchor:middle;dominant-baseline:central}
.sp-ghost{fill:none;stroke:var(--brand,#2C4A68);stroke-width:2;stroke-dasharray:3 3}
.sp-cur{fill:none;stroke:var(--ink,#1B2733);stroke-width:3}
.sp-curh{fill:none;stroke:var(--sun,#F0BD4F);stroke-width:7}
.sp-shape{fill:color-mix(in srgb,var(--brand,#2C4A68) 14%,transparent);stroke:var(--brand,#2C4A68);stroke-width:2;stroke-dasharray:6 4}
.sp-solved .sp-shape{fill:color-mix(in srgb,var(--ok,#0A7D4B) 16%,transparent);stroke:var(--ok,#0A7D4B);stroke-dasharray:none}
.sp-line,.sp-link{fill:none;stroke:var(--brand,#2C4A68);stroke-width:2.5;stroke-dasharray:7 5}
.sp-solved .sp-line{stroke-dasharray:none;stroke:var(--ok,#0A7D4B)}
.sp-link{stroke:var(--ok,#0A7D4B);stroke-width:2}
.sp-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.sp-btn{appearance:none;font:inherit;font-weight:800;min-height:48px;min-width:48px;padding:8px 18px;border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--brand,#2C4A68);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}
.sp-btn:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.sp-btn.go,.sp-btn.go:hover:not([disabled]){background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.sp-btn.go:hover:not([disabled]){filter:brightness(.88)}
.sp-btn[disabled]{opacity:.5;cursor:not-allowed}
.sp-btn .es-text{color:inherit;font-size:.75em;margin:0;font-weight:600}
.sp-pad{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.sp-pad[hidden]{display:none}
.sp-note:empty{display:none}
.sp-note{margin:0;font-weight:700;color:var(--ink,#1B2733);min-height:1.4em}
.sp-note .es-text{color:var(--brand,#2C4A68)}
.sp-ok{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;border:2px solid var(--ok,#0A7D4B);color:color-mix(in srgb,var(--ok,#0A7D4B) 55%,var(--ink,#1B2733));background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff));font-weight:800}
@media (prefers-reduced-motion:no-preference){.sp-pt.new{transform-box:fill-box;transform-origin:center;animation:sp-pop .2s ease-out}@keyframes sp-pop{from{transform:scale(.4)}to{transform:scale(1)}}}
@media (forced-colors:active){.sp-pt{fill:Highlight;stroke:Canvas}.sp-given{fill:Canvas;stroke:CanvasText}.sp-axis,.sp-grid,.sp-line,.sp-link,.sp-shape,.sp-cur{stroke:CanvasText}.sp-lab,.sp-title,.sp-arrow{fill:CanvasText}.sp-glyph{fill:Canvas}.sp-btn{border-color:ButtonText}}
`;
  const r1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
  const GLYPH = { ok: "✓", bad: "✕" };

  function mountPlot(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("plot", CSS);
    const g = spec.grid;
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const T = (/** @type {string} */ en, /** @type {string} */ esT) => A.t(en, esT);
    let solved = !!api.solved;
    /** @type {number[][]} */
    let pts = ((api.restore && api.restore.pts) || []).map((/** @type {any} */ q) => [
      Number(q[0]),
      Number(q[1]),
    ]);
    let cur = [0, 0];
    /** @type {number[]|null} */
    let ghost = null;
    /** @type {boolean[]|null} */
    let marks = null;
    let showCur = false;
    let fresh = -1;
    let geo = { W: 0, ML: 0, MT: 0, ux: 1, uy: 1 };
    /** @type {any} */
    let down = null;

    host.textContent = "";
    const root = A.el("div", `sp${solved ? " sp-solved" : ""}`);
    const helpId = `sp-help-${Math.random().toString(36).slice(2, 8)}`;
    if (spec.table) {
      const rows = spec.table
        .map(
          (/** @type {any} */ r) =>
            `<tr><th scope="row">${T(r.h, r.hEs)}</th>${r.cells.map((/** @type {string} */ c) => `<td${c === "?" ? ' class="sp-blank"' : ""}>${c}</td>`).join("")}</tr>`,
        )
        .join("");
      root.append(
        A.el(
          "table",
          "sp-tbl",
          `<caption class="sp-sr">${T("Table of values", "Tabla de valores")}</caption><tbody>${rows}</tbody>`,
        ),
      );
    }
    const plane = A.el("div", "sp-plane", "", { tabindex: solved ? "-1" : "0" });
    const help = A.el("p", "sp-sr", "", { id: helpId });
    const pad = A.el("div", "sp-pad");
    const note = A.el("p", "sp-note");
    const bar = A.el("div", "sp-bar");
    const checkBtn = A.el("button", "sp-btn go", T("Check", "Comprobar"), { type: "button" });
    const clearBtn = A.el("button", "sp-btn", T("Clear points", "Borrar puntos"), {
      type: "button",
    });
    const badge = A.el("span", "sp-ok", `✓ ${T("Solved", "Resuelto")}`);
    const padBtn = (
      /** @type {string} */ k,
      /** @type {string} */ glyph,
      /** @type {string} */ en,
      /** @type {string} */ esT,
    ) => {
      const b = A.el("button", "sp-btn", glyph, { type: "button", "data-k": k });
      b.dataset.en = en;
      b.dataset.es = esT;
      return b;
    };
    const pads = [
      padBtn("left", "←", "Move cursor left", "Mover el cursor a la izquierda"),
      padBtn("up", "↑", "Move cursor up", "Mover el cursor hacia arriba"),
      padBtn("down", "↓", "Move cursor down", "Mover el cursor hacia abajo"),
      padBtn("right", "→", "Move cursor right", "Mover el cursor a la derecha"),
    ];
    const placeBtn = A.el("button", "sp-btn", T("Place or remove", "Poner o quitar"), {
      type: "button",
      "data-k": "place",
    });
    pad.append(...pads, placeBtn);
    bar.append(solved ? badge : checkBtn, ...(solved ? [] : [clearBtn]));
    root.append(plane, help, ...(solved ? [] : [pad, note]), bar);
    host.append(root);

    const labels = () => {
      const given = (spec.given || []).map((/** @type {any} */ q) => `${q.l} ${P(q.p)}`).join(", ");
      plane.setAttribute(
        "aria-label",
        solved
          ? L(
              `Coordinate plane with the answer points ${pts.map(P).join(", ")}.`,
              `Plano cartesiano con los puntos de la respuesta ${pts.map(P).join(", ")}.`,
            )
          : L(
              "Coordinate plane. Use the arrow keys to move the cursor. Press Enter or Space to place or remove a point.",
              "Plano cartesiano. Usa las flechas para mover el cursor. Presiona Enter o Espacio para poner o quitar un punto.",
            ),
      );
      plane.setAttribute("role", solved ? "img" : "application");
      plane.setAttribute("aria-describedby", helpId);
      help.textContent = L(
        `The x-axis runs from ${mn(g.x0)} to ${mn(g.x1)} and the y-axis from ${mn(g.y0)} to ${mn(g.y1)}. ${given ? `Given points: ${given}.` : ""} Tap a grid crossing to place a point. Tap a point to remove it.`,
        `El eje x va de ${mn(g.x0)} a ${mn(g.x1)} y el eje y de ${mn(g.y0)} a ${mn(g.y1)}. ${given ? `Puntos dados: ${given}.` : ""} Toca el cruce de la cuadrícula para poner un punto. Toca un punto para quitarlo.`,
      );
      for (const b of pads) b.setAttribute("aria-label", L(b.dataset.en, b.dataset.es));
      placeBtn.setAttribute(
        "aria-label",
        L("Place or remove a point at the cursor", "Poner o quitar un punto en el cursor"),
      );
    };

    const spanX = g.x1 - g.x0;
    const spanY = g.y1 - g.y0;
    function draw() {
      const W = Math.max(
        260,
        Math.min(620, Math.round(plane.clientWidth || host.clientWidth || 340)),
      );
      const titles = !!spec.ax;
      const ML = titles ? 48 : 34;
      const MR = 20;
      const MT = 20;
      const MB = titles ? 46 : 30;
      const ux = (W - ML - MR) / spanX;
      const uy = Math.max(18, Math.min(ux, 48, 440 / spanY));
      const H = MT + spanY * uy + MB;
      geo = { W, ML, MT, ux, uy };
      const X = (/** @type {number} */ x) => r1(ML + (x - g.x0) * ux);
      const Y = (/** @type {number} */ y) => r1(MT + (g.y1 - y) * uy);
      const s = [];
      for (let x = Math.ceil(g.x0); x <= g.x1; x++)
        s.push(`<line class="sp-grid" x1="${X(x)}" y1="${Y(g.y1)}" x2="${X(x)}" y2="${Y(g.y0)}"/>`);
      for (let y = Math.ceil(g.y0); y <= g.y1; y++)
        s.push(`<line class="sp-grid" x1="${X(g.x0)}" y1="${Y(y)}" x2="${X(g.x1)}" y2="${Y(y)}"/>`);
      if (g.sx < 1)
        for (let x = g.x0 + g.sx; x < g.x1; x += 1)
          s.push(
            `<line class="sp-minor" x1="${X(x)}" y1="${Y(g.y1)}" x2="${X(x)}" y2="${Y(g.y0)}"/>`,
          );
      if (g.sy < 1)
        for (let y = g.y0 + g.sy; y < g.y1; y += 1)
          s.push(
            `<line class="sp-minor" x1="${X(g.x0)}" y1="${Y(y)}" x2="${X(g.x1)}" y2="${Y(y)}"/>`,
          );
      for (const ax of spec.axes || []) {
        s.push(
          ax === "x"
            ? `<line class="sp-mirror" x1="${X(g.x0)}" y1="${Y(0)}" x2="${X(g.x1)}" y2="${Y(0)}"/>`
            : `<line class="sp-mirror" x1="${X(0)}" y1="${Y(g.y0)}" x2="${X(0)}" y2="${Y(g.y1)}"/>`,
        );
      }
      const ex = r1(X(g.x1) + 12);
      const ey = r1(Y(g.y1) - 12);
      s.push(
        `<line class="sp-axis" x1="${X(g.x0) - (g.x0 < 0 ? 12 : 0)}" y1="${Y(0)}" x2="${ex}" y2="${Y(0)}"/><line class="sp-axis" x1="${X(0)}" y1="${Y(g.y0) + (g.y0 < 0 ? 12 : 0)}" x2="${X(0)}" y2="${ey}"/>`,
      );
      s.push(
        `<path class="sp-arrow" d="M${ex + 4} ${Y(0)} l-9 -5 v10z M${X(0)} ${ey - 4} l-5 9 h10z"/>`,
      );
      if (g.x0 < 0) s.push(`<path class="sp-arrow" d="M${X(g.x0) - 16} ${Y(0)} l9 -5 v10z"/>`);
      if (g.y0 < 0) s.push(`<path class="sp-arrow" d="M${X(0)} ${Y(g.y0) + 16} l-5 -9 h10z"/>`);
      const lx = ux >= 22 ? 1 : 2;
      const ly = uy >= 20 ? 1 : 2;
      for (let x = Math.ceil(g.x0); x <= g.x1; x++)
        if (x !== 0 && x % lx === 0)
          s.push(
            `<text class="sp-lab" x="${X(x)}" y="${Y(0) + 15}" text-anchor="middle">${mn(x)}</text>`,
          );
      for (let y = Math.ceil(g.y0); y <= g.y1; y++)
        if (y !== 0 && y % ly === 0)
          s.push(
            `<text class="sp-lab" x="${X(0) - 6}" y="${Y(y) + 4}" text-anchor="end">${mn(y)}</text>`,
          );
      s.push(`<text class="sp-lab" x="${X(0) - 6}" y="${Y(0) + 15}" text-anchor="end">0</text>`);
      if (titles) {
        s.push(
          `<text class="sp-title" x="${r1(ML + (spanX * ux) / 2)}" y="${H - 8}" text-anchor="middle">${es() ? spec.ax.xEs : spec.ax.x}</text>`,
        );
        s.push(
          `<text class="sp-title" transform="translate(13 ${r1(MT + (spanY * uy) / 2)}) rotate(-90)" text-anchor="middle">${es() ? spec.ax.yEs : spec.ax.y}</text>`,
        );
      } else {
        s.push(
          `<text class="sp-title" x="${ex - 4}" y="${Y(0) - 10}" text-anchor="end">x</text><text class="sp-title" x="${X(0) + 12}" y="${ey + 6}">y</text>`,
        );
      }
      // shape and line previews
      const all = [...(spec.given || []).map((/** @type {any} */ q) => q.p), ...pts];
      const total = (spec.given || []).length + spec.want.length;
      if (spec.mode === "polygon" && all.length === total && total >= 3) {
        const cx = all.reduce((a, q) => a + q[0], 0) / total;
        const cy = all.reduce((a, q) => a + q[1], 0) / total;
        const ord = all
          .slice()
          .sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
        s.push(
          `<polygon class="sp-shape" points="${ord.map((q) => `${X(q[0])},${Y(q[1])}`).join(" ")}"/>`,
        );
      }
      if (
        spec.line &&
        pts.length >= 2 &&
        pts.every((q) => q[0] > 0 && q[1] > 0 && near(q[0] * pts[0][1], q[1] * pts[0][0]))
      ) {
        const t = Math.min(g.x1 / pts[0][0], g.y1 / pts[0][1]);
        s.push(
          `<line class="sp-line" x1="${X(0)}" y1="${Y(0)}" x2="${X(pts[0][0] * t)}" y2="${Y(pts[0][1] * t)}"/>`,
        );
      }
      if (solved && spec.mode === "reflect") {
        let from = spec.given[0].p;
        for (const q of spec.want) {
          s.push(
            `<line class="sp-link" x1="${X(from[0])}" y1="${Y(from[1])}" x2="${X(q[0])}" y2="${Y(q[1])}"/>`,
          );
          from = q;
        }
      }
      if (solved && spec.mode === "distance")
        for (const q of spec.want)
          s.push(
            `<line class="sp-link" x1="${X(spec.given[0].p[0])}" y1="${Y(spec.given[0].p[1])}" x2="${X(q[0])}" y2="${Y(q[1])}"/>`,
          );
      if (solved && spec.mode === "point" && pts[0])
        s.push(
          `<line class="sp-link" x1="${X(pts[0][0])}" y1="${Y(pts[0][1])}" x2="${X(pts[0][0])}" y2="${Y(0)}"/><line class="sp-link" x1="${X(pts[0][0])}" y1="${Y(pts[0][1])}" x2="${X(0)}" y2="${Y(pts[0][1])}"/>`,
        );
      for (const q of spec.given || []) {
        const x = X(q.p[0]);
        const y = Y(q.p[1]);
        s.push(
          `<path class="sp-given" d="M${x} ${y - 10} L${x + 10} ${y} L${x} ${y + 10} L${x - 10} ${y}Z"/><text class="sp-lab" x="${x + 13}" y="${y - 10}" style="font-size:13px;font-weight:800">${q.l}</text>`,
        );
      }
      pts.forEach((q, i) => {
        const m = solved ? "ok" : marks ? (marks[i] ? "ok" : "bad") : "";
        const x = X(q[0]);
        const y = Y(q[1]);
        s.push(
          `<circle class="sp-pt ${m}${i === fresh ? " new" : ""}" cx="${x}" cy="${y}" r="9"/>${m ? `<text class="sp-glyph" x="${x}" y="${y}">${GLYPH[m === "ok" ? "ok" : "bad"]}</text>` : ""}`,
        );
        if (solved && spec.mode === "reflect")
          s.push(
            `<text class="sp-lab" x="${x + 13}" y="${y - 10}" style="font-size:13px;font-weight:800">A${"′″"[i] || ""}</text>`,
          );
      });
      if (!solved && ghost)
        s.push(`<circle class="sp-ghost" cx="${X(ghost[0])}" cy="${Y(ghost[1])}" r="9"/>`);
      if (!solved && showCur)
        s.push(
          `<circle class="sp-curh" cx="${X(cur[0])}" cy="${Y(cur[1])}" r="15"/><circle class="sp-cur" cx="${X(cur[0])}" cy="${Y(cur[1])}" r="15"/>`,
        );
      plane.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${r1(H)}" aria-hidden="true" focusable="false">${s.join("")}</svg>`;
      pad.hidden = !(
        ux < 34 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
      );
      checkBtn.disabled = !pts.length;
      clearBtn.disabled = !pts.length;
      fresh = -1;
    }

    const snap = (
      /** @type {number} */ v,
      /** @type {number} */ lo,
      /** @type {number} */ hi,
      /** @type {number} */ st,
    ) => Math.round(Math.max(lo, Math.min(hi, lo + Math.round((v - lo) / st) * st)) * 1e4) / 1e4;
    function toData(/** @type {any} */ ev) {
      const r = plane.getBoundingClientRect();
      const k = geo.W / plane.clientWidth;
      const px = (ev.clientX - r.left - plane.clientLeft) * k;
      const py = (ev.clientY - r.top - plane.clientTop) * k;
      return [
        snap(g.x0 + (px - geo.ML) / geo.ux, g.x0, g.x1, g.sx),
        snap(g.y1 - (py - geo.MT) / geo.uy, g.y0, g.y1, g.sy),
      ];
    }
    const say = (/** @type {string} */ en, /** @type {string} */ esT) =>
      api.say && api.say(L(en, esT));
    function toggle(/** @type {number[]} */ p) {
      marks = null;
      note.textContent = "";
      const i = pts.findIndex((q) => eq(q, p));
      if (i >= 0) {
        pts.splice(i, 1);
        say(`Point removed at ${P(p)}`, `Punto quitado en ${P(p)}`);
      } else if (spec.cap === 1) {
        pts = [p];
        fresh = 0;
        say(`Point placed at ${P(p)}`, `Punto puesto en ${P(p)}`);
      } else if (pts.length >= spec.cap) {
        note.textContent = "";
        note.append(
          A.el(
            "span",
            "",
            T(
              `You have all ${spec.cap} points. Tap a point to take it off.`,
              `Ya tienes los ${spec.cap} puntos. Toca un punto para quitarlo.`,
            ),
          ),
        );
        say(
          `You have all ${spec.cap} points. Remove one first.`,
          `Ya tienes los ${spec.cap} puntos. Quita uno primero.`,
        );
        return;
      } else {
        pts.push(p);
        fresh = pts.length - 1;
        say(`Point placed at ${P(p)}`, `Punto puesto en ${P(p)}`);
      }
      api.change && api.change({ pts: pts.map((q) => q.slice()) });
      draw();
    }

    function check() {
      if (solved || !pts.length) return;
      const state = { pts: pts.map((q) => q.slice()) };
      const out = api.submit && api.submit(state);
      const res =
        out && typeof out === "object" && typeof out.ok === "boolean"
          ? out
          : A.registry.plot.grade(spec, state);
      if (res.ok) {
        solved = true;
        marks = null;
        root.classList.add("sp-solved");
        bar.textContent = "";
        bar.append(badge);
        pad.remove();
        note.remove();
        plane.setAttribute("tabindex", "-1");
        labels();
        say("Correct", "Correcto");
      } else {
        marks = pts.map((q) => has(spec.want, q));
        say(res.say || "Not yet", res.sayEs || res.say || "Todavía no");
      }
      draw();
    }

    const move = (/** @type {string} */ d) => {
      const dx = { left: -g.sx, right: g.sx }[d] || 0;
      const dy = { down: -g.sy, up: g.sy }[d] || 0;
      cur = [snap(cur[0] + dx, g.x0, g.x1, g.sx), snap(cur[1] + dy, g.y0, g.y1, g.sy)];
      showCur = true;
      ghost = null;
      say(`x ${mn(cur[0])}, y ${mn(cur[1])}`, `x ${mn(cur[0])}, y ${mn(cur[1])}`);
      draw();
    };

    if (!solved) {
      plane.addEventListener("keydown", (e) => {
        const d = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }[
          e.key
        ];
        if (d) {
          e.preventDefault();
          move(d);
        } else if (e.key === "Home") {
          e.preventDefault();
          cur = [0, 0];
          move("none");
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(cur.slice());
        } else if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          if (pts.some((q) => eq(q, cur))) toggle(cur.slice());
        }
      });
      plane.addEventListener("focus", () => {
        showCur = true;
        draw();
      });
      plane.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        plane.focus({ preventScroll: true });
        const p = toData(e);
        down = e.pointerId;
        cur = p;
        ghost = p;
        showCur = true;
        draw();
      });
      plane.addEventListener("pointermove", (e) => {
        if (down === null && e.pointerType !== "mouse") return;
        const p = toData(e);
        if (!ghost || !eq(ghost, p)) {
          ghost = p;
          if (down !== null) cur = p;
          draw();
        }
      });
      plane.addEventListener("pointerup", (e) => {
        if (down === null) return;
        down = null;
        const p = toData(e);
        cur = p;
        ghost = e.pointerType === "mouse" ? p : null;
        toggle(p);
      });
      const drop = () => {
        down = null;
        if (ghost) {
          ghost = null;
          draw();
        }
      };
      plane.addEventListener("pointercancel", drop);
      plane.addEventListener("pointerleave", drop);
      pad.addEventListener("click", (e) => {
        const k = /** @type {any} */ (e.target).closest("[data-k]");
        if (!k) return;
        if (k.dataset.k === "place") toggle(cur.slice());
        else move(k.dataset.k);
      });
      checkBtn.addEventListener("click", check);
      clearBtn.addEventListener("click", () => {
        pts = [];
        marks = null;
        note.textContent = "";
        api.change && api.change({ pts: [] });
        say("Points cleared", "Puntos borrados");
        draw();
        plane.focus({ preventScroll: true });
      });
      root.addEventListener("focusout", (e) => {
        if (!root.contains(e.relatedTarget)) {
          showCur = false;
          draw();
        }
      });
    }

    labels();
    draw();
    if (typeof ResizeObserver !== "undefined") {
      let last = plane.clientWidth;
      const ro = new ResizeObserver(() => {
        if (!root.isConnected) return ro.disconnect();
        if (Math.abs(plane.clientWidth - last) > 3) {
          last = plane.clientWidth;
          draw();
        }
      });
      ro.observe(plane);
    }
    if (typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(() => {
        if (!root.isConnected) return mo.disconnect();
        labels();
        draw();
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
  }

  A.register("plot", {
    title: "Plot on the plane",
    titleEs: "Marcar en el plano",
    levels: 4,
    make(rng, level, params) {
      const mode = MODES.includes(params.mode) ? params.mode : rng.pick(MODES);
      const maker = {
        point: mkPoint,
        polygon: mkPoly,
        reflect: mkReflect,
        ratio: mkRatio,
        table: mkTable,
        distance: mkDistance,
      }[mode];
      const s = maker(rng, level, params);
      const cap = s.want.length;
      const inG = (/** @type {number[]} */ q) =>
        q[0] >= s.grid.x0 && q[0] <= s.grid.x1 && q[1] >= s.grid.y0 && q[1] <= s.grid.y1;
      s.alts = (s.alts || []).filter((/** @type {any} */ a) => a.pts.every(inG));
      return { ...s, mode, cap, model: { mode, want: s.want, given: s.given, grid: s.grid } };
    },
    solution: (spec) => ({ pts: spec.want.map((q) => q.slice()) }),
    wrong: wrongPlot,
    grade: gradePlot,
    mount: mountPlot,
  });
})();

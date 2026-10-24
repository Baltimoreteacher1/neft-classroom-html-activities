/**
 * Practice Studio activity: griddetect (window.StudioAct kind "griddetect"), lessons 7-5 to 7-9, "Grid Detective".
 * A point is hidden on the grid. The student first gets a SIGN clue (which side of each axis), then asks by tapping
 * a guess; the answer is only "left, right or same column" and "above, below or same row" of that guess. Questions are limited,
 * and there is no clock. Halving the board with each question finds the point. State: { guesses: [[x, y], ...] }.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.u7 = A.u7 || {});
  const n = (/** @type {number} */ v) => K.n(v);
  const pt = (/** @type {number[]} */ p) => `(${n(p[0])}, ${n(p[1])})`;
  const eq = (/** @type {number[]} */ a, /** @type {number[]} */ b) =>
    a[0] === b[0] && a[1] === b[1];

  /** The clue for a guess: which way the hidden point lies from it. Pure. */
  const reply = (/** @type {number[]} */ secret, /** @type {number[]} */ g) => ({
    h: secret[0] < g[0] ? "left" : secret[0] > g[0] ? "right" : "same",
    v: secret[1] < g[1] ? "below" : secret[1] > g[1] ? "above" : "same",
  });
  const SAY = {
    left: ["to the LEFT of", "a la IZQUIERDA de"],
    right: ["to the RIGHT of", "a la DERECHA de"],
    above: ["ABOVE", "ARRIBA de"],
    below: ["BELOW", "DEBAJO de"],
  };
  /** The sign clue, sign first: "x is negative and y is positive". */
  function signClue(/** @type {number[]} */ s) {
    const w = (/** @type {number} */ v, /** @type {string} */ a) =>
      v < 0
        ? [`${a} is negative`, `${a} es negativa`]
        : v > 0
          ? [`${a} is positive`, `${a} es positiva`]
          : [`${a} is 0`, `${a} es 0`];
    const a = w(s[0], "x");
    const b = w(s[1], "y");
    return [`${a[0]} and ${b[0]}`, `${a[1]} y ${b[1]}`];
  }
  /** The fewest questions a student needs when each guess is the middle of what is left (the strategy the activity teaches). */
  function planFor(/** @type {number[]} */ secret, /** @type {number} */ r) {
    let [x0, x1] = [
      secret[0] < 0 ? -r : secret[0] > 0 ? 1 : 0,
      secret[0] < 0 ? -1 : secret[0] > 0 ? r : 0,
    ];
    let [y0, y1] = [
      secret[1] < 0 ? -r : secret[1] > 0 ? 1 : 0,
      secret[1] < 0 ? -1 : secret[1] > 0 ? r : 0,
    ];
    /** @type {number[][]} */
    const out = [];
    for (let i = 0; i < 40; i++) {
      const g = [Math.floor((x0 + x1) / 2), Math.floor((y0 + y1) / 2)];
      out.push(g);
      if (eq(g, secret)) break;
      const a = reply(secret, g);
      if (a.h === "left") x1 = g[0] - 1;
      else if (a.h === "right") x0 = g[0] + 1;
      else x0 = x1 = g[0];
      if (a.v === "below") y1 = g[1] - 1;
      else if (a.v === "above") y0 = g[1] + 1;
      else y0 = y1 = g[1];
    }
    return out;
  }

  function mkDetect(/** @type {any} */ rng, /** @type {number} */ lv) {
    const r = [5, 7, 9, 10][lv - 1];
    const onAxis = lv === 4 && rng.chance(0.4);
    let x = rng.int(1, r) * rng.pick([-1, 1]);
    let y = rng.int(1, r) * rng.pick([-1, 1]);
    if (onAxis) {
      if (rng.chance(0.5)) x = 0;
      else y = 0;
    }
    const secret = [x, y];
    const plan = planFor(secret, r);
    const limit = plan.length + (lv <= 2 ? 3 : 2);
    const sc = signClue(secret);
    const who = rng.pick([
      ["The treasure", "El tesoro"],
      ["The lost robot", "El robot perdido"],
      ["The hidden drone", "El dron escondido"],
      ["The missing sensor", "El sensor perdido"],
    ]);
    const pack = K.pack({
      q: `${who[0]} is at a hidden point on the grid. Sign clue: ${sc[0]}. Tap a point to ask where the hidden point is from it. You may ask ${limit} questions. Then tap the hidden point itself. ¦ ${who[1]} está en un punto escondido de la cuadrícula. Pista de signos: ${sc[1]}. Toca un punto para preguntar dónde está el punto escondido respecto a él. Puedes hacer ${limit} preguntas. Luego toca el punto escondido.`,
      x: `Each answer rules out a whole side of your guess. Ask in the middle of what is left and the board gets about half as big each time. The hidden point was ${pt(secret)}. ¦ Cada respuesta descarta todo un lado de tu pregunta. Pregunta por el medio de lo que queda y el tablero se hace casi la mitad cada vez. El punto escondido era ${pt(secret)}.`,
      h: [
        "Use the sign clue first. It tells which quadrant, or which axis, to search. ¦ Usa primero la pista de signos. Dice en qué cuadrante, o en qué eje, buscar.",
        "Ask about the middle of the part that is left. Each answer then cuts it about in half. ¦ Pregunta por el medio de la parte que queda. Cada respuesta la corta casi a la mitad.",
        "Left and right answer for x. Above and below answer for y. Use both answers. ¦ Izquierda y derecha responden por x. Arriba y debajo responden por y. Usa las dos respuestas.",
      ],
    });
    return { ...pack, r, secret, limit, signEn: sc[0], signEs: sc[1], model: { secret, r, limit } };
  }

  function gradeDetect(/** @type {any} */ spec, /** @type {any} */ state) {
    const gs = ((state && state.guesses) || []).filter(
      (/** @type {any} */ g) =>
        Array.isArray(g) &&
        g.length === 2 &&
        g.every(Number.isInteger) &&
        Math.abs(g[0]) <= spec.r &&
        Math.abs(g[1]) <= spec.r,
    );
    if (!gs.length)
      return K.miss(
        "no-point",
        "Tap a point on the grid to ask your first question. ¦ Toca un punto de la cuadrícula para hacer tu primera pregunta.",
      );
    const last = gs[gs.length - 1];
    if (eq(last, spec.secret) && gs.length <= spec.limit) return { ok: true };
    if (eq(last, spec.secret))
      return K.miss(
        "multi-step-stopped-early",
        `You found it, but after more than ${spec.limit} questions. Clear and plan: ask about the middle of what is left. ¦ Lo encontraste, pero después de más de ${spec.limit} preguntas. Borra y planea: pregunta por el medio de lo que queda.`,
      );
    if (gs.length >= spec.limit)
      return K.miss(
        "multi-step-stopped-early",
        "All the questions are used. Clear and try again. Ask about the middle of what is left, so each answer cuts the board in half. ¦ Ya usaste todas las preguntas. Borra e inténtalo otra vez. Pregunta por el medio de lo que queda, para que cada respuesta corte el tablero a la mitad.",
      );
    return K.miss(
      "coord-quadrant-mixup",
      "That is not the hidden point yet. Read the answers again: which side of your guess is the hidden point on? ¦ Todavía no es el punto escondido. Lee otra vez las respuestas: ¿de qué lado de tu pregunta está el punto escondido?",
    );
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const c = K.start(host, spec, api, "griddetect");
    const { L, T } = c;
    /** @type {number[][]} */
    let gs =
      c.saved && c.saved.guesses
        ? c.saved.guesses.map((/** @type {number[]} */ p) => p.slice())
        : [];
    const sign = A.el(
      "div",
      "ak-box",
      `${T("Sign clue", "Pista de signos")}: ${T(spec.signEn, spec.signEs)}`,
    );
    const left = A.el("p", "ak-text");
    const log = A.el("ol", "ak-log", "", { "aria-label": "Answers so far" });
    log.style.cssText = "margin:0;padding-left:1.4em";
    const g = K.grid(c, {
      r: spec.r,
      onTap(x, y) {
        const done = gs.some((q) => eq(q, spec.secret));
        if (done) return;
        if (gs.length >= spec.limit) {
          c.note.textContent = L(
            "No questions left. Press Clear to start again.",
            "No quedan preguntas. Presiona Borrar para empezar de nuevo.",
          );
          return;
        }
        c.note.textContent = "";
        gs.push([x, y]);
        const a = reply(spec.secret, [x, y]);
        c.say(
          eq([x, y], spec.secret)
            ? "Found it"
            : `Asked ${pt([x, y])}: ${a.h === "same" ? "same column" : a.h}, ${a.v === "same" ? "same row" : a.v}`,
          eq([x, y], spec.secret) ? "Lo encontraste" : `Preguntaste ${pt([x, y])}`,
        );
        c.emit({ guesses: gs });
        sync();
      },
    });
    function words(/** @type {number[]} */ q) {
      if (eq(q, spec.secret)) return L("Found it!", "¡Lo encontraste!");
      const a = reply(spec.secret, q);
      const at = pt(q);
      const hz =
        a.h === "same"
          ? L(`in the same column as ${at}`, `en la misma columna que ${at}`)
          : L(`${SAY[a.h][0]} ${at}`, `${SAY[a.h][1]} ${at}`);
      const vt =
        a.v === "same"
          ? L(`in the same row as ${at}`, `en la misma fila que ${at}`)
          : L(`${SAY[a.v][0]} ${at}`, `${SAY[a.v][1]} ${at}`);
      return `${L("The hidden point is", "El punto escondido está")} ${hz} ${L("and", "y")} ${vt}.`;
    }
    function sync() {
      log.textContent = "";
      gs.forEach((q) => log.append(A.el("li", "", words(q))));
      left.textContent = c.solved
        ? L(`Found with ${gs.length} questions.`, `Encontrado con ${gs.length} preguntas.`)
        : L(
            `Questions left: ${Math.max(0, spec.limit - gs.length)}`,
            `Preguntas que quedan: ${Math.max(0, spec.limit - gs.length)}`,
          );
      g.draw({
        points: [
          ...gs.map((q, i) => ({
            x: q[0],
            y: q[1],
            l: String(i + 1),
            cls: eq(q, spec.secret) ? "ok" : "b",
          })),
          ...(c.solved && !gs.some((q) => eq(q, spec.secret))
            ? [{ x: spec.secret[0], y: spec.secret[1], cls: "ok" }]
            : []),
        ],
      });
      c.checkBtn.disabled = !gs.length;
    }
    if (c.solved && !gs.length) gs = planFor(spec.secret, spec.r);
    c.body.append(sign, left, g.el, ...(c.solved ? [] : [g.pad, g.live]), log);
    c.redraws.push(sync);
    c.wire(
      () => ({ guesses: gs }),
      () => {
        gs = [];
        c.emit({ guesses: gs });
      },
    );
    sync();
  }

  A.register("griddetect", {
    title: "Grid Detective",
    titleEs: "Detective de la cuadrícula",
    levels: 4,
    make: mkDetect,
    solution: (spec) => ({ guesses: planFor(spec.secret, spec.r) }),
    wrong(spec) {
      const s = spec.secret;
      const off = [s[0] === spec.r ? s[0] - 1 : s[0] + 1, s[1]];
      return [
        { guesses: [] },
        { guesses: [off] },
        { guesses: [...Array.from({ length: spec.limit }, () => off)] },
        { guesses: [...Array.from({ length: spec.limit }, () => off), s.slice()] },
      ];
    },
    grade: gradeDetect,
    mount,
  });
})();

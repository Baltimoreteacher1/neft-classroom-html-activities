/**
 * Practice Studio activity: madtwins, "MAD twins" (lesson 2-9).
 *
 * Place a few dots so their mean and their MAD hit two targets. The widget shows the TOTAL distance of the dots from the
 * mean as a meter, and the student must divide it by the number of dots to reach the MAD (so a total of 8 for four dots
 * is a MAD of 2). Many builds are right (8, 8, 12, 12 and 7, 9, 11, 13 and 6, 10, 10, 14), so grade() checks the mean and
 * the MAD, never one answer. From level 3 the student also builds a second, different set with the same mean and MAD.
 * Target: stat-summed-instead-of-averaged. Needs assets/studio-act/u2kit.js (read lazily).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;
  const LO = 0;
  const HI = 20;
  const LEVELS = [
    null,
    { n: 4, mads: [2], two: false, aid: 3 },
    { n: 4, mads: [1.5, 2, 2.5, 3], two: false, aid: 2 },
    { n: 5, mads: [1.2, 1.6, 2, 2.4], two: true, aid: 2 },
    { n: 6, mads: [1, 2, 3], two: true, aid: 1 },
  ];
  const CTX = [
    "Each dot is the number of minutes one student practiced.|Cada punto es el número de minutos que practicó un estudiante.",
    "Each dot is how many points one player scored.|Cada punto es cuántos puntos anotó un jugador.",
    "Each dot is the height of one plant, in centimeters.|Cada punto es la altura de una planta, en centímetros.",
    "Each dot is how many books one student read.|Cada punto es cuántos libros leyó un estudiante.",
  ];
  /** Every sorted set of n whole numbers with the given mean and total distance, found once per key. */
  const CACHE = /** @type {any} */ ({});
  const solutions = (
    /** @type {number} */ n,
    /** @type {number} */ mean,
    /** @type {number} */ total,
  ) => {
    const key = `${n}|${mean}|${total}`;
    if (CACHE[key]) return CACHE[key];
    const out = /** @type {number[][]} */ ([]);
    const lo = Math.max(LO, mean - 9);
    const hi = Math.min(HI, mean + 9);
    const rec = (/** @type {number[]} */ a, /** @type {number} */ from) => {
      if (a.length === n) {
        const s = a.reduce((x, y) => x + y, 0);
        if (s === n * mean && a.reduce((x, y) => x + Math.abs(y - mean), 0) === total)
          out.push(a.slice());
        return;
      }
      for (let v = from; v <= hi; v++) {
        a.push(v);
        rec(a, v);
        a.pop();
      }
    };
    rec([], lo);
    CACHE[key] = out;
    return out;
  };

  const onGrid = (/** @type {any} */ d, /** @type {number} */ n) =>
    Array.isArray(d) && d.length === n && d.every((v) => Number.isInteger(v) && v >= LO && v <= HI);
  const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1e-9;

  const gradeSet = (/** @type {any} */ M, /** @type {number[]} */ d) => {
    const K = kit();
    if (!onGrid(d, M.n)) return { marks: [false, false], err: "grid" };
    const s = K.dev(d);
    const meanOk = near(s.mean, M.mean);
    const madOk = near(s.mad, M.mad);
    if (!meanOk) return { marks: [false, madOk], err: "mean", s };
    if (!madOk) return { marks: [true, false], err: "mad", s };
    return { marks: [true, true], err: null, s };
  };

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const M = spec.model;
    const s = state || {};
    const parts = [gradeSet(M, s.a)];
    if (M.two) parts.push(gradeSet(M, s.b));
    const sameSet = M.two && parts.every((p) => !p.err) && K.same(s.a, s.b);
    const marks = [
      ...parts.flatMap((p) => p.marks),
      ...(M.two ? [parts.every((p) => !p.err) && !sameSet] : []),
    ];
    const score = K.score(marks);
    const bi = parts.findIndex((p) => p.err);
    if (bi >= 0) {
      const p = /** @type {any} */ (parts[bi]);
      const set = M.two ? [`Set ${bi ? "B" : "A"}: `, `Conjunto ${bi ? "B" : "A"}: `] : ["", ""];
      if (p.err === "grid")
        return K.no(
          "madtwins-count",
          `${set[0]}Every dot must sit on the number line.|${set[1]}Todos los puntos deben estar en la recta numérica.`,
          score,
        );
      if (p.err === "mean")
        return K.no(
          "stat-mean-total-confused",
          `${set[0]}The mean of your dots is ${K.f(p.s.mean)}, but the mean has to be ${M.mean}. The mean is the balance point: the distances on the left of it and on the right of it must match.|${set[1]}La media de tus puntos es ${K.f(p.s.mean)}, pero la media tiene que ser ${M.mean}. La media es el punto de equilibrio: las distancias a su izquierda y a su derecha deben ser iguales.`,
          score,
        );
      const total = p.s.total;
      if (near(total, M.mad))
        return K.no(
          "stat-summed-instead-of-averaged",
          `${set[0]}The total distance of your dots is ${K.f(total)}, the same number as the MAD you want. MAD is the total distance divided by the number of dots, so a total of ${K.f(total)} gives a MAD of only ${K.f(p.s.mad)}.|${set[1]}La distancia total de tus puntos es ${K.f(total)}, el mismo número de la DAM que buscas. La DAM es la distancia total dividida entre la cantidad de puntos, así que una distancia total de ${K.f(total)} da una DAM de solo ${K.f(p.s.mad)}.`,
          score,
        );
      const [lw, lwEs] = p.s.mad < M.mad ? ["too small", "muy pequeña"] : ["too big", "muy grande"];
      return K.no(
        "stat-mad-misread",
        `${set[0]}The MAD of your dots is ${K.f(p.s.mad)}, which is ${lw}. MAD is the total distance from the mean divided by the number of dots.|${set[1]}La DAM de tus puntos es ${K.f(p.s.mad)}, que es ${lwEs}. La DAM es la distancia total a la media dividida entre la cantidad de puntos.`,
        score,
      );
    }
    if (sameSet)
      return K.no(
        "madtwins-same",
        "Set B has the same dots as Set A. Build a different set that has the same mean and the same MAD.|El conjunto B tiene los mismos puntos que el A. Construye un conjunto distinto que tenga la misma media y la misma DAM.",
        score,
      );
    return { ok: true, ...score };
  };

  A.register("madtwins", {
    title: "MAD twins",
    titleEs: "Gemelos de DAM",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const P = LEVELS[level];
      const mean = rng.int(8, 12);
      let total = Math.round(rng.pick(P.mads) * P.n);
      let sols = solutions(P.n, mean, total);
      // the total distance above and below the mean always match, so the total is even
      while (sols.length < 4 && total < P.n * 4) {
        total += 2;
        sols = solutions(P.n, mean, total);
      }
      const mad = total / P.n;
      const a = rng.pick(sols);
      const b = rng.pick(sols.filter((/** @type {number[]} */ s) => !kit().same(s, a)));
      const [cap, capEs] = rng.pick(CTX).split("|");
      const f = kit().f;
      const lead = `${cap} Place ${P.n} dots on the number line so the mean is ${mean} and the MAD is ${f(mad)}.`;
      const leadEs = `${capEs} Coloca ${P.n} puntos en la recta numérica para que la media sea ${mean} y la DAM sea ${f(mad)}.`;
      return {
        q: P.two
          ? `${lead} Then build a different set of ${P.n} dots with the same mean and the same MAD.`
          : lead,
        qEs: P.two
          ? `${leadEs} Luego construye un conjunto distinto de ${P.n} puntos con la misma media y la misma DAM.`
          : leadEs,
        x: `MAD is the average distance of the dots from the mean. With ${P.n} dots and a MAD of ${f(mad)}, the distances add up to ${f(mad)} × ${P.n} = ${f(mad * P.n)}. Many different sets of dots have that total, so many builds are right.`,
        xEs: `La DAM es la distancia promedio de los puntos a la media. Con ${P.n} puntos y una DAM de ${f(mad)}, las distancias suman ${f(mad)} × ${P.n} = ${f(mad * P.n)}. Muchos conjuntos de puntos tienen esa suma, así que muchas construcciones son correctas.`,
        h: [
          "MAD is the mean absolute deviation: the average distance of the dots from the mean.",
          "The meter shows the total distance of all the dots from the mean. The average distance is that total divided by the number of dots.",
          "Work backward: an average distance times the number of dots gives the total distance the dots need.",
        ],
        hEs: [
          "La DAM es la desviación absoluta media: la distancia promedio de los puntos a la media.",
          "El medidor muestra la distancia total de todos los puntos a la media. La distancia promedio es esa total dividida entre la cantidad de puntos.",
          "Trabaja al revés: una distancia promedio por la cantidad de puntos da la distancia total que necesitan los puntos.",
        ],
        model: {
          n: P.n,
          mean,
          mad,
          total: mad * P.n,
          two: P.two,
          aid: P.aid,
          lo: LO,
          hi: HI,
          start: Array.from(
            { length: P.n },
            (_v, i) => mean - 1 + (i % 2 ? 1 : 0) - (i > 1 ? 0 : 0),
          ),
          solA: a,
          solB: P.two ? b : null,
        },
      };
    },
    solution(/** @type {any} */ spec) {
      const M = spec.model;
      return M.two ? { a: M.solA.slice(), b: M.solB.slice() } : { a: M.solA.slice() };
    },
    wrong(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = A.registry.madtwins.solution(spec);
      const allMean = Array(M.n).fill(M.mean);
      const shift = sol.a.map((v) => Math.min(HI, v + 1));
      const out = [
        { ...sol, a: M.start.slice() },
        { ...sol, a: allMean },
        { ...sol, a: shift },
        { ...sol, a: sol.a.slice(0, M.n - 1) },
      ];
      if (M.two) out.push({ ...sol, b: sol.a.slice() });
      return out.filter((s) => !grade(spec, s).ok);
    },
    grade,
    mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
      const K = kit();
      const M = spec.model;
      const { root, L, B, live, ro } = K.shell(host, api);
      const saved = api.restore && Array.isArray(api.restore.a) ? api.restore : null;
      const st = {
        a: saved ? saved.a.slice() : M.start.slice(),
        b: M.two ? (saved && Array.isArray(saved.b) ? saved.b.slice() : M.start.slice()) : null,
      };
      const emit = () =>
        api.change?.(M.two ? { a: st.a.slice(), b: st.b.slice() } : { a: st.a.slice() });
      const tabs = M.two
        ? K.choices(
            root,
            [
              { en: "Set A", es: "Conjunto A" },
              { en: "Set B", es: "Conjunto B" },
            ],
            0,
            false,
            (i) => show(i),
            L("Which set", "Cuál conjunto"),
            B,
          )
        : null;
      const wraps = /** @type {any[]} */ ([]);
      const stages = /** @type {any[]} */ ([]);
      const metas = /** @type {any[]} */ ([]);
      (M.two ? ["a", "b"] : ["a"]).forEach((k, idx) => {
        const wrap = A.el("div", "u2-root");
        const chips = A.el("div", "u2-chips");
        const mean = A.el(
          "div",
          "u2-chip",
          `<b>${B("Mean", "Media")}</b><output></output><small></small>`,
        );
        const total = A.el(
          "div",
          "u2-chip",
          `<b>${B("Total distance from the mean", "Distancia total a la media")}</b><output></output><small></small>`,
        );
        const mad = A.el("div", "u2-chip", `<b>MAD|DAM</b><output></output><small></small>`);
        mad.firstChild.textContent = L("MAD", "DAM");
        if (M.aid >= 2) chips.append(mean, total);
        if (M.aid >= 3) chips.append(mad);
        const meter = A.el("div", "u2-box");
        const bar = A.el("div", "", "", { role: "img" });
        bar.style.cssText =
          "height:16px;border-radius:8px;background:var(--brand,#2C4A68);min-width:2px";
        meter.append(bar);
        const paintMeta = (/** @type {number[]} */ vals) => {
          const s = K.dev(vals);
          mean.querySelector("output").textContent = K.f(s.mean);
          total.querySelector("output").textContent = K.f(s.total);
          mad.querySelector("output").textContent = K.f(s.mad);
          mad.querySelector("small").innerHTML = B(
            `${K.f(s.total)} ÷ ${M.n}`,
            `${K.f(s.total)} ÷ ${M.n}`,
          );
          bar.style.width = `${Math.min(100, (s.total / (M.total * 2)) * 100)}%`;
          bar.setAttribute(
            "aria-label",
            L(`Total distance ${K.f(s.total)}`, `Distancia total ${K.f(s.total)}`),
          );
        };
        const stage = K.dotStage(
          wrap,
          {
            n: M.n,
            lo: M.lo,
            hi: M.hi,
            step: 1,
            vals: st[k],
            ro,
            label: L("Dot plot", "Diagrama de puntos"),
            overlay: (
              /** @type {any} */ g,
              /** @type {any} */ X,
              /** @type {any} */ S,
              /** @type {number[]} */ vals,
            ) => {
              if (M.aid < 2) return;
              const m = K.meanOf(vals);
              S("line", { class: "u2-mark", x1: X(m), x2: X(m), y1: 18, y2: 126 }, g);
              S(
                "text",
                { class: "u2-marklab", x: X(m), y: 12, "text-anchor": "middle" },
                g,
              ).textContent = `${L("mean", "media")} ${K.f(m)}`;
            },
            onChange: (/** @type {number[]} */ vals) => {
              st[k] = vals;
              paintMeta(vals);
              emit();
            },
          },
          api,
        );
        stages.push(stage);
        metas.push(paintMeta);
        paintMeta(st[k]);
        if (M.aid >= 2) wrap.append(chips, meter);
        wraps.push(wrap);
        wrap.hidden = idx > 0;
        root.append(wrap);
      });
      root.append(live);
      function show(i) {
        wraps.forEach((w, j) => {
          w.hidden = j !== i;
        });
      }
      if (!ro)
        K.actions(
          root,
          api,
          B,
          () => (M.two ? { a: st.a.slice(), b: st.b.slice() } : { a: st.a.slice() }),
          () => {
            st.a = M.start.slice();
            stages[0].set(st.a);
            metas[0](st.a);
            if (M.two) {
              st.b = M.start.slice();
              stages[1].set(st.b);
              metas[1](st.b);
              tabs.set(0);
              show(0);
            }
            emit();
          },
        );
    },
  });
})();

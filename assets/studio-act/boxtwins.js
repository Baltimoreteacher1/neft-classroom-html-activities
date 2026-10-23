/**
 * Practice Studio activity: boxtwins, "Box Twins" (lessons 2-4 and 2-5).
 *
 * p.mode "box" (2-4): place 12 dots so the five-number summary matches the target, then (level 2 and up) build a second,
 * different set of 12 dots with the same box. p.mode "iqr" (2-5): two sets of 12 dots with the same range and different
 * IQRs. grade() checks constraints on the dots, never one answer; a miss names a statistic and says too low or too high.
 * Live help fades with the level: markers and direction, then values only, then nothing.
 * Needs assets/studio-act/u2kit.js (read lazily). The n = 12 rule: Q1 is the median of the lower six dots, Q3 of the upper six.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;
  const N = 12;
  const LO = 0;
  const HI = 24;
  const CTX = [
    "minutes twelve students practiced|minutos que practicaron doce estudiantes",
    "points twelve players scored|puntos que anotaron doce jugadores",
    "centimeters twelve seedlings grew|centímetros que crecieron doce plántulas",
    "dollars twelve stands earned|dólares que ganaron doce puestos",
  ];
  const NAME = /** @type {any} */ ({
    min: "the smallest value|el valor mínimo",
    q1: "Q1, the first quartile|Q1, el primer cuartil",
    med: "the median|la mediana",
    q3: "Q3, the third quartile|Q3, el tercer cuartil",
    max: "the largest value|el valor máximo",
    iqr: "the IQR|el rango intercuartil (RIC)",
  });
  const SHORT = /** @type {any} */ ({
    min: "Min",
    q1: "Q1",
    med: "Median|Mediana",
    q3: "Q3",
    max: "Max|Máx",
    iqr: "IQR|RIC",
  });
  const WHY = /** @type {any} */ ({
    q1: "Q1 is the median of the lower six dots.|Q1 es la mediana de los seis puntos de abajo.",
    q3: "Q3 is the median of the upper six dots.|Q3 es la mediana de los seis puntos de arriba.",
    med: "The median is halfway between the 6th and 7th dots, counting from the left.|La mediana está a la mitad entre el 6.º y el 7.º punto, contando desde la izquierda.",
    iqr: "The IQR is Q3 minus Q1, so it only depends on the middle half of the dots.|El RIC es Q3 menos Q1, así que solo depende de la mitad central de los puntos.",
    min: "The smallest value is the leftmost dot.|El valor mínimo es el punto de más a la izquierda.",
    max: "The largest value is the rightmost dot.|El valor máximo es el punto de más a la derecha.",
  });
  const STATS_BOX = ["min", "q1", "med", "q3", "max"];
  const STATS_IQR = ["min", "max", "iqr"];

  const valueOf = (/** @type {number[]} */ d, /** @type {string} */ stat) => {
    const f = kit().five(d);
    return stat === "iqr" ? f.q3 - f.q1 : f[stat];
  };
  const onGrid = (/** @type {any} */ d) =>
    Array.isArray(d) && d.length === N && d.every((v) => Number.isInteger(v) && v >= LO && v <= HI);

  /** Twelve dots from the free positions of the n = 12 rule: a1..a4 are the dots that move without changing the box. */
  const build = (/** @type {any} */ rng, /** @type {any} */ t) => {
    const between = (/** @type {number} */ a, /** @type {number} */ b) =>
      rng.int(Math.min(a, b), Math.max(a, b));
    return [
      t.min,
      between(t.min, t.q1),
      t.q1,
      t.q1,
      between(t.q1, t.med),
      t.med,
      t.med,
      between(t.med, t.q3),
      t.q3,
      t.q3,
      between(t.q3, t.max),
      t.max,
    ];
  };

  const dirWord = (/** @type {number} */ got, /** @type {number} */ want) =>
    got < want ? ["too low", "muy bajo"] : ["too high", "muy alto"];

  const gradeSet = (
    /** @type {any} */ spec,
    /** @type {number[]} */ d,
    /** @type {"A"|"B"} */ which,
  ) => {
    const M = spec.model;
    const stats = M.mode === "iqr" ? STATS_IQR : STATS_BOX;
    const want =
      M.mode === "iqr"
        ? { min: M.min, max: M.max, iqr: which === "A" ? M.iqrA : M.iqrB }
        : M.target;
    if (!onGrid(d)) return { marks: stats.map(() => false), first: stats[0], want, d: null };
    const marks = stats.map((s) => Math.abs(valueOf(d, s) - want[s]) < 1e-9);
    const bad = stats.findIndex((_s, i) => !marks[i]);
    return { marks, first: bad < 0 ? null : stats[bad], want, d };
  };

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const M = spec.model;
    const s = state || {};
    const sets = M.two ? ["A", "B"] : ["A"];
    const parts = sets.map((w) => gradeSet(spec, w === "A" ? s.a : s.b, /** @type {any} */ (w)));
    let marks = parts.flatMap((p) => p.marks);
    const bothBad = M.two && parts.every((p) => p.first === null);
    const same = bothBad && K.same(s.a, s.b);
    if (M.two) marks = [...marks, !same && parts.every((p) => p.first === null)];
    const score = K.score(marks);
    const badIdx = parts.findIndex((p) => p.first !== null);
    if (badIdx >= 0) {
      const p = /** @type {any} */ (parts[badIdx]);
      if (!p.d)
        return K.no(
          "boxtwins-count",
          "Every one of the 12 dots must sit on the scale. Put the dots back on the number line.|Los 12 puntos deben estar en la escala. Vuelve a poner los puntos en la recta numérica.",
          score,
        );
      const got = valueOf(p.d, p.first);
      const [dw, dwEs] = dirWord(got, p.want[p.first]);
      const [n, nEs] = NAME[p.first].split("|");
      const [why, whyEs] = WHY[p.first].split("|");
      const set = M.two ? [`Set ${sets[badIdx]}: `, `Conjunto ${sets[badIdx]}: `] : ["", ""];
      const range =
        M.mode === "iqr" &&
        p.first === "iqr" &&
        Math.abs(got - (valueOf(p.d, "max") - valueOf(p.d, "min"))) < 1e-9;
      const tag = range ? "stat-range-for-iqr" : "stat-box-plot-misread";
      return K.no(
        tag,
        `${set[0]}${n} is ${dw}. ${why}|${set[1]}${nEs} está ${dwEs}. ${whyEs}`,
        score,
      );
    }
    if (same)
      return K.no(
        "boxtwins-same",
        "Set B has the same dots as Set A. Build a different set of 12 dots that still makes the same box. Move dots that do not change the five numbers.|El conjunto B tiene los mismos puntos que el A. Construye un conjunto distinto de 12 puntos que forme la misma caja. Mueve puntos que no cambien los cinco números.",
        score,
      );
    return { ok: true, ...score };
  };

  A.register("boxtwins", {
    title: "Box twins",
    titleEs: "Gemelos de caja",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
      const mode = params.mode === "iqr" ? "iqr" : "box";
      const [what, whatEs] = rng.pick(CTX).split("|");
      const aid = level <= 2 ? 3 : level === 3 ? 2 : 1; // 3 markers and direction, 2 values only, 1 nothing
      const base = { mode, what, whatEs, aid, lo: LO, hi: HI, n: N };
      let a = /** @type {number[]} */ ([]);
      let b = /** @type {number[]} */ ([]);
      if (mode === "box") {
        let target = null;
        for (let t = 0; t < 600 && !target; t++) {
          const d = kit().sorted(Array.from({ length: N }, () => rng.int(1, 23)));
          const f = kit().five(d);
          const free = [1, 4, 7, 10].some((i) => d[i + 1] - d[i - 1] >= 1);
          if (
            f.min < f.q1 &&
            f.q1 < f.med &&
            f.med < f.q3 &&
            f.q3 < f.max &&
            free &&
            f.q3 - f.q1 >= 4
          ) {
            target = f;
            a = d;
          }
        }
        if (!target) {
          target = { min: 2, q1: 6, med: 10, q3: 15, max: 21 };
          a = build(rng, target);
        }
        // a second, different set with the same box: move a free dot to another value it may take
        b = a.slice();
        const opts = [1, 4, 7, 10].flatMap((i) => {
          const out = [];
          for (let v = a[i - 1 < 0 ? 0 : i - 1]; v <= a[i + 1]; v++)
            if (v !== a[i]) out.push([i, v]);
          return out;
        });
        const [i, v] = rng.pick(opts);
        b[i] = v;
        const two = level >= 2;
        const lead = `Place 12 dots on the number line (${what}) so the five numbers of the box plot are: minimum ${kit().f(target.min)}, Q1 ${kit().f(target.q1)}, median ${kit().f(target.med)}, Q3 ${kit().f(target.q3)}, maximum ${kit().f(target.max)}.`;
        const leadEs = `Coloca 12 puntos en la recta numérica (${whatEs}) para que los cinco números del diagrama de caja sean: mínimo ${kit().f(target.min)}, Q1 ${kit().f(target.q1)}, mediana ${kit().f(target.med)}, Q3 ${kit().f(target.q3)}, máximo ${kit().f(target.max)}.`;
        return {
          q: two
            ? `${lead} Then build a second set of 12 dots that is different but makes the same box.`
            : lead,
          qEs: two
            ? `${leadEs} Luego construye un segundo conjunto de 12 puntos que sea distinto pero forme la misma caja.`
            : leadEs,
          x: "A box plot keeps only five numbers. Many different sets of 12 dots can make the same box, because the dots between the five numbers can move without changing them. Each quarter of the data holds 3 dots.",
          xEs: "Un diagrama de caja guarda solo cinco números. Muchos conjuntos distintos de 12 puntos pueden formar la misma caja, porque los puntos entre los cinco números pueden moverse sin cambiarlos. Cada cuarta parte de los datos tiene 3 puntos.",
          h: [
            "A box plot is built from five numbers. Your dots must give exactly those five numbers.",
            "Think of the dots in order. Q1 is the middle of the lower six dots, the median is the middle of all 12, and Q3 is the middle of the upper six.",
            "Each quarter of the data holds 3 dots. Place the dots, then adjust the ones next to each marker.",
          ],
          hEs: [
            "Un diagrama de caja se construye con cinco números. Tus puntos deben dar exactamente esos cinco números.",
            "Piensa en los puntos en orden. Q1 es el medio de los seis puntos de abajo, la mediana es el medio de los 12 y Q3 es el medio de los seis puntos de arriba.",
            "Cada cuarta parte de los datos tiene 3 puntos. Coloca los puntos y luego ajusta los que están junto a cada marcador.",
          ],
          model: { ...base, target, two, start: spread(), solA: a, solB: two ? b : null },
        };
      }
      // iqr: the same range, two different IQRs
      const m = rng.int(0, 3);
      const Mx = rng.int(21, 24);
      const [wa, wb] = rng.pick([
        [4, 12],
        [2, 10],
        [4, 10],
        [6, 14],
        [2, 12],
      ]);
      const side = (/** @type {number} */ c, /** @type {number} */ w) => {
        const q1 = c - w / 2;
        const q3 = c + w / 2;
        return build(rng, { min: m, q1, med: Math.round((q1 + q3) / 2), q3, max: Mx });
      };
      a = side(rng.int(10, 14), wa);
      b = side(12, wb);
      return {
        q: `Build two sets of 12 dots (${what}) on the same scale. Both sets have a minimum of ${m} and a maximum of ${Mx}, so the range is ${Mx - m}. In Set A the IQR is ${wa}. In Set B the IQR is ${wb}.`,
        qEs: `Construye dos conjuntos de 12 puntos (${whatEs}) en la misma escala. Los dos conjuntos tienen un mínimo de ${m} y un máximo de ${Mx}, así que el rango es ${Mx - m}. En el conjunto A el RIC es ${wa}. En el conjunto B el RIC es ${wb}.`,
        x: "The range uses only the smallest and largest dots. The IQR uses the middle half of the dots. Two sets can have the same range and very different IQRs, because the middle half can be packed together or spread out.",
        xEs: "El rango usa solo el punto más pequeño y el más grande. El RIC usa la mitad central de los puntos. Dos conjuntos pueden tener el mismo rango y RIC muy distintos, porque la mitad central puede estar junta o dispersa.",
        h: [
          "The range uses only the smallest and largest dots. The IQR is Q3 minus Q1 and ignores the dots at the ends.",
          "For a wider IQR, move the middle dots farther from the median while the end dots stay where they are.",
          "Keep the smallest and largest dots in place. Change only the dots that make Q1 and Q3.",
        ],
        hEs: [
          "El rango usa solo el punto más pequeño y el más grande. El RIC es Q3 menos Q1 e ignora los puntos de los extremos.",
          "Para un RIC más ancho, mueve los puntos del medio más lejos de la mediana mientras los puntos de los extremos se quedan donde están.",
          "Deja en su lugar el punto más pequeño y el más grande. Cambia solo los puntos que forman Q1 y Q3.",
        ],
        model: {
          ...base,
          min: m,
          max: Mx,
          iqrA: wa,
          iqrB: wb,
          two: true,
          start: spread(),
          solA: a,
          solB: b,
        },
      };
      function spread() {
        return Array.from({ length: N }, (_v, i) => Math.round(1 + (i * (HI - 2)) / (N - 1)));
      }
    },
    solution(/** @type {any} */ spec) {
      const M = spec.model;
      return M.two ? { a: M.solA.slice(), b: M.solB.slice() } : { a: M.solA.slice() };
    },
    wrong(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = A.registry.boxtwins.solution(spec);
      const sorted = kit().sorted(sol.a);
      const lowered = sorted.map((v, i) => (i === 5 ? Math.max(LO, v - 3) : v));
      const out = [
        { ...sol, a: M.start.slice() },
        { ...sol, a: Array(N).fill(12) },
        { ...sol, a: sorted.map((v, i) => (i === 2 ? Math.min(HI, v + 5) : v)) },
        { ...sol, a: lowered },
        { ...sol, a: sol.a.slice(0, N - 1) },
      ];
      if (M.two) {
        out.push({ ...sol, b: sol.a.slice() });
        out.push({ ...sol, b: M.start.slice() });
      }
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
      const stats = M.mode === "iqr" ? STATS_IQR : STATS_BOX;
      const emit = () =>
        api.change?.(M.two ? { a: st.a.slice(), b: st.b.slice() } : { a: st.a.slice() });
      const want = (/** @type {"a"|"b"} */ k) =>
        M.mode === "iqr" ? { min: M.min, max: M.max, iqr: k === "a" ? M.iqrA : M.iqrB } : M.target;
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
      const chipSets = /** @type {any[]} */ ([]);
      const stages = /** @type {any[]} */ ([]);
      (M.two ? ["a", "b"] : ["a"]).forEach((k, idx) => {
        const wrap = A.el("div", "u2-root");
        const chips = A.el("div", "u2-chips");
        const refs = /** @type {any} */ ({});
        if (M.aid >= 2)
          for (const s of stats) {
            const [en, es] = (SHORT[s].includes("|") ? SHORT[s] : `${SHORT[s]}|${SHORT[s]}`).split(
              "|",
            );
            refs[s] = A.el("div", "u2-chip", `<b>${B(en, es)}</b><output></output><small></small>`);
            chips.append(refs[s]);
          }
        const paintChips = (/** @type {number[]} */ vals) => {
          if (M.aid < 2) return;
          const w = want(/** @type {any} */ (k));
          for (const s of stats) {
            const v = valueOf(vals, s);
            refs[s].querySelector("output").textContent = K.f(v);
            const small = refs[s].querySelector("small");
            if (M.aid >= 3) {
              const ok = Math.abs(v - w[s]) < 1e-9;
              small.innerHTML = ok
                ? B("matches", "coincide")
                : v < w[s]
                  ? B("too low", "muy bajo")
                  : B("too high", "muy alto");
              refs[s].classList.toggle("is-ok", ok);
            }
          }
        };
        const stage = K.dotStage(
          wrap,
          {
            n: N,
            lo: LO,
            hi: HI,
            step: 1,
            vals: st[k],
            ro,
            label: L("Dot plot of 12 dots", "Diagrama de puntos de 12 puntos"),
            overlay: (
              /** @type {any} */ g,
              /** @type {any} */ X,
              /** @type {any} */ S,
              /** @type {number[]} */ vals,
            ) => {
              if (M.aid < 3 || vals.length !== N) return;
              const f = K.five(vals);
              for (const s of ["min", "q1", "med", "q3", "max"]) {
                S("line", { class: "u2-mark", x1: X(f[s]), x2: X(f[s]), y1: 18, y2: 126 }, g);
                S(
                  "text",
                  { class: "u2-marklab", x: X(f[s]), y: 12, "text-anchor": "middle" },
                  g,
                ).textContent =
                  s === "med" ? "M" : s === "min" || s === "max" ? "" : s.toUpperCase();
              }
            },
            onChange: (/** @type {number[]} */ vals) => {
              st[k] = vals;
              paintChips(vals);
              emit();
            },
          },
          api,
        );
        stages.push(stage);
        paintChips(st[k]);
        wrap.append(chips);
        wraps.push(wrap);
        root.append(wrap);
        chipSets.push(paintChips);
        wrap.hidden = idx > 0;
      });
      root.append(
        A.el(
          "p",
          "u2-note",
          M.aid >= 3
            ? B(
                "Each part between the markers holds 3 of the 12 dots.",
                "Cada parte entre los marcadores tiene 3 de los 12 puntos.",
              )
            : B(
                "Check the dots yourself. The page will not show the five numbers.",
                "Revisa los puntos tú mismo. La página no muestra los cinco números.",
              ),
        ),
        live,
      );
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
            chipSets[0](st.a);
            if (M.two) {
              st.b = M.start.slice();
              stages[1].set(st.b);
              chipSets[1](st.b);
              tabs.set(0);
              show(0);
            }
            emit();
          },
        );
      void tabs;
    },
  });
})();

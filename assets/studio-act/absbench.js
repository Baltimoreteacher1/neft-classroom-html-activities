/**
 * Practice Studio activity: absbench (window.StudioAct kind "absbench"), lessons 7-3 and 7-4.
 *   mode "bench"    (7-3) Estimate first: for each number, tap the benchmark chip that holds its absolute value.
 *   mode "contrast" (7-4) Two numbers, two questions: which is farther FROM ZERO, and which is farther RIGHT.
 *                   The answers differ on purpose, so the two ideas cannot be mixed up.
 * State: { pick: [chip, ...] } (bench) or { far0: 0|1|null, right: 0|1|null } (contrast).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.u7 = A.u7 || {});
  const MODES = ["bench", "contrast"];

  const BINS = [
    [
      { lo: 0, hi: 5, en: "0 to 5", es: "0 a 5" },
      { lo: 5, hi: 10, en: "5 to 10", es: "5 a 10" },
      { lo: 10, hi: 20, en: "10 to 20", es: "10 a 20" },
      { lo: 20, hi: 1e9, en: "more than 20", es: "más de 20" },
    ],
    [
      { lo: 0, hi: 1, en: "0 to 1", es: "0 a 1" },
      { lo: 1, hi: 5, en: "1 to 5", es: "1 a 5" },
      { lo: 5, hi: 10, en: "5 to 10", es: "5 a 10" },
      { lo: 10, hi: 1e9, en: "more than 10", es: "más de 10" },
    ],
  ];
  const binOf = (/** @type {any[]} */ bins, /** @type {number} */ a) =>
    bins.findIndex((b) => a >= b.lo && a < b.hi);
  const txt = (/** @type {number} */ v, /** @type {string} */ form) => {
    const G = W.StudioGen;
    if (form === "frac") {
      const d = 4;
      const k = Math.round(Math.abs(v) * d);
      return `${v < 0 ? "−" : ""}${G.frac(k, d)}`;
    }
    return K.n(v);
  };

  function mkBench(/** @type {any} */ rng, /** @type {number} */ lv) {
    const bins = BINS[lv >= 3 ? 1 : 0];
    const vals = [];
    const used = new Set();
    for (let t = 0; t < 400 && vals.length < 3; t++) {
      const b = rng.int(0, 3);
      const scale = lv >= 3 ? [0.25, 1, 5, 10][b] : [1, 5, 10, 20][b];
      const span = lv >= 3 ? [0.75, 4, 5, 25][b] : [4, 5, 10, 60][b];
      const a = Math.round((scale + rng.next() * span) * (lv >= 3 ? 4 : 1)) / (lv >= 3 ? 4 : 1);
      const v = a * rng.pick([-1, 1]);
      if (binOf(bins, a) !== b || used.has(binOf(bins, a)) || a === bins[b].lo) continue;
      used.add(b);
      vals.push({
        v,
        t: txt(
          v,
          lv === 4 && rng.chance(0.5) && Math.abs(v * 4 - Math.round(v * 4)) < 1e-9
            ? "frac"
            : "dec",
        ),
      });
    }
    if (vals.length < 3) throw new Error("absbench: no numbers");
    const want = vals.map((x) => binOf(bins, Math.abs(x.v)));
    const pack = K.pack({
      q: `Estimate first. For each number, tap the chip that holds its absolute value: ${vals.map((x) => x.t).join(", ")}. ¦ Estima primero. Para cada número, toca la ficha que contiene su valor absoluto: ${vals.map((x) => x.t).join(", ")}.`,
      x: `Absolute value is the distance from 0, so the sign does not matter for the estimate. ${vals.map((x, i) => `|${x.t}| is in ${bins[want[i]].en}`).join("; ")}. ¦ El valor absoluto es la distancia al 0, así que el signo no importa para estimar. ${vals.map((x, i) => `|${x.t}| está en ${bins[want[i]].es}`).join("; ")}.`,
      h: [
        "Absolute value is the distance from 0. ¦ El valor absoluto es la distancia al 0.",
        "Ignore the sign when you estimate a distance. ¦ No tomes en cuenta el signo cuando estimes una distancia.",
        "Which two benchmarks is the number between? ¦ ¿Entre cuáles dos referencias está el número?",
      ],
    });
    return { ...pack, mode: "bench", vals, bins, want, model: { vals: vals.map((x) => x.t) } };
  }

  function mkContrast(/** @type {any} */ rng, /** @type {number} */ lv) {
    const dec = lv >= 3;
    for (let t = 0; t < 400; t++) {
      const sc = dec ? 4 : 1;
      const big = rng.int(3, [9, 20, 9, 12][lv - 1] * sc) / sc;
      const small = rng.int(1, Math.floor(big * sc) - 1 || 1) / sc;
      if (!(small > 0) || small >= big) continue;
      const bigNeg = rng.chance(0.8);
      const smallNeg = bigNeg ? rng.chance(0.4) : false;
      const a = (bigNeg ? -1 : 1) * big;
      const b = (smallNeg ? -1 : 1) * small;
      // the farther-right number must not be the farther-from-zero number
      if (a >= b) continue;
      const order = rng.chance(0.5);
      const nums = order ? [a, b] : [b, a];
      const far0 = nums.findIndex((v) => Math.abs(v) === Math.max(Math.abs(a), Math.abs(b)));
      const right = nums.findIndex((v) => v === Math.max(a, b));
      if (far0 === right) continue;
      const tx = nums.map((v) => txt(v, "dec"));
      const pack = K.pack({
        q: `Two numbers: ${tx[0]} and ${tx[1]}. Answer both questions. Which is farther from 0? Which is farther to the right on a number line? ¦ Dos números: ${tx[0]} y ${tx[1]}. Contesta las dos preguntas. ¿Cuál está más lejos del 0? ¿Cuál está más a la derecha en una recta numérica?`,
        x: `${tx[far0]} is farther from 0, because its absolute value is larger. ${tx[right]} is farther right, because it is the greater number. These are different questions. ¦ ${tx[far0]} está más lejos del 0, porque su valor absoluto es mayor. ${tx[right]} está más a la derecha, porque es el número mayor. Son preguntas distintas.`,
        h: [
          "Farther from 0 is about distance. Farther right is about position. ¦ Más lejos del 0 trata de la distancia. Más a la derecha trata de la posición.",
          "Place both numbers on a number line. ¦ Ubica los dos números en una recta numérica.",
          "Distance ignores the sign. Position uses the sign. ¦ La distancia no toma en cuenta el signo. La posición sí lo usa.",
        ],
      });
      return { ...pack, mode: "contrast", nums, tx, far0, right, model: { nums } };
    }
    throw new Error("absbench: no pair");
  }

  function gradeAb(/** @type {any} */ spec, /** @type {any} */ state) {
    if (spec.mode === "bench") {
      const pick = ((state && state.pick) || []).slice(0, spec.want.length);
      const marks = spec.want.map(
        (/** @type {number} */ w, /** @type {number} */ i) => pick[i] === w,
      );
      const parts = K.parts(marks);
      if (!pick.some((p) => Number.isInteger(p)))
        return K.miss(
          "no-point",
          "Tap a chip for each number. ¦ Toca una ficha para cada número.",
          parts,
        );
      if (pick.length < spec.want.length || pick.some((p) => !Number.isInteger(p)))
        return K.miss(
          "too-few",
          "Choose a chip for every number. ¦ Elige una ficha para cada número.",
          parts,
        );
      if (marks.every(Boolean)) return { ok: true, ...parts };
      const signSlip = spec.vals.some(
        (/** @type {any} */ x, /** @type {number} */ i) =>
          x.v < 0 && pick[i] !== spec.want[i] && pick[i] === 0,
      );
      return K.miss(
        "absolute-value-misread",
        signSlip
          ? "A negative number can still be far from 0. Absolute value is the distance from 0, so ignore the sign when you estimate. ¦ Un número negativo puede estar lejos del 0. El valor absoluto es la distancia al 0, así que no tomes en cuenta el signo al estimar."
          : "Estimate again: how far is the number from 0? Find the two benchmarks it is between. ¦ Estima otra vez: ¿qué tan lejos del 0 está el número? Busca las dos referencias entre las que está.",
        parts,
      );
    }
    const f = state && Number.isInteger(state.far0) ? state.far0 : null;
    const r = state && Number.isInteger(state.right) ? state.right : null;
    const marks = [f === spec.far0, r === spec.right];
    const parts = K.parts(marks);
    if (f === null || r === null)
      return K.miss(
        "too-few",
        "Answer both questions, one chip each. ¦ Contesta las dos preguntas, una ficha en cada una.",
        parts,
      );
    if (marks[0] && marks[1]) return { ok: true, ...parts };
    if (f === r)
      return K.miss(
        "absolute-value-vs-order",
        "You chose the same number for both questions. Farther from 0 is about distance. Farther right is about position. They can be different numbers. ¦ Elegiste el mismo número para las dos preguntas. Más lejos del 0 trata de la distancia. Más a la derecha trata de la posición. Pueden ser números distintos.",
        parts,
      );
    return K.miss(
      "absolute-value-vs-order",
      marks[0]
        ? "Check the farther-right question. Picture both numbers on a number line: the greater number is on the right. ¦ Revisa la pregunta de más a la derecha. Imagina los dos números en una recta numérica: el número mayor está a la derecha."
        : "Check the farther-from-0 question. Distance from 0 ignores the sign. ¦ Revisa la pregunta de más lejos del 0. La distancia al 0 no toma en cuenta el signo.",
      parts,
    );
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const c = K.start(host, spec, api, "absbench");
    const { L, T } = c;
    const bench = spec.mode === "bench";
    /** @type {any} */
    let st = c.saved || (bench ? { pick: [] } : { far0: null, right: null });
    if (c.solved) st = bench ? { pick: spec.want.slice() } : { far0: spec.far0, right: spec.right };
    const rows = A.el("div", "", "", { style: "display:grid;gap:12px" });
    function row(
      /** @type {string} */ labelEn,
      /** @type {string} */ labelEs,
      /** @type {{en: string, es: string, on: boolean, mark?: boolean | null, set: () => void}[]} */ opts,
    ) {
      const card = A.el("div", "ak-card");
      card.append(A.el("p", "ak-cap", T(labelEn, labelEs)));
      const r = A.el("div", "ak-row", "", { role: "group" });
      c.label(r, labelEn, labelEs);
      for (const o of opts) {
        const b = A.el(
          "button",
          `ak-chip${o.mark === true ? " ak-mark-ok" : o.mark === false ? " ak-mark-bad" : ""}`,
          o.en,
          { type: "button" },
        );
        b.setAttribute("aria-pressed", String(o.on));
        b.setAttribute("aria-label", L(o.en, o.es));
        b.disabled = c.solved;
        b.addEventListener("click", () => {
          o.set();
          c.verdict = null;
          c.emit(st);
          sync();
        });
        r.append(b);
      }
      card.append(r);
      return card;
    }
    function sync() {
      rows.textContent = "";
      const mk = c.marks();
      if (bench) {
        spec.vals.forEach((/** @type {any} */ x, /** @type {number} */ i) => {
          rows.append(
            row(
              `|${x.t}| is in…`,
              `|${x.t}| está en…`,
              spec.bins.map((/** @type {any} */ b, /** @type {number} */ j) => ({
                en: b.en,
                es: b.es,
                on: st.pick[i] === j,
                mark: mk && st.pick[i] === j ? mk[i] : null,
                set: () => {
                  st.pick = Array.from({ length: spec.vals.length }, (_, k) => st.pick[k] ?? null);
                  st.pick[i] = j;
                },
              })),
            ),
          );
        });
        c.checkBtn.disabled = !st.pick.some((p) => Number.isInteger(p));
      } else {
        const both = (/** @type {"far0"|"right"} */ key, /** @type {number} */ want) =>
          spec.tx.map((/** @type {string} */ t, /** @type {number} */ j) => ({
            en: t,
            es: t,
            on: st[key] === j,
            mark: mk && st[key] === j ? j === want : null,
            set: () => {
              st[key] = j;
            },
          }));
        rows.append(
          row("Which is farther from 0?", "¿Cuál está más lejos del 0?", both("far0", spec.far0)),
          row(
            "Which is farther to the right?",
            "¿Cuál está más a la derecha?",
            both("right", spec.right),
          ),
        );
        c.checkBtn.disabled = st.far0 === null && st.right === null;
      }
    }
    c.body.append(rows);
    c.redraws.push(sync);
    c.wire(
      () => st,
      () => {
        st = bench ? { pick: [] } : { far0: null, right: null };
        c.emit(st);
      },
    );
    sync();
  }

  A.register("absbench", {
    title: "Distance or position",
    titleEs: "Distancia o posición",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ p) {
      const mode = MODES.includes(p.mode) ? p.mode : rng.pick(MODES);
      return mode === "bench" ? mkBench(rng, lv) : mkContrast(rng, lv);
    },
    solution: (spec) =>
      spec.mode === "bench" ? { pick: spec.want.slice() } : { far0: spec.far0, right: spec.right },
    wrong(spec) {
      if (spec.mode === "bench") {
        const w = spec.want;
        return [
          { pick: w.map((/** @type {number} */ b) => (b + 1) % 4) },
          {
            pick: w.map((/** @type {number} */ b, /** @type {number} */ i) =>
              i === 0 ? (b + 1) % 4 : b,
            ),
          },
          { pick: w.slice(0, 1) },
          {
            pick: spec.vals.map((/** @type {any} */ x, /** @type {number} */ i) =>
              x.v < 0 ? 0 : w[i],
            ),
          },
        ].filter((s) => s.pick.join() !== w.join());
      }
      return [
        { far0: spec.right, right: spec.right },
        { far0: spec.far0, right: spec.far0 },
        { far0: spec.right, right: spec.far0 },
        { far0: spec.far0, right: null },
      ];
    },
    grade: gradeAb,
    mount,
  });
})();

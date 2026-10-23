/**
 * Practice Studio activity: countoff, "Count-off" (lesson 2-3).
 *
 * A histogram of an odd number of values. The student taps the bars from the left, a tally builds, and the bar where the
 * tally reaches the middle value holds the median. Choosing the tallest bar stops the tally short of the middle, and the
 * widget says so with the tally numbers. There is no mean readout anywhere: the mean is lesson 2-8.
 * Needs assets/studio-act/u2kit.js (read lazily).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;
  const LEVELS = [
    null,
    { bars: 4, n: 9 },
    { bars: 4, n: 11 },
    { bars: 5, n: 13 },
    { bars: 5, n: 15 },
  ];
  const CTX = [
    "ages of visitors at a museum|edades de visitantes de un museo|visitors|visitantes|years|años",
    "minutes students waited for the bus|minutos que estudiantes esperaron el autobús|students|estudiantes|minutes|minutos",
    "points scored by a team in each game|puntos que un equipo anotó en cada juego|games|juegos|points|puntos",
    "number of pages in books on a shelf|número de páginas de libros en un estante|books|libros|pages|páginas",
  ];

  /** Index of the bar that holds the middle value, counting from the left. */
  const medianBar = (/** @type {number[]} */ counts) => {
    const mid = (counts.reduce((a, b) => a + b, 0) + 1) / 2;
    let run = 0;
    for (let i = 0; i < counts.length; i++) {
      run += counts[i];
      if (run >= mid) return i;
    }
    return counts.length - 1;
  };
  const tallest = (/** @type {number[]} */ c) => c.indexOf(Math.max(...c));
  const upTo = (/** @type {number[]} */ c, /** @type {number} */ k) =>
    c.slice(0, k).reduce((a, b) => a + b, 0);

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const M = spec.model;
    const counts = M.bins.map((/** @type {any} */ b) => b.n);
    const s = state || {};
    const no = (/** @type {string} */ tag, /** @type {string} */ pair) => K.no(tag, pair);
    if (!Number.isInteger(s.pick) || s.pick < 0 || s.pick >= counts.length)
      return no(
        "countoff-pick",
        "Press Median here on the bar you think holds the median.|Pulsa Mediana aquí en la barra que crees que tiene la mediana.",
      );
    if (!Number.isInteger(s.counted) || s.counted < s.pick + 1)
      return no(
        "countoff-count",
        "Tap the bars from the left to build the tally up to your bar before you decide.|Toca las barras desde la izquierda para armar el conteo hasta tu barra antes de decidir.",
      );
    const right = medianBar(counts);
    if (s.pick === right) return { ok: true };
    const tally = upTo(counts, s.pick + 1);
    const mid = (M.n + 1) / 2;
    if (tally < mid) {
      const tag = s.pick === tallest(counts) ? "stat-mode-mixup" : "stat-median-middle-wrong";
      const lead =
        tag === "stat-mode-mixup"
          ? [
              "That is the tallest bar, but the tallest bar shows the mode, not the middle. ",
              "Esa es la barra más alta, pero la barra más alta muestra la moda, no el medio. ",
            ]
          : ["", ""];
      return K.no(
        tag,
        `${lead[0]}Your tally stops at ${tally}, and the middle is value number ${mid} of ${M.n}. The count has not reached the middle yet.|${lead[1]}Tu conteo se detiene en ${tally}, y el medio es el valor número ${mid} de ${M.n}. El conteo todavía no llega al medio.`,
      );
    }
    return no(
      "stat-median-middle-wrong",
      `The tally had already reached value number ${mid} of ${M.n} before this bar. The middle was counted in an earlier bar.|El conteo ya había llegado al valor número ${mid} de ${M.n} antes de esta barra. El medio se contó en una barra anterior.`,
    );
  };

  A.register("countoff", {
    title: "Count-off",
    titleEs: "Cuenta hasta el medio",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const P = LEVELS[level];
      let counts = /** @type {number[]} */ ([]);
      for (let t = 0; t < 400; t++) {
        const c = Array(P.bars).fill(1);
        for (let k = P.bars; k < P.n; k++) c[rng.int(0, P.bars - 1)]++;
        const top = Math.max(...c);
        if (c.filter((v) => v === top).length === 1 && tallest(c) !== medianBar(c) && top <= 8) {
          counts = c;
          break;
        }
      }
      if (!counts.length) counts = P.bars === 4 ? [4, 1, 2, 2].concat(Array(0)) : [3, 1, 2, 5, 2];
      const [thing, thingEs, noun, nounEs, unit, unitEs] = rng.pick(CTX).split("|");
      const width = rng.pick([5, 10]);
      const lo = rng.pick([0, 10, 20]);
      const bins = counts.map((n, i) => ({
        lo: lo + i * width,
        hi: lo + (i + 1) * width - 1,
        n,
      }));
      const showMid = level <= 2;
      return {
        q: `The histogram shows ${P.n} ${noun}: ${thing}. Find the interval that holds the median. Tap the bars from the left to build a tally, then press Median here on the bar where the tally reaches the middle value.`,
        qEs: `El histograma muestra ${P.n} ${nounEs}: ${thingEs}. Halla el intervalo que tiene la mediana. Toca las barras desde la izquierda para armar un conteo y luego pulsa Mediana aquí en la barra donde el conteo llega al valor del medio.`,
        x: `The histogram is already in order from left to right. Counting from the left, the tally reaches the middle value, number ${(P.n + 1) / 2} of ${P.n}, in one bar. That bar holds the median. The tallest bar shows the mode, which is a different idea.`,
        xEs: `El histograma ya está en orden de izquierda a derecha. Al contar desde la izquierda, el conteo llega al valor del medio, el número ${(P.n + 1) / 2} de ${P.n}, en una barra. Esa barra tiene la mediana. La barra más alta muestra la moda, que es otra idea.`,
        h: [
          "The median is the middle value when the data are in order. A histogram is already in order from left to right.",
          "Count the values from the left, bar by bar, until you reach the middle value.",
          "Only one bar holds the middle value. The tallest bar is not always that bar.",
        ],
        hEs: [
          "La mediana es el valor del medio cuando los datos están en orden. Un histograma ya está en orden de izquierda a derecha.",
          "Cuenta los valores desde la izquierda, barra por barra, hasta llegar al valor del medio.",
          "Solo una barra tiene el valor del medio. La barra más alta no siempre es esa barra.",
        ],
        model: { bins, n: P.n, noun, nounEs, unit, unitEs, showMid },
      };
    },
    solution(/** @type {any} */ spec) {
      const counts = spec.model.bins.map((/** @type {any} */ b) => b.n);
      const pick = medianBar(counts);
      return { counted: pick + 1, pick };
    },
    wrong(/** @type {any} */ spec) {
      const counts = spec.model.bins.map((/** @type {any} */ b) => b.n);
      const right = medianBar(counts);
      const sol = A.registry.countoff.solution(spec);
      const tall = tallest(counts);
      const out = [
        { counted: tall + 1, pick: tall },
        { counted: 0, pick: null },
        { counted: 0, pick: right },
        ...counts.map((_n, i) => ({ counted: i + 1, pick: i })),
        { counted: counts.length, pick: counts.length - 1 },
      ].filter((s) => !(s.pick === sol.pick && s.counted >= sol.counted));
      return out.filter((s) => !grade(spec, s).ok);
    },
    grade,
    mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
      const K = kit();
      const M = spec.model;
      const { root, L, B, live, ro } = K.shell(host, api);
      const counts = M.bins.map((/** @type {any} */ b) => b.n);
      const max = Math.max(...counts);
      const saved = api.restore && Number.isInteger(api.restore.counted) ? api.restore : null;
      const st = {
        counted: saved ? saved.counted : 0,
        pick: saved && Number.isInteger(saved.pick) ? saved.pick : null,
      };
      const emit = () => api.change?.({ counted: st.counted, pick: st.pick });
      const tally = A.el("p", "u2-note");
      const mid = A.el("p", "u2-note");
      const tiles = A.el("div", "u2-row");
      const bars = A.el("div", "u2-bars");
      const cols = counts.map((/** @type {number} */ n, /** @type {number} */ i) => {
        const cw = A.el("div", "u2-colwrap");
        const b = M.bins[i];
        const btn = A.el("button", "u2-opt", "", { type: "button" });
        btn.style.cssText = `width:100%;min-height:${24 + (n / max) * 120}px;padding:2px;text-align:center;font-weight:800`;
        btn.disabled = ro;
        const pickBtn = A.el("button", "u2-btn", B("Median here", "Mediana aquí"), {
          type: "button",
        });
        pickBtn.style.minWidth = "0";
        pickBtn.style.padding = "4px 6px";
        pickBtn.style.fontSize = ".78rem";
        pickBtn.disabled = ro;
        cw.append(btn, A.el("div", "u2-lab", `${b.lo}–${b.hi}`), pickBtn);
        bars.append(cw);
        btn.addEventListener("click", () => {
          if (i < st.counted) {
            const m = L("That bar is already in the tally.", "Esa barra ya está en el conteo.");
            live.textContent = m;
            return api.say?.(m);
          }
          if (i > st.counted) {
            const m = L(
              "Count in order from the left. Tap the next bar.",
              "Cuenta en orden desde la izquierda. Toca la siguiente barra.",
            );
            live.textContent = m;
            return api.say?.(m);
          }
          st.counted++;
          paint();
          emit();
          api.say?.(tally.textContent);
        });
        pickBtn.addEventListener("click", () => {
          st.pick = i;
          paint();
          emit();
        });
        return { btn, pickBtn, n, b };
      });
      const paint = () => {
        const t = upTo(counts, st.counted);
        cols.forEach((c, i) => {
          c.btn.innerHTML = String(c.n);
          c.btn.setAttribute("aria-pressed", String(i < st.counted));
          c.btn.style.background = i < st.counted ? "var(--brand-tint,#E5ECF3)" : "";
          c.btn.style.borderColor = i < st.counted ? "var(--brand,#2C4A68)" : "";
          c.btn.setAttribute(
            "aria-label",
            L(
              `Bar ${c.b.lo} to ${c.b.hi}: ${c.n} ${M.noun}. ${i < st.counted ? "Counted." : "Tap to add to the tally."}`,
              `Barra de ${c.b.lo} a ${c.b.hi}: ${c.n} ${M.nounEs}. ${i < st.counted ? "Contada." : "Toca para sumar al conteo."}`,
            ),
          );
          c.pickBtn.setAttribute("aria-pressed", String(st.pick === i));
          c.pickBtn.setAttribute(
            "aria-label",
            L(
              `The median is in the bar ${c.b.lo} to ${c.b.hi}`,
              `La mediana está en la barra de ${c.b.lo} a ${c.b.hi}`,
            ),
          );
          c.pickBtn.style.background = st.pick === i ? "var(--sun,#F0BD4F)" : "";
        });
        tally.innerHTML = B(
          `Tally: ${t} of ${M.n} ${M.noun} counted.`,
          `Conteo: ${t} de ${M.n} ${M.nounEs} contados.`,
        );
        tiles.textContent = "";
        const midPos = (M.n + 1) / 2;
        for (let k = 1; k <= M.n; k++) {
          const tile = A.el("span", "", "", { "aria-hidden": "true" });
          tile.style.cssText = `display:inline-block;width:20px;height:20px;border-radius:4px;border:2px solid var(--ink,#1B2733);background:${k <= t ? "var(--brand,#2C4A68)" : "var(--surface,#fff)"};${M.showMid && k === midPos ? "outline:3px solid var(--sun,#F0BD4F);outline-offset:2px;" : ""}`;
          tiles.append(tile);
        }
      };
      mid.innerHTML = M.showMid
        ? B(
            `The middle value is number ${(M.n + 1) / 2} of ${M.n}.`,
            `El valor del medio es el número ${(M.n + 1) / 2} de ${M.n}.`,
          )
        : B(
            `There are ${M.n} values. Decide which number is the middle one.`,
            `Hay ${M.n} valores. Decide cuál número es el del medio.`,
          );
      const box = A.el("div", "u2-box");
      box.append(bars);
      root.append(box, mid, tally, tiles, live);
      paint();
      if (!ro)
        K.actions(
          root,
          api,
          B,
          () => ({ counted: st.counted, pick: st.pick }),
          () => {
            st.counted = 0;
            st.pick = null;
            paint();
            emit();
          },
        );
    },
  });
})();

/**
 * Practice Studio activity: chartbuild (lessons 2-2 .. 2-5).
 *
 * mode "dot":  tap columns to stack one dot per table value; the table ticks values off as they are placed.
 * mode "hist": choose one of three bin sizes, then raise each bar to match the frequency table.
 * mode "box":  sort the list, mark min / Q1 / median / Q3 / max (halves exclude the middle value when n is odd),
 *              then answer a reading question. grade() checks the final construction.
 * Text is stored as "English|Spanish" pairs. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;
  const EPS = 1e-6;
  const f = (n) => G.fmt(n, 2);
  const sorted = (d) => d.slice().sort((a, b) => a - b);
  const med = (s) => {
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  /** Five-number summary: Q1 and Q3 are the medians of the lower and upper halves; an odd middle value is left out. */
  const five = (d) => {
    const s = sorted(d);
    const h = s.length >> 1;
    return [s[0], med(s.slice(0, h)), med(s), med(s.slice(s.length - h)), s[s.length - 1]];
  };
  const same = (a, b) => Math.abs(a - b) < EPS;
  const fill = (s, o = {}) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]).split("|");
  const no = (tag, key, o) => {
    const [say, sayEs] = fill(MSG[key], o);
    return { ok: false, tag, say, sayEs };
  };

  const WHAT = [
    "minutes each student read|minutos que leyó cada estudiante",
    "points scored in each game|puntos anotados en cada juego",
    "laps each runner ran|vueltas que corrió cada corredor",
    "books each student read|libros que leyó cada estudiante",
    "dollars each stand earned|dólares que ganó cada puesto",
  ];
  const MSG = {
    "dot-few":
      "Your plot has fewer dots than the table has values. Tick every value in the table: the table shows what is still missing.|Tu diagrama tiene menos puntos que valores en la tabla. Marca cada valor de la tabla: la tabla muestra lo que falta.",
    "dot-many":
      "Your plot has more dots than the table has values. Look for a column that has a dot with no value left to tick off.|Tu diagrama tiene más puntos que valores en la tabla. Busca una columna con un punto sin valor para marcar.",
    "dot-moved":
      "The number of dots is right, but the column {v} does not match the table. Count how many {v}s the table lists.|La cantidad de puntos es correcta, pero la columna {v} no coincide con la tabla. Cuenta cuántos {v} hay en la tabla.",
    "bin-wide":
      "That bin size makes only {k} bars, which hides the shape of the data. Use a smaller bin size.|Ese tamaño de intervalo hace solo {k} barras y oculta la forma de los datos. Usa un intervalo más pequeño.",
    "bin-narrow":
      "That bin size makes {k} bars, so the data are split into too many tiny groups. Use a bigger bin size.|Ese tamaño de intervalo hace {k} barras y divide los datos en demasiados grupos pequeños. Usa un intervalo más grande.",
    bar: "The bar for {v} does not match the frequency in the table. Check that bar's count against its row.|La barra de {v} no coincide con la frecuencia de la tabla. Compara el conteo de esa barra con su fila.",
    unsorted:
      "Sort the whole list first: tap the smallest value left, then the next smallest, until every value is in the sorted row.|Primero ordena toda la lista: toca el valor más pequeño que quede, luego el siguiente, hasta que todos estén en la fila ordenada.",
    unmarked:
      "Mark all five numbers: minimum, Q1, median, Q3 and maximum.|Marca los cinco números: mínimo, Q1, mediana, Q3 y máximo.",
    "min-max":
      "The minimum and maximum are the smallest and largest values in the sorted list, the two ends of it.|El mínimo y el máximo son el valor más pequeño y el más grande de la lista ordenada: sus dos extremos.",
    median:
      "The median is the middle of the sorted list. With an even number of values, it is halfway between the two middle values.|La mediana es el centro de la lista ordenada. Si hay una cantidad par de valores, está a medio camino entre los dos del centro.",
    "q-middle":
      "With an odd number of values, the middle value belongs to neither half. Leave it out when you find Q1 and Q3.|Si hay una cantidad impar de valores, el valor del medio no pertenece a ninguna mitad. Déjalo fuera al hallar Q1 y Q3.",
    quartile:
      "Q1 is the median of the lower half and Q3 is the median of the upper half. Split the sorted list at the median first.|Q1 es la mediana de la mitad inferior y Q3 es la mediana de la mitad superior. Primero divide la lista ordenada en la mediana.",
    "iqr-range":
      "That is the range (maximum minus minimum). The IQR is Q3 minus Q1, the width of the box.|Eso es el rango (máximo menos mínimo). El RIC es Q3 menos Q1, el ancho de la caja.",
    iqr: "Check your subtraction: the IQR is Q3 minus Q1, the width of the box.|Revisa tu resta: el RIC es Q3 menos Q1, el ancho de la caja.",
    share:
      "The box runs from Q1 to Q3, and a quarter of the data sits in each part of the plot. Count how many parts the box covers.|La caja va de Q1 a Q3, y un cuarto de los datos está en cada parte del diagrama. Cuenta cuántas partes cubre la caja.",
  };
  const HINTS = {
    dot: [
      "Each value in the table gets one dot. A value that appears twice makes a stack of two.|Cada valor de la tabla recibe un punto. Un valor que aparece dos veces forma una pila de dos.",
      "Tap a column to add a dot and the minus button to take one away. Watch the table tick values off.|Toca una columna para añadir un punto y el botón menos para quitar uno. Mira cómo la tabla marca los valores.",
    ],
    hist: [
      "A histogram needs equal bins with no gaps. Find the smallest and largest values first.|Un histograma necesita intervalos iguales y sin espacios. Halla primero el valor menor y el mayor.",
      "The number of bars is about the largest value divided by the bin size. Which size gives the number of bars asked for?|La cantidad de barras es aproximadamente el valor mayor dividido entre el tamaño del intervalo. ¿Qué tamaño da la cantidad pedida?",
      "Each bar's height is the frequency in its row of the table. Raise the bar until it matches.|La altura de cada barra es la frecuencia de su fila en la tabla. Sube la barra hasta que coincida.",
    ],
    box: [
      "Sort the values from least to greatest. The minimum and maximum are the two ends.|Ordena los valores de menor a mayor. El mínimo y el máximo son los dos extremos.",
      "The median splits the list in half. Q1 is the median of the lower half and Q3 is the median of the upper half. If the count is odd, leave the middle value out of both halves.|La mediana divide la lista en dos mitades. Q1 es la mediana de la mitad inferior y Q3 la de la mitad superior. Si la cantidad es impar, deja el valor del medio fuera de ambas mitades.",
      "Tap a sorted value to place the marker that is selected, or use the minus and plus buttons.|Toca un valor ordenado para colocar el marcador seleccionado, o usa los botones menos y más.",
    ],
  };
  const EXPLAIN = {
    dot: "A dot plot shows every value: a value that repeats stacks higher, so the tallest stack is the most common value.|Un diagrama de puntos muestra cada valor: un valor repetido forma una pila más alta, así que la pila más alta es el valor más común.",
    hist: "Bins of equal width cover all the data with no gaps. Each bar's height is the frequency of its interval, so the shape shows where the data cluster.|Los intervalos de igual ancho cubren todos los datos sin espacios. La altura de cada barra es la frecuencia de su intervalo, así que la forma muestra dónde se agrupan los datos.",
    box: "The five-number summary splits the sorted data into four parts with about a quarter of the values in each. The box is the middle half, from Q1 to Q3, and the IQR is Q3 − Q1.|El resumen de cinco números divide los datos ordenados en cuatro partes con casi un cuarto de los valores en cada una. La caja es la mitad central, de Q1 a Q3, y el RIC es Q3 − Q1.",
  };

  /* ---- model ----------------------------------------------------------------------------------------- */
  const SIZE = [0, 8, 12, 16, 20];
  const counts = (data, lo, hi) => {
    const c = Array(hi - lo + 1).fill(0);
    for (const v of data) c[v - lo]++;
    return c;
  };
  const bins = (max, w) =>
    Array.from({ length: Math.floor(max / w) + 1 }, (_, k) => [k * w, k * w + w - 1]);
  const freq = (data, max, w) =>
    bins(max, w).map(([a, b]) => data.filter((v) => v >= a && v <= b).length);
  const mkDot = (rng, lv) => {
    const hi = [0, 8, 10, 12, 14][lv];
    const data = Array.from({ length: SIZE[lv] }, () =>
      Math.round((rng.int(1, hi) + rng.int(1, hi)) / 2),
    );
    return { data, lo: 1, hi, ok: new Set(data).size >= 4 };
  };
  const mkHist = (rng, lv) => {
    const w = rng.pick([4, 10]);
    const R = rng.int(4, 6);
    const data = Array.from({ length: SIZE[lv] }, () =>
      Math.round((rng.int(0, R * w - 1) + rng.int(0, R * w - 1)) / 2),
    );
    const max = Math.max(...data);
    const opts = [w / 2, w, w * 2];
    return {
      data,
      max,
      w,
      R: bins(max, w).length,
      opts,
      ok: bins(max, w).length >= 4 && bins(max, w).length <= 6 && Math.min(...data) >= 0,
    };
  };
  const mkBox = (rng, lv) => {
    const n = [0, 8, 11, 14, 17][lv];
    const data = Array.from({ length: n }, () => Math.round((rng.int(2, 40) + rng.int(2, 40)) / 2));
    const s = sorted(data);
    return {
      data,
      lo: 0,
      hi: 44,
      typed: lv >= 3,
      five: five(data),
      ok: new Set(s).size >= n - 2 && s[n - 1] - s[0] >= 14,
    };
  };
  const BUILD = { dot: mkDot, hist: mkHist, box: mkBox };

  const gradeDot = (spec, st) => {
    const M = spec.model;
    const exp = counts(M.data, M.lo, M.hi);
    const c = Array.isArray(st?.c) && st.c.length === exp.length ? st.c : null;
    if (!c || c.some((x) => !Number.isInteger(x) || x < 0)) return no("invalid", "dot-few");
    const tot = c.reduce((a, b) => a + b, 0);
    const i = c.findIndex((x, k) => x !== exp[k]);
    if (i < 0) return { ok: true };
    if (tot < M.data.length) return no("dot-few", "dot-few");
    if (tot > M.data.length) return no("dot-many", "dot-many");
    return no("dot-moved", "dot-moved", { v: M.lo + i });
  };
  const gradeHist = (spec, st) => {
    const M = spec.model;
    const w = M.opts.includes(st?.w) ? st.w : null;
    if (w === null) return no("bin-none", "bin-wide", { k: 1 });
    const bs = bins(M.max, w);
    if (w !== M.w)
      return no(w > M.w ? "bin-wide" : "bin-narrow", w > M.w ? "bin-wide" : "bin-narrow", {
        k: bs.length,
      });
    const fr = freq(M.data, M.max, w);
    const i = !Array.isArray(st.bars) ? 0 : fr.findIndex((x, k) => st.bars[k] !== x);
    return i < 0 ? { ok: true } : no("bar", "bar", { v: `${bs[i][0]}–${bs[i][1]}` });
  };
  const gradeBox = (spec, st) => {
    const M = spec.model;
    const s = sorted(M.data);
    const ord = Array.isArray(st?.ord) ? st.ord : [];
    const okSort = ord.length === s.length && ord.every((v, i) => v === s[i]);
    if (!okSort) return no("unsorted", "unsorted");
    const m =
      Array.isArray(st.m) && st.m.length === 5 && st.m.every((x) => Number.isFinite(x))
        ? st.m
        : null;
    if (!m) return no("unmarked", "unmarked");
    const e = M.five;
    if (!same(m[0], e[0]) || !same(m[4], e[4])) return no("min-max", "min-max");
    if (!same(m[2], e[2])) return no("median", "median");
    if (!same(m[1], e[1]) || !same(m[3], e[3])) {
      const h = (s.length + 1) >> 1;
      const incl =
        s.length % 2 && same(m[1], med(s.slice(0, h))) && same(m[3], med(s.slice(s.length - h)));
      return incl ? no("q-middle", "q-middle") : no("quartile", "quartile");
    }
    if (M.typed) {
      const v = G.value(st.a);
      if (same(v, e[3] - e[1])) return { ok: true };
      return Number.isFinite(v) && same(v, e[4] - e[0])
        ? no("iqr-range", "iqr-range")
        : no("iqr", "iqr");
    }
    return st.a === 1 ? { ok: true } : no("share", "share");
  };
  const GRADE = { dot: gradeDot, hist: gradeHist, box: gradeBox };
  const grade = (spec, st) => GRADE[spec.mode](spec, st);

  const QTXT = {
    dot: (a) => [
      `The table lists ${a[0]}. Tap the number line to stack one dot for each value in the table.`,
      `La tabla muestra ${a[1]}. Toca la recta numérica para apilar un punto por cada valor de la tabla.`,
    ],
    hist: (a, M) => [
      `These ${M.data.length} values show ${a[0]}. Choose a bin size that makes ${M.R} bars, then raise each bar to match the frequency table.`,
      `Estos ${M.data.length} valores muestran ${a[1]}. Elige un tamaño de intervalo que haga ${M.R} barras y sube cada barra para que coincida con la tabla de frecuencias.`,
    ],
    box: (a, M) => [
      `These ${M.data.length} values show ${a[0]}. Sort them, mark the five-number summary, then ${M.typed ? "find the IQR" : "answer the question"}.`,
      `Estos ${M.data.length} valores muestran ${a[1]}. Ordénalos, marca el resumen de cinco números y luego ${M.typed ? "halla el RIC" : "responde la pregunta"}.`,
    ],
  };

  A.register("chartbuild", {
    title: "Build the chart",
    titleEs: "Construye la gráfica",
    levels: 4,
    make(rng, level, params) {
      const mode = params.mode || rng.pick(["dot", "hist", "box"]);
      let M;
      do M = BUILD[mode](rng, level);
      while (!M.ok);
      const what = rng.pick(WHAT).split("|");
      const [q, qEs] = QTXT[mode](what, M);
      const [x, xEs] = EXPLAIN[mode].split("|");
      const hs = HINTS[mode].map((s) => s.split("|"));
      return { mode, q, qEs, x, xEs, h: hs.map((s) => s[0]), hEs: hs.map((s) => s[1]), model: M };
    },
    solution(spec) {
      const M = spec.model;
      if (spec.mode === "dot") return { c: counts(M.data, M.lo, M.hi) };
      if (spec.mode === "hist") return { w: M.w, bars: freq(M.data, M.max, M.w) };
      return { ord: sorted(M.data), m: M.five.slice(), a: M.typed ? f(M.five[3] - M.five[1]) : 1 };
    },
    wrong(spec, rng) {
      const M = spec.model;
      const sol = /** @type {any} */ (this.solution(spec));
      const out = [];
      const add = (s) => grade(spec, s).ok || out.push(s);
      const bump = (arr, i, d) => arr.map((x, k) => (k === i ? Math.max(0, x + d) : x));
      if (spec.mode === "dot") {
        const i = sol.c.findIndex((x) => x > 0);
        add({ c: sol.c.map(() => 0) });
        add({ c: bump(sol.c, i, 1) });
        add({ c: bump(bump(sol.c, i, -1), (i + 1) % sol.c.length, 1) });
      } else if (spec.mode === "hist") {
        add({ w: M.opts[0] === M.w ? M.opts[1] : M.opts[0], bars: [] });
        add({ w: M.opts[2] === M.w ? M.opts[1] : M.opts[2], bars: [] });
        add({ w: M.w, bars: bump(sol.bars, rng.int(0, sol.bars.length - 1), 1) });
        add({ w: null, bars: [] });
      } else {
        add({ ord: [], m: [null, null, null, null, null], a: null });
        add({ ...sol, m: [sol.m[0], sol.m[1], sol.m[2] + 1, sol.m[3], sol.m[4]] });
        add({ ...sol, m: [sol.m[0], sol.m[1] + 1, sol.m[2], sol.m[3], sol.m[4]] });
        add({ ...sol, a: M.typed ? f(M.five[4] - M.five[0]) : 2 });
      }
      return out;
    },
    grade,
    mount: (host, spec, api) => mountChart(host, spec, api),
  });

  /* ---- widget ---------------------------------------------------------------------------------------- */
  const CSS = `
.cb-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.cb-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:44px;min-width:44px;padding:4px 14px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.cb-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.cb-btn:disabled{opacity:.45;cursor:not-allowed}
.cb-btn[aria-pressed="true"],.cb-btn[aria-checked="true"]{background:var(--brand-tint,#E5ECF3);border-color:var(--brand,#2C4A68);box-shadow:inset 0 0 0 2px var(--brand,#2C4A68)}
.cb-go .es-text{color:inherit}
.cb-go{background:var(--brand,#2C4A68);color:var(--surface,#fff)}
.cb-go:hover:not(:disabled){background:var(--brand,#2C4A68);filter:brightness(1.12)}
.cb-btn:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.cb-h{margin:0;font-weight:800;font-size:.9rem}
.cb-chips{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:0;padding:0}
.cb-chip{min-width:40px;text-align:center;padding:4px 8px;border:2px solid var(--brand-line,#BBCADA);border-radius:10px;background:var(--brand-tint,#E5ECF3);font-weight:700}
.cb-chip.on{background:var(--surface,#fff);border-color:var(--ok,#0A7D4B);text-decoration:line-through;opacity:.75}
.cb-chip.on::after{content:" \\2713";color:var(--ok,#0A7D4B)}
.cb-scroll{overflow-x:auto;border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);background:var(--surface,#fff);padding:4px}
.cb-cols{display:flex;min-width:min-content}
.cb-col{flex:1 0 44px;display:grid;justify-items:center;gap:2px}
.cb-add{appearance:none;font:inherit;cursor:pointer;width:100%;background:transparent;border:0;border-bottom:4px solid var(--brand,#2C4A68);display:flex;flex-direction:column-reverse;align-items:center;justify-content:flex-start;gap:3px;padding:0 0 4px;color:var(--ink,#1B2733)}
.cb-add:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.cb-add:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:-4px}
.cb-d{width:20px;height:20px;border-radius:50%;background:var(--sun,#F0BD4F);border:2px solid var(--ink,#1B2733);flex:none}
.cb-d.ex{background:var(--surface,#fff);border-style:dashed}
.cb-lab{font-weight:800;font-size:.9rem}
.cb-bar{width:70%;background:var(--brand,#2C4A68);border:2px solid var(--ink,#1B2733);border-bottom:0;border-radius:6px 6px 0 0;color:var(--surface,#fff);font-weight:800;text-align:center;font-size:.85rem}
.cb-plot{display:flex;align-items:flex-end}
.cb-tbl{border-collapse:collapse;font-size:.9rem}
.cb-tbl th,.cb-tbl td{border:2px solid var(--border,#D5DCE5);padding:4px 10px;text-align:center}
.cb-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.cb-mk{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:4px 6px;border:2px solid var(--border,#D5DCE5);border-radius:12px}
.cb-mk.sel{border-color:var(--brand,#2C4A68);background:var(--brand-tint,#E5ECF3)}
.cb-mk b{min-width:5.5em}
.cb-val{min-width:2.5em;text-align:center;font-weight:800;font-size:1.1rem}
.cb-in{font:inherit;font-weight:800;min-height:44px;width:7em;padding:4px 10px;border-radius:12px;border:2px solid var(--brand,#2C4A68);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.cb-svg{width:100%;height:auto;max-width:480px}
.cb-svg *{vector-effect:non-scaling-stroke}
.cb-svg .bx{fill:var(--brand-tint,#E5ECF3);stroke:var(--brand,#2C4A68);stroke-width:3}
.cb-svg line{stroke:var(--brand,#2C4A68);stroke-width:3}
.cb-svg text{fill:var(--ink,#1B2733);font:700 11px system-ui,sans-serif;text-anchor:middle}
.cb-act{display:flex;flex-wrap:wrap;gap:10px}
.is-ro .cb-add,.is-ro .cb-btn{cursor:default}
@media (forced-colors:active){.cb-btn,.cb-chip,.cb-mk{border-color:ButtonText}.cb-d,.cb-bar{background:Highlight}}
`;

  function mountChart(host, spec, api) {
    A.css("chartbuild", CSS);
    const M = spec.model;
    const ro = !!api.solved;
    const L = (en, es) => (api.es?.() ? es : en);
    const B = (en, es) => A.t(en, es);
    const h = (tg, cls = "", html = "", at = {}) => /** @type {any} */ (A.el(tg, cls, html, at));
    const NS = "http://www.w3.org/2000/svg";
    const btn = (html, fn, cls = "") => {
      const b = h("button", `cb-btn ${cls}`, html, { type: "button" });
      b.addEventListener("click", fn);
      return b;
    };
    const init = () =>
      spec.mode === "dot"
        ? { c: Array(M.hi - M.lo + 1).fill(0) }
        : spec.mode === "hist"
          ? { w: null, bars: [] }
          : { ord: [], m: [null, null, null, null, null], a: null };
    let st = api.restore ? JSON.parse(JSON.stringify(api.restore)) : init();
    let active = 0;
    const save = (say) => {
      api.change?.(JSON.parse(JSON.stringify(st)));
      if (say) api.say?.(say);
      draw();
    };
    host.textContent = "";
    const root = h("div", `cb-root${ro ? " is-ro" : ""}`);
    host.append(root);
    const body = h("div", "cb-root");
    root.append(body);

    const drawDot = () => {
      const exp = counts(M.data, M.lo, M.hi);
      const need = sorted(M.data);
      const seen = {};
      const chips = h("ul", "cb-chips", "", {
        "aria-label": L("Values in the table", "Valores de la tabla"),
      });
      for (const v of need) {
        seen[v] = (seen[v] || 0) + 1;
        chips.append(h("li", `cb-chip${st.c[v - M.lo] >= seen[v] ? " on" : ""}`, String(v)));
      }
      const cols = h("div", "cb-cols", "", {
        role: "group",
        "aria-label": L("Dot plot columns", "Columnas del diagrama de puntos"),
      });
      st.c.forEach((n, i) => {
        const v = M.lo + i;
        const col = h("div", "cb-col");
        const add = h("button", "cb-add", "", {
          type: "button",
          "aria-label": L(
            `Add a dot at ${v}. ${n} dots now.`,
            `Añadir un punto en ${v}. Ahora hay ${n}.`,
          ),
        });
        add.style.minHeight = `${Math.max(...exp, 4) * 23 + 14}px`;
        for (let k = 0; k < n; k++) add.append(h("i", `cb-d${k >= exp[i] ? " ex" : ""}`));
        add.disabled = ro;
        add.addEventListener("click", () => {
          st.c[i]++;
          save(L(`Dot added at ${v}.`, `Punto añadido en ${v}.`));
        });
        const rm = btn("−", () => {
          st.c[i]--;
          save(L(`Dot removed from ${v}.`, `Punto quitado de ${v}.`));
        });
        rm.setAttribute("aria-label", L(`Remove a dot from ${v}`, `Quitar un punto de ${v}`));
        rm.disabled = ro || n === 0;
        col.append(add, h("span", "cb-lab", String(v)), rm);
        cols.append(col);
      });
      body.append(h("p", "cb-h", B("Table", "Tabla")), chips, h("div", "cb-scroll", ""));
      body.lastChild.append(cols);
    };

    const drawHist = () => {
      body.append(
        h(
          "p",
          "cb-h",
          B(
            "Bin size (the width of each interval)",
            "Tamaño del intervalo (el ancho de cada intervalo)",
          ),
        ),
      );
      const row = h("div", "cb-row", "", {
        role: "radiogroup",
        "aria-label": L("Bin size", "Tamaño del intervalo"),
      });
      for (const w of M.opts) {
        const b = btn(String(w), () => {
          st = { w, bars: Array(bins(M.max, w).length).fill(0) };
          save(L(`Bin size ${w}.`, `Intervalo de tamaño ${w}.`));
        });
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(st.w === w));
        b.disabled = ro;
        row.append(b);
      }
      body.append(row);
      if (!st.w) return;
      const bs = bins(M.max, st.w);
      const fr = freq(M.data, M.max, st.w);
      const rows = bs.map((b, i) => `<tr><td>${b[0]}–${b[1]}</td><td>${fr[i]}</td></tr>`).join("");
      const tbl = h(
        "table",
        "cb-tbl",
        `<thead><tr><th>${B("Interval", "Intervalo")}</th><th>${B("Frequency", "Frecuencia")}</th></tr></thead><tbody>${rows}</tbody>`,
      );
      const plot = h("div", "cb-plot");
      const top = Math.max(...fr, 3);
      bs.forEach((b, i) => {
        const col = h("div", "cb-col");
        const n = st.bars[i] || 0;
        const bar = h("div", "cb-bar", n ? String(n) : "");
        bar.style.height = `${n * 18}px`;
        const area = h("div", "", "");
        area.style.cssText = `height:${top * 18 + 20}px;display:flex;align-items:flex-end;justify-content:center;width:100%;border-bottom:4px solid var(--brand,#2C4A68)`;
        area.append(bar);
        const up = btn("+", () => {
          st.bars[i] = n + 1;
          save(
            L(`Bar ${b[0]} to ${b[1]} is ${n + 1}.`, `La barra de ${b[0]} a ${b[1]} es ${n + 1}.`),
          );
        });
        const dn = btn("−", () => {
          st.bars[i] = n - 1;
          save(
            L(`Bar ${b[0]} to ${b[1]} is ${n - 1}.`, `La barra de ${b[0]} a ${b[1]} es ${n - 1}.`),
          );
        });
        up.setAttribute(
          "aria-label",
          L(`Raise the bar for ${b[0]} to ${b[1]}`, `Subir la barra de ${b[0]} a ${b[1]}`),
        );
        dn.setAttribute(
          "aria-label",
          L(`Lower the bar for ${b[0]} to ${b[1]}`, `Bajar la barra de ${b[0]} a ${b[1]}`),
        );
        up.disabled = ro;
        dn.disabled = ro || n === 0;
        col.append(area, h("span", "cb-lab", `${b[0]}–${b[1]}`), up, dn);
        plot.append(col);
      });
      const sc = h("div", "cb-scroll");
      sc.append(plot);
      body.append(tbl, sc);
    };

    const drawBox = () => {
      const s = sorted(M.data);
      const done = st.ord.length === M.data.length;
      body.append(
        h(
          "p",
          "cb-h",
          B(
            "Step 1: tap the values from smallest to largest",
            "Paso 1: toca los valores de menor a mayor",
          ),
        ),
      );
      const pool = h("div", "cb-row", "", {
        role: "group",
        "aria-label": L("Unsorted values", "Valores sin ordenar"),
      });
      const used = [...st.ord];
      M.data.forEach((v) => {
        const k = used.indexOf(v);
        if (k >= 0) used.splice(k, 1);
        const b = btn(String(v), () => {
          if (v !== s[st.ord.length]) {
            api.say?.(
              L(
                `${v} is not the smallest value left.`,
                `${v} no es el valor más pequeño que queda.`,
              ),
            );
            b.animate?.(
              [
                { transform: "translateX(-4px)" },
                { transform: "translateX(4px)" },
                { transform: "none" },
              ],
              { duration: 200 },
            );
            return;
          }
          st.ord.push(v);
          save(L(`${v} added to the sorted row.`, `${v} añadido a la fila ordenada.`));
        });
        b.disabled = ro || k >= 0;
        pool.append(b);
      });
      const sortedRow = h("div", "cb-row", "", {
        "aria-label": L("Sorted values", "Valores ordenados"),
      });
      st.ord.forEach((v, i) => {
        const b = btn(String(v), () => {
          if (done) {
            st.m[active] = v;
            save();
          }
        });
        b.setAttribute(
          "aria-label",
          L(`Sorted value ${i + 1}: ${v}`, `Valor ordenado ${i + 1}: ${v}`),
        );
        b.disabled = ro || !done;
        sortedRow.append(b);
      });
      if (!ro) sortedRow.append(btn(B("Undo", "Deshacer"), () => (st.ord.pop(), save())));
      body.append(pool, h("p", "cb-h", B("Sorted row", "Fila ordenada")), sortedRow);
      if (!done) return;
      body.append(
        h(
          "p",
          "cb-h",
          B(
            "Step 2: set the five numbers (tap a sorted value, or use − and +)",
            "Paso 2: fija los cinco números (toca un valor ordenado, o usa − y +)",
          ),
        ),
      );
      const names = ["Minimum|Mínimo", "Q1|Q1", "Median|Mediana", "Q3|Q3", "Maximum|Máximo"].map(
        (x) => x.split("|"),
      );
      names.forEach((nm, i) => {
        const row = h("div", `cb-mk${i === active ? " sel" : ""}`);
        const step = (d) => {
          st.m[i] =
            st.m[i] === null ? s[s.length >> 1] : Math.max(M.lo, Math.min(M.hi, st.m[i] + d));
          active = i;
          save(L(`${nm[0]} is ${f(st.m[i])}.`, `${nm[1]} es ${f(st.m[i])}.`));
        };
        const dn = btn("−", () => step(-0.5));
        const up = btn("+", () => step(0.5));
        dn.setAttribute("aria-label", L(`Lower ${nm[0]}`, `Bajar ${nm[1]}`));
        up.setAttribute("aria-label", L(`Raise ${nm[0]}`, `Subir ${nm[1]}`));
        dn.disabled = up.disabled = ro;
        const sel = btn(B("Select", "Elegir"), () => {
          active = i;
          draw();
        });
        sel.setAttribute("aria-pressed", String(i === active));
        sel.setAttribute("aria-label", L(`Select ${nm[0]}`, `Elegir ${nm[1]}`));
        sel.disabled = ro;
        row.append(
          h("b", "", B(nm[0], nm[1])),
          dn,
          h("span", "cb-val", st.m[i] === null ? "?" : f(st.m[i])),
          up,
          sel,
        );
        body.append(row);
      });
      if (st.m.every((x) => x !== null)) body.append(boxSvg());
      body.append(h("p", "cb-h", B("Step 3", "Paso 3")));
      if (M.typed) {
        const lab = h("label", "cb-h", B("What is the IQR?", "¿Cuál es el RIC?"));
        const inp = h("input", "cb-in", "", {
          type: "text",
          inputmode: "decimal",
          autocomplete: "off",
          value: st.a ?? "",
        });
        inp.disabled = ro;
        inp.addEventListener("input", () => {
          st.a = inp.value;
          api.change?.(JSON.parse(JSON.stringify(st)));
        });
        lab.append(" ", inp);
        body.append(lab);
      } else {
        body.append(
          h(
            "p",
            "",
            B(
              "What fraction of the data is inside the box?",
              "¿Qué fracción de los datos está dentro de la caja?",
            ),
          ),
        );
        const row = h("div", "cb-row", "", {
          role: "radiogroup",
          "aria-label": L("Fraction inside the box", "Fracción dentro de la caja"),
        });
        ["25%", "50%", "75%"].forEach((t, i) => {
          const b = btn(t, () => {
            st.a = i;
            save();
          });
          b.setAttribute("role", "radio");
          b.setAttribute("aria-checked", String(st.a === i));
          b.disabled = ro;
          row.append(b);
        });
        body.append(row);
      }
    };
    /** The box plot draws itself from the five marked numbers. */
    const boxSvg = () => {
      const X = (v) => 12 + ((v - M.lo) / (M.hi - M.lo)) * 296;
      const s = document.createElementNS(NS, "svg");
      s.setAttribute("viewBox", "0 0 320 78");
      s.setAttribute("class", "cb-svg");
      s.setAttribute("role", "img");
      const [a, q1, m, q3, z] = st.m;
      s.setAttribute(
        "aria-label",
        L(
          `Box plot from ${f(a)} to ${f(z)}, box from ${f(q1)} to ${f(q3)}, median ${f(m)}`,
          `Diagrama de caja de ${f(a)} a ${f(z)}, caja de ${f(q1)} a ${f(q3)}, mediana ${f(m)}`,
        ),
      );
      let g = `<line x1="${X(a)}" x2="${X(q1)}" y1="26" y2="26"/><line x1="${X(q3)}" x2="${X(z)}" y1="26" y2="26"/><line x1="${X(a)}" x2="${X(a)}" y1="16" y2="36"/><line x1="${X(z)}" x2="${X(z)}" y1="16" y2="36"/>`;
      g += `<rect class="bx" x="${X(q1)}" y="12" width="${Math.max(2, X(q3) - X(q1))}" height="28"/><line x1="${X(m)}" x2="${X(m)}" y1="12" y2="40"/>`;
      for (let v = M.lo; v <= M.hi; v += 4)
        g += `<line x1="${X(v)}" x2="${X(v)}" y1="50" y2="55" style="stroke-width:2"/><text x="${X(v)}" y="68">${v}</text>`;
      s.innerHTML = g;
      return s;
    };

    function draw() {
      const keep =
        document.activeElement && host.contains(document.activeElement)
          ? document.activeElement.getAttribute("aria-label")
          : null;
      body.textContent = "";
      if (spec.mode === "dot") drawDot();
      else if (spec.mode === "hist") drawHist();
      else drawBox();
      if (keep)
        for (const e of body.querySelectorAll("[aria-label]"))
          if (
            e.getAttribute("aria-label") === keep ||
            e.getAttribute("aria-label")?.slice(0, 6) === keep.slice(0, 6)
          )
            return void e.focus?.();
    }
    draw();
    if (!ro) {
      const act = h("div", "cb-act");
      const reset = btn(B("Start over", "Empezar de nuevo"), () => {
        st = init();
        active = 0;
        save(L("Started over.", "Empezaste de nuevo."));
      });
      act.append(
        btn(B("Check", "Revisar"), () => api.submit?.(JSON.parse(JSON.stringify(st))), "cb-go"),
        btn(B("Hint", "Pista"), () => api.hint?.()),
        reset,
      );
      root.append(act);
    }
  }
})();

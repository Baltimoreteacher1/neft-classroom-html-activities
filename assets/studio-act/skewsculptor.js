/**
 * Practice Studio activity: skewsculptor, "Skew Sculptor" (lesson 2-2).
 *
 * The student moves 20 students between five bars to build a histogram with most of the data on the left and a tail to the
 * right, then a symmetric one, and (from level 2) sets the bar width of a real list with a slider and judges the result.
 * Bar width is never a multiple choice. grade() checks conditions on the counts, so many builds are right, and a miss names
 * where the data sits, never the finished shape. Needs assets/studio-act/u2kit.js (read lazily).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;
  const N = 20;
  const BARS = 5;
  const WIDTHS = [1, 2, 5, 10, 25];
  const SKEW_WORD = [
    "Right-skewed: most data on the left, a tail to the right",
    "Sesgada a la derecha: la mayoría de los datos a la izquierda y una cola a la derecha",
  ];

  const CTX = [
    "minutes they read last night|minutos que leyeron anoche|minutes|minutos|10",
    "push-ups they did in gym class|flexiones que hicieron en educación física|push-ups|flexiones|5",
    "pages they read this week|páginas que leyeron esta semana|pages|páginas|10",
    "dollars they saved this month|dólares que ahorraron este mes|dollars|dólares|10",
  ];

  /* ---- shape conditions on the five counts ----------------------------------------------------- */
  const peakOf = (/** @type {number[]} */ c) => c.indexOf(Math.max(...c));
  const isRight = (/** @type {number[]} */ c) => {
    const p = peakOf(c);
    if (p > 1 || c[BARS - 1] < 1 || c[0] + c[1] < N / 2 + 1) return false;
    for (let i = p; i < BARS - 1; i++) if (c[i + 1] > c[i]) return false;
    // a tail to the right pulls the mean above the median: check it on the counts themselves
    const data = c.flatMap((n, i) => Array(n).fill(i));
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    return mean > data[(data.length - 1) >> 1] / 2 + data[data.length >> 1] / 2;
  };
  const isSym = (/** @type {number[]} */ c) =>
    c[0] === c[4] && c[1] === c[3] && c[2] > c[1] && c[1] >= c[0];
  /** Every count list that sums to N with bars of 0..12, built once. */
  let ALL = /** @type {number[][]|null} */ (null);
  const all = () => {
    if (ALL) return ALL;
    const out = /** @type {number[][]} */ ([]);
    const rec = (/** @type {number[]} */ a, /** @type {number} */ left) => {
      if (a.length === BARS - 1) {
        if (left >= 0 && left <= 12) out.push([...a, left]);
        return;
      }
      for (let v = 0; v <= Math.min(12, left); v++) rec([...a, v], left - v);
    };
    rec([], N);
    ALL = out;
    return out;
  };
  const RIGHT = () => all().filter(isRight);
  const SYM = () => all().filter(isSym);

  const barsFor = (/** @type {number} */ maxV, /** @type {number} */ w) => Math.floor(maxV / w) + 1;
  const histFor = (/** @type {number[]} */ data, /** @type {number} */ w) => {
    const h = Array(barsFor(Math.max(...data), w)).fill(0);
    for (const v of data) h[Math.floor(v / w)]++;
    return h;
  };
  const readable = (/** @type {number} */ bars) => bars >= 4 && bars <= 10;

  const MSG = {
    total: (/** @type {number} */ used) =>
      `All ${N} students must be in the bars. Right now ${used} are placed. Raise or lower a bar until none are left over.|Los ${N} estudiantes deben estar en las barras. Ahora hay ${used} colocados. Sube o baja una barra hasta que no sobre ninguno.`,
    rightRight:
      "Most of your data sits on the right side, so any tail runs to the left. Build it the other way: most of the data on the left.|La mayoría de tus datos está en el lado derecho, así que la cola va hacia la izquierda. Constrúyela al revés: la mayoría de los datos a la izquierda.",
    rightMid:
      "Most of your data sits in the middle, with the same kind of tail on both sides. Move most of the students toward one end.|La mayoría de tus datos está en el medio, con el mismo tipo de cola en los dos lados. Mueve a la mayoría de los estudiantes hacia un extremo.",
    rightHalf:
      "Fewer than half of the students are in the two left bars. Most of the data should sit on the left.|Menos de la mitad de los estudiantes está en las dos barras de la izquierda. La mayoría de los datos debe estar a la izquierda.",
    rightTail:
      "Most of the data is on the left, but the bars to the right do not step down toward the right edge, or they stop early. A tail keeps going.|La mayoría de los datos está a la izquierda, pero las barras de la derecha no bajan poco a poco hacia el borde derecho, o se detienen antes. Una cola sigue hasta el final.",
    symMirror:
      "The two sides do not match. Compare the bar at one end with the bar at the other end, then the next pair in.|Los dos lados no se parecen. Compara la barra de un extremo con la del otro extremo, y luego el siguiente par.",
    symPeak:
      "In a symmetric histogram most of the data sits near the middle. The middle bar should hold more students than the bars beside it.|En un histograma simétrico la mayoría de los datos está cerca del medio. La barra del medio debe tener más estudiantes que las barras de al lado.",
    symEdge:
      "The two sides match, but the bars beside the middle should not be shorter than the bars at the ends.|Los dos lados se parecen, pero las barras junto al medio no deben ser más bajas que las de los extremos.",
    peak: (/** @type {number} */ want, /** @type {number} */ got) =>
      `The tallest bar has to hold exactly ${want} students. Yours holds ${got}.|La barra más alta tiene que tener exactamente ${want} estudiantes. La tuya tiene ${got}.`,
    edge: (/** @type {number} */ want) =>
      `The bars at the two ends have to hold exactly ${want} students each.|Las barras de los dos extremos tienen que tener exactamente ${want} estudiantes cada una.`,
    tail: (/** @type {number} */ want) =>
      `The bar at the far right has to hold exactly ${want}.|La barra del extremo derecho tiene que tener exactamente ${want}.`,
    bwMany:
      "With bars this narrow, the students are spread over many bars and most bars hold only one or two students. The shape is hard to see. Try wider bars.|Con barras tan angostas, los estudiantes se reparten en muchas barras y la mayoría tiene uno o dos estudiantes. La forma es difícil de ver. Prueba con barras más anchas.",
    bwFew:
      "With bars this wide, the students are squeezed into a couple of bars and the shape is hidden. Try narrower bars.|Con barras tan anchas, los estudiantes quedan apretados en un par de barras y la forma se esconde. Prueba con barras más angostas.",
    bwNone:
      "Move the slider and look at the histogram. Choose the bar width that shows the shape best.|Mueve el control y mira el histograma. Elige el ancho de barra que muestre mejor la forma.",
  };

  const partRight = (/** @type {any} */ spec, /** @type {number[]} */ c) => {
    const K = kit();
    const need = spec.model.parts[0];
    if (!Array.isArray(c) || c.length !== BARS) return K.no("stat-shape-misread", MSG.total(0));
    const used = K.sum(c);
    if (used !== N) return K.no("skew-total", MSG.total(used));
    if (!isRight(c)) {
      const p = peakOf(c);
      if (p >= 3) return K.no("stat-shape-misread", MSG.rightRight);
      if (p === 2) return K.no("stat-shape-misread", MSG.rightMid);
      if (c[0] + c[1] < N / 2 + 1) return K.no("stat-shape-misread", MSG.rightHalf);
      return K.no("stat-shape-misread", MSG.rightTail);
    }
    if (need.peak != null && Math.max(...c) !== need.peak)
      return K.no("skew-peak", MSG.peak(need.peak, Math.max(...c)));
    if (need.tail != null && c[BARS - 1] !== need.tail)
      return K.no("skew-tail", MSG.tail(need.tail));
    return { ok: true };
  };
  const partSym = (/** @type {any} */ spec, /** @type {number[]} */ c) => {
    const K = kit();
    const need = spec.model.parts[1];
    if (!Array.isArray(c) || c.length !== BARS) return K.no("stat-shape-misread", MSG.total(0));
    const used = K.sum(c);
    if (used !== N) return K.no("skew-total", MSG.total(used));
    if (c[0] !== c[4] || c[1] !== c[3]) return K.no("stat-shape-misread", MSG.symMirror);
    if (c[2] <= c[1]) return K.no("stat-shape-misread", MSG.symPeak);
    if (c[1] < c[0]) return K.no("stat-shape-misread", MSG.symEdge);
    if (need.peak != null && c[2] !== need.peak)
      return K.no("skew-peak", MSG.peak(need.peak, c[2]));
    if (need.edge != null && c[0] !== need.edge) return K.no("skew-edge", MSG.edge(need.edge));
    return { ok: true };
  };
  const partWidth = (/** @type {any} */ spec, /** @type {number} */ bw) => {
    const K = kit();
    const M = spec.model;
    if (!Number.isInteger(bw) || bw < 0 || bw >= WIDTHS.length)
      return K.no("stat-histogram-bin-misread", MSG.bwNone);
    const bars = barsFor(Math.max(...M.data), WIDTHS[bw]);
    if (readable(bars)) return { ok: true };
    return K.no("stat-histogram-bin-misread", bars > 10 ? MSG.bwMany : MSG.bwFew);
  };

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const s = state || {};
    const res = [partRight(spec, s.skew), partSym(spec, s.sym)];
    if (spec.model.width) res.push(partWidth(spec, s.bw));
    const marks = res.map((r) => r.ok === true);
    const bad = res.find((r) => !r.ok);
    return bad ? { ...bad, ...K.score(marks) } : { ok: true, ...K.score(marks) };
  };

  A.register("skewsculptor", {
    title: "Skew sculptor",
    titleEs: "Escultor de sesgo",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const [thing, thingEs, unit, unitEs, bw0] = rng.pick(CTX).split("|");
      const w0 = Number(bw0);
      const labels = Array.from({ length: BARS }, (_, i) => `${i * w0}–${(i + 1) * w0 - 1}`);
      // right-skewed and symmetric candidates; levels 3 and 4 pin one number so the build takes reasoning, not luck
      const parts = [{}, {}];
      let right = RIGHT();
      let sym = SYM();
      if (level >= 3) {
        const peaks = [...new Set(right.map((c) => Math.max(...c)))].filter(
          (p) => p >= 7 && p <= 10,
        );
        parts[0].peak = rng.pick(peaks);
        right = right.filter((c) => Math.max(...c) === parts[0].peak);
        if (level === 4) {
          const tails = [...new Set(right.map((c) => c[4]))].filter((t) => t >= 1 && t <= 2);
          parts[0].tail = rng.pick(tails);
          right = right.filter((c) => c[4] === parts[0].tail);
          const edges = [...new Set(sym.map((c) => c[0]))].filter((e) => e >= 1 && e <= 2);
          parts[1].edge = rng.pick(edges);
          sym = sym.filter((c) => c[0] === parts[1].edge);
        } else {
          const peaks2 = [...new Set(sym.map((c) => c[2]))].filter((p) => p >= 6 && p <= 10);
          parts[1].peak = rng.pick(peaks2);
          sym = sym.filter((c) => c[2] === parts[1].peak);
        }
      }
      const solSkew = rng.pick(right);
      const solSym = rng.pick(sym);
      const width = level >= 2;
      // a skewed list of 20 whole numbers from 0 to 49 whose largest value is at least 40
      let data = /** @type {number[]} */ ([]);
      if (width) {
        const top = rng.int(40, 49);
        data = [top];
        const groups = [
          [0, 14, 9],
          [15, 29, 6],
          [30, 39, 3],
          [40, top, 1],
        ];
        for (const [lo, hi, k] of groups)
          for (let i = 0; i < k; i++) data.push(rng.int(lo, Math.min(hi, top)));
        data.sort((a, b) => a - b);
      }
      const need = (/** @type {any} */ p, /** @type {boolean} */ isRightPart) => {
        const en = [];
        const es = [];
        if (p.peak != null) {
          en.push(`the tallest bar holds exactly ${p.peak} students`);
          es.push(`la barra más alta tiene exactamente ${p.peak} estudiantes`);
        }
        if (p.tail != null) {
          en.push(`the bar at the far right holds exactly ${p.tail}`);
          es.push(`la barra del extremo derecho tiene exactamente ${p.tail}`);
        }
        if (p.edge != null) {
          en.push(`each end bar holds exactly ${p.edge}`);
          es.push(`cada barra de los extremos tiene exactamente ${p.edge}`);
        }
        void isRightPart;
        return [en.length ? ` (${en.join(" and ")})` : "", es.length ? ` (${es.join(" y ")})` : ""];
      };
      const n1 = need(parts[0], true);
      const n2 = need(parts[1], false);
      const lead = `${N} students were asked about the ${thing}. Each bar is a group of ${unit}. Use the same ${N} students for each build. First build a histogram with most of the data on the left and a tail stretching to the right (right-skewed)${n1[0]}. Then build a symmetric one, where the two sides match${n2[0]}.`;
      const leadEs = `Se preguntó a ${N} estudiantes sobre los ${thingEs}. Cada barra es un grupo de ${unitEs}. Usa los mismos ${N} estudiantes en cada construcción. Primero construye un histograma con la mayoría de los datos a la izquierda y una cola que se extiende a la derecha (sesgado a la derecha)${n1[1]}. Luego construye uno simétrico, donde los dos lados se parezcan${n2[1]}.`;
      return {
        q: width
          ? `${lead} Last, here is a real list of ${N} ${unit}. Use the slider to set the bar width so the shape is easy to see.`
          : lead,
        qEs: width
          ? `${leadEs} Por último, aquí hay una lista real de ${N} ${unitEs}. Usa el control para fijar el ancho de barra de modo que la forma se vea con claridad.`
          : leadEs,
        x: "In a right-skewed histogram most of the data is on the left and a tail stretches to the right. In a symmetric one the two sides match. The bar width matters too: bars that are too narrow or too wide hide the shape.",
        xEs: "En un histograma sesgado a la derecha la mayoría de los datos está a la izquierda y una cola se extiende a la derecha. En uno simétrico los dos lados se parecen. El ancho de barra también importa: barras muy angostas o muy anchas esconden la forma.",
        h: [
          "Count where most of the students sit. Is that side the left, the middle, or the right?",
          "A tail is a few students far from where most of the data sits. Keep the tail bars short and stepping down.",
          "You can only raise a bar by lowering another one, because the total stays 20.",
        ],
        hEs: [
          "Cuenta dónde está la mayoría de los estudiantes. ¿Es el lado izquierdo, el medio o el derecho?",
          "Una cola son pocos estudiantes lejos de donde está la mayoría de los datos. Mantén las barras de la cola bajas y que bajen poco a poco.",
          "Solo puedes subir una barra bajando otra, porque el total sigue siendo 20.",
        ],
        model: {
          labels,
          w0,
          unit,
          unitEs,
          thing,
          thingEs,
          parts,
          width,
          data,
          widths: WIDTHS,
          start: [4, 4, 4, 4, 4],
          solSkew,
          solSym,
        },
      };
    },
    solution(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = { skew: M.solSkew.slice(), sym: M.solSym.slice(), bw: null };
      if (M.width) sol.bw = WIDTHS.findIndex((w) => readable(barsFor(Math.max(...M.data), w)));
      return sol;
    },
    wrong(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = A.registry.skewsculptor.solution(spec);
      const flat = M.start.slice();
      const out = [
        { skew: flat, sym: flat.slice(), bw: M.width ? 0 : null },
        { ...sol, skew: sol.sym.slice(), sym: sol.skew.slice() },
        { ...sol, skew: sol.skew.map((v, i) => (i === 0 ? v - 1 : v)) },
        M.width ? { ...sol, bw: 0 } : { ...sol, sym: flat.slice() },
        M.width ? { ...sol, bw: WIDTHS.length - 1 } : { ...sol, skew: flat.slice() },
      ];
      return out.filter((s) => !grade(spec, s).ok);
    },
    grade,
    mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
      const K = kit();
      const M = spec.model;
      const { root, L, B, live, ro } = K.shell(host, api);
      const saved = api.restore && Array.isArray(api.restore.skew) ? api.restore : null;
      const st = {
        skew: saved ? saved.skew.slice() : M.start.slice(),
        sym: saved ? saved.sym.slice() : M.start.slice(),
        bw: saved && Number.isInteger(saved.bw) ? saved.bw : null,
      };
      const emit = () => api.change?.({ skew: st.skew.slice(), sym: st.sym.slice(), bw: st.bw });
      const full = () => {
        const msg = L(
          "No students are left to place. Lower another bar first.",
          "No quedan estudiantes por colocar. Baja otra barra primero.",
        );
        live.textContent = msg;
        api.say?.(msg);
      };
      const section = (
        /** @type {string} */ en,
        /** @type {string} */ es,
        /** @type {"skew"|"sym"} */ key,
      ) => {
        const box = A.el("div", "u2-box");
        const used = A.el("p", "u2-note");
        const upd = () => {
          const n = K.sum(st[key]);
          used.innerHTML = B(
            `Students placed: ${n} of ${N}`,
            `Estudiantes colocados: ${n} de ${N}`,
          );
        };
        box.append(A.el("p", "u2-note", `<b>${B(en, es)}</b>`), used);
        K.barCols(
          box,
          {
            labels: M.labels,
            counts: st[key],
            max: 12,
            total: N,
            ro,
            nameOf: (/** @type {number} */ i) => L(`bar ${M.labels[i]}`, `barra ${M.labels[i]}`),
            onFull: full,
            onChange: (/** @type {number[]} */ c) => {
              st[key] = c;
              upd();
              emit();
            },
          },
          api,
        );
        upd();
        root.append(box);
      };
      section(
        "1. Most data on the left, a tail to the right",
        "1. La mayoría de los datos a la izquierda, una cola a la derecha",
        "skew",
      );
      section("2. Symmetric: the two sides match", "2. Simétrico: los dos lados se parecen", "sym");
      if (M.width) {
        const box = A.el("div", "u2-box");
        const out = A.el("div", "u2-plot");
        const lab = A.el("label", "u2-note", "", { for: "skew-bw" });
        const rng = /** @type {any} */ (
          A.el("input", "", "", {
            id: "skew-bw",
            type: "range",
            min: "0",
            max: String(WIDTHS.length - 1),
            step: "1",
          })
        );
        rng.value = String(st.bw ?? 0);
        rng.disabled = ro;
        rng.style.width = "100%";
        rng.style.minHeight = "44px";
        const draw = () => {
          const bw = Number(rng.value);
          const w = WIDTHS[bw];
          const h = histFor(M.data, w);
          const mx = Math.max(...h);
          lab.innerHTML = B(`Bar width: ${w} ${M.unit}`, `Ancho de barra: ${w} ${M.unitEs}`);
          rng.setAttribute(
            "aria-label",
            L(`Bar width: ${w} ${M.unit}`, `Ancho de barra: ${w} ${M.unitEs}`),
          );
          out.innerHTML = `<div class="u2-bars" style="height:120px;align-items:flex-end;gap:1px;padding:6px" role="img" aria-label="${L(
            `Histogram of 20 values with bars ${w} wide: ${h.length} bars`,
            `Histograma de 20 valores con barras de ${w} de ancho: ${h.length} barras`,
          )}">${h
            .map(
              (n) =>
                `<div style="flex:1 1 0;background:var(--brand,#2C4A68);height:${(n / mx) * 100}%;min-height:${n ? 3 : 0}px"></div>`,
            )
            .join("")}</div>`;
        };
        box.append(
          A.el(
            "p",
            "u2-note",
            `<b>${B("3. Choose the bar width", "3. Elige el ancho de barra")}</b>`,
          ),
          A.el(
            "p",
            "u2-note",
            B(
              `Here are 20 values (${M.unit}): ${M.data.join(", ")}.`,
              `Aquí hay 20 valores (${M.unitEs}): ${M.data.join(", ")}.`,
            ),
          ),
          lab,
          rng,
          out,
        );
        root.append(box);
        draw();
        rng.addEventListener("input", () => {
          st.bw = Number(rng.value);
          draw();
          emit();
        });
        if (st.bw === null) rng.setAttribute("aria-describedby", "skew-bw");
      }
      root.append(live);
      if (!ro)
        K.actions(
          root,
          api,
          B,
          () => ({ skew: st.skew.slice(), sym: st.sym.slice(), bw: st.bw }),
          () => {
            api.change?.({ skew: M.start.slice(), sym: M.start.slice(), bw: null });
            api.say?.(L("Back to the start.", "De vuelta al inicio."));
            // rebuild from the clean state
            api.restore = null;
            A.registry.skewsculptor.mount(host, spec, { ...api, restore: null });
          },
        );
    },
  });
  void SKEW_WORD;
})();

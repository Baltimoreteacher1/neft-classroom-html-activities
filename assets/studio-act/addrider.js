/**
 * Practice Studio activity: addrider (lesson 3-4, "Represent Ratios on a Coordinate Plane").
 *
 * Some riders are already aboard before the first carriage, so the points (1, 5), (2, 8), (3, 11) lie on a straight line that does NOT
 * pass through (0, 0). The student predicts, adds a y / x column to the table, and decides whether the points show equal ratios.
 * Target misconception: any straight line is a ratio relationship. Some draws have no starting amount (equal ratios) so "No" is
 * never the safe guess. The prediction is recorded and compared with the table only AFTER the item is solved. A miss sends the
 * student back to the y / x column and never says the verdict. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  /** x name, y name, and the two sentences (with and without a starting amount) as [English, Spanish] */
  const CTX = [
    {
      x: ["carriages", "vagones"],
      y: ["passengers", "pasajeros"],
      start: [
        "A train has {s} riders aboard before the first carriage. Each carriage adds {r} passengers.",
        "Un tren tiene {s} pasajeros a bordo antes del primer vagón. Cada vagón agrega {r} pasajeros.",
      ],
      none: [
        "Each carriage of a train holds {r} passengers and the train starts empty.",
        "Cada vagón de un tren lleva {r} pasajeros y el tren empieza vacío.",
      ],
    },
    {
      x: ["batches", "tandas"],
      y: ["cups of flour", "tazas de harina"],
      start: [
        "A bowl already has {s} cups of flour. Each batch adds {r} more cups.",
        "Un tazón ya tiene {s} tazas de harina. Cada tanda agrega {r} tazas más.",
      ],
      none: [
        "Each batch uses {r} cups of flour and the bowl starts empty.",
        "Cada tanda usa {r} tazas de harina y el tazón empieza vacío.",
      ],
    },
    {
      x: ["games", "juegos"],
      y: ["dollars", "dólares"],
      start: [
        "An arcade charges a ${s} entry fee plus ${r} for each game.",
        "Un arcade cobra ${s} de entrada más ${r} por cada juego.",
      ],
      none: [
        "An arcade charges ${r} for each game and nothing to come in.",
        "Un arcade cobra ${r} por cada juego y nada por entrar.",
      ],
    },
    {
      x: ["pots", "macetas"],
      y: ["seeds", "semillas"],
      start: [
        "A gardener drops {s} loose seeds in the cart, then plants {r} seeds in each pot.",
        "Un jardinero deja {s} semillas sueltas en el carrito y luego siembra {r} semillas en cada maceta.",
      ],
      none: [
        "A gardener plants {r} seeds in each pot and starts with none in the cart.",
        "Un jardinero siembra {r} semillas en cada maceta y no empieza con ninguna en el carrito.",
      ],
    },
  ];
  const PRED = {
    through: [
      "The points are on a straight line through (0, 0).",
      "Los puntos están en una recta que pasa por (0, 0).",
    ],
    miss: [
      "The points are on a straight line that misses (0, 0).",
      "Los puntos están en una recta que no pasa por (0, 0).",
    ],
    curve: ["The points are not on a straight line.", "Los puntos no están en una recta."],
  };
  const SAY = {
    pred: "Make a prediction first.|Primero haz una predicción.",
    col: "Add the y ÷ x column first, then decide.|Primero agrega la columna y ÷ x y luego decide.",
    decide: "Decide if the ratios are equal.|Decide si las razones son iguales.",
    yes: "Look at the y ÷ x column. Are all the numbers in it the same?|Mira la columna y ÷ x. ¿Todos los números son iguales?",
    no: "Look at the y ÷ x column again. Do the numbers match in every row?|Mira otra vez la columna y ÷ x. ¿Los números coinciden en cada fila?",
  };
  const HINTS = [
    "A ratio relationship has the same y ÷ x at every point.|Una relación de razón tiene el mismo y ÷ x en cada punto.",
    "Add the y ÷ x column and compare the numbers in it.|Agrega la columna y ÷ x y compara los números.",
    "A straight line can still have a different y ÷ x in each row. Check the column, not only the picture.|Una recta puede tener un y ÷ x distinto en cada fila. Revisa la columna, no solo el dibujo.",
  ];
  const EXPLAIN =
    "Equal ratios mean y ÷ x is the same at every point, and the line passes through (0, 0). A straight line that starts above 0 has a different y ÷ x in each row, so it is not a ratio relationship.|Las razones equivalentes significan que y ÷ x es igual en cada punto y la recta pasa por (0, 0). Una línea recta que empieza arriba de 0 tiene un y ÷ x distinto en cada fila, así que no es una relación de razón.";

  const fill = (/** @type {string} */ t, /** @type {Record<string, any>} */ v) =>
    t.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
  const quot = (/** @type {number} */ y, /** @type {number} */ x) =>
    Number.isInteger(y / x) ? String(y / x) : `≈ ${G.fmt(y / x, 2)}`;

  A.register("addrider", {
    title: "Add a rider",
    titleEs: "Agrega un pasajero",
    levels: 4,
    make(rng, level) {
      const r = rng.int(2, [5, 6, 8, 9][level - 1]);
      const equal = rng.chance(level === 1 ? 0.4 : 0.3);
      const s = equal ? 0 : rng.int(1, [3, 3, 4, 5][level - 1]);
      const xs = rng.pick(
        [
          [
            [1, 2, 3],
            [2, 3, 4],
          ],
          [
            [1, 2, 4],
            [1, 3, 4],
          ],
          [
            [2, 3, 5],
            [1, 3, 5],
          ],
          [
            [2, 4, 6],
            [3, 4, 6],
          ],
        ][level - 1],
      );
      const ctxIdx = rng.int(0, CTX.length - 1);
      const c = CTX[ctxIdx];
      const ys = xs.map((x) => r * x + s);
      const base = (s ? c.start : c.none).map((t) => fill(t, { r, s }));
      const q = `${base[0]} The table shows the first three rows (${c.x[0]}, ${c.y[0]}). Predict, add the y ÷ x column, then decide if the points show equal ratios.`;
      const qEs = `${base[1]} La tabla muestra las tres primeras filas (${c.x[1]}, ${c.y[1]}). Predice, agrega la columna y ÷ x y decide si los puntos muestran razones equivalentes.`;
      const [x, xEs] = EXPLAIN.split("|");
      const hs = HINTS.map((t) => t.split("|"));
      return {
        q,
        qEs,
        x,
        xEs,
        h: hs.map((t) => t[0]),
        hEs: hs.map((t) => t[1]),
        model: { r, s, ctx: ctxIdx, xs, ys, truth: s === 0 ? "yes" : "no" },
      };
    },
    solution: (spec) => ({
      pred: spec.model.s === 0 ? "through" : "miss",
      col: true,
      decide: spec.model.truth,
    }),
    wrong(spec) {
      const M = spec.model;
      const other = M.truth === "yes" ? "no" : "yes";
      return [
        { pred: null, col: false, decide: null },
        { pred: "through", col: false, decide: M.truth },
        { pred: "curve", col: true, decide: other },
        { pred: null, col: true, decide: null },
      ];
    },
    grade(spec, st) {
      const M = spec.model;
      const say = (/** @type {string} */ key, /** @type {string} */ tag) => {
        const [en, es] = SAY[/** @type {keyof typeof SAY} */ (key)].split("|");
        return { ok: false, tag, say: en, sayEs: es, right: 0, of: 1, marks: null };
      };
      if (!st?.pred) return say("pred", "incomplete");
      if (!st?.col) return say("col", "no-evidence");
      if (st.decide !== "yes" && st.decide !== "no") return say("decide", "incomplete");
      if (st.decide === M.truth) return { ok: true, right: 1, of: 1, marks: [true] };
      return say(
        st.decide === "yes" ? "yes" : "no",
        st.decide === "yes" ? "ratio-graph-origin" : "ratio-graph-misread",
      );
    },
    mount: (host, spec, api) => mountRider(host, spec, api),
  });

  const CSS = `
.ar-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.ar-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:44px;min-width:44px;padding:4px 14px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733);text-align:left}
.ar-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.ar-btn:disabled{opacity:.45;cursor:not-allowed}
.ar-btn[aria-checked="true"]{background:var(--brand-tint,#E5ECF3);box-shadow:inset 0 0 0 3px var(--brand,#2C4A68)}
.ar-btn:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.ar-go{background:var(--brand,#2C4A68);color:var(--surface,#fff);text-align:center}
.ar-h{margin:0;font-weight:800}
.ar-t{border-collapse:collapse;min-width:260px}
.ar-t th,.ar-t td{border:2px solid var(--brand-line,#BBCADA);padding:6px 14px;text-align:center;font-weight:700}
.ar-t th{background:var(--brand-tint,#E5ECF3)}
.ar-group{display:grid;gap:8px}
.ar-act{display:flex;flex-wrap:wrap;gap:10px}
.ar-note{padding:8px 12px;border-radius:12px;background:var(--brand-tint,#E5ECF3);font-weight:700}
.ar-g{max-width:340px;width:100%;height:auto}
@media (forced-colors:active){.ar-btn,.ar-t th,.ar-t td{border-color:ButtonText}}
`;

  function mountRider(
    /** @type {HTMLElement} */ host,
    /** @type {any} */ spec,
    /** @type {any} */ api,
  ) {
    A.css("addrider", CSS);
    const M = spec.model;
    const C = CTX[M.ctx];
    const ro = !!api.solved;
    const es = () => !!api.es?.();
    const L = (/** @type {string} */ en, /** @type {string} */ e) => (es() ? e : en);
    const B = (/** @type {string} */ en, /** @type {string} */ e) => A.t(en, e);
    const h = (/** @type {string} */ tg, cls = "", html = "", at = {}) =>
      /** @type {any} */ (A.el(tg, cls, html, at));
    /** @type {{pred: string|null, col: boolean, decide: string|null}} */
    let st = api.restore
      ? JSON.parse(JSON.stringify(api.restore))
      : { pred: null, col: false, decide: null };
    const save = (/** @type {string=} */ msg) => {
      api.change?.(JSON.parse(JSON.stringify(st)));
      if (msg) api.say?.(msg);
      draw();
    };
    host.textContent = "";
    const root = h("div", "ar-root");
    const body = h("div", "ar-root");
    root.append(body);
    host.append(root);
    const btn = (
      /** @type {string} */ html,
      /** @type {() => void} */ fn,
      cls = "",
      label = "",
      dis = ro,
    ) => {
      const b = h("button", `ar-btn ${cls}`, html, { type: "button" });
      if (label) b.setAttribute("aria-label", label);
      b.disabled = dis;
      b.addEventListener("click", fn);
      return b;
    };
    const radio = (
      /** @type {string} */ label,
      /** @type {[string, string, string][]} */ opts,
      /** @type {string} */ key,
      /** @type {boolean} */ locked = false,
    ) => {
      const g = h("div", "ar-group", "", { role: "radiogroup", "aria-label": label });
      for (const [val, en, e] of opts) {
        const b = btn(
          B(en, e),
          () => {
            /** @type {any} */ (st)[key] = val;
            save();
          },
          "",
          L(en, e),
          ro || locked,
        );
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(/** @type {any} */ (st)[key] === val));
        g.append(b);
      }
      return g;
    };

    function graph() {
      const maxX = Math.max(...M.xs);
      const maxY = Math.max(...M.ys);
      const sx = (/** @type {number} */ x) => 36 + (260 * x) / maxX;
      const sy = (/** @type {number} */ y) => 170 - (140 * y) / maxY;
      let s = `<line x1="36" y1="170" x2="306" y2="170" stroke="currentColor" stroke-width="2"/><line x1="36" y1="170" x2="36" y2="20" stroke="currentColor" stroke-width="2"/>`;
      s += `<circle cx="36" cy="170" r="5" fill="none" stroke="currentColor" stroke-width="2"/><text x="44" y="186" font-size="14" fill="currentColor">(0, 0)</text>`;
      M.xs.forEach((/** @type {number} */ x, /** @type {number} */ i) => {
        s += `<circle cx="${sx(x)}" cy="${sy(M.ys[i])}" r="6" fill="currentColor"/><text x="${sx(x)}" y="${sy(M.ys[i]) - 10}" font-size="14" text-anchor="middle" fill="currentColor">(${x}, ${M.ys[i]})</text>`;
      });
      const pts = M.xs
        .map((/** @type {number} */ x, /** @type {number} */ i) => `(${x}, ${M.ys[i]})`)
        .join(", ");
      return `<svg class="ar-g" viewBox="0 0 330 200" role="img" aria-label="${L(`Graph of the points ${pts}`, `Gráfica de los puntos ${pts}`)}">${s}</svg>`;
    }

    function draw() {
      const focus = document.activeElement?.getAttribute?.("aria-label");
      body.textContent = "";
      body.append(h("div", "", graph()));
      const rows = M.xs
        .map(
          (/** @type {number} */ x, /** @type {number} */ i) =>
            `<tr><td>${x}</td><td>${M.ys[i]}</td>${st.col ? `<td>${M.ys[i]} ÷ ${x} = ${quot(M.ys[i], x)}</td>` : ""}</tr>`,
        )
        .join("");
      const t = h(
        "table",
        "ar-t",
        `<thead><tr><th scope="col">x (${C.x[es() ? 1 : 0]})</th><th scope="col">y (${C.y[es() ? 1 : 0]})</th>${st.col ? '<th scope="col">y ÷ x</th>' : ""}</tr></thead><tbody>${rows}</tbody>`,
      );
      body.append(t);
      body.append(h("p", "ar-h", B("1. Predict", "1. Predice")));
      body.append(
        radio(
          L("Prediction", "Predicción"),
          [
            ["through", ...PRED.through],
            ["miss", ...PRED.miss],
            ["curve", ...PRED.curve],
          ],
          "pred",
        ),
      );
      body.append(h("p", "ar-h", B("2. Check the table", "2. Revisa la tabla")));
      body.append(
        btn(
          B("Add the y ÷ x column", "Agregar la columna y ÷ x"),
          () => ((st.col = true), save(L("Column added.", "Columna agregada."))),
          "",
          L("Add the y divided by x column", "Agregar la columna y dividido entre x"),
          ro || st.col || !st.pred,
        ),
      );
      body.append(h("p", "ar-h", B("3. Decide", "3. Decide")));
      body.append(
        h(
          "p",
          "",
          B("Do the points show equal ratios?", "¿Los puntos muestran razones equivalentes?"),
        ),
      );
      body.append(
        radio(
          L("Equal ratios", "Razones equivalentes"),
          [
            ["yes", "Yes, the ratios are equal.", "Sí, las razones son iguales."],
            ["no", "No, the ratios are not equal.", "No, las razones no son iguales."],
          ],
          "decide",
          !st.col,
        ),
      );
      if (ro && st.pred) {
        const okPred = (st.pred === "through") === (M.s === 0) && st.pred !== "curve";
        const actual = M.s === 0 ? PRED.through : PRED.miss;
        body.append(
          h(
            "p",
            "ar-note",
            B(
              `${okPred ? "Your prediction matched the table." : `You predicted: ${PRED[/** @type {"through"} */ (st.pred)][0]}`} ${okPred ? "" : `The table showed: ${actual[0]}`}`,
              `${okPred ? "Tu predicción coincidió con la tabla." : `Predijiste: ${PRED[/** @type {"through"} */ (st.pred)][1]}`} ${okPred ? "" : `La tabla mostró: ${actual[1]}`}`,
            ),
          ),
        );
      }
      if (focus)
        for (const e of body.querySelectorAll("[aria-label]"))
          if (e.getAttribute("aria-label") === focus)
            return void (/** @type {any} */ (e).focus?.());
    }
    draw();
    if (!ro) {
      const act = h("div", "ar-act");
      act.append(
        btn(B("Check", "Revisar"), () => api.submit?.(JSON.parse(JSON.stringify(st))), "ar-go"),
        btn(B("Hint", "Pista"), () => api.hint?.(), "ar-go"),
        btn(
          B("Start over", "Empezar de nuevo"),
          () => (
            (st = { pred: null, col: false, decide: null }),
            save(L("Started over.", "Empezaste de nuevo."))
          ),
        ),
      );
      root.append(act);
    }
  }
})();

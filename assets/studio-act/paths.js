/**
 * Practice Studio activity: paths (window.StudioAct kind "paths", lesson 6-3).
 * Two paths start at the same number. The ADD path adds it every round; the MULTIPLY path multiplies by it every round.
 * The student steps both paths forward (buttons, no timer), then predicts a later round of the multiply path.
 * Typing the add path's number for that round names the slip: "which path did you copy?" (it is not a race).
 * Round 1 is the start, so base 5 gives add 5, 10, 15 and multiply 5, 25, 125.
 * State: { add: rounds shown, mul: rounds shown, pred: the predicted value as text }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const BASES = { 1: [2, 3, 4, 5], 2: [4, 5, 6], 3: [2, 3, 4], 4: [2, 3, 5] };
  const ROUNDS = { 1: [3], 2: [3], 3: [4], 4: [4, 5] };
  const POWS = ["²", "³", "⁴", "⁵"];
  const comma = (/** @type {number} */ n) => G.commas(n);
  const WHO = [
    "Ana",
    "Ben",
    "Cruz",
    "Dara",
    "Eli",
    "Fay",
    "Gus",
    "Hana",
    "Ivo",
    "Jada",
    "Kai",
    "Lena",
  ];
  const THING = [
    ["savings plans", "planes de ahorro"],
    ["sticker piles", "montones de calcomanías"],
    ["game scores", "puntajes de juego"],
    ["seed counts", "conteos de semillas"],
    ["light patterns", "patrones de luces"],
    ["club sign-ups", "inscripciones al club"],
  ];

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    for (let t = 0; t < 200; t++) {
      const b = rng.pick(/** @type {any} */ (BASES)[level]);
      const R = rng.pick(/** @type {any} */ (ROUNDS)[level]);
      if (b === R || b * R === b ** (R - 1) || R ** b === b ** R) continue;
      const fac = Array(R).fill(b).join(" × ");
      const who = rng.pick(WHO);
      const th = rng.pick(THING);
      return {
        q: `${who} tracks two ${th[0]} that both start at ${b}. The ADD path adds ${b} every round. The MULTIPLY path multiplies by ${b} every round. Step both paths forward to round 2, then predict round ${R} of the MULTIPLY path.`,
        qEs: `${who} sigue dos ${th[1]} que empiezan en ${b}. El camino de SUMAR suma ${b} en cada ronda. El camino de MULTIPLICAR multiplica por ${b} en cada ronda. Avanza los dos caminos hasta la ronda 2 y luego predice la ronda ${R} del camino de MULTIPLICAR.`,
        x: `The multiply path uses ${b} as a factor one more time every round, so round ${R} is ${b}${POWS[R - 2]} = ${fac} = ${comma(b ** R)}. The add path only adds ${b} each round, so its round ${R} is ${comma(b * R)}.`,
        xEs: `El camino de multiplicar usa ${b} como factor una vez más en cada ronda, así que la ronda ${R} es ${b}${POWS[R - 2]} = ${fac} = ${comma(b ** R)}. El camino de sumar solo suma ${b} en cada ronda, así que su ronda ${R} es ${comma(b * R)}.`,
        h: [
          "Round 1 is the starting number. Each new round of the multiply path multiplies by the same number again.",
          "Look at how the multiply path went from round 1 to round 2. Do the same step again.",
          "Take the biggest number you can see on the multiply path and multiply it by the same number once more.",
        ],
        hEs: [
          "La ronda 1 es el número inicial. Cada ronda nueva del camino de multiplicar multiplica otra vez por el mismo número.",
          "Mira cómo el camino de multiplicar pasó de la ronda 1 a la ronda 2. Haz el mismo paso otra vez.",
          "Toma el número más grande que ves en el camino de multiplicar y multiplícalo una vez más por el mismo número.",
        ],
        model: { b, R, level },
      };
    }
    throw new Error(`paths: no task for L${level}`);
  }

  const bad = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({
    ok: false,
    tag,
    say,
    sayEs,
  });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const { b, R } = spec.model;
    st = st || {};
    if (Number(st.add || 1) < 2 || Number(st.mul || 1) < 2)
      return bad(
        "unset",
        "Step both paths forward to at least round 2 first. Then predict.",
        "Primero avanza los dos caminos hasta al menos la ronda 2. Luego predice.",
      );
    if (String(st.pred ?? "").trim() === "")
      return bad(
        "empty",
        `Type your prediction for round ${R} of the multiply path.`,
        `Escribe tu predicción para la ronda ${R} del camino de multiplicar.`,
      );
    const t = G.value(st.pred);
    if (Number.isNaN(t))
      return bad(
        "format",
        "Write the prediction as a whole number.",
        "Escribe la predicción como número entero.",
      );
    if (t === b ** R) return { ok: true };
    if (t === b * R)
      return bad(
        "copied-add",
        `That number is round ${R} of the ADD path. Which path did you copy? The multiply path multiplies by ${b} each round. It does not add ${b}.`,
        `Ese número es la ronda ${R} del camino de SUMAR. ¿Cuál camino copiaste? El camino de multiplicar multiplica por ${b} en cada ronda. No suma ${b}.`,
      );
    if (t === b ** (R - 1))
      return bad(
        "one-round-early",
        `That is the number from the round before. Round ${R} multiplies by ${b} one more time.`,
        `Ese es el número de la ronda anterior. La ronda ${R} multiplica por ${b} una vez más.`,
      );
    if (t === R ** b)
      return bad(
        "swapped",
        `The number that repeats is ${b}. The round number only tells how many times it is used.`,
        `El número que se repite es ${b}. El número de la ronda solo dice cuántas veces se usa.`,
      );
    return bad(
      "count",
      `Multiply by ${b} once for every round after round 1, and keep the products going.`,
      `Multiplica por ${b} una vez en cada ronda después de la ronda 1 y sigue con los productos.`,
    );
  }
  const solution = (/** @type {any} */ spec) => ({
    add: spec.model.R - 1,
    mul: spec.model.R - 1,
    pred: String(spec.model.b ** spec.model.R),
  });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const { b, R } = spec.model;
    const s = solution(spec);
    /** @type {any[]} */
    const c = [
      { ...s, pred: String(b * R) },
      { ...s, pred: String(b ** (R - 1)) },
      { ...s, pred: "" },
      { ...s, add: 1, mul: 1 },
      { ...s, pred: String(R ** b) },
      { ...s, pred: String(b * b * R) },
    ];
    return c.filter((st) => !grade(spec, st).ok);
  }

  const CSS = `
.pa-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.pa-path{display:grid;gap:8px;align-content:start}
.pa-cells{display:flex;flex-wrap:wrap;gap:8px}
.pa-cell{flex-direction:column;min-width:64px;min-height:56px}
.pa-cell small{font-weight:600;font-size:.7rem}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const K = A.kit;
    const { b, R } = spec.model;
    K.mount(host, spec, api, {
      kind: "paths",
      css: CSS,
      def,
      okEn: "You predicted the multiply path and kept it apart from the add path.",
      okEs: "Predijiste el camino de multiplicar y lo distinguiste del camino de sumar.",
      init: (/** @type {any} */ s) => ({
        add: Math.max(1, Number(s.add || 1)),
        mul: Math.max(1, Number(s.mul || 1)),
        pred: String(s.pred ?? ""),
      }),
      render(/** @type {any} */ c) {
        const { st, T, L, el, view } = c;
        const grid = el("div", "pa-grid");
        /** @type {[string, string, string, (r:number)=>number, string, string][]} */
        const paths = [
          [
            "add",
            `The ADD path (+${b} each round)`,
            `El camino de SUMAR (+${b} en cada ronda)`,
            (r) => b * r,
            "Next add round",
            "Siguiente ronda de sumar",
          ],
          [
            "mul",
            `The MULTIPLY path (× ${b} each round)`,
            `El camino de MULTIPLICAR (× ${b} en cada ronda)`,
            (r) => b ** r,
            "Next multiply round",
            "Siguiente ronda de multiplicar",
          ],
        ];
        for (const [key, en, esT, fn, nEn, nEs] of paths) {
          const bx = K.box(en, esT);
          bx.classList.add("pa-path");
          const cells = el("div", "pa-cells");
          for (let r = 1; r <= st[key]; r++)
            cells.append(
              el("span", "k-cell on pa-cell", `<small>${T("round", "ronda")} ${r}</small>${fn(r)}`),
            );
          if (key === "add" && c.last && c.last.tag === "copied-add")
            cells.append(
              el("span", "k-cell hi pa-cell", `<small>${T("round", "ronda")} ${R}</small>${b * R}`),
            );
          bx.append(cells);
          bx.append(
            K.btn(
              nEn,
              nEs,
              () => {
                st[key] = Math.min(R - 1, st[key] + 1);
                c.change(`n${key}`);
              },
              { key: `n${key}` },
            ),
          );
          const nb = bx.querySelector("button");
          if (nb && st[key] >= R - 1) nb.disabled = true;
          grid.append(bx);
        }
        const ask = K.box(
          `Predict round ${R} of the multiply path`,
          `Predice la ronda ${R} del camino de multiplicar`,
        );
        const row = el("div", "k-row");
        row.append(
          el("span", "k-lab", T(`Round ${R} =`, `Ronda ${R} =`)),
          K.field(
            st.pred,
            L(`Prediction for round ${R}`, `Predicción para la ronda ${R}`),
            (/** @type {string} */ v) => {
              st.pred = v;
              c.fb.hidden = true;
              if (api.change) api.change(K.clone(st));
            },
            { key: "pred" },
          ),
        );
        ask.append(row);
        view.append(grid, ask);
      },
    });
  }

  const def = {
    title: "Add path or multiply path",
    titleEs: "Camino de sumar o de multiplicar",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("paths", def);
})();

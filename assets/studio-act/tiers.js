/**
 * Practice Studio activity: tiers (window.StudioAct kind "tiers", lesson 6-4).
 * Part 1: sort six operations into the four tiers of the order of operations. Part 2: evaluate two expressions where a
 * TIE has to be broken (24 ÷ 4 × 2 and 18 − 5 + 2 style). A miss names the tie the student broke the wrong way
 * ("treated × as stronger than ÷") and never prints the value.
 * State: { tier: { paren, power, mul, div, add, sub }: 1-4 or 0, a1, a2: the two typed values }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const OPS = ["paren", "power", "mul", "div", "add", "sub"];
  const RIGHT = { paren: 1, power: 2, mul: 3, div: 3, add: 4, sub: 4 };
  const OPN = {
    paren: ["Parentheses ( )", "Paréntesis ( )"],
    power: ["Exponents (like 3²)", "Exponentes (como 3²)"],
    mul: ["Multiply ×", "Multiplicar ×"],
    div: ["Divide ÷", "Dividir ÷"],
    add: ["Add +", "Sumar +"],
    sub: ["Subtract −", "Restar −"],
  };
  /** the form of each tie expression: how its numbers are drawn and the wrong order that gives the slip */
  const FORMS = {
    divmul: {
      slip: "mulFirst",
      say: [
        "You did the × before the ÷. Multiplying and dividing share a tier, so work them from left to right.",
        "Hiciste la × antes que la ÷. Multiplicar y dividir comparten un nivel, así que se hacen de izquierda a derecha.",
      ],
    },
    subadd: {
      slip: "addFirst",
      say: [
        "You did the + before the −. Adding and subtracting share a tier, so work them from left to right.",
        "Hiciste la + antes que la −. Sumar y restar comparten un nivel, así que se hacen de izquierda a derecha.",
      ],
    },
    divdiv: {
      slip: "rtl",
      say: [
        "You worked the two ÷ signs from right to left. A tie is always broken from left to right.",
        "Hiciste las dos ÷ de derecha a izquierda. Un empate siempre se resuelve de izquierda a derecha.",
      ],
    },
    subsub: {
      slip: "rtl",
      say: [
        "You worked the two − signs from right to left. A tie is always broken from left to right.",
        "Hiciste las dos − de derecha a izquierda. Un empate siempre se resuelve de izquierda a derecha.",
      ],
    },
    divmulplus: {
      slip: "mulFirst",
      say: [
        "You did the × before the ÷. Multiplying and dividing share a tier, so work them from left to right before you add.",
        "Hiciste la × antes que la ÷. Multiplicar y dividir comparten un nivel, así que se hacen de izquierda a derecha antes de sumar.",
      ],
    },
    plussubadd: {
      slip: "addFirst",
      say: [
        "You did the last + before the −. Adding and subtracting share a tier, so work them from left to right.",
        "Hiciste la última + antes que la −. Sumar y restar comparten un nivel, así que se hacen de izquierda a derecha.",
      ],
    },
  };
  const PAIRS = {
    1: [["divmul", "subadd"]],
    2: [
      ["divdiv", "subsub"],
      ["divmul", "subsub"],
      ["divdiv", "subadd"],
    ],
    3: [
      ["divmul", "subadd"],
      ["divdiv", "subadd"],
    ],
    4: [
      ["divmulplus", "plussubadd"],
      ["divmulplus", "subadd"],
      ["divmul", "plussubadd"],
    ],
  };
  /** build one expression: its text, the right value and the value the wrong tie-break gives */
  function build(/** @type {any} */ rng, /** @type {string} */ form, /** @type {number} */ level) {
    const hi = level >= 3 ? 9 : 6;
    for (let t = 0; t < 500; t++) {
      const [b, c, d] = [rng.int(2, hi), rng.int(2, hi), rng.int(2, 9)];
      if (form === "divmul" || form === "divmulplus") {
        const m = rng.int(2, level >= 3 ? 6 : 4);
        const a = b * c * m;
        if (b === c || a > 400) continue;
        const left = (a / b) * c;
        const bad = m;
        const tail = form === "divmulplus" ? ` + ${d}` : "";
        const add = form === "divmulplus" ? d : 0;
        return { s: `${a} ÷ ${b} × ${c}${tail}`, v: left + add, slip: bad + add };
      }
      if (form === "divdiv") {
        const m = rng.int(2, 5);
        const a = b * c * m;
        if (b === c || a > 400) continue;
        return { s: `${a} ÷ ${b} ÷ ${c}`, v: m, slip: (a * c) / b };
      }
      const a = b + c + rng.int(1, level >= 3 ? 20 : 10);
      if (b === c) continue;
      if (form === "subadd") return { s: `${a} − ${b} + ${c}`, v: a - b + c, slip: a - (b + c) };
      if (form === "subsub") return { s: `${a} − ${b} − ${c}`, v: a - b - c, slip: a - (b - c) };
      if (form === "plussubadd") {
        const e = a;
        return { s: `${d} + ${e} − ${b} + ${c}`, v: d + e - b + c, slip: d + e - (b + c) };
      }
    }
    throw new Error(`tiers: no ${form} expression`);
  }

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    const [f1, f2] = rng.pick(/** @type {any} */ (PAIRS)[level]);
    const e1 = build(rng, f1, level);
    const e2 = build(rng, f2, level);
    return {
      q: `Sort the operations into the four tiers, 1 first and 4 last. Then evaluate ${e1.s} and ${e2.s}.`,
      qEs: `Clasifica las operaciones en los cuatro niveles, el 1 primero y el 4 al final. Luego evalúa ${e1.s} y ${e2.s}.`,
      x: `Parentheses go first, then exponents, then × and ÷ together, then + and − together. Operations in the same tier are worked from left to right. So ${e1.s} = ${e1.v} and ${e2.s} = ${e2.v}.`,
      xEs: `Primero van los paréntesis, luego los exponentes, luego × y ÷ juntos y al final + y − juntos. Las operaciones del mismo nivel se hacen de izquierda a derecha. Entonces ${e1.s} = ${e1.v} y ${e2.s} = ${e2.v}.`,
      h: [
        "Two of the tiers hold TWO operations that are partners. Which ones?",
        "When two partner operations meet, which one do you work first: the stronger one, or the one on the left?",
        "Rewrite each expression one operation at a time, always working the leftmost operation of the first tier that is present.",
      ],
      hEs: [
        "Dos de los niveles tienen DOS operaciones que son compañeras. ¿Cuáles?",
        "Cuando se encuentran dos operaciones compañeras, ¿cuál haces primero: la más fuerte o la que está a la izquierda?",
        "Reescribe cada expresión una operación a la vez, haciendo siempre la operación más a la izquierda del primer nivel que aparezca.",
      ],
      model: { e1: { ...e1, form: f1 }, e2: { ...e2, form: f2 }, level },
    };
  }

  const bad = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
    /** @type {any} */ more = {},
  ) => ({ ok: false, tag, say, sayEs, ...more });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    st = st || {};
    const tier = st.tier || {};
    if (OPS.some((o) => !tier[o]))
      return bad(
        "empty",
        "Put every operation in a tier first.",
        "Primero pon cada operación en un nivel.",
      );
    const tm = OPS.map((o) => Number(tier[o]) === /** @type {any} */ (RIGHT)[o]);
    const answers = [m.e1, m.e2].map((e, i) => {
      const raw = String(st[i ? "a2" : "a1"] ?? "").trim();
      return { raw, n: raw === "" ? Number.NaN : G.value(raw), e };
    });
    const am = answers.map((a) => a.n === a.e.v);
    const marks = [...tm, ...am];
    const right = marks.filter(Boolean).length;
    const of = marks.length;
    if (right === of) return { ok: true, right, of, marks };
    const partner = (a, b) => Number(tier[a]) !== Number(tier[b]);
    if (!tm.every(Boolean)) {
      if (partner("mul", "div"))
        return bad(
          "tiers-split",
          "× and ÷ are partners. Check whether they belong in the same tier.",
          "× y ÷ son compañeras. Revisa si van en el mismo nivel.",
          { right, of, marks },
        );
      if (partner("add", "sub"))
        return bad(
          "tiers-split",
          "+ and − are partners. Check whether they belong in the same tier.",
          "+ y − son compañeras. Revisa si van en el mismo nivel.",
          { right, of, marks },
        );
      return bad(
        "tiers",
        "Check the order of the tiers. Which operation is done first, and which is done last?",
        "Revisa el orden de los niveles. ¿Qué operación se hace primero y cuál al final?",
        { right, of, marks },
      );
    }
    const blank = answers.find((a) => a.raw === "");
    if (blank)
      return bad(
        "empty",
        "Type a value for each expression.",
        "Escribe un valor para cada expresión.",
        { right, of, marks },
      );
    if (answers.some((a) => Number.isNaN(a.n)))
      return bad(
        "format",
        "Write each answer as a whole number.",
        "Escribe cada respuesta como número entero.",
        { right, of, marks },
      );
    const slip = answers.find((a) => a.n === a.e.slip && a.n !== a.e.v);
    if (slip) {
      const f = /** @type {any} */ (FORMS)[slip.e.form];
      return bad(`tie-${f.slip}`, f.say[0], f.say[1], { right, of, marks });
    }
    return bad(
      "arith",
      "The order of the operations is right. Check the arithmetic in each step.",
      "El orden de las operaciones es correcto. Revisa la aritmética de cada paso.",
      { right, of, marks },
    );
  }
  const solution = (/** @type {any} */ spec) => ({
    tier: { ...RIGHT },
    a1: String(spec.model.e1.v),
    a2: String(spec.model.e2.v),
  });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const s = solution(spec);
    const m = spec.model;
    /** @type {any[]} */
    const c = [
      { ...s, a1: String(m.e1.slip) },
      { ...s, a2: String(m.e2.slip) },
      { ...s, tier: { ...RIGHT, mul: 2 } },
      { ...s, tier: { ...RIGHT, add: 3 } },
      { ...s, tier: { ...RIGHT, paren: 4, add: 1 } },
      { ...s, a1: "" },
      { ...s, tier: { paren: 0, power: 0, mul: 0, div: 0, add: 0, sub: 0 } },
      { ...s, a1: String(m.e1.v + 1) },
    ];
    return c.filter((st) => !grade(spec, st).ok);
  }

  const CSS = `
.ti-row{display:grid;grid-template-columns:minmax(120px,1fr) auto;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--border,#D5DCE5)}
.ti-tiers{display:flex;gap:6px;flex-wrap:wrap}
.ti-ex{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:1.2rem;font-weight:800}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const K = A.kit;
    const m = spec.model;
    K.mount(host, spec, api, {
      kind: "tiers",
      css: CSS,
      def,
      okEn: "You sorted the tiers and broke the ties from left to right.",
      okEs: "Clasificaste los niveles y resolviste los empates de izquierda a derecha.",
      init: (/** @type {any} */ b) => ({
        tier: { paren: 0, power: 0, mul: 0, div: 0, add: 0, sub: 0, ...(b.tier || {}) },
        a1: String(b.a1 ?? ""),
        a2: String(b.a2 ?? ""),
      }),
      render(/** @type {any} */ c) {
        const { st, T, L, el, view } = c;
        const sort = K.box(
          "Tier each operation (1 = first, 4 = last)",
          "Pon cada operación en un nivel (1 = primero, 4 = último)",
        );
        OPS.forEach((o, i) => {
          const mk = c.mark(i);
          const row = el("div", `ti-row${mk.cls}`);
          row.append(
            el(
              "span",
              "k-lab",
              `${A.t(/** @type {any} */ (OPN)[o][0], /** @type {any} */ (OPN)[o][1])}${mk.html}`,
            ),
          );
          const g = el("div", "ti-tiers", "", {
            role: "group",
            "aria-label": L(/** @type {any} */ (OPN)[o][0], /** @type {any} */ (OPN)[o][1]),
          });
          for (let t = 1; t <= 4; t++)
            g.append(
              K.btn(
                String(t),
                "",
                () => {
                  st.tier[o] = t;
                  c.change(`${o}${t}`);
                },
                {
                  pressed: st.tier[o] === t,
                  key: `${o}${t}`,
                  label: `${L(/** @type {any} */ (OPN)[o][0], /** @type {any} */ (OPN)[o][1])}: ${L("tier", "nivel")} ${t}`,
                },
              ),
            );
          row.append(g);
          sort.append(row);
        });
        const ev = K.box("Evaluate each expression", "Evalúa cada expresión");
        [m.e1, m.e2].forEach((e, i) => {
          const mk = c.mark(OPS.length + i);
          const row = el("div", `ti-ex${mk.cls}`);
          row.append(
            el("span", "", `${e.s} =`),
            K.field(
              st[i ? "a2" : "a1"],
              `${L("Value of", "Valor de")} ${e.s}`,
              (/** @type {string} */ v) => {
                st[i ? "a2" : "a1"] = v;
                c.fb.hidden = true;
                if (api.change) api.change(K.clone(st));
              },
              { key: `a${i + 1}` },
            ),
          );
          if (mk.html) row.insertAdjacentHTML("beforeend", mk.html);
          ev.append(row);
        });
        void T;
        view.append(sort, ev);
      },
    });
  }

  const def = {
    title: "Order of operations: break the tie",
    titleEs: "Orden de las operaciones: resolver el empate",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("tiers", def);
})();

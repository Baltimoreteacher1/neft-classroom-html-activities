/**
 * Practice Studio activity: unknowns (window.StudioAct kind "unknowns"), lesson 8-3 "One story, three unknowns".
 * One story has three quantities: the number of containers (n), the weight of one (w) and the total weight (T = n × w).
 * Each question hides a different one. Question 1 is an evaluation (n and w are known: find the total). Questions 2 and 3
 * are equations to write and solve. A wrong equation is tested by plugging in a small pack whose numbers are known; a wrong
 * solution is tested by putting it back into the equation.
 * State: { v1, e2, v2, e3, v3 }; e2 and e3 are equation keys ("prod", "sum", "div", "swap"), the v's are typed numbers.
 * Contract: docs/specs/practice-studio-v2.md section 5; feedback shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = () => A.kit;

  const r2 = (/** @type {number} */ v) => Math.round(v * 1e4) / 1e4;
  const same = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1e-6;
  // [one, many, Spanish one, Spanish many, unit, Spanish unit, group phrase, Spanish group phrase]
  const CONTEXTS = [
    [
      "bag of trail mix",
      "bags of trail mix",
      "bolsa de mezcla de frutos secos",
      "bolsas de mezcla de frutos secos",
      "pounds",
      "libras",
    ],
    [
      "crate of oranges",
      "crates of oranges",
      "caja de naranjas",
      "cajas de naranjas",
      "kilograms",
      "kilogramos",
    ],
    ["box of tiles", "boxes of tiles", "caja de losetas", "cajas de losetas", "pounds", "libras"],
    ["sack of flour", "sacks of flour", "saco de harina", "sacos de harina", "pounds", "libras"],
    [
      "bucket of sand",
      "buckets of sand",
      "cubeta de arena",
      "cubetas de arena",
      "kilograms",
      "kilogramos",
    ],
    [
      "pack of paper",
      "packs of paper",
      "paquete de papel",
      "paquetes de papel",
      "kilograms",
      "kilogramos",
    ],
  ];
  // the four equations offered, as text of the known number `k`, the letter `v` and the total `T`
  // prod is the story; sum, div and swap are the usual wrong turns
  const FORMS = {
    prod: {
      text: (/** @type {string} */ k, /** @type {string} */ v, /** @type {string} */ T) =>
        `${k}${v} = ${T}`,
    },
    sum: {
      text: (/** @type {string} */ k, /** @type {string} */ v, /** @type {string} */ T) =>
        `${k} + ${v} = ${T}`,
    },
    div: {
      text: (/** @type {string} */ k, /** @type {string} */ v, /** @type {string} */ T) =>
        `${v} ÷ ${k} = ${T}`,
    },
    swap: {
      text: (/** @type {string} */ k, /** @type {string} */ v, /** @type {string} */ T) =>
        `${T}${v} = ${k}`,
    },
  };
  const KEYS = ["prod", "sum", "div", "swap"];

  /** Plug the probe pack (nP bags, wP each, TP in all) into form `key` where `known` is the known side. */
  function plugProbe(
    /** @type {string} */ key,
    /** @type {number} */ known,
    /** @type {number} */ unknown,
    /** @type {number} */ TP,
  ) {
    // known = the probe value of the quantity the equation treats as known; unknown = the probe value of the letter
    if (key === "prod") return { value: known * unknown, rhs: TP, work: `${known} × ${unknown}` };
    if (key === "sum") return { value: known + unknown, rhs: TP, work: `${known} + ${unknown}` };
    if (key === "div") return { value: unknown / known, rhs: TP, work: `${unknown} ÷ ${known}` };
    return { value: TP * unknown, rhs: known, work: `${TP} × ${unknown}` };
  }

  function make(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ _p) {
    const k = K();
    const cx = rng.pick(CONTEXTS);
    const half = lv >= 2;
    const wv = () =>
      half ? rng.int(2, lv === 4 ? 19 : 11) / (lv === 2 ? 2 : rng.pick([2, 4])) : rng.int(2, 9);
    const nv = () => rng.int(2, lv === 4 ? 12 : 9);
    const q1 = { n: nv(), w: r2(wv()) };
    const q2 = { n: nv(), w: r2(wv()) };
    const q3 = { n: nv(), w: r2(wv()) };
    const T = (/** @type {any} */ q) => r2(q.n * q.w);
    // the probe pack: small whole numbers where the sum, quotient and swap forms all fail
    let probe = { n: 2, w: 5, T: 10 };
    for (let i = 0; i < 60; i++) {
      const n = rng.int(3, 5);
      const w = rng.int(2, 7);
      if (n !== w && n + w !== n * w && w / n !== n * w && n * w * w !== n && n * w * n !== w) {
        probe = { n, w, T: n * w };
        break;
      }
    }
    const order = (/** @type {string[]} */ a) => rng.shuffle(a);
    const U = cx[4];
    const UEs = cx[5];
    const spec = {
      ctx: { one: cx[0], many: cx[1], oneEs: cx[2], manyEs: cx[3], unit: U, unitEs: UEs },
      q1: { ...q1, T: T(q1) },
      q2: { ...q2, T: T(q2), opts: order(KEYS) },
      q3: { ...q3, T: T(q3), opts: order(KEYS) },
      probe,
    };
    const f = (/** @type {number} */ v) => k.n(v);
    return {
      ...k.pack({
        q: `One story, three questions. All the ${cx[1]} in this story weigh the same as each other. Each question hides a different amount. ¦ Una historia, tres preguntas. Todas las ${cx[3]} de esta historia pesan lo mismo. Cada pregunta oculta una cantidad distinta.`,
        x: `The same story gives three equations of one shape: number × weight of one = total weight. Question 1 puts in the number and the weight to find the total: ${f(q1.n)} × ${f(q1.w)}. Question 2 is ${f(q2.n)}w = ${f(T(q2))}. Question 3 is ${f(q3.w)}n = ${f(T(q3))}. Each unknown is found by the opposite operation. ¦ La misma historia da tres ecuaciones de una misma forma: cantidad × peso de una = peso total. La pregunta 1 pone la cantidad y el peso para hallar el total: ${f(q1.n)} × ${f(q1.w)}. La pregunta 2 es ${f(q2.n)}w = ${f(T(q2))}. La pregunta 3 es ${f(q3.w)}n = ${f(T(q3))}. Cada incógnita se halla con la operación opuesta.`,
        h: [
          "In every question the story is the same: the number of items times the weight of one item is the total weight. ¦ En cada pregunta la historia es la misma: la cantidad de artículos por el peso de uno es el peso total.",
          "Question 1 gives you both factors, so you only evaluate. In questions 2 and 3, put the known numbers in the equation and leave the letter. ¦ La pregunta 1 te da los dos factores, así que solo evalúas. En las preguntas 2 y 3, pon los números conocidos en la ecuación y deja la letra.",
          "Solve with the opposite operation. Then put your answer back into the equation to check it. ¦ Resuelve con la operación opuesta. Luego pon tu respuesta en la ecuación para comprobarla.",
        ],
      }),
      ...spec,
      want: { v1: spec.q1.T, e2: "prod", v2: q2.w, e3: "prod", v3: q3.n },
      model: { q1: spec.q1, q2: spec.q2, q3: spec.q3 },
    };
  }

  /** the text of the equation `key` for question 2 (letter w, known n) or 3 (letter n, known w) */
  function eqText(/** @type {any} */ spec, /** @type {number} */ q, /** @type {string} */ key) {
    const k = K();
    const s = q === 2 ? spec.q2 : spec.q3;
    const known = q === 2 ? s.n : s.w;
    return FORMS[key].text(k.n(known), q === 2 ? "w" : "n", k.n(s.T));
  }

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const k = K();
    const s = st || {};
    const v1 = k.parse(s.v1);
    const v2 = k.parse(s.v2);
    const v3 = k.parse(s.v3);
    if (v1 === null || v2 === null || v3 === null || !KEYS.includes(s.e2) || !KEYS.includes(s.e3))
      return k.miss(
        "incomplete",
        "Answer all three questions: type the numbers and choose both equations. ¦ Responde las tres preguntas: escribe los números y elige las dos ecuaciones.",
      );
    const w = spec.want;
    const marks = [same(v1, w.v1), s.e2 === w.e2, same(v2, w.v2), s.e3 === w.e3, same(v3, w.v3)];
    const parts = k.parts(marks);
    if (marks.every(Boolean)) return { ok: true, ...parts };
    const P = spec.probe;
    const U = spec.ctx;
    const pack = `${P.n} ${U.many}, ${P.w} ${U.unit} each, ${P.T} ${U.unit} in all`;
    const packEs = `${P.n} ${U.manyEs}, ${P.w} ${U.unitEs} cada una, ${P.T} ${U.unitEs} en total`;
    // a wrong equation: test it on the probe pack
    const badEq = (/** @type {number} */ q, /** @type {string} */ key) => {
      // q2: the letter is w and the known number is n; q3: the letter is n and the known number is w
      const t = plugProbe(key, q === 2 ? P.n : P.w, q === 2 ? P.w : P.n, P.T);
      return k.miss(
        `equation-${key}`,
        `Question ${q}: test your equation on a pack we know: ${pack}. Your equation gives ${t.work} = ${k.n(r2(t.value))}, but it should say ${k.n(t.rhs)}. A true equation works for this pack too. ¦ Prueba la ecuación ${q - 1} con un paquete que conocemos: ${packEs}. Tu ecuación da ${t.work} = ${k.n(r2(t.value))}, pero debería decir ${k.n(t.rhs)}. Una ecuación verdadera también funciona para este paquete.`,
        parts,
      );
    };
    if (!marks[0]) {
      const q = spec.q1;
      const tag = same(v1, q.n + q.w)
        ? "added-not-multiplied"
        : same(v1, q.w / q.n) || same(v1, q.n / q.w)
          ? "divided-not-multiplied"
          : "evaluate";
      return k.miss(
        tag,
        tag === "added-not-multiplied"
          ? "Question 1: the story multiplies. The number of items times the weight of one gives the total, not their sum. ¦ Pregunta 1: la historia multiplica. La cantidad de artículos por el peso de uno da el total, no su suma."
          : tag === "divided-not-multiplied"
            ? "Question 1: you know the number and the weight of one. To find the total, do you multiply or divide? ¦ Pregunta 1: conoces la cantidad y el peso de uno. Para hallar el total, ¿se multiplica o se divide?"
            : "Question 1: put the number and the weight of one into number × weight and work it out again. ¦ Pregunta 1: pon la cantidad y el peso de uno en cantidad × peso y calcúlalo otra vez.",
        parts,
      );
    }
    if (!marks[1]) return badEq(2, s.e2);
    if (!marks[2]) {
      const q = spec.q2;
      const back = k.n(r2(q.n * v2));
      return k.miss(
        same(v2, q.n * q.T) ? "multiplied-to-undo" : "check-back",
        `Question 2: put your answer back into the equation. ${k.n(q.n)} × ${k.n(v2)} = ${back}, and the story says ${k.n(q.T)}. ¦ Pregunta 2: pon tu respuesta de nuevo en la ecuación. ${k.n(q.n)} × ${k.n(v2)} = ${back}, y la historia dice ${k.n(q.T)}.`,
        parts,
      );
    }
    if (!marks[3]) return badEq(3, s.e3);
    const q = spec.q3;
    const back = k.n(r2(q.w * v3));
    return k.miss(
      same(v3, q.w * q.T) ? "multiplied-to-undo" : "check-back",
      `Question 3: put your answer back into the equation. ${k.n(q.w)} × ${k.n(v3)} = ${back}, and the story says ${k.n(q.T)}. ¦ Pregunta 3: pon tu respuesta de nuevo en la ecuación. ${k.n(q.w)} × ${k.n(v3)} = ${back}, y la historia dice ${k.n(q.T)}.`,
      parts,
    );
  }

  function solution(/** @type {any} */ spec) {
    const w = spec.want;
    return { v1: String(w.v1), e2: w.e2, v2: String(w.v2), e3: w.e3, v3: String(w.v3) };
  }
  function wrong(/** @type {any} */ spec, _rng) {
    const sol = solution(spec);
    const q = spec.q1;
    return [
      { ...sol, e2: "sum" },
      { ...sol, e3: "swap" },
      { ...sol, v1: String(r2(q.n + q.w)) },
      { ...sol, v2: String(r2(spec.q2.n * spec.q2.T)) },
      { ...sol, v3: String(r2(spec.q3.w * spec.q3.T)) },
      { v1: "", e2: null, v2: "", e3: null, v3: "" },
    ].filter((cand) => grade(spec, cand).ok === false);
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.ak-unknowns .un-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}
.ak-unknowns .un-eq{font-size:1.25rem}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("unknowns", CSS);
    const k = K();
    const c = k.start(host, spec, api, "unknowns");
    const { T } = c;
    const sv = c.saved || (c.solved ? solution(spec) : {});
    const st = {
      v1: sv.v1 ?? "",
      e2: sv.e2 || null,
      v2: sv.v2 ?? "",
      e3: sv.e3 || null,
      v3: sv.v3 ?? "",
    };
    const U = spec.ctx;
    const mkInput = (
      /** @type {"v1"|"v2"|"v3"} */ key,
      /** @type {string} */ en,
      /** @type {string} */ esT,
    ) => {
      const inp = A.el("input", "ak-in", "", {
        type: "text",
        inputmode: "decimal",
        autocomplete: "off",
      });
      c.label(inp, en, esT);
      inp.value = String(st[key] ?? "");
      inp.addEventListener("input", () => {
        st[key] = inp.value;
        changed();
      });
      return inp;
    };
    const mkOpts = (/** @type {2|3} */ q) => {
      const g = A.el("div", "un-opts", "", { role: "group" });
      c.label(g, `Equation for question ${q}`, `Ecuación de la pregunta ${q}`);
      const key = q === 2 ? "e2" : "e3";
      const btns = (q === 2 ? spec.q2 : spec.q3).opts.map((/** @type {string} */ o) => {
        const b = A.el("button", "ak-chip un-eq", eqText(spec, q, o), { type: "button" });
        c.label(b, eqText(spec, q, o), eqText(spec, q, o));
        b.addEventListener("click", () => {
          if (c.solved) return;
          st[key] = o;
          changed();
        });
        g.append(b);
        return { o, b };
      });
      return { g, btns, key };
    };
    const i1 = mkInput("v1", "Total weight", "Peso total");
    const i2 = mkInput("v2", "Value of w", "Valor de w");
    const i3 = mkInput("v3", "Value of n", "Valor de n");
    const o2 = mkOpts(2);
    const o3 = mkOpts(3);
    const card = (
      /** @type {string} */ capEn,
      /** @type {string} */ capEs,
      /** @type {any[]} */ kids,
    ) => {
      const d = A.el("div", "ak-card");
      d.append(A.el("p", "ak-cap", T(capEn, capEs)), ...kids);
      return d;
    };
    const r1 = A.el("div", "ak-row");
    r1.append(
      A.el("span", "ak-text", `<b>${T(`Total (${U.unit})`, `Total (${U.unitEs})`)}</b>`),
      i1,
    );
    const r2el = A.el("div", "ak-row");
    r2el.append(
      A.el("span", "ak-text", `<b>w =</b>`),
      i2,
      A.el("span", "ak-text", T(U.unit, U.unitEs)),
    );
    const r3el = A.el("div", "ak-row");
    r3el.append(A.el("span", "ak-text", `<b>n =</b>`), i3);
    const c1 = card("Question 1: evaluate", "Pregunta 1: evalúa", [
      A.el(
        "p",
        "ak-text",
        T(
          `${k.n(spec.q1.n)} ${U.many}, ${k.n(spec.q1.w)} ${U.unit} each. Find the total.`,
          `${k.n(spec.q1.n)} ${U.manyEs}, ${k.n(spec.q1.w)} ${U.unitEs} cada una. Halla el total.`,
        ),
      ),
      r1,
    ]);
    const c2 = card("Question 2: write and solve", "Pregunta 2: escribe y resuelve", [
      A.el(
        "p",
        "ak-text",
        T(
          `${k.n(spec.q2.n)} ${U.many} weigh ${k.n(spec.q2.T)} ${U.unit}. Find w, the weight of one.`,
          `${k.n(spec.q2.n)} ${U.manyEs} pesan ${k.n(spec.q2.T)} ${U.unitEs}. Halla w, el peso de una.`,
        ),
      ),
      o2.g,
      r2el,
    ]);
    const c3 = card("Question 3: write and solve", "Pregunta 3: escribe y resuelve", [
      A.el(
        "p",
        "ak-text",
        T(
          `Each weighs ${k.n(spec.q3.w)} ${U.unit}. All of them weigh ${k.n(spec.q3.T)} ${U.unit}. Find n, the number of ${U.many}.`,
          `Cada una pesa ${k.n(spec.q3.w)} ${U.unitEs}. Todas pesan ${k.n(spec.q3.T)} ${U.unitEs}. Halla n, la cantidad de ${U.manyEs}.`,
        ),
      ),
      o3.g,
      r3el,
    ]);
    c.body.append(c1, c2, c3);
    function changed() {
      c.verdict = null;
      c.note.textContent = "";
      c.emit(st);
      draw();
    }
    function draw() {
      const marks = c.marks();
      for (const o of [o2, o3])
        for (const { o: key, b } of o.btns) {
          b.setAttribute("aria-pressed", String(st[o.key] === key));
          b.disabled = c.solved;
        }
      for (const i of [i1, i2, i3]) i.disabled = c.solved;
      c1.classList.toggle("ak-mark-bad", !!marks && marks[0] === false);
      c2.classList.toggle("ak-mark-bad", !!marks && (marks[1] === false || marks[2] === false));
      c3.classList.toggle("ak-mark-bad", !!marks && (marks[3] === false || marks[4] === false));
      c.checkBtn.disabled =
        k.parse(st.v1) === null ||
        k.parse(st.v2) === null ||
        k.parse(st.v3) === null ||
        !st.e2 ||
        !st.e3;
      c.clearBtn.disabled = !st.v1 && !st.v2 && !st.v3 && !st.e2 && !st.e3;
    }
    c.redraws.push(draw);
    c.wire(
      () => st,
      () => {
        st.v1 = st.v2 = st.v3 = "";
        st.e2 = st.e3 = null;
        i1.value = i2.value = i3.value = "";
        c.emit(st);
      },
    );
    draw();
  }

  A.register("unknowns", {
    title: "One story, three unknowns",
    titleEs: "Una historia, tres incógnitas",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();

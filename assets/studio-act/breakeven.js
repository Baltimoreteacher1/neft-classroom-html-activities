/**
 * Practice Studio activity: breakeven (window.StudioAct kind "breakeven"), lesson 9-4 "Break-even to inequality".
 * Two plans are given as equations and as a table of costs. The student finds the row where the order flips (the costs are
 * equal), then writes "Plan A is cheaper when h > 6" by choosing the symbol, and tests h = 6: a tie, so it is not included.
 * No algebra with the variable on both sides is needed; the table is scanned and the sentence is tested with numbers.
 * State: { tie: number | null, sym: ">" | ">=" | "<" | "<=" | null, tested: number[] }.
 * Contract: docs/specs/practice-studio-v2.md section 5; feedback shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = () => A.kit;

  const SYM = { ">": ">", ">=": "≥", "<": "<", "<=": "≤" };
  const holds = (/** @type {string} */ op, /** @type {number} */ a, /** @type {number} */ b) =>
    op === ">" ? a > b : op === ">=" ? a >= b : op === "<" ? a < b : a <= b;
  const r2 = (/** @type {number} */ v) => Math.round(v * 100) / 100;
  const money = (/** @type {number} */ v) =>
    `$${Number.isInteger(r2(v)) ? r2(v) : r2(v).toFixed(2)}`;

  // [thing, Spanish thing]: what the plans pay for
  const THINGS = [
    ["a robot rental", "el alquiler de un robot"],
    ["a 3D printer", "una impresora 3D"],
    ["a drone", "un dron"],
    ["a paint sprayer", "un rociador de pintura"],
    ["a laser cutter", "una cortadora láser"],
    ["a sewing machine", "una máquina de coser"],
  ];

  const costA = (/** @type {any} */ s, /** @type {number} */ h) => r2(s.a.rate * h + s.a.fee);
  const costB = (/** @type {any} */ s, /** @type {number} */ h) => r2(s.b.rate * h + s.b.fee);
  const eqText = (/** @type {any} */ pl) => {
    const k = K();
    return pl.fee ? `c = ${k.n(pl.rate)}h + ${k.n(pl.fee)}` : `c = ${k.n(pl.rate)}h`;
  };

  function make(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ _p) {
    const k = K();
    const tie = rng.int(lv === 1 ? 3 : 4, lv === 1 ? 6 : 9);
    const dec = lv >= 3 && rng.chance(0.5);
    const d = rng.int(1, lv === 1 ? 2 : 4);
    const aRate = dec ? rng.pick([1.5, 2.5, 3.5]) : rng.int(2, 6);
    const bRate = r2(aRate + d);
    const g = lv === 4 ? rng.int(2, 8) : 0;
    const f = r2(d * tie + g);
    const spec0 = { a: { rate: aRate, fee: f }, b: { rate: bRate, fee: g } };
    // A has the fee and the lower rate: B is cheaper for fewer hours and A for more hours than the tie
    const who = rng.chance(0.65) ? "A" : "B";
    const want = { tie, sym: who === "A" ? ">" : "<" };
    const hmax = tie + 4;
    const rows = [];
    for (let h = 1; h <= hmax; h++) rows.push({ h, a: costA(spec0, h), b: costB(spec0, h) });
    const th = rng.pick(THINGS);
    const other = who === "A" ? "B" : "A";
    return {
      ...k.pack({
        q: `A club can pay for ${th[0]} in two ways. Plan A: ${eqText(spec0.a)}. Plan B: ${eqText(spec0.b)}. Here h is the hours and c is the cost in dollars. Find where the plans cost the same. Then finish the sentence about when Plan ${who} is cheaper than Plan ${other}. ¦ Un club puede pagar ${th[1]} de dos maneras. Plan A: ${eqText(spec0.a)}. Plan B: ${eqText(spec0.b)}. Aquí h son las horas y c es el costo en dólares. Encuentra dónde los planes cuestan lo mismo. Luego completa la oración sobre cuándo el Plan ${who} es más barato que el Plan ${other}.`,
        x: `The plans cost the same at h = ${tie}. Plan ${who} is cheaper when h ${SYM[want.sym]} ${tie}. At h = ${tie} the costs are equal, so Plan ${who} is not cheaper there and ${tie} is not included. ¦ Los planes cuestan lo mismo en h = ${tie}. El Plan ${who} es más barato cuando h ${SYM[want.sym]} ${tie}. En h = ${tie} los costos son iguales, así que el Plan ${who} no es más barato ahí y el ${tie} no está incluido.`,
        h: [
          "Scan the table. Look for the row where the two costs are the same. ¦ Recorre la tabla. Busca la fila donde los dos costos son iguales.",
          `Compare the costs in a row before that one and in a row after it. In which rows is Plan ${who} the cheaper one? ¦ Compara los costos en una fila antes y en una fila después. ¿En qué filas es más barato el Plan ${who}?`,
          "Test the equal-cost row in your sentence. Is Plan " +
            who +
            " cheaper when the costs are equal? ¦ Prueba la fila de costos iguales en tu oración. ¿El Plan " +
            who +
            " es más barato cuando los costos son iguales?",
        ],
      }),
      a: spec0.a,
      b: spec0.b,
      who,
      rows,
      want,
      model: { a: spec0.a, b: spec0.b, who },
    };
  }

  const cheaper = (/** @type {any} */ spec, /** @type {number} */ h) =>
    spec.who === "A" ? costA(spec, h) < costB(spec, h) : costB(spec, h) < costA(spec, h);

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const k = K();
    const s = st || {};
    if (!Number.isInteger(s.tie) || !SYM[s.sym])
      return k.miss(
        "incomplete",
        "Tap the row where the plans cost the same and choose a symbol, then check. ¦ Toca la fila donde los planes cuestan lo mismo y elige un símbolo; luego comprueba.",
      );
    const w = spec.want;
    const tieOk = s.tie === w.tie;
    const symOk = s.sym === w.sym;
    const parts = k.parts([tieOk, symOk]);
    if (tieOk && symOk) return { ok: true, ...parts };
    if (!tieOk) {
      const row = spec.rows.find((/** @type {any} */ r) => r.h === s.tie);
      const first = spec.who === "A" ? w.tie + 1 : null;
      return k.miss(
        row && s.tie === first ? "first-cheaper-row" : "tie-row",
        row && s.tie === first
          ? `In that row Plan ${spec.who} is already cheaper. Look for the row where the two costs are equal, not different. ¦ En esa fila el Plan ${spec.who} ya es más barato. Busca la fila donde los dos costos son iguales, no distintos.`
          : `Look at both costs in the row you chose. Are they the same? Find the row where Plan A and Plan B cost the same. ¦ Mira los dos costos en la fila que elegiste. ¿Son iguales? Busca la fila donde el Plan A y el Plan B cuestan lo mismo.`,
        parts,
      );
    }
    if (s.sym.includes("="))
      return k.miss(
        "tie-included",
        `At h = ${w.tie} the two plans cost the same. Is Plan ${spec.who} cheaper there? ¦ En h = ${w.tie} los dos planes cuestan lo mismo. ¿El Plan ${spec.who} es más barato ahí?`,
        parts,
      );
    return k.miss(
      "direction",
      `Test a number of hours on each side of the equal-cost row. Where is Plan ${spec.who} the cheaper one? ¦ Prueba un número de horas a cada lado de la fila de costos iguales. ¿Dónde es más barato el Plan ${spec.who}?`,
      parts,
    );
  }

  function wrong(/** @type {any} */ spec, _rng) {
    const w = spec.want;
    const opp = w.sym === ">" ? "<" : ">";
    return [
      { tie: w.tie, sym: `${w.sym}=`, tested: [w.tie] },
      { tie: w.tie, sym: opp, tested: [w.tie] },
      { tie: w.tie + 1, sym: w.sym, tested: [w.tie + 1] },
      { tie: null, sym: null, tested: [] },
    ];
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.ak-breakeven .be-head,.ak-breakeven .be-row{display:grid;grid-template-columns:.6fr 1fr 1fr;gap:8px;width:100%}
.ak-breakeven .be-head{font-weight:800;color:var(--brand,#2C4A68);text-align:center}
.ak-breakeven .be-row{flex-direction:row;font-size:1.1rem}
.ak-breakeven .be-rows{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.ak-breakeven .be-sym{font-size:1.6rem;width:64px}
.ak-breakeven .be-test{font-weight:700}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("breakeven", CSS);
    const k = K();
    const c = k.start(host, spec, api, "breakeven");
    const { T, L } = c;
    const sv = c.saved || (c.solved ? { ...spec.want, tested: [spec.want.tie] } : {});
    const st = {
      tie: Number.isInteger(sv.tie) ? sv.tie : null,
      sym: sv.sym || null,
      tested: (sv.tested || []).slice(),
    };
    const who = spec.who;
    const head = A.el(
      "div",
      "be-head",
      `<span>${T("Hours h", "Horas h")}</span><span>${T("Plan A cost", "Costo del Plan A")}</span><span>${T("Plan B cost", "Costo del Plan B")}</span>`,
    );
    const list = A.el("ul", "be-rows");
    const rowBtns = spec.rows.map((/** @type {any} */ r) => {
      const li = A.el("li");
      const b = A.el(
        "button",
        "ak-chip be-row",
        `<span>${r.h}</span><span>${money(r.a)}</span><span>${money(r.b)}</span>`,
        { type: "button" },
      );
      c.label(
        b,
        `${r.h} hours: Plan A costs ${money(r.a)}, Plan B costs ${money(r.b)}. Choose this row as the equal-cost row.`,
        `${r.h} horas: el Plan A cuesta ${money(r.a)}, el Plan B cuesta ${money(r.b)}. Elegir esta fila como la de costos iguales.`,
      );
      b.addEventListener("click", () => {
        if (c.solved) return;
        st.tie = st.tie === r.h ? null : r.h;
        changed();
      });
      li.append(b);
      list.append(li);
      return { h: r.h, b };
    });
    const sentence = A.el("div", "ak-box", "");
    const symRow = A.el("div", "ak-row", "", { role: "group" });
    c.label(symRow, "Symbol", "Símbolo");
    const names = {
      ">": ["greater than", "mayor que"],
      ">=": ["greater than or equal to", "mayor o igual que"],
      "<": ["less than", "menor que"],
      "<=": ["less than or equal to", "menor o igual que"],
    };
    const symBtns = Object.keys(SYM).map((key) => {
      const b = A.el("button", "ak-btn be-sym", SYM[key], { type: "button" });
      c.label(b, names[key][0], names[key][1]);
      b.addEventListener("click", () => {
        if (c.solved) return;
        st.sym = key;
        changed();
      });
      symRow.append(b);
      return { key, b };
    });
    const testIn = A.el("input", "ak-in", "", {
      type: "text",
      inputmode: "numeric",
      autocomplete: "off",
    });
    c.label(testIn, "Hours to test", "Horas para probar");
    const testBtn = A.el("button", "ak-btn", T("Test these hours", "Probar estas horas"), {
      type: "button",
    });
    const out = A.el("p", "ak-box be-test", "", { "aria-live": "polite" });
    c.body.append(
      A.el(
        "p",
        "ak-cap",
        T(
          "1. Tap the row where the plans cost the same",
          "1. Toca la fila donde los planes cuestan lo mismo",
        ),
      ),
      head,
      list,
      A.el("p", "ak-cap", T("2. Finish the sentence", "2. Completa la oración")),
      sentence,
      symRow,
      A.el(
        "p",
        "ak-cap",
        T(
          "3. Test your sentence with the equal-cost hours and one other number",
          "3. Prueba tu oración con las horas de costos iguales y otro número",
        ),
      ),
      A.el("div", "ak-row"),
      out,
    );
    c.body.children[c.body.children.length - 2].append(testIn, testBtn);

    function changed() {
      c.verdict = null;
      c.note.textContent = "";
      c.emit(st);
      draw();
    }
    function runTest() {
      const h = k.parse(testIn.value);
      if (h === null || !Number.isInteger(h) || h < 1 || h > 60) {
        out.textContent = L(
          "Type a whole number of hours, like 3.",
          "Escribe un número entero de horas, como 3.",
        );
        return;
      }
      if (!st.tested.includes(h)) st.tested.push(h);
      c.emit(st);
      const a = costA(spec, h);
      const b = costB(spec, h);
      const real = cheaper(spec, h);
      const says = st.sym && st.tie !== null ? holds(st.sym, h, st.tie) : null;
      const t1 = T(
        `At ${h} hours: Plan A costs ${money(a)} and Plan B costs ${money(b)}. Plan ${who} is ${real ? "cheaper" : "not cheaper"}.`,
        `En ${h} horas: el Plan A cuesta ${money(a)} y el Plan B cuesta ${money(b)}. El Plan ${who} ${real ? "es más barato" : "no es más barato"}.`,
      );
      const t2 =
        says === null
          ? ""
          : ` ${T(
              `Your sentence says h ${SYM[st.sym]} ${st.tie}: ${h} ${SYM[st.sym]} ${st.tie} is ${says ? "true" : "false"}.`,
              `Tu oración dice h ${SYM[st.sym]} ${st.tie}: ${h} ${SYM[st.sym]} ${st.tie} es ${says ? "verdadero" : "falso"}.`,
            )}`;
      out.innerHTML = `${t1}${t2}`;
      draw();
    }
    testBtn.addEventListener("click", runTest);
    testIn.addEventListener("keydown", (/** @type {any} */ e) => {
      if (e.key === "Enter") runTest();
    });
    function draw() {
      const marks = c.marks();
      rowBtns.forEach((r) => {
        r.b.setAttribute("aria-pressed", String(st.tie === r.h));
        r.b.disabled = c.solved;
        r.b.classList.toggle("ak-mark-bad", !!marks && marks[0] === false && st.tie === r.h);
      });
      for (const { key, b } of symBtns) {
        b.setAttribute("aria-pressed", String(st.sym === key));
        b.disabled = c.solved;
      }
      symRow.classList.toggle("ak-mark-bad", !!marks && marks[1] === false);
      sentence.innerHTML = T(
        `Plan ${who} is cheaper when h ${st.sym ? SYM[st.sym] : "?"} ${st.tie === null ? "?" : st.tie}`,
        `El Plan ${who} es más barato cuando h ${st.sym ? SYM[st.sym] : "?"} ${st.tie === null ? "?" : st.tie}`,
      );
      testIn.disabled = testBtn.disabled = c.solved;
      c.checkBtn.disabled = st.tie === null || !st.sym || !st.tested.includes(st.tie);
      c.clearBtn.disabled = st.tie === null && !st.sym;
    }
    c.redraws.push(draw);
    c.wire(
      () => st,
      () => {
        st.tie = null;
        st.sym = null;
        st.tested = [];
        out.textContent = "";
        c.emit(st);
      },
    );
    draw();
  }

  A.register("breakeven", {
    title: "Break-even to inequality",
    titleEs: "Del empate a la desigualdad",
    levels: 4,
    make,
    solution: (/** @type {any} */ spec) => ({
      tie: spec.want.tie,
      sym: spec.want.sym,
      tested: [spec.want.tie],
    }),
    wrong,
    grade,
    mount,
  });
})();

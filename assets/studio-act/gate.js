/**
 * Practice Studio activity: gate (window.StudioAct kind "gate"), lesson 8-5 "Hidden gate".
 * A gate lets some numbers through. The student cannot see its rule, so they test numbers (a decimal and both ends of the
 * line are required), then commit a graph (boundary, open or closed circle, direction), then say what the story allows
 * (can the quantity be a decimal? can it be below 0?) because the solutions of an inequality and the values a story allows
 * are not always the same set.
 * State: { probes: number[], n, closed, dir, dec, neg }.
 * Contract: docs/specs/practice-studio-v2.md section 5; feedback shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = () => A.kit;

  const SYM = { ">": ">", ">=": "≥", "<": "<", "<=": "≤" };
  const holds = (/** @type {string} */ op, /** @type {number} */ v, /** @type {number} */ b) =>
    op === ">"
      ? v > b + 1e-9
      : op === ">="
        ? v >= b - 1e-9
        : op === "<"
          ? v < b - 1e-9
          : v <= b + 1e-9;
  const r2 = (/** @type {number} */ v) => Math.round(v * 100) / 100;
  const isInt = (/** @type {number} */ v) => Math.abs(v - Math.round(v)) < 1e-9;
  /** a ray graphed by the student: does it hold v? */
  const onRay = (/** @type {any} */ g, /** @type {number} */ v) =>
    holds(g.dir === "right" ? (g.closed ? ">=" : ">") : g.closed ? "<=" : "<", v, g.n);

  // kind: what the quantity can be in the story. count = whole numbers 0 or more; measure = any number 0 or more; temp = any number.
  const CONTEXTS = [
    {
      kind: "count",
      v: "f",
      en: "the number of clownfish in a tank",
      es: "la cantidad de peces payaso en un acuario",
    },
    {
      kind: "count",
      v: "s",
      en: "the number of students on a bus",
      es: "la cantidad de estudiantes en un autobús",
    },
    {
      kind: "count",
      v: "p",
      en: "the number of players on a team",
      es: "la cantidad de jugadores de un equipo",
    },
    {
      kind: "count",
      v: "c",
      en: "the number of cars in a parking row",
      es: "la cantidad de autos en una fila de estacionamiento",
    },
    {
      kind: "count",
      v: "b",
      en: "the number of books in a bag",
      es: "la cantidad de libros en una mochila",
    },
    {
      kind: "measure",
      v: "d",
      en: "the depth of a dive in meters",
      es: "la profundidad de una inmersión en metros",
    },
    {
      kind: "measure",
      v: "w",
      en: "the weight of a backpack in pounds",
      es: "el peso de una mochila en libras",
    },
    {
      kind: "measure",
      v: "h",
      en: "the height of a plant in inches",
      es: "la altura de una planta en pulgadas",
    },
    {
      kind: "temp",
      v: "t",
      en: "the water temperature in degrees Celsius",
      es: "la temperatura del agua en grados Celsius",
    },
    {
      kind: "temp",
      v: "t",
      en: "the outdoor temperature in degrees Celsius",
      es: "la temperatura del aire libre en grados Celsius",
    },
  ];
  const STORY = {
    count: { dec: false, neg: false },
    measure: { dec: true, neg: false },
    temp: { dec: true, neg: true },
  };

  function make(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ _p) {
    const k = K();
    const line =
      lv === 1 ? { min: 0, max: 12 } : lv === 4 ? { min: -10, max: 10 } : { min: -8, max: 12 };
    const pool = lv === 1 ? CONTEXTS.filter((c) => c.kind === "count") : CONTEXTS;
    const ctx = rng.pick(pool);
    let op;
    let b;
    if (ctx.kind === "temp") {
      op = rng.pick(Object.keys(SYM));
      const right = op.startsWith(">");
      b = right ? -rng.int(1, 7) : rng.int(-4, 8);
    } else {
      op = rng.pick(["<=", "<"]);
      b = rng.int(2, lv === 1 ? 10 : 9);
    }
    if (lv >= 3 && ctx.kind !== "count") b += rng.pick([0.5, 0, -0.5]);
    if (ctx.kind === "temp" && op.startsWith(">") && b >= 0) b = -1.5;
    b = r2(Math.max(line.min + 1, Math.min(line.max - 1, b)));
    const closed = op.includes("=");
    const dir = op.startsWith(">") ? "right" : "left";
    const sym = SYM[op];
    const story = STORY[ctx.kind];
    const circ = closed ? "closed circle" : "open circle";
    const circEs = closed ? "círculo cerrado" : "círculo abierto";
    const can = (/** @type {boolean} */ y) => (y ? "can" : "cannot");
    return {
      ...k.pack({
        q: `A gate lets some numbers through and stops others. You cannot see its rule. The rule is about ${ctx.en}. Test numbers to find which ones pass. Then graph every number the gate lets through, and say what the story allows. ¦ Una puerta deja pasar algunos números y detiene otros. No puedes ver su regla. La regla es sobre ${ctx.es}. Prueba números para ver cuáles pasan. Luego grafica todos los números que la puerta deja pasar y di qué permite la historia.`,
        x: `The gate lets through every number with ${ctx.v} ${sym} ${k.n(b)}: a ${circ} at ${k.n(b)} and a ray to the ${dir}. The story is different. ${ctx.en.replace(/^the /, "The ")} ${can(story.dec)} be a decimal and ${can(story.neg)} be below 0, so the story allows only part of the ray. ¦ La puerta deja pasar todos los números con ${ctx.v} ${sym} ${k.n(b)}: un ${circEs} en ${k.n(b)} y un rayo hacia la ${dir === "right" ? "derecha" : "izquierda"}. La historia es distinta. Esta cantidad ${story.dec ? "puede" : "no puede"} ser un decimal y ${story.neg ? "puede" : "no puede"} ser menor que 0, así que la historia permite solo una parte del rayo.`,
        h: [
          "Test a number far to the left and a number far to the right. Which one gets through? ¦ Prueba un número muy a la izquierda y uno muy a la derecha. ¿Cuál pasa?",
          "Test numbers closer and closer together until the answer changes. Then test the boundary number itself and a decimal next to it. ¦ Prueba números cada vez más cercanos hasta que la respuesta cambie. Luego prueba el propio número límite y un decimal a su lado.",
          "The circle is closed if the boundary number gets through and open if it does not. For the story, ask what this quantity can really be. ¦ El círculo es cerrado si el número límite pasa y abierto si no pasa. Para la historia, pregunta qué puede ser realmente esta cantidad.",
        ],
      }),
      ctx: { kind: ctx.kind, v: ctx.v, en: ctx.en, es: ctx.es },
      rule: { op, b },
      line,
      want: { n: b, closed, dir, dec: story.dec, neg: story.neg },
      model: { op, b, ctx: ctx.kind },
    };
  }

  /** What the student's tests cover: a decimal, a number at each end of the line. */
  function coverage(/** @type {any} */ spec, /** @type {number[]} */ probes) {
    return {
      dec: probes.some((v) => !isInt(v)),
      left: probes.some((v) => v <= spec.line.min + 1),
      right: probes.some((v) => v >= spec.line.max - 1),
    };
  }

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const k = K();
    const s = st || {};
    const probes = (Array.isArray(s.probes) ? s.probes : []).filter(
      (/** @type {any} */ v) => typeof v === "number" && Number.isFinite(v),
    );
    const w = spec.want;
    const cov = coverage(spec, probes);
    if (!(cov.dec && cov.left && cov.right))
      return k.miss(
        "untested",
        "Test more before you graph. Try a decimal, a number at the far left and a number at the far right. ¦ Prueba más antes de graficar. Intenta con un decimal, un número muy a la izquierda y uno muy a la derecha.",
      );
    if (
      typeof s.n !== "number" ||
      typeof s.closed !== "boolean" ||
      !(s.dir === "left" || s.dir === "right") ||
      typeof s.dec !== "boolean" ||
      typeof s.neg !== "boolean"
    )
      return k.miss(
        "incomplete",
        "Finish your graph: set the boundary, the circle and the direction, and answer both story questions. ¦ Termina tu gráfica: fija el límite, el círculo y la dirección, y responde las dos preguntas de la historia.",
      );
    const marks = [
      Math.abs(s.n - w.n) < 1e-9,
      s.closed === w.closed,
      s.dir === w.dir,
      s.dec === w.dec,
      s.neg === w.neg,
    ];
    const parts = k.parts(marks);
    if (marks.every(Boolean)) return { ok: true, ...parts };
    const rayOk = marks[0] && marks[1] && marks[2];
    if (!rayOk) {
      const conflict = probes.some((v) => onRay(s, v) !== holds(spec.rule.op, v, spec.rule.b));
      if (conflict)
        return k.miss(
          "contradicts-test",
          "One of your own tests does not fit your graph. Find a number the gate answered differently than your graph does. ¦ Una de tus propias pruebas no coincide con tu gráfica. Busca un número que la puerta respondió distinto a tu gráfica.",
          parts,
        );
      if (!marks[0])
        return k.miss(
          "boundary",
          "Your graph fits every test you ran, but the boundary could be somewhere else. Test numbers closer together to find where the answer changes. ¦ Tu gráfica coincide con todas tus pruebas, pero el límite podría estar en otro lugar. Prueba números más cercanos para ver dónde cambia la respuesta.",
          parts,
        );
      if (!probes.some((v) => Math.abs(v - w.n) < 1e-9))
        return k.miss(
          "untested-boundary",
          "You have not tested the boundary itself. Test that exact number. Does the gate let it through? ¦ No has probado el propio límite. Prueba ese número exacto. ¿La puerta lo deja pasar?",
          parts,
        );
      return k.miss(
        "circle",
        "Look at your test of the boundary number. A closed circle means that number gets through. ¦ Mira tu prueba del número límite. Un círculo cerrado significa que ese número pasa.",
        parts,
      );
    }
    if (!marks[3])
      return k.miss(
        "story-decimal",
        "The gate accepts these numbers, but a story may not. Think about whether this quantity can be a part of a whole, like 2.5. ¦ La puerta acepta estos números, pero una historia quizá no. Piensa si esta cantidad puede ser una parte de un entero, como 2.5.",
        parts,
      );
    return k.miss(
      "story-negative",
      "The gate accepts these numbers, but a story may not. Think about whether this quantity can be less than 0. ¦ La puerta acepta estos números, pero una historia quizá no. Piensa si esta cantidad puede ser menor que 0.",
      parts,
    );
  }

  function solution(/** @type {any} */ spec) {
    const w = spec.want;
    const near = r2(w.n - 0.1);
    const probes = [spec.line.min, spec.line.max, w.n, near, r2(w.n + 0.5)];
    return {
      probes: [...new Set(probes.filter((v) => v >= spec.line.min && v <= spec.line.max))],
      n: w.n,
      closed: w.closed,
      dir: w.dir,
      dec: w.dec,
      neg: w.neg,
    };
  }

  function wrong(/** @type {any} */ spec, _rng) {
    const sol = solution(spec);
    return [
      { ...sol, closed: !sol.closed },
      { ...sol, dir: sol.dir === "left" ? "right" : "left" },
      { ...sol, n: r2(sol.n + 2) },
      { ...sol, dec: !sol.dec },
      { ...sol, neg: !sol.neg },
      { ...sol, probes: [] },
    ];
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.ak-gate .gt-tests{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.ak-gate .gt-tests li{border:2px solid var(--border,#D5DCE5);border-radius:999px;padding:4px 12px;font-weight:700;background:var(--surface,#fff)}
.ak-gate .gt-tests li.pass{border-color:var(--ok,#0A7D4B)}
.ak-gate .gt-check{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px;font-weight:700}
.ak-gate .gt-line .gt-ray{stroke:var(--brand,#2C4A68);stroke-width:7;stroke-linecap:round}
.ak-gate .gt-circ{stroke:var(--brand,#2C4A68);stroke-width:3.5;fill:var(--surface,#fff)}
.ak-gate .gt-circ.closed{fill:var(--brand,#2C4A68)}
.ak-gate .gt-pr{stroke:var(--ink,#1B2733);stroke-width:2.5;fill:var(--surface,#fff)}
.ak-gate .gt-pr.pass{fill:var(--ink,#1B2733)}
.ak-gate .gt-cur{fill:none;stroke:var(--sun,#F0BD4F);stroke-width:5}
@media (forced-colors:active){.ak-gate .gt-ray{stroke:Highlight}.ak-gate .gt-circ{stroke:CanvasText;fill:Canvas}.ak-gate .gt-circ.closed,.ak-gate .gt-pr.pass{fill:Highlight}.ak-gate .gt-pr{stroke:CanvasText;fill:Canvas}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("gate", CSS);
    const k = K();
    const c = k.start(host, spec, api, "gate");
    const { T, L } = c;
    const sv = c.saved || {};
    const st = {
      probes: (sv.probes || []).slice(),
      n: typeof sv.n === "number" ? sv.n : null,
      closed: typeof sv.closed === "boolean" ? sv.closed : null,
      dir: sv.dir || null,
      dec: typeof sv.dec === "boolean" ? sv.dec : null,
      neg: typeof sv.neg === "boolean" ? sv.neg : null,
    };
    let cur = Math.round((spec.line.min + spec.line.max) / 2);
    const lo = spec.line.min;
    const hi = spec.line.max;
    const span = hi - lo;

    /* tests */
    const tests = A.el("ul", "gt-tests", "", { "aria-label": "My tests" });
    c.label(tests, "My tests", "Mis pruebas");
    const probeIn = A.el("input", "ak-in", "", {
      type: "text",
      inputmode: "decimal",
      autocomplete: "off",
    });
    c.label(probeIn, "Number to test", "Número para probar");
    const down = A.el("button", "ak-step", "−", { type: "button" });
    const up = A.el("button", "ak-step", "+", { type: "button" });
    c.label(down, "Make the test number smaller", "Hacer el número de prueba menor");
    c.label(up, "Make the test number bigger", "Hacer el número de prueba mayor");
    const testBtn = A.el("button", "ak-btn go", T("Test it", "Probar"), { type: "button" });
    const err = A.el("p", "ak-note", "");
    const lineEl = A.el("div", "ak-svg gt-line", "", {
      tabindex: c.solved ? "-1" : "0",
      role: "application",
    });
    c.label(
      lineEl,
      "Number line. Left and right arrows change the test number. Enter tests it.",
      "Recta numérica. Las flechas izquierda y derecha cambian el número de prueba. Enter lo prueba.",
    );
    const checklist = A.el("ul", "gt-check");

    /* commit */
    const bIn = A.el("input", "ak-in", "", {
      type: "text",
      inputmode: "decimal",
      autocomplete: "off",
    });
    c.label(bIn, "Boundary number", "Número límite");
    const bDown = A.el("button", "ak-step", "−", { type: "button" });
    const bUp = A.el("button", "ak-step", "+", { type: "button" });
    c.label(bDown, "Make the boundary smaller", "Hacer el límite menor");
    c.label(bUp, "Make the boundary bigger", "Hacer el límite mayor");
    const open = A.el("button", "ak-btn", T("○ Open circle", "○ Círculo abierto"), {
      type: "button",
    });
    const closedB = A.el("button", "ak-btn", T("● Closed circle", "● Círculo cerrado"), {
      type: "button",
    });
    const left = A.el("button", "ak-btn", T("◀ Ray points left", "◀ Rayo a la izquierda"), {
      type: "button",
    });
    const right = A.el("button", "ak-btn", T("Ray points right ▶", "Rayo a la derecha ▶"), {
      type: "button",
    });
    const sayWord = A.el("p", "ak-box", "");
    /* story */
    const mkYn = (
      /** @type {string} */ en,
      /** @type {string} */ esT,
      /** @type {string} */ key,
    ) => {
      const row = A.el("div", "ak-card");
      row.append(A.el("p", "ak-text", `<b>${T(en, esT)}</b>`));
      const g = A.el("div", "ak-row", "", { role: "group" });
      c.label(g, en, esT);
      const y = A.el("button", "ak-btn", T("Yes", "Sí"), { type: "button" });
      const n = A.el("button", "ak-btn", T("No", "No"), { type: "button" });
      g.append(y, n);
      row.append(g);
      y.addEventListener("click", () => setYn(key, true));
      n.addEventListener("click", () => setYn(key, false));
      return { row, y, n, key };
    };
    const ynDec = mkYn(
      `In the story, can ${spec.ctx.en} be a decimal like 2.5?`,
      `En la historia, ¿puede ser ${spec.ctx.es} un decimal como 2.5?`,
      "dec",
    );
    const ynNeg = mkYn(
      `In the story, can ${spec.ctx.en} be less than 0?`,
      `En la historia, ¿puede ser ${spec.ctx.es} menor que 0?`,
      "neg",
    );
    c.body.append(
      A.el("p", "ak-cap", T("1. Test numbers", "1. Prueba números")),
      lineEl,
      Object.assign(A.el("div", "ak-row"), {}),
    );
    const testRow = c.body.lastChild;
    testRow.append(down, probeIn, up, testBtn);
    c.body.append(err, tests, checklist);
    const commitCap = A.el(
      "p",
      "ak-cap",
      T("2. Graph what the gate lets through", "2. Grafica lo que la puerta deja pasar"),
    );
    const bRow = A.el("div", "ak-row");
    bRow.append(A.el("span", "ak-text", `<b>${T("Boundary", "Límite")}</b>`), bDown, bIn, bUp);
    const cRow = A.el("div", "ak-row", "", { role: "group" });
    c.label(cRow, "Circle", "Círculo");
    cRow.append(open, closedB);
    const dRow = A.el("div", "ak-row", "", { role: "group" });
    c.label(dRow, "Ray direction", "Dirección del rayo");
    dRow.append(left, right);
    c.body.append(
      commitCap,
      bRow,
      cRow,
      dRow,
      sayWord,
      A.el("p", "ak-cap", T("3. What does the story allow?", "3. ¿Qué permite la historia?")),
      ynDec.row,
      ynNeg.row,
    );

    const X = (/** @type {number} */ v) => 24 + ((v - lo) / span) * 572;
    const BY = 50;
    function drawLine() {
      const s = [];
      s.push(`<line class="ak-ink" x1="10" y1="${BY}" x2="610" y2="${BY}"/>`);
      for (let v = Math.ceil(lo); v <= hi; v++) {
        const major = span <= 14 || v % 2 === 0;
        s.push(`<line class="ak-ink" x1="${X(v)}" y1="${BY - 7}" x2="${X(v)}" y2="${BY + 7}"/>`);
        if (major)
          s.push(
            `<text class="ak-lab" text-anchor="middle" x="${X(v)}" y="${BY + 26}">${k.n(v)}</text>`,
          );
      }
      if (st.n !== null && st.dir) {
        const x0 = X(Math.max(lo, Math.min(hi, st.n)));
        const x1 = st.dir === "right" ? 600 : 18;
        s.push(`<line class="gt-ray" x1="${x0}" y1="${BY}" x2="${x1}" y2="${BY}"/>`);
      }
      if (st.n !== null)
        s.push(
          `<circle class="gt-circ${st.closed ? " closed" : ""}" cx="${X(Math.max(lo, Math.min(hi, st.n)))}" cy="${BY}" r="10"/>`,
        );
      for (const v of st.probes) {
        const pass = holds(spec.rule.op, v, spec.rule.b);
        s.push(`<circle class="gt-pr${pass ? " pass" : ""}" cx="${X(v)}" cy="${BY - 24}" r="8"/>`);
      }
      const cv = k.parse(probeIn.value);
      if (!c.solved && cv !== null && cv >= lo && cv <= hi)
        s.push(`<circle class="gt-cur" cx="${X(cv)}" cy="${BY}" r="15"/>`);
      lineEl.innerHTML = `<svg viewBox="0 0 620 ${BY + 40}" aria-hidden="true" focusable="false">${s.join("")}</svg>`;
    }
    function drawTests() {
      tests.textContent = "";
      const sorted = st.probes.slice().sort((a, b) => a - b);
      if (!sorted.length) {
        tests.append(A.el("li", "", T("No tests yet", "Aún no hay pruebas")));
        return;
      }
      for (const v of sorted) {
        const pass = holds(spec.rule.op, v, spec.rule.b);
        tests.append(
          A.el(
            "li",
            pass ? "pass" : "",
            `${k.n(v)}: ${pass ? T("passes", "pasa") : T("is stopped", "se detiene")}`,
          ),
        );
      }
    }
    function drawChecklist() {
      const cov = coverage(spec, st.probes);
      checklist.textContent = "";
      for (const [ok, en, esT] of [
        [cov.dec, "a decimal", "un decimal"],
        [cov.left, "the far left", "el extremo izquierdo"],
        [cov.right, "the far right", "el extremo derecho"],
      ])
        checklist.append(A.el("li", "", `${ok ? "✓" : "○"} ${T(en, esT)}`));
    }
    function sentence() {
      const sym = st.dir
        ? st.dir === "right"
          ? st.closed
            ? "≥"
            : ">"
          : st.closed
            ? "≤"
            : "<"
        : "?";
      const bn = st.n === null ? "?" : k.n(st.n);
      const ready = st.dir && st.closed !== null && st.n !== null;
      sayWord.innerHTML = ready
        ? `${T("Your graph says", "Tu gráfica dice")}: ${spec.ctx.v} ${sym} ${bn}`
        : T("Your graph is not finished yet", "Tu gráfica aún no está terminada");
    }
    function draw() {
      const marks = c.marks();
      drawLine();
      drawTests();
      drawChecklist();
      sentence();
      const cov = coverage(spec, st.probes);
      const done = cov.dec && cov.left && cov.right;
      open.setAttribute("aria-pressed", String(st.closed === false));
      closedB.setAttribute("aria-pressed", String(st.closed === true));
      left.setAttribute("aria-pressed", String(st.dir === "left"));
      right.setAttribute("aria-pressed", String(st.dir === "right"));
      for (const y of [ynDec, ynNeg]) {
        y.y.setAttribute("aria-pressed", String(st[y.key] === true));
        y.n.setAttribute("aria-pressed", String(st[y.key] === false));
        y.y.disabled = y.n.disabled = c.solved;
      }
      for (const b of [open, closedB, left, right, down, up, bDown, bUp, testBtn, probeIn, bIn])
        b.disabled = c.solved;
      if (marks) {
        bRow.classList.toggle("ak-mark-bad", marks[0] === false);
        cRow.classList.toggle("ak-mark-bad", marks[1] === false);
        dRow.classList.toggle("ak-mark-bad", marks[2] === false);
        ynDec.row.classList.toggle("ak-mark-bad", marks[3] === false);
        ynNeg.row.classList.toggle("ak-mark-bad", marks[4] === false);
      } else
        for (const e of [bRow, cRow, dRow, ynDec.row, ynNeg.row]) e.classList.remove("ak-mark-bad");
      c.checkBtn.disabled =
        !done ||
        st.n === null ||
        st.closed === null ||
        !st.dir ||
        st.dec === null ||
        st.neg === null;
      c.clearBtn.disabled =
        !st.probes.length &&
        st.n === null &&
        st.closed === null &&
        !st.dir &&
        st.dec === null &&
        st.neg === null;
    }
    function changed() {
      c.verdict = null;
      c.note.textContent = "";
      c.emit(st);
      draw();
    }
    function probe(/** @type {number|null} */ v) {
      err.textContent = "";
      if (v === null || v < lo - 1e-9 || v > hi + 1e-9) {
        err.textContent = L(
          `Use a number from ${k.n(lo)} to ${k.n(hi)}.`,
          `Usa un número de ${k.n(lo)} a ${k.n(hi)}.`,
        );
        return;
      }
      const val = r2(v);
      probeIn.value = k.n(val);
      if (!st.probes.some((p) => Math.abs(p - val) < 1e-9)) st.probes.push(val);
      const pass = holds(spec.rule.op, val, spec.rule.b);
      c.say(
        `${k.n(val)} ${pass ? "passes the gate" : "is stopped by the gate"}`,
        `${k.n(val)} ${pass ? "pasa la puerta" : "es detenido por la puerta"}`,
      );
      changed();
    }
    function setYn(/** @type {"dec"|"neg"} */ key, /** @type {boolean} */ v) {
      if (c.solved) return;
      st[key] = v;
      changed();
    }
    function nudge(
      /** @type {any} */ inp,
      /** @type {number} */ d,
      /** @type {(v:number)=>void} */ apply,
    ) {
      const base = k.parse(inp.value);
      const v = r2(Math.max(lo, Math.min(hi, (base === null ? cur : base) + d)));
      inp.value = k.n(v);
      apply(v);
    }
    down.addEventListener("click", () =>
      nudge(probeIn, -0.5, (v) => {
        cur = v;
        draw();
      }),
    );
    up.addEventListener("click", () =>
      nudge(probeIn, 0.5, (v) => {
        cur = v;
        draw();
      }),
    );
    testBtn.addEventListener("click", () => probe(k.parse(probeIn.value)));
    probeIn.addEventListener("keydown", (/** @type {any} */ e) => {
      if (e.key === "Enter") probe(k.parse(probeIn.value));
    });
    probeIn.addEventListener("input", () => drawLine());
    lineEl.addEventListener("keydown", (/** @type {any} */ e) => {
      if (c.solved) return;
      const d = { ArrowLeft: -0.5, ArrowRight: 0.5, ArrowDown: -0.5, ArrowUp: 0.5 }[e.key];
      if (d) {
        e.preventDefault();
        nudge(probeIn, d, (v) => {
          cur = v;
          draw();
        });
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        probe(k.parse(probeIn.value) ?? cur);
      }
    });
    lineEl.addEventListener("pointerup", (/** @type {any} */ e) => {
      if (c.solved || (e.pointerType === "mouse" && e.button !== 0)) return;
      const r = lineEl.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 620;
      const v = lo + ((px - 24) / 572) * span;
      probe(Math.max(lo, Math.min(hi, Math.round(v * 2) / 2)));
    });
    bDown.addEventListener("click", () => {
      st.n = r2(
        Math.max(lo, Math.min(hi, (st.n === null ? Math.round((lo + hi) / 2) : st.n) - 0.5)),
      );
      bIn.value = k.n(st.n);
      changed();
    });
    bUp.addEventListener("click", () => {
      st.n = r2(
        Math.max(lo, Math.min(hi, (st.n === null ? Math.round((lo + hi) / 2) : st.n) + 0.5)),
      );
      bIn.value = k.n(st.n);
      changed();
    });
    bIn.addEventListener("input", () => {
      const v = k.parse(bIn.value);
      st.n = v === null ? null : r2(v);
      changed();
    });
    open.addEventListener("click", () => {
      st.closed = false;
      changed();
    });
    closedB.addEventListener("click", () => {
      st.closed = true;
      changed();
    });
    left.addEventListener("click", () => {
      st.dir = "left";
      changed();
    });
    right.addEventListener("click", () => {
      st.dir = "right";
      changed();
    });
    bIn.value = st.n === null ? "" : k.n(st.n);
    c.redraws.push(draw);
    c.wire(
      () => st,
      () => {
        st.probes = [];
        st.n = st.closed = st.dir = st.dec = st.neg = null;
        probeIn.value = "";
        bIn.value = "";
        c.emit(st);
      },
    );
    draw();
  }

  A.register("gate", {
    title: "Hidden gate",
    titleEs: "La puerta oculta",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();

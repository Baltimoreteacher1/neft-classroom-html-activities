/**
 * Practice Studio activity: boundary (window.StudioAct kind "boundary"), lesson 8-4 "Boundary probe".
 * A limit sign says "at least 12". The student marks the number just below the limit, the limit itself and the number just
 * above it as allowed or not allowed, then picks the symbol. The exact limit is the point of the activity: does the sign let
 * someone who is exactly 12 in?
 * State: { m: [bool|null, bool|null, bool|null], sym: ">" | ">=" | "<" | "<=" | null }.
 * Contract: docs/specs/practice-studio-v2.md section 5; feedback shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;
  const K = () => A.kit;

  const SYM = { ">": ">", ">=": "≥", "<": "<", "<=": "≤" };
  // allowed? for [limit − 1, limit, limit + 1]
  const PATTERN = {
    ">=": [false, true, true],
    ">": [false, false, true],
    "<=": [true, true, false],
    "<": [true, false, false],
  };
  const holds = (/** @type {string} */ op, /** @type {number} */ v, /** @type {number} */ n) =>
    op === ">" ? v > n : op === ">=" ? v >= n : op === "<" ? v < n : v <= n;

  // [op, sign sentence, unit (one), a probe label, exact person/thing]; every text is "English ¦ Español"
  const STORIES = [
    [
      ">=",
      "The ride sign says: riders must be at least {n} years old. ¦ El letrero del juego dice: los pasajeros deben tener al menos {n} años.",
      "{v} years old ¦ {v} años",
      "someone who is exactly {n} years old ¦ alguien que tiene exactamente {n} años",
    ],
    [
      "<=",
      "The elevator sign says: no more than {n} people. ¦ El letrero del ascensor dice: no más de {n} personas.",
      "{v} people ¦ {v} personas",
      "a group of exactly {n} people ¦ un grupo de exactamente {n} personas",
    ],
    [
      ">",
      "The contest rule says: you need more than {n} points to win. ¦ La regla del concurso dice: necesitas más de {n} puntos para ganar.",
      "{v} points ¦ {v} puntos",
      "a team with exactly {n} points ¦ un equipo con exactamente {n} puntos",
    ],
    [
      "<",
      "The mail rule says: a package must weigh fewer than {n} pounds. ¦ La regla del correo dice: un paquete debe pesar menos de {n} libras.",
      "{v} pounds ¦ {v} libras",
      "a package of exactly {n} pounds ¦ un paquete de exactamente {n} libras",
    ],
    [
      ">=",
      "The team rule says: a team needs no fewer than {n} players. ¦ La regla del equipo dice: un equipo necesita no menos de {n} jugadores.",
      "{v} players ¦ {v} jugadores",
      "a team of exactly {n} players ¦ un equipo de exactamente {n} jugadores",
    ],
    [
      "<=",
      "The box label says: holds up to {n} books. ¦ La etiqueta de la caja dice: lleva hasta {n} libros.",
      "{v} books ¦ {v} libros",
      "a box with exactly {n} books ¦ una caja con exactamente {n} libros",
    ],
    [
      ">",
      "The fair sign says: riders must be taller than {n} inches. ¦ El letrero de la feria dice: los pasajeros deben medir más de {n} pulgadas.",
      "{v} inches tall ¦ {v} pulgadas de altura",
      "a rider who is exactly {n} inches tall ¦ un pasajero que mide exactamente {n} pulgadas",
    ],
    [
      "<",
      "The ticket rule says: pay under ${n}. ¦ La regla del boleto dice: paga menos de ${n}.",
      "${v} ¦ ${v}",
      "a price of exactly ${n} ¦ un precio de exactamente ${n}",
    ],
  ];

  function make(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ _p) {
    const k = K();
    const pool = lv === 1 ? STORIES.filter((s) => s[0] === ">=" || s[0] === "<=") : STORIES;
    const idx = STORIES.indexOf(rng.pick(pool));
    const [op, sentence, probe, exact] = STORIES[idx];
    const n =
      lv === 1
        ? rng.int(4, 30)
        : lv === 2
          ? rng.int(5, 60)
          : lv === 3
            ? rng.int(2, 40) + 0.5
            : rng.pick([rng.int(10, 90), rng.int(1, 30) + 0.5, rng.int(2, 20) * 5]);
    const values = [n - 1, n, n + 1].map((v) => Math.round(v * 100) / 100);
    const fillS = (/** @type {string} */ s, /** @type {any} */ o) =>
      s.replace(/\{(\w+)\}/g, (_m, key) => o[key]);
    const [sEn, sEs] = k.bi(fillS(sentence, { n: k.n(n) }));
    const [eEn, eEs] = k.bi(fillS(exact, { n: k.n(n) }));
    const labels = values.map((v) => k.bi(fillS(probe, { v: k.n(v) })));
    const sym = SYM[op];
    const word = (/** @type {boolean} */ allowed) => (allowed ? "allowed" : "not allowed");
    void word;
    return {
      ...k.pack({
        q: `${sEn} Mark each number as allowed or not allowed. Then choose the symbol that matches the sign. ¦ ${sEs} Marca cada número como permitido o no permitido. Luego elige el símbolo que coincide con el letrero.`,
        x: `Exactly ${k.n(n)} ${PATTERN[op][1] ? "is allowed" : "is not allowed"} because the sign ${PATTERN[op][1] ? "includes" : "leaves out"} the limit. The numbers that fit the sign are the ones with x ${sym} ${k.n(n)}. ¦ Exactamente ${k.n(n)} ${PATTERN[op][1] ? "está permitido" : "no está permitido"} porque el letrero ${PATTERN[op][1] ? "incluye" : "deja fuera"} el límite. Los números que cumplen el letrero son los que cumplen x ${sym} ${k.n(n)}.`,
        h: [
          "Read the sign once. Then test each number: do the words let it in? ¦ Lee el letrero una vez. Luego prueba cada número: ¿las palabras lo dejan entrar?",
          "Look at the number that is exactly the limit. Do the words include it or leave it out? ¦ Mira el número que es exactamente el límite. ¿Las palabras lo incluyen o lo dejan fuera?",
          "Choose the symbol that lets in the same numbers you marked as allowed. ¦ Elige el símbolo que deja entrar los mismos números que marcaste como permitidos.",
        ],
      }),
      story: idx,
      n,
      values,
      labels: labels.map((l) => ({ en: l[0], es: l[1] })),
      exact: { en: eEn, es: eEs },
      sentence: { en: sEn, es: sEs },
      want: { m: PATTERN[op].slice(), sym: op },
      model: { op, n },
    };
  }

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const k = K();
    const s = st || {};
    const m = Array.isArray(s.m) ? s.m : [];
    const w = spec.want;
    if (m.length !== 3 || m.some((v) => typeof v !== "boolean") || !SYM[s.sym])
      return k.miss(
        "incomplete",
        "Mark all three numbers and choose a symbol, then check. ¦ Marca los tres números y elige un símbolo; luego comprueba.",
      );
    const marks = [m[0] === w.m[0], m[1] === w.m[1], m[2] === w.m[2], s.sym === w.sym];
    const parts = k.parts(marks);
    if (marks.every(Boolean)) return { ok: true, ...parts };
    // the student's own marks against the student's own symbol: a mismatch needs no answer key
    const own = spec.values.map((/** @type {number} */ v) => holds(s.sym, v, spec.n));
    if (own.some((v, i) => v !== m[i]))
      return k.miss(
        "marks-vs-symbol",
        "Your marks and your symbol let in different numbers. Test your symbol on each number. ¦ Tus marcas y tu símbolo dejan entrar números distintos. Prueba tu símbolo con cada número.",
        parts,
      );
    if (m[1] !== w.m[1] && m[0] === w.m[0] && m[2] === w.m[2])
      return k.miss(
        "boundary-case",
        "Look at the number that is exactly the limit. Do the words of the sign let it in? ¦ Mira el número que es exactamente el límite. ¿Las palabras del letrero lo dejan entrar?",
        parts,
      );
    if (m[0] !== w.m[0] && m[2] !== w.m[2])
      return k.miss(
        "direction",
        "Check the direction. Which side of the limit do the words allow? ¦ Revisa la dirección. ¿Qué lado del límite permiten las palabras?",
        parts,
      );
    return k.miss(
      "reread",
      "Read the sign again. For each number, ask: do these words allow it? ¦ Lee el letrero otra vez. Para cada número, pregunta: ¿estas palabras lo permiten?",
      parts,
    );
  }

  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const w = spec.want;
    const opposite = { ">": "<", ">=": "<=", "<": ">", "<=": ">=" }[w.sym];
    const strict = w.sym.includes("=") ? w.sym.replace("=", "") : `${w.sym}=`;
    return [
      { m: PATTERN[strict].slice(), sym: strict },
      { m: PATTERN[opposite].slice(), sym: opposite },
      { m: w.m.slice(), sym: opposite },
      { m: [null, null, null], sym: null },
    ];
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.ak-boundary .bd-sym{font-size:1.7rem;width:68px}
.ak-boundary .bd-expr{font-weight:800;font-size:1.5rem;text-align:center;color:var(--brand,#2C4A68)}
.ak-boundary .bd-pick{display:flex;gap:8px;flex-wrap:wrap}
.ak-boundary .bd-pick .ak-btn{min-width:120px}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("boundary", CSS);
    const k = K();
    const c = k.start(host, spec, api, "boundary");
    const { T, L } = c;
    const sv = c.saved || (c.solved ? { m: spec.want.m, sym: spec.want.sym } : {});
    const st = { m: (sv.m || [null, null, null]).slice(0, 3), sym: sv.sym || null };
    while (st.m.length < 3) st.m.push(null);

    const cards = spec.values.map((/** @type {number} */ _v, /** @type {number} */ i) => {
      const lab = spec.labels[i];
      const card = A.el("div", "ak-card");
      card.append(A.el("p", "ak-text", `<b>${T(lab.en, lab.es)}</b>`));
      const row = A.el("div", "bd-pick", "", { role: "group" });
      c.label(row, `Is ${lab.en} allowed?`, `¿Está permitido: ${lab.es}?`);
      const yes = A.el("button", "ak-btn", T("Allowed", "Permitido"), { type: "button" });
      const no = A.el("button", "ak-btn", T("Not allowed", "No permitido"), { type: "button" });
      row.append(yes, no);
      card.append(row);
      yes.addEventListener("click", () => set(i, true));
      no.addEventListener("click", () => set(i, false));
      return { card, yes, no };
    });
    const expr = A.el("div", "ak-box bd-expr");
    const prompt = A.el("p", "ak-text", "");
    prompt.innerHTML = `<b>${T(
      `Think about ${spec.exact.en}. Does the sign let them in?`,
      `Piensa en ${spec.exact.es}. ¿El letrero lo deja entrar?`,
    )}</b>`;
    const symRow = A.el("div", "ak-row", "", { role: "group" });
    c.label(symRow, "Symbol", "Símbolo");
    const symNames = {
      ">": ["greater than", "mayor que"],
      ">=": ["greater than or equal to", "mayor o igual que"],
      "<": ["less than", "menor que"],
      "<=": ["less than or equal to", "menor o igual que"],
    };
    const symBtns = Object.keys(SYM).map((key) => {
      const b = A.el("button", "ak-btn bd-sym", SYM[key], { type: "button" });
      c.label(b, symNames[key][0], symNames[key][1]);
      b.addEventListener("click", () => {
        if (c.solved) return;
        st.sym = key;
        c.say(symNames[key][0], symNames[key][1]);
        changed();
      });
      symRow.append(b);
      return { key, b };
    });
    c.body.append(...cards.map((x) => x.card), prompt, symRow, expr);

    function set(/** @type {number} */ i, /** @type {boolean} */ v) {
      if (c.solved) return;
      st.m[i] = v;
      c.say(v ? "Allowed" : "Not allowed", v ? "Permitido" : "No permitido");
      changed();
    }
    function changed() {
      c.verdict = null;
      c.note.textContent = "";
      c.emit(st);
      draw();
    }
    function draw() {
      const marks = c.marks();
      cards.forEach((x, i) => {
        x.yes.setAttribute("aria-pressed", String(st.m[i] === true));
        x.no.setAttribute("aria-pressed", String(st.m[i] === false));
        x.yes.disabled = x.no.disabled = c.solved;
        x.card.classList.toggle("ak-mark-ok", !!marks && marks[i] === true);
        x.card.classList.toggle("ak-mark-bad", !!marks && marks[i] === false);
      });
      for (const { key, b } of symBtns) {
        b.setAttribute("aria-pressed", String(st.sym === key));
        b.disabled = c.solved;
      }
      symRow.classList.toggle("ak-mark-bad", !!marks && marks[3] === false);
      expr.textContent = `x ${st.sym ? SYM[st.sym] : "?"} ${k.n(spec.n)}`;
      c.checkBtn.disabled = st.m.some((v) => v === null) || !st.sym;
      c.clearBtn.disabled = st.m.every((v) => v === null) && !st.sym;
      void L;
    }
    c.redraws.push(draw);
    c.wire(
      () => st,
      () => {
        st.m = [null, null, null];
        st.sym = null;
        c.emit(st);
      },
    );
    draw();
  }

  A.register("boundary", {
    title: "Boundary probe",
    titleEs: "Sonda del límite",
    levels: 4,
    make,
    solution: (/** @type {any} */ spec) => ({ m: spec.want.m.slice(), sym: spec.want.sym }),
    wrong,
    grade,
    mount,
  });
  void G;
})();

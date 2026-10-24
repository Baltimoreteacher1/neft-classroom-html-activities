/**
 * Practice Studio activity: cexhunt (window.StudioAct kind "cexhunt", lessons 6-6, 6-8 and 6-15).
 * Counterexample hunt. Two expressions in n; the student picks up to three test values (0 to 10) and reads the table.
 * One value where they differ shows the pair is NOT equivalent. A pair that matches at every value tested is not shown to be
 * equivalent: tests can disprove, never prove. So a pair declared equivalent must then be justified by a reason that
 * works for every n (combining like terms, or a property), and a pair declared equivalent after testing only lucky values is told so.
 * Every expression stays at or above zero for n from 0 to 10 (no negatives before Unit 7).
 * params: set = "equiv" (default) | "props" (commutative, associative, identity) | "simplify" (adds the distributive property)
 * State: { tests: number[] (up to 3), verdict: "" | "eq" | "ne", reason: index or -1 }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;

  const NMAX = 10;
  /** polynomial [n², n, 1] value */
  const ev = (/** @type {number[]} */ p, /** @type {number} */ n) => p[0] * n * n + p[1] * n + p[2];
  const lin = (/** @type {number} */ a, /** @type {number} */ b) =>
    `${a === 1 ? "n" : `${a}n`}${b ? ` + ${b}` : ""}`;

  /** an equivalent pair with the reason that proves it: {a, b, why: [en, es]} */
  function equivPair(/** @type {any} */ rng, /** @type {string} */ set) {
    const kinds =
      set === "props" ? ["comm", "assoc", "id"] : ["like", "like", "like", "comm", "assoc", "id"];
    const all = set === "simplify" ? [...kinds, "dist", "dist"] : kinds;
    const k = rng.pick(all);
    if (k === "like") {
      const [a, b, c] = [rng.int(1, 6), rng.int(1, 6), rng.int(1, 12)];
      const order = rng.int(0, 2);
      const aS = a === 1 ? "n" : `${a}n`;
      const bS = b === 1 ? "n" : `${b}n`;
      const s =
        order === 0
          ? `${aS} + ${bS} + ${c}`
          : order === 1
            ? `${aS} + ${c} + ${bS}`
            : `${c} + ${aS} + ${bS}`;
      return {
        a: { s, p: [0, a + b, c] },
        b: { s: lin(a + b, c), p: [0, a + b, c] },
        why: [
          `Combine like terms: ${aS} + ${bS} makes ${a + b === 1 ? "n" : `${a + b}n`}, and the ${c} stays as it is.`,
          `Combina términos semejantes: ${aS} + ${bS} forma ${a + b === 1 ? "n" : `${a + b}n`}, y el ${c} se queda igual.`,
        ],
      };
    }
    if (k === "comm") {
      const c = rng.int(1, 15);
      const mul = rng.chance(0.4);
      const m = rng.int(2, 9);
      return mul
        ? {
            a: { s: `${m} × n`, p: [0, m, 0] },
            b: { s: `n × ${m}`, p: [0, m, 0] },
            why: [
              "Commutative property: multiplying in a different order gives the same product.",
              "Propiedad conmutativa: multiplicar en otro orden da el mismo producto.",
            ],
          }
        : {
            a: { s: `${c} + n`, p: [0, 1, c] },
            b: { s: `n + ${c}`, p: [0, 1, c] },
            why: [
              "Commutative property: adding in a different order gives the same sum.",
              "Propiedad conmutativa: sumar en otro orden da la misma suma.",
            ],
          };
    }
    if (k === "assoc") {
      const [a, b] = [rng.int(1, 12), rng.int(1, 12)];
      return {
        a: { s: `(n + ${a}) + ${b}`, p: [0, 1, a + b] },
        b: { s: `n + (${a} + ${b})`, p: [0, 1, a + b] },
        why: [
          "Associative property: moving the parentheses to group the numbers does not change the sum.",
          "Propiedad asociativa: mover los paréntesis para agrupar los números no cambia la suma.",
        ],
      };
    }
    if (k === "id") {
      return rng.chance(0.5)
        ? {
            a: { s: "n × 1", p: [0, 1, 0] },
            b: { s: "n", p: [0, 1, 0] },
            why: [
              "Identity property: multiplying by 1 keeps n the same.",
              "Propiedad de identidad: multiplicar por 1 deja n igual.",
            ],
          }
        : {
            a: { s: "n + 0", p: [0, 1, 0] },
            b: { s: "n", p: [0, 1, 0] },
            why: [
              "Identity property: adding 0 keeps n the same.",
              "Propiedad de identidad: sumar 0 deja n igual.",
            ],
          };
    }
    const [m, c] = [rng.int(2, 7), rng.int(1, 8)];
    return {
      a: { s: `${m}(n + ${c})`, p: [0, m, m * c] },
      b: { s: `${m}n + ${m * c}`, p: [0, m, m * c] },
      why: [
        `Distributive property: ${m} multiplies both terms inside the parentheses.`,
        `Propiedad distributiva: ${m} multiplica los dos términos dentro del paréntesis.`,
      ],
    };
  }

  function nonEquivPair(
    /** @type {any} */ rng,
    /** @type {number} */ level,
    /** @type {string} */ set,
  ) {
    if (set === "simplify" && rng.chance(0.4)) {
      const [m, c] = [rng.int(2, 7), rng.int(1, 8)];
      return {
        a: { s: `${m}(n + ${c})`, p: [0, m, m * c] },
        b: { s: `${m}n + ${c}`, p: [0, m, c] },
      };
    }
    if (level >= 2 && rng.chance(0.2))
      return { a: { s: "n + n", p: [0, 2, 0] }, b: { s: "n × n", p: [1, 0, 0] } };
    if (level === 1) {
      const a = rng.int(2, 7);
      const [b1, b2] = rng.shuffle([rng.int(0, 4), rng.int(5, 12)]);
      return { a: { s: lin(a, b1), p: [0, a, b1] }, b: { s: lin(a, b2), p: [0, a, b2] } };
    }
    for (let t = 0; t < 300; t++) {
      const a1 = rng.int(2, 7);
      const a2 = rng.int(1, a1 - 1);
      const n0 = rng.int(2, 8);
      const b1 = rng.int(0, 4);
      const b2 = b1 + (a1 - a2) * n0;
      if (b2 > 40) continue;
      return { a: { s: lin(a1, b1), p: [0, a1, b1] }, b: { s: lin(a2, b2), p: [0, a2, b2] } };
    }
    throw new Error("cexhunt: no lucky pair");
  }

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const set = ["equiv", "props", "simplify"].includes(params.set) ? params.set : "equiv";
    const wantEq =
      level === 3 || (level === 4 && rng.chance(0.5)) || (set === "props" && level >= 3);
    let pr;
    for (let t = 0; t < 50; t++) {
      pr = wantEq ? equivPair(rng, set) : nonEquivPair(rng, level, set);
      if (!wantEq || pr.why.length) break;
    }
    const eq = !!wantEq;
    /** @type {number[]} */
    const same = [];
    for (let n = 0; n <= NMAX; n++) if (ev(pr.a.p, n) === ev(pr.b.p, n)) same.push(n);
    const diff = [];
    for (let n = 0; n <= NMAX; n++) if (ev(pr.a.p, n) !== ev(pr.b.p, n)) diff.push(n);
    const goodWhy = pr.why || [];
    /** @type {any[]} */
    const reasons = eq
      ? rng.shuffle([
          { kind: "good", en: goodWhy[0], es: goodWhy[1] },
          {
            kind: "tests",
            en: "They gave the same value at the numbers I tested.",
            es: "Dieron el mismo valor con los números que probé.",
          },
          {
            kind: "surface",
            en: "They both have the letter n and some numbers.",
            es: "Las dos tienen la letra n y algunos números.",
          },
        ])
      : [];
    return {
      q: `Are ${pr.a.s} and ${pr.b.s} equivalent? Pick up to 3 test values for n and read the table. Tests can show that two expressions are different. Tests can never show that two expressions are always the same.`,
      qEs: `¿Son equivalentes ${pr.a.s} y ${pr.b.s}? Elige hasta 3 valores de prueba para n y lee la tabla. Las pruebas pueden mostrar que dos expresiones son diferentes. Las pruebas nunca pueden mostrar que dos expresiones siempre son iguales.`,
      x: eq
        ? `${pr.a.s} and ${pr.b.s} are equivalent. ${goodWhy[0]} A reason like this works for every n; tests only check a few values.`
        : `${pr.a.s} and ${pr.b.s} are not equivalent. One value of n where they differ is a counterexample, and it is enough to show it. Equal values at a few tests do not prove two expressions are equivalent.`,
      xEs: eq
        ? `${pr.a.s} y ${pr.b.s} son equivalentes. ${goodWhy[1]} Una razón así sirve para todo n; las pruebas solo revisan unos pocos valores.`
        : `${pr.a.s} y ${pr.b.s} no son equivalentes. Un valor de n donde son diferentes es un contraejemplo, y basta para mostrarlo. Que den iguales en unas pocas pruebas no demuestra que dos expresiones sean equivalentes.`,
      h: [
        "Try a value, then read both numbers in the table. Do they match?",
        "A value like 0 or 1 can make two different expressions look the same. Try a different value too.",
        eq
          ? "If every test matches, you still cannot be sure. Look at how each expression is built."
          : "Look for a value where the two numbers in the table are not the same.",
      ],
      hEs: [
        "Prueba un valor y lee los dos números de la tabla. ¿Coinciden?",
        "Un valor como 0 o 1 puede hacer que dos expresiones diferentes se vean iguales. Prueba también un valor distinto.",
        eq
          ? "Si todas las pruebas coinciden, todavía no puedes estar seguro. Mira cómo está formada cada expresión."
          : "Busca un valor donde los dos números de la tabla no sean iguales.",
      ],
      model: { a: pr.a, b: pr.b, eq, same, diff, reasons, set, level },
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
    const tests = (st.tests || []).map(Number);
    if (!tests.length)
      return bad(
        "empty",
        "Pick at least one test value for n first.",
        "Primero elige al menos un valor de prueba para n.",
      );
    if (st.verdict !== "eq" && st.verdict !== "ne")
      return bad(
        "unset",
        "Decide: are the two expressions equivalent or not?",
        "Decide: ¿las dos expresiones son equivalentes o no?",
      );
    const found = tests.some((n) => ev(m.a.p, n) !== ev(m.b.p, n));
    if (!m.eq) {
      if (st.verdict === "ne") {
        if (found) return { ok: true, right: 2, of: 2, marks: [true, true] };
        return bad(
          "no-mismatch",
          "None of your test values separates the two expressions yet. Try other values.",
          "Ninguno de tus valores de prueba separa todavía las dos expresiones. Prueba otros valores.",
          { right: 1, of: 2, marks: [false, true] },
        );
      }
      if (!found)
        return bad(
          "lucky-tests",
          `You tested only ${tests.join(", ")}. The two expressions happen to match there. Equal values at a few tests do not show they are equivalent.`,
          `Probaste solo ${tests.join(", ")}. Las dos expresiones coinciden en esos valores. Que den iguales en unas pocas pruebas no muestra que sean equivalentes.`,
          { right: 0, of: 2, marks: [false, false] },
        );
      return bad(
        "ignored-mismatch",
        "Look at your table. One test where the two values are different is enough to show they are not equivalent.",
        "Mira tu tabla. Una prueba donde los dos valores son diferentes basta para mostrar que no son equivalentes.",
        { right: 1, of: 2, marks: [true, false] },
      );
    }
    if (st.verdict === "ne")
      return bad(
        "no-counterexample",
        found
          ? "Check the table again."
          : "None of your tests found a difference. Look at how each expression is built before you decide they are different.",
        found
          ? "Revisa la tabla otra vez."
          : "Ninguna de tus pruebas encontró una diferencia. Mira cómo está formada cada expresión antes de decidir que son diferentes.",
        { right: 1, of: 2, marks: [true, false] },
      );
    const r = m.reasons[Number(st.reason)];
    if (!r)
      return bad(
        "unset",
        "Now say why. Pick a reason that works for every n, not only for the values you tested.",
        "Ahora di por qué. Elige una razón que sirva para todo n, no solo para los valores que probaste.",
      );
    if (r.kind === "tests")
      return bad(
        "tests-prove",
        "Tests can show that two expressions are different. They can never show that two expressions are always the same. Pick a reason that works for every n.",
        "Las pruebas pueden mostrar que dos expresiones son diferentes. Nunca pueden mostrar que dos expresiones siempre son iguales. Elige una razón que sirva para todo n.",
        { right: 1, of: 2, marks: [true, false] },
      );
    if (r.kind === "surface")
      return bad(
        "reason",
        "That does not show the values are always the same. Think about what each expression does to n.",
        "Eso no muestra que los valores siempre sean iguales. Piensa qué le hace cada expresión a n.",
        { right: 1, of: 2, marks: [true, false] },
      );
    return { ok: true, right: 2, of: 2, marks: [true, true] };
  }
  const solution = (/** @type {any} */ spec) => {
    const m = spec.model;
    if (!m.eq)
      return {
        tests: [m.diff.find((/** @type {number} */ n) => n >= 4) ?? m.diff[0]],
        verdict: "ne",
        reason: -1,
      };
    return {
      tests: [2, 5],
      verdict: "eq",
      reason: m.reasons.findIndex((/** @type {any} */ r) => r.kind === "good"),
    };
  };
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const m = spec.model;
    /** @type {any[]} */
    const c = [];
    if (!m.eq) {
      const lucky = m.same.length ? [m.same[m.same.length - 1]] : [];
      if (lucky.length)
        c.push(
          { tests: lucky, verdict: "eq", reason: -1 },
          { tests: lucky, verdict: "ne", reason: -1 },
        );
      c.push(
        { tests: [], verdict: "ne", reason: -1 },
        { tests: [m.diff[0]], verdict: "eq", reason: -1 },
        { tests: [m.diff[0]], verdict: "", reason: -1 },
      );
    } else {
      const kind = (/** @type {string} */ k) =>
        m.reasons.findIndex((/** @type {any} */ r) => r.kind === k);
      c.push(
        { tests: [2, 5], verdict: "ne", reason: -1 },
        { tests: [2, 5], verdict: "eq", reason: kind("tests") },
        { tests: [2, 5], verdict: "eq", reason: kind("surface") },
        { tests: [2, 5], verdict: "eq", reason: -1 },
        { tests: [], verdict: "eq", reason: kind("good") },
      );
    }
    return c.filter((st) => !grade(spec, st).ok);
  }

  const CSS = `
.cx-pair{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center}
.cx-tbl{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.cx-tbl li{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-weight:700}
.cx-tbl .k-cell.hi{outline-style:solid}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const K = A.kit;
    const m = spec.model;
    K.mount(host, spec, api, {
      kind: "cexhunt",
      css: CSS,
      def,
      okEn: m.eq ? "You gave a reason that works for every n." : "You found a counterexample.",
      okEs: m.eq ? "Diste una razón que sirve para todo n." : "Encontraste un contraejemplo.",
      init: (/** @type {any} */ b) => ({
        tests: Array.isArray(b.tests) ? b.tests.map(Number).slice(0, 3) : [],
        verdict: b.verdict === "eq" || b.verdict === "ne" ? b.verdict : "",
        reason: Number.isInteger(b.reason) ? b.reason : -1,
      }),
      render(/** @type {any} */ c) {
        const { st, T, L, el, view } = c;
        const pair = el("div", "cx-pair");
        pair.append(
          el("span", "k-big", m.a.s),
          el("span", "k-lab", T("and", "y")),
          el("span", "k-big", m.b.s),
        );
        const pick = K.box(
          "Pick up to 3 test values for n",
          "Elige hasta 3 valores de prueba para n",
        );
        const chips = el("div", "k-chips", "", { role: "group" });
        for (let n = 0; n <= NMAX; n++) {
          const on = st.tests.includes(n);
          const b = K.btn(
            String(n),
            "",
            () => {
              st.tests = on
                ? st.tests.filter((/** @type {number} */ x) => x !== n)
                : [...st.tests, n].slice(0, 3);
              c.change(`t${n}`);
            },
            { pressed: on, key: `t${n}`, label: `n = ${n}` },
          );
          if (!on && st.tests.length >= 3) b.disabled = true;
          chips.append(b);
        }
        pick.append(chips);
        const tbl = K.box("What each expression gives", "Lo que da cada expresión");
        if (!st.tests.length)
          tbl.append(
            el(
              "p",
              "k-note",
              T("Pick a value to fill the table.", "Elige un valor para llenar la tabla."),
            ),
          );
        else {
          const ul = el("ul", "cx-tbl");
          for (const n of [...st.tests].sort(
            (/** @type {number} */ x, /** @type {number} */ y) => x - y,
          )) {
            const [x, y] = [ev(m.a.p, n), ev(m.b.p, n)];
            const li = el("li");
            li.append(
              el("span", "k-cell", `n = ${n}`),
              el("span", "k-cell", String(x)),
              el("span", "k-cell", String(y)),
              el(
                "span",
                `k-cell ${x === y ? "on" : "hi"}`,
                x === y ? `= ${T("same", "igual")}` : `≠ ${T("different", "distinto")}`,
              ),
            );
            ul.append(li);
          }
          tbl.append(ul);
        }
        const dec = K.box("What do you decide?", "¿Qué decides?");
        const row = el("div", "k-chips", "", { role: "group" });
        for (const [v, en, esT] of /** @type {[string,string,string][]} */ ([
          ["eq", "They ARE equivalent", "SÍ son equivalentes"],
          ["ne", "They are NOT equivalent", "NO son equivalentes"],
        ]))
          row.append(
            K.btn(
              en,
              esT,
              () => {
                st.verdict = v;
                c.change(`v${v}`);
              },
              { pressed: st.verdict === v, key: `v${v}` },
            ),
          );
        dec.append(row);
        view.append(pair, pick, tbl, dec);
        if (st.verdict === "eq") {
          const why = K.box(
            "Why are they always the same? Tests cannot prove it.",
            "¿Por qué siempre son iguales? Las pruebas no lo pueden demostrar.",
          );
          const g = el("div", "k-chips", "", { role: "group" });
          m.reasons.forEach((/** @type {any} */ r, /** @type {number} */ i) =>
            g.append(
              K.btn(
                r.en,
                r.es,
                () => {
                  st.reason = i;
                  c.change(`r${i}`);
                },
                { pressed: st.reason === i, key: `r${i}` },
              ),
            ),
          );
          why.append(g);
          view.append(why);
        }
        void L;
      },
    });
  }

  const def = {
    title: "Counterexample hunt",
    titleEs: "Búsqueda de contraejemplos",
    levels: 4,
    testParams: [{}, { set: "props" }, { set: "simplify" }],
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("cexhunt", def);
})();

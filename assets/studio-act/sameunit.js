/**
 * Practice Studio activity: sameunit (window.StudioAct kind "sameunit", lessons 6-2 and 6-10).
 * Divide a fraction by a fraction on a common-unit bar: the student chooses the size of one piece, both fractions are drawn in
 * that unit, and the quotient is how much of ONE group (the divisor) fits in the amount (the dividend). A unit that one of
 * the fractions does not land on will not line up, and the miss says which fraction, never a unit that works.
 * State: { u: pieces per whole, ans: quotient as text }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const rf = (/** @type {number} */ n, /** @type {number} */ d) => {
    const g = G.gcd(n, d) || 1;
    return [n / g, d / g];
  };
  const tx = (/** @type {number[]} */ f) => G.mixed(f[0], f[1]);
  const val = (/** @type {number[]} */ f) => f[0] / f[1];
  const UNITS = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 20, 24];
  const NAMES = {
    2: ["halves", "mitades"],
    3: ["thirds", "tercios"],
    4: ["fourths", "cuartos"],
    5: ["fifths", "quintos"],
    6: ["sixths", "sextos"],
    8: ["eighths", "octavos"],
    9: ["ninths", "novenos"],
    10: ["tenths", "décimos"],
    12: ["twelfths", "doceavos"],
    15: ["fifteenths", "quinceavos"],
    20: ["twentieths", "veinteavos"],
    24: ["twenty-fourths", "veinticuatroavos"],
  };
  const nm = (/** @type {number} */ u, /** @type {number} */ i) => /** @type {any} */ (NAMES)[u][i];
  const ok = (/** @type {number[]} */ f, /** @type {number} */ u) => (u * f[0]) % f[1] === 0;
  const pcs = (/** @type {number[]} */ f, /** @type {number} */ u) => (u * f[0]) / f[1];

  function pair(/** @type {any} */ rng, /** @type {number} */ level) {
    for (let t = 0; t < 4000; t++) {
      /** @type {number[]} */ let a;
      /** @type {number[]} */ let b;
      const prop = (/** @type {number} */ d) => rf(rng.int(1, d - 1), d);
      if (level === 1) {
        const [d1, d2] = rng.pick([
          [2, 4],
          [4, 2],
          [3, 6],
          [6, 3],
          [4, 8],
          [8, 4],
          [5, 10],
          [10, 5],
          [2, 8],
          [8, 2],
        ]);
        a = prop(d1);
        b = prop(d2);
      } else if (level === 2) {
        a = prop(rng.int(2, 6));
        b = prop(rng.int(2, 6));
        if (G.gcd(a[1], b[1]) !== 1) continue;
      } else if (level === 3) {
        const d = rng.int(2, 6);
        a = rf(rng.int(1, 2) * d + rng.int(1, d - 1), d);
        b = prop(rng.int(2, 6));
      } else {
        const d = rng.int(2, 5);
        b = rf(rng.int(d + 1, 2 * d), d);
        const e = rng.int(2, 6);
        a = rng.chance(0.5) ? prop(e) : rf(rng.int(1, 2) * e + rng.int(1, e - 1), e);
      }
      if (a[1] < 2 || b[1] < 2 || (level < 4 && val(b) >= 1) || val(a) > 3) continue;
      if (level === 4 && !(b[0] > b[1])) continue;
      const u0 = G.lcm(a[1], b[1]);
      if (u0 > 24 || !UNITS.includes(u0)) continue;
      const D = pcs(a, u0);
      const V = pcs(b, u0);
      if (V < 2 || D === V) continue;
      const quo = rf(D, V);
      if (level === 1 && (quo[1] !== 1 || quo[0] < 2)) continue;
      if (level > 1 && quo[1] === 1 && rng.chance(0.6)) continue;
      return { a, b, u0, D, V, quo };
    }
    throw new Error(`sameunit: no pair for L${level}`);
  }

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    const p = pair(rng, level);
    const A0 = tx(p.a);
    const B0 = tx(p.b);
    const valid = UNITS.filter((u) => ok(p.a, u) && ok(p.b, u));
    const decoys = rng.shuffle(UNITS.filter((u) => !valid.includes(u))).slice(0, 8 - valid.length);
    const opts = [...valid, ...decoys].sort((x, y) => x - y);
    const uN = nm(p.u0, 0);
    const uNEs = nm(p.u0, 1);
    return {
      q: `How many groups of ${B0} fit in ${A0}? Part of a group counts. Choose a piece size that both fractions fit, then compare the pieces.`,
      qEs: `¿Cuántos grupos de ${B0} caben en ${A0}? Una parte de un grupo también cuenta. Elige un tamaño de pieza en el que quepan las dos fracciones y luego compara las piezas.`,
      x: `${A0} ÷ ${B0}: in ${uN}, ${A0} is ${p.D} pieces and one group of ${B0} is ${p.V} pieces. ${p.D} pieces fill ${p.D}/${p.V} of a group, which is ${tx(p.quo)}.`,
      xEs: `${A0} ÷ ${B0}: en ${uNEs}, ${A0} son ${p.D} piezas y un grupo de ${B0} son ${p.V} piezas. ${p.D} piezas llenan ${p.D}/${p.V} de un grupo, que es ${tx(p.quo)}.`,
      h: [
        "Pick a piece size so that each fraction is a whole number of pieces.",
        "The divisor is one group. The dividend is the amount you want to fill.",
        "Count the pieces in the amount and the pieces in one group. How much of a group is that?",
      ],
      hEs: [
        "Elige un tamaño de pieza para que cada fracción sea un número entero de piezas.",
        "El divisor es un grupo. El dividendo es la cantidad que quieres llenar.",
        "Cuenta las piezas de la cantidad y las piezas de un grupo. ¿Qué parte de un grupo es?",
      ],
      model: { a: p.a, b: p.b, u0: p.u0, D: p.D, V: p.V, quo: p.quo, opts, level },
    };
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
    const m = spec.model;
    st = st || {};
    const u = Number(st.u || 0);
    if (!u) return bad("empty", "Choose a piece size first.", "Primero elige un tamaño de pieza.");
    const okA = ok(m.a, u);
    const okB = ok(m.b, u);
    if (!okA || !okB) {
      const which = !okA && !okB ? "Neither fraction" : okA ? tx(m.b) : tx(m.a);
      const whichEs = !okA && !okB ? "Ninguna de las fracciones" : okA ? tx(m.b) : tx(m.a);
      return bad(
        "unit",
        `${which} does not land on a whole number of pieces of this size, so the bars will not line up. Try another piece size.`,
        `${whichEs} no cae en un número entero de piezas de este tamaño, así que las barras no coinciden. Prueba otro tamaño de pieza.`,
      );
    }
    if (String(st.ans ?? "").trim() === "")
      return bad(
        "empty",
        "Type how many groups fit. Part of a group counts.",
        "Escribe cuántos grupos caben. Una parte de un grupo también cuenta.",
      );
    const t = G.value(st.ans);
    if (Number.isNaN(t))
      return bad(
        "format",
        "Write the answer as a whole number, a fraction, or a mixed number.",
        "Escribe la respuesta como número entero, fracción o número mixto.",
      );
    const want = val(m.quo);
    if (Math.abs(t - want) < 1e-9) return { ok: true };
    const D = pcs(m.a, u);
    const V = pcs(m.b, u);
    if (Math.abs(t - D) < 1e-9)
      return bad(
        "pieces",
        "You counted the pieces in the amount. A group is made of several pieces here, so count groups, not pieces.",
        "Contaste las piezas de la cantidad. Aquí un grupo tiene varias piezas, así que cuenta grupos, no piezas.",
      );
    if (Math.abs(t - V / D) < 1e-9)
      return bad(
        "flipped",
        "You compared the other way round. Ask how much of ONE group the amount fills, not how much of the amount a group fills.",
        "Comparaste al revés. Pregunta qué parte de UN grupo llena la cantidad, no qué parte de la cantidad llena un grupo.",
      );
    if (Math.abs(t - val(m.a) * val(m.b)) < 1e-9)
      return bad(
        "multiplied",
        "That multiplies the two fractions. Dividing asks how many groups of the divisor fit.",
        "Eso multiplica las dos fracciones. Dividir pregunta cuántos grupos del divisor caben.",
      );
    if (Math.abs(t - Math.floor(want)) < 1e-9 && want !== Math.floor(want))
      return bad(
        "leftover",
        "The pieces that are left over are part of one more group. Say what part of a group they fill.",
        "Las piezas que sobran son parte de un grupo más. Di qué parte de un grupo llenan.",
      );
    return bad(
      "count",
      "Compare the number of pieces in the amount with the number of pieces in one group.",
      "Compara el número de piezas de la cantidad con el número de piezas de un grupo.",
    );
  }
  const solution = (/** @type {any} */ spec) => ({ u: spec.model.u0, ans: tx(spec.model.quo) });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const m = spec.model;
    const s = solution(spec);
    const off = UNITS.find((u) => !ok(m.a, u) || !ok(m.b, u)) || 7;
    /** @type {any[]} */
    const c = [
      { ...s, ans: String(m.D) },
      { ...s, ans: tx(rf(m.V, m.D)) },
      { ...s, u: off },
      { ...s, ans: "" },
      { ...s, ans: tx(rf(m.a[0] * m.b[0], m.a[1] * m.b[1])) },
      { ...s, ans: String(Math.floor(val(m.quo))) },
      { u: 0, ans: "" },
    ];
    return c.filter((st) => !grade(spec, st).ok);
  }

  const CSS = `
.su-bars{display:grid;gap:8px}
.su-bar{display:grid;height:44px;border:3px solid var(--ink,#1B2733);border-radius:10px;overflow:hidden;background:var(--surface,#fff)}
.su-pc{border-left:1px solid var(--brand-line,#BBCADA)}
.su-pc:first-child{border-left:0}
.su-pc.on{background:color-mix(in srgb,var(--sun,#F0BD4F) 80%,var(--surface,#fff))}
.su-pc.g{background:color-mix(in srgb,var(--brand,#2C4A68) 45%,var(--surface,#fff))}
.su-pc.part{background-image:repeating-linear-gradient(45deg,transparent 0 5px,var(--bad,#B42318) 5px 6px);outline:2px dashed var(--bad,#B42318);outline-offset:-3px}
@media (forced-colors:active){.su-bar{border-color:CanvasText}.su-pc.on,.su-pc.g{background:Highlight}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const K = A.kit;
    const m = spec.model;
    K.mount(host, spec, api, {
      kind: "sameunit",
      css: CSS,
      def,
      okEn: "You rewrote both fractions in the same unit and compared the groups.",
      okEs: "Escribiste las dos fracciones en la misma unidad y comparaste los grupos.",
      init: (/** @type {any} */ b) => ({ u: Number(b.u || 0), ans: String(b.ans ?? "") }),
      render(/** @type {any} */ c) {
        const { st, T, L, el, view } = c;
        const head = el("div", "k-big", `${tx(m.a)} ÷ ${tx(m.b)} = ?`);
        const pick = K.box("Choose the size of one piece", "Elige el tamaño de una pieza");
        const chips = el("div", "k-chips", "", { role: "group" });
        for (const u of m.opts)
          chips.append(
            K.btn(
              `1/${u}`,
              "",
              () => {
                st.u = u;
                c.change(`u${u}`);
              },
              {
                pressed: st.u === u,
                key: `u${u}`,
                label: `${L("Pieces of size one", "Piezas de tamaño uno")} ${nm(u, c.es() ? 1 : 0)} (1/${u})`,
              },
            ),
          );
        pick.append(chips);
        const draw = (/** @type {number[]} */ f, /** @type {string} */ cls) => {
          const bars = el("div", "su-bars", "", { "aria-hidden": "true" });
          const whole = Math.max(1, Math.ceil(val(f)));
          for (let w = 0; w < whole; w++) {
            const row = el("div", "su-bar");
            row.style.gridTemplateColumns = `repeat(${st.u},1fr)`;
            const x = Math.max(0, Math.min(1, val(f) - w));
            for (let i = 0; i < st.u; i++) {
              const pc = el("span", "su-pc");
              if ((i + 1) / st.u <= x + 1e-9) pc.classList.add(cls);
              else if (i / st.u < x - 1e-9) pc.classList.add("part");
              row.append(pc);
            }
            bars.append(row);
          }
          return bars;
        };
        const sketch = K.box("The bars", "Las barras");
        if (st.u) {
          sketch.append(
            el("span", "k-note", T("The amount", "La cantidad")),
            draw(m.a, "on"),
            el("span", "k-note", T("One group (the divisor)", "Un grupo (el divisor)")),
            draw(m.b, "g"),
          );
          if (ok(m.a, st.u) && ok(m.b, st.u))
            sketch.append(
              el(
                "p",
                "k-note",
                T(
                  `The amount is ${pcs(m.a, st.u)} pieces. One group is ${pcs(m.b, st.u)} pieces.`,
                  `La cantidad es ${pcs(m.a, st.u)} piezas. Un grupo es ${pcs(m.b, st.u)} piezas.`,
                ),
              ),
            );
        } else
          sketch.append(
            el(
              "p",
              "k-note",
              T(
                "Choose a piece size to see the bars.",
                "Elige un tamaño de pieza para ver las barras.",
              ),
            ),
          );
        const ansBox = K.box(
          "How many groups fit? (a whole number, a fraction, or both)",
          "¿Cuántos grupos caben? (un entero, una fracción o ambos)",
        );
        const row = el("div", "k-row");
        row.append(
          el("span", "k-big", `${tx(m.a)} ÷ ${tx(m.b)} =`),
          K.field(
            st.ans,
            L(
              "Groups that fit, as a number or fraction",
              "Grupos que caben, como número o fracción",
            ),
            (/** @type {string} */ v) => {
              st.ans = v;
              c.st.ans = v;
              if (api.change) api.change(K.clone(st));
              c.fb.hidden = true;
            },
            { key: "ans", mode: "text" },
          ),
        );
        ansBox.append(row);
        view.append(head, pick, sketch, ansBox);
      },
    });
  }

  const def = {
    title: "Same-unit bars",
    titleEs: "Barras con la misma unidad",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("sameunit", def);
})();

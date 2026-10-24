/**
 * Practice Studio activity: factorbox (window.StudioAct kind "factorbox", lesson 6-14).
 * Factor the box. An expression like 28a + 42 is the area of a box cut into pieces. The student picks the HEIGHT of the box
 * (the number pulled out of every term). A height that does not divide every term leaves a piece that is not a whole number
 * of units. A common factor that is not the greatest is valid but leaves widths that are "still factorable". Only the
 * greatest common factor (the same number lesson 6-7 finds) leaves widths with nothing more to pull out.
 * State: { h: the box height, w: the widths typed for each term (text), }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const VARS = ["a", "b", "n", "x", "m", "k", "t", "p"];
  const gcdAll = (/** @type {number[]} */ xs) => xs.reduce((g, x) => G.gcd(g, x), 0);
  const divs = (/** @type {number} */ n) =>
    [...Array(n)].map((_, i) => i + 1).filter((d) => n % d === 0);
  /** "2a + 3" from coefficients and the variable of each term ("" for a plain number) */
  const show = (/** @type {number[]} */ cs, /** @type {string[]} */ vars) =>
    cs.map((c, i) => (vars[i] ? `${c === 1 ? "" : c}${vars[i]}` : String(c))).join(" + ");

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    for (let t = 0; t < 2000; t++) {
      const v = rng.pick(VARS);
      const v2 = rng.pick(VARS.filter((x) => x !== v));
      const three = level === 4;
      const g = rng.pick(
        level === 1
          ? [4, 6, 9, 10]
          : level === 2
            ? [12, 14, 15, 18, 8, 10]
            : level === 3
              ? [12, 14, 16, 18, 20, 21, 24]
              : [6, 8, 9, 10, 12, 14, 15],
      );
      const ms = three
        ? [rng.int(2, 6), rng.int(1, 6), rng.int(2, 8)]
        : [rng.int(level === 3 ? 1 : 2, 7), rng.int(2, 9)];
      if (gcdAll(ms) !== 1) continue;
      if (new Set(ms).size !== ms.length) continue;
      const cs = ms.map((m) => g * m);
      if (cs.some((c) => c > 150)) continue;
      const vars = three ? [v, v2, ""] : [v, ""];
      const expr = show(cs, vars);
      const common = divs(g);
      const cand = new Set(common);
      for (const d of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24])
        if (cand.size < 9 && cs.some((c) => c % d === 0) && !common.includes(d)) cand.add(d);
      const opts = [...cand].sort((x, y) => x - y).slice(0, 9);
      if (!opts.includes(g)) opts.push(g);
      opts.sort((x, y) => x - y);
      return {
        q: `The expression ${expr} is the area of a box. Choose the height of the box, the number that comes out of every term. Pick the height that leaves nothing more to pull out, then write what is left inside the parentheses.`,
        qEs: `La expresión ${expr} es el área de una caja. Elige la altura de la caja, el número que sale de cada término. Elige la altura que no deja nada más por sacar y luego escribe lo que queda dentro del paréntesis.`,
        x: `The greatest common factor of ${cs.join(", ")} is ${g}, so ${expr} = ${g}(${show(ms, vars)}). A smaller common factor also works, but it leaves widths that still share a factor. This is the same greatest common factor you find in lesson 6-7.`,
        xEs: `El máximo común divisor de ${cs.join(", ")} es ${g}, así que ${expr} = ${g}(${show(ms, vars)}). Un factor común más pequeño también sirve, pero deja anchos que todavía comparten un factor. Es el mismo máximo común divisor que hallas en la lección 6-7.`,
        h: [
          "The height has to divide every term evenly. Test a number on each term.",
          "Pull out a number, then look at the widths that are left. Do the widths share a factor?",
          "The best height is the greatest common factor of all the terms.",
        ],
        hEs: [
          "La altura tiene que dividir exactamente cada término. Prueba un número en cada término.",
          "Saca un número y luego mira los anchos que quedan. ¿Los anchos comparten un factor?",
          "La mejor altura es el máximo común divisor de todos los términos.",
        ],
        model: { vars, cs, g, ms, opts, expr, level },
      };
    }
    throw new Error(`factorbox: no task for L${level}`);
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
    const h = Number(st.h || 0);
    if (!h)
      return bad(
        "empty",
        "Choose the height of the box first.",
        "Primero elige la altura de la caja.",
      );
    const bits = m.cs.filter((/** @type {number} */ c) => c % h !== 0);
    if (bits.length)
      return bad(
        "not-common",
        `A box this tall does not fit ${bits.length > 1 ? "some of the terms" : `the ${bits[0]}`}: it leaves a piece that is not a whole number of units. The height must divide every term.`,
        `Una caja de esta altura no cabe ${bits.length > 1 ? "en algunos términos" : `en el ${bits[0]}`}: deja un pedazo que no es un número entero de unidades. La altura debe dividir cada término.`,
      );
    if (h === 1)
      return bad(
        "height-one",
        "A height of 1 works, but it pulls nothing out of the terms. Look for a taller box that still fits every term.",
        "Una altura de 1 sirve, pero no saca nada de los términos. Busca una caja más alta que todavía quepa en cada término.",
      );
    if (h !== m.g)
      return bad(
        "still-factorable",
        "That height fits every term, but the widths that are left still share a factor. They are still factorable, so a taller box fits.",
        "Esa altura cabe en todos los términos, pero los anchos que quedan todavía comparten un factor. Todavía se pueden factorizar, así que cabe una caja más alta.",
      );
    const w = (st.w || []).map((/** @type {string} */ x) => String(x ?? "").trim());
    if (
      w.length < m.ms.length ||
      w.slice(0, m.ms.length).some((/** @type {string} */ x) => x === "")
    )
      return bad(
        "empty",
        "Write the widths that are left inside the parentheses.",
        "Escribe los anchos que quedan dentro del paréntesis.",
      );
    const marks = m.ms.map(
      (/** @type {number} */ k, /** @type {number} */ i) => G.value(w[i]) === k,
    );
    const right = marks.filter(Boolean).length;
    if (right === marks.length) return { ok: true, right, of: marks.length, marks };
    return bad(
      "widths",
      "You found the right height. Check each width: divide the term by the height.",
      "Encontraste la altura correcta. Revisa cada ancho: divide el término entre la altura.",
      { right, of: marks.length, marks },
    );
  }
  const solution = (/** @type {any} */ spec) => ({ h: spec.model.g, w: spec.model.ms.map(String) });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const m = spec.model;
    const s = solution(spec);
    const small = divs(m.g).find((d) => d > 1 && d < m.g);
    const notCommon = m.opts.find((/** @type {number} */ d) =>
      m.cs.some((/** @type {number} */ c) => c % d !== 0),
    );
    /** @type {any[]} */
    const c = [
      { h: 0, w: [] },
      { h: 1, w: m.cs.map(String) },
      { ...s, h: notCommon || m.g + 1 },
      { ...s, w: s.w.map((/** @type {string} */ x) => (Number(x) + 1).toString()) },
      { ...s, w: [] },
    ];
    if (small) c.push({ h: small, w: m.cs.map((/** @type {number} */ x) => String(x / small)) });
    return c.filter((st) => !grade(spec, st).ok);
  }

  const CSS = `
.fb-box{display:grid;gap:0;border:3px solid var(--ink,#1B2733);border-radius:8px;overflow:hidden;max-width:440px}
.fb-part{display:flex;align-items:center;justify-content:center;min-height:56px;border-left:2px solid var(--ink,#1B2733);font-weight:800;padding:4px;text-align:center;background:color-mix(in srgb,var(--sun,#F0BD4F) 70%,var(--surface,#fff))}
.fb-part:first-child{border-left:0}
.fb-part.bad{background-image:repeating-linear-gradient(45deg,transparent 0 5px,var(--bad,#B42318) 5px 6px)}
.fb-eq{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:1.3rem;font-weight:800}
@media (forced-colors:active){.fb-box,.fb-part{border-color:CanvasText}.fb-part{background:Canvas}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const K = A.kit;
    const m = spec.model;
    K.mount(host, spec, api, {
      kind: "factorbox",
      css: CSS,
      def,
      okEn: "You pulled out the greatest common factor and wrote the widths.",
      okEs: "Sacaste el máximo común divisor y escribiste los anchos.",
      init: (/** @type {any} */ b) => ({
        h: Number(b.h || 0),
        w: Array.isArray(b.w) ? b.w.map(String) : [],
      }),
      render(/** @type {any} */ c) {
        const { st, T, L, el, view } = c;
        const head = el("div", "k-big", m.expr);
        const pick = K.box("Choose the height of the box", "Elige la altura de la caja");
        const chips = el("div", "k-chips", "", { role: "group" });
        for (const d of m.opts)
          chips.append(
            K.btn(
              String(d),
              "",
              () => {
                st.h = d;
                c.change(`h${d}`);
              },
              { pressed: st.h === d, key: `h${d}`, label: `${L("Height", "Altura")} ${d}` },
            ),
          );
        pick.append(chips);
        const bx = K.box("The box", "La caja");
        if (st.h) {
          const parts = el("div", "fb-box", "", {
            role: "img",
            "aria-label": L(
              `A box of height ${st.h} cut into one piece for each term`,
              `Una caja de altura ${st.h} cortada en una pieza por cada término`,
            ),
          });
          parts.style.gridTemplateColumns = `repeat(${m.cs.length},1fr)`;
          m.cs.forEach((/** @type {number} */ cc, /** @type {number} */ i) => {
            const fit = cc % st.h === 0;
            const label = m.vars[i] ? `${cc}${m.vars[i]}` : `${cc}`;
            const p = el(
              "div",
              `fb-part${fit ? "" : " bad"}`,
              fit ? `${label}<br><small>${st.h} × ${cc / st.h}${m.vars[i]}</small>` : label,
            );
            parts.append(p);
          });
          bx.append(parts);
          if (m.cs.some((/** @type {number} */ cc) => cc % st.h !== 0))
            bx.append(
              el(
                "p",
                "k-note",
                T(
                  "A hatched piece is not a whole number of units tall.",
                  "Una pieza rayada no tiene una altura de un número entero de unidades.",
                ),
              ),
            );
        } else
          bx.append(
            el(
              "p",
              "k-note",
              T("Choose a height to cut the box.", "Elige una altura para cortar la caja."),
            ),
          );
        const ans = K.box("Write the factored form", "Escribe la forma factorizada");
        const row = el("div", "fb-eq");
        row.append(el("span", "", `${m.expr} = ${st.h || "?"}(`));
        m.ms.forEach((/** @type {number} */ _k, /** @type {number} */ i) => {
          const mk = c.mark(i);
          const wrap = el("span", `k-row${mk.cls}`);
          wrap.append(
            K.field(
              st.w[i] ?? "",
              `${L("Width", "Ancho")} ${i + 1}${m.vars[i] ? ` ${L("(times", "(por")} ${m.vars[i]})` : ""}`,
              (/** @type {string} */ v) => {
                st.w[i] = v;
                c.fb.hidden = true;
                if (api.change) api.change(K.clone(st));
              },
              { key: `w${i}` },
            ),
          );
          if (m.vars[i]) wrap.append(el("span", "", m.vars[i]));
          if (mk.html) wrap.insertAdjacentHTML("beforeend", mk.html);
          row.append(wrap);
          if (i < m.ms.length - 1) row.append(el("span", "", "+"));
        });
        row.append(el("span", "", ")"));
        ans.append(row);
        view.append(head, pick, bx, ans);
      },
    });
  }

  const def = {
    title: "Factor the box",
    titleEs: "Factoriza la caja",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("factorbox", def);
})();

/**
 * Practice Studio activity: impostor (window.StudioAct kind "impostor"), lesson 9-3 "Impostor row".
 * A table follows a rule such as y = 7x, except for one row. The student taps a row to test it against the rule, then says
 * which row is the impostor. A row that fits shows "7 × 3 = 21, it matches". The impostor shows only that the table and the
 * rule disagree; the corrected value is never printed.
 * State: { pick: number | null }.
 * Contract: docs/specs/practice-studio-v2.md section 5; feedback shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = () => A.kit;

  // [x name, y name, Spanish x, Spanish y]
  const CONTEXTS = [
    ["crates", "cartons", "cajas", "cartones"],
    ["hours", "miles", "horas", "millas"],
    ["packs", "pencils", "paquetes", "lápices"],
    ["minutes", "words typed", "minutos", "palabras escritas"],
    ["days", "liters of water", "días", "litros de agua"],
    ["tickets", "dollars", "boletos", "dólares"],
    ["rows", "seats", "filas", "asientos"],
    ["boxes", "books", "cajas", "libros"],
  ];
  const r2 = (/** @type {number} */ v) => Math.round(v * 100) / 100;

  function make(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ _p) {
    const k = K();
    const kind = lv === 3 ? rng.pick(["add", "mul"]) : "mul";
    const dec = lv >= 3 && kind === "mul" && rng.chance(0.6);
    const rate =
      kind === "add"
        ? rng.int(2, 15)
        : dec
          ? rng.pick([0.5, 1.5, 2.5, 3.5, 4.5])
          : rng.int(2, lv === 4 ? 15 : 9);
    const rowsN = lv === 4 ? 6 : 5;
    const xs =
      lv === 1
        ? [1, 2, 3, 4, 5]
        : rng
            .shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12])
            .slice(0, rowsN)
            .sort((a, b) => a - b);
    const f = (/** @type {number} */ x) => r2(kind === "add" ? x + rate : rate * x);
    const bad = rng.int(0, rowsN - 1);
    const x0 = xs[bad];
    const good = f(x0);
    const tries = [];
    if (kind === "mul")
      tries.push(good + rate, good - rate, r2(x0 + rate), good + 1, good - 1, good * 2);
    else tries.push(good + 1, good - 1, r2(x0 * rate), good + rate, good + 10);
    const wrongs = [...new Set(tries.map(r2))].filter(
      (v) => v > 0 && v !== good && !xs.some((x) => f(x) === v && x !== x0),
    );
    const y0 = rng.pick(wrongs.length ? wrongs : [good + 2]);
    const rows = xs.map((x, i) => ({ x, y: i === bad ? y0 : f(x) }));
    const ctx = rng.pick(CONTEXTS);
    const rule = kind === "add" ? `y = x + ${k.n(rate)}` : `y = ${k.n(rate)}x`;
    return {
      ...k.pack({
        q: `A table shows how many ${ctx[1]} go with ${ctx[0]}. It follows the rule ${rule}, except for one row. Tap a row to test it. Then choose the impostor, the row that does not fit the rule. ¦ Una tabla muestra cuántos ${ctx[3]} van con ${ctx[2]}. Sigue la regla ${rule}, excepto una fila. Toca una fila para probarla. Luego elige al impostor, la fila que no cumple la regla.`,
        x: `Every row but one is what the rule gives. The impostor is the row whose y-value is not ${kind === "add" ? "the x-value plus" : "the x-value times"} ${k.n(rate)}. ¦ Todas las filas menos una dan lo que da la regla. El impostor es la fila cuyo valor de y no es el valor de x ${kind === "add" ? "más" : "por"} ${k.n(rate)}.`,
        h: [
          "Pick one row. Put its x-value into the rule and work out y. ¦ Elige una fila. Pon su valor de x en la regla y calcula y.",
          "Compare your y-value with the y-value in the table. Do they match? ¦ Compara tu valor de y con el valor de y de la tabla. ¿Coinciden?",
          "Test the rows one at a time. Only one row will not match. ¦ Prueba las filas una por una. Solo una fila no coincidirá.",
        ],
      }),
      rule: { kind, k: rate, text: rule },
      ctx: { x: ctx[0], y: ctx[1], xEs: ctx[2], yEs: ctx[3] },
      rows,
      bad,
      model: { rule, kind },
    };
  }

  /** the test of one row, as numbers: "7 × 3" and its value */
  function expect(/** @type {any} */ spec, /** @type {number} */ i) {
    const k = K();
    const x = spec.rows[i].x;
    const r = spec.rule.k;
    const v = r2(spec.rule.kind === "add" ? x + r : r * x);
    return {
      work: spec.rule.kind === "add" ? `${k.n(x)} + ${k.n(r)}` : `${k.n(r)} × ${k.n(x)}`,
      v,
    };
  }
  const fits = (/** @type {any} */ spec, /** @type {number} */ i) =>
    expect(spec, i).v === spec.rows[i].y;

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const k = K();
    const pick = st && Number.isInteger(st.pick) ? st.pick : null;
    if (pick === null || pick < 0 || pick >= spec.rows.length)
      return k.miss(
        "incomplete",
        "Tap the row you think does not fit, then check. ¦ Toca la fila que crees que no cumple y luego comprueba.",
      );
    if (pick === spec.bad) return { ok: true, ...k.parts([true]) };
    const e = expect(spec, pick);
    return k.miss(
      "row-fits",
      `Row ${pick + 1}: ${e.work} = ${k.n(e.v)}, and the table says ${k.n(spec.rows[pick].y)}. That row fits the rule. Test the other rows. ¦ Fila ${pick + 1}: ${e.work} = ${k.n(e.v)}, y la tabla dice ${k.n(spec.rows[pick].y)}. Esa fila cumple la regla. Prueba las otras filas.`,
      k.parts([false]),
    );
  }

  const CSS = `
.ak-impostor .im-rows{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.ak-impostor .im-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;font-size:1.15rem;flex-direction:row}
.ak-impostor .im-head{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-weight:800;color:var(--brand,#2C4A68);text-align:center}
.ak-impostor .im-test{font-weight:800}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("impostor", CSS);
    const k = K();
    const c = k.start(host, spec, api, "impostor");
    const { T } = c;
    const sv = c.saved || (c.solved ? { pick: spec.bad } : {});
    const st = { pick: Number.isInteger(sv.pick) ? sv.pick : null };
    const head = A.el(
      "div",
      "im-head",
      `<span>${T(`${spec.ctx.x} (x)`, `${spec.ctx.xEs} (x)`)}</span><span>${T(`${spec.ctx.y} (y)`, `${spec.ctx.yEs} (y)`)}</span>`,
    );
    const list = A.el("ul", "im-rows");
    const btns = spec.rows.map((/** @type {any} */ r, /** @type {number} */ i) => {
      const li = A.el("li");
      const b = A.el(
        "button",
        "ak-chip im-row",
        `<span>${k.n(r.x)}</span><span>${k.n(r.y)}</span>`,
        { type: "button" },
      );
      c.label(
        b,
        `Row ${i + 1}: x is ${k.n(r.x)}, y is ${k.n(r.y)}. Test this row.`,
        `Fila ${i + 1}: x es ${k.n(r.x)}, y es ${k.n(r.y)}. Probar esta fila.`,
      );
      b.addEventListener("click", () => {
        if (c.solved) return;
        st.pick = st.pick === i ? null : i;
        c.verdict = null;
        c.emit(st);
        draw();
      });
      li.append(b);
      list.append(li);
      return b;
    });
    const out = A.el("p", "ak-box im-test", "", { "aria-live": "polite" });
    c.body.append(
      A.el("p", "ak-box", `<b>${T("Rule", "Regla")}:</b> ${spec.rule.text}`),
      head,
      list,
      out,
    );
    function draw() {
      const marks = c.marks();
      btns.forEach((b, i) => {
        b.setAttribute("aria-pressed", String(st.pick === i));
        b.disabled = c.solved;
        b.classList.toggle("ak-mark-bad", !!marks && st.pick === i && marks[0] === false);
      });
      if (st.pick === null) {
        out.innerHTML = T(
          "Tap a row to test it against the rule.",
          "Toca una fila para probarla con la regla.",
        );
      } else {
        const e = expect(spec, st.pick);
        const row = spec.rows[st.pick];
        out.innerHTML = fits(spec, st.pick)
          ? `${e.work} = ${k.n(e.v)}. ${T("The table says", "La tabla dice")} ${k.n(row.y)}. ${T("It matches.", "Coincide.")}`
          : `${T("The rule and the table do not match for this row.", "La regla y la tabla no coinciden en esta fila.")} ${T(`Does ${e.work} equal ${k.n(row.y)}? No.`, `¿${e.work} es igual a ${k.n(row.y)}? No.`)}`;
      }
      c.checkBtn.textContent = "";
      c.checkBtn.innerHTML = T("This row is the impostor", "Esta fila es el impostor");
      c.checkBtn.disabled = st.pick === null;
      c.clearBtn.disabled = st.pick === null;
    }
    c.redraws.push(draw);
    c.wire(
      () => st,
      () => {
        st.pick = null;
        c.emit(st);
      },
    );
    draw();
  }

  A.register("impostor", {
    title: "Impostor row",
    titleEs: "La fila impostora",
    levels: 4,
    make,
    solution: (/** @type {any} */ spec) => ({ pick: spec.bad }),
    wrong(/** @type {any} */ spec, _rng) {
      const others = spec.rows
        .map((/** @type {any} */ _r, /** @type {number} */ i) => i)
        .filter((/** @type {number} */ i) => i !== spec.bad);
      return [{ pick: others[0] }, { pick: others[others.length - 1] }, { pick: null }];
    },
    grade,
    mount,
  });
})();

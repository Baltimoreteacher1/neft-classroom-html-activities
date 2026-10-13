/* Math Workbench — percent/decimal grid, decimal area model, balance scale.
 * Registered through wb-core.js. None of these states an answer: they are
 * models the student shades, fills in or tests. */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  const M = root.WBMath;
  if (!MWB || !M) return;
  const { h, svg } = MWB;

  /* ======================= Hundred / decimal grid ======================= */
  const SIZE = 10;
  const CELL = 26;
  const emptyCells = () => "0".repeat(SIZE * SIZE);
  const countOn = (cells) => [...cells].filter((c) => c === "1").length;

  function hundredLabel(o) {
    const n = countOn(o.cells || "");
    return o.mode === "decimal"
      ? `Decimal grid, ${n} hundredths shaded`
      : `Percent grid, ${n} of 100 squares shaded`;
  }

  function buildHundredGrid(o, ctx) {
    if (typeof o.cells !== "string" || o.cells.length !== SIZE * SIZE) o.cells = emptyCells();
    if (o.mode !== "decimal") o.mode = "percent";
    if (typeof o.whole !== "string") o.whole = "";
    const wrap = h("div", { class: "wbx toolobj wbx-hundred" });
    const title = h(
      "p",
      { class: "wbx-title" },
      o.mode === "decimal"
        ? MWB.t("Decimal grid", "Cuadrícula decimal")
        : MWB.t("Percent grid", "Cuadrícula de porcentaje"),
    );
    const whole = MWB.textField(
      o.whole,
      MWB.t("What is the whole?", "¿Cuál es el entero?"),
      (inp) => {
        o.whole = inp.value.slice(0, 40);
        ctx.pushHistory();
      },
      130,
    );
    whole.placeholder = MWB.t("the whole is…", "el entero es…");
    const read = h("p", { class: "wbx-read", "aria-live": "polite" });
    const hint = h(
      "p",
      { class: "wbx-live" },
      MWB.t(
        "Click or drag to shade. Keys: arrows move, Space shades, C column, R row.",
        "Haz clic o arrastra para sombrear. Teclas: flechas, Espacio, C columna, R fila.",
      ),
    );
    const clear = MWB.btn(
      MWB.t("Clear", "Borrar"),
      MWB.t("Clear the grid", "Borrar la cuadrícula"),
      () => {
        o.cells = emptyCells();
        paint();
        ctx.pushHistory();
      },
    );
    const view = svg("svg", {
      viewBox: `0 0 ${SIZE * CELL + 4} ${SIZE * CELL + 4}`,
      width: SIZE * CELL + 4,
      height: SIZE * CELL + 4,
      role: "application",
      tabindex: "0",
      "aria-label": MWB.t(
        "Grid of 100 squares. Use arrow keys and Space to shade.",
        "Cuadrícula de 100 cuadrados. Usa las flechas y Espacio para sombrear.",
      ),
    });
    let cursor = 0;
    const cursorRect = svg("rect", { class: "wbx-cursor", width: CELL, height: CELL, rx: 3 });

    function paint() {
      view.textContent = "";
      for (let i = 0; i < SIZE * SIZE; i++) {
        const r = Math.floor(i / SIZE);
        const c = i % SIZE;
        view.appendChild(
          svg("rect", {
            class: "cell",
            x: 2 + c * CELL,
            y: 2 + r * CELL,
            width: CELL,
            height: CELL,
            fill: o.cells[i] === "1" ? "rgba(32,95,166,.62)" : "#fff",
            stroke: "#205fa6",
            "stroke-width": c % SIZE === 0 || r % SIZE === 0 ? 1.6 : 1,
          }),
        );
      }
      // tenths guides: heavier lines every row/column make the 10 x 10 structure visible
      view.appendChild(
        svg("rect", {
          x: 2,
          y: 2,
          width: SIZE * CELL,
          height: SIZE * CELL,
          fill: "none",
          stroke: "#14223a",
          "stroke-width": 2,
          "pointer-events": "none",
        }),
      );
      view.appendChild(cursorRect);
      moveCursor(cursor);
      const n = countOn(o.cells);
      read.textContent =
        o.mode === "decimal"
          ? `${n} ${MWB.t("hundredths shaded", "centésimos sombreados")} · 0.${String(n).padStart(2, "0")}`.replace(
              "0.100",
              "1.00",
            )
          : `${n} ${MWB.t("out of 100 shaded", "de 100 sombreados")} · ${n}%`;
      if (n === 100 && o.mode === "decimal")
        read.textContent = `100 ${MWB.t("hundredths shaded", "centésimos sombreados")} · 1.00`;
      view.setAttribute(
        "aria-label",
        `${hundredLabel(o)}. ${MWB.t("Use arrow keys and Space to shade.", "Usa las flechas y Espacio para sombrear.")}`,
      );
    }
    function moveCursor(i) {
      cursor = Math.max(0, Math.min(SIZE * SIZE - 1, i));
      cursorRect.setAttribute("x", 2 + (cursor % SIZE) * CELL);
      cursorRect.setAttribute("y", 2 + Math.floor(cursor / SIZE) * CELL);
    }
    const set = (i, on) => {
      o.cells = o.cells.slice(0, i) + (on ? "1" : "0") + o.cells.slice(i + 1);
    };
    const indexAt = (e) => {
      const r = view.getBoundingClientRect();
      const c = Math.floor(((e.clientX - r.left) / r.width) * (SIZE * CELL + 4) - 2) / CELL;
      const rr = Math.floor(((e.clientY - r.top) / r.height) * (SIZE * CELL + 4) - 2) / CELL;
      const col = Math.floor(c);
      const row = Math.floor(rr);
      return col < 0 || col >= SIZE || row < 0 || row >= SIZE ? -1 : row * SIZE + col;
    };
    let painting = null; // null | boolean (the state being painted)
    view.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      const i = indexAt(e);
      if (i < 0) return;
      painting = o.cells[i] !== "1";
      set(i, painting);
      moveCursor(i);
      try {
        view.setPointerCapture(e.pointerId);
      } catch (_) {}
      paint();
    });
    view.addEventListener("pointermove", (e) => {
      if (painting === null) return;
      const i = indexAt(e);
      if (i >= 0 && (o.cells[i] === "1") !== painting) {
        set(i, painting);
        moveCursor(i);
        paint();
      }
    });
    const endPaint = () => {
      if (painting === null) return;
      painting = null;
      ctx.pushHistory();
    };
    view.addEventListener("pointerup", endPaint);
    view.addEventListener("pointercancel", endPaint);
    view.addEventListener("keydown", (e) => {
      e.stopPropagation();
      const k = e.key;
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -SIZE, ArrowDown: SIZE }[k];
      if (step) {
        e.preventDefault();
        const next = cursor + step;
        const wraps =
          (step === -1 && cursor % SIZE === 0) || (step === 1 && cursor % SIZE === SIZE - 1);
        if (!wraps && next >= 0 && next < SIZE * SIZE) moveCursor(next);
        if (e.shiftKey) {
          set(cursor, true);
          paint();
          ctx.pushHistory();
        } else moveCursor(cursor);
      } else if (k === " " || k === "Enter") {
        e.preventDefault();
        set(cursor, o.cells[cursor] !== "1");
        paint();
        ctx.pushHistory();
      } else if (k === "c" || k === "C" || k === "r" || k === "R") {
        e.preventDefault();
        const col = k.toLowerCase() === "c";
        const idxs = [];
        for (let t = 0; t < SIZE; t++)
          idxs.push(col ? t * SIZE + (cursor % SIZE) : Math.floor(cursor / SIZE) * SIZE + t);
        const allOn = idxs.every((i) => o.cells[i] === "1");
        idxs.forEach((i) => set(i, !allOn));
        paint();
        ctx.pushHistory();
      }
    });
    wrap.append(h("div", { class: "wbx-head" }, title, whole, clear), view, read, hint);
    paint();
    return wrap;
  }

  /* ======================= Decimal area model ======================= */
  /** Split a decimal string into place-value parts: "12.34" -> [10, 2, 0.3, 0.04]. */
  function placeParts(text) {
    const s = String(text).trim();
    const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(s);
    if (!m) return null;
    const parts = [];
    const whole = m[1];
    for (let i = 0; i < whole.length; i++) {
      const d = Number(whole[i]);
      if (d) parts.push(d * 10 ** (whole.length - 1 - i));
    }
    const frac = m[2] || "";
    for (let i = 0; i < frac.length; i++) {
      const d = Number(frac[i]);
      if (d) parts.push(Number((d / 10 ** (i + 1)).toFixed(i + 1)));
    }
    return parts.length ? parts : [0];
  }

  function buildDecimalArea(o, ctx) {
    if (typeof o.a !== "string") o.a = "1.2";
    if (typeof o.b !== "string") o.b = "0.3";
    if (!o.cells || typeof o.cells !== "object") o.cells = {};
    if (typeof o.total !== "string") o.total = "";
    const wrap = h("div", { class: "wbx toolobj wbx-decarea" });
    const live = MWB.live(wrap);
    const body = h("div", { class: "wbx-decbody" });
    const a = MWB.textField(
      o.a,
      MWB.t("First factor", "Primer factor"),
      (inp) => change("a", inp),
      70,
    );
    const b = MWB.textField(
      o.b,
      MWB.t("Second factor", "Segundo factor"),
      (inp) => change("b", inp),
      70,
    );
    function change(key, inp) {
      if (!placeParts(inp.value)) {
        inp.value = o[key];
        live(
          MWB.t(
            "Use a number with up to 2 decimal places, like 1.2 or 0.35.",
            "Usa un número con hasta 2 decimales, como 1.2 o 0.35.",
          ),
        );
        return;
      }
      o[key] = inp.value.trim();
      o.cells = {};
      render();
      ctx.pushHistory();
    }
    function render() {
      body.textContent = "";
      const rows = placeParts(o.a);
      const cols = placeParts(o.b);
      const table = h("table", {
        class: "wbx-dectable",
        role: "grid",
        "aria-label": MWB.t(
          "Area model for the two factors",
          "Modelo de área para los dos factores",
        ),
      });
      const head = h("tr", null, h("th", { scope: "col" }, "×"));
      for (const c of cols) head.appendChild(h("th", { scope: "col" }, String(c)));
      table.appendChild(h("thead", null, head));
      const tb = h("tbody");
      rows.forEach((rv, ri) => {
        const tr = h("tr", null, h("th", { scope: "row" }, String(rv)));
        cols.forEach((cv, ci) => {
          const key = `${ri}_${ci}`;
          const input = h("input", {
            type: "text",
            class: "wbx-txt",
            value: o.cells[key] || "",
            "aria-label": `${rv} × ${cv}`,
            placeholder: `${rv} × ${cv}`,
          });
          MWB.guard(input);
          input.style.width = "86px";
          input.addEventListener("change", () => {
            o.cells[key] = input.value.slice(0, 12);
            ctx.pushHistory();
          });
          tr.appendChild(h("td", null, input));
        });
        tb.appendChild(tr);
      });
      table.appendChild(tb);
      body.appendChild(table);
      const total = MWB.textField(
        o.total,
        MWB.t("Total of the partial products", "Total de los productos parciales"),
        (inp) => {
          o.total = inp.value.slice(0, 16);
          ctx.pushHistory();
        },
        110,
      );
      total.placeholder = MWB.t("total", "total");
      body.appendChild(
        h(
          "div",
          { class: "wbx-row" },
          h("span", { class: "wbx-title" }, MWB.t("Total", "Total")),
          total,
        ),
      );
      ctx.updateObjEl(o);
    }
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, MWB.t("Decimal area model", "Modelo de área decimal")),
        a,
        h("span", null, "×"),
        b,
      ),
      body,
    );
    render();
    return wrap;
  }

  /* ======================= Balance scale ======================= */
  const MAX_X = 9;
  const MAX_ONE = 30;

  const clampPan = (p) => ({
    x: Math.max(0, Math.min(MAX_X, Math.round(Number(p && p.x) || 0))),
    one: Math.max(0, Math.min(MAX_ONE, Math.round(Number(p && p.one) || 0))),
  });
  function normBalance(o) {
    o.left = clampPan(o.left || { x: 1, one: 2 });
    o.right = clampPan(o.right || { x: 0, one: 8 });
    return o;
  }

  function buildBalance(o, ctx) {
    normBalance(o);
    if (typeof o.test !== "string") o.test = "";
    const wrap = h("div", { class: "wbx toolobj wbx-balance" });
    const eq = h("p", { class: "wbx-read", "aria-live": "polite" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const stage = h("div", { class: "wbx-balstage" });
    const test = MWB.textField(
      o.test,
      MWB.t("Test a value for x", "Prueba un valor para x"),
      (inp) => {
        o.test = inp.value.slice(0, 10);
        draw();
        ctx.pushHistory();
      },
      70,
    );
    test.placeholder = "x = ?";

    function blocks(p, side) {
      const g = svg("g");
      let col = 0;
      for (let i = 0; i < p.x; i++) {
        g.appendChild(
          svg("rect", {
            x: col * 30,
            y: 0,
            width: 26,
            height: 26,
            rx: 5,
            fill: "#cfe3f7",
            stroke: "#205fa6",
            "stroke-width": 2,
          }),
        );
        g.appendChild(
          svg(
            "text",
            {
              x: col * 30 + 13,
              y: 18,
              "text-anchor": "middle",
              "font-weight": 900,
              "font-size": 15,
              fill: "#17487f",
            },
            "x",
          ),
        );
        col++;
        if (col === 5) col = 0;
      }
      const rowStart = p.x ? Math.ceil(p.x / 5) : 0;
      for (let i = 0; i < p.one; i++) {
        const r = rowStart + Math.floor(i / 6);
        const c = i % 6;
        g.appendChild(
          svg("rect", {
            x: c * 22,
            y: r * 30 + (p.x ? 4 : 0),
            width: 18,
            height: 18,
            rx: 3,
            fill: "#fde9b8",
            stroke: "#d97706",
            "stroke-width": 1.6,
          }),
        );
      }
      g.setAttribute("data-side", side);
      return g;
    }

    function draw() {
      const tx = M.parseRate(o.test);
      const tilt = M.balanceTilt(o, tx);
      const ang = tilt === "level" ? 0 : tilt === "left" ? -7 : 7;
      eq.textContent = M.balanceText(o);
      const W = 360;
      const s = svg("svg", {
        viewBox: `0 0 ${W} 190`,
        width: W,
        height: 190,
        role: "img",
        "aria-label": `${MWB.t("Balance scale", "Balanza")}: ${M.balanceText(o)}. ${tilt === "level" ? MWB.t("Level.", "Nivelada.") : MWB.t(`Tips ${tilt}.`, `Se inclina a la ${tilt === "left" ? "izquierda" : "derecha"}.`)}`,
      });
      s.appendChild(svg("polygon", { points: "180,70 164,170 196,170", fill: "#8aa0bd" }));
      s.appendChild(svg("rect", { x: 130, y: 168, width: 100, height: 8, rx: 3, fill: "#5b6b82" }));
      const beam = svg("g", { transform: `rotate(${ang} 180 70)` });
      beam.appendChild(
        svg("rect", { x: 30, y: 64, width: 300, height: 8, rx: 4, fill: "#14223a" }),
      );
      const panY = 72;
      const left = svg("g", { transform: `translate(34 ${panY}) rotate(${-ang} 0 0)` });
      const right = svg("g", { transform: `translate(326 ${panY}) rotate(${-ang} 0 0)` });
      for (const [g, p] of [
        [left, o.left],
        [right, o.right],
      ]) {
        g.appendChild(
          svg("line", { x1: 0, y1: 0, x2: -52, y2: 52, stroke: "#5b6b82", "stroke-width": 2 }),
        );
        g.appendChild(
          svg("line", { x1: 0, y1: 0, x2: 52, y2: 52, stroke: "#5b6b82", "stroke-width": 2 }),
        );
        g.appendChild(
          svg("rect", { x: -56, y: 52, width: 112, height: 6, rx: 3, fill: "#5b6b82" }),
        );
        const bg = blocks(p, g === left ? "left" : "right");
        // blocks sit on top of the pan plate
        bg.setAttribute(
          "transform",
          `translate(-52 ${52 - Math.max(1, Math.ceil(p.x / 5) + Math.ceil(p.one / 6)) * 17 - 2}) scale(.6)`,
        );
        g.appendChild(bg);
      }
      beam.append(left, right);
      s.appendChild(beam);
      stage.textContent = "";
      stage.appendChild(s);
      live.textContent =
        Number.isFinite(tx) && o.test.trim()
          ? tilt === "level"
            ? MWB.t(
                `With x = ${o.test.trim()} both sides are equal.`,
                `Con x = ${o.test.trim()} los dos lados son iguales.`,
              )
            : MWB.t(
                `With x = ${o.test.trim()} the ${tilt} side is heavier.`,
                `Con x = ${o.test.trim()} el lado ${tilt === "left" ? "izquierdo" : "derecho"} pesa más.`,
              )
          : MWB.t(
              "The scale shows the equation. Test a value for x to see if it balances.",
              "La balanza muestra la ecuación. Prueba un valor de x para ver si se equilibra.",
            );
      ctx.updateObjEl(o);
    }

    const change = (side, key, d) => {
      const p = o[side];
      const max = key === "x" ? MAX_X : MAX_ONE;
      const next = p[key] + d;
      if (next < 0 || next > max) {
        live.textContent = MWB.t("That is as far as this scale goes.", "La balanza no puede más.");
        return;
      }
      p[key] = next;
      draw();
      ctx.pushHistory();
    };
    const sideControls = (side, name, nameEs) =>
      h(
        "div",
        { class: "wbx-row", role: "group", "aria-label": MWB.t(name, nameEs) },
        h("span", { class: "wbx-title", style: { minWidth: "64px" } }, MWB.t(name, nameEs)),
        MWB.btn(
          "+x",
          MWB.t(
            `Add an x block to the ${name.toLowerCase()}`,
            `Añadir un bloque x a la ${nameEs.toLowerCase()}`,
          ),
          () => change(side, "x", 1),
        ),
        MWB.btn(
          "−x",
          MWB.t(
            `Remove an x block from the ${name.toLowerCase()}`,
            `Quitar un bloque x de la ${nameEs.toLowerCase()}`,
          ),
          () => change(side, "x", -1),
        ),
        MWB.btn(
          "+1",
          MWB.t(
            `Add a 1 block to the ${name.toLowerCase()}`,
            `Añadir un bloque 1 a la ${nameEs.toLowerCase()}`,
          ),
          () => change(side, "one", 1),
        ),
        MWB.btn(
          "−1",
          MWB.t(
            `Remove a 1 block from the ${name.toLowerCase()}`,
            `Quitar un bloque 1 de la ${nameEs.toLowerCase()}`,
          ),
          () => change(side, "one", -1),
        ),
      );
    const doBoth = (op, say) => {
      const next = M.balanceOp(o, op);
      if (!next) {
        live.textContent = MWB.t(
          "That move does not work with these blocks.",
          "Ese movimiento no funciona con estos bloques.",
        );
        return;
      }
      o.left = next.left;
      o.right = next.right;
      draw();
      ctx.pushHistory();
      live.textContent = say;
    };
    const both = h(
      "div",
      {
        class: "wbx-row",
        role: "group",
        "aria-label": MWB.t("Do the same to both sides", "Hacer lo mismo en los dos lados"),
      },
      MWB.btn("+1 ⇄", MWB.t("Add 1 to both sides", "Sumar 1 a los dos lados"), () =>
        doBoth("add1", MWB.t("Added 1 to both sides.", "Se sumó 1 a los dos lados.")),
      ),
      MWB.btn("−1 ⇄", MWB.t("Subtract 1 from both sides", "Restar 1 de los dos lados"), () =>
        doBoth("sub1", MWB.t("Took 1 from both sides.", "Se quitó 1 de los dos lados.")),
      ),
      MWB.btn(
        "+x ⇄",
        MWB.t("Add an x block to both sides", "Sumar un bloque x a los dos lados"),
        () =>
          doBoth(
            "addx",
            MWB.t("Added an x block to both sides.", "Se sumó un bloque x a los dos lados."),
          ),
      ),
      MWB.btn(
        "−x ⇄",
        MWB.t("Take an x block from both sides", "Quitar un bloque x de los dos lados"),
        () =>
          doBoth(
            "subx",
            MWB.t("Took an x block from both sides.", "Se quitó un bloque x de los dos lados."),
          ),
      ),
      MWB.btn(
        "÷2 ⇄",
        MWB.t("Split both sides into 2 equal groups", "Dividir los dos lados en 2 grupos iguales"),
        () =>
          doBoth(
            "half",
            MWB.t(
              "Split both sides into 2 equal groups.",
              "Se dividieron los dos lados en 2 grupos iguales.",
            ),
          ),
      ),
      MWB.btn("×2 ⇄", MWB.t("Double both sides", "Duplicar los dos lados"), () =>
        doBoth("double", MWB.t("Doubled both sides.", "Se duplicaron los dos lados.")),
      ),
    );
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, MWB.t("Balance scale", "Balanza")),
        h("span", { class: "wbx-title" }, MWB.t("test", "probar")),
        test,
      ),
      eq,
      stage,
      h(
        "div",
        { class: "wbx-baltwo" },
        sideControls("left", "Left side", "Lado izquierdo"),
        sideControls("right", "Right side", "Lado derecho"),
      ),
      both,
      live,
    );
    draw();
    return wrap;
  }

  /* ======================= registration ======================= */
  const ICON = {
    hundred:
      '<svg viewBox="0 0 90 70" width="84" height="64" aria-hidden="true"><g fill="none" stroke="#205fa6" stroke-width="1.2">' +
      Array.from(
        { length: 11 },
        (_, i) =>
          `<line x1="${10 + i * 7}" y1="8" x2="${10 + i * 7}" y2="64"/><line x1="10" y1="${8 + i * 5.6}" x2="80" y2="${8 + i * 5.6}"/>`,
      ).join("") +
      '</g><rect x="10" y="8" width="28" height="22.4" fill="rgba(32,95,166,.45)"/></svg>',
    decarea:
      '<svg viewBox="0 0 90 70" width="84" height="64" aria-hidden="true"><g fill="none" stroke="#205fa6" stroke-width="2"><rect x="12" y="10" width="66" height="48"/><line x1="48" y1="10" x2="48" y2="58"/><line x1="12" y1="30" x2="78" y2="30"/></g><text x="22" y="24" font-size="9" font-weight="800" fill="#14223a">0.2×0.3</text></svg>',
    balance:
      '<svg viewBox="0 0 90 70" width="84" height="64" aria-hidden="true"><polygon points="45,22 38,62 52,62" fill="#8aa0bd"/><rect x="8" y="20" width="74" height="5" rx="2" fill="#14223a"/><rect x="10" y="38" width="26" height="4" fill="#5b6b82"/><rect x="54" y="38" width="26" height="4" fill="#5b6b82"/><rect x="14" y="28" width="9" height="9" fill="#cfe3f7" stroke="#205fa6"/><rect x="60" y="30" width="7" height="7" fill="#fde9b8" stroke="#d97706"/></svg>',
  };

  MWB.register("hundredgrid", {
    model: true,
    label: hundredLabel,
    build: buildHundredGrid,
    explain: {
      shows:
        "A square cut into 100 equal parts. Each small square is 1 out of 100, which is 1 percent or 0.01.",
      shows_es:
        "Un cuadrado dividido en 100 partes iguales. Cada cuadrito es 1 de 100, que es 1 por ciento o 0.01.",
      words: ["percent", "per 100", "whole", "part", "hundredth"],
      tryThis: [
        "Shade some squares and say what fraction of the whole is shaded. Then say it as a percent.",
        "Name the whole in the box. What changes if the whole is a different amount?",
        "Shade 25 squares in two different shapes. Do they show the same percent? Explain why.",
      ],
    },
  });
  MWB.register("balance", {
    model: true,
    label: (o) => `Balance scale: ${M.balanceText(normBalance(o))}`,
    build: buildBalance,
    explain: {
      shows:
        "Two sides of an equation. A box marked x is a mystery amount; each 1 block is one unit. Doing the same thing to both sides keeps the scale balanced.",
      shows_es:
        "Los dos lados de una ecuación. Un bloque x es una cantidad desconocida; cada bloque 1 es una unidad. Hacer lo mismo en los dos lados mantiene la balanza equilibrada.",
      words: ["equation", "equal", "variable", "both sides", "balance"],
      tryThis: [
        "Write the equation the scale shows. What does each side mean?",
        "Do the same move to both sides. Why does the scale stay balanced?",
        "Test a value for x. How do you know if it makes both sides equal?",
      ],
    },
  });
  MWB.register("decarea", {
    model: true,
    label: (o) => `Decimal area model: ${o.a} times ${o.b}`,
    build: buildDecimalArea,
    explain: {
      shows:
        "A rectangle split by place value. Each box is one partial product: a part of the first number times a part of the second.",
      shows_es:
        "Un rectángulo dividido por valor posicional. Cada casilla es un producto parcial: una parte del primer número por una parte del segundo.",
      words: ["factor", "product", "place value", "partial product", "decimal"],
      tryThis: [
        "Fill each box with its partial product. How did you find each one?",
        "Add the boxes. Does the total make sense? Estimate first to check.",
      ],
    },
  });

  MWB.addPalette({
    section: "Percent, decimals & equations",
    key: "hundredgrid",
    name: "Percent grid",
    es: "Cuadrícula de %",
    svg: ICON.hundred,
    go: () => MWB.ctx.makeObject("hundredgrid", { mode: "percent" }),
  });
  MWB.addPalette({
    section: "Percent, decimals & equations",
    key: "decimalgrid",
    name: "Decimal grid",
    es: "Cuadrícula decimal",
    svg: ICON.hundred,
    go: () => MWB.ctx.makeObject("hundredgrid", { mode: "decimal" }),
  });
  MWB.addPalette({
    section: "Percent, decimals & equations",
    key: "decarea",
    name: "Decimal area model",
    es: "Área decimal",
    svg: ICON.decarea,
    go: () => MWB.ctx.makeObject("decarea", {}),
  });
  MWB.addPalette({
    section: "Percent, decimals & equations",
    key: "balance",
    name: "Balance scale",
    es: "Balanza",
    svg: ICON.balance,
    go: () => MWB.ctx.makeObject("balance", {}),
  });
})(window);

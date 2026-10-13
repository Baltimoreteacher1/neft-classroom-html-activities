/* Math Workbench — linked ratio set (table + double number line + graph +
 * equation that edit together) and plot-and-connect coordinate plane with a
 * y = mx plotter. The tools show the relationship; they never state a unit
 * rate, a distance for a slanted segment, or the answer to the student's task. */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  const M = root.WBMath;
  if (!MWB || !M) return;
  const { h, svg } = MWB;
  const t = MWB.t;

  const fmt = (n) => String(Math.round(n * 1000) / 1000);

  /* ======================= Linked ratio set ======================= */
  const VIEWS = [
    ["table", "Table", "Tabla"],
    ["line", "Double number line", "Doble recta numérica"],
    ["graph", "Graph", "Gráfica"],
    ["words", "Equation and words", "Ecuación y palabras"],
  ];

  function buildLinkedRatio(o, ctx) {
    const pos = (v, d) => (Number.isFinite(v) && v > 0 && v <= 999 ? v : d);
    o.a = pos(o.a, 2);
    o.b = pos(o.b, 3);
    if (!Array.isArray(o.ks) || o.ks.length < 2 || o.ks.length > 6) o.ks = [1, 2, 3, 4];
    o.ks = o.ks.map((k) => pos(Number(k), 1));
    if (typeof o.la !== "string") o.la = "";
    if (typeof o.lb !== "string") o.lb = "";
    if (!o.show || typeof o.show !== "object")
      o.show = { table: true, line: true, graph: true, words: true };
    const wrap = h("div", { class: "wbx toolobj wbx-linked" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const body = h("div", { class: "wbx-lkbody" });
    const viewBar = h("div", {
      class: "wbx-row",
      role: "group",
      "aria-label": t("Show or hide a representation", "Mostrar u ocultar una representación"),
    });

    const baseA = MWB.numField(
      o.a,
      t("First quantity for one group", "Primera cantidad de un grupo"),
      { min: 1, max: 999, step: "any" },
      (i) => setBase("a", i),
    );
    const baseB = MWB.numField(
      o.b,
      t("Second quantity for one group", "Segunda cantidad de un grupo"),
      { min: 1, max: 999, step: "any" },
      (i) => setBase("b", i),
    );
    function setBase(key, i) {
      const v = Number(i.value);
      if (!(v > 0 && v <= 999)) {
        i.value = o[key];
        live.textContent = t(
          "Use a number from 0 to 999 that is greater than 0.",
          "Usa un número mayor que 0 y hasta 999.",
        );
        return;
      }
      o[key] = v;
      render();
      ctx.pushHistory();
    }
    const la = MWB.textField(
      o.la,
      t("Name of the first quantity", "Nombre de la primera cantidad"),
      (i) => {
        o.la = i.value.slice(0, 18);
        render();
        ctx.pushHistory();
      },
      90,
    );
    la.placeholder = t("e.g. cups", "p. ej. tazas");
    const lb = MWB.textField(
      o.lb,
      t("Name of the second quantity", "Nombre de la segunda cantidad"),
      (i) => {
        o.lb = i.value.slice(0, 18);
        render();
        ctx.pushHistory();
      },
      90,
    );
    lb.placeholder = t("e.g. batches", "p. ej. lotes");

    function setCell(row, j, i) {
      const v = Number(i.value);
      if (!(v > 0 && v <= 9999)) {
        i.value = fmt((row === 0 ? o.a : o.b) * o.ks[j]);
        live.textContent = t("Type a number greater than 0.", "Escribe un número mayor que 0.");
        return;
      }
      o.ks[j] = v / (row === 0 ? o.a : o.b);
      render();
      ctx.pushHistory();
      live.textContent = t(
        "The other representations changed to match.",
        "Las otras representaciones cambiaron para coincidir.",
      );
    }

    function tableView() {
      const tb = h("table", {
        class: "wbx-lktable",
        "aria-label": t("Ratio table", "Tabla de razones"),
      });
      const mk = (row, label) => {
        const tr = h("tr", null, h("th", { scope: "row" }, label));
        o.ks.forEach((k, j) => {
          const inp = MWB.textField(
            fmt((row === 0 ? o.a : o.b) * k),
            `${label} ${j + 1}`,
            (i) => setCell(row, j, i),
            62,
          );
          inp.classList.add(row === 0 ? "top" : "bottom");
          tr.appendChild(h("td", null, inp));
        });
        tb.appendChild(tr);
      };
      mk(0, o.la || t("first", "primera"));
      mk(1, o.lb || t("second", "segunda"));
      const cols = h(
        "div",
        { class: "wbx-row" },
        MWB.btn("+ column", t("Add a column", "Añadir una columna"), () => {
          if (o.ks.length >= 6) return;
          o.ks.push(Math.max(...o.ks) + 1);
          render();
          ctx.pushHistory();
        }),
        MWB.btn("− column", t("Remove the last column", "Quitar la última columna"), () => {
          if (o.ks.length <= 2) return;
          o.ks.pop();
          render();
          ctx.pushHistory();
        }),
      );
      return h("div", null, tb, cols);
    }

    function lineView() {
      const max = Math.max(...o.ks);
      const W = 380;
      const pad = 36;
      const s = svg("svg", {
        viewBox: `0 0 ${W} 110`,
        width: W,
        height: 110,
        role: "img",
        "aria-label": t("Double number line", "Doble recta numérica"),
      });
      const X = (k) => pad + (k / max) * (W - pad * 2);
      for (const [y, base, col, lab] of [
        [34, o.a, "#205fa6", o.la],
        [78, o.b, "#2c7d6b", o.lb],
      ]) {
        s.appendChild(
          svg("line", {
            x1: pad - 8,
            y1: y,
            x2: W - pad + 8,
            y2: y,
            stroke: col,
            "stroke-width": 3,
          }),
        );
        s.appendChild(
          svg("text", { x: 4, y: y - 12, "font-size": 11, "font-weight": 800, fill: col }, lab),
        );
        s.appendChild(
          svg("line", { x1: X(0), y1: y - 8, x2: X(0), y2: y + 8, stroke: col, "stroke-width": 2 }),
        );
        s.appendChild(
          svg(
            "text",
            {
              x: X(0),
              y: y + 22,
              "text-anchor": "middle",
              "font-size": 11,
              "font-weight": 800,
              fill: col,
            },
            "0",
          ),
        );
        for (const k of o.ks) {
          s.appendChild(
            svg("line", {
              x1: X(k),
              y1: y - 8,
              x2: X(k),
              y2: y + 8,
              stroke: col,
              "stroke-width": 2,
            }),
          );
          s.appendChild(
            svg(
              "text",
              {
                x: X(k),
                y: y + 22,
                "text-anchor": "middle",
                "font-size": 11,
                "font-weight": 800,
                fill: col,
              },
              fmt(base * k),
            ),
          );
        }
      }
      for (const k of o.ks)
        s.appendChild(
          svg("line", {
            x1: X(k),
            y1: 34,
            x2: X(k),
            y2: 78,
            stroke: "#90a4bd",
            "stroke-width": 1.2,
            "stroke-dasharray": "3 3",
          }),
        );
      return s;
    }

    function graphView() {
      const maxA = Math.max(...o.ks.map((k) => o.a * k));
      const maxB = Math.max(...o.ks.map((k) => o.b * k));
      const W = 260;
      const H = 220;
      const padL = 40;
      const padB = 30;
      const s = svg("svg", {
        viewBox: `0 0 ${W} ${H}`,
        width: W,
        height: H,
        role: "img",
        "aria-label": t("Graph of the ratio relationship", "Gráfica de la relación de razón"),
      });
      const X = (v) => padL + (v / maxA) * (W - padL - 16);
      const Y = (v) => H - padB - (v / maxB) * (H - padB - 16);
      s.appendChild(
        svg("line", {
          x1: padL,
          y1: H - padB,
          x2: W - 8,
          y2: H - padB,
          stroke: "#14223a",
          "stroke-width": 2,
        }),
      );
      s.appendChild(
        svg("line", {
          x1: padL,
          y1: H - padB,
          x2: padL,
          y2: 8,
          stroke: "#14223a",
          "stroke-width": 2,
        }),
      );
      s.appendChild(
        svg(
          "text",
          {
            x: W / 2,
            y: H - 6,
            "text-anchor": "middle",
            "font-size": 11,
            "font-weight": 800,
            fill: "#205fa6",
          },
          o.la || t("first quantity", "primera cantidad"),
        ),
      );
      s.appendChild(
        svg(
          "text",
          { x: 10, y: 12, "font-size": 11, "font-weight": 800, fill: "#2c7d6b" },
          o.lb || t("second quantity", "segunda cantidad"),
        ),
      );
      s.appendChild(
        svg("line", {
          x1: X(0),
          y1: Y(0),
          x2: X(maxA),
          y2: Y((maxA / o.a) * o.b),
          stroke: "#d97706",
          "stroke-width": 2,
        }),
      );
      s.appendChild(
        svg(
          "text",
          { x: padL - 4, y: H - padB + 14, "text-anchor": "end", "font-size": 10, fill: "#33485f" },
          "0",
        ),
      );
      for (const k of o.ks) {
        s.appendChild(
          svg("circle", {
            cx: X(o.a * k),
            cy: Y(o.b * k),
            r: 4.5,
            fill: "#fff",
            stroke: "#17487f",
            "stroke-width": 2,
          }),
        );
        s.appendChild(
          svg(
            "text",
            {
              x: X(o.a * k),
              y: H - padB + 14,
              "text-anchor": "middle",
              "font-size": 10,
              fill: "#33485f",
            },
            fmt(o.a * k),
          ),
        );
        s.appendChild(
          svg(
            "text",
            {
              x: padL - 4,
              y: Y(o.b * k) + 3,
              "text-anchor": "end",
              "font-size": 10,
              fill: "#33485f",
            },
            fmt(o.b * k),
          ),
        );
      }
      return s;
    }

    function wordsView() {
      const eq = o.ks.map((k) => `${fmt(o.a * k)}:${fmt(o.b * k)}`).join(" = ");
      return h(
        "div",
        null,
        h("p", { class: "wbx-read" }, eq),
        h(
          "p",
          { class: "wbx-live" },
          t(
            `For every ${fmt(o.a)} ${o.la || "of the first"}, there are ${fmt(o.b)} ${o.lb || "of the second"}.`,
            `Por cada ${fmt(o.a)} ${o.la || "de la primera"}, hay ${fmt(o.b)} ${o.lb || "de la segunda"}.`,
          ),
        ),
      );
    }

    function render() {
      body.textContent = "";
      viewBar
        .querySelectorAll("button")
        .forEach((b) => b.setAttribute("aria-pressed", String(!!o.show[b.dataset.v])));
      if (o.show.table) body.appendChild(tableView());
      if (o.show.line) body.appendChild(lineView());
      if (o.show.graph) body.appendChild(graphView());
      if (o.show.words) body.appendChild(wordsView());
      ctx.updateObjEl(o);
    }
    for (const [k, en, es] of VIEWS) {
      const b = MWB.btn(
        t(en, es),
        t(`Show or hide the ${en.toLowerCase()}`, `Mostrar u ocultar: ${es.toLowerCase()}`),
        () => {
          o.show[k] = !o.show[k];
          render();
          ctx.pushHistory();
        },
      );
      b.dataset.v = k;
      viewBar.appendChild(b);
    }
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("Linked ratio set", "Razones vinculadas")),
        h("span", { class: "wbx-title" }, t("for every", "por cada")),
        baseA,
        la,
        h("span", { class: "wbx-title" }, t("there are", "hay")),
        baseB,
        lb,
      ),
      viewBar,
      body,
      live,
    );
    render();
    return wrap;
  }

  /* ======================= Plot and connect ======================= */
  const NAMES = "ABCDEFGHIJKL";
  function buildPlot(o, ctx) {
    o.range = [5, 8, 10, 12].includes(o.range) ? o.range : 5;
    if (!Array.isArray(o.points)) o.points = [];
    o.points = o.points.filter((p) => Number.isInteger(p.x) && Number.isInteger(p.y)).slice(0, 12);
    if (!["none", "open", "closed"].includes(o.connect)) o.connect = "none";
    if (typeof o.func !== "object" || !o.func) o.func = { on: false, m: "2", table: false };
    const wrap = h("div", { class: "wbx toolobj wbx-plot" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const list = h("ul", {
      class: "wbx-plist",
      "aria-label": t("Plotted points", "Puntos marcados"),
    });
    const stage = h("div", { class: "wbx-plstage" });
    const SIZE = 330;
    let kx = 0;
    let ky = 0; // keyboard cursor in grid units
    let drag = null;

    const N = () => o.range;
    const unit = () => (SIZE - 24) / (2 * N());
    const sx = (x) => SIZE / 2 + x * unit();
    const sy = (y) => SIZE / 2 - y * unit();
    const nameOf = (i) => NAMES[i] || String(i + 1);
    const snapPt = (e, rect) => {
      const gx = Math.round((((e.clientX - rect.left) / rect.width) * SIZE - SIZE / 2) / unit());
      const gy = Math.round((SIZE / 2 - ((e.clientY - rect.top) / rect.height) * SIZE) / unit());
      return [Math.max(-N(), Math.min(N(), gx)), Math.max(-N(), Math.min(N(), gy))];
    };
    function addPoint(x, y) {
      const at = o.points.findIndex((p) => p.x === x && p.y === y);
      if (at >= 0) {
        o.points.splice(at, 1);
        live.textContent = t("Point removed.", "Punto quitado.");
      } else if (o.points.length >= 12) {
        live.textContent = t("That is the most points (12).", "Ese es el máximo de puntos (12).");
        return;
      } else {
        o.points.push({ x, y });
        live.textContent = t(
          `Point ${nameOf(o.points.length - 1)} at (${x}, ${y}) — ${M.quadrant(x, y)}.`,
          `Punto ${nameOf(o.points.length - 1)} en (${x}, ${y}) — ${M.quadrant(x, y)}.`,
        );
      }
      draw();
      ctx.pushHistory();
    }

    function draw() {
      const n = N();
      const s = svg("svg", {
        viewBox: `0 0 ${SIZE} ${SIZE}`,
        width: SIZE,
        height: SIZE,
        role: "application",
        tabindex: "0",
        "aria-label": t(
          `Coordinate plane from ${-n} to ${n}. Arrow keys move the cursor, Enter plots or removes a point.`,
          `Plano de coordenadas de ${-n} a ${n}. Las flechas mueven el cursor, Enter marca o quita un punto.`,
        ),
      });
      for (let i = -n; i <= n; i++) {
        s.appendChild(
          svg("line", {
            x1: sx(i),
            y1: sy(-n),
            x2: sx(i),
            y2: sy(n),
            stroke: i === 0 ? "#14223a" : "rgba(32,95,166,.22)",
            "stroke-width": i === 0 ? 2.4 : 1,
          }),
        );
        s.appendChild(
          svg("line", {
            x1: sx(-n),
            y1: sy(i),
            x2: sx(n),
            y2: sy(i),
            stroke: i === 0 ? "#14223a" : "rgba(32,95,166,.22)",
            "stroke-width": i === 0 ? 2.4 : 1,
          }),
        );
        if (i !== 0 && (n <= 8 || i % 2 === 0)) {
          s.appendChild(
            svg(
              "text",
              {
                x: sx(i),
                y: sy(0) + 13,
                "text-anchor": "middle",
                "font-size": 9,
                "font-weight": 700,
                fill: "#33485f",
              },
              String(i),
            ),
          );
          s.appendChild(
            svg(
              "text",
              {
                x: sx(0) - 5,
                y: sy(i) + 3,
                "text-anchor": "end",
                "font-size": 9,
                "font-weight": 700,
                fill: "#33485f",
              },
              String(i),
            ),
          );
        }
      }
      if (o.func.on) {
        const m = M.parseRate(o.func.m);
        if (Number.isFinite(m)) {
          const y1 = Math.max(-n, Math.min(n, m * -n));
          const y2 = Math.max(-n, Math.min(n, m * n));
          const clipX = (y) => (m === 0 ? 0 : y / m);
          const xa = m === 0 ? -n : Math.max(-n, Math.min(n, clipX(y1)));
          const xb = m === 0 ? n : Math.max(-n, Math.min(n, clipX(y2)));
          s.appendChild(
            svg("line", {
              x1: sx(xa),
              y1: sy(m * xa),
              x2: sx(xb),
              y2: sy(m * xb),
              stroke: "#d97706",
              "stroke-width": 2.4,
            }),
          );
          for (let x = -n; x <= n; x++) {
            const y = m * x;
            if (Number.isInteger(y) && Math.abs(y) <= n)
              s.appendChild(svg("circle", { cx: sx(x), cy: sy(y), r: 3, fill: "#d97706" }));
          }
        }
      }
      if (o.connect !== "none" && o.points.length > 1) {
        const pts = o.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");
        s.appendChild(
          svg(o.connect === "closed" && o.points.length > 2 ? "polygon" : "polyline", {
            points: pts,
            fill: o.connect === "closed" ? "rgba(32,95,166,.12)" : "none",
            stroke: "#17487f",
            "stroke-width": 2.4,
            "stroke-linejoin": "round",
          }),
        );
      }
      o.points.forEach((p, i) => {
        const g = svg("g", {
          class: "wbx-pt",
          tabindex: "0",
          role: "button",
          "aria-label": t(
            `Point ${nameOf(i)} at (${p.x}, ${p.y}), ${M.quadrant(p.x, p.y)}. Arrow keys move it, Delete removes it.`,
            `Punto ${nameOf(i)} en (${p.x}, ${p.y}), ${M.quadrant(p.x, p.y)}. Las flechas lo mueven, Supr lo quita.`,
          ),
          "data-i": i,
        });
        g.appendChild(
          svg("circle", {
            cx: sx(p.x),
            cy: sy(p.y),
            r: 6,
            fill: "#fff",
            stroke: "#17487f",
            "stroke-width": 2.5,
          }),
        );
        g.appendChild(
          svg(
            "text",
            {
              x: sx(p.x) + 8,
              y: sy(p.y) - 8,
              "font-size": 12,
              "font-weight": 900,
              fill: "#17487f",
            },
            nameOf(i),
          ),
        );
        s.appendChild(g);
      });
      s.appendChild(
        svg("rect", {
          class: "wbx-cursor",
          x: sx(kx) - 8,
          y: sy(ky) - 8,
          width: 16,
          height: 16,
          rx: 3,
        }),
      );
      bind(s);
      stage.textContent = "";
      stage.appendChild(s);
      renderList();
      ctx.updateObjEl(o);
    }

    function bind(s) {
      s.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        const g = e.target.closest ? e.target.closest(".wbx-pt") : null;
        const rect = s.getBoundingClientRect();
        if (g) {
          e.preventDefault();
          startDrag(Number(g.dataset.i));
          return;
        }
        const [x, y] = snapPt(e, rect);
        kx = x;
        ky = y;
        addPoint(x, y);
      });
      // Dragging a point: listen on the window so releasing outside the plane still ends it,
      // and so redrawing the plane mid-drag does not drop the gesture.
      function startDrag(i) {
        drag = { i, moved: false };
        const rectNow = () => stage.querySelector("svg").getBoundingClientRect();
        const move = (e) => {
          const [x, y] = snapPt(e, rectNow());
          const p = o.points[i];
          if (p && (p.x !== x || p.y !== y)) {
            p.x = x;
            p.y = y;
            drag.moved = true;
            draw();
          }
        };
        const end = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", end);
          window.removeEventListener("pointercancel", end);
          const moved = drag && drag.moved;
          drag = null;
          if (moved) ctx.pushHistory();
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
      }
      s.addEventListener("keydown", (e) => {
        e.stopPropagation();
        const g = e.target.closest ? e.target.closest(".wbx-pt") : null;
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[
          e.key
        ];
        if (g) {
          const p = o.points[Number(g.dataset.i)];
          if (d && p) {
            e.preventDefault();
            p.x = Math.max(-N(), Math.min(N(), p.x + d[0]));
            p.y = Math.max(-N(), Math.min(N(), p.y + d[1]));
            draw();
            const again = stage.querySelector(`.wbx-pt[data-i="${g.dataset.i}"]`);
            if (again) again.focus();
            ctx.pushHistory();
          } else if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            o.points.splice(Number(g.dataset.i), 1);
            draw();
            ctx.pushHistory();
            stage.querySelector("svg").focus();
          }
          return;
        }
        if (d) {
          e.preventDefault();
          kx = Math.max(-N(), Math.min(N(), kx + d[0]));
          ky = Math.max(-N(), Math.min(N(), ky + d[1]));
          const c = s.querySelector(".wbx-cursor");
          c.setAttribute("x", sx(kx) - 8);
          c.setAttribute("y", sy(ky) - 8);
          live.textContent = `(${kx}, ${ky})`;
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          addPoint(kx, ky);
          stage.querySelector("svg").focus();
        }
      });
    }

    function renderList() {
      list.textContent = "";
      o.points.forEach((p, i) => {
        const li = h("li", null, `${nameOf(i)} (${p.x}, ${p.y}) · ${M.quadrant(p.x, p.y)}`);
        if (o.showSides && i > 0) {
          const q = o.points[i - 1];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const note =
            dx === 0 || dy === 0
              ? t(
                  `${nameOf(i - 1)}→${nameOf(i)}: length ${Math.abs(dx || dy)}`,
                  `${nameOf(i - 1)}→${nameOf(i)}: longitud ${Math.abs(dx || dy)}`,
                )
              : t(
                  `${nameOf(i - 1)}→${nameOf(i)}: across ${dx}, up ${dy}`,
                  `${nameOf(i - 1)}→${nameOf(i)}: horizontal ${dx}, vertical ${dy}`,
                );
          li.appendChild(h("span", { class: "wbx-live" }, ` — ${note}`));
        }
        list.appendChild(li);
      });
      if (o.func.on && o.func.table) {
        const m = M.parseRate(o.func.m);
        if (Number.isFinite(m))
          list.appendChild(
            h("li", null, [-2, -1, 0, 1, 2].map((x) => `(${x}, ${fmt(m * x)})`).join("  ")),
          );
      }
    }

    const toggle = (label, aria, key, obj) => {
      const b = MWB.btn(label, aria, () => {
        (obj || o)[key] = !(obj || o)[key];
        b.setAttribute("aria-pressed", String(!!(obj || o)[key]));
        draw();
        ctx.pushHistory();
      });
      b.setAttribute("aria-pressed", String(!!(obj || o)[key]));
      return b;
    };
    const conn = h("div", {
      class: "wbx-row",
      role: "group",
      "aria-label": t("Connect the points", "Conectar los puntos"),
    });
    for (const [k, en, es] of [
      ["none", "Points only", "Solo puntos"],
      ["open", "Connect in order", "Conectar en orden"],
      ["closed", "Close the shape", "Cerrar la figura"],
    ]) {
      const b = MWB.btn(t(en, es), t(en, es), () => {
        o.connect = k;
        conn
          .querySelectorAll("button")
          .forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.k === k)));
        draw();
        ctx.pushHistory();
      });
      b.dataset.k = k;
      b.setAttribute("aria-pressed", String(o.connect === k));
      conn.appendChild(b);
    }
    const rangeSel = h("select", {
      class: "wbx-txt",
      "aria-label": t("Size of the plane", "Tamaño del plano"),
    });
    for (const r of [5, 8, 10, 12])
      rangeSel.appendChild(h("option", { value: r, selected: r === o.range }, `−${r} … ${r}`));
    MWB.guard(rangeSel);
    rangeSel.addEventListener("change", () => {
      o.range = Number(rangeSel.value);
      o.points = o.points.filter((p) => Math.abs(p.x) <= o.range && Math.abs(p.y) <= o.range);
      kx = Math.max(-o.range, Math.min(o.range, kx));
      ky = Math.max(-o.range, Math.min(o.range, ky));
      draw();
      ctx.pushHistory();
    });
    const m = MWB.textField(
      o.func.m,
      t("Rate m in y = m x", "Razón m en y = m x"),
      (i) => {
        if (!Number.isFinite(M.parseRate(i.value))) {
          i.value = o.func.m;
          live.textContent = t(
            "Type a number or fraction, like 2 or 3/4.",
            "Escribe un número o fracción, como 2 o 3/4.",
          );
          return;
        }
        o.func.m = i.value.trim();
        draw();
        ctx.pushHistory();
      },
      60,
    );
    const clear = MWB.btn(
      t("Clear points", "Borrar puntos"),
      t("Remove all points", "Quitar todos los puntos"),
      () => {
        o.points = [];
        draw();
        ctx.pushHistory();
      },
    );
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("Plot & connect", "Marcar y conectar")),
        rangeSel,
        clear,
      ),
      stage,
      list,
      conn,
      h(
        "div",
        { class: "wbx-row" },
        toggle(
          t("Show side lengths", "Mostrar longitudes"),
          t("Show how far each side goes", "Mostrar cuánto mide cada lado"),
          "showSides",
        ),
        toggle("y = m x", t("Draw the line y = m x", "Dibujar la recta y = m x"), "on", o.func),
        h("span", { class: "wbx-title" }, "m ="),
        m,
        toggle(
          t("Table", "Tabla"),
          t("Show a small table of the line", "Mostrar una tabla de la recta"),
          "table",
          o.func,
        ),
      ),
      live,
    );
    draw();
    return wrap;
  }

  /* ======================= registration ======================= */
  const icon = (inner) =>
    `<svg viewBox="0 0 90 70" width="84" height="64" aria-hidden="true">${inner}</svg>`;
  MWB.register("linkedratio", {
    model: true,
    label: (o) => `Linked ratio set, for every ${o.a || 2} there are ${o.b || 3}`,
    build: buildLinkedRatio,
    explain: {
      shows:
        "One ratio shown four ways at once: a ratio table, a double number line, a graph and an equation. When you change a number in one, the others change to match.",
      shows_es:
        "Una razón mostrada de cuatro maneras a la vez: tabla de razones, doble recta numérica, gráfica y ecuación. Si cambias un número en una, las otras cambian para coincidir.",
      words: [
        "ratio",
        "equivalent ratios",
        "for every",
        "ratio table",
        "double number line",
        "graph",
      ],
      tryThis: [
        "Change one number in the table. What changes in the other pictures?",
        "Where do you see the same ratio in the table, the number line and the graph?",
        "What do all the equivalent ratios have in common?",
      ],
    },
  });
  MWB.register("plotgrid", {
    model: true,
    label: (o) => `Coordinate plane with ${(o.points || []).length} plotted points`,
    build: buildPlot,
    explain: {
      shows:
        "A coordinate plane. Click to plot a point; each point is an ordered pair (x, y). You can drag points, connect them into a shape, and draw a line y = m x.",
      shows_es:
        "Un plano de coordenadas. Haz clic para marcar un punto; cada punto es un par ordenado (x, y). Puedes arrastrar los puntos, conectarlos en una figura y dibujar una recta y = m x.",
      words: [
        "coordinate plane",
        "ordered pair",
        "x-coordinate",
        "y-coordinate",
        "quadrant",
        "origin",
        "axis",
      ],
      tryThis: [
        "Plot a point in each quadrant. What is true about the signs of x and y in each one?",
        "Connect points to make a shape. How could you find the length of a side?",
        "Draw y = m x for a value of m. What do you notice about the points on the line?",
      ],
    },
  });

  const S = "Ratios & graphs";
  MWB.addPalette({
    section: S,
    key: "linkedratio",
    name: "Linked ratio set",
    es: "Razones vinculadas",
    svg: icon(
      '<g fill="none" stroke="#205fa6" stroke-width="2"><rect x="8" y="10" width="40" height="18"/><line x1="28" y1="10" x2="28" y2="28"/><line x1="8" y1="19" x2="48" y2="19"/><line x1="8" y1="40" x2="48" y2="40"/><polyline points="58,62 58,36 82,62"/></g><circle cx="66" cy="50" r="2.5" fill="#d97706"/><circle cx="74" cy="56" r="2.5" fill="#d97706"/>',
    ),
    go: () => MWB.ctx.makeObject("linkedratio", {}),
  });
  MWB.addPalette({
    section: S,
    key: "plotgrid",
    name: "Plot & connect",
    es: "Marcar y conectar",
    svg: icon(
      '<g stroke="#14223a" stroke-width="2"><line x1="45" y1="6" x2="45" y2="64"/><line x1="8" y1="35" x2="82" y2="35"/></g><polygon points="58,18 72,28 66,48 52,40" fill="rgba(32,95,166,.2)" stroke="#17487f" stroke-width="2"/><g fill="#fff" stroke="#17487f" stroke-width="2"><circle cx="58" cy="18" r="3"/><circle cx="72" cy="28" r="3"/><circle cx="66" cy="48" r="3"/><circle cx="52" cy="40" r="3"/></g>',
    ),
    go: () => MWB.ctx.makeObject("plotgrid", {}),
  });
})(window);

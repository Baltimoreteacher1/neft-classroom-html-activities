/* Math Workbench — mean (balance point) and spread (MAD) overlay for the dot
 * plot and histogram. The student moves a balance point and watches the beam;
 * the numbers stay hidden until she asks to check her work. */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  const M = root.WBMath;
  if (!MWB || !M) return;
  const { h, svg } = MWB;
  const t = MWB.t;
  const fmt = (n) => String(Math.round(n * 100) / 100);

  /** Values behind the chart: dot plot counts, or histogram bin midpoints. */
  function dataFor(o) {
    if (o.type === "dotplot") return M.stats(o.counts).vals;
    const vals = [];
    for (const b of o.bins || []) {
      const m = /^\s*(-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(String(b.label));
      if (!m) continue;
      const mid = (Number(m[1]) + Number(m[2])) / 2;
      for (let i = 0; i < (b.freq || 0); i++) vals.push(mid);
    }
    return vals;
  }

  function panel(o, ctx) {
    const wrap = h("div", { class: "wbx wbx-stat" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const stage = h("div", { class: "wbx-statstage" });
    const vals = () => dataFor(o).sort((a, b) => a - b);
    const mode =
      o.statMode && typeof o.statMode === "object"
        ? o.statMode
        : (o.statMode = { balance: true, spread: false, numbers: false });

    function draw() {
      const v = vals();
      stage.textContent = "";
      if (!v.length) {
        live.textContent = t(
          "Add some data first, then come back to see the balance point.",
          "Agrega datos primero y vuelve para ver el punto de equilibrio.",
        );
        return;
      }
      const lo = Math.floor(Math.min(...v));
      const hi = Math.ceil(Math.max(...v));
      const span = Math.max(1, hi - lo);
      if (typeof o.guess !== "number" || o.guess < lo || o.guess > hi) o.guess = lo + span / 2;
      const W = 360;
      const pad = 24;
      const X = (n) => pad + ((n - lo) / span) * (W - pad * 2);
      const st = M.stats(v);
      const left = v.filter((x) => x < o.guess).reduce((a, x) => a + (o.guess - x), 0);
      const right = v.filter((x) => x > o.guess).reduce((a, x) => a + (x - o.guess), 0);
      const tilt = Math.abs(left - right) < 1e-9 ? 0 : left > right ? -6 : 6;
      const s = svg("svg", {
        viewBox: `0 0 ${W} 120`,
        width: W,
        height: 120,
        role: "img",
        "aria-label": t(
          "Data on a number line with a movable balance point",
          "Datos en una recta numérica con un punto de equilibrio móvil",
        ),
      });
      const axisY = 70;
      s.appendChild(
        svg("line", {
          x1: pad - 8,
          y1: axisY,
          x2: W - pad + 8,
          y2: axisY,
          stroke: "#14223a",
          "stroke-width": 2,
        }),
      );
      const stack = {};
      for (const x of v) {
        stack[x] = (stack[x] || 0) + 1;
        s.appendChild(
          svg("circle", { cx: X(x), cy: axisY - 8 - (stack[x] - 1) * 10, r: 4.2, fill: "#205fa6" }),
        );
      }
      for (let i = lo; i <= hi; i += Math.max(1, Math.ceil(span / 10))) {
        s.appendChild(
          svg(
            "text",
            {
              x: X(i),
              y: axisY + 14,
              "text-anchor": "middle",
              "font-size": 10,
              "font-weight": 700,
              fill: "#33485f",
            },
            String(i),
          ),
        );
      }
      if (mode.spread) {
        v.forEach((x, i) =>
          s.appendChild(
            svg("line", {
              x1: X(x),
              y1: axisY + 22 + (i % 5) * 4,
              x2: X(st.mean),
              y2: axisY + 22 + (i % 5) * 4,
              stroke: "#d97706",
              "stroke-width": 2,
              "stroke-linecap": "round",
            }),
          ),
        );
        s.appendChild(
          svg("line", {
            x1: X(st.mean),
            y1: axisY + 16,
            x2: X(st.mean),
            y2: axisY + 46,
            stroke: "#d97706",
            "stroke-width": 1.4,
            "stroke-dasharray": "3 3",
          }),
        );
      }
      if (mode.balance) {
        s.appendChild(
          svg("polygon", {
            points: `${X(o.guess)},${axisY + 4} ${X(o.guess) - 9},${axisY + 24} ${X(o.guess) + 9},${axisY + 24}`,
            fill: "#2c7d6b",
            stroke: "#205c4f",
            "stroke-width": 1.5,
          }),
        );
        s.appendChild(
          svg("line", {
            x1: X(lo) - 6,
            y1: 22 - tilt,
            x2: X(hi) + 6,
            y2: 22 + tilt,
            stroke: "#8aa0bd",
            "stroke-width": 3,
            "stroke-linecap": "round",
          }),
        );
      }
      stage.appendChild(s);
      if (mode.balance) {
        live.textContent =
          tilt === 0
            ? t("The data balance at this point.", "Los datos se equilibran en este punto.")
            : tilt < 0
              ? t(
                  "The left side is pulling harder. Try moving the balance point left.",
                  "El lado izquierdo pesa más. Prueba mover el punto de equilibrio a la izquierda.",
                )
              : t(
                  "The right side is pulling harder. Try moving the balance point right.",
                  "El lado derecho pesa más. Prueba mover el punto de equilibrio a la derecha.",
                );
      }
      if (mode.numbers) {
        const parts = [`${t("mean", "media")} = ${fmt(st.mean)}`];
        if (mode.spread)
          parts.push(
            `${t("mean absolute deviation", "desviación media absoluta")} = ${fmt(st.mad)}`,
          );
        live.textContent = `${live.textContent} ${parts.join(" · ")}`.trim();
      }
    }

    const slider = h("input", {
      type: "range",
      class: "wbx-range",
      "aria-label": t("Move the balance point", "Mover el punto de equilibrio"),
      min: "0",
      max: "100",
      step: "1",
      value: "50",
    });
    MWB.guard(slider);
    function syncSlider() {
      const v = vals();
      if (!v.length) return;
      const lo = Math.floor(Math.min(...v));
      const hi = Math.ceil(Math.max(...v));
      slider.min = String(lo * 4);
      slider.max = String(Math.max(hi, lo + 1) * 4);
      slider.step = "1";
      slider.value = String(
        Math.round((typeof o.guess === "number" ? o.guess : lo + (hi - lo) / 2) * 4),
      );
    }
    slider.addEventListener("input", () => {
      o.guess = Number(slider.value) / 4;
      draw();
    });
    slider.addEventListener("change", () => ctx.pushHistory());

    const tog = (label, aria, key) => {
      const b = MWB.btn(label, aria, () => {
        mode[key] = !mode[key];
        b.setAttribute("aria-pressed", String(mode[key]));
        draw();
        ctx.pushHistory();
      });
      b.setAttribute("aria-pressed", String(!!mode[key]));
      return b;
    };
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("Mean & spread", "Media y dispersión")),
        tog(
          t("Balance point", "Punto de equilibrio"),
          t("Show the balance point", "Mostrar el punto de equilibrio"),
          "balance",
        ),
        tog(
          t("Distances from the mean", "Distancias a la media"),
          t(
            "Show how far each value is from the mean",
            "Mostrar a qué distancia está cada valor de la media",
          ),
          "spread",
        ),
        tog(
          t("Show numbers", "Mostrar números"),
          t(
            "Show the mean and spread so I can check my work",
            "Mostrar la media y la dispersión para revisar mi trabajo",
          ),
          "numbers",
        ),
      ),
      h(
        "div",
        { class: "wbx-row" },
        h("span", { class: "wbx-title" }, t("move it", "muévelo")),
        slider,
      ),
      stage,
      live,
    );
    wrap.refresh = () => {
      syncSlider();
      draw();
    };
    syncSlider();
    draw();
    return wrap;
  }

  const KINDS = new Set(["dotplot", "histogram"]);
  MWB.on("decorateEl", (el, o) => {
    if (!KINDS.has(o.type) || !o.stat) return;
    const inner = el.querySelector(".obj-inner");
    if (!inner || inner.querySelector(".wbx-stat")) return;
    const p = panel(o, MWB.ctx);
    inner.appendChild(p);
    // The chart re-renders itself when a dot or bar changes: refresh after it does.
    let timer = null;
    el.addEventListener("click", () => {
      clearTimeout(timer);
      timer = setTimeout(() => p.refresh(), 30);
    });
    el.addEventListener("change", () => setTimeout(() => p.refresh(), 30));
    ["pointerdown", "keydown"].forEach((ev) => p.addEventListener(ev, (e) => e.stopPropagation()));
  });
  MWB.on("extendMiniTools", (o, mk) => {
    if (!KINDS.has(o.type)) return;
    mk("x̄", t("Mean and spread overlay", "Superposición de media y dispersión"), "", () => {
      o.stat = !o.stat;
      const ctx = MWB.ctx;
      ctx.renderAll();
      ctx.selectObject(o.id);
      ctx.pushHistory();
    });
  });
})(window);

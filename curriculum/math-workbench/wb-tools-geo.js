/* Math Workbench — nets (fold / unfold), composite-shape decomposer, prism
 * volume with unit cubes. Labels show dimensions only; the student finds the
 * areas and volumes herself. */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  const M = root.WBMath;
  if (!MWB || !M) return;
  const { h, svg } = MWB;
  const t = MWB.t;

  const FACE_FILL = ["#cfe3f7", "#fde9b8", "#d1fae5", "#fbd5e5", "#e0d7fb", "#fee2c4"];

  /* ======================= Nets ======================= */
  const NET_SHAPES = [
    { id: "cube", en: "Cube", es: "Cubo", dims: ["w"] },
    { id: "rectprism", en: "Rectangular prism", es: "Prisma rectangular", dims: ["l", "w", "h"] },
    { id: "triprism", en: "Triangular prism", es: "Prisma triangular", dims: ["l", "w", "h"] },
    { id: "sqpyramid", en: "Square pyramid", es: "Pirámide cuadrada", dims: ["w", "h"] },
  ];
  const DIM_NAME = { l: ["length", "largo"], w: ["width", "ancho"], h: ["height", "alto"] };
  const clampDim = (v, d) => (Number.isFinite(v) && v >= 1 && v <= 12 ? Math.round(v * 2) / 2 : d);

  function buildNet(o, ctx) {
    if (!NET_SHAPES.some((s) => s.id === o.shape)) o.shape = "rectprism";
    o.l = clampDim(o.l, 4);
    o.w = clampDim(o.w, 3);
    o.h = clampDim(o.h, 2);
    o.fold = Number.isFinite(o.fold) ? Math.max(0, Math.min(100, o.fold)) : 0;
    const wrap = h("div", { class: "wbx toolobj wbx-net" });
    const stage = h("div", { class: "wbx-netstage" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const dimBox = h("div", { class: "wbx-row" });

    const sel = h("select", { class: "wbx-txt", "aria-label": t("Solid", "Cuerpo") });
    for (const s of NET_SHAPES)
      sel.appendChild(h("option", { value: s.id, selected: s.id === o.shape }, t(s.en, s.es)));
    MWB.guard(sel);
    sel.addEventListener("change", () => {
      o.shape = sel.value;
      o.fold = 0;
      slider.value = "0";
      dims();
      draw();
      ctx.pushHistory();
    });
    const slider = h("input", {
      type: "range",
      min: "0",
      max: "100",
      step: "1",
      value: String(o.fold),
      "aria-label": t(
        "How folded: 0 is flat, 100 is a closed solid",
        "Cuánto se dobla: 0 es plano, 100 es cuerpo cerrado",
      ),
      class: "wbx-range",
    });
    MWB.guard(slider);
    slider.addEventListener("input", () => {
      o.fold = Number(slider.value);
      draw();
    });
    slider.addEventListener("change", () => ctx.pushHistory());
    const setFold = (v) => {
      o.fold = v;
      slider.value = String(v);
      draw();
      ctx.pushHistory();
    };

    function dims() {
      dimBox.textContent = "";
      const def = NET_SHAPES.find((s) => s.id === o.shape);
      for (const k of def.dims) {
        const name =
          def.id === "triprism" && k === "w"
            ? ["triangle base", "base del triángulo"]
            : def.id === "triprism" && k === "h"
              ? ["triangle height", "altura del triángulo"]
              : def.id === "sqpyramid" && k === "w"
                ? ["base edge", "arista de la base"]
                : def.id === "sqpyramid" && k === "h"
                  ? ["pyramid height", "altura de la pirámide"]
                  : def.id === "cube"
                    ? ["edge", "arista"]
                    : DIM_NAME[k];
        const inp = MWB.numField(o[k], t(name[0], name[1]), { min: 1, max: 12, step: 0.5 }, (i) => {
          const v = Number(i.value);
          o[k] = clampDim(v, o[k]);
          i.value = o[k];
          draw();
          ctx.pushHistory();
        });
        dimBox.append(h("span", { class: "wbx-title" }, t(name[0], name[1])), inp);
      }
    }

    function draw() {
      const faces = M.netFaces(o.shape, o);
      const tt = o.fold / 100;
      const folded = M.foldNet(faces, tt);
      const flat = M.foldNet(faces, 0).flat();
      const fx = flat.map((p) => p[0]);
      const fy = flat.map((p) => p[1]);
      const span = Math.max(
        Math.max(...fx) - Math.min(...fx),
        Math.max(...fy) - Math.min(...fy),
        1,
      );
      const u = 250 / span;
      const proj = folded.map((f) => f.map((p) => M.viewPoint(p, tt)));
      const all = proj.flat();
      const minX = Math.min(...all.map((p) => p[0]));
      const maxX = Math.max(...all.map((p) => p[0]));
      const minY = Math.min(...all.map((p) => p[1]));
      const maxY = Math.max(...all.map((p) => p[1]));
      const W = 380;
      const H = 300;
      const ox = W / 2 - ((minX + maxX) / 2) * u;
      const oy = H / 2 - ((minY + maxY) / 2) * u;
      const s = svg("svg", {
        viewBox: `0 0 ${W} ${H}`,
        width: W,
        height: H,
        role: "img",
        "aria-label": `${t("Net of a", "Red de un")} ${t(NET_SHAPES.find((x) => x.id === o.shape).en, NET_SHAPES.find((x) => x.id === o.shape).es)}. ${o.fold === 0 ? t("Laid flat.", "Plana.") : o.fold === 100 ? t("Folded closed.", "Doblada y cerrada.") : t(`Folded ${o.fold} percent.`, `Doblada ${o.fold} por ciento.`)}`,
      });
      const order = proj
        .map((f, i) => ({ i, z: f.reduce((n, p) => n + p[2], 0) / f.length }))
        .sort((a, b) => a.z - b.z);
      for (const { i } of order) {
        const pts = proj[i]
          .map((p) => `${(ox + p[0] * u).toFixed(1)},${(oy + p[1] * u).toFixed(1)}`)
          .join(" ");
        s.appendChild(
          svg("polygon", {
            points: pts,
            fill: FACE_FILL[i % FACE_FILL.length],
            "fill-opacity": 0.92,
            stroke: "#17487f",
            "stroke-width": 2,
            "stroke-linejoin": "round",
          }),
        );
        if (tt < 0.25) {
          const cx = proj[i].reduce((n, p) => n + p[0], 0) / proj[i].length;
          const cy = proj[i].reduce((n, p) => n + p[1], 0) / proj[i].length;
          s.appendChild(
            svg(
              "text",
              {
                x: ox + cx * u,
                y: oy + cy * u + 4,
                "text-anchor": "middle",
                "font-size": 12,
                "font-weight": 800,
                fill: "#14223a",
              },
              faces[i].label,
            ),
          );
        }
      }
      stage.textContent = "";
      stage.appendChild(s);
      live.textContent = t(
        `${faces.length} faces. Each label shows that face's side lengths.`,
        `${faces.length} caras. Cada etiqueta muestra los lados de esa cara.`,
      );
      ctx.updateObjEl(o);
    }
    wrap.append(
      h("div", { class: "wbx-head" }, h("p", { class: "wbx-title" }, t("Net", "Red")), sel),
      dimBox,
      stage,
      h(
        "div",
        { class: "wbx-row" },
        MWB.btn(t("Unfold", "Desdoblar"), t("Lay the net flat", "Dejar la red plana"), () =>
          setFold(0),
        ),
        slider,
        MWB.btn(t("Fold", "Doblar"), t("Fold the net closed", "Doblar la red"), () => setFold(100)),
      ),
      live,
    );
    dims();
    draw();
    return wrap;
  }

  /* ======================= Composite decomposer ======================= */
  const COMP = {
    L: {
      en: "L-shape",
      es: "Forma en L",
      modes: ["vertical", "horizontal", "cut"],
      def: { w: 8, h: 6, cw: 3, ch: 2 },
    },
    T: {
      en: "T-shape",
      es: "Forma en T",
      modes: ["add", "cut"],
      def: { w: 9, h: 6, cw: 3, ch: 2 },
    },
    U: {
      en: "U-shape",
      es: "Forma en U",
      modes: ["add", "cut"],
      def: { w: 9, h: 6, cw: 3, ch: 4 },
    },
  };
  const MODE_NAME = {
    vertical: ["Split top-to-bottom", "Dividir de arriba a abajo"],
    horizontal: ["Split left-to-right", "Dividir de izquierda a derecha"],
    add: ["Add rectangles", "Sumar rectángulos"],
    cut: ["Big rectangle minus the cut-out", "Rectángulo grande menos el recorte"],
  };

  function buildComposite(o, ctx) {
    if (!COMP[o.shape]) o.shape = "L";
    const def = COMP[o.shape].def;
    for (const k of ["w", "h", "cw", "ch"])
      o[k] = Number.isInteger(o[k]) && o[k] >= 1 && o[k] <= 14 ? o[k] : def[k];
    if (!COMP[o.shape].modes.includes(o.mode)) o.mode = COMP[o.shape].modes[0];
    const wrap = h("div", { class: "wbx toolobj wbx-comp" });
    const stage = h("div", { class: "wbx-compstage" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const ctl = h("div", { class: "wbx-row" });
    const modes = h("div", {
      class: "wbx-row",
      role: "group",
      "aria-label": t("How to find the area", "Cómo hallar el área"),
    });

    const sel = h("select", { class: "wbx-txt", "aria-label": t("Shape", "Forma") });
    for (const [k, v] of Object.entries(COMP))
      sel.appendChild(h("option", { value: k, selected: k === o.shape }, t(v.en, v.es)));
    MWB.guard(sel);
    sel.addEventListener("change", () => {
      o.shape = sel.value;
      Object.assign(o, COMP[o.shape].def);
      o.mode = COMP[o.shape].modes[0];
      controls();
      draw();
      ctx.pushHistory();
    });

    function legal() {
      // keep the cut-out smaller than the outer rectangle
      o.cw = Math.min(o.cw, o.shape === "L" ? o.w - 1 : o.w - 2);
      o.ch = Math.min(o.ch, o.h - 1);
      o.cw = Math.max(1, o.cw);
      o.ch = Math.max(1, o.ch);
      if (o.shape !== "L" && (o.w - o.cw) % 2) o.cw += o.cw < o.w - 2 ? 1 : -1;
    }
    function controls() {
      ctl.textContent = "";
      const names = {
        w: ["outer width", "ancho total"],
        h: ["outer height", "alto total"],
        cw: [
          o.shape === "L" ? "cut-out width" : "stem width",
          o.shape === "L" ? "ancho del recorte" : "ancho del tallo",
        ],
        ch: [
          o.shape === "L" ? "cut-out height" : o.shape === "T" ? "bar height" : "base height",
          o.shape === "L"
            ? "alto del recorte"
            : o.shape === "T"
              ? "alto de la barra"
              : "alto de la base",
        ],
      };
      for (const k of ["w", "h", "cw", "ch"]) {
        const inp = MWB.numField(o[k], t(names[k][0], names[k][1]), { min: 1, max: 14 }, (i) => {
          const v = Math.round(Number(i.value));
          if (v >= 1 && v <= 14) o[k] = v;
          legal();
          i.value = o[k];
          controls();
          draw();
          ctx.pushHistory();
        });
        ctl.append(h("span", { class: "wbx-title" }, t(names[k][0], names[k][1])), inp);
      }
      modes.textContent = "";
      for (const m of COMP[o.shape].modes) {
        const b = MWB.btn(
          t(MODE_NAME[m][0], MODE_NAME[m][1]),
          t(MODE_NAME[m][0], MODE_NAME[m][1]),
          () => {
            o.mode = m;
            controls();
            draw();
            ctx.pushHistory();
          },
        );
        b.setAttribute("aria-pressed", String(o.mode === m));
        modes.appendChild(b);
      }
    }
    function draw() {
      legal();
      const g = M.compositeParts(o.shape, o.mode, o);
      const u = Math.min(30, Math.floor(300 / Math.max(g.W, g.H * 1.4)));
      const pad = 22;
      const W = g.W * u + pad * 2;
      const H = g.H * u + pad * 2;
      const s = svg("svg", {
        viewBox: `0 0 ${W} ${H}`,
        width: W,
        height: H,
        role: "img",
        "aria-label": `${t(COMP[o.shape].en, COMP[o.shape].es)}: ${t("outer", "exterior")} ${g.W} × ${g.H}. ${t(MODE_NAME[o.mode][0], MODE_NAME[o.mode][1])}.`,
      });
      const colors = ["#cfe3f7", "#fde9b8", "#d1fae5"];
      let ci = 0;
      for (const p of g.parts) {
        const x = pad + p.x * u;
        const y = pad + p.y * u;
        s.appendChild(
          svg("rect", {
            x,
            y,
            width: p.w * u,
            height: p.h * u,
            fill: p.cut ? "#fff" : colors[ci++ % 3],
            stroke: p.cut ? "#dc2626" : "#17487f",
            "stroke-width": 2,
            "stroke-dasharray": p.cut ? "6 4" : null,
          }),
        );
        s.appendChild(
          svg(
            "text",
            {
              x: x + (p.w * u) / 2,
              y: y + (p.h * u) / 2 + 4,
              "text-anchor": "middle",
              "font-size": 12,
              "font-weight": 800,
              fill: p.cut ? "#b91c1c" : "#14223a",
            },
            `${p.w} × ${p.h}`,
          ),
        );
      }
      s.appendChild(
        svg("polygon", {
          points: g.outline.map(([x, y]) => `${pad + x * u},${pad + y * u}`).join(" "),
          fill: "none",
          stroke: "#14223a",
          "stroke-width": 2.5,
          "pointer-events": "none",
        }),
      );
      s.appendChild(
        svg(
          "text",
          {
            x: pad + (g.W * u) / 2,
            y: pad - 6,
            "text-anchor": "middle",
            "font-size": 12,
            "font-weight": 900,
            fill: "#5b6b82",
          },
          String(g.W),
        ),
      );
      s.appendChild(
        svg(
          "text",
          {
            x: pad - 8,
            y: pad + (g.H * u) / 2,
            "text-anchor": "end",
            "font-size": 12,
            "font-weight": 900,
            fill: "#5b6b82",
          },
          String(g.H),
        ),
      );
      stage.textContent = "";
      stage.appendChild(s);
      live.textContent = t(
        "Each rectangle shows its side lengths. The dashed red part is taken away.",
        "Cada rectángulo muestra sus lados. La parte roja punteada se quita.",
      );
      ctx.updateObjEl(o);
    }
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("Composite figure", "Figura compuesta")),
        sel,
      ),
      ctl,
      modes,
      stage,
      live,
    );
    controls();
    draw();
    return wrap;
  }

  /* ======================= Prism volume with unit cubes ======================= */
  const EDGES = ["1", "1/2", "1/3", "1/4"];
  function buildPrismVol(o, ctx) {
    for (const [k, d] of [
      ["l", "3/2"],
      ["w", "1"],
      ["h", "1/2"],
    ])
      if (!M.parseFraction(o[k])) o[k] = d;
    if (!EDGES.includes(o.edge)) o.edge = "1/2";
    const wrap = h("div", { class: "wbx toolobj wbx-pvol" });
    const stage = h("div", { class: "wbx-pvstage" });
    const read = h("p", { class: "wbx-read", "aria-live": "polite" });
    const live = h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    const field = (k, label, es) =>
      MWB.textField(
        o[k],
        t(label, es),
        (inp) => {
          const f = M.parseFraction(inp.value);
          if (!f || f.n <= 0 || M.toNumber(f) > 12) {
            inp.value = o[k];
            live.textContent = t(
              "Type a number or fraction up to 12, like 3/2 or 1.5.",
              "Escribe un número o fracción hasta 12, como 3/2 o 1.5.",
            );
            return;
          }
          o[k] = inp.value.trim();
          draw();
          ctx.pushHistory();
        },
        60,
      );
    const edgeBox = h("div", {
      class: "wbx-row",
      role: "group",
      "aria-label": t("Size of each cube's edge", "Arista de cada cubo"),
    });
    for (const e of EDGES) {
      const b = MWB.btn(e, t(`Cubes with edge ${e} unit`, `Cubos con arista ${e} unidad`), () => {
        o.edge = e;
        draw();
        ctx.pushHistory();
      });
      b.dataset.e = e;
      edgeBox.appendChild(b);
    }
    const layers = MWB.btn(
      t("Show layers", "Mostrar capas"),
      t("Color each layer of cubes", "Colorear cada capa de cubos"),
      () => {
        o.layers = !o.layers;
        draw();
        ctx.pushHistory();
      },
    );

    function draw() {
      edgeBox
        .querySelectorAll("button")
        .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.e === o.edge)));
      layers.setAttribute("aria-pressed", String(!!o.layers));
      const l = M.parseFraction(o.l);
      const w = M.parseFraction(o.w);
      const hh = M.parseFraction(o.h);
      const edge = M.parseFraction(o.edge);
      const c = M.prismCubes(l, w, hh, edge);
      stage.textContent = "";
      if (!c.ok || c.nl * c.nw * c.nh > 600) {
        read.textContent = "";
        live.textContent = c.ok
          ? t(
              "That is too many cubes to draw. Try bigger cubes.",
              "Son demasiados cubos para dibujar. Prueba con cubos más grandes.",
            )
          : t(
              "These cubes do not fit the box evenly. Try smaller cubes.",
              "Estos cubos no encajan exactamente en la caja. Prueba con cubos más pequeños.",
            );
        ctx.updateObjEl(o);
        return;
      }
      const E = Math.min(34, Math.max(8, Math.floor(210 / Math.max(c.nl, c.nw, c.nh))));
      const cs = Math.cos(Math.PI / 6);
      const sn = 0.5;
      const P = (x, y, z) => [(x - y) * cs * E, (x + y) * sn * E - z * E];
      const pts = [
        P(0, 0, 0),
        P(c.nl, 0, 0),
        P(c.nl, c.nw, 0),
        P(0, c.nw, 0),
        P(0, 0, c.nh),
        P(c.nl, 0, c.nh),
        P(c.nl, c.nw, c.nh),
        P(0, c.nw, c.nh),
      ];
      const minX = Math.min(...pts.map((p) => p[0]));
      const maxX = Math.max(...pts.map((p) => p[0]));
      const minY = Math.min(...pts.map((p) => p[1]));
      const maxY = Math.max(...pts.map((p) => p[1]));
      const pad = 24;
      const W = maxX - minX + pad * 2;
      const H = maxY - minY + pad * 2;
      const at = (x, y, z) => {
        const p = P(x, y, z);
        return [(p[0] - minX + pad).toFixed(1), (p[1] - minY + pad).toFixed(1)];
      };
      const s = svg("svg", {
        viewBox: `0 0 ${W} ${H}`,
        width: W,
        height: H,
        role: "img",
        "aria-label": t(
          `Box made of unit cubes: ${c.nl} along the length, ${c.nw} along the width, ${c.nh} high.`,
          `Caja de cubos unitarios: ${c.nl} de largo, ${c.nw} de ancho, ${c.nh} de alto.`,
        ),
      });
      const face = (corners, fill) =>
        s.appendChild(
          svg("polygon", {
            points: corners.map((p) => at(...p).join(",")).join(" "),
            fill,
            stroke: "#17487f",
            "stroke-width": 1.4,
          }),
        );
      const layerFill = (k) =>
        o.layers ? ["#cfe3f7", "#fde9b8", "#d1fae5", "#fbd5e5"][k % 4] : "#cfe3f7";
      // front-left face (y = nw), cube grid
      for (let i = 0; i < c.nl; i++)
        for (let k = 0; k < c.nh; k++)
          face(
            [
              [i, c.nw, k],
              [i + 1, c.nw, k],
              [i + 1, c.nw, k + 1],
              [i, c.nw, k + 1],
            ],
            layerFill(k),
          );
      // right face (x = nl)
      for (let j = 0; j < c.nw; j++)
        for (let k = 0; k < c.nh; k++)
          face(
            [
              [c.nl, j, k],
              [c.nl, j + 1, k],
              [c.nl, j + 1, k + 1],
              [c.nl, j, k + 1],
            ],
            layerFill(k),
          );
      // top face (z = nh)
      for (let i = 0; i < c.nl; i++)
        for (let j = 0; j < c.nw; j++)
          face(
            [
              [i, j, c.nh],
              [i + 1, j, c.nh],
              [i + 1, j + 1, c.nh],
              [i, j + 1, c.nh],
            ],
            o.layers ? layerFill(c.nh - 1) : "#e9f2fb",
          );
      stage.appendChild(s);
      read.textContent = t(
        `Cubes along the length: ${c.nl} · width: ${c.nw} · height: ${c.nh}. Each cube has edge ${o.edge}.`,
        `Cubos a lo largo: ${c.nl} · ancho: ${c.nw} · alto: ${c.nh}. Cada cubo tiene arista ${o.edge}.`,
      );
      live.textContent = "";
      ctx.updateObjEl(o);
    }
    wrap.append(
      h(
        "div",
        { class: "wbx-head" },
        h("p", { class: "wbx-title" }, t("Prism volume", "Volumen del prisma")),
        h("span", { class: "wbx-title" }, "l"),
        field("l", "Length", "Largo"),
        h("span", { class: "wbx-title" }, "w"),
        field("w", "Width", "Ancho"),
        h("span", { class: "wbx-title" }, "h"),
        field("h", "Height", "Alto"),
      ),
      h(
        "div",
        { class: "wbx-row" },
        h("span", { class: "wbx-title" }, t("cube edge", "arista")),
        edgeBox,
        layers,
      ),
      stage,
      read,
      live,
    );
    draw();
    return wrap;
  }

  /* ======================= registration ======================= */
  const icon = (inner) =>
    `<svg viewBox="0 0 90 70" width="84" height="64" aria-hidden="true">${inner}</svg>`;
  MWB.register("net", {
    model: true,
    label: (o) => `Net of a ${o.shape || "rectangular prism"}`,
    build: buildNet,
    explain: {
      shows:
        "A solid unfolded flat. Each flat shape is one face. Sliding the fold bar closes the net into the solid so you can see which edges meet.",
      shows_es:
        "Un cuerpo geométrico desdoblado y plano. Cada figura plana es una cara. Al deslizar la barra, la red se cierra y ves qué aristas se unen.",
      words: ["net", "face", "edge", "surface area", "prism", "pyramid"],
      tryThis: [
        "Count the faces. Which faces are the same size?",
        "Fold the net. Which edges meet each other?",
        "How could you use the net to find the surface area?",
      ],
    },
  });
  MWB.register("composite", {
    model: true,
    label: (o) => `Composite figure: ${o.shape || "L"} shape`,
    build: buildComposite,
    explain: {
      shows:
        "A shape made of rectangles. You can find its area by adding the rectangles, or by taking a cut-out from a big rectangle.",
      shows_es:
        "Una figura hecha de rectángulos. Puedes hallar su área sumando los rectángulos, o quitando un recorte a un rectángulo grande.",
      words: ["composite figure", "decompose", "area", "rectangle", "square units"],
      tryThis: [
        "Find the area two different ways. Do you get the same answer?",
        "Which way was easier for this shape? Why?",
      ],
    },
  });
  MWB.register("prismvol", {
    model: true,
    label: (o) => `Prism volume model, edges ${o.l || "3/2"} by ${o.w || "1"} by ${o.h || "1/2"}`,
    build: buildPrismVol,
    explain: {
      shows:
        "A box packed with small cubes. When the cube edge is a fraction, count how many cubes fit along each side. Volume is the number of unit cubes that fill the box.",
      shows_es:
        "Una caja llena de cubos pequeños. Cuando la arista del cubo es una fracción, cuenta cuántos cubos caben a lo largo de cada lado. El volumen es el número de cubos unitarios que llenan la caja.",
      words: ["volume", "cubic units", "unit cube", "length", "width", "height", "layer"],
      tryThis: [
        "How many cubes are in one layer? How many layers are there?",
        "How does the number of small cubes connect to the volume in cubic units?",
      ],
    },
  });

  const S = "Geometry & measure";
  MWB.addPalette({
    section: S,
    key: "net",
    name: "Net (fold & unfold)",
    es: "Red (doblar)",
    svg: icon(
      '<g fill="#cfe3f7" stroke="#17487f" stroke-width="2"><rect x="30" y="8" width="18" height="16"/><rect x="30" y="24" width="18" height="16"/><rect x="12" y="24" width="18" height="16"/><rect x="48" y="24" width="18" height="16"/><rect x="30" y="40" width="18" height="16"/><rect x="30" y="56" width="18" height="10"/></g>',
    ),
    go: () => MWB.ctx.makeObject("net", { shape: "rectprism" }),
  });
  MWB.addPalette({
    section: S,
    key: "composite",
    name: "Composite figure",
    es: "Figura compuesta",
    svg: icon(
      '<polygon points="12,12 46,12 46,30 78,30 78,58 12,58" fill="#cfe3f7" stroke="#17487f" stroke-width="2.5"/><line x1="46" y1="30" x2="46" y2="58" stroke="#17487f" stroke-dasharray="4 3"/>',
    ),
    go: () => MWB.ctx.makeObject("composite", { shape: "L" }),
  });
  MWB.addPalette({
    section: S,
    key: "prismvol",
    name: "Prism volume",
    es: "Volumen del prisma",
    svg: icon(
      '<g stroke="#17487f" stroke-width="1.6"><polygon points="45,12 76,28 45,44 14,28" fill="#e9f2fb"/><polygon points="14,28 45,44 45,62 14,46" fill="#cfe3f7"/><polygon points="76,28 45,44 45,62 76,46" fill="#fde9b8"/></g>',
    ),
    go: () => MWB.ctx.makeObject("prismvol", {}),
  });
})(window);

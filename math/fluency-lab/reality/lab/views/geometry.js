// Views for the rectangle (grid, area, perimeter, saved cases) and the coordinate line.
import { R } from "../kernel.js";
import { btn, group, h, makeHandle, minus, row, s, stepper, svgRoot, text, fieldLabel } from "./common.js";

export const areaView = {
  render(ctx) {
    const { state, d, act, xray, lang } = ctx;
    const es = lang === "es";
    const svg = svgRoot(340, ctx.describe());
    const ox = 56;
    const oy = 24;
    const cell = Math.max(10, Math.min(34, 480 / Math.max(state.w, 8), 250 / Math.max(state.h, 6)));
    svg.append(s("rect", { x: ox, y: oy, width: state.w * cell, height: state.h * cell, class: "mr-rect" }));
    for (let i = 0; i <= state.w; i++) svg.append(s("line", { x1: ox + i * cell, y1: oy, x2: ox + i * cell, y2: oy + state.h * cell, class: "mr-gridline" }));
    for (let j = 0; j <= state.h; j++) svg.append(s("line", { x1: ox, y1: oy + j * cell, x2: ox + state.w * cell, y2: oy + j * cell, class: "mr-gridline" }));
    svg.append(s("rect", { x: ox, y: oy, width: state.w * cell, height: state.h * cell, class: `mr-outline ${xray ? "is-xray" : ""}` }));
    svg.append(text(ox + (state.w * cell) / 2, oy + state.h * cell + 24, `${state.w}`, "mr-dim"));
    svg.append(text(ox - 22, oy + (state.h * cell) / 2 + 6, `${state.h}`, "mr-dim"));
    if (xray) {
      for (let j = 0; j < state.h; j++) svg.append(text(ox + state.w * cell + 14, oy + j * cell + cell / 2 + 5, `${state.w}`, "mr-xray-line", "start"));
      svg.append(text(ox + state.w * cell + 14, oy + state.h * cell + 24, `${state.h} × ${state.w} = ${d.area}`, "mr-xray-line", "start"));
    }
    const handle = s("circle", { cx: ox + state.w * cell, cy: oy + state.h * cell, r: 13, class: "mr-knob" });
    makeHandle(handle, svg, {
      key: "knob",
      label: es ? "Cambiar el tamaño del rectángulo. Flechas: derecha o izquierda cambia el ancho, arriba o abajo cambia el alto." : "Resize the rectangle. Arrow keys: right or left changes the width, up or down changes the height.",
      valueText: `${state.w} × ${state.h}`,
      onMove: (p) => act({ type: "size", w: Math.round((p.x - ox) / cell), h: Math.round((p.y - oy) / cell) }),
      onKey: (dx, dy) => act({ type: "bump", dw: dx, dh: -dy }),
    });
    svg.append(handle);
    return h("div", { class: "mr-view" }, svg);
  },
  controls(ctx) {
    const { state, d, act, lang } = ctx;
    const es = lang === "es";
    const maxP = Math.max(1, ...d.cases.map((c) => c.perimeter));
    const maxA = Math.max(1, ...d.cases.map((c) => c.area));
    return h("div", { class: "mr-controls" },
      row(
        stepper(es ? "Ancho" : "Width", state.w, { key: "w", onMinus: () => act({ type: "bump", dw: -1 }), onPlus: () => act({ type: "bump", dw: 1 }), minDisabled: state.w <= 1, plusDisabled: state.w >= state.maxW }),
        stepper(es ? "Alto" : "Height", state.h, { key: "h", onMinus: () => act({ type: "bump", dh: -1 }), onPlus: () => act({ type: "bump", dh: 1 }), minDisabled: state.h <= 1, plusDisabled: state.h >= state.maxH }),
      ),
      row(btn(es ? "Guardar este rectángulo" : "Save this rectangle", () => act({ type: "save" }), { cls: "is-primary", key: "save" }), btn(es ? "Borrar la lista" : "Clear the list", () => act({ type: "clearCases" }), { key: "clear", disabled: !d.cases.length })),
      d.cases.length
        ? h("table", { class: "mr-table", "aria-label": es ? "Rectángulos guardados" : "Saved rectangles" },
            h("thead", {}, h("tr", {}, h("th", { scope: "col" }, es ? "Tamaño" : "Size"), h("th", { scope: "col" }, es ? "Área" : "Area"), h("th", { scope: "col" }, es ? "Perímetro" : "Perimeter"))),
            h("tbody", {}, ...d.cases.map((c) => h("tr", {}, h("td", {}, `${c.w} × ${c.h}`), h("td", {}, h("span", { class: "mr-bar-cell" }, h("span", { class: "mr-bar-fill is-area", style: `width:${(c.area / maxA) * 100}%` }), h("b", {}, String(c.area)))), h("td", {}, h("span", { class: "mr-bar-cell" }, h("span", { class: "mr-bar-fill is-perim", style: `width:${(c.perimeter / maxP) * 100}%` }), h("b", {}, String(c.perimeter))))))))
        : null,
    );
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [
      ["equation", h("span", { class: "mr-ro mr-big" }, d.equation)],
      ["area", h("span", { class: "mr-ro" }, `${d.area} ${lang === "es" ? "unidades cuadradas" : "square units"}`)],
      ["perimeter", h("span", { class: "mr-ro" }, `${d.perimeter} ${lang === "es" ? "unidades" : "units"}`)],
    ];
  },
};

// ---- coordinate line ----------------------------------------------------------------------------------------------------------------
const G = 10;
export const graphView = {
  render(ctx) {
    const { state, d, act, xray, lang } = ctx;
    const es = lang === "es";
    const size = 400;
    const cell = size / (2 * G);
    const ox = 120 + G * cell;
    const oy = 10 + G * cell;
    const X = (x) => ox + x * cell;
    const Y = (y) => oy - y * cell;
    const svg = svgRoot(size + 20, ctx.describe());
    svg.append(s("rect", { x: X(-G), y: Y(G), width: size, height: size, class: "mr-plane" }));
    for (let i = -G; i <= G; i++) {
      svg.append(s("line", { x1: X(i), y1: Y(G), x2: X(i), y2: Y(-G), class: i === 0 ? "mr-axis" : "mr-gridline" }));
      svg.append(s("line", { x1: X(-G), y1: Y(i), x2: X(G), y2: Y(i), class: i === 0 ? "mr-axis" : "mr-gridline" }));
      if (i % 5 === 0 && i !== 0) {
        svg.append(text(X(i), Y(0) + 16, minus(i), "mr-tick-label"));
        svg.append(text(X(0) - 8, Y(i) + 5, minus(i), "mr-tick-label", "end"));
      }
    }
    if (!d.vertical) {
      const y1 = d.slope.mul(-G).add(d.intercept);
      const y2 = d.slope.mul(G).add(d.intercept);
      svg.append(s("line", { x1: X(-G), y1: Y(Number(y1.n) / Number(y1.d)), x2: X(G), y2: Y(Number(y2.n) / Number(y2.d)), class: "mr-line" }));
    } else svg.append(s("line", { x1: X(d.p1[0]), y1: Y(G), x2: X(d.p1[0]), y2: Y(-G), class: "mr-line" }));
    const [a, b] = [d.p1, d.p2].sort((p, q) => p[0] - q[0]);
    if (xray && !d.vertical) {
      svg.append(s("path", { d: `M ${X(a[0])} ${Y(a[1])} H ${X(b[0])} V ${Y(b[1])}`, class: "mr-triangle" }));
      svg.append(text((X(a[0]) + X(b[0])) / 2, Y(a[1]) + 18, `${es ? "avance" : "run"} ${minus(b[0] - a[0])}`, "mr-xray-line"));
      svg.append(text(X(b[0]) + 8, (Y(a[1]) + Y(b[1])) / 2, `${es ? "subida" : "rise"} ${minus(b[1] - a[1])}`, "mr-xray-line", "start"));
    }
    for (const id of ["p1", "p2"]) {
      const [x, y] = state[id];
      const knob = s("circle", { cx: X(x), cy: Y(y), r: 11, class: `mr-knob is-${id}` });
      makeHandle(knob, svg, {
        key: `knob-${id}`,
        label: `${es ? "Punto" : "Point"} ${id === "p1" ? 1 : 2}`,
        valueText: `(${minus(x)}, ${minus(y)})`,
        onMove: (p) => act({ type: "move", pt: id, x: Math.round((p.x - ox) / cell), y: Math.round((oy - p.y) / cell) }),
        onKey: (dx, dy) => act({ type: "nudge", pt: id, dx, dy }),
      });
      svg.append(knob);
      svg.append(text(X(x) + 14, Y(y) - 12, `(${minus(x)}, ${minus(y)})`, "mr-dot-label", "start"));
    }
    return h("div", { class: "mr-view" }, svg);
  },
  controls(ctx) {
    const { d, act, lang } = ctx;
    const es = lang === "es";
    const pad = (id) =>
      group(`${es ? "Punto" : "Point"} ${id === "p1" ? 1 : 2}`,
        fieldLabel(`${es ? "Punto" : "Point"} ${id === "p1" ? 1 : 2}`),
        btn("←", () => act({ type: "nudge", pt: id, dx: -1 }), { aria: es ? "Mover a la izquierda" : "Move left", key: `${id}-l` }),
        btn("↑", () => act({ type: "nudge", pt: id, dy: 1 }), { aria: es ? "Mover arriba" : "Move up", key: `${id}-u` }),
        btn("↓", () => act({ type: "nudge", pt: id, dy: -1 }), { aria: es ? "Mover abajo" : "Move down", key: `${id}-d` }),
        btn("→", () => act({ type: "nudge", pt: id, dx: 1 }), { aria: es ? "Mover a la derecha" : "Move right", key: `${id}-r` }));
    return h("div", { class: "mr-controls" }, h("div", { class: "mr-cols" }, pad("p1"), pad("p2")),
      d.table.length ? h("table", { class: "mr-table", "aria-label": es ? "Tabla de entrada y salida" : "Input-output table" }, h("thead", {}, h("tr", {}, ...d.table.map(([x]) => h("th", { scope: "col" }, `x = ${minus(x)}`)))), h("tbody", {}, h("tr", {}, ...d.table.map(([, y]) => h("td", {}, minus(y.d === 1n ? String(y.n) : `${y.n}/${y.d}`)))))) : null);
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [
      ["equation", h("span", { class: "mr-ro mr-big" }, d.equation)],
      ["slope", h("span", { class: "mr-ro" }, d.vertical ? (lang === "es" ? "Pendiente indefinida" : "Slope undefined") : `${lang === "es" ? "Pendiente" : "Slope"} ${minus(d.slope.d === 1n ? String(d.slope.n) : `${d.slope.n}/${d.slope.d}`)}`)],
      d.proportional ? ["prop", h("span", { class: "mr-ro is-ok" }, lang === "es" ? "Pasa por el origen: proporcional" : "Through the origin: proportional")] : null,
    ].filter(Boolean);
  },
};
export { R };

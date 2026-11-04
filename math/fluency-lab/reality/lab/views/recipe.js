// Connected representations: one servings value drives the table, the double number line, the graph and the equation,
// and any of them can be edited: the servings stepper, an amount in the table, or the point on the graph.
import { R, fracText } from "../kernel.js";
import { btn, group, h, makeHandle, row, s, stepper, svgRoot, text, fieldLabel } from "./common.js";

const num = (q) => Number(q.n) / Number(q.d);
const nice = (x) => (x <= 12 ? 12 : x <= 24 ? 24 : x <= 48 ? 48 : 96);

export const recipeView = {
  render(ctx) {
    const { state, d, act, xray, lang } = ctx;
    const es = lang === "es";
    const base = num(state.base.servings);
    const cur = num(d.servings);
    const xmax = nice(Math.max(cur, base) * 1.25);
    const rate = num(d.focus.perServing);
    const ymax = Math.max(1, rate * xmax);
    const wrap = h("div", { class: "mr-view mr-recipe" });
    // table
    const items = d.items;
    const focusId = state.focus;
    const head = h("tr", {}, h("th", { scope: "col" }, es ? "Porciones" : "Servings"), ...items.map((i) => h("th", { scope: "col", class: i.id === focusId ? "is-focus" : "" }, h("button", { type: "button", class: "mr-link", "data-key": `focus-${i.id}`, on: { click: () => act({ type: "focus", id: i.id }) }, "aria-pressed": String(i.id === focusId) }, `${i.name[lang]} (${i.unit[lang]})`))));
    const baseRow = h("tr", { class: "is-base" }, h("th", { scope: "row" }, fracText(state.base.servings)), ...items.map((i) => h("td", { class: i.id === focusId ? "is-focus" : "" }, fracText(i.amount))));
    const input = (value, onChange, key, label, focus) => h("td", { class: focus ? "is-focus" : "" }, h("input", { class: "mr-input mr-cell-input", type: "text", inputmode: "decimal", value, "data-key": key, "aria-label": label, on: { change: (e) => onChange(e.target.value) } }));
    const curRow = h("tr", { class: "is-current" }, h("th", { scope: "row" }, h("input", { class: "mr-input mr-cell-input", type: "text", inputmode: "decimal", value: fracText(d.servings), "data-key": "servings-input", "aria-label": es ? "Porciones" : "Servings", on: { change: (e) => act({ type: "servings", value: e.target.value, via: "table" }) } })), ...items.map((i) => input(fracText(i.scaled), (v) => act({ type: "item", id: i.id, value: v, via: "table" }), `item-${i.id}`, `${i.name[lang]}`, i.id === focusId)));
    wrap.append(h("table", { class: "mr-table mr-ratio-table", "aria-label": es ? "Tabla de razones" : "Ratio table" }, h("thead", {}, head), h("tbody", {}, baseRow, curRow)));
    wrap.append(h("p", { class: "mr-factor" }, `× ${d.kText}`, h("span", { class: "mr-factor-note" }, es ? ` cada cantidad se multiplicó por ${d.kText}` : ` every amount was multiplied by ${d.kText}`)));
    // double number line
    const L1 = 30;
    const W = 580;
    const nl = svgRoot(150, es ? "Recta numérica doble" : "Double number line");
    const X1 = (v) => L1 + (W * v) / xmax;
    const X2 = (v) => L1 + (W * v) / ymax;
    nl.append(text(L1, 14, es ? "Porciones" : "Servings", "mr-bar-title", "start"));
    nl.append(s("line", { x1: L1, y1: 40, x2: L1 + W, y2: 40, class: "mr-axis" }));
    nl.append(text(L1, 108, `${d.focus.name[lang]}`, "mr-bar-title", "start"));
    nl.append(s("line", { x1: L1, y1: 90, x2: L1 + W, y2: 90, class: "mr-axis" }));
    for (const [sv, cls] of [[0, ""], [base, "is-base"], [cur, "is-current"]]) {
      nl.append(s("line", { x1: X1(sv), y1: 30, x2: X1(sv), y2: 50, class: `mr-tick ${cls}` }), s("line", { x1: X1(sv), y1: 50, x2: X2(sv * rate), y2: 80, class: `mr-link-line ${cls}` }), s("line", { x1: X2(sv * rate), y1: 80, x2: X2(sv * rate), y2: 100, class: `mr-tick ${cls}` }));
      if (sv > 0) {
        nl.append(text(X1(sv), 28, fracText(R(Math.round(sv * 100), 100)), `mr-tick-label ${cls}`));
        nl.append(text(X2(sv * rate), 120, fracText(R(Math.round(sv * rate * 1000), 1000)), `mr-tick-label ${cls}`));
      }
    }
    wrap.append(nl);
    // graph
    const gx = 70;
    const gy = 10;
    const gw = 520;
    const gh = 190;
    const GX = (v) => gx + (gw * v) / xmax;
    const GY = (v) => gy + gh - (gh * v) / ymax;
    const gr = svgRoot(250, es ? "Gráfica de porciones y cantidad" : "Graph of servings and amount");
    gr.append(s("rect", { x: gx, y: gy, width: gw, height: gh, class: "mr-plane" }));
    for (let i = 0; i <= 4; i++) {
      gr.append(s("line", { x1: gx, y1: gy + (gh * i) / 4, x2: gx + gw, y2: gy + (gh * i) / 4, class: "mr-gridline" }));
      gr.append(text(gx - 8, gy + gh - (gh * i) / 4 + 5, String(+((ymax * i) / 4).toFixed(2)), "mr-tick-label", "end"));
      gr.append(text(gx + (gw * i) / 4, gy + gh + 20, String(Math.round((xmax * i) / 4)), "mr-tick-label"));
    }
    gr.append(s("line", { x1: GX(0), y1: GY(0), x2: GX(xmax), y2: GY(rate * xmax), class: "mr-line" }));
    gr.append(text(gx + gw / 2, 246, es ? "Porciones" : "Servings", "mr-bar-title"));
    gr.append(s("circle", { cx: GX(base), cy: GY(base * rate), r: 8, class: "mr-dot is-base" }));
    const knob = s("circle", { cx: GX(cur), cy: GY(cur * rate), r: 12, class: "mr-knob is-p1" });
    makeHandle(knob, gr, {
      key: "knob",
      label: es ? "Punto de la gráfica: cambia las porciones" : "Graph point: changes the servings",
      valueText: `${d.servingsText} ${es ? "porciones" : "servings"}, ${d.focus.scaledText} ${d.focus.unit[lang]}`,
      onMove: (p) => act({ type: "servings", value: String(Math.max(1, Math.round(((p.x - gx) / gw) * xmax))), via: "graph" }),
      onKey: (dx, dy) => act({ type: "servings", value: fracText(d.servings.add(dx + dy)), via: "graph" }),
    });
    gr.append(knob);
    if (xray) gr.append(text(GX(cur) + 14, GY(cur * rate) - 12, `(${d.servingsText}, ${d.focus.scaledText})`, "mr-dot-label", "start"));
    wrap.append(gr);
    wrap.append(h("p", { class: "mr-eq-line" }, `${d.focus.name[lang]} = ${d.focus.perServingText} × ${es ? "porciones" : "servings"}`));
    return wrap;
  },
  controls(ctx) {
    const { state, d, act, lang } = ctx;
    const es = lang === "es";
    const v = d.servings;
    return h("div", { class: "mr-controls" }, row(
      stepper(es ? "Porciones" : "Servings", d.servingsText, { key: "serv", onMinus: () => act({ type: "servings", value: fracText(v.sub(1)), via: "servings" }), onPlus: () => act({ type: "servings", value: fracText(v.add(1)), via: "servings" }), minDisabled: v.lte(1), plusDisabled: v.gte(48) }),
      ...[3, 4, 5].map((k) => btn(`${es ? "Rinde" : "Make"} ${state.base.servings.n * BigInt(k)}`, () => act({ type: "servings", value: String(state.base.servings.mul(k)), via: "servings" }), { key: `make-${k}` })),
    ));
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [["servings", h("span", { class: "mr-ro mr-big" }, `${d.servingsText} ${lang === "es" ? "porciones" : "servings"}`)], ["factor", h("span", { class: "mr-ro" }, `× ${d.kText}`)], ["rate", h("span", { class: "mr-ro" }, `${d.focus.perServingText} ${d.focus.unit[lang]} / ${lang === "es" ? "porción" : "serving"}`)]];
  },
};

// Typed construction: an expression or an equation parsed exactly by the engine, and a ratio table the engine checks row
// by row. Token buttons give a no-keyboard way to build the same text.
import { fracText } from "../kernel.js";
import { btn, group, h, row, fieldLabel, minus } from "./common.js";

const TOKENS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "−", "×", "÷", "(", ")", "^"];

export const builderView = {
  render(ctx) {
    const { state, d, act, lang } = ctx;
    const es = lang === "es";
    const isEq = state.kind === "equation";
    const wrap = h("div", { class: "mr-view mr-builder" });
    wrap.append(h("label", { class: "mr-field mr-field-wide" }, h("span", { class: "mr-field-label" }, isEq ? (es ? "Tu ecuación" : "Your equation") : es ? "Tu expresión" : "Your expression"),
      h("input", { class: "mr-input mr-expr", type: "text", value: state.text, autocomplete: "off", spellcheck: "false", inputmode: "text", "data-key": "expr", "aria-describedby": "mr-live-preview", on: { input: (e) => act({ type: "text", text: e.target.value }), keydown: (e) => e.key === "Enter" && act({ type: "submit" }) } })));
    const preview = d.live ? (d.live.ok ? (d.liveText ? (isEq ? `${es ? "El motor resuelve" : "The engine solves"}: ${minus(d.liveText)}` : `= ${minus(d.liveText)}  ·  ${d.live.ops} ${es ? "operaciones" : "operations"}`) : "") : (d.live.reason[lang] ?? d.live.reason.en)) : es ? "Escribe algo y pulsa Agregar." : "Type something, then press Add.";
    wrap.append(h("p", { id: "mr-live-preview", class: `mr-preview ${d.live && !d.live.ok ? "is-warn" : ""}`, "aria-live": "polite" }, preview));
    wrap.append(group(es ? "Botones de símbolos" : "Symbol buttons", ...(isEq ? [...TOKENS, "x", "="] : TOKENS).map((t) => btn(t, () => act({ type: "append", token: t }), { cls: "mr-token", key: `tok-${t}`, aria: t }))));
    wrap.append(row(btn(es ? "Borrar" : "Backspace", () => act({ type: "backspace" }), { key: "bs" }), btn(es ? "Agregar" : "Add it", () => act({ type: "submit" }), { cls: "is-primary", key: "add" })));
    if (d.entries.length)
      wrap.append(h("ol", { class: "mr-entries", "aria-label": es ? "Lo que construiste" : "What you built" }, ...d.entries.map((e, i) => h("li", {}, h("span", { class: "mr-entry" }, e.text), h("span", { class: "mr-entry-val" }, isEq ? (e.solution ? `x = ${minus(fracText(e.solution))}` : e.kind === "all" ? (es ? "toda x" : "every x") : es ? "sin solución" : "no solution") : `= ${minus(fracText(e.value))}`), h("span", { class: "mr-entry-ops" }, `${e.ops} ${es ? "operaciones" : "operations"}`), btn("×", () => act({ type: "drop", i }), { aria: es ? "Quitar" : "Remove", cls: "mr-x", key: `drop-${i}` })))));
    return wrap;
  },
  controls: () => null,
  readout(ctx) {
    const { d, lang } = ctx;
    return [["built", h("span", { class: "mr-ro mr-big" }, String(d.entries.length))]];
  },
};

export const ratiotableView = {
  render(ctx) {
    const { state, d, act, lang } = ctx;
    const es = lang === "es";
    const wrap = h("div", { class: "mr-view" });
    wrap.append(h("table", { class: "mr-table mr-ratio-table", "aria-label": es ? "Tabla de razones" : "Ratio table" },
      h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "x"), h("th", { scope: "col" }, "y"), h("th", { scope: "col" }, "y ÷ x"), h("th", { scope: "col" }, ""))),
      h("tbody", {}, ...state.rows.map((r, i) => {
        const p = d.rows[i];
        const ratio = p.x && p.y && !p.x.isZero() ? fracText(p.y.div(p.x)) : "";
        const cell = (col, value) => h("td", {}, h("input", { class: "mr-input mr-cell-input", type: "text", inputmode: "decimal", value, "data-key": `rt-${i}-${col}`, "aria-label": `${col === 0 ? "x" : "y"} ${es ? "fila" : "row"} ${i + 1}`, on: { input: (e) => act({ type: "set", i, col, value: e.target.value }) } }));
        return h("tr", {}, cell(0, r[0]), cell(1, r[1]), h("td", { class: "mr-ratio-cell" }, ratio), h("td", {}, btn("×", () => act({ type: "remove", i }), { aria: es ? "Quitar la fila" : "Remove the row", cls: "mr-x", key: `rt-rm-${i}` })));
      }))));
    wrap.append(row(btn(es ? "Agregar una fila" : "Add a row", () => act({ type: "add" }), { key: "rt-add" })));
    return wrap;
  },
  controls: () => null,
  readout(ctx) {
    const { d, lang } = ctx;
    return [["constant", h("span", { class: "mr-ro mr-big" }, d.constantText ?? (lang === "es" ? "aún no es constante" : "not constant yet"))], ["rows", h("span", { class: "mr-ro" }, `${d.filled} ${lang === "es" ? "filas completas" : "complete rows"}`)]];
  },
};

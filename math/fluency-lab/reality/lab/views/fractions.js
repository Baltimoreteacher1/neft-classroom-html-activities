// Views for the fraction bar, the two-bar sum and the X-Ray division bar.
import { R } from "../kernel.js";
import { btn, group, h, makeHandle, row, s, stepper, svgRoot, text, fieldLabel, frac, minus } from "./common.js";

const BAR = { x: 30, w: 580 };

function barParts(den, shaded, { y = 30, hgt = 70, onToggle, xray, cls = "" }) {
  const cell = BAR.w / den;
  return Array.from({ length: den }, (_, i) => {
    const on = shaded.includes(i);
    const g = s("g", { class: `mr-part ${on ? "is-on" : ""} ${cls}`, "data-i": i, "data-key": `part-${cls || "bar"}-${i}` });
    g.append(s("rect", { x: BAR.x + i * cell, y, width: cell, height: hgt, class: "mr-part-rect", rx: den > 16 ? 0 : 3 }));
    if (xray || den <= 12) g.append(text(BAR.x + i * cell + cell / 2, y + hgt / 2 + 6, `1/${den}`, `mr-part-label ${xray ? "is-xray" : ""}`));
    if (onToggle) {
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "checkbox");
      g.setAttribute("aria-checked", String(on));
      g.setAttribute("aria-label", `Part ${i + 1} of ${den}`);
      g.addEventListener("click", () => onToggle(i));
      g.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle(i);
        }
      });
    }
    return g;
  });
}

function numberLine(d, { y = 60, marks }) {
  const svg = svgRoot(110, `Number line from 0 to 1 with a point at ${d.num}/${d.den}`);
  svg.append(s("line", { x1: BAR.x, y1: y, x2: BAR.x + BAR.w, y2: y, class: "mr-axis" }));
  d.ticks.forEach((t, i) => {
    const x = BAR.x + (BAR.w * i) / d.den;
    svg.append(s("line", { x1: x, y1: y - 8, x2: x, y2: y + 8, class: "mr-tick" }));
    if (d.den <= 12 || i % Math.ceil(d.den / 12) === 0) svg.append(text(x, y + 28, i === 0 ? "0" : i === d.den ? "1" : `${i}/${d.den}`, "mr-tick-label"));
  });
  for (const m of marks || []) {
    const x = BAR.x + BAR.w * (Number(m.value.n) / Number(m.value.d));
    svg.append(s("circle", { cx: x, cy: y, r: m.big ? 11 : 7, class: m.cls || "mr-dot" }));
  }
  const x = BAR.x + BAR.w * (Number(d.value.n) / Number(d.value.d));
  svg.append(s("circle", { cx: x, cy: y, r: 11, class: "mr-dot is-main" }));
  svg.append(text(x, y - 20, `${d.num}/${d.den}`, "mr-dot-label"));
  return svg;
}

export const fractionView = {
  render(ctx) {
    const { state, d, act, xray, rep, lang } = ctx;
    const wrap = h("div", { class: "mr-view" });
    if (rep === "line") wrap.append(numberLine(d, { marks: d.cases.map((c) => ({ value: c.value, cls: "mr-dot is-case" })) }));
    else if (rep === "symbols") {
      wrap.append(h("div", { class: "mr-symbols" }, frac(d.num, d.den), h("span", { class: "mr-eq" }, "="), h("span", { class: "mr-big" }, d.decimal ?? "…"), h("span", { class: "mr-eq" }, "="), h("span", { class: "mr-big" }, `${d.percent ?? "…"}%`)));
    } else {
      const svg = svgRoot(130, ctx.describe());
      svg.append(s("rect", { x: BAR.x - 4, y: 26, width: BAR.w + 8, height: 78, class: "mr-bar-frame", rx: 8 }));
      for (const el of barParts(d.den, state.shaded, { onToggle: state.den > 1 ? (i) => act({ type: "toggle", i }) : null, xray })) svg.append(el);
      if (state.den === 1) svg.append(text(320, 72, lang === "es" ? "Un entero" : "One whole", "mr-whole-label"));
      wrap.append(svg);
    }
    if (xray && rep !== "symbols") {
      wrap.append(h("p", { class: "mr-xray-note" }, lang === "es" ? `Rayos X: ${d.num} piezas de ${d.den} es ${d.num}/${d.den}. Cada pieza mide 1/${d.den} del entero.` : `X-Ray: ${d.num} pieces of ${d.den} is ${d.num}/${d.den}. Each piece is 1/${d.den} of the whole.`));
    }
    return wrap;
  },
  controls(ctx) {
    const { state, d, act, lang, save } = ctx;
    const es = lang === "es";
    const cut = [2, 3, 4, 5, 6, 8, 10, 12];
    return h("div", { class: "mr-controls" },
      state.den === 1
        ? group(es ? "Cortar el entero" : "Cut the whole", fieldLabel(es ? "Cortar el entero en" : "Cut the whole into"), ...cut.map((n) => btn(String(n), () => act({ type: "partition", n }), { aria: es ? `${n} partes iguales` : `${n} equal parts`, key: `cut-${n}` })))
        : group(es ? "Cortar o unir" : "Cut or join",
            fieldLabel(es ? "Cortar cada parte" : "Cut every part"), ...[2, 3, 4].map((n) => btn(`×${n}`, () => act({ type: "split", n }), { aria: es ? `Cortar cada parte en ${n}` : `Cut every part into ${n}`, key: `split-${n}` })),
            fieldLabel(es ? "Unir partes" : "Join parts"), ...[2, 3].map((n) => btn(`÷${n}`, () => act({ type: "merge", n }), { aria: es ? `Unir de ${n} en ${n}` : `Join parts in groups of ${n}`, key: `merge-${n}` }))),
      state.den > 1 ? stepper(es ? "Partes sombreadas" : "Shaded parts", d.num, { key: "shade", onMinus: () => act({ type: "setShaded", k: d.num - 1 }), onPlus: () => act({ type: "setShaded", k: d.num + 1 }), minDisabled: d.num <= 0, plusDisabled: d.num >= d.den }) : null,
      save ? row(btn(es ? "Guardar esta fracción" : "Save this fraction", () => act({ type: "save" }), { cls: "is-primary", key: "save" })) : null,
      state.cases.length ? h("ul", { class: "mr-cases", "aria-label": es ? "Fracciones guardadas" : "Saved fractions" }, ...d.cases.map((c) => h("li", {}, `${c.num}/${c.den} = ${c.value.n}/${c.value.d}`))) : null,
    );
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [
      ["fraction", h("span", { class: "mr-ro" }, frac(d.num, d.den))],
      ["decimal", h("span", { class: "mr-ro mr-big" }, d.decimal ?? (lang === "es" ? "periódico" : "repeating"))],
      ["percent", h("span", { class: "mr-ro mr-big" }, d.percent == null ? "…" : `${d.percent}%`)],
    ];
  },
};

// ---- two bars joined into one ---------------------------------------------------------------------------------------------------
export const fracaddView = {
  render(ctx) {
    const { state, d, act, xray, lang } = ctx;
    const es = lang === "es";
    const svg = svgRoot(330, ctx.describe());
    const bars = [["a", state.a, 20, es ? "Primera fracción" : "First fraction"], ["b", state.b, 130, es ? "Segunda fracción" : "Second fraction"]];
    for (const [id, bar, y, label] of bars) {
      svg.append(text(BAR.x, y - 4, `${label}: ${bar.shaded.length}/${bar.den}`, "mr-bar-title", "start"));
      for (const el of barParts(bar.den, bar.shaded, { y, hgt: 62, xray, cls: `bar-${id}` })) svg.append(el);
    }
    const combined = state.combined;
    svg.append(text(BAR.x, 232, combined ? `${es ? "Juntas" : "Together"}: ${d.total.n}/${d.total.d}` : es ? "Juntas: primero igualen el tamaño de las piezas" : "Together: first make the pieces the same size", "mr-bar-title", "start"));
    if (combined) {
      const den = state.a.den;
      const cell = BAR.w / den;
      for (let i = 0; i < den; i++) {
        const fromA = i < state.a.shaded.length;
        const fromB = !fromA && i < state.a.shaded.length + state.b.shaded.length;
        svg.append(s("rect", { x: BAR.x + i * cell, y: 244, width: cell, height: 62, class: `mr-part-rect ${fromA ? "is-a" : fromB ? "is-b" : ""}`, rx: 3 }));
      }
    }
    return h("div", { class: "mr-view" }, svg);
  },
  controls(ctx) {
    const { state, act, lang } = ctx;
    const es = lang === "es";
    const barControls = (id) =>
      group(id === "a" ? (es ? "Primera barra" : "First bar") : es ? "Segunda barra" : "Second bar",
        fieldLabel(id === "a" ? (es ? "Primera barra: cortar cada parte" : "First bar: cut every part") : es ? "Segunda barra: cortar cada parte" : "Second bar: cut every part"),
        ...[2, 3, 4].map((n) => btn(`×${n}`, () => act({ type: "on", bar: id, act: { type: "split", n } }), { disabled: state.combined, key: `${id}-split-${n}`, aria: `${id === "a" ? (es ? "Primera" : "First") : es ? "Segunda" : "Second"} ${es ? "barra" : "bar"}: ×${n}` })));
    return h("div", { class: "mr-controls" }, barControls("a"), barControls("b"), row(btn(es ? "Combinar las barras" : "Combine the bars", () => act({ type: "combine" }), { cls: "is-primary", key: "combine" })));
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [
      ["sizes", h("span", { class: "mr-ro" }, d.sameSize ? (lang === "es" ? "Mismo tamaño" : "Same size") : lang === "es" ? "Distinto tamaño" : "Different sizes")],
      ["sum", h("span", { class: "mr-ro" }, d.combined ? frac(d.total.n, d.total.d) : "?")],
    ];
  },
};

// ---- X-Ray division bar ----------------------------------------------------------------------------------------------------------------
const GROUP_COLORS = ["g1", "g2", "g3", "g4", "g5", "g6"];
export const fracdivView = {
  render(ctx) {
    const { state, d, act, xray, lang } = ctx;
    const es = lang === "es";
    const svg = svgRoot(250, ctx.describe());
    const cells = d.cells;
    const cell = BAR.w / cells;
    svg.append(text(BAR.x, 22, `${state.a.n}/${state.a.d} ÷ ${state.b.n}/${state.b.d}`, "mr-bar-title", "start"));
    svg.append(s("rect", { x: BAR.x - 4, y: 36, width: BAR.w + 8, height: 74, class: "mr-bar-frame", rx: 8 }));
    for (let i = 0; i < d.dividendCells; i++) {
      const gi = d.groups.findIndex((g) => i >= g.from && i < g.to);
      const marked = state.marked.includes(gi);
      const el = s("rect", { x: BAR.x + i * cell, y: 40, width: cell, height: 66, class: `mr-part-rect is-on ${state.split && marked ? `is-${GROUP_COLORS[gi % 6]}` : ""} ${xray && state.split ? "is-xray" : ""}`, rx: 3 });
      svg.append(el);
    }
    for (let i = d.dividendCells; i < cells; i++) svg.append(s("rect", { x: BAR.x + i * cell, y: 40, width: cell, height: 66, class: "mr-part-rect", rx: 3 }));
    if (!state.split) {
      svg.append(text(320, 80, es ? "La barra aún no está cortada en piezas iguales" : "The bar is not cut into same-size pieces yet", "mr-whole-label"));
      for (let i = 0; i <= state.a.d; i++) svg.append(s("line", { x1: BAR.x + (BAR.w * i) / state.a.d, y1: 36, x2: BAR.x + (BAR.w * i) / state.a.d, y2: 110, class: "mr-cut" }));
    } else {
      if (xray) for (let i = 0; i < cells; i++) svg.append(text(BAR.x + i * cell + cell / 2, 78 + 5, `1/${d.unit}`, "mr-part-label is-xray"));
      d.groups.forEach((g, gi) => {
        const x = BAR.x + g.from * cell;
        const wdt = (g.to - g.from) * cell;
        const marked = state.marked.includes(gi);
        const grp = s("g", { class: `mr-group-box ${marked ? "is-marked" : ""}`, "data-key": `group-${gi}`, tabindex: 0, role: "checkbox", "aria-checked": String(marked), "aria-label": es ? `Grupo ${gi + 1}` : `Group ${gi + 1}` });
        grp.append(s("rect", { x: x + 1, y: 120, width: wdt - 2, height: 44, rx: 10, class: "mr-group-rect" }));
        grp.append(text(x + wdt / 2, 148, marked ? String(state.marked.filter((m) => m <= gi).length) : "?", "mr-group-num"));
        grp.addEventListener("click", () => act({ type: "mark", g: gi }));
        grp.addEventListener("keydown", (e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            act({ type: "mark", g: gi });
          }
        });
        svg.append(grp);
      });
    }
    const eq = d.markedAll ? `${state.a.n}/${state.a.d} ÷ ${state.b.n}/${state.b.d} = ${d.quotientText}` : state.marked.length ? `${es ? "Contados hasta ahora" : "Counted so far"}: ${state.marked.length}` : `${state.a.n}/${state.a.d} ÷ ${state.b.n}/${state.b.d} = ?`;
    svg.append(text(BAR.x, 214, eq, "mr-eq-line", "start"));
    if (xray && state.split) svg.append(text(BAR.x, 240, `${state.a.n}/${state.a.d} = ${d.dividendCells}/${d.unit}   ·   ${state.b.n}/${state.b.d} = ${d.groupCells}/${d.unit}   ·   ${d.dividendCells} ÷ ${d.groupCells}`, "mr-xray-line", "start"));
    return h("div", { class: "mr-view" }, svg);
  },
  controls(ctx) {
    const { state, act, lang } = ctx;
    const es = lang === "es";
    return h("div", { class: "mr-controls" },
      row(
        btn(es ? "Cortar en piezas del mismo tamaño" : "Cut into same-size pieces", () => act({ type: "split" }), { disabled: state.split, cls: "is-primary", key: "split" }),
        btn(es ? "Contar el siguiente grupo" : "Count the next group", () => act({ type: "markNext" }), { key: "mark-next" }),
        btn(es ? "Borrar el conteo" : "Clear the count", () => act({ type: "clearMarks" }), { key: "clear" }),
      ),
    );
  },
  readout(ctx) {
    const { d, state, lang } = ctx;
    return [
      ["groups", h("span", { class: "mr-ro" }, `${state.marked.length} / ${d.groups.length} ${lang === "es" ? "grupos" : "groups"}`)],
      ["answer", h("span", { class: "mr-ro mr-big" }, d.markedAll ? d.quotientText : "?")],
    ];
  },
};

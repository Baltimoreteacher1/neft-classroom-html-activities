// Views for place-value mats, signed chips, ten-frames and the hopping number line.
import { fracText } from "../kernel.js";
import { btn, group, h, row, s, stepper, svgRoot, text, fieldLabel, minus } from "./common.js";

// ---- place value ------------------------------------------------------------------------------------------------------------------------
const PIECE = {
  thousands: { w: 34, h: 34 },
  hundreds: { w: 30, h: 30 },
  tens: { w: 10, h: 34 },
  ones: { w: 12, h: 12 },
  tenths: { w: 14, h: 44 },
  hundredths: { w: 10, h: 10 },
};

function mat(ctx, id, counts, title) {
  const { d, xray } = ctx;
  const places = d.places;
  const svg = svgRoot(150, title);
  const colW = 600 / places.length;
  places.forEach((p, i) => {
    const x0 = 20 + i * colW;
    svg.append(s("rect", { x: x0 + 3, y: 28, width: colW - 6, height: 114, rx: 10, class: "mr-col" }));
    svg.append(text(x0 + colW / 2, 20, `${p.name[ctx.lang]}${xray ? ` · ${p.value.d === 1n ? p.value.n : `1/${p.value.d}`}` : ""}`, "mr-col-title"));
    const size = PIECE[p.id];
    const perRow = Math.max(1, Math.floor((colW - 14) / (size.w + 4)));
    for (let k = 0; k < counts[p.id]; k++) {
      const cx = x0 + 10 + (k % perRow) * (size.w + 4);
      const cy = 36 + Math.floor(k / perRow) * (size.h + 4);
      if (cy + size.h > 140) break;
      svg.append(s("rect", { x: cx, y: cy, width: size.w, height: size.h, rx: 2, class: `mr-pc mr-pc-${p.id}` }));
    }
    svg.append(text(x0 + colW - 12, 138, String(counts[p.id]), "mr-count", "end"));
  });
  return svg;
}

export const placeView = {
  render(ctx) {
    const { d, lang } = ctx;
    const es = lang === "es";
    const wrap = h("div", { class: "mr-view" });
    if (d.combined) wrap.append(mat(ctx, "T", d.counts, es ? "Tablero con todas las piezas" : "Mat with all the pieces"));
    else for (const [id, r] of Object.entries(d.rows)) wrap.append(h("p", { class: "mr-mat-title" }, `${es ? "Número" : "Number"} ${id}: ${r.value.d === 1n ? r.value.n : `${r.value.n}/${r.value.d}`}`.replace(/(\d+)\/(\d+)/, (m, a, b) => (Number(b) % 10 === 0 ? String(Number(a) / Number(b)) : m))), mat(ctx, id, r.counts, `${es ? "Número" : "Number"} ${id}`));
    return wrap;
  },
  controls(ctx) {
    const { d, act, lang } = ctx;
    const es = lang === "es";
    const rows = d.combined ? ["T"] : Object.keys(d.rows);
    const rowControls = (id) =>
      group(`${es ? "Número" : "Number"} ${id}`,
        fieldLabel(id === "T" ? (es ? "Piezas" : "Pieces") : `${es ? "Número" : "Number"} ${id}`),
        ...d.places.flatMap((p) => [
          btn(`+1 ${p.name[lang]}`, () => act({ type: "add", row: id, place: p.id, n: 1 }), { key: `${id}-${p.id}-add1`, aria: `${es ? "Agregar uno" : "Add one"} ${p.name[lang]}` }),
          btn(`+5`, () => act({ type: "add", row: id, place: p.id, n: 5 }), { key: `${id}-${p.id}-add5`, aria: `${es ? "Agregar cinco" : "Add five"} ${p.name[lang]}` }),
          btn(`−1`, () => act({ type: "remove", row: id, place: p.id, n: 1 }), { key: `${id}-${p.id}-rem`, aria: `${es ? "Quitar uno" : "Take away one"} ${p.name[lang]}` }),
        ]));
    const trades = d.combined
      ? group(es ? "Cambiar" : "Trade", fieldLabel(es ? "Cambiar" : "Trade"), ...d.places.slice(1).map((p, i) => btn(`10 ${p.name[lang]} → 1 ${d.places[i].name[lang]}`, () => act({ type: "trade", place: p.id }), { key: `trade-${p.id}`, cls: "is-primary", aria: es ? `Cambiar 10 ${p.name[lang]} por 1 ${d.places[i].name[lang]}` : `Trade 10 ${p.name[lang]} for 1 ${d.places[i].name[lang]}` })), ...d.places.slice(0, -1).map((p, i) => btn(`1 ${p.name[lang]} → 10 ${d.places[i + 1].name[lang]}`, () => act({ type: "unpack", place: p.id }), { key: `unpack-${p.id}`, aria: es ? `Descomponer 1 ${p.name[lang]} en 10 ${d.places[i + 1].name[lang]}` : `Break 1 ${p.name[lang]} into 10 ${d.places[i + 1].name[lang]}` })))
      : null;
    return h("div", { class: "mr-controls" }, ...rows.filter((id) => d.combined ? Object.keys(ctx.state.rows).length === 1 : true).map(rowControls), !d.combined && Object.keys(d.rows).length > 1 ? row(btn(es ? "Unir los números" : "Join the numbers", () => act({ type: "combine" }), { cls: "is-primary", key: "combine" })) : null, trades);
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [
      ["total", h("span", { class: "mr-ro mr-big" }, d.totalText)],
      d.combined ? ["expanded", h("span", { class: "mr-ro" }, d.expanded.map((e) => `${e.count} ${e.name[lang]}`).join(" + ") || "0")] : null,
      d.combined ? ["regrouped", h("span", { class: `mr-ro ${d.regrouped ? "is-ok" : ""}` }, d.regrouped ? (lang === "es" ? "Ningún lugar tiene 10 o más" : "No place has 10 or more") : lang === "es" ? "Aún hay 10 o más en un lugar" : "A place still has 10 or more")] : null,
    ].filter(Boolean);
  },
};

// ---- chips -----------------------------------------------------------------------------------------------------------------------------------
export const chipsView = {
  render(ctx) {
    const { d, xray, lang } = ctx;
    const svg = svgRoot(190, ctx.describe());
    const cell = 34;
    const draw = (n, sign, y, pairsFirst) => {
      for (let i = 0; i < n; i++) {
        const x = 30 + (i % 16) * cell + 15;
        const cy = y + Math.floor(i / 16) * cell;
        const inPair = i < pairsFirst;
        svg.append(s("circle", { cx: x, cy, r: 14, class: `mr-chip is-${sign} ${xray && inPair ? "is-pair" : ""}` }));
        svg.append(text(x, cy + 6, sign === "pos" ? "+" : "−", "mr-chip-t"));
      }
    };
    draw(d.pos, "pos", 40, d.pairs);
    draw(d.neg, "neg", 120, d.pairs);
    if (xray) for (let i = 0; i < d.pairs; i++) svg.append(s("line", { x1: 30 + (i % 16) * cell + 15, y1: 56, x2: 30 + (i % 16) * cell + 15, y2: 104, class: "mr-pair-link" }));
    svg.append(text(30, 20, lang === "es" ? "Positivas" : "Positive", "mr-bar-title", "start"));
    svg.append(text(30, 100, lang === "es" ? "Negativas" : "Negative", "mr-bar-title", "start"));
    return h("div", { class: "mr-view" }, svg);
  },
  controls(ctx) {
    const { act, lang } = ctx;
    const es = lang === "es";
    return h("div", { class: "mr-controls" }, row(
      btn("+ 1", () => act({ type: "add", sign: "pos" }), { key: "add-pos", aria: es ? "Agregar una ficha positiva" : "Add a positive chip" }),
      btn("− 1", () => act({ type: "add", sign: "neg" }), { key: "add-neg", aria: es ? "Agregar una ficha negativa" : "Add a negative chip" }),
      btn(es ? "Quitar +" : "Take away +", () => act({ type: "remove", sign: "pos" }), { key: "rem-pos" }),
      btn(es ? "Quitar −" : "Take away −", () => act({ type: "remove", sign: "neg" }), { key: "rem-neg" }),
      btn(es ? "Agregar un par cero" : "Add a zero pair", () => act({ type: "addZeroPair" }), { key: "zp-add" }),
      btn(es ? "Quitar un par cero" : "Remove a zero pair", () => act({ type: "cancel" }), { key: "zp-cancel", cls: "is-primary" }),
    ));
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [["value", h("span", { class: "mr-ro mr-big" }, minus(d.value))], ["pairs", h("span", { class: "mr-ro" }, `${d.pairs} ${lang === "es" ? "pares cero" : "zero pairs"}`)]];
  },
};

// ---- ten-frame ---------------------------------------------------------------------------------------------------------------------------------
export const tenframeView = {
  render(ctx) {
    const { state, d, act, ui, lang } = ctx;
    const frames = state.frames;
    const svg = svgRoot(frames * 150 + 20, ctx.describe());
    const total = state.a + state.b;
    for (let f = 0; f < frames; f++) {
      const oy = 14 + f * 148;
      for (let i = 0; i < 10; i++) {
        const idx = f * 10 + i;
        const x = 70 + (i % 5) * 98;
        const y = oy + Math.floor(i / 5) * 66;
        const color = idx < state.a ? "a" : idx < total ? "b" : null;
        const g = s("g", { class: "mr-cell", "data-key": `cell-${idx}`, tabindex: 0, role: "button", "aria-label": color ? (lang === "es" ? "Quitar ficha" : "Remove counter") : lang === "es" ? "Poner ficha" : "Place counter" });
        g.append(s("rect", { x, y, width: 90, height: 60, rx: 8, class: "mr-cell-rect" }));
        if (color) g.append(s("circle", { cx: x + 45, cy: y + 30, r: 24, class: `mr-counter is-${color}` }));
        const press = () => act(color ? { type: "remove", color } : { type: "add", color: ui.color || "a" });
        g.addEventListener("click", press);
        g.addEventListener("keydown", (e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            press();
          }
        });
        svg.append(g);
      }
    }
    return h("div", { class: "mr-view" }, svg);
  },
  controls(ctx) {
    const { act, ui, lang } = ctx;
    const es = lang === "es";
    const color = ui.color || "a";
    return h("div", { class: "mr-controls" }, row(
      btn(es ? "Fichas rojas" : "Red counters", () => ui.set({ color: "a" }), { pressed: color === "a", key: "color-a", cls: "is-red" }),
      btn(es ? "Fichas amarillas" : "Yellow counters", () => ui.set({ color: "b" }), { pressed: color === "b", key: "color-b", cls: "is-yellow" }),
      btn(es ? "Poner una" : "Add one", () => act({ type: "add", color }), { key: "add", cls: "is-primary" }),
      btn(es ? "Quitar una" : "Take one away", () => act({ type: "remove", color }), { key: "rem" }),
    ));
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [["equation", h("span", { class: "mr-ro mr-big" }, d.equation)], ["toTen", h("span", { class: "mr-ro" }, `${d.toTen} ${lang === "es" ? "para llegar a la siguiente decena" : "more to reach the next ten"}`)]];
  },
};

// ---- number line with hops --------------------------------------------------------------------------------------------------------------------------
export const numlineView = {
  render(ctx) {
    const { state, d, lang } = ctx;
    const min = Number(state.min.n) / Number(state.min.d);
    const max = Number(state.max.n) / Number(state.max.d);
    const X = (v) => 30 + (580 * (v - min)) / (max - min);
    const svg = svgRoot(170, ctx.describe());
    svg.append(s("line", { x1: 30, y1: 110, x2: 610, y2: 110, class: "mr-axis" }));
    const every = max - min <= 24 ? 1 : max - min <= 60 ? 5 : 10;
    for (let v = Math.ceil(min / every) * every; v <= max; v += every) {
      svg.append(s("line", { x1: X(v), y1: 102, x2: X(v), y2: 118, class: "mr-tick" }));
      svg.append(text(X(v), 138, String(v), "mr-tick-label"));
    }
    let cur = Number(state.start.n) / Number(state.start.d);
    d.hops.forEach((hp) => {
      const by = Number(hp.n) / Number(hp.d);
      const x1 = X(cur);
      const x2 = X(cur + by);
      svg.append(s("path", { d: `M ${x1} 108 Q ${(x1 + x2) / 2} ${108 - Math.min(70, Math.abs(x2 - x1) * 0.6 + 14)} ${x2} 108`, class: "mr-hop" }));
      svg.append(text((x1 + x2) / 2, 108 - Math.min(70, Math.abs(x2 - x1) * 0.3 + 10) - 2, minus(fracText(hp.sign() < 0 ? hp : hp)), "mr-hop-label"));
      cur += by;
    });
    const pos = Number(d.pos.n) / Number(d.pos.d);
    svg.append(s("circle", { cx: X(pos), cy: 110, r: 11, class: "mr-dot is-main" }));
    svg.append(text(X(pos), 160, minus(fracText(d.pos)), "mr-dot-label"));
    return h("div", { class: "mr-view" }, svg, h("p", { class: "mr-eq-line", "aria-live": "off" }, d.equation));
  },
  controls(ctx) {
    const { act, d, ui, lang } = ctx;
    const es = lang === "es";
    const size = ui.size ?? String(d.step);
    return h("div", { class: "mr-controls" }, row(
      h("label", { class: "mr-field" }, h("span", { class: "mr-field-label" }, es ? "Tamaño del salto" : "Hop size"), h("input", { class: "mr-input", type: "text", inputmode: "decimal", value: size, "data-key": "hop-size", "aria-label": es ? "Tamaño del salto" : "Hop size", on: { input: (e) => ui.set({ size: e.target.value }, false) } })),
      btn(`${es ? "Saltar +" : "Hop +"}`, () => act({ type: "hop", by: size }), { key: "hop-fwd", cls: "is-primary", aria: es ? "Saltar hacia adelante" : "Hop forward" }),
      btn(`${es ? "Saltar −" : "Hop −"}`, () => act({ type: "hop", by: `-${size}` }), { key: "hop-back", aria: es ? "Saltar hacia atrás" : "Hop backward" }),
    ));
  },
  readout(ctx) {
    const { d, lang } = ctx;
    return [["position", h("span", { class: "mr-ro mr-big" }, minus(fracText(d.pos)))], ["hops", h("span", { class: "mr-ro" }, `${d.count} ${lang === "es" ? "saltos" : "hops"}`)]];
  },
};

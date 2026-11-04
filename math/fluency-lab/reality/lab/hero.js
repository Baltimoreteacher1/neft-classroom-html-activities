// The Reality Lab hero: one interactive model, not an illustration. Change the rows and the size of each group and the
// array, the equal groups, the number-line jumps and the equations all update from the same two integers.
import { L, say } from "./kernel.js";
import { btn, h, s, text } from "./views/common.js";

export const heroLimits = (grade) => (grade <= 2 ? { rows: [1, 4], cols: [1, 5] } : { rows: [1, 6], cols: [1, 8] });

// Pure: everything the picture shows is derived here, so the tests can check it without a browser.
export function heroModel(rows, cols) {
  const total = rows * cols;
  const stops = Array.from({ length: rows + 1 }, (_, i) => i * cols);
  return {
    rows,
    cols,
    total,
    stops,
    product: `${rows} × ${cols} = ${total}`,
    repeated: `${Array.from({ length: rows }, () => cols).join(" + ")} = ${total}`,
    division: `${total} ÷ ${cols} = ${rows}`,
  };
}

const UI = {
  rows: L("Groups", "Grupos"),
  cols: L("In each group", "En cada grupo"),
  headline: L("See it. Change it. Understand it.", "Mírala. Cámbiala. Entiéndela."),
  sub: L("Every picture below is built from the same two numbers. Change one and the array, the groups, the jumps and the equations all change with it.", "Cada imagen de abajo se construye con los mismos dos números. Cambia uno y la matriz, los grupos, los saltos y las ecuaciones cambian con él."),
  live: L("{rows} groups of {cols} make {total}.", "{rows} grupos de {cols} forman {total}."),
};

export function mountHero(host, { grade, lang, tx }) {
  const limits = heroLimits(grade);
  const state = { rows: 3, cols: 4 };
  const live = h("p", { class: "mr-live", role: "status", "aria-live": "polite" });
  function step(key, delta) {
    const [lo, hi] = limits[key];
    state[key] = Math.min(hi, Math.max(lo, state[key] + delta));
    render();
    live.textContent = say(UI.live, lang, heroModel(state.rows, state.cols));
  }
  function stepper(key, label) {
    const [lo, hi] = limits[key];
    return h("div", { class: "mr-stepper", role: "group", "aria-label": tx(label) },
      h("span", { class: "mr-field-label" }, tx(label)),
      btn("−", () => step(key, -1), { cls: "mr-step", disabled: state[key] <= lo, aria: `${tx(label)}: −`, key: `hero-${key}-minus` }),
      h("output", { class: "mr-step-val" }, String(state[key])),
      btn("+", () => step(key, 1), { cls: "mr-step", disabled: state[key] >= hi, aria: `${tx(label)}: +`, key: `hero-${key}-plus` }));
  }
  function picture(m) {
    const svg = s("svg", { viewBox: "0 0 640 270", class: "mr-hero-svg", role: "img", "aria-label": say(UI.live, lang, m), preserveAspectRatio: "xMidYMid meet" });
    const cell = Math.min(34, 190 / m.rows, 230 / m.cols);
    const ox = 24;
    const oy = 20;
    for (let r = 0; r < m.rows; r++) {
      svg.append(s("rect", { x: ox - 6, y: oy + r * cell - 3, width: m.cols * cell + 12, height: cell + 2, rx: (cell + 2) / 2, class: "mr-hero-group" }));
      for (let c = 0; c < m.cols; c++) svg.append(s("circle", { cx: ox + c * cell + cell / 2, cy: oy + r * cell + cell / 2 - 2, r: cell * 0.36, class: `mr-hero-dot is-${"abc"[r % 3]}` }));
    }
    svg.append(text(ox, oy + m.rows * cell + 22, m.product, "mr-hero-eq", "start"));
    // number line: one jump per group, each as long as a group
    const x0 = 330;
    const x1 = 620;
    const span = Math.max(m.total, 1);
    const X = (v) => x0 + ((x1 - x0) * v) / span;
    const y = 150;
    svg.append(s("line", { x1: x0, y1: y, x2: x1, y2: y, class: "mr-hero-axis" }));
    m.stops.forEach((v, i) => {
      svg.append(s("line", { x1: X(v), y1: y - 6, x2: X(v), y2: y + 6, class: "mr-hero-axis" }));
      svg.append(text(X(v), y + 24, v, "mr-hero-tick"));
      if (i < m.rows) svg.append(s("path", { d: `M ${X(v)} ${y - 4} Q ${(X(v) + X(m.stops[i + 1])) / 2} ${y - 4 - Math.min(70, (X(m.stops[i + 1]) - X(v)) * 0.6)} ${X(m.stops[i + 1])} ${y - 4}`, class: `mr-hero-hop is-${"abc"[i % 3]}` }));
    });
    svg.append(text(x0, 40, m.repeated, "mr-hero-eq2", "start"));
    svg.append(text(x0, 228, m.division, "mr-hero-eq2", "start"));
    return svg;
  }
  const wrap = h("section", { class: "mr-hero-model", "aria-labelledby": "hero-h" });
  function render() {
    const m = heroModel(state.rows, state.cols);
    wrap.replaceChildren(
      h("h2", { id: "hero-h", class: "mr-hero-h" }, tx(UI.headline)),
      h("p", { class: "mr-hero-sub" }, tx(UI.sub)),
      h("div", { class: "mr-hero-controls" }, stepper("rows", UI.rows), stepper("cols", UI.cols)),
      picture(m),
      live);
  }
  render();
  host.append(wrap);
  return wrap;
}

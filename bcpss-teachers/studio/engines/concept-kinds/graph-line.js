// concept-builder kind: graph-line. Drag two points on a coordinate plane to build a line; the slope, equation and
// table of values update live (exact rational arithmetic).
import { h } from "../../core/dom.js";
import { FORMATS, Fraction, fmtFor } from "./rational.js";
import { clone, draggable, svg, toSvgPoint } from "./shared.js";

const W = 520;
const H = 420;
const L = 52;
const R = 16;
const T = 14;
const B = 46;

const bounds = (m) => ({
  x0: Fraction.must(m.xmin ?? 0),
  x1: Fraction.must(m.xmax ?? 10),
  y0: Fraction.must(m.ymin ?? 0),
  y1: Fraction.must(m.ymax ?? 10),
  grid: Fraction.must(m.grid ?? 1),
});

function line(pts) {
  const [p, q] = pts.map(([x, y]) => [Fraction.must(x), Fraction.must(y)]);
  const dx = q[0].sub(p[0]);
  if (dx.isZero()) return p[1].eq(q[1]) ? { degenerate: true } : { vertical: true, x: p[0] };
  const m = q[1].sub(p[1]).div(dx);
  return { m, b: p[1].sub(m.mul(p[0])) };
}

/** `f` formats one number for display (the model's `format`); the default prints exact fractions. */
function equation(ln, f = (v) => v.toString()) {
  if (ln.degenerate) return "not a line yet (the points are the same)";
  if (ln.vertical) return `x = ${f(ln.x)}`;
  const { m, b } = ln;
  const mx = m.isZero() ? "" : m.eq(1) ? "x" : m.eq(-1) ? "-x" : `${f(m)}x`;
  if (!mx) return `y = ${f(b)}`;
  if (b.isZero()) return `y = ${mx}`;
  return `y = ${mx} ${b.sign() < 0 ? "-" : "+"} ${f(b.abs())}`;
}
const shower = (m) => (v) => fmtFor(Fraction.must(v), m);

const onGrid = (v, lo, hi, grid) => v && v.ge(lo) && v.le(hi) && v.sub(lo).div(grid).isInt();

export default {
  id: "graph-line",

  validateModel(m) {
    const out = [];
    if (!m.xLabel || !m.yLabel) out.push("model.xLabel and model.yLabel required");
    const b = bounds(m);
    if (b.x0.ge(b.x1) || b.y0.ge(b.y1) || b.grid.sign() <= 0) out.push("bounds must satisfy min < max and grid > 0");
    const nx = b.x1.sub(b.x0).div(b.grid);
    const ny = b.y1.sub(b.y0).div(b.grid);
    if (!nx.isInt() || !ny.isInt() || nx.n > 60n || ny.n > 60n) out.push("(max - min) / grid must be an integer 1..60 on both axes");
    if (!Array.isArray(m.points) || m.points.length !== 2) out.push("model.points needs exactly 2 points");
    for (const p of [...(m.points || []), ...(m.given || [])]) {
      if (!p.id || !p.label || !Array.isArray(p.at) || p.at.length !== 2) out.push("each point needs id, label and at:[x,y]");
      else if (!onGrid(Fraction.parse(p.at[0]), b.x0, b.x1, b.grid) || !onGrid(Fraction.parse(p.at[1]), b.y0, b.y1, b.grid)) out.push(`point ${p.id} is off the grid or outside the plane`);
    }
    if ((m.given || []).length > 4) out.push("at most 4 given points");
    if (m.format != null && !FORMATS.includes(m.format)) out.push(`model.format must be one of ${FORMATS.join(", ")}`);
    if (m.decimals != null && !(Number.isInteger(m.decimals) && m.decimals >= 0 && m.decimals <= 4)) out.push("model.decimals must be an integer 0..4");
    for (const x of m.tableXs || []) if (!Fraction.parse(x)) out.push(`tableXs: "${x}" is not rational`);
    return out;
  },

  initialState(m) {
    const pts = {};
    for (const p of m.points) pts[p.id] = [Fraction.must(p.at[0]).toString(), Fraction.must(p.at[1]).toString()];
    return { pts };
  },

  validateState(m, s) {
    const b = bounds(m);
    return m.points.flatMap((p) => {
      const v = s?.pts?.[p.id];
      return v && onGrid(Fraction.parse(v[0]), b.x0, b.x1, b.grid) && onGrid(Fraction.parse(v[1]), b.y0, b.y1, b.grid) ? [] : [`state.pts.${p.id} is invalid`];
    });
  },

  value(m, s) {
    const ln = line(m.points.map((p) => s.pts[p.id]));
    const table = {};
    for (const x of m.tableXs || ["0", "1", "2", "3", "4", "5"]) {
      const fx = Fraction.must(x);
      table[fx.toString()] = ln.m ? ln.m.mul(fx).add(ln.b).toString() : "undefined";
    }
    const passes = {};
    for (const g of m.given || []) {
      const [gx, gy] = g.at.map((v) => Fraction.must(v));
      passes[g.id] = ln.degenerate ? "false" : ln.vertical ? String(gx.eq(ln.x)) : String(ln.m.mul(gx).add(ln.b).eq(gy));
    }
    const out = {
      slope: ln.m ? ln.m.toString() : "undefined",
      intercept: ln.m ? ln.b.toString() : "undefined",
      vertical: String(!!ln.vertical),
      equation: equation(ln),
      table,
      passes,
    };
    for (const p of m.points) out[p.id] = s.pts[p.id].map((v) => Fraction.must(v).toString());
    return out;
  },

  describe(m, s) {
    const ln = line(m.points.map((p) => s.pts[p.id]));
    const f = shower(m);
    return `${m.points.map((p) => `${p.label} at (${s.pts[p.id].map(f).join(", ")})`).join(", ")}; ${equation(ln, f)}`;
  },

  mount(host, { model, state, onChange, announce }) {
    const b = bounds(model);
    const f = shower(model);
    let st = clone(state);
    const xs = (v) => L + (Fraction.must(v).sub(b.x0).toNumber() / b.x1.sub(b.x0).toNumber()) * (W - L - R);
    const ys = (v) => H - B - (Fraction.must(v).sub(b.y0).toNumber() / b.y1.sub(b.y0).toNumber()) * (H - T - B);
    const nx = Number(b.x1.sub(b.x0).div(b.grid).n);
    const ny = Number(b.y1.sub(b.y0).div(b.grid).n);
    const every = (n) => Math.max(1, Math.ceil(n / 10));
    const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "st-cb-gl", role: "group", "aria-label": `Coordinate plane. ${model.xLabel} across, ${model.yLabel} up.` });
    const clipId = `st-cb-clip-${Math.random().toString(36).slice(2, 7)}`;
    root.append(svg("defs", {}, svg("clipPath", { id: clipId }, svg("rect", { x: L, y: T, width: W - L - R, height: H - T - B }))));
    for (let i = 0; i <= nx; i++) {
      const v = b.x0.add(b.grid.mul(i));
      root.append(svg("line", { x1: xs(v), x2: xs(v), y1: T, y2: H - B, class: i % every(nx) ? "st-cb-grid minor" : "st-cb-grid" }));
      if (i % every(nx) === 0) root.append(svg("text", { x: xs(v), y: H - B + 18, class: "st-cb-tick-label", "text-anchor": "middle" }, f(v)));
    }
    for (let i = 0; i <= ny; i++) {
      const v = b.y0.add(b.grid.mul(i));
      root.append(svg("line", { x1: L, x2: W - R, y1: ys(v), y2: ys(v), class: i % every(ny) ? "st-cb-grid minor" : "st-cb-grid" }));
      if (i % every(ny) === 0) root.append(svg("text", { x: L - 8, y: ys(v) + 5, class: "st-cb-tick-label", "text-anchor": "end" }, f(v)));
    }
    root.append(svg("rect", { x: L, y: T, width: W - L - R, height: H - T - B, class: "st-cb-frame", fill: "none" }));
    root.append(svg("text", { x: (L + W - R) / 2, y: H - 8, class: "st-cb-axis-title", "text-anchor": "middle" }, model.xLabel));
    root.append(svg("text", { x: 14, y: (T + H - B) / 2, class: "st-cb-axis-title", "text-anchor": "middle", transform: `rotate(-90 14 ${(T + H - B) / 2})` }, model.yLabel));
    const lineEl = svg("line", { class: "st-cb-line", "clip-path": `url(#${clipId})` });
    root.append(lineEl);
    for (const g of model.given || []) {
      const [gx, gy] = g.at;
      root.append(svg("g", { class: "st-cb-given", role: "img", "aria-label": `${g.label}, given point at (${f(gx)}, ${f(gy)})`, transform: `translate(${xs(gx)} ${ys(gy)})` }, svg("rect", { x: -8, y: -8, width: 16, height: 16, transform: "rotate(45)" }), svg("text", { x: 12, y: -10 }, g.label)));
    }

    const status = h("p", { class: "st-cb-readout", role: "status" });
    const tableWrap = h("div", { class: "st-cb-scroll" });
    host.replaceChildren(h("div", { class: "st-cb-gl-wrap" }, root), status, model.showTable === false ? null : tableWrap);

    const nodes = [];
    const idxFrom = (ev) => {
      const p = toSvgPoint(root, ev);
      const ix = Math.max(0, Math.min(nx, Math.round(((p.x - L) / (W - L - R)) * nx)));
      const iy = Math.max(0, Math.min(ny, Math.round(((H - B - p.y) / (H - T - B)) * ny)));
      return [b.x0.add(b.grid.mul(ix)), b.y0.add(b.grid.mul(iy))];
    };
    const move = (id, x, y, note) => {
      x = x.lt(b.x0) ? b.x0 : x.gt(b.x1) ? b.x1 : x;
      y = y.lt(b.y0) ? b.y0 : y.gt(b.y1) ? b.y1 : y;
      const next = [x.toString(), y.toString()];
      if (st.pts[id].join() === next.join()) return;
      st.pts[id] = next;
      sync();
      onChange(clone(st));
      if (note) announce(note);
    };
    const equationNow = () => equation(line(model.points.map((p) => st.pts[p.id])), f);
    const at = (id) => st.pts[id].map(f).join(", ");

    model.points.forEach((p, i) => {
      const g = svg("g", { class: `st-cb-handle gp-${i}`, tabindex: "0", role: "slider", "aria-label": `${p.label}, point on the graph` });
      g.append(svg("circle", { class: "st-cb-hit", r: 38 }), svg("circle", { class: "st-cb-dot", r: 11 }), svg("text", { class: "st-cb-dot-label", x: 16, y: -14 }, p.label));
      draggable(g, {
        onStart: (ev) => { g.focus(); const [x, y] = idxFrom(ev); move(p.id, x, y); },
        onMove: (ev) => { const [x, y] = idxFrom(ev); move(p.id, x, y); },
        onEnd: () => announce(`${p.label} at (${at(p.id)}). ${equationNow()}`),
      });
      g.addEventListener("keydown", (ev) => {
        const step = ev.key.startsWith("Page") ? 5 : 1;
        const dx = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        const dy = ev.key === "ArrowUp" || ev.key === "PageUp" ? 1 : ev.key === "ArrowDown" || ev.key === "PageDown" ? -1 : 0;
        if (!dx && !dy) return;
        ev.preventDefault();
        const [cx, cy] = st.pts[p.id].map((v) => Fraction.must(v));
        move(p.id, cx.add(b.grid.mul(dx * step)), cy.add(b.grid.mul(dy * step)));
        announce(`${p.label} at (${at(p.id)}). ${equationNow()}`);
      });
      root.append(g);
      nodes.push(() => {
        const [x, y] = st.pts[p.id];
        g.setAttribute("transform", `translate(${xs(x)} ${ys(y)})`);
        g.setAttribute("aria-valuenow", String(Fraction.must(x).toNumber()));
        g.setAttribute("aria-valuetext", `${p.label} at x ${f(x)}, y ${f(y)}`);
      });
    });

    function sync() {
      for (const n of nodes) n();
      const ln = line(model.points.map((p) => st.pts[p.id]));
      if (ln.degenerate) lineEl.setAttribute("visibility", "hidden");
      else {
        lineEl.removeAttribute("visibility");
        if (ln.vertical) {
          Object.entries({ x1: xs(ln.x), x2: xs(ln.x), y1: T, y2: H - B }).forEach(([k, v]) => lineEl.setAttribute(k, v));
        } else {
          const y = (x) => ln.m.mul(x).add(ln.b);
          Object.entries({ x1: xs(b.x0), x2: xs(b.x1), y1: ys(y(b.x0)), y2: ys(y(b.x1)) }).forEach(([k, v]) => lineEl.setAttribute(k, v));
        }
      }
      status.replaceChildren(
        h("strong", {}, "Line: "),
        equation(ln, f),
        h("br"),
        ln.m ? h("span", {}, h("strong", {}, "Slope (rate): "), f(ln.m), model.rateLabel ? ` ${model.rateLabel}` : "") : h("span", {}, h("strong", {}, "Slope: "), "undefined"),
      );
      if (model.showTable !== false) {
        const xsList = model.tableXs || ["0", "1", "2", "3", "4", "5"];
        tableWrap.replaceChildren(
          h(
            "table",
            { class: "st-cb-table st-cb-xy" },
            h("caption", {}, "Table of values on the line"),
            h("tr", {}, h("th", { scope: "row" }, model.xLabel.split(" ")[0]), xsList.map((x) => h("td", {}, f(x)))),
            h("tr", {}, h("th", { scope: "row" }, model.yLabel.split(" ")[0]), xsList.map((x) => h("td", {}, ln.m ? f(ln.m.mul(Fraction.must(x)).add(ln.b)) : "no value"))),
          ),
        );
      }
    }
    sync();
    return {
      setState(s) {
        st = clone(s);
        sync();
      },
    };
  },
};

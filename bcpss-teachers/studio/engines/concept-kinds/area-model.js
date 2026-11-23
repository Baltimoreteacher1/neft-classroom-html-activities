// concept-builder kind: area-model. "partial": cut a w x h rectangle into partial products.
// "unit-square": partition a unit square into rows and columns and shade cells (product of fractions).
import { h } from "../../core/dom.js";
import { Fraction, sum } from "./rational.js";
import { clone, sliderKey, stepper, svg, toSvgPoint } from "./shared.js";

const rangeOf = (r = {}) => ({ min: r.min ?? 1, max: r.max ?? 12, start: r.start ?? r.min ?? 1 });

function pieces(w, cut) {
  return cut.sign() > 0 && cut.lt(w) ? [cut, w.sub(cut)] : [w];
}

function partialValue(m, s) {
  const w = Fraction.must(m.w);
  const hh = Fraction.must(m.h);
  const cx = Fraction.must(s.cutX);
  const cy = Fraction.must(s.cutY);
  const ws = pieces(w, cx);
  const hs = pieces(hh, cy);
  const areas = ws.flatMap((a) => hs.map((b) => a.mul(b))).sort((a, b) => b.cmp(a));
  return { cutX: cx.toString(), cutY: cy.toString(), widths: ws.map(String), heights: hs.map(String), areas: areas.map(String), total: sum(areas).toString(), product: w.mul(hh).toString() };
}

function squareValue(s) {
  const total = s.rows * s.cols;
  const k = s.on.length;
  return { rows: String(s.rows), cols: String(s.cols), total: String(total), shaded: String(k), frac: new Fraction(k, total).toString(), raw: `${k}/${total}` };
}

export default {
  id: "area-model",

  validateModel(m) {
    const out = [];
    if (m.mode === "partial") {
      const w = Fraction.parse(m.w);
      const hh = Fraction.parse(m.h);
      const st = Fraction.parse(m.cutStep ?? "1");
      if (!w || !hh || w.sign() <= 0 || hh.sign() <= 0) return ["w and h must be positive rationals"];
      if (!st || st.sign() <= 0 || !w.div(st).isInt() || !hh.div(st).isInt()) out.push("w and h must be whole multiples of cutStep");
      else if (w.div(st).n > 200n || hh.div(st).n > 200n) out.push("w and h may be at most 200 cut steps");
    } else if (m.mode === "unit-square") {
      for (const k of ["rows", "cols"]) {
        const r = rangeOf(m[k]);
        if (![r.min, r.max, r.start].every(Number.isInteger) || r.min < 1 || r.max > 12 || r.min > r.max || r.start < r.min || r.start > r.max) out.push(`model.${k} must be {min,max,start} integers within 1..12`);
      }
      for (const f of m.factors || []) {
        const v = Fraction.parse(f.of);
        if (!["col", "row"].includes(f.axis) || !v || v.sign() <= 0 || v.gt(1) || !f.label) out.push("each factor needs axis col|row, of in (0,1], label");
      }
    } else out.push('model.mode must be "partial" or "unit-square"');
    return out;
  },

  initialState(m) {
    if (m.mode === "partial") return { cutX: "0", cutY: "0" };
    return { rows: rangeOf(m.rows).start, cols: rangeOf(m.cols).start, on: [] };
  },

  validateState(m, s) {
    if (m.mode === "partial") {
      const st = Fraction.must(m.cutStep ?? "1");
      return ["cutX", "cutY"].flatMap((k, i) => {
        const v = Fraction.parse(s?.[k]);
        const lim = Fraction.must(i ? m.h : m.w);
        return v && v.sign() >= 0 && v.le(lim) && v.div(st).isInt() ? [] : [`state.${k} must be a multiple of cutStep within the rectangle`];
      });
    }
    const out = [];
    const r = rangeOf(m.rows);
    const c = rangeOf(m.cols);
    if (!(s?.rows >= r.min && s.rows <= r.max)) out.push("state.rows out of range");
    if (!(s?.cols >= c.min && s.cols <= c.max)) out.push("state.cols out of range");
    if (!Array.isArray(s?.on) || s.on.some((i) => !Number.isInteger(i) || i < 0 || i >= s.rows * s.cols)) out.push("state.on has an invalid cell");
    return out;
  },

  value: (m, s) => (m.mode === "partial" ? partialValue(m, s) : squareValue(s)),

  describe(m, s) {
    if (m.mode === "partial") {
      const v = partialValue(m, s);
      return v.areas.length === 1 ? `one rectangle, ${v.product}` : `${v.areas.length} pieces: ${v.areas.join(" + ")} = ${v.total}`;
    }
    const v = squareValue(s);
    return `${v.rows} rows by ${v.cols} columns, ${v.shaded} of ${v.total} cells shaded (${v.frac})`;
  },

  mount(host, { model, state, onChange, announce }) {
    let st = clone(state);
    const root = h("div", { class: "st-cb-am" });
    host.replaceChildren(root);
    const commit = (note) => {
      onChange(clone(st));
      draw();
      if (note) announce(note);
    };
    const geom = {};
    let drag = null;
    root.addEventListener("pointerdown", (ev) => {
      const g = ev.target.closest?.("[data-axis]");
      if (!g || !geom[g.dataset.axis]) return;
      drag = g.dataset.axis;
      try {
        root.setPointerCapture(ev.pointerId);
      } catch {
        /* best effort */
      }
      ev.preventDefault();
      geom[drag](ev);
    });
    root.addEventListener("pointermove", (ev) => drag && geom[drag](ev));
    const endDrag = () => {
      if (!drag) return;
      const key = drag;
      drag = null;
      announce(`${key === "cutX" ? "Vertical" : "Horizontal"} cut ${Fraction.must(st[key]).isZero() ? "removed" : `at ${st[key]}`}. ${partialValue(model, st).areas.join(" plus ")}`);
    };
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);
    const mountPartial = () => {
      const w = Fraction.must(model.w);
      const hh = Fraction.must(model.h);
      const step = Fraction.must(model.cutStep ?? "1");
      const W = 560;
      const H = 330;
      const ox = 60;
      const oy = 44;
      const bw = W - ox - 20;
      const bh = H - oy - 20;
      const sx = (v) => ox + (Fraction.must(v).div(w).toNumber() * bw);
      const sy = (v) => oy + (Fraction.must(v).div(hh).toNumber() * bh);
      const root2 = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "st-cb-am-svg", role: "group", "aria-label": `Rectangle ${w} by ${hh}. Move the two cut lines to break it into smaller rectangles.` });
      const cx = Fraction.must(st.cutX);
      const cy = Fraction.must(st.cutY);
      const xs = [Fraction.must(0), ...(cx.sign() > 0 && cx.lt(w) ? [cx] : []), w];
      const ys = [Fraction.must(0), ...(cy.sign() > 0 && cy.lt(hh) ? [cy] : []), hh];
      for (let i = 0; i < xs.length - 1; i++) {
        for (let j = 0; j < ys.length - 1; j++) {
          const pw = xs[i + 1].sub(xs[i]);
          const ph = ys[j + 1].sub(ys[j]);
          root2.append(svg("rect", { x: sx(xs[i]), y: sy(ys[j]), width: sx(xs[i + 1]) - sx(xs[i]), height: sy(ys[j + 1]) - sy(ys[j]), class: `st-cb-am-piece p${(i + j * 2) % 4}` }));
          const label = svg("text", { x: (sx(xs[i]) + sx(xs[i + 1])) / 2, y: (sy(ys[j]) + sy(ys[j + 1])) / 2, class: "st-cb-am-text", "text-anchor": "middle" }, svg("tspan", { x: (sx(xs[i]) + sx(xs[i + 1])) / 2, dy: "-0.2em" }, `${pw} x ${ph}`), svg("tspan", { x: (sx(xs[i]) + sx(xs[i + 1])) / 2, dy: "1.3em", class: "st-cb-am-area" }, `= ${pw.mul(ph)}`));
          root2.append(label);
        }
      }
      xs.slice(0, -1).forEach((a, i) => root2.append(svg("text", { x: (sx(a) + sx(xs[i + 1])) / 2, y: oy - 22, class: "st-cb-tick-label", "text-anchor": "middle" }, xs[i + 1].sub(a).toString())));
      ys.slice(0, -1).forEach((a, j) => root2.append(svg("text", { x: ox - 10, y: (sy(a) + sy(ys[j + 1])) / 2 + 5, class: "st-cb-tick-label", "text-anchor": "end" }, ys[j + 1].sub(a).toString())));
      const handle = (axis, label, get, set) => {
        const g = svg("g", { class: "st-cb-handle", "data-axis": axis === "x" ? "cutX" : "cutY", tabindex: "0", role: "slider", "aria-label": label, "aria-valuemin": "0", "aria-valuemax": String((axis === "x" ? w : hh).toNumber()) });
        const v = get();
        const x = axis === "x" ? sx(v) : ox - 24;
        const y = axis === "x" ? oy - 28 : sy(v);
        g.setAttribute("transform", `translate(${x} ${y})`);
        g.append(svg("circle", { class: "st-cb-hit", r: 38 }), svg("rect", { class: "st-cb-dot", x: -11, y: -11, width: 22, height: 22, rx: 5 }));
        g.setAttribute("aria-valuenow", String(v.toNumber()));
        g.setAttribute("aria-valuetext", v.isZero() ? `${label}: no cut` : `${label} at ${v}`);
        const max = axis === "x" ? w : hh;
        geom[axis === "x" ? "cutX" : "cutY"] = (ev) => {
          const p = toSvgPoint(root2, ev);
          const frac = axis === "x" ? (p.x - ox) / bw : (p.y - oy) / bh;
          const n = Math.max(0, Math.min(Number(max.div(step).n), Math.round(frac * Number(max.div(step).n))));
          set(step.mul(n), false);
        };
        g.addEventListener("keydown", (ev) => {
          const k = sliderKey(ev, 5);
          if (k == null) return;
          ev.preventDefault();
          const cur = get();
          const next = k === "home" ? Fraction.must(0) : k === "end" ? max : cur.add(step.mul(k));
          set(next, true);
        });
        root2.append(g);
        return g;
      };
      const setCut = (key, max) => (v, spoken) => {
        const c = v.lt(0) ? Fraction.must(0) : v.gt(max) ? max : v;
        if (st[key] === c.toString()) return;
        st[key] = c.toString();
        onChange(clone(st));
        draw();
        const g = root.querySelector(`[data-axis="${key}"]`);
        g?.focus();
        if (spoken) announce(`${key === "cutX" ? "Vertical" : "Horizontal"} cut ${c.isZero() ? "removed" : `at ${c}`}. ${partialValue(model, st).areas.join(" plus ")}`);
      };
      const hx = handle("x", "Vertical cut", () => Fraction.must(st.cutX), setCut("cutX", w));
      const hy = handle("y", "Horizontal cut", () => Fraction.must(st.cutY), setCut("cutY", hh));
      for (const k of ["cutX", "cutY"]) {
        const v = Fraction.must(st[k]);
        if (v.sign() > 0 && v.lt(k === "cutX" ? w : hh)) {
          root2.insertBefore(k === "cutX" ? svg("line", { x1: sx(v), x2: sx(v), y1: oy - 18, y2: oy + bh, class: "st-cb-cut" }) : svg("line", { x1: ox - 14, x2: ox + bw, y1: sy(v), y2: sy(v), class: "st-cb-cut" }), hx);
        }
      }
      const v = partialValue(model, st);
      return [h("div", { class: "st-cb-am-wrap" }, root2), h("p", { class: "st-cb-readout", role: "status" }, h("strong", {}, "Partial products: "), v.areas.length === 1 ? `${v.product} (no cuts yet)` : `${v.areas.join(" + ")} = ${v.total}`)];
    };

    const mountSquare = () => {
      const rr = rangeOf(model.rows);
      const cr = rangeOf(model.cols);
      const cells = Array.from({ length: st.rows * st.cols }, (_, i) =>
        h("button", {
          type: "button",
          class: `st-cb-cell${st.on.includes(i) ? " is-on" : ""}`,
          role: "checkbox",
          "aria-checked": String(st.on.includes(i)),
          "aria-label": `Row ${Math.floor(i / st.cols) + 1}, column ${(i % st.cols) + 1}, ${st.on.includes(i) ? "shaded" : "not shaded"}`,
          "data-cell": String(i),
          onclick: () => {
            st.on = st.on.includes(i) ? st.on.filter((x) => x !== i) : [...st.on, i].sort((a, b) => a - b);
            commit(`${st.on.length} of ${st.rows * st.cols} cells shaded.`);
          },
        }),
      );
      const grid = h("div", { class: "st-cb-sq-grid", style: `grid-template-columns:repeat(${st.cols},1fr);grid-template-rows:repeat(${st.rows},1fr)` }, cells);
      const overlays = (model.factors || []).map((f, i) => {
        const o = h("div", { class: `st-cb-sq-factor f${i % 2}`, "aria-hidden": "true" });
        const pct = `${(Fraction.must(f.of).toNumber() * 100).toFixed(3)}%`;
        if (f.axis === "col") Object.assign(o.style, { left: "0", top: "0", bottom: "0", width: pct });
        else Object.assign(o.style, { left: "0", right: "0", top: "0", height: pct });
        return o;
      });
      const legend = (model.factors || []).map((f, i) => h("li", { class: `st-cb-legend f${i % 2}` }, f.label));
      const v = squareValue(st);
      const focused = document.activeElement?.dataset?.cell;
      queueMicrotask(() => focused != null && root.querySelector(`[data-cell="${focused}"]`)?.focus());
      return [
        h("div", { class: "st-cb-sq-ctl" },
          stepper({ label: "rows", min: rr.min, max: rr.max, value: st.rows, onChange: (n) => { st.rows = n; st.on = []; commit(`${n} rows. Shading cleared.`); } }).el,
          stepper({ label: "columns", min: cr.min, max: cr.max, value: st.cols, onChange: (n) => { st.cols = n; st.on = []; commit(`${n} columns. Shading cleared.`); } }).el),
        h("div", { class: "st-cb-sq" }, grid, overlays),
        legend.length ? h("ul", { class: "st-cb-legend-list" }, legend) : null,
        h("p", { class: "st-cb-readout", role: "status" }, h("strong", {}, "Shaded: "), `${v.shaded} of ${v.total} cells = `, h("strong", {}, v.frac)),
      ];
    };

    function draw() {
      root.replaceChildren(...(model.mode === "partial" ? mountPartial() : mountSquare()));
    }
    draw();
    return {
      setState(s) {
        st = clone(s);
        draw();
      },
    };
  },
};

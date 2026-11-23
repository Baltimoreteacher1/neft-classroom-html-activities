// concept-builder kind: number-line. Drag points and jump tips along a line; positions snap to an exact rational step.
import { h } from "../../core/dom.js";
import { Fraction, fmt, say } from "./rational.js";
import { clone, draggable, sliderKey, svg, toSvgPoint } from "./shared.js";

const W = 640;
const PAD = 36;
const AX = 112;
const ids = (list) => list.map((x) => x.id);

function dims(m) {
  const min = Fraction.must(m.min);
  const max = Fraction.must(m.max);
  const step = Fraction.must(m.step);
  const n = Number(max.sub(min).div(step).n);
  const label = Fraction.must(m.labelEvery || m.step);
  return { min, max, step, n, bigSteps: Math.max(1, Number(label.div(step).n)), label };
}
const clampTo = (v, d) => (v.lt(d.min) ? d.min : v.gt(d.max) ? d.max : v);
const fromOf = (j, s) => (j.from && typeof j.from === "object" ? Fraction.must(s.points[j.from.point]) : Fraction.must(j.from));

export default {
  id: "number-line",

  validateModel(m) {
    const out = [];
    const min = Fraction.parse(m.min);
    const max = Fraction.parse(m.max);
    const step = Fraction.parse(m.step);
    if (!min || !max || !step || step.sign() <= 0 || min.ge(max)) return ["model needs rational min < max and step > 0"];
    const q = max.sub(min).div(step);
    if (!q.isInt() || q.n < 1n || q.n > 240n) out.push("(max - min) / step must be an integer 1..240");
    if (m.labelEvery != null) {
      const l = Fraction.parse(m.labelEvery);
      if (!l || !l.div(step).isInt() || l.sign() <= 0) out.push("labelEvery must be a positive multiple of step");
    }
    if (m.format && !["fraction", "mixed", "decimal", "integer"].includes(m.format)) out.push("unknown format");
    const pts = m.points || [];
    if (!Array.isArray(pts) || pts.length < 1 || pts.length > 6) out.push("model.points needs 1..6 entries");
    const seen = new Set();
    for (const p of pts) {
      if (!p.id || !p.label) out.push("each point needs id and label");
      if (seen.has(p.id)) out.push(`duplicate point id ${p.id}`);
      seen.add(p.id);
      if (p.at != null) {
        const f = Fraction.parse(p.at);
        if (!f || f.lt(min) || f.gt(max) || !f.sub(min).div(step).isInt()) out.push(`point ${p.id}: at must be on the step grid inside the line`);
      }
    }
    for (const j of m.jumps || []) {
      if (!j.id || !j.label) out.push("each jump needs id and label");
      if (seen.has(j.id)) out.push(`duplicate id ${j.id}`);
      seen.add(j.id);
      if (j.from && typeof j.from === "object") {
        if (!pts.some((p) => p.id === j.from.point)) out.push(`jump ${j.id}: from.point does not exist`);
      } else if (!Fraction.parse(j.from)) out.push(`jump ${j.id}: from must be a rational or {point}`);
    }
    if ((m.jumps || []).length > 3) out.push("at most 3 jumps");
    return out;
  },

  initialState(m) {
    const d = dims(m);
    const st = { points: {}, jumps: {} };
    for (const p of m.points) st.points[p.id] = p.at != null ? Fraction.must(p.at).toString() : d.min.toString();
    for (const j of m.jumps || []) st.jumps[j.id] = Fraction.must(j.len ?? "0").toString();
    return st;
  },

  validateState(m, s) {
    const out = [];
    const d = dims(m);
    for (const p of m.points) {
      const f = Fraction.parse(s?.points?.[p.id]);
      if (!f || f.lt(d.min) || f.gt(d.max) || !f.sub(d.min).div(d.step).isInt()) out.push(`state.points.${p.id} must be on the grid`);
    }
    for (const j of m.jumps || []) {
      const len = Fraction.parse(s?.jumps?.[j.id]);
      if (!len) out.push(`state.jumps.${j.id} missing`);
      else {
        const tip = fromOf(j, s).add(len);
        if (tip.lt(d.min) || tip.gt(d.max) || !tip.sub(d.min).div(d.step).isInt()) out.push(`jump ${j.id} ends off the grid`);
      }
    }
    return out;
  },

  value(m, s) {
    const points = {};
    for (const p of m.points) points[p.id] = Fraction.must(s.points[p.id]).toString();
    const jumps = {};
    for (const j of m.jumps || []) {
      const from = fromOf(j, s);
      const len = Fraction.must(s.jumps[j.id]);
      jumps[j.id] = { from: from.toString(), to: from.add(len).toString(), len: len.toString() };
    }
    const order = [...m.points].map((p, i) => ({ id: p.id, i, v: Fraction.must(s.points[p.id]) })).sort((a, b) => a.v.cmp(b.v) || a.i - b.i);
    const vals = order.map((o) => o.v);
    const ties = vals.filter((v, i) => i > 0 && v.eq(vals[i - 1])).length;
    return { points, jumps, order: ids(order), ties: String(ties) };
  },

  describe(m, s) {
    const f = (v) => fmt(v, m.format, m.decimals ?? 2);
    const parts = m.points.map((p) => `${p.label} at ${f(s.points[p.id])}`);
    for (const j of m.jumps || []) {
      const len = Fraction.must(s.jumps[j.id]);
      parts.push(`${j.label} ${len.sign() < 0 ? "left" : "right"} ${f(len.abs())}`);
    }
    return parts.join("; ");
  },

  mount(host, { model, state, onChange, announce }) {
    const d = dims(model);
    const f = (v) => fmt(v, model.format, model.decimals ?? 2);
    let st = clone(state);
    const px = (v) => PAD + (Fraction.must(v).sub(d.min).toNumber() / d.max.sub(d.min).toNumber()) * (W - 2 * PAD);
    const idxToVal = (i) => d.min.add(d.step.mul(i));
    const idxFromX = (x) => Math.max(0, Math.min(d.n, Math.round(((x - PAD) / (W - 2 * PAD)) * d.n)));

    const root = svg("svg", { viewBox: `0 0 ${W} 170`, class: "st-cb-nl", role: "group", "aria-label": `Number line from ${f(d.min)} to ${f(d.max)}` });
    const mid = `st-cb-arrow-${Math.random().toString(36).slice(2, 7)}`;
    root.append(svg("defs", {}, svg("marker", { id: mid, viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }, svg("path", { d: "M0 0 L10 5 L0 10 z", class: "st-cb-arrowhead" }))));
    root.append(svg("line", { x1: PAD, x2: W - PAD, y1: AX, y2: AX, class: "st-cb-axis" }));
    for (let i = 0; i <= d.n; i++) {
      const v = idxToVal(i);
      const major = v.sub(d.min).div(d.label).isInt();
      root.append(svg("line", { x1: px(v), x2: px(v), y1: AX - (major ? 12 : 7), y2: AX + (major ? 12 : 7), class: major ? "st-cb-tick major" : "st-cb-tick" }));
      if (major) root.append(svg("text", { x: px(v), y: AX + 34, class: "st-cb-tick-label", "text-anchor": "middle" }, f(v)));
    }
    host.replaceChildren(h("div", { class: "st-cb-nl-wrap" }, root), h("p", { class: "st-cb-readout", role: "status" }));
    const readout = host.querySelector(".st-cb-readout");
    const nodes = [];

    const setPoint = (id, val, note) => {
      const v = clampTo(val, d);
      if (st.points[id] === v.toString()) return;
      st.points[id] = v.toString();
      for (const j of model.jumps || []) {
        if (j.from?.point === id) {
          const tip = clampTo(v.add(st.jumps[j.id]), d);
          st.jumps[j.id] = tip.sub(v).toString();
        }
      }
      sync();
      onChange(clone(st));
      if (note) announce(note);
    };
    const setJump = (j, tip, note) => {
      const from = fromOf(j, st);
      const len = clampTo(tip, d).sub(from);
      if (st.jumps[j.id] === len.toString()) return;
      st.jumps[j.id] = len.toString();
      sync();
      onChange(clone(st));
      if (note) announce(note);
    };

    const handle = (cls, label, get, set, fixed) => {
      const g = svg("g", { class: `st-cb-handle ${cls}${fixed ? " is-fixed" : ""}`, tabindex: fixed ? false : "0", role: fixed ? "img" : "slider", "aria-label": label });
      const hit = svg("circle", { class: "st-cb-hit", r: 38 });
      const dot = svg("circle", { class: "st-cb-dot", r: 13 });
      const txt = svg("text", { class: "st-cb-dot-label", "text-anchor": "middle", y: -24 }, label.split(",")[0]);
      g.append(hit, dot, txt);
      if (!fixed) {
        g.setAttribute("aria-valuemin", String(d.min.toNumber()));
        g.setAttribute("aria-valuemax", String(d.max.toNumber()));
        const fromPtr = (ev) => set(idxToVal(idxFromX(toSvgPoint(root, ev).x)), true);
        draggable(g, { onStart: (ev) => { g.focus(); fromPtr(ev); }, onMove: fromPtr, onEnd: () => announce(`${label.split(",")[0]} at ${say(get())}`) });
        g.addEventListener("keydown", (ev) => {
          const k = sliderKey(ev, d.bigSteps);
          if (k == null) return;
          ev.preventDefault();
          const cur = get();
          const next = k === "home" ? d.min : k === "end" ? d.max : cur.add(d.step.mul(k));
          set(next, false);
          announce(`${label.split(",")[0]} at ${say(get())}`);
        });
      }
      root.append(g);
      return g;
    };

    model.points.forEach((p, i) => {
      const fixed = !!p.fixed;
      const g = handle(`pt-${i}`, `${p.label}, point`, () => Fraction.must(st.points[p.id]), (v) => setPoint(p.id, v), fixed);
      nodes.push(() => {
        const v = st.points[p.id];
        const above = model.points.slice(0, i).filter((q) => st.points[q.id] === v).length;
        g.setAttribute("transform", `translate(${px(v)} ${AX - 4 - above * 0})`);
        g.querySelector("text").setAttribute("y", -24 - above * 18);
        if (!fixed) {
          g.setAttribute("aria-valuenow", String(Fraction.must(v).toNumber()));
          g.setAttribute("aria-valuetext", `${p.label} at ${f(v)}`);
        } else g.setAttribute("aria-label", `${p.label}, fixed at ${f(v)}`);
      });
    });

    for (const j of model.jumps || []) {
      const path = svg("path", { class: "st-cb-arc", fill: "none" });
      const lab = svg("text", { class: "st-cb-arc-label", "text-anchor": "middle" });
      root.insertBefore(path, root.firstChild);
      root.insertBefore(lab, root.firstChild);
      const g = handle("jump", `${j.label}, jump tip`, () => fromOf(j, st).add(st.jumps[j.id]), (tip) => setJump(j, tip), !!j.fixed);
      nodes.push(() => {
        const from = fromOf(j, st);
        const tip = from.add(st.jumps[j.id]);
        const x1 = px(from);
        const x2 = px(tip);
        const lift = 46 + Math.min(Math.abs(x2 - x1) / 8, 26);
        path.setAttribute("d", `M${x1} ${AX - 16} C ${x1} ${AX - lift - 16}, ${x2} ${AX - lift - 16}, ${x2} ${AX - 18}`);
        path.setAttribute("marker-end", `url(#${mid})`);
        lab.setAttribute("x", (x1 + x2) / 2);
        lab.setAttribute("y", AX - lift - 8);
        const len = Fraction.must(st.jumps[j.id]);
        lab.textContent = `${len.sign() < 0 ? "-" : "+"}${f(len.abs())}`;
        g.setAttribute("transform", `translate(${x2} ${AX - 4})`);
        g.querySelector("text").setAttribute("y", 34);
        if (!j.fixed) {
          g.setAttribute("aria-valuenow", String(tip.toNumber()));
          g.setAttribute("aria-valuetext", `${j.label} ends at ${f(tip)}, length ${f(len)}`);
        }
      });
    }

    function sync() {
      for (const n of nodes) n();
      readout.textContent = readoutText();
    }
    const readoutText = () => {
      const parts = model.points.map((p) => `${p.label} = ${f(st.points[p.id])}`);
      for (const j of model.jumps || []) {
        const len = Fraction.must(st.jumps[j.id]);
        parts.push(`${j.label}: ${len.sign() < 0 ? "left" : "right"} ${f(len.abs())}, ending at ${f(fromOf(j, st).add(len))}`);
      }
      return parts.join("   ");
    };
    sync();
    return {
      setState(s) {
        st = clone(s);
        sync();
      },
    };
  },
};

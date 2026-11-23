// concept-builder kind: ratio-table. Add rows by scaling or by typing a pair; the table shows the multiplier arrows,
// the unit rate and a linked double tape diagram. All arithmetic is exact (Fraction).
import { h } from "../../core/dom.js";
import { Fraction, fmt } from "./rational.js";
import { btn, clone, svg } from "./shared.js";

const pos = (v) => {
  const f = Fraction.parse(v);
  return f && f.sign() > 0 ? f : null;
};

function gcdBig(a, b) {
  while (b) [a, b] = [b, a % b];
  return a < 0n ? -a : a;
}
const lcmBig = (a, b) => (a / gcdBig(a, b)) * b;

/** Reduce a:b of positive rationals to coprime integers; returns {a, b, groups} as numbers or null when too large. */
export function reduceRatio(fa, fb) {
  const l = lcmBig(fa.d, fb.d);
  const A = fa.n * (l / fa.d);
  const B = fb.n * (l / fb.d);
  const g = gcdBig(A, B);
  if (A / g > 40n || B / g > 40n || g > 10n ** 6n) return null;
  return { a: Number(A / g), b: Number(B / g), groups: new Fraction(g, l) };
}

const rateOf = (row) => Fraction.must(row.b).div(row.a);

function tapeSvg(model, row, rowNo) {
  const fa = Fraction.must(row.a);
  const fb = Fraction.must(row.b);
  const W = 420;
  const rh = 30;
  const root = svg("svg", { viewBox: `0 0 ${W} 96`, class: "st-cb-tape", role: "img", "aria-label": "" });
  const red = reduceRatio(fa, fb);
  const groups = red && red.groups.isInt() && red.groups.n <= 12n ? Number(red.groups.n) : null;
  let desc;
  if (red && groups) {
    const total = red.a > red.b ? red.a : red.b;
    const unit = (W - 90 - (groups - 1) * 6) / (groups * total);
    const draw = (count, y, cls, label) => {
      root.append(svg("text", { x: 0, y: y + 20, class: "st-cb-tape-label" }, label));
      for (let g = 0; g < groups; g++) {
        const x0 = 84 + g * (total * unit + 6);
        for (let k = 0; k < count; k++) root.append(svg("rect", { x: x0 + k * unit + 0.5, y, width: Math.max(unit - 1, 1), height: rh, rx: 3, class: cls }));
      }
    };
    draw(red.a, 8, "st-cb-tape-a", model.columns[0].slice(0, 11));
    draw(red.b, 54, "st-cb-tape-b", model.columns[1].slice(0, 11));
    desc = `Row ${rowNo}: ${groups} equal groups. Each group has ${red.a} of ${model.columns[0]} and ${red.b} of ${model.columns[1]}.`;
  } else {
    const max = fa.gt(fb) ? fa : fb;
    const wA = (fa.div(max).toNumber() * (W - 90)).toFixed(1);
    const wB = (fb.div(max).toNumber() * (W - 90)).toFixed(1);
    root.append(svg("text", { x: 0, y: 28, class: "st-cb-tape-label" }, model.columns[0].slice(0, 11)));
    root.append(svg("rect", { x: 84, y: 8, width: wA, height: rh, rx: 3, class: "st-cb-tape-a" }));
    root.append(svg("text", { x: 90, y: 28, class: "st-cb-tape-val" }, fa.toString()));
    root.append(svg("text", { x: 0, y: 74, class: "st-cb-tape-label" }, model.columns[1].slice(0, 11)));
    root.append(svg("rect", { x: 84, y: 54, width: wB, height: rh, rx: 3, class: "st-cb-tape-b" }));
    root.append(svg("text", { x: 90, y: 74, class: "st-cb-tape-val" }, fb.toString()));
    desc = `Row ${rowNo}: ${fa} of ${model.columns[0]} compared with ${fb} of ${model.columns[1]}, drawn to scale.`;
  }
  root.setAttribute("aria-label", desc);
  return { el: root, desc };
}

export default {
  id: "ratio-table",

  validateModel(m) {
    const out = [];
    if (!m.context || typeof m.context !== "string") out.push("model.context required");
    if (!Array.isArray(m.columns) || m.columns.length !== 2 || m.columns.some((c) => !c || typeof c !== "string")) out.push("model.columns must be two strings");
    if (!Array.isArray(m.start) || m.start.length < 1 || m.start.length > 4) out.push("model.start needs 1..4 rows");
    else m.start.forEach((r, i) => { if (!Array.isArray(r) || r.length !== 2 || !pos(r[0]) || !pos(r[1])) out.push(`model.start[${i}] must be two positive rationals`); });
    if (m.maxRows != null && !(Number.isInteger(m.maxRows) && m.maxRows >= 3 && m.maxRows <= 12)) out.push("model.maxRows must be an integer 3..12");
    return out;
  },

  initialState(m) {
    return { rows: m.start.map(([a, b]) => ({ a: String(a), b: String(b) })), sel: 0 };
  },

  validateState(m, s) {
    const out = [];
    if (!s || !Array.isArray(s.rows) || !s.rows.length) return ["state.rows required"];
    s.rows.forEach((r, i) => { if (!pos(r.a) || !pos(r.b)) out.push(`state.rows[${i}] must be positive rationals`); });
    if (s.rows.length > (m.maxRows || 8)) out.push("state has more rows than maxRows");
    return out;
  },

  value(m, s) {
    const rows = s.rows.map((r) => [Fraction.must(r.a).toString(), Fraction.must(r.b).toString()]);
    const byFirst = {};
    const bySecond = {};
    for (const [a, b] of rows) {
      if (!(a in byFirst)) byFirst[a] = b;
      if (!(b in bySecond)) bySecond[b] = a;
    }
    const r0 = rateOf(s.rows[0]);
    const off = s.rows.map((r, i) => (rateOf(r).eq(r0) ? -1 : i)).filter((i) => i >= 0);
    const factors = s.rows.filter((r) => r.via).map((r) => r.via.k);
    return {
      rows,
      n: String(rows.length),
      byFirst: new Proxy(byFirst, { get: (t, k) => (k in t ? t[k] : "none") }),
      bySecond: new Proxy(bySecond, { get: (t, k) => (k in t ? t[k] : "none") }),
      rate: r0.toString(),
      rateInv: Fraction.must(1).div(r0).toString(),
      proportional: off.length ? "false" : "true",
      offRows: off.map(String),
      scaled: String(factors.length),
      factors,
      last: rows[rows.length - 1],
    };
  },

  describe(m, s) {
    const r0 = rateOf(s.rows[0]);
    const off = s.rows.filter((r) => !rateOf(r).eq(r0)).length;
    return `${s.rows.length} row${s.rows.length === 1 ? "" : "s"}${off ? `, ${off} with a different rate` : ", all with the same rate"}; ${m.columns[1]} per 1 ${m.columns[0]}: ${r0}`;
  },

  mount(host, { model, state, onChange, announce }) {
    let st = clone(state);
    const max = model.maxRows || 8;
    const showRate = model.showRate !== false;
    const mark = model.markRows !== false;
    const root = h("div", { class: "st-cb-ratio" });
    host.replaceChildren(root);
    const msg = h("p", { class: "st-cb-msg", role: "alert" });

    const commit = (note) => {
      onChange(clone(st));
      draw();
      root.querySelector('.st-cb-rowbtn[aria-pressed="true"]')?.focus();
      if (note) announce(note);
    };

    const addRow = (a, b, via, note) => {
      if (st.rows.length >= max) return (msg.textContent = `The table is full (${max} rows). Remove the last row first.`);
      msg.textContent = "";
      st.rows.push({ a: a.toString(), b: b.toString(), ...(via ? { via } : {}) });
      st.sel = st.rows.length - 1;
      commit(note);
    };

    function controls() {
      const rowSel = h("select", { id: "st-cb-from", class: "st-cb-input", "aria-label": "Row to scale" }, st.rows.map((_, i) => h("option", { value: String(i) }, `Row ${i + 1}`)));
      const factor = h("input", { class: "st-cb-input", id: "st-cb-factor", inputmode: "decimal", autocomplete: "off", "aria-label": "Multiply by", placeholder: "2 or 1/2", size: "7" });
      const ca = h("input", { class: "st-cb-input", inputmode: "decimal", autocomplete: "off", "aria-label": model.columns[0], size: "7" });
      const cb = h("input", { class: "st-cb-input", inputmode: "decimal", autocomplete: "off", "aria-label": model.columns[1], size: "7" });
      const scale = () => {
        const k = pos(factor.value);
        if (!k) return (msg.textContent = "Type a number greater than 0 to multiply by, such as 2, 1/2 or 0.5.");
        const from = Number(rowSel.value);
        const r = st.rows[from];
        addRow(Fraction.must(r.a).mul(k), Fraction.must(r.b).mul(k), { from, k: k.toString() }, `Row ${st.rows.length + 1} added: row ${from + 1} multiplied by ${k}.`);
      };
      const custom = () => {
        const a = pos(ca.value);
        const b = pos(cb.value);
        if (!a || !b) return (msg.textContent = `Type a number greater than 0 in both boxes (${model.columns[0]} and ${model.columns[1]}).`);
        addRow(a, b, null, `Row ${st.rows.length + 1} added: ${a} and ${b}.`);
      };
      const remove = () => {
        if (st.rows.length <= model.start.length) return (msg.textContent = "The starting rows stay in the table.");
        st.rows.pop();
        st.sel = Math.min(st.sel, st.rows.length - 1);
        msg.textContent = "";
        commit(`Last row removed. ${st.rows.length} rows left.`);
      };
      const key = (fn) => (ev) => ev.key === "Enter" && (ev.preventDefault(), fn());
      factor.addEventListener("keydown", key(scale));
      ca.addEventListener("keydown", key(custom));
      cb.addEventListener("keydown", key(custom));
      return h(
        "div",
        { class: "st-cb-controls" },
        model.allowScale !== false
          ? h("div", { class: "st-cb-ctl" }, h("strong", {}, "Scale a row"), h("label", { for: "st-cb-from" }, "Take"), rowSel, h("label", { for: "st-cb-factor" }, "and multiply both numbers by"), factor, btn("Add scaled row", scale))
          : null,
        model.allowCustom !== false
          ? h("div", { class: "st-cb-ctl" }, h("strong", {}, "Type your own pair"), h("label", {}, model.columns[0], ca), h("label", {}, model.columns[1], cb), btn("Add row", custom))
          : null,
        h("div", { class: "st-cb-ctl" }, btn("Remove last row", remove, { cls: "st-cb-quiet" })),
        msg,
      );
    }

    function draw() {
      const r0 = rateOf(st.rows[0]);
      const head = h("tr", {}, h("th", { scope: "col" }, "Row"), h("th", { scope: "col" }, model.columns[0]), showRate ? h("th", { scope: "col", class: "st-cb-mid" }, "Arrow") : null, h("th", { scope: "col" }, model.columns[1]), h("th", { scope: "col" }, "How it grew"));
      const body = st.rows.map((r, i) => {
        const same = rateOf(r).eq(r0);
        const grew = r.via
          ? h("span", { class: "st-cb-grew" }, svg("svg", { viewBox: "0 0 40 16", width: "40", height: "16", "aria-hidden": "true" }, svg("path", { d: "M2 12 C 14 -2, 26 -2, 36 11", fill: "none", stroke: "currentColor", "stroke-width": "2" }), svg("path", { d: "M36 11 l-6 -1 M36 11 l-2 -6", stroke: "currentColor", "stroke-width": "2", fill: "none" })), ` x ${fmt(r.via.k)} from row ${r.via.from + 1}`)
          : i < model.start.length
            ? h("span", { class: "st-cb-quiet-text" }, "starting row")
            : h("span", { class: "st-cb-quiet-text" }, "typed in");
        return h(
          "tr",
          { class: `${i === st.sel ? "is-sel" : ""} ${mark && !same ? "is-off" : ""}`.trim() },
          h("th", { scope: "row" }, h("button", { type: "button", class: "st-cb-rowbtn", "aria-pressed": String(i === st.sel), "aria-label": `Row ${i + 1}, show on the tape diagram`, onclick: () => { st.sel = i; commit(`Row ${i + 1} shown on the tape diagram.`); } }, String(i + 1))),
          h("td", {}, fmt(r.a)),
          showRate ? h("td", { class: "st-cb-mid" }, `x ${rateOf(r).toString()}`) : null,
          h("td", {}, fmt(r.b), mark ? h("span", { class: `st-cb-tag ${same ? "is-same" : "is-diff"}` }, same ? "same rate" : "different rate") : null),
          h("td", {}, grew),
        );
      });
      const table = h("table", { class: "st-cb-table" }, h("caption", {}, model.context), h("thead", {}, head), h("tbody", {}, body));
      const row = st.rows[st.sel];
      const tape = tapeSvg(model, row, st.sel + 1);
      const readout = showRate
        ? h("p", { class: "st-cb-readout", role: "status" }, h("strong", {}, "Unit rate from row 1: "), `${r0.toString()} ${model.rateLabel || `${model.columns[1]} for each 1 ${model.columns[0]}`}`)
        : h("p", { class: "st-cb-readout" }, "Unit rate: build a row to find it.");
      root.replaceChildren(h("div", { class: "st-cb-ratio-grid" }, h("div", { class: "st-cb-scroll" }, table), h("figure", { class: "st-cb-fig" }, tape.el, h("figcaption", {}, `Double tape diagram for row ${st.sel + 1}`))), readout, controls());
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

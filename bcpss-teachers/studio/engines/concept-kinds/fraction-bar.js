// concept-builder kind: fraction-bar. Partition a bar into equal parts and shade from the left; compare bars for equivalence.
// Shading is always a run from the left, so the amount shaded is a length that can be lined up between bars.
import { h } from "../../core/dom.js";
import { Fraction } from "./rational.js";
import { clone, stepper } from "./shared.js";

const rng = (b) => ({ lo: b.lockParts ?? b.nMin ?? 1, hi: b.lockParts ?? b.nMax ?? 12 });

function barValue(n, k) {
  const raw = new Fraction(k, n);
  return { n: String(n), k: String(k), frac: raw.toString(), raw: `${k}/${n}` };
}

export default {
  id: "fraction-bar",

  validateModel(m) {
    const out = [];
    const bars = m.bars;
    if (!Array.isArray(bars) || bars.length < 1 || bars.length > 3) return ["model.bars needs 1..3 bars"];
    const seen = new Set();
    for (const b of bars) {
      if (!b.id || !b.label) out.push("each bar needs id and label");
      if (seen.has(b.id)) out.push(`duplicate bar id ${b.id}`);
      seen.add(b.id);
      const { lo, hi } = rng(b);
      if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 1 || hi > 12 || lo > hi) out.push(`bar ${b.id}: part range must be integers within 1..12`);
      const n = b.n ?? b.lockParts ?? lo;
      if (!Number.isInteger(n) || n < lo || n > hi) out.push(`bar ${b.id}: n outside its range`);
      if (b.shade != null && !(Number.isInteger(b.shade) && b.shade >= 0 && b.shade <= n)) out.push(`bar ${b.id}: shade must be 0..n`);
    }
    return out;
  },

  initialState(m) {
    const st = { bars: {} };
    for (const b of m.bars) {
      const n = b.n ?? b.lockParts ?? rng(b).lo;
      st.bars[b.id] = { n, k: b.shade ?? 0 };
    }
    return st;
  },

  validateState(m, s) {
    return m.bars.flatMap((b) => {
      const v = s?.bars?.[b.id];
      const { lo, hi } = rng(b);
      return v && Number.isInteger(v.n) && Number.isInteger(v.k) && v.n >= lo && v.n <= hi && v.k >= 0 && v.k <= v.n ? [] : [`state.bars.${b.id} is invalid`];
    });
  },

  value(m, s) {
    const bars = {};
    for (const b of m.bars) bars[b.id] = barValue(s.bars[b.id].n, s.bars[b.id].k);
    const shaded = m.bars.filter((b) => s.bars[b.id].k > 0).map((b) => new Fraction(s.bars[b.id].k, s.bars[b.id].n));
    const equivalent = shaded.length >= 2 && shaded.length === m.bars.length && shaded.every((f) => f.eq(shaded[0]));
    return { bars, equivalent: String(equivalent) };
  },

  describe(m, s) {
    return m.bars.map((b) => `${b.label}: ${s.bars[b.id].k} of ${s.bars[b.id].n} parts shaded (${new Fraction(s.bars[b.id].k, s.bars[b.id].n)})`).join("; ");
  },

  mount(host, { model, state, onChange, announce }) {
    let st = clone(state);
    const root = h("div", { class: "st-cb-fb" });
    host.replaceChildren(root);
    const commit = (note) => {
      onChange(clone(st));
      draw();
      if (note) announce(note);
    };

    function draw() {
      const focused = document.activeElement?.dataset?.part;
      const stage = h("div", { class: "st-cb-fb-stage" });
      const rows = model.bars.map((b) => {
        const v = st.bars[b.id];
        const { lo, hi } = rng(b);
        const frac = new Fraction(v.k, v.n);
        const parts = h(
          "div",
          { class: "st-cb-fb-bar", role: "group", "aria-label": `${b.label}: ${v.n} equal parts` },
          Array.from({ length: v.n }, (_, i) =>
            h("button", {
              type: "button",
              class: `st-cb-part${i < v.k ? " is-on" : ""}`,
              role: "checkbox",
              "aria-checked": String(i < v.k),
              "aria-label": `Part ${i + 1} of ${v.n}, ${i < v.k ? "shaded" : "not shaded"}`,
              "data-part": `${b.id}:${i}`,
              onclick: () => {
                v.k = i + 1 === v.k ? i : i + 1;
                commit(`${b.label}: ${v.k} of ${v.n} parts shaded, ${new Fraction(v.k, v.n)} of the bar.`);
              },
            }),
          ),
        );
        const ctl = h(
          "div",
          { class: "st-cb-fb-ctl" },
          b.lockParts != null
            ? h("span", { class: "st-cb-quiet-text" }, `This bar has ${v.n} equal parts.`)
            : stepper({ label: `${b.label} equal parts`, min: lo, max: hi, value: v.n, onChange: (n) => { v.n = n; v.k = 0; commit(`${b.label} now has ${n} equal parts. Shading cleared.`); } }).el,
          h("span", { class: "st-cb-fb-frac", role: "status" }, `${v.k} of ${v.n} shaded = `, h("strong", {}, frac.toString())),
        );
        return h("div", { class: "st-cb-fb-row" }, h("span", { class: "st-cb-fb-label" }, b.label), parts, ctl);
      });
      stage.append(...rows);
      const lead = model.bars.map((b) => st.bars[b.id]).find((v) => v.k > 0);
      if (model.align !== false && lead && model.bars.length > 1) {
        const g = h("div", { class: "st-cb-fb-guide", "aria-hidden": "true" });
        g.style.left = `${(new Fraction(lead.k, lead.n).toNumber() * 100).toFixed(3)}%`;
        stage.append(g);
      }
      root.replaceChildren(stage);
      if (focused) root.querySelector(`[data-part="${focused}"]`)?.focus();
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

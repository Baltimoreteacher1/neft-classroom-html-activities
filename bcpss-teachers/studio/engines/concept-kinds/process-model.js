// concept-builder kind: process-model. Variables (sliders, toggles) drive outputs and process stages through rules
// that live in the activity data. No per-activity code: the same engine runs any cause-and-effect model.
import { h } from "../../core/dom.js";
import { sameValue } from "./checks.js";
import { FORMATS, Fraction, fmtFor } from "./rational.js";
import { clone } from "./shared.js";

const OPS = ["lt", "le", "eq", "ge", "gt", "ne", "in"];

function testCond(c, vars, outs) {
  const ref = c.var != null ? vars[c.var] : outs[c.out]?.value;
  if (ref == null) return false;
  if (c.op === "in") return (c.values || []).some((v) => sameValue(ref, v));
  if (c.op === "eq") return sameValue(ref, c.value);
  if (c.op === "ne") return !sameValue(ref, c.value);
  const a = Fraction.parse(ref);
  const b = Fraction.parse(c.value);
  if (!a || !b) return false;
  return { lt: a.lt(b), le: a.le(b), ge: a.ge(b), gt: a.gt(b) }[c.op] ?? false;
}

/** Evaluate the whole model for a variable assignment. Pure. */
export function run(model, vars) {
  const outs = {};
  for (const o of model.outputs) {
    const rule = o.rules.find((r) => (r.when || []).every((c) => testCond(c, vars, outs)));
    outs[o.id] = { value: Fraction.must(rule.value).toString(), say: rule.say, ruleId: rule.ruleId };
  }
  const reached = (model.stages || []).filter((s) => (s.when || []).every((c) => testCond(c, vars, outs))).map((s) => s.id);
  return { outs, reached, stage: reached.length ? reached[reached.length - 1] : "none" };
}

const sliderSteps = (v) => Number(Fraction.must(v.max).sub(v.min).div(v.step).n);
const sliderVal = (v, i) => Fraction.must(v.min).add(Fraction.must(v.step).mul(i)).toString();

function combos(model, cap = 6000) {
  let all = [{}];
  for (const v of model.variables) {
    const vals = v.type === "toggle" ? v.options.map((o) => o.id) : Array.from({ length: sliderSteps(v) + 1 }, (_, i) => sliderVal(v, i));
    if (all.length * vals.length > cap) return null;
    all = all.flatMap((a) => vals.map((x) => ({ ...a, [v.id]: x })));
  }
  return all;
}

/** Show a variable or output value the way its author asked: item `format`/`decimals`, else the model's, else a fraction. */
const show = (m, item, x) => fmtFor(x, item, m);

export default {
  id: "process-model",
  run,

  validateModel(m) {
    const out = [];
    const vars = m.variables || [];
    if (vars.length < 1 || vars.length > 4) out.push("model.variables needs 1..4 entries");
    const ids = new Set();
    for (const v of vars) {
      if (!v.id || !v.label) out.push("each variable needs id and label");
      if (ids.has(v.id)) out.push(`duplicate id ${v.id}`);
      ids.add(v.id);
      if (v.type === "slider") {
        const [mn, mx, st, s0] = [v.min, v.max, v.step, v.start].map((x) => Fraction.parse(x));
        if (!mn || !mx || !st || !s0 || st.sign() <= 0 || mn.ge(mx)) out.push(`variable ${v.id}: slider needs rational min < max, step > 0, start`);
        else if (!mx.sub(mn).div(st).isInt() || sliderSteps(v) > 40 || !s0.sub(mn).div(st).isInt() || s0.lt(mn) || s0.gt(mx)) out.push(`variable ${v.id}: (max - min) / step must be an integer <= 40 and start on the grid`);
        else if (v.valueLabels && v.valueLabels.length !== sliderSteps(v) + 1) out.push(`variable ${v.id}: valueLabels needs ${sliderSteps(v) + 1} entries`);
      } else if (v.type === "toggle") {
        if (!Array.isArray(v.options) || v.options.length < 2 || new Set(v.options.map((o) => o.id)).size !== v.options.length || v.options.some((o) => !o.id || !o.label)) out.push(`variable ${v.id}: toggle needs 2+ options with unique id and label`);
        else if (!v.options.some((o) => o.id === v.start)) out.push(`variable ${v.id}: start is not an option`);
      } else out.push(`variable ${v.id}: type must be slider or toggle`);
    }
    const outs = m.outputs || [];
    if (outs.length < 1 || outs.length > 4) out.push("model.outputs needs 1..4 entries");
    for (const [where, c] of [["model", m], ...vars.map((v) => [`variable ${v.id}`, v]), ...outs.map((o) => [`output ${o.id}`, o])]) {
      if (c.format != null && !FORMATS.includes(c.format)) out.push(`${where}: format must be one of ${FORMATS.join(", ")}`);
      if (c.decimals != null && !(Number.isInteger(c.decimals) && c.decimals >= 0 && c.decimals <= 4)) out.push(`${where}: decimals must be an integer 0..4`);
    }
    const known = new Map(vars.map((v) => [v.id, v]));
    const earlier = new Set();
    const checkConds = (conds, where) => {
      for (const c of conds) {
        if (!OPS.includes(c.op)) out.push(`${where}: unknown op ${c.op}`);
        const isVar = c.var != null;
        if (isVar ? !known.has(c.var) : !earlier.has(c.out)) out.push(`${where}: condition refers to unknown ${isVar ? "variable" : "earlier output"} ${c.var ?? c.out}`);
        const toggle = isVar && known.get(c.var)?.type === "toggle";
        if (toggle && !["eq", "ne", "in"].includes(c.op)) out.push(`${where}: toggle ${c.var} only supports eq, ne, in`);
        if (toggle) for (const val of c.op === "in" ? c.values || [] : [c.value]) if (!known.get(c.var).options.some((o) => o.id === val)) out.push(`${where}: ${val} is not an option of ${c.var}`);
        if (!toggle && isVar && (c.op === "in" ? !(c.values || []).every((x) => Fraction.parse(x)) : !Fraction.parse(c.value))) out.push(`${where}: slider condition needs rational values`);
      }
    };
    for (const o of outs) {
      const where = `output ${o.id}`;
      if (!o.id || !o.label) out.push("each output needs id and label");
      const mn = Fraction.parse(o.min);
      const mx = Fraction.parse(o.max);
      if (!mn || !mx || mn.ge(mx)) out.push(`${where}: needs rational min < max`);
      if (!o.rules?.length) out.push(`${where}: needs rules`);
      else {
        if ((o.rules[o.rules.length - 1].when || []).length) out.push(`${where}: the last rule must be the default (when: [])`);
        const rids = new Set();
        o.rules.forEach((r, i) => {
          const rw = `${where} rule ${i + 1}`;
          if (!r.ruleId || rids.has(r.ruleId)) out.push(`${rw}: ruleId missing or duplicate`);
          rids.add(r.ruleId);
          if (!r.say || typeof r.say !== "string") out.push(`${rw}: say required`);
          const val = Fraction.parse(r.value);
          if (!val || (mn && mx && (val.lt(mn) || val.gt(mx)))) out.push(`${rw}: value must be a rational within [min, max]`);
          if (!Array.isArray(r.when)) out.push(`${rw}: when must be an array`);
          else checkConds(r.when, rw);
        });
      }
      earlier.add(o.id);
    }
    if (m.stages) {
      if (m.stages.length < 2 || m.stages.length > 8) out.push("model.stages needs 2..8 entries");
      for (const s of m.stages) {
        if (!s.id || !s.label) out.push("each stage needs id and label");
        checkConds(s.when || [], `stage ${s.id}`);
      }
    }
    if (!out.length) {
      const all = combos(m);
      if (all) {
        const fired = new Set();
        const reachedStage = new Set();
        for (const a of all) {
          const r = run(m, a);
          for (const [oid, x] of Object.entries(r.outs)) fired.add(`${oid}:${x.ruleId}`);
          r.reached.forEach((s) => reachedStage.add(s));
        }
        for (const o of m.outputs) for (const r of o.rules) if (!fired.has(`${o.id}:${r.ruleId}`)) out.push(`output ${o.id}: rule ${r.ruleId} can never fire`);
        for (const s of m.stages || []) if (!reachedStage.has(s.id)) out.push(`stage ${s.id} can never be reached`);
      }
    }
    return out;
  },

  initialState(m) {
    return { vars: Object.fromEntries(m.variables.map((v) => [v.id, v.type === "toggle" ? v.start : Fraction.must(v.start).toString()])), log: [] };
  },

  validateState(m, s) {
    return m.variables.flatMap((v) => {
      const x = s?.vars?.[v.id];
      if (v.type === "toggle") return v.options.some((o) => o.id === x) ? [] : [`state.vars.${v.id} is not an option`];
      const f = Fraction.parse(x);
      return f && f.ge(v.min) && f.le(v.max) && f.sub(v.min).div(v.step).isInt() ? [] : [`state.vars.${v.id} is off the slider`];
    });
  },

  value(m, s) {
    const r = run(m, s.vars);
    return {
      vars: Object.fromEntries(Object.entries(s.vars).map(([k, v]) => [k, Fraction.parse(v)?.toString() ?? v])),
      out: Object.fromEntries(Object.entries(r.outs).map(([k, v]) => [k, v.value])),
      why: Object.fromEntries(Object.entries(r.outs).map(([k, v]) => [k, v.ruleId])),
      stage: r.stage,
      reached: r.reached,
      changes: String((s.log || []).length),
    };
  },

  describe(m, s) {
    const r = run(m, s.vars);
    const vs = m.variables.map((v) => `${v.label} ${v.type === "toggle" ? v.options.find((o) => o.id === s.vars[v.id])?.label : show(m, v, s.vars[v.id])}`).join(", ");
    const os = m.outputs.map((o) => `${o.label} ${show(m, o, r.outs[o.id].value)}${o.unit ? ` ${o.unit}` : ""}`).join(", ");
    return `${vs} gives ${os}`;
  },

  mount(host, { model, state, onChange, announce }) {
    let st = clone(state);
    const controls = h("div", { class: "st-cb-pm-controls" });
    const results = h("div", { class: "st-cb-pm-results" });
    const stages = h("ol", { class: "st-cb-pm-stages", "aria-label": "Stages reached" });
    const logBox = h("div", { class: "st-cb-scroll" });
    const effect = h("p", { class: "st-cb-readout", role: "status" });
    host.replaceChildren(h("div", { class: "st-cb-pm" }, h("fieldset", { class: "st-cb-pm-box" }, h("legend", {}, model.title || "Change a variable"), controls), results), stages, effect, logBox);
    const valueText = (v, x) => (v.type === "toggle" ? v.options.find((o) => o.id === x)?.label : `${v.valueLabels ? `${v.valueLabels[Number(Fraction.must(x).sub(v.min).div(v.step).n)]} (${show(model, v, x)}${v.unit ? ` ${v.unit}` : ""})` : `${show(model, v, x)}${v.unit ? ` ${v.unit}` : ""}`}`);

    const change = (v, x) => {
      const prev = run(model, st.vars);
      const from = st.vars[v.id];
      if (from === x) return;
      st.vars[v.id] = x;
      const now = run(model, st.vars);
      const moved = model.outputs.filter((o) => prev.outs[o.id].value !== now.outs[o.id].value);
      const eff = moved.length ? moved.map((o) => `${o.label} ${show(model, o, prev.outs[o.id].value)} to ${show(model, o, now.outs[o.id].value)}${o.unit ? ` ${o.unit}` : ""}`).join("; ") : "no output changed";
      st.log = [...(st.log || []), { v: v.label, from: valueText(v, from), to: valueText(v, x), effect: eff }].slice(-8);
      onChange(clone(st));
      render();
      const why = moved[0] ? now.outs[moved[0].id].say : "Nothing changed. That variable does not matter at these settings.";
      effect.textContent = `${v.label}: ${valueText(v, from)} to ${valueText(v, x)}. ${eff}. ${why}`;
      announce(effect.textContent);
    };

    function buildControls() {
      controls.replaceChildren(
        ...model.variables.map((v) => {
          if (v.type === "toggle") {
            return h(
              "fieldset",
              { class: "st-cb-pm-var" },
              h("legend", {}, v.label),
              v.options.map((o) => h("label", { class: "st-cb-radio" }, h("input", { type: "radio", name: `st-cb-${v.id}`, value: o.id, checked: st.vars[v.id] === o.id ? true : false, onchange: () => change(v, o.id) }), h("span", {}, o.label))),
            );
          }
          const n = sliderSteps(v);
          const idx = Number(Fraction.must(st.vars[v.id]).sub(v.min).div(v.step).n);
          const out = h("output", { class: "st-cb-pm-val", for: `st-cb-v-${v.id}` }, valueText(v, st.vars[v.id]));
          const input = h("input", { type: "range", id: `st-cb-v-${v.id}`, class: "st-cb-range", min: "0", max: String(n), step: "1", value: String(idx), "aria-valuetext": valueText(v, st.vars[v.id]) });
          input.addEventListener("input", () => {
            const x = sliderVal(v, Number(input.value));
            out.textContent = valueText(v, x);
            input.setAttribute("aria-valuetext", valueText(v, x));
          });
          input.addEventListener("change", () => change(v, sliderVal(v, Number(input.value))));
          return h("div", { class: "st-cb-pm-var" }, h("label", { for: `st-cb-v-${v.id}` }, v.label), input, out);
        }),
      );
    }

    function render() {
      const r = run(model, st.vars);
      results.replaceChildren(
        ...model.outputs.map((o) => {
          const val = Fraction.must(r.outs[o.id].value);
          const pct = Math.max(0, Math.min(100, val.sub(o.min).div(Fraction.must(o.max).sub(o.min)).toNumber() * 100));
          const bar = h("div", { class: "st-cb-meter", role: "meter", "aria-label": o.label, "aria-valuemin": String(Fraction.must(o.min).toNumber()), "aria-valuemax": String(Fraction.must(o.max).toNumber()), "aria-valuenow": String(val.toNumber()), "aria-valuetext": `${show(model, o, val)}${o.unit ? ` ${o.unit}` : ""}` }, h("span", { style: `width:${pct.toFixed(2)}%` }));
          return h("div", { class: "st-cb-pm-out" }, h("strong", {}, `${o.label}: ${show(model, o, val)}${o.unit ? ` ${o.unit}` : ""}`), bar, h("p", { class: "st-cb-pm-say" }, r.outs[o.id].say));
        }),
      );
      stages.replaceChildren(...(model.stages || []).map((s) => h("li", { class: r.reached.includes(s.id) ? "is-reached" : "" }, h("strong", {}, s.label), h("span", { class: "st-cb-stage-state" }, r.reached.includes(s.id) ? "reached" : "not reached"), s.detail ? h("small", {}, s.detail) : null)));
      logBox.replaceChildren(
        (st.log || []).length
          ? h("table", { class: "st-cb-table" }, h("caption", {}, "Your tests, newest last"), h("thead", {}, h("tr", {}, ["Changed", "From", "To", "What happened"].map((t) => h("th", { scope: "col" }, t)))), h("tbody", {}, st.log.map((l) => h("tr", {}, h("td", {}, l.v), h("td", {}, l.from), h("td", {}, l.to), h("td", {}, l.effect)))))
          : h("p", { class: "st-cb-quiet-text" }, "Change a variable to start your test log."),
      );
    }
    buildControls();
    render();
    return {
      setState(s) {
        st = clone(s);
        buildControls();
        render();
        effect.textContent = "";
      },
    };
  },
};

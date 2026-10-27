// The area-model screen: choose how to split a side, then write each partial product and the total.
// The picture is redrawn from the learner's own split. @fm2 FM-011 FM-058 FM-059 FM-038 FM-021
import { areaModelSvg } from "../../art/grids.js";
import { parse } from "../../rational.js";
import { numText, planModel } from "./model.js";
import { polyText } from "./poly.js";
import { clamp, esc, intOf, keepFocus, selectInput, stepperHtml, u } from "./ui-kit.js";

export function mountModel(root, ctx) {
  const { round } = ctx;
  const task = round.task;
  const poly = task.mode === "poly";
  let lang = ctx.lang;
  const state = { cuts: { rows: "", cols: "" }, partials: {}, total: "" };
  const splitKeys = ["rows", "cols"].filter(
    (k) => task[k].mode === "place" || task[k].mode === "free",
  );

  const wholeText = (key) => {
    if (poly)
      return task[key].parts
        .map((p) => polyText(p))
        .join(" + ")
        .replaceAll("+ −", "− ");
    return numText(parse(task[key].whole));
  };
  const stepOf = (key) => (task[key].mode === "place" ? Number(task[key].unit) : 1);
  const maxCut = (key) => Math.ceil(parse(task[key].whole).n / parse(task[key].whole).d) - 1;

  // The picture: a split side once the learner has chosen a cut, the whole side before that.
  function view() {
    const plan = planModel(round, state.cuts, true);
    if (plan.ok) return plan;
    return null;
  }

  function figure() {
    const plan = view();
    const parts = (key) => {
      if (plan) return plan[key].map((p) => ({ text: p.text, weight: p.weight }));
      const dim = task[key];
      if (dim.mode === "none")
        return [
          { text: numText(parse(dim.whole)), weight: parse(dim.whole).n / parse(dim.whole).d },
        ];
      return [{ text: wholeText(key), weight: 1 }];
    };
    const regions = plan
      ? plan.regions.map((row) => row.map((r) => ({ id: r.id, text: r.label })))
      : null;
    const total = (key) => (plan && plan[key].length > 1 ? wholeText(key) : "");
    return areaModelSvg({
      rowParts: parts("rows"),
      colParts: parts("cols"),
      regions,
      rowTotal: total("rows"),
      colTotal: total("cols"),
      caption: `${wholeText("rows")} × ${wholeText("cols")}`,
    });
  }

  function splitHtml() {
    return splitKeys
      .map((key) => {
        const whole = wholeText(key);
        const cut = state.cuts[key];
        const plan = view();
        const line = plan
          ? u("splitIs", lang, { whole, a: plan[key][0].text, b: plan[key][1].text })
          : u("splitNone", lang, { whole });
        return `<div class="aa-split">${stepperHtml({ id: `cut-${key}`, label: u("splitStep", lang, { whole }), value: cut, down: u("splitLess", lang, { whole }), up: u("splitMore", lang, { whole }) })}<p class="aa-small">${esc(line)}</p></div>`;
      })
      .join("");
  }

  function fieldsHtml() {
    const plan = view();
    if (!plan) return "";
    const rows = plan.flat
      .map((r) => {
        const label = u("region", lang, { id: r.id, label: r.label });
        return `<li><label class="aa-part"><span class="aa-rid" aria-hidden="true">${r.id}</span><span class="aa-part-text">${esc(r.label)} =</span><input class="aa-input" data-part="${r.id}" data-focus="part:${r.id}" type="text" inputmode="${poly ? "text" : "decimal"}" autocomplete="off" aria-label="${esc(label)}" value="${esc(state.partials[r.id] ?? "")}"></label></li>`;
      })
      .join("");
    const total = `<li><label class="aa-part aa-part-total"><span class="aa-part-text">${esc(u("total", lang))} =</span><input class="aa-input" data-total data-focus="total" type="text" inputmode="${poly ? "text" : "decimal"}" autocomplete="off" aria-label="${esc(u("total", lang))}" value="${esc(state.total)}"></label></li>`;
    return `<ul class="aa-parts">${rows}${total}</ul>${poly ? `<p class="aa-small">${esc(u("polyTip", lang))}</p>` : ""}`;
  }

  function html() {
    return `<div class="aa-board aa-model${ctx.locked() ? " aa-locked" : ""}" data-kind="model">
      <div class="aa-field aa-modelfig">${figure()}</div>
      ${splitHtml()}
      ${fieldsHtml()}
      <p class="aa-note" role="status" data-note></p>
      <div class="aa-actions"><button type="button" class="fm2-btn" data-act="clear" data-focus="clear">${esc(u("clear", lang))}</button><button type="button" class="fm2-btn fm2-btn-primary" data-act="check" data-focus="check">${esc(u("checkModel", lang))}</button></div>
    </div>`;
  }

  const render = () =>
    keepFocus(root, () => {
      root.innerHTML = html();
    });

  function setCut(key, value) {
    if (value === null) return;
    state.cuts[key] = String(clamp(value, 1, maxCut(key)));
    render();
    const plan = view();
    if (plan)
      ctx.announce(
        u("splitIs", lang, { whole: wholeText(key), a: plan[key][0].text, b: plan[key][1].text }),
      );
  }

  function onClick(event) {
    const button = event.target.closest("[data-act]");
    if (!button || ctx.locked()) return;
    const { act, id } = button.dataset;
    if (act === "inc" || act === "dec") {
      const key = id.replace("cut-", "");
      const now = intOf(state.cuts[key]);
      setCut(key, now === null ? stepOf(key) : now + (act === "inc" ? 1 : -1) * stepOf(key));
    } else if (act === "clear") {
      state.cuts = { rows: "", cols: "" };
      state.partials = {};
      state.total = "";
      render();
      ctx.announce(u("cleared", lang));
    } else if (act === "check") {
      ctx.submit({ cuts: { ...state.cuts }, partials: { ...state.partials }, total: state.total });
    }
  }

  function onChange(event) {
    const input = event.target.closest(".aa-step-input");
    if (!input || ctx.locked()) return;
    setCut(input.dataset.id.replace("cut-", ""), intOf(input.value));
  }

  function onInput(event) {
    const t = event.target;
    if (t.dataset.part) state.partials[t.dataset.part] = t.value;
    else if (t.matches("[data-total]")) state.total = t.value;
  }

  const listeners = [
    ["click", onClick],
    ["change", onChange],
    ["input", onInput],
    ["focusin", selectInput],
  ];
  for (const [name, fn] of listeners) root.addEventListener(name, fn);
  render();
  ctx.onLock?.(render);

  return {
    destroy() {
      for (const [name, fn] of listeners) root.removeEventListener(name, fn);
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}

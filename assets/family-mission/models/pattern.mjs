// Family "pattern": a rule y = m·x + b in two modes. "rule" (5.OA.B.3): pick inputs for a table, try
// "start, then add each step" or "multiply the input", and compare it with every row shown. "solve"
// (6.AT.11): y = m·x or y = b + m·x is on the screen; say which number is known, undo the adding
// (if there is a starting amount) and then the multiplying on both sides, in reverse order, then
// check by putting the answer back. All arithmetic is exact (pattern-model.mjs); a row that differs
// or a move in the wrong order is "try another look", never a score.
import { a11y, button, createView, cmp, field, frac, h, put, s, stext, t } from "./core.mjs";
import { create } from "./pattern-model.mjs";
import { STR, badX, checkLine, equationLine, guessLine, header, inputLabel, logLines, num, opLabel, plain, resultText, sayText, stageHint, stepLabel } from "./pattern-text.mjs";

export { create };
export const id = "pattern";
export const label = { en: "Patterns and equations", es: "Patrones y ecuaciones" };

let uid = 0;
const LOOK = {
  en: "Look at how the output changes when the input goes up by 1. Use the same units as the table.",
  es: "Mira cómo cambia el resultado cuando la entrada sube 1. Usa las mismas unidades que la tabla.",
};
const OP_ORDER = ["add", "mul", "div", "sub"];
const solveRule = (p) => (p.b === "0" ? `${p.m} × ${p.letters.x}` : `${p.b} + ${p.m} × ${p.letters.x}`);
const problemLabel = (p, L) => (p.title ? t(L, p.title) : p.mode === "rule" ? `${t(L, p.quantities.x)} → ${t(L, p.quantities.y)}` : `${p.letters.y} = ${solveRule(p)}`);

// ── Graph: points on labelled axes, drawn as shapes (circle = table, diamond = your rule) ────────

function graph(d, L) {
  const W = 300;
  const H = 210;
  const [left, top, pw, ph] = [62, 34, 224, 120];
    const xMax = d.rows.length ? Math.max(...d.rows.map((r) => r.x)) : d.maxX;
  const yTop = d.rows.map((r) => r.y).reduce((a, z) => (cmp(a, z) >= 0 ? a : z), frac(1));
  const px = (x) => left + (x / xMax) * pw;
  const py = (v) => top + ph - (v.n / v.d / (yTop.n / yTop.d)) * ph;
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "fm-svg fm-pattern-svg", role: "img", "aria-label": `${t(L, STR.graph)}: ${d.rows.length}` });
  a11y(svg, t(L, STR.graph), `${d.letters.x}: ${header(d, "x", L)}. ${d.letters.y}: ${header(d, "y", L)}.`);
  put(
    svg,
    s("line", { x1: left, y1: top, x2: left, y2: top + ph, class: "fm-axis" }),
    s("line", { x1: left, y1: top + ph, x2: left + pw, y2: top + ph, class: "fm-axis" }),
    stext(left - 6, top + ph + 5, "0", "fm-svg-text", "end"),
    stext(left, top + ph + 22, "0", "fm-svg-text", "middle"),
    stext(left + pw, top + ph + 22, num(frac(xMax)), "fm-svg-text", "end"),
    stext(left + pw / 2, H - 4, `${d.letters.x}: ${header(d, "x", L)}`, "fm-svg-text fm-svg-muted", "middle"),
    stext(4, 16, `${d.letters.y}: ${header(d, "y", L)}`, "fm-svg-text fm-svg-muted"),
  );
  if (!d.rows.length) return put(svg, stext(left + pw / 2, top + ph / 2, t(L, STR.noPoints), "fm-svg-text fm-svg-muted", "middle"));
  put(svg, stext(left - 6, top + 5, plain(d, "y", yTop), "fm-svg-text", "end"), s("line", { x1: left - 5, y1: top, x2: left, y2: top, class: "fm-tick" }));
  for (const r of d.rows) {
    const [cx, cy] = [px(r.x), py(r.y)];
    put(svg, s("circle", { cx, cy, r: 6, class: "fm-dot fm-pattern-pt" }, s("title", null, `${d.letters.x} = ${num(frac(r.x))}, ${d.letters.y} = ${plain(d, "y", r.y)}`)));
    if (d.checked && r.guess) {
      const off = cmp(r.guess, yTop) > 0; // a rule far above the table sits on the top edge, marked with an arrow
      const [gx, gy] = [px(r.x), off ? top : py(r.guess)];
      const tip = `${t(L, STR.rulePoint)}: ${plain(d, "y", r.guess)}`;
      put(svg, s("path", { d: `M${gx} ${gy - 8}L${gx + 8} ${gy}L${gx} ${gy + 8}L${gx - 8} ${gy}Z`, class: "fm-pattern-guess" }, s("title", null, tip)));
      if (off) put(svg, stext(gx, gy - 12, "↑", "fm-svg-text", "middle"));
    }
  }
  return svg;
}

const legend = (d, L) => `● ${t(L, STR.tablePoint)}${d.checked ? `   ◇ ${t(L, STR.rulePoint)}` : ""}`;

// ── Mount ────────────────────────────────────────────────────────────────────

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const mode = model.getState().mode;
  const n = ++uid;
  let bag;
  let ui = {};
  let L = lang;
  const T = (k) => t(L, STR[k]);
  const btn = (attrs, text) => h("button", { type: "button", class: "fm-btn", ...attrs }, text);
  const flag = (input, ok) => (ok ? input.removeAttribute("aria-invalid") : input.setAttribute("aria-invalid", "true"));

  function buildPicks() {
    const { presets } = model.getState();
    ui.picks = h("div", { class: "fm-pattern-row", role: "group", "aria-label": T("problem") }, ...presets.map((p, i) => btn({ "data-pick": String(i), "aria-pressed": "false" }, problemLabel(p, L))));
    bag.on(ui.picks, "click", (e) => {
      const b = e.target.closest?.("[data-pick]");
      if (b) model.setState({ preset: Number(b.dataset.pick) });
    });
  }

  function buildRule() {
    ui.hint = h("p", { class: "fm-explain", role: "status" });
    ui.fig = h("figure", { class: "fm-pattern-fig" });
    ui.result = h("p", { class: "fm-explain fm-pattern-result", role: "status", hidden: "" });
    ui.table = h("table", { class: "fm-table fm-pattern-table" });
    put(root, h("p", { class: "fm-prompt" }, T("table")), ui.table);
    if (!readonly) {
      const addRow = () => {
        if (!model.setState({ addX: ui.add.input.value })) ui.msg.textContent = badX(model.getState(), L);
      };
      ui.add = field(bag, { id: `fm-pattern-${n}-x`, label: "" });
      ui.add.input.setAttribute("inputmode", "numeric");
      bag.on(ui.add.input, "keydown", (e) => e.key === "Enter" && (e.preventDefault(), addRow()));
      ui.addBtn = button(bag, T("addRow"), { onClick: addRow });
      put(root, h("div", { class: "fm-pattern-add" }, ui.add.el, ui.addBtn), ui.msg);
    }
    put(root, ui.hint, ui.fig);
    if (readonly) return put(root, ui.result);
    ui.kinds = {
      add: btn({ "data-kind": "add" }, T("kindAdd")),
      times: btn({ "data-kind": "times" }, T("kindTimes")),
    };
    const group = h("div", { class: "fm-pattern-row", role: "group", "aria-label": T("tryRule") }, ui.kinds.add, ui.kinds.times);
    bag.on(group, "click", (e) => {
      const b = e.target.closest?.("[data-kind]");
      if (b) model.setState({ guess: { kind: b.dataset.kind } });
    });
    const commit = (key) => (value, input) => {
      const ok = model.setState({ guess: { [key]: value } });
      ui.gmsg.textContent = ok ? "" : T("badNum");
      flag(input, ok);
    };
    ui.start = field(bag, { id: `fm-pattern-${n}-start`, label: T("start"), onCommit: commit("start") });
    ui.step = field(bag, { id: `fm-pattern-${n}-step`, label: T("stepAdd"), onCommit: commit("step") });
    ui.rule = h("p", { class: "fm-pattern-eq", role: "group" });
    ui.check = button(bag, T("check"), { onClick: () => model.setState({ check: true }) });
    put(root, h("p", { class: "fm-prompt" }, T("tryRule")), group, h("div", { class: "fm-fields" }, ui.start.el, ui.step.el), ui.gmsg, ui.rule, ui.check, ui.result);
  }

  function buildSolve() {
    ui.eq = h("p", { class: "fm-pattern-eq", role: "group" });
    ui.hint = h("p", { class: "fm-explain", role: "status" });
    ui.log = h("div", { class: "fm-pattern-log", hidden: "" });
    ui.result = h("p", { class: "fm-explain fm-pattern-result", role: "status", hidden: "" });
    ui.acts = h("div", { class: "fm-pattern-row" });
    if (!readonly) {
      ui.knownBtns = { y: btn({ "data-known": "y" }), x: btn({ "data-known": "x" }) };
      const group = h("div", { class: "fm-pattern-row", role: "group", "aria-label": T("which") }, ui.knownBtns.y, ui.knownBtns.x);
      bag.on(group, "click", (e) => {
        const b = e.target.closest?.("[data-known]");
        if (b) model.setState({ known: b.dataset.known });
      });
      bag.on(ui.acts, "click", (e) => {
        const b = e.target.closest?.("button");
        if (b && !b.disabled) model.setState(b.dataset.op ? { op: b.dataset.op } : { advance: true });
      });
      put(root, h("p", { class: "fm-label" }, T("which")), group);
    }
    ui.value = field(bag, {
      id: `fm-pattern-${n}-known`,
      label: T("knownNumber"),
      readonly,
      onCommit: (v, input) => {
        const ok = model.setState({ value: v });
        ui.msg.textContent = ok ? "" : T("badKnown");
        flag(input, ok);
      },
    });
    put(root, h("div", { class: "fm-fields" }, ui.value.el), ui.eq, ui.hint, ui.acts, ui.msg, ui.log, ui.result);
  }

  function build(v) {
    bag = v.bag;
    L = v.lang;
    ui = {};
    ui.msg = h("p", { class: "fm-msg", role: "status" });
    ui.gmsg = h("p", { class: "fm-msg", role: "status" });
    ui.desc = h("p", { class: "fm-sr" });
    if (model.getState().presets.length > 1 && !readonly) buildPicks();
    put(root, ui.picks);
    (mode === "rule" ? buildRule : buildSolve)();
    put(root, ui.desc);
    if (!readonly) {
      ui.undo = button(bag, T("undo"), { onClick: () => model.undo() });
      put(root, h("div", { class: "fm-actions" }, ui.undo, button(bag, T("reset"), { onClick: () => model.reset() })));
    }
  }

  function syncRule(d) {
    const x = `${d.letters.x}: ${header(d, "x", L)}`;
    const y = `${d.letters.y}: ${header(d, "y", L)}`;
    const line = (tag, ...c) => h("tr", null, ...c.filter((v) => v !== null).map((v) => h(tag, { scope: tag === "th" ? "col" : null }, v)));
    const verdict = (st) => (st === "match" ? `✓ ${T("matches")}` : st === "differs" ? `≠ ${T("differs")}` : "—");
    const body = d.rows.map((r) => {
      const row = line("td", num(frac(r.x)), plain(d, "y", r.y), d.checked ? (r.guess ? plain(d, "y", r.guess) : "—") : null, d.checked ? verdict(r.status) : null);
      row.className = `fm-pattern-${r.status}`;
      return row;
    });
    ui.table.replaceChildren(
      h("caption", { class: "fm-sr" }, T("table")),
      h("thead", null, line("th", x, y, d.checked ? T("gives") : null, d.checked ? T("status") : null)),
      h("tbody", null, ...body),
    );
    ui.hint.textContent = !d.rows.length ? T("noRows") : d.rows.length === 1 ? T("moreRows") : !d.canAdd ? T("full") : t(L, LOOK);
    ui.fig.replaceChildren(graph(d, L), h("figcaption", { class: "fm-cap" }, legend(d, L)));
    ui.result.hidden = !d.result;
    ui.result.textContent = resultText(d, L);
    if (readonly) return;
    const cur = ui.add.input.value.trim();
    if (!cur || d.rows.some((r) => String(r.x) === cur)) ui.add.set(d.nextX ?? "", true);
    ui.add.el.querySelector("label").textContent = inputLabel(d, L);
    ui.addBtn.disabled = !d.canAdd;
    for (const [k, b] of Object.entries(ui.kinds)) b.setAttribute("aria-pressed", String(d.guess.kind === k));
    const times = d.guess.kind === "times";
    ui.start.el.hidden = times;
    ui.start.set(d.guess.startText, true);
    ui.step.set(d.guess.stepText, true);
    ui.step.el.querySelector("label").textContent = T(times ? "stepTimes" : "stepAdd");
    for (const f of [ui.start, ui.step]) f.invalid(false);
    ui.rule.textContent = guessLine(d);
    ui.rule.hidden = !d.guess.complete;
    ui.check.disabled = !d.rows.length;
  }

  function syncSolve(d) {
    const hadFocus = ui.acts.contains(globalThis.document.activeElement);
    ui.eq.textContent = equationLine(d, L);
    ui.eq.setAttribute("aria-label", equationLine(d, L));
    ui.hint.textContent = stageHint(d, L);
    ui.value.set(num(d.value), true);
    ui.value.invalid(false);
    ui.value.el.querySelector("label").textContent = `${T("knownNumber")} (${d.letters[d.known]})`;
    for (const [who, b] of Object.entries(ui.knownBtns || {})) {
      b.textContent = `${t(L, d.quantities[who])} (${d.letters[who]})`;
      b.setAttribute("aria-pressed", String(d.known === who));
    }
    ui.acts.replaceChildren(
      ...(readonly || d.finished
        ? []
        : d.needsOp
          ? OP_ORDER.map((op) => btn({ "data-op": op }, opLabel(d, op, L)))
          : [btn({ class: "fm-btn fm-pattern-next", "data-adv": "1" }, stepLabel(d, L))]),
    );
    if (hadFocus) (ui.acts.querySelector("button") || ui.undo)?.focus({ preventScroll: true });
    const lines = logLines(d, L);
    ui.log.hidden = !lines.length;
    if (lines.length) ui.log.replaceChildren(h("p", { class: "fm-label" }, T("logTitle")), ...lines.map((line) => h("p", { class: "fm-pattern-line" }, line)));
    ui.result.hidden = !d.finished;
    ui.result.textContent = d.finished ? checkLine(d, L) : "";
    if (d.tried) ui.msg.textContent = T("tried");
  }

  function sync() {
    const d = model.getState();
    ui.msg.textContent = "";
    ui.gmsg.textContent = "";
    const now = JSON.stringify(d.problem);
    for (const b of ui.picks?.children || []) b.setAttribute("aria-pressed", String(JSON.stringify(d.presets[Number(b.dataset.pick)]) === now));
    (mode === "rule" ? syncRule : syncSolve)(d);
    if (ui.undo) ui.undo.disabled = !model.canUndo();
    ui.desc.textContent = model.getAccessibleDescription(L);
  }

  return createView(root, model, { lang, onChange, cls: "fm-pattern", build, sync, say: sayText });
}

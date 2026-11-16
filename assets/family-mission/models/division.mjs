// Family "division": three ways to divide, one clear action per step.
//   whole      long division digit by digit: the student chooses each quotient digit and the model
//              checks it exactly ("too big", "too small" or "just right"), then taps multiply,
//              subtract and bring down; the end checks quotient × divisor + remainder.
//   decimal    multiply both numbers by the same power of 10 (both points move together) so the
//              divisor is whole, put the point in the answer above the dividend's point, then run
//              the same long division.
//   fractionof a fraction of a whole number as equal groups: split into d groups (divide by the
//              bottom), then take n of them (multiply by the top).
// All arithmetic is exact integers; the state is only the problem and how far the student has got.
import { button, createView, defineFamily, eq, frac, h, put, t, toFrac } from "./core.mjs";
import { KEYS, MODES, judgeDigit, normalizeProblem, planOf, progressOf } from "./division-math.mjs";
import {
  STR,
  actionLabel,
  answered,
  digitFeedback,
  equation,
  hint,
  movedLine,
  parts,
  problemText,
  tooManyGroups,
  workLines,
} from "./division-text.mjs";
import { boardView, groupsView } from "./division-view.mjs";

export const id = "division";
export const label = { en: "Dividing", es: "Dividir" };

const MAX_PRESETS = 4;

// ── State ────────────────────────────────────────────────────────────────────

const fresh = (mode) => (mode === "fractionof" ? { split: false, taken: [] } : { step: 0 });
const problemOf = (st) => Object.fromEntries(KEYS[st.mode].map((k) => [k, st[k]]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function validateState(st) {
  if (!st || !MODES.includes(st.mode)) return false;
  try {
    if (!same(normalizeProblem(st.mode, st), problemOf(st))) return false;
    if (!Array.isArray(st.presets) || st.presets.length > MAX_PRESETS) return false;
    if (!st.presets.every((p) => same(normalizeProblem(st.mode, p), p))) return false;
    if (st.mode !== "fractionof") return Number.isInteger(st.step) && st.step >= 0 && st.step <= planOf(st.mode, st).actions.length;
    const sorted = Array.isArray(st.taken) && st.taken.every((i, k) => Number.isInteger(i) && i >= 0 && i < st.d && (k === 0 || i > st.taken[k - 1]));
    return typeof st.split === "boolean" && sorted && st.taken.length <= st.n && (st.split || st.taken.length === 0);
  } catch {
    return false;
  }
}

function normalize(config) {
  const c = config || {};
  if (!MODES.includes(c.mode)) throw new TypeError(`division: mode must be one of ${MODES.join(", ")}`);
  if (c.presets !== undefined && !Array.isArray(c.presets)) throw new TypeError("division: presets must be a list");
  const presets = (c.presets || []).slice(0, MAX_PRESETS).map((p) => normalizeProblem(c.mode, p));
  const state = { mode: c.mode, ...normalizeProblem(c.mode, c), presets, ...fresh(c.mode) };
  if (!validateState(state)) throw new TypeError("division: invalid problem");
  return { state, task: c.task || null };
}

function reduce(st, patch) {
  const fail = (m) => {
    throw new RangeError(`division: ${m}`);
  };
  if ("digit" in patch || "step" in patch) {
    if (st.mode === "fractionof") fail("this model has no digits");
    const pl = planOf(st.mode, st);
    const a = pl.actions[st.step];
    if ("digit" in patch) {
      const c = a?.kind === "pick" && pl.cycles[a.k];
      const g = patch.digit;
      if (!c || !Number.isInteger(g) || g < 0 || g > 9 || judgeDigit(c.working, pl.B, g) !== "ok") fail("that digit does not fit");
    } else if (!a || a.kind === "pick" || patch.step !== st.step + 1) fail("the steps go in order");
    return { ...st, step: st.step + 1 };
  }
  if ("split" in patch || "toggle" in patch) {
    if (st.mode !== "fractionof") fail("this model has no groups");
    if ("split" in patch) {
      if (st.split || patch.split !== true) fail("split once");
      return { ...st, split: true };
    }
    const i = patch.toggle;
    if (!st.split || !Number.isInteger(i) || i < 0 || i >= st.d) fail("split the whole first");
    const taken = st.taken.includes(i) ? st.taken.filter((x) => x !== i) : [...st.taken, i].sort((a, b) => a - b);
    if (taken.length > st.n) fail("too many groups");
    return { ...st, taken };
  }
  return { ...st, ...normalizeProblem(st.mode, { ...problemOf(st), ...patch }), ...fresh(st.mode) };
}

function derive(st) {
  const base = { mode: st.mode, problem: problemOf(st), presets: st.presets };
  if (st.mode === "fractionof") {
    const each = st.whole / st.d;
    const finished = st.taken.length === st.n;
    const next = !st.split ? { kind: "split" } : finished ? null : { kind: "take" };
    return { ...base, split: st.split, taken: st.taken, groups: st.d, each, answer: st.n * each, finished, next };
  }
  const plan = planOf(st.mode, st);
  const next = plan.actions[st.step] ?? null;
  return { ...base, plan, step: st.step, total: plan.actions.length, next, finished: !next, ...progressOf(plan, st.step), quotient: plan.quotient, remainder: plan.remainder };
}

function validateTask(st, task) {
  if (!task) return { ok: false, reason: "no-task", misconception: null };
  const d = derive(st);
  if (!d.finished) return { ok: false, reason: "not-finished", misconception: null };
  if (task.answer === undefined) return { ok: true, reason: "correct", misconception: null };
  const want = toFrac(task.answer);
  const got = d.mode === "fractionof" ? frac(d.answer) : d.quotient;
  const ok = !!want && eq(want, got) && (task.remainder === undefined || task.remainder === d.remainder);
  return { ok, reason: ok ? "correct" : "incorrect", misconception: null };
}

// ── Words ────────────────────────────────────────────────────────────────────

const INTRO = {
  whole: { en: "Long division model", es: "Modelo de división larga" },
  decimal: { en: "Dividing decimals model", es: "Modelo de división de decimales" },
  fractionof: { en: "Fraction of a whole number model", es: "Modelo de fracción de un número entero" },
};

function stateLine(d, lang) {
  if (d.mode !== "fractionof") return workLines(d, lang).join(" ");
  if (!d.split) return t(lang, { en: `${d.problem.whole} in one pile.`, es: `${d.problem.whole} en un montón.` });
  return t(lang, {
    en: `${d.groups} groups of ${d.each}. ${d.taken.length} taken.`,
    es: `${d.groups} grupos de ${d.each}. ${d.taken.length} tomados.`,
  });
}

function accessibleDescription(st, lang) {
  const d = derive(st);
  const now = d.mode === "decimal" && d.moved ? ` ${t(lang, { en: "Now it reads", es: "Ahora dice" })} ${equation(d, lang)}.` : "";
  return `${t(lang, INTRO[d.mode])}. ${problemText(d.mode, d.problem, lang)}.${now} ${stateLine(d, lang)} ${hint(d, lang)}`.replace(/\s+/g, " ");
}

function explanation(st, lang) {
  const d = derive(st);
  const lines = [t(lang, { en: `Solve ${problemText(d.mode, d.problem, lang)}.`, es: `Resuelve ${problemText(d.mode, d.problem, lang)}.` })];
  if (answered(d)) {
    const p = parts(d, lang);
    lines.push(`${p.answer}.`, ...p.notes, ...(d.finished ? [p.check] : []));
  } else lines.push(hint(d, lang));
  return lines.join(" ");
}

export const create = defineFamily({
  id,
  normalize,
  reduce,
  validateState,
  derive,
  validateTask,
  accessibleDescription,
  explanation,
  describeConfig: (st) => ({ mode: st.mode, ...problemOf(st), presets: st.presets }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  let ui = {};
  let L = lang;
  const T = (k) => t(L, STR[k]);

  function build(v) {
    L = v.lang;
    ui = {};
    const bag = v.bag;
    const d0 = model.getState();
    const picks = d0.presets.length > 1 && !readonly;
    ui.picks = picks ? h("div", { class: "fm-div-picks", role: "group", "aria-label": T("problem") }) : null;
    ui.expr = h("p", { class: "fm-div-expr", role: "group" });
    ui.sub = h("p", { class: "fm-div-sub" });
    ui.pic = h("div", { class: "fm-div-pic" });
    ui.hint = h("p", { class: "fm-explain fm-div-hint", role: "status" });
    ui.msg = h("p", { class: "fm-msg fm-div-msg", role: "status" });
    ui.result = h("div", { class: "fm-div-result", hidden: "" });
    ui.desc = h("p", { class: "fm-sr" });
    put(root, ui.picks, ui.expr, ui.sub, ui.pic, ui.hint, ui.msg);
    if (!readonly) {
      const digits = Array.from({ length: 10 }, (_, i) => h("button", { type: "button", class: "fm-btn fm-div-digit", "data-digit": String(i) }, String(i)));
      ui.pad = h("div", { class: "fm-div-pad", role: "group", "aria-label": T("digit"), hidden: "" }, ...digits);
      ui.next = h("button", { type: "button", class: "fm-btn fm-div-next is-next", hidden: "" });
      ui.ctl = h("div", { class: "fm-div-ctl" }, ui.pad, ui.next);
      put(root, ui.ctl);
      const tryDigit = (g) => {
        const d = model.getState();
        const ok = model.setState({ digit: g });
        ui.msg.textContent = d.next?.kind === "pick" ? digitFeedback(d, g, L) : "";
        return ok;
      };
      bag.on(ui.pad, "click", (e) => {
        const b = e.target.closest?.("[data-digit]");
        if (b) tryDigit(Number(b.dataset.digit));
      });
      bag.on(ui.next, "click", () => {
        const d = model.getState();
        if (d.next) model.setState(d.next.kind === "split" ? { split: true } : { step: d.step + 1 });
      });
      bag.on(ui.pic, "click", (e) => {
        const b = e.target.closest?.("[data-group]");
        if (!b) return;
        const d = model.getState();
        if (!model.setState({ toggle: Number(b.dataset.group) })) ui.msg.textContent = tooManyGroups(d, L);
      });
      if (ui.picks) {
        bag.on(ui.picks, "click", (e) => {
          const b = e.target.closest?.("[data-pick]");
          const p = b && model.getState().presets[Number(b.dataset.pick)];
          if (p) model.setState(p);
        });
      }
    }
    put(root, ui.result, ui.desc);
    if (!readonly) {
      ui.undo = button(bag, T("undo"), { onClick: () => model.undo() });
      ui.reset = button(bag, T("reset"), { onClick: () => model.reset() });
      put(root, h("div", { class: "fm-actions" }, ui.undo, ui.reset));
    }
  }

  function sync() {
    const d = model.getState();
    const active = globalThis.document.activeElement;
    const group = active?.dataset?.group;
    const lostFocus = () => ui.ctl?.contains(active) && active.closest("[hidden]");
    ui.msg.textContent = "";
    ui.expr.textContent = equation(d, L);
    ui.expr.setAttribute("aria-label", equation(d, L));
    ui.sub.textContent = d.mode === "decimal" ? movedLine(d, L) : "";
    ui.sub.hidden = !ui.sub.textContent;
    const boardOn = d.mode === "fractionof" || d.moved >= d.plan.need;
    ui.pic.hidden = !boardOn;
    ui.pic.replaceChildren(d.mode === "fractionof" ? groupsView(d, L, readonly) : boardView(d, L));
    if (group !== undefined) ui.pic.querySelector(`[data-group="${group}"]`)?.focus({ preventScroll: true });
    ui.hint.textContent = hint(d, L);
    const p = d.finished || answered(d) ? parts(d, L) : null;
    ui.result.hidden = !p;
    if (p) {
      ui.result.replaceChildren(
        h("p", { class: "fm-div-eq" }, `${p.answer}.`),
        ...p.notes.map((n) => h("p", null, n)),
        d.finished ? h("p", null, p.check) : null,
      );
    }
    if (!readonly) {
      const kind = d.next?.kind;
      ui.pad.hidden = kind !== "pick";
      ui.next.hidden = !kind || kind === "pick" || kind === "take";
      if (!ui.next.hidden) ui.next.textContent = actionLabel(kind, d, L);
      ui.undo.disabled = !model.canUndo();
      if (lostFocus()) (ui.next.hidden ? ui.pad.querySelector("button") : ui.next)?.focus({ preventScroll: true });
    }
    if (ui.picks) {
      const now = JSON.stringify(d.problem);
      ui.picks.replaceChildren(
        ...d.presets.map((q, i) =>
          h("button", { type: "button", class: "fm-btn", "aria-pressed": String(JSON.stringify(q) === now), "data-pick": String(i) }, problemText(d.mode, q, L)),
        ),
      );
    }
    ui.desc.textContent = model.getAccessibleDescription(L);
  }

  const say = (d, lang2) => (d.finished ? `${parts(d, lang2).answer}. ${parts(d, lang2).check}` : hint(d, lang2));

  return createView(root, model, { lang, onChange, cls: "fm-div", build, sync, say });
}

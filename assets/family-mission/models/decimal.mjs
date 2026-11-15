// Family "decimal": decimal operations one move at a time. Two modes share one config {mode, ...}:
//   "addsub"   a chain of 2-3 terms joined by + and −. Estimate first, line up the decimal points
//              in a place-value chart, annex zeros, then add or subtract column by column from the
//              right with the regrouping shown.
//   "multiply" a × b. Estimate first, ignore the points, multiply the whole numbers, count the
//              decimal places in both factors, place the point, then check against the estimate.
// All arithmetic is exact (scaled integers + core.mjs rationals); every number prints with its
// decimal point in both languages.
import { button, createView, defineFamily, eq, h, put, t, toFrac } from "./core.mjs";
import { MAX_DEC, buildOps, estimateChain, exact, fixed, multiplyOf, parseDec, parseTerm, termText } from "./decimal-math.mjs";
import { STR, chainText, colMove, hintFor, hintText, MOVE } from "./decimal-text.mjs";
import { finalLines, moveNote, placePicker, renderAddSub, renderMultiply } from "./decimal-view.mjs";

export const id = "decimal";
export const label = { en: "Decimal operations", es: "Operaciones con decimales" };

const MODES = ["addsub", "multiply"];
const MAX_PRESETS = 4;
const MUL_MOVES = ["mEstimate", "ignore", "multiply", "count", "place", "check"].map((k) => ({ k }));
const isStr = (x) => typeof x === "string";

// ── State ────────────────────────────────────────────────────────────────────

/** The parsed problem and its ordered moves, or null when the state is not a valid problem. */
function analyze(st) {
  if (st.mode === "addsub") {
    if (!Array.isArray(st.terms) || st.terms.length < 2 || st.terms.length > 3) return null;
    const terms = st.terms.map((x, i) => parseTerm(x, i === 0));
    if (terms.some((x) => !x)) return null;
    const ops = buildOps(terms);
    if (!ops) return null;
    const moves = [{ k: "estimate" }];
    const starts = [];
    ops.forEach((o, op) => {
      starts.push(moves.length);
      moves.push({ k: "align", op });
      if (o.annex) moves.push({ k: "annex", op });
      for (const [c, col] of o.cols.entries()) {
        if (col.pos === o.P) moves.push({ k: "point", op });
        moves.push({ ...col, k: "col", op, c });
      }
    });
    return { terms, ops, moves, starts };
  }
  if (st.mode !== "multiply" || !isStr(st.a) || !isStr(st.b)) return null;
  const a = parseDec(st.a);
  const b = parseDec(st.b);
  // Each factor is at least 1 (so the whole-number estimate is a fair guide) and one has a point.
  if (!a || !b || a.scaled < 10 ** a.places || b.scaled < 10 ** b.places || a.places + b.places < 1) return null;
  const m = multiplyOf(st.a, st.b, st.trimTo);
  return m ? { m, moves: MUL_MOVES } : null;
}

function validateState(st) {
  if (!st || !MODES.includes(st.mode) || !Number.isInteger(st.step) || st.step < 0) return false;
  const p = analyze(st);
  if (!p || st.step > p.moves.length) return false;
  const modeOk =
    st.mode === "addsub"
      ? st.trimTo === undefined
      : (st.trimTo === null || (Number.isInteger(st.trimTo) && st.trimTo >= 1 && st.trimTo <= 2 * MAX_DEC)) && st.look === null;
  const lookOk = st.look === null || (Number.isInteger(st.look) && st.look >= -MAX_DEC && st.look <= 4);
  return modeOk && lookOk && Array.isArray(st.presets) && st.presets.length <= MAX_PRESETS;
}

/** Cleans the problem part of a config or preset; throws TypeError when it is not a decimal problem. */
function cleanProblem(mode, src) {
  const bad = (why) => new TypeError(`decimal: ${why}`);
  if (!src || typeof src !== "object") throw bad("the problem must be an object");
  if (mode === "addsub") {
    if (!Array.isArray(src.terms) || !src.terms.every(isStr)) throw bad('"terms" must be an array of strings like "128.75", "+46.8", "-19.35"');
    const terms = src.terms.map((x, i) => parseTerm(x, i === 0));
    if (terms.some((x) => !x)) throw bad("each term is a decimal (up to 4 whole digits and 3 decimal places); the first has no sign, the rest start with + or -");
    return { terms: terms.map((x, i) => termText(x, i === 0)) };
  }
  const a = isStr(src.a) && parseDec(src.a);
  const b = isStr(src.b) && parseDec(src.b);
  if (!a || !b) throw bad('"a" and "b" must be decimal strings like "12.60" and "4.5"');
  return { a: a.text, b: b.text };
}

function normalize(config) {
  const c = config || {};
  if (!MODES.includes(c.mode)) throw new TypeError(`decimal: mode must be one of ${MODES.join(", ")}`);
  const trimTo = c.mode === "multiply" ? (c.trimTo ?? null) : undefined;
  const make = (problem, presets) => ({ mode: c.mode, ...problem, ...(trimTo === undefined ? {} : { trimTo }), presets, step: 0, look: null });
  const list = c.presets ?? [];
  if (!Array.isArray(list) || list.length > MAX_PRESETS) throw new TypeError(`decimal: at most ${MAX_PRESETS} presets`);
  const presets = list.map((p) => cleanProblem(c.mode, p));
  const state = make(cleanProblem(c.mode, c), presets);
  for (const p of [state, ...presets.map((x) => make(x, []))]) {
    if (!validateState(p)) throw new TypeError("decimal: not a valid problem (the answer must not be negative, the chart must fit in 6 columns, and multiply factors must be at least 1 with a decimal point in one of them)");
  }
  return { state, task: c.task || null };
}

function reduce(st, patch) {
  const keys = Object.keys(patch);
  const p = analyze(st);
  const next = { ...st };
  if (keys.some((k) => ["terms", "a", "b"].includes(k))) {
    const fields = st.mode === "addsub" ? ["terms"] : ["a", "b"];
    if (!keys.every((k) => fields.includes(k))) throw new TypeError("decimal: wrong fields for this mode");
    Object.assign(next, cleanProblem(st.mode, { ...st, ...patch }), { step: 0, look: null });
    return next;
  }
  if (keys.length !== 1) throw new TypeError("decimal: one change at a time");
  const [key] = keys;
  const move = p.moves[st.step];
  if (key === "look") {
    if (st.mode !== "addsub") throw new RangeError("decimal: only the place-value chart has columns to look at");
    next.look = patch.look;
  } else if (key === "place") {
    if (move?.k !== "place" || patch.place !== p.m.total) throw new RangeError("decimal: that is not where the point goes");
    next.step += 1;
  } else if (key === "step") {
    if (patch.step !== st.step + 1 || !move || move.k === "place") throw new RangeError("decimal: the moves go in order");
    next.step = patch.step;
  } else throw new TypeError(`decimal: unknown change "${key}"`);
  return next;
}

// ── Derived view-model ───────────────────────────────────────────────────────

function derive(st) {
  const p = analyze(st);
  const next = p.moves[st.step] || null;
  const base = {
    mode: st.mode,
    step: st.step,
    moves: p.moves,
    next,
    finished: st.step === p.moves.length,
    look: st.look,
    trimTo: st.trimTo ?? null,
    presets: st.presets.map((q) => ({
      patch: q,
      label: st.mode === "addsub" ? chainText(q.terms.map((x, i) => ({ sign: x.startsWith("-") ? -1 : 1, text: i ? x.slice(1) : x }))) : `${q.a} × ${q.b}`,
      on: st.mode === "addsub" ? q.terms.join("|") === st.terms.join("|") : q.a === st.a && q.b === st.b,
    })),
  };
  if (st.mode === "multiply") return { ...base, m: p.m, expression: `${p.m.a.text} × ${p.m.b.text}` };
  const active = next ? (next.op ?? 0) : p.ops.length - 1;
  const o = p.ops[active];
  const local = Math.min(Math.max(st.step - p.starts[active], 0), p.moves.filter((m) => m.op === active).length);
  const c0 = o.annex ? 2 : 1;
  const seq = Math.max(local - c0, 0);
  const upto = (i) => (i + 1 < p.ops.length ? p.starts[i + 1] : p.moves.length);
  const line = (q) => `${fixed(q.A, q.P)} ${q.sign > 0 ? "+" : "−"} ${fixed(q.B, q.P)} = ${q.result}`;
  return {
    ...base,
    ops: p.ops,
    est: estimateChain(p.terms),
    expression: chainText(p.terms.map((x) => ({ sign: x.sign, text: x.d.text }))),
    active,
    op: o,
    grid: { aligned: local >= 1, annexed: !o.annex || local >= 2, colsDone: seq <= o.P ? seq : seq - 1, pointDone: seq >= o.P + 1 },
    trail: p.ops.filter((q, i) => i !== active && st.step >= upto(i)).map(line),
    result: base.finished ? p.ops[p.ops.length - 1].result : null,
    resultValue: exact(p.ops[p.ops.length - 1].R, p.ops[p.ops.length - 1].P),
  };
}

// ── Words ────────────────────────────────────────────────────────────────────

/** Finished-problem lines as sentences: the equation first (it prints without a full stop). */
const sentences = ([eqn, ...rest]) => [`${eqn}.`, ...rest];
const moveLabel = (d, m, lang) => (m.k === "col" ? colMove(m, d.ops[m.op].sign, lang) : t(lang, MOVE[m.k]));

function accessibleDescription(st, lang) {
  const d = derive(st);
  const name = t(lang, d.mode === "addsub" ? { en: "Add and subtract decimals model", es: "Modelo de suma y resta de decimales" } : { en: "Multiply decimals model", es: "Modelo de multiplicación de decimales" });
  const hint = d.next ? (d.mode === "addsub" ? hintFor(d, lang) : hintText(d.next.k, lang)) : t(lang, STR.done);
  const sofar = d.mode === "addsub" && d.trail.length ? ` ${t(lang, STR.trail)}: ${d.trail.join(". ")}.` : "";
  return `${name}. ${t(lang, { en: "The problem is", es: "El problema es" })} ${d.expression}.${sofar} ${hint}`;
}

function explanation(st, lang) {
  const d = derive(st);
  const lines = [t(lang, { en: `Work out ${d.expression}.`, es: `Resuelve ${d.expression}.` })];
  if (d.finished) lines.push(...sentences(finalLines(d, lang)));
  else lines.push(d.mode === "addsub" ? hintFor(d, lang) : hintText(d.next.k, lang));
  return lines.join(" ");
}

function validateTask(st, task) {
  if (!task) return { ok: false, reason: "no-task", misconception: null };
  const d = derive(st);
  if (!d.finished) return { ok: false, reason: "not-finished", misconception: null };
  const want = task.answer === undefined ? null : toFrac(String(task.answer));
  if (!want) return { ok: true, reason: "correct", misconception: null };
  const have = d.mode === "addsub" ? d.resultValue : d.m.value;
  const same = eq(have, want);
  return { ok: same, reason: same ? "correct" : "incorrect", misconception: null };
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
  track: (patch) => !("look" in patch),
  describeConfig: (st) => ({
    mode: st.mode,
    ...(st.mode === "addsub" ? { terms: st.terms } : { a: st.a, b: st.b, trimTo: st.trimTo }),
    presets: st.presets,
  }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  let ui = {};
  let L = lang;
  let bag;
  let tried = null;
  const T = (k) => t(L, STR[k]);

  function build(v) {
    bag = v.bag;
    L = v.lang;
    ui = {};
    tried = null;
    const d0 = model.getState();
    ui.picks = d0.presets.length > 1 && !readonly ? h("div", { class: "fm-dec-picks", role: "group", "aria-label": T("problem") }) : null;
    ui.expr = h("p", { class: "fm-dec-expr", role: "group" });
    ui.stage = h("div", { class: "fm-dec-stage" });
    ui.last = h("p", { class: "fm-dec-last", hidden: "" });
    ui.hint = h("p", { class: "fm-explain fm-dec-hint", role: "status" });
    ui.moves = h("div", { class: "fm-dec-moves", role: "group", "aria-label": T("tap") });
    ui.msg = h("p", { class: "fm-msg", role: "status" });
    ui.result = h("div", { class: "fm-dec-result", hidden: "" });
    ui.desc = h("p", { class: "fm-sr" });
    if (!readonly) {
      bag.on(ui.moves, "click", (e) => {
        const b = e.target.closest?.("button");
        if (!b || b.disabled) return;
        if (b.dataset.place) {
          const g = Number(b.dataset.place);
          if (!model.setState({ place: g })) {
            tried = g;
            sync();
          }
        } else model.setState({ step: model.getState().step + 1 });
      });
      bag.on(ui.stage, "click", (e) => {
        const b = e.target.closest?.("[data-look]");
        if (!b) return;
        const e0 = Number(b.dataset.look);
        model.setState({ look: model.getState().look === e0 ? null : e0 });
      });
      if (ui.picks) {
        bag.on(ui.picks, "click", (e) => {
          const b = e.target.closest?.("[data-pick]");
          const q = b && model.getState().presets[Number(b.dataset.pick)];
          if (q) model.setState(q.patch);
        });
      }
    }
    put(root, ui.picks, ui.expr, ui.stage, ui.last, ui.hint, ui.moves, ui.msg, ui.result, ui.desc);
    if (!readonly) {
      ui.undo = button(bag, T("undo"), { onClick: () => model.undo() });
      ui.reset = button(bag, T("reset"), { onClick: () => model.reset() });
      put(root, h("div", { class: "fm-actions" }, ui.undo, ui.reset));
    }
  }

  function sync() {
    const d = model.getState();
    const focusKey = root.contains(globalThis.document.activeElement) ? globalThis.document.activeElement.dataset?.focus : null;
    ui.expr.textContent = d.expression;
    ui.expr.setAttribute("aria-label", d.expression);
    const opts = { lang: L, readonly };
    ui.stage.replaceChildren(...(d.mode === "addsub" ? renderAddSub(d, opts) : [renderMultiply(d, opts)]));
    const note = d.step && d.mode === "addsub" ? moveNote(d, L) : ""; // multiply shows each note on its card
    ui.last.hidden = !note;
    ui.last.textContent = note;
    ui.hint.textContent = d.next ? (d.mode === "addsub" ? hintFor(d, L) : hintText(d.next.k, L)) : T("done");
    ui.moves.replaceChildren(...moveButtons(d));
    ui.msg.textContent = tried === null ? "" : placePicker.miss(d, tried, L);
    tried = null;
    ui.result.hidden = !d.finished;
    if (d.finished) ui.result.replaceChildren(...finalLines(d, L).map((line, i) => h("p", { class: i ? null : "fm-dec-eq" }, line)));
    if (ui.picks) {
      ui.picks.replaceChildren(
        ...d.presets.map((q, i) => h("button", { type: "button", class: "fm-btn", "aria-pressed": String(q.on), "data-pick": String(i), "data-focus": `pick:${i}` }, q.label)),
      );
    }
    ui.undo && (ui.undo.disabled = !model.canUndo());
    ui.desc.textContent = model.getAccessibleDescription(L);
    if (focusKey) (root.querySelector(`[data-focus="${focusKey}"]`) || ui.moves.querySelector("button") || ui.undo)?.focus({ preventScroll: true });
  }

  function moveButtons(d) {
    if (readonly || !d.next) return [];
    if (d.next.k === "place") return placePicker.buttons(d, L);
    return [h("button", { type: "button", class: "fm-btn fm-dec-move is-next", "data-focus": "move" }, moveLabel(d, d.next, L))];
  }

  const say = (d, lang2) => (d.finished ? sentences(finalLines(d, lang2)).slice(0, 2).join(" ") : `${moveNote(d, lang2)} ${d.mode === "addsub" ? hintFor(d, lang2) : hintText(d.next.k, lang2)}`.trim());

  return createView(root, model, { lang, onChange, cls: "fm-dec", build, sync, say });
}

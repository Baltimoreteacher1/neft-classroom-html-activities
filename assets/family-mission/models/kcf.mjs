// Family "kcf": dividing fractions with Keep, Change, Flip, one move per tap. The family picks a
// problem (a whole number, a fraction or a mixed number on each side), then taps the moves in order:
// write each number as a fraction (only when something needs it), Keep the first, Change ÷ to ×,
// Flip the second, then multiply across and simplify. Every step of the picture is real arithmetic
// on exact integers; the check at the end multiplies the answer back.
import { parseKcfNumber } from "../../design/family/art/math-models-kcf.mjs";
import { button, clear, createView, defineFamily, h, put, s, stext, t } from "./core.mjs";

export const id = "kcf";
export const label = { en: "Keep, Change, Flip", es: "Mantener, Cambiar, Invertir" };

const MAX_PRESETS = 4;
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

// ── State ────────────────────────────────────────────────────────────────────

const clean = (v) => String(v ?? "").trim();
function problemOk(dividend, divisor) {
  try {
    parseKcfNumber(dividend, "dividend");
    return parseKcfNumber(divisor, "divisor").n > 0;
  } catch {
    return false;
  }
}
const movesFor = (a, b) =>
  a.kind !== "fraction" || b.kind !== "fraction" ? ["fractions", "keep", "change", "flip", "multiply"] : ["keep", "change", "flip", "multiply"];

function validateState(st) {
  if (!st || !problemOk(st.dividend, st.divisor)) return false;
  const moves = movesFor(parseKcfNumber(st.dividend), parseKcfNumber(st.divisor));
  return Number.isInteger(st.done) && st.done >= 0 && st.done <= moves.length;
}

function normalize(config) {
  const c = config || {};
  const presets = (c.presets || []).slice(0, MAX_PRESETS).map((p) => ({ dividend: clean(p.dividend), divisor: clean(p.divisor) }));
  for (const p of presets) if (!problemOk(p.dividend, p.divisor)) throw new TypeError("kcf: every preset needs a valid dividend and divisor");
  const state = { dividend: clean(c.dividend), divisor: clean(c.divisor), done: 0, presets };
  if (!validateState(state)) throw new TypeError("kcf: dividend and divisor must each be a whole number, a fraction or a mixed number, and the divisor cannot be zero");
  return { state, task: c.task || null };
}

function reduce(st, patch) {
  if ("done" in patch && patch.done > st.done + 1) throw new RangeError("kcf: the moves go in order");
  const next = { ...st, ...patch };
  if (("dividend" in patch || "divisor" in patch) && !("done" in patch)) next.done = 0;
  next.dividend = clean(next.dividend);
  next.divisor = clean(next.divisor);
  return next;
}

// ── Arithmetic and words ─────────────────────────────────────────────────────

const fr = (x) => `${x.n}/${x.d}`;
const frOrWhole = (x) => (x.d === 1 ? String(x.n) : fr(x));
const reduced = (n, d) => {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};

function derive(st) {
  const a = parseKcfNumber(st.dividend);
  const b = parseKcfNumber(st.divisor);
  const moves = movesFor(a, b);
  const applied = Object.fromEntries(moves.map((m, i) => [m, i < st.done]));
  const convert = moves[0] === "fractions";
  const asFractions = !convert || applied.fractions;
  const prodN = a.n * b.d;
  const prodD = a.d * b.n;
  const simple = reduced(prodN, prodD);
  return {
    problem: { dividend: st.dividend, divisor: st.divisor },
    presets: st.presets,
    moves,
    done: st.done,
    next: moves[st.done] || null,
    applied,
    tokens: {
      a: asFractions ? fr(a) : st.dividend,
      op: applied.change ? "×" : "÷",
      b: applied.flip ? `${b.d}/${b.n}` : asFractions ? fr(b) : st.divisor,
    },
    product: { n: prodN, d: prodD },
    answer: simple,
    simplified: simple.n !== prodN || simple.d !== prodD,
    smaller: prodN * a.d < a.n * prodD,
    finished: st.done === moves.length,
  };
}

const STEP = {
  fractions: { en: "Write as fractions", es: "Escribir como fracciones" },
  keep: { en: "Keep", es: "Mantener" },
  change: { en: "Change", es: "Cambiar" },
  flip: { en: "Flip", es: "Invertir" },
  multiply: { en: "Multiply and simplify", es: "Multiplicar y simplificar" },
};
const HINT = {
  fractions: { en: "Write each whole or mixed number as a fraction: a whole number goes over 1.", es: "Escribe cada entero o número mixto como fracción: un entero va sobre 1." },
  keep: { en: "Keep the first fraction exactly as it is.", es: "Mantén la primera fracción tal como está." },
  change: { en: "Change the division sign to a multiplication sign.", es: "Cambia el signo de dividir por el de multiplicar." },
  flip: { en: "Flip the second fraction: the top and bottom trade places.", es: "Invierte la segunda fracción: el numerador y el denominador cambian de lugar." },
  multiply: { en: "Multiply the tops, multiply the bottoms, then simplify.", es: "Multiplica los numeradores, multiplica los denominadores y luego simplifica." },
};
const STR = {
  problem: { en: "Pick a problem", es: "Elige un problema" },
  tap: { en: "Tap the next move", es: "Toca el siguiente paso" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  done: { en: "All moves done.", es: "Todos los pasos hechos." },
};

function equation(d) {
  const t0 = d.tokens;
  return `${t0.a} ${t0.op} ${t0.b}`;
}
function resultLine(d) {
  const p = fr(d.product);
  return `${d.tokens.a} × ${d.tokens.b} = ${p}${d.simplified ? ` = ${frOrWhole(d.answer)}` : ""}`;
}
function checkLine(st, d, lang) {
  const b = parseKcfNumber(st.divisor);
  const a = parseKcfNumber(st.dividend);
  const back = reduced(d.answer.n * b.n, d.answer.d * b.d);
  const start = reduced(a.n, a.d);
  const ok = back.n === start.n && back.d === start.d;
  return t(lang, {
    en: `Check: ${frOrWhole(d.answer)} × ${fr(b)} = ${frOrWhole(back)}${ok ? `. It matches the start, ${frOrWhole(start)}.` : "."}`,
    es: `Comprueba: ${frOrWhole(d.answer)} × ${fr(b)} = ${frOrWhole(back)}${ok ? `. Coincide con el inicio, ${frOrWhole(start)}.` : "."}`,
  });
}
function sizeLine(d, lang) {
  const a = d.tokens.a;
  return t(lang, {
    en: `${frOrWhole(d.answer)} is ${d.smaller ? "less" : "more"} than ${a}.`,
    es: `${frOrWhole(d.answer)} es ${d.smaller ? "menos" : "más"} que ${a}.`,
  });
}

function accessibleDescription(st, lang) {
  const d = derive(st);
  const step = d.next ? t(lang, HINT[d.next]) : t(lang, STR.done);
  return t(lang, {
    en: `Keep, Change, Flip model. The problem is ${st.dividend} ÷ ${st.divisor}. Now it reads ${equation(d)}. ${step}`,
    es: `Modelo Mantener, Cambiar, Invertir. El problema es ${st.dividend} ÷ ${st.divisor}. Ahora dice ${equation(d)}. ${step}`,
  });
}

function explanation(st, lang) {
  const d = derive(st);
  const lines = [t(lang, { en: `Divide ${st.dividend} by ${st.divisor}.`, es: `Divide ${st.dividend} entre ${st.divisor}.` })];
  if (d.finished) lines.push(`${resultLine(d)}.`, sizeLine(d, lang), checkLine(st, d, lang));
  else if (d.next) lines.push(t(lang, HINT[d.next]));
  return lines.join(" ");
}

function validateTask(st, task) {
  if (!task) return { ok: false, reason: "no-task", misconception: null };
  const d = derive(st);
  if (!d.finished) return { ok: false, reason: "not-finished", misconception: null };
  const want = task.answer === undefined ? null : parseKcfNumber(String(task.answer));
  if (!want) return { ok: true, reason: "correct", misconception: null };
  const w = reduced(want.n, want.d);
  const same = w.n === d.answer.n && w.d === d.answer.d;
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
  describeConfig: (st) => ({ dividend: st.dividend, divisor: st.divisor, presets: st.presets }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

/** "3/4" -> stacked fraction, "2 1/2" -> whole + stacked fraction, "6" -> plain number. */
function numeral(text) {
  const m = String(text).match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
  if (!m) return h("span", { class: "fm-kcf-num" }, text);
  const frac = h("span", { class: "fm-kcf-frac", "aria-hidden": "true" }, h("span", null, m[2]), h("span", null, m[3]));
  return h("span", { class: "fm-kcf-num", role: "text", "aria-label": `${m[1] ? `${m[1]} and ` : ""}${m[2]} over ${m[3]}` }, m[1] || null, frac);
}

const problemLabel = (p) => `${p.dividend} ÷ ${p.divisor}`;

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  let bag;
  let ui = {};
  let L = lang;
  const T = (k) => t(L, STR[k]);

  function build(v) {
    bag = v.bag;
    L = v.lang;
    ui = {};
    const st0 = model.getState();
    ui.picks = st0.presets.length > 1 && !readonly ? h("div", { class: "fm-kcf-picks", role: "group", "aria-label": T("problem") }) : null;
    ui.expr = h("p", { class: "fm-kcf-expr", role: "group" });
    ui.barSvg = s("svg", { class: "fm-svg", viewBox: "0 0 360 108", role: "img" });
    ui.barSec = h("section", { class: "fm-view fm-kcf-bars" }, ui.barSvg);
    ui.moves = h("div", { class: "fm-kcf-moves", role: "group", "aria-label": T("tap") });
    ui.hint = h("p", { class: "fm-explain fm-kcf-hint", role: "status" });
    ui.result = h("div", { class: "fm-kcf-result", hidden: "" });
    ui.desc = h("p", { class: "fm-sr" });
    if (!readonly) {
      bag.on(ui.moves, "click", (e) => {
        const b = e.target.closest?.("[data-move]");
        if (b && !b.disabled) model.setState({ done: Number(b.dataset.move) });
      });
      if (ui.picks) {
        bag.on(ui.picks, "click", (e) => {
          const b = e.target.closest?.("[data-pick]");
          const p = b && model.getState().presets[Number(b.dataset.pick)];
          if (p) model.setState({ dividend: p.dividend, divisor: p.divisor });
        });
      }
    }
    put(root, ui.picks, ui.expr, ui.barSec, ui.moves, ui.hint, ui.result);
    put(root, ui.desc);
    if (!readonly) {
      ui.undo = button(bag, T("undo"), { onClick: () => model.undo() });
      ui.reset = button(bag, T("reset"), { onClick: () => model.reset() });
      put(root, h("div", { class: "fm-actions" }, ui.undo, ui.reset));
    }
  }

  function drawBars(d) {
    const svg = ui.barSvg;
    clear(svg);
    const a = parseKcfNumber(d.problem.dividend);
    const b = parseKcfNumber(d.problem.divisor);
    const aVal = a.n / a.d;
    const bVal = b.n / b.d;
    const wholes = Math.max(1, Math.ceil(Math.max(aVal, bVal)));
    const x0 = 16;
    const bw = 328;
    const unitW = bw / wholes;
    const yA = 22;
    const yB = 68;
    const bh = 22;

    svg.setAttribute("aria-label", `${d.problem.dividend} ÷ ${d.problem.divisor}`);
    svg.append(
      stext(x0, 15, `${d.problem.dividend}`, "fm-svg-text fm-svg-strong"),
      stext(x0 + bw, 15, t(L, { en: `${wholes} whole${wholes === 1 ? "" : "s"}`, es: `${wholes} entero${wholes === 1 ? "" : "s"}` }), "fm-svg-text fm-svg-muted", "end"),
      s("rect", { class: "fm-tape-bg", x: x0, y: yA, width: bw, height: bh, rx: 4 }),
      s("rect", { class: "fm-fill", x: x0, y: yA, width: aVal * unitW, height: bh, rx: 3 }),
    );
    for (let w = 0; w < wholes; w++) {
      const wx = x0 + w * unitW;
      if (w > 0) svg.append(s("line", { class: "fm-axis", x1: wx, x2: wx, y1: yA - 2, y2: yA + bh + 2 }));
      if (wholes <= 6 && a.d > 1 && a.d <= 12) {
        for (let k = 1; k < a.d; k++) {
          const tx = wx + (k / a.d) * unitW;
          svg.append(s("line", { class: "fm-grid-lines", x1: tx, x2: tx, y1: yA + 2, y2: yA + bh - 2 }));
        }
      }
    }
    svg.append(s("rect", { class: "fm-grid-edge", x: x0, y: yA, width: bw, height: bh, rx: 4 }));

    // Divisor pieces tiled across the dividend
    const q = aVal / bVal;
    const pieceW = bVal * unitW;
    const count = Math.ceil(q - 1e-9);
    const maxDraw = Math.min(count, 16);
    svg.append(
      stext(x0, yB - 7, t(L, { en: `Groups of ${d.problem.divisor}`, es: `Grupos de ${d.problem.divisor}` }), "fm-svg-text"),
      s("rect", { class: "fm-tape-bg", x: x0, y: yB, width: bw, height: bh, rx: 4 }),
    );
    for (let i = 0; i < maxDraw; i++) {
      const share = Math.min(1, q - i);
      const px = x0 + i * pieceW;
      const pw = pieceW * share;
      if (pw <= 0.5) break;
      svg.append(
        s("rect", {
          class: i % 2 ? "fm-fill fm-fill-alt" : "fm-fill",
          x: px,
          y: yB,
          width: pw,
          height: bh,
          rx: 2,
        }),
      );
      if (pw >= 16) {
        svg.append(stext(px + pw / 2, yB + 16, share < 0.99 ? "…" : String(i + 1), "fm-svg-text fm-tile-label", "middle"));
      }
    }
    svg.append(
      s("line", {
        class: "fm-connector",
        x1: x0 + aVal * unitW,
        x2: x0 + aVal * unitW,
        y1: yA + bh,
        y2: yB,
      }),
      s("rect", { class: "fm-tape-ref", x: x0, y: yB, width: aVal * unitW, height: bh, rx: 4 }),
    );
  }

  function sync() {
    const d = model.getState();
    drawBars(d);
    const st = { dividend: d.problem.dividend, divisor: d.problem.divisor };
    const word = (k, on) => (on ? h("span", { class: `fm-kcf-tag fm-kcf-tag-${k}` }, t(L, STEP[k])) : h("span", { class: "fm-kcf-tag fm-kcf-tag-none", "aria-hidden": "true" }, "·"));
    const cell = (cls, node, tag) => h("span", { class: `fm-kcf-cell ${cls}` }, node, tag);
    ui.expr.replaceChildren(
      cell(d.applied.keep ? "is-keep" : "", numeral(d.tokens.a), word("keep", d.applied.keep)),
      cell(d.applied.change ? "is-change" : "", h("span", { class: "fm-kcf-op" }, d.tokens.op), word("change", d.applied.change)),
      cell(d.applied.flip ? "is-flip" : "", numeral(d.tokens.b), word("flip", d.applied.flip)),
    );
    ui.expr.setAttribute("aria-label", equation(d));
    const hadFocus = ui.moves.contains(globalThis.document.activeElement);
    ui.moves.replaceChildren(
      ...d.moves.map((m, i) =>
        h(
          "button",
          {
            type: "button",
            class: `fm-btn fm-kcf-move${i === d.done ? " is-next" : ""}`,
            "aria-pressed": String(i < d.done),
            disabled: readonly || i !== d.done,
            "data-move": String(i + 1),
          },
          t(L, STEP[m]),
        ),
      ),
    );
    if (hadFocus) (ui.moves.querySelector(".is-next") || ui.undo)?.focus({ preventScroll: true });
    ui.hint.textContent = d.next ? t(L, HINT[d.next]) : T("done");
    ui.result.hidden = !d.finished;
    if (d.finished) {
      ui.result.replaceChildren(
        h("p", { class: "fm-kcf-eq" }, resultLine(d)),
        h("p", null, sizeLine(d, L)),
        h("p", null, checkLine(st, d, L)),
      );
    }
    if (ui.picks) {
      ui.picks.replaceChildren(
        ...d.presets.map((p, i) =>
          h(
            "button",
            {
              type: "button",
              class: "fm-btn",
              "aria-pressed": String(p.dividend === st.dividend && p.divisor === st.divisor),
              "data-pick": String(i),
            },
            problemLabel(p),
          ),
        ),
      );
    }
    ui.undo && (ui.undo.disabled = !model.canUndo());
    ui.desc.textContent = model.getAccessibleDescription(L);
  }

  const say = (d, lang2) => (d.finished ? `${resultLine(d)}. ${sizeLine(d, lang2)}` : `${equation(d)}. ${d.next ? t(lang2, HINT[d.next]) : ""}`);

  return createView(root, model, { lang, onChange, cls: "fm-kcf", build, sync, say });
}


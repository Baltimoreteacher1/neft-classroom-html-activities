// living/order-of-ops.js — the structure of an expression, evaluated in order.
//
// One cast for the whole play: a stack of lines. Line 0 is the whole
// expression, with every product in its own dashed box; each step the student
// takes adds a new line below that is EQUAL to the one above, so the whole
// expression stays on screen while its parts are evaluated one at a time. The
// student taps the part to evaluate; the order of operations decides whether
// it may go now, and a part that has to wait answers with a question about the
// picture, never the answer.
//
// Config: { terms:[["2","15"],["4","20"],["8","2^3"]], prefix:"$", meanings:[...],
//           story:{en,es}, transfer:{ terms:[["4","3^2"],["6"]], div:7, story } }
// — the lesson's own expressions (6-4 authors 2 × 15 + 4 × 20 + 8 × 2³ and
// (4 × 3² + 6) ÷ 7).

import { escHtml, prefersReducedMotion } from "../../core/living-scene.js";
import {
  allOps,
  applyOp,
  firstStepChoices,
  grouped,
  isLegal,
  misorders,
  opLabel,
  opResult,
  orderCopy,
  placeCorrect,
  solve,
  stateText,
  termText,
  termValue,
  validateOrderOfOps,
  valueOf,
} from "./order-of-ops-model.js";

export { validateOrderOfOps };

const W = 480;
const LH = 46;
const TOP = 46;
const X0 = 48;
const DIGIT = 14.8;

export function buildOrderOfOpsPlay(cfg) {
  const v = validateOrderOfOps(cfg);
  if (!v) return null;
  const { main, transfer, prefix, meanings } = v;
  const T = orderCopy(v);
  const f = (x) => `${prefix}${x}`;
  const mainLines = solve(main);
  const transferLines = solve(transfer);
  const MAXL = Math.max(mainLines.length, transferLines.length);
  const H = TOP + (MAXL - 1) * LH + 46;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  let c = null; // the cast

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const g = svgEl("g", {}, svg);
    c = {
      lines: Array.from({ length: MAXL }, () => svgEl("g", { opacity: 0 }, g)),
      legend: Array.from({ length: 5 }, () =>
        svgEl(
          "text",
          {
            x: 24,
            y: 0,
            "font-size": 18,
            "font-weight": 700,
            fill: "var(--lsx-ink)",
            opacity: 0,
            text: "",
          },
          g,
        ),
      ),
    };
  }

  /** Draw one state into group `g`; returns its width and the bounds of each piece. */
  function drawLine(ctx, g, st, { hl = null, eq = false } = {}) {
    g.innerHTML = "";
    g.removeAttribute("transform");
    const { svgEl } = ctx;
    const bounds = {};
    const boxes = [];
    let x = 0;
    const put = (text, extra = {}) =>
      svgEl(
        "text",
        { x, y: 0, "font-size": 24, "font-weight": 700, fill: "var(--lsx-ink)", text, ...extra },
        g,
      );
    const op = (ch) => {
      x += 9;
      put(ch, { fill: "var(--lsx-muted)" });
      x += 17 + 9;
    };
    if (eq)
      svgEl(
        "text",
        { x: -30, y: 0, "font-size": 24, "font-weight": 700, text: "=", fill: "var(--lsx-muted)" },
        g,
      );
    const group = grouped(st);
    const done =
      st.terms.length === 1 && st.terms[0].length === 1 && !("e" in st.terms[0][0]) && !st.div;
    if (group) {
      put("(", { fill: "var(--lsx-muted)" });
      x += 10;
    }
    st.terms.forEach((t, ti) => {
      if (ti > 0) op("+");
      const multi = t.length >= 2;
      const x0 = x;
      if (multi) x += 8;
      t.forEach((fa, fi) => {
        if (fi > 0) op("×");
        const a = x;
        if ("e" in fa) {
          put(String(fa.b));
          x += DIGIT * String(fa.b).length;
          put(String(fa.e), { x: x + 1, y: -10, "font-size": 15 });
          x += 11;
        } else {
          put(String(fa.v), done ? { fill: "var(--lsx-hi)" } : {});
          x += DIGIT * String(fa.v).length;
        }
        bounds[`f${ti}_${fi}`] = [a - 3, x + 3];
      });
      if (multi) x += 8;
      bounds[`t${ti}`] = [x0 - 2, x + 2];
      if (multi) boxes.push([x0, x]);
    });
    if (group) {
      x += 4;
      put(")", { fill: "var(--lsx-muted)" });
      x += 10;
    }
    if (st.div) {
      op("÷");
      put(String(st.div));
      x += DIGIT * String(st.div).length;
      bounds.div = [bounds.t0[0], x];
    }
    bounds.add = [bounds.t0[0], (bounds.t1 ?? bounds.t0)[1]];
    for (const [a, b] of boxes)
      g.prepend(
        svgEl("rect", {
          x: a,
          y: -28,
          width: b - a,
          height: 38,
          rx: 8,
          fill: "none",
          stroke: "var(--lsx-muted)",
          "stroke-width": 2.5,
          "stroke-dasharray": "6 4",
        }),
      );
    const key =
      hl && (hl.kind === "pow" ? `f${hl.t}_${hl.f}` : hl.kind === "mul" ? `t${hl.t}` : hl.kind);
    if (key && bounds[key])
      g.prepend(
        svgEl("rect", {
          x: bounds[key][0] - 3,
          y: -30,
          width: bounds[key][1] - bounds[key][0] + 6,
          height: 42,
          rx: 8,
          fill: "var(--lsx-u)",
          "fill-opacity": 0.55,
          stroke: "var(--lsx-lo)",
          "stroke-width": 2.5,
        }),
      );
    return { width: x, bounds };
  }

  /**
   * Put the stack of lines in one state: hist[0..count-1] drawn, the newest
   * optionally fading in, the rest hidden. `hl` marks the piece being worked on.
   */
  async function show(ctx, hist, count, { hl = null, fade = false, legend = false } = {}) {
    c.lines.forEach((g, i) => {
      const y = TOP + i * LH;
      if (i >= count) {
        g.setAttribute("opacity", "0");
        return;
      }
      const { width } = drawLine(ctx, g, hist[i], { eq: i > 0, hl: i === count - 1 ? hl : null });
      const s = Math.min(1, (W - X0 - 16) / width);
      g.setAttribute("transform", `translate(${X0},${y}) scale(${s})`);
      g.setAttribute("opacity", fade && i === count - 1 ? "0" : "1");
    });
    c.legend.forEach((t) => t.setAttribute("opacity", legend ? "1" : "0"));
    // The stage is only as tall as the lines it shows.
    const h = Math.max(TOP + (count - 1) * LH + 34, legend ? TOP + 56 + 4 * 34 + 20 : 0);
    ctx.svg.setAttribute("viewBox", `0 0 ${W} ${h}`);
    if (fade && count > 0) await ctx.tween([[c.lines[count - 1], { opacity: 1 }]], 350);
  }
  const pause = (ms) =>
    prefersReducedMotion() ? Promise.resolve() : new Promise((r) => setTimeout(r, ms));

  const stepsOf = (ops) => {
    const hist = [main];
    for (const o of ops) {
      const next = applyOp(hist[hist.length - 1], o);
      if (!next) return null;
      hist.push(next);
    }
    return hist;
  };
  const buttonLabel = (ctx, st, op) => `${ctx.L(T.verb[op.kind])} ${opLabel(st, op)}`;

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml(stateText(main)));
        ctx.say(T.situateSay);
        await show(ctx, [main], 1, { fade: true });
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.expr(escHtml(stateText(main)));
        ctx.say(T.predictSay);
        await show(ctx, [main], 1);
        const opts = firstStepChoices(main).map((o) => ({
          ...o,
          label: buttonLabel(ctx, main, o.op),
        }));
        const options = placeCorrect(opts, (stateText(main).length % 3) + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options: options.map((o) => ({ ...o, cue: undefined })),
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(T.cue(main, opt.op), "cue");
              await show(ctx, [main], 1, { hl: opt.op });
            },
            onCorrect: async (i) => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await show(ctx, [main], 1, { hl: options[i].op });
            },
          }),
        );
        if (saved.solved) await show(ctx, [main], 1);
      },
    },
    {
      id: "evaluate",
      label: T.scene.evaluate,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        let ops = Array.isArray(saved.ops) ? saved.ops : [];
        let hist = stepsOf(ops) ?? [main];
        if (hist.length === 1) ops = [];
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.scene.evaluate));
        ctx.panel.appendChild(row);
        let busy = false;
        const cur = () => hist[hist.length - 1];
        const finished = () => allOps(cur()).length === 0;
        const paintButtons = () => {
          row.innerHTML = "";
          if (finished()) return;
          for (const op of allOps(cur())) {
            const b = ctx.button({
              label: buttonLabel(ctx, cur(), op),
              onClick: async () => {
                if (busy) return;
                if (!isLegal(cur(), op)) {
                  b.classList.add("miss");
                  ctx.feedback(T.cue(cur(), op), "cue");
                  await show(ctx, hist, hist.length, { hl: op });
                  return;
                }
                busy = true;
                const label = opLabel(cur(), op);
                await show(ctx, hist, hist.length, { hl: op });
                await pause(450);
                const prev = cur();
                const result = applyOp(prev, op);
                hist = [...hist, result];
                ops = [...ops, op];
                st.ops = ops;
                ctx.save();
                ctx.expr(escHtml(stateText(cur())));
                ctx.feedback(T.stepNote({ label, result: opResult(prev, op) }));
                await show(ctx, hist, hist.length, { fade: true });
                busy = false;
                paintButtons();
                if (finished()) done();
              },
            });
            row.appendChild(b);
          }
        };
        const done = () => {
          ctx.feedback(T.evalDone);
          ctx.unlock();
        };
        const again = ctx.button({
          label: T.startOver,
          onClick: async () => {
            if (busy) return;
            hist = [main];
            ops = [];
            st.ops = [];
            ctx.save();
            ctx.feedback("");
            ctx.expr(escHtml(stateText(main)));
            await show(ctx, hist, 1);
            paintButtons();
          },
        });
        ctx.panel.appendChild(again);
        ctx.say(T.evalSay);
        ctx.expr(escHtml(stateText(cur())));
        await show(ctx, hist, hist.length);
        paintButtons();
        if (finished()) done();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        ctx.say(T.connectSay);
        ctx.expr(`${escHtml(stateText(main))} = ${hi(f(valueOf(main)))}`);
        await show(ctx, [main], 1, { legend: true });
        const rows = main.terms.map(
          (t, i) =>
            `${termText(t)} = ${f(termValue(t.map((fa) => ("e" in fa ? { v: fa.b ** fa.e } : fa))))}${meanings ? ` · ${ctx.L(meanings[i])}` : ""}`,
        );
        rows.push(
          `${main.terms.map((t) => f(termValue(t.map((fa) => ("e" in fa ? { v: fa.b ** fa.e } : fa))))).join(" + ")} = ${f(valueOf(main))}`,
        );
        c.legend.forEach((t, i) => {
          t.textContent = rows[i] ?? "";
          t.setAttribute("y", String(TOP + 56 + i * 34));
          t.setAttribute("opacity", rows[i] ? "1" : "0");
        });
        ctx.feedback(T.connectDone);
      },
    },
    {
      id: "check",
      label: T.scene.check,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.checkSay);
        ctx.expr(escHtml(stateText(main)));
        const right = valueOf(main);
        await show(ctx, [main], 1);
        const opts = [
          { kind: "right", value: right, correct: true },
          ...misorders(main)
            .slice(0, 3)
            .map((o) => ({ ...o, correct: false })),
        ].map((o) => ({ ...o, label: f(o.value) }));
        const options = placeCorrect(opts, (right % 3) + 1);
        const reveal = () =>
          show(
            ctx,
            mainLines.map((l) => l.state),
            mainLines.length,
          );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.checkQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.checkCue(opt), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.checkOk);
              ctx.unlock();
              await reveal();
            },
          }),
        );
        if (saved.solved) await reveal();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        ctx.say(T.transferSay);
        ctx.expr(escHtml(T.tText));
        const states = transferLines.map((l) => l.state);
        await show(ctx, [transfer], 1);
        const opts = firstStepChoices(transfer).map((o) => ({
          ...o,
          label: buttonLabel(ctx, transfer, o.op),
        }));
        const options = placeCorrect(opts, (T.tTotal % 3) + 1);
        const reveal = async () => {
          ctx.expr(`${escHtml(T.tText)} = ${hi(String(T.tTotal))}`);
          await show(ctx, states, states.length);
        };
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(T.cue(transfer, opt.op), "cue");
              await show(ctx, [transfer], 1, { hl: opt.op });
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await reveal();
            },
          }),
        );
        if (saved.solved) await reveal();
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    },
  ];

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup,
    scenes,
  };
}

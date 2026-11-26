// living/question-sort.js — what makes a question STATISTICAL (lesson 2-1).
//
// One cast for the whole play: two question cards, each with a number line and
// one dot per person asked. In scene 3 the student asks the same people both of
// the lesson's questions and the answers land as dots: the fixed-answer
// question piles every dot on one number, the statistical question spreads.
// Scene 5 reuses the SAME two cards and dots for two new questions the student
// must sort BEFORE their answers appear; scene 6 is a one-question transfer.
//
// Config: { story, crowd:{en:{one,many},es:{one,many}},
//   pair:[Q, Q], more:[Q, Q], transfer:{ prompt, options:[{text, statistical, cue}] } }
//   Q = { text:{en,es}, statistical, answers:[ints], axis:{min,max,step,label} }
// The `statistical` flag must agree with the answers (more than one distinct
// value), and each group holds exactly one of each kind, or the play refuses.

import { escHtml } from "../../core/living-scene.js";
import {
  placeCorrect,
  predictOptions,
  questionSortCopy,
  validateQuestionSort,
} from "./question-sort-model.js";

export { validateQuestionSort };

const W = 480;
const ROWH = 206;
const TOP = 12;
const H = TOP + 2 * ROWH + 8;
const AX0 = 36;
const AX1 = W - 36;
const D = 11; // a dot
const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

export function buildQuestionSortPlay(cfg) {
  const v = validateQuestionSort(cfg);
  if (!v) return null;
  const T = questionSortCopy(v);
  const { n, duo, more, transfer } = v;
  const rowTop = (k) => TOP + k * ROWH;
  const axisY = (k) => rowTop(k) + 158;
  const xOf = (q, val) => AX0 + ((val - q.axis.min) / (q.axis.max - q.axis.min)) * (AX1 - AX0);
  const dotAt = (q, i, k) => {
    const s = q.answers.slice(0, i).filter((x) => x === q.answers[i]).length;
    return {
      x: xOf(q, q.answers[i]) - D / 2,
      y: axisY(k) - 3 - D - s * (D + 1),
      width: D,
      height: D,
    };
  };

  let c = null; // the cast: one entry per question card
  const shown = [null, null]; // which question each card currently shows
  const rowsOf = (qs, o = {}) =>
    qs.map((q, k) => ({
      q,
      show: o.show !== false,
      asked: Array.isArray(o.asked) ? o.asked[k] : (o.asked ?? 0),
      badge: Array.isArray(o.badge) ? o.badge[k] : !!o.badge,
      hi: o.hi === k,
    }));

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const text = (attrs) =>
      el("text", { "font-size": 16, "font-weight": 700, fill: "var(--lsx-ink)", ...attrs });
    c = [0, 1].map((k) => {
      const T0 = rowTop(k);
      return {
        card: el("rect", {
          x: 12,
          y: T0,
          width: W - 24,
          height: 68,
          rx: 8,
          fill: "var(--lsx-card)",
          stroke: "var(--lsx-muted)",
          "stroke-width": 2,
        }),
        tag: text({ x: 24, y: T0 + 18, "font-size": 14, fill: "var(--lsx-muted)" }),
        badge: text({ x: W - 24, y: T0 + 18, "text-anchor": "end", "font-size": 15 }),
        l1: text({ x: 24, y: T0 + 41 }),
        l2: text({ x: 24, y: T0 + 60 }),
        axis: el("line", {
          x1: AX0 - 8,
          x2: AX1 + 8,
          y1: axisY(k),
          y2: axisY(k),
          stroke: "var(--lsx-ink)",
          "stroke-width": 2,
        }),
        ticks: svgEl("g", { opacity: 0 }, g),
        unit: text({
          x: W - 12,
          y: T0 + 198,
          "text-anchor": "end",
          "font-size": 14,
          fill: "var(--lsx-muted)",
        }),
        dots: Array.from({ length: n }, () =>
          el("rect", {
            x: 0,
            y: axisY(k),
            width: D,
            height: D,
            rx: D / 2,
            fill: "var(--lsx-x)",
            stroke: "var(--lsx-x-edge)",
            "stroke-width": 2,
          }),
        ),
      };
    });
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  function useAxis(ctx, k, q) {
    const t = c[k].ticks;
    t.innerHTML = "";
    const { min, max, step } = q.axis;
    for (let x = min; x <= max; x += step) {
      const px = xOf(q, x);
      ctx.svgEl(
        "line",
        {
          x1: px,
          x2: px,
          y1: axisY(k) - 5,
          y2: axisY(k) + 5,
          stroke: "var(--lsx-ink)",
          "stroke-width": 2,
        },
        t,
      );
      const attrs = { x: px, y: axisY(k) + 22, "text-anchor": "middle", "font-size": 15 };
      ctx.svgEl("text", { ...attrs, fill: "var(--lsx-muted)", text: String(x) }, t);
    }
  }

  /** Put the whole stage in one state; every scene calls this. */
  function view(ctx, rows, ms) {
    const m = [];
    rows.forEach((r, k) => {
      const e = c[k];
      if (shown[k] !== r.q) {
        shown[k] = r.q;
        useAxis(ctx, k, r.q);
      }
      const on = r.show ? 1 : 0;
      const lines = r.q.lines[ctx.lang];
      m.push([
        e.card,
        {
          opacity: on,
          stroke: r.hi ? "var(--lsx-lo)" : "var(--lsx-muted)",
          "stroke-width": r.hi ? 4 : 2,
        },
      ]);
      m.push([e.tag, { opacity: on, text: ctx.L(T.tag(k)) }]);
      m.push([e.badge, { opacity: r.badge ? 1 : 0, text: ctx.L(T.badge(r.q.statistical)) }]);
      m.push(
        [e.l1, { opacity: on, text: lines[0] }],
        [e.l2, { opacity: on, text: lines[1] || "" }],
      );
      m.push([e.axis, { opacity: on }], [e.ticks, { opacity: on }]);
      m.push([e.unit, { opacity: on, text: ctx.L(T.axisLabel(r.q)) }]);
      e.dots.forEach((d, i) => m.push([d, { ...dotAt(r.q, i, k), opacity: r.asked > i ? 1 : 0 }]));
    });
    return ctx.tween(m, ms);
  }

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.say(T.situateSay);
        ctx.expr("");
        await view(ctx, rowsOf(duo, { show: false }), 0);
        await view(ctx, rowsOf(duo), 450);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.predictSay);
        ctx.expr("");
        await view(ctx, rowsOf(duo), 300);
        const options = placeCorrect(predictOptions(v), 3 * n + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.predictCue(opt.kind), "cue");
              view(ctx, rowsOf(duo, { hi: T.cueRow(opt.kind) }), 200);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              view(ctx, rowsOf(duo), 200);
            },
          }),
        );
      },
    },
    {
      id: "ask",
      label: T.scene.ask,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        let k = Number.isInteger(st.asked) && st.asked >= 0 && st.asked <= n ? st.asked : 0;
        const paint = (ms) => view(ctx, rowsOf(duo, { asked: k }), ms);
        const btn = ctx.button({
          label: T.askBtn,
          primary: true,
          onClick: () => {
            if (k >= n) return;
            k += 1;
            st.asked = k;
            ctx.save();
            for (const e of c)
              e.dots[k - 1].setAttribute("y", String(+e.dots[k - 1].getAttribute("y") - 26));
            ctx.feedback(k === n ? T.askDone : T.asked(k));
            paint(380);
            if (k === n) {
              btn.disabled = true;
              ctx.unlock();
            }
          },
        });
        ctx.panel.appendChild(btn);
        ctx.say(T.askSay);
        ctx.expr("");
        await paint(k ? 0 : 250);
        if (k === n) {
          btn.disabled = true;
          ctx.feedback(T.askDone);
          ctx.unlock();
        } else if (k) ctx.feedback(T.asked(k));
      },
    },
    {
      id: "name",
      label: T.scene.name,
      async enter(ctx) {
        ctx.say(T.nameSay);
        ctx.feedback("");
        await view(ctx, rowsOf(duo, { asked: n }), 0);
        await view(ctx, rowsOf(duo, { asked: n, badge: true }), 450);
        ctx.expr(`${hi(ctx.L(T.nameExpr))}`);
      },
    },
    {
      id: "sort",
      label: T.scene.sort,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const done = [!!st.sorted?.[0], !!st.sorted?.[1]];
        const paint = (ms, hiRow) =>
          view(
            ctx,
            rowsOf(more, { asked: done.map((d) => (d ? n : 0)), badge: done, hi: hiRow }),
            ms,
          );
        ctx.say(T.sortSay);
        ctx.expr("");
        await view(ctx, rowsOf(duo, { asked: n, badge: true }), 0);
        await paint(550);
        more.forEach((q, k) => {
          const options = placeCorrect(
            T.sortOptions.map((o) => ({ ...o, correct: o.stat === q.statistical })),
            k + 1,
          );
          ctx.panel.appendChild(
            ctx.choices({
              question: T.sortQ(q),
              options,
              restore: done[k] ? options.findIndex((o) => o.correct) : null,
              onMiss: () => {
                ctx.feedback(T.sortCue(q), "cue");
                paint(200, k);
              },
              onCorrect: () => {
                done[k] = true;
                st.sorted = [...done];
                ctx.save();
                ctx.feedback(T.sortOk(q));
                paint(450);
                if (done[0] && done[1]) ctx.unlock();
              },
            }),
          );
        });
        if (done[0] && done[1]) ctx.unlock();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        ctx.say(T.transferSay);
        ctx.expr("");
        await view(ctx, rowsOf(more, { asked: n, badge: true }), 300);
        const options = placeCorrect(
          transfer.options.map((o) => ({ label: o.text, correct: o.statistical, cue: o.cue, o })),
          2 * n + 1,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: (i) => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk(options[i].o));
            },
          }),
        );
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

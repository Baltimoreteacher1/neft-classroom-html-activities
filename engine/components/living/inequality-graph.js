// living/inequality-graph.js — graph an inequality on a number line (lesson 8-5).
//
// Same number line as inequality-line.js (shared stage): the student decides
// whether the boundary is included (the circle), draws the circle and the
// shaded ray, checks the picture by testing values, and sees that every value
// on the ray is a solution — decimals too — before graphing a new inequality.
//
// Meaning never rests on colour: ✓ circle / ✗ square for tested values, ● / ○
// for the boundary, an arrow for "keeps going". Every control is a button or a
// slider.
//
// Config: { mode: "graph", sym, limit, letter, story,
//           transfer: { sym, limit, letter, story } }.

import { escHtml } from "../../core/living-scene.js";
import {
  circleChoices,
  graphChoices,
  graphCopy,
  graphCue,
  validateInequalityGraph,
  verdictSymbol,
} from "./inequality-graph-model.js";
import {
  createLineStage,
  doneView,
  explainBox,
  H,
  lineBase,
  markOf,
  pickScene,
  solvedText,
  testPanel,
  W,
} from "./inequality-line.js";
import { dirOf, holds, isClosed, rangeFor } from "./inequality-line-model.js";

export { validateInequalityGraph };

export function buildInequalityGraphPlay(cfg) {
  const v = validateInequalityGraph(cfg);
  if (!v) return null;
  const T = graphCopy(v);
  const { main: c, transfer: t } = v;
  const stage = createLineStage();
  const enterCommon = () => {
    stage.pick = null;
  };
  const base = lineBase;
  const done = (q) => doneView(T, q);
  const explain = (ctx) => explainBox(ctx, T);
  const pick = (ctx, saved, opts) => pickScene(ctx, stage, saved, opts);

  const drawn = (q, closed, dir) => ({
    ...base(q),
    top: solvedText(q),
    dot: closed == null ? null : { limit: q.limit, closed },
    ...(dir ? { ray: { limit: q.limit, dir } } : {}),
    ...(closed != null ? { note: T.marker({ sym: closed ? "≥" : ">" }) } : {}),
  });
  const withNeutralDot = (o, q) =>
    o.ray && !o.dot ? { ...o, dot: { limit: q.limit, closed: null } } : o;

  const graphScenes = [
    {
      id: "rule",
      label: T.labels[0],
      async enter(ctx) {
        enterCommon();
        ctx.say(T.situateSay);
        ctx.expr(escHtml(solvedText(c)));
        await stage.view(ctx, base(c, { top: solvedText(c) }), 500);
      },
    },
    {
      id: "circle",
      label: T.labels[1],
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        ctx.say(T.predictSay);
        ctx.expr(escHtml(solvedText(c)));
        const shown = base(c, { top: solvedText(c) });
        await pick(ctx, saved, {
          q: c,
          options: circleChoices(c),
          question: T.predictQ,
          ok: T.predictOk,
          shown,
          final: { ...shown, dot: { limit: c.limit, closed: isClosed(c.sym) }, note: T.marker(c) },
        });
      },
    },
    {
      id: "draw",
      label: T.labels[2],
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        const st = ctx.state;
        const pick = {
          closed: typeof st.closed === "boolean" ? st.closed : null,
          dir: st.dir === "left" || st.dir === "right" ? st.dir : null,
        };
        const current = () => withNeutralDot(drawn(c, pick.closed, pick.dir), c);
        ctx.say(T.drawSay);
        ctx.expr(escHtml(solvedText(c)));
        const group = (label, items) => {
          const wrap = document.createElement("div");
          wrap.className = "lsx-choices";
          wrap.setAttribute("role", "group");
          wrap.setAttribute("aria-label", ctx.L(label));
          for (const it of items) {
            const b = ctx.button({ label: it.label, onClick: () => it.onPick(b, wrap) });
            b.setAttribute("aria-pressed", "false");
            b.dataset.v = String(it.v);
            wrap.appendChild(b);
          }
          return wrap;
        };
        const press = (wrap, v) => {
          for (const b of wrap.querySelectorAll("button"))
            b.setAttribute("aria-pressed", String(b.dataset.v === String(v)));
        };
        const judge = async () => {
          const cue = graphCue(c, pick.closed, pick.dir);
          let o = current();
          if (cue && pick.dir && pick.dir !== dirOf(c.sym)) {
            const x = pick.dir === "right" ? c.limit + 2 : c.limit - 2;
            o = { ...o, marks: [markOf(c, x)] };
          }
          if (cue) ctx.feedback(cue, "cue");
          else if (pick.closed != null && pick.dir) {
            st.solved = true;
            ctx.save();
            ctx.feedback(T.drawOk);
            ctx.unlock();
          } else ctx.feedback("");
          await stage.view(ctx, o, 300);
        };
        const circleG = group(T.circleLabel, [
          {
            v: "open",
            label: { en: "○ Open", es: "○ Abierto" },
            onPick: (_b, w) => {
              pick.closed = false;
              st.closed = false;
              ctx.save();
              press(w, "open");
              judge();
            },
          },
          {
            v: "closed",
            label: { en: "● Closed", es: "● Cerrado" },
            onPick: (_b, w) => {
              pick.closed = true;
              st.closed = true;
              ctx.save();
              press(w, "closed");
              judge();
            },
          },
        ]);
        const dirG = group(T.dirLabel, [
          {
            v: "left",
            label: { en: "← Shade left", es: "← Sombrea a la izquierda" },
            onPick: (_b, w) => {
              pick.dir = "left";
              st.dir = "left";
              ctx.save();
              press(w, "left");
              judge();
            },
          },
          {
            v: "right",
            label: { en: "Shade right →", es: "Sombrea a la derecha →" },
            onPick: (_b, w) => {
              pick.dir = "right";
              st.dir = "right";
              ctx.save();
              press(w, "right");
              judge();
            },
          },
        ]);
        for (const [g, key] of [
          [circleG, "closed"],
          [dirG, "dir"],
        ]) {
          const val =
            key === "closed"
              ? pick.closed == null
                ? null
                : pick.closed
                  ? "closed"
                  : "open"
              : pick.dir;
          if (val) press(g, val);
        }
        const q = (label) => {
          const p = document.createElement("p");
          p.className = "lsx-q";
          p.textContent = ctx.L(label);
          return p;
        };
        const tp = testPanel(ctx, stage, {
          lo: rangeFor(c.limit).lo,
          hi: rangeFor(c.limit).hi,
          ok: (x) => holds(c.sym, x, c.limit),
          verdict: (x) => verdictSymbol(c, x),
          base: current,
          label: { en: `Test ${c.letter}`, es: `Prueba ${c.letter}` },
        });
        ctx.panel.append(q(T.circleLabel), circleG, q(T.dirLabel), dirG, tp.el);
        await tp.paint(0);
        if (saved.solved) ctx.feedback(T.drawOk);
      },
    },
    {
      id: "every",
      label: T.labels[3],
      async enter(ctx) {
        enterCommon();
        ctx.say(T.everySay);
        const xs = T.samples(c);
        const marks = xs.map((x) => ({ v: x, ok: holds(c.sym, x, c.limit) }));
        ctx.expr(escHtml(marks.map((m) => `${m.v} ${m.ok ? "✓" : "✗"}`).join("   ")));
        await stage.view(ctx, { ...done(c), marks: [] }, 400);
        await stage.view(ctx, { ...done(c), marks }, 700);
      },
    },
    {
      id: "transfer",
      label: T.labels[4],
      async enter(ctx, saved) {
        enterCommon();
        ctx.say(T.transferSay);
        ctx.expr(escHtml(solvedText(t)));
        const shown = base(t, { top: solvedText(t) });
        const opts = graphChoices(t);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options: opts,
            restore: saved.solved ? opts.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              const wrong = withNeutralDot(drawn(t, opt.closed, opt.dir), t);
              const x = opt.dir === "right" ? t.limit + 2 : t.limit - 2;
              await stage.view(
                ctx,
                { ...wrong, marks: opt.dir !== dirOf(t.sym) ? [markOf(t, x)] : [] },
                350,
              );
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await stage.view(ctx, done(t), 650);
            },
          }),
        );
        if (saved.solved) ctx.feedback(T.transferOk);
        await stage.view(ctx, saved.solved ? done(t) : shown, 0);
        explain(ctx);
      },
    },
  ];
  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup: stage.setup,
    scenes: graphScenes,
  };
}

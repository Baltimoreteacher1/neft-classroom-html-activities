// living/percent-estimate.js — bracket a percent of a number with benchmarks.
//
// One cast for the whole play: a percent bar (top scale 0%-100%, bottom scale
// the amount) with a pin at the percent being estimated. Rounding the whole to
// a friendly number, then showing the 10%, 25% and 50% benchmark marks, lets the
// student read an estimate beside the pin; the last scenes check it against
// the exact value and estimate a new problem.
//
// Config: { percent, whole, compat, bench, prefix | unit, story,
// transfer:{ percent, whole, compat, bench, unit, story } } — the lesson's own
// numbers (4-3 authors 24% of $81 with 25% of 80, and 8.6% of 216 pounds with
// 10% of 220). Every number and sentence comes from percent-estimate-model.js.

import { escHtml } from "../../core/living-scene.js";
import {
  amtPair,
  BENCHES,
  checkChoices,
  choicesFor,
  estimateCopy,
  fmt,
  numTxt,
  placeNotFirst,
  validatePercentEstimate,
} from "./percent-estimate-model.js";

export { validatePercentEstimate };

const W = 480;
const H = 300;
const BX = 40;
const BW = 400;
const BY = 112;
const BH = 40;

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

export function buildPercentEstimatePlay(cfg) {
  const v = validatePercentEstimate(cfg);
  if (!v) return null;
  const t = v.transfer;
  const copy = estimateCopy(v);
  let cast = null;
  let L = (x) => x.en;

  const px = (pc) => BX + (pc * BW) / 100;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    L = ctx.L;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const T = (a) =>
      svgEl(
        "text",
        {
          "font-size": 16,
          "font-weight": 700,
          fill: "var(--lsx-ink)",
          "text-anchor": "middle",
          opacity: 0,
          stroke: "var(--lsx-card)",
          "stroke-width": 4,
          "paint-order": "stroke",
          ...a,
        },
        g,
      );
    const line = (a) =>
      svgEl("line", { stroke: "var(--lsx-ink)", "stroke-width": 2, opacity: 0, ...a }, g);
    cast = {
      shade: svgEl(
        "rect",
        {
          x: BX,
          y: BY,
          width: 0,
          height: BH,
          fill: "var(--lsx-x)",
          "fill-opacity": 0.4,
          opacity: 0,
        },
        g,
      ),
      frame: svgEl(
        "rect",
        {
          x: BX,
          y: BY,
          width: BW,
          height: BH,
          fill: "none",
          stroke: "var(--lsx-ink)",
          "stroke-width": 2.5,
          opacity: 0,
        },
        g,
      ),
      wholeLbl: T({ x: BX + BW, y: 66, "font-size": 17, "text-anchor": "end" }),
      pin: line({ y1: BY - 10, y2: BY + BH + 10, stroke: "var(--lsx-hi)", "stroke-width": 4 }),
      pinLbl: T({ y: BY - 18, "font-size": 20, fill: "var(--lsx-hi)" }),
      tick: BENCHES.map(() => line({ y1: BY + BH, y2: BY + BH + 12, "stroke-width": 3 })),
      tickPct: BENCHES.map(() => T({ y: BY + BH + 34, "font-size": 17 })),
      tickAmt: BENCHES.map(() => T({ y: BY + BH + 60, "font-size": 19, fill: "var(--lsx-lo)" })),
      est1: T({ x: W / 2, y: 252, "font-size": 22, "font-weight": 800, fill: "var(--lsx-hi)" }),
      est2: T({ x: W / 2, y: 284, "font-size": 22, "font-weight": 800, fill: "var(--lsx-lo)" }),
      ghostLine: line({
        y1: BY - 8,
        y2: BY + BH + 8,
        "stroke-dasharray": "4 3",
        "stroke-width": 3,
      }),
      ghostTxt: T({ y: BY + BH + 98, "font-size": 16 }),
    };
  }

  const OFF = { opacity: 0 };
  const ON = { opacity: 1 };

  /**
   * Everything on the stage for problem `s`. o = { pin, rounded, benches:[bool],
   * est1, est2, ghost:{pos, label} }.
   */
  function paint(s, o) {
    const m = [];
    const xp = px(s.percent);
    cast.pinLbl.textContent = `${s.percent}%`;
    cast.wholeLbl.textContent = L(
      copy.wholeLbl(s, (o.rounded ? s.compat : s.whole) * 100, o.rounded),
    );
    cast.est1.textContent = o.est1 || "";
    cast.est2.textContent = o.est2 || "";
    m.push([cast.frame, ON], [cast.wholeLbl, ON]);
    m.push([cast.shade, { ...(o.pin ? ON : OFF), width: xp - BX }]);
    m.push(
      [cast.pin, { ...(o.pin ? ON : OFF), x1: xp, x2: xp }],
      [cast.pinLbl, { ...(o.pin ? ON : OFF), x: xp }],
    );
    BENCHES.forEach((b, i) => {
      const on = !!o.benches?.[i];
      const x = px(b);
      cast.tickPct[i].textContent = `${b}%`;
      cast.tickAmt[i].textContent = o.rounded ? numTxt(s, ((s.compat * b) / 100) * 100) : "";
      const hot = o.hot === b;
      m.push([cast.tick[i], { ...(on ? ON : OFF), x1: x, x2: x, "stroke-width": hot ? 6 : 3 }]);
      m.push([cast.tickPct[i], { ...(on ? ON : OFF), x }]);
      m.push([cast.tickAmt[i], { ...(on && o.rounded ? ON : OFF), x }]);
    });
    m.push([cast.est1, o.est1 ? ON : OFF], [cast.est2, o.est2 ? ON : OFF]);
    if (o.ghost) {
      const gx = px(Math.min(100, (o.ghost.v * 100) / s.whole));
      cast.ghostTxt.textContent = o.ghost.label;
      m.push(
        [cast.ghostLine, { ...ON, x1: gx, x2: gx }],
        [cast.ghostTxt, { ...ON, x: Math.min(W - 80, Math.max(80, gx)) }],
      );
    } else m.push([cast.ghostLine, OFF], [cast.ghostTxt, OFF]);
    return m;
  }

  const ofw = () => L({ en: "of", es: "de" });
  const exprOf = (s, solved) =>
    `${hi(`${s.percent}%`)} ${ofw()} ${s.whole} ${solved ? `≈ ${hi(String(s.est))}` : "= ?"}`;
  const lineOf = (s) =>
    `${s.percent}% ${ofw()} ${s.whole} ≈ ${s.bench}% ${ofw()} ${s.compat} = ${s.est}`;
  const opts = (s, seed, cue) =>
    placeNotFirst(
      choicesFor(s).map((o) => ({
        ...o,
        label: L(copy.about(amtPair(s, o.v * 100))),
        cue: o.correct ? null : cue(o.kind, o.v),
      })),
      seed,
    );
  const allBenches = [true, true, true];

  const scenes = [
    {
      id: "situate",
      label: copy.scene.situate,
      async enter(ctx) {
        L = ctx.L;
        await ctx.tween(paint(v, { pin: false }), 0);
        await ctx.tween(paint(v, { pin: true }), 600);
        ctx.expr(exprOf(v, false));
        ctx.say(copy.situate.say);
        ctx.feedback(copy.situate.note);
      },
    },
    {
      id: "predict",
      label: copy.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        L = ctx.L;
        const solved = !!saved.solved;
        await ctx.tween(paint(v, { pin: true }), 300);
        ctx.expr(exprOf(v, solved));
        ctx.say(copy.predict.say);
        const options = opts(v, v.whole + v.compat, (kind, x) => ctx.L(copy.predict.cue(kind, x)));
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(paint(v, { pin: true, ghost: { v: opt.v, label: opt.label } }), 350);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(v, { pin: true }), 300);
              ctx.expr(exprOf(v, true));
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "bench",
      label: copy.scene.bench,
      gate: true,
      async enter(ctx) {
        L = ctx.L;
        const st = ctx.state;
        st.shown = Array.isArray(st.shown) ? st.shown.filter((b) => BENCHES.includes(b)) : [];
        const rounded = () => st.rounded === true;
        const view = () =>
          paint(v, {
            pin: true,
            rounded: rounded(),
            benches: BENCHES.map((b) => st.shown.includes(b)),
          });
        const btns = new Map();
        const sync = async (ms) => {
          ctx.save();
          await ctx.tween(view(), ms);
          for (const [b, el] of btns) {
            if (b !== "round") {
              el.disabled = !rounded();
              el.setAttribute("aria-pressed", String(st.shown.includes(b)));
            } else el.setAttribute("aria-pressed", String(rounded()));
          }
          if (rounded() && st.shown.length === BENCHES.length) {
            ctx.feedback(copy.bench.done);
            ctx.unlock();
          } else ctx.feedback(rounded() ? copy.bench.more : copy.bench.roundFirst, "cue");
        };
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        const mk = (key, label, onClick) => {
          const b = ctx.button({ label, onClick });
          b.setAttribute("aria-pressed", "false");
          btns.set(key, b);
          row.appendChild(b);
        };
        mk("round", copy.bench.round, () => {
          st.rounded = !rounded();
          sync(500);
        });
        for (const b of BENCHES)
          mk(b, copy.bench.show(b), () => {
            st.shown = st.shown.includes(b) ? st.shown.filter((x) => x !== b) : [...st.shown, b];
            sync(400);
          });
        ctx.panel.appendChild(row);
        ctx.expr(exprOf(v, false));
        ctx.say(copy.bench.say);
        await sync(500);
      },
    },
    {
      id: "estimate",
      label: copy.scene.estimate,
      async enter(ctx) {
        L = ctx.L;
        await ctx.tween(
          paint(v, {
            pin: true,
            rounded: true,
            benches: allBenches,
            hot: v.bench,
            est1: lineOf(v),
          }),
          600,
        );
        ctx.expr(exprOf(v, true));
        ctx.say(copy.estimate.say);
        ctx.feedback("");
      },
    },
    {
      id: "check",
      label: copy.scene.check,
      gate: true,
      async enter(ctx, saved) {
        L = ctx.L;
        const solved = !!saved.solved;
        const base = {
          pin: true,
          rounded: true,
          benches: allBenches,
          hot: v.bench,
          est1: lineOf(v),
        };
        const done = { ...base, est2: copy.check.exactLine };
        await ctx.tween(paint(v, solved ? done : base), 400);
        ctx.expr(
          `${hi(`${v.percent}%`)} of ${v.whole}${solved ? ` = ${hi(`${v.prefix}${fmt(v.exactH)}`)}` : " = ?"}`,
        );
        ctx.say(copy.check.say);
        const options = placeNotFirst(
          checkChoices(v.verdict).map((o) => ({
            ...o,
            label: ctx.L(copy.check.labels[o.kind]),
            cue: o.correct
              ? null
              : [copy.check.lead(o.kind), copy.check.cue(o.kind)]
                  .filter(Boolean)
                  .map((p) => ctx.L(p))
                  .join(" "),
          })),
          v.whole + v.bench,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.check.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(v, done), 500);
              ctx.expr(
                `${hi(`${v.percent}%`)} of ${v.whole} = ${hi(`${v.prefix}${fmt(v.exactH)}`)}`,
              );
              ctx.feedback(copy.check.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: copy.scene.transfer,
      async enter(ctx, saved) {
        L = ctx.L;
        const solved = !!saved.solved;
        const done = {
          pin: true,
          rounded: true,
          benches: BENCHES.map(() => true),
          hot: t.bench,
          est1: lineOf(t),
        };
        await ctx.tween(paint(t, solved ? done : { pin: true }), 600);
        ctx.expr(exprOf(t, solved));
        ctx.say(copy.transfer.say);
        const options = opts(t, t.whole + t.compat, (kind, x) => ctx.L(copy.transfer.cue(kind, x)));
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(paint(t, { pin: true, ghost: { v: opt.v, label: opt.label } }), 350);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(t, done), 800);
              ctx.expr(exprOf(t, true));
              ctx.feedback(copy.transfer.ok);
            },
          }),
          ctx.frame({ label: copy.transfer.explain, frame: copy.transfer.frame }),
        );
      },
    },
  ];

  return {
    kicker: copy.kicker,
    title: copy.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: copy.ariaLabel,
    printSummary: copy.printSummary,
    setup,
    scenes,
  };
}

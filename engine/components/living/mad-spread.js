// living/mad-spread.js — the MEAN ABSOLUTE DEVIATION as a shared-out distance
// (lesson 2-9).
//
// One cast: dots on a number line, a fulcrum at the mean, and one bar per value.
// The SAME bars are each value's distance from the mean (scene 3, one row per
// value), then slide into one row end to end (their total), then are re-cut into
// equal pieces (the total shared equally: the MAD). Scene 5 reuses the dots and
// bars for two data sets with one mean and different MADs; scene 6 asks the
// student for a MAD with no bars drawn.
//
// Config: { values:[...], unit:{en,es}, story:{en,es},
//   compare:{ a:{name, values}, b:{name, values} },   // same mean, different MAD
//   transfer:{ values:[...], story } }
// Every mean must be a whole number and every MAD exact to hundredths, or the
// play refuses to draw.

import { escHtml } from "../../core/living-scene.js";
import {
  distanceChoices,
  fmt,
  madChoices,
  madSpreadCopy,
  madStats,
  placeCorrect,
  validateMadSpread,
} from "./mad-spread-model.js";

export { validateMadSpread };

const W = 480;
const AX0 = 100;
const AX1 = W - 28;
const LBLX = 50;
const D = 16; // a dot
const ROW = 24;
const ROWS0 = 132;
const A_Y = [80, 250]; // axis y of the two lines in the comparison scene
const SINGLE_Y = 60;
const H = 366;
const NMAX = 5;
const X = { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)" };
const U = { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)" };
const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

export function buildMadSpreadPlay(cfg) {
  const v = validateMadSpread(cfg);
  if (!v) return null;
  const T = madSpreadCopy(v);
  const { values, axes, compare, transfer } = v;
  const S = madStats(values);

  /** One line's state: data, axis, where it sits, and which parts are drawn. */
  const line = (vals, axis, o = {}) => ({
    vals,
    axis,
    y: SINGLE_Y,
    mode: "rows",
    dots: true,
    mean: true,
    drawn: new Set(),
    title: null,
    cap: "",
    ...o,
  });
  const all = (vals) => new Set(vals.map((_, i) => i));
  const xOf = (ln, val) => AX0 + ((val - ln.axis.lo) / (ln.axis.hi - ln.axis.lo)) * (AX1 - AX0);
  const scale = (ln) => (AX1 - AX0) / (ln.axis.hi - ln.axis.lo);
  const tapeY = (ln) => (ln.y === SINGLE_Y ? ROWS0 + ln.vals.length * ROW + 10 : ln.y + 70);

  let c = null; // the cast: one entry per number line
  const ticked = [null, null];

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 15,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        ...attrs,
      });
    c = [0, 1].map(() => {
      const tri = el("svg", { x: 0, y: 0, width: 22, height: 18, overflow: "visible" });
      svgEl("polygon", { points: "0,18 11,0 22,18", fill: "var(--lsx-ink)" }, tri);
      return {
        title: text({ x: 14, y: 0, "text-anchor": "start", "font-size": 16 }),
        axis: el("line", {
          x1: AX0 - 14,
          x2: AX1 + 14,
          y1: 0,
          y2: 0,
          stroke: "var(--lsx-ink)",
          "stroke-width": 2,
        }),
        ticks: svgEl("g", { opacity: 0 }, g),
        guide: el("line", {
          x1: 0,
          x2: 0,
          y1: 0,
          y2: 0,
          stroke: "var(--lsx-rule-strong)",
          "stroke-width": 2,
          "stroke-dasharray": "5 5",
        }),
        dots: Array.from({ length: NMAX }, () =>
          el("rect", { x: 0, y: 0, width: D, height: D, rx: D / 2, ...X, "stroke-width": 2 }),
        ),
        bars: Array.from({ length: NMAX }, () =>
          el("rect", { x: AX0, y: ROWS0, width: 0, height: 10, rx: 2, ...X, "stroke-width": 2 }),
        ),
        lbls: Array.from({ length: NMAX }, () => text({ x: LBLX, y: ROWS0 })),
        tri,
        meanTxt: text({ x: 0, y: 0, "font-size": 16 }),
        cap: text({ x: W / 2, y: 0, "font-size": 16 }),
      };
    });
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  function useTicks(ctx, L, ln) {
    const key = `${ln.axis.lo}|${ln.axis.hi}|${ln.axis.step}|${ln.y}`;
    if (ticked[L] === key) return;
    ticked[L] = key;
    const t = c[L].ticks;
    t.innerHTML = "";
    for (let x = ln.axis.lo; x <= ln.axis.hi + 1e-9; x += ln.axis.step) {
      const px = xOf(ln, x);
      ctx.svgEl(
        "line",
        { x1: px, x2: px, y1: ln.y - 5, y2: ln.y + 5, stroke: "var(--lsx-ink)", "stroke-width": 2 },
        t,
      );
      ctx.svgEl(
        "text",
        {
          x: px,
          y: ln.y + 34,
          "text-anchor": "middle",
          "font-size": 14,
          fill: "var(--lsx-muted)",
          text: String(x),
        },
        t,
      );
    }
  }

  function lineMoves(ctx, L, ln) {
    const e = c[L];
    const m = [];
    if (!ln) {
      const all0 = [
        e.title,
        e.axis,
        e.ticks,
        e.guide,
        e.tri,
        e.meanTxt,
        e.cap,
        ...e.dots,
        ...e.bars,
        ...e.lbls,
      ];
      for (const x of all0) m.push([x, { opacity: 0 }]);
      return m;
    }
    useTicks(ctx, L, ln);
    const s = madStats(ln.vals);
    const sc = scale(ln);
    const mx = xOf(ln, s.mean);
    const ty = tapeY(ln);
    m.push([
      e.title,
      { opacity: ln.title ? 1 : 0, y: ln.y - 62, text: ln.title ? ctx.L(ln.title) : "" },
    ]);
    m.push([e.axis, { opacity: 1, y1: ln.y, y2: ln.y }], [e.ticks, { opacity: 1 }]);
    e.dots.forEach((d, i) => {
      if (i >= ln.vals.length) return m.push([d, { opacity: 0 }]);
      const k = ln.vals.slice(0, i).filter((x) => x === ln.vals[i]).length;
      m.push([
        d,
        { x: xOf(ln, ln.vals[i]) - D / 2, y: ln.y - 3 - D - k * (D + 2), opacity: ln.dots ? 1 : 0 },
      ]);
    });
    m.push([e.tri, { opacity: ln.mean ? 1 : 0, x: mx - 11, y: ln.y + 3 }]);
    m.push([
      e.meanTxt,
      {
        opacity: ln.mean ? 1 : 0,
        x: mx > W - 120 ? mx - 16 : mx + 16,
        y: ln.y + 19,
        "text-anchor": mx > W - 120 ? "end" : "start",
        text: `${ctx.L(T.mean)} = ${s.mean}`,
      },
    ]);
    const rowsOn = ln.mode === "rows" && ln.drawn.size > 0;
    m.push([
      e.guide,
      {
        opacity: rowsOn ? 1 : 0,
        x1: mx,
        x2: mx,
        y1: ln.y + 44,
        y2: ROWS0 + (ln.vals.length - 1) * ROW + 12,
      },
    ]);
    let cum = 0;
    e.bars.forEach((b, i) => {
      const lb = e.lbls[i];
      if (i >= ln.vals.length) return m.push([b, { opacity: 0 }], [lb, { opacity: 0 }]);
      const d = s.dist[i];
      const on = ln.drawn.has(i);
      const side = ln.mode === "share" ? X : ln.vals[i] < s.mean ? U : X;
      if (ln.mode === "rows") {
        const rc = ROWS0 + i * ROW;
        const x0 = Math.min(xOf(ln, ln.vals[i]), mx);
        m.push([b, { ...side, x: x0, y: rc - 5, width: d * sc, height: 10, opacity: on ? 1 : 0 }]);
        m.push([
          lb,
          { x: LBLX, y: rc + 5, text: ctx.L(T.away(ln.vals[i], d)), opacity: on ? 1 : 0 },
        ]);
        return;
      }
      const w = (ln.mode === "share" ? s.mad : d) * sc;
      const x0 = AX0 + (ln.mode === "share" ? i * w : cum * sc);
      cum += d;
      m.push([b, { ...side, x: x0, y: ty - 6, width: w, height: 12, opacity: on ? 1 : 0 }]);
      const label = fmt(ln.mode === "share" ? s.mad : d);
      m.push([
        lb,
        {
          x: x0 + w / 2,
          y: ty - 13,
          text: label,
          opacity: on && w >= (ln.mode === "share" ? 34 : 14) ? 1 : 0,
        },
      ]);
    });
    m.push([e.cap, { opacity: ln.cap ? 1 : 0, y: ty + 28, text: ln.cap }]);
    return m;
  }

  const view = (ctx, lines, ms) =>
    ctx.tween(
      [0, 1].flatMap((L) => lineMoves(ctx, L, lines[L] || null)),
      ms,
    );
  const main = (o) => [line(values, axes.main, o)];
  const cmpLines = (o) => [
    line(compare.a.values, axes.cmp, { y: A_Y[0], title: compare.a.name, ...o }),
    line(compare.b.values, axes.cmp, { y: A_Y[1], title: compare.b.name, ...o }),
  ];
  const tapeCap = (vals, o) => ({
    mode: o.mode,
    drawn: all(vals),
    cap: o.mode === "share" ? T.shareCap(vals) : T.lineCap(vals),
  });

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.say(T.situateSay);
        ctx.expr(escHtml(T.list));
        await view(ctx, main({ dots: false, mean: false }), 0);
        await view(ctx, main({ mean: false }), 450);
        await view(ctx, main({}), 450);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.predictSay);
        ctx.expr(escHtml(T.list));
        await view(ctx, main({}), 300);
        const options = placeCorrect(distanceChoices(values), S.total + 2 * S.n + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.distanceCue(opt.kind), "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "draw",
      label: T.scene.draw,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const drawn = new Set(
          (Array.isArray(st.drawn) ? st.drawn : []).filter(
            (i) => Number.isInteger(i) && i >= 0 && i < S.n,
          ),
        );
        const paint = (ms) => {
          const got = [...drawn].sort((a, b) => a - b);
          ctx.expr(escHtml(got.map((i) => S.dist[i]).join(", ")));
          return view(ctx, main({ drawn }), ms);
        };
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.drawGroup));
        values.forEach((val, i) => {
          const b = ctx.button({
            label: String(val),
            onClick: () => {
              if (drawn.has(i)) return;
              drawn.add(i);
              st.drawn = [...drawn];
              ctx.save();
              b.setAttribute("aria-pressed", "true");
              if (drawn.size === S.n) {
                ctx.feedback(T.drawDone);
                ctx.unlock();
              } else ctx.feedback(T.drawn(i), "");
              paint(450);
            },
          });
          b.setAttribute("aria-pressed", String(drawn.has(i)));
          row.appendChild(b);
        });
        ctx.panel.appendChild(row);
        ctx.say(T.drawSay);
        await paint(0);
        if (drawn.size === S.n) {
          ctx.feedback(T.drawDone);
          ctx.unlock();
        }
      },
    },
    {
      id: "share",
      label: T.scene.share,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        let stage = [0, 1, 2].includes(st.stage) ? st.stage : 0;
        const rows = main({ drawn: all(values) });
        const states = [
          rows,
          main({ ...tapeCap(values, { mode: "tape" }) }),
          main({ ...tapeCap(values, { mode: "share" }) }),
        ];
        const lineBtn = ctx.button({ label: T.lineBtn, primary: true, onClick: () => go(1) });
        const shareBtn = ctx.button({ label: T.shareBtn, primary: true, onClick: () => go(2) });
        const paintBtns = () => {
          lineBtn.disabled = stage >= 1;
          shareBtn.disabled = stage !== 1;
        };
        const go = (k) => {
          stage = k;
          st.stage = k;
          ctx.save();
          paintBtns();
          ctx.expr(k === 1 ? escHtml(T.exprLine) : hi(T.exprShare));
          ctx.feedback(k === 1 ? T.lineFb : T.shareFb);
          if (k === 2) ctx.unlock();
          return view(ctx, states[k], 650);
        };
        ctx.panel.append(lineBtn, shareBtn);
        ctx.say(T.shareSay);
        paintBtns();
        ctx.expr(stage === 0 ? "" : stage === 1 ? escHtml(T.exprLine) : hi(T.exprShare));
        if (stage) ctx.feedback(stage === 1 ? T.lineFb : T.shareFb);
        if (stage === 2) ctx.unlock();
        await view(ctx, states[stage], 300);
      },
    },
    {
      id: "compare",
      label: T.scene.compare,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.compareSay);
        ctx.expr("");
        const bars = (o) => {
          const [a, b] = cmpLines({});
          const mk = (ln, vals) => ({ ...ln, ...tapeCap(vals, o) });
          return [mk(a, compare.a.values), mk(b, compare.b.values)];
        };
        const options = placeCorrect(T.compareOptions, S.total + 2);
        const reveal = async (ms) => {
          await view(ctx, bars({ mode: "tape" }), ms);
          await view(ctx, bars({ mode: "share" }), ms);
        };
        if (saved.solved) {
          await view(ctx, bars({ mode: "share" }), 0);
          ctx.feedback(T.compareOk);
        } else await view(ctx, cmpLines({ mode: "tape" }), 600);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.compareQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.compareCue(opt.kind), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.compareOk);
              ctx.unlock();
              await reveal(550);
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const tv = transfer.values;
        const T0 = madStats(tv);
        const ln = (o) => [line(tv, axes.transfer, { mode: "tape", ...o })];
        ctx.say(T.transferSay);
        ctx.expr(escHtml(T.transferList));
        const solved = (mode) => ln({ ...tapeCap(tv, { mode }) });
        await view(ctx, saved.solved ? solved("share") : ln({}), 500);
        const options = placeCorrect(madChoices(tv), T0.total + 3);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.madCue(opt.kind), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await view(ctx, solved("tape"), 450);
              await view(ctx, solved("share"), 550);
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

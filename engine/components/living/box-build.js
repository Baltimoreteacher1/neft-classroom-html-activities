// living/box-build.js — five numbers become a box plot.
//
// One cast for the whole play: a card per value. The cards ARE the ordered data
// (scene 1), the student finds the median (scene 2) and taps Q1 and Q3 (scene
// 3); then the SAME cards drop onto a number line as dots and the box, the
// median line and the whiskers grow around them (scene 4). Scene 5 shows that
// the two sides of the median hold the same number of values though one is longer.
// Scene 6 is a new data set: find Q3, and the new box appears.
//
// Config: { values:[7 or 11, in order], story:{en,es},
//           transfer:{ values:[7 or 11, in order], story:{en,es} } }
// Anything the stage cannot draw makes the play refuse (null).

import { escHtml } from "../../core/living-scene.js";
import {
  axisFor,
  boxBuildCopy,
  fmtNum,
  medianChoices,
  q3Choices,
  quartileSlots,
  stackIndex,
  sum,
  validateBoxBuild,
  valuesPerSide,
} from "./box-build-model.js";
import { fiveNumber, placeCorrect } from "./median-fold-model.js";

export { validateBoxBuild };

const W = 480;
const H = 256;
const CY = 50; // top of the cards
const CH = 40;
const AX = 218; // number line
const BY = 140; // box centre
const BH = 40;
const PX0 = 36;
const PX1 = 444;
const BAND_Y = BY - 28;
const BAND_H = AX - BAND_Y + 8;
const LABEL_Y = BY - 32;

const STRIP = {
  plain: {
    fill: "var(--lsx-card)",
    stroke: "var(--lsx-ink)",
    "stroke-width": 2,
    ink: "var(--lsx-ink)",
  },
  placed: {
    fill: "var(--lsx-ok-bg)",
    stroke: "var(--lsx-x-edge)",
    "stroke-width": 2.5,
    ink: "var(--lsx-ink)",
  },
  mid: {
    fill: "var(--lsx-hi)",
    stroke: "var(--lsx-ink)",
    "stroke-width": 3,
    ink: "var(--lsx-on-x)",
  },
  edit: {
    fill: "var(--lsx-cue-bg)",
    stroke: "var(--lsx-u-edge)",
    "stroke-width": 3,
    ink: "var(--lsx-ink)",
  },
};
const DOT = {
  plain: { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)", "stroke-width": 2 },
  placed: { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)", "stroke-width": 2 },
  mid: { fill: "var(--lsx-hi)", stroke: "var(--lsx-ink)", "stroke-width": 2 },
  edit: { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)", "stroke-width": 2 },
};

/** The parts of a box plot (whiskers, box, median line), created once, hidden. */
export function makeBoxCast(svgEl, g) {
  const line = (attrs = {}) =>
    svgEl(
      "line",
      {
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 0,
        stroke: "var(--lsx-ink)",
        "stroke-width": 3,
        opacity: 0,
        ...attrs,
      },
      g,
    );
  return {
    wl: line(),
    wr: line(),
    cl: line(),
    cr: line(),
    rect: svgEl(
      "rect",
      {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rx: 3,
        fill: "var(--lsx-ok-bg)",
        stroke: "var(--lsx-x-edge)",
        "stroke-width": 3,
        opacity: 0,
      },
      g,
    ),
    med: line({ "stroke-width": 5 }),
  };
}

/** Tween targets that put a box plot for `five` at height `y` (centre) on a scale `xOf`. */
export function boxMoves(b, five, xOf, y, h, on = true) {
  const o = on ? 1 : 0;
  const [mn, q1, md, q3, mx] = [five.min, five.q1, five.med, five.q3, five.max].map(xOf);
  return [
    [b.wl, { x1: mn, x2: q1, y1: y, y2: y, opacity: o }],
    [b.wr, { x1: q3, x2: mx, y1: y, y2: y, opacity: o }],
    [b.cl, { x1: mn, x2: mn, y1: y - h / 4, y2: y + h / 4, opacity: o }],
    [b.cr, { x1: mx, x2: mx, y1: y - h / 4, y2: y + h / 4, opacity: o }],
    [b.rect, { x: q1, y: y - h / 2, width: q3 - q1, height: h, opacity: o }],
    [b.med, { x1: md, x2: md, y1: y - h / 2, y2: y + h / 2, opacity: o }],
  ];
}

/** Redraw the tick marks and labels of a number line into `group`. */
export function drawTicks(svgEl, group, { lo, hi, step, xOf, y }) {
  group.innerHTML = "";
  for (let t = lo; t <= hi + 1e-9; t += step) {
    const x = xOf(t);
    svgEl(
      "line",
      { x1: x, x2: x, y1: y - 6, y2: y + 6, stroke: "var(--lsx-ink)", "stroke-width": 2 },
      group,
    );
    svgEl(
      "text",
      {
        x,
        y: y + 26,
        "text-anchor": "middle",
        "font-size": 15,
        fill: "var(--lsx-muted)",
        text: String(t),
      },
      group,
    );
  }
}

export function buildBoxBuildPlay(cfg) {
  const v = validateBoxBuild(cfg);
  if (!v) return null;
  const T = boxBuildCopy(v);
  const f = fmtNum;
  const P = Math.max(v.values.length, v.transfer.values.length);
  const mk = (values) => ({
    sorted: values,
    five: fiveNumber(values),
    axis: axisFor(fiveNumber(values)),
  });
  const main = mk(v.values);
  const xfer = mk(v.transfer.values);
  const optionsOf = (list, seed) =>
    placeCorrect(
      list.map((o) => ({ ...o, label: f(o.value) })),
      seed,
    );

  let c = null;
  let onCard = null;
  let xOf = (x) => x;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const g = svgEl("g", {}, svg);
    const text = (attrs) =>
      svgEl(
        "text",
        {
          "text-anchor": "middle",
          "font-size": 16,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          opacity: 0,
          ...attrs,
        },
        g,
      );
    const bands = [0, 1].map(() =>
      svgEl(
        "rect",
        {
          x: 0,
          y: BAND_Y,
          width: 0,
          height: BAND_H,
          rx: 6,
          fill: "none",
          stroke: "var(--lsx-lo)",
          "stroke-width": 3,
          "stroke-dasharray": "7 5",
          opacity: 0,
        },
        g,
      ),
    );
    svgEl(
      "line",
      { x1: PX0 - 8, x2: PX1 + 8, y1: AX, y2: AX, stroke: "var(--lsx-ink)", "stroke-width": 2 },
      g,
    );
    const ticks = svgEl("g", {}, g);
    const box = makeBoxCast(svgEl, g);
    const halves = [0, 1].map(() => ({
      p: svgEl(
        "path",
        { d: "M0,0", fill: "none", stroke: "var(--lsx-x-edge)", "stroke-width": 3, opacity: 0 },
        g,
      ),
      t: text({ y: CY - 24, "font-size": 15, fill: "var(--lsx-muted)" }),
    }));
    const cards = Array.from({ length: P }, (_, id) => {
      const r = svgEl(
        "rect",
        { x: W / 2 - 15, y: CY, width: 30, height: CH, rx: 6, opacity: 0, ...DOT.plain },
        g,
      );
      const t = text({ x: W / 2, y: CY + 27, "font-size": 19 });
      const h = svgEl("rect", { x: 0, y: CY, width: 30, height: CH, fill: "transparent" }, g);
      h.addEventListener("click", () => onCard?.(id));
      return { r, t, h };
    });
    const labels = [0, 1, 2, 3, 4].map(() => text({ y: LABEL_Y, fill: "var(--lsx-hi)" }));
    const counts = [0, 1].map(() => text({ y: BY + 44, "font-size": 20 }));
    c = { bands, ticks, box, halves, cards, labels, counts, svgEl };
  }

  /**
   * One state for the whole stage. o: { data, mode "strip"|"line", look(i),
   * halves, found {q1,med,q3}, box, bands: [part indexes] | null, counts }
   */
  function view(ctx, o, ms) {
    const { sorted, five, axis } = o.data;
    const n = sorted.length;
    const sp = Math.min(84, 440 / n);
    const cw = Math.min(56, sp - 6);
    const sx = (i) => W / 2 + (i - (n - 1) / 2) * sp;
    const unit = (PX1 - PX0) / (axis.hi - axis.lo);
    xOf = (val) => PX0 + (val - axis.lo) * unit;
    const D = Math.min(14, unit - 1.5);
    const stack = stackIndex(sorted);
    const line = o.mode === "line";
    const { h, q1: s1, q3: s3 } = quartileSlots(n);
    const m = [];
    c.cards.forEach((cd, i) => {
      const on = i < n;
      cd.h.style.display = on && !line ? "" : "none";
      cd.h.style.cursor = onCard ? "pointer" : "default";
      if (!on) {
        m.push([cd.r, { opacity: 0 }], [cd.t, { opacity: 0 }]);
        return;
      }
      const k = o.look(i);
      cd.t.textContent = String(sorted[i]);
      if (line) {
        m.push([
          cd.r,
          {
            x: xOf(sorted[i]) - D / 2,
            y: AX - D - 3 - stack[i] * (D + 1),
            width: D,
            height: D,
            rx: D / 2,
            opacity: 1,
            ...DOT[k],
          },
        ]);
        m.push([cd.t, { opacity: 0 }]);
      } else {
        const { ink, ...box } = STRIP[k];
        m.push([
          cd.r,
          { x: sx(i) - cw / 2, y: CY, width: cw, height: CH, rx: 6, opacity: 1, ...box },
        ]);
        m.push([cd.t, { x: sx(i), y: CY + 27, opacity: 1, fill: ink }]);
        cd.h.setAttribute("x", String(sx(i) - sp / 2 + 2));
        cd.h.setAttribute("width", String(sp - 4));
      }
    });
    const spans = [
      [0, h - 1, T.lowerHalf],
      [n - h, n - 1, T.upperHalf],
    ];
    c.halves.forEach((hv, k) => {
      const [a, b, label] = spans[k];
      const on = !!o.halves && !line;
      hv.p.setAttribute(
        "d",
        `M${sx(a) - cw / 2},${CY - 6} V${CY - 14} H${sx(b) + cw / 2} V${CY - 6}`,
      );
      hv.t.textContent = ctx.L(label);
      m.push(
        [hv.p, { opacity: on ? 1 : 0 }],
        [hv.t, { opacity: on ? 1 : 0, x: (sx(a) + sx(b)) / 2 }],
      );
    });
    const lines = T.lineLabels(five);
    const stripKey = [null, "q1", "med", "q3", null];
    const stripAt = [0, s1, h, s3, 0];
    const stripText = [null, T.labelQ1, T.labelMed, T.labelQ3, null];
    c.labels.forEach((lb, k) => {
      lb.setAttribute("font-size", line ? "18" : "16");
      if (line) {
        lb.textContent = ctx.L(lines[k]);
        m.push([
          lb,
          {
            x: xOf([five.min, five.q1, five.med, five.q3, five.max][k]),
            y: LABEL_Y,
            opacity: o.box ? 1 : 0,
          },
        ]);
      } else {
        const show = stripKey[k] && o.found?.[stripKey[k]];
        if (show) lb.textContent = ctx.L(stripText[k]);
        m.push([lb, { x: sx(stripAt[k]), y: CY + CH + 24, opacity: show ? 1 : 0 }]);
      }
    });
    m.push(...boxMoves(c.box, five, xOf, BY, BH, !!o.box && line));
    const edges = [five.min, five.med, five.max].map(xOf);
    const k = valuesPerSide(n);
    c.bands.forEach((b, i) => {
      const [x, w] = [edges[i] + 2, Math.max(0, edges[i + 1] - edges[i] - 4)];
      m.push([b, { x, width: w, opacity: o.bands?.includes(i) && line ? 1 : 0 }]);
    });
    c.counts.forEach((t, i) => {
      t.textContent = ctx.L({ en: `${k} values`, es: `${k} valores` });
      const on = !!o.counts && line;
      m.push([t, { x: (edges[i] + edges[i + 1]) / 2, opacity: on ? 1 : 0 }]);
    });
    drawTicks(c.svgEl, c.ticks, { ...axis, xOf, y: AX });
    return ctx.tween(m, ms);
  }

  const kindOf = (data) => (i) => {
    const { h, q1, q3 } = quartileSlots(data.sorted.length);
    return i === h ? "mid" : i === q1 || i === q3 ? "edit" : "placed";
  };
  const plain = () => "plain";
  const stripState = (data, extra) => ({ data, mode: "strip", look: plain, ...extra });
  const lineState = (data, extra) => ({ data, mode: "line", look: kindOf(data), ...extra });

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        onCard = null;
        ctx.expr(escHtml(T.list));
        ctx.say(T.situateSay);
        await view(ctx, stripState(main), 500);
      },
    },
    {
      id: "median",
      label: T.scene.median,
      gate: true,
      async enter(ctx, saved) {
        onCard = null;
        const S = main.five;
        const solved = !!saved.solved;
        const state = (ok) =>
          stripState(main, {
            halves: ok,
            found: { med: ok },
            look: (i) => (ok && i === quartileSlots(S.n).h ? "mid" : "plain"),
          });
        ctx.expr(escHtml(T.list));
        ctx.say(T.medianSay);
        if (solved) ctx.feedback(T.medianOk);
        const shown = view(ctx, state(solved), solved ? 0 : 300);
        const options = optionsOf(medianChoices(v.values), sum(v.values) + S.n);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.medianQ,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cueMedian(opt), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.medianOk);
              ctx.unlock();
              await view(ctx, state(true), 500);
            },
          }),
        );
        await shown;
      },
    },
    {
      id: "quartiles",
      label: T.scene.quartiles,
      gate: true,
      async enter(ctx) {
        const S = main.five;
        const n = S.n;
        const slots = quartileSlots(n);
        const st = ctx.state;
        st.q1 = !!st.q1;
        st.q3 = !!st.q1 && !!st.q3;
        const paint = (ms) => {
          const done = st.q1 && st.q3;
          ctx.expr(done ? escHtml(ctx.L(T.buildExpr)) : escHtml(T.list));
          return view(
            ctx,
            stripState(main, {
              halves: true,
              found: { med: true, q1: st.q1, q3: st.q3 },
              look: (i) =>
                i === slots.h
                  ? "mid"
                  : (i === slots.q1 && st.q1) || (i === slots.q3 && st.q3)
                    ? "edit"
                    : "plain",
            }),
            ms,
          );
        };
        const how = document.createElement("p");
        how.className = "lsx-q";
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.cards));
        const btns = v.values.map((x, i) =>
          ctx.button({ label: String(x), onClick: () => tap(i) }),
        );
        row.append(...btns);
        const refresh = () => {
          const done = st.q1 && st.q3;
          how.textContent = done ? "" : ctx.L(st.q1 ? T.howQ3 : T.howQ1);
          for (const b of btns) b.disabled = done;
        };
        function tap(id) {
          if (st.q1 && st.q3) return;
          const which = st.q1 ? "q3" : "q1";
          if (id !== slots[which]) {
            ctx.feedback(T.cueQuartile(which, id), "cue");
            return;
          }
          st[which] = true;
          ctx.save();
          refresh();
          if (st.q1 && st.q3) {
            ctx.feedback(T.quartileDone);
            ctx.unlock();
            onCard = null;
          } else ctx.feedback(T.q1Ok);
          paint(350);
        }
        onCard = tap;
        ctx.panel.append(how, row);
        ctx.say(T.quartileSay);
        refresh();
        await paint(300);
        if (st.q1 && st.q3) {
          ctx.feedback(T.quartileDone);
          ctx.unlock();
        }
      },
    },
    {
      id: "build",
      label: T.scene.build,
      async enter(ctx) {
        onCard = null;
        ctx.say(T.buildSay);
        ctx.expr(escHtml(ctx.L(T.buildExpr)));
        await view(
          ctx,
          stripState(main, {
            halves: true,
            found: { med: true, q1: true, q3: true },
            look: kindOf(main),
          }),
          0,
        );
        await view(ctx, lineState(main), 700);
        await view(ctx, lineState(main, { box: true }), 600);
        ctx.feedback(T.buildDone);
      },
    },
    {
      id: "sides",
      label: T.scene.sides,
      gate: true,
      async enter(ctx, saved) {
        onCard = null;
        const solved = !!saved.solved;
        const S = main.five;
        const state = (extra) => lineState(main, { box: true, ...extra });
        ctx.say(T.sidesSay);
        ctx.expr(escHtml(ctx.L(T.buildExpr)));
        if (solved) ctx.feedback(T.sidesOk);
        const shown = view(ctx, solved ? state({ bands: [0, 1], counts: true }) : state({}), 0);
        const options = placeCorrect(
          [
            { kind: "longer", label: T.sideOption("longer") },
            { kind: "shorter", label: T.sideOption("shorter") },
            { kind: "same", label: T.sameOption, correct: true },
          ],
          sum(v.values) + S.n,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.sidesQ,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.kind === "longer" ? T.cueLonger : T.cueShorter, "cue");
              view(ctx, state({ bands: [0, 1] }), 250);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.sidesOk);
              ctx.unlock();
              await view(ctx, state({ bands: [0, 1], counts: true }), 450);
            },
          }),
        );
        await shown;
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        onCard = null;
        const TS = xfer.five;
        const solved = !!saved.solved;
        ctx.expr(escHtml(xfer.sorted.join(", ")));
        ctx.say(T.transferSay);
        if (solved) ctx.feedback(T.transferOk);
        const { h } = quartileSlots(TS.n);
        const asked = stripState(xfer, {
          halves: true,
          found: { med: true },
          look: (i) => (i === h ? "mid" : "plain"),
        });
        const shown = solved ? view(ctx, lineState(xfer, { box: true }), 0) : view(ctx, asked, 0);
        const options = optionsOf(q3Choices(xfer.sorted), sum(xfer.sorted) + 2 * TS.n + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cueQ3(opt), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              ctx.expr(`Q3 = <span class="lsx-hi">${escHtml(f(TS.q3))}</span>`);
              const all = {
                halves: true,
                found: { med: true, q1: true, q3: true },
                look: kindOf(xfer),
              };
              await view(ctx, stripState(xfer, all), 350);
              await view(ctx, lineState(xfer), 700);
              await view(ctx, lineState(xfer, { box: true }), 600);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
        await shown;
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

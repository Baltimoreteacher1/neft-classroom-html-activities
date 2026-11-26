// living/factor-pairs.js — equal packs: the width of a rectangle is a factor (6-7).
//
// One cast for the whole play: a pool of circles (the first quantity) and a
// pool of squares (the second), laid out as two rectangles that share their
// number of columns — the columns ARE the packs. A pack count works when both
// rectangles are complete; the same items then become the factor chips of
// scene 4 (the common ones stand out; the greatest gets a ring), and the
// second half of the lesson swaps the stage for the two multiple lanes of
// lcm-lanes. Shape, not colour alone, tells the two quantities apart.
//
// Config: { a, b, nameA, nameB, story, lcm:{ a, b, nameA, nameB, unit, story,
//           question }, transfer:{ a, b, nameA, nameB, story? } } — 6-7 authors
// 48 pencils and 36 notebooks, Ayasha's 8-week and 6-week classes, and the
// practice pair 12 and 18. Numbers and sentences come from factor-pairs-model.js
// (pure, tested); this file stages them.

import { escHtml } from "../../core/living-scene.js";
import {
  arrayGeometry,
  arrayView,
  caption,
  cellOf,
  factorPairsCopy,
  factorsOf,
  H,
  packChoices,
  placeCorrect,
  validateFactorPairs,
  W,
} from "./factor-pairs-model.js";
import { createLanes } from "./lcm-lanes.js";
import { firstChoices, lcmLanesCopy } from "./lcm-lanes-model.js";

export { validateFactorPairs };

const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
/** The correct choice never sits first: a seed that lands on 0 is nudged. */
const seat = (options, n) => placeCorrect(options, n % options.length === 0 ? n + 1 : n);
const CHIP_W = 34;
const CHIP_H = 28;
const ROW_Y = [112, 196];

export function buildFactorPairsPlay(cfg) {
  const v = validateFactorPairs(cfg);
  if (!v) return null;
  const T = factorPairsCopy(v);
  const { main, transfer } = v;
  const lm = v.lcm.v.main;
  const LT = lcmLanesCopy(v.lcm.v);
  const poolA = Math.max(main.a, transfer.a);
  const poolB = Math.max(main.b, transfer.b);
  const factA = factorsOf(main.a);
  const factB = factorsOf(main.b);
  let c = null;
  let lanes = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 17,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        ...attrs,
      });
    const items = (n, rx, fill, stroke) =>
      Array.from({ length: n }, () =>
        el("rect", { x: 20, y: 90, width: 10, height: 10, rx, fill, stroke, "stroke-width": 2 }),
      );
    const arrA = items(poolA, 6, "var(--lsx-x)", "var(--lsx-x-edge)");
    const arrB = items(poolB, 2, "var(--lsx-u)", "var(--lsx-u-edge)");
    const heads = [text({ x: 123, y: 66 }), text({ x: 357, y: 66 })];
    const caps = [
      text({ x: 123, y: 284, "font-size": 17 }),
      text({ x: 357, y: 284, "font-size": 17 }),
    ];
    const counter = text({ x: W / 2, y: 36, "font-size": 24, "font-weight": 800 });
    const rowLabel = (y) => text({ x: W / 2, y: y - 14, "font-size": 15 });
    const chips = (factors, y) =>
      factors.map((f, i) => {
        const x = (W - factors.length * (CHIP_W + 4) + 4) / 2 + i * (CHIP_W + 4);
        return {
          f,
          x,
          y,
          box: el("rect", { x, y, width: CHIP_W, height: CHIP_H, rx: 6, "stroke-width": 2 }),
          txt: text({ x: x + CHIP_W / 2, y: y + 20, text: String(f) }),
        };
      });
    const rows = [
      { chips: chips(factA, ROW_Y[0]), label: rowLabel(ROW_Y[0]) },
      { chips: chips(factB, ROW_Y[1]), label: rowLabel(ROW_Y[1]) },
    ];
    const rings = [0, 1].map(() =>
      el("rect", {
        width: CHIP_W + 12,
        height: CHIP_H + 12,
        rx: 10,
        fill: "none",
        stroke: "var(--lsx-hi)",
        "stroke-width": 4,
      }),
    );
    const tags = [0, 1].map(() => text({ fill: "var(--lsx-hi)", "font-size": 15 }));
    lanes = createLanes(ctx, g, lanesCap());
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    c = { arrA, arrB, heads, caps, counter, rows, rings, tags, el, text };
  }
  function lanesCap() {
    return Math.floor((2 * lm.L) / Math.min(lm.a, lm.b)) + 1;
  }

  /** Every chip, ring and label away: the arrays or the lanes have the stage. */
  const hideChips = () => {
    const m = [];
    for (const r of c.rows) {
      m.push([r.label, { opacity: 0 }]);
      for (const k of r.chips) m.push([k.box, { opacity: 0 }], [k.txt, { opacity: 0 }]);
    }
    for (const x of [...c.rings, ...c.tags]) m.push([x, { opacity: 0 }]);
    return m;
  };
  const hideArrays = () => {
    const m = [];
    for (const x of [...c.arrA, ...c.arrB, ...c.heads, ...c.caps, c.counter])
      m.push([x, { opacity: 0 }]);
    return m;
  };

  /** Two rectangles of items with n columns. */
  function arraysMoves(ctx, s, n, o = {}) {
    const geo = arrayGeometry(s.a, s.b, n);
    const view = arrayView(s.a, s.b, n);
    const m = [];
    const place = (pool, count, x0, which) =>
      pool.forEach((box, i) => {
        if (i >= count) {
          m.push([box, { opacity: 0 }]);
          return;
        }
        const { col, row } = cellOf(i, n);
        const done = i < Math.floor(count / n) * n;
        const size = geo.cell - 3;
        box.setAttribute(
          "fill",
          done ? (which === "A" ? "var(--lsx-x)" : "var(--lsx-u)") : "var(--lsx-card)",
        );
        if (done) box.removeAttribute("stroke-dasharray");
        else box.setAttribute("stroke-dasharray", "3 2");
        m.push([
          box,
          {
            x: x0 + col * geo.cell + 1.5,
            y: geo.y0 + row * geo.cell + 1.5,
            width: size,
            height: size,
            rx: which === "A" ? size / 2 : Math.min(3, size / 4),
            opacity: 1,
          },
        ]);
      });
    place(c.arrA, s.a, geo.x0A, "A");
    place(c.arrB, s.b, geo.x0B, "B");
    const heads = [`${s.a} ${ctx.L(s.nameA)}`, `${s.b} ${ctx.L(s.nameB)}`];
    c.heads.forEach((h, i) => {
      h.textContent = heads[i];
      m.push([h, { opacity: 1 }]);
    });
    const caps = [caption(s.a, n), caption(s.b, n)];
    c.caps.forEach((h, i) => {
      h.textContent = ctx.L(caps[i]);
      h.setAttribute(
        "fill",
        (i === 0 ? view.A : view.B).complete ? "var(--lsx-ink)" : "var(--lsx-lo)",
      );
      m.push([h, { opacity: o.noCaption ? 0 : 1 }]);
    });
    c.counter.textContent = o.counter === false ? "" : ctx.L(T.packWord(n));
    m.push([c.counter, { opacity: o.counter === false ? 0 : 1 }]);
    return m;
  }

  /** Put the stage in one state: { kind: "arrays"|"chips"|"lanes", ... }. */
  function view(ctx, o, ms) {
    const m = [];
    const laneOff = () => lanes.hide();
    if (o.kind === "arrays") {
      m.push(...arraysMoves(ctx, o.s, o.n, o), ...hideChips(), ...laneOff());
    } else if (o.kind === "chips") {
      m.push(...hideArrays(), ...laneOff(), ...chipMoves(ctx, o.step));
    } else {
      m.push(...hideArrays(), ...hideChips(), ...lanes.moves(o.lanes));
    }
    return ctx.tween(m, ms);
  }

  function chipMoves(ctx, step) {
    const m = [];
    const common = main.common;
    c.rows.forEach((r, i) => {
      const label = ctx.L(T.factorsLabel(i === 0 ? main.a : main.b));
      r.label.textContent = label;
      m.push([r.label, { opacity: 1 }]);
      for (const k of r.chips) {
        const isCommon = step >= 1 && common.includes(k.f);
        k.box.setAttribute("fill", isCommon ? "var(--lsx-ok-bg)" : "var(--lsx-card)");
        k.box.setAttribute("stroke", isCommon ? "var(--lsx-x-edge)" : "var(--lsx-muted)");
        k.box.setAttribute("stroke-width", isCommon ? "4" : "2");
        m.push([k.box, { opacity: 1 }], [k.txt, { opacity: 1 }]);
      }
      const g = r.chips.find((k) => k.f === main.g);
      const on = step >= 2 && g;
      c.tags[i].textContent = on ? ctx.L(T.gcfTag) : "";
      m.push([c.rings[i], on ? { x: g.x - 6, y: g.y - 6, opacity: 1 } : { opacity: 0 }]);
      m.push([
        c.tags[i],
        on ? { x: g.x + CHIP_W / 2, y: g.y + CHIP_H + 24, opacity: 1 } : { opacity: 0 },
      ]);
    });
    return m;
  }

  const lanesState = (ctx, extra = {}) => ({
    kind: "lanes",
    lanes: {
      a: lm.a,
      b: lm.b,
      span: 2 * lm.L,
      nameA: ctx.L(LT.laneLabel(lm, "a", v.lcm.v.unit)),
      nameB: ctx.L(LT.laneLabel(lm, "b", v.lcm.v.unit)),
      ...extra,
    },
  });
  const arrays = (s, n, extra = {}) => ({ kind: "arrays", s, n, ...extra });
  const packOptions = (s, seed, cueFn) =>
    seat(
      packChoices(s).map((o) => ({
        label: T.packLabel(o.value),
        correct: o.correct,
        cue: o.correct ? null : cueFn[o.kind](o.value),
        value: o.value,
      })),
      seed,
    );

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(
          `${hi(main.a)} ${escHtml(ctx.L(main.nameA))} · ${hi(main.b)} ${escHtml(ctx.L(main.nameB))}`,
        );
        ctx.say(T.situateSay);
        await view(ctx, arrays(main, main.startN), 0);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        const base = arrays(main, main.startN);
        await view(ctx, base, 250);
        ctx.expr(
          `${hi(main.a)} ${escHtml(ctx.L(main.nameA))} · ${hi(main.b)} ${escHtml(ctx.L(main.nameB))}`,
        );
        ctx.say(T.predictSay);
        const options = packOptions(main, main.g + 1, T.packCue);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              if (opt.value <= 24) view(ctx, arrays(main, opt.value), 300);
              else view(ctx, base, 300);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              view(ctx, base, 300);
            },
          }),
        );
      },
    },
    {
      id: "build",
      label: T.scene.build,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        const okN = (n) => Number.isInteger(n) && n >= 2 && n <= main.maxN;
        let n = saved.found ? main.g : okN(saved.n) ? saved.n : main.startN;
        let seen = Array.isArray(saved.seen) ? saved.seen.filter(okN) : [];
        const paint = (ms) => {
          const vw = arrayView(main.a, main.b, n);
          ctx.expr(
            vw.works
              ? `${hi(n)} ${escHtml(ctx.L(T.packWord(n)).replace(/^\d+ /, ""))}: ${vw.A.per} ${escHtml(ctx.L(main.nameA))} + ${vw.B.per} ${escHtml(ctx.L(main.nameB))}`
              : "",
          );
          return view(ctx, arrays(main, n), ms);
        };
        const report = () => {
          const vw = arrayView(main.a, main.b, n);
          if (vw.works) {
            if (!seen.includes(n)) seen = [...seen, n].sort((x, y) => x - y);
            st.seen = seen;
            if (n === main.g) {
              st.found = true;
              ctx.feedback(T.buildOk);
              ctx.unlock();
            } else ctx.feedback(T.worksNote(n, seen), "cue");
          } else {
            ctx.feedback(T.leftOver(vw.A.left, vw.B.left, main.nameA, main.nameB), "cue");
          }
          st.n = n;
          ctx.save();
        };
        const rng = ctx.range({
          label: T.buildLabel,
          min: 2,
          max: main.maxN,
          value: n,
          onInput: (val) => {
            n = val;
            report();
            paint(150);
          },
        });
        ctx.panel.appendChild(rng);
        ctx.say(T.buildSay);
        await paint(300);
        if (saved.found) ctx.feedback(T.buildOk);
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx, saved) {
        const st = ctx.state;
        const steps = T.connectSteps;
        let i =
          Number.isInteger(saved.step) && saved.step >= 0 && saved.step < steps.length
            ? saved.step
            : 0;
        const row = document.createElement("div");
        row.className = "lsx-choices";
        const next = ctx.button({
          label: T.nextStep,
          primary: true,
          onClick: () => go(i + 1, 350),
        });
        row.appendChild(next);
        ctx.panel.appendChild(row);
        const lists = (step) => {
          const mark = (list) =>
            list.map((f) => (step >= 1 && main.common.includes(f) ? hi(f) : String(f))).join(", ");
          return `${escHtml(ctx.L(T.factorsLabel(main.a)))}: ${mark(factA)}<br>${escHtml(ctx.L(T.factorsLabel(main.b)))}: ${mark(factB)}`;
        };
        const go = (k, ms) => {
          i = k;
          st.step = i;
          ctx.save();
          ctx.say(steps[i].say);
          ctx.expr(
            i < 2
              ? lists(i)
              : `${main.a} ÷ ${hi(main.g)} = ${main.a / main.g} · ${main.b} ÷ ${hi(main.g)} = ${main.b / main.g}`,
          );
          next.hidden = i >= steps.length - 1;
          return view(ctx, { kind: "chips", step: i }, ms);
        };
        await go(i, 0);
      },
    },
    {
      id: "lcm",
      label: T.scene.lcm,
      gate: true,
      async enter(ctx, saved) {
        await view(ctx, lanesState(ctx), 300);
        ctx.expr("");
        ctx.say(T.lcmSay);
        const options = seat(
          firstChoices(lm).map((o) => ({
            label: LT.firstLabel(o.value),
            correct: o.correct,
            cue: o.correct ? null : LT.firstCue[o.kind](o.value),
            value: o.value,
          })),
          lm.L + 1,
        );
        const done = (ms) => view(ctx, lanesState(ctx, { rings: [lm.L, 2 * lm.L], big: lm.L }), ms);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.lcmQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              view(ctx, lanesState(ctx, { probe: opt.value }), 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.lcmOk);
              ctx.unlock();
              done(400);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T.lcmExplainLabel, frame: T.lcmExplainFrame }));
        if (saved.solved) {
          await done(0);
          ctx.feedback(T.lcmOk);
        }
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const t = transfer;
        const base = arrays(t, t.startN);
        await view(ctx, base, 300);
        ctx.expr(`${hi(t.a)} ${escHtml(ctx.L(t.nameA))} · ${hi(t.b)} ${escHtml(ctx.L(t.nameB))}`);
        ctx.say(T.transferSay);
        const options = packOptions(t, t.g + 2, T.transferCue);
        const done = (ms) => {
          ctx.feedback(T.transferOk);
          return view(ctx, arrays(t, t.g), ms);
        };
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              view(ctx, opt.value <= 24 ? arrays(t, opt.value) : base, 300);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              done(450);
            },
          }),
        );
        if (saved.solved) await done(0);
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

// living/lcm-lanes.js — two lanes of multiples; the first shared one is the LCM (6-12).
//
// One cast for the whole play: a pool of dots per lane (circles on the top
// lane, rounded squares on the bottom lane — shape, not colour, tells the
// lanes apart), a track under each, a ring + guide line for every place both
// lanes have a dot, and one dashed probe line. The same dots are the hops the
// student takes in scene 3, the lists of multiples in scene 4, and are re-spaced
// for the transfer pair in the last scene.
//
// `createLanes` is exported: 6-7's "when do both fall in the same week" scene
// draws its own two lanes with the same cast (see factor-pairs.js).
//
// Config: { a, b, nameA?, nameB?, unit?, story, transfer:{ a, b, story? } } —
// 6-12 authors 4 and 6 (Reyes checks oxygen every 4 hours, Chen water every
// 6 hours) and the weDo pair 3 and 5.

import { escHtml } from "../../core/living-scene.js";
import {
  commonMultiples,
  firstChoices,
  H,
  hopState,
  lcmLanesCopy,
  multiples,
  nextChoices,
  placeCorrect,
  validateLcmLanes,
  W,
  X0,
  X1,
  xOf,
} from "./lcm-lanes-model.js";

export { validateLcmLanes };

const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
const Y_A = 112;
const Y_B = 196;
const D = 16; // a dot

/**
 * The persistent lanes. moves(o) returns tween moves (the caller tweens them with
 * its OWN ctx, so a resume replay snaps): o = { a, b, span, hopA?, hopB?, rings:[t],
 * big?, probe?, nameA, nameB, cur? } — hopA/hopB = how many hops are on stage
 * (undefined = every dot), rings = times both lanes share, probe = a dashed
 * line at one time.
 * @param {any} ctx @param {Element} parent @param {number} cap
 */
export function createLanes(ctx, parent, cap) {
  const { svgEl } = ctx; // only to build elements: the caller tweens with its own ctx
  /** @type {Element[]} */
  const everything = [];
  const el = (tag, attrs) => {
    const e = svgEl(tag, { opacity: 0, ...attrs }, parent);
    everything.push(e);
    return e;
  };
  const text = (attrs) =>
    el("text", {
      "text-anchor": "middle",
      "font-size": 15,
      "font-weight": 800,
      fill: "var(--lsx-ink)",
      ...attrs,
    });
  const track = (y) =>
    el("line", {
      x1: X0 - 12,
      x2: X1 + 12,
      y1: y,
      y2: y,
      stroke: "var(--lsx-muted)",
      "stroke-width": 3,
      "stroke-linecap": "round",
    });
  const tracks = [track(Y_A), track(Y_B)];
  const names = [
    text({ x: X0 - 12, y: 40, "text-anchor": "start", "font-size": 15 }),
    text({ x: X0 - 12, y: 268, "text-anchor": "start", "font-size": 15 }),
  ];
  const ring = (y) =>
    el("rect", {
      width: D + 14,
      height: D + 14,
      y: y - (D + 14) / 2,
      rx: 12,
      fill: "none",
      stroke: "var(--lsx-hi)",
      "stroke-width": 3,
    });
  const meets = Array.from({ length: 3 }, () => ({
    line: el("line", { stroke: "var(--lsx-hi)", "stroke-width": 3, "stroke-dasharray": "2 5" }),
    ringA: ring(Y_A),
    ringB: ring(Y_B),
  }));
  const dots = (
    /** @type {number} */ y,
    /** @type {number} */ rx,
    /** @type {string} */ fill,
    /** @type {string} */ stroke,
  ) =>
    Array.from({ length: cap }, () => ({
      box: el("rect", { width: D, height: D, rx, y: y - D / 2, fill, stroke, "stroke-width": 2 }),
      txt: text({ y: y + (y === Y_A ? -20 : 32) }),
    }));
  const laneA = dots(Y_A, D / 2, "var(--lsx-x)", "var(--lsx-x-edge)");
  const laneB = dots(Y_B, 3, "var(--lsx-u)", "var(--lsx-u-edge)");
  const cur = [
    el("rect", {
      width: D + 10,
      height: D + 10,
      y: Y_A - (D + 10) / 2,
      rx: (D + 10) / 2,
      fill: "none",
      stroke: "var(--lsx-ink)",
      "stroke-width": 2,
    }),
    el("rect", {
      width: D + 10,
      height: D + 10,
      y: Y_B - (D + 10) / 2,
      rx: 5,
      fill: "none",
      stroke: "var(--lsx-ink)",
      "stroke-width": 2,
    }),
  ];
  const probe = {
    line: el("line", {
      y1: 78,
      y2: 232,
      stroke: "var(--lsx-lo)",
      "stroke-width": 3,
      "stroke-dasharray": "7 5",
    }),
    txt: text({ y: 72, fill: "var(--lsx-lo)", "font-size": 17 }),
  };

  return {
    /** Tween moves that clear every lane element (another view takes the stage). */
    hide: () => everything.map((e) => [e, { opacity: 0 }]),
    /** The tween moves for one state, so a play can combine them with its own. @param {any} o */
    moves(o) {
      const { a, b, span } = o;
      const m = [];
      const hopA = o.hopA ?? Infinity;
      const hopB = o.hopB ?? Infinity;
      const lane = (
        /** @type {typeof laneA} */ dotsArr,
        /** @type {number} */ n,
        /** @type {number} */ hops,
      ) =>
        dotsArr.forEach((d, k) => {
          const t = k * n;
          const on = t <= span && k <= hops;
          const x = xOf(Math.min(t, span), span);
          d.txt.textContent = String(t);
          m.push([d.box, { x: x - D / 2, opacity: on ? 1 : 0 }]);
          m.push([d.txt, { x, opacity: on ? 1 : 0 }]);
        });
      lane(laneA, a, hopA);
      lane(laneB, b, hopB);
      m.push([tracks[0], { opacity: 1 }], [tracks[1], { opacity: 1 }]);
      names[0].textContent = o.nameA || "";
      names[1].textContent = o.nameB || "";
      m.push([names[0], { opacity: o.nameA ? 1 : 0 }], [names[1], { opacity: o.nameB ? 1 : 0 }]);
      const rings = o.rings || [];
      meets.forEach((mt, i) => {
        const t = rings[i];
        if (t == null) {
          m.push([mt.line, { opacity: 0 }], [mt.ringA, { opacity: 0 }], [mt.ringB, { opacity: 0 }]);
          return;
        }
        const x = xOf(t, span);
        const sw = t === o.big ? 5 : 3;
        m.push([mt.line, { x1: x, x2: x, y1: Y_A + 18, y2: Y_B - 18, opacity: 1 }]);
        m.push([mt.ringA, { x: x - (D + 14) / 2, "stroke-width": sw, opacity: 1 }]);
        m.push([mt.ringB, { x: x - (D + 14) / 2, "stroke-width": sw, opacity: 1 }]);
      });
      const at = (/** @type {number} */ k, /** @type {number} */ n, /** @type {number} */ hops) =>
        xOf(Math.min(Math.min(k, hops) * n, span), span);
      const showCur = o.cur && o.hopA != null;
      m.push([cur[0], { x: at(Infinity, a, hopA) - (D + 10) / 2, opacity: showCur ? 1 : 0 }]);
      m.push([cur[1], { x: at(Infinity, b, hopB) - (D + 10) / 2, opacity: showCur ? 1 : 0 }]);
      const px = o.probe != null && o.probe <= span ? xOf(o.probe, span) : null;
      probe.txt.textContent = px == null ? "" : `${o.probe}?`;
      m.push([probe.line, { x1: px ?? X0, x2: px ?? X0, opacity: px == null ? 0 : 1 }]);
      m.push([probe.txt, { x: px ?? X0, opacity: px == null ? 0 : 1 }]);
      return m;
    },
  };
}

export function buildLcmLanesPlay(cfg) {
  const v = validateLcmLanes(cfg);
  if (!v) return null;
  const T = lcmLanesCopy(v);
  const { main, transfer, unit } = v;
  const { a, b, L, span } = main;
  let lanes = null;

  const base = (s, extra = {}) => ({
    a: s.a,
    b: s.b,
    span: s.span,
    nameA: "",
    nameB: "",
    ...extra,
  });
  const named = (ctx, s, un, extra = {}) =>
    base(s, {
      nameA: ctx.L(T.laneLabel(s, "a", un)),
      nameB: ctx.L(T.laneLabel(s, "b", un)),
      ...extra,
    });

  function setup(ctx) {
    ctx.svg.innerHTML = "";
    const g = ctx.svgEl("g", {}, ctx.svg);
    lanes = createLanes(ctx, g, v.cap);
    ctx.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  const mainView = (ctx, extra = {}, ms = 0) =>
    ctx.tween(lanes.moves(named(ctx, main, unit, extra)), ms);
  const listHtml = (ctx, n, upto, common) =>
    `${escHtml(ctx.L(T.listLabel(n)))} ${multiples(n, upto)
      .slice(1)
      .map((t) => (common.includes(t) ? hi(t) : escHtml(String(t))))
      .join(", ")}`;
  const hiList = (ctx, s, upto = 2 * s.L) => {
    const common = commonMultiples(s.a, s.b, upto);
    return `${listHtml(ctx, s.a, upto, common)}<br>${listHtml(ctx, s.b, upto, common)}`;
  };

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.say(T.situateSay);
        ctx.expr("");
        await mainView(ctx, { hopA: 0, hopB: 0 }, 0);
        await mainView(ctx, { hopB: 0, hopA: Infinity }, 700);
        await mainView(ctx, {}, 700);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.predictSay);
        ctx.expr("");
        await mainView(ctx, {}, 300);
        const options = placeCorrect(
          firstChoices(main).map((o) => ({
            label: T.firstLabel(o.value),
            correct: o.correct,
            cue: o.correct ? null : T.firstCue[o.kind](o.value),
            value: o.value,
          })),
          L + 1,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              mainView(ctx, { probe: opt.value }, 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              mainView(ctx, { rings: [L], big: L }, 400);
            },
          }),
        );
        if (saved.solved) mainView(ctx, { rings: [L], big: L }, 0);
      },
    },
    {
      id: "hop",
      label: T.scene.hop,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        const okK = (k, n) => Number.isInteger(k) && k >= 0 && k * n <= span;
        let ka = saved.found ? L / a : okK(saved.ka, a) ? saved.ka : 0;
        let kb = saved.found ? L / b : okK(saved.kb, b) ? saved.kb : 0;
        const row = document.createElement("div");
        row.className = "lsx-choices";
        const paint = (ms, rings = []) => {
          const hs = hopState(main, ka, kb);
          ctx.expr(
            `${escHtml(ctx.L(main.nameA))}: ${
              multiples(a, ka * a)
                .slice(1)
                .join(", ") || "0"
            }<br>${escHtml(ctx.L(main.nameB))}: ${
              multiples(b, kb * b)
                .slice(1)
                .join(", ") || "0"
            }`,
          );
          return mainView(
            ctx,
            { hopA: ka, hopB: kb, cur: true, rings: hs.first ? [L] : rings, big: L },
            ms,
          );
        };
        const after = () => {
          const hs = hopState(main, ka, kb);
          st.ka = ka;
          st.kb = kb;
          if (hs.first) {
            st.found = true;
            ctx.save();
            ctx.feedback(T.hopOk);
            ctx.unlock();
          } else if (hs.meet) {
            ctx.save();
            ctx.feedback(T.hopLater(hs.pa), "cue");
          } else {
            ctx.save();
            ctx.feedback(T.hopAt(hs.pa, hs.pb), "cue");
          }
          paint(350);
        };
        const hopA = ctx.button({
          label: T.hopBtn("a"),
          onClick: () => (okK(ka + 1, a) ? (ka++, after()) : ctx.feedback(T.hopTooFar, "cue")),
        });
        const hopB = ctx.button({
          label: T.hopBtn("b"),
          onClick: () => (okK(kb + 1, b) ? (kb++, after()) : ctx.feedback(T.hopTooFar, "cue")),
        });
        const reset = ctx.button({
          label: T.startOver,
          onClick: () => {
            ka = 0;
            kb = 0;
            st.ka = 0;
            st.kb = 0;
            ctx.feedback("");
            paint(300);
          },
        });
        row.append(hopA, hopB, reset);
        ctx.panel.appendChild(row);
        ctx.say(T.hopSay);
        await paint(0, []);
        if (saved.found) ctx.feedback(T.hopOk);
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx, saved) {
        const common = commonMultiples(a, b, 2 * L);
        const st = ctx.state;
        const rings = common;
        ctx.expr(hiList(ctx, main));
        ctx.say(T.connectSay[0]);
        await mainView(ctx, { rings, big: null }, 500);
        const second = async (ms) => {
          st.stepped = true;
          ctx.save();
          ctx.panel.innerHTML = "";
          ctx.say(T.connectSay[1]);
          await mainView(ctx, { rings, big: L }, ms);
        };
        if (saved.stepped) return second(0);
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.appendChild(
          ctx.button({
            label: { en: "Find the least one", es: "Halla el menor" },
            primary: true,
            onClick: () => second(350),
          }),
        );
        ctx.panel.appendChild(row);
      },
    },
    {
      id: "next",
      label: T.scene.next,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.nextSay);
        ctx.expr("");
        const two = [L, 2 * L];
        await mainView(ctx, { rings: two, big: L }, 300);
        const options = placeCorrect(
          nextChoices(main).map((o) => ({
            label: T.firstLabel(o.value),
            correct: o.correct,
            cue: o.correct ? null : o.kind === "skip" ? T.nextCue.skip : T.nextCue.oneLane(o.value),
            value: o.value,
          })),
          L + 2,
        );
        const done = (ms) => mainView(ctx, { rings: [L, 2 * L, 3 * L], big: L }, ms);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.nextQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              mainView(ctx, { rings: two, big: L, probe: opt.value }, 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.nextOk);
              ctx.unlock();
              done(400);
            },
          }),
        );
        if (saved.solved) done(0);
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const t = transfer;
        const tv = (extra = {}, ms = 0) => ctx.tween(lanes.moves(named(ctx, t, t.unit, extra)), ms);
        ctx.say(T.transferSay);
        ctx.expr("");
        await tv({}, 400);
        const options = placeCorrect(
          firstChoices(t).map((o) => ({
            label: T.transferLabel(o.value),
            correct: o.correct,
            cue: o.correct ? null : T.firstCue[o.kind](o.value),
            value: o.value,
          })),
          t.L + 2,
        );
        const done = (ms) => {
          ctx.expr(hiList(ctx, t, t.L));
          return tv({ rings: commonMultiples(t.a, t.b, t.span), big: t.L }, ms);
        };
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              tv({ probe: opt.value }, 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              done(400);
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

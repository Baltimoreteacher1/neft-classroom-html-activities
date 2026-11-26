// living/polygon-triangles.js — a regular polygon is n equal triangles from its center.
//
// One cast for the whole play: MAX triangles around one center. They ARE the
// whole polygon in scene 1 (drawn uncut so the prediction is honest), are
// pulled out one at a time by hand in scene 3 (the count is the number of
// sides), and ONE of them carries the base × height in scene 4 before all of
// them are stamped with that same area. Scene 5 re-points the same triangles
// at the lesson's second polygon; scene 6 is a third polygon left uncut.
//
// Config: { n, side, a, unit:{abbr,sq}, story:{en,es},
//   second:{ n, side, a, story? }, transfer:{ n, side, a, story?, unit? } } —
// the lesson's own numbers. `a` is the lesson's rounded height (center to the
// middle of a side); the model refuses one that does not fit the polygon.

import { escHtml } from "../../core/living-scene.js";
import { makeMotion, paintPose, poseOf, seedFor } from "./area-derive.js";
import {
  areaChoices,
  countChoices,
  fmt,
  MAX_N,
  outward,
  placeCorrect,
  polyArea,
  polygonCopy,
  triArea,
  triangle,
  validatePolygonTriangles,
} from "./polygon-triangles-model.js";

export { validatePolygonTriangles };

const W = 440;
const R = 120; // circumradius on the stage
const TOP = 14;
const EXPL = 22; // how far a pulled-out triangle travels
const CX = W / 2;
const CY = TOP + R + EXPL;
const H = CY + R + 64;

export function buildPolygonTrianglesPlay(cfg) {
  const v = validatePolygonTriangles(cfg);
  if (!v) return null;
  const T = polygonCopy(v);
  const motion = makeMotion();
  const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(String(s))}</span>`;
  const X = { fill: "var(--lsx-x)", stroke: "var(--lsx-ink)" };
  const U = { fill: "var(--lsx-u)", stroke: "var(--lsx-ink)" };

  let spec = v.main;
  let unit = v.unit;
  let c = null;

  const P = ([x, y]) => [CX + R * x, CY + R * y];
  const ptsOf = (poly) => poly.map((p) => P(p).join(",")).join(" ");
  const aPx = () => R * Math.cos(Math.PI / spec.n);

  /** Switch the stage to a polygon: every triangle re-points at it. */
  function useSpec(sp, un) {
    spec = sp;
    unit = un;
    for (let i = 0; i < MAX_N; i++) {
      const tri = c.tri[i];
      if (i < sp.n) tri.poly.setAttribute("points", ptsOf(triangle(sp.n, i)));
      Object.assign(tri, { dx: 0, dy: 0 });
      paintPose(tri);
    }
    const ring = Array.from({ length: sp.n }, (_, k) => triangle(sp.n, k)[1]);
    c.whole.setAttribute("points", ptsOf(ring));
    c.sides.setAttribute("points", ptsOf(ring));
  }

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 18,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        stroke: "var(--lsx-card)",
        "stroke-width": 3,
        "paint-order": "stroke",
        "pointer-events": "none",
        ...attrs,
      });
    const join = { "stroke-width": 2.5, "stroke-linejoin": "round", "fill-opacity": 0.4 };
    const whole = el("polygon", { ...join, fill: "var(--lsx-x)", stroke: "var(--lsx-ink)" });
    const tri = Array.from({ length: MAX_N }, () => {
      const grp = el("g", {});
      return { ...poseOf(grp), poly: svgEl("polygon", join, grp) };
    });
    const sides = el("polygon", {
      fill: "none",
      stroke: "var(--lsx-lo)",
      "stroke-width": 7,
      "stroke-linejoin": "round",
      "stroke-opacity": 0.8,
    });
    c = {
      whole,
      tri,
      sides,
      lab: tri.map(() => text({ "font-size": 17 })),
      aLine: el("line", { stroke: "var(--lsx-ink)", "stroke-width": 3, "stroke-dasharray": "7 5" }),
      angle: el("path", { fill: "none", stroke: "var(--lsx-ink)", "stroke-width": 2.5 }),
      dot: el("circle", { r: 5, fill: "var(--lsx-ink)", stroke: "var(--lsx-card)" }),
      tBase: text({}),
      tH: text({ fill: "var(--lsx-hi)", "text-anchor": "start" }),
      total: text({ "font-size": 22 }),
    };
    useSpec(v.main, v.unit);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  /**
   * Put the whole stage in one state (every scene calls this, so Back, a step
   * dot and resume all look alike). o: { whole, pulled, hi0, dims, sides,
   * labelOf(i), total }
   */
  function view(ctx, o = {}, ms = 0) {
    const t = ctx.restoring ? 0 : ms;
    const n = spec.n;
    const un = ctx.L(unit.abbr);
    const m = [];
    const put = (el, a) => m.push([el, a]);
    const pulled = o.pulled ?? 0;
    const poses = [];
    put(c.whole, { opacity: o.whole ? 1 : 0 });
    put(c.sides, { opacity: o.sides ? 1 : 0 });
    c.tri.forEach((tri, i) => {
      const on = i < n && !o.whole;
      const [ox, oy] = i < n ? outward(n, i) : [0, 0];
      const out = i < pulled ? EXPL : 0;
      const look = i < pulled || (o.hi0 && i === 0) ? U : X;
      tri.poly.setAttribute("fill", look.fill);
      tri.poly.setAttribute("stroke", look.stroke);
      put(tri.el, { opacity: on ? 1 : 0 });
      poses.push([tri, { dx: ox * out, dy: oy * out }]);
      // The label sits at the triangle's centroid, two thirds of the way to its side.
      const [lx, ly] = [CX + ox * (out + (2 / 3) * aPx()), CY + oy * (out + (2 / 3) * aPx())];
      const txt = on && o.labelOf ? o.labelOf(i) : null;
      put(c.lab[i], { opacity: txt ? 1 : 0, x: lx, y: ly + 6, text: txt ?? "" });
    });
    // The guides on the bottom triangle: its base (a side) and its height (center to side).
    const a = aPx();
    const d = o.dims ? 1 : 0;
    c.angle.setAttribute(
      "d",
      `M${CX + 11} ${CY + a} L${CX + 11} ${CY + a - 11} L${CX} ${CY + a - 11}`,
    );
    put(c.aLine, { opacity: d, x1: CX, x2: CX, y1: CY, y2: CY + a });
    put(c.angle, { opacity: d });
    put(c.dot, { opacity: d, cx: CX, cy: CY });
    const word = ctx.L(o.whole ? T.side : T.base);
    const sideTxt = `${word} = ${spec.side} ${un}`;
    put(c.tBase, { opacity: o.dims || o.sideLabel ? 1 : 0, x: CX, y: CY + a + 26, text: sideTxt });
    put(c.tH, {
      opacity: d,
      x: CX + 12,
      y: CY + a * 0.5,
      text: `${ctx.L(T.height)} = ${spec.a} ${un}`,
    });
    put(c.total, { opacity: o.total ? 1 : 0, x: CX, y: CY + a + 56, text: o.total ?? "" });
    return Promise.all([ctx.tween(m, t), motion.run(poses, t)]);
  }

  const enterScene = (sp, un) => useSpec(sp, un);
  const opts = (list, seed, label = fmt) =>
    placeCorrect(
      list.map((o) => ({ ...o, label: label(o.value) })),
      seed,
    );
  const sq = (ctx, un) => ctx.L(un.sq);
  const cueView = (opt) => ({ whole: true, sideLabel: true, sides: opt.kind !== "one" });

  /** An area question on a polygon (scene 5 shows the cut, scene 6 leaves it whole). */
  function areaScene(id, label, say, question, ok, extra, whole) {
    return {
      id,
      label,
      gate: true,
      async enter(ctx, saved) {
        enterScene(extra.spec, extra.unit);
        const sp = extra.spec;
        const base = { whole, dims: true, hi0: !whole };
        const done = {
          dims: false,
          labelOf: () => fmt(triArea(sp)),
          total: `${fmt(polyArea(sp))} ${sq(ctx, extra.unit)}`,
        };
        const solved = () => {
          ctx.expr(`${hi(sp.n)} × ${lo(fmt(triArea(sp)))} = ${fmt(polyArea(sp))}`);
          return view(ctx, done, 450);
        };
        ctx.expr(escHtml("A = ?"));
        ctx.say(say);
        const options = opts(areaChoices(sp), seedFor(4, polyArea(sp), sp.n, sp.side));
        ctx.panel.appendChild(
          ctx.choices({
            question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cueArea(opt, sp), "cue");
              view(ctx, { ...base, hi0: opt.kind === "one" || base.hi0 }, 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(ok);
              ctx.unlock();
              solved();
            },
          }),
        );
        if (saved.solved) await solved();
        else await view(ctx, base, 450);
        if (id === "transfer")
          ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    };
  }

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        enterScene(v.main, v.unit);
        ctx.expr(escHtml("A = ?"));
        ctx.say(T.situateSay);
        await view(ctx, { whole: true, sideLabel: true }, 500);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        enterScene(v.main, v.unit);
        const n = v.main.n;
        const base = { whole: true, sideLabel: true };
        ctx.expr(escHtml("A = ?"));
        ctx.say(T.predictSay);
        const options = opts(countChoices(n), seedFor(4, n, v.main.side), String);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cueCount(opt), "cue");
              view(ctx, cueView(opt), 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              view(ctx, base, 250);
            },
          }),
        );
        await view(ctx, base, 300);
      },
    },
    {
      id: "cut",
      label: T.scene.cut,
      gate: true,
      async enter(ctx) {
        enterScene(v.main, v.unit);
        const st = ctx.state;
        const n = v.main.n;
        let k = Number.isInteger(st.k) && st.k >= 0 && st.k <= n ? st.k : 0;
        const o = (kk) => ({
          whole: kk === 0,
          pulled: kk,
          labelOf: (i) => (i < kk ? String(i + 1) : null),
        });
        const done = () => {
          ctx.feedback(T.cutDone);
          ctx.unlock();
        };
        const rng = ctx.range({
          label: T.cutLabel,
          min: 0,
          max: n,
          value: k,
          onInput: (val) => {
            k = val;
            st.k = val;
            ctx.save();
            view(ctx, o(val), 250);
            if (val === n) done();
            else ctx.feedback(val ? T.cutKeep(val) : "");
          },
        });
        ctx.panel.appendChild(rng);
        ctx.expr("");
        ctx.say(T.cutSay);
        await view(ctx, o(k), 400);
        if (k === n) done();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        enterScene(v.main, v.unit);
        const st = ctx.state;
        const s = v.main;
        const tri = fmt(triArea(s));
        const one = { dims: true, hi0: true, total: `${tri} ${sq(ctx, v.unit)}` };
        const all = { labelOf: () => tri, total: `${fmt(polyArea(s))} ${sq(ctx, v.unit)}` };
        const showOne = (ms) => {
          ctx.expr(`½ × ${hi(s.side)} × ${lo(s.a)} = ${tri}`);
          ctx.say(T.connectSay1);
          return view(ctx, one, ms);
        };
        const showAll = (ms) => {
          ctx.expr(`${hi(s.n)} × ${lo(tri)} = ${fmt(polyArea(s))}`);
          ctx.say(T.connectSay2);
          return view(ctx, all, ms);
        };
        const btn = ctx.button({
          label: T.allLabel,
          primary: true,
          onClick: () => {
            st.all = true;
            ctx.save();
            btn.disabled = true;
            showAll(500);
          },
        });
        btn.style.justifySelf = "start";
        ctx.panel.appendChild(btn);
        if (st.all) {
          btn.disabled = true;
          await showAll(0);
        } else await showOne(500);
      },
    },
    areaScene("other", T.scene.other, T.otherSay, T.otherQ, T.otherOk, v.second, false),
    areaScene(
      "transfer",
      T.scene.transfer,
      T.transferSay,
      T.transferQ,
      T.transferOk,
      v.transfer,
      true,
    ),
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

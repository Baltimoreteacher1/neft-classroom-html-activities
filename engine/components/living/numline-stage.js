// living/numline-stage.js — the persistent number-line stage shared by the
// integers-cluster plays.
//
// One axis, equally spaced ticks, and named MARKS (a dot, its value label, a
// distance bar from 0 and the bar's label). A scene describes the whole stage
// each time it enters (`show`), so a scene looks the same whether the student
// arrived by Next, Back or resume, and marks keep their identity as they move.
//
//   const stage = createStage(ctx, { axis: "h", W: 480, H: 200 });
//   stage.scale({ min: -8, max: 8, labelEvery: 2 });
//   stage.mark("a", "x");
//   await stage.show(ctx, { a: { v: -6, label: "−6", bar: true, barLabel: "6" } }, 600);

import { svgEl } from "../../core/living-scene.js";
import { geometry, num, tickValues } from "./numline-model.js";

export const LOOK = {
  x: { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)", ink: "var(--lsx-hi)" },
  u: { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)", ink: "var(--lsx-lo)" },
};
const R = 9; // a dot
const HALO = { stroke: "var(--lsx-card)", "stroke-width": 5, "paint-order": "stroke" };

/** Per-axis layout: stage size, axis position, label and bar lanes. */
const LAYOUT = {
  h: { W: 420, H: 184, line: 94, pad: 30, tick: -22, dotLabel: 26, lane: { up: 52, down: -52 } },
  v: { W: 380, H: 340, line: 100, pad: 24, tick: -16, dotLabel: 32, lane: { up: 18, down: 18 } },
};
export const layoutOf = (axis) => LAYOUT[axis === "v" ? "v" : "h"];

/** A layout with `top` px trimmed above the axis and `extraH` added below (a play's own cast). */
export function layoutFor(axis, { top = 0, extraH = 0 } = {}) {
  const base = layoutOf(axis);
  return { ...base, line: base.line - top, H: base.H - top + extraH };
}

export function createStage(ctx, { axis = "h", top = 0, extraH = 0 } = {}) {
  const lay = layoutFor(axis, { top, extraH });
  const { svg } = ctx;
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${lay.W} ${lay.H}`);
  const vertical = axis === "v";
  const mk = (tag, attrs, parent) => svgEl(tag, attrs, parent);
  const layer = () => mk("g", {}, svg);
  const gBand = layer();
  const gTicks = layer();
  const gSub = layer();
  const gBars = layer();
  const gDots = layer();
  const gText = layer();
  const gExtra = layer(); // a play's own cast (chips, letters)
  const band = mk(
    "rect",
    {
      opacity: 0,
      fill: "var(--lsx-cue-bg)",
      stroke: "var(--lsx-u-edge)",
      "stroke-dasharray": "6 4",
    },
    gBand,
  );
  let geo = null;
  let scaleCfg = null;
  const marks = new Map();
  const ghost = mk(
    "circle",
    {
      r: R + 7,
      opacity: 0,
      fill: "none",
      stroke: "var(--lsx-lo)",
      "stroke-width": 3,
      "stroke-dasharray": "5 4",
    },
    gDots,
  );
  const zeroNote = mk(
    "text",
    { opacity: 0, "font-size": 15, "font-weight": 700, fill: "var(--lsx-muted)" },
    gText,
  );
  const axisLine = mk("line", { stroke: "var(--lsx-ink)", "stroke-width": 3 }, gTicks);

  const anchor = (off) => (vertical ? (off >= 0 ? "start" : "end") : "middle");

  function drawTicks({ min, max, labelEvery = 1, tickEvery = 1 }) {
    gTicks.querySelectorAll("[data-tick]").forEach((n) => n.remove());
    for (const t of tickValues(min, max, tickEvery)) {
      const zero = t === 0;
      const a = geo.at(t, zero ? 10 : 6);
      const b = geo.at(t, zero ? -10 : -6);
      mk(
        "line",
        {
          "data-tick": 1,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          stroke: "var(--lsx-ink)",
          "stroke-width": zero ? 4 : 2,
        },
        gTicks,
      );
      if (Math.round(t / labelEvery) * labelEvery === t) {
        const p = geo.at(t, lay.tick);
        mk(
          "text",
          {
            "data-tick": 1,
            x: p.x,
            y: p.y + (vertical ? 5 : 5),
            "text-anchor": anchor(lay.tick),
            "font-size": 15,
            "font-weight": zero ? 800 : 600,
            fill: zero ? "var(--lsx-ink)" : "var(--lsx-muted)",
            text: num(t),
          },
          gTicks,
        );
      }
    }
    const e0 = geo.at(min);
    const e1 = geo.at(max);
    for (const [k, v] of Object.entries({ x1: e0.x, y1: e0.y, x2: e1.x, y2: e1.y }))
      axisLine.setAttribute(k, String(v));
  }

  /** Set the visible range and redraw the ticks. Marks keep their elements. */
  function scale(cfg) {
    scaleCfg = cfg;
    geo = geometry({
      axis,
      min: cfg.min,
      max: cfg.max,
      W: lay.W,
      H: lay.H,
      at: lay.line,
      pad: lay.pad,
    });
    drawTicks(cfg);
    return geo;
  }

  /** Create a mark (hidden, parked at 0). */
  function mark(id, look = "x") {
    const p = geo.at(0);
    const l = LOOK[look];
    const text = (extra) =>
      mk(
        "text",
        {
          opacity: 0,
          x: p.x,
          y: p.y,
          "font-size": 17,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          ...HALO,
          ...extra,
        },
        gText,
      );
    marks.set(id, {
      bar: mk(
        "line",
        {
          opacity: 0,
          x1: p.x,
          y1: p.y,
          x2: p.x,
          y2: p.y,
          "stroke-width": 6,
          "stroke-linecap": "round",
          stroke: l.stroke,
        },
        gBars,
      ),
      dot: mk(
        "circle",
        { opacity: 0, cx: p.x, cy: p.y, r: R, fill: l.fill, stroke: l.stroke, "stroke-width": 3 },
        gDots,
      ),
      label: text({}),
      barLabel: text({ "font-size": 16 }),
    });
  }

  /**
   * Describe the whole stage. states: { [markId]: { v, label?, bar?, barLabel?,
   * look?: "x"|"u", lane?: "up"|"down"|number, off?: dot-label offset },
   * ghost?: { v } | null, band?: { a, b } | null, sub?: { a, b, den } | null,
   * zero?: string }. Marks not named are hidden in place.
   */
  function show(sceneCtx, states, ms) {
    const m = [];
    for (const [id, parts] of marks) {
      const s = states[id];
      const hide = (el) => m.push([el, { opacity: 0 }]);
      if (!s) {
        for (const el of Object.values(parts)) hide(el);
        continue;
      }
      const look = LOOK[s.look || "x"];
      const p = geo.at(s.v);
      m.push([parts.dot, { opacity: 1, cx: p.x, cy: p.y, fill: look.fill, stroke: look.stroke }]);
      const off = s.off ?? lay.dotLabel;
      const lp = geo.at(s.v, off);
      if (s.label != null) {
        m.push([
          parts.label,
          { opacity: 1, x: lp.x, y: lp.y + 6, "text-anchor": anchor(off), text: s.label },
        ]);
      } else hide(parts.label);
      const lane = typeof s.lane === "number" ? s.lane : lay.lane[s.lane || "up"];
      const b0 = geo.at(0, lane);
      const b1 = geo.at(s.v, lane);
      m.push([
        parts.bar,
        { opacity: s.bar ? 1 : 0, x1: b0.x, y1: b0.y, x2: b1.x, y2: b1.y, stroke: look.stroke },
      ]);
      // A short vertical bar's label would sit on the dot's own label: leave it to the sentence.
      const crowded = vertical && Math.abs(s.v / 2) * geo.unit < 26;
      if (s.bar && s.barLabel != null && !crowded) {
        const loff = vertical ? lane + 14 : lane + Math.sign(lane) * 18;
        const mid = geo.at(s.v / 2, loff);
        m.push([
          parts.barLabel,
          {
            opacity: 1,
            x: mid.x,
            y: mid.y + 6,
            "text-anchor": anchor(loff),
            fill: look.ink,
            text: s.barLabel,
          },
        ]);
      } else hide(parts.barLabel);
    }
    const g = states.ghost;
    const gp = geo.at(g ? g.v : 0);
    m.push([ghost, { opacity: g ? 1 : 0, cx: gp.x, cy: gp.y }]);
    const bd = states.band;
    if (bd) {
      const a = geo.at(bd.a);
      const b = geo.at(bd.b);
      const box = vertical
        ? { x: a.x - 16, y: Math.min(a.y, b.y), width: 32, height: Math.abs(a.y - b.y) }
        : { x: Math.min(a.x, b.x), y: a.y - 16, width: Math.abs(a.x - b.x), height: 32 };
      m.push([band, { opacity: 1, ...box }]);
    } else m.push([band, { opacity: 0 }]);
    gSub.innerHTML = "";
    if (states.sub) {
      const { a, b, den } = states.sub;
      for (let i = 1; i < den; i++) {
        const v = a + ((b - a) * i) / den;
        const t0 = geo.at(v, 11);
        const t1 = geo.at(v, -11);
        mk(
          "line",
          {
            x1: t0.x,
            y1: t0.y,
            x2: t1.x,
            y2: t1.y,
            stroke: "var(--lsx-lo)",
            "stroke-width": 3,
          },
          gSub,
        );
      }
    }
    const z = geo.at(0, vertical ? 34 : -40);
    if (states.zero) zeroNote.textContent = states.zero;
    zeroNote.setAttribute("text-anchor", vertical ? "start" : "middle");
    m.push([zeroNote, { opacity: states.zero ? 1 : 0, x: z.x, y: z.y + 5 }]);
    return sceneCtx.tween(m, ms);
  }

  return {
    scale,
    mark,
    show,
    layer: gExtra,
    get geo() {
      return geo;
    },
    get scaleCfg() {
      return scaleCfg;
    },
    lay,
  };
}

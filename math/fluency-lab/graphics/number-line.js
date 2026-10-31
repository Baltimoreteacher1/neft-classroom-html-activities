// Number line: draggable points and jumps on any rational tick spacing (whole numbers, halves ... twelfths,
// tenths, hundredths, negatives), exact snapping, zoom and pan, labelled or unlabelled ticks, comparing and
// ordering, and jumps for adding and subtracting. Every position is an exact rational {n, d}; floats are used
// only to place pixels.
import {
  add,
  asFrac,
  ceilQ,
  clamp,
  cmp,
  decimalText,
  div,
  eq,
  floorQ,
  frac,
  mixedText,
  mul,
  must,
  neg,
  ratText,
  sub,
  toNumber,
} from "./graphics-a-core.js";
import {
  button,
  choice,
  createComponent,
  dragSurface,
  fracEl,
  h,
  s,
  setDisabled,
  stepper,
  svgFraction,
  text,
} from "./graphics-a-ui.js";

const TICKS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 100].map((d) => frac(1, d));
const NAMES = ["A", "B", "C", "D"];
const MAX_TICKS = 400;
const LIMIT = frac(1000, 1);
const FORMATS = ["fraction", "mixed", "decimal"];
const LABELS = ["all", "ends", "none"];
const ONE = frac(1, 1);
const TWO = frac(2, 1);
const HALF = frac(1, 2);

export const valueText = (f, format) =>
  format === "decimal"
    ? (decimalText(f) ?? ratText(f))
    : format === "mixed"
      ? mixedText(f)
      : ratText(f);
export const jumpEnd = (state) => state.jumps.reduce((total, j) => add(total, j), state.points[0]);
export const positions = (state) => {
  const list = [state.points[0]];
  for (const j of state.jumps) list.push(add(list.at(-1), j));
  return list;
};
const inRange = (v, min, max) => cmp(v, min) >= 0 && cmp(v, max) <= 0;

// Nearest multiple of snap to a raw (float) position, clamped to [lo, hi]. The result is an exact rational.
export function snapValue(raw, snap, lo, hi) {
  const k = clamp(Math.round(raw / toNumber(snap)), ceilQ(lo, snap), floorQ(hi, snap));
  return mul(frac(k, 1), snap);
}
// Every multiple of tick inside [min, max] as {k, value}.
export function tickList(min, max, tick) {
  const out = [];
  for (let k = ceilQ(min, tick); k <= floorQ(max, tick); k += 1)
    out.push({ k, value: mul(frac(k, 1), tick) });
  return out;
}
// Range of positions the START point may take so every jump stays on the line.
export function startBounds(state) {
  const run = positions({ points: [frac(0, 1)], jumps: state.jumps });
  const lowest = run.reduce((a, b) => (cmp(a, b) <= 0 ? a : b));
  const highest = run.reduce((a, b) => (cmp(a, b) >= 0 ? a : b));
  return { lo: sub(state.min, lowest), hi: sub(state.max, highest) };
}

function fitRange(state, min, max, tick) {
  const pts = [...state.points, ...positions(state)];
  const lo = pts.reduce((a, b) => (cmp(a, b) <= 0 ? a : b));
  const hi = pts.reduce((a, b) => (cmp(a, b) >= 0 ? a : b));
  return cmp(lo, min) >= 0 &&
    cmp(hi, max) <= 0 &&
    cmp(max, min) > 0 &&
    ceilQ(sub(max, min), tick) <= MAX_TICKS &&
    cmp(LIMIT, max) >= 0 &&
    cmp(neg(LIMIT), min) <= 0
    ? { min, max, tick, snap: tick }
    : null;
}
// Zoom in by 2 around the first point (tick and snap halve), or null when a point would fall off the line.
export function zoomIn(state) {
  const width = sub(state.max, state.min);
  const next = div(width, TWO);
  const tick = div(state.tick, TWO);
  const pts = [...state.points, ...positions(state)];
  const lo = pts.reduce((a, b) => (cmp(a, b) <= 0 ? a : b));
  const hi = pts.reduce((a, b) => (cmp(a, b) >= 0 ? a : b));
  if (cmp(sub(hi, lo), next) > 0 || ceilQ(next, tick) < 1) return null;
  const k = clamp(
    floorQ(sub(state.points[0], div(next, TWO)), tick),
    ceilQ(sub(hi, next), tick),
    floorQ(lo, tick),
  );
  if (ceilQ(sub(hi, next), tick) > floorQ(lo, tick)) return null;
  const min = mul(frac(k, 1), tick);
  return fitRange(state, min, add(min, next), tick);
}
export function zoomOut(state) {
  const width = sub(state.max, state.min);
  const tick = mul(state.tick, TWO);
  const min = mul(frac(floorQ(sub(state.min, div(width, TWO)), tick), 1), tick);
  return fitRange(state, min, add(min, mul(width, TWO)), tick);
}
export function pan(state, direction) {
  const width = sub(state.max, state.min);
  const shift = mul(
    frac(Math.max(1, floorQ(div(width, frac(4, 1)), state.tick)) * direction, 1),
    state.tick,
  );
  return fitRange(state, add(state.min, shift), add(state.max, shift), state.tick);
}

export function normalizeState(input, cfg = {}) {
  const min = asFrac(input?.min);
  const max = asFrac(input.max);
  const tick = asFrac(input.tick);
  const snap = asFrac(input.snap);
  const step = asFrac(input.step);
  must(cmp(min, max) < 0, "min must be less than max");
  must(tick.n > 0 && snap.n > 0 && step.n > 0, "tick, snap and step must be positive");
  must(cmp(LIMIT, max) >= 0 && cmp(neg(LIMIT), min) <= 0, "range must stay within +/-1000");
  must(ceilQ(sub(max, min), tick) <= MAX_TICKS, `at most ${MAX_TICKS} ticks`);
  must(
    Array.isArray(input.points) && input.points.length >= 1 && input.points.length <= NAMES.length,
    "1-4 points",
  );
  const points = input.points.map(asFrac);
  must(Array.isArray(input.jumps) && input.jumps.length <= 12, "at most 12 jumps");
  const jumps = input.jumps.map(asFrac);
  must(FORMATS.includes(input.format) && LABELS.includes(input.labels), "unknown format or labels");
  const state = {
    min,
    max,
    tick,
    snap,
    step,
    points,
    jumps,
    labels: input.labels,
    format: input.format,
  };
  must(
    [...points, ...positions(state)].every((p) => inRange(p, min, max)),
    "every point and jump must lie on the line",
  );
  return state;
}

export function evaluate(state, target) {
  if (Array.isArray(target))
    return (
      target.length === state.points.length &&
      state.points.every((p, i) => eq(p, asFrac(target[i])))
    );
  if (target?.order) {
    const values = target.order.map((name) => state.points[NAMES.indexOf(name)]);
    return values.every((v) => v) && values.every((v, i) => i === 0 || cmp(values[i - 1], v) < 0);
  }
  const goal = asFrac(target?.value ?? target);
  return eq(state.jumps.length ? jumpEnd(state) : state.points[0], goal);
}

export function describe(state, t) {
  const fmt = (f) => valueText(f, state.format);
  const parts = [
    t("Number line from {min} to {max}, ticks every {tick}.", {
      min: fmt(state.min),
      max: fmt(state.max),
      tick: fmt(state.tick),
    }),
  ];
  state.points.forEach((p, i) =>
    parts.push(t("Point {name} is at {value}.", { name: NAMES[i], value: fmt(p) })),
  );
  if (state.points.length === 2) {
    const c = cmp(state.points[0], state.points[1]);
    parts.push(
      c === 0
        ? t("A and B are at the same place.")
        : c < 0
          ? t("A is to the left of B, so A is less than B.")
          : t("A is to the right of B, so A is greater than B."),
    );
    const gap = state.points[0].n * state.points[1].d - state.points[1].n * state.points[0].d;
    parts.push(
      t("The distance between them is {value}.", {
        value: fmt(
          gap < 0 ? sub(state.points[1], state.points[0]) : sub(state.points[0], state.points[1]),
        ),
      }),
    );
  }
  if (state.jumps.length) {
    const jumps = state.jumps.map((j) => (j.n < 0 ? `−${fmt(neg(j))}` : `+${fmt(j)}`)).join(", ");
    parts.push(
      t("Jumps: {jumps}. The last jump lands at {value}.", { jumps, value: fmt(jumpEnd(state)) }),
    );
  }
  return parts.join(" ");
}

// Labels that are never closer than the label width: a whole-number multiple of the tick spacing.
function labelStride(tick, need) {
  const perWhole = tick.n === 1 ? tick.d : 0;
  if (!perWhole) return Math.max(1, need);
  for (let m = need; m <= perWhole; m += 1) if (perWhole % m === 0) return m;
  return Math.ceil(need / perWhole) * perWhole;
}

const SPEC = {
  title: (t) => t("Number line"),
  initial(cfg) {
    const task = cfg.task || "point";
    const count = cfg.count || { point: 1, jump: 1, compare: 2, order: 3 }[task] || 1;
    const min = asFrac(cfg.min ?? 0);
    const max = asFrac(cfg.max ?? 2);
    const tick = asFrac(cfg.tick ?? frac(1, 4));
    const snap = asFrac(cfg.snap ?? tick);
    const width = sub(max, min);
    const points = Array.from({ length: count }, (_, i) =>
      mul(
        frac(floorQ(add(min, div(mul(width, frac(i + 1, 1)), frac(count + 1, 1))), snap), 1),
        snap,
      ),
    );
    return (
      cfg.initial ?? {
        min,
        max,
        tick,
        snap,
        step: asFrac(cfg.step ?? tick),
        points: cfg.points ? cfg.points.map(asFrac) : points,
        jumps: [],
        labels: cfg.labels || "all",
        format: cfg.format || "fraction",
      }
    );
  },
  normalize: normalizeState,
  describe,
  evaluate,
  build(ctx) {
    const { t, cfg, controls } = ctx;
    const task = cfg.task || "point";
    const wanted =
      cfg.controls || (cfg.mode === "explore" ? ["zoom", "tick", "labels", "format"] : ["zoom"]);
    const useJumps = task === "jump";
    let last = 0;
    let geo = null;
    const slot = (key, node) => {
      node.dataset.ctl = key;
      return node;
    };
    const list = () => {
      const st = ctx.get();
      const all = [...TICKS];
      for (const f of [st.tick, st.step]) if (!all.some((x) => eq(x, f))) all.push(f);
      return all.sort(cmp).reverse();
    };
    const indexOf = (f) => list().findIndex((x) => eq(x, f));
    const maxIndex = () => {
      const st = ctx.get();
      const all = list();
      let best = 0;
      all.forEach((f, i) => ceilQ(sub(st.max, st.min), f) <= MAX_TICKS && (best = i));
      return best;
    };
    const tickStep = stepper(ctx, {
      id: "tick",
      label: t("Tick spacing"),
      min: 0,
      max: TICKS.length,
      format: (i) => ratText(list()[i] ?? ONE),
      onChange: (i) => ctx.set((st) => ({ ...st, tick: list()[i], snap: list()[i] })),
    });
    const stepStep = stepper(ctx, {
      id: "step",
      label: t("Jump size"),
      min: 0,
      max: TICKS.length,
      format: (i) => ratText(list()[i] ?? ONE),
      onChange: (i) => ctx.set((st) => ({ ...st, step: list()[i] })),
    });
    const swap = (fn) => () => {
      const next = fn(ctx.get());
      if (next) ctx.set((st) => ({ ...st, ...next }));
    };
    const zoomBtns = [
      button("zoom-in", t("Zoom in"), swap(zoomIn)),
      button("zoom-out", t("Zoom out"), swap(zoomOut)),
      button(
        "pan-left",
        t("Move left"),
        swap((st) => pan(st, -1)),
      ),
      button(
        "pan-right",
        t("Move right"),
        swap((st) => pan(st, 1)),
      ),
    ];
    const zoomRow = h(
      "div",
      { class: "ga-choice ga-wide", role: "group", "aria-label": t("Zoom and move") },
      zoomBtns,
    );
    const labelChoice = choice({
      id: "labels",
      label: t("Labels"),
      options: [
        { value: "all", text: t("All labels") },
        { value: "ends", text: t("Ends only") },
        { value: "none", text: t("No labels") },
      ],
      onChange: (labels) => ctx.set((st) => ({ ...st, labels })),
    });
    const formatChoice = choice({
      id: "format",
      label: t("Number style"),
      options: [
        { value: "fraction", text: t("Fractions") },
        { value: "mixed", text: t("Mixed") },
        { value: "decimal", text: t("Decimals") },
      ],
      onChange: (format) => ctx.set((st) => ({ ...st, format })),
    });
    const jumpRight = button("jump-right", t("Jump right"), () => addJump(1));
    const jumpLeft = button("jump-left", t("Jump left"), () => addJump(-1));
    const undo = button(
      "jump-undo",
      t("Undo jump"),
      () => ctx.set((st) => ({ ...st, jumps: st.jumps.slice(0, -1) })),
      { class: "ga-btn--quiet" },
    );
    const clear = button(
      "jump-clear",
      t("Clear jumps"),
      () => ctx.set((st) => ({ ...st, jumps: [] })),
      { class: "ga-btn--quiet" },
    );
    const jumpRow = h(
      "div",
      { class: "ga-choice ga-wide", role: "group", "aria-label": t("Jumps") },
      jumpLeft,
      jumpRight,
      undo,
      clear,
    );
    function addJump(sign) {
      const st = ctx.get();
      const jump = sign < 0 ? neg(st.step) : st.step;
      if (inRange(add(jumpEnd(st), jump), st.min, st.max) && st.jumps.length < 12)
        ctx.set({ ...st, jumps: [...st.jumps, jump] });
    }
    controls.append(
      ...(wanted.includes("zoom") ? [slot("zoom", zoomRow)] : []),
      ...(wanted.includes("tick") ? [slot("tick", tickStep.el)] : []),
      ...(wanted.includes("labels") ? [slot("labels", labelChoice.el)] : []),
      ...(wanted.includes("format") ? [slot("format", formatChoice.el)] : []),
      ...(useJumps ? [slot("jumps", jumpRow), slot("step", stepStep.el)] : []),
    );

    const moveTo = (index, value) => {
      const st = ctx.get();
      const { lo, hi } = index === 0 ? startBounds(st) : { lo: st.min, hi: st.max };
      const next = cmp(value, lo) < 0 ? lo : cmp(value, hi) > 0 ? hi : value;
      if (!eq(next, st.points[index]))
        ctx.set(
          { ...st, points: st.points.map((p, i) => (i === index ? next : p)) },
          { say: false },
        );
    };
    dragSurface(ctx.svg, {
      move(token, pt, _event, start) {
        if (!geo) return;
        const st = ctx.get();
        if (token === "axis" && start) {
          last = st.points.reduce(
            (best, p, i) =>
              Math.abs(geo.X(p) - pt.x) < Math.abs(geo.X(st.points[best]) - pt.x) ? i : best,
            0,
          );
        } else if (token !== "axis") last = Number(token.slice(2));
        const raw =
          toNumber(st.min) +
          ((pt.x - geo.x0) / (geo.x1 - geo.x0)) * (toNumber(st.max) - toNumber(st.min));
        const { lo, hi } = last === 0 ? startBounds(st) : { lo: st.min, hi: st.max };
        moveTo(last, snapValue(raw, st.snap, lo, hi));
      },
      end: () => ctx.say(),
    });
    const key = (event, index) => {
      const st = ctx.get();
      const bounds = index === 0 ? startBounds(st) : { lo: st.min, hi: st.max };
      const at = st.points[index];
      const delta = {
        ArrowRight: st.snap,
        ArrowUp: st.snap,
        ArrowLeft: neg(st.snap),
        ArrowDown: neg(st.snap),
        PageUp: ONE,
        PageDown: neg(ONE),
      }[event.key];
      let next = null;
      if (delta) next = add(at, delta);
      else if (event.key === "Home") next = bounds.lo;
      else if (event.key === "End") next = bounds.hi;
      if (!next) return;
      event.preventDefault();
      moveTo(
        index,
        cmp(next, bounds.lo) < 0 ? bounds.lo : cmp(next, bounds.hi) > 0 ? bounds.hi : next,
      );
      ctx.say();
    };
    const fmtEl = (f, format) =>
      format === "decimal" && decimalText(f)
        ? h("span", { class: "ga-int", text: decimalText(f) })
        : fracEl(f, { mixed: format === "mixed" });
    const eqRow = (...parts) =>
      h(
        "p",
        { class: "ga-eq" },
        parts.map((p) => (typeof p === "string" ? h("span", { class: "ga-op", text: p }) : p)),
      );

    return {
      render(state) {
        const { W } = ctx;
        const count = state.points.length;
        const lift = (i) => (count === 1 ? 0 : 30 + (i % 2) * 30);
        const arcs = state.jumps.length > 0;
        const axisY = (arcs ? 112 : 36) + (count > 1 ? 66 : 28);
        const H = axisY + 74;
        const x0 = 34;
        const x1 = W - 34;
        const spanF = toNumber(state.max) - toNumber(state.min);
        const X = (v) => x0 + ((toNumber(v) - toNumber(state.min)) / spanF) * (x1 - x0);
        geo = { x0, x1, X };
        const g = ctx.begin(H);
        const drawValue = (x, y, f) => {
          if (state.format === "decimal" && decimalText(f))
            text(g, x, y + 5, decimalText(f), { size: 14, weight: 600 });
          else svgFraction(g, x, y, f, { size: 14, mixed: state.format === "mixed" });
        };
        g.append(
          s("rect", {
            class: "ga-hit",
            x: 0,
            y: axisY - 40,
            width: W,
            height: 80,
            "data-drag": "axis",
          }),
        );
        g.append(s("line", { class: "ga-axis", x1: x0 - 14, x2: x1 + 14, y1: axisY, y2: axisY }));
        g.append(
          s("path", { class: "ga-arrow", d: `M${x0 - 18},${axisY} l9,-6 v12 Z` }),
          s("path", { class: "ga-arrow", d: `M${x1 + 18},${axisY} l-9,-6 v12 Z` }),
        );
        const pitch = ((x1 - x0) * toNumber(state.tick)) / spanF;
        const thin = Math.max(1, Math.ceil(5 / pitch));
        const need = Math.max(1, Math.ceil(52 / pitch));
        const stride = Math.ceil(labelStride(state.tick, need) / thin) * thin;
        for (const { k, value } of tickList(state.min, state.max, state.tick)) {
          if (k % thin !== 0) continue;
          const major = value.d === 1;
          g.append(
            s("line", {
              class: major ? "ga-tick ga-tick--major" : "ga-tick",
              x1: X(value),
              x2: X(value),
              y1: axisY - (major ? 9 : 5),
              y2: axisY + (major ? 16 : pitch < 8 ? 8 : 11),
            }),
          );
          if (state.labels === "all" && k % stride === 0) drawValue(X(value), axisY + 42, value);
        }
        if (state.labels === "ends") {
          for (const v of [state.min, state.max]) {
            g.append(
              s("line", {
                class: "ga-tick ga-tick--major",
                x1: X(v),
                x2: X(v),
                y1: axisY - 9,
                y2: axisY + 16,
              }),
            );
            drawValue(X(v), axisY + 42, v);
          }
        }
        if (arcs) {
          const stops = positions(state);
          state.jumps.forEach((j, i) => {
            const a = X(stops[i]);
            const b = X(stops[i + 1]);
            const y = axisY - 14;
            const apex = 24 + (i % 3) * 18;
            const mid = (a + b) / 2;
            // Unit tangent where the arc ends (control point is 2 * apex above the chord).
            const tx = b - mid;
            const ty = 2 * apex;
            const len = Math.hypot(tx, ty);
            const ux = tx / len;
            const uy = ty / len;
            const head = `M${b},${y} L${b - 11 * ux - 5.5 * uy},${y - 11 * uy + 5.5 * ux} L${b - 11 * ux + 5.5 * uy},${y - 11 * uy - 5.5 * ux} Z`;
            g.append(
              s("path", { class: "ga-jump", d: `M${a},${y} Q${mid},${y - 2 * apex} ${b},${y}` }),
              s("path", { class: "ga-jump-head", d: head }),
            );
            text(g, mid, y - apex - 7, `${j.n < 0 ? "\u2212" : "+"}${ratText(j.n < 0 ? neg(j) : j)}`, {
              size: 14,
              weight: 700,
              cls: "ga-jump-label",
            });
          });
          g.append(s("circle", { class: "ga-end", cx: X(stops.at(-1)), cy: axisY, r: 9 }));
        }
        state.points.forEach((p, i) => {
          const cx = X(p);
          const cy = axisY - lift(i);
          const handle = s(
            "g",
            {
              class: `ga-handle ga-pt ga-pt--${i}`,
              tabindex: "0",
              role: "slider",
              "data-fid": `pt-${i}`,
              "data-drag": `p:${i}`,
              "aria-label": t("Point {name}", { name: NAMES[i] }),
              "aria-valuemin": toNumber(state.min),
              "aria-valuemax": toNumber(state.max),
              "aria-valuenow": toNumber(p),
              "aria-valuetext": valueText(p, state.format),
            },
            lift(i) ? s("line", { class: "ga-stem", x1: cx, x2: cx, y1: cy, y2: axisY }) : null,
            s("circle", { class: "ga-ring", cx, cy, r: 24 }),
            s("circle", { class: "ga-hit", cx, cy, r: 24 }),
            s("circle", { class: "ga-dot", cx, cy, r: 14 }),
          );
          handle.append(
            s(
              "text",
              {
                class: "ga-text ga-dot-letter",
                x: cx,
                y: cy + 5,
                "text-anchor": "middle",
                "font-size": 15,
                "font-weight": 700,
              },
              document.createTextNode(count === 1 && !useJumps ? "●" : NAMES[i]),
            ),
          );
          handle.addEventListener("keydown", (event) => key(event, i));
          g.append(handle);
        });

        tickStep.set(Math.max(0, indexOf(state.tick)), maxIndex());
        stepStep.set(Math.max(0, indexOf(state.step)), list().length - 1);
        labelChoice.set(state.labels);
        formatChoice.set(state.format);
        setDisabled(zoomBtns[0], !zoomIn(state));
        setDisabled(zoomBtns[1], !zoomOut(state));
        setDisabled(zoomBtns[2], !pan(state, -1));
        setDisabled(zoomBtns[3], !pan(state, 1));
        setDisabled(
          jumpRight,
          !inRange(add(jumpEnd(state), state.step), state.min, state.max) ||
            state.jumps.length >= 12,
        );
        setDisabled(
          jumpLeft,
          !inRange(sub(jumpEnd(state), state.step), state.min, state.max) ||
            state.jumps.length >= 12,
        );
        setDisabled(undo, state.jumps.length === 0);
        setDisabled(clear, state.jumps.length === 0);

        const rows = [];
        if (useJumps || arcs) {
          const chain = [fmtEl(state.points[0], state.format)];
          for (const j of state.jumps)
            chain.push(j.n < 0 ? "−" : "+", fmtEl(j.n < 0 ? neg(j) : j, state.format));
          rows.push(eqRow(...chain, "=", fmtEl(jumpEnd(state), state.format)));
        } else {
          rows.push(
            eqRow(...state.points.flatMap((p, i) => [`${NAMES[i]} =`, fmtEl(p, state.format)])),
          );
          if (count >= 2) {
            const order = state.points
              .map((p, i) => ({ p, name: NAMES[i] }))
              .sort((a, b) => cmp(a.p, b.p) || a.name.localeCompare(b.name));
            const chain = [order[0].name];
            for (let i = 1; i < order.length; i += 1)
              chain.push(cmp(order[i - 1].p, order[i].p) === 0 ? "=" : "<", order[i].name);
            rows.push(eqRow(...chain));
          }
        }
        ctx.readout.replaceChildren(...rows);
      },
    };
  },
};

export function mount(container, config = {}) {
  return createComponent("number-line", container, config, SPEC);
}

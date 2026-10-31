// Fraction model: strips and circles, denominators 1-12, shade parts, compare two models, equivalent fractions,
// add and subtract on a common unit, mixed numbers and improper fractions. State is exact: a model is {n, d} =
// n shaded parts out of d equal parts in each whole (not reduced, because the partition IS the model).
import {
  add,
  asFrac,
  clamp,
  cmp,
  eq,
  frac,
  lcm,
  mixedText,
  must,
  ratText,
  sub,
} from "./graphics-a-core.js";
import {

  choice,
  createComponent,
  dragSurface,
  fracEl,
  h,
  s,
  sliderKey,
  stepper,
  text,
} from "./graphics-a-ui.js";

const MAX_D = 12;
const MAX_WHOLES = 3;
const MAX_PARTS = 60; // most equal pieces per whole that stay legible
const OPS = ["single", "compare", "add", "sub"];
const SHAPES = ["strip", "circle"];
let uid = 0;

export const partsValue = (m) => frac(m.n, m.d);
export const commonDenominator = (a, b) => lcm(a.d, b.d);
export const rescale = (n, oldD, newD) => Math.round((n * newD) / oldD);
export const usesB = (state) => state.operation !== "single";
export const maxSplit = (state) =>
  Math.min(12, Math.floor(MAX_PARTS / Math.max(state.a.d, usesB(state) ? state.b.d : 1)));

// The value the learner has built: A alone, or A plus/minus B (compare and single report A).
export function resultValue(state) {
  const a = partsValue(state.a);
  if (state.operation === "add") return add(a, partsValue(state.b));
  if (state.operation === "sub") return sub(a, partsValue(state.b));
  return a;
}
// A plus/minus B written on the common unit: {n, d} with d = lcm of the two denominators.
export function resultParts(state) {
  const c = commonDenominator(state.a, state.b);
  const an = state.a.n * (c / state.a.d);
  const bn = state.b.n * (c / state.b.d);
  return { n: state.operation === "sub" ? an - bn : an + bn, d: c };
}
export const compareValues = (state) => cmp(partsValue(state.a), partsValue(state.b));

export function evaluate(state, target, cfg = {}) {
  const goal = asFrac(target?.value ?? target);
  return (
    eq(resultValue(state), goal) && (cfg.denominator === undefined || state.a.d === cfg.denominator)
  );
}

function checkModel(m, wholes, maxD, name) {
  must(
    m && Number.isInteger(m.d) && m.d >= 1 && m.d <= maxD,
    `${name}.d must be an integer 1-${maxD}`,
  );
  must(
    Number.isInteger(m.n) && m.n >= 0 && m.n <= m.d * wholes,
    `${name}.n must be an integer 0-${m.d * wholes}`,
  );
  return { n: m.n, d: m.d };
}
export function normalizeState(input, cfg = {}) {
  const maxD = cfg.maxDenominator ?? MAX_D;
  must(SHAPES.includes(input?.shape), "shape must be strip or circle");
  must(OPS.includes(input.operation), "operation must be single, compare, add or sub");
  must(
    Number.isInteger(input.wholes) && input.wholes >= 1 && input.wholes <= MAX_WHOLES,
    "wholes must be 1-3",
  );
  const state = {
    shape: input.shape,
    operation: input.operation,
    wholes: input.wholes,
    a: checkModel(input.a, input.wholes, maxD, "a"),
    b: checkModel(input.b, input.wholes, maxD, "b"),
    split: input.split,
  };
  must(
    Number.isInteger(state.split) && state.split >= 1 && state.split <= maxSplit(state),
    "split out of range",
  );
  return state;
}

export function describe(state, t) {
  const shape = state.shape === "circle" ? t("Fraction circles") : t("Fraction strips");
  const value = (m) => {
    const f = partsValue(m);
    return f.d === 1 || Math.abs(f.n) < f.d ? ratText(f) : `${ratText(f)} = ${mixedText(f)}`;
  };
  const parts = [`${shape}, ${(state.wholes === 1 ? t("1 whole") : t("{n} wholes", { n: state.wholes }))}.`];
  parts.push(
    t("A: {n} of {d} equal parts shaded, {value}.", {
      n: state.a.n,
      d: state.a.d,
      value: value(state.a),
    }),
  );
  if (usesB(state))
    parts.push(
      t("B: {n} of {d} equal parts shaded, {value}.", {
        n: state.b.n,
        d: state.b.d,
        value: value(state.b),
      }),
    );
  if (state.operation === "compare") {
    const c = compareValues(state);
    parts.push(
      c === 0
        ? t("A and B are equal.")
        : c > 0
          ? t("A is greater than B.")
          : t("A is less than B."),
    );
  }
  if (state.operation === "add" || state.operation === "sub") {
    const r = resultValue(state);
    const c = commonDenominator(state.a, state.b);
    const word = state.operation === "add" ? t("A plus B") : t("A minus B");
    parts.push(
      t("{word} on a common unit of {c} equal parts is {value}.", {
        word,
        c,
        value: r.n < 0 ? t("less than zero") : value(resultParts(state)),
      }),
    );
  }
  if (state.split > 1 && !usesB(state)) {
    const k = state.split;
    parts.push(
      t("Each part is cut into {k} equal pieces, so {n}/{d} = {n2}/{d2}.", {
        k,
        n: state.a.n,
        d: state.a.d,
        n2: state.a.n * k,
        d2: state.a.d * k,
      }),
    );
  }
  return parts.join(" ");
}

// ---- geometry --------------------------------------------------------------------------------------------------
const wedge = (cx, cy, r, d, p) => {
  if (d === 1) return `M${cx - r},${cy} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0 Z`;
  const a0 = -Math.PI / 2 + (2 * Math.PI * p) / d;
  const a1 = -Math.PI / 2 + (2 * Math.PI * (p + 1)) / d;
  const pt = (a) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  return `M${cx},${cy} L${pt(a0)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${pt(a1)} Z`;
};
const wholeIndex = (n, d) => (n === 0 ? 0 : Math.ceil(n / d) - 1);

// Global boundary (0..d*wholes) nearest to a pointer position, for a model's geometry.
export function nearestBoundary(geo, pt) {
  const pitch = geo.bw + geo.gap;
  if (geo.shape === "strip") {
    const w = clamp(Math.floor((pt.x - geo.x) / pitch), 0, geo.wholes - 1);
    return w * geo.d + Math.round(clamp((pt.x - (geo.x + w * pitch)) / geo.bw, 0, 1) * geo.d);
  }
  const w = clamp(Math.round((pt.x - geo.x - geo.bw / 2) / pitch), 0, geo.wholes - 1);
  const turn = Math.atan2(pt.x - (geo.x + w * pitch + geo.bw / 2), -(pt.y - geo.cy));
  const frac01 = (((turn / (2 * Math.PI)) % 1) + 1) % 1;
  return w * geo.d + Math.round(frac01 * geo.d);
}
// The part under the pointer (0-based, global), for tap-to-shade.
export function partAt(geo, pt) {
  const pitch = geo.bw + geo.gap;
  if (geo.shape === "strip") {
    const w = clamp(Math.floor((pt.x - geo.x) / pitch), 0, geo.wholes - 1);
    return (
      w * geo.d + clamp(Math.floor(((pt.x - (geo.x + w * pitch)) / geo.bw) * geo.d), 0, geo.d - 1)
    );
  }
  const w = clamp(Math.round((pt.x - geo.x - geo.bw / 2) / pitch), 0, geo.wholes - 1);
  const turn = Math.atan2(pt.x - (geo.x + w * pitch + geo.bw / 2), -(pt.y - geo.cy));
  const frac01 = (((turn / (2 * Math.PI)) % 1) + 1) % 1;
  return w * geo.d + clamp(Math.floor(frac01 * geo.d), 0, geo.d - 1);
}

function layoutRow(o, W) {
  const labelW = 46;
  const pad = 12;
  const aw = W - 2 * pad - labelW;
  const gap = o.wholes > 3 ? 6 : 12;
  const cell = (aw - gap * (o.wholes - 1)) / o.wholes;
  const circle = o.shape === "circle";
  const r = circle ? clamp(Math.floor((cell - 8) / 2), 12, 64) : 0;
  const bw = circle ? 2 * r + 8 : cell;
  const h2 = circle ? 2 * r : 56;
  return { ...o, x: pad + labelW, gap, bw, r, h: h2, rowH: h2 + 34, cy: o.y + 17 + r };
}

function drawRow(g, geo, handlers) {
  const { x, y, bw, gap, wholes, d, n, fine, shape, r, h: height, cls, id, interactive } = geo;
  const top = y + 17;
  text(g, 30, top + height / 2 + 6, geo.label, { size: geo.label.length > 1 ? 15 : 18, weight: 700, cls: "ga-label" });
  for (let w = 0; w < wholes; w += 1) {
    const x0 = x + w * (bw + gap);
    const cx = x0 + bw / 2;
    for (let p = 0; p < d; p += 1) {
      const on = w * d + p < n;
      const shapeProps = { class: `ga-part ${on ? `ga-part--on ${cls}` : ""}` };
      if (shape === "strip")
        g.append(
          s("rect", {
            ...shapeProps,
            x: x0 + (p * bw) / d,
            y: top,
            width: bw / d,
            height,
            "data-part": w * d + p,
          }),
        );
      else
        g.append(
          s("path", { ...shapeProps, d: wedge(cx, top + r, r, d, p), "data-part": w * d + p }),
        );
    }
    const step = fine / d;
    for (let q = 1; q < fine; q += 1) {
      if (q % step === 0 || bw / fine < 3) continue;
      const line =
        shape === "strip"
          ? { x1: x0 + (q * bw) / fine, x2: x0 + (q * bw) / fine, y1: top, y2: top + height }
          : {
              x1: cx,
              y1: top + r,
              x2: cx + r * Math.sin((2 * Math.PI * q) / fine),
              y2: top + r - r * Math.cos((2 * Math.PI * q) / fine),
            };
      g.append(s("line", { ...line, class: "ga-fine" }));
    }
    g.append(
      shape === "strip"
        ? s("rect", { class: "ga-outline", x: x0, y: top, width: bw, height })
        : s("circle", { class: "ga-outline", cx, cy: top + r, r }),
    );
    if (interactive) {
      g.append(
        shape === "strip"
          ? s("rect", {
              class: "ga-hit",
              x: x0,
              y: top,
              width: bw,
              height,
              "data-drag": `${id}:bar`,
            })
          : s("circle", { class: "ga-hit", cx, cy: top + r, r, "data-drag": `${id}:bar` }),
      );
    }
  }
  if (interactive) handlers.handle(g, geo, top);
}

// ---- component -------------------------------------------------------------------------------------------------
const SPEC = {
  title: (t) => t("Fraction model"),
  initial(cfg) {
    const d = cfg.denominator || 4;
    const base = {
      shape: cfg.shape || "strip",
      operation: cfg.operation || "single",
      wholes: cfg.wholes || 1,
      split: 1,
    };
    const explore = cfg.mode === "explore";
    return (
      cfg.initial ?? {
        ...base,
        a: { n: explore ? 3 : 0, d: explore ? 4 : d },
        b: { n: explore ? 1 : 0, d: explore ? 2 : d },
      }
    );
  },
  normalize: normalizeState,
  describe,
  evaluate,
  build(ctx) {
    const { t, cfg, controls } = ctx;
    const id = `fm${(uid += 1)}`;
    const geos = {};
    const maxD = cfg.maxDenominator ?? MAX_D;
    const ops = cfg.operations || (cfg.mode === "check" ? [cfg.operation || "single"] : OPS);
    const shapes = cfg.shapes || SHAPES;
    const slot = (key, node) => {
      node.dataset.ctl = key;
      return node;
    };
    const fit = (state) => ({ ...state, split: Math.min(state.split, maxSplit(state)) });
    const setModel = (key, patch) => ctx.set((st) => fit({ ...st, [key]: patch(st[key], st) }));
    const names = {
      single: t("One model"),
      compare: t("Compare"),
      add: t("Add"),
      sub: t("Subtract"),
    };
    const opChoice = choice({
      id: "op",
      label: t("What to do"),
      options: ops.map((o) => ({ value: o, text: names[o] })),
      onChange: (op) => ctx.set((st) => fit({ ...st, operation: op })),
    });
    const shapeChoice = choice({
      id: "shape",
      label: t("Shape"),
      options: shapes.map((v) => ({ value: v, text: v === "strip" ? t("Strip") : t("Circle") })),
      onChange: (shape) => ctx.set((st) => ({ ...st, shape })),
    });
    const wholes = stepper(ctx, {
      id: "wholes",
      label: t("Wholes"),
      min: 1,
      max: cfg.maxWholes ?? MAX_WHOLES,
      onChange: (w) =>
        ctx.set((st) => ({
          ...st,
          wholes: w,
          a: { ...st.a, n: Math.min(st.a.n, st.a.d * w) },
          b: { ...st.b, n: Math.min(st.b.n, st.b.d * w) },
        })),
    });
    const lock = cfg.lockDenominators || cfg.mode === "check";
    const modelSteppers = ["a", "b"].map((key) => {
      const name = key.toUpperCase();
      const parts = stepper(ctx, {
        id: `${key}-parts`,
        label: t("{name} equal parts", { name }),
        min: 1,
        max: maxD,
        onChange: (d) =>
          setModel(key, (m, st) => ({ d, n: clamp(rescale(m.n, m.d, d), 0, d * st.wholes) })),
      });
      const shaded = stepper(ctx, {
        id: `${key}-shaded`,
        label: t("{name} shaded", { name }),
        min: 0,
        max: 1,
        onChange: (n) => setModel(key, (m) => ({ ...m, n })),
      });
      return { key, parts, shaded };
    });
    const split = stepper(ctx, {
      id: "split",
      label: t("Pieces per part"),
      min: 1,
      max: 12,
      onChange: (k) => ctx.set((st) => ({ ...st, split: k })),
    });
    controls.append(
      slot("op", opChoice.el),
      slot("shape", shapeChoice.el),
      slot("wholes", wholes.el),
      slot("split", split.el),
      ...modelSteppers.flatMap(({ key, parts, shaded }) => [
        slot(`${key}-parts`, parts.el),
        slot(`${key}-shaded`, shaded.el),
      ]),
    );
    const find = (key) => [...controls.querySelectorAll(`[data-ctl="${key}"]`)];
    const show = (key, on) => find(key).forEach((n) => n.toggleAttribute("hidden", !on));
    // Keyboard and pointer slider for one model's shaded boundary.
    const handlers = {
      handle(g, geo, top) {
        const st = ctx.get();
        const key = geo.id;
        const wi = wholeIndex(geo.n, geo.d);
        const local = geo.n - wi * geo.d;
        const hx =
          geo.shape === "strip"
            ? geo.x + wi * (geo.bw + geo.gap) + (local / geo.d) * geo.bw
            : geo.x +
              wi * (geo.bw + geo.gap) +
              geo.bw / 2 +
              geo.r * Math.sin((2 * Math.PI * local) / geo.d);
        const hy =
          geo.shape === "strip"
            ? top + geo.h / 2
            : top + geo.r - geo.r * Math.cos((2 * Math.PI * local) / geo.d);
        const value = partsValue(geo);
        const node = s(
          "g",
          {
            class: "ga-handle",
            tabindex: "0",
            role: "slider",
            "data-fid": `${key}-handle`,
            "data-drag": `${key}:handle`,
            "aria-label": t("{name} shaded parts", { name: geo.label }),
            "aria-valuemin": 0,
            "aria-valuemax": geo.d * st.wholes,
            "aria-valuenow": geo.n,
            "aria-valuetext": t("{n} of {d} parts shaded, {value}", {
              n: geo.n,
              d: geo.d,
              value: mixedText(value),
            }),
          },
          s("circle", { class: "ga-ring", cx: hx, cy: hy, r: 22 }),
          s("rect", { class: "ga-hit", x: hx - 22, y: hy - 22, width: 44, height: 44 }),
          geo.shape === "strip"
            ? s("rect", {
                class: "ga-grip",
                x: hx - 5,
                y: top - 8,
                width: 10,
                height: geo.h + 16,
                rx: 5,
              })
            : s("circle", { class: "ga-grip", cx: hx, cy: hy, r: 9 }),
        );
        node.addEventListener("keydown", (event) => {
          const next = sliderKey(event, {
            value: geo.n,
            min: 0,
            max: geo.d * st.wholes,
            step: 1,
            big: geo.d,
          });
          if (next !== null && next !== geo.n) setModel(key, (m) => ({ ...m, n: next }));
        });
        g.append(node);
      },
    };
    dragSurface(ctx.svg, {
      move(token, pt, _event, start) {
        const [key, kind] = token.split(":");
        const geo = geos[key];
        const m = ctx.get()[key];
        if (!geo) return;
        let n = nearestBoundary(geo, pt);
        if (kind === "bar" && start) {
          const target = partAt(geo, pt) + 1;
          n = m.n === target ? target - 1 : target;
        }
        n = clamp(n, 0, m.d * ctx.get().wholes);
        if (n !== m.n) ctx.set((st) => ({ ...st, [key]: { ...st[key], n } }), { say: false });
      },
      end: () => ctx.say(),
    });
    const eqRow = (...parts) =>
      h(
        "p",
        { class: "ga-eq" },
        parts.map((p) => (typeof p === "string" ? h("span", { class: "ga-op", text: p }) : p)),
      );
    const full = (f, { simplify = false } = {}) => {
      const reduced = frac(f.n, f.d);
      const out = [fracEl(f)];
      if (simplify && reduced.d !== f.d && f.d !== 1) out.push("=", fracEl(reduced));
      if (reduced.d > 1 && Math.abs(reduced.n) >= reduced.d)
        out.push("=", fracEl(reduced, { mixed: true }));
      return out;
    };

    return {
      render(state) {
        const { W } = ctx;
        const two = usesB(state);
        const common = two ? commonDenominator(state.a, state.b) : 0;
        const rows = [
          {
            id: "a",
            label: "A",
            model: state.a,
            cls: "ga-fill-a",
            fine: two && state.operation !== "compare" ? common : state.a.d * state.split,
            interactive: true,
          },
        ];
        if (two)
          rows.push({
            id: "b",
            label: "B",
            model: state.b,
            cls: "ga-fill-b",
            fine: state.operation !== "compare" ? common : state.b.d,
            interactive: true,
          });
        const value = resultValue(state);
        const showResult = (state.operation === "add" || state.operation === "sub") && value.n >= 0;
        if (showResult)
          rows.push({
            id: "r",
            label: state.operation === "add" ? "A+B" : "A−B",
            model: resultParts(state),
            cls: "ga-fill-r",
            fine: common,
            interactive: false,
          });
        let y = 4;
        const laid = rows.map((row) => {
          const wholes =
            row.id === "r" ? Math.max(1, Math.ceil(row.model.n / row.model.d)) : state.wholes;
          const geo = layoutRow({ ...row, ...row.model, wholes, shape: state.shape, y }, W);
          y += geo.rowH;
          geos[row.id] = geo;
          return geo;
        });
        const g = ctx.begin(y + 4);
        const defs = s(
          "defs",
          {},
          s(
            "pattern",
            {
              id: `${id}-hatch`,
              width: 8,
              height: 8,
              patternUnits: "userSpaceOnUse",
              patternTransform: "rotate(45)",
            },
            s("rect", { width: 8, height: 8, class: "ga-hatch-bg" }),
            s("line", { x1: 0, y1: 0, x2: 0, y2: 8, class: "ga-hatch-line" }),
          ),
        );
        g.append(defs);
        g.style.setProperty("--ga-hatch", `url(#${id}-hatch)`);
        for (const geo of laid) drawRow(g, geo, handlers);

        wholes.set(state.wholes);
        for (const { key, parts, shaded } of modelSteppers) {
          const m = state[key];
          parts.set(m.d);
          shaded.set(m.n, m.d * state.wholes);
        }
        split.set(state.split, maxSplit(state));
        opChoice.set(state.operation);
        shapeChoice.set(state.shape);
        show("op", ops.length > 1);
        show("shape", shapes.length > 1);
        show("wholes", (cfg.maxWholes ?? MAX_WHOLES) > 1);
        show("split", state.operation === "single" && maxSplit(state) > 1);
        show("a-parts", !lock);
        show("b-parts", two && !lock);
        show("a-shaded", true);
        show("b-shaded", two);

        const lines = [];
        if (state.operation === "single") {
          lines.push(
            eqRow(
              "A =",
              ...full(state.a, { simplify: true }),
              ...(state.split > 1
                ? ["=", fracEl({ n: state.a.n * state.split, d: state.a.d * state.split })]
                : []),
            ),
          );
        } else if (state.operation === "compare") {
          const c = compareValues(state);
          lines.push(eqRow(...full(state.a), c === 0 ? "=" : c > 0 ? ">" : "<", ...full(state.b)));
        } else {
          lines.push(
            eqRow(
              fracEl(state.a),
              state.operation === "add" ? "+" : "−",
              fracEl(state.b),
              "=",
              ...(value.n < 0 ? ["< 0"] : full(resultParts(state))),
            ),
          );
        }
        ctx.readout.replaceChildren(...lines);
      },
    };
  },
};

export function mount(container, config = {}) {
  return createComponent("fraction-model", container, config, SPEC);
}

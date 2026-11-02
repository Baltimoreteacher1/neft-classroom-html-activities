// Multiplication arrays: rows x columns up to 12 x 12 (drag the edges or use the steppers), skip-count
// highlighting, splitting into two groups (the distributive property), the array <-> area link, and division as
// equal sharing with a remainder. State is plain integers: { rows, cols, skip, split, view, shares }.
import { clamp, must } from "./graphics-a-core.js";
import {
  choice,
  createComponent,
  dragSurface,
  h,
  s,
  sliderKey,
  stepper,
  text,
} from "./graphics-a-ui.js";

const MAX = 12;
const VIEWS = ["array", "area", "share"];

export const product = (state) => state.rows * state.cols;
// Multiples of k up to the product: what skip counting by k says as it walks the array.
export const skipCounts = (state) => {
  const out = [];
  if (state.skip < 1) return out;
  for (let n = state.skip; n <= product(state); n += state.skip) out.push(n);
  return out;
};
export const splitProducts = (state) =>
  state.split > 0 ? [state.rows * state.split, state.rows * (state.cols - state.split)] : null;
export const shareResult = (state) => ({
  quotient: Math.floor(product(state) / state.shares),
  remainder: product(state) % state.shares,
});

export function normalizeState(input) {
  must(VIEWS.includes(input?.view), "view must be array, area or share");
  for (const key of ["rows", "cols", "shares"])
    must(
      Number.isInteger(input[key]) && input[key] >= 1 && input[key] <= MAX,
      `${key} must be an integer 1-${MAX}`,
    );
  must(
    Number.isInteger(input.skip) && input.skip >= 0 && input.skip <= MAX,
    "skip must be an integer 0-12",
  );
  must(
    Number.isInteger(input.split) && input.split >= 0 && input.split < input.cols,
    "split must be 0 (none) or a column boundary",
  );
  return {
    rows: input.rows,
    cols: input.cols,
    skip: input.skip,
    split: input.split,
    view: input.view,
    shares: input.shares,
  };
}

export function evaluate(state, target) {
  if (typeof target === "number") return product(state) === target;
  if (target?.split)
    return (
      state.split > 0 &&
      (state.split === target.split[0] || state.split === target.split[1]) &&
      target.split[0] + target.split[1] === state.cols
    );
  if (target?.quotient !== undefined) {
    const result = shareResult(state);
    return result.quotient === target.quotient && result.remainder === (target.remainder ?? 0);
  }
  return (
    (state.rows === target.rows && state.cols === target.cols) ||
    (state.rows === target.cols && state.cols === target.rows)
  );
}

export function describe(state, t) {
  const n = product(state);
  if (state.view === "share") {
    const { quotient, remainder } = shareResult(state);
    return t("Equal sharing. Items: {n}. Groups: {k}. Each group gets {q}. Left over: {r}.", {
      n,
      k: state.shares,
      q: quotient,
      r: remainder,
    });
  }
  const parts = [
    state.view === "area"
      ? t("Area model. Height: {r} units. Width: {c} units. Area: {n} square units.", {
          r: state.rows,
          c: state.cols,
          n,
        })
      : t("Array. Rows: {r}. Columns: {c}. Total: {n}.", {
          r: state.rows,
          c: state.cols,
          n,
        }),
  ];
  const counts = skipCounts(state);
  if (counts.length && state.view === "array")
    parts.push(
      t("Skip counting by {k}: {list}.", {
        k: state.skip,
        m: counts.length,
        list: counts.length > 8 ? `${counts.slice(0, 8).join(", ")}...` : counts.join(", "),
      }),
    );
  const split = splitProducts(state);
  if (split)
    parts.push(
      t("Split after column {c}: {r} × {c1} + {r} × {c2} = {a} + {b} = {n}.", {
        c: state.split,
        a: split[0],
        b: split[1],
        r: state.rows,
        c1: state.split,
        c2: state.cols - state.split,
        n,
      }),
    );
  return parts.join(" ");
}

const SPEC = {
  title: (t) => t("Array model"),
  initial(cfg) {
    const explore = cfg.mode === "explore";
    return (
      cfg.initial ?? {
        rows: cfg.rows ?? (explore ? 3 : 1),
        cols: cfg.cols ?? (explore ? 4 : 1),
        skip: 0,
        split: 0,
        view: cfg.view || "array",
        shares: cfg.shares ?? cfg.rows ?? 3,
      }
    );
  },
  normalize: normalizeState,
  describe,
  evaluate,
  build(ctx) {
    const { t, cfg, controls } = ctx;
    const lock = Boolean(cfg.lockDimensions);
    let geo = { left: 0, top: 0, cell: 24 };
    const patch = (p) => ctx.set((st) => ({ ...st, ...p }));
    const fitSplit = (st) => (st.split >= st.cols ? { ...st, split: 0 } : st);
    const views = cfg.views || VIEWS;
    const viewChoice = choice({
      id: "view",
      label: t("View"),
      options: views.map((v) => ({
        value: v,
        text: { array: t("Array"), area: t("Area"), share: t("Share equally") }[v],
      })),
      onChange: (view) => patch({ view }),
    });
    const rowsStep = stepper(ctx, {
      id: "rows",
      label: t("Rows"),
      min: 1,
      max: MAX,
      onChange: (rows) => patch({ rows }),
    });
    const colsStep = stepper(ctx, {
      id: "cols",
      label: t("Columns"),
      min: 1,
      max: MAX,
      onChange: (cols) => ctx.set((st) => fitSplit({ ...st, cols })),
    });
    const skipStep = stepper(ctx, {
      id: "skip",
      label: t("Skip count by"),
      min: 0,
      max: MAX,
      format: (v) => (v === 0 ? t("off") : String(v)),
      onChange: (skip) => patch({ skip }),
    });
    const splitStep = stepper(ctx, {
      id: "split",
      label: t("Split after column"),
      min: 0,
      max: MAX - 1,
      format: (v) => (v === 0 ? t("none") : String(v)),
      onChange: (split) => patch({ split }),
    });
    const sharesStep = stepper(ctx, {
      id: "shares",
      label: t("Groups"),
      min: 1,
      max: MAX,
      onChange: (shares) => patch({ shares }),
    });
    const slots = {
      view: viewChoice.el,
      rows: rowsStep.el,
      cols: colsStep.el,
      skip: skipStep.el,
      split: splitStep.el,
      shares: sharesStep.el,
    };
    for (const [key, node] of Object.entries(slots)) node.dataset.ctl = key;
    controls.append(
      ...(views.length > 1 ? [slots.view] : []),
      ...(lock ? [] : [slots.rows, slots.cols]),
      slots.skip,
      slots.split,
      slots.shares,
    );
    const show = (key, on) => slots[key].toggleAttribute("hidden", !on);

    dragSurface(ctx.svg, {
      move(token, pt) {
        const st = ctx.get();
        const c = clamp(Math.round((pt.x - geo.left) / geo.cell), 1, MAX);
        const r = clamp(Math.round((pt.y - geo.top) / geo.cell), 1, MAX);
        if (token === "split") {
          const split = clamp(Math.round((pt.x - geo.left) / geo.cell), 1, st.cols - 1);
          if (split !== st.split) ctx.set({ ...st, split }, { say: false });
          return;
        }
        if (lock) return;
        const next = {
          ...st,
          ...(token !== "rows" ? { cols: c } : {}),
          ...(token !== "cols" ? { rows: r } : {}),
        };
        if (next.rows !== st.rows || next.cols !== st.cols) ctx.set(fitSplit(next), { say: false });
      },
      end: () => ctx.say(),
    });
    const handleKey = (key, min, max) => (event) => {
      const st = ctx.get();
      const next = sliderKey(event, { value: st[key], min, max, step: 1, big: 3 });
      if (next !== null && next !== st[key]) {
        ctx.set(fitSplit({ ...st, [key]: next }));
      }
    };
    const grip = (token, label, value, min, max, x, y, w, h2, onKey, vertical) => {
      const node = s("g", {
        class: `ga-handle ga-handle--${token}`,
        tabindex: "0",
        role: "slider",
        "data-fid": `h-${token}`,
        "data-drag": token,
        "aria-label": label,
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": value,
        "aria-orientation": vertical ? "vertical" : "horizontal",
      });
      node.append(
        s("rect", {
          class: "ga-ring",
          x: x - w / 2 - 4,
          y: y - h2 / 2 - 4,
          width: w + 8,
          height: h2 + 8,
          rx: 8,
        }),
        s("rect", {
          class: "ga-hit",
          x: x - Math.max(w, 44) / 2,
          y: y - Math.max(h2, 44) / 2,
          width: Math.max(w, 44),
          height: Math.max(h2, 44),
        }),
        s("rect", { class: "ga-grip", x: x - w / 2, y: y - h2 / 2, width: w, height: h2, rx: 5 }),
      );
      node.addEventListener("keydown", onKey);
      return node;
    };
    const eqRow = (...parts) =>
      h(
        "p",
        { class: "ga-eq" },
        parts.map((p) => h("span", { class: /^[0-9]+$/.test(p) ? "" : "ga-op", text: p })),
      );

    function drawShare(g, state, W) {
      const { quotient, remainder } = shareResult(state);
      const pad = 8;
      const per =
        state.shares <= 3
          ? state.shares
          : state.shares <= 8
            ? Math.ceil(state.shares / 2)
            : Math.ceil(state.shares / 3);
      const gap = 10;
      const bw = (W - 2 * pad - gap * (per - 1)) / per;
      const bh = Math.max(70, Math.min(bw, 150));
      const pitch = clamp(
        Math.floor(Math.sqrt(((bw - 12) * (bh - 12)) / Math.max(1, quotient))),
        7,
        20,
      );
      const across = Math.max(1, Math.floor((bw - 12) / pitch));
      const rowsOfBins = Math.ceil(state.shares / per);
      for (let b = 0; b < state.shares; b += 1) {
        const x = pad + (b % per) * (bw + gap);
        const y = pad + Math.floor(b / per) * (bh + gap + 22);
        g.append(s("rect", { class: "ga-bin", x, y, width: bw, height: bh, rx: 10 }));
        for (let i = 0; i < quotient; i += 1)
          g.append(
            s("circle", {
              class: "ga-item",
              cx: x + 8 + pitch / 2 + (i % across) * pitch,
              cy: y + 8 + pitch / 2 + Math.floor(i / across) * pitch,
              r: pitch * 0.36,
            }),
          );
        text(g, x + bw / 2, y + bh + 17, quotient, { size: 14, weight: 700 });
      }
      let y = pad + rowsOfBins * (bh + gap + 22);
      if (remainder) {
        g.append(
          s("rect", {
            class: "ga-bin ga-bin--left",
            x: pad,
            y,
            width: W - 2 * pad,
            height: 44,
            rx: 10,
          }),
        );
        for (let i = 0; i < remainder; i += 1)
          g.append(
            s("circle", {
              class: "ga-item ga-item--left",
              cx: pad + 20 + i * 22,
              cy: y + 22,
              r: 8,
            }),
          );
        text(g, W - pad - 10, y + 27, t("left over"), { size: 14, weight: 700, anchor: "end" });
        y += 52;
      }
      return y + 4;
    }

    return {
      render(state) {
        const { W } = ctx;
        const share = state.view === "share";
        const area = state.view === "area";
        const cell = clamp(Math.floor((W - 68) / MAX), 14, 40);
        const left = Math.max(40, Math.floor((W - MAX * cell) / 2));
        const shown = Math.min(MAX, state.rows + 2);
        const top = 14;
        geo = { left, top, cell };
        let H;
        let g;
        if (share) {
          const probe = ctx.begin(10);
          probe.replaceChildren();
          H = drawShare(probe, state, W);
          g = ctx.begin(H);
          drawShare(g, state, W);
        } else {
          H = top + shown * cell + 54;
          g = ctx.begin(H);
          for (let r = 0; r <= shown; r += 1)
            for (let c = 0; c <= MAX; c += 1) g.append(s("circle", { class: "ga-paper-dot", cx: left + c * cell, cy: top + r * cell, r: 1.6 }));
          const counts = new Set(skipCounts(state));
          const right = left + state.cols * cell;
          const bottom = top + state.rows * cell;
          if (area) {
            g.append(
              s("rect", {
                class: "ga-area",
                x: left,
                y: top,
                width: state.cols * cell,
                height: state.rows * cell,
              }),
            );
            for (let c = 1; c < state.cols; c += 1)
              g.append(
                s("line", {
                  class: "ga-area-line",
                  x1: left + c * cell,
                  x2: left + c * cell,
                  y1: top,
                  y2: bottom,
                }),
              );
            for (let r = 1; r < state.rows; r += 1)
              g.append(
                s("line", {
                  class: "ga-area-line",
                  x1: left,
                  x2: right,
                  y1: top + r * cell,
                  y2: top + r * cell,
                }),
              );
            if (state.split > 0)
              g.append(
                s("rect", {
                  class: "ga-area ga-area--b",
                  x: left + state.split * cell,
                  y: top,
                  width: (state.cols - state.split) * cell,
                  height: state.rows * cell,
                }),
              );
          } else {
            for (let r = 0; r < state.rows; r += 1) {
              for (let c = 0; c < state.cols; c += 1) {
                const n = r * state.cols + c + 1;
                const hit = counts.has(n);
                const cx = left + c * cell + cell / 2;
                const cy = top + r * cell + cell / 2;
                const second = state.split > 0 && c >= state.split;
                const radius = cell * (hit ? 0.46 : 0.34);
                g.append(
                  second
                    ? s("rect", {
                        class: `ga-item ga-item--b ${hit ? "ga-item--hit" : ""}`,
                        x: cx - radius,
                        y: cy - radius,
                        width: 2 * radius,
                        height: 2 * radius,
                        rx: 3,
                      })
                    : s("circle", {
                        class: `ga-item ${hit ? "ga-item--hit" : ""}`,
                        cx,
                        cy,
                        r: radius,
                      }),
                );
                if (hit && cell >= 22 && n < 100)
                  text(g, cx, cy + 4, n, { size: 11, weight: 700, cls: "ga-item-num" });
              }
            }
          }
          if (state.split > 0) {
            g.append(
              grip(
                "split",
                t("Split after column"),
                state.split,
                1,
                state.cols - 1,
                left + state.split * cell,
                top + (state.rows * cell) / 2,
                8,
                Math.max(24, state.rows * cell + 12),
                handleKey("split", 1, state.cols - 1),
                true,
              ),
            );
          }
          if (!lock) {
            g.append(
              grip(
                "cols",
                t("Columns"),
                state.cols,
                1,
                MAX,
                right,
                top + bottom / 2 - top / 2,
                8,
                Math.min(44, Math.max(28, state.rows * cell)),
                handleKey("cols", 1, MAX),
                true,
              ),
            );
            g.append(
              grip(
                "rows",
                t("Rows"),
                state.rows,
                1,
                MAX,
                left + (state.cols * cell) / 2,
                bottom,
                Math.min(44, Math.max(28, state.cols * cell)),
                8,
                handleKey("rows", 1, MAX),
                false,
              ),
            );
            g.append(
              s("circle", {
                class: "ga-corner",
                cx: right,
                cy: bottom,
                r: 9,
                "data-drag": "corner",
              }),
              s("circle", { class: "ga-hit", cx: right, cy: bottom, r: 22, "data-drag": "corner" }),
            );
          }
          text(g, left + (state.cols * cell) / 2, bottom + 34, state.cols, {
            size: 16,
            weight: 700,
            cls: "ga-label",
          });
          text(g, left - 20, top + (state.rows * cell) / 2 + 6, state.rows, {
            size: 16,
            weight: 700,
            cls: "ga-label",
          });
        }
        viewChoice.set(state.view);
        rowsStep.set(state.rows);
        colsStep.set(state.cols);
        skipStep.set(state.skip);
        splitStep.set(state.split, state.cols - 1);
        sharesStep.set(state.shares);
        show("skip", state.view === "array");
        show("split", !share);
        show("shares", share);
        const n = product(state);
        const rows = [];
        if (share) {
          const { quotient, remainder } = shareResult(state);
          rows.push(
            eqRow(
              `${n}`,
              "÷",
              `${state.shares}`,
              "=",
              `${quotient}`,
              ...(remainder ? ["R", `${remainder}`] : []),
            ),
          );
          rows.push(
            eqRow(
              `${state.shares}`,
              "×",
              `${quotient}`,
              ...(remainder ? ["+", `${remainder}`] : []),
              "=",
              `${n}`,
            ),
          );
        } else {
          rows.push(
            eqRow(
              `${state.rows}`,
              "×",
              `${state.cols}`,
              "=",
              `${n}`,
              ...(area ? [t("square units")] : []),
            ),
          );
          const split = splitProducts(state);
          if (split)
            rows.push(
              eqRow(
                `${state.rows}`,
                "×",
                `${state.split}`,
                "+",
                `${state.rows}`,
                "×",
                `${state.cols - state.split}`,
                "=",
                `${split[0]}`,
                "+",
                `${split[1]}`,
                "=",
                `${n}`,
              ),
            );
          if (!area) rows.push(eqRow(`${n}`, "÷", `${state.cols}`, "=", `${state.rows}`));
          const counts = skipCounts(state);
          if (counts.length && state.view === "array")
            rows.push(
              h("p", {
                class: "ga-expanded",
                text:
                  counts.length > 12 ? `${counts.slice(0, 12).join(", ")}...` : counts.join(", "),
              }),
            );
        }
        ctx.readout.replaceChildren(...rows);
      },
    };
  },
};

export function mount(container, config = {}) {
  return createComponent("array", container, config, SPEC);
}

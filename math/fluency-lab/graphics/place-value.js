// Place value: base-ten blocks (units, rods, flats, cubes) with a place-value chart through thousandths. Add and
// remove blocks, regroup (10 of one place for 1 of the next, and back) with buttons, by dragging a column to its
// neighbour, or from the keyboard. Whole-number mode runs thousands to ones; decimal mode treats the flat as one
// whole, so the chart runs tens to thousandths. A value is always an exact rational.
import {
  add,
  asFrac,
  clamp,
  decimalText,
  eq,
  frac,
  mul,
  must,
  ratText,
} from "./graphics-a-core.js";
import { button, choice, createComponent, dragSurface, h, s, text } from "./graphics-a-ui.js";

const MAX_COUNT = 18;
const MODES = ["whole", "decimal"];
export const placesFor = (mode) => (mode === "decimal" ? [1, 0, -1, -2, -3] : [3, 2, 1, 0]);
export const placeValue = (exp) => (exp >= 0 ? frac(10 ** exp, 1) : frac(1, 10 ** -exp));
const BLOCK_OF = {
  whole: { 3: "cube", 2: "flat", 1: "rod", 0: "unit" },
  decimal: { 1: "cube", 0: "flat", "-1": "rod", "-2": "unit", "-3": "tiny" },
};

export const valueOf = (state) =>
  placesFor(state.mode).reduce(
    (total, exp) => add(total, mul(frac(state.counts[exp], 1), placeValue(exp))),
    frac(0, 1),
  );
export const standardForm = (state) => placesFor(state.mode).every((exp) => state.counts[exp] <= 9);
// Trade 10 of one place for 1 of the next place to the left. Returns the new state, or null if not possible.
export function regroupUp(state, exp) {
  const places = placesFor(state.mode);
  if (!places.includes(exp + 1) || state.counts[exp] < 10 || state.counts[exp + 1] + 1 > MAX_COUNT)
    return null;
  return {
    ...state,
    counts: {
      ...state.counts,
      [exp]: state.counts[exp] - 10,
      [exp + 1]: state.counts[exp + 1] + 1,
    },
  };
}
// Break 1 of a place into 10 of the next place to the right.
export function regroupDown(state, exp) {
  const places = placesFor(state.mode);
  if (!places.includes(exp - 1) || state.counts[exp] < 1 || state.counts[exp - 1] + 10 > MAX_COUNT)
    return null;
  return {
    ...state,
    counts: {
      ...state.counts,
      [exp]: state.counts[exp] - 1,
      [exp - 1]: state.counts[exp - 1] + 10,
    },
  };
}
// Carry every place upward until all counts are 0-9 (the standard form of the same value).
export function standardize(state) {
  let next = state;
  for (const exp of [...placesFor(state.mode)].reverse()) {
    while (next.counts[exp] >= 10) {
      const up = regroupUp(next, exp);
      if (!up) break;
      next = up;
    }
  }
  return next;
}
export const expandedTerms = (state) =>
  placesFor(state.mode)
    .filter((exp) => state.counts[exp] > 0)
    .map((exp) => ({ exp, count: state.counts[exp], unit: placeValue(exp) }));

export function normalizeState(input) {
  must(MODES.includes(input?.mode), "mode must be whole or decimal");
  const counts = {};
  for (const exp of placesFor(input.mode)) {
    const n = input.counts?.[exp];
    must(
      Number.isInteger(n) && n >= 0 && n <= MAX_COUNT,
      `count for place ${exp} must be an integer 0-${MAX_COUNT}`,
    );
    counts[exp] = n;
  }
  must(
    Object.keys(input.counts).length === Object.keys(counts).length,
    "counts has a place that mode does not use",
  );
  return { mode: input.mode, counts };
}
export function evaluate(state, target, cfg = {}) {
  return (
    eq(valueOf(state), asFrac(target?.value ?? target)) &&
    (cfg.allowUnregrouped || standardForm(state))
  );
}

// Two-line headers for narrow columns (the long decimal place names).
const narrowName = (t, exp) => (exp === -2 ? t("Hundred-|ths") : exp === -3 ? t("Thousand-|ths") : null);
const placeName = (t, mode, exp) =>
  ({
    3: t("Thousands"),
    2: t("Hundreds"),
    1: t("Tens"),
    0: t("Ones"),
    "-1": t("Tenths"),
    "-2": t("Hundredths"),
    "-3": t("Thousandths"),
  })[exp] ?? String(exp);
const blockName = (t, mode, exp) =>
  ({
    cube: t("big cube"),
    flat: t("flat"),
    rod: t("rod"),
    unit: mode === "decimal" ? t("small cube") : t("unit cube"),
    tiny: t("tiny dot"),
  })[BLOCK_OF[mode][exp]];
const valueLabel = (exp) => (exp >= 0 ? String(10 ** exp) : `0.${"0".repeat(-exp - 1)}1`);

export function describe(state, t) {
  const places = placesFor(state.mode);
  const list = places
    .map((exp) => t("{place} {n}", { place: placeName(t, state.mode, exp), n: state.counts[exp] }))
    .join(", ");
  const value = decimalText(valueOf(state)) ?? ratText(valueOf(state));
  const parts = [
    state.mode === "decimal"
      ? t("Place value blocks with decimals, the flat is one whole.")
      : t("Place value blocks, whole numbers."),
    `${list}.`,
    t("The number is {value}.", { value }),
  ];
  if (!standardForm(state))
    parts.push(t("Some place has 10 or more blocks, so you can trade 10 for 1 in the next place."));
  return parts.join(" ");
}

// ---- drawing ---------------------------------------------------------------------------------------------------
const rect = (cls, x, y, w, h2, extra = {}) =>
  s("rect", { class: cls, x, y, width: w, height: h2, ...extra });
function drawBlock(g, kind, x, y) {
  if (kind === "unit") g.append(rect("ga-blk ga-blk--unit", x, y, 10, 10, { rx: 1.5 }));
  else if (kind === "tiny") g.append(rect("ga-blk ga-blk--tiny", x + 2, y + 2, 6, 6, { rx: 1 }));
  else if (kind === "rod") {
    g.append(rect("ga-blk ga-blk--rod", x, y, 10, 44, { rx: 2 }));
    for (let i = 1; i < 10; i += 1)
      g.append(
        s("line", { class: "ga-blk-grid", x1: x, x2: x + 10, y1: y + i * 4.4, y2: y + i * 4.4 }),
      );
  } else {
    const big = kind === "cube";
    g.append(rect(big ? "ga-blk ga-blk--cube" : "ga-blk ga-blk--flat", x, y, 44, 44, { rx: 3 }));
    for (let i = 1; i < 10; i += 1) {
      g.append(
        s("line", { class: "ga-blk-grid", x1: x + i * 4.4, x2: x + i * 4.4, y1: y, y2: y + 44 }),
        s("line", { class: "ga-blk-grid", x1: x, x2: x + 44, y1: y + i * 4.4, y2: y + i * 4.4 }),
      );
    }
    if (big)
      g.append(
        s("path", {
          class: "ga-blk ga-blk--cube-top",
          d: `M${x},${y} l8,-8 h44 l-8,8 Z M${x + 44},${y} l8,-8 v44 l-8,8 Z`,
        }),
      );
  }
}
// Layout of one column's blocks: returns the height used and draws them.
function drawPile(g, kind, count, left, colW, top) {
  const inner = colW - 8;
  if (kind === "cube" || kind === "flat") {
    const x = left + (colW - 44) / 2 - (kind === "cube" ? 4 : 0);
    for (let j = 0; j < count; j += 1) drawBlock(g, kind, x, top + 8 + j * 9);
    return count ? 52 + (count - 1) * 9 : 0;
  }
  const slotW = kind === "rod" ? 13 : kind === "tiny" ? 10 : 13;
  const slotH = kind === "rod" ? 48 : kind === "tiny" ? 10 : 13;
  const per = Math.max(1, Math.floor(inner / slotW));
  const rows = Math.ceil(count / per);
  const used = Math.min(per, count);
  const x0 = left + (colW - used * slotW) / 2;
  for (let j = 0; j < count; j += 1)
    drawBlock(g, kind, x0 + (j % per) * slotW + 1.5, top + 4 + Math.floor(j / per) * slotH);
  return rows * slotH + 4;
}

const SPEC = {
  title: (t) => t("Place value blocks"),
  initial(cfg) {
    const mode = cfg.decimals ? "decimal" : cfg.placeMode || "whole";
    const counts = Object.fromEntries(placesFor(mode).map((exp) => [exp, 0]));
    if (cfg.mode === "explore" && !cfg.initial) {
      const sample =
        mode === "decimal" ? { 1: 0, 0: 2, "-1": 3, "-2": 4, "-3": 0 } : { 3: 1, 2: 2, 1: 0, 0: 4 };
      Object.assign(counts, sample);
    }
    return cfg.initial ?? { mode, counts };
  },
  normalize: normalizeState,
  describe,
  evaluate,
  build(ctx) {
    const { t, cfg, controls } = ctx;
    let sel = 0;
    let drag = null;
    let geo = [];
    const change = (fn) => {
      const next = fn(ctx.get());
      if (next) ctx.set(next);
    };
    const modeChoice = choice({
      id: "pv-mode",
      label: t("Number type"),
      options: [
        { value: "whole", text: t("Whole numbers") },
        { value: "decimal", text: t("Decimals") },
      ],
      onChange: (mode) =>
        ctx.set({ mode, counts: Object.fromEntries(placesFor(mode).map((e) => [e, 0])) }),
    });
    const placePick = h("div", {
      class: "ga-choice ga-wide",
      role: "group",
      "aria-label": t("Place to change"),
    });
    const addBtn = button("pv-add", t("Add 1"), () =>
      change((st) =>
        st.counts[sel] < MAX_COUNT
          ? { ...st, counts: { ...st.counts, [sel]: st.counts[sel] + 1 } }
          : null,
      ),
    );
    const takeBtn = button("pv-take", t("Take 1 away"), () =>
      change((st) =>
        st.counts[sel] > 0 ? { ...st, counts: { ...st.counts, [sel]: st.counts[sel] - 1 } } : null,
      ),
    );
    const upBtn = button("pv-up", t("Trade 10 for 1"), () => change((st) => regroupUp(st, sel)));
    const downBtn = button("pv-down", t("Break 1 into 10"), () =>
      change((st) => regroupDown(st, sel)),
    );
    const actions = h(
      "div",
      { class: "ga-choice ga-wide", role: "group", "aria-label": t("Change the blocks") },
      addBtn,
      takeBtn,
      upBtn,
      downBtn,
    );
    if (!cfg.placeMode && !cfg.decimals && cfg.mode === "explore") controls.append(modeChoice.el);
    controls.append(placePick, actions);
    const setAria = (node, on) => node.setAttribute("aria-disabled", String(!on));

    dragSurface(ctx.svg, {
      move(token, pt, _event, start) {
        const exp = Number(token.slice(2));
        if (start) sel = exp;
        const col = geo.findIndex((c) => pt.x >= c.x && pt.x < c.x + c.w);
        drag = { exp, x: pt.x, y: pt.y, target: col < 0 ? null : geo[col].exp };
        ctx.redraw();
      },
      end() {
        const d = drag;
        drag = null;
        if (!d) return;
        const st = ctx.get();
        const next =
          d.target === d.exp + 1
            ? regroupUp(st, d.exp)
            : d.target === d.exp - 1
              ? regroupDown(st, d.exp)
              : null;
        if (next) {
          ctx.set(next);
        } else {
          ctx.redraw();
          ctx.announce(
            d.target === null || d.target === d.exp
              ? t("Drag a column onto the column next to it to trade.")
              : t("That trade needs the next column, and 10 blocks to trade up."),
          );
        }
      },
    });

    return {
      render(state) {
        const { W } = ctx;
        const places = placesFor(state.mode);
        const pad = 8;
        const colW = (W - 2 * pad) / places.length;
        const kinds = places.map((exp) => BLOCK_OF[state.mode][exp]);
        const heights = places.map((exp, i) => {
          const probe = s("g");
          return drawPile(probe, kinds[i], state.counts[exp], 0, colW, 0);
        });
        const area = Math.max(118, ...heights) + 8;
        const top = 60;
        const H = top + area + 62;
        const g = ctx.begin(H);
        geo = places.map((exp, i) => ({ exp, x: pad + i * colW, w: colW }));
        places.forEach((exp, i) => {
          const x = pad + i * colW;
          const cx = x + colW / 2;
          const selected = sel === exp;
          const col = s("g", {
            class: `ga-col ${selected ? "ga-col--sel" : ""}`,
            tabindex: "0",
            role: "spinbutton",
            "data-fid": `pv-${exp}`,
            "data-drag": `c:${exp}`,
            "aria-label": t("{place}: {blockName} blocks", {
              place: placeName(t, state.mode, exp),
              blockName: blockName(t, state.mode, exp),
            }),
            "aria-valuemin": 0,
            "aria-valuemax": MAX_COUNT,
            "aria-valuenow": state.counts[exp],
            "aria-valuetext": t("{n} {blockName}", {
              n: state.counts[exp],
              blockName: blockName(t, state.mode, exp),
            }),
          });
          col.append(
            rect("ga-col-bg", x + 2, 2, colW - 4, H - 4, { rx: 10 }),
            s("rect", {
              class: "ga-hit",
              x,
              y: 0,
              width: colW,
              height: H,
              "data-drag": `c:${exp}`,
            }),
          );
          const split = colW < 84 ? narrowName(t, exp) : null;
          const lines = split ? split.split("|") : [placeName(t, state.mode, exp)];
          lines.forEach((line, k) => text(col, cx, (lines.length > 1 ? 18 : 24) + k * 16, line, { size: split ? 12 : 13, weight: 700, cls: "ga-label" }));
          text(col, cx, 52, valueLabel(exp), { size: 13, weight: 500 });
          drawPile(col, kinds[i], state.counts[exp], x, colW, top);
          const over = state.counts[exp] >= 10;
          col.append(
            rect(`ga-digit ${over ? "ga-digit--over" : ""}`, cx - 24, H - 54, 48, 44, { rx: 8 }),
          );
          text(col, cx, H - 24, state.counts[exp], { size: 24, weight: 700, cls: "ga-digit-text" });
          g.append(col);
          col.addEventListener("keydown", (event) => {
            sel = exp;
            const count = state.counts[exp];
            const to = {
              ArrowUp: count + 1,
              ArrowRight: count + 1,
              ArrowDown: count - 1,
              ArrowLeft: count - 1,
              Home: 0,
              End: MAX_COUNT,
            }[event.key];
            if (to === undefined) return;
            event.preventDefault();
            if (to >= 0 && to <= MAX_COUNT)
              ctx.set({ ...state, counts: { ...state.counts, [exp]: to } });
          });
          col.addEventListener("focus", () => {
            if (sel !== exp) {
              sel = exp;
              ctx.redraw();
            }
          });
        });
        if (drag) {
          const target = geo.find((c) => c.exp === drag.target);
          if (target && Math.abs(target.exp - drag.exp) === 1)
            g.append(rect("ga-drop", target.x + 3, 3, target.w - 6, H - 6, { rx: 10 }));
          const group = s(
            "g",
            { class: "ga-ghost" },
            rect("ga-ghost-box", drag.x - 22, drag.y - 22, 44, 44, { rx: 10 }),
          );
          text(group, drag.x, drag.y + 6, state.counts[drag.exp] >= 10 ? "×10" : "×1", {
            size: 16,
            weight: 700,
          });
          g.append(group);
        }
        // controls
        placePick.replaceChildren(
          ...places.map((exp) =>
            button(
              `pv-place-${exp}`,
              placeName(t, state.mode, exp),
              () => {
                sel = exp;
                ctx.redraw();
              },
              { pressed: sel === exp },
            ),
          ),
        );
        modeChoice.set(state.mode);
        setAria(addBtn, state.counts[sel] < MAX_COUNT);
        setAria(takeBtn, state.counts[sel] > 0);
        setAria(upBtn, Boolean(regroupUp(state, sel)));
        setAria(downBtn, Boolean(regroupDown(state, sel)));

        const value = valueOf(state);
        const shown = decimalText(value) ?? ratText(value);
        const terms = expandedTerms(state);
        const expanded = terms.length
          ? terms.map((tm) => `${tm.count} × ${decimalText(tm.unit)}`).join("  +  ")
          : "0";
        ctx.readout.replaceChildren(
          h(
            "p",
            { class: "ga-eq" },
            h("span", { class: "ga-op", text: "=" }),
            h("span", { class: "ga-bignum", text: shown }),
          ),
          h("p", { class: "ga-expanded", text: expanded }),
          h("p", {
            class: "ga-hint",
            text: standardForm(state)
              ? ""
              : t("Some place has 10 or more. Trade 10 for 1 in the next place."),
          }),
        );
      },
    };
  },
};

export function mount(container, config = {}) {
  return createComponent("place-value", container, config, SPEC);
}

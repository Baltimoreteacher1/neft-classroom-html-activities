// Stats display: dot plot, histogram, box plot and bar graph. Add, remove and drag data (keyboard: pick a column, then
// + or -), and see mean, median, mode, range and IQR computed exactly with the working shown.
// Check mode compares config.target ({ values, mean, median, mode, range, iqr, n } or { counts } for bars).
import {
  button,
  clone,
  createShell,
  enableDrag,
  h,
  s,
  segmented,
  stepper,
  syncList,
  t,
} from "./b-core.js";
import { add, show, sub } from "./b-rational.js";
import { draw } from "./stats-draw.js";
import * as M from "./stats-math.js";
import { barLines, val, workingLines } from "./stats-text.js";

const kindName = (k) =>
  ({ dot: t("Dot plot"), histogram: t("Histogram"), box: t("Box plot"), bar: t("Bar graph") })[k];
const statName = (n) =>
  ({ mean: t("Mean"), median: t("Median"), mode: t("Mode"), range: t("Range"), iqr: t("IQR") })[n];

export function mount(container, config = {}) {
  const shell = createShell(container, config, "stats-display", {
    defaultLabel: t("Data display"),
    help: t(
      "Click above a column to add a value. Drag a dot to another column. With the keyboard, move between columns with the arrow keys and press + or - to add or remove.",
    ),
  });
  const { svg, announce } = shell;
  const kinds = (config.kinds ?? M.KINDS).filter((k) => M.KINDS.includes(k));
  const showStats = config.showStats ?? shell.mode !== "check";
  let state = M.sanitize({}, config);
  if (!kinds.includes(state.kind)) state = M.sanitize({ ...state, kind: kinds[0] }, config);
  let width = 560;
  let view = null;
  const cache = new Map();
  const staticLayer = s("g", { class: "gb-static" });
  const handleLayer = s("g", { class: "gb-handles" });
  svg.append(staticLayer, handleLayer);

  const colLabel = (c) => {
    if (state.kind === "bar") return state.cats[c].label;
    const lo = M.columnValue(state, c);
    return state.kind === "histogram"
      ? t("Values from {lo} up to {hi}", { lo: show(lo), hi: show(add(lo, state.bw)) })
      : t("Value {v}", { v: show(lo) });
  };
  const countText = (n) =>
    state.kind === "bar"
      ? String(n)
      : state.kind === "histogram"
        ? n === 1
          ? t("1 value")
          : t("{n} values", { n })
        : n === 1
          ? t("1 dot")
          : t("{n} dots", { n });

  function createColumn(d) {
    const node = s(
      "g",
      { class: "gb-col", role: "spinbutton", "data-drag": d.id, "data-id": d.id },
      s("rect", { class: "gb-ring gb-ring--box" }),
      s("rect", { class: "gb-hit" }),
    );
    node.addEventListener("keydown", (event) => onKey(event, d.index));
    node.addEventListener("focus", () => {
      const c = Number(node.dataset.id.slice(1));
      if (state.selected !== c) {
        state = { ...state, selected: c };
        render();
      }
    });
    return node;
  }
  function updateColumn(node, d) {
    node.setAttribute("transform", `translate(${d.x} ${d.y})`);
    node.setAttribute("tabindex", d.index === state.selected ? "0" : "-1");
    node.setAttribute("aria-label", colLabel(d.index));
    node.setAttribute("aria-valuemin", "0");
    node.setAttribute("aria-valuemax", "30");
    node.setAttribute("aria-valuenow", String(d.count));
    node.setAttribute("aria-valuetext", countText(d.count));
    for (const r of node.querySelectorAll("rect")) {
      r.setAttribute("width", d.w);
      r.setAttribute("height", d.h);
    }
  }

  function describe() {
    const sm = M.summary(state.values);
    if (state.kind === "bar")
      return t("Bar graph. {list}.", {
        list: state.cats.map((c) => `${c.label} ${c.count}`).join(", "),
      });
    const cols = view.lay.cnt
      .map((c, i) => (c ? `${show(M.columnValue(state, i))}: ${countText(c)}` : null))
      .filter(Boolean)
      .join("; ");
    const head = t("{kind} of {n} values. {cols}.", {
      kind: kindName(state.kind),
      n: sm.n,
      cols: cols || t("No data yet"),
    });
    if (!showStats || !sm.n) return head;
    return `${head} ${workingLines(sm, state.stats).join(" ")}`;
  }

  function renderReadout() {
    const sm = M.summary(state.values);
    const lines = [];
    if (state.kind === "bar") {
      if (showStats) lines.push(...barLines(state.cats));
    } else {
      lines.push(
        sm.n
          ? t("{n} values. Ordered: {list}", {
              n: sm.n,
              list:
                sm.sorted.length > 24
                  ? `${sm.sorted.slice(0, 24).map(val).join(", ")}, …`
                  : sm.sorted.map(val).join(", "),
            })
          : t("No data yet. Click above a column to add a value."),
      );
      if (showStats) lines.push(...workingLines(sm, state.stats));
    }
    shell.readout.replaceChildren(...lines.map((text) => h("p", { class: "gb-line", text })));
  }

  // Controls
  const kindSeg = segmented(
    t("Display"),
    kinds.map((k) => [k, kindName(k)]),
    state.kind,
    (kind) => change(M.sanitize({ ...state, kind }, config)),
  );
  if (kinds.length > 1) shell.toolbar.append(kindSeg);
  const addBtn = button(t("Add to column"), () => change(M.addAt(state, state.selected)));
  const removeBtn = button(t("Remove from column"), () =>
    change(M.removeAt(state, state.selected)),
  );
  const clearBtn = button(t("Clear data"), () =>
    change({ ...state, values: [], cats: state.cats.map((c) => ({ ...c, count: 0 })) }),
  );
  shell.toolbar.append(addBtn, removeBtn, clearBtn);
  const statGroup = h("div", {
    class: "gb-seg",
    role: "group",
    "aria-label": t("Show statistics"),
  });
  const statButtons = M.STAT_NAMES.map((name) => {
    const b = button(
      statName(name),
      () =>
        change({
          ...state,
          stats: state.stats.includes(name)
            ? state.stats.filter((x) => x !== name)
            : [...state.stats, name],
        }),
      { "aria-pressed": "false", "data-id": name },
    );
    statGroup.append(b);
    return b;
  });
  const binStep = stepper(t("Bin width"), {
    onDec: () => change(M.sanitize({ ...state, bw: sub(state.bw, state.step) }, config)),
    onInc: () => change(M.sanitize({ ...state, bw: add(state.bw, state.step) }, config)),
  });
  shell.controls.append(statGroup, binStep.el);

  function render() {
    const sm = M.summary(state.values);
    view = draw(state, width, sm, { showStats });
    svg.setAttribute("viewBox", `0 0 ${width} ${view.lay.height}`);
    svg.setAttribute("height", String(view.lay.height));
    staticLayer.replaceChildren(...view.parts);
    syncList(handleLayer, cache, view.handles, {
      key: (d) => d.id,
      create: createColumn,
      update: updateColumn,
    });
    renderReadout();
    kindSeg.refresh(state.kind);
    for (const b of statButtons)
      b.setAttribute("aria-pressed", String(state.stats.includes(b.dataset.id)));
    statGroup.hidden = state.kind === "bar" || !showStats;
    binStep.el.hidden = state.kind !== "histogram";
    binStep.set(show(state.bw));
    const n = view.lay.cnt[state.selected] ?? 0;
    addBtn.disabled = state.kind !== "bar" && state.values.length >= M.MAX_VALUES;
    removeBtn.disabled = n === 0;
    clearBtn.disabled =
      state.kind === "bar" ? state.cats.every((c) => c.count === 0) : state.values.length === 0;
  }

  function change(next, { speak = true } = {}) {
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    render();
    shell.emit(state, M.isCorrect(state, config.target));
    if (speak) announce(describe());
  }
  const focusColumn = (c) => cache.get(`c${c}`)?.focus({ preventScroll: true });

  function onKey(event, c) {
    const last = view.lay.n - 1;
    const key = event.key;
    let next = null;
    let focusTo = c;
    if (key === "ArrowUp" || key === "+" || key === "=") next = M.addAt(state, c);
    else if (key === "ArrowDown" || key === "-" || key === "Delete" || key === "Backspace")
      next = M.removeAt(state, c);
    else if (key === "ArrowRight" || key === "ArrowLeft") {
      const to = Math.max(0, Math.min(last, c + (key === "ArrowRight" ? 1 : -1)));
      if (event.shiftKey && state.kind !== "bar") next = M.moveBetween(state, c, to);
      focusTo = to;
      if (!next) {
        event.preventDefault();
        state = { ...state, selected: to };
        render();
        focusColumn(to);
        announce(`${colLabel(to)}: ${countText(view.lay.cnt[to])}`);
        return;
      }
    } else if (key === "Home" || key === "End") {
      event.preventDefault();
      focusColumn(key === "Home" ? 0 : last);
      return;
    } else if (key === "Enter" || key === " ") {
      event.preventDefault();
      announce(`${colLabel(c)}: ${countText(view.lay.cnt[c])}`);
      return;
    }
    if (next) {
      event.preventDefault();
      change(next);
      focusColumn(focusTo);
    }
  }

  let carry = null;
  const colAt = (pt) =>
    Math.max(0, Math.min(view.lay.n - 1, Math.floor((pt.x - view.lay.L) / view.lay.colW)));
  const setHeight = (c, pt) =>
    change(
      M.setCount(
        state,
        c,
        Math.max(
          0,
          Math.min(view.lay.yMax, Math.round((view.lay.baseline - pt.y) / view.lay.unitH)),
        ),
      ),
      { speak: false },
    );
  enableDrag(svg, {
    onStart: (id, pt) => {
      const c = Number(id.slice(1));
      carry = { col: c };
      if (view.lay.isBars) return setHeight(c, pt);
      const top = view.lay.baseline - view.lay.cnt[c] * view.lay.dot - 2;
      if (view.lay.cnt[c] === 0 || pt.y < top) change(M.addAt(state, c), { speak: false });
      else change({ ...state, selected: c }, { speak: false });
    },
    onMove: (id, pt) => {
      if (!carry) return;
      if (view.lay.isBars) return setHeight(carry.col, pt);
      const j = colAt(pt);
      if (j !== carry.col) {
        change(M.moveBetween(state, carry.col, j), { speak: false });
        carry.col = j;
      }
    },
    onEnd: () => {
      carry = null;
      announce(describe());
    },
  });

  shell.onResize((w) => {
    width = w;
    render();
  });
  return {
    kind: "stats-display",
    getState: () => clone(state),
    setState(next) {
      state = M.sanitize(next, config);
      if (!kinds.includes(state.kind)) state = M.sanitize({ ...state, kind: kinds[0] }, config);
      render();
    },
    describe,
    check: () => M.isCorrect(state, config.target),
    destroy: shell.destroy,
  };
}

// Ratio table: an editable table of equivalent ratios with add-a-scaled-row, multiplicative scale arrows, an
// equivalent-ratio check, a unit-rate cell and a linked tape (bar) picture. Cells hold exact rationals {n, d}
// (typed as 3/4, 1 1/2 or 0.75). Check mode compares every row with the target ratio by cross-multiplying and
// never draws the answer.
import {
  asFrac,
  cmp,
  decimalText,
  div,
  eq,
  frac,
  gcd,
  lcm,
  mixedText,
  mul,
  must,
  parseRational,
  ratText,
} from "./graphics-a-core.js";
import { button, createComponent, h, s, setDisabled, stepper, text } from "./graphics-a-ui.js";

const MAX_ROWS = 8;
const LIMIT = frac(1000000, 1);
const ZERO = frac(0, 1);

// ---- pure math -------------------------------------------------------------------------------------------------
export const complete = (row) => row.a !== null && row.b !== null;
// The base ratio is the first row with both amounts positive.
export const baseRatio = (state) =>
  state.rows.find((row) => complete(row) && row.a.n > 0 && row.b.n > 0) ?? null;
// a1 : b1 is equivalent to a2 : b2 exactly when a1 * b2 = a2 * b1.
export const equivalent = (row, ratio) =>
  complete(row) && eq(mul(row.a, ratio.b), mul(row.b, ratio.a));
export const scaleFactor = (from, to) =>
  from !== null && to !== null && from.n !== 0 ? div(to, from) : null;
export const unitRate = (state) => {
  const base = baseRatio(state);
  return base ? div(base.b, base.a) : null;
};
// Whole-number tape parts of a ratio: 3/2 : 1 -> 3 : 2. Null when the parts get too big to draw.
export function tapeParts(ratio) {
  const scale = lcm(ratio.a.d, ratio.b.d);
  const a = (ratio.a.n * scale) / ratio.a.d;
  const b = (ratio.b.n * scale) / ratio.b.d;
  const g = gcd(a, b);
  const parts = { p: a / g, q: b / g };
  return parts.p + parts.q <= 24 && parts.p <= 18 && parts.q <= 18 ? parts : null;
}
export const rowStatus = (state, i) => {
  const row = state.rows[i];
  const base = baseRatio(state);
  if (!complete(row)) return "incomplete";
  if (!base) return "base";
  return equivalent(row, base) ? "same" : "different";
};

const cell = (value, name) => {
  if (value === null || value === undefined) return null;
  const f = asFrac(value);
  must(f.d >= 1 && cmp(f, LIMIT) <= 0 && cmp(f, frac(-1000000, 1)) >= 0, `${name} is out of range`);
  return f;
};
export function normalizeState(input) {
  must(
    Array.isArray(input?.rows) && input.rows.length >= 1 && input.rows.length <= MAX_ROWS,
    `a ratio table has 1-${MAX_ROWS} rows`,
  );
  must(
    typeof input.aLabel === "string" &&
      typeof input.bLabel === "string" &&
      input.aLabel.length <= 40 &&
      input.bLabel.length <= 40,
    "labels must be short text",
  );
  return {
    aLabel: input.aLabel,
    bLabel: input.bLabel,
    rows: input.rows.map((row, i) => ({
      a: cell(row.a, `row ${i + 1} a`),
      b: cell(row.b, `row ${i + 1} b`),
    })),
    unit: cell(input.unit, "unit rate"),
  };
}

export function evaluate(state, target, cfg = {}) {
  const ratio = { a: asFrac(target.a), b: asFrac(target.b) };
  if (!state.rows.every((row) => complete(row) && equivalent(row, ratio))) return false;
  if (state.rows.length < (cfg.minRows ?? 1)) return false;
  if (cfg.unitRate)
    return state.unit !== null && ratio.a.n !== 0 && eq(state.unit, div(ratio.b, ratio.a));
  return true;
}

const num = (f) => (f === null ? null : (decimalText(f) ?? ratText(f)));
export function describe(state, t, cfg = {}) {
  const parts = [t("Ratio table of {a} to {b}.", { a: state.aLabel, b: state.bLabel })];
  state.rows.forEach((row, i) =>
    parts.push(
      t("Row {n}: {a} and {b}.", {
        n: i + 1,
        a: row.a === null ? t("blank") : num(row.a),
        b: row.b === null ? t("blank") : num(row.b),
      }),
    ),
  );
  if (cfg.mode !== "check") {
    const bad = state.rows.findIndex((_, i) => rowStatus(state, i) === "different");
    parts.push(
      bad >= 0
        ? t("Row {n} is not equivalent to the first full row.", { n: bad + 1 })
        : t("Every full row is an equivalent ratio."),
    );
    const rate = unitRate(state);
    if (rate)
      parts.push(
        t("Unit rate: {value} {b} for 1 {a}.", {
          value: num(rate),
          b: state.bLabel,
          a: state.aLabel,
        }),
      );
  }
  return parts.join(" ");
}

// ---- component -------------------------------------------------------------------------------------------------
let uid = 0;
const SPEC = {
  title: (t) => t("Ratio table"),
  initial(cfg, t) {
    const explore = cfg.mode === "explore";
    const rows = (
      cfg.rows ??
      (explore
        ? [
            { a: 2, b: 3 },
            { a: 4, b: 6 },
            { a: 6, b: 9 },
          ]
        : [{ a: 2, b: 3 }])
    ).map((r) => ({ a: r.a ?? null, b: r.b ?? null }));
    return (
      cfg.initial ?? {
        aLabel: cfg.aLabel ?? t("Cups of flour"),
        bLabel: cfg.bLabel ?? t("Cups of sugar"),
        rows,
        unit: null,
      }
    );
  },
  normalize: normalizeState,
  describe,
  evaluate,
  build(ctx) {
    const { t, cfg, controls } = ctx;
    const check = cfg.mode === "check";
    const showUnit = cfg.unitRate ?? !check;
    const unitInput = check && cfg.unitRate;
    const showStatus = !check;
    const lockGiven = cfg.lockGiven ?? check;
    const given = (cfg.rows ?? []).map((r) => ({
      a: r.a !== undefined && r.a !== null,
      b: r.b !== undefined && r.b !== null,
    }));
    const id = `rt${(uid += 1)}`;
    let from = 1;
    let times = 2;
    let over = 1;
    let picRow = 1;
    let shape = "";
    const inputs = new Map();
    const body = h("tbody");
    const table = h(
      "table",
      { class: "ga-rt" },
      h("caption", { class: "ga-sr", text: t("Ratio table") }),
      h("thead"),
      body,
    );
    const wrap = h("div", { class: "ga-rt-wrap" }, table);
    ctx.stage.before(wrap);

    const parse = (input) => {
      const value = parseRational(input.value);
      const okay =
        input.value.trim() === "" ||
        (value && cmp(value, LIMIT) <= 0 && cmp(value, frac(-1000000, 1)) >= 0);
      input.setAttribute("aria-invalid", String(!okay));
      return okay ? (input.value.trim() === "" ? null : value) : null;
    };
    const makeInput = (label, onValue, locked) => {
      const input = h("input", {
        class: "ga-input ga-rt-input",
        type: "text",
        inputmode: "decimal",
        autocomplete: "off",
        "aria-label": label,
        "data-fid": `in-${uid}-${label}`,
        readonly: locked ? "" : null,
      });
      input.addEventListener("input", () => onValue(parse(input)));
      return input;
    };
    const setRow = (i, key, value) =>
      ctx.set(
        (st) => ({
          ...st,
          rows: st.rows.map((row, k) => (k === i ? { ...row, [key]: value } : row)),
        }),
        { say: false },
      );

    const scaleBtn = button("rt-scale", t("Add a scaled row"), () => {
      const st = ctx.get();
      const source = st.rows[from - 1];
      const factor = frac(times, over);
      if (!source || !complete(source) || st.rows.length >= MAX_ROWS) return;
      ctx.set({
        ...st,
        rows: [...st.rows, { a: mul(source.a, factor), b: mul(source.b, factor) }],
      });
    });
    const blankBtn = button(
      "rt-blank",
      t("Add an empty row"),
      () =>
        ctx.set((st) => ({
          ...st,
          rows: st.rows.length < MAX_ROWS ? [...st.rows, { a: null, b: null }] : st.rows,
        })),
      { class: "ga-btn--quiet" },
    );
    const dropBtn = button(
      "rt-drop",
      t("Remove last row"),
      () => ctx.set((st) => ({ ...st, rows: st.rows.length > 1 ? st.rows.slice(0, -1) : st.rows })),
      { class: "ga-btn--quiet" },
    );
    const fromStep = stepper(ctx, {
      id: "rt-from",
      label: t("From row"),
      min: 1,
      max: MAX_ROWS,
      onChange: (v) => {
        from = v;
        ctx.redraw();
      },
    });
    const timesStep = stepper(ctx, {
      id: "rt-times",
      label: t("Multiply by"),
      min: 1,
      max: 12,
      onChange: (v) => {
        times = v;
        ctx.redraw();
      },
    });
    const overStep = stepper(ctx, {
      id: "rt-over",
      label: t("Divide by"),
      min: 1,
      max: 12,
      onChange: (v) => {
        over = v;
        ctx.redraw();
      },
    });
    const picStep = stepper(ctx, {
      id: "rt-pic",
      label: t("Picture for row"),
      min: 1,
      max: MAX_ROWS,
      onChange: (v) => {
        picRow = v;
        ctx.redraw();
      },
    });
    const actions = h(
      "div",
      { class: "ga-choice ga-wide", role: "group", "aria-label": t("Rows") },
      scaleBtn,
      blankBtn,
      dropBtn,
    );
    if (cfg.scale !== false) controls.append(fromStep.el, timesStep.el, overStep.el);
    controls.append(actions);
    if (cfg.picture !== false) controls.append(picStep.el);

    function arrow(side, factorText, ok) {
      const dir = side === "a" ? -1 : 1;
      const near = side === "a" ? 40 : 4;
      const far = near + dir * 34;
      const colour = ok ? (side === "a" ? "ga-arrow-a" : "ga-arrow-b") : "ga-arrow-bad";
      const svg = s("svg", { class: "ga-rt-arrow", width: 44, height: 56, viewBox: "0 0 44 56", "aria-hidden": "true", focusable: "false" });
      svg.append(
        s("path", { class: `ga-arrow-path ${colour}`, d: `M${near},28 C${far},28 ${far},84 ${near},84` }),
        s("path", { class: `ga-arrow-tip ${colour}`, d: `M${near},84 l${dir * 9},-6 l0,12 Z` }),
      );
      text(svg, near + dir * 22, 62, factorText, { size: 14, weight: 700, cls: `ga-halo ${ok ? "" : "ga-arrow-bad-text"}` });
      return svg;
    }

    function buildTable(state) {
      const key = `${state.rows.length}|${showUnit}`;
      if (key === shape) return;
      shape = key;
      inputs.clear();
      body.replaceChildren();
      table.tHead.replaceChildren(
        h(
          "tr",
          {},
          h("td", { class: "ga-rt-gap" }),
          h("th", { scope: "col", class: "ga-rt-head", "data-col": "a" }),
          h("th", { scope: "col", class: "ga-rt-head", "data-col": "b" }),
          h("td", { class: "ga-rt-gap" }),
          showStatus ? h("td", { class: "ga-rt-stat-head" }) : null,
        ),
      );
      state.rows.forEach((row, i) => {
        const a = makeInput(
          t("Row {n}, {name}", { n: i + 1, name: "A" }),
          (v) => setRow(i, "a", v),
          lockGiven && given[i]?.a,
        );
        const b = makeInput(
          t("Row {n}, {name}", { n: i + 1, name: "B" }),
          (v) => setRow(i, "b", v),
          lockGiven && given[i]?.b,
        );
        inputs.set(`${i}:a`, a);
        inputs.set(`${i}:b`, b);
        body.append(
          h(
            "tr",
            { "data-row": i },
            h("td", { class: "ga-rt-arr", "data-side": "a" }),
            h("td", {}, a),
            h("td", {}, b),
            h("td", { class: "ga-rt-arr", "data-side": "b" }),
            showStatus ? h("td", { class: "ga-rt-stat" }) : null,
          ),
        );
      });
      if (showUnit) {
        const input = unitInput
          ? makeInput(
              t("Unit rate"),
              (v) => ctx.set((st) => ({ ...st, unit: v }), { say: false }),
              false,
            )
          : null;
        if (input) inputs.set("unit", input);
        body.append(
          h(
            "tr",
            { class: "ga-rt-unit" },
            h("td", { class: "ga-rt-gap" }),
            h(
              "td",
              { class: "ga-rt-one" },
              h("span", { class: "ga-rt-1", text: "1" }),
              h("span", { class: "ga-rt-note", text: t("unit rate") }),
            ),
            h("td", { class: "ga-rt-unitval" }, input ?? h("output", { class: "ga-rt-out" })),
            h("td", { class: "ga-rt-gap" }),
            showStatus ? h("td") : null,
          ),
        );
      }
    }

    function drawTape(state) {
      const { W } = ctx;
      const base = baseRatio(state);
      const parts = base && cfg.picture !== false ? tapeParts(base) : null;
      if (!parts) {
        ctx.begin(1);
        ctx.stage.toggleAttribute("hidden", true);
        return;
      }
      ctx.stage.toggleAttribute("hidden", false);
      const row = state.rows[Math.min(picRow, state.rows.length) - 1];
      const pad = 8;
      const bw = Math.min(46, Math.floor((W - 2 * pad) / Math.max(parts.p, parts.q)));
      const g = ctx.begin(134);
      const value = (v, n) =>
        row && v !== null ? (decimalText(div(v, frac(n, 1))) ?? ratText(div(v, frac(n, 1)))) : "?";
      [
        ["a", state.aLabel, parts.p, 22, "ga-fill-a"],
        ["b", state.bLabel, parts.q, 86, "ga-fill-b"],
      ].forEach(([key, label, n, y, cls]) => {
        text(g, pad, y - 7, label, { size: 14, weight: 700, anchor: "start", cls: "ga-label" });
        for (let k = 0; k < n; k += 1) {
          g.append(
            s("rect", {
              class: `ga-part ga-part--on ${cls}`,
              x: pad + k * bw,
              y,
              width: bw,
              height: 40,
            }),
          );
          text(g, pad + k * bw + bw / 2, y + 26, value(row?.[key] ?? null, n), {
            size: bw < 30 ? 12 : 15,
            weight: 700,
            cls: "ga-halo",
          });
        }
      });
    }

    return {
      render(state) {
        buildTable(state);
        table.tHead.rows[0].querySelector('[data-col="a"]').textContent = state.aLabel;
        table.tHead.rows[0].querySelector('[data-col="b"]').textContent = state.bLabel;
        const base = baseRatio(state);
        state.rows.forEach((row, i) => {
          for (const key of ["a", "b"]) {
            const input = inputs.get(`${i}:${key}`);
            input.setAttribute("aria-label", t("Row {n}, {name}", { n: i + 1, name: key === "a" ? state.aLabel : state.bLabel }));
            if (document.activeElement === input) continue;
            const parsed = parseRational(input.value);
            const same = row[key] === null ? parsed === null : parsed && eq(parsed, row[key]);
            if (!same)
              input.value = row[key] === null ? "" : (decimalText(row[key]) ?? mixedText(row[key]));
          }
          const tr = body.rows[i];
          const next = state.rows[i + 1];
          const arrowCells = tr.querySelectorAll(".ga-rt-arr");
          arrowCells[0].replaceChildren();
          arrowCells[1].replaceChildren();
          if (next) {
            const fa = scaleFactor(row.a, next.a);
            const fb = scaleFactor(row.b, next.b);
            const ok = fa && fb ? eq(fa, fb) : true;
            if (fa) arrowCells[0].append(arrow("a", `×${ratText(fa)}`, ok));
            if (fb) arrowCells[1].append(arrow("b", `×${ratText(fb)}`, ok));
          }
          if (showStatus) {
            const status = rowStatus(state, i);
            const label = {
              same: t("same ratio"),
              different: t("different ratio"),
              incomplete: t("fill both cells"),
              base: t("first ratio"),
            }[status];
            tr.querySelector(".ga-rt-stat").replaceChildren(
              h(
                "span",
                { class: `ga-chip ga-chip--${status}`, title: label },
                h("span", {
                  "aria-hidden": "true",
                  text: { same: "=", different: "≠", incomplete: "…", base: "●" }[status],
                }),
                h("span", { class: "ga-sr", text: label }),
              ),
            );
          }
        });
        if (showUnit) {
          const rate = unitRate(state);
          if (unitInput) {
            const input = inputs.get("unit");
            input.setAttribute("aria-label", t("Unit rate: {b} for 1 {a}", { b: state.bLabel, a: state.aLabel }));
            if (document.activeElement !== input) {
              const parsed = parseRational(input.value);
              if (!(state.unit === null ? parsed === null : parsed && eq(parsed, state.unit)))
                input.value =
                  state.unit === null ? "" : (decimalText(state.unit) ?? mixedText(state.unit));
            }
          } else
            body.querySelector(".ga-rt-out").textContent = rate
              ? (decimalText(rate) ?? mixedText(rate))
              : "—";
        }
        fromStep.set(Math.min(from, state.rows.length), state.rows.length);
        timesStep.set(times);
        overStep.set(over);
        picStep.set(Math.min(picRow, state.rows.length), state.rows.length);
        const source = state.rows[Math.min(from, state.rows.length) - 1];
        setDisabled(scaleBtn, !source || !complete(source) || state.rows.length >= MAX_ROWS);
        setDisabled(blankBtn, state.rows.length >= MAX_ROWS);
        setDisabled(dropBtn, state.rows.length <= 1);
        drawTape(state);
        const factor = frac(times, over);
        const tapeShown = !ctx.stage.hasAttribute("hidden");
        ctx.readout.replaceChildren(
          ...[
            tapeShown ? h("p", { class: "ga-expanded", text: t("Tape picture for row {n}. When a row is in this ratio, every block holds the same amount.", { n: Math.min(picRow, state.rows.length) }) }) : null,
            h("p", { class: "ga-expanded", text: t("Scale factor for a new row: {f}", { f: ratText(factor) }) }),
            base && !check ? h("p", { class: "ga-eq" }, `${num(base.a)} : ${num(base.b)}`) : null,
          ].filter(Boolean),
        );
      },
    };
  },
};

export function mount(container, config = {}) {
  return createComponent("ratio-table", container, config, SPEC);
}

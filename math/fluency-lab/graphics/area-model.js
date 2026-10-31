// Area model: partial products with adjustable splits for whole numbers and decimals, each partial area and the
// total, expanded form; plus a binomial (factor / expanded) form for grades 7-8. Splits are exact rationals on
// the factor's own place-value grid; check mode asks the learner to type each partial area and the total and
// compares them with exact arithmetic without ever drawing the answer.
import {
  add,
  asFrac,
  ceilQ,
  cmp,
  decimalText,
  eq,
  floorQ,
  frac,
  mul,
  must,
  parseRational,
  sub,
  toNumber,
} from "./graphics-a-core.js";
import {
  button,
  createComponent,
  dragSurface,
  h,
  s,
  sliderKey,
  stepper,
  text,
} from "./graphics-a-ui.js";

const MAX_PARTS = 4;
const KINDS = ["numbers", "binomial"];
const ZERO = frac(0, 1);
let uid = 0;

// ---- pure math -------------------------------------------------------------------------------------------------
const decimalPlaces = (f) => {
  const txt = decimalText(f);
  return txt === null ? null : (txt.split(".")[1] ?? "").length;
};
// Smallest place value a factor uses: 23 -> 1, 23.4 -> 1/10, 2.05 -> 1/100.
export const unitOf = (f) => frac(1, 10 ** (decimalPlaces(f) ?? 0));
// Expanded-form parts of a decimal factor, largest place first: 23.4 -> [20, 3, 0.4].
export function placeParts(f) {
  const places = decimalPlaces(f);
  const digits = String((f.n * 10 ** places) / f.d).split("");
  const parts = [];
  digits.forEach((digit, i) => {
    const power = digits.length - 1 - i - places;
    if (digit !== "0") parts.push(mul(frac(Number(digit), 1), power >= 0 ? frac(10 ** power, 1) : frac(1, 10 ** -power)));
  });
  return parts;
}
export const partials = (state) => state.aParts.map((p) => state.bParts.map((q) => mul(p, q)));
export const totalArea = (state) => mul(state.a, state.b);
export const sumParts = (parts) => parts.reduce((total, p) => add(total, p), ZERO);
// Split the largest part at the multiple of unit nearest its middle; null when no part is at least 2 units.
export function splitLargest(parts, unit) {
  if (parts.length >= MAX_PARTS) return null;
  let at = 0;
  parts.forEach((p, i) => cmp(p, parts[at]) > 0 && (at = i));
  const units = floorQ(parts[at], unit);
  if (units < 2) return null;
  const first = mul(frac(Math.ceil(units / 2), 1), unit);
  return [...parts.slice(0, at), first, sub(parts[at], first), ...parts.slice(at + 1)];
}
export const mergeLast = (parts) =>
  parts.length > 1 ? [...parts.slice(0, -2), add(parts.at(-2), parts.at(-1))] : null;

// Binomials (a1 x + a0)(b1 x + b0).
export const polyOf = (state) => ({
  x2: state.a[0] * state.b[0],
  x1: state.a[0] * state.b[1] + state.a[1] * state.b[0],
  x0: state.a[1] * state.b[1],
});
export function polyText(poly) {
  const terms = [
    [poly.x2, "x²"],
    [poly.x1, "x"],
    [poly.x0, ""],
  ].filter(([c]) => c !== 0);
  if (!terms.length) return "0";
  return terms
    .map(([c, v], i) => {
      const mag = Math.abs(c);
      const body = v && mag === 1 ? v : `${mag}${v}`;
      return i === 0 ? `${c < 0 ? "−" : ""}${body}` : ` ${c < 0 ? "−" : "+"} ${body}`;
    })
    .join("");
}
export const factorText = (pair) => `(${pair[0] === 1 ? "x" : `${pair[0]}x`}${pair[1] === 0 ? "" : ` ${pair[1] < 0 ? "\u2212" : "+"} ${Math.abs(pair[1])}`})`;

const cellKeys = (state) =>
  state.aParts.flatMap((_, i) => state.bParts.map((__, j) => `${i},${j}`));
export function normalizeState(input) {
  must(KINDS.includes(input?.kind), "kind must be numbers or binomial");
  if (input.kind === "binomial") {
    const ok = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
    must(
      Array.isArray(input.a) &&
        Array.isArray(input.b) &&
        ok(input.a[0], 1, 6) &&
        ok(input.b[0], 1, 6) &&
        ok(input.a[1], -12, 12) &&
        ok(input.b[1], -12, 12),
      "binomial factors out of range",
    );
    return { kind: "binomial", a: [input.a[0], input.a[1]], b: [input.b[0], input.b[1]] };
  }
  const a = asFrac(input.a);
  const b = asFrac(input.b);
  for (const f of [a, b])
    must(
      f.n > 0 && cmp(f, frac(1000, 1)) < 0 && decimalPlaces(f) !== null && decimalPlaces(f) <= 3,
      "factors must be positive decimals below 1000 with at most 3 places",
    );
  const norm = (parts, whole, name) => {
    must(
      Array.isArray(parts) && parts.length >= 1 && parts.length <= MAX_PARTS,
      `${name} needs 1-${MAX_PARTS} parts`,
    );
    const list = parts.map(asFrac);
    const unit = unitOf(whole);
    must(
      list.every((p) => p.n > 0 && floorQ(p, unit) * 1 === ceilQ(p, unit)),
      `${name} parts must be positive multiples of ${decimalText(unit)}`,
    );
    must(eq(sumParts(list), whole), `${name} parts must add up to the factor`);
    return list;
  };
  const state = {
    kind: "numbers",
    a,
    b,
    aParts: norm(input.aParts, a, "aParts"),
    bParts: norm(input.bParts, b, "bParts"),
    entries: {},
    total: null,
  };
  const entries = input.entries ?? {};
  for (const [key, value] of Object.entries(entries)) {
    must(cellKeys(state).includes(key), `entries has an unknown cell ${key}`);
    state.entries[key] = value === null ? null : asFrac(value);
  }
  state.total = input.total === null || input.total === undefined ? null : asFrac(input.total);
  return state;
}

export function evaluate(state, target) {
  if (state.kind === "binomial") {
    const poly = polyOf(state);
    return poly.x2 === target.x2 && poly.x1 === target.x1 && poly.x0 === target.x0;
  }
  const goal = asFrac(target?.value ?? target);
  if (!eq(totalArea(state), goal) || !state.total || !eq(state.total, goal)) return false;
  const cells = partials(state);
  return state.aParts.every((_, i) =>
    state.bParts.every(
      (__, j) => state.entries[`${i},${j}`] && eq(state.entries[`${i},${j}`], cells[i][j]),
    ),
  );
}

const dec = (f) => decimalText(f) ?? `${f.n}/${f.d}`;
export function describe(state, t, cfg = {}) {
  if (state.kind === "binomial") {
    const mode = cfg.mode === "check";
    const base = t("Area model for the product of two binomials: {a} times {b}.", {
      a: factorText(state.a),
      b: factorText(state.b),
    });
    return mode
      ? base
      : `${base} ${t("Expanded form: {poly}.", { poly: polyText(polyOf(state)) })}`;
  }
  const head = t(
    "Area model for {a} times {b}. The width is split into {pa} and the height into {pb}.",
    {
      a: dec(state.a),
      b: dec(state.b),
      pa: state.aParts.map(dec).join(" + "),
      pb: state.bParts.map(dec).join(" + "),
    },
  );
  if (cfg.mode === "check") return head;
  const cells = partials(state).flat().map(dec).join(" + ");
  return `${head} ${t("Partial areas {cells}, total {total}.", { cells, total: dec(totalArea(state)) })}`;
}

// ---- component -------------------------------------------------------------------------------------------------
const TINTS = ["ga-cell--a", "ga-cell--b", "ga-cell--c", "ga-cell--d"];
// Display widths: mostly proportional, never so thin a label cannot fit.
function widths(parts, whole, total) {
  const n = parts.length;
  const raw = parts.map((p) => 0.35 / n + 0.65 * (toNumber(p) / toNumber(whole)));
  return raw.map((r) => r * total);
}

const SPEC = {
  title: (t) => t("Area model"),
  initial(cfg) {
    if (cfg.initial) return cfg.initial;
    if (cfg.kind === "binomial")
      return { kind: "binomial", a: cfg.a ?? [1, 2], b: cfg.b ?? [1, 3] };
    const a = asFrac(cfg.a ?? 23);
    const b = asFrac(cfg.b ?? 14);
    const split = cfg.mode === "explore" || cfg.split === "place";
    return {
      kind: "numbers",
      a,
      b,
      aParts: split ? placeParts(a) : [a],
      bParts: split ? placeParts(b) : [b],
      entries: {},
      total: null,
    };
  },
  normalize: normalizeState,
  describe,
  evaluate,
  build(ctx) {
    const { t, cfg, controls } = ctx;
    const check = cfg.mode === "check";
    const binomial = ctx.get().kind === "binomial";
    const lockFactors = cfg.mode !== "explore" || cfg.lockFactors;
    let geo = null;
    let entryShape = "";
    const patch = (fn) => ctx.set((st) => ({ ...st, ...fn(st), entries: {}, total: null }));
    const inputs = new Map();
    const entryBox = h("div", { class: "ga-entries" });
    const factorInputs = ["a", "b"].map((key) => {
      const input = h("input", {
        class: "ga-input",
        type: "text",
        inputmode: "decimal",
        "data-fid": `factor-${key}`,
        "aria-label": key === "a" ? t("Width factor") : t("Height factor"),
        size: 6,
      });
      input.addEventListener("change", () => {
        const value = parseRational(input.value);
        const st = ctx.get();
        const ok =
          value &&
          value.n > 0 &&
          cmp(value, frac(1000, 1)) < 0 &&
          decimalPlaces(value) !== null &&
          decimalPlaces(value) <= 3;
        input.setAttribute("aria-invalid", String(!ok));
        if (ok)
          ctx.set({
            ...st,
            [key]: value,
            [`${key}Parts`]: placeParts(value),
            entries: {},
            total: null,
          });
      });
      return input;
    });
    const row = (label, ...nodes) =>
      h(
        "div",
        { class: "ga-step ga-field" },
        h("span", { class: "ga-step-label", text: label }),
        ...nodes,
      );
    const axisBtns = (axis, name) => {
      const key = axis === "a" ? "aParts" : "bParts";
      const unit = () => unitOf(ctx.get()[axis]);
      const split = button(`${axis}-split`, t("Split {name}", { name }), () =>
        patch((st) => ({ [key]: splitLargest(st[key], unit()) ?? st[key] })),
      );
      const merge = button(`${axis}-merge`, t("Join {name}", { name }), () =>
        patch((st) => ({ [key]: mergeLast(st[key]) ?? st[key] })),
      );
      return { split, merge };
    };
    const wA = axisBtns("a", t("width"));
    const hB = axisBtns("b", t("height"));
    const place = button(
      "place",
      t("Split by place value"),
      () => patch((st) => ({ aParts: placeParts(st.a), bParts: placeParts(st.b) })),
      { class: "ga-btn--quiet" },
    );
    const bin = ["a", "b"].flatMap((key, k) =>
      [0, 1].map((idx) => {
        const label =
          idx === 0
            ? t("{name} x-term", { name: k === 0 ? t("First") : t("Second") })
            : t("{name} number", { name: k === 0 ? t("First") : t("Second") });
        const step = stepper(ctx, {
          id: `bin-${key}${idx}`,
          label,
          min: idx === 0 ? 1 : -12,
          max: idx === 0 ? 6 : 12,
          onChange: (v) =>
            ctx.set((st) => ({
              ...st,
              [key]:
                key === "a"
                  ? [idx === 0 ? v : st.a[0], idx === 1 ? v : st.a[1]]
                  : [idx === 0 ? v : st.b[0], idx === 1 ? v : st.b[1]],
            })),
        });
        return { key, idx, step };
      }),
    );
    if (binomial) controls.append(...bin.map((b) => b.step.el));
    else {
      controls.append(h("div", { class: "ga-choice ga-wide", role: "group", "aria-label": t("Split the rectangle") }, wA.split, wA.merge, hB.split, hB.merge, place));
      if (!lockFactors)
        controls.append(row(t("Width"), factorInputs[0]), row(t("Height"), factorInputs[1]));
    }

    dragSurface(ctx.svg, {
      move(token, pt) {
        if (!geo) return;
        const [axis, idxText] = token.split(":");
        const i = Number(idxText);
        const st = ctx.get();
        const key = axis === "a" ? "aParts" : "bParts";
        const bounds = geo[axis]; // displayed boundary positions (px) and their values
        const lo = bounds.px[i];
        const hi = bounds.px[i + 2];
        const along = axis === "a" ? pt.x : pt.y;
        const t01 = Math.min(1, Math.max(0, (along - lo) / (hi - lo)));
        const unit = unitOf(st[axis]);
        const loV = bounds.val[i];
        const hiV = bounds.val[i + 2];
        const raw = toNumber(loV) + t01 * (toNumber(hiV) - toNumber(loV));
        const k = Math.min(
          floorQ(hiV, unit) - 1,
          Math.max(ceilQ(loV, unit) + 1, Math.round(raw / toNumber(unit))),
        );
        const value = mul(frac(k, 1), unit);
        if (cmp(value, loV) <= 0 || cmp(value, hiV) >= 0) return;
        const parts = [...st[key]];
        parts[i] = sub(value, loV);
        parts[i + 1] = sub(hiV, value);
        if (!eq(parts[i], st[key][i]))
          ctx.set({ ...st, [key]: parts, entries: {}, total: null }, { say: false });
      },
      end: () => ctx.say(),
    });
    const handleKey = (axis, i) => (event) => {
      const st = ctx.get();
      const key = axis === "a" ? "aParts" : "bParts";
      const unit = unitOf(st[axis]);
      const loV = sumParts(st[key].slice(0, i));
      const hiV = sumParts(st[key].slice(0, i + 2));
      const at = floorQ(sumParts(st[key].slice(0, i + 1)), unit);
      const next = sliderKey(event, {
        value: at,
        min: ceilQ(loV, unit) + 1,
        max: floorQ(hiV, unit) - 1,
        step: 1,
        big: Math.max(1, Math.round(1 / toNumber(unit))),
      });
      if (next === null || next === at) return;
      const value = mul(frac(next, 1), unit);
      const parts = [...st[key]];
      parts[i] = sub(value, loV);
      parts[i + 1] = sub(hiV, value);
      ctx.set({ ...st, [key]: parts, entries: {}, total: null });
    };

    function drawNumbers(state) {
      const { W } = ctx;
      const left = 44;
      const top = 44;
      const gridW = W - left - 14;
      const cols = widths(state.aParts, state.a, gridW);
      const rowH = widths(state.bParts, state.b, Math.min(300, gridW * 0.62));
      const gridH = rowH.reduce((a, b) => a + b, 0);
      const g = ctx.begin(top + gridH + 30);
      const xs = [left];
      for (const w of cols) xs.push(xs.at(-1) + w);
      const ys = [top];
      for (const w of rowH) ys.push(ys.at(-1) + w);
      geo = {
        a: {
          px: xs,
          val: [ZERO, ...state.aParts.map((_, i) => sumParts(state.aParts.slice(0, i + 1)))],
        },
        b: {
          px: ys,
          val: [ZERO, ...state.bParts.map((_, i) => sumParts(state.bParts.slice(0, i + 1)))],
        },
      };
      const cells = partials(state);
      state.aParts.forEach((p, i) => {
        text(g, (xs[i] + xs[i + 1]) / 2, top - 10, dec(p), {
          size: 15,
          weight: 700,
          cls: "ga-label",
        });
        state.bParts.forEach((q, j) => {
          const cx = (xs[i] + xs[i + 1]) / 2;
          const cy = (ys[j] + ys[j + 1]) / 2;
          g.append(
            s("rect", {
              class: `ga-cell ${TINTS[(i + j) % 4]}`,
              x: xs[i],
              y: ys[j],
              width: cols[i],
              height: rowH[j],
            }),
          );
          if (check) {
            text(g, cx, cy + 6, "?", { size: 22, weight: 700 });
          } else {
            if (cols[i] > 78 && rowH[j] > 46)
              text(g, cx, cy - 8, `${dec(p)} × ${dec(q)}`, { size: 13, weight: 500 });
            text(g, cx, cy + (cols[i] > 78 && rowH[j] > 46 ? 14 : 6), dec(cells[i][j]), {
              size: 17,
              weight: 700,
            });
          }
        });
      });
      state.bParts.forEach((q, j) =>
        text(g, left - 8, (ys[j] + ys[j + 1]) / 2 + 5, dec(q), {
          size: 15,
          weight: 700,
          anchor: "end",
          cls: "ga-label",
        }),
      );
      g.append(s("rect", { class: "ga-outline", x: left, y: top, width: gridW, height: gridH }));
      const grip = (axis, i, x, y, vertical) => {
        const key = axis === "a" ? "aParts" : "bParts";
        const node = s("g", {
          class: "ga-handle",
          tabindex: "0",
          role: "slider",
          "data-fid": `${axis}-div-${i}`,
          "data-drag": `${axis}:${i}`,
          "aria-label":
            axis === "a"
              ? t("Width divider {n}", { n: i + 1 })
              : t("Height divider {n}", { n: i + 1 }),
          "aria-orientation": vertical ? "vertical" : "horizontal",
          "aria-valuemin": toNumber(sumParts(state[key].slice(0, i))),
          "aria-valuemax": toNumber(sumParts(state[key].slice(0, i + 2))),
          "aria-valuenow": toNumber(sumParts(state[key].slice(0, i + 1))),
          "aria-valuetext": dec(sumParts(state[key].slice(0, i + 1))),
        });
        node.append(
          s("circle", { class: "ga-ring", cx: x, cy: y, r: 22 }),
          s("circle", { class: "ga-hit", cx: x, cy: y, r: 22 }),
          vertical
            ? s("rect", { class: "ga-grip", x: x - 5, y: y - 18, width: 10, height: 36, rx: 5 })
            : s("rect", { class: "ga-grip", x: x - 18, y: y - 5, width: 36, height: 10, rx: 5 }),
        );
        node.addEventListener("keydown", handleKey(axis, i));
        g.append(node);
      };
      for (let i = 0; i < state.aParts.length - 1; i += 1)
        grip("a", i, xs[i + 1], top + gridH / 2, true);
      for (let j = 0; j < state.bParts.length - 1; j += 1)
        grip("b", j, left + gridW / 2, ys[j + 1], false);
      text(g, left + gridW / 2, top + gridH + 22, t("not drawn to scale"), {
        size: 12,
        weight: 500,
        cls: "ga-note",
      });
    }

    function drawBinomial(state) {
      const { W } = ctx;
      const left = 60;
      const top = 48;
      const gridW = Math.min(W - left - 20, 420);
      const cw = gridW / 2;
      const ch = 78;
      const g = ctx.begin(top + 2 * ch + 34);
      const pid = `ga-neg-${(uid += 1)}`;
      g.append(s("defs", {}, s("pattern", { id: pid, width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, s("rect", { width: 8, height: 8, fill: "#fff" }), s("line", { x1: 0, y1: 0, x2: 0, y2: 8, stroke: "#d9533a", "stroke-width": 3 }))));
      const terms = [
        ["x", state.a[0]],
        ["", state.a[1]],
      ];
      const rows = [
        ["x", state.b[0]],
        ["", state.b[1]],
      ];
      const label = (c, v) => polyText({ x2: 0, x1: v ? c : 0, x0: v ? 0 : c }).replace("x²", "x");
      const cellText = (c1, v1, c2, v2) => {
        const c = c1 * c2;
        const degree = (v1 ? 1 : 0) + (v2 ? 1 : 0);
        return {
          c,
          text: polyText({
            x2: degree === 2 ? c : 0,
            x1: degree === 1 ? c : 0,
            x0: degree === 0 ? c : 0,
          }),
          degree,
        };
      };
      terms.forEach(([v, c], i) =>
        text(g, left + cw * i + cw / 2, top - 14, label(c, v), {
          size: 17,
          weight: 700,
          cls: "ga-label",
        }),
      );
      rows.forEach(([v, c], j) =>
        text(g, left - 10, top + ch * j + ch / 2 + 6, label(c, v), {
          size: 17,
          weight: 700,
          anchor: "end",
          cls: "ga-label",
        }),
      );
      terms.forEach(([v1, c1], i) =>
        rows.forEach(([v2, c2], j) => {
          const cell = cellText(c1, v1, c2, v2);
          g.append(
            s("rect", {
              class: `ga-cell ga-cell--deg${cell.degree}`,
              style: cell.c < 0 ? `fill:url(#${pid})` : null,
              x: left + cw * i,
              y: top + ch * j,
              width: cw,
              height: ch,
            }),
          );
          text(
            g,
            left + cw * i + cw / 2,
            top + ch * j + ch / 2 + 7,
            cell.c === 0 ? "0" : cell.text,
            { size: 20, weight: 700, cls: cell.c < 0 ? "ga-halo" : "" },
          );
        }),
      );
      g.append(s("rect", { class: "ga-outline", x: left, y: top, width: gridW, height: 2 * ch }));
      text(g, left + gridW / 2, top + 2 * ch + 24, t("not drawn to scale"), {
        size: 12,
        weight: 500,
        cls: "ga-note",
      });
    }

    function drawEntries(state) {
      const shape = cellKeys(state).join("|");
      if (shape !== entryShape) {
        entryShape = shape;
        inputs.clear();
        entryBox.replaceChildren();
        const make = (id, label, onValue) => {
          const input = h("input", {
            class: "ga-input",
            type: "text",
            inputmode: "decimal",
            "data-fid": `entry-${id}`,
            "aria-label": label,
            size: 8,
            autocomplete: "off",
          });
          input.addEventListener("input", () => {
            const value = parseRational(input.value);
            input.setAttribute("aria-invalid", String(input.value.trim() !== "" && !value));
            onValue(value);
          });
          inputs.set(id, input);
          entryBox.append(h("label", { class: "ga-entry" }, h("span", { text: label }), input));
        };
        state.aParts.forEach((p, i) =>
          state.bParts.forEach((q, j) =>
            make(`${i},${j}`, t("{a} × {b} =", { a: dec(p), b: dec(q) }), (v) =>
              ctx.set((st) => ({ ...st, entries: { ...st.entries, [`${i},${j}`]: v } }), {
                say: false,
              }),
            ),
          ),
        );
        make("total", t("Total area ="), (v) =>
          ctx.set((st) => ({ ...st, total: v }), { say: false }),
        );
      }
      for (const [id, input] of inputs) {
        if (document.activeElement === input) continue;
        const value = id === "total" ? state.total : state.entries[id];
        input.value = value ? dec(value) : "";
      }
    }

    if (check && !binomial) ctx.readout.after(entryBox);

    return {
      render(state) {
        const rows = [];
        if (state.kind === "binomial") {
          drawBinomial(state);
          bin.forEach(({ key, idx, step }) => step.set(state[key][idx]));
          const poly = polyOf(state);
          rows.push(
            h(
              "p",
              { class: "ga-eq" },
              `${factorText(state.a)}${factorText(state.b)}`,
              ...(check ? [] : [h("span", { class: "ga-op", text: "=" }), polyText(poly)]),
            ),
          );
        } else {
          drawNumbers(state);
          wA.split.setAttribute(
            "aria-disabled",
            String(!splitLargest(state.aParts, unitOf(state.a))),
          );
          wA.merge.setAttribute("aria-disabled", String(state.aParts.length < 2));
          hB.split.setAttribute(
            "aria-disabled",
            String(!splitLargest(state.bParts, unitOf(state.b))),
          );
          hB.merge.setAttribute("aria-disabled", String(state.bParts.length < 2));
          place.setAttribute(
            "aria-disabled",
            String(
              placeParts(state.a).length > MAX_PARTS || placeParts(state.b).length > MAX_PARTS,
            ),
          );
          if (!lockFactors) {
            factorInputs[0].value = dec(state.a);
            factorInputs[1].value = dec(state.b);
          }
          const wide = state.aParts.map(dec).join(" + ");
          const tall = state.bParts.map(dec).join(" + ");
          rows.push(h("p", { class: "ga-eq" }, `(${wide}) × (${tall})`));
          if (!check) {
            rows.push(
              h(
                "p",
                { class: "ga-eq" },
                h("span", { class: "ga-op", text: "=" }),
                partials(state).flat().map(dec).join(" + "),
              ),
            );
            rows.push(
              h(
                "p",
                { class: "ga-eq" },
                h("span", { class: "ga-op", text: "=" }),
                dec(totalArea(state)),
              ),
            );
          } else drawEntries(state);
        }
        ctx.readout.replaceChildren(...rows);
      },
    };
  },
};

export function mount(container, config = {}) {
  return createComponent("area-model", container, config, SPEC);
}

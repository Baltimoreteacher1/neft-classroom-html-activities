// Reads a generated `model` back with its own code and returns the exact quantity the picture represents, so the
// test can compare it with meta.shows. Also audits every config value: integers only, rationals as { n, d }.
import assert from "node:assert/strict";
import { Q } from "./exact-math.mjs";

const fromObj = (v) => {
  assert.ok(
    v && Number.isInteger(v.n) && Number.isInteger(v.d) && v.d > 0,
    `rational expected, got ${JSON.stringify(v)}`,
  );
  return new Q(BigInt(v.n), BigInt(v.d));
};
const text = (v) => (v.d === 1n ? String(v.n) : `${v.n}/${v.d}`);
const int = (n) => new Q(BigInt(n));
const total = (list) => list.reduce((s, v) => s.add(v), new Q(0n));

export function auditJson(value, path = "config") {
  if (typeof value === "number")
    assert.ok(Number.isInteger(value), `${path}: floats are not allowed (${value})`);
  else if (Array.isArray(value)) value.forEach((v, i) => auditJson(v, `${path}[${i}]`));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) auditJson(v, `${path}.${k}`);
  else
    assert.ok(
      ["string", "boolean"].includes(typeof value) || value === null,
      `${path}: not plain JSON`,
    );
}

const READERS = {
  "fraction-model": (c) => {
    assert.ok(
      ["bar", "circle", "set"].includes(c.shape) && c.parts >= 1 && c.shaded >= 0,
      "fraction-model fields",
    );
    assert.ok(
      c.wholes * c.parts >= c.shaded && (c.wholes - 1) * c.parts < Math.max(c.shaded, 1),
      "wholes cover the shading",
    );
    return text(new Q(BigInt(c.shaded), BigInt(c.parts)));
  },
  "number-line": (c) => {
    const [min, max, step] = [fromObj(c.min), fromObj(c.max), fromObj(c.step)];
    assert.ok(min.cmp(max) < 0 && step.cmp(new Q(0n)) > 0, "number-line range");
    const inside = (v) => v.cmp(min) >= 0 && v.cmp(max) <= 0;
    for (const p of c.points) assert.ok(inside(fromObj(p.value)), "a point is on the line");
    for (const j of c.jumps || []) {
      const from = fromObj(j.from);
      assert.ok(inside(from) && inside(from.add(fromObj(j.by))), "a jump stays on the line");
    }
    return text(fromObj(c.points[0].value));
  },
  "place-value": (c) => {
    for (const col of c.columns)
      assert.ok(Number.isInteger(col.count) && col.count >= 0, "block count");
    const sum = total(c.columns.map((col) => fromObj(col.unit).mul(int(col.count))));
    return text(c.take ? sum.sub(fromObj(c.take)) : sum);
  },
  array: (c) => {
    assert.ok(c.rows >= 1 && c.cols >= 1, "array size");
    return String(c.rows * c.cols);
  },
  "area-model": (c) => text(total(c.rowParts.map(fromObj)).mul(total(c.colParts.map(fromObj)))),
  "ratio-table": (c) => {
    const ratios = c.columns.map(([a, b]) => new Q(BigInt(a), BigInt(b)));
    assert.ok(
      ratios.every((r) => r.eq(ratios[0])),
      "every table column has the same ratio",
    );
    return text(ratios[0]);
  },
  "double-number-line": (c) => {
    assert.equal(c.top.values.length, c.bottom.values.length, "paired values");
    const ratios = c.top.values.map((t, i) => fromObj(t).div(fromObj(c.bottom.values[i])));
    assert.ok(
      ratios.every((r) => r.eq(ratios[0])),
      "every pair has the same ratio",
    );
    return text(ratios[0]);
  },
  "coordinate-grid": (c) => {
    for (const p of c.points)
      for (const v of [p.x, p.y])
        assert.ok(
          fromObj(v).n === 0n ||
            BigInt(c.extent) * fromObj(v).d >= (fromObj(v).n < 0n ? -fromObj(v).n : fromObj(v).n),
          "point inside the grid",
        );
    return `(${text(fromObj(c.points[0].x))},${text(fromObj(c.points[0].y))})`;
  },
  geometry: (c) => {
    const d = Object.fromEntries(Object.entries(c.dims).map(([k, v]) => [k, fromObj(v)]));
    const key = `${c.shape}/${c.quantity}`;
    const f = {
      "rectangle/area": () => d.l.mul(d.w),
      "rectangle/perimeter": () => new Q(2n).mul(d.l.add(d.w)),
      "triangle/area": () => new Q(1n, 2n).mul(d.b).mul(d.h),
      "circle/r-squared": () => d.r.mul(d.r),
    }[key];
    assert.ok(f, `unknown geometry quantity ${key}`);
    return text(f());
  },
  "solids-nets": (c) => {
    assert.equal(c.solid, "prism");
    return String(
      c.quantity === "volume" ? c.l * c.w * c.h : 2 * (c.l * c.w + c.l * c.h + c.w * c.h),
    );
  },
  "decimal-percent": (c) => {
    assert.ok(c.grid === 100 && c.shaded >= 0 && c.shaded <= 100, "decimal grid");
    return text(new Q(BigInt(c.shaded), 100n));
  },
  "stats-display": (c) => {
    assert.ok(
      ["dot-plot", "bar", "table"].includes(c.display) && c.values.length > 0,
      "stats display",
    );
    return [...c.values].sort((a, b) => a - b).join(",");
  },
};

// A family may add readers for configs of its own in tools/lib/pt-models-<name>.mjs (export READERS = { graphic: fn }).
import { readdirSync } from "node:fs";

for (const file of readdirSync(new URL(".", import.meta.url)).filter((f) =>
  /^pt-models-.+\.mjs$/.test(f),
))
  Object.assign(READERS, (await import(`./${file}`)).READERS);

export function representedBy(model) {
  const read = READERS[model.graphic];
  assert.ok(read, `no reader for graphic ${model.graphic}`);
  auditJson(model.config);
  assert.ok(["explore", "build", "check"].includes(model.config.mode), "config.mode");
  return read(model.config);
}

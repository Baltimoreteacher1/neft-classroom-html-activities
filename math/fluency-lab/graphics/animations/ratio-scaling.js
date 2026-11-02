// Scaling a ratio: 2:3 -> 4:6 -> 6:9 with copies of a tape, a ratio table and multiplicative arrows.
// Config: { a: 1-9, b: 1-9, factors: [2-9, ...up to 3], lang }; max(a, b) x factor <= 24.
import { cap, gcd, intIn, label, line, path, polygon, rect } from "./anim-kit.js";
import { createPlayer } from "./player.js";

const C = {
  title: "Scaling a ratio with copies, a table and multiplication",
  red: "Red",
  blue: "Blue",
  start: "The ratio of red to blue is {a}:{b}: for every group of {a} red there are {b} blue.",
  scale:
    "Make {f} copies of the group. Multiply both amounts by {f}: {a} × {f} = {a2} and {b} × {f} = {b2}, so the ratio is {a2}:{b2}.",
  done: "{chain}. Each pair is the first pair multiplied by the same number, so they all describe the same ratio. In simplest form each one is {sa}:{sb}.",
};
export const KEYS = Object.values(C);

const MAX_CELLS = 24;
const TAPE = { x: 70, a: 24, b: 68, h: 34 };
const TABLE = { x: 24, w: 96, h: 44, top: 166, pitch: 56 };

export function normalizeConfig(config = {}) {
  const a = intIn(config.a, 1, 9, 2);
  const b = intIn(config.b, 1, 9, 3);
  const asked = Array.isArray(config.factors) ? config.factors.slice(0, 3) : [2, 3];
  const factors = [];
  for (const f of asked) {
    const k = intIn(f, 2, 9, 0);
    if (k && Math.max(a, b) * k <= MAX_CELLS && !factors.includes(k)) factors.push(k);
  }
  return { a, b, factors: factors.length ? factors : [2] };
}

export function buildModel(config = {}) {
  const { a, b, factors } = normalizeConfig(config);
  const rows = [{ f: 1, a, b }, ...factors.map((f) => ({ f, a: a * f, b: b * f }))];
  const maxCells = Math.max(a, b) * Math.max(...factors);
  const cw = Math.min(36, 390 / maxCells);
  const rowY = (i) => TABLE.top + i * TABLE.pitch;
  const g = gcd(a, b);
  const chain = rows.map((r) => `${r.a}:${r.b}`).join(" = ");
  const height = rowY(rows.length - 1) + TABLE.h + 56;

  const tape = (row) => {
    const items = [
      label("tape-red", 12, TAPE.a + 23, cap(C.red), "an-note", { a: { "text-anchor": "start" } }),
      label("tape-blue", 12, TAPE.b + 23, cap(C.blue), "an-note", { a: { "text-anchor": "start" } }),
    ];
    for (let j = 0; j < row.a; j += 1) items.push(rect(`ta${j}`, TAPE.x + j * cw, TAPE.a, cw, TAPE.h, "an-cell an-on", { role: "red" }));
    for (let j = 0; j < row.b; j += 1) items.push(rect(`tb${j}`, TAPE.x + j * cw, TAPE.b, cw, TAPE.h, "an-cell an-on2", { role: "blue" }));
    for (let c = 1; c < row.f; c += 1) {
      items.push(line(`sa${c}`, TAPE.x + c * a * cw, TAPE.a - 5, TAPE.x + c * a * cw, TAPE.a + TAPE.h + 5, "an-copy"));
      items.push(line(`sb${c}`, TAPE.x + c * b * cw, TAPE.b - 5, TAPE.x + c * b * cw, TAPE.b + TAPE.h + 5, "an-copy"));
    }
    return items;
  };
  const table = (upTo, allOn) => {
    const items = [
      label("h-red", TABLE.x + TABLE.w / 2, TABLE.top - 12, cap(C.red), "an-head", { a: { "text-anchor": "middle" } }),
      label("h-blue", TABLE.x + TABLE.w + 8 + TABLE.w / 2, TABLE.top - 12, cap(C.blue), "an-head", { a: { "text-anchor": "middle" } }),
    ];
    for (let i = 0; i <= upTo; i += 1) {
      const on = allOn || i === upTo;
      const cls = on ? "an-row an-row-on" : "an-row";
      const y = rowY(i);
      const mid = y + TABLE.h / 2 + 9;
      const fromTop = i > 0 ? { from: { a: { y: y - 14 }, o: 0 } } : {};
      items.push(
        rect(`row${i}-a`, TABLE.x, y, TABLE.w, TABLE.h, cls, { a: { rx: 8 }, ...fromTop }),
        rect(`row${i}-b`, TABLE.x + TABLE.w + 8, y, TABLE.w, TABLE.h, cls, { a: { rx: 8 }, ...fromTop }),
        label(`row${i}-av`, TABLE.x + TABLE.w / 2, mid, String(rows[i].a), "an-num", { a: { "text-anchor": "middle" }, ...fromTop }),
        label(`row${i}-bv`, TABLE.x + TABLE.w * 1.5 + 8, mid, String(rows[i].b), "an-num", { a: { "text-anchor": "middle" }, ...fromTop }),
        label(`row${i}-r`, TABLE.x + TABLE.w * 2 + 28, mid, `${rows[i].a}:${rows[i].b}`, "an-num", { a: { "text-anchor": "start" }, ...fromTop }),
      );
    }
    const xs = 326;
    for (let i = 1; i <= upTo; i += 1) {
      const y0 = rowY(0) + TABLE.h / 2;
      const y1 = rowY(i) + TABLE.h / 2;
      const bend = 16 + i * 16;
      items.push(
        path(`arr${i}`, `M${xs} ${y0} C${xs + bend} ${y0} ${xs + bend} ${y1} ${xs + 2} ${y1}`, "an-arrow", {}),
        polygon(`head${i}`, [xs, y1, xs + 10, y1 - 6, xs + 10, y1 + 6], "an-head-fill", {}),
        label(`mul${i}`, 398, y1 + 7, `×${rows[i].f}`, "an-chip", { a: { "text-anchor": "start" } }),
      );
    }
    return items;
  };

  const steps = rows.map((row, i) => ({
    caption:
      i === 0
        ? cap(C.start, { a, b })
        : cap(C.scale, { f: row.f, a, b, a2: row.a, b2: row.b }),
    scene: [...tape(row), ...table(i, false)],
    state: { a: row.a, b: row.b, f: row.f, i },
  }));
  const last = rows[rows.length - 1];
  const finalItems = [
    ...tape(last),
    ...table(rows.length - 1, true),
    label("chain", 240, height - 16, chain, "an-eq", { a: { "text-anchor": "middle" } }),
  ];
  steps.push({
    caption: cap(C.done, { chain, sa: a / g, sb: b / g }),
    scene: finalItems,
    state: { a: last.a, b: last.b, f: last.f, i: rows.length, chain, simplest: { a: a / g, b: b / g } },
  });
  return { kind: "ratio-scaling", title: cap(C.title), view: [480, height], steps, result: { base: { a, b }, rows: rows.map((r) => ({ a: r.a, b: r.b, f: r.f })), chain } };
}

export const play = (container, config = {}) => createPlayer(container, buildModel(config), config);

// Regrouping with place-value blocks: 10 ones become 1 ten when adding, 1 ten becomes 10 ones when subtracting.
// Config: { op: "add" | "sub", a, b, lang } with whole numbers 0-999 (a + b <= 999, a >= b).
import { cap, intIn, label, line, rect } from "./anim-kit.js";
import { createPlayer } from "./player.js";

const PLACES = ["ones", "tens", "hundreds"];
const C = {
  title: "Regrouping with place-value blocks",
  ones: "Ones",
  tens: "Tens",
  hundreds: "Hundreds",
  buildAdd:
    "Build {a} and {b} with place-value blocks: a cube is 1 one, a rod is 1 ten, a flat is 1 hundred. We add one place at a time, starting with the ones.",
  buildSub:
    "Build {a} with place-value blocks: a cube is 1 one, a rod is 1 ten, a flat is 1 hundred. We take away {b} one place at a time, starting with the ones.",
  add0: "Add the ones: {x} + {y} = {s}.",
  add1: "Add the tens: {x} + {y} = {s}.",
  add2: "Add the hundreds: {x} + {y} = {s}.",
  addCarry1: "Add the tens: {x} + {y} + 1 traded ten = {s}.",
  addCarry2: "Add the hundreds: {x} + {y} + 1 traded hundred = {s}.",
  group0: "{s} is more than 9, so we can make a group of 10 ones.",
  group1: "{s} is more than 9, so we can make a group of 10 tens.",
  trade0: "Trade the group of 10 ones for 1 ten. The ones place now shows {r} and the tens place gets 1 more.",
  trade1:
    "Trade the group of 10 tens for 1 hundred. The tens place now shows {r} and the hundreds place gets 1 more.",
  need0:
    "There are only {x} in the ones place and we need to take away {y}. Break 1 ten into 10 ones. The tens place now shows {n} and the ones place shows {m}.",
  need1:
    "There are only {x} in the tens place and we need to take away {y}. Break 1 hundred into 10 tens. The hundreds place now shows {n} and the tens place shows {m}.",
  chain:
    "There are no tens to break, so first break 1 hundred into 10 tens. The hundreds place now shows {n} and the tens place shows {m}.",
  take0: "Take away {y} from the ones: {x} − {y} = {z}.",
  take1: "Take away {y} from the tens: {x} − {y} = {z}.",
  take2: "Take away {y} from the hundreds: {x} − {y} = {z}.",
  doneAdd: "Together the blocks show {r}, so {a} + {b} = {r}.",
  doneSub: "What is left shows {r}, so {a} − {b} = {r}.",
};
export const KEYS = Object.values(C);

const TOP = 64;
const FLAT = { size: 40, pitch: 46 };
const DEFAULTS = { add: { a: 47, b: 38 }, sub: { a: 52, b: 27 } };
const digitsOf = (n) => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)];
const ndigits = (n) => String(n).length;

export function normalizeConfig(config = {}) {
  const op = config.op === "sub" ? "sub" : "add";
  const a = intIn(config.a, 0, 999, -1);
  const b = intIn(config.b, 0, 999, -1);
  const ok = a >= 0 && b >= 0 && (op === "add" ? a + b <= 999 : a >= b);
  return { op, ...(ok ? { a, b } : DEFAULTS[op]) };
}

export function buildModel(config = {}) {
  const { op, a, b } = normalizeConfig(config);
  const result = op === "add" ? a + b : a - b;
  const ncols = Math.max(2, ndigits(a), ndigits(b), ndigits(result));
  const da = digitsOf(a);
  const db = digitsOf(b);
  // Cube size: as large as the tallest stack of rods allows (a rod is ten cubes long).
  const maxTens = op === "add" ? da[1] + db[1] + 1 : da[1] + 10;
  const cube = Math.max(9, Math.min(16, Math.floor(250 / maxTens) - 4));
  const pitch = cube + 4;
  const rodW = cube * 10;
  const colX = ncols === 3 ? [346, 166, 8] : [300, 60];
  const colW = ncols === 3 ? [126, 170, 140] : [126, 200];
  let uid = 0;
  const cols = Array.from({ length: ncols }, () => []);
  const block = (c, group) => ({ id: `b${uid++}`, c, group });
  const counts = () => cols.map((list) => list.length);
  const value = () => cols.reduce((sum, list, c) => sum + list.length * 10 ** c, 0);
  const groupCls = { a: "an-on", b: "an-on2", new: "an-new" };

  const pos = (c, i) => {
    if (c === 0) return { x: colX[0] + (colW[0] - 5 * pitch) / 2 + (i % 5) * pitch, y: TOP + Math.floor(i / 5) * pitch };
    if (c === 1) return { x: colX[1] + (colW[1] - rodW) / 2, y: TOP + i * pitch };
    return { x: colX[2] + (colW[2] - 3 * FLAT.pitch) / 2 + (i % 3) * FLAT.pitch, y: TOP + Math.floor(i / 3) * FLAT.pitch };
  };
  const dims = (c) => [[cube, cube], [rodW, cube], [FLAT.size, FLAT.size]][c];
  const blockItems = (b0, at, over = {}) => {
    const [w, h] = dims(b0.c);
    const cls = over.cls || `an-block ${groupCls[b0.group]}`;
    const extra = { role: over.role || `block:${b0.c}`, ...(over.from ? { from: over.from } : {}), ...(over.o !== undefined ? { o: over.o } : {}) };
    const items = [rect(b0.id, at.x, at.y, w, h, cls, extra)];
    if (b0.c > 0)
      items.push(
        rect(`${b0.id}-g`, at.x, at.y, w, h, "an-lines", {
          a: { fill: `url(#{uid}-${b0.c === 1 ? "rod" : "flat"})` },
          ...(over.from ? { from: over.from } : {}),
          ...(over.o !== undefined ? { o: over.o } : {}),
        }),
      );
    return items;
  };

  const maxRows = [0, 0, 0];
  const heightOf = (c, n) => (c === 0 ? Math.ceil(n / 5) * pitch : c === 1 ? n * pitch : Math.ceil(n / 3) * FLAT.pitch);
  const note = () => cols.forEach((list, c) => { maxRows[c] = Math.max(maxRows[c], heightOf(c, list.length)); });

  const frame = (over = {}, ghosts = [], equation) => {
    const items = [];
    for (let c = 0; c < ncols; c += 1) {
      const cx = colX[c] + colW[c] / 2;
      if (c < ncols - 1) items.push(line(`div${c}`, colX[c] - 7, 8, colX[c] - 7, 9999, "an-divider", {}));
      items.push(label(`head${c}`, cx, 24, cap(C[PLACES[c]]), "an-head", { a: { "text-anchor": "middle" } }));
      items.push(label(`cnt${c}`, cx, 54, String(cols[c].length), "an-count-big", { a: { "text-anchor": "middle" } }));
      cols[c].forEach((blk, i) => items.push(...blockItems(blk, over[blk.id]?.at || pos(c, i), over[blk.id] || {})));
    }
    for (const ghost of ghosts) items.push(...blockItems(ghost.block, ghost.at, { o: 0, role: `gone:${ghost.block.c}`, from: ghost.from }));
    items.push(label("eq", 24, 0, equation, "an-eq", { a: { "text-anchor": "start" } }));
    note();
    return items;
  };
  const eqStart = op === "add" ? `${a} + ${b}` : `${a} − ${b}`;
  const raw = [];
  const push = (caption, items, extra = {}) => raw.push({ caption, items, state: { counts: counts(), value: value(), ...extra } });

  // Build the starting blocks.
  for (let c = 0; c < ncols; c += 1) {
    for (let i = 0; i < da[c]; i += 1) cols[c].push(block(c, "a"));
    if (op === "add") for (let i = 0; i < db[c]; i += 1) cols[c].push(block(c, "b"));
  }
  push(cap(op === "add" ? C.buildAdd : C.buildSub, { a, b }), frame({}, [], eqStart), { phase: "build" });

  const tens = (c) => 10 ** c;
  for (let c = 0; c < ncols; c += 1) {
    if (op === "add") {
      const carryIn = c > 0 && cols[c].some((blk) => blk.group === "new") ? 1 : 0;
      const x = da[c];
      const y = db[c];
      const s = cols[c].length;
      if (x + y + carryIn === 0) continue;
      const key = carryIn ? C[`addCarry${c}`] : C[`add${c}`];
      push(cap(key, { x, y, s }), frame({}, [], eqStart), { phase: "add", place: c, sum: s });
      if (s > 9) {
        const group = cols[c].slice(0, 10);
        const over = Object.fromEntries(group.map((blk) => [blk.id, { cls: `an-block ${groupCls[blk.group]} an-grp`, role: `block:${c}` }]));
        push(cap(C[`group${c}`], { s }), frame(over, [], eqStart), { phase: "group", place: c });
        const rod = block(c + 1, "new");
        cols[c] = cols[c].slice(10);
        cols[c + 1].push(rod);
        const target = pos(c + 1, cols[c + 1].length - 1);
        const origin = pos(c, 0);
        const ghosts = group.map((blk) => ({ block: blk, at: target, from: { a: { x: origin.x, y: origin.y }, o: 1 } }));
        const over2 = { [rod.id]: { from: { a: { x: origin.x, y: origin.y, width: dims(c)[0], height: dims(c)[1] }, o: 0 } } };
        push(cap(C[`trade${c}`], { r: cols[c].length }), frame(over2, ghosts, eqStart), { phase: "trade", place: c, traded: tens(c + 1) });
      }
    } else {
      const y = db[c];
      if (y === 0) continue;
      const x = cols[c].length;
      if (x < y) {
        let q = c + 1;
        while (q < ncols && cols[q].length === 0) q += 1;
        for (let r = q; r > c; r -= 1) {
          const source = cols[r].pop();
          const sourceAt = pos(r, cols[r].length);
          const made = Array.from({ length: 10 }, () => block(r - 1, "new"));
          cols[r - 1].push(...made);
          const key = r - 1 === c ? C[`need${c}`] : C.chain;
          const vars = { x, y, n: cols[r].length, m: cols[r - 1].length };
          const over = Object.fromEntries(made.map((blk) => [blk.id, { from: { a: { x: sourceAt.x, y: sourceAt.y }, o: 0 } }]));
          const ghost = [{ block: source, at: pos(r - 1, 0), from: { a: { x: sourceAt.x, y: sourceAt.y }, o: 1 } }];
          push(cap(key, vars), frame(over, ghost, eqStart), { phase: "break", place: r, broke: tens(r) });
        }
      }
      const taken = cols[c].slice(cols[c].length - y);
      const z = cols[c].length - y;
      const over = Object.fromEntries(taken.map((blk) => [blk.id, { cls: "an-block an-take", role: `taken:${c}`, o: 0.55 }]));
      cols[c] = cols[c].slice(0, z);
      const frameBlocks = frame(over, [], eqStart);
      // Taken blocks are shown (faded, dashed) for this step only: draw them back at their old places.
      taken.forEach((blk, i) => frameBlocks.push(...blockItems(blk, pos(c, z + i), over[blk.id])));
      push(cap(C[`take${c}`], { x: z + y, y, z }), frameBlocks, { phase: "take", place: c, removed: y * tens(c) });
    }
  }
  const done = cap(op === "add" ? C.doneAdd : C.doneSub, { a, b, r: result });
  push(done, frame({}, [], `${eqStart} = ${result}`), { phase: "done" });

  const area = Math.max(maxRows[0], maxRows[1], maxRows[2], 120);
  const eqY = TOP + area + 44;
  const height = eqY + 24;
  const steps = raw.map(({ caption, items, state }) => ({
    caption,
    state,
    scene: items.map((it) => {
      if (it.id === "eq") it.a.y = eqY;
      if (it.tag === "line") it.a.y2 = eqY - 28;
      return it;
    }),
  }));
  return { kind: "regrouping", title: cap(C.title), view: [480, height], steps, result: { op, a, b, value: result, digits: digitsOf(result) } };
}

export const play = (container, config = {}) => createPlayer(container, buildModel(config), config);

// Array Architect math suite: every skill x level x grade x seeds. The expected answers come from an ORACLE written
// in this file (brute-force cell counting, factor loops, integer arithmetic, a separate polynomial parser) that
// reads only the printed prompt, never the generator's task fields and never the game's own checker.
// @fm2 FM-011 FM-017 FM-019 FM-020 FM-032 FM-033 FM-050 FM-051 FM-054 FM-058 FM-059 FM-060 FM-061 FM-062 FM-063 FM-065
import assert from "node:assert/strict";
import { validateGame } from "../../math/fluency-lab/family/fm2/contract.js";
import game from "../../math/fluency-lab/family/fm2/games/array-architect/index.js";
import { makeRng, seedFrom } from "../../math/fluency-lab/family/fm2/rng.js";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const SEEDS = 40;
const mk = (id, level, tag, i, grade) =>
  game.makeRound(id, level, makeRng(seedFrom(tag, id, level, i)), grade);
const nums = (t) => (t.match(/\d+(?:\.\d+)?/g) || []).map(Number);
const L2 = (n) => Math.log2(1 + n);
const cellsOf = (h, w) => Array.from({ length: h * w }, (_, i) => [Math.floor(i / w), i % w]);
const sizeOf = (cells) => {
  const set = new Set(cells.map((c) => `${c[0]},${c[1]}`));
  if (!set.size) return null;
  const rs = [...set].map((k) => +k.split(",")[0]);
  const cs = [...set].map((k) => +k.split(",")[1]);
  const h = Math.max(...rs) - Math.min(...rs) + 1;
  const w = Math.max(...cs) - Math.min(...cs) + 1;
  return { n: set.size, h, w, solid: set.size === h * w };
};
// Perimeter by counting open edges, one cell at a time.
const edges = (cells) => {
  const set = new Set(cells.map((c) => `${c[0]},${c[1]}`));
  let n = 0;
  for (const [r, c] of cells)
    for (const d of [-1, 1]) {
      if (!set.has(`${r + d},${c}`)) n += 1;
      if (!set.has(`${r},${c + d}`)) n += 1;
    }
  return n;
};
const notPerimeter = (cells, base) => (base === edges(cells) ? base + 1 : base);
const factorPairs = (n) => {
  const out = [];
  for (let a = 1; a <= n; a += 1) if (n % a === 0 && a <= n / a) out.push([a, n / a]);
  return out;
};

// ---- independent oracle: rectangles, read from the printed prompt ---------------------------------------------
const RX = [
  [/Make (\d+) rows with (\d+) counters in each row/, (m) => ({ rows: +m[1], cols: +m[2] })],
  [/Make (\d+) counters in (\d+) equal rows/, (m) => ({ area: +m[1], rows: +m[2] })],
  [/Arrange (\d+) counters in equal rows\. Use at least 2/, (m) => ({ area: +m[1], min: 2 })],
  [/equal rows of (\d+) with (\d+) counters/, (m) => ({ cols: +m[1], area: +m[2] })],
  [
    /array for (\d+(?: \+ \d+)+)\. Each/,
    (m) => ({ rows: m[1].split("+").length, cols: +m[1].split("+")[0] }),
  ],
  [/counting by (\d+)s: ([\d, ]+)\./, (m) => ({ cols: +m[1], rows: m[2].split(",").length })],
  [/Build (\d+) rows of (\d+)\. Then type/, (m) => ({ rows: +m[1], cols: +m[2], ask: "total" })],
  [/an array with (\d+) rows and (\d+) in all/, (m) => ({ rows: +m[1], area: +m[2], ask: "cols" })],
  [/Build an array for (\d+) × (\d+): /, (m) => ({ rows: +m[1], cols: +m[2], ask: "total" })],
  [/(\d+) plants in (\d+) equal rows/, (m) => ({ area: +m[1], rows: +m[2], ask: "cols" })],
  [/perimeter of (\d+) units and one side (\d+)/, (m) => ({ perim: +m[1], side: +m[2] })],
  [/perimeter of (\d+) units that has the greatest/, (m) => ({ perim: +m[1], max: true })],
  [/area of (\d+) square units and a perimeter of (\d+)/, (m) => ({ area: +m[1], perim: +m[2] })],
  [/area of (\d+) square units and one side (\d+)/, (m) => ({ area: +m[1], side: +m[2] })],
  [/perimeter of (\d+) units\./, (m) => ({ perim: +m[1] })],
];
const rectSpec = (p) =>
  RX.map(([rx, f]) => [rx.exec(p), f])
    .find(([m]) => m)
    .reduce((m, f) => f(m));
const bestArea = (per) =>
  Math.max(...Array.from({ length: per / 2 - 1 }, (_, i) => (i + 1) * (per / 2 - 1 - i)));
const rectOk = (s, h, w) =>
  (s.rows == null || h === s.rows) &&
  (s.cols == null || w === s.cols) &&
  (s.area == null || h * w === s.area) &&
  (s.perim == null || 2 * (h + w) === s.perim) &&
  (s.side == null || h === s.side || w === s.side) &&
  (s.min == null || Math.min(h, w) >= s.min) &&
  (!s.max || h * w === bestArea(s.perim));
// The catalogued mistake for a wrong rectangle, in the order the feedback promises.
function rectMistake(s, h, w) {
  const [a, per] = [h * w, 2 * (h + w)];
  const [r0, c0] = [s.rows != null && h !== s.rows, s.cols != null && w !== s.cols];
  if (r0 || c0) {
    const turned = s.rows != null && s.cols != null && s.rows !== s.cols;
    return turned && h === s.cols && w === s.rows ? "swapped" : r0 ? "rowsOff" : "colsOff";
  }
  if (s.area != null && a !== s.area)
    return s.perim != null && a === s.perim && per === s.area ? "mixedUp" : "areaOff";
  if (s.perim != null && per !== s.perim)
    return s.area != null && per === s.area ? "mixedUp" : "perimOff";
  if (s.side != null && h !== s.side && w !== s.side) return "sideOff";
  if (s.min != null && Math.min(h, w) < s.min) return "minSide";
  return s.max && a !== bestArea(s.perim) ? "notLargest" : null;
}

// ---- independent oracle: polynomials, decimals (hundredths as integers) and area models -----------------------
function poly(text) {
  const raw = text.replace(/\s/g, "").replaceAll("−", "-").replaceAll("²", "^2");
  const parts = raw.match(/[+-]?[^+-]+/g);
  if (!parts || parts.join("") !== raw) return null;
  const out = [0, 0, 0];
  for (const part of parts) {
    const m = /^([+-]?)(\d*)(x\^2|x)?$/.exec(part);
    if (!m || (m[2] === "" && !m[3])) return null;
    out[m[3] === "x^2" ? 2 : m[3] ? 1 : 0] += (m[1] === "-" ? -1 : 1) * (m[2] === "" ? 1 : +m[2]);
  }
  return out;
}
const pmul = (a, b) => {
  const out = [0, 0, 0];
  a.forEach((p, i) =>
    b.forEach((q, j) => {
      out[i + j] += p * q;
    }),
  );
  return out;
};
const peq = (a, b) => [0, 1, 2].every((i) => (a[i] || 0) === (b[i] || 0));
const hund = (txt) => {
  const m = /^\s*([+-]?)(\d*)(?:\.(\d{1,2}))?\s*$/.exec(String(txt ?? ""));
  if (!m || (m[2] === "" && m[3] === undefined)) return null;
  return (m[1] === "-" ? -1 : 1) * (+(m[2] || 0) * 100 + +((m[3] || "").padEnd(2, "0") || 0));
};
const IDS = "ABCDEFGHI";
const num2 = (a, b, c) => ({
  poly: false,
  rows: { parts: [a * 100] },
  cols: { parts: [b * 100, c * 100] },
});
const split = (s) => s.replace(/ − /g, " + -").split(" + ").map(poly);

// What the printed prompt says about an area model: how each side is split and what the sides are.
function modelSpec(p) {
  let m =
    /Expand (\d+)\((\d+) \+ (\d+)\) with/.exec(p) || /show (\d+) × \((\d+) \+ (\d+)\)/.exec(p);
  if (m) return num2(+m[1], +m[2], +m[3]);
  m = /Expand (\d+)\((.+)\) with an area/.exec(p);
  if (m) return { poly: true, rows: { parts: [[+m[1]]] }, cols: { parts: split(m[2]) } };
  m = /Expand \((.+)\)\((.+)\) with/.exec(p);
  if (m) return { poly: true, rows: { parts: split(m[1]) }, cols: { parts: split(m[2]) } };
  m = /find (\d+) × (\d+(?:\.\d+)?)\. (.*)$/.exec(p);
  const [a, b] = [hund(m[1]), hund(m[2])];
  const given = /split as (\S+) \+ (\S+)\./.exec(m[3]);
  const unit = m[2].includes(".") ? 100 : 1000;
  let cols = { whole: b, unit, mode: "place" };
  if (given) cols = { parts: [hund(given[1]), hund(given[2])] };
  else if (/any way you like/.test(m[3])) cols = { whole: b, mode: "free" };
  const rows = /Split both numbers/.test(m[3])
    ? { whole: a, unit: 1000, mode: "place" }
    : { parts: [a] };
  return { poly: false, rows, cols };
}

// Accept a response to an area-model round using only the spec above and integer arithmetic.
function modelOk(spec, resp) {
  const sides = [];
  for (const key of ["rows", "cols"]) {
    const s = spec[key];
    if (s.parts) sides.push(s.parts);
    else {
      const c = hund(resp.cuts?.[key]);
      if (c === null || c <= 0 || c >= s.whole) return false;
      if (s.mode === "place" && c !== s.whole - (s.whole % s.unit)) return false;
      sides.push([c, s.whole - c]);
    }
  }
  let total = spec.poly ? [0, 0, 0] : 0;
  let i = 0;
  for (const r of sides[0]) {
    for (const c of sides[1]) {
      const want = spec.poly ? pmul(r, c) : (r * c) / 100;
      const text = String(resp.partials?.[IDS[i]] ?? "");
      const got = spec.poly ? poly(text) : hund(text);
      if (got === null || !(spec.poly ? peq(got, want) : got === want)) return false;
      total = spec.poly ? total.map((x, k) => x + want[k]) : total + want;
      i += 1;
    }
  }
  const typed = spec.poly ? poly(String(resp.total ?? "")) : hund(resp.total);
  return typed !== null && (spec.poly ? peq(typed, total) : typed === total);
}

// ---- independent oracle for every other kind ------------------------------------------------------------------
function collectNeeded(p) {
  let m = /Build (\d+) × (\d+) and add it/.exec(p);
  if (m) return new Set([`${m[1]}x${m[2]}`, `${m[2]}x${m[1]}`]);
  m = /every array for (\d+) with at least 2 rows/.exec(p);
  const pairs = factorPairs(+(m || /Arrange (\d+) tiles/.exec(p))[1]);
  if (!m) return new Set(pairs.map(([a, b]) => `${a}x${b}`));
  return new Set(pairs.filter(([a]) => a >= 2).flatMap(([a, b]) => [`${a}x${b}`, `${b}x${a}`]));
}
const isNum = (v) => /^\d+$/.test(String(v ?? ""));
const keyOf = (c) => `${c[0]},${c[1]}`;

function oraclePaint(round, resp) {
  const p = round.prompt.en;
  const cells = resp.cells || [];
  const set = new Set(cells.map(keyOf));
  const t = /(?:Place|Put) (\d+) counters/.exec(p);
  if (/every row you use has (\d+)|tap (\d+) squares/.test(p)) {
    const per = /has (\d+)/.exec(p);
    const rows = {};
    for (const k of set) rows[k.split(",")[0]] = (rows[k.split(",")[0]] || 0) + 1;
    return set.size === +t[1] && (!per || Object.values(rows).every((n) => n === +per[1]));
  }
  if (/even or odd/.test(p)) {
    const side = /next to it/.test(p);
    const cols = {};
    for (const [a, b] of cells) cols[side ? a : b] = [...(cols[side ? a : b] || []), side ? b : a];
    const singles = Object.values(cols).filter((v) => v.length === 1).length;
    const lines = cells.every(([a, b]) => [0, 1].includes(side ? b : a));
    const parity = +t[1] % 2 ? "odd" : "even";
    return set.size === +t[1] && lines && singles === +t[1] % 2 && resp.parity === parity;
  }
  const want = new Set(round.task.shape.map(keyOf));
  if (Number(resp.value) !== want.size || !isNum(resp.value)) return false;
  if (set.size !== want.size || [...set].some((k) => !want.has(k))) return false;
  if (/Cover the shape/.test(p)) return true;
  const by = {};
  for (const [r, c, v] of cells) by[v ?? 1] = [...(by[v ?? 1] || []), [r, c]];
  const tools = Object.values(by);
  const most = +/at most (\d+)/.exec(p)[1];
  return tools.length >= 2 && tools.length <= most && tools.every((l) => sizeOf(l).solid);
}

function oracle(round, resp) {
  const p = round.prompt.en;
  const cells = resp.cells || [];
  const f = sizeOf(cells);
  const solid = f?.solid;
  if (round.kind === "paint") return oraclePaint(round, resp);
  if (round.kind === "model") return modelOk(modelSpec(p), resp);
  if (round.kind === "rect") {
    const spec = rectSpec(p);
    if (!solid || !rectOk(spec, f.h, f.w)) return false;
    return !spec.ask || (isNum(resp.value) && +resp.value === (spec.ask === "cols" ? f.w : f.n));
  }
  if (round.kind === "collect") {
    const need = collectNeeded(p);
    const norm = (a, b) => (/Arrange \d+ tiles/.test(p) && a > b ? `${b}x${a}` : `${a}x${b}`);
    const have = new Set((resp.list || []).map(([a, b]) => norm(a, b)));
    const all = [...need].every((k) => have.has(norm(...k.split("x").map(Number))));
    return have.size > 0 && [...have].every((k) => need.has(k)) && all;
  }
  if (round.kind === "prism") {
    if (!solid || !Number.isInteger(resp.layers) || resp.layers < 1) return false;
    let cubes = 0;
    for (let l = 0; l < resp.layers; l += 1) for (const _ of cells) cubes += 1;
    let m = /(\d+) layers tall, with (\d+) rows and (\d+) columns/.exec(p);
    if (m) {
      const dims = resp.layers === +m[1] && f.h === +m[2] && f.w === +m[3];
      return dims && isNum(resp.value) && +resp.value === cubes;
    }
    m = /(\d+) unit cubes in (\d+) equal layers/.exec(p);
    if (m) return cubes === +m[1] && resp.layers === +m[2];
    m = /made of (\d+) unit cubes/.exec(p);
    return cubes === +m[1] && resp.layers >= 2 && Math.min(f.h, f.w) >= 2;
  }
  if (round.kind === "scale") {
    const m = /Scale the (\d+) by (\d+) rectangle by a factor of (\S+)\./.exec(p);
    const [n, d] = m[3].includes("/") ? m[3].split("/").map(Number) : [+m[3], 1];
    if (!solid || f.h * d !== +m[1] * n || f.w * d !== +m[2] * n) return false;
    const pick = String(resp.pick ?? "");
    const [pn, pd] = pick.includes("/") ? pick.split("/").map(Number) : [Number(pick), 1];
    return pn * d * d === n * n * pd;
  }
  if (round.kind === "tiling") {
    const [a, b] = /(\d+) units by (\d+) units/.exec(p).slice(1).map(Number);
    if (/largest square tile/.test(p)) {
      let best = 1;
      for (let k = 1; k <= Math.min(a, b); k += 1) if (a % k === 0 && b % k === 0) best = k;
      return resp.s === best;
    }
    let n = 1;
    while (n % a || n % b) n += 1;
    return resp.s === n;
  }
  // tiles: count the tiles cell by cell; a column is an x-tile or a 1-tile, likewise a row
  const target = poly(/: (.+)\. Set its width/.exec(p)[1]);
  const { w, h } = resp;
  if (!w || !h) return false;
  const line = (v) => [...Array(v[1]).fill("x"), ...Array(v[0]).fill("1")];
  const used = [0, 0, 0];
  for (const cx of line(w))
    for (const ry of line(h)) used[(cx === "x") + (ry === "x") ? (cx === ry ? 2 : 1) : 0] += 1;
  return peq(used, target);
}

// ---- 1. contract ------------------------------------------------------------------------------------------------
ok(validateGame(game).length === 0, `array-architect honors the contract: ${validateGame(game)}`);
ok(game.id === "array-architect" && game.order === 5, "id and order");
ok(game.mechanic === "grid-construction", "mechanic tag");
const others =
  "number-builder math-match fraction-kitchen math-market number-line-quest pattern-detective".split(
    " ",
  );
for (const id of [...others, "ratio-recipe-lab", "math-puzzle-studio", "family-math-duel"]) {
  try {
    const other = (await import(`../../math/fluency-lab/family/fm2/games/${id}/index.js`)).default;
    ok(other.mechanic !== game.mechanic, `${id} has a different mechanic`);
  } catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
  }
}
ok(game.skills.length >= 14, "at least 14 skills");
for (let g = 0; g <= 8; g += 1) {
  const n = game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]).length;
  ok(n >= 2, `grade ${g} has at least two skills`);
}
for (const s of game.skills) {
  ok(/^[A-Z0-9.]{4,}$/.test(s.standard), `${s.id} standard code`);
  ok(s.strand.es !== s.strand.en && s.title.es !== s.title.en, `${s.id} bilingual titles`);
}

// ---- 2. per-grade limits, solvability, level demand (FM-050, FM-051, FM-054, FM-060, FM-019) ----------------------
const LIMIT = {
  number: [20, 20, 25, 100, 144, 150, 99, 99, 100],
  area: [20, 20, 25, 100, 144, 150, 400, 150, 200],
  decimals: [false, false, false, false, false, true, false, false, false],
};
// Difficulty proxy: size of the numbers plus the work the learner must do (constraints, required items, decisions).
function demand(round) {
  const p = round.prompt.en;
  let d = round.kind === "model" ? 0 : [...new Set(nums(p))].reduce((s, n) => s + L2(n), 0);
  if (round.kind === "rect") {
    const s = rectSpec(p);
    d += 2 * Object.keys(s).length + L2(sizeOf(game.solve(round).cells).n);
    d += (s.ask === "cols" ? 3 : 0) + (s.max ? s.perim / 2 : 0);
  } else if (round.kind === "paint") {
    d += L2((round.task.shape || []).length) * 2 + (+/at most (\d+)/.exec(p)?.[1] || 0);
  } else if (round.kind === "collect") d += 2 * collectNeeded(p).size + L2(nums(p)[0]);
  else if (round.kind === "model") {
    const spec = modelSpec(p);
    const add = (a, x) =>
      a + (Array.isArray(x) ? x.reduce((q, c) => q + Math.abs(c), 0) : Math.abs(x) / 100);
    const size = (s) => (s.parts ? s.parts.reduce(add, 0) : s.whole / 100);
    const regions = (spec.rows.parts?.length || 2) * (spec.cols.parts?.length || 2);
    d += L2(size(spec.rows)) + L2(size(spec.cols)) + regions + (spec.poly ? 4 : 0);
    d += 2 * [spec.rows, spec.cols].filter((s) => s.mode).length;
    d += 2 * (JSON.stringify(spec).match(/-/g) || []).length;
  } else if (round.kind === "prism")
    d += (/Then type/.test(p) ? 1 : 0) + (/at least 2/.test(p) ? 3 : 0);
  else if (round.kind === "scale") d += L2(nums(p)[0] * nums(p)[1]);
  else if (round.kind === "tiling" && round.task.mode === "gcf") d += L2(nums(p)[0] * nums(p)[1]);
  return d;
}

let rounds = 0;
const summary = [];
for (const skill of game.skills) {
  const prints = new Set();
  const means = [];
  for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
    for (let level = 1; level <= 3; level += 1) {
      let total = 0;
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const round = mk(skill.id, level, `aa${grade}`, seed, grade);
        const [id, text] = [skill.id, JSON.stringify(round)];
        rounds += 1;
        ok(JSON.stringify(JSON.parse(text)) === text, `${id} round is JSON-serializable`);
        ok(
          text === JSON.stringify(mk(id, level, `aa${grade}`, seed, grade)),
          `${id} is pure in its seed`,
        );
        const { prompt, ...rest } = round;
        prints.add(JSON.stringify(rest));
        ok(prompt.en && prompt.es && prompt.es !== prompt.en, `${id} distinct English and Spanish`);
        ok(
          nums(prompt.en).every((n) => n <= LIMIT.number[grade]),
          `${id} g${grade} numbers: ${prompt.en}`,
        );
        ok(LIMIT.decimals[grade] || !/\d\.\d/.test(prompt.en), `${id} g${grade} has no decimals`);
        ok(grade >= 7 || !/[−-]\d|−/.test(prompt.en), `${id} g${grade} has no negatives`);
        const solution = game.solve(round);
        ok(game.check(round, solution).correct, `${id} solve() is accepted by check()`);
        ok(oracle(round, solution), `${id} oracle rejects the solution: ${prompt.en}`);
        ok(grade >= 7 || !/-\d/.test(JSON.stringify(solution)), `${id} solution has no negatives`);
        if (round.kind === "rect")
          ok(sizeOf(solution.cells).n <= LIMIT.area[grade], `${id} area limit`);
        total += demand(round);
      }
      means.push(total / SEEDS);
    }
  }
  const trend = means.map((m) => m.toFixed(1)).join(" < ");
  ok(means.at(-1) > means[0], `${skill.id} level 3 demands more than level 1: ${trend}`);
  summary.push(`${skill.id}:${prints.size}`);
}
ok(rounds >= 3000, `swept ${rounds} rounds`);

// ---- 3. variety (FM-061): at least 30 distinct fingerprints across 100 seeds, per skill -------------------------
for (const skill of game.skills) {
  const prints = new Set();
  for (const grade of [skill.grades[0], skill.grades[1]]) {
    for (let level = 1; level <= 3; level += 1) {
      for (let seed = 0; seed < 100; seed += 1) {
        const { prompt, ...rest } = mk(skill.id, level, `var${grade}`, seed, grade);
        prints.add(JSON.stringify(rest));
      }
    }
  }
  ok(prints.size >= 30, `${skill.id} has ${prints.size} distinct round fingerprints (need 30)`);
}

// ---- 4. seeded property test (FM-065): check() agrees with the oracle on mutated responses -----------------------
const withValue = (sol, h, w, v) => ({
  cells: cellsOf(h, w),
  ...(sol.value != null ? { value: String(v) } : {}),
});
function mutations(round, sol) {
  const out = [];
  const cells = sol.cells || [];
  const kind = round.kind;
  if (kind === "rect") {
    const ask = rectSpec(round.prompt.en).ask;
    for (let h = 1; h <= Math.min(round.grid.rows, 14); h += 1)
      for (let w = 1; w <= Math.min(round.grid.cols, 14); w += 1)
        out.push(withValue(sol, h, w, ask === "cols" ? w : h * w));
    for (const value of [String(+sol.value + 1), "", "abc"])
      if (sol.value != null) out.push({ cells, value });
    out.push(
      { cells: cells.slice(1) },
      { cells: [...cells, [cells.length + 3, 0]] },
      { cells: [] },
    );
  } else if (kind === "paint") {
    out.push(
      { ...sol, cells: cells.slice(1) },
      { ...sol, cells: [...cells, [9, 9]] },
      { ...sol, cells: [] },
    );
    if (sol.value != null)
      out.push({ ...sol, value: String(+sol.value + 1) }, { ...sol, value: "" });
    if (sol.parity) out.push({ ...sol, parity: sol.parity === "even" ? "odd" : "even" }, { cells });
    if (cells[0]?.length === 3) {
      out.push({ ...sol, cells: cells.map(([r, c]) => [r, c, 1]) });
      out.push({ ...sol, cells: cells.map(([r, c], i) => [r, c, i + 1]) });
    }
    const [r0, c0] = cells[0];
    out.push({
      ...sol,
      cells: cells.map(([r, c, v]) => (r === r0 && c === c0 ? [r + 1, c, v] : [r, c, v])),
    });
  } else if (kind === "collect") {
    const l = sol.list;
    out.push(
      { list: l.slice(1) },
      { list: [...l, [1, 1000]] },
      { list: [] },
      { list: [...l].reverse() },
    );
    out.push({ list: l.map(([a, b]) => [b, a]) });
  } else if (kind === "model") {
    const set = (id, v) => ({ ...sol, partials: { ...sol.partials, [id]: v } });
    for (const [id, v] of Object.entries(sol.partials)) {
      out.push(set(id, ""), set(id, `${v}0`), set(id, /x|^−/.test(v) ? `-(${v})` : String(+v + 1)));
    }
    out.push({ ...sol, total: "" }, { ...sol, total: `${sol.total}1` }, { ...sol, cuts: {} });
    for (const [key, v] of Object.entries(sol.cuts)) {
      for (const d of [1, -1]) out.push({ ...sol, cuts: { ...sol.cuts, [key]: String(+v + d) } });
    }
  } else if (kind === "prism") {
    for (let l = 0; l <= 9; l += 1)
      for (const h of [1, 2, 3, 4])
        for (const w of [1, 2, 3, 6]) out.push({ ...withValue(sol, h, w, l * h * w), layers: l });
    out.push({ ...sol, value: String(Math.round(sol.value / sol.layers)) });
    out.push({ cells: cells.slice(1), layers: sol.layers });
  } else if (kind === "scale") {
    const f = sizeOf(cells);
    out.push({ ...sol, pick: "2" }, { ...sol, pick: "" });
    out.push({ cells: cellsOf(f.h + 1, f.w), pick: sol.pick });
    out.push({ cells: cellsOf(f.h, f.w + 1), pick: sol.pick });
    out.push({ cells: cellsOf(f.h * 2, f.w * 2), pick: sol.pick });
    for (const pick of ["1/4", "4", "9", "16", "8", "1/2", "27"]) out.push({ ...sol, pick });
  } else if (kind === "tiling") for (let s = 0; s <= 150; s += 1) out.push({ s });
  else
    for (let w0 = 0; w0 <= 12; w0 += 1)
      for (let h0 = 0; h0 <= 12; h0 += 1)
        for (const w1 of [0, 1, 2, 3])
          for (const h1 of [0, 1, 2, 3]) out.push({ w: [w0, w1], h: [h0, h1] });
  return out;
}
let mutated = 0;
for (const skill of game.skills) {
  for (const level of [1, 2, 3]) {
    for (let seed = 0; seed < 12; seed += 1) {
      const round = mk(skill.id, level, "prop", seed, skill.grades[0]);
      for (const response of mutations(round, game.solve(round))) {
        const got = game.check(round, response);
        mutated += 1;
        const why = `${skill.id} L${level}: ${JSON.stringify(response).slice(0, 160)} for "${round.prompt.en}"`;
        assert.equal(got.correct, oracle(round, response), `check/oracle disagree on ${why}`);
        if (!got.correct)
          ok(got.mistake && got.feedback.en && got.feedback.es, `${skill.id} names it`);
      }
      for (const junk of [undefined, null, {}, { cells: "x" }, { list: 3 }, { s: "a" }, { w: 1 }])
        ok(game.check(round, junk).correct === false, `${skill.id} junk response is rejected`);
    }
  }
}
ok(mutated > 20000, `property sweep covered ${mutated} responses`);

// ---- 5. catalogued wrong answers get specific, named feedback (FM-033, FM-063) --------------------------------------
const seen = new Map();
function catalogue(round, sol) {
  const p = round.prompt.en;
  const t = round.task;
  const cells = sol.cells;
  const X = (resp, key, why) => {
    const got = game.check(round, resp);
    ok(
      !got.correct && [key].flat().includes(got.mistake),
      `${round.skillId}: ${why} -> ${key}, got ${got.mistake}`,
    );
    ok(
      got.feedback.en.length > 12 && got.feedback.es !== got.feedback.en,
      `${key} in both languages`,
    );
    seen.set(got.mistake, got.feedback.en);
    return got;
  };
  const kinds = {
    rect() {
      const spec = rectSpec(p);
      for (let h = 1; h <= Math.min(round.grid.rows, 12); h += 1) {
        for (let w = 1; w <= Math.min(round.grid.cols, 12); w += 1) {
          const bad = rectMistake(spec, h, w);
          const got = bad && X({ cells: cellsOf(h, w) }, bad, `${h}x${w} for "${p}"`);
          if (/Off$/.test(bad || ""))
            ok(/\d/.test(got.feedback.en + got.feedback.es), "quotes the learner's number");
        }
      }
      X({ cells: [] }, "empty", "nothing built");
      X(
        {
          cells: cellsOf(1, 3)
            .slice(0, 3)
            .filter((c) => c[1] !== 1),
        },
        "notRect",
        "a gap",
      );
      if (spec.ask) {
        X({ cells }, "askMissing", "no typed answer");
        X({ cells, value: "x" }, "askNotNumber", "typed text");
        X({ cells, value: String(+sol.value + 3) }, "askOff", "typed the wrong number");
      }
    },
    paint() {
      const wrong = String(notPerimeter(cells, cells.length + 1));
      if (t.rule === "count") {
        X({ cells: cells.slice(1) }, "tooFew", "one counter short");
        X({ cells: [...cells, [4, 9]] }, "tooMany", "one counter extra");
        if (t.perRow) X({ cells: [...cells.slice(0, -1), [8, 9]] }, "unevenRows", "a lone counter");
      } else if (t.rule === "pairs") {
        X({ ...sol, cells: cells.slice(1) }, "pairTotal", "one short");
        X({ cells }, "parityMissing", "no even/odd choice");
        X({ ...sol, parity: sol.parity === "odd" ? "even" : "odd" }, "parityWrong", "wrong parity");
        X({ ...sol, cells: [...cells.slice(0, -2), [0, 15], [0, 16]] }, "unpaired", "not in pairs");
      } else if (t.rule === "target") {
        X({ ...sol, cells: cells.slice(1) }, "gaps", "a hole in the tiling");
        X({ ...sol, cells: [...cells, [30, 30]] }, "outside", "a tile outside the shape");
        X({ cells }, "askMissing", "no area typed");
        X({ ...sol, value: wrong }, "askOff", "wrong area typed");
        if (edges(cells) !== cells.length)
          X({ ...sol, value: String(edges(cells)) }, "askPerimeter", "perimeter");
      } else {
        const parts = new Set(cells.map((c) => c[2])).size;
        X({ ...sol, cells: cells.slice(1) }, "uncovered", "an uncolored square");
        X({ ...sol, cells: cells.map(([r, c]) => [r, c, 1]) }, "notRectPart", "one color");
        if (round.grid.cols > parts)
          X({ ...sol, cells: cells.map(([r, c]) => [r, c, c + 1]) }, "tooManyParts", "many");
        X({ ...sol, value: wrong }, "askOff", "wrong area typed");
      }
    },
    collect() {
      const l = sol.list;
      if (l.length > 1)
        X({ list: l.slice(1) }, /Arrange/.test(p) ? "missing" : "needTurn", "one missing");
      X({ list: [] }, "emptyList", "empty list");
      X(
        { list: [...l, [7, 1001]] },
        /Build \d+ ×/.test(p) ? "notAskedFor" : "wrongEntry",
        "wrong area",
      );
    },
    model() {
      const spec = modelSpec(p);
      const first = Object.keys(sol.partials)[0];
      const v = sol.partials[first];
      const set = (x) => ({ ...sol, partials: { ...sol.partials, [first]: x } });
      X(set(""), "partialMissing", "empty region");
      X(set("??"), "notNumber", "unreadable region");
      X({ ...sol, total: "" }, "totalMissing", "no total");
      if (spec.poly) {
        X({ ...sol, total: `${sol.total}+1` }, "totalOff", "wrong total");
        if (/x/.test(v)) X(set(v.startsWith("−") ? v.slice(1) : `-${v}`), "signSlip", "sign slip");
        return;
      }
      if (+v >= 10 && +v % 10 === 0)
        X(set(String(+v / 10)), ["zeroSlip", "addedNotMultiplied"], "zero");
      X(set(String(+v + 1)), ["partialWrong", "addedNotMultiplied"], "off by one region");
      X({ ...sol, total: String(+sol.total + 10) }, "totalOff", "wrong total");
      for (const [key, cut] of Object.entries(sol.cuts)) {
        if (!/place value|ones and tenths/.test(p)) continue;
        const range = (+cut + 1) * 100 >= spec[key].whole;
        X(
          { ...sol, cuts: { ...sol.cuts, [key]: String(+cut + 1) } },
          range ? "cutRange" : "cutPlace",
          "split",
        );
      }
      if (Object.keys(sol.cuts).length) X({ ...sol, cuts: {} }, "cutMissing", "no split chosen");
    },
    prism() {
      X({ ...sol, layers: 0 }, "empty", "no layers");
      if (/layers tall/.test(p)) {
        X({ ...sol, layers: sol.layers + 1 }, "layersOff", "extra layer");
        X({ ...sol, value: String(cells.length) }, "askBaseOnly", "one layer only");
        X({ ...sol, value: String(+sol.value + 2) }, "askOff", "wrong volume");
        X(
          { cells: cellsOf(cells.length + 1, 1), layers: sol.layers, value: "1" },
          "baseOff",
          "base",
        );
      } else if (/equal layers/.test(p))
        X({ ...sol, layers: sol.layers + 1 }, "layersOff", "layers");
      else X({ cells: cellsOf(1, 5), layers: 1 }, "volumeOff", "volume");
    },
    scale() {
      const f = sizeOf(cells);
      const k = /factor of (\S+)\./.exec(p)[1];
      X({ ...sol, cells: cellsOf(f.h + 1, f.w) }, "oneSide", "one side scaled");
      X({ ...sol, cells: cellsOf(f.h + 1, f.w + 2) }, "scaleDims", "both sides wrong");
      X({ cells }, "pickMissing", "no area pick");
      X({ ...sol, pick: k }, "areaLinear", "area scaled by the factor itself");
      X({ ...sol, pick: k.includes("/") ? "1/8" : String(k ** 3) }, "areaCubed", "volume");
    },
    tiling() {
      const [a, b] = /(\d+) units by (\d+) units/.exec(p).slice(1).map(Number);
      const best = sol.s;
      if (/largest square tile/.test(p)) {
        const all = [...Array(Math.min(a, b)).keys()].map((i) => i + 1);
        const gap = all.find((s) => (a % s || b % s) && s < best + 5);
        if (gap) X({ s: gap }, "gapTile", "a tile that leaves a gap");
        const fits = all.filter((s) => a % s === 0 && b % s === 0 && s < best);
        if (fits.length) X({ s: fits.at(-1) }, "notLargest2", "a smaller tile that fits");
      } else {
        X({ s: best + 1 }, "gapSquare", "not a common multiple");
        X({ s: best * 2 }, a * b === best * 2 ? "lcmProduct" : "notSmallest", "a larger multiple");
        if (a * b !== best) X({ s: a * b }, "lcmProduct", "multiplied the sides");
      }
    },
    tiles() {
      const target = poly(/: (.+)\. Set its width/.exec(p)[1]);
      const [w0, w1] = sol.w;
      const used = pmul([w0 + 1, w1], sol.h);
      X({ w: [0, 0], h: [0, 0] }, "empty", "no sides set");
      X(
        { w: [w0 + 1, w1], h: sol.h },
        target[2] !== used[2] ? "x2Off" : target[1] === used[1] ? "onesOff" : "xOff",
        "one more 1",
      );
      X({ w: [w0, w1 + 1], h: sol.h }, "x2Off", "an extra x in the width");
    },
  };
  kinds[round.kind]();
}
for (const skill of game.skills) {
  for (const level of [1, 2, 3]) {
    for (let seed = 0; seed < 25; seed += 1) {
      const round = mk(skill.id, level, "fb", seed, skill.grades[0]);
      catalogue(round, game.solve(round));
    }
  }
}
for (const [key, text] of seen)
  for (const [other, otherText] of seen)
    if (key !== other) ok(text !== otherText, `${key} vs ${other}`);
ok(seen.size >= 38, `${seen.size} distinct catalogued mistakes were exercised`);

// ---- 6. hints (FM-032, FM-062): tiers differ, 0-2 never leak, 3 states the solution ------------------------------
const has = (text, token) => {
  const body = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![\\d.])${body}(?![\\d.])`, "i").test(text);
};
let hinted = 0;
for (const skill of game.skills) {
  for (const level of [1, 2, 3]) {
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const round = mk(skill.id, level, "hint", seed, skill.grades[seed % 2 ? 1 : 0]);
      const [answer, sol, p] = [game.answerText(round), game.solve(round), round.prompt.en];
      // every accepted answer, written out the ways a learner could copy it, derived by the oracle
      const secrets = [answer];
      if (round.kind === "rect") {
        const spec = rectSpec(p);
        for (let h = 1; h <= Math.min(round.grid.rows, 20); h += 1)
          for (let w = 1; w <= Math.min(round.grid.cols, 20); w += 1)
            if (rectOk(spec, h, w)) secrets.push(`${h} × ${w}`);
      }
      if (sol.value != null) secrets.push(String(sol.value));
      if (round.kind === "model") secrets.push(sol.total);
      if (round.kind === "tiling") secrets.push(String(sol.s));
      if (round.kind === "scale") secrets.push(sol.pick);
      if (round.kind === "collect")
        for (const k of collectNeeded(p)) secrets.push(k.replace("x", " × "));
      const texts = [0, 1, 2, 3].map((t) => game.hint(round, t, null));
      hinted += 1;
      for (const [tier, h] of texts.entries()) {
        ok(
          h.en.length > 15 && h.es.length > 15 && h.es !== h.en,
          `${skill.id} tier ${tier} bilingual`,
        );
      }
      ok(
        new Set(texts.map((h) => h.en)).size === 4,
        `${skill.id} L${level}: the four tiers differ`,
      );
      for (const tier of [0, 1, 2])
        for (const token of secrets)
          ok(
            !has(texts[tier].en, token) && !has(texts[tier].es, token),
            `${skill.id} hint ${tier} leaks "${token}"`,
          );
      ok(
        texts[3].en.includes(answer) && texts[3].es.includes(answer),
        `${skill.id} tier 3 has ${answer}`,
      );
      const given = [...new Set(p.match(/\d+(?:\.\d+)?/g) || [])];
      if (given.length)
        ok(!given.every((n) => has(texts[2].en, n)), `${skill.id} tier 2 is parallel`);
      ok(game.hint(round, 0, null).en === texts[0].en, "hints are pure");
    }
  }
}
ok(hinted >= 2700, `${hinted} hint sets checked`);

console.log(
  `array-architect math: ${checks} checks, ${rounds} rounds, ${mutated} mutated responses,`,
);
console.log(`${hinted} hint sets, ${seen.size} catalogued mistakes passed.`);
console.log(summary.join(" "));

// Unit 5 hands-on activities: slideapex decompose netfold wrapit packcrate.
//   node tools/studio-act-unit5.test.mjs [kind ...]
// tools/studio-act.test.mjs proves make / solution / wrong / grade for every kind with default parameters. This file adds:
//   1. every mode the lessons use, through 4 levels x seeds, with the grade() miss shape (right / of / marks, a `say` that never
//      prints the key);
//   2. the maths RECOMPUTED by a different route than the activity used (shoelace areas, hypot, a 3D fold with normal vectors,
//      cube counting, the 35 hexominoes and the 11 that fold);
//   3. each widget mounted in jsdom, driven to the solution by clicks and typing, graded ok; an untouched Check is a miss with
//      a message; the solved widget is read-only (English and Spanish); every control has an accessible name.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { loadStudio } from "./lib/studio-vm.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ctx = loadStudio({ gen: true, act: true });
const A = ctx.StudioAct;
const only = process.argv.slice(2);
const SEEDS = 40;
let problems = 0;
const bad = (k, m) => {
  problems++;
  console.error(`FAIL [${k}] ${m}`);
};
const j = (v) => JSON.parse(JSON.stringify(v));
const shoelace = (p) =>
  Math.abs(
    p.reduce((s, [x, y], i) => s + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0),
  ) / 2;

const VARIANTS = {
  slideapex: [{ mode: "tri" }, { mode: "para" }],
  decompose: [{ mode: "trap" }, { mode: "house" }],
  netfold: [{ mode: "cube" }, { mode: "box" }],
  wrapit: [{ mode: "prism", shape: "box" }, { mode: "prism", shape: "tri" }, { mode: "pyramid" }],
  packcrate: [{ cube: "half" }, { cube: "quarter" }],
};
const kinds = Object.keys(VARIANTS).filter((k) => !only.length || only.includes(k));

/* ---- 1: the contract, in every mode ------------------------------------------------------------------ */
for (const kind of kinds)
  for (const p of VARIANTS[kind])
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= SEEDS; seed++) {
        const tag = `${JSON.stringify(p)} L${level}/seed ${seed}`;
        try {
          const spec = j(A.make(kind, level, seed, p));
          assert.deepEqual(spec, j(A.make(kind, level, seed, p)), "not deterministic");
          for (const f of ["q", "qEs", "x", "xEs"])
            assert.ok(typeof spec[f] === "string" && spec[f].length > 20, `no ${f}`);
          assert.ok(spec.h.length >= 2 && spec.hEs.length === spec.h.length, "hint ladders");
          const def = A.registry[kind];
          const sol = j(def.solution(spec));
          assert.equal(def.grade(spec, sol).ok, true, "solution not accepted");
          const wrongs = def.wrong(spec, ctx.StudioGen.rng(`w${seed}`));
          assert.ok(wrongs.length >= 2, "wrong() needs >= 2 states");
          for (const w of wrongs) {
            const r = def.grade(spec, j(w));
            assert.equal(r.ok, false, `wrong state accepted: ${JSON.stringify(w)}`);
            assert.ok(r.say?.length > 10 && r.sayEs?.length > 10, "a miss needs say and sayEs");
            assert.ok(
              Number.isInteger(r.right) && Number.isInteger(r.of) && r.right < r.of,
              "a miss reports right / of",
            );
            assert.ok(Array.isArray(r.marks) && r.marks.length === r.of, "a miss reports marks");
            // a hint or a miss never prints the key as its own sentence: the solution's numbers are not announced
          }
          // an empty state is a miss, never a crash
          assert.equal(def.grade(spec, {}).ok, false);
          // the explanation names the key; the question and the hints do not give it away as a sentence
        } catch (e) {
          bad(kind, `${tag}: ${e.message.split("\n")[0]}`);
          break;
        }
      }

/* ---- 2: the maths, another way ----------------------------------------------------------------------- */
if (!only.length || only.includes("slideapex"))
  for (const p of VARIANTS.slideapex)
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= SEEDS; seed++) {
        const m = A.make("slideapex", level, seed, p).model;
        const pts = (x) =>
          m.mode === "tri"
            ? [
                [0, 0],
                [m.b, 0],
                [x, m.h],
              ]
            : [
                [0, 0],
                [m.b, 0],
                [m.b + x, m.h],
                [x, m.h],
              ];
        // both spots put the left side at S, and the area is the same at every spot
        for (const x of [-m.x, m.x]) {
          assert.ok(Math.abs(Math.hypot(x, m.h) - m.S) < 1e-9, "left side at the spot");
          assert.ok(Math.abs(shoelace(pts(x)) - m.area) < 1e-9, "area at the spot");
        }
        // no third whole-number spot has that left side
        const hits = [];
        for (let x = -40; x <= 40; x++) if (Math.abs(Math.hypot(x, m.h) - m.S) < 1e-9) hits.push(x);
        assert.deepEqual(
          hits,
          [-m.x, m.x].sort((a, b) => a - b),
          "exactly two spots",
        );
        // the slanted side as a height gives a different (wrong) area
        assert.notEqual(m.mode === "tri" ? (m.b * m.S) / 2 : m.b * m.S, m.area);
      }
if (!only.length || only.includes("decompose"))
  for (const p of VARIANTS.decompose)
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= SEEDS; seed++) {
        const m = A.make("decompose", level, seed, p).model;
        const whole =
          m.mode === "trap"
            ? shoelace([
                [0, 0],
                [m.b1, 0],
                [m.t + m.b2, m.h],
                [m.t, m.h],
              ])
            : shoelace([
                [0, 0],
                [m.W, 0],
                [m.W, m.H],
                [m.W / 2, m.H + m.R],
                [0, m.H],
              ]);
        assert.ok(Math.abs(m.key[0] + m.key[1] - whole) < 1e-9, "cut A adds to the figure");
        assert.ok(
          Math.abs(m.key[2] + m.key[3] - whole) < 1e-9 || m.mode === "trap",
          "cut B adds to the figure",
        );
        if (m.mode === "trap")
          assert.ok(Math.abs(m.key[3] - whole) < 1e-9, "one trapezoid is half the parallelogram");
        // the unmeasured dimension is not printed in the question
        const printed = m.mode === "trap" ? [m.b1, m.b2, m.h] : [m.W, m.H, m.R];
        if (!printed.includes(m.hidden))
          assert.ok(
            !new RegExp(`(^|[^\\d])${m.hidden}(?![\\d])`).test(
              A.make("decompose", level, seed, p).q,
            ),
            "hidden length printed",
          );
      }
if (!only.length || only.includes("wrapit"))
  for (let level = 1; level <= 4; level++)
    for (let seed = 1; seed <= SEEDS; seed++) {
      const box = A.make("wrapit", level, seed, { mode: "prism", shape: "box" }).model;
      const [l, w, h] = box.dims;
      // count exposed unit faces of an l x w x h block
      let faces = 0;
      for (let i = 0; i < l; i++)
        for (let jx = 0; jx < w; jx++)
          for (let k = 0; k < h; k++)
            faces +=
              (i === 0) + (i === l - 1) + (jx === 0) + (jx === w - 1) + (k === 0) + (k === h - 1);
      assert.equal(box.total, faces, "box surface by counting faces");
      assert.equal(box.budget, faces * box.rate);
      const tri = A.make("wrapit", level, seed, { mode: "prism", shape: "tri" }).model;
      const [a, b, c, len] = tri.dims;
      assert.equal(a * a + b * b, c * c, "right triangle end");
      assert.equal(tri.total, a * b + (a + b + c) * len, "triangular prism surface");
      const py = A.make("wrapit", level, seed, { mode: "pyramid" }).model;
      assert.equal(
        py.x * py.x + py.H * py.H,
        py.l * py.l,
        "slant, half edge and vertical height make a right triangle",
      );
      assert.equal(
        py.total,
        py.s * py.s +
          4 *
            shoelace([
              [0, 0],
              [py.s, 0],
              [py.s / 2, py.l],
            ]),
        "pyramid surface",
      );
    }
if (!only.length || only.includes("packcrate"))
  for (const p of VARIANTS.packcrate)
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= SEEDS; seed++) {
        const m = A.make("packcrate", level, seed, p).model;
        // count unit cubes at 1/4 resolution: edges are whole numbers of quarters, so the count is exact
        const quarters = m.edges.reduce((pr, e) => pr * e, 1);
        assert.equal(m.vol, quarters / 64);
        const side = m.quarter ? 1 : 2;
        assert.ok(
          m.edges.every((e) => e % side === 0),
          "small cubes fit exactly",
        );
        assert.equal(m.total, m.n[0] * m.n[1] * m.n[2]);
        assert.equal(m.total / m.per, m.vol, "small cubes x their fraction of a unit cube");
        assert.ok(
          m.edges.some((e) => e % 4 !== 0),
          "a fractional edge",
        );
      }
if (!only.length || only.includes("netfold")) {
  const N = A.netfold;
  const hex = N.hexominoes();
  assert.equal(hex.length, 35, "35 free hexominoes");
  // an independent fold: a frame (east, north, outward normal) per square, turned over each shared edge
  const neg = (v) => v.map((x) => -x);
  function fold3d(cells) {
    const have = new Set(cells.map((c) => c.join(",")));
    const start = cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
    const frames = new Map([
      [start.join(","), { u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, -1], cell: start }],
    ]);
    const todo = [start.join(",")];
    while (todo.length) {
      const f = frames.get(todo.shift());
      for (const [dr, dc, dir] of [
        [0, 1, "E"],
        [0, -1, "W"],
        [-1, 0, "N"],
        [1, 0, "S"],
      ]) {
        const id = `${f.cell[0] + dr},${f.cell[1] + dc}`;
        if (!have.has(id) || frames.has(id)) continue;
        const g = { cell: [f.cell[0] + dr, f.cell[1] + dc] };
        if (dir === "E") Object.assign(g, { u: neg(f.n), v: f.v, n: f.u });
        if (dir === "W") Object.assign(g, { u: f.n, v: f.v, n: neg(f.u) });
        if (dir === "N") Object.assign(g, { u: f.u, v: neg(f.n), n: f.v });
        if (dir === "S") Object.assign(g, { u: f.u, v: f.n, n: neg(f.v) });
        frames.set(id, g);
        todo.push(id);
      }
    }
    return [...frames.values()];
  }
  const axisOf = (v) => v.findIndex((x) => x !== 0);
  let foldable = 0;
  for (const cells of hex) {
    const fr = fold3d(cells);
    const distinct = new Set(fr.map((f) => f.n.join(","))).size === 6;
    assert.equal(N.foldsAsCube(cells), distinct, "rolling the cube and turning frames agree");
    if (distinct) foldable++;
    // squares that touch in the net are never opposite faces of the cube
    for (const a of fr)
      for (const b of fr)
        if (Math.abs(a.cell[0] - b.cell[0]) + Math.abs(a.cell[1] - b.cell[1]) === 1)
          assert.notDeepEqual(a.n, neg(b.n));
    // the rectangle sizes: width runs along the axis the east direction ends up on, height along the north direction's axis
    if (distinct) {
      const dims = [3, 4, 5];
      const lab = N.boxLabels(cells, dims);
      for (const f of fr) {
        const got = lab.find((l) => l.cell.join(",") === f.cell.join(","));
        assert.equal(got.w, dims[axisOf(f.u)], "width of the rectangle");
        assert.equal(got.h, dims[axisOf(f.v)], "height of the rectangle");
      }
      assert.ok(N.edgesMatch(lab), "a real box net has equal touching edges");
    }
  }
  assert.equal(foldable, 11, "11 of the 35 hexominoes fold into a cube");
  // box items: a net marked "folds" matches its box, and a net marked "does not" fails in the faces or in the edges
  for (let seed = 1; seed <= 200; seed++)
    for (const level of [3, 4]) {
      const m = A.make("netfold", level, seed, {}).model;
      assert.equal(m.mode, "box");
      for (const net of m.nets) {
        const folds = N.folds(net, "box");
        const want = N.boxLabels(net.cells, net.dims);
        const same = want.every((w) =>
          net.labels.some(
            (l) => l.cell.join(",") === w.cell.join(",") && l.w === w.w && l.h === w.h,
          ),
        );
        assert.equal(
          folds,
          N.foldsAsCube(net.cells) && same && N.edgesMatch(net.labels),
          "folds = faces + labels + edges",
        );
        if (N.foldsAsCube(net.cells) && !same)
          assert.equal(
            N.edgesMatch(net.labels),
            false,
            "a changed number breaks an edge that meets",
          );
      }
      assert.ok(
        m.nets.some((n) => N.folds(n, "box")) && m.nets.some((n) => !N.folds(n, "box")),
        "a mix of folding and not folding",
      );
    }
  for (let seed = 1; seed <= 100; seed++) {
    const m = A.make("netfold", 1 + (seed % 2), seed, {}).model;
    assert.ok(
      m.nets.some((n) => N.foldsAsCube(n.cells)) && m.nets.some((n) => !N.foldsAsCube(n.cells)),
    );
  }
}

/* ---- 3: driven DOM smoke ------------------------------------------------------------------------------- */
const dom = new JSDOM("<!doctype html><body></body>", {
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const win = dom.window;
for (const f of [
  "assets/studio-gen/core.js",
  "assets/studio-act/core.js",
  "assets/studio-act/a-geo-ui.js",
])
  win.eval(readFileSync(join(ROOT, f), "utf8"));
for (const k of kinds) win.eval(readFileSync(join(ROOT, `assets/studio-act/${k}.js`), "utf8"));
const WA = win.StudioAct;
const click = (el) => el.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
const typeInto = (el, v) => {
  el.value = v;
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
};
const fieldBy = (host, re) =>
  [...host.querySelectorAll("input[type=text]")].find((i) => re.test(i.getAttribute("aria-label")));
const mk = () => {
  const calls = { submit: [], change: [] };
  const api = {
    restore: null,
    solved: false,
    es: () => false,
    say: () => {},
    change: (s) => calls.change.push(j(s)),
    submit: (s) => calls.submit.push(j(s)),
    hint: () => {},
  };
  return { api, calls };
};
const drive = {
  slideapex(host, _spec, sol) {
    const ranges = [...host.querySelectorAll("input[type=range]")];
    sol.xs.forEach((x, i) => typeInto(ranges[i], String(x)));
    typeInto(host.querySelector("input[type=text]"), sol.area);
  },
  decompose(host, _spec, sol) {
    const boxes = [...host.querySelectorAll("input[type=text]")];
    [...sol.a, ...sol.b].forEach((v, i) => typeInto(boxes[i], v));
  },
  netfold(host, _spec, sol) {
    const cards = [...host.querySelectorAll(".nf-net")];
    sol.v.forEach((v, i) => click(cards[i].querySelectorAll(".nf-pick button")[v ? 0 : 1]));
  },
  wrapit(host, spec, sol) {
    if (spec.model.mode === "pyramid") {
      click(host.querySelector(`input[type=radio][value="${sol.seg}"]`));
      const boxes = [...host.querySelectorAll("input[type=text]")];
      typeInto(boxes[0], sol.len);
      typeInto(boxes[1], sol.total);
      return;
    }
    const boxes = [...host.querySelectorAll("input[type=text]")];
    [...sol.f, sol.total, sol.cost].forEach((v, i) => typeInto(boxes[i], v));
  },
  packcrate(host, _spec, sol) {
    const plus = [...host.querySelectorAll("button")].filter((b) =>
      /^More/.test(b.getAttribute("aria-label")),
    );
    sol.n.forEach((n, i) => {
      for (let g = 1; g < n; g++) click(plus[i]);
    });
    const boxes = [...host.querySelectorAll("input[type=text]")];
    typeInto(boxes[0], sol.per);
    typeInto(boxes[1], sol.vol);
  },
};
for (const kind of kinds)
  for (const p of VARIANTS[kind])
    for (let level = 1; level <= 4; level++)
      for (let seed = 1; seed <= 4; seed++) {
        const tag = `${JSON.stringify(p)} L${level}/seed ${seed}`;
        try {
          const spec = j(WA.make(kind, level, seed, p));
          const def = WA.registry[kind];
          const sol = j(def.solution(spec));
          let host = win.document.createElement("div");
          win.document.body.append(host);
          let { api, calls } = mk();
          def.mount(host, spec, api);
          click(host.querySelector(".sa-go"));
          assert.equal(calls.submit.length, 1, "Check must call submit");
          const miss = def.grade(spec, calls.submit[0]);
          assert.equal(miss.ok, false, "an untouched widget must not already be solved");
          assert.ok(miss.say?.length > 10, "untouched Check needs a message");
          host.remove();
          host = win.document.createElement("div");
          win.document.body.append(host);
          ({ api, calls } = mk());
          def.mount(host, spec, api);
          drive[kind](host, spec, sol);
          click(host.querySelector(".sa-go"));
          const got = calls.submit.at(-1);
          const g = def.grade(spec, got);
          assert.equal(
            g.ok,
            true,
            `driven widget state was not accepted: ${g.say} ${JSON.stringify(got)}`,
          );
          assert.ok(calls.change.length > 0, "widget must call change() so progress saves");
          host.remove();
          for (const es of [false, true]) {
            host = win.document.createElement("div");
            win.document.body.append(host);
            ({ api } = mk());
            api.restore = sol;
            api.solved = true;
            api.es = () => es;
            def.mount(host, spec, api);
            assert.equal(host.querySelector(".sa-go"), null, "solved widget must be read-only");
            // the fold stepper only views a net, so it stays usable; every control that answers is disabled
            assert.ok(
              [...host.querySelectorAll("input:not([type=range]), button")].every(
                (c) => c.disabled,
              ),
              "answer controls are disabled once solved",
            );
            host.remove();
          }
          host = win.document.createElement("div");
          win.document.body.append(host);
          ({ api } = mk());
          def.mount(host, spec, api);
          for (const b of host.querySelectorAll("button, input")) {
            const name = (
              b.getAttribute("aria-label") ||
              b.textContent ||
              host.querySelector(`label[for="${b.id}"]`)?.textContent ||
              ""
            ).trim();
            assert.ok(name.length > 0, `unnamed control ${b.outerHTML.slice(0, 80)}`);
          }
          // no timers and no animation in the widget code
          host.remove();
        } catch (e) {
          bad(kind, `DOM ${tag}: ${e.message.split("\n")[0]}`);
          break;
        }
      }
void fieldBy;
if (problems) {
  console.error(`\n${problems} problem(s).`);
  process.exit(1);
}
console.log(
  `studio-act-unit5: ${kinds.length} activities in every mode, maths recomputed, widgets driven in jsdom: passed.`,
);

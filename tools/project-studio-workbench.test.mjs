/** Pure-logic tests for the Project Studio workbench: undo/redo, checkpoints, linked models, save tolerance. */
import assert from "node:assert/strict";
import {
  countTwoWays,
  fractionCheck,
  netCheck,
  plotIntent,
  quad,
  roleCheck,
  substitution,
  tableCheck,
  unitCheck,
} from "../curriculum/projects/studio/builders.mjs";
import {
  addCheckpoint,
  changedFields,
  cleanCheckpoints,
  MAX_CHECKPOINTS,
  reasonFrames,
  removeCheckpoint,
  restoreDesign,
} from "../curriculum/projects/studio/checkpoints.mjs";
import * as X from "../curriculum/projects/studio/exact.mjs";
import { V2_FAMILIES } from "../curriculum/projects/studio/feedback.mjs";
import { createHistory } from "../curriculum/projects/studio/history.mjs";
import { fieldsFor, model } from "../curriculum/projects/studio/math.mjs";
import {
  equivalenceRows,
  hasModels,
  modelsHTML,
  testInputs,
} from "../curriculum/projects/studio/models.mjs";
import { graphGeometry, graphPoint } from "../curriculum/projects/studio/models-algebra.mjs";
import { PLANE, planePoint } from "../curriculum/projects/studio/models-space.mjs";
import { getProject, PROJECTS } from "../curriculum/projects/studio/projects.mjs";
import { clean, fresh } from "../curriculum/projects/studio/state.mjs";
import { attachExtras } from "../curriculum/projects/studio/workbench.js";
import { Rat } from "../scripts/lib/rational.mjs";

// ---- history
{
  const h = createHistory({ a: 1 });
  assert.equal(h.undo(), null, "nothing to undo at the start");
  assert.equal(h.record({ a: 1 }), false, "an unchanged design is not a step");
  h.record({ a: 2 });
  h.record({ a: 3 });
  assert.deepEqual(h.undo(), { a: 2 });
  assert.deepEqual(h.undo(), { a: 1 });
  assert.equal(h.canUndo(), false);
  assert.deepEqual(h.redo(), { a: 2 });
  h.record({ a: 9 });
  assert.equal(h.canRedo(), false, "a new edit clears redo");
  const typing = createHistory({ a: "1" });
  for (const v of ["12", "123"]) typing.record({ a: v }, "field-a");
  assert.deepEqual(typing.undo(), { a: "1" }, "typing in one field is a single undo step");
  const limited = createHistory({ n: 0 }, 3);
  for (let i = 1; i <= 10; i++) limited.record({ n: i });
  assert.equal(limited.steps().undo, 3, "history is bounded");
  const snap = { a: 1 };
  const alias = createHistory(snap);
  snap.a = 5;
  assert.deepEqual(
    alias.record({ a: 2 }) && alias.undo(),
    { a: 1 },
    "snapshots do not alias live state",
  );
}

// ---- checkpoints
const p = getProject("unit-4-a");
{
  let r = addCheckpoint(p, [], {
    name: "  First try  ",
    reason: "I changed the discount.",
    design: p.defaults,
    matched: 3,
  });
  assert.equal(r.entry.id, "cp-1");
  assert.equal(r.entry.name, "First try");
  r = addCheckpoint(p, r.list, {
    name: "",
    reason: "",
    design: { ...p.defaults, b: 30 },
    matched: 99,
  });
  assert.equal(r.entry.id, "cp-2");
  assert.equal(r.entry.name, "Checkpoint 2");
  assert.equal(r.entry.matched, 6, "matched count is clamped");
  assert.deepEqual(restoreDesign(r.list, "cp-1"), { a: "60", b: "25", c: "4", d: "65" });
  assert.equal(restoreDesign(r.list, "cp-9"), null);
  assert.deepEqual(
    changedFields(p, r.list[0].design, r.list[1].design).map((f) => f.key),
    ["b"],
  );
  const removed = removeCheckpoint(r.list, "cp-1");
  assert.equal(
    addCheckpoint(p, removed, { name: "x", reason: "", design: p.defaults, matched: 0 }).entry.id,
    "cp-3",
    "ids never repeat",
  );
  assert.ok(
    addCheckpoint(p, [], {
      name: "bad",
      reason: "",
      design: { ...p.defaults, b: 5000 },
      matched: 0,
    }).error,
    "an invalid design cannot be saved",
  );
  let full = [];
  for (let i = 0; i < MAX_CHECKPOINTS; i++)
    full = addCheckpoint(p, full, {
      name: `c${i}`,
      reason: "",
      design: p.defaults,
      matched: 0,
    }).list;
  assert.ok(
    addCheckpoint(p, full, { name: "one more", reason: "", design: p.defaults, matched: 0 }).error,
  );
  const dirty = cleanCheckpoints(p, [
    r.list[0],
    { id: "x" },
    null,
    { id: "cp-5", design: { a: "1" } },
    { ...r.list[1], name: "n".repeat(200), reason: "r".repeat(900) },
    { ...r.list[0] },
  ]);
  assert.equal(dirty.length, 2, "malformed and duplicate entries are dropped");
  assert.equal(dirty[1].name.length, 40);
  assert.equal(dirty[1].reason.length, 500);
  assert.deepEqual(cleanCheckpoints(p, "nope"), []);
  assert.ok(
    reasonFrames(p, "es").some((f) => f.startsWith("Cambié")),
    "Spanish frames exist",
  );
  assert.ok(reasonFrames(p, "en")[0] === p.discourse[0], "the mission's own frame comes first");
  // old code (state.mjs clean) ignores the additive field and keeps every existing field
  const state = { ...fresh(p), checkpoints: r.list, workbench: { bin: 2 }, claim: "keep me" };
  const old = clean(p, JSON.parse(JSON.stringify(state)));
  assert.equal(old.claim, "keep me");
  assert.equal(old.version, 1);
  assert.equal("checkpoints" in old, false, "state.mjs does not need to know the new field");
}

// ---- models: linked to one design, reveal only after a match
for (const project of PROJECTS.filter((x) => V2_FAMILIES.includes(x.family))) {
  assert.ok(hasModels(project));
  const hidden = modelsHTML(project, project.defaults, { reveal: () => false });
  const shown = modelsHTML(project, project.defaults, {
    reveal: () => true,
    builder: { A: "1", B: "1" },
  });
  assert.match(hidden, /<svg|<table/, `${project.id} draws models`);
  assert.notEqual(hidden, shown, `${project.id}: values appear after checks match`);
  const next = {
    ...project.defaults,
    ...(project.family === "statistics"
      ? { data: "4, 6, 6, 8, 10, 15" }
      : { a: Number(project.defaults.a) + 1 }),
  };
  assert.notEqual(
    modelsHTML(project, next, { reveal: () => false }),
    hidden,
    `${project.id}: models redraw when a quantity changes`,
  );
  assert.match(
    modelsHTML(project, { ...project.defaults, a: "x", data: "x" }, { reveal: () => false }),
    /Check these inputs/,
    `${project.id}: invalid input is explained, not drawn`,
  );
  assert.equal(/<script|onerror/i.test(hidden + shown), false);
}
{
  // a hidden value is really absent: ratio table scaled cells hold ?, not the product
  const r = getProject("unit-3-a");
  const hidden = modelsHTML(r, r.defaults, { reveal: () => false });
  assert.ok(
    !hidden.includes("<td>18</td>") && !hidden.includes("<td>12</td></tr><tr>"),
    "scaled quantities are not printed before the checks match",
  );
  const revealed = modelsHTML(r, r.defaults, {
    reveal: (id) => id === "scale-a" || id === "scale-b",
  });
  assert.ok(revealed.includes("<td>18</td>") && revealed.includes("<td>12</td>"));
  // equivalence builder, recomputed by hand
  const e = getProject("unit-6-a");
  const v = model(e, e.defaults).values; // a=4 b=3 c=5 d=2 -> 4(x+3)+4
  assert.deepEqual(testInputs(v.c), [2, 3, 4]);
  assert.deepEqual(
    equivalenceRows(v, 4, 16).map((x) => [x.x, x.original, x.same]),
    [
      [2, 24, true],
      [3, 28, true],
      [4, 32, true],
    ],
  );
  assert.deepEqual(
    equivalenceRows(v, 4, 12).map((x) => x.same),
    [false, false, false],
  );
  assert.deepEqual(
    equivalenceRows(v, NaN, 16).map((x) => x.same),
    [false, false, false],
  );
  assert.ok(
    !testInputs(6).includes(6) && !testInputs(6).includes(7),
    "test inputs avoid the check inputs",
  );
}

// ---- stage 3C: exact arithmetic, builders, plane and graph geometry, reveal rules, save tolerance
{
  // exact.mjs agrees with the independent Rat class on parsing and arithmetic
  for (const text of ["12", "-2.5", ".5", "3/4", "-3/4", "2 1/2", "-2 1/2", "0.125", "7 / 8"]) {
    const mine = X.parse(text);
    const clean = text.replace(/\s*\/\s*/, "/");
    const mixed = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(clean);
    const ref = mixed
      ? new Rat(BigInt(mixed[2]) * BigInt(mixed[4]) + BigInt(mixed[3]), BigInt(mixed[4]))
      : clean.includes("/")
        ? new Rat(BigInt(clean.split("/")[0]), BigInt(clean.split("/")[1]))
        : Rat.fromDecimal(clean.startsWith(".") ? `0${clean}` : clean);
    const signed = mixed?.[1] ? ref.neg() : ref;
    assert.ok(mine && mine.n === signed.n && mine.d === signed.d, `exact parse of "${text}"`);
  }
  for (const bad of ["", "abc", "1/0", "1e3", "2 1/", "--1", "$5", "5%", "1,5"])
    assert.equal(X.parse(bad), null, `"${bad}" is rejected`);
  assert.ok(
    X.eq(X.add(X.parse("0.1"), X.parse("0.2")), X.parse("0.3")),
    "0.1 + 0.2 equals 0.3 exactly",
  );
  assert.ok(!X.eq(X.parse("0.30000000000000004"), X.parse("0.3")), "near is not equal");
  assert.equal(X.show(X.parse("1/3")), "1/3");
  assert.equal(X.show(X.parse("3/4")), "0.75");
}
{
  // unit check names the specific mix-up (area vs perimeter vs volume vs cost)
  const right = { A: "m2", B: "m", C: "m3", D: "usd" };
  assert.equal(unitCheck("area", right).ok, true);
  const bad = unitCheck("area", { ...right, B: "m2" });
  assert.equal(bad.ok, false, "perimeter in square meters is flagged");
  assert.match(bad.rows[1].text, /perimeter[^.]*square meters|distance around/i);
  assert.match(unitCheck("area", { ...right, C: "m2" }).rows[2].text, /cubic/);
  assert.match(unitCheck("area", { ...right, A: "m" }).rows[0].text, /length/);
  assert.match(unitCheck("area", { ...right, D: "m2" }).rows[3].text, /money|dollars/);
  assert.equal(unitCheck("area", {}).complete, false);
}
{
  // net check: the edges that fold together must match; nothing about the checks' answers is printed
  const v = { a: 6, b: 4, c: 3 };
  assert.equal(netCheck(v, false, { A: "6", B: "3", C: "4", D: "3" }).ok, true);
  assert.match(netCheck(v, false, { A: "6", B: "3", C: "4", D: "3" }).lines[0], /six faces/);
  assert.match(netCheck(v, true, { A: "6", B: "3", C: "4", D: "3" }).lines[0], /five-face/);
  const swapped = netCheck(v, false, { A: "4", B: "3", C: "6", D: "3" });
  assert.equal(swapped.ok, false);
  assert.match(swapped.lines.join(" "), /base's other edge/);
  assert.match(
    netCheck(v, false, { A: "6", B: "3", C: "4", D: "2" }).lines.join(" "),
    /upright edge/,
  );
  assert.match(netCheck(v, false, { A: "6", B: "2", C: "4", D: "3" }).lines.join(" "), /gave 2/);
  assert.equal(netCheck(v, false, { A: "6" }).complete, false);
  assert.equal(netCheck(v, false, { A: "x", B: "3", C: "4", D: "3" }).ok, false);
}
{
  // plot intent: sign and swap slips are named
  const v = { a: -4, b: 3, c: 6 };
  assert.equal(plotIntent(v, { A: "-4", B: "3", C: "6" }).ok, true);
  assert.match(plotIntent(v, { A: "4", B: "3", C: "6" }).lines[0], /opposite sign[^.]*y-axis/);
  assert.match(plotIntent(v, { A: "-4", B: "-3", C: "6" }).lines[0], /opposite sign[^.]*x-axis/);
  assert.match(plotIntent(v, { A: "3", B: "-4", C: "6" }).lines[0], /swapped/);
  assert.match(plotIntent(v, { A: "-4", B: "3", C: "-6" }).lines[0], /other side of the y-axis/);
  assert.equal(quad(-4, 3), "Quadrant II");
  assert.equal(quad(4, -3), "Quadrant IV");
  assert.equal(quad(0, 3), "the y-axis");
}
{
  // substitution: exact, and numeric left values appear only after the matching checks
  const v = { a: 7, b: 5, c: 4 };
  const right = substitution(v, { A: "7" });
  assert.deepEqual(
    right.rows.map((r) => r.ok),
    [true, true, true, false],
  );
  assert.match(right.summary, /opens both locks/);
  assert.match(right.summary, /At the boundary value/);
  assert.ok(
    !right.rows[0].text.includes("(left side"),
    "left value hidden before the check matches",
  );
  const shown = substitution(v, { A: "7" }, { substitution: true, difference: true });
  assert.match(shown.rows[0].text, /left side 12/);
  assert.match(shown.rows[1].text, /left side 28/);
  assert.deepEqual(
    substitution(v, { A: "8" }).rows.map((r) => r.ok),
    [false, false, true, true],
  );
  assert.match(substitution(v, { A: "8" }).summary, /neither lock/);
  assert.match(substitution(v, { A: "12" }).summary, /neither lock/);
  assert.equal(substitution({ a: 3, b: 1, c: 2 }, { A: "3" }).rows[0].ok, true);
  assert.equal(
    substitution({ a: 3, b: 1, c: 2 }, { A: "6/2" }).rows[1].ok,
    true,
    "6/2 is exactly 3",
  );
  assert.equal(
    substitution({ a: 0.5, b: 1, c: 2 }, { A: "1/2" }).rows[0].ok,
    true,
    "1/2 equals 0.5 exactly",
  );
  assert.equal(substitution(v, { A: "banana" }).complete, false);
  assert.equal(substitution(v, {}).complete, false);
}
{
  // table consistency and variable roles
  const v = { a: 12, b: 20 };
  assert.equal(tableCheck(v, { A: "56", B: "68", C: "80" }).ok, true);
  assert.match(
    tableCheck(v, { A: "56", B: "68", C: "81" }).lines[0],
    /by 12 from x = 3 to 4 but by 13/,
  );
  assert.match(tableCheck(v, { A: "50", B: "58", C: "66" }).lines[0], /grows by 8 each row/);
  assert.match(
    tableCheck(v, { A: "60", B: "72", C: "84" }).lines[0],
    /implies a starting amount of 24/,
  );
  assert.equal(tableCheck(v, { A: "56" }).complete, false);
  const p = { id: "unit-9-a" };
  assert.equal(roleCheck(p, { D: "x", E: "y" }).ok, true);
  assert.match(roleCheck(p, { D: "y", E: "x" }).lines[0], /calculated FROM weeks/);
  assert.match(roleCheck(p, { D: "x", E: "x" }).lines[0], /two different quantities/);
  assert.equal(roleCheck(p, {}).complete, false);
}
{
  // counting a stage two ways, and the discount as a fraction
  const v = { a: 4, b: 3 };
  assert.equal(countTwoWays(v, { A: "5", B: "23", C: "23" }).ok, true);
  assert.match(countTwoWays(v, { A: "5", B: "23", C: "20" }).lines[0], /differ by 3/);
  assert.match(
    countTwoWays(v, { A: "5", B: "35", C: "35" }).lines[0],
    /5 groups of 4 tiles and 3 extra/,
  );
  assert.equal(countTwoWays(v, { A: "13", B: "1", C: "1" }).complete, false, "stage out of range");
  const s = { d: 15 };
  assert.match(fractionCheck(s, { A: "3", B: "20" }).lines[0], /lowest terms/);
  assert.match(fractionCheck(s, { A: "15", B: "100" }).lines[0], /simplified/);
  assert.match(
    fractionCheck(s, { A: "1", B: "5" }).lines[0],
    /20% of the subtotal, but this discount is 15%/,
  );
  assert.equal(fractionCheck(s, { A: "1", B: "0" }).complete, false);
}
{
  // pointer geometry: the plane and the graph map pixels to the same grid the model draws
  for (const [x, y] of [
    [-10, -10],
    [0, 0],
    [10, 10],
    [-4, 3],
    [6, -7],
  ])
    assert.deepEqual(
      planePoint(PLANE.center + x * PLANE.unit + 3, PLANE.center - y * PLANE.unit - 3),
      { x, y },
    );
  assert.deepEqual(planePoint(-500, 900), { x: -10, y: -10 }, "clamped to the plane");
  const v = { a: 12, b: 20, c: 6 };
  const g = graphGeometry(v);
  assert.deepEqual(graphPoint(v, g.left + 3 * g.sx, g.top + g.h - 56 * g.sy), { x: 3, y: 56 });
  assert.equal(graphPoint(v, 0, 0).x, 0, "clamped at x = 0");
}
for (const project of PROJECTS.filter((x) =>
  [
    "area",
    "coordinates",
    "equations",
    "relationships",
    "solids",
    "discovery",
    "synthesis",
  ].includes(x.family),
)) {
  // hidden models never print the value a check asks for; the revealed ones do
  const m = model(project, project.defaults);
  const hidden = modelsHTML(project, project.defaults, { reveal: () => false });
  const text = hidden.replace(/<[^>]+>/g, " ");
  const checkText = {
    area: ["rectangle", "composite", "surface"],
    solids: ["volume", "surface"],
    equations: ["substitution"],
    relationships: ["target"],
    discovery: ["target", "repair"],
    synthesis: ["subtotal", "total"],
    coordinates: ["distance"],
  }[project.family];
  for (const id of checkText) {
    const answer = m.checks.find((q) => q.id === id).answer;
    const tag = new RegExp(
      `(?:Rectangle|Combined floor|Area|Volume|total|cost|Drawing|Visitor's count|left side|Distance)[^<]{0,40}\\b${String(Number(answer.toFixed(2))).replace(".", "\\.")}\\b`,
    );
    assert.ok(
      !tag.test(text.replace(/\s+/g, " ")),
      `${project.id}: hidden model does not print ${id}`,
    );
  }
  const shown = modelsHTML(project, project.defaults, {
    reveal: () => true,
    builder: {},
    mover: "B",
  });
  assert.notEqual(shown, hidden);
  assert.ok(!/NaN|undefined|Infinity/.test(hidden + shown), `${project.id}: no broken numbers`);
  assert.ok(
    /aria-label=/.test(hidden) && (hidden.match(/<svg/g) || []).length >= 1,
    `${project.id}: drawings carry labels`,
  );
  // minimum and maximum designs still draw
  for (const field of Object.keys(project.defaults)) {
    for (const edge of ["min", "max"]) {
      const f = fieldsFor(project).find((x) => x.key === field);
      const design = { ...project.defaults, [field]: f[edge] };
      assert.doesNotThrow(
        () => modelsHTML(project, design, { reveal: () => true, builder: {}, mover: "A" }),
        `${project.id} ${field}=${f[edge]}`,
      );
    }
  }
}
{
  // the additive save field keeps only known builder slots and cleans malformed input
  const proj = getProject("unit-7-a");
  const state = attachExtras(
    proj,
    { ...fresh(proj) },
    {
      checkpoints: [],
      workbench: { mover: "B", builder: { A: "4", D: "x".repeat(50), Z: "no", C: { bad: 1 } } },
    },
  );
  assert.equal(state.workbench.mover, "B");
  assert.equal(state.workbench.builder.A, "4");
  assert.equal(state.workbench.builder.D.length, 12);
  assert.equal(state.workbench.builder.C, "");
  assert.equal("Z" in state.workbench.builder, false);
  assert.equal(attachExtras(proj, fresh(proj), { workbench: { mover: "Q" } }).workbench.mover, "A");
  assert.equal(attachExtras(proj, fresh(proj), null).workbench.mover, "A");
}
{
  // SVG labels stay inside the 360-unit drawing at every extreme design (an overflowing label scrolls the page at 390px)
  const families = [
    "area",
    "coordinates",
    "equations",
    "relationships",
    "solids",
    "discovery",
    "synthesis",
  ];
  let measured = 0;
  const label =
    /<text x="([-\d.]+)" y="[-\d.]+" font-size="(\d+)" fill="[^"]*" text-anchor="(\w+)"( font-weight="700")?>([^<]*)<\/text>/g;
  const spill = (html) => {
    const out = [];
    for (const [, x, size, anchor, bold, content] of html.matchAll(label)) {
      const width = content.length * Number(size) * (bold ? 0.62 : 0.56);
      const left =
        anchor === "start"
          ? Number(x)
          : anchor === "end"
            ? Number(x) - width
            : Number(x) - width / 2;
      measured++;
      if (left < -1 || left + width > 361) out.push(content);
    }
    return out;
  };
  assert.deepEqual(
    spill(
      '<text x="300" y="10" font-size="12" fill="#000" text-anchor="start" font-weight="700">far too long to fit</text>',
    ),
    ["far too long to fit"],
    "self-test: an overflowing label is caught",
  );
  for (const project of PROJECTS.filter((x) => families.includes(x.family))) {
    const designs = [project.defaults];
    for (const f of fieldsFor(project))
      for (const edge of ["min", "max"]) designs.push({ ...project.defaults, [f.key]: f[edge] });
    designs.push(
      Object.fromEntries(fieldsFor(project).map((f) => [f.key, f.max])),
      Object.fromEntries(fieldsFor(project).map((f) => [f.key, f.min])),
    );
    for (const design of designs)
      for (const all of [false, true])
        assert.deepEqual(
          spill(modelsHTML(project, design, { reveal: () => all, builder: {}, mover: "A" })),
          [],
          `${project.id} ${JSON.stringify(design)} labels stay inside the drawing`,
        );
  }
  assert.ok(measured > 3000, `label bounds were measured (${measured})`);
}
console.log(
  "PASS project-studio-workbench stage 3C: exact arithmetic, nine builders with negative controls, plane and graph geometry, hidden-value rules, save tolerance",
);
console.log(
  "PASS project-studio-workbench: history, checkpoints (additive save field), linked models, reveal rules, equivalence builder",
);

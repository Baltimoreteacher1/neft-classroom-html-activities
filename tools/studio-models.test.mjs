// The registered canonical models (curriculum/learning-labs/shared/models/, docs/specs/studio-v3-w4.md W4b), proved one by one.
//
//   node tools/studio-models.test.mjs                        every registered model, and every bench that names one
//   node tools/studio-models.test.mjs --only percent:tape    only these kind:mode keys (comma separated), for the authoring loop
//   node tools/studio-models.test.mjs --lesson 4-4,5-9       also run the lesson's bench contract (benchProblems) for these lessons
//
// What it holds for each model: the contract in models/README.md, a finite readout at every setting of every control, a picture that
// never prints NaN/undefined, keeps every element inside its viewBox and keeps its text readable, mission puzzles a student can plan,
// and that a lesson whose bench names the model passes the bench contract. The mathematics itself is checked by the model's own test
// (tools/studio-model-<kind>-<mode>.test.mjs), which re-derives its numbers independently.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { controls, evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { guidance, visual } from "../curriculum/learning-labs/shared/model.mjs";
import { MODELS } from "../curriculum/learning-labs/shared/models/index.mjs";
import { benchProblems, missionProblems } from "../scripts/lib/practice-studio-bench.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const argv = process.argv.slice(2);
const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1].split(",") : null);
const only = arg("--only");
const lessons = arg("--lesson");
const problems = /** @type {string[]} */ ([]);
const TIMER = /\b(timer|countdown|count down|beat the clock|against the clock)\b/i;
const num = (s) => Number(String(s).replace(/[^\d.+-eE]/g, "")) || 0;

/** Every x/y a drawing element places, as [x, y] pairs (text anchors, circle centres, rect corners, line ends, polygon points). */
function placements(svg) {
  const out = [];
  const attrs = (tag) =>
    Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  for (const m of svg.matchAll(/<(text|circle|rect|line|polygon|ellipse|path)\b([^>]*)>/g)) {
    const [, tag, rest] = m;
    const a = attrs(rest);
    if (tag === "text") out.push([tag, num(a.x), num(a.y)]);
    else if (tag === "circle") out.push([tag, num(a.cx), num(a.cy)]);
    else if (tag === "rect") {
      out.push([tag, num(a.x), num(a.y)], [tag, num(a.x) + num(a.width), num(a.y) + num(a.height)]);
    } else if (tag === "line") out.push([tag, num(a.x1), num(a.y1)], [tag, num(a.x2), num(a.y2)]);
    else if (tag === "polygon")
      for (const p of String(a.points).trim().split(/\s+/)) {
        const [x, y] = p.split(",").map(Number);
        out.push([tag, x, y]);
      }
  }
  return out;
}

function settings(c) {
  const steps = Math.round((c.max - c.min) / c.step);
  const every = Math.max(1, Math.ceil(steps / 24));
  const list = new Set([0, steps]);
  for (let i = 0; i <= steps; i += every) list.add(i);
  return [...list].sort((a, b) => a - b).map((i) => Number((c.min + i * c.step).toFixed(6)));
}

function checkModel(m) {
  const key = `${m.kind}:${m.mode}`;
  const bad = (msg) => problems.push(`${key}: ${msg}`);
  if (!Array.isArray(m.values) || !m.values.length)
    return bad("needs a `values` array (a valid starting setting)");
  const model = { kind: m.kind, mode: m.mode, values: m.values };
  let fields;
  try {
    fields = controls(model);
  } catch (e) {
    return bad(`controls() throws: ${e.message}`);
  }
  if (fields.length !== m.values.length)
    return bad(`${fields.length} controls but ${m.values.length} values`);
  fields.forEach((c, i) => {
    if (!(c.label || "").trim()) bad(`control ${i} has no label`);
    if (c.label !== "Unused" && !(c.labelEs || "").trim())
      bad(`control ${i} ("${c.label}") has no labelEs`);
    if (c.labelEs && c.labelEs.trim() === c.label.trim() && /[a-z]{5,}/i.test(c.label))
      bad(`control ${i}: labelEs is the English copied over`);
    if (!(c.max >= c.min) || !(c.step > 0)) bad(`control ${i} has a bad range`);
    const v = m.values[i];
    const onGrid = Math.abs((v - c.min) / c.step - Math.round((v - c.min) / c.step)) < 1e-7;
    if (!(v >= c.min && v <= c.max && onGrid))
      bad(`start value ${i} (${v}) is off its control (${c.min}-${c.max} step ${c.step})`);
  });
  if (
    !Array.isArray(m.guidance) ||
    m.guidance.length !== 2 ||
    m.guidance.some((g) => String(g).trim().length < 20)
  )
    bad("guidance must be two plain sentences [what the picture shows, what to try]");
  else {
    const g = guidance(model);
    if (g.show !== m.guidance[0] || g.tip !== m.guidance[1])
      bad("guidance() does not return the module's text");
  }
  const free = m.free ?? 0;
  if (!(Number.isInteger(free) && free >= 0 && free < fields.length))
    bad("`free` is not a control index");

  // every setting of every control, the others at their start values
  const seen = new Set();
  fields.forEach((c, i) => {
    if (c.min === c.max) return;
    for (const v of settings(c)) {
      const values = m.values.map((x, j) => (j === i ? v : x));
      const where = `control ${i} "${c.label}" = ${v}`;
      let r;
      try {
        r = evaluate(model, values, {});
      } catch (e) {
        // a setting the model refuses must say why in plain words; anything else is a bug
        if (!/\S{4,}/.test(e.message)) bad(`${where}: evaluate throws without a reason`);
        continue;
      }
      for (const f of ["label", "equation", "note"])
        if (typeof r[f] !== "string" || !r[f].trim()) bad(`${where}: result.${f} is empty`);
      if (!Number.isFinite(r.value)) bad(`${where}: value is not finite`);
      if (TIMER.test(`${r.equation} ${r.note} ${r.label}`)) bad(`${where}: timer language`);
      if (/NaN|undefined|Infinity|\[object/.test(`${r.equation} ${r.note} ${r.label}`))
        bad(`${where}: the readout prints NaN/undefined`);
      let svg;
      try {
        svg = visual(model, values, r);
      } catch (e) {
        bad(`${where}: visual throws: ${e.message}`);
        continue;
      }
      if (!svg.startsWith("<svg") || !svg.endsWith("</svg>"))
        bad(`${where}: visual is not one svg`);
      if (/NaN|undefined|Infinity|\[object|null/.test(svg))
        bad(`${where}: the picture prints NaN/undefined/null`);
      if (!/role="img"/.test(svg) || !/aria-label="[^"]{8,}/.test(svg))
        bad(`${where}: the picture needs role="img" and a readable aria-label`);
      const vb = (m.viewBox || "0 0 600 300").split(/\s+/).map(Number);
      for (const [tag, x, y] of placements(svg)) {
        if (x < vb[0] - 1 || x > vb[0] + vb[2] + 1 || y < vb[1] - 1 || y > vb[1] + vb[3] + 1) {
          const k = `${tag}@${Math.round(x)},${Math.round(y)}`;
          if (!seen.has(k))
            bad(
              `${where}: a ${tag} lands outside the viewBox at (${Math.round(x)}, ${Math.round(y)})`,
            );
          seen.add(k);
        }
      }
      for (const t of svg.matchAll(/font-size="(\d+(?:\.\d+)?)"/g))
        if (Number(t[1]) < 13) bad(`${where}: text smaller than 13px (${t[1]})`);
      for (const t of svg.matchAll(/<text\b[^>]*>([^<]*)</g))
        if (t[1].length > 70)
          bad(`${where}: a text label is ${t[1].length} characters (keep each under 70)`);
      if (svg.length > 40000) bad(`${where}: the picture is ${svg.length} bytes`);
    }
  });

  // the mission game builds puzzles from the model: each must be one a student can plan
  try {
    for (const msg of missionProblems(model, key)) bad(`mission: ${msg}`);
    for (let level = 0; level < 3; level++)
      for (let round = 0; round < 9; round++) {
        const q = puzzle(model, round, level);
        assert.ok(Number.isFinite(evaluate(model, q.goal).value), "the goal evaluates");
        assert.ok(
          Math.abs(evaluate(model, q.goal).value - q.target) <= q.tolerance + 1e-9,
          "target is the goal's readout",
        );
      }
  } catch (e) {
    bad(`puzzle(): ${e.message}`);
  }
}

// a registered model must never shadow a model the standalone labs already use (dispatch would silently replace it)
{
  const { blueprints } = await import("./learning-labs/blueprints.mjs");
  const used = new Set(blueprints.map((b) => `${b.model.kind}:${b.model.mode}`));
  for (const m of MODELS)
    if (used.has(`${m.kind}:${m.mode}`))
      problems.push(
        `${m.kind}:${m.mode}: a lab already uses this kind:mode; pick another mode name`,
      );
}

const labs = JSON.parse(readFileSync(join(REPO_ROOT, "data/learning-labs.json"), "utf8"));
for (const m of MODELS) {
  if (only && !only.includes(`${m.kind}:${m.mode}`)) continue;
  if (/is not built yet/.test(String(m.evaluate).slice(0, 400)) || !m.values) {
    if (only) problems.push(`${m.kind}:${m.mode}: still a stub`);
    continue;
  }
  checkModel(m);
}

// every lesson whose bench names a registered model passes the bench contract; --lesson runs chosen lessons even when unbuilt
const benchFiles = [];
for (const dir of ["data/practice-studio", "data/practice-studio-u4"])
  for (const f of (await import("node:fs")).readdirSync(join(REPO_ROOT, dir)))
    if (/^\d+-\d+\.json$/.test(f)) benchFiles.push([dir, f.replace(".json", "")]);
const registeredKeys = new Set(MODELS.filter((m) => m.values).map((m) => `${m.kind}:${m.mode}`));
for (const [dir, id] of benchFiles) {
  const p = join(REPO_ROOT, dir, `${id}.json`);
  if (!existsSync(p)) continue;
  const ld = JSON.parse(readFileSync(p, "utf8"));
  if (!ld.bench) continue;
  const key = `${ld.bench.model?.kind}:${ld.bench.model?.mode}`;
  if (lessons ? !lessons.includes(id) : !registeredKeys.has(key)) continue;
  for (const msg of benchProblems(id, ld.bench, labs)) problems.push(msg);
}

const built = MODELS.filter((m) => m.values).length;
console.log(
  `studio models: ${built} of ${MODELS.length} registered models built${only ? ` (checked ${only.join(", ")})` : ""}, ${problems.length} problem(s).`,
);
assert.equal(
  problems.length,
  0,
  `${problems.length} problem(s):\n  ${[...new Set(problems)].slice(0, 60).join("\n  ")}`,
);

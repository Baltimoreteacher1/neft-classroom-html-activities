#!/usr/bin/env node
// Independent verification of every Math Literacy Studio problem family (docs/math-literacy/architecture.md "Verifier").
//   node tools/mls-verify.mjs [--family addsub] [--seeds 40] [--quiet]
// The solvers in tools/mls-verify/*.mjs read only `spec` and use exact rational arithmetic; they never import a generator.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Rat } from "../scripts/lib/rational.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const onlyFamily = arg("--family", "");
const SEEDS = Number(arg("--seeds", 40));
const quiet = process.argv.includes("--quiet");
const lab = (p) => pathToFileURL(path.join(ROOT, "access-practice-lab/src/mls", p)).href;

const { generate, FAMILIES } = await import(lab("families.js"));
const { CONTEXT_IDS } = await import(lab("kit.js"));
const inv = JSON.parse(
  fs.readFileSync(path.join(ROOT, "access-practice-lab/content/mls/inventory.json"), "utf8"),
);
let SOLVERS = {};
for (const b of ["g12", "g34", "g56", "g78"])
  Object.assign(
    SOLVERS,
    (await import(pathToFileURL(path.join(ROOT, `tools/mls-verify/${b}.mjs`)).href)).SOLVERS,
  );
let renderVisual = null;
try {
  renderVisual = (await import(lab("visuals.js"))).renderVisual;
} catch {
  /* visuals.js not written yet */
}

const fails = [];
const stats = {};
const fail = (fam, ctx, msg) => fails.push(`${fam} ${ctx}: ${msg}`);

/** Parse a displayed value ("1,344", "$2.50", "3/4", "1 1/2", "-3", "25%", "12 cm") to an exact Rat, or null. */
export function parseRat(text) {
  let t = String(text)
    .trim()
    .replace(/−/g, "-")
    .replace(/[$,%]/g, "")
    .replace(/\s*[a-zA-Z°]+\.?(\s*[a-zA-Z²³]*)*$/, "")
    .trim();
  let m = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(t);
  if (m)
    return new Rat(
      BigInt(m[1] === "-" ? -1 : 1) * (BigInt(m[2]) * BigInt(m[4]) + BigInt(m[3])),
      BigInt(m[4]),
    );
  m = /^(-?\d+)\/(\d+)$/.exec(t);
  if (m) return new Rat(BigInt(m[1]), BigInt(m[2]));
  return Rat.fromDecimal(t);
}
const same = (a, b) => a && b && a.n === b.n && a.d === b.d;
const OPS = {
  "+": (a, b) => a.add(b),
  "-": (a, b) => a.sub(b),
  "−": (a, b) => a.sub(b),
  "×": (a, b) => a.mul(b),
  "÷": (a, b) => a.div(b),
};

function checkWork(p, fam, ctx) {
  for (const line of p.work) {
    if (/remainder|\bR\s?\d|\bapprox|about|estimate|round/i.test(line)) continue;
    const t = line.replace(/[$¢]/g, "");
    for (const m of t.matchAll(
      /(?<![\d.\/])(\d[\d,]*(?:\.\d+)?)\s*([+−\-×÷])\s*(\d[\d,]*(?:\.\d+)?)\s*=\s*(?=(\d[\d,]*(?:\.\d+)?)(?![\d.\/]))/g,
    )) {
      const [a, op, b, c] = [m[1], m[2], m[3], m[4]].map((x, i) => (i === 1 ? x : parseRat(x)));
      if (!a || !b || !c) continue;
      const got = OPS[op](a, b);
      if (got && !same(got, c))
        fail(fam, ctx, `work line states a false fact "${m[0]}${m[4]}" in: ${line}`);
    }
  }
}

function checkProblem(fam, p, skill, ctx) {
  const spec = JSON.stringify(p.spec);
  const solver = SOLVERS[fam];
  if (!solver) return fail(fam, ctx, "no solver in tools/mls-verify");
  let solved;
  try {
    solved = String(solver(JSON.parse(spec)));
  } catch (e) {
    return fail(fam, ctx, `solver threw: ${e.message} spec=${spec}`);
  }
  const k = p.answer.kind;
  if (k === "int" || k === "frac" || k === "dec") {
    const a = parseRat(p.answer.value);
    const s = parseRat(solved);
    if (!same(a, s)) fail(fam, ctx, `answer ${p.answer.value} != solver ${solved} spec=${spec}`);
    if (k === "int" && !/^-?\d+$/.test(p.answer.value))
      fail(fam, ctx, `int answer not canonical: ${p.answer.value}`);
    if (k === "frac" && !(/^-?\d+\/\d+$/.test(p.answer.value) && a && a.d !== 1n))
      fail(fam, ctx, `frac answer not canonical (reduced n/d): ${p.answer.value}`);
    if (k === "dec" && !/^-?\d+\.\d+$/.test(p.answer.value))
      fail(fam, ctx, `dec answer not canonical: ${p.answer.value}`);
    for (const d of p.distractors) {
      const dv = parseRat(d.text);
      if (dv && a && same(dv, a))
        fail(fam, ctx, `distractor "${d.text}" equals the answer ${p.answer.value}`);
    }
    if (skill.grade < 6 && skill.family !== "integers" && a && a.n < 0n)
      fail(fam, ctx, `negative answer ${p.answer.value} below grade 6`);
  } else if (solved.trim().toLowerCase() !== p.answer.value.trim().toLowerCase()) {
    fail(fam, ctx, `answer "${p.answer.value}" != solver "${solved}" spec=${spec}`);
  }
  checkWork(p, fam, ctx);
  const ans = p.answer.text;
  for (const [hk, hv] of Object.entries(p.hints))
    if (
      ans.length >= 3 &&
      new RegExp(`(^|[^\\d./])${ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\d/]|$)`).test(hv)
    )
      fail(fam, ctx, `${hk} hint states the answer "${ans}"`);
  if (p.visual && renderVisual) {
    try {
      const v = renderVisual(p.visual);
      if (!v || !/<svg[\s>]/.test(v.svg) || !v.alt || !v.summary)
        fail(fam, ctx, `visual ${p.visual.kind} did not render svg+alt+summary`);
    } catch (e) {
      fail(fam, ctx, `visual ${p.visual.kind} threw: ${e.message}`);
    }
  }
  if (JSON.stringify(p).match(/purple|violet/i)) fail(fam, ctx, "mentions purple");
  const fh = FAMILIES[fam].check?.(p, skill.params);
  if (fh) fail(fam, ctx, `family check: ${fh}`);
}

const targets = inv.skills.filter((s) => !onlyFamily || s.family === onlyFamily);
for (const skill of targets) {
  const fam = skill.family;
  if (!FAMILIES[fam]) {
    fail(fam, skill.id, "family not implemented");
    continue;
  }
  const bucket = (stats[skill.id] ||= { n: 0 });
  for (const level of [1, 2, 3]) {
    const specs = new Set();
    for (let i = 0; i < SEEDS; i++) {
      const ctx = CONTEXT_IDS[i % CONTEXT_IDS.length];
      const opts = { seed: `${skill.id}:${i}`, level, ctx };
      let p;
      try {
        p = generate(fam, skill.params, opts);
      } catch (e) {
        fail(fam, `${skill.id} L${level}#${i}`, `generator threw: ${e.message}`);
        continue;
      }
      const p2 = generate(fam, skill.params, opts);
      if (JSON.stringify(p) !== JSON.stringify(p2))
        fail(fam, `${skill.id} L${level}#${i}`, "not deterministic");
      checkProblem(fam, p, skill, `${skill.id} L${level}#${i}`);
      specs.add(JSON.stringify(p.spec));
      bucket.n++;
    }
    if (specs.size < Math.min(8, SEEDS * 0.3))
      fail(fam, `${skill.id} L${level}`, `only ${specs.size} distinct problems in ${SEEDS} seeds`);
  }
}
if (!quiet)
  for (const [id, s] of Object.entries(stats))
    console.log(`${id.padEnd(22)} ${String(s.n).padStart(5)} problems checked`);
if (fails.length) {
  for (const f of fails.slice(0, 60)) console.error(`FAIL  ${f}`);
  if (fails.length > 60) console.error(`FAIL  ... ${fails.length - 60} more`);
  console.error(`mls-verify: ${fails.length} failure(s)`);
  process.exit(1);
}
console.log(
  `mls-verify: OK (${targets.length} skills, ${Object.values(stats).reduce((a, s) => a + s.n, 0)} generated problems, each re-solved independently)`,
);

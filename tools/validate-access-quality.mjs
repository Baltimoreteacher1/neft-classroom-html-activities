#!/usr/bin/env node
/**
 * Assessment-quality gate for the ACCESS Practice Lab (content/blueprints.json).
 *
 *  - Blueprint coverage: every Key Language Use, task type, standard and language dimension the blueprint
 *    promises is actually represented in the studio tasks and missions.
 *  - Item quality across the whole selected-response bank (activities, tests, mission questions):
 *    duplicate options, keys that point nowhere, answer-position skew, "longest option is correct" cue.
 *    Advisory counts (absolutes, passage reading level) are reported, never silently hidden.
 *  - Honest labelling: no bank text may claim an official WIDA/ACCESS score, level or placement.
 *
 * Self-tests run before the sweep so a detector that stops firing fails loudly.
 * `--report` prints the full numbers (use it when tuning content).
 */
import { join } from "node:path";
import { fleschKincaid } from "../access-practice-lab/src/lang/text.js";
import { allActivities, CONTENT_DIR, loadOptional, loadTests } from "./lib/access-lab-content.mjs";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const REPORT = process.argv.includes("--report");
const failures = [];
const advisories = [];
const fail = (w, m) => failures.push(`${w}: ${m}`);
const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);
void join;

// ── pure detectors ────────────────────────────────────────────────────────────
export function optionCues(item) {
  const opts = asList(item.options);
  const texts = opts.map((o) => String(o.text ?? o));
  const norm = texts.map((t) => t.trim().toLowerCase());
  const dup = norm.length !== new Set(norm).size;
  const answers = item.type === "multiSelect" ? asList(item.answers) : [item.answer];
  const keyIdx = opts.map((o, i) => (answers.includes(o.id ?? o) ? i : -1)).filter((i) => i >= 0);
  const missing = answers.filter((a) => !opts.some((o) => (o.id ?? o) === a));
  const lens = texts.map((t) => t.length);
  const max = Math.max(...lens);
  const longestCorrect =
    keyIdx.length === 1 &&
    lens[keyIdx[0]] === max &&
    lens.filter((l) => l === max).length === 1 &&
    lens[keyIdx[0]] >=
      1.25 *
        (lens.filter((_, i) => i !== keyIdx[0]).reduce((a, b) => a + b, 0) /
          Math.max(1, lens.length - 1));
  const absolutesOnlyDistractors =
    opts.length > 2 &&
    opts.every(
      (o, i) =>
        keyIdx.includes(i) ||
        /\b(always|never|all|none|only|every|nobody)\b/i.test(String(o.text ?? o)),
    ) &&
    keyIdx.length > 0;
  return { dup, missing, keyIdx, longestCorrect, absolutesOnlyDistractors };
}
export function positionShare(items) {
  const counts = {};
  let n = 0;
  for (const it of items) {
    const c = optionCues(it);
    if (c.keyIdx.length !== 1) continue;
    counts[c.keyIdx[0]] = (counts[c.keyIdx[0]] || 0) + 1;
    n++;
  }
  const top = Math.max(0, ...Object.values(counts));
  return { n, top: n ? top / n : 0, counts };
}

/**
 * Is the key evenly spread over the positions? Items are grouped by option count (a 3-option item can only
 * key A-C, so mixing them with 4-option items hides a D that is never used), and each group of 20 or more
 * is compared with a uniform spread by chi-square at p < .05. A single "top position share" cap cannot see
 * a key that favours one end: 45% on D passed a 50% cap while A-C each held about 17%.
 */
const CHI_CRITICAL = { 2: 5.99, 3: 7.81 };
export function positionUniformity(items, minGroup = 20) {
  const groups = {};
  for (const it of items) {
    const c = optionCues(it);
    const k = asList(it.options).length;
    if (c.keyIdx.length !== 1 || !CHI_CRITICAL[k - 1]) continue;
    (groups[k] ||= Array(k).fill(0))[c.keyIdx[0]]++;
  }
  const out = [];
  for (const [k, counts] of Object.entries(groups)) {
    const n = counts.reduce((a, b) => a + b, 0);
    if (n < minGroup) continue;
    const expected = n / counts.length;
    const chi = counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
    out.push({
      options: Number(k),
      n,
      counts,
      chi: Math.round(chi * 100) / 100,
      skewed: chi > CHI_CRITICAL[k - 1],
    });
  }
  return out;
}

// self-tests
{
  const good = {
    type: "multipleChoice",
    options: [
      { id: "a", text: "red" },
      { id: "b", text: "green" },
      { id: "c", text: "blue" },
    ],
    answer: "b",
  };
  if (optionCues(good).dup || optionCues(good).missing.length)
    throw new Error("self-test: false positive");
  if (
    !optionCues({
      ...good,
      options: [
        { id: "a", text: "red" },
        { id: "b", text: "Red " },
        { id: "c", text: "x" },
      ],
    }).dup
  )
    throw new Error("self-test: duplicate not caught");
  if (!optionCues({ ...good, answer: "z" }).missing.length)
    throw new Error("self-test: dangling key not caught");
  const long = {
    type: "multipleChoice",
    options: [
      { id: "a", text: "no" },
      { id: "b", text: "a much longer and more detailed answer than the others" },
      { id: "c", text: "yes" },
    ],
    answer: "b",
  };
  if (!optionCues(long).longestCorrect) throw new Error("self-test: length cue not caught");
  if (positionShare([good, good, good]).top !== 1) throw new Error("self-test: position share");
  const keyed = (i) => ({
    type: "multipleChoice",
    options: ["a", "b", "c", "d"].map((id) => ({ id, text: id + i })),
    answer: ["a", "b", "c", "d"][i % 4],
  });
  const lopsided = Array.from({ length: 24 }, (_, n) => keyed(n < 20 ? 3 : n % 4));
  if (!positionUniformity(lopsided)[0]?.skewed)
    throw new Error("self-test: a key that favours D must be flagged");
  if (positionUniformity(Array.from({ length: 24 }, (_, n) => keyed(n)))[0]?.skewed)
    throw new Error("self-test: an even key must pass");
}

// ── gather the selected-response pool ─────────────────────────────────────────
const pools = {
  Listening: [],
  Reading: [],
  Speaking: [],
  Writing: [],
  "Model-Test": [],
  Tests: [],
  Missions: [],
};
const isMC = (a) =>
  ["multipleChoice", "multiSelect"].includes(a.type) && asList(a.options).length >= 2;
for (const { domain, activity: a } of allActivities())
  if (isMC(a)) pools[domain === "Model-Test" ? "Model-Test" : domain].push({ ...a, _id: a.id });
for (const { data } of loadTests())
  for (const s of data.sections || [])
    for (const it of s.items || [])
      if (isMC(it)) pools.Tests.push({ ...it, _id: it.id || `${data.id}` });
const missionDir = join(CONTENT_DIR, "missions");
const { readdirSync, readFileSync, existsSync } = await import("node:fs");
const missions = existsSync(missionDir)
  ? readdirSync(missionDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(missionDir, f), "utf8")))
  : [];
for (const m of missions)
  for (const p of m.phases)
    for (const t of p.tasks || [])
      if (t.kind === "question")
        pools.Missions.push({
          type: "multipleChoice",
          options: t.options,
          answer: t.answer,
          _id: `${m.id}:${t.id}`,
        });

const bp = loadOptional("blueprints.json");
if (!bp) fail("blueprints", "content/blueprints.json is missing");
else {
  const q = bp.itemQuality;
  let longestTotal = 0;
  let mcTotal = 0;
  const stats = {};
  for (const [name, items] of Object.entries(pools)) {
    let abs = 0;
    for (const it of items) {
      const c = optionCues(it);
      if (c.dup) fail(`${name}:${it._id}`, "duplicate options");
      if (c.missing.length) fail(`${name}:${it._id}`, `key ${c.missing} is not an option`);
      if (c.longestCorrect) longestTotal++;
      if (c.absolutesOnlyDistractors) abs++;
      mcTotal++;
    }
    const pos = positionShare(items);
    stats[name] = {
      items: items.length,
      topPositionShare: Math.round(pos.top * 100) / 100,
      positions: pos.counts,
      absolutes: abs,
    };
    for (const g of positionUniformity(items))
      if (g.skewed)
        fail(
          name,
          `answer positions are not evenly spread over ${g.options}-option items: ${g.counts.join("/")} (n=${g.n}, chi-square ${g.chi})`,
        );
    if (pos.n >= 12 && pos.top > q.maxCorrectPositionShare)
      fail(
        name,
        `answer position skew: one position holds ${Math.round(pos.top * 100)}% of keys (max ${q.maxCorrectPositionShare * 100}%)`,
      );
    if (abs)
      advisories.push(`${name}: ${abs} item(s) whose wrong options all rely on absolute words`);
  }
  // The activity bank as a whole: per-domain pools of 12-32 items hide a skew that the whole bank shows.
  const bankAll = ["Listening", "Reading", "Speaking", "Writing", "Model-Test"].flatMap(
    (d) => pools[d],
  );
  for (const g of positionUniformity(bankAll))
    if (g.skewed)
      fail(
        "bank",
        `answer positions are not evenly spread over ${g.options}-option items across the whole bank: ${g.counts.join("/")} (n=${g.n}, chi-square ${g.chi})`,
      );
  const share = mcTotal ? longestTotal / mcTotal : 0;
  stats.corpus = { items: mcTotal, longestCorrectShare: Math.round(share * 100) / 100 };
  if (share > q.maxLongestCorrectShare)
    fail(
      "corpus",
      `the correct option is conspicuously the longest in ${Math.round(share * 100)}% of items (max ${q.maxLongestCorrectShare * 100}%)`,
    );

  // passage reading level (advisory) — grades 6-8 band only
  const grades = [];
  for (const { band, activity: a } of allActivities())
    if (band === "6-8" && asList(a.passage).length)
      grades.push([a.id, fleschKincaid(asList(a.passage).join(" "))]);
  const off = grades.filter(([, g]) => g < q.passageGradeLevel.min || g > q.passageGradeLevel.max);
  if (off.length)
    advisories.push(
      `${off.length} of ${grades.length} grades 6–8 passages fall outside FK ${q.passageGradeLevel.min}–${q.passageGradeLevel.max}: ${off
        .slice(0, 4)
        .map(([id, g]) => `${id} (${g.toFixed(1)})`)
        .join(", ")}`,
    );
  stats.passages = { checked: grades.length, outsideRange: off.length };

  // blueprint coverage from the studio content
  const speaking = loadOptional("studio/speaking.json")?.tasks || [];
  const writing = loadOptional("studio/writing.json")?.tasks || [];
  const all = [
    ...speaking,
    ...writing,
    ...missions.flatMap((m) =>
      m.phases.flatMap((p) => (p.tasks || []).map((t) => t.task).filter(Boolean)),
    ),
  ];
  const count = (arr, f) => arr.filter(f).length;
  const sp = bp.domains.find((d) => d.domain === "Speaking");
  const wr = bp.domains.find((d) => d.domain === "Writing");
  for (const k of sp.targets.keyUses)
    if (count(speaking, (t) => t.keyUse === k) < sp.minimum.tasksPerKeyUse)
      fail("blueprint:Speaking", `needs ≥${sp.minimum.tasksPerKeyUse} ${k} tasks`);
  for (const k of sp.targets.taskTypes)
    if (count(speaking, (t) => t.taskType === k) < sp.minimum.tasksPerType)
      fail("blueprint:Speaking", `needs ≥${sp.minimum.tasksPerType} ${k} tasks`);
  for (const k of wr.targets.keyUses)
    if (count(writing, (t) => t.keyUse === k) < wr.minimum.tasksPerKeyUse)
      fail("blueprint:Writing", `needs ≥${wr.minimum.tasksPerKeyUse} ${k} tasks`);
  for (const f of wr.targets.forms)
    if (!count(writing, (t) => t.form === f)) fail("blueprint:Writing", `no ${f} task`);
  for (const [code, min] of Object.entries(bp.coverage.standards))
    if (count(all, (t) => asList(t.standards).includes(code)) < min)
      fail("blueprint:standards", `${code} needs ≥${min} tasks`);
  for (const [dim, min] of Object.entries(bp.coverage.dimensions))
    if (count(all, (t) => asList(t.dimensions).includes(dim)) < min)
      fail("blueprint:dimensions", `${dim} needs ≥${min} tasks`);
  for (const d of bp.domains.filter((x) => x.minimum.missions))
    if (missions.length < d.minimum.missions)
      fail(`blueprint:${d.domain}`, `needs ≥${d.minimum.missions} missions`);
  for (const sk of bp.domains.find((x) => x.domain === "Reading").targets.skills)
    if (!missions.some((m) => m.phases.some((p) => (p.tasks || []).some((t) => t.skill === sk))))
      fail("blueprint:Reading", `no mission question tests ${sk}`);
  stats.coverage = {
    speaking: speaking.length,
    writing: writing.length,
    missions: missions.length,
  };
  if (REPORT) console.log(JSON.stringify(stats, null, 2));

  // honest labelling over every student-facing bank string
  const texts = [];
  const walk = (v) =>
    typeof v === "string"
      ? texts.push(v)
      : Array.isArray(v)
        ? v.forEach(walk)
        : v && typeof v === "object"
          ? Object.values(v).forEach(walk)
          : null;
  walk(bp.purposes);
  const claims = texts.filter((t) => SCORE_CLAIM.test(t));
  if (claims.length) fail("blueprint", `claims an official score: ${claims[0]}`);
}

if (REPORT || advisories.length) for (const a of advisories) console.log(`  advisory: ${a}`);
if (failures.length) {
  console.error(`validate:access-quality — FAIL (${failures.length})`);
  for (const f of failures.slice(0, 60)) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `validate:access-quality — PASS · ${Object.values(pools).reduce((n, p) => n + p.length, 0)} selected-response items checked · ${advisories.length} advisory note(s)`,
);

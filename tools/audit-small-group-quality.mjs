#!/usr/bin/env node
/**
 * audit-small-group-quality.mjs — complete-coverage audit of the small-group
 * fleet (support / challenge / catch-up), for the publisher-quality pass.
 *
 * REPORTS ONLY. It never writes a lesson. "The audit should have complete
 * coverage. The diff should not." — this file produces the evidence that decides
 * which lessons are actually worth changing.
 *
 * It records, per lesson, the §2 fields (objective, pathway, standard,
 * misconception target, representation, facilitation, worked example, guided
 * practice, check, explanation opportunity, language supports, core-lesson
 * relationship) and then classifies:
 *
 *   A  publisher-quality        — preserve
 *   B  strong but improvable    — improve selectively
 *   C  weak small-group design  — redesign substantially
 *   D  instructional defect     — fix completely
 *
 * Every classification is driven by a countable signal, listed in `reasons`, so
 * the grade can be argued with. A grade with no reason is a bug in this file.
 *
 * Run: node tools/audit-small-group-quality.mjs [--json]
 * Out: reports/small-group-quality-audit.{md,json}
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

// --- facilitation (generated, teacher route only) ---------------------------
async function loadFacilitation() {
  const p = join(ROOT, "functions/teacher-small-group/_facilitation-data.js");
  if (!existsSync(p)) return {};
  const mod = await import(`file://${p}`);
  return mod.FACILITATION_BY_LESSON || {};
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

/** Every item a student actually answers, flattened with its band. */
function items(cfg) {
  const out = [];
  const p = cfg.practice || {};
  for (const band of ["approaching", "onLevel", "extending", "optional"]) {
    for (const it of p[band] || []) out.push({ ...it, band });
  }
  return out;
}

/**
 * Cognitive demand of one item (§27). Deliberately conservative: a stem is only
 * called reasoning/transfer when it ASKS for it in words a grader could point
 * at. Everything unrecognized stays "procedural", so this under-counts depth
 * rather than flattering the fleet.
 */
/**
 * All the words of an item, wherever they live. Reading only `stem` was a real
 * bug in the first version of this file: `error-analysis` items carry no stem at
 * all — their text is in `title` + `workedExample[].work` — so the fleet's
 * strongest challenge tasks scored as "procedural" and 82 of 84 challenge
 * lessons were graded C. A classifier that cannot see the task cannot grade it.
 */
function itemText(it) {
  const parts = [it.stem, it.prompt, it.title, it.question];
  for (const step of it.workedExample || []) parts.push(step.label, step.work);
  for (const c of it.choices || []) parts.push(typeof c === "string" ? c : c?.text);
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function demand(it) {
  // The authored item TYPE is the strongest signal there is — it is a decision
  // someone made about the task, not an inference from its wording.
  const t = String(it.type || "").toLowerCase();
  if (/error-analysis|critique/.test(t)) return "reasoning";
  if (/always-sometimes-never|conjecture|generaliz/.test(t)) return "generalization";
  if (/strategy-compare|compare-strategies|multiple-solution/.test(t)) return "strategic";
  if (/transfer|apply-new/.test(t)) return "transfer";

  const s = itemText(it);
  if (
    /\balways\b.*\bsometimes\b|\bcounterexample\b|\bwill (this|it) always\b|\bin general\b|\bgeneraliz/.test(
      s,
    )
  )
    return "generalization";
  if (
    /\bwhat did .* misunderstand|\bwhat error\b|\bwhat mistake\b|\bcritique\b|is .* correct\b|\bwho is right\b/.test(
      s,
    )
  )
    return "reasoning";
  if (
    /\bjustify\b|\bexplain why\b|\bprove\b|\bdefend\b|\bconvince\b|\bwhy does\b|\bwhy is\b/.test(s)
  )
    return "reasoning";
  if (
    /\bwhich (method|strategy) is more efficient|\bcompare .* (method|strategy|approach)|\bsolve .* two ways/.test(
      s,
    )
  )
    return "strategic";
  if (
    /\bcreate (an?|your own)\b|\bwrite a problem\b|\bdesign a\b|\bfind (another|a different) (way|answer)/.test(
      s,
    ) ||
    // Constructing a situation to order is the same cognitive act as "create an
    // example" — the fleet phrases it "describe one situation where ___ is the
    // independent variable", which the create-verbs above cannot see.
    /\bdescribe (one|a|two|three) (situation|example|case)s? where\b|\bwrite a situation\b/.test(s)
  )
    return "strategic";
  if (
    /\bwhat happens if\b|\bsuppose\b|\bwould .* still\b|\bunfamiliar\b/.test(s) ||
    // Reverse-the-problem: handed the result, reconstruct the situation.
    /\bworking backwards\b|\bwork backwards\b|\bgiven the result\b/.test(s)
  )
    return "transfer";
  if (/\bexplain\b|\bdescribe\b|\bwhat does .* mean\b|\bhow do you know\b/.test(s))
    return "conceptual";
  return "procedural";
}

const isOpenResponse = (it) =>
  !Array.isArray(it.choices) ||
  it.choices.length === 0 ||
  /open|short-answer|explain/.test(it.type || "");

/** Does this lesson ask a student to say WHY, anywhere? (§21) */
function explanationOpportunities(cfg, its) {
  let n = 0;
  for (const it of its) {
    if (isOpenResponse(it)) n++;
    else if (demand(it) === "reasoning" || demand(it) === "generalization") n++;
  }
  const s = JSON.stringify(cfg.reflect || {}) + JSON.stringify(cfg.turnAndTalk || {});
  if (/explain|why|because|justify/i.test(s)) n++;
  return n;
}

/** Sentence frames / starters anywhere in the lesson (§21, §22). */
const hasSentenceFrames = (cfg) =>
  /because|sentence (starter|frame)|___/i.test(
    JSON.stringify(cfg.reflect || {}) + JSON.stringify(cfg.vocabulary || {}),
  );

/** A visual model the student can actually look at (§16, §17). */
function representation(cfg) {
  const kinds = new Set();
  const walk = (v) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    if (typeof v.kind === "string") kinds.add(v.kind);
    if (typeof v.type === "string" && /diagram|model|number-line|tape|grid|plot|graph/.test(v.type))
      kinds.add(v.type);
    if (v.image || v.diagram) kinds.add("figure");
    Object.values(v).forEach(walk);
  };
  walk(cfg.launch);
  walk(cfg.explore);
  walk(cfg.practice);
  walk(cfg.connect);
  return [...kinds];
}

const MISC_GENERIC = /more practice|needs practice|struggles with the concept|general/i;

function auditOne(id, cfg, fac, coreCfg) {
  const its = items(cfg);
  const variant = cfg.variant || (id.endsWith("-catchup") ? "catchup" : "");
  const pathway =
    variant === "group1" ? "support" : variant === "group2" ? "challenge" : "catch-up";
  const moves = fac?.teacherMoves || {};
  const reps = representation(cfg);
  const demands = its.map(demand);
  const tally = (d) => demands.filter((x) => x === d).length;
  const deep =
    tally("reasoning") + tally("generalization") + tally("strategic") + tally("transfer");
  const tagged = its.filter((it) => (it.misconceptionTags || []).some(Boolean)).length;
  const explains = explanationOpportunities(cfg, its);

  const rec = {
    id,
    pathway,
    standard: cfg.standard || "",
    objective: cfg.contentObjective || "",
    languageObjective: cfg.languageObjective || "",
    timeEstimate: cfg.timeEstimate || fac?.duration || "",
    misconceptionTarget: fac?.who || "",
    representations: reps,
    itemCount: its.length,
    // How many lessons this one reviews. Catch-up objectives name a range
    // ("Lessons 6.4–6.15"); everything else reviews itself.
    lessonsCovered: (() => {
      const m = /Lessons?\s*([\d.]+)\s*[–-]\s*([\d.]+)/.exec(cfg.contentObjective || "");
      if (!m) return 1;
      const a = Number(String(m[1]).split(".")[1]);
      const b = Number(String(m[2]).split(".")[1]);
      return Number.isFinite(a) && Number.isFinite(b) ? Math.max(1, b - a + 1) : 1;
    })(),
    demand: {
      procedural: tally("procedural"),
      conceptual: tally("conceptual"),
      strategic: tally("strategic"),
      reasoning: tally("reasoning"),
      transfer: tally("transfer"),
      generalization: tally("generalization"),
      deepShare: its.length ? +(deep / its.length).toFixed(2) : 0,
    },
    misconceptionTaggedItems: tagged,
    explanationOpportunities: explains,
    sentenceFrames: hasSentenceFrames(cfg),
    hasWorkedExample: !!cfg.launch?.conceptIntro?.iDo,
    hasGuided:
      (cfg.practice?.approaching || []).length > 0 || (cfg.practice?.onLevel || []).length > 0,
    hasCheck: !!(cfg.reflect?.exitTicket || cfg.reflect?.checkForUnderstanding || cfg.readiness),
    facilitation: {
      ask: moves.ask || "",
      lookFor: moves.lookFor || "",
      ifStuck: moves.ifStuck || "",
      extend: moves.extend || "",
      askWords: (moves.ask || "").split(/\s+/).filter(Boolean).length,
      lookForWords: (moves.lookFor || "").split(/\s+/).filter(Boolean).length,
      ifStuckWords: (moves.ifStuck || "").split(/\s+/).filter(Boolean).length,
      extendWords: (moves.extend || "").split(/\s+/).filter(Boolean).length,
    },
    core: coreCfg
      ? {
          id: coreCfg.lessonId,
          sameStandard: coreCfg.standard === cfg.standard,
          objective: coreCfg.contentObjective || "",
        }
      : null,
    reasons: [],
    grade: "A",
  };

  const R = (code, msg) => rec.reasons.push(`${code}: ${msg}`);

  // ---- D: instructional defects ------------------------------------------
  if (!rec.objective) R("D", "no content objective");
  if (coreCfg && !rec.core.sameStandard)
    R(
      "D",
      `standard ${cfg.standard} does not match core lesson ${coreCfg.lessonId} (${coreCfg.standard})`,
    );
  if (rec.itemCount === 0) R("D", "no practice items at all");

  // ---- C: weak use of a teacher-led small group ---------------------------
  if (pathway === "challenge" && rec.demand.deepShare < 0.25)
    R(
      "C",
      `challenge lesson is ${Math.round((1 - rec.demand.deepShare) * 100)}% procedural/conceptual items — depth comes from bigger numbers, not deeper thinking (§27)`,
    );
  if (pathway === "support" && tagged === 0 && !MISC_GENERIC.test(rec.misconceptionTarget))
    R(
      "C",
      "no item carries a misconception tag — the intervention cannot say what it repairs (§13)",
    );
  if (pathway === "support" && MISC_GENERIC.test(rec.misconceptionTarget))
    R("C", `generic instructional target: "${rec.misconceptionTarget.slice(0, 60)}…" (§4)`);
  if (reps.length === 0)
    R("C", "no mathematical representation — nothing is made visible (§8, §17)");
  // Catch-up lessons are a different delivery model and are not in the teacher
  // facilitation dataset by design. Flagging all 36 of them as a design defect
  // says nothing about the lesson — it says they were not in the file we read.
  if (!moves.ask && !moves.lookFor && pathway !== "catch-up")
    R("C", "no teacher facilitation recorded (§11)");

  // ---- B: strong but improvable ------------------------------------------
  if (explains === 0) R("B", "no explanation/reasoning opportunity anywhere (§21)");
  if (!rec.hasCheck) R("B", "no exit check — no evidence the gap was closed (§29)");
  if (!rec.hasWorkedExample && pathway === "support")
    R("B", "no worked example to connect representation to notation (§20)");
  // Practice quantity (§10). A catch-up lesson is a MULTI-LESSON spiral review —
  // "caught up on Lessons 6.4–6.15" is twelve lessons — so its raw item count
  // scales with how much it reviews and a flat threshold flags the design, not a
  // defect. Measured across all 36: every one sits at 5–6 items per reviewed
  // lesson, none above 9. Judge catch-up per reviewed lesson; judge a single-
  // lesson support/challenge group on its raw count.
  const perLesson = rec.itemCount / (rec.lessonsCovered || 1);
  if (pathway === "catch-up") {
    if (perLesson > 9)
      R(
        "B",
        `${rec.itemCount} items across ${rec.lessonsCovered} reviewed lessons (${perLesson.toFixed(1)}/lesson) — heavier than the fleet's uniform 5–6 (§10)`,
      );
  } else if (rec.itemCount > 14) {
    R("B", `${rec.itemCount} practice items — small group should be fewer, purposeful tasks (§10)`);
  }
  if (rec.facilitation.lookForWords > 40)
    R("B", `LOOK FOR is ${rec.facilitation.lookForWords} words — not glanceable mid-group (§12)`);
  if (rec.facilitation.askWords > 40)
    R("B", `ASK is ${rec.facilitation.askWords} words — not something a teacher says aloud (§11)`);
  if (pathway === "support" && !rec.sentenceFrames && explains > 0)
    R("B", "asks for explanation with no sentence support (§21, §22)");
  if (pathway === "challenge" && !moves.extend) R("B", "challenge lesson has no EXTEND move (§11)");

  const codes = new Set(rec.reasons.map((r) => r[0]));
  rec.grade = codes.has("D") ? "D" : codes.has("C") ? "C" : codes.has("B") ? "B" : "A";
  return rec;
}

// ---------------------------------------------------------------------------
const facilitation = await loadFacilitation();
const dirs = readdirSync(LESSONS)
  .filter((d) => /-(group1|group2|catchup)$/.test(d))
  .filter((d) => existsSync(join(LESSONS, d, "config.json")))
  .sort();

const records = [];
for (const id of dirs) {
  const cfg = readJson(join(LESSONS, id, "config.json"));
  const coreId = id.replace(/-(group1|group2|catchup)$/, "");
  const corePath = join(LESSONS, coreId, "config.json");
  const coreCfg = existsSync(corePath) ? readJson(corePath) : null;
  records.push(auditOne(id, cfg, facilitation[id], coreCfg));
}

const by = (fn) => records.reduce((m, r) => ((m[fn(r)] = (m[fn(r)] || 0) + 1), m), {});
const grades = by((r) => r.grade);
const paths = by((r) => r.pathway);
const gradeByPathway = {};
for (const r of records) {
  gradeByPathway[r.pathway] ||= {};
  gradeByPathway[r.pathway][r.grade] = (gradeByPathway[r.pathway][r.grade] || 0) + 1;
}

// Reason frequency — this is what says where the WORK is, as opposed to where
// the grades are. One reason hitting 80 lessons is a generator fix; one hitting
// three is a hand edit.
const reasonFreq = {};
for (const r of records)
  for (const reason of r.reasons) {
    const key = reason.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, "N");
    reasonFreq[key] = (reasonFreq[key] || 0) + 1;
  }
const topReasons = Object.entries(reasonFreq).sort((a, b) => b[1] - a[1]);

const md = [
  "# Small-group quality audit",
  "",
  `Generated by \`tools/audit-small-group-quality.mjs\`. **Reports only.**`,
  "",
  `- lessons audited: **${records.length}** (${Object.entries(paths)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ")})`,
  `- total practice items: **${records.reduce((n, r) => n + r.itemCount, 0)}**`,
  "",
  "## Instructional classification",
  "",
  "| Grade | Meaning | Count |",
  "| --- | --- | --- |",
  `| A | publisher-quality, preserve | ${grades.A || 0} |`,
  `| B | strong but improvable | ${grades.B || 0} |`,
  `| C | weak small-group design | ${grades.C || 0} |`,
  `| D | instructional defect | ${grades.D || 0} |`,
  "",
  "### By pathway",
  "",
  "| Pathway | A | B | C | D |",
  "| --- | --- | --- | --- | --- |",
  ...Object.entries(gradeByPathway).map(
    ([p, g]) => `| ${p} | ${g.A || 0} | ${g.B || 0} | ${g.C || 0} | ${g.D || 0} |`,
  ),
  "",
  "## Where the work is (reason frequency)",
  "",
  "A reason hitting most of the fleet is a generator change. A reason hitting a",
  "handful is a hand edit. This table, not the grade counts, should drive the diff.",
  "",
  "| Lessons | Finding |",
  "| --- | --- |",
  ...topReasons.map(([r, n]) => `| ${n} | ${r} |`),
  "",
  "## Cognitive demand (§27)",
  "",
  "| Pathway | items | procedural | conceptual | strategic | reasoning | transfer | generalization | deep share |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...["support", "challenge", "catch-up"].map((p) => {
    const rs = records.filter((r) => r.pathway === p);
    const sum = (k) => rs.reduce((n, r) => n + r.demand[k], 0);
    const items = rs.reduce((n, r) => n + r.itemCount, 0);
    const deep = sum("strategic") + sum("reasoning") + sum("transfer") + sum("generalization");
    return `| ${p} | ${items} | ${sum("procedural")} | ${sum("conceptual")} | ${sum("strategic")} | ${sum("reasoning")} | ${sum("transfer")} | ${sum("generalization")} | ${items ? Math.round((deep / items) * 100) : 0}% |`;
  }),
  "",
  "## Every lesson",
  "",
  "| Lesson | Path | Grade | Items | Deep | Tagged | Explain | Reps | Findings |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...records.map(
    (r) =>
      `| ${r.id} | ${r.pathway} | ${r.grade} | ${r.itemCount} | ${Math.round(r.demand.deepShare * 100)}% | ${r.misconceptionTaggedItems} | ${r.explanationOpportunities} | ${r.representations.length} | ${r.reasons.length ? r.reasons.join("<br>") : "—"} |`,
  ),
  "",
].join("\n");

mkdirSync(join(ROOT, "reports"), { recursive: true });
writeFileSync(join(ROOT, "reports/small-group-quality-audit.md"), md);
writeFileSync(
  join(ROOT, "reports/small-group-quality-audit.json"),
  `${JSON.stringify({ records, grades, reasonFreq }, null, 2)}\n`,
);

console.log(`Small-group quality audit — ${records.length} lessons`);
console.log(`  A ${grades.A || 0}   B ${grades.B || 0}   C ${grades.C || 0}   D ${grades.D || 0}`);
console.log("\n  top findings:");
for (const [r, n] of topReasons.slice(0, 12)) console.log(`   ${String(n).padStart(4)}  ${r}`);
console.log("\n  report: reports/small-group-quality-audit.md");

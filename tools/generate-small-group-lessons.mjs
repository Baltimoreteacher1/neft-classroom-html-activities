#!/usr/bin/env node
// Generate small-group differentiated lessons: TWO per base lesson.
//   N-M-group1  Small Group · Group 1  — students STRUGGLING  (re-teach + scaffold)
//   N-M-group2  Small Group · Group 2  — students UNDERSTANDING (extension + challenge)
//
// Each is a real lesson in the existing engine (config.json drives
// engine/core/lesson-renderer.js; all 5 phases required). We clone the base
// lesson config for structural validity, then apply a group-specific transform
// that SELECTS + RE-FRAMES the base's already-publisher-grade content
// (conceptIntro I/We/You-Do, tiered practice with hints, exit tickets) into a
// compact 15–20 min small-group pull-out. Mirrors generate-catchup-lessons.mjs.
//
// Usage:
//   node tools/generate-small-group-lessons.mjs            # all base lessons
//   node tools/generate-small-group-lessons.mjs --dry      # report only
//   node tools/generate-small-group-lessons.mjs --only 1-3 # single lesson (PoC)
//   node tools/generate-small-group-lessons.mjs --configs-only # configs only, skip shells
//
// NOTE on --configs-only: it used to be a SAFETY flag ("preserve generated
// shells") because writing index.html with a plain writeFileSync deleted every
// injected layer on it. That is fixed — the shells now go through
// writeGenerated(), which re-splices the injected blocks. The flag survives
// only as a SCOPE option: skip index.html and lesson.js when you just want the
// configs refreshed. It is no longer protecting anything.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeGenerated } from "../scripts/lib/preserve-injected.mjs";
import { LESSON_JS, shellHtml } from "./lib/compact-shell.mjs";
import { applyChallengeTasks, challengeFacilitation } from "./lib/small-group-challenge-tasks.mjs";
import { buildTeacherMoves } from "./lib/small-group-facilitation.mjs";
import { buildParallelPractice } from "./lib/small-group-parallel-practice.mjs";

const ROOT = process.env.REPO || resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* Human-readable names for the misconceptions a lesson's own distractors can
   diagnose (data/misconception-labels.json, generated from the engine
   taxonomy). Used to tell a teacher WHO to pull by the error they made rather
   than by "students who struggled" — the difference between a level group and
   a diagnostic one. Absent file degrades to the old generic line. */
let MISCONCEPTION_LABELS = {};
try {
  MISCONCEPTION_LABELS =
    JSON.parse(readFileSync(join(ROOT, "data/misconception-labels.json"), "utf8")).tags || {};
} catch (_error) {
  MISCONCEPTION_LABELS = {};
}

/**
 * The justification half of a challenge objective, matched to the KIND of
 * mathematics the lesson does.
 *
 * One clause does not fit every lesson. "Explain why the method works" is right
 * for "divide by multiplying by the reciprocal" and nonsense for "tell the
 * difference between a statistical and a non-statistical question" — there is
 * no method there to justify, there is a criterion to apply. Writing a single
 * sentence for all 64 lessons is exactly the templating this rewrite exists to
 * remove, so the clause follows the verb.
 */
function proveClause(skill) {
  const s = String(skill || "").toLowerCase();
  // Build verbs are tested FIRST. Objectives routinely pair them with a
  // describing verb ("write and DESCRIBE a ratio", "plot and IDENTIFY points"),
  // and testing classification first handed those lessons "explain how I can
  // tell" when the student is actually constructing something.
  if (/\b(write|writing|represent|model|graph|plot|draw|construct|build)\b/.test(s))
    return "explain what each part stands for, and build one for a situation I have not seen before.";
  if (
    /\b(tell the difference|identify|classify|decide|recognize|compare|describe|interpret)\b/.test(
      s,
    )
  )
    return "explain how I can tell, and judge a case I have not seen before.";
  return "explain why the method works, and use it on a problem I have not seen before.";
}

/** The misconception labels this lesson's practice items can actually detect. */
function diagnosedErrors(base) {
  const found = new Set();
  for (const tier of ["approaching", "onLevel", "extending", "optional"]) {
    for (const item of base?.practice?.[tier] || []) {
      for (const tag of item?.misconceptionTags || []) {
        const label = tag && MISCONCEPTION_LABELS[tag]?.label;
        if (label) found.add(label);
      }
    }
  }
  return [...found];
}
const LESSONS = join(ROOT, "lessons");
const FACILITATION_MODULE = join(ROOT, "functions", "teacher-small-group", "_facilitation-data.js");
const DRY = process.argv.includes("--dry");
const CONFIGS_ONLY = process.argv.includes("--configs-only");
/*
 * --facilitation-only rebuilds ONLY the teacher-facing facilitation module and
 * writes no lesson file at all.
 *
 * It exists because a full run is destructive in ways that have nothing to do
 * with teacher moves: regenerating 3-1 alone deleted 142 lines from its two
 * configs, including the `choicesEs` / `hintsEs` / `correctWorkEs` Spanish that
 * lives in data/es-translations and is applied by a later step. Facilitation is
 * derived data — it can be rebuilt from the base lessons at any time — so the
 * maintainable answer is a pathway that regenerates it WITHOUT touching student
 * content. This keeps the source of truth in the generator (edit the builder,
 * re-run, done) while making a routine refresh safe.
 */
const FACILITATION_ONLY = process.argv.includes("--facilitation-only");
const onlyIx = process.argv.indexOf("--only");
const ONLY = onlyIx !== -1 ? process.argv[onlyIx + 1] : null;
const MINIMUM_PRACTICE = 10;

const BASE_RE = /^(\d+)-(\d+)$/;
const clone = (o) => JSON.parse(JSON.stringify(o));
const dots = (u, n) => `${u}.${n}`;
const cfg = (id) => JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));

// Derive the bare skill phrase from a "I can …" objective.
function skillPhrase(obj, fallback) {
  if (!obj) return fallback;
  let s = String(obj)
    .trim()
    .replace(/^I can\s+/i, "");
  s = s.replace(/[.]\s*$/, "");
  return s || fallback;
}
const lc1 = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

// Strip artifacts irrelevant to a 20-min screen pull-out.
function stripHeavy(out) {
  delete out.googleForms;
  delete out.printables;
  delete out.graphicNovel;
  delete out.familyNotes;
  delete out.flagship;
  out.readiness = false;
}

function _firstLine(x) {
  if (!x) return null;
  if (Array.isArray(x.lines) && x.lines.length) return x.lines[0];
  return null;
}

// Order practice items so the compact renderer's rich interactions (MC,
// error-analysis, open-response) come first; complex widgets fall to the end.
const RICH = new Set(["multiple-choice", "error-analysis", "open-response"]);
function preferRich(arr) {
  return [...(arr || [])].sort((x, y) => (RICH.has(y.type) ? 1 : 0) - (RICH.has(x.type) ? 1 : 0));
}

function uniquePractice(...tiers) {
  const seen = new Set();
  return preferRich(tiers.flat()).filter((item) => {
    const key = item.stem || item.title || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractFacilitation(config) {
  const listenFor = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "listenFor" && typeof child === "string" && !listenFor.includes(child)) {
        listenFor.push(child);
      } else {
        visit(child);
      }
    }
  };
  visit(config);
  return { ...config.smallGroup, listenFor };
}

function toStudentConfig(value) {
  if (Array.isArray(value)) return value.map(toStudentConfig);
  if (!value || typeof value !== "object") return value;
  const clean = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "smallGroup" || key === "listenFor") continue;
    clean[key] = toStudentConfig(child);
  }
  return clean;
}

// ---------------------------------------------------------------- Group 1
// Extra Support — teacher-led re-teach + heavily scaffolded practice.
/**
 * The base lesson's interactive tool, wherever it was authored. Mirrors the
 * precedence in scripts/generate-homework-html.mjs `lessonModelCandidates`:
 * practice first, then explore, connect and the launch visual. Reading only
 * `practice.diagram` left every small group of a lesson whose tool sits in
 * connect/explore with no put-your-own-numbers-in tool at all — which is
 * exactly what lesson-tool-coverage checks for.
 */
function baseDiagram(base) {
  const first = (value) => {
    const arr = Array.isArray(value) ? value : [value];
    return arr.find((x) => x && typeof x === "object" && typeof x.kind === "string") || null;
  };
  return (
    first(base?.practice?.diagram) ||
    first(base?.explore?.diagram) ||
    first(base?.connect?.diagram) ||
    first(base?.launch?.visual) ||
    undefined
  );
}

/* Regeneration must never DELETE a hand-authored practice lab set.
 *
 * `baseDiagram()` returns ONE tool. A committed group can carry several — the
 * 3-1 groups mount a tape diagram AND a double number line, the two
 * representations official Reveal 3.1 builds its lesson on, scaled for each
 * group's level. A plain re-run collapsed both back to a single shared tool and
 * silently undid that authoring, the same class of loss withPriorVocabulary()
 * exists to stop. Only an ARRAY on disk is treated as deliberate; a group whose
 * committed diagram is a single object still tracks its base lesson.
 */
function withPriorDiagram(diagram, id) {
  const priorPath = join(LESSONS, id, "config.json");
  if (!existsSync(priorPath)) return diagram;
  let prior;
  try {
    prior = JSON.parse(readFileSync(priorPath, "utf8")).practice?.diagram;
  } catch {
    return diagram; // unreadable prior config is not a reason to fail the run
  }
  return Array.isArray(prior) && prior.length ? prior : diagram;
}

function buildGroup1(base, u, m) {
  const out = clone(base);
  const id = `${u}-${m}-group1`;
  const dm = dots(u, m);
  const skill = skillPhrase(base.contentObjective, base.title);
  stripHeavy(out);

  out.lessonId = id;
  out.variant = "group1";
  out.title = `${dm} Small Group · Group 1`;
  out.themeEmoji = "\u{1F91D}"; // 🤝
  out.timeEstimate = "~15–20 min";
  out.contentObjective = `With my small group, I can ${lc1(skill)} — one step at a time, with support.`;
  out.languageObjective = `I can talk through each step out loud using a sentence frame and the lesson's key words.`;

  const ci = clone(base.launch?.conceptIntro || {});
  const frames = [
    `The multiples/steps I need are ___ , and the answer is ___ .`,
    `I know because ___ .`,
  ];
  out.launch = out.launch || {};
  out.launch.badge = "Small Group · Foundations";
  out.launch.narrative =
    `This is your support small group for Lesson ${dm}. We're going to slow this down and build it together, one step at a time. ` +
    `You can ask a question any time — that's what this group is for.`;
  out.launch.conceptIntro = {
    heading: `Let's build it together — ${ci.heading || base.title}`,
    intro:
      (ci.intro ? ci.intro + " " : "") +
      "We'll walk through a worked example, try one together, then you'll try a few with hints right there when you need them.",
    keyIdea: ci.keyIdea || `The one thing to remember: ${skill}.`,
    iDo: ci.iDo || { title: "Watch me", lines: [] },
    weDo: {
      title: ci.weDo?.title || "Let's try together",
      lines: [...(ci.weDo?.lines || []), `Sentence frame — say it with me: "${frames[0]}"`],
    },
    youDo: {
      title: "Now you try — with support",
      lines: [
        "Try the practice problems below. The hint button is right there whenever you get stuck — use it, that's smart.",
        `Remember the key idea: ${ci.keyIdea || skill}.`,
      ],
    },
  };

  const p = base.practice || {};
  const practice = uniquePractice(
    p.approaching || [],
    p.onLevel || [],
    p.optional || [],
    p.extending || [],
  ).slice(0, 12);
  out.practice = {
    // The base lesson's interactive practice lab (factor-tree, area-morph,
    // equation-balance-lab, …). small-group-renderer.js already mounts
    // `practice.diagram` at the top of the Practice & Check tab; rebuilding
    // `out.practice` from scratch used to drop it, so every small group lost
    // the one put-your-own-numbers-in tool the full lesson gives students.
    diagram: withPriorDiagram(baseDiagram(base), id),
    approaching: practice.slice(0, 6),
    onLevel: practice.slice(6),
    extending: [],
    optional: [],
    commonMistake: p.commonMistake,
    optionalActivity: p.optionalActivity
      ? {
          ...p.optionalActivity,
          intro:
            "Optional — one more together if the group is ready: " +
            (p.optionalActivity.intro || ""),
        }
      : undefined,
  };
  out.smallGroupPractice = { guidedCount: 4, minimum: MINIMUM_PRACTICE };
  out.parallelPractice = buildParallelPractice(base, id, 1);

  if (out.explore?.instructions)
    out.explore.instructions = `Quick warm-up together: ${out.explore.instructions}`;

  if (out.reflect?.exitTicket) {
    out.reflect = clone(base.reflect);
    out.reflect.exitTicket.stem = `Quick check — you've got this: ${out.reflect.exitTicket.stem}`;
    // keep .hints so support is available on the check
  }

  out.vocabulary = withPriorVocabulary((base.vocabulary || []).slice(0, 8), id);

  out.smallGroup = {
    group: 1,
    label: "Extra Support",
    duration: "15–20 min",
    // Diagnostic, not "students who struggled" — this lesson's own distractors
    // can now name the error, so say which error to pull FOR. Falls back to the
    // generic line on lessons whose items diagnose nothing yet.
    who: (() => {
      const errors = diagnosedErrors(base);
      if (!errors.length)
        return "Pull 3–5 students who struggled on the formative check / exit ticket for this lesson.";
      return `Pull 3–5 students by the error they actually made on this lesson's check — this one diagnoses: ${errors
        .slice(0, 3)
        .join("; ")}. Group students who made the SAME error; they need different repairs.`;
    })(),
    // ASK / LOOK FOR / IF STUCK, built from THIS lesson's misconception tags,
    // common mistake and model. Replaces five prose bullets of which four were
    // identical across all 84 support lessons.
    teacherMoves: buildTeacherMoves({ base, group: 1, taxonomy: MISCONCEPTION_LABELS }),

    frames,
  };
  return { id, out };
}

// ---------------------------------------------------------------- Group 2
// Challenge — fast mastery confirm, then extension + justification.
function buildGroup2(base, u, m) {
  const out = clone(base);
  const id = `${u}-${m}-group2`;
  const dm = dots(u, m);
  const skill = skillPhrase(base.contentObjective, base.title);
  stripHeavy(out);

  out.lessonId = id;
  out.variant = "group2";
  out.title = `${dm} Small Group · Group 2`;
  out.themeEmoji = "\u{1F680}"; // 🚀
  out.timeEstimate = "~15–20 min";
  // NOT "in trickier cases". Harder numbers are more tedious, not more
  // demanding, and this wording is load-bearing: successCriteria() in
  // engine/core/small-group-mastery.js strips "I can" off this string and shows
  // it to students as the "Do it" criterion, so "trickier cases" told every
  // challenge group that the work ahead was bigger arithmetic. The real work
  // this group does is the L4 "Prove it" band, and this now says so.
  out.contentObjective = `I can ${lc1(skill)}, ${proveClause(skill)}`;
  out.languageObjective = `I can justify my answer to a skeptic and connect it to a second strategy or representation.`;

  const ci = clone(base.launch?.conceptIntro || {});
  const p = base.practice || {};

  out.launch = out.launch || {};
  out.launch.badge = "Small Group · Challenge";
  out.launch.narrative = `This is your challenge small group for Lesson ${dm}. You can already get the answer — so in here the answer is the starting point. We ask when the method holds, when it breaks, and how you would convince someone who disagrees.`;
  out.launch.conceptIntro = {
    heading: `Push further — ${ci.heading || base.title}`,
    // Extension here is abstraction, justification and transfer — not bigger
    // numbers. A student who is already fluent gains nothing from arithmetic
    // that is merely longer, and promising them "trickier numbers" set exactly
    // the wrong expectation for the Prove-It work this group actually does.
    intro:
      "You already can do this. So we go up a level, not up a number: find what is always true, show it a second way, and be ready to defend it with a reason instead of an answer.",
    keyIdea: ci.keyIdea
      ? `${String(ci.keyIdea).replace(/[.\s]+$/, "")} — and you can say why it is true, and where it would stop being true.`
      : "You can say why today's idea is true, and where it would stop being true.",
    // The Build step is a quick warm-up; the real challenge — generalizing,
    // justifying, and defending — lives in the guided "Prove It" tab (see
    // engine/core/small-group-innovation.js).
    iDo: ci.iDo || { title: "Start from the answer", lines: [] },
  };

  // Inherited core items first, then the authored challenge layer. A challenge
  // group has already mastered the core target, so re-serving core items alone
  // makes the extension "the same questions again" — see
  // tools/lib/small-group-challenge-tasks.mjs for what is authored and why.
  const inherited = uniquePractice(
    p.onLevel || [],
    p.extending || [],
    p.optional || [],
    p.approaching || [],
  ).slice(0, 12);
  const challenge = applyChallengeTasks(id, inherited);
  if (challenge.unmatchedDrops.length) {
    // A drop fragment matching nothing means the core item was reworded, so this
    // lesson is now serving an item the author decided to remove. Fail loudly:
    // silence here quietly restores arithmetic filler to a challenge group.
    throw new Error(
      `${id}: challenge-task drop fragment matched no item — ${challenge.unmatchedDrops.join("; ")}`,
    );
  }
  const practice = challenge.items;
  out.practice = {
    // Same rehearsal tool the full lesson mounts — see buildGroup1.
    diagram: withPriorDiagram(baseDiagram(base), id),
    approaching: [],
    onLevel: practice.slice(0, 4),
    extending: practice.slice(4),
    optional: [],
    commonMistake: p.commonMistake,
    optionalActivity: p.optionalActivity
      ? {
          ...p.optionalActivity,
          intro:
            "Challenge — prove it: " +
            (p.optionalActivity.intro || "") +
            " Convince a skeptic your answer is right.",
        }
      : undefined,
  };
  out.smallGroupPractice = { guidedCount: 3, minimum: MINIMUM_PRACTICE };
  out.parallelPractice = buildParallelPractice(base, id, 2);

  if (out.explore?.instructions)
    out.explore.instructions = `Go deeper: ${out.explore.instructions} As you work, ask yourself WHY it works.`;

  if (out.reflect?.exitTicket) {
    out.reflect = clone(base.reflect);
    out.reflect.exitTicket.stem = `Explain your thinking — ${out.reflect.exitTicket.stem}`;
  }

  out.vocabulary = withPriorVocabulary((base.vocabulary || []).slice(0, 8), id);

  out.smallGroup = {
    group: 2,
    label: "Challenge",
    duration: "15–20 min",
    who: "Pull students who showed mastery on the formative check and are ready to extend.",
    // ASK / LOOK FOR / IF STUCK / EXTEND — justification and generalisation,
    // never the support move with bigger numbers. All 84 challenge lessons
    // previously shared one identical move list.
    // Authored moves win where a lesson authored its own tasks: the generated
    // ones key off an inherited item tag and can describe another lesson.
    teacherMoves:
      challengeFacilitation(id) ||
      buildTeacherMoves({ base, group: 2, taxonomy: MISCONCEPTION_LABELS }),
  };
  return { id, out };
}

// ---------------------------------------------------------------- Assertions
function assertValid(id, out) {
  for (const k of ["launch", "explore", "practice", "connect", "reflect"])
    if (!out[k]) throw new Error(`${id}: missing phase ${k}`);
  const t = out.practice;
  if (!(t.approaching?.length || t.onLevel?.length || t.extending?.length))
    throw new Error(`${id}: all practice tiers empty`);
  if (!out.reflect?.exitTicket) throw new Error(`${id}: no exit ticket`);
  if ((out.vocabulary || []).length < 2) throw new Error(`${id}: thin vocab`);
  const practiceCount = ["approaching", "onLevel", "extending", "optional"].reduce(
    (sum, tier) => sum + (t[tier] || []).length,
    0,
  );
  if (practiceCount < MINIMUM_PRACTICE) {
    throw new Error(`${id}: only ${practiceCount} practice items (need ${MINIMUM_PRACTICE})`);
  }
}

// ---------------------------------------------------------------- Write
function writeLesson(id, out) {
  mkdirSync(join(LESSONS, id), { recursive: true });
  writeFileSync(join(LESSONS, id, "config.json"), JSON.stringify(out, null, 2) + "\n");
  if (CONFIGS_ONLY) return;
  // writeGenerated, not writeFileSync — see tools/generators-preserve-injected.test.mjs.
  // All 148 group/catch-up index.html shells carry injected sentinel blocks, and a
  // plain overwrite strips every one. On a brand-new lesson there is nothing to
  // preserve and this behaves identically to a plain write.
  writeGenerated(
    join(LESSONS, id, "index.html"),
    shellHtml(id, out.title, `Grade 6 Reveal Math small-group lesson — ${out.title}`),
  );
  writeFileSync(join(LESSONS, id, "lesson.js"), LESSON_JS);
}

// ---------------------------------------------------------------- Main
const bases = readdirSync(LESSONS)
  .filter((d) => BASE_RE.test(d) && existsSync(join(LESSONS, d, "config.json")))
  .filter((d) => FACILITATION_ONLY || !ONLY || d === ONLY)
  .sort((a, b) => {
    const [au, am] = a.split("-").map(Number);
    const [bu, bm] = b.split("-").map(Number);
    return au - bu || am - bm;
  });

/* Regeneration must never DELETE vocabulary that is already published.
 *
 * These groups take the base lesson's first 8 terms. Committed groups can hold
 * more — 5-1-group1/group2 carry all 10 of lesson 5-1's terms, so a plain
 * re-run stripped "Composite figure" and "Formula" from both. Same class of
 * silent loss the catch-up generator had (56 terms there); see
 * tools/generators-preserve-vocabulary.test.mjs.
 *
 * The cap stays — a small-group pull-out is meant to be compact — but nothing
 * already on disk is removed. A term goes away only by editing the config.
 */
function withPriorVocabulary(vocabulary, id) {
  const priorPath = join(LESSONS, id, "config.json");
  if (!existsSync(priorPath)) return vocabulary;
  const out = [...vocabulary];
  const seen = new Set(out.map((v) => String(v.term || "").toLowerCase()));
  let prior;
  try {
    prior = JSON.parse(readFileSync(priorPath, "utf8")).vocabulary || [];
  } catch {
    return out; // unreadable prior config is not a reason to fail the run
  }
  for (const v of prior) {
    const k = String(v.term || "").toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

const rows = [];
const facilitationByLesson = {};
for (const baseId of bases) {
  const [u, m] = baseId.split("-").map(Number);
  const base = cfg(baseId);
  for (const build of [buildGroup1, buildGroup2]) {
    const { id, out } = build(base, u, m);
    assertValid(id, out);
    const facilitation = extractFacilitation(out);
    const studentOut = toStudentConfig(out);
    facilitationByLesson[id] = facilitation;
    if (!DRY && !FACILITATION_ONLY) writeLesson(id, studentOut);
    const group = facilitation.group;
    rows.push({
      id,
      afterLesson: baseId,
      group,
      unit: u,
      title: studentOut.title,
      label: facilitation.label,
      objective: studentOut.contentObjective,
      search:
        `${baseId} small group group${group} ${group === 1 ? "support intervention reteach struggling" : "challenge extension enrichment"} ` +
        String(base.title || "").toLowerCase(),
      counts: {
        vocab: (studentOut.vocabulary || []).length,
        approaching: studentOut.practice.approaching.length,
        onLevel: studentOut.practice.onLevel.length,
        extending: studentOut.practice.extending.length,
        optional: studentOut.practice.optional.length,
      },
    });
  }
}

if (!DRY) {
  // `rows` describes only the lessons this run visited, so a scoped run must not
  // republish it as if it were the whole fleet.
  if (!ONLY && !FACILITATION_ONLY) {
    writeFileSync(
      new URL("./small-group-rows.json", import.meta.url),
      JSON.stringify(rows, null, 2) + "\n",
    );
  }
  /*
   * MERGE, never replace. `facilitationByLesson` holds only the lessons this run
   * built, and the previous code serialised it wholesale: `--only 3-1` rewrote
   * the module with 2 entries and silently destroyed facilitation for the other
   * 166 lessons, whose teacher route then had nothing to serve. A scoped run now
   * updates its own keys and leaves every other lesson intact.
   */
  let merged = facilitationByLesson;
  if (ONLY) {
    let existing = {};
    try {
      /*
       * Read the prior data by IMPORTING the module, not by slicing text out of
       * it and JSON.parse-ing that.
       *
       * The text-slice version was broken in the worst possible way. This
       * generator writes the file with JSON.stringify — quoted keys, valid JSON
       * — and then Biome reformats it to idiomatic JS with UNQUOTED keys
       * (`group: 1`). JSON.parse then threw on every subsequent scoped run, the
       * catch swallowed it, `existing` stayed empty, and the merge below
       * "merged" this run's handful of lessons over nothing — silently
       * rewriting the module with 2 entries and destroying facilitation for the
       * other 166 lessons, which is precisely the failure the comment above
       * says was fixed. Discovered by running `--only 9-1` and reading the diff:
       * 3454 lines deleted.
       *
       * Importing the module asks JavaScript to evaluate its own source, so no
       * formatting choice can break it. The cache-buster matters because this
       * process may already have imported the module.
       */
      const mod = await import(`file://${FACILITATION_MODULE}?t=${Date.now()}`);
      existing = mod.FACILITATION_BY_LESSON || {};
      if (!Object.keys(existing).length) {
        throw new Error("facilitation module parsed but held no lessons");
      }
    } catch (error) {
      // Never fall back to "start from empty" — that is the data-loss path.
      throw new Error(
        `${FACILITATION_MODULE}: could not read existing facilitation for a scoped run ` +
          `(${error.message}). Refusing to continue: writing now would drop every lesson ` +
          `this run did not build. Run without --only to rebuild the whole file.`,
      );
    }
    merged = { ...existing, ...facilitationByLesson };
  }
  const ordered = Object.fromEntries(
    Object.keys(merged)
      .sort()
      .map((k) => [k, merged[k]]),
  );
  writeFileSync(
    FACILITATION_MODULE,
    `// Generated by tools/generate-small-group-lessons.mjs. Teacher route only.\nexport const FACILITATION_BY_LESSON = ${JSON.stringify(ordered, null, 2)};\n`,
  );
  /*
   * Format the file we just wrote. JSON.stringify quotes every key and omits
   * trailing commas; Biome wants the opposite, so a plain write left
   * `npm run check` failing after every regeneration — which is how a generated
   * file ends up either hand-formatted or committed red.
   *
   * Calling the formatter is the right fix rather than emitting Biome's style by
   * hand: half a reimplementation of a formatter drifts the moment its config
   * changes. Best-effort — a generator that cannot format is not a generator
   * that should fail, and `npm run check` still catches it.
   */
  try {
    execFileSync("npx", ["biome", "format", "--write", FACILITATION_MODULE], { stdio: "ignore" });
  } catch (_error) {
    console.warn("  (biome format skipped — format the facilitation module before committing)");
  }
}

console.log(
  `${DRY ? "[dry] " : ""}base lessons: ${bases.length}  small-group lessons: ${rows.length}`,
);
for (const r of rows)
  console.log(
    `${r.id.padEnd(16)} after ${r.afterLesson.padEnd(6)} g${r.group} ${r.label.padEnd(14)} v${r.counts.vocab} a${r.counts.approaching} o${r.counts.onLevel} e${r.counts.extending} opt${r.counts.optional}`,
  );

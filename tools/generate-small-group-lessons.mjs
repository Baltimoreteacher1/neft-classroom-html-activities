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
//   node tools/generate-small-group-lessons.mjs --configs-only # preserve generated shells
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LESSON_JS, shellHtml } from "./lib/compact-shell.mjs";
import { buildParallelPractice } from "./lib/small-group-parallel-practice.mjs";

const ROOT = process.env.REPO || resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const FACILITATION_MODULE = join(ROOT, "functions", "teacher-small-group", "_facilitation-data.js");
const DRY = process.argv.includes("--dry");
const CONFIGS_ONLY = process.argv.includes("--configs-only");
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

function firstLine(x) {
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
  out.launch.badge = "Small Group · Extra Support";
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

  out.vocabulary = (base.vocabulary || []).slice(0, 4);

  out.smallGroup = {
    group: 1,
    label: "Extra Support",
    duration: "15–20 min",
    who: "Pull 3–5 students who struggled on the formative check / exit ticket for this lesson.",
    moves: [
      "Open with the worked example (I Do) — think aloud, don't just show.",
      "Do the We Do together; require every student to say the sentence frame.",
      "Release to the practice problems; the hint ladder is the safety net.",
      p.commonMistake
        ? `Watch for the common mistake: ${String(typeof p.commonMistake === "string" ? p.commonMistake : p.commonMistake.text || p.commonMistake.mistake || "see lesson note").replace(/\s*\.\s*$/, "")}.`
        : "Watch for where this group's thinking breaks down and name it out loud.",
      "Close with the exit-ticket check — celebrate the growth.",
    ],
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
  out.contentObjective = `I can go beyond today's lesson: ${lc1(skill)} in trickier cases, and explain WHY it works.`;
  out.languageObjective = `I can justify my answer to a skeptic and connect it to a second strategy or representation.`;

  const ci = clone(base.launch?.conceptIntro || {});
  const p = base.practice || {};
  const richWe = firstLine(ci.weDo) || firstLine(ci.iDo);

  out.launch = out.launch || {};
  out.launch.badge = "Small Group · Challenge";
  out.launch.narrative = `This is your challenge small group for Lesson ${dm}. You've got the basics — now let's push on it: harder cases, a second strategy, and always the question "how do you KNOW?"`;
  out.launch.conceptIntro = {
    heading: `Push further — ${ci.heading || base.title}`,
    intro:
      "You already can do this. In this group we go deeper: trickier numbers, a second way to see it, and explaining why it works — not just getting the answer.",
    keyIdea:
      (ci.keyIdea ? ci.keyIdea + " " : "") +
      "— and you can explain WHY, and predict when it gets tricky.",
    iDo: ci.iDo || { title: "A trickier case", lines: [] },
    weDo: {
      title: "Generalize it",
      lines: [
        richWe
          ? `Start from what you know: ${richWe}`
          : "Let's take today's idea one step further.",
        "Now predict: what happens with much bigger numbers, or numbers that share no common factors? Make a prediction, then check it.",
      ],
    },
    youDo: {
      title: "Take the challenge",
      lines: [
        "Work the challenge problems below. For each one, be ready to justify your answer to a skeptic.",
        "If you finish early: find a second strategy, or a case where it would break.",
      ],
    },
  };

  const practice = uniquePractice(
    p.onLevel || [],
    p.extending || [],
    p.optional || [],
    p.approaching || [],
  ).slice(0, 12);
  out.practice = {
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

  out.vocabulary = (base.vocabulary || []).slice(0, 4);

  out.smallGroup = {
    group: 2,
    label: "Challenge",
    duration: "15–20 min",
    who: "Pull students who showed mastery on the formative check and are ready to extend.",
    moves: [
      "Launch the challenge fast — skip the re-teach, they don't need it.",
      "Step back. Let them wrestle; protect the productive struggle.",
      'Ask "How do you know?" and "Can you show it a second way?" more than you explain.',
      "Push for a generalization: when does this hold, and when would it break?",
      "Close by having one student justify a claim to the group.",
    ],
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
  writeFileSync(
    join(LESSONS, id, "index.html"),
    shellHtml(id, out.title, `Grade 6 Reveal Math small-group lesson — ${out.title}`),
  );
  writeFileSync(join(LESSONS, id, "lesson.js"), LESSON_JS);
}

// ---------------------------------------------------------------- Main
const bases = readdirSync(LESSONS)
  .filter((d) => BASE_RE.test(d) && existsSync(join(LESSONS, d, "config.json")))
  .filter((d) => !ONLY || d === ONLY)
  .sort((a, b) => {
    const [au, am] = a.split("-").map(Number);
    const [bu, bm] = b.split("-").map(Number);
    return au - bu || am - bm;
  });

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
    if (!DRY) writeLesson(id, studentOut);
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
  writeFileSync(
    new URL("./small-group-rows.json", import.meta.url),
    JSON.stringify(rows, null, 2) + "\n",
  );
  writeFileSync(
    FACILITATION_MODULE,
    `// Generated by tools/generate-small-group-lessons.mjs. Teacher route only.\nexport const FACILITATION_BY_LESSON = ${JSON.stringify(facilitationByLesson, null, 2)};\n`,
  );
}

console.log(
  `${DRY ? "[dry] " : ""}base lessons: ${bases.length}  small-group lessons: ${rows.length}`,
);
for (const r of rows)
  console.log(
    `${r.id.padEnd(16)} after ${r.afterLesson.padEnd(6)} g${r.group} ${r.label.padEnd(14)} v${r.counts.vocab} a${r.counts.approaching} o${r.counts.onLevel} e${r.counts.extending} opt${r.counts.optional}`,
  );

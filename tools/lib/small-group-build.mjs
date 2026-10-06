/**
 * small-group-build.mjs — the ONE place a studio config gets its Build content.
 *
 * Source of truth: data/small-group-build/<lesson>.json (contract:
 * docs/specs/small-group-build-v2.md, gate: tools/validate-small-group-build.mjs).
 * Both generators (generate-small-group-lessons.mjs, generate-catchup-lessons.mjs)
 * call into here, and they call it AFTER their additive merge: these fields are
 * owned outright by the authored build data, so a committed config never keeps
 * a stale copy of them.
 *
 * Owned fields:
 *   topic                     the base lesson title (the studio headline)
 *   launch.build              what the Build section renders
 *   launch.conceptIntro       a text projection of launch.build for the readers
 *                             that predate it (practice packets, the teacher
 *                             plan, notebook prompts). `interactiveVisual` is
 *                             authored separately and is carried over.
 *   vocabulary                lesson-title "concept" entries dropped from Key
 *                             Words; unclear example chips replaced per term.
 *   revealWordProblem         the base lesson's Reveal Apply problem, copied every
 *                             run (the 2026-08-10 renumber stripped the old ones
 *                             from 26 studios and nothing restored them), or
 *                             removed when the practice data opts out (`apply`).
 *   launch.practice           what Practice together / On my own / Talk / Check /
 *                             Challenge render — from data/small-group-practice/
 *                             <lesson>.json (docs/specs/small-group-practice-v1.md,
 *                             gate tools/validate-small-group-practice.mjs).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CORE_ID_RE, DATA_DIR, listLessonDirs, loadLessonConfig } from "./curriculum-source.mjs";

const DIR = join(DATA_DIR, "small-group-build");
const PRACTICE_DIR = join(DATA_DIR, "small-group-practice");

export function loadPractice(lessonId) {
  const file = join(PRACTICE_DIR, `${lessonId}.json`);
  if (!existsSync(file))
    throw new Error(
      `${lessonId}: no data/small-group-practice/${lessonId}.json — every base lesson needs its practice content`,
    );
  return JSON.parse(readFileSync(file, "utf8"));
}

export function loadBuild(lessonId) {
  const file = join(DIR, `${lessonId}.json`);
  if (!existsSync(file))
    throw new Error(
      `${lessonId}: no data/small-group-build/${lessonId}.json — every base lesson needs its Build content`,
    );
  return JSON.parse(readFileSync(file, "utf8"));
}

const strip = (s) =>
  String(s || "")
    .replace(/\{(\d+)\/(\d+)\}/g, "$1/$2")
    .replace(/\s*⟶\s*/g, " → ");
const mathText = (m) => (Array.isArray(m) ? m.map(strip).join("; ") : strip(m));

/** "Put the values in order." + "2, 4, 4, 6, 9" → "Put the values in order: 2, 4, 4, 6, 9". */
function stepLine(step, es = false) {
  const lead = strip(es ? step.doEs : step.do);
  if (step.math === undefined) return lead;
  const math = es && step.mathEs !== undefined ? step.mathEs : step.math;
  return `${lead.replace(/[.:]\s*$/, "")}: ${mathText(math)}`;
}

function exampleLines(ex, es = false) {
  const p = (k) => strip(es ? ex[`${k}Es`] : ex[k]);
  return [p("problem"), ...ex.steps.map((s) => stepLine(s, es)), p("answer")];
}

function togetherLines(ex, es = false) {
  const p = (k) => strip(es ? ex[`${k}Es`] : ex[k]);
  return [
    p("problem"),
    ...ex.steps.map((s) => {
      const ask = strip(es ? s.askEs : s.ask);
      const answer = strip(es ? s.answerEs || s.answer : s.answer);
      return `${ask} (${answer})`;
    }),
  ];
}

/** The conceptIntro text projection of one studio's build. */
export function projectConceptIntro(build, { heading, prior }) {
  const ci = {
    heading,
    intro: strip(build.todayIdea),
    introEs: strip(build.todayIdeaEs),
    keyIdea: strip(build.bigIdea),
    keyIdeaEs: strip(build.bigIdeaEs),
    iDo: {
      title: strip(build.examples[0].title),
      titleEs: strip(build.examples[0].titleEs),
      lines: build.examples.flatMap((ex) => exampleLines(ex)),
      linesEs: build.examples.flatMap((ex) => exampleLines(ex, true)),
    },
    weDo: {
      title: strip(build.together.title),
      titleEs: strip(build.together.titleEs),
      lines: togetherLines(build.together),
      linesEs: togetherLines(build.together, true),
    },
    youDo: {
      title: "Your turn",
      titleEs: "Tu turno",
      lines: [
        strip(build.tryIt.problem),
        ...(build.tryIt.explain ? [strip(build.tryIt.explain)] : []),
      ],
      linesEs: [
        strip(build.tryIt.problemEs),
        ...(build.tryIt.explain ? [strip(build.tryIt.explainEs)] : []),
      ],
    },
  };
  if (prior?.interactiveVisual) ci.interactiveVisual = prior.interactiveVisual;
  return ci;
}

let conceptTerms;
/**
 * Every base lesson's "concept" vocabulary term (its own title phrased as a
 * word, e.g. "Describe the Data Using the Median"). Older studio and catch-up
 * copies of those entries lost their `role`, so they are matched by term.
 */
function lessonConceptTerms() {
  if (conceptTerms) return conceptTerms;
  conceptTerms = new Set();
  for (const id of listLessonDirs({ filter: CORE_ID_RE })) {
    for (const v of loadLessonConfig(id).vocabulary || [])
      if (v?.role === "concept" && v.term) conceptTerms.add(v.term.toLowerCase());
  }
  return conceptTerms;
}

/** Key Words: no lesson-title "concept" entries; authored chip replacements applied. */
export function studioVocabulary(vocabulary, overrides = {}) {
  const concepts = lessonConceptTerms();
  return (vocabulary || [])
    .filter((v) => v && v.role !== "concept" && !concepts.has(String(v.term || "").toLowerCase()))
    .map((v) => (overrides[v.term] ? { ...v, examples: overrides[v.term].examples } : v));
}

/**
 * The Hands-On Model lab draws the base lesson's figure (explore.diagram). When
 * its instructions do not name that figure's numbers — a challenge studio's
 * worked example is a different, harder problem — the student would see a
 * figure no words on the step describe. Name the problem the model draws.
 */
function nameModelProblem(config, data) {
  const d = config.explore?.diagram;
  if (d?.kind !== "area-morph" || !config.explore) return;
  const instructions = String(config.explore.instructions || "");
  const states = (v) =>
    new RegExp(`(^|[^\\d.])${String(v).replace(".", "\\.")}([^\\d.]|$)`).test(instructions);
  if ([d.a, d.b, d.h].filter((v) => v != null).every(states)) return;
  const ex = data.group1.examples[0];
  config.explore.instructions =
    `${instructions} The model shows this problem: ${strip(ex.problem)}`.trim();
  if (config.explore.instructionsEs)
    config.explore.instructionsEs = `${config.explore.instructionsEs} El modelo muestra este problema: ${strip(ex.problemEs)}`;
}

/** Set every Build-owned field on a group1/group2 studio config. */
export function applyStudioBuild(config, { variant, data, baseTitle, applyProblem }) {
  const build = data[variant];
  if (!build) throw new Error(`${config.lessonId}: build data has no ${variant} block`);
  config.topic = baseTitle;
  config.launch = config.launch || {};
  config.launch.build = build;
  config.launch.conceptIntro = projectConceptIntro(build, {
    heading: baseTitle,
    prior: config.launch.conceptIntro,
  });
  config.vocabulary = studioVocabulary(config.vocabulary, data.vocab);
  nameModelProblem(config, data);
  const practiceData = loadPractice(config.lessonId.replace(/-group[12]$/, ""));
  const practice = practiceData[variant];
  if (!practice) throw new Error(`${config.lessonId}: practice data has no ${variant} block`);
  config.launch.practice = practice;
  // The studio's Apply step is the base lesson's Reveal problem — unless the
  // practice data records why that problem does not fit the small group.
  if (applyProblem && practiceData.apply?.use !== false) config.revealWordProblem = applyProblem;
  else delete config.revealWordProblem;
  return config;
}

/**
 * Set every Build-owned field on a catch-up config. `sources` is the band, in
 * order: [{ id: "2-3", dot: "2.3", title, data }].
 */
export function applyCatchupBuild(config, { sources, range }) {
  const lessons = sources.map((s) => ({
    short: `${s.dot}`,
    example: { ...s.data.catchup, title: `Lesson ${s.dot} · ${s.data.catchup.title}` },
    check: s.data.catchup.check,
    bigIdea: s.data.group1.bigIdea,
    bigIdeaEs: s.data.group1.bigIdeaEs,
  }));
  for (const l of lessons) l.example.titleEs = `Lección ${l.short} · ${l.example.titleEs}`;
  // Practice: each lesson in the band contributes its two catch-up problems and
  // its check, labelled with the lesson they practise.
  const tagged = (s, item) => ({ ...item, lesson: s.dot });
  const practiceData = sources.map((s) => ({ s, p: loadPractice(s.id).catchup }));
  const single = sources.length === 1;
  config.launch = config.launch || {};
  config.launch.practice = {
    onMyOwn: practiceData.flatMap(({ s, p }) => p.practice.map((item) => tagged(s, item))),
    check: practiceData.map(({ s, p }) => tagged(s, p.check)),
    // Print only: each lesson's Group 1 mirror check, so the second printed
    // form (Set B) of a one-lesson catch-up still has enough problems.
    review: sources.map((s) => tagged(s, loadPractice(s.id).group1.check[0])),
  };
  config.launch.build = {
    todayIdea: single
      ? `Catch up on Lesson ${range}: one worked example and one quick check.`
      : `Catch up on Lessons ${range}: one worked example and one quick check for each lesson.`,
    todayIdeaEs: single
      ? `Ponte al día con la Lección ${range.replace(/\s*[–—]\s*/g, " a ")}: un ejemplo resuelto y una comprobación rápida.`
      : `Ponte al día con las Lecciones ${range.replace(/\s*[–—]\s*/g, " a ")}: un ejemplo resuelto y una comprobación rápida por lección.`,
    lessons,
  };
  const prior = config.launch.conceptIntro;
  config.launch.conceptIntro = {
    heading: `Catch-Up — ${single ? "Lesson" : "Lessons"} ${range}`,
    intro: config.launch.build.todayIdea,
    introEs: config.launch.build.todayIdeaEs,
    keyIdea: lessons.map((l) => `${l.short}: ${strip(l.bigIdea)}`).join(" • "),
    keyIdeaEs: lessons.map((l) => `${l.short}: ${strip(l.bigIdeaEs)}`).join(" • "),
    iDo: {
      title: "One worked example per lesson",
      titleEs: "Un ejemplo resuelto por lección",
      lines: lessons.flatMap((l) => exampleLines(l.example)),
      linesEs: lessons.flatMap((l) => exampleLines(l.example, true)),
    },
    weDo: {
      title: "Quick checks",
      titleEs: "Comprobaciones rápidas",
      lines: lessons.map((l) => strip(l.check.problem)),
      linesEs: lessons.map((l) => strip(l.check.problemEs)),
    },
    youDo: {
      title: "Show you're caught up",
      titleEs: "Demuestra que estás al día",
      lines: ["Solve the mixed practice. Each problem is tagged with its lesson number."],
      linesEs: ["Resuelve la práctica mixta. Cada problema está marcado con su número de lección."],
    },
  };
  if (prior?.interactiveVisual)
    config.launch.conceptIntro.interactiveVisual = prior.interactiveVisual;
  config.vocabulary = studioVocabulary(
    config.vocabulary,
    Object.assign({}, ...sources.map((s) => s.data.vocab || {})),
  );
  return config;
}

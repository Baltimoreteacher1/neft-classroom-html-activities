// The Math Studio lesson registry: one record per lesson, composed from sources that already exist. Nothing is authored
// here. A lesson's Explore model is its Learning Lab's model; its practice items are the lesson config's own items and
// the lab's model items; its explanation, application and reflection come from the lesson config. A practice item gets a
// model hand-off only when its stated settings reproduce its answer in that model (verifyHandoff).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { verifyHandoff } from "../../assets/math-studio/core.mjs";
import { controls } from "../../curriculum/learning-labs/shared/math.mjs";
import { blueprints } from "../../tools/learning-labs/blueprints.mjs";
import { loadLessonConfig, REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { studioUrls } from "../generate-lesson-paths.mjs";

/** Units in scope: the taught units with Practice Studios. Units 1 and 10 are not taught (Joel, 10-07 and 11-11). */
export const MATH_STUDIO_UNITS = [2, 3, 4, 5, 6, 7, 8, 9];
export const OUT_OF_SCOPE = {
  1: "Unit 1 is not taught this year",
  10: "Unit 10 is not taught this year",
};

const readJson = (rel) => JSON.parse(readFileSync(join(REPO_ROOT, rel), "utf8"));
const has = (url) => {
  const p = url.split(/[?#]/)[0].replace(/^\//, "");
  return existsSync(join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p));
};
const clean = (o) =>
  Object.fromEntries(
    Object.entries(o).filter(
      ([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length),
    ),
  );

/** A config multiple-choice item in the studio's item shape. */
function mcItem(it, id) {
  if (
    it?.type !== "multiple-choice" ||
    !Array.isArray(it.choices) ||
    !Number.isInteger(it.correctIndex)
  )
    return null;
  if (it.correctIndex < 0 || it.correctIndex >= it.choices.length) return null;
  return clean({
    id,
    kind: "mc",
    prompt: it.stem,
    promptEs: it.stemEs,
    choices: it.choices,
    choicesEs: it.choicesEs?.length === it.choices.length ? it.choicesEs : undefined,
    correct: it.correctIndex,
    feedback: it.choiceFeedback,
    feedbackEs: it.choiceFeedbackEs,
    tags: it.misconceptionTags,
    hints: it.hints,
    hintsEs: it.hintsEs,
    explanation: it.explanation,
    explanationEs: it.explanationEs,
  });
}
/** connect.check stores its answer at `answer`, not `correctIndex`. */
const checkItem = (it, id) =>
  mcItem({ ...it, type: "multiple-choice", correctIndex: it?.correctIndex ?? it?.answer }, id);

/** Config error analysis -> "which step is wrong?" */
function eaItem(it, id) {
  const steps = it?.workedExample;
  if (
    it?.type !== "error-analysis" ||
    !Array.isArray(steps) ||
    !Number.isInteger(it.errorStep) ||
    it.errorStep < 0 ||
    it.errorStep >= steps.length
  )
    return null;
  return clean({
    id,
    kind: "ea",
    prompt: it.title || "Find the step with the mistake",
    promptEs: it.titleEs,
    steps: steps.map((s) =>
      clean({ label: s.label, work: s.work, labelEs: s.labelEs, workEs: s.workEs }),
    ),
    errorStep: it.errorStep,
    correctWork: typeof it.correctWork === "string" ? it.correctWork : undefined,
    correctWorkEs: typeof it.correctWorkEs === "string" ? it.correctWorkEs : undefined,
    hints: it.hints,
    hintsEs: it.hintsEs,
    explanation: it.explanation,
    explanationEs: it.explanationEs,
  });
}

/** "Juice (cups): 3" lines -> the model's values in control order, or null when they do not line up. */
function paramValues(model, parameters) {
  const fields = controls(model);
  const values = [...model.values];
  const used = fields.map((f, i) => ({ f, i })).filter(({ f }) => f.label !== "Unused");
  if (!Array.isArray(parameters) || parameters.length !== used.length) return null;
  for (const [k, { f, i }] of used.entries()) {
    const m = /^(.*):\s*(-?\d+(?:\.\d+)?)\s*$/.exec(parameters[k]);
    if (!m || m[1].trim() !== f.label) return null;
    values[i] = Number(m[2]);
  }
  return values;
}

/** A lab numeric item, with a model hand-off when (and only when) its settings verify. */
function numItem(it, model, stats) {
  if (it.type !== "number" || !Number.isFinite(it.answer)) return null;
  let values = null;
  if (it.parameters) {
    values = paramValues(model, it.parameters);
    if (values && !verifyHandoff(model, values, it.answer, it.tolerance)) values = null;
    stats[values ? "verified" : "refused"]++;
  }
  return clean({
    id: `lab-${it.id}`,
    kind: "num",
    prompt: it.parameters
      ? `${it.prompt.replace(/^Set the lab model to these values\.\s*/, "")} ${it.parameters.join("; ")}.`
      : it.prompt,
    answer: it.answer,
    tolerance: it.tolerance,
    hints: it.hints,
    explanation: it.explanation,
    mistakes: it.mistakes,
    model: values ? { values } : undefined,
  });
}

const firstUnique = (items, n) => {
  const seen = new Set();
  return items
    .filter(Boolean)
    .filter((it) => (seen.has(it.prompt) ? false : seen.add(it.prompt)))
    .slice(0, n);
};

export function lessonRecord(lesson, lab, labContent, traps, stats) {
  const id = lesson.id;
  const cfg = loadLessonConfig(id);
  const P = cfg.practice || {};
  const tier = (name) => (P[name] || []).map((it, i) => ({ it, id: `${name}-${i}` }));
  const labItems = (level) =>
    (labContent.practice?.[level] || []).filter((it) => !it.lesson || it.lesson === id);
  const model = lab.model;

  const regular = firstUnique(
    [
      ...tier("approaching")
        .map(({ it, id: k }) => mcItem(it, k))
        .slice(0, 4),
      ...labItems("core").map((it) => numItem(it, model, stats)),
      ...tier("onLevel").map(({ it, id: k }) => mcItem(it, k)),
    ],
    8,
  );
  const challenge = firstUnique(
    [
      ...tier("extending").map(({ it, id: k }) => mcItem(it, k)),
      ...labItems("stretch").map((it) => numItem(it, model, stats)),
      ...tier("extending").map(({ it, id: k }) => eaItem(it, k)),
      ...tier("onLevel").map(({ it, id: k }) => eaItem(it, k)),
    ],
    6,
  );

  const tags = new Set([...regular, ...challenge].flatMap((it) => it.tags || []).filter(Boolean));
  const exit = mcItem({ ...cfg.reflect?.exitTicket, type: "multiple-choice" }, "exit");
  const transfer = cfg.familyCheck
    ? mcItem({ ...cfg.familyCheck, type: "multiple-choice" }, "transfer")
    : checkItem(cfg.connect?.check?.[0], "transfer");
  const errorAnalysis =
    [...tier("approaching"), ...tier("onLevel"), ...tier("optional")]
      .map(({ it }) => eaItem(it, "error"))
      .find(Boolean) || null;
  for (const t of [exit, transfer].flatMap((x) => x?.tags || [])) if (t) tags.add(t);
  const open = (P.extending || []).find((it) => it.type === "open-response" && it.stem);
  const ci = cfg.launch?.conceptIntro || {};
  const steps = (k) =>
    ci[k]?.lines?.length
      ? clean({
          title: ci[k].title,
          lines: ci[k].lines,
          linesEs: ci[k].linesEs?.length === ci[k].lines.length ? ci[k].linesEs : undefined,
        })
      : undefined;
  const [practiceUrl, challengeUrl] = studioUrls(id);
  const resources = [
    ["Interactive lesson", `/lessons/${id}/`],
    ["Slides", `/lessons/${id}/slides.html`],
    ["Student notes", `/lessons/${id}/notes.html`],
    ["Worksheet", `/lessons/${id}/worksheet.html`],
    ["Printable lesson", `/lessons/${id}/printable.html`],
    ["Vocabulary", `/lessons/${id}/vocab.html`],
    ["Small group: support", `/lessons/${id}-group1/`],
    ["Small group: challenge", `/lessons/${id}-group2/`],
    ["Part 2 · Apply", `/lessons/${id}-part2/`],
    ["Family homework", `/lessons/${id}/homework.html`],
    ["Lesson path (one page)", `/math/lesson-path/${id}/`],
  ]
    .filter(([, href]) => has(href))
    .map(([label, href]) => ({ label, href }));

  return clean({
    id,
    unit: lesson.unit,
    lesson: lesson.lesson,
    title: lesson.title,
    standard: lesson.standard,
    objective: cfg.contentObjective || lesson.objective,
    languageObjective: cfg.languageObjective,
    time: cfg.timeEstimate,
    concept: `${model.kind}:${model.mode}`,
    lab: clean({
      id: lab.id,
      title: lab.title,
      href: `/curriculum/learning-labs/${lab.id}/`,
      lessons: lab.lessons,
      model,
      investigate: lab.investigate,
      create: lab.create,
      mission: lab.mission,
    }),
    understand: clean({
      heading: ci.heading,
      headingEs: ci.headingEs,
      intro: ci.intro,
      introEs: ci.introEs,
      keyIdea: ci.keyIdea,
      keyIdeaEs: ci.keyIdeaEs,
      iDo: steps("iDo"),
      weDo: steps("weDo"),
      youDo: steps("youDo"),
      picture:
        cfg.noticeAndWonder?.image && has(cfg.noticeAndWonder.image)
          ? clean({
              src: cfg.noticeAndWonder.image,
              alt: cfg.noticeAndWonder.imageAlt,
              altEs: cfg.noticeAndWonder.imageAltEs,
              context: cfg.noticeAndWonder.context,
              contextEs: cfg.noticeAndWonder.contextEs,
            })
          : undefined,
      vocabulary: (cfg.vocabulary || [])
        .slice(0, 8)
        .map((v) =>
          clean({
            term: v.term,
            termEs: v.termEs,
            definition: v.definition,
            definitionEs: v.definitionEs,
            image: v.image && has(v.image) ? v.image : undefined,
            example: v.visual,
          }),
        ),
      mistake: P.commonMistake,
      frame: cfg.explore?.discourse?.sentenceFrame,
      frameEs: cfg.explore?.discourse?.sentenceFrameEs,
    }),
    practice: { regular, challenge, urls: { regular: practiceUrl, challenge: challengeUrl } },
    apply: clean({
      wordProblem: cfg.revealWordProblem?.text
        ? clean({
            title: cfg.revealWordProblem.title,
            text: cfg.revealWordProblem.text,
            image:
              cfg.revealWordProblem.image && has(cfg.revealWordProblem.image)
                ? cfg.revealWordProblem.image
                : undefined,
            imageAlt: cfg.revealWordProblem.imageAlt,
            sample: cfg.revealWordProblem.sampleAnswer,
          })
        : undefined,
      reasoning: open
        ? clean({
            prompt: open.stem,
            promptEs: open.stemEs,
            sample: open.sampleAnswer,
            keywords: open.keywords,
            hint: open.hint,
          })
        : undefined,
      scenario: cfg.connect?.scenario
        ? clean({
            text: cfg.connect.scenario,
            textEs: cfg.connect.scenarioEs,
            prompt: cfg.connect.prompt,
            promptEs: cfg.connect.promptEs,
            sample: cfg.connect.modelAnswer,
            keywords: cfg.connect.keywords,
          })
        : undefined,
      optional: [
        ...(cfg.projects || [])
          .filter((p) => p.href?.startsWith("/") && has(p.href))
          .slice(0, 3)
          .map((p) => ({ label: p.title, href: p.href, kind: "project" })),
        ...(cfg.graphicNovel?.href && has(cfg.graphicNovel.href)
          ? [{ label: cfg.graphicNovel.title, href: cfg.graphicNovel.href, kind: "story" }]
          : []),
      ],
    }),
    reflect: clean({
      checks: [exit, transfer].filter(Boolean),
      errorAnalysis,
      frame: cfg.explore?.discourse?.sentenceFrame,
      frameEs: cfg.explore?.discourse?.sentenceFrameEs,
      keywords: cfg.explore?.discourse?.keywords,
      prompt: cfg.explore?.discourse?.prompt,
      promptEs: cfg.explore?.discourse?.promptEs,
    }),
    misconceptions: Object.fromEntries(
      [...tags]
        .filter((t) => traps[t])
        .map((t) => [
          t,
          clean({
            name: traps[t].name,
            nameEs: traps[t].nameEs,
            fix: traps[t].fix,
            fixEs: traps[t].fixEs,
          }),
        ]),
    ),
    resources,
  });
}

/** Every in-scope lesson, in curriculum order, plus the inventory the coverage audit reads. */
export function buildRegistry() {
  const manifest = readJson("data/curriculum-launch-manifest.json");
  const { traps } = readJson("data/practice-studio/misconceptions.json");
  const labFor = new Map(blueprints.flatMap((b) => b.lessons.map((l) => [l, b])));
  const stats = { verified: 0, refused: 0 };
  const lessons = [];
  const skipped = [];
  for (const lesson of manifest.lessons) {
    if (!MATH_STUDIO_UNITS.includes(lesson.unit)) {
      skipped.push({
        id: lesson.id,
        reason: OUT_OF_SCOPE[lesson.unit] || `Unit ${lesson.unit} is outside Math Studio`,
      });
      continue;
    }
    const lab = labFor.get(lesson.id);
    if (!lab)
      throw new Error(
        `Math Studio: lesson ${lesson.id} has no Learning Lab in tools/learning-labs/blueprints.mjs`,
      );
    const labContent = readJson(`curriculum/learning-labs/${lab.id}/content.json`);
    lessons.push(lessonRecord(lesson, lab, labContent, traps, stats));
  }
  const ids = lessons.map((l) => l.id);
  if (new Set(ids).size !== ids.length)
    throw new Error("Math Studio: duplicate lesson ids in the registry");
  return { lessons, skipped, stats };
}

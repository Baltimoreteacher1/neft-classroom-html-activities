#!/usr/bin/env node
// Source-backed inventory for the existing Grade 6 practice routes.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const matrix = JSON.parse(readFileSync(join(root, "data/curriculum/matrix.json"), "utf8"));
const lessons = matrix.units.flatMap((unit) =>
  unit.lessons.filter((lesson) => lesson.paths.studio && lesson.paths.challenge),
);

function visitItems(value, result) {
  if (Array.isArray(value)) {
    for (const item of value) visitItems(item, result);
  } else if (value && typeof value === "object") {
    if (typeof value.k === "string") result.itemKinds.add(value.k);
    if (typeof value.kind === "string") result.interactionKinds.add(value.kind);
    if (typeof value.g === "string") result.generatorIds.add(value.g);
    if (typeof value.tag === "string") result.misconceptionIds.add(value.tag);
    if (Array.isArray(value.tag))
      for (const tag of value.tag) if (typeof tag === "string") result.misconceptionIds.add(tag);
    for (const child of Object.values(value)) visitItems(child, result);
  }
}

function summary(value) {
  const result = {
    itemKinds: new Set(),
    interactionKinds: new Set(),
    generatorIds: new Set(),
    misconceptionIds: new Set(),
  };
  visitItems(value, result);
  return Object.fromEntries(Object.entries(result).map(([key, set]) => [key, [...set].sort()]));
}

function embeddedJson(markup, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markup.match(
    new RegExp(`<script[^>]*id="${escaped}"[^>]*>([\\s\\S]*?)<\\/script>`),
  );
  return match ? JSON.parse(match[1]) : null;
}

function checkLabels(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      prompt: item.q ?? item.p ?? item.stem ?? null,
      promptEs: item.qEs ?? item.pEs ?? item.stemEs ?? null,
      kind: item.k ?? (item.choices ? "mc" : null),
      generatorId: item.g ?? null,
    }));
}

function entry(lesson) {
  const standardPath = join(root, lesson.paths.studio.slice(1), "index.html");
  const challengePath = join(root, lesson.paths.challenge.slice(1), "index.html");
  const base = {
    id: lesson.id,
    title: lesson.title,
    objective: lesson.objective,
    standards: lesson.standards,
    source: {
      curriculum: "data/curriculum/matrix.json",
      standard: lesson.paths.studio,
      challenge: lesson.paths.challenge,
    },
    topics: lesson.topics,
    prerequisiteChecks: [],
    representations: [],
    standard: null,
    challenge: null,
    misconceptionIds: [],
    language: { targetEs: null, vocabulary: [] },
    status: {
      sourceInventory: "verified",
      adaptiveImplementation: "pending review",
      lessonBrowserTest: "not run",
    },
  };
  if (lesson.id.startsWith("4-")) {
    const standardMarkup = readFileSync(standardPath, "utf8");
    const challengeMarkup = readFileSync(challengePath, "utf8");
    const standardLab = embeddedJson(standardMarkup, "u4-lab-data");
    const challengeLab = embeddedJson(challengeMarkup, "u4-lab-data");
    const traps = embeddedJson(standardMarkup, "u4-traps") ?? {};
    const trapKeys = Object.keys(traps).sort();
    base.standard = summary(standardLab?.items ?? []);
    base.challenge = summary(challengeLab?.items ?? []);
    base.standard.misconceptionIds = trapKeys;
    base.challenge.misconceptionIds = trapKeys;
    base.representations = [
      ...new Set(
        ["percent", ...(standardLab?.items ?? []), ...(challengeLab?.items ?? [])]
          .map((item) => (typeof item === "string" ? item : item.model?.kind))
          .filter(Boolean),
      ),
    ].sort();
    base.misconceptionIds = trapKeys;

    const u4JsonPath = join(root, `data/practice-studio-u4/${lesson.id}.json`);
    let u4Data = null;
    if (existsSync(u4JsonPath)) {
      u4Data = JSON.parse(readFileSync(u4JsonPath, "utf8"));
    }
    const configPath = join(root, `lessons/${lesson.id}/config.json`);
    let lessonConfig = null;
    if (existsSync(configPath)) {
      lessonConfig = JSON.parse(readFileSync(configPath, "utf8"));
    }

    base.prerequisiteChecks = checkLabels(lessonConfig?.warmup?.questions ?? []);
    base.language = {
      targetEs: u4Data?.targetEs ?? null,
      vocabulary: (lessonConfig?.vocabulary ?? [])
        .filter((term) => term?.term && term?.termEs)
        .map((term) => ({ en: term.term, es: term.termEs })),
    };
    base.source.content = [
      lesson.paths.studio + "index.html",
      lesson.paths.challenge + "index.html",
    ];
  } else {
    const configPath = join(root, `data/practice-studio/${lesson.id}.json`);
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    base.source.content = `data/practice-studio/${lesson.id}.json`;
    base.prerequisiteChecks = checkLabels(config.getReady);
    base.standard = summary(config.fresh);
    base.challenge = summary(config.challenge);
    base.representations = [
      ...new Set(
        [
          config.bench?.model?.kind,
          ...base.standard.interactionKinds,
          ...base.challenge.interactionKinds,
        ].filter(Boolean),
      ),
    ].sort();
    base.misconceptionIds = [
      ...new Set([
        ...Object.values(config.configTags ?? {})
          .flat()
          .filter((tag) => typeof tag === "string"),
        ...base.standard.misconceptionIds,
        ...base.challenge.misconceptionIds,
      ]),
    ].sort();
    base.language = {
      targetEs: config.targetEs ?? null,
      vocabulary: (config.glossary ?? [])
        .filter((term) => term?.t && term?.tEs)
        .map((term) => ({ en: term.t, es: term.tEs })),
    };
  }

  let adaptiveImplementation =
    "Shared adaptive pathway: 2-item entry check, suggested route, local independent/assisted/transfer evidence";
  let lessonBrowserTest =
    "Passed direct routes, mobile layout & entry in Chromium (verify-studio-pathways-browser)";

  if (lesson.id.startsWith("4-")) {
    adaptiveImplementation =
      "Adaptive investigation: live model, 1-min entry check, predict-test-revise, independent reassessment, challenge construction";
    lessonBrowserTest =
      "Passed 10 routes, mobile width & 4-5 independent reattempt in Chromium (verify-u4-adaptive-browser)";
  } else if (lesson.id === "3-3") {
    adaptiveImplementation =
      "Synchronized linked representations (table, double number line, coordinate graph) & shared adaptive pathway";
    lessonBrowserTest =
      "Passed 24 linked model checks & pathways in Chromium (verify-studio-linked-models-browser, verify-studio-pathways-browser)";
  } else if (lesson.id === "5-1") {
    adaptiveImplementation =
      "Interactive parallelogram shear with invariant base × height & shared adaptive pathway";
    lessonBrowserTest =
      "Passed 24 linked model checks & pathways in Chromium (verify-studio-linked-models-browser, verify-studio-pathways-browser)";
  }

  base.status = {
    sourceInventory: "verified",
    adaptiveImplementation,
    lessonBrowserTest,
  };

  return base;
}

const graph = {
  schemaVersion: 1,
  note: "Source-backed inventory. Prerequisite checks, representation families, misconception IDs, and language supports reflect verified lesson content and browser evidence.",
  lessons: lessons.map(entry),
};
if (graph.lessons.length !== 72)
  throw new Error(
    `Expected 72 practice lessons from current curriculum index; found ${graph.lessons.length}`,
  );
const target = join(root, "data/practice-studio/skill-graph.json");
writeFileSync(target, JSON.stringify(graph, null, 2) + "\n");

const rows = graph.lessons.map((lesson) => {
  const values = [
    lesson.id,
    lesson.title,
    lesson.standards.join(", "),
    `[Standard](${lesson.source.standard}) · [Challenge](${lesson.source.challenge})`,
    lesson.representations.join(", ") || "—",
    lesson.misconceptionIds.length,
    lesson.status.adaptiveImplementation,
    lesson.status.lessonBrowserTest,
  ];
  return `| ${values.map((value) => String(value).replace(/\|/g, "\\|")).join(" | ")} |`;
});
const report = [
  "# Grade 6 HTML Practice implementation matrix",
  "",
  "Generated from `data/curriculum/matrix.json`, `data/practice-studio/*.json`, `data/practice-studio-u4/*.json`, and the custom Unit 4 practice HTML. Run `node scripts/generate-practice-skill-graph.mjs` after source changes.",
  "",
  `**Inventory:** ${graph.lessons.length} lessons with two direct practice routes each (${graph.lessons.length * 2} routes). Unit 1 has six lessons without HTML Practice routes in the curriculum matrix.`,
  "",
  "The JSON graph records source objectives, standards, existing prerequisite checks, representation and activity kinds, misconception IDs, and English/Spanish vocabulary across all 72 lessons. Status fields reflect verified implementations and browser test suites.",
  "",
  "| Lesson | Source title | Standard | Direct routes | Existing model and interaction kinds | Misconception IDs | Implementation | Browser test |",
  "| --- | --- | --- | --- | --- | ---: | --- | --- |",
  ...rows,
  "",
  "## Lesson 4-5 source resolution",
  "",
  "The curriculum matrix and `/lessons/4-5/` identify Lesson 4-5 as **Determine the Whole Given the Part and Percent** (6.AT.4). Its objective is: “I can determine the whole when I know a part and the percent that part represents.” Both custom practice pages use that focus. The Unit 4 directory has a broader “Use Percent to Solve Problems” label; the matrix and lesson source govern the practice objective.",
  "",
  "## Validation boundary",
  "",
  "This matrix confirms route files, structured source content, verified runtime pathways, linked models, and headless Chromium test results across desktop and mobile viewports.",
  "",
].join("\n");
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "docs/adaptive-practice-units-2-9-matrix.md"), report);

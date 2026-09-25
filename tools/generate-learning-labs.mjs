import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { controls, evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { esc } from "../curriculum/learning-labs/shared/model.mjs";
import { blueprints, unitNames } from "./learning-labs/blueprints.mjs";
import { originalPractice } from "./learning-labs/practice.mjs";
import {
  CORE_ID_RE,
  listLessonDirs,
  loadLessonConfig,
  REPO_ROOT,
} from "./lib/curriculum-source.mjs";

const destination = join(REPO_ROOT, "curriculum/learning-labs");
const LEVELS = { support: "approaching", core: "onLevel", stretch: "extending" };
const palette = [
  "#175d76",
  "#315ba7",
  "#076859",
  "#785000",
  "#6d4ca2",
  "#086575",
  "#315ba7",
  "#764273",
  "#075f80",
  "#176746",
];
const sources = new Map(
  listLessonDirs({ filter: CORE_ID_RE }).map((id) => [id, loadLessonConfig(id)]),
);
const covered = blueprints.flatMap((b) => b.lessons);
if (
  covered.length !== sources.size ||
  new Set(covered).size !== covered.length ||
  covered.some((id) => !sources.has(id))
)
  throw new Error("Lab coverage must match every core lesson exactly once.");
const version = createHash("sha256")
  .update(
    ["app.mjs", "math.mjs", "model.mjs", "games.mjs", "lab.css"]
      .map((f) => readFileSync(join(destination, "shared", f)))
      .join(""),
  )
  .digest("hex")
  .slice(0, 10);
const page = (title, body, extra = "") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | EduWonderLab</title><meta name="description" content="Interactive Grade 6 mathematics: learn, investigate, practice at three levels, create, and play."><link rel="icon" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/fonts/hub-curriculum.css"><link rel="stylesheet" href="/curriculum/learning-labs/shared/lab.css?v=${version}">${extra}</head><body>${body}</body></html>\n`;

function standalone(question) {
  return (
    question.type === "multiple-choice" &&
    Array.isArray(question.choices) &&
    question.choices.length >= 2 &&
    Number.isInteger(question.correctIndex) &&
    typeof question.stem === "string" &&
    question.explanation &&
    !/(shown|above|below|this graph|this table|the diagram|in the picture|the previous)/i.test(
      question.stem,
    )
  );
}
const catalog = [];
for (const blueprint of blueprints) {
  const unit = Number(blueprint.lessons[0].split("-")[0]);
  if (
    blueprint.lessons.length > 2 ||
    blueprint.lessons.some((id) => Number(id.split("-")[0]) !== unit)
  )
    throw new Error(`Invalid lesson grouping: ${blueprint.id}`);
  const lessons = blueprint.lessons.map((id) => {
    const c = sources.get(id),
      intro = c.launch?.conceptIntro;
    if (!intro?.iDo?.lines?.length) throw new Error(`Missing worked example ${id}`);
    return {
      id,
      title: c.title,
      standard: c.standard,
      objective: c.contentObjective,
      languageObjective: c.languageObjective,
      concept: {
        heading: intro.heading,
        intro: intro.intro,
        keyIdea: intro.keyIdea,
        worked: intro.iDo,
        together: intro.weDo,
      },
      vocabulary: c.vocabulary
        .map((v) => ({ term: v.term, definition: v.definition, example: v.visual || "" }))
        .filter((v) => v.term && v.definition),
    };
  });
  const vocabulary = [
    ...new Map(lessons.flatMap((l) => l.vocabulary).map((v) => [v.term.toLowerCase(), v])).values(),
  ];
  const practice = {};
  for (const [level, sourceLevel] of Object.entries(LEVELS)) {
    const tier = Object.keys(LEVELS).indexOf(level),
      bank = [];
    for (const id of blueprint.lessons) {
      const candidates = sources.get(id).practice[sourceLevel] || [];
      const mc = candidates.filter(standalone).slice(0, 4);
      for (const [i, p] of mc.entries())
        bank.push({
          id: `${level}-${id}-choice-${i}`,
          lesson: id,
          type: "choice",
          prompt: p.stem,
          choices: p.choices,
          answer: p.correctIndex,
          explanation: p.explanation,
          feedback: p.choiceFeedback || [],
          hints: p.hints || [p.hint].filter(Boolean),
        });
      const error = candidates.find(
        (p) =>
          p.type === "error-analysis" && p.workedExample?.length && Number.isInteger(p.errorStep),
      );
      if (error)
        bank.push({
          id: `${level}-${id}-repair`,
          lesson: id,
          type: "repair",
          prompt: error.title || "Find the first incorrect step",
          steps: error.workedExample.map((s) => `${s.label}: ${s.work}`),
          answer: error.errorStep,
          explanation: error.correctWork || error.explanation,
          hints: error.hints || [],
        });
      const reflection = candidates.find(
        (p) =>
          p.type === "open-response" &&
          (p.stem || p.prompt) &&
          !/(shown|above|below|this graph|this table|the diagram|in the picture|in your book|the previous)/i.test(
            p.stem || p.prompt,
          ),
      );
      if (reflection)
        bank.push({
          id: `${level}-${id}-explain`,
          lesson: id,
          type: "explain",
          prompt: reflection.stem || reflection.prompt,
          frame: reflection.sentenceFrame || reflection.sentenceStems?.[0] || "",
          explanation:
            reflection.modelAnswer ||
            reflection.sampleAnswer ||
            reflection.explanation ||
            "Compare your reasoning with the lesson objective. Identify the quantities, show a valid representation or calculation, and explain why the result makes sense.",
          hints: reflection.hints || [reflection.hint].filter(Boolean),
        });
    }
    const values = [...blueprint.model.values],
      fields = controls(blueprint.model);
    values[0] = Math.min(fields[0].max, Math.max(fields[0].min, values[0] + tier * fields[0].step));
    const r = evaluate(blueprint.model, values);
    bank.push({
      id: `${level}-model`,
      type: "number",
      prompt: `Predict the ${r.label.toLowerCase()} for these settings. ${r.unit ? `Give the answer in ${r.unit}.` : ""} Round to four decimal places if needed.`,
      parameters: fields
        .filter((f) => f.label !== "Unused")
        .map((f, i) => `${f.label}: ${values[i]}`),
      answer: r.value,
      tolerance: 0.000051,
      explanation: `${r.equation}. ${r.note}`,
      hints: [
        "Identify which quantities the requested measure uses.",
        "Use the relationship you explored in Investigate. Check with a second method.",
      ],
    });
    for (const [i, task] of originalPractice(blueprint.model).entries()) {
      bank.push({
        id: `${level}-original-${i}`,
        type: "number",
        ...task,
        tolerance: 0.000051,
        hints: [
          "Name the given quantities and the quantity you need.",
          "Draw a model or write the relationship first. Check your answer in the original situation.",
        ],
      });
    }
    if (bank.length < 5) throw new Error(`Insufficient practice for ${blueprint.id} ${level}`);
    practice[level] = bank;
  }
  const lab = {
    schemaVersion: 1,
    ...blueprint,
    unit,
    unitName: unitNames[unit - 1],
    accent: palette[unit - 1],
    lessons,
    vocabulary,
    practice,
    source:
      "Instruction and selected practice adapted from the connected EduWonderLab lesson content. Investigations, creation tasks, and model puzzles are original supplementary activities.",
  };
  const dir = join(destination, blueprint.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "content.json"), `${JSON.stringify(lab, null, 2)}\n`);
  const label = blueprint.lessons.map((x) => x.replace("-", ".")).join(" & ");
  writeFileSync(
    join(dir, "index.html"),
    page(
      blueprint.title,
      `<a class="skip-link" href="#workspace">Skip to activity</a><div id="lab-root" data-lab="${blueprint.id}"><nav class="crumbs" aria-label="Breadcrumb"><a href="/curriculum/">Curriculum</a><a href="/curriculum/learning-labs/">Learning labs</a></nav><main><h1>${esc(blueprint.title)}</h1><p>${esc(blueprint.mission)}</p><p>Lessons ${label}. Loading your activities…</p><noscript>This lab needs JavaScript. You can still <a href="/lessons/${blueprint.lessons[0]}/">open the connected lesson</a>.</noscript></main></div><script type="module" src="/curriculum/learning-labs/shared/app.mjs?v=${version}"></script>`,
      `<link rel="canonical" href="https://eduwonderlab.com/curriculum/learning-labs/${blueprint.id}/">`,
    ),
  );
  catalog.push({
    id: blueprint.id,
    title: blueprint.title,
    icon: blueprint.icon,
    unit,
    unitName: lab.unitName,
    lessons: blueprint.lessons,
    mission: blueprint.mission,
    model: blueprint.model.kind,
    mode: blueprint.model.mode,
    finale: blueprint.finale,
    href: `/curriculum/learning-labs/${blueprint.id}/`,
    accent: lab.accent,
  });
}
writeFileSync(
  join(REPO_ROOT, "data/learning-labs.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      category: "Interactive Learning Labs",
      lessonCount: covered.length,
      labCount: catalog.length,
      labs: catalog,
    },
    null,
    2,
  ) + "\n",
);
const catalogBody = `<a class="skip-link" href="#catalog">Skip to labs</a><header class="catalog-header"><nav class="crumbs" aria-label="Breadcrumb"><a href="/curriculum/">Curriculum</a><a href="/curriculum/units/">Units and lessons</a></nav><h1>Interactive Learning Labs</h1><p>Make something. Test an idea. Explain what changed.</p><p>${catalog.length} different labs connect all ${covered.length} lessons. Each has worked examples, a hands-on investigation, three practice levels, a creation challenge, and two games.</p><p class="catalog-note">Start with Learn, then choose Support, Core, or Stretch. Progress stays in this browser. Work with a partner or independently; allow 35–55 minutes, or split a lab across two lessons.</p><nav class="unit-nav" aria-label="Jump to unit">${unitNames.map((n, i) => `<a href="#unit-${i + 1}">Unit ${i + 1}</a>`).join("")}</nav></header><main id="catalog">${unitNames
  .map(
    (name, i) =>
      `<section class="catalog-unit" id="unit-${i + 1}"><h2>Unit ${i + 1}: ${esc(name)}</h2><div class="catalog-grid">${catalog
        .filter((l) => l.unit === i + 1)
        .map(
          (l) =>
            `<article class="lab-card" style="--accent:${l.accent}"><span class="lab-card-icon" aria-hidden="true">${l.icon}</span><p class="lesson-label">Lessons ${l.lessons.map((id) => id.replace("-", ".")).join(" & ")}</p><h3><a href="${l.href}">${esc(l.title)}</a></h3><p>${esc(l.mission)}</p><p class="card-detail">Finale: ${esc(l.finale)} + Connection Quest</p></article>`,
        )
        .join("")}</div></section>`,
  )
  .join(
    "",
  )}</main><footer>EduWonderLab · Grade 6 mathematics · <a href="/curriculum/">Return to curriculum</a></footer>`;
writeFileSync(join(destination, "index.html"), page("Interactive Learning Labs", catalogBody));

// Additive splice: preserve hand-edited curriculum content and all other links.
const unitPath = join(REPO_ROOT, "curriculum/units/index.html");
let unitHtml = readFileSync(unitPath, "utf8").replace(
  /\s*<!-- learning-lab:[\w-]+ -->[\s\S]*?<!-- \/learning-lab -->/g,
  "",
);
for (const item of catalog)
  for (const id of item.lessons) {
    const pattern = new RegExp(`(<a\\b[^>]*href="/lessons/${id}/"[^>]*>[\\s\\S]*?</a\\s*>)`);
    if (!pattern.test(unitHtml)) throw new Error(`Missing curriculum lesson anchor: ${id}`);
    unitHtml = unitHtml.replace(
      pattern,
      `$1\n                <!-- learning-lab:${id} --><a class="res" href="${item.href}">Interactive Learning Lab: ${esc(item.title)}</a><!-- /learning-lab -->`,
    );
  }
writeFileSync(unitPath, unitHtml);
console.log(
  `Generated ${catalog.length} distinct labs, ${covered.length} lesson connections, three practice levels per lab.`,
);

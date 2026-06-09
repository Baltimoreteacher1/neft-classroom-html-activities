// CardForge package generator. Renders every artifact for a lesson package
// deterministically from a job.json (schemas/job.schema.json).
import { resolve } from "node:path";
import { writeFile, writeJSON, slugify, CF_ROOT } from "./util.mjs";

function mdList(items, fmt = (x) => x) {
  return (items || []).map((x) => `- ${fmt(x)}`).join("\n") || "_None._";
}

function renderVocab(vocab) {
  return (vocab || [])
    .map((v) => {
      const es = v.termEs ? ` _(es: ${v.termEs})_` : "";
      const ex = v.example ? `\n  - Example: ${v.example}` : "";
      const def = v.definitionEs ? `${v.definition} _(${v.definitionEs})_` : v.definition;
      return `- **${v.term}**${es} — ${def}${ex}`;
    })
    .join("\n");
}

function renderExamples(examples) {
  return (examples || [])
    .map((e, i) => {
      const steps = e.steps.map((s, j) => `   ${j + 1}. ${s}`).join("\n");
      return `**Modeled Example ${i + 1}.** ${e.prompt}\n\n${steps}\n\n   **Answer:** ${e.answer}`;
    })
    .join("\n\n");
}

function renderProblems(items, { showAnswer = false } = {}) {
  return (items || [])
    .map((p) => {
      const tail = showAnswer
        ? `\n   - **Answer:** ${p.answer}${p.work ? `  \n     _Work:_ ${p.work}` : ""}${p.teacherJudgment ? "  \n     _Teacher judgment / rubric item._" : ""}`
        : "";
      return `${p.n}. ${p.prompt}${tail}`;
    })
    .join("\n");
}

// ---- Artifact renderers ----------------------------------------------------

export function renderTeacherGuide(job) {
  const { card, lesson } = job;
  const pacing = (lesson.pacing || [])
    .map((p) => `| ${p.phase} | ${p.minutes} min | ${p.what} |`).join("\n");
  return `# Teacher Guide — ${card.title}

> CardForge package · ${card.demo ? "**DEMO / sample** · " : ""}status: **${card.status}**

## Overview
${lesson.overview || "_n/a_"}

## Objective & Standard
- **Objective:** ${lesson.objective}
- **Language objective:** ${lesson.languageObjective || "_n/a_"}
- **Standard:** ${card.standard || "_uncertain_"}${card.standardUncertain ? " _(uncertain — verify)_" : ""}
- **Time:** ${card.timeEstimate || "~45 min"}

## Materials
${mdList(lesson.materials)}

## Pacing
${pacing ? `| Phase | Time | What happens |\n| --- | --- | --- |\n${pacing}` : "_n/a_"}

## Warm-Up
${lesson.warmUp || "_n/a_"}

## Key Vocabulary (ESOL-friendly)
${renderVocab(lesson.vocabulary)}

## Formulas / Definitions
${mdList(lesson.formulas)}

## Modeled Examples (I do)
${renderExamples(lesson.modeledExamples)}

## Guided Practice (We do)
${renderProblems((lesson.guidedPractice || []).map((g, i) => ({ n: i + 1, ...g })), { showAnswer: true })}

## Independent Practice (You do)
${renderProblems(lesson.practice)}

## Answer Key
See \`answer-key.md\`.

## Common Misconceptions
${(lesson.misconceptions || []).map((m) => `- **${m.misconception}** → ${m.fix}`).join("\n") || "_None noted._"}

## Supports
- **ESOL:** ${(lesson.esolSupports || []).join("; ") || "_n/a_"}
- **SPED:** ${(lesson.spedSupports || []).join("; ") || "_n/a_"}

## Exit Ticket
See \`exit-ticket.md\`.

## Extension
${lesson.extension || "_n/a_"}

## Substitute / Emergency Notes
${lesson.subNotes || "_n/a_"}
`;
}

export function renderStudentPractice(job) {
  const { card, lesson } = job;
  return `# ${card.title} — Practice

**Name: _______________________    Date: __________**

**Today I can:** ${lesson.objective}

## Words to Know
${renderVocab(lesson.vocabulary)}

## Formulas
${mdList(lesson.formulas)}

## Worked Examples
${renderExamples(lesson.modeledExamples)}

## Directions
Solve each problem. Show your work. Use the word bank when you explain.

## Practice
${renderProblems(lesson.practice)}

## Explain Your Thinking
${lesson.reflection || "Explain how you solved one problem above. Use a vocabulary word."}
`;
}

export function renderAnswerKey(job) {
  const { card, lesson } = job;
  const key = lesson.answerKey && lesson.answerKey.length
    ? lesson.answerKey
    : lesson.practice.map((p) => ({ n: p.n, answer: p.answer, work: p.work, teacherJudgment: p.teacherJudgment }));
  return `# Answer Key — ${card.title}

> Every problem is listed. Work shown for teacher use. Items needing teacher
> judgment are flagged with a rubric, not left as a vague "answers may vary."

${key.map((k) => {
    const work = k.work ? `\n   - _Work:_ ${k.work}` : "";
    const flag = k.teacherJudgment ? `\n   - ⚖️ _Teacher judgment — score with the rubric in the practice item._` : "";
    return `**${k.n}.** ${k.answer}${work}${flag}`;
  }).join("\n\n")}
`;
}

export function renderExitTicket(job) {
  const { card, lesson } = job;
  const items = lesson.exitTicket || [];
  return `# Exit Ticket — ${card.title}

**Name: _______________________**

${items.map((e, i) => `${i + 1}. ${e.prompt}`).join("\n\n")}

---

### Exit Ticket — Answer Key (teacher)
${items.map((e, i) => `${i + 1}. ${e.answer || "_short answer / see rubric_"}`).join("\n")}
`;
}

export function buildCard(job) {
  const { card, lesson } = job;
  return {
    ...card,
    objective: card.objective || lesson.objective,
    languageObjective: card.languageObjective || lesson.languageObjective || "",
    resources: {
      teacherGuide: { label: "Teacher Guide", file: "teacher-guide.md", applicable: true, exists: true },
      studentPractice: { label: "Student Practice", file: "student-practice.md", applicable: true, exists: true },
      answerKey: { label: "Answer Key", file: "answer-key.md", applicable: true, exists: true },
      exitTicket: { label: "Exit Ticket", file: "exit-ticket.md", applicable: !!(lesson.exitTicket || []).length, exists: !!(lesson.exitTicket || []).length },
      qaReport: { label: "QA Report", file: "qa-report.md", applicable: true, exists: false },
    },
  };
}

export function packageDir(job) {
  const { card } = job;
  const unitSeg = card.unit != null ? `unit-${card.unit}` : "unit-unknown";
  const slug = slugify(`${card.lesson != null ? "lesson-" + card.lesson + "-" : ""}${card.title}${card.demo ? "-demo" : ""}`);
  return resolve(CF_ROOT, "staged", unitSeg, slug);
}

// Render all artifacts to the staged package dir. Returns { dir, files[] }.
export function buildPackage(job) {
  const dir = packageDir(job);
  const card = buildCard(job);
  const files = [];

  const write = (name, content) => { writeFile(resolve(dir, name), content); files.push(name); };

  write("teacher-guide.md", renderTeacherGuide(job));
  write("student-practice.md", renderStudentPractice(job));
  write("answer-key.md", renderAnswerKey(job));
  if ((job.lesson.exitTicket || []).length) write("exit-ticket.md", renderExitTicket(job));

  const manifest = {
    card: card.id, title: card.title, demo: !!card.demo, status: card.status,
    generated: files.slice(), enhancements: job.enhancements || [],
    source: job.source || null,
  };
  writeJSON(resolve(dir, "card.json"), card); files.push("card.json");
  writeJSON(resolve(dir, "resource-manifest.json"), manifest); files.push("resource-manifest.json");

  write("README.md", `# ${card.title} — CardForge package

${card.demo ? "**This is a DEMO / sample package.** It is staged only and is NOT added to the live curriculum manifest.\n\n" : ""}- **Status:** ${card.status}
- **Standard:** ${card.standard || "uncertain"}
- **Objective:** ${card.objective}

Artifacts: ${files.filter((f) => f !== "README.md").map((f) => `\`${f}\``).join(", ")}.

Regenerate with:
\`\`\`
npm run cardforge:build -- ${job.__jobPath || "<job.json>"}
npm run cardforge:qa -- ${dir.replace(CF_ROOT + "/", "tools/cardforge/")}
\`\`\`
`);

  return { dir, files, card };
}

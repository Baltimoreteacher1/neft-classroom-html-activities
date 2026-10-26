/**
 * Expand the Reading Room with complete lesson records built from substantial,
 * existing original ACCESS Lab Reading passages. This is a deterministic
 * editorial scaffold, not an alignment/quality certification. All generated
 * packages remain marked pending independent editorial review.
 */
import { readFileSync, writeFileSync } from "node:fs";

const DATA = "access-practice-lab/content/reading-room/lessons.json";
const out = JSON.parse(readFileSync(DATA, "utf8"));
const alignment = JSON.parse(
  readFileSync("access-practice-lab/content/alignment-index.json", "utf8"),
);
const expected = new Set(alignment.expectationCatalog.map((x) => x.id));
const keyUse = (a) => {
  const s = `${a.title} ${a.skill} ${a.prompt} ${a.wida?.join(" ")}`.toLowerCase();
  if (
    /argument|claim|counterclaim|position|opinion|strongest evidence|evidence that supports/.test(s)
  )
    return "Argue";
  if (/sequence|chronolog|journey|event|narrative|story/.test(s)) return "Narrate";
  if (/cause|effect|process|explain|inference|infer/.test(s)) return "Explain";
  return "Inform";
};
const sentenceExample = (passage, term) => {
  const all = passage.join(" ");
  const sentence = all
    .split(/(?<=[.!?])\s+/)
    .find((s) => s.toLowerCase().includes(term.toLowerCase()));
  return sentence || all.split(/(?<=[.!?])\s+/)[0] || term;
};
const localActivity = (a) => {
  if (a.type === "multipleChoice")
    return {
      id: "source-item",
      phase: "first",
      skill: a.skill,
      type: "choice",
      prompt: a.prompt,
      choices: a.options.map((x) => ({ id: x.id, text: x.text })),
      answerId: a.answer,
      rationale: a.correct,
    };
  if (a.type === "multiSelect")
    return {
      id: "source-item",
      phase: "first",
      skill: a.skill,
      type: "multi",
      prompt: a.prompt,
      choices: a.options.map((x) => ({ id: x.id, text: x.text })),
      answerIds: a.answers,
      rationale: a.correct,
    };
  if (a.type === "hotText")
    return {
      id: "source-item",
      phase: "second",
      skill: a.skill,
      type: "hotText",
      prompt: a.prompt,
      choices: a.sentences.map((x) => ({ id: x.id, text: x.text })),
      answerIds: a.answers,
      rationale: a.correct,
    };
  if (a.type === "order")
    return {
      id: "source-item",
      phase: "second",
      skill: a.skill,
      type: "order",
      prompt: a.prompt,
      items: a.items,
      answerOrder: a.answer,
      rationale: a.correct,
    };
  if (a.type === "sort")
    return {
      id: "source-item",
      phase: "second",
      skill: a.skill,
      type: "sort",
      prompt: a.prompt,
      categories: a.categories,
      items: a.items,
      rationale: a.correct,
    };
  if (a.type === "cloze")
    return {
      id: "source-item",
      phase: "second",
      skill: a.skill,
      type: "cloze",
      prompt: a.prompt,
      segments: a.segments,
      rationale: a.correct,
    };
  if (a.type === "constructed")
    return {
      id: "source-item",
      phase: "third",
      skill: a.skill,
      type: "short",
      prompt: a.prompt,
      lookFor: a.successCriteria || [
        "A clear position or explanation",
        "Relevant evidence from the passage",
        "A link between the evidence and the response",
      ],
      rubric: a.successCriteria || [
        "Uses a relevant passage detail",
        "Explains how the detail supports the response",
      ],
      ...(a.models?.C || a.models?.B ? { model: a.models?.C || a.models?.B } : {}),
      frame: a.frames?.[0],
    };
  return null;
};
function convert(a, band) {
  const pid = `rr-existing-${a.id}`;
  const passage = Array.isArray(a.passage)
    ? a.passage
    : typeof a.passage === "string"
      ? a.passage.split(/\n\n+/)
      : [];
  // Include short but complete source texts (e.g. procedures and compact explanations)
  // only when they have at least two authored sections and a usable vocabulary set.
  const words = passage.join(" ").split(/\s+/).filter(Boolean).length;
  if (words < 40 || passage.length < 2) return null;
  const use = keyUse(a),
    cluster = band === "6-8" ? "6-8" : null,
    standard = cluster ? "ELD-LA" : "Local literacy focus";
  const exp = cluster ? `ELD-LA.6-8.${use}.Interpretive` : "";
  const expectations = exp && expected.has(exp) ? [exp] : [];
  const pids = passage.map((_, i) => `p${i + 1}`);
  const vocab = (a.vocab || a.vocabulary || []).map((v) => ({
    term: v[0],
    definition: v[1],
    example: sentenceExample(passage, v[0]),
    spanish: (v[2] || "").replace(/^[^:]+:\s*/, ""),
  }));
  if (vocab.length < 3) return null;
  const source = localActivity(a);
  if (!source) return null;
  const wordsToUse = vocab.slice(0, 2);
  const phrase = wordsToUse[0]?.term || "an important idea";
  const sample = sentenceExample(passage, phrase);
  const tasks = [
    source,
    {
      id: "evidence-explanation",
      phase: "second",
      skill: "Central idea and evidence",
      type: "short",
      prompt:
        "What important idea does the passage develop? Cite a specific sentence or paragraph detail and explain how it supports your response.",
      lookFor: [
        "A central idea tied to the passage",
        "A specific text detail",
        "An explanation connecting the detail to the idea",
      ],
      rubric: [
        "Names an idea supported by the text",
        "Uses a precise passage detail",
        "Explains the connection",
      ],
      frame:
        "The passage develops the idea that ___. In paragraph ___, ___. This supports the idea because ___.",
    },
    {
      id: "vocabulary-context",
      phase: "second",
      skill: "Vocabulary in context",
      type: "short",
      prompt: `Use context to explain “${phrase}.” Identify the clue that helped you.`,
      lookFor: ["A meaning that fits the passage", "A nearby phrase or sentence clue"],
      rubric: ["Explains the word using its passage meaning", "Points to a context clue"],
      model: `In this passage, “${phrase}” means ${wordsToUse[0]?.definition || "an important idea"}. One clue is: “${sample}”`,
      frame: `In this passage, “${phrase}” means ___. The clue ___ helps me understand it.`,
    },
    {
      id: "summary-transfer",
      phase: "third",
      skill: "Summarize and transfer",
      type: "short",
      prompt:
        "Write a concise summary that states one important idea and includes one accurate detail from the text.",
      lookFor: ["An accurate central idea", "One relevant detail", "No unsupported extra claim"],
      rubric: [
        "States the passage’s central information concisely",
        "Includes one accurate, relevant detail",
        "Avoids adding information the text does not support",
      ],
      frame: "The passage explains ___. One detail is ___. This detail matters because ___.",
    },
  ];
  const teacher = a.teacher || {};
  const table =
    a.table && a.table.headers && a.table.rows
      ? {
          caption: a.table.caption || a.passageTitle,
          headers: a.table.headers,
          rows: a.table.rows,
          description: a.table.description || "Read each row and compare the values shown.",
        }
      : undefined;
  const chart =
    a.chart && a.chart.headers && a.chart.rows
      ? {
          caption: a.chart.caption || a.passageTitle,
          headers: a.chart.headers,
          rows: a.chart.rows,
          description: a.chart.description || "Compare the values in the chart with the passage.",
        }
      : undefined;
  return {
    id: pid,
    sourceActivityId: a.id,
    revision: "1.0.0",
    title: a.passageTitle || a.title.replace(/:.*$/, ""),
    summary: `${a.skill}. Read the original passage, investigate its evidence, and apply the reading move.`,
    gradeCluster: cluster,
    localGradeBand: cluster ? "6-8" : "3-5",
    gradeClusterCandidates: cluster ? ["6-8"] : ["2-3", "4-5"],
    genre: /poem|poetry/i.test(a.title)
      ? "Poetry"
      : /history|canal|boycott|rosa parks|mansa musa/i.test(a.title)
        ? "Historical reading"
        : "Informational reading",
    subject: "Academic reading",
    topics: [a.title.replace(/:.*/, ""), a.skill],
    keyUse: use,
    eldStandard: standard,
    languageExpectations: expectations,
    alignmentStatus: cluster
      ? "Candidate from locally configured KLU/standard/topic tags; educator review required."
      : "Local 3–5 practice band spans WIDA clusters; no grade-specific expectation assigned; educator review required.",
    languageFunction: a.skill,
    languageFeatures: [
      "text evidence",
      "discipline-relevant vocabulary",
      "paragraph-level cohesion",
    ],
    languageDimensions: ["discourse", "sentence", "word/phrase"],
    taskComplexity: `Original ${words}-word passage in ${passage.length} sections; the source bank provided the initial task and vocabulary. No numeric readability or grade-equivalent score is assigned.`,
    minutes: 18,
    objectives: {
      content: `${a.skill}; distinguish relevant details and explain the passage's central information.`,
      language: `Use a precise passage detail and a connector to explain how evidence supports an idea.`,
    },
    beforeReading: {
      essentialQuestion: `What can a reader learn from ${a.passageTitle || a.title}?`,
      background:
        "Think about what you already know about this topic and identify one question you have.",
      hook: a.readFor || `Notice the topic and how the author organizes the information.`,
      purpose: `Read to investigate ${a.skill.toLowerCase()} and support your thinking with evidence.`,
    },
    vocabulary: vocab,
    paragraphs: passage.map((text, i) => ({
      id: pids[i],
      text,
      guidingQuestion: `What detail in this section connects to “${a.skill.toLowerCase()}”?`,
    })),
    ...(table ? { table } : chart ? { table: chart } : {}),
    activities: tasks,
    transferPrompt:
      teacher.challenge ||
      `Choose another subject or text. Apply ${a.skill.toLowerCase()} and explain how a detail supports your thinking.`,
    teacherGuide: {
      contentObjective: `${a.skill} using the original passage.`,
      languageObjective: `Explain a text-based idea with a relevant detail and a clear connection.`,
      miniLesson:
        teacher.lower ||
        `Model how to return to the text, identify a relevant detail, and explain the connection.`,
      discussion: [
        teacher.prompt || "Which detail is most useful?",
        `How does paragraph 1 connect to paragraph ${passage.length}?`,
      ],
      misconception:
        teacher.onLevel ||
        "A detail may be accurate but still not support the idea being explained.",
      scaffolds: {
        modeled: teacher.lower || "Think aloud while selecting a detail.",
        guided: teacher.onLevel || "Use the optional sentence frame and revisit the passage.",
        independent: teacher.challenge || "Explain the idea with evidence without the frame.",
      },
      answerNotes: [
        a.correct || "Responses should be supported by the passage.",
        teacher.function || a.skill,
      ],
      modelResponse:
        teacher.challenge ||
        a.correct ||
        "A strong response names an idea, cites a relevant detail, and explains the connection.",
    },
    familySupport: {
      directions: {
        en: "Read the passage together for about 10–15 minutes. Ask what detail supports the main idea.",
        es: "Lean el pasaje juntos durante unos 10–15 minutos. Pregunten qué detalle apoya la idea principal.",
      },
      questions: ["What detail did you notice?", "What question would you ask about this topic?"],
      noEnglishRequired:
        "Discuss the topic in any language, then invite the student to identify one English word or detail.",
    },
    connections: {
      write: "Write a short evidence-based explanation.",
      speak: "Explain the main idea and one supporting detail.",
      listen: "Compare the passage with a related classroom explanation.",
      relatedActivity: a.id,
    },
    editorial: {
      status: "authored-pending-independent-editorial-review",
      humanReview:
        "This package expands an original passage and activity from the ACCESS Lab bank; independent human editorial review has not occurred.",
      source:
        "Existing ACCESS Lab original Reading activity; this is an instructional expansion, not official WIDA material.",
      factCheck:
        "The source text and answer key were reused as stored; new response tasks are open-ended with rubric criteria.",
      accessibility:
        "Paragraphs, original source item, and any chart/table use keyboard and semantic controls.",
      lastReviewed: "2026-10-26",
    },
  };
}
const existing = new Set(out.lessons.map((x) => x.id));
let added = 0;
for (const band of ["3-5", "6-8"]) {
  const source = JSON.parse(
    readFileSync(`access-practice-lab/content/g${band}/Reading.json`, "utf8"),
  );
  for (const group of Object.values(source.levels)) {
    for (const a of group.activities) {
      const lesson = convert(a, band);
      if (lesson) {
        const at = out.lessons.findIndex((x) => x.id === lesson.id);
        if (at < 0) {
          out.lessons.push(lesson);
          existing.add(lesson.id);
          added++;
        } else if (out.lessons[at].sourceActivityId) {
          out.lessons[at] = lesson;
        }
      }
    }
  }
}
writeFileSync(DATA, JSON.stringify(out, null, 2) + "\n");
console.log(
  `Expanded ${added} distinct multi-section Reading activities into versioned lesson packages; review remains pending.`,
);

const MAX_SOURCE_CHARS = 60_000;

const string = { type: "string" };
const strings = { type: "array", items: string };
const object = (properties) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required: Object.keys(properties),
});
const array = (items) => ({ type: "array", items });

const standard = object({ code: string, desc: string });
const qaItem = object({ q: string, a: string });
const practiceItem = object({
  q: string,
  a: string,
  type: string,
  thinking: string,
});

export const lessonPlanSchema = object({
  header: object({
    title: string,
    date: string,
    grade: string,
    course: string,
    unit: string,
    standards: array(standard),
    length: string,
    objective: string,
    iCan: string,
    essentialQuestion: string,
    languageObjective: string,
    materials: strings,
  }),
  snapshot: object({
    learning: string,
    why: string,
    byEnd: string,
    misconceptions: strings,
    lookFors: strings,
  }),
  vocab: array(
    object({
      term: string,
      def: string,
      spanish: string,
      frame: string,
    }),
  ),
  doNow: object({
    directions: string,
    items: array(object({ level: string, q: string, a: string })),
    teacherMove: string,
  }),
  mini: object({
    teacherExplanation: string,
    studentNotes: strings,
    worked: object({
      problem: string,
      steps: strings,
      thinkAloud: strings,
      commonMistake: string,
      correction: string,
    }),
    gradualRelease: string,
  }),
  guided: object({
    items: array(object({ q: string, a: string, prompt: string })),
    turnAndTalk: string,
    sentenceStarters: strings,
  }),
  collaborative: object({
    studentDirections: string,
    teacherDirections: string,
    accountability: string,
    discussionPrompts: strings,
    twrWritten: string,
  }),
  independent: object({
    items: array(practiceItem),
    showThinking: string,
    extension: string,
  }),
  writing: object({
    kernel: string,
    because: string,
    but: string,
    so: string,
    explain: string,
    frames: strings,
    wordBank: strings,
    expected: string,
  }),
  differentiation: object({
    esol: strings,
    sped: strings,
    newcomer: strings,
    onGrade: strings,
    extension: strings,
    reteach: string,
    earlyFinishers: string,
  }),
  cfu: object({
    doNow: string,
    mini: string,
    guided: string,
    independent: string,
    decisionPoints: strings,
  }),
  exit: object({
    items: array(qaItem),
    confidence: qaItem,
    tomorrow: string,
  }),
  teacherNotes: object({
    collect: string,
    lookFor: string,
    reteachWho: string,
    adjust: string,
    smallGroups: string,
    extra: string,
  }),
  meta: object({
    domain: string,
    domainLabel: string,
    inferred: strings,
    generic: { type: "boolean" },
  }),
});

export function validateLessonRequest(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "A JSON request body is required." };
  }
  if (
    typeof body.sourceText !== "string" ||
    body.sourceText.trim().length < 20
  ) {
    return {
      ok: false,
      message: "Upload or paste enough lesson source text to build the plan.",
    };
  }
  if (body.sourceText.length > MAX_SOURCE_CHARS) {
    return {
      ok: false,
      message: `Lesson source is too long. Keep it under ${MAX_SOURCE_CHARS.toLocaleString()} characters.`,
    };
  }
  if (body.fields != null && typeof body.fields !== "object") {
    return { ok: false, message: "Lesson fields must be an object." };
  }
  return { ok: true };
}

function clean(value, max = 500) {
  return String(value || "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, max);
}

export function buildLessonPrompt(body) {
  const fields = body.fields || {};
  const safeFields = {
    date: clean(fields.date, 20),
    grade: clean(fields.grade, 40),
    course: clean(fields.course, 80),
    unit: clean(fields.unit, 160),
    focus: clean(fields.focus, 240),
    standards: clean(fields.standards, 500),
    length: clean(fields.length, 80),
    skill: clean(fields.skill, 80),
    wida: clean(fields.wida, 80),
  };

  return `Build a complete, teach-tomorrow Neft Teacher "Ready + date" lesson plan.

NON-NEGOTIABLES
- Treat the supplied source as the authority. Preserve its exact lesson title, sequence, vocabulary, standards, examples, page/slide labels, and named activities whenever present.
- Never invent a standard, source reference, quotation, answer, or factual claim. If a detail is absent, use an honest instructional inference and list its field name in meta.inferred.
- Produce concrete, source-aligned questions and correct answer keys. Do not write vague placeholders.
- Include at least 3 Do Now items across access/grade/stretch levels, 4 guided items, 6 independent items including error analysis, and 2 exit-ticket items.
- Include explicit modeling, gradual release, TWR Because/But/So writing, ESOL/WIDA scaffolds, accessibility/UDL supports, CFUs with decision rules, and next-day moves.
- Keep all fields practical for the requested lesson length and a printable Word document.
- For extracted slides/pages, cite the labels in teacher directions when they help locate the source.
- Return only the requested structured lesson-plan object.

TEACHER FIELDS
${JSON.stringify(safeFields, null, 2)}

SOURCE NAME
${clean(body.sourceName, 200) || "Pasted lesson source"}

SOURCE TEXT
${body.sourceText.trim()}`;
}

export function extractStructuredPlan(data) {
  let text = typeof data?.output_text === "string" ? data.output_text : "";
  if (!text) {
    const parts = [];
    for (const item of data?.output || []) {
      for (const content of item.content || []) {
        if (content.type === "refusal" && content.refusal) {
          throw new Error(content.refusal);
        }
        if (content.type === "output_text" && content.text) {
          parts.push(content.text);
        }
      }
    }
    text = parts.join("\n");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("OpenAI did not return valid lesson plan JSON.");
  }
}

export function onRequest() {
  return new Response("Not found.", { status: 404 });
}

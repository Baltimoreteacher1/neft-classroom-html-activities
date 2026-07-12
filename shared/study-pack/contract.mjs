/* =============================================================================
 * Study Pack — shared contract (single source of truth).
 * -----------------------------------------------------------------------------
 * This module is the ONE place that defines:
 *   1. The JSON shape an AI backend must return for a study pack.
 *   2. The prompt that instructs the model to produce that shape.
 *   3. A defensive server-side normaliser (coerceStudyPack) so a slightly
 *      malformed model response still renders instead of crashing.
 *
 * It is pure ESM with no DOM or network access, so it can be imported by any
 * Cloudflare Pages Function (classroom `/api/study-pack` and Noam `/api/ai`).
 * The browser engine (study-pack.js) renders whatever shape this describes but
 * keeps its own tolerant reader, so the two never hard-depend on each other.
 *
 * Pedagogy baked into the prompt (matches the EduWonderLab house style):
 *   - Vocabulary first, with plain ESOL-friendly definitions + an example.
 *   - Scaffolds, hints, and worked examples — never a bare answer key.
 *   - Calm and self-paced: no timers, no "beat the clock" framing.
 * ========================================================================== */

// Upper bounds so a giant paste can't blow the model context or our costs.
export const CAPS = Object.freeze({
  notes: 12_000, // characters of student notes accepted per request
  question: 800, // characters for an "Ask" follow-up
  history: 8, // prior Ask turns retained for context
});

/**
 * The canonical study-pack shape, expressed as an annotated example. It is the
 * literal contract the model is shown, so editing this object changes the
 * output everywhere at once.
 */
export const STUDY_PACK_SCHEMA = Object.freeze({
  title: "string — a short, friendly title for these notes",
  subject: "string — the subject/topic you inferred (e.g. 'Ratios & Proportions')",
  gradeBand: "string — best-guess grade band, e.g. 'Middle School'",
  bigIdeas: {
    summary: ["string — 3 to 6 plain-language bullet points of the key ideas"],
    vocab: [
      {
        term: "string — an important word from the notes",
        definition: "string — a simple, ESOL-friendly definition (short sentence)",
        example: "string — one concrete example of the word in use",
      },
    ],
  },
  walkthrough: [
    {
      title: "string — what this worked example shows",
      steps: ["string — each solving step in order, plain language"],
      answer: "string — the final result of this example",
      note: "string — optional tip or common mistake to avoid (may be empty)",
    },
  ],
  practice: [
    {
      question: "string — a practice question drawn from the notes",
      choices: ["string — optional multiple-choice options; omit or [] for open response"],
      answer: "string — the correct answer",
      hints: ["string — 2 to 3 escalating hints, from gentle nudge to near-answer"],
      explanation: "string — why the answer is correct, in plain language",
    },
  ],
  game: {
    type: "string — 'match' or 'sort'",
    instructions: "string — one friendly sentence telling the student what to do",
    pairs: [{ left: "string — term", right: "string — its match" }],
    buckets: [{ name: "string — category", items: ["string — item that belongs here"] }],
  },
  quiz: [
    {
      question: "string — a mastery-check question",
      choices: ["string — 3 to 4 multiple-choice options (required for the quiz)"],
      answer: "string — the exactly-matching correct choice",
      explanation: "string — a one-line explanation of the answer",
    },
  ],
});

const SYSTEM_LINES = [
  "You are an expert teacher-author who turns a student's own class notes into a polished, TpT-quality study pack.",
  "Your audience is a middle-school student (about 6th–8th grade), including English-language learners.",
  "Voice: warm, encouraging, plain language, one idea at a time. Calm and self-paced — never use timers or 'beat the clock' framing.",
  "Pedagogy: introduce vocabulary FIRST with simple definitions and a concrete example; scaffold with hints and worked examples; never give a bare answer key with no reasoning.",
  "Ground every item strictly in the provided notes. Do not invent facts that are not supported by the notes. If the notes are thin, cover them well rather than padding.",
  "Use LaTeX for any math: wrap inline math in \\( ... \\) and display math in \\[ ... \\]; use \\times, \\div, and \\frac{a}{b}. Never use raw * or / for calculations.",
  "Keep it safe and school-appropriate at all times.",
];

/**
 * Build the full prompt payload for a "generate study pack" request.
 * Returns { system, user } strings; the caller adapts them to its provider
 * (Anthropic system+messages, or Gemini contents).
 *
 * @param {string} notes  Raw student notes (already length-capped by caller).
 * @param {{subjectHint?:string}} [opts]
 */
export function buildStudyPackPrompt(notes, opts = {}) {
  const subjectHint = typeof opts.subjectHint === "string" ? opts.subjectHint.trim() : "";
  const system = SYSTEM_LINES.join(" ");
  const user = [
    "Create a study pack from the class notes below.",
    subjectHint ? `The student says this is about: ${subjectHint}` : "",
    "",
    "Return ONLY a single JSON object — no markdown, no code fence, no commentary before or after.",
    "The JSON MUST match this shape exactly (same keys). Field values below describe what to put there:",
    "",
    JSON.stringify(STUDY_PACK_SCHEMA, null, 2),
    "",
    "Requirements:",
    "- bigIdeas.summary: 3–6 bullets. bigIdeas.vocab: 4–8 terms with a simple definition and example.",
    "- walkthrough: 2–3 fully worked examples with ordered steps.",
    "- practice: 4–6 items, each with 2–3 escalating hints and an explanation.",
    "- game: choose 'match' (fill pairs, 4–8) OR 'sort' (fill buckets with items). Provide only the chosen one's data.",
    "- quiz: 4–6 multiple-choice items; each answer MUST exactly equal one of its choices.",
    "",
    "CLASS NOTES:",
    "<<<NOTES",
    String(notes || "").slice(0, CAPS.notes),
    "NOTES",
  ]
    .filter(Boolean)
    .join("\n");
  return { system, user };
}

/**
 * Build the prompt for a grounded "Ask about my notes" follow-up. The model
 * may explain and hint but should push thinking rather than dump graded
 * answers, matching the homework-helper stance used elsewhere in the app.
 */
export function buildAskPrompt(notes, question) {
  const system = [
    "You are a warm, patient study helper. Answer ONLY using the student's notes provided; if the notes do not cover it, say so kindly and suggest what to review.",
    "Explain concepts and vocabulary fully and simply. For graded-style problems, guide with the next step and a question rather than only the final answer.",
    "Keep replies short (2–5 sentences), plain language, one idea at a time. Use LaTeX for math as \\( ... \\) / \\[ ... \\].",
  ].join(" ");
  const user = [
    "STUDENT NOTES:",
    "<<<NOTES",
    String(notes || "").slice(0, CAPS.notes),
    "NOTES",
    "",
    `QUESTION: ${String(question || "").slice(0, CAPS.question)}`,
  ].join("\n");
  return { system, user };
}

const asStr = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));
const asArr = (v) => (Array.isArray(v) ? v : []);
const strList = (v) => asArr(v).map(asStr).filter((s) => s.trim().length > 0);

/**
 * Defensively normalise a parsed model response into the study-pack shape.
 * Missing sections become empty arrays/objects so the renderer never throws.
 * Returns null only when there is nothing usable at all.
 */
export function coerceStudyPack(raw) {
  if (!raw || typeof raw !== "object") return null;
  const bi = raw.bigIdeas && typeof raw.bigIdeas === "object" ? raw.bigIdeas : {};
  const gameIn = raw.game && typeof raw.game === "object" ? raw.game : {};
  const gameType = asStr(gameIn.type).toLowerCase() === "sort" ? "sort" : "match";

  const pack = {
    title: asStr(raw.title).slice(0, 140) || "My Study Pack",
    subject: asStr(raw.subject).slice(0, 120),
    gradeBand: asStr(raw.gradeBand).slice(0, 60),
    bigIdeas: {
      summary: strList(bi.summary).slice(0, 8),
      vocab: asArr(bi.vocab)
        .map((t) => ({
          term: asStr(t && t.term).slice(0, 120),
          definition: asStr(t && t.definition).slice(0, 400),
          example: asStr(t && t.example).slice(0, 400),
        }))
        .filter((t) => t.term)
        .slice(0, 12),
    },
    walkthrough: asArr(raw.walkthrough)
      .map((w) => ({
        title: asStr(w && w.title).slice(0, 160),
        steps: strList(w && w.steps).slice(0, 12),
        answer: asStr(w && w.answer).slice(0, 400),
        note: asStr(w && w.note).slice(0, 400),
      }))
      .filter((w) => w.title || w.steps.length)
      .slice(0, 6),
    practice: asArr(raw.practice)
      .map((p) => ({
        question: asStr(p && p.question).slice(0, 500),
        choices: strList(p && p.choices).slice(0, 6),
        answer: asStr(p && p.answer).slice(0, 300),
        hints: strList(p && p.hints).slice(0, 4),
        explanation: asStr(p && p.explanation).slice(0, 600),
      }))
      .filter((p) => p.question)
      .slice(0, 8),
    game: {
      type: gameType,
      instructions: asStr(gameIn.instructions).slice(0, 200),
      pairs:
        gameType === "match"
          ? asArr(gameIn.pairs)
              .map((pr) => ({
                left: asStr(pr && pr.left).slice(0, 120),
                right: asStr(pr && pr.right).slice(0, 160),
              }))
              .filter((pr) => pr.left && pr.right)
              .slice(0, 8)
          : [],
      buckets:
        gameType === "sort"
          ? asArr(gameIn.buckets)
              .map((b) => ({
                name: asStr(b && b.name).slice(0, 80),
                items: strList(b && b.items).slice(0, 8),
              }))
              .filter((b) => b.name && b.items.length)
              .slice(0, 5)
          : [],
    },
    quiz: asArr(raw.quiz)
      .map((q) => ({
        question: asStr(q && q.question).slice(0, 500),
        choices: strList(q && q.choices).slice(0, 5),
        answer: asStr(q && q.answer).slice(0, 300),
        explanation: asStr(q && q.explanation).slice(0, 400),
      }))
      .filter((q) => q.question && q.choices.length >= 2)
      .slice(0, 8),
  };

  const hasContent =
    pack.bigIdeas.summary.length ||
    pack.bigIdeas.vocab.length ||
    pack.walkthrough.length ||
    pack.practice.length ||
    pack.quiz.length;
  return hasContent ? pack : null;
}

/**
 * Extract the first balanced JSON object from a model's text response. Handles
 * accidental prose or ```json fences around the object.
 */
export function extractJsonObject(text) {
  const s = asStr(text);
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : s;
  const start = body.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(body.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// Contract fields the grades 6-8 publisher builder adds to every spec (tools/build-access-g68-content.mjs).
// A spec holds what an author writes; this file holds what every activity or lesson carries the same way.

export const TIME = {
  Listening: { A: "5 min", B: "7 min", C: "9 min" },
  Speaking: { A: "6 min", B: "8 min", C: "10 min" },
  Writing: { A: "10 min", B: "14 min", C: "18 min" },
};

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export const DEFAULTS = {
  Listening: {
    label: "Your notes",
    strandDesc:
      "More listening for grades 6-8: lectures, announcements, dialogues, interviews and directions, with note-taking.",
    support:
      "Read the question first. Play it again and listen for one clue at a time, then check your answer against what you heard.",
    extension:
      "Tell a partner one more detail you heard and say why it matters to the speaker's message.",
    teacher: (s) => ({
      use: `Whole group, partners, or a listening center. Play the audio or read the script aloud once at a natural pace; ${lower(s)}.`,
      function: s,
      lower:
        "Read the script twice, pausing after each idea. Let students jot key words before they answer.",
      onLevel: "Play once, students answer, then replay and name the clue they heard.",
      challenge:
        "Ask students to explain why each wrong choice does not match what the speaker said.",
      noTech: "Read the script aloud from the teacher page. Students answer on paper.",
      prompt: "Which words in what you heard told you the answer?",
    }),
  },
  Speaking: {
    label: "Planning notes",
    strandDesc:
      "More speaking for grades 6-8: explain your thinking, compare, argue, and play roles with a picture or data to talk about.",
    support:
      "Use the sentence starters. Say it once to yourself, then record your own words. Listen back and use the self-check.",
    extension:
      "Say your answer again with one more detail, one more reason, or a number from the data.",
    teacher: (s) => ({
      use: `Partners or one-on-one with a recording. Plan with the starters, then record; ${lower(s)}.`,
      function: s,
      lower: "Accept short sentences. Model the first starter, then let the student continue.",
      onLevel: "Students plan with the starters, then speak in connected sentences and self-check.",
      challenge: "Ask for a reason with because, a comparison with whereas, and one precise term.",
      noTech:
        "Students tell a partner, and the partner uses the self-check to give one kind comment.",
      prompt: "Tell me more. What is one more detail or precise word you can add?",
    }),
  },
  Writing: {
    label: "Your writing",
    strandDesc:
      "More writing for grades 6-8: planned paragraphs and multi-paragraph pieces with models, organizers and rubric language.",
    support: "Use the sentence starters and the word bank. Plan first, then write, then check.",
    extension: "Add one more sentence with a detail, a reason, or a transition word.",
    teacher: (s) => ({
      use: `Independent writing or a writing workshop. Study the model, plan with the organizer, write, then check against the criteria; ${lower(s)}.`,
      function: s,
      lower:
        "Write the first sentence together, then let the student finish with the frames and word bank.",
      onLevel: "Students complete the organizer, write the piece, then reread and revise once.",
      challenge: "Ask students to add a transition and one more precise detail, then explain why.",
      noTech: "Print the prompt, the organizer and the word bank; students write on lined paper.",
      prompt: "Read your writing aloud. Which sentence has your best detail or reason?",
    }),
  },
};

const LEVEL_NAMES = { A: "Starting support", B: "Growing", C: "Expanding" };

/** The full Reading Room lesson from a spec (tools/access-g68-content/README.mjs) and its built questions. */
export function lessonDefaults(s, id, questions) {
  const words = s.paras.map((p) => (typeof p === "string" ? p : p.text));
  return {
    id,
    revision: "1.0.0",
    title: s.title,
    summary: s.summary,
    gradeCluster: "6-8",
    supportLevel: s.level,
    genre: s.genre,
    subject: s.subject,
    topics: s.topics,
    keyUse: s.keyUse,
    eldStandard: s.eldStandard,
    languageExpectations: [],
    alignmentStatus:
      "Local instructional focus for the grades 6-8 cluster; Language Expectation mapping needs educator review.",
    languageFunction: s.languageFunction,
    languageFeatures: s.languageFeatures,
    languageDimensions: ["discourse", "sentence", "word/phrase"],
    taskComplexity: `Original ${LEVEL_NAMES[s.level].toLowerCase()} text with ${words.length} short sections and ${questions.length} connected tasks; no numeric reading level is asserted.`,
    minutes: s.minutes,
    objectives: { content: s.content, language: s.language },
    beforeReading: {
      essentialQuestion: s.essential,
      background: s.background,
      hook: s.hook,
      purpose: s.purpose,
    },
    vocabulary: s.vocab.map(([term, definition, example, spanish]) => ({
      term,
      definition,
      example,
      spanish,
    })),
    paragraphs: words.map((text, i) => ({
      id: `p${i + 1}`,
      text,
      guidingQuestion:
        (typeof s.paras[i] === "object" && s.paras[i].q) || "What does this section add?",
    })),
    ...(s.table ? { table: s.table } : {}),
    activities: questions,
    transferPrompt: s.transfer.prompt,
    teacherGuide: {
      contentObjective: s.content,
      languageObjective: s.language,
      miniLesson: s.guide.mini,
      discussion: s.guide.discussion,
      misconception: s.guide.misconception,
      scaffolds: {
        modeled:
          "Think aloud to find one detail that answers a question, then say which words proved it.",
        guided: "Use the response frame and mark the evidence paragraph before answering.",
        independent: "Answer without the frame and explain which choice you rejected and why.",
      },
      answerNotes: s.guide.answerNotes,
      modelResponse: s.guide.model,
      sourceNote:
        "Original reading lesson and questions authored for EduWonderLab; not official WIDA test material.",
    },
    familySupport: {
      directions: { en: s.family.en, es: s.family.es },
      questions: s.family.questions,
      noEnglishRequired:
        "Family discussion can happen in any language; the student can practice explaining one idea in English afterward.",
    },
    connections: {
      write: s.connections?.write || "Write a short response that uses one detail from the text.",
      speak: s.connections?.speak || "Explain the main idea aloud with one detail.",
      listen: s.connections?.listen || "Listen for the same idea in a classroom explanation.",
      relatedActivity: null,
    },
    editorial: {
      status: "authored-pending-independent-editorial-review",
      humanReview:
        "Not independently reviewed; automated validation is not editorial certification.",
      source: "Original EduWonderLab reading content; not official WIDA material.",
      factCheck:
        "Facts, numbers and answer keys require independent editorial verification before approval.",
      accessibility:
        "Text is divided into labeled paragraphs with native keyboard-operable tasks; visual and assistive-technology review remains pending.",
      lastReviewed: "2026-11-06",
    },
  };
}

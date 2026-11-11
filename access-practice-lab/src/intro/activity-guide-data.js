// The Activity Guide: how each curated activity is used, step by step, with the button names exactly as the activity
// shows them (each page was opened and read in a browser on 2026-11-10). Used by the /start/activities page and by the
// printed Activity Guide (scripts/generate-intro-guide.mjs). Facts about time, route and supports stay in data.js.
// Pure data: no DOM, no lab imports beyond data.js.
import { ACTIVITY_BY_ID } from "./data.js";

/**
 * Per activity:
 *   open      how a student gets there (a teacher link works without an account)
 *   steps     what the student does, in order, naming the real controls
 *   feedback  what the activity gives back, stated exactly (never more than it does)
 *   teach     how to run it: before, during, after
 *   stuck     common problems and the fix
 */
export const ACTIVITY_GUIDE = [
  {
    id: "hallway",
    why: "Students say one idea at three lengths, so they rehearse words before sentences and sentences before an explanation. Hearing a classmate-style model first shows what a complete answer sounds like.",
    open: "Share the link. Students can also open the More menu, choose Voice Lab, then “The Busy Hallway.”",
    steps: [
      "Look at the hallway picture.",
      "Step 1 · Words: tap “Hear the question,” then “Hear Amara first” to hear a model answer.",
      "Say four things you see. Open “Show a sentence frame” if you want help.",
      "Optional: press “Record my answer,” then listen to yourself. Or say it to a partner.",
      "Press “I said it out loud.” Then do Step 2 · Sentences and Step 3 · Tell more the same way.",
    ],
    feedback:
      "No score. A model student to compare with, and a length meter after a recording. Steps marked “said” are remembered on this device.",
    teach: {
      before: "Show the picture and model Step 1 yourself.",
      during:
        "Partners take turns; the listener holds up a finger for each detail or reason they hear.",
      after: "Ask two students to say their Step 3 answer to the class.",
    },
    stuck: [
      [
        "No sound from “Hear …”",
        "Check the volume. The voice is the device’s own; read the model aloud instead.",
      ],
      [
        "No microphone, or students do not want to record",
        "Skip Record. Say it to a partner, then press “I said it out loud.”",
      ],
    ],
  },
  {
    id: "board",
    why: "Students plan with evidence before they speak, then see their own words written out, so the second try can be clearer and better supported than the first.",
    open: "Share the link. Students can also open the More menu, choose Speaking Studio, then “Speak at the School Board Meeting.”",
    steps: [
      "Read the situation and the survey table. Tap “Hear the task” to hear the directions.",
      "Choose your help: “With frames and words,” “With a word bank,” or “On my own.”",
      "Plan: write your position, two pieces of evidence and one concern.",
      "Say it: press “Record my answer,” or “I said it out loud (no recording).”",
      "Type it: fix or type the words you said. Then read the Coach notes, and use Review to say it again if you want.",
    ],
    feedback:
      "Coach notes that look at the words students said or typed (not pronunciation). No score; the page says it is practice, not an ACCESS score.",
    teach: {
      before: "Read the table together and point to the two numbers that matter most.",
      during:
        "Small groups of three: a speaker, a board member who asks one question, and a listener.",
      after: "Each listener names one number they heard in the speech.",
    },
    stuck: [
      [
        "Speech-to-text did not catch the words",
        "Type the words in “Type it.” Typing always works.",
      ],
      [
        "The student is stuck on the plan",
        "Switch to “With frames and words” to see sentence frames and a model.",
      ],
    ],
  },
  {
    id: "upgrade",
    why: "One sentence is small enough to revise several times in five minutes. The three checks turn “make it better” into three concrete moves: a detail, an exact word, a connector.",
    open: "Share the link. Students can also open the More menu, choose Language builders, then Language Upgrade Lab.",
    steps: [
      "Read the everyday sentence: “Phones in class are bad.”",
      "Choose “Start with this help” (a frame and a word bank) or “On my own.”",
      "Write a better version under “My revision.”",
      "Press “Check my work.” It shows Before and After and three checks: a detail, a precise word, two ideas connected.",
      "Fix what it names and check again. “Ask for more help” adds a model if you are stuck.",
    ],
    feedback:
      "Three checks marked “not yet” or met, with what to fix. It looks for words and connectors; it does not judge meaning. Every revision is kept.",
    teach: {
      before: "Read the frame aloud and model one exact word for “bad.”",
      during: "Students check, then compare their exact word with a partner.",
      after: "Collect three revised sentences and read them aloud.",
    },
    stuck: [
      [
        "“Not yet” on every check",
        "Use the frame: “Phones in class can be ___ because ___.” and one word from the bank.",
      ],
      [
        "A student wants no help",
        "Choose “On my own.” Opening help later marks the try as supported, which is fine.",
      ],
    ],
  },
  {
    id: "paragraph",
    why: "Reading the sources and planning first gives students something to say. Feedback that points at their own sentences leads to one specific revision instead of a rewrite.",
    open: "Share the link. Students can also open the More menu, choose Writing Studio, then “Should School Start Later?”",
    steps: [
      "Read: the Student Council Notes and the Student Sleep Survey. “Read aloud” reads a source to you.",
      "Choose your help: “With frames and words,” “With a word bank,” or “On my own.” Tap a sentence to add it to your evidence notebook.",
      "Plan: position, two reasons with evidence, the other side, your answer to it.",
      "Write: one paragraph (about 80–150 words). It saves on this device as you type.",
      "Feedback: press “Get feedback,” revise, then Finish.",
    ],
    feedback:
      "Feedback describes what is on the page (evidence used, connectors, sentence shapes) and never gives a score. The first draft is kept so growth is visible.",
    teach: {
      before: "Day 1: read and plan together. Model the position sentence with the first frame.",
      during: "Day 2: write, then one round of “Get feedback” and one revision.",
      after: "Partners read paragraphs aloud and say which reason is strongest.",
    },
    stuck: [
      [
        "The paragraph feels too long for the time",
        "Write only the position sentence and one reason today; finish tomorrow. The draft is saved.",
      ],
      [
        "A student needs vocabulary",
        "Open “Word meanings and Spanish” for word bridges, or “See a model response.”",
      ],
    ],
  },
  {
    id: "seasons",
    why: "A short text with word help and paragraph marks builds the ideas and vocabulary students then speak and write about.",
    open: "Share the link. Students can also open the More menu, choose Reading Room, then find “Why Do We Have Seasons?” on the shelf.",
    steps: [
      "Choose Learn, Practice or Independent challenge at the top.",
      "Read “Before you read.” Open a word under “Words to notice” if you need its meaning.",
      "Read each paragraph. “Read passage aloud” reads it to you; you can choose the speed.",
      "Use “Mark this paragraph” and write a note. “Save reading place” keeps your spot.",
      "In “Your response,” work through 1 · Understand, 2 · Investigate and 3 · Apply, pressing “Check answer” on each question. “Write about a text” and “Speak about a text” lead on.",
    ],
    feedback:
      "“Check answer” on each question. Notes, marks and answers save in this browser (“Save lesson progress”). Not a score.",
    teach: {
      before: "Ask: what do you think causes summer?",
      during: "Partners mark the paragraph that corrects the wrong idea.",
      after: "Students explain the cause with “because” and “so.”",
    },
    stuck: [["The text is hard", "Use Read together or Practice mode and the word help."]],
  },
  {
    id: "morphemes",
    why: "Knowing prefixes, roots and suffixes helps students work out new academic words and choose more exact words when they write.",
    open: "Share the link. Students can also open the More menu, choose Word Lab, then Morpheme Builder.",
    steps: [
      "Choose your help: A More support, B Some support or C On my own.",
      "Choose “Build it” (make a word from a meaning) or “Decode it” (find the parts).",
      "Read the meaning, then tap a prefix, a root and a suffix to snap them together.",
      "Press “Check my word.” When it matches, the page says “You built …” and shows what each part means. “Clear” starts the word again.",
      "Press “Next word.” The counter shows how many words you have built. Nothing is timed.",
    ],
    feedback: "A built word is confirmed with the meaning of each part, and “Hear it” says the word. Not a score.",
    teach: {
      before: "Model one word: ex- + port = export.",
      during: "Partners say each word they build in a sentence.",
      after: "Use one new word in the Language Upgrade Lab.",
    },
    stuck: [["Too many choices", "Choose A More support."]],
  },
];

export const GUIDE_BY_ID = Object.fromEntries(
  ACTIVITY_GUIDE.map((g) => [g.id, { ...g, activity: ACTIVITY_BY_ID[g.id] }]),
);

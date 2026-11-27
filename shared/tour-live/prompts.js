// The questions a live tour of The Language Page asks its audience, and the only answers each one accepts.
// One list, read by the room API (functions/api/tour-room), the audience phone page (/tour/join/) and the
// projected tour (/tour/). The server stores nothing but these ids: no names, no free text. A revision typed
// into the phone's Upgrade Lab is checked on the phone; only which of the three checks passed is sent.

export const STOP_COUNT = 16;

/** Upgrade Lab results: one character per check (detail, precise word, connector), "1" passed, "0" not. */
export const UPGRADE_RESULTS = Object.freeze([
  "000",
  "001",
  "010",
  "011",
  "100",
  "101",
  "110",
  "111",
]);

export const PROMPTS = Object.freeze({
  need: {
    stop: 1,
    q: "Where do your students most need more practice?",
    choices: [
      ["speaking", "Speaking"],
      ["writing", "Writing"],
      ["listening", "Listening"],
      ["reading", "Reading"],
    ],
  },
  door: {
    stop: 2,
    q: "Which door would you open first?",
    choices: [
      ["teacher", "Teacher"],
      ["student", "Student"],
      ["family", "Family member"],
      ["bcpss", "BCPSS teachers"],
    ],
  },
  support: {
    stop: 4,
    q: "On the hallway task, where would most of your students start?",
    choices: [
      ["more", "More support"],
      ["some", "Some support"],
      ["own", "On my own"],
    ],
  },
  ladder: {
    stop: 5,
    q: "Which step will stretch your students most?",
    choices: [
      ["name", "Step 1: name four things"],
      ["tell", "Step 2: tell what and why"],
      ["explain", "Step 3: explain a change"],
    ],
  },
  upgrade: {
    stop: 6,
    q: "Revise “Phones in class are bad.” on your phone, then send your check.",
    kind: "upgrade",
    choices: UPGRADE_RESULTS.map((v) => [v, v]),
  },
  lesson: {
    stop: 7,
    q: "Which step of the lesson will need the most care in your room?",
    choices: [
      ["notice", "Notice"],
      ["speak", "Speak"],
      ["write", "Write"],
      ["improve", "Improve"],
      ["share", "Share"],
    ],
  },
  place: {
    stop: 8,
    q: "Which place would your students open first?",
    choices: [
      ["reading", "Reading Room"],
      ["wordlab", "Word Lab"],
      ["newsroom", "Newsroom"],
      ["scenarios", "Real-Life Scenarios"],
      ["arena", "Argument Arena"],
      ["mentor", "Mentor Text Explorer"],
      ["sor", "Science of Reading Studio"],
      ["worlds", "Language Worlds"],
      ["write", "Writing Studio"],
      ["speak", "Speaking Studio"],
      ["vocab", "Word Builder"],
      ["videos", "Videos"],
    ],
  },
  teach: {
    stop: 10,
    q: "Which teacher tool would you open first?",
    choices: [
      ["hub", "Teacher Hub"],
      ["lesson", "Featured lesson"],
      ["data", "WIDA Data Studio"],
      ["family", "Family Tour"],
    ],
  },
  home: {
    stop: 11,
    q: "Which language do most of your students’ families read at home?",
    choices: [
      ["english", "English"],
      ["spanish", "Spanish"],
      ["other", "Another language"],
      ["mix", "A mix"],
    ],
  },
  ready: {
    stop: 15,
    q: "How ready are you to try one activity with students this week?",
    choices: [
      ["1", "Not yet"],
      ["2", "Maybe"],
      ["3", "Likely"],
      ["4", "Yes, this week"],
    ],
  },
});

/** Reactions an audience can send at any moment. Counted, never attributed. */
export const REACTIONS = Object.freeze([
  ["agree", "Agree"],
  ["idea", "Good idea"],
  ["question", "I have a question"],
  ["love", "Love this"],
]);

/** The prompt asked at a stop, or "" when that stop asks nothing. */
export function promptForStop(stop) {
  for (const [id, p] of Object.entries(PROMPTS)) if (p.stop === stop) return id;
  return "";
}

/** True when `value` is one of the answers prompt `id` accepts. */
export function validAnswer(id, value) {
  const p = Object.hasOwn(PROMPTS, id) ? PROMPTS[id] : null;
  return Boolean(p && p.choices.some(([v]) => v === value));
}

export const validReaction = (kind) => REACTIONS.some(([k]) => k === kind);

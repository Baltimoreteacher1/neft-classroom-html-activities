// The Language Page introduction: ONE structured list of the verified activities, the featured lesson and the
// timed sequences. The teacher start page, guided tour, 20-minute exploration, presenter view, quick guide (HTML,
// PDF, DOCX), family page and Site Guide all read this file, so a title, route, time or support is written once.
//
// Pure data and string helpers: no DOM, no lab imports, so the document generator can import it in Node.
// Every route below was opened in a real browser on 2026-11-10 (tools/access-intro.test.mjs re-checks that each
// one resolves to a lab route and to content that exists). Change an activity here and nothing else drifts.

export const SITE = { host: "https://thelanguagepage.com", base: "/access-practice-lab" };

/** Lab-relative routes of the new introduction pages. No segment contains "teacher": the Pages gate matches it. */
export const ROUTES = {
  start: "/start",
  tour: "/start/tour",
  explore: "/start/explore",
  guide: "/start/guide",
  present: "/start/present",
  lesson: "/start/lesson",
  activities: "/start/activities",
  together: "/practice-together",
  siteGuide: "/site-guide",
};

/** Full public URL for a lab route (the QR codes and printed fallbacks use this). */
export const absUrl = (route) => `${SITE.host}${SITE.base}${route}`;
/** Printable form without the scheme: thelanguagepage.com/access-practice-lab/start */
export const shortUrl = (route) => absUrl(route).replace(/^https:\/\//, "");

/** "speaking" is always listed before "writing" on the start page, tour and handout. */
export const PATHWAYS = [
  {
    id: "speaking",
    icon: "speaking",
    name: "Speaking",
    blurb: "Say it aloud, with a model and a frame.",
  },
  {
    id: "writing",
    icon: "writing",
    name: "Writing",
    blurb: "Write it, check it, make it clearer.",
  },
];

/**
 * The four curated activities. Field guide:
 *   does        what students do, one sentence
 *   tryNow      the one direction a teacher follows while exploring
 *   classroomUse one realistic use
 *   builtIn     supports the site really provides (checked in the browser)
 *   moves       teaching moves a person adds; never described as site features
 *   limits      what to say out loud about audio, recording, scoring and saving
 */
export const ACTIVITIES = [
  {
    id: "hallway",
    pathway: "speaking",
    icon: "speaking",
    name: "The Busy Hallway",
    where: "Voice Lab · Picture speaking ladder",
    route: "/voice/ladder/school-hallway",
    minutes: 6,
    time: "5–8 min",
    does: "Students look at a hallway picture and speak three times: name things, say what is happening and why, then explain one change and give a reason.",
    tryNow:
      "Go to Step 3. Tap “Hear Lina first,” then say your own answer aloud using the sentence frame.",
    classroomUse:
      "Partner warm-up: each student says Step 3 to a partner, who listens for one reason.",
    builtIn: [
      "A model student you can hear before you answer (device voice).",
      "A sentence frame under “Show a sentence frame.”",
      "Optional recording: the microphone is requested only when you press Record.",
    ],
    moves: ["Partners listen instead of recording.", "Students plan in their home language first."],
    limits:
      "Not scored. Recordings stay in the open tab and are never uploaded. “I said it out loud” is remembered on this device.",
  },
  {
    id: "board",
    pathway: "speaking",
    icon: "speaking",
    name: "Speak at the School Board Meeting",
    where: "Speaking Studio",
    route: "/speak/spk-startime-argue",
    minutes: 7,
    time: "7 min",
    does: "Students read a short survey table, plan a position with two pieces of evidence, say it, and review it.",
    tryNow:
      "Choose “With frames and words,” plan your position and one number from the table, then say it aloud.",
    classroomUse:
      "Two-minute board speeches in small groups; listeners write down one number they heard.",
    builtIn: [
      "Three help levels: frames and words, a word bank only, or on my own.",
      "“Hear the task” reads the directions aloud.",
      "Record an answer, or press “I said it out loud (no recording).” Typing the words is always possible.",
    ],
    moves: [
      "A partner plays the school board and asks one question.",
      "Students rehearse once before recording.",
    ],
    limits:
      "Practice, not a score. The Coach looks at the words students say or type, not at pronunciation.",
  },
  {
    id: "upgrade",
    pathway: "writing",
    icon: "writing",
    name: "Language Upgrade Lab",
    where: "Language builders",
    route: "/scaffold/language-upgrade?item=lu68-argue-phones",
    minutes: 5,
    time: "5 min",
    does: "Students revise a plain sentence (“Phones in class are bad.”) by adding a detail, a more exact word and a connector.",
    tryNow:
      "Choose “Start with this help,” write one improved sentence, press “Check my work,” then fix one thing it names.",
    classroomUse:
      "Exit ticket: every student revises one sentence, then partners compare the exact word each chose.",
    builtIn: [
      "A sentence frame and a word bank (“Start with this help”), or nothing at all (“On my own”).",
      "“Ask for more help” adds support and marks the try as supported.",
      "“Check my work” names what to fix; students can revise as many times as they like.",
    ],
    moves: [
      "Read the frame aloud together before writing.",
      "Partners swap sentences and underline the exact word.",
    ],
    limits:
      "The check looks for a detail, an exact word and a connector. It does not judge meaning.",
  },
  {
    id: "paragraph",
    pathway: "writing",
    icon: "writing",
    name: "Should School Start Later?",
    where: "Writing Studio",
    route: "/write/wrt-school-start-paragraph",
    minutes: 20,
    time: "20 min",
    does: "Students read a school-board situation, a short article and a survey table, plan, write one paragraph that takes a position, then revise after feedback.",
    tryNow:
      "Read the Student Council Notes, write only your position sentence with the first frame, then press “Get feedback.”",
    classroomUse: "Two class periods: read and plan on day one; write and revise on day two.",
    builtIn: [
      "Three help levels, from frames and words to on my own.",
      "“Hear the task” and “Read aloud” for the sources; “Read my writing to me.”",
      "Sentence frames, a word bank, Spanish and word-part bridges, and a model response.",
      "Writing is saved on this device as students type.",
    ],
    moves: [
      "Students talk through their two reasons with a partner before writing.",
      "Use one rubric row for feedback, not all of them.",
    ],
    limits: "Feedback describes what is on the page and never gives a score.",
  },
];

/** Two supplemental resources, shown only under “Explore Later.” */
export const SUPPLEMENTAL = [
  {
    id: "seasons",
    area: "reading",
    icon: "reading",
    name: "Why Do We Have Seasons?",
    where: "Reading Room",
    route: "/reading-room/rr68p-why-we-have-seasons",
    time: "12 min",
    does: "Students read a short explanation text, mark paragraphs, open word help and answer questions.",
    supports:
      "Read aloud with a device voice, optional word help, paragraph marks and notes, text size and spacing. “Write about a text” and “Speak about a text” lead on to speaking and writing.",
  },
  {
    id: "morphemes",
    area: "vocabulary",
    icon: "words",
    name: "Morpheme Builder",
    where: "Word Lab",
    route: "/wordlab/build",
    time: "5–10 min",
    does: "Students snap prefixes, roots and suffixes together to build a word from its meaning.",
    supports:
      "Three support levels (More, Some, On my own), “Show what the parts mean,” and “Hear it.” Nothing is timed or scored.",
  },
];

export const ACTIVITY_BY_ID = Object.fromEntries(
  [...ACTIVITIES, ...SUPPLEMENTAL].map((a) => [a.id, a]),
);
export const activitiesFor = (pathway) => ACTIVITIES.filter((a) => a.pathway === pathway);

/** The featured lesson. Replace `anchor` (an ACTIVITIES id) and the prompt fields to feature another activity. */
export const FEATURED_LESSON = {
  title: "Safer Hallways: Speak, Write, Improve",
  label: "Featured Lesson",
  anchor: "hallway",
  minutes: 10,
  objective:
    "Students will explain one change and support it with a reason and an example, first aloud and then in writing.",
  prompt:
    "The hallway gets crowded between classes. Explain one change the school could make so students get to class safely, and give a reason.",
  frame: "One change the school could make is ___. This would help because ___. For example, ___.",
  picture: {
    src: "/access-practice-lab/pictures/68-school-hallway.svg",
    alt: "A busy school hallway with a row of lockers, students carrying backpacks, a clock, and a water fountain.",
  },
  steps: [
    {
      id: "notice",
      name: "Notice",
      minutes: 1,
      teacher:
        "Show the picture. Ask: “What do you see? What problem could happen here?” Take two quick answers.",
      students: "Look at the picture and name two things and one problem.",
    },
    {
      id: "speak",
      name: "Speak",
      minutes: 2,
      teacher:
        "Read the prompt. Partners take turns answering with the frame. The listener holds up one finger for the change and two for the reason.",
      students: "Say the response and explain one reason to a partner (or to yourself, aloud).",
    },
    {
      id: "write",
      name: "Write",
      minutes: 3,
      teacher:
        "Students turn what they said into two or three written sentences. Allow home-language notes first.",
      students: "Write the spoken idea as a short response.",
    },
    {
      id: "improve",
      name: "Improve",
      minutes: 2,
      teacher:
        "Give one cue only: “Add an example that starts with For example.” Students add it and read the new version once.",
      students: "Add one example to make the response clearer.",
    },
    {
      id: "share",
      name: "Share",
      minutes: 2,
      teacher: "Two or three students read the revised response and say what they added.",
      students: "Read or say the revised response and explain the improvement.",
    },
  ],
  sample: {
    first: "The school should make the hallway bigger. It is too crowded.",
    improved:
      "One change the school could make is to put arrows on the floor so everyone walks the same way. This would help because students would not run into each other. For example, a student with a heavy backpack could get to class without being pushed.",
    explanation: "The improved response adds a clear change, a reason and an example.",
  },
  cue: "Add an example that starts with “For example.”",
  check:
    "Quick check: ask students to point to their change, their “because,” and their “For example.” Count how many have all three.",
  followUp:
    "Next day: students write one change for another school place (the lunch line or bus loading) with the same three parts, then try the Language Upgrade Lab.",
  supports: {
    more: {
      name: "More support",
      items: [
        "Vocabulary: crowded, hallway, rule, safely, bump into, walk on the right, arrows.",
        "Visual reference: the hallway picture stays on screen.",
        "Oral rehearsal: say it twice with a partner before writing.",
        "Sentence frame: One change the school could make is ___. This would help because ___.",
      ],
    },
    some: {
      name: "Some support",
      items: [
        "Optional connectors: because, so, also, for example.",
        "Reason prompt: “Why would this help?”",
      ],
    },
    independent: {
      name: "Greater independence",
      items: [
        "Write a fuller explanation with two reasons.",
        "Choose a more exact word for “crowded” or “rule.”",
        "Answer a classmate who disagrees: “Some students think … However, …”",
      ],
    },
  },
  notes: [
    "Students may plan in their home language before they say or write in English.",
    "Supports fade; the task stays the same. These are practical supports, not WIDA levels or alignments.",
    "If students will not record, use live partner talk. The activity needs no microphone.",
  ],
};

/** Stable order and names for the five tour stops (page, tour, handout and presenter use these). */
export const TOUR_STOPS = [
  { id: "start", icon: "flag", name: "Start here" },
  { id: "speaking", icon: "speaking", name: "Try speaking" },
  { id: "writing", icon: "writing", name: "Try writing" },
  { id: "connect", icon: "conversation", name: "Connect the two" },
  { id: "tomorrow", icon: "calendar", name: "Use it tomorrow" },
];

/** The three ways in on the teacher start page. */
export const START_CHOICES = [
  {
    id: "tour",
    icon: "flag",
    name: "Take the Guided Tour",
    detail: "Five short stops, about 20 minutes.",
    route: ROUTES.tour,
  },
  {
    id: "explore",
    icon: "clock",
    name: "Explore for 20 Minutes",
    detail: "Choose speaking or writing, try it, plan it.",
    route: ROUTES.explore,
  },
  {
    id: "guide",
    icon: "info",
    name: "Open the Quick Guide",
    detail: "Two pages to print or keep, plus the Activity Guide.",
    route: ROUTES.guide,
  },
];

/** The 20-minute exploration, in order. Timing is advice; teachers move freely. */
export const EXPLORE_SEQUENCE = [
  { id: "focus", range: "0–2", name: "Choose one focus", detail: "Speaking or writing." },
  {
    id: "try",
    range: "2–9",
    name: "Try one activity",
    detail: "Complete a short sample as a learner and try one support.",
  },
  { id: "adapt", range: "9–14", name: "Adapt it", detail: "Fill in the planning card." },
  {
    id: "rehearse",
    range: "14–18",
    name: "Rehearse classroom use",
    detail: "Explain it to a partner or rehearse your directions.",
  },
  {
    id: "next",
    range: "18–20",
    name: "Leave with one next step",
    detail: "Activity, class, support, and when.",
  },
];

/** The 30-minute presenter sequence (exact pacing). Notes live in presenter-notes.js. */
export const PRESENTER_SCHEDULE = [
  {
    range: "0–3",
    presenter: "Explain the purpose and show the starting page",
    teachers: "Identify one speaking or writing need",
  },
  {
    range: "3–8",
    presenter: "Demonstrate the speaking pathway",
    teachers: "Try a brief response and one support",
  },
  {
    range: "8–13",
    presenter: "Demonstrate the writing pathway",
    teachers: "Write and improve a short response",
  },
  {
    range: "13–23",
    presenter: "Lead the featured speaking-to-writing lesson",
    teachers: "Participate as learners",
  },
  {
    range: "23–27",
    presenter: "Show a practical classroom adaptation and the family page",
    teachers: "Identify one adaptation for their students",
  },
  {
    range: "27–30",
    presenter: "Introduce the quick guide and exploration directions",
    teachers: "Choose a starting pathway",
  },
];

/** Where the account, saving and recording answers are written once (Help, family page, Site Guide). */
export const FACTS = {
  account: "No account is needed to practice. Your work saves in this browser on this device.",
  saving:
    "Saved work stays on the device and browser you used. It does not follow you to a different device, and clearing site data removes it. Passport can export it.",
  microphone:
    "A microphone is never required. Recording starts only when a person presses Record, and recordings stay in the open tab.",
  audio:
    "If sound does not play, check the device volume and try another browser tab. Every activity can be done by reading, typing, or talking with a partner.",
};

/** The five prompts of the planning card (explore page and quick guide share them). */
export const PLANNING_PROMPTS = [
  { id: "practice", label: "My students will practice…", sample: "explaining a change and giving a reason." },
  { id: "produce", label: "Students will say or write…", sample: "one change, one reason and one example." },
  { id: "support", label: "I will offer this support…", sample: "a sentence frame and a partner to rehearse with." },
  { id: "look", label: "I will look or listen for…", sample: "the word “because” and an example." },
  { id: "retry", label: "After feedback, students will try again by…", sample: "adding one example that starts with “For example.”" },
];

/** The sentence frame teachers rehearse with (explore minute 14–18, quick guide page 1). */
export const REHEARSAL_FRAME = "I will use ___ with ___ so students can ___. First, I will ___. Then students will ___.";

/** The four commitments teachers make in the last two minutes. */
export const NEXT_STEP_FIELDS = [
  { id: "activity", label: "One activity" },
  { id: "group", label: "One class or group" },
  { id: "support", label: "One support" },
  { id: "when", label: "When I will try it" },
];

/** Looks up a curated activity or supplemental resource by id. */
export const findActivityById = (id) => ACTIVITY_BY_ID[id];

/**
 * "See an Example": a small preview on every curated activity card. `task` is the activity's own wording; `sample` is
 * either the site's own model (sampleSource "site") or work written for this guide (sampleSource "guide", labelled as
 * sample work on screen); `next` says what students do after answering. Sample sentences are run through the real
 * checks in tools/access-intro.test.mjs.
 */
export const PREVIEWS = {
  hallway: {
    task: "Step 1: “Name four things you see in the hallway.” (Step 3 asks for one change and a reason.)",
    sample: "I see lockers, backpacks, a clock and a water fountain.",
    sampleSource: "site",
    next: "Students hear a model student, say their own answer (or record it), then climb to Step 2 (what the students are doing and why) and Step 3 (one change, a reason, an example).",
  },
  board: {
    task: "“Take a position for or against the later start time. Use at least two pieces of evidence from the table, and respond to one concern someone might have.”",
    sample: "I think school should start at 8:30. Students at Hillcrest, which starts at 8:30, sleep 7.6 hours, but students at Lakeside sleep 6.8. Also, 64% of Hillcrest students feel awake in first class, and only 38% of Lakeside students do. Some people worry about sports practice, but a rested team can play better.",
    sampleSource: "guide",
    next: "Students plan, say it aloud (with or without recording), type or fix the words, read the Coach notes, then review and say it again.",
  },
  upgrade: {
    task: "“Revise this for an opinion essay to the school board.” Start from: Phones in class are bad. Add a detail, use a precise word, and connect two ideas.",
    sample: "Phones in class can distract students from learning because notifications pull their attention away.",
    sampleSource: "guide",
    next: "Students press “Check my work.” It names what is still missing (a detail, an exact word, a connector). They revise and check again as often as they like.",
  },
  paragraph: {
    task: "“Write one paragraph that argues whether Harbor Middle School should start at 8:30 a.m. State your position, give two reasons supported by the sources, and answer one concern from the other side.”",
    sample: "I believe that Harbor Middle School should start at 8:30 because students need more sleep. In the survey, 38 of the 120 eighth graders slept less than seven hours.",
    sampleSource: "guide",
    next: "Students keep writing the two reasons and the answer to the other side, press “Get feedback,” revise, and finish. The page describes the writing; it gives no score.",
  },
};
for (const a of ACTIVITIES) a.preview = PREVIEWS[a.id];

/** One recommended next activity after each curated activity (never a grid). Family pages override where noted. */
export const RECOMMENDED_NEXT = { hallway: "upgrade", upgrade: "board", board: "paragraph", paragraph: "hallway" };
export const RECOMMENDED_NEXT_FAMILY = { hallway: "upgrade", upgrade: "hallway" };

/** The "Use This Lesson" panel: what a teacher copies to students. Student-facing text only; no teacher guidance. */
export const USE_LESSON = {
  studentRoute: ACTIVITIES.find((a) => a.id === FEATURED_LESSON.anchor).route,
  materials: ["A device with the student link, or the printed backup page", "Paper or a document to write in", "A partner (a microphone is not needed)"],
  time: "About 10 minutes",
  studentDirections: [
    "Open the link. Look at the hallway picture.",
    "Name two things you see and one problem.",
    "Say your answer to a partner: One change the school could make is ___. This would help because ___. For example, ___.",
    "Write what you said in two or three sentences.",
    "Add one example that starts with “For example.”",
    "Read your new response to your partner.",
  ],
  backup: { pdf: "/access-practice-lab/guides/featured-lesson-backup.pdf", docx: "/access-practice-lab/guides/featured-lesson-backup.docx" },
};

/** Handout downloads (generated by scripts/generate-intro-guide.mjs). Names avoid the word “teacher” on purpose. */
export const DOWNLOADS = {
  quickGuide: { pdf: "/access-practice-lab/guides/quick-guide.pdf", docx: "/access-practice-lab/guides/quick-guide.docx" },
  presenterNotes: { pdf: "/access-practice-lab/guides/presenter-notes.pdf", docx: "/access-practice-lab/guides/presenter-notes.docx" },
  lessonBackup: USE_LESSON.backup,
  activityGuide: { pdf: "/access-practice-lab/guides/activity-guide.pdf", docx: "/access-practice-lab/guides/activity-guide.docx" },
  directory: { pdf: "/access-practice-lab/guides/site-directory.pdf", docx: "/access-practice-lab/guides/site-directory.docx" },
};

/** The single entrance to the whole PD. One link, one QR code, used on every handout and slide. */
export const ENTRANCE = { route: ROUTES.start, url: absUrl(ROUTES.start), short: shortUrl(ROUTES.start) };

/**
 * Where each curated item appears, for maintainers (docs/languageos/intro-curated-activities.md is generated from this and
 * from the routes above). The introduction is CURATED: adding an activity to the site never adds it here. To change the
 * set, edit ACTIVITIES / SUPPLEMENTAL deliberately, update this map, and run `node tools/generate-intro-curated-list.mjs`.
 */
export const APPEARANCES = {
  hallway: ["Start page overview", "Guided tour stop 1 (pathways) and stop 5 (choice)", "Guided tour stop 2", "Exploration (Speaking)", "Quick guide page 1", "Featured lesson anchor and Use This Lesson", "Presenter segment 3–8", "Family page: Let’s Talk", "Site Guide", "Activity Guide (page and handout)"],
  board: ["Start page overview", "Guided tour stop 1 (pathways) and stop 5 (choice)", "Exploration (Speaking)", "Quick guide page 1", "Site Guide", "Activity Guide (page and handout)"],
  upgrade: ["Start page overview", "Guided tour stop 1 (pathways) and stop 5 (choice)", "Guided tour stop 3", "Exploration (Writing)", "Quick guide page 1", "Presenter segment 8–13", "Family page: Let’s Write", "Site Guide", "Activity Guide (page and handout)"],
  paragraph: ["Start page overview", "Guided tour stop 1 (pathways) and stop 5 (choice)", "Exploration (Writing)", "Quick guide page 1", "Site Guide", "Activity Guide (page and handout)"],
  seasons: ["Exploration: Explore Later", "Family page: More Practice", "Site Guide", "Activity Guide (page and handout)"],
  morphemes: ["Exploration: Explore Later", "Family page: More Practice", "Site Guide", "Activity Guide (page and handout)"],
};

// The five stops of the guided tour. Names, order and icons come from data.js (TOUR_STOPS) so the start page, tour,
// handout and presenter notes agree. Each stop has one purpose sentence, one concrete action, one verified activity
// link or embedded view, a "Notice this" point and a "Your turn" that asks the teacher to produce or choose something.
// Field types: radio { options }, text, area { sample }. `tried` adds an "I tried this" checkbox: opening a link never
// counts as trying, and nothing here is scored.
import { ACTIVITIES, FEATURED_LESSON, ROUTES } from "./data.js";

export const TOUR_COPY = [
  {
    id: "start",
    purpose: "See the two pathways this site recommends and choose the need you hear most in your classroom.",
    action: "Read the two pathways below, then choose the need that fits your students best.",
    view: "pathways",
    notice: "Each pathway has just two activities. You can begin with one of them and leave the rest of the site for later.",
    fields: [
      {
        id: "need",
        type: "radio",
        label: "The need I hear most",
        options: [
          ["speaking", "My students need to say more, and say it clearly."],
          ["writing", "My students need to write clearer, more developed responses."],
          ["both", "Both of these."],
        ],
      },
    ],
  },
  {
    id: "speaking",
    purpose: "Hear a model, say your own answer, and try one support.",
    action:
      "Open The Busy Hallway. Go to Step 3, tap “Hear Lina first,” then say your own answer aloud. You do not need a microphone.",
    activity: "hallway",
    notice:
      "Students hear a model student before they answer, and the sentence frame stays behind a button until they ask for it.",
    tried: true,
    fields: [
      {
        id: "supportTried",
        type: "radio",
        label: "The support I tried",
        options: [
          ["model", "Hearing the model student"],
          ["frame", "The sentence frame"],
          ["partner", "Talking with a partner instead of recording"],
          ["record", "Recording my answer"],
        ],
      },
      {
        id: "spoken",
        type: "area",
        label: "Type the first sentence you said",
        sample: "One change the school could make is to put arrows on the floor.",
      },
    ],
  },
  {
    id: "writing",
    purpose: "Revise a plain sentence, check it, and fix one thing the check names.",
    action:
      "Open the Language Upgrade Lab. Choose “Start with this help,” write a better version of “Phones in class are bad.,” then press “Check my work.”",
    activity: "upgrade",
    notice:
      "The check names what to fix (a detail, an exact word, a connector) without writing the answer, and students can revise as many times as they like. It looks at words, not meaning.",
    tried: true,
    fields: [
      {
        id: "upgraded",
        type: "area",
        label: "Type the improved sentence you ended with",
        sample: "Phones in class can distract students because they stop paying attention.",
      },
      {
        id: "checkAsked",
        type: "radio",
        label: "What did the check ask for first?",
        options: [
          ["detail", "Add a detail"],
          ["word", "Use a more exact word"],
          ["connector", "Join two ideas with a connector"],
          ["none", "Nothing. All three were met."],
        ],
      },
    ],
  },
  {
    id: "connect",
    purpose: "Experience the featured speaking-to-writing lesson as a learner.",
    action: `Open the Featured Lesson, ${FEATURED_LESSON.title}, and work through it in about ${FEATURED_LESSON.minutes} minutes.`,
    route: ROUTES.lesson,
    routeLabel: "Open the Featured Lesson",
    view: "lesson-steps",
    notice: "The lesson gives one feedback cue, “Add an example,” so students know exactly what to revise.",
    tried: true,
    fields: [
      {
        id: "level",
        type: "radio",
        label: "The support level my students would start with",
        options: [
          ["more", "More support"],
          ["some", "Some support"],
          ["independent", "Greater independence"],
        ],
      },
      { id: "levelWhy", type: "text", label: "Why that level? (optional)" },
    ],
  },
  {
    id: "tomorrow",
    purpose: "Choose one activity and one class, and keep the Quick Guide.",
    action: "Choose one activity, name one class or group and when you will try it, then open the Quick Guide.",
    route: ROUTES.guide,
    routeLabel: "Open the Quick Guide",
    notice: "Start small: one activity, one class, one support. The Quick Guide holds the links and your plan.",
    fields: [
      {
        id: "pick",
        type: "radio",
        label: "My activity for tomorrow",
        options: ACTIVITIES.map((a) => [a.id, `${a.name} (${a.where})`]),
      },
      { id: "group", type: "text", label: "My class or group" },
      { id: "when", type: "text", label: "When I will try it" },
    ],
  },
];

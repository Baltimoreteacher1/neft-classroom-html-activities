// Presenter notes for the 30-minute introduction. Pure data: no DOM, no lab imports, so the on-screen presenter view,
// the printable notes (PDF, DOCX) and docs/languageos/pd-presenter-notes.md all read this one file.
//
// Pacing, routes and the five lesson steps come from data.js; nothing about an activity is retyped here except the
// words a presenter says. Every claim stays inside what data.js records: practice content is English, nothing is scored,
// recording is optional, work saves in this browser on this device, and the checks look at words and patterns.
import {
  ACTIVITY_BY_ID,
  DOWNLOADS,
  ENTRANCE,
  FACTS,
  FEATURED_LESSON,
  PRESENTER_SCHEDULE,
  ROUTES,
  absUrl,
  shortUrl,
} from "./data.js";

/** The printable downloads teachers get, by the names used in the room (files come from data.js DOWNLOADS). */
export const DOWNLOAD_NAMES = [
  { name: "Quick Guide", detail: "two pages: the 20-minute exploration and the featured lesson", ...DOWNLOADS.quickGuide },
  { name: "Featured Lesson backup", detail: "page 1 for students, page 2 for you; use it if the activity will not load", ...DOWNLOADS.lessonBackup },
];

const row = (i) => PRESENTER_SCHEDULE[i];
const lessonStepLine = FEATURED_LESSON.steps.map((s) => `${s.name} ${s.minutes}`).join(", ");

/** Six rows in the exact pacing of PRESENTER_SCHEDULE (0-3, 3-8, 8-13, 13-23, 23-27, 27-30). */
export const PRESENTER_NOTES = [
  {
    range: row(0).range,
    title: "Why we are here",
    route: ROUTES.start,
    openLabel: "Open Start Here",
    say: [
      "This is a place for students to practice speaking and writing in English, with supports they can choose.",
      "For the next half hour we will use it the way your students would. Keep one question in mind: where do my students need to speak or write more?",
    ],
    presenterDoes: [
      "Show the Start Here page on the projector. Point to the three ways in: the Guided Tour, the 20-minute exploration, and the Quick Guide.",
      `Say what is true about the lab: ${FACTS.account} Nothing is scored.`,
      "Ask teachers to pick one need: speaking or writing.",
    ],
    teachersDo: ["Silently name one speaking need or one writing need for their students."],
    watchFor:
      "Teachers who start clicking ahead on their own devices. Ask them to wait: they get 20 minutes to explore at the end.",
    backup:
      "If the page will not load, say the three ways in aloud and hold up the printed Quick Guide. Nothing later depends on this page.",
  },
  {
    range: row(1).range,
    title: "Speaking pathway",
    route: ACTIVITY_BY_ID.hallway.route,
    openLabel: `Open ${ACTIVITY_BY_ID.hallway.name}`,
    say: [
      "Here is how a speaking task looks. Students look at a picture and speak three times. We will go to the third time.",
      "First listen to the model. Then say your own answer out loud, to the person next to you.",
    ],
    presenterDoes: [
      "Open the hallway picture ladder and go to Step 3.",
      "Tap “Hear Lina first.” Let the model play once.",
      "Open “Show a sentence frame.” Read the frame aloud, then say your own answer out loud.",
      "Say that recording is optional: the microphone is asked for only when someone presses Record.",
    ],
    teachersDo: [
      "Hear the model.",
      "Say a short answer to a partner, aloud, using the frame.",
      "Notice which support they used.",
    ],
    watchFor:
      "Silence. Adults are shy about speaking. Give a partner and 30 seconds, and say any answer is fine.",
    backup:
      "No sound: read the model sentence aloud yourself from the screen. No microphones: partner talk is the whole task; no one needs to record.",
  },
  {
    range: row(2).range,
    title: "Writing pathway",
    route: ACTIVITY_BY_ID.upgrade.route,
    openLabel: `Open ${ACTIVITY_BY_ID.upgrade.name}`,
    say: [
      "Now writing. The sentence on the screen is plain: “Phones in class are bad.” Make it better using the frame.",
      "Write one sentence, press Check my work, and fix the one thing it names.",
    ],
    presenterDoes: [
      "Open the Language Upgrade Lab. Choose “Start with this help.”",
      "Read the frame aloud and write one improved sentence on the projector, or ask a volunteer to read theirs.",
      "Press “Check my work.” Read what it names, and fix one thing.",
      "Say plainly: the check looks for a detail, an exact word and a connector. It does not judge meaning.",
    ],
    teachersDo: [
      "Write one improved sentence.",
      "Press Check my work.",
      "Fix one thing the check names, then compare with a partner.",
    ],
    watchFor:
      "Teachers who treat the check as a grade. Remind them it names patterns, and students can revise as many times as they like.",
    backup:
      "Everything works typed. If the screen is too small to share, write the improved sentence on paper and read it aloud.",
  },
  {
    range: row(3).range,
    title: "The featured lesson",
    route: ROUTES.lesson,
    openLabel: "Open the Featured Lesson",
    say: [
      "Now you are the students. This is a ten-minute lesson: speak first, then write, then improve it.",
      "Follow my directions exactly as your students would.",
    ],
    presenterDoes: [
      `Open the Featured Lesson and teach the five steps as written: ${lessonStepLine} (${FEATURED_LESSON.minutes} minutes).`,
      "Notice: show the hallway picture and take two quick answers.",
      "Speak: read the prompt. Partners answer with the frame. The listener holds up one finger for the change and two for the reason.",
      "Write: two or three sentences from what they said. Home-language notes are fine first.",
      `Improve: give one cue only, “${FEATURED_LESSON.cue.replace(/[“”]/g, "")}”`,
      "Share: two or three teachers read the revised response and say what they added.",
      "Close by asking for a show of hands: change, because, for example. How many have all three?",
    ],
    teachersDo: [
      "Take part as learners. Do not take notes about the lesson yet.",
      "Speak the response to a partner, write it, add an example, and share.",
    ],
    watchFor:
      "The five steps already fill the ten minutes, so Share is also the debrief. If time runs short, ask one reader instead of three and take questions during the next row. Keep the steps in order: do not skip Speak to save time.",
    backup:
      "If the lesson will not load, hand out page 1 of the Featured Lesson backup and teach the same five steps from page 2. The lesson needs no microphone: partner talk is the speaking step.",
  },
  {
    range: row(4).range,
    title: "Adapt it and the family page",
    route: ROUTES.together,
    openLabel: "Open Practice Together",
    say: [
      "You just taught a lesson with supports. Supports fade; the task stays the same.",
      "Think about one adaptation for your own students. Then we will look at the page families can use.",
    ],
    presenterDoes: [
      "Go back to the lesson page and show the three support choices: More support, Some support, Greater independence.",
      "Name two easy adaptations: partner talk instead of recording, and home-language planning before writing in English.",
      `Open the family page (${shortUrl(ROUTES.together)}). Read the English, then tap the language control and show the Spanish. Say the Spanish is machine-written.`,
      "Say that families need no account either.",
    ],
    teachersDo: [
      "Choose one support or adaptation for a specific class.",
      "Tell a partner in one sentence what they would change.",
    ],
    watchFor:
      "Teachers asking if the activities are translated. They are not: practice stays in English. Only the instructions and the family page offer Spanish.",
    backup:
      "If the family page will not load, show the printed Quick Guide, which has the support choices on page 2, and describe the family page aloud.",
  },
  {
    range: row(5).range,
    title: "Quick Guide and your 20 minutes",
    route: ROUTES.guide,
    openLabel: "Open the Quick Guide",
    say: [
      "This is the Quick Guide. Page one is your twenty-minute plan, and page two is the lesson you just did, so you can use it alone.",
      "In a moment you will choose Speaking or Writing and begin.",
    ],
    presenterDoes: [
      "Show page 1: the timed sequence, the four activity links and the planning area.",
      "Show page 2 briefly: the same lesson, with the three support choices.",
      "Point to the Print or Save as PDF button and the Word download.",
      "Ask teachers to choose Speaking or Writing, then move to the handoff.",
    ],
    teachersDo: [
      "Choose Speaking or Writing.",
      "Open the Quick Guide on their own device or take a printed copy.",
    ],
    watchFor:
      "Teachers who want to try both pathways. Say they can do the second one later with the same guide.",
    backup:
      "If the page will not load, hand out the printed Quick Guide. Every link also prints in short form, and the QR code opens the start page.",
  },
];

/** The handoff from minute 30 into the 20-minute exploration. */
export const HANDOFF = {
  range: "30",
  title: "Handoff into the 20-minute exploration",
  route: ROUTES.explore,
  openLabel: "Open Try It. Adapt It. Use It.",
  onScreen: `The exploration page (${shortUrl(ROUTES.explore)}), with the timed sequence visible.`,
  say: [
    "You have twenty minutes. Choose Speaking or Writing, try one activity as a learner, and try one support.",
    "Then fill in the planning card for a class you really teach. In the last two minutes, write down one next step.",
    "I am here the whole time. Start now.",
  ],
  downloads:
    "Tell teachers the Quick Guide and the Featured Lesson backup are both on the start page as PDF and Word files, so they can print or edit them later.",
  chooseFocus: [
    "Speaking: choose this if your students need to say ideas aloud before they write them.",
    "Writing: choose this if your students have ideas but need clearer sentences.",
    "If unsure, choose the one you picked in the first three minutes.",
  ],
  presenterDoes: [
    "Leave the exploration page on the projector so teachers can see the clock-free sequence: choose, try, adapt, rehearse, next step.",
    "Walk the room. Ask each teacher which activity they chose and which support they are trying.",
  ],
};

/** Plans for the three things that go wrong in a meeting room. Never claim an offline mode. */
export const BACKUP_ALL = {
  audio: {
    problem: "No sound from the projector or laptop.",
    steps: [
      "Check the volume and try another browser tab first. The device voice depends on the device.",
      "Read the model aloud yourself from the screen. You are the model.",
      "Use partner talk instead of recording. Every activity can be done by reading, typing or talking with a partner.",
      FACTS.audio,
    ],
  },
  microphones: {
    problem: "No microphones, or teachers are not comfortable recording.",
    steps: [
      "Recording is optional. The microphone is requested only when a person presses Record.",
      "Say your answer to a partner and then tap “I said it out loud.” That is remembered on this device.",
      "Typing the words is always possible.",
      FACTS.microphone,
    ],
  },
  network: {
    problem: "The Wi-Fi is slow or down.",
    steps: [
      "Hand out the printed Featured Lesson backup (page 1 is the student page) and the Quick Guide PDF or printout.",
      "Say the activity aloud: Notice, Speak, Write, Improve, Share. The steps and directions are on page 2 of the backup.",
      "Partner talk and paper replace every screen step. Nothing in this plan needs the site to load.",
      `Bring the printouts to every session. The start page is ${ENTRANCE.short}, and it links to everything.`,
    ],
  },
};

/** What to do before the room fills. */
export const ROOM_SETUP = [
  `Open ${ENTRANCE.short} on the projector as the only tab teachers see. Keep the other tabs closed.`,
  "Test the sound once: open the hallway ladder, tap “Hear Lina first,” and set the volume. Then go back to Start Here.",
  `Have these ready to open in order, each after ${shortUrl("")}: ${[ACTIVITY_BY_ID.hallway.route, ACTIVITY_BY_ID.upgrade.route, ROUTES.lesson, ROUTES.together, ROUTES.guide, ROUTES.explore].join(", ")}.`,
  `Print the downloads: ${DOWNLOAD_NAMES.map((d) => d.name).join(", ")}. Print the Quick Guide for each teacher, plus two spares, and two copies of the Featured Lesson backup.`,
  `Show the one QR code (it opens ${ENTRANCE.short}) on the projector or the door. It links to everything.`,
  "Close other apps that play sound. Have a pen and paper for each pair for the lesson.",
];

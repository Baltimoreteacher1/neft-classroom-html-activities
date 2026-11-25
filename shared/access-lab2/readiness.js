// Readiness skills checklist (data). Kid-language steps for the things a student does on a computer practice test:
// sound, response types, typing, a word-list tool, calming, and what test day is like. Deliberately generic: it does
// not claim to look or behave like any specific test platform. Paper-and-pencil only where a tool is not needed.
import { allStrings, isObj, isStr } from "./constants.js";

export const READINESS_CHECKLIST = Object.freeze([
  {
    id: "headset-mic-check",
    area: "sound",
    title: "Headset and microphone check",
    kidText: "Put on your headset. Say hello and listen back. Can you hear yourself clearly?",
    steps: [
      "Put on your headset.",
      "Record yourself saying your alias and one short sentence.",
      "Play it back.",
      "Tell your teacher if it is too quiet or too loud.",
    ],
    doneWhen: "I can hear my own voice clearly when I play it back.",
    minutes: 5,
  },
  {
    id: "volume-check",
    area: "sound",
    title: "Volume check",
    kidText: "Play the sample sound. Move the volume until it is comfortable for you.",
    steps: [
      "Play the sample sound.",
      "Turn the volume up or down.",
      "Play it once more.",
      "Stop when the voice is easy to understand and not too loud.",
    ],
    doneWhen: "I know how to change the volume myself.",
    minutes: 3,
  },
  {
    id: "practice-select",
    area: "responses",
    title: "Practice: pick an answer",
    kidText: "Click or tap one answer. Change your mind, then pick again.",
    steps: [
      "Read the question.",
      "Click or tap one answer.",
      "Click or tap a different answer to change it.",
      "Press Next when you are ready.",
    ],
    doneWhen: "I can pick an answer and change it.",
    minutes: 5,
  },
  {
    id: "practice-drag",
    area: "responses",
    title: "Practice: drag and sort",
    kidText: "Drag each card into the right box. If you drop it in the wrong place, drag it again.",
    steps: [
      "Pick up a card.",
      "Drag it to a box.",
      "Drop it.",
      "Move it again if you want to change it.",
    ],
    doneWhen: "I can drag a card and move it to a different box.",
    minutes: 5,
  },
  {
    id: "practice-order",
    area: "responses",
    title: "Practice: put in order",
    kidText: "Put the steps in order from first to last. You can move a step up or down.",
    steps: [
      "Read all the steps first.",
      "Find the first step and put it at the top.",
      "Move the rest into order.",
      "Read them again from top to bottom.",
    ],
    doneWhen: "I can put steps in order and fix them.",
    minutes: 5,
  },
  {
    id: "practice-record",
    area: "responses",
    title: "Practice: record your answer",
    kidText:
      "Press record, speak, press stop, then listen. You can record again. Your recording stays on this device.",
    steps: [
      "Think about what you will say.",
      "Press record and speak.",
      "Press stop.",
      "Listen back. Record again if you want to.",
    ],
    doneWhen: "I can record, listen back, and record again.",
    minutes: 5,
  },
  {
    id: "keyboard-writing",
    area: "typing",
    title: "Keyboard writing",
    kidText:
      "Type two or three sentences. Use the backspace key to fix a mistake. Read your writing out loud.",
    steps: [
      "Type a sentence about your day.",
      "Use backspace to fix a mistake.",
      "Start each sentence with a capital letter and end it with a period.",
      "Read your writing out loud.",
    ],
    doneWhen: "I can type sentences and fix mistakes without help.",
    minutes: 8,
  },
  {
    id: "glossary-tool",
    area: "tools",
    title: "Using a word-list tool",
    kidText:
      "Look up a word in the word list. Read what it means. Then use the word in a sentence.",
    steps: [
      "Pick a word you are not sure about.",
      "Find it in the word list.",
      "Read the meaning.",
      "Say a sentence with the word.",
    ],
    doneWhen: "I can find a word and use what it means.",
    minutes: 5,
  },
  {
    id: "calming-routine",
    area: "calm",
    title: "My calming routine",
    kidText:
      "Breathe in slowly for four counts. Breathe out slowly for four counts. Do it three times.",
    steps: [
      "Sit comfortably with your feet on the floor.",
      "Breathe in slowly and count to four.",
      "Breathe out slowly and count to four.",
      "Do this three times.",
    ],
    doneWhen: "I have a calming routine I can do by myself.",
    minutes: 3,
  },
  {
    id: "test-day-expectations",
    area: "test-day",
    title: "What test day is like",
    kidText:
      "You will use a computer and a headset. You will listen, read, speak and write. It is okay to ask for help with the computer. Just do your best.",
    steps: [
      "Listen to your teacher explain the day.",
      "Ask any questions you have.",
      "Practice your calming routine.",
      "Remember: just do your best.",
    ],
    doneWhen: "I know what will happen and who to ask for help.",
    minutes: 5,
  },
]);

export const READINESS_IDS = Object.freeze(READINESS_CHECKLIST.map((r) => r.id));

// The checklist must stay generic and paper-and-pencil: no manipulatives and no platform-mimicry claims.
const MANIPULATIVE_RE = /\b(manipulatives?|cubes?|counters?|tiles?|beads?)\b/i;
const MIMIC_RE =
  /\b(exactly like|looks? like|same as|just like|mimics?)\b[^.]*\b(test|access|drc|insight|wida)\b/i;

export function validateReadiness(list = READINESS_CHECKLIST) {
  const errors = [];
  const seen = new Set();
  for (const r of list) {
    const at = isObj(r) && isStr(r.id) ? r.id : "?";
    if (
      !isObj(r) ||
      !isStr(r.id) ||
      !isStr(r.area) ||
      !isStr(r.title) ||
      !isStr(r.kidText) ||
      !isStr(r.doneWhen)
    )
      errors.push(`${at}: id, area, title, kidText and doneWhen required`);
    else if (seen.has(r.id)) errors.push(`${at}: duplicate id`);
    else seen.add(r.id);
    if (!Array.isArray(r?.steps) || r.steps.length < 3 || !r.steps.every(isStr))
      errors.push(`${at}: at least three steps required`);
    if (!Number.isInteger(r?.minutes) || r.minutes < 1 || r.minutes > 10)
      errors.push(`${at}: minutes must be 1 to 10`);
    for (const t of allStrings(r)) {
      if (MANIPULATIVE_RE.test(t)) errors.push(`${at}: manipulative wording: "${t}"`);
      if (MIMIC_RE.test(t)) errors.push(`${at}: must not claim to mimic a test platform: "${t}"`);
    }
  }
  return errors;
}

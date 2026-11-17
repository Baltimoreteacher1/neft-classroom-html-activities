// Lesson Builder: the week plan, quick starts and the student page. Pure, no DOM (tools/lesson-builder-week.test.mjs).
//
// A week is five days built from the same settings as one lesson:
//   every day   warm-up (Daily Language Warm-Up) · core activity · choice time on the Language Choice Board for the
//               function's Key Language Use · exit ticket · a Talk Table question to take home (English and Spanish)
//   focus       the teacher's domains in turn (Mon = first domain, Tue = second, …), so each one gets its own day
//   core        the best real lab activity for that day's domain (same ranking as a lesson; never repeated in the week)
//   Friday      everyone does the board's Create square, then shares; the core activity is a second try of Monday's
// Quick starts are complete settings a teacher can build from in one tap. The student page is one printable sheet:
// objectives, word bank, the profile's frames, one step easier and one step harder, the exit ticket and the home talk.
import { deckFor } from "../lang/boards.js";
import { candidatesFor, normalizeSettings, objectivesFor } from "./assemble.js";
import { FUNCTIONS, HOOKS, SUPPORT_KEYS } from "./rules.js";

export const WEEK_DAYS = [
  ["Monday", "lunes"],
  ["Tuesday", "martes"],
  ["Wednesday", "miércoles"],
  ["Thursday", "jueves"],
  ["Friday", "viernes"],
];
export const WEEK_MINUTES = { warmup: 5, core: 15, choice: 10, exit: 3 };

/** One-tap lesson settings. Every one passes normalizeSettings unchanged (the test checks). */
export const QUICK_STARTS = [
  {
    id: "newcomer-talk",
    name: ["Newcomer talk", "Conversación para recién llegados"],
    note: ["20 min · listen and speak · most support", "20 min · escuchar y hablar · más apoyo"],
    settings: {
      domains: ["Listening", "Speaking"],
      fn: "describe",
      support: "A",
      minutes: 20,
      topic: "",
    },
  },
  {
    id: "explain-evidence",
    name: ["Explain with evidence", "Explicar con evidencia"],
    note: ["30 min · read and write · some support", "30 min · leer y escribir · algo de apoyo"],
    settings: {
      domains: ["Reading", "Writing"],
      fn: "explain",
      support: "B",
      minutes: 30,
      topic: "science",
    },
  },
  {
    id: "argue-debate",
    name: ["Take a side", "Tomar una postura"],
    note: [
      "45 min · all four skills · less support",
      "45 min · las cuatro destrezas · menos apoyo",
    ],
    settings: {
      domains: ["Listening", "Reading", "Speaking", "Writing"],
      fn: "argue",
      support: "C",
      minutes: 45,
      topic: "",
    },
  },
  {
    id: "small-group",
    name: ["Small-group reteach", "Repaso en grupo pequeño"],
    note: ["10 min · read · most support", "10 min · leer · más apoyo"],
    settings: { domains: ["Reading"], fn: "sequence", support: "A", minutes: 10, topic: "" },
  },
];

export const quickStart = (id, band) => {
  const q = QUICK_STARTS.find((x) => x.id === id);
  return q ? normalizeSettings({ ...q.settings, band }) : null;
};

/** The Talk Table cards for the lesson's Key Language Use, in deck order. */
export function homeTalkCards(talk, settings) {
  return deckFor(talk, settings.band, FUNCTIONS[settings.fn].klu);
}

/** Five days from the lesson settings, real activity rows, and the Talk Table content (may be null). */
export function assembleWeek(rawSettings, rows = [], talk = null) {
  const settings = normalizeSettings(rawSettings);
  const fn = FUNCTIONS[settings.fn];
  const frames = fn.frames[settings.support];
  const cards = talk ? homeTalkCards(talk, settings) : [];
  const used = new Set();
  const days = WEEK_DAYS.map((name, d) => {
    const friday = d === 4;
    const focus = settings.domains[d % settings.domains.length];
    let activityId = null;
    if (!friday) {
      const row = candidatesFor(
        rows,
        { ...settings, domains: [focus] },
        "guided",
        WEEK_MINUTES.core,
        used,
      )[0];
      if (row) {
        activityId = row.id;
        used.add(row.id);
      }
    }
    return {
      name,
      focus: friday ? null : focus,
      activityId,
      choice: friday
        ? "Everyone does the Create square in the middle of the board, then shares it with a partner or the class."
        : `Students pick one square on the ${fn.klu} board. By Friday, each student aims for three in a row.`,
      exit: `${HOOKS[settings.fn]} Use: "${frames[frames.length - 1]}"`,
      talk: cards.length ? cards[d % cards.length] : null,
    };
  });
  // Friday's core: a second try of Monday's activity (rule: revisit, do not add something new on share day).
  days[4].activityId = days[0].activityId;
  return { settings, klu: fn.klu, objectives: objectivesFor(settings, rows, days), days };
}

/** Frames one step easier and one step harder than the profile, for the student page ("Need more help?" / "Ready for more?"). */
export function framesAround(settings) {
  const fn = FUNCTIONS[settings.fn];
  const i = SUPPORT_KEYS.indexOf(settings.support);
  return {
    mine: fn.frames[settings.support],
    easier: i > 0 ? fn.frames[SUPPORT_KEYS[i - 1]] : null,
    harder: i < SUPPORT_KEYS.length - 1 ? fn.frames[SUPPORT_KEYS[i + 1]] : null,
  };
}

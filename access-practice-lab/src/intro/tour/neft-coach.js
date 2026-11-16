// Mr. Neft as an active coach on the Teacher Tour: he reacts to what the teacher just did (one short line in his
// bubble, read by screen readers through its polite live region) and, when a screen sits still, nudges toward the
// next useful action and points at it. Deterministic, authored lines only; no AI call, nothing stored.

const DOMAIN = {
  listening: "Listening",
  reading: "Reading",
  speaking: "Speaking",
  writing: "Writing",
};

const SEQ = {
  introduce: "The Introduce part: you model the language first, so nobody starts cold.",
  practice:
    "Practice: this is where the online activity lives. Students try, get feedback and try again.",
};

/** One reaction line for a tour action, or "" when the action needs no comment. */
export function neftReact(act, value = "", field = "") {
  switch (act) {
    case "peek": {
      const d = DOMAIN[value];
      return d
        ? `${d} — good place to look. Open the example to see one real item, then pick the skill you want to use first.`
        : "Take your time with the example. When you’ve seen enough, press Continue.";
    }
    case "set":
      if (field === "band" || /grade/i.test(field))
        return value === "3-5"
          ? "Grades 3–5: I’ll show shorter texts and bigger buttons."
          : "Grades 6–8: I’ll show longer texts and more academic language.";
      if (/support|level/i.test(field))
        return "Watch the screen: the task stays the same, only the help around it changes. That’s the point.";
      if (/domain|skill|tab/i.test(field))
        return "Got it. I’ve lined up activities for that skill.";
      return "Got it. I updated your choices.";
    case "preview":
      return "This is exactly what a student sees. Try one answer yourself, then close the preview.";
    case "close-preview":
      return "If that one fits your class, press “Use this” and I’ll build around it.";
    case "use-pick":
      return "Great pick! It’s in your first lesson now. Press Continue and I’ll show you where it fits.";
    case "seq":
      return (
        SEQ[value] ||
        "Each part is short. Click through them; the online activity is only one piece of the lesson."
      );
    case "copy-link":
      return "Copied. Paste it into Canvas or Google Classroom. Students open it with no account and no sign-in.";
    case "download-pdf":
    case "download-docx":
      return "Your file is downloading. It’s yours to edit and print.";
    case "copy-plan":
      return "Lesson plan copied. Paste it into your planner.";
    case "print-card":
      return "Print the card and post it by the board, so students know where to go.";
    case "kit-tab":
      return "Everything for tomorrow is in these tabs: the plan, the link and the printables.";
    default:
      return "";
  }
}

/** The line Mr. Neft says when a screen sits still. */
export const NUDGE = {
  welcome:
    "Not sure where to start? Open any card’s example. Listening is a quick one. Then press Continue.",
  experience:
    "Try one question as if you were a student. Getting one wrong on purpose shows you the feedback.",
  support:
    "Switch between the three support levels and compare. Then press Continue. I’ll be right here.",
  implement:
    "Pick your grades and a skill, then press Preview on any result to see it the student’s way.",
  prepare: "Click each part of the lesson to see what you would say. Continue when you’re ready.",
  studio: "Confirm your choices and press Generate. I’ll put the lesson together for you.",
  kit: "Download the kit or copy the student link. That’s everything you need for tomorrow.",
  gate: "Pick up where you stopped, or start fresh. Either one is fine.",
};

export const NUDGE_AFTER_MS = 25000;

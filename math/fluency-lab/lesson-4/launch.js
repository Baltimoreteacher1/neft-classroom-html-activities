// The one place app.js touches the mini-lesson: open it inside the Learn panel, record its results as supported
// evidence, and put the Learn page back when it closes. launchMiniLesson returns the cleanup app.js stores.
import { mountMiniLesson } from "../mini-lesson.js";

export const miniLessonRequested = (search) => new URLSearchParams(search).get("mini") === "1";

// onEvidence({ correct, independent: false }) records supported (never independent) evidence; restore() redraws Learn.
export function launchMiniLesson({ host, skill, onEvidence, restore }) {
  let closed = false;
  let handle = null;
  const close = () => {
    if (closed) return;
    closed = true;
    handle?.destroy();
    restore();
  };
  handle = mountMiniLesson(host, { skill, grade: skill.grade, onEvidence, onExit: close });
  return close;
}

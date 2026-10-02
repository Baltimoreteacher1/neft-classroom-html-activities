import { isScormLaunch } from "./scorm-bridge.js";

const navStyles = new URL("../styles/curriculum-nav.css", import.meta.url);
let sequencePromise;
function loadSequence() {
  if (!sequencePromise) {
    sequencePromise = fetch("/assets/curriculum-lesson-sequence.json")
      .then((response) => {
        if (!response.ok) throw new Error("Lesson sequence unavailable");
        return response.json();
      })
      .catch(() => null);
  }
  return sequencePromise;
}

/** Course navigation lives with the lesson, including its initial name screen.
 * It is omitted inside LMS/embedded launches so students stay in their course. */
export function createLessonCourseNav(config) {
  const match = /^(\d+)-(\d+)(?:-[a-z0-9]+)?$/.exec(String(config.lessonId || ""));
  const params = new URLSearchParams(window.location.search);
  if (!match || isScormLaunch() || params.get("embed") === "1" || window.self !== window.top)
    return null;
  const unit = Number(config.unit);
  if (!Number.isInteger(unit) || unit < 1 || unit > 10) return null;
  if (!document.querySelector("link[data-lesson-course-nav]")) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = navStyles.href;
    stylesheet.dataset.lessonCourseNav = "";
    document.head.append(stylesheet);
  }
  const nav = document.createElement("nav");
  nav.className = "lesson-course-nav";
  nav.setAttribute("aria-label", "Curriculum and lesson sequence");
  const back = document.createElement("a");
  back.href = `/curriculum/units/?u=${unit}&l=${encodeURIComponent(config.lessonId)}#unit-${unit}`;
  back.textContent = `Back to Unit ${unit}`;
  const current = document.createElement("span");
  current.textContent = `Lesson ${match[1]}.${match[2]}`;
  current.setAttribute("aria-current", "page");
  nav.append(back, current);
  loadSequence().then((sequence) => {
    if (!Array.isArray(sequence)) return;
    const lessons = sequence.filter((item) => item.unit === unit && /^\d+-\d+$/.test(item.id));
    const index = lessons.findIndex((item) => item.id === `${match[1]}-${match[2]}`);
    if (index < 0) return;
    const links = document.createElement("div");
    links.className = "lesson-course-nav__sequence";
    /** @type {[number, string][]} */
    const steps = [
      [-1, "Previous lesson"],
      [1, "Next lesson"],
    ];
    for (const [offset, label] of steps) {
      const lesson = lessons[index + offset];
      if (!lesson) continue;
      const link = document.createElement("a");
      link.href = `/lessons/${lesson.id}/?student=1`;
      link.textContent = label;
      link.setAttribute("aria-label", `${label}: ${lesson.id.replace("-", ".")} ${lesson.title}`);
      links.append(link);
    }
    nav.append(links);
  });
  return nav;
}

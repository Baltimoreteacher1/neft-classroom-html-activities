import { DAYS, normalizeLessons } from "./model.js";
import { addDays, weekPhase } from "./homework-hub.js";

export function publicationChecks(snapshot, inputLessons = null, now = new Date()) {
  const lessons = inputLessons === null ? null : new Map(normalizeLessons(inputLessons).map((l) => [l.id, l]));
  return (snapshot?.sections || []).filter((s) => s.visible !== false).map((section) => {
    const week = section.week || {};
    const phase = weekPhase(week.startDate, now);
    const errors = [];
    const warnings = [];
    const assigned = (week.days || []).filter((d) => d.status === "lesson");
    const pending = DAYS.filter((day) => {
      const entry = week.days?.find((d) => d.day === day);
      return !entry || entry.status === "pending";
    });
    if ((assigned.length || week.startDate) && (phase === "empty" || new Date(`${week.startDate}T12:00:00Z`).getUTCDay() !== 1)) {
      errors.push("Choose a valid Monday for the week beginning.");
    }
    if (phase === "empty") warnings.push("No dated plan: families will see that homework has not been posted yet.");
    if (phase === "past") warnings.push("These dates have passed. This plan will be available as previous homework.");
    if (phase === "upcoming") warnings.push("Upcoming plan: any current published week stays available until these dates begin.");
    if (pending.length && phase !== "empty") warnings.push(`Not posted yet: ${pending.join(", ")}. Choose a lesson or explicitly mark no homework.`);
    for (const entry of assigned) {
      const lesson = lessons?.get(entry.lessonId);
      if (snapshot.homeworkOverrides?.[entry.lessonId]?.visible === false || (lessons && !lesson)) {
        errors.push(`${entry.day}: Lesson ${entry.lessonId} has no available family homework link.`);
      }
      if (lesson && !/^\/lessons\/\d{1,2}-\d{1,2}(?:-flagship)?\/homework(?:\.html)?\/?$/.test(lesson.homeworkPath)) {
        errors.push(`${entry.day}: Lesson ${entry.lessonId} has an unsupported homework link.`);
      }
      const date = addDays(week.startDate, DAYS.indexOf(entry.day));
      if (entry.dueDate && (addDays(entry.dueDate, 0) !== entry.dueDate || (date && entry.dueDate < date))) {
        errors.push(`${entry.day}: The due date must be valid and cannot precede the assignment date.`);
      }
    }
    return { sectionId: section.id, label: section.label, startDate: week.startDate || "", assigned: assigned.length, errors, warnings };
  });
}

export function renderPublicationChecks(root, checks) {
  root.replaceChildren();
  const heading = document.createElement("h2");
  heading.textContent = "Before publishing · all classes";
  root.append(heading);
  const intro = document.createElement("p");
  intro.textContent = "Review each class below. Fix errors before publishing; check warnings for missing or outdated plans.";
  root.append(intro);
  for (const check of checks) {
    const row = document.createElement("section");
    row.className = "publication-check-row";
    const title = document.createElement("h3");
    title.textContent = `${check.label} · ${check.startDate || "No week selected"} · ${check.assigned} assignment${check.assigned === 1 ? "" : "s"}`;
    row.append(title);
    for (const [messages, kind] of [[check.errors, "error"], [check.warnings, "warning"]]) {
      for (const message of messages) {
        const text = document.createElement("p");
        text.className = `publication-${kind}`;
        text.textContent = `${kind === "error" ? "Fix" : "Check"}: ${message}`;
        row.append(text);
      }
    }
    if (!check.errors.length && !check.warnings.length) {
      const ready = document.createElement("p");
      ready.textContent = "Ready for family preview.";
      row.append(ready);
    }
    root.append(row);
  }
  root.hidden = false;
}

// Check the actual assigned pages immediately before publication, rather than
// trusting a manifest flag alone. Only same-site homework routes are requested.
export async function homeworkLinkErrors(snapshot, inputLessons, fetchImpl = fetch) {
  const lessons = new Map(normalizeLessons(inputLessons).map((lesson) => [lesson.id, lesson]));
  const requests = new Map();
  const assignments = [];
  for (const section of (snapshot.sections || []).filter((item) => item.visible !== false)) {
    for (const entry of section.week?.days || []) {
      if (entry.status !== "lesson") continue;
      const path = lessons.get(entry.lessonId)?.homeworkPath;
      if (!/^\/lessons\/\d{1,2}-\d{1,2}(?:-flagship)?\/homework(?:\.html)?\/?$/.test(path || "")) continue;
      assignments.push({ sectionId: section.id, day: entry.day, path });
      if (!requests.has(path)) requests.set(path, fetchImpl(path, {
        method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(10000),
      }).then((response) => response.ok).catch(() => false));
    }
  }
  const available = new Map(await Promise.all([...requests].map(async ([path, response]) => [path, await response])));
  return assignments.filter((entry) => !available.get(entry.path)).map((entry) => ({
    sectionId: entry.sectionId, message: `${entry.day}: The homework page could not be opened. Check the link or connection and try again.`,
  }));
}

export function addHomeworkLinkErrors(checks, errors) {
  for (const error of errors) checks.find((check) => check.sectionId === error.sectionId)?.errors.push(error.message);
  return checks;
}

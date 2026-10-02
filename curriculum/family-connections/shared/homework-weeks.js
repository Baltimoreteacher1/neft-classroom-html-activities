import { DAYS, resolveSection } from "./model.js";
import { addDays, weekPhase } from "./homework-hub.js";

// Only homework that was published for a currently visible class can enter the
// public archive. Never return draft state, integrations, or teacher history.
export function publicHomeworkWeeks(published, history = []) {
  const visible = new Set((published?.sections || []).filter((s) => s.visible !== false).map((s) => s.id));
  const seen = new Set();
  const weeks = [];
  for (const snapshot of [published, ...history]) {
    if (!snapshot?.publishedAt) continue;
    for (const section of snapshot.sections || []) {
      const start = section.week?.startDate;
      const key = `${section.id}:${start}`;
      if (!visible.has(section.id) || section.visible === false || weekPhase(start) === "empty" || seen.has(key)) continue;
      seen.add(key);
      const overrides = {};
      const days = DAYS.map((day) => {
        const entry = section.week.days?.find((item) => item.day === day);
        const id = entry?.status === "lesson" ? entry.lessonId || "" : "";
        const override = snapshot.homeworkOverrides?.[id];
        if (id && override) overrides[id] = {
          visible: override.visible !== false,
          title: override.title || "",
          titleEs: override.titleEs || "",
        };
        return {
          day, status: entry?.status || "pending", lessonId: id,
          note: entry?.note || "", noteEs: entry?.noteEs || "", dueDate: entry?.dueDate || "",
        };
      });
      weeks.push({
        sectionId: section.id,
        publishedAt: snapshot.publishedAt,
        week: { startDate: start, note: section.week.note || "", noteEs: section.week.noteEs || "", days },
        homeworkOverrides: overrides,
      });
    }
  }
  return weeks;
}

export function weeksForSection(weeks, sectionId) {
  return (weeks || []).filter((item) => item.sectionId === sectionId)
    .sort((a, b) => b.week.startDate.localeCompare(a.week.startDate));
}

export function defaultHomeworkWeek(weeks, now = new Date()) {
  return weeks.find((item) => weekPhase(item.week.startDate, now) === "current")
    || [...weeks].reverse().find((item) => weekPhase(item.week.startDate, now) === "upcoming")
    || null;
}

export function snapshotForWeek(snapshot, record) {
  if (!record) return snapshot;
  const section = resolveSection(snapshot, record.sectionId);
  return {
    ...snapshot, publishedAt: record.publishedAt,
    sections: [{ ...section, week: record.week }],
    homeworkOverrides: record.homeworkOverrides,
  };
}

export function homeworkWeekLabel(start, lang = "en") {
  const format = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  return `${format.format(new Date(`${start}T12:00:00Z`))} – ${format.format(new Date(`${addDays(start, 4)}T12:00:00Z`))}`;
}

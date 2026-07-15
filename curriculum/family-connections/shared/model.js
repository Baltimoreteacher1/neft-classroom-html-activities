export const DAYS = Object.freeze(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
export const WEEK_STATUSES = Object.freeze(["lesson", "review", "assessment", "no-class"]);
export const SNAPSHOT_SCHEMA_VERSION = 1;
export const PUBLIC_ORIGIN = "https://eduwonderlab.com";

const DEFAULT_DIRECTIONS =
  "Ask your student to show one strategy. Celebrate the thinking, even when the answer needs another try.";
const SCHOOL_ALTERNATIVE =
  "A student may complete the same reflection with a teacher or trusted adult at school.";

const cleanText = (value, maximum = 500) => String(value ?? "").trim().slice(0, maximum);

export function createDefaultSnapshot() {
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    revision: 0,
    publishedAt: null,
    sections: [
      {
        id: "all-families",
        label: "All Families",
        visible: true,
        isDefault: true,
        week: {
          label: "This Week",
          startDate: "",
          note: "Check back for this week's lesson plan and family practice.",
          days: DAYS.map((day) => ({ day, status: "no-class", lessonId: "", note: "" })),
        },
      },
    ],
    homeworkOverrides: {},
    announcements: [],
    resources: [
      {
        id: "ai-family-guide",
        title: "AI Learning Guide for Families",
        description: "Use AI as a coach that explains, asks questions, and protects student thinking.",
        url: "/curriculum/ai-hub/#parents",
        visible: true,
      },
    ],
    integrations: { classDojoUrl: "https://www.classdojo.com/", canvasUrl: "" },
  };
}

function lessonNumber(lesson) {
  const unit = Number(lesson?.unit ?? String(lesson?.id ?? "").split("-")[0]);
  const number = Number(lesson?.lesson ?? String(lesson?.id ?? "").split("-")[1]);
  return [Number.isFinite(unit) ? unit : 999, Number.isFinite(number) ? number : 999];
}

export function normalizeLessons(input) {
  const lessons = Array.isArray(input) ? input : [];
  const byId = new Map();
  for (const raw of lessons) {
    const id = cleanText(raw?.id, 20);
    const hasHomework = Boolean(raw?.homeworkPath || raw?.resources?.homework?.exists);
    if (!/^\d{1,2}-\d{1,2}(?:-flagship)?$/.test(id) || !hasHomework) continue;
    const [unit, lesson] = lessonNumber(raw);
    byId.set(id, {
      id,
      unit,
      lesson,
      title: cleanText(raw.title, 120) || `Lesson ${id}`,
      objective: cleanText(raw.objective, 320),
      languageObjective: cleanText(raw.languageObjective, 320),
      standard: cleanText(raw.standard, 40),
      lessonPath: cleanText(raw.lessonPath || raw.resources?.lesson?.path, 240) || `/lessons/${id}/`,
      homeworkPath:
        cleanText(raw.homeworkPath || raw.resources?.homework?.path, 240) ||
        `/lessons/${id}/homework.html`,
      familyPath: raw.resources?.familyPage?.exists
        ? cleanText(raw.resources.familyPage.path, 240)
        : "",
      vocabulary: Array.isArray(raw.supports?.vocabulary)
        ? raw.supports.vocabulary.map((word) => cleanText(word, 60)).filter(Boolean).slice(0, 10)
        : [],
      sentenceFrames: Array.isArray(raw.supports?.sentenceFrames)
        ? raw.supports.sentenceFrames.map((frame) => cleanText(frame, 140)).filter(Boolean).slice(0, 4)
        : [],
    });
  }
  return [...byId.values()].sort((a, b) => a.unit - b.unit || a.lesson - b.lesson);
}

function normalizeSupplementalLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link, index) => ({
      id: cleanText(link?.id, 40) || `link-${index + 1}`,
      label: cleanText(link?.label, 80),
      url: cleanText(link?.url, 400),
    }))
    .filter((link) => link.label && safeExternalUrl(link.url))
    .slice(0, 5);
}

export function mergeHomework(inputLessons, overrides = {}) {
  return normalizeLessons(inputLessons)
    .filter((lesson) => overrides?.[lesson.id]?.visible !== false)
    .map((lesson) => {
      const override = overrides?.[lesson.id] ?? {};
      return {
        ...lesson,
        title: cleanText(override.title, 120) || lesson.title,
        directions: cleanText(override.directions, 600) || DEFAULT_DIRECTIONS,
        estimatedTime: cleanText(override.estimatedTime, 40) || "15-20 minutes",
        materials: cleanText(override.materials, 180) || "Paper, pencil, and lesson notes",
        languageSupport:
          cleanText(override.languageSupport, 500) ||
          lesson.sentenceFrames[0] ||
          "Sentence frame: I solved ___ by ___.",
        schoolAlternative: SCHOOL_ALTERNATIVE,
        supplementalLinks: normalizeSupplementalLinks(override.supplementalLinks),
      };
    });
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function absolutePublicUrl(path) {
  return new URL(path, PUBLIC_ORIGIN).href;
}

export function resolveSection(snapshot, sectionId) {
  const visible = (snapshot?.sections ?? []).filter((section) => section.visible !== false);
  return (
    visible.find((section) => section.id === sectionId) ??
    visible.find((section) => section.isDefault) ??
    visible[0] ??
    createDefaultSnapshot().sections[0]
  );
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character],
  );
}

function lessonMap(lessons) {
  return new Map(normalizeLessons(lessons).map((lesson) => [lesson.id, lesson]));
}

export function buildCanvasModuleLinks(snapshot, lessons, sectionId) {
  const section = resolveSection(snapshot, sectionId);
  const byId = lessonMap(lessons);
  return (section.week?.days ?? [])
    .filter((entry) => entry.status === "lesson" && byId.has(entry.lessonId))
    .map((entry) => {
      const lesson = byId.get(entry.lessonId);
      return {
        day: entry.day,
        lessonId: lesson.id,
        title: `Lesson ${lesson.id} · ${lesson.title}`,
        lessonUrl: absolutePublicUrl(lesson.lessonPath),
        homeworkUrl: absolutePublicUrl(lesson.homeworkPath),
      };
    });
}

export function buildCanvasAnnouncement(snapshot, lessons, sectionId) {
  const section = resolveSection(snapshot, sectionId);
  const links = buildCanvasModuleLinks(snapshot, lessons, section.id);
  const weekLabel = cleanText(section.week?.label, 80) || "This Week";
  const note = cleanText(section.week?.note, 500);
  const textLines = [weekLabel, section.label, note, "", ...links.map((link) => `${link.day}: ${link.title}\nHomework: ${link.homeworkUrl}`)].filter(
    (line, index, array) => line || (index > 0 && array[index - 1]),
  );
  const htmlItems = links
    .map(
      (link) =>
        `<li><strong>${escapeHtml(link.day)}:</strong> <a href="${escapeHtml(link.lessonUrl)}">${escapeHtml(link.title)}</a> · <a href="${escapeHtml(link.homeworkUrl)}">Family homework</a></li>`,
    )
    .join("");
  return {
    text: textLines.join("\n").trim(),
    html: `<h2>${escapeHtml(weekLabel)}</h2><p><strong>${escapeHtml(section.label)}</strong></p>${note ? `<p>${escapeHtml(note)}</p>` : ""}<ul>${htmlItems}</ul>`,
  };
}

export function buildCanvasExport(snapshot, lessons, sectionId) {
  const section = resolveSection(snapshot, sectionId);
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    platform: "canvas-ready",
    source: PUBLIC_ORIGIN,
    revision: Number(snapshot?.revision) || 0,
    publishedAt: snapshot?.publishedAt ?? null,
    sections: [
      {
        id: section.id,
        label: section.label,
        week: section.week,
        moduleLinks: buildCanvasModuleLinks(snapshot, lessons, section.id),
      },
    ],
    announcement: buildCanvasAnnouncement(snapshot, lessons, section.id),
  };
}

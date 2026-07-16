export const DAYS = Object.freeze(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
export const WEEK_STATUSES = Object.freeze(["lesson", "review", "assessment", "no-class"]);
export const SNAPSHOT_SCHEMA_VERSION = 1;
export const PUBLIC_ORIGIN = "https://eduwonderlab.com";

const DEFAULT_DIRECTIONS =
  "Ask your student to show one strategy. Celebrate the thinking, even when the answer needs another try.";
const SCHOOL_ALTERNATIVE =
  "A student may complete the same reflection with a teacher or trusted adult at school.";
const OPTIONAL_PRACTICE_NOTE =
  "Optional family practice is separate from regular homework. Use it only when it works for your family; it is never graded.";

const cleanText = (value, maximum = 500) =>
  String(value ?? "")
    .trim()
    .slice(0, maximum);

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
          note: "Check back for this week's lesson plan and optional family practice.",
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
        description:
          "Use AI as a coach that explains, asks questions, and protects student thinking.",
        url: "/curriculum/ai-hub/#parents",
        visible: true,
      },
    ],
    integrations: { classDojoUrl: "https://www.classdojo.com/", canvasUrl: "" },
    copy: { en: {}, es: {} },
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
      lessonPath:
        cleanText(raw.lessonPath || raw.resources?.lesson?.path, 240) || `/lessons/${id}/`,
      homeworkPath:
        cleanText(raw.homeworkPath || raw.resources?.homework?.path, 240) ||
        `/lessons/${id}/homework.html`,
      familyPath: raw.resources?.familyPage?.exists
        ? cleanText(raw.resources.familyPage.path, 240)
        : "",
      vocabulary: Array.isArray(raw.supports?.vocabulary)
        ? raw.supports.vocabulary
            .map((word) => cleanText(word, 60))
            .filter(Boolean)
            .slice(0, 10)
        : [],
      sentenceFrames: Array.isArray(raw.supports?.sentenceFrames)
        ? raw.supports.sentenceFrames
            .map((frame) => cleanText(frame, 140))
            .filter(Boolean)
            .slice(0, 4)
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

export function parseCanvasCourseUrl(value) {
  try {
    const url = new URL(String(value ?? "").trim());
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return null;
    const match = url.pathname.match(/^(.*?\/courses\/(\d+))(?:\/.*)?$/);
    if (!match) return null;
    const coursePath = match[1].replace(/\/+$/, "");
    const courseUrl = `${url.origin}${coursePath}/`;
    return {
      courseId: match[2],
      courseUrl,
      host: url.hostname,
      announcementsUrl: `${courseUrl}announcements`,
      modulesUrl: `${courseUrl}modules`,
    };
  } catch {
    return null;
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

function escapeXml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[
        character
      ],
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
  const textLines = [
    weekLabel,
    section.label,
    note,
    OPTIONAL_PRACTICE_NOTE,
    "",
    ...links.map(
      (link) => `${link.day}: ${link.title}\nOptional family practice: ${link.homeworkUrl}`,
    ),
  ].filter((line, index, array) => line || (index > 0 && array[index - 1]));
  const htmlItems = links
    .map(
      (link) =>
        `<li><strong>${escapeHtml(link.day)}:</strong> <a href="${escapeHtml(link.lessonUrl)}">${escapeHtml(link.title)}</a> · <a href="${escapeHtml(link.homeworkUrl)}">Optional family practice</a></li>`,
    )
    .join("");
  return {
    text: textLines.join("\n").trim(),
    html: `<h2>${escapeHtml(weekLabel)}</h2><p><strong>${escapeHtml(section.label)}</strong></p>${note ? `<p>${escapeHtml(note)}</p>` : ""}<p>${escapeHtml(OPTIONAL_PRACTICE_NOTE)}</p><ul>${htmlItems}</ul>`,
  };
}

export function buildCanvasSyncBundle(snapshot, lessons, sectionId) {
  const section = resolveSection(snapshot, sectionId);
  const announcement = buildCanvasAnnouncement(snapshot, lessons, section.id);
  const links = buildCanvasModuleLinks(snapshot, lessons, section.id);
  const weekLabel = cleanText(section.week?.label, 80) || "This Week";
  const moduleText = links.length
    ? links
        .map(
          (item) =>
            `${item.day}: ${item.title}\nLesson: ${item.lessonUrl}\nOptional family practice: ${item.homeworkUrl}`,
        )
        .join("\n\n")
    : "No lesson links are scheduled for this week yet.";
  return {
    title: `${weekLabel} — ${section.label}`,
    announcement,
    moduleLinks: links,
    text: `TITLE\n${weekLabel} — ${section.label}\n\nANNOUNCEMENT\n${announcement.text}\n\nMODULE LINKS\n${moduleText}`,
  };
}

export function buildCanvasRss(snapshot, sectionId) {
  const section = resolveSection(snapshot, sectionId);
  const weekLabel = cleanText(section.week?.label, 80) || "This Week";
  const familyUrl = `${PUBLIC_ORIGIN}/curriculum/family-connections/`;
  const feedUrl = `${PUBLIC_ORIGIN}/api/family-connections/canvas-feed?section=${encodeURIComponent(section.id)}&v=1`;
  const weekKey = section.week?.startDate || weekLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const publishedDate = new Date(snapshot?.publishedAt || 0);
  const pubDate = Number.isNaN(publishedDate.getTime())
    ? new Date(0).toUTCString()
    : publishedDate.toUTCString();
  const dayItems = (section.week?.days ?? [])
    .map((entry) => {
      const day = escapeHtml(entry.day);
      const note = escapeHtml(entry.note);
      if (entry.status === "lesson" && entry.lessonId) {
        const lessonId = encodeURIComponent(entry.lessonId);
        return `<li><strong>${day}:</strong> <a href="${PUBLIC_ORIGIN}/lessons/${lessonId}/">Lesson ${escapeHtml(entry.lessonId)}</a>${note ? ` — ${note}` : ""} · <a href="${PUBLIC_ORIGIN}/lessons/${lessonId}/homework.html">Optional family practice</a></li>`;
      }
      const status = entry.status === "assessment" ? "Assessment" : entry.status === "review" ? "Review" : "No lesson posted";
      return `<li><strong>${day}:</strong> ${status}${note ? ` — ${note}` : ""}</li>`;
    })
    .join("");
  const note = cleanText(section.week?.note, 500);
  const description = `${note ? `<p>${escapeHtml(note)}</p>` : ""}<ul>${dayItems}</ul><p><strong>Optional family practice is separate from regular homework.</strong> Families may use it to review or practice together when it works for them. It is never graded.</p>`;
  const title = `Family Connections — ${weekLabel}`;
  const guid = `${familyUrl}#${encodeURIComponent(section.id)}-${encodeURIComponent(weekKey)}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`Family Connections — ${section.label}`)}</title>
    <link>${escapeXml(familyUrl)}</link>
    <description>Published, family-safe weekly math updates from EduWonderLab.</description>
    <language>en-us</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(familyUrl)}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>
  </channel>
</rss>`;
}

export function buildCanvasExport(snapshot, lessons, sectionId) {
  const section = resolveSection(snapshot, sectionId);
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    platform: "canvas-ready",
    source: PUBLIC_ORIGIN,
    revision: Number(snapshot?.revision) || 0,
    publishedAt: snapshot?.publishedAt ?? null,
    destination: parseCanvasCourseUrl(snapshot?.integrations?.canvasUrl),
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

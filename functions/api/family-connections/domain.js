import { normalizeCopyOverrides } from "../../../curriculum/family-connections/shared/copy-defaults.js";
import {
  createDefaultSnapshot,
  DAYS,
  SNAPSHOT_SCHEMA_VERSION,
  safeExternalUrl,
  WEEK_STATUSES,
} from "../../../curriculum/family-connections/shared/model.js";

const text = (value, maximum) =>
  String(value ?? "")
    .trim()
    .slice(0, maximum);
const lessonId = (value) => {
  const clean = text(value, 24);
  return /^\d{1,2}-\d{1,2}(?:-flagship)?$/.test(clean) ? clean : "";
};
const localOrSecureUrl = (value) => {
  const clean = text(value, 400);
  if (!clean) return "";
  if (/^\/(?!\/)/.test(clean)) return clean;
  return safeExternalUrl(clean) ? clean : null;
};

function fail(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function normalizeLinks(input, limit = 5) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, limit)
    .map((item, index) => {
      const url = localOrSecureUrl(item?.url);
      if (url === null) fail("Links must use a local path or secure web address.");
      return {
        id: text(item?.id, 40) || `link-${index + 1}`,
        label: text(item?.label, 80),
        url,
      };
    })
    .filter((item) => item.label && item.url);
}

function normalizeDay(input, expectedDay) {
  const status = WEEK_STATUSES.includes(input?.status) ? input.status : "no-class";
  const id = lessonId(input?.lessonId);
  if (status === "lesson" && !id) fail(`${expectedDay} needs a valid lesson number.`);
  return {
    day: expectedDay,
    status,
    lessonId: status === "lesson" ? id : "",
    note: text(input?.note, 180),
  };
}

function normalizeSection(input, index) {
  const id = text(input?.id, 40)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!id) fail(`Section ${index + 1} needs an ID.`);
  const daysByName = new Map((input?.week?.days ?? []).map((day) => [day?.day, day]));
  return {
    id,
    label: text(input?.label, 80) || `Class ${index + 1}`,
    visible: input?.visible !== false,
    isDefault: input?.isDefault === true,
    week: {
      label: text(input?.week?.label, 80) || "This Week",
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(input?.week?.startDate ?? "")
        ? input.week.startDate
        : "",
      note: text(input?.week?.note, 500),
      days: DAYS.map((day) => normalizeDay(daysByName.get(day), day)),
    },
  };
}

function normalizeHomework(input) {
  const output = {};
  for (const [rawId, raw] of Object.entries(input ?? {}).slice(0, 250)) {
    const id = lessonId(rawId);
    if (!id) fail("Homework overrides must use valid lesson numbers.");
    output[id] = {
      visible: raw?.visible !== false,
      title: text(raw?.title, 120),
      directions: text(raw?.directions, 600),
      estimatedTime: text(raw?.estimatedTime, 40),
      materials: text(raw?.materials, 180),
      languageSupport: text(raw?.languageSupport, 500),
      supplementalLinks: normalizeLinks(raw?.supplementalLinks),
    };
  }
  return output;
}

function normalizeResource(item, index) {
  const url = localOrSecureUrl(item?.url);
  if (url === null) fail("Resource links must use a local path or secure web address.");
  return {
    id: text(item?.id, 40) || `resource-${index + 1}`,
    title: text(item?.title, 100),
    description: text(item?.description, 300),
    url,
    visible: item?.visible !== false,
  };
}

export function normalizeSnapshot(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("A complete draft is required.");
  const allowedFields = new Set([
    "schemaVersion",
    "revision",
    "publishedAt",
    "sections",
    "homeworkOverrides",
    "announcements",
    "resources",
    "integrations",
    "copy",
  ]);
  if (Object.keys(input).some((key) => !allowedFields.has(key))) {
    fail("The draft contains unsupported fields.");
  }
  const sections = (Array.isArray(input.sections) ? input.sections : [])
    .slice(0, 12)
    .map(normalizeSection);
  if (!sections.length) fail("At least one public class section is required.");
  if (new Set(sections.map((section) => section.id)).size !== sections.length) {
    fail("Class section IDs must be unique.");
  }
  const visible = sections.filter((section) => section.visible);
  if (!visible.length) fail("At least one class section must be public.");
  if (!visible.some((section) => section.isDefault)) {
    sections.forEach((section) => {
      section.isDefault = false;
    });
    visible[0].isDefault = true;
  } else {
    let defaultSeen = false;
    sections.forEach((section) => {
      const keep = section.visible && section.isDefault && !defaultSeen;
      section.isDefault = keep;
      if (keep) defaultSeen = true;
    });
  }

  const classDojoUrl = localOrSecureUrl(input.integrations?.classDojoUrl);
  const canvasUrl = localOrSecureUrl(input.integrations?.canvasUrl);
  if (classDojoUrl === null || canvasUrl === null)
    fail("Integration links must use secure web addresses.");

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    revision: Math.max(0, Math.floor(Number(input.revision) || 0)),
    publishedAt: typeof input.publishedAt === "string" ? input.publishedAt : null,
    sections,
    homeworkOverrides: normalizeHomework(input.homeworkOverrides),
    announcements: (Array.isArray(input.announcements) ? input.announcements : [])
      .slice(0, 8)
      .map((item, index) => ({
        id: text(item?.id, 40) || `announcement-${index + 1}`,
        title: text(item?.title, 100),
        body: text(item?.body, 600),
        visible: item?.visible !== false,
      }))
      .filter((item) => item.title && item.body),
    resources: (Array.isArray(input.resources) ? input.resources : [])
      .slice(0, 12)
      .map(normalizeResource)
      .filter((item) => item.title && item.url),
    integrations: { classDojoUrl, canvasUrl },
    copy: normalizeCopyOverrides(input.copy),
  };
}

export function initialState() {
  const snapshot = createDefaultSnapshot();
  return { draft: structuredClone(snapshot), published: structuredClone(snapshot), history: [] };
}

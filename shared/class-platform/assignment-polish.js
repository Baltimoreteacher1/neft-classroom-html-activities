// C3 Assignment Polish & Student "My Work" — versioned contract (ewl-assignment/2),
// Google Classroom & Canvas share helpers, and student-safe My Work filtering.

export const ASSIGNMENT_CONTRACT_VERSION = "ewl-assignment/2";

const ID_RE = /^[a-z0-9][a-z0-9:_-]{0,63}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isSameOriginRelativePath(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false;
  return true;
}

function escHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Validates an ewl-assignment/2 object. Returns { valid, errors }.
 */
export function validateAssignmentV2(assignment) {
  const errors = [];
  if (!assignment || typeof assignment !== "object") {
    return { valid: false, errors: ["assignment must be an object"] };
  }
  if (assignment.version !== ASSIGNMENT_CONTRACT_VERSION) {
    errors.push(`version must be "${ASSIGNMENT_CONTRACT_VERSION}"`);
  }
  if (typeof assignment.id !== "string" || !ID_RE.test(assignment.id.trim())) {
    errors.push("id must be a non-empty alphanumeric/slug identifier");
  }
  if (typeof assignment.unitId !== "string" || !assignment.unitId.trim()) {
    errors.push("unitId is required");
  }
  if (typeof assignment.title !== "string" || !assignment.title.trim()) {
    errors.push("title is required");
  }
  if (!isValidIsoDate(assignment.dueDate)) {
    errors.push("dueDate must be a valid ISO date (YYYY-MM-DD)");
  }
  if (!isSameOriginRelativePath(assignment.activityUrl)) {
    errors.push("activityUrl must be a same-origin relative path starting with '/'");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Creates and validates a versioned ewl-assignment/2 record.
 */
export function createAssignmentV2({
  id,
  unitId,
  title,
  bandOrGroup = "",
  dueDate,
  activityUrl,
  notes = "",
} = {}) {
  const record = {
    version: ASSIGNMENT_CONTRACT_VERSION,
    id: String(id ?? "").trim(),
    unitId: String(unitId ?? "").trim(),
    title: String(title ?? "").trim(),
    bandOrGroup: String(bandOrGroup ?? "").trim(),
    dueDate: String(dueDate ?? "").trim(),
    activityUrl: String(activityUrl ?? "").trim(),
    notes: String(notes ?? "").trim(),
  };
  const check = validateAssignmentV2(record);
  if (!check.valid) {
    throw new Error(`Invalid ewl-assignment/2: ${check.errors.join("; ")}`);
  }
  return Object.freeze(record);
}

/**
 * Builds one-click copy payloads for Google Classroom and Canvas LMS.
 */
export function buildShareLinks(assignment, origin) {
  const check = validateAssignmentV2(assignment);
  if (!check.valid) {
    throw new Error(`Cannot build share links for invalid assignment: ${check.errors.join("; ")}`);
  }
  const cleanOrigin = String(origin ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (!/^https?:\/\/[^/\s]+$/i.test(cleanOrigin)) {
    throw new Error("origin must be a valid http(s) origin");
  }

  const directUrl = `${cleanOrigin}${assignment.activityUrl}`;
  const noteLine = assignment.notes ? `\nNotes: ${assignment.notes}` : "";
  const googleClassroomText = `${assignment.title}\nDue: ${assignment.dueDate}${noteLine}\nOpen activity: ${directUrl}`;

  const canvasPasteHtml = [
    '<div style="border:1px solid #dcd6cb;border-radius:8px;padding:12px 14px;background:#faf9f6;color:#182230;font-family:sans-serif;">',
    `<p style="margin:0 0 6px;font-weight:700;color:#1e3a5f;">${escHtml(assignment.title)}</p>`,
    `<p style="margin:0 0 6px;font-size:14px;color:#475467;">Due: ${escHtml(assignment.dueDate)}</p>`,
    assignment.notes
      ? `<p style="margin:0 0 8px;font-size:14px;">${escHtml(assignment.notes)}</p>`
      : "",
    `<p style="margin:0;"><a href="${escHtml(directUrl)}" style="color:#0f766e;font-weight:600;">Open Activity</a></p>`,
    "</div>",
  ]
    .filter(Boolean)
    .join("");

  return {
    directUrl,
    googleClassroomText,
    canvasPasteHtml,
  };
}

/**
 * Student-facing "My Work" view: alias-only, due-date sorted, and strips all
 * band/level/group classification metadata so students never see level labels.
 */
export function filterMyWork(assignments, { alias = "", groupId = "", completedIds = [] } = {}) {
  const list = Array.isArray(assignments) ? assignments : [];
  const targetGroup = String(groupId || "")
    .trim()
    .toLowerCase();
  const completedSet = new Set(
    (Array.isArray(completedIds) ? completedIds : []).map((x) => String(x)),
  );

  const items = list
    .filter((a) => validateAssignmentV2(a).valid)
    .filter((a) => {
      if (!targetGroup) return true;
      const bg = String(a.bandOrGroup || "")
        .trim()
        .toLowerCase();
      return !bg || bg === "all" || bg === targetGroup;
    })
    .sort((a, b) => {
      const byDate = a.dueDate.localeCompare(b.dueDate);
      if (byDate !== 0) return byDate;
      const byTitle = a.title.localeCompare(b.title);
      return byTitle !== 0 ? byTitle : a.id.localeCompare(b.id);
    })
    .map((a) => ({
      id: a.id,
      unitId: a.unitId,
      title: a.title,
      dueDate: a.dueDate,
      activityUrl: a.activityUrl,
      notes: a.notes || "",
      completed: completedSet.has(a.id),
    }));

  return {
    alias: String(alias || "").trim(),
    items,
  };
}

/* =============================================================================
 * teacher/family-response.js — what families did with what was posted.
 * -----------------------------------------------------------------------------
 * Two questions the publisher could not answer before:
 *
 *   1. Does posting the week move practice opens? `/api/signal/practice` counts
 *      opens per lesson per ENTRY POINT (the posted week vs browsing the
 *      library), so "families use it more when I post it" stops being a guess.
 *   2. Who practiced? Every homework page has posted a parent sign-off to
 *      `/api/progress/family-signoff` for a while, and nothing has ever read it.
 *
 * Both reads are TEACHER_KEY-gated and both degrade to a plain message rather
 * than an error: this panel is information, and it must never be the reason the
 * publisher looks broken.
 * ========================================================================== */

const KEY_STORAGE = "neft.teacher.key";
const PRACTICE_URL = "/api/signal/practice";
const SIGNOFF_URL = "/api/progress/family-signoff";
const SOURCES = [
  ["week", "From the posted week"],
  ["spotlight", "From the spotlight"],
  ["library", "From browsing"],
];

const node = (tag, className, text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
};

export function teacherKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function saveTeacherKey(value) {
  try {
    localStorage.setItem(KEY_STORAGE, String(value ?? "").trim());
    return true;
  } catch {
    return false;
  }
}

async function readJson(url, key) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { accept: "application/json", "x-teacher-key": key },
  });
  if (response.status === 401) throw new Error("That teacher key was not accepted.");
  if (response.status === 503) throw new Error("Family reporting is not configured on the server.");
  if (!response.ok) throw new Error(`Request failed (${response.status}).`);
  const body = await response.json();
  if (body?.ok === false) throw new Error(body.message || body.error || "Request failed.");
  return body;
}

/** ISO date `days` ago, for the sign-off `since` filter. */
function sinceIso(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Math.max(1, Number(days) || 28));
  return date.toISOString();
}

export async function loadFamilyResponse(days = 28) {
  const key = teacherKey();
  if (!key) throw new Error("Add your teacher key to see how families used this week.");
  const [practice, signoff] = await Promise.all([
    readJson(`${PRACTICE_URL}?days=${days}`, key),
    readJson(`${SIGNOFF_URL}?since=${encodeURIComponent(sinceIso(days))}`, key),
  ]);
  return { practice, signoffs: signoff.signoffs ?? [] };
}

function practiceTable(practice, lessonIds) {
  const totals = practice.totals ?? {};
  const wrap = node("div", "fr-block");
  const headline = node("p", "fr-headline");
  const week = Number(totals.week || 0) + Number(totals.spotlight || 0);
  const library = Number(totals.library || 0);
  headline.append(
    node("strong", "", String(week)),
    document.createTextNode(
      ` opened from what you posted · ${library} from browsing the library.`,
    ),
  );
  wrap.append(headline);
  if (!week && !library) {
    wrap.append(
      node("p", "fr-empty", "No practice opens recorded yet in this window."),
    );
    return wrap;
  }

  const posted = new Set(lessonIds);
  const byLesson = new Map();
  for (const row of practice.rows ?? []) {
    if (!byLesson.has(row.lesson_id)) byLesson.set(row.lesson_id, {});
    byLesson.get(row.lesson_id)[row.source] = Number(row.opens || 0);
  }
  /* This week's lessons first — the rest is still useful, but the question was
   * about the week that is posted right now. */
  const ordered = [...byLesson.entries()].sort((a, b) => {
    const aPosted = posted.has(a[0]) ? 0 : 1;
    const bPosted = posted.has(b[0]) ? 0 : 1;
    if (aPosted !== bPosted) return aPosted - bPosted;
    const total = (entry) => Object.values(entry[1]).reduce((sum, n) => sum + n, 0);
    return total(b) - total(a);
  });

  const table = node("table", "fr-table");
  const head = node("tr");
  head.append(node("th", "", "Lesson"));
  for (const [, label] of SOURCES) head.append(node("th", "", label));
  table.append(head);
  for (const [lessonId, counts] of ordered.slice(0, 20)) {
    const row = node("tr", posted.has(lessonId) ? "is-posted" : "");
    const cell = node("td", "", `Lesson ${lessonId}`);
    if (posted.has(lessonId)) cell.append(node("span", "fr-chip", "this week"));
    row.append(cell);
    for (const [source] of SOURCES) row.append(node("td", "", String(counts[source] ?? 0)));
    table.append(row);
  }
  wrap.append(table);
  return wrap;
}

function signoffList(signoffs, lessonIds) {
  const posted = new Set(lessonIds);
  const wrap = node("div", "fr-block");
  const thisWeek = signoffs.filter((item) => posted.has(item.lesson_id));
  const heading = node(
    "p",
    "fr-headline",
    `${thisWeek.length} ${thisWeek.length === 1 ? "family" : "families"} signed off on this week's lessons · ${signoffs.length} in the window.`,
  );
  wrap.append(heading);
  if (!signoffs.length) {
    wrap.append(
      node(
        "p",
        "fr-empty",
        "No sign-offs yet. Families use the sign-off box at the end of a homework page.",
      ),
    );
    return wrap;
  }
  const list = node("ul", "fr-signoffs");
  /* This week first, then most recent — a teacher scanning this wants the week
   * they just taught, not an archive. */
  const ordered = [
    ...thisWeek,
    ...signoffs.filter((item) => !posted.has(item.lesson_id)),
  ].slice(0, 40);
  for (const item of ordered) {
    const entry = node("li", posted.has(item.lesson_id) ? "is-posted" : "");
    const who = node("strong", "", item.parent_name || "A family");
    entry.append(who);
    if (item.student_name) entry.append(node("span", "fr-student", ` · ${item.student_name}`));
    entry.append(node("span", "fr-lesson", ` · Lesson ${item.lesson_id}`));
    if (item.signed_on) entry.append(node("span", "fr-when", ` · ${item.signed_on}`));
    if (item.note) entry.append(node("p", "fr-note", item.note));
    list.append(entry);
  }
  wrap.append(list);
  return wrap;
}

/**
 * @param {HTMLElement} root
 * @param {{practice: any, signoffs: any[]}|null} data null while unloaded
 * @param {{lessonIds: string[], message: string}} options
 */
export function renderFamilyResponse(root, data, options = {}) {
  root.replaceChildren();
  if (!data) {
    root.append(node("p", "fr-empty", options.message || "Not loaded yet."));
    return;
  }
  root.append(
    practiceTable(data.practice ?? {}, options.lessonIds ?? []),
    signoffList(data.signoffs ?? [], options.lessonIds ?? []),
  );
}

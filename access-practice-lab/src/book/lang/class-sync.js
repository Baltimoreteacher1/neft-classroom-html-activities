// Book Studio 2.0 · class delivery of language supports. Teacher: publish an assignment with a plan and assign students.
// Student: start an assignment, receive ONLY their own supports from the server, and send support-use events and work
// snapshots back. Every call degrades to the device-only experience: an offline or unconfigured class never blocks writing.
import { request, studentHeaders } from "../../../../shared/class-platform/client.js";
import { normalizeCode } from "../../../../shared/class-platform/contract.js";
import { loadLink } from "../../class/link.js";
import * as db from "../db.js";
import { makePage, normalizeBook, plainText } from "../model.js";

const f = (...a) => fetch(...a);
const teacherHeaders = (passcode) => ({ "x-class-teacher": String(passcode || "").toUpperCase() });
const fail = (res, en) =>
  Object.assign(new Error(res?.error || "failed"), {
    userMessage:
      res?.httpStatus === 401
        ? "That class code and passcode do not match."
        : res?.httpStatus === 0
          ? "You are offline. Try again when you are connected."
          : en,
  });

/** Publish this book as a class assignment (supports, default plan, groups). The plan stays on the server. */
export async function publishAssignment(book, { code, passcode }) {
  const c = normalizeCode(code);
  if (c.length !== 6 || !passcode)
    throw Object.assign(new Error("missing"), {
      userMessage: "Enter the class code and the class teacher passcode.",
    });
  const res = await request(f, "bsupport/publish", {
    method: "POST",
    headers: teacherHeaders(passcode),
    body: {
      code: c,
      assignment: {
        id: book.assignment?.id || undefined,
        title: book.assignment?.title || book.title,
        task: book.assignment?.task || "",
        book: { ...book, work: undefined, feedback: [], submission: null, review: null },
        supports: book.supports,
        plan: { default: book.plan, groups: book.groups, students: {} },
      },
    },
  });
  if (!res.ok) throw fail(res, "Could not publish. Your book is unchanged.");
  return res;
}

export async function loadRoster(book, { code, passcode }) {
  const res = await request(
    f,
    `bsupport/roster?code=${normalizeCode(code)}&assignment=${book.assignment?.id}`,
    { headers: teacherHeaders(passcode) },
  );
  if (!res.ok) throw fail(res, "Could not load the class list.");
  return res;
}

export async function adjustStudent(
  book,
  { code, passcode, alias, plan, group, clearOverride, reason },
) {
  const res = await request(f, "bsupport/adjust", {
    method: "POST",
    headers: teacherHeaders(passcode),
    body: {
      code: normalizeCode(code),
      assignment: book.assignment?.id,
      alias,
      plan,
      group,
      clearOverride,
      reason,
    },
  });
  if (!res.ok)
    throw fail(
      res,
      res.error === "reason-required"
        ? "Write a short reason for the change."
        : "Could not save that change.",
    );
  return res;
}

export async function loadEvidence(book, { code, passcode }) {
  const res = await request(
    f,
    `bsupport/evidence?code=${normalizeCode(code)}&assignment=${book.assignment?.id}`,
    { headers: teacherHeaders(passcode) },
  );
  if (!res.ok) throw fail(res, "Could not load the evidence.");
  return res;
}

// ── student side ──
export async function listAssignments(link = loadLink()) {
  if (!link) return [];
  const res = await request(f, `bsupport/assignments?code=${link.code}`, {
    headers: studentHeaders(link),
  });
  return res.ok ? res.assignments : [];
}

/** Start (or reopen) a class assignment as this learner's own book. Returns the local book id. */
export async function startAssignment(assignmentId, link = loadLink()) {
  if (!link) throw Object.assign(new Error("no-link"), { userMessage: "Join your class first." });
  const existing = (await db.listBooks()).find(
    (b) => b.assignment?.id === assignmentId && b.assignment?.classCode === link.code,
  );
  if (existing) return existing.id;
  const res = await request(f, `bsupport/mine?code=${link.code}&assignment=${assignmentId}`, {
    headers: studentHeaders(link),
  });
  if (!res.ok) throw fail(res, "Could not open this assignment.");
  const a = res.assignment;
  const book = normalizeBook({
    ...a.book,
    id: "",
    status: "draft",
    author: "",
    createdAt: undefined,
    updatedAt: undefined,
    rev: 0,
    assignment: { id: a.id, title: a.title, task: a.task, classCode: link.code, role: "student" },
    supports: res.supports,
    plan: res.plan,
    groups: [],
    work: undefined,
  });
  if (!book.pages.length) book.pages = [makePage()];
  const saved = await db.saveBook(book, { baseRev: null });
  return saved.id;
}

/** Refresh this learner's supports and plan from the class (best effort; the story is never touched). */
export async function refreshSupports(book, link = loadLink()) {
  if (!link || !book.assignment?.id || book.assignment.classCode !== link.code) return false;
  const res = await request(f, `bsupport/mine?code=${link.code}&assignment=${book.assignment.id}`, {
    headers: studentHeaders(link),
  });
  if (!res.ok) return false;
  book.supports = res.supports;
  book.plan = res.plan;
  return true;
}

const sentKey = (id) => `accessPracticeLab:v1:bs-sent:${id}`;
const sent = (id) => {
  try {
    return Number(localStorage.getItem(sentKey(id)) || 0);
  } catch {
    return 0;
  }
};

/** Send new support-use records and a snapshot of the learner's work. Safe to call often; it never throws. */
export async function pushProgress(book, link = loadLink()) {
  try {
    if (!link || !book.assignment?.id || book.assignment.classCode !== link.code) return false;
    const from = sent(book.id);
    const fresh = book.work.records.slice(from);
    const base = { code: link.code, assignment: book.assignment.id };
    if (fresh.length) {
      const batch = fresh.slice(0, 50);
      const res = await request(f, "bsupport/event", {
        method: "POST",
        headers: studentHeaders(link),
        body: {
          ...base,
          events: batch.map((r) => ({
            supportId: r.supportId,
            action: r.action,
            target: r.target,
          })),
        },
      });
      if (res.ok) {
        try {
          localStorage.setItem(sentKey(book.id), String(from + batch.length));
        } catch {}
      }
    }
    const texts = book.pages.flatMap((p) =>
      p.elements
        .filter((e) => (e.type === "text" || e.type === "bubble") && plainText(e.html))
        .map((e) => ({ pageId: p.id, elementId: e.id, text: plainText(e.html) })),
    );
    const res = await request(f, "bsupport/work", {
      method: "POST",
      headers: studentHeaders(link),
      body: { ...base, work: book.work, texts },
    });
    return res.ok;
  } catch {
    return false;
  }
}

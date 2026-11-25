// Client for /api/formative and the class roster. The teacher's class passcode goes out only as the
// x-class-teacher header, the same credential the class panel uses; it is never stored by this view.
import { anonTokenHeaders } from "../../../../shared/anon-token/anon-token.js";
import { createTeacherClient } from "../../../../shared/class-platform/client.js";
import { teacherClasses } from "../../../../shared/class-platform/teacher-classes.js";

/** Classes this teacher opened on this device, as { code, passcode, title }. */
export const savedClasses = () =>
  teacherClasses().map((c) => ({ code: c.code, passcode: c.passcode, title: String(c.title || "") }));

/** Always resolves { ok, status, data }; a dropped connection is status 0. */
export function createFormativeApi({ code, passcode, fetchImpl = (...a) => fetch(...a) }) {
  const headers = { "content-type": "application/json", "x-class-teacher": passcode };
  async function call(path, body) {
    try {
      const res = await fetchImpl(
        `/api/formative/${path}`,
        body === undefined ? { headers } : {
                method: "POST",
                headers: { ...headers, ...anonTokenHeaders() },
                body: JSON.stringify({ code, ...body }),
              },
      );
      const data = await res.json().catch(() => null);
      return { ok: res.ok && data?.ok !== false, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: null };
    }
  }
  const roster = createTeacherClient({ fetchImpl, code, passcode });
  return {
    /** [{ studentId, alias }] sorted by alias, or null when the roster cannot be read. */
    async students() {
      const res = await roster.roster();
      return res.ok ? (res.students || []).map((s) => ({ studentId: s.studentId, alias: s.alias })) : null;
    },
    summary: (unitId) => call(`summary?code=${encodeURIComponent(code)}&unitId=${encodeURIComponent(unitId)}`),
    saveScores: (unitId, ticketId, scores) => call("score", { unitId, ticketId, scores }),
    bumpErrors: (unitId, errors) => call("errors", { unitId, errors }),
  };
}

/** A sentence for a failed call; never shows server internals. */
export function explain({ status }) {
  if (status === 0) return "No connection. Your taps are kept on this page; try again when you are back online.";
  if (status === 401) return "That class passcode was not accepted.";
  if (status === 404) return "That class or exit ticket was not found.";
  if (status === 422) return "That entry was refused because it looked like personal information.";
  if (status === 429) return "Too many requests. Wait a minute and try again.";
  return "That did not save. Try again in a moment.";
}

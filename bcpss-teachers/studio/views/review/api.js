// Client for /api/review. The site teacher key is typed by the reviewer, kept in sessionStorage (gone when the
// tab closes) and sent only as the x-teacher-key header. Reviewer name and role are the reviewer's own entry.
import { anonTokenHeaders } from "../../../../shared/anon-token/anon-token.js";

const KEY_SLOT = "ewl.review.teacherKey";
const WHO_SLOT = "ewl.review.reviewer";

const read = (slot) => {
  try {
    return globalThis.sessionStorage?.getItem(slot) ?? "";
  } catch {
    return "";
  }
};
const write = (slot, value) => {
  try {
    if (value) globalThis.sessionStorage?.setItem(slot, value);
    else globalThis.sessionStorage?.removeItem(slot);
  } catch {
    /* kept in memory by the caller for this page */
  }
};

export const getKey = () => read(KEY_SLOT);
export const setKey = (key) => write(KEY_SLOT, key);

export function getReviewer() {
  try {
    const who = JSON.parse(read(WHO_SLOT) || "{}");
    return { name: String(who.name || ""), role: String(who.role || "pedagogy") };
  } catch {
    return { name: "", role: "pedagogy" };
  }
}
export const setReviewer = (who) => write(WHO_SLOT, JSON.stringify({ name: who.name, role: who.role }));

/** Always resolves: { ok, status, data }. A network failure is status 0. */
export async function api(path, { method = "GET", body } = {}) {
  try {
    const res = await fetch(path, {
      method,
      headers: {
        Accept: "application/json",
        "x-teacher-key": getKey(),
        ...anonTokenHeaders(),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "network" } };
  }
}

/** Plain-text GET (the CSV export): { ok, status, text }. */
export async function apiText(path) {
  try {
    const res = await fetch(path, { headers: { "x-teacher-key": getKey() } });
    return { ok: res.ok, status: res.status, text: await res.text(), data: {} };
  } catch {
    return { ok: false, status: 0, text: "", data: { error: "network" } };
  }
}

/** A sentence for an error response. */
export function explain({ status, data }) {
  if (status === 0) return "The review service could not be reached. Check your connection and try again.";
  if (status === 401) return "That teacher key was not accepted.";
  if (status === 503) return "Review is not set up on this site yet.";
  return data?.message || data?.error || `The request failed (${status}).`;
}

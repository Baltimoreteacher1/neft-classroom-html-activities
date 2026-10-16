// Our Class Investigation — talking to /api/class-data, safely offline.
//
// The queue is the contract: a contribution is saved on the device first and
// sent whenever the network allows. Because every entry carries its own random
// `entryId` and the server ignores a repeat of one it already holds, resending
// is always safe, so this module can be aggressive about retrying without ever
// double counting a student.
//
// Outcomes of one send:
//   ok / duplicate          -> sent (a lost response followed by a resend lands here)
//   network error, 429, 5xx -> stay pending, try again later
//   any other 4xx           -> rejected for good, with the server's reason, and
//                              kept on the device so the student sees what happened

const BASE = "/api/class-data";

/** Reasons that mean "try again later", not "this entry is wrong". */
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * @param {{ fetchFn?: typeof fetch, base?: string }} [opts]
 */
export function createClient({ fetchFn = globalThis.fetch?.bind(globalThis), base = BASE } = {}) {
  async function request(path, init) {
    if (!fetchFn) return { ok: false, status: 0, error: "offline", data: null };
    try {
      const res = await fetchFn(`${base}/${path}`, init);
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      return {
        ok: res.ok && data?.ok !== false,
        status: res.status,
        error: data?.error ?? (res.ok ? "" : "http"),
        data,
      };
    } catch {
      return { ok: false, status: 0, error: "offline", data: null };
    }
  }

  const post = (path, body, headers = {}) =>
    request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  const teacher = (key) => ({ "x-teacher-key": key });

  return {
    info: (code) => request(`info?code=${encodeURIComponent(code)}`),
    entries: (code, templateId) =>
      request(
        `entries?code=${encodeURIComponent(code)}&template=${encodeURIComponent(templateId)}`,
      ),
    contribute: (entry) =>
      post("contribute", {
        code: entry.code,
        templateId: entry.templateId,
        entryId: entry.entryId,
        clientId: entry.clientId,
        source: entry.source,
        values: entry.values,
      }),
    // Teacher routes: the key travels only in a header, only from the open teacher panel.
    create: (key, body) => post("create", body, teacher(key)),
    activate: (key, body) => post("activate", body, teacher(key)),
    close: (key, body) => post("close", body, teacher(key)),
    reopen: (key, body) => post("reopen", body, teacher(key)),
    purge: (key, body) => post("purge", body, teacher(key)),
    async exportCsv(key, code, templateId) {
      if (!fetchFn) return { ok: false, status: 0, error: "offline", text: "" };
      try {
        const res = await fetchFn(
          `${base}/export?code=${encodeURIComponent(code)}&template=${encodeURIComponent(templateId)}`,
          { headers: teacher(key) },
        );
        return {
          ok: res.ok,
          status: res.status,
          error: res.ok ? "" : "http",
          text: await res.text(),
        };
      } catch {
        return { ok: false, status: 0, error: "offline", text: "" };
      }
    },
  };
}

/**
 * Send every pending contribution, oldest first. Stops at the first sign the
 * network or server is not ready, so a flaky connection cannot burn the whole
 * queue's attempts in one go.
 * @returns {Promise<{ sent: number, rejected: number, left: number, offline: boolean }>}
 */
export async function flushQueue(store, client) {
  let sent = 0;
  let rejected = 0;
  let offline = false;
  for (const item of store.pending()) {
    const r = await client.contribute(item);
    if (r.ok) {
      store.patchQueue(item.entryId, { status: "sent", attempts: item.attempts + 1 });
      sent++;
    } else if (r.status === 0 || RETRYABLE.has(r.status)) {
      store.patchQueue(item.entryId, { attempts: item.attempts + 1 });
      offline = true;
      break;
    } else {
      store.patchQueue(item.entryId, {
        status: "rejected",
        reason: r.error || "rejected",
        attempts: item.attempts + 1,
      });
      rejected++;
    }
  }
  store.trimSent();
  return { sent, rejected, left: store.pending().length, offline };
}

/**
 * Pull the class's current dataset into the local cache.
 * @returns {Promise<{ ok: boolean, status: number, error: string }>}
 */
export async function refreshDataset(store, client, templateId) {
  const code = store.state.code;
  if (store.mode !== "class" || !code) return { ok: false, status: 0, error: "solo" };
  const r = await client.entries(code, templateId);
  if (r.ok) {
    store.setCache({
      code,
      templateId,
      entries: r.data.entries ?? [],
      status: r.data.status,
      active: r.data.active === true,
      options: r.data.options ?? {},
    });
  }
  return { ok: r.ok, status: r.status, error: r.error };
}

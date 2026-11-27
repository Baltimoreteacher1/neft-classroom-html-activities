// Calls to the tour's live room (/api/tour-room), for the projector, audience phones and the presenter remote.
// Every failure resolves to { ok: false } so a page can keep working as a plain presentation when the room
// is unreachable (no network, another host, the artifact preview).

const API = "/api/tour-room/";

/** This phone's random id: lets it change its own answer and be counted as present. Nothing else. */
export function deviceId() {
  const make = () => {
    const a = crypto.getRandomValues(new Uint8Array(18));
    return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  try {
    let id = localStorage.getItem("tourLive:v1:device");
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(id || "")) {
      id = make();
      localStorage.setItem("tourLive:v1:device", id);
    }
    return id;
  } catch {
    deviceId.mem ||= make();
    return deviceId.mem;
  }
}

async function call(action, { body, query = "" } = {}) {
  try {
    const res = await fetch(API + action + query, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "X-Anon-Token": deviceId() },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ...data, ok: res.ok && data.ok !== false, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export const openRoom = () => call("open", { body: {} });
export const getState = (code) => call("state", { query: `?code=${encodeURIComponent(code)}` });
export const getResults = (code) => call("results", { query: `?code=${encodeURIComponent(code)}` });
export const setState = (code, token, state) => call("state", { body: { code, token, ...state } });
export const join = (code) => call("join", { body: { code, device: deviceId() } });
export const answer = (code, prompt, value) => call("answer", { body: { code, device: deviceId(), prompt, value } });
export const react = (code, kind) => call("react", { body: { code, device: deviceId(), kind } });

export const CODE_RE = /^[A-HJKMNP-Z2-9]{5}$/;
export const cleanCode = (raw) =>
  String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);

/** Small inline icons for the four reactions (drawn, not emoji, so every device shows the same thing). */
export const REACTION_ICONS = {
  agree:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  idea: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3z" fill="currentColor"/><rect x="9.5" y="17.5" width="5" height="2" rx="1" fill="currentColor"/><rect x="10.5" y="20.5" width="3" height="1.6" rx=".8" fill="currentColor"/></svg>',
  question:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4.2 2.8c-.8.4-1.2 1-1.2 1.9V15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/></svg>',
  love: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/></svg>',
};
export const REACTION_COLORS = { agree: "#1E7F4F", idea: "#8C5A12", question: "#2E4A94", love: "#A8432B" };

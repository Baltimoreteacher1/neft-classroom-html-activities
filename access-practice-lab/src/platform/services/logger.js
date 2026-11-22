/**
 * Lightweight structured diagnostics logger.
 * Silent in production unless `?debug=1` is present or Ctrl+Shift+D opens the diagnostics drawer.
 */

const MAX_EVENTS = 80;
const events = [];
const listeners = new Set();

export function isDebugEnabled() {
  try {
    if (typeof location !== "undefined" && new URLSearchParams(location.search).get("debug") === "1") {
      return true;
    }
  } catch {}
  return false;
}

export function logEvent(category, action, detail = {}) {
  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ts: new Date().toISOString(),
    category,
    action,
    detail,
  };
  events.push(entry);
  if (events.length > MAX_EVENTS) events.shift();
  for (const fn of listeners) {
    try {
      fn(entry, events);
    } catch {}
  }
  return entry;
}

export function getLogEvents() {
  return [...events];
}

export function clearLogEvents() {
  events.length = 0;
  for (const fn of listeners) {
    try {
      fn(null, []);
    } catch {}
  }
}

export function subscribeLogs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const API_BASE = "/api";
const SCORES_URL = `${API_BASE}/scores`;
const PROGRESS_URL = `${API_BASE}/progress`;
const QUEUE_KEY = "e3d:syncQueue";
const PROGRESS_PREFIX = "e3d:progress:";

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeQueue(q) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* storage full / unavailable */
  }
}
function enqueue(entry) {
  const q = readQueue();
  q.push({ ...entry, queuedAt: Date.now() });
  writeQueue(q);
}

function post(url, payload) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

/** Fire-and-forget score report. Never throws, never blocks gameplay. */
export function reportScore(payload) {
  const body = { ...payload, ts: payload.ts || Date.now() };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    enqueue({ url: SCORES_URL, payload: body });
    return Promise.resolve({ queued: true });
  }
  return post(SCORES_URL, body)
    .then((res) => {
      if (!res.ok) throw new Error("score POST " + res.status);
      return { sent: true };
    })
    .catch(() => {
      enqueue({ url: SCORES_URL, payload: body });
      return { queued: true };
    });
}

/** Save progress for a game/student. Mirrors to localStorage immediately. */
export function saveProgress(payload) {
  const body = { ...payload, ts: payload.ts || Date.now() };
  const key = PROGRESS_PREFIX + (body.gameId || "default");
  try {
    localStorage.setItem(key, JSON.stringify(body));
  } catch {
    /* ignore */
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    enqueue({ url: PROGRESS_URL, payload: body });
    return Promise.resolve({ queued: true });
  }
  return post(PROGRESS_URL, body)
    .then((res) => {
      if (!res.ok) throw new Error("progress POST " + res.status);
      return { sent: true };
    })
    .catch(() => {
      enqueue({ url: PROGRESS_URL, payload: body });
      return { queued: true };
    });
}

/** Load progress: tries network, falls back to localStorage. Always resolves. */
export function loadProgress(gameId = "default") {
  const key = PROGRESS_PREFIX + gameId;
  const local = (() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  })();

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return Promise.resolve(local);
  }
  return fetch(`${PROGRESS_URL}?gameId=${encodeURIComponent(gameId)}`)
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((remote) => remote || local)
    .catch(() => local);
}

/** Flush queued offline writes. Safe to call repeatedly. */
export function flushQueue() {
  const q = readQueue();
  if (!q.length) return Promise.resolve({ flushed: 0 });
  const remaining = [];
  return Promise.all(
    q.map((entry) =>
      post(entry.url, entry.payload)
        .then((res) => {
          if (!res.ok) remaining.push(entry);
        })
        .catch(() => remaining.push(entry)),
    ),
  ).then(() => {
    writeQueue(remaining);
    return { flushed: q.length - remaining.length };
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushQueue();
  });
}

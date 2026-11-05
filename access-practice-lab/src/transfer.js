// Moving a learner's progress between the lab's two homes (eduwonderlab.com and thelanguagepage.com).
// localStorage belongs to one origin, so a learner who opens the lab on the new address starts empty. This
// module moves their work across on their say-so, with no server in the middle and nothing deleted at either end:
//   - the SENDER opens the other site and answers a "ready" message with the data, addressed to that exact origin;
//   - the RECEIVER accepts a message only from that exact origin and only after the learner chose to receive,
//     shows what is arriving (names and counts, never the work itself) and writes nothing until they confirm;
//   - a file download/upload does the same job when pop-ups are blocked.
// Known record families merge through store.js (work already on the device always wins); any other lab key is added
// only when the device has none, so nothing here can overwrite existing progress.
import { importProgressData } from "./store.js";
import { storage } from "./util.js";

export const KIND = "access-lab-progress";
export const KEY_PREFIX = "accessPracticeLab:";
export const MSG_READY = "access-lab-transfer:ready";
export const MSG_DATA = "access-lab-transfer:data";
export const LIMITS = { keys: 400, keyLength: 200, chars: 4_000_000 };
const KEY_SHAPE = /^[A-Za-z0-9:_.-]+$/;

/** The other home of the lab for an address, or null where there is none (previews, other hosts).
 * Loopback names pair `localhost` with `127.0.0.1` on the same port, which are different origins, so the
 * two-origin flow can be driven in a test without touching production hostnames. */
export function peerOrigin(loc = location) {
  const port = loc.port ? `:${loc.port}` : "";
  if (loc.hostname === "eduwonderlab.com") return "https://thelanguagepage.com";
  if (loc.hostname === "thelanguagepage.com") return "https://eduwonderlab.com";
  if (loc.hostname === "localhost") return `${loc.protocol}//127.0.0.1${port}`;
  if (loc.hostname === "127.0.0.1") return `${loc.protocol}//localhost${port}`;
  return null;
}

/** Everything the lab has saved on this device, under the lab's own key prefix. */
export function collectTransfer(now = new Date()) {
  const data = {};
  for (const key of storage.keys()) {
    if (!key.startsWith(KEY_PREFIX)) continue;
    const value = storage.get(key);
    if (typeof value === "string") data[key] = value;
  }
  return { kind: KIND, v: 1, from: location.origin, at: now.toISOString(), data };
}

/** Shape and size checks, before anything is shown or written. */
export function validateTransfer(payload) {
  const bad = (error) => ({ ok: false, error });
  if (!payload || typeof payload !== "object" || payload.kind !== KIND || payload.v !== 1)
    return bad("That is not a progress file from the lab.");
  const { data } = payload;
  if (!data || typeof data !== "object" || Array.isArray(data))
    return bad("That file has no progress in it.");
  const keys = Object.keys(data);
  if (keys.length > LIMITS.keys) return bad("That file has too many items to be a lab backup.");
  let chars = 0;
  for (const key of keys) {
    if (key.length > LIMITS.keyLength || !KEY_SHAPE.test(key) || !key.startsWith(KEY_PREFIX))
      return bad("That file has items that do not belong to the lab.");
    if (typeof data[key] !== "string") return bad("That file has an item the lab cannot read.");
    chars += data[key].length;
  }
  if (chars > LIMITS.chars) return bad("That file is too large to be a lab backup.");
  return { ok: true, count: keys.length, chars };
}

/** What is arriving, in words a learner can check: kinds of work and counts, never the answers themselves. */
export function summarizeTransfer(payload) {
  const check = validateTransfer(payload);
  if (!check.ok) return check;
  const names = Object.keys(payload.data).map((key) =>
    key.slice(KEY_PREFIX.length).replace(/^v\d+:/, ""),
  );
  const families = [...new Set(names.map((name) => name.split(":")[0]))].sort();
  const already = Object.keys(payload.data).filter((key) => storage.get(key) !== null).length;
  return { ok: true, count: check.count, families, already, from: payload.from || "" };
}

/** Add the incoming work. Records already on this device are kept; known families merge, others are added only if absent. */
export function applyTransfer(payload) {
  const check = validateTransfer(payload);
  if (!check.ok) throw new Error(check.error);
  const merged = importProgressData(payload.data);
  let added = 0;
  for (const [key, value] of Object.entries(payload.data)) {
    if (storage.get(key) !== null) continue;
    storage.set(key, value);
    added++;
  }
  return { merged, added };
}

/** Sender side: wait for the other site to say it is ready, then answer it, and only it. */
export function offerTo(peer, target, win = window) {
  const onMessage = (e) => {
    if (e.origin !== peer || e.source !== target || e.data?.type !== MSG_READY) return;
    win.removeEventListener("message", onMessage);
    target.postMessage({ type: MSG_DATA, payload: collectTransfer() }, peer);
  };
  win.addEventListener("message", onMessage);
  return () => win.removeEventListener("message", onMessage);
}

/** Receiver side: ask the opener for the data and accept only its answer. Returns a cancel function. */
export function receiveFrom(peer, onPayload, win = window) {
  const opener = win.opener;
  if (!opener) return null;
  const onMessage = (e) => {
    if (e.origin !== peer || e.source !== opener || e.data?.type !== MSG_DATA) return;
    win.removeEventListener("message", onMessage);
    onPayload(e.data.payload);
  };
  win.addEventListener("message", onMessage);
  opener.postMessage({ type: MSG_READY }, peer);
  return () => win.removeEventListener("message", onMessage);
}

/** Parse an uploaded file's text. */
export function parseTransferFile(text) {
  if (text.length > LIMITS.chars * 1.5)
    throw new Error("That file is too large to be a lab backup.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("That file is not a lab progress file.");
  }
}

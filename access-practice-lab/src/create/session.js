// Project Studio · the creation session: the packet a teacher is assembling across pages, and the last Create choice
// (source, format, adjustments) so a refresh or a browser restart reopens where the teacher stopped. Versioned, local
// to this device, never sent anywhere. Pure given `io` ({ get(key), set(key, value) }), so Node tests can drive it.

import { normalizeActivity } from "../studio/core/schema.js";
import { cleanAdjust, formatById } from "./build.js";

export const SESSION_KEY = "accessPracticeLab:v1:create";
export const SESSION_SCHEMA = "lp-create-session/1";
export const MAX_ITEMS = 12;
/** Serialized budget for the whole session: well under a browser's ~5 MB local storage, shared with the lab. */
export const MAX_BYTES = 1_500_000;

const FAMILY = /^[a-z][a-z0-9-]{1,39}$/;
const REF = /^[A-Za-z0-9_-]{1,120}$/;
const ITEM_ID = /^c[a-z0-9]{6,16}$/;

const str = (v, n = 200) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, n);

function cleanSource(s) {
  if (!s || !FAMILY.test(s.family || "") || !REF.test(s.ref || "")) return null;
  return {
    family: s.family,
    ref: s.ref,
    ...(["1_2", "3_4", "5_6"].includes(s.band) ? { band: s.band } : {}),
  };
}

function cleanItem(it) {
  if (!it || !ITEM_ID.test(it.id || "") || !it.activity) return null;
  return {
    id: it.id,
    title: str(it.title, 160) || "Untitled",
    source: cleanSource(it.source),
    format: formatById(it.format)?.id || "",
    adjust: cleanAdjust(it.adjust),
    activity: normalizeActivity(it.activity),
    addedAt: Number.isFinite(it.addedAt) ? it.addedAt : 0,
  };
}

export const emptySession = () => ({ schema: SESSION_SCHEMA, items: [], last: null, title: "" });

/** Read the session. Anything unreadable or from another schema version becomes an empty session (never throws). */
export function readSession(io) {
  let raw = null;
  try {
    raw = JSON.parse(io.get(SESSION_KEY) || "null");
  } catch {
    raw = null;
  }
  if (!raw || raw.schema !== SESSION_SCHEMA) return emptySession();
  const last =
    raw.last && cleanSource(raw.last.source)
      ? {
          source: cleanSource(raw.last.source),
          format: formatById(raw.last.format)?.id || "",
          adjust: cleanAdjust(raw.last.adjust),
          at: Number(raw.last.at) || 0,
        }
      : null;
  return {
    schema: SESSION_SCHEMA,
    items: (Array.isArray(raw.items) ? raw.items : [])
      .map(cleanItem)
      .filter(Boolean)
      .slice(0, MAX_ITEMS),
    last,
    title: str(raw.title, 120),
  };
}

/** Write the session. Returns { ok, reason } where reason is "too-large" | "storage" when the write was refused. */
export function writeSession(io, session) {
  const text = JSON.stringify(session);
  if (text.length > MAX_BYTES) return { ok: false, reason: "too-large" };
  try {
    return io.set(SESSION_KEY, text) === false ? { ok: false, reason: "storage" } : { ok: true };
  } catch {
    return { ok: false, reason: "storage" };
  }
}

const newItemId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Add a built resource to the packet. Refuses (and changes nothing) past MAX_ITEMS or the byte budget. */
export function addItem(io, { title, source, format, adjust, activity }, now = Date.now()) {
  const s = readSession(io);
  if (s.items.length >= MAX_ITEMS) return { ok: false, reason: "full", session: s };
  const item = cleanItem({
    id: newItemId(),
    title: title || activity?.title,
    source,
    format,
    adjust,
    activity,
    addedAt: now,
  });
  if (!item) return { ok: false, reason: "invalid", session: s };
  const next = { ...s, items: [...s.items, item] };
  const w = writeSession(io, next);
  return w.ok ? { ok: true, item, session: next } : { ok: false, reason: w.reason, session: s };
}

export function removeItem(io, id) {
  const s = readSession(io);
  const next = { ...s, items: s.items.filter((i) => i.id !== id) };
  return { ...writeSession(io, next), session: next };
}

/** Move an item up (-1) or down (+1). Buttons, not drag: every reorder works from the keyboard. */
export function moveItem(io, id, delta) {
  const s = readSession(io);
  const i = s.items.findIndex((x) => x.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= s.items.length) return { ok: false, session: s };
  const items = [...s.items];
  [items[i], items[j]] = [items[j], items[i]];
  const next = { ...s, items };
  return { ...writeSession(io, next), session: next };
}

export function clearItems(io) {
  const next = { ...readSession(io), items: [] };
  return { ...writeSession(io, next), session: next };
}

export function setPacketTitle(io, title) {
  const next = { ...readSession(io), title: str(title, 120) };
  return { ...writeSession(io, next), session: next };
}

/** Remember the teacher's last Create choice so reopening the panel resumes it. */
export function rememberChoice(io, { source, format, adjust }, now = Date.now()) {
  const src = cleanSource(source);
  if (!src) return { ok: false };
  const next = {
    ...readSession(io),
    last: {
      source: src,
      format: formatById(format)?.id || "",
      adjust: cleanAdjust(adjust),
      at: now,
    },
  };
  return writeSession(io, next);
}

/** The remembered choice for this source, or null when the teacher last worked on something else. */
export function lastChoiceFor(io, source) {
  const { last } = readSession(io);
  return last && source && last.source.family === source.family && last.source.ref === source.ref
    ? last
    : null;
}

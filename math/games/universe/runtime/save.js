// Versioned, migration-safe storage for the Math Gaming Runtime.
//
// Three records, all local to the device and free of personal information:
//   ewl-universe:v1:game:<gameId>   level progress, last checkpoint, timeline, evidence
//   ewl-universe:v1:companion       Ori's concept states (shared by every game)
//   ewl-universe:v1:settings        language, volumes, access options, key bindings
//
// Every record carries `v`. MIGRATIONS[n] upgrades a record from version n to
// n + 1, so an older save is walked forward instead of being thrown away, and a
// save from a NEWER build than this page is left untouched and not loaded.
// Storage can be blocked (private windows, managed devices): every call fails
// soft into memory and `persistent` turns false so the shell can say so.

export const SAVE_VERSION = 1;
const PREFIX = "ewl-universe:v1:";

/** @type {Record<number, (record: any) => any>} */
export const MIGRATIONS = {};

const memory = new Map();
export const saveStatus = { persistent: true };

function read(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? (memory.get(key) ?? null) : JSON.parse(raw);
  } catch {
    saveStatus.persistent = false;
    return memory.get(key) ?? null;
  }
}

function write(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota or blocked storage: keep playing from memory.
    saveStatus.persistent = false;
  }
}

/** Walk a record forward to SAVE_VERSION; null when it cannot be used. */
export function migrate(record) {
  if (!record || typeof record !== "object" || typeof record.v !== "number") return null;
  let r = record;
  while (r.v < SAVE_VERSION) {
    const step = MIGRATIONS[r.v];
    if (!step) return null;
    r = step(r);
  }
  return r.v === SAVE_VERSION ? r : null;
}

export function emptyGameSave(gameId) {
  return {
    v: SAVE_VERSION,
    gameId,
    level: 0, // index of the level in play
    unlocked: 0, // highest level index opened
    completed: [], // level ids finished at least once
    checkpoint: null, // { level, id, snapshot, seed }
    timeline: null, // Timeline.serialize()
    evidence: null, // EvidenceLog.serialize()
    objects: {}, // student-created mathematical objects, by stable id
    achievements: [],
  };
}

export function loadGame(gameId) {
  const r = migrate(read(`game:${gameId}`));
  return r && r.gameId === gameId ? { ...emptyGameSave(gameId), ...r } : emptyGameSave(gameId);
}

export function saveGame(record) {
  write(`game:${record.gameId}`, { ...record, v: SAVE_VERSION });
}

export function loadCompanion() {
  const r = read("companion");
  return r && r.v === 1 && r.concepts ? r : null;
}

export function saveCompanion(state) {
  write("companion", state);
}

export const DEFAULT_SETTINGS = {
  v: SAVE_VERSION,
  lang: "",
  sfx: 0.8,
  music: 0.45,
  voice: 0,
  reduced: false,
  lowfx: false,
  contrast: false,
  guide: false,
  keys: null,
};

export function loadSettings() {
  const r = migrate(read("settings"));
  return { ...DEFAULT_SETTINGS, ...(r || {}) };
}

export function saveSettings(settings) {
  write("settings", { ...settings, v: SAVE_VERSION });
}

/** Every game's progress, for the arcade map. */
export function loadAll(gameIds) {
  return gameIds.map((id) => loadGame(id));
}

/**
 * Centralized versioned storage service for The Language Page premium platform.
 * Namespaces all keys under `tlp_v1_*` so legacy `accessPracticeLab:v1:*` data is never touched.
 * Enforces FERPA/COPPA zero-PII rules and safe try/catch JSON parsing.
 */

export const SCHEMA_VERSION = 1;
export const KEY_PREFIX = "tlp_v1_";

export const STORAGE_KEYS = Object.freeze({
  PREFS: `${KEY_PREFIX}prefs`,
  ENTITLEMENTS: `${KEY_PREFIX}entitlements`,
  BRIDGE: `${KEY_PREFIX}bridge`,
  ARCHITECT: `${KEY_PREFIX}architect`,
  SPEAKING: `${KEY_PREFIX}speaking`,
  RADAR: `${KEY_PREFIX}radar`,
  FAMILY_CARDS: `${KEY_PREFIX}family_cards`,
  ARCADE: `${KEY_PREFIX}arcade`,
  DIALOGUE: `${KEY_PREFIX}dialogue`,
});

const DEFAULT_STATES = {
  [STORAGE_KEYS.PREFS]: () => ({
    schemaVersion: SCHEMA_VERSION,
    role: "", // "" until the switch is pressed, then "teacher" | "student" | "family" (see ../role.js)
    theme: "light",  // "light" | "dark"
    l1: "es",        // "es" | "ar" | "zh" | "fr" | "uk" | "ru" | "pt" | "en"
    cognateSpotlight: true,
    updatedAt: null,
  }),
  [STORAGE_KEYS.ENTITLEMENTS]: () => ({
    schemaVersion: SCHEMA_VERSION,
    tier: "pro",     // "free" | "pro" | "district"
    updatedAt: null,
  }),
  [STORAGE_KEYS.BRIDGE]: () => ({
    schemaVersion: SCHEMA_VERSION,
    lastSampleId: "sci-g6-ecosystems",
    customText: "",
    activeLayers: { polysemous: true, connectors: true, syntax: true },
  }),
  [STORAGE_KEYS.ARCHITECT]: () => ({
    schemaVersion: SCHEMA_VERSION,
    completedIds: [],
    lastKlu: "Explain",
    lastKernelId: "explain-plant",
    savedSentences: [],
  }),
  [STORAGE_KEYS.SPEAKING]: () => ({
    schemaVersion: SCHEMA_VERSION,
    clips: [],
  }),
  [STORAGE_KEYS.RADAR]: () => ({
    schemaVersion: SCHEMA_VERSION,
    students: null, // null means seed from platformData
    activeSprints: {},
  }),
  [STORAGE_KEYS.FAMILY_CARDS]: () => ({
    schemaVersion: SCHEMA_VERSION,
    cards: [],
  }),
  [STORAGE_KEYS.ARCADE]: () => ({
    schemaVersion: SCHEMA_VERSION,
    solvedPhonics: [],
    solvedPairs: [],
    solvedComp: [],
    trailWins: 0,
  }),
  [STORAGE_KEYS.DIALOGUE]: () => ({
    schemaVersion: SCHEMA_VERSION,
    completedDialogues: [],
    completedCloze: [],
    reviewedCards: [],
  }),
};

const memoryFallback = new Map();

function getDefault(key) {
  const factory = DEFAULT_STATES[key];
  return factory ? factory() : { schemaVersion: SCHEMA_VERSION };
}

/**
 * Sanitize a display name into a FERPA/COPPA-safe alias (first name + last initial max).
 * Rejects emails, full multi-word last names, or numeric IDs.
 */
export function sanitizeAlias(rawName, fallback = "Student A") {
  const cleaned = String(rawName || "")
    .replace(/[^\p{L}\p{N}\s.'-]/gu, "")
    .trim();
  if (!cleaned || /@/.test(String(rawName || ""))) return fallback;
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 18);
  const first = parts[0].slice(0, 14);
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export function readStorage(key) {
  const fallback = getDefault(key);
  try {
    let raw = null;
    if (typeof localStorage !== "undefined") {
      raw = localStorage.getItem(key);
    } else if (memoryFallback.has(key)) {
      raw = memoryFallback.get(key);
    }
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.schemaVersion !== SCHEMA_VERSION) {
      return fallback;
    }
    return { ...fallback, ...parsed, schemaVersion: SCHEMA_VERSION };
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  const payload = {
    ...(value && typeof value === "object" ? value : {}),
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(payload);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, serialized);
    } else {
      memoryFallback.set(key, serialized);
    }
    return payload;
  } catch {
    memoryFallback.set(key, serialized);
    return payload;
  }
}

export function updateStorage(key, updater) {
  const current = readStorage(key);
  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  return writeStorage(key, next);
}

export function clearPlatformStorage() {
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } catch {}
    memoryFallback.delete(key);
  }
}

// One place that remembers a student's Learning Supports choices on this
// device. Everything that shows or changes a support reads it from here.
//
// Other pages kept their own copy of some of these choices before this module
// existed (the Math Workbench's "Access options", the curriculum hub's "Reading
// supports", the lesson dock's high contrast and comfort spacing). Those keys
// are PEERS: this store seeds from them once and mirrors the shared settings
// back out, so a student who sets high contrast anywhere has it everywhere,
// and none of those pages had to change to join in.
//
// Nothing here leaves the device and nothing here is about the student; it is
// display and audio comfort only. Every storage call is wrapped, because
// storage is blocked in some private windows and a support that throws on load
// is worse than no support.

export const STORAGE_KEY = "ewl-ls:v1";

/** @typedef {"auto" | "en" | "es"} ReadLang */
/**
 * @typedef {object} Prefs
 * @property {boolean} calm reduced motion, sound off, low stimulation
 * @property {boolean} focus one problem at a time
 * @property {boolean} spacing dyslexia-friendly letter, word and line spacing
 * @property {boolean} contrast high contrast
 * @property {boolean} targets larger buttons and touch targets
 * @property {boolean} voiceAnswer show the "say it" microphone on answer boxes
 * @property {boolean} offlineVoices only use voices stored on this device
 * @property {ReadLang} readLang language used for text that does not say its own
 * @property {number} rate reading speed, 0.5 to 1.5
 */

/** @type {Prefs} */
export const DEFAULTS = Object.freeze({
  calm: false,
  focus: false,
  spacing: false,
  contrast: false,
  targets: false,
  voiceAnswer: false,
  offlineVoices: false,
  readLang: "auto",
  rate: 0.9,
});

/** The three reading speeds the panel offers. */
export const RATES = Object.freeze([0.7, 0.9, 1.1]);

const BOOLEAN_KEYS = /** @type {const} */ ([
  "calm",
  "focus",
  "spacing",
  "contrast",
  "targets",
  "voiceAnswer",
  "offlineVoices",
]);

/**
 * Keep only valid values, so a hand-edited or old record can never break a page.
 * @param {unknown} raw
 * @returns {Prefs}
 */
export function sanitize(raw) {
  /** @type {Record<string, unknown>} */
  const src = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
  const out = { ...DEFAULTS };
  for (const key of BOOLEAN_KEYS) if (typeof src[key] === "boolean") out[key] = src[key];
  if (src.readLang === "auto" || src.readLang === "en" || src.readLang === "es") {
    out.readLang = src.readLang;
  }
  if (typeof src.rate === "number" && src.rate >= 0.5 && src.rate <= 1.5) out.rate = src.rate;
  return out;
}

/**
 * Pages that keep their own copy of some of these choices.
 * `read` pulls shared choices out of the peer's record; `write` puts ours back
 * without disturbing any key the peer owns alone.
 * @type {{ key: string, read: (rec: Record<string, any>) => Partial<Prefs>, write: (p: Prefs, rec: Record<string, any>) => Record<string, any> }[]}
 */
const PEERS = [
  {
    // Math Workbench "Access options" (curriculum/math-workbench/index.html).
    key: "mw_a11y",
    read: (rec) => ({
      spacing: Boolean(rec.spacing || rec.dyslexia),
      contrast: Boolean(rec.contrast),
      targets: Boolean(rec.bigui),
      calm: Boolean(rec.calm),
    }),
    write: (p, rec) => ({
      ...rec,
      spacing: p.spacing,
      dyslexia: p.spacing,
      contrast: p.contrast,
      bigui: p.targets,
      bigptr: p.targets,
      calm: p.calm,
    }),
  },
  {
    // Curriculum hub "Reading supports" (assets/curriculum-hub-pedagogy.js).
    key: "curriculumReadingPreferences:v1",
    read: (rec) => ({ contrast: rec.highContrast === true }),
    write: (p, rec) => ({ ...rec, highContrast: p.contrast }),
  },
  {
    // Practice studio comfort panel (assets/studio-comfort.js).
    key: "ewl_comfort_v1",
    read: (rec) => ({
      spacing: rec.space === "roomy",
      contrast: rec.contrast === "high",
      calm: rec.calm === true,
    }),
    write: (p, rec) => ({
      ...rec,
      space: p.spacing ? "roomy" : "normal",
      contrast: p.contrast ? "high" : "normal",
      calm: p.calm,
    }),
  },
  {
    // Lesson dock (assets/learning-supports/learning-supports.js).
    key: "ewl-supports:v1:preferences",
    read: (rec) => ({ contrast: rec.highContrast === true, spacing: rec.comfortMode === true }),
    write: (p, rec) => ({ ...rec, highContrast: p.contrast, comfortMode: p.spacing }),
  },
];

/** Every storage key whose change means a support may have changed elsewhere. */
export const SHARED_KEYS = Object.freeze([STORAGE_KEY, ...PEERS.map((p) => p.key)]);

/** @returns {Storage | null} */
function defaultStorage() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * @param {Storage | null} storage
 * @param {string} key
 * @returns {Record<string, any> | null}
 */
function readJson(storage, key) {
  try {
    const parsed = JSON.parse(storage?.getItem(key) ?? "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** @param {Partial<Prefs>} partial */
const stamp = (partial) => JSON.stringify(partial);

/**
 * @param {{ storage?: Storage | null }} [opts] storage is injectable for tests
 */
export function createPrefs({ storage = defaultStorage() } = {}) {
  /** @type {Set<(p: Prefs) => void>} */
  const listeners = new Set();
  /** @type {Record<string, string>} what each peer looked like when we last synced */
  let seen = {};
  let prefs = { ...DEFAULTS };

  /**
   * Adopt what a peer page changed since we last synced with it. The peer's
   * record is newer than ours exactly when its signature moved.
   * @param {boolean} first true when this device has no record of its own yet
   */
  function adoptPeerChanges(first) {
    for (const peer of PEERS) {
      const rec = readJson(storage, peer.key);
      if (!rec) continue;
      const theirs = peer.read(rec);
      const sig = stamp(theirs);
      const known = seen[peer.key] !== undefined;
      if (known && seen[peer.key] === sig) continue;
      if (known || first) {
        for (const [k, v] of Object.entries(theirs)) {
          // On first sight a peer's "off" only means "never set there".
          if (v === true || known) /** @type {any} */ (prefs)[k] = v;
        }
      }
      seen[peer.key] = sig;
    }
  }

  function mirrorToPeers() {
    for (const peer of PEERS) {
      const rec = readJson(storage, peer.key);
      const next = peer.write(prefs, rec ?? {});
      const implied = stamp(peer.read(next));
      // Do not create a record on a page that never asked for the support.
      if (rec || implied !== stamp(peer.read({}))) {
        try {
          storage?.setItem(peer.key, JSON.stringify(next));
        } catch {
          /* blocked storage: the choice still applies on this page */
        }
      }
      seen[peer.key] = implied;
    }
  }

  function persist() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, seen }));
    } catch {
      /* blocked storage: the choice lasts for this page only */
    }
  }

  function load() {
    const own = readJson(storage, STORAGE_KEY);
    prefs = sanitize(own);
    seen = own && typeof own.seen === "object" && own.seen ? { ...own.seen } : {};
    const before = JSON.stringify({ prefs, seen });
    adoptPeerChanges(!own);
    if (JSON.stringify({ prefs, seen }) !== before) {
      mirrorToPeers();
      persist();
    }
  }
  load();

  return {
    get: () => ({ ...prefs }),
    /** Re-read storage (another tab or page changed it) and tell listeners. */
    reload() {
      load();
      for (const fn of listeners) fn({ ...prefs });
    },
    /** @param {Partial<Prefs>} patch */
    set(patch) {
      prefs = sanitize({ ...prefs, ...patch });
      mirrorToPeers();
      persist();
      for (const fn of listeners) fn({ ...prefs });
    },
    reset() {
      prefs = { ...DEFAULTS };
      mirrorToPeers();
      persist();
      for (const fn of listeners) fn({ ...prefs });
    },
    /**
     * @param {(p: Prefs) => void} fn
     * @returns {() => void} unsubscribe
     */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

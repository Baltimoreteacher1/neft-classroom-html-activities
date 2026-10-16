// Our Class Investigation — this device's own memory.
//
// Everything a browser keeps: which class it joined, the random id that stands
// in for "this browser" (never a name), the contributions waiting to be sent
// (the offline queue), a this-device-only dataset for solo mode, and the last
// copy of the class's data so charts still draw on a bad connection.
//
// All storage access is inside try/catch and falls back to memory: private
// windows, blocked site data and thumbnail capture must degrade to "works, but
// forgets on reload", never to a blank page.
//
// No names, no free text, no timestamps finer than a contribution's own
// `createdAt`, which never leaves the device.

import { normalizeClassCode, randomHex, validateValues } from "./contract.js";
import { DEFAULT_TEMPLATE_ID, getTemplate, resolveOptions } from "./templates.js";

export const STORE_KEY = "ewl.classInvestigation.v1";
const MAX_QUEUE = 200;
const MAX_SOLO = 300;

/** localStorage when it works, an in-memory stand-in when it does not. */
export function safeStorage() {
  try {
    const probe = "__ewl_ci_probe__";
    globalThis.localStorage.setItem(probe, "1");
    globalThis.localStorage.removeItem(probe);
    return globalThis.localStorage;
  } catch {
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => void mem.set(k, String(v)),
      removeItem: (k) => void mem.delete(k),
    };
  }
}

const fresh = (cryptoImpl) => ({
  v: 1,
  clientId: randomHex(16, cryptoImpl),
  mode: "solo",
  code: "",
  templateId: DEFAULT_TEMPLATE_ID,
  options: {},
  queue: [],
  solo: {},
  cache: null,
});

/**
 * @param {Storage | ReturnType<typeof safeStorage>} storage
 * @param {{ key?: string, crypto?: Crypto, now?: () => number }} [opts]
 */
export function createStore(storage = safeStorage(), opts = {}) {
  const key = opts.key ?? STORE_KEY;
  const cryptoImpl = opts.crypto ?? globalThis.crypto;
  const now = opts.now ?? (() => Date.now());

  let state = fresh(cryptoImpl);
  try {
    const raw = storage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.v === 1 && typeof parsed.clientId === "string") {
      state = { ...state, ...parsed };
    }
  } catch {
    /* unreadable saved state: start clean rather than crash */
  }

  const save = () => {
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the in-memory state still works this session */
    }
  };

  const templateNow = () => getTemplate(state.templateId) ?? getTemplate(DEFAULT_TEMPLATE_ID);
  const optionsNow = () => resolveOptions(templateNow(), state.options);

  return {
    get state() {
      return state;
    },
    get mode() {
      return state.mode === "class" && state.code ? "class" : "solo";
    },
    options: optionsNow,

    /** Join a class by the code a teacher shared. Returns false for a malformed code. */
    joinClass(rawCode) {
      const code = normalizeClassCode(rawCode);
      if (!code) return false;
      state = { ...state, mode: "class", code, cache: null };
      save();
      return true;
    },

    /** Go back to this-device-only mode. Queued contributions are kept and still sent. */
    leaveClass() {
      state = { ...state, mode: "solo", code: "", cache: null };
      save();
    },

    /** Follow the class's active investigation (or a solo pick). */
    setInvestigation(templateId, options) {
      if (!getTemplate(templateId)) return;
      state = { ...state, templateId, options: options ?? {} };
      save();
    },

    /** "Next person": a shared Chromebook gets a new anonymous id, not a name. */
    nextPerson() {
      state = { ...state, clientId: randomHex(16, cryptoImpl) };
      save();
    },

    /** How many contributions this browser id has already made to an investigation. */
    madeBy(templateId) {
      const inQueue = state.queue.filter(
        (q) =>
          q.templateId === templateId && q.clientId === state.clientId && q.status !== "rejected",
      );
      const inSolo = (state.solo[templateId] ?? []).filter((e) => e.clientId === state.clientId);
      return inQueue.length + inSolo.length;
    },

    /**
     * Record one contribution. In class mode it joins the offline queue (sent
     * when the network allows); in solo mode it goes straight to the local data.
     * @returns {{ ok: true, entry: object } | { ok: false, error: string, field?: string }}
     */
    add({ values, source = "class" }) {
      const templateId = state.templateId;
      const template = templateNow();
      const checked = validateValues(templateId, optionsNow(), values);
      if (!checked.ok) return { ok: false, error: checked.error, field: checked.field };
      if (this.madeBy(templateId) >= template.maxPerContributor) {
        return { ok: false, error: "contributor-limit" };
      }
      const entry = {
        entryId: randomHex(12, cryptoImpl),
        code: this.mode === "class" ? state.code : "",
        templateId,
        clientId: state.clientId,
        source,
        values: checked.values,
        createdAt: now(),
        status: this.mode === "class" ? "pending" : "local",
        reason: "",
        attempts: 0,
      };
      if (this.mode === "class") {
        state = { ...state, queue: [...state.queue, entry].slice(-MAX_QUEUE) };
      } else {
        const list = [...(state.solo[templateId] ?? []), entry].slice(-MAX_SOLO);
        state = { ...state, solo: { ...state.solo, [templateId]: list } };
      }
      save();
      return { ok: true, entry };
    },

    pending() {
      return state.queue.filter((q) => q.status === "pending");
    },

    rejected() {
      return state.queue.filter((q) => q.status === "rejected");
    },

    /** Called by sync: replace a queue entry with an updated copy. */
    patchQueue(entryId, patch) {
      state = {
        ...state,
        queue: state.queue.map((q) => (q.entryId === entryId ? { ...q, ...patch } : q)),
      };
      save();
    },

    /** Drop acknowledged entries older than the newest 30; they only existed to resend. */
    trimSent() {
      const sent = state.queue.filter((q) => q.status === "sent");
      const drop = new Set(sent.slice(0, Math.max(0, sent.length - 30)).map((q) => q.entryId));
      if (!drop.size) return;
      state = { ...state, queue: state.queue.filter((q) => !drop.has(q.entryId)) };
      save();
    },

    setCache(cache) {
      state = { ...state, cache: { ...cache, fetchedAt: now() } };
      save();
    },

    /** The dataset the charts draw: [{ id, v, s, mine }], class or solo. */
    dataset(templateId = state.templateId) {
      if (this.mode === "solo") {
        return (state.solo[templateId] ?? []).map((e) => ({
          id: e.entryId,
          v: e.values,
          s: e.source,
          mine: true,
        }));
      }
      const mineIds = new Set(
        state.queue.filter((q) => q.templateId === templateId).map((q) => q.entryId),
      );
      const cached =
        state.cache && state.cache.code === state.code && state.cache.templateId === templateId
          ? state.cache.entries
          : [];
      const seen = new Set(cached.map((e) => e.id));
      const unsent = state.queue
        .filter(
          (q) =>
            q.status !== "rejected" &&
            q.templateId === templateId &&
            q.code === state.code &&
            !seen.has(q.entryId),
        )
        .map((q) => ({ id: q.entryId, v: q.values, s: q.source }));
      return [...cached, ...unsent].map((e) => ({ ...e, mine: mineIds.has(e.id) }));
    },

    /** Forget this device's local data (solo dataset, queue, class) but keep nothing identifying. */
    clearAll() {
      state = fresh(cryptoImpl);
      save();
    },

    normalizeCode: normalizeClassCode,
  };
}

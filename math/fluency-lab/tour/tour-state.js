// DOM-free logic for the Math Fluency Lab tour: saved state, first-visit rules, and launch-URL rules.
// Everything here takes its inputs as arguments so it can be tested in plain Node.

export const TOUR_KEY = "ewl-fluency-tour-v1";
export const AUDIENCES = ["student", "family"];

// Storage keys that exist on every visit (or hold settings, not practice), so they never mean "returning".
const NEUTRAL_KEYS = new Set([
  "ewl-fluency-profiles-v1",
  "ewl-fluency-lang-v1",
  "ewl-fluency-sound-v1",
  "ewl-fluency-tab-profile",
  "ewl-fluency-token",
  TOUR_KEY,
]);
const NEUTRAL_PREFIXES = ["ewl-fluency-settings-v1", "ewl-fluency-family-adventure"];
const MAX_INDEX = 99;

const cleanIndex = (value) => {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.min(MAX_INDEX, Math.max(0, number)) : 0;
};

export const defaultState = () => ({
  v: 1,
  offerDismissed: false,
  audience: null,
  steps: { student: { index: 0, done: false }, family: { index: 0, done: false } },
});

// Accepts anything (a string from storage, an object, junk) and returns a safe v1 state. Never throws.
export function parseState(raw) {
  const state = defaultState();
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return state;
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return state;
  state.offerDismissed = data.offerDismissed === true;
  state.audience = AUDIENCES.includes(data.audience) ? data.audience : null;
  for (const audience of AUDIENCES) {
    const saved = data.steps?.[audience];
    if (saved && typeof saved === "object") {
      state.steps[audience] = { index: cleanIndex(saved.index), done: saved.done === true };
    }
  }
  return state;
}

export function stateExists(storage) {
  try {
    return storage.getItem(TOUR_KEY) !== null;
  } catch {
    return false;
  }
}

export function loadState(storage) {
  try {
    return parseState(storage.getItem(TOUR_KEY));
  } catch {
    return defaultState();
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(TOUR_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// A store that survives unavailable storage: it keeps the state in memory and still tries to persist.
export function createStore(storage) {
  let state = loadState(storage);
  const persist = () => saveState(storage, state);
  const store = {
    get: () => state,
    update(change) {
      change(state);
      state = parseState(state);
      persist();
      return state;
    },
    setAudience: (audience) => store.update((s) => void (s.audience = audience)),
    dismissOffer: () => store.update((s) => void (s.offerDismissed = true)),
    setStep: (audience, index) =>
      store.update((s) => void (s.steps[audience] = { index, done: false })),
    finish: (audience, lastIndex) =>
      store.update((s) => void (s.steps[audience] = { index: lastIndex, done: true })),
    reset: (audience) => store.update((s) => void (s.steps[audience] = { index: 0, done: false })),
  };
  return store;
}

// A tour is partial when someone left it after the first step and before the last.
export const isPartial = (state, audience, count) => {
  const saved = state.steps[audience];
  return Boolean(saved) && !saved.done && saved.index > 0 && saved.index < count;
};

export const partialAudience = (state, counts) => {
  const order = state.audience ? [state.audience, ...AUDIENCES] : AUDIENCES;
  return order.find((audience) => isPartial(state, audience, counts[audience])) || null;
};

// Any saved practice, trail, reward, session or evidence key counts as "returning".
export function hasSavedProgress(keys) {
  return keys.some(
    (key) =>
      typeof key === "string" &&
      key.startsWith("ewl-fluency-") &&
      !NEUTRAL_KEYS.has(key) &&
      !NEUTRAL_PREFIXES.some((prefix) => key.startsWith(prefix)),
  );
}

// start=, skill=, view= or an assignment hash means someone arrived to do something specific.
export function hasLaunchIntent(search, hash) {
  const params = new URLSearchParams(search || "");
  if (["start", "skill", "view"].some((name) => params.has(name))) return true;
  return new URLSearchParams(String(hash || "").replace(/^#/, "")).has("assignment");
}

// ?tour=student|family is an explicit request to open that tour.
export function requestedTour(search) {
  const value = new URLSearchParams(search || "").get("tour");
  return AUDIENCES.includes(value) ? value : null;
}

export function shouldOffer({
  stateSaved,
  state,
  storageKeys,
  search,
  hash,
  workspaceVisible,
  tourOpen,
}) {
  if (stateSaved || state.offerDismissed || tourOpen || workspaceVisible) return false;
  if (hasSavedProgress(storageKeys)) return false;
  return !hasLaunchIntent(search, hash);
}

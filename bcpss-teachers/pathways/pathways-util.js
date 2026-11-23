// Small helpers shared by the Year Pathways views.

export const $ = (selector, root = document) => root.querySelector(selector);

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

export const kluClass = (klu) => `pw-klu pw-klu-${String(klu || "").toLowerCase()}`;
export const kluPill = (klu) => (klu ? `<span class="${kluClass(klu)}">${esc(klu)}</span>` : "");

export function announce(message) {
  const el = $("#pwStatus");
  if (!el) return;
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

/** Deterministic shuffle (same seed, same order) so a puzzle looks the same on reload and can be tested. */
export function seededShuffle(items, seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rand = () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const STORE_KEY = "bcpss_pathways_v1";

/** Per-device progress (units taught, game stars, cognates found). Storage may be blocked: it must never throw. */
export const store = {
  read() {
    try {
      const raw = JSON.parse(window.localStorage.getItem(STORE_KEY) || "{}");
      return { taught: raw.taught || {}, stars: raw.stars || {}, cognates: raw.cognates || {} };
    } catch {
      return { taught: {}, stars: {}, cognates: {} };
    }
  },
  write(next) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* private mode or blocked storage: progress simply isn't kept */
    }
  },
  update(mutator) {
    const data = store.read();
    mutator(data);
    store.write(data);
    return data;
  },
};

export const speak = (text) => {
  if (!("speechSynthesis" in window) || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
};

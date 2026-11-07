// Small, dependency-free helpers shared by every view.

export const BASE = "/access-practice-lab";
export const ICONS = `${BASE}/pictures/ui-icons.svg`;
export const ART = `${BASE}/pictures/ds`;
export const CORE_DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
export const LEVEL_KEYS = ["A", "B", "C"];
export const TIERS = {
  A: { name: "Starting", range: "More support", es: "Comenzando" },
  B: { name: "Growing", range: "Some support", es: "Creciendo" },
  C: { name: "Expanding", range: "More independence", es: "Ampliando" },
};
export const DOMAIN_META = {
  Listening: { icon: "listening", name: "Listening", room: "Listening practice", verb: "Listen", es: "Escuchar", blurb: "Follow directions, catch key details, and understand what you hear." },
  Reading: { icon: "reading", name: "Reading", room: "Reading practice", verb: "Read", es: "Leer", blurb: "Read short texts, find evidence, and explain the main idea." },
  Speaking: { icon: "speaking", name: "Speaking", room: "Speaking practice", verb: "Speak", es: "Hablar", blurb: "Plan what you will say, record it, and listen back." },
  Writing: { icon: "writing", name: "Writing", room: "Writing practice", verb: "Write", es: "Escribir", blurb: "Build sentences and paragraphs with words and frames you choose." },
  "Model-Test": { icon: "tests", name: "Model test", room: "Model test items", verb: "Practice", es: "Practicar", blurb: "Test-style questions to rehearse the format." },
};

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
/** Escape any value for HTML text or attribute context. */
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ESC[ch]);

/** Tagged template: interpolations are escaped unless wrapped with raw(). */
const RAW = Symbol("raw");
export const raw = (html) => ({ [RAW]: String(html ?? "") });
/** Inline SVG icon from the shared sprite (pictures/ui-icons.svg). Decorative by default. */
export const icon = (name, cls = "") =>
  raw(`<svg class="ico ${cls}" aria-hidden="true" focusable="false"><use href="${ICONS}#${name}"></use></svg>`);
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    out += render(v) + strings[i + 1];
  });
  return raw(out);
}
function render(v) {
  if (v == null || v === false) return "";
  if (Array.isArray(v)) return v.map(render).join("");
  if (typeof v === "object" && RAW in v) return v[RAW];
  return esc(v);
}
export const toHtml = (v) => render(v);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);
export const wordCount = (t) =>
  String(t || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const slug = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Grades 3–5 ids carry the g35- prefix, so a shared link always resolves its band. */
export { bandLabel, bandOfId } from "./bands.js";

export function safeJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// If device storage fails, preserve edits in this tab and tell the learner.
const volatile = new Map();
function storageWarning() {
  if (typeof document === "undefined") return;
  const node = document.getElementById("labStorageWarning");
  if (node) {
    node.hidden = !volatile.size;
    node.textContent = document.documentElement?.lang === "es"
      ? "No se pudo guardar en este dispositivo. El trabajo nuevo está solo en esta pestaña. Exporta un código de Pasaporte antes de cerrar o recargar."
      : "This device could not save your latest work. It is kept only in this tab. Export a Passport code before closing or reloading.";
  }
}
// Listeners told after every write or removal, so an opt-in feature (the class link) can notice local progress
// changing without every call site knowing about it. A listener that throws never breaks a save.
const writeListeners = new Set();
const notifyWrite = (key) => {
  for (const fn of writeListeners)
    try {
      fn(key);
    } catch {}
};
/** localStorage with explicit session fallback (private mode, blocked storage, quota). */
export const storage = {
  subscribe(fn) {
    writeListeners.add(fn);
    return () => writeListeners.delete(fn);
  },
  get isVolatile() { return volatile.size > 0; },
  refreshWarning: storageWarning,
  get(key) {
    if (volatile.has(key)) return volatile.get(key);
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      volatile.delete(key);
      storageWarning();
      notifyWrite(key);
      return true;
    } catch {
      volatile.set(key, value);
      storageWarning();
      notifyWrite(key);
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      volatile.delete(key);
    } catch { volatile.set(key, null); }
    storageWarning();
    notifyWrite(key);
  },
  keys() {
    try {
      return [...new Set([...Object.keys(localStorage), ...volatile.keys()])].filter((key) => !volatile.has(key) || volatile.get(key) !== null);
    } catch {
      return [...volatile.keys()].filter((key) => volatile.get(key) !== null);
    }
  },
};

export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function formatDate(iso, opts = { month: "short", day: "numeric" }) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, opts);
}

/** Current regular testing window, or null once it has ended. */
export function testingWindowPhase(win, today = todayISO()) {
  if (!win?.start || !win?.end) return null;
  const date = (iso) => new Date(`${iso}T12:00:00`).getTime();
  const start = date(win.start);
  const end = date(win.end);
  const now = date(today);
  if (![start, end, now].every(Number.isFinite) || end < start || now > end) return null;
  const daysAway = Math.round((start - now) / 86400000);
  if (daysAway > 0) return { phase: "upcoming", daysAway };
  return { phase: daysAway === 0 ? "starting" : "open", daysAway: 0 };
}

/**
 * The one way to tell the learner something short: a screen-reader announcement (#labLive) and a toast (#labToast).
 * `tone` is "info" (default), "success" or "warn". The toast stays while the pointer or keyboard focus is on it, so
 * nobody has to race to read it, and it has a close button. Messages never carry scores or deadlines.
 */
let toastTimer = 0;
let toastWired = false;
export function announce(message, { tone = "info" } = {}) {
  const live = document.getElementById("labLive");
  if (live) {
    // Clear first: assistive tech ignores a repeated identical string ("Not yet." twice in a row).
    live.textContent = "";
    setTimeout(() => {
      live.textContent = message;
    }, 40);
  }
  const toast = document.getElementById("labToast");
  if (!toast) return;
  // Long messages (a microphone error) need time to be read.
  const hide = () => {
    toast.hidden = true;
  };
  const arm = () => {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, Math.max(2600, 70 * String(toast.textContent).length));
  };
  toast.innerHTML = "";
  const text = document.createElement("span");
  text.className = "toast-msg";
  text.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "toast-close";
  close.textContent = "×";
  close.setAttribute("aria-label", toast.dataset.closeLabel || "Close");
  close.addEventListener("click", hide);
  toast.append(text, close);
  toast.dataset.tone = tone;
  toast.hidden = false;
  if (!toastWired) {
    toastWired = true;
    toast.addEventListener("mouseenter", () => clearTimeout(toastTimer));
    toast.addEventListener("focusin", () => clearTimeout(toastTimer));
    toast.addEventListener("mouseleave", arm);
    toast.addEventListener("focusout", arm);
  }
  arm();
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    announce("Link copied.");
    return true;
  } catch {
    announce(text);
    return false;
  }
}

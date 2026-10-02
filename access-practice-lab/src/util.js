// Small, dependency-free helpers shared by every view.

export const BASE = "/access-practice-lab";
export const CORE_DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
export const LEVEL_KEYS = ["A", "B", "C"];
export const TIERS = {
  A: { name: "Starting", range: "More support", es: "Comenzando" },
  B: { name: "Growing", range: "Some support", es: "Creciendo" },
  C: { name: "Expanding", range: "More independence", es: "Ampliando" },
};
export const DOMAIN_META = {
  Listening: { glyph: "🎧", room: "Listening Studio", verb: "Listen", es: "Escuchar" },
  Reading: { glyph: "📖", room: "Reading Room", verb: "Read", es: "Leer" },
  Speaking: { glyph: "🎤", room: "Speaking Booth", verb: "Speak", es: "Hablar" },
  Writing: { glyph: "✏️", room: "Writing Desk", verb: "Write", es: "Escribir" },
  "Model-Test": { glyph: "🧪", room: "Model Test Items", verb: "Practice", es: "Practicar" },
};

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
/** Escape any value for HTML text or attribute context. */
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ESC[ch]);

/** Tagged template: interpolations are escaped unless wrapped with raw(). */
const RAW = Symbol("raw");
export const raw = (html) => ({ [RAW]: String(html ?? "") });
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
export const bandOfId = (id) => (String(id).startsWith("g35") ? "3-5" : "6-8");
export const bandLabel = (band) => `Grades ${band.replace("-", "–")}`;

export function safeJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/** localStorage that never throws (private mode, blocked storage, quota). */
export const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
  keys() {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
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

/** Announce a short status message to screen readers and the toast area. */
let toastTimer = 0;
export function announce(message) {
  const live = document.getElementById("labLive");
  if (live) live.textContent = message;
  const toast = document.getElementById("labToast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
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

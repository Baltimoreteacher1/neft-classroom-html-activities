// Shared browser helpers for the front layer: storage that survives blocked localStorage, speech, i18n,
// toasts, downloads, clipboard and compact URL-safe encoding for share links. No network calls.

/** localStorage wrapper that falls back to memory when storage is blocked (private mode, school policies). */
export const store = {
  _memory: {},
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(`lp:${key}`);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return key in this._memory ? this._memory[key] : fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`lp:${key}`, JSON.stringify(value));
    } catch {
      this._memory[key] = value;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(`lp:${key}`);
    } catch {
      delete this._memory[key];
    }
  },
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function readJson(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

/* ---------- interface language ---------- */
let dict = null;
export function uiLang() {
  return document.documentElement.getAttribute("data-ui-lang") === "es" ? "es" : "en";
}
export function tr(key, fallback = "") {
  dict ||= readJson("lp-i18n") || {};
  const entry = dict[key];
  if (!entry) return fallback;
  return entry[uiLang()] || entry.en || fallback;
}

/* ---------- toast ---------- */
let toastTimer;
export function toast(message) {
  const el = document.querySelector("[data-toast]");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2600);
}

/* ---------- speech ---------- */
export const speech = {
  supported: typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
  voices() {
    if (!this.supported) return [];
    return speechSynthesis.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang));
  },
  pickVoice() {
    const wanted = store.get("voice");
    const list = this.voices();
    return list.find((v) => v.name === wanted) || list.find((v) => /en-US/i.test(v.lang)) || list[0] || null;
  },
  rate() {
    return Number(store.get("rate", 0.9)) || 0.9;
  },
  /** Speak text; resolves when finished or stopped. onBoundary gets charIndex for highlighting. */
  speak(text, { rate, onStart, onEnd } = {}) {
    if (!this.supported || !text) return Promise.resolve(false);
    speechSynthesis.cancel();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      const voice = this.pickVoice();
      if (voice) u.voice = voice;
      u.lang = voice?.lang || "en-US";
      u.rate = rate || this.rate();
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        onEnd?.();
        resolve(true);
      };
      // Some devices never fire onend (no voices installed, a stalled engine). Never leave a button stuck on "Stop".
      const words = String(text).split(/\s+/).length;
      const watchdog = setTimeout(finish, ((words / 2.3) * 1000) / (u.rate || 1) + 3000);
      u.onstart = () => onStart?.();
      u.onend = u.onerror = finish;
      speechSynthesis.speak(u);
    });
  },
  /** Speak a list of chunks in order (keeps long passages from being cut off by some engines). */
  async speakChunks(chunks, opts = {}) {
    this._stop = false;
    for (const chunk of chunks) {
      if (this._stop) break;
      opts.onChunk?.(chunk);
      await this.speak(chunk.text ?? chunk, opts);
    }
    opts.onDone?.();
  },
  stop() {
    this._stop = true;
    if (this.supported) speechSynthesis.cancel();
  },
};

/* ---------- files and clipboard ---------- */
export function download(name, content, type = "text/html") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(tr("tool.copied", "Copied"));
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    ta.remove();
    toast(ok ? tr("tool.copied", "Copied") : "Select the text and copy it.");
    return ok;
  }
}

/** Print one region of the page: every element outside it is hidden for the print, then restored. */
export function printOnly(target) {
  const hidden = [];
  let node = target;
  while (node && node !== document.body) {
    for (const sib of node.parentElement?.children || []) {
      if (sib !== node && !sib.classList.contains("print-hide-temp")) {
        sib.classList.add("print-hide-temp");
        hidden.push(sib);
      }
    }
    node = node.parentElement;
  }
  const wasHidden = target.hidden;
  target.hidden = false;
  target.classList.add("print-target");
  const restore = () => {
    for (const el of hidden) el.classList.remove("print-hide-temp");
    target.hidden = wasHidden;
    target.classList.remove("print-target");
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
  setTimeout(restore, 1500);
}

/* ---------- share-link encoding: JSON -> deflate -> base64url (falls back to plain base64url) ---------- */
const b64url = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64url = (str) => {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};
async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}
export async function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === "function") {
    try {
      return `z${b64url(await pipe(bytes, new CompressionStream("deflate-raw")))}`;
    } catch {}
  }
  return `p${b64url(bytes)}`;
}
export async function decodeShare(code) {
  if (!code || code.length < 2) return null;
  try {
    const kind = code[0];
    let bytes = unb64url(code.slice(1));
    if (kind === "z") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    else if (kind !== "p") return null;
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** Parse pasted spreadsheet text (tab- or comma-separated, quoted fields allowed) into rows. */
export function parseTable(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines.some((l) => l.includes("\t")) ? "\t" : ",";
  return lines.map((line) => {
    if (sep === "\t") return line.split("\t").map((c) => c.trim());
    const cells = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") {
        cells.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

/** Debounced draft saver: `saveDraft("game-maker", data)`. */
const timers = {};
const pending = {};
const writeDraft = (key) => {
  if (!(key in pending)) return;
  store.set(`draft:${key}`, { savedAt: Date.now(), data: pending[key] });
  delete pending[key];
};
export function saveDraft(key, data, { quiet = false } = {}) {
  clearTimeout(timers[key]);
  pending[key] = data;
  timers[key] = setTimeout(() => {
    writeDraft(key);
    if (!quiet) {
      const el = document.querySelector("[data-draft-status]");
      if (el) el.textContent = tr("tool.draftSaved", "Draft saved on this device");
    }
  }, 400);
}
// A draft typed in the last 400 ms is written when the page is hidden or closed, so it is never lost.
addEventListener("pagehide", () => {
  for (const key of Object.keys(pending)) writeDraft(key);
});
export const loadDraft = (key) => store.get(`draft:${key}`)?.data ?? null;
export const clearDraft = (key) => store.remove(`draft:${key}`);

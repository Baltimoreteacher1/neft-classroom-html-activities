// Site chrome for every front-layer page: mobile menu, Display panel (text size, colors, font, spacing,
// line focus, tap-to-hear, voice), English/Spanish interface, read-aloud, and the offline service worker.
import { $, $$, readJson, speech, store, toast, tr, uiLang } from "./lib.js";

const root = document.documentElement;

/* ---------- mobile menu ---------- */
const menuBtn = $("[data-menu]");
const nav = $("#site-nav");
menuBtn?.addEventListener("click", () => {
  const open = menuBtn.getAttribute("aria-expanded") !== "true";
  menuBtn.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("open", open);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav?.classList.contains("open")) {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.focus();
  }
});

/* ---------- interface language ---------- */
const strings = readJson("lp-i18n") || {};
const english = new Map();
function applyLang(lang) {
  for (const el of $$("[data-i18n]")) {
    const key = el.getAttribute("data-i18n");
    if (!english.has(el)) english.set(el, el.textContent);
    const s = strings[key];
    el.textContent = lang === "es" && s?.es ? s.es : (english.get(el) ?? s?.en ?? el.textContent);
  }
  for (const el of $$("[data-i18n-label]")) {
    const s = strings[el.getAttribute("data-i18n-label")];
    if (!el.dataset.enLabel) el.dataset.enLabel = el.getAttribute("aria-label") || "";
    el.setAttribute("aria-label", lang === "es" && s?.es ? s.es : el.dataset.enLabel);
  }
  for (const el of $$("[data-i18n-placeholder]")) {
    const s = strings[el.getAttribute("data-i18n-placeholder")];
    if (!el.dataset.enPh) el.dataset.enPh = el.getAttribute("placeholder") || "";
    el.setAttribute("placeholder", lang === "es" && s?.es ? s.es : el.dataset.enPh);
  }
  root.lang = lang;
  // Right-to-left interface languages (Arabic, Dari, Pashto, Urdu) flip the layout (the design system uses logical properties for it).
  root.dir = ["ar", "fa", "prs", "ps", "ur"].includes(lang) ? "rtl" : "ltr";
  if (lang === "es") root.setAttribute("data-ui-lang", "es");
  else root.removeAttribute("data-ui-lang");
  const toggle = $("[data-lang-toggle]");
  if (toggle) toggle.lang = lang === "es" ? "en" : "es";
  for (const n of $$("[data-es-note]")) n.hidden = lang !== "es";
  // Practice content is English on purpose; mark it so screen readers keep the English voice.
  for (const el of $$("[data-content-en]")) el.lang = "en";
  document.dispatchEvent(new CustomEvent("lp:lang", { detail: { lang } }));
}
$("[data-lang-toggle]")?.addEventListener("click", () => {
  const next = uiLang() === "es" ? "en" : "es";
  store.set("lang", next);
  applyLang(next);
});
if (uiLang() === "es") applyLang("es");

/* ---------- display panel ---------- */
const DEFAULTS = {
  size: "18",
  theme: "light",
  font: "standard",
  spacing: "normal",
  ruler: "off",
  tapHear: "off",
};
const display = { ...DEFAULTS, ...(store.get("display", {}) || {}) };
const dialog = $("#display-dialog");
let lastOpener = null;

function applyDisplay() {
  root.style.setProperty("--fs-base", `${display.size}px`);
  if (display.theme === "light") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", display.theme);
  root.toggleAttribute("data-font", display.font === "readable");
  if (display.font === "readable") root.setAttribute("data-font", "readable");
  if (display.spacing === "roomy") root.setAttribute("data-spacing", "roomy");
  else root.removeAttribute("data-spacing");
  if (display.tapHear === "on") root.setAttribute("data-tap-hear", "on");
  else root.removeAttribute("data-tap-hear");
  setRuler(display.ruler === "on");
  for (const group of $$("[data-setting]", dialog || document)) {
    for (const b of $$("button", group))
      b.setAttribute("aria-pressed", String(b.dataset.value === display[group.dataset.setting]));
  }
}
function saveDisplay() {
  store.set("display", display);
  applyDisplay();
}
for (const group of $$("[data-setting]")) {
  group.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-value]");
    if (!b) return;
    display[group.dataset.setting] = b.dataset.value;
    saveDisplay();
  });
}
for (const opener of $$("[data-open-display]")) {
  opener.addEventListener("click", () => {
    lastOpener = opener;
    fillVoices();
    if (dialog?.showModal) dialog.showModal();
  });
}
dialog?.addEventListener("close", () => lastOpener?.focus());
$("[data-close]", dialog || document)?.addEventListener("click", () => dialog.close());
$("[data-reset-display]")?.addEventListener("click", () => {
  Object.assign(display, DEFAULTS);
  store.remove("voice");
  store.remove("rate");
  saveDisplay();
  toast(tr("display.reset", "Reset all"));
});

/* ---------- voice + rate ---------- */
const voiceSelect = $("#voice-select");
const rateRange = $("#rate-range");
function fillVoices() {
  if (!voiceSelect) return;
  const voices = speech.voices();
  voiceSelect.innerHTML = "";
  if (!voices.length) {
    const o = document.createElement("option");
    o.textContent = speech.supported
      ? "Device voice"
      : "Read-aloud is not available in this browser";
    voiceSelect.append(o);
    voiceSelect.disabled = !speech.supported;
    return;
  }
  const chosen = speech.pickVoice();
  for (const v of voices) {
    const o = document.createElement("option");
    o.value = v.name;
    o.textContent = `${v.name} (${v.lang})`;
    o.selected = chosen?.name === v.name;
    voiceSelect.append(o);
  }
}
if (speech.supported) speechSynthesis.addEventListener?.("voiceschanged", fillVoices);
voiceSelect?.addEventListener("change", () => store.set("voice", voiceSelect.value));
if (rateRange) {
  rateRange.value = String(speech.rate());
  rateRange.addEventListener("change", () => store.set("rate", Number(rateRange.value)));
}

/* ---------- read aloud ---------- */
const readBtn = $("[data-read-page]");
let reading = false;
let lit = null;
const light = (el) => {
  lit?.classList.remove("speaking-now");
  lit = el;
  el?.classList.add("speaking-now");
};
function readableBlocks() {
  const main = $("main");
  return $$("h1, h2, h3, p, li, td, th, blockquote, .q-stem, .choice", main).filter(
    (el) =>
      el.offsetParent !== null &&
      el.textContent.trim() &&
      !el.closest("[aria-hidden='true'], .no-read, dialog, .teacher-only[hidden]"),
  );
}
function stopReading() {
  speech.stop();
  reading = false;
  light(null);
  if (readBtn)
    readBtn.querySelector("[data-i18n]").textContent = tr(
      "display.readPage",
      "Read this page aloud",
    );
}
readBtn?.addEventListener("click", () => {
  if (!speech.supported) return toast("Read-aloud is not available in this browser.");
  if (reading) return stopReading();
  dialog?.close();
  reading = true;
  readBtn.querySelector("[data-i18n]").textContent = tr("display.stopReading", "Stop reading");
  const blocks = readableBlocks().map((el) => ({
    el,
    text: el.textContent.replace(/\s+/g, " ").trim(),
  }));
  speech.speakChunks(blocks, { onChunk: (c) => light(c.el), onDone: () => stopReading() });
});
// Tap to hear: a click on a sentence or paragraph inside main reads it (when the setting is on).
document.addEventListener("click", (e) => {
  if (root.getAttribute("data-tap-hear") !== "on" || !speech.supported) return;
  if (e.target.closest("a, button, input, textarea, select, label, summary, dialog")) return;
  const el = e.target.closest(
    "main .sentence, main p, main li, main td, main h1, main h2, main h3",
  );
  if (!el) return;
  light(el);
  speech.speak(el.textContent.replace(/\s+/g, " ").trim(), { onEnd: () => light(null) });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && reading) stopReading();
});

/* ---------- any element with data-say reads its text aloud ---------- */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-say]");
  if (!b) return;
  if (!speech.supported) return toast("Read-aloud is not available in this browser.");
  speech.speak(b.getAttribute("data-say"));
});

/* ---------- progress on this device: a "Done" chip on practice set cards ---------- */
for (const card of $$("[data-set-card]")) {
  const done = store.get(`done:${card.dataset.setCard}`);
  if (!done) continue;
  const chip = document.createElement("span");
  chip.className = "chip done-chip";
  chip.textContent = done.total
    ? `${tr("practice.doneChip", "Done")} ✓ ${done.right}/${done.total}`
    : `${tr("practice.doneChip", "Done")} ✓`;
  card.querySelector(".meta")?.prepend(chip);
}

/* ---------- print buttons and tabs (shared components) ---------- */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-print]")) window.print();
});
for (const tabs of $$("[data-tabs]")) {
  const list = $("[role=tablist]", tabs);
  const tabButtons = $$("[role=tab]", list);
  const select = (tab, focus) => {
    for (const t of tabButtons) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    }
    if (focus) tab.focus();
  };
  list.addEventListener("click", (e) => {
    const t = e.target.closest("[role=tab]");
    if (t) select(t, false);
  });
  list.addEventListener("keydown", (e) => {
    const i = tabButtons.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabButtons.length - 1 }[
      e.key
    ];
    if (next === undefined) return;
    e.preventDefault();
    select(tabButtons[(next + tabButtons.length) % tabButtons.length], true);
  });
}

/* ---------- line focus (reading ruler) ---------- */
const rTop = $("[data-ruler-top]");
const rBottom = $("[data-ruler-bottom]");
let rulerY = window.innerHeight / 2;
function drawRuler() {
  const band = Math.round(parseFloat(getComputedStyle(root).fontSize) * 2.4);
  rTop.style.top = "0px";
  rTop.style.height = `${Math.max(0, rulerY - band / 2)}px`;
  rBottom.style.top = `${rulerY + band / 2}px`;
  rBottom.style.bottom = "0px";
}
function onMove(e) {
  rulerY = e.clientY ?? rulerY;
  drawRuler();
}
function onFocus(e) {
  const r = e.target.getBoundingClientRect?.();
  if (r) {
    rulerY = r.top + r.height / 2;
    drawRuler();
  }
}
function setRuler(on) {
  if (!rTop) return;
  rTop.hidden = rBottom.hidden = !on;
  if (on) {
    drawRuler();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("focusin", onFocus);
  } else {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("focusin", onFocus);
  }
}

applyDisplay();

/* ---------- Quick Find (Ctrl/Cmd+K or "/") ---------- */
const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const quickFind = (from) => import("./palette.js").then((m) => m.openPalette(from));
// Warm the module while idle so Ctrl+K opens at once and the first typed letters land in the box.
(window.requestIdleCallback || ((f) => setTimeout(f, 2000)))(() =>
  import("./palette.js").catch(() => {}),
);
document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  const slash = e.key === "/" && !typing(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey;
  if ((k === "k" && (e.metaKey || e.ctrlKey)) || slash) {
    e.preventDefault();
    quickFind(document.activeElement);
  }
});
for (const a of $$(".search-btn, .nav-search a")) {
  a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // keep "open in new tab"
    e.preventDefault();
    quickFind(a);
  });
}

/* ---------- project a tool's result: [data-project-target="<selector>"] puts that panel full screen ---------- */
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-project-target]");
  if (!btn) return;
  const target = $(btn.dataset.projectTarget);
  if (!target) return;
  if (document.fullscreenElement || target.classList.contains("projecting")) {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    target.classList.remove("projecting");
    root.classList.remove("project-mode");
    return;
  }
  target.classList.add("projecting");
  root.classList.add("project-mode");
  try {
    await target.requestFullscreen();
  } catch {
    // No Fullscreen API (some iPads): the larger type and hidden chrome still apply; Esc or the button exits.
  }
});
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) return;
  for (const el of $$(".projecting")) el.classList.remove("projecting");
  root.classList.remove("project-mode");
});

/* ---------- My class: every tool opens with the teacher's class filled in ---------- */
// The tool's own draft time, read now: site.js runs before the tool's module, which re-saves its draft on first
// render. Read after the lazy import instead, every draft looked newer than My class and nothing was filled.
const draftAtLoad = Object.fromEntries(
  $$("[data-tool]").map((el) => [
    el.dataset.tool,
    store.get(`draft:${el.dataset.tool}`)?.savedAt || 0,
  ]),
);
if ($("[data-tool]") || $("[data-class-profile]"))
  import("./class-profile.js").then((m) => m.start?.(draftAtLoad));

/* ---------- offline: cache the front layer after the first visit ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("/lp/sw.js", { scope: "/" }).catch(() => {});
}

/**
 * Family Studio: the Understand · Practice · Play layer over a family homework page.
 *
 * The page ships only three buttons (scripts/lib/homework-studio.mjs). This module loads the first
 * time one is pressed, or when a link opens the page with ?view=understand / #understand (the old
 * lesson-guide URLs redirect there). Understand and Play open in one full-screen sheet built from
 * the lesson's own sidecar (/data/family-homework-notes/<id>.json, already public); Practice is the
 * page's own five steps, and every practice problem gets a picture of its givens (picture.mjs) when
 * the engine can read the problem without guessing.
 *
 *   openStudio("understand" | "play", { chapter })
 *   decoratePractice()   pictures under the Your Turn problems (idempotent)
 *
 * Nothing leaves the device.
 */
import { bi, bilingualPicture, el, langMode, lessonId, pictureBox } from "./kit.mjs";
import { buildPlay } from "./play.mjs";
import { buildUnderstand, CHAPTERS } from "./understand.mjs";

const CSS_HREF = new URL("./studio.css", import.meta.url).href;

let notesPromise = null;
function loadNotes() {
  const id = lessonId();
  if (!notesPromise) {
    notesPromise = id
      ? fetch(`/data/family-homework-notes/${id}.json`, { credentials: "same-origin" })
          .then((r) => (r.ok ? r.json() : {}))
          .catch(() => ({}))
      : Promise.resolve({});
  }
  return notesPromise;
}

let picturePromise = null;
export function loadPicture() {
  if (!picturePromise) {
    picturePromise = import("./picture.mjs").then((m) => m.pictureFor).catch(() => null);
  }
  return picturePromise;
}

function ensureCss() {
  if (document.querySelector("link[data-fs-css]")) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = CSS_HREF;
  l.setAttribute("data-fs-css", "");
  document.head.appendChild(l);
}

/* ── The sheet ─────────────────────────────────────────────────────── */
const MODES = [
  { id: "understand", icon: "📖", en: "Understand", es: "Entender" },
  { id: "practice", icon: "✏️", en: "Practice", es: "Practicar" },
  { id: "play", icon: "🎲", en: "Play", es: "Jugar" },
];

let sheet = null;
let opener = null;
const ctx = {
  id: lessonId(),
  lang: langMode,
  explainer: null,
  loadPicture,
  /* Close the sheet, then hand off to one of the page's own stops. */
  leaveTo(fn) {
    closeStudio();
    setTimeout(fn, 0);
  },
};

function shell() {
  if (sheet) return sheet;
  sheet = document.createElement("dialog");
  sheet.className = "fs-sheet";
  sheet.id = "fs_sheet";
  sheet.setAttribute("aria-labelledby", "fs_sheet_title");
  sheet.innerHTML =
    `<div class="fs-head"><p class="fs-head-title" id="fs_sheet_title">${bi("Family Math Studio", "Estudio familiar de matemáticas")}</p>` +
    `<button type="button" class="fs-close" data-fs-close><span aria-hidden="true">✕</span><span class="fs-sr">${bi("Close", "Cerrar")}</span></button></div>` +
    `<nav class="fs-modes" aria-label="Studio">${MODES.map((m) => `<button type="button" class="fs-mode" data-fs-mode="${m.id}"><span aria-hidden="true">${m.icon}</span> ${bi(m.en, m.es)}</button>`).join("")}</nav>` +
    `<nav class="fs-chips" aria-label="Chapters" hidden></nav>` +
    `<div class="fs-body" data-fs-body tabindex="-1"></div>` +
    `<p class="fs-sr" aria-live="polite" data-fs-live></p>`;
  sheet.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (t.closest("[data-fs-close]")) closeStudio();
    const m = t.closest("[data-fs-mode]");
    if (m) {
      const mode = m.getAttribute("data-fs-mode");
      if (mode === "practice") closeStudio();
      else render(mode);
    }
    const chip = t.closest("[data-fs-chip]");
    if (chip) {
      const target = sheet.querySelector(`#fs_ch_${chip.getAttribute("data-fs-chip")}`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      target?.querySelector("h3")?.focus?.();
    }
  });
  sheet.addEventListener("close", () => {
    window.hwVoice?.stop?.();
    document.body.classList.remove("fs-open");
    opener?.focus?.();
  });
  document.body.appendChild(sheet);
  return sheet;
}

function setMode(mode) {
  for (const b of sheet.querySelectorAll("[data-fs-mode]")) {
    const on = b.getAttribute("data-fs-mode") === mode;
    b.classList.toggle("is-on", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  }
}

async function render(mode, chapter) {
  setMode(mode);
  const body = sheet.querySelector("[data-fs-body]");
  const chips = sheet.querySelector(".fs-chips");
  body.setAttribute("aria-busy", "true");
  body.innerHTML = `<p class="fs-loading">${bi("Getting tonight's lesson ready…", "Preparando la lección de hoy…")}</p>`;
  const notes = await loadNotes();
  ctx.explainer?.destroy?.();
  ctx.explainer = null;
  ctx.model?.destroy?.();
  ctx.model = null;
  const parts = mode === "play" ? buildPlay(notes, ctx) : buildUnderstand(notes, ctx);
  body.innerHTML = "";
  if (!parts.length) {
    body.innerHTML = `<p>${bi("This lesson's family notes are not available right now. The practice steps still work.", "Los apuntes de esta lección no están disponibles ahora. Los pasos de práctica sí funcionan.")}</p>`;
  }
  for (const p of parts) body.appendChild(p);
  if (mode === "understand") {
    const done = el(
      "div",
      "fs-next",
      `<p>${bi("Ready? Now try it together.", "¿Listos? Ahora inténtenlo juntos.")}</p>`,
    );
    const go = el("button", "fs-btn fs-btn-primary", `✏️ ${bi("Start practice", "Empezar a practicar")}`);
    go.type = "button";
    go.addEventListener("click", () => ctx.leaveTo(() => window.switchHomeworkTab?.("explore")));
    done.appendChild(go);
    body.appendChild(done);
    const present = CHAPTERS.filter((c) => body.querySelector(`#fs_ch_${c.id}`));
    chips.innerHTML = present
      .map((c) => `<button type="button" class="fs-chip" data-fs-chip="${c.id}"><span aria-hidden="true">${c.icon}</span> ${bi(c.en, c.es)}</button>`)
      .join("");
    chips.hidden = present.length < 2;
  } else {
    chips.hidden = true;
  }
  body.removeAttribute("aria-busy");
  body.scrollTop = 0;
  if (chapter) body.querySelector(`#fs_ch_${chapter}`)?.scrollIntoView({ block: "start" });
}

export function openStudio(mode = "understand", { chapter } = {}) {
  ensureCss();
  shell();
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (!sheet.open) {
    sheet.showModal();
    document.body.classList.add("fs-open");
  }
  return render(mode === "play" ? "play" : "understand", chapter);
}

export function closeStudio() {
  if (sheet?.open) sheet.close();
}

/* ── Practice: a picture under each problem the engine can read ────── */
export async function decoratePractice() {
  const pictureFor = await loadPicture();
  if (!pictureFor) return 0;
  ensureCss();
  let added = 0;
  for (const sec of document.querySelectorAll(".problem-section")) {
    if (sec.hasAttribute("data-fs-pic")) continue;
    sec.setAttribute("data-fs-pic", "");
    const stem = sec.querySelector(".problem-stem");
    const en = stem?.querySelector(".lang-en")?.textContent || stem?.textContent || "";
    const topic = sec.querySelector("[data-topic]")?.getAttribute("data-topic") || "";
    let pic = null;
    try {
      pic = bilingualPicture(pictureFor, en.trim(), { topic });
    } catch (_) {
      pic = null;
    }
    if (!pic?.svg) continue;
    stem.after(pictureBox(pic, "fs-pic-problem"));
    added++;
  }
  return added;
}

/* Deep links: the redirected lesson guides land on ?view=understand. */
export function openFromUrl() {
  const q = new URLSearchParams(location.search);
  const view = q.get("view") || location.hash.replace(/^#/, "");
  if (view === "understand" || view === "play") openStudio(view, { chapter: q.get("chapter") || undefined });
}

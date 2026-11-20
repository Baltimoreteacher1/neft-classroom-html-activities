/* weekly-sheet.js — the digital Weekly Family Practice Sheet.
 * Reads weeks.json (built from the pacing plan), renders the shared sheet, and keeps the family's
 * checkmarks on THIS device only (localStorage). Nothing is sent anywhere. */
import { LANGS, renderSheet, weekRange } from "./sheet-render.js";
import { todayIso, weekFor } from "./week-pick.js";

const CHROME = {
  en: {
    back: "Family Connections",
    heading: "Weekly Family Practice",
    intro: "Optional practice. No grades. A few minutes together helps.",
    weekLabel: "Week",
    pdf: "Download this week (PDF)",
    print: "Print this week",
    all: "Download every week (PDF)",
    privacy: "Your checkmarks stay on this device. Nothing is sent to the school.",
    progress: (n, total) => `${n} of ${total} night${total === 1 ? "" : "s"} checked`,
    replayTitle: "This week’s replay",
    replayLine: (n, total) => `We practiced ${n} of ${total} night${total === 1 ? "" : "s"} this week.`,
    shareBtn: "Share a note (optional)",
    shareCopied: "Copied! Paste into ClassDojo or a text.",
    shareText: (n, total) => `We practiced Grade 6 math ${n} of ${total} nights this week on Family Math Studio!`,
  },
  es: {
    back: "Conexión con las familias",
    heading: "Práctica familiar semanal",
    intro: "Práctica opcional. Sin calificaciones. Unos minutos juntos ayudan.",
    weekLabel: "Semana",
    pdf: "Descargar esta semana (PDF)",
    print: "Imprimir esta semana",
    all: "Descargar todas las semanas (PDF)",
    privacy: "Sus marcas se quedan en este dispositivo. No se envía nada a la escuela.",
    progress: (n, total) => `${n} de ${total} noche${total === 1 ? "" : "s"} marcada${n === 1 ? "" : "s"}`,
    replayTitle: "Resumen de la semana",
    replayLine: (n, total) => `Practicamos ${n} de ${total} noche${total === 1 ? "" : "s"} esta semana.`,
    shareBtn: "Compartir una nota (opcional)",
    shareCopied: "¡Copiado! Péguenlo en ClassDojo o en un mensaje.",
    shareText: (n, total) => `¡Practicamos matemáticas de 6.º grado ${n} de ${total} noches esta semana en Family Math Studio!`,
  },
};

const $ = (id) => document.getElementById(id);
const store = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "null");
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private window or blocked storage: the sheet still works for this visit */
    }
  },
};

const data = await fetch("./weeks.json").then((response) => response.json());
const { weeks } = data;

const params = new URLSearchParams(location.search);
let lang = LANGS.includes(params.get("lang")) ? params.get("lang") : store.get("ws:lang");
if (!LANGS.includes(lang)) lang = navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
let week = weeks.find((w) => w.start === params.get("week")) ?? weekFor(weeks, params.get("on") ?? todayIso());

const stateKey = () => `ws:v1:${week.start}`;
let state = {};
const loadState = () => {
  state = store.get(stateKey()) ?? {};
  state.done ??= {};
  state.initials ??= {};
  state.checkedAt ??= {};
};
const save = () => store.set(stateKey(), state);
const doneCount = () => week.nights.filter((date) => state.done[date]).length;

function paintChrome() {
  document.documentElement.lang = lang;
  const copy = CHROME[lang];
  for (const el of document.querySelectorAll("[data-t]")) el.textContent = copy[el.dataset.t];
  for (const button of document.querySelectorAll("[data-lang]")) button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  const suffix = lang === "es" ? "-es" : "";
  $("wp-pdf").href = `./downloads/week-${week.start}${suffix}.pdf`;
  $("wp-all").href = `./downloads/all-weeks${suffix}.pdf`;
  $("wp-week").innerHTML = weeks.map((w) => `<option value="${w.start}"${w === week ? " selected" : ""}>${weekRange(w, lang).replace(/, \d{4}$| de \d{4}$/, "")}</option>`).join("");
}

function paintProgress() {
  const n = doneCount();
  const total = week.nights.length;
  const copy = CHROME[lang];
  const box = $("wp-progress");
  box.dataset.met = String(total > 0 && n >= total);
  box.innerHTML = `${copy.progress(n, total)}<div class="wp-dots" aria-hidden="true">${week.nights
    .map((date) => `<span class="wp-dot" data-on="${Boolean(state.done[date])}"></span>`)
    .join("")}</div>`;
}

function paintSheet() {
  $("sheet").innerHTML = renderSheet(week, lang, state);
}

function paintReplay() {
  const box = $("wp-replay");
  if (!box) return;
  const doneDates = week.nights.filter((date) => state.done[date]);
  if (!doneDates.length) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }
  const copy = CHROME[lang];
  const locale = lang === "es" ? "es-US" : "en-US";
  const fmt = (iso) => new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  const byDate = new Map(week.days.map((d) => [d.date, d]));
  const items = doneDates
    .map((date) => {
      const d = byDate.get(date);
      const label = d?.status === "lesson" ? `Lesson ${d.label}` : "";
      return `<li>✓ ${fmt(date)}${label ? ` · ${label}` : ""}</li>`;
    })
    .join("");
  box.hidden = false;
  box.innerHTML = `<h2 id="wp-replay-title">${copy.replayTitle}</h2>
    <p>${copy.replayLine(doneDates.length, week.nights.length)}</p>
    <ul>${items}</ul>
    <div class="wp-replay-actions">
      <button type="button" class="wp-btn" id="wp-share">${copy.shareBtn}</button>
      <span class="wp-share-status" id="wp-share-status" role="status" aria-live="polite"></span>
    </div>`;
  $("wp-share").addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}?week=${week.start}&lang=${lang}`;
    const text = `${copy.shareText(doneDates.length, week.nights.length)} ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: copy.heading, text, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      $("wp-share-status").textContent = copy.shareCopied;
    } catch {
      $("wp-share-status").textContent = url;
    }
  });
}

function paint() {
  loadState();
  paintChrome();
  paintSheet();
  paintProgress();
  paintReplay();
}

$("sheet").addEventListener("input", (event) => {
  const el = event.target;
  if (el.matches(".ws-initials")) state.initials[el.dataset.date] = el.value.toUpperCase();
  else if (el.name) state[el.name] = el.value;
  else return;
  save();
});
$("sheet").addEventListener("change", (event) => {
  const el = event.target;
  if (!el.matches(".ws-check")) return;
  state.done[el.dataset.date] = el.checked;
  if (el.checked) state.checkedAt[el.dataset.date] = new Date().toISOString();
  else delete state.checkedAt[el.dataset.date];
  save();
  paintProgress();
  paintReplay();
});

$("wp-week").addEventListener("change", (event) => {
  week = weeks.find((w) => w.start === event.target.value) ?? week;
  paint();
});
for (const button of document.querySelectorAll("[data-lang]")) {
  button.addEventListener("click", () => {
    lang = button.dataset.lang;
    store.set("ws:lang", lang);
    paint();
  });
}
$("wp-print").addEventListener("click", () => window.print());

paint();

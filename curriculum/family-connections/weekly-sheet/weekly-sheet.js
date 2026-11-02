/* weekly-sheet.js — the digital Weekly Family Practice Sheet.
 * Reads weeks.json (built from the pacing plan), renders the shared sheet, and keeps the family's
 * checkmarks on THIS device only (localStorage). Nothing is sent anywhere. */
import { LANGS, renderSheet, weekRange } from "./sheet-render.js";
import { todayIso, weekFor } from "./week-pick.js";

const CHROME = {
  en: {
    back: "Family Connections",
    heading: "Weekly Family Practice",
    intro: "Check off each night of practice. On the turn-in day, show this sheet (on a phone, or printed) to earn bonus points.",
    weekLabel: "Week",
    show: "Show my teacher",
    pdf: "Download this week (PDF)",
    print: "Print this week",
    all: "Download every week (PDF)",
    privacy: "Your checkmarks stay on this device. Nothing is sent to the school.",
    close: "Close",
    progress: (n, goal) => `${n} of ${goal} nights${n >= goal ? " — bonus goal reached!" : ` — ${goal - n} more for the bonus`}`,
    fridayTitle: "Practice check",
    fridayMet: "Bonus goal reached",
    fridayNot: (n, goal) => `${n} of ${goal} nights so far`,
    nameBlank: "(name not entered)",
    checkedOn: "checked",
    notDone: "not checked",
    noNights: "No practice nights this week.",
  },
  es: {
    back: "Conexión con las familias",
    heading: "Práctica familiar semanal",
    intro: "Marquen cada noche de práctica. El día de entrega, muestren esta hoja (en el teléfono o impresa) para ganar puntos extra.",
    weekLabel: "Semana",
    show: "Mostrar a mi maestro",
    pdf: "Descargar esta semana (PDF)",
    print: "Imprimir esta semana",
    all: "Descargar todas las semanas (PDF)",
    privacy: "Sus marcas se quedan en este dispositivo. No se envía nada a la escuela.",
    close: "Cerrar",
    progress: (n, goal) => `${n} de ${goal} noches${n >= goal ? " — ¡meta alcanzada!" : ` — faltan ${goal - n} para el punto extra`}`,
    fridayTitle: "Revisión de práctica",
    fridayMet: "Meta alcanzada",
    fridayNot: (n, goal) => `${n} de ${goal} noches hasta ahora`,
    nameBlank: "(sin nombre)",
    checkedOn: "marcada",
    notDone: "sin marcar",
    noNights: "No hay noches de práctica esta semana.",
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
  const copy = CHROME[lang];
  const box = $("wp-progress");
  box.dataset.met = String(n >= week.goal);
  box.innerHTML = `${copy.progress(n, week.goal)}<div class="wp-dots" aria-hidden="true">${week.nights
    .map((date) => `<span class="wp-dot" data-on="${Boolean(state.done[date])}"></span>`)
    .join("")}</div>`;
}

function paintSheet() {
  $("sheet").innerHTML = renderSheet(week, lang, state);
}

function paint() {
  loadState();
  paintChrome();
  paintSheet();
  paintProgress();
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

function showTeacher() {
  const copy = CHROME[lang];
  const n = doneCount();
  const met = n >= week.goal;
  const time = (iso) => (iso ? new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "");
  const items = week.nights
    .map((date) => {
      const on = Boolean(state.done[date]);
      const day = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
      const detail = on ? `${copy.checkedOn} ${time(state.checkedAt[date])} ${state.initials[date] ?? ""}`.trim() : copy.notDone;
      return `<li data-on="${on}"><span aria-hidden="true">${on ? "✓" : "○"}</span><span>${day} — ${detail}</span></li>`;
    })
    .join("");
  const name = (state.name ?? "").trim();
  const escape = (text) => text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  $("wp-friday-body").innerHTML = `<h2 id="wp-friday-title">${copy.fridayTitle}</h2>
    <p class="wp-big">${escape(name || copy.nameBlank)}</p><p>${weekRange(week, lang)}</p>
    <p class="wp-big">${met ? `✓ ${copy.fridayMet}` : copy.fridayNot(n, week.goal)}</p>
    <ul>${items || `<li>${copy.noNights}</li>`}</ul>`;
  $("wp-friday").showModal();
}
$("wp-show").addEventListener("click", showTeacher);
$("wp-friday-close").addEventListener("click", () => $("wp-friday").close());

paint();

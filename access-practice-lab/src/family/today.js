// A deterministic ten-minute family plan. The date and band choose only public practice content; checklist state stays
// on this device. This page never reads a learner's answers or sends family information.
import { bandRows, loadEsGuide, loadTalkTable } from "../content.js";
import { i18nFor } from "../i18n.js";
import { BASE, announce, html, storage } from "../util.js";
import { printSheet } from "../print-sheet.js";

const CHECK_KEY = "accessPracticeLab:v1:family-today:checklist";
const LANG_KEY = "accessPracticeLab:v1:family-today:language";
const READS_URL = `${BASE}/content/reading-path/library/texts.json`;
let reads;
let talk;
let spanishGuide;

const hash = (s) => [...String(s)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
const asDate = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const dayOffset = (d) => (d.getDay() + 6) % 7;
export const weekDates = (today) => {
  const monday = new Date(today);
  monday.setDate(monday.getDate() - dayOffset(monday));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};
export const wordsFor = (band, date, talkBand) => {
  const rows = [...new Map(
    Object.values(talkBand || {}).flat().flatMap((card) => card.words || [])
      .filter((word) => /^\p{L}[\p{L}'’-]*$/u.test(word.en || "") && word.es)
      .map((word) => [word.en.toLocaleLowerCase(), word]),
  ).values()];
  if (rows.length < 5) return [];
  const start = hash(`${band}:${asDate(date)}:words`) % rows.length;
  return Array.from({ length: 5 }, (_, i) => rows[(start + i) % rows.length]);
};
const oneOf = (rows, key) => rows[hash(key) % rows.length];
const loadReads = async () => {
  if (!reads) reads = await fetch(READS_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error("read-alouds unavailable"))));
  return reads.items || [];
};
async function planFor(band, date) {
  const key = `${band}:${asDate(date)}`;
  const table = (talk ||= await loadTalkTable());
  const talkBand = table.bands[band] || table.bands["3-5"] || table.bands.K;
  const talkPool = Object.values(talkBand).flat();
  const talkCard = oneOf(talkPool, `${key}:talk`);
  const activities = await bandRows(band).catch(() => []);
  const short = activities.filter((r) => r.minutes <= 5);
  const activity = oneOf(short.length ? short : activities, `${key}:activity`);
  spanishGuide ||= await loadEsGuide().catch(() => ({}));
  if (activity) activity.esTitle = spanishGuide[activity.id]?.skill || spanishGuide[activity.id]?.directions || "";
  const shelf = (await loadReads()).filter((r) => ["fiction", "nonfiction", "poetry", "play"].includes(r.kind));
  const read = oneOf(shelf, `${key}:read`);
  return { date: asDate(date), talk: talkCard, words: wordsFor(band, date, talkBand), activity, read };
}
const text = (pair, lang) => (Array.isArray(pair) ? pair[lang === "es" ? 1 : 0] : pair?.[lang] || pair?.en) || "";
const dayLabel = (date, lang) => new Intl.DateTimeFormat(lang === "es" ? "es" : "en", { weekday: "long", month: "short", day: "numeric" }).format(date);
const loadChecks = () => {
  try { return JSON.parse(storage.get(CHECK_KEY) || "{}"); } catch { return {}; }
};
const saveChecks = (checks) => storage.set(CHECK_KEY, JSON.stringify(checks));
const selectedLang = (I) => {
  const v = storage.get(LANG_KEY);
  return v === "en" || v === "es" ? v : I.spanish ? "es" : "en";
};
const WEEKDAYS = [
  ["Monday", "Lunes"],
  ["Tuesday", "Martes"],
  ["Wednesday", "Miércoles"],
  ["Thursday", "Jueves"],
  ["Friday", "Viernes"],
];

function printable(week, band, lang) {
  const days = week.map((p, i) => html`<li><strong>${text(WEEKDAYS[i], lang)}</strong><p>${text(p.talk.q, lang)}</p><p>${p.words.map((w) => text(w, lang)).join(" · ")}</p><p>${(lang === "es" ? p.activity?.esTitle : p.activity?.title) || (lang === "es" ? "Elige una actividad de cinco minutos" : "Choose a five-minute activity")}</p><p>${text(p.read?.title, lang)}</p><span>□</span></li>`);
  const title = lang === "es" ? "Plan de práctica en casa · 10 minutos" : "Today at home · 10-minute plan";
  return html`<article class="family-today-print"><h1>${title}</h1><p>${band}</p><h2>${lang === "es" ? "Plan de lunes a viernes" : "Monday–Friday planner"}</h2><ol>${days}</ol><h2>${lang === "es" ? "Mis cinco palabras" : "My five words"}</h2><ul>${week[0].words.map((w) => html`<li>${text(w, lang)}</li>`)}</ul><p>${lang === "es" ? "Práctica, no una calificación." : "Practice, not a grade."}</p></article>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx), lang = selectedLang(I), band = ctx.band;
  const today = new Date();
  const dates = weekDates(today);
  const plans = await Promise.all(dates.map((d) => planFor(band, d)));
  const todayPlan = plans.find((p) => p.date === asDate(today)) || await planFor(band, today);
  const checks = loadChecks()[todayPlan.date] || [];
  const T = (en, es) => lang === "es" ? es : en;
  return {
    title: T("Today at home", "Hoy en casa"),
    html: html`<article class="family-today" data-family-today>
      <p class="eyebrow">${T("For families", "Para familias")} · ${band}</p>
      <h1 tabindex="-1">${T("Today at home", "Hoy en casa")}</h1>
      <p class="lead">${T("One calm, ten-minute plan: talk, five words, one activity and a short read-aloud.", "Un plan tranquilo de diez minutos: conversen, cinco palabras, una actividad y una lectura breve.")}</p>
      <div class="row-actions" role="group" aria-label="${T("Choose language", "Elige el idioma")}"><button class="btn" type="button" data-today-lang="en" aria-pressed="${lang === "en"}">English</button><button class="btn" type="button" data-today-lang="es" aria-pressed="${lang === "es"}">Español</button></div>
      <section class="panel"><h2>${T("Talk Table", "Mesa de conversación")}</h2><p>${text(todayPlan.talk.q, lang)}</p><p><strong>${T("Try this start:", "Prueba este comienzo:")}</strong> ${text(todayPlan.talk.starter, lang)}</p></section>
      <section class="panel"><h2>${T("Five words", "Cinco palabras")}</h2><ul class="today-words">${todayPlan.words.map((w, i) => html`<li><label><input type="checkbox" data-today-check="${i}" ${checks.includes(i) ? "checked" : ""}> <strong lang="${lang}">${text(w, lang)}</strong></label><button class="btn small" type="button" data-today-say="${w.en}">${T("Hear it", "Escuchar")}</button></li>`)}</ul></section>
      <section class="panel"><h2>${T("One five-minute activity", "Una actividad de cinco minutos")}</h2><p>${lang === "es" ? (todayPlan.activity?.esTitle || todayPlan.activity?.title) : (todayPlan.activity?.title || T("Choose a short activity", "Elige una actividad breve"))}</p>${todayPlan.activity ? html`<a class="btn btn-primary" href="${BASE}/${todayPlan.activity.domain}/${todayPlan.activity.level}/${todayPlan.activity.id}?grades=${encodeURIComponent(band)}">${T("Open activity", "Abrir actividad")}</a>` : ""}</section>
      <section class="panel"><h2>${T("Read aloud", "Leer en voz alta")}</h2><h3>${text(todayPlan.read.title, lang)}</h3><p lang="${lang}">${text(todayPlan.read.text, lang).split("\n")[0]}</p><a class="btn" href="${BASE}/reading-path/library?grades=${encodeURIComponent(band)}">${T("Open the read-aloud library", "Abrir la biblioteca de lectura")}</a></section>
      <section class="panel"><h2>${T("This week", "Esta semana")}</h2><ol class="today-week">${plans.map((p, i) => html`<li><strong>${dayLabel(dates[i], lang)}</strong>: ${text(p.talk.q, lang)} <span>· ${p.words.map((w) => text(w, lang)).join(", ")}</span></li>`)}</ol><button class="btn" type="button" data-today-print>${T("Print Monday–Friday planner", "Imprimir el plan de lunes a viernes")}</button></section>
      <p class="fine">${T("The plan changes by date and grade band. Your checklist stays on this device.", "El plan cambia según la fecha y el grado. Tu lista queda en este dispositivo.")}</p>
    </article>`,
  };
}

export function onClick(e, ctx, I = i18nFor(ctx)) {
  const lang = e.target.closest?.("[data-today-lang]");
  if (lang) { storage.set(LANG_KEY, lang.dataset.todayLang); ctx.rerender(); return true; }
  const say = e.target.closest?.("[data-today-say]");
  if (say) { import("../speech.js").then(({ speak }) => speak(say.dataset.todaySay)); return true; }
  if (e.target.closest?.("[data-today-print]")) {
    const selected = selectedLang(I), dates = weekDates(new Date()), plans = dates.map(async (d) => planFor(ctx.band, d));
    Promise.all(plans)
      .then((week) => printSheet(printable(week, ctx.band, selected)))
      .catch(() => announce(I.S("The planner could not load. Connect and try again.", "No se pudo cargar el plan. Conéctate e inténtalo de nuevo.")));
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  const input = e.target.closest?.("[data-today-check]");
  if (!input) return;
  const date = asDate(new Date()), all = loadChecks(), checks = new Set(all[date] || []), n = Number(input.dataset.todayCheck);
  input.checked ? checks.add(n) : checks.delete(n);
  all[date] = [...checks].sort();
  for (const old of Object.keys(all).sort().slice(0, Math.max(0, Object.keys(all).length - 14))) delete all[old];
  saveChecks(all);
}

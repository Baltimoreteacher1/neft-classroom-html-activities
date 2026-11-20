/* shared/weekly-sheet-links.js — the "Weekly practice sheet" buttons at the top of Family Math Studio:
 * one opens the online sheet, one downloads this week's printable PDF. */
import { todayIso, weekFor } from "../weekly-sheet/week-pick.js";

const SHEET = "./weekly-sheet/";
const COPY = {
  en: {
    title: "Weekly practice sheet",
    hint: "Optional, ungraded practice. Your checkmarks stay on this device.",
    online: "Open weekly sheet",
    print: "Print / Save PDF",
  },
  es: {
    title: "Hoja semanal de práctica",
    hint: "Práctica opcional y sin calificación. Tus marcas se quedan en este dispositivo.",
    online: "Abrir la hoja semanal",
    print: "Imprimir / Guardar PDF",
  },
};

let weeksPromise;
const loadWeeks = () => {
  weeksPromise ??= fetch(`${SHEET}weeks.json`)
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.status))))
    .then((data) => data.weeks)
    .catch(() => null);
  return weeksPromise;
};

/** Paint (or hide) the buttons for `language`. The PDF button falls back to the online sheet if the schedule cannot load. */
export async function paintWeeklySheetLinks(root, language, hidden) {
  if (!root) return;
  root.hidden = hidden;
  if (hidden) return;
  const copy = COPY[language] ?? COPY.en;
  root.querySelector("[data-ws=title]").textContent = copy.title;
  root.querySelector("[data-ws=hint]").textContent = copy.hint;
  const online = root.querySelector("[data-ws=online]");
  const print = root.querySelector("[data-ws=print]");
  online.textContent = copy.online;
  print.textContent = copy.print;
  online.href = `${SHEET}?lang=${language}`;
  print.href = `${SHEET}?lang=${language}`;
  print.removeAttribute("download");
  const weeks = await loadWeeks();
  if (!weeks?.[0]?.days) return;
  const suffix = language === "es" ? "-es" : "";
  print.href = `${SHEET}downloads/week-${weekFor(weeks, todayIso()).start}${suffix}.pdf`;
  print.setAttribute("download", "");
}

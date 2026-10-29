/* shared/weekly-sheet-links.js — the "Weekly practice sheet" buttons at the top of Family Math Studio:
 * one opens the online sheet, one downloads this week's printable PDF. */
import { todayIso, weekFor } from "../weekly-sheet/week-pick.js";

const SHEET = "./weekly-sheet/";
const COPY = {
  en: {
    title: "Weekly practice sheet",
    hint: "Check off each night and show it on Friday for bonus points.",
    online: "Fill it in online",
    print: "Print a copy (PDF)",
  },
  es: {
    title: "Hoja semanal de práctica",
    hint: "Marca cada noche y muéstrala el viernes para ganar puntos extra.",
    online: "Llenarla en línea",
    print: "Imprimir una copia (PDF)",
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

// Math Universe arcade: one card per game in registry.js, filterable by unit.
import { GAMES } from "./registry.js";

const T = {
  en: {
    kicker: "Grade 6 · Math Universe",
    title: "The Math Universe",
    lead: "Real games where understanding the mathematics is how you win. Rewind any decision with the Time Machine, open a second reality to see what one change does, and teach Ori, an apprentice who starts out with the mistakes students make.",
    filter: "Show games for",
    allUnits: "All units",
    unit: "Unit {n}",
    review: "Year review",
    lessons: "Lessons {list}",
    play: "Play",
    howTitle: "How the games show learning",
    how1: "Every mathematical decision is recorded: the expression you set, the ratio you chose, what the world did with it, and whether you revised it. Speed is never measured.",
    how2: "Teachers see accuracy, revisions, predictions, explanations, the supports used, and whether Ori passed a task it had never seen, which only happens after the student has shown the idea.",
    teachers: "For teachers: what the evidence means",
    lang: "Español",
    langName: "Cambiar a español",
    "time-machine": "Time Machine",
    apprentice: "Teach Ori",
    "reality-shift": "Reality Shift",
  },
  es: {
    kicker: "Grado 6 · Universo Matemático",
    title: "El Universo Matemático",
    lead: "Juegos de verdad donde entender las matemáticas es la forma de ganar. Rebobina cualquier decisión con la Máquina del Tiempo, abre una segunda realidad para ver qué hace un cambio y enséñale a Ori, un aprendiz que empieza con los errores que cometen los estudiantes.",
    filter: "Mostrar juegos de",
    allUnits: "Todas las unidades",
    unit: "Unidad {n}",
    review: "Repaso del año",
    lessons: "Lecciones {list}",
    play: "Jugar",
    howTitle: "Cómo los juegos muestran el aprendizaje",
    how1: "Cada decisión matemática queda registrada: la expresión que pusiste, la razón que elegiste, lo que hizo el mundo con ella y si la corregiste. Nunca se mide la rapidez.",
    how2: "El maestro ve la precisión, las correcciones, las predicciones, las explicaciones, los apoyos usados y si Ori resolvió una tarea que nunca había visto, lo cual solo pasa después de que el estudiante mostró la idea.",
    teachers: "Para maestros: qué significa la evidencia",
    lang: "English",
    langName: "Switch to English",
    "time-machine": "Máquina del Tiempo",
    apprentice: "Enseña a Ori",
    "reality-shift": "Cambio de Realidad",
  },
};

let lang = new URLSearchParams(location.search).get("lang") === "es" ? "es" : "en";
try {
  if (!new URLSearchParams(location.search).get("lang") && localStorage.getItem("nt-lang") === "es") lang = "es";
} catch {
  /* storage blocked: English */
}
const t = (k, vars = {}) => T[lang][k].replace(/\{(\w+)\}/g, (_, v) => vars[v]);
const grid = document.getElementById("grid");
const unitSel = /** @type {HTMLSelectElement} */ (document.getElementById("unit"));
const langBtn = document.getElementById("lang");

for (const u of [...new Set(GAMES.map((g) => g.unit).filter((x) => x !== null))].sort((a, b) => a - b)) {
  const o = document.createElement("option");
  o.value = String(u);
  o.dataset.unit = String(u);
  unitSel.append(o);
}

function render() {
  document.documentElement.lang = lang;
  for (const node of document.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
  for (const o of unitSel.querySelectorAll("[data-unit]")) o.textContent = t("unit", { n: o.dataset.unit });
  langBtn.textContent = t("lang");
  langBtn.lang = lang === "en" ? "es" : "en";
  langBtn.setAttribute("aria-label", t("langName"));
  grid.textContent = "";
  const unit = Number(unitSel.value) || 0;
  // Curriculum order: by unit, the year review last.
  const byUnit = [...GAMES].sort((a, b) => (a.unit ?? 99) - (b.unit ?? 99));
  for (const g of byUnit.filter((x) => !unit || x.unit === unit)) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "card";
    a.href = `${g.href}${lang === "es" ? "?lang=es" : ""}`;
    a.innerHTML = `<span class="meta"></span><strong></strong><span class="genre"></span><span class="tag"></span><span class="chips"></span><span class="go"></span>`;
    a.querySelector(".meta").textContent =
      g.unit === null ? t("review") : `${t("unit", { n: g.unit })} · ${t("lessons", { list: g.lessons.join(", ") })}`;
    a.querySelector("strong").textContent = g.title[lang];
    a.querySelector(".genre").textContent = g.genre[lang];
    a.querySelector(".tag").textContent = g.tagline[lang];
    for (const f of g.features) {
      const c = document.createElement("span");
      c.textContent = t(f);
      a.querySelector(".chips").append(c);
    }
    a.querySelector(".go").textContent = t("play");
    li.append(a);
    grid.append(li);
  }
}

unitSel.addEventListener("change", render);
langBtn.addEventListener("click", () => {
  lang = lang === "en" ? "es" : "en";
  render();
});
render();

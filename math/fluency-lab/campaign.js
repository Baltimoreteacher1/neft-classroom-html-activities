// The Lighthouse Campaign: one story across the Grade 6 Reveal units, about a crew that restores a harbor lighthouse.
// It teaches rather than decorates: every chapter's mission is the lab's own sequence (Learn each skill, practise it,
// then the unit's Unit Check), and the story only moves when the Unit Check confirms the chapter's skills. Chapters
// are suggested at about a week each but nothing unlocks by date. Progress is read from the saved Unit Check records.
import { UNIT_CHECKS, loadUnitChecks } from "./unit-check.js";

export const CAMPAIGN_GRADE = 6;
const C = (en, es) => ({ en, es });

export const CHAPTERS = Object.freeze([
  { unit: 2, title: C("The Signal Log", "El registro de señales"),
    intro: C("The crew finds a dusty log of ships that passed the harbor. To read it, you divide big numbers and work with decimals.", "La tripulación encuentra un registro polvoriento de los barcos que pasaron por el puerto. Para leerlo, divides números grandes y trabajas con decimales."),
    beat: C("The log is clear: ships pass at dusk, so the lamp must shine by evening.", "El registro es claro: los barcos pasan al atardecer, así que la lámpara debe brillar por la noche.") },
  { unit: 3, title: C("Mixing the Paint", "Mezclar la pintura"),
    intro: C("The tower needs red and white stripes in exact ratios. A wrong mix means starting over, so you compare ratios and rates.", "La torre necesita franjas rojas y blancas en razones exactas. Una mezcla equivocada obliga a empezar de nuevo, así que comparas razones y tasas."),
    beat: C("The stripes are bright and even. Ships can spot the tower from far away.", "Las franjas son brillantes y parejas. Los barcos pueden ver la torre desde lejos.") },
  { unit: 4, title: C("The Fuel Gauge", "El medidor de combustible"),
    intro: C("The lamp oil tank is partly full. You use percents to decide how much more oil the crew must carry up the stairs.", "El tanque de aceite de la lámpara está medio lleno. Usas porcentajes para decidir cuánto más aceite debe subir la tripulación por la escalera."),
    beat: C("The tank is full and the crew knows exactly how much each night uses.", "El tanque está lleno y la tripulación sabe exactamente cuánto gasta cada noche.") },
  { unit: 5, title: C("Glass and Stone", "Vidrio y piedra"),
    intro: C("Broken panes, a new roof and a water tank all need measuring. You find areas and volumes before ordering anything.", "Hay vidrios rotos, un techo nuevo y un tanque de agua que medir. Hallas áreas y volúmenes antes de pedir cualquier cosa."),
    beat: C("Every pane fits and the tank holds just enough. Nothing was wasted.", "Cada vidrio encaja y el tanque guarda justo lo necesario. No se desperdició nada.") },
  { unit: 6, title: C("The Gear Room", "La sala de engranajes"),
    intro: C("Gears turn the great lens. To line them up you use factors and multiples, divide fractions and evaluate expressions.", "Los engranajes hacen girar la gran lente. Para alinearlos usas factores y múltiplos, divides fracciones y evalúas expresiones."),
    beat: C("The gears click into place and the lens turns without a sound.", "Los engranajes encajan y la lente gira sin hacer ruido.") },
  { unit: 7, title: C("Below the Waterline", "Bajo la línea del agua"),
    intro: C("Divers read depths below the waterline and heights above it. Integers and the coordinate plane keep the map straight.", "Los buzos leen profundidades bajo la línea del agua y alturas sobre ella. Los enteros y el plano de coordenadas mantienen el mapa en orden."),
    beat: C("The harbor map is finished, with every rock marked in the right place.", "El mapa del puerto está terminado, con cada roca marcada en su lugar.") },
  { unit: 8, title: C("Balancing the Lens", "Equilibrar la lente"),
    intro: C("The lens is heavy and must balance on its mount. Equations and inequalities tell you what to add or take away.", "La lente es pesada y debe equilibrarse sobre su soporte. Las ecuaciones y las desigualdades te dicen qué agregar o quitar."),
    beat: C("The lens sits level. A single finger can turn it.", "La lente queda nivelada. Un solo dedo puede hacerla girar.") },
  { unit: 9, title: C("Charting the Course", "Trazar el rumbo"),
    intro: C("Captains ask how far a ship has gone after some hours. You describe how two changing quantities relate, in words, tables and graphs.", "Los capitanes preguntan cuánto ha avanzado un barco después de unas horas. Describes cómo se relacionan dos cantidades que cambian, con palabras, tablas y gráficas."),
    beat: C("The lamp turns. Ships steer by its light and find the harbor.", "La lámpara gira. Los barcos se guían por su luz y encuentran el puerto.") },
]);

export const CAMPAIGN_TITLE = C("The Lighthouse Campaign", "La campaña del faro");
export const CAMPAIGN_LEAD = C(
  "A story across the Grade 6 units. Each chapter is a week of real learning: learn each skill, practise it, then take the Unit Check. The story moves on when your skills are confirmed, never because of a clock.",
  "Una historia a lo largo de las unidades de 6.º grado. Cada capítulo es una semana de aprendizaje real: aprende cada destreza, practícala y haz la Revisión de unidad. La historia avanza cuando tus destrezas se confirman, nunca por un reloj.",
);

// status: "done" (every skill of the unit confirmed), "current" (the first chapter not done), "later" (after it).
export function campaignState(records = loadUnitChecks()) {
  let currentSeen = false;
  return CHAPTERS.map((chapter, index) => {
    const unit = UNIT_CHECKS.find((entry) => entry.unit === chapter.unit);
    const confirmed = (records[unit.id]?.confirmed || []).filter((key) => unit.keys.includes(key));
    const done = confirmed.length === unit.keys.length;
    const status = done ? "done" : currentSeen ? "later" : "current";
    if (!done) currentSeen = true;
    return { chapter, unit, index, week: index + 1, confirmed, status };
  });
}

const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const skillLink = (key, stage) => {
  const [grade, id] = key.split(":");
  return `./?grade=${grade}&skill=${encodeURIComponent(id)}${stage ? `&stage=${stage}` : ""}`;
};

// The Practice hub section (Grade 6 only). `t` is the page translator, `skillTitle` maps a skill key to its title.
export function campaignPanelHtml({ grade, lang, t, skillTitle, records = loadUnitChecks() }) {
  if (grade !== CAMPAIGN_GRADE) return "";
  const pick = (copy) => esc(lang === "es" ? copy.es : copy.en);
  const rows = campaignState(records).map(({ chapter, unit, week, confirmed, status }) => {
    const head = `<h4>${esc(t("Chapter {n}", { n: week }))}: ${pick(chapter.title)}</h4>`;
    const meta = `<p class="cg-meta">${esc(t("Unit {n}", { n: unit.unit }))} · ${esc(t("About week {n}", { n: week }))} · ${esc(t("{done} of {total} skills confirmed", { done: confirmed.length, total: unit.keys.length }))}</p>`;
    if (status === "later")
      return `<li class="cg-chapter" data-status="later">${head}${meta}<p>${esc(t("This chapter opens when the one before it is done."))}</p></li>`;
    if (status === "done")
      return `<li class="cg-chapter" data-status="done">${head}${meta}<p class="cg-beat">${pick(chapter.beat)}</p></li>`;
    const steps = unit.keys
      .map((key) => `<li><span>${esc(skillTitle(key))}</span> <a href="${skillLink(key)}">${esc(t("Learn"))}</a> <a href="${skillLink(key, "practice")}">${esc(t("Practise"))}</a>${confirmed.includes(key) ? ` <b>${esc(t("Confirmed"))}</b>` : ""}</li>`)
      .join("");
    return `<li class="cg-chapter" data-status="current">${head}${meta}<p>${pick(chapter.intro)}</p>
      <p><strong>${esc(t("Your mission"))}</strong></p><ol class="cg-steps">${steps}<li>${esc(t("Take the Unit Check when you feel ready."))} <button type="button" class="outline-action" data-start-unit="${unit.id}">${esc(t("Unit {n} Check", { n: unit.unit }))}</button></li></ol></li>`;
  });
  return `<section class="campaign" aria-labelledby="campaign-title"><h3 id="campaign-title">${pick(CAMPAIGN_TITLE)}</h3><p>${pick(CAMPAIGN_LEAD)}</p><ol class="cg-list">${rows.join("")}</ol></section>`;
}

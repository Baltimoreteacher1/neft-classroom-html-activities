/**
 * Family "See it move" card: the lesson's own animated model (shared/motion/figures) with its numbers editable, wrapped in the
 * three things a family does together: predict, test, discuss, plus a line on how to help without giving the answer.
 * Optional, ungraded, no account: nothing here records a score; the last numbers tried are kept on this device only.
 * The figure loads lazily (client: homework-mission-js.mjs, hwMotionMount) the first time the Try Together step opens.
 */
import { motionSpecFor as lessonSpec } from "./motion-spec.mjs";

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const bi = (en, es) =>
  `<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;

/** Only the mount point is in the page; the words are written by hwMotionMount when the step opens, so the first view stays light. */
export function renderMotionHost(lessonId) {
  const spec = lessonSpec(lessonId);
  /* the exponent lessons carry the same copies picture in their own Exponent model, with its Predict and Reason step */
  if (!spec || spec.key === "power:order") return "";
  return `<section id="hw_motion" data-k="${esc(spec.key)}" data-v="${spec.values.join(",")}" hidden></section>`;
}

/** The card's words, English and Spanish, used by the client script (homework-mission-js.mjs). */
export const MOTION_INTRO = {
  badge: bi("See it move", "Míralo moverse"),
  title: bi("Predict, test, talk", "Predice, prueba, conversa"),
  steps: [
    bi(
      "Predict. Before you press anything, say what you think will happen.",
      "Predice. Antes de tocar nada, di qué crees que pasará.",
    ),
    bi(
      "Test. Press “Watch it move,” or change a number and look again.",
      "Prueba. Toca “Míralo moverse” o cambia un número y mira otra vez.",
    ),
    bi(
      "Talk. Did it match? What changed? What stayed the same?",
      "Conversa. ¿Coincidió? ¿Qué cambió? ¿Qué se quedó igual?",
    ),
  ],
  help: bi(
    "Grown-ups: ask “What do you notice?” and “What would happen if…?” Let your child say it first. You do not need to give the answer.",
    "Adultos: pregunten “¿Qué notas?” y “¿Qué pasaría si…?”. Dejen que su hijo o hija lo diga primero. No necesitan dar la respuesta.",
  ),
};

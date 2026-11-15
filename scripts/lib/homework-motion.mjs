/**
 * Family "See it move" card: the lesson's own animated model (shared/motion/figures) with its numbers editable, wrapped in the
 * three things a family does together: predict, test, discuss, plus a line on how to help without giving the answer.
 * Optional, ungraded, no account: nothing here records a score; the last numbers tried are kept on this device only.
 * The figure loads lazily (client: homework-mission-js.mjs, hwMotionMount) the first time the Try Together step opens.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { figureFor } from "../../shared/motion/figures/index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const bi = (en, es) =>
  `<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;

/** The lab model the lesson's Practice bench uses: { key, values } or null. Part pages share their lesson's model. */
export function motionSpecFor(lessonId) {
  const base = String(lessonId || "")
    .replace(/^lesson-/, "")
    .replace(/-(part\d+|group\d+|catchup)$/, "");
  for (const dir of ["data/practice-studio", "data/practice-studio-u4"]) {
    const file = join(ROOT, dir, `${base}.json`);
    if (!existsSync(file)) continue;
    const m = JSON.parse(readFileSync(file, "utf8")).bench?.model;
    if (!m) return null;
    const key = `${m.kind}:${m.mode}`;
    return figureFor(key) ? { key, values: m.values } : null;
  }
  return null;
}

/** Only the mount point is in the page; the words are written by hwMotionMount when the step opens, so the first view stays light. */
export function renderMotionHost(lessonId) {
  const spec = motionSpecFor(lessonId);
  if (!spec) return "";
  return `<section id="hw_motion" data-k="${esc(spec.key)}" data-v="${spec.values.join(",")}" hidden></section>`;
}

/** The card's words, English and Spanish, used by the client script (homework-mission-js.mjs). */
export const MOTION_INTRO = {
  badge: bi("See it move", "Míralo moverse"),
  title: bi("Predict, test, talk", "Predice, prueba, conversa"),
  steps: [
    bi(
      "<strong>Predict.</strong> Before you press anything, say what you think will happen.",
      "<strong>Predice.</strong> Antes de tocar nada, di qué crees que pasará.",
    ),
    bi(
      "<strong>Test.</strong> Press “Watch it move,” or change a number and look again.",
      "<strong>Prueba.</strong> Toca “Míralo moverse” o cambia un número y mira otra vez.",
    ),
    bi(
      "<strong>Talk.</strong> Did it match? What changed? What stayed the same?",
      "<strong>Conversa.</strong> ¿Coincidió? ¿Qué cambió? ¿Qué se quedó igual?",
    ),
  ],
  help: bi(
    "<strong>Grown-ups:</strong> ask “What do you notice?” and “What would happen if…?” Let your child say it first. You do not need to give the answer.",
    "<strong>Adultos:</strong> pregunten “¿Qué notas?” y “¿Qué pasaría si…?”. Dejen que su hijo o hija lo diga primero. No necesitan dar la respuesta.",
  ),
};

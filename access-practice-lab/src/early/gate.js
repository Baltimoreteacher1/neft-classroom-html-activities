// Which lab rooms a Kindergarten, Grade 1 or Grades 2–3 learner can open. The K–3 bands have their own home
// (/early) and the audio-first player; rooms written for grades 3–8 (missions, studios, reality engine, practice
// tests...) say so and offer the way back instead of showing older children's tasks under a K–3 label.
import { BAND_INFO } from "../bands.js";
import { ART, BASE, html } from "../util.js";

/** Route views that work for an early band. Everything else renders the gate panel below. */
export const EARLY_VIEWS = new Set([
  "home",
  "early",
  "activity",
  "play",
  "room",
  "library",
  "passport",
  "tools",
  "move",
  "family",
  "class",
  "class-quiz",
  "class-teacher",
  "launch",
  "launch-studio",
  "teacher-launch",
  "session-done",
  "warmup",
  "search",
  "portfolio",
  "collection",
]);

/**
 * Whether an early band may open this route. The Phonics Path (Levels 1-3, written for Grades 1-3) is the one part of
 * the Science of Reading room that belongs to K-3 learners; the rest of that room stays a grades 3-8 room.
 */
export const earlyCanOpen = (route) =>
  EARLY_VIEWS.has(route.view) ||
  (route.view === "science-of-reading" && (route.id === "path" || route.id === "lesson"));

export function earlyGateHTML(ctx, I) {
  const info = BAND_INFO[ctx.band];
  const q = `?grades=${info?.picker || ctx.band}`;
  return {
    title: I.S("Made for older grades", "Hecho para grados mayores"),
    html: html`<section class="panel empty-state early-gate" aria-labelledby="earlyGateTitle">
      <img src="${ART}/empty.svg" width="480" height="300" alt="" />
      <h1 id="earlyGateTitle" tabindex="-1">
        ${I.T("This room is made for grades 3–8.", "Esta sala está hecha para los grados 3 a 8.")}
      </h1>
      <p>
        ${I.T(
          `You chose ${info?.label || ctx.band}. Your practice has its own home with pictures and read-aloud help.`,
          `Elegiste ${info?.labelEs || ctx.band}. Tu práctica tiene su propia página con dibujos y lectura en voz alta.`,
        )}
      </p>
      <p class="early-gate-actions">
        <a class="btn btn-primary" href="${BASE}/early${q}"
          >${I.T("Go to my practice home", "Ir a mi página de práctica")}</a
        >
        <a class="btn" href="${location.pathname}?grades=4-5"
          >${I.T("Open this room for grades 4–5", "Abrir esta sala para los grados 4–5")}</a
        >
      </p>
    </section>`,
  };
}

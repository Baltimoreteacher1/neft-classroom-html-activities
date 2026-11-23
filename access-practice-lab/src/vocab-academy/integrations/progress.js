// Vocabulary Academy · word-learning evidence on the lab's existing progress surfaces (Passport, Growth Map,
// Portfolio, the "Send my work to my teacher" code and the Teacher Hub evidence view). READ-ONLY: every number comes
// from the Core model's studentSummary(); nothing here counts, scores or stores anything of its own.
//
// Honesty rule (PLATFORM.md rule 1): these are counts of WORDS the learner has shown they know, with the evidence
// that way. They are never combined into one number, a percent, a WIDA level or an ACCESS score, and the copy says so.
import { html, icon, formatDate, raw } from "../../util.js";
import { studentSummary } from "../model.js";
import { loadProgress } from "../store.js";
import { vaHref } from "../data.js";

const count = (v) => (Number.isInteger(v) && v >= 0 && v <= 100000 ? v : 0);
const stamp = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v.slice(0, 30) : "");

/** Shape every surface reads. `started` is false until a word has been seen, so empty devices show a Start door. */
export function progressDigest(summary) {
  const s = summary?.words?.byState || {};
  const digest = {
    secure: count(s.secure),
    applying: count(s.applying),
    review: count(s["review-needed"]),
    growing: count(s.learning) + count(s.developing),
    seen: count(summary?.words?.total),
    unitsStarted: count(summary?.units?.started),
    unitsCompleted: count(summary?.units?.completed),
    due: count(summary?.due),
    lastActive: stamp(summary?.lastActive),
  };
  return { ...digest, started: digest.seen > 0 };
}

/** This device's digest, or null when nothing has been practiced (and on any read failure). */
export function loadDigest() {
  try {
    const digest = progressDigest(studentSummary(loadProgress()));
    return digest.started ? digest : null;
  } catch {
    return null;
  }
}

/** The small, closed shape that travels in a share code (counts and one date only; never a word or an answer). */
export const shareDigest = (digest = loadDigest()) =>
  digest
    ? {
        secure: digest.secure,
        applying: digest.applying,
        review: digest.review,
        growing: digest.growing,
        unitsCompleted: digest.unitsCompleted,
        lastActive: digest.lastActive,
      }
    : null;

/** Re-validate a digest read from a code or file written by someone else. Returns null for anything else. */
export function cleanShareDigest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const d = {
    secure: count(raw.secure),
    applying: count(raw.applying),
    review: count(raw.review),
    growing: count(raw.growing),
    unitsCompleted: count(raw.unitsCompleted),
    lastActive: stamp(raw.lastActive),
  };
  return d.secure + d.applying + d.review + d.growing > 0 ? d : null;
}

const NOTE = [
  "These are words practiced on this device. They are not a WIDA level or an ACCESS score.",
  "Estas son palabras practicadas en este dispositivo. No son un nivel de WIDA ni un puntaje de ACCESS.",
];

const stat = (I, n, en, es) => html`<li><strong>${n}</strong><span>${I.T(en, es)}</span></li>`;

/** Passport, Growth Map and Portfolio card. `digest` null renders a calm Start door. */
export function progressCardHTML(I, digest, { heading = "h2", id = "vaProgress" } = {}) {
  const level = heading === "h3" ? "h3" : "h2";
  const open = raw(`<${level} id="${id}">`);
  const close = raw(`</${level}>`);
  const title = html`${icon("words")} ${I.T("Vocabulary Academy", "Academia de Vocabulario")}`;
  if (!digest)
    return html`<section class="pass-card va-int-card" aria-labelledby="${id}">
      ${open}${title}${close}
      <p>
        ${I.T("Learn words a few minutes at a time. Your word evidence will show here.", "Aprende palabras unos minutos a la vez. La evidencia de tus palabras aparecerá aquí.")}
      </p>
      <a class="btn small" href="${vaHref()}">${I.T("Start", "Empezar")}</a>
    </section>`;
  return html`<section class="pass-card va-int-card" aria-labelledby="${id}">
    ${open}${title}${close}
    <ul class="va-int-stats">
      ${stat(I, digest.secure, "Secure", "Seguras")}
      ${stat(I, digest.applying, "Applying", "Aplicando")}
      ${stat(I, digest.review, "Review needed", "Necesitan repaso")}
    </ul>
    <p class="fine">
      ${I.T(`${digest.unitsCompleted} unit${digest.unitsCompleted === 1 ? "" : "s"} finished`, `${digest.unitsCompleted} lección${digest.unitsCompleted === 1 ? "" : "es"} terminada${digest.unitsCompleted === 1 ? "" : "s"}`)}
      ${digest.lastActive ? html` · ${I.T("last practiced", "última práctica")} ${formatDate(digest.lastActive)}` : ""}
    </p>
    <a class="btn small" href="${vaHref()}">${I.T("Continue", "Continuar")}</a>
    <p class="fine">${I.T(NOTE[0], NOTE[1])}</p>
  </section>`;
}

/** Teacher Hub, one student: the digest carried in the share code (counts only). */
export function teacherBlockHTML(T, raw) {
  const d = cleanShareDigest(raw);
  if (!d) return "";
  return html`<section class="va-int-teacher" aria-label="Vocabulary Academy">
    <h4>${icon("words")} Vocabulary Academy · words</h4>
    <ul class="va-int-stats">
      <li><strong>${d.secure}</strong><span>Secure</span></li>
      <li><strong>${d.applying}</strong><span>Applying</span></li>
      <li><strong>${d.review}</strong><span>Review needed</span></li>
      <li><strong>${d.unitsCompleted}</strong><span>Lessons finished</span></li>
    </ul>
    <p class="fine">
      ${d.lastActive ? `Last practiced ${d.lastActive.slice(0, 10)}. ` : ""}Evidence of words
      practiced, from the student's own device. Not a WIDA level or ACCESS score.
    </p>
  </section>`;
}

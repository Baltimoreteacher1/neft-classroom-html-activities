/**
 * Signature Innovation C: Family Math Quest
 * Lightweight mount point for Step 2 (Build): Student Solo (default), Learn Together,
 * and Student Teaches. Hydrated from `assets/homework/studio-plus.mjs`.
 */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function renderFamilyQuest(_config, tryQ) {
  const promptEn =
    tryQ?.en || "Ask: What changes when the number increases, and why does your model make sense?";
  const promptEs =
    tryQ?.es || "Pregunta: ¿Qué cambia cuando aumenta el número y por qué tiene sentido tu modelo?";

  return `<section class="fq-quest" id="hw_family_quest" data-fq-mode="solo" data-fq-prompt-en="${esc(promptEn)}" data-fq-prompt-es="${esc(promptEs)}" aria-label="Optional Learning Mode"></section>`;
}

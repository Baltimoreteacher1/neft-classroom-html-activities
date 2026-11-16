/**
 * Signature Innovation D: Explain My Thinking Studio
 *
 * Emits a lightweight mount point per page; the interactive 3-mode UI (Write & WIDA Frames,
 * Draw & Annotate Canvas, Arrange Model Tiles) is hydrated from the shared cached bundle
 * (`STUDIO_PLUS_JS`) so all 166 pages stay fast and well under the first-view byte budget.
 */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function renderExplainStudio(config, lessonId) {
  const baseId = String(lessonId || "").replace(/-part[23]$/, "");
  const vocab = (config?.vocabulary || []).slice(0, 5).map((v) => ({
    en: v.term,
    es: v.termEs || v.term,
  }));
  return `<section class="ex-studio" id="hw_explain_studio" data-ex-lesson="${esc(baseId)}" data-ex-vocab="${esc(JSON.stringify(vocab))}" aria-label="Explain My Thinking Studio"></section>`;
}

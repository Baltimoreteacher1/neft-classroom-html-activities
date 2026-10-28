/**
 * The lesson's picture, drawn from the lesson's own numbers (`v3.model`). Both languages are rendered because
 * the page carries both and CSS shows one; the library makes ids unique per language.
 * An unknown kind or a missing field throws: there is no generic diagram to fall back to.
 */
import { renderModel } from "../../assets/design/family/art/math-models.mjs";

export function renderModelFigure(model, lessonId) {
  if (!model || model.kind === "none") {
    throw new Error(
      `family homework ${lessonId}: a math lesson needs v3.model (kind other than "none")`,
    );
  }
  const en = renderModel(model, { lang: "en" });
  const es = renderModel(model, { lang: "es" });
  return `<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;
}

// The "Vista previa en español" panel on an activity page. Content from src/lang/es-preview.js; the passage,
// script, choices and answer stay English and are never part of it. The activity view registers the
// <details> toggle so that opening it marks the attempt as supported.
import { buildEsPreview } from "../lang/es-preview.js";
import { html, icon } from "../util.js";

export function esPreviewHTML(I, activity, domain, guide) {
  const p = buildEsPreview(activity, domain, guide);
  if (!p) return "";
  return html`<details class="helpers es-preview" data-es-preview>
    <summary>${icon("language")} ${I.T("Spanish preview", "Vista previa en español")}</summary>
    <p class="fine">
      ${I.T(
        "Opening this preview saves this attempt as practice with help. The text and the answers stay in English.",
        "Abrir esta vista previa guarda este intento como práctica con apoyo. El texto y las respuestas siguen en inglés.",
      )}
    </p>
    <div lang="es">
      <h3>${p.title}</h3>
      <p><strong>De qué se trata:</strong> ${p.gist}</p>
      <p>
        <strong>Qué vas a hacer:</strong> ${p.prompt}
        <button
          type="button"
          class="ghost small"
          data-say-es="${p.prompt}"
          aria-label="Escuchar en español"
        >
          ${icon("volume")} Escuchar
        </button>
      </p>
      <p><strong>Una buena respuesta:</strong></p>
      <ul>
        ${p.rubric.map((line) => html`<li>${line}</li>`)}
      </ul>
      ${
        p.vocab.length
          ? html`<p><strong>Palabras clave:</strong></p>
              <ul class="es-preview-vocab">
                ${p.vocab.map((v) => html`<li><span lang="en">${v.term}</span> = <button type="button" class="say-word" data-say-es="${v.es}" aria-label="Escuchar ${v.es}">${icon("volume")}</button> <strong>${v.es}</strong>${v.esDef ? html`: ${v.esDef}` : ""}</li>`)}
              </ul>`
          : ""
      }
    </div>
  </details>`;
}

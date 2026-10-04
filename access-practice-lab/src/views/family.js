// Family Corner — bilingual (English / Spanish), printable. Copy lives in
// content/family.json so it can be edited without touching code.
import { crumbsHTML } from "../components.js";
import { loadFamily, loadShared } from "../content.js";
import { BASE, html, testingWindowPhase } from "../util.js";

export async function render(ctx) {
  const [fam, shared] = await Promise.all([loadFamily(), loadShared().catch(() => ({}))]);
  if (!fam)
    return {
      title: "Families",
      html: html`<section class="panel">
        <h1 tabindex="-1">Families</h1>
        <p>Coming soon.</p>
      </section>`,
    };
  const lang = ctx.prefs.lang === "es" ? "es" : "en";
  const T = (o) => (o && typeof o === "object" ? o[lang] || o.en : o);
  const win = shared.testWindow;
  const date = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(lang === "es" ? "es-US" : "en-US", { month: "long", day: "numeric", year: "numeric" });
  return {
    title: lang === "es" ? "Familias" : "Families",
    html: html`${crumbsHTML([
        [lang === "es" ? "Laboratorio" : "Lab", `${BASE}/`],
        [lang === "es" ? "Familias" : "Families", null],
      ])}
      <section class="room-hero family-hero">
        <div>
          <p class="eyebrow">${T(fam.eyebrow)}</p>
          <h1 tabindex="-1">🏠 ${T(fam.title)}</h1>
          <p class="lead">${T(fam.lead)}</p>
          <div class="band-switch" role="group" aria-label="Language / Idioma">
            <button type="button" class="band-btn" data-lang="en" aria-pressed="${lang === "en"}">
              English
            </button>
            <button type="button" class="band-btn" data-lang="es" aria-pressed="${lang === "es"}">
              Español
            </button>
          </div>
        </div>
        ${testingWindowPhase(win) ? html`<aside class="window-card"><span class="window-kicker">${T(fam.windowLabel)}</span><strong>${date(win.start)} – ${date(win.end)}</strong><span>${T(fam.windowNote)}</span><a href="https://wida.wisc.edu/about/consortium/md" target="_blank" rel="noopener">${lang === "es" ? "Calendario oficial de Maryland (otra pestaña)" : "Official Maryland schedule (new tab)"}</a></aside>` : ""}
      </section>
      <section class="panel family-section">
        <h2>${lang === "es" ? "Dónde se guarda el trabajo" : "Where the work is saved"}</h2>
        <p>${lang === "es" ? "Los borradores, las listas de cotejo y el progreso se guardan en este navegador cuando hay almacenamiento disponible. No se necesita un nombre completo. Las grabaciones de voz desaparecen al cerrar o recargar la página y no se incluyen en los códigos de progreso." : "Drafts, checklists, and progress are saved in this browser when storage is available. A full name is not needed. Voice recordings disappear when the page closes or reloads and are not included in progress codes."}</p>
        <p>${lang === "es" ? "Antes de cambiar de dispositivo o compartirlo con otro estudiante, usa Pasaporte para copiar un código ACCESS1 del trabajo actual. Ese código es diferente del código corto de Guardar / Continuar del sitio, que depende del servicio de almacenamiento configurado. Conserva los códigos en privado: pueden incluir respuestas escritas." : "Before changing devices or sharing with another learner, use Passport to copy an ACCESS1 code of the current work. That differs from the site’s short Save / Resume code, which depends on the configured storage service. Keep codes private: they may include written responses."}</p>
        <a class="btn" href="${BASE}/passport?grades=${ctx.band}">${lang === "es" ? "Abrir Pasaporte" : "Open Passport"}</a>
      </section>
      ${fam.sections.map(
        (s) =>
          html`<section class="panel family-section">
            <h2>${s.icon ? `${s.icon} ` : ""}${T(s.title)}</h2>
            ${s.body ? html`<p>${T(s.body)}</p>` : ""}
            ${
              s.items
                ? html`<ul class="${s.style || ""}">
                    ${s.items.map((i) => html`<li>${i.title ? html`<strong>${T(i.title)}</strong> ` : ""}${T(i.text)}</li>`)}
                  </ul>`
                : ""
            }
          </section>`,
      )}
      <div class="row-actions no-print">
        <button type="button" class="btn btn-primary" data-print>
          🖨️ ${lang === "es" ? "Imprimir esta página" : "Print this page"}
        </button>
      </div>`,
  };
}

export function onClick(e, ctx) {
  const b = e.target.closest("[data-lang]");
  if (!b) return;
  ctx.setPrefs({ lang: b.dataset.lang });
  document.documentElement.lang = b.dataset.lang;
  ctx.rerender();
}
export function mount(_root, ctx) {
  document.documentElement.lang = ctx.prefs.lang === "es" ? "es" : "en";
}

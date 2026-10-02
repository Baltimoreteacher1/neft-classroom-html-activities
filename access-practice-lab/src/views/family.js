// Family Corner — bilingual (English / Spanish), printable. Copy lives in
// content/family.json so it can be edited without touching code.
import { crumbsHTML } from "../components.js";
import { loadFamily, loadShared } from "../content.js";
import { BASE, formatDate, html, testingWindowPhase } from "../util.js";

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
  return {
    title: lang === "es" ? "Familias" : "Families",
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
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
        ${testingWindowPhase(win) ? html`<aside class="window-card"><span class="window-kicker">${T(fam.windowLabel)}</span><strong>${formatDate(win.start)} – ${formatDate(win.end)}</strong><span>${T(fam.windowNote)}</span></aside>` : ""}
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

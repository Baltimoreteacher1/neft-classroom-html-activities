// One Resource Finder result: title, one-sentence description from the resource's own data, what it is (grade band,
// skill, kind, audience, minutes) and four actions: Open, Preview (an in-page summary, plus the resource's existing
// preview page where it has one), Copy link and Save. Markup only; src/views/search.js wires the actions.
import { KIND_LABEL, highlight, hrefFor } from "../lang/site-search.js";
import { SECTION_BY_ID } from "../sitemap.js";
import { BASE, TIERS, bandLabel, html, icon, raw } from "../util.js";
import { bandLabelEs } from "../bands.js";
import { KIND_VALUES, SKILL_VALUES } from "./facets.js";

const label = (list, id) => list.find(([v]) => v === id)?.[1] || null;

const openLabel = (I, kind) => {
  const labels = {
    practice: ["Start practice", "Empezar la práctica"],
    game: ["Play game", "Jugar"],
    test: ["Open practice test", "Abrir la prueba de práctica"],
    printable: ["Open printable", "Abrir para imprimir"],
    guide: ["Read guide", "Leer la guía"],
    story: ["Read story", "Leer el cuento"],
  };
  return I.T(...(labels[kind] || ["Open resource", "Abrir recurso"]));
};

/** "Student-facing", "Teacher-facing" or "Family", plus "Family" when families use it too. */
export function audienceLabel(I, d) {
  const f = d.for || [];
  const parts = [];
  if (f.includes("student")) parts.push(I.S("Student-facing", "Para estudiantes"));
  else if (f.includes("teacher")) parts.push(I.S("Teacher-facing", "Para docentes"));
  if (f.includes("family")) parts.push(I.S("Family", "Familia"));
  return parts.join(" · ");
}

const bandsText = (I, d) =>
  d.bands?.length
    ? d.bands.map((b) => I.S(bandLabel(b), bandLabelEs(b))).join(", ")
    : I.S("All grades", "Todos los grados");

function metaList(I, d) {
  const kind = label(KIND_VALUES, d.rk) || KIND_LABEL[d.kind];
  const skill = d.skill && d.skill !== "Mixed" ? label(SKILL_VALUES, d.skill) : null;
  const items = [
    [kind ? I.S(kind.en, kind.es) : "", "kind"],
    [bandsText(I, d), "band"],
    [skill ? I.S(skill.en, skill.es) : "", "skill"],
    [audienceLabel(I, d), "for"],
    [
      Number.isFinite(d.minutes) ? I.S(`About ${d.minutes} min`, `Unos ${d.minutes} min`) : "",
      "time",
    ],
  ].filter(([t]) => t);
  return html`<ul class="fx-meta" aria-label="${I.S("About this resource", "Sobre este recurso")}">
    ${items.map(([t, k]) => html`<li class="fx-tag fx-tag-${k}">${t}</li>`)}
  </ul>`;
}

/** The in-page summary behind "Preview". */
function previewHTML(I, d, href) {
  const rows = [];
  if (d.level && TIERS[d.level])
    rows.push([
      I.S("Support level", "Nivel de apoyo"),
      I.S(
        `${TIERS[d.level].name} (${d.level}): ${TIERS[d.level].range}`,
        `${TIERS[d.level].es} (${d.level})`,
      ),
    ]);
  if (Number.isFinite(d.minutes))
    rows.push([
      I.S("Time", "Tiempo"),
      I.S(`About ${d.minutes} minutes`, `Unos ${d.minutes} minutos`),
    ]);
  rows.push([I.S("Grades", "Grados"), bandsText(I, d)]);
  const aud = audienceLabel(I, d);
  if (aud) rows.push([I.S("Who it is for", "Para quién es"), aud]);
  const dest = d.dest && SECTION_BY_ID[d.section];
  if (dest) rows.push([I.S("Where it lives", "Dónde está"), I.S(dest.title[0], dest.title[1])]);
  const where =
    d.meta?.domain && d.meta.domain !== "Model-Test"
      ? `${BASE}/${d.meta.domain}/${d.meta.level}`
      : "";
  const files = d.files || {};
  return html`<div class="fx-preview" id="fxPrev-${d._n}" hidden>
    
    <dl class="fx-dl">
      ${rows.map(
        ([k, v]) =>
          html`<div>
            <dt>${k}</dt>
            <dd>${v}</dd>
          </div>`,
      )}
    </dl>
    <p class="row-actions">
      ${d.preview ? html`<a class="btn small" href="${d.preview.href}">${icon(d.rk === "printable" ? "print" : "arrow-right")}${I.T(d.preview.en, d.preview.es)}</a>` : ""}
      ${files.pdf && files.pdf !== href ? html`<a class="btn small" href="${files.pdf}">${icon("download")}PDF</a>` : ""}
      ${files.docx ? html`<a class="btn small" href="${files.docx}" download>${icon("download")}Word</a>` : ""}
      ${where ? html`<a class="btn small ghost" href="${where}">${I.T("Open the practice room", "Abrir la sala de práctica")}</a>` : ""}
    </p>
  </div>`;
}

/** A result card. `n` keeps ids unique on the page; `saved` is the set of saved ids. */
export function resultCard(I, r, n, band, qw, saved) {
  const d = { ...r.doc, _n: n };
  const href = hrefFor(d, band);
  const title = I.S(d.title, d.titleEs || d.title);
  const lang = I.spanish && d.titleEs ? "es" : "en";
  const text = I.spanish && d.textEs ? d.textEs : d.text;
  const on = saved.has(d.id);
  const headId = `fxT-${n}`;
  const heading = href
    ? html`<a href="${href}" lang="${lang}">${raw(highlight(title, qw))}</a>`
    : html`<button type="button" class="linklike" data-sx-cmd="${d.cmd}" lang="${lang}">
        ${raw(highlight(title, qw))}
      </button>`;
  return html`<li class="fx-card">
    <span class="fx-card-ico" aria-hidden="true">${icon(d.icon || "search")}</span>
    <div class="fx-card-body">
      <h3 id="${headId}">
        ${heading}${d.external ? html` <span class="fine">${I.T("(another site)", "(otro sitio)")}</span>` : ""}
      </h3>
      ${I.bilingual && d.titleEs && d.titleEs !== d.title ? html`<p class="sx-r-es" lang="es">${d.titleEs}</p>` : ""}
      ${text ? html`<p class="fx-desc" lang="${I.spanish && d.textEs ? "es" : "en"}">${raw(highlight(text, qw))}</p>` : ""}
      ${metaList(I, d)}
      ${d.word ? html`<p class="row-actions"><button type="button" class="btn small" data-say="${d.word.term}">${icon("volume")} ${I.T("Hear it", "Escucharla")}</button>${d.word.es ? html`<span lang="es"><strong>${d.word.es}</strong>${d.word.esDef ? html`: ${d.word.esDef}` : ""}</span>` : ""}</p>` : ""}
      ${
        href
          ? html`<div class="fx-actions" role="group" aria-labelledby="${headId}">
                <a class="btn small btn-primary" href="${href}"
                  >${openLabel(I, d.rk)}<span class="visually-hidden">: ${title}</span></a
                >
                <button
                  type="button"
                  class="btn small"
                  data-fx-preview="${n}"
                  aria-expanded="false"
                  aria-controls="fxPrev-${n}"
                >
                  ${I.T("Preview", "Vista previa")}<span class="visually-hidden">: ${title}</span>
                </button>
                <button type="button" class="btn small ghost" data-fx-copy="${href}">
                  ${icon("copy")}${I.T("Copy link", "Copiar enlace")}<span class="visually-hidden"
                    >: ${title}</span
                  >
                </button>
                <button
                  type="button"
                  class="btn small ghost fx-save"
                  data-fx-save="${d.id}"
                  aria-pressed="${on}"
                >
                  ${icon("bookmark")}<span class="fx-save-label"
                    >${on ? I.T("Saved", "Guardado") : I.T("Save", "Guardar")}</span
                  ><span class="visually-hidden">: ${title}</span>
                </button>
              </div>
              ${previewHTML(I, d, href)}`
          : ""
      }
    </div>
  </li>`;
}

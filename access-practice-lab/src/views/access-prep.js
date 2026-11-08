// WIDA Access Prep Hub: Publisher-grade overview and launchpad for Grades 1–3 and Grades 4–6.
// Organizes all WIDA ACCESS prep activities across Listening, Reading, Speaking, and Writing,
// with tier designations (Tier A & Tier B/C), authentic test formats, and classroom studios.
import { crumbsHTML } from "../components.js";
import { loadIndex, loadShared } from "../content.js";
import { i18nFor } from "../i18n.js";
import { STUDIOS, studioPath } from "../studios.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html, icon, raw } from "../util.js";

const DOMAIN_ICONS = {
  Listening: "listening",
  Reading: "reading",
  Speaking: "speaking",
  Writing: "writing",
};

const DOMAIN_DESCRIPTIONS = {
  Listening: [
    "Follow spoken academic instructions, identify key details, and comprehend oral narratives and science reports.",
    "Sigue instrucciones orales académicas, identifica detalles clave y comprende narraciones y reportes de ciencias.",
  ],
  Reading: [
    "Read informational and narrative texts across science, social studies, math, and language arts with instant evidence checks.",
    "Lee textos informativos y narrativos de ciencias, estudios sociales, matemáticas y lengua con comprobación de evidencia.",
  ],
  Speaking: [
    "Listen to student audio models, structure responses with academic frames, and record spoken answers.",
    "Escucha modelos de audio de estudiantes, estructura respuestas con marcos académicos y graba tus intervenciones.",
  ],
  Writing: [
    "Construct sentences, paragraphs, and multi-paragraph reports with vocabulary banks, sentence frames, and rubrics.",
    "Construye oraciones, párrafos e informes con bancos de palabras, estructuras de oraciones y rúbricas.",
  ],
};

const BAND_META = {
  "1-3": {
    label: "Grades 1–3",
    labelEs: "Grados 1–3",
    sub: "Primary Multilingual Learners · Grades 1, 2, and 3",
    subEs: "Estudiantes multilingües iniciales · 1.º, 2.º y 3.º grado",
    contentBands: ["1", "2-3"],
    defaultPicker: "2-3",
    tagline: "Foundational listening, phonics-grounded reading, picture-cued speaking, and sentence construction.",
    taglineEs: "Comprensión auditiva básica, lectura con apoyo fonético, expresión oral con imágenes y construcción de oraciones.",
  },
  "4-6": {
    label: "Grades 4–6",
    labelEs: "Grados 4–6",
    sub: "Upper Elementary & Intermediate · Grades 4, 5, and 6",
    subEs: "Nivel intermedio y grados superiores · 4.º, 5.º y 6.º grado",
    contentBands: ["3-5", "6-8"],
    defaultPicker: "4-5",
    tagline: "Academic discourse, informational syntheses, structured spoken explanations, and multi-source writing.",
    taglineEs: "Discurso académico, síntesis informativas, explicaciones orales estructuradas y escritura con múltiples fuentes.",
  },
};

let currentBandSelection = "1-3";
let currentDomainFilter = "all";
let searchQuery = "";

function bandFromRoute(grades) {
  if (grades === "1" || grades === "2-3" || grades === "K") return "1-3";
  if (grades === "4-5" || grades === "3-5" || grades === "6-8" || grades === "6" || grades === "7-8") return "4-6";
  return currentBandSelection;
}

/** Flatten activities for a given band grouping from index.json */
function collectBandActivities(indexData, bandKey) {
  const meta = BAND_META[bandKey] || BAND_META["1-3"];
  const results = {
    Listening: { A: [], BC: [] },
    Reading: { A: [], BC: [] },
    Speaking: { A: [], BC: [] },
    Writing: { A: [], BC: [] },
  };

  for (const cb of meta.contentBands) {
    const bandObj = indexData.bands?.[cb];
    if (!bandObj?.domains) continue;
    const picker = cb === "3-5" ? "4-5" : cb;

    for (const domain of CORE_DOMAINS) {
      const dObj = bandObj.domains[domain];
      if (!dObj?.levels) continue;

      for (const [lvl, lvlObj] of Object.entries(dObj.levels)) {
        const tier = lvl === "A" ? "A" : "BC";
        for (const act of lvlObj.activities || []) {
          // act format: [id, title, type, skill, minutes, grades?]
          const [id, title, type, skill, minutes, grades] = act;
          // Filter if band 4-6 and grades is 7 or 8 only (keep grade 6, 4, 5)
          if (bandKey === "4-6" && cb === "6-8" && Array.isArray(grades) && !grades.includes("6") && grades.length > 0) {
            // Keep it anyway for depth if total count is modest
          }
          results[domain][tier].push({
            id,
            title,
            type,
            skill,
            minutes: minutes || 5,
            level: lvl,
            band: picker,
            contentBand: cb,
            href: `${BASE}/${domain}/${lvl}/${id}?grades=${picker}`,
          });
        }
      }
    }
  }

  return results;
}

function activityCardHTML(act, I) {
  return html`
    <article class="prep-activity-card" data-prep-id="${act.id}" data-domain="${act.type}">
      <div class="prep-card-top">
        <span class="prep-tier-badge tier-${act.level.toLowerCase()}">Tier ${act.level}</span>
        <span class="prep-time-badge">${icon("clock")} ${act.minutes} min</span>
      </div>
      <h4 class="prep-card-title">${act.title}</h4>
      <p class="prep-card-skill">${act.skill || I.T("WIDA ACCESS Skill Practice", "Práctica de destreza WIDA ACCESS")}</p>
      <div class="prep-card-footer">
        <a class="btn btn-sm btn-primary prep-launch-btn" href="${act.href}">
          <span>${I.T("Start Activity", "Comenzar")}</span>
          ${icon("arrow-right")}
        </a>
      </div>
    </article>
  `;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band || "2-3";
  if (ctx.route?.grades) {
    currentBandSelection = bandFromRoute(ctx.route.grades);
  }

  const indexData = await loadIndex();
  const activitiesByDomain = collectBandActivities(indexData, currentBandSelection);
  const activeMeta = BAND_META[currentBandSelection];

  // Filter activities based on search query
  const query = searchQuery.trim().toLowerCase();
  const filterList = (list) => {
    if (!query) return list;
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        (a.skill && a.skill.toLowerCase().includes(query)) ||
        a.id.toLowerCase().includes(query),
    );
  };

  const domainCount = (dom) => {
    const a = activitiesByDomain[dom].A.length;
    const bc = activitiesByDomain[dom].BC.length;
    return a + bc;
  };

  return {
    title: I.S("WIDA Access Prep · The Language Page", "Preparación WIDA ACCESS · The Language Page"),
    html: html`
      <div class="access-prep-hub" style="max-width:1200px; margin:0 auto; padding:1.5rem 1rem 4rem;">
        <!-- Breadcrumbs -->
        <nav class="prep-crumbs-bar" style="margin-bottom:1.25rem;">
          ${crumbsHTML([
            { label: I.S("Home", "Inicio"), href: `${BASE}/?grades=${band}` },
            { label: I.S("Access Prep", "Preparación ACCESS") },
          ])}
        </nav>

        <!-- Hero Header -->
        <header class="prep-hero-panel" style="background:linear-gradient(135deg, #142d47 0%, #1e3f63 100%); color:#f5efe4; border-radius:24px; padding:2.5rem 2rem; margin-bottom:2rem; box-shadow:0 8px 32px rgba(20,45,71,0.15);">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:1.5rem;">
            <div style="max-width:720px;">
              <span style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(248,213,140,0.18); color:#f8d58c; padding:0.35rem 0.85rem; border-radius:999px; font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:1rem;">
                ${icon("sparkle")} ${I.T("WIDA 2020 ELD Standards · Publisher Edition", "Estándares WIDA 2020 ELD · Edición editorial")}
              </span>
              <h1 style="font-size:2.4rem; font-weight:900; line-height:1.15; color:#ffffff; margin:0 0 0.85rem; font-family:var(--font-display, inherit);">
                ${I.T("WIDA Access Prep", "Preparación WIDA ACCESS")}
              </h1>
              <p style="font-size:1.1rem; line-height:1.6; color:#d4e2ed; margin:0 0 1.25rem;">
                ${I.T(
                  "High-yield test preparation organized by grade bands. Practice all four domains with authentic WIDA prompt formats, tiered scaffolds, and classroom studios.",
                  "Preparación de alto rendimiento organizada por bandas de grados. Practica los cuatro dominios con formatos auténticos de WIDA, apoyos graduados y estudios de aula.",
                )}
              </p>
              <div style="display:flex; flex-wrap:wrap; gap:0.75rem; font-size:0.85rem; color:#f8d58c;">
                <span style="display:inline-flex; align-items:center; gap:0.35rem;">
                  ${icon("check")} ${I.T("Listening · Reading · Speaking · Writing", "Escuchar · Leer · Hablar · Escribir")}
                </span>
                <span>•</span>
                <span style="display:inline-flex; align-items:center; gap:0.35rem;">
                  ${icon("check")} ${I.T("Tier A (Entering/Emerging) & Tier B/C (Expanding/Bridging)", "Nivel A (Inicial) y Nivel B/C (Avanzado)")}
                </span>
                <span>•</span>
                <span style="display:inline-flex; align-items:center; gap:0.35rem;">
                  ${icon("check")} ${I.T("Device-Only · Progress Saved Locally", "En tu dispositivo · Guardado local")}
                </span>
              </div>
            </div>

            <!-- Quick Launch to Tests & Simulator -->
            <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:18px; padding:1.25rem 1.5rem; text-align:center; min-width:240px;">
              <span style="display:block; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:#f8d58c; margin-bottom:0.5rem;">
                ${I.T("Full Mock Sessions", "Sesiones completas de prueba")}
              </span>
              <p style="font-size:0.9rem; color:#ffffff; margin:0 0 1rem;">
                ${I.T("Take full-length simulated test sittings with timing.", "Realiza pruebas simuladas completas con temporizador.")}
              </p>
              <div style="display:flex; flex-direction:column; gap:0.5rem;">
                <a class="btn btn-sm" style="background:#f8d58c; color:#142d47; font-weight:800; border:none;" href="${BASE}/tests?grades=${activeMeta.defaultPicker}">
                  ${I.T("Practice Tests", "Pruebas de práctica")}
                </a>
                <a class="btn btn-sm" style="background:transparent; color:#ffffff; border:1px solid rgba(255,255,255,0.3);" href="${BASE}/assess?grades=${activeMeta.defaultPicker}">
                  ${I.T("Assessment Simulator", "Simulador de evaluación")}
                </a>
              </div>
            </div>
          </div>
        </header>

        <!-- Grade Band Selector Tabs -->
        <section class="prep-band-selector-section" style="margin-bottom:2rem;">
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem;">
              <h2 style="font-size:1.35rem; font-weight:800; color:#142d47; margin:0;">
                ${I.T("Choose Grade Band", "Elige tu banda de grados")}
              </h2>
              <span style="font-size:0.85rem; color:#544d43;">
                ${I.T("Curriculum content dynamically adjusts for each grade span", "El contenido curricular se adapta a cada nivel")}
              </span>
            </div>

            <div class="prep-band-pills" role="tablist" style="display:flex; gap:0.75rem; flex-wrap:wrap;">
              <button
                type="button"
                role="tab"
                class="btn prep-band-btn ${currentBandSelection === "1-3" ? "btn-primary is-active" : "btn-outline"}"
                data-prep-band="1-3"
                aria-selected="${currentBandSelection === "1-3"}"
                style="padding:0.75rem 1.5rem; font-size:1.05rem; font-weight:800; border-radius:14px;"
              >
                ${icon("reading")}
                <span>${I.T("Grades 1–3", "Grados 1–3")}</span>
                <span class="badge" style="margin-left:0.5rem; font-size:0.75rem; opacity:0.85;">1st · 2nd · 3rd</span>
              </button>

              <button
                type="button"
                role="tab"
                class="btn prep-band-btn ${currentBandSelection === "4-6" ? "btn-primary is-active" : "btn-outline"}"
                data-prep-band="4-6"
                aria-selected="${currentBandSelection === "4-6"}"
                style="padding:0.75rem 1.5rem; font-size:1.05rem; font-weight:800; border-radius:14px;"
              >
                ${icon("sparkle")}
                <span>${I.T("Grades 4–6", "Grados 4–6")}</span>
                <span class="badge" style="margin-left:0.5rem; font-size:0.75rem; opacity:0.85;">4th · 5th · 6th</span>
              </button>
            </div>

            <!-- Active Band Description Callout -->
            <div style="background:#faf6ee; border-left:4px solid #142d47; padding:0.85rem 1.25rem; border-radius:0 12px 12px 0; margin-top:0.5rem;">
              <p style="margin:0; font-size:0.95rem; color:#2c3640; line-height:1.5;">
                <strong>${I.T(activeMeta.sub, activeMeta.subEs)}:</strong>
                ${I.T(activeMeta.tagline, activeMeta.taglineEs)}
              </p>
            </div>
          </div>
        </section>

        <!-- Controls: Domain Filters & Quick Search -->
        <section class="prep-filter-bar" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:2rem; padding:1rem; background:#ffffff; border:1px solid #e2ddd3; border-radius:16px;">
          <!-- Domain Buttons -->
          <div class="prep-domain-filters" style="display:flex; flex-wrap:wrap; gap:0.5rem;">
            <button
              type="button"
              class="btn btn-sm ${currentDomainFilter === "all" ? "btn-primary" : "btn-ghost"}"
              data-prep-domain="all"
              style="border-radius:999px; font-weight:700;"
            >
              ${I.T("All Domains", "Todos")}
            </button>
            ${CORE_DOMAINS.map(
              (d) => html`
                <button
                  type="button"
                  class="btn btn-sm ${currentDomainFilter === d ? "btn-primary" : "btn-ghost"}"
                  data-prep-domain="${d}"
                  style="border-radius:999px; font-weight:700;"
                >
                  ${icon(DOMAIN_ICONS[d])}
                  <span>${I.T(DOMAIN_META[d].name, DOMAIN_META[d].es)}</span>
                  <span style="opacity:0.7; font-size:0.75rem; margin-left:0.25rem;">(${domainCount(d)})</span>
                </button>
              `,
            )}
          </div>

          <!-- Search Box -->
          <div style="display:flex; align-items:center; gap:0.5rem; min-width:240px; flex-grow:1; max-width:360px;">
            <input
              type="search"
              id="prepSearchInput"
              placeholder="${I.T("Search skills or activities…", "Buscar destrezas o actividades…")}"
              value="${searchQuery}"
              style="width:100%; padding:0.5rem 0.85rem; border:1px solid #cbd5e1; border-radius:10px; font-size:0.9rem;"
            />
          </div>
        </section>

        <!-- Domains Display -->
        <div class="prep-domains-container" style="display:flex; flex-direction:column; gap:3rem;">
          ${CORE_DOMAINS.filter((d) => currentDomainFilter === "all" || currentDomainFilter === d).map((d) => {
            const listA = filterList(activitiesByDomain[d].A);
            const listBC = filterList(activitiesByDomain[d].BC);
            const total = listA.length + listBC.length;

            return html`
              <section class="prep-domain-block" data-domain="${d}" style="background:#ffffff; border:1px solid #e2ddd3; border-radius:20px; padding:1.75rem; box-shadow:0 2px 12px rgba(0,0,0,0.03);">
                <!-- Domain Header -->
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:2px solid #f1ece1;">
                  <div style="display:flex; align-items:center; gap:0.85rem;">
                    <div style="width:48px; height:48px; border-radius:14px; background:#142d47; color:#f8d58c; display:flex; align-items:center; justify-content:center; font-size:1.35rem;">
                      ${icon(DOMAIN_ICONS[d])}
                    </div>
                    <div>
                      <h3 style="font-size:1.6rem; font-weight:800; color:#142d47; margin:0 0 0.25rem;">
                        ${I.T(DOMAIN_META[d].name, DOMAIN_META[d].es)}
                      </h3>
                      <p style="margin:0; font-size:0.95rem; color:#544d43;">
                        ${I.T(DOMAIN_DESCRIPTIONS[d][0], DOMAIN_DESCRIPTIONS[d][1])}
                      </p>
                    </div>
                  </div>

                  <a class="btn btn-sm btn-outline" href="${BASE}/${d}?grades=${activeMeta.defaultPicker}">
                    <span>${I.T(`Open ${DOMAIN_META[d].name} Room`, `Abrir sala de ${DOMAIN_META[d].es}`)}</span>
                    ${icon("arrow-right")}
                  </a>
                </div>

                ${total === 0 ? html`
                  <div style="text-align:center; padding:2rem 1rem; color:#64748b;">
                    <p>${I.T("No activities match your current search.", "No hay actividades que coincidan con la búsqueda.")}</p>
                  </div>
                ` : html`
                  <!-- Tier A Activities -->
                  <div class="prep-tier-group" style="margin-bottom:2rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
                      <span class="prep-tier-badge tier-a" style="background:#dbeafe; color:#1e40af; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px; font-size:0.8rem;">
                        Tier A · Entering / Emerging
                      </span>
                      <span style="font-size:0.85rem; color:#64748b;">
                        ${I.T("Heavy scaffolds, visual choices, sentence frames, and clear speech pacing", "Apoyos intensivos, opciones visuales y ritmo pausado")}
                      </span>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
                      ${listA.slice(0, 8).map((act) => activityCardHTML(act, I))}
                    </div>
                  </div>

                  <!-- Tier B/C Activities -->
                  <div class="prep-tier-group">
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
                      <span class="prep-tier-badge tier-bc" style="background:#fef3c7; color:#92400e; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px; font-size:0.8rem;">
                        Tier B/C · Developing / Expanding / Bridging
                      </span>
                      <span style="font-size:0.85rem; color:#64748b;">
                        ${I.T("Complex texts, multi-step explanations, independent speech, and paragraph synthesis", "Textos complejos, explicaciones de varios pasos y síntesis en párrafos")}
                      </span>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
                      ${listBC.slice(0, 8).map((act) => activityCardHTML(act, I))}
                    </div>
                  </div>
                `}
              </section>
            `;
          })}
        </div>

        <!-- Classroom Practice Studios Spotlight -->
        <section class="prep-studios-section" style="margin-top:3rem; background:#f4efe6; border-radius:20px; padding:2rem; border:1px solid #e5dfd3;">
          <div style="margin-bottom:1.25rem;">
            <h3 style="font-size:1.4rem; font-weight:800; color:#142d47; margin:0 0 0.5rem;">
              ${I.T("Integrated WIDA Practice Studios", "Estudios integrados de práctica WIDA")}
            </h3>
            <p style="margin:0; font-size:0.95rem; color:#544d43;">
              ${I.T(
                "Specialized, projector-ready studios designed for whole-group instruction, targeted small-group intervention, and independent fluency.",
                "Estudios especializados listos para proyector, diseñados para instrucción grupal, intervención focalizada y fluidez independiente.",
              )}
            </p>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1rem;">
            ${STUDIOS.map(
              (s) => html`
                <div style="background:#ffffff; border-radius:14px; padding:1.25rem; border:1px solid #e2ddd3; display:flex; flex-direction:column; justify-content:space-between; gap:0.75rem;">
                  <div>
                    <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#0b7a68; letter-spacing:0.06em;">
                      ${icon(DOMAIN_ICONS[s.skill] || "sparkle")} ${s.skill}
                    </span>
                    <h4 style="font-size:1.1rem; font-weight:800; color:#142d47; margin:0.35rem 0 0.4rem;">
                      ${I.T(s.title, s.titleEs)}
                    </h4>
                    <p style="font-size:0.85rem; color:#544d43; margin:0; line-height:1.4;">
                      ${I.T(s.blurb, s.blurbEs)}
                    </p>
                  </div>
                  <a class="btn btn-sm btn-outline" style="align-self:flex-start;" href="${studioPath(s.slug)}">
                    ${I.T("Open Studio", "Abrir estudio")}
                  </a>
                </div>
              `,
            )}
          </div>
        </section>
      </div>
    `,
  };
}

export function onClick(e, ctx) {
  const bandBtn = e.target.closest("[data-prep-band]");
  if (bandBtn) {
    currentBandSelection = bandBtn.dataset.prepBand;
    ctx.rerender();
    return true;
  }

  const domainBtn = e.target.closest("[data-prep-domain]");
  if (domainBtn) {
    currentDomainFilter = domainBtn.dataset.prepDomain;
    ctx.rerender();
    return true;
  }

  return false;
}

export function onInput(e, ctx) {
  if (e.target.id === "prepSearchInput") {
    searchQuery = e.target.value;
    ctx.rerender();
    return true;
  }
  return false;
}

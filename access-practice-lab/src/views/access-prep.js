// WIDA Access Prep Hub: Publisher-grade overview and launchpad for Grades 3–5 and Grades 6–8.
// Organizes ALL WIDA ACCESS prep activities across Listening, Reading, Speaking, and Writing,
// plus Model Tests, with authentic tier designations (Tier A & Tier B/C), skill strands, and direct launch routes.
import { crumbsHTML } from "../components.js";
import { loadIndex } from "../content.js";
import { i18nFor } from "../i18n.js";
import { STUDIOS, studioPath } from "../studios.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html, icon } from "../util.js";

const DOMAIN_ICONS = {
  Listening: "listening",
  Reading: "reading",
  Speaking: "speaking",
  Writing: "writing",
  "Model-Test": "tests",
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
  "Model-Test": [
    "Simulate full standardized testing sessions with authentic multi-part item formats and timing.",
    "Simula sesiones completas de prueba estandarizada con formatos auténticos de ítems y control de tiempo.",
  ],
};

const TYPE_LABELS = {
  multipleChoice: ["Choose", "Elige"],
  multiSelect: ["Choose all", "Elige todas"],
  sort: ["Sort", "Clasifica"],
  order: ["Sequence", "Ordena"],
  cloze: ["Fill in", "Completa"],
  hotText: ["Evidence", "Evidencia"],
  constructed: ["Constructed Response", "Respuesta escrita"],
  worksheet: ["Printable", "Imprimible"],
};

const BAND_META = {
  "3-5": {
    label: "Grades 3–5",
    labelEs: "Grados 3–5",
    sub: "Elementary Multilingual Learners · Grades 3, 4, and 5",
    subEs: "Estudiantes multilingües de primaria · 3.º, 4.º y 5.º grado",
    contentBands: ["3-5"],
    defaultPicker: "3-5",
    tagline: "Academic vocabulary, structured reading with visual scaffolds, audio-supported speaking, and paragraph writing.",
    taglineEs: "Vocabulario académico, lectura estructurada con apoyos visuales, expresión oral con audio y redacción de párrafos.",
  },
  "6-8": {
    label: "Grades 6–8",
    labelEs: "Grados 6–8",
    sub: "Middle School Multilingual Learners · Grades 6, 7, and 8",
    subEs: "Estudiantes multilingües de secundaria · 6.º, 7.º y 8.º grado",
    contentBands: ["6-8"],
    defaultPicker: "6-8",
    tagline: "Complex informational and literary texts, cross-disciplinary debate, multi-paragraph synthesis, and authentic WIDA test formats.",
    taglineEs: "Textos informativos y literarios complejos, debate interdisciplinario, síntesis de múltiples párrafos y formatos auténticos de WIDA.",
  },
};

let currentBandSelection = "6-8";
let currentDomainFilter = "all";
let currentTierFilter = "all";
let searchQuery = "";

function bandFromRoute(grades) {
  const g = String(grades || "").trim();
  if (g === "3-5" || g === "4-5" || g === "3" || g === "4" || g === "5") return "3-5";
  if (g === "6-8" || g === "6" || g === "7" || g === "8" || g === "7-8") return "6-8";
  return currentBandSelection || "6-8";
}

/** Flatten all activities for a given band grouping from index.json */
function collectBandActivities(indexData, bandKey) {
  const meta = BAND_META[bandKey] || BAND_META["6-8"];
  const domainsToInclude = bandKey === "6-8" ? [...CORE_DOMAINS, "Model-Test"] : [...CORE_DOMAINS];
  const results = {};

  for (const d of domainsToInclude) {
    results[d] = { A: [], BC: [] };
  }

  for (const cb of meta.contentBands) {
    const bandObj = indexData.bands?.[cb];
    if (!bandObj?.domains) continue;

    for (const domain of domainsToInclude) {
      const dObj = bandObj.domains[domain];
      if (!dObj?.levels) continue;

      for (const [lvl, lvlObj] of Object.entries(dObj.levels)) {
        // In Model-Test, levels are named "6-8-A" and "6-8-B"
        const isTierA = lvl === "A" || lvl === "6-8-A";
        const tierGroup = isTierA ? "A" : "BC";
        const displayLevel = lvl.includes("-") ? lvl.split("-").pop() : lvl;

        for (const act of lvlObj.activities || []) {
          // act format: [id, title, type, skill, minutes, grades?]
          const [id, title, type, skill, minutes, grades] = act;
          const href =
            domain === "Model-Test"
              ? `${BASE}/Model-Test/6-8/${displayLevel}/${id}?grades=${cb}`
              : `${BASE}/${domain}/${lvl}/${id}?grades=${cb}`;

          results[domain][tierGroup].push({
            id,
            title,
            type: type || "multipleChoice",
            skill: skill || "",
            minutes: minutes || 5,
            level: displayLevel,
            rawLevel: lvl,
            tierGroup,
            band: cb,
            grades: Array.isArray(grades) ? grades : [],
            href,
          });
        }
      }
    }
  }

  return results;
}

function activityRowHTML(act, I) {
  const typeText = TYPE_LABELS[act.type]
    ? I.T(TYPE_LABELS[act.type][0], TYPE_LABELS[act.type][1])
    : act.type;
  const isTierA = act.tierGroup === "A";

  return html`
    <div class="prep-act-item" data-prep-id="${act.id}" data-type="${act.type}">
      <div class="prep-act-main">
        <div class="prep-act-meta-row">
          <span class="prep-tier-tag ${isTierA ? "tag-tier-a" : "tag-tier-bc"}">
            ${isTierA ? "Tier A" : `Tier ${act.level}`}
          </span>
          <span class="prep-type-tag">${typeText}</span>
          <span class="prep-time-tag">${icon("clock")} ${act.minutes} min</span>
        </div>
        <h4 class="prep-act-title">
          <a href="${act.href}">${act.title}</a>
        </h4>
        ${act.skill ? html`<p class="prep-act-skill">${act.skill}</p>` : ""}
      </div>
      <div class="prep-act-action">
        <a class="btn btn-sm btn-primary prep-play-btn" href="${act.href}">
          <span>${I.T("Start", "Iniciar")}</span>
          ${icon("arrow-right")}
        </a>
      </div>
    </div>
  `;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  if (ctx.route?.grades) {
    currentBandSelection = bandFromRoute(ctx.route.grades);
  } else if (ctx.band) {
    currentBandSelection = bandFromRoute(ctx.band);
  }

  const indexData = await loadIndex();
  const activitiesByDomain = collectBandActivities(indexData, currentBandSelection);
  const activeMeta = BAND_META[currentBandSelection] || BAND_META["6-8"];
  const availableDomains = currentBandSelection === "6-8" ? [...CORE_DOMAINS, "Model-Test"] : [...CORE_DOMAINS];

  // Filter activities based on search query and tier filter
  const query = searchQuery.trim().toLowerCase();
  const filterList = (list) => {
    let result = list;
    if (currentTierFilter === "A") {
      result = result.filter((a) => a.tierGroup === "A");
    } else if (currentTierFilter === "BC") {
      result = result.filter((a) => a.tierGroup === "BC");
    }
    if (!query) return result;
    return result.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        (a.skill && a.skill.toLowerCase().includes(query)) ||
        (a.type && a.type.toLowerCase().includes(query)) ||
        a.id.toLowerCase().includes(query),
    );
  };

  const domainCount = (dom) => {
    if (!activitiesByDomain[dom]) return 0;
    const a = activitiesByDomain[dom].A.length;
    const bc = activitiesByDomain[dom].BC.length;
    return a + bc;
  };

  const totalActivitiesInBand = availableDomains.reduce((acc, d) => acc + domainCount(d), 0);

  return {
    title: I.S(
      `WIDA ACCESS Prep Hub (${activeMeta.label}) · The Language Page`,
      `Preparación WIDA ACCESS (${activeMeta.labelEs}) · The Language Page`,
    ),
    html: html`
      <div class="access-prep-hub" style="max-width:1240px; margin:0 auto; padding:1.5rem 1rem 4rem;">
        <!-- Breadcrumbs -->
        <nav class="prep-crumbs-bar" style="margin-bottom:1.25rem;">
          ${crumbsHTML([
            [I.S("The Language Page", "The Language Page"), "/language-adventures/"],
            [I.S("ACCESS Practice Lab", "Laboratorio ACCESS"), `${BASE}/?grades=${activeMeta.defaultPicker}`],
            [I.S("ACCESS Prep Hub", "Centro de Preparación ACCESS"), null],
          ])}
        </nav>

        <!-- Hero Header -->
        <header class="prep-hero-panel" style="background:linear-gradient(135deg, #142d47 0%, #1e3f63 100%); color:#f5efe4; border-radius:24px; padding:2.5rem 2rem; margin-bottom:2rem; box-shadow:0 8px 32px rgba(20,45,71,0.15);">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:1.5rem;">
            <div style="max-width:760px;">
              <span style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(248,213,140,0.18); color:#f8d58c; padding:0.35rem 0.85rem; border-radius:999px; font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:1rem;">
                ${icon("sparkle")} ${I.T("WIDA 2020 ELD Standards · Publisher Edition", "Estándares WIDA 2020 ELD · Edición editorial")}
              </span>
              <h1 style="font-size:2.5rem; font-weight:900; line-height:1.15; color:#ffffff; margin:0 0 0.85rem; font-family:var(--font-display, inherit);">
                ${I.T("WIDA ACCESS Prep Hub", "Centro de Preparación WIDA ACCESS")}
              </h1>
              <p style="font-size:1.1rem; line-height:1.6; color:#d4e2ed; margin:0 0 1.25rem;">
                ${I.T(
                  `Complete high-yield test preparation for ${activeMeta.label}. Practice every domain with authentic WIDA prompt formats, tiered scaffolds, and classroom studios.`,
                  `Preparación completa de alto rendimiento para ${activeMeta.labelEs}. Practica todos los dominios con formatos auténticos de WIDA, apoyos graduados y estudios de aula.`,
                )}
              </p>
              <div style="display:flex; flex-wrap:wrap; gap:0.75rem; font-size:0.85rem; color:#f8d58c;">
                <span style="display:inline-flex; align-items:center; gap:0.35rem;">
                  ${icon("check")} ${I.T(`${totalActivitiesInBand} Activities Total`, `${totalActivitiesInBand} Actividades en total`)}
                </span>
                <span>•</span>
                <span style="display:inline-flex; align-items:center; gap:0.35rem;">
                  ${icon("check")} ${I.T("Listening · Reading · Speaking · Writing", "Escuchar · Leer · Hablar · Escribir")}
                </span>
                <span>•</span>
                <span style="display:inline-flex; align-items:center; gap:0.35rem;">
                  ${icon("check")} ${I.T("Tier A & Tier B/C Alignment", "Alineado a Nivel A y Nivel B/C")}
                </span>
              </div>
            </div>

            <!-- Quick Launch to Tests & Language Adventures -->
            <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:18px; padding:1.25rem 1.5rem; text-align:center; min-width:240px;">
              <span style="display:block; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:#f8d58c; margin-bottom:0.5rem;">
                ${I.T("Simulated Testing", "Pruebas simuladas")}
              </span>
              <p style="font-size:0.9rem; color:#ffffff; margin:0 0 1rem;">
                ${I.T("Full-length simulated test sittings with timing.", "Sesiones completas de examen con temporizador.")}
              </p>
              <div style="display:flex; flex-direction:column; gap:0.5rem;">
                <a class="btn btn-sm" style="background:#f8d58c; color:#142d47; font-weight:800; border:none;" href="${BASE}/tests?grades=${activeMeta.defaultPicker}">
                  ${I.T("Practice Tests", "Pruebas de práctica")}
                </a>
                <a class="btn btn-sm" style="background:transparent; color:#ffffff; border:1px solid rgba(255,255,255,0.3);" href="${BASE}/assess?grades=${activeMeta.defaultPicker}">
                  ${I.T("Assessment Simulator", "Simulador de evaluación")}
                </a>
                <a class="btn btn-sm" style="background:rgba(255,255,255,0.12); color:#ffffff; border:none;" href="/language-adventures/">
                  ${icon("worlds")} ${I.T("Language Adventures", "Aventuras del lenguaje")}
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
                ${I.T("Select Grade Band", "Selecciona la banda de grados")}
              </h2>
              <span style="font-size:0.85rem; color:#544d43;">
                ${I.T("Official WIDA ACCESS Testing Clusters", "Grupos oficiales de evaluación WIDA ACCESS")}
              </span>
            </div>

            <div class="prep-band-pills" role="tablist" style="display:flex; gap:0.75rem; flex-wrap:wrap;">
              <button
                type="button"
                role="tab"
                class="btn prep-band-btn ${currentBandSelection === "3-5" ? "btn-primary is-active" : "btn-outline"}"
                data-prep-band="3-5"
                aria-selected="${currentBandSelection === "3-5"}"
                style="padding:0.75rem 1.6rem; font-size:1.1rem; font-weight:800; border-radius:14px;"
              >
                ${icon("reading")}
                <span>${I.T("Grades 3–5", "Grados 3–5")}</span>
                <span class="badge" style="margin-left:0.5rem; font-size:0.75rem; opacity:0.85;">3rd · 4th · 5th</span>
              </button>

              <button
                type="button"
                role="tab"
                class="btn prep-band-btn ${currentBandSelection === "6-8" ? "btn-primary is-active" : "btn-outline"}"
                data-prep-band="6-8"
                aria-selected="${currentBandSelection === "6-8"}"
                style="padding:0.75rem 1.6rem; font-size:1.1rem; font-weight:800; border-radius:14px;"
              >
                ${icon("sparkle")}
                <span>${I.T("Grades 6–8", "Grados 6–8")}</span>
                <span class="badge" style="margin-left:0.5rem; font-size:0.75rem; opacity:0.85;">6th · 7th · 8th</span>
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
              ${I.T("All Domains", "Todos")} (${totalActivitiesInBand})
            </button>
            ${availableDomains.map(
              (d) => html`
                <button
                  type="button"
                  class="btn btn-sm ${currentDomainFilter === d ? "btn-primary" : "btn-ghost"}"
                  data-prep-domain="${d}"
                  style="border-radius:999px; font-weight:700;"
                >
                  ${icon(DOMAIN_ICONS[d] || "sparkle")}
                  <span>${I.T(DOMAIN_META[d]?.name || d, DOMAIN_META[d]?.es || d)}</span>
                  <span style="opacity:0.75; font-size:0.75rem; margin-left:0.25rem;">(${domainCount(d)})</span>
                </button>
              `,
            )}
          </div>

          <!-- Tier Filter & Search -->
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.75rem; flex-grow:1; justify-content:flex-end;">
            <div class="prep-tier-filters" style="display:flex; gap:0.35rem;">
              <button
                type="button"
                class="btn btn-sm ${currentTierFilter === "all" ? "btn-outline is-active" : "btn-ghost"}"
                data-prep-tier="all"
                style="border-radius:8px; font-size:0.8rem; font-weight:700;"
              >
                ${I.T("All Tiers", "Todos los niveles")}
              </button>
              <button
                type="button"
                class="btn btn-sm ${currentTierFilter === "A" ? "btn-outline is-active" : "btn-ghost"}"
                data-prep-tier="A"
                style="border-radius:8px; font-size:0.8rem; font-weight:700;"
              >
                Tier A
              </button>
              <button
                type="button"
                class="btn btn-sm ${currentTierFilter === "BC" ? "btn-outline is-active" : "btn-ghost"}"
                data-prep-tier="BC"
                style="border-radius:8px; font-size:0.8rem; font-weight:700;"
              >
                Tier B/C
              </button>
            </div>

            <div style="min-width:220px; max-width:320px; flex-grow:1;">
              <input
                type="search"
                id="prepSearchInput"
                placeholder="${I.T("Search skills or titles…", "Buscar destrezas o títulos…")}"
                value="${searchQuery}"
                style="width:100%; padding:0.5rem 0.85rem; border:1px solid #cbd5e1; border-radius:10px; font-size:0.9rem;"
              />
            </div>
          </div>
        </section>

        <!-- Domains Display -->
        <div class="prep-domains-container" style="display:flex; flex-direction:column; gap:2.5rem;">
          ${availableDomains
            .filter((d) => currentDomainFilter === "all" || currentDomainFilter === d)
            .map((d) => {
              const listA = filterList(activitiesByDomain[d]?.A || []);
              const listBC = filterList(activitiesByDomain[d]?.BC || []);
              const total = listA.length + listBC.length;

              const domainName = DOMAIN_META[d]?.name || d;
              const domainNameEs = DOMAIN_META[d]?.es || d;
              const domainDescEn = DOMAIN_DESCRIPTIONS[d]?.[0] || "";
              const domainDescEs = DOMAIN_DESCRIPTIONS[d]?.[1] || "";

              return html`
                <section class="prep-domain-block" data-domain="${d}" style="background:#ffffff; border:1px solid #e2ddd3; border-radius:20px; padding:1.75rem; box-shadow:0 2px 12px rgba(0,0,0,0.03);">
                  <!-- Domain Header -->
                  <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:2px solid #f1ece1;">
                    <div style="display:flex; align-items:center; gap:0.85rem;">
                      <div style="width:48px; height:48px; border-radius:14px; background:#142d47; color:#f8d58c; display:flex; align-items:center; justify-content:center; font-size:1.35rem;">
                        ${icon(DOMAIN_ICONS[d] || "sparkle")}
                      </div>
                      <div>
                        <div style="display:flex; align-items:baseline; gap:0.5rem;">
                          <h3 style="font-size:1.6rem; font-weight:800; color:#142d47; margin:0;">
                            ${I.T(domainName, domainNameEs)}
                          </h3>
                          <span style="font-size:0.9rem; font-weight:700; color:#64748b;">
                            (${total} ${I.T("activities", "actividades")})
                          </span>
                        </div>
                        <p style="margin:0.25rem 0 0; font-size:0.92rem; color:#544d43;">
                          ${I.T(domainDescEn, domainDescEs)}
                        </p>
                      </div>
                    </div>

                    ${d !== "Model-Test" ? html`
                      <a class="btn btn-sm btn-outline" href="${BASE}/${d}?grades=${activeMeta.defaultPicker}">
                        <span>${I.T(`Open ${domainName} Room`, `Abrir sala de ${domainNameEs}`)}</span>
                        ${icon("arrow-right")}
                      </a>
                    ` : ""}
                  </div>

                  ${total === 0 ? html`
                    <div style="text-align:center; padding:2rem 1rem; color:#64748b;">
                      <p>${I.T("No activities match your current search or filter.", "No hay actividades que coincidan con la búsqueda o filtro.")}</p>
                    </div>
                  ` : html`
                    <!-- Tier A Activities (All of them) -->
                    ${listA.length > 0 ? html`
                      <div class="prep-tier-group" style="margin-bottom:2rem;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.85rem; padding-bottom:0.4rem; border-bottom:1px solid #e2e8f0;">
                          <div style="display:flex; align-items:center; gap:0.6rem;">
                            <span class="prep-tier-badge tier-a" style="background:#dbeafe; color:#1e40af; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px; font-size:0.82rem;">
                              Tier A · Entering / Emerging
                            </span>
                            <span style="font-size:0.85rem; color:#64748b;">
                              ${I.T("Visual choices, audio models, and sentence frames", "Opciones visuales, modelos de audio y estructuras de oración")}
                            </span>
                          </div>
                          <span style="font-size:0.82rem; font-weight:700; color:#1e40af;">
                            ${listA.length} ${I.T("tasks", "tareas")}
                          </span>
                        </div>

                        <div class="prep-act-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:0.75rem;">
                          ${listA.map((act) => activityRowHTML(act, I))}
                        </div>
                      </div>
                    ` : ""}

                    <!-- Tier B/C Activities (All of them) -->
                    ${listBC.length > 0 ? html`
                      <div class="prep-tier-group">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.85rem; padding-bottom:0.4rem; border-bottom:1px solid #e2e8f0;">
                          <div style="display:flex; align-items:center; gap:0.6rem;">
                            <span class="prep-tier-badge tier-bc" style="background:#fef3c7; color:#92400e; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px; font-size:0.82rem;">
                              Tier B/C · Developing / Expanding / Bridging
                            </span>
                            <span style="font-size:0.85rem; color:#64748b;">
                              ${I.T("Complex texts, multi-step explanations, and paragraph synthesis", "Textos complejos, explicaciones de varios pasos y síntesis de párrafos")}
                            </span>
                          </div>
                          <span style="font-size:0.82rem; font-weight:700; color:#92400e;">
                            ${listBC.length} ${I.T("tasks", "tareas")}
                          </span>
                        </div>

                        <div class="prep-act-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:0.75rem;">
                          ${listBC.map((act) => activityRowHTML(act, I))}
                        </div>
                      </div>
                    ` : ""}
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
    if (typeof history !== "undefined" && typeof location !== "undefined") {
      const url = new URL(location.href);
      url.searchParams.set("grades", currentBandSelection);
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
    ctx.rerender();
    return true;
  }

  const domainBtn = e.target.closest("[data-prep-domain]");
  if (domainBtn) {
    currentDomainFilter = domainBtn.dataset.prepDomain;
    ctx.rerender();
    return true;
  }

  const tierBtn = e.target.closest("[data-prep-tier]");
  if (tierBtn) {
    currentTierFilter = tierBtn.dataset.prepTier;
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

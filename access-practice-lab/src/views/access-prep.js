// WIDA Access Prep Hub: Publisher-grade overview and launchpad for Grades 3–5 and Grades 6–8.
// Organizes ALL WIDA ACCESS prep activities across Listening, Reading, Speaking, and Writing,
// plus Model Tests, with authentic tier designations (Tier A & Tier B/C), skill strands, and direct launch routes.
import { crumbsHTML, recorderHTML } from "../components.js";
import { loadIndex, loadPrep } from "../content.js";
import { i18nFor } from "../i18n.js";
import { isRecording } from "../recorder.js";
import { loadRecord } from "../store.js";
import { STUDIOS, studioPath } from "../studios.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html, icon, raw } from "../util.js";
import { isDone, wordSentenceCheck } from "../prep/model.js";
import { PREP_SKILL_LIST, isPrepSkill } from "../prep/registry.js";
import { hearPairHTML } from "../prep/ui.js";

// /access-prep/<skill>[/<set>] is a skill builder (src/prep/view.js), loaded only when opened.
let prepView = null;

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
let workbenchTab = "duo"; // "duo" | "ext"
let inlineDuoPlaced = [];
let inlineDuoChecked = null;
let inlineExtText = "";
// Each tier group opens with a short preview; "Show all" expands that one group. A search shows every match.
// Phones stack one card per row, so they preview three.
const previewSize = () => (typeof matchMedia === "function" && matchMedia("(max-width: 599px)").matches ? 3 : 6);
const expanded = new Set();

function cappedGridHTML(list, key, I) {
  const all = Boolean(searchQuery.trim()) || expanded.has(key) || list.length <= previewSize();
  const shown = all ? list : list.slice(0, previewSize());
  return html`<div class="prep-act-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:0.75rem;">
      ${shown.map((act) => activityRowHTML(act, I))}
    </div>
    ${all ? "" : html`<p class="prep-more"><button type="button" class="btn small" data-prep-more="${key}" aria-label="${I.S(`Show all ${list.length} activities in this group`, `Mostrar las ${list.length} actividades de este grupo`)}">${I.T(`Show all ${list.length}`, `Mostrar las ${list.length}`)} ${icon("chevron-down")}</button></p>`}`;
}

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
        const doneSet = new Set(loadRecord(cb, domain, lvl).complete || []);

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
            done: doneSet.has(id),
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
    <div class="prep-act-item ${act.done ? "is-done" : ""}" data-prep-id="${act.id}" data-type="${act.type}">
      <div class="prep-act-main">
        <div class="prep-act-meta-row">
          <span class="prep-tier-tag ${isTierA ? "tag-tier-a" : "tag-tier-bc"}">
            ${isTierA ? "Tier A" : `Tier ${act.level}`}
          </span>
          <span class="prep-type-tag">${typeText}</span>
          <span class="prep-time-tag">${icon("clock")} ${act.minutes} min</span>
          ${act.done ? html`<span class="prep-done-pill">${icon("check")} ${I.T("Done", "Hecho")}</span>` : ""}
        </div>
        <h4 class="prep-act-title">
          <a href="${act.href}">${act.title}</a>
        </h4>
        ${act.skill ? html`<p class="prep-act-skill">${act.skill}</p>` : ""}
      </div>
      <div class="prep-act-action">
        <a class="btn btn-sm btn-primary prep-play-btn" href="${act.href}">
          <span>${act.done ? I.T("Review", "Repasar") : I.T("Start", "Iniciar")}</span>
          ${icon("arrow-right")}
        </a>
      </div>
    </div>
  `;
}

/** Audience & Age strip: clear starting doors for Students, Teachers, Families, and Early Learners K–2. */
function audienceStripHTML(I, band) {
  return html`<section class="prep-audience-strip" aria-label="${I.S("Paths for students, teachers, families, and early grades", "Rutas para estudiantes, docentes, familias y primeros grados")}">
    <a class="prep-audience-card" href="${BASE}/access-prep/daily-drill?grades=${band}">
      <span class="prep-audience-ico">${icon("sparkle")}</span>
      <span>
        <strong>${I.T("Students · Language Path & Micro-Drills", "Estudiantes · Ruta y microejercicios")}</strong>
        <span class="fine">${I.T("5-step interactive sets: match words, listen slow or normal, and forge sentences.", "Conjuntos interactivos de 5 pasos: une palabras, escucha lento o normal y forja oraciones.")}</span>
      </span>
    </a>
    <a class="prep-audience-card" href="${BASE}/access-prep/extempore-speak?grades=${band}">
      <span class="prep-audience-ico">${icon("speaking")}</span>
      <span>
        <strong>${I.T("Students · Extempore Speaking Lab", "Estudiantes · Laboratorio oral Extempore")}</strong>
        <span class="fine">${I.T("Hear a model student, then respond across Tier A, Tier B, and Tier C turns.", "Escucha a un estudiante modelo y responde en turnos de Nivel A, Nivel B y Nivel C.")}</span>
      </span>
    </a>
    <a class="prep-audience-card" href="${BASE}/start?grades=${band}">
      <span class="prep-audience-ico">${icon("teacher")}</span>
      <span>
        <strong>${I.T("Teachers · Tour, Lesson Builder & Class", "Docentes · Recorrido, lecciones y clase")}</strong>
        <span class="fine">${I.T("Project whole-class routines, build a lesson in one click, or review evidence.", "Proyecta rutinas de clase, crea una lección en un clic o revisa la evidencia.")}</span>
      </span>
    </a>
    <a class="prep-audience-card" href="${BASE}/family?grades=${band}">
      <span class="prep-audience-ico">${icon("families")}</span>
      <span>
        <strong>${I.T("Families & K–2 · Home Talk & Early Hub", "Familias y K–2 · Casa y primeros grados")}</strong>
        <span class="fine">${I.T("Bilingual home activities and audio-first practice for younger learners.", "Actividades bilingües para casa y práctica con audio para los más pequeños.")}</span>
      </span>
    </a>
  </section>`;
}

/** Embedded interactive Duolingo Skill Path + Extempore Speaking Workbench directly on /access-prep. */
function liveWorkbenchHTML(I, band, duoSets = [], extSets = []) {
  const duoSet = duoSets[0];
  const extSet = extSets[0];
  if (!duoSet || !extSet) return "";
  const offsets = ["is-center", "is-left", "is-center", "is-right"];
  const targetParts = duoSet.forge.parts.filter((p) => typeof p === "object").map((p) => p.answer);
  const bankTiles = duoSet.forge.parts.filter((p) => typeof p === "object").flatMap((p) => p.options);
  const lowerExt = inlineExtText.toLowerCase();

  return html`<section class="prep-live-workbench" aria-labelledby="prepWbH">
    <div class="prep-wb-header">
      <div>
        <p class="prep-eyebrow">${icon("sparkle")} ${I.T("Interactive Live Practice Stage", "Escenario interactivo de práctica en vivo")}</p>
        <h2 id="prepWbH">${I.T("Try the Duolingo Skill Path & Extempore Speaking Studio right here", "Prueba la Ruta estilo Duolingo y el Estudio Oral Extempore aquí mismo")}</h2>
      </div>
      <div class="prep-wb-tabs" role="tablist" aria-label="${I.S("Choose live practice mode", "Elige modo de práctica en vivo")}">
        <button
          type="button"
          role="tab"
          class="btn small ${workbenchTab === "duo" ? "btn-primary" : ""}"
          data-prep-wb="duo"
          aria-selected="${String(workbenchTab === "duo")}"
        >
          ${icon("sparkle")} ${I.T("1. Duolingo Skill Path & Word Bank", "1. Ruta y Banco de Palabras")}
        </button>
        <button
          type="button"
          role="tab"
          class="btn small ${workbenchTab === "ext" ? "btn-primary" : ""}"
          data-prep-wb="ext"
          aria-selected="${String(workbenchTab === "ext")}"
        >
          ${icon("speaking")} ${I.T("2. Extempore Speaking Studio", "2. Estudio Oral Extempore")}
        </button>
      </div>
    </div>

    ${
      workbenchTab === "duo"
        ? html`<div class="prep-wb-grid">
            <div class="duo-unit-stage">
              <div class="duo-unit-banner">
                <div>
                  <p class="duo-unit-kicker">${I.T(`SKILL PATH · GRADES ${band.replace("-", "–")}`, `RUTA · GRADOS ${band.replace("-", "–")}`)}</p>
                  <h3 class="duo-unit-title">${I.T("Tap any stepping stone to open its 5-step lesson", "Toca cualquier piedra para abrir su lección de 5 pasos")}</h3>
                </div>
                <a class="btn small" href="${BASE}/access-prep/daily-drill?grades=${band}">
                  ${I.T("All sets", "Todos")} ${icon("arrow-right")}
                </a>
              </div>
              <ol class="duo-winding-path">
                ${duoSets.map((s, idx) => {
                  const done = isDone("daily-drill", s.id);
                  return html`<li class="duo-winding-row ${offsets[idx % offsets.length]}">
                    ${idx === 0 && !done ? html`<span class="duo-start-pill">${I.T("START", "EMPEZAR")}</span>` : ""}
                    <a
                      class="duo-stone ${done ? "is-done" : ""} ${idx === 0 ? "is-current" : ""}"
                      href="${BASE}/access-prep/daily-drill/${s.id}?grades=${band}"
                      aria-label="${I.S(s.title, s.titleEs || s.title)}"
                    >
                      <span class="duo-stone-ico">${icon(done ? "check" : "star")}</span>
                    </a>
                    <span class="duo-stone-caption">${I.T(s.title, s.titleEs || s.title)} · ${s.area}</span>
                  </li>`;
                })}
              </ol>
            </div>

            <div class="prep-wb-player">
              <div class="duo-topbar">
                <div class="duo-progress-track" aria-hidden="true">
                  <div class="duo-progress-fill" style="width:${Math.min(100, Math.max(20, Math.round((inlineDuoPlaced.length / targetParts.length) * 100)))}%">
                    <span class="duo-progress-shine"></span>
                  </div>
                </div>
                <span class="duo-step-pill">${duoSet.area} · ${duoSet.kind}</span>
              </div>
              <p class="fine"><strong>${I.T("Quick Challenge — Upgrade this everyday sentence:", "Reto rápido — Mejora esta oración cotidiana:")}</strong></p>
              <blockquote class="prep-prompt">
                <p lang="en">${duoSet.forge.starter}</p>
                ${hearPairHTML(I, duoSet.forge.starter)}
              </blockquote>
              <div class="duo-lined-tray">
                <span class="duo-tray-label">${I.T("Tap 3 clauses in order to forge the academic sentence:", "Toca 3 cláusulas en orden para forjar la oración académica:")}</span>
                <div class="duo-placed-row">
                  ${inlineDuoPlaced.length
                    ? inlineDuoPlaced.map(
                        (t, idx) =>
                          html`<button type="button" class="duo-tile3d is-placed" data-wb-duo-remove="${idx}">
                            <span class="duo-slot-badge">${idx + 1}</span>
                            <span lang="en">${t}</span>
                            <span aria-hidden="true">×</span>
                          </button>`,
                      )
                    : html`<span class="duo-empty-slot is-target">${I.T("Tap tiles below…", "Toca las fichas abajo…")}</span>`}
                </div>
              </div>
              <div class="duo-bank-grid">
                ${bankTiles.map((opt) => {
                  const used = inlineDuoPlaced.includes(opt);
                  return html`<button
                    type="button"
                    class="duo-tile3d ${used ? "is-used-tile" : ""}"
                    data-wb-duo-add="${opt}"
                    ${used ? raw("disabled") : ""}
                  >
                    <span lang="en">${opt}</span>
                  </button>`;
                })}
              </div>
              <div class="row-actions" style="margin-top:0.85rem;">
                <button
                  type="button"
                  class="btn btn-primary"
                  data-wb-duo-check
                  ${inlineDuoPlaced.length === targetParts.length ? "" : raw("disabled")}
                >
                  ${icon("check")} ${I.T("Check my sentence", "Revisar mi oración")}
                </button>
                <a class="btn" href="${BASE}/access-prep/daily-drill/${duoSet.id}?grades=${band}">
                  ${I.T("Open full 5-step lesson", "Abrir lección completa de 5 pasos")} ${icon("arrow-right")}
                </a>
              </div>
              ${
                inlineDuoChecked !== null
                  ? html`<div class="feedback ${inlineDuoChecked ? "is-right" : "is-hint"}" role="status" style="margin-top:0.75rem;">
                      <p class="fb-title">
                        ${icon(inlineDuoChecked ? "check" : "retry")}
                        ${inlineDuoChecked ? I.T("Nicely done! Academic sentence forged.", "¡Muy bien! Oración académica forjada.") : I.T("Almost! Pick the three strongest academic clauses in order.", "¡Casi! Elige las tres cláusulas académicas más sólidas en orden.")}
                      </p>
                      <p class="prep-model" lang="en">${duoSet.forge.model} ${hearPairHTML(I, duoSet.forge.model)}</p>
                    </div>`
                  : ""
              }
            </div>
          </div>`
        : html`<div class="ext-studio-split">
            <aside class="ext-left-pane">
              <div class="ext-monitor">
                <div class="ext-monitor-head">
                  <span class="ext-avatar-chip">${icon("teacher")}</span>
                  <div>
                    <strong class="ext-monitor-title">${I.T("Instructor Prompt", "Consigna docente")} · ${extSet.title}</strong>
                    <span class="fine">${extSet.area} · ${extSet.kind}</span>
                  </div>
                </div>
                <p class="ext-prompt-script" lang="en">${extSet.scene.teacherPrompt}</p>
                <div class="ext-monitor-controls">
                  ${hearPairHTML(I, extSet.scene.teacherPrompt, I.T("Play Prompt", "Escuchar consigna"))}
                </div>
              </div>
              <div class="ext-exemplar-box">
                <div class="prep-answer-h">
                  <strong>${icon("speaking")} ${I.T(`Model Student (${extSet.scene.modelStudent.name})`, `Estudiante modelo (${extSet.scene.modelStudent.name})`)}</strong>
                  ${hearPairHTML(I, extSet.scene.modelStudent.text)}
                </div>
                <p lang="en">${extSet.scene.modelStudent.text}</p>
              </div>
            </aside>
            <div class="ext-right-pane">
              <blockquote class="prep-prompt">
                <p lang="en"><strong>${extSet.turn3.prompt}</strong></p>
                ${hearPairHTML(I, extSet.turn3.prompt)}
              </blockquote>
              <div class="ext-radar-panel">
                <p class="ext-radar-title">
                  ${icon("sparkle")}
                  <strong>${I.T("Live WIDA Language Radar (tap any word or connector to add it):", "Radar de lenguaje WIDA en vivo (toca para agregar):")}</strong>
                </p>
                <div class="ext-radar-group">
                  ${extSet.turn3.words.map((w) => {
                    const hit = wordSentenceCheck(w, lowerExt).word;
                    return html`<button type="button" class="ext-radar-chip ${hit ? "is-hit" : ""}" data-wb-ext-token="${w}">
                      ${icon(hit ? "check" : "words")} <span lang="en">${w}</span>
                    </button>`;
                  })}
                  ${extSet.turn3.connectors.map((c) => {
                    const hit = lowerExt.includes(c.toLowerCase());
                    return html`<button type="button" class="ext-radar-chip ${hit ? "is-hit" : ""}" data-wb-ext-token="${c}">
                      ${icon(hit ? "check" : "bulb")} <span lang="en">${c}</span>
                    </button>`;
                  })}
                </div>
              </div>
              ${recorderHTML(`wb-ext-${extSet.id}`, { recording: isRecording(`wb-ext-${extSet.id}`) })}
              <label class="prep-write" for="wbExtInput">
                <strong>${I.T("Type or dictate your spoken response:", "Escribe o dicta tu respuesta oral:")}</strong>
              </label>
              <textarea
                id="wbExtInput"
                class="prep-textarea"
                rows="3"
                placeholder="${I.S("Speak or type here to test the live WIDA radar…", "Habla o escribe aquí para probar el radar WIDA en vivo…")}"
              >${inlineExtText}</textarea>
              <div class="row-actions" style="margin-top:0.75rem;">
                <a class="btn btn-primary" href="${BASE}/access-prep/extempore-speak/${extSet.id}?grades=${band}">
                  ${I.T("Open full 3-Turn Extempore Studio", "Abrir Estudio Extempore completo de 3 turnos")} ${icon("arrow-right")}
                </a>
                <a class="btn" href="${BASE}/access-prep/extempore-speak?grades=${band}">
                  ${I.T("All Extempore sets", "Todos los conjuntos")}
                </a>
              </div>
            </div>
          </div>`
    }
  </section>`;
}

/** The skill builders: short guided sets that teach one test move each (src/prep/). */
function skillBuildersHTML(I, band, duoSets = [], extSets = []) {
  return html`${audienceStripHTML(I, band)}
  ${liveWorkbenchHTML(I, band, duoSets, extSets)}
  <section class="prep-builders" aria-labelledby="prepBuildersH">
    <h2 id="prepBuildersH">${I.T("Skill builders & interactive labs", "Constructores de destrezas y laboratorios interactivos")}</h2>
    <p class="prep-builders-lede">${I.T("Short, guided practice for the moves ACCESS tasks reward — including our Duolingo-style Micro-Drills and Extempore Speaking Lab. Untimed, with help at every step.", "Práctica corta y guiada para las destrezas que premian las tareas de ACCESS, incluyendo nuestros Microejercicios y el Laboratorio oral Extempore. Sin tiempo y con ayuda en cada paso.")}</p>
    <ul class="prep-builder-cards">
      ${PREP_SKILL_LIST.map(
        (s) => html`<li class="prep-builder-card ${s.slug === "daily-drill" || s.slug === "extempore-speak" ? "is-featured" : ""}">
          <a href="${BASE}/access-prep/${s.slug}?grades=${band}">
            <span class="prep-builder-ico">${icon(s.icon)}</span>
            <span class="prep-builder-domain">${I.T(s.domainLabel[0], s.domainLabel[1])}</span>
            <span class="prep-builder-title">${I.T(s.title, s.titleEs)}</span>
            <span class="prep-builder-blurb">${I.T(s.blurb[0], s.blurb[1])}</span>
            <span class="prep-builder-go">${I.T("Start", "Empezar")} ${icon("arrow-right")}</span>
          </a>
        </li>`,
      )}
    </ul>
  </section>`;
}

let cachedDuoSets = [];

export async function render(ctx) {
  if (isPrepSkill(ctx.route?.id)) {
    prepView = await import("../prep/view.js");
    return prepView.render(ctx, ctx.route.id, ctx.route.setId);
  }
  prepView?.unmount();
  prepView = null;
  const I = i18nFor(ctx);
  if (ctx.route?.grades) {
    currentBandSelection = bandFromRoute(ctx.route.grades);
  } else if (ctx.band) {
    currentBandSelection = bandFromRoute(ctx.band);
  }

  const [indexData, duoAll, extAll] = await Promise.all([
    loadIndex(),
    loadPrep("daily-drill").catch(() => ({})),
    loadPrep("extempore-speak").catch(() => ({})),
  ]);
  const duoSets = duoAll[currentBandSelection] || [];
  const extSets = extAll[currentBandSelection] || [];
  cachedDuoSets = duoSets;
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

        ${skillBuildersHTML(I, currentBandSelection, duoSets, extSets)}

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

                        ${cappedGridHTML(listA, `${d}:A`, I)}
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

                        ${cappedGridHTML(listBC, `${d}:BC`, I)}
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
  if (prepView) return prepView.onClick(e, ctx);
  const wbBtn = e.target.closest("[data-prep-wb]");
  if (wbBtn) {
    workbenchTab = wbBtn.dataset.prepWb;
    ctx.rerender();
    return true;
  }
  const addTile = e.target.closest("[data-wb-duo-add]");
  if (addTile) {
    inlineDuoPlaced = [...inlineDuoPlaced, addTile.dataset.wbDuoAdd];
    inlineDuoChecked = null;
    ctx.rerender();
    return true;
  }
  const remTile = e.target.closest("[data-wb-duo-remove]");
  if (remTile) {
    const idx = Number(remTile.dataset.wbDuoRemove);
    inlineDuoPlaced = inlineDuoPlaced.filter((_, i) => i !== idx);
    inlineDuoChecked = null;
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-wb-duo-check]")) {
    const targetParts = (cachedDuoSets[0]?.forge?.parts || [])
      .filter((p) => typeof p === "object")
      .map((p) => p.answer);
    inlineDuoChecked =
      inlineDuoPlaced.length === targetParts.length &&
      inlineDuoPlaced.every((v, i) => v === targetParts[i]);
    ctx.rerender();
    return true;
  }
  const extToken = e.target.closest("[data-wb-ext-token]");
  if (extToken) {
    const tok = extToken.dataset.wbExtToken;
    inlineExtText = inlineExtText.trim() ? `${inlineExtText.trim()} ${tok} ` : `${tok} `;
    ctx.rerender();
    return true;
  }
  const bandBtn = e.target.closest("[data-prep-band]");
  if (bandBtn) {
    currentBandSelection = bandBtn.dataset.prepBand;
    inlineDuoPlaced = [];
    inlineDuoChecked = null;
    if (typeof history !== "undefined" && typeof location !== "undefined") {
      const url = new URL(location.href);
      url.searchParams.set("grades", currentBandSelection);
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
    ctx.rerender();
    return true;
  }

  const more = e.target.closest("[data-prep-more]");
  if (more) {
    expanded.add(more.dataset.prepMore);
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

export function onChange(e, ctx) {
  prepView?.onChange(e, ctx);
}

export function unmount() {
  prepView?.unmount();
}

export function onInput(e, ctx) {
  if (prepView) return prepView.onInput(e, ctx);
  if (e.target.id === "prepSearchInput") {
    searchQuery = e.target.value;
    ctx.rerender();
    return true;
  }
  if (e.target.id === "wbExtInput") {
    inlineExtText = e.target.value;
    ctx.rerender({ keepFocus: true });
    return true;
  }
  return false;
}

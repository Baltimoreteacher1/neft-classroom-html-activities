/**
 * curriculum-hub-progressive.js — Progressive disclosure hub engine.
 *
 * Implements:
 * - Manifest-driven reactive rendering (10 units · 84 core lessons).
 * - Single-unit isolation with sticky ribbon & sessionStorage persistence.
 * - Deep linking with #unit-X and #lesson-X-Y hash routing.
 * - Role-based DOM absence: protected Teacher Tray & answer keys are NEVER present in Student Mode DOM.
 * - In-place language switching (EN/ES) without page reload.
 * - Docs popover menu with roving tabindex, Escape/click-outside dismiss.
 * - Standards search gated to Teacher Mode only.
 * - Zero storage loop overhead on boot.
 */

(function () {
  "use strict";

  // Representation SVG icons (Navy + Teal, zero purple)
  const REP_ICONS = {
    "tape-diagram":
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="6" x2="8" y2="18" stroke="currentColor" stroke-width="2"/><line x1="14" y1="6" x2="14" y2="18" stroke="currentColor" stroke-width="2"/></svg>',
    "double-number-line":
      '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="2" y1="7" x2="22" y2="7" stroke="currentColor" stroke-width="2"/><line x1="2" y1="17" x2="22" y2="17" stroke="currentColor" stroke-width="2"/><line x1="6" y1="4" x2="6" y2="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="4" x2="12" y2="10" stroke="currentColor" stroke-width="2"/><line x1="18" y1="4" x2="18" y2="10" stroke="currentColor" stroke-width="2"/><line x1="6" y1="14" x2="6" y2="20" stroke="currentColor" stroke-width="2"/><line x1="12" y1="14" x2="12" y2="20" stroke="currentColor" stroke-width="2"/><line x1="18" y1="14" x2="18" y2="20" stroke="currentColor" stroke-width="2"/></svg>',
    "coordinate-plane":
      '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="2.5" fill="currentColor"/><circle cx="7" cy="17" r="2.5" fill="currentColor"/></svg>',
    table:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="2"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="2"/></svg>',
  };

  const REP_NAMES = {
    en: {
      "tape-diagram": "Tape diagram model",
      "double-number-line": "Double number line",
      "coordinate-plane": "Coordinate plane",
      table: "Ratio table",
    },
    es: {
      "tape-diagram": "Modelo de barras",
      "double-number-line": "Recta numérica doble",
      "coordinate-plane": "Plano de coordenadas",
      table: "Tabla de razones",
    },
  };

  let manifestData = null;
  let activeUnitNumber = 1;
  let expandedLessonId = null;
  let openMenuContainer = null;
  let searchQuery = "";

  // Helper to read state safely from CurriculumShell
  function getLang() {
    return window.CurriculumShell ? window.CurriculumShell.getLanguage() : "en";
  }

  function isTeacher() {
    return window.CurriculumShell ? window.CurriculumShell.isTeacher() : false;
  }

  function getSupports() {
    return window.CurriculumShell ? window.CurriculumShell.getSupports() : false;
  }

  // Load manifest asynchronously or from embedded script
  async function loadManifest() {
    if (window.__CURRICULUM_MANIFEST__) {
      manifestData = window.__CURRICULUM_MANIFEST__;
      return manifestData;
    }
    try {
      const res = await fetch("/data/curriculum-manifest.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      manifestData = await res.json();
      return manifestData;
    } catch (e) {
      console.error("Failed to load curriculum manifest:", e);
      return null;
    }
  }

  // Read initial active unit from sessionStorage or hash
  function resolveInitialSelection() {
    const hash = window.location.hash;
    if (hash.startsWith("#unit-")) {
      const u = parseInt(hash.replace("#unit-", ""), 10);
      if (u >= 1 && u <= 10) activeUnitNumber = u;
    } else if (hash.startsWith("#lesson-")) {
      const id = hash.replace("#lesson-", "");
      const match = id.match(/^(\d+)-/);
      if (match) {
        const u = parseInt(match[1], 10);
        if (u >= 1 && u <= 10) activeUnitNumber = u;
      }
      expandedLessonId = id;
    } else {
      try {
        const stored = sessionStorage.getItem("nt_active_unit");
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (parsed >= 1 && parsed <= 10) activeUnitNumber = parsed;
        }
      } catch (_e) {}
    }
  }

  function selectUnit(unitNumber, updateUrl) {
    if (unitNumber < 1 || unitNumber > 10) return;
    activeUnitNumber = unitNumber;
    searchQuery = "";
    try {
      sessionStorage.setItem("nt_active_unit", String(unitNumber));
    } catch (_e) {}

    if (updateUrl !== false) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", `#unit-${unitNumber}`);
      }
    }
    renderHub();
  }

  function toggleLesson(lessonId) {
    if (expandedLessonId === lessonId) {
      expandedLessonId = null;
    } else {
      expandedLessonId = lessonId;
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", `#lesson-${lessonId}`);
      }
    }
    renderHub();

    if (expandedLessonId) {
      setTimeout(() => {
        const row = document.getElementById(`lesson-row-${expandedLessonId}`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 50);
    }
  }

  // Render the entire progressive hub
  function renderHub() {
    const container = document.getElementById("hub-progressive-mount");
    if (!container || !manifestData) return;

    const lang = getLang();
    const isT = isTeacher();
    const supports = getSupports();

    const units = manifestData.units || [];
    const activeUnit = units.find((u) => u.number === activeUnitNumber) || units[0];
    const allLessons = manifestData.lessons || [];

    // Filter lessons: either search query or active unit
    let visibleLessons = [];
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      visibleLessons = allLessons.filter((l) => {
        const idMatch = l.id.toLowerCase().includes(q);
        const titleMatch =
          (l.title.en && l.title.en.toLowerCase().includes(q)) ||
          (l.title.es && l.title.es.toLowerCase().includes(q));
        const bigIdeaMatch =
          (l.bigIdea.en && l.bigIdea.en.toLowerCase().includes(q)) ||
          (l.bigIdea.es && l.bigIdea.es.toLowerCase().includes(q));
        // Standards search ONLY allowed in Teacher Mode
        const stdMatch =
          isT && Array.isArray(l.standards) && l.standards.some((s) => s.toLowerCase().includes(q));
        return idMatch || titleMatch || bigIdeaMatch || stdMatch;
      });
    } else {
      visibleLessons = allLessons.filter((l) => l.unit === activeUnitNumber);
    }

    let html = '<div class="hub-progressive-container">';

    // Tier 1: Sticky Unit Ribbon & Quick Search
    html += renderStickyBar(units, activeUnitNumber, searchQuery, lang, isT);

    // If searching, show search header card instead of unit card
    if (searchQuery.trim().length > 0) {
      html += renderSearchHeaderCard(visibleLessons.length, searchQuery, lang);
    } else if (activeUnit) {
      // Tier 1: Unit Header Card
      html += renderUnitHeaderCard(activeUnit, visibleLessons.length, lang);
    }

    // Tier 2 & Tier 3: Lesson Rows and In-place Drawers
    html += '<section class="hub-lesson-list" aria-label="Lessons">';
    if (visibleLessons.length === 0) {
      html += `<div class="hub-empty-state"><p>${
        lang === "es"
          ? "No se encontraron lecciones para esta búsqueda."
          : "No lessons found matching your search."
      }</p></div>`;
    } else {
      for (let i = 0; i < visibleLessons.length; i++) {
        const lesson = visibleLessons[i];
        const isExpanded = lesson.id === expandedLessonId;
        html += renderLessonRowCard(lesson, isExpanded, lang, isT, supports);
      }
    }
    html += "</section>";

    html += "</div>";

    container.innerHTML = html;
    bindHubEvents(container);
  }

  function renderStickyBar(units, activeNum, query, lang, isT) {
    const searchPlaceholder = isT
      ? lang === "es"
        ? "Buscar lección #, tema o estándar (ej. 3-4, 6.RP)..."
        : "Jump to lesson #, topic, or standard (e.g. 3-4, 6.RP)..."
      : lang === "es"
        ? "Buscar lección # o tema (ej. 3-4, razones)..."
        : "Jump to lesson # or topic (e.g. 3-4, ratios)...";

    let tabsHtml = "";
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      const isSelected = u.number === activeNum && !query;
      tabsHtml += `<button type="button" role="tab" class="hub-unit-tab" data-unit-tab="${u.number}" aria-selected="${
        isSelected ? "true" : "false"
      }">Unit ${u.number}</button>`;
    }

    return `
      <div class="hub-sticky-bar" role="toolbar" aria-label="${
        lang === "es" ? "Navegación de unidades" : "Unit navigation"
      }">
        <div class="hub-unit-ribbon" role="tablist">
          ${tabsHtml}
        </div>
        <div class="hub-search-box">
          <input type="search" class="hub-search-input" id="hub-quick-search"
            placeholder="${searchPlaceholder}"
            value="${escapeHtml(query)}"
            aria-label="${lang === "es" ? "Buscar en el currículo" : "Search curriculum"}" />
          <button type="button" class="hub-search-clear" id="hub-search-clear"
            aria-hidden="${query ? "false" : "true"}"
            aria-label="${lang === "es" ? "Limpiar búsqueda" : "Clear search"}">✕</button>
        </div>
      </div>
    `;
  }

  function renderUnitHeaderCard(unit, lessonCount, lang) {
    const titleText = lang === "es" && unit.title.es ? unit.title.es : unit.title.en;
    const isFallback = lang === "es" && !unit.title.es;
    const langAttr = isFallback ? ' lang="en"' : "";

    const bigIdeaText = lang === "es" && unit.bigIdea.es ? unit.bigIdea.es : unit.bigIdea.en;
    const bigIdeaLangAttr = lang === "es" && !unit.bigIdea.es ? ' lang="en"' : "";

    let capstonesHtml = "";
    if (unit.capstones) {
      if (unit.capstones.readinessFluency) {
        capstonesHtml += `<a href="${unit.capstones.readinessFluency}" class="hub-capstone-btn hub-capstone-readiness">
          <span aria-hidden="true">🎯</span>
          <span>${lang === "es" ? "Preparación y Fluidez" : "Readiness & Fluency"}</span>
        </a>`;
      }
      if (unit.capstones.missionLab) {
        capstonesHtml += `<a href="${unit.capstones.missionLab}" class="hub-capstone-btn hub-capstone-lab">
          <span aria-hidden="true">🔬</span>
          <span>${lang === "es" ? "Laboratorio de Misión" : "Capstone Mission Lab"}</span>
        </a>`;
      }
      if (unit.capstones.unitReview) {
        capstonesHtml += `<a href="${unit.capstones.unitReview}" class="hub-capstone-btn hub-capstone-review">
          <span aria-hidden="true">📘</span>
          <span>${
            lang === "es" ? "Repaso y Preparación para el Examen" : "Unit Review & Test Prep"
          }</span>
        </a>`;
      }
    }

    return `
      <section class="hub-unit-card" aria-labelledby="unit-card-title">
        <div class="hub-unit-card-eyebrow">
          <span class="hub-unit-badge">Unit ${unit.number}</span>
          <span class="hub-unit-lesson-count">${lessonCount} ${
            lang === "es" ? "lecciones" : "lessons"
          }</span>
        </div>
        <h2 id="unit-card-title" class="hub-unit-title hub-unit-card-title"${langAttr}>${escapeHtml(titleText)}</h2>
        <p class="hub-unit-big-idea"${bigIdeaLangAttr}>${escapeHtml(bigIdeaText)}</p>
        ${capstonesHtml ? `<div class="hub-unit-capstones">${capstonesHtml}</div>` : ""}
      </section>
    `;
  }

  function renderSearchHeaderCard(matchCount, query, lang) {
    return `
      <section class="hub-unit-card" aria-live="polite">
        <div class="hub-unit-card-eyebrow">
          <span class="hub-unit-badge">${lang === "es" ? "Búsqueda" : "Search"}</span>
          <span class="hub-unit-lesson-count">${matchCount} ${
            lang === "es" ? "resultados" : "results"
          }</span>
        </div>
        <h2 class="hub-unit-title">${
          lang === "es" ? "Resultados para" : "Results for"
        } &ldquo;${escapeHtml(query)}&rdquo;</h2>
      </section>
    `;
  }

  function renderLessonRowCard(lesson, isExpanded, lang, isT, supports) {
    const titleText = lang === "es" && lesson.title.es ? lesson.title.es : lesson.title.en;
    const isFallback = lang === "es" && !lesson.title.es;
    const langAttr = isFallback ? ' lang="en"' : "";

    // Representations
    let repsHtml = "";
    if (Array.isArray(lesson.representations)) {
      for (let r = 0; r < lesson.representations.length; r++) {
        const rep = lesson.representations[r];
        const iconSvg = REP_ICONS[rep] || "";
        const repName = (REP_NAMES[lang] && REP_NAMES[lang][rep]) || REP_NAMES.en[rep] || rep;
        repsHtml += `<span class="hub-rep-pill" title="${escapeHtml(
          repName,
        )}">${iconSvg}<span class="sr-only">${escapeHtml(repName)}</span></span>`;
      }
    }

    // Availability dots
    const hasNotes = Boolean(lesson.tools && lesson.tools.notesStudio);
    const hasCanvas = Boolean(lesson.tools && lesson.tools.mathCanvas);
    const hasLab = Boolean(lesson.tools && lesson.tools.missionLab);

    const notesLabel = hasNotes
      ? lang === "es"
        ? "Notas guiadas disponibles"
        : "Guided notes available"
      : lang === "es"
        ? "Sin notas"
        : "No notes for this lesson";
    const canvasLabel = hasCanvas
      ? lang === "es"
        ? "Lienzo matemático interactivo disponible"
        : "Interactive math canvas available"
      : lang === "es"
        ? "Sin lienzo interactivo"
        : "No canvas for this lesson";
    const labLabel = hasLab
      ? lang === "es"
        ? "Laboratorio de misión disponible"
        : "Mission lab available"
      : lang === "es"
        ? "Sin laboratorio"
        : "No lab for this lesson";

    // Primary CTA
    const launchUrl = `/lessons/${lesson.id}/`;

    return `
      <article class="hub-lesson-row-card" id="lesson-row-${
        lesson.id
      }" data-expanded="${isExpanded ? "true" : "false"}">
        <div class="hub-lesson-row-header" data-lesson-toggle="${lesson.id}">
          <div class="hub-lesson-left">
            <span class="hub-lesson-badge">${lesson.id}</span>
            <div class="hub-lesson-title-area">
              <h3 class="hub-lesson-title"${langAttr}>${escapeHtml(titleText)}</h3>
              <div class="hub-rep-badges">
                ${repsHtml}
                ${
                  isT && lesson.standards && lesson.standards.length
                    ? `<span class="hub-standard-badge" data-teacher-only>${escapeHtml(
                        lesson.standards[0],
                      )}</span>`
                    : ""
                }
                ${
                  isT && lesson.teacher && lesson.teacher.pacing
                    ? `<span class="hub-pacing-tag" data-teacher-only>${escapeHtml(
                        lesson.teacher.pacing,
                      )}</span>`
                    : ""
                }
              </div>
            </div>
          </div>

          <div class="hub-lesson-avail">
            <span class="hub-avail-dot" data-available="${
              hasNotes ? "true" : "false"
            }" aria-label="${notesLabel}" title="${notesLabel}">
              <span aria-hidden="true">📝</span> Notes
            </span>
            <span class="hub-avail-dot" data-available="${
              hasCanvas ? "true" : "false"
            }" aria-label="${canvasLabel}" title="${canvasLabel}">
              <span aria-hidden="true">📐</span> Canvas
            </span>
            <span class="hub-avail-dot" data-available="${
              hasLab ? "true" : "false"
            }" aria-label="${labLabel}" title="${labLabel}">
              <span aria-hidden="true">🧪</span> Lab
            </span>
          </div>

          <div class="hub-lesson-right">
            ${renderDocsDropdown(lesson, lang, isT)}
            <a href="${launchUrl}" class="hub-launch-btn">
              <span>${lang === "es" ? "Iniciar Lección" : "Launch Lesson"}</span>
              <span aria-hidden="true">→</span>
            </a>
            <button type="button" class="hub-accordion-btn hub-drawer-toggle" data-drawer-toggle="${
              lesson.id
            }" data-lesson-toggle="${lesson.id}" aria-expanded="${
              isExpanded ? "true" : "false"
            }" aria-controls="drawer-${lesson.id}" aria-label="${
              isExpanded
                ? lang === "es"
                  ? "Cerrar detalles de lección " + lesson.id
                  : "Close details for lesson " + lesson.id
                : lang === "es"
                  ? "Abrir detalles de lección " + lesson.id
                  : "Open details for lesson " + lesson.id
            }">
              <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
            </button>
          </div>
        </div>

        <div id="drawer-${lesson.id}" class="hub-drawer-wrapper">
          <div class="hub-drawer-inner">
            ${isExpanded ? renderDrawerContent(lesson, lang, isT, supports) : ""}
          </div>
        </div>
      </article>
    `;
  }

  function renderDocsDropdown(lesson, lang, isT) {
    const p = lesson.printables || {};
    const practiceSheet = p.practiceSheet
      ? lang === "es" && p.practiceSheet.es
        ? p.practiceSheet.es
        : p.practiceSheet.en
      : null;
    const guidedNotes = p.guidedNotes
      ? lang === "es" && p.guidedNotes.es
        ? p.guidedNotes.es
        : p.guidedNotes.en
      : null;
    const homework = p.familyHomework
      ? lang === "es" && p.familyHomework.es
        ? p.familyHomework.es
        : p.familyHomework.en
      : null;

    let itemsHtml = "";
    if (practiceSheet) {
      itemsHtml += `<a href="${practiceSheet}" class="hub-docs-item" target="_blank" rel="noopener">
        <span>${lang === "es" ? "Hoja de Práctica Estudiante" : "Student Practice Sheet"}</span>
        <span class="hub-docs-item-tag">PDF</span>
      </a>`;
    }
    if (guidedNotes) {
      itemsHtml += `<a href="${guidedNotes}" class="hub-docs-item" target="_blank" rel="noopener">
        <span>${lang === "es" ? "Notas Guiadas" : "Guided Notes Handout"}</span>
        <span class="hub-docs-item-tag">PDF</span>
      </a>`;
    }
    if (homework) {
      itemsHtml += `<a href="${homework}" class="hub-docs-item" target="_blank" rel="noopener">
        <span>${lang === "es" ? "Tarea Familiar Bilingüe" : "Bilingual Family Homework"}</span>
        <span class="hub-docs-item-tag">PDF/HTML</span>
      </a>`;
    }

    // Teacher Protected Content (Teacher Mode ONLY — Completely absent in Student Mode)
    if (isT) {
      if (p.teacherKey) {
        itemsHtml += `<a href="${p.teacherKey}" class="hub-docs-item hub-docs-item-protected" target="_blank" rel="noopener">
          <span>${lang === "es" ? "Guía y Clave del Docente" : "Teacher Key & Facilitation"}</span>
          <span class="hub-docs-item-tag">Teacher</span>
        </a>`;
      }
      if (p.subSummary) {
        itemsHtml += `<a href="${p.subSummary}" class="hub-docs-item hub-docs-item-protected" target="_blank" rel="noopener">
          <span>${
            lang === "es" ? "Plan para Suplente (1 Pág.)" : "1-Page Sub Plan & Solutions"
          }</span>
          <span class="hub-docs-item-tag">Teacher</span>
        </a>`;
      }
    }

    return `
      <div class="hub-docs-dropdown-container">
        <button type="button" class="hub-docs-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="docs-menu-${
          lesson.id
        }">
          <span aria-hidden="true">📄</span>
          <span>Docs</span>
          <span aria-hidden="true">▾</span>
        </button>
        <div id="docs-menu-${lesson.id}" class="hub-docs-menu" role="menu" aria-hidden="true">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  function renderDrawerContent(lesson, lang, isT, supports) {
    const tools = lesson.tools || {};
    const pathways = lesson.pathways || {};
    const scaff = (lesson.scaffolding && lesson.scaffolding.widaLevel2_3) || {};
    const wordBank = scaff.wordBank || [];
    const frames = scaff.sentenceFrames || [];
    const discourse = lesson.discoursePrompts || {};
    const prompts = lang === "es" && discourse.es ? discourse.es : discourse.en || [];

    // Column 1: Learn & Notes
    let col1Html = `
      <div class="hub-cra-col">
        <h4 class="hub-cra-col-title">
          <span aria-hidden="true">📝</span>
          <span>${lang === "es" ? "Aprender y Notas" : "Learn & Notes"}</span>
        </h4>
        <div class="hub-cra-link-list">
          ${
            tools.notesStudio
              ? `<a href="${tools.notesStudio}" class="hub-cra-link-card"><span>${
                  lang === "es" ? "Estudio de Notas Guiadas" : "Notes Studio"
                }</span> <span aria-hidden="true">→</span></a>`
              : ""
          }
          <a href="/lessons/${lesson.id}/slides/" class="hub-cra-link-card">
            <span>${lang === "es" ? "Diapositivas de la Lección" : "Lesson Slides"}</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
    `;

    // Key Vocabulary & Sentence Frames (ESOL Scaffolding)
    if (wordBank.length > 0) {
      col1Html += `
        <div class="hub-vocab-section">
          <div class="hub-vocab-title">${
            lang === "es" ? "Vocabulario Clave (WIDA)" : "Key Vocabulary (WIDA)"
          }</div>
          <div class="hub-vocab-chips">
            ${wordBank
              .map(
                (w) =>
                  `<span class="hub-vocab-chip" tabindex="0" role="term">${escapeHtml(w)}</span>`,
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (supports && frames.length > 0) {
      col1Html += `
        <div class="hub-vocab-section">
          <div class="hub-vocab-title">${
            lang === "es" ? "Marcos de Oraciones" : "Sentence Frames"
          }</div>
          <ul class="hub-discourse-prompt">
            ${frames.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    if (prompts.length > 0) {
      col1Html += `
        <div class="hub-discourse-box">
          <div class="hub-discourse-title">${
            lang === "es" ? "Preguntas de Discusión" : "Discourse Prompts"
          }</div>
          <p class="hub-discourse-prompt">${escapeHtml(prompts[0])}</p>
        </div>
      `;
    }
    col1Html += "</div>";

    // Column 2: Explore & Model
    let col2Html = `
      <div class="hub-cra-col">
        <h4 class="hub-cra-col-title">
          <span aria-hidden="true">📐</span>
          <span>${lang === "es" ? "Explorar y Modelar" : "Explore & Model"}</span>
        </h4>
        <div class="hub-cra-link-list">
          ${
            tools.mathCanvas
              ? `<a href="${tools.mathCanvas}" class="hub-cra-link-card"><span>${
                  lang === "es" ? "Lienzo Matemático Vivo" : "Living Math Canvas"
                }</span> <span aria-hidden="true">→</span></a>`
              : `<div class="hub-cra-link-card" style="opacity:0.6"><span>${
                  lang === "es" ? "Sin Lienzo Autónomo" : "No Standalone Canvas"
                }</span></div>`
          }
          ${
            tools.missionLab
              ? `<a href="${tools.missionLab}" class="hub-cra-link-card"><span>${
                  lang === "es" ? "Laboratorio de Misión" : "Mission Lab"
                }</span> <span aria-hidden="true">→</span></a>`
              : ""
          }
        </div>
        <div class="hub-vocab-section">
          <div class="hub-vocab-title">CRA Progression Step</div>
          <p class="hub-discourse-prompt">
            <strong>${
              Array.isArray(lesson.representations) && lesson.representations.length > 0
                ? lesson.representations.join(", ")
                : "Conceptual"
            }</strong>:
            ${
              lang === "es"
                ? "Conexión visual interactiva antes de la formalización abstracta."
                : "Interactive visual connection bridging concrete intuition to abstract representation."
            }
          </p>
        </div>
      </div>
    `;

    // Column 3: Practice & Support
    let col3Html = `
      <div class="hub-cra-col">
        <h4 class="hub-cra-col-title">
          <span aria-hidden="true">🎯</span>
          <span>${lang === "es" ? "Práctica y Apoyo" : "Practice & Support"}</span>
        </h4>
        <div class="hub-cra-link-list">
          <a href="/curriculum/practice/#lesson-${lesson.id}" class="hub-cra-link-card">
            <span>${lang === "es" ? "Práctica Adaptativa" : "Self-Paced Practice"}</span>
            <span aria-hidden="true">→</span>
          </a>
          ${
            pathways.group1
              ? `<a href="${pathways.group1}" class="hub-cra-link-card"><span>${
                  lang === "es" ? "Grupo 1 (Apoyo Guiado)" : "Group 1 (Targeted Support)"
                }</span> <span aria-hidden="true">→</span></a>`
              : ""
          }
          ${
            pathways.group2
              ? `<a href="${pathways.group2}" class="hub-cra-link-card"><span>${
                  lang === "es" ? "Grupo 2 (Desafío)" : "Group 2 (Challenge Extension)"
                }</span> <span aria-hidden="true">→</span></a>`
              : ""
          }
          ${
            pathways.catchup
              ? `<a href="${pathways.catchup}" class="hub-cra-link-card"><span>${
                  lang === "es" ? "Ponte al Día (Ejemplos)" : "Catch-Up Worked Examples"
                }</span> <span aria-hidden="true">→</span></a>`
              : ""
          }
          ${
            tools.fluencyDrill
              ? `<a href="${tools.fluencyDrill}" class="hub-cra-link-card"><span>${
                  lang === "es" ? "Taller de Fluidez" : "Fluency Workshop"
                }</span> <span aria-hidden="true">→</span></a>`
              : ""
          }
        </div>
      </div>
    `;

    let drawerHtml = `<div class="hub-cra-grid">${col1Html}${col2Html}${col3Html}</div>`;

    // Teacher Tray (Protected: Teacher Mode ONLY — Never in Student DOM)
    if (isT && lesson.teacher) {
      drawerHtml += renderTeacherTray(lesson, lang);
    }

    return drawerHtml;
  }

  function renderTeacherTray(lesson, _lang) {
    const t = lesson.teacher || {};
    const standards = Array.isArray(lesson.standards) ? lesson.standards : [];
    const mis = Array.isArray(t.misconceptions) ? t.misconceptions : [];
    const inter = t.interventionNotes || {};
    const pacing = t.pacing || "45–60 min · 1 class period";

    return `
      <section class="hub-teacher-tray" aria-labelledby="tray-title-${lesson.id}">
        <div class="hub-teacher-tray-head">
          <h4 id="tray-title-${lesson.id}" class="hub-teacher-tray-title">
            <span aria-hidden="true">🔒</span>
            <span>Teacher Tray — Facilitation &amp; Pedagogical Insights</span>
          </h4>
          <span class="hub-standard-badge">${escapeHtml(pacing)}</span>
        </div>
        <div class="hub-teacher-tray-grid">
          <div class="hub-teacher-tray-card">
            <h4>CCSS Standards</h4>
            <div class="hub-teacher-standards-badges">
              ${standards
                .map((s) => `<span class="hub-standard-badge">${escapeHtml(s)}</span>`)
                .join("")}
            </div>
            <p style="margin-top:8px"><strong>Objective:</strong> ${escapeHtml(
              t.objective || lesson.bigIdea.en,
            )}</p>
          </div>

          <div class="hub-teacher-tray-card">
            <h4>Top Student Misconceptions</h4>
            <ul>
              ${mis.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
            </ul>
          </div>

          <div class="hub-teacher-tray-card">
            <h4>Targeted Interventions</h4>
            <p><strong>Tier 2:</strong> ${escapeHtml(
              inter.tier2 || "Use concrete models, tape diagrams, or manipulative tables.",
            )}</p>
            <p style="margin-top:6px"><strong>Tier 3:</strong> ${escapeHtml(
              inter.tier3 || "Direct explicit modeling with single-step quantities.",
            )}</p>
          </div>
        </div>
      </section>
    `;
  }

  // Event bindings for interactions
  function bindHubEvents(container) {
    // Unit tab buttons
    const tabs = container.querySelectorAll("[data-unit-tab]");
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", () => {
        const u = parseInt(tabs[i].getAttribute("data-unit-tab"), 10);
        selectUnit(u);
      });
    }

    // Quick search input
    const searchInput = container.querySelector("#hub-quick-search");
    const clearBtn = container.querySelector("#hub-search-clear");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        if (clearBtn) {
          clearBtn.setAttribute("aria-hidden", searchQuery ? "false" : "true");
        }
        renderHub();
        // Restore focus to input after re-render
        const reInput = document.getElementById("hub-quick-search");
        if (reInput) {
          reInput.focus();
          reInput.setSelectionRange(reInput.value.length, reInput.value.length);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchQuery = "";
        renderHub();
      });
    }

    // Lesson row toggles (Enter, Space, Click)
    const toggles = container.querySelectorAll("[data-lesson-toggle]");
    for (let j = 0; j < toggles.length; j++) {
      toggles[j].addEventListener("click", (e) => {
        // Prevent toggling when clicking a link or docs button
        if (e.target.closest("a") || e.target.closest(".hub-docs-dropdown-container")) {
          return;
        }
        e.stopPropagation();
        const id = toggles[j].getAttribute("data-lesson-toggle");
        toggleLesson(id);
      });
    }

    // Docs dropdowns (Popover API / Accessible menu)
    const docsTriggers = container.querySelectorAll(".hub-docs-trigger");
    for (let k = 0; k < docsTriggers.length; k++) {
      const trigger = docsTriggers[k];
      const menu = trigger.nextElementSibling;
      if (!menu) continue;

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = trigger.getAttribute("aria-expanded") === "true";
        closeAllDocsMenus();
        if (!isOpen) {
          trigger.setAttribute("aria-expanded", "true");
          menu.setAttribute("aria-hidden", "false");
          openMenuContainer = trigger.parentElement;
          const firstItem = menu.querySelector(".hub-docs-item");
          if (firstItem) firstItem.focus();
        }
      });

      menu.addEventListener("keydown", (e) => {
        handleMenuKeydown(e, menu, trigger);
      });
    }
  }

  function handleMenuKeydown(e, menu, trigger) {
    const items = [...menu.querySelectorAll(".hub-docs-item")];
    const currentIndex = items.indexOf(document.activeElement);

    if (e.key === "Escape") {
      closeAllDocsMenus();
      trigger.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].focus();
    } else if (e.key === "Tab") {
      closeAllDocsMenus();
    }
  }

  function closeAllDocsMenus() {
    const menus = document.querySelectorAll(".hub-docs-menu");
    const triggers = document.querySelectorAll(".hub-docs-trigger");
    for (let i = 0; i < menus.length; i++) {
      menus[i].setAttribute("aria-hidden", "true");
    }
    for (let j = 0; j < triggers.length; j++) {
      triggers[j].setAttribute("aria-expanded", "false");
    }
    openMenuContainer = null;
  }

  // Dismiss docs menu on click outside
  document.addEventListener("click", (e) => {
    if (openMenuContainer && !openMenuContainer.contains(e.target)) {
      closeAllDocsMenus();
    }
  });

  // Handle Hash changes (back/forward button)
  window.addEventListener("hashchange", () => {
    resolveInitialSelection();
    renderHub();
  });

  // Listen to Global CurriculumShell State changes (Lang, Role, Supports)
  window.addEventListener("curriculum:state-change", () => {
    renderHub();
  });

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function init() {
    resolveInitialSelection();
    await loadManifest();
    renderHub();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

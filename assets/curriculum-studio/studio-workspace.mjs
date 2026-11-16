/**
 * Unified Lesson Resource Studio Workspace
 * Integrates 5-phase navigation, Smart Previews, Variant Comparison,
 * One-Click Lesson Assembly, Small-Group Composer, Worksheet Remix,
 * Living Curriculum Map Strip, Accessibility/WIDA Layer, and Flagship Theaters.
 */
import { FLAGSHIP_DATA } from "./flagship-data.mjs";
import { renderFlagshipTheater, renderLivingGuidedNotes, renderReasoningAndCollaboration, renderUniversalLessonExperience } from "./studio-theaters.mjs";

const CONTEXT_KEY = "ewl_studio_context_v1";
const A11Y_KEY = "ewl_studio_a11y_v1";
const FEEDBACK_KEY = "ewl_studio_resource_flags_v1";

const ASSEMBLY_PRESETS = {
  "45m": { label: "45-minute Core Lesson", budget: 45, keys: ["readiness", "lesson", "guidedNotes", "worksheet", "exitTicket"] },
  "55m": { label: "55-minute Extended Lesson", budget: 55, keys: ["readiness", "lesson", "learningLab", "guidedNotes", "practiceStudio", "exitTicket"] },
  "60m": { label: "60-minute Full Block", budget: 60, keys: ["readiness", "lesson", "learningLab", "guidedNotes", "worksheet", "exitTicket", "homework"] },
  "two-session": { label: "Two-Session Lesson", budget: 90, keys: ["readiness", "lesson", "guidedNotes", "learningLab", "worksheet", "worksheet2", "exitTicket", "homework"] },
  reteach: { label: "Reteaching Lesson", budget: 35, keys: ["studentHelp", "learningLab", "worksheetLevel0", "exitTicket"] },
  "small-group": { label: "Small-Group Intervention", budget: 25, keys: ["studentHelp", "handout", "worksheetLevel0", "mstarWorksheet"] },
  enrichment: { label: "Enrichment & Transfer", budget: 40, keys: ["learningLab", "challengeStudio", "worksheet2", "exitTicket"] },
  "sub-ready": { label: "Substitute-Ready Packet", budget: 45, keys: ["handout", "guidedNotes", "worksheet", "worksheet2", "exitTicket"] },
};

const WIDA_FRAMES = {
  emerging: {
    label: "Emerging (Visual + Word Bank + Frame)",
    frameEn: "The quantity ___ represents ___. To find the answer, I ___.",
    frameEs: "La cantidad ___ representa ___. Para hallar la respuesta, yo ___.",
  },
  developing: {
    label: "Developing (Partial Sentence Frame)",
    frameEn: "I used ___ because the problem shows ___.",
    frameEs: "Usé ___ porque el problema muestra ___.",
  },
  expanding: {
    label: "Expanding (Independent Domain Vocabulary)",
    frameEn: "Justify your model using at least two lesson vocabulary terms.",
    frameEs: "Justifica tu modelo usando al menos dos términos del vocabulario.",
  },
};

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") node.className = v;
    else if (k === "hidden") node.hidden = Boolean(v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  for (const child of children) {
    if (child !== null && child !== undefined) node.append(child);
  }
  return node;
}

function readJsonStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStore(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

function speakText(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utter);
}

export async function initLessonResourceStudio({ mode = "student", rootSelector = "#studio-root" } = {}) {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const isTeacher = mode === "teacher";
  const a11y = readJsonStore(A11Y_KEY, { lang: "en", wida: "developing", contrast: false, reducedMotion: false });
  const ctx = readJsonStore(CONTEXT_KEY, { lessonId: null, session: "1", phase: "all" });

  let catalog = null;
  let teacherData = null;

  try {
    const catRes = await fetch("/data/lesson-resource-catalog.json");
    if (!catRes.ok) throw new Error("Catalog fetch failed");
    catalog = await catRes.json();
    if (isTeacher) {
      const tRes = await fetch("/teacher-tools/lesson-materials/materials.json");
      if (tRes.ok) teacherData = await tRes.json();
    }
  } catch {
    root.innerHTML = `<p class="studio-error">Could not load the Lesson Resource Catalog. Please reload or browse <a href="/curriculum/units/">Units and Lessons</a>.</p>`;
    return;
  }

  const lessons = catalog.lessons || [];
  const urlLesson = new URLSearchParams(location.search).get("lesson");
  const urlPhase = new URLSearchParams(location.search).get("phase");
  let currentLessonId =
    (urlLesson && lessons.some((l) => l.id === urlLesson) && urlLesson) ||
    (ctx.lessonId && lessons.some((l) => l.id === ctx.lessonId) && ctx.lessonId) ||
    lessons[0]?.id;
  let currentPhase = urlPhase || ctx.phase || "all";
  let currentSession = ctx.session || "1";

  const applyA11y = () => {
    document.documentElement.dataset.studioContrast = a11y.contrast ? "high" : "normal";
    document.documentElement.dataset.studioMotion = a11y.reducedMotion ? "reduced" : "normal";
    writeJsonStore(A11Y_KEY, a11y);
  };
  applyA11y();

  // Preview Modal
  const modal = el("dialog", { className: "studio-preview-dialog", "aria-labelledby": "preview-modal-title" });
  document.body.append(modal);

  function openPreview(resource, lesson) {
    modal.replaceChildren(
      el("div", { className: "studio-modal-head" },
        el("div", {},
          el("span", { className: "studio-badge" }, `${resource.phase.toUpperCase()} · ${resource.audience.toUpperCase()}`),
          el("h3", { id: "preview-modal-title" }, resource.title),
        ),
        el("button", { type: "button", className: "studio-btn-secondary", onClick: () => modal.close() }, "Close"),
      ),
      el("p", { className: "studio-prompt" }, resource.purpose),
      el("dl", { className: "studio-meta-grid" },
        el("dt", {}, "Lesson"), el("dd", {}, `${lesson.id} · ${lesson.title}`),
        el("dt", {}, "Recommended Time"), el("dd", {}, `${resource.estimatedMinutes} min`),
        el("dt", {}, "Formats"), el("dd", {}, (resource.formats || []).join(", ")),
        el("dt", {}, "Scaffolding"), el("dd", {}, resource.preview?.scaffoldingLevel || "Core"),
        el("dt", {}, "Reading Demand"), el("dd", {}, resource.preview?.readingDemand || "Grade 6"),
        el("dt", {}, "Representations"), el("dd", {}, (resource.preview?.representations || []).join(" · ")),
      ),
      el("div", { className: "studio-modal-actions" },
        el("a", { href: resource.href, className: "studio-btn-primary" }, "Open Resource →"),
        el("button", { type: "button", className: "studio-btn-secondary", onClick: () => speakText(`${resource.title}. ${resource.purpose}`) }, "Read Aloud"),
      ),
    );
    modal.showModal();
  }

  function render() {
    const lesson = lessons.find((l) => l.id === currentLessonId) || lessons[0];
    if (!lesson) return;
    writeJsonStore(CONTEXT_KEY, { lessonId: lesson.id, session: currentSession, phase: currentPhase });
    history.replaceState(null, "", `?lesson=${encodeURIComponent(lesson.id)}&phase=${encodeURIComponent(currentPhase)}`);
    document.title = `Lesson ${lesson.id}: ${lesson.title} | EduWonderLab Studio`;

    const teacherEntry = isTeacher ? (teacherData?.lessons || []).find((t) => t.id === lesson.id) : null;
    const flagship = FLAGSHIP_DATA[lesson.id] || null;

    // Unit & Lesson Picker + Session & Accessibility Bar
    const unitNumbers = [...new Set(lessons.map((l) => l.unit))].sort((a, b) => a - b);
    const unitSelect = el("select", { id: "studio-unit-select", "aria-label": "Unit" },
      ...unitNumbers.map((u) => el("option", { value: u, ...(u === lesson.unit ? { selected: "" } : {}) }, `Unit ${u}`)),
    );
    const lessonSelect = el("select", { id: "studio-lesson-select", "aria-label": "Lesson" },
      ...lessons.filter((l) => l.unit === lesson.unit).map((l) =>
        el("option", { value: l.id, ...(l.id === lesson.id ? { selected: "" } : {}) }, `${l.id} · ${l.title}${FLAGSHIP_DATA[l.id] ? " ★" : ""}`),
      ),
    );
    const sessionSelect = el("select", { id: "studio-session-select", "aria-label": "Session" },
      ...(lesson.sessions || ["1"]).map((s) => el("option", { value: s, ...(s === currentSession ? { selected: "" } : {}) }, `Session ${s}`)),
    );

    unitSelect.addEventListener("change", () => {
      const first = lessons.find((l) => l.unit === Number(unitSelect.value));
      if (first) { currentLessonId = first.id; render(); }
    });
    lessonSelect.addEventListener("change", () => { currentLessonId = lessonSelect.value; render(); });
    sessionSelect.addEventListener("change", () => { currentSession = sessionSelect.value; render(); });

    // Accessibility & WIDA controls
    const langBtn = el("button", {
      type: "button",
      className: "studio-pill-btn",
      "aria-pressed": a11y.lang === "es" ? "true" : "false",
      onClick: () => { a11y.lang = a11y.lang === "en" ? "es" : "en"; applyA11y(); render(); },
    }, a11y.lang === "es" ? "Idioma: Español" : "Language: English");

    const widaSelect = el("select", { "aria-label": "WIDA Language Scaffold" },
      ...Object.entries(WIDA_FRAMES).map(([k, v]) => el("option", { value: k, ...(k === a11y.wida ? { selected: "" } : {}) }, `WIDA: ${v.label}`)),
    );
    widaSelect.addEventListener("change", () => { a11y.wida = widaSelect.value; applyA11y(); render(); });

    const contrastBtn = el("button", {
      type: "button",
      className: "studio-pill-btn",
      "aria-pressed": String(a11y.contrast),
      onClick: () => { a11y.contrast = !a11y.contrast; applyA11y(); render(); },
    }, a11y.contrast ? "High Contrast: On" : "High Contrast");

    const motionBtn = el("button", {
      type: "button",
      className: "studio-pill-btn",
      "aria-pressed": String(a11y.reducedMotion),
      onClick: () => { a11y.reducedMotion = !a11y.reducedMotion; applyA11y(); render(); },
    }, a11y.reducedMotion ? "Reduced Motion: On" : "Reduced Motion");

    const speakObjBtn = el("button", {
      type: "button",
      className: "studio-pill-btn",
      onClick: () => speakText(`${lesson.title}. ${lesson.objective}`),
    }, "🔊 Read Objective");

    // Living Curriculum Map Mini-Strip
    const mapStrip = el("nav", { className: "studio-map-strip", "aria-label": "Conceptual learning journey" },
      el("span", { className: "studio-map-label" }, "Curriculum Map:"),
      ...(lesson.prerequisites || []).map((pid) =>
        el("button", { type: "button", className: "studio-map-node", onClick: () => { currentLessonId = pid; render(); } }, `← Prereq ${pid}`),
      ),
      el("span", { className: "studio-map-current" }, `Current: ${lesson.id}`),
      ...(lesson.nextConnections || []).map((nid) =>
        el("button", { type: "button", className: "studio-map-node", onClick: () => { currentLessonId = nid; render(); } }, `Next ${nid} →`),
      ),
      el("a", { className: "studio-map-link", href: `/curriculum/map/?lesson=${encodeURIComponent(lesson.id)}` }, "Open Full Map ↗"),
    );

    // 5-Phase Tabs
    const phaseTabs = el("nav", { className: "studio-phase-tabs", "aria-label": "Instructional phases" },
      el("button", {
        type: "button",
        className: `studio-phase-tab${currentPhase === "all" ? " is-active" : ""}`,
        onClick: () => { currentPhase = "all"; render(); },
      }, "All Phases"),
      ...catalog.phases.map((ph) =>
        el("button", {
          type: "button",
          className: `studio-phase-tab${currentPhase === ph.id ? " is-active" : ""}`,
          onClick: () => { currentPhase = ph.id; render(); },
        }, ph.label),
      ),
    );

    // Phase Sections with Progressive Disclosure
    const phasesContainer = el("div", { className: "studio-phases-wrap" });
    const visiblePhases = currentPhase === "all" ? catalog.phases : catalog.phases.filter((p) => p.id === currentPhase);

    for (const ph of visiblePhases) {
      const items = (lesson.resources || []).filter((r) => r.phase === ph.id);
      if (!items.length && !(isTeacher && teacherEntry)) continue;

      const primaryItems = items.slice(0, 3);
      const secondaryItems = items.slice(3);

      const renderCard = (res) => el("article", { className: "studio-res-card" },
        el("div", { className: "studio-res-top" },
          el("span", { className: "studio-badge" }, res.type),
          el("span", { className: "studio-time" }, `${res.estimatedMinutes} min`),
        ),
        el("h4", {}, res.title),
        el("p", { className: "studio-res-purpose" }, res.purpose),
        el("div", { className: "studio-res-actions" },
          el("a", { href: res.href, className: "studio-btn-primary" }, "Open"),
          el("button", { type: "button", className: "studio-btn-secondary", onClick: () => openPreview(res, lesson) }, "Preview"),
        ),
      );

      const section = el("section", { className: "studio-phase-section", id: `phase-${ph.id}` },
        el("div", { className: "studio-phase-head" },
          el("h3", {}, ph.label),
          el("p", {}, ph.description),
        ),
        el("div", { className: "studio-card-grid" }, ...primaryItems.map(renderCard)),
      );

      if (secondaryItems.length) {
        section.append(
          el("details", { className: "studio-more-drawer" },
            el("summary", {}, `More ${ph.label} resources (${secondaryItems.length})`),
            el("div", { className: "studio-card-grid" }, ...secondaryItems.map(renderCard)),
          ),
        );
      }
      phasesContainer.append(section);
    }

    // Teacher-Only Materials Section (Keys, Slides, Publisher Docs)
    let teacherOnlySection = null;
    if (isTeacher && teacherEntry) {
      const tGroups = [];
      for (const [k, label] of [["plan", "Teacher Plans & Editable Slides"], ["keys", "Answer Keys (Teacher Only)"], ["publisher", "Publisher Teacher Docs"]]) {
        const list = teacherEntry.groups?.[k] || [];
        if (!list.length) continue;
        tGroups.push(
          el("details", { className: "studio-more-drawer", open: k === "keys" ? "" : null },
            el("summary", {}, `${label} (${list.length})`),
            el("div", { className: "studio-card-grid" },
              ...list.map((item) => el("article", { className: "studio-res-card" },
                el("span", { className: "studio-badge studio-badge-teacher" }, "Teacher Only"),
                el("h4", {}, item.title),
                el("a", { href: item.href, className: "studio-btn-primary" }, "Open"),
              )),
            ),
          ),
        );
      }
      if (tGroups.length) {
        teacherOnlySection = el("section", { className: "studio-panel" },
          el("h3", {}, "Teacher-Only Materials & Keys"),
          ...tGroups,
        );
      }
    }

    // Side-by-Side Variant Comparison
    const practiceVariants = (lesson.resources || []).filter((r) => r.phase === "practice");
    const comparisonSection = practiceVariants.length >= 2
      ? el("details", { className: "studio-panel" },
          el("summary", { className: "studio-panel-summary" }, `Compare Practice Variants Side-by-Side (${practiceVariants.length} options)`),
          el("div", { className: "studio-table-scroll" },
            el("table", { className: "studio-compare-table" },
              el("thead", {}, el("tr", {}, el("th", {}, "Resource"), el("th", {}, "Questions"), el("th", {}, "Scaffolding"), el("th", {}, "Reading Demand"), el("th", {}, "Representations"))),
              el("tbody", {}, ...practiceVariants.map((v) =>
                el("tr", {},
                  el("td", {}, el("a", { href: v.href }, v.title)),
                  el("td", {}, String(v.preview?.questionCount || "Varies")),
                  el("td", {}, v.preview?.scaffoldingLevel || "Standard"),
                  el("td", {}, v.preview?.readingDemand || "Grade 6"),
                  el("td", {}, (v.preview?.representations || []).join(", ")),
                ),
              )),
            ),
          ),
        )
      : null;

    // One-Click Lesson Assembly
    let activePreset = "45m";
    const assemblyHost = el("details", { className: "studio-panel" });
    const renderAssembly = () => {
      const preset = ASSEMBLY_PRESETS[activePreset];
      const byKey = new Map((lesson.resources || []).map((r) => [r.key, r]));
      const selected = preset.keys.map((k) => byKey.get(k)).filter(Boolean);
      const totalMins = selected.reduce((s, r) => s + (r.estimatedMinutes || 10), 0);
      const overage = totalMins - preset.budget;

      const listEl = el("ol", { className: "studio-assembly-list" },
        ...selected.map((r) => el("li", {},
          el("strong", {}, r.title),
          el("span", {}, ` (${r.phase.toUpperCase()} · ${r.estimatedMinutes} min) — ${r.purpose}`),
        )),
      );

      const exportPlan = () => {
        const payload = {
          lessonId: lesson.id,
          title: lesson.title,
          standard: lesson.standard,
          objective: lesson.objective,
          configuration: preset.label,
          totalMinutes: totalMins,
          studentSafeOnly: !isTeacher,
          sequence: selected.map((r, i) => ({ order: i + 1, resourceId: r.resourceId, title: r.title, phase: r.phase, minutes: r.estimatedMinutes, href: r.href })),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lesson-${lesson.id}-${activePreset}-plan.json`;
        a.click();
        URL.revokeObjectURL(url);
      };

      const presetSel = el("select", { "aria-label": "Lesson configuration" },
        ...Object.entries(ASSEMBLY_PRESETS).map(([k, v]) => el("option", { value: k, ...(k === activePreset ? { selected: "" } : {}) }, v.label)),
      );
      presetSel.addEventListener("change", () => { activePreset = presetSel.value; renderAssembly(); });

      assemblyHost.replaceChildren(
        el("summary", { className: "studio-panel-summary" }, "One-Click Lesson Assembly & Export"),
        el("div", { className: "studio-assembly-controls" },
          presetSel,
          el("span", { className: overage > 0 ? "studio-warn-pill" : "studio-ok-pill" },
            `Estimated ${totalMins} min / ${preset.budget} min budget${overage > 0 ? ` (+${overage} min over)` : ""}`,
          ),
          el("button", { type: "button", className: "studio-btn-primary", onClick: exportPlan }, "Export Lesson Plan (JSON)"),
          el("a", { href: `/teacher-tools/lesson-plan-generator/?lesson=${encodeURIComponent(lesson.id)}`, className: "studio-btn-secondary" }, "Open Full Plan Generator ↗"),
        ),
        listEl,
      );
    };
    renderAssembly();

    // Small-Group Composer (Available across catalog, rich for flagship)
    const sgHost = el("details", { className: "studio-panel" });
    let sgNeed = "conceptual";
    const renderSmallGroup = () => {
      const needs = {
        prerequisite: "Prerequisite Gap — Bridge prior grade skill into current objective",
        conceptual: "Conceptual Misunderstanding — Visual model + predict & explain",
        procedural: "Procedural Confusion — Stepwise worked example + error check",
        "language-access": "Language-Access Need — WIDA frames + bilingual vocabulary",
        extension: "Ready for Extension — Multi-step transfer & justification",
      };
      const sgSelect = el("select", { "aria-label": "Small-group instructional need" },
        ...Object.entries(needs).map(([k, v]) => el("option", { value: k, ...(k === sgNeed ? { selected: "" } : {}) }, v)),
      );
      sgSelect.addEventListener("change", () => { sgNeed = sgSelect.value; renderSmallGroup(); });

      const sg = flagship?.smallGroup;
      sgHost.replaceChildren(
        el("summary", { className: "studio-panel-summary" }, "Small-Group Resource Composer (10-Step Sequence)"),
        el("div", { className: "studio-assembly-controls" }, sgSelect),
        el("ol", { className: "studio-assembly-list" },
          el("li", {}, el("strong", {}, "Learning Target: "), sg?.target || lesson.objective),
          el("li", {}, el("strong", {}, "Entry Task: "), sg?.entryTask || `Activate ${lesson.vocabulary?.[0]?.term || "key concept"} with a quick 2-minute prompt.`),
          el("li", {}, el("strong", {}, "Diagnostic Observation: "), sg?.diagnostic || "Observe how students represent the problem before calculating."),
          el("li", {}, el("strong", {}, "Visual / Concrete Model: "), sg?.visualModel || "Use the lesson's Interactive Learning Lab or visual diagram."),
          el("li", {}, el("strong", {}, "Teacher Prompts: "), (sg?.prompts || ["What stays the same? What changes?"]).join(" | ")),
          el("li", {}, el("strong", {}, "Language & Scaffold Focus: "), needs[sgNeed]),
          el("li", {}, el("strong", {}, "Transfer Check: "), sg?.transferCheck || "Complete one new problem independently and explain why."),
        ),
      );
    };
    renderSmallGroup();

    // Family Publishing Preview
    const fam = flagship?.family;
    const inst = lesson.instructional || {};
    const familyGoal = a11y.lang === "es"
      ? (fam?.goalPlainEs || inst.familyKeyIdeaEs || inst.familyKeyIdea || lesson.objective)
      : (fam?.goalPlain || inst.familyKeyIdea || lesson.objective);
    const familyPreview = el("details", { className: "studio-panel" },
      el("summary", { className: "studio-panel-summary" }, "Family Resource Publishing Preview (No Teacher Keys Exposed)"),
      el("div", { className: "studio-family-card" },
        el("h4", {}, `Family Guide · Lesson ${lesson.id}: ${lesson.title}`),
        el("p", {}, familyGoal),
        fam?.workedExample ? el("p", { className: "studio-quote" }, fam.workedExample) : null,
        fam?.homePrompt ? el("p", {}, el("strong", {}, "Try at home (optional): "), fam.homePrompt) : null,
        el("div", { className: "studio-res-actions" },
          lesson.resources?.find((r) => r.key === "homework")
            ? el("a", { href: lesson.resources.find((r) => r.key === "homework").href, className: "studio-btn-primary" }, "Open Family Homework →")
            : null,
          lesson.resources?.find((r) => r.key === "familyPage")
            ? el("a", { href: lesson.resources.find((r) => r.key === "familyPage").href, className: "studio-btn-secondary" }, "Open Family Connection →")
            : null,
        ),
      ),
    );

    // Flagship Interactive Theater, Living Notes, Reasoning & Collaboration (with universal lesson experience for all 84 lessons)
    const flagshipSection = flagship
      ? el("div", { className: "studio-flagship-stack" },
          renderFlagshipTheater(lesson.id, a11y.lang),
          renderLivingGuidedNotes(lesson.id, isTeacher),
          renderReasoningAndCollaboration(lesson.id),
        )
      : renderUniversalLessonExperience(lesson, isTeacher, a11y.lang);

    // Teacher Analytics & Resource Feedback Flagging
    let feedbackPanel = null;
    if (isTeacher) {
      const flagInput = el("input", { type: "text", className: "studio-text-input", placeholder: "Flag an unclear prompt, answer issue, or missing support..." });
      const flagStatus = el("p", { className: "studio-feedback", "aria-live": "polite" });
      const flagBtn = el("button", {
        type: "button",
        className: "studio-btn-secondary",
        onClick: () => {
          if (!flagInput.value.trim()) return;
          const flags = readJsonStore(FEEDBACK_KEY, []);
          flags.push({ lessonId: lesson.id, note: flagInput.value.trim(), ts: new Date().toISOString() });
          writeJsonStore(FEEDBACK_KEY, flags);
          flagInput.value = "";
          flagStatus.textContent = `Feedback logged for Lesson ${lesson.id} (${flags.length} total local flags).`;
        },
      }, "Log Resource Feedback");
      feedbackPanel = el("details", { className: "studio-panel" },
        el("summary", { className: "studio-panel-summary" }, "Resource Analytics & Continuous Improvement"),
        el("p", {}, "Flag any explanation, translation, or problem for curriculum QA review, or open Insight Brief for class evidence."),
        el("div", { className: "studio-inline-form" }, flagInput, flagBtn),
        flagStatus,
        el("p", {}, el("a", { href: "/teacher-tools/insight-brief/" }, "Open Insight Brief & Evidence Groups →")),
      );
    }

    // WIDA Frame Banner
    const widaFrame = WIDA_FRAMES[a11y.wida];
    const widaBanner = el("div", { className: "studio-wida-banner" },
      el("strong", {}, `${widaFrame.label}: `),
      el("span", {}, a11y.lang === "es" ? widaFrame.frameEs : widaFrame.frameEn),
    );

    // Assemble Page
    root.replaceChildren(
      el("section", { className: "studio-controls-bar" },
        el("div", { className: "studio-picker-grid" },
          el("div", {}, el("label", { htmlFor: "studio-unit-select" }, "Unit"), unitSelect),
          el("div", {}, el("label", { htmlFor: "studio-lesson-select" }, "Lesson (★ = Flagship)"), lessonSelect),
          el("div", {}, el("label", { htmlFor: "studio-session-select" }, "Session"), sessionSelect),
        ),
        el("div", { className: "studio-a11y-bar" }, langBtn, widaSelect, contrastBtn, motionBtn, speakObjBtn),
      ),
      mapStrip,
      el("header", { className: "studio-lesson-hero" },
        el("div", { className: "studio-hero-meta" },
          el("span", { className: "studio-badge" }, `Unit ${lesson.unit} · Lesson ${lesson.id}`),
          lesson.standard ? el("span", { className: "studio-badge studio-badge-std" }, lesson.standard) : null,
          el("span", { className: "studio-time" }, lesson.timeEstimate),
          flagship ? el("span", { className: "studio-badge studio-badge-flagship" }, "★ Flagship Interactive Studio") : null,
        ),
        el("h2", {}, lesson.title),
        el("p", { className: "studio-hero-obj" }, lesson.objective),
        lesson.languageObjective ? el("p", { className: "studio-hero-lang" }, el("strong", {}, "Language Goal: "), lesson.languageObjective) : null,
        widaBanner,
      ),
      phaseTabs,
      phasesContainer,
      flagshipSection,
      comparisonSection,
      assemblyHost,
      sgHost,
      familyPreview,
      teacherOnlySection,
      feedbackPanel,
    );
  }

  render();
}

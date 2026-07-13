(function () {
  "use strict";

  // Prevent multiple executions
  if (window.EWLLearningSupports) return;

  const STORAGE_KEY = "ewl-supports:v1:preferences";

  // Resolve the manifest relative to THIS script so the layer works when the
  // lesson is served from a non-root base — SCORM packages, Canvas embeds, or a
  // sub-path deploy — where the absolute "/assets/..." path would 404.
  const SCRIPT_URL =
    (document.currentScript && document.currentScript.src) ||
    (function () {
      const el = document.querySelector('script[src*="learning-supports.js"]');
      return el ? el.src : "";
    })();

  const MANIFEST_URLS = (function () {
    const urls = [];
    if (SCRIPT_URL) {
      try {
        urls.push(new URL("manifest.json", SCRIPT_URL).href);
      } catch (_e) {
        /* ignore malformed script URL */
      }
    }
    // Absolute-root fallback (normal same-origin deploy).
    urls.push("/assets/learning-supports/manifest.json");
    return urls;
  })();

  const PROFILE_KEYS = [
    "read-understand",
    "focus-organize",
    "build-math",
    "express-thinking",
    "language-support",
    "challenge-extend",
  ];

  // À-la-carte tool keys: individual math tools a teacher can turn on for one
  // student WITHOUT the whole "build-math" bundle. Each maps 1:1 to an
  // independent dock tool (data-tool). Additive + backward-compatible — a link
  // may carry any mix of PROFILE_KEYS and TOOL_KEYS. A tool is shown when its
  // parent profile is active OR the tool itself is selected.
  const TOOL_KEYS = ["model", "multchart", "numberline", "placevalue", "calculator"];
  const ALL_SUPPORT_KEYS = [...PROFILE_KEYS, ...TOOL_KEYS];

  // One-click accommodation combinations for common needs. Labels are
  // age-respectful and describe access, never a student deficit or level.
  const PRESETS = [
    {
      label: "📖 Read-Aloud & Words",
      description: "Text-to-speech, worked examples, and vocabulary previews.",
      keys: ["read-understand"],
    },
    {
      label: "🎯 Focus & Organize",
      description: "Focus mode, reading ruler, and comfort spacing to reduce distraction.",
      keys: ["focus-organize"],
    },
    {
      label: "🧱 Build Foundations",
      description: "Prerequisite readiness plus read-aloud and examples.",
      keys: ["build-math", "read-understand"],
    },
    {
      label: "🗣️ Language Support",
      description:
        "Bilingual vocabulary, sentence frames, and read-aloud for multilingual learners.",
      keys: ["language-support", "read-understand", "express-thinking"],
    },
    {
      label: "🚀 Challenge",
      description: "Deeper reasoning and extension prompts.",
      keys: ["challenge-extend"],
    },
  ];

  function getProfileDisplayName(key) {
    const names = {
      "read-understand": "Read & Understand",
      "focus-organize": "Focus & Organize",
      "build-math": "Build Math Models",
      "express-thinking": "Express Thinking",
      "language-support": "Language Support (ESOL)",
      "challenge-extend": "Challenge & Extend",
    };
    return names[key] || key;
  }

  function getProfileDescription(key) {
    const descs = {
      "read-understand":
        "Read-aloud, vocabulary, worked examples, text size, color tint, and high contrast.",
      "focus-organize":
        "Focus mode, reading ruler, comfort spacing, color tint, a task checklist, and a calm break.",
      "build-math":
        "Prerequisite readiness plus math tools: multiplication chart, number line, place-value chart, and calculator.",
      "express-thinking":
        "Discourse sentence frames, response stems, word banks, and speech-to-text dictation.",
      "language-support":
        "Bilingual terminology, translations, and multilingual read-aloud and visual aids.",
      "challenge-extend": "Advanced concepts, error analysis challenges, and extension tasks.",
    };
    return descs[key] || "";
  }

  // State
  let initialized = false;
  let activeLessonId = null;
  let manifestData = null;
  let activeProfiles = {};
  let activeLanguage = "en";
  let activeSpeechRate = 1.0;
  let rulerActive = false;
  let comfortActive = false;
  let textScale = 0; // 0 = normal, 1 = large, 2 = extra large
  let colorTint = 0; // 0 = none, then TINTS index
  let highContrast = false;
  let breakTimerId = null;
  let rootEl = null;
  let activeSpeechUtterance = null;
  let dialogTrigger = null;
  let liveRegion = null;
  let dictation = null; // active SpeechRecognition instance

  // Shared teacher-mode contract (mirrors engine/core/teacher-mode.js and
  // assets/curriculum-enhancements.js). The "Prepare Supports" config button is
  // a teacher-only control, so it renders only when Teacher Mode is on — students
  // never see it. Applied support profiles are unaffected and stay active for the
  // student after a teacher configures them and hands back the device.
  const TEACHER_MODE_KEY = "nt-teacher-mode";
  function isTeacherMode() {
    try {
      const params = new URLSearchParams(window.location.search);
      // Force-student always wins; there is no URL backdoor INTO teacher mode.
      if (params.get("student") === "1" || params.get("teacher") === "0") return false;
      return localStorage.getItem(TEACHER_MODE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  const TEXT_SCALE_LABELS = ["Text Size", "Large Text", "X-Large Text"];

  // Color tint overlay for visual stress / Irlen-style comfort. Index 0 = none.
  const TINTS = [
    { name: "No Tint", color: "" },
    { name: "Cream", color: "rgba(255, 248, 220, 0.30)" },
    { name: "Rose", color: "rgba(255, 228, 235, 0.32)" },
    { name: "Blue", color: "rgba(214, 234, 248, 0.34)" },
    { name: "Green", color: "rgba(220, 245, 224, 0.32)" },
  ];

  // Initialize profiles + à-la-carte tools to false
  ALL_SUPPORT_KEYS.forEach((k) => {
    activeProfiles[k] = false;
  });

  // Safe localStorage helper
  function getStoredPreferences() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object") {
        if (parsed.profiles !== undefined) {
          return parsed;
        }
        // Legacy layout support
        return {
          profiles: parsed,
          language: "en",
          speechRate: 1.0,
          comfortMode: false,
        };
      }
      return null;
    } catch (_e) {
      console.warn("Learning supports: LocalStorage access blocked or unavailable.");
      return null;
    }
  }

  // Persist the full current preference state. The `pref` argument is accepted
  // for backward compatibility but ignored: module state is the single source of
  // truth, so no call site can accidentally drop a field (e.g. textScale).
  function saveStoredPreferences(_pref) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profiles: activeProfiles,
          language: activeLanguage,
          speechRate: activeSpeechRate,
          comfortMode: comfortActive,
          textScale: textScale,
          colorTint: colorTint,
          highContrast: highContrast,
        }),
      );
    } catch (_e) {
      console.warn("Learning supports: Failed to save preferences to LocalStorage.");
    }
  }

  // Parse a preferred-language code from a hash/query string (personalized
  // links / SCORM packages carry lang=es|vi|ar). Returns null if absent/invalid.
  function parseLang(str) {
    if (!str) return null;
    const m = String(str)
      .replace(/^[#?]/, "")
      .match(/(?:^|&)lang=([a-z]{2})(?:&|$)/i);
    if (!m) return null;
    const code = m[1].toLowerCase();
    return ["en", "es", "vi", "ar"].includes(code) ? code : null;
  }

  // Parse hash/query parameter
  function parseSettings(str) {
    const settings = {};
    ALL_SUPPORT_KEYS.forEach((k) => {
      settings[k] = false;
    });
    if (!str) return settings;

    const cleanStr = str.replace(/^[#?]/, "");
    const parts = cleanStr.split("&");
    let listStr = "";

    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k === "supports" && v) {
        listStr = decodeURIComponent(v);
        break;
      }
    }

    if (!listStr && !cleanStr.includes("=")) {
      listStr = cleanStr;
    }

    if (listStr) {
      listStr.split(",").forEach((item) => {
        const trimmed = item.trim();
        if (ALL_SUPPORT_KEYS.includes(trimmed)) {
          settings[trimmed] = true;
        }
      });
    }

    return settings;
  }

  function serializeSettings(settings) {
    return ALL_SUPPORT_KEYS.filter((k) => settings[k]).join(",");
  }

  // Idempotent initialization
  async function init() {
    if (initialized) return;

    const htmlEl = document.documentElement;
    activeLessonId = htmlEl.getAttribute("data-ewl-supports-lesson");
    if (!activeLessonId) {
      console.log("Learning supports: No data-ewl-supports-lesson found. Skipping.");
      return;
    }

    let data = null;
    let lastErr = null;
    for (const manifestUrl of MANIFEST_URLS) {
      try {
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        data = await res.json();
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!data) {
      console.error("Learning supports: Failed to load manifest.", lastErr);
      return;
    }
    manifestData = data[activeLessonId];
    if (!manifestData) {
      console.warn(`Learning supports: No manifest data for lesson ${activeLessonId}. Skipping.`);
      return;
    }

    initialized = true;

    // Parse configuration: check URL first, then LocalStorage
    let settings = null;
    if (window.location.hash) {
      settings = parseSettings(window.location.hash);
    }
    if (!settings && window.location.search) {
      settings = parseSettings(window.location.search);
    }

    // A personalized link / SCORM package may also preset the language.
    const urlLang = parseLang(window.location.hash) || parseLang(window.location.search);

    const hasUrlActive = settings && Object.values(settings).some(Boolean);
    if (hasUrlActive) {
      activeProfiles = settings;
      if (urlLang) activeLanguage = urlLang;
      saveStoredPreferences();
    } else {
      const stored = getStoredPreferences();
      if (stored) {
        if (stored.profiles) {
          ALL_SUPPORT_KEYS.forEach((k) => {
            if (typeof stored.profiles[k] === "boolean") {
              activeProfiles[k] = stored.profiles[k];
            }
          });
        }
        if (stored.language) {
          activeLanguage = stored.language;
        }
        if (typeof stored.speechRate === "number") {
          activeSpeechRate = stored.speechRate;
        }
        if (typeof stored.comfortMode === "boolean") {
          comfortActive = stored.comfortMode;
          if (comfortActive) {
            document.body.classList.add("ewl-supports-comfort-active");
          }
        }
        if (
          typeof stored.textScale === "number" &&
          stored.textScale >= 0 &&
          stored.textScale <= 2
        ) {
          textScale = Math.round(stored.textScale);
        }
        if (
          typeof stored.colorTint === "number" &&
          stored.colorTint >= 0 &&
          stored.colorTint < TINTS.length
        ) {
          colorTint = Math.round(stored.colorTint);
        }
        if (typeof stored.highContrast === "boolean") {
          highContrast = stored.highContrast;
          if (highContrast) document.body.classList.add("ewl-supports-contrast-active");
        }
      }
    }

    // Render components
    renderInterface();
    applyTextScale();
    applyColorTint();
    updateUIStates();

    // v2: per-student IEP/WIDA supports that follow the student across lessons.
    // Fire-and-forget; loads the shared taxonomy + this device's assignment.
    bootSupportsV2();
  }

  // Apply the color tint overlay (visual-stress comfort). Reversible.
  function applyColorTint() {
    const overlay = document.getElementById("ewl-supports-tint");
    if (overlay) {
      overlay.style.background = TINTS[colorTint].color;
      overlay.style.display = colorTint > 0 ? "block" : "none";
    }
    const btn = document.querySelector('[data-ewl-supports-tools] [data-tool="tint"]');
    if (btn) {
      btn.textContent = `🎨 ${TINTS[colorTint].name}`;
      btn.setAttribute("aria-pressed", String(colorTint > 0));
      btn.classList.toggle("is-active", colorTint > 0);
    }
  }

  // Apply the current text-size accommodation to the lesson content root.
  // Reversible: removing the class restores the lesson's native sizing.
  function applyTextScale() {
    const body = document.body;
    body.classList.remove("ewl-supports-text-lg", "ewl-supports-text-xl");
    if (textScale === 1) body.classList.add("ewl-supports-text-lg");
    else if (textScale === 2) body.classList.add("ewl-supports-text-xl");

    const btn = document.querySelector('[data-ewl-supports-tools] [data-tool="textsize"]');
    if (btn) {
      btn.textContent = `🔠 ${TEXT_SCALE_LABELS[textScale]}`;
      btn.setAttribute("aria-pressed", String(textScale > 0));
    }
  }

  function renderInterface() {
    if (document.querySelector("[data-ewl-supports-root]")) return;

    rootEl = document.createElement("div");
    rootEl.setAttribute("data-ewl-supports-root", "1");
    rootEl.className = "ewl-supports-root";

    // Screen-reader announcement region (polite live status)
    liveRegion = document.createElement("div");
    liveRegion.className = "ewl-supports-sr-only";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    rootEl.appendChild(liveRegion);

    // Modal backdrop (dims lesson behind the teacher configuration dialog)
    const backdrop = document.createElement("div");
    backdrop.setAttribute("data-ewl-supports-backdrop", "1");
    backdrop.className = "ewl-supports-backdrop";
    backdrop.hidden = true;
    backdrop.addEventListener("click", () => showDialog(false));
    rootEl.appendChild(backdrop);

    // 0. Visual Focus Reading Ruler
    const ruler = document.createElement("div");
    ruler.id = "ewl-supports-ruler";
    ruler.className = "ewl-supports-ruler";
    rootEl.appendChild(ruler);

    // 0b. Color tint overlay (visual-stress comfort; non-interactive).
    const tint = document.createElement("div");
    tint.id = "ewl-supports-tint";
    tint.className = "ewl-supports-tint";
    rootEl.appendChild(tint);

    // 1. Prepare Supports Trigger (Teacher Panel Entry)
    const teacherPanel = document.createElement("div");
    teacherPanel.setAttribute("data-ewl-supports-teacher", "1");
    teacherPanel.className = "ewl-supports-teacher-btn-container";

    const configBtn = document.createElement("button");
    configBtn.className = "ewl-supports-btn-teacher";
    configBtn.textContent = "⚙️ Prepare Supports";
    configBtn.setAttribute("aria-haspopup", "dialog");
    configBtn.setAttribute("aria-controls", "ewl-supports-dialog");
    configBtn.addEventListener("click", () => showDialog(true));
    teacherPanel.appendChild(configBtn);
    // Teacher-only: hidden in Student Mode; students never see the config entry.
    teacherPanel.hidden = !isTeacherMode();
    rootEl.appendChild(teacherPanel);

    // React live if Teacher Mode is toggled in another tab/page (in-page toggles
    // reload the lesson, so this covers the cross-tab case).
    window.addEventListener("storage", (e) => {
      if (e.key === TEACHER_MODE_KEY) teacherPanel.hidden = !isTeacherMode();
    });

    // 2. Prepare Supports Configuration Dialog
    const dialog = document.createElement("div");
    dialog.id = "ewl-supports-dialog";
    dialog.setAttribute("data-ewl-supports-dialog", "1");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "ewl-supports-dialog-title");
    dialog.setAttribute("aria-describedby", "ewl-supports-dialog-intro");
    dialog.className = "ewl-supports-dialog";
    dialog.hidden = true;

    // Dialog Header
    const dialogHeader = document.createElement("div");
    dialogHeader.className = "ewl-supports-dialog-header";
    const dialogTitle = document.createElement("h2");
    dialogTitle.id = "ewl-supports-dialog-title";
    dialogTitle.textContent = "Prepare Learning Supports";
    const closeBtn = document.createElement("button");
    closeBtn.className = "ewl-supports-dialog-close";
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("aria-label", "Close Configuration Dialog");
    closeBtn.addEventListener("click", () => showDialog(false));
    dialogHeader.appendChild(dialogTitle);
    dialogHeader.appendChild(closeBtn);
    dialog.appendChild(dialogHeader);

    // Dialog Body
    const dialogBody = document.createElement("div");
    dialogBody.className = "ewl-supports-dialog-body";

    const explainer = document.createElement("p");
    explainer.id = "ewl-supports-dialog-intro";
    explainer.className = "ewl-supports-dialog-intro";
    explainer.textContent =
      "Assign IEP accommodations and WIDA/ESOL supports to individual students. Assignments follow each student into every lesson automatically.";
    dialogBody.appendChild(explainer);

    // v2 per-student assignment surface — built lazily on open (ensureAssignmentUI).
    const assignRoot = document.createElement("div");
    assignRoot.id = "ewl-supports-assign-root";
    assignRoot.className = "ewl-supports-assign-root";
    dialogBody.appendChild(assignRoot);

    // Quick-setup presets: one-click combinations for common accommodation needs.
    const presetSection = document.createElement("div");
    presetSection.className = "ewl-supports-presets";
    const presetLabel = document.createElement("p");
    presetLabel.className = "ewl-supports-presets-label";
    presetLabel.textContent = "Quick setups";
    presetSection.appendChild(presetLabel);

    const presetRow = document.createElement("div");
    presetRow.className = "ewl-supports-presets-row";
    PRESETS.forEach((preset) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ewl-supports-preset-chip";
      chip.textContent = preset.label;
      chip.title = preset.description;
      chip.setAttribute("aria-label", `Quick setup: ${preset.label}. ${preset.description}`);
      chip.addEventListener("click", () => applyPreset(preset));
      presetRow.appendChild(chip);
    });
    presetSection.appendChild(presetRow);
    // Legacy coarse presets kept in the DOM (bridge for Copy-Link/SCORM) but
    // hidden — the per-student IEP/WIDA surface above replaces them for teachers.
    presetSection.style.display = "none";
    dialogBody.appendChild(presetSection);

    // Legacy profile checkbox list — hidden bridge (see presetSection note).
    // The assignment UI above drives these checkboxes so Copy-Link/SCORM keep
    // working; students never see this form.
    const form = document.createElement("form");
    form.className = "ewl-supports-dialog-form";
    form.style.display = "none";
    form.addEventListener("submit", (e) => e.preventDefault());

    PROFILE_KEYS.forEach((key) => {
      const row = document.createElement("div");
      row.className = "ewl-supports-checkbox-row";
      row.style.flexDirection = "column";

      const topRow = document.createElement("div");
      topRow.style.display = "flex";
      topRow.style.alignItems = "flex-start";
      topRow.style.gap = "12px";
      topRow.style.width = "100%";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `ewl-profile-${key}`;
      checkbox.checked = activeProfiles[key];
      checkbox.className = "ewl-supports-checkbox";

      const label = document.createElement("label");
      label.setAttribute("for", `ewl-profile-${key}`);
      label.className = "ewl-supports-checkbox-label";

      const titleSpan = document.createElement("span");
      titleSpan.className = "ewl-supports-profile-title";
      titleSpan.textContent = getProfileDisplayName(key);

      const descSpan = document.createElement("span");
      descSpan.className = "ewl-supports-profile-desc";
      descSpan.textContent = getProfileDescription(key);

      label.appendChild(titleSpan);
      label.appendChild(descSpan);
      topRow.appendChild(checkbox);
      topRow.appendChild(label);
      row.appendChild(topRow);

      if (key === "language-support") {
        const langContainer = document.createElement("div");
        langContainer.id = "ewl-lang-select-container";
        langContainer.style.paddingLeft = "36px";
        langContainer.style.marginTop = "8px";
        langContainer.style.width = "100%";
        langContainer.style.display = activeProfiles["language-support"] ? "block" : "none";

        const langLabel = document.createElement("label");
        langLabel.setAttribute("for", "ewl-lang-select");
        langLabel.textContent = "Preferred Language: ";
        langLabel.style.fontSize = "13px";
        langLabel.style.fontWeight = "700";
        langLabel.style.marginRight = "8px";

        const langSelect = document.createElement("select");
        langSelect.id = "ewl-lang-select-legacy";
        langSelect.style.padding = "4px 8px";
        langSelect.style.fontSize = "13px";
        langSelect.style.borderRadius = "6px";
        langSelect.style.border = "1px solid var(--ewl-color-border)";

        const languages = [
          { code: "en", name: "English" },
          { code: "es", name: "Español (Spanish)" },
          { code: "vi", name: "Tiếng Việt (Vietnamese)" },
          { code: "ar", name: "العربية (Arabic)" },
        ];

        languages.forEach((lang) => {
          const opt = document.createElement("option");
          opt.value = lang.code;
          opt.textContent = lang.name;
          if (lang.code === activeLanguage) opt.selected = true;
          langSelect.appendChild(opt);
        });

        langSelect.addEventListener("change", (e) => {
          activeLanguage = e.target.value;
          saveStoredPreferences({
            profiles: activeProfiles,
            language: activeLanguage,
            speechRate: activeSpeechRate,
            comfortMode: comfortActive,
          });
          updatePanelContent();
        });

        langContainer.appendChild(langLabel);
        langContainer.appendChild(langSelect);
        row.appendChild(langContainer);

        checkbox.addEventListener("change", (e) => {
          langContainer.style.display = e.target.checked ? "block" : "none";
        });
      }

      checkbox.addEventListener("change", (e) => {
        activeProfiles[key] = e.target.checked;
        saveStoredPreferences({
          profiles: activeProfiles,
          language: activeLanguage,
          speechRate: activeSpeechRate,
          comfortMode: comfortActive,
        });
        updateUIStates();
        updatePanelContent();
      });

      form.appendChild(row);
    });

    dialogBody.appendChild(form);

    // Actions panel
    const actionsPanel = document.createElement("div");
    actionsPanel.className = "ewl-supports-dialog-actions";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "ewl-supports-btn-action ewl-supports-btn-copy";
    copyBtn.textContent = "📋 Copy Personalized Link";
    copyBtn.addEventListener("click", () => copyPersonalizedLink(copyBtn));

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "ewl-supports-btn-action ewl-supports-btn-reset";
    resetBtn.textContent = "🔄 Reset All";
    resetBtn.addEventListener("click", () => {
      resetAllSupports();
      showDialog(false);
    });

    const printBtn = document.createElement("button");
    printBtn.type = "button";
    printBtn.className = "ewl-supports-btn-action ewl-supports-btn-print";
    printBtn.textContent = "🖨️ Print with Supports";
    printBtn.title = "Print a clean reference sheet of vocabulary, examples, and sentence frames";
    printBtn.addEventListener("click", () => {
      showDialog(false);
      printWithSupports();
    });

    actionsPanel.appendChild(copyBtn);
    actionsPanel.appendChild(resetBtn);
    dialogBody.appendChild(actionsPanel);

    const scormBtn = document.createElement("button");
    scormBtn.type = "button";
    scormBtn.className = "ewl-supports-btn-action ewl-supports-btn-scorm";
    scormBtn.textContent = "🎓 Download SCORM for these students";
    scormBtn.title =
      "Download a Canvas-ready SCORM package of this lesson with the selected supports built in";
    scormBtn.addEventListener("click", () => downloadPersonalizedScorm(scormBtn));

    const printRow = document.createElement("div");
    printRow.className = "ewl-supports-dialog-actions";
    printRow.appendChild(printBtn);
    dialogBody.appendChild(printRow);

    const scormRow = document.createElement("div");
    scormRow.className = "ewl-supports-dialog-actions";
    scormRow.appendChild(scormBtn);
    dialogBody.appendChild(scormRow);

    const scormNote = document.createElement("p");
    scormNote.className = "ewl-supports-scorm-note";
    scormNote.textContent =
      "Posts a personalized version to Canvas for specific students. The supports you selected above turn on automatically for them.";
    dialogBody.appendChild(scormNote);

    dialog.appendChild(dialogBody);
    rootEl.appendChild(dialog);

    // 3. Student Tools Dock (Floating Action Buttons Capsule)
    const studentTools = document.createElement("div");
    studentTools.setAttribute("data-ewl-supports-tools", "1");
    studentTools.className = "ewl-supports-tools-dock";
    studentTools.setAttribute("role", "group");
    studentTools.setAttribute("aria-label", "Learning tools");
    studentTools.hidden = true;

    const toolsInner = document.createElement("div");
    toolsInner.className = "ewl-supports-tools-inner";

    // Vocabulary / Words
    const wordsBtn = document.createElement("button");
    wordsBtn.className = "ewl-supports-tool-btn";
    wordsBtn.setAttribute("data-tool", "words");
    wordsBtn.textContent = "📖 Words";
    wordsBtn.addEventListener("click", () => togglePanel("words"));
    toolsInner.appendChild(wordsBtn);

    // Worked Example
    const exampleBtn = document.createElement("button");
    exampleBtn.className = "ewl-supports-tool-btn";
    exampleBtn.setAttribute("data-tool", "example");
    exampleBtn.textContent = "💡 Example";
    exampleBtn.addEventListener("click", () => togglePanel("example"));
    toolsInner.appendChild(exampleBtn);

    // Model / Readiness
    const modelBtn = document.createElement("button");
    modelBtn.className = "ewl-supports-tool-btn";
    modelBtn.setAttribute("data-tool", "model");
    modelBtn.textContent = "🧱 Model";
    modelBtn.addEventListener("click", () => togglePanel("model"));
    toolsInner.appendChild(modelBtn);

    // Sentence Frames / Explain
    const explainBtn = document.createElement("button");
    explainBtn.className = "ewl-supports-tool-btn";
    explainBtn.setAttribute("data-tool", "explain");
    explainBtn.textContent = "💬 Explain";
    explainBtn.addEventListener("click", () => togglePanel("explain"));
    toolsInner.appendChild(explainBtn);

    // Focus Overlay Trigger
    const focusBtn = document.createElement("button");
    focusBtn.className = "ewl-supports-tool-btn";
    focusBtn.setAttribute("data-tool", "focus");
    focusBtn.textContent = "🔍 Focus";
    focusBtn.addEventListener("click", toggleFocusMode);
    toolsInner.appendChild(focusBtn);

    // Reading Ruler Trigger (ADHD Focus Aid)
    const rulerBtn = document.createElement("button");
    rulerBtn.className = "ewl-supports-tool-btn";
    rulerBtn.setAttribute("data-tool", "ruler");
    rulerBtn.textContent = "📏 Ruler";
    rulerBtn.addEventListener("click", toggleRulerMode);
    toolsInner.appendChild(rulerBtn);

    // Dyslexia / Comfort Spacing Trigger
    const comfortBtn = document.createElement("button");
    comfortBtn.className = "ewl-supports-tool-btn";
    comfortBtn.setAttribute("data-tool", "comfort");
    comfortBtn.textContent = "👓 Comfort";
    comfortBtn.addEventListener("click", toggleComfortMode);
    toolsInner.appendChild(comfortBtn);

    // Text-Size Accommodation Trigger (cycles Normal → Large → X-Large)
    const textSizeBtn = document.createElement("button");
    textSizeBtn.className = "ewl-supports-tool-btn";
    textSizeBtn.setAttribute("data-tool", "textsize");
    textSizeBtn.textContent = `🔠 ${TEXT_SCALE_LABELS[textScale]}`;
    textSizeBtn.title = "Make the lesson text larger";
    textSizeBtn.addEventListener("click", cycleTextScale);
    toolsInner.appendChild(textSizeBtn);

    // Additional comprehensive IEP-style accommodation tools.
    const addTool = (tool, label, handler, title) => {
      const b = document.createElement("button");
      b.className = "ewl-supports-tool-btn";
      b.setAttribute("data-tool", tool);
      b.textContent = label;
      if (title) b.title = title;
      b.addEventListener("click", handler);
      toolsInner.appendChild(b);
      return b;
    };

    // Lesson-specific common mistakes / "watch out" guidance
    addTool(
      "misconceptions",
      "⚠️ Watch Out",
      () => togglePanel("misconceptions"),
      "Common mistakes to avoid in this lesson",
    );
    // Presentation / sensory
    addTool(
      "tint",
      `🎨 ${TINTS[colorTint].name}`,
      cycleColorTint,
      "Add a calming color tint to reduce glare",
    );
    addTool("contrast", "◐ Contrast", toggleHighContrast, "Boost text contrast");
    // Language access (ESOL): translate the current part into a home language.
    // The translation UI is provided by engine/core/translate.js, triggered here.
    addTool(
      "translate",
      "🌐 Translate",
      () => document.dispatchEvent(new CustomEvent("nt:translate")),
      "Read this part in another language",
    );
    // Math manipulatives & reference
    addTool("multchart", "✖️ Times Table", () => togglePanel("multchart"), "Multiplication chart");
    addTool("numberline", "🔟 Number Line", () => togglePanel("numberline"), "Number line");
    addTool("placevalue", "🔢 Place Value", () => togglePanel("placevalue"), "Place-value chart");
    addTool("calculator", "🧮 Calculator", () => togglePanel("calculator"), "On-screen calculator");
    // Executive function / self-regulation
    addTool("checklist", "✅ Checklist", () => togglePanel("checklist"), "My task checklist");
    addTool("break", "🌿 Take a Break", () => togglePanel("break"), "Calm breathing break");

    // Student Notepad tab Trigger
    const notepadBtn = document.createElement("button");
    notepadBtn.className = "ewl-supports-tool-btn";
    notepadBtn.setAttribute("data-tool", "notepad");
    notepadBtn.textContent = "📝 Notepad";
    notepadBtn.addEventListener("click", () => togglePanel("notepad"));
    toolsInner.appendChild(notepadBtn);

    // Formative Confidence Check-In Trigger
    const checkinBtn = document.createElement("button");
    checkinBtn.className = "ewl-supports-tool-btn";
    checkinBtn.setAttribute("data-tool", "checkin");
    checkinBtn.textContent = "❤️ Check-in";
    checkinBtn.addEventListener("click", () => togglePanel("checkin"));
    toolsInner.appendChild(checkinBtn);

    // Listen TTS Trigger
    const listenBtn = document.createElement("button");
    listenBtn.className = "ewl-supports-tool-btn";
    listenBtn.setAttribute("data-tool", "listen");
    listenBtn.textContent = "🔊 Listen";
    listenBtn.addEventListener("click", toggleListenMode);
    toolsInner.appendChild(listenBtn);

    // Rate cycling trigger button inside tools dock
    const rateBtn = document.createElement("button");
    rateBtn.className = "ewl-supports-tool-btn";
    rateBtn.setAttribute("data-tool", "rate");
    rateBtn.textContent = `⏱️ ${activeSpeechRate}x`;
    rateBtn.title = "TTS Reading Speed";
    rateBtn.addEventListener("click", () => {
      if (activeSpeechRate === 1.0) activeSpeechRate = 1.25;
      else if (activeSpeechRate === 1.25) activeSpeechRate = 1.5;
      else if (activeSpeechRate === 1.5) activeSpeechRate = 0.8;
      else activeSpeechRate = 1.0;

      rateBtn.textContent = `⏱️ ${activeSpeechRate}x`;

      saveStoredPreferences({
        profiles: activeProfiles,
        language: activeLanguage,
        speechRate: activeSpeechRate,
        comfortMode: comfortActive,
      });

      // If playing, restart with new rate
      const isSpeaking = listenBtn.classList.contains("is-active");
      if (isSpeaking) {
        stopSpeaking();
        startSpeaking(() => {
          listenBtn.classList.remove("is-active");
          listenBtn.textContent = "🔊 Listen";
          listenBtn.setAttribute("aria-pressed", "false");
        });
      }
    });
    toolsInner.appendChild(rateBtn);

    studentTools.appendChild(toolsInner);

    // Collapse / reopen so the tools bar can be turned off when it's in the way.
    // Collapsed state persists per device. Both controls live inside the dock, so
    // the reopen pill only appears while the dock itself is active.
    const DOCK_COLLAPSE_KEY = "nt-supports-dock-collapsed";
    const collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "ewl-supports-dock-collapse";
    collapseBtn.setAttribute("aria-label", "Hide the learning tools bar");
    collapseBtn.title = "Hide tools bar";
    collapseBtn.textContent = "✕";
    studentTools.appendChild(collapseBtn);

    const reopenBtn = document.createElement("button");
    reopenBtn.type = "button";
    reopenBtn.className = "ewl-supports-dock-reopen";
    reopenBtn.setAttribute("aria-label", "Show the learning tools bar");
    reopenBtn.textContent = "🧰 Tools";
    studentTools.appendChild(reopenBtn);

    function setDockCollapsed(collapsed) {
      studentTools.classList.toggle("is-collapsed", collapsed);
      try {
        localStorage.setItem(DOCK_COLLAPSE_KEY, collapsed ? "1" : "0");
      } catch (e) {
        /* private mode — non-fatal */
      }
    }
    collapseBtn.addEventListener("click", () => setDockCollapsed(true));
    reopenBtn.addEventListener("click", () => setDockCollapsed(false));
    try {
      if (localStorage.getItem(DOCK_COLLAPSE_KEY) === "1")
        studentTools.classList.add("is-collapsed");
    } catch (e) {
      /* ignore */
    }

    rootEl.appendChild(studentTools);

    // 4. Slide-out Content Panel
    const contentPanel = document.createElement("div");
    contentPanel.setAttribute("data-ewl-supports-panel", "1");
    contentPanel.className = "ewl-supports-content-panel";
    contentPanel.setAttribute("role", "region");
    contentPanel.setAttribute("aria-labelledby", "ewl-supports-panel-title");
    contentPanel.hidden = true;

    const panelHeader = document.createElement("div");
    panelHeader.className = "ewl-supports-panel-header";
    const panelTitle = document.createElement("h3");
    panelTitle.id = "ewl-supports-panel-title";
    panelTitle.className = "ewl-supports-panel-title";
    const panelClose = document.createElement("button");
    panelClose.className = "ewl-supports-panel-close";
    panelClose.textContent = "✕";
    panelClose.addEventListener("click", () => closePanel());
    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(panelClose);
    contentPanel.appendChild(panelHeader);

    const panelBody = document.createElement("div");
    panelBody.className = "ewl-supports-panel-body";
    contentPanel.appendChild(panelBody);

    rootEl.appendChild(contentPanel);

    document.body.appendChild(rootEl);

    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("pagehide", stopSpeaking);
    document.addEventListener("visibilitychange", handleVisibility);
  }

  // Announce a short message to assistive technology via the polite live region.
  function announce(message) {
    if (!liveRegion) return;
    liveRegion.textContent = "";
    // Force the AT to re-read even if the text repeats.
    setTimeout(() => {
      if (liveRegion) liveRegion.textContent = message;
    }, 60);
  }

  // Stop any active narration when the tab is hidden (prevents runaway TTS).
  function handleVisibility() {
    if (document.hidden) stopSpeaking();
  }

  // Collect the visible, focusable elements inside a container (for focus trapping).
  function getFocusable(container) {
    if (!container) return [];
    const selector =
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), " +
      'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice
      .call(container.querySelectorAll(selector))
      .filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
  }

  // Keep Tab focus cycling within a modal container.
  function trapFocus(container, e) {
    const focusables = getFocusable(container);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleKeydown(e) {
    const dialog = document.querySelector("[data-ewl-supports-dialog]");
    const dialogOpen = dialog && !dialog.hidden;

    if (e.key === "Escape") {
      if (dialogOpen) {
        showDialog(false);
        return;
      }
      const panel = document.querySelector("[data-ewl-supports-panel]");
      if (panel && !panel.hidden) {
        closePanel();
      }
      return;
    }

    if (e.key === "Tab" && dialogOpen) {
      trapFocus(dialog, e);
    }
  }

  function showDialog(show) {
    const dialog = document.querySelector("[data-ewl-supports-dialog]");
    if (!dialog) return;
    const backdrop = document.querySelector("[data-ewl-supports-backdrop]");
    dialog.hidden = !show;
    if (backdrop) backdrop.hidden = !show;

    if (show) {
      dialogTrigger =
        document.activeElement && typeof document.activeElement.focus === "function"
          ? document.activeElement
          : null;
      dialog.classList.add("is-visible");
      if (backdrop) backdrop.classList.add("is-visible");
      // Build/refresh the per-student assignment surface each open.
      ensureAssignmentUI();
      const focusables = getFocusable(dialog);
      if (focusables.length > 0) focusables[0].focus();
    } else {
      dialog.classList.remove("is-visible");
      if (backdrop) backdrop.classList.remove("is-visible");
      // Restore focus to whatever opened the dialog (keyboard/SR users). Fall
      // back to the teacher button when the trigger was <body> or is gone.
      const validTrigger =
        dialogTrigger &&
        dialogTrigger !== document.body &&
        document.contains(dialogTrigger) &&
        typeof dialogTrigger.focus === "function";
      if (validTrigger) {
        dialogTrigger.focus();
      } else {
        const trigger = document.querySelector(".ewl-supports-btn-teacher");
        if (trigger) trigger.focus();
      }
      dialogTrigger = null;
    }
  }

  function updateUIStates() {
    const hasAnyActive = Object.values(activeProfiles).some(Boolean);
    const toolsDock = document.querySelector("[data-ewl-supports-tools]");
    if (!toolsDock) return;

    PROFILE_KEYS.forEach((key) => {
      const checkbox = document.getElementById(`ewl-profile-${key}`);
      if (checkbox) checkbox.checked = false;
    });
    // Restore states
    PROFILE_KEYS.forEach((key) => {
      const checkbox = document.getElementById(`ewl-profile-${key}`);
      if (checkbox) checkbox.checked = activeProfiles[key];
    });

    const langContainer = document.getElementById("ewl-lang-select-container");
    if (langContainer) {
      langContainer.style.display = activeProfiles["language-support"] ? "block" : "none";
    }

    const langSelect = document.getElementById("ewl-lang-select");
    if (langSelect) {
      langSelect.value = activeLanguage;
    }

    const comfortBtn = toolsDock.querySelector('[data-tool="comfort"]');
    if (comfortBtn) {
      comfortBtn.setAttribute("aria-pressed", String(comfortActive));
      if (comfortActive) comfortBtn.classList.add("is-active");
      else comfortBtn.classList.remove("is-active");
    }

    const rateBtn = toolsDock.querySelector('[data-tool="rate"]');
    if (rateBtn) {
      rateBtn.textContent = `⏱️ ${activeSpeechRate}x`;
    }

    if (hasAnyActive) {
      toolsDock.hidden = false;
      const wordsBtn = toolsDock.querySelector('[data-tool="words"]');
      const exampleBtn = toolsDock.querySelector('[data-tool="example"]');
      const modelBtn = toolsDock.querySelector('[data-tool="model"]');
      const explainBtn = toolsDock.querySelector('[data-tool="explain"]');
      const focusBtn = toolsDock.querySelector('[data-tool="focus"]');
      const rulerBtn = toolsDock.querySelector('[data-tool="ruler"]');
      const notepadBtn = toolsDock.querySelector('[data-tool="notepad"]');
      const checkinBtn = toolsDock.querySelector('[data-tool="checkin"]');
      const listenBtn = toolsDock.querySelector('[data-tool="listen"]');
      const textSizeBtn = toolsDock.querySelector('[data-tool="textsize"]');

      if (wordsBtn)
        wordsBtn.style.display =
          activeProfiles["read-understand"] || activeProfiles["language-support"]
            ? "inline-flex"
            : "none";
      if (exampleBtn)
        exampleBtn.style.display = activeProfiles["read-understand"] ? "inline-flex" : "none";
      if (modelBtn)
        modelBtn.style.display =
          activeProfiles["build-math"] || activeProfiles["model"] ? "inline-flex" : "none";
      if (explainBtn)
        explainBtn.style.display = activeProfiles["express-thinking"] ? "inline-flex" : "none";
      if (focusBtn)
        focusBtn.style.display = activeProfiles["focus-organize"] ? "inline-flex" : "none";
      if (rulerBtn)
        rulerBtn.style.display = activeProfiles["focus-organize"] ? "inline-flex" : "none";
      if (comfortBtn)
        comfortBtn.style.display = activeProfiles["focus-organize"] ? "inline-flex" : "none";
      if (notepadBtn) notepadBtn.style.display = "inline-flex"; // universally helpful
      if (checkinBtn) checkinBtn.style.display = "inline-flex"; // universally helpful
      if (textSizeBtn) {
        textSizeBtn.style.display = "inline-flex"; // universally helpful
        applyTextScale(); // reflect stored size + sync label/state
      }
      if (listenBtn)
        listenBtn.style.display =
          activeProfiles["read-understand"] || activeProfiles["language-support"]
            ? "inline-flex"
            : "none";
      if (rateBtn)
        rateBtn.style.display =
          activeProfiles["read-understand"] || activeProfiles["language-support"]
            ? "inline-flex"
            : "none";

      // Additional accommodation tools, gated by the relevant profile.
      const show = (tool, on) => {
        const b = toolsDock.querySelector(`[data-tool="${tool}"]`);
        if (b) b.style.display = on ? "inline-flex" : "none";
      };
      const presentation = activeProfiles["read-understand"] || activeProfiles["focus-organize"];
      show("tint", presentation);
      show("contrast", presentation);
      show(
        "misconceptions",
        (activeProfiles["read-understand"] || activeProfiles["build-math"]) &&
          Array.isArray(manifestData.misconceptions) &&
          manifestData.misconceptions.length > 0,
      );
      show("multchart", activeProfiles["build-math"] || activeProfiles["multchart"]);
      show("numberline", activeProfiles["build-math"] || activeProfiles["numberline"]);
      show("placevalue", activeProfiles["build-math"] || activeProfiles["placevalue"]);
      show("calculator", activeProfiles["build-math"] || activeProfiles["calculator"]);
      show("checklist", activeProfiles["focus-organize"]);
      show("break", true); // self-regulation is universally available
      applyColorTint(); // reflect stored tint + sync label/state
      const contrastBtn = toolsDock.querySelector('[data-tool="contrast"]');
      if (contrastBtn) {
        contrastBtn.classList.toggle("is-active", highContrast);
        contrastBtn.setAttribute("aria-pressed", String(highContrast));
      }
    } else {
      toolsDock.hidden = true;
      closePanel();
      document.body.classList.remove("ewl-supports-focus-active");
      document.body.classList.remove("ewl-supports-comfort-active");
      document.body.classList.remove("ewl-supports-text-lg", "ewl-supports-text-xl");
      document.body.classList.remove("ewl-supports-contrast-active");
      const tintOverlay = document.getElementById("ewl-supports-tint");
      if (tintOverlay) tintOverlay.style.display = "none";

      const focusBtn = toolsDock.querySelector('[data-tool="focus"]');
      if (focusBtn) focusBtn.classList.remove("is-active");

      // Stop ruler
      rulerActive = false;
      const ruler = document.getElementById("ewl-supports-ruler");
      if (ruler) ruler.classList.remove("is-active");
      const rulerBtn = toolsDock.querySelector('[data-tool="ruler"]');
      if (rulerBtn) rulerBtn.classList.remove("is-active");
      window.removeEventListener("mousemove", updateRulerPosition);
      window.removeEventListener("touchmove", updateRulerTouchPosition);

      stopSpeaking();
    }
  }

  // Slide-out panel toggle
  let activePanelTab = null;

  function togglePanel(tab) {
    const panel = document.querySelector("[data-ewl-supports-panel]");
    if (!panel) return;

    if (activePanelTab === tab && !panel.hidden) {
      closePanel();
      return;
    }

    // Remember which tool button opened the panel so focus can return on close.
    const openingBtn = document.querySelector(`[data-ewl-supports-tools] [data-tool="${tab}"]`);
    if (openingBtn) panel.__ewlTrigger = openingBtn;

    activePanelTab = tab;
    panel.hidden = false;
    panel.classList.add("is-visible");

    const titleEl = panel.querySelector(".ewl-supports-panel-title");
    const bodyEl = panel.querySelector(".ewl-supports-panel-body");

    bodyEl.textContent = "";

    if (tab === "words") {
      titleEl.textContent = "Vocabulary Helper";
      const isLangSupport = activeProfiles["language-support"];

      if (!manifestData.vocabulary || manifestData.vocabulary.length === 0) {
        const fallback = document.createElement("p");
        fallback.textContent = "No glossary entries available for this lesson.";
        bodyEl.appendChild(fallback);
      } else {
        const list = document.createElement("dl");
        list.className = "ewl-supports-vocab-list";

        manifestData.vocabulary.forEach((v) => {
          const dt = document.createElement("dt");
          dt.className = "ewl-supports-vocab-term";

          let displayTerm = v.term;
          let displayDef = v.definition;

          if (isLangSupport) {
            if (activeLanguage === "es" && v.termEs) {
              displayTerm = `${v.term} (${v.termEs})`;
              displayDef = v.definitionEs || v.definition;
            } else if (activeLanguage === "vi" && v.termVi) {
              displayTerm = `${v.term} (${v.termVi})`;
              displayDef = v.definitionVi || v.definition;
            } else if (activeLanguage === "ar" && v.termAr) {
              displayTerm = `${v.term} (${v.termAr})`;
              displayDef = v.definitionAr || v.definition;
            }
          }

          const termSpan = document.createElement("span");
          termSpan.textContent = displayTerm;
          dt.appendChild(termSpan);

          // Speak button next to each term (Modular TTS)
          const speakBtn = document.createElement("button");
          speakBtn.type = "button";
          speakBtn.className = "ewl-supports-vocab-speak-btn";
          speakBtn.textContent = "🗣️";
          speakBtn.setAttribute("aria-label", `Listen to pronunciation of ${displayTerm}`);
          speakBtn.addEventListener("click", () => {
            speakSingleTerm(displayTerm, displayDef);
          });
          dt.appendChild(speakBtn);

          const dd = document.createElement("dd");
          dd.className = "ewl-supports-vocab-definition";
          dd.textContent = displayDef;

          list.appendChild(dt);
          list.appendChild(dd);

          if (v.visual) {
            const visualDiv = document.createElement("div");
            visualDiv.className = "ewl-supports-vocab-visual";
            visualDiv.textContent = v.visual;
            list.appendChild(visualDiv);
          }
        });

        bodyEl.appendChild(list);
      }
    } else if (tab === "example") {
      titleEl.textContent = "Worked Example";
      if (!manifestData.workedExample) {
        const fallback = document.createElement("p");
        fallback.textContent = "No worked example available for this lesson.";
        bodyEl.appendChild(fallback);
      } else {
        const pre = document.createElement("pre");
        pre.className = "ewl-supports-example-text";
        pre.textContent = manifestData.workedExample;
        bodyEl.appendChild(pre);
      }
    } else if (tab === "model") {
      titleEl.textContent = "Prerequisite Practice & Tools";
      const desc = document.createElement("p");
      desc.textContent =
        "Prepare your math foundations with the readiness warm-up or virtual manipulatives.";
      bodyEl.appendChild(desc);

      const readinessLink = document.createElement("a");
      readinessLink.href = manifestData.readinessHref || `/lessons/${activeLessonId}/readiness/`;
      readinessLink.className = "ewl-supports-link-model";
      readinessLink.textContent = "📚 Open Readiness pre-lesson";
      // Open in a new tab so an embedded (Canvas/SCORM) lesson frame is never
      // navigated away from; rel guards against reverse-tabnabbing.
      readinessLink.target = "_blank";
      readinessLink.rel = "noopener noreferrer";
      bodyEl.appendChild(readinessLink);
    } else if (tab === "explain") {
      titleEl.textContent = "Sentence Frames & Stems";
      const desc = document.createElement("p");
      desc.textContent =
        "Use these stems to frame your mathematical discourse and written explanations.";
      bodyEl.appendChild(desc);

      if (manifestData.sentenceFrames && manifestData.sentenceFrames.length > 0) {
        const frameTitle = document.createElement("h4");
        frameTitle.textContent = "Sentence Frames";
        bodyEl.appendChild(frameTitle);

        const list = document.createElement("ul");
        manifestData.sentenceFrames.forEach((f) => {
          const item = document.createElement("li");
          item.textContent = f;
          list.appendChild(item);
        });
        bodyEl.appendChild(list);
      }

      if (manifestData.wordBank && manifestData.wordBank.length > 0) {
        const bankTitle = document.createElement("h4");
        bankTitle.textContent = "Word Bank";
        bodyEl.appendChild(bankTitle);

        const bankContainer = document.createElement("div");
        bankContainer.className = "ewl-supports-word-bank";
        manifestData.wordBank.forEach((word) => {
          const chip = document.createElement("span");
          chip.className = "ewl-supports-word-chip";
          chip.textContent = word;
          bankContainer.appendChild(chip);
        });
        bodyEl.appendChild(bankContainer);
      }
    } else if (tab === "notepad") {
      titleEl.textContent = "My Notes & Scratchpad";

      const desc = document.createElement("p");
      desc.textContent =
        "Write notes, numbers, or intermediate math calculations here. Your notes save automatically on your device.";
      bodyEl.appendChild(desc);

      const textarea = document.createElement("textarea");
      textarea.className = "ewl-supports-notepad-textarea";
      textarea.placeholder = "Type your thoughts, notes, or equations here...";
      textarea.setAttribute("aria-label", "Student Scratchpad Notepad");

      const noteKey = `ewl-supports:v1:notes:${activeLessonId}`;
      try {
        const savedNotes = localStorage.getItem(noteKey);
        if (savedNotes) textarea.value = savedNotes;
      } catch (_e) {}

      textarea.addEventListener("input", (e) => {
        try {
          localStorage.setItem(noteKey, e.target.value);
        } catch (_err) {}
      });

      bodyEl.appendChild(textarea);

      // Dictation (speech-to-text) as a response accommodation, where supported.
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
      if (SR) {
        const dictateBtn = document.createElement("button");
        dictateBtn.type = "button";
        dictateBtn.className = "ewl-supports-chip-btn ewl-supports-dictate-btn";
        dictateBtn.textContent = "🎙️ Dictate";
        dictateBtn.setAttribute("aria-pressed", "false");
        dictateBtn.addEventListener("click", () => {
          if (dictation) {
            stopDictation();
            dictateBtn.textContent = "🎙️ Dictate";
            dictateBtn.classList.remove("is-active");
            dictateBtn.setAttribute("aria-pressed", "false");
            return;
          }
          try {
            dictation = new SR();
            dictation.lang =
              activeProfiles["language-support"] && activeLanguage !== "en"
                ? { es: "es-ES", vi: "vi-VN", ar: "ar-SA" }[activeLanguage] || "en-US"
                : "en-US";
            dictation.interimResults = false;
            dictation.continuous = true;
            dictation.onresult = (ev) => {
              let text = "";
              for (let i = ev.resultIndex; i < ev.results.length; i++) {
                if (ev.results[i].isFinal) text += ev.results[i][0].transcript;
              }
              if (text) {
                const sep = textarea.value && !/\s$/.test(textarea.value) ? " " : "";
                textarea.value += sep + text.trim();
                try {
                  localStorage.setItem(noteKey, textarea.value);
                } catch (_e) {}
              }
            };
            dictation.onend = () => {
              dictation = null;
              dictateBtn.textContent = "🎙️ Dictate";
              dictateBtn.classList.remove("is-active");
              dictateBtn.setAttribute("aria-pressed", "false");
            };
            dictation.onerror = () => stopDictation();
            dictation.start();
            dictateBtn.textContent = "⏹️ Stop dictation";
            dictateBtn.classList.add("is-active");
            dictateBtn.setAttribute("aria-pressed", "true");
            announce("Dictation started. Speak your answer.");
          } catch (_e) {
            stopDictation();
            announce("Dictation is not available right now.");
          }
        });
        bodyEl.appendChild(dictateBtn);
      }

      const hint = document.createElement("p");
      hint.className = "ewl-supports-notepad-hint";
      hint.textContent =
        "🔒 Safe & Private: Notes stay on this device and are never shared or sent to a server.";
      bodyEl.appendChild(hint);
    } else if (tab === "checkin") {
      titleEl.textContent = "My Learning Check-in";

      const container = document.createElement("div");
      container.className = "ewl-supports-checkin-container";

      const prompt = document.createElement("p");
      prompt.className = "ewl-supports-checkin-title";
      prompt.textContent = "How is today's math feeling for you?";
      container.appendChild(prompt);

      const options = document.createElement("div");
      options.className = "ewl-supports-checkin-options";

      const choices = [
        {
          id: "got-it",
          emoji: "😊",
          text: "I understand this!",
          feedback: "Awesome! You are making great progress. Keep pushing your thinking!",
        },
        {
          id: "need-practice",
          emoji: "🤔",
          text: "I need more practice",
          feedback:
            "That's a normal part of learning! Try looking at the Worked Example tab, or try a few more practice questions.",
        },
        {
          id: "help",
          emoji: "🆘",
          text: "I need help / I'm stuck",
          feedback:
            "It is great that you recognize you need help! Read through the Sentence Frames tab to express your thinking, or ask your teacher for guidance.",
        },
      ];

      const feedbackDiv = document.createElement("div");
      feedbackDiv.className = "ewl-supports-checkin-feedback";
      feedbackDiv.style.display = "none";

      let currentCheckin = null;
      try {
        const savedFeedback = localStorage.getItem("ewl-supports:v1:feedback");
        if (savedFeedback) {
          const parsed = JSON.parse(savedFeedback);
          if (parsed && parsed.lessonId === activeLessonId) {
            currentCheckin = parsed.choice;
          }
        }
      } catch (_e) {}

      choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ewl-supports-checkin-btn";
        if (choice.id === currentCheckin) {
          btn.classList.add("is-selected");
          feedbackDiv.textContent = choice.feedback;
          feedbackDiv.style.display = "block";
        }

        const emojiSpan = document.createElement("span");
        emojiSpan.className = "emoji";
        emojiSpan.textContent = choice.emoji;

        const textSpan = document.createElement("span");
        textSpan.textContent = choice.text;

        btn.appendChild(emojiSpan);
        btn.appendChild(textSpan);

        btn.addEventListener("click", () => {
          container
            .querySelectorAll(".ewl-supports-checkin-btn")
            .forEach((b) => b.classList.remove("is-selected"));
          btn.classList.add("is-selected");

          try {
            localStorage.setItem(
              "ewl-supports:v1:feedback",
              JSON.stringify({
                lessonId: activeLessonId,
                choice: choice.id,
                timestamp: Date.now(),
              }),
            );
          } catch (_e) {}

          feedbackDiv.textContent = choice.feedback;
          feedbackDiv.style.display = "block";
        });

        options.appendChild(btn);
      });

      container.appendChild(options);
      container.appendChild(feedbackDiv);
      bodyEl.appendChild(container);
    } else if (tab === "misconceptions") {
      titleEl.textContent = "Watch Out — Common Mistakes";
      buildMisconceptions(bodyEl);
    } else if (tab === "multchart") {
      titleEl.textContent = "Multiplication Chart";
      buildMultiplicationChart(bodyEl);
    } else if (tab === "numberline") {
      titleEl.textContent = "Number Line";
      buildNumberLine(bodyEl);
    } else if (tab === "placevalue") {
      titleEl.textContent = "Place-Value Chart";
      buildPlaceValueChart(bodyEl);
    } else if (tab === "calculator") {
      titleEl.textContent = "Calculator";
      buildCalculator(bodyEl);
    } else if (tab === "checklist") {
      titleEl.textContent = "My Checklist";
      buildChecklist(bodyEl);
    } else if (tab === "break") {
      titleEl.textContent = "Take a Break";
      buildBreak(bodyEl);
    }

    const toolsDock = document.querySelector("[data-ewl-supports-tools]");
    if (toolsDock) {
      toolsDock.querySelectorAll(".ewl-supports-tool-btn").forEach((btn) => {
        const tool = btn.getAttribute("data-tool");
        btn.setAttribute("aria-pressed", String(tool === tab));
      });
    }

    if (titleEl && titleEl.textContent) announce(`${titleEl.textContent} opened.`);

    // Move keyboard focus into the newly opened panel for immediate access.
    const panelFocus = getFocusable(panel);
    if (panelFocus.length > 0) panelFocus[0].focus();
  }

  function updatePanelContent() {
    if (activePanelTab) {
      const tab = activePanelTab;
      activePanelTab = null;
      togglePanel(tab);
    }
  }

  function closePanel() {
    stopBreakTimer();
    stopDictation();
    const panel = document.querySelector("[data-ewl-supports-panel]");
    let trigger = null;
    if (panel) {
      panel.hidden = true;
      panel.classList.remove("is-visible");
      trigger = panel.__ewlTrigger || null;
      panel.__ewlTrigger = null;
    }
    activePanelTab = null;

    // Return focus to the tool button that opened the panel.
    if (trigger && document.contains(trigger) && trigger.offsetParent !== null) {
      trigger.focus();
    }

    const toolsDock = document.querySelector("[data-ewl-supports-tools]");
    if (toolsDock) {
      toolsDock.querySelectorAll(".ewl-supports-tool-btn").forEach((btn) => {
        const tool = btn.getAttribute("data-tool");
        if (
          tool !== "focus" &&
          tool !== "listen" &&
          tool !== "rate" &&
          tool !== "ruler" &&
          tool !== "comfort" &&
          tool !== "textsize" &&
          tool !== "tint" &&
          tool !== "contrast"
        ) {
          btn.setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  // Reversible Focus Mode
  function toggleFocusMode(e) {
    const active = document.body.classList.toggle("ewl-supports-focus-active");
    const btn = e.currentTarget;
    btn.setAttribute("aria-pressed", String(active));
    if (active) {
      btn.classList.add("is-active");
    } else {
      btn.classList.remove("is-active");
    }
  }

  // Executive Function Reading Ruler
  function toggleRulerMode(e) {
    rulerActive = !rulerActive;
    const btn = e.currentTarget;
    btn.setAttribute("aria-pressed", String(rulerActive));
    const ruler = document.getElementById("ewl-supports-ruler");
    if (ruler) {
      if (rulerActive) {
        ruler.classList.add("is-active");
        btn.classList.add("is-active");
        window.addEventListener("mousemove", updateRulerPosition);
        window.addEventListener("touchmove", updateRulerTouchPosition, {
          passive: true,
        });
      } else {
        ruler.classList.remove("is-active");
        btn.classList.remove("is-active");
        window.removeEventListener("mousemove", updateRulerPosition);
        window.removeEventListener("touchmove", updateRulerTouchPosition);
      }
    }
  }

  function updateRulerPosition(e) {
    const ruler = document.getElementById("ewl-supports-ruler");
    if (ruler) {
      ruler.style.top = `${e.clientY}px`;
    }
  }

  function updateRulerTouchPosition(e) {
    if (e.touches && e.touches.length > 0) {
      const ruler = document.getElementById("ewl-supports-ruler");
      if (ruler) {
        ruler.style.top = `${e.touches[0].clientY}px`;
      }
    }
  }

  // Dyslexia / Comfort Typography Active Styles
  function toggleComfortMode(e) {
    comfortActive = !comfortActive;
    const btn = e.currentTarget;
    btn.setAttribute("aria-pressed", String(comfortActive));
    if (comfortActive) {
      document.body.classList.add("ewl-supports-comfort-active");
      btn.classList.add("is-active");
    } else {
      document.body.classList.remove("ewl-supports-comfort-active");
      btn.classList.remove("is-active");
    }

    saveStoredPreferences();
    announce(comfortActive ? "Comfort spacing on." : "Comfort spacing off.");
  }

  // Text-Size Accommodation: cycle Normal → Large → X-Large and back.
  function cycleTextScale(e) {
    textScale = (textScale + 1) % 3;
    applyTextScale();
    saveStoredPreferences();
    const btn = e.currentTarget;
    if (btn) btn.classList.toggle("is-active", textScale > 0);
    announce(`${TEXT_SCALE_LABELS[textScale]} applied.`);
  }

  // Color-tint overlay: cycle through calming tints for visual-stress comfort.
  function cycleColorTint() {
    colorTint = (colorTint + 1) % TINTS.length;
    applyColorTint();
    saveStoredPreferences();
    announce(`${TINTS[colorTint].name} tint.`);
  }

  // High-contrast mode: boost text/background contrast on the lesson content.
  function toggleHighContrast(e) {
    highContrast = !highContrast;
    document.body.classList.toggle("ewl-supports-contrast-active", highContrast);
    const btn = e.currentTarget;
    if (btn) {
      btn.classList.toggle("is-active", highContrast);
      btn.setAttribute("aria-pressed", String(highContrast));
    }
    saveStoredPreferences();
    announce(highContrast ? "High contrast on." : "High contrast off.");
  }

  // Listen (Text to speech) mode
  function toggleListenMode(e) {
    const btn = e.currentTarget;
    const isSpeaking = btn.classList.contains("is-active");

    if (isSpeaking) {
      stopSpeaking();
      btn.classList.remove("is-active");
      btn.textContent = "🔊 Listen";
      btn.setAttribute("aria-pressed", "false");
    } else {
      btn.classList.add("is-active");
      btn.textContent = "⏹️ Stop";
      btn.setAttribute("aria-pressed", "true");
      startSpeaking(() => {
        btn.classList.remove("is-active");
        btn.textContent = "🔊 Listen";
        btn.setAttribute("aria-pressed", "false");
      });
    }
  }

  function startSpeaking(onEnd) {
    if (!window.speechSynthesis) {
      console.warn("Learning supports: Text-to-speech API not supported by browser.");
      if (onEnd) onEnd();
      return;
    }

    stopSpeaking();

    let text = "";
    const isLangSupport = activeProfiles["language-support"];

    let objTitle = "Today's objective.";
    let langObjTitle = "Language objective.";
    let vocabTitle = "Key vocabulary terms.";
    let definitionLabel = "Definition.";

    if (isLangSupport) {
      if (activeLanguage === "es") {
        objTitle = "Objetivo de hoy.";
        langObjTitle = "Objetivo lingüístico.";
        vocabTitle = "Términos de vocabulario clave.";
        definitionLabel = "Definición.";
      } else if (activeLanguage === "vi") {
        objTitle = "Mục tiêu hôm nay.";
        langObjTitle = "Mục tiêu ngôn ngữ.";
        vocabTitle = "Các thuật ngữ từ vựng chính.";
        definitionLabel = "Định nghĩa.";
      } else if (activeLanguage === "ar") {
        objTitle = "هدف اليوم.";
        langObjTitle = "الهدف اللغوي.";
        vocabTitle = "مصطلحات المفردات الرئيسية.";
        definitionLabel = "تعريف.";
      }
    }

    if (manifestData.contentObjective) text += `${objTitle} ${manifestData.contentObjective}. `;
    if (manifestData.languageObjective)
      text += `${langObjTitle} ${manifestData.languageObjective}. `;

    if (manifestData.vocabulary && manifestData.vocabulary.length > 0) {
      text += `${vocabTitle} `;
      manifestData.vocabulary.forEach((v) => {
        let termText = v.term;
        let defText = v.definition;

        if (isLangSupport) {
          if (activeLanguage === "es") {
            termText = v.termEs || v.term;
            defText = v.definitionEs || v.definition;
          } else if (activeLanguage === "vi") {
            termText = v.termVi || v.term;
            defText = v.definitionVi || v.definition;
          } else if (activeLanguage === "ar") {
            termText = v.termAr || v.term;
            defText = v.definitionAr || v.definition;
          }
        }
        text += `${termText}. ${definitionLabel} ${defText}. `;
      });
    }

    activeSpeechUtterance = new SpeechSynthesisUtterance(text);

    if (isLangSupport) {
      if (activeLanguage === "es") activeSpeechUtterance.lang = "es-ES";
      else if (activeLanguage === "vi") activeSpeechUtterance.lang = "vi-VN";
      else if (activeLanguage === "ar") activeSpeechUtterance.lang = "ar-SA";
      else activeSpeechUtterance.lang = "en-US";
    } else {
      activeSpeechUtterance.lang = "en-US";
    }

    activeSpeechUtterance.rate = activeSpeechRate;

    activeSpeechUtterance.onend = () => {
      activeSpeechUtterance = null;
      if (onEnd) onEnd();
    };
    activeSpeechUtterance.onerror = () => {
      activeSpeechUtterance = null;
      if (onEnd) onEnd();
    };

    setTimeout(() => {
      if (window.speechSynthesis && activeSpeechUtterance) {
        window.speechSynthesis.speak(activeSpeechUtterance);
      }
    }, 50);
  }

  function speakSingleTerm(termText, definitionText) {
    if (!window.speechSynthesis) return;
    stopSpeaking();

    const cleanTerm = termText.replace(/\([^)]*\)/g, "").trim();
    const text = `${cleanTerm}. Definition. ${definitionText}`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = activeSpeechRate;

    const isLangSupport = activeProfiles["language-support"];
    if (isLangSupport) {
      if (activeLanguage === "es") utterance.lang = "es-ES";
      else if (activeLanguage === "vi") utterance.lang = "vi-VN";
      else if (activeLanguage === "ar") utterance.lang = "ar-SA";
      else utterance.lang = "en-US";
    } else {
      utterance.lang = "en-US";
    }

    activeSpeechUtterance = utterance;
    setTimeout(() => {
      if (window.speechSynthesis && activeSpeechUtterance === utterance) {
        window.speechSynthesis.speak(utterance);
      }
    }, 50);
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    activeSpeechUtterance = null;
  }

  // Copy Personalized Link
  // Download a Canvas-ready SCORM package of this lesson with the selected
  // supports baked into the launch URL, so a teacher can post a personalized
  // version for specific students. Uses the site's on-demand /api/scorm builder.
  function downloadPersonalizedScorm(btn) {
    const activeList = serializeSettings(activeProfiles);
    if (!activeList) {
      announce("Choose at least one support before downloading a SCORM package.");
      const orig = btn.textContent;
      btn.textContent = "Select a support first";
      setTimeout(() => {
        btn.textContent = orig;
      }, 1800);
      return;
    }

    const params = new URLSearchParams();
    params.set("activity", activeLessonId);
    if (manifestData && manifestData.title) params.set("title", manifestData.title);
    // The builder folds these into the lesson launch query so the supports
    // controller activates them on load (query, not fragment — the SCO appends
    // the Canvas student identity to the query at launch).
    params.set("supports", activeList);
    if (activeProfiles["language-support"] && activeLanguage !== "en") {
      params.set("lang", activeLanguage);
    }

    const href = `/api/scorm?${params.toString()}`;
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();

    const orig = btn.textContent;
    btn.textContent = "⬇️ Building package…";
    announce("Building a personalized SCORM package for download.");
    setTimeout(() => {
      btn.textContent = orig;
    }, 2500);
  }

  function copyPersonalizedLink(btn) {
    const activeList = serializeSettings(activeProfiles);
    const url = new URL(window.location.href);
    if (activeList) {
      url.hash = `supports=${activeList}`;
    } else {
      url.hash = "";
    }

    const piiMatch =
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(url.href) ||
      url.href.includes("studentName") ||
      url.href.includes("studentId");
    if (piiMatch) {
      console.error("Personalized link generation aborted due to possible PII detection.");
      return;
    }

    const showCopied = () => {
      const origText = btn.textContent;
      btn.textContent = "✓ Copied!";
      announce("Personalized support link copied to the clipboard.");
      setTimeout(() => {
        btn.textContent = origText;
      }, 1500);
    };

    const fallbackCopy = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = url.href;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showCopied();
      } catch (err) {
        console.error("Failed to copy link.", err);
        announce("Could not copy the link automatically.");
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url.href).then(showCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  // Apply a one-click quick-setup preset: enable exactly its profiles.
  function applyPreset(preset) {
    PROFILE_KEYS.forEach((k) => {
      activeProfiles[k] = preset.keys.indexOf(k) !== -1;
    });
    // Reflect in dialog checkboxes.
    PROFILE_KEYS.forEach((key) => {
      const checkbox = document.getElementById(`ewl-profile-${key}`);
      if (checkbox) checkbox.checked = activeProfiles[key];
    });
    const langContainer = document.getElementById("ewl-lang-select-container");
    if (langContainer) {
      langContainer.style.display = activeProfiles["language-support"] ? "block" : "none";
    }
    saveStoredPreferences();
    updateUIStates();
    updatePanelContent();
    announce(`${preset.label.replace(/^[^\w]+/, "").trim()} supports turned on.`);
  }

  // ---- Lesson-specific guidance -------------------------------------------

  function buildMisconceptions(bodyEl) {
    const list = manifestData.misconceptions;
    if (!Array.isArray(list) || list.length === 0) {
      const p = document.createElement("p");
      p.textContent = "No common-mistake tips are available for this lesson yet.";
      bodyEl.appendChild(p);
      return;
    }
    const intro = document.createElement("p");
    intro.textContent = "Watch for these common mistakes as you work this lesson.";
    bodyEl.appendChild(intro);

    const ul = document.createElement("ul");
    ul.className = "ewl-supports-miscon-list";
    list.forEach((item) => {
      // Accept either { mistake, tip } objects or plain strings.
      const mistake = typeof item === "string" ? item : item.mistake;
      const tip = typeof item === "string" ? "" : item.tip;
      if (!mistake) return;
      const li = document.createElement("li");
      li.className = "ewl-supports-miscon-item";
      const m = document.createElement("p");
      m.className = "ewl-supports-miscon-mistake";
      m.textContent = `🚧 ${mistake}`;
      li.appendChild(m);
      if (tip) {
        const t = document.createElement("p");
        t.className = "ewl-supports-miscon-tip";
        t.textContent = `✅ ${tip}`;
        li.appendChild(t);
      }
      ul.appendChild(li);
    });
    bodyEl.appendChild(ul);
  }

  // ---- Math manipulatives & reference tools -------------------------------

  function buildMultiplicationChart(bodyEl) {
    const desc = document.createElement("p");
    desc.textContent = "A multiplication chart to check facts as you work.";
    bodyEl.appendChild(desc);

    const table = document.createElement("table");
    table.className = "ewl-supports-mult-table";
    const caption = document.createElement("caption");
    caption.className = "ewl-supports-sr-only";
    caption.textContent = "Multiplication chart, 1 to 12";
    table.appendChild(caption);

    for (let r = 0; r <= 12; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c <= 12; c++) {
        const cell = document.createElement(r === 0 || c === 0 ? "th" : "td");
        if (r === 0 && c === 0) {
          cell.textContent = "×";
          cell.className = "ewl-supports-mult-corner";
        } else if (r === 0) {
          cell.textContent = String(c);
          cell.scope = "col";
        } else if (c === 0) {
          cell.textContent = String(r);
          cell.scope = "row";
        } else {
          cell.textContent = String(r * c);
        }
        tr.appendChild(cell);
      }
      table.appendChild(tr);
    }
    const wrap = document.createElement("div");
    wrap.className = "ewl-supports-table-scroll";
    wrap.appendChild(table);
    bodyEl.appendChild(wrap);
  }

  function buildNumberLine(bodyEl) {
    const desc = document.createElement("p");
    desc.textContent = "Count up or down along the number line.";
    bodyEl.appendChild(desc);

    const controls = document.createElement("div");
    controls.className = "ewl-supports-nl-controls";
    const ranges = [
      { label: "0–20", min: 0, max: 20 },
      { label: "0–100 (10s)", min: 0, max: 100, step: 10 },
      { label: "−10–10", min: -10, max: 10 },
    ];
    const line = document.createElement("div");
    line.className = "ewl-supports-numberline ewl-supports-table-scroll";

    const render = (min, max, step) => {
      line.textContent = "";
      const inner = document.createElement("div");
      inner.className = "ewl-supports-numberline-inner";
      for (let n = min; n <= max; n += step || 1) {
        const tick = document.createElement("div");
        tick.className = "ewl-supports-nl-tick";
        const mark = document.createElement("span");
        mark.className = "ewl-supports-nl-mark";
        const num = document.createElement("span");
        num.className = "ewl-supports-nl-num";
        num.textContent = String(n);
        tick.appendChild(mark);
        tick.appendChild(num);
        inner.appendChild(tick);
      }
      line.appendChild(inner);
    };

    ranges.forEach((r, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ewl-supports-chip-btn";
      b.textContent = r.label;
      b.addEventListener("click", () => {
        controls.querySelectorAll("button").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        render(r.min, r.max, r.step);
      });
      if (i === 0) b.classList.add("is-active");
      controls.appendChild(b);
    });
    bodyEl.appendChild(controls);
    bodyEl.appendChild(line);
    render(ranges[0].min, ranges[0].max, ranges[0].step);
  }

  function buildPlaceValueChart(bodyEl) {
    const desc = document.createElement("p");
    desc.textContent = "Line up digits by their place value.";
    bodyEl.appendChild(desc);

    const cols = [
      "Thousands",
      "Hundreds",
      "Tens",
      "Ones",
      ".",
      "Tenths",
      "Hundredths",
      "Thousandths",
    ];
    const table = document.createElement("table");
    table.className = "ewl-supports-pv-table";
    const thead = document.createElement("tr");
    cols.forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c;
      if (c === ".") th.className = "ewl-supports-pv-dot";
      thead.appendChild(th);
    });
    table.appendChild(thead);
    // Two empty rows for students to visualize/write with.
    for (let r = 0; r < 2; r++) {
      const tr = document.createElement("tr");
      cols.forEach((c) => {
        const td = document.createElement("td");
        if (c === ".") {
          td.textContent = ".";
          td.className = "ewl-supports-pv-dot";
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    }
    const wrap = document.createElement("div");
    wrap.className = "ewl-supports-table-scroll";
    wrap.appendChild(table);
    bodyEl.appendChild(wrap);
  }

  function buildCalculator(bodyEl) {
    const note = document.createElement("p");
    note.textContent = "Use the calculator if it is allowed for this task.";
    bodyEl.appendChild(note);

    const calc = document.createElement("div");
    calc.className = "ewl-supports-calc";
    const display = document.createElement("output");
    display.className = "ewl-supports-calc-display";
    display.textContent = "0";
    calc.appendChild(display);

    // Simple, eval-free calculator state machine.
    let entry = "0";
    let stored = null;
    let op = null;
    let justEvaluated = false;

    const compute = (a, operator, b) => {
      switch (operator) {
        case "+":
          return a + b;
        case "−":
          return a - b;
        case "×":
          return a * b;
        case "÷":
          return b === 0 ? NaN : a / b;
        default:
          return b;
      }
    };
    const show = () => {
      display.textContent = entry === "" ? "0" : entry;
    };
    const inputDigit = (d) => {
      if (justEvaluated) {
        entry = "0";
        justEvaluated = false;
      }
      entry = entry === "0" ? d : entry + d;
      show();
    };
    const inputDot = () => {
      if (justEvaluated) {
        entry = "0";
        justEvaluated = false;
      }
      if (!entry.includes(".")) entry += ".";
      show();
    };
    const chooseOp = (nextOp) => {
      const val = parseFloat(entry);
      if (stored === null) stored = val;
      else if (op) stored = compute(stored, op, val);
      op = nextOp;
      entry = "";
      justEvaluated = false;
      display.textContent = String(stored);
    };
    const evaluate = () => {
      if (op === null) return;
      const val = entry === "" ? stored : parseFloat(entry);
      const result = compute(stored, op, val);
      display.textContent = Number.isFinite(result) ? String(result) : "Error";
      entry = Number.isFinite(result) ? String(result) : "0";
      stored = null;
      op = null;
      justEvaluated = true;
    };
    const clearAll = () => {
      entry = "0";
      stored = null;
      op = null;
      justEvaluated = false;
      show();
    };

    const keys = [
      ["7", () => inputDigit("7")],
      ["8", () => inputDigit("8")],
      ["9", () => inputDigit("9")],
      ["÷", () => chooseOp("÷")],
      ["4", () => inputDigit("4")],
      ["5", () => inputDigit("5")],
      ["6", () => inputDigit("6")],
      ["×", () => chooseOp("×")],
      ["1", () => inputDigit("1")],
      ["2", () => inputDigit("2")],
      ["3", () => inputDigit("3")],
      ["−", () => chooseOp("−")],
      ["0", () => inputDigit("0")],
      [".", inputDot],
      ["=", evaluate],
      ["+", () => chooseOp("+")],
      ["C", clearAll],
    ];
    const grid = document.createElement("div");
    grid.className = "ewl-supports-calc-grid";
    keys.forEach(([label, handler]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ewl-supports-calc-key";
      b.textContent = label;
      if (/[+\-−×÷=]/.test(label)) b.classList.add("ewl-supports-calc-op");
      if (label === "C") b.classList.add("ewl-supports-calc-clear");
      b.addEventListener("click", handler);
      grid.appendChild(b);
    });
    calc.appendChild(grid);
    bodyEl.appendChild(calc);
  }

  // ---- Executive function & self-regulation -------------------------------

  function buildChecklist(bodyEl) {
    const desc = document.createElement("p");
    desc.textContent = "Break your work into steps. Check each one off as you finish.";
    bodyEl.appendChild(desc);

    const key = `ewl-supports:v1:checklist:${activeLessonId}`;
    const seededKey = `ewl-supports:v1:checklist-seeded:${activeLessonId}`;
    let items = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) items = JSON.parse(saved) || [];
    } catch (_e) {}

    // Seed lesson-specific starter steps the first time (only once, so a student
    // who clears their own steps doesn't get them re-added).
    if (
      items.length === 0 &&
      Array.isArray(manifestData.checklistSteps) &&
      manifestData.checklistSteps.length
    ) {
      let alreadySeeded = false;
      try {
        alreadySeeded = localStorage.getItem(seededKey) === "1";
      } catch (_e) {}
      if (!alreadySeeded) {
        items = manifestData.checklistSteps
          .filter((s) => typeof s === "string" && s.trim())
          .map((s) => ({ text: s, done: false }));
        try {
          localStorage.setItem(key, JSON.stringify(items));
          localStorage.setItem(seededKey, "1");
        } catch (_e) {}
      }
    }

    const list = document.createElement("ul");
    list.className = "ewl-supports-checklist";

    const persist = () => {
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch (_e) {}
    };

    const renderList = () => {
      list.textContent = "";
      items.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "ewl-supports-checklist-item";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!item.done;
        cb.id = `ewl-check-${idx}`;
        cb.addEventListener("change", () => {
          items[idx].done = cb.checked;
          label.classList.toggle("is-done", cb.checked);
          persist();
        });
        const label = document.createElement("label");
        label.setAttribute("for", cb.id);
        label.textContent = item.text;
        if (item.done) label.classList.add("is-done");
        const del = document.createElement("button");
        del.type = "button";
        del.className = "ewl-supports-checklist-del";
        del.textContent = "✕";
        del.setAttribute("aria-label", `Remove step: ${item.text}`);
        del.addEventListener("click", () => {
          items.splice(idx, 1);
          persist();
          renderList();
        });
        li.appendChild(cb);
        li.appendChild(label);
        li.appendChild(del);
        list.appendChild(li);
      });
    };

    const form = document.createElement("form");
    form.className = "ewl-supports-checklist-add";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Add a step…";
    input.className = "ewl-supports-checklist-input";
    input.setAttribute("aria-label", "Add a checklist step");
    const addBtn = document.createElement("button");
    addBtn.type = "submit";
    addBtn.className = "ewl-supports-chip-btn";
    addBtn.textContent = "Add";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      items.push({ text, done: false });
      input.value = "";
      persist();
      renderList();
    });
    form.appendChild(input);
    form.appendChild(addBtn);

    bodyEl.appendChild(form);
    bodyEl.appendChild(list);
    renderList();
  }

  function buildBreak(bodyEl) {
    const desc = document.createElement("p");
    desc.textContent = "Take a calm minute. Breathe in as the circle grows, out as it shrinks.";
    bodyEl.appendChild(desc);

    const circle = document.createElement("div");
    circle.className = "ewl-supports-break-circle";
    circle.setAttribute("aria-hidden", "true");
    const cue = document.createElement("div");
    cue.className = "ewl-supports-break-cue";
    cue.textContent = "Breathe in…";
    circle.appendChild(cue);
    bodyEl.appendChild(circle);

    const timerLabel = document.createElement("p");
    timerLabel.className = "ewl-supports-break-timer";
    bodyEl.appendChild(timerLabel);

    let remaining = 60;
    const tick = () => {
      timerLabel.textContent = `${remaining}s`;
      cue.textContent = Math.floor(remaining / 4) % 2 === 0 ? "Breathe in…" : "Breathe out…";
      remaining -= 1;
      if (remaining < 0) {
        stopBreakTimer();
        timerLabel.textContent = "Nice work. Ready when you are.";
        announce("Break finished. Ready to continue.");
      }
    };
    stopBreakTimer();
    tick();
    breakTimerId = setInterval(tick, 1000);

    const done = document.createElement("button");
    done.type = "button";
    done.className = "ewl-supports-chip-btn ewl-supports-break-done";
    done.textContent = "I'm ready to continue";
    done.addEventListener("click", () => {
      stopBreakTimer();
      closePanel();
    });
    bodyEl.appendChild(done);
  }

  function stopBreakTimer() {
    if (breakTimerId) {
      clearInterval(breakTimerId);
      breakTimerId = null;
    }
  }

  function stopDictation() {
    if (dictation) {
      try {
        dictation.onend = null;
        dictation.stop();
      } catch (_e) {}
      dictation = null;
    }
  }

  // Build and print a clean, student-safe reference sheet from authored manifest
  // content only. Never includes answers, interactive controls, or config data.
  function printWithSupports() {
    if (!manifestData) return;

    // Remove any prior sheet.
    const prior = document.querySelector("[data-ewl-supports-print-sheet]");
    if (prior) prior.remove();

    const isLang = activeProfiles["language-support"] && activeLanguage !== "en";
    const sheet = document.createElement("section");
    sheet.setAttribute("data-ewl-supports-print-sheet", "1");
    sheet.className = "ewl-supports-print-sheet";

    const h1 = document.createElement("h1");
    h1.textContent = `${manifestData.title || "Lesson"} — Learning Supports`;
    sheet.appendChild(h1);

    const addSection = (heading, builder) => {
      const h = document.createElement("h2");
      h.textContent = heading;
      sheet.appendChild(h);
      builder();
    };

    if (manifestData.contentObjective) {
      addSection("Objective", () => {
        const p = document.createElement("p");
        p.textContent = manifestData.contentObjective;
        sheet.appendChild(p);
      });
    }

    if (manifestData.vocabulary && manifestData.vocabulary.length) {
      addSection("Vocabulary", () => {
        const dl = document.createElement("dl");
        manifestData.vocabulary.forEach((v) => {
          let term = v.term;
          let def = v.definition;
          if (isLang) {
            const t = v[`term${activeLanguage[0].toUpperCase()}${activeLanguage[1]}`];
            const d = v[`definition${activeLanguage[0].toUpperCase()}${activeLanguage[1]}`];
            if (t) term = `${v.term} (${t})`;
            if (d) def = d;
          }
          const dt = document.createElement("dt");
          dt.textContent = term;
          const dd = document.createElement("dd");
          dd.textContent = def;
          dl.appendChild(dt);
          dl.appendChild(dd);
        });
        sheet.appendChild(dl);
      });
    }

    if (manifestData.workedExample) {
      addSection("Worked Example", () => {
        const pre = document.createElement("pre");
        pre.textContent = manifestData.workedExample;
        sheet.appendChild(pre);
      });
    }

    if (manifestData.sentenceFrames && manifestData.sentenceFrames.length) {
      addSection("Sentence Frames", () => {
        const ul = document.createElement("ul");
        manifestData.sentenceFrames.forEach((f) => {
          const li = document.createElement("li");
          li.textContent = f;
          ul.appendChild(li);
        });
        sheet.appendChild(ul);
      });
    }

    if (manifestData.wordBank && manifestData.wordBank.length) {
      addSection("Word Bank", () => {
        const p = document.createElement("p");
        p.textContent = manifestData.wordBank.join("  •  ");
        sheet.appendChild(p);
      });
    }

    document.body.appendChild(sheet);
    document.body.classList.add("ewl-supports-printing");

    const cleanup = () => {
      document.body.classList.remove("ewl-supports-printing");
      const s = document.querySelector("[data-ewl-supports-print-sheet]");
      if (s) s.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    // Give the sheet a tick to render, then print. Fallback cleanup if the
    // browser never fires afterprint (some environments).
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1000);
    }, 50);
  }

  // Reset supports
  function resetAllSupports() {
    PROFILE_KEYS.forEach((k) => {
      activeProfiles[k] = false;
    });
    activeLanguage = "en";
    activeSpeechRate = 1.0;
    comfortActive = false;
    textScale = 0;
    colorTint = 0;
    highContrast = false;

    saveStoredPreferences();

    document.body.classList.remove("ewl-supports-focus-active");
    document.body.classList.remove("ewl-supports-comfort-active");
    document.body.classList.remove("ewl-supports-text-lg", "ewl-supports-text-xl");
    document.body.classList.remove("ewl-supports-contrast-active");
    applyColorTint();
    stopBreakTimer();
    stopDictation();

    // Reset ruler
    rulerActive = false;
    const ruler = document.getElementById("ewl-supports-ruler");
    if (ruler) ruler.classList.remove("is-active");
    window.removeEventListener("mousemove", updateRulerPosition);
    window.removeEventListener("touchmove", updateRulerTouchPosition);

    stopSpeaking();

    PROFILE_KEYS.forEach((key) => {
      const checkbox = document.getElementById(`ewl-profile-${key}`);
      if (checkbox) checkbox.checked = false;
    });

    const langSelect = document.getElementById("ewl-lang-select");
    if (langSelect) langSelect.value = "en";

    updateUIStates();
    announce("All learning supports have been reset.");
  }

  // Reversible clean up
  function destroy() {
    if (!initialized) return;

    document.body.classList.remove("ewl-supports-focus-active");
    document.body.classList.remove("ewl-supports-comfort-active");
    document.body.classList.remove("ewl-supports-text-lg", "ewl-supports-text-xl");
    document.body.classList.remove("ewl-supports-contrast-active");
    stopBreakTimer();
    stopDictation();

    // Reset ruler
    rulerActive = false;
    const ruler = document.getElementById("ewl-supports-ruler");
    if (ruler) ruler.classList.remove("is-active");
    window.removeEventListener("mousemove", updateRulerPosition);
    window.removeEventListener("touchmove", updateRulerTouchPosition);

    stopSpeaking();

    document.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("pagehide", stopSpeaking);
    document.removeEventListener("visibilitychange", handleVisibility);

    if (rootEl && rootEl.parentNode) {
      rootEl.parentNode.removeChild(rootEl);
    }
    rootEl = null;
    liveRegion = null;
    dialogTrigger = null;

    initialized = false;
    manifestData = null;
    activeLessonId = null;
  }

  // =========================================================================
  // Learning Supports v2 — per-student IEP/WIDA assignment, synced across
  // lessons via D1 (functions/api/supports), cached in localStorage.
  // Taxonomy: assets/learning-supports/supports-schema.js (window.EWLSupportsSchema).
  // =========================================================================
  const V2_ME_KEY = "ewl-supports:v2:me";
  const V2_TEACHER_KEY_LS = "nt-teacher-key";
  const V2_API = "/api/supports";

  // Item key -> one of the 6 legacy profiles, so the hidden bridge form (and
  // therefore Copy-Link / SCORM) stays in sync with the fine-grained selection.
  const ITEM_TO_PROFILE = {
    tts: "read-understand",
    vocab: "read-understand",
    example: "read-understand",
    misconceptions: "read-understand",
    "text-large": "read-understand",
    contrast: "read-understand",
    focus: "focus-organize",
    ruler: "focus-organize",
    comfort: "focus-organize",
    tint: "focus-organize",
    model: "build-math",
    calculator: "build-math",
    numberline: "build-math",
    multchart: "build-math",
    placevalue: "build-math",
    frames: "express-thinking",
    translate: "language-support",
  };

  function loadSupportsSchema() {
    return new Promise((resolve) => {
      if (window.EWLSupportsSchema) return resolve(window.EWLSupportsSchema);
      let url;
      try {
        url = new URL("supports-schema.js", SCRIPT_URL).href;
      } catch (_e) {
        url = "/assets/learning-supports/supports-schema.js";
      }
      const s = document.createElement("script");
      s.src = url;
      s.onload = () => resolve(window.EWLSupportsSchema || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  function v2TeacherKey() {
    try {
      return localStorage.getItem(V2_TEACHER_KEY_LS) || "";
    } catch (_e) {
      return "";
    }
  }

  async function v2FetchJSON(path, opts) {
    try {
      const res = await fetch(V2_API + path, opts);
      if (!res.ok) return { ok: false, status: res.status };
      return await res.json();
    } catch (_e) {
      return null;
    }
  }

  function v2GetMe() {
    try {
      const raw = localStorage.getItem(V2_ME_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }
  function v2SetMe(me) {
    try {
      localStorage.setItem(V2_ME_KEY, JSON.stringify(me));
    } catch (_e) {
      /* ignore */
    }
  }
  function v2CacheKey(section, initials) {
    return "ewl-supports:v2:assigned:" + section + ":" + initials;
  }
  function v2GetCached(section, initials) {
    try {
      const raw = localStorage.getItem(v2CacheKey(section, initials));
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }
  function v2SetCached(section, initials, val) {
    try {
      localStorage.setItem(v2CacheKey(section, initials), JSON.stringify(val));
    } catch (_e) {
      /* ignore */
    }
  }

  // Apply a resolved item-key set: passive items take effect immediately;
  // interactive items become the ONLY buttons visible in the side dock.
  function applyAssignedItems(keys) {
    const set = Object.create(null);
    (keys || []).forEach((k) => {
      set[k] = true;
    });
    textScale = set["text-large"] ? 1 : 0;
    colorTint = set.tint ? 1 : 0;
    highContrast = !!set.contrast;
    comfortActive = !!set.comfort;
    document.body.classList.toggle("ewl-supports-comfort-active", comfortActive);
    document.body.classList.toggle("ewl-supports-contrast-active", highContrast);
    applyTextScale();
    applyColorTint();

    const dock = document.querySelector("[data-ewl-supports-tools]");
    if (!dock) return;
    const btns = dock.querySelectorAll(".ewl-supports-tool-btn");
    for (let i = 0; i < btns.length; i++) btns[i].style.display = "none";
    const schema = window.EWLSupportsSchema;
    let anyInteractive = false;
    if (schema) {
      schema.allItems.forEach((it) => {
        if (it.apply === "interactive" && it.tool && set[it.key]) {
          const b = dock.querySelector('[data-tool="' + it.tool + '"]');
          if (b) {
            b.style.display = "inline-flex";
            anyInteractive = true;
          }
        }
      });
    }
    dock.hidden = !anyInteractive;
  }

  // Reflect a resolved item set into the hidden legacy profile checkboxes so
  // Copy-Link / SCORM export the equivalent coarse profiles.
  function v2SyncBridgeProfiles(keys) {
    const on = Object.create(null);
    (keys || []).forEach((k) => {
      const p = ITEM_TO_PROFILE[k];
      if (p) on[p] = true;
    });
    PROFILE_KEYS.forEach((p) => {
      activeProfiles[p] = !!on[p];
      const cb = document.getElementById("ewl-profile-" + p);
      if (cb) cb.checked = !!on[p];
    });
  }

  // ---- Student self-identification (one-time per device) -------------------
  async function v2PromptSelfPick() {
    const data = await v2FetchJSON("/sections");
    const sections = (data && data.sections) || {};
    const hasAny = Object.keys(sections).some((s) => (sections[s] || []).length);
    if (!hasAny) return null; // teacher hasn't built a roster — don't nag students

    return new Promise((resolve) => {
      const back = document.createElement("div");
      back.className = "ewl-supports-selfpick-backdrop";
      const card = document.createElement("div");
      card.className = "ewl-supports-selfpick-card";
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-modal", "true");
      const h = document.createElement("h2");
      h.textContent = "Who are you?";
      const p = document.createElement("p");
      p.textContent = "Pick your class, then your initials. We remember it on this device.";
      const secWrap = document.createElement("div");
      secWrap.className = "ewl-supports-selfpick-row";
      const listWrap = document.createElement("div");
      listWrap.className = "ewl-supports-selfpick-list";
      card.appendChild(h);
      card.appendChild(p);
      card.appendChild(secWrap);
      card.appendChild(listWrap);

      function done(me) {
        back.remove();
        resolve(me);
      }
      (window.EWLSupportsSchema
        ? window.EWLSupportsSchema.sections
        : Object.keys(sections)
      ).forEach((sec) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ewl-supports-selfpick-sec";
        b.textContent = sec;
        b.addEventListener("click", () => {
          Array.from(secWrap.children).forEach((c) => c.classList.remove("is-active"));
          b.classList.add("is-active");
          listWrap.innerHTML = "";
          (sections[sec] || []).forEach((ini) => {
            const ib = document.createElement("button");
            ib.type = "button";
            ib.className = "ewl-supports-selfpick-ini";
            ib.textContent = ini;
            ib.addEventListener("click", () => done({ section: sec, initials: ini }));
            listWrap.appendChild(ib);
          });
        });
        secWrap.appendChild(b);
      });

      const skip = document.createElement("button");
      skip.type = "button";
      skip.className = "ewl-supports-selfpick-skip";
      skip.textContent = "I'm not on the list — skip";
      skip.addEventListener("click", () => done({ skipped: true }));
      card.appendChild(skip);

      back.appendChild(card);
      document.body.appendChild(back);
    });
  }

  // ---- Student boot: resolve identity -> fetch assignment -> apply ---------
  async function v2StudentBoot(schema) {
    let me = v2GetMe();
    if (!me) {
      me = await v2PromptSelfPick();
      if (me) v2SetMe(me);
    }
    if (!me || me.skipped) {
      applyAssignedItems([]);
      return;
    }
    const cached = v2GetCached(me.section, me.initials);
    if (cached && schema) {
      applyAssignedItems(schema.resolveItems(cached.widaLevel, cached.iepItems));
    }
    const fresh = await v2FetchJSON(
      "/for?section=" +
        encodeURIComponent(me.section) +
        "&initials=" +
        encodeURIComponent(me.initials),
    );
    if (fresh && fresh.ok) {
      v2SetCached(me.section, me.initials, {
        widaLevel: fresh.widaLevel,
        iepItems: fresh.iepItems,
      });
      applyAssignedItems(schema ? schema.resolveItems(fresh.widaLevel, fresh.iepItems) : []);
    } else if (!cached) {
      applyAssignedItems([]);
    }
  }

  async function bootSupportsV2() {
    const schema = await loadSupportsSchema();
    if (isTeacherMode()) return; // teachers assign via the dialog, below
    await v2StudentBoot(schema);
  }

  // ---- Teacher assignment surface (built into the dialog on open) ----------
  let v2AssignState = { section: "601", initials: "", roster: {} };

  function ensureAssignmentUI() {
    if (!isTeacherMode()) return;
    const root = document.getElementById("ewl-supports-assign-root");
    if (!root) return;
    loadSupportsSchema().then((schema) => buildAssignmentUI(root, schema));
  }

  async function buildAssignmentUI(root, schema) {
    if (!schema) {
      root.textContent = "Learning supports taxonomy failed to load. Reload the page.";
      return;
    }
    root.innerHTML = "";

    // Teacher key (needed to save). Prefill from localStorage.
    const keyRow = document.createElement("div");
    keyRow.className = "ewl-supports-assign-keyrow";
    const keyLabel = document.createElement("label");
    keyLabel.textContent = "Teacher key ";
    const keyInput = document.createElement("input");
    keyInput.type = "password";
    keyInput.className = "ewl-supports-assign-key";
    keyInput.value = v2TeacherKey();
    keyInput.placeholder = "required to save";
    keyInput.addEventListener("change", () => {
      try {
        localStorage.setItem(V2_TEACHER_KEY_LS, keyInput.value.trim());
      } catch (_e) {
        /* ignore */
      }
    });
    keyLabel.appendChild(keyInput);
    keyRow.appendChild(keyLabel);
    const consoleLink = document.createElement("a");
    consoleLink.href = "/teacher-tools/learning-supports-manager/";
    consoleLink.target = "_blank";
    consoleLink.rel = "noopener";
    consoleLink.className = "ewl-supports-assign-consolelink";
    consoleLink.textContent = "Open full Supports Manager →";
    keyRow.appendChild(consoleLink);
    root.appendChild(keyRow);

    // Home-language selector for the bilingual Words panel / read-aloud (device
    // level, mirrors the legacy dialog select so ESOL display language survives).
    const langRow = document.createElement("div");
    langRow.className = "ewl-supports-assign-wida";
    const langLabel = document.createElement("label");
    langLabel.textContent = "Home language (ESOL) ";
    const langSel = document.createElement("select");
    langSel.id = "ewl-lang-select";
    [
      { code: "en", name: "English" },
      { code: "es", name: "Español (Spanish)" },
      { code: "vi", name: "Tiếng Việt (Vietnamese)" },
      { code: "ar", name: "العربية (Arabic)" },
    ].forEach((l) => {
      const o = document.createElement("option");
      o.value = l.code;
      o.textContent = l.name;
      if (l.code === activeLanguage) o.selected = true;
      langSel.appendChild(o);
    });
    langSel.addEventListener("change", (e) => {
      activeLanguage = e.target.value;
      saveStoredPreferences();
      updatePanelContent();
    });
    langLabel.appendChild(langSel);
    langRow.appendChild(langLabel);
    root.appendChild(langRow);

    // Section tabs (601/602/603).
    const secRow = document.createElement("div");
    secRow.className = "ewl-supports-assign-secrow";
    schema.sections.forEach((sec) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ewl-supports-assign-sec" + (sec === v2AssignState.section ? " is-active" : "");
      b.textContent = sec;
      b.addEventListener("click", () => {
        v2AssignState.section = sec;
        v2AssignState.initials = "";
        buildAssignmentUI(root, schema);
      });
      secRow.appendChild(b);
    });
    root.appendChild(secRow);

    // Student row: initials select + add + remove.
    const roster = await v2FetchJSON(
      "/roster?section=" + encodeURIComponent(v2AssignState.section),
      {
        headers: { "x-teacher-key": v2TeacherKey() },
      },
    );
    const entries = (roster && roster.roster) || [];
    v2AssignState.roster = {};
    entries.forEach((e) => {
      v2AssignState.roster[e.initials] = e;
    });

    const stuRow = document.createElement("div");
    stuRow.className = "ewl-supports-assign-sturow";
    const sel = document.createElement("select");
    sel.className = "ewl-supports-assign-student";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = entries.length ? "Choose a student…" : "No students yet — add one →";
    sel.appendChild(ph);
    entries.forEach((e) => {
      const o = document.createElement("option");
      o.value = e.initials;
      o.textContent = e.initials;
      if (e.initials === v2AssignState.initials) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => {
      v2AssignState.initials = sel.value;
      buildAssignmentUI(root, schema);
    });
    stuRow.appendChild(sel);

    const addInput = document.createElement("input");
    addInput.type = "text";
    addInput.maxLength = 6;
    addInput.placeholder = "Add initials";
    addInput.className = "ewl-supports-assign-add";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "ewl-supports-btn-action";
    addBtn.textContent = "＋ Add";
    addBtn.addEventListener("click", async () => {
      const ini = (addInput.value || "").trim().toUpperCase().slice(0, 6);
      if (!ini) return;
      await v2SaveEntry(v2AssignState.section, ini, 0, []);
      v2AssignState.initials = ini;
      buildAssignmentUI(root, schema);
    });
    stuRow.appendChild(addInput);
    stuRow.appendChild(addBtn);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "ewl-supports-btn-action ewl-supports-btn-reset";
    delBtn.textContent = "🗑 Remove";
    delBtn.addEventListener("click", async () => {
      if (!v2AssignState.initials) return;
      await v2FetchJSON("/roster", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-teacher-key": v2TeacherKey() },
        body: JSON.stringify({ section: v2AssignState.section, initials: v2AssignState.initials }),
      });
      v2AssignState.initials = "";
      buildAssignmentUI(root, schema);
    });
    stuRow.appendChild(delBtn);
    root.appendChild(stuRow);

    if (!v2AssignState.initials) return; // nothing selected — stop here

    const current = v2AssignState.roster[v2AssignState.initials] || {
      widaLevel: 0,
      iepItems: [],
    };

    // WIDA level select.
    const widaRow = document.createElement("div");
    widaRow.className = "ewl-supports-assign-wida";
    const widaLabel = document.createElement("label");
    widaLabel.textContent = "WIDA / ESOL level ";
    const widaSel = document.createElement("select");
    const noneOpt = document.createElement("option");
    noneOpt.value = "0";
    noneOpt.textContent = "0 — None";
    widaSel.appendChild(noneOpt);
    schema.widaLevels.forEach((w) => {
      const o = document.createElement("option");
      o.value = String(w.level);
      o.textContent = w.level + " — " + w.name;
      widaSel.appendChild(o);
    });
    widaSel.value = String(current.widaLevel || 0);
    widaLabel.appendChild(widaSel);
    widaRow.appendChild(widaLabel);
    root.appendChild(widaRow);

    // IEP grouped checkboxes.
    const groupsWrap = document.createElement("div");
    groupsWrap.className = "ewl-supports-assign-groups";
    const checkboxes = {};
    function renderGroups() {
      groupsWrap.innerHTML = "";
      const widaSet = Object.create(null);
      schema.widaItems(Number(widaSel.value)).forEach((k) => {
        widaSet[k] = true;
      });
      schema.groups.forEach((g) => {
        const fs = document.createElement("fieldset");
        fs.className = "ewl-supports-assign-group";
        const lg = document.createElement("legend");
        lg.textContent = (g.icon ? g.icon + " " : "") + g.label;
        fs.appendChild(lg);
        g.items.forEach((it) => {
          const lbl = document.createElement("label");
          lbl.className = "ewl-supports-assign-item";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.value = it.key;
          const fromWida = !!widaSet[it.key];
          const checkedExplicit = (current.iepItems || []).indexOf(it.key) !== -1;
          cb.checked = fromWida || checkedExplicit;
          cb.disabled = fromWida; // WIDA bundle is locked on; extra IEP items on top
          checkboxes[it.key] = cb;
          lbl.appendChild(cb);
          const txt = document.createElement("span");
          txt.textContent = " " + it.label + (fromWida ? " (WIDA)" : "");
          lbl.appendChild(txt);
          fs.appendChild(lbl);
        });
        groupsWrap.appendChild(fs);
      });
    }
    widaSel.addEventListener("change", renderGroups);
    renderGroups();
    root.appendChild(groupsWrap);

    // Actions.
    function collect() {
      const level = Number(widaSel.value) || 0;
      const widaSet = Object.create(null);
      schema.widaItems(level).forEach((k) => {
        widaSet[k] = true;
      });
      const iep = [];
      Object.keys(checkboxes).forEach((k) => {
        if (checkboxes[k].checked && !widaSet[k] && schema.isValidKey(k)) iep.push(k);
      });
      return { level, iep, resolved: schema.resolveItems(level, iep) };
    }

    const actions = document.createElement("div");
    actions.className = "ewl-supports-assign-actions";
    const status = document.createElement("span");
    status.className = "ewl-supports-assign-status";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "ewl-supports-btn-action";
    previewBtn.textContent = "👁 Preview on screen";
    previewBtn.addEventListener("click", () => {
      const c = collect();
      applyAssignedItems(c.resolved);
      v2SyncBridgeProfiles(c.resolved);
      status.textContent = "Previewing " + v2AssignState.initials;
    });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "ewl-supports-btn-action ewl-supports-btn-copy";
    saveBtn.textContent = "💾 Save for " + v2AssignState.initials;
    saveBtn.addEventListener("click", async () => {
      const c = collect();
      const ok = await v2SaveEntry(v2AssignState.section, v2AssignState.initials, c.level, c.iep);
      status.textContent = ok
        ? "Saved ✓ — syncs to every lesson"
        : "Save failed — check the teacher key";
      if (ok) {
        v2AssignState.roster[v2AssignState.initials] = {
          initials: v2AssignState.initials,
          widaLevel: c.level,
          iepItems: c.iep,
        };
      }
    });

    actions.appendChild(previewBtn);
    actions.appendChild(saveBtn);
    actions.appendChild(status);
    root.appendChild(actions);
  }

  async function v2SaveEntry(section, initials, widaLevel, iepItems) {
    const res = await v2FetchJSON("/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-teacher-key": v2TeacherKey() },
      body: JSON.stringify({
        entries: [{ section, initials, widaLevel, iepItems }],
      }),
    });
    return !!(res && res.ok);
  }

  const EWLLearningSupports = {
    version: "2.0.0",
    init,
    destroy,
    parseSettings,
    serializeSettings,
    applyAssignedItems,
  };

  window.EWLLearningSupports = EWLLearningSupports;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

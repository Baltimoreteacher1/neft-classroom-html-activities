(function () {
  "use strict";

  // Prevent multiple executions
  if (window.EWLLearningSupports) return;

  const STORAGE_KEY = "ewl-supports:v1:preferences";

  const PROFILE_KEYS = [
    "read-understand",
    "focus-organize",
    "build-math",
    "express-thinking",
    "language-support",
    "challenge-extend",
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
        "Provides vocabulary, worked examples, and text-to-speech to support comprehension.",
      "focus-organize": "Reduces visual clutter and enables focus tools to support concentration.",
      "build-math":
        "Links to prerequisite foundations and readiness checks for background knowledge.",
      "express-thinking": "Provides discourse sentence frames, response stems, and word banks.",
      "language-support":
        "Provides bilingual terminology, translations, and multilingual visual aids.",
      "challenge-extend":
        "Provides advanced concepts, error analysis challenges, and extension tasks.",
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
  let rootEl = null;
  let activeSpeechUtterance = null;

  // Initialize profiles to false
  PROFILE_KEYS.forEach((k) => {
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
        };
      }
      return null;
    } catch (_e) {
      console.warn("Learning supports: LocalStorage access blocked or unavailable.");
      return null;
    }
  }

  function saveStoredPreferences(pref) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    } catch (_e) {
      console.warn("Learning supports: Failed to save preferences to LocalStorage.");
    }
  }

  // Parse hash/query parameter
  function parseSettings(str) {
    const settings = {};
    PROFILE_KEYS.forEach((k) => {
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
        if (PROFILE_KEYS.includes(trimmed)) {
          settings[trimmed] = true;
        }
      });
    }

    return settings;
  }

  function serializeSettings(settings) {
    return PROFILE_KEYS.filter((k) => settings[k]).join(",");
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

    try {
      const res = await fetch("/assets/learning-supports/manifest.json");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      manifestData = data[activeLessonId];
      if (!manifestData) {
        console.warn(`Learning supports: No manifest data for lesson ${activeLessonId}. Skipping.`);
        return;
      }
    } catch (e) {
      console.error("Learning supports: Failed to load manifest.", e);
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

    const hasUrlActive = settings && Object.values(settings).some(Boolean);
    if (hasUrlActive) {
      activeProfiles = settings;
      saveStoredPreferences({
        profiles: activeProfiles,
        language: activeLanguage,
        speechRate: activeSpeechRate,
      });
    } else {
      const stored = getStoredPreferences();
      if (stored) {
        if (stored.profiles) {
          PROFILE_KEYS.forEach((k) => {
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
      }
    }

    // Render components
    renderInterface();
    updateUIStates();
  }

  function renderInterface() {
    if (document.querySelector("[data-ewl-supports-root]")) return;

    rootEl = document.createElement("div");
    rootEl.setAttribute("data-ewl-supports-root", "1");
    rootEl.className = "ewl-supports-root";

    // 0. Visual Focus Reading Ruler
    const ruler = document.createElement("div");
    ruler.id = "ewl-supports-ruler";
    ruler.className = "ewl-supports-ruler";
    rootEl.appendChild(ruler);

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
    rootEl.appendChild(teacherPanel);

    // 2. Prepare Supports Configuration Dialog
    const dialog = document.createElement("div");
    dialog.id = "ewl-supports-dialog";
    dialog.setAttribute("data-ewl-supports-dialog", "1");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "Prepare Supports Configuration");
    dialog.className = "ewl-supports-dialog";
    dialog.hidden = true;

    // Dialog Header
    const dialogHeader = document.createElement("div");
    dialogHeader.className = "ewl-supports-dialog-header";
    const dialogTitle = document.createElement("h2");
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
    explainer.className = "ewl-supports-dialog-intro";
    explainer.textContent =
      "Activate accessibility profiles to support student learning without lowering standards. No student data or IEP details are stored.";
    dialogBody.appendChild(explainer);

    // Checkbox list
    const form = document.createElement("form");
    form.className = "ewl-supports-dialog-form";
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
        langSelect.id = "ewl-lang-select";
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

    actionsPanel.appendChild(copyBtn);
    actionsPanel.appendChild(resetBtn);
    dialogBody.appendChild(actionsPanel);

    dialog.appendChild(dialogBody);
    rootEl.appendChild(dialog);

    // 3. Student Tools Dock (Floating Action Buttons Capsule)
    const studentTools = document.createElement("div");
    studentTools.setAttribute("data-ewl-supports-tools", "1");
    studentTools.className = "ewl-supports-tools-dock";
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
    rootEl.appendChild(studentTools);

    // 4. Slide-out Content Panel
    const contentPanel = document.createElement("div");
    contentPanel.setAttribute("data-ewl-supports-panel", "1");
    contentPanel.className = "ewl-supports-content-panel";
    contentPanel.hidden = true;

    const panelHeader = document.createElement("div");
    panelHeader.className = "ewl-supports-panel-header";
    const panelTitle = document.createElement("h3");
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
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      const dialog = document.querySelector("[data-ewl-supports-dialog]");
      if (dialog && !dialog.hidden) {
        showDialog(false);
        const trigger = document.querySelector(".ewl-supports-btn-teacher");
        if (trigger) trigger.focus();
        return;
      }
      const panel = document.querySelector("[data-ewl-supports-panel]");
      if (panel && !panel.hidden) {
        closePanel();
      }
    }
  }

  function showDialog(show) {
    const dialog = document.querySelector("[data-ewl-supports-dialog]");
    if (!dialog) return;
    dialog.hidden = !show;
    if (show) {
      dialog.classList.add("is-visible");
      const firstCheck = dialog.querySelector("input");
      if (firstCheck) firstCheck.focus();
    } else {
      dialog.classList.remove("is-visible");
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
      const checkinBtn = toolsDock.querySelector('[data-tool="checkin"]');
      const listenBtn = toolsDock.querySelector('[data-tool="listen"]');

      if (wordsBtn)
        wordsBtn.style.display =
          activeProfiles["read-understand"] || activeProfiles["language-support"]
            ? "inline-flex"
            : "none";
      if (exampleBtn)
        exampleBtn.style.display = activeProfiles["read-understand"] ? "inline-flex" : "none";
      if (modelBtn) modelBtn.style.display = activeProfiles["build-math"] ? "inline-flex" : "none";
      if (explainBtn)
        explainBtn.style.display = activeProfiles["express-thinking"] ? "inline-flex" : "none";
      if (focusBtn)
        focusBtn.style.display = activeProfiles["focus-organize"] ? "inline-flex" : "none";
      if (rulerBtn)
        rulerBtn.style.display = activeProfiles["focus-organize"] ? "inline-flex" : "none";
      if (checkinBtn) checkinBtn.style.display = "inline-flex"; // always display check-in for self-regulation
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
    } else {
      toolsDock.hidden = true;
      closePanel();
      document.body.classList.remove("ewl-supports-focus-active");
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

          dt.textContent = displayTerm;

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
    }

    const toolsDock = document.querySelector("[data-ewl-supports-tools]");
    if (toolsDock) {
      toolsDock.querySelectorAll(".ewl-supports-tool-btn").forEach((btn) => {
        const tool = btn.getAttribute("data-tool");
        btn.setAttribute("aria-pressed", String(tool === tab));
      });
    }
  }

  function updatePanelContent() {
    if (activePanelTab) {
      const tab = activePanelTab;
      activePanelTab = null;
      togglePanel(tab);
    }
  }

  function closePanel() {
    const panel = document.querySelector("[data-ewl-supports-panel]");
    if (panel) {
      panel.hidden = true;
      panel.classList.remove("is-visible");
    }
    activePanelTab = null;

    const toolsDock = document.querySelector("[data-ewl-supports-tools]");
    if (toolsDock) {
      toolsDock.querySelectorAll(".ewl-supports-tool-btn").forEach((btn) => {
        const tool = btn.getAttribute("data-tool");
        if (tool !== "focus" && tool !== "listen" && tool !== "rate" && tool !== "ruler") {
          btn.setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  // Reversible Focus Mode
  function toggleFocusMode(e) {
    const active = document.body.classList.toggle("ewl-supports-focus-active");
    const btn = e.target;
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
    const btn = e.target;
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

  // Listen (Text to speech) mode
  function toggleListenMode(e) {
    const btn = e.target;
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

    window.speechSynthesis.speak(activeSpeechUtterance);
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    activeSpeechUtterance = null;
  }

  // Copy Personalized Link
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

    navigator.clipboard
      .writeText(url.href)
      .then(() => {
        const origText = btn.textContent;
        btn.textContent = "✓ Copied!";
        setTimeout(() => {
          btn.textContent = origText;
        }, 1500);
      })
      .catch((e) => {
        console.error("Failed to copy link.", e);
      });
  }

  // Reset supports
  function resetAllSupports() {
    PROFILE_KEYS.forEach((k) => {
      activeProfiles[k] = false;
    });
    activeLanguage = "en";
    activeSpeechRate = 1.0;

    saveStoredPreferences({
      profiles: activeProfiles,
      language: activeLanguage,
      speechRate: activeSpeechRate,
    });

    document.body.classList.remove("ewl-supports-focus-active");

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
  }

  // Reversible clean up
  function destroy() {
    if (!initialized) return;

    document.body.classList.remove("ewl-supports-focus-active");

    // Reset ruler
    rulerActive = false;
    const ruler = document.getElementById("ewl-supports-ruler");
    if (ruler) ruler.classList.remove("is-active");
    window.removeEventListener("mousemove", updateRulerPosition);
    window.removeEventListener("touchmove", updateRulerTouchPosition);

    stopSpeaking();

    document.removeEventListener("keydown", handleKeydown);

    if (rootEl && rootEl.parentNode) {
      rootEl.parentNode.removeChild(rootEl);
    }
    rootEl = null;

    initialized = false;
    manifestData = null;
    activeLessonId = null;
  }

  const EWLLearningSupports = {
    version: "1.2.0",
    init,
    destroy,
    parseSettings,
    serializeSettings,
  };

  window.EWLLearningSupports = EWLLearningSupports;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

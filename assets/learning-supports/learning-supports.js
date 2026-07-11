(function () {
  const PROFILE_KEYS = [
    "read-understand",
    "focus-organize",
    "build-math",
    "express-thinking",
    "language-support",
    "challenge-extend",
  ];

  const STORAGE_KEY = "ewl-supports:v1:preferences";

  function getProfileDisplayName(key) {
    const names = {
      "read-understand": "Read & Understand",
      "focus-organize": "Focus & Organize",
      "build-math": "Build Mathematical Models",
      "express-thinking": "Express Math Thinking",
      "language-support": "Language Support (ESOL)",
      "challenge-extend": "Challenge & Extend"
    };
    return names[key] || key;
  }

  function getProfileDescription(key) {
    const descs = {
      "read-understand": "Provides vocabulary, worked examples, and text-to-speech to support comprehension.",
      "focus-organize": "Reduces visual clutter and enables focus tools to support concentration.",
      "build-math": "Links to prerequisite foundations and readiness checks for background knowledge.",
      "express-thinking": "Provides discourse sentence frames, response stems, and word banks.",
      "language-support": "Provides bilingual terminology, translations, and multilingual visual aids.",
      "challenge-extend": "Provides advanced concepts, error analysis challenges, and extension tasks."
    };
    return descs[key] || "";
  }

  // State
  let initialized = false;
  let activeLessonId = null;
  let manifestData = null;
  let activeProfiles = {};
  let rootEl = null;
  let activeSpeechUtterance = null;

  // Initialize profiles to false
  PROFILE_KEYS.forEach(k => { activeProfiles[k] = false; });

  // Safe localStorage helper
  function getStoredPreferences() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.warn("Learning supports: LocalStorage access blocked or unavailable.");
      return null;
    }
  }

  function saveStoredPreferences(pref) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    } catch (e) {
      console.warn("Learning supports: Failed to save preferences to LocalStorage.");
    }
  }

  // Parse hash/query parameter
  function parseSettings(str) {
    const settings = {};
    PROFILE_KEYS.forEach(k => { settings[k] = false; });
    if (!str) return settings;

    // Supports format: supports=read-understand,focus-organize or comma-separated lists
    const cleanStr = str.replace(/^[#?]/, "");
    const parts = cleanStr.split("&");
    let listStr = "";

    // Check for query param supports=...
    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k === "supports" && v) {
        listStr = decodeURIComponent(v);
        break;
      }
    }

    // Fallback: if the whole string is just a list of comma-separated profiles
    if (!listStr && !cleanStr.includes("=")) {
      listStr = cleanStr;
    }

    if (listStr) {
      listStr.split(",").forEach(item => {
        const trimmed = item.trim();
        if (PROFILE_KEYS.includes(trimmed)) {
          settings[trimmed] = true;
        }
      });
    }

    return settings;
  }

  function serializeSettings(settings) {
    return PROFILE_KEYS.filter(k => settings[k]).join(",");
  }

  // Idempotent initialization
  async function init() {
    if (initialized) return;

    // Get lesson ID from html attribute
    const htmlEl = document.documentElement;
    activeLessonId = htmlEl.getAttribute("data-ewl-supports-lesson");
    if (!activeLessonId) {
      console.log("Learning supports: No data-ewl-supports-lesson found. Skipping.");
      return;
    }

    // Fetch manifest data
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

    // If URL settings were parsed and have at least one active profile, use them and save.
    // Otherwise, load from LocalStorage.
    const hasUrlActive = settings && Object.values(settings).some(Boolean);
    if (hasUrlActive) {
      activeProfiles = settings;
      saveStoredPreferences(activeProfiles);
    } else {
      const stored = getStoredPreferences();
      if (stored) {
        PROFILE_KEYS.forEach(k => {
          if (typeof stored[k] === "boolean") {
            activeProfiles[k] = stored[k];
          }
        });
      }
    }

    // Render components
    renderInterface();
    updateUIStates();
  }

  function renderInterface() {
    // Prevent duplicates
    if (document.querySelector("[data-ewl-supports-root]")) return;

    rootEl = document.createElement("div");
    rootEl.setAttribute("data-ewl-supports-root", "1");
    rootEl.className = "ewl-supports-root";

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

    // Explainer
    const explainer = document.createElement("p");
    explainer.className = "ewl-supports-dialog-intro";
    explainer.textContent = "Activate accessibility profiles to support student learning without lowering standards. No student data or IEP details are stored.";
    dialogBody.appendChild(explainer);

    // Checkbox list
    const form = document.createElement("form");
    form.className = "ewl-supports-dialog-form";
    form.addEventListener("submit", (e) => e.preventDefault());

    PROFILE_KEYS.forEach(key => {
      const row = document.createElement("div");
      row.className = "ewl-supports-checkbox-row";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `ewl-profile-${key}`;
      checkbox.checked = activeProfiles[key];
      checkbox.className = "ewl-supports-checkbox";
      checkbox.addEventListener("change", (e) => {
        activeProfiles[key] = e.target.checked;
        saveStoredPreferences(activeProfiles);
        updateUIStates();
      });

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
      row.appendChild(checkbox);
      row.appendChild(label);
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

    // 3. Student Tools Dock (Floating Action Buttons)
    const studentTools = document.createElement("div");
    studentTools.setAttribute("data-ewl-supports-tools", "1");
    studentTools.className = "ewl-supports-tools-dock";
    studentTools.hidden = true;

    // Inner Toolbar Buttons
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

    // Listen TTS Trigger
    const listenBtn = document.createElement("button");
    listenBtn.className = "ewl-supports-tool-btn";
    listenBtn.setAttribute("data-tool", "listen");
    listenBtn.textContent = "🔊 Listen";
    listenBtn.addEventListener("click", toggleListenMode);
    toolsInner.appendChild(listenBtn);

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

    // Handle Escape key to close dialog or panel
    document.addEventListener("keydown", handleKeydown);
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      const dialog = document.querySelector("[data-ewl-supports-dialog]");
      if (dialog && !dialog.hidden) {
        showDialog(false);
        // Return focus to trigger button
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
      // Trap focus or focus on first element
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

    // Checkboxes sync
    PROFILE_KEYS.forEach(key => {
      const checkbox = document.getElementById(`ewl-profile-${key}`);
      if (checkbox) checkbox.checked = activeProfiles[key];
    });

    if (hasAnyActive) {
      toolsDock.hidden = false;
      // Show/hide specific tool buttons depending on active profiles
      const wordsBtn = toolsDock.querySelector('[data-tool="words"]');
      const exampleBtn = toolsDock.querySelector('[data-tool="example"]');
      const modelBtn = toolsDock.querySelector('[data-tool="model"]');
      const explainBtn = toolsDock.querySelector('[data-tool="explain"]');
      const focusBtn = toolsDock.querySelector('[data-tool="focus"]');
      const listenBtn = toolsDock.querySelector('[data-tool="listen"]');

      // Visibility conditions
      if (wordsBtn) wordsBtn.style.display = (activeProfiles["read-understand"] || activeProfiles["language-support"]) ? "inline-flex" : "none";
      if (exampleBtn) exampleBtn.style.display = activeProfiles["read-understand"] ? "inline-flex" : "none";
      if (modelBtn) modelBtn.style.display = activeProfiles["build-math"] ? "inline-flex" : "none";
      if (explainBtn) explainBtn.style.display = activeProfiles["express-thinking"] ? "inline-flex" : "none";
      if (focusBtn) focusBtn.style.display = activeProfiles["focus-organize"] ? "inline-flex" : "none";
      if (listenBtn) listenBtn.style.display = (activeProfiles["read-understand"] || activeProfiles["language-support"]) ? "inline-flex" : "none";
    } else {
      toolsDock.hidden = true;
      closePanel();
      // Remove focus mode classes if all supports turned off
      document.body.classList.remove("ewl-supports-focus-active");
      const focusBtn = toolsDock.querySelector('[data-tool="focus"]');
      if (focusBtn) focusBtn.classList.remove("is-active");
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

    // Populate panel details based on manifest
    const titleEl = panel.querySelector(".ewl-supports-panel-title");
    const bodyEl = panel.querySelector(".ewl-supports-panel-body");

    // Clear body safely
    bodyEl.textContent = "";

    if (tab === "words") {
      titleEl.textContent = "Vocabulary Helper";
      const isSpanish = activeProfiles["language-support"];

      if (!manifestData.vocabulary || manifestData.vocabulary.length === 0) {
        const fallback = document.createElement("p");
        fallback.textContent = "No glossary entries available for this lesson.";
        bodyEl.appendChild(fallback);
      } else {
        const list = document.createElement("dl");
        list.className = "ewl-supports-vocab-list";

        manifestData.vocabulary.forEach(v => {
          const dt = document.createElement("dt");
          dt.className = "ewl-supports-vocab-term";
          
          if (isSpanish && v.termEs) {
            dt.textContent = `${v.term} (${v.termEs})`;
          } else {
            dt.textContent = v.term;
          }

          const dd = document.createElement("dd");
          dd.className = "ewl-supports-vocab-definition";
          dd.textContent = (isSpanish && v.definitionEs) ? v.definitionEs : v.definition;

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
      desc.textContent = "Prepare your math foundations with the readiness warm-up or virtual manipulatives.";
      bodyEl.appendChild(desc);

      const readinessLink = document.createElement("a");
      readinessLink.href = manifestData.readinessHref || `/lessons/${activeLessonId}/readiness/`;
      readinessLink.className = "ewl-supports-link-model";
      readinessLink.textContent = "📚 Open Readiness pre-lesson";
      bodyEl.appendChild(readinessLink);
    } else if (tab === "explain") {
      titleEl.textContent = "Sentence Frames & Stems";
      const desc = document.createElement("p");
      desc.textContent = "Use these stems to frame your mathematical discourse and written explanations.";
      bodyEl.appendChild(desc);

      // Sentence frames list
      if (manifestData.sentenceFrames && manifestData.sentenceFrames.length > 0) {
        const frameTitle = document.createElement("h4");
        frameTitle.textContent = "Sentence Frames";
        bodyEl.appendChild(frameTitle);

        const list = document.createElement("ul");
        manifestData.sentenceFrames.forEach(f => {
          const item = document.createElement("li");
          item.textContent = f;
          list.appendChild(item);
        });
        bodyEl.appendChild(list);
      }

      // Word bank list
      if (manifestData.wordBank && manifestData.wordBank.length > 0) {
        const bankTitle = document.createElement("h4");
        bankTitle.textContent = "Word Bank";
        bodyEl.appendChild(bankTitle);

        const bankContainer = document.createElement("div");
        bankContainer.className = "ewl-supports-word-bank";
        manifestData.wordBank.forEach(word => {
          const chip = document.createElement("span");
          chip.className = "ewl-supports-word-chip";
          chip.textContent = word;
          bankContainer.appendChild(chip);
        });
        bodyEl.appendChild(bankContainer);
      }
    }

    // Set aria-pressed on tool buttons
    const toolsDock = document.querySelector("[data-ewl-supports-tools]");
    if (toolsDock) {
      toolsDock.querySelectorAll(".ewl-supports-tool-btn").forEach(btn => {
        const tool = btn.getAttribute("data-tool");
        btn.setAttribute("aria-pressed", String(tool === tab));
      });
    }
  }

  function closePanel() {
    const panel = document.querySelector("[data-ewl-supports-panel]");
    if (panel) {
      panel.hidden = true;
      panel.classList.remove("is-visible");
    }
    activePanelTab = null;

    // Reset button states
    const toolsDock = document.querySelector("[data-ewl-supports-tools]");
    if (toolsDock) {
      toolsDock.querySelectorAll(".ewl-supports-tool-btn").forEach(btn => {
        if (btn.getAttribute("data-tool") !== "focus" && btn.getAttribute("data-tool") !== "listen") {
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

    // Stop current speech first
    stopSpeaking();

    // Prepare text to read: Content Objective and Language Objective, then Vocabulary terms
    let text = "";
    if (manifestData.contentObjective) text += `Today's objective. ${manifestData.contentObjective}. `;
    if (manifestData.languageObjective) text += `Language objective. ${manifestData.languageObjective}. `;
    if (manifestData.vocabulary && manifestData.vocabulary.length > 0) {
      text += "Key vocabulary terms. ";
      manifestData.vocabulary.forEach(v => {
        text += `${v.term}. Definition. ${v.definition}. `;
      });
    }

    activeSpeechUtterance = new SpeechSynthesisUtterance(text);
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

    // Verification step: ensure no PII exists in hash
    const piiMatch = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(url.href) || 
                     url.href.includes("studentName") || 
                     url.href.includes("studentId");
    if (piiMatch) {
      console.error("Personalized link generation aborted due to possible PII detection.");
      return;
    }

    navigator.clipboard.writeText(url.href)
      .then(() => {
        const origText = btn.textContent;
        btn.textContent = "✓ Copied!";
        setTimeout(() => {
          btn.textContent = origText;
        }, 1500);
      })
      .catch(e => {
        console.error("Failed to copy link.", e);
      });
  }

  // Reset supports
  function resetAllSupports() {
    // Clear selections
    PROFILE_KEYS.forEach(k => { activeProfiles[k] = false; });
    saveStoredPreferences(activeProfiles);

    // Reset layout classes
    document.body.classList.remove("ewl-supports-focus-active");

    // Stop speaking
    stopSpeaking();

    // Reset checkbox state
    PROFILE_KEYS.forEach(key => {
      const checkbox = document.getElementById(`ewl-profile-${key}`);
      if (checkbox) checkbox.checked = false;
    });

    // Close components
    updateUIStates();
  }

  // Reversible clean up
  function destroy() {
    if (!initialized) return;

    // Reset focus styles
    document.body.classList.remove("ewl-supports-focus-active");

    // Stop TTS
    stopSpeaking();

    // Remove event listener
    document.removeEventListener("keydown", handleKeydown);

    // Remove root element
    if (rootEl && rootEl.parentNode) {
      rootEl.parentNode.removeChild(rootEl);
    }
    rootEl = null;

    initialized = false;
    manifestData = null;
    activeLessonId = null;
  }

  // Global namespace exports
  const EWLLearningSupports = {
    version: "1.0.0",
    init,
    destroy,
    parseSettings,
    serializeSettings,
  };

  // Expose to window globally
  window.EWLLearningSupports = EWLLearningSupports;

  // Auto-init on script load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

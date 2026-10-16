/* Page reading preferences and teaching-tool overview. No student data is stored. */
(function () {
  "use strict";

  const preferenceKey = "curriculumReadingPreferences:v1";
  const menu = document.getElementById("udlMenuPopover");
  const launcher = document.getElementById("udlFloatingLauncher");
  const dialog = /** @type {HTMLDialogElement | null} */ (
    document.getElementById("awardShowcaseOverlay")
  );
  /** @type {Element | null} */
  let returnFocus = null;

  // Keep these legacy keys so existing teaching-overview links remain compatible.
  /** @type {Record<string, {icon: string, tab: string, title: string, sub: string, html: string}>} */
  const details = {
    codie: {
      icon: "🏆",
      tab: "Gateway 1–3 & CODiE",
      title: "Focus, Coherence & Rigor (EdReports Gateways 1–3 · SIIA CODiE)",
      sub: "SY26–27 Course 1 Pacing Architecture · 100% MSDE / CCSS-M 6th Grade Alignment",
      html: `
        <div class="hub-dossier-grid">
          <div class="hub-dossier-card">
            <strong>Gateway 1 · Focus &amp; Coherence (1 → 3 → 4 → 6 → 7 → 8 → 9 → 5 → 2 → 10)</strong>
            <p>Major clusters (6.RP.A, 6.NS.A/C, 6.EE.A/B/C) anchor Quarters 1–3 before Geometry (Unit 5) and Statistical Distributions (Unit 2) synthesize numerical fluency in Quarter 4.</p>
          </div>
          <div class="hub-dossier-card">
            <strong>Gateway 2 · Rigor &amp; Balance (Conceptual · Procedural · Application)</strong>
            <p>Every lesson pairs an inquiry launch (<em>Be Curious</em>) with interactive visual proofs, deterministic <em>Practice Studio</em> fluency, and authentic <em>Culminating Unit Projects</em>.</p>
          </div>
          <div class="hub-dossier-card">
            <strong>Gateway 3 · Educator Usability &amp; Zero-PII Architecture</strong>
            <p>1-click Canvas SCORM 1.2 bundles, editable DOCX work packs, and a 6-character local Save Code (<code>NT-XXXXXX</code>) that requires zero student accounts or PII.</p>
          </div>
        </div>
        <p class="hub-dossier-links">
          <a href="/curriculum/units/">Browse All Units &amp; Lessons</a> ·
          <a href="/curriculum/projects/">Culminating Projects</a> ·
          <a href="/curriculum/standards/">Standards Crosswalk</a> ·
          <a href="/curriculum/map/">Prerequisite Coherence Map</a>
        </p>
      `,
    },
    bett: {
      icon: "🔀",
      tab: "Small-Group & Tiered Studio",
      title: "Multi-Tiered Small-Group & Adaptive Routing (Bett Pedagogy)",
      sub: "Exit-Ticket Triage → Group 1 Support, Core Studio & Group 2 Enrichment",
      html: `
        <div class="hub-dossier-grid">
          <div class="hub-dossier-card">
            <strong>🌱 Group 1 (Extra Support Pathway) &amp; Prerequisite Readiness</strong>
            <p>Every lesson includes a dedicated <code>/readiness/</code> warm-up bridge and a <code>-group1</code> interactive pathway with concrete tape/balance scaffolds and sentence frames.</p>
          </div>
          <div class="hub-dossier-card">
            <strong>🎯 Core Studio &amp; Diagnostic Misconception Routing</strong>
            <p><em>Today's Mission</em> Check Yourself diagnoses specific thinking misconceptions (e.g., inverted ratios, additive vs. multiplicative jumps) and routes students to targeted repair chips.</p>
          </div>
          <div class="hub-dossier-card">
            <strong>🚀 Group 2 (Challenge Pathway) &amp; Peer Proof Authoring</strong>
            <p>Students ready for extension tackle multi-constraint modeling in <code>-group2</code> and author visual proofs in <em>Teach the Machine</em>.</p>
          </div>
        </div>
        <p class="hub-dossier-links">
          <a href="/curriculum/units/">Explore Lesson Tiered Pathways</a> ·
          <a href="/curriculum/extra-help/">Targeted Extra Help</a> ·
          <a href="/curriculum/student-launch/">Student Lesson Playlist</a>
        </p>
      `,
    },
    iste: {
      icon: "📐",
      tab: "Visual Models & Agency",
      title: "Synchronized Visual Models & Student Mathematical Agency (ISTE · NCTM)",
      sub: "Concrete-Representational-Abstract (CRA) Sandboxes & Cooperative Proof Building",
      html: `
        <div class="hub-dossier-grid">
          <div class="hub-dossier-card">
            <strong>🧮 Living Math Canvas &amp; Synchronized Representations</strong>
            <p>Students manipulate linked ratio tape diagrams, double number lines, pan balances, and 3-D nets—watching symbolic equations update in real time.</p>
          </div>
          <div class="hub-dossier-card">
            <strong>🤖 Teach the Machine + Interactive Visual Proof Builder</strong>
            <p>Students build an interactive tape, partition, or balance model and write a mathematical defense to cure "Ratio Bot" of common 6th-grade misconceptions.</p>
          </div>
          <div class="hub-dossier-card">
            <strong>🧭 Unit 0 Math Mentor Continuity &amp; Cooperative Class Boss</strong>
            <p>Students choose a historical/diverse Math Mentor in Unit 0 whose thinking moves travel with them into <em>Today's Mission</em> and <em>My Progress &amp; Portfolio</em>.</p>
          </div>
        </div>
        <p class="hub-dossier-links">
          <a href="/curriculum/math-canvas/">Living Math Canvas</a> ·
          <a href="/curriculum/reality-lab/">Math Reality Lab</a> ·
          <a href="/curriculum/teach-the-machine/">Teach the Machine</a> ·
          <a href="/curriculum/class-boss/">Cooperative Class Boss</a> ·
          <a href="/mentor-lab/">Unit 0 Mentor Lab</a>
        </p>
      `,
    },
    udl: {
      icon: "🌍",
      tab: "CAST UDL 3.0 & WIDA",
      title: "Universal Design for Learning (UDL 3.0), WIDA ELD & Family Partnership",
      sub: "Asset-Based Bilingual Scaffolding, Math-Aware Read-Aloud & Diagram-Safe Contrast",
      html: `
        <div class="hub-dossier-grid">
          <div class="hub-dossier-card">
            <strong>🔊 Math-Aware Read-Aloud (EN / ES) &amp; Diagram-Safe High Contrast</strong>
            <p>Built-in Web Speech synthesis verbalizes mathematical notation (ratios, exponents, inequalities) in English and Spanish while preserving color-coded SVG/Canvas diagrams.</p>
          </div>
          <div class="hub-dossier-card">
            <strong>🌐 WIDA ELD Cognate Bridges &amp; Non-Answer-Leaking Scaffolds</strong>
            <p>Pocket Reference cards, bilingual sentence frames, and cognate spotlights narrow the path without ever giving away the numerical answer.</p>
          </div>
          <div class="hub-dossier-card">
            <strong>🏠 Two-Way Family Math Fridge Guides &amp; Asset-Based Portfolio</strong>
            <p>Every lesson includes a bilingual <code>/family/</code> guide with dinner-table questions, and <em>My Progress</em> celebrates student growth with zero deficit labels or speed pressure.</p>
          </div>
        </div>
        <p class="hub-dossier-links">
          <a href="/esol/">Multilingual &amp; Reading Supports</a> ·
          <a href="/curriculum/family/">Family Math Guides</a> ·
          <a href="/curriculum/my-progress/">My Progress &amp; Portfolio</a>
        </p>
      `,
    },
  };

  /** @param {boolean} restoreFocus */
  function closeMenu(restoreFocus) {
    if (!menu || !launcher) return;
    const wasOpen = launcher.getAttribute("aria-expanded") === "true";
    menu.style.display = "none";
    launcher.setAttribute("aria-expanded", "false");
    if (restoreFocus && wasOpen) launcher.focus();
  }

  /** @param {string} category */
  function openAwardShowcaseModal(category) {
    if (!dialog || typeof dialog.showModal !== "function") return;
    const activeKey = Object.prototype.hasOwnProperty.call(details, category) ? category : "codie";
    const detail = details[activeKey];
    returnFocus = document.activeElement;
    closeMenu(false);
    /** @type {Record<string, string>} */
    const values = {
      awardModalIcon: detail.icon,
      awardModalTitle: detail.title,
      awardModalSubtitle: detail.sub,
    };
    Object.keys(values).forEach(function (id) {
      const node = document.getElementById(id);
      if (node) node.textContent = values[id];
    });
    const body = document.getElementById("awardModalBody");
    if (body) {
      const tabsHtml = Object.keys(details)
        .map(function (key) {
          const item = details[key];
          const isCurrent = key === activeKey;
          return `<button type="button" class="hub-dossier-tab${isCurrent ? " is-active" : ""}" aria-pressed="${isCurrent}" onclick="openAwardShowcaseModal('${key}')">${item.icon} ${item.tab}</button>`;
        })
        .join("");
      body.innerHTML = `<div class="hub-dossier-tabs" role="toolbar" aria-label="Evidence Dossier Sections">${tabsHtml}</div>${detail.html}`;
    }
    if (!dialog.open) dialog.showModal();
    const title = document.getElementById("awardModalTitle");
    if (title) {
      title.tabIndex = -1;
      title.focus();
    }
  }

  function closeAwardShowcaseModal() {
    if (dialog?.open) dialog.close();
  }

  if (dialog) {
    dialog.setAttribute("closedby", "any");
    dialog.addEventListener("close", function () {
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
      returnFocus = null;
    });
    if (!Object.prototype.hasOwnProperty.call(HTMLDialogElement.prototype, "closedBy")) {
      dialog.addEventListener("click", function (event) {
        if (event.target !== dialog) return;
        const box = dialog.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          dialog.close();
      });
    }
  }

  function toggleUdlMenu() {
    if (!menu || !launcher) return;
    if (launcher.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
      return;
    }
    menu.style.display = "block";
    launcher.setAttribute("aria-expanded", "true");
    /** @type {HTMLElement | null} */ (menu.querySelector("input, button, a[href]"))?.focus();
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && launcher?.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      closeMenu(true);
    }
  });
  document.addEventListener("pointerdown", function (event) {
    if (!(event.target instanceof Node)) return;
    if (!menu?.contains(event.target) && !launcher?.contains(event.target)) closeMenu(false);
  });
  document.addEventListener("focusin", function (event) {
    if (!(event.target instanceof Node)) return;
    if (!menu?.contains(event.target) && !launcher?.contains(event.target)) closeMenu(false);
  });

  // Diagram-safe high contrast preserves SVG/Canvas mathematical representations
  // while maximizing text legibility. Cognate spotlight highlights bilingual bridges.
  const style = document.createElement("style");
  style.textContent = `
    body.hub-readable-font :is(h1,h2,h3,h4,h5,h6,p,li,button,summary,input,select,textarea,label) {
      font-family: "Atkinson Hyperlegible", system-ui, sans-serif !important;
      letter-spacing: 0.012em;
    }
    body.hub-high-contrast,
    body.hub-high-contrast :where(*:not(svg):not(svg *):not(canvas):not(.iv-host):not(.iv-host *)) {
      color: #111827 !important;
      background-color: #fff !important;
      background-image: none !important;
      border-color: #1f2937 !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    body.hub-high-contrast a { text-decoration: underline !important; }
    body.hub-high-contrast :focus-visible { outline: 3px solid #111827 !important; outline-offset: 3px; }
    body.hub-high-contrast :is([aria-selected="true"],[aria-pressed="true"]) { outline: 2px solid #111827; }
    body.hub-high-contrast input { accent-color: #111827; }
    body.hub-cognate-spotlight .hub-es,
    body.hub-cognate-spotlight [lang="es"] {
      background-color: #fef9c3 !important;
      color: #713f12 !important;
      padding: 1px 6px;
      border-radius: 4px;
      border-bottom: 1.5px dashed #ca8a04;
    }
    .hub-dossier-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0 0 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .hub-dossier-tab {
      min-height: 36px;
      padding: 6px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      background: #f8fafc;
      color: #1e293b;
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .hub-dossier-tab.is-active {
      background: #15487f;
      border-color: #15487f;
      color: #fff;
    }
    .hub-dossier-grid {
      display: grid;
      gap: 10px;
      margin-bottom: 12px;
    }
    .hub-dossier-card {
      padding: 10px 14px;
      border: 1px solid #dbe4ee;
      border-radius: 10px;
      background: #f8fafc;
    }
    .hub-dossier-card strong {
      display: block;
      margin-bottom: 4px;
      color: #0f2942;
      font-size: 14px;
    }
    .hub-dossier-card p {
      margin: 0;
      color: #334155;
      font-size: 13.5px;
      line-height: 1.5;
    }
    .hub-dossier-links {
      margin: 10px 0 0;
      font-size: 13.5px;
      font-weight: 700;
    }
    .hub-udl-tts-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0 4px;
    }
    .hub-udl-tts-btn {
      min-height: 38px;
      padding: 6px 10px;
      border: 1px solid #175da0;
      border-radius: 8px;
      background: #f0f9ff;
      color: #0c4a6e;
      font: inherit;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .hub-udl-tts-btn:hover,
    .hub-udl-tts-btn:focus-visible {
      background: #e0f2fe;
    }
  `;
  document.head.appendChild(style);

  /**
   * Convert mathematical notation into natural spoken English or Spanish
   * so Web Speech synthesis reads ratios, units, and operators accurately.
   * @param {string} raw
   * @param {string} lang
   */
  function verbalizeMathText(raw, lang) {
    const isEs = String(lang || "")
      .toLowerCase()
      .startsWith("es");
    let text = String(raw || "");
    text = text.replace(/(\d+)\s*:\s*(\d+)/g, isEs ? "$1 a $2" : "$1 to $2");
    text = text.replace(/cm²|cm\^2/gi, isEs ? "centímetros cuadrados" : "square centimeters");
    text = text.replace(/cm³|cm\^3/gi, isEs ? "centímetros cúbicos" : "cubic centimeters");
    text = text.replace(/m²|m\^2/gi, isEs ? "metros cuadrados" : "square meters");
    text = text.replace(/÷/g, isEs ? " dividido entre " : " divided by ");
    text = text.replace(/×/g, isEs ? " por " : " times ");
    text = text.replace(/≥/g, isEs ? " es mayor o igual que " : " is greater than or equal to ");
    text = text.replace(/≤/g, isEs ? " es menor o igual que " : " is less than or equal to ");
    return text.replace(/\s+/g, " ").trim();
  }

  /** @param {string} lang */
  function speakMissionAloud(lang) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const targetNode =
        document.querySelector("#ewl-cockpit:not([hidden])") ||
        document.querySelector(".hub-now") ||
        document.querySelector(".curriculum-guide");
      if (!targetNode) return;
      const rawText = targetNode.textContent || "";
      const spoken = verbalizeMathText(rawText.slice(0, 900), lang || "en-US");
      const utter = new SpeechSynthesisUtterance(spoken);
      utter.lang = lang || "en-US";
      utter.rate = 0.96;
      window.speechSynthesis.speak(utter);
    } catch (_e) {}
  }

  function stopMathSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_e) {}
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(
        preferenceKey,
        JSON.stringify({
          readableFont: document.body.classList.contains("hub-readable-font"),
          highContrast: document.body.classList.contains("hub-high-contrast"),
          cognateSpotlight: document.body.classList.contains("hub-cognate-spotlight"),
        }),
      );
    } catch (_error) {
      // Display preferences still work when browser storage is unavailable.
    }
  }

  /** @param {boolean} enable */
  function toggleDyslexiaFont(enable) {
    document.body.classList.toggle("hub-readable-font", Boolean(enable));
    savePreferences();
  }
  /** @param {boolean} enable */
  function toggleHighContrast(enable) {
    document.body.classList.toggle("hub-high-contrast", Boolean(enable));
    savePreferences();
  }
  /** @param {boolean} enable */
  function toggleCognateSpotlight(enable) {
    document.body.classList.toggle("hub-cognate-spotlight", Boolean(enable));
    savePreferences();
  }

  // Upgrade the Reading & Language popover with Cognate Spotlight and Math-Aware Read-Aloud
  if (menu && !menu.querySelector("#chkCognateSpotlight")) {
    const extraWrap = document.createElement("div");
    extraWrap.innerHTML = `
      <label for="chkCognateSpotlight">
        <input type="checkbox" id="chkCognateSpotlight" onchange="toggleCognateSpotlight(this.checked)" />
        <span>Highlight Español &amp; Cognates <span class="hub-es" lang="es">· Resaltar español y cognados</span></span>
      </label>
      <div class="hub-udl-tts-row" role="group" aria-label="Math-Aware Read-Aloud">
        <button type="button" class="hub-udl-tts-btn" onclick="speakMissionAloud('en-US')">🔊 Read Mission (EN)</button>
        <button type="button" class="hub-udl-tts-btn" onclick="speakMissionAloud('es-US')">🔊 Leer misión (ES)</button>
        <button type="button" class="hub-udl-tts-btn" onclick="stopMathSpeech()">⏹ Stop</button>
      </div>
    `;
    const firstLink = menu.querySelector("a[href]");
    if (firstLink) {
      menu.insertBefore(extraWrap, firstLink);
    } else {
      menu.appendChild(extraWrap);
    }
  }

  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey) || "null");
    if (saved && typeof saved === "object") {
      [
        ["readableFont", "hub-readable-font", "chkDyslexiaFont"],
        ["highContrast", "hub-high-contrast", "chkHighContrast"],
        ["cognateSpotlight", "hub-cognate-spotlight", "chkCognateSpotlight"],
      ].forEach(function (entry) {
        const enabled = saved[entry[0]] === true;
        document.body.classList.toggle(entry[1], enabled);
        const checkbox = /** @type {HTMLInputElement | null} */ (document.getElementById(entry[2]));
        if (checkbox) checkbox.checked = enabled;
      });
    }
  } catch (_error) {
    // Malformed or inaccessible preferences use the page's default appearance.
  }
  Object.assign(window, {
    openAwardShowcaseModal,
    closeAwardShowcaseModal,
    toggleUdlMenu,
    toggleDyslexiaFont,
    toggleHighContrast,
    toggleCognateSpotlight,
    speakMissionAloud,
    stopMathSpeech,
    verbalizeMathText,
  });
})();

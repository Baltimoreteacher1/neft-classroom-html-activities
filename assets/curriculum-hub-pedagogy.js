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
  /** @type {Record<string, {icon: string, title: string, sub: string, html: string}>} */
  const details = {
    codie: {
      icon: "📚",
      title: "Find a lesson and its resources",
      sub: "Goals, notes, practice, and help in one place",
      html: '<p>Choose a lesson by unit, topic, or standard. Read its math and language goals, then open the resources that fit today\'s work.</p><p><a href="/curriculum/units/">Browse all units and lesson resources</a></p>',
    },
    bett: {
      icon: "👥",
      title: "Plan small-group instruction",
      sub: "Choose support from the lesson you are teaching",
      html: '<p>Each core lesson has small-group pathways with worksheets and practice. Use the unit browser to find the matching lesson and choose a group.</p><p><a href="/curriculum/units/">Find a lesson and its small-group pathways</a></p>',
    },
    iste: {
      icon: "📐",
      title: "Explore with math tools",
      sub: "Build and compare mathematical representations",
      html: '<p>Use the Math Workbench to model a problem or NetFold to explore three-dimensional shapes. Choose a tool that helps explain the mathematics in your lesson.</p><p><a href="/curriculum/math-workbench/">Open Math Workbench</a> · <a href="/netfold-pro/">Open NetFold</a></p>',
    },
    udl: {
      icon: "📖",
      title: "Choose reading and language supports",
      sub: "Page display preferences and separate language resources",
      html: '<p>The reading controls change this curriculum page\'s headings and contrast. Language supports open a separate collection with study guides, writing tools, and math vocabulary activities.</p><p><a href="/esol/">Open reading and language supports</a></p>',
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
    const detail = Object.prototype.hasOwnProperty.call(details, category)
      ? details[category]
      : details.codie;
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
    // Only the constant, authored strings above enter this overview.
    if (body) body.innerHTML = detail.html;
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
    // Safari still needs light-dismiss fallback; Escape and focus containment
    // are provided by showModal in supported classroom browsers.
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

  // A body filter creates a containing block for fixed controls. Use real
  // foreground/background colors instead so controls stay in the viewport.
  const style = document.createElement("style");
  style.textContent = `
    body.hub-readable-font :is(h1,h2,h3,h4,h5,h6,button,summary,input,select,textarea,label) {
      font-family: "Atkinson Hyperlegible", sans-serif !important;
    }
    body.hub-high-contrast, body.hub-high-contrast :where(*) {
      color: #111827 !important;
      background-color: #fff !important;
      background-image: none !important;
      border-color: #334155 !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    body.hub-high-contrast a { text-decoration: underline !important; }
    body.hub-high-contrast :focus-visible { outline: 3px solid #111827 !important; outline-offset: 3px; }
    body.hub-high-contrast :is([aria-selected="true"],[aria-pressed="true"]) { outline: 2px solid #111827; }
    body.hub-high-contrast input { accent-color: #111827; }
  `;
  document.head.appendChild(style);

  function savePreferences() {
    try {
      localStorage.setItem(
        preferenceKey,
        JSON.stringify({
          readableFont: document.body.classList.contains("hub-readable-font"),
          highContrast: document.body.classList.contains("hub-high-contrast"),
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

  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey) || "null");
    if (saved && typeof saved === "object") {
      [
        ["readableFont", "hub-readable-font", "chkDyslexiaFont"],
        ["highContrast", "hub-high-contrast", "chkHighContrast"],
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
  });
})();

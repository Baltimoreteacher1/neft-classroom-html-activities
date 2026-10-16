/**
 * curriculum-shell-state.js — Global State & Persistent Header Controller.
 *
 * Provides:
 * - Robust try/catch storage access with memory fallback (edu_lang, edu_role, edu_supports).
 * - Single batch read on boot (replacing hundreds of scattered reads).
 * - Polite aria-live screen-reader announcer for all user preference updates.
 * - <html lang> synchronization (WCAG 3.1.1, 3.1.2).
 * - Real DOM-absence enforcement for protected teacher content in Student Mode.
 * - Mount and hydration of persistent 4-route header with responsive mobile drawer.
 */

(function () {
  "use strict";

  // In-memory fallback dictionary if localStorage is blocked/restricted
  const memStore = {
    edu_lang: "en",
    edu_role: "student",
    edu_supports: "false",
  };

  // Safe storage wrappers
  function safeGet(key, defaultVal) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const v = window.localStorage.getItem(key);
        if (v !== null && v !== undefined) return v;
      }
    } catch (_e) {
      // storage blocked or private browsing exception
    }
    return memStore[key] !== undefined ? memStore[key] : defaultVal;
  }

  function safeSet(key, val) {
    const strVal = String(val);
    memStore[key] = strVal;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, strVal);
      }
    } catch (_e) {
      // storage quota / blocked
    }
  }

  // Batch initial state read on boot (exactly 1 batch operation)
  const state = {
    lang: "en",
    role: "student",
    supports: false,
  };

  function readInitialState() {
    const rawLang = safeGet("edu_lang", "en");
    state.lang = rawLang === "es" ? "es" : "en";

    const rawRole = safeGet("edu_role", "student");
    state.role = rawRole === "teacher" ? "teacher" : "student";

    const rawSupports = safeGet("edu_supports", "false");
    state.supports = rawSupports === "true" || rawSupports === true;
  }

  readInitialState();

  // Bilingual UI Dictionary for Shell
  const DICT = {
    en: {
      brandSub: "Grade 6 Math",
      navCurriculum: "Curriculum",
      navStudio: "Studio",
      navPractice: "Practice & Fluency",
      navFamily: "Family & Review",
      roleGroupLabel: "Role selection",
      roleStudent: "Student",
      roleTeacher: "Teacher",
      langGroupLabel: "Language selection",
      supportsLabel: "Supports",
      supportsTitle: "Toggle bilingual sentence frames and vocabulary tooltips",
      menuOpen: "Open navigation menu",
      menuClose: "Close navigation menu",
      annLangEn: "Language switched to English",
      annLangEs: "Idioma cambiado a español",
      annRoleTeacher: "Switched to Teacher Mode. Protected materials and pacing unlocked.",
      annRoleStudent: "Switched to Student Mode.",
      annSupportsOn: "Learning supports enabled with bilingual sentence frames and tooltips.",
      annSupportsOff: "Learning supports disabled.",
    },
    es: {
      brandSub: "Matemáticas 6.º Grado",
      navCurriculum: "Currículo",
      navStudio: "Estudio",
      navPractice: "Práctica y Fluidez",
      navFamily: "Familia y Repaso",
      roleGroupLabel: "Selección de rol",
      roleStudent: "Estudiante",
      roleTeacher: "Docente",
      langGroupLabel: "Selección de idioma",
      supportsLabel: "Apoyos",
      supportsTitle: "Activar marcos de oraciones y vocabulario bilingüe",
      menuOpen: "Abrir menú de navegación",
      menuClose: "Cerrar menú de navegación",
      annLangEn: "Language switched to English",
      annLangEs: "Idioma cambiado a español",
      annRoleTeacher: "Modo Docente activado. Materiales protegidos y ritmo desbloqueados.",
      annRoleStudent: "Modo Estudiante activado.",
      annSupportsOn: "Apoyos de aprendizaje activados con marcos de oraciones y vocabulario.",
      annSupportsOff: "Apoyos de aprendizaje desactivados.",
    },
  };

  function t(key) {
    const langDict = DICT[state.lang] || DICT.en;
    return langDict[key] || DICT.en[key] || key;
  }

  // Polite aria-live announcer
  function announce(message) {
    if (typeof document === "undefined") return;
    let el = document.getElementById("shell-live-announcer");
    if (!el) {
      el = document.createElement("div");
      el.id = "shell-live-announcer";
      el.className = "sr-only";
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      document.body.appendChild(el);
    }
    // Re-trigger announcement by clearing and updating on next microtask
    el.textContent = "";
    setTimeout(() => {
      el.textContent = message;
    }, 40);
  }

  // Dispatch global state change event
  function broadcast(changedKey, prevVal) {
    if (typeof window === "undefined") return;
    const detail = {
      key: changedKey,
      value: state[changedKey],
      prev: prevVal,
      state: {
        lang: state.lang,
        role: state.role,
        supports: state.supports,
      },
    };
    let event;
    try {
      event = new CustomEvent("curriculum:state-change", { detail: detail });
    } catch (_e) {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent("curriculum:state-change", true, true, detail);
    }
    window.dispatchEvent(event);
  }

  // Update DOM lang attribute
  function syncHtmlLang() {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (html) {
      html.setAttribute("lang", state.lang);
    }
  }

  // State Getters & Setters
  function getLanguage() {
    return state.lang;
  }

  function setLanguage(lang, silent) {
    const clean = lang === "es" ? "es" : "en";
    if (state.lang === clean) return;
    const prev = state.lang;
    state.lang = clean;
    safeSet("edu_lang", clean);
    syncHtmlLang();
    updateShellElements();
    if (!silent) {
      announce(clean === "es" ? t("annLangEs") : t("annLangEn"));
    }
    broadcast("lang", prev);
  }

  function getRole() {
    return state.role;
  }

  function isTeacher() {
    return state.role === "teacher";
  }

  function setRole(role, silent) {
    const clean = role === "teacher" ? "teacher" : "student";
    if (state.role === clean) return;
    const prev = state.role;
    state.role = clean;
    safeSet("edu_role", clean);
    updateShellElements();
    if (!silent) {
      announce(clean === "teacher" ? t("annRoleTeacher") : t("annRoleStudent"));
    }
    broadcast("role", prev);
  }

  function getSupports() {
    return state.supports;
  }

  function setSupports(enabled, silent) {
    const clean = Boolean(enabled);
    if (state.supports === clean) return;
    const prev = state.supports;
    state.supports = clean;
    safeSet("edu_supports", clean ? "true" : "false");
    updateShellElements();
    if (!silent) {
      announce(clean ? t("annSupportsOn") : t("annSupportsOff"));
    }
    broadcast("supports", prev);
  }

  // Update all header buttons and i18n text nodes in-place without page reload
  function updateShellElements() {
    if (typeof document === "undefined") return;

    // Update Lang Buttons
    const langBtns = document.querySelectorAll("[data-lang-btn]");
    for (let i = 0; i < langBtns.length; i++) {
      const btn = langBtns[i];
      const targetLang = btn.getAttribute("data-lang-btn");
      const isPressed = targetLang === state.lang;
      btn.setAttribute("aria-pressed", isPressed ? "true" : "false");
    }

    // Update Role Buttons
    const roleBtns = document.querySelectorAll("[data-role-btn]");
    for (let j = 0; j < roleBtns.length; j++) {
      const rbtn = roleBtns[j];
      const targetRole = rbtn.getAttribute("data-role-btn");
      const isRolePressed = targetRole === state.role;
      rbtn.setAttribute("aria-pressed", isRolePressed ? "true" : "false");
    }

    // Update Supports Pill
    const suppBtns = document.querySelectorAll("[data-supports-btn]");
    for (let k = 0; k < suppBtns.length; k++) {
      const sbtn = suppBtns[k];
      sbtn.setAttribute("aria-pressed", state.supports ? "true" : "false");
      sbtn.title = t("supportsTitle");
    }

    // Update shell text translations
    const i18nNodes = document.querySelectorAll("[data-shell-i18n]");
    for (let m = 0; m < i18nNodes.length; m++) {
      const node = i18nNodes[m];
      const key = node.getAttribute("data-shell-i18n");
      const text = t(key);
      if (text) node.textContent = text;
    }
  }

  // HTML Template for the Persistent Header
  function buildHeaderHtml(activeRoute) {
    const curLang = state.lang;
    const isT = state.role === "teacher";
    const isSupp = state.supports;

    const routes = [
      {
        id: "curriculum",
        href: "/curriculum/",
        i18n: "navCurriculum",
        label: t("navCurriculum"),
      },
      {
        id: "studio",
        href: "/curriculum/studio/",
        i18n: "navStudio",
        label: t("navStudio"),
      },
      {
        id: "practice",
        href: "/curriculum/practice/",
        i18n: "navPractice",
        label: t("navPractice"),
      },
      {
        id: "family",
        href: "/curriculum/family/",
        i18n: "navFamily",
        label: t("navFamily"),
      },
    ];

    const navItems = routes
      .map((r) => {
        const isCurrent = activeRoute === r.id;
        const ariaCurrent = isCurrent ? ' aria-current="page"' : "";
        return (
          '<li class="curriculum-nav-item">' +
          '<a href="' +
          r.href +
          '" class="curriculum-nav-link"' +
          ariaCurrent +
          ' data-shell-i18n="' +
          r.i18n +
          '">' +
          r.label +
          "</a></li>"
        );
      })
      .join("");

    return (
      '<div class="curriculum-header-inner">' +
      '  <a href="/curriculum/" class="curriculum-brand" aria-label="EduWonderLab Curriculum Hub">' +
      '    <div class="curriculum-brand-logo" aria-hidden="true">' +
      '      <svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>' +
      "    </div>" +
      '    <div class="curriculum-brand-text">' +
      '      <span class="curriculum-brand-name">EduWonderLab</span>' +
      '      <span class="curriculum-brand-sub" data-shell-i18n="brandSub">' +
      t("brandSub") +
      "</span>" +
      "    </div>" +
      "  </a>" +
      '  <nav class="curriculum-primary-nav" aria-label="Curriculum Navigation">' +
      '    <ul class="curriculum-primary-nav">' +
      navItems +
      "    </ul>" +
      "  </nav>" +
      '  <div class="curriculum-utility-bar">' +
      '    <div class="shell-segment" role="group" aria-label="' +
      t("langGroupLabel") +
      '">' +
      '      <button type="button" class="shell-segment-btn" data-lang-btn="en" aria-pressed="' +
      (curLang === "en" ? "true" : "false") +
      '">EN</button>' +
      '      <button type="button" class="shell-segment-btn" data-lang-btn="es" aria-pressed="' +
      (curLang === "es" ? "true" : "false") +
      '">ES</button>' +
      "    </div>" +
      '    <div class="shell-segment" role="group" aria-label="' +
      t("roleGroupLabel") +
      '">' +
      '      <button type="button" class="shell-segment-btn" data-role-btn="student" aria-pressed="' +
      (!isT ? "true" : "false") +
      '" data-shell-i18n="roleStudent">' +
      t("roleStudent") +
      "</button>" +
      '      <button type="button" class="shell-segment-btn" data-role-btn="teacher" aria-pressed="' +
      (isT ? "true" : "false") +
      '" data-shell-i18n="roleTeacher">' +
      t("roleTeacher") +
      "</button>" +
      "    </div>" +
      '    <button type="button" class="shell-supports-pill" data-supports-btn aria-pressed="' +
      (isSupp ? "true" : "false") +
      '" title="' +
      t("supportsTitle") +
      '">' +
      '      <span class="shell-pill-icon" aria-hidden="true">💬</span>' +
      '      <span data-shell-i18n="supportsLabel">' +
      t("supportsLabel") +
      "</span>" +
      "    </button>" +
      '    <button type="button" class="shell-mobile-toggle" aria-expanded="false" aria-controls="shell-mobile-nav" aria-label="' +
      t("menuOpen") +
      '">' +
      '      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>' +
      "    </button>" +
      "  </div>" +
      "</div>" +
      '<div id="shell-mobile-nav" class="shell-mobile-drawer" aria-hidden="true">' +
      '  <nav aria-label="Mobile Curriculum Navigation">' +
      routes
        .map((r) => {
          const isCurrent = activeRoute === r.id;
          const ariaCurrent = isCurrent ? ' aria-current="page"' : "";
          return (
            '<a href="' +
            r.href +
            '" class="curriculum-nav-link"' +
            ariaCurrent +
            ' data-shell-i18n="' +
            r.i18n +
            '">' +
            r.label +
            "</a>"
          );
        })
        .join("") +
      "  </nav>" +
      "</div>"
    );
  }

  // Mount or bind header element
  function mountHeader(containerOrId, activeRoute) {
    if (typeof document === "undefined") return;
    let container =
      typeof containerOrId === "string" ? document.getElementById(containerOrId) : containerOrId;

    if (!container) {
      container = document.querySelector(".curriculum-header");
    }

    if (!container) return;

    // Check if inner content already rendered or inject
    if (!container.querySelector(".curriculum-header-inner")) {
      container.innerHTML = buildHeaderHtml(
        activeRoute || container.getAttribute("data-active-route") || "curriculum",
      );
    }

    // Attach listeners
    bindHeaderEvents(container);
    document.body.classList.add("has-curriculum-shell");
    syncHtmlLang();
    updateShellElements();
  }

  function bindHeaderEvents(container) {
    // Language Buttons
    const langBtns = container.querySelectorAll("[data-lang-btn]");
    for (let i = 0; i < langBtns.length; i++) {
      const btn = langBtns[i];
      btn.addEventListener("click", () => {
        const targetLang = btn.getAttribute("data-lang-btn");
        setLanguage(targetLang);
      });
    }

    // Role Buttons
    const roleBtns = container.querySelectorAll("[data-role-btn]");
    for (let j = 0; j < roleBtns.length; j++) {
      const rbtn = roleBtns[j];
      rbtn.addEventListener("click", () => {
        const targetRole = rbtn.getAttribute("data-role-btn");
        setRole(targetRole);
      });
    }

    // Supports Pill
    const suppBtns = container.querySelectorAll("[data-supports-btn]");
    for (let k = 0; k < suppBtns.length; k++) {
      const sbtn = suppBtns[k];
      sbtn.addEventListener("click", () => {
        setSupports(!state.supports);
      });
    }

    // Mobile Drawer Toggle
    const toggleBtn = container.querySelector(".shell-mobile-toggle");
    const mobileDrawer = container.querySelector("#shell-mobile-nav");
    if (toggleBtn && mobileDrawer) {
      toggleBtn.addEventListener("click", () => {
        const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
        toggleBtn.setAttribute("aria-expanded", !expanded);
        mobileDrawer.setAttribute("aria-hidden", expanded ? "true" : "false");
        toggleBtn.setAttribute("aria-label", expanded ? t("menuOpen") : t("menuClose"));
      });

      // Close mobile drawer on Escape key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && toggleBtn.getAttribute("aria-expanded") === "true") {
          toggleBtn.setAttribute("aria-expanded", "false");
          mobileDrawer.setAttribute("aria-hidden", "true");
          toggleBtn.focus();
        }
      });
    }
  }

  // Auto-init on DOMContentLoaded if header element exists
  function init() {
    if (typeof document === "undefined") return;
    readInitialState();
    syncHtmlLang();

    const existingHeader = document.querySelector(".curriculum-header");
    if (existingHeader) {
      mountHeader(existingHeader);
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  const api = {
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    getRole: getRole,
    setRole: setRole,
    isTeacher: isTeacher,
    getSupports: getSupports,
    setSupports: setSupports,
    announce: announce,
    t: t,
    buildHeaderHtml: buildHeaderHtml,
    mountHeader: mountHeader,
    init: init,
    state: state,
  };

  if (typeof window !== "undefined") {
    window.CurriculumShell = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.CurriculumShell = api;
  }
})();

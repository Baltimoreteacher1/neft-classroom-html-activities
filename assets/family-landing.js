/**
 * /families/ landing page: language switch, search and filters.
 *
 * Generated markup comes from scripts/lib/family-landing.mjs. Every string on
 * the page is an English / Spanish pair (`.en` / `.es`); this file only decides
 * which one shows and which lessons are listed. English and Spanish are the only
 * languages (data/product-decisions.json family-surfaces-english-spanish-only).
 *
 * Language order of precedence, the same one the lesson homework pages use
 * (`preferredLanguageMode` in scripts/homework-guided-notes.mjs):
 *   1. ?lang=en | ?lang=es
 *   2. localStorage `hw_lang_mode` ('en' | 'es'; 'bilingual' is a homework-only
 *      mode and means no preference here)
 *   3. a Spanish browser language
 *   4. English
 * Choosing a language writes `hw_lang_mode`, which is what makes the homework
 * pages open in the same language. Loading the page never writes it.
 */
(function () {
  "use strict";

  var STORE_KEY = "hw_lang_mode";
  var TITLES = {
    en: "Family Math Studio · Family Math Support",
    es: "Estudio familiar de matemáticas · Apoyo familiar de matemáticas",
  };

  /** @param {string} value */
  function fold(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  /** @returns {"en"|"es"} */
  function resolveLanguage() {
    try {
      var asked = new URLSearchParams(location.search).get("lang");
      if (asked === "en" || asked === "es") return asked;
    } catch (_e) {}
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved === "en" || saved === "es") return saved;
    } catch (_e) {}
    try {
      var langs =
        navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language || ""];
      for (var i = 0; i < langs.length; i += 1) {
        if (String(langs[i]).toLowerCase().indexOf("es") === 0) return "es";
      }
    } catch (_e) {}
    return "en";
  }

  /** @param {"en"|"es"} lang */
  function applyLanguage(lang) {
    var root = document.documentElement;
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    document.title = TITLES[lang];
  }

  // Before first paint: no flash of both languages.
  applyLanguage(resolveLanguage());

  function start() {
    var lang = /** @type {"en"|"es"} */ (
      document.documentElement.getAttribute("data-lang") === "es" ? "es" : "en"
    );
    var langbar = document.querySelector("[data-langbar]");
    var controls = document.querySelector("[data-controls]");
    var search = /** @type {HTMLInputElement|null} */ (document.getElementById("family-search"));
    var unitFilter = /** @type {HTMLSelectElement|null} */ (document.getElementById("unit-filter"));
    var topicFilter = /** @type {HTMLSelectElement|null} */ (
      document.getElementById("topic-filter")
    );
    var empty = document.getElementById("empty-message");
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-lesson-card]"));
    var units = Array.prototype.slice.call(document.querySelectorAll("[data-unit-section]"));
    if (!search || !unitFilter || !topicFilter || !empty) return;
    if (langbar) langbar.removeAttribute("hidden");
    if (controls) controls.removeAttribute("hidden");

    function syncLabels() {
      Array.prototype.forEach.call(document.querySelectorAll("option[data-en]"), function (option) {
        option.textContent = option.getAttribute("data-" + lang);
      });
      search.setAttribute("placeholder", search.getAttribute("data-placeholder-" + lang) || "");
      Array.prototype.forEach.call(document.querySelectorAll("[data-set-lang]"), function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-set-lang") === lang));
      });
      // Pages that read the choice from the address as well as from storage.
      Array.prototype.forEach.call(document.querySelectorAll("a[data-lang-link]"), function (link) {
        var base = link.getAttribute("data-base") || link.getAttribute("href") || "";
        link.setAttribute("data-base", base);
        link.setAttribute("href", base.split("?")[0] + "?lang=" + lang);
      });
    }

    function setLanguage(next) {
      lang = next;
      try {
        localStorage.setItem(STORE_KEY, next);
      } catch (_e) {}
      applyLanguage(next);
      syncLabels();
    }

    var autoOpened = [];

    function applyFilters() {
      var tokens = fold(search.value).split(/\s+/).filter(Boolean);
      var unit = unitFilter.value;
      var topic = topicFilter.value;
      var filtering = tokens.length > 0 || unit !== "all" || topic !== "all";
      var shown = 0;
      rows.forEach(function (row) {
        var hay = row.getAttribute("data-search") || "";
        var match =
          tokens.every(function (t) {
            return hay.indexOf(t) !== -1;
          }) &&
          (unit === "all" || row.getAttribute("data-unit") === unit) &&
          (topic === "all" || row.getAttribute("data-topic") === topic);
        row.hidden = !match;
        if (match) shown += 1;
      });
      units.forEach(function (section) {
        var count = section.querySelectorAll("[data-lesson-card]:not([hidden])").length;
        section.hidden = count === 0;
        Array.prototype.forEach.call(section.querySelectorAll("summary [data-n]"), function (n) {
          n.textContent = String(count);
        });
        var opened = autoOpened.indexOf(section) !== -1;
        if (filtering && count > 0 && !section.open) {
          section.open = true;
          autoOpened.push(section);
        } else if (!filtering && opened) {
          section.open = false;
        }
      });
      if (!filtering) autoOpened = [];
      empty.hidden = shown !== 0;
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-set-lang]"), function (button) {
      button.addEventListener("click", function () {
        setLanguage(button.getAttribute("data-set-lang") === "es" ? "es" : "en");
      });
    });
    search.addEventListener("input", applyFilters);
    unitFilter.addEventListener("change", applyFilters);
    topicFilter.addEventListener("change", applyFilters);
    syncLabels();
    applyFilters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

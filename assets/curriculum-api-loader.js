/**
 * curriculum-api-loader.js — optional Phase C: hydrate CurriculumHub from D1 API.
 * Falls back silently to inline static unitsData when API unavailable.
 */
(function () {
  "use strict";

  var API_BASE =
    window.CURRICULUM_SYNC && typeof window.CURRICULUM_SYNC.apiBase === "string"
      ? window.CURRICULUM_SYNC.apiBase
      : "https://neft-school-hub-api.neftjd.workers.dev";
  var TENANT_ID = (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.tenantId) || "harbor-view";
  var COURSE = (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.course) || "grade6-math";
  var ENABLED = window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.useApiContent === true;

  // Every deferred hub layer (search, progress %, result counts, JSON-LD) reads
  // CurriculumHub.unitsData and expects the canonical scraped shape: units with
  // {num, name, lessons[]} and lessons with {lessonId, objective, activities[]}.
  // A payload missing those fields does not degrade gracefully — it renders
  // search results as bare titles with no lesson links. So validate the shape
  // before publishing it, and keep the static curriculum when it fails.
  function hasCanonicalShape(units) {
    if (!Array.isArray(units) || !units.length) return false;
    return units.every(function (u) {
      if (!u || typeof u.num !== "string" || !Array.isArray(u.lessons) || !u.lessons.length) {
        return false;
      }
      return u.lessons.every(function (l) {
        return l && typeof l.title === "string" && Array.isArray(l.activities);
      });
    });
  }

  function tryLoadFromApi() {
    if (!ENABLED) return Promise.resolve(false);
    var hub = window.CurriculumHub;
    if (!hub) return Promise.resolve(false);
    var params = new URLSearchParams({
      tenant_id: TENANT_ID,
      course: COURSE,
    });
    return fetch(API_BASE.replace(/\/$/, "") + "/api/curriculum/content?" + params.toString())
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (!data || !hasCanonicalShape(data.units)) return false;
        hub.unitsData = data.units;
        hub._apiContent = true;
        // renderHub() reads the closure variable inside curriculum/index.html, not
        // this property, so the visible hub keeps rendering the scraped
        // curriculum. Calling it here is intentional but only refreshes chrome —
        // a true content swap needs the hub to read hub.unitsData directly.
        if (typeof hub.renderHub === "function") hub.renderHub();
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function waitForHub(tries) {
    if (window.CurriculumHub) {
      tryLoadFromApi();
      return;
    }
    if (tries > 80) return;
    setTimeout(function () {
      waitForHub(tries + 1);
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      waitForHub(0);
    });
  } else {
    waitForHub(0);
  }
})();

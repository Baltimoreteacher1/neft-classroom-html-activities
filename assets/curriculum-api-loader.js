/**
 * curriculum-api-loader.js — optional Phase C: hydrate CurriculumHub from D1 API.
 * Falls back silently to inline static unitsData when API unavailable.
 */
(function () {
  "use strict";

  var API_BASE =
    (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.apiBase) ||
    "https://neft-school-hub-api.neftjd.workers.dev";
  var TENANT_ID =
    (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.tenantId) || "harbor-view";
  var COURSE = (window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.course) || "grade6-math";
  var ENABLED =
    window.CURRICULUM_SYNC && window.CURRICULUM_SYNC.useApiContent === true;

  function tryLoadFromApi() {
    if (!ENABLED) return Promise.resolve(false);
    var hub = window.CurriculumHub;
    if (!hub) return Promise.resolve(false);
    var params = new URLSearchParams({
      tenant_id: TENANT_ID,
      course: COURSE,
    });
    return fetch(
      API_BASE.replace(/\/$/, "") + "/api/curriculum/content?" + params.toString(),
    )
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.units) || !data.units.length) return false;
        hub.unitsData = data.units;
        hub._apiContent = true;
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

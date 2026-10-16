/* =============================================================================
 * Family practice engagement beacon — aggregate counters, no identifiers
 * -----------------------------------------------------------------------------
 * Loaded by the family homework page. It reports THREE things, and only these:
 *
 *   open   the practice opened on route quick | core | full
 *   route  a family chose a route
 *   tab    a family finished a tab (moved on to a later one, or reached Done)
 *
 * Each beacon is { event, route, tab?, lang, device } posted to
 * /api/family-engagement, which only bumps a weekly counter. Nothing about the
 * lesson, the student, the family, the address bar, saved answers or the time
 * of day is read, let alone sent — and the page's own state is never touched.
 *
 * It inherits the site's posture: no beacon on localhost, none when the browser
 * says Do Not Track / Global Privacy Control, none in Teacher Mode (the same
 * three rules assets/nt-usage.js applies, so a teacher previewing a page never
 * counts as a family).
 * ========================================================================== */
(function (root) {
  "use strict";
  if (!root) return;
  var doc = root.document;
  if (!doc || doc.documentElement.dataset.ntFamilyEngagement) return;
  doc.documentElement.dataset.ntFamilyEngagement = "1";

  var URL_PATH = "/api/family-engagement";
  var TEACHER_MODE_KEY = "nt-teacher-mode";
  /** Tab order of each route, from the homework page's own route table. */
  var ROUTE_TABS = {
    quick: ["learn", "check", "done"],
    core: ["learn", "words", "check", "done"],
    full: ["learn", "words", "check", "play", "done"],
  };

  var sentTabs = {};
  var lastTab = "";

  function blocked() {
    try {
      var h = root.location.hostname;
      if (root.location.protocol === "file:" || !h || h === "localhost" || h === "127.0.0.1") {
        return true;
      }
      var nav = /** @type {any} */ (root.navigator || {});
      if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return true;
      var params = new URLSearchParams(root.location.search || "");
      if (params.get("student") === "1" || params.get("teacher") === "0") return false;
      var v = (root.localStorage.getItem(TEACHER_MODE_KEY) || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (_e) {
      return false;
    }
  }

  function device() {
    var w = root.innerWidth || 1024;
    return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  }

  function lang() {
    return doc.documentElement.lang === "es" ? "es" : "en";
  }

  function route() {
    var r = doc.body && doc.body.dataset ? doc.body.dataset.homeworkRoute : "";
    return ROUTE_TABS[r] ? r : "full";
  }

  function send(event, routeId, tab) {
    if (blocked()) return false;
    var payload = { event: event, route: routeId, lang: lang(), device: device() };
    if (tab) payload.tab = tab;
    try {
      var body = JSON.stringify(payload);
      var nav = /** @type {any} */ (root.navigator || {});
      if (typeof nav.sendBeacon === "function") {
        return nav.sendBeacon(URL_PATH, new Blob([body], { type: "text/plain" }));
      }
      if (typeof root.fetch === "function") {
        root
          .fetch(URL_PATH, {
            method: "POST",
            body: body,
            keepalive: true,
            headers: { "Content-Type": "text/plain" },
          })
          .catch(function () {});
        return true;
      }
    } catch (_e) {
      /* a counter must never break a homework page */
    }
    return false;
  }

  function tabDone(routeId, tab) {
    var key = routeId + ":" + tab;
    if (sentTabs[key]) return;
    sentTabs[key] = true;
    send("tab", routeId, tab);
  }

  /** The active tab changed: leaving a tab for a LATER one finishes it. */
  function onTabChange() {
    var next = doc.body.dataset.activeTab || "";
    var routeId = route();
    var order = ROUTE_TABS[routeId];
    if (!next || next === lastTab) return;
    if (lastTab && order.indexOf(next) > order.indexOf(lastTab) && order.indexOf(lastTab) >= 0) {
      tabDone(routeId, lastTab);
    }
    if (next === "done") tabDone(routeId, "done");
    lastTab = next;
  }

  function start() {
    try {
      send("open", route());
      lastTab = doc.body.dataset.activeTab || "";
      doc.addEventListener(
        "click",
        function (event) {
          var target = /** @type {Element | null} */ (event.target);
          var btn = target && target.closest ? target.closest("[data-route-mode]") : null;
          var mode = btn && /** @type {HTMLElement} */ (btn).dataset.routeMode;
          if (mode && ROUTE_TABS[mode]) send("route", mode);
        },
        { passive: true },
      );
      if (typeof root.MutationObserver === "function") {
        new root.MutationObserver(onTabChange).observe(doc.body, {
          attributes: true,
          attributeFilter: ["data-active-tab"],
        });
      }
    } catch (_e) {
      /* instrumentation must never break the page */
    }
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})(typeof window !== "undefined" ? window : null);

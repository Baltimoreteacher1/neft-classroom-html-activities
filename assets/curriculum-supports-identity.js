/*
 * curriculum-supports-identity.js — claim your identity ONCE, at the hub.
 *
 * The problem this solves
 * ----------------------
 * Learning Supports v2 already resolves a student's IEP / ESOL accommodations
 * from the D1 roster and applies them on every lesson page. But the "who are
 * you?" self-pick fired INSIDE a lesson, which meant:
 *   - the modal interrupted the lesson instead of preceding it,
 *   - the hub itself (/curriculum) — the page students actually start on —
 *     stayed completely unaware of the student, and
 *   - nothing carried the identity from the hub into the page being opened.
 *
 * This module moves the claim upstream to the hub and makes the hub itself
 * support-aware. Once a student says who they are:
 *   1. their accommodations are resolved and cached under the SAME key the
 *      lesson engine reads, so the lesson starts already adapted — no flash,
 *      no second modal;
 *   2. the hub applies their passive accommodations (larger text, high
 *      contrast, reduced-motion comfort mode);
 *   3. every outgoing lesson link is stamped "?me=<section>.<initials>" so the
 *      identity travels with the click — including onto a device that has
 *      never seen this student;
 *   4. lessons the teacher assigned to them are badged on the hub.
 *
 * Deliberately NOT "?supports=": that transport freezes a COARSE bundle and
 * overrides the roster. "?me=" carries only WHO the student is, so the roster
 * still resolves their real, fine-grained, current accommodations.
 *
 * Hard rules: additive, reversible, never throws into the hub, no new PII
 * (section + initials are what the lesson modal already collected), and a
 * dead/empty roster renders NOTHING rather than nagging students.
 */
(function () {
  "use strict";
  if (window.__ntHubIdentityBooted) return;
  window.__ntHubIdentityBooted = true;

  var API = "/api/supports";
  var LESSON_HREF_RE = /\/lessons\/(\d+-\d+(?:-group[12]|-catchup)?)\/?(?:[?#]|$)/;

  // Passive accommodations that make sense on a browse page. Interactive tools
  // (calculator, number line, ...) belong to the lesson dock, not the hub.
  var PASSIVE = {
    "text-large": "ewl-supports-text-lg",
    contrast: "ewl-supports-contrast-active",
    comfort: "ewl-supports-comfort-active",
  };

  var state = { roster: null, items: [], lessons: [] };

  function ident() {
    return window.NTIdentity || null;
  }

  async function getJSON(path) {
    try {
      var res = await fetch(API + path, { headers: { Accept: "application/json" } });
      if (!res.ok) return null;
      return await res.json();
    } catch (_e) {
      return null;
    }
  }

  // ---- applying what we resolved ------------------------------------------

  function applyPassive(items) {
    var set = {};
    for (var i = 0; i < items.length; i++) set[items[i]] = true;
    for (var key in PASSIVE) {
      if (!Object.prototype.hasOwnProperty.call(PASSIVE, key)) continue;
      document.body.classList.toggle(PASSIVE[key], !!set[key]);
    }
  }

  /*
   * Stamp "?me=" onto lesson links so the identity survives the click.
   * Skips any link that already carries "?supports=" (an explicit personalized
   * launch outranks the roster and must not be second-guessed) and any link
   * that already has "me=".
   */
  function stampLinks(root) {
    var me = ident() && ident().get();
    if (!me || !me.initials) return;
    var token = me.section + "." + me.initials;
    var anchors = (root || document).querySelectorAll('a[href*="/lessons/"]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var href = a.getAttribute("href") || "";
      if (!LESSON_HREF_RE.test(href)) continue;
      if (href.indexOf("supports=") >= 0) continue;
      try {
        var u = new URL(href, window.location.href);
        if (u.searchParams.get("me") === token) continue;
        u.searchParams.set("me", token);
        a.setAttribute("href", u.pathname + u.search + u.hash);
      } catch (_e) {
        /* leave malformed hrefs alone */
      }
    }
  }

  function badgeAssignedLessons() {
    if (!state.lessons.length) return;
    var assigned = {};
    for (var i = 0; i < state.lessons.length; i++) assigned[state.lessons[i]] = true;
    var anchors = document.querySelectorAll('a[href*="/lessons/"]');
    for (var j = 0; j < anchors.length; j++) {
      var a = anchors[j];
      var m = LESSON_HREF_RE.exec(a.getAttribute("href") || "");
      if (!m || !assigned[m[1]]) continue;
      if (a.querySelector(".nt-ident-assigned")) continue;
      var badge = document.createElement("span");
      badge.className = "nt-ident-assigned";
      badge.textContent = "★ for you";
      a.appendChild(badge);
    }
  }

  function refreshPage() {
    applyPassive(state.items);
    stampLinks(document);
    badgeAssignedLessons();
    renderChip();
  }

  // ---- resolving the roster assignment -------------------------------------

  async function resolveFor(section, initials) {
    var id = ident();
    // Warm start from cache so the hub adapts instantly, then refresh.
    var cached = id && id.getAssigned();
    if (cached && Array.isArray(cached.items)) {
      state.items = cached.items;
      state.lessons = Array.isArray(cached.lessons) ? cached.lessons : [];
      refreshPage();
    }
    var fresh = await getJSON(
      "/for?section=" + encodeURIComponent(section) + "&initials=" + encodeURIComponent(initials),
    );
    // items:null means "backend can't answer" — keep whatever we already had
    // rather than blanking a student's supports on a flaky network.
    if (!fresh || !fresh.ok || !Array.isArray(fresh.items)) return;
    state.items = fresh.items;
    state.lessons = Array.isArray(fresh.lessons) ? fresh.lessons : [];
    if (id) id.setAssigned({ items: state.items, lessons: state.lessons });
    refreshPage();
  }

  // ---- UI -------------------------------------------------------------------

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /*
   * Mount host. "header.hub" lives inside #hub-side, which the lessons-first
   * hub keeps HIDDEN on the landing view — a chip mounted there renders but is
   * never seen. #curriculum-start is the header that is actually on screen when
   * a student arrives, so it is the primary host and header.hub the fallback.
   */
  function chipHost() {
    return document.getElementById("curriculum-start") || document.querySelector("header.hub");
  }

  function renderChip() {
    var host = chipHost();
    if (!host) return;
    var chip = document.getElementById("nt-ident-chip");
    if (!chip) {
      chip = el("button", "nt-ident-chip");
      chip.id = "nt-ident-chip";
      chip.type = "button";
      chip.addEventListener("click", openPicker);
      host.insertBefore(chip, host.firstChild);
    }
    var me = ident() && ident().get();
    var named = me && me.initials;
    chip.classList.toggle("is-claimed", !!named);
    chip.textContent = named ? "👤 " + me.initials + " · " + me.section : "👤 Who's working today?";
    chip.setAttribute(
      "aria-label",
      named
        ? "You are signed in as " + me.initials + " in section " + me.section + ". Tap to change."
        : "Tap to choose who is working, so your learning supports follow you.",
    );
  }

  function closePicker() {
    var back = document.getElementById("nt-ident-backdrop");
    if (back && back.parentNode) back.parentNode.removeChild(back);
    document.removeEventListener("keydown", onPickerKey);
  }

  function onPickerKey(e) {
    if (e.key === "Escape") closePicker();
  }

  function openPicker() {
    if (document.getElementById("nt-ident-backdrop")) return;
    var sections = (state.roster && state.roster.sections) || {};

    var back = el("div", "nt-ident-backdrop");
    back.id = "nt-ident-backdrop";
    back.addEventListener("click", function (e) {
      if (e.target === back) closePicker();
    });

    var panel = el("div", "nt-ident-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Choose who is working");

    panel.appendChild(el("h2", "nt-ident-title", "Who's working today?"));
    panel.appendChild(
      el(
        "p",
        "nt-ident-sub",
        "Pick your class and your initials. Your learning tools will follow you into every lesson.",
      ),
    );

    var me = (ident() && ident().get()) || {};
    var chosenSection = me.section || Object.keys(sections)[0] || "";

    var secRow = el("div", "nt-ident-row");
    secRow.appendChild(el("span", "nt-ident-rowlabel", "Class"));
    var secWrap = el("div", "nt-ident-opts");
    secRow.appendChild(secWrap);
    panel.appendChild(secRow);

    var iniRow = el("div", "nt-ident-row");
    iniRow.appendChild(el("span", "nt-ident-rowlabel", "You"));
    var iniWrap = el("div", "nt-ident-opts");
    iniRow.appendChild(iniWrap);
    panel.appendChild(iniRow);

    function drawInitials() {
      iniWrap.innerHTML = "";
      var list = sections[chosenSection] || [];
      if (!list.length) {
        iniWrap.appendChild(el("span", "nt-ident-empty", "No names in this class yet."));
        return;
      }
      list.forEach(function (ini) {
        var b = el("button", "nt-ident-opt", ini);
        b.type = "button";
        if (ini === me.initials && chosenSection === me.section) b.classList.add("is-on");
        b.addEventListener("click", function () {
          if (ident()) ident().set({ section: chosenSection, initials: ini });
          closePicker();
          renderChip();
          resolveFor(chosenSection, ini);
        });
        iniWrap.appendChild(b);
      });
    }

    Object.keys(sections).forEach(function (sec) {
      var b = el("button", "nt-ident-opt", sec);
      b.type = "button";
      if (sec === chosenSection) b.classList.add("is-on");
      b.addEventListener("click", function () {
        chosenSection = sec;
        Array.prototype.forEach.call(secWrap.children, function (c) {
          c.classList.toggle("is-on", c === b);
        });
        drawInitials();
      });
      secWrap.appendChild(b);
    });
    drawInitials();

    var foot = el("div", "nt-ident-foot");
    var notMe = el("button", "nt-ident-ghost", "Not now");
    notMe.type = "button";
    notMe.addEventListener("click", function () {
      if (ident()) ident().skip();
      closePicker();
      renderChip();
    });
    foot.appendChild(notMe);

    if (me.initials) {
      var reset = el("button", "nt-ident-ghost", "This isn't me");
      reset.type = "button";
      reset.addEventListener("click", function () {
        if (ident()) ident().clear();
        state.items = [];
        state.lessons = [];
        closePicker();
        refreshPage();
      });
      foot.appendChild(reset);
    }
    panel.appendChild(foot);

    back.appendChild(panel);
    document.body.appendChild(back);
    document.addEventListener("keydown", onPickerKey);
    var first = panel.querySelector(".nt-ident-opt");
    if (first) first.focus();
  }

  // ---- boot -----------------------------------------------------------------

  async function boot() {
    var id = ident();
    if (!id) return; // shared-identity.js absent -> stay silent, change nothing

    // An identity handed to us in the URL wins for THIS device (that is the
    // whole point of the stamped links / a teacher-shared link).
    var fromUrl = id.fromUrl();
    if (fromUrl) id.set(fromUrl);

    state.roster = await getJSON("/sections");
    var sections = (state.roster && state.roster.sections) || {};
    var hasRoster = Object.keys(sections).some(function (s) {
      return (sections[s] || []).length;
    });
    // No roster built yet -> render nothing at all. Never nag.
    if (!hasRoster) return;

    renderChip();

    var me = id.get();
    if (me && me.initials) {
      await resolveFor(me.section, me.initials);
    }

    // The hub renders unit lists lazily, so newly-inserted lesson links need
    // the same stamping/badging treatment. Throttled to one pass per frame.
    var queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        stampLinks(document);
        badgeAssignedLessons();
      });
    }).observe(document.body, { childList: true, subtree: true });

    id.onChange(function () {
      renderChip();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

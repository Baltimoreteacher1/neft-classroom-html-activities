// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/**
 * Curriculum Hub enhancements — teacher/student mode, progress, search filters,
 * real-world snippets, JSON-LD, and accessibility helpers.
 * Requires window.CurriculumHub from curriculum/index.html inline script.
 */
(function () {
  "use strict";

  // Single source of truth shared with the lesson engine (engine/core/
  // teacher-mode.js) so one toggle flips both the hub and every lesson.
  var STORAGE_MODE = "nt-teacher-mode";
  var STORAGE_MODE_LEGACY = "curriculumTeacherMode";
  // Which accepted PIN unlocked Teacher Mode (master | coteacher). Nice-to-have
  // for future rotation; does not grant SITE_PASSWORD / Basic Auth.
  var STORAGE_PIN_ROLE = "nt-teacher-pin-role";
  // Classroom deterrent passwords for entering Teacher Mode (not real security —
  // a client-side gate that stops casual student access). Either PIN unlocks the
  // same Teacher Mode sticky flag; neither is SITE_PASSWORD.
  // ⚠️ KEEP IN SYNC with TEACHER_PINS in engine/core/teacher-mode.js.
  var TEACHER_PINS = {
    master: "TeacherNeft",
    coteacher: "TeacherAlba",
    masterAlt: "BlueHeron2026",
    coteacherAlt: "RiverStone2026",
  };
  // Order is load-bearing: matchTeacherPin() derives the role from the index
  // (even = master, odd = co-teacher), so the two roles must keep alternating.
  var ACCEPTED_TEACHER_PINS = [
    TEACHER_PINS.master,
    TEACHER_PINS.coteacher,
    TEACHER_PINS.masterAlt,
    TEACHER_PINS.coteacherAlt,
  ];
  var STORAGE_PROGRESS = "curriculumProgress";
  var FILTER_ALL = "all";

  var TEACHER_HREF_PATTERNS = [
    /teacher-tools/i,
    /docs\.google\.com/i,
    /\/downloads\/.*\.pdf$/i,
    /\/downloads\/.*\.docx$/i,
    /homework\.docx$/i,
    // Slide decks (incl. emoji-labeled "🔗 Google Slides" / editable-slides.html)
    // are teacher-facing; match by href so the visible label never matters.
    /slides\.html$/i,
  ];

  var TEACHER_TEXT_PATTERNS = [
    /^google slides$/i,
    /^notes pdf$/i,
    /^notes docx$/i,
    /^homework$/i,
    /^google forms$/i,
  ];

  var FILTER_RULES = {
    lessons: /interactive lesson|slides\.html|handout\.html|\/lessons\/[^/]+\/?$/i,
    homework: /homework|family homework/i,
    games: /game|graphic novel|3d|project|bonus|arcade|lab|odyssey|netfold/i,
    notes: /guided notes|notes\.html|notes pdf|notes docx/i,
    smallgroup: /small-group|group1|group2|foundation|challenge|socratic|catch-?up/i,
  };

  var realWorldMap = {};
  var googleSlidesLegacyUrls = {};
  var lessonStandards = {};
  var searchIndex = null;
  var _searchDocsById = {};
  var activeFilter = FILTER_ALL;
  var teacherMode = false;
  var progress = {};
  var hubApi = null;
  var enhanceScheduled = false;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // Routed through /assets/curriculum-json-cache.js so the hub fetches each
  // data file once instead of once per feature script. This file also loads on
  // 64 homework pages, which do not carry the cache — hence the plain fallback.
  function loadJson(url) {
    var cache = window.NTJsonCache;
    var request = cache
      ? cache.json(url)
      : fetch(url).then(function (r) {
          return r.ok ? r.json() : {};
        });
    return request.catch(function () {
      return {};
    });
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_PROGRESS);
      progress = raw ? JSON.parse(raw) : {};
    } catch (_e) {
      progress = {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress));
    } catch (_e) {}
  }

  function parseProgressKey(key) {
    var parts = String(key || "").split("::");
    if (parts.length < 2) return null;
    return { lessonId: parts[0], href: parts.slice(1).join("::") };
  }

  function syncProgressToggle(lessonId, href, completed) {
    if (window.CurriculumProgressBridge && window.CurriculumProgressBridge.syncToggle) {
      window.CurriculumProgressBridge.syncToggle(lessonId, href, completed);
    }
  }

  function hydrateProgressFromServer(callback) {
    if (!window.CurriculumProgressBridge || !window.CurriculumProgressBridge.hydrateFromServer) {
      if (callback) callback(false);
      return;
    }
    window.CurriculumProgressBridge.hydrateFromServer(progress, progressKey).then(
      function (changed) {
        if (changed) saveProgress();
        if (callback) callback(changed);
      },
    );
  }

  function loadTeacherMode() {
    try {
      var params = new URLSearchParams(location.search);
      if (params.get("student") === "1") return false;
      var pinRole = matchTeacherPin(params.get("pin"));
      if (params.get("teacher") === "1" || pinRole) {
        saveTeacherMode(true, pinRole || "master");
        return true;
      }
      var saved = localStorage.getItem(STORAGE_MODE);
      if (saved === null) {
        var legacy = localStorage.getItem(STORAGE_MODE_LEGACY);
        if (legacy !== null) {
          saved = legacy === "1" || legacy === "true" ? "1" : "0";
          localStorage.setItem(STORAGE_MODE, saved);
          localStorage.removeItem(STORAGE_MODE_LEGACY);
        }
      }
      if (saved === "0" || saved === "false") return false;
      if (saved === "1" || saved === "true") return true;
    } catch (_e) {}
    return false;
  }

  function saveTeacherMode(on, role) {
    try {
      localStorage.setItem(STORAGE_MODE, on ? "1" : "0");
      if (!on) {
        localStorage.removeItem(STORAGE_PIN_ROLE);
      } else if (role) {
        localStorage.setItem(STORAGE_PIN_ROLE, role);
      }
    } catch (_e) {}
  }

  function matchTeacherPin(pin) {
    if (!pin) return null;
    var cleaned = String(pin).trim();
    var lower = cleaned.toLowerCase();
    for (var i = 0; i < ACCEPTED_TEACHER_PINS.length; i++) {
      if (
        cleaned === ACCEPTED_TEACHER_PINS[i] ||
        lower === ACCEPTED_TEACHER_PINS[i].toLowerCase()
      ) {
        return i % 2 === 0 ? "master" : "coteacher";
      }
    }
    return null;
  }

  function requestTeacher(anchor, onRole) {
    if (typeof anchor === "function") {
      onRole = anchor;
      anchor = null;
    }
    onRole = onRole || function () {};
    var existing = document.getElementById("hub-teacher-unlock");
    if (existing) {
      existing.remove();
      return;
    }

    var overlay = document.createElement("div");
    overlay.id = "hub-teacher-unlock";
    overlay.className = "hub-teacher-unlock-overlay";
    overlay.style.cssText =
      "position: fixed; inset: 0; z-index: 999999; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px;";

    var form = document.createElement("form");
    form.className = "hub-teacher-unlock-modal";
    form.style.cssText =
      "background: #ffffff; border-radius: 20px; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.3); border: 1px solid rgba(2,132,199,0.3); padding: 28px 32px; max-width: 380px; width: 100%; text-align: center;";

    form.innerHTML =
      '<div style="font-size:36px; margin-bottom:8px;">👩‍🏫</div>' +
      '<h3 style="margin:0 0 6px; font-family:Nunito,sans-serif; font-size:20px; font-weight:800; color:#0f172a;">Teacher Mode Access</h3>' +
      '<p style="margin:0 0 18px; font-size:13.5px; color:#64748b;">Enter your teacher PIN to unlock answer keys, lesson plans, IEP accommodations, and teacher tools.</p>' +
      '<input type="text" name="username" value="teacher" autocomplete="username" readonly tabindex="-1" aria-hidden="true" class="nt-credential-user" style="display:none;" />' +
      '<input type="password" name="password" class="hub-teacher-pin" autocomplete="current-password" placeholder="Enter teacher password" aria-label="Enter teacher password" style="width:100%; min-height:46px; padding:0 16px; border:1.5px solid #cbd5e1; border-radius:12px; font-size:15px; margin-bottom:14px; outline:none;" />' +
      '<div style="display:flex; gap:10px;">' +
      '<button type="button" class="hub-teacher-cancel" style="flex:1; min-height:44px; border:1px solid #cbd5e1; background:#f8fafc; color:#475569; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer;">Cancel</button>' +
      '<button type="submit" class="hub-teacher-go" style="flex:1; min-height:44px; border:none; background:#0284c7; color:#ffffff; border-radius:10px; font-weight:800; font-size:14px; cursor:pointer;">Unlock</button>' +
      "</div>" +
      '<p class="hub-teacher-err" role="alert" hidden style="margin:12px 0 0; font-size:13px; color:#ef4444; font-weight:700;">That password did not work. Try again.</p>';

    var pin = form.querySelector(".hub-teacher-pin");
    var err = form.querySelector(".hub-teacher-err");
    var cancelBtn = form.querySelector(".hub-teacher-cancel");

    cancelBtn.addEventListener("click", function () {
      overlay.remove();
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var role = matchTeacherPin(String(pin.value || "").trim());
      if (!role) {
        err.hidden = false;
        pin.value = "";
        pin.focus();
        return;
      }
      overlay.remove();
      onRole(role);
    });

    form.addEventListener("keydown", function (e) {
      if (e.key === "Escape") overlay.remove();
    });

    overlay.appendChild(form);
    document.body.appendChild(overlay);
    window.setTimeout(function () {
      pin.focus();
    }, 50);
  }

  function isTeacherResource(act) {
    if (!act) return false;
    var text = (act.text || "").replace(/\s+/g, " ").trim();
    var href = act.href || "";
    if (
      TEACHER_TEXT_PATTERNS.some(function (re) {
        return re.test(text);
      })
    ) {
      return true;
    }
    return TEACHER_HREF_PATTERNS.some(function (re) {
      return re.test(href);
    });
  }

  function lessonIdFromTitle(title) {
    var m = (title || "").match(/Lesson\s+([0-9]+-[0-9]+(?:-flagship)?)/i);
    return m ? m[1] : "";
  }

  function progressKey(lessonId, href) {
    return lessonId + "::" + href;
  }

  function countLessonActivities(lesson) {
    var acts = (lesson.activities || []).concat(lesson.projects || []);
    return acts.filter(function (a) {
      return !teacherMode && isTeacherResource(a) ? false : true;
    }).length;
  }

  function countLessonDone(lesson) {
    var id = lessonIdFromTitle(lesson.title);
    var acts = (lesson.activities || []).concat(lesson.projects || []);
    var done = 0;
    acts.forEach(function (a) {
      if (!teacherMode && isTeacherResource(a)) return;
      if (progress[progressKey(id, a.href)]) done += 1;
    });
    return done;
  }

  function unitProgressPercent(unit) {
    var total = 0;
    var done = 0;
    (unit.lessons || []).forEach(function (l) {
      total += countLessonActivities(l);
      done += countLessonDone(l);
    });
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  function overallProgressPercent() {
    if (!hubApi || !hubApi.unitsData) return 0;
    var total = 0;
    var done = 0;
    hubApi.unitsData.forEach(function (u) {
      (u.lessons || []).forEach(function (l) {
        total += countLessonActivities(l);
        done += countLessonDone(l);
      });
    });
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  function updateStudentHint() {
    var hint = document.getElementById("hub-student-hint");
    if (!hint) return;
    hint.hidden = teacherMode;
  }

  function applyTeacherMode() {
    document.body.classList.toggle("teacher-mode", teacherMode);
    var btn = document.getElementById("hub-mode-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", teacherMode ? "true" : "false");
      // State AND action, both spelled out. This used to print the bare current
      // mode ("🎒 Student Mode"), which reads equally as "you are in student
      // mode" and "click to switch to student mode" — so the one control that
      // answers "which mode am I in?" was the reason nobody could tell. The
      // teacher-only panels render nothing in student mode, so an ambiguous
      // label here looks exactly like a broken or un-deployed page.
      btn.textContent = teacherMode
        ? "👩‍🏫 You're in Teacher view — switch to Student"
        : "🎒 You're in Student view — switch to Teacher";
      btn.title = teacherMode
        ? "Teacher view: pacing console and command center are visible. Click to switch to the student view."
        : "Student view: teacher-only panels are hidden. Click to switch to the teacher view.";
    }
    updateStudentHint();
    refreshHub();
    document.dispatchEvent(new CustomEvent("nt:mode-change"));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    var lower = text.toLowerCase();
    var q = query.toLowerCase();
    var idx = lower.indexOf(q);
    if (idx === -1) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, idx)) +
      '<mark class="search-highlight">' +
      escapeHtml(text.slice(idx, idx + query.length)) +
      "</mark>" +
      escapeHtml(text.slice(idx + query.length))
    );
  }

  function activityMatchesFilter(act, filter) {
    if (filter === FILTER_ALL) return true;
    var rule = FILTER_RULES[filter];
    if (!rule) return true;
    var hay = (act.text || "") + " " + (act.href || "");
    return rule.test(hay);
  }

  function lessonMatchesFilter(lesson, filter) {
    if (filter === FILTER_ALL) return true;
    var acts = (lesson.activities || []).concat(lesson.projects || []);
    return acts.some(function (a) {
      return activityMatchesFilter(a, filter);
    });
  }

  function filterUnitsData(unitsData, query, filter) {
    var q = (query || "").trim();
    if (!q && filter === FILTER_ALL) return unitsData;

    // Standard-code queries (e.g. "6.rp", "6.rp.3", "6.rp.3a") must narrow to
    // the lessons actually tagged with that standard. MiniSearch tokenizes on
    // punctuation and OR-combines, so the shared "6" token matches every
    // lesson — instead match the standard prefix directly against each
    // lesson's indexed text (the same source the standard dropdowns derive
    // from), so "6.rp.3" also captures "6.rp.3a/b/c" but nothing outside 6.AT.
    if (/^6\.(rp|ns|ee|g|sp)(\.[0-9]+[a-z]?)?$/.test(q.toLowerCase())) {
      var token = q.toLowerCase();
      return unitsData
        .map(function (u) {
          var lessons = (u.lessons || []).filter(function (l) {
            var text = (l.dataSearch || "") + " " + (l.title || "").toLowerCase();
            return text.indexOf(token) > -1 && lessonMatchesFilter(l, filter);
          });
          if (!lessons.length) return null;
          return Object.assign({}, u, { lessons: lessons });
        })
        .filter(Boolean);
    }

    if (searchIndex && q.length >= 2) {
      // MiniSearch OR-combines terms by default, and every lesson's indexed text
      // carries its "Unit N" label — so a two-word query like "unit rate"
      // matched all 74 lessons and the result list was noise. Require every term
      // first; fall back to OR only when that finds nothing, so a typo or an
      // unindexed word still returns the near misses instead of an empty page.
      var hits = searchIndex.search(q, { prefix: true, fuzzy: 0.15, combineWith: "AND" });
      if (!hits.length) hits = searchIndex.search(q, { prefix: true, fuzzy: 0.15 });
      var lessonIds = {};
      hits.forEach(function (h) {
        if (h.id) lessonIds[h.id] = h.score;
      });
      return unitsData
        .map(function (u) {
          var lessons = (u.lessons || []).filter(function (l) {
            var lid = l.lessonId || l.id || lessonIdFromTitle(l.title);
            var idMatch = lessonIds[lid] != null;
            var filterMatch = lessonMatchesFilter(l, filter);
            return idMatch && filterMatch;
          });
          if (!lessons.length) return null;
          return Object.assign({}, u, { lessons: lessons });
        })
        .filter(Boolean);
    }

    var ql = q.toLowerCase();
    return unitsData
      .map(function (u) {
        var lessons = (u.lessons || []).filter(function (l) {
          var lText = (l.dataSearch || "") + " " + (l.title || "").toLowerCase();
          var textMatch = !ql || lText.indexOf(ql) > -1;
          var filterMatch = lessonMatchesFilter(l, filter);
          return textMatch && filterMatch;
        });
        if (!lessons.length) return null;
        return Object.assign({}, u, { lessons: lessons });
      })
      .filter(Boolean);
  }

  function loadSearchIndex() {
    return loadJson("/data/curriculum-search-index.json").then(function (data) {
      if (!data || !data.index) return;
      if (typeof MiniSearch === "undefined") return;
      // data.index is the parsed object from miniSearch.toJSON(), so use
      // loadJS (loadJSON expects a string). The fields/storeFields lists MUST
      // mirror scripts/generate-curriculum-search-index.mjs exactly — the
      // serialized index does not carry them.
      searchIndex = MiniSearch.loadJS(data.index, {
        fields: [
          "title",
          "standard",
          "objective",
          "languageObjective",
          "topic",
          "resources",
          "searchText",
        ],
        storeFields: [
          "id",
          "unit",
          "unitLabel",
          "lesson",
          "title",
          "standard",
          "objective",
          "lessonPath",
        ],
        searchOptions: {
          boost: { title: 3, standard: 2, objective: 1.5 },
          fuzzy: 0.2,
          prefix: true,
        },
      });
    });
  }

  function loadLessonStandards() {
    return loadJson("/data/curriculum-manifest.json").then(function (data) {
      if (!data || !Array.isArray(data.lessons)) return;
      data.lessons.forEach(function (l) {
        if (l.id && l.standard) lessonStandards[l.id] = l.standard;
      });
    });
  }

  function standardForLesson(lessonId) {
    if (!lessonId) return "";
    return lessonStandards[lessonId] || lessonStandards[lessonId.replace("-flagship", "")] || "";
  }

  function injectStandardBadge(infoBlock, lessonId) {
    if (!infoBlock || !lessonId) return;
    var code = standardForLesson(lessonId);
    var existing = infoBlock.querySelector(".lesson-standard-badge");
    if (!code) {
      if (existing) existing.remove();
      return;
    }
    if (existing) {
      existing.textContent = code;
      return;
    }
    // Non-navigating on purpose: these are Maryland 2025 MCCRS codes with no
    // stable public URL (the old corestandards.org path 404s for every code).
    var badge = document.createElement("span");
    badge.className = "lesson-standard-badge badge badge-cluster";
    badge.title = "Maryland College and Career Ready Standard";
    badge.textContent = code;
    var obj = infoBlock.querySelector(".lesson-info-obj");
    if (obj) infoBlock.insertBefore(badge, obj);
    else infoBlock.insertBefore(badge, infoBlock.firstChild);
  }

  function buildControls() {
    var controls = document.querySelector(".controls");
    if (!controls || document.getElementById("hub-enhance-bar")) return;

    var bar = document.createElement("div");
    bar.id = "hub-enhance-bar";
    bar.className = "hub-enhance-controls";

    var modeBtn = document.createElement("button");
    modeBtn.type = "button";
    modeBtn.id = "hub-mode-toggle";
    modeBtn.className = "hub-mode-toggle";
    modeBtn.setAttribute("aria-pressed", "false");
    modeBtn.textContent = "🎒 Student Mode";
    modeBtn.addEventListener("click", function () {
      // Switching INTO teacher requires the password; back to student is free.
      if (!teacherMode) {
        requestTeacher(modeBtn, function (role) {
          teacherMode = true;
          saveTeacherMode(true, role);
          applyTeacherMode();
          updateProgressSummary();
        });
        return;
      }
      teacherMode = false;
      saveTeacherMode(false);
      applyTeacherMode();
      updateProgressSummary();
    });
    bar.appendChild(modeBtn);

    var dashLink = document.createElement("a");
    dashLink.href = "/teacher-tools/curriculum-dashboard/";
    // Teacher-only: hidden in the public Student-Mode default via CSS
    // (body:not(.teacher-mode) .hub-teacher-only { display:none }).
    dashLink.className = "hub-mode-toggle hub-teacher-only";
    dashLink.textContent = "📊 Teacher Dashboard";
    dashLink.title = "Teacher only — class progress summary";
    bar.appendChild(dashLink);

    var hint = document.createElement("p");
    hint.id = "hub-student-hint";
    hint.className = "hub-student-hint";
    hint.hidden = true;
    hint.innerHTML =
      "Student view hides teacher-only links (Google Slides, Forms, printable packets). " +
      '<button type="button" class="hub-hint-link" id="hub-hint-teacher">Switch to Teacher Mode</button> ' +
      "to restore them.";
    hint.querySelector("#hub-hint-teacher").addEventListener("click", function () {
      requestTeacher(function (role) {
        teacherMode = true;
        saveTeacherMode(true, role);
        applyTeacherMode();
        updateProgressSummary();
      });
    });
    controls.parentNode.insertBefore(hint, controls);

    // Top-of-page mode banner. The mode controls live ~1300px down the hub, so
    // a teacher in student view scrolls past a page where EVERY teacher panel
    // (district pacing console, Teacher Command Center) has rendered nothing —
    // which is indistinguishable from a broken site or a deploy that never
    // landed. This states the view at the top, before any of that confusion.
    // It reuses requestTeacher() rather than duplicating the PIN gate.
    var header = document.querySelector(".curriculum-guide");
    var h1 = header && header.querySelector("h1");
    if (h1) {
      var banner = document.createElement("p");
      banner.id = "hub-mode-banner";
      banner.className = "hub-mode-banner hub-student-only";
      var bannerText = document.createElement("span");
      bannerText.textContent = "🎒 You're in Student view — teacher tools are hidden. ";
      var bannerBtn = document.createElement("button");
      bannerBtn.type = "button";
      bannerBtn.className = "hub-hint-link";
      bannerBtn.id = "hub-mode-banner-switch";
      bannerBtn.textContent = "Switch to Teacher view";
      bannerBtn.addEventListener("click", function () {
        requestTeacher(function (role) {
          teacherMode = true;
          saveTeacherMode(true, role);
          applyTeacherMode();
          updateProgressSummary();
        });
      });
      banner.append(bannerText, bannerBtn);
      h1.parentNode.insertBefore(banner, h1.nextSibling);
    }

    controls.parentNode.insertBefore(bar, controls.nextSibling);

    var chips = document.createElement("div");
    chips.className = "hub-filter-chips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Filter resources by category");

    [
      { id: FILTER_ALL, label: "All" },
      { id: "lessons", label: "Lessons" },
      { id: "smallgroup", label: "💡 Small-Group" },
      { id: "homework", label: "Homework" },
      { id: "games", label: "Games" },
      { id: "notes", label: "Notes" },
    ].forEach(function (chip) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hub-filter-chip";
      btn.dataset.filter = chip.id;
      btn.textContent = chip.label;
      btn.setAttribute("aria-pressed", chip.id === FILTER_ALL ? "true" : "false");
      btn.addEventListener("click", function () {
        activeFilter = chip.id;
        chips.querySelectorAll(".hub-filter-chip").forEach(function (c) {
          c.setAttribute("aria-pressed", c.dataset.filter === activeFilter ? "true" : "false");
        });
        runSearch();
      });
      chips.appendChild(btn);
    });

    controls.parentNode.insertBefore(chips, bar.nextSibling);

    var summary = document.createElement("p");
    summary.id = "hub-progress-summary";
    summary.className = "hub-progress-summary";
    summary.setAttribute("role", "status");
    chips.parentNode.insertBefore(summary, chips.nextSibling);

    var sticky = document.getElementById("hub-toolbar-sticky");
    if (!sticky) {
      sticky = document.createElement("div");
      sticky.id = "hub-toolbar-sticky";
      sticky.className = "hub-toolbar-sticky";
      var anchor = document.getElementById("hub-student-hint") || controls;
      anchor.parentNode.insertBefore(sticky, anchor);
    }
    [document.getElementById("hub-student-hint"), controls, bar, chips, summary].forEach(
      function (el) {
        if (el && el.parentNode !== sticky) {
          sticky.appendChild(el);
        }
      },
    );
  }

  function updateProgressSummary() {
    var el = document.getElementById("hub-progress-summary");
    if (!el) return;
    var pct = overallProgressPercent();
    el.innerHTML =
      "Your progress: <strong>" +
      pct +
      "%</strong> of visible activities marked complete. Toggle ✓ on any activity to track.";
  }

  function clusterAlignment(cluster) {
    if (!cluster) return [];
    var code = String(cluster).trim();
    return [
      {
        "@type": "AlignmentObject",
        alignmentType: "educationalSubject",
        educationalFramework: "Common Core State Standards for Mathematics",
        targetName: code,
        targetUrl: "http://corestandards.org/Math/Content/" + code.replace(".", "/"),
      },
    ];
  }

  function injectJsonLd() {
    if (document.getElementById("curriculum-jsonld")) return;
    if (!hubApi || !hubApi.unitsData) return;

    var courseParts = hubApi.unitsData.map(function (u, i) {
      return {
        "@type": "CourseInstance",
        name: u.num + " — " + u.name,
        description: u.blurb || "",
        position: i + 1,
        educationalAlignment: clusterAlignment(u.cluster),
        hasPart: (u.lessons || []).map(function (l, j) {
          return {
            "@type": "LearningResource",
            name: l.title,
            position: j + 1,
            learningResourceType: "lesson",
          };
        }),
      };
    });

    var schema = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Neft Teacher Grade 6 Math Curriculum",
      description:
        "Grade 6 math curriculum hub with interactive lessons, guided notes, homework, games, and assessments organized by unit.",
      provider: {
        "@type": "Organization",
        name: "Neft Teacher",
      },
      hasCourseInstance: courseParts,
      educationalLevel: "Grade 6",
      inLanguage: "en",
    };

    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "curriculum-jsonld";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function enhancePrintFallbackAria() {
    document.querySelectorAll("details.unit, details.lesson").forEach(function (el) {
      if (!el.hasAttribute("aria-expanded")) {
        el.setAttribute("aria-expanded", el.open ? "true" : "false");
      }
      el.addEventListener("toggle", function () {
        el.setAttribute("aria-expanded", el.open ? "true" : "false");
      });
    });
  }

  function markTeacherLinksInSource() {
    document.querySelectorAll("details.lesson .res").forEach(function (a) {
      var text = a.textContent.replace(/\s+/g, " ").trim();
      var href = a.getAttribute("href") || "";
      if (
        TEACHER_TEXT_PATTERNS.some(function (re) {
          return re.test(text);
        }) ||
        TEACHER_HREF_PATTERNS.some(function (re) {
          return re.test(href);
        })
      ) {
        a.classList.add("teacher-only");
      }
    });
    var tt = document.querySelector("details.teacher-tools");
    if (tt) tt.classList.add("teacher-only");
  }

  function wrapRenderSearchResults() {
    if (!hubApi || hubApi._enhancedSearch) return;
    var _original = hubApi.renderSearchResults;

    hubApi.renderSearchResults = function (q) {
      var filtered = filterUnitsData(hubApi.unitsData, q, activeFilter);
      if (!filtered.length) {
        hubApi.hubEl.innerHTML = "";
        hubApi.noResultsEl.classList.add("show");
        var panel = document.createElement("div");
        panel.className = "search-results-panel";
        panel.innerHTML =
          '<p class="search-empty-enhanced">No lessons match <strong>' +
          escapeHtml(q) +
          "</strong>" +
          (activeFilter !== FILTER_ALL
            ? " in <strong>" + escapeHtml(activeFilter) + "</strong>"
            : "") +
          '.</p><button type="button" class="hub-clear-filters">Clear search &amp; filters</button>';
        panel.querySelector(".hub-clear-filters").addEventListener("click", function () {
          if (hubApi.searchBox) hubApi.searchBox.value = "";
          activeFilter = FILTER_ALL;
          document.querySelectorAll(".hub-filter-chip").forEach(function (c) {
            c.setAttribute("aria-pressed", c.dataset.filter === FILTER_ALL ? "true" : "false");
          });
          runSearch();
        });
        hubApi.hubEl.appendChild(panel);
        return;
      }

      hubApi.noResultsEl.classList.remove("show");
      hubApi.hubEl.innerHTML = "";
      var panel = document.createElement("div");
      panel.className = "search-results-panel";

      var title = document.createElement("h2");
      title.style.fontSize = "18px";
      title.style.color = "var(--navy)";
      title.style.fontFamily = "Outfit, sans-serif";
      title.style.marginBottom = "12px";
      title.innerHTML = "Search Results for " + highlightText('"' + q + '"', q);
      panel.appendChild(title);

      filtered.forEach(function (u) {
        u.lessons.forEach(function (l) {
          var item = document.createElement("div");
          item.className = "search-result-item";

          var unitLabel = document.createElement("span");
          unitLabel.className = "search-result-unit";
          unitLabel.textContent = u.num + " · " + u.name;
          item.appendChild(unitLabel);

          var header = document.createElement("div");
          header.className = "search-result-header";
          header.innerHTML = highlightText(l.title, q);
          item.appendChild(header);

          var lessonId = lessonIdFromTitle(l.title);
          var std = standardForLesson(l.lessonId || lessonId);
          if (std) {
            var stdEl = document.createElement("p");
            stdEl.className = "lesson-standard-line";
            stdEl.innerHTML =
              '<a class="lesson-standard-badge badge badge-cluster" href="http://corestandards.org/Math/Content/' +
              std.replace(".", "/") +
              '" target="_blank" rel="noopener noreferrer">' +
              escapeHtml(std) +
              "</a>";
            item.appendChild(stdEl);
          }
          var rw = realWorldMap[lessonId] || realWorldMap[lessonId.replace("-flagship", "")];
          if (rw) {
            var rwEl = document.createElement("p");
            rwEl.className = "lesson-real-world";
            rwEl.innerHTML =
              '<span class="lesson-real-world-label">Real-World Connection</span>' + escapeHtml(rw);
            item.appendChild(rwEl);
          }

          if (l.objective) {
            var obj = document.createElement("p");
            obj.className = "lesson-info-obj";
            obj.style.marginBottom = "12px";
            obj.innerHTML = highlightText(l.objective, q);
            item.appendChild(obj);
          }

          var outlineList = document.createElement("ul");
          outlineList.className = "lesson-outline-list";
          var allActs = (l.activities || []).concat(l.projects || []);
          allActs.forEach(function (act) {
            if (!teacherMode && isTeacherResource(act)) return;
            if (!activityMatchesFilter(act, activeFilter)) return;

            var li = document.createElement("li");
            li.className = "lesson-outline-item";

            var check = document.createElement("button");
            check.type = "button";
            check.className = "progress-check";
            check.setAttribute("aria-label", "Mark complete: " + act.text);
            var key = progressKey(lessonId, act.href);
            var isDone = !!progress[key];
            check.setAttribute("aria-pressed", isDone ? "true" : "false");
            check.textContent = isDone ? "✓" : "○";
            check.addEventListener("click", function (e) {
              e.preventDefault();
              progress[key] = !progress[key];
              if (!progress[key]) delete progress[key];
              saveProgress();
              syncProgressToggle(lessonId, act.href, !!progress[key]);
              check.setAttribute("aria-pressed", progress[key] ? "true" : "false");
              check.textContent = progress[key] ? "✓" : "○";
              updateProgressSummary();
              enhanceUnitCards();
            });
            li.appendChild(check);

            var a = document.createElement("a");
            a.href = act.href;
            a.target = "_blank";
            a.rel = "noopener";
            if (act.isBonus) a.className = "res-bonus";
            a.textContent = act.text;
            li.appendChild(a);
            // One-click Canvas (SCORM) download — demoted behind "More".
            if (window.NeftScorm && window.NeftScorm.canPackage(act.href)) {
              appendOutlineAction(
                li,
                window.NeftScorm.makeLink(
                  act.href,
                  (l.title ? l.title + " — " : "") + act.text,
                  "⬇",
                  "scorm-dl",
                ),
              );
            }
            // One-click print — demoted behind "More" with SCORM.
            if (isPrintableActivity(act.text, act.href)) {
              var printBtn = document.createElement("button");
              printBtn.type = "button";
              printBtn.className = "lesson-print-activity";
              printBtn.textContent = "🖨";
              printBtn.title = "Print “" + act.text + "”";
              printBtn.setAttribute("aria-label", "Print: " + act.text);
              printBtn.addEventListener(
                "click",
                (function (href) {
                  return function (e) {
                    e.preventDefault();
                    printActivity(href);
                  };
                })(act.href),
              );
              appendOutlineAction(li, printBtn);
            } else {
              // Interactive-lesson row → print the full lesson packet.
              var packet = lessonPacketHref(act.href);
              if (packet) {
                var pktBtn = document.createElement("button");
                pktBtn.type = "button";
                pktBtn.className = "lesson-print-activity lesson-print-packet";
                pktBtn.textContent = "🖨";
                pktBtn.title = "Print full lesson packet";
                pktBtn.setAttribute("aria-label", "Print full lesson packet");
                pktBtn.addEventListener(
                  "click",
                  (function (url) {
                    return function (e) {
                      e.preventDefault();
                      printActivity(url);
                    };
                  })(packet),
                );
                appendOutlineAction(li, pktBtn);
              }
            }
            outlineList.appendChild(li);
          });
          item.appendChild(outlineList);
          panel.appendChild(item);
        });
      });

      hubApi.hubEl.appendChild(panel);
    };

    hubApi._enhancedSearch = true;
  }

  var CANONICAL_ORIGIN = "https://eduwonderlab.com";

  function buildLessonShareLink(card, unit) {
    var lessonSelect = card.querySelector(".lesson-select");
    if (!lessonSelect) return null;
    var lessonIdx = parseInt(lessonSelect.value, 10) || 0;
    var lesson = unit.lessons[lessonIdx];
    if (!lesson || !lesson.lessonId) return null;
    var qs =
      "?u=" + encodeURIComponent(unit.unitIndex) + "&l=" + encodeURIComponent(lesson.lessonId);
    var launch = card.querySelector(".btn-launch");
    var aHref = launch && launch.style.display !== "none" ? launch.getAttribute("href") : "";
    if (aHref && aHref !== "#") qs += "&a=" + encodeURIComponent(aHref);
    return CANONICAL_ORIGIN + "/curriculum/" + qs;
  }

  // Student-safe launch URL used by /curriculum/student-launch/ — no teacher
  // workflow / PIN required. Only core + flagship lesson IDs are valid there.
  function buildStudentLaunchLink(card, unit) {
    var lessonSelect = card.querySelector(".lesson-select");
    if (!lessonSelect) return null;
    var lessonIdx = parseInt(lessonSelect.value, 10) || 0;
    var lesson = unit.lessons[lessonIdx];
    if (!lesson || !lesson.lessonId) return null;
    if (!/^[0-9]{1,2}-[0-9]{1,2}(?:-flagship)?$/i.test(lesson.lessonId)) return null;
    return (
      CANONICAL_ORIGIN + "/curriculum/student-launch/?lesson=" + encodeURIComponent(lesson.lessonId)
    );
  }

  function ensureOutlineMore(li) {
    if (!li) return null;
    var more = li.querySelector(".outline-more");
    if (!more) {
      more = document.createElement("details");
      more.className = "outline-more";
      var sum = document.createElement("summary");
      sum.textContent = "More";
      sum.setAttribute("aria-label", "More actions");
      var body = document.createElement("div");
      body.className = "outline-more-body";
      more.appendChild(sum);
      more.appendChild(body);
      li.appendChild(more);
    }
    var bodyEl = more.querySelector(".outline-more-body");
    Array.prototype.slice.call(li.children).forEach(function (node) {
      if (
        node.classList &&
        (node.classList.contains("scorm-dl") || node.classList.contains("lesson-print-activity"))
      ) {
        bodyEl.appendChild(node);
      }
    });
    return bodyEl;
  }

  function appendOutlineAction(li, node) {
    if (!li || !node) return;
    ensureOutlineMore(li).appendChild(node);
  }

  function isCoreLessonRow(l) {
    if (!l || l.isEndOfUnit) return false;
    return /^\d+-\d+(-flagship)?$/i.test(l.lessonId || "");
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  // Activities that make sense to print: document downloads and any
  // paper-friendly resource (notes, worksheets, handouts, homework, slides,
  // study guides, answer keys). Interactive games/arcades are excluded.
  function isPrintableActivity(text, href) {
    var s = ((text || "") + " " + (href || "")).toLowerCase();
    if (/\.(pdf|docx?|pptx?|xlsx?)([?#]|$)/.test(href || "")) return true;
    if (/\b(game|arcade|interactive game)\b/.test(s)) return false;
    return /(worksheet|notes|handout|homework|printable|packet|family|study guide|answer key|slides|pre-?test|post-?test|exit ticket)/.test(
      s,
    );
  }

  // Given an INTERACTIVE-LESSON link (/lessons/<id>/ or /lessons/<id>/index.html),
  // return its full printable packet URL (/lessons/<id>/printable.html) — the
  // paper version of the whole lesson. Returns "" for anything else, including
  // deep-links into the lesson (e.g. /lessons/<id>/?extra=activity), the
  // readiness page, and per-resource pages (notes.html, worksheet.html, …) which
  // already carry their own print button via isPrintableActivity(). Single source
  // of truth for the packet URL, reused by every row builder + curriculum-top1.js.
  function lessonPacketHref(href) {
    var m = String(href || "").match(/^(.*\/lessons\/[^/?#]+)\/?(?:index\.html)?$/);
    return m ? m[1] + "/printable.html" : "";
  }

  // Open a single activity/resource for printing. Same-origin printable pages
  // are auto-sent to the print dialog once loaded; anything else (cross-origin,
  // PDF viewer, popup-blocked) simply opens so the teacher can Cmd/Ctrl+P.
  function printActivity(href) {
    if (!href || href === "#") return;
    var w = window.open(href, "_blank");
    if (!w) return;
    try {
      w.addEventListener("load", function () {
        try {
          w.focus();
          w.print();
        } catch (_e) {
          /* cross-origin or blocked — manual print */
        }
      });
    } catch (_e) {
      /* window handle not scriptable — manual print */
    }
  }

  // Expose the print helpers so OTHER hub layers (e.g. the top1 "Start here"
  // command center in curriculum-top1.js) reuse this exact same classifier +
  // print action instead of re-implementing it. Mirrors window.NeftScorm.
  window.NeftPrint = {
    canPrint: isPrintableActivity,
    print: printActivity,
    packetHref: lessonPacketHref,
  };

  // Print a clean one-page sheet for the currently-selected lesson: objective,
  // standard, real-world hook, and the full grouped activity list. Built from a
  // clone of the live .lesson-info so it always reflects the current lesson;
  // interactive controls (buttons, selectors, checkboxes) are stripped.
  function printLessonSheet(card, unit) {
    var info = card.querySelector(".lesson-info");
    if (!info) return;
    var sel = card.querySelector(".lesson-select");
    var lessonTitle =
      sel && sel.options[sel.selectedIndex]
        ? sel.options[sel.selectedIndex].textContent.trim()
        : "Lesson";
    var clone = info.cloneNode(true);
    clone
      .querySelectorAll(
        "button, .lesson-copy-link, .lesson-print-lesson, .lesson-print-activity, .progress-check, .selector-group, select, .btn-launch, .scorm-dl, .scorm-lesson-btn, script",
      )
      .forEach(function (n) {
        n.remove();
      });
    var w = window.open("", "_blank");
    if (!w) return;
    var title = escapeHtml((unit && unit.num ? unit.num + " · " : "") + lessonTitle);
    var doc =
      '<!doctype html><html><head><meta charset="utf-8"><title>' +
      title +
      '</title><base href="' +
      CANONICAL_ORIGIN +
      '/"><style>' +
      'body{font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111;max-width:760px;margin:26px auto;padding:0 22px}' +
      "h1{font-size:22px;margin:0 0 2px}.print-sub{color:#555;margin:0 0 18px;font-size:13px}" +
      "a{color:#0645ad;text-decoration:none}ul{padding-left:20px;margin:6px 0}li{margin:5px 0}" +
      ".lesson-outline-group-title{display:block;font-weight:700;margin:14px 0 4px}" +
      ".lesson-outline-list{list-style:none;padding-left:0}" +
      ".badge,.lesson-info-obj,.lesson-real-world{display:block;margin:8px 0}" +
      "@media print{a{color:#111}}" +
      "</style></head><body><h1>" +
      title +
      '</h1><p class="print-sub">Neft Teacher · Grade 6 Math · eduwonderlab.com/curriculum</p>' +
      clone.innerHTML +
      "<scr" +
      "ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};</scr" +
      "ipt></body></html>";
    w.document.open();
    w.document.write(doc);
    w.document.close();
  }

  function injectPrintLesson(card, unit) {
    var infoBlock = card.querySelector(".lesson-info");
    if (!infoBlock || infoBlock.querySelector(".lesson-print-lesson")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lesson-print-lesson";
    btn.innerHTML = "🖨 Print lesson";
    btn.title = "Print this lesson — objective, standard, and its full activity list";
    btn.addEventListener("click", function () {
      printLessonSheet(card, unit);
    });
    var copy =
      infoBlock.querySelector(".lesson-student-launch-copy") ||
      infoBlock.querySelector(".lesson-copy-link");
    if (copy && copy.parentNode) copy.parentNode.insertBefore(btn, copy.nextSibling);
    else infoBlock.appendChild(btn);
  }

  function injectCopyLink(card, unit) {
    var infoBlock = card.querySelector(".lesson-info");
    if (!infoBlock || infoBlock.querySelector(".lesson-copy-link")) return;
    var launch = infoBlock.querySelector(".btn-launch");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lesson-copy-link";
    btn.innerHTML = "🔗 Copy link";
    btn.title = "Copy a shareable link to this lesson (for Classroom / Canvas)";
    btn.addEventListener("click", function () {
      var link = buildLessonShareLink(card, unit);
      if (!link) return;
      copyToClipboard(link).then(
        function () {
          var prev = btn.innerHTML;
          btn.innerHTML = "✓ Copied!";
          btn.classList.add("copied");
          setTimeout(function () {
            btn.innerHTML = prev;
            btn.classList.remove("copied");
          }, 1600);
        },
        function () {
          btn.innerHTML = "Press ⌘/Ctrl+C";
          setTimeout(function () {
            btn.innerHTML = "🔗 Copy link";
          }, 2000);
        },
      );
    });

    if (launch && launch.parentNode) {
      launch.parentNode.insertBefore(btn, launch.nextSibling);
    } else {
      infoBlock.appendChild(btn);
    }
  }

  // Surface student-launch copy on the unit lesson card without opening the
  // teacher workflow / PIN wall. Builds /curriculum/student-launch/?lesson=…
  function injectStudentLaunchCopy(card, unit) {
    var infoBlock = card.querySelector(".lesson-info");
    if (!infoBlock || infoBlock.querySelector(".lesson-student-launch-copy")) return;
    var after =
      infoBlock.querySelector(".lesson-copy-link") || infoBlock.querySelector(".btn-launch");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lesson-copy-link lesson-student-launch-copy";
    btn.innerHTML = "🎒 Copy student launch";
    btn.title =
      "Copy the student-safe launch link (/curriculum/student-launch/) — no teacher PIN needed";
    btn.addEventListener("click", function () {
      var link = buildStudentLaunchLink(card, unit);
      if (!link) {
        var prevMissing = btn.innerHTML;
        btn.innerHTML = "Pick a core lesson";
        setTimeout(function () {
          btn.innerHTML = prevMissing;
        }, 1600);
        return;
      }
      copyToClipboard(link).then(
        function () {
          var prev = btn.innerHTML;
          btn.innerHTML = "✓ Student link copied";
          btn.classList.add("copied");
          setTimeout(function () {
            btn.innerHTML = prev;
            btn.classList.remove("copied");
          }, 1600);
        },
        function () {
          btn.innerHTML = "Press ⌘/Ctrl+C";
          setTimeout(function () {
            btn.innerHTML = "🎒 Copy student launch";
          }, 2000);
        },
      );
    });

    if (after && after.parentNode) {
      after.parentNode.insertBefore(btn, after.nextSibling);
    } else {
      infoBlock.appendChild(btn);
    }
  }

  function printSingleUnit(idx, unitName) {
    // The units are hidden, not detached (see hidePrintFallbackUnits in
    // assets/curriculum-guided-path.js), so a plain document query finds them.
    var target = document.querySelectorAll("details.unit")[idx];
    if (!target) {
      window.print();
      return;
    }
    target.classList.add("print-this-unit");
    document.body.classList.add("print-single-unit");
    var header = document.getElementById("hub-print-header");
    var prevHeader = header ? header.innerHTML : null;
    if (header) {
      header.innerHTML =
        "<h2>" +
        escapeHtml(unitName) +
        "</h2><p>Neft Teacher · Grade 6 Math · eduwonderlab.com/curriculum</p>";
    }
    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      target.classList.remove("print-this-unit");
      document.body.classList.remove("print-single-unit");
      if (header && prevHeader != null) header.innerHTML = prevHeader;
      window.removeEventListener("afterprint", cleanup);
    }
    window.addEventListener("afterprint", cleanup);
    setTimeout(cleanup, 8000);
    window.print();
  }

  function injectPrintUnit(card, unit, idx) {
    var row = card.querySelector(".unit-resources-row");
    if (!row) {
      var header = card.querySelector(".unit-card-header");
      row = document.createElement("div");
      row.className = "unit-resources-row";
      if (header && header.nextSibling) {
        header.parentNode.insertBefore(row, header.nextSibling);
      } else {
        card.appendChild(row);
      }
    }
    if (row.querySelector(".unit-print-btn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "unit-resource-btn unit-print-btn";
    btn.innerHTML = "🖨 Print unit";
    btn.title = "Print just this unit";
    btn.addEventListener("click", function () {
      printSingleUnit(idx, unit.num + " · " + unit.name);
    });
    row.appendChild(btn);
  }

  function enhanceUnitCards() {
    if (!hubApi || !hubApi.hubEl) return;
    var cards = hubApi.hubEl.querySelectorAll(".unit-card");
    if (!cards.length) return;

    hubApi.unitsData.forEach(function (u, idx) {
      var card = cards[idx];
      if (!card) return;
      card.id = "unit-" + (idx + 1);

      injectPrintUnit(card, u, idx);

      var meta = card.querySelector(".unit-card-meta");
      if (meta && !meta.querySelector(".unit-progress-wrap")) {
        var pct = unitProgressPercent(u);
        var wrap = document.createElement("div");
        wrap.className = "unit-progress-wrap";
        wrap.innerHTML =
          '<div class="unit-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
          pct +
          '" aria-label="Unit progress">' +
          '<div class="unit-progress-fill" style="width:' +
          pct +
          '%"></div></div>' +
          '<span class="unit-progress-label">' +
          pct +
          "%</span>";
        meta.appendChild(wrap);
      } else if (meta) {
        var fill = meta.querySelector(".unit-progress-fill");
        var label = meta.querySelector(".unit-progress-label");
        var bar = meta.querySelector(".unit-progress-bar");
        var pct = unitProgressPercent(u);
        if (fill) fill.style.width = pct + "%";
        if (label) label.textContent = pct + "%";
        if (bar) bar.setAttribute("aria-valuenow", String(pct));
      }

      var lessonSelect = card.querySelector(".lesson-select");
      var infoBlock = card.querySelector(".lesson-info");
      if (!lessonSelect || !infoBlock) return;

      var lessonIdx = parseInt(lessonSelect.value, 10) || 0;
      var lesson = u.lessons[lessonIdx];
      if (!lesson) return;

      var lessonId = lessonIdFromTitle(lesson.title);
      injectStandardBadge(infoBlock, lesson.lessonId || lessonId);
      injectCopyLink(card, u);
      injectStudentLaunchCopy(card, u);
      injectPrintLesson(card, u);
      var rw = realWorldMap[lessonId] || realWorldMap[lessonId.replace("-flagship", "")];
      var existingRw = infoBlock.querySelector(".lesson-real-world");
      if (rw && !existingRw) {
        var rwEl = document.createElement("p");
        rwEl.className = "lesson-real-world";
        rwEl.innerHTML =
          '<span class="lesson-real-world-label">Real-World Connection</span>' + escapeHtml(rw);
        var obj = infoBlock.querySelector(".lesson-info-obj");
        if (obj) infoBlock.insertBefore(rwEl, obj);
        else infoBlock.insertBefore(rwEl, infoBlock.firstChild);
      } else if (!rw && existingRw) {
        existingRw.remove();
      }

      var outlineList = card.querySelector(".lesson-outline-list");
      if (!outlineList) return;

      outlineList.querySelectorAll(".lesson-outline-item").forEach(function (li) {
        if (li.querySelector(".progress-check")) return;
        var link = li.querySelector("a");
        if (!link) return;
        var href = link.getAttribute("href");
        var text = link.textContent.trim();

        if (!teacherMode && isTeacherResource({ text: text, href: href })) {
          li.style.display = "none";
          return;
        }
        if (
          activeFilter !== FILTER_ALL &&
          !activityMatchesFilter({ text: text, href: href }, activeFilter)
        ) {
          li.style.display = "none";
          return;
        }
        li.style.display = "";

        var check = document.createElement("button");
        check.type = "button";
        check.className = "progress-check";
        check.setAttribute("aria-label", "Mark complete: " + text);
        var key = progressKey(lessonId, href);
        var isDone = !!progress[key];
        check.setAttribute("aria-pressed", isDone ? "true" : "false");
        check.textContent = isDone ? "✓" : "○";
        check.addEventListener("click", function (e) {
          e.preventDefault();
          progress[key] = !progress[key];
          if (!progress[key]) delete progress[key];
          saveProgress();
          syncProgressToggle(lessonId, href, !!progress[key]);
          check.setAttribute("aria-pressed", progress[key] ? "true" : "false");
          check.textContent = progress[key] ? "✓" : "○";
          updateProgressSummary();
          enhanceUnitCards();
        });
        li.insertBefore(check, link);

        if (isPrintableActivity(text, href)) {
          var printBtn = document.createElement("button");
          printBtn.type = "button";
          printBtn.className = "lesson-print-activity";
          printBtn.textContent = "🖨";
          printBtn.title = "Print “" + text + "”";
          printBtn.setAttribute("aria-label", "Print: " + text);
          printBtn.addEventListener("click", function (e) {
            e.preventDefault();
            printActivity(href);
          });
          appendOutlineAction(li, printBtn);
        } else {
          // The interactive-lesson row itself is not a "paper" resource, so it
          // never got a print affordance — but a full printable packet exists.
          // Offer it here so the lesson can be printed straight from the hub.
          var packet = lessonPacketHref(href);
          if (packet) {
            var pktBtn = document.createElement("button");
            pktBtn.type = "button";
            pktBtn.className = "lesson-print-activity lesson-print-packet";
            pktBtn.textContent = "🖨";
            pktBtn.title = "Print full lesson packet";
            pktBtn.setAttribute("aria-label", "Print full lesson packet");
            pktBtn.addEventListener(
              "click",
              (function (url) {
                return function (e) {
                  e.preventDefault();
                  printActivity(url);
                };
              })(packet),
            );
            appendOutlineAction(li, pktBtn);
          }
        }
        // Keep any pre-existing SCORM chip tucked behind More too.
        ensureOutlineMore(li);
      });

      card.querySelectorAll(".activity-select").forEach(function (actSelect) {
        Array.prototype.forEach.call(actSelect.options, function (opt) {
          if (!opt.value) return;
          var text = opt.textContent.trim();
          var href = opt.value;
          opt.hidden = !teacherMode && isTeacherResource({ text: text, href: href });
        });
      });
    });

    updateProgressSummary();
  }

  function patchUpdateCardState() {
    if (!hubApi || !hubApi.hubEl) return;
    hubApi.hubEl.querySelectorAll(".unit-card").forEach(function (card) {
      var lessonSelect = card.querySelector(".lesson-select");
      if (!lessonSelect || lessonSelect._enhancedChange) return;
      lessonSelect._enhancedChange = true;
      lessonSelect.addEventListener("change", function () {
        requestAnimationFrame(function () {
          enhanceUnitCards();
        });
      });
      card.querySelectorAll(".activity-select").forEach(function (actSelect) {
        if (actSelect._enhancedChange) return;
        actSelect._enhancedChange = true;
        actSelect.addEventListener("change", function () {
          requestAnimationFrame(enhanceUnitCards);
        });
      });
    });
  }

  function refreshHub() {
    if (!hubApi) return;
    var q = (hubApi.searchBox && hubApi.searchBox.value) || "";
    if (q.trim()) {
      hubApi.renderSearchResults(q.trim().toLowerCase());
    } else {
      hubApi.renderHub();
    }
    scheduleEnhance();
  }

  function updateResultCount() {
    var el = document.getElementById("result-count");
    if (!el || !hubApi || !hubApi.unitsData) return;
    var q = (hubApi.searchBox && hubApi.searchBox.value) || "";
    var coreTotal = 0;
    var pathwayTotal = 0;
    hubApi.unitsData.forEach(function (u) {
      (u.lessons || []).forEach(function (l) {
        if (isCoreLessonRow(l)) coreTotal++;
        else pathwayTotal++;
      });
    });
    var total = coreTotal + pathwayTotal;
    if (!q.trim() && activeFilter === FILTER_ALL) {
      el.textContent =
        coreTotal + " lessons · " + pathwayTotal + " pathways (small-group / catch-up / projects)";
      return;
    }
    var filtered = filterUnitsData(hubApi.unitsData, q, activeFilter);
    var shownCore = 0;
    var shownPath = 0;
    filtered.forEach(function (u) {
      (u.lessons || []).forEach(function (l) {
        if (isCoreLessonRow(l)) shownCore++;
        else shownPath++;
      });
    });
    var shown = shownCore + shownPath;
    el.textContent = shown
      ? "Showing " +
        shownCore +
        " lesson" +
        (shownCore === 1 ? "" : "s") +
        " · " +
        shownPath +
        " pathway" +
        (shownPath === 1 ? "" : "s") +
        " (of " +
        total +
        ") in " +
        filtered.length +
        " unit" +
        (filtered.length === 1 ? "" : "s")
      : "No lessons match — try a different word or standard.";
  }

  function runSearch() {
    if (!hubApi || !hubApi.searchBox) return;
    var q = (hubApi.searchBox.value || "").trim().toLowerCase();
    if (q.length === 1) return;
    updateResultCount();
    if (q) {
      hubApi.renderSearchResults(q);
    } else if (activeFilter !== FILTER_ALL) {
      hubApi.hubEl.innerHTML = "";
      hubApi.noResultsEl.classList.remove("show");
      var filtered = filterUnitsData(hubApi.unitsData, "", activeFilter);
      if (!filtered.length) {
        hubApi.noResultsEl.classList.add("show");
        return;
      }
      hubApi.renderHub();
      scheduleEnhance();
      hubApi.hubEl.querySelectorAll(".unit-card").forEach(function (card, idx) {
        var unit = hubApi.unitsData[idx];
        var visible = filtered.some(function (u) {
          return u.num === unit.num;
        });
        card.style.display = visible ? "" : "none";
      });
    } else {
      hubApi.renderHub();
      scheduleEnhance();
    }
  }

  function scheduleEnhance() {
    if (enhanceScheduled) return;
    enhanceScheduled = true;
    requestAnimationFrame(function () {
      enhanceScheduled = false;
      patchUpdateCardState();
      enhanceUnitCards();
    });
  }

  function waitForHubApi(attempts) {
    hubApi = window.CurriculumHub;
    if (hubApi && hubApi.unitsData) {
      initEnhancements();
      return;
    }
    if (attempts > 50) return;
    setTimeout(function () {
      waitForHubApi(attempts + 1);
    }, 50);
  }

  function isGoogleSlidesActivity(act) {
    return /^google slides$/i.test((act.text || "").replace(/\s+/g, " ").trim());
  }

  function legacyDriveUrlForLesson(lessonId) {
    return googleSlidesLegacyUrls[lessonId] || "";
  }

  /**
   * Point curriculum "Google Slides" at reference-matched HTML decks.
   * Legacy Drive URLs stay as a secondary teacher-only link when available.
   * Idempotent — safe to run before every hub render.
   */
  function upgradeGoogleSlidesLinks() {
    if (!hubApi || !hubApi.unitsData) return;
    hubApi.unitsData.forEach(function (u) {
      (u.lessons || []).forEach(function (lesson) {
        var lessonId = lessonIdFromTitle(lesson.title);
        if (!lessonId) return;

        var slidesHref = "/lessons/" + lessonId + "/slides.html";
        var activities = lesson.activities || (lesson.activities = []);
        var legacyInserts = [];
        var legacyUrl = legacyDriveUrlForLesson(lessonId);

        for (var i = 0; i < activities.length; i++) {
          var act = activities[i];
          if (!isGoogleSlidesActivity(act)) continue;

          var currentHref = act.href || "";
          var isExternal = /docs\.google\.com/i.test(currentHref);
          if (isExternal) {
            legacyUrl = legacyUrl || currentHref;
          }
          act.href = slidesHref;

          if (legacyUrl && legacyUrl !== slidesHref) {
            legacyInserts.push({ index: i + 1, href: legacyUrl });
          }
        }

        legacyInserts.reverse().forEach(function (entry) {
          var dup = activities.some(function (a) {
            return a.href === entry.href && /legacy|drive copy/i.test(a.text || "");
          });
          if (dup) return;
          activities.splice(entry.index, 0, {
            text: "↗ Google Drive copy (legacy)",
            href: entry.href,
          });
          lesson.dataSearch += " google drive legacy";
        });
      });
    });
  }

  function patchStaticGoogleSlidesLinks() {
    document.querySelectorAll("details.lesson").forEach(function (lessonEl) {
      var headEl = lessonEl.querySelector(".lesson-head");
      var lessonIdMatch = headEl
        ? headEl.textContent.match(/Lesson\s+([0-9]+-[0-9]+(?:-flagship)?)/i)
        : null;
      if (!lessonIdMatch) return;

      var lessonId = lessonIdMatch[1];
      var slidesHref = "/lessons/" + lessonId + "/slides.html";

      lessonEl.querySelectorAll(".lesson-body .res").forEach(function (a) {
        if (!isGoogleSlidesActivity({ text: a.textContent })) return;

        var legacyUrl = a.getAttribute("href") || "";
        if (!/docs\.google\.com/i.test(legacyUrl)) {
          legacyUrl = legacyDriveUrlForLesson(lessonId) || legacyUrl;
        }
        a.setAttribute("href", slidesHref);

        if (!/docs\.google\.com/i.test(legacyUrl) || legacyUrl === slidesHref) return;
        var row = a.parentNode;
        if (!row) return;
        var already = Array.prototype.some.call(row.querySelectorAll(".res"), function (link) {
          return link !== a && link.getAttribute("href") === legacyUrl;
        });
        if (already) return;

        var legacy = document.createElement("a");
        legacy.className = "res teacher-only";
        legacy.href = legacyUrl;
        legacy.target = "_blank";
        legacy.rel = "noopener";
        legacy.textContent = "↗ Google Drive copy (legacy)";
        a.insertAdjacentElement("afterend", legacy);
      });
    });
  }

  // Prepend a "Get Ready" readiness pre-lesson link to each lesson card so the
  // tabbed pre-lesson (Vocabulary / Skills Check / Learn It / Practice) is the
  // first thing students can choose before starting the lesson. Idempotent.
  function injectReadinessLinks() {
    document.querySelectorAll("details.lesson").forEach(function (lessonEl) {
      var headEl = lessonEl.querySelector(".lesson-head");
      var match = headEl
        ? headEl.textContent.match(/Lesson\s+([0-9]+-[0-9]+(?:-flagship)?)/i)
        : null;
      if (!match) return;

      var lessonId = match[1];
      var href = "/lessons/" + lessonId + "/readiness/";
      var row = lessonEl.querySelector(".lesson-body .res-row");
      if (!row) return;

      var already = Array.prototype.some.call(row.querySelectorAll(".res"), function (a) {
        return a.getAttribute("href") === href;
      });
      if (already) return;

      var link = document.createElement("a");
      link.className = "res res-getready";
      link.href = href;
      link.textContent = "🚀 Get Ready (Pre-Lesson)";
      row.insertBefore(link, row.firstChild);
    });
  }

  function injectSupplementalActivities() {
    if (!hubApi || !hubApi.unitsData) return;
    hubApi.unitsData.forEach(function (u) {
      (u.lessons || []).forEach(function (lesson) {
        var lessonId = lessonIdFromTitle(lesson.title);
        if (!lessonId) return;

        // Get Ready readiness pre-lesson — show FIRST in the activity dropdown
        // and outline so students can warm up before the lesson. Idempotent.
        var readyHref = "/lessons/" + lessonId + "/readiness/";
        var hasReady = (lesson.activities || []).some(function (a) {
          return a.href === readyHref;
        });
        if (!hasReady) {
          var readyActs = lesson.activities || (lesson.activities = []);
          readyActs.unshift({
            text: "🚀 Get Ready (Pre-Lesson)",
            href: readyHref,
          });
          lesson.dataSearch = (lesson.dataSearch || "") + " get ready pre-lesson readiness";
        }

        var slidesHref = "/lessons/" + lessonId + "/slides.html";
        var hasSlidesLink = (lesson.activities || []).some(function (a) {
          return a.href === slidesHref;
        });

        var supplements = [];
        if (!hasSlidesLink) {
          supplements.push({
            text: "📊 Lesson Slides",
            href: slidesHref,
          });
        }
        supplements.push({
          text: "📄 Student Handout",
          href: "/lessons/" + lessonId + "/handout.html",
        });

        supplements.forEach(function (sup) {
          var exists = (lesson.activities || []).some(function (a) {
            return a.href === sup.href;
          });
          if (exists) return;

          var activities = lesson.activities || (lesson.activities = []);
          var insertAt = activities.findIndex(function (a) {
            return /interactive lesson/i.test(a.text || "");
          });
          if (insertAt >= 0) {
            activities.splice(insertAt + 1, 0, sup);
          } else {
            activities.push(sup);
          }
          lesson.dataSearch += " " + sup.text.toLowerCase();
        });
      });
    });
  }

  function wrapHubRenderers() {
    if (!hubApi || hubApi._slidesUpgradeWrapped) return;

    var originalRenderHub = hubApi.renderHub;
    hubApi.renderHub = function () {
      upgradeGoogleSlidesLinks();
      return originalRenderHub.apply(this, arguments);
    };

    var originalRenderSearch = hubApi.renderSearchResults;
    hubApi.renderSearchResults = function () {
      upgradeGoogleSlidesLinks();
      return originalRenderSearch.apply(this, arguments);
    };

    hubApi._slidesUpgradeWrapped = true;
  }

  function buildSearchUX() {
    var box = hubApi && hubApi.searchBox;
    if (!box || document.getElementById("curr-search-clear")) return;
    var search = box.closest(".search") || box.parentNode;

    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.id = "curr-search-clear";
    clearBtn.className = "curr-search-clear";
    clearBtn.setAttribute("aria-label", "Clear search");
    clearBtn.title = "Clear search (Esc)";
    clearBtn.innerHTML = "&times;";
    clearBtn.hidden = !box.value;
    clearBtn.addEventListener("click", function () {
      box.value = "";
      box.dispatchEvent(new Event("input", { bubbles: true }));
      box.focus();
    });
    if (search) search.appendChild(clearBtn);

    box.addEventListener("input", function () {
      clearBtn.hidden = !box.value;
    });

    // Deep-link search: /curriculum/?q=<term> pre-fills and runs the search.
    // My Progress "Practise this" links rely on this to land students on the
    // matching lessons instead of the unfiltered hub.
    var qParam = new URLSearchParams(location.search).get("q");
    if (qParam && !box.value) {
      box.value = qParam;
      box.dispatchEvent(new Event("input", { bubbles: true }));
      clearBtn.hidden = false;
    }

    // Press "/" anywhere to jump to search; Esc clears it.
    document.addEventListener("keydown", function (e) {
      var t = e.target;
      var typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        box.focus();
        box.select();
        return;
      }
      if (e.key === "Escape" && t === box && box.value) {
        // Don't swallow Escape when the launch modal is open.
        var modal = document.getElementById("launch-modal");
        if (modal && modal.classList.contains("show")) return;
        e.stopPropagation();
        box.value = "";
        box.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  }

  function buildBackToTop() {
    if (document.getElementById("hub-back-to-top")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "hub-back-to-top";
    btn.className = "hub-back-to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.title = "Back to top";
    btn.innerHTML = "↑";
    btn.addEventListener("click", function () {
      var reduce =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var box = hubApi && hubApi.searchBox;
      if (box) box.focus({ preventScroll: true });
    });
    document.body.appendChild(btn);

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle("show", window.scrollY > 600);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // `code` is the Maryland 2025 MCCRS domain (what unit badges show); `cc` is the
  // familiar CCSS domain the specific standards below still use. Both are shown
  // together so 6.AT ↔ 6.RP/6.EE reads as one system, not two unexplained codes.
  var STANDARD_DOMAINS = [
    { token: "", code: "All", cc: "", short: "", label: "All standards" },
    {
      token: "6.rp",
      code: "6.AT",
      cc: "6.RP",
      short: "Ratios",
      label: "Ratios & Proportional Relationships",
    },
    {
      token: "6.ns",
      code: "6.NOS",
      cc: "6.NS",
      short: "Number System",
      label: "The Number System",
    },
    {
      token: "6.ee",
      code: "6.AT",
      cc: "6.EE",
      short: "Expressions",
      label: "Expressions & Equations",
    },
    { token: "6.g", code: "6.GR", cc: "6.G", short: "Geometry", label: "Geometry" },
    {
      token: "6.sp",
      code: "6.DS",
      cc: "6.SP",
      short: "Statistics",
      label: "Statistics & Probability",
    },
  ];

  // Bring the freshly filtered results into view when a standard is picked.
  // The interactive hub renders far down a single-column page, so a plain
  // window-top scroll left the results ~3000px below the fold — to the user it
  // looked like clicking a standard chip hid every unit. Scroll the results
  // container itself into view. Native scrollIntoView (not pageYOffset math)
  // because the standards toolbar is position:sticky, so its measured rect
  // reports the stuck position and manual math lands in the blank gap above.
  function scrollHubTop() {
    var smooth = !(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    var behavior = smooth ? "smooth" : "auto";
    var target =
      document.querySelector(".search-results-panel") || document.getElementById("interactive-hub");
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: behavior, block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    }
  }

  // Format a raw standard token (e.g. "6.rp.3a") for display ("6.AT.3a").
  // Only the domain letters are upper-cased; the CCSS sub-letter stays lower.
  function displayStd(code) {
    return code.replace(/^(6\.)(rp|ns|ee|g|sp)(\..*)$/i, function (_, p1, p2, p3) {
      return p1 + p2.toUpperCase() + p3;
    });
  }

  // Natural-sort standard codes: 6.rp.1 < 6.rp.2 < 6.rp.3 < 6.rp.3a < 6.rp.3b.
  function compareStandards(a, b) {
    var na = parseInt(a.split(".")[2] || "0", 10);
    var nb = parseInt(b.split(".")[2] || "0", 10);
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
  }

  // Scan every lesson's search text for the specific CCSS standards it carries
  // and group them by domain token. Data-driven, so it never goes stale.
  function collectDomainStandards() {
    var map = {};
    if (!hubApi || !hubApi.unitsData) return map;
    hubApi.unitsData.forEach(function (u) {
      (u.lessons || []).forEach(function (l) {
        var text = ((l.dataSearch || "") + " " + (l.title || "")).toLowerCase();
        var re = /6\.(rp|ns|ee|g|sp)\.[0-9]+[a-d]?/g;
        var m;
        while ((m = re.exec(text))) {
          var code = m[0];
          var dom = "6." + m[1];
          (map[dom] = map[dom] || {})[code] = true;
        }
      });
    });
    Object.keys(map).forEach(function (dom) {
      map[dom] = Object.keys(map[dom]).sort(compareStandards);
    });
    return map;
  }

  function buildStandardFilter() {
    // "By standard" chip row retired to declutter the hub — teachers browse by
    // Unit → Lesson, and full-text search still matches standard codes
    // (e.g. typing "6.NS" filters the library). syncStandardChips() no-ops when
    // #hub-standards is absent, so nothing else depends on this being built.
    return;
    // eslint-disable-next-line no-unreachable
    if (!hubApi || !hubApi.searchBox) return;
    if (document.getElementById("hub-standards")) return;
    var anchor = document.querySelector(".hub-filter-chips");
    if (!anchor) return;

    var box = hubApi.searchBox;
    var domainStds = collectDomainStandards();

    var wrap = document.createElement("div");
    wrap.id = "hub-standards";
    wrap.className = "hub-standards";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Browse lessons by Common Core standard");

    var lead = document.createElement("span");
    lead.className = "hub-standards-lead";
    lead.textContent = "By standard:";
    wrap.appendChild(lead);

    // One-line crosswalk so the two code systems read as one. Unit badges and
    // chips use Maryland's 2025 MCCRS domains; the specific standards in each
    // dropdown keep the familiar CCSS numbers. Muted, wraps on small screens.
    var note = document.createElement("span");
    note.className = "hub-standards-note";
    note.style.flexBasis = "100%";
    note.style.fontSize = "0.82em";
    note.style.opacity = "0.75";
    note.style.margin = "2px 0 6px";
    note.textContent =
      "Codes are Maryland’s 2025 MCCRS domains (6.AT, 6.NOS, 6.GR, 6.DS). " +
      "The specific standards inside each keep the familiar CCSS numbers (6.RP, 6.EE, 6.NS, 6.G, 6.SP).";
    wrap.appendChild(note);

    function applyToken(token) {
      box.value = token;
      box.dispatchEvent(new Event("input", { bubbles: true }));
      syncStandardChips();
      if (token) scrollHubTop();
    }

    STANDARD_DOMAINS.forEach(function (d) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "hub-standard-chip";
      chip.dataset.token = d.token;
      chip.setAttribute("aria-pressed", d.token === "" ? "true" : "false");
      chip.title = d.token ? d.label + " (MCCRS " + d.code + " · CCSS " + d.cc + ")" : d.label;
      chip.setAttribute(
        "aria-label",
        d.token ? d.code + " (formerly CCSS " + d.cc + "): " + d.label : "All standards",
      );
      chip.innerHTML =
        '<span class="hsc-code">' +
        d.code +
        "</span>" +
        (d.token
          ? '<span class="hsc-cc" style="opacity:.7;font-size:.82em;margin-left:4px">CCSS ' +
            d.cc +
            "</span>" +
            '<span class="hsc-label">' +
            d.label +
            "</span>"
          : "");
      chip.addEventListener("click", function () {
        applyToken(d.token);
      });

      // The "All standards" chip stands alone. Each domain gets a dropdown of
      // its specific standards directly beneath the chip, so picking one jumps
      // straight to that standard's lessons and activities.
      if (!d.token) {
        wrap.appendChild(chip);
        return;
      }

      var group = document.createElement("div");
      group.className = "hub-standard-group";
      group.appendChild(chip);

      var codes = domainStds[d.token] || [];
      if (codes.length) {
        var sel = document.createElement("select");
        sel.className = "hub-substd-select";
        sel.setAttribute(
          "aria-label",
          "Jump to a specific " + d.code + " (CCSS " + d.cc + ") standard",
        );

        var ph = document.createElement("option");
        ph.value = d.token;
        ph.textContent = "All " + d.code + " standards · CCSS " + d.cc;
        sel.appendChild(ph);

        codes.forEach(function (code) {
          var opt = document.createElement("option");
          opt.value = code;
          opt.textContent = displayStd(code);
          sel.appendChild(opt);
        });

        sel.addEventListener("change", function () {
          applyToken(sel.value);
        });
        group.appendChild(sel);
      }

      wrap.appendChild(group);
    });

    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);

    // Keep chip state in sync with whatever is in the search box.
    box.addEventListener("input", syncStandardChips);
    syncStandardChips();
  }

  function syncStandardChips() {
    var wrap = document.getElementById("hub-standards");
    if (!wrap || !hubApi || !hubApi.searchBox) return;
    var val = (hubApi.searchBox.value || "").trim().toLowerCase();
    var matched = false;
    wrap.querySelectorAll(".hub-standard-chip").forEach(function (chip) {
      var tok = chip.dataset.token;
      // A domain chip lights up for its own token AND for any specific
      // standard inside it (e.g. "6.rp.3" lights the 6.AT chip).
      var on = tok !== "" && (val === tok || val.indexOf(tok + ".") === 0);
      if (on) matched = true;
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var allChip = wrap.querySelector('.hub-standard-chip[data-token=""]');
    if (allChip) allChip.setAttribute("aria-pressed", matched ? "false" : "true");

    // Reflect the current value in the per-domain dropdowns.
    wrap.querySelectorAll(".hub-substd-select").forEach(function (sel) {
      var idx = 0;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === val) {
          idx = i;
          break;
        }
      }
      sel.selectedIndex = idx;
    });
  }

  var RECENT_KEY = "nt-curriculum-recent";

  function loadRecent() {
    try {
      var raw = localStorage.getItem(RECENT_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_e) {
      return [];
    }
  }

  function saveRecent(arr) {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 6)));
    } catch (_e) {
      /* storage unavailable — non-fatal */
    }
  }

  function resolveLessonLabel(uNum, lessonId) {
    if (!hubApi || !hubApi.unitsData) return null;
    var unit = null;
    hubApi.unitsData.forEach(function (u) {
      if (String(u.unitIndex) === String(uNum)) unit = u;
    });
    if (!unit) return null;
    var lesson = (unit.lessons || []).filter(function (l) {
      return l.lessonId === lessonId;
    })[0];
    if (!lesson) return null;
    return { unitNum: unit.num, title: lesson.title };
  }

  function recordRecentFromUrl() {
    var params = new URLSearchParams(location.search);
    var u = params.get("u");
    var l = params.get("l");
    if (!u || !l) return;
    var a = params.get("a") || "";
    var info = resolveLessonLabel(u, l);
    if (!info) return;
    var entry = {
      u: u,
      l: l,
      a: a,
      unitNum: info.unitNum,
      title: info.title,
    };
    var key = u + "|" + l;
    var list = loadRecent().filter(function (e) {
      return e.u + "|" + e.l !== key;
    });
    list.unshift(entry);
    saveRecent(list);
    renderRecent();
  }

  function renderRecent() {
    if (!hubApi || !hubApi.hubEl) return;
    var list = loadRecent();
    var strip = document.getElementById("hub-recent");

    if (!list.length) {
      if (strip) strip.remove();
      return;
    }

    if (!strip) {
      strip = document.createElement("section");
      strip.id = "hub-recent";
      strip.className = "hub-recent";
      strip.setAttribute("aria-label", "Recently opened lessons");
      hubApi.hubEl.parentNode.insertBefore(strip, hubApi.hubEl);
    }

    strip.innerHTML = "";
    var head = document.createElement("div");
    head.className = "hub-recent-head";
    head.innerHTML = '<span class="hub-recent-title">↩ Jump back in</span>';
    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "hub-recent-clear";
    clear.textContent = "Clear";
    clear.setAttribute("aria-label", "Clear recently opened lessons");
    clear.addEventListener("click", function () {
      saveRecent([]);
      renderRecent();
    });
    head.appendChild(clear);
    strip.appendChild(head);

    var row = document.createElement("div");
    row.className = "hub-recent-row";
    list.forEach(function (e) {
      var chip = document.createElement("a");
      chip.className = "hub-recent-chip";
      var qs = "?u=" + encodeURIComponent(e.u) + "&l=" + encodeURIComponent(e.l);
      if (e.a) qs += "&a=" + encodeURIComponent(e.a);
      chip.href = "/curriculum/" + qs;
      chip.title = e.unitNum + " · " + e.title;
      chip.innerHTML =
        '<span class="hub-recent-unit">' +
        e.unitNum +
        '</span><span class="hub-recent-name">' +
        e.title +
        "</span>";
      row.appendChild(chip);
    });
    strip.appendChild(row);
  }

  function buildRecent() {
    document.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        var launch = t.closest("a.btn-launch, #modal-launch-link");
        if (!launch) return;
        recordRecentFromUrl();
      },
      true,
    );
    renderRecent();
  }

  function setupPrintView() {
    // The static details.unit list (hidden on screen) is the print fallback.
    // Inject a print-only header and force every unit/lesson open while
    // printing so no collapsed content is dropped, then restore afterwards.
    if (!document.getElementById("hub-print-header")) {
      var header = document.createElement("div");
      header.id = "hub-print-header";
      var unitCount = (hubApi && hubApi.unitsData && hubApi.unitsData.length) || 0;
      var coreCount = 0;
      var pathwayCount = 0;
      (hubApi && hubApi.unitsData ? hubApi.unitsData : []).forEach(function (u) {
        (u.lessons || []).forEach(function (l) {
          if (isCoreLessonRow(l)) coreCount++;
          else pathwayCount++;
        });
      });
      header.innerHTML =
        "<h2>Grade 6 Math — Curriculum at a Glance</h2>" +
        "<p>Neft Teacher · " +
        unitCount +
        " units · " +
        coreCount +
        " lessons · " +
        pathwayCount +
        " pathways · eduwonderlab.com/curriculum</p>";
      var wrap = document.querySelector(".wrap");
      var firstUnit = document.querySelector("details.unit");
      if (wrap && firstUnit) {
        wrap.insertBefore(header, firstUnit);
      } else if (wrap) {
        wrap.appendChild(header);
      }
    }

    var savedOpen = null;
    function expandAll() {
      var all = document.querySelectorAll("details.unit, details.lesson");
      savedOpen = [];
      all.forEach(function (d) {
        savedOpen.push(d.open);
        d.open = true;
      });
    }
    function restoreAll() {
      if (!savedOpen) return;
      var all = document.querySelectorAll("details.unit, details.lesson");
      all.forEach(function (d, i) {
        d.open = savedOpen[i];
      });
      savedOpen = null;
    }
    window.addEventListener("beforeprint", expandAll);
    window.addEventListener("afterprint", restoreAll);
    // Safari/Chrome matchMedia print fallback.
    if (window.matchMedia) {
      var mql = window.matchMedia("print");
      var onChange = function (m) {
        if (m.matches) expandAll();
        else restoreAll();
      };
      if (mql.addEventListener) mql.addEventListener("change", onChange);
      else if (mql.addListener) mql.addListener(onChange);
    }
  }

  function initEnhancements() {
    teacherMode = loadTeacherMode();
    loadProgress();
    buildControls();
    buildStandardFilter();
    buildSearchUX();
    buildBackToTop();
    buildRecent();
    setupPrintView();
    wrapHubRenderers();
    upgradeGoogleSlidesLinks();
    injectSupplementalActivities();
    patchStaticGoogleSlidesLinks();
    injectReadinessLinks();
    markTeacherLinksInSource();
    enhancePrintFallbackAria();
    wrapRenderSearchResults();
    applyTeacherMode();
    injectJsonLd();

    loadLessonStandards().then(function () {
      scheduleEnhance();
    });
    loadSearchIndex();

    if (window.CurriculumProgressBridge) {
      window.CurriculumProgressBridge.pushAllLocal(progress, parseProgressKey);
      hydrateProgressFromServer(function () {
        scheduleEnhance();
        updateProgressSummary();
      });
    }

    if (hubApi.searchBox) {
      var searchTimer = null;
      hubApi.searchBox.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(runSearch, 120);
      });
    }

    updateResultCount();

    // Debounce: sibling modules (sidebar, studio-journey, top1) mutate this
    // same subtree, so run one coalesced sweep per burst instead of a full
    // synchronous querySelectorAll pass on every single mutation.
    var observerTimer = null;
    var observer = new MutationObserver(function () {
      if (observerTimer) return;
      observerTimer = setTimeout(function () {
        observerTimer = null;
        patchStaticGoogleSlidesLinks();
        injectReadinessLinks();
        scheduleEnhance();
      }, 150);
    });
    if (hubApi.hubEl) {
      observer.observe(hubApi.hubEl, { childList: true, subtree: true });
    }

    scheduleEnhance();
  }

  ready(function () {
    waitForHubApi(0);
    loadJson("/assets/curriculum-real-world.json").then(function (data) {
      realWorldMap = data || {};
      if (hubApi) {
        refreshHub();
      }
    });
    loadJson("/data/google-slides-urls.json").then(function (data) {
      if (data && typeof data === "object") {
        googleSlidesLegacyUrls = data;
        delete googleSlidesLegacyUrls._note;
      }
      if (hubApi) {
        upgradeGoogleSlidesLinks();
        patchStaticGoogleSlidesLinks();
        refreshHub();
      }
    });
  });
})();

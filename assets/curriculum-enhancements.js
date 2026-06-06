/**
 * Curriculum Hub enhancements — teacher/student mode, progress, search filters,
 * real-world snippets, JSON-LD, and accessibility helpers.
 * Requires window.CurriculumHub from curriculum/index.html inline script.
 */
(function () {
  "use strict";

  var STORAGE_MODE = "curriculumTeacherMode";
  var STORAGE_PROGRESS = "curriculumProgress";
  var FILTER_ALL = "all";

  var TEACHER_HREF_PATTERNS = [
    /teacher-tools/i,
    /docs\.google\.com/i,
    /\/downloads\/.*\.pdf$/i,
    /\/downloads\/.*\.docx$/i,
    /homework\.docx$/i,
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
  };

  var realWorldMap = {};
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

  function loadJson(url) {
    return fetch(url)
      .then(function (r) {
        return r.ok ? r.json() : {};
      })
      .catch(function () {
        return {};
      });
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_PROGRESS);
      progress = raw ? JSON.parse(raw) : {};
    } catch (e) {
      progress = {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress));
    } catch (e) {}
  }

  function loadTeacherMode() {
    try {
      var params = new URLSearchParams(location.search);
      if (params.get("student") === "1") return false;
      if (params.get("teacher") === "1") return true;
      var saved = localStorage.getItem(STORAGE_MODE);
      if (saved === "0" || saved === "false") return false;
      if (saved === "1" || saved === "true") return true;
    } catch (e) {}
    // Default ON so teachers see Slides, Forms, and printable packets without toggling.
    return true;
  }

  function saveTeacherMode(on) {
    try {
      localStorage.setItem(STORAGE_MODE, on ? "1" : "0");
    } catch (e) {}
  }

  function isTeacherResource(act) {
    if (!act) return false;
    var text = (act.text || "").replace(/\s+/g, " ").trim();
    var href = act.href || "";
    if (TEACHER_TEXT_PATTERNS.some(function (re) { return re.test(text); })) {
      return true;
    }
    return TEACHER_HREF_PATTERNS.some(function (re) { return re.test(href); });
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
      btn.textContent = teacherMode ? "👩‍🏫 Teacher Mode" : "🎒 Student Mode";
    }
    updateStudentHint();
    refreshHub();
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
    var q = (query || "").trim().toLowerCase();
    return unitsData
      .map(function (u) {
        var lessons = (u.lessons || []).filter(function (l) {
          var textMatch = !q || l.dataSearch.indexOf(q) > -1;
          var filterMatch = lessonMatchesFilter(l, filter);
          return textMatch && filterMatch;
        });
        if (!lessons.length) return null;
        return Object.assign({}, u, { lessons: lessons });
      })
      .filter(Boolean);
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
      teacherMode = !teacherMode;
      saveTeacherMode(teacherMode);
      applyTeacherMode();
      updateProgressSummary();
    });
    bar.appendChild(modeBtn);

    var hint = document.createElement("p");
    hint.id = "hub-student-hint";
    hint.className = "hub-student-hint";
    hint.hidden = true;
    hint.innerHTML =
      'Student view hides teacher-only links (Google Slides, Forms, printable packets). ' +
      '<button type="button" class="hub-hint-link" id="hub-hint-teacher">Switch to Teacher Mode</button> ' +
      'to restore them.';
    hint.querySelector("#hub-hint-teacher").addEventListener("click", function () {
      teacherMode = true;
      saveTeacherMode(true);
      applyTeacherMode();
      updateProgressSummary();
    });
    controls.parentNode.insertBefore(hint, controls);

    controls.parentNode.insertBefore(bar, controls.nextSibling);

    var chips = document.createElement("div");
    chips.className = "hub-filter-chips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Filter resources by category");

    [
      { id: FILTER_ALL, label: "All" },
      { id: "lessons", label: "Lessons" },
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

  function injectJsonLd() {
    if (document.getElementById("curriculum-jsonld")) return;
    if (!hubApi || !hubApi.unitsData) return;

    var courseParts = hubApi.unitsData.map(function (u, i) {
      return {
        "@type": "Course",
        name: u.num + " — " + u.name,
        description: u.blurb || "",
        position: i + 1,
        numberOfCredits: (u.lessons || []).length,
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
        TEACHER_TEXT_PATTERNS.some(function (re) { return re.test(text); }) ||
        TEACHER_HREF_PATTERNS.some(function (re) { return re.test(href); })
      ) {
        a.classList.add("teacher-only");
      }
    });
    var tt = document.querySelector("details.teacher-tools");
    if (tt) tt.classList.add("teacher-only");
  }

  function wrapRenderSearchResults() {
    if (!hubApi || hubApi._enhancedSearch) return;
    var original = hubApi.renderSearchResults;

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
          (activeFilter !== FILTER_ALL ? " in <strong>" + escapeHtml(activeFilter) + "</strong>" : "") +
          ".</p>";
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
          var rw = realWorldMap[lessonId] || realWorldMap[lessonId.replace("-flagship", "")];
          if (rw) {
            var rwEl = document.createElement("p");
            rwEl.className = "lesson-real-world";
            rwEl.innerHTML =
              '<span class="lesson-real-world-label">Real-World Connection</span>' +
              escapeHtml(rw);
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

  function enhanceUnitCards() {
    if (!hubApi || !hubApi.hubEl) return;
    var cards = hubApi.hubEl.querySelectorAll(".unit-card");
    if (!cards.length) return;

    hubApi.unitsData.forEach(function (u, idx) {
      var card = cards[idx];
      if (!card) return;

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
      var rw = realWorldMap[lessonId] || realWorldMap[lessonId.replace("-flagship", "")];
      var existingRw = infoBlock.querySelector(".lesson-real-world");
      if (rw && !existingRw) {
        var rwEl = document.createElement("p");
        rwEl.className = "lesson-real-world";
        rwEl.innerHTML =
          '<span class="lesson-real-world-label">Real-World Connection</span>' +
          escapeHtml(rw);
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
          check.setAttribute("aria-pressed", progress[key] ? "true" : "false");
          check.textContent = progress[key] ? "✓" : "○";
          updateProgressSummary();
          enhanceUnitCards();
        });
        li.insertBefore(check, link);
      });

      var actSelect = card.querySelector(".activity-select");
      if (actSelect) {
        Array.prototype.forEach.call(actSelect.options, function (opt) {
          if (!opt.value) return;
          var text = opt.textContent.trim();
          var href = opt.value;
          opt.hidden = !teacherMode && isTeacherResource({ text: text, href: href });
        });
      }
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
      var actSelect = card.querySelector(".activity-select");
      if (actSelect && !actSelect._enhancedChange) {
        actSelect._enhancedChange = true;
        actSelect.addEventListener("change", function () {
          requestAnimationFrame(enhanceUnitCards);
        });
      }
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

  function runSearch() {
    if (!hubApi || !hubApi.searchBox) return;
    var q = (hubApi.searchBox.value || "").trim().toLowerCase();
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

  function injectSupplementalActivities() {
    if (!hubApi || !hubApi.unitsData) return;
    hubApi.unitsData.forEach(function (u) {
      (u.lessons || []).forEach(function (lesson) {
        var lessonId = lessonIdFromTitle(lesson.title);
        if (!lessonId) return;

        var supplements = [
          {
            text: "📊 Lesson Slides",
            href: "/lessons/" + lessonId + "/slides.html",
          },
          {
            text: "📄 Student Handout",
            href: "/lessons/" + lessonId + "/handout.html",
          },
        ];

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

  function initEnhancements() {
    teacherMode = loadTeacherMode();
    loadProgress();
    buildControls();
    injectSupplementalActivities();
    markTeacherLinksInSource();
    enhancePrintFallbackAria();
    wrapRenderSearchResults();
    applyTeacherMode();
    injectJsonLd();

    if (hubApi.searchBox) {
      hubApi.searchBox.addEventListener("input", function () {
        runSearch();
      });
    }

    var observer = new MutationObserver(function () {
      scheduleEnhance();
    });
    if (hubApi.hubEl) {
      observer.observe(hubApi.hubEl, { childList: true, subtree: true });
    }

    scheduleEnhance();
  }

  ready(function () {
    loadJson("/assets/curriculum-real-world.json").then(function (data) {
      realWorldMap = data || {};
      waitForHubApi(0);
    });
  });
})();

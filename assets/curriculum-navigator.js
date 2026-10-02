/* Curriculum lesson desk: public catalog data, device-local bookmarks, no student records. */
(function () {
  "use strict";

  /** @typedef {{path:string, applicable:boolean, exists:boolean}} CatalogResource */
  /** @typedef {{id:string, unit:number, lesson:number, title:string, titleEs?:string, standard?:string, topic?:string, objective?:string, languageObjective?:string, timeEstimate?:string, resources:Record<string,CatalogResource>, supports?:{vocabulary?:string[],sentenceFrames?:string[]}}} CatalogLesson */
  /** @typedef {{id:string, parent?:string, title:string, unit:number, group?:number, resources:Record<string,string>, vocabulary?:string[], sentenceFrames?:string[]}} LaunchLesson */
  /** @typedef {{lessons:LaunchLesson[], partTwo?:LaunchLesson[], smallGroups?:LaunchLesson[], catchUps?:LaunchLesson[]}} LaunchManifest */

  var root = document.getElementById("curriculum-navigator");
  var search = /** @type {HTMLInputElement} */ (document.getElementById("curr-search"));
  var unit = /** @type {HTMLSelectElement} */ (document.getElementById("nav-unit"));
  var savedFilter = document.getElementById("nav-saved");
  var reset = document.getElementById("nav-reset");
  var status = document.getElementById("nav-results-status");
  var results = document.getElementById("nav-results");
  var more = /** @type {HTMLButtonElement} */ (document.getElementById("nav-more"));
  var preview = document.getElementById("nav-preview");
  var message = document.getElementById("nav-message");
  var retry = /** @type {HTMLButtonElement} */ (document.getElementById("nav-retry"));
  var recentNode = document.getElementById("nav-recent");
  if (
    !root ||
    !search ||
    !unit ||
    !savedFilter ||
    !reset ||
    !status ||
    !results ||
    !more ||
    !preview ||
    !message ||
    !retry ||
    !recentNode
  )
    return;

  var PAGE_SIZE = 8;
  var OVERLAY_KEY = "nt-pacing:overlay";
  /** What opening a material gives you, shown as a small tag on each link. */
  var RESOURCE_KINDS = {
    readiness: "Check",
    learningLab: "Interactive",
    lesson: "Interactive",
    guidedNotes: "Notes",
    handout: "Printable",
    worksheetLevel0: "Printable",
    worksheet: "Printable",
    worksheet2: "Printable",
    mstarWorksheet: "Printable",
    studentHelp: "Help",
    exitTicket: "Check",
    homework: "Practice",
    familyPage: "Family",
    slides: "Slides",
    teacherNotes: "Teacher",
    guidedNotesPdf: "PDF",
    guidedNotesDocx: "Word",
    mstarWorksheetPdf: "PDF",
    homeworkDocx: "Word",
    practice: "Printable",
  };
  var SAVED_KEY = "ewl:curriculum:saved:v1";
  var RECENT_KEY = "ewl:curriculum:recent:v1";
  /** @type {CatalogLesson[]} */
  var lessons = [];
  /** @type {Map<string, CatalogLesson>} */
  var byId = new Map();
  /** @type {Map<string, LaunchLesson>} */
  var launchById = new Map();
  /** @type {LaunchManifest} */
  var launch = { lessons: [] };
  /** @type {Set<string>} */
  var saved = new Set();
  /** @type {string[]} */
  var recent = [];
  var storageReadable = true;
  var onlySaved = false;
  var selected = "";
  var limit = PAGE_SIZE;
  var searchTimer = 0;
  var loading = false;
  var subscribed = false;
  var syncing = false;
  var explicitSelection = false;

  /** @param {string} tag @param {string} className @param {string} [text] */
  function node(tag, className, text) {
    var el = document.createElement(tag);
    el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  /** @param {string} label @param {()=>void} action @param {string} [className] */
  function button(label, action, className) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = className || "cn-button";
    el.textContent = label;
    el.addEventListener("click", action);
    return el;
  }

  /** Only same-origin curriculum resources; never accept executable/external URLs.
   * Learning labs are allowed only for the explicitly authored learningLab key.
   * @param {unknown} path @param {string} [key] */
  function safePath(path, key) {
    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(path)
    )
      return "";
    try {
      var url = new URL(path, window.location.origin);
      if (url.origin !== window.location.origin) return "";
      if (key === "learningLab") {
        if (!/^\/curriculum\/learning-labs\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(path)) return "";
      } else if (!url.pathname.startsWith("/lessons/")) return "";
      return url.pathname + url.search + url.hash;
    } catch (_error) {
      return "";
    }
  }

  /** @param {string} path @param {string} label @param {boolean} [student] @param {string} [key] @param {boolean} [tagged] */
  function resourceLink(path, label, student, key, tagged) {
    var clean = safePath(path, key);
    if (!clean) return null;
    var link = document.createElement("a");
    var url = new URL(clean, window.location.origin);
    if (student) url.searchParams.set("student", "1");
    link.href = prettyPath(url.pathname) + url.search + url.hash;
    link.className = "cn-resource";
    var kind = tagged && key ? RESOURCE_KINDS[key] : "";
    if (kind) {
      link.dataset.kind = kind;
      link.append(node("span", "cn-resource-label", label), node("span", "cn-kind", kind));
    } else link.textContent = label;
    return link;
  }

  /** Cloudflare Pages answers `/x.html` with a redirect to `/x`; link to the
   * final URL so every material opens in one request instead of two.
   * @param {string} pathname */
  function prettyPath(pathname) {
    return pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  }

  /** @param {string} key */
  function readIds(key) {
    var raw;
    try {
      raw = window.localStorage.getItem(key);
    } catch (_error) {
      storageReadable = false;
      return [];
    }
    try {
      var parsed = JSON.parse(raw || "[]");
      if (!Array.isArray(parsed)) return [];
      return Array.from(
        new Set(
          parsed.filter(function (id) {
            return typeof id === "string" && byId.has(id);
          }),
        ),
      ).slice(0, lessons.length);
    } catch (_error) {
      return [];
    }
  }

  /** @param {string} key @param {string[]} values */
  function storeIds(key, values) {
    try {
      window.localStorage.setItem(key, JSON.stringify(values));
      return true;
    } catch (_error) {
      return false;
    }
  }

  /** Keep action feedback alongside the action, rather than below the lesson.
   * @param {string} text */
  function actionMessage(text) {
    var local = document.getElementById("nav-action-message");
    if (local) local.textContent = text;
    else message.textContent = text;
  }

  /** @param {string} id */
  function toggleSaved(id) {
    var next = new Set(saved);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (!storeIds(SAVED_KEY, Array.from(next))) {
      actionMessage(
        "This browser could not save your lesson. Allow site storage or bookmark the lesson URL instead.",
      );
      return;
    }
    saved = next;
    actionMessage(
      saved.has(id)
        ? "Lesson saved on this device."
        : "Lesson removed from saved lessons on this device.",
    );
    renderResults();
    // Update in place so keyboard focus stays on the save action.
    var saveButton = preview.querySelector("[data-save-lesson]");
    if (saveButton) {
      saveButton.textContent = saved.has(id) ? "Saved on this device" : "Save lesson";
      saveButton.setAttribute("aria-pressed", String(saved.has(id)));
    }
  }

  /** @param {string} value */
  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/(\d+)\.(\d+)/g, "$1-$2")
      .trim();
  }

  /** Ignore malformed optional text arrays instead of breaking the whole lesson desk.
   * @param {unknown} value @returns {string[]} */
  function strings(value) {
    return Array.isArray(value)
      ? value
          .filter(function (item) {
            return typeof item === "string";
          })
          .slice(0, 50)
      : [];
  }

  function searchQuery() {
    var query = normalize(search.value)
      .replace(
        /\b(?:unit|unidad)\s*[:#]?\s*(\d{1,2})\s+(?:lesson|leccion)\s*[:#]?\s*(\d{1,2})\b/g,
        "$1-$2",
      )
      .replace(/\b(?:lessons?|leccion)\s*[:#]?\s*(\d{1,2})\s*-\s*(\d{1,2})\b/g, "$1-$2");
    var requestedUnit = "";
    query = query.replace(
      /\b(?:unit|unidad)\s*[:#]?\s*(\d{1,2})(?![\d-])\b/g,
      function (_match, number) {
        requestedUnit = String(Number(number));
        return "";
      },
    );
    return { unit: requestedUnit, words: query.split(/\s+/).filter(Boolean) };
  }

  /** @param {CatalogLesson} lesson @param {{unit:string, words:string[]}} query @param {boolean} [spanish] */
  function matchesQuery(lesson, query, spanish = true) {
    if (query.unit && String(lesson.unit) !== query.unit) return false;
    var haystack = normalize(
      [
        lesson.id,
        lesson.title,
        spanish && typeof lesson.titleEs === "string" ? lesson.titleEs : "",
        lesson.standard,
        lesson.topic,
        lesson.objective,
        lesson.languageObjective,
        strings(lesson.supports?.vocabulary).join(" "),
      ].join(" "),
    );
    return query.words.every(function (word) {
      return /^\d{1,2}-\d{1,2}$/.test(word) ? lesson.id === word : haystack.includes(word);
    });
  }

  /** Curriculum-QA status, same rule as curriculum-audit-badges.js.
   * @param {CatalogLesson & {status?:{needsReview?:boolean, missingResources?:unknown[], brokenLinks?:unknown[]}}} lesson */
  function auditStatus(lesson) {
    var st = lesson.status || {};
    if (st.needsReview) return "review";
    if (
      (st.missingResources && st.missingResources.length) ||
      (st.brokenLinks && st.brokenLinks.length)
    )
      return "missing";
    return "ready";
  }

  /** The teacher-only status filter (set by curriculum-audit-badges.js). Ignored for students. */
  function auditFilter() {
    if (!document.body.classList.contains("teacher-mode")) return "";
    return document.body.dataset.auditFilter || "";
  }

  function matching() {
    var query = searchQuery();
    var status = auditFilter();
    return lessons.filter(function (lesson) {
      if (unit.value && String(lesson.unit) !== unit.value) return false;
      if (onlySaved && !saved.has(lesson.id)) return false;
      if (status) {
        var own = auditStatus(lesson);
        if (status === "attention" ? own === "ready" : own !== status) return false;
      }
      return matchesQuery(lesson, query);
    });
  }

  function syncSearchControls() {
    var clear = document.getElementById("curr-search-clear");
    if (clear) clear.hidden = !search.value;
  }

  /** Include a selected lesson past the initial page without dropping filters.
   * @param {string} id */
  function includeResult(id) {
    var index = matching().findIndex(function (lesson) {
      return lesson.id === id;
    });
    if (index >= limit) limit = Math.ceil((index + 1) / PAGE_SIZE) * PAGE_SIZE;
  }

  function backToResults() {
    includeResult(selected);
    renderResults();
    var target =
      /** @type {HTMLElement} */ (results.querySelector('[data-lesson-id="' + selected + '"]')) ||
      search;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "nearest", behavior: "auto" });
  }

  /** A recent lesson may be outside current results. Retain every compatible filter.
   * @param {string} id */
  function openRecent(id) {
    var lesson = byId.get(id);
    if (!lesson) return;
    window.clearTimeout(searchTimer);
    if (unit.value && unit.value !== String(lesson.unit)) unit.value = "";
    if (onlySaved && !saved.has(id)) onlySaved = false;
    if (!matchesQuery(lesson, searchQuery())) search.value = "";
    includeResult(id);
    select(id, true, true);
  }

  /** @param {boolean} [replace] */
  function updateUrl(replace) {
    var url = new URL(window.location.href);
    var query = search.value.trim();
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (unit.value) url.searchParams.set("u", unit.value);
    else url.searchParams.delete("u");
    if (selected) url.searchParams.set("lesson", selected);
    else url.searchParams.delete("lesson");
    if (onlySaved) url.searchParams.set("saved", "1");
    else url.searchParams.delete("saved");
    if (url.href === window.location.href) return;
    try {
      window.history[replace ? "replaceState" : "pushState"](
        {},
        "",
        url.pathname + url.search + url.hash,
      );
    } catch (_error) {
      /* Navigation restrictions do not prevent using the catalog. */
    }
  }

  function renderRecent() {
    recentNode.replaceChildren();
    var ids = recent
      .filter(function (id) {
        return byId.has(id);
      })
      .slice(0, 4);
    if (!ids.length) return;
    recentNode.appendChild(node("span", "cn-recent-label", "Recently opened here"));
    ids.forEach(function (id) {
      var lesson = byId.get(id);
      var item = button(
        id.replace("-", ".") + " · " + lesson.title,
        function () {
          openRecent(id);
        },
        "cn-recent-link",
      );
      recentNode.appendChild(item);
    });
  }

  function renderResults() {
    syncSearchControls();
    if (!lessons.length) return;
    var matches = matching();
    var shown = matches.slice(0, limit);
    savedFilter.setAttribute("aria-pressed", String(onlySaved));
    savedFilter.textContent = "Saved (" + saved.size + ")";
    status.textContent = matches.length
      ? matches.length +
        " " +
        (matches.length === 1 ? "lesson" : "lessons") +
        (onlySaved ? " saved" : " found") +
        " · Showing " +
        shown.length +
        " of " +
        matches.length
      : onlySaved
        ? "No saved lessons match these filters."
        : "No lessons match these filters.";
    results.replaceChildren();
    shown.forEach(function (lesson) {
      var item = node("li", "cn-result");
      var pick = button(
        "",
        function () {
          select(lesson.id, true, true);
        },
        "cn-lesson-button",
      );
      pick.dataset.lessonId = lesson.id;
      pick.setAttribute("aria-controls", "nav-preview");
      if (lesson.id === selected) pick.setAttribute("aria-current", "true");
      var meta = node(
        "span",
        "cn-result-meta",
        "Lesson " + lesson.id.replace("-", ".") + (saved.has(lesson.id) ? " · Saved" : ""),
      );
      pick.append(
        meta,
        node("strong", "cn-result-title", lesson.title),
        node("span", "cn-result-standard", lesson.standard || "Math practices"),
      );
      if (
        typeof lesson.titleEs === "string" &&
        matchesQuery(lesson, searchQuery()) &&
        !matchesQuery(lesson, searchQuery(), false)
      ) {
        var translation = node("span", "cn-result-translation", lesson.titleEs);
        translation.lang = "es";
        pick.appendChild(translation);
      }
      var quality = auditStatus(lesson);
      if (quality !== "ready")
        pick.appendChild(
          node(
            "span",
            "cn-status cn-status--" + quality + " hub-teacher-only",
            quality === "review" ? "Needs review" : "Missing resources",
          ),
        );
      if (lesson.id === selected) pick.appendChild(node("span", "cn-selected-label", "Viewing"));
      item.appendChild(pick);
      results.appendChild(item);
    });
    if (!matches.length) {
      var empty = node("li", "cn-empty");
      empty.appendChild(
        node(
          "p",
          "",
          onlySaved && !saved.size
            ? "Choose a lesson and use Save lesson to keep it here on this device."
            : "Try a topic, a standard, or a lesson number such as 3.2.",
        ),
      );
      empty.appendChild(button("Clear filters", resetFilters));
      results.appendChild(empty);
    }
    more.hidden = shown.length >= matches.length;
    more.textContent =
      "Show " + Math.min(PAGE_SIZE, matches.length - shown.length) + " more lessons";
  }

  /** @param {CatalogLesson} lesson @param {string} heading @param {string[][]} entries @param {boolean} [teacher] */
  function resourceGroup(lesson, heading, entries, teacher) {
    var group = node("section", "cn-resource-group" + (teacher ? " hub-teacher-only" : ""));
    group.appendChild(node("h4", "cn-group-title", heading));
    var list = node("ul", "cn-resources");
    var studentLesson = launchById.get(lesson.id);
    entries.forEach(function (entry) {
      var key = entry[0];
      var catalog = lesson.resources[key];
      var path = teacher
        ? catalog?.exists === true && catalog?.applicable === true
          ? catalog.path
          : ""
        : studentLesson?.resources?.[key];
      if (!teacher && catalog && (!catalog.exists || !catalog.applicable)) return;
      var link = resourceLink(path, entry[1], !teacher, key, true);
      if (link) {
        var item = node("li", "");
        item.appendChild(link);
        list.appendChild(item);
      }
    });
    if (!list.children.length) return;
    group.appendChild(list);
    preview.appendChild(group);
  }

  /** @param {string} id @param {string} heading @param {LaunchLesson[]} variants */
  function relatedGroup(id, heading, variants) {
    var related = variants.filter(function (item) {
      return item.parent === id && safePath(item.resources?.lesson);
    });
    if (!related.length) return;
    var group = node("section", "cn-resource-group cn-variants");
    group.appendChild(node("h4", "cn-group-title", heading));
    related.forEach(function (item) {
      var row = node("div", "cn-variant");
      var link = resourceLink(item.resources.lesson, item.title, true);
      if (link) {
        link.classList.add("cn-variant-main");
        row.appendChild(link);
      }
      var details = document.createElement("details");
      details.className = "cn-variant-extras";
      details.appendChild(node("summary", "", "Practice & printables"));
      var list = node("ul", "cn-resources");
      [
        ["worksheet", "Worksheet 1"],
        ["worksheet2", "Worksheet 2"],
        ["practice", "More practice"],
        ["homework", "Homework"],
      ].forEach(function (entry) {
        var resource = resourceLink(item.resources[entry[0]], entry[1], true, entry[0], true);
        if (resource) {
          var li = node("li", "");
          li.appendChild(resource);
          list.appendChild(li);
        }
      });
      if (list.children.length) {
        details.appendChild(list);
        row.appendChild(details);
      }
      group.appendChild(row);
    });
    preview.appendChild(group);
  }

  /** @param {string} id */
  function studentUrl(id) {
    return new URL(
      "/curriculum/student-launch/?lesson=" + encodeURIComponent(id),
      window.location.origin,
    ).href;
  }

  /** @param {string} id @param {HTMLElement} fallback */
  async function copyStudentLink(id, fallback) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(studentUrl(id));
      if (selected !== id || !fallback.isConnected) return;
      actionMessage(
        "Student link copied. It opens the student launch page for lesson " +
          id.replace("-", ".") +
          ".",
      );
      fallback.hidden = true;
    } catch (_error) {
      if (selected !== id || !fallback.isConnected) return;
      actionMessage("Copy is unavailable in this browser. Select and copy the student link below.");
      fallback.hidden = false;
      var field = fallback.querySelector("input");
      field?.focus();
      field?.select();
    }
  }

  /** Local calendar date as YYYY-MM-DD (not UTC, which flips a day early in the evening). */
  function isoToday() {
    var now = new Date();
    return (
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")
    );
  }

  /** @param {string} iso */
  function dayLabel(iso) {
    var parts = iso.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  /** A pathway id ("3-3-catchup", "3-3-group1") belongs to its core lesson. @param {string} id */
  function coreId(id) {
    return String(id || "").replace(/-(?:group[12]|catchup|part2|flagship)$/, "");
  }

  /**
   * Today's place in the pacing plan: the generated per-day schedule, with the
   * teacher's own planner moves (saved on this device) layered on top, exactly
   * as the weekly planner reads them. Returns the first school day on or after
   * today, or null outside the school year or without pacing data.
   * @returns {{date:string, isToday:boolean, lesson:CatalogLesson|null, dayType:string, planTitle:string, next:CatalogLesson|null} | null}
   */
  function pacingToday() {
    var days = /** @type {unknown} */ (window.__NT_PACING_DAYS);
    if (!Array.isArray(days) || !days.length) return null;
    var today = isoToday();
    var overlay = {};
    try {
      overlay = JSON.parse(window.localStorage.getItem(OVERLAY_KEY) || "{}") || {};
    } catch (_error) {
      overlay = {};
    }
    /** @param {unknown[]} row */
    function planFor(row) {
      var moved = overlay[String(row[0])]?.plan || {};
      return {
        lessonId: typeof moved.lessonId === "string" ? moved.lessonId : String(row[1] || ""),
        dayType: typeof moved.dayType === "string" ? moved.dayType : String(row[2] || ""),
        planTitle: typeof moved.planTitle === "string" ? moved.planTitle : String(row[3] || ""),
      };
    }
    var index = days.findIndex(function (row) {
      return Array.isArray(row) && String(row[0]) >= today;
    });
    if (index < 0) return null;
    var plan = planFor(days[index]);
    var lesson = byId.get(coreId(plan.lessonId)) || null;
    var next = null;
    for (var i = index + 1; i < days.length && !next; i++) {
      var later = byId.get(coreId(planFor(days[i]).lessonId));
      if (later && later !== lesson) next = later;
    }
    return {
      date: String(days[index][0]),
      isToday: String(days[index][0]) === today,
      lesson: lesson,
      dayType: plan.dayType,
      planTitle: lesson ? "" : plan.planTitle,
      next: next,
    };
  }

  /** @param {string} text @param {string} audience */
  function forAudience(text, audience) {
    var el = node("span", audience === "teacher" ? "hub-teacher-only" : "hub-student-only", text);
    return el;
  }

  /** @param {CatalogLesson} lesson @param {string} label @param {boolean} [primary] */
  function openLessonButton(lesson, label, primary) {
    var open = button(
      "",
      function () {
        select(lesson.id, true, true);
      },
      "cn-button" + (primary ? " cn-primary" : ""),
    );
    open.append(label);
    open.setAttribute("aria-controls", "nav-preview");
    return open;
  }

  /** The panel before any lesson is chosen: today's lesson from the pacing plan. */
  function renderIdle() {
    root.classList.add("cn-idle");
    preview.replaceChildren();
    var plan = pacingToday();
    var title;
    if (plan && (plan.lesson || plan.planTitle)) {
      var card = node("div", "cn-today");
      var when = node("p", "cn-eyebrow");
      when.append(
        forAudience(
          (plan.isToday ? "Today in class · " : "Next class · ") + dayLabel(plan.date),
          "student",
        ),
        forAudience(
          (plan.isToday ? "Teaching today · " : "Next teaching day · ") + dayLabel(plan.date),
          "teacher",
        ),
      );
      card.appendChild(when);
      title = node("h3", "cn-preview-title", plan.lesson ? plan.lesson.title : plan.planTitle);
      title.id = "nav-lesson-title";
      card.appendChild(title);
      if (plan.lesson) {
        var detail = "Lesson " + plan.lesson.id.replace("-", ".") + " · Unit " + plan.lesson.unit;
        if (plan.dayType === "Continued Lesson") detail += " · second day";
        else if (plan.dayType === "Catch-Up") detail += " · catch-up day";
        card.appendChild(node("p", "cn-lesson-meta", detail));
        if (plan.lesson.objective)
          card.appendChild(node("p", "cn-today-target", plan.lesson.objective));
        var actions = node("div", "cn-preview-actions");
        var studentOpen = openLessonButton(plan.lesson, "Open today’s lesson", true);
        studentOpen.classList.add("hub-student-only");
        var teacherOpen = openLessonButton(plan.lesson, "Prepare this lesson", true);
        teacherOpen.classList.add("hub-teacher-only");
        actions.append(studentOpen, teacherOpen);
        card.appendChild(actions);
      } else {
        card.appendChild(
          node(
            "p",
            "cn-lesson-meta",
            plan.dayType ? plan.dayType + " day — no new lesson." : "No new lesson on this day.",
          ),
        );
        if (plan.next) {
          var upcoming = node("div", "cn-preview-actions");
          upcoming.appendChild(
            openLessonButton(
              plan.next,
              "Next lesson: " + plan.next.id.replace("-", ".") + " " + plan.next.title,
              true,
            ),
          );
          card.appendChild(upcoming);
        }
      }
      preview.appendChild(card);
      var other = node("p", "cn-starter");
      other.append(
        forAudience(
          "Looking for a different lesson? Search or pick a unit from the list.",
          "student",
        ),
        forAudience("Teaching something else? Search or pick a unit from the list.", "teacher"),
      );
      preview.appendChild(other);
    } else {
      title = node("h3", "cn-preview-title", "Choose your next lesson");
      title.id = "nav-lesson-title";
      var starter = node("p", "cn-starter");
      starter.append(
        forAudience(
          "Choose a lesson from the list. Its activities and materials will appear here.",
          "student",
        ),
        forAudience(
          "Choose a lesson from the list to see its materials, student link, and teacher notes.",
          "teacher",
        ),
      );
      preview.append(title, starter);
      var orientation = node("ol", "cn-orientation");
      [
        ["student", "Find your lesson", "Search a topic or choose a unit."],
        ["student", "Open and learn", "Read the learning target, then open your lesson."],
        ["student", "Practice the same math", "Use the lesson’s practice and homework links."],
        ["teacher", "Find the lesson", "Search a topic, a standard, or a lesson number."],
        ["teacher", "Prepare it", "Check the learning target, slides, and teacher notes."],
        ["teacher", "Share the student link", "Copy the link students open in class."],
      ].forEach(function (entry) {
        var step = node("li", entry[0] === "teacher" ? "hub-teacher-only" : "hub-student-only");
        var text = node("div", "");
        text.append(node("strong", "", entry[1]), node("span", "", entry[2]));
        step.appendChild(text);
        orientation.appendChild(step);
      });
      preview.appendChild(orientation);
    }
    var starters = node("div", "cn-starter-links");
    [
      ["/curriculum/learning-labs/", "Explore a learning lab", "student"],
      ["/curriculum/arcade/", "Practice with a game", "student"],
      ["/curriculum/my-progress/", "Check my progress", "student"],
      ["/curriculum/planning/", "Open the pacing planner", "teacher"],
      ["/curriculum/practice-workbooks/", "Practice workbooks", "teacher"],
    ].forEach(function (entry) {
      var link = /** @type {HTMLAnchorElement} */ (
        node("a", entry[2] === "teacher" ? "hub-teacher-only" : "hub-student-only", entry[1])
      );
      link.href = entry[0];
      starters.appendChild(link);
    });
    preview.appendChild(starters);
    var note = node("p", "cn-local-note");
    note.append(
      forAudience(
        "Save useful lessons on this device with the Save lesson button. No sign-in needed.",
        "student",
      ),
      forAudience(
        "Saved lessons and planner moves stay on this device. Nothing here records student work.",
        "teacher",
      ),
    );
    preview.appendChild(note);
  }

  /** @param {CatalogLesson} lesson */
  function renderPreview(lesson) {
    root.classList.remove("cn-idle");
    preview.replaceChildren();
    var back = button("← Back to results", backToResults, "cn-button cn-back");
    back.setAttribute("aria-controls", "nav-results");
    preview.appendChild(back);
    var top = node("div", "cn-preview-heading");
    top.appendChild(
      node("p", "cn-eyebrow", "Unit " + lesson.unit + " / Lesson " + lesson.id.replace("-", ".")),
    );
    var title = node("h3", "cn-preview-title", lesson.title);
    title.id = "nav-lesson-title";
    top.appendChild(title);
    if (
      typeof lesson.titleEs === "string" &&
      matchesQuery(lesson, searchQuery()) &&
      !matchesQuery(lesson, searchQuery(), false)
    ) {
      var translation = node("p", "cn-preview-translation", lesson.titleEs);
      translation.lang = "es";
      top.appendChild(translation);
    }
    top.appendChild(
      node(
        "p",
        "cn-lesson-meta",
        [lesson.standard, lesson.timeEstimate].filter(Boolean).join(" · "),
      ),
    );
    preview.appendChild(top);
    var actions = node("div", "cn-preview-actions");
    if (safePath(launchById.get(lesson.id)?.resources?.lesson)) {
      var launchLink = document.createElement("a");
      launchLink.className = "cn-button cn-primary";
      launchLink.href = studentUrl(lesson.id);
      launchLink.textContent = "Open student lesson";
      actions.appendChild(launchLink);
      var fallback = node("div", "cn-copy-fallback");
      fallback.hidden = true;
      var label = document.createElement("label");
      label.htmlFor = "nav-copy-url";
      label.textContent = "Student link — select and copy";
      var input = document.createElement("input");
      input.id = "nav-copy-url";
      input.type = "url";
      input.readOnly = true;
      input.value = studentUrl(lesson.id);
      fallback.append(label, input);
      actions.appendChild(
        button("Copy student link", function () {
          void copyStudentLink(lesson.id, fallback);
        }),
      );
      preview.append(actions, fallback);
    } else {
      preview.appendChild(actions);
    }
    if (lesson.id === "3-4") {
      var ratioLab = resourceLink(
        "/curriculum/learning-labs/ratio-table-lab/",
        "Ratio Table Lab · Section 1",
        true,
        "learningLab",
      );
      if (ratioLab) {
        ratioLab.className = "cn-button";
        actions.appendChild(ratioLab);
      }
    }
    var saveButton = button(
      saved.has(lesson.id) ? "Saved on this device" : "Save lesson",
      function () {
        toggleSaved(lesson.id);
      },
      "cn-button cn-save",
    );
    saveButton.dataset.saveLesson = lesson.id;
    saveButton.setAttribute("aria-pressed", String(saved.has(lesson.id)));
    actions.appendChild(saveButton);
    var teachControl = /** @type {HTMLButtonElement} */ (
      document.querySelector('[data-guide-teacher-view="today"]')
    );
    if (teachControl) {
      actions.appendChild(
        button(
          "Teach this lesson",
          function () {
            if (!document.body.classList.contains("teacher-mode")) return;
            if (
              !window.CurriculumCockpit?.select ||
              window.CurriculumCockpit.select(lesson.id, { scroll: false }) === false
            ) {
              actionMessage("The teaching tools are still loading. Try again in a moment.");
              return;
            }
            teachControl.click();
          },
          "cn-button cn-teach hub-teacher-only",
        ),
      );
    }
    var actionStatus = node("p", "cn-action-message");
    actionStatus.id = "nav-action-message";
    actionStatus.setAttribute("role", "status");
    actionStatus.setAttribute("aria-live", "polite");
    actionStatus.setAttribute("aria-atomic", "true");
    actions.insertAdjacentElement("afterend", actionStatus);
    var target = node("div", "cn-target");
    target.appendChild(node("h4", "cn-group-title", "Learning target"));
    target.appendChild(
      node("p", "", lesson.objective || "Open the lesson for its learning target."),
    );
    preview.appendChild(target);
    var language = lesson.languageObjective;
    var vocabulary = strings(launchById.get(lesson.id)?.vocabulary || lesson.supports?.vocabulary);
    var frames = strings(
      launchById.get(lesson.id)?.sentenceFrames || lesson.supports?.sentenceFrames,
    );
    if (language || vocabulary.length || frames.length) {
      var supports = document.createElement("details");
      supports.className = "cn-language";
      supports.appendChild(
        node(
          "summary",
          "",
          "Language & vocabulary" + (vocabulary.length ? " · " + vocabulary.length + " words" : ""),
        ),
      );
      if (language) supports.appendChild(node("p", "", language));
      if (vocabulary.length) {
        var words = node("ul", "cn-vocabulary");
        vocabulary.forEach(function (word) {
          words.appendChild(node("li", "", word));
        });
        supports.appendChild(words);
      }
      if (frames.length) {
        supports.appendChild(node("h4", "cn-group-title", "Talk about your thinking"));
        var frameList = node("ul", "cn-frames");
        frames.forEach(function (frame) {
          frameList.appendChild(node("li", "", frame));
        });
        supports.appendChild(frameList);
      }
      preview.appendChild(supports);
    }
    resourceGroup(lesson, "Get ready & explore", [
      ["readiness", "Readiness check"],
      ["learningLab", "Interactive learning lab"],
    ]);
    resourceGroup(lesson, "Learn & practice", [
      ["lesson", "Interactive lesson"],
      ["guidedNotes", "Guided notes"],
      ["handout", "Handout"],
      ["worksheetLevel0", "Start with support"],
      ["worksheet", "Worksheet 1"],
      ["worksheet2", "Worksheet 2"],
      ["mstarWorksheet", "MSTAR practice"],
      ["studentHelp", "Student help"],
      ["exitTicket", "Final check"],
    ]);
    relatedGroup(lesson.id, "Continue with Part 2", launch.partTwo || []);
    relatedGroup(lesson.id, "Small-group learning", launch.smallGroups || []);
    relatedGroup(lesson.id, "Catch up & reconnect", launch.catchUps || []);
    resourceGroup(lesson, "At home", [
      ["homework", "Homework"],
      ["familyPage", "Family guide"],
    ]);
    resourceGroup(
      lesson,
      "Teacher preparation",
      [
        ["slides", "Teaching slides"],
        ["teacherNotes", "Teacher notes"],
        ["guidedNotesPdf", "Guided notes · PDF"],
        ["guidedNotesDocx", "Guided notes · Word"],
        ["mstarWorksheetPdf", "MSTAR practice · PDF"],
        ["homeworkDocx", "Homework · Word"],
      ],
      true,
    );
    preview.appendChild(
      node(
        "p",
        "cn-local-note",
        "Saved and recent lessons stay on this device. Opening a lesson does not record student learning or mastery.",
      ),
    );
  }

  /** @param {string} id @param {boolean} [focus] @param {boolean} [history] @param {boolean} [fromCockpit] */
  function select(id, focus, history, fromCockpit) {
    var lesson = byId.get(id);
    if (!lesson) return;
    selected = id;
    explicitSelection = true;
    renderPreview(lesson);
    renderResults();
    if (history) {
      var nextRecent = [id]
        .concat(
          recent.filter(function (value) {
            return value !== id;
          }),
        )
        .slice(0, 4);
      if (storeIds(RECENT_KEY, nextRecent)) {
        recent = nextRecent;
        renderRecent();
      } else actionMessage("Lesson opened. This browser could not save your recent lessons.");
      updateUrl(false);
    }
    if (!fromCockpit && window.CurriculumCockpit?.select && !syncing) {
      syncing = true;
      try {
        window.CurriculumCockpit.select(id, { scroll: false });
      } finally {
        syncing = false;
      }
    }
    if (focus) preview.focus({ preventScroll: false });
  }

  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    search.value = (params.get("q") || "").slice(0, 200);
    var requestedUnit = params.get("u") || "";
    unit.value = Array.from(unit.options).some(function (option) {
      return option.value === requestedUnit;
    })
      ? requestedUnit
      : "";
    onlySaved = params.get("saved") === "1";
    limit = PAGE_SIZE;
    var requested = normalize(params.get("lesson") || "");
    if (byId.has(requested)) {
      selected = requested;
      explicitSelection = true;
      includeResult(requested);
      renderPreview(byId.get(requested));
    } else {
      selected = "";
      explicitSelection = false;
      renderIdle();
      if (requested)
        message.textContent =
          "That lesson is not in this catalog. Choose a lesson from the results.";
    }
    renderResults();
  }

  function resetFilters() {
    window.clearTimeout(searchTimer);
    search.value = "";
    unit.value = "";
    onlySaved = false;
    limit = PAGE_SIZE;
    renderResults();
    updateUrl(false);
    search.focus();
  }

  function connectCockpit() {
    // Wait for URL restoration before subscribing to an already available cockpit.
    if (subscribed || !lessons.length || !window.CurriculumCockpit?.onSelect) return;
    subscribed = true;
    window.CurriculumCockpit.onSelect(function (id) {
      if (!syncing && byId.has(id) && id !== selected) select(id, false, true, true);
    });
    if (explicitSelection && selected) {
      syncing = true;
      try {
        window.CurriculumCockpit.select(selected, { scroll: false });
      } finally {
        syncing = false;
      }
    }
  }

  /** @param {string} url @param {boolean} refresh */
  async function loadJson(url, refresh) {
    if (!refresh && window.NTJsonCache?.json) return window.NTJsonCache.json(url);
    var response = await fetch(url, {
      credentials: "same-origin",
      cache: refresh ? "reload" : "default",
    });
    if (!response.ok) throw new Error("Catalog request failed: " + response.status);
    return response.json();
  }

  /** @param {boolean} [refresh] */
  async function load(refresh) {
    if (loading) return;
    loading = true;
    root.setAttribute("aria-busy", "true");
    retry.hidden = true;
    status.textContent = "Loading the lesson catalog…";
    more.hidden = true;
    try {
      var data = await Promise.all([
        loadJson("/data/curriculum-manifest.json", !!refresh),
        loadJson("/data/curriculum-launch-manifest.json", !!refresh),
      ]);
      if (
        !Array.isArray(data[0]?.lessons) ||
        !data[0].lessons.length ||
        !Array.isArray(data[1]?.lessons) ||
        !data[1].lessons.length
      )
        throw new Error("Invalid catalog");
      lessons = data[0].lessons.filter(function (lesson) {
        return (
          lesson &&
          /^\d{1,2}-\d{1,2}$/.test(lesson.id) &&
          typeof lesson.title === "string" &&
          Number.isInteger(lesson.unit) &&
          lesson.resources &&
          typeof lesson.resources === "object" &&
          !Array.isArray(lesson.resources)
        );
      });
      byId = new Map(
        lessons.map(function (lesson) {
          return [lesson.id, lesson];
        }),
      );
      if (!lessons.length || byId.size !== lessons.length) throw new Error("Invalid lessons");
      launch = data[1];
      launchById = new Map(
        launch.lessons
          .filter(function (lesson) {
            return lesson && byId.has(lesson.id) && lesson.resources;
          })
          .map(function (lesson) {
            return [lesson.id, lesson];
          }),
      );
      ["partTwo", "smallGroups", "catchUps"].forEach(function (key) {
        if (!Array.isArray(launch[key])) launch[key] = [];
        else
          launch[key] = launch[key].filter(function (lesson) {
            return lesson && typeof lesson.title === "string" && lesson.resources;
          });
      });
      saved = new Set(readIds(SAVED_KEY));
      recent = readIds(RECENT_KEY).slice(0, 4);
      unit.replaceChildren(new Option("All units", ""));
      Array.from(
        new Set(
          lessons.map(function (lesson) {
            return lesson.unit;
          }),
        ),
      )
        .sort(function (a, b) {
          return a - b;
        })
        .forEach(function (number) {
          unit.appendChild(new Option("Unit " + number, String(number)));
        });
      message.textContent = storageReadable
        ? ""
        : "Site storage is unavailable. You can browse lessons and copy their links; saved and recent lessons may not persist.";
      readUrl();
      renderRecent();
      connectCockpit();
    } catch (_error) {
      results.replaceChildren();
      status.textContent = "The lesson catalog could not load.";
      message.textContent =
        "Check your connection, then try again. The unit library is also available below.";
      retry.hidden = false;
    } finally {
      loading = false;
      root.setAttribute("aria-busy", "false");
    }
  }

  search.setAttribute("aria-controls", "nav-results");
  search.addEventListener("input", function () {
    window.clearTimeout(searchTimer);
    limit = PAGE_SIZE;
    renderResults();
    searchTimer = window.setTimeout(function () {
      updateUrl(true);
    }, 200);
  });
  search.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      var first = matching()[0];
      if (first) {
        window.clearTimeout(searchTimer);
        select(first.id, true, true);
      }
    }
  });
  unit.addEventListener("change", function () {
    limit = PAGE_SIZE;
    renderResults();
    updateUrl(false);
  });
  savedFilter.addEventListener("click", function () {
    onlySaved = !onlySaved;
    limit = PAGE_SIZE;
    renderResults();
    updateUrl(false);
  });
  reset.addEventListener("click", resetFilters);
  document.addEventListener("ewl:audit-filter", function () {
    limit = PAGE_SIZE;
    renderResults();
  });
  more.addEventListener("click", function () {
    var firstNew = results.querySelectorAll("[data-lesson-id]").length;
    limit += PAGE_SIZE;
    renderResults();
    /** @type {HTMLElement} */ (results.querySelectorAll("[data-lesson-id]")[firstNew])?.focus();
  });
  retry.addEventListener("click", function () {
    void load(true);
  });
  window.addEventListener("popstate", function () {
    window.clearTimeout(searchTimer);
    if (!lessons.length) return;
    readUrl();
    if (selected && window.CurriculumCockpit?.select) {
      syncing = true;
      try {
        window.CurriculumCockpit.select(selected, { scroll: false });
      } finally {
        syncing = false;
      }
    }
  });
  window.addEventListener("storage", function (event) {
    if (event.key !== SAVED_KEY && event.key !== RECENT_KEY && event.key !== null) return;
    saved = new Set(readIds(SAVED_KEY));
    recent = readIds(RECENT_KEY).slice(0, 4);
    renderResults();
    renderRecent();
    var saveButton = preview.querySelector("[data-save-lesson]");
    if (saveButton) {
      saveButton.textContent = saved.has(selected) ? "Saved on this device" : "Save lesson";
      saveButton.setAttribute("aria-pressed", String(saved.has(selected)));
    }
  });
  // The existing command center creates its public API after asynchronous loading.
  // Observe only added nodes until that bridge is ready, then disconnect.
  var observer = new MutationObserver(function () {
    connectCockpit();
    if (subscribed) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.setTimeout(function () {
    observer.disconnect();
  }, 15000);
  void load();
})();

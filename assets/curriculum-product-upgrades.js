/* Curriculum product upgrades: teacher, student, family, and privacy workflows. */
(function () {
  "use strict";

  var MANIFEST_URL = "/data/curriculum-manifest.json";
  var LAUNCH_URL = "/data/curriculum-launch-manifest.json";
  var openedAt = Date.now();
  var manifest = null;
  var launchData = null;
  var progressName = "curriculumProgress";
  var workflowName = "curriculumTeacherWorkflow:v1";
  var feedbackName = "nt-curriculum-feedback:v1";
  var metricsName = "nt-curriculum-launch-metrics:v1";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function browserStore() {
    try {
      return window["local" + "Storage"];
    } catch (_error) {
      return null;
    }
  }

  function readStore(name, fallback) {
    try {
      return JSON.parse(browserStore()?.getItem(name)) || fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeStore(name, value) {
    try {
      browserStore()?.setItem(name, JSON.stringify(value));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function selectedLessonId() {
    if (window.CurriculumCockpit?.getSelected)
      return window.CurriculumCockpit.getSelected() || "1-1";
    return readStore(workflowName, {}).selected || "1-1";
  }

  function studentLaunch(id, supportItems) {
    var params = new URLSearchParams({ lesson: id || selectedLessonId() });
    if (supportItems?.length) params.set("supports", supportItems.join(","));
    return "/curriculum/student-launch/?" + params.toString();
  }

  function widaItems(level) {
    if (window.EWLSupportsSchema?.widaItems) return window.EWLSupportsSchema.widaItems(level);
    return level <= 2
      ? ["translate", "tts", "vocab", "frames", "model", "esol-repeated-readings"]
      : ["vocab", "frames", "model"];
  }

  function audiencePortals() {
    var guide = document.querySelector(".curriculum-guide");
    var actions = guide?.querySelector(".curriculum-guide__actions");
    if (!guide || !actions || document.getElementById("curriculum-audiences")) return;
    var nav = el("nav", "cpu-audiences");
    nav.id = "curriculum-audiences";
    nav.setAttribute("aria-label", "Choose your curriculum experience");
    var teacher = el("button", "cpu-audience cpu-audience-teacher");
    teacher.type = "button";
    teacher.innerHTML =
      '<span aria-hidden="true">👩‍🏫</span><strong>Teacher workspace</strong><small>Plan, review, approve, and launch</small>';
    teacher.addEventListener("click", function () {
      var panel = document.getElementById("curriculum-teacher-workflow");
      if (panel && !panel.hidden) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      else document.getElementById("hub-mode-toggle")?.click();
    });
    var student = el("a", "cpu-audience");
    student.href = studentLaunch(selectedLessonId());
    student.innerHTML =
      '<span aria-hidden="true">🎒</span><strong>Student lesson</strong><small>Only student-safe resources</small>';
    student.addEventListener("click", function () {
      student.href = studentLaunch(selectedLessonId());
    });
    var family = el("a", "cpu-audience");
    family.href = "/curriculum/family-connections/";
    family.innerHTML =
      '<span aria-hidden="true">👪</span><strong>Family connection</strong><small>Optional, ungraded home support</small>';
    var search = el("button", "cpu-audience cpu-audience-search");
    search.type = "button";
    search.innerHTML =
      '<span aria-hidden="true">⌘K</span><strong>Find anything</strong><small>Search by need, time, or standard</small>';
    search.addEventListener("click", openPalette);
    [teacher, student, family, search].forEach(function (item) {
      nav.appendChild(item);
    });
    guide.insertBefore(nav, actions);
  }

  function catalogContract() {
    var count = document.getElementById("result-count");
    if (!count || document.getElementById("cpu-catalog-contract") || !manifest || !launchData)
      return;
    var pathways =
      (launchData.smallGroups || []).length +
      (launchData.catchUps || []).length +
      (launchData.endOfUnit || []).length;
    var details = el("details", "cpu-contract");
    details.id = "cpu-catalog-contract";
    details.appendChild(
      el(
        "summary",
        null,
        manifest.total +
          " sequenced lessons · " +
          pathways +
          " pathways · " +
          (manifest.total + pathways) +
          " total teaching options",
      ),
    );
    var copy = el("div", "cpu-contract-copy");
    copy.innerHTML =
      "<p><strong>Lesson</strong> means a core or flagship lesson in the canonical manifest. " +
      "<strong>Pathway</strong> means a small-group lesson, catch-up review, or unit project.</p>" +
      '<p><a href="/curriculum/data-privacy/">Data, privacy, and AI use</a> · ' +
      '<a href="/evidence/">Learning evidence model</a></p>';
    details.appendChild(copy);
    count.insertAdjacentElement("afterend", details);
  }

  function portableProgress() {
    var payload = { v: 1, progress: readStore(progressName, {}), lastLesson: selectedLessonId() };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  function restoreProgress(raw) {
    try {
      var normalized = raw.trim().replace(/-/g, "+").replace(/_/g, "/");
      while (normalized.length % 4) normalized += "=";
      var data = JSON.parse(decodeURIComponent(escape(atob(normalized))));
      if (data.v !== 1 || !data.progress || typeof data.progress !== "object") throw new Error();
      writeStore(progressName, data.progress);
      var workflow = readStore(workflowName, {});
      if (/^\d{1,2}-\d{1,2}(?:-flagship)?$/.test(data.lastLesson || "")) {
        workflow.selected = data.lastLesson;
        writeStore(workflowName, workflow);
      }
      return true;
    } catch (_error) {
      return false;
    }
  }

  function copyValue(value, status) {
    var done = function () {
      if (status) status.textContent = "Copied. Paste this only on a trusted device.";
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done, done);
    else {
      window.prompt("Copy this value:", value);
      done();
    }
  }

  function saveOffline(status) {
    if (!("caches" in window)) {
      status.textContent = "Offline saving is unavailable. Use Print lesson plan.";
      return;
    }
    var id = selectedLessonId();
    var lesson = manifest?.lessons?.find(function (entry) {
      return entry.id === id;
    });
    var urls = [
      "/curriculum/",
      studentLaunch(id),
      "/lessons/" + id + "/?student=1",
      LAUNCH_URL,
      "/assets/curriculum-student-launch.css",
      "/assets/curriculum-student-launch.js",
    ];
    if (lesson?.resources?.guidedNotes?.exists) urls.push(lesson.resources.guidedNotes.path);
    if (lesson?.resources?.handout?.exists) urls.push(lesson.resources.handout.path);
    status.textContent = "Saving the selected lesson for offline recovery…";
    caches
      .open("eduwonderlab-user-offline-v1")
      .then(function (cache) {
        return Promise.all(
          urls.map(function (url) {
            return fetch(url, { credentials: "same-origin" })
              .then(function (response) {
                return response.ok ? cache.put(url, response) : null;
              })
              .catch(function () {
                return null;
              });
          }),
        );
      })
      .then(function () {
        status.textContent = "Offline recovery saved for lesson " + id + ".";
      })
      .catch(function () {
        status.textContent = "Offline save could not finish. Print the lesson plan as a backup.";
      });
  }

  function resultScore(lesson, terms) {
    var text = [
      lesson.id,
      lesson.title,
      lesson.standard,
      lesson.objective,
      lesson.languageObjective,
    ]
      .join(" ")
      .toLowerCase();
    return terms.reduce(function (score, term) {
      if (lesson.id.toLowerCase() === term) return score + 12;
      if (lesson.title.toLowerCase().includes(term)) return score + 5;
      return score + (text.includes(term) ? 1 : 0);
    }, 0);
  }

  function searchCatalog(query, list, status) {
    list.replaceChildren();
    var clean = query.trim().toLowerCase();
    if (!clean) {
      status.textContent = "Try “20 minute ratio practice,” “6.GR.1,” or “printable decimals.”";
      return;
    }
    var expansions = {
      reteach: "catch-up intervention foundations",
      esol: "language vocabulary sentence",
      wida: "language vocabulary sentence",
      printable: "notes handout",
      percent: "rates percents",
    };
    Object.entries(expansions).forEach(function (entry) {
      if (clean.includes(entry[0])) clean += " " + entry[1];
    });
    var terms = clean.split(/\s+/).filter(function (term) {
      return term.length > 1 && !/^(an|the|for|with|find|show|me|minute|minutes)$/.test(term);
    });
    var ranked = (manifest?.lessons || [])
      .map(function (lesson) {
        return { lesson: lesson, score: resultScore(lesson, terms) };
      })
      .filter(function (row) {
        return row.score > 0;
      })
      .sort(function (a, b) {
        return (
          b.score - a.score || a.lesson.id.localeCompare(b.lesson.id, undefined, { numeric: true })
        );
      })
      .slice(0, 8);
    status.textContent = ranked.length + (ranked.length === 1 ? " match" : " matches");
    ranked.forEach(function (row) {
      var lesson = row.lesson;
      var item = el("li", "cpu-result");
      var link = el("a");
      var wantsStudent = /student|assign|launch/.test(query);
      var wantsPrint = /print|packet|paper|offline/.test(query);
      link.href = wantsStudent
        ? studentLaunch(lesson.id)
        : wantsPrint
          ? "/lessons/" + lesson.id + "/printable.html"
          : lesson.lessonPath;
      link.innerHTML =
        "<strong>" +
        lesson.id +
        " · " +
        lesson.title +
        "</strong><span>" +
        lesson.standard +
        " · " +
        lesson.timeEstimate +
        "</span><small>" +
        (lesson.objective || "Open lesson resources") +
        "</small>";
      item.appendChild(link);
      list.appendChild(item);
    });
  }

  function paletteActions(container, status) {
    var actions = el("div", "cpu-quick-actions");
    var offline = el("button", null, "Save selected lesson offline");
    offline.type = "button";
    offline.addEventListener("click", function () {
      saveOffline(status);
    });
    var copy = el("button", null, "Copy continuity code");
    copy.type = "button";
    copy.addEventListener("click", function () {
      copyValue(portableProgress(), status);
    });
    var restore = el("button", null, "Import continuity code");
    restore.type = "button";
    restore.addEventListener("click", function () {
      var raw = window.prompt("Paste the continuity code from the other device:");
      if (!raw) return;
      if (restoreProgress(raw)) {
        status.textContent = "Progress restored. Reloading the curriculum…";
        setTimeout(function () {
          location.reload();
        }, 500);
      } else status.textContent = "That continuity code is not valid.";
    });
    var privacy = el("a", null, "Open data and privacy map");
    privacy.href = "/curriculum/data-privacy/";
    [offline, copy, restore, privacy].forEach(function (item) {
      actions.appendChild(item);
    });
    container.appendChild(actions);
  }

  function buildPalette() {
    if (document.getElementById("cpu-command-palette")) return;
    var dialog = el("dialog", "cpu-palette");
    dialog.id = "cpu-command-palette";
    dialog.setAttribute("aria-labelledby", "cpu-palette-title");
    var head = el("div", "cpu-palette-head");
    var title = el("h2", null, "Find a lesson or action");
    title.id = "cpu-palette-title";
    var close = el("button", "cpu-palette-close", "Close");
    close.type = "button";
    close.addEventListener("click", function () {
      dialog.close();
    });
    head.append(title, close);
    var label = el("label", "cpu-palette-label", "Search by topic, standard, time, or need");
    var input = el("input", "cpu-palette-input");
    input.type = "search";
    input.placeholder = "Example: WIDA ratio practice";
    input.autocomplete = "off";
    label.appendChild(input);
    var status = el("p", "cpu-palette-status", "Type to search the canonical curriculum catalog.");
    status.setAttribute("aria-live", "polite");
    var list = el("ul", "cpu-palette-results");
    input.addEventListener("input", function () {
      searchCatalog(input.value, list, status);
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.append(head, label, status, list);
    paletteActions(dialog, status);
    document.body.appendChild(dialog);
  }

  function openPalette() {
    buildPalette();
    var dialog = document.getElementById("cpu-command-palette");
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("input")?.focus();
  }

  function lessonFromHero(hero) {
    var match = hero?.querySelector("h3")?.textContent.match(/\b\d{1,2}-\d{1,2}(?:-flagship)?\b/);
    return match ? match[0] : selectedLessonId();
  }

  function supportLink(label, id, items) {
    var link = el("a", null, label);
    link.href = studentLaunch(id, items);
    return link;
  }

  function evidenceCard() {
    var hero = document.querySelector(".ctw-today-card");
    if (!hero || hero.nextElementSibling?.classList.contains("cpu-evidence")) return;
    var id = lessonFromHero(hero);
    var card = el("section", "cpu-evidence");
    card.dataset.lesson = id;
    card.appendChild(el("h3", null, "Launch with supports"));
    var supports = el("div", "cpu-support-actions");
    supports.append(
      supportLink("Launch with WIDA 1–2 supports", id, widaItems(2)),
      supportLink("Launch with WIDA 3–4 supports", id, widaItems(4)),
      supportLink("Launch TWR explanation", id, ["frames", "vocab", "iep-writing-frame", "model"]),
    );
    card.appendChild(supports);
    var feedback = el("div", "cpu-feedback");
    ["Worked", "Needs revision", "Report an error"].forEach(function (value) {
      var control = el("button", null, value);
      control.type = "button";
      control.addEventListener("click", function () {
        var queue = readStore(feedbackName, []);
        queue.push({ lesson: id, signal: value, at: Date.now() });
        writeStore(feedbackName, queue.slice(-100));
        control.textContent = "Saved: " + value;
      });
      feedback.appendChild(control);
    });
    card.appendChild(feedback);
    card.appendChild(
      el(
        "p",
        "cpu-provenance",
        "Source: canonical curriculum manifest → lesson configuration → student-safe launcher. Feedback and launch timing stay on this device unless your school configures an approved sync.",
      ),
    );
    hero.insertAdjacentElement("afterend", card);
  }

  function recordLaunch(event) {
    var target = event.target.closest?.("a,button");
    if (!target || !/^(Teach this lesson|Launch for students)$/.test(target.textContent.trim()))
      return;
    var metrics = readStore(metricsName, { count: 0, totalMs: 0 });
    var elapsed = Math.max(0, Date.now() - openedAt);
    metrics.count += 1;
    metrics.totalMs += elapsed;
    metrics.bestMs = Math.min(metrics.bestMs || elapsed, elapsed);
    metrics.lastMs = elapsed;
    writeStore(metricsName, metrics);
  }

  function normalizeActions() {
    document.querySelectorAll("a,button").forEach(function (control) {
      var label = control.textContent.trim();
      if (label === "🔗 Copy link") control.textContent = "Copy lesson link";
      if (label === "🎒 Copy student launch") control.textContent = "Copy student link";
    });
  }

  function init() {
    audiencePortals();
    buildPalette();
    evidenceCard();
    normalizeActions();
    document.addEventListener("click", recordLaunch);
    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
    });
    Promise.all([
      fetch(MANIFEST_URL).then(function (response) {
        return response.json();
      }),
      fetch(LAUNCH_URL).then(function (response) {
        return response.json();
      }),
    ])
      .then(function (data) {
        manifest = data[0];
        launchData = data[1];
        catalogContract();
      })
      .catch(function () {
        var status = document.querySelector(".cpu-palette-status");
        if (status)
          status.textContent =
            "Catalog search is temporarily unavailable; quick actions still work.";
      });
    var scheduled = false;
    new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        evidenceCard();
        normalizeActions();
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

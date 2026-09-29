/* Curriculum product upgrades: teacher, student, family, and privacy workflows. */
(function () {
  "use strict";

  var MANIFEST_URL = "/data/curriculum-manifest.json";
  var LAUNCH_URL = "/data/curriculum-launch-manifest.json";

  // Routed through /assets/curriculum-json-cache.js so the hub fetches each
  // data file once instead of once per feature script.
  function loadJson(url) {
    var cache = window.NTJsonCache;
    if (cache) return cache.json(url);
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("Catalog request failed");
      return response.json();
    });
  }

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
      var store = browserStore();
      if (!store) return false;
      store.setItem(name, JSON.stringify(value));
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
    var actions =
      guide?.querySelector(".curriculum-guide__actions") ||
      (document.getElementById("curriculum-navigator") &&
        document.querySelector(".curriculum-guide__actions"));
    if (!guide || !actions) return;
    // The hub ships the nav statically (curriculum/index.html) so the header
    // does not reflow after load — bind to it. Other pages get it built here.
    var existing = document.getElementById("curriculum-audiences");
    if (existing) {
      if (existing.dataset.bound) return;
      existing.dataset.bound = "1";
      bindAudience(
        existing.querySelector('[data-audience="teacher"]'),
        existing.querySelector('[data-audience="student"]'),
        existing.querySelector('[data-audience="search"]'),
      );
      return;
    }
    var nav = el("nav", "cpu-audiences");
    nav.id = "curriculum-audiences";
    nav.setAttribute("aria-label", "Choose your curriculum experience");
    var teacher = el("button", "cpu-audience cpu-audience-teacher");
    teacher.type = "button";
    teacher.innerHTML =
      '<span aria-hidden="true">👩‍🏫</span><strong>Teacher workspace</strong><small>Plan, review, approve, and launch</small>';
    var student = el("a", "cpu-audience");
    student.innerHTML =
      '<span aria-hidden="true">🎒</span><strong>Student lesson</strong><small>Only student-safe resources</small>';
    var family = el("a", "cpu-audience");
    family.href = "/curriculum/family-connections/";
    family.innerHTML =
      '<span aria-hidden="true">👪</span><strong>Family connection</strong><small>Optional, ungraded home support</small>';
    var search = el("button", "cpu-audience cpu-audience-search");
    search.type = "button";
    search.innerHTML =
      '<span aria-hidden="true">⌘K</span><strong>Find anything</strong><small>Search by need, time, or standard</small>';
    bindAudience(teacher, student, search);
    [teacher, student, family, search].forEach(function (item) {
      nav.appendChild(item);
    });
    guide.insertBefore(nav, actions);
  }

  function bindAudience(teacher, student, search) {
    if (teacher)
      teacher.addEventListener("click", function () {
        var panel = document.getElementById("curriculum-teacher-workflow");
        // On the Curriculum Hub console the panel is always rendered, because the
        // page is password-gated and boots in Teacher Mode. The toggle fallback is
        // for the other pages this bundle loads on, where one may still exist; it
        // is optional-chained because on the console there is none, and a click on
        // nothing must be a no-op rather than a throw.
        if (panel && !panel.hidden) panel.scrollIntoView({ behavior: "smooth", block: "start" });
        else document.getElementById("hub-mode-toggle")?.click();
      });
    if (student) {
      student.href = studentLaunch(selectedLessonId());
      student.addEventListener("click", function () {
        student.href = studentLaunch(selectedLessonId());
      });
    }
    if (search) search.addEventListener("click", openPalette);
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
    try {
      var store = browserStore();
      if (!store) return null;
      var progress = JSON.parse(store.getItem(progressName) || "{}");
      if (!progress || typeof progress !== "object" || Array.isArray(progress)) return null;
      var payload = { v: 1, progress: progress, lastLesson: selectedLessonId() };
      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    } catch (_error) {
      return null;
    }
  }

  function restoreProgress(raw) {
    var data;
    try {
      var normalized = raw.trim().replace(/-/g, "+").replace(/_/g, "/");
      while (normalized.length % 4) normalized += "=";
      data = JSON.parse(decodeURIComponent(escape(atob(normalized))));
      if (
        data.v !== 1 ||
        !data.progress ||
        typeof data.progress !== "object" ||
        Array.isArray(data.progress)
      )
        return "invalid";
    } catch (_error) {
      return "invalid";
    }
    if (!writeStore(progressName, data.progress)) return "unavailable";
    var workflow = readStore(workflowName, {});
    if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) workflow = {};
    if (/^\d{1,2}-\d{1,2}(?:-flagship)?$/.test(data.lastLesson || "")) {
      workflow.selected = data.lastLesson;
      if (!writeStore(workflowName, workflow)) return "progress-only";
    }
    return "restored";
  }

  function clearManualCopy() {
    document.getElementById("cpu-manual-copy")?.remove();
  }

  async function copyValue(value, status) {
    clearManualCopy();
    if (value == null) {
      status.textContent =
        "Saved progress is unavailable on this device. A continuity code could not be created.";
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      status.textContent = "Copied. Paste this only on a trusted device.";
    } catch (_error) {
      var label = el("label", "cpu-manual-copy", "Continuity code — copy to a trusted device");
      label.id = "cpu-manual-copy";
      var field = el("textarea");
      field.readOnly = true;
      field.rows = 3;
      field.value = value;
      label.appendChild(field);
      status.insertAdjacentElement("afterend", label);
      status.textContent =
        "Automatic copying is unavailable. Copy the selected code with your keyboard or device’s Copy command.";
      field.focus();
      field.select();
    }
  }

  async function saveOffline(status) {
    if (!("caches" in window)) {
      status.textContent = "Recovery-file saving is unavailable. Use Print lesson plan.";
      return;
    }
    var id = selectedLessonId();
    var lesson = manifest?.lessons?.find(function (entry) {
      return entry.id === id;
    });
    if (!lesson) {
      status.textContent =
        "Lesson resources are not available yet. Check your connection and try again.";
      return;
    }
    var urls = [
      "/curriculum/",
      studentLaunch(id),
      "/lessons/" + id + "/?student=1",
      LAUNCH_URL,
      "/assets/curriculum-student-launch.css",
      "/assets/curriculum-student-launch.js",
    ];
    if (lesson.resources?.guidedNotes?.exists) urls.push(lesson.resources.guidedNotes.path);
    if (lesson.resources?.handout?.exists) urls.push(lesson.resources.handout.path);
    status.textContent = "Saving recovery files for lesson " + id + "…";
    try {
      var cache = await caches.open("eduwonderlab-user-offline-v1");
      var results = await Promise.all(
        urls.map(async function (url) {
          try {
            var response = await fetch(url, { credentials: "same-origin" });
            if (!response.ok) return false;
            await cache.put(url, response);
            return true;
          } catch (_error) {
            return false;
          }
        }),
      );
      var saved = results.filter(Boolean).length;
      status.textContent = saved
        ? saved +
          " of " +
          urls.length +
          " recovery files cached for lesson " +
          id +
          ". " +
          (saved < urls.length ? "Some files could not be saved. " : "") +
          "Activities may still need internet; keep a printed lesson plan as backup."
        : "No recovery files were saved. Check your connection or print the lesson plan as a backup.";
    } catch (_error) {
      status.textContent = "Recovery files could not be saved. Print the lesson plan as a backup.";
    }
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
    var offline = el("button", null, "Save lesson recovery files");
    offline.type = "button";
    offline.addEventListener("click", async function () {
      offline.disabled = true;
      try {
        await saveOffline(status);
      } finally {
        offline.disabled = false;
      }
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
      var result = restoreProgress(raw);
      if (result === "restored" || result === "progress-only") {
        status.textContent =
          result === "restored"
            ? "Progress restored. Reloading the curriculum…"
            : "Progress restored; the selected lesson could not be saved. Reloading the curriculum…";
        setTimeout(function () {
          location.reload();
        }, 500);
      } else
        status.textContent =
          result === "unavailable"
            ? "Progress could not be saved on this device. Allow site storage, then try importing again."
            : "That continuity code is not valid.";
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
    dialog.addEventListener("close", clearManualCopy);
    dialog.append(head, label, status, list);
    paletteActions(dialog, status);
    document.body.appendChild(dialog);
  }

  function openPalette() {
    buildPalette();
    var dialog = /** @type {HTMLDialogElement} */ (document.getElementById("cpu-command-palette"));
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
    Promise.all([loadJson(MANIFEST_URL), loadJson(LAUNCH_URL)])
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

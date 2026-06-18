/* ==========================================================================
   Unit Plan Builder — turns a friendly form into the Canvas-deploy file
   (Setup key/value rows + a blank line + the Plan table) described in
   the canvas-deploy skill's unit-plan-format.md. Output: .csv (zero deps).
   ========================================================================== */
(function () {
  "use strict";

  var STORE_KEY = "neft.unitPlanBuilder.v1";
  var PLAN_HEADERS = [
    "order",
    "date",
    "type",
    "title",
    "body",
    "links",
    "points",
    "available_from",
    "due",
    "until",
    "module",
    "notes",
  ];

  var form = document.getElementById("upb-form");
  var lessonsEl = document.getElementById("upb-lessons");
  var statusEl = document.getElementById("upb-status");
  var previewCard = document.getElementById("upb-preview-card");
  var previewBody = document.getElementById("upb-preview-body");
  var previewCount = document.getElementById("upb-preview-count");
  var lessonSeq = 0;

  init();

  function init() {
    document
      .getElementById("upb-add-lesson")
      .addEventListener("click", function () {
        addLesson();
        save();
      });
    document.getElementById("upb-reset").addEventListener("click", resetForm);
    form.addEventListener("submit", onBuild);
    form.addEventListener("input", function () {
      clearError();
      save();
    });

    if (!restore()) {
      addLesson(); // start with one empty lesson
    }
  }

  /* ---------- Lesson rows ---------- */

  function addLesson(data) {
    lessonSeq += 1;
    var n = lessonSeq;
    var wrap = document.createElement("div");
    wrap.className = "upb-lesson";
    wrap.dataset.lesson = String(n);
    wrap.innerHTML =
      '<div class="upb-lesson-head">' +
      "<h3>Lesson</h3>" +
      '<button type="button" class="upb-btn ghost" data-remove>Remove</button>' +
      "</div>" +
      '<div class="upb-grid2">' +
      field(n, "date", "Lesson date", "date", "") +
      field(n, "title", "Lesson title", "text", "L1 — What is a Ratio?") +
      "</div>" +
      fieldArea(n, "body", "Objective / instructions", "Objective: I can …") +
      '<div class="upb-grid2">' +
      field(
        n,
        "links",
        "eduwonderlab link(s)",
        "text",
        "https://eduwonderlab.com/curriculum/",
      ) +
      field(n, "points", "Exit-ticket points", "number", "10") +
      "</div>" +
      fieldArea(
        n,
        "announce",
        "Morning announcement (optional)",
        "Good morning! Open today's lesson and finish the exit ticket.",
      );
    lessonsEl.appendChild(wrap);

    wrap.querySelector("[data-remove]").addEventListener("click", function () {
      wrap.remove();
      renumber();
      save();
    });

    if (data) {
      setVal(wrap, "date", data.date);
      setVal(wrap, "title", data.title);
      setVal(wrap, "body", data.body);
      setVal(wrap, "links", data.links);
      setVal(wrap, "points", data.points);
      setVal(wrap, "announce", data.announce);
    }
    renumber();
  }

  function field(n, key, label, type, ph) {
    var id = "L" + n + "_" + key;
    return (
      '<div class="upb-field">' +
      '<label for="' +
      id +
      '">' +
      esc(label) +
      "</label>" +
      '<input id="' +
      id +
      '" data-key="' +
      key +
      '" type="' +
      type +
      '" placeholder="' +
      esc(ph) +
      '" autocomplete="off"' +
      (type === "number" ? ' min="0"' : "") +
      " />" +
      "</div>"
    );
  }

  function fieldArea(n, key, label, ph) {
    var id = "L" + n + "_" + key;
    return (
      '<div class="upb-field">' +
      '<label for="' +
      id +
      '">' +
      esc(label) +
      "</label>" +
      '<textarea id="' +
      id +
      '" data-key="' +
      key +
      '" placeholder="' +
      esc(ph) +
      '"></textarea>' +
      "</div>"
    );
  }

  function renumber() {
    var rows = lessonsEl.querySelectorAll(".upb-lesson");
    rows.forEach(function (r, i) {
      r.querySelector("h3").textContent = "Lesson " + (i + 1);
    });
  }

  function setVal(wrap, key, v) {
    var el = wrap.querySelector('[data-key="' + key + '"]');
    if (el) el.value = v == null ? "" : v;
  }

  function readLessons() {
    return Array.prototype.map.call(
      lessonsEl.querySelectorAll(".upb-lesson"),
      function (wrap) {
        var get = function (k) {
          var el = wrap.querySelector('[data-key="' + k + '"]');
          return el ? el.value.trim() : "";
        };
        return {
          date: get("date"),
          title: get("title"),
          body: get("body"),
          links: get("links"),
          points: get("points"),
          announce: get("announce"),
        };
      },
    );
  }

  /* ---------- Build the plan ---------- */

  function readSetup() {
    var g = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };
    return {
      course_url: g("course_url"),
      module_name: g("module_name"),
      module_unlock: g("module_unlock"),
      default_release_time: g("default_release_time") || "7:00 AM",
      default_due_time: g("default_due_time") || "11:59 PM",
      publish: g("publish") || "Yes",
      notify: "No",
    };
  }

  // Build the ordered Plan rows from setup + lessons.
  function buildPlan(setup, lessons) {
    var rows = [];
    var order = 1;
    var firstDate = "";
    lessons.forEach(function (l) {
      if (l.date && !firstDate) firstDate = l.date;
    });

    // Module first.
    rows.push({
      order: order++,
      date: setup.module_unlock || firstDate,
      type: "Module",
      title: setup.module_name,
    });

    lessons.forEach(function (l) {
      if (!l.title && !l.date) return; // skip empty blocks
      if (l.announce) {
        rows.push({
          order: order++,
          date: l.date,
          type: "Announcement",
          title: "Today: " + (l.title || setup.module_name),
          body: l.announce,
        });
      }
      // Page (the lesson reference).
      rows.push({
        order: order++,
        date: l.date,
        type: "Page",
        title: l.title,
        body: l.body,
        links: l.links,
      });
      // Assignment / exit ticket only when points are given.
      if (l.points) {
        rows.push({
          order: order++,
          date: l.date,
          type: "Assignment",
          title: l.title + " — Exit Ticket",
          body: l.body,
          points: l.points,
        });
      }
    });
    return rows;
  }

  /* ---------- CSV ---------- */

  function csvCell(v) {
    v = v == null ? "" : String(v);
    return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function toCSV(setup, planRows) {
    var lines = [];
    // Setup as key,value rows.
    [
      "course_url",
      "module_name",
      "module_unlock",
      "default_release_time",
      "default_due_time",
      "publish",
      "notify",
    ].forEach(function (k) {
      lines.push(csvCell(k) + "," + csvCell(setup[k]));
    });
    lines.push(""); // blank line separates Setup from Plan
    lines.push(PLAN_HEADERS.join(","));
    planRows.forEach(function (r) {
      lines.push(
        PLAN_HEADERS.map(function (h) {
          return csvCell(r[h]);
        }).join(","),
      );
    });
    return lines.join("\r\n");
  }

  /* ---------- Validation + build action ---------- */

  function onBuild(e) {
    e.preventDefault();
    clearError();
    var setup = readSetup();
    var lessons = readLessons();
    var ok = true;

    if (!setup.course_url || !/^https?:\/\//i.test(setup.course_url)) {
      showError(
        "course_url",
        "Add your Canvas course web address (starts with http).",
      );
      ok = false;
    }
    if (!setup.module_name) {
      showError("module_name", "Give the unit a name.");
      ok = false;
    }
    var usable = lessons.filter(function (l) {
      return l.title || l.date;
    });
    if (!usable.length) {
      showError("lessons", "Add at least one lesson with a title and date.");
      ok = false;
    } else if (
      usable.some(function (l) {
        return !l.title || !l.date;
      })
    ) {
      showError("lessons", "Each lesson needs both a date and a title.");
      ok = false;
    }
    if (!ok) {
      statusEl.textContent = "";
      var firstErr = document.querySelector(".upb-error:not([hidden])");
      if (firstErr)
        firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var planRows = buildPlan(setup, usable);
    renderPreview(planRows);
    downloadCSV(setup, planRows);
    save();
  }

  function downloadCSV(setup, planRows) {
    var csv = toCSV(setup, planRows);
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = fileName(setup.module_name);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
    statusEl.textContent =
      "✓ File downloaded — " +
      planRows.length +
      " Canvas items. Scroll down for the next step.";
  }

  function fileName(name) {
    var slug = (name || "unit-plan")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return "Unit-Plan-" + (slug || "unit") + ".csv";
  }

  /* ---------- Preview ---------- */

  function renderPreview(planRows) {
    previewBody.innerHTML = "";
    planRows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        r.order +
        "</td><td>" +
        esc(r.date || "—") +
        '</td><td><span class="upb-pill ' +
        r.type.toLowerCase() +
        '">' +
        esc(r.type) +
        "</span></td><td>" +
        esc(r.title || "—") +
        "</td>";
      previewBody.appendChild(tr);
    });
    previewCount.textContent =
      planRows.length + " items will be created in your Canvas course.";
    previewCard.hidden = false;
    previewCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Errors ---------- */

  function showError(key, msg) {
    var el = document.querySelector('[data-error-for="' + key + '"]');
    if (el) {
      el.textContent = msg;
      el.hidden = false;
    }
  }

  function clearError() {
    document.querySelectorAll(".upb-error").forEach(function (el) {
      el.hidden = true;
      el.textContent = "";
    });
  }

  /* ---------- Persistence ---------- */

  function save() {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ setup: readSetup(), lessons: readLessons() }),
      );
    } catch (err) {
      /* storage optional */
    }
  }

  function restore() {
    var raw;
    try {
      raw = localStorage.getItem(STORE_KEY);
    } catch (err) {
      return false;
    }
    if (!raw) return false;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      return false;
    }
    if (!data) return false;
    if (data.setup) {
      Object.keys(data.setup).forEach(function (k) {
        var el = document.getElementById(k);
        if (el && k !== "notify") el.value = data.setup[k];
      });
    }
    lessonsEl.innerHTML = "";
    (data.lessons && data.lessons.length ? data.lessons : [null]).forEach(
      function (l) {
        addLesson(l);
      },
    );
    return true;
  }

  function resetForm() {
    if (!window.confirm("Clear the whole form and start over?")) return;
    try {
      localStorage.removeItem(STORE_KEY);
    } catch (err) {
      /* ignore */
    }
    form.reset();
    document.getElementById("default_release_time").value = "7:00 AM";
    document.getElementById("default_due_time").value = "11:59 PM";
    lessonsEl.innerHTML = "";
    addLesson();
    previewCard.hidden = true;
    statusEl.textContent = "";
    clearError();
  }

  /* ---------- utils ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();

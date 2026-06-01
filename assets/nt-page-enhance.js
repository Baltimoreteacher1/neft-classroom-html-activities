/*!
 * nt-page-enhance.js — adds a "Save your work" bar to existing activity pages so
 * finished work can be saved as PDF or DOC with the student's name and uploaded
 * to a grading folder. Optional auto-grading if the page sets
 * window.NT_GRADE_ITEMS. Self-contained, no dependencies, offline-first.
 *
 * NOTE: this script intentionally does NOT add a dark-mode toggle. A universal
 * filter-based dark mode looked muddy on these designed pages, so legacy pages
 * render exactly as designed. (The new content pages do their own proper
 * token-based theming via neft-theme.js.)
 *
 * Drop in once, near </body>:  <script src="/assets/nt-page-enhance.js" defer></script>
 */
(function () {
  if (window.__ntPageEnhance) return; // idempotent
  window.__ntPageEnhance = true;

  // Safety: clear any dark-mode state a previous version may have applied, so
  // pages return to their normal look on next load.
  try {
    document.documentElement.classList.remove("nt-dark");
  } catch (e) {}

  // ---- favicon (most legacy pages ship without one) ----------------------
  try {
    if (!document.querySelector('link[rel~="icon"]')) {
      var fav = document.createElement("link");
      fav.rel = "icon";
      fav.href = "/assets/favicon.svg";
      document.head.appendChild(fav);
    }
  } catch (e) {}

  var LS_STUDENT = "nt_student";

  // ---- styles (save bar only) --------------------------------------------
  var css = document.createElement("style");
  css.textContent = [
    ".nt-pe-bar{position:fixed;bottom:0;left:0;right:0;z-index:2147483646;display:flex;",
    "gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;padding:8px 12px;",
    "background:#12355b;color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 -2px 10px rgba(0,0,0,.25);}",
    ".nt-pe-bar input{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid #9bb;",
    "min-width:140px;color:#111;}",
    ".nt-pe-bar button{font:inherit;padding:9px 14px;border-radius:8px;border:0;cursor:pointer;",
    "background:#1fa6a2;color:#fff;min-height:40px;}",
    ".nt-pe-bar button.doc{background:#4f8fd0;}",
    ".nt-pe-bar label{opacity:.9;}",
    "@media print{.nt-pe-bar{display:none!important;}}",
  ].join("");
  document.head.appendChild(css);

  // ---- student name -------------------------------------------------------
  function getStudent() {
    try {
      return JSON.parse(localStorage.getItem(LS_STUDENT) || "{}");
    } catch (e) {
      return {};
    }
  }
  function setStudent(s) {
    try {
      localStorage.setItem(LS_STUDENT, JSON.stringify(s));
    } catch (e) {}
  }
  var stu = getStudent();

  var bar = document.createElement("div");
  bar.className = "nt-pe-bar";
  var nameIn = document.createElement("input");
  nameIn.placeholder = "Your name";
  nameIn.value = stu.name || "";
  nameIn.setAttribute("aria-label", "Your name (for the saved file)");
  nameIn.addEventListener("change", function () {
    stu.name = nameIn.value.trim();
    setStudent(stu);
  });
  var lbl = document.createElement("label");
  lbl.textContent = "Save your work:";
  var pdfBtn = document.createElement("button");
  pdfBtn.textContent = "Save as PDF";
  var docBtn = document.createElement("button");
  docBtn.className = "doc";
  docBtn.textContent = "Save as DOC";

  function safeName() {
    return (stu.name || "Student").replace(/[^A-Za-z0-9._-]+/g, "_");
  }
  function pageSlug() {
    return (document.title || location.pathname)
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .slice(0, 60);
  }
  function maybeGrade() {
    if (!Array.isArray(window.NT_GRADE_ITEMS) || !window.NT_GRADE_ITEMS.length)
      return "";
    var items = window.NT_GRADE_ITEMS,
      earned = 0,
      possible = 0,
      rows = "";
    items.forEach(function (it) {
      var pts = it.points || 1;
      possible += pts;
      var ok =
        String(it.studentAnswer).trim().toLowerCase() ===
        String(it.correctAnswer).trim().toLowerCase();
      if (ok) earned += pts;
      rows +=
        "<tr><td>" +
        (it.prompt || "") +
        "</td><td>" +
        (it.studentAnswer == null ? "" : it.studentAnswer) +
        "</td><td>" +
        (ok ? "✓" : "✗ (" + it.correctAnswer + ")") +
        "</td></tr>";
    });
    var pct = possible ? Math.round((earned / possible) * 100) : 0;
    try {
      var arr = JSON.parse(localStorage.getItem("nt_results_v1") || "[]");
      arr.push({
        schema: "nt_result_v1",
        studentAlias: stu.name || "",
        section: stu.section || "",
        activityId: pageSlug(),
        activityTitle: document.title || "",
        scorePercent: pct,
        completedAt: new Date().toISOString(),
        deviceOnly: true,
      });
      localStorage.setItem("nt_results_v1", JSON.stringify(arr));
    } catch (e) {}
    return (
      "<h3>Score: " +
      pct +
      "% (" +
      earned +
      "/" +
      possible +
      ")</h3><table border=1 cellpadding=6 style='border-collapse:collapse'>" +
      "<tr><th>Question</th><th>Answer</th><th>Result</th></tr>" +
      rows +
      "</table>"
    );
  }
  function header() {
    var d = new Date().toLocaleDateString();
    return (
      "<div style='font:600 16px system-ui;margin:0 0 12px;border-bottom:2px solid #12355b;padding-bottom:8px'>" +
      "Name: " +
      (stu.name || "____________") +
      (stu.section ? " &nbsp; Section: " + stu.section : "") +
      " &nbsp; Date: " +
      d +
      "<br>" +
      (document.title || "") +
      "</div>"
    );
  }

  pdfBtn.addEventListener("click", function () {
    if (!stu.name) {
      nameIn.focus();
      return;
    }
    var orig = document.title;
    document.title = safeName() + "_" + pageSlug();
    window.print();
    setTimeout(function () {
      document.title = orig;
    }, 800);
  });

  docBtn.addEventListener("click", function () {
    if (!stu.name) {
      nameIn.focus();
      return;
    }
    var clone = document.body.cloneNode(true);
    Array.prototype.forEach.call(
      clone.querySelectorAll(".nt-pe-bar"),
      function (n) {
        n.remove();
      },
    );
    var html =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>" +
      (document.title || "") +
      "</title></head><body>" +
      header() +
      maybeGrade() +
      clone.innerHTML +
      "</body></html>";
    var blob = new Blob(["﻿", html], { type: "application/msword" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = safeName() + "_" + pageSlug() + ".doc";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      a.remove();
      URL.revokeObjectURL(url);
    }, 500);
  });

  bar.appendChild(nameIn);
  bar.appendChild(lbl);
  bar.appendChild(pdfBtn);
  bar.appendChild(docBtn);

  // Save bar belongs on activity/test pages, not nav hubs or dashboards.
  function isActivityPage() {
    if (window.NT_ACTIVITY === true) return true;
    if (window.NT_ACTIVITY === false) return false;
    if (document.querySelector("form, textarea")) return true;
    var fields = document.querySelectorAll(
      "input[type='text'],input[type='number'],input:not([type]),input[type='radio'],input[type='checkbox']",
    );
    if (fields.length >= 2) return true;
    if (
      document.querySelector(
        "[class*='quiz' i],[class*='question' i],[class*='activity' i],[class*='answer' i],[id*='quiz' i],[id*='question' i]",
      )
    )
      return true;
    return false;
  }

  function mount() {
    if (isActivityPage()) document.body.appendChild(bar);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();

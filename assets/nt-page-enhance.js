/*!
 * nt-page-enhance.js — one-include upgrade for ANY existing Neft Teacher page.
 * Adds: (1) a universal Light/Dark toggle (works on pages that don't use the
 * --nt-* design tokens, via a filter-based dark mode), and (2) a Save bar with
 * "Save as PDF" + "Save as DOC" that embeds the student's name so finished work
 * can be uploaded to a grading folder. Optional auto-grading if the page sets
 * window.NT_GRADE_ITEMS. Self-contained, no dependencies, offline-first.
 *
 * Drop in once, near </body>:  <script src="/assets/nt-page-enhance.js" defer></script>
 */
(function () {
  if (window.__ntPageEnhance) return; // idempotent
  window.__ntPageEnhance = true;

  var LS_THEME = "nt-page-theme";
  var LS_STUDENT = "nt_student";

  // ---- styles -------------------------------------------------------------
  var css = document.createElement("style");
  css.textContent = [
    "html.nt-dark{filter:invert(0.92) hue-rotate(180deg);background:#0e1116!important;}",
    "html.nt-dark img,html.nt-dark video,html.nt-dark canvas,html.nt-dark iframe,",
    "html.nt-dark svg,html.nt-dark [style*='background-image']{filter:invert(1) hue-rotate(180deg);}",
    ".nt-pe-btn{position:fixed;top:12px;right:12px;z-index:2147483646;width:44px;height:44px;",
    "border-radius:50%;border:1px solid rgba(120,120,120,.4);background:#fff;color:#111;",
    "font-size:20px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;",
    "align-items:center;justify-content:center;}",
    ".nt-pe-bar{position:fixed;bottom:0;left:0;right:0;z-index:2147483646;display:flex;",
    "gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;padding:8px 12px;",
    "background:#12355b;color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 -2px 10px rgba(0,0,0,.25);}",
    ".nt-pe-bar input{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid #9bb;",
    "min-width:140px;color:#111;}",
    ".nt-pe-bar button{font:inherit;padding:9px 14px;border-radius:8px;border:0;cursor:pointer;",
    "background:#1fa6a2;color:#fff;min-height:40px;}",
    ".nt-pe-bar button.doc{background:#4f8fd0;}",
    ".nt-pe-bar label{opacity:.9;}",
    "@media print{.nt-pe-btn,.nt-pe-bar{display:none!important;}}",
  ].join("");
  document.head.appendChild(css);

  // ---- theme toggle -------------------------------------------------------
  function applyTheme(t) {
    document.documentElement.classList.toggle("nt-dark", t === "dark");
    if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
  }
  var saved = null;
  try {
    saved = localStorage.getItem(LS_THEME);
  } catch (e) {}
  if (!saved)
    saved =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

  var btn = document.createElement("button");
  btn.className = "nt-pe-btn";
  btn.setAttribute("aria-label", "Toggle light or dark mode");
  btn.addEventListener("click", function () {
    var t = document.documentElement.classList.contains("nt-dark")
      ? "light"
      : "dark";
    try {
      localStorage.setItem(LS_THEME, t);
    } catch (e) {}
    applyTheme(t);
  });

  // ---- student name + save bar -------------------------------------------
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
    // Optional: page can expose window.NT_GRADE_ITEMS = [{prompt,studentAnswer,correctAnswer,points}]
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
    // persist to the shared results store
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
    // Set the document title so the browser's "Save as PDF" defaults the filename
    // to the student's name, then print (user picks "Save as PDF").
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
    // strip the enhancer UI from the export
    Array.prototype.forEach.call(
      clone.querySelectorAll(".nt-pe-bar,.nt-pe-btn"),
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

  // The Save bar belongs on activity/test pages, not nav hubs or dashboards.
  // Show it when the page opts in (window.NT_ACTIVITY) or looks like an activity:
  // a <form>, a <textarea>, 2+ text/number inputs, or quiz/question/activity markers.
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
    document.body.appendChild(btn); // theme toggle: every page
    if (isActivityPage()) document.body.appendChild(bar); // save bar: activities only
    applyTheme(saved);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();

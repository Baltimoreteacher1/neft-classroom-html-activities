/*!
 * Neft Teacher — Activity Kit (nt-activity-kit.js)
 * Reusable student-identity + auto-grading + PDF/DOC export for every activity.
 * Zero/light dependencies, offline-first, static, no build step.
 *
 * Global: window.NTKit
 *   NTKit.mount(targetEl)
 *   NTKit.grade({ activityId, activityTitle, standard, items:[{prompt, studentAnswer, correctAnswer, points, skill}] })
 *   NTKit.getStudent() / NTKit.setStudent({alias, section})
 *   NTKit.savePDF() / NTKit.saveDOC()
 *   NTKit.getResults() / NTKit.clearResults()
 */
(function (global) {
  "use strict";

  var STUDENT_KEY = "nt_student";
  var RESULTS_KEY = "nt_results_v1";

  /* ---------- small utilities ---------- */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function safeName(s) {
    return (
      String(s || "Student")
        .trim()
        .replace(/[^A-Za-z0-9]+/g, "") || "Student"
    );
  }
  function normAnswer(v) {
    return String(v == null ? "" : v)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }
  function readJSON(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- student identity ---------- */
  function getStudent() {
    return (
      readJSON(STUDENT_KEY, { alias: "", section: "" }) || {
        alias: "",
        section: "",
      }
    );
  }
  function setStudent(s) {
    var cur = getStudent();
    var next = {
      alias: (s && s.alias != null ? s.alias : cur.alias) || "",
      section: (s && s.section != null ? s.section : cur.section) || "",
    };
    writeJSON(STUDENT_KEY, next);
    syncIdentityBar();
    return next;
  }

  /* ---------- state ---------- */
  var state = {
    mountEl: null,
    lastResult: null, // last graded result (full, with perItem)
    lastActivity: null, // { activityId, activityTitle, standard }
  };

  /* ---------- identity bar UI ---------- */
  function buildIdentityBar() {
    var s = getStudent();
    var bar = el("div", "ntkit-bar");
    bar.setAttribute("data-ntkit", "bar");
    bar.innerHTML =
      '<div class="ntkit-bar-row">' +
      '<label class="ntkit-field"><span>Student name</span>' +
      '<input type="text" id="ntkit-alias" placeholder="Your name" value="' +
      esc(s.alias) +
      '"></label>' +
      '<label class="ntkit-field ntkit-field--sm"><span>Section / period</span>' +
      '<input type="text" id="ntkit-section" placeholder="e.g. P3" value="' +
      esc(s.section) +
      '"></label>' +
      '<span class="ntkit-saved" id="ntkit-saved" aria-live="polite"></span>' +
      "</div>";
    return bar;
  }

  function syncIdentityBar() {
    if (!state.mountEl) return;
    var s = getStudent();
    var a = $("#ntkit-alias", state.mountEl);
    var sec = $("#ntkit-section", state.mountEl);
    if (a && a.value !== s.alias) a.value = s.alias;
    if (sec && sec.value !== s.section) sec.value = s.section;
  }

  function flashSaved() {
    var n = state.mountEl && $("#ntkit-saved", state.mountEl);
    if (!n) return;
    n.textContent = "Saved";
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(function () {
      n.textContent = "";
    }, 1200);
  }

  /* ---------- mount ---------- */
  function mount(targetEl) {
    var t = typeof targetEl === "string" ? $(targetEl) : targetEl;
    if (!t) {
      console.warn("[NTKit] mount target not found");
      return null;
    }
    state.mountEl = t;
    t.classList.add("ntkit-root");

    var bar = buildIdentityBar();
    var actions = el("div", "ntkit-actions");
    actions.innerHTML =
      '<button type="button" class="ntkit-btn" id="ntkit-pdf">Save as PDF</button>' +
      '<button type="button" class="ntkit-btn ntkit-btn--alt" id="ntkit-doc">Save as DOC</button>';
    var results = el("div", "ntkit-results");
    results.id = "ntkit-results";
    results.setAttribute("aria-live", "polite");

    t.appendChild(bar);
    t.appendChild(actions);
    t.appendChild(results);

    // persist on input
    t.addEventListener("input", function (e) {
      var id = e.target && e.target.id;
      if (id === "ntkit-alias" || id === "ntkit-section") {
        setStudent({
          alias: ($("#ntkit-alias", t) || {}).value || "",
          section: ($("#ntkit-section", t) || {}).value || "",
        });
        flashSaved();
      }
    });

    $("#ntkit-pdf", t).addEventListener("click", savePDF);
    $("#ntkit-doc", t).addEventListener("click", saveDOC);
    return t;
  }

  /* ---------- grading ---------- */
  function grade(opts) {
    opts = opts || {};
    var items = Array.isArray(opts.items) ? opts.items : [];
    var earned = 0,
      possible = 0;
    var skills = {}; // skill -> {earned, possible}
    var perItem = items.map(function (it, i) {
      var pts = typeof it.points === "number" ? it.points : 1;
      var correct =
        normAnswer(it.studentAnswer) === normAnswer(it.correctAnswer) &&
        normAnswer(it.correctAnswer) !== "";
      var got = correct ? pts : 0;
      earned += got;
      possible += pts;
      var skill = it.skill || "General";
      if (!skills[skill]) skills[skill] = { earned: 0, possible: 0 };
      skills[skill].earned += got;
      skills[skill].possible += pts;
      return {
        index: i,
        prompt: it.prompt || "Question " + (i + 1),
        studentAnswer: it.studentAnswer == null ? "" : String(it.studentAnswer),
        correctAnswer: it.correctAnswer == null ? "" : String(it.correctAnswer),
        points: pts,
        earned: got,
        correct: correct,
        skill: skill,
      };
    });

    var scorePercent =
      possible > 0 ? Math.round((earned / possible) * 1000) / 10 : 0;

    var result = {
      activityId: opts.activityId || "activity",
      activityTitle: opts.activityTitle || "Activity",
      standard: opts.standard || "",
      scorePercent: scorePercent,
      earned: earned,
      possible: possible,
      perItem: perItem,
      skills: skills,
    };

    state.lastResult = result;
    state.lastActivity = {
      activityId: result.activityId,
      activityTitle: result.activityTitle,
      standard: result.standard,
    };

    persistResult(result);
    renderResults(result);
    return result;
  }

  /* ---------- persist graded result (compact schema) ---------- */
  function persistResult(result) {
    var s = getStudent();
    var record = {
      schema: "nt_result_v1",
      studentAlias: s.alias || "",
      section: s.section || "",
      activityId: result.activityId,
      activityTitle: result.activityTitle,
      standard: result.standard,
      scorePercent: result.scorePercent,
      skills: result.skills,
      completedAt: new Date().toISOString(),
      deviceOnly: true,
    };
    var arr = readJSON(RESULTS_KEY, []);
    if (!Array.isArray(arr)) arr = [];
    arr.push(record);
    writeJSON(RESULTS_KEY, arr);
    return record;
  }

  function getResults() {
    return readJSON(RESULTS_KEY, []) || [];
  }
  function clearResults() {
    writeJSON(RESULTS_KEY, []);
    return [];
  }

  /* ---------- results panel ---------- */
  function renderResults(result) {
    var host = state.mountEl && $("#ntkit-results", state.mountEl);
    if (!host) return;
    var s = getStudent();
    var pct = result.scorePercent;
    var tone = pct >= 80 ? "good" : pct >= 60 ? "ok" : "low";

    var rows = result.perItem
      .map(function (it) {
        var mark = it.correct ? "✓" : "✗";
        var cls = it.correct ? "ntkit-correct" : "ntkit-wrong";
        var showCorrect = it.correct
          ? ""
          : '<div class="ntkit-answerline"><span class="ntkit-lbl">Correct:</span> ' +
            esc(it.correctAnswer) +
            "</div>";
        return (
          '<li class="ntkit-item ' +
          cls +
          '">' +
          '<div class="ntkit-mark" aria-hidden="true">' +
          mark +
          "</div>" +
          '<div class="ntkit-itembody">' +
          '<div class="ntkit-prompt">' +
          esc(it.prompt) +
          "</div>" +
          '<div class="ntkit-answerline"><span class="ntkit-lbl">Your answer:</span> ' +
          (it.studentAnswer ? esc(it.studentAnswer) : "<em>(blank)</em>") +
          ' <span class="ntkit-pts">' +
          it.earned +
          "/" +
          it.points +
          "</span></div>" +
          showCorrect +
          "</div></li>"
        );
      })
      .join("");

    var skillRows = Object.keys(result.skills)
      .map(function (k) {
        var sk = result.skills[k];
        var p =
          sk.possible > 0 ? Math.round((sk.earned / sk.possible) * 100) : 0;
        return (
          '<li><span class="ntkit-skillname">' +
          esc(k) +
          "</span>" +
          '<span class="ntkit-skillbar"><span style="width:' +
          p +
          '%"></span></span>' +
          '<span class="ntkit-skillpct">' +
          p +
          "%</span></li>"
        );
      })
      .join("");

    host.innerHTML =
      '<div class="ntkit-card ntkit-tone-' +
      tone +
      '">' +
      '<div class="ntkit-scorehead">' +
      '<div class="ntkit-score">' +
      pct +
      "%</div>" +
      '<div class="ntkit-scoremeta">' +
      '<div class="ntkit-acttitle">' +
      esc(result.activityTitle) +
      "</div>" +
      (result.standard
        ? '<div class="ntkit-standard">Standard: ' +
          esc(result.standard) +
          "</div>"
        : "") +
      '<div class="ntkit-studentline">' +
      esc(s.alias || "Unnamed student") +
      (s.section ? " · " + esc(s.section) : "") +
      " · " +
      result.earned +
      "/" +
      result.possible +
      " pts</div>" +
      "</div>" +
      "</div>" +
      '<ul class="ntkit-itemlist">' +
      rows +
      "</ul>" +
      (skillRows
        ? '<div class="ntkit-skills"><h4>Skill breakdown</h4><ul class="ntkit-skilllist">' +
          skillRows +
          "</ul></div>"
        : "") +
      "</div>";
  }

  /* ---------- export: shared HTML document body ---------- */
  function buildExportHTML() {
    var s = getStudent();
    var r = state.lastResult;
    var a = state.lastActivity || {};
    var when = new Date().toLocaleString();

    var head =
      '<h1 style="margin:0 0 4px;font-size:20px;">' +
      esc(a.activityTitle || "Neft Teacher Activity") +
      "</h1>" +
      (a.standard
        ? '<div style="color:#555;">Standard: ' + esc(a.standard) + "</div>"
        : "") +
      '<table style="margin:10px 0;border-collapse:collapse;font-size:14px;">' +
      '<tr><td style="padding:2px 12px 2px 0;"><strong>Student</strong></td><td>' +
      esc(s.alias || "Unnamed student") +
      "</td></tr>" +
      '<tr><td style="padding:2px 12px 2px 0;"><strong>Section</strong></td><td>' +
      esc(s.section || "—") +
      "</td></tr>" +
      '<tr><td style="padding:2px 12px 2px 0;"><strong>Completed</strong></td><td>' +
      esc(when) +
      "</td></tr>" +
      "</table>";

    var body = "";
    if (r) {
      body +=
        '<h2 style="font-size:16px;">Score: ' +
        r.scorePercent +
        "%  (" +
        r.earned +
        "/" +
        r.possible +
        " pts)</h2>";
      body += '<ol style="font-size:14px;line-height:1.5;">';
      r.perItem.forEach(function (it) {
        body +=
          '<li style="margin-bottom:8px;">' +
          "<div>" +
          esc(it.prompt) +
          "</div>" +
          "<div>Your answer: " +
          esc(it.studentAnswer || "(blank)") +
          " &nbsp; [" +
          (it.correct ? "Correct" : "Incorrect") +
          " " +
          it.earned +
          "/" +
          it.points +
          "]</div>" +
          (it.correct
            ? ""
            : "<div>Correct answer: " + esc(it.correctAnswer) + "</div>") +
          "</li>";
      });
      body += "</ol>";

      var skillKeys = Object.keys(r.skills);
      if (skillKeys.length) {
        body +=
          '<h3 style="font-size:15px;">Skill breakdown</h3><ul style="font-size:14px;">';
        skillKeys.forEach(function (k) {
          var sk = r.skills[k];
          var p =
            sk.possible > 0 ? Math.round((sk.earned / sk.possible) * 100) : 0;
          body +=
            "<li>" +
            esc(k) +
            ": " +
            p +
            "% (" +
            sk.earned +
            "/" +
            sk.possible +
            ")</li>";
        });
        body += "</ul>";
      }
    } else {
      body +=
        "<p><em>No graded results yet. Complete the activity to populate this report.</em></p>";
    }

    return { head: head, body: body, student: s, result: r, activity: a };
  }

  function exportFilenameBase() {
    var s = getStudent();
    var a = state.lastActivity || {};
    return safeName(s.alias) + "_" + safeName(a.activityId || "activity");
  }

  /* ---------- Save as PDF (print-stylesheet + window.print, html2pdf if present) ---------- */
  function savePDF() {
    var built = buildExportHTML();
    var base = exportFilenameBase();

    // Optional: html2pdf via CDN if the page loaded it; graceful fallback to print.
    if (global.html2pdf) {
      try {
        var holder = el("div", "ntkit-pdf-holder");
        holder.innerHTML =
          '<div style="font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;">' +
          built.head +
          built.body +
          "</div>";
        global
          .html2pdf()
          .set({
            filename: base + "_results.pdf",
            margin: 10,
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .from(holder)
          .save();
        return;
      } catch (e) {
        /* fall through to print */
      }
    }
    printWindow(built, base);
  }

  function printWindow(built, base) {
    var w = global.open("", "_blank");
    if (!w) {
      // Pop-up blocked: fall back to printing current document via a temp class.
      printInline(built);
      return;
    }
    var title = base + "_results";
    w.document.open();
    w.document.write(
      '<!doctype html><html><head><meta charset="utf-8"><title>' +
        esc(title) +
        "</title>" +
        "<style>body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;}" +
        "h1,h2,h3{margin:12px 0 6px;} ol,ul{padding-left:20px;} @media print{button{display:none;}}" +
        "</style></head><body>" +
        built.head +
        built.body +
        "<script>window.onload=function(){setTimeout(function(){window.print();},150);};<\/script>" +
        "</body></html>",
    );
    w.document.close();
  }

  function printInline(built) {
    var holder = el("div", "ntkit-print-only");
    holder.innerHTML = built.head + built.body;
    document.body.appendChild(holder);
    document.body.classList.add("ntkit-printing");
    var cleanup = function () {
      document.body.classList.remove("ntkit-printing");
      if (holder.parentNode) holder.parentNode.removeChild(holder);
      global.removeEventListener("afterprint", cleanup);
    };
    global.addEventListener("afterprint", cleanup);
    setTimeout(function () {
      global.print();
    }, 50);
  }

  /* ---------- Save as DOC (Word-compatible HTML Blob) ---------- */
  function saveDOC() {
    var built = buildExportHTML();
    var base = exportFilenameBase();
    var html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' +
      esc(base) +
      "</title>" +
      "<style>body{font-family:Arial,sans-serif;color:#111;}</style></head>" +
      "<body>" +
      built.head +
      built.body +
      "</body></html>";

    var blob = new Blob(["﻿", html], { type: "application/msword" });
    var url = URL.createObjectURL(blob);
    var a = el("a");
    a.href = url;
    a.download = base + ".doc";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  /* ---------- design-system UI builders ----------
     Return HTML strings for the premium Section-7 components styled in
     nt-activity-kit.css. Author once, render anywhere:
       el.innerHTML = NTKit.ui.vocab({word, def, img});
     All inputs are escaped. Pairs with the `.nt-*` CSS classes.        */
  function callout(variant, title, bodyHTML) {
    var t = title
      ? '<div class="nt-callout-title">' + esc(title) + "</div>"
      : "";
    return (
      '<div class="nt-callout nt-' +
      esc(variant || "info") +
      '">' +
      t +
      "<div>" +
      (bodyHTML == null ? "" : bodyHTML) +
      "</div></div>"
    );
  }
  function vocab(item) {
    var items = Array.isArray(item) ? item : [item];
    var rows = items
      .map(function (v) {
        v = v || {};
        var img = v.img
          ? '<img class="nt-vocab-img" src="' +
            esc(v.img) +
            '" alt="' +
            esc(v.word || "") +
            '">'
          : '<span class="nt-vocab-img" aria-hidden="true"></span>';
        return (
          '<div class="nt-vocab-card">' +
          img +
          '<div class="nt-vocab-word">' +
          esc(v.word || "") +
          "</div>" +
          '<div class="nt-vocab-def">' +
          esc(v.def || "") +
          "</div></div>"
        );
      })
      .join("");
    return callout("vocab", "Vocabulary", rows);
  }
  function frames(levels) {
    // levels: {l0:"…", l1:"…", l2:"…"} — show any provided
    levels = levels || {};
    var labels = { l0: "Level 0", l1: "Level 1", l2: "Level 2" };
    var out = ["l0", "l1", "l2"]
      .filter(function (k) {
        return levels[k];
      })
      .map(function (k) {
        return (
          '<div class="nt-frame nt-frame--' +
          k +
          '"><span class="nt-frame-label">' +
          labels[k] +
          "</span><div>" +
          esc(levels[k]) +
          "</div></div>"
        );
      })
      .join("");
    return '<div class="nt-frames">' + out + "</div>";
  }
  function steps(list) {
    var lis = (list || [])
      .map(function (s) {
        return "<li>" + esc(s) + "</li>";
      })
      .join("");
    return '<ol class="nt-steps">' + lis + "</ol>";
  }
  function hints(arr, answer) {
    // arr: ["hint 1", "hint 2", …], answer: optional reveal text
    var blocks = (arr || [])
      .map(function (h, i) {
        return (
          "<details><summary>Hint " +
          (i + 1) +
          "</summary><div>" +
          esc(h) +
          "</div></details>"
        );
      })
      .join("");
    if (answer != null && answer !== "") {
      blocks +=
        '<details class="nt-reveal"><summary>Reveal answer</summary><div>' +
        esc(answer) +
        "</div></details>";
    }
    return '<div class="nt-hints">' + blocks + "</div>";
  }

  /* ---------- public API ---------- */
  var NTKit = {
    mount: mount,
    grade: grade,
    getStudent: getStudent,
    setStudent: setStudent,
    getResults: getResults,
    clearResults: clearResults,
    savePDF: savePDF,
    saveDOC: saveDOC,
    ui: {
      callout: callout,
      vocab: vocab,
      frames: frames,
      steps: steps,
      hints: hints,
    },
    _state: state,
    version: "1.1.0",
  };

  if (typeof module !== "undefined" && module.exports) module.exports = NTKit;
  if (global) global.NTKit = NTKit;
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
);

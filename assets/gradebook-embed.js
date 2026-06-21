/* =============================================================================
 * Gradebook inline panel — additive curriculum-hub enhancement
 * -----------------------------------------------------------------------------
 * Surfaces the live Gradebook RIGHT on the teacher area of the curriculum hub
 * as clean, native, light-themed collapsible panels (NOT a dark iframe):
 *
 *   • "Saved Codes" — every student's save code, filterable by Unit ->
 *     Assignment -> Class, with search. Units are derived from each code's
 *     activity ("Unit N ..."), so it stays in sync automatically.
 *   • "Grades"      — the students x assignments pivot, filterable by class.
 *
 * Data is read live from the TEACHER_KEY-gated /api/progress endpoints (same
 * D1 the full tool uses -> always in sync). Editing, adding students/classes,
 * and bulk Excel/CSV export stay in the canonical full tool, one click away.
 *
 * Premium / accessibility built in: click-to-copy codes, download-this-view CSV,
 * persisted filters, live result counts, ARIA-correct collapsibles (aria-controls
 * + focus management + Escape), polite live region, sticky/frozen table headers,
 * reduced-motion awareness, keyboard-operable everything.
 *
 * Purely additive: no edits to the hub's rendered markup. Gated twice — the
 * host card is `hub-teacher-only` (hidden in Student Mode) and every fetch
 * requires the TEACHER_KEY (shared via localStorage with the full tool).
 * ========================================================================== */
(function () {
  "use strict";

  var API = "/api/progress";
  var LS_KEY = "neft.teacher.key"; // shared with /teacher-tools/gradebook/
  var LS_FILTERS = "neft.gbx.filters";
  var key = readLS(LS_KEY) || "";
  var filters = parseJson(readLS(LS_FILTERS)) || { codes: {}, grades: {} };

  var records = []; // roster records, cached after first load
  var gradeData = null; // grades pivot, cached
  var unitNumName = {}; // "3" -> "Unit 3 - Ratios & Proportional Relationships"
  var titleUnit = null; // lesson title (lc) -> unit name; null until loaded
  var unitMapReady = null; // Promise, set by ensureUnitMap()
  var activeView = null; // "codes" | "grades" | null (collapsed)
  var lastToggle = null; // button to restore focus to on Escape

  // ---- tiny utils -----------------------------------------------------------
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function readLS(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function writeLS(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  function parseJson(s) {
    try {
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }
  function saveFilters() {
    writeLS(LS_FILTERS, JSON.stringify(filters));
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function bringIntoView(node) {
    node.scrollIntoView({
      behavior: reducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  }
  // Map an activity to a unit label. Three tiers, most→least reliable:
  //   1. "Unit N" embedded in the title (normalized to the full registry name).
  //   2. A reveal-math lesson title that appears in the activity title.
  //   3. "Other" (non-math activities: games, WIDA, etc.).
  function deriveUnit(rec) {
    var title = (rec.activity || "") + "";
    var m = title.match(/unit\s*0*(\d+)/i);
    if (m) return unitNumName[m[1]] || "Unit " + m[1];
    var lc = title.toLowerCase();
    if (titleUnit) {
      var best = "",
        bestUnit = "";
      for (var t in titleUnit) {
        if (lc.indexOf(t) !== -1 && t.length > best.length) {
          best = t;
          bestUnit = titleUnit[t];
        }
      }
      if (bestUnit) return bestUnit;
    }
    return "Other";
  }
  // Lazily load the lesson→unit registry once (teacher-only, on first panel
  // open) so tier-2 mapping works; resolves immediately if already present.
  function ensureUnitMap() {
    if (unitMapReady) return unitMapReady;
    unitMapReady = new Promise(function (resolve) {
      function build() {
        var units = window.REVEAL_MATH_UNITS || [];
        var lessons = window.REVEAL_MATH_LESSONS || [];
        units.forEach(function (u) {
          var n = (u.name || "").match(/unit\s*(\d+)/i);
          if (n) unitNumName[n[1]] = u.name;
        });
        titleUnit = {};
        lessons.forEach(function (l) {
          if (l.title && l.unit) titleUnit[l.title.toLowerCase()] = l.unit;
        });
        resolve();
      }
      if (window.REVEAL_MATH_LESSONS) return build();
      var s = el("script");
      s.src = "/assets/reveal-math-data.js";
      s.onload = build;
      s.onerror = function () {
        resolve();
      }; // tier-2 simply stays unavailable
      document.head.appendChild(s);
    });
    return unitMapReady;
  }
  function unitSortKey(u) {
    var m = u.match(/unit\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 999; // "Other" sinks to the bottom
  }
  function opt(value, label) {
    var o = el("option");
    o.value = value;
    o.textContent = label;
    return o;
  }

  // ---- toast + clipboard ----------------------------------------------------
  var toastEl = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = el("div", "gbx-toast");
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 1700);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          toast("Copied " + text);
        },
        function () {
          fallbackCopy(text);
        },
      );
      return;
    }
    fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = el("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast("Copied " + text);
    } catch (e) {
      toast("Copy failed");
    }
    ta.remove();
  }

  // ---- CSV (download this view) ---------------------------------------------
  function csvCell(v) {
    v = v == null ? "" : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function downloadCsv(name, headers, rows) {
    var text =
      "﻿" +
      [headers]
        .concat(rows)
        .map(function (r) {
          return r.map(csvCell).join(",");
        })
        .join("\n");
    var blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = el("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  // ---- styles ---------------------------------------------------------------
  var CSS = [
    ".gbx-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}",
    ".gbx-panel{margin-top:14px;background:#fff;border:1px solid #e3e8f0;border-radius:14px;",
    "box-shadow:0 1px 3px rgba(15,23,42,.06);overflow:hidden;color:#0f172a;outline:none}",
    ".gbx-panel[hidden]{display:none}",
    ".gbx-panel:focus-visible{box-shadow:0 0 0 3px rgba(37,99,235,.45)}",
    ".gbx-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 14px;",
    "border-bottom:1px solid #eef1f6;background:#f8fafc}",
    ".gbx-bar select,.gbx-bar input{font:inherit;padding:7px 10px;border:1px solid #cdd7e6;",
    "border-radius:9px;background:#fff;color:#0f172a;min-height:38px}",
    ".gbx-bar input{flex:1;min-width:130px}",
    ".gbx-count{font-size:13px;color:#475569;font-weight:600;white-space:nowrap}",
    ".gbx-spacer{flex:1}",
    ".gbx-mini{border:1px solid #cdd7e6;background:#fff;border-radius:9px;padding:7px 11px;",
    "cursor:pointer;font:inherit;min-height:38px;color:#0f172a;font-weight:600}",
    ".gbx-mini:hover{background:#eef4ff;border-color:#bcd0f5}",
    ".gbx-mini[disabled]{opacity:.55;cursor:progress}",
    ".gbx-scroll{max-height:62vh;overflow:auto}",
    ".gbx-table{border-collapse:separate;border-spacing:0;width:100%;font-size:14px}",
    ".gbx-table th,.gbx-table td{padding:8px 12px;border-bottom:1px solid #eef1f6;text-align:left;white-space:nowrap}",
    ".gbx-table th{position:sticky;top:0;background:#eef2f8;color:#334155;font-size:12px;",
    "text-transform:uppercase;letter-spacing:.03em;z-index:2}",
    ".gbx-table tbody tr:nth-child(even) td{background:#fafbfe}",
    ".gbx-table tbody tr:hover td{background:#eef4ff}",
    ".gbx-table tr.gbx-grp td{background:#e6efff;color:#1d4ed8;font-weight:700;",
    "text-transform:uppercase;font-size:12px;letter-spacing:.03em;position:sticky;top:34px;z-index:1}",
    ".gbx-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;color:#1d4ed8;",
    "cursor:pointer;border:none;background:none;padding:0;font-size:14px}",
    ".gbx-code:hover{text-decoration:underline}",
    ".gbx-code::after{content:'\\29C9';margin-left:6px;opacity:.45;font-size:12px}",
    ".gbx-dash{color:#7c8aa0}",
    ".gbx-table td.num{text-align:center}",
    /* freeze the first column (student/code) on the grades pivot for scanning */
    ".gbx-frozen td:first-child,.gbx-frozen th:first-child{position:sticky;left:0;background:#fff;z-index:1}",
    ".gbx-frozen th:first-child{z-index:3;background:#eef2f8}",
    ".gbx-frozen tbody tr:nth-child(even) td:first-child{background:#fafbfe}",
    ".gbx-msg{padding:26px 16px;text-align:center;color:#64748b}",
    ".gbx-gate{padding:18px 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
    ".gbx-gate input{padding:9px 12px;border:1px solid #cdd7e6;border-radius:9px;min-width:200px;font:inherit}",
    ".gbx-gate button{background:#2563eb;color:#fff;border:none;border-radius:9px;padding:9px 16px;",
    "font:inherit;font-weight:600;cursor:pointer;min-height:40px}",
    ".gbx-err{color:#b91c1c;font-size:13px;width:100%}",
    ".gbx-toggle[aria-expanded='true']{background:#2563eb;color:#fff;border-color:#2563eb}",
    ".gbx-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0f172a;",
    "color:#fff;padding:10px 18px;border-radius:10px;font-size:14px;z-index:9999;opacity:0;",
    "pointer-events:none;transition:opacity .18s;box-shadow:0 6px 20px rgba(15,23,42,.3)}",
    ".gbx-toast.show{opacity:1}",
    "@media (prefers-reduced-motion:reduce){.gbx-toast{transition:none}}",
  ].join("");

  function injectStyle() {
    if (document.getElementById("gbx-style")) return;
    var s = el("style");
    s.id = "gbx-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---- data fetch -----------------------------------------------------------
  function fetchJson(seg) {
    return fetch(API + "/" + seg + "?key=" + encodeURIComponent(key), {
      headers: { "x-teacher-key": key },
    }).then(function (r) {
      if (r.status === 401) throw new Error("Wrong teacher key.");
      if (r.status === 503) throw new Error("Gradebook not enabled on the server yet.");
      return r.json();
    });
  }

  // ---- panel scaffold -------------------------------------------------------
  function build(card) {
    injectStyle();

    var actions = card.querySelector(".mf-actions");
    var fullLink = actions && actions.querySelector("a");
    if (fullLink) {
      fullLink.textContent = "Open full Gradebook ↗";
      fullLink.setAttribute("target", "_blank");
      fullLink.setAttribute("rel", "noopener");
    }

    var panel = el("div", "gbx-panel");
    panel.id = "gbx-panel";
    panel.hidden = true;
    panel.setAttribute("tabindex", "-1");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Gradebook");
    panel.setAttribute("aria-live", "polite");

    var btnCodes = mkToggle(panel.id);
    var btnGrades = mkToggle(panel.id);
    if (actions) {
      actions.insertBefore(btnGrades, actions.firstChild);
      actions.insertBefore(btnCodes, actions.firstChild);
    }
    card.appendChild(panel);

    function setCaret(btn, label, open) {
      btn.innerHTML = esc(label) + ' <span aria-hidden="true">' + (open ? "▴" : "▾") + "</span>";
    }
    setCaret(btnCodes, "Saved Codes", false);
    setCaret(btnGrades, "Grades", false);

    function setView(view, focusPanel) {
      if (activeView === view) view = null; // toggle closed
      activeView = view;
      panel.hidden = !view;
      btnCodes.setAttribute("aria-expanded", String(view === "codes"));
      btnGrades.setAttribute("aria-expanded", String(view === "grades"));
      setCaret(btnCodes, "Saved Codes", view === "codes");
      setCaret(btnGrades, "Grades", view === "grades");
      if (!view) return;
      lastToggle = view === "codes" ? btnCodes : btnGrades;
      if (!key) {
        renderGate(panel, function () {
          setView(view, true);
        });
        return;
      }
      if (view === "codes") loadCodes(panel);
      else loadGrades(panel);
      if (focusPanel !== false) panel.focus({ preventScroll: true });
      bringIntoView(panel);
    }
    btnCodes.addEventListener("click", function () {
      setView("codes");
    });
    btnGrades.addEventListener("click", function () {
      setView("grades");
    });
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && activeView) {
        var t = lastToggle;
        setView(activeView); // toggling the same view closes it
        if (t) t.focus();
      }
    });
  }

  function mkToggle(controls) {
    var b = el("button", "mf-btn gbx-toggle");
    b.type = "button";
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-controls", controls);
    return b;
  }

  // ---- teacher-key gate -----------------------------------------------------
  function renderGate(panel, after) {
    panel.innerHTML = "";
    var g = el("div", "gbx-gate");
    var inp = el("input");
    inp.type = "password";
    inp.placeholder = "Teacher key";
    inp.autocomplete = "off";
    inp.setAttribute("aria-label", "Teacher key");
    var go = el("button", null, "Unlock");
    go.type = "button";
    function submit() {
      var v = inp.value.trim();
      if (!v) return;
      key = v;
      writeLS(LS_KEY, key);
      after();
    }
    go.addEventListener("click", submit);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });
    g.appendChild(el("span", null, "Enter your teacher key to view live data: "));
    g.appendChild(inp);
    g.appendChild(go);
    panel.appendChild(g);
    inp.focus();
  }

  // ---- Saved Codes view -----------------------------------------------------
  function loadCodes(panel) {
    panel.innerHTML = '<div class="gbx-msg" role="status">Loading saved codes…</div>';
    Promise.all([fetchJson("roster"), ensureUnitMap()])
      .then(function (res) {
        var d = res[0];
        if (!d || !d.ok) throw new Error("Could not load codes.");
        records = d.records || [];
        renderCodes(panel);
      })
      .catch(function (err) {
        renderError(panel, err, function () {
          loadCodes(panel);
        });
      });
  }

  function renderCodes(panel) {
    panel.innerHTML = "";
    var f = filters.codes || (filters.codes = {});
    var bar = el("div", "gbx-bar");

    var selUnit = labeledSelect("Filter by unit");
    var selAssign = labeledSelect("Filter by assignment");
    var selClass = labeledSelect("Filter by class");
    var search = el("input");
    search.type = "search";
    search.placeholder = "Search name or code…";
    search.setAttribute("aria-label", "Search saved codes");
    search.value = f.search || "";
    var count = el("span", "gbx-count");
    var csvBtn = el("button", "gbx-mini", "↓ CSV");
    csvBtn.type = "button";
    csvBtn.title = "Download this filtered view as CSV";
    var refresh = mkRefresh();

    var units = {};
    records.forEach(function (r) {
      units[deriveUnit(r)] = 1;
    });
    selUnit.appendChild(opt("", "All units"));
    Object.keys(units)
      .sort(function (a, b) {
        return unitSortKey(a) - unitSortKey(b);
      })
      .forEach(function (u) {
        selUnit.appendChild(opt(u, u));
      });
    if (f.unit) selUnit.value = f.unit;

    var classes = {};
    records.forEach(function (r) {
      if (r.section) classes[r.section] = 1;
    });
    selClass.appendChild(opt("", "All classes"));
    Object.keys(classes)
      .sort()
      .forEach(function (c) {
        selClass.appendChild(opt(c, c));
      });
    if (f.cls) selClass.value = f.cls;

    function refreshAssignments() {
      var u = selUnit.value;
      var set = {};
      records.forEach(function (r) {
        if (u && deriveUnit(r) !== u) return;
        if (r.activity) set[r.activity] = 1;
      });
      selAssign.innerHTML = "";
      selAssign.appendChild(opt("", "All assignments"));
      Object.keys(set)
        .sort()
        .forEach(function (a) {
          selAssign.appendChild(opt(a, a));
        });
      selAssign.value = f.assign && set[f.assign] ? f.assign : "";
    }
    refreshAssignments();

    [selUnit, selAssign, selClass, search].forEach(function (n) {
      bar.appendChild(n);
    });
    bar.appendChild(count);
    bar.appendChild(el("span", "gbx-spacer"));
    bar.appendChild(csvBtn);
    bar.appendChild(refresh);
    panel.appendChild(bar);

    var scroll = el("div", "gbx-scroll");
    var body = el("div");
    scroll.appendChild(body);
    panel.appendChild(scroll);

    function current() {
      var u = selUnit.value,
        a = selAssign.value,
        c = selClass.value;
      var q = search.value.trim().toLowerCase();
      var rows = records.filter(function (r) {
        if (u && deriveUnit(r) !== u) return false;
        if (a && r.activity !== a) return false;
        if (c && r.section !== c) return false;
        if (q && (r.code + " " + r.name + " " + r.section).toLowerCase().indexOf(q) === -1)
          return false;
        return true;
      });
      rows.sort(function (x, y) {
        var ux = unitSortKey(deriveUnit(x)),
          uy = unitSortKey(deriveUnit(y));
        if (ux !== uy) return ux - uy;
        var ax = (x.activity || "").toLowerCase(),
          ay = (y.activity || "").toLowerCase();
        if (ax !== ay) return ax < ay ? -1 : 1;
        return (x.name || "").toLowerCase() < (y.name || "").toLowerCase() ? -1 : 1;
      });
      return rows;
    }

    function draw() {
      f.unit = selUnit.value;
      f.assign = selAssign.value;
      f.cls = selClass.value;
      f.search = search.value;
      saveFilters();
      var rows = current();
      var classN = {};
      rows.forEach(function (r) {
        if (r.section) classN[r.section] = 1;
      });
      var nc = Object.keys(classN).length;
      count.textContent =
        rows.length +
        " code" +
        (rows.length === 1 ? "" : "s") +
        " · " +
        nc +
        " class" +
        (nc === 1 ? "" : "es");
      if (!records.length) {
        body.innerHTML =
          '<div class="gbx-msg">No save codes yet — they appear here the moment a student starts work.</div>';
        return;
      }
      if (!rows.length) {
        body.innerHTML = '<div class="gbx-msg">No saved codes match these filters.</div>';
        return;
      }
      var html =
        "<table class='gbx-table'><caption class='gbx-sr'>Saved codes</caption>" +
        "<thead><tr><th scope='col'>Code</th><th scope='col'>Student</th>" +
        "<th scope='col'>Class</th><th scope='col'>Assignment</th><th scope='col'>Saved</th></tr></thead><tbody>";
      var lastGrp = null;
      rows.forEach(function (r) {
        var grp = deriveUnit(r) + " · " + (r.activity || "—");
        if (grp !== lastGrp) {
          lastGrp = grp;
          html += "<tr class='gbx-grp'><td colspan='5'>" + esc(grp) + "</td></tr>";
        }
        html +=
          "<tr><td><button type='button' class='gbx-code' data-copy='" +
          esc(r.code) +
          "' aria-label='Copy code " +
          esc(r.code) +
          "'>" +
          esc(r.code) +
          "</button></td><td>" +
          (r.name ? esc(r.name) : "<span class='gbx-dash'>—</span>") +
          "</td><td>" +
          (r.section ? esc(r.section) : "<span class='gbx-dash'>—</span>") +
          "</td><td>" +
          esc(r.activity || "—") +
          "</td><td style='color:#64748b'>" +
          (r.updatedAt ? esc(r.updatedAt.replace("T", " ").slice(0, 16)) : "") +
          "</td></tr>";
      });
      html += "</tbody></table>";
      body.innerHTML = html;
    }

    body.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".gbx-code");
      if (b) copyText(b.getAttribute("data-copy"));
    });
    selUnit.addEventListener("change", function () {
      refreshAssignments();
      draw();
    });
    selAssign.addEventListener("change", draw);
    selClass.addEventListener("change", draw);
    search.addEventListener("input", draw);
    refresh.addEventListener("click", function () {
      loadCodes(panel);
    });
    csvBtn.addEventListener("click", function () {
      var rows = current().map(function (r) {
        return [
          deriveUnit(r),
          r.activity || "",
          r.code,
          r.name || "",
          r.section || "",
          r.updatedAt ? r.updatedAt.replace("T", " ").slice(0, 16) : "",
        ];
      });
      downloadCsv(
        "neft-saved-codes.csv",
        ["Unit", "Assignment", "Code", "Student", "Class", "Saved"],
        rows,
      );
    });
    draw();
  }

  // ---- Grades view ----------------------------------------------------------
  function loadGrades(panel) {
    panel.innerHTML = '<div class="gbx-msg" role="status">Loading grades…</div>';
    fetchJson("grades")
      .then(function (d) {
        if (!d || !d.ok) throw new Error("Could not load grades.");
        gradeData = d;
        renderGrades(panel);
      })
      .catch(function (err) {
        renderError(panel, err, function () {
          loadGrades(panel);
        });
      });
  }

  function renderGrades(panel) {
    panel.innerHTML = "";
    var d = gradeData;
    var f = filters.grades || (filters.grades = {});
    var bar = el("div", "gbx-bar");
    var selClass = labeledSelect("Filter by class");
    var classes = {};
    (d.rows || []).forEach(function (row) {
      if (row[1]) classes[row[1]] = 1;
    });
    selClass.appendChild(opt("", "All classes"));
    Object.keys(classes)
      .sort()
      .forEach(function (c) {
        selClass.appendChild(opt(c, c));
      });
    if (f.cls) selClass.value = f.cls;
    var count = el("span", "gbx-count");
    var csvBtn = el("button", "gbx-mini", "↓ CSV");
    csvBtn.type = "button";
    csvBtn.title = "Download this filtered view as CSV";
    var refresh = mkRefresh();
    bar.appendChild(selClass);
    bar.appendChild(count);
    bar.appendChild(el("span", "gbx-spacer"));
    bar.appendChild(csvBtn);
    bar.appendChild(refresh);
    panel.appendChild(bar);

    var scroll = el("div", "gbx-scroll");
    panel.appendChild(scroll);

    function current() {
      var c = selClass.value;
      return (d.rows || []).filter(function (row) {
        return !c || row[1] === c;
      });
    }
    function draw() {
      f.cls = selClass.value;
      saveFilters();
      var rows = current();
      count.textContent = rows.length + " student" + (rows.length === 1 ? "" : "s");
      if (!rows.length) {
        scroll.innerHTML = '<div class="gbx-msg">No grades yet for this class.</div>';
        return;
      }
      var html =
        "<table class='gbx-table gbx-frozen'><caption class='gbx-sr'>Grades by assignment</caption><thead><tr>" +
        (d.headers || [])
          .map(function (h, i) {
            return "<th scope='col'" + (i >= 2 ? " class='num'" : "") + ">" + esc(h) + "</th>";
          })
          .join("") +
        "</tr></thead><tbody>";
      rows.forEach(function (row) {
        html +=
          "<tr>" +
          row
            .map(function (cell, i) {
              var v = cell === "" || cell == null ? "—" : cell;
              var tag = i === 0 ? "th scope='row'" : "td" + (i >= 2 ? " class='num'" : "");
              var close = i === 0 ? "th" : "td";
              var style = v === "—" ? " style='color:#94a3b8'" : "";
              return "<" + tag + style + ">" + esc(v) + "</" + close + ">";
            })
            .join("") +
          "</tr>";
      });
      html += "</tbody></table>";
      scroll.innerHTML = html;
    }
    selClass.addEventListener("change", draw);
    refresh.addEventListener("click", function () {
      loadGrades(panel);
    });
    csvBtn.addEventListener("click", function () {
      downloadCsv("neft-grades.csv", d.headers || [], current());
    });
    draw();
  }

  // ---- shared small bits ----------------------------------------------------
  function labeledSelect(label) {
    var s = el("select");
    s.setAttribute("aria-label", label);
    return s;
  }
  function mkRefresh() {
    var b = el("button", "gbx-mini", "↻");
    b.type = "button";
    b.title = "Refresh";
    b.setAttribute("aria-label", "Refresh");
    return b;
  }
  function renderError(panel, err, retry) {
    var msg = (err && err.message) || "Something went wrong.";
    if (/teacher key/i.test(msg)) {
      writeLS(LS_KEY, "");
      key = "";
      return renderGate(panel, retry);
    }
    panel.innerHTML = "";
    var box = el("div", "gbx-gate");
    box.appendChild(el("span", "gbx-err", esc(msg)));
    var again = el("button", null, "Try again");
    again.type = "button";
    again.addEventListener("click", retry);
    box.appendChild(again);
    panel.appendChild(box);
  }

  // ---- boot -----------------------------------------------------------------
  function init() {
    var card = document.querySelector(".gradebook-feature");
    if (!card || card.querySelector(".gbx-toggle")) return;
    if (!card.querySelector(".mf-actions")) return;
    // Group the gradebook/codes card next to the AI Hub card (DOM move only).
    var aiCard = document.querySelector(".ai-hub-feature:not(.class-brain-feature)");
    if (aiCard && aiCard !== card && aiCard.parentNode) {
      aiCard.insertAdjacentElement("afterend", card);
    }
    build(card);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

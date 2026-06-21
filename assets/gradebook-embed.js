/* =============================================================================
 * Gradebook inline panel — additive curriculum-hub enhancement
 * -----------------------------------------------------------------------------
 * Surfaces the live Gradebook RIGHT on the teacher area of the curriculum hub
 * as clean, native, light-themed collapsible panels (NOT a dark iframe):
 *
 *   • "Saved Codes" — every student's save code, filterable by Unit →
 *     Assignment → Class, with search. Units are derived from each code's
 *     activity ("Unit N …"), so it stays in sync automatically.
 *   • "Grades"      — the students × assignments pivot, filterable by class.
 *
 * Data is read live from the TEACHER_KEY-gated /api/progress endpoints (same
 * D1 the full tool uses → always in sync). Editing, adding students/classes,
 * and Excel/CSV export stay in the canonical full tool, one click away via
 * "Open full Gradebook ↗". The teacher key is shared (localStorage) with that
 * tool, so signing in either place unlocks both.
 *
 * Purely additive: no edits to the hub's rendered markup. Gated twice — the
 * host card is `hub-teacher-only` (hidden in Student Mode) and every fetch
 * requires the TEACHER_KEY.
 * ========================================================================== */
(function () {
  "use strict";

  var API = "/api/progress";
  var LS_KEY = "neft.teacher.key"; // shared with /teacher-tools/gradebook/
  var key = "";
  try {
    key = localStorage.getItem(LS_KEY) || "";
  } catch (e) {
    key = "";
  }

  var records = []; // roster records, cached after first load
  var gradeData = null; // grades pivot, cached
  var activeView = null; // "codes" | "grades" | null (collapsed)

  // ---- helpers --------------------------------------------------------------
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
  function deriveUnit(rec) {
    var t = (rec.activity || "") + "";
    var m = t.match(/unit\s*0*(\d+)/i);
    if (m) return "Unit " + m[1];
    return "Other";
  }
  function unitSortKey(u) {
    var m = u.match(/unit\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 999; // "Other" sinks to the bottom
  }

  // ---- styles ---------------------------------------------------------------
  var CSS = [
    ".gbx-panel{margin-top:14px;background:#fff;border:1px solid #e3e8f0;border-radius:14px;",
    "box-shadow:0 1px 3px rgba(15,23,42,.06);overflow:hidden;color:#0f172a}",
    ".gbx-panel[hidden]{display:none}",
    ".gbx-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 14px;",
    "border-bottom:1px solid #eef1f6;background:#f8fafc}",
    ".gbx-bar select,.gbx-bar input{font:inherit;padding:7px 10px;border:1px solid #d6deea;",
    "border-radius:9px;background:#fff;color:#0f172a;min-height:38px}",
    ".gbx-bar input{flex:1;min-width:130px}",
    ".gbx-spacer{flex:1}",
    ".gbx-open{font-size:13px;font-weight:600;color:#2563eb;text-decoration:none;white-space:nowrap}",
    ".gbx-open:hover{text-decoration:underline}",
    ".gbx-mini{border:1px solid #d6deea;background:#fff;border-radius:9px;padding:7px 10px;",
    "cursor:pointer;font:inherit;min-height:38px}",
    ".gbx-mini:hover{background:#f1f5fb}",
    ".gbx-scroll{max-height:60vh;overflow:auto}",
    ".gbx-table{border-collapse:collapse;width:100%;font-size:14px}",
    ".gbx-table th,.gbx-table td{padding:8px 12px;border-bottom:1px solid #eef1f6;text-align:left;white-space:nowrap}",
    ".gbx-table th{position:sticky;top:0;background:#f1f5fb;color:#475569;font-size:12px;",
    "text-transform:uppercase;letter-spacing:.03em;z-index:1}",
    ".gbx-table tr.gbx-grp td{background:#eef4ff;color:#1d4ed8;font-weight:700;",
    "text-transform:uppercase;font-size:12px;letter-spacing:.03em}",
    ".gbx-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;color:#1d4ed8}",
    ".gbx-table td.num{text-align:center}",
    ".gbx-msg{padding:26px 16px;text-align:center;color:#64748b}",
    ".gbx-gate{padding:18px 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
    ".gbx-gate input{padding:9px 12px;border:1px solid #d6deea;border-radius:9px;min-width:200px;font:inherit}",
    ".gbx-gate button{background:#2563eb;color:#fff;border:none;border-radius:9px;padding:9px 16px;",
    "font:inherit;font-weight:600;cursor:pointer;min-height:40px}",
    ".gbx-err{color:#b91c1c;font-size:13px;width:100%}",
    ".gbx-toggle[aria-expanded='true']{background:#2563eb;color:#fff;border-color:#2563eb}",
    "@media (prefers-reduced-motion:no-preference){.gbx-panel{transition:opacity .15s}}",
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
      if (r.status === 503)
        throw new Error("Gradebook not enabled on the server yet.");
      return r.json();
    });
  }

  // ---- the panel ------------------------------------------------------------
  function build(card) {
    injectStyle();

    var actions = card.querySelector(".mf-actions");
    var fullLink = actions && actions.querySelector("a");
    // Repurpose the existing "Open Gradebook" link as the edit/export escape.
    if (fullLink) {
      fullLink.textContent = "Open full Gradebook ↗";
      fullLink.setAttribute("target", "_blank");
      fullLink.setAttribute("rel", "noopener");
    }

    var btnCodes = el("button", "mf-btn gbx-toggle", "Saved Codes ▾");
    btnCodes.type = "button";
    btnCodes.setAttribute("aria-expanded", "false");
    var btnGrades = el("button", "mf-btn gbx-toggle", "Grades ▾");
    btnGrades.type = "button";
    btnGrades.setAttribute("aria-expanded", "false");
    if (actions) actions.insertBefore(btnGrades, actions.firstChild);
    if (actions) actions.insertBefore(btnCodes, actions.firstChild);

    var panel = el("div", "gbx-panel");
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Gradebook");
    card.appendChild(panel);

    function setView(view) {
      if (activeView === view) view = null; // toggle closed
      activeView = view;
      panel.hidden = !view;
      btnCodes.setAttribute("aria-expanded", String(view === "codes"));
      btnGrades.setAttribute("aria-expanded", String(view === "grades"));
      btnCodes.textContent = "Saved Codes " + (view === "codes" ? "▴" : "▾");
      btnGrades.textContent = "Grades " + (view === "grades" ? "▴" : "▾");
      if (!view) return;
      if (!key)
        return renderGate(panel, function () {
          setView(view);
        });
      if (view === "codes") loadCodes(panel);
      else loadGrades(panel);
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    btnCodes.addEventListener("click", function () {
      setView("codes");
    });
    btnGrades.addEventListener("click", function () {
      setView("grades");
    });
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
    var hint = el("span", "gbx-err", "");
    function submit() {
      var v = inp.value.trim();
      if (!v) return;
      key = v;
      try {
        localStorage.setItem(LS_KEY, key);
      } catch (e) {}
      after();
    }
    go.addEventListener("click", submit);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });
    g.appendChild(
      el("span", null, "Enter your teacher key to view live data: "),
    );
    g.appendChild(inp);
    g.appendChild(go);
    g.appendChild(hint);
    panel.appendChild(g);
    inp.focus();
  }

  // ---- Saved Codes view -----------------------------------------------------
  function loadCodes(panel) {
    panel.innerHTML = '<div class="gbx-msg">Loading…</div>';
    fetchJson("roster")
      .then(function (d) {
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
    var bar = el("div", "gbx-bar");
    var selUnit = el("select");
    selUnit.setAttribute("aria-label", "Filter by unit");
    var selAssign = el("select");
    selAssign.setAttribute("aria-label", "Filter by assignment");
    var selClass = el("select");
    selClass.setAttribute("aria-label", "Filter by class");
    var search = el("input");
    search.type = "search";
    search.placeholder = "Search name or code…";
    search.setAttribute("aria-label", "Search saved codes");
    var refresh = el("button", "gbx-mini", "↻");
    refresh.type = "button";
    refresh.title = "Refresh";
    refresh.setAttribute("aria-label", "Refresh");

    // option sets
    var units = {};
    records.forEach(function (r) {
      units[deriveUnit(r)] = 1;
    });
    var unitList = Object.keys(units).sort(function (a, b) {
      return unitSortKey(a) - unitSortKey(b);
    });
    selUnit.appendChild(opt("", "All units"));
    unitList.forEach(function (u) {
      selUnit.appendChild(opt(u, u));
    });

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

    function refreshAssignments() {
      var u = selUnit.value;
      var set = {};
      records.forEach(function (r) {
        if (u && deriveUnit(r) !== u) return;
        if (r.activity) set[r.activity] = 1;
      });
      var cur = selAssign.value;
      selAssign.innerHTML = "";
      selAssign.appendChild(opt("", "All assignments"));
      Object.keys(set)
        .sort()
        .forEach(function (a) {
          selAssign.appendChild(opt(a, a));
        });
      selAssign.value = cur && set[cur] ? cur : "";
    }
    refreshAssignments();

    bar.appendChild(selUnit);
    bar.appendChild(selAssign);
    bar.appendChild(selClass);
    bar.appendChild(search);
    bar.appendChild(refresh);
    panel.appendChild(bar);

    var scroll = el("div", "gbx-scroll");
    var body = el("div");
    scroll.appendChild(body);
    panel.appendChild(scroll);

    function draw() {
      var u = selUnit.value,
        a = selAssign.value,
        c = selClass.value;
      var q = search.value.trim().toLowerCase();
      var rows = records.filter(function (r) {
        if (u && deriveUnit(r) !== u) return false;
        if (a && r.activity !== a) return false;
        if (c && r.section !== c) return false;
        if (
          q &&
          (r.code + " " + r.name + " " + r.section).toLowerCase().indexOf(q) ===
            -1
        )
          return false;
        return true;
      });
      // group by unit then assignment
      rows.sort(function (x, y) {
        var ux = unitSortKey(deriveUnit(x)),
          uy = unitSortKey(deriveUnit(y));
        if (ux !== uy) return ux - uy;
        var ax = (x.activity || "").toLowerCase(),
          ay = (y.activity || "").toLowerCase();
        if (ax !== ay) return ax < ay ? -1 : 1;
        return (x.name || "").toLowerCase() < (y.name || "").toLowerCase()
          ? -1
          : 1;
      });
      if (!rows.length) {
        body.innerHTML =
          '<div class="gbx-msg">No saved codes match these filters.</div>';
        return;
      }
      var html =
        "<table class='gbx-table'><thead><tr><th>Code</th><th>Student</th>" +
        "<th>Class</th><th>Assignment</th><th>Saved</th></tr></thead><tbody>";
      var lastGrp = null;
      rows.forEach(function (r) {
        var grp = deriveUnit(r) + " · " + (r.activity || "—");
        if (grp !== lastGrp) {
          lastGrp = grp;
          html +=
            "<tr class='gbx-grp'><td colspan='5'>" + esc(grp) + "</td></tr>";
        }
        html +=
          "<tr><td class='gbx-code'>" +
          esc(r.code) +
          "</td><td>" +
          (esc(r.name) || "<span style='color:#94a3b8'>—</span>") +
          "</td><td>" +
          (esc(r.section) || "<span style='color:#94a3b8'>—</span>") +
          "</td><td>" +
          esc(r.activity || "—") +
          "</td><td style='color:#64748b'>" +
          (r.updatedAt ? esc(r.updatedAt.replace("T", " ").slice(0, 16)) : "") +
          "</td></tr>";
      });
      html += "</tbody></table>";
      body.innerHTML = html;
    }

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
    draw();
  }

  // ---- Grades view ----------------------------------------------------------
  function loadGrades(panel) {
    panel.innerHTML = '<div class="gbx-msg">Loading…</div>';
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
    var bar = el("div", "gbx-bar");
    var selClass = el("select");
    selClass.setAttribute("aria-label", "Filter by class");
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
    var refresh = el("button", "gbx-mini", "↻");
    refresh.type = "button";
    refresh.title = "Refresh";
    refresh.setAttribute("aria-label", "Refresh");
    bar.appendChild(selClass);
    bar.appendChild(el("span", "gbx-spacer"));
    bar.appendChild(refresh);
    panel.appendChild(bar);

    var scroll = el("div", "gbx-scroll");
    panel.appendChild(scroll);

    function draw() {
      var c = selClass.value;
      var rows = (d.rows || []).filter(function (row) {
        return !c || row[1] === c;
      });
      if (!rows.length) {
        scroll.innerHTML =
          '<div class="gbx-msg">No grades yet for this class.</div>';
        return;
      }
      var html =
        "<table class='gbx-table'><thead><tr>" +
        (d.headers || [])
          .map(function (h) {
            return "<th>" + esc(h) + "</th>";
          })
          .join("") +
        "</tr></thead><tbody>";
      rows.forEach(function (row) {
        html +=
          "<tr>" +
          row
            .map(function (cell, i) {
              var v = cell === "" || cell == null ? "—" : cell;
              var cls = i >= 2 ? " class='num'" : "";
              var style = v === "—" ? " style='color:#94a3b8'" : "";
              return "<td" + cls + style + ">" + esc(v) + "</td>";
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
    draw();
  }

  // ---- small bits -----------------------------------------------------------
  function opt(value, label) {
    var o = el("option");
    o.value = value;
    o.textContent = label;
    return o;
  }
  function renderError(panel, err, retry) {
    panel.innerHTML = "";
    var box = el("div", "gbx-gate");
    box.appendChild(
      el("span", "gbx-err", esc(err && err.message) || "Something went wrong."),
    );
    if (/teacher key/i.test(err && err.message)) {
      try {
        localStorage.removeItem(LS_KEY);
      } catch (e) {}
      key = "";
      return renderGate(panel, retry);
    }
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
    var aiCard = document.querySelector(
      ".ai-hub-feature:not(.class-brain-feature)",
    );
    if (aiCard && aiCard !== card && aiCard.parentNode) {
      aiCard.insertAdjacentElement("afterend", card);
    }
    build(card);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();

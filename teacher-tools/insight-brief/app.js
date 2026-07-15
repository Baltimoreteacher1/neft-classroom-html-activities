/* Insight Brief app: key gate -> parallel fetch of the four existing
   /api/progress analytics endpoints -> NTInsightEngine -> rendered brief.
   All analysis is client-side; the only network calls are the same
   TEACHER_KEY GETs the Radar/Heatmap/Gradebook already make. */
(function () {
  "use strict";
  var LS_KEY = "neft.teacher.key";
  var LS_BRIEF = "neft.insight.brief.v1";
  var $ = function (sel) {
    return document.querySelector(sel);
  };

  var state = {
    brief: null,
    studentSort: { field: "risk", dir: -1 },
    standardSort: { field: "need", dir: -1 },
  };

  // ---- key gate ------------------------------------------------------------
  function getKey() {
    try {
      return localStorage.getItem(LS_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function showGate(show) {
    $("#key-gate").hidden = !show;
  }
  $("#key-save").addEventListener("click", function () {
    var v = $("#teacher-key").value.trim();
    if (!v) return;
    try {
      localStorage.setItem(LS_KEY, v);
    } catch (e) {
      /* private mode: key lives only for this page load */
    }
    showGate(false);
    setStatus("Key saved. Click Generate brief.");
  });
  if (!getKey()) showGate(true);

  function setStatus(msg, isError) {
    var el = $("#status");
    el.textContent = msg || "";
    el.className = "status" + (isError ? " error" : "");
  }

  // ---- data ----------------------------------------------------------------
  function api(path) {
    return fetch(path, { headers: { "x-teacher-key": getKey() } }).then(function (r) {
      if (r.status === 401) throw new Error("key-rejected");
      if (r.status === 503) throw new Error("not-configured");
      if (!r.ok) throw new Error("http-" + r.status);
      return r.json();
    });
  }

  function loadLessonRegistry() {
    if (window.REVEAL_MATH_LESSONS) return Promise.resolve(window.REVEAL_MATH_LESSONS);
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = "/assets/reveal-math-data.js";
      s.onload = function () {
        resolve(window.REVEAL_MATH_LESSONS || []);
      };
      s.onerror = function () {
        resolve([]); // brief still works, just without lesson titles/links
      };
      document.head.appendChild(s);
    });
  }

  function generate() {
    if (!getKey()) {
      showGate(true);
      setStatus("Paste your teacher key first.", true);
      return;
    }
    var days = Number($("#window-select").value) || 7;
    var section = $("#section-select").value || "";
    var since = new Date(Date.now() - days * 86400000).toISOString();
    var minutes = Math.min(days * 1440, 1440); // struggles endpoint caps at 24h
    var q = section ? "&section=" + encodeURIComponent(section) : "";
    setStatus("Reading student work…");
    $("#generate").disabled = true;

    Promise.all([
      api("/api/progress/digest?since=" + encodeURIComponent(since) + q),
      api("/api/progress/mastery-rollup?" + q.slice(1)),
      api("/api/progress/struggles?minutes=" + minutes + q),
      api("/api/progress/grades"),
      loadLessonRegistry(),
    ])
      .then(function (res) {
        var brief = window.NTInsightEngine.buildBrief({
          digest: res[0],
          rollup: res[1],
          struggles: res[2],
          grades: res[3],
          lessons: res[4],
          windowDays: days,
          section: section,
          now: new Date().toLocaleString(),
        });
        state.brief = brief;
        try {
          localStorage.setItem(LS_BRIEF, JSON.stringify(brief));
        } catch (e) {
          /* cache is a convenience only */
        }
        fillSections(res[0], res[3]);
        render(brief);
        setStatus("");
      })
      .catch(function (err) {
        var msg =
          err.message === "key-rejected"
            ? "Key rejected — re-enter your teacher key."
            : err.message === "not-configured"
              ? "Backend not configured (TEACHER_KEY or D1 missing)."
              : "Could not load data (" + err.message + "). Try again.";
        if (err.message === "key-rejected") showGate(true);
        setStatus(msg, true);
      })
      .finally(function () {
        $("#generate").disabled = false;
      });
  }
  $("#generate").addEventListener("click", generate);

  // Populate the class filter from real data (server sections + grades rows).
  function fillSections(digest, grades) {
    var sel = $("#section-select");
    var current = sel.value;
    var seen = {};
    ((digest && digest.students) || []).forEach(function (s) {
      if (s.section) seen[s.section] = true;
    });
    ((grades && grades.rows) || []).forEach(function (r) {
      if (r && r[1]) seen[r[1]] = true;
    });
    var opts = Object.keys(seen).sort();
    sel.innerHTML =
      '<option value="">All classes</option>' +
      opts
        .map(function (s) {
          return '<option value="' + esc(s) + '">' + esc(s) + "</option>";
        })
        .join("");
    sel.value = current;
  }

  // ---- render ----------------------------------------------------------------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pct(n) {
    return n == null ? "—" : Math.round(Number(n)) + "%";
  }
  function linkRow(links) {
    return (
      '<span class="link-row">' +
      (links || [])
        .map(function (l) {
          return (
            '<a href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a>"
          );
        })
        .join("") +
      "</span>"
    );
  }

  function render(brief) {
    $("#brief").hidden = false;
    var hasData = brief.headline.activeStudents > 0 || brief.standards.length > 0;
    $("#empty-state").hidden = hasData;
    $("#generated-at").textContent =
      "Generated " +
      brief.generatedAt +
      " · window: last " +
      brief.windowDays +
      " day(s)" +
      (brief.section ? " · class " + brief.section : " · all classes");

    var h = brief.headline;
    $("#headline").innerHTML = [
      ["Active students", h.activeStudents],
      ["Activities touched", h.activitiesTouched],
      ["Average score", h.avgScore == null ? "—" : pct(h.avgScore)],
      ["Mastery signals", h.masteryEvents],
      ["Struggle signals", h.struggleSignals],
      ["Misconceptions", h.misconceptions],
    ]
      .map(function (t) {
        return "<div class='stat'><b>" + esc(t[1]) + "</b><span>" + esc(t[0]) + "</span></div>";
      })
      .join("");

    $("#priorities").innerHTML = brief.priorities.length
      ? brief.priorities
          .map(function (p) {
            return (
              '<div class="priority ' +
              esc(p.kind) +
              '"><h3>' +
              esc(p.title) +
              "</h3>" +
              '<p class="why">' +
              esc(p.why) +
              "</p>" +
              linkRow(p.links) +
              "</div>"
            );
          })
          .join("")
      : '<p class="status">No priority actions surfaced — collect more signals or widen the window.</p>';

    var t = brief.tiers;
    $("#tier-chips").innerHTML =
      '<span class="chip support">🔴 Needs support: ' +
      t.support.length +
      "</span>" +
      '<span class="chip watch">🟡 Watch: ' +
      t.watch.length +
      "</span>" +
      '<span class="chip">🟢 On track: ' +
      t.onTrack.length +
      "</span>" +
      '<span class="chip enrichment">⭐ Enrichment-ready: ' +
      t.enrichment.length +
      "</span>" +
      (t.noData.length ? '<span class="chip">◌ No data: ' + t.noData.length + "</span>" : "");

    renderStudents();
    renderStandards();

    $("#groups").innerHTML = brief.groups.length
      ? brief.groups
          .map(function (g) {
            return (
              '<div class="group"><h3>' +
              esc(g.section || "All") +
              " · " +
              esc(g.standard) +
              (g.lessonTitle ? " — " + esc(g.lessonTitle) : "") +
              "</h3>" +
              '<p class="kids">' +
              esc(g.students.join(", ")) +
              "</p>" +
              '<p class="move">' +
              esc(g.move) +
              "</p>" +
              linkRow(g.links) +
              "</div>"
            );
          })
          .join("")
      : '<p class="status">No support/watch students to group in this window.</p>';

    $("#planning").innerHTML = brief.planning
      .map(function (p) {
        return (
          '<div class="plan-section"><h3>Class ' +
          esc(p.section || "—") +
          "</h3><ul>" +
          p.ideas
            .map(function (i) {
              return "<li>" + esc(i) + "</li>";
            })
            .join("") +
          "</ul></div>"
        );
      })
      .join("");
  }

  var TIER_ORDER = { support: 0, watch: 1, "on-track": 2, enrichment: 3, "no-data": 4 };
  var TIER_LABEL = {
    support: "Needs support",
    watch: "Watch",
    "on-track": "On track",
    enrichment: "Enrichment",
    "no-data": "No data",
  };

  function sortRows(rows, sort, tierAware) {
    return rows.slice().sort(function (a, b) {
      var av = a[sort.field];
      var bv = b[sort.field];
      if (tierAware && sort.field === "tier") {
        av = TIER_ORDER[av];
        bv = TIER_ORDER[bv];
      }
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return av.localeCompare(bv) * sort.dir;
      return (av - bv) * sort.dir;
    });
  }

  function renderStudents() {
    var rows = sortRows(state.brief.students, state.studentSort, true);
    $("#students-table tbody").innerHTML = rows
      .map(function (s) {
        return (
          "<tr><td>" +
          esc(s.name) +
          "</td><td>" +
          esc(s.section) +
          "</td>" +
          '<td><span class="tier-badge ' +
          esc(s.tier) +
          '">' +
          esc(TIER_LABEL[s.tier] || s.tier) +
          "</span></td>" +
          "<td>" +
          pct(s.avgScore) +
          "</td><td>" +
          s.activities +
          "</td><td>" +
          s.struggles +
          "</td><td>" +
          s.misconceptions +
          "</td><td class='wrap'>" +
          esc(s.weakStandards[0] || (s.mastery[0] ? "✓ " + s.mastery[0] : "—")) +
          (s.topTag ? ' <em>("' + esc(s.topTag) + '")</em>' : "") +
          "</td></tr>"
        );
      })
      .join("");
  }

  function renderStandards() {
    var rows = sortRows(state.brief.standards, state.standardSort, false);
    $("#standards-table tbody").innerHTML = rows
      .map(function (s) {
        return (
          "<tr><td>" +
          esc(s.standard) +
          "</td><td class='wrap'>" +
          esc(s.lessonTitle || "—") +
          "</td><td>" +
          esc(s.section || "all") +
          "</td><td>" +
          (s.correctRate == null ? "—" : Math.round(s.correctRate * 100) + "%") +
          "</td><td>" +
          s.struggles +
          "</td><td>" +
          s.misconceptions +
          "</td><td>" +
          s.mastery +
          "</td><td class='wrap'>" +
          esc(s.idea) +
          "<br>" +
          linkRow(s.links) +
          "</td></tr>"
        );
      })
      .join("");
  }

  function wireSort(tableSel, sortKey, rerender) {
    $(tableSel)
      .querySelectorAll("th button[data-sort]")
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var f = btn.getAttribute("data-sort");
          var sort = state[sortKey];
          sort.dir = sort.field === f ? -sort.dir : f === "name" || f === "section" ? 1 : -1;
          sort.field = f;
          $(tableSel)
            .querySelectorAll("th button")
            .forEach(function (b) {
              b.removeAttribute("aria-sort");
            });
          btn.setAttribute("aria-sort", sort.dir === 1 ? "ascending" : "descending");
          rerender();
        });
      });
  }
  wireSort("#students-table", "studentSort", renderStudents);
  wireSort("#standards-table", "standardSort", renderStandards);

  // ---- exports ---------------------------------------------------------------
  $("#print").addEventListener("click", function () {
    window.print();
  });
  $("#copy").addEventListener("click", function () {
    if (!state.brief) return;
    navigator.clipboard.writeText(state.brief.summaryText).then(
      function () {
        setStatus("Summary copied.");
      },
      function () {
        setStatus("Copy blocked — select and copy from the print view.", true);
      },
    );
  });
  $("#csv").addEventListener("click", function () {
    if (!state.brief) return;
    var lines = [
      [
        "Student",
        "Class",
        "Tier",
        "AvgScore",
        "Activities",
        "Struggles",
        "Misconceptions",
        "FocusStandard",
      ],
    ];
    state.brief.students.forEach(function (s) {
      lines.push([
        s.name,
        s.section,
        s.tier,
        s.avgScore == null ? "" : s.avgScore,
        s.activities,
        s.struggles,
        s.misconceptions,
        s.weakStandards[0] || "",
      ]);
    });
    lines.push([]);
    lines.push([
      "Standard",
      "Lesson",
      "Class",
      "CorrectRate",
      "Struggles",
      "Misconceptions",
      "Mastery",
      "NextMove",
    ]);
    state.brief.standards.forEach(function (s) {
      lines.push([
        s.standard,
        s.lessonTitle,
        s.section,
        s.correctRate == null ? "" : s.correctRate,
        s.struggles,
        s.misconceptions,
        s.mastery,
        s.idea,
      ]);
    });
    var csv = lines
      .map(function (row) {
        return row
          .map(function (c) {
            var v = String(c == null ? "" : c);
            return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
          })
          .join(",");
      })
      .join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "insight-brief.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ---- restore last brief ------------------------------------------------------
  try {
    var cached = JSON.parse(localStorage.getItem(LS_BRIEF) || "null");
    if (cached && cached.headline) {
      state.brief = cached;
      render(cached);
      setStatus(
        "Showing your last brief (" + cached.generatedAt + "). Click Generate for fresh data.",
      );
    }
  } catch (e) {
    /* no cache */
  }
})();

/**
 * Neft Teacher — Class Dashboard / Gradebook (read-only, local-first)
 *
 * Reads the `rma_gradebook` array that lessons write to localStorage at
 * completion (see engine/core/grade.js). Each record looks like:
 *   { studentName, studentPeriod, lessonId, lessonTitle, standard,
 *     correct, attempts, pct, band, date }
 *
 * Also opportunistically scans for any game/activity result keys that store
 * the same record shape, so device-local game results show up too.
 *
 * NO network calls. Nothing leaves the browser. Vanilla JS, no dependencies.
 */
(function () {
  "use strict";

  var GRADEBOOK_KEY = "rma_gradebook";
  // Extra localStorage keys games/activities may use for the same record shape.
  var EXTRA_KEYS = ["rma_game_results", "rma_activity_results"];

  /* Mastery bands — MUST match engine/core/grade.js exactly.
     >=85 Strong | >=70 Likely Ready | >=60 Approaching | else Needs Reteach */
  function masteryBand(pct) {
    if (pct >= 85) return "Strong";
    if (pct >= 70) return "Likely Ready";
    if (pct >= 60) return "Approaching";
    return "Needs Reteach";
  }
  var BAND_CLASS = {
    Strong: "b-strong",
    "Likely Ready": "b-likely",
    Approaching: "b-approaching",
    "Needs Reteach": "b-reteach",
  };
  var BAND_BADGE = {
    Strong: "ok",
    "Likely Ready": "info",
    Approaching: "warn",
    "Needs Reteach": "bad",
  };
  var BAND_ORDER = {
    "Needs Reteach": 0,
    Approaching: 1,
    "Likely Ready": 2,
    Strong: 3,
  };

  /* ── helpers ── */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "scope") node.setAttribute("scope", attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function avg(nums) {
    if (!nums.length) return 0;
    return Math.round(
      nums.reduce(function (a, b) {
        return a + b;
      }, 0) / nums.length,
    );
  }
  function csvCell(value) {
    var v = value == null ? "" : String(value);
    if (/[",\r\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  }

  /* ── data load ── */
  var STATE = {
    records: [],
    sort: { key: "name", dir: 1 },
    filters: { search: "", period: "", standard: "" },
    groupBy: "lesson",
    active: "grid",
    theme:
      window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
  };

  function readArray(key) {
    try {
      var raw = localStorage.getItem(key);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  // Coerce a stored object into a normalized result record. Tolerant of
  // partial/legacy shapes; recomputes band if missing.
  function normalize(r) {
    if (!r || typeof r !== "object") return null;
    var attempts = Number(r.attempts) || 0;
    var correct = Number(r.correct) || 0;
    var pct =
      r.pct != null
        ? Number(r.pct)
        : attempts > 0
          ? Math.round((correct / attempts) * 100)
          : 0;
    if (isNaN(pct)) pct = 0;
    var name = (r.studentName || "").toString().trim() || "Unknown student";
    var lessonId = (
      r.lessonId ||
      r.lessonTitle ||
      r.standard ||
      "lesson"
    ).toString();
    return {
      studentName: name,
      studentPeriod: (r.studentPeriod || "").toString().trim(),
      lessonId: lessonId,
      lessonTitle: (r.lessonTitle || lessonId).toString(),
      standard: (r.standard || "").toString().trim(),
      correct: correct,
      attempts: attempts,
      pct: pct,
      band: r.band && BAND_CLASS[r.band] ? r.band : masteryBand(pct),
      date: (r.date || "").toString(),
    };
  }

  function loadRecords() {
    var raw = readArray(GRADEBOOK_KEY);
    var games = 0;
    EXTRA_KEYS.forEach(function (k) {
      var extra = readArray(k);
      games += extra.length;
      raw = raw.concat(extra);
    });
    STATE.records = raw.map(normalize).filter(function (r) {
      return r !== null;
    });
    STATE.extraGameCount = games;
  }

  /* ── filtering ── */
  function studentKey(name) {
    return (name || "").trim().toLowerCase();
  }
  function filtered() {
    var f = STATE.filters;
    var q = f.search.trim().toLowerCase();
    return STATE.records.filter(function (r) {
      if (f.period && r.studentPeriod !== f.period) return false;
      if (f.standard && r.standard !== f.standard) return false;
      if (q && r.studentName.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function uniqueSorted(arr) {
    return arr
      .filter(function (v, i, a) {
        return v !== "" && a.indexOf(v) === i;
      })
      .sort();
  }

  /* ── students aggregate ── */
  function studentsFrom(records) {
    var map = {};
    records.forEach(function (r) {
      var k = studentKey(r.studentName);
      if (!map[k]) {
        map[k] = {
          name: r.studentName,
          period: r.studentPeriod,
          results: [],
        };
      }
      map[k].results.push(r);
      if (!map[k].period && r.studentPeriod) map[k].period = r.studentPeriod;
    });
    return Object.keys(map).map(function (k) {
      var s = map[k];
      var pcts = s.results.map(function (r) {
        return r.pct;
      });
      s.avg = avg(pcts);
      s.band = masteryBand(s.avg);
      s.reteach = s.results.filter(function (r) {
        return r.band === "Needs Reteach" || r.band === "Approaching";
      });
      s.mastered = s.results.filter(function (r) {
        return r.band === "Strong" || r.band === "Likely Ready";
      });
      return s;
    });
  }

  /* ── rendering: filter controls ── */
  function fillSelect(sel, values, current, allLabel) {
    sel.innerHTML = "";
    sel.appendChild(el("option", { value: "", text: allLabel }));
    values.forEach(function (v) {
      var o = el("option", { value: v, text: v });
      if (v === current) o.selected = true;
      sel.appendChild(o);
    });
    sel.value = current || "";
  }

  function renderFilters() {
    fillSelect(
      $("#periodFilter"),
      uniqueSorted(
        STATE.records.map(function (r) {
          return r.studentPeriod;
        }),
      ),
      STATE.filters.period,
      "All periods",
    );
    fillSelect(
      $("#standardFilter"),
      uniqueSorted(
        STATE.records.map(function (r) {
          return r.standard;
        }),
      ),
      STATE.filters.standard,
      "All standards",
    );
  }

  /* ── rendering: grid ── */
  function columnsFrom(records, groupBy) {
    var map = {};
    records.forEach(function (r) {
      var key =
        groupBy === "standard" ? r.standard || "(no standard)" : r.lessonId;
      var label =
        groupBy === "standard" ? r.standard || "(no standard)" : r.lessonTitle;
      if (!map[key]) map[key] = { key: key, label: label };
    });
    return Object.keys(map)
      .map(function (k) {
        return map[k];
      })
      .sort(function (a, b) {
        return a.label.localeCompare(b.label);
      });
  }

  function sortStudents(students) {
    var s = STATE.sort;
    var arr = students.slice();
    arr.sort(function (a, b) {
      var av, bv;
      if (s.key === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else if (s.key === "avg") {
        av = a.avg;
        bv = b.avg;
      } else {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      }
      if (av < bv) return -1 * s.dir;
      if (av > bv) return 1 * s.dir;
      return 0;
    });
    return arr;
  }

  function renderGrid() {
    var wrap = $("#gridWrap");
    wrap.innerHTML = "";
    var records = filtered();
    if (!records.length) {
      wrap.appendChild(
        el("p", {
          class: "muted",
          text: "No results match the current filters.",
        }),
      );
      return;
    }

    var cols = columnsFrom(records, STATE.groupBy);
    var students = sortStudents(studentsFrom(records));

    // index records by student+column for fast cell lookup
    var index = {};
    records.forEach(function (r) {
      var ck =
        STATE.groupBy === "standard"
          ? r.standard || "(no standard)"
          : r.lessonId;
      index[studentKey(r.studentName) + "||" + ck] = r;
    });

    var table = el("table", { class: "table" });
    table.appendChild(
      el("caption", {
        text:
          "Gradebook grid: rows are students, columns are " +
          (STATE.groupBy === "standard" ? "standards" : "lessons") +
          ". Cells show percent score colored by mastery band.",
      }),
    );

    // header
    var thead = el("thead");
    var hr = el("tr");
    var arrow =
      STATE.sort.key === "name" ? (STATE.sort.dir === 1 ? "▲" : "▼") : "";
    var nameTh = el("th", {
      scope: "col",
      class: "sortable",
      "aria-sort":
        STATE.sort.key === "name"
          ? STATE.sort.dir === 1
            ? "ascending"
            : "descending"
          : "none",
    });
    nameTh.appendChild(document.createTextNode("Student"));
    if (arrow) nameTh.appendChild(el("span", { class: "arrow", text: arrow }));
    nameTh.addEventListener("click", function () {
      toggleSort("name");
    });
    hr.appendChild(nameTh);

    var avgArrow =
      STATE.sort.key === "avg" ? (STATE.sort.dir === 1 ? "▲" : "▼") : "";
    var avgTh = el("th", {
      scope: "col",
      class: "sortable",
      "aria-sort":
        STATE.sort.key === "avg"
          ? STATE.sort.dir === 1
            ? "ascending"
            : "descending"
          : "none",
    });
    avgTh.appendChild(document.createTextNode("Average"));
    if (avgArrow)
      avgTh.appendChild(el("span", { class: "arrow", text: avgArrow }));
    avgTh.addEventListener("click", function () {
      toggleSort("avg");
    });
    hr.appendChild(avgTh);

    cols.forEach(function (c) {
      hr.appendChild(el("th", { scope: "col", title: c.label, text: c.label }));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    // body
    var tbody = el("tbody");
    students.forEach(function (s) {
      var tr = el("tr");
      var rowTh = el("th", { scope: "row" });
      rowTh.appendChild(document.createTextNode(s.name));
      if (s.period)
        rowTh.appendChild(
          el("span", { class: "sub", text: "Period " + s.period }),
        );
      tr.appendChild(rowTh);

      var avgCell = el("td", {
        class: "cell " + BAND_CLASS[s.band],
        title: s.band + " (class-average of this student)",
      });
      avgCell.textContent = s.avg + "%";
      tr.appendChild(avgCell);

      cols.forEach(function (c) {
        var rec = index[studentKey(s.name) + "||" + c.key];
        if (!rec) {
          tr.appendChild(
            el("td", {
              class: "cell empty",
              text: "—",
              "aria-label": "No result",
            }),
          );
          return;
        }
        var td = el("td", {
          class: "cell " + BAND_CLASS[rec.band],
          title:
            rec.lessonTitle +
            (rec.standard ? " · " + rec.standard : "") +
            " · " +
            rec.band +
            " · " +
            rec.correct +
            "/" +
            rec.attempts +
            (rec.date ? " · " + rec.date : ""),
        });
        td.textContent = rec.pct + "%";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function toggleSort(key) {
    if (STATE.sort.key === key) STATE.sort.dir *= -1;
    else {
      STATE.sort.key = key;
      STATE.sort.dir = 1;
    }
    renderGrid();
  }

  /* ── rendering: by student ── */
  function bandBadge(band) {
    return el("span", {
      class: "badge " + BAND_BADGE[band],
      html: '<span class="cue">●</span>' + band,
    });
  }

  function renderStudents() {
    var list = $("#studentList");
    list.innerHTML = "";
    var students = studentsFrom(filtered()).sort(function (a, b) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    if (!students.length) {
      list.appendChild(
        el("p", {
          class: "muted",
          text: "No students match the current filters.",
        }),
      );
      return;
    }

    students.forEach(function (s) {
      var card = el("section", {
        class: "card student-card",
        "aria-label": "Summary for " + s.name,
      });
      var head = el("div", { class: "row" });
      var titleWrap = el("div");
      titleWrap.appendChild(el("h3", { text: s.name, style: "margin:0" }));
      if (s.period)
        titleWrap.appendChild(
          el("p", {
            class: "muted small",
            text: "Period " + s.period,
            style: "margin:2px 0 0",
          }),
        );
      head.appendChild(titleWrap);
      var avgWrap = el("div", { style: "text-align:right" });
      avgWrap.appendChild(el("div", { class: "avg", text: s.avg + "%" }));
      avgWrap.appendChild(bandBadge(s.band));
      head.appendChild(avgWrap);
      card.appendChild(head);

      card.appendChild(
        el("p", {
          class: "muted small",
          style: "margin:10px 0 4px",
          text:
            s.results.length +
            " result" +
            (s.results.length === 1 ? "" : "s") +
            " · " +
            s.mastered.length +
            " at Likely Ready or above · " +
            s.reteach.length +
            " needing support",
        }),
      );

      // mini table of lessons
      var tbl = el("table", {
        class: "table",
        style: "box-shadow:none;border:0",
      });
      tbl.appendChild(
        el("caption", { class: "small muted", text: "Lessons for " + s.name }),
      );
      var th = el("thead");
      th.appendChild(
        el("tr", {}, [
          el("th", { scope: "col", text: "Lesson" }),
          el("th", { scope: "col", text: "Standard" }),
          el("th", { scope: "col", text: "Score" }),
          el("th", { scope: "col", text: "Band" }),
        ]),
      );
      tbl.appendChild(th);
      var tb = el("tbody");
      s.results
        .slice()
        .sort(function (a, b) {
          return a.pct - b.pct;
        })
        .forEach(function (r) {
          tb.appendChild(
            el("tr", {}, [
              el("th", {
                scope: "row",
                style: "font-weight:600",
                text: r.lessonTitle,
              }),
              el("td", { text: r.standard || "—" }),
              el("td", {
                class: "cell " + BAND_CLASS[r.band],
                text: r.pct + "%",
              }),
              el("td", {}, [bandBadge(r.band)]),
            ]),
          );
        });
      tbl.appendChild(tb);
      card.appendChild(tbl);

      if (s.reteach.length) {
        var rt = el("p", { class: "small", style: "margin-top:10px" });
        rt.appendChild(el("strong", { text: "Reteach: " }));
        rt.appendChild(
          document.createTextNode(
            s.reteach
              .map(function (r) {
                return r.standard || r.lessonTitle;
              })
              .filter(function (v, i, a) {
                return a.indexOf(v) === i;
              })
              .join(", "),
          ),
        );
        card.appendChild(rt);
      }
      list.appendChild(card);
    });
  }

  /* ── rendering: by standard ── */
  function renderStandards() {
    var wrap = $("#standardWrap");
    wrap.innerHTML = "";
    var records = filtered().filter(function (r) {
      return r.standard;
    });
    if (!records.length) {
      wrap.appendChild(
        el("p", {
          class: "muted",
          text: "No standard-tagged results match the current filters.",
        }),
      );
      return;
    }

    var map = {};
    records.forEach(function (r) {
      if (!map[r.standard])
        map[r.standard] = { standard: r.standard, results: [], students: {} };
      map[r.standard].results.push(r);
      var k = studentKey(r.studentName);
      // keep the student's best/most-recent per standard via highest pct
      if (
        !map[r.standard].students[k] ||
        r.pct > map[r.standard].students[k].pct
      ) {
        map[r.standard].students[k] = r;
      }
    });

    var table = el("table", { class: "table" });
    table.appendChild(
      el("caption", {
        text: "Per-standard class view: average score, count of students in each mastery band, and who needs reteach.",
      }),
    );
    var thead = el("thead");
    thead.appendChild(
      el("tr", {}, [
        el("th", { scope: "col", text: "Standard" }),
        el("th", { scope: "col", text: "Class avg" }),
        el("th", { scope: "col", text: "Strong" }),
        el("th", { scope: "col", text: "Likely" }),
        el("th", { scope: "col", text: "Approaching" }),
        el("th", { scope: "col", text: "Reteach" }),
        el("th", { scope: "col", text: "Pull for support" }),
      ]),
    );
    table.appendChild(thead);

    var tbody = el("tbody");
    Object.keys(map)
      .sort()
      .forEach(function (std) {
        var entry = map[std];
        var perStudent = Object.keys(entry.students).map(function (k) {
          return entry.students[k];
        });
        var classAvg = avg(
          perStudent.map(function (r) {
            return r.pct;
          }),
        );
        var bands = {
          Strong: 0,
          "Likely Ready": 0,
          Approaching: 0,
          "Needs Reteach": 0,
        };
        perStudent.forEach(function (r) {
          bands[r.band]++;
        });
        var pull = perStudent
          .filter(function (r) {
            return r.band === "Approaching" || r.band === "Needs Reteach";
          })
          .map(function (r) {
            return r.studentName;
          })
          .sort();

        var tr = el("tr");
        tr.appendChild(el("th", { scope: "row", text: std }));
        tr.appendChild(
          el("td", {
            class: "cell " + BAND_CLASS[masteryBand(classAvg)],
            text: classAvg + "%",
          }),
        );
        tr.appendChild(el("td", { text: String(bands.Strong) }));
        tr.appendChild(el("td", { text: String(bands["Likely Ready"]) }));
        tr.appendChild(el("td", { text: String(bands.Approaching) }));
        tr.appendChild(el("td", { text: String(bands["Needs Reteach"]) }));
        tr.appendChild(
          el("td", {
            class: "small",
            text: pull.length ? pull.join(", ") : "—",
          }),
        );
        tbody.appendChild(tr);
      });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  /* ── rendering: who to pull ── */
  function renderReteach() {
    var box = $("#reteachList");
    box.innerHTML = "";
    var students = studentsFrom(filtered()).filter(function (s) {
      return s.reteach.length;
    });
    students.sort(function (a, b) {
      // worst first: lowest avg
      return a.avg - b.avg;
    });
    if (!students.length) {
      box.appendChild(
        el("div", {
          class: "card",
          html: '<h3>Nobody flagged 🎉</h3><p class="muted">No students are at Approaching or Needs Reteach within the current filters.</p>',
        }),
      );
      return;
    }
    students.forEach(function (s) {
      var card = el("section", {
        class: "card pull-card",
        "aria-label": "Reteach plan for " + s.name,
      });
      var head = el("div", {
        class: "row",
        style:
          "display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap",
      });
      var t = el("div");
      t.appendChild(el("h3", { text: s.name }));
      if (s.period)
        t.appendChild(
          el("span", { class: "muted small", text: "Period " + s.period }),
        );
      head.appendChild(t);
      var right = el("div", { style: "text-align:right" });
      right.appendChild(
        el("div", {
          class: "metric",
          text: s.avg + "%",
          style: "font-size:1.4rem",
        }),
      );
      right.appendChild(bandBadge(s.band));
      head.appendChild(right);
      card.appendChild(head);

      var tags = el("div", { class: "tag-list", style: "margin-top:10px" });
      s.reteach
        .slice()
        .sort(function (a, b) {
          return BAND_ORDER[a.band] - BAND_ORDER[b.band];
        })
        .forEach(function (r) {
          tags.appendChild(
            el("span", {
              class: "badge " + BAND_BADGE[r.band],
              html:
                '<span class="cue">●</span>' +
                (r.standard || r.lessonTitle) +
                " · " +
                r.pct +
                "%",
            }),
          );
        });
      card.appendChild(tags);
      box.appendChild(card);
    });
  }

  /* ── CSV export ── */
  function exportCsv() {
    var header = [
      "studentName",
      "studentPeriod",
      "lessonId",
      "lessonTitle",
      "standard",
      "correct",
      "attempts",
      "pct",
      "band",
      "date",
    ];
    var records = filtered();
    var rows = [header];
    records.forEach(function (r) {
      rows.push([
        r.studentName,
        r.studentPeriod,
        r.lessonId,
        r.lessonTitle,
        r.standard,
        r.correct,
        r.attempts,
        r.pct,
        r.band,
        r.date,
      ]);
    });
    var csv = rows
      .map(function (row) {
        return row.map(csvCell).join(",");
      })
      .join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = el("a", {
      href: url,
      download:
        "neft-gradebook_" + new Date().toISOString().slice(0, 10) + ".csv",
    });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    flash($("#exportBtn"), "Downloaded!");
  }

  function flash(btn, label) {
    var orig = btn.textContent;
    btn.textContent = label;
    setTimeout(function () {
      btn.textContent = orig;
    }, 1800);
  }

  /* ── orchestration ── */
  function renderActive() {
    if (STATE.active === "grid") renderGrid();
    else if (STATE.active === "students") renderStudents();
    else if (STATE.active === "standards") renderStandards();
    else if (STATE.active === "reteach") renderReteach();
  }

  function renderAll() {
    var hasData = STATE.records.length > 0;
    var empty = $("#emptyState");
    var filterBar = $("#filterBar");
    empty.hidden = hasData;
    filterBar.hidden = !hasData;

    if (!hasData) {
      var msg =
        "This browser has no saved lesson results yet (localStorage key " +
        '"rma_gradebook" is empty or absent).';
      $("#emptyMsg").textContent = msg;
      // still clear any stale view content
      ["#gridWrap", "#studentList", "#standardWrap", "#reteachList"].forEach(
        function (s) {
          var n = $(s);
          if (n) n.innerHTML = "";
        },
      );
      $("#countBadge").textContent = "0 results";
      return;
    }

    var note = STATE.extraGameCount
      ? STATE.records.length +
        " results (" +
        STATE.extraGameCount +
        " from games)"
      : STATE.records.length + " results";
    $("#countBadge").textContent = note;

    renderFilters();
    renderActive();
  }

  function refresh() {
    loadRecords();
    renderAll();
    flash($("#refreshBtn"), "Refreshed");
  }

  function switchTab(tab) {
    STATE.active = tab;
    var titles = {
      grid: [
        "Gradebook Grid",
        "Students down the side, lessons or standards across the top.",
      ],
      students: [
        "By Student",
        "One card per student: average, lessons, and what needs reteach.",
      ],
      standards: [
        "By Standard",
        "Class average and how many students sit in each mastery band.",
      ],
      reteach: [
        "Who to Pull",
        "Students at Approaching or Needs Reteach — your small-group list.",
      ],
      about: [
        "About & Privacy",
        "How this reads your data, and how it stays on this device.",
      ],
    };
    $("#pageTitle").textContent = titles[tab][0];
    $("#pageSubtitle").textContent = titles[tab][1];

    document.querySelectorAll(".nav button").forEach(function (b) {
      var on = b.getAttribute("data-tab") === tab;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".screen").forEach(function (s) {
      var on = s.id === tab;
      s.classList.toggle("active", on);
      s.hidden = !on;
    });
    // filter bar is relevant to data views only
    var dataView = tab !== "about";
    $("#filterBar").hidden = !dataView || STATE.records.length === 0;
    renderActive();
  }

  function applyTheme() {
    if (STATE.theme === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }

  function init() {
    applyTheme();
    loadRecords();
    renderAll();

    document.querySelectorAll(".nav button").forEach(function (b) {
      b.addEventListener("click", function () {
        switchTab(b.getAttribute("data-tab"));
      });
    });
    $("#refreshBtn").addEventListener("click", refresh);
    $("#exportBtn").addEventListener("click", exportCsv);
    $("#themeBtn").addEventListener("click", function () {
      STATE.theme = STATE.theme === "dark" ? "light" : "dark";
      applyTheme();
    });

    $("#searchInput").addEventListener("input", function (e) {
      STATE.filters.search = e.target.value;
      renderActive();
    });
    $("#periodFilter").addEventListener("change", function (e) {
      STATE.filters.period = e.target.value;
      renderActive();
    });
    $("#standardFilter").addEventListener("change", function (e) {
      STATE.filters.standard = e.target.value;
      renderActive();
    });
    $("#groupBy").addEventListener("change", function (e) {
      STATE.groupBy = e.target.value;
      renderGrid();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

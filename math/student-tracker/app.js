/**
 * Neft Teacher — Student Growth Tracker
 *
 * Local-first, per-student longitudinal analytics. Auto-populates from the
 * student-work feeds already stored on this device, recalculates advanced
 * statistics on every change, and also accepts manual teacher input.
 *
 * NO network calls. Nothing leaves the browser. Vanilla JS, zero dependencies.
 *
 * Source feeds (localStorage, same origin):
 *   - rma_gradebook                         engine grade.js records
 *   - rma_game_results, rma_activity_results same record shape
 *   - nt_results_log                        nt-results.js CSV rows (Skill:"Overall")
 *   - nt_tracker_manual                     manual entries written by THIS tool only
 *
 * Normalized record:
 *   { student, period, standard, label, pct, correct, total, date, source }
 */
(function () {
  "use strict";

  /* ----------------------------------------------------------------- config */

  var SOURCE_KEYS = [
    "rma_gradebook",
    "rma_game_results",
    "rma_activity_results",
  ];
  var NT_LOG_KEY = "nt_results_log";
  var MANUAL_KEY = "nt_tracker_manual";

  // Mastery bands — MUST match engine/core/grade.js and class-dashboard.
  function masteryBand(pct) {
    if (pct >= 85) return "Strong";
    if (pct >= 70) return "Likely Ready";
    if (pct >= 60) return "Approaching";
    return "Needs Reteach";
  }
  var BAND_ORDER = ["Needs Reteach", "Approaching", "Likely Ready", "Strong"];
  var BAND_CLASS = {
    Strong: "b-strong",
    "Likely Ready": "b-likely",
    Approaching: "b-approaching",
    "Needs Reteach": "b-reteach",
  };

  // Statistical tuning constants.
  var HALF_LIFE_DAYS = 21; // recency-weight half-life
  var PROJECT_DAYS = 14; // projection horizon

  var STATE = {
    records: [],
    students: [], // computed student summaries
    view: "overview", // overview | roster | detail
    selected: null, // student key for detail
    sort: { key: "risk", dir: "desc" },
    filter: { period: "", standard: "", search: "" },
  };

  /* -------------------------------------------------------------- utilities */

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k.indexOf("on") === 0 && typeof attrs[k] === "function")
        node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }
  function round(n, d) {
    var f = Math.pow(10, d || 0);
    return Math.round(n * f) / f;
  }
  function todayISO() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }
  // Parse a date string to epoch days; tolerant of ISO and m/d/Y.
  function toDays(dateStr) {
    if (!dateStr) return null;
    var t = Date.parse(dateStr);
    if (isNaN(t)) {
      var m = String(dateStr).match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
      if (m) {
        var y = m[3].length === 2 ? "20" + m[3] : m[3];
        t = Date.parse(
          y + "-" + m[1].padStart(2, "0") + "-" + m[2].padStart(2, "0"),
        );
      }
    }
    return isNaN(t) ? null : Math.floor(t / 86400000);
  }
  function nowDays() {
    return Math.floor(Date.now() / 86400000);
  }
  function fmtDate(days) {
    if (days == null) return "—";
    var d = new Date(days * 86400000);
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function readJSON(key) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  /* ------------------------------------------------------------- ingestion */

  // Engine/game/activity record -> normalized.
  function fromEngine(r, source) {
    var correct = num(r.correct);
    var total = num(r.total != null ? r.total : r.attempts);
    var pct =
      r.pct != null ? num(r.pct) : total > 0 ? (correct / total) * 100 : null;
    if (pct == null) return null;
    return {
      student: clean(r.studentName || r.student),
      period: clean(r.studentPeriod || r.period || r.class),
      standard: clean(r.standard),
      label: clean(r.lessonTitle || r.assessment || r.lessonId || "Activity"),
      pct: clamp(round(pct, 1), 0, 100),
      correct: isFinite(correct) ? correct : null,
      total: isFinite(total) ? total : null,
      date: toDays(r.date),
      source: source,
    };
  }

  // nt_results_log rows: keep only the "Overall" total row per result.
  function fromNTRow(r) {
    if (clean(r.Skill).toLowerCase() !== "overall") return null;
    var pct = num(r.Percent);
    if (!isFinite(pct)) return null;
    var totMatch = String(r["Question/Item"] || "").match(/(\d+)/);
    return {
      student: clean(r["Student Name"]),
      period: clean(r.Class),
      standard: clean(r.Standard),
      label: clean(r.Assessment || "Assessment"),
      pct: clamp(round(pct, 1), 0, 100),
      correct: isFinite(num(r.Score)) ? num(r.Score) : null,
      total: totMatch ? +totMatch[1] : null,
      date: toDays(r.Date),
      source: "assessment",
    };
  }

  function num(v) {
    if (v == null || v === "") return NaN;
    return typeof v === "number" ? v : parseFloat(v);
  }
  function clean(v) {
    return v == null ? "" : String(v).trim();
  }

  function loadRecords() {
    var out = [];
    SOURCE_KEYS.forEach(function (k) {
      readJSON(k).forEach(function (r) {
        var n = fromEngine(r, k === "rma_gradebook" ? "lesson" : "game");
        if (n && n.student) out.push(n);
      });
    });
    readJSON(NT_LOG_KEY).forEach(function (r) {
      var n = fromNTRow(r);
      if (n && n.student) out.push(n);
    });
    readJSON(MANUAL_KEY).forEach(function (r) {
      var n = fromEngine(r, "manual");
      if (n && n.student) out.push(n);
    });
    // Default missing dates to today so they still sort/trend sensibly.
    out.forEach(function (r) {
      if (r.date == null) r.date = nowDays();
    });
    STATE.records = out;
  }

  /* ------------------------------------------------------------ statistics */

  function mean(xs) {
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  }
  function stdev(xs) {
    if (xs.length < 2) return 0;
    var m = mean(xs);
    return Math.sqrt(mean(xs.map((x) => (x - m) * (x - m))));
  }
  // Exponential recency weighting: weight halves every HALF_LIFE_DAYS.
  function recencyWeighted(records) {
    if (!records.length) return 0;
    var now = nowDays();
    var lambda = Math.LN2 / HALF_LIFE_DAYS;
    var wsum = 0,
      vsum = 0;
    records.forEach(function (r) {
      var age = Math.max(0, now - r.date);
      var w = Math.exp(-lambda * age);
      wsum += w;
      vsum += w * r.pct;
    });
    return wsum ? vsum / wsum : mean(records.map((r) => r.pct));
  }
  // Least-squares slope of pct vs day, returned as points/week, plus intercept.
  function regression(records) {
    if (records.length < 2) return null;
    var xs = records.map((r) => r.date);
    var ys = records.map((r) => r.pct);
    var mx = mean(xs),
      my = mean(ys);
    var num = 0,
      den = 0;
    for (var i = 0; i < xs.length; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) * (xs[i] - mx);
    }
    if (den === 0) return null; // all same day
    var slope = num / den; // pts per day
    var intercept = my - slope * mx;
    return {
      slopePerWeek: slope * 7,
      slopePerDay: slope,
      intercept: intercept,
    };
  }
  function trendLabel(slopePerWeek) {
    if (slopePerWeek == null) return "—";
    if (slopePerWeek > 1.5) return "Improving";
    if (slopePerWeek < -1.5) return "Declining";
    return "Flat";
  }

  // Composite early-warning risk score 0..100 (higher = more concern).
  function riskScore(s) {
    var masteryComp = (100 - s.mastery) * 0.45;
    // Declining trend adds risk; improving subtracts. Cap at ±10 pts/wk effect.
    var slope = s.reg ? s.reg.slopePerWeek : 0;
    var trendComp = clamp(-slope, -10, 10) * 2.5 * 0.25 + 6.25; // center ~6.25
    trendComp = clamp(trendComp, 0, 25);
    var volComp = clamp(s.volatility, 0, 40) * (15 / 40);
    var daysSince = s.lastActive != null ? nowDays() - s.lastActive : 60;
    var engageComp =
      clamp(daysSince / 30, 0, 1) * 9 + (s.records.length < 3 ? 6 : 0);
    engageComp = clamp(engageComp, 0, 15);
    return clamp(
      round(masteryComp + trendComp + volComp + engageComp, 0),
      0,
      100,
    );
  }
  // Readiness level from the standards-based mastery band, modulated by trend.
  // This is the teacher-facing flag: it is interpretable ("a Needs-Reteach
  // student who is not improving is At Risk") rather than an opaque cutoff.
  // The numeric riskScore() is retained for fine-grained sorting WITHIN a level.
  function riskLevel(s) {
    var band = s.band,
      tr = s.trend;
    if (band === "Needs Reteach")
      return tr === "Improving" ? "Watch" : "At Risk";
    if (band === "Approaching")
      return tr === "Declining"
        ? "At Risk"
        : tr === "Improving"
          ? "On Track"
          : "Watch";
    if (band === "Likely Ready")
      return tr === "Declining" ? "Watch" : "On Track";
    return tr === "Declining" ? "Watch" : "On Track"; // Strong
  }

  function studentKey(name, period) {
    return (name || "?").toLowerCase() + "|" + (period || "").toLowerCase();
  }

  // Build one summary per student from the (filtered) record set.
  function summarize(records) {
    var byStudent = {};
    records.forEach(function (r) {
      var k = studentKey(r.student, r.period);
      (
        byStudent[k] ||
        (byStudent[k] = { name: r.student, period: r.period, recs: [] })
      ).recs.push(r);
    });
    return Object.keys(byStudent).map(function (k) {
      var g = byStudent[k];
      var recs = g.recs.slice().sort((a, b) => a.date - b.date);
      var pcts = recs.map((r) => r.pct);
      var mastery = round(recencyWeighted(recs), 1);
      var reg = regression(recs);
      // Per-standard mastery (recency-weighted within standard).
      var stds = {};
      recs.forEach(function (r) {
        var sd = r.standard || "(untagged)";
        (stds[sd] || (stds[sd] = [])).push(r);
      });
      var standards = Object.keys(stds)
        .map(function (sd) {
          var m = round(recencyWeighted(stds[sd]), 1);
          return {
            standard: sd,
            mastery: m,
            band: masteryBand(m),
            count: stds[sd].length,
          };
        })
        .sort((a, b) => a.mastery - b.mastery);
      var lastActive = recs.length ? recs[recs.length - 1].date : null;
      var s = {
        key: k,
        name: g.name,
        period: g.period,
        records: recs,
        mastery: mastery,
        band: masteryBand(mastery),
        simpleAvg: round(mean(pcts), 1),
        reg: reg,
        trend: trendLabel(reg ? reg.slopePerWeek : null),
        slopePerWeek: reg ? round(reg.slopePerWeek, 1) : null,
        volatility: round(stdev(pcts), 1),
        lastActive: lastActive,
        standards: standards,
      };
      // Projection: fit value at today + PROJECT_DAYS, clamped.
      if (reg) {
        var x = nowDays() + PROJECT_DAYS;
        s.projection = clamp(
          round(reg.intercept + reg.slopePerDay * x, 0),
          0,
          100,
        );
        s.projectionBand = masteryBand(s.projection);
      } else {
        s.projection = null;
        s.projectionBand = null;
      }
      s.risk = riskScore(s);
      s.riskLevel = riskLevel(s);
      return s;
    });
  }

  // Recommended next instructional move (deterministic, evidence-based).
  function recommend(s) {
    if (s.riskLevel === "At Risk") {
      var weak = s.standards[0];
      return (
        "Priority intervention. Start with " +
        (weak
          ? weak.standard + " (" + weak.mastery + "%)"
          : "the weakest standard") +
        (s.trend === "Declining"
          ? "; trend is declining, check for a recent gap."
          : ".")
      );
    }
    if (s.riskLevel === "Watch") {
      if (s.trend === "Declining")
        return "Monitor closely — scores trending down. Re-check the last unit.";
      if (s.volatility >= 20)
        return "Inconsistent performance. Stabilize with spaced practice on weak standards.";
      return "On the bubble. Targeted practice on the lowest standard should lift readiness.";
    }
    if (s.trend === "Improving")
      return "On track and improving. Offer Level 2 enrichment to extend.";
    return "On track. Maintain with mixed review; spot-check the lowest standard.";
  }

  /* --------------------------------------------------- class-level rollups */

  // Standards ranked by number of students not yet "Likely Ready".
  function reteachPriorities(students) {
    var map = {};
    students.forEach(function (s) {
      s.standards.forEach(function (st) {
        if (st.standard === "(untagged)") return;
        var e =
          map[st.standard] ||
          (map[st.standard] = {
            standard: st.standard,
            struggling: [],
            total: 0,
            sum: 0,
          });
        e.total++;
        e.sum += st.mastery;
        if (st.mastery < 70) e.struggling.push(s.name);
      });
    });
    return Object.keys(map)
      .map(function (k) {
        var e = map[k];
        e.avg = round(e.sum / e.total, 1);
        return e;
      })
      .filter((e) => e.struggling.length > 0)
      .sort(
        (a, b) => b.struggling.length - a.struggling.length || a.avg - b.avg,
      );
  }

  function classKPIs(students) {
    if (!students.length)
      return {
        count: 0,
        avg: 0,
        atRisk: 0,
        watch: 0,
        improving: 0,
        declining: 0,
      };
    var avg = round(mean(students.map((s) => s.mastery)), 1);
    return {
      count: students.length,
      avg: avg,
      band: masteryBand(avg),
      atRisk: students.filter((s) => s.riskLevel === "At Risk").length,
      watch: students.filter((s) => s.riskLevel === "Watch").length,
      improving: students.filter((s) => s.trend === "Improving").length,
      declining: students.filter((s) => s.trend === "Declining").length,
    };
  }

  /* ---------------------------------------------------------- filter/derive */

  function applyFilter() {
    var f = STATE.filter;
    var recs = STATE.records.filter(function (r) {
      if (f.period && r.period !== f.period) return false;
      if (f.standard && r.standard !== f.standard) return false;
      if (
        f.search &&
        (r.student || "").toLowerCase().indexOf(f.search.toLowerCase()) < 0
      )
        return false;
      return true;
    });
    STATE.students = summarize(recs);
  }

  function uniqueValues(key) {
    var set = {};
    STATE.records.forEach(function (r) {
      if (r[key]) set[r[key]] = true;
    });
    return Object.keys(set).sort();
  }

  /* ------------------------------------------------------------- rendering */

  function bandChip(band) {
    return el("span", {
      class: "chip " + (BAND_CLASS[band] || ""),
      text: band,
    });
  }
  function riskChip(level) {
    var cls =
      level === "At Risk" ? "r-high" : level === "Watch" ? "r-mid" : "r-low";
    return el("span", { class: "chip " + cls, text: level });
  }
  function trendArrow(trend) {
    var m = { Improving: "▲", Declining: "▼", Flat: "▬" };
    var cls =
      trend === "Improving"
        ? "t-up"
        : trend === "Declining"
          ? "t-down"
          : "t-flat";
    return el("span", {
      class: "trend " + cls,
      text: (m[trend] || "—") + " " + trend,
    });
  }

  // Inline SVG sparkline of pct over time (no dependencies).
  function sparkline(recs, w, h) {
    w = w || 220;
    h = h || 56;
    var pad = 4;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("class", "spark");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Score trend over time");
    if (recs.length < 1) return svg;
    var xs = recs.map((r) => r.date);
    var minX = Math.min.apply(null, xs),
      maxX = Math.max.apply(null, xs);
    var spanX = maxX - minX || 1;
    function px(d) {
      return pad + ((d - minX) / spanX) * (w - 2 * pad);
    }
    function py(p) {
      return h - pad - (p / 100) * (h - 2 * pad);
    }
    // 70% readiness reference line.
    var ref = document.createElementNS(ns, "line");
    ref.setAttribute("x1", pad);
    ref.setAttribute("x2", w - pad);
    ref.setAttribute("y1", py(70));
    ref.setAttribute("y2", py(70));
    ref.setAttribute("class", "spark-ref");
    svg.appendChild(ref);
    var d = recs
      .map(function (r, i) {
        return (
          (i ? "L" : "M") + round(px(r.date), 1) + " " + round(py(r.pct), 1)
        );
      })
      .join(" ");
    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "spark-line");
    svg.appendChild(path);
    recs.forEach(function (r) {
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", round(px(r.date), 1));
      c.setAttribute("cy", round(py(r.pct), 1));
      c.setAttribute("r", 2.5);
      c.setAttribute("class", "spark-dot");
      svg.appendChild(c);
    });
    return svg;
  }

  function kpiCard(label, value, sub, cls) {
    return el("div", { class: "kpi " + (cls || "") }, [
      el("div", { class: "kpi-value", text: String(value) }),
      el("div", { class: "kpi-label", text: label }),
      sub ? el("div", { class: "kpi-sub", text: sub }) : null,
    ]);
  }

  function renderOverview(root) {
    var k = classKPIs(STATE.students);
    if (!k.count) {
      root.appendChild(emptyState());
      return;
    }
    root.appendChild(
      el("div", { class: "kpi-row" }, [
        kpiCard("Students tracked", k.count, "with recorded work"),
        kpiCard(
          "Class mastery",
          k.avg + "%",
          k.band,
          "kpi-" + (BAND_CLASS[k.band] || ""),
        ),
        kpiCard(
          "At risk",
          k.atRisk,
          "need priority support",
          k.atRisk ? "kpi-r-high" : "",
        ),
        kpiCard(
          "Watch",
          k.watch,
          "monitor closely",
          k.watch ? "kpi-r-mid" : "",
        ),
        kpiCard("Improving", k.improving, "positive trend", "kpi-b-strong"),
        kpiCard(
          "Declining",
          k.declining,
          "negative trend",
          k.declining ? "kpi-r-high" : "",
        ),
      ]),
    );

    // Reteach priorities
    var pri = reteachPriorities(STATE.students);
    var priWrap = el("section", { class: "panel" }, [
      el("h2", { text: "Standards needing reteach" }),
      el("p", {
        class: "muted",
        text: "Ranked by how many tracked students are below readiness (70%).",
      }),
    ]);
    if (!pri.length) {
      priWrap.appendChild(
        el("p", { class: "muted", text: "No standards below readiness. 🎉" }),
      );
    } else {
      var list = el("div", { class: "pri-list" });
      pri.slice(0, 8).forEach(function (e) {
        list.appendChild(
          el("div", { class: "pri-item" }, [
            el("div", { class: "pri-head" }, [
              el("strong", { text: e.standard }),
              el("span", { class: "muted", text: "avg " + e.avg + "%" }),
            ]),
            el("div", { class: "pri-bar" }, [
              el("span", {
                class: "pri-fill",
                style:
                  "width:" +
                  clamp((e.struggling.length / k.count) * 100, 4, 100) +
                  "%",
              }),
            ]),
            el("div", {
              class: "pri-names",
              text:
                e.struggling.length + " students: " + e.struggling.join(", "),
            }),
          ]),
        );
      });
      priWrap.appendChild(list);
    }
    root.appendChild(priWrap);

    // Suggested intervention groups (by weakest shared standard)
    var groups = pri
      .slice(0, 4)
      .map((e) => ({ standard: e.standard, members: e.struggling, avg: e.avg }))
      .filter((g) => g.members.length >= 2);
    var grpWrap = el("section", { class: "panel" }, [
      el("h2", { text: "Suggested small groups" }),
      el("p", {
        class: "muted",
        text: "Auto-formed from students who share a weak standard.",
      }),
    ]);
    if (!groups.length) {
      grpWrap.appendChild(
        el("p", {
          class: "muted",
          text: "No shared-need groups of 2+ right now.",
        }),
      );
    } else {
      var gg = el("div", { class: "group-grid" });
      groups.forEach(function (g) {
        gg.appendChild(
          el("div", { class: "group-card" }, [
            el("div", { class: "group-title" }, [
              el("strong", { text: "Reteach " + g.standard }),
              el("span", { class: "muted", text: "avg " + g.avg + "%" }),
            ]),
            el(
              "ul",
              { class: "group-members" },
              g.members.map((m) => el("li", { text: m })),
            ),
          ]),
        );
      });
      grpWrap.appendChild(gg);
    }
    root.appendChild(grpWrap);
  }

  function renderRoster(root) {
    if (!STATE.students.length) {
      root.appendChild(emptyState());
      return;
    }
    var students = STATE.students.slice();
    var s = STATE.sort;
    var getters = {
      name: (x) => x.name.toLowerCase(),
      mastery: (x) => x.mastery,
      trend: (x) => (x.slopePerWeek == null ? -999 : x.slopePerWeek),
      risk: (x) => x.risk,
      last: (x) => x.lastActive || 0,
      projection: (x) => (x.projection == null ? -1 : x.projection),
    };
    var g = getters[s.key] || getters.risk;
    students.sort(function (a, b) {
      var va = g(a),
        vb = g(b);
      if (va < vb) return s.dir === "asc" ? -1 : 1;
      if (va > vb) return s.dir === "asc" ? 1 : -1;
      return 0;
    });

    var cols = [
      { key: "name", label: "Student" },
      { key: "mastery", label: "Mastery" },
      { key: "trend", label: "Trend (pts/wk)" },
      { key: "projection", label: "Projected +2wk" },
      { key: "risk", label: "Risk" },
      { key: "last", label: "Last active" },
    ];
    var thead = el(
      "tr",
      {},
      cols.map(function (c) {
        var arrow = s.key === c.key ? (s.dir === "asc" ? " ▲" : " ▼") : "";
        return el("th", {
          scope: "col",
          tabindex: "0",
          role: "button",
          "aria-label": "Sort by " + c.label,
          text: c.label + arrow,
          onclick: function () {
            if (STATE.sort.key === c.key)
              STATE.sort.dir = STATE.sort.dir === "asc" ? "desc" : "asc";
            else
              STATE.sort = {
                key: c.key,
                dir: c.key === "name" ? "asc" : "desc",
              };
            render();
          },
          onkeydown: function (ev) {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              this.click();
            }
          },
        });
      }),
    );
    var tbody = el(
      "tbody",
      {},
      students.map(function (x) {
        return el(
          "tr",
          {
            class: "roster-row",
            tabindex: "0",
            role: "button",
            "aria-label": "View detail for " + x.name,
            onclick: function () {
              STATE.selected = x.key;
              STATE.view = "detail";
              render();
            },
            onkeydown: function (ev) {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                this.click();
              }
            },
          },
          [
            el("td", {}, [
              el("strong", { text: x.name }),
              x.period
                ? el("span", { class: "muted", text: " · " + x.period })
                : null,
            ]),
            el("td", {}, [
              el("span", { class: "num", text: x.mastery + "%" }),
              bandChip(x.band),
            ]),
            el("td", {}, [
              trendArrow(x.trend),
              x.slopePerWeek != null
                ? el("span", {
                    class: "muted",
                    text:
                      " " + (x.slopePerWeek > 0 ? "+" : "") + x.slopePerWeek,
                  })
                : null,
            ]),
            el("td", {}, [
              x.projection != null
                ? el("span", {}, [
                    el("span", { class: "num", text: x.projection + "%" }),
                    bandChip(x.projectionBand),
                  ])
                : el("span", { class: "muted", text: "—" }),
            ]),
            el("td", {}, [
              riskChip(x.riskLevel),
              el("span", { class: "muted", text: " " + x.risk }),
            ]),
            el("td", { class: "muted", text: fmtDate(x.lastActive) }),
          ],
        );
      }),
    );
    root.appendChild(
      el("div", { class: "table-wrap" }, [
        el("table", { class: "roster" }, [el("thead", {}, [thead]), tbody]),
      ]),
    );
    root.appendChild(
      el("p", {
        class: "muted hint",
        text: "Tip: click a column to sort, click a row for the full student profile.",
      }),
    );
  }

  function renderDetail(root) {
    var s = STATE.students.filter((x) => x.key === STATE.selected)[0];
    if (!s) {
      STATE.view = "roster";
      return renderRoster(root);
    }
    root.appendChild(
      el("button", {
        class: "back-btn",
        text: "← Back to roster",
        onclick: function () {
          STATE.view = "roster";
          render();
        },
      }),
    );

    var header = el("div", { class: "detail-head" }, [
      el("div", {}, [
        el("h2", { text: s.name }),
        el("p", {
          class: "muted",
          text:
            (s.period ? s.period + " · " : "") +
            s.records.length +
            " records · last active " +
            fmtDate(s.lastActive),
        }),
      ]),
      el("div", { class: "detail-badges" }, [
        bandChip(s.band),
        riskChip(s.riskLevel),
      ]),
    ]);
    root.appendChild(header);

    root.appendChild(
      el("div", { class: "kpi-row" }, [
        kpiCard(
          "Recency mastery",
          s.mastery + "%",
          "weighted to recent work",
          "kpi-" + (BAND_CLASS[s.band] || ""),
        ),
        kpiCard("Simple average", s.simpleAvg + "%", "all records equal"),
        kpiCard(
          "Trend",
          (s.slopePerWeek != null
            ? (s.slopePerWeek > 0 ? "+" : "") + s.slopePerWeek
            : "—") + " /wk",
          s.trend,
        ),
        kpiCard("Volatility", "±" + s.volatility, "score spread (SD)"),
        kpiCard(
          "Projected +2wk",
          s.projection != null ? s.projection + "%" : "—",
          s.projectionBand || "needs 2+ points",
        ),
        kpiCard(
          "Risk score",
          s.risk,
          s.riskLevel,
          s.riskLevel === "At Risk"
            ? "kpi-r-high"
            : s.riskLevel === "Watch"
              ? "kpi-r-mid"
              : "kpi-b-strong",
        ),
      ]),
    );

    var chartPanel = el("section", { class: "panel" }, [
      el("h3", { text: "Score trend" }),
    ]);
    chartPanel.appendChild(sparkline(s.records, 520, 120));
    chartPanel.appendChild(
      el("p", {
        class: "muted",
        text: "Dashed line = 70% readiness. Each dot is one recorded result.",
      }),
    );
    root.appendChild(chartPanel);

    var rec = el("section", { class: "panel recommend" }, [
      el("h3", { text: "Recommended next move" }),
      el("p", { text: recommend(s) }),
    ]);
    root.appendChild(rec);

    var stdPanel = el("section", { class: "panel" }, [
      el("h3", { text: "Mastery by standard" }),
    ]);
    var stbl = el("table", { class: "std-table" }, [
      el("thead", {}, [
        el("tr", {}, [
          el("th", { scope: "col", text: "Standard" }),
          el("th", { scope: "col", text: "Mastery" }),
          el("th", { scope: "col", text: "Band" }),
          el("th", { scope: "col", text: "Records" }),
        ]),
      ]),
      el(
        "tbody",
        {},
        s.standards.map(function (st) {
          return el("tr", {}, [
            el("td", { text: st.standard }),
            el("td", {}, [
              el("span", { class: "minibar" }, [
                el("span", {
                  class: "minibar-fill " + (BAND_CLASS[st.band] || ""),
                  style: "width:" + st.mastery + "%",
                }),
              ]),
              el("span", { class: "num", text: " " + st.mastery + "%" }),
            ]),
            el("td", {}, [bandChip(st.band)]),
            el("td", { class: "muted", text: String(st.count) }),
          ]);
        }),
      ),
    ]);
    stdPanel.appendChild(stbl);
    root.appendChild(stdPanel);
  }

  function emptyState() {
    return el("section", { class: "panel empty" }, [
      el("h2", { text: "No student work found yet" }),
      el("p", {
        text: "This tracker auto-populates from activities, lessons, and assessments completed on this device. As students finish work, their results appear here automatically.",
      }),
      el("p", {
        class: "muted",
        text: "You can also add results manually with “+ Add result”. Reading feeds: rma_gradebook, game/activity results, and nt_results_log.",
      }),
    ]);
  }

  /* --------------------------------------------------------- manual entry */

  function openManualDialog() {
    var dlg = $("#manual-dialog");
    $("#m-date").value = todayISO();
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    $("#m-student").focus();
  }
  function saveManual(ev) {
    ev.preventDefault();
    var name = $("#m-student").value.trim();
    if (!name) {
      $("#m-student").focus();
      return;
    }
    var correct = parseFloat($("#m-correct").value);
    var total = parseFloat($("#m-total").value);
    var pctField = parseFloat($("#m-pct").value);
    var pct = isFinite(pctField)
      ? pctField
      : total > 0
        ? (correct / total) * 100
        : NaN;
    if (!isFinite(pct)) {
      $("#m-pct").focus();
      return;
    }
    var rec = {
      studentName: name,
      studentPeriod: $("#m-period").value.trim(),
      standard: $("#m-standard").value.trim(),
      lessonTitle: $("#m-label").value.trim() || "Manual entry",
      correct: isFinite(correct) ? correct : null,
      total: isFinite(total) ? total : null,
      pct: clamp(round(pct, 1), 0, 100),
      date: $("#m-date").value || todayISO(),
    };
    var arr = readJSON(MANUAL_KEY);
    arr.push(rec);
    try {
      localStorage.setItem(MANUAL_KEY, JSON.stringify(arr));
    } catch (e) {}
    $("#manual-dialog").close();
    ev.target.reset();
    refresh();
  }

  /* ----------------------------------------------------------- CSV export */

  function exportCSV() {
    var cols = [
      "Student",
      "Period",
      "Mastery%",
      "SimpleAvg%",
      "Trend/wk",
      "Projection+2wk%",
      "Volatility",
      "RiskScore",
      "RiskLevel",
      "LastActive",
      "Records",
    ];
    var lines = [cols.join(",")];
    STATE.students.forEach(function (s) {
      lines.push(
        [
          csv(s.name),
          csv(s.period),
          s.mastery,
          s.simpleAvg,
          s.slopePerWeek == null ? "" : s.slopePerWeek,
          s.projection == null ? "" : s.projection,
          s.volatility,
          s.risk,
          csv(s.riskLevel),
          fmtDate(s.lastActive),
          s.records.length,
        ].join(","),
      );
    });
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var a = el("a", {
      href: URL.createObjectURL(blob),
      download: "neft-student-tracker.csv",
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function csv(v) {
    v = v == null ? "" : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  /* -------------------------------------------------------------- chrome */

  function renderControls() {
    var periods = uniqueValues("period");
    var standards = uniqueValues("standard");
    $("#f-period").innerHTML =
      '<option value="">All periods</option>' +
      periods.map((p) => "<option>" + escapeHtml(p) + "</option>").join("");
    $("#f-period").value = STATE.filter.period;
    $("#f-standard").innerHTML =
      '<option value="">All standards</option>' +
      standards.map((p) => "<option>" + escapeHtml(p) + "</option>").join("");
    $("#f-standard").value = STATE.filter.standard;
    $all(".tab").forEach(function (t) {
      var active = t.getAttribute("data-view") === STATE.view;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function render() {
    applyFilter();
    renderControls();
    var root = $("#view-root");
    root.innerHTML = "";
    if (STATE.view === "overview") renderOverview(root);
    else if (STATE.view === "roster") renderRoster(root);
    else renderDetail(root);
  }

  function refresh() {
    loadRecords();
    render();
    var stamp = $("#updated");
    if (stamp) stamp.textContent = "Updated " + new Date().toLocaleTimeString();
  }

  /* ----------------------------------------------------------------- init */

  function init() {
    // Tabs
    $all(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        STATE.view = t.getAttribute("data-view");
        render();
      });
    });
    // Filters
    $("#f-period").addEventListener("change", function () {
      STATE.filter.period = this.value;
      render();
    });
    $("#f-standard").addEventListener("change", function () {
      STATE.filter.standard = this.value;
      render();
    });
    $("#f-search").addEventListener("input", function () {
      STATE.filter.search = this.value;
      render();
    });
    $("#btn-refresh").addEventListener("click", refresh);
    $("#btn-export").addEventListener("click", exportCSV);
    $("#btn-add").addEventListener("click", openManualDialog);
    $("#manual-form").addEventListener("submit", saveManual);
    $("#m-cancel").addEventListener("click", function () {
      $("#manual-dialog").close();
    });

    // Live auto-update: cross-tab writes + returning focus.
    window.addEventListener("storage", function (e) {
      if (
        !e.key ||
        e.key === MANUAL_KEY ||
        SOURCE_KEYS.indexOf(e.key) >= 0 ||
        e.key === NT_LOG_KEY
      )
        refresh();
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) refresh();
    });

    refresh();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  // Expose internals for testing/QA.
  window.NeftTracker = {
    _summarize: summarize,
    _regression: regression,
    _recencyWeighted: recencyWeighted,
    _riskScore: riskScore,
    _masteryBand: masteryBand,
    _stdev: stdev,
    _state: STATE,
  };
})();

/*
 * Neft Math Brain — browser integration layer.
 * Loads content-graph.json, reads local results (nt_result_v1), runs the mastery +
 * recommendation engines, and renders the student "What's next" door and the teacher
 * mastery heatmap. Additive: depends only on assets/brain/{mastery,recommend}-engine.js
 * and assets/nt-activity-kit.js (for results), all loaded as plain <script> before this.
 */
(function () {
  "use strict";
  var B = (window.NeftBrain = window.NeftBrain || {});
  var GRAPH_URL = window.NEFT_BRAIN_GRAPH || "/data/content-graph.json";
  var TAX_URL = window.NEFT_BRAIN_TAXONOMY || "/data/standards-taxonomy.json";
  var RESULTS_KEY = "nt_results_v1";

  var _cache = null;

  function getResults() {
    if (window.NTKit && typeof window.NTKit.getResults === "function")
      return window.NTKit.getResults();
    try {
      return JSON.parse(localStorage.getItem(RESULTS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function fetchJSON(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error("fetch " + url + " -> " + r.status);
      return r.json();
    });
  }

  // load(): resolves { graph, taxonomy, mastery, recommendations }
  B.load = function load(opts) {
    opts = opts || {};
    if (_cache && !opts.force) return Promise.resolve(_cache);
    if (!B.Mastery || !B.Recommend) {
      return Promise.reject(
        new Error(
          "NeftBrain engines not loaded (include mastery-engine.js + recommend-engine.js before brain.js)",
        ),
      );
    }
    return Promise.all([fetchJSON(GRAPH_URL), fetchJSON(TAX_URL)]).then(function (arr) {
      var graph = arr[0],
        taxonomy = arr[1];
      if (!graph || !graph.byUrl || !graph.entries || !taxonomy || !taxonomy.standards) {
        throw new Error("content-graph / taxonomy malformed or missing");
      }
      var results = opts.results || getResults();
      var contentGraph = { byUrl: graph.byUrl, byId: graph.byUrl };
      var mastery = B.Mastery.compute(results, {
        contentGraph: contentGraph,
        taxonomy: taxonomy,
      });
      var completed = results.map(function (r) {
        return r.activityId;
      });
      var recommendations = B.Recommend.recommend(mastery, {
        entries: graph.entries,
        completedUrls: completed,
        limit: opts.limit || 8,
      });
      _cache = {
        graph: graph,
        taxonomy: taxonomy,
        mastery: mastery,
        recommendations: recommendations,
      };
      return _cache;
    });
  };

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

  // Student-facing "What's next" door.
  B.renderWhatsNext = function (target, opts) {
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return;
    host.innerHTML = "<p class='nb-loading'>Finding your next step…</p>";
    return B.load(opts).then(function (data) {
      host.innerHTML = "";
      var recs = data.recommendations;
      if (!recs.length) {
        host.appendChild(
          el("p", "nb-empty", "Do an activity and your personalized path will appear here."),
        );
        return data;
      }
      var head = el(
        "div",
        "nb-head",
        "<strong>Your next steps</strong> <span class='nb-sub'>" +
          esc(data.mastery.standardsAssessed) +
          " skills tracked</span>",
      );
      host.appendChild(head);
      var list = el("div", "nb-reclist");
      recs.forEach(function (r) {
        var card = el("a", "nb-rec nb-l" + r.level);
        card.href = r.url;
        card.innerHTML =
          "<span class='nb-rec-title'>" +
          esc(r.title) +
          "</span>" +
          "<span class='nb-rec-std'>" +
          esc(r.standard) +
          "</span>" +
          "<span class='nb-rec-why'>" +
          esc(r.reason) +
          "</span>";
        list.appendChild(card);
      });
      host.appendChild(list);
      return data;
    });
  };

  // Teacher-facing mastery heatmap for one student's local data (single-device view).
  // For a whole roster, pass opts.roster = [{student_key, results}].
  B.renderHeatmap = function (target, opts) {
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return;
    opts = opts || {};
    host.innerHTML = "<p class='nb-loading'>Loading mastery…</p>";
    return B.load(opts).then(function (data) {
      var tax = data.taxonomy;
      var rosters = opts.roster || [{ student_key: "this device", mastery: data.mastery }];
      // ensure each roster row has computed mastery
      rosters.forEach(function (row) {
        if (!row.mastery) {
          row.mastery = B.Mastery.compute(row.results || [], {
            contentGraph: { byUrl: data.graph.byUrl, byId: data.graph.byUrl },
            taxonomy: tax,
          });
        }
      });
      host.innerHTML = "";
      var table = el("table", "nb-heatmap");
      var thead = "<tr><th>Student</th>";
      tax.standards.forEach(function (s) {
        thead += "<th title='" + esc(s.label) + "'>" + esc(s.id.replace(/^6\./, "")) + "</th>";
      });
      thead += "</tr>";
      table.appendChild(el("thead", null, thead));
      var tbody = el("tbody");
      // Build the full markup once, then assign innerHTML a single time (avoid
      // re-parsing the whole table body on every row).
      var rows = rosters.map(function (row) {
        var cells = tax.standards
          .map(function (s) {
            var st = row.mastery && row.mastery.standards[s.id];
            if (!st) return "<td class='nb-cell nb-none' title='not yet assessed'></td>";
            var pct = Math.round(st.mastery * 100);
            return (
              "<td class='nb-cell nb-" +
              st.band +
              "' title='" +
              esc(s.id + ": " + pct + "% (" + st.band + ")") +
              "'>" +
              pct +
              "</td>"
            );
          })
          .join("");
        return "<tr><td class='nb-name'>" + esc(row.student_key) + "</td>" + cells + "</tr>";
      });
      tbody.innerHTML = rows.join("");
      table.appendChild(tbody);
      host.appendChild(table);
      return data;
    });
  };

  // Teacher-facing "assign the next step": one row per standard with the current
  // mastery band and a direct link to the right-level activity to assign —
  // struggling → on-ramp (L0), developing → core (L1), proficient → enrichment
  // (L2). Turns the heatmap into action. Single-device view like renderHeatmap;
  // pass opts.results for a specific student.
  var DIFF_WANT = { struggling: [0, 1, 2], developing: [1, 0, 2], proficient: [2, 1] };
  var DIFF_LABEL = {
    struggling: "On-ramp · support",
    developing: "Core practice",
    proficient: "Enrichment · stretch",
  };
  B.renderDifferentiation = function (target, opts) {
    var host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) return;
    opts = opts || {};
    host.innerHTML = "<p class='nb-loading'>Loading differentiation…</p>";
    return B.load(opts).then(function (data) {
      var tax = data.taxonomy;
      var mastery = data.mastery;
      // Index real activities by standard → level → [entries].
      var byStd = {};
      (data.graph.entries || []).forEach(function (e) {
        if (!e.standard || e.standard === "MIXED" || e.standard === "NON_MATH") return;
        var lv = byStd[e.standard] || (byStd[e.standard] = {});
        (lv[e.level] || (lv[e.level] = [])).push(e);
      });
      function pick(std, band) {
        var lv = byStd[std];
        if (!lv) return null;
        var order = DIFF_WANT[band] || [1, 0, 2];
        for (var i = 0; i < order.length; i++) {
          var arr = lv[order[i]];
          if (arr && arr.length) return { entry: arr[0], level: order[i] };
        }
        return null;
      }
      host.innerHTML = "";
      var rows = tax.standards.map(function (s) {
        var st = mastery.standards[s.id];
        var assessed = !!st;
        var band = assessed ? st.band : "developing"; // unassessed → suggest core
        var bandCls = assessed ? st.band : "none";
        var bandText = assessed ? st.band : "not assessed";
        var pct = assessed ? Math.round(st.mastery * 100) + "%" : "—";
        var rec = pick(s.id, band);
        var action = rec
          ? "<a class='nb-rec nb-l" +
            rec.level +
            "' href='" +
            esc(rec.entry.url) +
            "'><span class='nb-rec-title'>" +
            esc(rec.entry.title) +
            "</span><span class='nb-rec-why'>" +
            esc(DIFF_LABEL[band] || "Start here") +
            "</span></a>"
          : "<span class='nb-diff-empty'>no activity tagged yet</span>";
        return (
          "<tr><td class='nb-name' title='" +
          esc(s.label) +
          "'>" +
          esc(s.id.replace(/^6\./, "")) +
          "</td><td class='nb-cell nb-" +
          bandCls +
          "'>" +
          esc(bandText) +
          "</td><td class='nb-diff-pct'>" +
          pct +
          "</td><td class='nb-diff-action'>" +
          action +
          "</td></tr>"
        );
      });
      var table = el("table", "nb-diff");
      table.innerHTML =
        "<thead><tr><th>Standard</th><th>Band</th><th>Mastery</th><th>Assign next step</th></tr></thead><tbody>" +
        rows.join("") +
        "</tbody>";
      host.appendChild(table);
      return data;
    });
  };
})();

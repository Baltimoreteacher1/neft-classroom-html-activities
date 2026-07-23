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
    } catch (_e) {
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
    return Promise.all([fetchJSON(GRAPH_URL), fetchJSON(TAX_URL)]).then(function (arr) {
      var graph = arr[0],
        taxonomy = arr[1];
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
      rosters.forEach(function (row) {
        var tr = "<tr><td class='nb-name'>" + esc(row.student_key) + "</td>";
        tax.standards.forEach(function (s) {
          var st = row.mastery.standards[s.id];
          if (!st) {
            tr += "<td class='nb-cell nb-none' title='not yet assessed'></td>";
            return;
          }
          var pct = Math.round(st.mastery * 100);
          tr +=
            "<td class='nb-cell nb-" +
            st.band +
            "' title='" +
            esc(s.id + ": " + pct + "% (" + st.band + ")") +
            "'>" +
            pct +
            "</td>";
        });
        tr += "</tr>";
        tbody.innerHTML += tr;
      });
      table.appendChild(tbody);
      host.appendChild(table);
      return data;
    });
  };
})();

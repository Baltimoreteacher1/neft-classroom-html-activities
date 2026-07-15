/* Resource Finder — loads the generated asset concept map and lets a teacher
   pick a standard to see every resource built for it. Asset metadata only
   (no student data), so no key gate. Deep-linkable via ?standard=CODE so
   Insight Brief can hand off a weak standard directly. */
(function () {
  "use strict";
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var MAP_URL = "/data/asset-concept-map.json";
  // Display order + friendly labels for the `via` match badge.
  var VIA = {
    direct: { label: "Teaches", title: "This resource's own config targets this standard" },
    manual: { label: "Tagged", title: "Hand-curated tag for this standard" },
    unit: { label: "Unit-level", title: "A unit project covering this unit's standards" },
  };
  var CAT_ORDER = ["Lesson", "Readiness", "Project", "Practice", "Game", "Math Tool", "Tool"];

  var state = { map: null, standards: [], selected: null };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  fetch(MAP_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("http-" + r.status);
      return r.json();
    })
    .then(init)
    .catch(function () {
      $("#rf-list").innerHTML =
        '<p class="rf-noresults">Could not load the resource map. Run <code>npm run generate-asset-concept-map</code> and redeploy.</p>';
    });

  function init(map) {
    state.map = map;
    state.standards = Object.keys(map.byStandard)
      .map(function (code) {
        return map.byStandard[code];
      })
      .sort(function (a, b) {
        return String(a.standard).localeCompare(b.standard, undefined, { numeric: true });
      });
    renderList("");
    $("#rf-search").addEventListener("input", function () {
      renderList(this.value.trim().toLowerCase());
    });
    var stamp = $("#rf-stamp");
    if (stamp) {
      stamp.textContent =
        state.standards.length +
        " standards indexed · " +
        (map.assetsIndexed || 0) +
        " resources · generated " +
        (map.generated ? new Date(map.generated).toLocaleDateString() : "—");
    }
    // Deep link: ?standard=6.AT.1
    var qs = new URLSearchParams(location.search);
    var want = qs.get("standard");
    if (want && map.byStandard[want]) select(want, true);
  }

  function matches(std, q) {
    if (!q) return true;
    return (
      std.standard.toLowerCase().indexOf(q) >= 0 ||
      String(std.label || "")
        .toLowerCase()
        .indexOf(q) >= 0 ||
      String(std.topic || "")
        .toLowerCase()
        .indexOf(q) >= 0 ||
      String(std.domain || "")
        .toLowerCase()
        .indexOf(q) >= 0
    );
  }

  function renderList(q) {
    var list = $("#rf-list");
    var shown = state.standards.filter(function (s) {
      return matches(s, q);
    });
    if (!shown.length) {
      list.innerHTML = '<p class="rf-noresults">No standards match “' + esc(q) + ".”</p>";
      return;
    }
    var html = "";
    var lastDomain = null;
    shown.forEach(function (s) {
      var dom = s.domain || "Other";
      if (dom !== lastDomain) {
        html += '<div class="rf-domain">' + esc(dom) + "</div>";
        lastDomain = dom;
      }
      var sel = state.selected === s.standard ? ' aria-pressed="true"' : ' aria-pressed="false"';
      html +=
        '<button type="button" class="rf-item" role="listitem" data-code="' +
        esc(s.standard) +
        '"' +
        sel +
        '><span class="code">' +
        esc(s.standard) +
        '</span><span class="label">' +
        esc(s.label || "") +
        '</span><span class="count" title="' +
        s.assets.length +
        ' resources">' +
        s.assets.length +
        "</span></button>";
    });
    list.innerHTML = html;
    Array.prototype.forEach.call(list.querySelectorAll(".rf-item"), function (btn) {
      btn.addEventListener("click", function () {
        select(btn.getAttribute("data-code"), false);
      });
    });
  }

  function select(code, fromDeepLink) {
    var std = state.map.byStandard[code];
    if (!std) return;
    state.selected = code;
    // reflect selection in the list + the URL (shareable)
    Array.prototype.forEach.call(document.querySelectorAll(".rf-item"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-code") === code ? "true" : "false");
    });
    try {
      history.replaceState(null, "", location.pathname + "?standard=" + encodeURIComponent(code));
    } catch (e) {
      /* ignore */
    }
    renderDetail(std);
    var panel = $("#results");
    if (!fromDeepLink && panel && window.matchMedia("(max-width: 760px)").matches) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (panel) panel.focus();
  }

  function renderDetail(std) {
    $("#rf-empty").hidden = true;
    var detail = $("#rf-detail");
    detail.hidden = false;

    // group assets by category, in CAT_ORDER
    var groups = {};
    std.assets.forEach(function (a) {
      (groups[a.category] = groups[a.category] || []).push(a);
    });
    var cats = Object.keys(groups).sort(function (a, b) {
      var ia = CAT_ORDER.indexOf(a),
        ib = CAT_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    var head =
      '<div class="rf-detail-head"><span class="code">' +
      esc(std.standard) +
      "</span>" +
      (std.domain ? '<span class="domain">' + esc(std.domain) + "</span>" : "") +
      (std.fullText ? '<p class="full">' + esc(std.fullText) + "</p>" : "") +
      "</div>";

    var body = cats
      .map(function (cat) {
        var cards = groups[cat]
          .map(function (a) {
            var via = VIA[a.via] || { label: a.via || "", title: "" };
            return (
              '<a class="rf-card" href="' +
              esc(a.path) +
              '"><span class="rf-via ' +
              esc(a.via) +
              '" title="' +
              esc(via.title) +
              '">' +
              esc(via.label) +
              '</span><span class="title">' +
              esc(a.title) +
              "</span>" +
              (a.audience ? '<span class="rf-aud">' + esc(a.audience) + "</span>" : "") +
              '<span class="arrow" aria-hidden="true">→</span></a>'
            );
          })
          .join("");
        return (
          '<div class="rf-group"><h2>' +
          esc(cat) +
          " · " +
          groups[cat].length +
          '</h2><div class="rf-cards">' +
          cards +
          "</div></div>"
        );
      })
      .join("");

    detail.innerHTML = head + body;
  }
})();

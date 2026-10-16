/* ==========================================================================
 * progress-atlas-map.js — the Learning Atlas's node map (SVG) and its
 * keyboard model. Units run left to right in the order the class learns them;
 * a connection runs from the skill that helps to the skill it helps with.
 *
 * The map is one of two equal views: the text list (progress-atlas-ui.js)
 * says everything the map says. Node meaning is carried by shape and a word,
 * never by colour alone. Labels are drawn in ONE language at a time (a toggle
 * switches it) because an SVG node has no room for two.
 *
 * Keyboard: the map is a single tab stop. Arrow keys move between skills
 * (left/right across units, up/down inside one), Home/End jump to the first
 * and last skill, Enter or Space opens a skill's details.
 * ========================================================================== */
(function (root) {
  "use strict";
  var V = root.NTProgressSections;
  var M = root.NTAtlasModel;
  var UI = root.NTAtlasUI;
  if (!V || !M || !UI) return;
  var esc = V.esc;

  var NODE_W = 168;
  var NODE_H = 66;
  var GAP_X = 60;
  var GAP_Y = 20;
  var PAD = 20;
  var HEAD = 36;
  var LINE_CHARS = 17;
  var LINE_H = 13;

  function pos(node) {
    return { x: PAD + node.col * (NODE_W + GAP_X), y: PAD + HEAD + node.row * (NODE_H + GAP_Y) };
  }

  /** Words onto at most three lines of LINE_CHARS; the full name is in aria-label. */
  function wrap(text) {
    var lines = [""];
    String(text)
      .split(/\s+/)
      .forEach(function (w) {
        var cur = lines[lines.length - 1];
        if (!cur) lines[lines.length - 1] = w;
        else if ((cur + " " + w).length <= LINE_CHARS) lines[lines.length - 1] = cur + " " + w;
        else lines.push(w);
      });
    return lines.slice(0, 3);
  }

  function edgePath(a, b) {
    var p = pos(a);
    var q = pos(b);
    var y1 = p.y + NODE_H / 2;
    var y2 = q.y + NODE_H / 2;
    if (a.col === b.col) {
      var x = p.x + NODE_W;
      return (
        "M" +
        x +
        " " +
        y1 +
        " C" +
        (x + 46) +
        " " +
        y1 +
        " " +
        (x + 46) +
        " " +
        y2 +
        " " +
        x +
        " " +
        y2
      );
    }
    var forward = a.col < b.col;
    var x1 = forward ? p.x + NODE_W : p.x;
    var x2 = forward ? q.x : q.x + NODE_W;
    var dx = Math.max(40, Math.abs(x2 - x1) / 2);
    var s = forward ? 1 : -1;
    return (
      "M" +
      x1 +
      " " +
      y1 +
      " C" +
      (x1 + s * dx) +
      " " +
      y1 +
      " " +
      (x2 - s * dx) +
      " " +
      y2 +
      " " +
      x2 +
      " " +
      y2
    );
  }

  function nodeLabel(st, lang) {
    var n = st.node;
    var s = UI.STATE[st.state];
    return (
      (lang === "es" ? n.es : n.en) +
      ". " +
      (lang === "es" ? s.es : s.en) +
      (st.due ? (lang === "es" ? ". Hora de repasar" : ". Time to revisit") : "")
    );
  }

  function mapHtml(vm, sel, lang) {
    var w = PAD * 2 + vm.graph.units.length * NODE_W + (vm.graph.units.length - 1) * GAP_X;
    var h = PAD * 2 + HEAD + vm.graph.maxRows * (NODE_H + GAP_Y);
    var heads = vm.graph.units
      .map(function (u, i) {
        return (
          '<text class="at-unit-label" x="' +
          (PAD + i * (NODE_W + GAP_X)) +
          '" y="' +
          (PAD + 14) +
          '">' +
          esc(lang === "es" ? u.es : u.en) +
          "</text>"
        );
      })
      .join("");
    var edges = vm.graph.edges
      .map(function (e) {
        var a = vm.graph.byCode[e.from];
        var b = vm.graph.byCode[e.to];
        var cls = "at-edge-line k-" + e.strength;
        if (sel === e.to) cls += " is-in";
        if (sel === e.from) cls += " is-out";
        return (
          '<path class="' +
          cls +
          '" data-from="' +
          esc(e.from) +
          '" data-to="' +
          esc(e.to) +
          '" d="' +
          edgePath(a, b) +
          '" marker-end="url(#at-arrow)"><title>' +
          esc(
            lang === "es" ? a.es + " → " + b.es + ": " + e.es : a.en + " → " + b.en + ": " + e.en,
          ) +
          "</title></path>"
        );
      })
      .join("");
    var nodes = vm.statuses
      .map(function (st) {
        var n = st.node;
        var p = pos(n);
        var text = wrap(lang === "es" ? n.es : n.en)
          .map(function (line, i) {
            return (
              '<text class="at-node-name" x="36" y="' +
              (19 + i * LINE_H) +
              '">' +
              esc(line) +
              "</text>"
            );
          })
          .join("");
        var stateWord = lang === "es" ? UI.STATE[st.state].es : UI.STATE[st.state].en;
        return (
          '<g class="at-node s-' +
          st.state +
          (st.due ? " is-due" : "") +
          (sel === n.code ? " is-selected" : "") +
          '" role="button" tabindex="' +
          (sel === n.code ? "0" : "-1") +
          '" aria-pressed="' +
          (sel === n.code) +
          '" aria-label="' +
          esc(nodeLabel(st, lang)) +
          '" data-code="' +
          esc(n.code) +
          '" data-fk="n-' +
          esc(n.code) +
          '" transform="translate(' +
          p.x +
          " " +
          p.y +
          ')"><rect class="at-node-box" width="' +
          NODE_W +
          '" height="' +
          NODE_H +
          '" rx="12"/><g class="at-node-ico" transform="translate(10 10) scale(1.4)">' +
          UI.ICON[st.state] +
          "</g>" +
          text +
          '<text class="at-node-state" x="36" y="' +
          (NODE_H - 9) +
          '">' +
          esc(stateWord) +
          "</text>" +
          (st.due
            ? '<g class="at-node-due" transform="translate(' +
              (NODE_W - 24) +
              ' 6) scale(1.1)">' +
              UI.ICON.clock +
              "</g>"
            : "") +
          "</g>"
        );
      })
      .join("");
    return (
      '<svg class="at-map" viewBox="0 0 ' +
      w +
      " " +
      h +
      '" width="' +
      w +
      '" height="' +
      h +
      '" role="group" aria-label="' +
      esc(
        "Learning map. Arrow keys move between skills. Enter opens one. · Mapa de aprendizaje. Las flechas te mueven entre habilidades. Enter abre una.",
      ) +
      '"><defs><marker id="at-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10z" class="at-arrow"/></marker></defs>' +
      heads +
      edges +
      nodes +
      "</svg>"
    );
  }

  /** The skill an arrow key lands on, or null. */
  function neighbor(graph, node, key) {
    var nodes = graph.nodes;
    if (key === "Home") return nodes[0];
    if (key === "End") return nodes[nodes.length - 1];
    if (key === "ArrowUp" || key === "ArrowDown") {
      var dr = key === "ArrowUp" ? -1 : 1;
      return (
        nodes.filter(function (n) {
          return n.col === node.col && n.row === node.row + dr;
        })[0] || null
      );
    }
    var dc = key === "ArrowLeft" ? -1 : 1;
    for (var c = node.col + dc; c >= 0 && c < graph.units.length; c += dc) {
      var inCol = nodes.filter(function (n) {
        return n.col === c;
      });
      if (inCol.length) {
        inCol.sort(function (a, b) {
          return Math.abs(a.row - node.row) - Math.abs(b.row - node.row) || a.row - b.row;
        });
        return inCol[0];
      }
    }
    return null;
  }

  root.NTAtlasMap = {
    mapHtml: mapHtml,
    neighbor: neighbor,
    wrap: wrap,
    NODE_W: NODE_W,
    NODE_H: NODE_H,
  };
})(typeof window !== "undefined" ? window : globalThis);

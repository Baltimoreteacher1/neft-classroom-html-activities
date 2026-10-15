/* EWL.SketchGrid — the accessible snap-to-grid canvas used by the Sketch compiler.
 *
 * Pointer: press a cell to move the cursor there and apply the current tool.
 * Keyboard: arrow keys move the cursor, Enter or Space applies the tool, Delete erases, Home/End jump along the row.
 * Everything snaps to grid cells, so nothing is freehand. The drawing is rebuilt with EWL.svg from the model on
 * every change, and each state is described in words in a status line for screen readers.
 */
(function (root) {
  "use strict";
  var EWL = root.EWL;
  if (!EWL || !EWL.SketchModel) return;
  var M = EWL.SketchModel;
  var LEFT = 96;
  var TOP = 30;
  var DIM = {
    tape: { cell: 44, row: 46, bracketRow: 66 },
    nline: { cell: 40, row: 120 },
    dnline: { cell: 44, row: 92 },
  };

  function create(opts) {
    var svg = EWL.svg;
    var h = EWL.h;
    var t = opts.t;
    var story = opts.story;
    var kind = story.kind;
    var dim = DIM[kind];
    var g = M.GRID[kind];
    function rowY(r) {
      if (kind !== "tape") return TOP + r * dim.row;
      return TOP + r * dim.row;
    }
    function rowH(r) {
      return kind === "tape" && r === g.bracketRow ? dim.bracketRow : dim.row;
    }
    var width = LEFT + g.cols * dim.cell + 12;
    var height = rowY(g.rows - 1) + rowH(g.rows - 1) + 8;
    var root1 = svg("svg", {
      class: "sk-svg",
      width: width,
      height: height,
      viewBox: "0 0 " + width + " " + height,
      role: "application",
      tabindex: "0",
      "aria-roledescription": t("diagram builder", "constructor de diagramas"),
      "aria-label": t(
        "Diagram grid. Arrow keys move, Enter places the chosen tool, Delete erases.",
        "Cuadrícula del diagrama. Las flechas mueven, Enter coloca la herramienta elegida, Suprimir borra.",
      ),
    });
    var wrap = h("div", { class: "sk-gridwrap" }, root1);

    function describe(r, c) {
      var d = opts.getD();
      var cell = M.cellAt(d, r, c);
      var where =
        kind === "tape"
          ? t("Row ", "Fila ") + (r + 1) + t(", column ", ", columna ") + (c + 1)
          : kind === "nline"
            ? t("Position ", "Posición ") + EWL.SketchCheck.axisValue(story, c).mixed()
            : (r ? t("Bottom line", "Línea de abajo") : t("Top line", "Línea de arriba")) +
              t(", column ", ", columna ") +
              (c + 1);
      if (!cell) return where + t(": empty", ": vacío");
      var what =
        cell.t === "block"
          ? t("block", "bloque") + (cell.shade ? t(", shaded", ", sombreado") : "")
          : cell.t === "tick"
            ? t("tick", "marca")
            : t("bracket", "corchete");
      return (
        where + ": " + what + (cell.label ? t(", labelled ", ", con etiqueta ") + cell.label : "")
      );
    }
    function label(x, y, text, cls) {
      return svg("text", { x: x, y: y, class: cls || "sk-label", "text-anchor": "middle" }, text);
    }

    function drawTape(d, cur) {
      var f = M.facts(d);
      var out = [
        svg(
          "defs",
          null,
          svg(
            "pattern",
            {
              id: "sk-hatch",
              width: 8,
              height: 8,
              patternUnits: "userSpaceOnUse",
              patternTransform: "rotate(45)",
            },
            svg("rect", { width: 8, height: 8, class: "sk-hatch-bg" }),
            svg("line", { x1: 0, y1: 0, x2: 0, y2: 8, class: "sk-hatch-line" }),
          ),
        ),
      ];
      var lo = 99;
      var hi = -1;
      for (var r = 0; r < g.rows; r++) {
        out.push(
          svg(
            "text",
            { x: 8, y: rowY(r) + rowH(r) / 2 + 5, class: "sk-rowname" },
            d.names[r] || (r < g.bracketRow ? "" : ""),
          ),
        );
        for (var c = 0; c < g.cols; c++) {
          var x = LEFT + c * dim.cell;
          var cell = M.cellAt(d, r, c);
          out.push(
            svg("rect", {
              x: x,
              y: rowY(r),
              width: dim.cell,
              height: rowH(r),
              class: "sk-cell",
              "data-r": r,
              "data-c": c,
            }),
          );
          if (cell && cell.t === "block") {
            lo = Math.min(lo, c);
            hi = Math.max(hi, c);
            out.push(
              svg("rect", {
                x: x + 1,
                y: rowY(r) + 4,
                width: dim.cell - 2,
                height: dim.cell - 8,
                class: "sk-block",
                "data-shade": cell.shade ? "yes" : "no",
                fill: cell.shade ? "url(#sk-hatch)" : null,
              }),
            );
            if (cell.label)
              out.push(
                label(x + dim.cell / 2, rowY(r) + dim.cell / 2 + 5, cell.label, "sk-blocklabel"),
              );
          }
        }
      }
      var br = f.bracket;
      if (br) {
        var x0 = LEFT + (hi >= 0 ? lo : br.c) * dim.cell + 2;
        var x1 = LEFT + (hi >= 0 ? hi + 1 : br.c + 1) * dim.cell - 2;
        var y = rowY(g.bracketRow) + 8;
        out.push(
          svg("path", {
            d:
              "M" +
              x0 +
              " " +
              y +
              " v10 H" +
              x1 +
              " v-10 M" +
              (x0 + x1) / 2 +
              " " +
              (y + 10) +
              " v8",
            class: "sk-bracket",
            fill: "none",
          }),
        );
        if (br.label) out.push(label((x0 + x1) / 2, y + 38, br.label, "sk-blocklabel"));
      }
      var bc = M.cellAt(d, g.bracketRow, cur.c);
      void bc;
      return out;
    }

    function drawLines(d) {
      var out = [];
      var rows = kind === "nline" ? [0] : [0, 1];
      rows.forEach(function (r) {
        var y = rowY(r) + dim.row / 2;
        out.push(svg("text", { x: 8, y: y + 5, class: "sk-rowname" }, d.names[r] || ""));
        out.push(
          svg("line", { x1: LEFT, y1: y, x2: LEFT + g.cols * dim.cell, y2: y, class: "sk-axis" }),
        );
        for (var c = 0; c < g.cols; c++) {
          var x = LEFT + c * dim.cell + dim.cell / 2;
          var whole = kind === "nline" ? EWL.SketchCheck.axisValue(story, c).isInt() : true;
          out.push(
            svg("rect", {
              x: LEFT + c * dim.cell,
              y: rowY(r),
              width: dim.cell,
              height: dim.row,
              class: "sk-cell",
              "data-r": r,
              "data-c": c,
            }),
          );
          out.push(
            svg("line", {
              x1: x,
              y1: y - (whole ? 8 : 4),
              x2: x,
              y2: y + (whole ? 8 : 4),
              class: "sk-minor",
            }),
          );
          if (kind === "nline" && whole)
            out.push(
              label(
                x,
                y + 28,
                EWL.SketchCheck.axisValue(story, c).frac().replace("-", "−"),
                "sk-axisnum",
              ),
            );
          var cell = M.cellAt(d, r, c);
          if (cell) {
            out.push(svg("line", { x1: x, y1: y - 22, x2: x, y2: y + 22, class: "sk-tick" }));
            out.push(svg("circle", { cx: x, cy: y, r: 7, class: "sk-dot" }));
            if (cell.label)
              out.push(
                label(
                  x,
                  r === 1 && kind === "dnline" ? y + 40 : y - 30,
                  cell.label,
                  "sk-blocklabel",
                ),
              );
          }
        }
      });
      return out;
    }

    function draw() {
      var d = opts.getD();
      var cur = opts.getCursor();
      var parts = kind === "tape" ? drawTape(d, cur) : drawLines(d);
      root1.replaceChildren.apply(root1, parts);
      var cy = rowY(cur.r);
      var chh = kind === "tape" ? rowH(cur.r) : dim.row;
      var ring = svg("rect", {
        x: LEFT + cur.c * dim.cell + 1.5,
        y: cy + 1.5,
        width: dim.cell - 3,
        height: chh - 3,
        class: "sk-cursor",
        "data-cursor": "",
      });
      root1.appendChild(ring);
      return ring;
    }

    var ring = null;
    function redraw(announce) {
      ring = draw();
      var cur = opts.getCursor();
      if (announce) opts.status(describe(cur.r, cur.c));
      if (ring.scrollIntoView && document.activeElement === root1)
        ring.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    root1.addEventListener("keydown", function (e) {
      var cur = opts.getCursor();
      var r = cur.r;
      var c = cur.c;
      var k = e.key;
      if (k === "ArrowRight") c = Math.min(g.cols - 1, c + 1);
      else if (k === "ArrowLeft") c = Math.max(0, c - 1);
      else if (k === "ArrowDown") r = Math.min(g.rows - 1, r + 1);
      else if (k === "ArrowUp") r = Math.max(0, r - 1);
      else if (k === "Home") c = 0;
      else if (k === "End") c = g.cols - 1;
      else if (k === "Enter" || k === " ") {
        e.preventDefault();
        opts.apply(r, c);
        return;
      } else if (k === "Delete" || k === "Backspace") {
        e.preventDefault();
        opts.erase(r, c);
        return;
      } else return;
      e.preventDefault();
      opts.setCursor(r, c);
      redraw(true);
    });
    root1.addEventListener("pointerdown", function (e) {
      var rect = root1.getBoundingClientRect();
      var x = ((e.clientX - rect.left) * width) / rect.width;
      var y = ((e.clientY - rect.top) * height) / rect.height;
      var c = Math.floor((x - LEFT) / dim.cell);
      var r = -1;
      for (var i = 0; i < g.rows; i++) if (y >= rowY(i) && y < rowY(i) + rowH(i)) r = i;
      if (c < 0 || c >= g.cols || r < 0) {
        if (x < LEFT && r >= 0 && opts.nameRow) opts.nameRow(r);
        return;
      }
      e.preventDefault();
      root1.focus();
      opts.setCursor(r, c);
      opts.apply(r, c);
    });
    return {
      el: wrap,
      svg: root1,
      redraw: redraw,
      describe: describe,
      focus: function () {
        root1.focus();
      },
    };
  }
  EWL.SketchGrid = { create: create };
})(typeof window !== "undefined" ? window : globalThis);

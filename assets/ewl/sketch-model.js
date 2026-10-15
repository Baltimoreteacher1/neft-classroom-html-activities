/* EWL.SketchModel — the diagram a student builds on a snap-to-grid canvas, as plain data (no DOM).
 *
 *   tape:   rows 0-2 are tape rows of unit blocks; row 3 is the bracket row.   cols 0-11
 *   nline:  one number line; a tick sits on a grid column; the story's axis says what each column is worth
 *   dnline: two aligned lines (row 0 above, row 1 below); a tick pair shares a column
 *
 *   d = EWL.SketchModel.create("tape")
 *   EWL.SketchModel.place(d, tool, r, c)       -> true when something changed (a toggle; labels are set separately)
 *   EWL.SketchModel.setLabel(d, tool, r, c, text)
 *   EWL.SketchModel.facts(d)                   -> what the diagram says: lanes / bracket / ticks, ready for checking
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var GRID = {
    tape: { rows: 4, cols: 12, bracketRow: 3 },
    nline: { rows: 1, cols: 21 },
    dnline: { rows: 2, cols: 13 },
  };
  var TOOLS = {
    tape: ["block", "shade", "labelBlock", "nameRow", "bracket", "erase"],
    nline: ["tick", "labelTick", "nameRow", "erase"],
    dnline: ["tick", "labelTick", "nameRow", "erase"],
  };
  var MAX_LABEL = 12;

  function key(r, c) {
    return r + "," + c;
  }
  function create(kind) {
    if (!GRID[kind]) throw new RangeError("SketchModel: unknown kind " + kind);
    return { kind: kind, cells: {}, names: {} };
  }
  function clone(d) {
    return JSON.parse(JSON.stringify(d));
  }
  function inGrid(d, r, c) {
    var g = GRID[d.kind];
    return (
      Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < g.rows && c < g.cols
    );
  }
  function clean(text) {
    return String(text == null ? "" : text)
      .replace(/[^\w\s?.,/%$+\-−×÷]/g, "")
      .trim()
      .slice(0, MAX_LABEL);
  }

  /** Toggle-style placement. Returns false when the tool does not apply to that cell. */
  function place(d, tool, r, c) {
    if (!inGrid(d, r, c)) return false;
    var k = key(r, c);
    var cell = d.cells[k];
    if (d.kind === "tape") {
      var br = GRID.tape.bracketRow;
      if (tool === "block" && r < br) {
        if (cell) delete d.cells[k];
        else d.cells[k] = { t: "block", shade: false, label: "" };
        return true;
      }
      if (tool === "shade" && cell && cell.t === "block") {
        cell.shade = !cell.shade;
        return true;
      }
      if (tool === "bracket" && r === br) {
        if (cell) delete d.cells[k];
        else {
          Object.keys(d.cells).forEach(function (x) {
            if (d.cells[x].t === "bracket") delete d.cells[x];
          });
          d.cells[k] = { t: "bracket", label: "" };
        }
        return true;
      }
    } else if (tool === "tick") {
      if (cell) delete d.cells[k];
      else d.cells[k] = { t: "tick", label: "" };
      return true;
    }
    if (tool === "erase" && cell) {
      delete d.cells[k];
      return true;
    }
    return false;
  }
  function setLabel(d, tool, r, c, text) {
    var cell = d.cells[key(r, c)];
    if (tool === "nameRow") {
      if (r < 0 || r >= GRID[d.kind].rows) return false;
      var n = clean(text);
      if (n) d.names[r] = n;
      else delete d.names[r];
      return true;
    }
    if (!cell || (tool === "labelBlock" && cell.t !== "block" && cell.t !== "bracket"))
      return false;
    if (tool === "labelTick" && cell.t !== "tick") return false;
    cell.label = clean(text);
    return true;
  }
  function cellAt(d, r, c) {
    return d.cells[key(r, c)] || null;
  }

  /** What the diagram says, independent of how it was drawn. */
  function facts(d) {
    var f = { kind: d.kind, lanes: [], bracket: null, ticks: [], names: d.names };
    var cells = Object.keys(d.cells).map(function (k) {
      var p = k.split(",");
      return Object.assign({ r: Number(p[0]), c: Number(p[1]) }, d.cells[k]);
    });
    if (d.kind === "tape") {
      var rows = {};
      cells.forEach(function (x) {
        if (x.t === "bracket") f.bracket = { label: x.label, c: x.c };
        else (rows[x.r] = rows[x.r] || []).push(x);
      });
      Object.keys(rows)
        .map(Number)
        .sort(function (a, b) {
          return a - b;
        })
        .forEach(function (r) {
          var bl = rows[r].sort(function (a, b) {
            return a.c - b.c;
          });
          f.lanes.push({
            row: r,
            name: d.names[r] || "",
            parts: bl.length,
            contiguous: bl[bl.length - 1].c - bl[0].c === bl.length - 1,
            shaded: bl.filter(function (b) {
              return b.shade;
            }).length,
            labels: bl.map(function (b) {
              return b.label;
            }),
          });
        });
    } else {
      f.ticks = cells
        .filter(function (x) {
          return x.t === "tick";
        })
        .sort(function (a, b) {
          return a.c - b.c || a.r - b.r;
        });
    }
    return f;
  }

  EWL.SketchModel = {
    GRID: GRID,
    TOOLS: TOOLS,
    MAX_LABEL: MAX_LABEL,
    create: create,
    clone: clone,
    place: place,
    setLabel: setLabel,
    cellAt: cellAt,
    facts: facts,
    key: key,
  };
})(typeof window !== "undefined" ? window : globalThis);

/* EWL.LabFigure — the small SVG model beside each experiment.
 *
 *   LabFigure.draw(inv, values, alt) -> <svg>   values: the env from EWL.LabSim.run; alt: text alternative for the picture
 *
 * Kinds (inv.model.kind): bars ratio-bars fraction-bars box dots balance-beam triangle rect-split.
 * Meaning is never colour alone: every bar and part carries a text label and a value, and parts use a hatch or a
 * different shape as well as a different colour. Numbers go through Rat.num() only to place things on the page.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var S = function (_tag, _attrs) {
    return EWL.svg.apply(null, arguments);
  };
  var W = 360;

  function n(values, id) {
    var v = typeof id === "string" ? values[id] : EWL.Rat.parse(id);
    return v ? v.num() : 0;
  }
  function label(x, y, text, opts) {
    var a = Object.assign(
      { x: x, y: y, "font-size": 13, fill: "currentColor", "text-anchor": "start" },
      opts || {},
    );
    return S("text", a, text);
  }
  function fmt(values, id, kind) {
    return EWL.LabExpr.fmt(values[id], kind || "num");
  }
  function root_(h, alt) {
    return S(
      "svg",
      { viewBox: "0 0 " + W + " " + h, class: "ewl-fig lab-fig", role: "img", "aria-label": alt },
      S("title", {}, alt),
      S(
        "defs",
        {},
        S(
          "pattern",
          {
            id: "lab-hatch",
            width: 6,
            height: 6,
            patternUnits: "userSpaceOnUse",
            patternTransform: "rotate(45)",
          },
          S("rect", { width: 6, height: 6, fill: "var(--ewl-b)", opacity: 0.25 }),
          S("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "var(--ewl-b)", "stroke-width": 2 }),
        ),
      ),
    );
  }

  var DRAW = {
    bars: function (inv, v, alt) {
      var m = inv.model;
      var max = Math.max(n(v, m.max) || 1, 0.0001);
      var svg = root_(24 + m.bars.length * 56, alt);
      m.bars.forEach(function (b, i) {
        var y = 14 + i * 56;
        var w = Math.max(2, (n(v, b.value) / max) * (W - 40));
        svg.appendChild(label(10, y + 12, EWL.t(b.label, b.labelEs), { "font-weight": 700 }));
        svg.appendChild(
          S("rect", {
            x: 10,
            y: y + 18,
            width: w,
            height: 22,
            rx: 4,
            fill: i % 2 ? "url(#lab-hatch)" : "var(--ewl-a)",
            stroke: i % 2 ? "var(--ewl-b)" : "var(--ewl-a)",
            "stroke-width": 2,
          }),
        );
        svg.appendChild(
          label(w > W - 130 ? 4 + w : 16 + w, y + 34, fmt(v, b.value, b.fmt), {
            "font-weight": 700,
            "text-anchor": w > W - 130 ? "end" : "start",
            fill: w > W - 130 ? "#fff" : "currentColor",
          }),
        );
      });
      return svg;
    },
    "ratio-bars": function (inv, v, alt) {
      var m = inv.model;
      var svg = root_(160, alt);
      [
        [m.before, EWL.t("Before", "Antes"), 12],
        [m.after, EWL.t("After", "Después"), 88],
      ].forEach(function (r) {
        var a = n(v, r[0][0]);
        var b = n(v, r[0][1]);
        var tot = a + b || 1;
        var wa = (a / tot) * (W - 24);
        svg.appendChild(
          label(12, r[2] + 12, r[1] + ": " + fmt(v, r[0][0]) + " : " + fmt(v, r[0][1]), {
            "font-weight": 700,
          }),
        );
        svg.appendChild(
          S("rect", {
            x: 12,
            y: r[2] + 20,
            width: wa,
            height: 30,
            fill: "var(--ewl-a)",
            stroke: "var(--ewl-a)",
            "stroke-width": 2,
          }),
        );
        svg.appendChild(
          S("rect", {
            x: 12 + wa,
            y: r[2] + 20,
            width: W - 24 - wa,
            height: 30,
            fill: "url(#lab-hatch)",
            stroke: "var(--ewl-b)",
            "stroke-width": 2,
          }),
        );
        svg.appendChild(
          label(18, r[2] + 40, Math.round((a / tot) * 100) + "%", {
            fill: "#fff",
            "font-weight": 700,
          }),
        );
        svg.appendChild(
          label(W - 18, r[2] + 40, Math.round((b / tot) * 100) + "%", {
            "text-anchor": "end",
            "font-weight": 700,
          }),
        );
      });
      return svg;
    },
    "fraction-bars": function (inv, v, alt) {
      var m = inv.model;
      var svg = root_(150, alt);
      [
        [m.a, "A", 14],
        [m.b, "B", 82],
      ].forEach(function (f) {
        var num = Math.min(n(v, f[0][0]), 12);
        var den = Math.max(1, Math.min(n(v, f[0][1]), 12));
        svg.appendChild(
          label(
            12,
            f[2] + 12,
            EWL.t("Fraction ", "Fracción ") + f[1] + ": " + fmt(v, f[0][0]) + "/" + fmt(v, f[0][1]),
            { "font-weight": 700 },
          ),
        );
        var cw = (W - 24) / den;
        for (var i = 0; i < den; i++)
          svg.appendChild(
            S("rect", {
              x: 12 + i * cw,
              y: f[2] + 20,
              width: cw,
              height: 36,
              fill: i < num ? (f[1] === "A" ? "var(--ewl-a)" : "url(#lab-hatch)") : "none",
              stroke: "currentColor",
              "stroke-width": 1.5,
            }),
          );
      });
      return svg;
    },
  };

  var helpers = { S: S, W: W, n: n, label: label, fmt: fmt, root_: root_ };
  EWL.LabFigure = {
    helpers: helpers,
    add: function (more) {
      Object.keys(more).forEach(function (k) {
        DRAW[k] = more[k];
      });
      EWL.LabFigure.kinds = Object.keys(DRAW);
    },
    draw: function (inv, values, alt) {
      var f = DRAW[inv.model.kind];
      if (!f) throw new RangeError("LabFigure: unknown model " + inv.model.kind);
      return f(inv, values, alt);
    },
    kinds: Object.keys(DRAW),
  };
})(typeof window !== "undefined" ? window : globalThis);

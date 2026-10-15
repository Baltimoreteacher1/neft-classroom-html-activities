/* Math Reality Lab figures, part 2: box, dots, balance-beam, triangle, rect-split. Registered into EWL.LabFigure (lab-figure.js).
 * Same rules as part 1: a text label and a value on every part, hatch or shape as well as colour, Rat.num() only for placement.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var H = EWL.LabFigure.helpers;
  var S = H.S;
  var W = H.W;
  var n = H.n;
  var label = H.label;
  var fmt = H.fmt;
  var root_ = H.root_;

  EWL.LabFigure.add({
    box: function (inv, v, alt) {
      var m = inv.model;
      var svg = root_(200, alt);
      var d0 = m.dims.map(function (d) {
        return n(v, d);
      });
      var d1 = m.scaled.map(function (d) {
        return n(v, d);
      });
      var span = Math.max(d1[0] + d1[1] * 0.5 + d0[0] + d0[1] * 0.5, 1);
      var unit = Math.min(
        (W - 40) / span,
        150 / Math.max(d1[2] + d1[1] * 0.5, d0[2] + d0[1] * 0.5, 1),
      );
      function box(x0, ds, name, vol) {
        var l = ds[0] * unit;
        var w = ds[1] * unit * 0.5;
        var h = ds[2] * unit;
        var y0 = 170;
        svg.appendChild(
          S("rect", {
            x: x0,
            y: y0 - h,
            width: l,
            height: h,
            fill: "var(--ewl-a)",
            opacity: 0.35,
            stroke: "var(--ewl-a)",
            "stroke-width": 2,
          }),
        );
        svg.appendChild(
          S("polygon", {
            points: [x0, y0 - h, x0 + w, y0 - h - w, x0 + l + w, y0 - h - w, x0 + l, y0 - h].join(
              " ",
            ),
            fill: "url(#lab-hatch)",
            stroke: "var(--ewl-b)",
            "stroke-width": 2,
          }),
        );
        svg.appendChild(
          S("polygon", {
            points: [x0 + l, y0 - h, x0 + l + w, y0 - h - w, x0 + l + w, y0 - w, x0 + l, y0].join(
              " ",
            ),
            fill: "var(--ewl-a)",
            opacity: 0.2,
            stroke: "var(--ewl-a)",
            "stroke-width": 2,
          }),
        );
        svg.appendChild(
          label(x0, y0 + 20, name + ": " + vol, { "font-weight": 700, "font-size": 12 }),
        );
      }
      box(14, d0, EWL.t("First box", "Primera caja"), fmt(v, "v0"));
      box(20 + d0[0] * unit + d0[1] * unit * 0.5, d1, EWL.t("New box", "Nueva caja"), fmt(v, "v1"));
      return svg;
    },
    dots: function (inv, v, alt) {
      var m = inv.model;
      var svg = root_(170, alt);
      var extra = n(v, m.extra);
      var hi = Math.max(14, Math.ceil(extra / 10) * 10 + 2);
      var x = function (val) {
        return 20 + (val / hi) * (W - 40);
      };
      svg.appendChild(
        S("line", {
          x1: 20,
          y1: 90,
          x2: W - 20,
          y2: 90,
          stroke: "currentColor",
          "stroke-width": 2,
        }),
      );
      var tick = hi > 40 ? 20 : hi > 20 ? 5 : 2;
      for (var t = 0; t <= hi; t += tick) {
        svg.appendChild(S("line", { x1: x(t), y1: 86, x2: x(t), y2: 94, stroke: "currentColor" }));
        svg.appendChild(label(x(t), 108, String(t), { "text-anchor": "middle", "font-size": 11 }));
      }
      m.values.forEach(function (val, i) {
        svg.appendChild(
          S("circle", {
            cx: x(val),
            cy: 80 - (i % 2) * 12,
            r: 6,
            fill: "var(--ewl-a)",
            stroke: "var(--ewl-a)",
          }),
        );
      });
      svg.appendChild(
        S("rect", {
          x: x(extra) - 6,
          y: 74,
          width: 12,
          height: 12,
          fill: "url(#lab-hatch)",
          stroke: "var(--ewl-b)",
          "stroke-width": 2,
        }),
      );
      var mean = x(n(v, m.mean));
      var med = x(n(v, m.median));
      svg.appendChild(
        S("polygon", {
          points: [mean, 92, mean - 7, 106, mean + 7, 106].join(" "),
          fill: "var(--ewl-c)",
        }),
      );
      svg.appendChild(
        S("polygon", {
          points: [med, 120, med - 7, 132, med, 144, med + 7, 132].join(" "),
          fill: "none",
          stroke: "currentColor",
          "stroke-width": 2,
        }),
      );
      svg.appendChild(
        label(
          14,
          24,
          "● " +
            EWL.t("students", "estudiantes") +
            "   ▨ " +
            EWL.t("far-away value", "valor lejano"),
          { "font-size": 12 },
        ),
      );
      svg.appendChild(
        label(
          14,
          44,
          "▲ " +
            EWL.t("mean", "media") +
            " " +
            fmt(v, m.mean, "dec2") +
            "   ◇ " +
            EWL.t("median", "mediana") +
            " " +
            fmt(v, m.median, "dec2"),
          { "font-size": 12, "font-weight": 700 },
        ),
      );
      return svg;
    },
    "balance-beam": function (inv, v, alt) {
      var m = inv.model;
      var svg = root_(180, alt);
      var l = n(v, m.left);
      var r = n(v, m.right);
      var big = Math.max(Math.abs(l), Math.abs(r), 1);
      var angle = Math.max(-16, Math.min(16, ((r - l) / big) * 16));
      svg.appendChild(
        S("polygon", {
          points: "180,70 160,150 200,150",
          fill: "var(--ewl-a)",
          opacity: 0.5,
          stroke: "var(--ewl-a)",
          "stroke-width": 2,
        }),
      );
      var beam = S("g", { transform: "rotate(" + angle + " 180 70)" });
      beam.appendChild(
        S("line", {
          x1: 40,
          y1: 70,
          x2: 320,
          y2: 70,
          stroke: "currentColor",
          "stroke-width": 5,
          "stroke-linecap": "round",
        }),
      );
      [
        [40, m.left, EWL.t("Left", "Izquierda"), false],
        [320, m.right, EWL.t("Right", "Derecha"), true],
      ].forEach(function (p) {
        beam.appendChild(
          S("line", {
            x1: p[0],
            y1: 70,
            x2: p[0],
            y2: 100,
            stroke: "currentColor",
            "stroke-width": 2,
          }),
        );
        beam.appendChild(
          S("rect", {
            x: p[0] - 34,
            y: 100,
            width: 68,
            height: 34,
            rx: 6,
            fill: p[3] ? "url(#lab-hatch)" : "var(--ewl-a)",
            stroke: "currentColor",
            "stroke-width": 2,
          }),
        );
        beam.appendChild(
          S(
            "text",
            {
              x: p[0],
              y: 122,
              "text-anchor": "middle",
              "font-size": 15,
              "font-weight": 700,
              fill: p[3] ? "currentColor" : "#fff",
              transform: "rotate(" + -angle + " " + p[0] + " 117)",
            },
            fmt(v, p[1]),
          ),
        );
        beam.appendChild(
          S(
            "text",
            {
              x: p[0],
              y: 152,
              "text-anchor": "middle",
              "font-size": 12,
              transform: "rotate(" + -angle + " " + p[0] + " 148)",
            },
            p[2],
          ),
        );
      });
      svg.appendChild(beam);
      var verdict =
        l === r
          ? EWL.t("Balanced", "Equilibrada")
          : r > l
            ? EWL.t("Tips right", "Se inclina a la derecha")
            : EWL.t("Tips left", "Se inclina a la izquierda");
      svg.appendChild(label(180, 172, verdict, { "text-anchor": "middle", "font-weight": 700 }));
      return svg;
    },
    triangle: function (inv, v, alt) {
      var m = inv.model;
      var svg = root_(210, alt);
      var b = n(v, m.legs[0]);
      var h = n(v, m.legs[1]);
      var k = Math.min(240 / b, 150 / h);
      var x0 = 50;
      var y0 = 180;
      svg.appendChild(
        S("polygon", {
          points: [x0, y0, x0 + b * k, y0, x0, y0 - h * k].join(" "),
          fill: "var(--ewl-a)",
          opacity: 0.2,
          stroke: "var(--ewl-a)",
          "stroke-width": 3,
        }),
      );
      svg.appendChild(
        S("polyline", {
          points: [x0, y0 - 14, x0 + 14, y0 - 14, x0 + 14, y0].join(" "),
          fill: "none",
          stroke: "currentColor",
        }),
      );
      svg.appendChild(
        S("line", {
          x1: x0 + b * k,
          y1: y0,
          x2: x0,
          y2: y0 - h * k,
          stroke: "var(--ewl-b)",
          "stroke-width": 4,
          "stroke-dasharray": "10 5",
        }),
      );
      svg.appendChild(
        label(
          x0 + (b * k) / 2,
          y0 + 20,
          EWL.t("half the base ", "mitad de la base ") + fmt(v, m.legs[0]),
          { "text-anchor": "middle", "font-weight": 700 },
        ),
      );
      svg.appendChild(
        label(x0 - 8, y0 - (h * k) / 2, EWL.t("height ", "altura ") + fmt(v, m.legs[1]), {
          "text-anchor": "end",
          "font-weight": 700,
        }),
      );
      svg.appendChild(
        label(
          x0 + (b * k) / 2 + 8,
          y0 - (h * k) / 2 - 6,
          EWL.t("slant height ", "altura inclinada ") + fmt(v, m.hyp),
          { "font-weight": 700, fill: "var(--ewl-b)" },
        ),
      );
      return svg;
    },
    "rect-split": function (inv, v, alt) {
      var m = inv.model;
      var svg = root_(190, alt);
      var kk = n(v, m.height);
      var a = n(v, m.parts[0]);
      var c = n(v, m.parts[1]);
      var u = Math.min(300 / (a + c), 130 / kk);
      var x0 = 30;
      var y0 = 30;
      svg.appendChild(
        S("rect", {
          x: x0,
          y: y0,
          width: a * u,
          height: kk * u,
          fill: "var(--ewl-a)",
          opacity: 0.45,
          stroke: "var(--ewl-a)",
          "stroke-width": 2,
        }),
      );
      svg.appendChild(
        S("rect", {
          x: x0 + a * u,
          y: y0,
          width: c * u,
          height: kk * u,
          fill: "url(#lab-hatch)",
          stroke: "var(--ewl-b)",
          "stroke-width": 2,
        }),
      );
      svg.appendChild(
        label(
          x0 + (a * u) / 2,
          y0 + (kk * u) / 2 + 5,
          "k·x = " + fmt(v, "k") + "·" + fmt(v, m.parts[0]),
          { "text-anchor": "middle", "font-size": 12, "font-weight": 700 },
        ),
      );
      svg.appendChild(
        label(x0 + a * u + (c * u) / 2, y0 + (kk * u) / 2 + 5, "k·c", {
          "text-anchor": "middle",
          "font-size": 12,
          "font-weight": 700,
        }),
      );
      svg.appendChild(
        label(
          x0 + ((a + c) * u) / 2,
          y0 + kk * u + 20,
          "x + c = " + fmt(v, m.parts[0]) + " + " + fmt(v, m.parts[1]),
          { "text-anchor": "middle", "font-weight": 700 },
        ),
      );
      svg.appendChild(
        label(x0 - 6, y0 + (kk * u) / 2, "k = " + fmt(v, m.height), {
          "text-anchor": "end",
          "font-weight": 700,
        }),
      );
      return svg;
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

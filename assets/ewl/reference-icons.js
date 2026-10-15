/* Pocket Reference pictures: small hand-drawn SVGs for the key ideas, plus one clean generic icon per strand.
 * Drawn on a 64 x 64 grid. Shapes and labels carry the meaning; colour only repeats it.
 *
 *   EWL.Reference.ICONS[key] = { alt, altEs, hand:true|false, draw(S) -> [nodes] }      (S = EWL.svg)
 *   EWL.Reference.icon(key)  -> <svg role="img" aria-label=...> (falls back to the generic number icon)
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var R = (EWL.Reference = EWL.Reference || {});
  var INK = "currentColor";
  var A = "var(--ewl-a, #1e6fa8)";
  var B = "var(--ewl-b, #b45309)";
  var LINE = {
    stroke: INK,
    "stroke-width": 2,
    fill: "none",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };

  function ln(S, x1, y1, x2, y2, extra) {
    return S("line", Object.assign({ x1: x1, y1: y1, x2: x2, y2: y2 }, LINE, extra));
  }
  function tx(S, x, y, s, size) {
    return S(
      "text",
      {
        x: x,
        y: y,
        "text-anchor": "middle",
        "font-size": size || 11,
        fill: INK,
        "font-weight": 700,
      },
      s,
    );
  }
  function poly(S, pts, fill) {
    return S("polygon", Object.assign({ points: pts }, LINE, { fill: fill || "none" }));
  }
  function rect(S, x, y, w, h, fill) {
    return S(
      "rect",
      Object.assign({ x: x, y: y, width: w, height: h }, LINE, { fill: fill || "none" }),
    );
  }
  function dot(S, x, y, filled, r) {
    return S("circle", {
      cx: x,
      cy: y,
      r: r || 4,
      stroke: INK,
      "stroke-width": 2,
      fill: filled ? A : "none",
    });
  }
  function numline(S, y, x0, x1, n) {
    var out = [ln(S, x0, y, x1, y)];
    for (var i = 0; i <= n; i++) {
      var x = x0 + ((x1 - x0) * i) / n;
      out.push(ln(S, x, y - 3, x, y + 3));
    }
    return out;
  }

  var I = {
    ratio: {
      alt: "Three filled circles to two open circles",
      altEs: "Tres círculos llenos por cada dos vacíos",
      draw: function (S) {
        return [
          dot(S, 12, 22, true),
          dot(S, 26, 22, true),
          dot(S, 40, 22, true),
          dot(S, 12, 44, false),
          dot(S, 26, 44, false),
          tx(S, 54, 26, "3:2", 10),
        ];
      },
    },
    "unit-rate": {
      alt: "Double number line: two matching scales side by side",
      altEs: "Recta numérica doble",
      draw: function (S) {
        return numline(S, 22, 8, 56, 4).concat(numline(S, 44, 8, 56, 4), [
          tx(S, 8, 14, "0", 9),
          tx(S, 56, 14, "6", 9),
          tx(S, 8, 58, "0", 9),
          tx(S, 56, 58, "2", 9),
        ]);
      },
    },
    percent: {
      alt: "A 10 by 10 grid with 25 squares shaded",
      altEs: "Una cuadrícula de 10 por 10 con 25 cuadros sombreados",
      draw: function (S) {
        var out = [
          S("rect", { x: 8, y: 8, width: 24, height: 24, fill: A, opacity: 0.55 }),
          S("rect", {
            x: 8,
            y: 8,
            width: 48,
            height: 48,
            stroke: INK,
            "stroke-width": 2,
            fill: "none",
          }),
        ];
        for (var i = 1; i < 10; i++) {
          out.push(
            ln(S, 8 + i * 4.8, 8, 8 + i * 4.8, 56, { "stroke-width": 0.7 }),
            ln(S, 8, 8 + i * 4.8, 56, 8 + i * 4.8, { "stroke-width": 0.7 }),
          );
        }
        return out;
      },
    },
    fraction: {
      alt: "A bar cut into 4 equal parts with 3 shaded",
      altEs: "Una barra en 4 partes iguales con 3 sombreadas",
      draw: function (S) {
        return [
          S("rect", { x: 6, y: 22, width: 36, height: 20, fill: A, opacity: 0.55 }),
          rect(S, 6, 22, 48, 20),
          ln(S, 18, 22, 18, 42),
          ln(S, 30, 22, 30, 42),
          ln(S, 42, 22, 42, 42),
          tx(S, 32, 58, "3/4", 11),
        ];
      },
    },
    mean: {
      alt: "Stacks of dots leveled out to one height",
      altEs: "Pilas de puntos niveladas a una misma altura",
      draw: function (S) {
        var out = [ln(S, 6, 56, 58, 56)];
        [4, 1, 3, 2].forEach(function (n, c) {
          for (var k = 0; k < n; k++) out.push(dot(S, 14 + c * 12, 50 - k * 9, true, 3.5));
        });
        out.push(ln(S, 6, 32, 58, 32, { "stroke-dasharray": "4 3", stroke: B }));
        return out;
      },
    },
    median: {
      alt: "Five bars in order with the middle one marked",
      altEs: "Cinco barras en orden con la del medio marcada",
      draw: function (S) {
        var hs = [10, 18, 26, 34, 44];
        var out = [ln(S, 6, 56, 58, 56)];
        hs.forEach(function (h, i) {
          out.push(
            S("rect", {
              x: 8 + i * 10,
              y: 56 - h,
              width: 8,
              height: h,
              stroke: INK,
              "stroke-width": 2,
              fill: i === 2 ? B : "none",
            }),
          );
        });
        out.push(tx(S, 32, 12, "middle", 9));
        return out;
      },
    },
    histogram: {
      alt: "A histogram: touching bars of different heights",
      altEs: "Un histograma: barras juntas de distintas alturas",
      draw: function (S) {
        var hs = [14, 30, 44, 26, 10];
        var out = [ln(S, 6, 56, 58, 56)];
        hs.forEach(function (h, i) {
          out.push(
            S("rect", {
              x: 8 + i * 10,
              y: 56 - h,
              width: 10,
              height: h,
              stroke: INK,
              "stroke-width": 2,
              fill: A,
              opacity: 0.6,
            }),
          );
        });
        return out;
      },
    },
    boxplot: {
      alt: "A box plot: whiskers, a box and a median line",
      altEs: "Un diagrama de caja: bigotes, caja y línea de la mediana",
      draw: function (S) {
        return [
          numline(S, 54, 6, 58, 6)[0],
          ln(S, 8, 28, 20, 28),
          rect(S, 20, 18, 24, 20, A),
          ln(S, 32, 18, 32, 38),
          ln(S, 44, 28, 56, 28),
          ln(S, 8, 22, 8, 34),
          ln(S, 56, 22, 56, 34),
        ];
      },
    },
    dotplot: {
      alt: "A dot plot: dots stacked above a number line",
      altEs: "Un diagrama de puntos sobre una recta numérica",
      draw: function (S) {
        var out = numline(S, 52, 8, 56, 6);
        [1, 2, 4, 2, 1, 1].forEach(function (n, c) {
          for (var k = 0; k < n; k++) out.push(dot(S, 8 + c * 8, 44 - k * 8, true, 3));
        });
        return out;
      },
    },
    triangle: {
      alt: "A triangle with its height drawn as a dashed line",
      altEs: "Un triángulo con su altura dibujada con línea de rayas",
      draw: function (S) {
        return [
          poly(S, "8,52 56,52 36,12", A),
          ln(S, 36, 12, 36, 52, { "stroke-dasharray": "3 3" }),
          rect(S, 36, 46, 6, 6),
          tx(S, 24, 36, "h", 11),
        ];
      },
    },
    parallelogram: {
      alt: "A parallelogram with its height drawn as a dashed line",
      altEs: "Un paralelogramo con su altura dibujada con línea de rayas",
      draw: function (S) {
        return [
          poly(S, "6,50 40,50 58,14 24,14", A),
          ln(S, 24, 14, 24, 50, { "stroke-dasharray": "3 3" }),
          tx(S, 17, 36, "h", 11),
        ];
      },
    },
    trapezoid: {
      alt: "A trapezoid with two parallel bases",
      altEs: "Un trapecio con dos bases paralelas",
      draw: function (S) {
        return [
          poly(S, "6,50 58,50 46,16 20,16", A),
          tx(S, 33, 11, "b1", 9),
          tx(S, 32, 62, "b2", 9),
        ];
      },
    },
    prism: {
      alt: "A rectangular prism drawn as a box",
      altEs: "Un prisma rectangular dibujado como una caja",
      draw: function (S) {
        return [
          rect(S, 8, 24, 34, 28, A),
          poly(S, "8,24 20,12 54,12 42,24"),
          poly(S, "42,24 54,12 54,40 42,52"),
        ];
      },
    },
    coordinate: {
      alt: "A coordinate plane with one point plotted",
      altEs: "Un plano de coordenadas con un punto marcado",
      draw: function (S) {
        return [
          ln(S, 32, 6, 32, 58),
          ln(S, 6, 32, 58, 32),
          dot(S, 46, 18, true),
          ln(S, 46, 18, 46, 32, { "stroke-dasharray": "3 3" }),
          ln(S, 32, 18, 46, 18, { "stroke-dasharray": "3 3" }),
        ];
      },
    },
    integer: {
      alt: "A number line with negative and positive integers",
      altEs: "Una recta numérica con enteros negativos y positivos",
      draw: function (S) {
        return numline(S, 34, 6, 58, 6).concat([
          tx(S, 32, 52, "0", 11),
          tx(S, 12, 24, "-3", 10),
          tx(S, 52, 24, "3", 10),
          dot(S, 19, 34, true, 3.5),
        ]);
      },
    },
    absolute: {
      alt: "Distance from zero: the same length to -3 and to 3",
      altEs: "Distancia desde cero: la misma longitud hasta -3 y hasta 3",
      draw: function (S) {
        return numline(S, 40, 6, 58, 6).concat([
          S("path", Object.assign({ d: "M12 36 Q22 14 32 36" }, LINE, { stroke: B })),
          S("path", Object.assign({ d: "M32 36 Q42 14 52 36" }, LINE, { stroke: B })),
          tx(S, 32, 58, "0", 11),
        ]);
      },
    },
    exponent: {
      alt: "Two to the power of three",
      altEs: "Dos a la tercera potencia",
      draw: function (S) {
        return [tx(S, 26, 46, "2", 34), tx(S, 48, 26, "3", 20)];
      },
    },
    balance: {
      alt: "A balance scale with equal sides",
      altEs: "Una balanza con los dos lados iguales",
      draw: function (S) {
        return [
          ln(S, 32, 12, 32, 52),
          ln(S, 20, 52, 44, 52),
          ln(S, 10, 20, 54, 20),
          poly(S, "6,36 22,36 14,28"),
          poly(S, "42,36 58,36 50,28"),
          ln(S, 10, 20, 14, 28),
          ln(S, 54, 20, 50, 28),
          tx(S, 32, 8, "=", 11),
        ];
      },
    },
    inequality: {
      alt: "A number line with an open circle and a ray",
      altEs: "Una recta numérica con un círculo vacío y un rayo",
      draw: function (S) {
        return numline(S, 36, 6, 58, 6).concat([
          dot(S, 32, 36, false, 4),
          ln(S, 36, 36, 58, 36, { stroke: B, "stroke-width": 4 }),
          tx(S, 32, 20, "x > 3", 11),
        ]);
      },
    },
    variable: {
      alt: "A box holding an unknown number, written x",
      altEs: "Una caja con un número desconocido, escrito x",
      draw: function (S) {
        return [rect(S, 14, 14, 36, 36, A), tx(S, 32, 40, "x", 24)];
      },
    },
    "factor-tree": {
      alt: "A factor tree: 12 splits into 3 and 4",
      altEs: "Un árbol de factores: 12 se divide en 3 y 4",
      draw: function (S) {
        return [
          ln(S, 32, 18, 18, 38),
          ln(S, 32, 18, 46, 38),
          tx(S, 32, 16, "12", 12),
          dot(S, 18, 46, false, 8),
          tx(S, 18, 50, "3", 10),
          dot(S, 46, 46, false, 8),
          tx(S, 46, 50, "4", 10),
        ];
      },
    },
    "g-stats": {
      alt: "Bars of data",
      altEs: "Barras de datos",
      draw: function (S) {
        return [
          ln(S, 8, 54, 56, 54),
          rect(S, 12, 34, 10, 20, A),
          rect(S, 27, 20, 10, 34, A),
          rect(S, 42, 28, 10, 26, A),
        ];
      },
    },
    "g-ratio": {
      alt: "Two amounts compared",
      altEs: "Dos cantidades comparadas",
      draw: function (S) {
        return [rect(S, 8, 14, 36, 14, A), rect(S, 8, 36, 24, 14, "none"), tx(S, 54, 46, ":", 24)];
      },
    },
    "g-geometry": {
      alt: "A shape",
      altEs: "Una figura",
      draw: function (S) {
        return [poly(S, "10,50 54,50 54,20 32,10 10,20", A)];
      },
    },
    "g-number": {
      alt: "A number line",
      altEs: "Una recta numérica",
      draw: function (S) {
        return numline(S, 34, 6, 58, 8).concat([dot(S, 32, 34, true, 4)]);
      },
    },
    "g-algebra": {
      alt: "An unknown value",
      altEs: "Un valor desconocido",
      draw: function (S) {
        return [rect(S, 10, 18, 44, 28, "none"), tx(S, 32, 40, "a + b", 14)];
      },
    },
    "g-plane": {
      alt: "A grid",
      altEs: "Una cuadrícula",
      draw: function (S) {
        return [
          rect(S, 8, 8, 48, 48),
          ln(S, 24, 8, 24, 56),
          ln(S, 40, 8, 40, 56),
          ln(S, 8, 24, 56, 24),
          ln(S, 8, 40, 56, 40),
        ];
      },
    },
  };
  Object.keys(I).forEach(function (k) {
    I[k].hand = k.indexOf("g-") !== 0;
  });

  R.ICONS = I;
  R.iconKeys = function () {
    return Object.keys(I);
  };
  R.icon = function (key) {
    var d = I[key] || I["g-number"];
    var svg = EWL.svg(
      "svg",
      {
        viewBox: "0 0 64 64",
        width: 64,
        height: 64,
        role: "img",
        "aria-label": EWL.t(d.alt, d.altEs),
        class: "ewlr-icon",
        focusable: "false",
      },
      EWL.svg("title", null, EWL.t(d.alt, d.altEs)),
    );
    d.draw(EWL.svg).forEach(function (n) {
      svg.appendChild(n);
    });
    return svg;
  };
})(typeof window !== "undefined" ? window : globalThis);

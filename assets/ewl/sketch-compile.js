/* EWL.SketchCompile — turns the diagram the student built into the math it represents, step by step.
 *
 *   EWL.SketchCompile.compile(story, d, matches) -> {says:[{en,es}], table:{head,rows}|null, equation:{en,es}|null, solve:[{en,es}]|null}
 *
 * `says` and `table` always describe the student's OWN diagram, so a diagram that does not match the story still
 * compiles to the (different) math it shows. `solve` is only produced when the diagram matches the story, so the
 * answer is never handed over for a diagram that has not earned it.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var R = function () {
    return EWL.Rat;
  };
  function m(en, es) {
    return { en: en, es: es };
  }
  function num(x) {
    return R().parse(x);
  }
  function show(r) {
    return (r.isTerminating() && !r.isInt() ? r.decimal(4).text : r.mixed()).replace("-", "−");
  }
  function nm(l, i) {
    return l.name || "row " + (i + 1);
  }

  function ratio(f, matches) {
    var out = { says: [], table: null, equation: null, solve: null };
    if (f.lanes.length < 2) {
      out.says.push(
        m(
          "A ratio compares two amounts. Your tape has " +
            f.lanes.length +
            " row. Add a second row.",
          "Una razón compara dos cantidades. Tu cinta tiene " +
            f.lanes.length +
            " fila. Agrega una segunda fila.",
        ),
      );
      return out;
    }
    var a = f.lanes[0];
    var b = f.lanes[1];
    out.says.push(
      m(
        nm(a, 0) + " has " + a.parts + " equal parts and " + nm(b, 1) + " has " + b.parts + ".",
        nm(a, 0) +
          " tiene " +
          a.parts +
          " partes iguales y " +
          nm(b, 1) +
          " tiene " +
          b.parts +
          ".",
      ),
    );
    out.says.push(
      m(
        "So the ratio is " + a.parts + " : " + b.parts + ".",
        "Entonces la razón es " + a.parts + " : " + b.parts + ".",
      ),
    );
    out.table = {
      head: [nm(a, 0), nm(b, 1)],
      rows: [1, 2, 3, 4].map(function (k) {
        return [String(a.parts * k), String(b.parts * k)];
      }),
    };
    var total = f.bracket && f.bracket.label ? num(f.bracket.label) : null;
    var unk = f.lanes.filter(function (l) {
      return l.labels.indexOf("?") >= 0;
    })[0];
    if (total && matches && unk) {
      var all = a.parts + b.parts;
      var part = total.div(all);
      out.equation = m(
        all + " × (one part) = " + show(total),
        all + " × (una parte) = " + show(total),
      );
      out.solve = [
        m(
          "The bracket covers all " + all + " parts, so " + all + " parts = " + show(total) + ".",
          "El corchete cubre las " +
            all +
            " partes, así que " +
            all +
            " partes = " +
            show(total) +
            ".",
        ),
        m(
          "One part is " + show(total) + " ÷ " + all + " = " + show(part) + ".",
          "Una parte es " + show(total) + " ÷ " + all + " = " + show(part) + ".",
        ),
        m(
          "The ? row has " +
            unk.parts +
            " parts: " +
            unk.parts +
            " × " +
            show(part) +
            " = " +
            show(part.mul(unk.parts)) +
            ".",
          "La fila con ? tiene " +
            unk.parts +
            " partes: " +
            unk.parts +
            " × " +
            show(part) +
            " = " +
            show(part.mul(unk.parts)) +
            ".",
        ),
      ];
    }
    return out;
  }

  function percent(f, matches) {
    var out = { says: [], table: null, equation: null, solve: null };
    var l = f.lanes[0];
    if (!l) return out;
    var each = R().of(1, l.parts);
    var q = each.mul(l.shaded);
    out.says.push(
      m(
        "The tape has " +
          l.parts +
          " equal parts, so each part is 100% ÷ " +
          l.parts +
          " = " +
          each.percent() +
          ".",
        "La cinta tiene " +
          l.parts +
          " partes iguales, así que cada parte es 100% ÷ " +
          l.parts +
          " = " +
          each.percent() +
          ".",
      ),
    );
    out.says.push(
      m(
        "You shaded " +
          l.shaded +
          " part" +
          (l.shaded === 1 ? "" : "s") +
          ": " +
          l.shaded +
          " × " +
          each.percent() +
          " = " +
          q.percent() +
          ".",
        "Sombreaste " +
          l.shaded +
          " parte" +
          (l.shaded === 1 ? "" : "s") +
          ": " +
          l.shaded +
          " × " +
          each.percent() +
          " = " +
          q.percent() +
          ".",
      ),
    );
    out.table = {
      head: ["%", f.bracket && f.bracket.label ? "amount" : "amount"],
      rows: [
        ["100%", f.bracket && f.bracket.label ? f.bracket.label : "whole"],
        [q.percent(), "?"],
      ],
    };
    var total = f.bracket && f.bracket.label ? num(f.bracket.label) : null;
    if (total && matches) {
      out.equation = m(
        q.percent() + " of " + show(total) + " = ?",
        q.percent() + " de " + show(total) + " = ?",
      );
      out.solve = [
        m(
          q.percent() + " = " + q.frac() + " as a fraction.",
          q.percent() + " = " + q.frac() + " como fracción.",
        ),
        m(
          q.frac() + " × " + show(total) + " = " + show(q.mul(total)) + ".",
          q.frac() + " × " + show(total) + " = " + show(q.mul(total)) + ".",
        ),
      ];
    }
    return out;
  }

  function equation(f, matches) {
    var out = { says: [], table: null, equation: null, solve: null };
    var l = f.lanes[0];
    if (!l) return out;
    var u = 0;
    var n = R().ZERO;
    l.labels.forEach(function (x) {
      var v = num(x);
      if (x && v) n = n.add(v);
      else u++;
    });
    var total = f.bracket && f.bracket.label ? num(f.bracket.label) : null;
    if (!total || !u) {
      out.says.push(
        m(
          "Label the unknown blocks with a letter and bracket the total, and the equation will appear.",
          "Etiqueta los bloques desconocidos con una letra y pon un corchete al total, y aparecerá la ecuación.",
        ),
      );
      return out;
    }
    var lhs = (u > 1 ? u : "") + "x" + (n.isZero() ? "" : " + " + show(n));
    out.says.push(
      m(
        "Your tape has " +
          u +
          " block" +
          (u === 1 ? "" : "s") +
          " for the unknown" +
          (n.isZero() ? "" : " and a known part of " + show(n)) +
          ". The bracket says " +
          show(total) +
          ".",
        "Tu cinta tiene " +
          u +
          " bloque" +
          (u === 1 ? "" : "s") +
          " para la incógnita" +
          (n.isZero() ? "" : " y una parte conocida de " + show(n)) +
          ". El corchete dice " +
          show(total) +
          ".",
      ),
    );
    out.equation = m(lhs + " = " + show(total), lhs + " = " + show(total));
    if (matches) {
      var rest = total.sub(n);
      out.solve = [];
      if (!n.isZero())
        out.solve.push(
          m(
            "Take " +
              show(n) +
              " away from both sides: " +
              (u > 1 ? u : "") +
              "x = " +
              show(total) +
              " − " +
              show(n) +
              " = " +
              show(rest) +
              ".",
            "Quita " +
              show(n) +
              " de ambos lados: " +
              (u > 1 ? u : "") +
              "x = " +
              show(total) +
              " − " +
              show(n) +
              " = " +
              show(rest) +
              ".",
          ),
        );
      if (u > 1)
        out.solve.push(
          m(
            "Divide both sides by " +
              u +
              ": x = " +
              show(rest) +
              " ÷ " +
              u +
              " = " +
              show(rest.div(u)) +
              ".",
            "Divide ambos lados entre " +
              u +
              ": x = " +
              show(rest) +
              " ÷ " +
              u +
              " = " +
              show(rest.div(u)) +
              ".",
          ),
        );
      else out.solve.push(m("So x = " + show(rest) + ".", "Entonces x = " + show(rest) + "."));
    }
    return out;
  }

  function unitrate(f, matches) {
    var out = { says: [], table: null, equation: null, solve: null };
    var top = {};
    var bot = {};
    f.ticks.forEach(function (t) {
      (t.r === 0 ? top : bot)[t.c] = t.label;
    });
    var pairs = Object.keys(top)
      .filter(function (c) {
        return bot[c] !== undefined;
      })
      .map(function (c) {
        return { top: top[c] || "?", bottom: bot[c] || "?" };
      });
    var tn = f.names[0] || "top";
    var bn = f.names[1] || "bottom";
    pairs.forEach(function (p) {
      out.says.push(
        m(
          p.top + " " + tn + " line up with " + p.bottom + " " + bn + ".",
          p.top + " de " + tn + " corresponden a " + p.bottom + " de " + bn + ".",
        ),
      );
    });
    out.table = {
      head: [bn, tn],
      rows: pairs
        .slice()
        .sort(function (a, b) {
          return (
            (num(a.bottom) ? num(a.bottom).num() : 99) - (num(b.bottom) ? num(b.bottom).num() : 99)
          );
        })
        .map(function (p) {
          return [p.bottom, p.top];
        }),
    };
    var known = pairs.filter(function (p) {
      var a = num(p.top);
      var b = num(p.bottom);
      return a && b && !b.isZero();
    })[0];
    if (known && matches) {
      var rate = num(known.top).div(num(known.bottom));
      out.equation = m(
        known.top + " ÷ " + known.bottom + " = ? per 1",
        known.top + " ÷ " + known.bottom + " = ? por 1",
      );
      out.solve = [
        m(
          "The unit rate is " +
            known.top +
            " ÷ " +
            known.bottom +
            " = " +
            show(rate) +
            " " +
            tn +
            " for every 1 " +
            bn +
            ".",
          "La tasa unitaria es " +
            known.top +
            " ÷ " +
            known.bottom +
            " = " +
            show(rate) +
            " de " +
            tn +
            " por cada 1 de " +
            bn +
            ".",
        ),
      ];
    }
    return out;
  }

  function numberline(story, f, matches) {
    var out = { says: [], table: null, equation: null, solve: null };
    var vals = f.ticks.map(function (t) {
      return EWL.SketchCheck.axisValue(story, t.c);
    });
    vals.forEach(function (v) {
      var steps = show(v.abs());
      out.says.push(
        v.isZero()
          ? m(
              "A point at 0 is at sea level, the starting place.",
              "Un punto en 0 está en el nivel del mar, el punto de partida.",
            )
          : m(
              "A point at " +
                show(v) +
                " is " +
                steps +
                " units " +
                (v.sign() < 0 ? "left" : "right") +
                " of 0.",
              "Un punto en " +
                show(v) +
                " está a " +
                steps +
                " unidades a la " +
                (v.sign() < 0 ? "izquierda" : "derecha") +
                " de 0.",
            ),
      );
    });
    if (vals.length === 2) {
      var lo = vals[0].lt(vals[1]) ? vals[0] : vals[1];
      var hi = vals[0].lt(vals[1]) ? vals[1] : vals[0];
      var neg = lo.sign() < 0 ? "(" + show(lo) + ")" : show(lo);
      out.equation = m(
        show(hi) + " − " + neg + " = " + show(hi.sub(lo)),
        show(hi) + " − " + neg + " = " + show(hi.sub(lo)),
      );
      if (matches)
        out.solve = [
          m(
            "The distance between the two points is " +
              show(hi) +
              " − " +
              neg +
              " = " +
              show(hi.sub(lo)) +
              ".",
            "La distancia entre los dos puntos es " +
              show(hi) +
              " − " +
              neg +
              " = " +
              show(hi.sub(lo)) +
              ".",
          ),
        ];
    }
    return out;
  }

  function compile(story, d, matches) {
    var f = EWL.SketchModel.facts(d);
    var c = story.compile;
    if (c === "ratio") return ratio(f, matches);
    if (c === "percent") return percent(f, matches);
    if (c === "equation") return equation(f, matches);
    if (c === "unitrate") return unitrate(f, matches);
    return numberline(story, f, matches);
  }
  EWL.SketchCompile = { compile: compile };
})(typeof window !== "undefined" ? window : globalThis);

/* EWL.SketchCheck — compares a student's diagram with a story problem's spec and says exactly what differs, kindly.
 *
 *   EWL.SketchCheck.check(story, d) -> {ok, issues:[{en, es}], good:[{en, es}]}
 *
 * Everything judged here is a number, a label or a position on the grid; numbers are compared with EWL.Rat.eq, never as
 * text. An issue names the row and both counts ("your raisins row has 5 parts but the story has 3"). It never states
 * the answer to the story problem.
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
  function same(a, b) {
    var x = R().parse(a);
    var y = R().parse(b);
    return x && y ? x.eq(y) : String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
  }
  function hasKey(name, keys) {
    var n = String(name || "").toLowerCase();
    return (keys || []).some(function (k) {
      return n.indexOf(k) >= 0;
    });
  }
  function laneName(l, spec) {
    return l && l.name ? l.name : spec.name || "";
  }

  function checkTape(story, f, out) {
    var spec = story.spec;
    if (!f.lanes.length) {
      out.push(
        m(
          "Place some blocks to start your tape. Each block is one equal part.",
          "Coloca algunos bloques para empezar tu cinta. Cada bloque es una parte igual.",
        ),
      );
      return;
    }
    if (f.lanes.length !== spec.lanes.length)
      out.push(
        m(
          "Your diagram has " +
            f.lanes.length +
            " tape row" +
            (f.lanes.length === 1 ? "" : "s") +
            " but the story needs " +
            spec.lanes.length +
            ".",
          "Tu diagrama tiene " +
            f.lanes.length +
            " fila" +
            (f.lanes.length === 1 ? "" : "s") +
            " de cinta pero la historia necesita " +
            spec.lanes.length +
            ".",
        ),
      );
    var needNames =
      spec.lanes.length > 1 &&
      f.lanes.some(function (l) {
        return !l.name;
      });
    if (needNames)
      out.push(
        m(
          "Name each row with the Name row tool, so the picture says what each row stands for.",
          "Ponle nombre a cada fila con la herramienta de nombre, para que el dibujo diga qué representa cada fila.",
        ),
      );
    spec.lanes.forEach(function (sl, i) {
      var lane = sl.keys
        ? f.lanes.filter(function (l) {
            return hasKey(l.name, sl.keys);
          })[0]
        : f.lanes[i];
      if (!lane) {
        if (!needNames && sl.keys)
          out.push(
            m(
              "I cannot find a row for the " + sl.name + ". Name one of your rows " + sl.name + ".",
              "No encuentro una fila para " +
                sl.nameEs +
                ". Ponle a una de tus filas el nombre " +
                sl.nameEs +
                ".",
            ),
          );
        return;
      }
      var nm = laneName(lane, sl);
      if (sl.parts !== undefined && lane.parts !== sl.parts)
        out.push(
          m(
            "Your " +
              nm +
              " row has " +
              lane.parts +
              " part" +
              (lane.parts === 1 ? "" : "s") +
              " but the story has " +
              sl.parts +
              ".",
            "Tu fila de " +
              nm +
              " tiene " +
              lane.parts +
              " parte" +
              (lane.parts === 1 ? "" : "s") +
              " pero la historia tiene " +
              sl.parts +
              ".",
          ),
        );
      if (!lane.contiguous)
        out.push(
          m(
            "The parts in your " + nm + " row should touch, with no gaps.",
            "Las partes de tu fila de " + nm + " deben tocarse, sin huecos.",
          ),
        );
      if (sl.unknown && lane.labels.indexOf("?") < 0)
        out.push(
          m(
            "Mark the part you are looking for with a ? in the " + nm + " row.",
            "Marca con un ? la parte que buscas en la fila de " + nm + ".",
          ),
        );
      if (sl.shaded !== undefined && lane.shaded !== sl.shaded)
        out.push(
          m(
            "You shaded " +
              lane.shaded +
              " part" +
              (lane.shaded === 1 ? "" : "s") +
              " but the story asks about " +
              sl.shaded +
              ".",
            "Sombreaste " +
              lane.shaded +
              " parte" +
              (lane.shaded === 1 ? "" : "s") +
              " pero la historia pregunta por " +
              sl.shaded +
              ".",
          ),
        );
      (sl.labelsAmong || []).forEach(function (need) {
        if (
          !lane.labels.some(function (x) {
            return same(x, need);
          })
        )
          out.push(
            m(
              "I do not see a block labelled " +
                need +
                ". Label the part that stands for " +
                need +
                ".",
              "No veo un bloque con la etiqueta " +
                need +
                ". Etiqueta la parte que representa " +
                need +
                ".",
            ),
          );
      });
      if (
        sl.allLabel &&
        !lane.labels.every(function (x) {
          return x.toLowerCase() === sl.allLabel;
        })
      )
        out.push(
          m(
            "Every block should be labelled " +
              sl.allLabel +
              ", because each one is the same amount.",
            "Cada bloque debe tener la etiqueta " +
              sl.allLabel +
              ", porque todos son la misma cantidad.",
          ),
        );
    });
    if (spec.bracket) {
      if (!f.bracket)
        out.push(
          m(
            "Add a bracket under the tape for the whole. Use the Bracket tool on the bottom row.",
            "Agrega un corchete debajo de la cinta para el total. Usa la herramienta de corchete en la fila de abajo.",
          ),
        );
      else if (!f.bracket.label)
        out.push(
          m(
            "Label your bracket with the whole amount from the story.",
            "Etiqueta tu corchete con la cantidad total de la historia.",
          ),
        );
      else if (!same(f.bracket.label, spec.bracket))
        out.push(
          m(
            "Your bracket says " +
              f.bracket.label +
              " but the whole in the story is " +
              spec.bracket +
              ".",
            "Tu corchete dice " +
              f.bracket.label +
              " pero el total en la historia es " +
              spec.bracket +
              ".",
          ),
        );
    }
  }

  function checkDouble(story, f, out) {
    var spec = story.spec;
    var rows = [{}, {}];
    f.ticks.forEach(function (t) {
      rows[t.r][t.c] = t.label;
    });
    ["0", "1"].forEach(function (_r, i) {
      var name = f.names[i] || "";
      var sn = spec.names[i];
      if (!hasKey(name, sn.keys))
        out.push(
          m(
            "Name the " +
              (i ? "bottom" : "top") +
              " line (" +
              sn.keys[0] +
              "s) with the Name row tool.",
            "Ponle nombre a la línea " +
              (i ? "de abajo" : "de arriba") +
              " (" +
              sn.keys[sn.keys.length - 1] +
              ") con la herramienta de nombre.",
          ),
        );
    });
    var cols = {};
    spec.pairs.forEach(function (p) {
      var hit = Object.keys(rows[0]).filter(function (c) {
        return rows[1][c] !== undefined && same(rows[0][c], p[0]) && same(rows[1][c], p[1]);
      })[0];
      if (hit === undefined)
        out.push(
          m(
            "I cannot find " +
              p[0] +
              " on the top line over " +
              p[1] +
              " on the bottom line. Put a tick on each line in the same column and label both.",
            "No encuentro " +
              p[0] +
              " en la línea de arriba sobre " +
              p[1] +
              " en la de abajo. Pon una marca en cada línea en la misma columna y etiqueta ambas.",
          ),
        );
      else cols[p[1]] = Number(hit);
    });
    if (spec.scale && cols["0"] !== undefined) {
      var far = spec.pairs
        .filter(function (p) {
          return !same(p[1], "0");
        })
        .sort(function (a, b) {
          return R().parse(b[1]).cmp(R().parse(a[1]));
        })[0];
      spec.pairs.forEach(function (p) {
        var b = R().parse(p[1]);
        if (b.isZero() || cols[p[1]] === undefined || cols[far[1]] === undefined || p === far)
          return;
        var want = b
          .div(R().parse(far[1]))
          .mul(cols[far[1]] - cols["0"])
          .add(cols["0"]);
        if (!want.eq(cols[p[1]]))
          out.push(
            m(
              "Equal steps must mean equal amounts. The tick for " +
                p[1] +
                " should sit " +
                b.div(R().parse(far[1])).frac() +
                " of the way from 0 to " +
                far[1] +
                ", but yours does not.",
              "Pasos iguales deben significar cantidades iguales. La marca de " +
                p[1] +
                " debe quedar a " +
                b.div(R().parse(far[1])).frac() +
                " del camino de 0 a " +
                far[1] +
                ", pero la tuya no.",
            ),
          );
      });
    }
  }

  function axisValue(story, c) {
    return R().parse(story.axis.min).add(R().parse(story.axis.step).mul(c));
  }
  function checkNumberLine(story, f, out) {
    var spec = story.spec;
    var vals = f.ticks.map(function (t) {
      return axisValue(story, t.c);
    });
    if (vals.length !== spec.points.length)
      out.push(
        m(
          "You marked " +
            vals.length +
            " point" +
            (vals.length === 1 ? "" : "s") +
            " but the story has " +
            spec.points.length +
            ".",
          "Marcaste " +
            vals.length +
            " punto" +
            (vals.length === 1 ? "" : "s") +
            " pero la historia tiene " +
            spec.points.length +
            ".",
        ),
      );
    spec.points.forEach(function (p) {
      if (
        !vals.some(function (v) {
          return v.eq(R().parse(p.v));
        })
      )
        out.push(
          m(
            "I do not see a point at " + R().parse(p.v).mixed() + ". " + p.hint,
            "No veo un punto en " + R().parse(p.v).mixed() + ". " + p.hintEs,
          ),
        );
    });
    vals.forEach(function (v) {
      if (
        !spec.points.some(function (p) {
          return v.eq(R().parse(p.v));
        }) &&
        vals.length >= spec.points.length
      )
        out.push(
          m(
            "The point at " + v.mixed() + " is not in the story.",
            "El punto en " + v.mixed() + " no está en la historia.",
          ),
        );
    });
  }

  function check(story, d) {
    var f = EWL.SketchModel.facts(d);
    var out = [];
    if (d.kind !== story.kind)
      return {
        ok: false,
        issues: [
          m(
            "This story needs a different kind of diagram.",
            "Esta historia necesita otro tipo de diagrama.",
          ),
        ],
        good: [],
      };
    if (story.kind === "tape") checkTape(story, f, out);
    else if (story.kind === "dnline") checkDouble(story, f, out);
    else checkNumberLine(story, f, out);
    return { ok: out.length === 0, issues: out };
  }

  EWL.SketchCheck = { check: check, axisValue: axisValue, same: same };
})(typeof window !== "undefined" ? window : globalThis);

/* EWL.LabTasks — the Transfer problems of the Reality Lab: fresh, seeded, judged by EWL.Reason.diagnose.
 *
 * Existing Reason task kinds are reused as they are (percent-stack, unit-price, frac-compare, frac-divide, scale-volume).
 * Six more kinds the investigations need are built here and their misconception rules are added through the public
 * EWL.Reason.registerRule, so correctness stays in one engine:
 *   ratio-equiv   (adding the same number to both parts)      percent-updown (up p% then down p%)
 *   equation-add  (x + a = b)                                  median-of      (mean used for the median)
 *   slant-height  (height used for slant height)              distribute     (k(x + c) as kx + c)
 *
 * A transfer spec in the investigation data:
 *   {task:"percentStack", args:[{pick:["10%","20%"]}, {int:[5,9]}, {group:[[3,4],[5,12]]}, {fixed:"2"}],
 *    where:<boolean expr over a0,a1,...>, prompt:"... {0} ... {1}", promptEs, answerKind:"number"|"choice", choices:[...]}
 *   LabTasks.generate(spec, seed) -> {task, prompt, promptEs, args, choices, answerKind}   (null if no valid draw)
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];
  var R = EWL.Rat;
  var Reason = EWL.Reason;
  if (!R || !Reason) throw new Error("EWL.LabTasks needs rational.js and reasoning.js first");

  function bad(msg) {
    throw new TypeError("LabTasks: " + msg);
  }
  var T = {
    ratioEquiv: function (a, b, c) {
      a = R.parse(a);
      b = R.parse(b);
      c = R.parse(c);
      return { kind: "ratio-equiv", facts: { a: a, b: b, c: c }, answer: b.mul(c).div(a) };
    },
    percentUpDown: function (p) {
      p = R.parse(p);
      return {
        kind: "percent-updown",
        facts: { p: p },
        answer: R.ONE.add(p).mul(R.ONE.sub(p)),
      };
    },
    equationAdd: function (a, b) {
      a = R.parse(a);
      b = R.parse(b);
      return { kind: "equation-add", facts: { a: a, b: b }, answer: b.sub(a) };
    },
    medianOf: function () {
      var list = Array.prototype.slice.call(arguments).map(R.parse);
      var s = list.slice().sort(function (x, y) {
        return x.cmp(y);
      });
      var m = s.length >> 1;
      var med = s.length % 2 ? s[m] : s[m - 1].add(s[m]).div(2);
      var mean = list
        .reduce(function (x, y) {
          return x.add(y);
        })
        .div(list.length);
      return { kind: "median-of", facts: { list: list, mean: mean }, answer: med };
    },
    slantHeight: function (b, h) {
      b = R.parse(b);
      h = R.parse(h);
      var s2 = b.mul(b).add(h.mul(h));
      var s = EWL.LabExpr.eval(["sqrt", s2.frac()], {});
      return { kind: "slant-height", facts: { b: b, h: h }, answer: s };
    },
    distribute: function (k, x, c) {
      k = R.parse(k);
      x = R.parse(x);
      c = R.parse(c);
      return { kind: "distribute", facts: { k: k, x: x, c: c }, answer: k.mul(x.add(c)) };
    },
  };
  var BUILD = {
    percentStack: Reason.Task.percentStack,
    unitPrice: Reason.Task.unitPrice,
    fracCompare: Reason.Task.fracCompare,
    divideFractions: Reason.Task.divideFractions,
    scaleVolume: Reason.Task.scaleVolume,
    ratioEquiv: T.ratioEquiv,
    percentUpDown: T.percentUpDown,
    equationAdd: T.equationAdd,
    medianOf: T.medianOf,
    slantHeight: T.slantHeight,
    distribute: T.distribute,
  };

  function addRule(r) {
    if (!Reason.ruleFor(r.id)) Reason.registerRule(r);
  }
  addRule({
    id: "ratio-add-both",
    tag: "ratio-scaled-additively",
    kinds: ["ratio-equiv"],
    wrong: function (t) {
      return t.facts.b.add(t.facts.c.sub(t.facts.a));
    },
    name: "Added the same amount to both parts",
    nameEs: "Sumó la misma cantidad a las dos partes",
    nudge:
      "Equivalent ratios are copies of the same batch. How many batches does the new first number make?",
    nudgeEs:
      "Las razones equivalentes son copias del mismo lote. ¿Cuántos lotes forma el nuevo primer número?",
    counter: function (t) {
      return (
        "Your method turns " +
        t.facts.a +
        ":" +
        t.facts.b +
        " into " +
        t.facts.c +
        ":" +
        t.facts.b.add(t.facts.c.sub(t.facts.a)) +
        ". Make one batch, two batches, three batches in a table. Do the rows match your answer?"
      );
    },
  });
  addRule({
    id: "percent-back-to-start",
    tag: "percent-used-as-whole-number",
    kinds: ["percent-updown"],
    wrong: function () {
      return R.ONE;
    },
    name: "Thought the same percent up and down cancels",
    nameEs: "Pensó que el mismo porcentaje hacia arriba y hacia abajo se cancela",
    nudge:
      "The percent down is taken from a different amount than the percent up. Which amount is bigger?",
    nudgeEs: "El porcentaje que baja se toma de una cantidad distinta. ¿Cuál cantidad es mayor?",
    counter: function (t) {
      var up = R.of(100).mul(R.ONE.add(t.facts.p));
      return (
        "Start with $100. After going up " +
        t.facts.p.percent() +
        " you have $" +
        up.decimal(2).text +
        ". Now take " +
        t.facts.p.percent() +
        " of that new amount. Is it the same amount you added?"
      );
    },
  });
  addRule({
    id: "equation-undo-missing",
    tag: "equation-not-inverse-operation",
    kinds: ["equation-add"],
    wrong: function (t) {
      return t.facts.a.add(t.facts.b);
    },
    name: "Added instead of undoing the addition",
    nameEs: "Sumó en lugar de deshacer la suma",
    nudge: "To keep the scale balanced, what do you do to both sides to get x alone?",
    nudgeEs: "Para mantener la balanza equilibrada, ¿qué haces a los dos lados para dejar x sola?",
    counter: function (t) {
      return (
        "Put your x back in: " +
        t.facts.a.add(t.facts.b) +
        " + " +
        t.facts.a +
        " is not " +
        t.facts.b +
        ". Does your scale balance?"
      );
    },
  });
  addRule({
    id: "equation-given-number",
    tag: "equation-answered-with-given-number",
    kinds: ["equation-add"],
    wrong: function (t) {
      return t.facts.b;
    },
    name: "Answered with a number already in the equation",
    nameEs: "Respondió con un número que ya estaba en la ecuación",
    nudge: "Put your answer in place of x. Does the left side equal the right side?",
    nudgeEs: "Pon tu respuesta en lugar de x. ¿El lado izquierdo es igual al derecho?",
    counter: function (t) {
      return (
        "Try x = " +
        t.facts.b +
        ": " +
        t.facts.b +
        " + " +
        t.facts.a +
        " is " +
        t.facts.b.add(t.facts.a) +
        ". Is that " +
        t.facts.b +
        "?"
      );
    },
  });
  addRule({
    id: "mean-for-median",
    tag: "stat-mean-vs-median",
    kinds: ["median-of"],
    wrong: function (t) {
      return t.facts.mean;
    },
    name: "Found the mean when the median was asked",
    nameEs: "Halló la media cuando se pedía la mediana",
    nudge: "The median is the middle value after you put the numbers in order. Did you order them?",
    nudgeEs: "La mediana es el valor del medio después de ordenar los números. ¿Los ordenaste?",
    counter: function () {
      return "Put the numbers in order from least to greatest and cross off one from each end until you reach the middle.";
    },
  });
  addRule({
    id: "height-for-slant",
    tag: "geom-surface-area-as-volume",
    kinds: ["slant-height"],
    wrong: function (t) {
      return t.facts.h;
    },
    name: "Used the height as the slant height",
    nameEs: "Usó la altura como altura inclinada",
    nudge:
      "The slant height runs along the face, not straight up. Which side of the right triangle is it?",
    nudgeEs:
      "La altura inclinada va por la cara, no recta hacia arriba. ¿Qué lado del triángulo rectángulo es?",
    counter: function (t) {
      return (
        "A ladder leaning on a wall is longer than the height it reaches. Is the slant of a " +
        t.facts.b +
        " by " +
        t.facts.h +
        " triangle longer than " +
        t.facts.h +
        "?"
      );
    },
  });
  addRule({
    id: "slant-added-legs",
    tag: "geom-volume-added-dimensions",
    kinds: ["slant-height"],
    wrong: function (t) {
      return t.facts.b.add(t.facts.h);
    },
    name: "Added the two legs",
    nameEs: "Sumó los dos catetos",
    nudge:
      "Walking along both legs is longer than the shortcut across. Is the slant the shortcut or the long way?",
    nudgeEs:
      "Caminar por los dos catetos es más largo que el atajo. ¿La altura inclinada es el atajo o el camino largo?",
    counter: function () {
      return "Draw the right triangle. Is one side ever as long as the other two sides added together?";
    },
  });
  addRule({
    id: "distribute-first-only",
    tag: "algebra-distributive-partial",
    kinds: ["distribute"],
    wrong: function (t) {
      return t.facts.k.mul(t.facts.x).add(t.facts.c);
    },
    name: "Multiplied only the first term",
    nameEs: "Multiplicó solo el primer término",
    nudge:
      "The number outside the parentheses touches everything inside. Which terms did you multiply?",
    nudgeEs: "El número de afuera toca todo lo de adentro. ¿Qué términos multiplicaste?",
    counter: function (t) {
      return (
        "Draw " +
        t.facts.k +
        "(x + " +
        t.facts.c +
        ") as a rectangle that is " +
        t.facts.k +
        " tall. How wide is it, and how many parts of the width does the " +
        t.facts.k +
        " cover?"
      );
    },
  });

  function fmtArg(v) {
    return typeof v === "string" ? v : String(v);
  }
  function draw(specs, rng) {
    var out = [];
    specs.forEach(function (s) {
      if (s.fixed !== undefined) out.push(s.fixed);
      else if (s.pick) out.push(rng.pick(s.pick));
      else if (s.int) out.push(rng.int(s.int[0], s.int[1]));
      else if (s.group) Array.prototype.push.apply(out, rng.pick(s.group));
      else bad("unknown argument spec");
    });
    return out;
  }
  function fill(str, args) {
    return String(str).replace(/\{(\d+)\}/g, function (m, i) {
      return args[Number(i)] === undefined ? m : fmtArg(args[Number(i)]);
    });
  }
  /** True when every misconception rule for the kind gives an answer different from the right one on this task. */
  function discriminates(task) {
    return Reason.rules()
      .filter(function (r) {
        return r.kinds.indexOf(task.kind) >= 0;
      })
      .every(function (r) {
        var w = r.wrong(task);
        return w && !w.eq(task.answer);
      });
  }
  function generate(spec, seed) {
    var build = BUILD[spec.task];
    if (!build) bad("unknown task " + spec.task);
    var rng = EWL.rng(seed);
    for (var tries = 0; tries < 80; tries++) {
      var args = draw(spec.args, rng);
      try {
        if (spec.where) {
          var env = {};
          args.forEach(function (a, i) {
            env["a" + i] = R.parse(a);
          });
          if (EWL.LabExpr.eval(spec.where, env) !== true) continue;
        }
        var task = build.apply(null, args);
        if (!discriminates(task)) continue;
        return {
          task: task,
          args: args,
          prompt: fill(spec.prompt, args),
          promptEs: fill(spec.promptEs, args),
          answerKind: spec.answerKind || "number",
          choices: (spec.choices || []).map(function (c) {
            return {
              value: fill(c.value, args),
              label: fill(c.label, args),
              labelEs: fill(c.labelEs || c.label, args),
            };
          }),
        };
      } catch (e) {
        /* an undefined draw (divide by zero, inexact root): draw again */
      }
    }
    return null;
  }

  EWL.LabTasks = { build: BUILD, generate: generate, kinds: Object.keys(BUILD), fill: fill };

  EWL.selfTests.push({
    name: "lab tasks: every new task kind is solved and its misconception recognised",
    run: function () {
      var cases = [
        [T.ratioEquiv(2, 3, 8), "9"],
        [T.percentUpDown("50%"), "100%"],
        [T.equationAdd(7, 19), "26"],
        [T.medianOf(2, 3, 4, 100), "27.25"],
        [T.slantHeight(5, 12), "12"],
        [T.distribute(3, 2, 4), "10"],
      ];
      for (var i = 0; i < cases.length; i++) {
        var t = cases[i][0];
        if (!Reason.diagnose(t, { value: t.answer }).correct)
          return t.kind + " rejects its own answer";
        var d = Reason.diagnose(t, { value: cases[i][1] });
        if (d.correct || !d.rule) return t.kind + " does not recognise " + cases[i][1];
      }
      return true;
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

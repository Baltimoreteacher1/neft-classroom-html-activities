/* EWL.LabValidate — one validator for data/ewl/investigations.json, used by tools/ewl-lab.test.mjs and ?diag=1.
 *
 *   LabValidate.validate(doc, ctx) -> [problem strings]            empty means the data is sound
 *     ctx.lessons   : launch-manifest lessons [{id, unit}]          lesson ids must exist and sit in the stated unit
 *     ctx.standards : ccss-standards `standards` object             the standard code must exist
 *     ctx.labs      : learning-lab ids                              optional: "relates.labs" must exist
 *   Without ctx the shape, bilingual fields, expressions and every sweep/prediction/transfer are still checked.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];

  var FMTS = ["num", "dec2", "money", "pct", "frac", "mixed", "ab", "yn"];
  var MODELS = [
    "bars",
    "ratio-bars",
    "fraction-bars",
    "box",
    "dots",
    "balance-beam",
    "triangle",
    "rect-split",
  ];
  var TEXT_KEYS = [
    "title",
    "blurb",
    "text",
    "label",
    "prompt",
    "hint",
    "ask",
    "holdsText",
    "failsText",
    "frame",
    "intro",
    "short",
  ];
  var IDENT = /^[A-Za-z][A-Za-z0-9]*$/;
  var SLUG = /^[a-z0-9][a-z0-9-]{0,48}$/;

  function isObj(x) {
    return x && typeof x === "object" && !Array.isArray(x);
  }

  /** Every translatable string needs a non-empty sibling `<key>Es`. */
  function bilingual(node, path, out) {
    if (Array.isArray(node))
      return node.forEach(function (n, i) {
        bilingual(n, path + "[" + i + "]", out);
      });
    if (!isObj(node)) return;
    Object.keys(node).forEach(function (k) {
      var val = node[k];
      if (typeof val === "string" && TEXT_KEYS.indexOf(k) >= 0) {
        var es = node[k + "Es"];
        if (
          typeof es !== "string" ||
          !es.trim() ||
          (es === val && (val.match(/[A-Za-z]{3,}/g) || []).length >= 2)
        )
          out.push(path + "." + k + ": needs its own Spanish text (" + k + "Es)");
      } else if (typeof val === "object") bilingual(val, path + "." + k, out);
    });
  }

  function exprOK(expr, vars, where, out) {
    EWL.LabExpr.validate(expr, vars).forEach(function (p) {
      out.push(where + ": " + p);
    });
  }

  function envIds(inv) {
    var ids = [];
    inv.params.forEach(function (p) {
      ids.push(p.id);
      if (p.kind === "choice")
        p.options.forEach(function (o) {
          Object.keys(o.set || {}).forEach(function (k) {
            if (ids.indexOf(k) < 0) ids.push(k);
          });
        });
    });
    inv.steps.forEach(function (s) {
      ids.push(s.id);
    });
    return ids;
  }

  function checkParams(inv, id, out) {
    var seen = {};
    inv.params.forEach(function (p) {
      var w = id + ".params." + p.id;
      if (!IDENT.test(p.id) || seen[p.id]) out.push(w + ": bad or repeated id");
      seen[p.id] = 1;
      if (p.kind === "number") {
        var ok = [p.min, p.max, p.step, p.value].every(function (n) {
          return typeof n === "number" && Number.isFinite(n);
        });
        if (!ok || !(p.min <= p.value && p.value <= p.max && p.step > 0))
          out.push(w + ": min/value/max/step are not consistent");
        if (["", "%", "$"].indexOf(p.unit) < 0) out.push(w + ": unit must be '', '%' or '$'");
      } else if (p.kind === "choice") {
        var oids = {};
        if (!p.options || p.options.length < 2) out.push(w + ": a choice needs at least 2 options");
        (p.options || []).forEach(function (o) {
          if (oids[o.id]) out.push(w + ": repeated option " + o.id);
          oids[o.id] = 1;
          Object.keys(o.set || {}).forEach(function (k) {
            exprOK(
              o.set[k],
              inv.params
                .filter(function (q) {
                  return q.kind === "number";
                })
                .map(function (q) {
                  return q.id;
                }),
              w + "." + o.id + "." + k,
              out,
            );
          });
        });
        if (!oids[p.value]) out.push(w + ": default option does not exist");
      } else out.push(w + ": unknown kind " + p.kind);
    });
  }

  function checkRun(inv, id, out) {
    var ids = [];
    inv.params.forEach(function (p) {
      ids.push(p.id);
    });
    inv.steps.forEach(function (s, i) {
      var w = id + ".steps." + s.id;
      if (!IDENT.test(s.id) || ids.indexOf(s.id) >= 0) out.push(w + ": bad or repeated id");
      if (FMTS.indexOf(s.fmt) < 0) out.push(w + ": unknown fmt " + s.fmt);
      var known = envIds({ params: inv.params, steps: inv.steps.slice(0, i) });
      exprOK(s.expr, known, w, out);
      ids.push(s.id);
    });
    exprOK(inv.claim.test, envIds(inv), id + ".claim.test", out);
    inv.table.concat(inv.results).forEach(function (c) {
      if (!EWL.LabSim.column(inv, c))
        out.push(id + ": table/results column " + c + " does not exist");
    });
    if (
      (inv.extra || []).some(function (e) {
        return envIds(inv).indexOf(e.id) < 0;
      })
    )
      out.push(id + ": extra names an unknown variable");
  }

  function fullCase(inv, c) {
    return Object.assign(EWL.LabSim.defaults(inv), c || {});
  }

  function checkBehaviour(inv, id, out) {
    var S = EWL.LabSim;
    try {
      var d = S.run(inv, {});
      if (typeof EWL.LabExpr.eval(inv.claim.test, d.values) !== "boolean")
        out.push(id + ".claim.test: must be true/false");
    } catch (e) {
      out.push(id + ": defaults do not run (" + e.message + ")");
      return;
    }
    // prediction: setup runs, exactly one option is true
    var pr = inv.prediction;
    try {
      var p = S.prediction(inv);
      if (p.count !== 1)
        out.push(
          id + ".prediction: exactly one option must be true for the setup (found " + p.count + ")",
        );
      var oids = {};
      pr.options.forEach(function (o) {
        if (oids[o.id]) out.push(id + ".prediction: repeated option id " + o.id);
        oids[o.id] = 1;
      });
      if (pr.options.length < 2) out.push(id + ".prediction: needs at least 2 options");
    } catch (e) {
      out.push(id + ".prediction: setup does not run (" + e.message + ")");
    }
    // sweep: every case runs, and the tempting claim really has counterexamples
    Object.keys(inv.sweep.axes).forEach(function (k) {
      var prm = S.param(inv, k);
      if (!prm) return out.push(id + ".sweep: unknown axis " + k);
      inv.sweep.axes[k].forEach(function (val) {
        if (prm.kind === "choice" ? !S.option(prm, val) : S.numberValue(prm, val) === null)
          out.push(id + ".sweep." + k + ": bad value " + val);
      });
    });
    if (
      !out.some(function (m) {
        return m.indexOf(id + ".sweep") === 0;
      })
    ) {
      var sw = S.sweep(inv);
      if (sw.undef) out.push(id + ".sweep: " + sw.undef + " cases are undefined");
      if (!sw.fails.length) out.push(id + ".sweep: the tempting claim has no counterexample");
      if (sw.evaluated < 3) out.push(id + ".sweep: too few cases");
    }
    var ch = inv.challenge;
    if (ch.mode === "find") {
      if (
        !ch.free ||
        !ch.free.length ||
        ch.free.some(function (f) {
          return !S.param(inv, f);
        })
      )
        out.push(id + ".challenge.free: unknown parameter");
    } else if (ch.mode === "hold") {
      try {
        S.run(inv, fullCase(inv, ch.case));
      } catch (e) {
        out.push(id + ".challenge.case does not run");
      }
    } else out.push(id + ".challenge.mode must be find or hold");
  }

  function checkModel(inv, id, out) {
    var m = inv.model;
    if (!m || MODELS.indexOf(m.kind) < 0) return out.push(id + ".model: unknown kind");
    var ids = envIds(inv);
    var refs = [];
    ["left", "right", "start", "extra", "mean", "median", "hyp", "height", "max"].forEach(
      function (k) {
        if (typeof m[k] === "string") refs.push(m[k]);
      },
    );
    ["before", "after", "a", "b", "dims", "scaled", "legs", "parts"].forEach(function (k) {
      if (Array.isArray(m[k])) refs = refs.concat(m[k]);
    });
    refs.forEach(function (r) {
      if (ids.indexOf(r) < 0) out.push(id + ".model: unknown variable " + r);
    });
    (m.bars || []).forEach(function (b) {
      if (ids.indexOf(b.value) < 0) out.push(id + ".model.bars: unknown variable " + b.value);
    });
  }

  function checkTransfer(inv, id, out) {
    var t = inv.transfer;
    if (!t || EWL.LabTasks.kinds.indexOf(t.task) < 0)
      return out.push(id + ".transfer: unknown task " + (t && t.task));
    if (["number", "choice"].indexOf(t.answerKind) < 0) out.push(id + ".transfer.answerKind");
    if (t.answerKind === "choice" && (!t.choices || t.choices.length < 2))
      out.push(id + ".transfer: choices needed");
    for (var seed = 1; seed <= 25; seed++) {
      var g = EWL.LabTasks.generate(t, seed);
      if (!g) return out.push(id + ".transfer: seed " + seed + " could not draw a valid problem");
      if (/\{\d+\}/.test(g.prompt + g.promptEs))
        return out.push(id + ".transfer: prompt has an unfilled placeholder");
      if (!g.task.answer) return out.push(id + ".transfer: no answer");
      if (t.answerKind === "choice") {
        var hit = g.choices.filter(function (c) {
          var r = EWL.Rat.parse(c.value);
          return r && r.eq(g.task.answer);
        });
        if (hit.length !== 1)
          return out.push(
            id + ".transfer: seed " + seed + " has " + hit.length + " correct choices",
          );
      }
    }
  }

  function checkTemplate(tpl, out) {
    var id = "template " + tpl.id;
    var D = EWL.Discourse;
    if (!SLUG.test(tpl.id)) out.push(id + ": bad id");
    if (!tpl.vars || !Object.keys(tpl.vars).length) return out.push(id + ": no variables");
    Object.keys(tpl.vars).forEach(function (k) {
      if (
        !tpl.vars[k].values.length ||
        !tpl.vars[k].values.every(function (x) {
          return EWL.Rat.parse(x);
        })
      )
        out.push(id + ".vars." + k + ": values must be numbers");
    });
    var ids = Object.keys(tpl.vars);
    (tpl.quantities || []).forEach(function (q) {
      exprOK(q.expr, ids.slice(), id + ".quantities." + q.id, out);
      ids.push(q.id);
    });
    if (!tpl.reasons || !tpl.reasons.length || !tpl.limits || !tpl.limits.length)
      out.push(id + ": needs reasons and limits");
    var ok = 0;
    D.cases(tpl).forEach(function (c) {
      try {
        D.env(tpl, c);
        ok++;
      } catch (e) {
        /* an undefined case is allowed, it is skipped when running */
      }
    });
    if (ok < 3) out.push(id + ": fewer than 3 usable cases");
    bilingual(tpl, id, out);
  }

  function validate(doc, ctx) {
    var out = [];
    ctx = ctx || {};
    if (!doc || !Array.isArray(doc.investigations) || !doc.investigations.length)
      return ["no investigations"];
    var tpls = {};
    (doc.discourseTemplates || []).forEach(function (t) {
      if (tpls[t.id]) out.push("template " + t.id + ": repeated");
      tpls[t.id] = t;
      checkTemplate(t, out);
    });
    var seen = {};
    doc.investigations.forEach(function (inv) {
      var id = String(inv.id);
      if (seen[id]) out.push(id + ": repeated id");
      seen[id] = 1;
      try {
        if (!SLUG.test(id) || !EWL.ID_RE.test(EWL.id("lab", id)))
          out.push(id + ": not a valid activity id");
      } catch (e) {
        out.push(id + ": not a valid activity id");
      }
      bilingual(inv, id, out);
      if (
        !Array.isArray(inv.vocab) ||
        !inv.vocab.length ||
        !inv.vocabEs ||
        inv.vocab.length !== inv.vocabEs.length
      )
        out.push(id + ": vocab and vocabEs must match");
      if (!Number.isInteger(inv.unit) || inv.unit < 2 || inv.unit > 9)
        out.push(id + ": unit must be 2-9 (Unit 10 is not taught)");
      if (!Array.isArray(inv.lessons) || !inv.lessons.length) out.push(id + ": needs lessons");
      (inv.lessons || []).forEach(function (l) {
        if (String(l).split("-")[0] !== String(inv.unit))
          out.push(id + ": lesson " + l + " is not in unit " + inv.unit);
        if (ctx.lessons) {
          var m = ctx.lessons.filter(function (x) {
            return x.id === l;
          })[0];
          if (!m) out.push(id + ": lesson " + l + " is not in the launch manifest");
          else if (m.unit !== inv.unit)
            out.push(id + ": lesson " + l + " belongs to unit " + m.unit);
        }
      });
      if (ctx.standards && !ctx.standards[inv.standard])
        out.push(id + ": standard " + inv.standard + " does not exist");
      if (
        ctx.labs &&
        inv.relates &&
        (inv.relates.labs || []).some(function (l) {
          return ctx.labs.indexOf(l) < 0;
        })
      )
        out.push(id + ": relates.labs names a lab that does not exist");
      if (!inv.discourse || !tpls[inv.discourse])
        out.push(id + ": discourse template " + inv.discourse + " is missing");
      if (
        !inv.params ||
        !inv.steps ||
        !inv.table ||
        !inv.results ||
        !inv.claim ||
        !inv.prediction ||
        !inv.sweep ||
        !inv.challenge ||
        !inv.revision
      )
        return out.push(id + ": a required block is missing");
      var before = out.length;
      checkParams(inv, id, out);
      if (out.length === before) checkRun(inv, id, out);
      if (out.length === before) checkBehaviour(inv, id, out);
      checkModel(inv, id, out);
      checkTransfer(inv, id, out);
    });
    return out;
  }

  EWL.LabValidate = { validate: validate, FMTS: FMTS, MODELS: MODELS };

  EWL.selfTests.push({
    name: "lab data: investigations.json validates (shape, Spanish, sweeps, transfers)",
    run: function () {
      var doc = EWL.LabData;
      if (!doc) return true; // the page loads the file after this runs; the node test covers the file itself
      var p = validate(doc);
      return p.length ? p.length + " problems, first: " + p[0] : true;
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

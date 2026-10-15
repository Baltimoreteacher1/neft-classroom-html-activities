/* EWL.LabSim — runs an investigation's declarative experiment with exact rationals.
 *
 * An investigation (data/ewl/investigations.json) declares:
 *   params : [{id, kind:"number", unit:"%"|"$"|"", min, max, step, value}]            display units (20 means 20% when unit is "%")
 *            [{id, kind:"choice", options:[{id, label, labelEs, set:{var: expr}}], value}]
 *   steps  : [{id, label, labelEs, expr, fmt}]    derived quantities, evaluated in order
 *   claim  : {text, textEs, test: <boolean expr>}  the tempting claim as a predicate
 *   sweep  : {axes:{paramId:[display values | option ids]}}   the cases the Challenge runs the claim over
 *
 *   Sim.defaults(inv) / Sim.run(inv, caseVals) -> {values, holds}
 *   Sim.sweep(inv)    -> {total, evaluated, holds, fails:[{case, values}], undef}
 *   Sim.prediction(inv) -> {correct: optionId, values}
 *   Sim.column(inv, id) -> {id, label, fmt}      Sim.text(inv, id, values) -> display text
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];

  function param(inv, id) {
    return (
      inv.params.filter(function (p) {
        return p.id === id;
      })[0] || null
    );
  }
  function step(inv, id) {
    return (
      inv.steps.filter(function (s) {
        return s.id === id;
      })[0] || null
    );
  }
  function option(p, id) {
    return (
      p.options.filter(function (o) {
        return o.id === id;
      })[0] || null
    );
  }
  function defaults(inv) {
    var c = {};
    inv.params.forEach(function (p) {
      c[p.id] = p.value;
    });
    return c;
  }
  function withDefaults(inv, caseVals) {
    return Object.assign(defaults(inv), caseVals || {});
  }

  /** display value -> exact Rat ("20" with unit "%" is 1/5). Returns null when unreadable or out of range. */
  function numberValue(p, v) {
    var r = EWL.Rat.parse(typeof v === "string" ? v.replace(/%/g, "") : v);
    if (!r) return null;
    if (r.cmp(EWL.Rat.parse(p.min)) < 0 || r.cmp(EWL.Rat.parse(p.max)) > 0) return null;
    return p.unit === "%" ? r.div(100) : r;
  }

  function toEnv(inv, caseVals) {
    var full = withDefaults(inv, caseVals);
    var env = {};
    inv.params.forEach(function (p) {
      if (p.kind !== "choice") {
        var r = numberValue(p, full[p.id]);
        if (!r) throw new RangeError("bad value for " + p.id);
        env[p.id] = r;
      }
    });
    inv.params.forEach(function (p) {
      if (p.kind !== "choice") return;
      var o = option(p, full[p.id]);
      if (!o) throw new RangeError("bad option for " + p.id);
      Object.keys(o.set || {}).forEach(function (k) {
        env[k] = EWL.LabExpr.eval(o.set[k], env);
      });
    });
    return env;
  }

  function run(inv, caseVals) {
    var env = toEnv(inv, caseVals);
    inv.steps.forEach(function (s) {
      env[s.id] = EWL.LabExpr.eval(s.expr, env);
    });
    return { values: env, holds: EWL.LabExpr.eval(inv.claim.test, env) === true };
  }

  function sweepCases(inv) {
    var axes = inv.sweep.axes;
    var keys = Object.keys(axes);
    var out = [{}];
    keys.forEach(function (k) {
      var next = [];
      out.forEach(function (c) {
        axes[k].forEach(function (v) {
          var n = Object.assign({}, c);
          n[k] = v;
          next.push(n);
        });
      });
      out = next;
    });
    return out;
  }

  function sweep(inv) {
    var cases = sweepCases(inv);
    var res = { total: cases.length, evaluated: 0, holds: 0, fails: [], undef: 0 };
    cases.forEach(function (c) {
      try {
        var r = run(inv, c);
        res.evaluated++;
        if (r.holds) res.holds++;
        else res.fails.push({ case: c, values: r.values });
      } catch (e) {
        res.undef++;
      }
    });
    return res;
  }

  function prediction(inv) {
    var r = run(inv, inv.prediction.setup);
    var hit = inv.prediction.options.filter(function (o) {
      return EWL.LabExpr.eval(o.test, r.values) === true;
    });
    return { correct: hit.length === 1 ? hit[0].id : null, count: hit.length, values: r.values };
  }

  function column(inv, id) {
    var p = param(inv, id);
    if (p)
      return {
        id: id,
        label: EWL.t(p.label, p.labelEs),
        fmt:
          p.kind === "choice" ? "text" : p.unit === "%" ? "pct" : p.unit === "$" ? "money" : "num",
      };
    var s =
      step(inv, id) ||
      (inv.extra || []).filter(function (x) {
        return x.id === id;
      })[0];
    return s ? { id: id, label: EWL.t(s.label, s.labelEs), fmt: s.fmt || "num" } : null;
  }
  function text(inv, id, values, caseVals) {
    var p = param(inv, id);
    if (p && p.kind === "choice") {
      var o = option(p, withDefaults(inv, caseVals)[id]);
      return o ? EWL.t(o.label, o.labelEs) : "?";
    }
    var v = values[id];
    if (v === undefined) return "—";
    return EWL.LabExpr.fmt(v, column(inv, id).fmt);
  }
  /** One short line naming the inputs of a case, used by the sweep list and the notebook. */
  function describe(inv, caseVals, values) {
    return inv.table
      .map(function (id) {
        return column(inv, id).label + " " + text(inv, id, values, caseVals);
      })
      .join(", ");
  }
  /** Serialize a run for the notebook: [{label, value}] for every table column. */
  function rowData(inv, caseVals, values) {
    return inv.table.map(function (id) {
      return { label: column(inv, id).label, value: text(inv, id, values, caseVals) };
    });
  }

  EWL.LabSim = {
    param: param,
    step: step,
    option: option,
    defaults: defaults,
    numberValue: numberValue,
    run: run,
    sweep: sweep,
    sweepCases: sweepCases,
    prediction: prediction,
    column: column,
    text: text,
    describe: describe,
    rowData: rowData,
  };

  EWL.selfTests.push({
    name: "sim: 20% off then 10% off is 28% off, not the 30% the claim predicts",
    run: function () {
      var inv = {
        params: [
          { id: "p1", kind: "number", unit: "%", min: 0, max: 100, step: 5, value: 20 },
          { id: "p2", kind: "number", unit: "%", min: 0, max: 100, step: 5, value: 10 },
        ],
        steps: [
          {
            id: "saved",
            expr: ["sub", 1, ["mul", ["sub", 1, "p1"], ["sub", 1, "p2"]]],
            fmt: "pct",
          },
        ],
        claim: { test: ["eq", "saved", ["add", "p1", "p2"]] },
        sweep: { axes: { p1: [10, 20], p2: [10] } },
        table: ["saved"],
      };
      var r = run(inv, {});
      return r.values.saved.percent() === "28%" && !r.holds && sweep(inv).fails.length === 2;
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

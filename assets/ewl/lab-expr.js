/* EWL.LabExpr — the tiny declarative math language the Reality Lab evaluates with exact rationals.
 *
 * Investigations (data/ewl/investigations.json) and Executable Discourse claims are written as data, never as code:
 * there is no eval and no Function anywhere. An expression is
 *   - a JSON number or a numeric string      "20%", "1/2", 0.5, "3"          -> a literal (EWL.Rat.parse)
 *   - an identifier string                   "price", "p1"                    -> a variable looked up in env
 *   - an array  [op, arg, ...]               ["mul", "price", ["sub", 1, "p1"]]
 *
 * Arithmetic ops (return Rat):  add sub mul div neg abs pow(base, integer) min max mean median sqrt(exact only)
 * Compare ops (return boolean): eq ne lt gt le ge
 * Logic ops (return boolean):   and or not implies   and  if(cond, then, else)
 *
 * Exactness: every number is an EWL.Rat. sqrt throws an Inexact error when the root is not rational, and division by
 * zero throws a RangeError; sweeps treat both as "undefined here", never as a pass or a fail.
 *
 *   LabExpr.eval(expr, env)            -> Rat | boolean   (throws on bad input)
 *   LabExpr.validate(expr, vars)       -> [problems]      (unknown op / variable / arity, too deep or too big)
 *   LabExpr.vars(expr)                 -> [identifier names used]
 *   LabExpr.fmt(value, kind)           -> display text    kinds: pct money num dec2 frac mixed ab (1 -> A, 2 -> B)
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];

  var MAX_DEPTH = 12;
  var MAX_NODES = 200;
  var IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

  // op -> [minArgs, maxArgs]
  var ARITY = {
    add: [1, 12],
    sub: [2, 2],
    mul: [1, 12],
    div: [2, 2],
    neg: [1, 1],
    abs: [1, 1],
    pow: [2, 2],
    min: [1, 12],
    max: [1, 12],
    mean: [1, 12],
    median: [1, 12],
    sqrt: [1, 1],
    eq: [2, 2],
    ne: [2, 2],
    lt: [2, 2],
    gt: [2, 2],
    le: [2, 2],
    ge: [2, 2],
    and: [1, 8],
    or: [1, 8],
    not: [1, 1],
    implies: [2, 2],
    if: [3, 3],
  };

  function R() {
    return EWL.Rat;
  }
  function fail(msg, kind) {
    var e = new RangeError(msg);
    e.exprKind = kind || "bad";
    return e;
  }

  function rootOf(r) {
    // exact square root of a non-negative rational, or null
    function isqrt(n) {
      if (n < 2n) return n;
      var x = BigInt(Math.floor(Math.sqrt(Number(n))));
      while (x * x > n) x -= 1n;
      while ((x + 1n) * (x + 1n) <= n) x += 1n;
      return x;
    }
    if (r.sign() < 0) return null;
    var a = isqrt(r.n);
    var b = isqrt(r.d);
    return a * a === r.n && b * b === r.d ? R().of(a, b) : null;
  }

  function evalNode(x, env, depth) {
    if (depth > MAX_DEPTH) throw fail("expression is nested too deeply");
    if (typeof x === "number") {
      var rn = R().parse(x);
      if (!rn) throw fail("bad number " + x);
      return rn;
    }
    if (typeof x === "string") {
      if (IDENT.test(x)) {
        if (!Object.prototype.hasOwnProperty.call(env, x)) throw fail("unknown variable " + x);
        return env[x];
      }
      var lit = R().parse(x);
      if (!lit) throw fail("not a number: " + x);
      return lit;
    }
    if (!Array.isArray(x) || typeof x[0] !== "string") throw fail("bad expression node");
    var op = x[0];
    if (!Object.prototype.hasOwnProperty.call(ARITY, op)) throw fail("unknown operator " + op);
    var n = x.length - 1;
    if (n < ARITY[op][0] || n > ARITY[op][1])
      throw fail(op + " takes " + ARITY[op][0] + " to " + ARITY[op][1] + " arguments");
    if (op === "if") {
      var c = evalNode(x[1], env, depth + 1);
      if (typeof c !== "boolean") throw fail("if needs a true/false test");
      return evalNode(c ? x[2] : x[3], env, depth + 1);
    }
    if (op === "and" || op === "or") {
      var res = op === "and";
      for (var i = 1; i <= n; i++) {
        var b = evalNode(x[i], env, depth + 1);
        if (typeof b !== "boolean") throw fail(op + " needs true/false arguments");
        res = op === "and" ? res && b : res || b;
      }
      return res;
    }
    if (op === "not" || op === "implies") {
      var p = evalNode(x[1], env, depth + 1);
      if (typeof p !== "boolean") throw fail(op + " needs true/false arguments");
      if (op === "not") return !p;
      var q = evalNode(x[2], env, depth + 1);
      if (typeof q !== "boolean") throw fail("implies needs true/false arguments");
      return !p || q;
    }
    var a = [];
    for (var j = 1; j <= n; j++) {
      var v = evalNode(x[j], env, depth + 1);
      if (typeof v === "boolean") throw fail(op + " needs numbers");
      a.push(v);
    }
    switch (op) {
      case "add":
        return a.reduce(function (s, t) {
          return s.add(t);
        });
      case "sub":
        return a[0].sub(a[1]);
      case "mul":
        return a.reduce(function (s, t) {
          return s.mul(t);
        });
      case "div":
        return a[0].div(a[1]);
      case "neg":
        return a[0].neg();
      case "abs":
        return a[0].abs();
      case "pow":
        if (!a[1].isInt()) throw fail("pow needs a whole-number exponent");
        return a[0].pow(Number(a[1].n));
      case "min":
      case "max":
        return a.reduce(function (s, t) {
          return (op === "min" ? t.cmp(s) < 0 : t.cmp(s) > 0) ? t : s;
        });
      case "mean":
        return a
          .reduce(function (s, t) {
            return s.add(t);
          })
          .div(R().of(a.length));
      case "median": {
        var s2 = a.slice().sort(function (p1, p2) {
          return p1.cmp(p2);
        });
        var m = s2.length >> 1;
        return s2.length % 2 ? s2[m] : s2[m - 1].add(s2[m]).div(R().of(2));
      }
      case "sqrt": {
        var root2 = rootOf(a[0]);
        if (!root2) throw fail("not a perfect square", "inexact");
        return root2;
      }
      case "eq":
        return a[0].eq(a[1]);
      case "ne":
        return !a[0].eq(a[1]);
      case "lt":
        return a[0].cmp(a[1]) < 0;
      case "gt":
        return a[0].cmp(a[1]) > 0;
      case "le":
        return a[0].cmp(a[1]) <= 0;
      default:
        return a[0].cmp(a[1]) >= 0; // ge
    }
  }

  function validate(expr, vars) {
    var problems = [];
    var count = 0;
    function walk(x, depth) {
      if (++count > MAX_NODES) {
        if (count === MAX_NODES + 1) problems.push("expression is too big");
        return;
      }
      if (depth > MAX_DEPTH) {
        problems.push("expression is nested too deeply");
        return;
      }
      if (typeof x === "number") {
        if (!Number.isFinite(x)) problems.push("bad number");
        return;
      }
      if (typeof x === "string") {
        if (IDENT.test(x)) {
          if (vars && vars.indexOf(x) < 0) problems.push("unknown variable " + x);
        } else if (!R().parse(x)) problems.push("not a number: " + x);
        return;
      }
      if (!Array.isArray(x) || typeof x[0] !== "string") {
        problems.push("bad expression node");
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(ARITY, x[0])) {
        problems.push("unknown operator " + x[0]);
        return;
      }
      var n = x.length - 1;
      if (n < ARITY[x[0]][0] || n > ARITY[x[0]][1])
        problems.push(x[0] + " has " + n + " arguments");
      for (var i = 1; i < x.length; i++) walk(x[i], depth + 1);
    }
    walk(expr, 0);
    return problems;
  }

  function vars(expr, out) {
    out = out || [];
    if (typeof expr === "string" && IDENT.test(expr) && out.indexOf(expr) < 0) out.push(expr);
    else if (Array.isArray(expr)) for (var i = 1; i < expr.length; i++) vars(expr[i], out);
    return out;
  }

  function pad2(d) {
    var parts = d.split(".");
    if (parts.length === 1) return d + ".00";
    return parts[1].length === 1 ? d + "0" : d;
  }
  function fmt(v, kind) {
    if (typeof v === "boolean") return v ? EWL.t("yes", "sí") : EWL.t("no", "no");
    if (v == null) return EWL.t("undefined", "indefinido");
    var r = v;
    switch (kind) {
      case "pct":
        return r.percent();
      case "money": {
        var neg = r.sign() < 0;
        var d = r.abs().decimal(2);
        var txt = d.terminating ? pad2(d.text) : r.abs().num().toFixed(2);
        return (neg ? "-$" : "$") + txt;
      }
      case "ab":
        return r.eq(1) ? "A" : r.eq(2) ? "B" : EWL.t("same", "igual");
      case "dec2": {
        var c2 = r.decimal(2);
        return c2.terminating ? c2.text : "≈" + r.num().toFixed(2);
      }
      case "frac":
        return r.frac();
      case "mixed":
        return r.mixed();
      default: {
        var dd = r.decimal(6);
        return dd.terminating || dd.repeating ? dd.text : r.mixed();
      }
    }
  }

  var Expr = { eval: evalNode, validate: validate, vars: vars, fmt: fmt, OPS: Object.keys(ARITY) };
  Expr.eval = function (expr, env) {
    return evalNode(expr, env || {}, 0);
  };
  EWL.LabExpr = Expr;

  EWL.selfTests.push({
    name: "expr: exact evaluation, no floats, unknown operators rejected",
    run: function () {
      var r = EWL.Rat;
      var v = Expr.eval(["add", "0.1", "0.2"], {});
      if (!v.eq(r.parse("0.3"))) return "0.1 + 0.2 is not 0.3";
      if (!Expr.eval(["median", 1, 9, 5, 7], {}).eq(6)) return "median of 1,5,7,9 is 6";
      try {
        Expr.eval(["exec", "x"], {});
        return "unknown operator accepted";
      } catch (e) {
        return Expr.validate(["exec", "x"]).length === 1 ? true : "validate missed it";
      }
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

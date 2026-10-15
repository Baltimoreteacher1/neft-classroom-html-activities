/* EWL.Expr — a tiny, safe expression language shared by the Counterexample Forge and the Invariant Hunter.
 *
 * Bot rules, true answers, repair options and "what stays the same?" quantities are DATA, not code:
 * a node is a variable name (string), an integer (number) or [op, ...args]. Everything is evaluated with EWL.Rat,
 * so equality is exact. There is no eval, no Function, and no way for data or student text to run code.
 *
 *   ["add"|"sub"|"mul"|"div", a, b]    arithmetic          ["pow", a, n]   integer power, |n| <= 12
 *   ["gt", a, b]                       1 if a > b else 0   ["if", c, t, e] t when c is not 0, else e
 *   ["num", a] ["den", a]              numerator / denominator of the reduced fraction
 *   ["places", a]                      digits after the decimal point      ["tenths", a]  the tenths digit
 *   ["floor", a] ["abs", a]            ["k", "3/5"]                        an exact constant
 *
 *   EWL.Expr.evaluate(node, env)       -> Rat (throws RangeError on divide by zero or a bad node)
 *   EWL.Expr.attempt(node, env)        -> Rat | null (null when the rule cannot be computed there)
 *   EWL.Expr.validate(node, vars)      -> [problems]
 *   EWL.Expr.parse("b - a", vars)      -> {ok, node} | {ok:false, error, errorEs}   (student-typed quantities)
 *   EWL.Expr.show(node)                -> readable text
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];

  var ARITY = {
    add: 2,
    sub: 2,
    mul: 2,
    div: 2,
    pow: 2,
    gt: 2,
    if: 3,
    num: 1,
    den: 1,
    places: 1,
    tenths: 1,
    floor: 1,
    abs: 1,
    k: 1,
  };
  var MAX_NODES = 80;
  var MAX_DEPTH = 12;

  function validate(node, vars) {
    var problems = [];
    var count = 0;
    (function walk(n, depth) {
      count++;
      if (depth > MAX_DEPTH) return problems.push("too deep");
      if (typeof n === "string") {
        if (vars && vars.indexOf(n) < 0) problems.push("unknown variable " + n);
        return;
      }
      if (typeof n === "number") {
        if (!Number.isInteger(n) || Math.abs(n) > 1e6) problems.push("bad integer " + n);
        return;
      }
      if (!Array.isArray(n) || typeof n[0] !== "string" || !(n[0] in ARITY))
        return problems.push("bad node " + JSON.stringify(n));
      if (n.length - 1 !== ARITY[n[0]])
        return problems.push(n[0] + " takes " + ARITY[n[0]] + " arguments");
      if (n[0] === "k") {
        if (!EWL.Rat.parse(n[1])) problems.push("bad constant " + n[1]);
        return;
      }
      for (var i = 1; i < n.length; i++) walk(n[i], depth + 1);
    })(node, 0);
    if (count > MAX_NODES) problems.push("too many nodes");
    return problems;
  }

  function places(r) {
    var d = r.decimal(40);
    if (d.repeating || !d.terminating) return 40;
    var i = d.text.indexOf(".");
    return i < 0 ? 0 : d.text.length - i - 1;
  }

  function evaluate(node, env) {
    var R = EWL.Rat;
    if (typeof node === "string") {
      if (!env || !(node in env)) throw new RangeError("Expr: unbound variable " + node);
      return env[node];
    }
    if (typeof node === "number") return R.of(node);
    var op = node[0];
    if (op === "k") return R.parse(node[1]);
    var a = evaluate(node[1], env);
    switch (op) {
      case "add":
        return a.add(evaluate(node[2], env));
      case "sub":
        return a.sub(evaluate(node[2], env));
      case "mul":
        return a.mul(evaluate(node[2], env));
      case "div":
        return a.div(evaluate(node[2], env));
      case "pow": {
        var e = evaluate(node[2], env);
        if (!e.isInt() || e.abs().gt(12))
          throw new RangeError("Expr: exponent must be a small integer");
        return a.pow(Number(e.n));
      }
      case "gt":
        return evaluate(node[2], env).lt(a) ? R.ONE : R.ZERO;
      case "if":
        return a.isZero() ? evaluate(node[3], env) : evaluate(node[2], env);
      case "num":
        return R.of(a.n);
      case "den":
        return R.of(a.d);
      case "places":
        return R.of(places(a));
      case "tenths": {
        var t = a.abs().mul(10).floor();
        return R.of(t % 10n);
      }
      case "floor":
        return R.of(a.floor());
      case "abs":
        return a.abs();
      default:
        throw new RangeError("Expr: bad op " + op);
    }
  }
  function attempt(node, env) {
    try {
      return evaluate(node, env);
    } catch (_e) {
      return null;
    }
  }

  var SYM = { add: "+", sub: "−", mul: "×", div: "÷" };
  function show(n) {
    if (typeof n === "string") return n;
    if (typeof n === "number") return String(n);
    var op = n[0];
    if (op === "k") return String(n[1]);
    if (SYM[op]) return "(" + show(n[1]) + " " + SYM[op] + " " + show(n[2]) + ")";
    if (op === "pow") return show(n[1]) + "^" + show(n[2]);
    if (op === "abs") return "|" + show(n[1]) + "|";
    return op + "(" + n.slice(1).map(show).join(", ") + ")";
  }

  /* ---- student-typed quantities: a small recursive-descent parser, never eval ---- */
  function parse(text, vars) {
    var src = String(text == null ? "" : text)
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/[−–—]/g, "-")
      .toLowerCase();
    function fail(en, es) {
      return { ok: false, error: en, errorEs: es };
    }
    if (!src.trim())
      return fail("Type or build a quantity first.", "Escribe o arma una cantidad primero.");
    if (src.length > 40)
      return fail(
        "That is too long. Try something shorter.",
        "Es demasiado largo. Prueba algo más corto.",
      );
    var toks = src.match(/\d+(?:\.\d+)?|[a-z][a-z0-9]*|[-+*/^()]|\S/g) || [];
    var i = 0;
    var bad = null;
    function peek() {
      return toks[i];
    }
    function expr() {
      var l = term();
      while (peek() === "+" || peek() === "-") {
        var o = toks[i++];
        l = [o === "+" ? "add" : "sub", l, term()];
      }
      return l;
    }
    function term() {
      var l = unary();
      while (peek() === "*" || peek() === "/") {
        var o = toks[i++];
        l = [o === "*" ? "mul" : "div", l, unary()];
      }
      return l;
    }
    function unary() {
      if (peek() === "-") {
        i++;
        return ["sub", 0, unary()];
      }
      return power();
    }
    function power() {
      var b = atom();
      if (peek() === "^") {
        i++;
        var e = toks[i++];
        if (!/^\d+$/.test(e || "") || Number(e) > 6 || Number(e) < 1)
          bad =
            bad ||
            fail("Use a power from 1 to 6, like a^2.", "Usa una potencia de 1 a 6, como a^2.");
        else b = ["pow", b, Number(e)];
      }
      return b;
    }
    function atom() {
      var t = toks[i++];
      if (t === undefined) {
        bad = bad || fail("The quantity ends too soon.", "La cantidad termina muy pronto.");
        return 0;
      }
      if (/^\d/.test(t)) return ["k", t];
      if (t === "(") {
        var inner = expr();
        if (toks[i++] !== ")")
          bad = bad || fail("A bracket is not closed.", "Falta cerrar un paréntesis.");
        return inner;
      }
      if (t === "abs" && peek() === "(") {
        i++;
        var a = expr();
        if (toks[i++] !== ")")
          bad = bad || fail("A bracket is not closed.", "Falta cerrar un paréntesis.");
        return ["abs", a];
      }
      if (/^[a-z]/.test(t)) {
        if (vars && vars.indexOf(t) < 0)
          bad =
            bad ||
            fail(
              '"' + t + '" is not one of the numbers in this hunt.',
              '"' + t + '" no es uno de los números de esta búsqueda.',
            );
        return t;
      }
      bad = bad || fail('I do not understand "' + t + '".', 'No entiendo "' + t + '".');
      return 0;
    }
    var node = expr();
    if (!bad && i < toks.length)
      bad = fail("I could not read all of that.", "No pude leer todo eso.");
    if (bad) return bad;
    var problems = validate(node, vars);
    if (problems.length)
      return fail(
        "That quantity is too big to test.",
        "Esa cantidad es demasiado grande para probar.",
      );
    return { ok: true, node: node };
  }

  EWL.Expr = { evaluate: evaluate, attempt: attempt, validate: validate, parse: parse, show: show };
  EWL.selfTests.push({
    name: "Expr: exact evaluation and safe parsing",
    run: function () {
      var R = EWL.Rat;
      var env = { a: R.of(1, 2), b: R.of(3, 4) };
      var ok =
        evaluate(["add", "a", "b"], env).eq(R.of(5, 4)) &&
        parse("b - a", ["a", "b"]).ok &&
        !parse("alert(1)", ["a", "b"]).ok &&
        evaluate(parse("(a+b)*4", ["a", "b"]).node, env).eq(5) &&
        attempt(["div", "a", 0], env) === null;
      return { ok: ok };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

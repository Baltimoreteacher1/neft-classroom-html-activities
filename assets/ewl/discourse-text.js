/* EWL.DiscourseText — turns a Discourse argument into words, and Tier 3 formulas into an AST.
 *
 *   DiscourseText.toText(ast, tpl)     one paragraph (scored by EWL.Reason.scoreArgument, saved in the Evidence Notebook)
 *   DiscourseText.claimText(claim, tpl) / caseText(case, tpl) / evalText(case, tpl) / exprText(expr, tpl, top)
 *   DiscourseText.parseClaim(text, tpl) -> {claim} | {error}     Tier 3: "q < a when b > 1"; a small recursive-descent
 *                                        parser (numbers, + - * / brackets, named quantities); there is no eval.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var D = function () {
    return EWL.Discourse;
  };
  function tr(en, es) {
    return EWL.t ? EWL.t(en, es) : en;
  }
  function names(tpl) {
    return D().names(tpl);
  }
  function allIds(tpl) {
    return names(tpl).map(function (n) {
      return n.id;
    });
  }
  function varIds(tpl) {
    return Object.keys(tpl.vars);
  }
  function env(tpl, cv) {
    return D().env(tpl, cv);
  }
  var OPS = { eq: "=", ne: "≠", lt: "<", gt: ">", le: "≤", ge: "≥" };
  var OP_WORDS = {
    eq: ["is equal to", "es igual a"],
    ne: ["is not equal to", "no es igual a"],
    lt: ["is less than", "es menor que"],
    gt: ["is greater than", "es mayor que"],
    le: ["is at most", "es como máximo"],
    ge: ["is at least", "es al menos"],
  };
  /* ---------- text ---------- */
  function nameOf(tpl, id) {
    var n = names(tpl).filter(function (x) {
      return x.id === id;
    })[0];
    return n ? tr(n.short, n.shortEs) : id;
  }
  var SYM = { add: "+", sub: "−", mul: "×", div: "÷" };
  function exprText(x, tpl, top) {
    if (typeof x === "string") return /^[A-Za-z_]/.test(x) ? nameOf(tpl, x) : x;
    if (typeof x === "number") return String(x);
    if (Array.isArray(x) && SYM[x[0]] && x.length === 3) {
      var s = exprText(x[1], tpl, false) + " " + SYM[x[0]] + " " + exprText(x[2], tpl, false);
      return top ? s : "(" + s + ")";
    }
    if (Array.isArray(x) && x[0] === "abs") return "|" + exprText(x[1], tpl, true) + "|";
    if (Array.isArray(x) && OPS[x[0]])
      return exprText(x[1], tpl, true) + " " + OPS[x[0]] + " " + exprText(x[2], tpl, true);
    if (Array.isArray(x) && x[0] === "and")
      return x
        .slice(1)
        .map(function (y) {
          return exprText(y, tpl, true);
        })
        .join(tr(" and ", " y "));
    return "…";
  }
  function claimText(c, tpl) {
    var ow = OP_WORDS[c.op];
    var s =
      exprText(c.left, tpl, true) + " " + tr(ow[0], ow[1]) + " " + exprText(c.right, tpl, true);
    return c.when != null ? s + tr(", when ", ", cuando ") + exprText(c.when, tpl, true) : s;
  }
  function caseText(cv, tpl) {
    return varIds(tpl)
      .map(function (id) {
        return nameOf(tpl, id) + " = " + cv[id];
      })
      .join(", ");
  }
  function evalText(cv, tpl) {
    try {
      var e = env(tpl, cv);
      return (tpl.quantities || [])
        .map(function (q) {
          return nameOf(tpl, q.id) + " = " + EWL.LabExpr.fmt(e[q.id], q.fmt || "num");
        })
        .join(", ");
    } catch (err) {
      return "";
    }
  }
  function toText(ast, tpl) {
    var parts = [tr("I claim that ", "Afirmo que ") + claimText(ast.claim, tpl) + "."];
    if (ast.claim.text) parts.push(ast.claim.text);
    ast.because.forEach(function (n, i) {
      var lead =
        i === 0 ? tr("This is true because ", "Esto es cierto porque ") : tr("Also ", "Además ");
      if (n.type === "reason") parts.push(lead + n.text + ".");
      else
        parts.push(
          lead +
            tr("when ", "cuando ") +
            caseText(n.case, tpl) +
            ", " +
            evalText(n.case, tpl) +
            ".",
        );
    });
    ast.but.forEach(function (n) {
      parts.push(
        tr("But when ", "Pero cuando ") +
          caseText(n.case, tpl) +
          ", " +
          evalText(n.case, tpl) +
          (n.text ? ": " + n.text : "") +
          ".",
      );
    });
    parts.push(tr("So ", "Entonces ") + claimText(ast.so.claim, tpl) + ".");
    if (ast.so.text) parts.push(ast.so.text);
    return parts.join(" ");
  }

  /* ---------- Tier 3: parse "q < a when b > 1" with no eval ---------- */
  function tokenize(src) {
    var toks = [];
    var re = /\s*(<=|>=|!=|≤|≥|≠|[<>=+\-−*×/÷()%&]|\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*)/y;
    var m;
    var pos = 0;
    src = String(src);
    while (pos < src.length) {
      re.lastIndex = pos;
      m = re.exec(src);
      if (!m) {
        if (/^\s*$/.test(src.slice(pos))) break;
        return { error: "I cannot read " + JSON.stringify(src.slice(pos, pos + 6)) };
      }
      toks.push(m[1]);
      pos = re.lastIndex;
    }
    return { toks: toks };
  }
  function parseExpr(toks, i, ids) {
    function term(j) {
      var r = factor(j);
      while (
        r.ok &&
        (toks[r.i] === "*" || toks[r.i] === "×" || toks[r.i] === "/" || toks[r.i] === "÷")
      ) {
        var op = toks[r.i] === "*" || toks[r.i] === "×" ? "mul" : "div";
        var rhs = factor(r.i + 1);
        if (!rhs.ok) return rhs;
        r = { ok: true, v: [op, r.v, rhs.v], i: rhs.i };
      }
      return r;
    }
    function factor(j) {
      var t = toks[j];
      if (t === undefined) return { ok: false, error: "The formula stops too soon" };
      if (t === "-" || t === "−") {
        var f = factor(j + 1);
        return f.ok ? { ok: true, v: ["neg", f.v], i: f.i } : f;
      }
      if (t === "(") {
        var inner = sum(j + 1);
        if (!inner.ok) return inner;
        if (toks[inner.i] !== ")") return { ok: false, error: "A bracket is not closed" };
        return { ok: true, v: inner.v, i: inner.i + 1 };
      }
      if (/^\d/.test(t)) {
        if (toks[j + 1] === "%") return { ok: true, v: ["div", t, "100"], i: j + 2 };
        return { ok: true, v: t, i: j + 1 };
      }
      if (/^[A-Za-z_]/.test(t)) {
        if (ids.indexOf(t) < 0) return { ok: false, error: t + " is not one of the quantities" };
        return { ok: true, v: t, i: j + 1 };
      }
      return { ok: false, error: "I did not expect " + t };
    }
    function sum(j) {
      var r = term(j);
      while (r.ok && (toks[r.i] === "+" || toks[r.i] === "-" || toks[r.i] === "−")) {
        var op = toks[r.i] === "+" ? "add" : "sub";
        var rhs = term(r.i + 1);
        if (!rhs.ok) return rhs;
        r = { ok: true, v: [op, r.v, rhs.v], i: rhs.i };
      }
      return r;
    }
    return sum(i);
  }
  var CMP = {
    "<": "lt",
    ">": "gt",
    "=": "eq",
    "<=": "le",
    ">=": "ge",
    "!=": "ne",
    "≤": "le",
    "≥": "ge",
    "≠": "ne",
  };
  function parseCompare(toks, ids) {
    var l = parseExpr(toks, 0, ids);
    if (!l.ok) return l;
    var op = CMP[toks[l.i]];
    if (!op) return { ok: false, error: "Use <, >, =, ≤, ≥ or ≠ between the two sides" };
    var r = parseExpr(toks, l.i + 1, ids);
    if (!r.ok) return r;
    return { ok: true, op: op, left: l.v, right: r.v, i: r.i };
  }
  function parseClaim(text, tpl) {
    var ids = allIds(tpl);
    var parts = String(text).split(/\s+(?:when|cuando)\s+/i);
    if (parts.length > 2)
      return { error: tr('Use "when" only once.', 'Usa "cuando" solo una vez.') };
    var tk = tokenize(parts[0]);
    if (tk.error) return { error: tk.error };
    var c = parseCompare(tk.toks, ids);
    if (!c.ok) return { error: c.error };
    if (c.i !== tk.toks.length)
      return {
        error: tr(
          "There is extra text after the formula.",
          "Hay texto extra después de la fórmula.",
        ),
      };
    var claim = { type: "claim", op: c.op, left: c.left, right: c.right };
    if (parts[1]) {
      var wt = tokenize(parts[1].replace(/\s+and\s+/gi, " & "));
      if (wt.error) return { error: wt.error };
      var groups = [[]];
      wt.toks.forEach(function (t) {
        if (t === "&") groups.push([]);
        else groups[groups.length - 1].push(t);
      });
      var conds = [];
      for (var i = 0; i < groups.length; i++) {
        var g = parseCompare(groups[i], ids);
        if (!g.ok || g.i !== groups[i].length)
          return {
            error:
              g.error ||
              tr('I cannot read the "when" part.', 'No puedo leer la parte de "cuando".'),
          };
        conds.push([g.op, g.left, g.right]);
      }
      claim.when = conds.length === 1 ? conds[0] : ["and"].concat(conds);
    }
    return { claim: claim };
  }

  EWL.DiscourseText = {
    OPS: OPS,
    OP_WORDS: OP_WORDS,
    toText: toText,
    claimText: claimText,
    caseText: caseText,
    evalText: evalText,
    exprText: exprText,
    parseClaim: parseClaim,
  };
})(typeof window !== "undefined" ? window : globalThis);

/* EWL.Discourse — Executable Discourse: a Because / But / So argument that actually runs.
 *
 * The argument is a small AST (never free-form code):
 *   { v:1, template:"fraction-division", tier:1|2|3,
 *     claim:   {type:"claim", op:"lt", left:EXPR, right:EXPR, when?:BOOL-EXPR, text?},
 *     because: [ {type:"reason", text} | {type:"evidence", case:{a:"3", b:"1/2"}} ],
 *     but:     [ {type:"counter", case:{...}, text} ],
 *     so:      {type:"so", claim:{type:"claim", ...}, text?} }
 * EXPR is an EWL.LabExpr expression over the template's variables and named quantities. validate() rejects unknown node
 * types, unknown keys, unknown operators and unknown variables. verify() RUNS the claim over the template's sweep with
 * exact EWL.Rat arithmetic: a case where the claim fails is a counterexample the But clause must address, and the So
 * clause (the revised claim) must hold on every case its "when" allows.
 *
 *   Discourse.validate(ast, tpl)      -> [problems]
 *   Discourse.verify(ast, tpl)        -> {claim, because[], but[], so, checks[], complete}
 *   (words and Tier 3 formula parsing live in discourse-text.js: EWL.DiscourseText.toText / parseClaim)
 *   Discourse.cases(tpl) / env(tpl, case) / names(tpl)
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];

  var OPS = { eq: "=", ne: "≠", lt: "<", gt: ">", le: "≤", ge: "≥" };
  var NODE_KEYS = {
    claim: ["type", "op", "left", "right", "when", "text"],
    so: ["type", "claim", "text"],
    reason: ["type", "text", "id"],
    evidence: ["type", "case"],
    counter: ["type", "case", "text"],
  };
  var TOP_KEYS = ["v", "template", "tier", "claim", "because", "but", "so"];
  var MAX_CASES = 600;
  var MAX_TEXT = 400;
  var MAX_NODES = 12;

  function E() {
    return EWL.LabExpr;
  }
  function isObj(x) {
    return x && typeof x === "object" && !Array.isArray(x);
  }
  function tr(en, es) {
    return EWL.t ? EWL.t(en, es) : en;
  }

  /* ---------- template access ---------- */
  function varIds(tpl) {
    return Object.keys(tpl.vars);
  }
  function names(tpl) {
    var out = varIds(tpl).map(function (id) {
      var v = tpl.vars[id];
      return {
        id: id,
        kind: "var",
        label: v.label,
        labelEs: v.labelEs,
        short: v.short || v.label,
        shortEs: v.shortEs || v.labelEs,
      };
    });
    (tpl.quantities || []).forEach(function (q) {
      out.push({
        id: q.id,
        kind: "qty",
        label: q.label,
        labelEs: q.labelEs,
        short: q.short || q.label,
        shortEs: q.shortEs || q.labelEs,
      });
    });
    return out;
  }
  function allIds(tpl) {
    return names(tpl).map(function (n) {
      return n.id;
    });
  }
  function cases(tpl) {
    if (tpl.cases) return tpl.cases.slice(0, MAX_CASES);
    var out = [{}];
    varIds(tpl).forEach(function (id) {
      var next = [];
      out.forEach(function (c) {
        tpl.vars[id].values.forEach(function (v) {
          var n = Object.assign({}, c);
          n[id] = v;
          next.push(n);
        });
      });
      out = next;
    });
    return out.slice(0, MAX_CASES);
  }
  function env(tpl, caseVals) {
    var e = {};
    varIds(tpl).forEach(function (id) {
      var r = EWL.Rat.parse(caseVals[id]);
      if (!r) throw new RangeError("bad value for " + id);
      e[id] = r;
    });
    (tpl.quantities || []).forEach(function (q) {
      e[q.id] = E().eval(q.expr, e);
    });
    return e;
  }

  /* ---------- validation ---------- */
  function checkKeys(node, type, problems, where) {
    Object.keys(node).forEach(function (k) {
      if (NODE_KEYS[type].indexOf(k) < 0) problems.push(where + ": unknown field " + k);
    });
  }
  function checkText(t, problems, where) {
    if (t != null && (typeof t !== "string" || t.length > MAX_TEXT))
      problems.push(where + ": bad text");
  }
  function checkCase(c, tpl, problems, where) {
    if (!isObj(c)) return problems.push(where + ": case is not an object");
    Object.keys(c).forEach(function (k) {
      if (!tpl.vars[k]) problems.push(where + ": unknown variable " + k);
    });
    varIds(tpl).forEach(function (id) {
      var r = EWL.Rat.parse(c[id]);
      if (c[id] == null || !r) problems.push(where + ": " + id + " needs a number");
      else if (r.abs().cmp(1000000) > 0) problems.push(where + ": " + id + " is out of range");
    });
  }
  function checkClaim(c, tpl, problems, where) {
    if (!isObj(c) || c.type !== "claim") return problems.push(where + ": expected a claim node");
    checkKeys(c, "claim", problems, where);
    if (!OPS[c.op]) problems.push(where + ": unknown comparison " + c.op);
    var ids = allIds(tpl);
    ["left", "right"].forEach(function (side) {
      if (c[side] == null) problems.push(where + ": missing " + side);
      else
        E()
          .validate(c[side], ids)
          .forEach(function (p) {
            problems.push(where + "." + side + ": " + p);
          });
    });
    if (c.when != null)
      E()
        .validate(c.when, ids)
        .forEach(function (p) {
          problems.push(where + ".when: " + p);
        });
    checkText(c.text, problems, where);
  }
  function validate(ast, tpl) {
    var p = [];
    if (!isObj(ast)) return ["argument is not an object"];
    Object.keys(ast).forEach(function (k) {
      if (TOP_KEYS.indexOf(k) < 0) p.push("unknown field " + k);
    });
    if (ast.v !== 1) p.push("unsupported version");
    if (ast.template !== tpl.id) p.push("argument belongs to template " + ast.template);
    if ([1, 2, 3].indexOf(ast.tier) < 0) p.push("tier must be 1, 2 or 3");
    checkClaim(ast.claim, tpl, p, "claim");
    ["because", "but"].forEach(function (k) {
      var list = ast[k];
      if (!Array.isArray(list)) return p.push(k + " must be a list");
      if (list.length > MAX_NODES) p.push(k + " has too many parts");
      list.forEach(function (n, i) {
        var where = k + "[" + i + "]";
        var okType = k === "because" ? ["reason", "evidence"] : ["counter"];
        if (!isObj(n) || okType.indexOf(n.type) < 0)
          return p.push(where + ": unknown node type " + (isObj(n) ? n.type : typeof n));
        checkKeys(n, n.type, p, where);
        checkText(n.text, p, where);
        if (n.type !== "reason") checkCase(n.case, tpl, p, where);
        if (n.type === "reason" && !n.text) p.push(where + ": reason needs text");
      });
    });
    if (!isObj(ast.so) || ast.so.type !== "so") p.push("so: expected a so node");
    else {
      checkKeys(ast.so, "so", p, "so");
      checkText(ast.so.text, p, "so");
      checkClaim(ast.so.claim, tpl, p, "so.claim");
    }
    return p;
  }

  /* ---------- execution ---------- */
  function evalClaim(c, e) {
    if (c.when != null) {
      var w = E().eval(c.when, e);
      if (w !== true && w !== false) throw new RangeError("when must be true or false");
      if (!w) return { applies: false, holds: false };
    }
    return { applies: true, holds: E().eval([c.op, c.left, c.right], e) === true };
  }
  function runClaim(c, tpl) {
    var res = { total: 0, applicable: 0, holds: 0, fails: [], undef: 0 };
    cases(tpl).forEach(function (cv) {
      res.total++;
      try {
        var e = env(tpl, cv);
        var r = evalClaim(c, e);
        if (!r.applies) return;
        res.applicable++;
        if (r.holds) res.holds++;
        else res.fails.push({ case: cv, env: e });
      } catch (_err) {
        res.undef++;
      }
    });
    return res;
  }
  function sameClaim(a, b) {
    function core(c) {
      return JSON.stringify([c.op, c.left, c.right, c.when == null ? null : c.when]);
    }
    return core(a) === core(b);
  }
  function words(s) {
    return String(s || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }
  function check(id, ok, en, es) {
    return { id: id, ok: ok, text: tr(en, es) };
  }

  /** Runs everything. `complete` means the claim, its counterexamples and the revised claim all passed. */
  function verify(ast, tpl) {
    var problems = validate(ast, tpl);
    if (problems.length) return { valid: false, problems: problems, complete: false, checks: [] };
    var claim = runClaim(ast.claim, tpl);
    var failing = claim.fails.length > 0;
    var because = ast.because.map(function (n) {
      if (n.type !== "evidence") return { type: n.type, ok: true, status: "reason" };
      try {
        var e = env(tpl, n.case);
        var r = evalClaim(ast.claim, e);
        var rs = evalClaim(ast.so.claim, e);
        var good = (r.applies && r.holds) || (rs.applies && rs.holds);
        return {
          type: "evidence",
          ok: good,
          status: good ? "supports" : !r.applies && !rs.applies ? "outside" : "breaks",
        };
      } catch (_e) {
        return { type: "evidence", ok: false, status: "undefined" };
      }
    });
    var but = ast.but.map(function (n) {
      var genuine = false;
      try {
        var r = evalClaim(ast.claim, env(tpl, n.case));
        genuine = r.applies && !r.holds;
      } catch (_e) {
        genuine = false;
      }
      return { genuine: genuine, answered: words(n.text) >= 3, ok: genuine && words(n.text) >= 3 };
    });
    var soRun = runClaim(ast.so.claim, tpl);
    var changed = !sameClaim(ast.claim, ast.so.claim);
    var soOk = soRun.applicable > 0 && soRun.fails.length === 0 && (!failing || changed);
    var hasEvidence = because.some(function (b) {
      return b.status === "supports";
    });
    var butOk =
      !failing ||
      but.some(function (b) {
        return b.ok;
      });
    var checks = [
      check(
        "claim",
        claim.applicable > 0,
        claim.applicable > 0
          ? failing
            ? "Your claim was tested on " +
              claim.applicable +
              " cases. It fails on " +
              claim.fails.length +
              "."
            : "Your claim was tested on " + claim.applicable + " cases. It holds on all of them."
          : "Your claim never applies to any case, so there is nothing to test.",
        claim.applicable > 0
          ? failing
            ? "Tu afirmación se probó en " +
              claim.applicable +
              " casos. Falla en " +
              claim.fails.length +
              "."
            : "Tu afirmación se probó en " + claim.applicable + " casos. Se cumple en todos."
          : "Tu afirmación no se aplica a ningún caso, así que no hay nada que probar.",
      ),
      check(
        "because",
        hasEvidence,
        hasEvidence
          ? "Your Because cites a case that supports the claim."
          : "Add a case from the tests to your Because that supports the claim.",
        hasEvidence
          ? "Tu Porque cita un caso que apoya la afirmación."
          : "Agrega a tu Porque un caso de las pruebas que apoye la afirmación.",
      ),
      check(
        "but",
        butOk,
        failing
          ? butOk
            ? "Your But names a real case where the claim fails and says what happens."
            : "A case breaks your claim. Put one in your But and say what happens there."
          : "No case breaks your claim. You can still say when it might not work.",
        failing
          ? butOk
            ? "Tu Pero nombra un caso real donde la afirmación falla y dice qué pasa."
            : "Un caso rompe tu afirmación. Ponlo en tu Pero y di qué pasa ahí."
          : "Ningún caso rompe tu afirmación. Aun así puedes decir cuándo podría no funcionar.",
      ),
      check(
        "so",
        soOk,
        soOk
          ? "Your So holds on all " + soRun.applicable + " cases it covers."
          : soRun.fails.length
            ? "Your So still fails on " + soRun.fails.length + " of the cases it covers."
            : failing && !changed
              ? "Change your So so it takes care of the case that broke your claim."
              : "Your So has to cover at least one case.",
        soOk
          ? "Tu Entonces se cumple en los " + soRun.applicable + " casos que cubre."
          : soRun.fails.length
            ? "Tu Entonces todavía falla en " + soRun.fails.length + " de los casos que cubre."
            : failing && !changed
              ? "Cambia tu Entonces para que se ocupe del caso que rompió tu afirmación."
              : "Tu Entonces tiene que cubrir al menos un caso.",
      ),
    ];
    return {
      valid: true,
      problems: [],
      claim: claim,
      because: because,
      but: but,
      so: soRun,
      soChanged: changed,
      checks: checks,
      complete: claim.applicable > 0 && hasEvidence && butOk && soOk,
    };
  }

  EWL.Discourse = {
    OPS: OPS,
    names: names,
    cases: cases,
    env: env,
    validate: validate,
    verify: verify,
    runClaim: runClaim,
    words: words,
    serialize: function (ast) {
      return JSON.stringify(ast);
    },
    parse: function (json, tpl) {
      var ast;
      try {
        ast = JSON.parse(json);
      } catch (_e) {
        return { ast: null, problems: ["not valid JSON"] };
      }
      var p = validate(ast, tpl);
      return p.length ? { ast: null, problems: p } : { ast: ast, problems: [] };
    },
  };

  var DEMO = {
    id: "demo",
    vars: { a: { label: "a", values: ["3", "1/2"] }, b: { label: "b", values: ["1/2", "2"] } },
    quantities: [{ id: "q", label: "q", expr: ["div", "a", "b"] }],
  };
  EWL.selfTests.push({
    name: "discourse: a false claim fails on the sweep, an unknown node type is rejected",
    run: function () {
      var claim = { type: "claim", op: "lt", left: "q", right: "a" };
      var ast = {
        v: 1,
        template: "demo",
        tier: 1,
        claim: claim,
        because: [],
        but: [],
        so: { type: "so", claim: claim },
      };
      var v = verify(ast, DEMO);
      if (!v.valid || v.claim.fails.length !== 2) return "claim should fail on 2 of 4 cases";
      ast.because.push({ type: "script", text: "x" });
      return validate(ast, DEMO).length > 0 ? true : "unknown node accepted";
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

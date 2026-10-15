/* EWL.Invariant — the logic of the Invariant Hunter (no DOM). Data: data/ewl/invariants.json.
 *
 * A hunt is a state (named exact numbers), a set of allowed moves, and candidate quantities. Moves and quantities are
 * EWL.Expr programs, so every claim is tested by really applying random move sequences with exact EWL.Rat:
 *
 *   EWL.Invariant.test(hunt, node, {runs, seed}) -> {runs, held, firstBreak|null, undefined}
 *       "held in N of N" or the first break: {start, steps:[{move, params, before, after}], from, to}
 *   EWL.Invariant.truths(hunt)         -> ids of the candidates that hold (computed, never read from data)
 *   EWL.Invariant.apply(hunt, state, moveId, params) -> new state | null
 *   EWL.Invariant.randomRun(hunt, rng, steps) -> {start, steps}
 *   EWL.Invariant.text(hunt, state, lang) -> the state written for the student
 *   EWL.Invariant.validate(data)       -> [problems]
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];
  var DEFAULT_RUNS = 500;

  function moveOf(hunt, id) {
    return (
      hunt.moves.filter(function (m) {
        return m.id === id;
      })[0] || null
    );
  }
  function varIds(hunt) {
    return hunt.vars.map(function (v) {
      return v.id;
    });
  }
  function paramIds(m) {
    return (m.params || []).map(function (p) {
      return p.id;
    });
  }

  /** Apply one move: every variable named in move.set is recomputed from the old state and the chosen parameters. */
  function apply(hunt, state, moveId, params) {
    var m = moveOf(hunt, moveId);
    if (!m) return null;
    var env = Object.assign({}, state, params || {});
    var next = Object.assign({}, state);
    var ids = Object.keys(m.set);
    for (var i = 0; i < ids.length; i++) {
      var v = EWL.Expr.attempt(m.set[ids[i]], env);
      if (!v) return null;
      next[ids[i]] = v;
    }
    return next;
  }

  function startState(hunt, rng) {
    var s = {};
    hunt.vars.forEach(function (v) {
      s[v.id] = EWL.Rat.parse(rng.pick(hunt.start[v.id]));
    });
    return s;
  }
  function randomParams(m, rng) {
    var p = {};
    (m.params || []).forEach(function (q) {
      p[q.id] = EWL.Rat.parse(rng.pick(q.pool));
    });
    return p;
  }
  function randomRun(hunt, rng, steps) {
    var start = startState(hunt, rng);
    var cur = start;
    var out = [];
    for (var i = 0; i < steps; i++) {
      var m = rng.pick(hunt.moves);
      var params = randomParams(m, rng);
      var nxt = apply(hunt, cur, m.id, params);
      if (!nxt) continue;
      out.push({ move: m.id, params: params, before: cur, after: nxt });
      cur = nxt;
    }
    return { start: start, steps: out };
  }

  function test(hunt, node, opts) {
    opts = opts || {};
    var runs = opts.runs || DEFAULT_RUNS;
    var rng = EWL.rng(EWL.hash("invariant:" + hunt.id + ":" + (opts.seed || 0)));
    var held = 0;
    var undef = 0;
    var firstBreak = null;
    for (var r = 0; r < runs; r++) {
      var run = randomRun(hunt, rng, 1 + (r % 5));
      var q0 = EWL.Expr.attempt(node, run.start);
      var bad = null;
      if (!q0) undef++;
      for (var i = 0; q0 && i < run.steps.length && !bad; i++) {
        var q = EWL.Expr.attempt(node, run.steps[i].after);
        if (!q || !q.eq(q0)) bad = { to: q, step: i };
      }
      if (q0 && !bad) held++;
      else if (q0 && !firstBreak)
        firstBreak = {
          start: run.start,
          steps: run.steps.slice(0, bad.step + 1),
          from: q0,
          to: bad.to,
        };
    }
    return {
      runs: runs,
      held: held,
      undefined: undef,
      firstBreak: firstBreak,
      holds: held === runs,
    };
  }

  function truths(hunt) {
    return hunt.candidates
      .filter(function (c) {
        return test(hunt, EWL.Expr.parse(c.expr, varIds(hunt)).node).holds;
      })
      .map(function (c) {
        return c.id;
      });
  }

  function fmt(r) {
    return r.isTerminating() && !r.isInt() ? r.decimal(4).text : r.mixed();
  }
  /** The state as a sentence. {x} is the value; {x±} is "+ 5" or "− 5" for equations. */
  function text(hunt, state, lang) {
    var tpl = lang === "es" && hunt.stateTextEs ? hunt.stateTextEs : hunt.stateText;
    return tpl.replace(/\{(\w+)(±?)\}/g, function (m, k, sg) {
      var v = state[k];
      if (!v) return m;
      if (sg) return (v.sign() < 0 ? "− " : "+ ") + fmt(v.abs());
      return fmt(v);
    });
  }

  function validate(data) {
    var problems = [];
    if (!data || !Array.isArray(data.hunts) || data.hunts.length < 6)
      return ["need at least 6 hunts"];
    var seen = {};
    data.hunts.forEach(function (h) {
      var P = function (m) {
        problems.push(h.id + ": " + m);
      };
      if (!EWL.ID_RE.test("ewl.invariant." + h.id)) P("bad slug");
      if (seen[h.id]) P("duplicate id");
      seen[h.id] = 1;
      ["title", "titleEs", "story", "storyEs", "stateText", "stateTextEs", "standard"].forEach(
        function (k) {
          if (!h[k] || typeof h[k] !== "string") P("missing " + k);
        },
      );
      if (typeof h.unit !== "number" || !Array.isArray(h.lessons) || !h.lessons.length)
        P("unit and lessons[] required");
      if (!Array.isArray(h.vars) || !h.vars.length || !h.start) return P("vars and start required");
      var vars = varIds(h);
      h.vars.forEach(function (v) {
        if (!v.label || !v.labelEs) P("var " + v.id + " needs labels");
        if (!h.start[v.id] || !h.start[v.id].length) P("no start pool for " + v.id);
        else
          h.start[v.id].forEach(function (s) {
            if (!EWL.Rat.parse(s)) P("bad start value " + s);
          });
      });
      if (!Array.isArray(h.moves) || !h.moves.length) return P("moves required");
      h.moves.forEach(function (m) {
        if (!m.label || !m.labelEs || !m.set) return P("move " + m.id + " needs labels and set");
        var names = vars.concat(paramIds(m));
        Object.keys(m.set).forEach(function (k) {
          if (vars.indexOf(k) < 0) P("move " + m.id + " sets unknown variable " + k);
          EWL.Expr.validate(m.set[k], names).forEach(function (x) {
            P("move " + m.id + ": " + x);
          });
        });
        (m.params || []).forEach(function (q) {
          if (!q.label || !q.labelEs || !q.pool || q.pool.length < 2)
            P("param " + q.id + " needs labels and a pool");
        });
      });
      if (!Array.isArray(h.candidates) || h.candidates.length < 4) return P("need 4+ candidates");
      h.candidates.forEach(function (c) {
        if (!c.label || !c.labelEs) P("candidate " + c.id + " needs labels");
        if (!EWL.Expr.parse(c.expr, vars).ok) P("candidate " + c.id + " expression does not parse");
      });
      if (!h.why || !Array.isArray(h.why.vocab) || !h.why.vocab.length) P("why.vocab required");
      if (
        !h.candidates.some(function (c) {
          return c.expr;
        })
      )
        return;
      var t = truths(h);
      if (!t.length) P("no candidate holds");
      if (t.length === h.candidates.length) P("every candidate holds");
    });
    return problems;
  }

  EWL.Invariant = {
    DEFAULT_RUNS: DEFAULT_RUNS,
    apply: apply,
    randomRun: randomRun,
    startState: startState,
    test: test,
    truths: truths,
    text: text,
    fmt: fmt,
    validate: validate,
  };
  EWL.selfTests.push({
    name: "Invariant: hunts valid, true quantities hold, false ones break",
    run: function () {
      var d = EWL.Invariant.data;
      if (!d) return { ok: true, note: "invariants.json not loaded on this page yet" };
      var p = validate(d);
      return { ok: p.length === 0, problems: p };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

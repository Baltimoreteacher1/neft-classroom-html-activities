/* EWL.Forge — the logic of the Counterexample Forge (no DOM). The page code is forge.js; the data is data/ewl/forge-bots.json.
 *
 * A "bot" runs a plausible-but-wrong rule. The rule, the true answer and every repair option are tiny declarative
 * programs (see forge-expr.js) evaluated with exact EWL.Rat, so nothing is decided by a float or by a flag in the data:
 *
 *   EWL.Forge.parseInputs(bot, {a: "3/4", b: "0.5"}) -> {ok, env, disp} | {ok:false, field, error, errorEs}
 *   EWL.Forge.botSays(bot, env) / EWL.Forge.truth(bot, env)   -> Rat | null
 *   EWL.Forge.check(bot, env)       -> {said, truth, breaks}   the engine really runs both and compares with Rat.eq
 *   EWL.Forge.show(bot, rat, disp, lang)                       how an answer is written for the student
 *   EWL.Forge.sweep(bot, program, extraEnvs) -> {total, passed, failed, firstFail}
 *       200+ seeded inputs from the bot's pools plus the student's own counterexamples, exact arithmetic.
 *   EWL.Forge.judgePatch(bot, repair, counterexamples) -> {accepted, sweep}
 *   EWL.Forge.hint(bot, step, lang) -> {kind, text}   question -> picture -> suggested range. Never the failing input.
 *   EWL.Forge.validate(data)        -> [problems]      shape, bilingual text, programs, authored examples
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.selfTests = EWL.selfTests || [];

  var SWEEP_SIZE = 240;
  var MAX_RAW = 14;
  var HINT_KINDS = ["question", "picture", "range"];

  function R() {
    return EWL.Rat;
  }
  function X() {
    return EWL.Expr;
  }
  function inputIds(bot) {
    return bot.inputs.map(function (i) {
      return i.id;
    });
  }
  function bilingual(en, es, lang) {
    return lang === "es" && es ? es : en;
  }

  function parseInputs(bot, raw) {
    var env = {};
    var disp = {};
    for (var i = 0; i < bot.inputs.length; i++) {
      var spec = bot.inputs[i];
      var text = String((raw && raw[spec.id]) == null ? "" : raw[spec.id]).trim();
      var bad = function (en, es) {
        return { ok: false, field: spec.id, error: en, errorEs: es };
      };
      if (!text || text.length > MAX_RAW)
        return bad(
          "Type a number for " + spec.label + ", like " + spec.example + ".",
          "Escribe un número para " + (spec.labelEs || spec.label) + ", como " + spec.example + ".",
        );
      var v = R().parse(text);
      if (!v)
        return bad(
          '"' + text + '" is not a number I can read. Try ' + spec.example + ".",
          '"' + text + '" no es un número que pueda leer. Prueba con ' + spec.example + ".",
        );
      var lo = R().parse(spec.min);
      var hi = R().parse(spec.max);
      if (v.lt(lo) || (spec.minOpen && v.eq(lo)) || v.gt(hi))
        return bad(spec.rangeNote, spec.rangeNoteEs || spec.rangeNote);
      env[spec.id] = v;
      disp[spec.id] = text;
    }
    return { ok: true, env: env, disp: disp };
  }

  function botSays(bot, env) {
    return X().attempt(bot.rule, env);
  }
  function truth(bot, env) {
    return X().attempt(bot.truth, env);
  }
  function check(bot, env) {
    var said = botSays(bot, env);
    var t = truth(bot, env);
    return { said: said, truth: t, breaks: !(said && t && said.eq(t)) };
  }

  function fill(label, disp) {
    return String(label).replace(/\{(\w+)\}/g, function (m, k) {
      return disp && disp[k] != null ? disp[k] : m;
    });
  }
  /** How an answer is written for the student. `disp` is what they typed for each input. */
  function show(bot, r, disp, lang) {
    if (!r) return bilingual("(cannot be worked out)", "(no se puede calcular)", lang);
    var o = bot.out;
    if (o.format === "choice") {
      var c = o.choices[Number(r.n)];
      return c ? fill(bilingual(c.en, c.es, lang), disp) : r.frac();
    }
    if (o.format === "percent") return r.percent();
    if (o.format === "frac") return r.mixed();
    var d = r.isTerminating() ? r.decimal(6).text : r.mixed();
    var unit = bilingual(o.unit, o.unitEs, lang);
    return unit ? d + " " + unit : d;
  }

  var poolCache = {};
  function poolOf(bot, spec) {
    var key = bot.id + ":" + spec.id;
    if (!poolCache[key])
      poolCache[key] = spec.pool.map(function (s) {
        return R().parse(s);
      });
    return poolCache[key];
  }
  function sweepCases(bot, n) {
    var rng = EWL.rng(EWL.hash("forge:" + bot.id));
    var cases = [];
    for (var i = 0; i < n; i++) {
      var env = {};
      bot.inputs.forEach(function (spec) {
        env[spec.id] = rng.pick(poolOf(bot, spec));
      });
      cases.push(env);
    }
    return cases;
  }

  /** Run `program` against the true answer on a seeded sweep plus the student's own counterexamples. */
  function sweep(bot, program, extra) {
    var cases = sweepCases(bot, SWEEP_SIZE).concat(extra || []);
    var failed = 0;
    var firstFail = null;
    cases.forEach(function (env) {
      var said = X().attempt(program, env);
      var t = truth(bot, env);
      if (said && t && said.eq(t)) return;
      failed++;
      if (!firstFail) firstFail = { env: env, said: said, truth: t };
    });
    return {
      total: cases.length,
      passed: cases.length - failed,
      failed: failed,
      firstFail: firstFail,
    };
  }
  function judgePatch(bot, repair, counterexamples) {
    var s = sweep(bot, repair.rule, counterexamples);
    return { accepted: s.failed === 0 && s.total >= 200, sweep: s };
  }

  function hint(bot, step, lang) {
    step = Math.max(0, Math.min(step | 0, HINT_KINDS.length - 1));
    var h = bot.hints;
    var text;
    if (step === 0) {
      var rule = bot.reasonRule && EWL.Reason ? EWL.Reason.ruleFor(bot.reasonRule) : null;
      text = rule
        ? bilingual(rule.nudge, rule.nudgeEs, lang)
        : bilingual(h.question, h.questionEs, lang);
    } else if (step === 1) text = bilingual(h.picture, h.pictureEs, lang);
    else text = bilingual(h.range, h.rangeEs, lang);
    return { kind: HINT_KINDS[step], text: text, canAskMore: step < HINT_KINDS.length - 1 };
  }

  /* ---- data validation (shape only; lesson / standard membership is checked by tools/ewl-modes.test.mjs) ---- */
  function validate(data) {
    var problems = [];
    var ids = {};
    var P = function (b, m) {
      problems.push((b && b.id ? b.id + ": " : "") + m);
    };
    if (!data || !Array.isArray(data.bots) || data.bots.length < 5) return ["need at least 5 bots"];
    data.bots.forEach(function (b) {
      if (!EWL.ID_RE.test("ewl.forge." + b.id)) P(b, "bad slug");
      if (ids[b.id]) P(b, "duplicate id");
      ids[b.id] = 1;
      [
        "name",
        "persona",
        "personaEs",
        "ruleWords",
        "ruleWordsEs",
        "task",
        "taskEs",
        "standard",
      ].forEach(function (k) {
        if (!b[k] || typeof b[k] !== "string") P(b, "missing " + k);
      });
      if (!Array.isArray(b.lessons) || !b.lessons.length || typeof b.unit !== "number")
        P(b, "lessons[] and unit required");
      var lines = b.lines || {};
      ["hello", "found", "tryAgain", "patched", "bye"].forEach(function (k) {
        if (!lines[k] || !lines[k + "Es"]) P(b, "line " + k + " needs EN and ES");
      });
      ["question", "picture", "range"].forEach(function (k) {
        if (!b.hints || !b.hints[k] || !b.hints[k + "Es"]) P(b, "hint " + k + " needs EN and ES");
      });
      if (!Array.isArray(b.inputs) || !b.inputs.length) return P(b, "inputs required");
      var vars = inputIds(b);
      b.inputs.forEach(function (i) {
        ["id", "label", "labelEs", "example", "min", "max", "rangeNote", "rangeNoteEs"].forEach(
          function (k) {
            if (i[k] === undefined || i[k] === "") P(b, "input " + i.id + " missing " + k);
          },
        );
        if (!Array.isArray(i.pool) || i.pool.length < 6)
          P(b, "input " + i.id + " pool needs 6+ values");
        else
          i.pool.forEach(function (s) {
            var v = R().parse(s);
            if (!v || v.lt(R().parse(i.min)) || v.gt(R().parse(i.max)))
              P(b, "pool value outside range: " + s);
          });
      });
      if (!b.out || !b.out.format) P(b, "out.format required");
      [
        ["truth", b.truth],
        ["rule", b.rule],
      ].forEach(function (p) {
        X()
          .validate(p[1], vars)
          .forEach(function (m) {
            P(b, p[0] + ": " + m);
          });
      });
      if (!Array.isArray(b.repairs) || b.repairs.length < 4) return P(b, "need 4+ repair options");
      b.repairs.forEach(function (r) {
        if (!r.id || !r.text || !r.textEs) P(b, "repair needs id, text, textEs");
        X()
          .validate(r.rule, vars)
          .forEach(function (m) {
            P(b, "repair " + r.id + ": " + m);
          });
      });
      var showMe = parseInputs(b, b.showMe || {});
      if (!showMe.ok) P(b, "showMe is not valid input");
      else if (!check(b, showMe.env).breaks) P(b, "showMe does not break the rule");
      var start = parseInputs(b, b.starter || {});
      if (!start.ok) P(b, "starter is not valid input");
      if (!b.argument || !Array.isArray(b.argument.vocab) || !b.argument.vocab.length)
        P(b, "argument.vocab required");
    });
    return problems;
  }

  EWL.Forge = {
    SWEEP_SIZE: SWEEP_SIZE,
    parseInputs: parseInputs,
    botSays: botSays,
    truth: truth,
    check: check,
    show: show,
    fill: fill,
    sweepCases: sweepCases,
    sweep: sweep,
    judgePatch: judgePatch,
    hint: hint,
    validate: validate,
  };
  EWL.selfTests.push({
    name: "Forge: bot data is valid and every rule breaks",
    run: function () {
      var d = EWL.Forge.data;
      if (!d) return { ok: true, note: "forge-bots.json not loaded on this page yet" };
      var p = validate(d);
      var allBreak = d.bots.every(function (b) {
        return sweep(b, b.rule).failed > 0 && sweep(b, b.truth).failed === 0;
      });
      return { ok: p.length === 0 && allBreak, problems: p };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);

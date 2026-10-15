/* EWL.Reason — the shared, deterministic reasoning and feedback engine.
 *
 * Every Curriculum 2.0 surface (Living Math Canvas, Math Reality Lab, Counterexample Forge, Executable Discourse)
 * asks this module the same three questions:
 *
 *   1. What misconception does this wrong answer match?         EWL.Reason.diagnose(task, attempt)
 *   2. What is the next help that does not give the answer away?  EWL.Reason.ladder(task, attempt, step)
 *   3. Is this written argument complete?                          EWL.Reason.scoreArgument(text, spec)
 *
 * It is the only authority. An AI reply (EWL.Reason.coach) is optional, advisory, labelled as such, and is
 * never consulted for correctness: the server endpoint (/api/reasoning/review) already refuses to state the
 * answer, and this module additionally drops any reply that prints a number the student did not write.
 *
 * Misconception rules are DATA: { id, kinds, wrong(task) -> Rat, name, nameEs, nudge, nudgeEs, counter(task) }.
 * `wrong` recomputes what the flawed procedure would produce, so a rule matches by value, not by guesswork,
 * and tools/ewl-core.test.mjs can prove every rule disagrees with the correct answer on every task it builds.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var R = EWL.Rat;
  if (!R) throw new Error("EWL.Reason needs EWL.Rat (load rational.js first)");

  /* ---------- tasks: a prompt, the true answer, and the ingredients the flawed procedures work from ---------- */
  var Task = {
    fracAdd: function (a, b) {
      a = R.parse(a);
      b = R.parse(b);
      return { kind: "frac-add", facts: { a: a, b: b }, answer: a.add(b) };
    },
    fracCompare: function (a, b) {
      a = R.parse(a);
      b = R.parse(b);
      return { kind: "frac-compare", facts: { a: a, b: b }, answer: a.cmp(b) > 0 ? a : b };
    },
    decimalCompare: function (a, b) {
      a = R.parse(a);
      b = R.parse(b);
      return {
        kind: "decimal-compare",
        facts: { a: a, b: b, as: String(a.decimal().text), bs: String(b.decimal().text) },
        answer: a.cmp(b) > 0 ? a : b,
      };
    },
    /** p1 off, then p2 off of the new price. Answer = the single equivalent percent off. */
    percentStack: function (p1, p2) {
      p1 = R.parse(p1);
      p2 = R.parse(p2);
      var left = R.ONE.sub(p1).mul(R.ONE.sub(p2));
      return { kind: "percent-stack", facts: { p1: p1, p2: p2 }, answer: R.ONE.sub(left) };
    },
    /** x% of a, where the student may use the wrong whole. */
    percentOf: function (pct, whole) {
      pct = R.parse(pct);
      whole = R.parse(whole);
      return { kind: "percent-of", facts: { pct: pct, whole: whole }, answer: pct.mul(whole) };
    },
    unitPrice: function (qa, pa, qb, pb) {
      qa = R.parse(qa);
      pa = R.parse(pa);
      qb = R.parse(qb);
      pb = R.parse(pb);
      var ua = pa.div(qa);
      var ub = pb.div(qb);
      return {
        kind: "unit-price",
        facts: { qa: qa, pa: pa, qb: qb, pb: pb, ua: ua, ub: ub },
        answer: ua.cmp(ub) < 0 ? R.of(1) : R.of(2),
      };
    },
    scaleVolume: function (l, w, h, k) {
      l = R.parse(l);
      w = R.parse(w);
      h = R.parse(h);
      k = R.parse(k);
      return {
        kind: "scale-volume",
        facts: { l: l, w: w, h: h, k: k },
        answer: l.mul(w).mul(h).mul(k.pow(3)).div(l.mul(w).mul(h)),
      };
    },
    divideFractions: function (a, b) {
      a = R.parse(a);
      b = R.parse(b);
      return { kind: "frac-divide", facts: { a: a, b: b }, answer: a.div(b) };
    },
  };

  /* ---------- misconception rules ---------- */
  var RULES = [];
  function rule(r) {
    RULES.push(r);
    return r;
  }
  rule({
    id: "add-denominators",
    kinds: ["frac-add"],
    wrong: function (t) {
      return R.of(t.facts.a.n + t.facts.b.n, t.facts.a.d + t.facts.b.d);
    },
    name: "Added the tops and added the bottoms",
    nameEs: "Sumó los numeradores y los denominadores",
    nudge:
      "Fractions count equal-sized pieces. When you add the bottoms, did the size of the pieces stay the same?",
    nudgeEs:
      "Las fracciones cuentan partes del mismo tamaño. Al sumar los denominadores, ¿el tamaño de las partes se mantuvo igual?",
    counter: function (_t) {
      return "Try 1/2 + 1/2 with your method. Your method gives 2/4. Is half a pizza plus half a pizza only half a pizza?";
    },
  });
  rule({
    id: "bigger-denominator-bigger",
    kinds: ["frac-compare"],
    wrong: function (t) {
      return t.facts.a.d > t.facts.b.d ? t.facts.a : t.facts.b;
    },
    name: "Picked the fraction with the bigger bottom number",
    nameEs: "Eligió la fracción con el denominador mayor",
    nudge: "Cut a bar into more pieces. Are the pieces bigger or smaller?",
    nudgeEs: "Corta una barra en más partes. ¿Las partes quedan más grandes o más pequeñas?",
    counter: function () {
      return "Compare 1/8 and 1/2 on two bars the same length. Which piece is longer?";
    },
  });
  rule({
    id: "longer-decimal-bigger",
    kinds: ["decimal-compare"],
    wrong: function (t) {
      var la = t.facts.as.replace(/^[^.]*\.?/, "").length;
      var lb = t.facts.bs.replace(/^[^.]*\.?/, "").length;
      if (la === lb) return t.facts.a.cmp(t.facts.b) > 0 ? t.facts.b : t.facts.a;
      return la > lb ? t.facts.a : t.facts.b;
    },
    name: "Picked the decimal with more digits",
    nameEs: "Eligió el decimal con más dígitos",
    nudge:
      "Write both with the same number of places, like tenths and hundredths. Does the longer one still look bigger?",
    nudgeEs: "Escribe ambos con la misma cantidad de lugares. ¿El más largo todavía se ve mayor?",
    counter: function () {
      return "Is 0.25 of a dollar more than 0.3 of a dollar? Think 25 cents and 30 cents.";
    },
  });
  rule({
    id: "percent-stack",
    kinds: ["percent-stack"],
    wrong: function (t) {
      return t.facts.p1.add(t.facts.p2);
    },
    name: "Added the two percents",
    nameEs: "Sumó los dos porcentajes",
    nudge:
      "The second percent is taken off a different amount than the first. What is the price after the first discount?",
    nudgeEs:
      "El segundo porcentaje se quita de una cantidad distinta a la primera. ¿Cuál es el precio después del primer descuento?",
    counter: function (t) {
      var after1 = R.of(100).mul(R.ONE.sub(t.facts.p1));
      var after2 = after1.mul(R.ONE.sub(t.facts.p2));
      return (
        "Start with $100. After " +
        t.facts.p1.percent() +
        " off you pay $" +
        after1.decimal(2).text +
        ". After the next " +
        t.facts.p2.percent() +
        " you pay $" +
        after2.decimal(2).text +
        ". How much was taken off $100 altogether?"
      );
    },
  });
  rule({
    id: "percent-wrong-whole",
    kinds: ["percent-of"],
    wrong: function (t) {
      return t.facts.pct.mul(100);
    },
    name: "Used the percent as a plain number",
    nameEs: "Usó el porcentaje como un número simple",
    nudge: "A percent is a part out of 100. What fraction of the whole is it?",
    nudgeEs: "Un porcentaje es una parte de 100. ¿Qué fracción del entero es?",
    counter: function () {
      return "Is 50% of 80 equal to 50? Half of 80 is how much?";
    },
  });
  rule({
    id: "unit-price-total",
    kinds: ["unit-price"],
    wrong: function (t) {
      return t.facts.pa.cmp(t.facts.pb) < 0 ? R.of(1) : R.of(2);
    },
    name: "Compared total prices, not price per item",
    nameEs: "Comparó precios totales, no el precio por unidad",
    nudge:
      "The packages hold different amounts. How could you make the amounts equal before you compare?",
    nudgeEs:
      "Los paquetes tienen cantidades distintas. ¿Cómo igualarías las cantidades antes de comparar?",
    counter: function () {
      return "A $3 bag of 3 and a $4 bag of 8: is the cheaper price tag the cheaper way to buy one?";
    },
  });
  rule({
    id: "scale-volume-linear",
    kinds: ["scale-volume"],
    wrong: function (t) {
      return t.facts.k;
    },
    name: "Thought volume grows by the same factor as the edges",
    nameEs: "Pensó que el volumen crece por el mismo factor que las aristas",
    nudge:
      "Volume has three directions: length, width and height. How many of them did you stretch?",
    nudgeEs: "El volumen tiene tres direcciones. ¿Cuántas estiraste?",
    counter: function () {
      return "Build a 2 x 2 x 2 cube from 1 x 1 x 1 cubes. How many small cubes fit inside?";
    },
  });
  rule({
    id: "divide-no-flip",
    kinds: ["frac-divide"],
    wrong: function (t) {
      return t.facts.a.mul(t.facts.b);
    },
    name: "Multiplied instead of using the reciprocal",
    nameEs: "Multiplicó en lugar de usar el recíproco",
    nudge:
      "Dividing asks how many of the second fit in the first. Should that number be bigger or smaller than the first?",
    nudgeEs:
      "Dividir pregunta cuántos del segundo caben en el primero. ¿Ese número debería ser mayor o menor que el primero?",
    counter: function () {
      return "How many 1/2s fit in 3? Does multiplying 3 x 1/2 tell you?";
    },
  });

  function ruleSetFor(kind) {
    return RULES.filter(function (r) {
      return r.kinds.indexOf(kind) >= 0;
    });
  }

  /** attempt: {value: Rat|string|number|null}. Returns {correct, rule|null}. */
  function diagnose(task, attempt) {
    var v = attempt && attempt.value != null ? R.parse(attempt.value) : null;
    if (!v) return { correct: false, rule: null, reason: "unreadable" };
    if (v.eq(task.answer)) return { correct: true, rule: null };
    var rules = ruleSetFor(task.kind);
    for (var i = 0; i < rules.length; i++) {
      var w = rules[i].wrong(task);
      if (w && v.eq(w)) return { correct: false, rule: rules[i] };
    }
    return { correct: false, rule: null, reason: "no-match" };
  }

  /* ---------- the help ladder: question -> picture -> counterexample -> (only then) reveal ---------- */
  var STEPS = ["question", "representation", "counterexample", "reveal"];
  function ladder(task, attempt, step, lang) {
    step = Math.max(0, Math.min(step | 0, STEPS.length - 1));
    var es = lang === "es";
    var d = diagnose(task, attempt);
    var r = d.rule;
    var out = {
      step: step,
      kind: STEPS[step],
      rule: r ? r.id : null,
      canAskMore: step < STEPS.length - 1,
    };
    if (d.correct) {
      out.text = es
        ? "Eso concuerda. Ahora explica por qué funciona."
        : "That matches. Now explain why it works.";
      out.canAskMore = false;
      return out;
    }
    if (step === 0) {
      out.text = r
        ? es
          ? r.nudgeEs
          : r.nudge
        : es
          ? "Lee la pregunta otra vez. ¿Qué te piden encontrar?"
          : "Read the question again. What are you asked to find?";
    } else if (step === 1) {
      out.text = es
        ? "Mira la representación: ¿qué muestra tu respuesta en la imagen?"
        : "Look at the picture: where does your answer show up in it?";
    } else if (step === 2) {
      out.text = r
        ? r.counter(task)
        : es
          ? "Prueba tu método con números más pequeños y compara."
          : "Try your method on smaller numbers and compare.";
    } else {
      // The reveal never comes from an unattempted problem and always shows the model, not just the number.
      out.text = es
        ? "Aquí está el resultado verificado: " + task.answer.frac()
        : "Here is the checked result: " + task.answer.frac();
      out.reveal = task.answer.frac();
    }
    return out;
  }

  /* ---------- written arguments: a rubric a student can see, never a grade ---------- */
  var CONNECT =
    /\b(because|since|so|therefore|that means|which means|this shows|thus)\b|\b(porque|ya que|por lo tanto|entonces|eso significa|esto muestra)\b/i;
  var LIMIT =
    /\b(but|unless|only when|only if|however|except|not always|doesn't work|does not work|if not)\b|\b(pero|a menos que|solo si|solo cuando|sin embargo|excepto|no siempre)\b/i;

  /**
   * spec: { numbers: ["28%", "$72"], vocab: ["discount","percent"], needLimit: true, minWords: 12 }
   * numbers = values the investigation produced; citing one counts as using evidence. A student's own numbers
   * that are not in the list still count when they equal a listed value (28% == 0.28).
   */
  function scoreArgument(text, spec) {
    spec = spec || {};
    var t = String(text || "").trim();
    var words = t ? t.split(/\s+/).length : 0;
    var cited = false;
    var nums = (t.match(/-?\$?\d[\d,]*(?:\.\d+)?%?|\d+\s*\/\s*\d+/g) || [])
      .map(function (s) {
        return R.parse(s);
      })
      .filter(Boolean);
    (spec.numbers || []).forEach(function (n) {
      var rn = R.parse(n);
      if (
        rn &&
        nums.some(function (x) {
          return x.eq(rn);
        })
      )
        cited = true;
    });
    var lower = t.toLowerCase();
    var usesVocab =
      !(spec.vocab && spec.vocab.length) ||
      spec.vocab.some(function (v) {
        return lower.indexOf(String(v).toLowerCase()) >= 0;
      });
    var checks = [
      {
        id: "claim",
        ok: words >= (spec.minWords || 8),
        label: "States a claim in a full sentence",
        labelEs: "Enuncia una afirmación en una oración completa",
        ask: "What do you claim is true?",
        askEs: "¿Qué afirmas que es verdadero?",
      },
      {
        id: "evidence",
        ok: cited,
        label: "Uses a number from the experiment",
        labelEs: "Usa un número del experimento",
        ask: "Which number from your experiment shows it?",
        askEs: "¿Qué número de tu experimento lo muestra?",
      },
      {
        id: "reason",
        ok: CONNECT.test(t),
        label: "Connects evidence to claim with because or so",
        labelEs: "Conecta la evidencia con la afirmación",
        ask: "Why does that number mean your claim is true?",
        askEs: "¿Por qué ese número significa que tu afirmación es verdadera?",
      },
      {
        id: "vocab",
        ok: usesVocab,
        label: "Uses a math word from the lesson",
        labelEs: "Usa una palabra de matemáticas de la lección",
        ask: "Can you name the math idea with a lesson word?",
        askEs: "¿Puedes nombrar la idea con una palabra de la lección?",
      },
    ];
    if (spec.needLimit)
      checks.push({
        id: "limit",
        ok: LIMIT.test(t),
        label: "Says when it might not work",
        labelEs: "Dice cuándo podría no funcionar",
        ask: "Is there a case where your claim would not work?",
        askEs: "¿Hay un caso en que tu afirmación no funcionaría?",
      });
    var done = checks.filter(function (c) {
      return c.ok;
    }).length;
    var next =
      checks.filter(function (c) {
        return !c.ok;
      })[0] || null;
    return {
      checks: checks,
      done: done,
      total: checks.length,
      complete: done === checks.length,
      next: next,
    };
  }

  /* ---------- optional AI coach: advisory only ---------- */
  function numbersIn(s) {
    return String(s).match(/\d+(?:\.\d+)?/g) || [];
  }
  /** Drops any reply that prints a number neither the student nor the prompt contained. */
  function replySafe(reply, allowedText) {
    var allowed = {};
    numbersIn(allowedText).forEach(function (n) {
      allowed[Number(n)] = 1;
    });
    return numbersIn(reply).every(function (n) {
      return allowed[Number(n)];
    });
  }
  function coach(payload) {
    if (typeof fetch !== "function" || !payload || !payload.response) return Promise.resolve(null);
    var body = {
      prompt: String(payload.prompt || "").slice(0, 600),
      response: String(payload.response).slice(0, 1200),
      language: payload.language === "es" ? "es" : "en",
      level: payload.level || 3,
      turn: payload.turn === 2 ? 2 : 1,
      standard: payload.standard || undefined,
    };
    return fetch("/api/reasoning/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        if (!j || !j.ok) return null;
        var text = [j.gap, j.question].filter(Boolean).join(" ");
        if (!text || !replySafe(text, body.prompt + " " + body.response)) return null;
        return {
          source: "ai",
          gap: j.gap || "",
          question: j.question || "",
          strengths: j.strengths || [],
        };
      })
      .catch(function () {
        return null;
      });
  }

  EWL.Reason = {
    Task: Task,
    rules: function () {
      return RULES.slice();
    },
    ruleFor: function (id) {
      return (
        RULES.filter(function (r) {
          return r.id === id;
        })[0] || null
      );
    },
    registerRule: function (r) {
      if (
        !r ||
        !r.id ||
        !r.kinds ||
        typeof r.wrong !== "function" ||
        !r.nudge ||
        typeof r.counter !== "function"
      )
        throw new TypeError("EWL.Reason.registerRule: id, kinds, wrong, nudge, counter required");
      if (
        RULES.some(function (x) {
          return x.id === r.id;
        })
      )
        throw new Error("EWL.Reason: duplicate rule " + r.id);
      return rule(r);
    },
    diagnose: diagnose,
    ladder: ladder,
    STEPS: STEPS,
    scoreArgument: scoreArgument,
    coach: coach,
    replySafe: replySafe,
  };
})(typeof window !== "undefined" ? window : globalThis);

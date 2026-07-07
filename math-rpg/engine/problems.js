/* =============================================================================
 * Number Realm — Problem Generators (the math core)
 * -----------------------------------------------------------------------------
 * Exposes window.MRPG_PROBLEMS: a registry of topic-slug -> generator(). Each
 * generator returns a plain problem object:
 *
 *   {
 *     prompt:   "string shown to the student",
 *     choices:  ["A","B","C","D"],   // exactly 4, all distinct
 *     answer:   2,                    // index into choices of the correct one
 *     explain:  "one short teaching sentence (method, not just the number)",
 *     standard: "6.NOS.B.4",           // CCSS token (best effort)
 *     topic:    "Greatest Common Factor"
 *   }
 *
 * Design rules that keep the game honest:
 *   - Numbers stay in a Grade-6-appropriate range.
 *   - Every distractor models a *real* misconception where possible, and all
 *     four choices are guaranteed distinct.
 *   - Generators never throw; a bad roll re-rolls. Pure, no DOM, no globals
 *     besides the single registry export. Uses Math.random (browser runtime).
 * ========================================================================== */
(function () {
  "use strict";
  if (window.MRPG_PROBLEMS) return;

  /* ---- small math helpers ------------------------------------------------ */
  function ri(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }
  function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
  }
  function round(n, p) {
    var f = Math.pow(10, p == null ? 2 : p);
    return Math.round(n * f) / f;
  }
  // Trim trailing zeros from a decimal string ("2.50" -> "2.5", "3.00" -> "3").
  function num(n) {
    if (!isFinite(n)) return String(n);
    var s = round(n, 4).toString();
    return s;
  }

  // Difficulty tier selector: returns the tier-1/2/3 value (default tier 1).
  function byTier(tier, t1, t2, t3) {
    return tier >= 3 ? t3 : tier >= 2 ? t2 : t1;
  }

  /* Build a problem from a correct value + a list of wrong values. Dedupes,
   * pads with safe filler if two distractors collided, shuffles, and reports
   * the answer index. `fmt` maps a raw value to its display string. */
  function build(correct, wrongs, opts) {
    opts = opts || {};
    var fmt = opts.fmt || String;
    var seen = {};
    var out = [];
    var correctStr = fmt(correct);
    seen[correctStr] = true;
    out.push(correctStr);
    for (var i = 0; i < wrongs.length && out.length < 4; i++) {
      var s = fmt(wrongs[i]);
      if (s == null || s === "" || seen[s]) continue;
      seen[s] = true;
      out.push(s);
    }
    // Pad with nearby fillers if collisions left us short.
    var bump = 1;
    while (out.length < 4) {
      var cand =
        typeof correct === "number" ? fmt(correct + bump) : correctStr + " " + bump;
      bump = bump > 0 ? -bump : -bump + 1;
      if (!seen[cand]) {
        seen[cand] = true;
        out.push(cand);
      }
      if (Math.abs(bump) > 40) break; // safety
    }
    var choices = shuffle(out);
    return {
      prompt: opts.prompt,
      choices: choices,
      answer: choices.indexOf(correctStr),
      explain: opts.explain || "",
      standard: opts.standard || "",
      topic: opts.topic || "",
    };
  }

  function primeFactorString(n) {
    var factors = [];
    var d = 2;
    var m = n;
    while (m > 1) {
      while (m % d === 0) {
        factors.push(d);
        m /= d;
      }
      d++;
    }
    return factors.join(" × ");
  }

  /* ======================================================================
   * UNIT 1 — Number Sense
   * ==================================================================== */
  function gcf(tier) {
    var hi = byTier(tier, 9, 12, 15);
    var g = ri(2, hi);
    var a = g * ri(2, hi);
    var b = g * ri(2, hi);
    while (gcd(a, b) !== g || a === b) {
      b = g * ri(2, hi);
    }
    var real = gcd(a, b);
    return build(
      real,
      [a * b, lcm(a, b), Math.min(a, b), real * 2],
      {
        prompt: "What is the GCF (greatest common factor) of " + a + " and " + b + "?",
        explain:
          "List the factors of each number and take the largest one they share.",
        standard: "6.NOS.B.4",
        topic: "Greatest Common Factor",
      }
    );
  }

  function lcmProblem() {
    var a = ri(3, 9);
    var b = ri(3, 9);
    while (b === a) b = ri(3, 9);
    var real = lcm(a, b);
    return build(
      real,
      [a * b === real ? a * b + a : a * b, a + b, Math.max(a, b) * 2, gcd(a, b) * 4],
      {
        prompt: "What is the LCM (least common multiple) of " + a + " and " + b + "?",
        explain:
          "List multiples of each number; the first one they share is the LCM.",
        standard: "6.NOS.B.4",
        topic: "Least Common Multiple",
      }
    );
  }

  function primeFactorization() {
    var n = pick([12, 18, 24, 36, 40, 45, 48, 54, 60, 72]);
    var correct = primeFactorString(n);
    // Distractors: include a composite, an off-by-one factoring, product wrong.
    var wrongs = [
      primeFactorString(n).replace(/2/, "4"),
      primeFactorString(n + 2),
      n + " × 1",
    ];
    return build(correct, wrongs, {
      prompt: "Write the prime factorization of " + n + ".",
      explain: "Break the number into a product of primes (2, 3, 5, 7 …).",
      standard: "6.NOS.B.4",
      topic: "Prime Factorization",
      fmt: String,
    });
  }

  function decimalOps() {
    var op = pick(["+", "-", "×"]);
    var a, b, real, prompt;
    if (op === "×") {
      a = round(ri(11, 49) / 10, 1);
      b = round(ri(11, 39) / 10, 1);
      real = round(a * b, 2);
      prompt = "Multiply: " + a + " × " + b;
    } else if (op === "+") {
      a = round(ri(120, 890) / 10, 1);
      b = round(ri(120, 690) / 10, 1);
      real = round(a + b, 1);
      prompt = "Add: " + a + " + " + b;
    } else {
      a = round(ri(400, 990) / 10, 1);
      b = round(ri(50, 390) / 10, 1);
      real = round(a - b, 1);
      prompt = "Subtract: " + a + " − " + b;
    }
    return build(
      real,
      [round(real * 10, 2), round(real / 10, 2), round(real + (op === "×" ? 1 : 0.1), 2)],
      {
        prompt: prompt,
        explain:
          op === "×"
            ? "Multiply as whole numbers, then place the decimal by counting total decimal places."
            : "Line up the decimal points, then add or subtract.",
        standard: "6.NOS.B.3",
        topic: "Decimal Operations",
        fmt: num,
      }
    );
  }

  function divideMultiDigit() {
    var b = ri(12, 39);
    var q = ri(11, 60);
    var a = b * q;
    return build(q, [q + 1, q - 1, Math.round(a / (b + 1))], {
      prompt: "Divide: " + a + " ÷ " + b,
      explain: "Use long division: how many groups of " + b + " fit into " + a + "?",
      standard: "6.NOS.B.2",
      topic: "Divide Multi-Digit Numbers",
    });
  }

  /* ======================================================================
   * UNIT 2 — Fraction Division
   * ==================================================================== */
  function fractionDivision() {
    var n1 = ri(1, 5),
      d1 = ri(2, 6);
    var n2 = ri(1, 5),
      d2 = ri(2, 6);
    while (gcd(n1, d1) !== 1) d1 = ri(2, 6);
    while (gcd(n2, d2) !== 1 || (n2 === n1 && d2 === d1)) {
      n2 = ri(1, 5);
      d2 = ri(2, 6);
    }
    // (n1/d1) ÷ (n2/d2) = (n1*d2)/(d1*n2), reduced.
    var pn = n1 * d2,
      pd = d1 * n2;
    var g = gcd(pn, pd);
    var correct = pn / g + "/" + pd / g;
    // common error: multiply instead of invert
    var mn = n1 * n2,
      md = d1 * d2,
      mg = gcd(mn, md);
    var wrongMult = mn / mg + "/" + md / mg;
    return build(
      correct,
      [wrongMult, pd / g + "/" + pn / g, n1 + "/" + d2],
      {
        prompt:
          "Divide the fractions: " + n1 + "/" + d1 + " ÷ " + n2 + "/" + d2,
        explain:
          "Keep the first fraction, change ÷ to ×, and flip the second (multiply by the reciprocal).",
        standard: "6.NOS.A.1",
        topic: "Divide Fractions",
        fmt: String,
      }
    );
  }

  function wholeByFraction() {
    var w = ri(2, 8);
    var d = ri(2, 6);
    var real = w * d; // w ÷ (1/d) = w*d
    return build(real, [w + d, Math.round(w / d) || 1, w * d + d], {
      prompt: "Divide: " + w + " ÷ 1/" + d,
      explain:
        "Dividing by 1/" + d + " asks how many " + d + "ths are in " + w + " wholes.",
      standard: "6.NOS.A.1",
      topic: "Divide Whole Numbers by Fractions",
    });
  }

  function mixedNumberDivision() {
    // (a whole + 1/2) ÷ (1/2) style, keep clean
    var whole = ri(1, 4);
    var d = pick([2, 4]);
    var improper = whole * d + 1; // (whole and 1/d) as /d
    var divD = pick([2, 3, 4]);
    // (improper/d) ÷ (1/divD) = improper*divD/d
    var pn = improper * divD,
      pd = d,
      g = gcd(pn, pd);
    var correct = pn / g % 1 === 0 ? String(pn / g / (pd / g)) : pn / g + "/" + pd / g;
    // simpler: compute decimal-safe
    var val = (improper / d) / (1 / divD);
    var correctStr = num(round(val, 3));
    return build(
      correctStr,
      [num(round(val / 2, 3)), num(round(val * 2, 3)), num(round(improper / d, 3))],
      {
        prompt:
          "Divide: " + whole + " " + 1 + "/" + d + " ÷ 1/" + divD +
          "  (write " + whole + " and one-" + d + "th as a mixed number)",
        explain:
          "Change the mixed number to an improper fraction, then multiply by the reciprocal.",
        standard: "6.NOS.A.1",
        topic: "Divide Mixed Numbers",
        fmt: String,
      }
    );
  }

  /* ======================================================================
   * UNIT 3 — Ratios
   * ==================================================================== */
  function ratioBasic() {
    var red = ri(2, 8),
      blue = ri(2, 8);
    var g = gcd(red, blue);
    var correct = red / g + ":" + blue / g;
    return build(
      correct,
      [blue / g + ":" + red / g, red + ":" + blue, red + g + ":" + (blue + g)],
      {
        prompt:
          "A box has " + red + " red marbles and " + blue +
          " blue marbles. Write the ratio of red to blue in simplest form.",
        explain:
          "Divide both parts of the ratio by their greatest common factor.",
        standard: "6.AT.A.1",
        topic: "Understand Ratios",
        fmt: String,
      }
    );
  }

  function equivalentRatio() {
    var a = ri(2, 6),
      b = ri(2, 6);
    var k = ri(2, 6);
    var known = a * k;
    var real = b * k; // a:b = known:?
    return build(real, [b + k, known - a + b, Math.round((b / a) * (known + 1))], {
      prompt:
        "The ratio " + a + ":" + b + " is equivalent to " + known + ":? — find the missing value.",
      explain: "Find the multiplier: " + known + " ÷ " + a + " = " + k + ", then multiply " + b + " by it.",
      standard: "6.AT.A.3",
      topic: "Equivalent Ratios",
    });
  }

  function unitRate() {
    var rate = ri(2, 12);
    var units = ri(2, 9);
    var total = rate * units;
    return build(rate, [round(units / total ? total / units : 0, 2), total, units], {
      prompt:
        "A car travels " + total + " miles in " + units +
        " hours. What is the unit rate in miles per hour?",
      explain: "Divide the total by the number of units: " + total + " ÷ " + units + ".",
      standard: "6.AT.A.2",
      topic: "Rates and Unit Rates",
    });
  }

  function compareRatios() {
    // Which is the better buy? unit price
    var q1 = ri(2, 6),
      p1 = q1 * ri(2, 5);
    var q2 = ri(3, 8),
      p2;
    var up1 = p1 / q1;
    // make q2 have a different unit price
    do {
      p2 = ri(4, 40);
    } while (p2 / q2 === up1);
    var up2 = p2 / q2;
    var better =
      up1 < up2 ? "$" + p1 + " for " + q1 : "$" + p2 + " for " + q2;
    var worse =
      up1 < up2 ? "$" + p2 + " for " + q2 : "$" + p1 + " for " + q1;
    return {
      prompt:
        "Which is the better buy (lower unit price)?  A: $" +
        p1 + " for " + q1 + " items   B: $" + p2 + " for " + q2 + " items",
      choices: shuffle([
        better,
        worse,
        "They cost the same per item",
        "Not enough information",
      ]),
      answer: -1, // fixed below
      explain: "Find each unit price ($ ÷ items); the lower one is the better buy.",
      standard: "6.AT.A.3",
      topic: "Compare Ratios",
      __fixAnswer: better,
    };
  }

  /* ======================================================================
   * UNIT 4 — Rates, Percents, Unit Rates
   * ==================================================================== */
  function percentOfNumber(tier) {
    var p = pick(byTier(tier, [10, 20, 25, 50], [10, 20, 25, 40, 50, 60, 75, 80], [5, 15, 25, 35, 45, 60, 75, 90]));
    var whole = pick(byTier(tier, [20, 40, 60, 80, 100], [20, 40, 60, 80, 120, 200, 240], [80, 120, 160, 200, 240, 300, 400]));
    var real = (p / 100) * whole;
    return build(
      real,
      [round((p / 100) * whole * 10, 2), whole - real, round(whole / p, 2)],
      {
        prompt: "What is " + p + "% of " + whole + "?",
        explain: "Change the percent to a decimal (" + p + "% = " + p / 100 + ") and multiply.",
        standard: "6.AT.A.3",
        topic: "Find the Percent of a Number",
        fmt: num,
      }
    );
  }

  function fdpConversion() {
    var pairs = [
      ["1/2", "50%", 0.5],
      ["1/4", "25%", 0.25],
      ["3/4", "75%", 0.75],
      ["1/5", "20%", 0.2],
      ["2/5", "40%", 0.4],
      ["1/10", "10%", 0.1],
      ["3/10", "30%", 0.3],
      ["1/1", "100%", 1],
    ];
    var row = pick(pairs);
    return build(
      row[1],
      shuffle(pairs.filter(function (r) { return r[1] !== row[1]; })).slice(0, 3).map(function (r) { return r[1]; }),
      {
        prompt: "Write the fraction " + row[0] + " as a percent.",
        explain: "A fraction is a percent out of 100: " + row[0] + " = " + row[2] + " = " + row[1] + ".",
        standard: "6.AT.A.3",
        topic: "Relate Fractions, Decimals, and Percents",
        fmt: String,
      }
    );
  }

  function measurementConvert() {
    var conv = pick([
      ["feet", "inches", 12],
      ["yards", "feet", 3],
      ["meters", "centimeters", 100],
      ["kilograms", "grams", 1000],
      ["hours", "minutes", 60],
    ]);
    var amt = ri(2, 9);
    var real = amt * conv[2];
    return build(real, [amt + conv[2], Math.round(amt / conv[2]) || 1, real + conv[2]], {
      prompt: "Convert " + amt + " " + conv[0] + " to " + conv[1] + ".",
      explain: "1 " + conv[0].replace(/s$/, "") + " = " + conv[2] + " " + conv[1] + ", so multiply by " + conv[2] + ".",
      standard: "6.AT.A.3",
      topic: "Convert Measurement Units",
    });
  }

  /* ======================================================================
   * UNIT 5 — Area
   * ==================================================================== */
  function areaParallelogram() {
    var b = ri(4, 15),
      h = ri(3, 12);
    var real = b * h;
    var p = build(real, [round((b * h) / 2, 1), b + h, 2 * (b + h)], {
      prompt: "A parallelogram has base " + b + " and height " + h + ". Find its area.",
      explain: "Area of a parallelogram = base × height.",
      standard: "6.GR.A.1",
      topic: "Area of Parallelograms",
    });
    p.diagram = { kind: "figure", shape: "parallelogram", base: b, height: h };
    return p;
  }

  function areaTriangle() {
    var b = pick([4, 6, 8, 10, 12, 14]);
    var h = ri(3, 12);
    var real = (b * h) / 2;
    var p = build(real, [b * h, b + h, round((b * h) / 4, 1)], {
      prompt: "A triangle has base " + b + " and height " + h + ". Find its area.",
      explain: "Area of a triangle = ½ × base × height.",
      standard: "6.GR.A.1",
      topic: "Area of Triangles",
      fmt: num,
    });
    p.diagram = { kind: "figure", shape: "triangle", base: b, height: h };
    return p;
  }

  function areaTrapezoid() {
    var b1 = ri(4, 10),
      b2 = ri(4, 10),
      h = pick([2, 4, 6, 8]);
    while (b2 === b1) b2 = ri(4, 10);
    var real = ((b1 + b2) / 2) * h;
    var p = build(real, [(b1 + b2) * h, (b1 * b2 * h) / 2, b1 + b2 + h], {
      prompt:
        "A trapezoid has parallel sides " + b1 + " and " + b2 +
        " with height " + h + ". Find its area.",
      explain: "Area of a trapezoid = ½ × (base₁ + base₂) × height.",
      standard: "6.GR.A.1",
      topic: "Area of Trapezoids",
      fmt: num,
    });
    p.diagram = { kind: "figure", shape: "trapezoid", base: b1, b2: b2, height: h };
    return p;
  }

  function areaComposite() {
    // rectangle + square
    var w = ri(5, 10),
      h = ri(3, 6);
    var s = ri(2, 4);
    var real = w * h + s * s;
    var p = build(real, [w * h, w * h * s, (w + s) * (h + s)], {
      prompt:
        "An L-shape is a " + w + "×" + h + " rectangle with a " + s + "×" + s +
        " square added on. Find the total area.",
      explain: "Split the figure into simple shapes, find each area, then add them.",
      standard: "6.GR.A.1",
      topic: "Area of Composite Figures",
    });
    p.diagram = { kind: "figure", shape: "lshape", w: w, h: h, s: s };
    return p;
  }

  /* ======================================================================
   * UNIT 6 — Expressions
   * ==================================================================== */
  function exponents(tier) {
    var base = ri(2, byTier(tier, 6, 8, 10)),
      exp = ri(2, byTier(tier, 3, 3, 4));
    var real = Math.pow(base, exp);
    return build(real, [base * exp, base + exp, Math.pow(base, exp) + base], {
      prompt: "Evaluate the power: " + base + "^" + exp,
      explain: base + "^" + exp + " means " + base + " multiplied by itself " + exp + " times.",
      standard: "6.AT.B.5",
      topic: "Powers and Exponents",
    });
  }

  function evaluateExpression(tier) {
    var x = ri(2, byTier(tier, 8, 12, 20));
    var a = ri(2, byTier(tier, 6, 9, 12)),
      b = ri(1, byTier(tier, 9, 15, 25));
    var real = a * x + b;
    return build(real, [a * (x + b), a + x + b, a * x - b], {
      prompt: "Evaluate " + a + "x + " + b + " when x = " + x + ".",
      explain: "Substitute " + x + " for x, then multiply before you add (order of operations).",
      standard: "6.AT.B.6",
      topic: "Evaluate Expressions",
    });
  }

  function writeExpression() {
    var n = ri(2, 9);
    var phrases = [
      ["7 more than a number n", "n + 7", ["7n", "n − 7", "7 − n"]],
      ["the product of 5 and a number n", "5n", ["5 + n", "n − 5", "n ÷ 5"]],
      ["a number n decreased by 4", "n − 4", ["4 − n", "n + 4", "4n"]],
      ["twice a number n, plus 3", "2n + 3", ["2 + n + 3", "3n + 2", "2(n + 3)"]],
    ];
    var row = pick(phrases);
    return build(row[1], row[2], {
      prompt: 'Write an algebraic expression for: "' + row[0] + '."',
      explain: "Translate each word into a symbol; 'more than' adds, 'product' multiplies.",
      standard: "6.AT.B.6",
      topic: "Write Algebraic Expressions",
      fmt: String,
    });
  }

  function distributive() {
    var a = ri(2, 6),
      b = ri(2, 6),
      c = ri(2, 6);
    var real = a + "x + " + a * c;
    return build(real, [a + "x + " + c, a * b + "x + " + c, a + "x + " + (a + c)], {
      prompt: "Use the distributive property to expand " + a + "(x + " + c + ").",
      explain: "Multiply the outside number by each term inside: " + a + "·x and " + a + "·" + c + ".",
      standard: "6.AT.B.7",
      topic: "The Distributive Property",
      fmt: String,
    });
  }

  function combineLikeTerms() {
    var a = ri(2, 7),
      b = ri(2, 7),
      c = ri(1, 6);
    var real = a + b + "x + " + c;
    return build(real, [a + b + c + "x", a + "x + " + (b + c), a * b + "x + " + c], {
      prompt: "Simplify by combining like terms: " + a + "x + " + b + "x + " + c,
      explain: "Add the coefficients of the x-terms; the constant stays separate.",
      standard: "6.AT.B.7",
      topic: "Simplify Algebraic Expressions",
      fmt: String,
    });
  }

  /* ======================================================================
   * UNIT 7 — Equations & Inequalities
   * ==================================================================== */
  function oneStepEquation() {
    var type = pick(["+", "-", "×"]);
    var x = ri(2, 12);
    var a = ri(2, 9);
    var prompt, real;
    if (type === "+") {
      prompt = "Solve for x:  x + " + a + " = " + (x + a);
      real = x;
    } else if (type === "-") {
      prompt = "Solve for x:  x − " + a + " = " + (x - a);
      real = x;
    } else {
      prompt = "Solve for x:  " + a + "x = " + a * x;
      real = x;
    }
    return build(real, [x + a, x - 1, x + 1], {
      prompt: prompt,
      explain: "Do the inverse operation to both sides to get x by itself.",
      standard: "6.AT.C.8",
      topic: "Solve One-Step Equations",
    });
  }

  function writeEquation() {
    var total = ri(10, 30),
      part = ri(2, 8);
    var rows = [
      [
        "Maria had some stickers. After getting " + part + " more she had " +
          total + ". How many did she start with (x)?",
        "x + " + part + " = " + total,
        ["x − " + part + " = " + total, part + "x = " + total, "x = " + total + " + " + part],
      ],
    ];
    var row = rows[0];
    return build(row[1], row[2], {
      prompt: row[0],
      explain: "Let x be the unknown start; the words describe adding " + part + " to reach " + total + ".",
      standard: "6.AT.C.8",
      topic: "Write Equations",
      fmt: String,
    });
  }

  function inequality() {
    var x = ri(2, 9);
    var a = ri(1, 6);
    return build("x > " + (x + a - a), ["x < " + x, "x = " + x, "x ≥ " + (x + 1)], {
      prompt:
        "Which inequality means 'a number x is greater than " + x + "'?",
      explain: "'Greater than' uses the > symbol, open on the larger side.",
      standard: "6.AT.C.9",
      topic: "Write Inequalities",
      fmt: String,
    });
  }

  /* ======================================================================
   * UNIT 8 — Statistics & Data
   * ==================================================================== */
  function makeDataset(n) {
    var d = [];
    for (var i = 0; i < n; i++) d.push(ri(2, 20));
    return d;
  }
  function mean() {
    var data = makeDataset(pick([4, 5]));
    var sum = data.reduce(function (s, x) { return s + x; }, 0);
    var real = round(sum / data.length, 2);
    var p = build(real, [sum, round(sum / (data.length + 1), 2), Math.max.apply(null, data)], {
      prompt: "Find the mean (average) of the data set below.",
      explain: "Add all the values, then divide by how many there are.",
      standard: "6.DS.B.6",
      topic: "Mean",
      fmt: num,
    });
    p.diagram = { kind: "dotplot", values: data };
    return p;
  }
  function median() {
    var data = makeDataset(5);
    var sorted = data.slice().sort(function (a, b) { return a - b; });
    var real = sorted[2];
    var p = build(real, [data[2], Math.round((sorted[0] + sorted[4]) / 2), sorted[4]], {
      prompt: "Find the median of the data set below: " + data.join(", "),
      explain: "Put the numbers in order, then take the middle value.",
      standard: "6.DS.B.6",
      topic: "Median",
    });
    p.diagram = { kind: "dotplot", values: data };
    return p;
  }
  function rangeStat() {
    var data = makeDataset(5);
    var mx = Math.max.apply(null, data),
      mn = Math.min.apply(null, data);
    var real = mx - mn;
    var p = build(real, [mx + mn, mx, mn], {
      prompt: "Find the range of the data set below: " + data.join(", "),
      explain: "Range = greatest value − least value.",
      standard: "6.DS.B.6",
      topic: "Range",
    });
    p.diagram = { kind: "dotplot", values: data };
    return p;
  }
  function mad() {
    // keep clean: dataset with integer mean
    var m = ri(6, 12);
    var data = [m - 2, m - 1, m, m + 1, m + 2];
    var shuffled = shuffle(data);
    var absDev = data.map(function (x) { return Math.abs(x - m); });
    var real = round(absDev.reduce(function (s, x) { return s + x; }, 0) / data.length, 2);
    var p = build(real, [m, round(real * 2, 2), 0], {
      prompt:
        "The data set below has a mean of " + m +
        ". Find the mean absolute deviation (MAD).",
      explain: "Find each value's distance from the mean, then average those distances.",
      standard: "6.DS.B.6",
      topic: "Mean Absolute Deviation",
      fmt: num,
    });
    p.diagram = { kind: "dotplot", values: shuffled };
    return p;
  }

  /* ======================================================================
   * UNIT 9 — Rational Numbers & Coordinate Plane
   * ==================================================================== */
  function integerOrder() {
    var vals = shuffle([-ri(1, 9), ri(1, 9), -ri(1, 9), 0]).slice(0, 3);
    // dedupe
    var uniq = [];
    vals.forEach(function (v) { if (uniq.indexOf(v) < 0) uniq.push(v); });
    while (uniq.length < 3) {
      var v = ri(-9, 9);
      if (uniq.indexOf(v) < 0) uniq.push(v);
    }
    var least = Math.min.apply(null, uniq);
    var p = build(
      String(least),
      uniq.filter(function (v) { return v !== least; }).map(String),
      {
        prompt: "Which number is the least (smallest)?  " + uniq.join(",  "),
        explain: "On a number line, the number farthest to the left is least.",
        standard: "6.NOS.C.8",
        topic: "Order Integers",
        fmt: String,
      }
    );
    p.diagram = {
      kind: "numberline", min: -10, max: 10,
      marks: uniq.map(function (v) { return { v: v, label: String(v) }; }),
    };
    return p;
  }
  function absoluteValue() {
    var v = -ri(2, 10);
    var real = Math.abs(v);
    var p = build(real, [v, 0, real + 1], {
      prompt: "What is | " + v + " |  (the absolute value of " + v + ")?",
      explain: "Absolute value is the distance from 0, always zero or positive.",
      standard: "6.NOS.C.8",
      topic: "Absolute Value",
    });
    p.diagram = {
      kind: "numberline", min: -10, max: 10,
      marks: [{ v: v, label: String(v) }, { v: 0, label: "0" }],
    };
    return p;
  }
  function quadrant() {
    var x = pick([-1, 1]) * ri(1, 8);
    var y = pick([-1, 1]) * ri(1, 8);
    var q =
      x > 0 && y > 0 ? "I" : x < 0 && y > 0 ? "II" : x < 0 && y < 0 ? "III" : "IV";
    var p = build(
      "Quadrant " + q,
      ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV"].filter(
        function (s) { return s !== "Quadrant " + q; }
      ),
      {
        prompt: "In which quadrant is the plotted point (" + x + ", " + y + ")?",
        explain:
          "Signs decide the quadrant: (+,+)=I, (−,+)=II, (−,−)=III, (+,−)=IV.",
        standard: "6.NOS.C.6",
        topic: "Coordinate Plane",
        fmt: String,
      }
    );
    p.diagram = { kind: "coordinate", points: [{ x: x, y: y }] };
    return p;
  }
  function coordinateDistance() {
    // same x, different y (vertical distance)
    var x = ri(-6, 6);
    var y1 = ri(-8, 0),
      y2 = ri(1, 8);
    var real = Math.abs(y2 - y1);
    var p = build(real, [y1 + y2, Math.abs(y1) + x, Math.abs(y2 - y1) + 1], {
      prompt:
        "Find the distance between (" + x + ", " + y1 + ") and (" + x + ", " + y2 + ").",
      explain:
        "The x-values match, so the points share a vertical line — subtract the y-values (use absolute value).",
      standard: "6.NOS.C.9",
      topic: "Distance on the Coordinate Plane",
    });
    p.diagram = {
      kind: "coordinate", segment: true,
      points: [{ x: x, y: y1 }, { x: x, y: y2 }],
    };
    return p;
  }

  /* ======================================================================
   * UNIT 10 — Volume & Surface Area
   * ==================================================================== */
  function volumePrism() {
    var l = ri(3, 9),
      w = ri(2, 8),
      h = ri(2, 6);
    var real = l * w * h;
    var p = build(real, [l + w + h, 2 * (l * w + l * h + w * h), l * w], {
      prompt:
        "A rectangular prism is " + l + " by " + w + " by " + h +
        ". Find its volume.",
      explain: "Volume of a prism = length × width × height.",
      standard: "6.GR.A.2",
      topic: "Volume of Prisms",
    });
    p.diagram = { kind: "prism", l: l, w: w, h: h };
    return p;
  }
  function volumeFractional() {
    // edge with 1/2 unit -> keep as decimal
    var l = round(ri(3, 8) + 0.5, 1),
      w = ri(2, 6),
      h = ri(2, 5);
    var real = round(l * w * h, 2);
    var p = build(real, [round(l + w + h, 2), round(l * w, 2), round(l * w * h + w, 2)], {
      prompt:
        "A box measures " + l + " × " + w + " × " + h +
        " units. Find its volume.",
      explain: "Volume = length × width × height, even when an edge is a fraction/decimal.",
      standard: "6.GR.A.2",
      topic: "Volume with Fractional Edges",
      fmt: num,
    });
    p.diagram = { kind: "prism", l: l, w: w, h: h };
    return p;
  }
  function surfaceArea() {
    var l = ri(2, 7),
      w = ri(2, 7),
      h = ri(2, 7);
    var real = 2 * (l * w + l * h + w * h);
    var p = build(real, [l * w * h, l * w + l * h + w * h, l + w + h], {
      prompt:
        "Find the surface area of a rectangular prism that is " +
        l + " × " + w + " × " + h + ".",
      explain: "Surface area = 2(lw + lh + wh) — add the areas of all six faces.",
      standard: "6.GR.A.4",
      topic: "Surface Area",
    });
    p.diagram = { kind: "prism", l: l, w: w, h: h };
    return p;
  }
  function surfaceAreaNet() {
    var s = ri(2, 8);
    var real = 6 * s * s;
    var p = build(real, [s * s * s, s * s, 4 * s * s], {
      prompt:
        "A cube has edge length " + s + ". Using its net, find the total surface area.",
      explain: "A cube's net has 6 equal square faces, so surface area = 6 × s².",
      standard: "6.GR.A.4",
      topic: "Surface Area from Nets",
    });
    p.diagram = { kind: "cubenet", s: s };
    return p;
  }

  /* ======================================================================
   * EXPANSION PACK — additional standards coverage
   * ==================================================================== */
  function ratioTable() {
    var a = ri(2, 6), b = ri(2, 8), k = ri(2, 6);
    var inV = a * k, outV = b * k;
    return build(outV, [inV + b, b * k + a, inV], {
      prompt: "A ratio table keeps the ratio " + a + " : " + b + ". If the first column shows " + inV + ", what is the second column?",
      explain: "Find the multiplier (" + inV + " ÷ " + a + " = " + k + "), then multiply " + b + " by it.",
      standard: "6.AT.A.3",
      topic: "Ratio Tables",
    });
  }

  function percentWord() {
    var p = pick([10, 20, 25, 50]);
    var whole = pick([20, 40, 60, 80, 120, 200]);
    var part = (p / 100) * whole;
    var scen = pick([
      ["A store has " + whole + " shirts. " + p + "% are on sale. How many shirts are on sale?", part],
      ["There are " + whole + " students. " + p + "% ride the bus. How many students ride the bus?", part],
      ["A book has " + whole + " pages. You have read " + p + "%. How many pages have you read?", part],
    ]);
    return build(scen[1], [round(scen[1] * 2, 2), whole - scen[1], round(whole / p, 2)], {
      prompt: scen[0],
      explain: p + "% = " + p / 100 + "; multiply by " + whole + ".",
      standard: "6.AT.A.3",
      topic: "Percent Problems",
      fmt: num,
    });
  }

  function orderOfOperations() {
    var a = ri(2, 9), b = ri(2, 5), c = ri(2, 4);
    var real = a + b * (c * c);
    return build(real, [(a + b) * c * c, a + b * c * 2, a * b + c * c], {
      prompt: "Evaluate using order of operations:  " + a + " + " + b + " × " + c + "²",
      explain: "Exponent first (" + c + "² = " + c * c + "), then multiply by " + b + ", then add " + a + ".",
      standard: "6.AT.B.6",
      topic: "Order of Operations",
    });
  }

  function inequalitySolution() {
    var bound = ri(4, 12);
    var correct = bound + ri(1, 5);
    return build(correct, [bound, bound - 1, bound - 2], {
      prompt: "Which value is a solution to  x > " + bound + " ?",
      explain: "A solution must be a number greater than " + bound + ".",
      standard: "6.AT.C.9",
      topic: "Inequality Solutions",
    });
  }

  function dependentVariable() {
    var m = ri(2, 6), x = ri(2, 9);
    var real = m * x;
    return build(real, [m + x, m * (x + 1), real + m], {
      prompt: "In the equation y = " + m + "x, what is y when x = " + x + "?",
      explain: "Substitute x = " + x + ": y = " + m + " × " + x + ". (x is independent, y depends on it.)",
      standard: "6.AT.D.11",
      topic: "Dependent & Independent Variables",
    });
  }

  function oppositeInteger() {
    var v = pick([-1, 1]) * ri(2, 12);
    var real = -v;
    var p = build(real, [v, 0, Math.abs(v) + 1], {
      prompt: "What is the opposite of " + v + "?",
      explain: "The opposite of a number is the same distance from 0, on the other side.",
      standard: "6.NOS.C.6",
      topic: "Opposites",
    });
    p.diagram = { kind: "numberline", min: -13, max: 13, marks: [{ v: v, label: String(v) }, { v: real, label: String(real) }] };
    return p;
  }

  function reflectCoordinate() {
    var x = pick([-1, 1]) * ri(1, 7), y = pick([-1, 1]) * ri(1, 7);
    var axis = pick(["x", "y"]);
    var rx = axis === "x" ? x : -x;
    var ry = axis === "x" ? -y : y;
    var fmtPt = function (px, py) { return "(" + px + ", " + py + ")"; };
    var p = build(fmtPt(rx, ry), [fmtPt(-x, -y), fmtPt(x, y), fmtPt(ry, rx)], {
      prompt: "Reflect the point (" + x + ", " + y + ") across the " + axis + "-axis. What are the new coordinates?",
      explain: "Reflecting across the " + axis + "-axis flips the sign of the " + (axis === "x" ? "y" : "x") + "-coordinate.",
      standard: "6.NOS.C.6",
      topic: "Reflecting Points",
      fmt: String,
    });
    p.diagram = { kind: "coordinate", points: [{ x: x, y: y, label: "start" }, { x: rx, y: ry, label: "image" }] };
    return p;
  }

  function statisticalQuestion() {
    var stat = pick([
      "How tall are the students in my class?",
      "How many minutes do sixth graders sleep each night?",
      "What are the ages of the people at the park?",
      "How many pets do students in this school have?",
    ]);
    var nonstat = shuffle([
      "How old am I?",
      "How many days are in June?",
      "What is my height?",
      "How many students are in this room right now?",
      "What time does school start?",
    ]).slice(0, 3);
    return build(stat, nonstat, {
      prompt: "Which of these is a statistical question (one that expects a variety of answers)?",
      explain: "A statistical question anticipates many different answers, not one fixed fact.",
      standard: "6.DS.A.1",
      topic: "Statistical Questions",
      fmt: String,
    });
  }

  function dotplotRead() {
    var n = ri(8, 12), data = [];
    for (var i = 0; i < n; i++) data.push(ri(3, 8));
    var target = pick(data);
    var count = data.filter(function (v) { return v === target; }).length;
    var p = build(count, [count + 1, Math.max(0, count - 1), n], {
      prompt: "In the dot plot below, how many data points have the value " + target + "?",
      explain: "Count the dots stacked above " + target + ".",
      standard: "6.DS.B.5",
      topic: "Read a Dot Plot",
    });
    p.diagram = { kind: "dotplot", values: data };
    return p;
  }

  /* ---- registry ---------------------------------------------------------- */
  var REGISTRY = {
    // Unit 1
    "gcf": gcf,
    "lcm": lcmProblem,
    "prime-factorization": primeFactorization,
    "decimal-ops": decimalOps,
    "divide-multidigit": divideMultiDigit,
    // Unit 2
    "fraction-division": fractionDivision,
    "whole-by-fraction": wholeByFraction,
    "mixed-number-division": mixedNumberDivision,
    // Unit 3
    "ratio-basic": ratioBasic,
    "equivalent-ratio": equivalentRatio,
    "unit-rate": unitRate,
    "compare-ratios": compareRatios,
    // Unit 4
    "percent-of-number": percentOfNumber,
    "fdp-conversion": fdpConversion,
    "measurement-convert": measurementConvert,
    // Unit 5
    "area-parallelogram": areaParallelogram,
    "area-triangle": areaTriangle,
    "area-trapezoid": areaTrapezoid,
    "area-composite": areaComposite,
    // Unit 6
    "exponents": exponents,
    "evaluate-expression": evaluateExpression,
    "write-expression": writeExpression,
    "distributive": distributive,
    "combine-like-terms": combineLikeTerms,
    // Unit 7
    "one-step-equation": oneStepEquation,
    "write-equation": writeEquation,
    "inequality": inequality,
    // Unit 8
    "mean": mean,
    "median": median,
    "range": rangeStat,
    "mad": mad,
    // Unit 9
    "integer-order": integerOrder,
    "absolute-value": absoluteValue,
    "quadrant": quadrant,
    "coordinate-distance": coordinateDistance,
    // Unit 10
    "volume-prism": volumePrism,
    "volume-fractional": volumeFractional,
    "surface-area": surfaceArea,
    "surface-area-net": surfaceAreaNet,
    // Expansion pack
    "ratio-table": ratioTable,
    "percent-word": percentWord,
    "order-of-operations": orderOfOperations,
    "inequality-solution": inequalitySolution,
    "dependent-variable": dependentVariable,
    "opposite-integer": oppositeInteger,
    "reflect-coordinate": reflectCoordinate,
    "statistical-question": statisticalQuestion,
    "dotplot-read": dotplotRead,
  };

  /* Generate a problem for a topic slug. Falls back to a safe default and
   * always returns a well-formed problem with a valid answer index. */
  function generate(topic, tier) {
    tier = tier === 2 || tier === 3 ? tier : 1;
    var gen = REGISTRY[topic] || gcf;
    var p;
    try {
      p = gen(tier);
    } catch (e) {
      p = gcf(1);
    }
    p.tier = tier;
    // compare-ratios sets a placeholder answer; resolve it here.
    if (p.__fixAnswer != null) {
      p.answer = p.choices.indexOf(p.__fixAnswer);
      delete p.__fixAnswer;
    }
    if (typeof p.answer !== "number" || p.answer < 0 || p.answer >= p.choices.length) {
      // Never ship an unanswerable item.
      p.answer = 0;
    }
    return p;
  }

  window.MRPG_PROBLEMS = {
    generate: generate,
    topics: function () { return Object.keys(REGISTRY); },
    has: function (t) { return !!REGISTRY[t]; },
  };
})();

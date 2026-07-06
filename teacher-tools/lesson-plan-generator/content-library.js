/* =====================================================================
   Neft Teacher — Ready Lesson · Grade 6 Math Content Library
   window.LPGContent

   Standards-aware generator. Given a parsed source map + user fields, it
   detects the CCSS Grade 6 math DOMAIN and produces REAL, numerically
   correct content: Do Now questions + answer key, a worked example,
   guided + independent problems with keys, an error-analysis item, a
   TWR writing prompt, an exit ticket, vocabulary (with Spanish + ESOL
   frames) and misconceptions.

   All arithmetic answers are COMPUTED in JS so the answer keys are
   genuinely correct. A seeded PRNG (hashed from the lesson topic) makes
   the same source reproduce the same lesson — matching the feel of
   ChatGPT's "Ready <date>" output without any network call.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- seeded PRNG (mulberry32) ---------- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seedStr) {
    let a = hash(seedStr || "ready") || 1;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ri = (r, lo, hi) => Math.floor(r() * (hi - lo + 1)) + lo;
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const round2 = (n) => Math.round(n * 100) / 100;

  /* ---------- domain detection ---------- */
  const DOMAINS = ["RP", "NS", "EE", "G", "SP"];
  // Each alternative carries its own plural/inflection so the trailing \b
  // (which keeps short words from matching inside longer ones) still passes.
  const KEYWORDS = {
    RP: /\b(ratios?|rates?|unit rates?|per|percents?|proportions?|tape diagrams?|equivalent ratios?|miles per|prices?|scal(?:e|es|ing))\b/i,
    NS: /\b(divid\w*\s+fractions?|decimals?|gcf|greatest common|lcm|least common|distributive|integers?|absolute values?|coordinate planes?|opposites?|number lines?|quotients?)\b/i,
    EE: /\b(exponents?|expressions?|evaluat\w*|variables?|equivalent expressions?|equations?|inequalit\w*|coefficients?|terms?|substitut\w*|solve for)\b/i,
    G: /\b(areas?|composite|triangles?|parallelograms?|polygons?|trapezoids?|nets?|surface areas?|volumes?|prisms?|bases?|heights?)\b/i,
    SP: /\b(statistics?|statistical|means?|median|mode|ranges?|mad|mean absolute|iqr|dot plots?|histograms?|box plots?|distributions?|data sets?|variabilit\w*)\b/i,
  };
  function detectDomain(map, fields) {
    fields = fields || {};
    const codes =
      (map.standards || []).map((s) => s.code).join(" ") + " " + (fields.standards || "");
    const m = codes.match(/6\.(RP|NS|EE|G|SP)/i);
    if (m) return m[1].toUpperCase();
    const hay = [
      fields.topic,
      fields.focus,
      fields.unit,
      fields.standards,
      map.title,
      map.objective,
      (map.vocabulary || []).join(" "),
      map._raw,
    ]
      .filter(Boolean)
      .join("  ");
    for (const d of DOMAINS) if (KEYWORDS[d].test(hay)) return d;
    return null;
  }

  /* ---------- shared vocabulary bank (term, def, spanish, frame) ---------- */
  const VOCAB_BANK = {
    ratio: ["a comparison of two amounts", "razón", "The ratio of ___ to ___ is ___."],
    rate: ["a ratio comparing two different units", "tasa", "The rate is ___ per ___."],
    "unit rate": [
      "a rate for exactly one unit",
      "tasa unitaria",
      "The unit rate is ___ per 1 ___.",
    ],
    percent: ["a part out of 100", "por ciento", "___ percent means ___ out of 100."],
    quotient: [
      "the answer to a division problem",
      "cociente",
      "The quotient of ___ and ___ is ___.",
    ],
    decimal: [
      "a number with a part smaller than one, shown after a point",
      "decimal",
      "The decimal ___ means ___.",
    ],
    integer: [
      "a positive or negative whole number, including zero",
      "entero",
      "___ is an integer because ___.",
    ],
    "absolute value": [
      "a number's distance from zero",
      "valor absoluto",
      "The absolute value of ___ is ___.",
    ],
    expression: [
      "a math phrase with numbers, variables, and operations",
      "expresión",
      "The expression ___ means ___.",
    ],
    variable: [
      "a letter that stands for an unknown number",
      "variable",
      "The variable ___ stands for ___.",
    ],
    coefficient: [
      "the number multiplied by a variable",
      "coeficiente",
      "The coefficient of ___ is ___.",
    ],
    equation: [
      "a math sentence saying two amounts are equal",
      "ecuación",
      "The equation shows ___ equals ___.",
    ],
    inequality: [
      "a math sentence comparing amounts that are not equal",
      "desigualdad",
      "___ is ___ than ___.",
    ],
    area: ["the amount of space inside a flat shape", "área", "The area is ___ square units."],
    "composite figure": [
      "a shape made of two or more simple shapes",
      "figura compuesta",
      "I split the figure into ___ and ___.",
    ],
    volume: ["the amount of space inside a solid", "volumen", "The volume is ___ cubic units."],
    "surface area": [
      "the total area of all faces of a solid",
      "área de superficie",
      "The surface area is the sum of ___.",
    ],
    mean: ["the average; total shared equally", "media", "The mean is ___."],
    median: ["the middle value of ordered data", "mediana", "The median is ___."],
    range: [
      "the difference between the highest and lowest values",
      "rango",
      "The range is ___ minus ___.",
    ],
    "statistical question": [
      "a question with answers that vary",
      "pregunta estadística",
      "This is statistical because answers ___.",
    ],
  };
  function vocabFor(terms) {
    return terms.map((t) => {
      const key = t.toLowerCase().trim();
      const hit = VOCAB_BANK[key];
      return {
        term: t,
        def: hit ? hit[0] : "student-friendly meaning of this term in this lesson",
        spanish: hit ? hit[1] : "",
        frame: hit ? hit[2] : `I can use "${t}" when I ___.`,
      };
    });
  }

  /* ============================================================
     DOMAIN GENERATORS — each returns the shared content shape.
     ============================================================ */

  function gen_RP(r) {
    const a = ri(r, 2, 9),
      b = ri(r, 2, 9);
    const g = gcd(a, b);
    const total = (a + b) * ri(r, 3, 8);
    const aShare = (total / (a + b)) * a;
    const bShare = total - aShare;
    const miles = ri(r, 60, 180),
      hours = pick(r, [2, 3, 4]);
    const unit = round2(miles / hours);
    const whole = ri(r, 20, 80),
      pct = pick(r, [10, 20, 25, 50, 75]);
    const partOf = round2((pct / 100) * whole);
    return {
      topicLabel: "Ratios & Proportional Relationships",
      doNow: [
        {
          level: "Access",
          q: `Write the ratio of stars to circles if there are ${a} stars and ${b} circles.`,
          a: `${a} to ${b} (or ${a}:${b}${g > 1 ? `, simplified ${a / g}:${b / g}` : ""})`,
        },
        {
          level: "Grade-level",
          q: `A recipe uses ${a} cups of flour for every ${b} cups of sugar. How much sugar for ${a * 2} cups of flour?`,
          a: `${b * 2} cups (the ratio doubles)`,
        },
        {
          level: "Stretch",
          q: `${total} students are split in a ${a}:${b} ratio of readers to writers. How many are readers?`,
          a: `${aShare} readers, ${bShare} writers (${total} ÷ ${a + b} = ${total / (a + b)} per part)`,
        },
      ],
      worked: {
        problem: `A car travels ${miles} miles in ${hours} hours. Find the unit rate (miles per hour).`,
        steps: [
          `Set up the rate: ${miles} miles ÷ ${hours} hours.`,
          `Divide: ${miles} ÷ ${hours} = ${unit}.`,
          `Label the unit rate: ${unit} miles per 1 hour.`,
        ],
        thinkAloud: [
          `"Per hour" tells me I want the amount for ONE hour, so I divide.`,
          `I keep the units with my numbers so my answer means something.`,
        ],
        commonMistake: `Writing ${hours}/${miles} instead of ${miles}/${hours}.`,
        correction: `The unit you want (miles per hour) goes on top: miles ÷ hours.`,
      },
      guided: [
        {
          q: `Find the unit rate: ${b * 6} words typed in ${b} minutes.`,
          a: `6 words per minute`,
          prompt: "What does 'per' tell us to do?",
        },
        {
          q: `Are 2:3 and ${a * 2}:${a * 3} equivalent ratios?`,
          a: `Yes — both simplify to 2:3`,
          prompt: "How can we check two ratios are equal?",
        },
        {
          q: `${pct}% of ${whole} is what number?`,
          a: `${partOf}`,
          prompt: "What does percent mean as a fraction?",
        },
        {
          q: `A store sells ${a} pens for $${a}. What is the cost of 1 pen?`,
          a: `$1.00 per pen`,
          prompt: "Which number is the unit rate?",
        },
      ],
      collabTask: `In pairs, build a price-comparison: each partner finds the unit rate of a different "deal," then decide together which is the better buy and justify it.`,
      independent: [
        {
          type: "Procedural",
          q: `Find the unit rate: ${miles} miles in ${hours} hours.`,
          a: `${unit} mph`,
        },
        {
          type: "Procedural",
          q: `Write three ratios equivalent to ${a}:${b}.`,
          a: `e.g. ${a * 2}:${b * 2}, ${a * 3}:${b * 3}, ${a * 4}:${b * 4}`,
        },
        {
          type: "Conceptual",
          q: `Explain how a tape diagram shows the ratio ${a}:${b}.`,
          a: `${a} parts shaded one way, ${b} another; each part is equal size.`,
        },
        {
          type: "Word problem",
          q: `A paint mix is ${a} parts blue to ${b} parts white. For ${(a + b) * 4} cups total, how much is blue?`,
          a: `${a * 4} cups blue`,
        },
        {
          type: "Word problem",
          q: `${pct}% of a $${whole} jacket is taken off. What is the discount in dollars?`,
          a: `$${partOf}`,
        },
        {
          type: "Error analysis",
          q: `Maya says the unit rate for ${miles} miles in ${hours} hours is ${round2(hours / miles)} mph. What error did she make and what is correct?`,
          a: `She divided hours by miles. Correct: ${miles} ÷ ${hours} = ${unit} mph.`,
        },
      ],
      exit: [
        {
          q: `Find the unit rate: ${b * 5} pages in ${b} days.`,
          a: `5 pages per day`,
        },
        { q: `${pct}% of ${whole} = ?`, a: `${partOf}` },
        {
          q: `Reflection: rate your confidence with unit rate (1–4) and finish: "I still want help with ___."`,
          a: `(self-report)`,
        },
      ],
      vocabTerms: ["ratio", "rate", "unit rate", "percent"],
      misconceptions: [
        {
          error: "Flipping the unit rate (dividing the wrong way).",
          correction: "Keep the unit you want on top; divide by the per-unit quantity.",
        },
        {
          error: "Treating a ratio like a total instead of parts.",
          correction: "Add the parts to find the total, then find one part.",
        },
      ],
    };
  }

  function gen_NS(r) {
    const w = ri(r, 2, 6),
      d = ri(r, 2, 6);
    const a = ri(r, 12, 48),
      b = ri(r, 2, 9);
    const g = gcd(a, b);
    const stretchDenom = b * g;
    const stretchGcf = gcd(a, stretchDenom);
    const dec1 = round2(ri(r, 11, 89) / 10),
      dec2 = round2(ri(r, 11, 49) / 10);
    const sum = round2(dec1 + dec2),
      diff = round2(dec1 - dec2);
    const x = ri(r, 8, 24),
      y = ri(r, 8, 24);
    return {
      topicLabel: "The Number System",
      doNow: [
        {
          level: "Access",
          q: `What is ${dec1} + ${dec2}? (line up the decimal points)`,
          a: `${sum}`,
        },
        {
          level: "Grade-level",
          q: `Find the quotient: 1/${w} ÷ 1/${d}.`,
          a: `${d}/${w}${d % w === 0 ? ` = ${d / w}` : ""} (multiply by the reciprocal)`,
        },
        {
          level: "Stretch",
          q: `Find the GCF of ${a} and ${stretchDenom}, then write ${a}/${stretchDenom} in simplest form.`,
          a: `GCF = ${stretchGcf}; simplest form = ${a / stretchGcf}/${stretchDenom / stretchGcf}`,
        },
      ],
      worked: {
        problem: `Find the quotient: ${w}/4 ÷ 1/${d}.`,
        steps: [
          `Keep the first fraction: ${w}/4.`,
          `Change ÷ to × and flip the second: × ${d}/1.`,
          `Multiply across: (${w}×${d})/(4×1) = ${w * d}/4.`,
          `Simplify: ${w * d}/4 = ${round2((w * d) / 4)}.`,
        ],
        thinkAloud: [
          `Dividing by a fraction means "how many groups of that fraction fit?"`,
          `Keep–Change–Flip turns a hard division into an easy multiplication.`,
        ],
        commonMistake: `Flipping the FIRST fraction instead of the second.`,
        correction: `Only the divisor (the fraction you divide BY) gets flipped.`,
      },
      guided: [
        {
          q: `${dec1} − ${dec2} = ?`,
          a: `${diff}`,
          prompt: "Where do the decimal points line up?",
        },
        {
          q: `Find the GCF of ${x} and ${y}.`,
          a: `${gcd(x, y)}`,
          prompt: "What factors do both share?",
        },
        {
          q: `Find the LCM of ${w} and ${d}.`,
          a: `${lcm(w, d)}`,
          prompt: "What is the first multiple they share?",
        },
        {
          q: `1/2 ÷ 1/${d} = ?`,
          a: `${d}/2 = ${round2(d / 2)}`,
          prompt: "What does Keep–Change–Flip do?",
        },
      ],
      collabTask: `In pairs, each partner solves one fraction-division word problem, then teaches the steps to the other using Keep–Change–Flip and a model.`,
      independent: [
        {
          type: "Procedural",
          q: `${dec1} × ${dec2} = ?`,
          a: `${round2(dec1 * dec2)}`,
        },
        {
          type: "Procedural",
          q: `2/${w} ÷ 3/${d} = ?`,
          a: `${2 * d}/${w * 3} = ${round2((2 * d) / (w * 3))}`,
        },
        {
          type: "Procedural",
          q: `GCF of ${a} and ${b * 6}?`,
          a: `${gcd(a, b * 6)}`,
        },
        {
          type: "Conceptual",
          q: `Explain why dividing by 1/${d} makes the answer larger.`,
          a: `You are counting how many small (1/${d}) pieces fit, so there are many.`,
        },
        {
          type: "Word problem",
          q: `A ${w}-foot ribbon is cut into 1/${d}-foot pieces. How many pieces?`,
          a: `${w} ÷ (1/${d}) = ${w * d} pieces`,
        },
        {
          type: "Error analysis",
          q: `Sam wrote 3/4 ÷ 1/2 = 3/8. What error did Sam make, and what is correct?`,
          a: `Sam multiplied instead of flipping. Correct: 3/4 × 2/1 = 6/4 = 1.5.`,
        },
      ],
      exit: [
        { q: `${dec1} + ${dec2} = ?`, a: `${sum}` },
        { q: `1/${w} ÷ 1/${d} = ?`, a: `${d}/${w}` },
        {
          q: `Reflection: which step of Keep–Change–Flip is hardest for you, and why?`,
          a: `(self-report)`,
        },
      ],
      vocabTerms: ["quotient", "decimal", "integer", "absolute value"],
      misconceptions: [
        {
          error: "Flipping the wrong fraction in division.",
          correction: "Only flip the divisor; keep the dividend.",
        },
        {
          error: "Not lining up decimal points when adding.",
          correction: "Stack the decimal points; fill empty places with zeros.",
        },
      ],
    };
  }

  function gen_EE(r) {
    const base = ri(r, 2, 6),
      exp = ri(r, 2, 4);
    const power = Math.pow(base, exp);
    const c = ri(r, 2, 9),
      v = ri(r, 2, 9),
      add = ri(r, 1, 12);
    const evalRes = c * v + add;
    const eqB = ri(r, 3, 12),
      eqRes = ri(r, 13, 30);
    const sol = eqRes - eqB;
    const k = ri(r, 2, 8),
      prod = k * v;
    return {
      topicLabel: "Expressions & Equations",
      doNow: [
        {
          level: "Access",
          q: `Write ${Array(exp).fill(base).join(" × ")} using an exponent.`,
          a: `${base}^${exp}`,
        },
        { level: "Grade-level", q: `Evaluate ${base}^${exp}.`, a: `${power}` },
        {
          level: "Stretch",
          q: `Evaluate ${c}x + ${add} when x = ${v}.`,
          a: `${evalRes} (${c}·${v} + ${add})`,
        },
      ],
      worked: {
        problem: `Solve for x:  x + ${eqB} = ${eqRes}.`,
        steps: [
          `Goal: get x alone.`,
          `The ${eqB} is added to x, so do the inverse — subtract ${eqB} from BOTH sides.`,
          `x + ${eqB} − ${eqB} = ${eqRes} − ${eqB}.`,
          `x = ${sol}.`,
          `Check: ${sol} + ${eqB} = ${eqRes} ✓.`,
        ],
        thinkAloud: [
          `Whatever I do to one side I must do to the other to keep it balanced.`,
          `I use the inverse operation to "undo" what is happening to x.`,
        ],
        commonMistake: `Adding ${eqB} to both sides instead of subtracting.`,
        correction: `Use the INVERSE: since ${eqB} is added, subtract it.`,
      },
      guided: [
        {
          q: `Evaluate 2^${exp}.`,
          a: `${Math.pow(2, exp)}`,
          prompt: "What does the exponent count?",
        },
        {
          q: `Simplify ${c}x + ${v}x.`,
          a: `${c + v}x`,
          prompt: "Why can we combine these terms?",
        },
        {
          q: `Solve ${k}x = ${prod}.`,
          a: `x = ${v}`,
          prompt: `What is the inverse of multiplying by ${k}?`,
        },
        {
          q: `Evaluate ${c}x − ${add} when x = ${v}.`,
          a: `${c * v - add}`,
          prompt: "Which operation do we do first?",
        },
      ],
      collabTask: `Partners build an "expression match": one writes a real-world phrase, the other writes the matching algebraic expression, then they swap and check.`,
      independent: [
        { type: "Procedural", q: `Evaluate ${base}^${exp}.`, a: `${power}` },
        {
          type: "Procedural",
          q: `Solve x − ${eqB} = ${sol}.`,
          a: `x = ${sol + eqB}`,
        },
        {
          type: "Procedural",
          q: `Simplify ${c}(x + ${add}).`,
          a: `${c}x + ${c * add}`,
        },
        {
          type: "Conceptual",
          q: `Explain the difference between ${c}x and ${c} + x.`,
          a: `${c}x means ${c} groups of x (multiply); ${c} + x means add ${c} and x.`,
        },
        {
          type: "Word problem",
          q: `A taxi costs $${eqB} plus $${c} per mile. Write an expression for m miles and find the cost for ${v} miles.`,
          a: `${c}m + ${eqB}; cost = ${c * v + eqB}`,
        },
        {
          type: "Error analysis",
          q: `Lee solved x + ${eqB} = ${eqRes} and got x = ${eqRes + eqB}. What error did Lee make and what is correct?`,
          a: `Lee added instead of subtracting. Correct: x = ${sol}.`,
        },
      ],
      exit: [
        { q: `Evaluate ${base}^${exp}.`, a: `${power}` },
        { q: `Solve x + ${eqB} = ${eqRes}.`, a: `x = ${sol}` },
        {
          q: `Reflection: explain in one sentence why we use inverse operations.`,
          a: `(self-report)`,
        },
      ],
      vocabTerms: ["expression", "variable", "coefficient", "equation"],
      misconceptions: [
        {
          error: `Reading ${base}^${exp} as ${base} × ${exp} (multiplying instead of repeated multiplication).`,
          correction: "The exponent counts how many times to MULTIPLY the base by itself.",
        },
        {
          error: "Only changing one side of an equation.",
          correction: "Do the same inverse operation to BOTH sides to stay balanced.",
        },
      ],
    };
  }

  function gen_G(r) {
    const L = ri(r, 4, 12),
      W = ri(r, 3, 9);
    const b = ri(r, 4, 12),
      h = ri(r, 3, 10);
    const triArea = (b * h) / 2;
    const rectArea = L * W;
    const e = ri(r, 2, 6);
    const len = ri(r, 3, 8),
      wid = ri(r, 2, 6),
      hei = ri(r, 2, 6);
    const vol = len * wid * hei;
    const sa = 2 * (len * wid + len * hei + wid * hei);
    return {
      topicLabel: "Geometry",
      doNow: [
        {
          level: "Access",
          q: `Find the area of a rectangle ${L} units by ${W} units.`,
          a: `${rectArea} square units`,
        },
        {
          level: "Grade-level",
          q: `Find the area of a triangle with base ${b} and height ${h}.`,
          a: `${triArea} square units (½ · ${b} · ${h})`,
        },
        {
          level: "Stretch",
          q: `An L-shape is a ${L}×${W} rectangle with a ${e}×${e} square removed. Find its area.`,
          a: `${rectArea - e * e} square units`,
        },
      ],
      worked: {
        problem: `Find the area of a composite figure: a ${L}×${W} rectangle joined to a triangle with base ${b} and height ${h}.`,
        steps: [
          `Decompose into shapes I know: one rectangle, one triangle.`,
          `Rectangle area = ${L} × ${W} = ${rectArea}.`,
          `Triangle area = ½ × ${b} × ${h} = ${triArea}.`,
          `Add the sub-areas: ${rectArea} + ${triArea} = ${rectArea + triArea} square units.`,
        ],
        thinkAloud: [
          `I look for familiar shapes hiding inside the figure.`,
          `I label each piece so I don't lose track when I add.`,
        ],
        commonMistake: `Forgetting the ½ in the triangle's area.`,
        correction: `A triangle is half of a rectangle, so multiply base × height, then halve it.`,
      },
      guided: [
        {
          q: `Area of a parallelogram, base ${b}, height ${h}?`,
          a: `${b * h} sq units`,
          prompt: "How is this like a rectangle?",
        },
        {
          q: `Area of a triangle, base ${L}, height ${W}?`,
          a: `${(L * W) / 2} sq units`,
          prompt: "Why do we divide by 2?",
        },
        {
          q: `Volume of a box ${len}×${wid}×${hei}?`,
          a: `${vol} cubic units`,
          prompt: "What does each dimension add?",
        },
        {
          q: `A net has 6 rectangles. What solid is it?`,
          a: `a rectangular prism`,
          prompt: "How does a net relate to surface area?",
        },
      ],
      collabTask: `Partners each sketch a composite figure on grid paper, swap, and find each other's area — then compare decompositions and resolve any difference.`,
      independent: [
        {
          type: "Procedural",
          q: `Area of triangle, base ${b}, height ${h}?`,
          a: `${triArea} sq units`,
        },
        {
          type: "Procedural",
          q: `Area of rectangle ${L}×${W}?`,
          a: `${rectArea} sq units`,
        },
        {
          type: "Procedural",
          q: `Volume of prism ${len}×${wid}×${hei}?`,
          a: `${vol} cubic units`,
        },
        {
          type: "Conceptual",
          q: `Explain why surface area uses square units but volume uses cubic units.`,
          a: `Surface area covers flat faces (2-D); volume fills space (3-D).`,
        },
        {
          type: "Word problem",
          q: `A box ${len}×${wid}×${hei} is wrapped. How much paper (surface area) is needed?`,
          a: `${sa} square units`,
        },
        {
          type: "Error analysis",
          q: `Ana found a triangle's area as ${b} × ${h} = ${b * h}. What error did she make and what is correct?`,
          a: `She forgot to divide by 2. Correct: ${triArea} sq units.`,
        },
      ],
      exit: [
        {
          q: `Area of triangle, base ${b}, height ${h}?`,
          a: `${triArea} sq units`,
        },
        { q: `Volume of box ${len}×${wid}×${hei}?`, a: `${vol} cubic units` },
        {
          q: `Reflection: which is easier for you, area or volume — and why?`,
          a: `(self-report)`,
        },
      ],
      vocabTerms: ["area", "composite figure", "volume", "surface area"],
      misconceptions: [
        {
          error: "Forgetting ½ when finding a triangle's area.",
          correction: "Triangle = half a rectangle: base × height ÷ 2.",
        },
        {
          error: "Mixing up square and cubic units.",
          correction: "Area = square units (flat); volume = cubic units (space).",
        },
      ],
    };
  }

  function gen_SP(r) {
    const data = Array.from({ length: 5 }, () => ri(r, 2, 18)).sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = round2(sum / data.length);
    const median = data[2];
    const range = data[4] - data[0];
    const mad = round2(data.reduce((a, b) => a + Math.abs(b - mean), 0) / data.length);
    const set = data.join(", ");
    return {
      topicLabel: "Statistics & Probability",
      doNow: [
        {
          level: "Access",
          q: `Find the range of: ${set}.`,
          a: `${range} (${data[4]} − ${data[0]})`,
        },
        {
          level: "Grade-level",
          q: `Find the mean of: ${set}.`,
          a: `${mean} (sum ${sum} ÷ ${data.length})`,
        },
        {
          level: "Stretch",
          q: `Is "How tall is each student?" a statistical question? Explain.`,
          a: `Yes — answers vary from student to student.`,
        },
      ],
      worked: {
        problem: `Find the mean and median of the data set: ${set}.`,
        steps: [
          `Mean: add all values: ${data.join(" + ")} = ${sum}.`,
          `Divide by how many: ${sum} ÷ ${data.length} = ${mean}.`,
          `Median: order the data (already ordered) and find the middle value: ${median}.`,
        ],
        thinkAloud: [
          `Mean shares the total equally; median is just the middle of ordered data.`,
          `I always ORDER the data before finding the median.`,
        ],
        commonMistake: `Finding the median without ordering the data first.`,
        correction: `Order least-to-greatest, THEN take the middle value.`,
      },
      guided: [
        {
          q: `Median of ${set}?`,
          a: `${median}`,
          prompt: "What do we do before finding the middle?",
        },
        {
          q: `Range of ${set}?`,
          a: `${range}`,
          prompt: "Which two values do we use?",
        },
        {
          q: `Mean of ${set}?`,
          a: `${mean}`,
          prompt: "What does the mean tell us?",
        },
        {
          q: `Is "What is my height?" statistical?`,
          a: `No — it has one answer`,
          prompt: "What makes a question statistical?",
        },
      ],
      collabTask: `Pairs collect a small class data set (e.g., number of pets), then each computes a different measure (mean, median, range) and together describe the data's center and spread.`,
      independent: [
        { type: "Procedural", q: `Mean of ${set}?`, a: `${mean}` },
        { type: "Procedural", q: `Median of ${set}?`, a: `${median}` },
        { type: "Procedural", q: `Range of ${set}?`, a: `${range}` },
        {
          type: "Conceptual",
          q: `Explain how the MAD (${mad}) describes this data.`,
          a: `On average, values are about ${mad} away from the mean — the spread.`,
        },
        {
          type: "Word problem",
          q: `A student's quiz scores are ${set}. Which measure best shows a "typical" score, and why?`,
          a: `Median or mean; median if there is an outlier, mean if values are even.`,
        },
        {
          type: "Error analysis",
          q: `Jo said the median of ${set} is ${data[1]} (the second number). What error did Jo make and what is correct?`,
          a: `Jo took the second value, not the middle. Correct median: ${median}.`,
        },
      ],
      exit: [
        { q: `Mean of ${set}?`, a: `${mean}` },
        { q: `Median of ${set}?`, a: `${median}` },
        {
          q: `Reflection: which measure of center do you understand best, and which do you want more practice with?`,
          a: `(self-report)`,
        },
      ],
      vocabTerms: ["statistical question", "mean", "median", "range"],
      misconceptions: [
        {
          error: "Finding the median of unordered data.",
          correction: "Always order the data before taking the middle value.",
        },
        {
          error: "Thinking every question is statistical.",
          correction: "It is statistical only if the answers VARY.",
        },
      ],
    };
  }

  const GENERATORS = {
    RP: gen_RP,
    NS: gen_NS,
    EE: gen_EE,
    G: gen_G,
    SP: gen_SP,
  };

  /* ---------- generic fallback when domain is unknown ---------- */
  function genGeneric(map, fields) {
    const topic = fields.topic || map.title || "today's skill";
    const obj = map.objective || `apply ${topic}`;
    const frame = `I ___ because ___.`;
    const item = (level, stem) => ({
      level,
      q: stem,
      a: "Answer depends on the values in your source — fill from the worked example.",
    });
    return {
      topicLabel: fields.course || "Grade 6 Mathematics",
      generic: true,
      doNow: [
        item("Access", `Warm-up: recall one fact you need for ${topic}.`),
        item("Grade-level", `Solve one ${topic} problem like the ones in your source.`),
        item("Stretch", `Explain, in words, the main idea behind ${topic}.`),
      ],
      worked: {
        problem: `Model one problem directly from your source for: ${obj}.`,
        steps: [
          "State what the problem asks.",
          "Show each step with the strategy from the lesson.",
          "Label the answer with units/meaning.",
          "Check it makes sense.",
        ],
        thinkAloud: [
          "Name the strategy out loud as you choose it.",
          "Connect each step to the objective so students hear the reasoning.",
        ],
        commonMistake: `The most likely error for ${topic} (e.g., skipping a step or mislabeling).`,
        correction: "Clarify with a quick non-example, then re-model the correct step.",
      },
      guided: [1, 2, 3, 4].map((i) => ({
        q: `Guided problem ${i}: a ${topic} problem, gradually harder.`,
        a: "Use the worked-example steps.",
        prompt: "What strategy fits here?",
      })),
      collabTask: `Partners solve one ${topic} problem, then justify their answer to each other using the sentence frame "${frame}".`,
      independent: [1, 2, 3, 4, 5].map((i) => ({
        type: i === 5 ? "Error analysis" : i % 2 ? "Procedural" : "Word problem",
        q: `Independent problem ${i} on ${topic}.`,
        a: "From source / worked example.",
      })),
      exit: [
        { q: `Solve one ${topic} problem.`, a: "From source." },
        {
          q: `Explain your thinking on that problem.`,
          a: "(written response)",
        },
        {
          q: `Reflection: rate your confidence (1–4) and name what you still need.`,
          a: "(self-report)",
        },
      ],
      vocabTerms: map.vocabulary && map.vocabulary.length ? map.vocabulary.slice(0, 5) : [topic],
      misconceptions: [
        {
          error: `A common error students make with ${topic}.`,
          correction: "Address with a targeted non-example and re-teach.",
        },
      ],
    };
  }

  /* ---------- TWR writing block (Because / But / So + kernel) ---------- */
  function twrBlock(content, topic) {
    const t = topic || content.topicLabel || "this skill";
    return {
      kernel: `Write ONE complete sentence that states what you did to solve a problem in ${t}.`,
      because: `My answer is correct because ___.`,
      but: `I thought the answer might be ___, but ___.`,
      so: `The numbers showed ___, so ___.`,
      explain: `Explain your thinking: How did you solve it, and how do you know your answer makes sense?`,
      frames: [
        "First, I ___. Then, I ___. Finally, I ___.",
        "I knew to ___ because ___.",
        "My answer is ___ because ___.",
      ],
      wordBank: (content.vocabTerms || []).concat([
        "because",
        "so",
        "therefore",
        "first",
        "next",
        "finally",
      ]),
      expected: `A 2–3 sentence response that names the strategy, shows the steps in order, and justifies the answer using lesson vocabulary.`,
    };
  }

  /* ---------- public API ---------- */
  function build(map, fields, reshuffleNonce) {
    const seed =
      (fields.topic || map.title || "ready") +
      "|" +
      (fields.date || "") +
      (reshuffleNonce ? "|" + reshuffleNonce : "");
    const r = rng(seed);
    const domain = detectDomain(map, fields);
    let content;
    if (domain && GENERATORS[domain]) {
      content = GENERATORS[domain](r);
      content.domain = domain;
    } else {
      content = genGeneric(map, fields);
      content.domain = null;
    }
    // Prefer vocabulary the teacher actually supplied; else the domain's terms.
    const terms =
      map.vocabulary && map.vocabulary.length
        ? map.vocabulary.slice(0, 6)
        : content.vocabTerms || [];
    content.vocab = vocabFor(terms);
    content.twr = twrBlock(content, fields.topic || map.title);
    return content;
  }

  window.LPGContent = { build, detectDomain, vocabFor };
})();

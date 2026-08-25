/**
 * lesson-tool-resolver.js — which interactive tool and which caution a lesson
 * gets, resolved ONCE for the runtime, the validator and the generators.
 *
 * WHY IT LIVES ALONE. These two functions used to sit inside
 * components/vocab-learn-panel.js, which imports the lesson renderer, which
 * imports engine/core/app.js, which imports the Vite alias `@engine/styles`.
 * Node cannot resolve that, so NOTHING outside a browser could ask "what tool
 * does this lesson actually get?" — and the answer for most lessons is decided
 * here, not in the config. validate:interactive-alignment could therefore only
 * audit tools a lesson AUTHORED, while the tool a student is actually handed in
 * Learn It was chosen by the keyword ladder below and never checked by anything.
 *
 * That is how lesson 5-10 ("Volume of Rectangular Prisms", 6.GR.2) opened on a
 * cube offering to unfold its net: one branch treated 6.GR.2 and 6.GR.4 as the
 * same lesson, and no gate could see the result. This file has NO imports, so
 * the gate resolves exactly what the browser resolves.
 *
 * ORDER OF AUTHORITY, most specific first:
 *   1. the lesson's own authored choice (launch.conceptIntro.interactiveVisual)
 *   2. the standard code
 *   3. word-boundary matching on title / objective
 *   4. a documented default
 * A branch here is a MAPPING, and every mapping is audited by
 * tools/validate-interactive-alignment.mjs against the standard's own topic.
 */

/**
 * Comprehensive Interactive Math Tool Resolver.
 * Uses the lesson's standard code (most reliable) first, then falls back to
 * regex word-boundary matching on the title/objective text. Every match uses
 * \b word boundaries to prevent false positives ("means" ≠ "mean", etc.).
 */
export function resolveInteractiveToolForLesson(config) {
  const cfg = config || {};

  const authored =
    // A lesson config nests Learn It under `launch`. This chain checked
    // `cfg.conceptIntro` and never `cfg.launch.conceptIntro`, so the one escape
    // hatch an author has — "this lesson knows which tool it wants" — was
    // unreachable from the canonical config shape, and every lesson silently
    // took the keyword guess below. validate:interactive-alignment reads the
    // nested path, so the audit and the runtime were reading different fields.
    cfg.launch?.conceptIntro?.interactiveVisual ??
    cfg.conceptIntro?.interactiveVisual ??
    cfg.interactiveVisual ??
    cfg.visualModel ??
    cfg.explore?.visual ??
    null;

  // "This lesson deliberately has no interactive." Some lessons have no tool
  // that teaches what they teach — 10-2 is about bilateral symmetry in nature,
  // and an expression equivalence checker is not a symmetry model. Without a way
  // to say so, the ladder below hands every such lesson the default anyway, and
  // a wrong tool reads to a student as instruction. `interactiveVisual: "none"`
  // is that statement, and the audit reports those lessons as a category rather
  // than as a gap.
  if (authored === "none" || authored === false) return null;

  if (authored && typeof authored === "object" && authored.kind) {
    return authored;
  }

  const text =
    `${cfg.title || ""} ${cfg.standard || ""} ${cfg.contentObjective || ""} ${cfg.objective || ""}`.toLowerCase();

  // Helper: word-boundary test (prevents "means" matching "mean", etc.)
  const wb = (pattern) => new RegExp(`\\b(?:${pattern})\\b`, "i").test(text);

  // Which figure an area-morph should demonstrate for this term. area-morph
  // reads `figure` and defaults to a parallelogram, so a term this misses gets
  // the wrong shape's formula rather than an obvious failure — hence polygon
  // and composite are matched here too, not just triangle and trapezoid.
  // Whole-figure kinds are tested FIRST: "Area of Regular Polygons — decompose
  // into triangles" names both, and the lesson is about the polygon.
  const areaFigure = () => {
    if (wb("hexagons?|pentagons?|octagons?|regular polygons?|apothem")) return "polygon";
    if (wb("composite|l-shaped?|irregular figures?")) return "composite";
    if (wb("trapezoids?|trapezoidal")) return "trapezoid";
    if (wb("triangles?|triangular")) return "triangle";
    return "parallelogram";
  };

  // ── 1. Standard-based classification (most reliable) ──────────────────────
  const std = String(cfg.standard || "")
    .trim()
    .toUpperCase();

  // 6.NOS.1 — Fraction Division
  if (std === "6.NOS.1") {
    return {
      kind: "fraction-divide",
      dividend: "3/4",
      divisor: "1/2",
      label: "Interactive Fraction Division: Keep, Change, Flip!",
    };
  }
  // 6.NOS.2 — Long Division
  if (std === "6.NOS.2") {
    return {
      kind: "long-division-builder",
      label: "Interactive Long Division & Partial Quotients Lab",
    };
  }
  // 6.NOS.3 — Decimal Operations (refine by wording)
  if (std === "6.NOS.3") {
    if (wb("multiply|multiplication|product"))
      return {
        kind: "decimal-product",
        a: 4.5,
        b: 1.2,
        label: "Interactive Decimal Multiplication Tool",
      };
    if (wb("divide|division|quotient"))
      return {
        kind: "decimal-quotient",
        dividend: 18.9,
        divisor: 6.3,
        label: "Interactive Decimal Division Tool",
      };
    return {
      kind: "decimal-columns",
      op: "+",
      a: 3.4,
      b: 1.25,
      label: "Interactive Decimal Columns & Regrouping Tool",
    };
  }
  // 6.NOS.4 — Factors, GCF, LCM
  if (std === "6.NOS.4") {
    if (wb("least common multiple|LCM"))
      return {
        kind: "lcm-lab",
        num1: 6,
        num2: 8,
        label: "Interactive LCM Explorer: Tap shared multiples to find the LCM!",
      };
    if (wb("greatest common factor|GCF"))
      return {
        kind: "factor-tree-lab",
        number: 48,
        label: "Interactive GCF & Factor Tree Explorer",
      };
    return {
      kind: "factor-tree-lab",
      number: 36,
      label: "Interactive Factor Tree Explorer: Build prime factorizations step-by-step!",
    };
  }
  // 6.NOS.6 — Coordinate Plane / Number Line
  if (std === "6.NOS.6") {
    if (wb("number line"))
      return { kind: "number-line-explorer", label: "Interactive Number Line Explorer" };
    return {
      kind: "coordinate-plane",
      points: [
        { x: 3, y: 4, label: "A" },
        { x: -2, y: 5, label: "B" },
      ],
      label: "Interactive Coordinate Plane Explorer",
    };
  }
  // 6.NOS.7 — Quadrants / Coordinate Plane
  if (std === "6.NOS.7") {
    return {
      kind: "coordinate-plane",
      points: [
        { x: 3, y: 4, label: "A" },
        { x: -2, y: -3, label: "B" },
      ],
      label: "Interactive Four-Quadrant Coordinate Plane Explorer",
    };
  }
  // 6.NOS.8 — Integers / Absolute Value
  if (std === "6.NOS.8") {
    return { kind: "number-line-explorer", label: "Interactive Absolute Value & Integer Explorer" };
  }
  // 6.NOS.9 — Distance
  if (std === "6.NOS.9") {
    return {
      kind: "number-line-explorer",
      label: "Interactive Distance on a Number Line Explorer",
    };
  }
  // 6.AT.1 — Ratios
  if (std === "6.AT.1") {
    return {
      kind: "tape-diagram",
      // tape-diagram-lab reads `rows: [{ label, parts: [{value}] }]`. The
      // parts/labels pair below was a shape no component ever consumed, so the
      // lab counted zero parts and drew nothing.
      rows: [
        { label: "Quantity A", parts: [{ value: 1 }, { value: 1 }, { value: 1 }] },
        {
          label: "Quantity B",
          parts: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }],
        },
      ],
      label: "Interactive Tape Diagram Explorer: Count and compare equal parts!",
    };
  }
  // 6.AT.2 — Rates
  if (std === "6.AT.2") {
    return {
      kind: "unit-rate-builder",
      label:
        "Interactive Unit Rate Builder: Calculate 'per 1' unit rates live on double number lines!",
    };
  }
  // 6.AT.3, 6.AT.3a — Ratio Tables / Rates
  if (std === "6.AT.3" || std === "6.AT.3A") {
    if (wb("unit rate"))
      return { kind: "unit-rate-builder", label: "Interactive Unit Rate Builder" };
    return {
      kind: "ratio-table-builder",
      label:
        "Interactive Ratio Table Explorer: Scale quantities up and down to find equivalent ratios!",
    };
  }
  // 6.AT.3c — Measurement Conversions
  if (std === "6.AT.3C") {
    return { kind: "ratio-table-builder", label: "Interactive Measurement Conversion Ratio Table" };
  }
  // 6.AT.4 — Percents
  if (std === "6.AT.4") {
    if (wb("percent of|percentage of"))
      return { kind: "percent-builder", label: "Interactive Percent of a Quantity Builder" };
    return { kind: "percent-grid", percent: 45, label: "Interactive Percent Grid Tool" };
  }
  // 6.AT.5 — Exponents
  if (std === "6.AT.5") {
    return {
      kind: "power-builder",
      base: 2,
      exponent: 4,
      label: "Interactive Powers & Exponents Builder",
    };
  }
  // 6.AT.6a, 6.AT.6c, 6.AT.7 — Expressions
  if (std === "6.AT.6A" || std === "6.AT.6C" || std === "6.AT.7") {
    if (wb("distributive"))
      return {
        kind: "distributive-builder",
        a: 3,
        b: "x",
        c: 4,
        label: "Interactive Distributive Property Area Model",
      };
    if (wb("like terms|combine"))
      return {
        kind: "combine-like-terms",
        expr: "5x + 3 + 2x - 1",
        label: "Interactive Combine Like Terms Lab",
      };
    return { kind: "step-solver", label: "Interactive Expression Evaluator & Step Solver" };
  }
  // 6.AT.8 — Equations / Inequalities
  if (std === "6.AT.8") {
    if (wb("inequalit"))
      return {
        kind: "number-line",
        min: -5,
        max: 5,
        step: 1,
        problems: [{ inequality: "x > 2", boundary: 2, circleType: "open", direction: "right" }],
        label: "Interactive Inequality Number Line",
      };
    return {
      kind: "equation-balance-lab",
      label: "Interactive Equation Pan Balance: Keep both sides equal!",
    };
  }
  // 6.AT.9 — Inequalities
  if (std === "6.AT.9") {
    return {
      kind: "number-line",
      min: -5,
      max: 5,
      step: 1,
      problems: [{ inequality: "x > 2", boundary: 2, circleType: "open", direction: "right" }],
      label: "Interactive Inequality Number Line",
    };
  }
  // 6.DS.1 — Statistical Questions
  if (std === "6.DS.1") {
    return { kind: "stats-data-lab", label: "Interactive Statistics & Data Set Explorer" };
  }
  // 6.DS.3 — Distributions
  if (std === "6.DS.3") {
    return { kind: "stats-data-lab", label: "Interactive Distribution Shape Explorer" };
  }
  // 6.DS.4 — Mean, Median, Mode
  if (std === "6.DS.4") {
    return { kind: "stats-data-lab", label: "Interactive Mean, Median & Mode Explorer" };
  }
  // 6.DS.5 — Box Plots / Histograms
  if (std === "6.DS.5") {
    if (wb("histogram"))
      return { kind: "histogram-builder", label: "Interactive Histogram Bar Builder" };
    return {
      kind: "box-plot-builder",
      label: "Interactive Box Plot & Five-Number Summary Builder",
    };
  }
  // 6.DS.6c, 6.DS.6d — MAD / Center
  if (std === "6.DS.6C" || std === "6.DS.6D") {
    return { kind: "stats-data-lab", label: "Interactive Mean Absolute Deviation Explorer" };
  }
  // 6.GR.1 — Area
  if (std === "6.GR.1") {
    // `figure` is the key area-morph reads. It was `shape` here, which the
    // component never looks at, so every triangle/trapezoid term silently
    // demonstrated a PARALLELOGRAM — the wrong shape's formula.
    const figure = areaFigure();
    return {
      kind: "area-morph",
      figure,
      label: "Interactive Area Morph & Transformation Explorer",
    };
  }
  // 6.GR.2 — VOLUME. Kept apart from 6.GR.4 deliberately. These two standards
  // used to share one branch, and it returned a cube "Solid & Net Explorer" for
  // both — so lesson 5-10 ("Volume of Rectangular Prisms": fractional edges,
  // base area × height) opened its Learn It panel on a unit cube offering to
  // UNFOLD ITS NET, which is 6.GR.4, lesson 5-6's mathematics. The panel
  // computed no volume at all, and the solid it drew was not the lesson's
  // prism. One shared branch, every 6.GR.2 lesson.
  if (std === "6.GR.2" && !wb("net|nets|surface area")) {
    return { kind: "prism-volume", label: "Interactive Prism Volume Builder" };
  }
  // 6.GR.4 — Surface area and nets, where a net folder is the point.
  if (std === "6.GR.2" || std === "6.GR.4") {
    if (wb("net|fold|surface area"))
      return {
        kind: "net-folder",
        solid: "cube",
        label: "Interactive 3D Net Folder: Fold 2D nets into 3D solids!",
      };
    return {
      kind: "solid-3d",
      shape: wb("pyramid") ? "triangular-pyramid" : "cube",
      label: "Interactive 3D Solid & Net Explorer",
    };
  }

  // Also handle RP standard codes (alternate standard labels)
  if (/^6\.RP/i.test(std)) {
    if (wb("ratio table|equivalent ratio"))
      return { kind: "ratio-table-builder", label: "Interactive Ratio Table Explorer" };
    if (wb("unit rate"))
      return { kind: "unit-rate-builder", label: "Interactive Unit Rate Builder" };
    if (wb("percent"))
      return { kind: "percent-grid", percent: 45, label: "Interactive Percent Grid Tool" };
    return {
      kind: "tape-diagram",
      // tape-diagram-lab reads `rows: [{ label, parts: [{value}] }]`. The
      // parts/labels pair below was a shape no component ever consumed, so the
      // lab counted zero parts and drew nothing.
      rows: [
        { label: "Quantity A", parts: [{ value: 1 }, { value: 1 }, { value: 1 }] },
        {
          label: "Quantity B",
          parts: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }],
        },
      ],
      label: "Interactive Tape Diagram Explorer",
    };
  }
  if (/^6\.EE/i.test(std)) {
    if (wb("inequalit"))
      return {
        kind: "number-line",
        min: -5,
        max: 5,
        step: 1,
        problems: [{ inequality: "x > 2", boundary: 2, circleType: "open", direction: "right" }],
        label: "Interactive Inequality Number Line",
      };
    if (wb("equation"))
      return { kind: "equation-balance-lab", label: "Interactive Equation Pan Balance" };
    return { kind: "step-solver", label: "Interactive Expression Evaluator & Step Solver" };
  }
  if (/^6\.NS/i.test(std)) {
    if (wb("fraction|divid"))
      return {
        kind: "fraction-divide",
        dividend: "3/4",
        divisor: "1/2",
        label: "Interactive Fraction Division",
      };
    if (wb("decimal"))
      return {
        kind: "decimal-columns",
        op: "+",
        a: 3.4,
        b: 1.25,
        label: "Interactive Decimal Columns Tool",
      };
    if (wb("factor|GCF|LCM"))
      return { kind: "factor-tree-lab", number: 36, label: "Interactive Factor Tree Explorer" };
    if (wb("coordinate"))
      return {
        kind: "coordinate-plane",
        points: [{ x: 3, y: 4, label: "A" }],
        label: "Interactive Coordinate Plane Explorer",
      };
    return { kind: "number-line-explorer", label: "Interactive Number Line Explorer" };
  }
  if (/^6\.SP/i.test(std)) {
    if (wb("box plot")) return { kind: "box-plot-builder", label: "Interactive Box Plot Builder" };
    if (wb("histogram"))
      return { kind: "histogram-builder", label: "Interactive Histogram Builder" };
    return { kind: "stats-data-lab", label: "Interactive Statistics Explorer" };
  }
  if (/^6\.G/i.test(std)) {
    if (wb("area"))
      return { kind: "area-morph", figure: areaFigure(), label: "Interactive Area Explorer" };
    return { kind: "solid-3d", shape: "cube", label: "Interactive 3D Solid Explorer" };
  }

  // ── 2. Wording-based fallback (regex word boundaries) ─────────────────────
  // Most specific phrases first, most general last.

  if (wb("ratio table|equivalent ratio|table of ratios")) {
    return { kind: "ratio-table-builder", label: "Interactive Ratio Table Explorer" };
  }
  if (wb("unit rate|constant of proportionality")) {
    return { kind: "unit-rate-builder", label: "Interactive Unit Rate Builder" };
  }
  if (wb("tape diagram")) {
    return {
      kind: "tape-diagram",
      // tape-diagram-lab reads `rows: [{ label, parts: [{value}] }]`. The
      // parts/labels pair below was a shape no component ever consumed, so the
      // lab counted zero parts and drew nothing.
      rows: [
        { label: "Quantity A", parts: [{ value: 1 }, { value: 1 }, { value: 1 }] },
        {
          label: "Quantity B",
          parts: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }],
        },
      ],
      label: "Interactive Tape Diagram Explorer",
    };
  }
  if (wb("factor tree|prime factorization")) {
    return { kind: "factor-tree-lab", number: 36, label: "Interactive Factor Tree Explorer" };
  }
  if (wb("least common multiple") || /\bLCM\b/.test(text)) {
    return { kind: "lcm-lab", num1: 6, num2: 8, label: "Interactive LCM Explorer" };
  }
  if (wb("greatest common factor") || /\bGCF\b/.test(text)) {
    return { kind: "factor-tree-lab", number: 48, label: "Interactive GCF & Factor Tree Explorer" };
  }
  if (wb("exponents?|powers of")) {
    return {
      kind: "power-builder",
      base: 2,
      exponent: 4,
      label: "Interactive Powers & Exponents Builder",
    };
  }
  if (wb("divid\\w* fractions?|fraction division|divid\\w* by a fraction")) {
    return {
      kind: "fraction-divide",
      dividend: "3/4",
      divisor: "1/2",
      label: "Interactive Fraction Division: Keep, Change, Flip!",
    };
  }
  if (wb("long division|partial quotients?")) {
    return { kind: "long-division-builder", label: "Interactive Long Division Lab" };
  }
  if (wb("divid\\w* decimals?|decimal division")) {
    return {
      kind: "decimal-quotient",
      dividend: 18.9,
      divisor: 6.3,
      label: "Interactive Decimal Division Tool",
    };
  }
  if (wb("multiply\\w* decimals?|decimal multiplication")) {
    return {
      kind: "decimal-product",
      a: 4.5,
      b: 1.2,
      label: "Interactive Decimal Multiplication Tool",
    };
  }
  if (wb("add\\w* decimals?|subtract\\w* decimals?|decimal")) {
    return {
      kind: "decimal-columns",
      op: "+",
      a: 3.4,
      b: 1.25,
      label: "Interactive Decimal Columns & Regrouping Tool",
    };
  }
  if (wb("percent of|percentage of")) {
    return { kind: "percent-builder", label: "Interactive Percent of a Quantity Builder" };
  }
  if (wb("percents?|percentage")) {
    return { kind: "percent-grid", percent: 45, label: "Interactive Percent Grid Tool" };
  }
  if (wb("ratios?")) {
    return {
      kind: "tape-diagram",
      // tape-diagram-lab reads `rows: [{ label, parts: [{value}] }]`. The
      // parts/labels pair below was a shape no component ever consumed, so the
      // lab counted zero parts and drew nothing.
      rows: [
        { label: "Quantity A", parts: [{ value: 1 }, { value: 1 }, { value: 1 }] },
        {
          label: "Quantity B",
          parts: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }],
        },
      ],
      label: "Interactive Tape Diagram Explorer",
    };
  }
  if (wb("distributive property")) {
    return {
      kind: "distributive-builder",
      a: 3,
      b: "x",
      c: 4,
      label: "Interactive Distributive Property Area Model",
    };
  }
  if (wb("combine like terms|like terms")) {
    return {
      kind: "combine-like-terms",
      expr: "5x + 3 + 2x - 1",
      label: "Interactive Combine Like Terms Lab",
    };
  }
  if (wb("equations?") && wb("solve|one-step|two-step|balance")) {
    return { kind: "equation-balance-lab", label: "Interactive Equation Pan Balance" };
  }
  if (wb("inequalit\\w*")) {
    return {
      kind: "number-line",
      min: -5,
      max: 5,
      step: 1,
      problems: [{ inequality: "x > 2", boundary: 2, circleType: "open", direction: "right" }],
      label: "Interactive Inequality Number Line",
    };
  }
  if (wb("absolute value")) {
    return { kind: "number-line-explorer", label: "Interactive Absolute Value Explorer" };
  }
  if (wb("coordinate plane|ordered pairs?")) {
    return {
      kind: "coordinate-plane",
      points: [
        { x: 3, y: 4, label: "A" },
        { x: -2, y: 5, label: "B" },
      ],
      label: "Interactive Coordinate Plane Explorer",
    };
  }
  if (wb("number line")) {
    return { kind: "number-line-explorer", label: "Interactive Number Line Explorer" };
  }
  if (wb("area of|parallelogram|trapezoid")) {
    const figure = areaFigure();
    return { kind: "area-morph", figure, label: "Interactive Area Explorer" };
  }
  if (wb("nets?|surface area") && !wb("internet|planet")) {
    return { kind: "net-folder", solid: "cube", label: "Interactive 3D Net Folder" };
  }
  // A lesson that says "volume" and does not say "pyramid" wants a tool that
  // COMPUTES a volume, not one that rotates a cube. Pyramids stay on solid-3d:
  // prism-volume draws rectangular prisms and would show the wrong solid.
  if (wb("volume") && !wb("pyramids?")) {
    return { kind: "prism-volume", label: "Interactive Prism Volume Builder" };
  }
  if (wb("prisms?|pyramids?|volume")) {
    return {
      kind: "solid-3d",
      shape: wb("pyramid") ? "triangular-pyramid" : "cube",
      label: "Interactive 3D Solid Explorer",
    };
  }
  if (wb("cross sections?")) {
    return { kind: "cross-section", label: "Interactive 3D Cross-Section Slicing Tool" };
  }
  // Statistics: use \bmean\b (whole word only — never matches "means")
  if (/\bmean\b/.test(text) || wb("median|data sets?|variability") || /\bMAD\b/.test(text)) {
    return { kind: "stats-data-lab", label: "Interactive Statistics & Live Data Explorer" };
  }
  if (wb("box plots?|quartiles?")) {
    return { kind: "box-plot-builder", label: "Interactive Box Plot Builder" };
  }
  if (wb("histograms?")) {
    return { kind: "histogram-builder", label: "Interactive Histogram Builder" };
  }
  if (wb("dot plots?")) {
    return { kind: "dot-plot", label: "Interactive Dot Plot Explorer" };
  }
  if (wb("fractions?")) {
    return {
      kind: "fraction-divide",
      dividend: "3/4",
      divisor: "1/2",
      label: "Interactive Fraction Division Tool",
    };
  }
  if (wb("equations?")) {
    return { kind: "equation-balance-lab", label: "Interactive Equation Pan Balance" };
  }
  if (wb("expressions?|variables?")) {
    return { kind: "step-solver", label: "Interactive Expression Step Solver" };
  }

  // THE DEFAULT. A lesson reaching this line matched no standard and no
  // keyword, so nothing here knows what it teaches — and it is still handed a
  // tool. That is the "unsafe fallback" class: an unreviewed manipulative
  // mounted in Learn It because the ladder must return something.
  //
  // It is MARKED rather than removed. A lesson with no interactive at all is
  // better than one with the wrong interactive, but silently dropping the tool
  // would trade a visible mismatch for an invisible gap. `fallback: true` lets
  // tools/validate-interactive-alignment.mjs count and report every lesson
  // resolved this way, so the number is a fact rather than a guess.
  return {
    kind: "step-solver",
    label: "Interactive Math Step Solver & Equivalence Checker",
    fallback: true,
  };
}

export function resolveLessonMisconception(config) {
  const cfg = config || {};
  if (cfg.misconception) return cfg.misconception;
  const text =
    `${cfg.title || ""} ${cfg.standard || ""} ${cfg.contentObjective || ""}`.toLowerCase();

  if (text.includes("factor tree") || text.includes("prime factor")) {
    return {
      en: "Don't stop factoring until all numbers at the bottom of the tree are prime numbers (numbers like 2, 3, 5, 7)! Composite numbers like 4 or 6 must be factored further.",
      es: "¡No pares de factorizar hasta que todos los números en la parte inferior del árbol sean números primos (como 2, 3, 5, 7)! Los números compuestos como 4 o 6 deben factorizarse más.",
    };
  }
  if (text.includes("ratio") || text.includes("rate")) {
    return {
      en: "Keep the order of quantities consistent! If the ratio compares apples to oranges (3:5), do not mix up the order when scaling up equivalent ratios.",
      es: "¡Mantén constante el orden de las cantidades! Si la razón compara manzanas con naranjas (3:5), no confundas el orden al calcular razones equivalentes.",
    };
  }
  if (text.includes("fraction") && text.includes("divide")) {
    return {
      en: "Remember to Keep the first fraction, Change division to multiplication, and Flip the second fraction (reciprocal)! Do not flip the first fraction.",
      es: "¡Recuerda Mantener la primera fracción, Cambiar división a multiplicación y Voltear la segunda fracción! No voltees la primera fracción.",
    };
  }
  if (text.includes("decimal")) {
    return {
      en: "Always align the decimal points vertically before adding or subtracting decimals, so you are adding digits in the same place value!",
      es: "¡Siempre alinea los puntos decimales verticalmente antes de sumar o restar decimales para sumar dígitos en el mismo valor posicional!",
    };
  }
  // VOLUME BEFORE AREA, and both narrowed. `text.includes("area")` is a
  // SUBSTRING test, so lesson 5-10 — whose objective is "volume ... using base
  // area × height" — matched on the "area" inside "base area" and was warned
  // about the slant height of a PARALLELOGRAM, in a lesson with no
  // parallelogram in it. The volume branch below is the warning that lesson
  // actually needs, and it is the mistake its own practice section names.
  if (/\bvolumes?\b/.test(text)) {
    return {
      en: "Multiply all three edges — do not add them, and do not round a fractional edge like 1.5 down to 1 before you multiply. Volume answers are in CUBIC units (ft³), not square units.",
      es: "Multiplica las tres aristas: no las sumes ni redondees una arista fraccionaria como 1.5 a 1 antes de multiplicar. El volumen se mide en unidades CÚBICAS (ft³), no cuadradas.",
    };
  }
  if (/\bareas?\b/.test(text)) {
    return {
      en: "When finding the area of a triangle or parallelogram, the height MUST be perpendicular (forms a 90° right angle) to the base. Do not use the slanted side length!",
      es: "Al calcular el área de un triángulo o paralelogramo, la altura DEBE ser perpendicular (formar un ángulo recto de 90°) a la base. ¡No uses el lado inclinado!",
    };
  }
  return {
    en: "Double check your math steps in order! Make sure to verify your solution by substituting your answer back into the original problem.",
    es: "¡Verifica tus pasos matemáticos en orden! Asegúrate de comprobar tu solución probando tu respuesta en el problema original.",
  };
}

/**
 * Shared topic detection and alignment scoring for family homework.
 */

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "to", "of", "in", "on", "for", "with", "is", "are",
  "can", "i", "we", "you", "it", "this", "that", "using", "use", "write", "find",
  "solve", "graph", "show", "explain", "work", "number", "numbers", "math",
]);

function conceptIntro(config) {
  return config.launch?.conceptIntro || config.explore?.conceptIntro || null;
}

function keyIdea(config) {
  const intro = conceptIntro(config);
  return intro?.keyIdea || intro?.intro || config.contentObjective || config.title || "";
}

/** Topic id used for visuals, anti-keywords, and alignment. */
export function detectVisualTopic(config) {
  const standard = String(config.standard || "");
  const title = String(config.title || "").toLowerCase();
  const unit = Number(config.unit) || 0;

  if (standard === "6.EE.1" || /exponent|power/i.test(title)) return "exponents";
  if (/inequal/i.test(title) || standard === "6.EE.5" || standard === "6.EE.8") return "inequalities";
  if (/equation/i.test(title) || standard === "6.EE.6" || standard === "6.EE.7") return "equations";
  if (standard.startsWith("6.EE.2") || standard === "6.EE.3" || standard === "6.EE.4") return "expressions";
  if (standard.startsWith("6.RP")) return "ratios";
  if (unit === 5 || standard === "6.G.1") return "area";
  if (standard === "6.G.2" || /volume/i.test(title)) return "volume";
  if (standard === "6.G.4" || /surface/i.test(title)) return "surface-area";
  if (standard.startsWith("6.SP")) return "statistics";
  if (/coordinate|quadrant|reflect|distance on/i.test(title)) return "coordinate-plane";
  if (/integer|absolute|rational number/i.test(title)) return "number-line";
  if (standard.startsWith("6.NS.1") || /fraction|mixed number/i.test(title)) return "fractions";
  if (standard === "6.NS.2" || standard === "6.NS.3" || /decimal/i.test(title)) return "decimals";
  if (standard === "6.NS.4" || /prime|factor|lcm|gcf|multiple/i.test(title)) return "factors";
  if (/divide multi/i.test(title)) return "decimals";
  return "fallback";
}

const TOPIC_KEYWORDS = {
  exponents: ["exponent", "power", "base", "evaluate", "²", "³", "multiply", "repeated"],
  expressions: ["expression", "variable", "coefficient", "term", "evaluate", "algebraic"],
  equations: ["equation", "variable", "equal", "unknown", "represents", "write", "solve"],
  inequalities: ["inequality", "inequal", "graph", "number line", "solution set", "shade", "circle"],
  ratios: ["ratio", "equivalent", "table", "compare", "batch", "rate"],
  area: ["area", "parallelogram", "triangle", "trapezoid", "polygon", "composite", "base", "height"],
  volume: ["volume", "prism", "cubic", "length", "width", "height", "layer"],
  "surface-area": ["surface", "net", "face", "lateral", "pyramid", "prism"],
  statistics: ["mean", "median", "mode", "data", "statistical", "plot", "histogram", "box", "deviation"],
  "coordinate-plane": ["coordinate", "quadrant", "ordered pair", "plane", "axis", "reflect", "distance"],
  "number-line": ["integer", "absolute", "compare", "order", "rational", "number line", "negative"],
  fractions: ["fraction", "divide", "mixed", "reciprocal", "numerator", "denominator"],
  decimals: ["decimal", "divide", "multiply", "add", "subtract", "place value"],
  factors: ["prime", "factor", "composite", "multiple", "lcm", "gcf", "factorization"],
};

const ANTI_KEYWORDS = {
  exponents: ["ratio", "percent", "area", "volume", "mean", "median"],
  expressions: ["ratio", "percent", "area", "volume", "inequality"],
  equations: ["exponent", "power", "²", "³", "ratio table", "percent", "area", "volume", "mean"],
  inequalities: ["exponent", "power", "ratio table", "percent", "area", "volume"],
  ratios: ["exponent", "equation", "inequality", "area", "volume", "mean"],
  area: ["exponent", "ratio", "equation", "volume", "mean"],
  volume: ["exponent", "ratio", "equation", "area", "mean"],
  "surface-area": ["exponent", "ratio", "equation", "mean"],
  statistics: ["exponent", "equation", "area", "volume", "ratio table"],
  "coordinate-plane": ["exponent", "area", "volume", "prime factor"],
  "number-line": ["exponent", "area", "volume", "ratio table"],
  fractions: ["exponent", "area", "volume", "mean", "equation"],
  decimals: ["exponent", "area", "volume", "ratio", "fraction divide"],
  factors: ["exponent", "area", "volume", "equation", "ratio"],
};

export function extractLessonKeywords(config) {
  const topic = detectVisualTopic(config);
  const words = new Set(TOPIC_KEYWORDS[topic] || []);

  for (const v of config.vocabulary || []) {
    for (const part of [v.term, v.termEs, v.definition]) {
      tokenize(part).forEach((t) => words.add(t));
    }
  }

  tokenize(keyIdea(config)).forEach((t) => words.add(t));
  tokenize(config.contentObjective).forEach((t) => words.add(t));
  tokenize(config.title).forEach((t) => words.add(t));

  return {
    topic,
    keywords: [...words].filter((w) => w.length > 2),
    antiKeywords: ANTI_KEYWORDS[topic] || [],
  };
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9²³]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
}

export function extractProblemText(problem) {
  if (!problem || typeof problem !== "object") return "";
  const chunks = [
    problem.stem,
    problem.label,
    problem.instructions,
    problem.prompt,
    problem.title,
    problem.equation,
    problem.inequality,
  ];

  if (Array.isArray(problem.choices)) chunks.push(...problem.choices);
  if (Array.isArray(problem.categories)) {
    for (const c of problem.categories) {
      chunks.push(c.label, c.id);
      if (Array.isArray(c.items)) chunks.push(...c.items);
    }
  }
  if (Array.isArray(problem.items)) {
    for (const it of problem.items) {
      chunks.push(typeof it === "string" ? it : it.text);
    }
  }
  if (Array.isArray(problem.pairs)) {
    for (const p of problem.pairs) {
      chunks.push(p.term, p.match);
    }
  }
  if (Array.isArray(problem.rows)) {
    for (const row of problem.rows) {
      if (typeof row === "object") chunks.push(...Object.values(row));
    }
  }
  if (Array.isArray(problem.workedExample)) {
    for (const step of problem.workedExample) chunks.push(step.label, step.work);
  }

  return chunks.filter(Boolean).join(" ");
}

export function scoreTextAlignment(text, { keywords, antiKeywords }) {
  const lower = String(text || "").toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) score += 2;
  }
  for (const bad of antiKeywords) {
    if (lower.includes(bad.toLowerCase())) score -= 6;
  }
  return score;
}

export function scoreProblemAlignment(problem, lessonMeta) {
  const text = extractProblemText(problem);
  return scoreTextAlignment(text, lessonMeta);
}

export function isPrintableProblem(it) {
  if (!it || typeof it !== "object") return false;
  return [
    "multiple-choice",
    "fill-table",
    "matching-game",
    "drag-sort",
    "error-analysis",
    "open-response",
  ].includes(it.type);
}

export function selectAlignedQuickCheckProblems(practice = {}, config = {}) {
  const lessonMeta = extractLessonKeywords(config);
  const onLevel = Array.isArray(practice.onLevel) ? practice.onLevel : [];
  const approaching = Array.isArray(practice.approaching) ? practice.approaching : [];
  const optional = Array.isArray(practice.optional) ? practice.optional : [];
  const extending = Array.isArray(practice.extending) ? practice.extending : [];

  const pool = [...approaching, ...onLevel, ...optional, ...extending].filter(isPrintableProblem);
  const preferredTypes = ["multiple-choice", "drag-sort", "matching-game", "fill-table"];

  const ranked = pool
    .map((p, idx) => ({
      p,
      idx,
      typeBoost: preferredTypes.includes(p.type) ? 3 : 0,
      tierBoost: idx < approaching.length ? 1 : idx < approaching.length + onLevel.length ? 2 : 0,
      align: scoreProblemAlignment(p, lessonMeta),
    }))
    .sort((a, b) => b.align + b.typeBoost + b.tierBoost - (a.align + a.typeBoost + a.tierBoost));

  const positive = ranked.filter((r) => r.align >= 0);
  const picked = (positive.length ? positive : ranked).slice(0, 2).map((r) => r.p);

  if (picked.length < 2) {
    for (const p of pool) {
      if (picked.length >= 2) break;
      if (!picked.includes(p)) picked.push(p);
    }
  }

  return picked.slice(0, 2);
}

export function detectVisualMismatch(config, html) {
  const topic = detectVisualTopic(config);
  const checks = {
    exponents: /exponent|Base = \d · Exponent/i.test(html),
    equations: /equation|n \+ \d+ =|variable|equal sign/i.test(html),
    inequalities: /inequal|number line|solution set|shade|open circle/i.test(html),
    expressions: /expression|variable|coefficient|term/i.test(html),
    ratios: /ratio|Ratio Table|equivalent ratio/i.test(html),
    area: /area|parallelogram|triangle|trapezoid|base × height/i.test(html),
    volume: /volume|V = L × W × H|cubic/i.test(html),
    "surface-area": /surface|net|face/i.test(html),
    statistics: /mean|median|data|histogram|box plot/i.test(html),
    "coordinate-plane": /coordinate|quadrant|ordered pair|x-axis/i.test(html),
    "number-line": /integer|absolute value|number line|rational/i.test(html),
    fractions: /fraction|÷|divide|mixed number/i.test(html),
    decimals: /decimal|place value|\.\d+/i.test(html),
    factors: /prime|factor|GCF|LCM|composite/i.test(html),
    fallback: true,
  };

  const introOk = topic === "fallback" || checks[topic];
  const anti = ANTI_KEYWORDS[topic] || [];
  let wrongTopic = false;
  if (topic === "equations" || topic === "inequalities") {
    wrongTopic = /Base = \d · Exponent|introduction-to-exponents|2³|Multiply 2 three times/i.test(html);
  } else if (topic !== "exponents") {
    wrongTopic = /Base = \d · Exponent = \d · Multiply/i.test(html);
  }
  for (const bad of anti) {
    if (bad.length > 4 && new RegExp(bad, "i").test(html.slice(0, 8000))) {
      // only flag strong cross-topic signals in visual/header region
    }
  }

  return { topic, introOk, wrongTopic };
}

export function scoreHomeworkAlignment(config, html) {
  const lessonMeta = extractLessonKeywords(config);
  const { topic, wrongTopic } = detectVisualMismatch(config, html);

  const keyEn = keyIdea(config).toLowerCase();
  const headerSlice = html.slice(0, 12000).toLowerCase();

  let score = 100;
  const issues = [];

  if (wrongTopic) {
    score -= 50;
    issues.push(`Visual explainer shows wrong topic (expected ${topic})`);
  }

  const keywordHits = lessonMeta.keywords.filter((kw) => headerSlice.includes(kw.toLowerCase())).length;
  if (keywordHits < 2) {
    score -= 15;
    issues.push("Few lesson keywords in intro section");
  }

  const problemStems = [...html.matchAll(/class="problem-stem"[^>]*>([^<]+)/g)].map((m) => m[1]);
  if (!problemStems.length) {
    score -= 30;
    issues.push("No quick-check problem stems found");
  } else {
    for (const stem of problemStems) {
      const ps = scoreTextAlignment(stem, lessonMeta);
      if (ps < 0) {
        score -= 25;
        issues.push(`Problem stem misaligned: ${stem.slice(0, 60)}…`);
      }
    }
  }

  if (!keyEn || !headerSlice.includes(keyEn.slice(0, 20))) {
    score -= 10;
  }

  return { score, issues, topic, critical: wrongTopic || score < 50 };
}

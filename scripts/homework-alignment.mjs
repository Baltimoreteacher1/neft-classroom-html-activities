/**
 * Shared topic detection and alignment scoring for family homework.
 */

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "is",
  "are",
  "can",
  "i",
  "we",
  "you",
  "it",
  "this",
  "that",
  "using",
  "use",
  "write",
  "find",
  "solve",
  "graph",
  "show",
  "explain",
  "work",
  "number",
  "numbers",
  "math",
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

  if (standard === "6.AT.5" || /exponent|power/i.test(title)) return "exponents";
  if (/inequal/i.test(title) || standard === "6.AT.9") return "inequalities";
  if (/equation/i.test(title) || standard === "6.AT.8") return "equations";
  // A graphing lesson (e.g. "Graph Ratio Tables") is about plotting on the plane,
  // so the coordinate-plane visual fits better than a ratio table — check before ratios.
  if (/graph/i.test(title) && /ratio|coordinate|plane|plot|ordered pair/i.test(title))
    return "coordinate-plane";
  // Properties of operations (commutative/associative/identity/distributive) is a
  // distinct concept from naming the parts of an expression, even though both can
  // carry standard 6.AT.7. Detect by title so the big-idea visual matches the lesson.
  if (/propert/i.test(title) || /distributive/i.test(title)) return "properties";
  if (
    standard.startsWith("6.AT.6") ||
    standard === "6.AT.7" ||
    standard === "6.AT.7" ||
    /express|algebraic|variable|coefficient|like term|simplif|equivalent expression/i.test(title)
  )
    return "expressions";
  if (standard.startsWith("6.AT") || /\bratio|unit rate|\brate\b|percent/i.test(title))
    return "ratios";
  if (unit === 5 || standard === "6.GR.1") return "area";
  if (standard === "6.GR.2" || /volume/i.test(title)) return "volume";
  if (standard === "6.GR.4" || /surface/i.test(title)) return "surface-area";
  if (
    standard.startsWith("6.DS") ||
    /box plot|dot plot|histogram|display data|data distribution/i.test(title)
  )
    return "statistics";
  if (/coordinate|quadrant|reflect|distance on/i.test(title)) return "coordinate-plane";
  if (/integer|absolute|rational number/i.test(title)) return "number-line";
  if (standard.startsWith("6.NOS.1") || /fraction|mixed number/i.test(title)) return "fractions";
  if (standard === "6.NOS.2" || standard === "6.NOS.3" || /decimal/i.test(title)) return "decimals";
  if (standard === "6.NOS.4" || /prime|factor|lcm|gcf|multiple/i.test(title)) return "factors";
  if (/divide multi/i.test(title)) return "decimals";
  return "fallback";
}

const TOPIC_KEYWORDS = {
  exponents: ["exponent", "power", "base", "evaluate", "²", "³", "multiply", "repeated"],
  expressions: ["expression", "variable", "coefficient", "term", "evaluate", "algebraic"],
  equations: ["equation", "variable", "equal", "unknown", "represents", "write", "solve"],
  inequalities: [
    "inequality",
    "inequal",
    "graph",
    "number line",
    "solution set",
    "shade",
    "circle",
  ],
  ratios: ["ratio", "equivalent", "table", "compare", "batch", "rate"],
  area: [
    "area",
    "parallelogram",
    "triangle",
    "trapezoid",
    "polygon",
    "composite",
    "base",
    "height",
  ],
  volume: ["volume", "prism", "cubic", "length", "width", "height", "layer"],
  "surface-area": ["surface", "net", "face", "lateral", "pyramid", "prism"],
  statistics: [
    "mean",
    "median",
    "mode",
    "data",
    "statistical",
    "plot",
    "histogram",
    "box",
    "deviation",
  ],
  "coordinate-plane": [
    "coordinate",
    "quadrant",
    "ordered pair",
    "plane",
    "axis",
    "reflect",
    "distance",
  ],
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
  // Family homework is straight practice — no "find the error" / error-analysis
  // problems. Families want to DO the math, easiest → hardest, not critique a
  // fictional student's mistake.
  return ["multiple-choice", "fill-table", "matching-game", "drag-sort", "open-response"].includes(
    it.type,
  );
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

  const TARGET = 6;
  const positive = ranked.filter((r) => r.align >= 0);
  const picked = (positive.length ? positive : ranked).slice(0, TARGET).map((r) => r.p);

  if (picked.length < TARGET) {
    for (const p of pool) {
      if (picked.length >= TARGET) break;
      if (!picked.includes(p)) picked.push(p);
    }
  }

  return picked.slice(0, TARGET);
}

// Extra practice beyond the core Quick Check set, for the "More practice" accordion.
// Returns the rest of the printable pool (best-aligned first), excluding anything
// already shown in `exclude`, capped so the page stays manageable.
export function selectMorePracticeProblems(practice = {}, config = {}, exclude = []) {
  const MAX_MORE = 8;
  const lessonMeta = extractLessonKeywords(config);
  const onLevel = Array.isArray(practice.onLevel) ? practice.onLevel : [];
  const approaching = Array.isArray(practice.approaching) ? practice.approaching : [];
  const optional = Array.isArray(practice.optional) ? practice.optional : [];
  const extending = Array.isArray(practice.extending) ? practice.extending : [];

  const pool = [...approaching, ...onLevel, ...optional, ...extending].filter(isPrintableProblem);
  const remaining = pool.filter((p) => !exclude.includes(p));

  return remaining
    .map((p) => ({ p, align: scoreProblemAlignment(p, lessonMeta) }))
    .sort((a, b) => b.align - a.align)
    .slice(0, MAX_MORE)
    .map((r) => r.p);
}

// Split the core Quick Check set into two clearly-sectioned tiers so families
// practice the concept on EASY problems first, then move to a slightly harder
// challenge set. Difficulty comes straight from the lesson's practice tiers:
//   approaching (easiest, scaffolded) → onLevel → extending (hardest).
// Within each tier we order by topic alignment so the most on-point problems
// surface first. Returns { warmup, challenge } with no overlap.
export function selectTieredQuickCheckProblems(practice = {}, config = {}) {
  const WARMUP_TARGET = 3;
  const CHALLENGE_TARGET = 3;
  const lessonMeta = extractLessonKeywords(config);

  const tier = (key) =>
    (Array.isArray(practice[key]) ? practice[key] : []).filter(isPrintableProblem);
  const approaching = tier("approaching");
  const onLevel = tier("onLevel");
  const optional = tier("optional");
  const extending = tier("extending");

  // Best-aligned first within a pool, de-duplicated.
  const byAlign = (arr) => {
    const seen = new Set();
    return arr
      .filter((p) => (seen.has(p) ? false : (seen.add(p), true)))
      .map((p) => ({ p, align: scoreProblemAlignment(p, lessonMeta) }))
      .sort((a, b) => b.align - a.align)
      .map((r) => r.p);
  };

  // Easy pool leans on scaffolded "approaching" problems, then on-level basics.
  const easyPool = byAlign([...approaching, ...onLevel, ...optional]);
  // Hard pool leans on "extending" stretch problems, then remaining on-level.
  const hardPool = byAlign([...extending, ...onLevel, ...optional]);

  const warmup = [];
  for (const p of easyPool) {
    if (warmup.length >= WARMUP_TARGET) break;
    warmup.push(p);
  }

  const challenge = [];
  for (const p of hardPool) {
    if (challenge.length >= CHALLENGE_TARGET) break;
    if (!warmup.includes(p)) challenge.push(p);
  }

  // Sparse-tier fallbacks: keep both sections populated when one tier is thin,
  // pulling the hardest leftovers into challenge and easiest leftovers into warmup.
  if (challenge.length < CHALLENGE_TARGET) {
    for (const p of [...easyPool].reverse()) {
      if (challenge.length >= CHALLENGE_TARGET) break;
      if (!warmup.includes(p) && !challenge.includes(p)) challenge.push(p);
    }
  }
  if (warmup.length < WARMUP_TARGET) {
    for (const p of easyPool) {
      if (warmup.length >= WARMUP_TARGET) break;
      if (!warmup.includes(p) && !challenge.includes(p)) warmup.push(p);
    }
  }

  return { warmup, challenge };
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
    wrongTopic = /Base = \d · Exponent|introduction-to-exponents|2³|Multiply 2 three times/i.test(
      html,
    );
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

/* Words a lesson is actually NAMED for — the ones that tell it apart from its
   neighbours, not the vocabulary the whole unit shares. Built from the title and
   the vocabulary terms with the generic mathematical scaffolding removed. */
const GENERIC_SIGNATURE = new Set([
  "determine",
  "describe",
  "understand",
  "represent",
  "explore",
  "apply",
  "identify",
  "relate",
  "compare",
  "analyze",
  "generate",
  "solve",
  "problem",
  "problems",
  "solving",
  "using",
  "with",
  "their",
  "from",
  "into",
  "within",
  "between",
  "them",
  "then",
  "area",
  "data",
  "number",
  "numbers",
  "value",
  "values",
  "expression",
  "expressions",
  "equation",
  "equations",
  "measure",
  "measures",
  "measurement",
  "measurements",
  "unit",
  "units",
  "system",
  "systems",
  "point",
  "points",
  "line",
  "lines",
  "find",
  "write",
  "evaluate",
  "graph",
  "model",
  "models",
  "same",
  "given",
  "part",
  "whole",
  "percent",
  "percents",
  "percentage",
  "percentages",
  "ratio",
  "ratios",
  "fraction",
  "fractions",
  "digit",
  "algorithm",
  "concepts",
  "relationships",
  "variables",
]);

export function lessonSignatureTerms(config) {
  /* TITLE ONLY, deliberately. Vocabulary is shared across a unit — the trapezoid
     note and the triangle lesson both say "height" and "base" — so including
     vocabulary terms let the shipped defect pass. The title is what distinguishes
     one lesson from its neighbours. Compared with a trailing "s" trimmed so
     "Triangles" matches a note that says "triangle". */
  return [...new Set(tokenize(config.title).map(stemWord))].filter(
    (w) => w.length > 4 && !GENERIC_SIGNATURE.has(w),
  );
}

function stemWord(word) {
  return String(word || "")
    .replace(/(ies)$/, "y")
    .replace(/s$/, "");
}

/* A note is "misfiled" when it names another lesson's distinctive topic and never
   names its own. That relative test is what catches the defect that shipped —
   5-2's note (Area of Triangles) opened with "the area of a trapezoid" — while
   staying quiet about thematic titles like "Math is Beauty", where an absolute
   "must name its own title" rule produced 19 false alarms.

   `lessons` is [{ id, config }] with config.familyNotes already merged. */
export function findNoteOwnershipConflicts(lessons) {
  const metas = lessons.map(({ id, config }) => ({
    id,
    config,
    meta: extractLessonKeywords(config),
    signature: lessonSignatureTerms(config),
  }));

  const conflicts = [];
  for (const { id, config, signature } of metas) {
    const note = config.familyNotes;
    if (!note) continue;
    const text = [note.learningTonight?.en, note.bigIdea?.en].filter(Boolean).join(" ").trim();
    if (!text) continue;

    /* Condition 1: the note never names the topic its own title is built on.
       Thematic titles ("Math is Beauty") yield no signature, so they opt out. */
    if (!signature.length) continue;
    if (signature.some((t) => text.toLowerCase().includes(t))) continue;

    /* Condition 2: some OTHER lesson matches the note materially better. Both
       conditions are required because either alone is noisy — sibling lessons
       legitimately share vocabulary (3-6 and 3-10 are both unit conversion),
       and plenty of good notes phrase a title's topic in student words. */
    const scored = metas
      .map((l) => ({ id: l.id, score: scoreTextAlignment(text, l.meta) }))
      .sort((a, b) => b.score - a.score);
    const own = scored.find((s) => s.id === id).score;
    const best = scored[0];
    if (best.id === id || best.score - own < NOTE_OWNERSHIP_GAP) continue;

    conflicts.push({
      id,
      suspectedOwner: best.id,
      ownScore: own,
      bestScore: best.score,
      text: text.slice(0, 90),
    });
  }
  return conflicts;
}

/* Separation measured on the real curriculum: with every note on its correct
   lesson the largest honest gap is 6, while 5-3's trapezoid note pasted onto 5-2
   (the defect that shipped) scores 14 ahead. 10 sits between them. */
export const NOTE_OWNERSHIP_GAP = 10;

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

  const keywordHits = lessonMeta.keywords.filter((kw) =>
    headerSlice.includes(kw.toLowerCase()),
  ).length;
  if (keywordHits < 2) {
    score -= 15;
    issues.push("Few lesson keywords in intro section");
  }

  /* Stems are bilingual: `<p class="problem-stem"><span class="lang-en">EN</span>
     <span class="lang-es">ES</span></p>`. Capture the whole element and strip
     tags, then keep only the English half — the alignment keywords are English,
     so scoring the Spanish text too would report false misalignment. A stem with
     no Spanish authored has no spans at all and still reads correctly here. */
  const problemStems = [...html.matchAll(/class="problem-stem"[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => {
      const en = m[1].match(/<span class="lang-en">([\s\S]*?)<\/span>/);
      return (en ? en[1] : m[1]).replace(/<[^>]*>/g, "").trim();
    })
    .filter(Boolean);
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

  /* The curated family note is the FIRST thing a parent reads, and until
     2026-08-11 nothing scored it. Every note in data/family-homework-notes/ was
     still keyed to the pre-renumber lesson ids, so lesson 5-2 ("Determine the
     Area of Triangles") shipped a note teaching trapezoids — and this audit
     reported 84/84 aligned the whole time, because it only ever read the
     generated problems and visuals. Scoring the note against the lesson's own
     keywords is what makes that class of drift fail loudly. */
  const note = config.familyNotes;
  if (note) {
    const noteText = [note.learningTonight?.en, note.bigIdea?.en].filter(Boolean).join(" ").trim();
    if (!noteText) {
      score -= 20;
      issues.push("Family note has no English learning summary");
    } else {
      if (scoreTextAlignment(noteText, lessonMeta) < 0) {
        score -= 50;
        issues.push(`Family note teaches a different topic: ${noteText.slice(0, 70)}…`);
      }
    }
  }

  return { score, issues, topic, critical: wrongTopic || score < 50 };
}

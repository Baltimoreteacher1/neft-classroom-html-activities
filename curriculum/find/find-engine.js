// Find: plain-language search over every Grade 6 resource (data/curriculum-find-index.json).
// Pure functions, no DOM: curriculum/find/find.js renders with them and tools/curriculum-find.test.mjs imports them.
//
//   parseQuery("printable activity about percentages")
//     -> { topics: ["percent"], standards: ["6.AT.4"], printable: true, kind: null, ... rest: [] }
//   search(index, query, { limit })  -> [{ doc, score, why: ["About percent (6.AT.4)", "Printable: PDF"] }, ...]
//   companions(index, doc)           -> up to four resources for the same lesson or standard, one per kind
//
// Nothing here guesses a fact a document does not carry: a topic comes from the standards registry (the doc's
// standard -> its topic), a format from the download manifest, an audience from the catalog. Time is not
// recorded for these resources, so "10-minute" ranks short formats first and says so instead of inventing minutes.

/* ---------- vocabulary -------------------------------------------------- */

// Words that name a TOPIC, keyed by the registry's topic slug (data/ccss-standards.json `topic`).
// A phrase may also pin exact standards when the topic is broader than what was asked.
export const TOPIC_WORDS = {
  ratios: [
    "ratio",
    "ratios",
    "proportion",
    "proportional",
    "equivalent ratio",
    "equivalent ratios",
    "ratio table",
    "ratio tables",
    "double number line",
    "tape diagram",
  ],
  percent: [
    "percent",
    "percents",
    "percentage",
    "percentages",
    "%",
    "discount",
    "discounts",
    "sale",
    "tax",
    "tip",
    "markup",
  ],
  rates: ["rate", "rates", "unit rate", "unit rates", "unit price", "speed", "per"],
  conversion: ["convert", "conversion", "converting", "measurement units", "unit conversion"],
  fractions: ["fraction", "fractions", "dividing fractions", "fraction division", "reciprocal"],
  decimals: [
    "decimal",
    "decimals",
    "long division",
    "division algorithm",
    "divide",
    "dividing",
    "multi-digit",
  ],
  factors: [
    "factor",
    "factors",
    "gcf",
    "lcm",
    "greatest common factor",
    "least common multiple",
    "multiple",
    "multiples",
    "prime",
    "prime factorization",
  ],
  "number-line": [
    "integer",
    "integers",
    "negative",
    "negatives",
    "negative numbers",
    "positive",
    "absolute value",
    "opposite",
    "opposites",
    "number line",
    "rational number",
    "rational numbers",
  ],
  "coordinate-plane": [
    "coordinate",
    "coordinates",
    "coordinate plane",
    "ordered pair",
    "ordered pairs",
    "quadrant",
    "quadrants",
    "graphing points",
    "plot points",
  ],
  exponents: [
    "exponent",
    "exponents",
    "power",
    "powers",
    "squared",
    "cubed",
    "order of operations",
  ],
  expressions: [
    "expression",
    "expressions",
    "algebraic expression",
    "variable",
    "variables",
    "evaluate",
    "evaluating",
    "term",
    "terms",
    "coefficient",
    "distributive",
    "distributive property",
    "like terms",
  ],
  "equivalent-expressions": [
    "equivalent expression",
    "equivalent expressions",
    "equivalent algebraic expressions",
    "combine like terms",
    "combining like terms",
  ],
  equations: [
    "equation",
    "equations",
    "solve",
    "solving",
    "one-step",
    "one step equation",
    "balance",
  ],
  inequalities: ["inequality", "inequalities", "greater than", "less than"],
  relationships: [
    "two-variable",
    "two variable",
    "dependent",
    "independent",
    "dependent variable",
    "independent variable",
    "table graph equation",
    "relationship",
    "relationships",
  ],
  area: [
    "area",
    "areas",
    "triangle",
    "triangles",
    "parallelogram",
    "parallelograms",
    "trapezoid",
    "trapezoids",
    "polygon",
    "polygons",
    "composite figure",
    "composite figures",
  ],
  volume: ["volume", "volumes", "prism", "prisms", "cube", "cubes", "rectangular prism"],
  "surface-area": ["surface area", "net", "nets"],
  statistics: [
    "statistics",
    "statistical",
    "data",
    "mean",
    "median",
    "mode",
    "range",
    "average",
    "box plot",
    "box plots",
    "histogram",
    "histograms",
    "dot plot",
    "dot plots",
    "iqr",
    "interquartile",
    "mad",
    "mean absolute deviation",
    "variability",
    "distribution",
    "outlier",
    "outliers",
  ],
  practices: ["math practices", "reasoning", "argument", "critique", "mindset", "math is mine"],
};

// A topic slug that is narrower than the registry's topic names the standards it means.
const TOPIC_STANDARDS = {
  percent: ["6.AT.4"],
  rates: ["6.AT.2", "6.AT.3"],
  conversion: ["6.AT.3c"],
  ratios: ["6.AT.1", "6.AT.3", "6.AT.3a"],
  "equivalent-expressions": ["6.AT.7"],
  equations: ["6.AT.8"],
  inequalities: ["6.AT.9", "6.NOS.8a"],
  relationships: ["6.AT.11"],
};
// …and the registry topic each one belongs to, for a weaker match on the same topic.
const TOPIC_PARENT = {
  percent: "ratios",
  rates: "ratios",
  conversion: "ratios",
  "equivalent-expressions": "expressions",
  equations: "inequalities",
  relationships: "expressions",
};

export const KIND_WORDS = {
  game: ["game", "games", "play", "arcade", "fun"],
  project: ["project", "projects", "design challenge", "build"],
  lab: [
    "lab",
    "labs",
    "learning lab",
    "investigation",
    "investigations",
    "simulation",
    "simulations",
    "explore",
    "exploration",
  ],
  practice: ["practice", "practise", "drill", "independent practice", "skill practice", "fluency"],
  vocabulary: ["vocabulary", "vocab", "word wall", "words", "terms", "glossary"],
  review: [
    "review",
    "test prep",
    "study guide",
    "assessment",
    "quiz",
    "test",
    "check",
    "exit ticket",
  ],
  lesson: ["lesson", "lessons", "whole group", "whole-group", "mini lesson"],
  reading: ["novel", "book", "chapter", "read aloud", "graphic novel"],
  "small-group": ["small group", "small-group", "small groups", "guided group"],
};
export const AUDIENCE_WORDS = {
  f: [
    "family",
    "families",
    "parent",
    "parents",
    "at home",
    "home",
    "caregiver",
    "caregivers",
    "grown-up",
    "grownup",
    "weekend",
  ],
  t: ["teacher", "teachers", "for my class", "plan", "planning", "teach", "teaching"],
  s: ["student", "students", "independent", "on my own", "by myself", "kid", "kids"],
};
const PRINT_WORDS = [
  "printable",
  "print",
  "printout",
  "printouts",
  "worksheet",
  "worksheets",
  "pdf",
  "paper",
  "handout",
  "handouts",
  "word document",
  "docx",
];
const SUPPORT_WORDS = [
  "intervention",
  "reteach",
  "re-teach",
  "extra help",
  "extra support",
  "struggling",
  "catch up",
  "catch-up",
  "scaffold",
  "scaffolded",
  "support",
  "below grade",
  "foundational",
  "remediation",
];
const CHALLENGE_WORDS = [
  "challenge",
  "challenging",
  "extension",
  "enrichment",
  "advanced",
  "gifted",
  "stretch",
  "harder",
];
const ELL_WORDS = [
  "english learner",
  "english learners",
  "english language learner",
  "english language learners",
  "ell",
  "ells",
  "esol",
  "el students",
  "multilingual",
  "newcomer",
  "newcomers",
  "beginning english",
  "beginning english learners",
  "beginning english learner",
  "learners",
  "learner",
  "emergent bilingual",
  "spanish",
  "bilingual",
  "language support",
  "language supports",
  "visual support",
  "visual supports",
  "visual",
];
const SHORT_WORDS = ["quick", "short", "brief", "warm up", "warm-up", "bell ringer"];
// Language-domain words: The Language Page is the right place, so Find offers it rather than pretending.
const LANGUAGE_WORDS = [
  "speaking",
  "speak",
  "listening",
  "listen",
  "reading skills",
  "writing",
  "write",
  "essay",
  "sentence",
  "sentences",
  "phonics",
  "grammar",
  "science",
  "ecosystem",
  "ecosystems",
  "social studies",
  "wida",
  "access test",
  "morphology",
];

const STOP = new Set(
  "a an the and or of for to in on at with about my me i we our find show give need want looking look some any something activity activities resource resources that this these those grade grades th sixth 6 6th please can you get using use help".split(
    " ",
  ),
);

/* ---------- parsing ----------------------------------------------------- */

export const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[“”"’']/g, "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\b(\d{1,2})\.(\d{1,2})\b/g, "$1-$2")
    .replace(/[^a-z0-9%\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Remove every phrase of `words` found in `text` (longest first, whole words); return what was found. */
function take(text, words) {
  const found = [];
  let rest = ` ${text} `;
  for (const w of [...words].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(^|\\s)${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "g");
    if (re.test(rest)) {
      found.push(w);
      rest = rest.replace(re, " ");
    }
  }
  return { found, rest: rest.replace(/\s+/g, " ").trim() };
}

export function parseQuery(raw) {
  let text = norm(raw);
  const q = {
    raw: String(raw ?? ""),
    topics: [],
    standards: [],
    kind: null,
    audience: null,
    printable: false,
    level: null,
    ell: false,
    short: false,
    minutes: null,
    language: [],
    grades: [],
    unit: null,
    lesson: null,
    rest: [],
  };

  // Time: "10-minute", "10 min", "15 minutes"
  const time = text.match(/\b(\d{1,3})\s*-?\s*(?:min|mins|minute|minutes)\b/);
  if (time) {
    q.minutes = Number(time[1]);
    q.short = q.minutes <= 20;
    text = text.replace(time[0], " ");
  }
  // Lesson and unit ids: "3-4", "lesson 3.4", "unit 6"
  const lesson = /\bgrades?\s*\d\s*-/.test(text)
    ? null
    : text.match(/\b(?:lesson\s*)?(\d{1,2})-(\d{1,2})\b/);
  if (lesson) {
    q.lesson = `${Number(lesson[1])}-${Number(lesson[2])}`;
    text = text.replace(lesson[0], " ");
  }
  // Grades: "grade 6", "grades 6-8", "6th grade" (a bare "6-8" is a lesson number, parsed above)
  const grade = text.match(
    /\bgrades?\s*(\d)(?:\s*-\s*(\d))?\b|\b(\d)(?:st|nd|rd|th)\s*grade\b|\b(\d)\s*-\s*(\d)\b/,
  );
  if (grade) {
    const lo = Number(grade[1] || grade[3]);
    const hi = Number(grade[2] || lo);
    for (let g = lo; g <= hi && g <= 12; g++) q.grades.push(g);
    text = text.replace(grade[0], " ");
  }
  const unit = text.match(/\bunit\s*(\d{1,2})\b/);
  if (unit) {
    q.unit = Number(unit[1]);
    text = text.replace(unit[0], " ");
  }
  // A standard code typed directly ("6.AT.7", "6.rp.3")
  const code = String(raw ?? "").match(/\b(?:6|5|MPP)\.[A-Z]{1,3}\.?[A-D]?\.?\d+[a-d]?\b/i);
  if (code) q.standards.push(code[0].toUpperCase().replace(/\.([A-D])\./, "."));

  let r = take(text, ELL_WORDS);
  q.ell = r.found.length > 0;
  text = r.rest;
  r = take(text, LANGUAGE_WORDS);
  q.language = r.found;
  text = r.rest;
  r = take(text, PRINT_WORDS);
  q.printable = r.found.length > 0;
  text = r.rest;
  r = take(text, SHORT_WORDS);
  if (r.found.length) q.short = true;
  text = r.rest;
  r = take(text, SUPPORT_WORDS);
  if (r.found.length) q.level = "support";
  text = r.rest;
  r = take(text, CHALLENGE_WORDS);
  if (r.found.length) q.level = "challenge";
  text = r.rest;

  // Topics before kinds: "practice equivalent expressions" is a topic with a kind, and "nets" is not "net".
  for (const [topic, words] of Object.entries(TOPIC_WORDS).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    r = take(text, words);
    if (r.found.length) {
      q.topics.push(topic);
      text = r.rest;
    }
  }
  // "equivalent expressions" also matched "expressions": keep the narrow one only.
  if (q.topics.includes("equivalent-expressions"))
    q.topics = q.topics.filter((t) => t !== "expressions");
  for (const t of q.topics)
    for (const s of TOPIC_STANDARDS[t] || []) if (!q.standards.includes(s)) q.standards.push(s);

  for (const [audience, words] of Object.entries(AUDIENCE_WORDS)) {
    r = take(text, words);
    if (r.found.length && !q.audience) q.audience = audience;
    text = r.rest;
  }
  for (const [kind, words] of Object.entries(KIND_WORDS)) {
    r = take(text, words);
    if (r.found.length && !q.kind) q.kind = kind;
    text = r.rest;
  }
  q.rest = text.split(" ").filter((w) => w.length > 1 && !STOP.has(w));
  return q;
}

/* ---------- ranking ----------------------------------------------------- */

const KIND_LABEL = {
  lesson: "Lesson",
  practice: "Practice",
  "small-group": "Small group",
  "catch-up": "Catch-up",
  readiness: "Get ready",
  family: "Family",
  project: "Project",
  hub: "Hub",
  enrichment: "Enrichment",
  review: "Review",
  activity: "Activity",
  lab: "Learning lab",
  tool: "Tool",
  game: "Game",
  vocabulary: "Vocabulary",
  reading: "Reading",
  printable: "Printable",
};
export const kindLabel = (k) => KIND_LABEL[k] || "Resource";
const SHORT_KINDS = new Set(["practice", "game", "family", "readiness", "vocabulary"]);
const AUDIENCE_LABEL = { s: "students", f: "families", t: "teachers" };
export const audienceLabel = (a) =>
  [...String(a || "s")]
    .map((c) => AUDIENCE_LABEL[c])
    .filter(Boolean)
    .join(", ");

/** The registry topic of a document, from its standard. */
export const topicOf = (index, doc) =>
  doc.s && index.standards[doc.s] ? index.standards[doc.s][0] : null;
export const standardLabel = (index, code) =>
  index.standards[code] ? index.standards[code][1] : "";

const words = (s) => norm(s).split(" ");
function textHits(term, title, desc) {
  const stem = term.length > 4 ? term.replace(/(ies|es|s)$/, "") : term;
  const inTitle = title.some((w) => w === term || w.startsWith(stem));
  if (inTitle) return 2;
  return desc.some((w) => w === term || w.startsWith(stem)) ? 1 : 0;
}

/** Score one document against a parsed query; null when it does not answer the query at all. */
export function scoreDoc(index, doc, q) {
  const why = [];
  let score = 0;
  let relevant = false;
  const topic = topicOf(index, doc);

  if (q.lesson) {
    if (doc.l !== q.lesson) return null;
    score += doc.p === `/lessons/${q.lesson}/` ? 45 : 30;
    relevant = true;
  }
  if (q.unit != null) {
    if (doc.u !== q.unit) return null;
    score += 10;
    relevant = true;
  }

  if (q.standards.length || q.topics.length) {
    const exact = doc.s && q.standards.includes(doc.s);
    const parents = q.topics.map((t) => TOPIC_PARENT[t] || t);
    const narrowOnly = q.topics.every((t) => TOPIC_STANDARDS[t]);
    const sameTopic = topic && parents.includes(topic) && !narrowOnly;
    if (exact) {
      score += 50;
      why.push(`Teaches ${standardLabel(index, doc.s).toLowerCase() || doc.s} (${doc.s})`);
      relevant = true;
    } else if (sameTopic) {
      score += 30;
      why.push(`About ${standardLabel(index, doc.s).toLowerCase()} (${doc.s})`);
      relevant = true;
    }
    // Topic words in the title still count when the doc carries no standard (games, tools, labs).
    const title = words(doc.t);
    const desc = words(doc.d);
    let topicText = 0;
    for (const t of q.topics)
      for (const w of TOPIC_WORDS[t])
        if (!w.includes(" ") && w.length > 2)
          topicText = Math.max(topicText, textHits(w, title, desc));
    if (topicText && !exact && !sameTopic) {
      score += topicText === 2 ? 28 : 12;
      why.push(topicText === 2 ? "Topic named in the title" : "Topic named in the description");
      relevant = true;
    } else if (topicText === 2) score += 6;
    if (!relevant) return null;
  }

  if (q.rest.length) {
    const title = words(doc.t);
    const desc = words(doc.d);
    let hits = 0;
    for (const w of q.rest) {
      const h = textHits(w, title, desc);
      score += h === 2 ? 14 : h === 1 ? 5 : 0;
      if (h) hits++;
    }
    if (hits) relevant = true;
    else if (!q.topics.length && !q.standards.length && !q.lesson && !q.unit) return null;
  }

  if (q.printable) {
    if (!doc.pr) return null;
    score += 12;
    why.push(
      `Printable: ${(doc.f || []).map((f) => (f === "docx" ? "Word" : f.toUpperCase())).join(" and ")}`,
    );
  }
  if (q.kind) {
    const k = doc.k;
    const match =
      k === q.kind ||
      (q.kind === "practice" && (k === "printable" || k === "small-group" || k === "readiness")) ||
      (q.kind === "lab" && (k === "activity" || k === "tool")) ||
      (q.kind === "review" && k === "readiness");
    if (k === q.kind) {
      score += 24;
      why.push(kindLabel(k));
    } else if (match) score += 8;
    else score -= 12;
    if (!q.topics.length && !q.rest.length && !q.lesson && !q.unit)
      relevant = relevant || k === q.kind;
  }
  if (q.audience) {
    if (doc.a?.includes(q.audience)) {
      score += 22;
      why.push(`For ${AUDIENCE_LABEL[q.audience]}`);
      if (!q.topics.length && !q.rest.length && !q.kind) relevant = true;
    } else score -= q.audience === "f" ? 18 : 6;
  }
  if (q.level) {
    if (doc.v === q.level) {
      score += 18;
      why.push(q.level === "support" ? "Extra support level" : "Challenge level");
    } else if (doc.v) score -= 10;
  }
  if (q.ell) {
    let ell = 0;
    if (doc.es) {
      ell += 12;
      why.push("Spanish version");
    }
    if (doc.v === "support") ell += 8;
    if (
      doc.k === "vocabulary" ||
      doc.k === "small-group" ||
      /student-help|vocab|visual/.test(doc.p)
    )
      ell += 8;
    score += ell;
    if (!q.topics.length && !q.rest.length && !q.kind && !q.audience)
      relevant = relevant || ell > 0;
  }
  if (q.short) {
    if (SHORT_KINDS.has(doc.k)) {
      score += 10;
      why.push("Short format");
    } else if (doc.k === "project" || doc.k === "lesson") score -= 8;
    if (!q.topics.length && !q.rest.length && !q.kind && !q.audience)
      relevant = relevant || SHORT_KINDS.has(doc.k);
  }
  if (!relevant) return null;
  if (doc.k === "hub") score -= 6;
  if (doc.d) score += 2;
  return { doc, score, why: [...new Set(why)] };
}

/** Rank the index for a query. Diverse by design: at most `perLesson` results from one lesson and one kind. */
export function search(index, query, { limit = 40, perLesson = 2 } = {}) {
  const q = typeof query === "string" ? parseQuery(query) : query;
  const empty =
    !q.topics.length &&
    !q.standards.length &&
    !q.rest.length &&
    !q.kind &&
    !q.audience &&
    !q.printable &&
    !q.lesson &&
    q.unit == null &&
    !q.ell &&
    !q.short &&
    !q.level;
  if (empty) return { query: q, results: [], total: 0 };
  // A language question with no mathematics in it (listening, ecosystems) belongs on The Language Page.
  if (q.language.length && !q.topics.length && !q.standards.length && !q.lesson && q.unit == null)
    return { query: q, results: [], total: 0, languageOnly: true };
  const scored = [];
  for (const doc of index.docs) {
    const r = scoreDoc(index, doc, q);
    if (r && r.score > 0) scored.push(r);
  }
  scored.sort(
    (a, b) =>
      b.score - a.score || (a.doc.u ?? 99) - (b.doc.u ?? 99) || a.doc.t.localeCompare(b.doc.t),
  );
  const seen = new Map();
  const results = [];
  for (const r of scored) {
    const key = `${r.doc.l || r.doc.p}|${r.doc.k}`;
    const n = seen.get(key) || 0;
    if (n >= perLesson && !q.lesson) continue;
    seen.set(key, n + 1);
    results.push(r);
    if (results.length >= limit) break;
  }
  return { query: q, results, total: scored.length };
}

/** Companion resources for a document: same lesson first, then same standard; one per kind, never itself. */
export function companions(index, doc, max = 4) {
  const out = [];
  const kinds = new Set([doc.k]);
  const pools = [
    doc.l ? index.docs.filter((d) => d.l === doc.l) : [],
    doc.s ? index.docs.filter((d) => d.s === doc.s && d.l !== doc.l) : [],
  ];
  const order = [
    "practice",
    "family",
    "game",
    "lab",
    "printable",
    "small-group",
    "vocabulary",
    "review",
    "lesson",
    "activity",
    "project",
    "readiness",
  ];
  for (const pool of pools) {
    for (const kind of order) {
      if (out.length >= max) return out;
      if (kinds.has(kind)) continue;
      const pick = pool.find(
        (d) => d.k === kind && d.p !== doc.p && !(kind === "small-group" && d.v === "challenge"),
      );
      if (pick) {
        out.push(pick);
        kinds.add(kind);
      }
    }
  }
  return out;
}

/* ---------- The Language Page ------------------------------------------ */

const LP_BASE = "https://thelanguagepage.com/access-practice-lab/search";
/** A Language Page search link when the query is about language, or asks for English-learner support. */
export function languagePageLink(q) {
  if (!q.language.length && !q.ell && !(q.grades.length && !q.grades.includes(6))) return null;
  const terms = [...q.language, ...q.topics.map((t) => t.replace(/-/g, " ")), ...q.rest]
    .join(" ")
    .trim();
  const params = new URLSearchParams();
  if (terms) params.set("q", terms);
  const g = q.grades.length ? q.grades : [6];
  const band = g.every((x) => x >= 6) ? "6-8" : g.every((x) => x >= 3 && x <= 5) ? "3-5" : null;
  if (band) params.set("grades", band);
  if (q.audience === "f") params.set("for", "family");
  else if (q.audience === "t") params.set("for", "teacher");
  return `${LP_BASE}?${params}`;
}

// Transparent rules for the family-mission gate: which MODEL FAMILY a lesson belongs to, and the
// concept lexicon used to decide whether a piece of page text belongs to that family.
// Nothing here is learned or fuzzy: every rule is a regex a person can read and argue with.

export const MODEL_FAMILIES = [
  "percent",
  "ratio",
  "expression",
  "equation",
  "inequality",
  "coordinate",
  "data",
  "geometry",
  "number",
  "fraction",
  "other",
];

/** First matching rule wins. `c` = { id, unit, standard, title } with title lower-cased. */
export const FAMILY_RULES = [
  { id: "mindset-unit", family: "other", test: (c) => c.unit === 10 || /^MPP/.test(c.standard) },
  { id: "percent-title", family: "percent", test: (c) => /percent/.test(c.title) },
  { id: "percent-standard", family: "percent", test: (c) => c.standard === "6.AT.4" },
  {
    id: "inequality-title",
    family: "inequality",
    test: (c) => /inequalit/.test(c.title) && !/equations? and|equation or/.test(c.title),
  },
  { id: "equation-title", family: "equation", test: (c) => /equation/.test(c.title) },
  {
    id: "equation-standard",
    family: "equation",
    test: (c) => ["6.AT.8", "6.AT.11"].includes(c.standard),
  },
  { id: "inequality-standard", family: "inequality", test: (c) => c.standard === "6.AT.9" },
  {
    id: "coordinate-title",
    family: "coordinate",
    test: (c) => /coordinate|ordered pair|quadrant|reflect|on the plane/.test(c.title),
  },
  { id: "fraction-division", family: "fraction", test: (c) => c.standard === "6.NOS.1" },
  { id: "ratio-standard", family: "ratio", test: (c) => /^6\.AT\.[123]/.test(c.standard) },
  {
    id: "ratio-title",
    family: "ratio",
    test: (c) => /\bratios?\b|unit rate|unit price/.test(c.title),
  },
  {
    id: "expression-standard",
    family: "expression",
    test: (c) => /^6\.AT\.[567]/.test(c.standard),
  },
  { id: "data-standard", family: "data", test: (c) => /^6\.DS/.test(c.standard) },
  {
    id: "geometry-title",
    family: "geometry",
    test: (c) => /volume|surface|area|\bnets?\b|prism|polygon/.test(c.title),
  },
  {
    id: "geometry-standard",
    family: "geometry",
    test: (c) => /^6\.GR/.test(c.standard) || c.standard === "5.MD.C.5",
  },
  { id: "fraction-standard", family: "fraction", test: (c) => /^5\.NF/.test(c.standard) },
  { id: "fraction-title", family: "fraction", test: (c) => /fraction/.test(c.title) },
  {
    id: "number-standard",
    family: "number",
    test: (c) => /^(6\.NOS|5\.NBT|5\.OA)/.test(c.standard),
  },
];

export function modelFamily(ctx) {
  const c = {
    ...ctx,
    title: String(ctx.title || "").toLowerCase(),
    standard: String(ctx.standard || ""),
  };
  const hit = FAMILY_RULES.find((r) => r.test(c));
  return hit ? { family: hit.family, rule: hit.id } : { family: "other", rule: "default-other" };
}

/**
 * Hard signatures: teaching language that belongs to one concept. Deliberately narrow, because
 * everyday words ("per hour", "mean", "undo") appear in many lessons and a loose list reports
 * hundreds of false hits. Add a signature only when you can name a page where it is wrong.
 */
export const LEXICON = {
  ratio: [
    /\bscaling a ratio\b/,
    /\bdouble batch\b/,
    /\bratio tables?\b/,
    /\bequivalent ratios?\b/,
    /\b\d+ batch(es)?:/,
    /\bsmoothie\b/,
    /\bcups? of (berries|yogurt)\b/,
    /\bcompost\b/,
    /keep the (taste|color)/,
    /multiply both (parts|sides|columns|numbers) by the same/,
    /\bunit rates?\b/,
    /\bratio of\b/,
  ],
  percent: [
    /\bpercent bar\b/,
    /\bpercents?\b/,
    /\bout of 100\b/,
    /\bper ?hundred\b/,
    /\b100% (is|=|means)\b/,
    /\bpercentages?\b/,
  ],
  expression: [
    /\bcombine like terms\b/,
    /\blike terms\b/,
    /\bdistributive property\b/,
    /\bcoefficients?\b/,
    /\bequivalent expressions?\b/,
    /\border of operations\b/,
    /\bexponents?\b/,
  ],
  equation: [
    /\binverse operations?\b/,
    /\bbalance(d)? (the )?(scale|equation)\b/,
    /\bdo the same (thing )?to both sides\b/,
    /\bkeep the (equation|scale) balanced\b/,
    /\bsolve (the|an|this) equation\b/,
  ],
  inequality: [
    /\binequalit(y|ies)\b/,
    /\b(open|closed) circle\b/,
    /\bsolution set\b/,
    /\bshade (the )?number line\b/,
  ],
  coordinate: [
    /\bordered pairs?\b/,
    /\bx-axis\b/,
    /\by-axis\b/,
    /\bquadrants?\b/,
    /\bcoordinate plane\b/,
    /\bplot (the )?points?\b/,
  ],
  data: [
    /\bmedian\b/,
    /\binterquartile\b/,
    /\bbox plots?\b/,
    /\bdot plots?\b/,
    /\bhistograms?\b/,
    /\bmean absolute\b/,
    /\bdata sets?\b/,
  ],
  geometry: [
    /\bsurface area\b/,
    /\bparallelograms?\b/,
    /\btrapezoids?\b/,
    /\bsquare units\b/,
    /\bvolume of\b/,
    /\bbase times height\b/,
    /\brectangular prisms?\b/,
  ],
  number: [
    /\babsolute value\b/,
    /\bnumber line\b/,
    /\bprime factor/,
    /\bgreatest common factor\b/,
    /\bleast common multiple\b/,
  ],
  fraction: [
    /\breciprocals?\b/,
    /\bnumerators?\b/,
    /\bdenominators?\b/,
    /\bmixed numbers?\b/,
    /\bunit fractions?\b/,
  ],
};

/** Concepts that legitimately travel together; seeing one in the other's lesson is not contamination. */
export const TOLERATED = {
  percent: ["fraction", "number"],
  ratio: ["fraction", "number", "coordinate", "equation"],
  expression: ["equation", "inequality", "number", "geometry"],
  equation: ["expression", "inequality", "number", "coordinate", "fraction", "ratio"],
  inequality: ["equation", "expression", "number", "coordinate"],
  coordinate: ["number", "equation", "expression", "geometry"],
  geometry: ["number", "expression", "fraction", "coordinate"],
  data: ["number", "fraction"],
  number: ["fraction", "coordinate", "percent", "expression", "inequality"],
  fraction: ["number", "equation"],
  other: MODEL_FAMILIES,
};

/** Wording that proves a sentence is about the lesson's own concept even though it is not a LEXICON term. */
const OWN_EXTRA = { percent: [/\d\s?%/] };

/** A foreign concept may also appear when the same sentence says why it matters here. */
export const PREREQUISITES = {
  percent: ["ratio"],
  ratio: ["percent", "equation"],
  equation: ["ratio", "data", "percent", "geometry"],
  inequality: ["ratio", "geometry"],
  expression: ["ratio", "percent", "geometry"],
  coordinate: ["ratio", "data"],
  geometry: ["ratio", "percent", "equation"],
  data: ["ratio", "percent", "equation", "geometry"],
  number: ["ratio", "percent", "equation"],
  fraction: ["ratio", "percent", "equation", "expression"],
  other: MODEL_FAMILIES,
};

export const BRIDGE =
  /\b(because|since|remember|earlier|before|last (time|lesson)|builds? on|so we can|which is why)\b/i;

/** Count distinct hard signatures of `family` in `text`. */
export function signatures(text, family) {
  return (LEXICON[family] || []).filter((re) => re.test(text)).length;
}

const GENERIC = new Set(
  "the and for with from that this your you our are can how what into about using use make find show understand explore represent determine apply solve problem problems describe numbers number data real world".split(
    " ",
  ),
);

/** Words of the lesson itself (title, session title, vocabulary) -> 6-letter stems used as "own" evidence. */
export function lessonStems(parts) {
  const stems = new Set();
  for (const p of parts) {
    for (const w of String(p || "")
      .toLowerCase()
      .match(/[a-z]{5,}/g) || []) {
      if (!GENERIC.has(w)) stems.add(w.slice(0, 6));
    }
  }
  return stems;
}

/** Remove every `foreign` signature from the text, so a lesson word that IS the foreign term cannot excuse it. */
function without(text, foreign) {
  return (LEXICON[foreign] || []).reduce(
    (t, re) => t.replace(new RegExp(re.source, "gi"), " "),
    text,
  );
}

/**
 * Evidence that a sentence is about the lesson's own concept: its own signatures, a percent figure, or a word of
 * the lesson (title, vocabulary). Lesson words are counted AFTER the foreign wording is removed: lesson 4-1
 * lists "equivalent ratio" as vocabulary, and that must not excuse "double batch of a recipe".
 */
export function ownEvidence(text, family, stems, foreign = null) {
  const rest = foreign ? without(text, foreign) : text;
  const words = new Set((rest.toLowerCase().match(/[a-z]{5,}/g) || []).map((w) => w.slice(0, 6)));
  let lesson = 0;
  for (const s of stems) if (words.has(s)) lesson++;
  const extra = (OWN_EXTRA[family] || []).filter((re) => re.test(text)).length;
  return signatures(text, family) + extra + (lesson ? 1 : 0);
}

const SENTENCE = /[^.!?]+[.!?]?/g;

/** A sentence is by design when a spiral/warm-up string contains its tail, or it contains that string's head. */
function isExempt(sentence, exempt) {
  const tail = sentence.replace(/[.!?]$/, "").slice(-45);
  return exempt.some((e) => e.includes(tail) || sentence.includes(e.slice(0, 45)));
}

/**
 * Contamination hits for one text unit: sentences carrying another concept's hard signature while
 * having no evidence of the lesson's own concept, unless the pair is tolerated or bridged.
 * `exempt` lists strings that are on the page by design (the spiral review of EARLIER lessons).
 */
export function contaminationHits(text, family, stems, exempt = []) {
  const hits = [];
  if (family === "other") return hits;
  for (const raw of text.match(SENTENCE) || []) {
    const sentence = raw.trim();
    if (sentence.split(/\s+/).length < 4) continue;
    if (isExempt(sentence, exempt)) continue;
    for (const g of Object.keys(LEXICON)) {
      if (g === family || signatures(sentence, g) === 0) continue;
      if (TOLERATED[family]?.includes(g)) continue;
      if (ownEvidence(sentence, family, stems, g) > 0) continue;
      if (PREREQUISITES[family]?.includes(g) && BRIDGE.test(sentence)) continue;
      hits.push({ foreign: g, signatures: signatures(sentence, g), quote: sentence.slice(0, 160) });
    }
  }
  return hits;
}

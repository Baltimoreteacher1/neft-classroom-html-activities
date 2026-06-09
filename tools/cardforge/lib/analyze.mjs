// CardForge lesson-analysis engine. Conservative inference over a normalized
// adapter result. Anything uncertain is flagged, never faked.
import { CCSS_RE } from "./util.mjs";

const TOPIC_HINTS = [
  [/\b(mean|median|mode|range|outlier|data set|variability|distribution)\b/i, "statistics-and-data", "6.SP.3"],
  [/\b(ratio|rate|unit rate|tape diagram)\b/i, "ratios-and-rates", "6.RP.3"],
  [/\b(percent|discount|tax|tip)\b/i, "percents", "6.RP.3c"],
  [/\b(area|parallelogram|trapezoid|triangle|composite figure)\b/i, "area", "6.G.1"],
  [/\b(volume|surface area|net|prism|pyramid)\b/i, "volume-surface-area", "6.G.2"],
  [/\b(expression|exponent|distributive|coefficient|term)\b/i, "expressions", "6.EE.2"],
  [/\b(equation|inequality|solve for)\b/i, "equations-inequalities", "6.EE.7"],
  [/\b(integer|absolute value|coordinate plane|quadrant|ordered pair)\b/i, "integers-coordinate-plane", "6.NS.6"],
  [/\b(divide fraction|fraction division)\b/i, "fraction-division", "6.NS.1"],
  [/\b(gcf|lcm|prime factor|decimal)\b/i, "number-sense", "6.NS.4"],
];

const UNIT_BY_STANDARD_FAMILY = { NS: null, RP: 3, EE: 6, G: 5, SP: 8 };

function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }

export function analyzeLesson(adapterResult) {
  const a = { ...adapterResult };
  const text = a.rawText || "";
  const missing = new Set(a.missing || []);
  const uncertain = new Set(a.uncertain || []);

  // Standard
  let standard = a.standard || (text.match(CCSS_RE) || [])[0] || null;
  if (!a.standard && standard) uncertain.add("standard");

  // Topic from hints
  let topic = a.topic || null;
  let topicStandard = null;
  for (const [re, t, std] of TOPIC_HINTS) {
    if (re.test(text)) { topic = topic || t; topicStandard = std; break; }
  }
  if (!standard && topicStandard) { standard = topicStandard; uncertain.add("standard"); }
  if (!topic) { missing.add("topic"); }

  // Unit / lesson
  let unit = a.unit ?? null;
  let lesson = a.lesson ?? null;
  const ulMatch = text.match(/\b(?:unit\s*(\d{1,2}))?\D{0,12}lesson\s*(\d{1,2})(?:[.-](\d{1,2}))?/i);
  if (ulMatch) {
    if (unit == null && ulMatch[1]) unit = Number(ulMatch[1]);
    if (lesson == null) lesson = ulMatch[3] ? Number(ulMatch[3]) : Number(ulMatch[2]);
  }
  if (unit == null && standard) {
    const fam = standard.match(/6\.([A-Z]+)\./)?.[1];
    if (fam && UNIT_BY_STANDARD_FAMILY[fam]) { unit = UNIT_BY_STANDARD_FAMILY[fam]; uncertain.add("unit"); }
  }
  if (unit == null) { missing.add("unit"); uncertain.add("unit"); }
  if (lesson == null) { missing.add("lesson"); uncertain.add("lesson"); }

  // Vocabulary: capitalized math terms + hint words actually present
  const vocab = uniq([
    ...(a.vocabulary || []),
    ...["mean", "median", "mode", "range", "outlier", "ratio", "rate", "percent",
      "area", "volume", "expression", "equation", "inequality", "integer",
      "absolute value", "coordinate", "variable", "coefficient"]
      .filter((w) => new RegExp(`\\b${w}\\b`, "i").test(text)),
  ]).slice(0, 12);

  // Formulas mentioned
  const formulas = uniq((text.match(/\b[A-Za-z]\s*=\s*[^.;\n]{2,40}/g) || []).map((s) => s.trim())).slice(0, 6);

  const objective = a.objective ||
    (topic ? `I can work with ${topic.replace(/-/g, " ")}.` : null);
  if (!objective) missing.add("objective");

  // Confidence: blend adapter confidence with how much we resolved.
  let confidence = a.confidence ?? 0.5;
  if (standard) confidence += 0.05;
  if (topic) confidence += 0.05;
  if (unit != null && !uncertain.has("unit")) confidence += 0.05;
  confidence = Math.min(0.95, Math.round(confidence * 100) / 100);

  return {
    sourceType: a.sourceType, sourceFile: a.sourceFile || null,
    supported: a.supported !== false, message: a.message || null,
    title: a.title || "Untitled lesson", rawText: text.slice(0, 4000),
    unit, lesson, topic, gradeLevel: a.gradeLevel || "Grade 6",
    standard, objective, languageObjective: a.languageObjective || null,
    vocabulary: vocab, prerequisites: a.prerequisites || [], formulas,
    examples: a.examples || [], practiceTypes: a.practiceTypes || [],
    misconceptions: a.misconceptions || [], esolSupports: a.esolSupports || [],
    spedSupports: a.spedSupports || [], timeEstimate: a.timeEstimate || "~45 min",
    suggestedResources: uniq(["teacher-guide", "student-practice", "answer-key", "exit-ticket",
      ...(topic === "statistics-and-data" ? ["data-activity"] : [])]),
    suggestedTags: uniq([topic, standard, "grade-6"].filter(Boolean)),
    difficulty: a.difficulty || "easy-moderate",
    missing: [...missing], uncertain: [...uncertain], confidence,
  };
}

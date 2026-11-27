// The way from a Language Page search to the Grade 6 math on EduWonderLab, and only when the query names
// mathematics. The two sites stay separate (no shared accounts or storage); this is a link, carrying the words.
// Pure: no DOM. src/views/search.js renders it; tools/curriculum-find.test.mjs covers it.
//
//   mathBridge("ratio vocabulary")  -> { href: "https://eduwonderlab.com/curriculum/find/?q=ratio+vocabulary", topic: "ratio" }
//   mathBridge("listening")         -> null

const EWL_FIND = "https://eduwonderlab.com/curriculum/find/";

// Grade 6 math topics in English and Spanish, as whole words. Deliberately narrow: "table", "rate" and "area" are
// everyday words, so they count only inside a math phrase.
const MATH =
  /\b(ratios?|razon(?:es)?|percents?|percentages?|porcentajes?|fractions?|fracci(?:o|ó)n(?:es)?|decimals?|decimales?|equations?|ecuaci(?:o|ó)n(?:es)?|inequalit(?:y|ies)|desigualdad(?:es)?|expressions? (?:algebraic|equivalent)|algebraic expressions?|equivalent expressions?|expresi(?:o|ó)n(?:es)? algebraicas?|exponents?|exponentes?|integers?|enteros|coordinate plane|plano cartesiano|surface area|(?:area|volume) of|volume|volumen|unit rates?|tasa unitaria|statistics|estad(?:i|í)stica|mean|median|mediana|box plots?|histograms?|histogramas?|gcf|lcm|math|mathematics|matem(?:a|á)ticas?)\b/i;

/** A link to EduWonderLab Find for a query that names mathematics, or null. */
export function mathBridge(query) {
  const q = String(query ?? "").trim();
  const m = q.match(MATH);
  if (!m) return null;
  return { href: `${EWL_FIND}?${new URLSearchParams({ q })}`, topic: m[1].toLowerCase() };
}

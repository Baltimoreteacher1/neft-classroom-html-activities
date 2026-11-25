// B5 Create a Book tie-in & Find My Next Step.
// Pure ESM helpers: authored-only unit vocabulary for book prompts and deterministic,
// score-free / level-free next-step recommendations.

export const BOOK_STUDIO_BASE_HREF = "/access-practice-lab/book-studio";

function authoredTermsOf(unitDetail) {
  const vocab =
    unitDetail?.connections?.[0]?.tier2_tier3_vocab || unitDetail?.tier2_tier3_vocab || [];
  const out = [];
  const seen = new Set();
  for (const entry of vocab) {
    const raw = typeof entry === "string" ? entry : entry?.term;
    const term = String(raw || "").trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(term);
    if (out.length >= 6) break;
  }
  return out;
}

/**
 * Maps a BCPSS unit's real title, essential question, and authored vocab terms into
 * a pre-seeded Create a Book prompt packet linking to /access-practice-lab/book-studio.
 */
export function buildBookTieIn(unitDetail, band = "3_4") {
  const unit = unitDetail?.unit || unitDetail || {};
  const unitId = String(unit.id || "").trim();
  const title = String(unit.unit_title || unit.title || "").trim();
  const essentialQuestion = String(unit.essential_question || "").trim();
  const targetWords = authoredTermsOf(unitDetail);
  const safeBand = String(band || "3_4").trim();

  const wordsClause = targetWords.length
    ? ` Use these key words from the unit: ${targetWords.join(", ")}.`
    : "";
  const questionClause = essentialQuestion
    ? ` Answer the unit question: "${essentialQuestion}"`
    : "";
  const prompt = `Create a short illustrated book about "${title || unitId}".${questionClause}${wordsClause}`;

  const params = new URLSearchParams();
  if (unitId) params.set("unit", unitId);
  if (safeBand) params.set("band", safeBand);
  const query = params.toString();
  const bookStudioHref = query ? `${BOOK_STUDIO_BASE_HREF}?${query}` : BOOK_STUDIO_BASE_HREF;

  return {
    unitId,
    title,
    essentialQuestion,
    prompt,
    targetWords,
    bookStudioHref,
    derived: {
      status: "draft",
      source: "unit-authored",
    },
  };
}

const STEP_CATALOG = Object.freeze([
  Object.freeze({
    kind: "vocab",
    domain: "vocabulary",
    label: "Key Words Practice",
    reason: "Build comfort with the unit's key words before speaking or writing.",
    href: (unitId) =>
      unitId
        ? `/bcpss-teachers/language-studio/?unit=${encodeURIComponent(unitId)}&mode=vocab`
        : "/bcpss-teachers/language-studio/",
  }),
  Object.freeze({
    kind: "listen",
    domain: "listening",
    label: "Listen & Follow Along",
    reason: "Hear the unit ideas modeled clearly before sharing your own.",
    href: (unitId) =>
      unitId
        ? `/bcpss-teachers/language-studio/?unit=${encodeURIComponent(unitId)}&mode=listen`
        : "/bcpss-teachers/language-studio/",
  }),
  Object.freeze({
    kind: "speak",
    domain: "speaking",
    label: "Speaking Studio",
    reason: "Practice saying your ideas out loud and check them on this device.",
    href: (unitId) =>
      unitId
        ? `/bcpss-teachers/speaking-studio/?unit=${encodeURIComponent(unitId)}`
        : "/bcpss-teachers/speaking-studio/",
  }),
  Object.freeze({
    kind: "write",
    domain: "writing",
    label: "Writing Lab",
    reason: "Turn your spoken ideas into clear, complete written sentences.",
    href: (unitId) =>
      unitId
        ? `/bcpss-teachers/writing-lab/?unit=${encodeURIComponent(unitId)}`
        : "/bcpss-teachers/writing-lab/",
  }),
  Object.freeze({
    kind: "book",
    domain: "book",
    label: "Create a Book",
    reason: "Bring your unit ideas and key words together into your own short book.",
    href: (unitId, band) => {
      const p = new URLSearchParams();
      if (unitId) p.set("unit", unitId);
      if (band) p.set("band", band);
      const q = p.toString();
      return q ? `${BOOK_STUDIO_BASE_HREF}?${q}` : BOOK_STUDIO_BASE_HREF;
    },
  }),
]);

/**
 * Deterministic recommender returning the next best student activity without any
 * scores, proficiency levels, or random state.
 */
export function findNextStep({
  unitId = "",
  completedKinds = [],
  domainCounts = {},
  band = "3_4",
} = {}) {
  const done = new Set(
    (Array.isArray(completedKinds) ? completedKinds : []).map((k) => String(k).toLowerCase()),
  );
  const counts = domainCounts && typeof domainCounts === "object" ? domainCounts : {};

  const remaining = STEP_CATALOG.filter((step) => !done.has(step.kind));
  const pool = remaining.length ? remaining : STEP_CATALOG;

  let chosen = pool[0];
  let bestCount = Number(counts[chosen.domain]) || 0;
  for (let i = 1; i < pool.length; i += 1) {
    const candidate = pool[i];
    const count = Number(counts[candidate.domain]) || 0;
    if (count < bestCount) {
      chosen = candidate;
      bestCount = count;
    }
  }

  return {
    kind: chosen.kind,
    label: chosen.label,
    reason: chosen.reason,
    href: chosen.href(String(unitId || "").trim(), String(band || "3_4").trim()),
    derived: {
      status: "draft",
      source: "deterministic-rules",
    },
  };
}

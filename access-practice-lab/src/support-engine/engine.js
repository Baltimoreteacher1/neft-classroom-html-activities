// The shared support engine: ONE place that answers "for this learner support level, domain and activity, which
// scaffolds are suggested, why, how do they fade, and what should each tool switch on?"
//
// It reads the lab's existing definitions instead of adding a third catalog: the six Book Studio support levels and
// their per-domain intensity (book/lang/profiles.js) and the A/B/C support tiers with the scaffold catalog
// (resource-intelligence.js). Tools (vocabulary sets, resource planner, Book Studio, class support) ask this module
// and map its answer onto their own controls, so they cannot drift apart.
//
// A support level is an instructional support grouping chosen by a teacher. It is never an official WIDA
// proficiency level and is never inferred from a learner's work. Supports can differ by domain, so a profile is
// one level per domain, not one number for the learner.
import { DOMAINS, INTENSITIES, LEVELS } from "../book/lang/profiles.js";
import { SCAFFOLD_CATALOG, SUPPORT_TIERS } from "../resource-intelligence.js";

export { DOMAINS };
export const MIN_LEVEL = 1;
export const MAX_LEVEL = LEVELS.length;

/** The lab's three support tiers cover the six levels two at a time. */
export const LEVEL_TIER = Object.freeze({ 1: "A", 2: "A", 3: "B", 4: "B", 5: "C", 6: "C" });
/** The level a tier-only source (class support stages) stands for: the tier's first level, i.e. its heavier end. */
export const TIER_LEVEL = Object.freeze({ A: 1, B: 3, C: 5 });

/** Scaffolds that make sense for each domain; a tier's scaffolds are narrowed to these. */
export const DOMAIN_SCAFFOLDS = Object.freeze({
  listening: ["audio-directions", "visual-vocabulary", "chunked-directions", "bilingual-glossary", "word-bank", "interactive-feedback"],
  speaking: ["oral-rehearsal", "sentence-starters", "sentence-frames", "word-bank", "model-response", "visual-vocabulary", "bilingual-glossary", "interactive-feedback"],
  reading: ["audio-directions", "chunked-directions", "visual-vocabulary", "bilingual-glossary", "word-bank", "graphic-organizer", "interactive-feedback"],
  writing: ["sentence-frames", "sentence-starters", "word-bank", "model-response", "graphic-organizer", "bilingual-glossary", "oral-rehearsal", "revision-opportunity", "interactive-feedback"],
});

/**
 * In a protected assessment a support must not supply the answer or do the skill being measured: models, feedback
 * loops and revision hand over the target, and reading aloud decodes the very text a reading check measures.
 * An accommodation a learner is entitled to stays available by listing it in `keep`.
 */
export const PROTECTED_BLOCKED = Object.freeze({
  all: ["model-response", "interactive-feedback", "revision-opportunity"],
  reading: ["audio-directions"],
});

const clampLevel = (n) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.trunc(Number(n)) || MIN_LEVEL));
export const levelInfo = (n) => LEVELS[clampLevel(n) - 1];
export const tierForLevel = (n) => LEVEL_TIER[clampLevel(n)];
export const levelForTier = (tier) => TIER_LEVEL[tier] ?? TIER_LEVEL.B;

/** One level per domain. A single number means "the same level in every domain". */
export function profileOf(input) {
  const out = {};
  for (const d of DOMAINS) out[d] = clampLevel(typeof input === "object" && input ? input[d] : input);
  return out;
}

/** Fading support as independence grows: one level less support in one domain, never past the last level. */
export const canFade = (profile, domain) => profileOf(profile)[domain] < MAX_LEVEL;
export function fade(profile, domain) {
  const p = profileOf(profile);
  return canFade(p, domain) ? { ...p, [domain]: p[domain] + 1 } : p;
}

const byId = new Map(SCAFFOLD_CATALOG.map((s) => [s.id, s]));

/**
 * Suggested scaffolds for one learner level, domain and activity. Every entry says why it is suggested.
 * @param {{ level: number, domain: string, protectedAssessment?: boolean, keep?: string[] }} input
 */
export function suggest({ level, domain, protectedAssessment = false, keep = [] }) {
  const n = clampLevel(level);
  const tier = LEVEL_TIER[n];
  const info = LEVELS[n - 1];
  const relevant = DOMAIN_SCAFFOLDS[domain] || [];
  const blocked = protectedAssessment ? [...PROTECTED_BLOCKED.all, ...(PROTECTED_BLOCKED[domain] || [])].filter((id) => !keep.includes(id)) : [];
  const onDemand = info.intensity === "help";
  const scaffolds = SUPPORT_TIERS[tier].scaffolds
    .filter((id) => relevant.includes(id) && !blocked.includes(id) && byId.has(id))
    .map((id) => {
      const s = byId.get(id);
      return {
        id,
        label: s.label,
        purpose: s.purpose,
        fadeTip: s.fadeTip,
        showByDefault: !onDemand,
        reason: [
          `Suggested for ${info.en} (${tier} support) in ${domain}: ${s.purpose[0]}`,
          `Sugerido para ${info.es} (apoyo ${tier}) en ${domain}: ${s.purpose[1]}`,
        ],
      };
    });
  return { level: n, tier, intensity: info.intensity, domain, onDemand, scaffolds, blocked };
}

/** What a vocabulary practice page switches on by default for a level. A learner can still turn each one on or off. */
export function vocabSettings(level) {
  const n = clampLevel(level);
  const tier = SUPPORT_TIERS[LEVEL_TIER[n]].scaffolds;
  const onDemand = LEVELS[n - 1].intensity === "help";
  return {
    showTranslation: !onDemand && tier.includes("bilingual-glossary"),
    wordBank: !onDemand && tier.includes("word-bank"),
    showMeaning: LEVELS[n - 1].intensity === "heavy",
  };
}

/** Book Studio expresses the same profile as a level number plus per-domain intensity (book/lang/profiles.js). */
export function toBookProfile(profile) {
  const p = profileOf(profile);
  return { levels: p, intensity: Object.fromEntries(DOMAINS.map((d) => [d, LEVELS[p[d] - 1].intensity])) };
}

/** Class support stages (accessPracticeLabClass:v1:support) are tier letters per domain. */
export function toClassStages(profile) {
  const p = profileOf(profile);
  return Object.fromEntries(DOMAINS.map((d) => [d, LEVEL_TIER[p[d]]]));
}

/** The reverse, for a class that only stores tiers: each domain becomes the tier's first level. */
export const fromClassStages = (stages = {}) => profileOf(Object.fromEntries(DOMAINS.map((d) => [d, levelForTier(stages[d])])));

export const SUPPORT_NOTE = Object.freeze([
  "A support level groups instructional supports. It is a teacher's choice, not an official proficiency level, and it can differ by domain.",
  "Un nivel de apoyo agrupa apoyos de enseñanza. Lo elige el docente; no es un nivel oficial de dominio y puede variar según el dominio.",
]);

export { INTENSITIES };

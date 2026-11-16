// Book Studio 2.0 · WIDA-responsive language profiles. Pure data and pure functions (no DOM, no storage).
//
// Framing (WIDA English Language Development Standards Framework, 2020 Edition): five ELD Standards Statements, four
// Key Language Uses (Narrate, Inform, Explain, Argue), interpretive and expressive modes, grade-cluster expectations
// and Proficiency Level Descriptors. Official expectation IDs come ONLY from the lab's existing catalog
// (src/acc/wida/catalog.js, which follows the framework's published pattern and links the source); no code is invented
// here. Everything below the level names (priorities, example frames) is ORIGINAL to this application: they are
// teacher-adjustable support defaults, not WIDA text and not a proficiency determination.
//
// A "profile" is a support recipe. It is never an official level, never inferred from writing, and never shown to peers.
// Support INTENSITY is separate from the level: a Level 3 writer may want heavy speaking support and minimal reading
// support, so intensity is set per domain (listening, speaking, reading, writing).
import { WIDA_LANGUAGE_EXPECTATIONS, WIDA_SOURCE } from "../../acc/wida/catalog.js";
import { STANDARD_LABEL } from "../../acc/wida/framework.js";

export { WIDA_SOURCE, STANDARD_LABEL };
export const WIDA_ATTRIBUTION =
  "Language-development framing follows the WIDA English Language Development Standards Framework, 2020 Edition (https://wida.wisc.edu/teach/standards/eld). Support examples are original to The Language Page and are not WIDA text. Profiles guide supports; they are not ACCESS scores or proficiency levels.";

export const GRADE_CLUSTER_IDS = Object.freeze(["K", "1", "2-3", "4-5", "6-8", "9-12"]);
export const KEY_LANGUAGE_USES = Object.freeze(["Narrate", "Inform", "Explain", "Argue"]);
export const MODES = Object.freeze(["Interpretive", "Expressive"]);
export const DOMAINS = Object.freeze(["listening", "speaking", "reading", "writing"]);
export const DOMAIN_MODE = Object.freeze({
  listening: "Interpretive",
  reading: "Interpretive",
  speaking: "Expressive",
  writing: "Expressive",
});
export const DOMAIN_LABEL = Object.freeze({
  listening: ["Listening", "Escuchar"],
  speaking: ["Speaking", "Hablar"],
  reading: ["Reading", "Leer"],
  writing: ["Writing", "Escribir"],
});

/** Assigned scaffold intensity. "none" = no assigned scaffold; "help" = nothing shown until the student asks. */
export const INTENSITIES = Object.freeze(["heavy", "moderate", "minimal", "help", "none"]);
export const INTENSITY_LABEL = Object.freeze({
  heavy: ["Heavy support", "Apoyo fuerte"],
  moderate: ["Moderate support", "Apoyo moderado"],
  minimal: ["Minimal support", "Apoyo mínimo"],
  help: ["Help on demand", "Ayuda a pedido"],
  none: ["No assigned scaffold", "Sin apoyo asignado"],
});
/** How much a support must be "wanted" before it shows: a heavy-tagged support shows only under heavy plans. */
export const INTENSITY_RANK = Object.freeze({
  none: 0,
  help: 0,
  minimal: 1,
  moderate: 2,
  heavy: 3,
});

export const LEVELS = Object.freeze([
  {
    n: 1,
    id: "entering",
    en: "Entering",
    es: "Iniciando",
    intensity: "heavy",
    focus: [
      "Illustrated vocabulary and image labels",
      "Home-language support",
      "Recorded directions and read-aloud",
      "Word and phrase banks, short sentence starters",
      "Oral rehearsal and speech-to-text where supported",
      "Drag-to-arrange language, drawing + speaking + writing together",
    ],
    types: ["vocab", "frame", "rehearsal", "glossary", "reading"],
    example: {
      frame: "The fox is ___. It sees ___.",
      words: ["fox", "cave", "scared", "dark", "looks"],
    },
  },
  {
    n: 2,
    id: "emerging",
    en: "Emerging",
    es: "Emergente",
    intensity: "heavy",
    focus: [
      "Sentence expansion and sequence frames",
      "Picture-supported sentence building",
      "Basic transition banks",
      "Guided dialogue and character descriptions",
      "Simple cause-and-effect language",
      "Bilingual explanations as needed",
    ],
    types: ["frame", "vocab", "organizer", "rehearsal", "glossary"],
    example: { frame: "First, the fox ___. Then, it ___. Finally, ___." },
  },
  {
    n: 3,
    id: "developing",
    en: "Developing",
    es: "En desarrollo",
    intensity: "moderate",
    focus: [
      "Paragraph organization and specific supporting details",
      "Cause-and-effect explanations",
      "Descriptive elaboration and dialogue development",
      "Relevant academic vocabulary and sentence variety",
      "Narrative transitions and compare/contrast structures",
      "Guided revision",
    ],
    types: ["frame", "organizer", "vocab", "revision", "model"],
    example: { frame: "The character decided to ___ because ___. This caused ___." },
  },
  {
    n: 4,
    id: "expanding",
    en: "Expanding",
    es: "En expansión",
    intensity: "moderate",
    focus: [
      "Text cohesion and varied sentence structures",
      "More precise vocabulary and character motivations",
      "Figurative language when appropriate",
      "Evidence integration and logical sequencing",
      "Audience awareness and independent editing",
    ],
    types: ["frame", "revision", "organizer", "vocab", "model"],
    example: {
      frame: "Although the character initially believed ___, the discovery of ___ caused ___.",
    },
  },
  {
    n: 5,
    id: "bridging",
    en: "Bridging",
    es: "Puente",
    intensity: "minimal",
    focus: [
      "Genre conventions, voice and tone",
      "Nuanced description and sophisticated transitions",
      "Argument development with strong evidence",
      "Narrative pacing and sentence fluency",
      "Precision and intentional revision",
    ],
    types: ["revision", "model", "organizer"],
    example: {
      frame: "Make each character's position clear and use dialogue to reveal their motivations.",
    },
  },
  {
    n: 6,
    id: "reaching",
    en: "Reaching",
    es: "Alcanzando",
    intensity: "help",
    focus: [
      "Independent composition and advanced author craft",
      "Editorial revision and stylistic experimentation",
      "Complex narrative structures",
      "Critical evaluation and argument sophistication",
      "Genre-specific precision and authentic publication standards",
    ],
    types: ["revision", "model"],
    example: { frame: "" },
  },
]);
export const level = (n) => LEVELS.find((l) => l.n === Number(n)) || null;

/** A teacher-facing label that cannot be mistaken for an official score. */
export const profileLabel = (n, tr = (en) => en) => {
  const l = level(n);
  return l
    ? `${tr("Support profile", "Perfil de apoyo")} ${l.n} · ${tr(l.en, l.es)}`
    : tr("No profile", "Sin perfil");
};

/**
 * Official expectation ids (from the lab catalog) for a standard / cluster / Key Language Use / mode.
 * Returns [] when the catalog has no explicit entry (K, 1 and 9-12 are not in the catalog) rather than guessing.
 */
export function expectationsFor({ standard, cluster, keyUse, mode } = {}) {
  return WIDA_LANGUAGE_EXPECTATIONS.filter(
    (e) =>
      (!standard || e.standard === standard) &&
      (!keyUse || e.keyUse === keyUse) &&
      (!cluster || (e.gradeClusters || [e.gradeCluster]).includes(cluster)) &&
      (!mode || e.mode === mode || (e.modes || []).includes(mode)),
  ).map((e) => e.id);
}

/** Default plan for a level: one intensity per domain (teacher-adjustable; "help" = on demand). */
export function planForLevel(n) {
  const l = level(n);
  const base = l ? l.intensity : "help";
  return {
    profile: l ? l.n : 0,
    intensity: base,
    domains: Object.fromEntries(DOMAINS.map((d) => [d, base])),
  };
}

export const PLAN_AUDIENCES = Object.freeze(["class", "group", "student", "page"]);

/** A plan is a trusted, small object; unknown fields are dropped. `profile` 0 = no profile (help on demand). */
export function normalizePlan(raw = {}) {
  const profile =
    Number.isInteger(raw.profile) && raw.profile >= 0 && raw.profile <= 6 ? raw.profile : 0;
  const pick = (v, fb) => (INTENSITIES.includes(v) ? v : fb);
  const intensity = pick(raw.intensity, profile ? level(profile).intensity : "help");
  const domains = {};
  for (const d of DOMAINS) domains[d] = pick(raw.domains?.[d], intensity);
  return {
    profile,
    intensity,
    domains,
    reason: String(raw.reason || "").slice(0, 300),
    auto: raw.auto === true, // true only if the teacher left automatic suggestions on
    at: String(raw.at || "").slice(0, 40),
  };
}

/** The effective intensity for one domain under a plan. */
export const intensityFor = (plan, domain) => plan.domains?.[domain] ?? plan.intensity;

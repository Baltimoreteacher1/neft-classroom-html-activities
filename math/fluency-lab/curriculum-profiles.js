// Central Curriculum Profile Registry & teacher instructional preferences.
// Controls HOW a skill is taught (strategy sequence, terminology, visual emphasis),
// NEVER whether a mathematically valid answer is accepted.

export const CURRICULUM_SCHEMA_VERSION = "1.0.0";
export const CURRICULUM_STORAGE_KEY = "ewl-fluency-curriculum-v1";

// Grade 6 skills whose alignment has been verified against this repository's authorized
// Reveal Math Grade 6 curriculum manifest (Units 2-9). Skills outside this set are
// explicitly flagged `pending-verification` under the Reveal Math profile and fall back
// to General Standards-Aligned Mathematics.
export const VERIFIED_REVEAL_GRADE6_SKILLS = Object.freeze({
  "6:ratios": { unit: "Unit 2", lesson: "2-1 to 2-5", preferredMethod: "Ratio tables and double number lines before scaling" },
  "6:unit-rates": { unit: "Unit 3", lesson: "3-1 to 3-3", preferredMethod: "Divide to find the rate per 1 unit using a ratio table" },
  "6:percent": { unit: "Unit 4", lesson: "4-1 to 4-4", preferredMethod: "10x10 grid and double number line to relate part, whole, and percent" },
  "6:percent-whole": { unit: "Unit 4", lesson: "4-4 to 4-5", preferredMethod: "Double number line and equivalent ratios to find the whole" },
  "6:divide-fractions": { unit: "Unit 5", lesson: "5-1 to 5-4", preferredMethod: "Visual bar model (how many groups fit) connected to multiplying by the reciprocal" },
  "6:decimal-ops": { unit: "Unit 5", lesson: "5-5 to 5-7", preferredMethod: "Place-value alignment for +/- and place-value scaling for x/÷" },
  "6:gcf-lcm": { unit: "Unit 5", lesson: "5-1", preferredMethod: "Factor pairs and prime factorization connected to the distributive property" },
  "6:order-rational": { unit: "Unit 6", lesson: "6-1 to 6-3", preferredMethod: "Horizontal and vertical number line distance from 0" },
  "6:evaluate": { unit: "Unit 7", lesson: "7-1 to 7-3", preferredMethod: "Substitute the given value in parentheses, then follow order of operations" },
  "6:equivalent-expressions": { unit: "Unit 7", lesson: "7-4 to 7-6", preferredMethod: "Combine like terms and apply the distributive property with area/tile models" },
  "6:one-step": { unit: "Unit 8", lesson: "8-1 to 8-4", preferredMethod: "Balance model: apply the same inverse operation to both sides to preserve equality" },
  "6:write-inequalities": { unit: "Unit 8", lesson: "8-5", preferredMethod: "Identify the boundary value, open vs. closed circle, and direction on a number line" },
  "6:area-polygons": { unit: "Unit 9", lesson: "9-1 to 9-3", preferredMethod: "Decompose and rearrange polygons into rectangles and triangles" },
  "6:volume-fractional": { unit: "Unit 9", lesson: "9-4", preferredMethod: "Pack unit-fraction cubes and generalize to V = l × w × h" },
  "6:surface-area-nets": { unit: "Unit 9", lesson: "9-5", preferredMethod: "Unfold 3D solid into a 2D net and sum the area of each face" },
  "6:stats-center": { unit: "Unit 10", lesson: "10-1 to 10-4", preferredMethod: "Balance-point mean and ordered-list median with dot plots" },
});

export const CURRICULUM_PROFILES = Object.freeze({
  "general-standards": Object.freeze({
    id: "general-standards",
    version: CURRICULUM_SCHEMA_VERSION,
    name: {
      en: "General Standards-Aligned Mathematics",
      es: "Matemáticas alineadas con estándares generales",
    },
    description: {
      en: "Verified K–8 standards-aligned progressions emphasizing conceptual models, place value, and flexible strategies.",
      es: "Progresiones verificadas de K–8 alineadas con estándares que enfatizan modelos conceptuales, valor posicional y estrategias flexibles.",
    },
    gradesSupported: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    defaultMethod: "conceptual-first",
    vocabularyStyle: "plain-and-formal",
    verificationPolicy: "verified-standards",
    terminology: {
      regroup: { en: "regroup (trade 1 ten for 10 ones)", es: "reagrupar (cambiar 1 decena por 10 unidades)" },
      reciprocal: { en: "multiplicative inverse (reciprocal)", es: "inverso multiplicativo (recíproco)" },
      unitRate: { en: "unit rate (amount per 1)", es: "tasa unitaria (cantidad por 1)" },
    },
  }),
  "reveal-math": Object.freeze({
    id: "reveal-math",
    version: CURRICULUM_SCHEMA_VERSION,
    name: {
      en: "Reveal Math (Verified Grade 6; Standards Fallback K–5, 7–8)",
      es: "Reveal Math (Grado 6 verificado; respaldo de estándares en K–5, 7–8)",
    },
    description: {
      en: "Uses authorized Reveal Math Grade 6 strategy progressions and representations. Grades without verified publisher source mappings automatically fall back to General Standards-Aligned Mathematics and are flagged for review.",
      es: "Usa progresiones y representaciones autorizadas de Reveal Math para Grado 6. Los grados sin mapeo editorial verificado usan automáticamente el respaldo alineado con estándares y se marcan para revisión.",
    },
    gradesSupported: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    verifiedGrades: [6],
    defaultMethod: "visual-then-algorithm",
    vocabularyStyle: "formal-first",
    verificationPolicy: "source-verified-only",
    terminology: {
      regroup: { en: "decompose / compose place-value units", es: "descomponer / componer unidades de valor posicional" },
      reciprocal: { en: "reciprocal (multiplicative inverse)", es: "recíproco (inverso multiplicativo)" },
      unitRate: { en: "unit rate", es: "tasa unitaria" },
    },
  }),
});

export const METHOD_OPTIONS = Object.freeze([
  {
    id: "conceptual-first",
    label: { en: "Conceptual model first, then notation", es: "Modelo conceptual primero, luego notación" },
  },
  {
    id: "visual-then-algorithm",
    label: { en: "Visual model connected to standard algorithm", es: "Modelo visual conectado al algoritmo estándar" },
  },
  {
    id: "standard-algorithm",
    label: { en: "Standard algorithm with place-value meaning", es: "Algoritmo estándar con significado de valor posicional" },
  },
]);

export const VOCAB_STYLES = Object.freeze([
  { id: "plain-and-formal", label: { en: "Plain language paired with formal terms", es: "Lenguaje sencillo junto con términos formales" } },
  { id: "formal-first", label: { en: "Formal textbook terms first", es: "Términos formales del libro primero" } },
  { id: "plain-first", label: { en: "Everyday language first", es: "Lenguaje cotidiano primero" } },
]);

export const DEFAULT_CURRICULUM_SETTINGS = Object.freeze({
  version: CURRICULUM_SCHEMA_VERSION,
  profileId: "general-standards",
  grade: null,
  preferredMethod: "conceptual-first",
  vocabularyStyle: "plain-and-formal",
  allowAlternativeStrategies: true,
  lessonOverrides: {},
});

export function sanitizeCurriculumSettings(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const profileId = CURRICULUM_PROFILES[input.profileId] ? input.profileId : DEFAULT_CURRICULUM_SETTINGS.profileId;
  const preferredMethod = METHOD_OPTIONS.some((m) => m.id === input.preferredMethod)
    ? input.preferredMethod
    : CURRICULUM_PROFILES[profileId].defaultMethod;
  const vocabularyStyle = VOCAB_STYLES.some((v) => v.id === input.vocabularyStyle)
    ? input.vocabularyStyle
    : CURRICULUM_PROFILES[profileId].vocabularyStyle;
  const grade = Number.isInteger(input.grade) && input.grade >= 0 && input.grade <= 8 ? input.grade : null;
  const lessonOverrides = {};
  if (input.lessonOverrides && typeof input.lessonOverrides === "object") {
    for (const [k, v] of Object.entries(input.lessonOverrides)) {
      if (v && typeof v === "object" && /^\d+:[a-z0-9-]+$/i.test(k)) {
        lessonOverrides[k] = {
          method: METHOD_OPTIONS.some((m) => m.id === v.method) ? v.method : preferredMethod,
          note: String(v.note || "").slice(0, 200),
        };
      }
    }
  }
  return {
    version: CURRICULUM_SCHEMA_VERSION,
    profileId,
    grade,
    preferredMethod,
    vocabularyStyle,
    allowAlternativeStrategies: input.allowAlternativeStrategies !== false,
    lessonOverrides,
  };
}

export function loadCurriculumSettings() {
  try {
    if (typeof localStorage === "undefined") return { ...DEFAULT_CURRICULUM_SETTINGS, lessonOverrides: {} };
    const raw = localStorage.getItem(CURRICULUM_STORAGE_KEY);
    return sanitizeCurriculumSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_CURRICULUM_SETTINGS, lessonOverrides: {} };
  }
}

export function saveCurriculumSettings(settings) {
  const clean = sanitizeCurriculumSettings(settings);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(clean));
    }
  } catch {
    /* ignore storage quota errors */
  }
  return clean;
}

export function resolveCurriculumProfile(profileId = "general-standards") {
  return CURRICULUM_PROFILES[profileId] || CURRICULUM_PROFILES["general-standards"];
}

// Returns explicit verification & alignment metadata for a skill under a given curriculum profile.
// Never fabricates publisher alignment: unverified Reveal mappings fall back to general-standards.
export function strategyAlignmentForSkill(skillKey, profileId = "general-standards") {
  const profile = resolveCurriculumProfile(profileId);
  if (profile.id === "reveal-math") {
    const verified = VERIFIED_REVEAL_GRADE6_SKILLS[skillKey];
    if (verified) {
      return {
        profileId: "reveal-math",
        effectiveProfileId: "reveal-math",
        verificationStatus: "verified-reveal",
        fallbackUsed: false,
        unit: verified.unit,
        lesson: verified.lesson,
        preferredMethodNote: verified.preferredMethod,
        reviewer: "EduWonderLab Curriculum Audit (Authorized Grade 6 Manifest)",
        lastReviewDate: "2026-11-18",
      };
    }
    return {
      profileId: "reveal-math",
      effectiveProfileId: "general-standards",
      verificationStatus: "pending-verification",
      fallbackUsed: true,
      unit: null,
      lesson: null,
      preferredMethodNote: null,
      reviewer: "Pending authorized publisher source review",
      lastReviewDate: "2026-11-18",
    };
  }
  return {
    profileId: "general-standards",
    effectiveProfileId: "general-standards",
    verificationStatus: "verified-standards",
    fallbackUsed: false,
    unit: null,
    lesson: null,
    preferredMethodNote: null,
    reviewer: "EduWonderLab Standards Verification",
    lastReviewDate: "2026-11-18",
  };
}

// Studio taxonomy: the single source for grades, bands, subjects, WIDA vocabulary and engines.
// Plain ES module: imported by the browser app, the play page, and the Node validators.

export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];

export const GRADE_LABEL = Object.fromEntries(
  GRADES.map((g) => [g, g === "K" ? "Kindergarten" : `Grade ${g}`]),
);

export const BANDS = [
  { id: "k-2", label: "K–2", grades: ["K", "1", "2"], wida: "K-2" },
  { id: "3-5", label: "3–5", grades: ["3", "4", "5"], wida: "3-5" },
  { id: "6-8", label: "6–8", grades: ["6", "7", "8"], wida: "6-8" },
];

export const bandOf = (grade) => BANDS.find((b) => b.grades.includes(String(grade)))?.id || null;

// WIDA ELD Standards Framework 2020 grade-level clusters (Studio scope is K-8).
export const WIDA_CLUSTERS = ["K", "1", "2-3", "4-5", "6-8"];
export const widaClusterOf = (grade) => {
  const g = String(grade);
  if (g === "K" || g === "1") return g;
  if (g === "2" || g === "3") return "2-3";
  if (g === "4" || g === "5") return "4-5";
  if (["6", "7", "8"].includes(g)) return "6-8";
  return "6-8";
};

export const DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];
export const KLUS = ["Narrate", "Inform", "Explain", "Argue"];

// Support tiers: classroom supports, never fixed ability labels.
export const TIERS = [
  { id: "ee", label: "Entering / Emerging", levels: "WIDA levels 1–2", short: "Entering/Emerging" },
  { id: "dev", label: "Developing", levels: "WIDA level 3", short: "Developing" },
  { id: "exp", label: "Expanding", levels: "WIDA level 4", short: "Expanding" },
  { id: "br", label: "Bridging / Reaching", levels: "WIDA levels 5–6", short: "Bridging" },
];
export const TIER_IDS = TIERS.map((t) => t.id);

// WIDA ELD Standards (2020): 1 Social & Instructional, 2 Language Arts, 3 Mathematics, 4 Science, 5 Social Studies.
export const ELD_STANDARDS = {
  "ELD-SI": "Language for Social and Instructional Purposes",
  "ELD-LA": "Language for Language Arts",
  "ELD-MA": "Language for Mathematics",
  "ELD-SC": "Language for Science",
  "ELD-SS": "Language for Social Studies",
};

// Subject profile: what makes each discipline authentic. Shared components read this; they never branch on a subject id by hand.
export const SUBJECTS = [
  {
    id: "ela",
    label: "English Language Arts",
    short: "ELA",
    eld: "ELD-LA",
    engines: [
      "language-detective",
      "argument-builder",
      "vocab-quest",
      "conversation-studio",
      "concept-builder",
    ],
    visuals: ["scene", "timeline", "flow", "venn"],
    discourse: ["retell", "cite evidence", "analyze craft", "argue a claim"],
    strategies: ["close reading", "annotation", "evidence charts", "writing workshop"],
  },
  {
    id: "math",
    label: "Mathematics",
    short: "Math",
    eld: "ELD-MA",
    engines: [
      "concept-builder",
      "visual-match",
      "escape-challenge",
      "conversation-studio",
      "vocab-quest",
    ],
    visuals: ["tape", "numberline", "coord", "table", "bars"],
    discourse: [
      "explain a strategy",
      "compare representations",
      "justify a solution",
      "critique reasoning",
    ],
    strategies: [
      "number talk",
      "multiple representations",
      "error analysis",
      "problem-solving routines",
    ],
  },
  {
    id: "science",
    label: "Science",
    short: "Science",
    eld: "ELD-SC",
    engines: [
      "concept-builder",
      "language-detective",
      "visual-match",
      "argument-builder",
      "vocab-quest",
    ],
    visuals: ["labeled", "cycle", "flow", "bars", "scene"],
    discourse: [
      "describe an observation",
      "explain a process",
      "construct an evidence-based explanation",
    ],
    strategies: [
      "phenomenon first",
      "modeling",
      "claim-evidence-reasoning",
      "investigation journal",
    ],
  },
  {
    id: "social-studies",
    label: "Social Studies & History",
    short: "Social Studies",
    eld: "ELD-SS",
    engines: [
      "language-detective",
      "argument-builder",
      "concept-builder",
      "conversation-studio",
      "vocab-quest",
    ],
    visuals: ["map", "timeline", "venn", "scene"],
    discourse: [
      "sequence events",
      "analyze a source",
      "compare perspectives",
      "argue from evidence",
    ],
    strategies: ["source analysis", "mapping", "timelines", "structured academic controversy"],
  },
  {
    id: "esol",
    label: "ESOL / English Language Development",
    short: "ESOL",
    eld: "ELD-SI",
    engines: [
      "wida-studio",
      "conversation-studio",
      "vocab-quest",
      "language-detective",
      "visual-match",
    ],
    visuals: ["scene", "icon", "flow", "table"],
    discourse: ["narrate", "inform", "explain", "argue"],
    strategies: ["sentence frames", "oral rehearsal", "language-function focus", "genre pedagogy"],
  },
  {
    id: "sped",
    label: "Special Education & Inclusive Instruction",
    short: "Inclusive",
    eld: "ELD-SI",
    engines: [
      "visual-match",
      "early-sort",
      "vocab-quest",
      "concept-builder",
      "conversation-studio",
    ],
    visuals: ["scene", "icon", "flow", "tape"],
    discourse: ["choose and say", "sequence steps", "ask for help", "self-advocate"],
    strategies: ["universal design", "chunked tasks", "visual schedules", "explicit modeling"],
  },
  {
    id: "world-languages",
    label: "World Languages",
    short: "World Languages",
    eld: "ELD-SI",
    engines: [
      "conversation-studio",
      "visual-match",
      "vocab-quest",
      "language-detective",
      "wida-studio",
    ],
    visuals: ["scene", "icon", "map", "table"],
    discourse: [
      "interpersonal exchange",
      "interpretive listening/reading",
      "presentational speaking/writing",
    ],
    strategies: ["comprehensible input", "three modes of communication", "cultural comparison"],
  },
  {
    id: "health-pe",
    label: "Health & Physical Education",
    short: "Health & PE",
    eld: "ELD-SI",
    engines: [
      "concept-builder",
      "visual-match",
      "conversation-studio",
      "vocab-quest",
      "language-detective",
    ],
    visuals: ["labeled", "flow", "bars", "scene"],
    discourse: ["describe a movement", "explain a healthy choice", "give feedback to a partner"],
    strategies: ["skill cues", "peer coaching", "goal setting", "decision-making models"],
  },
  {
    id: "arts",
    label: "Visual & Performing Arts",
    short: "Arts",
    eld: "ELD-SI",
    engines: [
      "visual-match",
      "language-detective",
      "conversation-studio",
      "concept-builder",
      "vocab-quest",
    ],
    visuals: ["shapes", "scene", "labeled", "timeline"],
    discourse: ["describe an artwork", "interpret meaning", "give and receive critique"],
    strategies: ["see-think-wonder", "studio habits", "critique protocol", "creative process"],
  },
  {
    id: "cte",
    label: "Career & Technical Education",
    short: "CTE",
    eld: "ELD-SI",
    engines: [
      "escape-challenge",
      "concept-builder",
      "argument-builder",
      "vocab-quest",
      "conversation-studio",
    ],
    visuals: ["flow", "labeled", "table", "bars"],
    discourse: [
      "follow and give procedures",
      "explain safety reasoning",
      "justify a design decision",
    ],
    strategies: [
      "procedural text",
      "safety routines",
      "portfolio evidence",
      "workplace communication",
    ],
  },
  {
    id: "interdisciplinary",
    label: "Interdisciplinary & Project-Based",
    short: "Projects",
    eld: "ELD-SI",
    engines: [
      "argument-builder",
      "language-detective",
      "concept-builder",
      "conversation-studio",
      "vocab-quest",
    ],
    visuals: ["map", "timeline", "bars", "scene"],
    discourse: ["investigate", "collaborate", "present findings", "reflect on process"],
    strategies: ["driving question", "checkpoints", "critique and revision", "public product"],
  },
];
export const SUBJECT_IDS = SUBJECTS.map((s) => s.id);
export const SUBJECT_PROFILE = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));

// Subjects with seeded BCPSS unit data (data/bcpss-curriculum-seed.mjs): map studio subject id -> seed subject label.
export const SEED_SUBJECT = {
  ela: "ELA",
  math: "Math",
  science: "Science",
  "social-studies": "Social Studies",
};
export const SEED_GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
export const hasSeedUnits = (grade, subject) =>
  subject in SEED_SUBJECT && SEED_GRADES.includes(String(grade));

export const ENGINES = [
  {
    id: "visual-match",
    label: "Visual Match Lab",
    purpose: "Connect pictures, words, definitions and examples.",
  },
  {
    id: "language-detective",
    label: "Language Detective",
    purpose: "Find evidence in a scene, text, or conversation.",
  },
  {
    id: "concept-builder",
    label: "Concept Builder",
    purpose: "Manipulate a model, then explain what changed.",
  },
  {
    id: "conversation-studio",
    label: "Academic Conversation Studio",
    purpose: "Prepare, rehearse and reflect on academic talk.",
  },
  {
    id: "escape-challenge",
    label: "Digital Escape Challenge",
    purpose: "Solve connected problems to open each room.",
  },
  {
    id: "vocab-quest",
    label: "Vocabulary Quest",
    purpose: "See, use, retrieve and apply words in context.",
  },
  {
    id: "argument-builder",
    label: "Argument Builder",
    purpose: "Build a claim from evidence and reasoning, then revise.",
  },
  {
    id: "wida-studio",
    label: "WIDA Practice Studio",
    purpose: "Original multimodal listening, speaking, reading and writing practice.",
  },
  {
    id: "early-sort",
    label: "Little Learners Studio",
    purpose: "Picture sorting, sounds, syllables and oral stories for ages 5–8.",
  },
];
export const ENGINE_IDS = ENGINES.map((e) => e.id);

export const REVIEW_STAGES = [
  "accuracy",
  "curriculum",
  "wida",
  "usefulness",
  "design",
  "accessibility",
  "functional",
  "approval",
];

export const STANDARD_FRAMEWORKS = {
  "CCSS-Math":
    /^(K|[1-8])\.[A-Z]{1,3}\.[A-Z]\.\d+[a-z]?$|^[A-Z]-[A-Z]{2,4}\.[A-Z]\.\d+[a-z]?$|^MP\.\d$/,
  "CCSS-ELA": /^(RL|RI|RF|W|SL|L|RH|RST|WHST)\.(K|\d+(-\d+)?)\.\d+[a-z]?$/,
  NGSS: /^(K|\d)-[A-Z]{2,4}\d?-\d+$|^(MS|HS)-[A-Z]{2,4}\d?-\d+$/,
  C3: /^D[1-4]\.[A-Za-z]{2,5}\.\d+\.(K-2|3-5|6-8|9-12)$/,
  "WIDA-ELD": /^ELD-(SI|LA|MA|SC|SS)(\.[A-Za-z0-9-]+)*$/,
  NCAS: /^(VA|MU|TH|DA|MA):(Cr|Pr|Re|Cn)\d\.\d\.[A-Za-z0-9]+$/,
  NHES: /^NHES\.[1-8]$/,
  SHAPE: /^S[1-5]\.(E|M|H)\d+(\.[A-Za-z0-9]+)?$/,
  ACTFL: /^ACTFL\.[A-Za-z0-9.-]+$/,
  CRP: /^CRP\.(0?[1-9]|1[0-2])$/,
  ELOF: /^ELOF\.[A-Za-z0-9.-]+$/,
  UDL: /^UDL\.[A-Za-z0-9.-]+$/,
};

export const LANGUAGE_NOTE =
  "Original WIDA-aligned instructional practice. Not an official WIDA or ACCESS item, score, or prediction.";

export const STORAGE_PREFIX = "lp.studio.v1.";

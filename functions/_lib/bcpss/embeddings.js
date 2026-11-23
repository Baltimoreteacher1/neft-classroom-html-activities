// Deterministic 1536-dimension semantic + feature-hashing embeddings and
// rule-based academic passage deconstruction for the BCPSS Teachers Hub.

export const EMBEDDING_DIM = 1536;
export const SUPPORTED_L1S = ["Spanish", "Arabic", "French / Haitian Creole"];

const SEMANTIC_SLOTS = 128;

// Semantic anchors mapped into the first 128 dimensions so WIDA Key Language Uses
// (Narrate, Inform, Explain, Argue) and content-area registers cluster reliably
// in cosine space both locally and in pgvector.
const SEMANTIC_ANCHORS = [
  // WIDA KLU: Explain (slots 0..19)
  {
    slot: 0,
    weight: 3.0,
    terms: [
      "explain",
      "explanation",
      "because",
      "therefore",
      "cause",
      "causes",
      "caused",
      "effect",
      "consequently",
      "result",
      "results",
      "due",
      "leads",
      "process",
      "how",
      "why",
      "mechanism",
      "system",
      "cycle",
      "transfer",
      "energy",
      "reaction",
      "photosynthesis",
      "erosion",
      "force",
      "motion",
      "variable",
      "equation",
      "ratio",
      "proportion",
      "rate",
      "proportional",
      "factor",
    ],
  },
  {
    slot: 1,
    weight: 2.4,
    terms: [
      "because",
      "therefore",
      "consequently",
      "hence",
      "thus",
      "since",
      "leads",
      "causes",
      "results",
      "triggers",
      "produces",
      "generates",
    ],
  },
  {
    slot: 2,
    weight: 2.2,
    terms: [
      "step",
      "steps",
      "process",
      "procedure",
      "method",
      "algorithm",
      "solve",
      "calculate",
      "compute",
      "divide",
      "multiply",
      "substitute",
      "simplify",
      "balance",
    ],
  },
  {
    slot: 3,
    weight: 2.0,
    terms: [
      "relationship",
      "depends",
      "increases",
      "decreases",
      "changes",
      "varies",
      "proportional",
      "constant",
      "slope",
      "linear",
      "function",
      "input",
      "output",
    ],
  },
  // WIDA KLU: Argue (slots 20..39)
  {
    slot: 20,
    weight: 3.0,
    terms: [
      "argue",
      "argument",
      "claim",
      "counterclaim",
      "evidence",
      "justify",
      "justification",
      "prove",
      "proof",
      "defend",
      "critique",
      "persuade",
      "debate",
      "reasoning",
      "convince",
      "position",
      "agree",
      "disagree",
      "evaluate",
      "valid",
      "invalid",
      "support",
      "supports",
      "refute",
      "rebuttal",
      "conclusion",
    ],
  },
  {
    slot: 21,
    weight: 2.4,
    terms: [
      "however",
      "although",
      "whereas",
      "nevertheless",
      "despite",
      "conversely",
      "contrast",
      "contrary",
      "instead",
      "while",
      "yet",
    ],
  },
  {
    slot: 22,
    weight: 2.2,
    terms: [
      "evidence",
      "source",
      "quote",
      "cite",
      "data",
      "proof",
      "shows",
      "demonstrates",
      "proves",
      "confirms",
      "suggests",
      "indicates",
    ],
  },
  {
    slot: 23,
    weight: 2.0,
    terms: [
      "should",
      "must",
      "ought",
      "better",
      "best",
      "most",
      "effective",
      "fair",
      "unfair",
      "justice",
      "rights",
      "policy",
      "amendment",
      "constitution",
    ],
  },
  // WIDA KLU: Inform (slots 40..59)
  {
    slot: 40,
    weight: 3.0,
    terms: [
      "inform",
      "information",
      "describe",
      "description",
      "classify",
      "classification",
      "define",
      "definition",
      "compare",
      "contrast",
      "summarize",
      "summary",
      "report",
      "detail",
      "details",
      "characteristic",
      "characteristics",
      "feature",
      "features",
      "category",
      "structure",
      "properties",
      "data",
      "graph",
      "table",
      "chart",
      "diagram",
      "measure",
      "measurement",
    ],
  },
  {
    slot: 41,
    weight: 2.4,
    terms: [
      "compare",
      "contrast",
      "similar",
      "similarly",
      "alike",
      "both",
      "different",
      "difference",
      "greater",
      "fewer",
      "more",
      "less",
      "larger",
      "smaller",
      "higher",
      "lower",
      "than",
    ],
  },
  {
    slot: 42,
    weight: 2.2,
    terms: [
      "consists",
      "contains",
      "includes",
      "composed",
      "classified",
      "categorized",
      "located",
      "measured",
      "represented",
      "defined",
      "known",
    ],
  },
  {
    slot: 43,
    weight: 2.0,
    terms: [
      "summary",
      "central",
      "main",
      "idea",
      "key",
      "topic",
      "section",
      "heading",
      "fact",
      "facts",
      "statistic",
      "percent",
      "percentage",
      "distribution",
    ],
  },
  // WIDA KLU: Narrate (slots 60..79)
  {
    slot: 60,
    weight: 3.0,
    terms: [
      "narrate",
      "narrative",
      "story",
      "character",
      "characters",
      "plot",
      "setting",
      "conflict",
      "resolution",
      "theme",
      "dialogue",
      "protagonist",
      "perspective",
      "point",
      "view",
      "flashback",
      "foreshadowing",
      "metaphor",
      "simile",
      "imagery",
      "tone",
      "mood",
      "memoir",
      "biography",
      "event",
      "events",
      "sequence",
      "timeline",
    ],
  },
  {
    slot: 61,
    weight: 2.4,
    terms: [
      "first",
      "next",
      "then",
      "after",
      "finally",
      "eventually",
      "meanwhile",
      "suddenly",
      "before",
      "later",
      "earlier",
      "began",
      "ended",
    ],
  },
  {
    slot: 62,
    weight: 2.2,
    terms: [
      "felt",
      "thought",
      "realized",
      "decided",
      "struggled",
      "remembered",
      "hoped",
      "feared",
      "noticed",
      "whispered",
      "replied",
    ],
  },
  // Subject domain anchors (slots 80..119)
  {
    slot: 80,
    weight: 2.0,
    terms: [
      "math",
      "mathematics",
      "ratio",
      "ratios",
      "rate",
      "unit",
      "fraction",
      "fractions",
      "decimal",
      "percent",
      "integer",
      "integers",
      "expression",
      "equation",
      "inequality",
      "variable",
      "geometry",
      "area",
      "volume",
      "surface",
      "perimeter",
      "coordinate",
      "plane",
      "polygon",
      "prism",
      "angle",
      "probability",
      "statistics",
      "mean",
      "median",
      "mode",
      "linear",
      "slope",
      "function",
      "exponent",
      "pythagorean",
      "theorem",
    ],
  },
  {
    slot: 90,
    weight: 2.0,
    terms: [
      "ela",
      "reading",
      "writing",
      "text",
      "passage",
      "author",
      "narrator",
      "poem",
      "poetry",
      "novel",
      "essay",
      "paragraph",
      "sentence",
      "thesis",
      "claim",
      "evidence",
      "theme",
      "character",
      "literary",
      "rhetoric",
      "tone",
      "figurative",
      "metaphor",
      "inference",
      "comprehension",
    ],
  },
  {
    slot: 100,
    weight: 2.0,
    terms: [
      "science",
      "experiment",
      "hypothesis",
      "observation",
      "cell",
      "cells",
      "organism",
      "ecosystem",
      "photosynthesis",
      "respiration",
      "genetics",
      "heredity",
      "dna",
      "evolution",
      "atom",
      "molecule",
      "matter",
      "chemical",
      "physical",
      "energy",
      "thermal",
      "kinetic",
      "potential",
      "wave",
      "gravity",
      "force",
      "planet",
      "orbit",
      "climate",
      "weather",
      "geology",
      "plate",
      "tectonics",
      "fossil",
    ],
  },
  {
    slot: 110,
    weight: 2.0,
    terms: [
      "social",
      "studies",
      "history",
      "historical",
      "civilization",
      "empire",
      "government",
      "democracy",
      "republic",
      "constitution",
      "revolution",
      "colony",
      "colonial",
      "independence",
      "economy",
      "trade",
      "geography",
      "migration",
      "culture",
      "citizen",
      "citizenship",
      "rights",
      "law",
      "legislation",
      "primary",
      "secondary",
      "source",
      "treaty",
      "war",
      "reform",
      "baltimore",
      "maryland",
    ],
  },
];

function fnv1a32(str, seed = 0x811c9dc5) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * Deterministic 1536-dimension unit-normalized embedding vector combining
 * WIDA KLU / domain semantic slots (0..127) and signed feature hashing over
 * unigrams, bigrams, and character n-grams (128..1535).
 */
export function embedText(text) {
  const vec = new Float64Array(EMBEDDING_DIM);
  const tokens = tokenize(text);
  if (tokens.length === 0) {
    vec[0] = 1;
    return Array.from(vec);
  }

  const tokenCounts = new Map();
  for (const tok of tokens) {
    tokenCounts.set(tok, (tokenCounts.get(tok) || 0) + 1);
  }

  // 1. Semantic WIDA KLU + subject-domain slots
  for (const anchor of SEMANTIC_ANCHORS) {
    let hits = 0;
    for (const term of anchor.terms) {
      const c = tokenCounts.get(term);
      if (c) hits += Math.min(c, 3);
    }
    if (hits > 0) {
      const val = anchor.weight * Math.log1p(hits);
      vec[anchor.slot] += val;
      // Spread lightly into an adjacent harmony slot for smoother geometry
      vec[(anchor.slot + 1) % SEMANTIC_SLOTS] += val * 0.35;
    }
  }

  // 2. Signed feature hashing into dimensions 128..1535
  const hashSpace = EMBEDDING_DIM - SEMANTIC_SLOTS;
  const addFeature = (feature, weight) => {
    const h1 = fnv1a32(feature, 0x811c9dc5);
    const h2 = fnv1a32(feature, 0x9e3779b1);
    const idx = SEMANTIC_SLOTS + (h1 % hashSpace);
    const sign = (h2 & 1) === 0 ? 1 : -1;
    vec[idx] += sign * weight;
  };

  for (const [tok, count] of tokenCounts.entries()) {
    const tf = 1 + Math.log(count);
    addFeature(`u:${tok}`, tf * 1.0);
    // Character 4-grams capture morphology (ratio/ratios/proportional, explain/explanation)
    if (tok.length >= 4) {
      const padded = `^${tok}$`;
      for (let i = 0; i <= padded.length - 4; i++) {
        addFeature(`c:${padded.slice(i, i + 4)}`, tf * 0.25);
      }
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    addFeature(`b:${tokens[i]}_${tokens[i + 1]}`, 0.75);
  }

  // 3. L2 normalization
  let normSq = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq) || 1;
  const out = new Array(EMBEDDING_DIM);
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    out[i] = vec[i] / norm;
  }
  return out;
}

export function toPgVectorLiteral(vec) {
  if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIM) {
    throw new Error(`Expected embedding vector of length ${EMBEDDING_DIM}`);
  }
  return `[${vec.map((n) => Number(n).toFixed(6)).join(",")}]`;
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Curated L1 Academic Cognate Lexicons
// ---------------------------------------------------------------------------

const SPANISH_COGNATES = {
  analyze: "analizar",
  analysis: "análisis",
  compare: "comparar",
  comparison: "comparación",
  contrast: "contrastar",
  evidence: "evidencia",
  ratio: "razón",
  ratios: "razones",
  proportion: "proporción",
  proportional: "proporcional",
  equation: "ecuación",
  equations: "ecuaciones",
  expression: "expresión",
  expressions: "expresiones",
  fraction: "fracción",
  fractions: "fracciones",
  decimal: "decimal",
  decimals: "decimales",
  percent: "porcentaje",
  percentage: "porcentaje",
  variable: "variable",
  variables: "variables",
  constant: "constante",
  function: "función",
  functions: "funciones",
  linear: "lineal",
  positive: "positivo",
  negative: "negativo",
  equivalent: "equivalente",
  factor: "factor",
  factors: "factores",
  product: "producto",
  quotient: "cociente",
  area: "área",
  volume: "volumen",
  perimeter: "perímetro",
  coordinate: "coordenada",
  coordinates: "coordenadas",
  polygon: "polígono",
  prism: "prisma",
  cylinder: "cilindro",
  pyramid: "pirámide",
  angle: "ángulo",
  angles: "ángulos",
  probability: "probabilidad",
  statistics: "estadística",
  median: "mediana",
  mode: "moda",
  distribution: "distribución",
  transformation: "transformación",
  ecosystem: "ecosistema",
  ecosystems: "ecosistemas",
  organism: "organismo",
  organisms: "organismos",
  energy: "energía",
  matter: "materia",
  photosynthesis: "fotosíntesis",
  respiration: "respiración",
  cell: "célula",
  cells: "células",
  atom: "átomo",
  atoms: "átomos",
  molecule: "molécula",
  molecules: "moléculas",
  chemical: "químico",
  physical: "físico",
  reaction: "reacción",
  gravity: "gravedad",
  temperature: "temperatura",
  climate: "clima",
  erosion: "erosión",
  fossil: "fósil",
  fossils: "fósiles",
  mineral: "mineral",
  planet: "planeta",
  orbit: "órbita",
  hypothesis: "hipótesis",
  experiment: "experimento",
  observation: "observación",
  heredity: "herencia",
  genetics: "genética",
  evolution: "evolución",
  democracy: "democracia",
  republic: "república",
  constitution: "constitución",
  revolution: "revolución",
  economy: "economía",
  economic: "económico",
  migration: "migración",
  civilization: "civilización",
  empire: "imperio",
  colony: "colonia",
  colonial: "colonial",
  culture: "cultura",
  cultural: "cultural",
  government: "gobierno",
  citizen: "ciudadano",
  citizens: "ciudadanos",
  geography: "geografía",
  geographic: "geográfico",
  history: "historia",
  historical: "histórico",
  primary: "primario",
  secondary: "secundario",
  document: "documento",
  argument: "argumento",
  conclusion: "conclusión",
  narrative: "narrativa",
  metaphor: "metáfora",
  perspective: "perspectiva",
  theme: "tema",
  conflict: "conflicto",
  resolution: "resolución",
  solution: "solución",
  structure: "estructura",
  sequence: "secuencia",
  cause: "causa",
  causes: "causas",
  effect: "efecto",
  effects: "efectos",
  detail: "detalle",
  details: "detalles",
  summary: "resumen",
  author: "autor",
  character: "personaje",
  dialogue: "diálogo",
  evaluate: "evaluar",
  justify: "justificar",
  explain: "explicar",
  explanation: "explicación",
  describe: "describir",
  description: "descripción",
  represent: "representar",
  representation: "representación",
  interpret: "interpretar",
  classify: "clasificar",
  identify: "identificar",
  predict: "predecir",
  model: "modelo",
  system: "sistema",
  systems: "sistemas",
  process: "proceso",
  method: "método",
  result: "resultado",
  results: "resultados",
  data: "datos",
  graph: "gráfica",
  table: "tabla",
  diagram: "diagrama",
  distance: "distancia",
  quantity: "cantidad",
  quantities: "cantidades",
  difference: "diferencia",
  similar: "similar",
  different: "diferente",
  important: "importante",
  necessary: "necesario",
  possible: "posible",
  original: "original",
  central: "central",
  natural: "natural",
  social: "social",
  political: "político",
  industrial: "industrial",
  independent: "independiente",
  dependent: "dependiente",
  conservation: "conservación",
  interaction: "interacción",
};

const ARABIC_COGNATES = {
  algebra: "الجبر (al-jabr)",
  algebraic: "جبري (jabrī)",
  algorithm: "الخوارزمية (al-khwārizmiyya)",
  zero: "صفر (ṣifr)",
  chemistry: "كيمياء (kīmiyāʾ)",
  chemical: "كيميائي (kīmiyāʾī)",
  alkali: "القلوي (al-qalawī)",
  alcohol: "الكحول (al-kuḥūl)",
  average: "عوار (historical Arabic root)",
  tariff: "تعريفة (taʿrīfa)",
  cotton: "قطن (quṭn)",
  sugar: "سكر (sukkar)",
  coffee: "قهوة (qahwa)",
  monsoon: "موسم (mawsim)",
  admiral: "أمير البحر (amīr al-baḥr)",
  arsenal: "دار الصناعة (dār aṣ-ṣināʿa)",
  magazine: "مخزن (makhzan)",
  hazard: "الزهر (az-zahr)",
  caravan: "قافلة (qāfila)",
  sultan: "سلطان (sulṭān)",
  caliph: "خليفة (khalīfa)",
  oasis: "واحة (wāḥa)",
  geography: "جغرافيا (jughrāfiyā)",
  geometry: "جيومتريا / هندسة (jīyumitriyā)",
  biology: "بيولوجيا (bīyūlūjiyā)",
  physics: "فيزياء (fīziyāʾ)",
  geology: "جيولوجيا (jīyūlūjiyā)",
  ecology: "إيكولوجيا (īkūlūjiyā)",
  technology: "تكنولوجيا (tiknūlūjiyā)",
  democracy: "ديمقراطية (dīmuqrāṭiyya)",
  strategy: "استراتيجية (istrātījiyya)",
  oxygen: "أكسجين (uksijīn)",
  carbon: "كربون (karbūn)",
  hydrogen: "هيدروجين (hīdrūjīn)",
  nitrogen: "نيتروجين (nītrūjīn)",
  proton: "بروتون (brūtūn)",
  electron: "إلكترون (iliktrūn)",
  neutron: "نيوترون (nīyūtrūn)",
  microscope: "ميكروسكوب (mīkrūskūb)",
  telescope: "تلسكوب (tiliskūb)",
  thermometer: "ترمومتر (tirmūmitr)",
  barometer: "بارومتر (bārūmitr)",
  magnet: "مغناطيس (maghnāṭīs)",
  magnetic: "مغناطيسي (maghnāṭīsī)",
  bacteria: "بكتيريا (baktīriyā)",
  virus: "فيروس (fīrūs)",
  protein: "بروتين (brūtīn)",
  vitamin: "فيتامين (fītāmīn)",
  mineral: "معدن / مينيرال",
  meter: "متر (mitr)",
  meters: "أمتار (amtār)",
  centimeter: "سنتيمتر (santīmitr)",
  kilometer: "كيلومتر (kīlūmitr)",
  liter: "لتر (litr)",
  liters: "لترات (litrāt)",
  gram: "جرام (jirām)",
  grams: "جرامات (jirāmāt)",
  kilogram: "كيلوجرام (kīlūjirām)",
  diagram: "دياجرام / مخطط",
  graph: "غراف / رسم بياني",
  prism: "منشور (shared Greek/Arabic scientific tradition)",
  pyramid: "هرم (haram)",
  atlas: "أطلس (aṭlas)",
  calendar: "تقويم",
  safari: "سفر (safar)",
  giraffe: "زرافة (zarāfa)",
  gazelle: "غزال (ghazāl)",
  metric: "متري (mitrī)",
  system: "سيستم / نظام",
  energy: "طاقة (international STEM bridge: إنرجي)",
  data: "داتا / بيانات",
  model: "موديل / نموذج",
};

const FRENCH_CREOLE_COGNATES = {
  analyze: "analyser (FR) · analize (HT)",
  analysis: "analyse (FR) · analiz (HT)",
  compare: "comparer (FR) · konpare (HT)",
  comparison: "comparaison (FR) · konparezon (HT)",
  contrast: "contraster (FR) · kontraste (HT)",
  evidence: "évidence (FR) · evidans (HT)",
  ratio: "ratio (FR) · rasyo (HT)",
  ratios: "ratios (FR) · rasyo (HT)",
  proportion: "proportion (FR) · pwopòsyon (HT)",
  proportional: "proportionnel (FR) · pwopòsyonèl (HT)",
  equation: "équation (FR) · ekwasyon (HT)",
  equations: "équations (FR) · ekwasyon (HT)",
  expression: "expression (FR) · ekspresyon (HT)",
  fraction: "fraction (FR) · fraksyon (HT)",
  fractions: "fractions (FR) · fraksyon (HT)",
  decimal: "décimal (FR) · desimal (HT)",
  percent: "pourcentage (FR) · pousantaj (HT)",
  percentage: "pourcentage (FR) · pousantaj (HT)",
  variable: "variable (FR) · varyab (HT)",
  variables: "variables (FR) · varyab (HT)",
  constant: "constant (FR) · konstan (HT)",
  function: "fonction (FR) · fonksyon (HT)",
  linear: "linéaire (FR) · lineyè (HT)",
  positive: "positif (FR) · pozitif (HT)",
  negative: "négatif (FR) · negatif (HT)",
  equivalent: "équivalent (FR) · ekivalan (HT)",
  factor: "facteur (FR) · faktè (HT)",
  product: "produit (FR) · pwodwi (HT)",
  quotient: "quotient (FR) · kosyan (HT)",
  area: "aire (FR) · è (HT)",
  volume: "volume (FR) · volim (HT)",
  perimeter: "périmètre (FR) · perimèt (HT)",
  coordinate: "coordonnée (FR) · kowòdone (HT)",
  polygon: "polygone (FR) · poligòn (HT)",
  prism: "prisme (FR) · prism (HT)",
  cylinder: "cylindre (FR) · silenn (HT)",
  pyramid: "pyramide (FR) · piramid (HT)",
  angle: "angle (FR) · ang (HT)",
  probability: "probabilité (FR) · pwobabilite (HT)",
  statistics: "statistique (FR) · estatistik (HT)",
  distribution: "distribution (FR) · distribisyon (HT)",
  transformation: "transformation (FR) · transfòmasyon (HT)",
  ecosystem: "écosystème (FR) · ekosistèm (HT)",
  organism: "organisme (FR) · òganis (HT)",
  energy: "énergie (FR) · enèji (HT)",
  matter: "matière (FR) · matyè (HT)",
  photosynthesis: "photosynthèse (FR) · fotosentèz (HT)",
  respiration: "respiration (FR) · respirasyon (HT)",
  cell: "cellule (FR) · selil (HT)",
  cells: "cellules (FR) · selil (HT)",
  atom: "atome (FR) · atòm (HT)",
  molecule: "molécule (FR) · molekil (HT)",
  chemical: "chimique (FR) · chimik (HT)",
  physical: "physique (FR) · fizik (HT)",
  reaction: "réaction (FR) · reyaksyon (HT)",
  gravity: "gravité (FR) · gravite (HT)",
  temperature: "température (FR) · tanperati (HT)",
  climate: "climat (FR) · klima (HT)",
  erosion: "érosion (FR) · ewozyon (HT)",
  fossil: "fossile (FR) · fosil (HT)",
  mineral: "minéral (FR) · mineral (HT)",
  planet: "planète (FR) · planèt (HT)",
  orbit: "orbite (FR) · òbit (HT)",
  hypothesis: "hypothèse (FR) · ipotèz (HT)",
  experiment: "expérience (FR) · eksperyans (HT)",
  observation: "observation (FR) · obsèvasyon (HT)",
  genetics: "génétique (FR) · jenetik (HT)",
  evolution: "évolution (FR) · evolisyon (HT)",
  democracy: "démocratie (FR) · demokrasi (HT)",
  republic: "république (FR) · repiblik (HT)",
  constitution: "constitution (FR) · konstitisyon (HT)",
  revolution: "révolution (FR) · revolisyon (HT)",
  economy: "économie (FR) · ekonomi (HT)",
  migration: "migration (FR) · migrasyon (HT)",
  civilization: "civilisation (FR) · sivilizasyon (HT)",
  empire: "empire (FR) · anpi (HT)",
  colony: "colonie (FR) · koloni (HT)",
  culture: "culture (FR) · kilti (HT)",
  government: "gouvernement (FR) · gouvènman (HT)",
  citizen: "citoyen (FR) · sitwayen (HT)",
  geography: "géographie (FR) · jewografi (HT)",
  history: "histoire (FR) · istwa (HT)",
  primary: "primaire (FR) · primè (HT)",
  secondary: "secondaire (FR) · segondè (HT)",
  document: "document (FR) · dokiman (HT)",
  argument: "argument (FR) · agiman (HT)",
  conclusion: "conclusion (FR) · konklizyon (HT)",
  narrative: "narratif (FR) · naratif (HT)",
  metaphor: "métaphore (FR) · metafò (HT)",
  perspective: "perspective (FR) · pèspektiv (HT)",
  theme: "thème (FR) · tèm (HT)",
  conflict: "conflit (FR) · konfli (HT)",
  resolution: "résolution (FR) · rezolisyon (HT)",
  solution: "solution (FR) · solisyon (HT)",
  structure: "structure (FR) · estrikti (HT)",
  sequence: "séquence (FR) · sekans (HT)",
  cause: "cause (FR) · koz (HT)",
  effect: "effet (FR) · efè (HT)",
  detail: "détail (FR) · detay (HT)",
  author: "auteur (FR) · otè (HT)",
  dialogue: "dialogue (FR) · dyalòg (HT)",
  evaluate: "évaluer (FR) · evalye (HT)",
  justify: "justifier (FR) · jistifye (HT)",
  explain: "expliquer (FR) · eksplike (HT)",
  describe: "décrire (FR) · dekri (HT)",
  represent: "représenter (FR) · reprezante (HT)",
  interpret: "interpréter (FR) · entèprete (HT)",
  classify: "classifier (FR) · klasifye (HT)",
  identify: "identifier (FR) · idantifye (HT)",
  model: "modèle (FR) · modèl (HT)",
  system: "système (FR) · sistèm (HT)",
  process: "processus (FR) · pwosesis (HT)",
  method: "méthode (FR) · metòd (HT)",
  result: "résultat (FR) · rezilta (HT)",
  graph: "graphique (FR) · grafik (HT)",
  table: "table (FR) · tablo (HT)",
  diagram: "diagramme (FR) · dyagram (HT)",
  distance: "distance (FR) · distans (HT)",
  quantity: "quantité (FR) · kantite (HT)",
  difference: "différence (FR) · diferans (HT)",
  similar: "similaire (FR) · similè (HT)",
  different: "différent (FR) · diferan (HT)",
  important: "important (FR) · enpòtan (HT)",
  necessary: "nécessaire (FR) · nesesè (HT)",
  possible: "possible (FR) · posib (HT)",
  original: "original (FR) · orijinal (HT)",
  central: "central (FR) · santral (HT)",
  natural: "naturel (FR) · natirèl (HT)",
  social: "social (FR) · sosyal (HT)",
  political: "politique (FR) · politik (HT)",
  independent: "indépendant (FR) · endepandan (HT)",
  conservation: "conservation (FR) · konsèvasyon (HT)",
  interaction: "interaction (FR) · entèraksyon (HT)",
};

const COGNATE_LEXICONS = {
  Spanish: SPANISH_COGNATES,
  Arabic: ARABIC_COGNATES,
  "French / Haitian Creole": FRENCH_CREOLE_COGNATES,
};

// Morphological cognate patterns for words not in the curated dictionary.
// Excludes short function words and common false-positive endings.
const MORPH_EXCLUDE = new Set([
  "station",
  "nation",
  "mention",
  "question",
  "action",
  "section",
  "moment",
  "element",
  "animal",
  "normal",
  "final",
  "total",
  "equal",
  "local",
  "metal",
  "canal",
  "vocal",
  "really",
  "actually",
  "finally",
  "usually",
  "only",
  "early",
  "family",
  "city",
  "party",
  "empty",
  "fifty",
  "sixty",
  "dirty",
  "pretty",
  "twenty",
  "thirty",
  "forty",
  "basic",
  "music",
  "magic",
  "topic",
  "public",
  "static",
  "plastic",
  "went",
  "sent",
  "spent",
  "meant",
  "parent",
  "student",
  "different",
  "present",
]);

function detectMorphologicalCognate(wordLower, l1) {
  if (wordLower.length < 6 || MORPH_EXCLUDE.has(wordLower)) return null;

  if (l1 === "Spanish") {
    if (wordLower.endsWith("tion")) {
      return {
        bridge: `-${wordLower.slice(0, -4)}ción (Spanish -ción pattern)`,
        category: "Morphological Cognate (-tion → -ción)",
        note: "English academic nouns ending in -tion reliably map to Spanish -ción.",
      };
    }
    if (wordLower.endsWith("sion")) {
      return {
        bridge: `${wordLower.slice(0, -4)}sión (Spanish -sión pattern)`,
        category: "Morphological Cognate (-sion → -sión)",
        note: "English -sion nouns map directly to Spanish -sión.",
      };
    }
    if (wordLower.endsWith("ity")) {
      return {
        bridge: `${wordLower.slice(0, -3)}idad (Spanish -idad pattern)`,
        category: "Morphological Cognate (-ity → -idad)",
        note: "Abstract English -ity nouns map to Spanish -idad.",
      };
    }
    if (wordLower.endsWith("ment")) {
      return {
        bridge: `${wordLower.slice(0, -4)}mento / -miento (Spanish cognate root)`,
        category: "Morphological Cognate (-ment → -mento)",
        note: "Shared Latinate noun suffix -ment / -mento.",
      };
    }
    if (wordLower.endsWith("ical") || wordLower.endsWith("ic")) {
      return {
        bridge: `${wordLower.replace(/ical$|ic$/, "ico")} (Spanish -ico pattern)`,
        category: "Morphological Cognate (-ic → -ico)",
        note: "Academic adjectives ending in -ic/-ical map to Spanish -ico.",
      };
    }
    if (wordLower.endsWith("al") && wordLower.length >= 7) {
      return {
        bridge: `${wordLower} (Spanish -al cognate)`,
        category: "Morphological Cognate (-al)",
        note: "Latinate -al adjectives are frequently identical in spelling across English and Spanish.",
      };
    }
  }

  if (l1 === "French / Haitian Creole") {
    if (wordLower.endsWith("tion")) {
      return {
        bridge: `${wordLower} (FR) · ${wordLower.slice(0, -4)}syon (HT)`,
        category: "Morphological Cognate (-tion → -tion / -syon)",
        note: "English -tion academic nouns map directly to French -tion and Haitian Creole -syon.",
      };
    }
    if (wordLower.endsWith("sion")) {
      return {
        bridge: `${wordLower} (FR) · ${wordLower.slice(0, -4)}zyon (HT)`,
        category: "Morphological Cognate (-sion → -sion / -zyon)",
        note: "Shared French/Creole Latinate suffix.",
      };
    }
    if (wordLower.endsWith("ity")) {
      return {
        bridge: `${wordLower.slice(0, -3)}ité (FR) · ${wordLower.slice(0, -3)}ite (HT)`,
        category: "Morphological Cognate (-ity → -ité / -ite)",
        note: "Abstract English -ity nouns map to French -ité and Haitian Creole -ite.",
      };
    }
    if (wordLower.endsWith("ment")) {
      return {
        bridge: `${wordLower} (FR) · ${wordLower.slice(0, -4)}man (HT)`,
        category: "Morphological Cognate (-ment → -ment / -man)",
        note: "Shared French/Creole suffix for academic processes and concepts.",
      };
    }
    if (wordLower.endsWith("ic") || wordLower.endsWith("ical")) {
      return {
        bridge: `${wordLower.replace(/ical$|ic$/, "ique")} (FR) · ${wordLower.replace(/ical$|ic$/, "ik")} (HT)`,
        category: "Morphological Cognate (-ic → -ique / -ik)",
        note: "English -ic adjectives map predictably to French -ique and Haitian Creole -ik.",
      };
    }
    if (wordLower.endsWith("al") && wordLower.length >= 7) {
      return {
        bridge: `${wordLower} (FR/HT -al cognate)`,
        category: "Morphological Cognate (-al)",
        note: "Latinate -al academic adjectives transfer cleanly across English, French, and Haitian Creole.",
      };
    }
  }

  if (l1 === "Arabic") {
    if (wordLower.endsWith("ology")) {
      return {
        bridge: `علم / -وجيا (international scientific -ology root)`,
        category: "International STEM Cognate (-ology)",
        note: "Greek/international scientific disciplines ending in -ology are widely recognizable loanwords in Arabic STEM texts.",
      };
    }
    if (wordLower.endsWith("graphy") || wordLower.endsWith("graph")) {
      return {
        bridge: `-غرافيا / رسم بياني (international -graph root)`,
        category: "International STEM Cognate (-graph)",
        note: "Recognizable international STEM root used across Arabic geography and math curricula.",
      };
    }
    if (wordLower.endsWith("meter")) {
      return {
        bridge: `-متر (international metric/measuring root)`,
        category: "International STEM Cognate (-meter)",
        note: "Metric and measurement instruments share the -meter / -متر root in Arabic.",
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Academic Syntax Trap Rules
// ---------------------------------------------------------------------------

const SYNTAX_TRAP_RULES = [
  {
    type: "Passive Voice",
    regex:
      /\b(?:is|are|was|were|be|been|being)\s+(?:not\s+)?(?:[a-z]+ed|shown|given|taken|written|chosen|built|found|made|held|led|drawn|grown|known|seen|done|sent|spent|broken|spoken|driven|frozen|hidden|proven|risen|shaken|stolen|thrown|worn|woven|cut|put|set)\b/gi,
    explanation:
      "Passive construction hides who or what performs the action, which frequently obscures agency in science, history, and math word problems.",
    teaching_tip:
      "Ask students: 'Who or what is doing this action?' Rewrite together in active voice before solving or summarizing.",
  },
  {
    type: "Comparative / Proportional Phrasing",
    regex:
      /\b(?:(?:more|less|fewer|greater|smaller|larger|higher|lower|faster|slower|longer|shorter|heavier|lighter|older|younger|warmer|cooler)\s+(?:[a-z0-9'-]+\s+){0,3}than|as\s+[a-z]+\s+as|[a-z]{3,}er\s+than|\d+\s+times\s+as\s+[a-z]+\s+as|for\s+every|at\s+least|at\s+most|no\s+more\s+than|per\s+[a-z0-9-]+)\b/gi,
    explanation:
      "Comparative and rate structures encode mathematical or logical relationships in compact prepositional phrasing.",
    teaching_tip:
      "Box the two quantities being compared and sketch a quick bar model or double number line to make the direction of comparison visible.",
  },
  {
    type: "Causal Connector",
    regex:
      /\b(?:as\s+a\s+result|due\s+to|caused\s+by|leads\s+to|led\s+to|results\s+in|resulted\s+in|so\s+that|because|therefore|consequently|causes|since|thus|hence)\b/gi,
    explanation:
      "Causal connectors reverse or chain cause-and-effect order across clauses, which can flip meaning for multilingual learners.",
    teaching_tip:
      "Label Clause A (Cause) and Clause B (Effect) with an arrow (→) so students verify which event happens first.",
  },
  {
    type: "Conditional / Hypothetical Clause",
    regex:
      /\b(?:provided\s+that|in\s+order\s+to|unless|suppose|assuming|whether|if\b[^.,;!?]{1,60}?\bthen|\bif\b)\b/gi,
    explanation:
      "Conditional phrasing introduces a hypothetical constraint that must hold before the main statement or calculation applies.",
    teaching_tip:
      "Have students underline the condition ('IF ...') in one color and the outcome ('THEN ...') in another.",
  },
  {
    type: "Academic Transition / Nominalization",
    regex:
      /\b(?:on\s+the\s+other\s+hand|in\s+contrast|even\s+though|however|although|whereas|nevertheless|furthermore|moreover|despite|counterclaim|relationship|representation|justification|interpretation|proportionality|conservation)\b/gi,
    explanation:
      "Contrastive transitions and dense nominalizations pack an entire verb clause into a single academic noun or signal a sharp shift in argument.",
    teaching_tip:
      "Unpack nominalizations back into an action verb (e.g., 'the conservation of energy' → 'energy is saved/kept') and preview contrastive pivots.",
  },
];

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "have",
  "has",
  "had",
  "was",
  "were",
  "are",
  "been",
  "being",
  "will",
  "would",
  "could",
  "should",
  "can",
  "may",
  "might",
  "must",
  "not",
  "but",
  "into",
  "onto",
  "over",
  "under",
  "about",
  "after",
  "before",
  "between",
  "during",
  "through",
  "where",
  "when",
  "which",
  "while",
  "what",
  "who",
  "whom",
  "whose",
  "how",
  "why",
  "their",
  "there",
  "these",
  "those",
  "they",
  "them",
  "then",
  "than",
  "each",
  "other",
  "some",
  "many",
  "most",
  "more",
  "less",
  "such",
  "only",
  "also",
  "very",
  "just",
  "does",
  "did",
  "doing",
  "done",
  "make",
  "made",
  "take",
  "took",
  "give",
  "gave",
  "find",
  "found",
  "show",
  "shows",
  "used",
  "using",
  "uses",
  "your",
  "ours",
  "ourselves",
  "student",
  "students",
  "teacher",
  "class",
  "problem",
  "question",
  "passage",
  "sentence",
]);

function extractKeyContentTerms(passage) {
  const words = String(passage || "")
    .replace(/[^A-Za-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w));

  const counts = new Map();
  const displayForm = new Map();
  for (const w of words) {
    const lower = w.toLowerCase();
    if (STOPWORDS.has(lower)) continue;
    counts.set(lower, (counts.get(lower) || 0) + 1);
    if (!displayForm.has(lower)) displayForm.set(lower, lower);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 4)
    .map(([k]) => displayForm.get(k));
}

function buildDifferentiatedFrames(matchedBlueprint, passageTerms, l1) {
  const klu = (matchedBlueprint?.wida_klu || "Explain").toLowerCase();
  const t1 = passageTerms[0] || "this concept";
  const t2 = passageTerms[1] || "the evidence";
  const t3 = passageTerms[2] || "the outcome";

  if (klu.includes("argue")) {
    return {
      level_1_2: `I claim that ${t1} is ___. My evidence from the text is "${t2}." (Word bank: ${t1}, ${t2}, ${t3}; L1 bridge: ${l1})`,
      level_3_4: `Based on ${t2}, I argue that ${t1} directly impacts ${t3} because ___.`,
      level_5_6: `Although some may interpret ${t2} differently, the evidence surrounding ${t1} substantiates the claim that ${t3} ___; consequently, ___.`,
    };
  }
  if (klu.includes("narrate")) {
    return {
      level_1_2: `First, ${t1} happened. Next, ${t2} changed. At the end, ${t3} ___. (L1 bridge: ${l1})`,
      level_3_4: `At the beginning of the passage, ${t1} creates a tension around ${t2}, which leads to ${t3} when ___.`,
      level_5_6: `Through the shift from ${t1} to ${t2}, the author develops ${t3} by revealing how ___.`,
    };
  }
  if (klu.includes("inform")) {
    return {
      level_1_2: `${t1} has ___. It is connected to ${t2} and ${t3}. (Word bank: ${t1}, ${t2}, ${t3}; L1 bridge: ${l1})`,
      level_3_4: `One key feature of ${t1} is ___, whereas ${t2} shows ___ in relation to ${t3}.`,
      level_5_6: `Comparing ${t1} and ${t2} reveals a distinct pattern in ${t3}; specifically, the data/text indicates that ___.`,
    };
  }
  // Default: Explain
  return {
    level_1_2: `${t1} happens because of ${t2}. This changes ${t3}. (Word bank: ${t1}, ${t2}, ${t3}; L1 bridge: ${l1})`,
    level_3_4: `Because ${t1} interacts with ${t2}, it causes ${t3} to ___.`,
    level_5_6: `The relationship between ${t1} and ${t2} explains why ${t3} ___; therefore, when ___ changes, ___.`,
  };
}

/**
 * Deconstruct an academic passage for multilingual learners:
 * - Validates passage (1..1500 chars) and l1
 * - Ranks WIDA KLU blueprints by cosine similarity (or uses preMatchedBlueprint from pgvector)
 * - Highlights L1 Cognate Anchors (green) and Academic Syntax Traps (amber) as non-overlapping
 *   text segments safe for DOM textContent rendering (zero innerHTML XSS)
 * - Generates WIDA Tier 1-2, 3-4, and 5-6 sentence frames tailored to passage terms
 */
export function deconstructPassage(passage, l1, blueprints = [], preMatchedBlueprint = null) {
  if (typeof passage !== "string") {
    const err = new Error("passage must be a string.");
    err.status = 400;
    throw err;
  }
  const trimmed = passage.trim();
  if (trimmed.length < 1 || trimmed.length > 1500) {
    const err = new Error("passage must be between 1 and 1500 characters.");
    err.status = 400;
    throw err;
  }
  if (!SUPPORTED_L1S.includes(l1)) {
    const err = new Error(`l1 must be one of: ${SUPPORTED_L1S.join(", ")}.`);
    err.status = 400;
    throw err;
  }

  // 1. Blueprint matching
  let matchedBlueprint = preMatchedBlueprint || null;
  if (!matchedBlueprint && Array.isArray(blueprints) && blueprints.length > 0) {
    const passageVec = embedText(trimmed);
    let best = null;
    let bestScore = -Infinity;
    for (const bp of blueprints) {
      const bpText = `${bp.wida_klu || ""} ${bp.move_name || ""} ${bp.syntax_pattern || ""} ${
        typeof bp.scaffolds_json === "string"
          ? bp.scaffolds_json
          : JSON.stringify(bp.scaffolds_json || {})
      }`;
      const score = cosineSimilarity(passageVec, embedText(bpText));
      if (score > bestScore) {
        bestScore = score;
        best = bp;
      }
    }
    if (best) {
      matchedBlueprint = {
        ...best,
        similarity: Number(bestScore.toFixed(4)),
      };
    }
  }

  // 2. Collect spans for Syntax Traps (priority 1) and L1 Cognate Anchors (priority 2)
  const spans = [];

  for (const rule of SYNTAX_TRAP_RULES) {
    rule.regex.lastIndex = 0;
    let m;
    while ((m = rule.regex.exec(trimmed)) !== null) {
      if (!m[0]) break;
      spans.push({
        start: m.index,
        end: m.index + m[0].length,
        kind: "syntax_trap",
        priority: 1,
        text: m[0],
        category: rule.type,
        tip: rule.teaching_tip,
        explanation: rule.explanation,
      });
    }
  }

  const lexicon = COGNATE_LEXICONS[l1] || {};
  const wordRegex = /\b[A-Za-z][A-Za-z'-]{2,}\b/g;
  let wm;
  while ((wm = wordRegex.exec(trimmed)) !== null) {
    const raw = wm[0];
    const lower = raw.toLowerCase();
    if (lexicon[lower]) {
      spans.push({
        start: wm.index,
        end: wm.index + raw.length,
        kind: "cognate",
        priority: 2,
        text: raw,
        bridge: lexicon[lower],
        category: `${l1} Academic Cognate`,
        note: `Connect "${raw}" directly to ${l1}: ${lexicon[lower]}.`,
      });
    } else {
      const morph = detectMorphologicalCognate(lower, l1);
      if (morph) {
        spans.push({
          start: wm.index,
          end: wm.index + raw.length,
          kind: "cognate",
          priority: 3,
          text: raw,
          bridge: morph.bridge,
          category: morph.category,
          note: morph.note,
        });
      }
    }
  }

  // 3. Resolve overlapping spans deterministically:
  //    Earlier start wins; on tie, higher priority (lower number) or longer span wins.
  spans.sort((a, b) => a.start - b.start || a.priority - b.priority || b.end - a.end);
  const accepted = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start < cursor) continue;
    accepted.push(s);
    cursor = s.end;
  }

  // 4. Build contiguous segments covering the entire passage safely
  const segments = [];
  let pos = 0;
  for (const s of accepted) {
    if (s.start > pos) {
      segments.push({ text: trimmed.slice(pos, s.start), kind: "plain" });
    }
    if (s.kind === "cognate") {
      segments.push({
        text: trimmed.slice(s.start, s.end),
        kind: "cognate",
        category: s.category,
        bridge: s.bridge,
        tip: s.note,
      });
    } else {
      segments.push({
        text: trimmed.slice(s.start, s.end),
        kind: "syntax_trap",
        category: s.category,
        tip: s.tip,
        explanation: s.explanation,
      });
    }
    pos = s.end;
  }
  if (pos < trimmed.length) {
    segments.push({ text: trimmed.slice(pos), kind: "plain" });
  }

  // 5. Deduplicated summary arrays
  const cognateMap = new Map();
  const trapMap = new Map();
  for (const s of accepted) {
    if (s.kind === "cognate") {
      const key = s.text.toLowerCase();
      if (!cognateMap.has(key)) {
        cognateMap.set(key, {
          term: s.text,
          l1_bridge: s.bridge,
          category: s.category,
          note: s.note,
        });
      }
    } else {
      const key = `${s.category}:${s.text.toLowerCase()}`;
      if (!trapMap.has(key)) {
        trapMap.set(key, {
          phrase: s.text,
          trap_type: s.category,
          explanation: s.explanation,
          teaching_tip: s.tip,
        });
      }
    }
  }

  const keyTerms = extractKeyContentTerms(trimmed);
  const differentiatedFrames = buildDifferentiatedFrames(matchedBlueprint, keyTerms, l1);

  return {
    l1,
    passage_length: trimmed.length,
    segments,
    cognate_anchors: [...cognateMap.values()],
    syntax_traps: [...trapMap.values()],
    matched_blueprint: matchedBlueprint,
    differentiated_frames: differentiatedFrames,
    key_terms: keyTerms,
  };
}

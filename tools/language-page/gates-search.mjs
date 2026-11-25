// G-91 search-relevance: 100-query relevance gate (50 EN + 30 ES accent-insensitive + 20 Standards)
// over the real 162-unit BCPSS dataset using shared/bcpss/unified-search.js.
import { buildSearchIndex, normalizeText, searchUnits } from "../../shared/bcpss/unified-search.js";

/** @type {Array<{ bucket: "en" | "es" | "standards", query: string, expectedUnitId: string, grade?: string, subject?: string }>} */
export const RELEVANCE_QUERIES = [
  // ── 50 English academic queries across K-8 ELA, Math, Science, Social Studies ──
  { bucket: "en", query: "The Five Senses", expectedUnitId: "gk-ela-u1" },
  { bucket: "en", query: "Once Upon a Farm", expectedUnitId: "gk-ela-u2" },
  { bucket: "en", query: "America Then and Now", expectedUnitId: "gk-ela-u3" },
  { bucket: "en", query: "The Continents", expectedUnitId: "gk-ela-u4" },
  { bucket: "en", query: "Pushes Pulls Motion", expectedUnitId: "gk-sci-u2" },
  { bucket: "en", query: "Good Citizenship rules", expectedUnitId: "gk-ss-u1" },
  { bucket: "en", query: "Creature Features", expectedUnitId: "g1-ela-u2" },
  { bucket: "en", query: "Cinderella Stories", expectedUnitId: "g1-ela-u4" },
  { bucket: "en", query: "Sound and Light Waves", expectedUnitId: "g1-sci-u1" },
  { bucket: "en", query: "Cardinal Directions Neighborhood Maps", expectedUnitId: "g1-ss-u2" },
  { bucket: "en", query: "Goods Services Saving Spending", expectedUnitId: "g1-ss-u4" },
  { bucket: "en", query: "The American West", expectedUnitId: "g2-ela-u2" },
  { bucket: "en", query: "Civil Rights Heroes", expectedUnitId: "g2-ela-u3" },
  { bucket: "en", query: "Place Value to 1000", expectedUnitId: "g2-math-u1" },
  { bucket: "en", query: "Pollination Systems nectar", expectedUnitId: "g2-sci-u2" },
  { bucket: "en", query: "Engineering Erosion Solutions", expectedUnitId: "g2-sci-u4" },
  { bucket: "en", query: "Urban Suburban Rural Communities", expectedUnitId: "g2-ss-u2" },
  { bucket: "en", query: "Outer Space astronaut orbit", expectedUnitId: "g3-ela-u2" },
  { bucket: "en", query: "Area and Perimeter of Rectangles", expectedUnitId: "g3-math-u3" },
  { bucket: "en", query: "Understand and Compare Fractions", expectedUnitId: "g3-math-u4" },
  { bucket: "en", query: "Balanced and Unbalanced Forces friction", expectedUnitId: "g3-sci-u1" },
  { bucket: "en", query: "Ecosystems Fossils Survival", expectedUnitId: "g3-sci-u3" },
  { bucket: "en", query: "Interdependence Specialization Trade", expectedUnitId: "g3-ss-u4" },
  { bucket: "en", query: "The Redcoats Are Coming", expectedUnitId: "g4-ela-u3" },
  { bucket: "en", query: "Myth Making", expectedUnitId: "g4-ela-u4" },
  { bucket: "en", query: "Fraction Equivalence Comparison", expectedUnitId: "g4-math-u3" },
  { bucket: "en", query: "Energy Transfer Collisions", expectedUnitId: "g4-sci-u1" },
  { bucket: "en", query: "Chesapeake Watershed sediment", expectedUnitId: "g4-sci-u4" },
  { bucket: "en", query: "Colonial Maryland Enslavement", expectedUnitId: "g4-ss-u2" },
  { bucket: "en", query: "Cultures in Conflict", expectedUnitId: "g5-ela-u1" },
  { bucket: "en", query: "Breaking Barriers segregation", expectedUnitId: "g5-ela-u4" },
  { bucket: "en", query: "Volume of Rectangular Prisms", expectedUnitId: "g5-math-u1" },
  {
    bucket: "en",
    query: "Add Subtract Fractions Unlike Denominators",
    expectedUnitId: "g5-math-u4",
  },
  { bucket: "en", query: "Matter Energy Ecosystems photosynthesis", expectedUnitId: "g5-sci-u2" },
  { bucket: "en", query: "Checks and Balances Constitution", expectedUnitId: "g5-ss-u3" },
  { bucket: "en", query: "Resilience in the Great Depression", expectedUnitId: "g6-ela-u1" },
  { bucket: "en", query: "Hero Journey archetype mentor", expectedUnitId: "g6-ela-u2" },
  { bucket: "en", query: "Area Surface Area Volume net", expectedUnitId: "g6-math-u1" },
  { bucket: "en", query: "Ratios and Rates unit rate", expectedUnitId: "g6-math-u2" },
  {
    bucket: "en",
    query: "Statistical Measures Data Distributions histogram",
    expectedUnitId: "g6-math-u6",
  },
  {
    bucket: "en",
    query: "River Valley Civilizations Mesopotamia Egypt",
    expectedUnitId: "g6-ss-u2",
  },
  { bucket: "en", query: "Ancient Greece and Rome democracy", expectedUnitId: "g6-ss-u4" },
  { bucket: "en", query: "Identity in the Middle Ages", expectedUnitId: "g7-ela-u1" },
  { bucket: "en", query: "Language and Power propaganda rhetoric", expectedUnitId: "g7-ela-u3" },
  { bucket: "en", query: "Constant of Proportionality", expectedUnitId: "g7-math-u1" },
  { bucket: "en", query: "Scale Drawings Circles diameter", expectedUnitId: "g7-math-u5" },
  { bucket: "en", query: "The Great War trench camaraderie", expectedUnitId: "g8-ela-u2" },
  {
    bucket: "en",
    query: "Exponents Scientific Notation Irrational Numbers",
    expectedUnitId: "g8-math-u1",
  },
  { bucket: "en", query: "Pythagorean Theorem hypotenuse", expectedUnitId: "g8-math-u5" },
  { bucket: "en", query: "Sectionalism American Civil War", expectedUnitId: "g8-ss-u3" },

  // ── 30 Spanish accent-insensitive queries (tested both as written and accent-stripped) ──
  { bucket: "es", query: "fraccion", expectedUnitId: "g3-math-u4" },
  { bucket: "es", query: "fracción equivalente", expectedUnitId: "g4-math-u3" },
  { bucket: "es", query: "ecuacion", expectedUnitId: "g6-math-u5" },
  { bucket: "es", query: "sistema de ecuaciones", expectedUnitId: "g8-math-u2" },
  { bucket: "es", query: "fotosintesis", expectedUnitId: "g5-sci-u2" },
  { bucket: "es", query: "fotosíntesis respiración celular", expectedUnitId: "g8-sci-u4" },
  { bucket: "es", query: "proporcion", expectedUnitId: "g7-math-u1" },
  { bucket: "es", query: "energia cinetica", expectedUnitId: "g7-sci-u4" },
  { bucket: "es", query: "energía térmica difusión", expectedUnitId: "g6-sci-u2" },
  { bucket: "es", query: "evidencia afirmacion astronauta", expectedUnitId: "g3-ela-u2" },
  { bucket: "es", query: "globo terraqueo", expectedUnitId: "gk-ss-u2" },
  { bucket: "es", query: "linea de tiempo", expectedUnitId: "gk-ss-u3" },
  { bucket: "es", query: "triangulo rectangulo hipotenusa", expectedUnitId: "g8-math-u5" },
  { bucket: "es", query: "Teorema de Pitágoras", expectedUnitId: "g8-math-u5" },
  { bucket: "es", query: "cuadrilatero rombo", expectedUnitId: "g3-math-u6" },
  { bucket: "es", query: "perimetro area", expectedUnitId: "g3-math-u3" },
  { bucket: "es", query: "angulo transportador", expectedUnitId: "g4-math-u6" },
  { bucket: "es", query: "notacion cientifica", expectedUnitId: "g8-math-u1" },
  { bucket: "es", query: "atmosfera geosfera hidrosfera", expectedUnitId: "g5-sci-u3" },
  { bucket: "es", query: "fosil habitat ecosistema", expectedUnitId: "g3-sci-u3" },
  { bucket: "es", query: "metafora ritmo verso libre", expectedUnitId: "g8-ela-u1" },
  { bucket: "es", query: "retorica propaganda alegoria", expectedUnitId: "g7-ela-u3" },
  { bucket: "es", query: "epidemia cuarentena sintoma", expectedUnitId: "g7-ela-u4" },
  { bucket: "es", query: "demografia migracion", expectedUnitId: "g7-ss-u2" },
  { bucket: "es", query: "escritura cuneiforme civilizacion", expectedUnitId: "g6-ss-u2" },
  { bucket: "es", query: "democracia republica", expectedUnitId: "g6-ss-u4" },
  { bucket: "es", query: "constitucion pesos y contrapesos", expectedUnitId: "g5-ss-u3" },
  { bucket: "es", query: "abolicion Ferrocarril Subterraneo", expectedUnitId: "g8-ss-u2" },
  { bucket: "es", query: "reconstruccion enmienda", expectedUnitId: "g8-ss-u4" },
  { bucket: "es", query: "presion atmosferica conveccion", expectedUnitId: "g7-sci-u3" },

  // ── 20 standard-code queries across K-8 Math, ELA, Science, Social Studies ──
  { bucket: "standards", query: "K.CC.A.1", expectedUnitId: "gk-math-u5" },
  { bucket: "standards", query: "RL.K.1", expectedUnitId: "gk-ela-u1" },
  { bucket: "standards", query: "K-ESS2-1", expectedUnitId: "gk-sci-u1" },
  { bucket: "standards", query: "1.NBT.A.1", expectedUnitId: "g1-math-u2" },
  { bucket: "standards", query: "2.NBT.A.1", expectedUnitId: "g2-math-u1" },
  { bucket: "standards", query: "3.NF.A.1", expectedUnitId: "g3-math-u4" },
  { bucket: "standards", query: "3-PS2-1", expectedUnitId: "g3-sci-u1" },
  { bucket: "standards", query: "4.NF.A.1", expectedUnitId: "g4-math-u3" },
  { bucket: "standards", query: "5.MD.C.3", expectedUnitId: "g5-math-u1" },
  { bucket: "standards", query: "5-PS1-1", expectedUnitId: "g5-sci-u1" },
  { bucket: "standards", query: "6.RP.A.3", expectedUnitId: "g6-math-u2" },
  { bucket: "standards", query: "6.NS.1", expectedUnitId: "g6-math-u3" },
  { bucket: "standards", query: "6.EE.A.1", expectedUnitId: "g6-math-u5" },
  { bucket: "standards", query: "RI.6.8", expectedUnitId: "g6-ela-u4" },
  { bucket: "standards", query: "MS-LS2-1", expectedUnitId: "g6-sci-u3" },
  { bucket: "standards", query: "7.RP.A.2", expectedUnitId: "g7-math-u1" },
  { bucket: "standards", query: "7.G.B.4", expectedUnitId: "g7-math-u5" },
  { bucket: "standards", query: "8.G.B.6", expectedUnitId: "g8-math-u5" },
  { bucket: "standards", query: "MS-LS1-6", expectedUnitId: "g8-sci-u4" },
  { bucket: "standards", query: "D2.Civ.4.6-8", expectedUnitId: "g8-ss-u1" },
];

const ACCENT_PAIRS = [
  ["fracción", "fraccion"],
  ["ecuación", "ecuacion"],
  ["fotosíntesis", "fotosintesis"],
  ["proporción", "proporcion"],
  ["energía", "energia"],
  ["triángulo", "triangulo"],
  ["perímetro", "perimetro"],
  ["ángulo", "angulo"],
  ["atmósfera", "atmosfera"],
  ["metáfora", "metafora"],
  ["demografía", "demografia"],
  ["civilización", "civilizacion"],
  ["constitución", "constitucion"],
  ["abolición", "abolicion"],
  ["reconstrucción", "reconstruccion"],
];

const MIN_OVERALL_RATE = 0.95;
const MIN_BUCKET_RATE = 0.9;

/** Pure evaluator so negative controls can pass a corrupted index. */
export function evaluateSearchRelevance(index, expectedUnitCount = 162) {
  const errors = [];

  if (!index || !Array.isArray(index.docs) || index.docs.length < expectedUnitCount) {
    errors.push(
      `index has ${index?.docs?.length ?? 0} units, expected at least ${expectedUnitCount}`,
    );
  }

  const bucketStats = {
    en: { total: 0, hits: 0 },
    es: { total: 0, hits: 0 },
    standards: { total: 0, hits: 0 },
  };

  let totalHits = 0;

  for (const q of RELEVANCE_QUERIES) {
    bucketStats[q.bucket].total += 1;
    const results = searchUnits(index, q.query, {
      grade: q.grade,
      subject: q.subject,
      limit: 5,
    });
    const topIds = results.map((r) => r.unitId);
    const hit = topIds.includes(q.expectedUnitId);
    if (hit) {
      bucketStats[q.bucket].hits += 1;
      totalHits += 1;
    } else {
      errors.push(
        `[${q.bucket}] "${q.query}" expected ${q.expectedUnitId} in top 5, got [${topIds.join(", ")}]`,
      );
    }
  }

  // Verify accent-insensitivity parity for Spanish pairs
  for (const [accented, plain] of ACCENT_PAIRS) {
    const rAcc = searchUnits(index, accented, { limit: 5 }).map((r) => r.unitId);
    const rPlain = searchUnits(index, plain, { limit: 5 }).map((r) => r.unitId);
    if (rAcc.length === 0 || rPlain.length === 0) {
      errors.push(`accent pair "${accented}" / "${plain}" returned empty results`);
    } else if (rAcc.join(",") !== rPlain.join(",")) {
      errors.push(
        `accent mismatch for "${accented}" vs "${plain}": [${rAcc.join(",")}] !== [${rPlain.join(",")}]`,
      );
    }
  }

  const overallRate = totalHits / RELEVANCE_QUERIES.length;
  if (overallRate < MIN_OVERALL_RATE) {
    errors.push(
      `overall top-5 hit rate ${(overallRate * 100).toFixed(1)}% < ${(MIN_OVERALL_RATE * 100).toFixed(0)}%`,
    );
  }

  for (const [bucket, stat] of Object.entries(bucketStats)) {
    const rate = stat.total ? stat.hits / stat.total : 0;
    if (rate < MIN_BUCKET_RATE) {
      errors.push(
        `${bucket} top-5 hit rate ${(rate * 100).toFixed(1)}% < ${(MIN_BUCKET_RATE * 100).toFixed(0)}%`,
      );
    }
  }

  return {
    errors,
    info: {
      indexedUnits: index?.docs?.length ?? 0,
      queries: RELEVANCE_QUERIES.length,
      overallHitRate: `${totalHits}/${RELEVANCE_QUERIES.length} (${(overallRate * 100).toFixed(1)}%)`,
      en: `${bucketStats.en.hits}/${bucketStats.en.total}`,
      es: `${bucketStats.es.hits}/${bucketStats.es.total}`,
      standards: `${bucketStats.standards.hits}/${bucketStats.standards.total}`,
      accentPairsChecked: ACCENT_PAIRS.length,
    },
  };
}

export const gateSearchRelevance = {
  id: "G-91",
  name: "search-relevance",
  run({ data }) {
    const index = buildSearchIndex(data);
    return evaluateSearchRelevance(index, data.units.length);
  },
  controls({ data }) {
    // Control 1: Corrupted index with all Spanish postings dropped
    const droppedEs = buildSearchIndex(data);
    for (const [tok, list] of droppedEs.postings) {
      const kept = list.filter((p) => p.field !== "spanish_vocab" && p.field !== "spanish_text");
      if (kept.length) droppedEs.postings.set(tok, kept);
      else droppedEs.postings.delete(tok);
    }
    for (const doc of droppedEs.docs) {
      doc.esVocabPhrases = [];
    }
    const ctrlDroppedEs = evaluateSearchRelevance(droppedEs, data.units.length);

    // Control 2: Corrupted index with scrambled posting docIdx pointers
    const scrambled = buildSearchIndex(data);
    const n = scrambled.docs.length;
    for (const list of scrambled.postings.values()) {
      for (const p of list) p.docIdx = (p.docIdx + 17) % n;
    }
    for (const list of scrambled.standardPostings.values()) {
      for (const p of list) p.docIdx = (p.docIdx + 17) % n;
    }
    const ctrlScrambled = evaluateSearchRelevance(scrambled, data.units.length);

    // Control 3: Corrupted index with standard postings wiped
    const noStandards = buildSearchIndex(data);
    noStandards.standardPostings.clear();
    for (const [tok, list] of noStandards.postings) {
      const kept = list.filter((p) => p.field !== "standards");
      if (kept.length) noStandards.postings.set(tok, kept);
      else noStandards.postings.delete(tok);
    }
    const ctrlNoStandards = evaluateSearchRelevance(noStandards, data.units.length);

    return [
      { name: "corrupted-index: Spanish tokens dropped", errors: ctrlDroppedEs.errors },
      { name: "corrupted-index: postings scrambled", errors: ctrlScrambled.errors },
      { name: "corrupted-index: standard codes wiped", errors: ctrlNoStandards.errors },
    ];
  },
};

export { normalizeText };

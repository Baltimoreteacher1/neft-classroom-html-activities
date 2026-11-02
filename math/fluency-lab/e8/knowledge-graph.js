// Mathematical knowledge graph (Enterprise 8): the lab's 96 skills (Kindergarten-Grade 8) as a standards-aware prerequisite graph.
// It reuses the library's own skills and the tutor engine's prerequisite table, and adds only curated edges that are
// mathematically justified (each carries its reason). It replaces nothing: the library stays the source of truth for
// skills, generators and standards; the graph adds structure around them.
import { ALL_SKILLS, generateProblem, seededRandom } from "../problem-bank.js";
import { prerequisites, skillKey } from "../tutor-engine.js";
import { domainForStrand } from "./tokens.js";

const R = (en, es) => ({ en, es });

// Curated prerequisite edges the library's own table does not state. Every edge says why it is needed.
export const CURATED_EDGES = [
  [
    "1:tens-ones",
    "0:count-cardinality",
    R(
      "Place value groups counted objects into tens and ones.",
      "El valor posicional agrupa objetos contados en decenas y unidades.",
    ),
  ],
  [
    "3:perimeter",
    "2:add-100",
    R(
      "Perimeter adds side lengths.",
      "El perímetro suma las longitudes de los lados.",
    ),
  ],
  [
    "3:fraction-equivalence",
    "3:mul-0-5",
    R(
      "Equivalent fractions multiply or divide both parts by the same number.",
      "Las fracciones equivalentes multiplican o dividen ambas partes por el mismo número.",
    ),
  ],
  [
    "4:factors",
    "3:mul-6-9",
    R(
      "Factors come from multiplication facts.",
      "Los factores salen de las tablas de multiplicar.",
    ),
  ],
  [
    "4:unit-conversion",
    "3:mul-10-12",
    R(
      "Converting units multiplies or divides by the size of the unit.",
      "Convertir unidades multiplica o divide por el tamaño de la unidad.",
    ),
  ],
  [
    "5:decimal-add",
    "5:decimal-place",
    R(
      "Adding decimals lines up place values.",
      "Sumar decimales alinea los valores posicionales.",
    ),
  ],
  [
    "5:decimal-sub",
    "5:decimal-place",
    R(
      "Subtracting decimals lines up place values.",
      "Restar decimales alinea los valores posicionales.",
    ),
  ],
  [
    "5:decimal-sub",
    "4:subtract-large",
    R(
      "Decimal subtraction uses the whole-number regrouping method.",
      "Restar decimales usa el reagrupamiento de los números enteros.",
    ),
  ],
  [
    "5:decimal-mul",
    "5:decimal-place",
    R(
      "The decimal point is placed by place value.",
      "El punto decimal se coloca según el valor posicional.",
    ),
  ],
  [
    "5:decimal-mul",
    "4:multiply-1digit",
    R(
      "Multiply the digits first, then place the decimal point.",
      "Primero se multiplican los dígitos y luego se coloca el punto decimal.",
    ),
  ],
  [
    "5:fraction-of",
    "3:division-facts",
    R(
      "A fraction of a number divides by the denominator.",
      "Una fracción de un número divide entre el denominador.",
    ),
  ],
  [
    "5:unit-fraction-division",
    "4:division",
    R(
      "Dividing by a unit fraction builds on whole-number division.",
      "Dividir entre una fracción unitaria se apoya en la división de enteros.",
    ),
  ],
  [
    "5:volume",
    "3:area",
    R("Volume stacks layers of area.", "El volumen apila capas de área."),
  ],
  [
    "6:gcf",
    "4:factors",
    R(
      "The greatest common factor compares factor lists.",
      "El máximo común divisor compara listas de factores.",
    ),
  ],
  [
    "6:lcm",
    "4:factors",
    R(
      "The least common multiple compares multiples and factors.",
      "El mínimo común múltiplo compara múltiplos y factores.",
    ),
  ],
  [
    "6:integers",
    "2:compare-1000",
    R(
      "Integers extend ordering and the number line to negatives.",
      "Los enteros extienden el orden y la recta numérica a los negativos.",
    ),
  ],
  [
    "6:one-step",
    "1:missing-addend",
    R(
      "Solving an equation is finding a missing number with inverse operations.",
      "Resolver una ecuación es hallar un número que falta con operaciones inversas.",
    ),
  ],
  [
    "6:evaluate",
    "5:multiply-whole",
    R(
      "Evaluating an expression substitutes and computes.",
      "Evaluar una expresión sustituye y calcula.",
    ),
  ],
  [
    "6:percent",
    "6:ratios",
    R(
      "A percent is a ratio out of 100.",
      "Un porcentaje es una razón con 100.",
    ),
  ],
  [
    "7:integer-add",
    "6:integers",
    R(
      "Adding signed numbers needs integer order and absolute value.",
      "Sumar números con signo necesita el orden y el valor absoluto de los enteros.",
    ),
  ],
  [
    "7:integer-mul",
    "7:integer-add",
    R(
      "Multiplication of integers is repeated addition of signed numbers.",
      "La multiplicación de enteros es una suma repetida de números con signo.",
    ),
  ],
  [
    "7:scale-drawing",
    "7:proportions",
    R(
      "A scale drawing is a proportion.",
      "Un dibujo a escala es una proporción.",
    ),
  ],
  [
    "7:inequalities",
    "6:one-step",
    R(
      "Solving an inequality follows the steps of solving an equation.",
      "Resolver una desigualdad sigue los pasos de resolver una ecuación.",
    ),
  ],
  [
    "7:probability",
    "3:fraction-compare",
    R(
      "Probability is a fraction between 0 and 1.",
      "La probabilidad es una fracción entre 0 y 1.",
    ),
  ],
  [
    "8:exponents",
    "5:multiply-whole",
    R(
      "An exponent is repeated multiplication.",
      "Un exponente es una multiplicación repetida.",
    ),
  ],
  [
    "8:powers-ten",
    "8:exponents",
    R(
      "Scientific notation uses powers of ten.",
      "La notación científica usa potencias de diez.",
    ),
  ],
  [
    "8:square-roots",
    "8:exponents",
    R(
      "A square root undoes squaring.",
      "Una raíz cuadrada deshace elevar al cuadrado.",
    ),
  ],
  [
    "8:transformations",
    "6:integers",
    R(
      "Transformations move points on the coordinate plane.",
      "Las transformaciones mueven puntos en el plano de coordenadas.",
    ),
  ],
  [
    "8:association",
    "2:interpret-data",
    R(
      "Scatter plots extend reading data displays.",
      "Los diagramas de dispersión extienden la lectura de representaciones de datos.",
    ),
  ],
  [
    "8:functions",
    "8:slope",
    R(
      "A linear function's rate of change is its slope.",
      "La tasa de cambio de una función lineal es su pendiente.",
    ),
  ],
];

// Interactive models that represent a skill's idea (ids come from the MathVisualEngine registry).
const GENERATOR_MODELS = {
  sequence: ["hundredsChart", "numberLine"],
  countSet: ["countingCollection", "tenFrame"],
  subitize: ["tenFrame"],
  compare: ["numberLine"],
  makeTarget: ["tenFrame", "numberBond"],
  missingAddend: ["numberBond", "factFamily"],
  placeValue: ["baseTen"],
  lengthMeasure: ["numberLine"],
  round: ["numberLine"],
  dataDisplay: ["dotPlot"],
  fractionEquivalent: ["fractionBar", "fractionWall"],
  fractionCompare: ["fractionBar"],
  conversion: ["numberLine"],
  decimalPlace: ["decimalGrid", "baseTen"],
  decimalOp: ["decimalGrid", "decimalProduct"],
  fractionOp: ["fractionOps", "fractionBar"],
  fractionOf: ["fractionBar"],
  ratio: ["tapeRatio"],
  rateConversion: ["tapeRatio"],
  percent: ["percentBar"],
  expression: ["algebraTiles"],
  solve: ["balanceScale"],
  numberPlane: ["coordinatePlane", "numberLine"],
  integerOp: ["integerChips", "numberLine"],
  unitRate: ["tapeRatio", "linearGraph"],
  proportion: ["tapeRatio", "linearGraph"],
  percentChange: ["percentBar"],
  scaleDrawing: ["tapeRatio"],
  inequality: ["numberLine"],
  dataChance: ["dotPlot"],
  slope: ["linearGraph", "coordinatePlane"],
  functionRule: ["functionMachine", "linearGraph"],
  system: ["linearGraph"],
  association: ["scatterPlot"],
  transform: ["transformation"],
};
const SKILL_MODELS = {
  "3:area": ["areaPerimeter", "areaDecomp"],
  "3:perimeter": ["areaPerimeter"],
  "5:volume": ["prismVolume"],
  "6:triangle-area": ["triangleArea"],
  "8:angle-relations": ["angleTool"],
  "0:add-sub-5": ["tenFrame", "numberBond"],
  "1:add-10": ["tenFrame", "numberBond"],
  "1:subtract-10": ["tenFrame", "numberBond"],
  "1:add-20": ["tenFrame", "numberLine"],
  "1:subtract-20": ["numberLine"],
  "2:facts-20": ["numberLine"],
  "2:sub-facts-20": ["numberLine"],
  "2:add-100": ["baseTen"],
  "2:subtract-100": ["baseTen"],
  "2:add-1000": ["baseTen"],
  "3:add-sub-1000": ["baseTen"],
  "4:add-large": ["baseTen"],
  "4:subtract-large": ["baseTen"],
  "3:mul-0-5": ["array", "factFamily"],
  "3:mul-6-9": ["array", "factFamily"],
  "3:mul-10-12": ["array"],
  "3:division-facts": ["factFamily", "array"],
  "4:multiply-1digit": ["areaMultiply"],
  "4:multiply-2digit": ["areaMultiply"],
  "4:division": ["longDivision"],
  "5:multiply-whole": ["areaMultiply"],
  "5:divide-whole": ["longDivision"],
  "5:fraction-mul": ["fractionBar"],
  "6:divide-fractions": ["fractionBar"],
  "6:gcf": [],
  "7:fraction-ops": ["fractionOps"],
  "5:unit-fraction-division": ["fractionBar"],
  "2:skip-count": ["hundredsChart"],
  "1:count-patterns": ["hundredsChart"],
  "6:integers": ["coordinatePlane", "numberLine"],
  "7:integer-mul": ["integerChips"],
};

export const modelsForSkill = (skill) => {
  const key = skillKey(skill);
  if (key in SKILL_MODELS) return SKILL_MODELS[key];
  return GENERATOR_MODELS[skill.generator] || [];
};

let cached = null;
export function buildGraph() {
  if (cached) return cached;
  const nodes = new Map();
  for (const skill of ALL_SKILLS) {
    const key = skillKey(skill);
    nodes.set(key, {
      key,
      id: skill.id,
      grade: skill.grade,
      title: skill.title,
      standard: skill.standard,
      strand: skill.strand,
      domain: domainForStrand(skill.strand),
      generator: skill.generator,
      prerequisites: new Map(),
      unlocks: new Set(),
      models: modelsForSkill(skill),
      // Three difficulty levels exist in every generator: 0 picture-first, 1 grade level, 2 challenge.
      levels: [0, 1, 2],
    });
  }
  for (const skill of ALL_SKILLS)
    for (const pre of prerequisites(skill))
      nodes
        .get(skillKey(skill))
        .prerequisites.set(skillKey(pre), { source: "library" });
  for (const [to, from, reason] of CURATED_EDGES) {
    const node = nodes.get(to);
    if (node && nodes.has(from) && !node.prerequisites.has(from))
      node.prerequisites.set(from, { source: "curated", reason });
  }
  for (const node of nodes.values())
    for (const pre of node.prerequisites.keys())
      nodes.get(pre).unlocks.add(node.key);
  cached = { nodes, order: topologicalOrder(nodes) };
  return cached;
}

function topologicalOrder(nodes) {
  const out = [];
  const state = new Map();
  const visit = (key) => {
    if (state.get(key) === 2) return;
    if (state.get(key) === 1)
      throw new Error(`Prerequisite cycle through ${key}`);
    state.set(key, 1);
    for (const pre of nodes.get(key).prerequisites.keys()) visit(pre);
    state.set(key, 2);
    out.push(key);
  };
  [...nodes.keys()].sort().forEach(visit);
  return out;
}

export const skillNode = (key) => buildGraph().nodes.get(key) || null;
export const directPrerequisites = (key) => [
  ...(skillNode(key)?.prerequisites.keys() || []),
];

// Everything a skill transitively depends on, nearest first.
export function prerequisiteClosure(key) {
  const seen = new Set();
  const queue = [...directPrerequisites(key)];
  const out = [];
  while (queue.length) {
    const next = queue.shift();
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
    queue.push(...directPrerequisites(next));
  }
  return out;
}

export const dependentsOf = (key) => [...(skillNode(key)?.unlocks || [])];

// Structural checks the test suite and the content QA gate both run.
export function validateGraph() {
  const { nodes } = buildGraph();
  const problems = [];
  for (const node of nodes.values()) {
    for (const [pre, info] of node.prerequisites) {
      const p = nodes.get(pre);
      if (!p) problems.push(`${node.key} lists missing prerequisite ${pre}`);
      else if (p.grade > node.grade)
        problems.push(
          `${node.key} (grade ${node.grade}) requires a later-grade skill ${pre}`,
        );
      if (pre === node.key) problems.push(`${node.key} requires itself`);
      if (info.source === "curated" && !(info.reason?.en && info.reason?.es))
        problems.push(
          `${node.key} <- ${pre}: curated edge needs a bilingual reason`,
        );
    }
    if (!node.standard) problems.push(`${node.key} has no standard`);
  }
  // A prerequisite must not be implied by a longer chain through another listed prerequisite (no redundant edges).
  for (const node of nodes.values())
    for (const [pre, info] of node.prerequisites)
      for (const other of node.prerequisites.keys())
        if (info.source === "curated" && other !== pre && prerequisiteClosure(other).includes(pre))
          problems.push(
            `${node.key} <- ${pre} is redundant (already implied through ${other})`,
          );
  return problems;
}

// Diagnostic questions for a skill: real generated problems at the requested level, deterministic for a seed.
export function diagnosticItems(key, { level = 1, count = 3, seed = 1 } = {}) {
  const skill = ALL_SKILLS.find((s) => skillKey(s) === key);
  if (!skill) return [];
  const items = [];
  const seen = new Set();
  for (let i = 0; items.length < count && i < count * 20; i += 1) {
    const p = generateProblem(
      skill,
      seededRandom(seed * 7919 + i * 131 + skill.grade),
      level,
    );
    if (seen.has(p.question)) continue;
    seen.add(p.question);
    items.push(p);
  }
  return items;
}

export const skillsInGrade = (grade) =>
  [...buildGraph().nodes.values()].filter((n) => n.grade === Number(grade));

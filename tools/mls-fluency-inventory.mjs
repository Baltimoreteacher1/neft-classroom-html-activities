// Build the compact Studio launch index and the full source/Studio capability report.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { hasStretchRange } from "../access-practice-lab/src/mls/fluency-problems.js";
import { defaultGameFor, GAMES as STUDIO_GAMES } from "../access-practice-lab/src/mls/games.js";
import { MANIPS, manipFor } from "../access-practice-lab/src/mls/manips.js";
import { stopsFor } from "../math/fluency-lab/game-pool.js";
import { GAMES as SOURCE_GAMES } from "../math/fluency-lab/games.js";
import {
  skillIds as authoredVocabularyIds,
  languageProfile,
} from "../math/fluency-lab/language-terms.js";
import { createLesson } from "../math/fluency-lab/lesson-content.js";
import {
  ALL_SKILLS,
  GENERATOR_PARTS,
  generateProblem,
  opsOf,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";
import { isWordy, questionEs } from "../math/fluency-lab/question-es.js";
import { helpLadder, teach } from "../math/fluency-lab/shell/content.js";
import { skillPath } from "../math/fluency-lab/shell/routes.js";
import { topicOf } from "../math/fluency-lab/skill-path.js";
import { framesOf, hasBuild, lessonFor } from "../math/fluency-lab/studio/engines.js";
import { prerequisites } from "../math/fluency-lab/tutor-engine.js";

const registry = JSON.parse(
  readFileSync(
    new URL("../access-practice-lab/content/mls/inventory.json", import.meta.url),
    "utf8",
  ),
);
const SAMPLE_SIZE = 36;
const SOURCE_GRADES = [...new Set(ALL_SKILLS.map((skill) => skill.grade))];

// Keyed by the destination registry id. Each entry names the overlap and any mathematical
// bound the unmodified source activity places on the choice. A skill can appear on several
// desks when it practises an objective independently on each desk.
const links = {
  "g1.relationships": [
    [
      "count-patterns",
      "Continue forward from a number using steps of 1 or 10.",
      "Also uses forward steps of 2 or 5, without backward counting.",
    ],
  ],
  "g1.addsub": [
    ["add-10", "Add within 10 as a building block for operations within 20."],
    ["subtract-10", "Subtract within 10 as a building block for operations within 20."],
    ["add-20", "Add facts within 20."],
    ["subtract-20", "Subtract facts within 20.", "The source uses a first operand at most 10."],
  ],
  "g1.equality": [
    ["missing-addend", "Find the unknown addend in a true equation.", "Uses one unknown position."],
  ],
  "g1.measure": [
    [
      "measure-length",
      "Count intervals of equal size to find a length.",
      "Uses a centimeter ruler and can include a nonzero start.",
    ],
  ],
  "g1.time": [
    [
      "time",
      "Use the hour and half-hour markings to calculate a later time.",
      "Adds 30 or 60 minutes rather than asking for direct clock reading alone.",
    ],
  ],
  "g1.strategies": [
    ["make-10", "Find the amount that makes ten.", "Practises the make-ten component only."],
  ],
  "g2.placevalue": [
    [
      "place-1000",
      "Identify ones, tens and hundreds digits in a three-digit number.",
      "Does not itself require expanded-form writing.",
    ],
  ],
  "g2.addsub": [
    ["facts-20", "Review addition facts as building blocks for addition within 100."],
    [
      "sub-facts-20",
      "Review basic subtraction facts as building blocks for subtraction within 100.",
    ],
    ["add-100", "Add tens and ones within 100."],
    ["subtract-100", "Subtract tens and ones within 100."],
  ],
  "g2.compare": [
    [
      "compare-1000",
      "Compare two three-digit numbers using comparison signs.",
      "Works with pairs rather than ordering a list.",
    ],
  ],
  "g2.groups": [
    ["even-odd", "Decide whether the total can be paired evenly."],
    [
      "arrays",
      "Reason about the total and dimensions of a rectangular array.",
      "Includes missing dimensions, a step beyond finding a total.",
    ],
  ],
  "g2.time": [
    [
      "time-five",
      "Read and use times in five-minute intervals.",
      "Some items ask for elapsed minutes.",
    ],
  ],
  "g2.money": [
    [
      "coins",
      "Use the value of U.S. coins to total a mixed collection.",
      "Totals cents from denominations given.",
    ],
  ],
  "g2.graphs": [
    [
      "interpret-data",
      "Read category frequencies to compare and total survey results.",
      "A frequency list can replace the Studio's graph.",
    ],
  ],
  "g3.muldiv": [
    ["mul-0-5", "Find totals for multiplication facts with factors 0 through 5."],
    ["mul-6-9", "Find totals for multiplication facts with factors 6 through 9."],
    ["division-facts", "Find the missing part using exact division facts."],
  ],
  "g3.numberlines": [
    ["fraction-line", "Place or name fractions on a number line partitioned into equal parts."],
    [
      "fraction-equivalence",
      "Find missing numerators in equivalent fractions.",
      "The prompt can be symbolic and does not require identifying a point.",
    ],
  ],
  "g3.areaperim": [
    ["area", "Find the area of a rectangle."],
    ["perimeter", "Find the perimeter of a rectangle."],
  ],
  "g3.measdata": [
    ["elapsed-time", "Use hours and minutes to find the end of an elapsed interval."],
  ],
  "g3.strategies": [
    [
      "mul-10-12",
      "Multiply a one-digit number by a multiple of ten.",
      "The stable source id reflects the older focus. The current generator uses multiples of ten.",
    ],
  ],
  "g3.relationships": [
    [
      "division-facts",
      "Use the inverse multiplication fact to verify a division fact.",
      "Practises a quotient rather than constructing all equations in a family.",
    ],
  ],
  "g4.multidigit": [
    ["add-large", "Add multi-digit whole numbers."],
    ["subtract-large", "Subtract multi-digit whole numbers."],
    ["multiply-1digit", "Multiply a three-digit number by a one-digit number."],
    ["multiply-2digit", "Multiply two two-digit numbers."],
    [
      "division",
      "Find a whole-number quotient.",
      "Some items give a remainder without asking for the remainder itself.",
    ],
  ],
  "g4.factors": [["factors", "Reason about factors, multiples and prime or composite numbers."]],
  "g4.fracequiv": [
    ["fraction-equiv", "Generate equivalent fractions with a missing numerator."],
    ["fraction-compare", "Compare fractions using comparison signs."],
  ],
  "g4.fracops": [
    [
      "mixed-numbers",
      "Rename between mixed numbers and improper fractions.",
      "Practises representation rather than fraction arithmetic.",
    ],
  ],
  "g4.conversions": [
    [
      "unit-conversion",
      "Convert larger units to smaller units in one measurement system.",
      "The source uses metric length, volume and mass, plus hours and minutes.",
    ],
  ],
  "g4.angles": [
    [
      "angle-measure",
      "Reason about parts and sums of angle measures.",
      "The task does not require a physical protractor.",
    ],
  ],
  "g4.data": [
    [
      "line-plots",
      "Use a fractional scale to reason about a line plot.",
      "Categories and frequencies may be given in text.",
    ],
  ],
  "g5.decimals": [
    ["decimal-place", "Identify place values through thousandths."],
    ["decimal-add", "Add decimals by aligning places.", "Generated addends are to hundredths."],
    [
      "decimal-sub",
      "Subtract decimals by aligning places.",
      "Generated operands are to hundredths.",
    ],
  ],
  "g5.fracops": [
    ["fraction-add", "Add and subtract fractions, including unlike denominators."],
    ["fraction-mul", "Multiply fractions to find a fractional product."],
    ["fraction-of", "Find a fractional part of a whole number."],
    [
      "unit-fraction-division",
      "Divide a whole number by a unit fraction or a unit fraction by a whole number.",
    ],
  ],
  "g5.expressions": [
    ["order-ops", "Evaluate numerical expressions with parentheses and the order of operations."],
  ],
  "g5.volume": [["volume", "Find the volume of one rectangular prism using whole-number edges."]],
  "g5.coordinate": [
    [
      "coordinate-plane",
      "Read and reason about ordered pairs on the first-quadrant coordinate plane.",
    ],
  ],
  "g6.ratios": [
    [
      "ratios",
      "Scale both terms to generate an equivalent part-to-part ratio.",
      "Source items ask for the missing term.",
    ],
  ],
  "g6.unitrates": [
    [
      "unit-rates",
      "Find a per-one rate and convert units using a rate.",
      "The active source skill mixes unit-rate and unit-conversion questions.",
    ],
  ],
  "g6.percents": [
    ["percent", "Find a percent of a known whole."],
    ["percent-whole", "Find the unknown whole given a percent and the amount it represents."],
  ],
  "g6.fracdec": [
    ["divide-fractions", "Divide fractions by fractions."],
    [
      "decimal-ops",
      "Divide decimals and use multiplication as the inverse operation.",
      "The active source also generates direct decimal multiplication.",
    ],
  ],
  "g6.rational": [
    [
      "integers",
      "Find absolute values and reason about coordinates.",
      "The active source mixes absolute value and coordinate-plane tasks.",
    ],
    [
      "order-rational",
      "Order signed integers, fractions and mixed numbers.",
      "Text ordering complements the native number line.",
    ],
  ],
  "g6.expressions": [
    [
      "evaluate",
      "Evaluate expressions using a given variable value or the order of operations.",
      "The active source mixes evaluation and order-of-operations questions.",
    ],
    [
      "equivalent-expressions",
      "Use distribution and like terms to write an equivalent expression.",
    ],
  ],
  "g6.equations": [
    [
      "one-step",
      "Solve one-step equations by undoing an operation.",
      "Includes division and subtraction forms as well as multiplication and addition.",
    ],
  ],
  "g6.inequalities": [
    [
      "write-inequalities",
      "Express a verbal constraint with an inequality.",
      "The checker accepts a symbolic inequality. Writing and graphing are distinct modes in the Studio.",
    ],
  ],
  "g6.geometry": [
    ["triangle-area", "Use base and height to find area, including triangles."],
    ["surface-area-nets", "Use rectangular faces of a prism's net to find surface area."],
    ["volume-fractional", "Find rectangular-prism volume with fractional edge lengths."],
  ],
  "g6.statquestions": [
    [
      "data-displays",
      "Read frequencies and compare values in a distribution.",
      "Includes displays beyond dot plots and does not identify what makes a question statistical.",
    ],
  ],
  "g6.variability": [
    [
      "center-spread",
      "Calculate mean, median and measures of spread for a given distribution.",
      "Includes IQR in addition to the Studio's supporting measures.",
    ],
  ],
  "g7.proportional": [
    [
      "unit-rate",
      "Calculate the unit rate that is the constant for a proportional relationship.",
      "Computes one rate from one pair.",
    ],
    ["proportions", "Find a missing value in equivalent ratios."],
  ],
  "g7.percentapps": [
    ["percent-change", "Calculate new amounts after a percent increase, decrease or discount."],
  ],
  "g7.rationalops": [
    ["integer-add", "Add or subtract signed integers."],
    ["integer-mul", "Multiply or divide signed integers."],
    ["fraction-ops", "Operate with signed fractions."],
  ],
  "g7.expreq": [
    ["equations", "Use inverse operations to solve a two-step equation."],
    ["like-terms", "Combine like terms to form an equivalent expression."],
  ],
  "g7.inequalities": [
    [
      "inequalities",
      "Test whether a proposed value satisfies an inequality.",
      "Verifies a candidate rather than solving or graphing the full solution set.",
    ],
  ],
  "g7.scale": [["scale-drawing", "Calculate a drawing or actual length using a given scale."]],
  "g7.geometry": [
    ["circle-area", "Use the radius to find the area as a multiple of pi."],
    ["circumference", "Use the radius or diameter to find circumference."],
    ["angle-facts", "Use relationships in lines and triangles to determine missing angles."],
  ],
  "g7.sampling": [["sampling", "Make a population prediction from a sample proportion."]],
  "g8.lineareq": [
    [
      "linear-equations",
      "Use inverse operations to solve a linear equation in one variable.",
      "Does not cover all variable-on-both-sides and solution-count cases.",
    ],
  ],
  "g8.systems": [
    [
      "systems",
      "Solve two linear equations by using them together.",
      "Some items request one coordinate rather than the full solution pair.",
    ],
  ],
  "g8.functions": [
    ["functions", "Evaluate a linear function for an input."],
    ["compare-functions", "Compare rates or intercepts of functions in different forms."],
  ],
  "g8.slope": [
    ["slope", "Find the slope through two points."],
    [
      "compare-functions",
      "Compare rates of change in different representations.",
      "Some items compare initial values as well.",
    ],
  ],
  "g8.exponents": [
    [
      "exponents",
      "Evaluate a whole-number base raised to an integer power.",
      "Does not by itself exercise exponent equivalence rules.",
    ],
    ["powers-ten", "Convert between a power-of-ten expression and its value."],
    ["scientific-ops", "Compute with numbers in scientific notation."],
  ],
  "g8.irrational": [
    [
      "square-roots",
      "Find roots of perfect squares.",
      "Does not estimate an irrational root or assess cube roots.",
    ],
  ],
  "g8.transformations": [
    ["transformations", "Reflect a coordinate point across an axis."],
    ["transformations-move", "Find the image of a point after translation, rotation or dilation."],
  ],
  "g8.congruence": [
    [
      "angle-relations",
      "Use line, triangle and transversal angle relationships.",
      "Practises the angle part of the objective without deciding congruence or similarity.",
    ],
  ],
  "g8.pythagorean": [["pythagorean", "Use the Pythagorean relationship to find a missing side."]],
  "g8.scatter": [
    [
      "association",
      "Identify positive, negative or no bivariate association.",
      "Uses one pattern rather than fitting a line or reading a two-way table.",
    ],
  ],
};

const catalogOnly = {
  "1:tens-ones":
    "The Grade 1 source prompts include numbers through 120, beyond the Studio's two-digit place-value objective.",
  "1:compare-100":
    "The source includes one-digit comparison, while the nearest Studio skill focuses on two-digit reasoning.",
  "1:shapes-2d3d":
    "The source combines flat shapes and solid shapes. The closest Studio objective covers flat shapes and composition.",
  "1:equal-shares":
    "The source reasons about the size of equal shares. The Grade 1 Studio has no partitioning objective.",
  "2:skip-count": "The Studio does not have a Grade 2 skip-counting desk.",
  "2:add-1000": "Addition above 100 exceeds the nearest Grade 2 Studio computation objective.",
  "2:doubles-near": "The nearest doubles and near-doubles strategy desk is in Grade 1.",
  "2:mental-tens":
    "The nearest Studio skill targets representing place value. The source asks for mental addition and subtraction by 10 and 100.",
  "3:add-sub-1000":
    "The Grade 3 Studio computation desk is centered on multiplication and division. Its story desk requires contextual equation writing.",
  "3:round": "The Studio does not have a Grade 3 rounding desk.",
  "3:fraction-compare":
    "The source compares both unlike numerators and unlike denominators. The Grade 3 Studio emphasizes same-numerator or same-denominator comparison.",
  "3:scaled-graphs":
    "The Grade 3 desk with data in its title actually teaches elapsed time. Its authored objectives do not include scaled graphs.",
  "4:place-million": "The Grade 4 Studio has no standalone place-value objective.",
  "4:round-large":
    "The Grade 4 Studio uses estimation in multistep problems, while this source skill rounds a given number directly.",
  "4:mul-11-12":
    "The Grade 4 Studio's multidigit skill teaches multidigit algorithms. This source skill is a multiplication-fact set.",
  "5:multiply-whole":
    "The Grade 5 Studio's multiplication objective is scaling with fractions. The source asks for whole-number products.",
  "5:divide-whole": "The Grade 5 Studio does not have a whole-number long-division desk.",
  "5:decimal-mul":
    "The Grade 5 Studio's decimal objective explicitly covers adding and subtracting. This source skill multiplies decimals.",
  "6:gcf": "The nearest Studio factors-and-multiples skill lives in Grade 4.",
  "6:lcm": "The nearest Studio factors-and-multiples skill lives in Grade 4.",
  "6:multi-digit-division":
    "The Grade 6 Studio's division skill works with fractions and decimals. This source set is whole-number long division.",
  "7:probability":
    "The unsplit source generator mixes probability with measures of center. The Studio probability objective does not include measures of center.",
  "8:volume-round":
    "Grade 8 Studio lacks a volume objective. Its closest geometry desk covers transformations and similarity.",
};

const sourceKey = ({ grade, id }) => `${grade}:${id}`;
const sourceByKey = new Map(ALL_SKILLS.map((skill) => [sourceKey(skill), skill]));
const destinationById = new Map(registry.skills.map((skill) => [skill.id, skill]));
assert.equal(sourceByKey.size, ALL_SKILLS.length, "Duplicate source grade and id");
const destinations = new Map();
for (const [destId, entries] of Object.entries(links)) {
  const dest = destinationById.get(destId);
  assert.ok(dest, `Unknown Studio skill: ${destId}`);
  assert.equal(
    new Set(entries.map(([id]) => id)).size,
    entries.length,
    `Duplicate source in ${destId}`,
  );
  for (const [id] of entries) {
    const key = `${dest.grade}:${id}`;
    assert.ok(sourceByKey.has(key), `Unknown source for ${destId}: ${key}`);
    assert.ok(!Object.hasOwn(catalogOnly, key), `Conflicting mapping status for ${key}`);
    const list = destinations.get(key) || [];
    list.push(destId);
    destinations.set(key, list);
  }
}
for (const key of Object.keys(catalogOnly))
  assert.ok(sourceByKey.has(key), `Unknown supplemental source: ${key}`);

const authoredVocabulary = new Set(authoredVocabularyIds());
// stopsFor draws sample boards through Math.random even though its initial card-share check is seeded.
const cardStops = new Map();
const originalRandom = Math.random;
try {
  for (const grade of SOURCE_GRADES) {
    Math.random = seededRandom(5119 + grade);
    cardStops.set(grade, new Set(stopsFor(grade).map(({ id }) => id)));
  }
} finally {
  Math.random = originalRandom;
}
const sourceRows = ALL_SKILLS.map((skill) => {
  const key = sourceKey(skill);
  const studioIds = destinations.get(key) || [];
  const reason = studioIds.length
    ? null
    : skill.grade === 0
      ? "Kindergarten remains supplemental. The Studio teacher grade menu covers Grades 1–8."
      : catalogOnly[key];
  assert.ok(studioIds.length || reason, `Explain why ${key} is supplemental`);
  const topic = topicOf(skill);
  assert.ok(topic, `No active Fluency topic for ${key}`);
  const examples = {
    generated: 0,
    keyed: 0,
    modeled: 0,
    interactiveModel: 0,
    spanishTranslation: 0,
    symbolic: 0,
    hint: 0,
    safeHint: 0,
    workedSteps: 0,
    responseKinds: {},
    inlineModels: {},
    exampleEngines: {},
  };
  for (let n = 1; n <= SAMPLE_SIZE; n += 1) {
    const item = generateProblem(skill, seededRandom(n * 191));
    examples.generated += 1;
    if (item.answers.some((answer) => validateAnswer(answer, item))) examples.keyed += 1;
    const lesson = lessonFor(item);
    if (lesson?.modeled && framesOf(lesson).some((frame) => Boolean(frame.svg))) {
      examples.modeled += 1;
      const engine = lesson.engine.id;
      examples.exampleEngines[engine] = (examples.exampleEngines[engine] || 0) + 1;
    }
    if (item.model?.type) {
      const model = item.model.type;
      examples.inlineModels[model] = (examples.inlineModels[model] || 0) + 1;
    }
    if (lesson?.modeled && hasBuild(lesson)) examples.interactiveModel += 1;
    if (questionEs(item)) examples.spanishTranslation += 1;
    else if (!isWordy(item.question)) examples.symbolic += 1;
    if (item.hint) examples.hint += 1;
    if (helpLadder(skill, item).some((entry) => entry.kind === "hint")) examples.safeHint += 1;
    if (item.steps.length > 1) examples.workedSteps += 1;
    const kind = item.response?.type || item.kind;
    examples.responseKinds[kind] = (examples.responseKinds[kind] || 0) + 1;
  }
  assert.equal(examples.keyed, SAMPLE_SIZE, `No accepted source key for one of the ${key} cases`);
  const activeLesson = teach(skill);
  const guidedSteps = Array.from(
    { length: 5 },
    (_, n) => createLesson(skill, n)?.steps?.length ?? 0,
  );
  const vocabulary = languageProfile(skill)
    .terms.filter(Boolean)
    .map((term) => term.id);
  const eligibleCardStop = cardStops.get(skill.grade).has(`skill:${skill.id}`);
  const capabilities = {
    practice: true,
    model: examples.modeled > 0,
    guided: examples.workedSteps > 0,
    spanish: examples.spanishTranslation > 0,
    vocabulary: vocabulary.length > 0,
    game: studioIds.length > 0,
    race: eligibleCardStop,
    stretch: hasStretchRange(skill),
  };
  return {
    key,
    id: skill.id,
    grade: skill.grade,
    title: skill.title,
    topic: topic.name,
    topicId: topic.id,
    sourcePath: skillPath(skill.grade, skill.id),
    standard: skill.standard || null,
    scope: activeLesson.concept.en,
    misconception: activeLesson.misconception.en || null,
    generator: skill.generator,
    generatorParts: GENERATOR_PARTS[skill.generator] || [skill.generator],
    operations: opsOf(skill.config).filter(Boolean),
    configuration: skill.config,
    prerequisites: prerequisites(skill).map(({ grade, id, title }) => ({ grade, id, title })),
    studioIds,
    catalogOnlyReason: reason,
    source: {
      ...examples,
      guidedSteps,
      shellLesson: {
        modeledExample: activeLesson.example.modeled,
        guidedSteps: activeLesson.guided.length,
        authoredGuided: activeLesson.authoredGuided,
        investigation: activeLesson.living
          ? "authored"
          : activeLesson.build
            ? "engine-build"
            : null,
        alternateRepresentation: Boolean(activeLesson.another),
      },
      vocabulary,
      vocabularyAuthored: authoredVocabulary.has(skill.id),
      eligibleCardStop,
    },
    capabilities,
  };
});
const sourceRowsByKey = new Map(sourceRows.map((row) => [row.key, row]));

const studioGrades = new Map(
  [...new Set(registry.skills.map((skill) => skill.grade))].map((grade) => {
    const path = new URL(
      `../access-practice-lab/content/mls/skills/g${grade}.json`,
      import.meta.url,
    );
    const data = JSON.parse(readFileSync(path, "utf8"));
    return [grade, new Map(data.skills.map((skill) => [skill.id, skill]))];
  }),
);
const destinationRows = registry.skills.map((skill) => {
  const entries = links[skill.id] || [];
  const gameSkill = { ...skill, familyId: skill.family };
  const nativeGame = defaultGameFor(gameSkill);
  const nativeManip = manipFor(gameSkill);
  assert.ok(MANIPS[nativeManip], `No native manipulative for ${skill.id}`);
  assert.ok(
    STUDIO_GAMES[nativeGame]?.eligible(gameSkill),
    `No eligible native game for ${skill.id}`,
  );
  const authored = studioGrades.get(skill.grade).get(skill.id);
  assert.ok(authored, `Missing Studio lesson: ${skill.id}`);
  return {
    id: skill.id,
    grade: skill.grade,
    title: skill.title,
    domain: skill.domain,
    scope: authored.objective,
    prerequisites: skill.prereq,
    nativeTools: { manipulative: nativeManip, game: nativeGame },
    fluency: entries.map(([id, rationale, limitation]) => {
      const source = sourceRowsByKey.get(`${skill.grade}:${id}`);
      return {
        key: source.key,
        id,
        rationale,
        limitation: limitation || null,
        available: source.capabilities,
      };
    }),
    studioOnlyReason: entries.length
      ? null
      : "No matching same-grade Fluency question family covers a distinct part of this authored Studio objective.",
  };
});
const counts = (grade) => {
  const sources = grade == null ? sourceRows : sourceRows.filter((row) => row.grade === grade);
  const targets =
    grade == null ? destinationRows : destinationRows.filter((row) => row.grade === grade);
  const mapped = targets.filter((row) => row.fluency.length > 0);
  return {
    source: sources.length,
    destination: targets.length,
    sourceMatched: sources.filter((row) => row.studioIds.length > 0).length,
    catalogOnly: sources.filter((row) => row.studioIds.length === 0).length,
    destinationMatched: mapped.length,
    relationships: targets.reduce((sum, row) => sum + row.fluency.length, 0),
    generatedCases: sources.reduce((sum, row) => sum + row.source.generated, 0),
    bySourceCapability: Object.fromEntries(
      [
        ["checkedPractice", (row) => row.source.keyed === SAMPLE_SIZE],
        ["guidedLesson", (row) => row.source.guidedSteps.every((count) => count > 0)],
        ["workedSteps", (row) => row.capabilities.guided],
        ["modeledExample", (row) => row.capabilities.model],
        ["interactiveBuild", (row) => row.source.interactiveModel > 0],
        ["hint", (row) => row.source.hint > 0],
        ["unrevealedHint", (row) => row.source.safeHint > 0],
        [
          "authoredShellInvestigation",
          (row) => row.source.shellLesson.investigation === "authored",
        ],
        ["oneOrMoreSpanishTranslations", (row) => row.capabilities.spanish],
        ["vocabulary", (row) => row.capabilities.vocabulary],
        ["cardGameStop", (row) => row.source.eligibleCardStop],
      ].map(([id, has]) => [id, sources.filter(has).length]),
    ),
    byStudioCapability: {
      sourcePractice: sources.filter((row) => row.capabilities.practice).length,
      sourceGuidedExample: sources.filter((row) => row.capabilities.guided).length,
      sourceVisualExample: sources.filter((row) => row.capabilities.model).length,
      sampledNonRevealingHint: sources.filter((row) => row.source.safeHint > 0).length,
      sourceVocabulary: sources.filter((row) => row.capabilities.vocabulary).length,
      sampledSpanishQuestion: sources.filter((row) => row.capabilities.spanish).length,
      sourceMathStretch: sources.filter((row) => row.capabilities.stretch).length,
      sourceMathRace: sources.filter((row) => row.capabilities.race).length,
      sourceMathRaceAtMappedDesk: mapped.filter((row) =>
        row.fluency.some((ref) => sourceRowsByKey.get(ref.key).capabilities.race),
      ).length,
      localPracticeResumeWithDeviceStorage: sources.length,
      localSeparateExplanationWithDeviceStorage: sources.length,
      deviceReadAloud: sources.length,
      eligibleNativeGameAtMappedDesk: mapped.length,
      nativeManipulativeAtMappedDesk: mapped.length,
      printablePracticeAtMappedDesk: mapped.length,
      familyPracticeAtMappedDesk: mapped.length,
      saveLaunchAtMappedDesk: mapped.length,
      supplementalFoundationLinkAtMappedDesk: mapped.filter(
        (row) => sourceRowsByKey.get(row.fluency[0].key).prerequisites.length > 0,
      ).length,
    },
  };
};

const inventory = {
  schema: 1,
  sourceEntry: "math/fluency-lab/shell/app.js",
  destinationEntry: "access-practice-lab/src/views/math-literacy.js",
  sample: {
    casesPerSourceSkill: SAMPLE_SIZE,
    seedRule: "seededRandom(n * 191), n = 1 through 36",
    guidedLessonVariants: 5,
    evidence:
      "The generator called the active source functions. Counts describe these seeds and registry eligibility. A visible model or Spanish translation can vary by item.",
    studioCounts:
      "Source practice features are counted by source skill. Desk features are counted by destination skill. Wiring counts are distinct from browser test coverage.",
    cardStopSeedRule: "Source board sampling uses seededRandom(5119 + grade).",
  },
  totals: counts(),
  countsByGrade: Object.fromEntries(SOURCE_GRADES.map((grade) => [grade, counts(grade)])),
  sourceGames: SOURCE_GAMES.map((game) => ({
    id: game.id,
    title: game.name,
    grades: game.grades || SOURCE_GRADES,
    scope:
      "Grade eligibility from the active Game Room. Skill-specific stops are counted in the skill records.",
  })),
  capabilityDecisions: {
    generators:
      "Same-origin source question bank and checker. Standard practice retains the original generator and grade bounds. Optional warm-up and challenge settings use the destination adapter and existing generator options.",
    workedExamples:
      "Use distinct generated examples and source model frames when available. The shared steps cover cases whose generator yields no modeled example.",
    modelBuilders:
      "The guided example offers the source lesson's Build moves with reset where the source defines them. Source animation controls stay in the source app. Native Studio manipulatives remain available on mapped desks.",
    adaptivePractice:
      "Studio practice uses the source scaffold rules and local attempts. Source recommendation history, review schedules and diagnostics remain in their original flow.",
    games:
      "The native Math Race activity uses the source race rules for registered skill-specific card stops. Existing Studio games remain available by desk. The source Game Room, rewards and saved game state stay in their original flow.",
    wrongAnswer:
      "Studio practice can use source-specific feedback and hints. A revealed worked solution uses another item.",
    vocabulary:
      "Use source bilingual terms where relevant. Some source language profiles use the source's general fallback; item translations may be absent or unnecessary for symbolic prompts.",
    languageEvidence:
      "Studio explanations remain separate from mathematical results. The original language journal, writing folder, microphone and proficiency-neutral dashboards stay in their existing flows.",
    teachingPrintAndFamily:
      "A seeded practice set fits the existing Studio resource builder, with a separate answer key. The family page links to a short related set. Source snapshots, receipts, certificates, paper games and family expedition depend on their own progress or game flows.",
    accessibility:
      "Source supports device speech, reduced motion, comfort font and early-grade audio-first modes. Studio uses its own interface and focus handling. The source speech queue, reward motion and comfort preference do not cross hosts.",
    offlineAndBackup:
      "The source's offline bundle and source profile backups remain within their original contract. The Studio uses its own delivery and browser data. Source profiles, journal entries and game rewards are excluded from transfer because their structures and evidence rules differ.",
  },
  sourceSkills: sourceRows,
  destinationSkills: destinationRows,
};

const runtimeRows = sourceRows.map(
  ({ grade, id, title, topic, generator, prerequisites: foundations, capabilities }) => ({
    grade,
    id,
    title,
    topic,
    generator,
    prerequisites: foundations,
    capabilities,
  }),
);
const render = (value) => JSON.stringify(value, null, 2);
const compactRows = runtimeRows.map((row) => `  ${JSON.stringify(row)},`).join("\n");
const compactLinks = destinationRows
  .filter((row) => row.fluency.length)
  .map(
    ({ id, fluency }) =>
      `  ${JSON.stringify(id)}: ${JSON.stringify(fluency.map(({ key }) => key))},`,
  )
  .join("\n");
const runtime = `// Generated by tools/mls-fluency-inventory.mjs from the active registries.
// biome-ignore format: Keep each generated skill on one line.
const SOURCE = [
${compactRows}
];
// biome-ignore format: Keep each generated Studio skill on one line.
const FOR_STUDIO = {
${compactLinks}
};

const byKey = new Map(SOURCE.map((item) => [\`\${item.grade}:\${item.id}\`, item]));
const studiosByKey = new Map();
for (const [studioId, keys] of Object.entries(FOR_STUDIO)) {
  for (const key of keys) {
    const studios = studiosByKey.get(key) || [];
    studios.push(studioId);
    studiosByKey.set(key, studios);
  }
}

export const getFluencyMapping = (grade, id) => Number.isInteger(grade)
  ? byKey.get(\`\${grade}:\${id}\`) || null
  : null;
export const fluencyForSkill = (studioId) => Object.hasOwn(FOR_STUDIO, studioId)
  ? FOR_STUDIO[studioId].map((key) => byKey.get(key))
  : [];
export const studioSkillsForFluency = (grade, id) => [...(studiosByKey.get(\`\${grade}:\${id}\`) || [])];
export const fluencyForGrade = (grade, { unmatchedOnly = false } = {}) => SOURCE.filter((item) =>
  item.grade === grade && (!unmatchedOnly || !studioSkillsForFluency(grade, item.id).length));
`;
const files = [
  [new URL("../access-practice-lab/src/mls/fluency-map.js", import.meta.url), runtime],
  [
    new URL("../docs/math-literacy/fluency-inventory.json", import.meta.url),
    `${render(inventory)}\n`,
  ],
];
for (const [file, content] of files) {
  if (process.argv.includes("--check"))
    assert.equal(readFileSync(file, "utf8"), content, `Rebuild ${file.pathname}`);
  else writeFileSync(file, content);
}
console.log(
  `Fluency inventory: ${sourceRows.length} source skills, ${destinations.size} mapped to ${Object.keys(links).length} Studio skills, ${sourceRows.length * SAMPLE_SIZE} source checks.`,
);

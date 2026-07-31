#!/usr/bin/env node
/* =============================================================================
 * validate-forge — self-test for the Forge quality gate
 * -----------------------------------------------------------------------------
 * The Forge (functions/api/forge.js) generates lesson configs with an LLM and
 * refuses to store one that fails `validateForgeConfig`. That gate is the only
 * thing standing between a model's bad day and a real Grade 6 classroom, so it
 * needs its own test: this script proves the gate ACCEPTS a hand-authored good
 * config and REJECTS a set of configs that are each broken in exactly one way.
 *
 * Run:  node tools/validate-forge.mjs      (no dependencies, exit 1 on failure)
 * ========================================================================== */

import { validateForgeConfig } from "../functions/api/forge.js";

const STANDARD = "6.AT.2";
const TAG = "rate-not-per-one";
const OPTS = { standard: STANDARD, tag: TAG };

const clone = (o) => JSON.parse(JSON.stringify(o));

/* ── The good fixture: a real unit-rate re-teach lesson ────────────────────── */

const item = (o) => ({ type: "multiple-choice", ...o });

const GOOD = {
  lessonId: "forge-unit-rate-per-one",
  standard: STANDARD,
  title: "Unit Rate: How Much for Just One?",
  theme: "corner-store",
  themeEmoji: "🏪",
  contentObjective: "I can find a unit rate by dividing, and say what it means for exactly one item.",
  languageObjective: "I can explain my answer using the words unit rate, per, and divide.",
  noticeAndWonder: {
    context:
      "Two shelves at the corner store hold the same brand of juice. One shelf has 4-bottle packs marked $6.00. The other shelf has single bottles marked $1.75 each. A shopper is standing there holding both.",
    noticeStarters: [
      "I notice the two shelves show different numbers of bottles.",
      "I notice one tag shows a price for a whole pack.",
      "I notice the shopper is looking back and forth.",
    ],
    wonderStarters: [
      "I wonder which shelf gives more juice for the money.",
      "I wonder how the shopper could compare the two tags fairly.",
      "I wonder what the pack costs for just one bottle.",
    ],
  },
  vocabulary: [
    {
      term: "unit rate",
      termEs: "tasa unitaria",
      definition: "How much of one quantity there is for exactly ONE of the other quantity.",
      definitionEs: "Cuánto hay de una cantidad por exactamente UNA de la otra cantidad.",
    },
    {
      term: "unit price",
      termEs: "precio unitario",
      definition: "The cost of exactly one item, found by dividing the total cost by how many items.",
      definitionEs:
        "El costo de exactamente un artículo, que se halla dividiendo el costo total entre la cantidad de artículos.",
    },
    {
      term: "per",
      termEs: "por",
      definition: "A word that means 'for each one', like 55 miles per hour.",
      definitionEs: "Una palabra que significa 'por cada uno', como 55 millas por hora.",
    },
  ],
  launch: {
    narrative:
      "You are the price checker at Ruiz Corner Store. Shoppers keep asking which pack is the better deal. Two tags almost never show the same number of items, so you cannot just compare the two prices. Your job today is to rewrite every tag so it answers one question: how much for just one?",
    conceptIntro: {
      heading: "How much for just ONE?",
      intro:
        "A rate compares two amounts with different units, like dollars and bottles. A unit rate rewrites that comparison so the second amount is exactly 1.",
      keyIdea: "To rewrite a rate for one, divide the first amount by the second amount.",
      iDo: {
        title: "Watch me",
        lines: [
          "A 4-bottle pack costs $6.00. I am comparing dollars to bottles.",
          "I want the cost for 1 bottle, so I share $6.00 equally among 4 bottles.",
          "$6.00 divided by 4 bottles is $1.50 for each bottle.",
          "I say it with the word per: $1.50 per bottle.",
        ],
      },
      weDo: {
        title: "Let's try together",
        lines: [
          "A 5-pack of granola bars costs $4.00. What two amounts are we comparing?",
          "We share $4.00 equally among 5 bars.",
          "$4.00 divided by 5 bars is $0.80, so we say $0.80 per bar.",
        ],
      },
      youDo: {
        title: "Now it's your turn",
        lines: [
          "Next you will sort store tags into ones that already tell you the cost for one and ones that do not.",
          "Ask yourself every time: does this tag answer 'how much for ONE?'",
        ],
      },
    },
  },
  explore: {
    type: "drag-sort",
    instructions:
      "Sort the six store tags. Put a tag on the left if it already tells you the cost for exactly one item. Put it on the right if it only tells you a total.",
    categories: [
      { id: "per-one", label: "Already tells the cost for ONE" },
      { id: "total-only", label: "Only tells a total" },
    ],
    items: [
      { text: "$0.89 per apple", category: "per-one" },
      { text: "3 avocados for $4.50", category: "total-only" },
      { text: "$2.25 for each pound of grapes", category: "per-one" },
      { text: "12 rolls for $7.20", category: "total-only" },
      { text: "$1.10 per bottle", category: "per-one" },
      { text: "6 muffins for $5.40", category: "total-only" },
    ],
    discourse: {
      prompt: "How can you tell from the words on a tag whether it already gives the cost for one?",
      sentenceFrame: "This tag ___ tell the cost for one because it says ___.",
      keywords: ["per", "each", "for", "divide", "total"],
    },
  },
  practice: {
    optional: [
      item({
        stem: "A 4-pack of sports drinks costs $6.00 at Ruiz Corner Store. What is the price for one bottle?",
        stemEs:
          "Un paquete de 4 bebidas deportivas cuesta $6.00 en la tienda Ruiz. ¿Cuál es el precio de una botella?",
        choices: ["$1.50 per bottle", "$6.00 per bottle", "$24.00 per bottle", "$0.67 per bottle"],
        correctIndex: 0,
        explanation: "Share $6.00 equally among 4 bottles: 6.00 divided by 4 gives the cost of one bottle.",
        explanationEs:
          "Reparte $6.00 en partes iguales entre 4 botellas: 6.00 dividido entre 4 da el costo de una botella.",
        choiceFeedback: [
          "",
          "That is the cost of the whole 4-pack, not the cost of a single bottle on its own.",
          "You multiplied the total by the number of bottles, which makes the pack cost even more.",
          "You divided the number of bottles by the dollars, so your units came out backwards.",
        ],
        hints: [
          "A price for one always answers the same question: how much for exactly ONE bottle?",
          "You know a total cost and how many bottles share it. Sharing a total equally is division.",
          "Divide $6.00 by 4 bottles, then say your result out loud with the words 'per bottle'.",
        ],
        hintsEs: [
          "Un precio por uno siempre responde la misma pregunta: ¿cuánto cuesta exactamente UNA botella?",
          "Conoces un costo total y cuántas botellas lo comparten. Repartir un total en partes iguales es dividir.",
          "Divide $6.00 entre 4 botellas y luego di tu resultado en voz alta con las palabras 'por botella'.",
        ],
        misconceptionTag: TAG,
      }),
      item({
        stem: "Maya rides her bike 12 miles in 3 hours at a steady speed. What is her speed?",
        stemEs:
          "Maya recorre 12 millas en 3 horas en bicicleta a velocidad constante. ¿Cuál es su velocidad?",
        choices: ["4 miles per hour", "12 miles per hour", "36 miles per hour", "3 miles per hour"],
        correctIndex: 0,
        explanation: "Speed compares miles to ONE hour, so divide 12 miles by 3 hours.",
        explanationEs: "La velocidad compara millas con UNA hora, así que divide 12 millas entre 3 horas.",
        choiceFeedback: [
          "",
          "That is the whole distance for the whole ride, not the distance covered in a single hour.",
          "You multiplied the miles by the hours, so your number grew instead of being shared out.",
          "You reported the number of hours instead of the miles she covers in one of them.",
        ],
        hints: [
          "Speed always tells you how far someone goes in exactly ONE hour.",
          "You have a total distance and the hours that share it, so this is a division problem.",
          "Divide 12 miles by 3 hours, then say your result with the words 'miles per hour'.",
        ],
        hintsEs: [
          "La velocidad siempre dice qué distancia recorre alguien en exactamente UNA hora.",
          "Tienes una distancia total y las horas que la comparten, así que esto es una división.",
          "Divide 12 millas entre 3 horas y luego di tu resultado con las palabras 'millas por hora'.",
        ],
        misconceptionTag: TAG,
      }),
      item({
        stem: "A store sells 5 notebooks for $10.00. What is the cost of one notebook?",
        stemEs: "Una tienda vende 5 cuadernos por $10.00. ¿Cuál es el costo de un cuaderno?",
        choices: ["$2.00", "$0.50", "$50.00", "$5.00"],
        correctIndex: 0,
        explanation: "Divide the dollars by the notebooks: 10.00 divided by 5 notebooks.",
        explanationEs: "Divide los dólares entre los cuadernos: 10.00 dividido entre 5 cuadernos.",
        choiceFeedback: [
          "",
          "You divided the notebooks by the dollars, which tells you notebooks per dollar instead.",
          "You multiplied the two numbers, so the result is far bigger than the whole purchase.",
          "You reported the number of notebooks in the pack, not what one of them costs.",
        ],
        hints: [
          "Read the question again and underline what one thing you are being asked to price.",
          "Cost for one item means the dollars get shared out, so the dollars go first in the division.",
          "Set it up as 10.00 dollars divided by 5 notebooks and keep the units in that order.",
        ],
        hintsEs: [
          "Vuelve a leer la pregunta y subraya qué cosa te piden poner precio.",
          "El costo por artículo significa repartir los dólares, así que los dólares van primero en la división.",
          "Escríbelo como 10.00 dólares dividido entre 5 cuadernos y conserva las unidades en ese orden.",
        ],
        misconceptionTag: "op-reversed-division",
      }),
      item({
        stem: "Three pounds of apples cost $7.50. What is the price for one pound?",
        stemEs: "Tres libras de manzanas cuestan $7.50. ¿Cuál es el precio de una libra?",
        choices: ["$2.50 per pound", "$22.50 per pound", "$10.50 per pound", "$4.50 per pound"],
        correctIndex: 0,
        explanation: "Divide $7.50 by 3 pounds to find what a single pound costs.",
        explanationEs: "Divide $7.50 entre 3 libras para hallar cuánto cuesta una sola libra.",
        choiceFeedback: [
          "",
          "You multiplied the cost by the pounds, so the price grew instead of being shared out.",
          "You added the two numbers together, but pounds and dollars cannot be added.",
          "You subtracted the pounds from the dollars, which mixes two different kinds of units.",
        ],
        hints: [
          "One pound is the amount you are pricing, so picture the apples split into 3 equal piles.",
          "Splitting a total cost into equal piles is division, not multiplication.",
          "Divide 7.50 by 3 and label your result with the words 'per pound'.",
        ],
        hintsEs: [
          "Una libra es la cantidad que estás valorando, así que imagina las manzanas en 3 montones iguales.",
          "Repartir un costo total en montones iguales es dividir, no multiplicar.",
          "Divide 7.50 entre 3 y etiqueta tu resultado con las palabras 'por libra'.",
        ],
        misconceptionTag: "op-multiplied-instead-of-divided",
      }),
      item({
        stem: "Paper towels come two ways: 6 rolls for $4.20 or 10 rolls for $6.50. Which pack is the better buy?",
        stemEs:
          "Las toallas de papel vienen de dos formas: 6 rollos por $4.20 o 10 rollos por $6.50. ¿Cuál paquete conviene más?",
        choices: [
          "10 rolls for $6.50",
          "6 rolls for $4.20",
          "They cost the same for one roll",
          "There is not enough information",
        ],
        correctIndex: 0,
        explanation: "One roll costs $0.70 in the small pack and $0.65 in the large pack, so the large pack is cheaper for each roll.",
        explanationEs:
          "Un rollo cuesta $0.70 en el paquete pequeño y $0.65 en el grande, así que el grande sale más barato por rollo.",
        choiceFeedback: [
          "",
          "You compared the total prices, but the packs hold different numbers of rolls.",
          "You assumed the packs matched without dividing each total by its own number of rolls.",
          "Both tags give a total and a count, which is everything you need to price one roll.",
        ],
        hints: [
          "You cannot compare two totals fairly when the packs hold different numbers of rolls.",
          "Rewrite each tag so it tells you the cost of exactly one roll, then compare those.",
          "Divide 4.20 by 6, then divide 6.50 by 10, and compare the two results.",
        ],
        hintsEs: [
          "No puedes comparar dos totales de forma justa cuando los paquetes traen distinta cantidad de rollos.",
          "Reescribe cada etiqueta para que diga el costo de exactamente un rollo y luego compáralas.",
          "Divide 4.20 entre 6, luego divide 6.50 entre 10 y compara los dos resultados.",
        ],
      }),
      item({
        stem: "Devon types 250 words in 5 minutes. How many words does he type in one minute?",
        stemEs: "Devon escribe 250 palabras en 5 minutos. ¿Cuántas palabras escribe en un minuto?",
        choices: ["50 words", "250 words", "1250 words", "5 words"],
        correctIndex: 0,
        explanation: "Divide 250 words by 5 minutes to find how many words fit into a single minute.",
        explanationEs:
          "Divide 250 palabras entre 5 minutos para hallar cuántas palabras caben en un solo minuto.",
        choiceFeedback: [
          "",
          "That is everything he typed across all five minutes, not what fits into one of them.",
          "You multiplied the words by the minutes, so the total grew instead of being shared out.",
          "You reported the number of minutes instead of the words typed inside one minute.",
        ],
        hints: [
          "The question asks about one minute, so imagine his typing split into 5 equal chunks.",
          "Splitting a total into equal chunks is division, and the words are what get split.",
          "Divide 250 by 5 and label your result with the word 'words'.",
        ],
        hintsEs: [
          "La pregunta es sobre un minuto, así que imagina su escritura repartida en 5 partes iguales.",
          "Repartir un total en partes iguales es dividir, y las palabras son lo que se reparte.",
          "Divide 250 entre 5 y etiqueta tu resultado con la palabra 'palabras'.",
        ],
      }),
    ],
  },
  connect: {
    scenario:
      "The sixth-grade student council is buying snacks for field day. A warehouse club sells 24 granola bars for $14.40 and the corner store sells 6 granola bars for $3.90. The council has to defend its choice to the principal.",
    prompt: "This is like our store-tag work because ___ and ___",
    keywords: ["divide", "per", "compare", "cheaper", "one bar"],
    check: [
      {
        stem: "What does one granola bar cost at the warehouse club?",
        choices: ["$0.60", "$0.65", "$1.44", "$2.40"],
        answer: 0,
        explanation: "14.40 divided by 24 bars gives the cost of a single bar at the warehouse club.",
      },
      {
        stem: "Which place gives the council more bars for every dollar it spends?",
        choices: [
          "The warehouse club",
          "The corner store",
          "They are exactly equal",
          "It cannot be decided",
        ],
        answer: 0,
        explanation:
          "A bar costs $0.60 at the club and $0.65 at the corner store, so each dollar buys more bars at the club.",
      },
    ],
  },
  reflect: {
    exitTicket: {
      stem: "A 6-pack of yogurt costs $4.80. What is the cost of one cup of yogurt?",
      choices: ["$0.80", "$4.80", "$28.80", "$1.25"],
      correctIndex: 0,
      explanation: "Share $4.80 equally among 6 cups: 4.80 divided by 6 gives what one cup costs.",
      choiceFeedback: [
        "",
        "That is the price of the whole 6-pack, not the price of a single cup inside it.",
        "You multiplied the total by the number of cups, so the pack got more expensive.",
        "You divided the cups by the dollars, so your units ended up in the wrong order.",
      ],
      hints: [
        "The question is about one cup, so picture the 6-pack broken apart into single cups.",
        "A total cost shared equally among cups is a division, with the dollars going first.",
        "Divide 4.80 by 6 and write your result as a price in dollars.",
      ],
    },
  },
  timeEstimate: "~45 min",
};

/* ── Deliberately broken configs ───────────────────────────────────────────── */

function withVagueFeedback() {
  const c = clone(GOOD);
  // Long enough to clear the length rule, so this case isolates the vagueness rule.
  c.practice.optional[0].choiceFeedback[1] =
    "Try again — read the question one more time and think about what it is asking.";
  return c;
}

function withShortFeedback() {
  const c = clone(GOOD);
  c.practice.optional[2].choiceFeedback[3] = "Wrong units.";
  return c;
}

function withFeedbackOnCorrectChoice() {
  const c = clone(GOOD);
  c.practice.optional[1].choiceFeedback[1] = "";
  c.practice.optional[1].choiceFeedback[0] = "Exactly right, nice work on that division.";
  return c;
}

function withHintGivingTheAnswer() {
  const c = clone(GOOD);
  c.practice.optional[1].hints[2] = "Divide 12 by 3 to get 4 miles per hour, then write that down.";
  return c;
}

function withHintSayingTheAnswerIs() {
  const c = clone(GOOD);
  c.reflect.exitTicket.hints[1] = "Look at the six cups and remember the answer is a small amount.";
  return c;
}

function withFakeSpanish() {
  const c = clone(GOOD);
  c.practice.optional[3].stemEs = c.practice.optional[3].stem;
  return c;
}

function withFakeSpanishVocabulary() {
  const c = clone(GOOD);
  c.vocabulary[0].termEs = c.vocabulary[0].term;
  return c;
}

function withoutExitTicket() {
  const c = clone(GOOD);
  delete c.reflect.exitTicket;
  return c;
}

function withNoticeWonderLeakingVocab() {
  const c = clone(GOOD);
  c.noticeAndWonder.wonderStarters[0] = "I wonder what the unit price of each bottle really is.";
  return c;
}

function withUntaggedPractice() {
  const c = clone(GOOD);
  delete c.practice.optional[0].misconceptionTag;
  return c;
}

function withBadLessonId() {
  const c = clone(GOOD);
  c.lessonId = "unit-rate-per-one";
  return c;
}

function withWrongPracticeCount() {
  const c = clone(GOOD);
  c.practice.optional = c.practice.optional.slice(0, 4);
  return c;
}

function withOrphanDragSortItem() {
  const c = clone(GOOD);
  c.explore.items[1].category = "not-a-real-category";
  return c;
}

function withEsol() {
  const c = clone(GOOD);
  c.languageObjective = "I can explain my answer using the words unit rate, per, and divide (ESOL).";
  return c;
}

/* ── Runner ────────────────────────────────────────────────────────────────── */

const REJECT_CASES = [
  ["vague distractor feedback", withVagueFeedback, /vague/i],
  ["distractor feedback that is too short", withShortFeedback, /at least 25 characters/i],
  ["feedback written on the correct choice", withFeedbackOnCorrectChoice, /must be an empty string/i],
  ["hint containing the correct choice", withHintGivingTheAnswer, /hints\[2\] contains the answer/i],
  ["hint saying 'the answer is'", withHintSayingTheAnswerIs, /hints\[1\] contains the answer/i],
  ["Spanish stem copied from English", withFakeSpanish, /stemEs is identical to stem/i],
  ["Spanish vocabulary copied from English", withFakeSpanishVocabulary, /termEs is identical to term/i],
  ["missing exit ticket", withoutExitTicket, /reflect\.exitTicket is required/i],
  ["notice & wonder leaking a vocabulary term", withNoticeWonderLeakingVocab, /leaks the vocabulary term/i],
  ["too few items carrying the misconception tag", withUntaggedPractice, /misconceptionTag/i],
  ["lessonId not namespaced to the Forge", withBadLessonId, /lessonId must be a string starting/i],
  ["wrong number of practice items", withWrongPracticeCount, /exactly 6 items/i],
  ["drag-sort card pointing at no category", withOrphanDragSortItem, /is not one of explore\.categories/i],
  ['the word "ESOL" in generated content', withEsol, /ESOL/],
];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  FAIL  ${msg}`);
};

// 1. The good fixture must be accepted, with the standard and tag enforced.
const goodErrors = validateForgeConfig(GOOD, OPTS);
if (goodErrors.length) {
  fail(`good fixture was rejected:\n        - ${goodErrors.join("\n        - ")}`);
}

// 2. Every broken fixture must be rejected, for the RIGHT reason.
for (const [name, build, expected] of REJECT_CASES) {
  const errors = validateForgeConfig(build(), OPTS);
  if (!errors.length) {
    fail(`${name}: expected a rejection, got none`);
    continue;
  }
  if (!errors.some((e) => expected.test(e))) {
    fail(`${name}: rejected, but not for the expected reason (${expected}) — got: ${errors.join(" | ")}`);
  }
}

// 3. Structural guards that do not need a fixture.
for (const [name, value] of [
  ["null", null],
  ["a string", "not a config"],
  ["an array", []],
]) {
  if (!validateForgeConfig(value, OPTS).length) fail(`${name} must be rejected`);
}

// 4. A config for a different standard must be rejected when a standard is asked for.
if (!validateForgeConfig({ ...GOOD, standard: "6.NOS.1" }, OPTS).length) {
  fail("a config echoing the wrong standard must be rejected");
}

const total = 1 + REJECT_CASES.length + 3 + 1;
if (failures) {
  console.error(`validate-forge: ${failures} of ${total} checks FAILED`);
  process.exit(1);
}
console.log(
  `validate-forge: OK — gate accepts 1 good config and rejects ${REJECT_CASES.length + 4} bad ones (${total} checks).`,
);

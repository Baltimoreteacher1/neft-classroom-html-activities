#!/usr/bin/env node
// add-nonunit-fraction-division-items.mjs — teach 6-1 the case it was missing:
// a fraction whose numerator is NOT 1, divided by a whole number.
//
// WHY THIS EXISTS
//
// Lesson 6-1 (6.NOS.1, "Division Expressions with Fractions and Whole Numbers")
// covered two shapes: whole ÷ unit fraction (3 ÷ 1/4) and unit fraction ÷ whole
// (1/2 ÷ 4). Every "fraction ÷ whole number" item in the lesson, in both small
// groups and in the guided parallel bank had a 1 on top, so a student could
// finish the lesson having never met 3/4 ÷ 2 — and the standard does not stop at
// unit fractions. The method is unchanged (write the whole number over 1, then
// Keep, Change, Flip; see project memory "Unit 6 KCF"), which is exactly the
// point these items make: the numerator is not part of the rule.
//
// This stays inside 6-1's scope. 6-2 owns fraction ÷ fraction and mixed numbers;
// nothing here divides by a fraction.
//
// WHY A TOOL AND NOT A HAND EDIT
//
// tools/generate-small-group-lessons.mjs is ADDITIVE by default: the committed
// small-group config is canonical and a base-lesson change does not reach the
// groups without --replace, which on 6-1 would delete four authored warm-up sets
// and the authored "Fix our table's thinking" task. So the group items are
// written straight into the group configs, the same way
// tools/add-table-debug-items.mjs does it, where they survive every additive
// regeneration.
//
// ARITHMETIC CHECKED
//   3/4 ÷ 2 = 3/4 × 1/2 = 3/8          2/3 ÷ 4 = 2/12 = 1/6
//   5/6 ÷ 3 = 5/18                     3/5 ÷ 3 = 3/15 = 1/5
//   5/6 ÷ 2 = 5/12                     4/9 ÷ 2 = 4/18 = 2/9
//   5/8 ÷ 5 = 5/40 = 1/8               2/3 ÷ 2 = 2/6 = 1/3
//   3/4 ÷ 3 = 3/12 = 1/4               3/4 ÷ 4 = 3/16      3/4 ÷ 6 = 3/24 = 1/8
//   3/4 ÷ 1/2 = 3/4 × 2/1 = 3/2 = 1 1/2   (the group-2 contrast item)
//
// Idempotent: an item already present by stem/title/label is skipped, so this is
// safe to re-run after any practice-tier graft or a position-balance pass.
//
// Usage: node tools/add-nonunit-fraction-division-items.mjs [--dry-run]
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry-run");

/* ------------------------------------------------------------ the items */

const TAPE_EXPRESSION = {
  type: "multiple-choice",
  stem: "A 2/3-yard length of evidence tape is cut into 2 equal pieces. Which expression finds the length of one piece?",
  choices: ["2/3 × 2", "2/3 ÷ 2", "2 ÷ 2/3", "2/3 + 2"],
  correctIndex: 1,
  explanation:
    "Splitting 2/3 into 2 equal pieces is 2/3 ÷ 2. Write the 2 as 2/1, then Keep, Change, Flip: 2/3 × 1/2 = 2/6 = 1/3 yard.",
  choiceFeedback: [
    "That doubles the tape instead of cutting it.",
    "",
    "That asks how many 2/3-yard pieces fit into 2 yards — the other story.",
    "You cannot add a length to a number of pieces.",
  ],
  misconceptionTags: ["op-multiplied-instead-of-divided", null, null, null],
  hints: [
    "Read it again: is the 2/3 being shared into pieces, or is something being measured out in 2/3s?",
    "Sharing an amount into equal pieces is division: amount ÷ number of pieces.",
    "The fraction comes first and the whole number second: 2/3 ÷ 2.",
  ],
  stemEs:
    "Un tramo de cinta de evidencia de 2/3 de yarda se corta en 2 piezas iguales. ¿Qué expresión encuentra el largo de una pieza?",
  choicesEs: ["2/3 × 2", "2/3 ÷ 2", "2 ÷ 2/3", "2/3 + 2"],
  explanationEs:
    "Repartir 2/3 en 2 piezas iguales es 2/3 ÷ 2. Escribe el 2 como 2/1 y luego Conserva, Cambia, Voltea: 2/3 × 1/2 = 2/6 = 1/3 de yarda.",
  choiceFeedbackEs: [
    "Eso duplica la cinta en lugar de cortarla.",
    "",
    "Eso pregunta cuántas piezas de 2/3 de yarda caben en 2 yardas: la otra historia.",
    "No se puede sumar un largo a un número de piezas.",
  ],
  hintsEs: [
    "Léelo otra vez: ¿se está repartiendo el 2/3 en piezas, o se está midiendo algo en tramos de 2/3?",
    "Repartir una cantidad en piezas iguales es división: cantidad ÷ número de piezas.",
    "La fracción va primero y el número entero segundo: 2/3 ÷ 2.",
  ],
};

const POWDER = {
  type: "multiple-choice",
  stem: "Agent Cole has 3/4 of a pound of fingerprint powder and splits it equally into 2 kits. How much powder goes in each kit?",
  choices: ["1 1/2 pounds", "1/8 pound", "3/8 pound", "3/4 pound"],
  correctIndex: 2,
  explanation:
    "Write 3/4 ÷ 2 as 3/4 ÷ 2/1. Keep, Change, Flip: 3/4 × 1/2 = 3/8 pound in each kit. The top number does not have to be a 1 — the steps are exactly the same.",
  choiceFeedback: [
    "That multiplies by 2. Dividing by 2 means writing it as 2/1 and flipping it to 1/2.",
    "That splits only ONE fourth in half. You have three fourths to share.",
    "",
    "That gives the whole 3/4 pound to one kit instead of splitting it between two.",
  ],
  misconceptionTags: ["op-multiplied-instead-of-divided", null, null, null],
  hints: [
    "Draw 3/4 of a bar, then cut each of those three fourths in half.",
    "The whole number is second here, so write the 2 as 2/1.",
    "Keep 3/4, change ÷ to ×, flip 2/1 to 1/2: 3/4 × 1/2 = 3/8.",
  ],
  stemEs:
    "El agente Cole tiene 3/4 de libra de polvo para huellas y lo reparte en partes iguales en 2 maletines. ¿Cuánto polvo va en cada maletín?",
  choicesEs: ["1 1/2 libras", "1/8 de libra", "3/8 de libra", "3/4 de libra"],
  explanationEs:
    "Escribe 3/4 ÷ 2 como 3/4 ÷ 2/1. Conserva, Cambia, Voltea: 3/4 × 1/2 = 3/8 de libra en cada maletín. El número de arriba no tiene que ser 1: los pasos son exactamente los mismos.",
  choiceFeedbackEs: [
    "Eso multiplica por 2. Dividir entre 2 significa escribirlo como 2/1 y voltearlo a 1/2.",
    "Eso parte por la mitad solo UN cuarto. Tienes tres cuartos para repartir.",
    "",
    "Eso le da los 3/4 de libra completos a un maletín en lugar de repartirlos entre dos.",
  ],
  hintsEs: [
    "Dibuja 3/4 de una barra y luego parte por la mitad cada uno de esos tres cuartos.",
    "Aquí el número entero va segundo, así que escribe el 2 como 2/1.",
    "Conserva 3/4, cambia ÷ por ×, voltea 2/1 a 1/2: 3/4 × 1/2 = 3/8.",
  ],
};

const BARE = {
  type: "multiple-choice",
  stem: "What is 2/3 ÷ 4?",
  choices: ["8/3", "3/8", "1/6", "2/7"],
  correctIndex: 2,
  explanation:
    "Write the 4 as 4/1. Keep, Change, Flip: 2/3 × 1/4 = 2/12 = 1/6. Dividing by a whole number bigger than 1 makes the piece smaller, and 1/6 is smaller than 2/3.",
  choiceFeedback: [
    "That multiplies by 4 instead of dividing. Write the 4 as 4/1, then flip it to 1/4.",
    "You flipped the first fraction. Flip only the divisor: 4/1 becomes 1/4.",
    "",
    "Denominators are never added in division. Keep 2/3, change ÷ to ×, flip 4/1 to 1/4.",
  ],
  misconceptionTags: [
    "op-multiplied-instead-of-divided",
    "fraction-no-reciprocal",
    null,
    "fraction-straight-across-division",
  ],
  hints: [
    "The whole number is second, so write the 4 as 4/1.",
    "Keep 2/3, change ÷ to ×, and flip 4/1 to 1/4.",
    "Multiply across: 2 × 1 = 2 on top, 3 × 4 = 12 on the bottom. Then simplify 2/12.",
  ],
  stemEs: "¿Cuánto es 2/3 ÷ 4?",
  choicesEs: ["8/3", "3/8", "1/6", "2/7"],
  explanationEs:
    "Escribe el 4 como 4/1. Conserva, Cambia, Voltea: 2/3 × 1/4 = 2/12 = 1/6. Dividir entre un número entero mayor que 1 hace la pieza más pequeña, y 1/6 es menor que 2/3.",
  choiceFeedbackEs: [
    "Eso multiplica por 4 en lugar de dividir. Escribe el 4 como 4/1 y luego voltéalo a 1/4.",
    "Volteaste la primera fracción. Voltea solo el divisor: 4/1 se vuelve 1/4.",
    "",
    "Los denominadores nunca se suman al dividir. Conserva 2/3, cambia ÷ por ×, voltea 4/1 a 1/4.",
  ],
  hintsEs: [
    "El número entero va segundo, así que escribe el 4 como 4/1.",
    "Conserva 2/3, cambia ÷ por × y voltea 4/1 a 1/4.",
    "Multiplica en línea: 2 × 1 = 2 arriba y 3 × 4 = 12 abajo. Luego simplifica 2/12.",
  ],
};

const TRAIL = {
  type: "multiple-choice",
  stem: "A 5/6-mile stretch of the evidence trail is split equally among 3 search teams. How much of a mile does each team walk?",
  choices: ["5/2 miles", "1/18 mile", "5/6 mile", "5/18 mile"],
  correctIndex: 3,
  explanation:
    "Write 5/6 ÷ 3 as 5/6 ÷ 3/1. Keep, Change, Flip: 5/6 × 1/3 = 5/18 mile for each team. Three teams walking 5/18 mile each covers 15/18 = 5/6 mile, so the answer checks out.",
  choiceFeedback: [
    "That multiplies by 3. Dividing by 3 means writing it as 3/1 and flipping it to 1/3.",
    "That splits only ONE sixth among the teams. There are five sixths to share.",
    "That sends every team the whole 5/6 mile instead of splitting it three ways.",
    "",
  ],
  misconceptionTags: ["op-multiplied-instead-of-divided", null, null, null],
  hints: [
    "Sharing an amount among teams is division: 5/6 ÷ 3.",
    "Write the 3 as 3/1 so both numbers are fractions.",
    "Keep 5/6, change ÷ to ×, flip 3/1 to 1/3, and multiply across.",
  ],
  stemEs:
    "Un tramo de 5/6 de milla del sendero de evidencia se reparte en partes iguales entre 3 equipos de búsqueda. ¿Qué parte de una milla camina cada equipo?",
  choicesEs: ["5/2 millas", "1/18 de milla", "5/6 de milla", "5/18 de milla"],
  explanationEs:
    "Escribe 5/6 ÷ 3 como 5/6 ÷ 3/1. Conserva, Cambia, Voltea: 5/6 × 1/3 = 5/18 de milla para cada equipo. Tres equipos que caminan 5/18 de milla cada uno cubren 15/18 = 5/6 de milla, así que la respuesta cuadra.",
  choiceFeedbackEs: [
    "Eso multiplica por 3. Dividir entre 3 significa escribirlo como 3/1 y voltearlo a 1/3.",
    "Eso reparte solo UN sexto entre los equipos. Hay cinco sextos para repartir.",
    "Eso le manda a cada equipo los 5/6 de milla completos en lugar de repartirlos en tres.",
    "",
  ],
  hintsEs: [
    "Repartir una cantidad entre equipos es división: 5/6 ÷ 3.",
    "Escribe el 3 como 3/1 para que ambos números sean fracciones.",
    "Conserva 5/6, cambia ÷ por ×, voltea 3/1 a 1/3 y multiplica en línea.",
  ],
};

const MATCH = {
  type: "matching-game",
  pairs: [
    { term: "3/4 ÷ 2", match: "3/8" },
    { term: "2/3 ÷ 4", match: "1/6" },
    { term: "5/6 ÷ 2", match: "5/12" },
    { term: "3/5 ÷ 3", match: "1/5" },
    { term: "4/9 ÷ 2", match: "2/9" },
    { term: "5/8 ÷ 5", match: "1/8" },
  ],
  columns: 4,
  label: "Match each fraction ÷ whole number expression to its quotient.",
  hint: "Write the whole number over 1, flip it, and multiply across. Simplify before you look for the match.",
  hints: [
    "Every left card divides a fraction by a whole number, so every quotient is SMALLER than the fraction it started with.",
    "Write the whole number over 1 first: 3/4 ÷ 2 becomes 3/4 ÷ 2/1.",
    "Start with 3/4 ÷ 2: keep 3/4, change ÷ to ×, flip 2/1 to 1/2, and multiply across to find its match.",
  ],
  explanation:
    "Write each whole number over 1, then Keep, Change, Flip: 3/4 × 1/2 = 3/8, 2/3 × 1/4 = 2/12 = 1/6, 5/6 × 1/2 = 5/12, 3/5 × 1/3 = 3/15 = 1/5, 4/9 × 1/2 = 4/18 = 2/9, and 5/8 × 1/5 = 5/40 = 1/8. None of these numerators is a 1, and the steps never changed.",
  labelEs: "Une cada expresión de fracción ÷ número entero con su cociente.",
  explanationEs:
    "Escribe cada número entero sobre 1 y luego Conserva, Cambia, Voltea: 3/4 × 1/2 = 3/8, 2/3 × 1/4 = 2/12 = 1/6, 5/6 × 1/2 = 5/12, 3/5 × 1/3 = 3/15 = 1/5, 4/9 × 1/2 = 4/18 = 2/9 y 5/8 × 1/5 = 5/40 = 1/8. Ninguno de estos numeradores es 1, y los pasos nunca cambiaron.",
  hintsEs: [
    "Cada tarjeta de la izquierda divide una fracción entre un número entero, así que cada cociente es MENOR que la fracción con la que empezó.",
    "Primero escribe el número entero sobre 1: 3/4 ÷ 2 se vuelve 3/4 ÷ 2/1.",
    "Empieza con 3/4 ÷ 2: conserva 3/4, cambia ÷ por ×, voltea 2/1 a 1/2 y multiplica en línea para hallar su pareja.",
  ],
};

const ERROR_ANALYSIS = {
  type: "error-analysis",
  title: "Spot the Mistake — When the Numerator Is Not 1",
  workedExample: [
    {
      label: "Problem",
      work: "A 3/4-pound bag of powder is split equally into 2 kits. Find 3/4 ÷ 2.",
      labelEs: "Problema",
      workEs:
        "Una bolsa de 3/4 de libra de polvo se reparte en partes iguales en 2 maletines. Encuentra 3/4 ÷ 2.",
    },
    {
      label: "Student writes",
      work: "The numerator is not a 1, so I will divide straight across: 3 ÷ 2 on top and 4 ÷ 2 on the bottom.",
      labelEs: "El estudiante escribe",
      workEs:
        "El numerador no es 1, así que voy a dividir directamente: 3 ÷ 2 arriba y 4 ÷ 2 abajo.",
    },
    {
      label: "Student's answer",
      work: "1.5/2 of a pound",
      labelEs: "Respuesta del estudiante",
      workEs: "1.5/2 de libra",
    },
  ],
  errorStep: 1,
  correctWork:
    "A numerator that is not 1 changes nothing. Write the whole number over 1 and Keep, Change, Flip: 3/4 ÷ 2/1 = 3/4 × 1/2 = 3/8 pound.",
  hints: [
    "Does the numerator being 3 instead of 1 change which number you flip?",
    "Write the 2 as 2/1 first, then flip only that divisor.",
  ],
  explanation:
    'In the "Student writes" step the student invented a new rule for a non-unit numerator and divided straight across, which leaves a fraction inside a fraction. The rule never changed: write the whole number over 1, then Keep, Change, Flip. 3/4 ÷ 2/1 = 3/4 × 1/2 = 3/8 pound — and 3/8 is exactly half of 3/4, which is what splitting into 2 kits should give.',
  titleEs: "Encuentra el error — cuando el numerador no es 1",
  correctWorkEs:
    "Que el numerador no sea 1 no cambia nada. Escribe el número entero sobre 1 y Conserva, Cambia, Voltea: 3/4 ÷ 2/1 = 3/4 × 1/2 = 3/8 de libra.",
  explanationEs:
    'En el paso "El estudiante escribe" el estudiante inventó una regla nueva para un numerador que no es 1 y dividió directamente, lo que deja una fracción dentro de otra fracción. La regla nunca cambió: escribe el número entero sobre 1 y luego Conserva, Cambia, Voltea. 3/4 ÷ 2/1 = 3/4 × 1/2 = 3/8 de libra, y 3/8 es exactamente la mitad de 3/4, que es lo que debe dar repartirlo en 2 maletines.',
  hintsEs: [
    "¿Que el numerador sea 3 en lugar de 1 cambia cuál número volteas?",
    "Escribe primero el 2 como 2/1 y luego voltea solo ese divisor.",
  ],
};

const TABLE = {
  type: "fill-table",
  label: "Complete the pattern: the same 3/4 shared among more and more people.",
  columns: ["Expression", "Quotient", "Pattern"],
  rows: [
    { given: "3/4 ÷ 2", answer: "3/8", pattern: "" },
    { given: "3/4 ÷ 3", answer: "1/4", pattern: "quotient decreases" },
    { given: "3/4 ÷ 4", answer: "3/16", pattern: "quotient decreases" },
    { given: "3/4 ÷ 6", answer: "1/8", pattern: "larger whole-number divisor → smaller quotient" },
  ],
  hint: "Write each whole number over 1, flip it, and multiply across. Simplify where you can.",
  hints: [
    "Every row shares the same 3/4 among more people, so every quotient should be smaller than the one above it.",
    "Write each whole number over 1: 3/4 ÷ 2 becomes 3/4 ÷ 2/1.",
    "First row: keep 3/4, change ÷ to ×, flip 2/1 to 1/2, and multiply across to get 3/8.",
  ],
  explanation:
    "Each row writes the whole number over 1 and flips it: 3/4 × 1/2 = 3/8, 3/4 × 1/3 = 3/12 = 1/4, 3/4 × 1/4 = 3/16, and 3/4 × 1/6 = 3/24 = 1/8. The dividend never moves, so sharing among more people always leaves each person less. Compare this with dividing 3/4 by a unit fraction, where the quotient grows instead.",
  labelEs: "Completa el patrón: los mismos 3/4 repartidos entre más y más personas.",
  explanationEs:
    "Cada fila escribe el número entero sobre 1 y lo voltea: 3/4 × 1/2 = 3/8, 3/4 × 1/3 = 3/12 = 1/4, 3/4 × 1/4 = 3/16 y 3/4 × 1/6 = 3/24 = 1/8. El dividendo nunca se mueve, así que repartir entre más personas siempre deja menos para cada una. Compara esto con dividir 3/4 entre una fracción unitaria, donde el cociente crece en lugar de bajar.",
  hintsEs: [
    "Cada fila reparte los mismos 3/4 entre más personas, así que cada cociente debe ser menor que el de arriba.",
    "Escribe cada número entero sobre 1: 3/4 ÷ 2 se vuelve 3/4 ÷ 2/1.",
    "Primera fila: conserva 3/4, cambia ÷ por ×, voltea 2/1 a 1/2 y multiplica en línea para obtener 3/8.",
  ],
};

/* The challenge group's own item: same dividend, two divisors, opposite
 * directions. Re-serving core items is what makes an extension "the same
 * questions again" (tools/lib/small-group-challenge-tasks.mjs), so group 2 gets
 * the comparison the core lesson never asks for. */
const CONTRAST = {
  type: "open-response",
  prompt:
    "3/4 ÷ 2 = 3/8, but 3/4 ÷ 1/2 = 1 1/2. Both problems start with the same 3/4. Explain why dividing by the whole number 2 made the answer smaller while dividing by 1/2 made it bigger, and give a real situation for each.",
  promptEs:
    "3/4 ÷ 2 = 3/8, pero 3/4 ÷ 1/2 = 1 1/2. Los dos problemas empiezan con los mismos 3/4. Explica por qué dividir entre el número entero 2 hizo la respuesta más pequeña mientras que dividir entre 1/2 la hizo más grande, y da una situación real para cada uno.",
  sentenceFrame:
    "Dividing 3/4 by 2 asks ___ , so the answer is ___ than 3/4. Dividing 3/4 by 1/2 asks ___ , so the answer is ___ than 3/4.",
  sentenceFrameEs:
    "Dividir 3/4 entre 2 pregunta ___ , así que la respuesta es ___ que 3/4. Dividir 3/4 entre 1/2 pregunta ___ , así que la respuesta es ___ que 3/4.",
  keywords: ["share", "how many fit", "smaller", "bigger", "reciprocal", "divisor"],
  minLength: 40,
  hint: "Say each problem out loud as a question. One asks 'how big is each share?' and the other asks 'how many fit?'",
  explanation:
    "Dividing 3/4 by 2 asks how big each share is when 3/4 is split between 2 people, so each share (3/8) has to be smaller than 3/4 — like splitting 3/4 of a pound of powder into 2 kits. Dividing 3/4 by 1/2 asks how many 1/2-size pieces fit inside 3/4, and since each piece is smaller than the whole amount, more than one fits: 1 1/2 of them — like measuring 3/4 of a cup out with a 1/2-cup scoop. The steps are identical, 3/4 × 1/2 versus 3/4 × 2/1; flipping a whole number gives a factor smaller than 1, and flipping a unit fraction gives a factor bigger than 1.",
  explanationEs:
    "Dividir 3/4 entre 2 pregunta qué tan grande es cada parte cuando 3/4 se reparte entre 2 personas, así que cada parte (3/8) tiene que ser menor que 3/4, como repartir 3/4 de libra de polvo en 2 maletines. Dividir 3/4 entre 1/2 pregunta cuántas piezas de 1/2 caben dentro de 3/4, y como cada pieza es menor que la cantidad completa, cabe más de una: 1 1/2 de ellas, como medir 3/4 de taza con una cuchara de 1/2 taza. Los pasos son idénticos, 3/4 × 1/2 frente a 3/4 × 2/1; voltear un número entero da un factor menor que 1 y voltear una fracción unitaria da uno mayor que 1.",
  hints: [
    "Say each problem out loud as a question. Which one asks 'how big is each share?' and which asks 'how many fit?'",
    "Look at what each divisor becomes when you flip it: 2/1 becomes 1/2, and 1/2 becomes 2/1.",
    "Multiplying by a factor smaller than 1 shrinks the amount; multiplying by a factor bigger than 1 grows it.",
  ],
  hintsEs: [
    "Di cada problema en voz alta como pregunta. ¿Cuál pregunta '¿qué tan grande es cada parte?' y cuál '¿cuántas caben?'",
    "Mira en qué se convierte cada divisor al voltearlo: 2/1 se vuelve 1/2 y 1/2 se vuelve 2/1.",
    "Multiplicar por un factor menor que 1 encoge la cantidad; multiplicar por uno mayor que 1 la agranda.",
  ],
};

/* ------------------------------------------------------------------ plumbing */

const identity = (item) => item.stem || item.title || item.label || item.prompt || "";

/** Insert `items` into `config.practice[tier]` at `at`, skipping any already
 *  present. Returns how many were actually added. */
function graft(config, tier, at, items) {
  const list = (config.practice[tier] ||= []);
  const present = new Set(list.map(identity));
  const fresh = items.filter((item) => !present.has(identity(item)));
  if (fresh.length) list.splice(at < 0 ? list.length : at, 0, ...fresh);
  return fresh.length;
}

function edit(path, mutate) {
  const config = JSON.parse(readFileSync(path, "utf8"));
  const before = JSON.stringify(config);
  const added = mutate(config);
  const after = JSON.stringify(config, null, 2) + "\n";
  const changed = JSON.stringify(config) !== before;
  if (changed && !DRY) writeFileSync(path, after);
  console.log(
    `${DRY ? "[dry] " : ""}${path}: ${added} item(s) added${changed ? "" : " — already current"}`,
  );
}

/* ------------------------------------------------------- the core lesson 6-1 */
edit("lessons/6-1/config.json", (cfg) => {
  // Each graft sits directly after the lesson's existing unit-fraction ÷ whole
  // number item in that tier, so "the numerator is not a 1" reads as the next
  // step of one idea rather than a new topic.
  let added = 0;
  added += graft(cfg, "optional", 2, [TAPE_EXPRESSION]);
  added += graft(cfg, "approaching", 4, [POWDER, BARE]);
  added += graft(cfg, "onLevel", 4, [MATCH, TRAIL]);
  added += graft(cfg, "extending", -1, [ERROR_ANALYSIS, TABLE]);

  // The lesson has to SAY it teaches this, or the objective and the practice
  // disagree and every derived artifact repeats the narrower claim.
  cfg.contentObjective =
    "I can divide a whole number by a unit fraction and divide a fraction by a whole number by writing the whole number over 1 and using Keep, Change, Flip.";
  const ci = cfg.launch.conceptIntro;
  ci.keyIdea = ci.keyIdea.replace(
    "Dividing Whole Numbers & Unit Fractions.",
    "Dividing Whole Numbers & Fractions.",
  );
  ci.keyIdeaEs = ci.keyIdeaEs.replace(
    "Dividir números enteros y fracciones unitarias.",
    "Dividir números enteros y fracciones.",
  );
  const YOU_DO_EN =
    "One more: the top number does not have to be a 1. A unit fraction like 1/2 and a fraction like 3/4 use the same three steps. For 3/4 ÷ 2, write the 2 as 2/1, flip it to 1/2, and multiply: 3/4 × 1/2 = 3/8.";
  const YOU_DO_ES =
    "Una más: el número de arriba no tiene que ser 1. Una fracción unitaria como 1/2 y una fracción como 3/4 usan los mismos tres pasos. Para 3/4 ÷ 2, escribe el 2 como 2/1, voltéalo a 1/2 y multiplica: 3/4 × 1/2 = 3/8.";
  // Replace an earlier wording of this line rather than stacking a second one.
  const swap = (lines, next, opener) => {
    const at = lines.findIndex((line) => line.startsWith(opener));
    if (at === -1) lines.push(next);
    else lines[at] = next;
  };
  swap(ci.youDo.lines, YOU_DO_EN, "One more: the top number does not have to be a 1.");
  swap(ci.youDo.linesEs, YOU_DO_ES, "Una más: el número de arriba no tiene que ser 1.");

  // The put-your-own-numbers-in tool must be able to show the new case too.
  const presets = cfg.practice.diagram.presets;
  for (const preset of [
    { dividend: "3/4", divisor: "2", label: "3/4 ÷ 2" },
    { dividend: "5/6", divisor: "3", label: "5/6 ÷ 3" },
  ]) {
    if (!presets.some((p) => p.label === preset.label)) presets.push(preset);
  }
  return added;
});

/* --------------------------------------------------------- the small groups */
// Placement follows engine/core/small-group-practice.js collectPracticeItems:
// group 1 draws from approaching + onLevel, group 2 from onLevel + extending.
edit("lessons/6-1-group1/config.json", (cfg) => {
  let added = 0;
  added += graft(cfg, "approaching", -1, [POWDER]);
  added += graft(cfg, "onLevel", -1, [BARE, TRAIL]);
  return added;
});

edit("lessons/6-1-group2/config.json", (cfg) => {
  let added = 0;
  added += graft(cfg, "onLevel", -1, [MATCH]);
  added += graft(cfg, "extending", -1, [ERROR_ANALYSIS, TABLE, CONTRAST]);
  return added;
});

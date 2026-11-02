/**
 * Unit 4 Test Practice — the single source of truth for both pages:
 *   /curriculum/unit-4-test-practice/            (Practice)
 *   /curriculum/unit-4-test-practice-challenge/  (Challenge)
 *
 * The practice mirrors the SKILLS (6.RP.A.3.c percents) and the QUESTION TYPES of the Unit 4 test
 * (tape diagram, fill-in, choose-all, multiple choice, two-part constructed response with a
 * drawing box). Every number here is new: nothing is copied from the real assessment.
 *
 * Text is { en, es }. `[[3/5]]` renders as a stacked fraction. Answers are computed, not typed,
 * wherever the arithmetic is non-trivial, so a wrong key is a test failure, not a typo.
 * scripts/generate-unit4-test-practice.mjs writes the pages; tools/unit4-test-practice.test.mjs verifies them.
 */

/** @param {number} x */
const r = (x) => Math.round(x * 1e6) / 1e6;
/** @param {number} part @param {number} whole */
const pct = (part, whole) => r((part / whole) * 100);
/** @param {number} p @param {number} n */
const of = (p, n) => r((p / 100) * n);
/** @param {number} part @param {number} p */
const whole = (part, p) => r(part / (p / 100));

export const STRANDS = {
  tape: { en: "Read a percent tape diagram", es: "Lee un diagrama de cinta de porcentajes", icon: "▭" },
  combine: { en: "Add fractions, decimals and percents", es: "Suma fracciones, decimales y porcentajes", icon: "➕" },
  part: { en: "Turn a part out of a whole into a percent", es: "Convierte una parte de un total en porcentaje", icon: "½" },
  equiv: { en: "Match equivalent values", es: "Relaciona valores equivalentes", icon: "＝" },
  of: { en: "Find a percent of a number", es: "Halla el porcentaje de un número", icon: "%" },
  whole: { en: "Find the whole", es: "Halla el total", icon: "▣" },
  combine2: { en: "Combine two parts of a whole", es: "Combina dos partes de un total", icon: "∑" },
  estimate: { en: "Estimate with benchmark percents", es: "Estima con porcentajes de referencia", icon: "≈" },
  cr: { en: "Show your thinking", es: "Muestra tu razonamiento", icon: "✎" },
};

/** Shown on both pages: the tools a student may use on the real test. */
export const TOOLBOX = [
  {
    en: "Percent means “out of 100.” 100% is the whole.",
    es: "Porcentaje significa «de cada 100». El 100% es el total.",
  },
  {
    en: "10% → divide by 10. 1% → divide by 100. Build other percents from these.",
    es: "10% → divide entre 10. 1% → divide entre 100. Construye otros porcentajes a partir de estos.",
  },
  {
    en: "Benchmarks: 25% = [[1/4]], 50% = [[1/2]], 75% = [[3/4]], 100% = the whole.",
    es: "Referencias: 25% = [[1/4]], 50% = [[1/2]], 75% = [[3/4]], 100% = el total.",
  },
  {
    en: "Part = percent × whole. To find the whole, undo it: whole = part ÷ percent.",
    es: "Parte = porcentaje × total. Para hallar el total, deshaz la operación: total = parte ÷ porcentaje.",
  },
  {
    en: "Two groups? Add the parts and add the wholes first. Do not average the percents.",
    es: "¿Dos grupos? Primero suma las partes y suma los totales. No promedies los porcentajes.",
  },
  {
    en: "Check: is your answer more or less than the whole? Does that match the percent?",
    es: "Comprueba: ¿tu respuesta es mayor o menor que el total? ¿Coincide con el porcentaje?",
  },
];

/* ---------- Practice ---------- */

/** @type {any[]} */
export const PRACTICE = [
  {
    id: "p-tape-1",
    strand: "tape",
    type: "tape",
    tape: { whole: 5, shown: 3 },
    q: {
      en: "The top bar is 100%. What percent does the bottom bar show? Enter the answer.",
      es: "La barra de arriba es el 100%. ¿Qué porcentaje muestra la barra de abajo? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(3, 5),
    traps: [
      { value: 3, en: "3 is how many boxes are shaded. Each box is worth a percent of its own.", es: "3 es la cantidad de cuadros sombreados. Cada cuadro vale un porcentaje." },
      { value: 20, en: "20% is the value of ONE box. Count how many boxes the bottom bar has.", es: "20% es el valor de UN cuadro. Cuenta cuántos cuadros tiene la barra de abajo." },
    ],
    hint: {
      en: "The top bar has 5 equal boxes that make 100%. One box is 100% ÷ 5. Then count the boxes in the bottom bar.",
      es: "La barra de arriba tiene 5 cuadros iguales que forman el 100%. Un cuadro es 100% ÷ 5. Luego cuenta los cuadros de la barra de abajo.",
    },
    why: {
      en: "One box = 100% ÷ 5 = 20%. The bottom bar has 3 boxes, so 3 × 20% = 60%.",
      es: "Un cuadro = 100% ÷ 5 = 20%. La barra de abajo tiene 3 cuadros, entonces 3 × 20% = 60%.",
    },
  },
  {
    id: "p-tape-2",
    strand: "tape",
    type: "tape",
    tape: { whole: 4, shown: 3 },
    q: {
      en: "The top bar is 100%. What percent does the bottom bar show? Enter the answer.",
      es: "La barra de arriba es el 100%. ¿Qué porcentaje muestra la barra de abajo? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(3, 4),
    traps: [
      { value: 25, en: "25% is ONE box (100% ÷ 4). The bottom bar has more than one box.", es: "25% es UN cuadro (100% ÷ 4). La barra de abajo tiene más de un cuadro." },
      { value: 3, en: "3 is the number of shaded boxes, not the percent.", es: "3 es la cantidad de cuadros sombreados, no el porcentaje." },
    ],
    hint: {
      en: "4 equal boxes make 100%. What is one box worth?",
      es: "4 cuadros iguales forman el 100%. ¿Cuánto vale un cuadro?",
    },
    why: {
      en: "One box = 100% ÷ 4 = 25%. Three boxes = 3 × 25% = 75%.",
      es: "Un cuadro = 100% ÷ 4 = 25%. Tres cuadros = 3 × 25% = 75%.",
    },
  },
  {
    id: "p-tape-3",
    strand: "tape",
    type: "tape",
    tape: { whole: 8, shown: 5 },
    q: {
      en: "The top bar is 100%. What percent does the bottom bar show? Your answer can be a decimal.",
      es: "La barra de arriba es el 100%. ¿Qué porcentaje muestra la barra de abajo? Tu respuesta puede ser un decimal.",
    },
    unit: "%",
    answer: pct(5, 8),
    traps: [
      { value: 12.5, en: "12.5% is ONE box (100% ÷ 8). Count all the shaded boxes.", es: "12.5% es UN cuadro (100% ÷ 8). Cuenta todos los cuadros sombreados." },
      { value: 62, en: "Close. 100 ÷ 8 is 12.5, not 12, so the answer has a decimal part.", es: "Casi. 100 ÷ 8 es 12.5, no 12; por eso la respuesta tiene parte decimal." },
    ],
    hint: {
      en: "8 equal boxes make 100%. 100 ÷ 8 = 12.5, so one box is 12.5%.",
      es: "8 cuadros iguales forman el 100%. 100 ÷ 8 = 12.5, así que un cuadro es 12.5%.",
    },
    why: {
      en: "One box = 100% ÷ 8 = 12.5%. Five boxes = 5 × 12.5% = 62.5%.",
      es: "Un cuadro = 100% ÷ 8 = 12.5%. Cinco cuadros = 5 × 12.5% = 62.5%.",
    },
  },
  {
    id: "p-combine-1",
    strand: "combine",
    type: "num",
    q: {
      en: "At a bakery, 0.45 of the sales are bread and [[1/4]] of the sales are muffins. The rest are cookies. What percent of the sales are bread and muffins? Enter the answer.",
      es: "En una panadería, 0.45 de las ventas son de pan y [[1/4]] de las ventas son de panecillos. El resto son galletas. ¿Qué porcentaje de las ventas son de pan y panecillos? Escribe la respuesta.",
    },
    unit: "%",
    answer: r(45 + 25),
    traps: [
      { value: 30, en: "30% is the cookies, the part that is left over. The question asks for bread and muffins.", es: "30% son las galletas, lo que sobra. La pregunta pide el pan y los panecillos." },
    ],
    hint: {
      en: "Write each part as a percent first: 0.45 = 45% and [[1/4]] = 25%. Then add them.",
      es: "Primero escribe cada parte como porcentaje: 0.45 = 45% y [[1/4]] = 25%. Luego súmalos.",
    },
    why: {
      en: "0.45 = 45% and [[1/4]] = 25%. 45% + 25% = 70%.",
      es: "0.45 = 45% y [[1/4]] = 25%. 45% + 25% = 70%.",
    },
  },
  {
    id: "p-combine-2",
    strand: "combine",
    type: "num",
    q: {
      en: "At a pet show, [[3/5]] of the animals are dogs, 0.15 are cats, and the rest are birds. What percent of the animals are dogs and cats? Enter the answer.",
      es: "En una exhibición de mascotas, [[3/5]] de los animales son perros, 0.15 son gatos y el resto son aves. ¿Qué porcentaje de los animales son perros y gatos? Escribe la respuesta.",
    },
    unit: "%",
    answer: r(60 + 15),
    traps: [
      { value: 25, en: "25% is the birds. Add only the dogs and the cats.", es: "25% son las aves. Suma solo los perros y los gatos." },
      { value: 75.15, en: "Do not add 0.15 to 60 as it is. 0.15 means 15%. Convert first, then add.", es: "No sumes 0.15 a 60 tal cual. 0.15 significa 15%. Convierte primero y luego suma." },
    ],
    hint: {
      en: "[[3/5]] = 60 ÷ 100, so [[3/5]] = 60%. 0.15 = 15%. Add the two percents.",
      es: "[[3/5]] = 60 ÷ 100, entonces [[3/5]] = 60%. 0.15 = 15%. Suma los dos porcentajes.",
    },
    why: {
      en: "[[3/5]] = [[60/100]] = 60% and 0.15 = 15%. 60% + 15% = 75%.",
      es: "[[3/5]] = [[60/100]] = 60% y 0.15 = 15%. 60% + 15% = 75%.",
    },
  },
  {
    id: "p-part-1",
    strand: "part",
    type: "num",
    q: {
      en: "Ana surveys her classmates. She finds that 17 out of 20 want a pizza party. What percent can describe the classmates who want a pizza party? Enter the answer.",
      es: "Ana encuesta a sus compañeros. Encuentra que 17 de 20 quieren una fiesta de pizza. ¿Qué porcentaje describe a los compañeros que quieren una fiesta de pizza? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(17, 20),
    traps: [
      { value: 17, en: "17 is the number of students. A percent is out of 100, and the whole here is 20.", es: "17 es la cantidad de estudiantes. Un porcentaje es de cada 100 y aquí el total es 20." },
    ],
    hint: {
      en: "Make the whole 100: 20 × 5 = 100. Do the same to the part: 17 × 5.",
      es: "Haz que el total sea 100: 20 × 5 = 100. Haz lo mismo con la parte: 17 × 5.",
    },
    why: {
      en: "[[17/20]] = [[85/100]] = 85%.",
      es: "[[17/20]] = [[85/100]] = 85%.",
    },
  },
  {
    id: "p-part-2",
    strand: "part",
    type: "num",
    q: {
      en: "Of the 25 students in a class, 18 walk to school. What percent of the students walk to school? Enter the answer.",
      es: "De los 25 estudiantes de una clase, 18 caminan a la escuela. ¿Qué porcentaje de los estudiantes camina a la escuela? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(18, 25),
    traps: [
      { value: 18, en: "18 is the number of students who walk. Rewrite the fraction out of 100.", es: "18 es la cantidad de estudiantes que caminan. Reescribe la fracción de cada 100." },
      { value: 7, en: "7 students do NOT walk. Find the percent who DO walk.", es: "7 estudiantes NO caminan. Halla el porcentaje de los que SÍ caminan." },
    ],
    hint: {
      en: "25 × 4 = 100. Multiply the part, 18, by 4 as well.",
      es: "25 × 4 = 100. Multiplica también la parte, 18, por 4.",
    },
    why: { en: "[[18/25]] = [[72/100]] = 72%.", es: "[[18/25]] = [[72/100]] = 72%." },
  },
  {
    id: "p-part-3",
    strand: "part",
    type: "num",
    q: {
      en: "A team won 12 of its 15 games. What percent of its games did the team win? Enter the answer.",
      es: "Un equipo ganó 12 de sus 15 juegos. ¿Qué porcentaje de sus juegos ganó el equipo? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(12, 15),
    traps: [
      { value: 12, en: "12 is the number of wins, not the percent.", es: "12 es la cantidad de victorias, no el porcentaje." },
      { value: 20, en: "20% is the share of games the team did NOT win (3 of 15).", es: "20% es la parte de los juegos que NO ganó (3 de 15)." },
    ],
    hint: {
      en: "Simplify first: [[12/15]] = [[4/5]]. Then 5 × 20 = 100.",
      es: "Simplifica primero: [[12/15]] = [[4/5]]. Luego 5 × 20 = 100.",
    },
    why: { en: "[[12/15]] = [[4/5]] = [[80/100]] = 80%.", es: "[[12/15]] = [[4/5]] = [[80/100]] = 80%." },
  },
  {
    id: "p-equiv-1",
    strand: "equiv",
    type: "multi",
    q: { en: "Which show equivalent values? Choose all that apply.", es: "¿Cuáles muestran valores equivalentes? Elige todas las que correspondan." },
    options: [
      { text: "45% and [[9/20]]", ok: true, note: { en: "[[9/20]] = [[45/100]] = 45%.", es: "[[9/20]] = [[45/100]] = 45%." } },
      { text: "8% and 0.8", ok: false, note: { en: "8% = 0.08. The decimal 0.8 is 80%.", es: "8% = 0.08. El decimal 0.8 es 80%." } },
      { text: "250% and 2.5", ok: true, note: { en: "250% = 250 ÷ 100 = 2.5.", es: "250% = 250 ÷ 100 = 2.5." } },
      { text: "0.7% and 0.07", ok: false, note: { en: "0.7% = 0.007. The decimal 0.07 is 7%.", es: "0.7% = 0.007. El decimal 0.07 es 7%." } },
      { text: "6% and [[3/50]]", ok: true, note: { en: "[[3/50]] = [[6/100]] = 6%.", es: "[[3/50]] = [[6/100]] = 6%." } },
      { text: "130% and 1.03", ok: false, note: { en: "130% = 1.30. The decimal 1.03 is 103%.", es: "130% = 1.30. El decimal 1.03 es 103%." } },
    ],
    hint: {
      en: "Move the decimal point 2 places to change a percent to a decimal: 8% → 0.08. For a fraction, make the denominator 100.",
      es: "Mueve el punto decimal 2 lugares para pasar de porcentaje a decimal: 8% → 0.08. Para una fracción, haz que el denominador sea 100.",
    },
    why: {
      en: "Equivalent pairs: 45% and [[9/20]]; 250% and 2.5; 6% and [[3/50]]. Check every pair by turning both values into hundredths.",
      es: "Pares equivalentes: 45% y [[9/20]]; 250% y 2.5; 6% y [[3/50]]. Comprueba cada par convirtiendo ambos valores a centésimos.",
    },
  },
  {
    id: "p-equiv-2",
    strand: "equiv",
    type: "multi",
    q: { en: "Which show equivalent values? Choose all that apply.", es: "¿Cuáles muestran valores equivalentes? Elige todas las que correspondan." },
    options: [
      { text: "35% and [[7/20]]", ok: true, note: { en: "[[7/20]] = [[35/100]] = 35%.", es: "[[7/20]] = [[35/100]] = 35%." } },
      { text: "0.9% and 0.009", ok: true, note: { en: "0.9% = 0.9 ÷ 100 = 0.009.", es: "0.9% = 0.9 ÷ 100 = 0.009." } },
      { text: "4% and 0.4", ok: false, note: { en: "4% = 0.04. The decimal 0.4 is 40%.", es: "4% = 0.04. El decimal 0.4 es 40%." } },
      { text: "175% and [[7/4]]", ok: true, note: { en: "[[7/4]] = 1.75 = 175%.", es: "[[7/4]] = 1.75 = 175%." } },
      { text: "12% and [[1/8]]", ok: false, note: { en: "[[1/8]] = 0.125 = 12.5%, not 12%.", es: "[[1/8]] = 0.125 = 12.5%, no 12%." } },
      { text: "60% and 6", ok: false, note: { en: "60% = 0.6. The number 6 is 600%.", es: "60% = 0.6. El número 6 es 600%." } },
    ],
    hint: {
      en: "Turn every value into a decimal. Percent → divide by 100. Fraction → divide the top by the bottom.",
      es: "Convierte cada valor en decimal. Porcentaje → divide entre 100. Fracción → divide el numerador entre el denominador.",
    },
    why: {
      en: "Equivalent pairs: 35% and [[7/20]]; 0.9% and 0.009; 175% and [[7/4]].",
      es: "Pares equivalentes: 35% y [[7/20]]; 0.9% y 0.009; 175% y [[7/4]].",
    },
  },
  {
    id: "p-of-1",
    strand: "of",
    type: "num",
    q: {
      en: "A school has 240 students. 55% of the students ride the bus. How many students ride the bus? Enter the answer.",
      es: "Una escuela tiene 240 estudiantes. El 55% de los estudiantes viaja en autobús. ¿Cuántos estudiantes viajan en autobús? Escribe la respuesta.",
    },
    unit: "",
    answer: of(55, 240),
    traps: [
      { value: 13200, en: "Multiply by the percent as a decimal (0.55), not as 55.", es: "Multiplica por el porcentaje como decimal (0.55), no como 55." },
      { value: 108, en: "108 is 45% of 240, the students who do NOT ride the bus.", es: "108 es el 45% de 240, los estudiantes que NO viajan en autobús." },
    ],
    hint: {
      en: "Build 55% from friendly percents: 50% + 5%. 10% of 240 is 24, so 5% is 12.",
      es: "Forma 55% con porcentajes fáciles: 50% + 5%. El 10% de 240 es 24, así que el 5% es 12.",
    },
    why: { en: "50% of 240 = 120 and 5% of 240 = 12. 120 + 12 = 132 students.", es: "50% de 240 = 120 y 5% de 240 = 12. 120 + 12 = 132 estudiantes." },
  },
  {
    id: "p-of-2",
    strand: "of",
    type: "num",
    q: {
      en: "A jacket costs $80. It is on sale for 35% off. How many dollars is the discount? Enter the answer.",
      es: "Una chaqueta cuesta $80. Está en oferta con 35% de descuento. ¿Cuántos dólares es el descuento? Escribe la respuesta.",
    },
    unit: "$",
    answer: of(35, 80),
    traps: [
      { value: 52, en: "$52 is the SALE price ($80 − $28). The question asks for the discount itself.", es: "$52 es el precio de OFERTA ($80 − $28). La pregunta pide el descuento." },
    ],
    hint: {
      en: "35% of 80 = 0.35 × 80. Or: 10% of 80 is 8, so 30% is 24, and 5% is 4.",
      es: "35% de 80 = 0.35 × 80. O: el 10% de 80 es 8, así que el 30% es 24 y el 5% es 4.",
    },
    why: { en: "0.35 × 80 = 28. The discount is $28.", es: "0.35 × 80 = 28. El descuento es $28." },
  },
  {
    id: "p-of-3",
    strand: "of",
    type: "num",
    q: {
      en: "Last year a club had 64 members. This year it has 125% of that number. How many members does the club have this year? Enter the answer.",
      es: "El año pasado un club tenía 64 miembros. Este año tiene el 125% de ese número. ¿Cuántos miembros tiene el club este año? Escribe la respuesta.",
    },
    unit: "",
    answer: of(125, 64),
    traps: [
      { value: 16, en: "16 is 25% of 64. 125% is MORE than 100%, so the answer must be more than 64.", es: "16 es el 25% de 64. El 125% es MÁS que el 100%, así que la respuesta debe ser mayor que 64." },
    ],
    hint: {
      en: "125% = 100% + 25%. 100% of 64 is 64. 25% of 64 is [[1/4]] of 64.",
      es: "125% = 100% + 25%. El 100% de 64 es 64. El 25% de 64 es [[1/4]] de 64.",
    },
    why: { en: "100% of 64 = 64 and 25% of 64 = 16. 64 + 16 = 80 members.", es: "100% de 64 = 64 y 25% de 64 = 16. 64 + 16 = 80 miembros." },
  },
  {
    id: "p-of-4",
    strand: "of",
    type: "num",
    q: {
      en: "A bag has 450 beads. 6% of the beads are gold. How many beads are gold? Enter the answer.",
      es: "Una bolsa tiene 450 cuentas. El 6% de las cuentas son doradas. ¿Cuántas cuentas son doradas? Escribe la respuesta.",
    },
    unit: "",
    answer: of(6, 450),
    traps: [
      { value: 2.7, en: "Check the decimal. 1% of 450 is 4.5, so 6% is about 27, not 2.7.", es: "Revisa el decimal. El 1% de 450 es 4.5, así que el 6% es 27, no 2.7." },
    ],
    hint: { en: "Find 1% first: 450 ÷ 100 = 4.5. Then multiply by 6.", es: "Halla primero el 1%: 450 ÷ 100 = 4.5. Luego multiplica por 6." },
    why: { en: "1% of 450 = 4.5. 6% = 6 × 4.5 = 27 beads.", es: "1% de 450 = 4.5. 6% = 6 × 4.5 = 27 cuentas." },
  },
  {
    id: "p-whole-1",
    strand: "whole",
    type: "num",
    q: { en: "300% of what number is 96? Enter the answer.", es: "¿El 300% de qué número es 96? Escribe la respuesta." },
    unit: "",
    answer: whole(96, 300),
    traps: [
      { value: 288, en: "288 is 300% OF 96. The question says 300% of the unknown number is 96.", es: "288 es el 300% DE 96. La pregunta dice que el 300% del número desconocido es 96." },
    ],
    hint: {
      en: "300% means 3 times the number. Undo it: divide 96 by 3.",
      es: "300% significa 3 veces el número. Deshazlo: divide 96 entre 3.",
    },
    why: { en: "3 × (the number) = 96, so the number is 96 ÷ 3 = 32. Check: 300% of 32 = 96.", es: "3 × (el número) = 96, así que el número es 96 ÷ 3 = 32. Comprueba: 300% de 32 = 96." },
  },
  {
    id: "p-whole-2",
    strand: "whole",
    type: "mc",
    q: {
      en: "The number of students in the drama club makes up 25% of the students in the sixth grade. There are 18 students in the drama club. How many students are in the sixth grade? Choose the correct answer.",
      es: "La cantidad de estudiantes del club de teatro es el 25% de los estudiantes de sexto grado. Hay 18 estudiantes en el club de teatro. ¿Cuántos estudiantes hay en sexto grado? Elige la respuesta correcta.",
    },
    options: [
      { text: "43", ok: false, note: { en: "43 = 18 + 25. A percent is not a number to add.", es: "43 = 18 + 25. Un porcentaje no es un número para sumar." } },
      { text: String(whole(18, 25)), ok: true, note: { en: "25% of 72 = 18. ✓", es: "25% de 72 = 18. ✓" } },
      { text: String(of(25, 18)), ok: false, note: { en: "4.5 is 25% OF 18. Here 18 is the part, so the whole is bigger.", es: "4.5 es el 25% DE 18. Aquí 18 es la parte, así que el total es mayor." } },
      { text: "450", ok: false, note: { en: "450 = 18 × 25. Use 25% as [[1/4]], not as 25.", es: "450 = 18 × 25. Usa 25% como [[1/4]], no como 25." } },
    ],
    hint: {
      en: "18 is 25%, or [[1/4]], of the whole. If one quarter is 18, how much are 4 quarters?",
      es: "18 es el 25%, o [[1/4]], del total. Si un cuarto es 18, ¿cuánto son 4 cuartos?",
    },
    why: { en: "18 is [[1/4]] of the grade. 4 × 18 = 72 students.", es: "18 es [[1/4]] del grado. 4 × 18 = 72 estudiantes." },
  },
  {
    id: "p-whole-3",
    strand: "whole",
    type: "num",
    q: {
      en: "12% of the students in a school are in the band. There are 15 students in the band. How many students are in the school? Enter the answer.",
      es: "El 12% de los estudiantes de una escuela está en la banda. Hay 15 estudiantes en la banda. ¿Cuántos estudiantes hay en la escuela? Escribe la respuesta.",
    },
    unit: "",
    answer: whole(15, 12),
    traps: [
      { value: 1.8, en: "1.8 is 12% OF 15. The school is much bigger than the band.", es: "1.8 es el 12% DE 15. La escuela es mucho más grande que la banda." },
      { value: 180, en: "Check: 12% of 180 is 21.6, not 15. Divide 15 by 12, then multiply by 100.", es: "Comprueba: el 12% de 180 es 21.6, no 15. Divide 15 entre 12 y luego multiplica por 100." },
    ],
    hint: {
      en: "15 is 12%. Find 1%: 15 ÷ 12 = 1.25. Then find 100%.",
      es: "15 es el 12%. Halla el 1%: 15 ÷ 12 = 1.25. Luego halla el 100%.",
    },
    why: { en: "1% = 15 ÷ 12 = 1.25. 100% = 1.25 × 100 = 125 students.", es: "1% = 15 ÷ 12 = 1.25. 100% = 1.25 × 100 = 125 estudiantes." },
  },
  {
    id: "p-whole-4",
    strand: "whole",
    type: "mc",
    q: {
      en: "There are 84 people at a concert today. Everyone has taken a seat, and 30% of the seats are still empty. How many total seats are set up? Choose the correct answer.",
      es: "Hoy hay 84 personas en un concierto. Todos tienen asiento y el 30% de los asientos sigue vacío. ¿Cuántos asientos hay en total? Elige la respuesta correcta.",
    },
    options: [
      { text: "25", ok: false, note: { en: "25 is about 30% OF 84. But 84 is not the whole.", es: "25 es aproximadamente el 30% DE 84. Pero 84 no es el total." } },
      { text: "114", ok: false, note: { en: "114 = 84 + 30. Percents are not added to counts.", es: "114 = 84 + 30. Los porcentajes no se suman a cantidades." } },
      { text: String(whole(84, 70)), ok: true, note: { en: "84 is 70% of 120. ✓", es: "84 es el 70% de 120. ✓" } },
      { text: String(whole(84, 30)), ok: false, note: { en: "280 treats 84 as the 30%. But 84 people fill the other 70%.", es: "280 trata 84 como el 30%. Pero las 84 personas ocupan el otro 70%." } },
    ],
    hint: {
      en: "If 30% of the seats are empty, what percent are filled? Then 84 is that percent of all the seats.",
      es: "Si el 30% de los asientos está vacío, ¿qué porcentaje está ocupado? Entonces 84 es ese porcentaje de todos los asientos.",
    },
    why: {
      en: "Filled seats = 100% − 30% = 70%. 70% is 84, so 10% is 12 and 100% is 120 seats.",
      es: "Asientos ocupados = 100% − 30% = 70%. El 70% es 84, así que el 10% es 12 y el 100% es 120 asientos.",
    },
  },
  {
    id: "p-combine2-1",
    strand: "combine2",
    type: "num",
    q: {
      en: "On Monday, Rosa makes 8 out of 10 free throws. On Tuesday, she makes 17 out of 40 free throws. What percent of her total free throws did Rosa make? Enter the answer.",
      es: "El lunes, Rosa encesta 8 de 10 tiros libres. El martes, encesta 17 de 40 tiros libres. ¿Qué porcentaje de sus tiros libres totales encestó Rosa? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(8 + 17, 10 + 40),
    traps: [
      { value: pct(80 + 42.5, 200), en: "That averages 80% and 42.5%. But Tuesday had 4 times as many shots. Add the makes and the attempts first.", es: "Eso promedia 80% y 42.5%. Pero el martes hubo 4 veces más tiros. Suma primero los encestes y los intentos." },
    ],
    hint: {
      en: "Add the shots made. Add the shots tried. Then write made out of tried as a percent.",
      es: "Suma los tiros encestados. Suma los tiros intentados. Luego escribe encestados de intentados como porcentaje.",
    },
    why: {
      en: "Made: 8 + 17 = 25. Tried: 10 + 40 = 50. [[25/50]] = 50%.",
      es: "Encestados: 8 + 17 = 25. Intentados: 10 + 40 = 50. [[25/50]] = 50%.",
    },
  },
  {
    id: "p-combine2-2",
    strand: "combine2",
    type: "num",
    q: {
      en: "In Room A, 21 of 30 students walk to school. In Room B, 9 of 20 students walk to school. What percent of all these students walk to school? Enter the answer.",
      es: "En el Salón A, 21 de 30 estudiantes caminan a la escuela. En el Salón B, 9 de 20 estudiantes caminan a la escuela. ¿Qué porcentaje de todos estos estudiantes camina a la escuela? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(21 + 9, 30 + 20),
    traps: [
      { value: r((70 + 45) / 2), en: "That averages 70% and 45%. The rooms are different sizes, so add the students first.", es: "Eso promedia 70% y 45%. Los salones son de distinto tamaño, así que suma primero los estudiantes." },
    ],
    hint: {
      en: "Total who walk ÷ total students. Add across both rooms before you make the percent.",
      es: "Total que camina ÷ total de estudiantes. Suma los dos salones antes de calcular el porcentaje.",
    },
    why: { en: "Walk: 21 + 9 = 30. All: 30 + 20 = 50. [[30/50]] = 60%.", es: "Caminan: 21 + 9 = 30. Todos: 30 + 20 = 50. [[30/50]] = 60%." },
  },
  {
    id: "p-estimate-1",
    strand: "estimate",
    type: "mc",
    q: {
      en: "Dev has read 148 of the 300 pages in his book. Which benchmark percent is closest to the part of the book he has read?",
      es: "Dev ha leído 148 de las 300 páginas de su libro. ¿Qué porcentaje de referencia está más cerca de la parte del libro que ha leído?",
    },
    options: [
      { text: "25%", ok: false, note: { en: "25% of 300 is 75. Dev has read about twice that.", es: "El 25% de 300 es 75. Dev ha leído casi el doble." } },
      { text: "50%", ok: true, note: { en: "50% of 300 is 150, very close to 148. ✓", es: "El 50% de 300 es 150, muy cerca de 148. ✓" } },
      { text: "75%", ok: false, note: { en: "75% of 300 is 225. That is far more than 148.", es: "El 75% de 300 es 225. Es mucho más que 148." } },
      { text: "100%", ok: false, note: { en: "100% would be all 300 pages.", es: "El 100% serían las 300 páginas." } },
    ],
    hint: { en: "Find half of 300. Is 148 near it?", es: "Halla la mitad de 300. ¿Está 148 cerca?" },
    why: { en: "Half of 300 is 150, and 148 is just under 150, so about 50%.", es: "La mitad de 300 es 150 y 148 está justo debajo, así que es aproximadamente 50%." },
  },
  {
    id: "p-estimate-2",
    strand: "estimate",
    type: "mc",
    q: {
      en: "Lila needs $240 for a school trip. She has saved $182. About what percent of the money has she saved?",
      es: "Lila necesita $240 para una excursión escolar. Ha ahorrado $182. ¿Aproximadamente qué porcentaje del dinero ha ahorrado?",
    },
    options: [
      { text: "25%", ok: false, note: { en: "25% of $240 is only $60.", es: "El 25% de $240 es solo $60." } },
      { text: "50%", ok: false, note: { en: "50% of $240 is $120. She has more than that.", es: "El 50% de $240 es $120. Ella tiene más que eso." } },
      { text: "75%", ok: true, note: { en: "75% of $240 is $180, very close to $182. ✓", es: "El 75% de $240 es $180, muy cerca de $182. ✓" } },
      { text: "100%", ok: false, note: { en: "100% would be the full $240.", es: "El 100% sería los $240 completos." } },
    ],
    hint: {
      en: "Try 75% = [[3/4]]. A quarter of 240 is 60, so three quarters is…",
      es: "Prueba con 75% = [[3/4]]. Un cuarto de 240 es 60, así que tres cuartos son…",
    },
    why: { en: "[[1/4]] of 240 = 60, so [[3/4]] = 180. $182 is just over $180, so about 75%.", es: "[[1/4]] de 240 = 60, así que [[3/4]] = 180. $182 es un poco más de $180, así que es aproximadamente 75%." },
  },
  {
    id: "p-cr-1",
    strand: "cr",
    type: "cr",
    story: {
      en: "Students signed up for three after-school clubs.",
      es: "Los estudiantes se inscribieron en tres clubes después de clases.",
    },
    table: {
      head: [{ en: "Club", es: "Club" }, { en: "Students who signed up", es: "Estudiantes inscritos" }],
      rows: [["Robotics", "140"], ["Art", "200"], ["Chess", "180"]],
    },
    q: {
      en: "At the end of the month, 25% of the students who signed up for Art did not attend, and 20% of the students who signed up for Chess did not attend. The club advisor claims that at least 20 more students attended Art than Chess. Determine whether the advisor's claim is correct.",
      es: "Al final del mes, el 25% de los estudiantes inscritos en Arte no asistió y el 20% de los estudiantes inscritos en Ajedrez no asistió. El asesor del club afirma que asistieron al menos 20 estudiantes más a Arte que a Ajedrez. Determina si la afirmación del asesor es correcta.",
    },
    steps: [
      { label: { en: "How many students attended Art?", es: "¿Cuántos estudiantes asistieron a Arte?" }, answer: of(75, 200), unit: "" },
      { label: { en: "How many students attended Chess?", es: "¿Cuántos estudiantes asistieron a Ajedrez?" }, answer: of(80, 180), unit: "" },
      { label: { en: "How many MORE students attended Art than Chess?", es: "¿Cuántos estudiantes MÁS asistieron a Arte que a Ajedrez?" }, answer: of(75, 200) - of(80, 180), unit: "" },
    ],
    claim: { en: "The advisor says: “At least 20 more students attended Art than Chess.” Is the claim correct?", es: "El asesor dice: «Asistieron al menos 20 estudiantes más a Arte que a Ajedrez». ¿Es correcta la afirmación?", truth: false },
    rubric: [
      { en: "I used a table, tape diagram, or double number line to show the percent relationships.", es: "Usé una tabla, un diagrama de cinta o una recta numérica doble para mostrar las relaciones de porcentaje." },
      { en: "I found the percent who DID attend (75% and 80%) or the number who did not.", es: "Hallé el porcentaje que SÍ asistió (75% y 80%) o la cantidad que no asistió." },
      { en: "I compared 150 and 144 and wrote the difference.", es: "Comparé 150 y 144 y escribí la diferencia." },
      { en: "I said whether the claim is correct and explained why with numbers.", es: "Dije si la afirmación es correcta y expliqué por qué con números." },
    ],
    model: {
      en: "Art: 75% of 200 attended = 150. Chess: 80% of 180 attended = 144. 150 − 144 = 6. The claim is not correct, because 6 is less than 20.",
      es: "Arte: asistió el 75% de 200 = 150. Ajedrez: asistió el 80% de 180 = 144. 150 − 144 = 6. La afirmación no es correcta, porque 6 es menor que 20.",
    },
    hint: {
      en: "Students who attended = 100% − the percent who did not. Use 75% of 200 and 80% of 180.",
      es: "Estudiantes que asistieron = 100% − el porcentaje que no asistió. Usa 75% de 200 y 80% de 180.",
    },
    why: {
      en: "75% of 200 = 150. 80% of 180 = 144. 150 − 144 = 6, which is less than 20.",
      es: "75% de 200 = 150. 80% de 180 = 144. 150 − 144 = 6, que es menor que 20.",
    },
  },
  {
    id: "p-cr-2",
    strand: "cr",
    type: "cr",
    story: {
      en: "Jordan is saving for a skateboard that costs $398. He has saved $203.",
      es: "Jordan ahorra para una patineta que cuesta $398. Ha ahorrado $203.",
    },
    q: {
      en: "Jordan says he has saved about 50% of the money he needs. Determine whether Jordan's estimate is reasonable. Use benchmark percents, fractions, a table, a tape diagram, or a double number line.",
      es: "Jordan dice que ha ahorrado aproximadamente el 50% del dinero que necesita. Determina si la estimación de Jordan es razonable. Usa porcentajes de referencia, fracciones, una tabla, un diagrama de cinta o una recta numérica doble.",
    },
    steps: [
      { label: { en: "Round $398 to a friendly number. What do you get?", es: "Redondea $398 a un número fácil. ¿Qué obtienes?" }, answer: 400, unit: "$" },
      { label: { en: "What is 50% of that friendly number?", es: "¿Cuánto es el 50% de ese número fácil?" }, answer: of(50, 400), unit: "$" },
    ],
    claim: { en: "Is Jordan's estimate of “about 50%” reasonable?", es: "¿Es razonable la estimación de Jordan de «aproximadamente 50%»?", truth: true },
    rubric: [
      { en: "I rounded $398 to a friendly number ($400).", es: "Redondeé $398 a un número fácil ($400)." },
      { en: "I found a benchmark amount (50% of $400 = $200) and compared it to $203.", es: "Hallé una cantidad de referencia (50% de $400 = $200) y la comparé con $203." },
      { en: "I said the estimate is reasonable and why $203 is close to $200.", es: "Dije que la estimación es razonable y por qué $203 está cerca de $200." },
    ],
    model: {
      en: "$398 is about $400. 50% of $400 is $200. Jordan has $203, which is very close to $200, so “about 50%” is reasonable.",
      es: "$398 es aproximadamente $400. El 50% de $400 es $200. Jordan tiene $203, que está muy cerca de $200, así que «aproximadamente 50%» es razonable.",
    },
    hint: { en: "Round the cost first, then take half.", es: "Redondea primero el costo y luego saca la mitad." },
    why: { en: "50% of about $400 is about $200, and $203 is very close.", es: "El 50% de aproximadamente $400 es aproximadamente $200 y $203 está muy cerca." },
  },
];

/* ---------- Challenge ---------- */

/** @type {any[]} */
export const CHALLENGE = [
  {
    id: "c-tape-1",
    strand: "tape",
    type: "tape",
    tape: { whole: 4, shown: 9 },
    q: {
      en: "The top bar is 100%. What percent does the bottom bar show? The bottom bar is longer than the top bar.",
      es: "La barra de arriba es el 100%. ¿Qué porcentaje muestra la barra de abajo? La barra de abajo es más larga que la de arriba.",
    },
    unit: "%",
    answer: pct(9, 4),
    traps: [
      { value: 9, en: "9 is the number of boxes. Each box is worth 25%.", es: "9 es la cantidad de cuadros. Cada cuadro vale 25%." },
      { value: 25, en: "25% is ONE box. Count all 9.", es: "25% es UN cuadro. Cuenta los 9." },
    ],
    hint: { en: "One box = 100% ÷ 4. Count every box in the bottom bar, even the ones past the top bar.", es: "Un cuadro = 100% ÷ 4. Cuenta todos los cuadros de la barra de abajo, incluso los que pasan de la barra de arriba." },
    why: { en: "One box = 25%. 9 boxes = 9 × 25% = 225%. The bottom bar is more than the whole, so it is more than 100%.", es: "Un cuadro = 25%. 9 cuadros = 9 × 25% = 225%. La barra de abajo es mayor que el total, así que es más del 100%." },
  },
  {
    id: "c-tape-2",
    strand: "tape",
    type: "tape",
    tape: { whole: 8, shown: 1, tiny: true },
    q: {
      en: "The top bar is 100%. The bottom bar is one box that is the same size as one box of the top bar. What percent does it show? Your answer can be a decimal.",
      es: "La barra de arriba es el 100%. La barra de abajo es un cuadro del mismo tamaño que un cuadro de la barra de arriba. ¿Qué porcentaje muestra? Tu respuesta puede ser un decimal.",
    },
    unit: "%",
    answer: pct(1, 8),
    traps: [
      { value: 1, en: "1 is the number of boxes. How much is ONE box of 8 worth?", es: "1 es la cantidad de cuadros. ¿Cuánto vale UN cuadro de 8?" },
      { value: 8, en: "8 is how many boxes are in the whole. One box is 100% ÷ 8.", es: "8 es la cantidad de cuadros del total. Un cuadro es 100% ÷ 8." },
    ],
    hint: { en: "Share 100% equally among 8 boxes.", es: "Reparte el 100% en partes iguales entre 8 cuadros." },
    why: { en: "100% ÷ 8 = 12.5%.", es: "100% ÷ 8 = 12.5%." },
  },
  {
    id: "c-tape-3",
    strand: "tape",
    type: "tape",
    tape: { whole: 5, shown: 7 },
    q: {
      en: "The top bar is 100%. What percent does the bottom bar show? Enter the answer.",
      es: "La barra de arriba es el 100%. ¿Qué porcentaje muestra la barra de abajo? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(7, 5),
    traps: [
      { value: 35, en: "35% is 7 × 5. One box is 100% ÷ 5 = 20%, not 5%.", es: "35% es 7 × 5. Un cuadro es 100% ÷ 5 = 20%, no 5%." },
      { value: 7, en: "7 is the number of boxes, not the percent.", es: "7 es la cantidad de cuadros, no el porcentaje." },
    ],
    hint: { en: "One box = 100% ÷ 5. Multiply by the number of boxes in the bottom bar.", es: "Un cuadro = 100% ÷ 5. Multiplica por la cantidad de cuadros de la barra de abajo." },
    why: { en: "One box = 20%. 7 × 20% = 140%.", es: "Un cuadro = 20%. 7 × 20% = 140%." },
  },
  {
    id: "c-combine-1",
    strand: "combine",
    type: "num",
    q: {
      en: "A class collected 0.85 of its book goal in week 1, [[3/5]] of its goal in week 2, and 0.25 of its goal in week 3. What percent of the goal did the class collect in all? Enter the answer.",
      es: "Una clase reunió 0.85 de su meta de libros en la semana 1, [[3/5]] de su meta en la semana 2 y 0.25 de su meta en la semana 3. ¿Qué porcentaje de la meta reunió la clase en total? Escribe la respuesta.",
    },
    unit: "%",
    answer: r(85 + 60 + 25),
    traps: [
      { value: 1.7, en: "1.7 is the decimal form. The question asks for a percent: multiply by 100.", es: "1.7 es la forma decimal. La pregunta pide un porcentaje: multiplica por 100." },
    ],
    hint: { en: "Convert all three to percents: 0.85 = 85%, [[3/5]] = 60%, 0.25 = 25%. The total can be more than 100%.", es: "Convierte los tres a porcentajes: 0.85 = 85%, [[3/5]] = 60%, 0.25 = 25%. El total puede ser más del 100%." },
    why: { en: "85% + 60% + 25% = 170%. The class went past its goal.", es: "85% + 60% + 25% = 170%. La clase superó su meta." },
  },
  {
    id: "c-combine-2",
    strand: "combine",
    type: "num",
    q: {
      en: "In a library, [[1/8]] of the books are poetry, 0.045 are comics, and [[2/5]] are mysteries. What percent of the books are one of these three kinds? Your answer can be a decimal.",
      es: "En una biblioteca, [[1/8]] de los libros son de poesía, 0.045 son cómics y [[2/5]] son de misterio. ¿Qué porcentaje de los libros es de uno de estos tres tipos? Tu respuesta puede ser un decimal.",
    },
    unit: "%",
    answer: r(12.5 + 4.5 + 40),
    traps: [
      { value: 52.5, en: "0.045 is 4.5%, not 0.045 percent. Move the decimal point two places to the right.", es: "0.045 es 4.5%, no 0.045 por ciento. Mueve el punto decimal dos lugares a la derecha." },
    ],
    hint: { en: "[[1/8]] = 0.125 = 12.5%. 0.045 = 4.5%. [[2/5]] = 40%.", es: "[[1/8]] = 0.125 = 12.5%. 0.045 = 4.5%. [[2/5]] = 40%." },
    why: { en: "12.5% + 4.5% + 40% = 57%.", es: "12.5% + 4.5% + 40% = 57%." },
  },
  {
    id: "c-part-1",
    strand: "part",
    type: "num",
    q: {
      en: "In a poll, 3 out of 8 students chose soccer as their favorite sport. What percent of the students chose soccer? Enter the answer.",
      es: "En una encuesta, 3 de 8 estudiantes eligieron el fútbol como su deporte favorito. ¿Qué porcentaje de los estudiantes eligió el fútbol? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(3, 8),
    traps: [{ value: 37, en: "Close. 3 ÷ 8 = 0.375, so the percent is 37.5%.", es: "Casi. 3 ÷ 8 = 0.375, así que el porcentaje es 37.5%." }],
    hint: { en: "[[1/8]] = 12.5%. Or divide 3 ÷ 8 and move the decimal two places.", es: "[[1/8]] = 12.5%. O divide 3 ÷ 8 y mueve el decimal dos lugares." },
    why: { en: "[[3/8]] = 3 × 12.5% = 37.5%.", es: "[[3/8]] = 3 × 12.5% = 37.5%." },
  },
  {
    id: "c-part-2",
    strand: "part",
    type: "num",
    q: {
      en: "A video has been played 7 times out of every 40 views in a class. 7 out of 40 views is what percent? Your answer can be a decimal.",
      es: "En una clase, un video se reprodujo 7 veces de cada 40 visitas. ¿7 de 40 visitas es qué porcentaje? Tu respuesta puede ser un decimal.",
    },
    unit: "%",
    answer: pct(7, 40),
    traps: [{ value: 17, en: "Close. 7 ÷ 40 = 0.175, so the percent is 17.5%.", es: "Casi. 7 ÷ 40 = 0.175, así que el porcentaje es 17.5%." }],
    hint: { en: "[[1/40]] = 2.5%. Multiply by 7.", es: "[[1/40]] = 2.5%. Multiplica por 7." },
    why: { en: "100% ÷ 40 = 2.5%, and 7 × 2.5% = 17.5%.", es: "100% ÷ 40 = 2.5% y 7 × 2.5% = 17.5%." },
  },
  {
    id: "c-part-3",
    strand: "part",
    type: "num",
    q: {
      en: "A bakery planned to bake 6 trays of bread and baked 9 trays. The trays baked are what percent of the trays planned? Enter the answer.",
      es: "Una panadería planeó hornear 6 bandejas de pan e hizo 9 bandejas. ¿Las bandejas horneadas son qué porcentaje de las bandejas planeadas? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(9, 6),
    traps: [{ value: 67, en: "67% is [[6/9]]. The whole is the PLANNED amount, 6, so divide 9 by 6.", es: "67% es [[6/9]]. El total es lo PLANEADO, 6, así que divide 9 entre 6." }, { value: 66.67, en: "That is [[6/9]]. The whole is the PLANNED amount, 6.", es: "Eso es [[6/9]]. El total es lo PLANEADO, 6." }],
    hint: { en: "Which number is the whole? The part can be bigger than the whole.", es: "¿Cuál número es el total? La parte puede ser mayor que el total." },
    why: { en: "[[9/6]] = 1.5 = 150%.", es: "[[9/6]] = 1.5 = 150%." },
  },
  {
    id: "c-equiv-1",
    strand: "equiv",
    type: "multi",
    q: { en: "Which show equivalent values? Choose all that apply.", es: "¿Cuáles muestran valores equivalentes? Elige todas las que correspondan." },
    options: [
      { text: "0.5% and 0.005", ok: true, note: { en: "0.5% = 0.5 ÷ 100 = 0.005.", es: "0.5% = 0.5 ÷ 100 = 0.005." } },
      { text: "0.5% and [[1/2]]", ok: false, note: { en: "[[1/2]] = 50%. Half of one percent is 0.5%.", es: "[[1/2]] = 50%. La mitad de un por ciento es 0.5%." } },
      { text: "450% and 4.5", ok: true, note: { en: "450% = 450 ÷ 100 = 4.5.", es: "450% = 450 ÷ 100 = 4.5." } },
      { text: "[[7/8]] and 87.5%", ok: true, note: { en: "[[7/8]] = 7 × 12.5% = 87.5%.", es: "[[7/8]] = 7 × 12.5% = 87.5%." } },
      { text: "6% and 0.6", ok: false, note: { en: "6% = 0.06. The decimal 0.6 is 60%.", es: "6% = 0.06. El decimal 0.6 es 60%." } },
      { text: "1.25 and 125%", ok: true, note: { en: "1.25 × 100 = 125%.", es: "1.25 × 100 = 125%." } },
    ],
    hint: { en: "Turn every value into a decimal and compare.", es: "Convierte cada valor en decimal y compara." },
    why: { en: "Equivalent pairs: 0.5% and 0.005; 450% and 4.5; [[7/8]] and 87.5%; 1.25 and 125%.", es: "Pares equivalentes: 0.5% y 0.005; 450% y 4.5; [[7/8]] y 87.5%; 1.25 y 125%." },
  },
  {
    id: "c-equiv-2",
    strand: "equiv",
    type: "multi",
    q: { en: "Which show equivalent values? Choose all that apply.", es: "¿Cuáles muestran valores equivalentes? Elige todas las que correspondan." },
    options: [
      { text: "0.04% and 0.0004", ok: true, note: { en: "0.04% = 0.04 ÷ 100 = 0.0004.", es: "0.04% = 0.04 ÷ 100 = 0.0004." } },
      { text: "0.04% and 0.04", ok: false, note: { en: "0.04 is 4%. 0.04% is 0.0004.", es: "0.04 es 4%. 0.04% es 0.0004." } },
      { text: "330% and 3.3", ok: true, note: { en: "330% = 3.30.", es: "330% = 3.30." } },
      { text: "[[5/40]] and 12.5%", ok: true, note: { en: "[[5/40]] = [[1/8]] = 12.5%.", es: "[[5/40]] = [[1/8]] = 12.5%." } },
      { text: "0.2 and 2%", ok: false, note: { en: "0.2 = 20%. The decimal for 2% is 0.02.", es: "0.2 = 20%. El decimal de 2% es 0.02." } },
      { text: "8% and [[2/25]]", ok: true, note: { en: "[[2/25]] = [[8/100]] = 8%.", es: "[[2/25]] = [[8/100]] = 8%." } },
    ],
    hint: { en: "Write each value as hundredths, or as a decimal, before you compare.", es: "Escribe cada valor en centésimos, o como decimal, antes de comparar." },
    why: { en: "Equivalent pairs: 0.04% and 0.0004; 330% and 3.3; [[5/40]] and 12.5%; 8% and [[2/25]].", es: "Pares equivalentes: 0.04% y 0.0004; 330% y 3.3; [[5/40]] y 12.5%; 8% y [[2/25]]." },
  },
  {
    id: "c-of-1",
    strand: "of",
    type: "num",
    q: {
      en: "A fundraiser has a goal of $360. In the first hour it raises 12.5% of the goal. How many dollars is that? Enter the answer.",
      es: "Una colecta tiene una meta de $360. En la primera hora reúne el 12.5% de la meta. ¿Cuántos dólares es eso? Escribe la respuesta.",
    },
    unit: "$",
    answer: of(12.5, 360),
    traps: [{ value: 4500, en: "Use 12.5% as 0.125, not 12.5.", es: "Usa 12.5% como 0.125, no como 12.5." }],
    hint: { en: "12.5% = [[1/8]]. Find one eighth of 360.", es: "12.5% = [[1/8]]. Halla un octavo de 360." },
    why: { en: "360 ÷ 8 = 45. 12.5% of $360 is $45.", es: "360 ÷ 8 = 45. El 12.5% de $360 es $45." },
  },
  {
    id: "c-of-2",
    strand: "of",
    type: "num",
    q: {
      en: "A recipe calls for 48 grams of flour. A bigger batch uses 175% of that amount. How many grams of flour does the bigger batch use? Enter the answer.",
      es: "Una receta lleva 48 gramos de harina. Una tanda más grande usa el 175% de esa cantidad. ¿Cuántos gramos de harina usa la tanda más grande? Escribe la respuesta.",
    },
    unit: "",
    answer: of(175, 48),
    traps: [{ value: 36, en: "36 is 75% of 48. 175% is more than 100%, so the answer is more than 48.", es: "36 es el 75% de 48. El 175% es más del 100%, así que la respuesta es mayor que 48." }],
    hint: { en: "175% = 100% + 75%. 75% is [[3/4]].", es: "175% = 100% + 75%. El 75% es [[3/4]]." },
    why: { en: "100% of 48 = 48 and 75% of 48 = 36. 48 + 36 = 84 grams.", es: "100% de 48 = 48 y 75% de 48 = 36. 48 + 36 = 84 gramos." },
  },
  {
    id: "c-of-3",
    strand: "of",
    type: "num",
    q: {
      en: "A school has 800 students. 0.5% of the students are absent today. How many students are absent? Enter the answer.",
      es: "Una escuela tiene 800 estudiantes. El 0.5% de los estudiantes está ausente hoy. ¿Cuántos estudiantes están ausentes? Escribe la respuesta.",
    },
    unit: "",
    answer: of(0.5, 800),
    traps: [{ value: 400, en: "400 is 50% of 800. 0.5% is much smaller: half of ONE percent.", es: "400 es el 50% de 800. El 0.5% es mucho menor: la mitad de UN por ciento." }],
    hint: { en: "1% of 800 = 8. 0.5% is half of that.", es: "El 1% de 800 = 8. El 0.5% es la mitad de eso." },
    why: { en: "1% of 800 = 8, so 0.5% = 4 students.", es: "1% de 800 = 8, así que 0.5% = 4 estudiantes." },
  },
  {
    id: "c-whole-1",
    strand: "whole",
    type: "num",
    q: { en: "250% of what number is 90? Enter the answer.", es: "¿El 250% de qué número es 90? Escribe la respuesta." },
    unit: "",
    answer: whole(90, 250),
    traps: [{ value: 225, en: "225 is 250% OF 90. The question asks for the number whose 250% is 90.", es: "225 es el 250% DE 90. La pregunta pide el número cuyo 250% es 90." }],
    hint: { en: "250% = 2.5 times the number. Divide 90 by 2.5.", es: "250% = 2.5 veces el número. Divide 90 entre 2.5." },
    why: { en: "2.5 × (the number) = 90, so the number is 90 ÷ 2.5 = 36.", es: "2.5 × (el número) = 90, así que el número es 90 ÷ 2.5 = 36." },
  },
  {
    id: "c-whole-2",
    strand: "whole",
    type: "num",
    q: { en: "0.5% of what number is 6? Enter the answer.", es: "¿El 0.5% de qué número es 6? Escribe la respuesta." },
    unit: "",
    answer: whole(6, 0.5),
    traps: [{ value: 0.03, en: "0.03 is 0.5% OF 6. Here 6 is the small part, so the whole is large.", es: "0.03 es el 0.5% DE 6. Aquí 6 es la parte pequeña, así que el total es grande." }],
    hint: { en: "If 0.5% is 6, then 1% is 12. How much is 100%?", es: "Si el 0.5% es 6, el 1% es 12. ¿Cuánto es el 100%?" },
    why: { en: "0.5% = 6, so 1% = 12 and 100% = 12 × 100 = 1,200.", es: "0.5% = 6, así que 1% = 12 y 100% = 12 × 100 = 1,200." },
  },
  {
    id: "c-whole-3",
    strand: "whole",
    type: "num",
    q: {
      en: "A hoodie is on sale for 20% off. The sale price is $64. What was the original price of the hoodie? Enter the answer.",
      es: "Una sudadera está en oferta con 20% de descuento. El precio de oferta es $64. ¿Cuál era el precio original de la sudadera? Escribe la respuesta.",
    },
    unit: "$",
    answer: whole(64, 80),
    traps: [
      { value: 76.8, en: "That adds 20% to $64. But the $64 is already 80% of the original, not 100%.", es: "Eso suma 20% a $64. Pero los $64 ya son el 80% del original, no el 100%." },
      { value: 84, en: "That adds $20 to $64. Percents are not dollars.", es: "Eso suma $20 a $64. Los porcentajes no son dólares." },
    ],
    hint: { en: "After 20% off, you pay what percent of the original? $64 is that percent.", es: "Después de 20% de descuento, ¿qué porcentaje del original pagas? $64 es ese porcentaje." },
    why: { en: "$64 is 80% of the original. 10% = $8, so 100% = $80.", es: "$64 es el 80% del original. El 10% = $8, así que el 100% = $80." },
  },
  {
    id: "c-whole-4",
    strand: "whole",
    type: "mc",
    q: {
      en: "A theater sold 52 tickets for tonight. 35% of the tickets are still unsold. How many tickets are there in all? Choose the correct answer.",
      es: "Un teatro vendió 52 boletos para esta noche. El 35% de los boletos sigue sin venderse. ¿Cuántos boletos hay en total? Elige la respuesta correcta.",
    },
    options: [
      { text: "18", ok: false, note: { en: "18 is about 35% OF 52. 52 is not the whole.", es: "18 es aproximadamente el 35% DE 52. 52 no es el total." } },
      { text: "87", ok: false, note: { en: "87 = 52 + 35. Do not add a percent to a count.", es: "87 = 52 + 35. No sumes un porcentaje a una cantidad." } },
      { text: String(whole(52, 65)), ok: true, note: { en: "52 is 65% of 80. ✓", es: "52 es el 65% de 80. ✓" } },
      { text: "149", ok: false, note: { en: "149 treats 52 as the 35%. 52 tickets are the 65% that sold.", es: "149 trata 52 como el 35%. Los 52 boletos son el 65% que se vendió." } },
    ],
    hint: { en: "If 35% are unsold, 52 is what percent of all the tickets?", es: "Si el 35% no se vendió, ¿52 es qué porcentaje de todos los boletos?" },
    why: { en: "Sold = 100% − 35% = 65%. 65% = 52, so 5% = 4 and 100% = 80 tickets.", es: "Vendidos = 100% − 35% = 65%. 65% = 52, así que 5% = 4 y 100% = 80 boletos." },
  },
  {
    id: "c-combine2-1",
    strand: "combine2",
    type: "num",
    q: {
      en: "A team made 11 of 20 shots in Game 1, 19 of 30 shots in Game 2, and 14 of 50 shots in Game 3. What percent of all its shots did the team make? Enter the answer.",
      es: "Un equipo encestó 11 de 20 tiros en el Juego 1, 19 de 30 tiros en el Juego 2 y 14 de 50 tiros en el Juego 3. ¿Qué porcentaje de todos sus tiros encestó el equipo? Escribe la respuesta.",
    },
    unit: "%",
    answer: pct(11 + 19 + 14, 20 + 30 + 50),
    traps: [{ value: pct(55 + pct(19, 30) + 28, 3), en: "That averages the three game percents. The games had different numbers of shots, so add the makes and the shots first.", es: "Eso promedia los porcentajes de los tres juegos. Los juegos tuvieron distinta cantidad de tiros, así que suma primero los encestes y los tiros." }],
    hint: { en: "Add all the made shots. Add all the shots taken. Then make a percent.", es: "Suma todos los tiros encestados. Suma todos los tiros intentados. Luego calcula el porcentaje." },
    why: { en: "Made: 11 + 19 + 14 = 44. Taken: 20 + 30 + 50 = 100. [[44/100]] = 44%.", es: "Encestados: 11 + 19 + 14 = 44. Intentados: 20 + 30 + 50 = 100. [[44/100]] = 44%." },
  },
  {
    id: "c-combine2-2",
    strand: "combine2",
    type: "num",
    q: {
      en: "On Quiz 1, Mateo got 18 of 24 points. On Quiz 2, he got 12 of 36 points. What percent of all the possible points did Mateo earn? Your answer can be a decimal.",
      es: "En el Examen 1, Mateo obtuvo 18 de 24 puntos. En el Examen 2, obtuvo 12 de 36 puntos. ¿Qué porcentaje de todos los puntos posibles obtuvo Mateo? Tu respuesta puede ser un decimal.",
    },
    unit: "%",
    answer: pct(18 + 12, 24 + 36),
    traps: [{ value: r((75 + pct(12, 36)) / 2), en: "That averages 75% and 33.3…%. The quizzes are worth different points, so add the points first.", es: "Eso promedia 75% y 33.3…%. Los exámenes valen distintos puntos, así que suma primero los puntos." }],
    hint: { en: "Points earned ÷ points possible, across both quizzes.", es: "Puntos obtenidos ÷ puntos posibles, en los dos exámenes." },
    why: { en: "Earned: 18 + 12 = 30. Possible: 24 + 36 = 60. [[30/60]] = 50%.", es: "Obtenidos: 18 + 12 = 30. Posibles: 24 + 36 = 60. [[30/60]] = 50%." },
  },
  {
    id: "c-estimate-1",
    strand: "estimate",
    type: "mc",
    q: {
      en: "Of 603 voters, 148 chose Option A. Which benchmark percent is closest to the share who chose Option A?",
      es: "De 603 votantes, 148 eligieron la Opción A. ¿Qué porcentaje de referencia está más cerca de la parte que eligió la Opción A?",
    },
    options: [
      { text: "10%", ok: false, note: { en: "10% of 603 is about 60. 148 is more than double that.", es: "El 10% de 603 es aproximadamente 60. 148 es más del doble." } },
      { text: "25%", ok: true, note: { en: "603 ≈ 600 and 25% of 600 is 150, close to 148. ✓", es: "603 ≈ 600 y el 25% de 600 es 150, cerca de 148. ✓" } },
      { text: "50%", ok: false, note: { en: "50% of 603 is about 300. That is double 148.", es: "El 50% de 603 es aproximadamente 300. Eso es el doble de 148." } },
      { text: "75%", ok: false, note: { en: "75% of 603 is about 450. Far too large.", es: "El 75% de 603 es aproximadamente 450. Es demasiado." } },
    ],
    hint: { en: "Round 603 to 600. What is [[1/4]] of 600?", es: "Redondea 603 a 600. ¿Cuánto es [[1/4]] de 600?" },
    why: { en: "603 ≈ 600. [[1/4]] of 600 = 150 ≈ 148. About 25%.", es: "603 ≈ 600. [[1/4]] de 600 = 150 ≈ 148. Aproximadamente 25%." },
  },
  {
    id: "c-estimate-2",
    strand: "estimate",
    type: "mc",
    q: {
      en: "A meal costs $59.75. About how much is a 20% tip? Choose the best estimate.",
      es: "Una comida cuesta $59.75. ¿Aproximadamente cuánto es una propina del 20%? Elige la mejor estimación.",
    },
    options: [
      { text: "$6", ok: false, note: { en: "$6 is about 10%. 20% is double that.", es: "$6 es aproximadamente el 10%. El 20% es el doble." } },
      { text: "$12", ok: true, note: { en: "$59.75 ≈ $60. 10% = $6, so 20% = $12. ✓", es: "$59.75 ≈ $60. El 10% = $6, así que el 20% = $12. ✓" } },
      { text: "$15", ok: false, note: { en: "$15 is 25% of $60.", es: "$15 es el 25% de $60." } },
      { text: "$20", ok: false, note: { en: "$20 is about one third of $60.", es: "$20 es aproximadamente un tercio de $60." } },
    ],
    hint: { en: "Round to $60. Find 10%, then double it.", es: "Redondea a $60. Halla el 10% y luego duplícalo." },
    why: { en: "$59.75 ≈ $60. 10% of $60 = $6. 20% = 2 × $6 = $12.", es: "$59.75 ≈ $60. El 10% de $60 = $6. El 20% = 2 × $6 = $12." },
  },
  {
    id: "c-cr-1",
    strand: "cr",
    type: "cr",
    story: {
      en: "Three schools reported their enrollment last year. Since then, two of them changed.",
      es: "Tres escuelas informaron su matrícula del año pasado. Desde entonces, dos cambiaron.",
    },
    table: {
      head: [{ en: "School", es: "Escuela" }, { en: "Students last year", es: "Estudiantes el año pasado" }],
      rows: [["Birch", "140"], ["Cedar", "360"], ["Elm", "200"]],
    },
    q: {
      en: "This year, Birch enrollment went up 25% and Cedar enrollment went down 20%. A reporter claims that Cedar now has at least 100 more students than Birch. Determine whether the reporter's claim is correct.",
      es: "Este año, la matrícula de Birch subió 25% y la de Cedar bajó 20%. Un reportero afirma que Cedar ahora tiene al menos 100 estudiantes más que Birch. Determina si la afirmación del reportero es correcta.",
    },
    steps: [
      { label: { en: "How many students does Birch have this year?", es: "¿Cuántos estudiantes tiene Birch este año?" }, answer: of(125, 140), unit: "" },
      { label: { en: "How many students does Cedar have this year?", es: "¿Cuántos estudiantes tiene Cedar este año?" }, answer: of(80, 360), unit: "" },
      { label: { en: "How many MORE students does Cedar have than Birch?", es: "¿Cuántos estudiantes MÁS tiene Cedar que Birch?" }, answer: of(80, 360) - of(125, 140), unit: "" },
    ],
    claim: { en: "The reporter says: “Cedar has at least 100 more students than Birch.” Is the claim correct?", es: "El reportero dice: «Cedar tiene al menos 100 estudiantes más que Birch». ¿Es correcta la afirmación?", truth: true },
    rubric: [
      { en: "I used 125% for the increase and 80% for the decrease.", es: "Usé 125% para el aumento y 80% para la disminución." },
      { en: "I showed the percent relationships in a table, tape diagram, or double number line.", es: "Mostré las relaciones de porcentaje en una tabla, un diagrama de cinta o una recta numérica doble." },
      { en: "I found 175 and 288 and the difference, 113.", es: "Hallé 175 y 288 y la diferencia, 113." },
      { en: "I said the claim is correct because 113 is at least 100.", es: "Dije que la afirmación es correcta porque 113 es al menos 100." },
    ],
    model: {
      en: "Birch: 125% of 140 = 175. Cedar: 80% of 360 = 288. 288 − 175 = 113. The claim is correct, because 113 is at least 100.",
      es: "Birch: 125% de 140 = 175. Cedar: 80% de 360 = 288. 288 − 175 = 113. La afirmación es correcta, porque 113 es al menos 100.",
    },
    hint: { en: "Up 25% means 125% of last year. Down 20% means 80% of last year. Elm did not change.", es: "Subir 25% significa 125% del año pasado. Bajar 20% significa 80% del año pasado. Elm no cambió." },
    why: { en: "125% of 140 = 175. 80% of 360 = 288. 288 − 175 = 113 ≥ 100.", es: "125% de 140 = 175. 80% de 360 = 288. 288 − 175 = 113 ≥ 100." },
  },
  {
    id: "c-cr-2",
    strand: "cr",
    type: "cr",
    story: {
      en: "Lena needs $480 for a trip. She has saved $290.",
      es: "Lena necesita $480 para un viaje. Ha ahorrado $290.",
    },
    q: {
      en: "Lena says she has saved about 75% of the money she needs. Determine whether Lena's estimate is reasonable. Use benchmark percents, fractions, a table, a tape diagram, or a double number line to support your conclusion.",
      es: "Lena dice que ha ahorrado aproximadamente el 75% del dinero que necesita. Determina si la estimación de Lena es razonable. Usa porcentajes de referencia, fracciones, una tabla, un diagrama de cinta o una recta numérica doble para apoyar tu conclusión.",
    },
    steps: [
      { label: { en: "What is 75% of $480?", es: "¿Cuánto es el 75% de $480?" }, answer: of(75, 480), unit: "$" },
      { label: { en: "What is 50% of $480?", es: "¿Cuánto es el 50% de $480?" }, answer: of(50, 480), unit: "$" },
    ],
    claim: { en: "Is Lena's estimate of “about 75%” reasonable?", es: "¿Es razonable la estimación de Lena de «aproximadamente 75%»?", truth: false },
    rubric: [
      { en: "I found benchmark amounts: 75% of $480 = $360 and 50% of $480 = $240.", es: "Hallé cantidades de referencia: 75% de $480 = $360 y 50% de $480 = $240." },
      { en: "I compared $290 to both and saw it is closer to $240 than to $360.", es: "Comparé $290 con ambas y vi que está más cerca de $240 que de $360." },
      { en: "I said the estimate is not reasonable and gave a better estimate (about 60%).", es: "Dije que la estimación no es razonable y di una mejor (aproximadamente 60%)." },
    ],
    model: {
      en: "75% of $480 = $360, but Lena has only $290. 50% of $480 = $240, and $290 is closer to $240 than to $360. About 60% is a better estimate, so “about 75%” is not reasonable.",
      es: "El 75% de $480 = $360, pero Lena solo tiene $290. El 50% de $480 = $240 y $290 está más cerca de $240 que de $360. Aproximadamente 60% es una mejor estimación, así que «aproximadamente 75%» no es razonable.",
    },
    hint: { en: "Find 75% of $480 and compare it with $290.", es: "Halla el 75% de $480 y compáralo con $290." },
    why: { en: "75% of $480 = $360, which is $70 more than $290. The estimate is too high.", es: "El 75% de $480 = $360, que es $70 más que $290. La estimación es demasiado alta." },
  },
];

export const PAGES = {
  practice: {
    slug: "unit-4-test-practice",
    items: PRACTICE,
    title: { en: "Unit 4 Test Practice", es: "Práctica para el examen de la Unidad 4" },
    sub: { en: "Grade 6 · Percents · Practice", es: "6.° grado · Porcentajes · Práctica" },
    pitch: {
      en: "Every kind of question on the Unit 4 test, with new numbers. Try it, use a hint if you are stuck, and see why each answer works.",
      es: "Todos los tipos de preguntas del examen de la Unidad 4, con números nuevos. Inténtalo, usa una pista si te atoras y mira por qué funciona cada respuesta.",
    },
  },
  challenge: {
    slug: "unit-4-test-practice-challenge",
    items: CHALLENGE,
    title: { en: "Unit 4 Test Practice · Challenge", es: "Práctica para el examen de la Unidad 4 · Desafío" },
    sub: { en: "Grade 6 · Percents · Challenge", es: "6.° grado · Porcentajes · Desafío" },
    pitch: {
      en: "The same Unit 4 test skills with harder numbers: percents over 100%, percents under 1%, decimals in the answer, and multi-step claims.",
      es: "Las mismas destrezas del examen de la Unidad 4 con números más difíciles: porcentajes mayores que 100%, menores que 1%, decimales en la respuesta y afirmaciones de varios pasos.",
    },
  },
};

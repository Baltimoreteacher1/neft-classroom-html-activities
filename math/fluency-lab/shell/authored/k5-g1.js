// Grade 1 — authored explanations. Short sentences; ten-frames, number lines and tens-and-ones pictures.
import {
  L,
  binop,
  compareEqual,
  compareReversed,
  compareWholes,
  hourStuck,
  isNum,
  laterTime,
  minutesOver60,
  mis,
  nums,
  placeQuestion,
  q,
} from "./k5-kit.js";
import { G0 } from "./k5-g0.js";
import { equalSharesModel, shapesModel } from "./lm-k2.js";

// Shared by Grade 1 and Grade 2 (one wording for one idea) ----------------------------------------------------------
export const addDetectors = [
  mis(
    "counted-start",
    (item, raw) => {
      const p = binop(item);
      return p && p[1] === "+" && p[2] > 0 && isNum(raw, p[0] + p[2] - 1);
    },
    "One less than the sum. When you count on, start with the NEXT number: for 28 + 3, say “29, 30, 31”.",
    "Uno menos que la suma. Cuando cuentes hacia adelante, empieza con el número SIGUIENTE: para 28 + 3, di «29, 30, 31».",
  ),
  mis(
    "ones-only",
    (item, raw) => {
      const p = binop(item);
      return (
        p && p[1] === "+" && p[0] + p[2] > 10 && isNum(raw, (p[0] + p[2]) % 10)
      );
    },
    "You kept only the ones. The sum is more than 10: fill a ten first, then add what is left. 10 and some more is a number from 11 to 19.",
    "Te quedaste solo con las unidades. La suma es más de 10: primero completa una decena y luego suma lo que queda. 10 y algo más es un número del 11 al 19.",
  ),
  mis(
    "subtracted",
    (item, raw) => {
      const p = binop(item);
      return (
        p && p[1] === "+" && p[0] > p[2] && p[2] > 0 && isNum(raw, p[0] - p[2])
      );
    },
    "That is a take-away answer. The sign is +, so put the two groups together. The answer is bigger than both numbers.",
    "Esa es una respuesta de quitar. El signo es +, así que junta los dos grupos. La respuesta es mayor que los dos números.",
  ),
];
export const subDetectors = [
  mis(
    "added",
    (item, raw) => {
      const p = binop(item);
      return p && p[1] === "-" && p[2] > 0 && isNum(raw, p[0] + p[2]);
    },
    "You added. The sign is −, so take away. The answer is smaller than the first number.",
    "Sumaste. El signo es −, así que quita. La respuesta es menor que el primer número.",
  ),
  mis(
    "smaller-from-larger",
    (item, raw) => {
      const p = binop(item);
      if (!p || p[1] !== "-") return false;
      const [a, , b] = p;
      return (
        a >= 10 &&
        a < 20 &&
        b < 10 &&
        a % 10 < b &&
        isNum(raw, 10 + (b - (a % 10)))
      );
    },
    "You took the small ones digit from the big one, the wrong way round. You cannot take that many ones away yet: take them from the ten instead. 34 − 6: 34 − 4 = 30, then 30 − 2 = 28.",
    "Restaste el dígito pequeño de las unidades al revés. Todavía no puedes quitar tantas unidades: quítalas de la decena. 34 − 6: 34 − 4 = 30 y luego 30 − 2 = 28.",
  ),
  mis(
    "counted-start",
    (item, raw) => {
      const p = binop(item);
      return p && p[1] === "-" && p[2] > 0 && isNum(raw, p[0] - p[2] + 1);
    },
    "One too many. When you count back, do not count the first number: for 32 − 3, say “31, 30, 29”.",
    "Una de más. Cuando cuentes hacia atrás, no cuentes el primer número: para 32 − 3, di «31, 30, 29».",
  ),
];
export const placeDetectors = [
  mis(
    "digit-for-value",
    (item, raw) => {
      const p = placeQuestion(item);
      return p && p.value && p.place > 1 && p.digit > 0 && isNum(raw, p.digit);
    },
    "That is the DIGIT. The question asks for its VALUE: how much the digit is worth in its place. A 6 in the tens place is worth 6 tens, which is 60.",
    "Ese es el DÍGITO. La pregunta pide su VALOR: cuánto vale el dígito en su lugar. Un 6 en el lugar de las decenas vale 6 decenas, que son 60.",
  ),
  mis(
    "value-for-digit",
    (item, raw) => {
      const p = placeQuestion(item);
      return (
        p &&
        !p.value &&
        p.place > 1 &&
        p.digit > 0 &&
        isNum(raw, p.digit * p.place)
      );
    },
    "That is the VALUE of the digit. The question asks only for the DIGIT: the single number written in that place.",
    "Ese es el VALOR del dígito. La pregunta pide solo el DÍGITO: el número que está escrito en ese lugar.",
  ),
  mis(
    "wrong-place",
    (item, raw) => {
      const p = placeQuestion(item);
      if (!p) return false;
      return [p.place * 10, p.place / 10].some((n) => {
        if (n < 1 || p.digitAt(n) === p.digit) return false;
        const d = p.digitAt(n);
        return isNum(raw, p.value ? d * n : d) || isNum(raw, d);
      });
    },
    "You read the digit next door. Name the places from the right: ones, tens, hundreds, thousands. Put your finger on the place the question names.",
    "Leíste el dígito de al lado. Nombra los lugares desde la derecha: unidades, decenas, centenas, millares. Pon el dedo en el lugar que pide la pregunta.",
  ),
];
export const timeDetectors = [
  mis(
    "minutes-over-60",
    (item, raw) => minutesOver60(laterTime(item), raw),
    "An hour has only 60 minutes, so the minutes never go past :59. When you reach 60 minutes, the hour goes up by 1 and the minutes start again at :00.",
    "Una hora tiene solo 60 minutos, así que los minutos nunca pasan de :59. Cuando llegas a 60 minutos, la hora sube 1 y los minutos vuelven a empezar en :00.",
  ),
  mis(
    "hour-stuck",
    (item, raw) => hourStuck(laterTime(item), raw),
    "The minutes went past the top of the clock, so a new hour began. Add 1 to the hour.",
    "Los minutos pasaron por arriba del reloj, así que empezó una hora nueva. Súmale 1 a la hora.",
  ),
];

export const G1 = {
  "1:count-patterns": {
    title: L(
      "Count by 1s, 2s, 5s and 10s",
      "Cuenta de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10",
    ),
    concept: L(
      "Skip-counting means jumping by the same amount every time. Find the size of the jump, then make one more jump.",
      "Contar saltando significa saltar la misma cantidad cada vez. Busca el tamaño del salto y luego da un salto más.",
    ),
    reasons: [
      L(
        "Look at two numbers next to each other. How far apart are they?",
        "Mira dos números que están juntos. ¿Qué tan separados están?",
      ),
      L(
        "Every jump is the same size.",
        "Todos los saltos son del mismo tamaño.",
      ),
      L(
        "So the next number is one more jump from the last number.",
        "Así que el siguiente número está a un salto más del último.",
      ),
    ],
    misconception: L(
      "Do not just add 1. Use the same jump the pattern uses.",
      "No sumes solo 1. Usa el mismo salto que usa el patrón.",
    ),
    misconceptions: [
      mis(
        "by-ones",
        (item, raw) => {
          const n = nums(q(item));
          return (
            n.length >= 2 &&
            n.at(-1) - n.at(-2) !== 1 &&
            isNum(raw, n.at(-1) + 1)
          );
        },
        "You counted on by 1. This pattern jumps by a bigger amount each time. Find the jump between two numbers and use it.",
        "Contaste de 1 en 1. Este patrón salta una cantidad más grande cada vez. Busca el salto entre dos números y úsalo.",
      ),
      mis(
        "repeat-last",
        (item, raw) => isNum(raw, nums(q(item)).at(-1)),
        "That is the last number shown. Make one more jump from it.",
        "Ese es el último número que se ve. Da un salto más desde ahí.",
      ),
    ],
    transfer: {
      prompt: L(
        "Each nickel is 5 cents. Jo counts 4 nickels: 5, 10, 15, 20. Then Jo finds 1 more nickel. How many cents now?",
        "Cada moneda de 5 centavos vale 5 centavos. Jo cuenta 4 monedas: 5, 10, 15, 20. Luego Jo encuentra 1 moneda más. ¿Cuántos centavos hay ahora?",
      ),
      answers: ["25"],
      kind: "number",
      unit: L("cents", "centavos"),
      hint: L("Each nickel is one jump of 5.", "Cada moneda es un salto de 5."),
      explanation: L(
        "One more jump of 5 after 20 is 25. 20 + 5 = 25.",
        "Un salto más de 5 después de 20 es 25. 20 + 5 = 25.",
      ),
    },
  },
  "1:tens-ones": {
    concept: L(
      "A two-digit number is made of tens and ones. The left digit tells how many tens. The right digit tells how many ones.",
      "Un número de dos dígitos está hecho de decenas y unidades. El dígito de la izquierda dice cuántas decenas. El de la derecha dice cuántas unidades.",
    ),
    reasons: [
      L(
        "Ten ones can be bundled into one ten.",
        "Diez unidades se pueden juntar en una decena.",
      ),
      L(
        "A 4 in the tens place means 4 tens, which is 40.",
        "Un 4 en el lugar de las decenas significa 4 decenas, que son 40.",
      ),
      L(
        "The digit is the count of tens; the value is what those tens are worth.",
        "El dígito es cuántas decenas hay; el valor es lo que valen esas decenas.",
      ),
    ],
    misconception: L(
      "A digit and its value are different. When the tens digit is 4, its value is 40.",
      "Un dígito y su valor son diferentes. Cuando el dígito de las decenas es 4, su valor es 40.",
    ),
    misconceptions: placeDetectors,
    transfer: {
      prompt: L(
        "Pencils come in boxes of 10. Ms. Lee has 4 boxes and 7 loose pencils. How many pencils does she have?",
        "Los lápices vienen en cajas de 10. La maestra Lee tiene 4 cajas y 7 lápices sueltos. ¿Cuántos lápices tiene?",
      ),
      answers: ["47"],
      kind: "number",
      hint: L("4 boxes is 4 tens.", "4 cajas son 4 decenas."),
      explanation: L(
        "4 tens and 7 ones: 40 + 7 = 47.",
        "4 decenas y 7 unidades: 40 + 7 = 47.",
      ),
    },
  },
  "1:compare-100": {
    title: L(
      "Which is more? Compare numbers to 100",
      "¿Cuál es más? Compara números hasta 100",
    ),
    concept: L(
      "To compare two-digit numbers, compare the tens first. More tens means a bigger number. If the tens are the same, compare the ones.",
      "Para comparar números de dos dígitos, compara primero las decenas. Más decenas es un número mayor. Si las decenas son iguales, compara las unidades.",
    ),
    reasons: [
      L(
        "One ten is more than any number of loose ones up to 9.",
        "Una decena es más que cualquier cantidad de unidades sueltas hasta 9.",
      ),
      L("So the tens decide first.", "Por eso las decenas deciden primero."),
      L(
        "The open side of < or > faces the bigger number.",
        "El lado abierto de < o > mira al número mayor.",
      ),
    ],
    misconception: L(
      "Do not compare the ones first. 39 has more ones than 41, but 41 has more tens, so 41 is bigger.",
      "No compares primero las unidades. 39 tiene más unidades que 41, pero 41 tiene más decenas, así que 41 es mayor.",
    ),
    misconceptions: [
      compareReversed(compareWholes),
      compareEqual(compareWholes),
    ],
    transfer: {
      prompt: L(
        "The red team scored 58 points. The blue team scored 85 points. Which team scored more, red or blue?",
        "El equipo rojo anotó 58 puntos. El equipo azul anotó 85 puntos. ¿Qué equipo anotó más, el rojo o el azul?",
      ),
      answers: ["blue", "blue team", "azul", "el azul", "equipo azul"],
      kind: "text",
      hint: L(
        "Compare the tens: 5 tens or 8 tens?",
        "Compara las decenas: ¿5 decenas u 8 decenas?",
      ),
      explanation: L(
        "85 has 8 tens and 58 has 5 tens, so 85 > 58. Blue scored more.",
        "85 tiene 8 decenas y 58 tiene 5 decenas, así que 85 > 58. El azul anotó más.",
      ),
    },
  },
  "1:add-10": {
    title: L("Add within 10", "Suma hasta 10"),
    concept: L(
      "Adding joins two groups into one group. Start with the bigger number and count on the smaller one.",
      "Sumar junta dos grupos en uno. Empieza con el número mayor y cuenta hacia adelante el menor.",
    ),
    reasons: [
      L(
        "Order does not change the total: 2 + 7 = 7 + 2.",
        "El orden no cambia el total: 2 + 7 = 7 + 2.",
      ),
      L(
        "Starting with the bigger number means fewer counts.",
        "Empezar con el número mayor significa contar menos.",
      ),
      L(
        "On a number line, each count is one jump to the right.",
        "En la recta numérica, cada conteo es un salto a la derecha.",
      ),
    ],
    misconception: L(
      "When you count on, start with the NEXT number. For 27 + 2, say “28, 29”, not “27, 28”.",
      "Cuando cuentes hacia adelante, empieza con el número SIGUIENTE. Para 27 + 2, di «28, 29», no «27, 28».",
    ),
    misconceptions: addDetectors.filter((m) => m.id !== "ones-only"),
    transfer: {
      prompt: L(
        "Kai picks 6 red apples and 3 green apples. How many apples does Kai pick?",
        "Kai recoge 6 manzanas rojas y 3 manzanas verdes. ¿Cuántas manzanas recoge Kai?",
      ),
      answers: ["9"],
      kind: "number",
      hint: L("Start at 6 and count on 3.", "Empieza en 6 y cuenta 3 más."),
      explanation: L(
        "6, then 7, 8, 9. 6 + 3 = 9.",
        "6, luego 7, 8, 9. 6 + 3 = 9.",
      ),
    },
  },
  "1:subtract-10": {
    title: L("Take away within 10", "Resta hasta 10"),
    concept: L(
      "Subtracting finds what is left after some are taken away. It also finds how far apart two numbers are.",
      "Restar encuentra lo que queda después de quitar algunos. También encuentra qué tan separados están dos números.",
    ),
    reasons: [
      L(
        "Take away: start at the first number and count back.",
        "Quitar: empieza en el primer número y cuenta hacia atrás.",
      ),
      L(
        "Or think addition: 10 − 8 is “8 and what make 10?”",
        "O piensa en una suma: 10 − 8 es «¿8 y cuánto hacen 10?»",
      ),
      L(
        "The answer is smaller than the first number.",
        "La respuesta es menor que el primer número.",
      ),
    ],
    misconception: L(
      "Watch the sign. − means take away, so the answer gets smaller, not bigger.",
      "Mira el signo. − significa quitar, así que la respuesta se hace más pequeña, no más grande.",
    ),
    misconceptions: subDetectors,
    transfer: {
      prompt: L(
        "There are 9 cookies on a plate. The class eats 4 of them. How many cookies are left?",
        "Hay 9 galletas en un plato. La clase se come 4. ¿Cuántas galletas quedan?",
      ),
      answers: ["5"],
      kind: "number",
      hint: L("4 and how many make 9?", "¿4 y cuántas hacen 9?"),
      explanation: L(
        "4 and 5 make 9, so 5 are left. 9 − 4 = 5.",
        "4 y 5 hacen 9, así que quedan 5. 9 − 4 = 5.",
      ),
    },
  },
  "1:make-10": {
    concept: L(
      "Two numbers that make 10 are partners. If you know one partner, the other one fills the rest of the ten-frame.",
      "Dos números que hacen 10 son compañeros. Si sabes un compañero, el otro llena el resto del marco de diez.",
    ),
    reasons: [
      L(
        "A ten-frame always has 10 boxes.",
        "Un marco de diez siempre tiene 10 casillas.",
      ),
      L(
        "Full boxes plus empty boxes is always 10.",
        "Casillas llenas más casillas vacías siempre son 10.",
      ),
      L(
        "So the partner is the number of empty boxes.",
        "Así que el compañero es el número de casillas vacías.",
      ),
    ],
    misconception: G0["0:compose-10"].misconception,
    misconceptions: G0["0:compose-10"].misconceptions,
    transfer: {
      prompt: L(
        "An egg carton holds 10 eggs. It has 7 eggs in it. How many more eggs will fill it?",
        "Un cartón de huevos tiene lugar para 10 huevos. Tiene 7 huevos. ¿Cuántos huevos más lo llenan?",
      ),
      answers: ["3"],
      kind: "number",
      hint: L("7 and what make 10?", "¿7 y cuánto hacen 10?"),
      explanation: L(
        "7 and 3 are partners of 10. 7 + 3 = 10.",
        "7 y 3 son compañeros del 10. 7 + 3 = 10.",
      ),
    },
  },
  "1:add-20": {
    title: L("Add within 20", "Suma hasta 20"),
    concept: L(
      "To add past 10, make a ten first. Move ones from one number to fill a ten, then add what is left.",
      "Para sumar pasando el 10, primero forma una decena. Pasa unidades de un número para llenar una decena y luego suma lo que queda.",
    ),
    reasons: [
      L(
        "8 + 5: 8 needs 2 more to make 10.",
        "8 + 5: al 8 le faltan 2 para hacer 10.",
      ),
      L("Take 2 from the 5. That leaves 3.", "Toma 2 del 5. Quedan 3."),
      L(
        "Now it is 10 and 3 more. The total did not change, only the groups.",
        "Ahora es 10 y 3 más. El total no cambió, solo los grupos.",
      ),
    ],
    misconception: L(
      "A sum over 10 has a ten in it. Do not drop the ten: 10 and 3 more is 13, not 3.",
      "Una suma mayor que 10 tiene una decena. No pierdas la decena: 10 y 3 más es 13, no 3.",
    ),
    misconceptions: addDetectors,
    transfer: {
      prompt: L(
        "A team has 8 players on the field and 7 players on the bench. How many players are on the team?",
        "Un equipo tiene 8 jugadores en el campo y 7 jugadores en la banca. ¿Cuántos jugadores tiene el equipo?",
      ),
      answers: ["15"],
      kind: "number",
      hint: L(
        "8 needs 2 to make 10. Take 2 from the 7.",
        "Al 8 le faltan 2 para 10. Toma 2 del 7.",
      ),
      explanation: L(
        "8 + 2 = 10, and 5 are left: 10 + 5 = 15. So 8 + 7 = 15.",
        "8 + 2 = 10 y quedan 5: 10 + 5 = 15. Así que 8 + 7 = 15.",
      ),
    },
  },
  "1:missing-addend": {
    concept: L(
      "When one part is missing, think: start at the part you know and count up to the total. The jump is the missing part.",
      "Cuando falta una parte, piensa: empieza en la parte que sabes y cuenta hasta el total. El salto es la parte que falta.",
    ),
    reasons: [
      L("Part + part = total.", "Parte + parte = total."),
      L(
        "Counting up from one part to the total finds the other part.",
        "Contar desde una parte hasta el total encuentra la otra parte.",
      ),
      L(
        "Check: put the missing part in the box and add.",
        "Comprueba: pon la parte que falta en la casilla y suma.",
      ),
    ],
    misconception: G0["0:story-add-sub-10"].misconception,
    misconceptions: G0["0:story-add-sub-10"].misconceptions,
    transfer: {
      prompt: L(
        "Zoe needs 15 stars to win a prize. She has 9 stars. How many more stars does she need?",
        "Zoe necesita 15 estrellas para ganar un premio. Tiene 9 estrellas. ¿Cuántas estrellas más necesita?",
      ),
      answers: ["6"],
      kind: "number",
      hint: L(
        "Count up from 9 to 15. Make 10 first.",
        "Cuenta desde 9 hasta 15. Primero llega a 10.",
      ),
      explanation: L(
        "9 + 1 = 10, then 10 + 5 = 15. That is 1 + 5 = 6 more stars.",
        "9 + 1 = 10 y luego 10 + 5 = 15. Son 1 + 5 = 6 estrellas más.",
      ),
    },
  },
  "1:subtract-20": {
    title: L("Subtract within 20", "Resta hasta 20"),
    concept: L(
      "To subtract from a number between 10 and 20, go back to 10 first. Then take away the rest.",
      "Para restar de un número entre 10 y 20, primero regresa a 10. Luego quita el resto.",
    ),
    reasons: [
      L(
        "34 − 6: take 4 to get back to 30.",
        "34 − 6: quita 4 para regresar a 30.",
      ),
      L(
        "You still need to take 2 more: 30 − 2 = 28.",
        "Todavía faltan 2 por quitar: 30 − 2 = 28.",
      ),
      L("That is the 6 you took away, in two small steps.", "Ese es el 6 que quitaste, en dos pasos pequeños."),
    ],
    misconception: L(
      "In 34 − 6 you cannot take 6 ones from 4 ones. Do not flip it to 6 − 4. Break a ten instead.",
      "En 34 − 6 no puedes quitar 6 unidades de 4 unidades. No lo voltees a 6 − 4. Mejor desarma una decena.",
    ),
    misconceptions: subDetectors,
    transfer: {
      prompt: L(
        "A shelf has 14 books. 6 books are taken out. How many books are on the shelf now?",
        "Un estante tiene 14 libros. Se sacan 6 libros. ¿Cuántos libros hay en el estante ahora?",
      ),
      answers: ["8"],
      kind: "number",
      hint: L(
        "Take 4 first to get to 10.",
        "Primero quita 4 para llegar a 10.",
      ),
      explanation: L(
        "14 − 4 = 10, then 10 − 2 = 8. So 14 − 6 = 8.",
        "14 − 4 = 10 y luego 10 − 2 = 8. Así que 14 − 6 = 8.",
      ),
    },
  },
  "1:time": {
    title: L(
      "Tell time to the hour and half hour",
      "La hora en punto y la media hora",
    ),
    concept: L(
      "The short hand shows the hour. The long hand shows the minutes. 30 minutes is half of an hour, and 60 minutes is one whole hour.",
      "La aguja corta marca la hora. La aguja larga marca los minutos. 30 minutos es media hora y 60 minutos es una hora entera.",
    ),
    reasons: [
      L(
        "The long hand goes all the way around in 60 minutes.",
        "La aguja larga da toda la vuelta en 60 minutos.",
      ),
      L(
        "Halfway around is 30 minutes: :30.",
        "La mitad de la vuelta son 30 minutos: :30.",
      ),
      L(
        "When the long hand passes 12 again, the hour goes up by 1.",
        "Cuando la aguja larga pasa otra vez por el 12, la hora sube 1.",
      ),
    ],
    misconception: L(
      "Minutes stop at 59. Half past 8 and 30 more minutes is 9 o’clock, not 8:60.",
      "Los minutos llegan hasta 59. Las 8 y media y 30 minutos más son las 9 en punto, no 8:60.",
    ),
    misconceptions: timeDetectors,
    transfer: {
      prompt: L(
        "Recess starts at 10:30. It lasts 30 minutes. What time does recess end?",
        "El recreo empieza a las 10:30. Dura 30 minutos. ¿A qué hora termina el recreo?",
      ),
      answers: ["11:00"],
      kind: "text",
      hint: L(
        "30 more minutes takes the long hand back to the 12.",
        "30 minutos más llevan la aguja larga de vuelta al 12.",
      ),
      explanation: L(
        "Half an hour after 10:30, the long hand is on 12 and the hour is 11: 11:00.",
        "Media hora después de las 10:30, la aguja larga está en el 12 y la hora es 11: las 11:00.",
      ),
    },
  },
  "1:measure-length": {
    concept: L(
      "Length is how many equal units fit from one end to the other. On a ruler, count the spaces between the start and the end, not the marks.",
      "La longitud es cuántas unidades iguales caben de un extremo al otro. En una regla, cuenta los espacios entre el inicio y el final, no las marcas.",
    ),
    reasons: [
      L(
        "Each space on the ruler is 1 unit.",
        "Cada espacio de la regla es 1 unidad.",
      ),
      L(
        "If the object starts at 0, the end mark is the length.",
        "Si el objeto empieza en 0, la marca final es la longitud.",
      ),
      L(
        "If it starts somewhere else, take the start away: end − start.",
        "Si empieza en otro lugar, quita el inicio: final − inicio.",
      ),
    ],
    misconception: L(
      "The end mark is not the length unless the object starts at 0. Count the spaces, or find end − start.",
      "La marca final no es la longitud a menos que el objeto empiece en 0. Cuenta los espacios o calcula final − inicio.",
    ),
    misconceptions: [
      mis(
        "read-end",
        (item, raw) =>
          /starts at/.test(q(item)) &&
          nums(q(item))[0] > 0 &&
          isNum(raw, nums(q(item))[1]),
        "That is where the strip ENDS. It did not start at 0, so take away the start: end − start.",
        "Ahí es donde TERMINA la tira. No empezó en 0, así que quita el inicio: final − inicio.",
      ),
      mis(
        "counted-marks",
        (item, raw) => {
          const n = nums(q(item));
          return /starts at/.test(q(item)) && isNum(raw, n[1] - n[0] + 1);
        },
        "One too many: you counted the marks. Count the SPACES between the marks. Each space is 1 cm.",
        "Una de más: contaste las marcas. Cuenta los ESPACIOS entre las marcas. Cada espacio es 1 cm.",
      ),
    ],
    transfer: {
      prompt: L(
        "A crayon lies on a ruler from the 4 cm mark to the 11 cm mark. How long is the crayon?",
        "Un crayón está sobre una regla desde la marca de 4 cm hasta la marca de 11 cm. ¿Cuánto mide el crayón?",
      ),
      answers: ["7"],
      kind: "number",
      unit: L("cm", "cm"),
      hint: L(
        "Count the spaces from 4 to 11.",
        "Cuenta los espacios del 4 al 11.",
      ),
      explanation: L(
        "From 4 to 11 is 7 spaces. 11 − 4 = 7 cm.",
        "Del 4 al 11 hay 7 espacios. 11 − 4 = 7 cm.",
      ),
    },
  },
  "1:shapes-2d3d": {
    concept: L(
      "Flat shapes have sides and corners. Solid shapes have flat faces, edges and corners. Count each part once, including the parts you cannot see.",
      "Las figuras planas tienen lados y esquinas. Los cuerpos sólidos tienen caras planas, aristas y esquinas. Cuenta cada parte una vez, también las que no ves.",
    ),
    reasons: [
      L(
        "A corner is where two sides meet, so a flat shape has as many corners as sides.",
        "Una esquina es donde se juntan dos lados, así que una figura plana tiene tantas esquinas como lados.",
      ),
      L(
        "A cube has a face on every side: front, back, top, bottom, left and right.",
        "Un cubo tiene una cara en cada lado: adelante, atrás, arriba, abajo, izquierda y derecha.",
      ),
      L(
        "A picture hides the back of a solid. Imagine turning it around.",
        "Un dibujo esconde la parte de atrás de un cuerpo sólido. Imagina que lo giras.",
      ),
    ],
    misconception: L(
      "A drawing of a solid hides some faces, edges and corners. Count the hidden ones too.",
      "El dibujo de un cuerpo sólido esconde algunas caras, aristas y esquinas. Cuenta también las escondidas.",
    ),
    misconceptions: [
      mis(
        "visible-only",
        (item, raw) => {
          const m = q(item).match(
            /How many (corners|edges|flat faces) does an? (cube|rectangular prism) have/,
          );
          if (!m) return false;
          return isNum(raw, { corners: 7, edges: 9, "flat faces": 3 }[m[1]]);
        },
        "You counted only what the picture shows. A solid also has a back, a bottom and a hidden side. Imagine turning it over and count those too.",
        "Contaste solo lo que muestra el dibujo. Un cuerpo sólido también tiene parte de atrás, de abajo y un lado escondido. Imagina que lo volteas y cuéntalos también.",
      ),
      mis(
        "one-face",
        (item, raw) => {
          const m = q(item).match(
            /How many (corners|edges) does an? (cube|rectangular prism) have/,
          );
          return Boolean(m) && isNum(raw, 4);
        },
        "4 is for one face. A solid has a front face AND a back face, with edges joining them. Count all of them.",
        "4 es para una sola cara. Un cuerpo sólido tiene una cara de adelante Y una de atrás, con aristas que las unen. Cuéntalas todas.",
      ),
      mis(
        "counted-start-twice",
        (item, raw) => {
          const m = q(item).match(
            /How many (corners|sides) does an? (triangle|square|rectangle|pentagon|hexagon|octagon) have/,
          );
          const n =
            m &&
            {
              triangle: 3,
              square: 4,
              rectangle: 4,
              pentagon: 5,
              hexagon: 6,
              octagon: 8,
            }[m[2]];
          return Boolean(n) && isNum(raw, n + 1);
        },
        "One too many: you may have counted the first one again at the end. Mark where you start, and stop when you get back to it.",
        "Una de más: tal vez contaste otra vez el primero al final. Marca dónde empiezas y para cuando vuelvas ahí.",
      ),
    ],
    living: shapesModel,
    transfer: {
      prompt: L(
        "A stop sign is a flat shape with 8 sides. How many corners does it have?",
        "Una señal de alto es una figura plana con 8 lados. ¿Cuántas esquinas tiene?",
      ),
      answers: ["8"],
      kind: "number",
      hint: L(
        "Each corner is where two sides meet.",
        "Cada esquina es donde se juntan dos lados.",
      ),
      explanation: L(
        "Going around, each side ends at a corner, so 8 sides means 8 corners.",
        "Al dar la vuelta, cada lado termina en una esquina, así que 8 lados significan 8 esquinas.",
      ),
    },
  },
  "1:equal-shares": {
    concept: L(
      "Equal shares are pieces that are all the same size. Together, all the pieces make the whole.",
      "Las partes iguales son piezas que tienen todas el mismo tamaño. Juntas, todas las piezas forman el todo.",
    ),
    reasons: [
      L(
        "Every share is the same size, so we can count shares.",
        "Todas las partes son del mismo tamaño, así que podemos contar partes.",
      ),
      L(
        "Shares eaten and shares left make the whole.",
        "Las partes comidas y las que quedan forman el todo.",
      ),
      L(
        "If each piece is 3 inches, 4 pieces are 3 + 3 + 3 + 3 inches long.",
        "Si cada pieza mide 3 pulgadas, 4 piezas miden 3 + 3 + 3 + 3 pulgadas.",
      ),
    ],
    misconception: L(
      "Pieces of different sizes are not equal shares. And the shares eaten are not the shares left.",
      "Piezas de tamaños diferentes no son partes iguales. Y las partes comidas no son las partes que quedan.",
    ),
    misconceptions: [
      mis(
        "eaten",
        (item, raw) =>
          /(is|are) eaten/.test(q(item)) && isNum(raw, nums(q(item))[1]),
        "That is how many were EATEN. Take them away from all the shares to find how many are left.",
        "Esas son las que se COMIERON. Quítalas del total de partes para saber cuántas quedan.",
      ),
      mis(
        "added",
        (item, raw) => {
          const n = nums(q(item));
          return /Each piece is/.test(q(item)) && isNum(raw, n[0] + n[1]);
        },
        "You added the number of pieces and the length of one piece. Each piece has that length, so add the length once for EVERY piece.",
        "Sumaste el número de piezas y la longitud de una pieza. Cada pieza tiene esa longitud, así que suma la longitud una vez por CADA pieza.",
      ),
      mis(
        "one-piece",
        (item, raw) =>
          /Each piece is/.test(q(item)) && isNum(raw, nums(q(item))[1]),
        "That is the length of ONE piece. The whole rope is all the pieces put back together.",
        "Esa es la longitud de UNA pieza. La cuerda entera son todas las piezas juntas otra vez.",
      ),
    ],
    living: equalSharesModel,
    transfer: {
      prompt: L(
        "A long sandwich is cut into 4 equal pieces. Each piece is 2 inches long. How long was the whole sandwich?",
        "Un sándwich largo se corta en 4 piezas iguales. Cada pieza mide 2 pulgadas. ¿Cuánto medía el sándwich entero?",
      ),
      answers: ["8"],
      kind: "number",
      unit: L("inches", "pulgadas"),
      hint: L(
        "Put the 4 pieces back together.",
        "Vuelve a juntar las 4 piezas.",
      ),
      explanation: L(
        "4 pieces of 2 inches: 2 + 2 + 2 + 2 = 8 inches.",
        "4 piezas de 2 pulgadas: 2 + 2 + 2 + 2 = 8 pulgadas.",
      ),
    },
  },
};

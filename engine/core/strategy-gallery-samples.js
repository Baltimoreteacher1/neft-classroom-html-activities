// strategy-gallery-samples.js — authored sample solutions for the strategy gallery.
//
// WHAT THESE ARE: written by the lesson team, not by students. The gallery
// labels them "Sample solutions" and says so. Each problem is solved three ways
// (a drawn model, a calculation, an explanation in words) so a student can
// compare strategies on ONE problem. The problems are deliberately NOT lesson
// problems: a gallery that opens after a student submits must never be a place
// to read the answer to the problem they just did. strategy-gallery.js skips any
// sample that shares two or more numbers with the student's own item.
//
// The strategy of each solution is NOT tagged here. It is derived by
// classifyStrategy() in strategy-gallery.js — the same path any future
// classmate exemplar would take — and strategy-gallery.test.mjs pins that every
// solution below classifies as the strategy it was written to show.
//
// Keys are the domains of small-group-strategies.js (resolveStrategyDomain).
// A domain with no entry shows no gallery; nothing is invented to fill the gap.
// Every math line was checked by hand; strategy-gallery.test.mjs re-checks the
// arithmetic it can parse.

/** @typedef {{ en: string, es: string }} Pair */
/** @typedef {{ id: string, problem: Pair, solutions: Pair[] }} SampleProblem */

/** @type {Record<string, SampleProblem[]>} */
export const SAMPLE_PROBLEMS = {
  ratio: [
    {
      id: "ratio-smoothie",
      problem: {
        en: "A smoothie recipe uses 3 cups of oats for every 2 cups of milk. How much milk goes with 12 cups of oats?",
        es: "Una receta de batido usa 3 tazas de avena por cada 2 tazas de leche. ¿Cuánta leche va con 12 tazas de avena?",
      },
      solutions: [
        {
          en: "I drew a ratio table with two rows. Oats: 3, 6, 9, 12. Milk: 2, 4, 6, 8. Every column is the same ratio, so 12 cups of oats go with 8 cups of milk.",
          es: "Dibujé una tabla de razones con dos filas. Avena: 3, 6, 9, 12. Leche: 2, 4, 6, 8. Cada columna tiene la misma razón, así que 12 tazas de avena van con 8 tazas de leche.",
        },
        {
          en: "I wrote an equation. For each cup of oats there is 2 ÷ 3 = 2/3 cup of milk. Then 12 × 2/3 = 8, so I need 8 cups of milk.",
          es: "Escribí una ecuación. Por cada taza de avena hay 2 ÷ 3 = 2/3 de taza de leche. Luego 12 × 2/3 = 8, así que necesito 8 tazas de leche.",
        },
        {
          en: "I explained it in words. 12 cups is 4 times as many as 3 cups. If I use 4 times as much oats, I must use 4 times as much milk to keep the same taste, so the milk is 4 times 2, which is 8 cups.",
          es: "Lo expliqué con palabras. 12 tazas es 4 veces tantas como 3 tazas. Si uso 4 veces más avena, necesito 4 veces más leche para que el sabor sea igual, así que la leche es 4 veces 2, es decir, 8 tazas.",
        },
      ],
    },
    {
      id: "ratio-bike",
      problem: {
        en: "A bike rider goes 15 miles in 3 hours at a steady speed. How far does the rider go in 5 hours?",
        es: "Una ciclista recorre 15 millas en 3 horas a una rapidez constante. ¿Cuánto recorre en 5 horas?",
      },
      solutions: [
        {
          en: "I drew a double number line. Hours on top: 0, 1, 3, 5. Miles below: 0, 5, 15, 25. Each hour matches 5 miles, so 5 hours matches 25 miles.",
          es: "Dibujé una doble recta numérica. Horas arriba: 0, 1, 3, 5. Millas abajo: 0, 5, 15, 25. Cada hora corresponde a 5 millas, así que 5 horas corresponden a 25 millas.",
        },
        {
          en: "I found the unit rate first: 15 ÷ 3 = 5 miles per hour. Then 5 × 5 = 25, so the rider goes 25 miles.",
          es: "Primero hallé la tasa unitaria: 15 ÷ 3 = 5 millas por hora. Luego 5 × 5 = 25, así que la ciclista recorre 25 millas.",
        },
        {
          en: "I explained it in words. The rider goes the same distance every hour, so one hour is one third of the 15 miles, which is 5 miles. Five equal hours make five equal pieces of 5 miles, which is 25 miles.",
          es: "Lo expliqué con palabras. La ciclista recorre la misma distancia cada hora, así que una hora es un tercio de las 15 millas, o sea 5 millas. Cinco horas iguales son cinco partes iguales de 5 millas, o sea 25 millas.",
        },
      ],
    },
  ],
  percent: [
    {
      id: "percent-game",
      problem: {
        en: "A video game costs $40. It is 25% off. How much is the discount?",
        es: "Un videojuego cuesta $40. Tiene 25 % de descuento. ¿De cuánto es el descuento?",
      },
      solutions: [
        {
          en: "I drew a double number line. 0% and 100% are at the ends, with $0 and $40 right above them. 50% is $20, and half of that, 25%, is $10. The discount is $10.",
          es: "Dibujé una doble recta numérica. 0 % y 100 % están en los extremos, con $0 y $40 justo encima. El 50 % es $20 y la mitad de eso, el 25 %, es $10. El descuento es de $10.",
        },
        {
          en: "I used a percent equation: part = percent × whole. So part = 0.25 × 40 = 10. The discount is $10.",
          es: "Usé una ecuación de porcentaje: parte = porcentaje × entero. Entonces parte = 0.25 × 40 = 10. El descuento es de $10.",
        },
        {
          en: "I explained it with a benchmark. 25% means 25 out of every 100, which is one fourth. One fourth of $40 is $10, because 4 equal groups of $10 make $40.",
          es: "Lo expliqué con un valor de referencia. 25 % significa 25 de cada 100, que es un cuarto. Un cuarto de $40 es $10, porque 4 grupos iguales de $10 forman $40.",
        },
      ],
    },
    {
      id: "percent-walk",
      problem: {
        en: "A class has 60 students. 35% of them walk to school. How many students walk?",
        es: "Una clase tiene 60 estudiantes. El 35 % camina a la escuela. ¿Cuántos estudiantes caminan?",
      },
      solutions: [
        {
          en: "I drew a tape diagram with 10 equal parts for the 60 students. Each part is 10% and 6 students. 30% is 3 parts, which is 18 students, and 5% is half of one part, which is 3 students. 18 + 3 = 21 students walk.",
          es: "Dibujé un diagrama de cinta con 10 partes iguales para los 60 estudiantes. Cada parte es 10 % y 6 estudiantes. El 30 % son 3 partes, o sea 18 estudiantes, y el 5 % es la mitad de una parte, o sea 3 estudiantes. 18 + 3 = 21 estudiantes caminan.",
        },
        {
          en: "I wrote 35% as the decimal 0.35. Then I multiplied: 0.35 × 60 = 21. So 21 students walk.",
          es: "Escribí 35 % como el decimal 0.35. Luego multipliqué: 0.35 × 60 = 21. Entonces caminan 21 estudiantes.",
        },
        {
          en: "I explained it in pieces. 10% of the class is 6 students, so 30% is three times that, which is 18. 5% is half of 10%, which is 3. Together 30% and 5% make 35%, so 21 students walk because 18 and 3 together are 21.",
          es: "Lo expliqué por partes. El 10 % de la clase son 6 estudiantes, así que el 30 % es el triple, o sea 18. El 5 % es la mitad del 10 %, o sea 3. Juntos, 30 % y 5 % forman 35 %, así que caminan 21 estudiantes porque 18 y 3 juntos son 21.",
        },
      ],
    },
  ],
  equation: [
    {
      id: "equation-add",
      problem: {
        en: "Solve for x: x + 7 = 19.",
        es: "Halla x: x + 7 = 19.",
      },
      solutions: [
        {
          en: "I drew a balance scale with x and 7 on the left and 19 on the right. I took 7 off both sides to keep it balanced. Then x is alone and equals 12.",
          es: "Dibujé una balanza con x y 7 a la izquierda y 19 a la derecha. Quité 7 de los dos lados para mantenerla en equilibrio. Entonces x queda solo y es igual a 12.",
        },
        {
          en: "I used the inverse operation. x + 7 − 7 = 19 − 7, so x = 12. Check: 12 + 7 = 19.",
          es: "Usé la operación inversa. x + 7 − 7 = 19 − 7, así que x = 12. Comprobación: 12 + 7 = 19.",
        },
        {
          en: "I explained it in words. Some number plus 7 makes 19, so that number has to be 7 less than 19. That is 12, and I checked by putting 12 back into the equation.",
          es: "Lo expliqué con palabras. Un número más 7 da 19, así que ese número tiene que ser 7 menos que 19. Eso es 12, y lo comprobé al poner 12 de nuevo en la ecuación.",
        },
      ],
    },
    {
      id: "equation-times",
      problem: {
        en: "Solve for n: 3n = 24.",
        es: "Halla n: 3n = 24.",
      },
      solutions: [
        {
          en: "I drew a tape diagram with 3 equal parts that together make 24. Each part is n. When I split 24 into 3 equal parts, each part is 8, so n is 8.",
          es: "Dibujé un diagrama de cinta con 3 partes iguales que juntas forman 24. Cada parte es n. Al repartir 24 en 3 partes iguales, cada parte es 8, así que n es 8.",
        },
        {
          en: "I divided both sides by 3: 3n ÷ 3 = 24 ÷ 3, so n = 8. Check: 3 × 8 = 24.",
          es: "Dividí los dos lados entre 3: 3n ÷ 3 = 24 ÷ 3, así que n = 8. Comprobación: 3 × 8 = 24.",
        },
        {
          en: "I explained it in words. Three groups of the same number make 24, so each group has to be 24 shared equally among 3. That is 8 each, and 3 groups of 8 make 24 again.",
          es: "Lo expliqué con palabras. Tres grupos del mismo número forman 24, así que cada grupo tiene que ser 24 repartido en partes iguales entre 3. Eso es 8 cada uno, y 3 grupos de 8 vuelven a formar 24.",
        },
      ],
    },
  ],
};

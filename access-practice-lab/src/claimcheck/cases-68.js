// Misconception Detective: the 15 cases for grades 6-8. Same compact authoring format as cases-35.js.
export const CASES_68 = [
  {
    id: "m68-mean-median",
    subject: "math",
    flaw: "overgeneral",
    concept: "mean, median and outliers",
    title: ["Books read in a month", "Libros leídos en un mes"],
    speaker: "Camila",
    lines: [
      [
        "Five students report how many books they read this month: 1, 2, 2, 3 and 12.",
        "Cinco estudiantes informan cuántos libros leyeron este mes: 1, 2, 2, 3 y 12.",
        "This line only gives the data. The numbers it lists are the ones used below.",
        "Esta línea solo da los datos. Los números que enumera son los que se usan abajo.",
      ],
      [
        "The mean is the sum divided by the number of values: (1 + 2 + 2 + 3 + 12) ÷ 5 = 4.",
        "La media es la suma dividida entre la cantidad de valores: (1 + 2 + 2 + 3 + 12) ÷ 5 = 4.",
        "Check it: the sum is 20, and 20 ÷ 5 is 4. This line is correct.",
        "Compruébalo: la suma es 20, y 20 ÷ 5 es 4. Esta línea es correcta.",
      ],
      [
        "The median is the middle value when the data are in order, which is 2.",
        "La mediana es el valor del medio cuando los datos están en orden, que es 2.",
        "In order the data are 1, 2, 2, 3, 12, and the middle one is 2. This line is correct.",
        "En orden los datos son 1, 2, 2, 3, 12, y el del medio es 2. Esta línea es correcta.",
      ],
      [
        "So the mean is always the best typical value, because one very large value like 12 cannot change it much.",
        "Entonces la media siempre es el mejor valor típico, porque un valor muy grande como 12 no la puede cambiar mucho.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "Without the 12, the mean of 1, 2, 2 and 3 is 2; with it, the mean is 4.",
        "Sin el 12, la media de 1, 2, 2 y 3 es 2; con él, la media es 4.",
        "We can check this by recalculating both means.",
        "Podemos comprobarlo recalculando las dos medias.",
      ],
      [
        "e",
        "Four of the five students read 3 books or fewer.",
        "Cuatro de los cinco estudiantes leyeron 3 libros o menos.",
        "We can check this by counting the data.",
        "Podemos comprobarlo contando los datos.",
      ],
      [
        "a",
        "Camila feels that using every number must make the mean the fairest summary.",
        "Camila siente que usar todos los números debe hacer de la media el resumen más justo.",
        "A feeling about fairness is not a calculation.",
        "Una sensación de justicia no es un cálculo.",
      ],
      [
        "o",
        "The five students are in the same homeroom.",
        "Los cinco estudiantes están en el mismo salón.",
        "Where the students sit does not change the summary of the data.",
        "Dónde se sientan los estudiantes no cambia el resumen de los datos.",
      ],
    ],
    fix: [
      [
        "The mean is the best typical value, because it is the middle value.",
        "La media es el mejor valor típico, porque es el valor del medio.",
      ],
      [
        "Neither number is useful, because the data contain an outlier.",
        "Ningún número es útil, porque los datos tienen un valor atípico.",
      ],
      [
        "One very large value can pull the mean up (from 2 to 4 here), so the median can describe a typical student better when there is an outlier.",
        "Un valor muy grande puede subir la media (de 2 a 4 aquí), así que la mediana puede describir mejor a un estudiante típico cuando hay un valor atípico.",
      ],
    ],
    right: 2,
    why: [
      "The mean uses every value, so an extreme value pulls it. Without the 12, the mean of 1, 2, 2 and 3 is 8 ÷ 4 = 2; with the 12 it jumps to 4, higher than four of the five students. The median stays at 2. When data have an outlier, the median is often the better typical value; there is no single best measure for every data set.",
      "La media usa todos los valores, así que un valor extremo la jala. Sin el 12, la media de 1, 2, 2 y 3 es 8 ÷ 4 = 2; con el 12 sube a 4, más que cuatro de los cinco estudiantes. La mediana se queda en 2. Cuando los datos tienen un valor atípico, la mediana suele ser mejor valor típico; no hay una sola medida que sea la mejor para todos los datos.",
    ],
    accept: "mean median outlier outliers average typical extreme large pull change media mediana",
    focus: [
      "how Camila compares the mean with the median",
      "cómo compara Camila la media con la mediana",
    ],
    terms: [
      ["mean", "media", "the sum of the values divided by how many there are"],
      ["median", "mediana", "the middle value when the data are in order"],
      ["outlier", "valor atípico", "a value far from the others"],
    ],
    transfer: [
      "A friend says the mean salary always describes a company best. What kind of data would make you doubt that, and what would you recalculate?",
      "Un amigo dice que el salario medio siempre describe mejor a una empresa. ¿Qué tipo de datos te haría dudar y qué recalcularías?",
    ],
    calc: [
      ["(1+2+2+3+12)/5", 4],
      ["(1+2+2+3)/4", 2],
    ],
  },
  {
    id: "m68-negatives",
    subject: "math",
    flaw: "fact",
    concept: "comparing negative numbers",
    title: ["Which is greater?", "¿Cuál es mayor?"],
    speaker: "Jonah",
    lines: [
      [
        "On a number line, numbers farther to the right are greater.",
        "En una recta numérica, los números más a la derecha son mayores.",
        "This is how a number line orders numbers. This line is correct.",
        "Así ordena los números una recta numérica. Esta línea es correcta.",
      ],
      [
        "The number −3 is 3 units to the left of 0, and −8 is 8 units to the left of 0.",
        "El número −3 está 3 unidades a la izquierda del 0, y −8 está 8 unidades a la izquierda del 0.",
        "These are the positions of −3 and −8 on the line. This line is correct.",
        "Estas son las posiciones de −3 y −8 en la recta. Esta línea es correcta.",
      ],
      [
        "Since 8 is greater than 3, −8 is greater than −3.",
        "Como 8 es mayor que 3, −8 es mayor que −3.",
      ],
      [
        "On a winter morning, −8 °C is colder than −3 °C.",
        "En una mañana de invierno, −8 °C es más frío que −3 °C.",
        "−8 °C really is colder than −3 °C. This line is true.",
        "−8 °C sí es más frío que −3 °C. Esta línea es verdadera.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "On a number line, −3 is to the right of −8.",
        "En una recta numérica, −3 está a la derecha de −8.",
        "We can check this by drawing or looking at a number line.",
        "Podemos comprobarlo dibujando o mirando una recta numérica.",
      ],
      [
        "e",
        "A temperature of −8 °C is colder than −3 °C.",
        "Una temperatura de −8 °C es más fría que −3 °C.",
        "We can check this on a thermometer or a weather report.",
        "Podemos comprobarlo en un termómetro o en un reporte del clima.",
      ],
      [
        "a",
        "Jonah feels that bigger digits make a bigger number, even with a minus sign.",
        "Jonah siente que los dígitos más grandes forman un número más grande, aun con signo menos.",
        "This is a feeling about digits, not a test with the number line.",
        "Es una sensación sobre los dígitos, no una prueba con la recta numérica.",
      ],
      [
        "o",
        "Jonah drew his number line in green marker.",
        "Jonah dibujó su recta numérica con marcador verde.",
        "The color of the marker does not change which number is greater.",
        "El color del marcador no cambia cuál número es mayor.",
      ],
    ],
    fix: [
      [
        "−3 is greater than −8, because −3 is farther to the right on the number line (and −3 °C is warmer).",
        "−3 es mayor que −8, porque −3 está más a la derecha en la recta numérica (y −3 °C es más cálido).",
      ],
      [
        "−8 is greater than −3, because its distance from 0 is greater.",
        "−8 es mayor que −3, porque su distancia al 0 es mayor.",
      ],
      [
        "−3 and −8 cannot be compared, because they are negative.",
        "−3 y −8 no se pueden comparar, porque son negativos.",
      ],
    ],
    right: 0,
    why: [
      "For negative numbers, a bigger digit means farther below zero, so the number is smaller. −8 is 8 units left of 0 and −3 is only 3 units left, so −3 is to the right of −8 and −3 > −8. Jonah's own temperature line agrees: −8 °C is colder, which means it is less.",
      "En los números negativos, un dígito mayor significa más abajo del cero, así que el número es menor. −8 está 8 unidades a la izquierda del 0 y −3 solo 3, así que −3 está a la derecha de −8 y −3 > −8. La línea de Jonah sobre la temperatura coincide: −8 °C es más frío, es decir, es menor.",
    ],
    accept:
      "negative greater less smaller right left number line distance zero colder warmer -3 -8",
    focus: ["how Jonah compares −8 and −3", "cómo compara Jonah −8 y −3"],
    terms: [
      ["negative number", "número negativo", "a number less than zero"],
      ["number line", "recta numérica", "a line where numbers are placed in order"],
    ],
    transfer: [
      "A friend says −2 is less than −9 because 2 is less than 9. How would you show her whether she is right?",
      "Una amiga dice que −2 es menor que −9 porque 2 es menor que 9. ¿Cómo le mostrarías si tiene razón?",
    ],
  },
  {
    id: "m68-percent",
    subject: "math",
    flaw: "assumption",
    concept: "successive percent discounts",
    title: ["Two discounts", "Dos descuentos"],
    speaker: "Sofia",
    lines: [
      [
        "A jacket costs $50. The store takes 20% off, and then takes another 20% off the new price.",
        "Una chaqueta cuesta $50. La tienda quita 20%, y luego quita otro 20% del nuevo precio.",
        "This line only describes the situation: the price and the two discounts.",
        "Esta línea solo describe la situación: el precio y los dos descuentos.",
      ],
      [
        "20% of 50 is 10, so the first sale price is $50 − $10 = $40.",
        "El 20% de 50 es 10, así que el primer precio de oferta es $50 − $10 = $40.",
        "20% of 50 is 10, and 50 − 10 is 40. This line is correct.",
        "El 20% de 50 es 10, y 50 − 10 es 40. Esta línea es correcta.",
      ],
      [
        "20% of 40 is 8, so the second sale price is $40 − $8 = $32.",
        "El 20% de 40 es 8, así que el segundo precio de oferta es $40 − $8 = $32.",
        "20% of 40 is 8, and 40 − 8 is 32. This line is correct.",
        "El 20% de 40 es 8, y 40 − 8 es 32. Esta línea es correcta.",
      ],
      [
        "So two 20% discounts equal 40% off, and the jacket should cost $30.",
        "Entonces dos descuentos de 20% equivalen a 40% de descuento, y la chaqueta debería costar $30.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "20% of $50 is $10, and 20% of $40 is $8, which are different amounts.",
        "El 20% de $50 es $10, y el 20% de $40 es $8, que son cantidades distintas.",
        "We can check this by calculating both percents.",
        "Podemos comprobarlo calculando los dos porcentajes.",
      ],
      [
        "e",
        "Taking $18 off $50 leaves $32, and $18 is 36% of $50.",
        "Quitar $18 a $50 deja $32, y $18 es el 36% de $50.",
        "We can check this by subtracting and dividing.",
        "Podemos comprobarlo restando y dividiendo.",
      ],
      [
        "a",
        "Sofia feels that percents can just be added no matter what they are a percent of.",
        "Sofia siente que los porcentajes se pueden sumar sin importar de qué son porcentaje.",
        "This is an assumption. The two 20% amounts are taken from different prices.",
        "Es una suposición. Los dos 20% se toman de precios distintos.",
      ],
      [
        "o",
        "The jacket is blue.",
        "La chaqueta es azul.",
        "The color of the jacket does not change the price.",
        "El color de la chaqueta no cambia el precio.",
      ],
    ],
    fix: [
      [
        "The jacket costs $40, because the second 20% discount does not change the price.",
        "La chaqueta cuesta $40, porque el segundo descuento de 20% no cambia el precio.",
      ],
      [
        "The jacket costs $32, which is 36% off $50, because the second 20% is taken from $40, not from $50.",
        "La chaqueta cuesta $32, que es 36% menos que $50, porque el segundo 20% se quita de $40, no de $50.",
      ],
      [
        "The jacket costs $42, because 20% of 50 is 8.",
        "La chaqueta cuesta $42, porque el 20% de 50 es 8.",
      ],
    ],
    right: 1,
    why: [
      "A percent is always a percent of some whole. The first 20% is taken from $50 ($10); the second 20% is taken from the smaller price $40 ($8). The total off is $18, which is 36% of $50, not 40%. Sofia's own lines 2 and 3 already give $32, so the $30 does not match them.",
      "Un porcentaje siempre es un porcentaje de algún total. El primer 20% se quita de $50 ($10); el segundo 20% se quita del precio menor, $40 ($8). El total descontado es $18, que es el 36% de $50, no el 40%. Las líneas 2 y 3 de Sofia ya dan $32, así que los $30 no coinciden con ellas.",
    ],
    accept: "percent percents discount whole add added 36 32 40 different price smaller",
    focus: ["how Sofia combines the two discounts", "cómo combina Sofia los dos descuentos"],
    terms: [
      ["percent", "por ciento", "a rate per 100 of some whole"],
      ["discount", "descuento", "an amount taken off a price"],
      ["whole", "total (entero)", "the full amount that a percent is taken from"],
    ],
    transfer: [
      "A shirt's price goes up 10% and then down 10%. A friend says it costs the same as before. What would you calculate to test that?",
      "El precio de una camisa sube 10% y luego baja 10%. Un amigo dice que cuesta lo mismo que antes. ¿Qué calcularías para probarlo?",
    ],
    calc: [
      ["0.2*50", 10],
      ["50-10", 40],
      ["0.2*40", 8],
      ["40-8", 32],
      ["0.4*50", 20],
      ["50-20", 30],
      ["(50-32)/50*100", 36],
    ],
  },
  {
    id: "m68-exponent",
    subject: "math",
    flaw: "calc",
    concept: "exponents with negative bases",
    title: ["Squaring a negative", "Elevar un negativo al cuadrado"],
    speaker: "Kai",
    lines: [
      [
        "An exponent tells how many times to multiply a number by itself.",
        "Un exponente indica cuántas veces se multiplica un número por sí mismo.",
        "This is the meaning of an exponent. This line is correct.",
        "Este es el significado de un exponente. Esta línea es correcta.",
      ],
      [
        "So 4³ means 4 × 4 × 4, which is 64.",
        "Así que 4³ significa 4 × 4 × 4, que es 64.",
        "4 × 4 is 16 and 16 × 4 is 64. This line is correct.",
        "4 × 4 es 16 y 16 × 4 es 64. Esta línea es correcta.",
      ],
      ["And (−3)² means (−3) × (−3), which is −9.", "Y (−3)² significa (−3) × (−3), que es −9."],
      [
        "Also, 5² means 5 × 5, which is 25.",
        "Además, 5² significa 5 × 5, que es 25.",
        "5 × 5 is 25. This line is correct.",
        "5 × 5 es 25. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "Multiplying −3 × −3 on a calculator gives 9.",
        "Multiplicar −3 × −3 en una calculadora da 9.",
        "We can check this on a calculator.",
        "Podemos comprobarlo en una calculadora.",
      ],
      [
        "e",
        "A negative number times a negative number is positive: −2 × −2 = 4.",
        "Un número negativo por un número negativo es positivo: −2 × −2 = 4.",
        "We can check this with the rules for multiplying integers.",
        "Podemos comprobarlo con las reglas para multiplicar enteros.",
      ],
      [
        "a",
        "Kai thinks a negative sign should always stay in the answer.",
        "Kai piensa que un signo negativo siempre debe quedarse en la respuesta.",
        "This is an assumption, not a rule of multiplication.",
        "Es una suposición, no una regla de la multiplicación.",
      ],
      [
        "o",
        "Kai wrote this problem in pencil.",
        "Kai escribió este problema con lápiz.",
        "The pencil does not change the answer.",
        "El lápiz no cambia la respuesta.",
      ],
    ],
    fix: [
      [
        "(−3)² is −6, because the exponent 2 means multiply by 2.",
        "(−3)² es −6, porque el exponente 2 significa multiplicar por 2.",
      ],
      [
        "(−3)² is 9, because a negative times a negative is positive.",
        "(−3)² es 9, porque un negativo por un negativo es positivo.",
      ],
      [
        "(−3)² is −9, because the minus sign stays on the answer.",
        "(−3)² es −9, porque el signo menos se queda en la respuesta.",
      ],
    ],
    right: 1,
    why: [
      "Kai set up the multiplication correctly: (−3) × (−3). But a negative times a negative is positive, so the product is 9, not −9. Note that −3² (with no parentheses) is different: it means −(3 × 3) = −9. With parentheses the whole −3 is squared.",
      "Kai planteó bien la multiplicación: (−3) × (−3). Pero un negativo por un negativo es positivo, así que el producto es 9, no −9. Fíjate en que −3² (sin paréntesis) es distinto: significa −(3 × 3) = −9. Con paréntesis se eleva al cuadrado todo el −3.",
    ],
    accept: "negative positive sign squared 9 base exponent times multiply parentheses",
    focus: ["the sign of the product Kai writes", "el signo del producto que escribe Kai"],
    terms: [
      ["exponent", "exponente", "a small number that tells how many times to multiply the base"],
      ["base", "base", "the number that gets multiplied by itself"],
    ],
    transfer: [
      "A friend says (−2)³ is 8. What would you multiply out to check the value and the sign?",
      "Un amigo dice que (−2)³ es 8. ¿Qué multiplicarías para comprobar el valor y el signo?",
    ],
    calc: [
      ["4*4*4", 64],
      ["5*5", 25],
      ["(-3)*(-3)", 9],
    ],
  },
  {
    id: "m68-ratio",
    subject: "math",
    flaw: "assumption",
    concept: "proportional (multiplicative) reasoning",
    title: ["Notebook prices", "Precios de cuadernos"],
    speaker: "Nia",
    lines: [
      [
        "Nia knows that 3 notebooks cost $6, so 1 notebook costs $2.",
        "Nia sabe que 3 cuadernos cuestan $6, así que 1 cuaderno cuesta $2.",
        "$6 ÷ 3 is $2. This line is correct.",
        "$6 ÷ 3 es $2. Esta línea es correcta.",
      ],
      [
        "She wants 9 notebooks, which is 6 more than 3.",
        "Ella quiere 9 cuadernos, que son 6 más que 3.",
        "9 is 6 more than 3. This line is correct.",
        "9 es 6 más que 3. Esta línea es correcta.",
      ],
      [
        "Since 6 more notebooks cost $6 more, 9 notebooks cost $12.",
        "Como 6 cuadernos más cuestan $6 más, 9 cuadernos cuestan $12.",
      ],
      [
        "Every notebook costs the same price.",
        "Todos los cuadernos cuestan el mismo precio.",
        "Equal prices are what makes this a proportional situation. This line is correct.",
        "Los precios iguales hacen que esta situación sea proporcional. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "Each notebook costs $2, so 6 more notebooks cost 6 × $2 = $12 more, not $6 more.",
        "Cada cuaderno cuesta $2, así que 6 cuadernos más cuestan 6 × $2 = $12 más, no $6 más.",
        "We can check this by multiplying.",
        "Podemos comprobarlo multiplicando.",
      ],
      [
        "e",
        "$6 for 3 notebooks and $18 for 9 notebooks both keep the price at $2 per notebook.",
        "$6 por 3 cuadernos y $18 por 9 cuadernos mantienen el precio en $2 por cuaderno.",
        "We can check this by dividing each cost by the number of notebooks.",
        "Podemos comprobarlo dividiendo cada costo entre el número de cuadernos.",
      ],
      [
        "a",
        "Nia feels that adding the same number to both quantities is how prices grow.",
        "Nia siente que sumar el mismo número a las dos cantidades es como crecen los precios.",
        "This is an assumption. In a ratio the amounts grow by multiplying.",
        "Es una suposición. En una razón las cantidades crecen multiplicando.",
      ],
      [
        "o",
        "The notebooks are sold at the school store.",
        "Los cuadernos se venden en la tienda de la escuela.",
        "Where they are sold does not change how the price grows.",
        "Dónde se venden no cambia cómo crece el precio.",
      ],
    ],
    fix: [
      [
        "9 notebooks cost $18, because each notebook costs $2 and 9 × 2 = 18.",
        "9 cuadernos cuestan $18, porque cada cuaderno cuesta $2 y 9 × 2 = 18.",
      ],
      [
        "9 notebooks cost $15, because the price goes up by $1 for each notebook.",
        "9 cuadernos cuestan $15, porque el precio sube $1 por cada cuaderno.",
      ],
      [
        "9 notebooks cost $14, because 6 + 6 + 2 = 14.",
        "9 cuadernos cuestan $14, porque 6 + 6 + 2 = 14.",
      ],
    ],
    right: 0,
    why: [
      "When every item costs the same, cost grows by multiplying: each notebook adds $2. Six more notebooks add 6 × $2 = $12, not $6. So 9 notebooks cost $6 + $12 = $18, which is also 9 × $2. Nia added the same number to both quantities instead of keeping the $2-per-notebook rate.",
      "Cuando todos los artículos cuestan lo mismo, el costo crece multiplicando: cada cuaderno suma $2. Seis cuadernos más suman 6 × $2 = $12, no $6. Entonces 9 cuadernos cuestan $6 + $12 = $18, que también es 9 × $2. Nia sumó el mismo número a las dos cantidades en vez de mantener la tasa de $2 por cuaderno.",
    ],
    accept:
      "ratio rate proportional multiply multiplying add adding each notebook cost 18 12 2 price",
    focus: [
      "how Nia finds the cost of the extra notebooks",
      "cómo halla Nia el costo de los cuadernos adicionales",
    ],
    terms: [
      ["unit rate", "tasa unitaria", "the amount for exactly one of something"],
      ["proportional", "proporcional", "growing by the same multiplier"],
    ],
    transfer: [
      "A recipe uses 2 cups of rice for 4 people. A friend says 8 people need 6 cups because 4 more people need 4 more cups. What would you check?",
      "Una receta usa 2 tazas de arroz para 4 personas. Un amigo dice que 8 personas necesitan 6 tazas porque 4 personas más necesitan 4 tazas más. ¿Qué revisarías?",
    ],
    calc: [
      ["6/3", 2],
      ["9*2", 18],
      ["6*2", 12],
      ["6+12", 18],
    ],
  },
  {
    id: "s68-respiration",
    subject: "science",
    flaw: "fact",
    concept: "photosynthesis and cellular respiration in plants",
    title: ["Do plants breathe?", "¿Respiran las plantas?"],
    speaker: "Omar",
    lines: [
      [
        "Photosynthesis uses light energy to turn carbon dioxide and water into sugar and oxygen.",
        "La fotosíntesis usa energía de la luz para convertir dióxido de carbono y agua en azúcar y oxígeno.",
        "This is a correct summary of photosynthesis.",
        "Este es un resumen correcto de la fotosíntesis.",
      ],
      [
        "Cellular respiration is the process that releases energy from sugar so cells can use it.",
        "La respiración celular es el proceso que libera la energía del azúcar para que las células la usen.",
        "This is a correct description of cellular respiration.",
        "Esta es una descripción correcta de la respiración celular.",
      ],
      [
        "Plants do not need cellular respiration, because they make their own food.",
        "Las plantas no necesitan respiración celular, porque hacen su propio alimento.",
      ],
      [
        "Plants release oxygen as a product of photosynthesis.",
        "Las plantas liberan oxígeno como producto de la fotosíntesis.",
        "Oxygen is a product of photosynthesis. This line is correct.",
        "El oxígeno es un producto de la fotosíntesis. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "Seeds that sprout in the dark use up their stored sugar and give off carbon dioxide.",
        "Las semillas que germinan en la oscuridad gastan su azúcar almacenado y desprenden dióxido de carbono.",
        "We can check this by measuring the carbon dioxide from sprouting seeds.",
        "Podemos comprobarlo midiendo el dióxido de carbono de semillas que germinan.",
      ],
      [
        "e",
        "Plant cells, including root cells that get no sunlight, contain mitochondria.",
        "Las células de las plantas, incluidas las de las raíces que no reciben luz, tienen mitocondrias.",
        "We can check this under a microscope or in a biology reference.",
        "Podemos comprobarlo con un microscopio o en una referencia de biología.",
      ],
      [
        "a",
        "Omar feels that making food means a plant never has to use it.",
        "Omar siente que hacer alimento significa que una planta nunca tiene que usarlo.",
        "This is an assumption. Making food and using food are different processes.",
        "Es una suposición. Hacer alimento y usar alimento son procesos distintos.",
      ],
      [
        "o",
        "Omar studies a plant in his bedroom window.",
        "Omar estudia una planta en la ventana de su cuarto.",
        "Where the plant is does not tell us about its cells.",
        "Dónde está la planta no nos dice nada sobre sus células.",
      ],
    ],
    fix: [
      [
        "Plants do cellular respiration only at night, because photosynthesis stops without light.",
        "Las plantas hacen respiración celular solo de noche, porque la fotosíntesis se detiene sin luz.",
      ],
      [
        "Plants need cellular respiration too, because their cells must release the energy stored in sugar to grow and live, day and night.",
        "Las plantas también necesitan respiración celular, porque sus células deben liberar la energía almacenada en el azúcar para crecer y vivir, de día y de noche.",
      ],
      [
        "Plants do not need energy, because sunlight is already energy.",
        "Las plantas no necesitan energía, porque la luz del sol ya es energía.",
      ],
    ],
    right: 1,
    why: [
      "Photosynthesis stores light energy in sugar. Cellular respiration is how every living cell, plant cells included, releases that energy to do its work. Plants carry out both: respiration happens day and night, in all their cells, including roots that never see light. Making food does not remove the need to use it.",
      "La fotosíntesis almacena la energía de la luz en azúcar. La respiración celular es como cada célula viva, incluidas las de las plantas, libera esa energía para trabajar. Las plantas hacen las dos: la respiración ocurre de día y de noche, en todas sus células, incluso en las raíces que nunca ven la luz. Hacer alimento no quita la necesidad de usarlo.",
    ],
    accept:
      "plants respiration cellular energy sugar mitochondria photosynthesis roots day night need",
    focus: [
      "what Omar says plants do with the food they make",
      "lo que Omar dice que hacen las plantas con el alimento que fabrican",
    ],
    terms: [
      ["photosynthesis", "fotosíntesis", "the process that stores light energy in sugar"],
      [
        "cellular respiration",
        "respiración celular",
        "the process that releases energy from sugar",
      ],
      ["mitochondria", "mitocondrias", "parts of a cell where respiration releases energy"],
    ],
    transfer: [
      "A friend says fish do not need cellular respiration because they live in water. What claim would you check, and how?",
      "Un amigo dice que los peces no necesitan respiración celular porque viven en el agua. ¿Qué afirmación revisarías y cómo?",
    ],
  },
  {
    id: "s68-evaporation",
    subject: "science",
    flaw: "overgeneral",
    concept: "evaporation versus boiling",
    title: ["Water into gas", "Agua que se hace gas"],
    speaker: "Hana",
    lines: [
      [
        "At sea level, water boils when it reaches 100 °C.",
        "A nivel del mar, el agua hierve cuando llega a 100 °C.",
        "This is the boiling point of water at sea level. This line is correct.",
        "Este es el punto de ebullición del agua a nivel del mar. Esta línea es correcta.",
      ],
      [
        "Evaporation is when liquid water changes to a gas at its surface.",
        "La evaporación es cuando el agua líquida se convierte en gas en su superficie.",
        "This is a correct meaning of evaporation.",
        "Este es un significado correcto de evaporación.",
      ],
      [
        "Evaporation only happens when the water is at 100 °C.",
        "La evaporación solo ocurre cuando el agua está a 100 °C.",
      ],
      [
        "Boiling and evaporation both turn liquid water into a gas.",
        "La ebullición y la evaporación convierten agua líquida en gas.",
        "Both are ways liquid water becomes a gas. This line is correct.",
        "Ambas son formas en que el agua líquida se convierte en gas. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "Wet clothes dry on a clothesline on a 20 °C day.",
        "La ropa mojada se seca en un tendedero en un día de 20 °C.",
        "We can check this by hanging wet clothes outside.",
        "Podemos comprobarlo colgando ropa mojada afuera.",
      ],
      [
        "e",
        "A puddle on a sidewalk is gone hours later, though the air is nowhere near 100 °C.",
        "Un charco en la acera desaparece horas después, aunque el aire está lejos de los 100 °C.",
        "We can check this by watching a puddle.",
        "Podemos comprobarlo observando un charco.",
      ],
      [
        "a",
        "Hana thinks water only turns to gas if she can see steam.",
        "Hana piensa que el agua solo se convierte en gas si ella puede ver vapor.",
        "This is an assumption. Water vapor itself is invisible.",
        "Es una suposición. El vapor de agua en sí es invisible.",
      ],
      [
        "o",
        "The kettle in Hana's kitchen is silver.",
        "La tetera de la cocina de Hana es plateada.",
        "The color of the kettle does not change when water evaporates.",
        "El color de la tetera no cambia cuándo se evapora el agua.",
      ],
    ],
    fix: [
      [
        "Evaporation happens only when water is above 50 °C.",
        "La evaporación ocurre solo cuando el agua está a más de 50 °C.",
      ],
      [
        "Evaporation happens only when water is hot, like in a kettle.",
        "La evaporación ocurre solo cuando el agua está caliente, como en una tetera.",
      ],
      [
        "Evaporation happens well below 100 °C, because some particles at the surface move fast enough to escape, so a puddle can dry on a cool day.",
        "La evaporación ocurre muy por debajo de 100 °C, porque algunas partículas de la superficie se mueven lo bastante rápido para escapar, así que un charco puede secarse en un día fresco.",
      ],
    ],
    right: 2,
    why: [
      "Evaporation happens at the surface at many temperatures. Particles in liquid water move at different speeds, and the fastest ones at the surface can escape as gas even when the water is cool. Warmer water evaporates faster, but a puddle dries and clothes dry well below 100 °C. Boiling is different: it happens throughout the liquid at the boiling point.",
      "La evaporación ocurre en la superficie a muchas temperaturas. Las partículas del agua líquida se mueven a distintas velocidades, y las más rápidas de la superficie pueden escapar como gas aunque el agua esté fría. El agua más caliente se evapora más rápido, pero un charco y la ropa se secan muy por debajo de 100 °C. La ebullición es distinta: ocurre en todo el líquido en el punto de ebullición.",
    ],
    accept:
      "evaporation evaporate boiling temperature surface particles puddle clothes dry 100 only any",
    focus: [
      "the temperature condition Hana gives for evaporation",
      "la condición de temperatura que Hana da para la evaporación",
    ],
    terms: [
      ["evaporation", "evaporación", "liquid changing to gas at its surface"],
      ["boiling point", "punto de ebullición", "the temperature at which a liquid boils"],
      ["particle", "partícula", "a tiny piece of matter"],
    ],
    transfer: [
      "A friend says a lake cannot lose water by evaporation in winter because it never reaches 100 °C. What evidence could you look for?",
      "Un amigo dice que un lago no puede perder agua por evaporación en invierno porque nunca llega a 100 °C. ¿Qué evidencia podrías buscar?",
    ],
  },
  {
    id: "s68-confounder",
    subject: "science",
    flaw: "cause",
    concept: "correlation is not causation",
    title: ["Ice cream and swimming", "Helado y natación"],
    speaker: "Diego",
    lines: [
      [
        "A town records its ice cream sales and its swimming accidents each month for a year.",
        "Un pueblo registra sus ventas de helado y sus accidentes de natación cada mes durante un año.",
        "This line describes the data collected.",
        "Esta línea describe los datos recopilados.",
      ],
      [
        "Both numbers rise in June, July and August, and both fall in December, January and February.",
        "Los dos números suben en junio, julio y agosto, y los dos bajan en diciembre, enero y febrero.",
        "This is the pattern in the records. Two things rising together is something we can see.",
        "Este es el patrón en los registros. Que dos cosas suban juntas es algo que se puede ver.",
      ],
      [
        "So eating ice cream must cause swimming accidents.",
        "Entonces comer helado debe causar los accidentes de natación.",
      ],
      [
        "The town pool also has its most visitors in July.",
        "La piscina del pueblo también tiene más visitantes en julio.",
        "This is an additional fact about the town. It is useful evidence.",
        "Este es un dato adicional sobre el pueblo. Es evidencia útil.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "The town pool has its most visitors in July, when the weather is hottest.",
        "La piscina del pueblo tiene más visitantes en julio, cuando hace más calor.",
        "We can check this in the pool's attendance records.",
        "Podemos comprobarlo en los registros de asistencia de la piscina.",
      ],
      [
        "e",
        "Both numbers fall in the cold months, when few people swim or buy ice cream.",
        "Los dos números bajan en los meses fríos, cuando poca gente nada o compra helado.",
        "We can check this in the monthly data.",
        "Podemos comprobarlo en los datos mensuales.",
      ],
      [
        "a",
        "Diego feels that things which rise together must be linked by cause.",
        "Diego siente que las cosas que suben juntas deben estar ligadas por una causa.",
        "This is an assumption. Two things can rise together for another reason.",
        "Es una suposición. Dos cosas pueden subir juntas por otra razón.",
      ],
      [
        "o",
        "Diego's town is next to a river.",
        "El pueblo de Diego está junto a un río.",
        "The river does not help decide whether ice cream causes accidents.",
        "El río no ayuda a decidir si el helado causa accidentes.",
      ],
    ],
    fix: [
      [
        "Swimming accidents must cause people to buy ice cream.",
        "Los accidentes de natación deben hacer que la gente compre helado.",
      ],
      [
        "Hot weather is a third factor: it makes more people buy ice cream and also more people swim, so both numbers rise together without one causing the other.",
        "El clima caluroso es un tercer factor: hace que más gente compre helado y que más gente nade, así que los dos números suben juntos sin que uno cause el otro.",
      ],
      [
        "The two numbers rising together prove that ice cream is a little bit dangerous.",
        "Que los dos números suban juntos demuestra que el helado es un poco peligroso.",
      ],
    ],
    right: 1,
    why: [
      "Two things that rise and fall together are correlated, but that does not show that one causes the other. Here a third factor, hot weather, explains both: more people buy ice cream and more people swim. With more swimmers there are more accidents. To test a cause we would need to compare months with the same weather.",
      "Dos cosas que suben y bajan juntas están correlacionadas, pero eso no demuestra que una cause la otra. Aquí un tercer factor, el clima caluroso, explica ambas: más gente compra helado y más gente nada. Con más nadadores hay más accidentes. Para probar una causa tendríamos que comparar meses con el mismo clima.",
    ],
    accept:
      "correlation cause causes causing weather hot summer swimming third factor together season",
    focus: [
      "what Diego concludes from two numbers rising together",
      "lo que Diego concluye de que dos números suban juntos",
    ],
    terms: [
      ["correlation", "correlación", "two things changing together"],
      ["cause", "causa", "something that makes another thing happen"],
      ["factor", "factor", "one thing that helps explain a result"],
    ],
    transfer: [
      "A school notices that students with more pairs of sneakers have higher reading scores. A friend says buying sneakers raises scores. What third factor might explain both?",
      "Una escuela nota que los estudiantes con más pares de tenis tienen mejores puntajes de lectura. Un amigo dice que comprar tenis sube los puntajes. ¿Qué tercer factor podría explicar ambas cosas?",
    ],
  },
  {
    id: "s68-heat-temperature",
    subject: "science",
    flaw: "assumption",
    concept: "thermal energy versus temperature",
    title: ["Tea and bathtub", "Té y bañera"],
    speaker: "Imani",
    lines: [
      [
        "Temperature measures the average energy of motion of the particles in a substance.",
        "La temperatura mide la energía promedio de movimiento de las partículas de una sustancia.",
        "This is the scientific meaning of temperature. This line is correct.",
        "Este es el significado científico de temperatura. Esta línea es correcta.",
      ],
      [
        "A cup of tea at 80 °C is hotter than a bathtub of water at 40 °C.",
        "Una taza de té a 80 °C está más caliente que una bañera de agua a 40 °C.",
        "80 °C is a higher temperature than 40 °C. This line is correct.",
        "80 °C es una temperatura más alta que 40 °C. Esta línea es correcta.",
      ],
      [
        "A bathtub holds far more water than a cup, so it contains many more particles.",
        "Una bañera contiene mucha más agua que una taza, así que tiene muchísimas más partículas.",
        "A bathtub has far more water, so far more particles. This line is correct.",
        "Una bañera tiene mucha más agua, así que muchas más partículas. Esta línea es correcta.",
      ],
      [
        "So the bathtub has less thermal energy than the cup, because its temperature is lower.",
        "Entonces la bañera tiene menos energía térmica que la taza, porque su temperatura es menor.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "A 150-liter bathtub of 40 °C water can warm a cold bathroom, but a cup of 80 °C tea cannot.",
        "Una bañera de 150 litros con agua a 40 °C puede calentar un baño frío, pero una taza de té a 80 °C no.",
        "We can check this by measuring how much the room warms.",
        "Podemos comprobarlo midiendo cuánto se calienta el cuarto.",
      ],
      [
        "e",
        "Melting a large block of ice takes more thermal energy than melting one ice cube, even at the same temperature.",
        "Derretir un bloque grande de hielo requiere más energía térmica que derretir un cubito, aun a la misma temperatura.",
        "We can check this by melting both and comparing.",
        "Podemos comprobarlo derritiendo ambos y comparando.",
      ],
      [
        "a",
        "Imani feels that a higher temperature always means more energy in total.",
        "Imani siente que una temperatura más alta siempre significa más energía en total.",
        "This is an assumption. Total energy also depends on how much substance there is.",
        "Es una suposición. La energía total también depende de cuánta sustancia hay.",
      ],
      [
        "o",
        "The tea is in a mug with a handle.",
        "El té está en una taza con asa.",
        "The mug's handle does not change the energy of the tea.",
        "El asa de la taza no cambia la energía del té.",
      ],
    ],
    fix: [
      [
        "The bathtub has more thermal energy, because it has many more particles, even though each particle has less energy on average.",
        "La bañera tiene más energía térmica, porque tiene muchas más partículas, aunque cada partícula tenga menos energía en promedio.",
      ],
      [
        "The cup has less thermal energy, because tea cools quickly.",
        "La taza tiene menos energía térmica, porque el té se enfría rápido.",
      ],
      [
        "Thermal energy depends only on temperature, so the cup has more.",
        "La energía térmica depende solo de la temperatura, así que la taza tiene más.",
      ],
    ],
    right: 0,
    why: [
      "Temperature is an average for each particle. Thermal energy is the total energy of all the particles, so it depends on both temperature and how much matter there is. The bathtub has a lower temperature, but far more particles, so it holds much more thermal energy than the cup. That is why it can warm a room and the tea cannot.",
      "La temperatura es un promedio por partícula. La energía térmica es la energía total de todas las partículas, así que depende de la temperatura y de cuánta materia hay. La bañera tiene menor temperatura pero muchísimas más partículas, así que guarda mucha más energía térmica que la taza. Por eso puede calentar un cuarto y el té no.",
    ],
    accept:
      "temperature thermal energy particles average total amount bathtub cup more less depends",
    focus: [
      "what Imani compares when she judges thermal energy",
      "lo que compara Imani cuando juzga la energía térmica",
    ],
    terms: [
      ["temperature", "temperatura", "the average energy of motion of the particles"],
      ["thermal energy", "energía térmica", "the total energy of motion of all the particles"],
      ["particle", "partícula", "a tiny piece of matter"],
    ],
    transfer: [
      "A friend says a spark from a fire is hotter than a bucket of warm water, so it has more thermal energy. What two things would you compare?",
      "Un amigo dice que una chispa de una fogata está más caliente que un balde de agua tibia, así que tiene más energía térmica. ¿Qué dos cosas compararías?",
    ],
  },
  {
    id: "ss68-supply-demand",
    subject: "social",
    flaw: "cause",
    concept: "supply, demand and price",
    title: ["Selling out", "Agotarse"],
    speaker: "Tessa",
    lines: [
      [
        "Demand is how much buyers want a product at different prices; supply is how much sellers offer.",
        "La demanda es cuánto quieren los compradores de un producto a distintos precios; la oferta es cuánto ofrecen los vendedores.",
        "These are the usual meanings of demand and supply. This line is correct.",
        "Estos son los significados habituales de demanda y oferta. Esta línea es correcta.",
      ],
      [
        "When many people want something that is scarce, its price tends to rise.",
        "Cuando mucha gente quiere algo que es escaso, su precio tiende a subir.",
        "High demand with low supply does push prices up. This line is correct.",
        "Mucha demanda con poca oferta sí hace subir los precios. Esta línea es correcta.",
      ],
      [
        "When a store has too many unsold winter jackets, it usually lowers the price to sell them.",
        "Cuando una tienda tiene demasiadas chaquetas de invierno sin vender, normalmente baja el precio para venderlas.",
        "Too much supply and too little demand does push prices down. This line is correct.",
        "Demasiada oferta y poca demanda sí hace bajar los precios. Esta línea es correcta.",
      ],
      [
        "If a jacket sells out every day, the store should lower the price, because lower prices bring more buyers.",
        "Si una chaqueta se agota todos los días, la tienda debería bajar el precio, porque los precios bajos traen más compradores.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "Tickets to a sold-out concert are often resold at higher prices.",
        "Las entradas de un concierto agotado a menudo se revenden a precios más altos.",
        "We can check this by looking at resale sites or news reports.",
        "Podemos comprobarlo en sitios de reventa o en noticias.",
      ],
      [
        "e",
        "Stores put leftover products on clearance.",
        "Las tiendas rebajan los productos que sobran.",
        "We can check this by visiting a store or reading sale ads.",
        "Podemos comprobarlo visitando una tienda o leyendo anuncios de ofertas.",
      ],
      [
        "a",
        "Tessa feels that stores always want customers to be happy.",
        "Tessa siente que las tiendas siempre quieren que los clientes estén contentos.",
        "This is an assumption about what stores want, not evidence about price.",
        "Es una suposición sobre lo que quieren las tiendas, no evidencia sobre el precio.",
      ],
      [
        "o",
        "The store is in a mall.",
        "La tienda está en un centro comercial.",
        "The store's location does not tell us which way prices should move.",
        "La ubicación de la tienda no nos dice hacia dónde deberían moverse los precios.",
      ],
    ],
    fix: [
      [
        "The store should lower the price, because the jackets are popular.",
        "La tienda debería bajar el precio, porque las chaquetas son populares.",
      ],
      [
        "The price does not matter when jackets sell out.",
        "El precio no importa cuando las chaquetas se agotan.",
      ],
      [
        "When a product sells out, demand is higher than supply, so the store can raise the price and still sell it.",
        "Cuando un producto se agota, la demanda es mayor que la oferta, así que la tienda puede subir el precio y aun así venderlo.",
      ],
    ],
    right: 2,
    why: [
      "When a product sells out every day, buyers want more than the store supplies. That excess demand lets the store raise the price and still sell every jacket. Lowering the price would make demand even bigger and the shortage worse. Tessa's own line 3 shows the opposite case: unsold jackets push the price down.",
      "Cuando un producto se agota todos los días, los compradores quieren más de lo que la tienda ofrece. Ese exceso de demanda permite subir el precio y aun así vender todas las chaquetas. Bajar el precio haría la demanda aún mayor y la escasez peor. La línea 3 de Tessa muestra el caso contrario: las chaquetas sin vender hacen bajar el precio.",
    ],
    accept: "demand supply price raise higher lower sells sold shortage scarce buyers more",
    focus: [
      "which way Tessa says the price should move",
      "hacia dónde dice Tessa que debe moverse el precio",
    ],
    terms: [
      ["demand", "demanda", "how much buyers want a product"],
      ["supply", "oferta", "how much of a product sellers offer"],
      ["scarce", "escaso", "hard to find because there is not much of it"],
    ],
    transfer: [
      "A friend says if nobody buys a new snack, the company should raise its price. What does supply and demand suggest instead?",
      "Un amigo dice que si nadie compra un nuevo bocadillo, la empresa debería subir su precio. ¿Qué sugieren en cambio la oferta y la demanda?",
    ],
  },
  {
    id: "ss68-branches",
    subject: "social",
    flaw: "fact",
    concept: "branches of the U.S. government",
    title: ["Who does what?", "¿Quién hace qué?"],
    speaker: "Elias",
    lines: [
      [
        "The U.S. Constitution divides power among three branches of government.",
        "La Constitución de Estados Unidos divide el poder entre tres ramas del gobierno.",
        "The three branches are legislative, executive and judicial. This line is correct.",
        "Las tres ramas son la legislativa, la ejecutiva y la judicial. Esta línea es correcta.",
      ],
      [
        "The judicial branch, which includes the Supreme Court, decides whether laws follow the Constitution.",
        "La rama judicial, que incluye la Corte Suprema, decide si las leyes cumplen con la Constitución.",
        "This is the role of the courts. This line is correct.",
        "Este es el papel de los tribunales. Esta línea es correcta.",
      ],
      [
        "The president writes the laws, and Congress carries them out.",
        "El presidente escribe las leyes y el Congreso las ejecuta.",
      ],
      [
        "Dividing power means that no single group controls everything.",
        "Dividir el poder significa que ningún grupo controla todo.",
        "This is the purpose of separating powers. This line is correct.",
        "Este es el propósito de separar los poderes. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "Article I of the Constitution gives legislative power, the power to make laws, to Congress.",
        "El Artículo I de la Constitución da el poder legislativo, el poder de hacer leyes, al Congreso.",
        "We can check this by reading Article I.",
        "Podemos comprobarlo leyendo el Artículo I.",
      ],
      [
        "e",
        "Article II gives executive power, the power to carry out laws, to the president.",
        "El Artículo II da el poder ejecutivo, el poder de hacer cumplir las leyes, al presidente.",
        "We can check this by reading Article II.",
        "Podemos comprobarlo leyendo el Artículo II.",
      ],
      [
        "a",
        "Elias thinks the leader of a country must be the one who writes the rules.",
        "Elias piensa que el líder de un país debe ser quien escribe las reglas.",
        "This is an assumption. The Constitution says who writes laws.",
        "Es una suposición. La Constitución dice quién escribe las leyes.",
      ],
      [
        "o",
        "Elias visited Washington, D.C., last summer.",
        "Elias visitó Washington, D. C., el verano pasado.",
        "The trip does not change which branch does what.",
        "El viaje no cambia qué rama hace qué.",
      ],
    ],
    fix: [
      [
        "Congress writes the laws, and the president and the executive branch carry them out.",
        "El Congreso escribe las leyes, y el presidente y la rama ejecutiva las ejecutan.",
      ],
      [
        "The Supreme Court writes the laws, and the president carries them out.",
        "La Corte Suprema escribe las leyes y el presidente las ejecuta.",
      ],
      [
        "The president writes the laws, and the courts carry them out.",
        "El presidente escribe las leyes y los tribunales las ejecutan.",
      ],
    ],
    right: 0,
    why: [
      "The Constitution gives each branch its own job. Congress, the legislative branch, writes and passes laws. The president, who leads the executive branch, carries them out and enforces them. The president can sign or veto bills but does not write them. Elias's flawed line swaps the two jobs.",
      "La Constitución da a cada rama su propio trabajo. El Congreso, la rama legislativa, escribe y aprueba las leyes. El presidente, que dirige la rama ejecutiva, las ejecuta y hace que se cumplan. El presidente puede firmar o vetar proyectos de ley, pero no los escribe. La línea errónea de Elias cambia los dos trabajos.",
    ],
    accept:
      "congress president legislative executive laws write writes carry enforce branch branches constitution",
    focus: ["which branch Elias says writes the laws", "qué rama dice Elias que escribe las leyes"],
    terms: [
      ["legislative", "legislativo", "having to do with making laws"],
      ["executive", "ejecutivo", "having to do with carrying out laws"],
      ["judicial", "judicial", "having to do with courts and judges"],
    ],
    transfer: [
      "A friend says the Supreme Court passes new laws each year. Which part of the Constitution could you read to test that?",
      "Un amigo dice que la Corte Suprema aprueba nuevas leyes cada año. ¿Qué parte de la Constitución podrías leer para probarlo?",
    ],
  },
  {
    id: "ss68-ww1",
    subject: "social",
    flaw: "overgeneral",
    concept: "multiple causes of World War I",
    title: ["Spark and causes", "Chispa y causas"],
    speaker: "Rahul",
    lines: [
      [
        "On June 28, 1914, Archduke Franz Ferdinand of Austria-Hungary was assassinated in Sarajevo.",
        "El 28 de junio de 1914, el archiduque Francisco Fernando de Austria-Hungría fue asesinado en Sarajevo.",
        "This is a well-documented event, and the date is correct.",
        "Es un hecho bien documentado, y la fecha es correcta.",
      ],
      [
        "Alliances between European countries meant a fight between two could pull in others.",
        "Las alianzas entre países europeos hacían que un conflicto entre dos pudiera arrastrar a otros.",
        "This is one of the causes historians name. This line is correct.",
        "Esta es una de las causas que nombran los historiadores. Esta línea es correcta.",
      ],
      [
        "Countries were also building larger armies and navies and competing for colonies.",
        "Los países también construían ejércitos y flotas más grandes y competían por colonias.",
        "This is another cause historians name. This line is correct.",
        "Esta es otra causa que nombran los historiadores. Esta línea es correcta.",
      ],
      [
        "So the assassination was the only cause of World War I.",
        "Entonces el asesinato fue la única causa de la Primera Guerra Mundial.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "Treaties tied countries into two alliance groups before 1914.",
        "Los tratados unían a los países en dos grupos de alianzas antes de 1914.",
        "We can check this in history books about the alliances.",
        "Podemos comprobarlo en libros de historia sobre las alianzas.",
      ],
      [
        "e",
        "European navies and armies grew much larger in the years before 1914.",
        "Las flotas y los ejércitos europeos crecieron mucho en los años antes de 1914.",
        "We can check this in historical records about military spending.",
        "Podemos comprobarlo en registros históricos sobre el gasto militar.",
      ],
      [
        "a",
        "Rahul feels that big wars need one simple reason.",
        "Rahul siente que las guerras grandes necesitan una sola razón sencilla.",
        "This is an assumption, not evidence about this war.",
        "Es una suposición, no evidencia sobre esta guerra.",
      ],
      [
        "o",
        "Rahul's textbook has a map of Europe.",
        "El libro de texto de Rahul tiene un mapa de Europa.",
        "The map does not tell us how many causes there were.",
        "El mapa no nos dice cuántas causas hubo.",
      ],
    ],
    fix: [
      [
        "The assassination was the spark, but alliances, military buildup and rivalry for colonies were also causes of World War I.",
        "El asesinato fue la chispa, pero las alianzas, el aumento militar y la rivalidad por las colonias también fueron causas de la Primera Guerra Mundial.",
      ],
      [
        "The assassination had nothing to do with starting the war.",
        "El asesinato no tuvo nada que ver con el inicio de la guerra.",
      ],
      [
        "Alliances were the only cause of World War I.",
        "Las alianzas fueron la única causa de la Primera Guerra Mundial.",
      ],
    ],
    right: 0,
    why: [
      "The assassination was the event that set the war in motion, but historians point to several deeper causes: a web of alliances, growing armies and navies, and competition for colonies. Rahul's own lines 2 and 3 name some of them. Calling any single event the only cause leaves out the conditions that made a wide war possible.",
      "El asesinato fue el suceso que puso la guerra en marcha, pero los historiadores señalan varias causas más profundas: una red de alianzas, ejércitos y flotas cada vez mayores y la competencia por colonias. Las líneas 2 y 3 de Rahul nombran algunas. Llamar a un solo suceso la única causa deja fuera las condiciones que hicieron posible una guerra tan amplia.",
    ],
    accept:
      "assassination only cause causes alliances military colonies spark war more one several",
    focus: ["how many causes Rahul says there were", "cuántas causas dice Rahul que hubo"],
    terms: [
      ["alliance", "alianza", "an agreement between countries to help each other"],
      ["assassination", "asesinato (de un líder)", "the killing of an important person"],
      ["colony", "colonia", "land controlled by another country"],
    ],
    transfer: [
      "A friend says one single speech caused a famous protest movement. What kinds of evidence could you look for about other causes?",
      "Un amigo dice que un solo discurso causó un famoso movimiento de protesta. ¿Qué tipos de evidencia podrías buscar sobre otras causas?",
    ],
  },
  {
    id: "ela68-motive",
    subject: "ela",
    flaw: "assumption",
    concept: "character motive supported by text evidence",
    title: ["Why did Dara skip?", "¿Por qué faltó Dara?"],
    speaker: "Lucia",
    lines: [
      [
        "In the story, Dara tells her coach she is too sick to play in the final game.",
        "En el cuento, Dara le dice a su entrenador que está demasiado enferma para jugar el partido final.",
        "This line retells what happens in the story.",
        "Esta línea cuenta lo que pasa en el cuento.",
      ],
      [
        "The narrator says Dara “had practiced every night until the streetlights came on.”",
        "El narrador dice que Dara «había practicado todas las noches hasta que se encendían los faroles».",
        "This is a quote from the text that shows how hard Dara worked.",
        "Es una cita del texto que muestra cuánto se esforzó Dara.",
      ],
      [
        "When the crowd roars, Dara “gripped the ball until her knuckles turned white.”",
        "Cuando la multitud ruge, Dara «apretó el balón hasta que los nudillos se le pusieron blancos».",
        "This is a quote from the text that shows how Dara reacts to the crowd.",
        "Es una cita del texto que muestra cómo reacciona Dara ante la multitud.",
      ],
      [
        "So Dara skips the game because she does not care about the team.",
        "Entonces Dara falta al partido porque no le importa el equipo.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "The narrator says Dara “had practiced every night until the streetlights came on.”",
        "El narrador dice que Dara «había practicado todas las noches hasta que se encendían los faroles».",
        "We can check this by finding the sentence in the text.",
        "Podemos comprobarlo encontrando la oración en el texto.",
      ],
      [
        "e",
        "The text says Dara “gripped the ball until her knuckles turned white” when she heard the crowd.",
        "El texto dice que Dara «apretó el balón hasta que los nudillos se le pusieron blancos» cuando oyó a la multitud.",
        "We can check this by finding the sentence in the text.",
        "Podemos comprobarlo encontrando la oración en el texto.",
      ],
      [
        "a",
        "Lucia feels that someone who skips a game must not care.",
        "Lucia siente que alguien que falta a un partido no se preocupa.",
        "This is an assumption. It is not supported by the text.",
        "Es una suposición. No está respaldada por el texto.",
      ],
      [
        "o",
        "Dara plays on a team called the Hawks.",
        "Dara juega en un equipo llamado los Halcones.",
        "The team's name does not tell us why Dara skips the game.",
        "El nombre del equipo no nos dice por qué Dara falta al partido.",
      ],
    ],
    fix: [
      [
        "Dara skips the game because she is angry at her coach.",
        "Dara falta al partido porque está enojada con su entrenador.",
      ],
      [
        "Dara probably skips the game because she is afraid, since the text shows her practicing hard and gripping the ball when the crowd roars.",
        "Dara probablemente falta al partido porque tiene miedo, ya que el texto la muestra practicando mucho y apretando el balón cuando la multitud ruge.",
      ],
      [
        "Dara skips the game because she is really sick, and the text proves it.",
        "Dara falta al partido porque está realmente enferma, y el texto lo prueba.",
      ],
    ],
    right: 1,
    why: [
      "A character's motive has to be supported by the text. The text shows Dara practicing every night, which suggests she cares a great deal, and gripping the ball hard when the crowd roars, which suggests fear or nerves. “She does not care” goes against that evidence. A better inference is that Dara is afraid, and says she is sick to avoid the game.",
      "El motivo de un personaje debe estar respaldado por el texto. El texto muestra a Dara practicando todas las noches, lo que sugiere que le importa mucho, y apretando el balón cuando la multitud ruge, lo que sugiere miedo o nervios. «No le importa» va en contra de esa evidencia. Una inferencia mejor es que Dara tiene miedo y dice que está enferma para evitar el partido.",
    ],
    accept:
      "dara care afraid fear nervous text evidence practiced practicing gripped crowd motive quote",
    focus: [
      "what the text shows about how Dara feels",
      "lo que muestra el texto sobre cómo se siente Dara",
    ],
    terms: [
      ["motive", "motivo", "the reason a character does something"],
      ["infer", "inferir", "to figure something out from clues"],
      ["text evidence", "evidencia del texto", "words from the text that support an idea"],
    ],
    transfer: [
      "A friend says a character who lies must be a bad person. What text evidence would you look for before agreeing?",
      "Un amigo dice que un personaje que miente debe ser mala persona. ¿Qué evidencia del texto buscarías antes de estar de acuerdo?",
    ],
  },
  {
    id: "ela68-claim-support",
    subject: "ela",
    flaw: "missing",
    concept: "does the evidence support the claim?",
    title: ["What the article proves", "Lo que prueba el artículo"],
    speaker: "Marta",
    lines: [
      [
        "The article “Later Start, Better Sleep” describes one school that moved its first bell from 7:30 a.m. to 8:30 a.m.",
        "El artículo «Más tarde, mejor sueño» describe una escuela que movió su primera campana de las 7:30 a. m. a las 8:30 a. m.",
        "This line tells what the article is about, and it is limited to one school.",
        "Esta línea dice de qué trata el artículo, y se limita a una escuela.",
      ],
      [
        "Students there reported sleeping about 40 minutes more each night.",
        "Los estudiantes de allí informaron que dormían unos 40 minutos más cada noche.",
        "This is a result the article reports about sleep. This line is correct.",
        "Este es un resultado que el artículo informa sobre el sueño. Esta línea es correcta.",
      ],
      [
        "The school nurse says fewer students came to her office feeling tired.",
        "La enfermera de la escuela dice que menos estudiantes iban a su oficina por cansancio.",
        "This is evidence the article gives about tiredness. This line is correct.",
        "Esta es evidencia que el artículo da sobre el cansancio. Esta línea es correcta.",
      ],
      [
        "So the article proves that later start times raise test scores at every school.",
        "Entonces el artículo prueba que los horarios de inicio más tardíos suben los puntajes de las pruebas en todas las escuelas.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "The article reports 40 more minutes of sleep and fewer tired students at one school.",
        "El artículo informa 40 minutos más de sueño y menos estudiantes cansados en una escuela.",
        "We can check this by rereading the article.",
        "Podemos comprobarlo releyendo el artículo.",
      ],
      [
        "e",
        "The article is about a single school, not every school.",
        "El artículo trata de una sola escuela, no de todas.",
        "We can check this by rereading the article.",
        "Podemos comprobarlo releyendo el artículo.",
      ],
      [
        "a",
        "Marta feels that better sleep must also mean better grades.",
        "Marta siente que dormir mejor debe significar también mejores calificaciones.",
        "This is an assumption. The article does not report grades or test scores.",
        "Es una suposición. El artículo no informa calificaciones ni puntajes.",
      ],
      [
        "o",
        "The article is printed on glossy paper.",
        "El artículo está impreso en papel brillante.",
        "The paper does not change what the article's evidence shows.",
        "El papel no cambia lo que muestra la evidencia del artículo.",
      ],
    ],
    fix: [
      [
        "The article proves later start times raise test scores, but only at that school.",
        "El artículo prueba que los horarios de inicio tardíos suben los puntajes, pero solo en esa escuela.",
      ],
      [
        "The article proves that later start times have no effect.",
        "El artículo prueba que los horarios de inicio tardíos no tienen efecto.",
      ],
      [
        "The article gives evidence about sleep and tiredness at one school; it does not give evidence about test scores or other schools.",
        "El artículo da evidencia sobre el sueño y el cansancio en una escuela; no da evidencia sobre puntajes de pruebas ni sobre otras escuelas.",
      ],
    ],
    right: 2,
    why: [
      "A claim is only as strong as the evidence for it. Marta's lines 2 and 3 show evidence about sleep and tiredness at one school. They say nothing about test scores, and nothing about other schools. “Proves … every school” goes far beyond what that evidence can support. A careful reader says what the article shows, and what it does not.",
      "Una afirmación es tan fuerte como la evidencia que la respalda. Las líneas 2 y 3 de Marta muestran evidencia sobre el sueño y el cansancio en una escuela. No dicen nada sobre puntajes de pruebas ni sobre otras escuelas. «Prueba … todas las escuelas» va mucho más allá de lo que esa evidencia puede respaldar. Un lector cuidadoso dice lo que el artículo muestra y lo que no.",
    ],
    accept: "evidence prove proves claim test scores article school sleep tired one every support",
    focus: [
      "whether the article's evidence matches what Marta says it proves",
      "si la evidencia del artículo coincide con lo que Marta dice que prueba",
    ],
    terms: [
      ["evidence", "evidencia", "facts or details that support a claim"],
      ["claim", "afirmación", "a statement that something is true"],
      ["prove", "probar", "to show that something is definitely true"],
    ],
    transfer: [
      "A friend reads a report about one class that tried a new reading app and says it will work for every class. What would you ask about the evidence?",
      "Un amigo lee un informe sobre una clase que probó una nueva aplicación de lectura y dice que funcionará en todas las clases. ¿Qué preguntarías sobre la evidencia?",
    ],
  },
  {
    id: "h68-nutrition",
    subject: "health",
    flaw: "overgeneral",
    concept: "the body needs some fat",
    title: ["Is all fat bad?", "¿Toda la grasa es mala?"],
    speaker: "Wen",
    lines: [
      [
        "The body gets energy from carbohydrates, proteins and fats.",
        "El cuerpo obtiene energía de los carbohidratos, las proteínas y las grasas.",
        "All three nutrients provide energy. This line is correct.",
        "Los tres nutrientes dan energía. Esta línea es correcta.",
      ],
      [
        "Fats help the body absorb vitamins A, D, E and K.",
        "Las grasas ayudan al cuerpo a absorber las vitaminas A, D, E y K.",
        "Those four are the fat-soluble vitamins. This line is correct.",
        "Esas cuatro son las vitaminas liposolubles. Esta línea es correcta.",
      ],
      [
        "So the healthiest diet has no fat at all.",
        "Entonces la dieta más saludable no tiene nada de grasa.",
      ],
      [
        "Foods such as fish, nuts and olive oil contain unsaturated fats.",
        "Alimentos como el pescado, las nueces y el aceite de oliva contienen grasas insaturadas.",
        "These foods do contain unsaturated fats. This line is correct.",
        "Estos alimentos sí contienen grasas insaturadas. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "Vitamins A, D, E and K need fat to be absorbed by the body.",
        "Las vitaminas A, D, E y K necesitan grasa para que el cuerpo las absorba.",
        "We can check this in a nutrition reference.",
        "Podemos comprobarlo en una referencia de nutrición.",
      ],
      [
        "e",
        "Nutrition guidelines recommend including some fat in the daily diet.",
        "Las guías de nutrición recomiendan incluir algo de grasa en la dieta diaria.",
        "We can check this in health guidelines.",
        "Podemos comprobarlo en las guías de salud.",
      ],
      [
        "a",
        "Wen feels that fat is what makes people gain weight, so none is best.",
        "Wen siente que la grasa es lo que hace subir de peso, así que ninguna es lo mejor.",
        "This is an assumption. It is not supported by nutrition guidelines.",
        "Es una suposición. No está respaldada por las guías de nutrición.",
      ],
      [
        "o",
        "Wen's lunch box is orange.",
        "La lonchera de Wen es naranja.",
        "The color of the lunch box does not tell us what the body needs.",
        "El color de la lonchera no nos dice qué necesita el cuerpo.",
      ],
    ],
    fix: [
      [
        "The body needs some fat, so a healthy diet includes small amounts of healthy fats, like unsaturated fats, instead of none.",
        "El cuerpo necesita algo de grasa, así que una dieta saludable incluye pequeñas cantidades de grasas saludables, como las insaturadas, en vez de ninguna.",
      ],
      [
        "Fat should be most of what you eat, because it gives energy.",
        "La grasa debería ser la mayor parte de lo que comes, porque da energía.",
      ],
      ["Only fat from animals is healthy.", "Solo la grasa de origen animal es saludable."],
    ],
    right: 0,
    why: [
      "The body needs some fat. It gives energy, helps absorb vitamins A, D, E and K, and is part of every cell membrane. The healthy approach is to choose healthier fats, such as unsaturated fats from fish, nuts and olive oil, in moderate amounts, not to cut all fat. Wen's own lines 2 and 4 already show why none is not best.",
      "El cuerpo necesita algo de grasa. Da energía, ayuda a absorber las vitaminas A, D, E y K y forma parte de la membrana de cada célula. Lo saludable es elegir grasas más saludables, como las insaturadas del pescado, las nueces y el aceite de oliva, en cantidades moderadas, no eliminar toda la grasa. Las líneas 2 y 4 de Wen ya muestran por qué ninguna no es lo mejor.",
    ],
    accept: "fat fats body need needs vitamins absorb unsaturated healthy none all some energy",
    focus: ["what Wen concludes about eating fat", "lo que Wen concluye sobre comer grasa"],
    terms: [
      ["nutrient", "nutriente", "something in food that the body needs"],
      ["unsaturated fat", "grasa insaturada", "a kind of fat found in fish, nuts and olive oil"],
      ["absorb", "absorber", "to take in"],
    ],
    transfer: [
      "A friend says sugar is always bad and the body should get none. What facts about how the body uses energy could you look up to test that?",
      "Un amigo dice que el azúcar siempre es mala y que el cuerpo no debería tener nada. ¿Qué datos sobre cómo usa el cuerpo la energía podrías buscar para probarlo?",
    ],
  },
];

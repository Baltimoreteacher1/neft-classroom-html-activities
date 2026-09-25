/** Lesson-specific family examples. A unit/standard is too broad to choose a
 * sibling lesson's operation, statistic, or shape. IDs also cover later sessions. */
const pair = (en, es) => ({ en, es });
const profile = (titleEn, titleEs, steps, equation, graphic, capEn, capEs) => ({
  titleEn,
  titleEs,
  steps,
  equation,
  graphic,
  capEn,
  capEs,
});

const SUPPORT = {
  "1-2": profile(
    "Scale a snack",
    "Escala una merienda",
    [
      pair(
        "Imagine 20 crackers. Draw 5 equal groups; each group has 4 crackers.",
        "Imagina 20 galletas. Dibuja 5 grupos iguales de 4 galletas.",
      ),
      pair(
        "Find 3/5 of 20 by taking 3 groups. Now find 6/5 of 20 by taking 6 groups.",
        "Halla 3/5 de 20 tomando 3 grupos. Luego halla 6/5 de 20 tomando 6 grupos.",
      ),
      pair(
        "Compare 12 and 24 with the original 20. Explain why the second result is larger.",
        "Compara 12 y 24 con los 20 originales. Explica por qué el segundo resultado es mayor.",
      ),
    ],
    "3/5 × 20 = 12; 6/5 × 20 = 24",
    "fraction-scale",
    "Multiply by the fraction: a factor below 1 shrinks a positive quantity; a factor above 1 enlarges it.",
    "Multiplica por la fracción: un factor menor que 1 reduce una cantidad positiva; uno mayor que 1 la aumenta.",
  ),
  "2-1": profile(
    "Ask a question with many answers",
    "Haz una pregunta con respuestas variadas",
    [
      pair(
        "Choose: “How many books are on my shelf?” or “How many books are on each shelf in this room?”",
        "Elige: «¿Cuántos libros hay en mi estante?» o «¿Cuántos libros hay en cada estante de este cuarto?»",
      ),
      pair(
        "Explain which question expects a set of answers that may vary. Count three shelves or use 4, 7, 10.",
        "Explica qué pregunta espera varias respuestas que pueden variar. Cuenta tres estantes o usa 4, 7, 10.",
      ),
      pair(
        "Name what is measured and the group being studied.",
        "Nombra qué se mide y el grupo que se estudia.",
      ),
    ],
    "4, 7, 10",
    "data",
    "A statistical question anticipates variation across a group.",
    "Una pregunta estadística anticipa variación en un grupo.",
  ),
  "2-2": profile(
    "Make a small histogram",
    "Haz un histograma pequeño",
    [
      pair(
        "Use these page counts: 1, 2, 2, 4, 5, 7. Draw intervals 0–2, 3–5, and 6–8.",
        "Usa estas cantidades de páginas: 1, 2, 2, 4, 5, 7. Dibuja intervalos 0–2, 3–5 y 6–8.",
      ),
      pair(
        "Tally each count once. Draw touching bars with heights 3, 2, and 1.",
        "Cuenta cada dato una vez. Dibuja barras juntas de alturas 3, 2 y 1.",
      ),
      pair(
        "Explain which interval has the most observations. The bar height is frequency, not the page count.",
        "Explica qué intervalo tiene más observaciones. La altura es la frecuencia, no la cantidad de páginas.",
      ),
    ],
    "0–2: 3; 3–5: 2; 6–8: 1",
    "histogram",
    "Use equal-width, nonoverlapping intervals. Count every observation once.",
    "Usa intervalos del mismo ancho que no se superpongan. Cuenta cada dato una vez.",
  ),
  "2-3": profile(
    "Find the middle",
    "Encuentra el centro",
    [
      pair(
        "Write the reading times 8, 2, 5, 4, 11 on scraps of paper.",
        "Escribe los tiempos de lectura 8, 2, 5, 4, 11 en papelitos.",
      ),
      pair(
        "Order them: 2, 4, 5, 8, 11. Point to the middle value, 5.",
        "Ordénalos: 2, 4, 5, 8, 11. Señala el valor central, 5.",
      ),
      pair(
        "Add 12. The two middle values are 5 and 8; their mean, 6.5, is the new median.",
        "Agrega 12. Los valores centrales son 5 y 8; su media, 6.5, es la nueva mediana.",
      ),
    ],
    "2, 4, [5], 8, 11 → median / mediana = 5",
    "median",
    "Order first. With an even number of values, average the two in the middle.",
    "Ordena primero. Con un número par de datos, calcula la media de los dos centrales.",
  ),
  "2-4": profile(
    "Build a box plot",
    "Construye un diagrama de caja",
    [
      pair(
        "Order these six book lengths: 2, 4, 6, 8, 10, 12.",
        "Ordena estas seis longitudes de libros: 2, 4, 6, 8, 10, 12.",
      ),
      pair(
        "Find minimum 2, Q1 4, median 7, Q3 10, and maximum 12.",
        "Halla mínimo 2, Q1 4, mediana 7, Q3 10 y máximo 12.",
      ),
      pair(
        "Draw a number line, a box from 4 to 10, a median line at 7, and whiskers to 2 and 12.",
        "Dibuja una recta, una caja de 4 a 10, la mediana en 7 y bigotes hasta 2 y 12.",
      ),
    ],
    "min 2 | Q1 4 | median 7 | Q3 10 | max 12",
    "box",
    "A box plot locates the five-number summary on one consistent scale.",
    "Un diagrama de caja coloca el resumen de cinco números en una escala uniforme.",
  ),
  "2-5": profile(
    "Compare two kinds of spread",
    "Compara dos medidas de dispersión",
    [
      pair(
        "Use the ordered data 2, 4, 6, 8, 10, 12. Its quartiles are 4 and 10.",
        "Usa los datos ordenados 2, 4, 6, 8, 10, 12. Sus cuartiles son 4 y 10.",
      ),
      pair(
        "Find range: 12 − 2 = 10. Find IQR: 10 − 4 = 6.",
        "Halla el rango: 12 − 2 = 10. Halla el RIC: 10 − 4 = 6.",
      ),
      pair(
        "Point to the entire span and then the middle-half span on a box plot.",
        "Señala toda la extensión y luego la de la mitad central en un diagrama de caja.",
      ),
    ],
    "10 − 0 = 10; 8 − 2 = 6",
    "box",
    "Range uses the extremes; IQR uses Q3 − Q1 and describes the middle half.",
    "El rango usa los extremos; el RIC usa Q3 − Q1 y describe la mitad central.",
  ),
  "2-7": profile(
    "Divide a decimal cost",
    "Divide un costo decimal",
    [
      pair(
        "Imagine 2.4 kg of rice packed into bags of 0.6 kg each. Estimate how many bags fit.",
        "Imagina 2.4 kg de arroz en bolsas de 0.6 kg. Estima cuántas bolsas se llenan.",
      ),
      pair(
        "Multiply both amounts by 10: 2.4 ÷ 0.6 = 24 ÷ 6 = 4.",
        "Multiplica ambas cantidades por 10: 2.4 ÷ 0.6 = 24 ÷ 6 = 4.",
      ),
      pair(
        "Check with multiplication: 4 × 0.6 = 2.4 kg.",
        "Comprueba multiplicando: 4 × 0.6 = 2.4 kg.",
      ),
    ],
    "2.4 ÷ 0.6 = 24 ÷ 6 = 4",
    "rows",
    "Scale dividend and divisor equally to make the divisor a whole number.",
    "Escala el dividendo y el divisor por igual para que el divisor sea entero.",
  ),
  "2-8": profile(
    "Make a fair share",
    "Haz un reparto justo",
    [
      pair(
        "Draw piles of 2, 4, 6, and 8 counters or use beans.",
        "Dibuja grupos de 2, 4, 6 y 8 fichas, o usa frijoles.",
      ),
      pair(
        "Move counters until all four groups are equal. Each has 5.",
        "Mueve las fichas hasta que los cuatro grupos sean iguales. Cada uno tiene 5.",
      ),
      pair(
        "Check: the total is 20, and 20 ÷ 4 = 5. Explain how the mean represents a fair share.",
        "Comprueba: el total es 20, y 20 ÷ 4 = 5. Explica cómo la media representa un reparto justo.",
      ),
    ],
    "(2 + 4 + 6 + 8) ÷ 4 = 5",
    "mean",
    "Add all values and divide by the number of observations.",
    "Suma todos los valores y divide entre el número de datos.",
  ),
  "2-9": profile(
    "Measure distance from the mean",
    "Mide la distancia a la media",
    [
      pair(
        "Use the values 2, 4, 6, 8. Their mean is 5.",
        "Usa los valores 2, 4, 6, 8. Su media es 5.",
      ),
      pair(
        "Mark their distances from 5: 3, 1, 1, 3. Distances are nonnegative.",
        "Marca sus distancias desde 5: 3, 1, 1, 3. Las distancias no son negativas.",
      ),
      pair(
        "Average the distances: 8 ÷ 4 = 2. Explain this as an average distance, not a guarantee for each value.",
        "Calcula la media de las distancias: 8 ÷ 4 = 2. Es una distancia promedio, no una garantía para cada valor.",
      ),
    ],
    "(3 + 1 + 1 + 3) ÷ 4 = 2",
    "mad",
    "MAD is the mean of the absolute distances from the mean.",
    "La DMA es la media de las distancias absolutas a la media.",
  ),
  "2-10": profile(
    "Choose a useful center",
    "Elige un centro útil",
    [
      pair(
        "Compare weekly reading times 2, 3, 3, 4, 8. The mean is 4 and the median is 3.",
        "Compara los tiempos de lectura 2, 3, 3, 4, 8. La media es 4 y la mediana es 3.",
      ),
      pair(
        "Change 8 to 28. The mean becomes 8; the median stays 3.",
        "Cambia 8 por 28. La media pasa a 8; la mediana sigue siendo 3.",
      ),
      pair(
        "Choose mean or median to describe a typical time and explain the effect of the high value.",
        "Elige media o mediana para describir un tiempo típico y explica el efecto del valor alto.",
      ),
    ],
    "2, 3, 3, 4, 28 → mean 8; median 3",
    "data",
    "An extreme value affects the mean more than the median. Explain your choice in context.",
    "Un valor extremo afecta más a la media que a la mediana. Explica tu elección en contexto.",
  ),
  "2-11": profile(
    "Check a receipt",
    "Revisa un recibo",
    [
      pair(
        "Imagine buying items for $2.35 and $1.80. Estimate the total first.",
        "Imagina comprar artículos de $2.35 y $1.80. Estima el total primero.",
      ),
      pair(
        "Align equal place values to add: 2.35 + 1.80 = 4.15.",
        "Alinea los valores posicionales para sumar: 2.35 + 1.80 = 4.15.",
      ),
      pair(
        "Find the change from $5: 5.00 − 4.15 = 0.85. Check by adding back.",
        "Halla el cambio de $5: 5.00 − 4.15 = 0.85. Comprueba sumando.",
      ),
    ],
    "2.35 + 1.80 = 4.15; 5.00 − 4.15 = 0.85",
    "rows",
    "For addition and subtraction, align equal place values and use zeros when helpful.",
    "Para sumar y restar, alinea valores posicionales iguales y usa ceros cuando ayuden.",
  ),
  "2-12": profile(
    "Multiply a decimal price",
    "Multiplica un precio decimal",
    [
      pair(
        "Imagine 1.5 kg of fruit at $2.40 per kg. Estimate: the cost should be between $2.40 and $4.80.",
        "Imagina 1.5 kg de fruta a $2.40 por kg. Estima: el costo estará entre $2.40 y $4.80.",
      ),
      pair(
        "Multiply 24 × 15 = 360. In 2.4 and 1.5 there are two decimal places in total, so 2.4 × 1.5 = 3.60.",
        "Multiplica 24 × 15 = 360. Usando 2.4 y 1.5 hay dos cifras decimales en total: 2.4 × 1.5 = 3.60.",
      ),
      pair(
        "Check with parts: $2.40 for 1 kg plus $1.20 for half a kg is $3.60.",
        "Comprueba por partes: $2.40 por 1 kg más $1.20 por medio kg son $3.60.",
      ),
    ],
    "2.4 × 1.5 = 3.60",
    "rows",
    "For multiplication, use the place value of both factors; do not align decimal points as an addition rule.",
    "Para multiplicar, usa el valor posicional de ambos factores; no apliques la regla de alineación de la suma.",
  ),
  "3-2": profile(
    "Find the price of one",
    "Encuentra el precio de uno",
    [
      pair(
        "Choose a snack or imagine 3 identical snacks for $6.",
        "Elige una merienda o imagina 3 meriendas iguales por $6.",
      ),
      pair(
        "Find dollars per snack: $6 ÷ 3 = $2. Reverse the units: 3 ÷ 6 = 0.5 snack per dollar.",
        "Halla dólares por merienda: $6 ÷ 3 = $2. Invierte las unidades: 3 ÷ 6 = 0.5 merienda por dólar.",
      ),
      pair(
        "Predict the cost of 5 snacks at the same rate and explain which unit rate you used.",
        "Predice el costo de 5 meriendas a la misma tasa y explica cuál tasa unitaria usaste.",
      ),
    ],
    "$6 ÷ 3 = $2 per snack / por merienda",
    "rate",
    "A unit rate compares an amount with one unit of another quantity. Keep units visible.",
    "Una tasa unitaria compara una cantidad con una unidad de otra. Mantén visibles las unidades.",
  ),
  "4-1": profile(
    "Show percent out of 100",
    "Muestra el porcentaje de 100",
    [
      pair(
        "Draw a 10 by 10 grid. Shade 25 squares.",
        "Dibuja una cuadrícula de 10 por 10. Sombrea 25 cuadros.",
      ),
      pair(
        "Describe the shaded part as 25 out of 100, or 25%. Describe the unshaded 75%.",
        "Describe la parte sombreada como 25 de 100, o 25%. Describe el 75% sin sombrear.",
      ),
      pair(
        "Show 150% using one full grid plus half of another grid. Explain why it exceeds one whole.",
        "Muestra 150% con una cuadrícula completa y la mitad de otra. Explica por qué supera un entero.",
      ),
    ],
    "25/100 = 25%; 150/100 = 150%",
    "percent",
    "Percent means per hundred; percentages can be below or above 100%.",
    "Porcentaje significa por cada cien; puede ser menor o mayor que 100%.",
  ),
  "4-2": profile(
    "Three names for one amount",
    "Tres nombres para una cantidad",
    [
      pair(
        "Shade one quarter of a 100-square grid.",
        "Sombrea un cuarto de una cuadrícula de 100 cuadros.",
      ),
      pair(
        "Count 25 squares and write 1/4 = 25/100 = 0.25 = 25%.",
        "Cuenta 25 cuadros y escribe 1/4 = 25/100 = 0.25 = 25%.",
      ),
      pair(
        "Try a new amount: one half. Show its fraction, decimal, and percent.",
        "Prueba otra cantidad: un medio. Muestra su fracción, decimal y porcentaje.",
      ),
    ],
    "1/4 = 0.25 = 25%",
    "percent",
    "Fraction, decimal, and percent can name the same part of one whole.",
    "La fracción, el decimal y el porcentaje pueden nombrar la misma parte de un entero.",
  ),
  "4-3": profile(
    "Choose nearby benchmarks",
    "Elige referentes cercanos",
    [
      pair(
        "Estimate 48% of 60 using the nearby benchmark 50%: about 30.",
        "Estima 48% de 60 usando el referente cercano 50%: aproximadamente 30.",
      ),
      pair(
        "Bracket 48% between 40% and 50%: the answer is between 24 and 30.",
        "Sitúa 48% entre 40% y 50%: la respuesta está entre 24 y 30.",
      ),
      pair(
        "Try 5%, 75%, or 150%. Choose benchmarks around that percent; 10% and 50% do not bound every percent.",
        "Prueba 5%, 75% o 150%. Elige referentes que rodeen ese porcentaje; 10% y 50% no rodean todos los porcentajes.",
      ),
    ],
    "40% < 48% < 50% → 24 < 28.8 < 30",
    "percent",
    "Choose bounds that actually surround the chosen percentage, then apply them to the same whole.",
    "Elige límites que rodeen el porcentaje elegido y aplícalos al mismo entero.",
  ),
  "4-4": profile(
    "Compare two discounts",
    "Compara dos descuentos",
    [
      pair(
        "Imagine a $40 backpack. Compare 25% off with $8 off.",
        "Imagina una mochila de $40. Compara un descuento de 25% con uno de $8.",
      ),
      pair(
        "Find 25% of $40: $10. Compare final prices $30 and $32.",
        "Halla 25% de $40: $10. Compara los precios finales de $30 y $32.",
      ),
      pair(
        "Choose a discount and support your choice using the same original price.",
        "Elige un descuento y justifica tu elección usando el mismo precio original.",
      ),
    ],
    "25% × $40 = $10; $40 − $10 = $30",
    "percent",
    "Find the percent of the stated whole before comparing amounts.",
    "Halla el porcentaje del entero indicado antes de comparar cantidades.",
  ),
  "4-5": profile(
    "Find the missing whole",
    "Encuentra el entero que falta",
    [
      pair(
        "Imagine 6 red beads are 25% of a bag. Draw 4 equal groups for the whole bag.",
        "Imagina que 6 cuentas rojas son 25% de una bolsa. Dibuja 4 grupos iguales para la bolsa entera.",
      ),
      pair(
        "Put 6 in each group: the whole is 24. Or divide 6 by 0.25.",
        "Coloca 6 en cada grupo: el entero es 24. O divide 6 entre 0.25.",
      ),
      pair(
        "Check: 25% of 24 is 6. Explain why multiplying 6 by 0.25 would answer a different question.",
        "Comprueba: 25% de 24 es 6. Explica por qué multiplicar 6 por 0.25 respondería otra pregunta.",
      ),
    ],
    "whole / entero = 6 ÷ 0.25 = 24",
    "percent",
    "When the part and percent are known, divide the part by the percent written as a decimal.",
    "Cuando conoces la parte y el porcentaje, divide la parte entre el porcentaje escrito como decimal.",
  ),
  "5-2": profile(
    "Fold a rectangle into triangles",
    "Dobla un rectángulo en triángulos",
    [
      pair(
        "Draw a rectangle 6 units wide and 4 units high. Draw a diagonal.",
        "Dibuja un rectángulo de 6 unidades de ancho y 4 de alto. Traza una diagonal.",
      ),
      pair(
        "The two triangles cover the rectangle equally. Each area is half of 24: 12 square units.",
        "Los dos triángulos cubren el rectángulo por igual. Cada área es la mitad de 24: 12 unidades cuadradas.",
      ),
      pair(
        "Point to a base and its perpendicular height; the slanted side is not the height.",
        "Señala una base y su altura perpendicular; el lado inclinado no es la altura.",
      ),
    ],
    "A = ½bh = ½ × 6 × 4 = 12",
    "triangle",
    "A triangle has half the area of a parallelogram with the same base and perpendicular height.",
    "Un triángulo tiene la mitad del área de un paralelogramo con igual base y altura perpendicular.",
  ),
  "5-3": profile(
    "Double a trapezoid",
    "Duplica un trapecio",
    [
      pair(
        "Draw a trapezoid with parallel bases 4 and 8 and perpendicular height 3.",
        "Dibuja un trapecio con bases paralelas de 4 y 8 y altura perpendicular de 3.",
      ),
      pair(
        "Imagine a matching copy rotated beside it: the pair makes a parallelogram with base 12 and height 3.",
        "Imagina una copia girada a su lado: juntas forman un paralelogramo de base 12 y altura 3.",
      ),
      pair(
        "The pair has area 36, so one trapezoid has area 18. Check by decomposing it.",
        "El par tiene área 36, así que un trapecio tiene área 18. Comprueba descomponiéndolo.",
      ),
    ],
    "A = ½(b₁ + b₂)h = ½(4 + 8)3 = 18",
    "trapezoid",
    "Add the parallel bases, multiply by the perpendicular height, and take half.",
    "Suma las bases paralelas, multiplica por la altura perpendicular y toma la mitad.",
  ),
  "5-8": profile(
    "Unfold a pyramid",
    "Despliega una pirámide",
    [
      pair(
        "Draw a square of side 4, with one triangle attached to each side. This is a square-pyramid net.",
        "Dibuja un cuadrado de lado 4 con un triángulo unido a cada lado. Es una red de pirámide cuadrada.",
      ),
      pair(
        "Give each triangle a face height (slant height) of 3. Its area is ½ × 4 × 3 = 6.",
        "Da a cada triángulo una altura de cara (apotema lateral) de 3. Su área es ½ × 4 × 3 = 6.",
      ),
      pair(
        "Add the square area 16 and four triangle areas: 16 + 24 = 40 square units.",
        "Suma el área del cuadrado, 16, y las de cuatro triángulos: 16 + 24 = 40 unidades cuadradas.",
      ),
    ],
    "SA / área total = 4² + 4(½ × 4 × 3) = 40",
    "pyramid",
    "Use slant height for each triangular face, not the vertical height inside the pyramid.",
    "Usa la altura inclinada de cada cara triangular, no la altura vertical interior de la pirámide.",
  ),
  "5-9": profile(
    "Split a regular polygon from its center",
    "Divide un polígono regular desde el centro",
    [
      pair(
        "Draw a square of side 6. Connect its center to all four vertices.",
        "Dibuja un cuadrado de lado 6. Une su centro con los cuatro vértices.",
      ),
      pair(
        "Each central triangle has base 6 and perpendicular height 3 (the apothem). Find one area: 9.",
        "Cada triángulo central tiene base 6 y altura perpendicular 3 (apotema). Halla un área: 9.",
      ),
      pair(
        "Add the four triangles: 36. Check with ½ × perimeter × apothem = ½ × 24 × 3.",
        "Suma los cuatro triángulos: 36. Comprueba con ½ × perímetro × apotema = ½ × 24 × 3.",
      ),
    ],
    "A = ½Pa = ½ × 24 × 3 = 36",
    "polygon",
    "The apothem is perpendicular from the center to a side; consistent dimensions matter.",
    "La apotema va del centro a un lado de forma perpendicular; las medidas deben ser coherentes.",
  ),
};

const fractionDivision = profile(
  "Count equal portions",
  "Cuenta porciones iguales",
  [
    pair(
      "Draw 1½ cups as six quarter-cup sections. Each serving needs ¼ cup.",
      "Dibuja 1½ tazas como seis secciones de un cuarto. Cada porción necesita ¼ de taza.",
    ),
    pair(
      "Count how many ¼-cup portions fit: six. Write 3/2 ÷ 1/4 = 3/2 × 4 = 6.",
      "Cuenta cuántas porciones de ¼ de taza caben: seis. Escribe 3/2 ÷ 1/4 = 3/2 × 4 = 6.",
    ),
    pair(
      "Check: 6 × ¼ = 1½ cups. Keep the original order when converting mixed numbers.",
      "Comprueba: 6 × ¼ = 1½ tazas. Mantén el orden original al convertir números mixtos.",
    ),
  ],
  "1½ ÷ ¼ = 6",
  "fraction-division",
  "Division asks how many equal portions fit. Convert mixed numbers first without changing operand order.",
  "La división pregunta cuántas porciones iguales caben. Convierte números mixtos sin cambiar el orden.",
);
for (const id of ["6-1", "6-2", "6-9", "6-10", "6-11"]) SUPPORT[id] = fractionDivision;
SUPPORT["6-9"] = {
  ...fractionDivision,
  equation: "2 ÷ ¼ = 8",
  steps: [
    pair(
      "Draw 2 whole cups, each split into four quarters.",
      "Dibuja 2 tazas enteras, cada una dividida en cuatro cuartos.",
    ),
    pair(
      "Count how many ¼-cup portions fit: eight. Write 2 ÷ ¼ = 2 × 4 = 8.",
      "Cuenta cuántas porciones de ¼ caben: ocho. Escribe 2 ÷ ¼ = 2 × 4 = 8.",
    ),
    pair("Check by multiplying: 8 × ¼ = 2.", "Comprueba multiplicando: 8 × ¼ = 2."),
  ],
};
SUPPORT["3-8"] = SUPPORT["3-2"];
for (const [id, titleEn, titleEs, steps, equation, caption, captionEs] of [
  [
    "6-7",
    "Arrange and count",
    "Organiza y cuenta",
    [
      pair(
        "Draw all rectangular arrays for 12 counters: 1×12, 2×6, 3×4.",
        "Dibuja todos los arreglos rectangulares de 12 fichas: 1×12, 2×6, 3×4.",
      ),
      pair(
        "List the factors 1, 2, 3, 4, 6, 12. Then count multiples 12, 24, 36.",
        "Enumera los factores 1, 2, 3, 4, 6, 12. Luego cuenta múltiplos: 12, 24, 36.",
      ),
      pair(
        "Explain why 12 is both a factor and a multiple of 12.",
        "Explica por qué 12 es factor y múltiplo de 12.",
      ),
    ],
    "12 = 1×12 = 2×6 = 3×4",
    "Factors divide evenly; multiples are products of the number and an integer.",
    "Los factores dividen exactamente; los múltiplos son productos del número por un entero.",
  ],
  [
    "6-12",
    "Meet on the same beat",
    "Coincide en el mismo ritmo",
    [
      pair(
        "List a clap every 4 counts: 4, 8, 12, 16. List a tap every 6: 6, 12, 18.",
        "Anota una palmada cada 4 tiempos: 4, 8, 12, 16. Anota un toque cada 6: 6, 12, 18.",
      ),
      pair(
        "Find the first positive count on both lists: 12. It is the LCM.",
        "Encuentra el primer número positivo en ambas listas: 12. Es el MCM.",
      ),
      pair(
        "Try the rhythms or draw them. Explain why 24 is common but not least.",
        "Prueba los ritmos o dibújalos. Explica por qué 24 es común pero no el menor.",
      ),
    ],
    "4 × 3 = 6 × 2 = 12",
    "Choose the smallest positive common multiple.",
    "Elige el menor múltiplo común positivo.",
  ],
  [
    "6-13",
    "Two factor-tree starts",
    "Dos inicios de árbol de factores",
    [
      pair(
        "Choose 24, 36, or 60. For 24, start one tree with 4×6 and another with 3×8.",
        "Elige 24, 36 o 60. Para 24, inicia un árbol con 4×6 y otro con 3×8.",
      ),
      pair(
        "Break every composite factor into smaller factors until only primes remain.",
        "Descompón cada factor compuesto hasta que solo queden primos.",
      ),
      pair(
        "Both trees give 2×2×2×3 = 2³×3. Compare; the order may differ.",
        "Ambos árboles dan 2×2×2×3 = 2³×3. Compara; el orden puede variar.",
      ),
    ],
    "24 = 4×6 = 2³×3",
    "Different valid factor trees end with the same prime factors.",
    "Distintos árboles válidos terminan con los mismos factores primos.",
  ],
  [
    "6-14",
    "Split a rectangular array",
    "Divide un arreglo rectangular",
    [
      pair(
        "Draw 3 rows with 7 dots in each row. Split each row into 5 dots and 2 dots.",
        "Dibuja 3 filas de 7 puntos. Divide cada fila en 5 puntos y 2 puntos.",
      ),
      pair("Write 3(5+2) = 3×5 + 3×2 = 21.", "Escribe 3(5+2) = 3×5 + 3×2 = 21."),
      pair(
        "Explain why the factor 3 multiplies both parts; try another split of 7.",
        "Explica por qué el factor 3 multiplica ambas partes; prueba otra división de 7.",
      ),
    ],
    "3(5+2) = 15+6 = 21",
    "The distributive property multiplies every term inside the parentheses.",
    "La propiedad distributiva multiplica cada término dentro del paréntesis.",
  ],
  [
    "6-15",
    "Sort like terms",
    "Agrupa términos semejantes",
    [
      pair(
        "Write cards: 2x, 3x, 4x², 5, and 2. Group matching variable parts, including exponents.",
        "Escribe tarjetas: 2x, 3x, 4x², 5 y 2. Agrupa las partes variables iguales, incluidos exponentes.",
      ),
      pair(
        "Combine 2x+3x into 5x and 5+2 into 7. Keep 4x² separate.",
        "Combina 2x+3x en 5x y 5+2 en 7. Mantén 4x² separado.",
      ),
      pair(
        "Check at x=2: the original and simplified expressions both equal 33.",
        "Comprueba con x=2: las expresiones original y simplificada valen 33.",
      ),
    ],
    "2x + 3x + 4x² + 5 + 2 = 4x² + 5x + 7",
    "Like terms have the same variables and exponents. Combine their coefficients.",
    "Los términos semejantes tienen las mismas variables y exponentes. Combina sus coeficientes.",
  ],
])
  SUPPORT[id] = profile(titleEn, titleEs, steps, equation, "rows", caption, captionEs);

const variables = profile(
  "Track two changing quantities",
  "Relaciona dos cantidades variables",
  [
    pair(
      "Imagine each notebook costs $3. Let x be notebooks and y be total dollars.",
      "Imagina que cada cuaderno cuesta $3. Sea x el número de cuadernos e y el total de dólares.",
    ),
    pair(
      "Make a table: x = 0, 1, 2, 3 and y = 0, 3, 6, 9. Write y = 3x.",
      "Haz una tabla: x = 0, 1, 2, 3 e y = 0, 3, 6, 9. Escribe y = 3x.",
    ),
    pair(
      "Plot (x, y). Explain how each new notebook changes the total, and which quantity depends on the other.",
      "Grafica (x, y). Explica cómo cada cuaderno cambia el total y qué cantidad depende de la otra.",
    ),
  ],
  "y = 3x; (0,0), (1,3), (2,6), (3,9)",
  "variables",
  "x is the chosen input; y is the resulting output. A table, graph, and equation describe the same relationship.",
  "x es la entrada elegida; y es la salida resultante. La tabla, gráfica y ecuación describen la misma relación.",
);
for (const id of ["9-1", "9-2", "9-3", "9-4"]) SUPPORT[id] = variables;
SUPPORT["9-2"] = {
  ...variables,
  titleEn: "Read a price graph",
  titleEs: "Lee una gráfica de precios",
  steps: [
    variables.steps[0],
    variables.steps[2],
    pair(
      "Read the point (2,6): two notebooks cost $6. Use the pattern to predict the point for five notebooks.",
      "Lee el punto (2,6): dos cuadernos cuestan $6. Usa el patrón para predecir el punto de cinco cuadernos.",
    ),
  ],
};
SUPPORT["9-3"] = {
  ...variables,
  titleEn: "Write the rule",
  titleEs: "Escribe la regla",
  steps: [
    variables.steps[0],
    variables.steps[1],
    pair(
      "Explain why y=3x matches every row; use it to find the price of five notebooks.",
      "Explica por qué y=3x coincide con cada fila; úsala para hallar el precio de cinco cuadernos.",
    ),
  ],
};
SUPPORT["9-4"] = {
  ...variables,
  titleEn: "Use a relationship to decide",
  titleEs: "Usa una relación para decidir",
  steps: [
    variables.steps[0],
    variables.steps[1],
    pair(
      "With a $15 budget, what is the greatest whole number of notebooks you can buy? Use both the table and y=3x to justify five.",
      "Con un presupuesto de $15, ¿cuál es el mayor número entero de cuadernos que puedes comprar? Usa la tabla e y=3x para justificar cinco.",
    ),
  ],
};

export function exactFamilySupport(config = {}) {
  const rawId = String(config.lessonId || config.id || "").replace(/^lesson-/, "");
  // Later sessions have their own authored skill; do not replace those sidecars.
  if (/-part\d+$/.test(rawId)) return null;
  const id = rawId.replace(/-(?:group\d+|catchup|flagship)$/, "");
  return SUPPORT[id] || null;
}

export function exactFamilyMission(config) {
  const content = exactFamilySupport(config);
  if (!content) return null;
  return {
    ...content,
    icon: "🏡",
    minutes: 5,
    materialsEn: "Paper and pencil; objects are optional",
    materialsEs: "Papel y lápiz; los objetos son opcionales",
    talkEn: content.capEn,
    talkEs: content.capEs,
  };
}

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );
function graphic(kind, equation) {
  const text = (x, y, value) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="#12355b" font-size="20">${escape(value)}</text>`;
  const line = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#12355b" stroke-width="3"/>`;
  if (kind === "triangle")
    return `<rect x="180" y="25" width="240" height="160" fill="#eff6ff" stroke="#94a3b8"/><polygon points="180,185 420,185 180,25" fill="#bfe4de" stroke="#0f766e" stroke-width="3"/>${text(300, 218, "b = 6")}${text(148, 105, "h = 4")}`;
  if (kind === "trapezoid")
    return `<polygon points="220,35 380,35 460,185 140,185" fill="#bfe4de" stroke="#0f766e" stroke-width="3"/>${line(220, 35, 220, 185)}${text(300, 25, "b₁ = 4")}${text(300, 218, "b₂ = 8")}${text(260, 115, "h = 3")}`;
  if (kind === "pyramid")
    return `<g fill="#bfe4de" stroke="#0f766e" stroke-width="2"><rect x="270" y="75" width="80" height="80"/><path d="M270 75 L310 15 L350 75 Z M350 75 L410 115 L350 155 Z M270 155 L310 215 L350 155 Z M270 75 L210 115 L270 155 Z"/></g>${line(310, 15, 310, 75)}${text(345, 48, "3")}${text(310, 122, "4 × 4")}`;
  if (kind === "polygon")
    return `<rect x="220" y="25" width="180" height="180" fill="#bfe4de" stroke="#0f766e" stroke-width="3"/>${line(220, 25, 400, 205)}${line(400, 25, 220, 205)}${line(310, 115, 310, 205)}${text(350, 166, "a = 3")}${text(310, 232, "s = 6; P = 24")}`;
  if (kind === "percent") {
    const percent = equation.startsWith("40%") ? 48 : 25;
    return (
      Array.from(
        { length: 100 },
        (_, i) =>
          `<rect x="${210 + (i % 10) * 18}" y="${20 + Math.floor(i / 10) * 18}" width="18" height="18" fill="${i < percent ? "#0f766e" : "#fff"}" stroke="#64748b"/>`,
      ).join("") + text(300, 232, percent + " / 100")
    );
  }
  if (kind === "box")
    return `${line(100, 150, 500, 150)}${line(100, 130, 100, 170)}${line(500, 130, 500, 170)}<rect x="180" y="110" width="240" height="80" fill="#bfe4de" stroke="#0f766e" stroke-width="3"/>${line(300, 110, 300, 190)}${[2, 4, 7, 10, 12].map((n, i) => text([100, 180, 300, 420, 500][i], 220, n)).join("")}`;
  if (kind === "histogram")
    return [3, 2, 1]
      .map(
        (n, i) =>
          `<rect x="${180 + i * 80}" y="${195 - n * 48}" width="80" height="${n * 48}" fill="#bfe4de" stroke="#0f766e" stroke-width="2"/>${text(220 + i * 80, 180 - n * 48, n)}${text(220 + i * 80, 225, ["0–2", "3–5", "6–8"][i])}`,
      )
      .join("");
  if (kind === "rate")
    return (
      [1, 2, 3]
        .map((n, i) => `${text(180 + i * 110, 95, n)}${text(180 + i * 110, 155, "$" + n * 2)}`)
        .join("") +
      line(110, 115, 480, 115) +
      text(300, 220, "$2 / 1")
    );
  if (kind === "variables")
    return (
      [0, 1, 2, 3]
        .map((n, i) => `${text(160 + i * 90, 95, n)}${text(160 + i * 90, 155, n * 3)}`)
        .join("") +
      line(100, 115, 470, 115) +
      text(70, 95, "x") +
      text(70, 155, "y") +
      text(300, 215, "y = 3x")
    );
  if (kind === "fraction-scale" || kind === "fraction-division")
    return Array.from(
      { length: equation.startsWith("2 ÷") ? 8 : 6 },
      (_, i) =>
        `<rect x="${60 + i * 60}" y="75" width="60" height="70" fill="${i < 3 ? "#0f766e" : "#e2e8f0"}" stroke="#12355b"/>${text(90 + i * 60, 180, kind === "fraction-scale" ? "4" : "¼")}`,
    ).join("");
  const values =
    kind === "median"
      ? ["2", "4", "[5]", "8", "11"]
      : kind === "mean"
        ? ["2", "4", "6", "8"]
        : kind === "mad"
          ? ["|2−5|=3", "|4−5|=1", "|6−5|=1", "|8−5|=3"]
          : [];
  return values
    .map((value, i) => text(80 + (i * 440) / Math.max(1, values.length - 1), 120, value))
    .join("");
}

export function exactConceptVisual(config) {
  const content = exactFamilySupport(config);
  if (!content) return null;
  const visual = graphic(content.graphic, content.equation);
  // Equations remain HTML text so phone zoom, wrapping, and screen readers work.
  return {
    svg: `<div class="family-specific-model">${visual ? `<svg viewBox="0 0 600 250" role="img" aria-label="${escape(content.capEn)}" data-aria-en="${escape(content.capEn)}" data-aria-es="${escape(content.capEs)}">${visual}</svg>` : ""}<p style="font-size:clamp(20px,4vw,28px);font-weight:800;text-align:center;overflow-wrap:anywhere">${escape(content.equation)}</p></div>`,
    capEn: content.capEn,
    capEs: content.capEs,
  };
}

// A lesson-specific check keeps optional Learn content on the same operation.
export function exactFamilyPowerUp(config = {}) {
  const content = exactFamilySupport(config);
  if (!content) return null;
  const checks = {
    "1-2": ["6/5 × 20 = ?", "6/5 × 20 = ?", ["24", "16", "120"]],
    "2-1": [
      "Which question expects varying answers across a group?",
      "¿Qué pregunta espera respuestas variadas de un grupo?",
      [
        ["How many books are on each shelf?", "¿Cuántos libros hay en cada estante?"],
        ["How many books are on this one shelf?", "¿Cuántos libros hay en este estante?"],
        ["What is 4 + 7?", "¿Cuánto es 4 + 7?"],
      ],
    ],
    "2-2": [
      "For 1, 2, 2, 4, 5, 7, how many observations belong to interval 0–2?",
      "Para 1, 2, 2, 4, 5, 7, ¿cuántos datos pertenecen al intervalo 0–2?",
      ["3", "2", "6"],
    ],
    "2-3": [
      "What is the median of 8, 2, 5, 4, 11?",
      "¿Cuál es la mediana de 8, 2, 5, 4, 11?",
      ["5", "6", "8"],
    ],
    "2-4": [
      "In the box plot, Q1 = 4 and Q3 = 10. Where does the box extend?",
      "En el diagrama, Q1 = 4 y Q3 = 10. ¿De dónde a dónde va la caja?",
      ["4 → 10", "2 → 12", "4 → 7"],
    ],
    "2-5": [
      "Q1 = 4 and Q3 = 10. What is the IQR?",
      "Q1 = 4 y Q3 = 10. ¿Cuál es el RIC?",
      ["6", "14", "10"],
    ],
    "2-7": ["2.4 ÷ 0.6 = ?", "2.4 ÷ 0.6 = ?", ["4", "0.4", "40"]],
    "2-8": [
      "What is the mean of 2, 4, 6, 8?",
      "¿Cuál es la media de 2, 4, 6, 8?",
      ["5", "4", "20"],
    ],
    "2-9": [
      "Distances from the mean are 3, 1, 1, 3. What is the MAD?",
      "Las distancias a la media son 3, 1, 1, 3. ¿Cuál es la DMA?",
      ["2", "8", "3"],
    ],
    "2-10": [
      "For 2, 3, 3, 4, 8, changing 8 to 28 affects which measure more?",
      "Para 2, 3, 3, 4, 8, cambiar 8 por 28 afecta más ¿qué medida?",
      [
        ["Mean", "Media"],
        ["Median", "Mediana"],
        ["Both by the same amount", "Ambas por la misma cantidad"],
      ],
    ],
    "2-11": ["5.00 − 4.15 = ?", "5.00 − 4.15 = ?", ["0.85", "1.15", "0.15"]],
    "2-12": ["2.4 × 1.5 = ?", "2.4 × 1.5 = ?", ["3.6", "36", "0.36"]],
    "4-1": [
      "What percent is 25 out of 100?",
      "¿Qué porcentaje es 25 de 100?",
      ["25%", "0.25%", "75%"],
    ],
    "4-2": ["1/4 = ?", "1/4 = ?", ["25%", "4%", "0.25%"]],
    "4-3": [
      "48% of 60 is between which amounts?",
      "¿Entre qué cantidades está 48% de 60?",
      ["24 → 30", "6 → 12", "30 → 60"],
    ],
    "4-4": [
      "What is the price after 25% off $40?",
      "¿Cuál es el precio después de un descuento de 25% sobre $40?",
      ["$30", "$10", "$15"],
    ],
    "4-5": ["6 is 25% of what whole?", "¿De qué entero es 6 el 25%?", ["24", "1.5", "150"]],
    "5-2": [
      "A triangle has base 6 and perpendicular height 4. What is its area?",
      "Un triángulo tiene base 6 y altura perpendicular 4. ¿Cuál es su área?",
      ["12 units² / unidades²", "24 units² / unidades²", "10 units² / unidades²"],
    ],
    "5-3": [
      "A trapezoid has bases 4 and 8 and height 3. What is its area?",
      "Un trapecio tiene bases 4 y 8 y altura 3. ¿Cuál es su área?",
      ["18 units² / unidades²", "36 units² / unidades²", "12 units² / unidades²"],
    ],
    "5-8": [
      "A pyramid has base area 16 and four faces of area 6 each. What is its surface area?",
      "Una pirámide tiene área de base 16 y cuatro caras de área 6 cada una. ¿Cuál es su área total?",
      ["40 units² / unidades²", "24 units² / unidades²", "22 units² / unidades²"],
    ],
    "5-9": [
      "A regular polygon has perimeter 24 and apothem 3. What is its area?",
      "Un polígono regular tiene perímetro 24 y apotema 3. ¿Cuál es su área?",
      ["36 units² / unidades²", "72 units² / unidades²", "27 units² / unidades²"],
    ],
  };
  const id = String(config.lessonId || config.id || "");
  const check = /^9-[1-4]$/.test(id)
    ? [
        "For y=3x, which pair (x,y) fits?",
        "Para y=3x, ¿qué par (x,y) cumple?",
        ["(2,6)", "(6,2)", "(2,5)"],
      ]
    : checks[id];
  if (!check) return null;
  return {
    qEn: check[0],
    qEs: check[1],
    choices: check[2].map((c) => (Array.isArray(c) ? pair(c[0], c[1]) : pair(c, c))),
    correctIndex: 0,
    hintEn: content.capEn,
    hintEs: content.capEs,
  };
}

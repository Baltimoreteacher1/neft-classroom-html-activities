/** Family-only guidance: keep household applications separate from worked examples. */
const pair = (en, es) => ({ en, es });
const GUIDES = {
  1: [
    pair(
      "What do you know, and how will you check your plan?",
      "¿Qué sabes y cómo comprobarás tu plan?",
    ),
    pair(
      "I chose ___ because ___. I checked by ___.",
      "Elegí ___ porque ___. Comprobé usando ___.",
    ),
    pair(
      "Choose an everyday quantity to estimate, such as books on a shelf. Explain your plan, count to check, and describe one change you would make.",
      "Elige una cantidad cotidiana para estimar, como libros en un estante. Explica tu plan, cuenta para comprobar y describe un cambio que harías.",
    ),
  ],
  2: [
    pair(
      "What do the data tell us, and where can you see that?",
      "¿Qué nos dicen los datos y dónde lo ves?",
    ),
    pair("The data show ___ because ___.", "Los datos muestran ___ porque ___."),
    pair(
      "Collect six page counts from books, or use 8, 12, 12, 16, 20, 28. Apply tonight’s statistical question, display, or measure. Label what the numbers represent and explain one conclusion.",
      "Recoge seis cantidades de páginas de libros, o usa 8, 12, 12, 16, 20, 28. Usa la pregunta, representación o medida estadística de hoy. Indica qué representan los números y explica una conclusión.",
    ),
  ],
  3: [
    pair(
      "Which two quantities are compared? What units belong to each?",
      "¿Qué dos cantidades comparas? ¿Qué unidades tiene cada una?",
    ),
    pair(
      "For every ___, there are ___. The units tell me ___.",
      "Por cada ___, hay ___. Las unidades me indican ___.",
    ),
    pair(
      "Draw a recipe using 2 cups of juice and 3 cups of water. Make a table for one, two, and three batches. Explain why the taste stays the same.",
      "Dibuja una receta con 2 tazas de jugo y 3 de agua. Haz una tabla para una, dos y tres tandas. Explica por qué el sabor se mantiene.",
    ),
  ],
  4: [
    pair(
      "Which amount is 100%? Are we finding the part, percent, or whole?",
      "¿Qué cantidad es el 100%? ¿Buscamos la parte, el porcentaje o el total?",
    ),
    pair(
      "___ represents 100%. I am finding ___, so ___.",
      "___ representa el 100%. Busco ___, así que ___.",
    ),
    pair(
      "Draw a $40 price tag with a 25% discount. Label the whole, percent, savings, and final price. Then cover one label and ask your partner to recover it. Alone, explain the check in writing.",
      "Dibuja una etiqueta de $40 con 25% de descuento. Indica el total, porcentaje, ahorro y precio final. Tapa una etiqueta y pide a alguien que la recupere. A solas, explica la comprobación por escrito.",
    ),
  ],
  5: [
    pair(
      "Are we measuring inside, covering faces, or measuring an edge? Which units fit?",
      "¿Medimos el interior, cubrimos caras o medimos un borde? ¿Qué unidades corresponden?",
    ),
    pair("I used ___ units because I measured ___.", "Usé unidades ___ porque medí ___."),
    pair(
      "Sketch a box measuring 6 cm by 4 cm by 3 cm. Label each dimension. Find the area of one face, the total surface area, or the volume to match tonight’s lesson. Explain what your answer measures.",
      "Dibuja una caja de 6 cm por 4 cm por 3 cm. Indica cada dimensión. Halla el área de una cara, el área total o el volumen según la lección de hoy. Explica qué mide tu respuesta.",
    ),
  ],
  6: [
    pair(
      "What does each number or symbol represent? Can you check with another method?",
      "¿Qué representa cada número o símbolo? ¿Puedes comprobar con otro método?",
    ),
    pair(
      "My representation shows ___. I checked it by ___.",
      "Mi representación muestra ___. La comprobé usando ___.",
    ),
    pair(
      "Write a rule for the cost of notebooks at $3 each. Make two equivalent expressions for buying n notebooks and two $1 pencils. Test both with n = 4.",
      "Escribe una regla para el costo de cuadernos de $3 cada uno. Haz dos expresiones equivalentes para comprar n cuadernos y dos lápices de $1. Prueba ambas con n = 4.",
    ),
  ],
  7: [
    pair(
      "Which coordinate changes, and how far does it move?",
      "¿Qué coordenada cambia y cuánto se desplaza?",
    ),
    pair(
      "The points share ___. Their distance is ___ units because ___.",
      "Los puntos comparten ___. Su distancia es de ___ unidades porque ___.",
    ),
    pair(
      "Draw a neighborhood grid. Put a library at (−3, 2), a park at (4, 2), and a store at (4, −2). Find each straight part of the walking route and explain why distance cannot be negative.",
      "Dibuja una cuadrícula del vecindario. Coloca una biblioteca en (−3, 2), un parque en (4, 2) y una tienda en (4, −2). Halla cada tramo recto del camino y explica por qué la distancia no puede ser negativa.",
    ),
  ],
  8: [
    pair(
      "Which values make your statement true? Does the boundary work?",
      "¿Qué valores hacen verdadera tu afirmación? ¿Sirve el valor límite?",
    ),
    pair(
      "___ is a solution because substituting it gives ___.",
      "___ es una solución porque al sustituirlo obtengo ___.",
    ),
    pair(
      "You have $12 and want at least $20. Write and solve an inequality for the extra money. Graph it, then test the boundary and one value on each side.",
      "Tienes $12 y quieres al menos $20. Escribe y resuelve una desigualdad para el dinero adicional. Represéntala y prueba el límite y un valor a cada lado.",
    ),
  ],
  9: [
    pair(
      "What changes each time, and what amount is there at the start?",
      "¿Qué cambia cada vez y qué cantidad hay al principio?",
    ),
    pair(
      "In my rule, ___ is the rate and ___ is the starting amount.",
      "En mi regla, ___ es la tasa y ___ es la cantidad inicial.",
    ),
    pair(
      "Imagine renting a bike for $4 to start and $2 per hour. Write a rule, make a table for 0, 1, 2, and 3 hours, and plot the pairs. Explain where the starting fee appears in all three.",
      "Imagina alquilar una bicicleta por $4 iniciales y $2 por hora. Escribe una regla, haz una tabla para 0, 1, 2 y 3 horas y representa los pares. Explica dónde aparece el costo inicial en las tres representaciones.",
    ),
  ],
  10: [
    pair(
      "Which piece of your work shows how your thinking has grown?",
      "¿Qué trabajo muestra cómo ha crecido tu razonamiento?",
    ),
    pair(
      "Before, I ___. Now I ___. This work shows ___ because ___.",
      "Antes yo ___. Ahora yo ___. Este trabajo muestra ___ porque ___.",
    ),
    pair(
      "Choose an earlier math problem and solve it again, using paper if needed. Compare the strategies. Explain one improvement, one useful mistake, and one question you want to explore next.",
      "Elige un problema anterior y resuélvelo otra vez, en papel si hace falta. Compara las estrategias. Explica una mejora, un error útil y una pregunta que quieras explorar después.",
    ),
  ],
};
export function familyGuidance(config = {}) {
  const id = String(config.lessonId || config.id || "");
  const unit = Number(id.split("-")[0]) || Number(config.unit) || 1;
  let [question, frame, mission] = GUIDES[unit] || GUIDES[1];
  if (/^3-(6|7|10)(-|$)/.test(id)) {
    question = pair(
      "What stays the same when the unit changes? Should the number get larger or smaller?",
      "¿Qué se mantiene cuando cambia la unidad? ¿El número debe aumentar o disminuir?",
    );
    frame = pair(
      "___ and ___ name the same measurement because ___.",
      "___ y ___ nombran la misma medida porque ___.",
    );
    mission = pair(
      "Sketch a shelf 2 feet long. Label the same shelf in inches using 1 foot = 12 inches. Draw a second shelf 36 inches long and compare them in one unit. For between-system practice, use 1 inch = 2.54 cm to label both in centimeters.",
      "Dibuja un estante de 2 pies. Indica su longitud en pulgadas usando 1 pie = 12 pulgadas. Dibuja otro de 36 pulgadas y compáralos en una misma unidad. Para practicar entre sistemas, usa 1 pulgada = 2.54 cm y expresa ambos en centímetros.",
    );
  }
  if (/^6-(1|2|9|10|11)(-|$)/.test(id) || id === "1-practice") {
    question = pair(
      "How many portions fit? How can multiplication check that?",
      "¿Cuántas porciones caben? ¿Cómo lo compruebas multiplicando?",
    );
    frame = pair(
      "___ portions of size ___ fit in ___. I checked: ___ × ___ = ___.",
      "___ porciones de tamaño ___ caben en ___. Comprobé: ___ × ___ = ___.",
    );
    mission = pair(
      "Draw 2½ cups of rice and mark ½-cup portions. Count the portions, write the division, and check with multiplication. Then predict what changes with ¼-cup portions before solving.",
      "Dibuja 2½ tazas de arroz y marca porciones de ½ taza. Cuenta las porciones, escribe la división y comprueba multiplicando. Luego predice qué cambia con porciones de ¼ de taza antes de resolver.",
    );
  }
  if (/^5-(6|7|8)(-|$)/.test(id))
    mission = pair(
      "Sketch a net for tonight’s solid. Label the base and every face; choose sensible dimensions and mark each face height. Calculate how much paper would cover it, explaining whether the base is included.",
      "Dibuja un desarrollo plano del sólido de hoy. Indica la base y cada cara; elige medidas razonables y marca la altura de cada cara. Calcula cuánto papel lo cubriría y explica si incluyes la base.",
    );

  const base = id.replace(/-part2$/, "");
  if (base === "1-2") {
    question = pair(
      "How many equal groups make the whole, and how many do we need?",
      "¿Cuántos grupos iguales forman el total y cuántos necesitamos?",
    );
    frame = pair(
      "One equal group is ___. I need ___ groups, so ___.",
      "Un grupo igual contiene ___. Necesito ___ grupos, así que ___.",
    );
    mission = pair(
      "Draw 20 buttons in 5 equal groups. Suppose 3/5 are blue. Find the number of blue buttons and check against the whole. Try 4/5 next.",
      "Dibuja 20 botones en 5 grupos iguales. Supón que 3/5 son azules. Halla cuántos botones azules hay y compara con el total. Luego prueba con 4/5.",
    );
  }
  if (/^2-(6|7|11|12)$/.test(base)) {
    question = pair(
      "What estimate can you use to check the size and decimal place of your answer?",
      "¿Qué estimación puedes usar para comprobar el tamaño y la posición decimal de tu respuesta?",
    );
    frame = pair(
      "I estimate ___, so my answer ___ is reasonable because ___.",
      "Estimo ___, así que mi respuesta ___ es razonable porque ___.",
    );
    const tasks = {
      "2-6": pair(
        "Share 156 paper tokens equally among 12 envelopes. Estimate, divide, and check with multiplication.",
        "Reparte 156 fichas de papel por igual en 12 sobres. Estima, divide y comprueba multiplicando.",
      ),
      "2-7": pair(
        "A 4.8-liter jug fills cups holding 0.3 liter. Estimate the number of cups, divide, and check with multiplication.",
        "Una jarra de 4.8 litros llena vasos de 0.3 litro. Estima el número de vasos, divide y comprueba multiplicando.",
      ),
      "2-11": pair(
        "Sketch price tags of $2.75 and $4.60. Find the total and change from $10. Estimate first, then check the decimal alignment.",
        "Dibuja etiquetas de $2.75 y $4.60. Halla el total y el cambio de $10. Estima primero y comprueba la alineación decimal.",
      ),
      "2-12": pair(
        "A pretend store sells 1.5 kg of apples for $2.40 per kg. Estimate the cost, multiply, and explain your decimal placement.",
        "Una tienda imaginaria vende 1.5 kg de manzanas a $2.40 por kg. Estima el costo, multiplica y explica la posición decimal.",
      ),
    };
    mission = tasks[base];
  }
  if (base === "3-5")
    mission = pair(
      "Compare two drink recipes: A uses 2 cups of juice and 3 cups of water; B uses 3 cups of juice and 5 cups of water. Use equal amounts of juice or a unit rate to decide which tastes more concentrated. Label the units.",
      "Compara dos recetas: A usa 2 tazas de jugo y 3 de agua; B usa 3 de jugo y 5 de agua. Iguala el jugo o usa una tasa unitaria para decidir cuál queda más concentrada. Indica las unidades.",
    );
  if (base === "3-6")
    mission = pair(
      "Sketch a shelf 2 feet long. Label it in inches using 1 foot = 12 inches. Draw a second shelf 36 inches long. Compare them in the same unit, then check by converting back.",
      "Dibuja un estante de 2 pies. Expresa su longitud en pulgadas usando 1 pie = 12 pulgadas. Dibuja otro de 36 pulgadas. Compáralos en la misma unidad y comprueba convirtiendo de regreso.",
    );
  if (base === "4-5")
    mission = pair(
      "A store says a $12 discount is 25% of the original price. Draw a bar for 100%, mark the known part, and find the original price. Check by finding 25% of your answer.",
      "Una tienda dice que un descuento de $12 es el 25% del precio original. Dibuja una barra del 100%, marca la parte conocida y halla el precio original. Comprueba hallando el 25% de tu respuesta.",
    );
  if (/^5-[1-4]$/.test(base) || base === "5-9") {
    const shapes = {
      "5-1": pair(
        "a parallelogram with base 8 cm and perpendicular height 3 cm",
        "un paralelogramo de base 8 cm y altura perpendicular 3 cm",
      ),
      "5-2": pair(
        "a triangle with base 8 cm and perpendicular height 3 cm",
        "un triángulo de base 8 cm y altura perpendicular 3 cm",
      ),
      "5-3": pair(
        "a trapezoid with parallel bases 8 cm and 4 cm and perpendicular height 3 cm",
        "un trapecio de bases paralelas 8 cm y 4 cm y altura perpendicular 3 cm",
      ),
      "5-4": pair(
        "a floor made from a 4 m by 3 m rectangle joined to a 2 m by 2 m square without overlap",
        "un piso formado por un rectángulo de 4 m por 3 m unido sin superposición a un cuadrado de 2 m por 2 m",
      ),
      "5-9": pair(
        "a regular hexagon made from six equal triangles, each with base 4 cm and height 3.46 cm",
        "un hexágono regular formado por seis triángulos iguales, cada uno con base 4 cm y altura 3.46 cm",
      ),
    };
    mission = pair(
      "Design a paper decoration: sketch " +
        shapes[base].en +
        ". Label the measurements and calculate its area. Explain each part of your calculation.",
      "Diseña una decoración de papel: dibuja " +
        shapes[base].es +
        ". Indica las medidas y calcula el área. Explica cada parte del cálculo.",
    );
  }
  if (/^6-(3|4)$/.test(base)) {
    question = pair(
      "Which number is the repeated factor? How many times is it used?",
      "¿Qué número es el factor repetido? ¿Cuántas veces se usa?",
    );
    mission = pair(
      "Draw a branching pattern: each branch makes 3 new branches. Count after 1, 2, and 3 rounds. Write powers of 3 and explain why 3³ is not 3 × 3.",
      "Dibuja un patrón: cada rama produce 3 ramas nuevas. Cuenta después de 1, 2 y 3 rondas. Escribe potencias de 3 y explica por qué 3³ no es 3 × 3.",
    );
  }
  if (/^6-(7|12|13)$/.test(base)) {
    question = pair(
      "Are you looking for factors that divide a number or multiples made by repeating it?",
      "¿Buscas factores que dividen un número o múltiplos formados al repetirlo?",
    );
    mission = pair(
      "Draw 12 and 18 counters. List the factors of each, show their prime factorizations, and find the smallest equal total you can make with groups of 12 and groups of 18. Explain with your drawings.",
      "Dibuja 12 y 18 fichas. Enumera los factores, muestra sus factorizaciones primas y halla el menor total igual que puedes formar con grupos de 12 y de 18. Explica con tus dibujos.",
    );
  }
  if (/^7-[1-4]$/.test(base)) {
    question = pair(
      "Where is the number relative to zero? What does its sign tell you?",
      "¿Dónde está el número con respecto a cero? ¿Qué indica su signo?",
    );
    frame = pair(
      "___ is to the ___ of zero. Its distance from zero is ___.",
      "___ está a la ___ del cero. Su distancia al cero es ___.",
    );
    mission = pair(
      "Make a paper thermometer and mark −4°C, 0°C, and 3°C. Order the temperatures, mark each opposite, and compare their distances from zero.",
      "Haz un termómetro de papel y marca −4°C, 0°C y 3°C. Ordena las temperaturas, marca sus opuestos y compara sus distancias al cero.",
    );
  }
  if (base === "7-9")
    mission = pair(
      "Draw a point at (−3, 2). Reflect it across the x-axis and then, starting from the original point, across the y-axis. Label all three points and explain what stays the same.",
      "Dibuja un punto en (−3, 2). Refléjalo sobre el eje x y después, desde el punto original, sobre el eje y. Indica los tres puntos y explica qué se mantiene igual.",
    );
  if (/^8-[1-3]$/.test(base)) {
    question = pair(
      "What value makes both sides equal? How can substitution check it?",
      "¿Qué valor hace iguales ambos lados? ¿Cómo lo compruebas sustituyendo?",
    );
    mission = pair(
      base === "8-3"
        ? "Four equal-price notebooks cost $28. Write an equation, find one notebook’s price, and substitute to check."
        : "You have $12 and need exactly $20. Write an equation for the missing amount, solve it, and substitute to check.",
      base === "8-3"
        ? "Cuatro cuadernos del mismo precio cuestan $28. Escribe una ecuación, halla el precio de uno y sustituye para comprobar."
        : "Tienes $12 y necesitas exactamente $20. Escribe una ecuación para la cantidad que falta, resuelve y sustituye para comprobar.",
    );
  }
  if (/^7-(5|8)$/.test(base)) {
    question = pair(
      "Which way does each sign send you along each axis?",
      "¿Hacia dónde te lleva el signo en cada eje?",
    );
    frame = pair(
      "To plot (___, ___), I move ___ along the x-axis, then ___ along the y-axis.",
      "Para ubicar (___, ___), me muevo ___ en el eje x y luego ___ en el eje y.",
    );
    mission = pair(
      "Draw a neighborhood grid with home at (0, 0). Plot a park at (3, 2), a store at (−4, 1), a school at (−2, −3), and a library at (5, −1). Name each quadrant and explain how the signs told you which way to move.",
      "Dibuja una cuadrícula del vecindario con la casa en (0, 0). Ubica un parque en (3, 2), una tienda en (−4, 1), una escuela en (−2, −3) y una biblioteca en (5, −1). Nombra cada cuadrante y explica cómo los signos te indicaron hacia dónde moverte.",
    );
  }
  if (base === "7-7")
    mission = pair(
      "Design a rectangular garden on a coordinate grid using (−2, −1), (4, −1), (4, 3), and (−2, 3). Label the vertices, find the side lengths, and explain its perimeter.",
      "Diseña un jardín rectangular en una cuadrícula con (−2, −1), (4, −1), (4, 3) y (−2, 3). Nombra los vértices, halla los lados y explica su perímetro.",
    );
  return { question, frame, mission };
}
export function householdMission(config) {
  const { question, mission } = familyGuidance(config);
  return {
    icon: "🏡",
    titleEn: "Use the math at home",
    titleEs: "Usa las matemáticas en casa",
    materialsEn: "Paper and pencil; real objects are optional",
    materialsEs: "Papel y lápiz; los objetos reales son opcionales",
    minutes: 5,
    steps: [
      mission,
      pair(
        "Show a labeled drawing, table, or equation. Your partner asks one question; working alone, write your explanation.",
        "Muestra un dibujo con etiquetas, una tabla o una ecuación. Tu acompañante hace una pregunta; a solas, escribe tu explicación.",
      ),
    ],
    talkEn: question.en,
    talkEs: question.es,
  };
}

/* "Find the flaw" warm-ups. Each skill has two short explanations about a
 * made-up problem (never the student's own) and a note on what to look for.
 * The student compares them before writing; nothing here is scored. */
(function (root) {
  "use strict";

  const EX = {
    ratio: {
      weak: {
        en: "For every 3 cups there are 2 batches. For 6 cups there are 5 batches because I added 3 to both.",
        es: "Por cada 3 tazas hay 2 tandas. Para 6 tazas hay 5 tandas porque sumé 3 a las dos.",
      },
      strong: {
        en: "For every 3 cups there are 2 batches. Doubling both gives 6 cups and 4 batches because the ratio stays the same.",
        es: "Por cada 3 tazas hay 2 tandas. Al duplicar las dos se obtienen 6 tazas y 4 tandas porque la razón se mantiene.",
      },
      note: {
        en: "Look at how each writer changes BOTH quantities, and whether the reason keeps the relationship the same.",
        es: "Fíjate en cómo cada autor cambia LAS DOS cantidades y si la razón mantiene la relación igual.",
      },
    },
    percent: {
      weak: {
        en: "40% of a number is 40 because the percent is the number.",
        es: "El 40 % de un número es 40 porque el porcentaje es el número.",
      },
      strong: {
        en: "40% means 40 out of every 100, so I split the whole into hundredths and take 40 of them.",
        es: "40 % significa 40 de cada 100, así que divido el entero en centésimas y tomo 40.",
      },
      note: {
        en: "Check which explanation says what the whole is and how the part compares with 100.",
        es: "Revisa cuál explicación dice qué es el entero y cómo se compara la parte con 100.",
      },
    },
    fraction: {
      weak: {
        en: "To divide 1/2 by 1/4 I divided the tops and the bottoms because that is dividing.",
        es: "Para dividir 1/2 entre 1/4 dividí los numeradores y los denominadores porque eso es dividir.",
      },
      strong: {
        en: "I asked how many 1/4s fit in 1/2. Two quarters make a half, so 2 groups fit, and that matches the fraction bar.",
        es: "Me pregunté cuántos 1/4 caben en 1/2. Dos cuartos forman un medio, así que caben 2 grupos, y coincide con la barra de fracciones.",
      },
      note: {
        en: "Notice which writer says what the division means (groups) and checks it with a model.",
        es: "Observa cuál autor dice qué significa la división (grupos) y lo comprueba con un modelo.",
      },
    },
    decimals: {
      weak: {
        en: "I multiplied 0.4 × 0.3 and got 1.2 because 4 × 3 is 12.",
        es: "Multipliqué 0,4 × 0,3 y obtuve 1,2 porque 4 × 3 es 12.",
      },
      strong: {
        en: "4 tenths times 3 tenths is 12 hundredths, so the answer is 0.12 because tenths times tenths are hundredths.",
        es: "4 décimas por 3 décimas son 12 centésimas, así que la respuesta es 0,12 porque décimas por décimas son centésimas.",
      },
      note: {
        en: "Look for the writer who explains what the digits are worth, not just the digits.",
        es: "Busca al autor que explica cuánto valen los dígitos y no solo los dígitos.",
      },
    },
    integers: {
      weak: {
        en: "-3 is bigger than 2 because 3 is bigger than 2.",
        es: "-3 es mayor que 2 porque 3 es mayor que 2.",
      },
      strong: {
        en: "-3 is to the left of 2 on the number line, so it is less, because numbers farther left are smaller.",
        es: "-3 está a la izquierda de 2 en la recta numérica, así que es menor porque los números más a la izquierda son menores.",
      },
      note: {
        en: "Check which explanation uses the position or sign to support its claim.",
        es: "Revisa cuál explicación usa la posición o el signo para apoyar su afirmación.",
      },
    },
    exponents: {
      weak: {
        en: "2 to the 4th is 8 because 2 times 4 is 8.",
        es: "2 a la 4.ª es 8 porque 2 por 4 es 8.",
      },
      strong: {
        en: "2 to the 4th means 2 is a factor 4 times: 2 × 2 × 2 × 2, so the exponent counts the factors.",
        es: "2 a la 4.ª significa que 2 es factor 4 veces: 2 × 2 × 2 × 2, así que el exponente cuenta los factores.",
      },
      note: {
        en: "Look for the writer who says what the base and the exponent each tell you.",
        es: "Busca al autor que dice qué indican la base y el exponente.",
      },
    },
    equation: {
      weak: {
        en: "For x + 5 = 9 I subtracted 5 from the 9 only, because the 5 has to go away.",
        es: "En x + 5 = 9 resté 5 solo del 9, porque el 5 tiene que desaparecer.",
      },
      strong: {
        en: "I subtracted 5 from both sides because the same move keeps the equation balanced.",
        es: "Resté 5 en ambos lados porque la misma operación mantiene la ecuación en equilibrio.",
      },
      note: {
        en: "Check which explanation says what happens on BOTH sides and why that keeps it equal.",
        es: "Revisa cuál explicación dice qué pasa en AMBOS lados y por qué se mantiene la igualdad.",
      },
    },
    inequality: {
      weak: {
        en: "x > 3 means x can be 3, so I shaded the circle in.",
        es: "x > 3 significa que x puede ser 3, así que rellené el círculo.",
      },
      strong: {
        en: "x > 3 does not include 3, so I used an open circle at 3 and shaded right, because those values are greater.",
        es: "x > 3 no incluye al 3, así que usé un círculo abierto en 3 y sombreé a la derecha porque esos valores son mayores.",
      },
      note: {
        en: "Notice which writer explains the boundary and which side is shaded.",
        es: "Observa cuál autor explica el límite y qué lado está sombreado.",
      },
    },
    twovar: {
      weak: {
        en: "The table shows y = 2x because it goes up.",
        es: "La tabla muestra y = 2x porque sube.",
      },
      strong: {
        en: "Each time x goes up by 1, y goes up by 2, so y depends on x by the rule y = 2x.",
        es: "Cada vez que x sube 1, y sube 2, así que y depende de x con la regla y = 2x.",
      },
      note: {
        en: "Look for the writer who names how the output changes when the input changes.",
        es: "Busca al autor que dice cómo cambia la salida cuando cambia la entrada.",
      },
    },
    area: {
      weak: {
        en: "The triangle has base 6 and height 4, so its area is 24 square units because I multiplied.",
        es: "El triángulo tiene base 6 y altura 4, así que su área es 24 unidades cuadradas porque multipliqué.",
      },
      strong: {
        en: "A triangle is half of a rectangle with the same base and height, so 6 × 4 is 24 and half of that is 12 square units.",
        es: "Un triángulo es la mitad de un rectángulo con la misma base y altura, así que 6 × 4 es 24 y la mitad es 12 unidades cuadradas.",
      },
      note: {
        en: "Check which explanation connects the numbers to the shape and to the half.",
        es: "Revisa cuál explicación conecta los números con la figura y con la mitad.",
      },
    },
    volume: {
      weak: {
        en: "A box that is 2 by 3 by 4 has volume 9 because I added the sides.",
        es: "Una caja de 2 por 3 por 4 tiene volumen 9 porque sumé los lados.",
      },
      strong: {
        en: "The bottom layer has 2 × 3 = 6 cubes and there are 4 layers, so the volume is in cubic units because I counted cubes.",
        es: "La capa de abajo tiene 2 × 3 = 6 cubos y hay 4 capas, así que el volumen es en unidades cúbicas porque conté cubos.",
      },
      note: {
        en: "Look for the writer who says what is being measured and uses the right kind of units.",
        es: "Busca al autor que dice qué se mide y usa el tipo de unidades correcto.",
      },
    },
    statistics: {
      weak: {
        en: "The typical value is 12 because that is the biggest number in the data.",
        es: "El valor típico es 12 porque es el número más grande de los datos.",
      },
      strong: {
        en: "Most values cluster near 7 and 12 is an outlier, so the median is a better typical value because it is not pulled by the outlier.",
        es: "La mayoría de los valores se agrupan cerca de 7 y 12 es un valor atípico, así que la mediana es mejor valor típico porque no la afecta el valor atípico.",
      },
      note: {
        en: "Check which claim cites a feature of the data as evidence.",
        es: "Revisa cuál afirmación cita una característica de los datos como evidencia.",
      },
    },
  };

  root.MWReasoningExemplars = Object.freeze(EX);
})(window);

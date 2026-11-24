// BCPSS Family Guide (EN/ES) — g8-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on the Pythagorean Theorem and the volume of cylinders, cones and spheres. Vocabulary order matches ../units/g8-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning how the sides of a right triangle are connected, and how to find a missing length. They also learn how much a can, a cone or a ball can hold. It matters when you check that a corner is square, find the shortest path across a field, size a ladder, or compare how much two containers hold.",
    es: "Su hijo o hija está aprendiendo cómo se relacionan los lados de un triángulo rectángulo y cómo hallar una longitud que falta. También aprende cuánto le cabe a una lata, a un cono o a una pelota. Sirve para comprobar que una esquina es recta, hallar el camino más corto por un campo, elegir el tamaño de una escalera o comparar cuánto le cabe a dos recipientes.",
  },
  goals: {
    en: [
      "I can use the Pythagorean Theorem to find a missing side of a right triangle.",
      "I can find the volume of a cylinder, a cone and a sphere.",
      "I can explain why with because, leads to and as a result.",
    ],
    es: [
      "Puedo usar el Teorema de Pitágoras para hallar un lado que falta en un triángulo rectángulo.",
      "Puedo hallar el volumen de un cilindro, un cono y una esfera.",
      "Puedo explicar por qué con porque, lleva a y como resultado.",
    ],
  },
  vocab: [
    { term: "right triangle", def_es: "un triángulo con un ángulo de 90 grados, como la esquina de una hoja de papel", example_es: "Un triángulo con lados 3, 4 y 5 es un triángulo rectángulo." },
    { term: "hypotenuse", def_es: "el lado más largo de un triángulo rectángulo, el que está frente al ángulo recto", example_es: "En un triángulo con lados 3, 4 y 5, la hipotenusa es 5." },
    { term: "leg", def_es: "uno de los dos lados más cortos que forman el ángulo recto", example_es: "Cada cateto del triángulo 3-4-5 toca el ángulo recto." },
    { term: "Pythagorean Theorem", def_es: "la regla que dice que, en un triángulo rectángulo, los cuadrados de los dos catetos sumados dan el cuadrado de la hipotenusa", example_es: "El Teorema de Pitágoras dice que 3² + 4² = 5²." },
    { term: "converse", def_es: "una afirmación que resulta de cambiar entre sí la parte del \"si\" y la parte del \"entonces\" de otra afirmación", example_es: "El recíproco del teorema dice que si a² + b² = c², entonces el triángulo es rectángulo." },
    { term: "cylinder", def_es: "un sólido con dos círculos planos como bases y un lado curvo, como una lata", example_es: "Una lata de sopa tiene forma de cilindro." },
    { term: "cone", def_es: "un sólido con una base circular y una punta arriba", example_es: "Un gorro de fiesta tiene forma de cono." },
    { term: "sphere", def_es: "un sólido perfectamente redondo en el que todos los puntos de la superficie están a la misma distancia del centro", example_es: "Una pelota de baloncesto tiene forma de esfera." },
    { term: "volume", def_es: "la cantidad de espacio dentro de un sólido", example_es: "El volumen de una lata dice cuánta sopa le cabe." },
    { term: "radius", def_es: "la distancia desde el centro de un círculo o de una esfera hasta su borde", example_es: "Una lata con radio de 3 pulgadas mide 6 pulgadas de ancho." },
  ],
  talk: [
    { en: "Does this corner make a right angle? How can you check?", es: "¿Esta esquina forma un ángulo recto? ¿Cómo puedes comprobarlo?" },
    { en: "Which side is the longest, and which two sides make the corner?", es: "¿Cuál lado es el más largo y cuáles dos lados forman la esquina?" },
    { en: "What shortcut does the diagonal give you compared to walking along the two sides?", es: "¿Qué atajo te da la diagonal en comparación con caminar por los dos lados?" },
    { en: "Which holds more, the can or the cone? How could you test it?", es: "¿Cuál tiene más capacidad, la lata o el cono? ¿Cómo lo podrías probar?" },
    { en: "What do you need to measure to find how much a ball holds?", es: "¿Qué necesitas medir para hallar cuánto le cabe a una pelota?" },
  ],
  try_at_home: [
    {
      title: { en: "Is the Corner Square?", es: "¿La esquina es recta?" },
      minutes: 15,
      materials: { en: "A tape measure or ruler, a table, door, or box corner, paper and pencil", es: "Una cinta métrica o regla, la esquina de una mesa, una puerta o una caja, papel y lápiz" },
      steps: {
        en: [
          "Measure 30 centimeters along one edge from a corner and make a mark. Measure 40 centimeters along the other edge and make a mark.",
          "Measure the distance between the two marks. If the corner is a right angle, it will be exactly 50 centimeters.",
          "Write it out: 30² + 40² = 900 + 1,600 = 2,500, and 50² = 2,500.",
          "Try another corner in the house. Ask: is it square? How do you know?",
        ],
        es: [
          "Midan 30 centímetros a lo largo de un borde desde una esquina y hagan una marca. Midan 40 centímetros por el otro borde y hagan otra marca.",
          "Midan la distancia entre las dos marcas. Si la esquina es un ángulo recto, medirá exactamente 50 centímetros.",
          "Escríbanlo: 30² + 40² = 900 + 1,600 = 2,500, y 50² = 2,500.",
          "Prueben otra esquina de la casa. Pregunten: ¿es recta? ¿Cómo lo saben?",
        ],
      },
    },
    {
      title: { en: "The Shortcut Across", es: "El atajo" },
      minutes: 15,
      materials: { en: "A map or a drawing of your block, a ruler, paper and pencil, a calculator is optional", es: "Un mapa o un dibujo de su cuadra, una regla, papel y lápiz; la calculadora es opcional" },
      steps: {
        en: [
          "Choose two spots on a block, like going 6 blocks east and then 8 blocks north.",
          "Add them to find the walking distance: 6 + 8 = 14 blocks.",
          "Find the straight-line distance: 6² + 8² = 36 + 64 = 100, so the distance is 10 blocks.",
          "Ask: how many blocks does the shortcut save? Why is the straight line shorter?",
        ],
        es: [
          "Elijan dos puntos de una cuadra, como ir 6 cuadras al este y luego 8 cuadras al norte.",
          "Súmenlas para hallar la distancia caminando: 6 + 8 = 14 cuadras.",
          "Hallen la distancia en línea recta: 6² + 8² = 36 + 64 = 100, así que la distancia es de 10 cuadras.",
          "Pregunten: ¿cuántas cuadras ahorra el atajo? ¿Por qué la línea recta es más corta?",
        ],
      },
    },
    {
      title: { en: "Can, Cone or Ball?", es: "¿Lata, cono o pelota?" },
      minutes: 20,
      materials: { en: "A can, a ruler, paper and pencil, a calculator is optional", es: "Una lata, una regla, papel y lápiz; la calculadora es opcional" },
      steps: {
        en: [
          "Measure the width of a can across the top and divide by 2 to get the radius. Measure its height.",
          "Find the volume: 3.14 × radius × radius × height. Say it as: the base circle times the height.",
          "Ask: a cone with the same base and height would hold one third as much. What would its volume be?",
          "Try a ball: measure it across, halve it for the radius, and find 4/3 × 3.14 × radius × radius × radius.",
        ],
        es: [
          "Midan el ancho de una lata en la tapa y dividan entre 2 para obtener el radio. Midan su altura.",
          "Hallen el volumen: 3.14 × radio × radio × altura. Díganlo así: el círculo de la base por la altura.",
          "Pregunten: un cono con la misma base y la misma altura tendría una tercera parte. ¿Cuál sería su volumen?",
          "Prueben con una pelota: midan de lado a lado, saquen la mitad para el radio y hallen 4/3 × 3.14 × radio × radio × radio.",
        ],
      },
    },
    {
      title: { en: "Which Holds More?", es: "¿Cuál tiene más capacidad?" },
      minutes: 15,
      materials: { en: "Two different cups or bowls, dry rice or water, a measuring cup", es: "Dos vasos o tazones distintos, arroz seco o agua, una taza de medir" },
      steps: {
        en: [
          "Look at two containers. Ask: which one do you think holds more?",
          "Fill one and pour it into a measuring cup. Write down the amount.",
          "Do the same with the other. Compare.",
          "Ask: what shape is each container, a cylinder, a cone or something else? What measurements would give the volume?",
        ],
        es: [
          "Miren dos recipientes. Pregunten: ¿cuál creen que tiene más capacidad?",
          "Llenen uno y viértanlo en una taza de medir. Anoten la cantidad.",
          "Hagan lo mismo con el otro. Comparen.",
          "Pregunten: ¿qué forma tiene cada recipiente: cilindro, cono u otra? ¿Qué medidas darían el volumen?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because the triangle has a right angle, [a² + b² = c²].", es: "Como el triángulo tiene un ángulo recto, [a² + b² = c²]." },
    { en: "The legs [3] and [4] lead to a hypotenuse of [5].", es: "Los catetos [3] y [4] llevan a una hipotenusa de [5]." },
    { en: "The volume is [number] cubic [units] because [reason].", es: "El volumen es [número] [unidades] cúbicas porque [razón]." },
    { en: "As a result, the [cone] holds [one third] as much as the [cylinder].", es: "Como resultado, [el cono] tiene [una tercera parte] de la capacidad de [el cilindro]." },
  ],
  help: {
    en: [
      "You do not need to know the theorem. Ask your child to show you the right angle and the longest side.",
      "Use real objects with right angles: doors, books, table corners.",
      "Ask \"which side is the longest?\" This tells you which side is the hypotenuse.",
      "Let your child measure and check. Doing it with real things shows why it works.",
    ],
    es: [
      "No necesitan saber el teorema. Pídanle a su hijo o hija que les muestre el ángulo recto y el lado más largo.",
      "Usen objetos reales con ángulos rectos: puertas, libros, esquinas de mesas.",
      "Pregunten \"¿cuál lado es el más largo?\". Eso indica cuál lado es la hipotenusa.",
      "Dejen que mida y compruebe. Hacerlo con cosas reales muestra por qué funciona.",
    ],
  },
  home_language: {
    en: "Many words are close in Spanish: hypotenuse (hipotenusa), cylinder (cilindro), cone (cono), sphere (esfera), volume (volumen), radius (radio). Say them in Spanish while you measure. Pythagoras is called Pitágoras in Spanish. Be careful with \"leg\": in Spanish it is \"cateto\", not \"pierna\".",
    es: "Muchas palabras son parecidas en inglés: hipotenusa (hypotenuse), cilindro (cylinder), cono (cone), esfera (sphere), volumen (volume), radio (radius). Díganlas en español mientras miden. Cuidado con \"cateto\": en inglés se dice \"leg\", que también significa pierna.",
  },
  celebrate: {
    en: "You will know it is working when your child can pick a corner or a container and tell you, in any language, what they would measure and why the answer makes sense.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda elegir una esquina o un recipiente y decirles, en el idioma que quiera, qué mediría y por qué la respuesta tiene sentido.",
  },
};

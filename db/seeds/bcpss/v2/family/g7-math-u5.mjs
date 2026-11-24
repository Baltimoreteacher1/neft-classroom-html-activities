// BCPSS Family Guide (EN/ES) — g7-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on scale drawings, circles and prisms. Vocabulary order matches ../units/g7-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning about three kinds of measuring: scale drawings like maps and floor plans, circles (the distance around and the space inside), and prisms such as boxes and tanks (the outside surface and the space inside). It matters when you read a map, buy a rug, wrap a gift, or fill a container.",
    es: "Su hijo o hija está aprendiendo tres tipos de medición: los dibujos a escala, como mapas y planos; los círculos (la distancia alrededor y el espacio adentro); y los prismas, como cajas y tanques (la superficie por fuera y el espacio por dentro). Sirve para leer un mapa, comprar una alfombra, envolver un regalo o llenar un recipiente.",
  },
  goals: {
    en: [
      "I can use a scale to find real lengths from a drawing.",
      "I can find the circumference and the area of a circle.",
      "I can find the surface area and volume of a prism, and compare shapes with both and whereas.",
    ],
    es: [
      "Puedo usar una escala para hallar longitudes reales a partir de un dibujo.",
      "Puedo hallar la circunferencia y el área de un círculo.",
      "Puedo hallar el área de superficie y el volumen de un prisma, y comparar figuras con tanto como y mientras que.",
    ],
  },
  vocab: [
    { term: "scale drawing", def_es: "un dibujo más pequeño o más grande de un objeto real, donde todas las longitudes siguen la misma razón", example_es: "Un dibujo a escala de un parque del Inner Harbor muestra los caminos reales mucho más pequeños." },
    { term: "scale factor", def_es: "el número por el que se multiplica una longitud del dibujo para obtener la longitud real", example_es: "Con un factor de escala de 200, 4 cm en el dibujo son 800 cm en la vida real." },
    { term: "radius", def_es: "la distancia desde el centro de un círculo hasta su borde", example_es: "Un círculo con radio de 5 metros mide 10 metros de ancho." },
    { term: "diameter", def_es: "la distancia de un lado a otro de un círculo pasando por el centro", example_es: "La fuente tiene un diámetro de 10 metros, así que su radio es de 5 metros." },
    { term: "circumference", def_es: "la distancia alrededor de un círculo, como la orilla de una tapa", example_es: "La circunferencia de un círculo con diámetro de 10 m es de unos 31.4 m." },
    { term: "pi", def_es: "el número que resulta al dividir la circunferencia de cualquier círculo entre su diámetro; es de más o menos 3.14", example_es: "Usamos 3.14 para pi cuando hallamos la circunferencia." },
    { term: "cross section", def_es: "la figura plana que se ve al cortar un sólido, como al rebanar un pan", example_es: "Una sección transversal de una caja cortada paralela a su base es un rectángulo." },
    { term: "prism", def_es: "un sólido con dos bases iguales y paralelas y lados planos rectangulares", example_es: "Una caja de cereal es un prisma rectangular." },
    { term: "surface area", def_es: "el área total de todas las caras de un sólido", example_es: "El área de superficie de un cubo con aristas de 3 pulgadas es de 54 pulgadas cuadradas." },
    { term: "volume", def_es: "la cantidad de espacio dentro de un sólido", example_es: "El volumen de un prisma es el área de su base por su altura." },
  ],
  talk: [
    { en: "What does 1 inch on this map or plan stand for in real life?", es: "¿Qué representa 1 pulgada en este mapa o plano en la vida real?" },
    { en: "What is the distance around this circle, and what is the space inside? Are they the same thing?", es: "¿Cuál es la distancia alrededor de este círculo y cuál es el espacio adentro? ¿Es lo mismo?" },
    { en: "How are a box and a can alike, and how are they different?", es: "¿En qué se parecen una caja y una lata y en qué se diferencian?" },
    { en: "Would you need surface area or volume to wrap it? To fill it?", es: "¿Necesitarías el área de superficie o el volumen para envolverlo? ¿Y para llenarlo?" },
    { en: "What shape do you see if you slice through it?", es: "¿Qué figura ves si lo cortas por la mitad?" },
  ],
  try_at_home: [
    {
      title: { en: "Map Scale Walk", es: "Paseo con escala de mapa" },
      minutes: 15,
      materials: { en: "A city map or a map app, a ruler, paper and pencil", es: "Un mapa de la ciudad o una aplicación de mapas, una regla, papel y lápiz" },
      steps: {
        en: [
          "Find the scale on the map, like 1 inch = 1 mile, or use the map app's scale bar.",
          "Measure the distance between your home and a place you know, using a ruler.",
          "Multiply by the scale to find the real distance. Ask: does this match what we know?",
          "Draw a simple scale drawing of your room: 1 inch for every 2 feet. Measure the real room first.",
        ],
        es: [
          "Busquen la escala del mapa, como 1 pulgada = 1 milla, o usen la barra de escala de la aplicación.",
          "Midan con la regla la distancia entre su casa y un lugar que conocen.",
          "Multipliquen por la escala para hallar la distancia real. Pregunten: ¿coincide con lo que sabemos?",
          "Dibujen un plano sencillo de su cuarto: 1 pulgada por cada 2 pies. Midan primero el cuarto real.",
        ],
      },
    },
    {
      title: { en: "Around and Across", es: "Alrededor y a lo ancho" },
      minutes: 15,
      materials: { en: "Round objects (a can, a plate, a cup), a string or a flexible measuring tape, a ruler", es: "Objetos redondos (una lata, un plato, una taza), un hilo o una cinta métrica flexible, una regla" },
      steps: {
        en: [
          "Wrap the string around the can once. Mark and measure that length. That is the circumference.",
          "Measure straight across the top through the center. That is the diameter.",
          "Divide the circumference by the diameter. What number do you get? It will be close to 3.14, called pi.",
          "Try a plate or cup. Ask: do you get about the same number again?",
        ],
        es: [
          "Den una vuelta con el hilo alrededor de la lata. Marquen y midan esa longitud. Esa es la circunferencia.",
          "Midan en línea recta a lo ancho de la tapa, pasando por el centro. Ese es el diámetro.",
          "Dividan la circunferencia entre el diámetro. ¿Qué número obtienen? Estará cerca de 3.14, llamado pi.",
          "Prueben con un plato o una taza. Pregunten: ¿obtienen otra vez más o menos el mismo número?",
        ],
      },
    },
    {
      title: { en: "Pack the Box", es: "Llenar la caja" },
      minutes: 20,
      materials: { en: "A shoebox or cereal box, ruler, sugar cubes or small blocks (optional), paper and pencil", es: "Una caja de zapatos o de cereal, regla, cubos de azúcar o bloques pequeños (opcional), papel y lápiz" },
      steps: {
        en: [
          "Measure the length, width and height of the box in inches.",
          "Find the area of the base (length × width). Ask: how many cubes fit in the bottom layer?",
          "Multiply the base area by the height to find the volume. Check by filling the box.",
          "Add the area of all six faces to find the surface area. Ask: which one would you use to wrap it?",
        ],
        es: [
          "Midan en pulgadas el largo, el ancho y el alto de la caja.",
          "Hallen el área de la base (largo × ancho). Pregunten: ¿cuántos cubos caben en la capa de abajo?",
          "Multipliquen el área de la base por la altura para hallar el volumen. Comprueben llenando la caja.",
          "Sumen el área de las seis caras para hallar el área de superficie. Pregunten: ¿cuál usarías para envolverla?",
        ],
      },
    },
    {
      title: { en: "Slice the Loaf", es: "Rebanar el pan" },
      minutes: 10,
      materials: { en: "A loaf of bread, a block of cheese, or clay; a table knife (adult help)", es: "Una barra de pan, un bloque de queso o plastilina; un cuchillo de mesa (con ayuda de un adulto)" },
      steps: {
        en: [
          "Slice a loaf of bread straight across. Look at the flat cut surface. That is a cross section.",
          "Ask: what shape is it? Slice another way. Does the shape change?",
          "Notice that every slice of a prism cut parallel to its base has the same shape.",
          "Ask: how are the slices alike, and how are they different?",
        ],
        es: [
          "Corten una barra de pan en línea recta de lado a lado. Miren la superficie plana del corte. Esa es una sección transversal.",
          "Pregunten: ¿qué forma tiene? Corten de otra manera. ¿Cambia la forma?",
          "Noten que cada rebanada de un prisma cortada paralela a su base tiene la misma forma.",
          "Pregunten: ¿en qué se parecen las rebanadas y en qué se diferencian?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Both [a cube] and [a box] have [six faces], whereas [a cube] has [equal edges].", es: "Tanto [un cubo] como [una caja] tienen [seis caras], mientras que [un cubo] tiene [aristas iguales]." },
    { en: "The scale is [1] to [200], so [4 cm] on the drawing is [800 cm] in real life.", es: "La escala es de [1] a [200], entonces [4 cm] en el dibujo son [800 cm] en la vida real." },
    { en: "[Circumference] is the distance around a circle, but [area] is the space inside it.", es: "[La circunferencia] es la distancia alrededor de un círculo, pero [el área] es el espacio adentro." },
    { en: "The volume is [base area] times [height], so [the box holds that many cubes].", es: "El volumen es [área de la base] por [altura], entonces [la caja cabe esa cantidad de cubos]." },
  ],
  help: {
    en: [
      "You do not need to know the formulas. Ask your child to show you what they are measuring.",
      "Use real objects: cans, boxes, plates, maps. Touching and measuring helps more than memorizing.",
      "Ask \"are we finding the distance around, or the space inside?\" This question clears up a lot of mix-ups.",
      "Let your child measure twice. Checking is part of the math.",
    ],
    es: [
      "No necesitan saber las fórmulas. Pídanle a su hijo o hija que les muestre qué está midiendo.",
      "Usen objetos reales: latas, cajas, platos, mapas. Tocar y medir ayuda más que memorizar.",
      "Pregunten \"¿estamos hallando la distancia alrededor o el espacio adentro?\". Esta pregunta aclara muchas confusiones.",
      "Dejen que mida dos veces. Revisar es parte de las matemáticas.",
    ],
  },
  home_language: {
    en: "Many of these words are almost the same in Spanish: radius (radio), diameter (diámetro), circumference (circunferencia), prism (prisma), volume (volumen), scale (escala). Name the parts of the can or box in Spanish and English as you measure.",
    es: "Muchas de estas palabras son casi iguales en inglés: radio (radius), diámetro (diameter), circunferencia (circumference), prisma (prism), volumen (volume), escala (scale). Nombren en español y en inglés las partes de la lata o de la caja mientras miden.",
  },
  celebrate: {
    en: "You will know it is working when your child can pick up a can or a box and tell you, in any language, what they would measure and why.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda tomar una lata o una caja y contarles, en el idioma que quiera, qué mediría y por qué.",
  },
};

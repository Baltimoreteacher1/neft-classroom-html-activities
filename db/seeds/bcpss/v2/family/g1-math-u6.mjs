// BCPSS Family Guide (EN/ES) — g1-math-u6. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 unit on shapes and equal shares. Vocabulary order matches ../units/g1-math-u6.mjs.

export default {
  summary: {
    en: "Your child is learning to name shapes by their sides and corners, and to cut shapes into halves and fourths. It matters when we share a sandwich, a pizza, or a sheet of paper. Your child will tell what a shape is and what it is not.",
    es: "Su hijo o hija está aprendiendo a nombrar figuras por sus lados y esquinas, y a cortar figuras en mitades y cuartos. Sirve cuando compartimos un sándwich, una pizza o una hoja de papel. Su hijo o hija dirá qué es una figura y qué no es.",
  },
  goals: {
    en: [
      "I can name shapes by their sides and corners.",
      "I can cut shapes into halves and fourths.",
      "I can tell what a shape is and what it is not.",
    ],
    es: [
      "Puedo nombrar figuras por sus lados y esquinas.",
      "Puedo cortar figuras en mitades y cuartos.",
      "Puedo decir qué es una figura y qué no es.",
    ],
  },
  vocab: [
    { term: "side", def_es: "una línea recta que es un borde de una figura plana", example_es: "Un triángulo tiene tres lados." },
    { term: "corner", def_es: "el lugar con punta donde se juntan dos lados; la esquina", example_es: "Un rectángulo tiene cuatro esquinas." },
    { term: "triangle", def_es: "una figura plana con 3 lados rectos y 3 esquinas", example_es: "Una rebanada de pizza tiene forma de triángulo." },
    { term: "rectangle", def_es: "una figura plana con 4 lados rectos y 4 esquinas cuadradas", example_es: "Mi cuaderno es un rectángulo." },
    { term: "circle", def_es: "una figura plana y redonda, sin lados y sin esquinas", example_es: "Una moneda tiene forma de círculo." },
    { term: "cube", def_es: "una figura sólida como un dado, con 6 caras cuadradas y planas", example_es: "Un dado es un cubo." },
    { term: "cone", def_es: "una figura sólida con una base redonda y plana y una punta arriba", example_es: "El cono de helado es un cono." },
    { term: "equal shares", def_es: "partes iguales: partes de un entero que son todas del mismo tamaño", example_es: "Corté la tortilla en dos partes iguales." },
    { term: "half", def_es: "la mitad: una de 2 partes iguales", example_es: "Me comí la mitad del sándwich." },
    { term: "fourth", def_es: "un cuarto: una de 4 partes iguales", example_es: "Cada uno de nosotros recibió un cuarto de la pizza." },
  ],
  talk: [
    { en: "What shape is this? How many sides and corners does it have?", es: "¿Qué figura es esta? ¿Cuántos lados y esquinas tiene?" },
    { en: "What shape is it not? How do you know?", es: "¿Qué figura no es? ¿Cómo lo sabes?" },
    { en: "Are the parts equal? How can we check?", es: "¿Las partes son iguales? ¿Cómo lo podemos comprobar?" },
    { en: "How many halves make a whole? How many fourths?", es: "¿Cuántas mitades forman un entero? ¿Cuántos cuartos?" },
    { en: "Where did you see shapes on our way today?", es: "¿Dónde viste figuras hoy en el camino?" },
  ],
  try_at_home: [
    {
      title: { en: "Shape Walk", es: "Paseo de figuras" },
      minutes: 10,
      materials: { en: "A walk to school, to the store, or around the block", es: "Una caminata a la escuela, a la tienda o por la cuadra" },
      steps: {
        en: [
          "Look for shapes: a stop sign, a window, a door, a wheel.",
          "Point to one. Ask: what shape is it? How many sides? How many corners?",
          "Ask: what is it not? A wheel is not a triangle because it has no sides.",
          "Find a solid shape too, like a ball, a box, or a cone-shaped cap.",
        ],
        es: [
          "Busquen figuras: una señal de alto, una ventana, una puerta, una rueda.",
          "Señalen una. Pregunten: ¿qué figura es? ¿Cuántos lados? ¿Cuántas esquinas?",
          "Pregunten: ¿qué no es? Una rueda no es un triángulo porque no tiene lados.",
          "Busquen también una figura sólida, como una pelota, una caja o un gorrito en forma de cono.",
        ],
      },
    },
    {
      title: { en: "Cut the Sandwich", es: "Cortar el sándwich" },
      minutes: 10,
      materials: { en: "A sandwich, a tortilla, or a piece of paper, and a safe knife or scissors", es: "Un sándwich, una tortilla o una hoja de papel, y un cuchillo seguro o tijeras" },
      steps: {
        en: [
          "Say: let's share this equally between 2 people. Cut it into 2 equal shares.",
          "Ask: are the parts the same size? Each part is a half.",
          "Now cut each half again to make 4 equal shares. Each part is a fourth.",
          "Ask: how many halves make a whole? How many fourths make a whole?",
        ],
        es: [
          "Digan: vamos a compartir esto en partes iguales entre 2 personas. Córtenlo en 2 partes iguales.",
          "Pregunten: ¿las partes son del mismo tamaño? Cada parte es una mitad.",
          "Ahora corten cada mitad otra vez para hacer 4 partes iguales. Cada parte es un cuarto.",
          "Pregunten: ¿cuántas mitades forman un entero? ¿Cuántos cuartos forman un entero?",
        ],
      },
    },
    {
      title: { en: "Fold and Cut Paper Shapes", es: "Doblar y cortar figuras de papel" },
      minutes: 15,
      materials: { en: "Paper, scissors, and a marker", es: "Papel, tijeras y un marcador" },
      steps: {
        en: [
          "Cut paper into a rectangle, a circle, and a triangle.",
          "Fold each shape in half. Do the edges match? If yes, they are equal shares.",
          "Fold again to make fourths. Color one fourth.",
          "Say: this is a [shape] cut into [number] equal shares.",
        ],
        es: [
          "Corten el papel en un rectángulo, un círculo y un triángulo.",
          "Doblen cada figura por la mitad. ¿Los bordes coinciden? Si coinciden, son partes iguales.",
          "Doblen otra vez para hacer cuartos. Pinten un cuarto.",
          "Digan: esto es un [figura] cortado en [número] partes iguales.",
        ],
      },
    },
    {
      title: { en: "Kitchen Solids", es: "Figuras sólidas de la cocina" },
      minutes: 10,
      materials: { en: "Safe things from home: a die or box (cube), an ice cream cone or party hat (cone), a ball", es: "Cosas seguras de la casa: un dado o una caja (cubo), un cono de helado o un gorro de fiesta (cono), una pelota" },
      steps: {
        en: [
          "Put the solid things on a table. Your child names each shape.",
          "Pick the cube. Count its flat squares. There are 6.",
          "Pick the cone. Ask: what does it have? A round flat bottom and one point on top.",
          "Ask: which shape is flat and which is solid?",
        ],
        es: [
          "Pongan las cosas sólidas en la mesa. Su hijo o hija nombra cada figura.",
          "Tomen el cubo. Cuenten sus cuadrados planos. Son 6.",
          "Tomen el cono. Pregunten: ¿qué tiene? Una base redonda y plana y una punta arriba.",
          "Pregunten: ¿cuál figura es plana y cuál es sólida?",
        ],
      },
    },
  ],
  say_it: [
    { en: "A [shape] is a flat shape that has [number] sides.", es: "Un [figura] es una figura plana que tiene [número] lados." },
    { en: "A [shape] is not a [shape] because it has [number] sides.", es: "Un [figura] no es un [figura] porque tiene [número] lados." },
    { en: "I cut the [thing] into [number] equal shares.", es: "Corté el [objeto] en [número] partes iguales." },
    { en: "Each share is one [half or fourth] of the whole.", es: "Cada parte es [una mitad o un cuarto] del entero." },
  ],
  help: {
    en: [
      "Name shapes at home and on the street, in any language.",
      "When you share food, ask \"are the pieces equal?\" and let your child decide.",
      "Ask \"what is it? What is it not?\" and listen. Both answers show thinking.",
      "Use real objects. Touching a cube or folding paper teaches more than a worksheet.",
    ],
    es: [
      "Nombren las figuras en la casa y en la calle, en cualquier idioma.",
      "Cuando compartan comida, pregunten \"¿los pedazos son iguales?\" y dejen que su hijo o hija decida.",
      "Pregunten \"¿qué es? ¿Qué no es?\" y escuchen. Las dos respuestas muestran cómo piensa.",
      "Usen objetos de verdad. Tocar un cubo o doblar papel enseña más que una hoja de trabajo.",
    ],
  },
  home_language: {
    en: "Name the shapes in Spanish and English side by side: \"triángulo, triangle\"; \"rectángulo, rectangle\"; \"círculo, circle\"; \"cubo, cube\"; \"cono, cone.\" Almost all are twins! Then practice \"mitad\" and \"half,\" and \"cuarto\" and \"fourth.\"",
    es: "Nombren las figuras en español y en inglés, una junto a la otra: \"triángulo, triangle\"; \"rectángulo, rectangle\"; \"círculo, circle\"; \"cubo, cube\"; \"cono, cone\". ¡Casi todas son gemelas! Luego practiquen \"mitad\" y \"half\", y \"cuarto\" y \"fourth\".",
  },
  celebrate: {
    en: "You will know it is working when your child names a shape, tells how many sides it has and what it is not, and cuts something into equal halves or fourths.",
    es: "Sabrán que está funcionando cuando su hijo o hija nombre una figura, diga cuántos lados tiene y qué no es, y corte algo en mitades o cuartos iguales.",
  },
};

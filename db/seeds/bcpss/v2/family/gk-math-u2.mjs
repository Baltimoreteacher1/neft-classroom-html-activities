// BCPSS Family Guide (EN/ES) — gk-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Kindergarten unit on comparing groups. Vocabulary order matches ../units/gk-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning to compare two groups of up to 10 things and tell which has more, fewer, or the same. It matters when two kids share crackers or when someone asks who has more toys. Your child will say how they know, using words and matching.",
    es: "Su hijo o hija está aprendiendo a comparar dos grupos de hasta 10 cosas y a decir cuál tiene más, menos o los mismos. Sirve cuando dos niños se reparten galletas o cuando alguien pregunta quién tiene más juguetes. Su hijo o hija dirá cómo lo sabe, con palabras y emparejando.",
  },
  goals: {
    en: [
      "I can compare two groups and tell which has more, fewer, or the same.",
      "I can say which group has more and tell how I know.",
    ],
    es: [
      "Puedo comparar dos grupos y decir cuál tiene más, menos o los mismos.",
      "Puedo decir cuál grupo tiene más y cómo lo sé.",
    ],
  },
  vocab: [
    { term: "compare", def_es: "mirar dos cosas para ver en qué se parecen y en qué son diferentes", example_es: "Voy a comparar mis carritos con los tuyos." },
    { term: "more", def_es: "una cantidad más grande de cosas", example_es: "Tengo más uvas que tú." },
    { term: "fewer", def_es: "una cantidad más pequeña de cosas que se pueden contar", example_es: "Hay menos zapatos en la caja azul." },
    { term: "same", def_es: "igual, sin ninguna diferencia", example_es: "Tenemos la misma cantidad de galletas." },
    { term: "equal", def_es: "que tiene exactamente la misma cantidad", example_es: "Los dos grupos son iguales: cinco y cinco." },
    { term: "greater than", def_es: "un número más grande que otro número", example_es: "El 8 es mayor que el 5." },
    { term: "less than", def_es: "un número más pequeño que otro número", example_es: "El 3 es menor que el 6." },
    { term: "match", def_es: "emparejar una cosa con otra cosa, una por una", example_es: "Emparejé cada taza con un plato." },
    { term: "most", def_es: "la cantidad más grande entre tres grupos o más", example_es: "El grupo rojo tiene la mayor cantidad." },
  ],
  talk: [
    { en: "Which group has more? How do you know?", es: "¿Cuál grupo tiene más? ¿Cómo lo sabes?" },
    { en: "Which group has fewer? Show me.", es: "¿Cuál grupo tiene menos? Muéstrame." },
    { en: "Can you match each one to one? What is left over?", es: "¿Puedes emparejar cada uno con otro? ¿Qué sobra?" },
    { en: "Are there groups that are the same? How can we check?", es: "¿Hay grupos que tienen lo mismo? ¿Cómo lo podemos comprobar?" },
    { en: "When do we need to know who has more?", es: "¿Cuándo necesitamos saber quién tiene más?" },
  ],
  try_at_home: [
    {
      title: { en: "Cup and Spoon Match", es: "Taza y cuchara" },
      minutes: 5,
      materials: { en: "Cups and spoons (or any two kinds of kitchen things)", es: "Tazas y cucharas (o dos tipos de cosas de la cocina)" },
      steps: {
        en: [
          "Put out a group of cups and a group of spoons. Make the groups different sizes.",
          "Ask your child to put one spoon in each cup. Ask: what is left over?",
          "Ask: are there more cups or more spoons? How do you know?",
          "Add or take away one. Match again. Now are they the same?",
        ],
        es: [
          "Pongan un grupo de tazas y un grupo de cucharas. Que los grupos sean de distinto tamaño.",
          "Pidan a su hijo o hija que ponga una cuchara en cada taza. Pregunten: ¿qué sobra?",
          "Pregunten: ¿hay más tazas o más cucharas? ¿Cómo lo sabes?",
          "Agreguen o quiten una. Emparejen otra vez. ¿Ahora son iguales?",
        ],
      },
    },
    {
      title: { en: "Who Has More Snacks?", es: "¿Quién tiene más merienda?" },
      minutes: 10,
      materials: { en: "Two plates and 10 to 20 crackers, grapes, or cereal pieces", es: "Dos platos y de 10 a 20 galletas, uvas o piezas de cereal" },
      steps: {
        en: [
          "Put some snacks on each plate. Keep each plate at 10 or fewer.",
          "Ask your child to line the snacks up in two rows, one under the other.",
          "Ask: which plate has more? Which has fewer? Or are they the same?",
          "Let your child fix the plates so they have the same. Then eat and enjoy!",
        ],
        es: [
          "Pongan meriendas en cada plato. Que cada plato tenga 10 o menos.",
          "Pidan a su hijo o hija que ponga las meriendas en dos filas, una debajo de la otra.",
          "Pregunten: ¿cuál plato tiene más? ¿Cuál tiene menos? ¿O tienen lo mismo?",
          "Dejen que su hijo o hija arregle los platos para que tengan igual. ¡Luego a comer!",
        ],
      },
    },
    {
      title: { en: "Toy Parking Lot", es: "El estacionamiento de juguetes" },
      minutes: 10,
      materials: { en: "Toy cars or blocks, and two or three boxes or paper plates", es: "Carritos o bloques de juguete, y dos o tres cajas o platos de papel" },
      steps: {
        en: [
          "Put a different number of cars in each box.",
          "Count each box together. Say the numbers out loud.",
          "Ask: which box has the most? Which has the fewest?",
          "Move one car from the biggest box to the smallest. Ask: what changed?",
        ],
        es: [
          "Pongan una cantidad distinta de carritos en cada caja.",
          "Cuenten cada caja juntos. Digan los números en voz alta.",
          "Pregunten: ¿cuál caja tiene la mayor cantidad? ¿Cuál tiene la menor?",
          "Pasen un carrito de la caja más grande a la más pequeña. Pregunten: ¿qué cambió?",
        ],
      },
    },
    {
      title: { en: "Bigger Number Card Game", es: "Juego de la carta más grande" },
      minutes: 10,
      materials: { en: "A deck of cards with the faces taken out (ace to 10), or paper squares numbered 1 to 10", es: "Una baraja sin las figuras (del as al 10), o cuadritos de papel con números del 1 al 10" },
      steps: {
        en: [
          "Each player turns over one card. Count the pictures on the cards.",
          "Ask: whose number is greater? Whose is less?",
          "The player with the greater number takes both cards.",
          "If the cards are equal, say \"same!\" and turn over two more cards.",
        ],
        es: [
          "Cada jugador voltea una carta. Cuenten los dibujos de las cartas.",
          "Pregunten: ¿de quién es el número mayor? ¿De quién es el menor?",
          "El jugador con el número mayor se lleva las dos cartas.",
          "Si las cartas son iguales, digan \"¡igual!\" y volteen dos cartas más.",
        ],
      },
    },
  ],
  say_it: [
    { en: "[Red] has more.", es: "[Rojo] tiene más." },
    { en: "[Blue] has fewer [things].", es: "[Azul] tiene menos [cosas]." },
    { en: "[Red] and [blue] are the same.", es: "[Rojo] y [azul] tienen lo mismo." },
    { en: "I matched each [thing] to one [thing], and [number] had no partner.", es: "Emparejé cada [cosa] con otra [cosa], y [número] se quedó sin pareja." },
  ],
  help: {
    en: [
      "Ask \"more, fewer, or the same?\" about everyday things. Do it at meals, at the store, or on the bus.",
      "Say \"show me\" and \"how do you know?\" in any language. Let your child teach you.",
      "Let your child line things up side by side. Seeing the extra ones is how the idea becomes clear.",
      "If there is a mistake, say \"count again together.\" Counting twice is a good habit.",
    ],
    es: [
      "Pregunten \"¿más, menos o igual?\" sobre cosas de todos los días. Háganlo en las comidas, en la tienda o en el autobús.",
      "Digan \"muéstrame\" y \"¿cómo lo sabes?\" en cualquier idioma. Dejen que su hijo o hija les enseñe.",
      "Dejen que su hijo o hija ponga las cosas en fila, una al lado de otra. Ver las que sobran ayuda a entender la idea.",
      "Si hay un error, digan \"contemos otra vez juntos\". Contar dos veces es un buen hábito.",
    ],
  },
  home_language: {
    en: "Play the comparing game in Spanish first: \"más, menos, igual.\" Then say the English words: \"more, fewer, same.\" Notice that \"igual\" and \"equal\" sound alike, and \"comparar\" and \"compare\" are twins.",
    es: "Jueguen primero a comparar en español: \"más, menos, igual\". Después digan las palabras en inglés: \"more, fewer, same\". Noten que \"igual\" y \"equal\" suenan parecido, y que \"comparar\" y \"compare\" son gemelas.",
  },
  celebrate: {
    en: "You will know it is working when your child looks at two small groups and tells you which has more, fewer, or the same, and shows how they know.",
    es: "Sabrán que está funcionando cuando su hijo o hija mire dos grupos pequeños y les diga cuál tiene más, menos o lo mismo, y muestre cómo lo sabe.",
  },
};

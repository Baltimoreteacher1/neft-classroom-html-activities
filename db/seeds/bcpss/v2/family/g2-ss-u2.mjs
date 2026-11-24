// BCPSS Family Guide (EN/ES) — g2-ss-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 2 Social Studies unit on urban, suburban and rural places. Vocabulary order matches ../units/g2-ss-u2.mjs.

export default {
  summary: {
    en: "Your child is learning how a big city, a suburb, and a farm town are alike and different. Children compare the buildings, the land, and how people get around, like buses in Baltimore or tractors on a Maryland farm. It matters because every family lives in a place, and comparing places helps us understand our own.",
    es: "Su hijo o hija está aprendiendo en qué se parecen y en qué se diferencian una ciudad grande, un suburbio y un pueblo de granjas. Los niños comparan los edificios, la tierra y cómo se mueve la gente, como los autobuses en Baltimore o los tractores en una granja de Maryland. Es importante porque cada familia vive en un lugar, y comparar lugares nos ayuda a entender el nuestro.",
  },
  goals: {
    en: [
      "I can tell what urban, suburban, and rural places are like.",
      "I can tell how people get around in each place.",
      "I can compare two places and say how they are alike and different.",
    ],
    es: [
      "Puedo decir cómo son los lugares urbanos, suburbanos y rurales.",
      "Puedo decir cómo se mueve la gente en cada lugar.",
      "Puedo comparar dos lugares y decir en qué se parecen y en qué se diferencian.",
    ],
  },
  vocab: [
    { term: "urban", def_es: "de una ciudad grande y ocupada, con muchos edificios y personas; se parece a \"urbano\"", example_es: "Baltimore es un lugar urbano con edificios altos y autobuses." },
    { term: "suburban", def_es: "de un pueblo con casas, patios y tiendas cerca de una ciudad grande; se parece a \"suburbano\"", example_es: "Muchas familias suburbanas viven en casas con patio." },
    { term: "rural", def_es: "del campo, con granjas y mucha tierra abierta; se escribe igual en español", example_es: "Los caminos rurales de Maryland pasan junto a campos de maíz y graneros." },
    { term: "transportation", def_es: "las maneras en que las personas y las cosas van de un lugar a otro", example_es: "Los autobuses y los trenes son transporte en Baltimore." },
    { term: "farm", def_es: "terreno donde la gente cultiva comida y cría animales", example_es: "En una granja de Maryland, los trabajadores recogen maíz y tomates." },
    { term: "crop", def_es: "una planta que los agricultores cultivan para comer o usar", example_es: "El maíz es un cultivo que crece bien en las granjas de Maryland." },
    { term: "traffic", def_es: "todos los carros, autobuses y camiones que se mueven por una calle", example_es: "Hay mucho tráfico en la calle a la hora de salida." },
    { term: "rowhouse", def_es: "una casa que comparte las paredes de los lados con las casas vecinas", example_es: "Muchas familias de Baltimore viven en una casa de ladrillo en hilera." },
    { term: "compare", def_es: "decir en qué se parecen y en qué se diferencian dos cosas; se parece a \"comparar\"", example_es: "Comparamos una ciudad y una granja para ver qué es igual." },
  ],
  talk: [
    { en: "Do we live in an urban, suburban, or rural place? How do you know?", es: "¿Vivimos en un lugar urbano, suburbano o rural? ¿Cómo lo sabes?" },
    { en: "How do people get around here? How is it different in a farm town?", es: "¿Cómo se mueve la gente por aquí? ¿En qué es diferente en un pueblo de granjas?" },
    { en: "What is the same in a city and on a farm? What is different?", es: "¿Qué es igual en una ciudad y en una granja? ¿Qué es diferente?" },
    { en: "Where does our food come from? Who grows it?", es: "¿De dónde viene nuestra comida? ¿Quién la cultiva?" },
    { en: "What is the place where you or our family came from like? Tell me about it.", es: "¿Cómo es el lugar de donde vinieron ustedes o nuestra familia? Cuéntame de él." },
  ],
  try_at_home: [
    {
      title: { en: "Traffic Count", es: "Contar el tráfico" },
      minutes: 10,
      materials: { en: "A window or a bus stop, paper, a pencil", es: "Una ventana o una parada de autobús, papel, un lápiz" },
      steps: {
        en: [
          "Sit near a window or stop where you can see the street for 5 minutes.",
          "Make tally marks: one line for every car, bus, bike, or truck that goes by.",
          "Count each kind. Ask: which kind of transportation is the most? Is there a lot of traffic?",
          "Ask: what would this street look like on a farm road? How would it change?",
        ],
        es: [
          "Siéntense cerca de una ventana o de una parada donde vean la calle por 5 minutos.",
          "Hagan rayitas: una raya por cada carro, autobús, bicicleta o camión que pase.",
          "Cuenten cada tipo. Pregunten: ¿qué transporte pasa más? ¿Hay mucho tráfico?",
          "Pregunten: ¿cómo se vería esta calle en un camino de granja? ¿Qué cambiaría?",
        ],
      },
    },
    {
      title: { en: "Where Does Our Food Grow?", es: "¿Dónde crece nuestra comida?" },
      minutes: 15,
      materials: { en: "Food from the kitchen or the store, paper, a pencil", es: "Comida de la cocina o de la tienda, papel, un lápiz" },
      steps: {
        en: [
          "Pick 3 foods, like corn, tomatoes, or milk. Read the label or ask: where did this come from?",
          "Ask: is this a crop? Does it grow on a farm? Who works there?",
          "Draw a line from the farm to your table. What is the transportation along the way: truck, train, boat?",
          "Ask: how does the food get to the city?",
        ],
        es: [
          "Escojan 3 alimentos, como maíz, tomates o leche. Lean la etiqueta o pregunten: ¿de dónde viene esto?",
          "Pregunten: ¿es un cultivo? ¿Crece en una granja? ¿Quién trabaja allí?",
          "Dibujen una línea desde la granja hasta su mesa. ¿Qué transporte hay en el camino: camión, tren, barco?",
          "Pregunten: ¿cómo llega la comida a la ciudad?",
        ],
      },
    },
    {
      title: { en: "Two Places Chart", es: "Cuadro de dos lugares" },
      minutes: 15,
      materials: { en: "Paper folded in three columns, a pencil", es: "Papel doblado en tres columnas, un lápiz" },
      steps: {
        en: [
          "Pick two places: your block and a farm, or a city and a suburb. Write one name at the top of each side.",
          "In the middle column, write things that are the same, like homes, stores, and schools.",
          "On each side, write or draw what is different, like rowhouses or barns, buses or tractors.",
          "Use the word compare. Your child tells you one way the places are alike and one way they are different.",
        ],
        es: [
          "Escojan dos lugares: su cuadra y una granja, o una ciudad y un suburbio. Escriban un nombre arriba de cada lado.",
          "En la columna del medio, escriban lo que es igual, como casas, tiendas y escuelas.",
          "A cada lado, escriban o dibujen lo que es diferente, como casas en hilera o graneros, autobuses o tractores.",
          "Usen la palabra comparar. Su hijo o hija dice una manera en que los lugares se parecen y una en que se diferencian.",
        ],
      },
    },
    {
      title: { en: "Rowhouse Walk", es: "Paseo por las casas en hilera" },
      minutes: 15,
      materials: { en: "A walk around the block or a trip on the bus", es: "Una caminata por la cuadra o un viaje en autobús" },
      steps: {
        en: [
          "Look at the buildings. Can you find a rowhouse? How do you know?",
          "Ask: what do the houses share? What is different, like the doors, steps, or colors?",
          "Look for signs of an urban place: lots of people, stores, buses, tall buildings.",
          "Back home, draw your favorite building and tell your child what it is like where you grew up.",
        ],
        es: [
          "Miren los edificios. ¿Encuentran una casa en hilera? ¿Cómo lo saben?",
          "Pregunten: ¿qué comparten las casas? ¿Qué es diferente, como las puertas, los escalones o los colores?",
          "Busquen señales de un lugar urbano: muchas personas, tiendas, autobuses, edificios altos.",
          "De regreso en casa, dibujen su edificio favorito y cuéntenle a su hijo o hija cómo era el lugar donde crecieron.",
        ],
      },
    },
  ],
  say_it: [
    { en: "Both places have [thing].", es: "Los dos lugares tienen [cosa]." },
    { en: "A city has [thing]. A farm has [thing].", es: "Una ciudad tiene [cosa]. Una granja tiene [cosa]." },
    { en: "I see a [thing] in the [place].", es: "Veo un [cosa] en el [lugar]." },
    { en: "People get around by ___.", es: "La gente se mueve en ___." },
  ],
  help: {
    en: [
      "Talk about the places you know: where you live now and where you have lived or visited. Your child can compare them.",
      "Ask \"how are they alike?\" and \"how are they different?\" in any language.",
      "Look at the street, the bus, and the food in your kitchen together. Real things teach well.",
      "If your child is stuck, point to one thing and ask: is it in a city, a suburb, or on a farm?",
    ],
    es: [
      "Hablen de los lugares que conocen: donde viven ahora y donde han vivido o visitado. Su hijo o hija puede compararlos.",
      "Pregunten \"¿en qué se parecen?\" y \"¿en qué se diferencian?\" en cualquier idioma.",
      "Miren juntos la calle, el autobús y la comida de su cocina. Las cosas de verdad enseñan muy bien.",
      "Si su hijo o hija se atora, señalen una cosa y pregunten: ¿está en una ciudad, en un suburbio o en una granja?",
    ],
  },
  home_language: {
    en: "Look for cognates: \"urbano\" and \"urban,\" \"rural\" and \"rural,\" \"transporte\" and \"transportation,\" \"comparar\" and \"compare,\" \"tráfico\" and \"traffic.\" Describe a place you know in Spanish first, then ask your child to describe it in English.",
    es: "Busquen palabras parecidas: \"urbano\" y \"urban\", \"rural\" y \"rural\", \"transporte\" y \"transportation\", \"comparar\" y \"compare\", \"tráfico\" y \"traffic\". Describan primero en español un lugar que conocen y luego pídanle a su hijo o hija que lo describa en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child compares two places and tells you one way they are alike and one way they are different.",
    es: "Sabrán que está funcionando cuando su hijo o hija compare dos lugares y les diga una manera en que se parecen y una en que se diferencian.",
  },
};

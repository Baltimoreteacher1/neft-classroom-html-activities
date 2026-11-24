// BCPSS Family Guide (EN/ES) — g1-ss-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 Social Studies unit on maps and Maryland. Vocabulary order matches ../units/g1-ss-u2.mjs.

export default {
  summary: {
    en: "Your child is learning how a map helps us tell where places are. Children use the compass rose to find north, south, east, and west, and the map key to read the pictures on a map of Maryland. It matters every time we find the park, the corner store, or the way to the Chesapeake Bay.",
    es: "Su hijo o hija está aprendiendo cómo un mapa nos ayuda a decir dónde están los lugares. Los niños usan la rosa de los vientos para encontrar el norte, el sur, el este y el oeste, y la clave del mapa para leer los dibujos en un mapa de Maryland. Sirve cada vez que buscamos el parque, la tienda de la esquina o el camino a la bahía de Chesapeake.",
  },
  goals: {
    en: [
      "I can use a compass rose to find north, south, east, and west.",
      "I can use a map key to read what the pictures on a map mean.",
      "I can tell where a place is on a map of Maryland.",
    ],
    es: [
      "Puedo usar la rosa de los vientos para encontrar el norte, el sur, el este y el oeste.",
      "Puedo usar la clave del mapa para leer lo que significan los dibujos.",
      "Puedo decir dónde está un lugar en un mapa de Maryland.",
    ],
  },
  vocab: [
    { term: "map", def_es: "un dibujo de un lugar, como si lo miraras desde arriba", example_es: "Usamos un mapa para encontrar el parque." },
    { term: "compass rose", def_es: "un dibujo en el mapa que muestra las cuatro direcciones; parece una estrella", example_es: "La rosa de los vientos está en la esquina del mapa." },
    { term: "north", def_es: "la dirección hacia la parte de arriba de casi todos los mapas", example_es: "Pensilvania está al norte de Maryland." },
    { term: "south", def_es: "la dirección hacia la parte de abajo de casi todos los mapas", example_es: "Virginia está al sur de Maryland." },
    { term: "east", def_es: "la dirección hacia la derecha en casi todos los mapas, por donde sale el sol", example_es: "El sol sale por el este." },
    { term: "west", def_es: "la dirección hacia la izquierda en casi todos los mapas, por donde se pone el sol", example_es: "Las montañas están al oeste de Maryland." },
    { term: "map key", def_es: "una cajita que dice qué significa cada dibujo del mapa; \"clave\" es como una pista para leer el mapa", example_es: "La clave del mapa muestra una estrella para la ciudad capital." },
    { term: "location", def_es: "el lugar donde se puede encontrar algo; se parece a \"ubicación\"", example_es: "La ubicación de nuestra escuela es una calle con mucho tráfico." },
    { term: "feature", def_es: "una parte importante de la tierra, como un río o una montaña", example_es: "Una montaña es una característica del oeste de Maryland." },
    { term: "bay", def_es: "una parte del mar que entra en la tierra, como una curva", example_es: "Los barcos entran a la bahía de Chesapeake cerca de Baltimore." },
  ],
  talk: [
    { en: "Where is our home on this map? How do you know?", es: "¿Dónde está nuestra casa en este mapa? ¿Cómo lo sabes?" },
    { en: "Which way is north? Which way is south?", es: "¿Hacia dónde queda el norte? ¿Y el sur?" },
    { en: "What does this picture on the map mean? Where is the key?", es: "¿Qué quiere decir este dibujo del mapa? ¿Dónde está la clave?" },
    { en: "Is the park north, south, east, or west of our house?", es: "¿El parque queda al norte, al sur, al este o al oeste de nuestra casa?" },
    { en: "What places have you seen on a map or on a trip? Tell me about one.", es: "¿Qué lugares has visto en un mapa o en un viaje? Cuéntame de uno." },
  ],
  try_at_home: [
    {
      title: { en: "Map of Our Home", es: "Mapa de nuestra casa" },
      minutes: 15,
      materials: { en: "Paper, a pencil or crayons", es: "Papel, un lápiz o crayones" },
      steps: {
        en: [
          "Ask your child to draw the rooms of your home as if looking down from the ceiling.",
          "Draw a small box in the corner. Make a key: a picture for the bed, the table, and the door.",
          "Ask: where is the kitchen? Use words like next to, near, and far.",
          "Your child tells you how to walk from the door to the kitchen using the map.",
        ],
        es: [
          "Pidan a su hijo o hija que dibuje los cuartos de la casa como si los mirara desde el techo.",
          "Dibujen una cajita en una esquina. Hagan una clave: un dibujo para la cama, la mesa y la puerta.",
          "Pregunten: ¿dónde está la cocina? Usen palabras como al lado, cerca y lejos.",
          "Su hijo o hija les dice cómo caminar desde la puerta hasta la cocina usando el mapa.",
        ],
      },
    },
    {
      title: { en: "Find the Sun", es: "Buscar el sol" },
      minutes: 10,
      materials: { en: "A sunny morning or evening, a window or a yard", es: "Una mañana o tarde con sol, una ventana o un patio" },
      steps: {
        en: [
          "Look outside in the morning. Point to where the sun comes up. That is east.",
          "Look again in the evening. Point to where the sun goes down. That is west.",
          "Stand with your right arm toward east. Which way is north in front of you? Which is south?",
          "Make a paper sign for each direction and put them on four walls of a room.",
        ],
        es: [
          "Miren afuera por la mañana. Señalen por dónde sale el sol. Ese es el este.",
          "Miren otra vez por la tarde. Señalen por dónde se pone el sol. Ese es el oeste.",
          "Párense con el brazo derecho hacia el este. ¿Hacia dónde queda el norte enfrente de ustedes? ¿Y el sur?",
          "Hagan un letrero de papel para cada dirección y péguenlo en las cuatro paredes de un cuarto.",
        ],
      },
    },
    {
      title: { en: "Treasure Hunt with Directions", es: "Búsqueda del tesoro con direcciones" },
      minutes: 15,
      materials: { en: "A small object to hide, like a toy or a spoon", es: "Un objeto pequeño para esconder, como un juguete o una cuchara" },
      steps: {
        en: [
          "Hide a small object in the room while your child is not looking.",
          "Give clues with directions: walk to the north wall, then two steps east.",
          "Your child follows the clues to find the treasure.",
          "Switch. Your child hides it and gives you clues. Check the directions together.",
        ],
        es: [
          "Escondan un objeto pequeño en el cuarto mientras su hijo o hija no mira.",
          "Den pistas con direcciones: camina hasta la pared del norte y luego dos pasos al este.",
          "Su hijo o hija sigue las pistas para encontrar el tesoro.",
          "Cambien de papel. Su hijo o hija lo esconde y les da pistas. Revisen las direcciones juntos.",
        ],
      },
    },
    {
      title: { en: "Look at a Real Map", es: "Mirar un mapa de verdad" },
      minutes: 10,
      materials: { en: "Any map: a bus map, a city map, a phone map, or a map in a book", es: "Cualquier mapa: de autobuses, de la ciudad, de un teléfono o de un libro" },
      steps: {
        en: [
          "Look at the map together. Ask your child to find the compass rose and the map key.",
          "Ask: what do these pictures mean? Find one thing on the map that you know, like a park or a school.",
          "Find water on the map. Is it a river or a bay? Which way is it from the place you picked?",
          "Ask your child to pick a place to go and tell you which direction it is.",
        ],
        es: [
          "Miren el mapa juntos. Pidan a su hijo o hija que encuentre la rosa de los vientos y la clave del mapa.",
          "Pregunten: ¿qué significan estos dibujos? Busquen algo en el mapa que ya conozcan, como un parque o una escuela.",
          "Busquen el agua en el mapa. ¿Es un río o una bahía? ¿Hacia qué dirección queda desde el lugar que escogieron?",
          "Pidan a su hijo o hija que escoja un lugar para ir y les diga en qué dirección queda.",
        ],
      },
    },
  ],
  say_it: [
    { en: "I see a [feature].", es: "Veo un [lugar o característica]." },
    { en: "It is [north / south / east / west] of ___.", es: "Queda al [norte / sur / este / oeste] de ___." },
    { en: "The map shows [place].", es: "El mapa muestra [lugar]." },
    { en: "The key tells me that [picture] means ___.", es: "La clave me dice que [dibujo] quiere decir ___." },
  ],
  help: {
    en: [
      "Look at maps together: on a phone, on the bus, or on a trip. Let your child be the guide.",
      "Ask \"how do you know?\" and \"show me on the map.\" You do not need to read English to listen.",
      "Share places you have lived or visited. Your family's places belong on the map, too.",
      "If your child gets mixed up, start with the sun: it comes up in the east.",
    ],
    es: [
      "Miren mapas juntos: en un teléfono, en el autobús o en un viaje. Dejen que su hijo o hija sea el guía.",
      "Pregunten \"¿cómo lo sabes?\" y \"muéstrame en el mapa\". No necesitan leer inglés para escuchar.",
      "Cuenten de los lugares donde han vivido o que han visitado. Los lugares de su familia también tienen un lugar en el mapa.",
      "Si su hijo o hija se confunde, empiecen con el sol: sale por el este.",
    ],
  },
  home_language: {
    en: "Say the four directions in Spanish and English: \"norte, sur, este, oeste\" and \"north, south, east, west.\" Notice that \"norte\" and \"north\" sound alike, and \"mapa\" and \"map\" are almost twins. Tell your child a story in Spanish about a place you know, then find it on a map together.",
    es: "Digan las cuatro direcciones en español y en inglés: \"norte, sur, este, oeste\" y \"north, south, east, west\". Noten que \"norte\" y \"north\" suenan parecido, y que \"mapa\" y \"map\" son casi gemelas. Cuéntenle a su hijo o hija una historia en español sobre un lugar que conocen y luego búsquenlo juntos en un mapa.",
  },
  celebrate: {
    en: "You will know it is working when your child looks at a map, finds a direction or a symbol, and tells you where a place is.",
    es: "Sabrán que está funcionando cuando su hijo o hija mire un mapa, encuentre una dirección o un símbolo y les diga dónde queda un lugar.",
  },
};

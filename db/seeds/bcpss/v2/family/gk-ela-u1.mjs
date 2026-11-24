// BCPSS Family Guide (EN/ES) — gk-ela-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Kindergarten ELA unit on the five senses. Vocabulary order matches ../units/gk-ela-u1.mjs.

export default {
  summary: {
    en: "Your child is learning about the five senses: seeing, hearing, smelling, tasting, and touching. In books, we listen for what the book is mostly about and for two small details. It matters every time we smell dinner cooking, hear a bus coming, or feel a soft blanket. Your child will practice telling you what they notice.",
    es: "Su hijo o hija está aprendiendo sobre los cinco sentidos: ver, oír, oler, probar y tocar. En los libros escuchamos de qué trata el libro y dos detalles pequeños. Sirve cada vez que olemos la comida que se cocina, oímos que llega el autobús o sentimos una cobija suave. Su hijo o hija practicará contarles lo que nota.",
  },
  goals: {
    en: [
      "I can name the five senses and the body part for each one.",
      "I can tell what a book is mostly about and share two details.",
    ],
    es: [
      "Puedo nombrar los cinco sentidos y la parte del cuerpo de cada uno.",
      "Puedo decir de qué trata un libro y contar dos detalles.",
    ],
  },
  vocab: [
    { term: "sense", def_es: "una manera en que tu cuerpo aprende sobre el mundo; tenemos cinco", example_es: "Oler es uno de los cinco sentidos." },
    { term: "see", def_es: "saber qué hay con los ojos", example_es: "Veo una manzana roja." },
    { term: "hear", def_es: "recibir los sonidos con los oídos", example_es: "Oigo un tambor en la calle." },
    { term: "smell", def_es: "darte cuenta de un olor con la nariz", example_es: "Huelo pan caliente." },
    { term: "taste", def_es: "conocer un sabor con la lengua", example_es: "Pruebo un limón agrio." },
    { term: "touch", def_es: "sentir algo con la piel o las manos", example_es: "Toco la cobija suave." },
    { term: "observe", def_es: "mirar con mucho cuidado para aprender algo", example_es: "Observo la hormiga con mucha atención." },
    { term: "detail", def_es: "un dato pequeño, como un color o un sonido", example_es: "Un detalle del dibujo es que el globo es azul." },
    { term: "loud", def_es: "un sonido muy grande que se oye fácil", example_es: "El tambor suena muy fuerte." },
    { term: "sweet", def_es: "un sabor como el del azúcar o la miel", example_es: "La fresa está dulce." },
  ],
  talk: [
    { en: "What did you see, hear, or smell today? Tell me about it.", es: "¿Qué viste, oíste u hueles hoy? Cuéntame." },
    { en: "Which body part did you use? Point to it.", es: "¿Qué parte del cuerpo usaste? Señálala." },
    { en: "What was the book mostly about?", es: "¿De qué trataba mayormente el libro?" },
    { en: "Can you tell me two details from the book?", es: "¿Me puedes decir dos detalles del libro?" },
    { en: "What is the loudest sound you hear at home?", es: "¿Cuál es el sonido más fuerte que oyes en la casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Five Senses Walk", es: "Paseo de los cinco sentidos" },
      minutes: 10,
      materials: { en: "A short walk outside or a look around the kitchen", es: "Una caminata corta afuera o una mirada por la cocina" },
      steps: {
        en: [
          "Stop and say: what do you see? Let your child name one thing, in any language.",
          "Stop again: what do you hear? What do you smell?",
          "Ask your child to point to the body part for each sense: eyes, ears, nose.",
          "Ask: which sense was the busiest today?",
        ],
        es: [
          "Deténganse y digan: ¿qué ves? Dejen que su hijo o hija nombre una cosa, en el idioma que quiera.",
          "Deténganse otra vez: ¿qué oyes? ¿Qué hueles?",
          "Pidan a su hijo o hija que señale la parte del cuerpo de cada sentido: ojos, oídos, nariz.",
          "Pregunten: ¿qué sentido trabajó más hoy?",
        ],
      },
    },
    {
      title: { en: "Mystery Bag", es: "La bolsa misteriosa" },
      minutes: 10,
      materials: { en: "A paper bag and small safe things: a sock, a spoon, a toy, a leaf", es: "Una bolsa de papel y cosas pequeñas y seguras: un calcetín, una cuchara, un juguete, una hoja" },
      steps: {
        en: [
          "Put one thing in the bag. Your child reaches in without looking.",
          "Ask: what do you feel? Is it soft or hard? Let your child give two details.",
          "Your child guesses what it is, then takes it out to check.",
          "Switch. Your child hides something and you guess from their clues.",
        ],
        es: [
          "Pongan una cosa en la bolsa. Su hijo o hija mete la mano sin mirar.",
          "Pregunten: ¿qué sientes? ¿Es suave o duro? Dejen que dé dos detalles.",
          "Su hijo o hija adivina qué es y luego la saca para comprobar.",
          "Cambien de turno. Su hijo o hija esconde algo y ustedes adivinan con sus pistas.",
        ],
      },
    },
    {
      title: { en: "Smell and Taste Test", es: "Prueba de olores y sabores" },
      minutes: 10,
      materials: { en: "A few foods from the kitchen: a lemon slice, a banana, a cracker, a raisin", es: "Algunos alimentos de la cocina: una rodaja de limón, un plátano, una galleta, una pasa" },
      steps: {
        en: [
          "Close your eyes. Smell one food. Ask: what do you smell?",
          "Taste a small bite. Ask: is it sweet, sour, or salty?",
          "Say the sense out loud: \"I smell with my nose. I taste with my tongue.\"",
          "Pick a favorite and tell why.",
        ],
        es: [
          "Cierren los ojos. Huelan un alimento. Pregunten: ¿qué hueles?",
          "Prueben un bocado pequeño. Pregunten: ¿es dulce, agrio o salado?",
          "Digan el sentido en voz alta: \"Huelo con la nariz. Pruebo con la lengua\".",
          "Elijan un favorito y cuenten por qué.",
        ],
      },
    },
    {
      title: { en: "Sound Hunt", es: "Cacería de sonidos" },
      minutes: 5,
      materials: { en: "Your ears and a quiet minute", es: "Sus oídos y un minuto de silencio" },
      steps: {
        en: [
          "Sit still for one minute and listen. Do not talk.",
          "Each person shares one sound: a car, a fan, a bird, a neighbor.",
          "Ask: was it loud or soft? Where did it come from?",
        ],
        es: [
          "Siéntense quietos un minuto y escuchen. No hablen.",
          "Cada persona comparte un sonido: un carro, un ventilador, un pájaro, un vecino.",
          "Pregunten: ¿fue fuerte o suave? ¿De dónde venía?",
        ],
      },
    },
  ],
  say_it: [
    { en: "I [see / hear / smell] a [thing].", es: "Yo [veo / oigo / huelo] un [cosa]." },
    { en: "I use my [eyes / ears / nose] to [see / hear / smell].", es: "Uso mis [ojos / oídos / nariz] para [ver / oír / oler]." },
    { en: "This book is mostly about [topic].", es: "Este libro trata mayormente de [tema]." },
    { en: "One detail is ___ and another detail is ___.", es: "Un detalle es ___ y otro detalle es ___." },
  ],
  help: {
    en: [
      "Read or look at a picture book together. Let your child tell the story from the pictures, in any language.",
      "Ask \"what do you see?\" and \"what do you hear?\" You do not need to know English to ask.",
      "Wait. Give your child a few seconds to think before you help.",
      "Praise the effort: \"You noticed a detail!\"",
    ],
    es: [
      "Lean o miren juntos un libro de dibujos. Dejen que su hijo o hija cuente la historia con las imágenes, en el idioma que quiera.",
      "Pregunten \"¿qué ves?\" y \"¿qué oyes?\". No necesitan saber inglés para preguntar.",
      "Esperen. Den a su hijo o hija unos segundos para pensar antes de ayudar.",
      "Celebren el esfuerzo: \"¡Notaste un detalle!\".",
    ],
  },
  home_language: {
    en: "Name the five senses in Spanish first: ver, oír, oler, probar, tocar. Then say them in English: see, hear, smell, taste, touch. Ask your child which words sound alike, like \"sentido\" and \"sense.\"",
    es: "Nombren primero los cinco sentidos en español: ver, oír, oler, probar, tocar. Después díganlos en inglés: see, hear, smell, taste, touch. Pregunten a su hijo o hija qué palabras suenan parecidas, como \"sentido\" y \"sense\".",
  },
  celebrate: {
    en: "You will know it is working when your child names a sense and the body part that goes with it, and tells you one or two details about what they noticed.",
    es: "Sabrán que está funcionando cuando su hijo o hija nombre un sentido y la parte del cuerpo que le corresponde, y les cuente uno o dos detalles de lo que notó.",
  },
};

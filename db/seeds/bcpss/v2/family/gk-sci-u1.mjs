// BCPSS Family Guide (EN/ES) — gk-sci-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Kindergarten Science unit on the sun, weather and patterns. Vocabulary order matches ../units/gk-sci-u1.mjs.

export default {
  summary: {
    en: "Your child is learning how the sun warms the ground and changes the weather. Children notice the sky each day, feel what is warm and what is in the shade, and look for patterns like sunny days and rainy days. It matters every time we choose a coat, a hat, or where to play outside.",
    es: "Su hijo o hija está aprendiendo cómo el sol calienta el suelo y cambia el tiempo. Los niños observan el cielo cada día, sienten qué está tibio y qué está en la sombra, y buscan patrones como los días de sol y los días de lluvia. Sirve cada vez que escogemos un abrigo, una gorra o dónde jugar afuera.",
  },
  goals: {
    en: [
      "I can tell how the sun warms things.",
      "I can tell what the weather is like today.",
      "I can find a pattern in the weather.",
    ],
    es: [
      "Puedo decir cómo el sol calienta las cosas.",
      "Puedo decir cómo está el tiempo hoy.",
      "Puedo encontrar un patrón en el tiempo.",
    ],
  },
  vocab: [
    { term: "weather", def_es: "cómo está el cielo y el aire afuera: sol, lluvia, viento o frío", example_es: "Hoy el tiempo está lluvioso." },
    { term: "sunlight", def_es: "la luz y el calor que vienen del sol", example_es: "La luz del sol calienta el arenero." },
    { term: "temperature", def_es: "qué tan caliente o frío está algo; se parece a \"temperatura\"", example_es: "La temperatura es de calor al mediodía." },
    { term: "pattern", def_es: "algo que pasa una y otra vez en el mismo orden; se parece a \"patrón\"", example_es: "El día y la noche forman un patrón." },
    { term: "season", def_es: "una parte del año con su propio tipo de tiempo", example_es: "El invierno es una estación fría." },
    { term: "forecast", def_es: "una idea de cómo estará el tiempo mañana", example_es: "El pronóstico dice que mañana va a llover." },
    { term: "shade", def_es: "un lugar fresco y oscuro donde un árbol o un techo tapa el sol", example_es: "Nos sentamos en la sombra debajo del árbol." },
    { term: "cloud", def_es: "una masa blanca o gris de gotitas de agua en el cielo", example_es: "Una nube gris pasa sobre el puerto." },
    { term: "warm", def_es: "un poco caliente, como una acera con sol; en español: cálido o tibio", example_es: "La arena se siente tibia en mis pies." },
  ],
  talk: [
    { en: "What is the weather like today? How do you know?", es: "¿Cómo está el tiempo hoy? ¿Cómo lo sabes?" },
    { en: "Where is it warmer: in the sun or in the shade? Let's feel.", es: "¿Dónde hace más calor: al sol o a la sombra? Vamos a sentir." },
    { en: "What did the sky look like yesterday? What about today?", es: "¿Cómo se veía el cielo ayer? ¿Y hoy?" },
    { en: "What do we wear when it is hot? When it is cold or rainy?", es: "¿Qué nos ponemos cuando hace calor? ¿Y cuando hace frío o llueve?" },
    { en: "What do you think the weather will be tomorrow? Why?", es: "¿Cómo crees que estará el tiempo mañana? ¿Por qué?" },
  ],
  try_at_home: [
    {
      title: { en: "Weather Watcher", es: "Observador del tiempo" },
      minutes: 5,
      materials: { en: "A window or a front step, paper, crayons", es: "Una ventana o la entrada de la casa, papel, crayones" },
      steps: {
        en: [
          "Each morning, look outside together. Is it sunny, cloudy, rainy, or windy?",
          "Your child draws a picture of the weather on one box of a paper with 5 boxes.",
          "After 5 days, look at the boxes. Is there a pattern? Which weather happened the most?",
          "Ask: what do you think will happen tomorrow? That is a forecast!",
        ],
        es: [
          "Cada mañana, miren afuera juntos. ¿Hay sol, nubes, lluvia o viento?",
          "Su hijo o hija dibuja el tiempo en un cuadro de una hoja con 5 cuadros.",
          "Después de 5 días, miren los cuadros. ¿Hay un patrón? ¿Qué tiempo se repitió más?",
          "Pregunten: ¿qué crees que pasará mañana? ¡Eso es un pronóstico!",
        ],
      },
    },
    {
      title: { en: "Sun and Shade Feel Test", es: "Probar sol y sombra" },
      minutes: 10,
      materials: { en: "A sunny day, two spots outside (one in the sun, one in the shade), two small objects like rocks or toys", es: "Un día con sol, dos lugares afuera (uno al sol y uno a la sombra), dos objetos pequeños como piedras o juguetes" },
      steps: {
        en: [
          "Put one object in the sun and one in the shade. Wait 15 minutes.",
          "Touch each one with the back of your hand. Which feels warmer?",
          "Ask: why is it warmer in the sun? What did the sunlight do?",
          "Walk to the shade. Say: I sit in the shade because it is cool. Where else can we find shade?",
        ],
        es: [
          "Pongan un objeto al sol y otro a la sombra. Esperen 15 minutos.",
          "Toquen cada uno con el dorso de la mano. ¿Cuál está más tibio?",
          "Pregunten: ¿por qué está más caliente al sol? ¿Qué hizo la luz del sol?",
          "Caminen hasta la sombra. Digan: me siento en la sombra porque está fresco. ¿Dónde más podemos encontrar sombra?",
        ],
      },
    },
    {
      title: { en: "What Do We Wear?", es: "¿Qué nos ponemos?" },
      minutes: 10,
      materials: { en: "Clothes from a drawer or closet", es: "Ropa de un cajón o del clóset" },
      steps: {
        en: [
          "Look at today's weather. Ask your child to pick clothes that fit the weather.",
          "Talk about why: a hat in the sun, boots in rain, a coat when it is cold.",
          "Put clothes in 3 piles: hot weather, cold weather, rainy weather.",
          "Ask: what season is it now? What will we wear in the next season?",
        ],
        es: [
          "Miren el tiempo de hoy. Pidan a su hijo o hija que escoja ropa que sirva para ese tiempo.",
          "Hablen de por qué: una gorra con sol, botas con lluvia, un abrigo cuando hace frío.",
          "Pongan la ropa en 3 montones: tiempo caluroso, tiempo frío y tiempo lluvioso.",
          "Pregunten: ¿qué estación es ahora? ¿Qué nos pondremos en la próxima estación?",
        ],
      },
    },
    {
      title: { en: "Cloud Spotting", es: "Mirar las nubes" },
      minutes: 10,
      materials: { en: "A blanket or a place to look at the sky", es: "Una cobija o un lugar para mirar el cielo" },
      steps: {
        en: [
          "Lie down or sit outside and look at the sky for a few minutes.",
          "Ask your child: what shapes do you see in the clouds? Are they white or gray?",
          "Ask: are the clouds moving? Which way? Is the sun behind a cloud?",
          "Talk about it: when the sun hides, does it feel cooler or warmer?",
        ],
        es: [
          "Acuéstense o siéntense afuera y miren el cielo unos minutos.",
          "Pregunten a su hijo o hija: ¿qué formas ves en las nubes? ¿Son blancas o grises?",
          "Pregunten: ¿se mueven las nubes? ¿Hacia dónde? ¿Está el sol detrás de una nube?",
          "Conversen: cuando el sol se esconde, ¿se siente más fresco o más caliente?",
        ],
      },
    },
  ],
  say_it: [
    { en: "It is [sunny / rainy / cloudy] today.", es: "Hoy está [soleado / lluvioso / nublado]." },
    { en: "The sun makes the [sand] [warm].", es: "El sol calienta la [arena] y se pone [tibia]." },
    { en: "I sit in the [shade].", es: "Me siento en la [sombra]." },
    { en: "Tomorrow the weather will be ___.", es: "Mañana el tiempo va a estar ___." },
  ],
  help: {
    en: [
      "Look at the sky together every day. Short and daily is better than long and rare.",
      "Ask \"what do you see?\" and \"how does it feel?\" in any language. You do not need English words.",
      "Let your child touch, look, and feel. Science is learned with hands and eyes.",
      "Share weather words from your own language or from the place you come from. Every weather word is welcome.",
    ],
    es: [
      "Miren el cielo juntos todos los días. Poco y diario es mejor que mucho y rara vez.",
      "Pregunten \"¿qué ves?\" y \"¿cómo se siente?\" en cualquier idioma. No necesitan palabras en inglés.",
      "Dejen que su hijo o hija toque, mire y sienta. La ciencia se aprende con las manos y los ojos.",
      "Compartan palabras del tiempo en su idioma o del lugar de donde vienen. Todas las palabras del tiempo son bienvenidas.",
    ],
  },
  home_language: {
    en: "Say the weather in Spanish first: \"hace sol, está nublado, llueve, hace frío.\" Then say it in English: \"it is sunny, cloudy, rainy, cold.\" Look for cognates: \"temperatura\" and \"temperature,\" \"patrón\" and \"pattern.\" Watch out for \"estación\": here it means \"season,\" not \"station.\"",
    es: "Digan primero el tiempo en español: \"hace sol, está nublado, llueve, hace frío\". Luego díganlo en inglés: \"it is sunny, cloudy, rainy, cold\". Busquen palabras parecidas: \"temperatura\" y \"temperature\", \"patrón\" y \"pattern\". Ojo con \"estación\": aquí quiere decir una parte del año, \"season\" en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child looks at the sky, tells you the weather in a sentence, and notices that the sun warms things.",
    es: "Sabrán que está funcionando cuando su hijo o hija mire el cielo, les diga cómo está el tiempo en una oración y note que el sol calienta las cosas.",
  },
};

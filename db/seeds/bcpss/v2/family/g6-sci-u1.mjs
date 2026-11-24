// BCPSS Family Guide (EN/ES) — g6-sci-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 6 Science unit on light and vision. Vocabulary order matches ../units/g6-sci-u1.mjs.

export default {
  summary: {
    en: "Your child is learning how light travels from a lamp or the sun, bounces off things, and enters the eye so we can see. It matters every day: why a black shirt feels hot, why the Inner Harbor shows the skyline upside down, and why our eyes can be tricked by a picture. Your child will explain each idea in order, with words like first, next, and because.",
    es: "Su hijo o hija está aprendiendo cómo la luz viaja desde una lámpara o el sol, rebota en las cosas y entra al ojo para que podamos ver. Sirve todos los días: por qué una camiseta negra se siente caliente, por qué el Inner Harbor muestra los edificios al revés y por qué una imagen puede engañar a los ojos. Su hijo o hija explicará cada idea en orden, con palabras como primero, luego y porque.",
  },
  goals: {
    en: [
      "I can follow light from a source to an object to my eye.",
      "I can tell if a surface reflects, scatters, or absorbs light.",
      "I can explain what I see with first, next, because, and so.",
    ],
    es: [
      "Puedo seguir la luz desde una fuente hasta un objeto y hasta mi ojo.",
      "Puedo decir si una superficie refleja, dispersa o absorbe la luz.",
      "Puedo explicar lo que veo con primero, luego, porque y entonces.",
    ],
  },
  vocab: [
    { term: "light source", def_es: "algo que hace su propia luz, como el sol, una vela o una linterna", example_es: "El sol es la fuente de luz más grande del cielo." },
    { term: "reflection", def_es: "cuando la luz rebota en una superficie lisa, como un espejo o el agua quieta; es casi igual en inglés", example_es: "El agua quieta del puerto hace un reflejo claro de los edificios." },
    { term: "scattering", def_es: "cuando la luz rebota en una superficie áspera y sale para muchos lados", example_es: "La dispersión de la luz nos deja ver la pared desde cualquier asiento." },
    { term: "absorption", def_es: "cuando una superficie se queda con la energía de la luz en vez de rebotarla; por eso se calienta", example_es: "La absorción explica por qué una camiseta negra se siente caliente al sol." },
    { term: "transparent", def_es: "que deja pasar la luz y se ve claro a través, como un vidrio limpio", example_es: "El agua limpia de un vaso es transparente y se ve el fondo." },
    { term: "opaque", def_es: "que tapa toda la luz y no deja ver al otro lado, como una puerta de madera", example_es: "Una puerta de madera es opaca, así que no vemos el pasillo." },
    { term: "pupil", def_es: "el círculo negro en el centro del ojo que deja entrar la luz", example_es: "Con mucho sol, la pupila se hace más pequeña." },
    { term: "retina", def_es: "la capa del fondo del ojo que siente la luz y manda señales al cerebro; se escribe igual en español", example_es: "La retina convierte la luz en señales para el cerebro." },
    { term: "illusion", def_es: "una imagen que engaña al cerebro para que vea algo que no es cierto", example_es: "Las dos líneas miden lo mismo, pero la ilusión óptica hace que una parezca más larga." },
  ],
  talk: [
    { en: "Where does the light come from in this room? Show me with your finger.", es: "¿De dónde viene la luz en este cuarto? Muéstramelo con el dedo." },
    { en: "How do you know that light has to reach your eye for you to see?", es: "¿Cómo sabes que la luz tiene que llegar a tu ojo para que veas?" },
    { en: "What is something transparent and something opaque you saw today?", es: "¿Qué cosa transparente y qué cosa opaca viste hoy?" },
    { en: "Why do you think a dark shirt gets hotter than a light shirt in the sun?", es: "¿Por qué crees que una camiseta oscura se calienta más que una clara bajo el sol?" },
    { en: "What was tricky today, and what helped you understand it?", es: "¿Qué fue difícil hoy y qué te ayudó a entenderlo?" },
  ],
  try_at_home: [
    {
      title: { en: "Dark Room Test", es: "Prueba en el cuarto oscuro" },
      minutes: 10,
      materials: { en: "A closet or a room with the lights off, a flashlight, a small toy", es: "Un clóset o un cuarto con las luces apagadas, una linterna y un juguete pequeño" },
      steps: {
        en: [
          "Go into a dark room and ask your child: can you see the toy? Why or why not?",
          "Turn on the flashlight and point it at the wall, not at the toy. What changes?",
          "Shine it on the toy. Ask your child to trace the light with a finger: flashlight, toy, eye.",
          "Ask: what did the light need to do for you to see the toy?",
        ],
        es: [
          "Entren a un cuarto oscuro y pregunten: ¿puedes ver el juguete? ¿Por qué sí o por qué no?",
          "Prendan la linterna y apúntenla a la pared, no al juguete. ¿Qué cambia?",
          "Alumbren el juguete. Pidan a su hijo o hija que siga la luz con el dedo: linterna, juguete, ojo.",
          "Pregunten: ¿qué tuvo que hacer la luz para que vieras el juguete?",
        ],
      },
    },
    {
      title: { en: "Spoon Mirror", es: "El espejo de cuchara" },
      minutes: 10,
      materials: { en: "A shiny metal spoon, a piece of crumpled foil, a smooth sheet of foil", es: "Una cuchara de metal brillante, un pedazo de papel aluminio arrugado y otro liso" },
      steps: {
        en: [
          "Look at your faces in the spoon. Is the picture clear? Turn the spoon over and look again.",
          "Look at your faces in smooth foil, then in crumpled foil.",
          "Ask: which surface gives a clear picture? Which one spreads the light everywhere?",
          "Say it together: smooth surfaces reflect, rough surfaces scatter.",
        ],
        es: [
          "Mírense la cara en la cuchara. ¿Se ve clara la imagen? Volteen la cuchara y miren otra vez.",
          "Mírense en el aluminio liso y luego en el aluminio arrugado.",
          "Pregunten: ¿qué superficie da una imagen clara? ¿Cuál esparce la luz para todos lados?",
          "Díganlo juntos: las superficies lisas reflejan, las superficies ásperas dispersan.",
        ],
      },
    },
    {
      title: { en: "Hot Shirt Test", es: "La prueba de la camiseta caliente" },
      minutes: 15,
      materials: { en: "A sunny window or porch, a dark shirt, a light shirt, two cups of cool tap water", es: "Una ventana o un porche con sol, una camiseta oscura, una clara y dos vasos de agua fría de la llave" },
      steps: {
        en: [
          "Ask your child to guess: which shirt will get warmer in the sun? Write the guess down.",
          "Lay one shirt over each cup in the sun for ten minutes.",
          "Touch each shirt with the back of your hand. Which is warmer?",
          "Ask: what happened to the light on the dark shirt? Use the word absorb.",
        ],
        es: [
          "Pidan a su hijo o hija que adivine: ¿qué camiseta se calentará más al sol? Anoten la idea.",
          "Pongan una camiseta sobre cada vaso, al sol, durante diez minutos.",
          "Toquen cada camiseta con el dorso de la mano. ¿Cuál está más caliente?",
          "Pregunten: ¿qué le pasó a la luz en la camiseta oscura? Usen la palabra absorber.",
        ],
      },
    },
    {
      title: { en: "Ripple Skyline", es: "El horizonte con ondas" },
      minutes: 10,
      materials: { en: "A wide bowl or baking pan with water, a flashlight or lamp, a spoon", es: "Un tazón ancho o un molde con agua, una linterna o lámpara y una cuchara" },
      steps: {
        en: [
          "Put the bowl on a table and shine a light on the still water. Look for the reflection on the wall.",
          "Gently tap the water with the spoon to make ripples. What happens to the picture?",
          "Ask your child to explain: when the water is smooth, light reflects. When ripples form, the light scatters.",
          "Think of the Inner Harbor on a windy day. Does the skyline look the same?",
        ],
        es: [
          "Pongan el tazón en una mesa y alumbren el agua quieta. Busquen el reflejo en la pared.",
          "Toquen el agua con suavidad con la cuchara para hacer ondas. ¿Qué le pasa a la imagen?",
          "Pidan a su hijo o hija que explique: cuando el agua está lisa, la luz se refleja. Cuando hay ondas, la luz se dispersa.",
          "Piensen en el Inner Harbor un día de viento. ¿Se ven igual los edificios?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Light comes from the [source] and goes into my [eye].", es: "La luz viene de [la fuente] y entra a mi [ojo]." },
    { en: "The [object] is opaque because light cannot [pass through] it.", es: "El [objeto] es opaco porque la luz no puede [atravesarlo]." },
    { en: "A [dark] surface absorbs more light, so it gets [warmer].", es: "Una superficie [oscura] absorbe más luz, entonces se pone más [caliente]." },
    { en: "First the light [reflects] off the object, then it ___.", es: "Primero la luz [rebota] en el objeto y luego ___." },
  ],
  help: {
    en: [
      "You do not need to know the science. Ask, \"Where does the light go next?\" and let your child explain.",
      "Say \"show me\" and \"how do you know?\" in any language. Explaining out loud makes the idea stick.",
      "Try the experiments together with things at home. Guessing first, then testing, is what scientists do.",
      "If an answer is wrong, ask, \"What did you see?\" before you correct it.",
    ],
    es: [
      "No necesitan saber la ciencia. Pregunten \"¿adónde va la luz después?\" y dejen que su hijo o hija explique.",
      "Digan \"muéstrame\" y \"¿cómo lo sabes?\" en cualquier idioma. Explicar en voz alta ayuda a que la idea se quede.",
      "Hagan los experimentos juntos con cosas de la casa. Primero adivinar y luego probar es lo que hacen los científicos.",
      "Si una respuesta no es correcta, pregunten \"¿qué viste?\" antes de corregir.",
    ],
  },
  home_language: {
    en: "Talk about light in Spanish first: \"la luz, el reflejo, el ojo.\" Then find the English words together. Reflection, absorption, transparent, opaque, pupil, retina, and illusion are close to their Spanish words (reflexión, absorción, transparente, opaco, pupila, retina, ilusión), so your child already knows many of them.",
    es: "Hablen primero de la luz en español: \"la luz, el reflejo, el ojo\". Después busquen juntos las palabras en inglés. Reflection, absorption, transparent, opaque, pupil, retina e illusion se parecen mucho a sus palabras en español (reflexión, absorción, transparente, opaco, pupila, retina, ilusión), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child can point to a lamp or a window and tell you, in any language, how the light travels to their eye and why.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda señalar una lámpara o una ventana y contarles, en el idioma que quiera, cómo viaja la luz hasta su ojo y por qué.",
  },
};

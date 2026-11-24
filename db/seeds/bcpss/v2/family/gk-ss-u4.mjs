// BCPSS Family Guide (EN/ES) — gk-ss-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Kindergarten Social Studies unit on needs, wants, and neighborhood workers. Vocabulary order matches ../units/gk-ss-u4.mjs.

export default {
  summary: {
    en: "Your child is learning how workers in the neighborhood help people get what they need. Children tell needs from wants and learn that workers make goods or give services. It matters every time we ride the bus, buy bread, or visit a clinic. Your child will practice explaining a cause and an effect with the word so.",
    es: "Su hijo o hija está aprendiendo cómo los trabajadores del vecindario ayudan a la gente a conseguir lo que necesita. Los niños distinguen las necesidades de los deseos y aprenden que los trabajadores hacen bienes o dan servicios. Es importante cada vez que tomamos el autobús, compramos pan o vamos a una clínica. Su hijo o hija practicará explicar una causa y un efecto con la palabra entonces.",
  },
  goals: {
    en: [
      "I can tell a need from a want.",
      "I can tell how a worker gives goods or a service, using so.",
    ],
    es: [
      "Puedo decir cuál es una necesidad y cuál es un deseo.",
      "Puedo decir cómo un trabajador da bienes o un servicio, usando entonces.",
    ],
  },
  vocab: [
    { term: "need", def_es: "algo que las personas tienen que tener para vivir", example_es: "La comida es una necesidad de todas las personas." },
    { term: "want", def_es: "algo que sería bonito tener, pero se puede vivir sin eso", example_es: "Un juguete nuevo es un deseo." },
    { term: "shelter", def_es: "un lugar seguro para vivir, donde no nos mojamos ni pasamos frío", example_es: "Una casa nos da refugio." },
    { term: "clothing", def_es: "lo que nos ponemos para estar abrigados y cubiertos", example_es: "Un abrigo es ropa para el invierno." },
    { term: "goods", def_es: "cosas que las personas hacen o cultivan y venden", example_es: "Un panadero hace bienes, como el pan." },
    { term: "service", def_es: "trabajo que alguien hace para ayudar a otras personas", example_es: "El conductor del autobús da un servicio." },
    { term: "worker", def_es: "una persona que tiene un trabajo", example_es: "Un trabajador arregla la calle." },
    { term: "job", def_es: "el trabajo que hace una persona para ganar dinero", example_es: "La enfermera tiene un trabajo que ayuda a la gente." },
    { term: "money", def_es: "monedas y billetes que usamos para comprar cosas", example_es: "La gente usa dinero para comprar comida." },
  ],
  talk: [
    { en: "What do all people need to live? What is one thing we want but do not need?", es: "¿Qué necesitan todas las personas para vivir? ¿Qué es algo que queremos pero no necesitamos?" },
    { en: "Which workers help us on our block? What do they do?", es: "¿Qué trabajadores nos ayudan en nuestra cuadra? ¿Qué hacen?" },
    { en: "Does that worker make goods or give a service? How do you know?", es: "¿Ese trabajador hace bienes o da un servicio? ¿Cómo lo sabes?" },
    { en: "What would happen if that worker stayed home for a day?", es: "¿Qué pasaría si ese trabajador se quedara en casa un día?" },
    { en: "What job would you like to do when you grow up? Who would you help?", es: "¿Qué trabajo te gustaría hacer de grande? ¿A quién ayudarías?" },
  ],
  try_at_home: [
    {
      title: { en: "Need or Want Sort", es: "Clasificar necesidades y deseos" },
      minutes: 10,
      materials: { en: "Things from around the house, or pictures from a flyer or magazine; two spots on the table", es: "Cosas de la casa, o dibujos de un folleto o una revista; dos lugares en la mesa" },
      steps: {
        en: [
          "Pick 6 to 8 things: an apple, a coat, a toy, a cup, a blanket, a game, shoes.",
          "Make two spots: need and want. Your child puts each thing in a spot.",
          "Ask: why is this a need? Why is this a want? Different families may sort a few things differently, and that is a good talk.",
          "Ask: I want a toy, but I need ___. Let your child finish it.",
        ],
        es: [
          "Elijan de 6 a 8 cosas: una manzana, un abrigo, un juguete, una taza, una cobija, un juego, zapatos.",
          "Hagan dos lugares: necesidad y deseo. Su hijo o hija pone cada cosa en un lugar.",
          "Pregunten: ¿por qué esto es una necesidad? ¿Por qué esto es un deseo? Algunas familias pueden clasificar ciertas cosas diferente, y eso da una buena conversación.",
          "Digan: yo quiero un juguete, pero necesito ___. Dejen que su hijo o hija lo termine.",
        ],
      },
    },
    {
      title: { en: "Helper Walk", es: "Paseo de ayudantes" },
      minutes: 15,
      materials: { en: "A walk around the block, to the store, or to the bus stop", es: "Una caminata por la cuadra, a la tienda o a la parada del autobús" },
      steps: {
        en: [
          "Walk and look for people at work: a bus driver, a store clerk, a crossing guard, a mail carrier, a builder.",
          "Ask: what is this worker doing? Who is being helped?",
          "Ask: is that a good or a service? A baker makes goods. A bus driver gives a service.",
          "Back home, help your child say: \"People need ___, so the ___ helps.\"",
        ],
        es: [
          "Caminen y busquen personas trabajando: un conductor de autobús, un empleado de tienda, una guardia de cruce, un cartero, un albañil.",
          "Pregunten: ¿qué está haciendo este trabajador? ¿A quién ayuda?",
          "Pregunten: ¿eso es un bien o un servicio? Un panadero hace bienes. Un conductor de autobús da un servicio.",
          "Al regresar a casa, ayúdenle a decir: \"La gente necesita ___, entonces el ___ ayuda\".",
        ],
      },
    },
    {
      title: { en: "Play Market", es: "Jugar al mercado" },
      minutes: 15,
      materials: { en: "Play coins or paper circles, empty food boxes or small toys, paper for price tags", es: "Monedas de juguete o círculos de papel, cajas de comida vacías o juguetes pequeños, papel para los precios" },
      steps: {
        en: [
          "Set up a pretend store. Your child is the worker and sets the price tags.",
          "You are the customer. Say what you need and pay with play money.",
          "Ask: what job is the worker doing? Is the worker giving goods or a service?",
          "Switch. Now you are the worker and your child shops for a need first, then a want.",
        ],
        es: [
          "Armen una tienda de mentiras. Su hijo o hija es el trabajador y pone los precios.",
          "Ustedes son el cliente. Digan lo que necesitan y paguen con dinero de juguete.",
          "Pregunten: ¿qué trabajo hace el trabajador? ¿Da bienes o un servicio?",
          "Cambien de papel. Ahora ustedes son el trabajador y su hijo o hija compra primero algo que necesita y luego algo que quiere.",
        ],
      },
    },
    {
      title: { en: "Job Chart of Helpers", es: "Tabla de trabajos de ayudantes" },
      minutes: 10,
      materials: { en: "Paper, crayons", es: "Papel, crayones" },
      steps: {
        en: [
          "Fold the paper in two. Label one side worker and the other side helps with.",
          "Your child draws two or three workers they know, including family helpers.",
          "On the other side, draw what each worker helps with: food, a ride, a clean street, health.",
          "Ask your child to tell it with so: \"People need a ride, so the bus driver gives rides.\"",
        ],
        es: [
          "Doblen el papel en dos. Escriban trabajador de un lado y ayuda con del otro.",
          "Su hijo o hija dibuja dos o tres trabajadores que conoce, incluyendo ayudantes de la familia.",
          "Del otro lado, dibujen en qué ayuda cada trabajador: comida, un viaje, una calle limpia, la salud.",
          "Pidan que lo cuente con entonces: \"La gente necesita un viaje, entonces el conductor da viajes\".",
        ],
      },
    },
  ],
  say_it: [
    { en: "I need [food]. I want a [toy].", es: "Necesito [comida]. Quiero un [juguete]." },
    { en: "People need [food], so the [grocer] sells [apples].", es: "La gente necesita [comida], entonces el [tendero] vende [manzanas]." },
    { en: "A [bus driver] gives a service.", es: "Un [conductor de autobús] da un servicio." },
    { en: "I want a [toy], but I need ___.", es: "Quiero un [juguete], pero necesito ___." },
  ],
  help: {
    en: [
      "Point out workers wherever you go and ask: who is this helping?",
      "You do not need the English words. Ask \"need or want?\" in your language and let your child explain.",
      "All kinds of work matter: in an office, at home, in a shop, outside. Families can share the jobs they know.",
      "If your child says \"because it is a job,\" ask: what does the worker give to people?",
    ],
    es: [
      "Señalen a los trabajadores adondequiera que vayan y pregunten: ¿a quién ayuda?",
      "No necesitan saber las palabras en inglés. Pregunten \"¿necesidad o deseo?\" en su idioma y dejen que su hijo o hija explique.",
      "Todo tipo de trabajo es importante: en una oficina, en casa, en una tienda, afuera. Las familias pueden compartir los trabajos que conocen.",
      "Si su hijo o hija dice \"porque es un trabajo\", pregunten: ¿qué les da el trabajador a las personas?",
    ],
  },
  home_language: {
    en: "Name jobs and needs in Spanish and English: \"trabajador\" and \"worker,\" \"servicio\" and \"service,\" \"necesidad\" and \"need,\" \"dinero\" and \"money.\" Notice that \"servicio\" and \"service\" are almost twins. Ask your child to teach you the English name of a worker you see on the block.",
    es: "Nombren los trabajos y las necesidades en español y en inglés: \"trabajador\" y \"worker\", \"servicio\" y \"service\", \"necesidad\" y \"need\", \"dinero\" y \"money\". Noten que \"servicio\" y \"service\" son casi gemelas. Pidan a su hijo o hija que les enseñe el nombre en inglés de un trabajador que vean en la cuadra.",
  },
  celebrate: {
    en: "You will know it is working when your child tells you what a worker helps people with, using so, and sorts a need from a want, in any language.",
    es: "Sabrán que está funcionando cuando su hijo o hija les diga en qué ayuda un trabajador a la gente, usando entonces, y separe una necesidad de un deseo, en el idioma que quiera.",
  },
};

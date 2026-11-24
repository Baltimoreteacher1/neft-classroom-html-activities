// BCPSS Family Guide (EN/ES) — g4-sci-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 4 Science unit on how the land around the Chesapeake Bay has changed. Vocabulary order matches ../units/g4-sci-u4.mjs.

export default {
  summary: {
    en: "Your child is learning how rocks, rivers, and maps can prove that land changes over time. Water and weather break rock down, move it, and drop it somewhere new. The layers at Calvert Cliffs hold fossils of sea animals, including shark teeth. Your child will make a claim and prove it with evidence.",
    es: "Su hijo o hija está aprendiendo cómo las rocas, los ríos y los mapas pueden probar que la tierra cambia con el tiempo. El agua y el clima rompen las rocas, las mueven y las dejan en otro lugar. Las capas de Calvert Cliffs guardan fósiles de animales marinos, incluidos dientes de tiburón. Su hijo o hija hará una afirmación y la probará con evidencia.",
  },
  goals: {
    en: [
      "I can explain how water and weathering change land.",
      "I can use rock layers and fossils as evidence of change.",
      "I can make a claim and back it up with evidence.",
    ],
    es: [
      "Puedo explicar cómo el agua y la meteorización cambian la tierra.",
      "Puedo usar capas de roca y fósiles como evidencia de cambio.",
      "Puedo hacer una afirmación y respaldarla con evidencia.",
    ],
  },
  vocab: [
    { term: "weathering", def_es: "la rotura lenta de la roca en pedazos más pequeños; en español se dice 'meteorización'", example_es: "La meteorización rompe la roca en pedacitos." },
    { term: "erosion", def_es: "cuando el agua, el viento o el hielo mueven pedazos de roca y tierra a otro lugar; en español se dice 'erosión'", example_es: "La erosión se llevó la tierra de la orilla del arroyo." },
    { term: "sediment", def_es: "pedacitos de roca, arena y tierra que el agua o el viento pueden llevar; en español se dice 'sedimento'", example_es: "El agua turbia lleva mucho sedimento." },
    { term: "deposit", def_es: "dejar sedimento en un lugar nuevo cuando el agua se vuelve más lenta; en español se dice 'depositar'", example_es: "El río deposita arena en la curva." },
    { term: "layer", def_es: "un nivel plano de roca o sedimento colocado sobre otros; en español se dice 'capa'", example_es: "Cada capa de roca se formó en un momento distinto." },
    { term: "fossil", def_es: "los restos o la huella de una planta o animal que vivió hace mucho, guardados en la roca; en español se dice 'fósil'", example_es: "Encontré un diente de tiburón fósil en Calvert Cliffs." },
    { term: "watershed", def_es: "toda la tierra donde la lluvia y los arroyos desembocan en el mismo río o bahía; en español se dice 'cuenca hidrográfica'", example_es: "Nuestra cuenca hidrográfica lleva el agua a la bahía de Chesapeake." },
    { term: "landform", def_es: "una forma natural de la superficie de la Tierra, como una colina, un valle o un acantilado", example_es: "Un acantilado es un accidente geográfico." },
    { term: "evidence", def_es: "datos, medidas u observaciones que muestran que una afirmación es verdadera; en español se dice 'evidencia'", example_es: "Los fósiles son evidencia de que allí hubo un mar." },
    { term: "claim", def_es: "una afirmación que dices que es verdadera y luego pruebas con evidencia", example_es: "Mi afirmación es que el arroyo cambió su curso." },
  ],
  talk: [
    { en: "What is your claim? What evidence do you have?", es: "¿Cuál es tu afirmación? ¿Qué evidencia tienes?" },
    { en: "Did the land break, move, or drop here? How can you tell?", es: "¿La tierra se rompió, se movió o se depositó aquí? ¿Cómo lo sabes?" },
    { en: "Where does the rain go when it leaves our street?", es: "¿A dónde va la lluvia cuando sale de nuestra calle?" },
    { en: "What can rock layers and fossils tell us?", es: "¿Qué nos pueden decir las capas de roca y los fósiles?" },
    { en: "What does a map show about how land changes?", es: "¿Qué muestra un mapa sobre cómo cambia la tierra?" },
  ],
  try_at_home: [
    {
      title: { en: "Jar of Layers", es: "El frasco de capas" },
      minutes: 10,
      materials: { en: "A clear jar with a lid, a mix of soil, sand, and small pebbles, water", es: "Un frasco transparente con tapa, una mezcla de tierra, arena y piedritas, y agua" },
      steps: {
        en: [
          "Fill the jar halfway with the soil, sand, and pebble mix. Add water almost to the top and close the lid.",
          "Shake it hard. Set it down and watch for a few minutes, then again after an hour.",
          "Ask: which settles first? Pebbles settle first, then sand, then tiny soil pieces form the top layer.",
          "Say: the water deposits sediment in layers, like the layers in rock.",
        ],
        es: [
          "Llenen el frasco hasta la mitad con la mezcla de tierra, arena y piedritas. Agreguen agua casi hasta arriba y cierren la tapa.",
          "Agítenlo con fuerza. Pónganlo en la mesa y observen unos minutos, y otra vez después de una hora.",
          "Pregunten: ¿qué se asienta primero? Las piedritas se asientan primero, luego la arena y al final la tierra más fina forma la capa de arriba.",
          "Digan: el agua deposita sedimento en capas, como las capas de la roca.",
        ],
      },
    },
    {
      title: { en: "Chalk and Vinegar", es: "Tiza y vinagre" },
      minutes: 10,
      materials: { en: "A piece of white chalk, a small cup, vinegar", es: "Un pedazo de tiza blanca, un vasito y vinagre" },
      steps: {
        en: [
          "Put the chalk in the cup. Pour in enough vinegar to cover it.",
          "Watch the bubbles. Come back after an hour and look at the chalk.",
          "Ask: what happened? This is a model of how slightly acid rain slowly wears away limestone and marble, such as old statues.",
          "Say: weathering breaks rock into smaller pieces slowly.",
        ],
        es: [
          "Pongan la tiza en el vasito. Echen suficiente vinagre para cubrirla.",
          "Miren las burbujas. Vuelvan después de una hora y miren la tiza.",
          "Pregunten: ¿qué pasó? Es un modelo de cómo la lluvia un poco ácida desgasta poco a poco la caliza y el mármol, como las estatuas viejas.",
          "Digan: la meteorización rompe la roca en pedazos más pequeños, lentamente.",
        ],
      },
    },
    {
      title: { en: "Paper Watershed", es: "Cuenca de papel" },
      minutes: 15,
      materials: { en: "A sheet of paper, washable markers, a spray bottle or a cup of water, a tray", es: "Una hoja de papel, marcadores lavables, un rociador o una taza de agua y una bandeja" },
      steps: {
        en: [
          "Crumple the paper and open it loosely. Mark the high ridges with a washable marker.",
          "Place it on the tray. Lightly spray or drip water on it, like rain.",
          "Watch where the marker flows. All the water ends up in the low places. This is a watershed model.",
          "Ask: where does rain from our street go? In Baltimore it flows through streams and storm drains to the harbor and the Bay.",
        ],
        es: [
          "Arruguen el papel y ábranlo sin alisarlo mucho. Marquen las crestas altas con un marcador lavable.",
          "Pónganlo en la bandeja. Rocíen o dejen caer un poco de agua, como lluvia.",
          "Miren por dónde fluye el color. Toda el agua termina en los lugares bajos. Es un modelo de cuenca hidrográfica.",
          "Pregunten: ¿a dónde va la lluvia de nuestra calle? En Baltimore corre por arroyos y desagües hacia el puerto y la bahía.",
        ],
      },
    },
    {
      title: { en: "Clay Fossil Print", es: "Huella de fósil en arcilla" },
      minutes: 15,
      materials: { en: "Play dough or clay, a seashell, a leaf, or a small toy animal", es: "Plastilina o arcilla, una concha, una hoja o un animalito de juguete" },
      steps: {
        en: [
          "Flatten the clay. Press the shell or leaf into it, then lift it off.",
          "Look at the print. This is like a fossil print made long ago in mud that later hardened into rock.",
          "Ask: what can the print tell you about the object, even if it is gone?",
          "Make a claim: a [fossil] is evidence that [sea animals] lived here, because [reason].",
        ],
        es: [
          "Aplanen la arcilla. Presionen la concha o la hoja y luego levántenla.",
          "Miren la huella. Es como una huella de fósil hecha hace mucho en lodo que después se endureció y se volvió roca.",
          "Pregunten: ¿qué les dice la huella sobre el objeto, aunque ya no esté?",
          "Hagan una afirmación: un [fósil] es evidencia de que aquí vivieron [animales marinos], porque [razón].",
        ],
      },
    },
  ],
  say_it: [
    { en: "I claim that the [land / stream] changed because [evidence].", es: "Afirmo que la [tierra / el arroyo] cambió porque [evidencia]." },
    { en: "According to the [map / rock layers], [fact].", es: "Según el [mapa / las capas de roca], [dato]." },
    { en: "This evidence supports my claim because [reason].", es: "Esta evidencia respalda mi afirmación porque [razón]." },
    { en: "The water [deposits] [sediment] where it [slows down].", es: "El agua [deposita] [sedimento] donde [se vuelve más lenta]." },
  ],
  help: {
    en: [
      "Ask \"what is your claim?\" and \"what is your proof?\" in any language.",
      "Let your child explain with a drawing. You do not need to know the rocks.",
      "Look at real puddles, mud, stairs, and stream banks together.",
      "Use safe things at home. Wash hands after handling soil.",
    ],
    es: [
      "Pregunten \"¿cuál es tu afirmación?\" y \"¿cuál es tu prueba?\" en cualquier idioma.",
      "Dejen que su hijo o hija explique con un dibujo. No necesitan saber de rocas.",
      "Miren charcos, lodo, escalones y orillas de arroyos de verdad, juntos.",
      "Usen cosas seguras de la casa. Lávense las manos después de tocar tierra.",
    ],
  },
  home_language: {
    en: "Most words are cousins: sediment (sedimento), fossil (fósil), erosion (erosión), evidence (evidencia), deposit (depositar). Tell the story of a river in Spanish first, then retell it in English with the new words.",
    es: "La mayoría de las palabras son primas: sediment (sedimento), fossil (fósil), erosion (erosión), evidence (evidencia), deposit (depositar). Cuenten primero la historia de un río en español y luego vuelvan a contarla en inglés con las palabras nuevas.",
  },
  celebrate: {
    en: "You will know it is working when your child looks at a stream, a hill, or a rock and tells you a claim about how it changed, with evidence.",
    es: "Sabrán que está funcionando cuando su hijo o hija mire un arroyo, una colina o una roca y les diga una afirmación sobre cómo cambió, con evidencia.",
  },
};

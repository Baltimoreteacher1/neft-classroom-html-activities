// BCPSS Family Guide (EN/ES) — g3-sci-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 3 Science unit on weather, climate, and storm protection. Vocabulary order matches ../units/g3-sci-u4.mjs.

export default {
  summary: {
    en: "Your child is learning how weather data helps us describe a place's climate and plan for storms and floods. Weather is what the air is like today. Climate is the usual weather over many years. It matters on a rainy Baltimore morning or when a street floods. Your child will explain a process in order with first, then, and as a result.",
    es: "Su hijo o hija está aprendiendo cómo los datos del tiempo nos ayudan a describir el clima de un lugar y a prepararnos para tormentas e inundaciones. El tiempo es cómo está el aire hoy. El clima es el tiempo habitual durante muchos años. Sirve en una mañana lluviosa de Baltimore o cuando se inunda una calle. Su hijo o hija explicará un proceso en orden con primero, luego y como resultado.",
  },
  goals: {
    en: [
      "I can use weather data to describe a climate.",
      "I can compare climates in different regions.",
      "I can explain how a design can reduce flood or storm damage.",
    ],
    es: [
      "Puedo usar datos del tiempo para describir un clima.",
      "Puedo comparar los climas de distintas regiones.",
      "Puedo explicar cómo un diseño puede reducir el daño de una inundación o tormenta.",
    ],
  },
  vocab: [
    { term: "weather", def_es: "cómo está el aire afuera en un momento y lugar, como soleado, lluvioso o con viento; en español se dice 'tiempo'", example_es: "Hoy el tiempo está lluvioso y con viento." },
    { term: "climate", def_es: "el tiempo habitual de un lugar durante muchos años; en español se dice 'clima'", example_es: "El clima de Baltimore tiene veranos calurosos e inviernos fríos." },
    { term: "season", def_es: "una de las cuatro partes del año: primavera, verano, otoño e invierno; en español se dice 'estación'", example_es: "El otoño es mi estación favorita." },
    { term: "precipitation", def_es: "agua que cae de las nubes como lluvia, nieve, aguanieve o granizo; en español se dice 'precipitación'", example_es: "La lluvia y la nieve son precipitación." },
    { term: "hazard", def_es: "un suceso natural que puede lastimar a las personas o dañar cosas; en español se dice 'peligro'", example_es: "Una tormenta fuerte es un peligro." },
    { term: "flood", def_es: "una gran cantidad de agua que cubre un terreno que normalmente está seco; en español se dice 'inundación'", example_es: "La lluvia fuerte causó una inundación en la calle." },
    { term: "region", def_es: "una zona grande de tierra que comparte características, como el tiempo o las plantas; en español se dice 'región'", example_es: "El desierto es una región con poca lluvia." },
    { term: "data", def_es: "datos y números que las personas reúnen, como las temperaturas de cada día", example_es: "Anotamos datos de la temperatura durante una semana." },
    { term: "design", def_es: "un plan para construir algo que resuelva un problema; en español se dice 'diseño'", example_es: "Un muro es un diseño que ayuda a frenar el agua." },
  ],
  talk: [
    { en: "What is the weather today? What is the climate here?", es: "¿Cómo está el tiempo hoy? ¿Cómo es el clima aquí?" },
    { en: "What happens first, then, and as a result when a storm forms?", es: "¿Qué pasa primero, luego y como resultado cuando se forma una tormenta?" },
    { en: "How is the climate in another place different from ours?", es: "¿En qué se diferencia el clima de otro lugar del nuestro?" },
    { en: "How can people stay safe in a storm or flood?", es: "¿Cómo pueden las personas estar seguras en una tormenta o inundación?" },
    { en: "What data could we collect about the weather?", es: "¿Qué datos podríamos reunir sobre el tiempo?" },
  ],
  try_at_home: [
    {
      title: { en: "Weather Log", es: "Registro del tiempo" },
      minutes: 5,
      materials: { en: "Paper folded into 7 boxes, a pencil, a window, a thermometer if you have one", es: "Papel doblado en 7 cuadros, lápiz, una ventana y un termómetro si tienen uno" },
      steps: {
        en: [
          "Each day at the same time, look outside. Write words or draw: sunny, cloudy, rainy, windy.",
          "If you have a thermometer, write the temperature. These are data.",
          "After a week, look at all the boxes. Ask: what pattern do you see?",
          "Ask: is that weather or climate? A week of weather is data. Many years of weather shows climate.",
        ],
        es: [
          "Cada día a la misma hora, miren afuera. Escriban palabras o dibujen: soleado, nublado, lluvioso, con viento.",
          "Si tienen termómetro, escriban la temperatura. Esos son datos.",
          "Después de una semana, miren todos los cuadros. Pregunten: ¿qué patrón ven?",
          "Pregunten: ¿eso es tiempo o clima? Una semana de tiempo son datos. Muchos años de tiempo muestran el clima.",
        ],
      },
    },
    {
      title: { en: "Water Cycle in a Bag", es: "El ciclo del agua en una bolsa" },
      minutes: 10,
      materials: { en: "A zip bag, water, tape, a sunny window", es: "Una bolsa con cierre, agua, cinta y una ventana con sol" },
      steps: {
        en: [
          "Pour a little water into the bag. Seal it tight and tape it to a sunny window.",
          "Check every few hours. The water warms and turns to vapor. Droplets form at the top, like clouds.",
          "Droplets get heavy and run down, like rain. This is precipitation.",
          "Say: first the water [warms], then it [cools and forms drops], so [rain falls].",
        ],
        es: [
          "Echen un poco de agua en la bolsa. Ciérrenla bien y péguenla con cinta a una ventana con sol.",
          "Revísenla cada unas horas. El agua se calienta y se vuelve vapor. Arriba se forman gotitas, como nubes.",
          "Las gotitas se hacen pesadas y bajan, como lluvia. Eso es precipitación.",
          "Digan: primero el agua [se calienta], luego [se enfría y forma gotas], entonces [cae la lluvia].",
        ],
      },
    },
    {
      title: { en: "Rain Gauge", es: "Pluviómetro casero" },
      minutes: 15,
      materials: { en: "A clear plastic bottle with the top cut off (an adult cuts it), a ruler, tape, water, a flat spot outside", es: "Una botella de plástico transparente con la parte de arriba cortada (la corta un adulto), una regla, cinta, agua y un lugar plano afuera" },
      steps: {
        en: [
          "Tape the ruler to the side of the bottle. Add water up to the zero mark.",
          "Set the bottle in an open spot outside, away from trees and roofs.",
          "After it rains, check the level. Write how many inches or centimeters fell.",
          "Ask: how does this data help people who plan for floods?",
        ],
        es: [
          "Peguen la regla con cinta a un lado de la botella. Echen agua hasta la marca del cero.",
          "Pongan la botella en un lugar abierto afuera, lejos de árboles y techos.",
          "Después de que llueva, revisen el nivel. Anoten cuántas pulgadas o centímetros cayeron.",
          "Pregunten: ¿cómo ayudan estos datos a las personas que planean para las inundaciones?",
        ],
      },
    },
    {
      title: { en: "Flood Barrier Test", es: "Prueba de barrera contra inundaciones" },
      minutes: 20,
      materials: { en: "A baking pan, blocks or books, a sponge, a cup of water, small toy houses or cups", es: "Un molde para hornear, bloques o libros, una esponja, una taza de agua y casitas de juguete o vasitos" },
      steps: {
        en: [
          "Put toy houses at one end of the pan. Tilt the pan so water would run toward them.",
          "Pour water from the other end. See what happens to the houses.",
          "Build a barrier or a channel with blocks, or add a sponge to soak up water. Try again.",
          "Ask: which design protected the houses best? How do you know? Say what happened first, then, and as a result.",
        ],
        es: [
          "Pongan las casitas en un extremo del molde. Inclinen el molde para que el agua corra hacia ellas.",
          "Echen agua desde el otro extremo. Vean qué pasa con las casitas.",
          "Construyan una barrera o un canal con bloques, o pongan una esponja para absorber agua. Prueben otra vez.",
          "Pregunten: ¿qué diseño protegió mejor las casitas? ¿Cómo lo saben? Digan qué pasó primero, luego y como resultado.",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, [warm air] [carries vapor up].", es: "Primero, el [aire caliente] [lleva el vapor hacia arriba]." },
    { en: "Then the [vapor] [cools into clouds], so [heavy rain falls].", es: "Luego el [vapor] [se enfría y forma nubes], entonces [cae lluvia fuerte]." },
    { en: "As a result, a [flood] happens in [low streets].", es: "Como resultado, ocurre una [inundación] en [las calles bajas]." },
    { en: "The [climate] here is [hot] in [summer], but the [weather] today is [rainy].", es: "El [clima] aquí es [caluroso] en [verano], pero el [tiempo] de hoy es [lluvioso]." },
  ],
  help: {
    en: [
      "Ask \"what happened first? then? as a result?\" in any language.",
      "Let your child keep the weather log and explain the pattern.",
      "In a flood, never walk or drive through moving water. Turn around.",
      "Use safe things from the kitchen. Do the water tests in a pan or sink.",
    ],
    es: [
      "Pregunten \"¿qué pasó primero? ¿Luego? ¿Como resultado?\" en cualquier idioma.",
      "Dejen que su hijo o hija lleve el registro del tiempo y explique el patrón.",
      "En una inundación, nunca caminen ni manejen por agua que se mueve. Den la vuelta.",
      "Usen cosas seguras de la cocina. Hagan las pruebas con agua en un molde o en el fregadero.",
    ],
  },
  home_language: {
    en: "Many words are cousins: climate (clima), region (región), precipitation (precipitación), season (estación), design (diseño). Notice that Spanish uses one word, tiempo, for the weather today, and clima for the usual weather over years. Ask your child to explain the difference in both languages.",
    es: "Muchas palabras son primas: climate (clima), region (región), precipitation (precipitación), season (estación), design (diseño). Noten que en español se usa tiempo para el tiempo de hoy y clima para el tiempo habitual durante años. Pidan a su hijo o hija que explique la diferencia en los dos idiomas.",
  },
  celebrate: {
    en: "You will know it is working when your child looks outside, tells you the weather and the climate, and explains how a storm forms in order.",
    es: "Sabrán que está funcionando cuando su hijo o hija mire afuera, les diga el tiempo y el clima, y explique en orden cómo se forma una tormenta.",
  },
};

// BCPSS Family Guide (EN/ES) — g5-sci-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 5 Science unit on conservation of matter. Vocabulary order matches ../units/g5-sci-u1.mjs.

export default {
  summary: {
    en: "Your child is learning that matter is not lost when ice melts, sugar dissolves, or things mix. The pieces are too small to see, but they are still there, and a scale can prove it. It matters when you cook, make a drink, or watch a puddle dry. Your child will make a claim and back it up with measurements.",
    es: "Su hijo o hija está aprendiendo que la materia no se pierde cuando el hielo se derrite, el azúcar se disuelve o se mezclan cosas. Las partículas son muy pequeñas para verlas, pero siguen ahí, y una balanza puede probarlo. Sirve al cocinar, al preparar una bebida o al ver secarse un charco. Su hijo o hija hará una afirmación y la respaldará con medidas.",
  },
  goals: {
    en: [
      "I can use mass measurements to show matter is conserved.",
      "I can tell the difference between dissolving, melting, and mixing.",
      "I can make a claim and back it up with evidence.",
    ],
    es: [
      "Puedo usar medidas de masa para mostrar que la materia se conserva.",
      "Puedo decir la diferencia entre disolver, derretir y mezclar.",
      "Puedo hacer una afirmación y respaldarla con evidencia.",
    ],
  },
  vocab: [
    { term: "matter", def_es: "todo lo que ocupa espacio y tiene masa; en español se dice 'materia'", example_es: "El agua, el aire y la sal son materia." },
    { term: "particle", def_es: "un pedacito de materia tan pequeño que no se ve; en español se dice 'partícula'", example_es: "El azúcar disuelta sigue teniendo partículas." },
    { term: "mass", def_es: "la cantidad de materia que tiene un objeto, medida en gramos; en español se dice 'masa'", example_es: "La masa total fue de 60 gramos antes y después." },
    { term: "mixture", def_es: "dos o más sustancias juntas que no forman una sustancia nueva; en español se dice 'mezcla'", example_es: "El agua con sal es una mezcla." },
    { term: "dissolve", def_es: "mezclarse en un líquido tan bien que ya no se ven los pedacitos; en español se dice 'disolverse'", example_es: "El azúcar se disuelve en el té caliente." },
    { term: "property", def_es: "algo que puedes observar o probar de un material, como su color o dureza; en español se dice 'propiedad'", example_es: "Una propiedad del hielo es que es duro y frío." },
    { term: "evaporate", def_es: "pasar de líquido a gas; en español se dice 'evaporarse'", example_es: "El agua del charco se evapora al sol." },
    { term: "conserve", def_es: "mantener igual la cantidad total; en español se dice 'conservar'", example_es: "La masa se conserva cuando el azúcar se disuelve." },
    { term: "substance", def_es: "un solo tipo de material con sus propias propiedades, como la sal o el agua; en español se dice 'sustancia'", example_es: "La sal es una sustancia." },
  ],
  talk: [
    { en: "What did you measure before? What did you measure after?", es: "¿Qué mediste antes? ¿Qué mediste después?" },
    { en: "Did any matter disappear? How do you know?", es: "¿Desapareció algo de materia? ¿Cómo lo sabes?" },
    { en: "What is your claim, and what is your evidence?", es: "¿Cuál es tu afirmación y cuál es tu evidencia?" },
    { en: "How are dissolving and melting different?", es: "¿En qué se diferencian disolver y derretir?" },
    { en: "Where did you see a mixture today?", es: "¿Dónde viste una mezcla hoy?" },
  ],
  try_at_home: [
    {
      title: { en: "Sugar Disappears?", es: "¿Desaparece el azúcar?" },
      minutes: 15,
      materials: { en: "A kitchen scale (grams), a cup, warm water, a spoon of sugar, a stirring spoon", es: "Una balanza de cocina (gramos), un vaso, agua tibia, una cucharada de azúcar y una cuchara para mezclar" },
      steps: {
        en: [
          "Weigh the cup with the water in it, and the sugar on a separate dish. Write the total mass.",
          "Pour the sugar in and stir until you cannot see it.",
          "Weigh the cup again with the spoon removed, and compare. The sugar dissolved, but the particles are still there.",
          "Say: the mass was [number] grams before and [number] grams after, so matter was conserved.",
        ],
        es: [
          "Pesen el vaso con el agua y el azúcar en un plato aparte. Anoten la masa total.",
          "Echen el azúcar y revuelvan hasta que ya no se vea.",
          "Pesen otra vez el vaso con la cuchara fuera y comparen. El azúcar se disolvió, pero las partículas siguen ahí.",
          "Digan: la masa fue de [número] gramos antes y de [número] gramos después, entonces la materia se conservó.",
        ],
      },
    },
    {
      title: { en: "Ice in a Bag", es: "Hielo en una bolsa" },
      minutes: 15,
      materials: { en: "A kitchen scale, a zip bag, ice cubes", es: "Una balanza de cocina, una bolsa con cierre y cubos de hielo" },
      steps: {
        en: [
          "Put ice cubes in the bag, seal it tight, and weigh it. Write the mass.",
          "Let the ice melt completely.",
          "Weigh the sealed bag again. Compare the two numbers.",
          "Ask: did the ice disappear? Why does the mass stay the same?",
        ],
        es: [
          "Pongan cubos de hielo en la bolsa, ciérrenla bien y pésenla. Anoten la masa.",
          "Dejen que el hielo se derrita por completo.",
          "Pesen otra vez la bolsa cerrada. Comparen los dos números.",
          "Pregunten: ¿desapareció el hielo? ¿Por qué la masa sigue igual?",
        ],
      },
    },
    {
      title: { en: "Salt from the Bay", es: "Sal de la bahía" },
      minutes: 10,
      materials: { en: "A saucer, warm water, 2 spoons of salt, a sunny windowsill", es: "Un platito, agua tibia, 2 cucharadas de sal y un alféizar con sol" },
      steps: {
        en: [
          "Stir the salt into the water until it dissolves. Pour a thin layer into the saucer.",
          "Put the saucer in a sunny spot for a few days.",
          "Check each day. The water evaporates, but what is left behind?",
          "Say: according to our data, the salt dissolved, but its particles are still there.",
        ],
        es: [
          "Revuelvan la sal en el agua hasta que se disuelva. Echen una capa fina en el platito.",
          "Pongan el platito en un lugar con sol durante unos días.",
          "Revisen cada día. El agua se evapora, pero ¿qué queda?",
          "Digan: según nuestros datos, la sal se disolvió, pero sus partículas siguen ahí.",
        ],
      },
    },
    {
      title: { en: "Bottle Fizz Test", es: "Prueba de burbujeo en botella" },
      minutes: 15,
      materials: { en: "A small bottle, a balloon, baking soda, vinegar, a kitchen scale", es: "Una botellita, un globo, bicarbonato, vinagre y una balanza de cocina" },
      steps: {
        en: [
          "Put vinegar in the bottle and baking soda in the balloon. Fit the balloon over the bottle without spilling.",
          "Weigh the whole thing. Write the mass.",
          "Lift the balloon so the baking soda falls in. Watch the fizz fill the balloon.",
          "Weigh again. Ask: did the mass change? A new gas formed, but nothing escaped.",
        ],
        es: [
          "Pongan vinagre en la botella y bicarbonato en el globo. Coloquen el globo en la boca de la botella sin derramar.",
          "Pesen todo junto. Anoten la masa.",
          "Levanten el globo para que el bicarbonato caiga. Miren cómo el burbujeo llena el globo.",
          "Pesen otra vez. Pregunten: ¿cambió la masa? Se formó un gas nuevo, pero nada se escapó.",
        ],
      },
    },
  ],
  say_it: [
    { en: "My claim is that [matter was conserved].", es: "Mi afirmación es que [la materia se conservó]." },
    { en: "I know this because the mass was [number] grams before and [number] grams after.", es: "Lo sé porque la masa fue de [número] gramos antes y de [número] gramos después." },
    { en: "According to our data, the [sugar] [dissolved], but its particles are still [there].", es: "Según nuestros datos, el [azúcar] [se disolvió], pero sus partículas siguen [ahí]." },
    { en: "The [mixture] has two [substances] that kept their [properties].", es: "La [mezcla] tiene dos [sustancias] que conservaron sus [propiedades]." },
  ],
  help: {
    en: [
      "Ask \"how do you know?\" and \"what is your evidence?\" in any language.",
      "Let your child do the weighing and writing. You can read the scale together.",
      "No scale at home? Your child can predict and explain, then check at school.",
      "Only taste food that an adult says is safe. Never taste lab experiments.",
    ],
    es: [
      "Pregunten \"¿cómo lo sabes?\" y \"¿cuál es tu evidencia?\" en cualquier idioma.",
      "Dejen que su hijo o hija pese y escriba. Ustedes pueden leer la balanza juntos.",
      "¿No hay balanza en casa? Su hijo o hija puede predecir y explicar, y luego comprobar en la escuela.",
      "Solo prueben alimentos que un adulto diga que son seguros. Nunca prueben los experimentos.",
    ],
  },
  home_language: {
    en: "Many words are cousins: matter (materia), particle (partícula), mass (masa), mixture (mezcla), substance (sustancia), property (propiedad), conserve (conservar). Explain your claim in Spanish first, then say it again in English.",
    es: "Muchas palabras son primas: matter (materia), particle (partícula), mass (masa), mixture (mezcla), substance (sustancia), property (propiedad), conserve (conservar). Expliquen primero la afirmación en español y luego repítanla en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child shows you two measurements and uses them to prove that matter was not lost.",
    es: "Sabrán que está funcionando cuando su hijo o hija les muestre dos medidas y las use para probar que la materia no se perdió.",
  },
};

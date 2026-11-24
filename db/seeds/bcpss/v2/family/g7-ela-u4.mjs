// BCPSS Family Guide (EN/ES) — g7-ela-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 7 ELA unit on the 1793 Philadelphia yellow fever epidemic. Vocabulary order matches ../units/g7-ela-u4.mjs.

export default {
  summary: {
    en: "Your child is reading about the 1793 yellow fever epidemic in Philadelphia: what caused it to spread so fast, and how it changed the way a city cares for its people. Children practice explaining a chain of causes and effects. It matters because clean water, health care, and neighbors helping neighbors affect every community, including Baltimore. Your child will practice linking causes to effects with clear words.",
    es: "Su hijo o hija está leyendo sobre la epidemia de fiebre amarilla de 1793 en Filadelfia: qué hizo que se propagara tan rápido y cómo cambió la manera en que una ciudad cuida a su gente. Practica explicar una cadena de causas y efectos. Sirve porque el agua limpia, la atención médica y los vecinos que se ayudan afectan a todas las comunidades, incluida Baltimore. Su hijo o hija practicará unir causas con efectos con palabras claras.",
  },
  goals: {
    en: [
      "I can explain the causes and effects of the 1793 yellow fever epidemic.",
      "I can explain a chain of events with a cause, a linking word like leads to, and the effect.",
    ],
    es: [
      "Puedo explicar las causas y los efectos de la epidemia de fiebre amarilla de 1793.",
      "Puedo explicar una cadena de sucesos con una causa, una palabra de enlace como lleva a y el efecto.",
    ],
  },
  vocab: [
    { term: "epidemic", def_es: "una enfermedad que se propaga rápido en una comunidad y enferma a muchas personas a la vez", example_es: "La epidemia llenó los hospitales de la ciudad." },
    { term: "quarantine", def_es: "un tiempo en que se mantiene aparte a los enfermos o viajeros para que la enfermedad no se propague", example_es: "Los barcos tuvieron que esperar en cuarentena." },
    { term: "catalyst", def_es: "un suceso o cosa que hace que un gran cambio ocurra rápidamente", example_es: "La epidemia fue un catalizador para mejorar la limpieza." },
    { term: "symptom", def_es: "una señal en tu cuerpo que muestra que estás enfermo, como fiebre o dolor de cabeza", example_es: "La fiebre alta es un síntoma de la enfermedad." },
    { term: "sanitation", def_es: "mantener limpios el agua, las calles y la basura para que la gente esté sana", example_es: "El saneamiento evita que se propaguen las enfermedades." },
    { term: "civic duty", def_es: "la responsabilidad de ayudar a tu comunidad y seguir sus reglas justas", example_es: "Ayudar a los vecinos enfermos fue un deber cívico." },
    { term: "cause", def_es: "la razón por la que algo pasa", example_es: "Una causa fue el agua estancada cerca del puerto." },
    { term: "effect", def_es: "lo que pasa a causa de una causa", example_es: "Un efecto fue que miles de familias huyeron." },
    { term: "consequence", def_es: "algo que pasa como resultado de una acción o una decisión", example_es: "Una consecuencia fue que se crearon nuevos hospitales." },
  ],
  talk: [
    { en: "What caused the epidemic to spread so fast?", es: "¿Qué hizo que la epidemia se propagara tan rápido?" },
    { en: "What were the effects on families, work, and the city?", es: "¿Qué efectos tuvo en las familias, el trabajo y la ciudad?" },
    { en: "How did people help each other? What does civic duty mean to you?", es: "¿Cómo se ayudó la gente? ¿Qué significa para ti el deber cívico?" },
    { en: "What changed after the epidemic? How do we see those changes today?", es: "¿Qué cambió después de la epidemia? ¿Cómo vemos esos cambios hoy?" },
    { en: "Where did you find that in the text?", es: "¿Dónde del texto lo encontraste?" },
  ],
  try_at_home: [
    {
      title: { en: "Cause-Effect Chain", es: "Cadena de causa y efecto" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Write the first cause from the reading, like \"mosquitoes bred in standing water.\"",
          "Draw an arrow. Write the next effect, like \"yellow fever spread.\"",
          "Keep adding links. Say each one with \"leads to\" or \"as a result.\"",
          "Read the whole chain aloud.",
        ],
        es: [
          "Escriban la primera causa del texto, como \"los mosquitos se criaron en agua estancada\".",
          "Dibujen una flecha. Escriban el siguiente efecto, como \"la fiebre amarilla se propagó\".",
          "Sigan agregando eslabones. Díganlos con \"lleva a\" o \"como resultado\".",
          "Lean toda la cadena en voz alta.",
        ],
      },
    },
    {
      title: { en: "Clean Neighborhood Walk", es: "Paseo por el vecindario limpio" },
      minutes: 15,
      materials: { en: "A short walk and a pencil", es: "Una caminata corta y un lápiz" },
      steps: {
        en: [
          "Walk around the block. Look for signs of sanitation: trash cans, clean streets, drains.",
          "Ask: what could go wrong if this were missing?",
          "Ask: who is responsible? What is our civic duty?",
          "Your child writes one cause and effect they noticed.",
        ],
        es: [
          "Caminen por la cuadra. Busquen señales de saneamiento: botes de basura, calles limpias, desagües.",
          "Pregunten: ¿qué podría pasar si esto faltara?",
          "Pregunten: ¿quién es responsable? ¿Cuál es nuestro deber cívico?",
          "Su hijo o hija escribe una causa y un efecto que notó.",
        ],
      },
    },
    {
      title: { en: "Health Plan for the Family", es: "Plan de salud para la familia" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Ask: what do we do when someone at home is sick? Make a short list.",
          "For each step, ask: what is the cause? What is the effect?",
          "Talk about symptoms and when to ask a doctor.",
          "Your child writes one \"if ... then\" sentence.",
        ],
        es: [
          "Pregunten: ¿qué hacemos cuando alguien en casa está enfermo? Hagan una lista corta.",
          "Por cada paso, pregunten: ¿cuál es la causa? ¿Cuál es el efecto?",
          "Hablen de los síntomas y de cuándo consultar a un médico.",
          "Su hijo o hija escribe una oración con \"si ... entonces\".",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because [cause], [effect], and as a result ___.", es: "Como [causa], [efecto], y como resultado ___." },
    { en: "[Cause] leads to [effect].", es: "[Causa] lleva a [efecto]." },
    { en: "One consequence of the epidemic was ___.", es: "Una consecuencia de la epidemia fue ___." },
  ],
  help: {
    en: [
      "Ask \"what caused that, and what happened next?\" about anything you read or see.",
      "Ask your child to explain the chain of events step by step.",
      "Share your own experiences with health care or community help, if you wish.",
      "Do not worry about medical words. Use the picture and your child's explanation.",
    ],
    es: [
      "Pregunten \"¿qué causó eso y qué pasó después?\" sobre cualquier cosa que lean o vean.",
      "Pidan a su hijo o hija que explique la cadena de sucesos paso a paso.",
      "Compartan sus propias experiencias con la atención médica o la ayuda de la comunidad, si lo desean.",
      "No se preocupen por las palabras médicas. Usen la imagen y la explicación de su hijo o hija.",
    ],
  },
  home_language: {
    en: "Say the cause-and-effect chain in Spanish first. Many words match: epidemic/epidemia, quarantine/cuarentena, symptom/síntoma, catalyst/catalizador, sanitation/saneamiento, consequence/consecuencia.",
    es: "Digan primero en español la cadena de causa y efecto. Muchas palabras coinciden: epidemic/epidemia, quarantine/cuarentena, symptom/síntoma, catalyst/catalizador, sanitation/saneamiento, consequence/consecuencia.",
  },
  celebrate: {
    en: "You will know it is working when your child can explain a chain of causes and effects from the text using linking words like leads to and as a result.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda explicar una cadena de causas y efectos del texto usando palabras de enlace como lleva a y como resultado.",
  },
};

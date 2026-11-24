// BCPSS Family Guide (EN/ES) — g2-sci-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 2 Science unit on materials and their properties. Vocabulary order matches ../units/g2-sci-u1.mjs.

export default {
  summary: {
    en: "Your child is learning how to tell what a material is like: solid or liquid, rough or smooth, bendy or stiff. Your child also learns that some changes can be undone, like ice melting and freezing again, and some cannot, like toast. It matters in the kitchen, in the snow, and on every walk.",
    es: "Su hijo o hija está aprendiendo a decir cómo es un material: sólido o líquido, áspero o liso, flexible o duro. También aprende que algunos cambios se pueden deshacer, como el hielo que se derrite y se vuelve a congelar, y otros no, como el pan tostado. Sirve en la cocina, en la nieve y en cada paseo.",
  },
  goals: {
    en: [
      "I can sort things as solids or liquids by what I observe.",
      "I can describe a material by how it looks and feels.",
      "I can tell if a change can be undone, and why.",
    ],
    es: [
      "Puedo clasificar cosas como sólidos o líquidos según lo que observo.",
      "Puedo describir un material por cómo se ve y cómo se siente.",
      "Puedo decir si un cambio se puede deshacer, y por qué.",
    ],
  },
  vocab: [
    { term: "matter", def_es: "todo lo que ocupa espacio; los sólidos, los líquidos y el aire son materia", example_es: "El aire dentro de un globo es materia porque ocupa espacio." },
    { term: "property", def_es: "algo que puedes observar de una cosa, como su color o cómo se siente", example_es: "Una propiedad de la esponja es que es blanda." },
    { term: "solid", def_es: "materia que mantiene su propia forma, como una piedra o un lápiz", example_es: "El ladrillo es un sólido porque mantiene su forma." },
    { term: "liquid", def_es: "materia que fluye y toma la forma del vaso donde está", example_es: "El jugo es un líquido porque se derrama." },
    { term: "melt", def_es: "pasar de sólido a líquido cuando hace calor", example_es: "El hielo se derrite al sol." },
    { term: "freeze", def_es: "pasar de líquido a sólido cuando hace mucho frío", example_es: "El agua se congela en el congelador." },
    { term: "reversible", def_es: "que se puede cambiar de vuelta a como estaba; es casi igual en inglés", example_es: "Derretir hielo es reversible porque se puede volver a congelar." },
    { term: "texture", def_es: "cómo se siente algo cuando lo tocas; es casi igual en inglés", example_es: "La textura de la lija es áspera." },
    { term: "flexible", def_es: "que se puede doblar sin romperse; se escribe igual en español", example_es: "Una liga es flexible." },
    { term: "observe", def_es: "mirar con atención y notar detalles con los sentidos; en español se dice 'observar'", example_es: "Voy a observar el hielo mientras se derrite." },
  ],
  talk: [
    { en: "Is it a solid or a liquid? How do you know?", es: "¿Es un sólido o un líquido? ¿Cómo lo sabes?" },
    { en: "How does it feel? Is it rough, smooth, or soft?", es: "¿Cómo se siente? ¿Es áspero, liso o suave?" },
    { en: "What happens when it gets warm? And when it gets cold?", es: "¿Qué pasa cuando se calienta? ¿Y cuando se enfría?" },
    { en: "Can we change it back? Why or why not?", es: "¿Podemos volver a cambiarlo? ¿Por qué sí o por qué no?" },
    { en: "What did you observe with your eyes and hands today?", es: "¿Qué observaste hoy con los ojos y las manos?" },
  ],
  try_at_home: [
    {
      title: { en: "Ice Cube Race", es: "La carrera de los cubos de hielo" },
      minutes: 15,
      materials: { en: "Ice cubes, 2 small plates, a sunny window or a warm spot, a cool spot", es: "Cubos de hielo, 2 platos pequeños, una ventana con sol o un lugar tibio, y un lugar fresco" },
      steps: {
        en: [
          "Put one ice cube on each plate. Put one plate in a warm spot and one in a cool spot.",
          "Watch for 10 minutes. Ask: what is happening to the ice?",
          "Ask: is it a solid or a liquid now? How do you know?",
          "Put the water back in the freezer. Ask: can we change it back? That is reversible.",
        ],
        es: [
          "Pongan un cubo de hielo en cada plato. Pongan un plato en un lugar tibio y otro en un lugar fresco.",
          "Observen durante 10 minutos. Pregunten: ¿qué le pasa al hielo?",
          "Pregunten: ¿ahora es sólido o líquido? ¿Cómo lo saben?",
          "Pongan el agua otra vez en el congelador. Pregunten: ¿podemos volver a cambiarlo? Eso es reversible.",
        ],
      },
    },
    {
      title: { en: "Mystery Bag", es: "La bolsa misteriosa" },
      minutes: 10,
      materials: { en: "A paper bag, 5 small safe things (sponge, spoon, cotton ball, rubber band, sandpaper)", es: "Una bolsa de papel y 5 cosas pequeñas y seguras (esponja, cuchara, bola de algodón, liga, lija)" },
      steps: {
        en: [
          "Put the things in the bag. Your child reaches in without looking.",
          "Ask: how does it feel? Rough, smooth, soft, or bendy?",
          "Guess what it is, then pull it out to check.",
          "Sort them: which are flexible? Which are not?",
        ],
        es: [
          "Pongan las cosas en la bolsa. Su hijo o hija mete la mano sin mirar.",
          "Pregunten: ¿cómo se siente? ¿Áspero, liso, suave o flexible?",
          "Adivinen qué es y luego sáquenlo para comprobar.",
          "Clasifíquenlos: ¿cuáles son flexibles? ¿Cuáles no?",
        ],
      },
    },
    {
      title: { en: "Solid or Liquid Kitchen Sort", es: "Clasificar en la cocina: sólido o líquido" },
      minutes: 10,
      materials: { en: "A spoon, a cup of water, a glass of juice, a bowl, an ice cube, a pan, 3 clear cups", es: "Una cuchara, un vaso de agua, un vaso de jugo, un tazón, un cubo de hielo, una sartén y 3 vasos transparentes" },
      steps: {
        en: [
          "Put the spoon, bowl, pan, and ice cube on one side. Put water and juice on the other.",
          "Pour the water from one cup into a different cup. Ask: what happened to its shape?",
          "Try to pour a spoon. Ask: does it change shape?",
          "Say: a [thing] is a solid because it keeps its shape.",
        ],
        es: [
          "Pongan la cuchara, el tazón, la sartén y el cubo de hielo de un lado. Pongan el agua y el jugo del otro.",
          "Echen el agua de un vaso a otro vaso. Pregunten: ¿qué le pasó a su forma?",
          "Traten de verter una cuchara. Pregunten: ¿cambia de forma?",
          "Digan: un [objeto] es un sólido porque mantiene su forma.",
        ],
      },
    },
    {
      title: { en: "Toast and Butter", es: "Pan tostado y mantequilla" },
      minutes: 10,
      materials: { en: "Bread and a toaster or pan with an adult, a little butter", es: "Pan y una tostadora o sartén con un adulto, un poco de mantequilla" },
      steps: {
        en: [
          "Look at a slice of bread. Ask: how does it look, smell, and feel?",
          "With an adult, toast it. Look again. What changed?",
          "Ask: can you un-toast it? This change is not reversible.",
          "Put butter on the warm toast. It melts. Chill a bit of melted butter in the fridge. It hardens again, so that change is reversible.",
        ],
        es: [
          "Miren una rebanada de pan. Pregunten: ¿cómo se ve, huele y se siente?",
          "Con un adulto, tuéstenla. Miren otra vez. ¿Qué cambió?",
          "Pregunten: ¿se puede destostar? Este cambio no es reversible.",
          "Pongan mantequilla en el pan caliente. Se derrite. Enfríen un poco de mantequilla derretida en el refrigerador. Se endurece otra vez, así que ese cambio es reversible.",
        ],
      },
    },
  ],
  say_it: [
    { en: "A [brick] is a [solid] because it [keeps its shape].", es: "Un [ladrillo] es un [sólido] porque [mantiene su forma]." },
    { en: "It feels [rough / smooth / soft].", es: "Se siente [áspero / liso / suave]." },
    { en: "The change is [reversible] because [reason].", es: "El cambio es [reversible] porque [razón]." },
    { en: "I observe that the [ice] [melts] when it is [warm].", es: "Observo que el [hielo] [se derrite] cuando está [tibio]." },
  ],
  help: {
    en: [
      "Ask \"what do you notice?\" and wait. Your child is the scientist.",
      "Say \"how do you know?\" in any language.",
      "Look, touch, and listen. Only taste food that an adult says is safe.",
      "Let your child try again after a wrong guess.",
    ],
    es: [
      "Pregunten \"¿qué notas?\" y esperen. Su hijo o hija es el científico.",
      "Digan \"¿cómo lo sabes?\" en cualquier idioma.",
      "Miren, toquen y escuchen. Solo prueben alimentos que un adulto diga que son seguros.",
      "Dejen que su hijo o hija lo intente otra vez después de una idea equivocada.",
    ],
  },
  home_language: {
    en: "Say the property words in Spanish and English together: sólido and solid, líquido and liquid, textura and texture, flexible and flexible, reversible and reversible. Ask: which word is the same in both languages?",
    es: "Digan juntos las palabras de propiedades en español e inglés: sólido y solid, líquido y liquid, textura y texture, flexible y flexible, reversible y reversible. Pregunten: ¿cuál palabra es igual en los dos idiomas?",
  },
  celebrate: {
    en: "You will know it is working when your child picks up an object, tells you if it is a solid or liquid, describes how it feels, and gives a reason.",
    es: "Sabrán que está funcionando cuando su hijo o hija tome un objeto, les diga si es sólido o líquido, describa cómo se siente y dé una razón.",
  },
};

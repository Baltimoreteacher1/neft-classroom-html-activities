// BCPSS Family Guide (EN/ES) — g7-sci-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 7 Science unit on chemical reactions and soap. Vocabulary order matches ../units/g7-sci-u1.mjs.

export default {
  summary: {
    en: "Your child is learning how a chemical reaction turns starting materials into a brand-new substance, like fat and lye turning into soap, and why the total mass stays the same. It matters in the kitchen, when baking soda fizzes in vinegar, and when iron rusts. Your child will back up each idea with a claim and evidence from measurements.",
    es: "Su hijo o hija está aprendiendo cómo una reacción química convierte los materiales del comienzo en una sustancia totalmente nueva, como la grasa y la lejía que se vuelven jabón, y por qué la masa total se queda igual. Importa en la cocina, cuando el bicarbonato hace espuma con el vinagre, y cuando el hierro se oxida. Su hijo o hija apoyará cada idea con una afirmación y evidencia de mediciones.",
  },
  goals: {
    en: [
      "I can tell the reactants from the products in a reaction.",
      "I can use properties to show that a new substance was made.",
      "I can use mass measurements as evidence that atoms are only rearranged.",
    ],
    es: [
      "Puedo distinguir los reactivos de los productos en una reacción.",
      "Puedo usar las propiedades para mostrar que se formó una sustancia nueva.",
      "Puedo usar mediciones de masa como evidencia de que los átomos solo se reordenan.",
    ],
  },
  vocab: [
    { term: "chemical reaction", def_es: "un proceso en el que los materiales del comienzo se convierten en materiales nuevos con propiedades distintas", example_es: "Cuando el hierro se oxida ocurre una reacción química." },
    { term: "reactant", def_es: "un material del comienzo que cambia durante una reacción", example_es: "El vinagre y el bicarbonato son los reactivos de la espuma." },
    { term: "product", def_es: "un material nuevo que se forma cuando termina una reacción", example_es: "El gas que sale de la espuma es uno de los productos." },
    { term: "property", def_es: "una característica de un material que se puede observar o medir, como el color o el punto de fusión", example_es: "El color y la dureza son propiedades del jabón." },
    { term: "substance", def_es: "una clase de materia con su propio conjunto de propiedades", example_es: "El agua y la sal son dos sustancias distintas." },
    { term: "density", def_es: "cuánta masa hay en cierto espacio; qué tan apretada está la materia", example_es: "El aceite flota porque tiene menos densidad que el agua." },
    { term: "conservation of mass", def_es: "la regla de que la masa total no cambia en una reacción dentro de un recipiente cerrado", example_es: "Por la conservación de la masa, la bolsa cerrada pesó lo mismo antes y después." },
    { term: "atom", def_es: "una partícula diminuta con la que está hecha toda la materia; se parece a la palabra en inglés", example_es: "Los átomos solo se reordenan durante una reacción." },
    { term: "evidence", def_es: "datos, mediciones u observaciones que apoyan una afirmación", example_es: "La lectura de la balanza es evidencia de que la masa no cambió." },
    { term: "claim", def_es: "una afirmación que responde una pregunta y que hay que apoyar con evidencia", example_es: "Mi afirmación es que se formó una sustancia nueva." },
  ],
  talk: [
    { en: "What did you see change in your kitchen today: color, smell, bubbles, or heat?", es: "¿Qué cambio viste hoy en la cocina: color, olor, burbujas o calor?" },
    { en: "How can you tell a new substance was made, and not just mixed?", es: "¿Cómo puedes saber que se formó una sustancia nueva y no solo una mezcla?" },
    { en: "If something burns or fizzes, where do you think the matter goes?", es: "Si algo se quema o hace espuma, ¿adónde crees que va la materia?" },
    { en: "What would you measure to prove that nothing was lost?", es: "¿Qué medirías para probar que no se perdió nada?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Fizz in a Bag", es: "Espuma en una bolsa" },
      minutes: 15,
      materials: { en: "A zip bag, baking soda, vinegar, a small cup, a kitchen scale if you have one", es: "Una bolsa con cierre, bicarbonato de sodio, vinagre, un vasito y una balanza de cocina si tienen" },
      steps: {
        en: [
          "Put a spoon of baking soda in the bag. Stand the small cup of vinegar inside, without spilling.",
          "If you have a scale, weigh the closed bag. Write the number down.",
          "Tip the cup so the vinegar mixes with the baking soda. Seal the bag and watch it fizz.",
          "Weigh the bag again. Ask: did the mass change? Where did the gas go? How do you know?",
        ],
        es: [
          "Pongan una cucharada de bicarbonato en la bolsa. Paren dentro el vasito con vinagre, sin que se derrame.",
          "Si tienen balanza, pesen la bolsa cerrada. Anoten el número.",
          "Inclinen el vasito para que el vinagre se mezcle con el bicarbonato. Cierren la bolsa y miren la espuma.",
          "Pesen la bolsa otra vez. Pregunten: ¿cambió la masa? ¿Adónde fue el gas? ¿Cómo lo saben?",
        ],
      },
    },
    {
      title: { en: "Rust and Browning Watch", es: "Observar óxido y oscurecimiento" },
      minutes: 10,
      materials: { en: "Two apple slices, a bit of lemon juice, a plate, a steel wool pad or old nail with a little water (optional)", es: "Dos rodajas de manzana, un poco de jugo de limón, un plato y, si quieren, una esponja de acero o un clavo viejo con un poco de agua" },
      steps: {
        en: [
          "Put lemon juice on one apple slice and leave the other plain.",
          "Check both slices every ten minutes. Write down what you see: color, texture, smell.",
          "Ask: what new property appeared? Is that a sign of a new substance?",
          "If you have an old nail, put it in a damp cloth for a day and look for rust. How is rust different from iron?",
        ],
        es: [
          "Pongan jugo de limón en una rodaja de manzana y dejen la otra sin nada.",
          "Revisen las dos rodajas cada diez minutos. Anoten lo que ven: color, textura, olor.",
          "Pregunten: ¿qué propiedad nueva apareció? ¿Es una señal de una sustancia nueva?",
          "Si tienen un clavo viejo, pónganlo un día en un trapo húmedo y busquen óxido. ¿En qué se diferencia el óxido del hierro?",
        ],
      },
    },
    {
      title: { en: "Oil and Water Density", es: "Densidad del aceite y el agua" },
      minutes: 10,
      materials: { en: "A clear glass, water, cooking oil, a drop of food coloring, a small spoon", es: "Un vaso transparente, agua, aceite de cocina, una gota de colorante y una cucharita" },
      steps: {
        en: [
          "Fill the glass halfway with water. Add a few drops of food coloring.",
          "Slowly pour in the same amount of oil. Which layer is on top?",
          "Ask your child to explain: the oil is less dense than water, so it floats.",
          "Try honey or syrup if you have it. Where does it settle? Compare the densities.",
        ],
        es: [
          "Llenen el vaso hasta la mitad con agua. Agreguen unas gotas de colorante.",
          "Echen despacio la misma cantidad de aceite. ¿Qué capa queda arriba?",
          "Pidan a su hijo o hija que explique: el aceite es menos denso que el agua, por eso flota.",
          "Prueben con miel o jarabe si tienen. ¿Dónde se queda? Comparen las densidades.",
        ],
      },
    },
    {
      title: { en: "Kitchen Reaction Hunt", es: "Cacería de reacciones en la cocina" },
      minutes: 10,
      materials: { en: "Your kitchen, paper, and a pencil", es: "La cocina, papel y lápiz" },
      steps: {
        en: [
          "Look around for changes that make something new: toast browning, an egg cooking, bread rising, an old banana.",
          "Write each one on the paper. Beside it, write the reactants and the new property.",
          "Ask: how is melting an ice cube different from toasting bread? Which one made a new substance?",
          "Pick one and make a claim with evidence: \"I know a new substance formed because ...\"",
        ],
        es: [
          "Busquen cambios que producen algo nuevo: el pan que se tuesta, un huevo que se cocina, la masa que sube, un plátano viejo.",
          "Escriban cada uno en el papel. Al lado, anoten los reactivos y la propiedad nueva.",
          "Pregunten: ¿en qué se diferencia derretir un hielo de tostar pan? ¿Cuál formó una sustancia nueva?",
          "Elijan uno y hagan una afirmación con evidencia: \"Sé que se formó una sustancia nueva porque ...\"",
        ],
      },
    },
  ],
  say_it: [
    { en: "The [reactants] are [vinegar] and [baking soda].", es: "Los [reactivos] son el [vinagre] y el [bicarbonato]." },
    { en: "A new substance formed because the [color] changed.", es: "Se formó una sustancia nueva porque cambió el [color]." },
    { en: "The total mass stayed the same, so the [atoms] were only ___.", es: "La masa total quedó igual, entonces los [átomos] solo se ___." },
    { en: "My claim is [claim], and my evidence is [evidence].", es: "Mi afirmación es [afirmación] y mi evidencia es [evidencia]." },
  ],
  help: {
    en: [
      "You do not need to know chemistry. Ask, \"What changed?\" and \"How do you know it is something new?\"",
      "Do kitchen experiments together, but only an adult handles the stove, hot water, or cleaning products.",
      "Never mix cleaning products. Baking soda and vinegar are the safe pair for home tests.",
      "Say \"what is your evidence?\" instead of \"is that right?\"",
    ],
    es: [
      "No necesitan saber química. Pregunten \"¿qué cambió?\" y \"¿cómo sabes que es algo nuevo?\"",
      "Hagan los experimentos de cocina juntos, pero que solo un adulto use la estufa, el agua caliente o productos de limpieza.",
      "Nunca mezclen productos de limpieza. El bicarbonato y el vinagre son la pareja segura para las pruebas en casa.",
      "Digan \"¿cuál es tu evidencia?\" en vez de \"¿está bien?\"",
    ],
  },
  home_language: {
    en: "Describe the fizz in Spanish first: \"la burbuja, el gas, la mezcla.\" Then match the English words. Reaction, product, density, atom, and substance are close to the Spanish words (reacción, producto, densidad, átomo, sustancia), so your child already knows many of them.",
    es: "Describan primero la espuma en español: \"la burbuja, el gas, la mezcla\". Después busquen las palabras en inglés. Reaction, product, density, atom y substance se parecen a las palabras en español (reacción, producto, densidad, átomo, sustancia), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child sees something change in the kitchen and explains, in any language, what the new property is and why the total mass stayed the same.",
    es: "Sabrán que está funcionando cuando su hijo o hija vea un cambio en la cocina y explique, en el idioma que quiera, cuál es la propiedad nueva y por qué la masa total quedó igual.",
  },
};

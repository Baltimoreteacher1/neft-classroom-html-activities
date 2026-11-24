// BCPSS Family Guide (EN/ES) — g8-sci-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 8 Science unit on genetics. Vocabulary order matches ../units/g8-sci-u2.mjs.

export default {
  summary: {
    en: "Your child is learning how traits, like the color of a flower, pass from parents to offspring through genes. Some versions of a gene show up and some stay hidden for a generation. Your child will use a Punnett square to predict the chances, and will learn that a hidden trait is not gone, and that dominant does not mean stronger or more common.",
    es: "Su hijo o hija está aprendiendo cómo los rasgos, como el color de una flor, pasan de los padres a las crías por medio de los genes. Algunas versiones de un gen se ven y otras se quedan ocultas por una generación. Su hijo o hija usará un cuadro de Punnett para predecir las probabilidades y aprenderá que un rasgo oculto no desaparece, y que dominante no quiere decir más fuerte ni más común.",
  },
  goals: {
    en: [
      "I can explain how a dominant allele and a recessive allele work.",
      "I can use a Punnett square to predict chances for offspring.",
      "I can use evidence to explain why a trait can seem to disappear and then return.",
    ],
    es: [
      "Puedo explicar cómo funcionan un alelo dominante y uno recesivo.",
      "Puedo usar un cuadro de Punnett para predecir las probabilidades de las crías.",
      "Puedo usar evidencia para explicar por qué un rasgo puede parecer desaparecer y luego volver.",
    ],
  },
  vocab: [
    { term: "trait", def_es: "una característica de un ser vivo que puede pasar de padres a crías", example_es: "El color de la flor es un rasgo de la planta." },
    { term: "gene", def_es: "una parte del ADN con las instrucciones para formar una parte de un ser vivo; se parece a la palabra en inglés", example_es: "Un gen tiene las instrucciones para el color de la flor." },
    { term: "allele", def_es: "una versión de un gen", example_es: "Una planta puede tener un alelo para flor morada y otro para flor blanca." },
    { term: "dominant", def_es: "un alelo cuyo rasgo se ve aunque solo haya una copia", example_es: "El alelo dominante hace que la flor sea morada." },
    { term: "recessive", def_es: "un alelo cuyo rasgo se ve solo cuando hay dos copias", example_es: "La flor blanca sale cuando la planta tiene dos alelos recesivos." },
    { term: "genotype", def_es: "el par de alelos que tiene un ser vivo para un rasgo", example_es: "El genotipo Pp tiene un alelo dominante y uno recesivo." },
    { term: "phenotype", def_es: "los rasgos que se pueden observar en un ser vivo", example_es: "El fenotipo de la planta es flor morada." },
    { term: "mutation", def_es: "un cambio en la secuencia del ADN de un gen; se parece a la palabra en inglés", example_es: "Una mutación puede cambiar el color de una flor." },
    { term: "Punnett square", def_es: "una cuadrícula que predice las probabilidades de los distintos pares de alelos en las crías", example_es: "En el cuadro de Punnett, tres de cuatro crías podrían tener flores moradas." },
    { term: "evidence", def_es: "datos o hechos que muestran que una afirmación es cierta", example_es: "Los números de plantas moradas y blancas son evidencia de la regla." },
  ],
  talk: [
    { en: "What traits do plants, pets, or animals you know have? Which ones look alike?", es: "¿Qué rasgos tienen las plantas, las mascotas o los animales que conoces? ¿Cuáles se parecen?" },
    { en: "Can a trait skip a generation? How can that be?", es: "¿Puede un rasgo saltarse una generación? ¿Cómo es posible?" },
    { en: "Does dominant mean the trait is stronger or more common? What is your evidence?", es: "¿Dominante quiere decir que el rasgo es más fuerte o más común? ¿Cuál es tu evidencia?" },
    { en: "How would a Punnett square help you predict what the offspring look like?", es: "¿Cómo te ayudaría un cuadro de Punnett a predecir cómo se verán las crías?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Coin Flip Genetics", es: "Genética con monedas" },
      minutes: 15,
      materials: { en: "Two coins, paper, a pencil", es: "Dos monedas, papel y lápiz" },
      steps: {
        en: [
          "Let heads be the dominant allele P and tails be the recessive allele p. Each coin is one parent.",
          "Flip both coins at the same time. Write the pair, such as Pp, 20 times.",
          "Count how many pairs have at least one P. That shows the dominant trait.",
          "Ask: how close is your count to three out of four? Why is it not exactly three out of four?",
        ],
        es: [
          "Que cara sea el alelo dominante P y cruz el alelo recesivo p. Cada moneda es un progenitor.",
          "Lancen las dos monedas al mismo tiempo. Anoten el par, como Pp, 20 veces.",
          "Cuenten cuántos pares tienen al menos una P. Esos muestran el rasgo dominante.",
          "Pregunten: ¿qué tan cerca está su conteo de tres de cada cuatro? ¿Por qué no es exactamente tres de cuatro?",
        ],
      },
    },
    {
      title: { en: "Draw a Punnett Square", es: "Dibujar un cuadro de Punnett" },
      minutes: 15,
      materials: { en: "Paper, two colored pencils, a ruler", es: "Papel, dos lápices de colores y una regla" },
      steps: {
        en: [
          "Draw a square with four boxes. Write P and p across the top and P and p down the side.",
          "Fill each box with the two letters that meet there. You get PP, Pp, Pp, and pp.",
          "Color the boxes that would show purple flowers one color and the white-flower box another.",
          "Ask: what are the chances of purple? Of white? Explain it as a fraction.",
        ],
        es: [
          "Dibujen un cuadro con cuatro casillas. Escriban P y p arriba, y P y p al costado.",
          "Llenen cada casilla con las dos letras que se juntan allí. Salen PP, Pp, Pp y pp.",
          "Pinten de un color las casillas que mostrarían flores moradas y de otro la casilla de la flor blanca.",
          "Pregunten: ¿qué probabilidad hay de morada? ¿Y de blanca? Explíquenlo como fracción.",
        ],
      },
    },
    {
      title: { en: "Seed and Plant Traits", es: "Rasgos de semillas y plantas" },
      minutes: 10,
      materials: { en: "A bag of mixed dry beans or a handful of fruit with seeds, paper", es: "Una bolsa de frijoles secos mezclados o unas frutas con semillas y papel" },
      steps: {
        en: [
          "Sort the beans or seeds by one trait: color, size, or pattern.",
          "Count each group and write the numbers in a table.",
          "Ask your child: which trait is the most common? Does that mean it is dominant?",
          "Say it together: common and dominant are different ideas.",
        ],
        es: [
          "Clasifiquen los frijoles o las semillas por un rasgo: color, tamaño o dibujo.",
          "Cuenten cada grupo y anoten los números en una tabla.",
          "Pregunten a su hijo o hija: ¿qué rasgo es el más común? ¿Eso quiere decir que es dominante?",
          "Díganlo juntos: común y dominante son ideas distintas.",
        ],
      },
    },
    {
      title: { en: "Family Traits Chart", es: "Tabla de rasgos" },
      minutes: 15,
      materials: { en: "Paper, a pencil, photos or a pet or garden plant you know well", es: "Papel, lápiz, y fotos o una mascota o planta del jardín que conozcan bien" },
      steps: {
        en: [
          "Choose a living thing you know well, like a pet, a garden plant, or a tree. Families come in many forms, so you do not need to use people.",
          "List three traits you can observe, such as fur color, leaf shape, or flower color.",
          "Ask: which traits do you think came from the parents? Which might come from the environment?",
          "Write one question a scientist could ask to find out more.",
        ],
        es: [
          "Elijan un ser vivo que conozcan bien, como una mascota, una planta del jardín o un árbol. Las familias son de muchas formas, así que no hace falta usar personas.",
          "Anoten tres rasgos que puedan observar, como el color del pelo, la forma de la hoja o el color de la flor.",
          "Pregunten: ¿qué rasgos creen que vinieron de los padres? ¿Cuáles podrían venir del ambiente?",
          "Escriban una pregunta que un científico podría hacer para saber más.",
        ],
      },
    },
  ],
  say_it: [
    { en: "The [dominant] allele shows even when there is only [one copy].", es: "El alelo [dominante] se ve aunque haya solo [una copia]." },
    { en: "The Punnett square shows that [three] out of [four] offspring are likely to have ___.", es: "El cuadro de Punnett muestra que [tres] de [cuatro] crías probablemente tendrán ___." },
    { en: "The [recessive] trait was hidden, not gone, because ___.", es: "El rasgo [recesivo] estaba oculto, no desaparecido, porque ___." },
    { en: "My evidence is that [number] plants had [trait].", es: "Mi evidencia es que [número] plantas tenían [rasgo]." },
  ],
  help: {
    en: [
      "You do not need to know genetics. Ask, \"What is the chance?\" and let your child draw the square.",
      "Talk about plants, pets, and games with coins. Every family is different, and you never need to share anything private.",
      "Say \"what is your evidence?\" in any language.",
      "Chances are not guarantees. Ask, \"Why is it only a prediction?\"",
    ],
    es: [
      "No necesitan saber genética. Pregunten \"¿cuál es la probabilidad?\" y dejen que su hijo o hija dibuje el cuadro.",
      "Hablen de plantas, mascotas y juegos con monedas. Cada familia es distinta y nunca hace falta compartir nada privado.",
      "Digan \"¿cuál es tu evidencia?\" en cualquier idioma.",
      "Las probabilidades no son garantías. Pregunten \"¿por qué es solo una predicción?\"",
    ],
  },
  home_language: {
    en: "Talk about traits in Spanish first: \"el color, la forma, el tamaño.\" Then find the English words. Gene, mutation, dominant, recessive, and phenotype sound close to Spanish (gen, mutación, dominante, recesivo, fenotipo), so your child already knows many of them.",
    es: "Hablen primero de los rasgos en español: \"el color, la forma, el tamaño\". Después busquen las palabras en inglés. Gene, mutation, dominant, recessive y phenotype se parecen al español (gen, mutación, dominante, recesivo, fenotipo), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child can draw a Punnett square and explain, in any language, what chance each result has and why a hidden trait can come back.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda dibujar un cuadro de Punnett y explicar, en el idioma que quiera, qué probabilidad tiene cada resultado y por qué un rasgo oculto puede volver.",
  },
};

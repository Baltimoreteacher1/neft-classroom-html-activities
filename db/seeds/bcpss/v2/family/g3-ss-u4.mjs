// BCPSS Family Guide (EN/ES) — g3-ss-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 3 Social Studies unit "Interdependence, Specialization & Trade". Vocabulary order matches ../units/g3-ss-u4.mjs.

export default {
  summary: {
    en: "Your child is learning how people do the jobs they do best and trade with one another. The Port of Baltimore, where ships load and unload goods, is a real example. It matters because almost everything we eat, wear, and use took many people to make and bring to us. Your child will practice explaining causes and effects with because, so, and leads to.",
    es: "Su hijo o hija está aprendiendo cómo las personas hacen los trabajos que mejor saben hacer y comercian entre sí. El Puerto de Baltimore, donde los barcos cargan y descargan mercancías, es un ejemplo real. Importa porque casi todo lo que comemos, vestimos y usamos requirió de muchas personas para hacerlo y traerlo hasta nosotros. Su hijo o hija practicará explicar causas y efectos con porque, entonces y lleva a.",
  },
  goals: {
    en: [
      "I can explain why people specialize and trade.",
      "I can tell how the Port of Baltimore connects people who make and need goods.",
      "I can explain a cause and effect with because, so, and leads to.",
    ],
    es: [
      "Puedo explicar por qué las personas se especializan y comercian.",
      "Puedo decir cómo el Puerto de Baltimore conecta a quienes hacen y necesitan productos.",
      "Puedo explicar una causa y un efecto con porque, entonces y lleva a.",
    ],
  },
  vocab: [
    { term: "interdependence", def_es: "cuando personas o lugares necesitan unos de otros para obtener productos y servicios", example_es: "La interdependencia hace que el panadero necesite al agricultor." },
    { term: "specialization", def_es: "hacer un solo trabajo o producto muy bien", example_es: "La especialización ayuda a los trabajadores del puerto a cargar barcos rápido." },
    { term: "producer", def_es: "una persona o negocio que hace o cultiva productos", example_es: "Un agricultor es un productor de trigo." },
    { term: "consumer", def_es: "una persona que compra y usa productos y servicios", example_es: "Soy un consumidor cuando compro pan." },
    { term: "trade", def_es: "comprar, vender o intercambiar productos con otros", example_es: "El comercio conecta a Baltimore con otros países." },
    { term: "export", def_es: "enviar productos a otro país para venderlos", example_es: "Estados Unidos exporta maíz y carbón a otros países." },
    { term: "import", def_es: "traer productos de otro país para venderlos o usarlos", example_es: "El puerto importa frutas de lugares lejanos." },
    { term: "port", def_es: "un lugar junto al agua donde los barcos cargan y descargan", example_es: "El Puerto de Baltimore recibe barcos de todo el mundo." },
    { term: "cargo", def_es: "los productos que lleva un barco, un camión o un tren", example_es: "La carga del barco incluía autos y cajas." },
  ],
  talk: [
    { en: "Who made or grew the food we ate today? How did it get to us?", es: "¿Quién hizo o cultivó la comida que comimos hoy? ¿Cómo llegó hasta nosotros?" },
    { en: "What job do you or someone you know do best?", es: "¿Qué trabajo haces tú o alguien que conoces mejor que nadie?" },
    { en: "What would happen if nobody traded?", es: "¿Qué pasaría si nadie comerciara?" },
    { en: "What is the difference between an export and an import?", es: "¿Cuál es la diferencia entre una exportación y una importación?" },
    { en: "How does a port help people far away and people in our city?", es: "¿Cómo ayuda un puerto a personas lejanas y a personas de nuestra ciudad?" },
  ],
  try_at_home: [
    {
      title: { en: "Where Did It Come From?", es: "¿De dónde vino?" },
      minutes: 10,
      materials: { en: "Food packages, labels, or tags on clothes", es: "Envases de comida, etiquetas o etiquetas de la ropa" },
      steps: {
        en: [
          "Find three items at home. Look for \"Made in\" or where they came from.",
          "Your child lists the places on paper or finds them on a map.",
          "Ask: was it imported? Who might have made, grown, and shipped it?",
          "Say: \"Because ... is made in ..., it travels by ship, so ...\".",
        ],
        es: [
          "Busquen tres objetos en casa. Miren dónde dice \"Hecho en\" o de dónde vinieron.",
          "Su hijo o hija anota los lugares en papel o los encuentra en un mapa.",
          "Pregunten: ¿fue importado? ¿Quién pudo haberlo hecho, cultivado y enviado?",
          "Digan: \"Como ... se hace en ..., viaja en barco, entonces ...\".",
        ],
      },
    },
    {
      title: { en: "Family Specialists", es: "Especialistas de la familia" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Ask each person at home: what is something you do especially well?",
          "Your child writes each person's special skill on a list.",
          "Choose one chore. Ask who should do it and why, since they do it well.",
          "Say: \"Because [name] is good at ..., the job gets done faster.\"",
        ],
        es: [
          "Pregunten a cada persona en casa: ¿qué haces especialmente bien?",
          "Su hijo o hija anota la habilidad especial de cada persona en una lista.",
          "Elijan una tarea. Pregunten quién debería hacerla y por qué, porque la hace bien.",
          "Digan: \"Como [nombre] es bueno en ..., el trabajo se hace más rápido\".",
        ],
      },
    },
    {
      title: { en: "Follow the Goods", es: "Seguir los productos" },
      minutes: 15,
      materials: { en: "A loaf of bread, a piece of fruit, or a shirt; paper and a pencil", es: "Una barra de pan, una fruta o una camisa; papel y lápiz" },
      steps: {
        en: [
          "Pick one item and ask: who helped make it and bring it here?",
          "Your child draws a chain: farmer or maker, truck, port or ship, store, our home.",
          "Mark who is a producer and who is a consumer.",
          "Explain the chain with \"this leads to\" between each step.",
        ],
        es: [
          "Elijan un objeto y pregunten: ¿quién ayudó a hacerlo y traerlo hasta aquí?",
          "Su hijo o hija dibuja una cadena: agricultor o fabricante, camión, puerto o barco, tienda, nuestra casa.",
          "Marquen quién es productor y quién es consumidor.",
          "Expliquen la cadena con \"esto lleva a\" entre cada paso.",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because [workers] specialize in [job], [result].", es: "Como [trabajadores] se especializan en [trabajo], [resultado]." },
    { en: "[Place] exports [good], and [place] imports [good].", es: "[Lugar] exporta [producto] y [lugar] importa [producto]." },
    { en: "This leads to [effect].", es: "Esto lleva a [efecto]." },
    { en: "A [producer] makes [good], so [consumer] can [use it].", es: "Un [productor] hace [producto], entonces el [consumidor] puede [usarlo]." },
  ],
  help: {
    en: [
      "Look at labels together. \"Where was this made?\" is a great way to start.",
      "You do not need to know about trade. Your child can explain the chain to you.",
      "Talk about the work you do or the work of people you know. Every job helps connect people.",
      "Ask \"what happens next?\" at each step. That is cause and effect.",
    ],
    es: [
      "Miren juntos las etiquetas. \"¿Dónde se hizo esto?\" es una buena manera de empezar.",
      "No necesitan saber de comercio. Su hijo o hija puede explicarles la cadena.",
      "Hablen del trabajo que hacen ustedes o de personas que conocen. Todo trabajo ayuda a conectar a las personas.",
      "Pregunten \"¿qué pasa después?\" en cada paso. Eso es causa y efecto.",
    ],
  },
  home_language: {
    en: "Many trade words are cognates: interdependence is interdependencia, specialization is especialización, producer is productor, consumer is consumidor, export is exportar, and import is importar. Tell the story of one product in Spanish first, then find the English words together.",
    es: "Muchas palabras de comercio son cognados: interdependence es interdependencia, specialization es especialización, producer es productor, consumer es consumidor, export es exportar e import es importar. Cuenten primero en español la historia de un producto y luego busquen juntos las palabras en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child can follow a product from where it is made to our home and explain why people trade.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda seguir un producto desde donde se hace hasta nuestra casa y explicar por qué las personas comercian.",
  },
};

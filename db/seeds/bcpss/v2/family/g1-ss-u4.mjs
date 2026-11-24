// BCPSS Family Guide (EN/ES) — g1-ss-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 Social Studies unit on goods, services, spending and saving. Vocabulary order matches ../units/g1-ss-u4.mjs.

export default {
  summary: {
    en: "Your child is learning how families get what they need. Children tell goods, things you can touch, from services, work someone does for you. They also learn who makes things, and how to choose between spending money and saving it. It matters at the corner store, the market, and the barber shop.",
    es: "Su hijo o hija está aprendiendo cómo las familias consiguen lo que necesitan. Los niños distinguen los bienes, cosas que se pueden tocar, de los servicios, trabajo que alguien hace por nosotros. También aprenden quién fabrica las cosas y cómo escoger entre gastar el dinero y ahorrarlo. Sirve en la tienda de la esquina, en el mercado y en la barbería.",
  },
  goals: {
    en: [
      "I can tell a good from a service.",
      "I can tell who makes things and who buys them.",
      "I can explain a choice to spend or to save.",
    ],
    es: [
      "Puedo distinguir un bien de un servicio.",
      "Puedo decir quién hace las cosas y quién las compra.",
      "Puedo explicar una elección de gastar o de ahorrar.",
    ],
  },
  vocab: [
    { term: "good", def_es: "una cosa que puedes tocar y comprar; también se dice producto", example_es: "El pan es un bien que la gente compra en la tienda." },
    { term: "service", def_es: "trabajo que una persona hace para ayudarte; se parece a la palabra en inglés", example_es: "Un corte de pelo es un servicio." },
    { term: "producer", def_es: "una persona que hace bienes o da servicios; se parece a \"productor\"", example_es: "Una panadera es productora porque hace pan." },
    { term: "consumer", def_es: "una persona que compra o usa bienes y servicios; se parece a \"consumidor\"", example_es: "Una familia es consumidora cuando compra pan." },
    { term: "choice", def_es: "escoger una cosa en lugar de otra", example_es: "Gastar o ahorrar es una elección." },
    { term: "save", def_es: "guardar dinero para usarlo después", example_es: "Ahorro un dólar cada semana en mi frasco." },
    { term: "spend", def_es: "usar dinero para comprar algo", example_es: "Gastamos dos dólares en manzanas." },
    { term: "need", def_es: "algo que las personas deben tener para vivir y estar sanas", example_es: "La comida es una necesidad para toda familia." },
    { term: "want", def_es: "algo que te gustaría tener pero con lo que puedes vivir sin él", example_es: "Un juguete nuevo es un deseo." },
    { term: "money", def_es: "las monedas y los billetes que la gente usa para pagar cosas", example_es: "Usamos dinero para comprar manzanas en el mercado." },
  ],
  talk: [
    { en: "What did we buy today? Was it a good or a service?", es: "¿Qué compramos hoy? ¿Fue un bien o un servicio?" },
    { en: "Who made this? Who sells it? Who uses it?", es: "¿Quién hizo esto? ¿Quién lo vende? ¿Quién lo usa?" },
    { en: "Is this a need or a want? How do you know?", es: "¿Esto es una necesidad o un deseo? ¿Cómo lo sabes?" },
    { en: "If you had a little money, would you spend it or save it? Why?", es: "Si tuvieras un poco de dinero, ¿lo gastarías o lo ahorrarías? ¿Por qué?" },
    { en: "What jobs do people do to help our family, like a bus driver or a baker?", es: "¿Qué trabajos hace la gente para ayudar a nuestra familia, como un conductor de autobús o un panadero?" },
  ],
  try_at_home: [
    {
      title: { en: "Good or Service Sort", es: "Clasificar bienes y servicios" },
      minutes: 10,
      materials: { en: "Two pieces of paper, a pencil, and things around the house or pictures from a flyer", es: "Dos hojas de papel, un lápiz y cosas de la casa o dibujos de un folleto de tienda" },
      steps: {
        en: [
          "Write \"good\" on one paper and \"service\" on the other.",
          "Name things your family uses: shoes, a haircut, bread, the bus ride, a toy, a doctor visit.",
          "Your child puts each one on the right paper. Ask: how do you know?",
          "Then ask: who makes the good, or who does the service?",
        ],
        es: [
          "Escriban \"bien\" en un papel y \"servicio\" en el otro.",
          "Nombren cosas que usa su familia: zapatos, un corte de pelo, pan, el viaje en autobús, un juguete, una visita al doctor.",
          "Su hijo o hija pone cada cosa en el papel que le toca. Pregunten: ¿cómo lo sabes?",
          "Luego pregunten: ¿quién hace el bien o quién hace el servicio?",
        ],
      },
    },
    {
      title: { en: "Store Trip: Need or Want", es: "Ir a la tienda: necesidad o deseo" },
      minutes: 15,
      materials: { en: "A trip to a store or market, or a store flyer at home", es: "Una visita a una tienda o mercado, o un folleto de tienda en casa" },
      steps: {
        en: [
          "Before you go, pick 3 things to look for. Ask: is each one a need or a want?",
          "At the store, look at the price. Say the price out loud and count the money together if you can.",
          "Ask: who made this? Who works here? Who is the consumer today?",
          "At home, talk about the choice your family made.",
        ],
        es: [
          "Antes de ir, escojan 3 cosas que buscar. Pregunten: ¿cada una es una necesidad o un deseo?",
          "En la tienda, miren el precio. Digan el precio en voz alta y cuenten el dinero juntos si pueden.",
          "Pregunten: ¿quién hizo esto? ¿Quién trabaja aquí? ¿Quién es el consumidor hoy?",
          "En casa, hablen sobre la decisión que tomó la familia.",
        ],
      },
    },
    {
      title: { en: "Save and Spend Jars", es: "Frascos para ahorrar y gastar" },
      minutes: 10,
      materials: { en: "Two jars or cups, a few coins or paper circles marked as coins", es: "Dos frascos o vasos, unas monedas o círculos de papel marcados como monedas" },
      steps: {
        en: [
          "Label one jar \"save\" and one jar \"spend.\"",
          "Give your child 5 coins or paper coins. Ask: how many do you want to put in each jar?",
          "Count each jar together. Ask: what could you buy with the spend jar? What could you wait for with the save jar?",
          "Next week, count again. Did the save jar grow?",
        ],
        es: [
          "Escriban \"ahorrar\" en un frasco y \"gastar\" en el otro.",
          "Denle a su hijo o hija 5 monedas o monedas de papel. Pregunten: ¿cuántas quieres poner en cada frasco?",
          "Cuenten cada frasco juntos. Pregunten: ¿qué podrías comprar con el frasco de gastar? ¿Qué podrías esperar con el frasco de ahorrar?",
          "La próxima semana, cuenten otra vez. ¿Creció el frasco de ahorrar?",
        ],
      },
    },
    {
      title: { en: "Pretend Shop", es: "Tienda de juguete" },
      minutes: 15,
      materials: { en: "Food boxes or small toys, paper price tags, paper coins", es: "Cajas de comida o juguetes pequeños, etiquetas de precio de papel, monedas de papel" },
      steps: {
        en: [
          "Set up a pretend store. Put a price tag of 1, 2, or 3 coins on each item.",
          "Your child is the producer and shop owner. You are the consumer. Pay with paper coins.",
          "Switch. Your child buys and you sell. Ask: do you spend all your coins or save some?",
          "Talk about which items are needs and which are wants.",
        ],
        es: [
          "Armen una tienda de juguete. Pongan una etiqueta de 1, 2 o 3 monedas a cada cosa.",
          "Su hijo o hija es el productor y el dueño de la tienda. Ustedes son los consumidores. Paguen con monedas de papel.",
          "Cambien de papel. Su hijo o hija compra y ustedes venden. Pregunten: ¿gastas todas tus monedas o ahorras algunas?",
          "Hablen de cuáles cosas son necesidades y cuáles son deseos.",
        ],
      },
    },
  ],
  say_it: [
    { en: "A [worker] makes [thing].", es: "Un [trabajador] hace [cosa]." },
    { en: "I can [spend / save] my money.", es: "Puedo [gastar / ahorrar] mi dinero." },
    { en: "A [thing] is a [good / service].", es: "Un [cosa] es un [bien / servicio]." },
    { en: "I choose to ___ because ___.", es: "Elijo ___ porque ___." },
  ],
  help: {
    en: [
      "Talk about everyday buying without worry or blame: the market, the bus, the barber. It is learning, not a test.",
      "Ask \"why did you choose that?\" in any language. Your child explains, you listen.",
      "Let your child count coins, hand them over, or say the price. Real practice beats worksheets.",
      "Share how your family decides what is a need and what can wait. Every family has its own way.",
    ],
    es: [
      "Hablen de las compras de todos los días sin preocupación ni culpa: el mercado, el autobús, la barbería. Es aprender, no un examen.",
      "Pregunten \"¿por qué escogiste eso?\" en cualquier idioma. Su hijo o hija explica y ustedes escuchan.",
      "Dejen que su hijo o hija cuente monedas, las entregue o diga el precio. La práctica de verdad vale más que una hoja de ejercicios.",
      "Cuenten cómo decide su familia qué es una necesidad y qué puede esperar. Cada familia tiene su manera.",
    ],
  },
  home_language: {
    en: "Name things you buy in both languages: \"pan\" and \"bread,\" \"manzanas\" and \"apples,\" \"dinero\" and \"money.\" Look for cognates: \"servicio\" and \"service,\" \"productor\" and \"producer,\" \"consumidor\" and \"consumer.\" Ask your child to say the price in English while you say it in Spanish.",
    es: "Nombren en los dos idiomas las cosas que compran: \"pan\" y \"bread\", \"manzanas\" y \"apples\", \"dinero\" y \"money\". Busquen palabras parecidas: \"servicio\" y \"service\", \"productor\" y \"producer\", \"consumidor\" y \"consumer\". Pídanle a su hijo o hija que diga el precio en inglés mientras ustedes lo dicen en español.",
  },
  celebrate: {
    en: "You will know it is working when your child tells you if something is a good or a service and explains why they would spend or save.",
    es: "Sabrán que está funcionando cuando su hijo o hija les diga si algo es un bien o un servicio y explique por qué gastaría o ahorraría.",
  },
};

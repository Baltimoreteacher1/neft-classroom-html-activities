// BCPSS Family Guide (EN/ES) — g6-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on ratios, rates and percent. Vocabulary order matches ../units/g6-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning to compare two amounts with a ratio, like 3 red beads for every 5 blue beads. They also learn rates, such as the price of one bottle of water, and percents, which compare a number to 100. It matters every time someone doubles a recipe, compares prices at the corner store, or figures out how fast a bus is going.",
    es: "Su hijo o hija está aprendiendo a comparar dos cantidades con una razón, por ejemplo 3 cuentas rojas por cada 5 cuentas azules. También aprende las tasas, como el precio de una botella de agua, y los porcentajes, que comparan un número con 100. Sirve cada vez que alguien duplica una receta, compara precios en la tienda de la esquina o calcula qué tan rápido va un autobús.",
  },
  goals: {
    en: [
      "I can write a ratio and say it with \"for every\".",
      "I can find the price of one item (the unit rate) and build equivalent ratios.",
      "I can use a table or a drawing to show my thinking and explain it with because.",
    ],
    es: [
      "Puedo escribir una razón y decirla con \"por cada\".",
      "Puedo hallar el precio de una unidad (la tasa unitaria) y crear razones equivalentes.",
      "Puedo usar una tabla o un dibujo para mostrar mi razonamiento y explicarlo con porque.",
    ],
  },
  vocab: [
    { term: "ratio", def_es: "una comparación de dos cantidades que dice cuántas hay de una por cada cierta cantidad de la otra", example_es: "La razón de cuentas rojas a cuentas azules es de 3 a 5." },
    { term: "equivalent ratio", def_es: "otra pareja de números que compara igual, porque multiplicaste o dividiste los dos números por la misma cantidad", example_es: "6 a 10 es una razón equivalente a 3 a 5, porque multipliqué los dos números por 2." },
    { term: "rate", def_es: "una comparación de dos cantidades con unidades distintas, como millas y horas", example_es: "Una tasa de 60 millas en 2 horas compara la distancia con el tiempo." },
    { term: "unit rate", def_es: "la cantidad para exactamente 1 de algo, como lo que cuesta una botella", example_es: "La tasa unitaria es de 2 dólares por botella." },
    { term: "tape diagram", def_es: "un dibujo de barras en filas que muestra cómo se comparan las cantidades, como una tira de cinta dividida en cuadritos", example_es: "En mi diagrama de cinta hay 3 bloques para las cuentas rojas y 5 para las azules." },
    { term: "double number line", def_es: "dos rectas numéricas, una encima de la otra, que muestran cantidades que van juntas", example_es: "En la recta numérica doble, 2 horas coinciden con 120 millas." },
    { term: "ratio table", def_es: "una tabla con filas de números que mantienen siempre la misma comparación", example_es: "Cada fila de la tabla de razones es el doble de la fila anterior." },
    { term: "percent", def_es: "una tasa que compara un número con 100; también se dice \"por ciento\"", example_es: "25 por ciento quiere decir 25 de cada 100." },
  ],
  talk: [
    { en: "Can you say a ratio about something in our kitchen, using \"for every\"?", es: "¿Puedes decir una razón sobre algo de nuestra cocina, usando \"por cada\"?" },
    { en: "How do you know these two ratios say the same thing?", es: "¿Cómo sabes que estas dos razones dicen lo mismo?" },
    { en: "If one bottle costs this much, how could you find the price of six?", es: "Si una botella cuesta esto, ¿cómo podrías hallar el precio de seis?" },
    { en: "Which store has the better deal, and how can you prove it?", es: "¿Qué tienda tiene la mejor oferta y cómo lo puedes demostrar?" },
    { en: "What did you draw today, and what does each part show?", es: "¿Qué dibujaste hoy y qué muestra cada parte?" },
  ],
  try_at_home: [
    {
      title: { en: "Double the Recipe", es: "Duplicar la receta" },
      minutes: 15,
      materials: { en: "A simple recipe (rice, lemonade, or pancakes), measuring cups, paper and pencil", es: "Una receta sencilla (arroz, limonada o panqueques), tazas de medir, papel y lápiz" },
      steps: {
        en: [
          "Pick a recipe and read the ratio aloud, like \"2 cups of water for every 1 cup of rice\".",
          "Ask your child to make a table: one row for the recipe, one row for double, one row for triple.",
          "Cook or mix the doubled recipe together, using the numbers from the table.",
          "Ask: what stayed the same in every row? How do you know it will taste the same?",
        ],
        es: [
          "Elijan una receta y lean la razón en voz alta, como \"2 tazas de agua por cada 1 taza de arroz\".",
          "Pídanle a su hijo o hija que haga una tabla: una fila para la receta, otra para el doble y otra para el triple.",
          "Cocinen o mezclen juntos la receta doble, usando los números de la tabla.",
          "Pregunten: ¿qué se quedó igual en todas las filas? ¿Cómo sabes que tendrá el mismo sabor?",
        ],
      },
    },
    {
      title: { en: "Best Buy at the Store", es: "La mejor compra en la tienda" },
      minutes: 15,
      materials: { en: "A store receipt, a store flyer, or two price tags; paper and pencil", es: "Un recibo de la tienda, un volante de ofertas o dos etiquetas de precio; papel y lápiz" },
      steps: {
        en: [
          "Find two sizes of the same item, like a 6-pack of juice for $3 and a 12-pack for $5.",
          "Ask your child to find the price of just one juice in each pack by dividing the price by the number of juices. That is the unit rate.",
          "Compare the two unit rates. Ask: which one costs less for one?",
          "Say the result with a frame: \"Pack A costs __ per juice, so Pack B is the better deal because __.\"",
        ],
        es: [
          "Busquen dos tamaños del mismo producto, como un paquete de 6 jugos por $3 y otro de 12 jugos por $5.",
          "Pídanle a su hijo o hija que halle el precio de un solo jugo en cada paquete, dividiendo el precio entre la cantidad de jugos. Esa es la tasa unitaria.",
          "Comparen las dos tasas unitarias. Pregunten: ¿cuál cuesta menos por un jugo?",
          "Digan el resultado con una frase: \"El paquete A cuesta __ por jugo, entonces el paquete B es la mejor oferta porque __.\"",
        ],
      },
    },
    {
      title: { en: "Bus Speed Check", es: "La velocidad del autobús" },
      minutes: 15,
      materials: { en: "A bus or walking route, a phone clock or watch, paper and pencil", es: "Una ruta en autobús o a pie, el reloj del teléfono o un reloj de pulsera, papel y lápiz" },
      steps: {
        en: [
          "On a bus ride or a walk, write down how many blocks or stops you pass and how many minutes it takes.",
          "Say the rate together: \"__ stops in __ minutes\".",
          "Ask your child to draw two number lines, one for minutes and one for stops, with matching tick marks.",
          "Ask: how many stops would we pass in twice as much time? How do you know?",
        ],
        es: [
          "En un viaje en autobús o en una caminata, anoten cuántas cuadras o paradas pasan y cuántos minutos tardan.",
          "Digan la tasa juntos: \"__ paradas en __ minutos\".",
          "Pídanle a su hijo o hija que dibuje dos rectas numéricas, una para los minutos y otra para las paradas, con las marcas alineadas.",
          "Pregunten: ¿cuántas paradas pasaríamos en el doble de tiempo? ¿Cómo lo sabes?",
        ],
      },
    },
    {
      title: { en: "Percent of the Tip", es: "El porcentaje de la propina" },
      minutes: 10,
      materials: { en: "A restaurant bill, a receipt, or play prices; paper and pencil", es: "La cuenta de un restaurante, un recibo o precios inventados; papel y lápiz" },
      steps: {
        en: [
          "Pick a bill of $20. Ask: what is 10 percent of $20? Remember, 10 percent means 10 out of every 100.",
          "Help your child see that 10 percent of $20 is $2, and that 20 percent is double that.",
          "Try another bill, like $30 or $50, and let your child find 10 percent first.",
          "Ask: how did you find it? Is there another way?",
        ],
        es: [
          "Elijan una cuenta de $20. Pregunten: ¿cuánto es el 10 por ciento de $20? Recuerden que 10 por ciento quiere decir 10 de cada 100.",
          "Ayuden a su hijo o hija a ver que el 10 por ciento de $20 es $2 y que el 20 por ciento es el doble.",
          "Prueben con otra cuenta, como $30 o $50, y dejen que su hijo o hija halle primero el 10 por ciento.",
          "Pregunten: ¿cómo lo hallaste? ¿Hay otra manera?",
        ],
      },
    },
  ],
  say_it: [
    { en: "For every [3] red beads, there are [5] blue beads.", es: "Por cada [3] cuentas rojas, hay [5] cuentas azules." },
    { en: "I multiplied both numbers by [2], so the equivalent ratio is [6] to [10].", es: "Multipliqué los dos números por [2], entonces la razón equivalente es de [6] a [10]." },
    { en: "The unit rate is [2] dollars per [bottle] because [12] ÷ [6] = [2].", es: "La tasa unitaria es de [2] dólares por [botella] porque [12] ÷ [6] = [2]." },
    { en: "[25] percent means [25] out of every 100.", es: "[25] por ciento quiere decir [25] de cada 100." },
  ],
  help: {
    en: [
      "You do not need to know ratios. Ask your child to teach you with a table or a drawing.",
      "Use real things you already have: spoons of sugar, bus stops, prices on a receipt.",
      "Ask \"how do you know?\" in any language. Explaining out loud helps the idea stay.",
      "If an answer is wrong, ask \"what would you check?\" Checking is part of the math.",
    ],
    es: [
      "No necesitan saber de razones. Pídanle a su hijo o hija que les enseñe con una tabla o un dibujo.",
      "Usen cosas reales que ya tienen: cucharadas de azúcar, paradas de autobús, precios de un recibo.",
      "Pregunten \"¿cómo lo sabes?\" en cualquier idioma. Explicar en voz alta ayuda a que la idea se quede.",
      "Si una respuesta no es correcta, pregunten \"¿qué revisarías?\". Revisar es parte de las matemáticas.",
    ],
  },
  home_language: {
    en: "Say each ratio in Spanish first: \"por cada 2 tazas de agua, 1 taza de arroz\". In Spanish, \"razón\" can mean ratio or reason, so ask your child which one it is in math. Then find the English words together. Equivalent, percent, and ratio have close Spanish partners: equivalente, porcentaje, razón.",
    es: "Digan primero cada razón en español: \"por cada 2 tazas de agua, 1 taza de arroz\". En español, \"razón\" puede significar comparación o motivo, así que pregunten a su hijo o hija cuál es en matemáticas. Después busquen juntos las palabras en inglés. Equivalente, porcentaje y razón tienen palabras parecidas en inglés: equivalent, percent, ratio.",
  },
  celebrate: {
    en: "You will know it is working when your child can look at a price tag or a recipe and tell you, in any language, how to find the amount for one or for double, and why it works.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda mirar una etiqueta de precio o una receta y contarles, en el idioma que quiera, cómo hallar la cantidad para uno o para el doble y por qué funciona.",
  },
};

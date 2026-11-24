// BCPSS Family Guide (EN/ES) — g3-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on multiplication properties and strategies. Vocabulary order matches ../units/g3-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning that a multiplication fact can be turned around, regrouped, or broken into easier pieces, and the answer stays the same. This helps when someone figures out a price, a tray of food, or a stack of cans in their head. Your child will explain why a strategy works, in any language.",
    es: "Su hijo o hija está aprendiendo que una multiplicación se puede dar vuelta, agrupar de otra manera o dividir en partes más fáciles, y la respuesta no cambia. Esto ayuda cuando alguien calcula un precio, una bandeja de comida o una pila de latas mentalmente. Su hijo o hija explicará por qué funciona una estrategia, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can turn a fact around or regroup it and get the same product.",
      "I can break apart a factor to make a hard fact easier.",
      "I can tell why my strategy works with because and so.",
    ],
    es: [
      "Puedo dar vuelta una multiplicación o agruparla de otra forma y obtener el mismo producto.",
      "Puedo descomponer un factor para hacer más fácil una multiplicación difícil.",
      "Puedo decir por qué funciona mi estrategia con porque y entonces.",
    ],
  },
  vocab: [
    { term: "property", def_es: "una regla que siempre es verdadera para los números", example_es: "Una propiedad de la multiplicación siempre funciona, con cualquier número." },
    { term: "commutative property", def_es: "la regla que dice que, si cambias el orden de los factores, el producto no cambia", example_es: "Por la propiedad conmutativa, 3 × 4 y 4 × 3 dan 12." },
    { term: "associative property", def_es: "la regla que dice que, si cambias cómo agrupas los factores, el producto no cambia", example_es: "Por la propiedad asociativa, (2 × 3) × 4 y 2 × (3 × 4) dan 24." },
    { term: "distributive property", def_es: "la regla que te deja dividir un factor en partes, multiplicar cada parte y sumar los resultados", example_es: "Con la propiedad distributiva, 7 × 6 es 5 × 6 más 2 × 6." },
    { term: "break apart", def_es: "dividir un número en partes más pequeñas que son más fáciles de usar, como partir una barra de pan", example_es: "Descompongo el 7 en 5 y 2 para multiplicar más fácil." },
    { term: "parentheses", def_es: "marcas curvas que muestran qué parte se resuelve primero", example_es: "En (2 × 3) × 4, resuelvo primero lo que está entre paréntesis." },
    { term: "equation", def_es: "una oración matemática con un signo de igual que muestra que dos cantidades son iguales", example_es: "La ecuación 5 × 6 = 30 dice que 5 × 6 y 30 son lo mismo." },
    { term: "strategy", def_es: "un plan que usas para solucionar un problema", example_es: "Mi estrategia es descomponer el número en partes fáciles." },
    { term: "product", def_es: "la respuesta que se obtiene al multiplicar", example_es: "El producto de 7 × 6 es 42." },
  ],
  talk: [
    { en: "Which fact was hard today? How did you make it easier?", es: "¿Qué multiplicación fue difícil hoy? ¿Cómo la hiciste más fácil?" },
    { en: "Can you turn the fact around and get the same answer? Show me.", es: "¿Puedes dar vuelta la multiplicación y obtener la misma respuesta? Muéstramelo." },
    { en: "How did you break the number apart?", es: "¿Cómo descompusiste el número?" },
    { en: "How do you know your strategy works every time?", es: "¿Cómo sabes que tu estrategia funciona siempre?" },
    { en: "Is there another strategy that gives the same answer?", es: "¿Hay otra estrategia que dé la misma respuesta?" },
  ],
  try_at_home: [
    {
      title: { en: "Turn It Around", es: "Dale la vuelta" },
      minutes: 10,
      materials: { en: "12 buttons, coins, or dry beans; a sheet of paper", es: "12 botones, monedas o frijoles secos y una hoja de papel" },
      steps: {
        en: [
          "Make 3 rows of 4 buttons. Ask your child: how many in all? (3 × 4 = 12.)",
          "Turn the paper a quarter turn. Now there are 4 rows of 3. Ask: how many now?",
          "Ask: what stayed the same? What changed? Write both facts: 3 × 4 and 4 × 3.",
          "Try another pair with 2 rows of 6. Ask: will it work every time? Why?",
        ],
        es: [
          "Hagan 3 filas de 4 botones. Pregunten a su hijo o hija: ¿cuántos hay en total? (3 × 4 = 12.)",
          "Giren el papel un cuarto de vuelta. Ahora hay 4 filas de 3. Pregunten: ¿cuántos hay ahora?",
          "Pregunten: ¿qué se quedó igual? ¿Qué cambió? Escriban las dos operaciones: 3 × 4 y 4 × 3.",
          "Prueben con otra pareja, con 2 filas de 6. Pregunten: ¿funcionará siempre? ¿Por qué?",
        ],
      },
    },
    {
      title: { en: "Cookie Tray Split", es: "La bandeja de galletas partida" },
      minutes: 15,
      materials: { en: "Paper, a pencil, and 2 colors (or just a pencil)", es: "Papel, lápiz y 2 colores (o solo el lápiz)" },
      steps: {
        en: [
          "Draw a cookie tray with 7 rows and 6 cookies in each row. Ask: how many cookies in all?",
          "Draw a line to cut the tray into 5 rows and 2 rows. Color the two parts differently.",
          "Find each part: 5 rows of 6 is 30, and 2 rows of 6 is 12. Add them: 30 + 12 = 42.",
          "Ask: why does cutting the tray still give the right answer? Try cutting it a different way.",
        ],
        es: [
          "Dibujen una bandeja de galletas con 7 filas y 6 galletas en cada fila. Pregunten: ¿cuántas galletas hay en total?",
          "Tracen una línea para cortar la bandeja en 5 filas y 2 filas. Coloreen las dos partes de forma distinta.",
          "Hallen cada parte: 5 filas de 6 son 30, y 2 filas de 6 son 12. Súmenlas: 30 + 12 = 42.",
          "Pregunten: ¿por qué cortar la bandeja sigue dando la respuesta correcta? Prueben cortarla de otra manera.",
        ],
      },
    },
    {
      title: { en: "Stacking Cans", es: "Apilar latas" },
      minutes: 10,
      materials: { en: "Small cans, cups, or boxes (about 24 items)", es: "Latas, vasos o cajas pequeñas (unas 24)" },
      steps: {
        en: [
          "Make 2 shelves. Put 3 boxes on each shelf and 4 cans in each box. How many cans in all?",
          "First, group it as (2 × 3) × 4: 2 shelves of 3 boxes is 6 boxes, and 6 boxes of 4 cans is 24.",
          "Then try 2 × (3 × 4): 3 boxes of 4 cans is 12 cans on one shelf, and 2 shelves is 24.",
          "Ask: which way was easier for you? Why do both ways give 24?",
        ],
        es: [
          "Hagan 2 estantes. Pongan 3 cajas en cada estante y 4 latas en cada caja. ¿Cuántas latas hay en total?",
          "Primero, agrúpenlo como (2 × 3) × 4: 2 estantes de 3 cajas son 6 cajas, y 6 cajas de 4 latas son 24.",
          "Luego prueben 2 × (3 × 4): 3 cajas de 4 latas son 12 latas en un estante, y 2 estantes son 24.",
          "Pregunten: ¿de qué manera te resultó más fácil? ¿Por qué las dos maneras dan 24?",
        ],
      },
    },
    {
      title: { en: "Juice Box Shopping", es: "Compras de jugos" },
      minutes: 10,
      materials: { en: "Paper and a pencil; a store flyer or an empty juice-box pack if you have one", es: "Papel y lápiz; un folleto de la tienda o un paquete vacío de jugos si tienen" },
      steps: {
        en: [
          "Say: the store has 6 packs of juice boxes, with 8 boxes in each pack. How many juice boxes?",
          "Ask your child to break apart a number. For example, 6 × 8 is 5 × 8 plus 1 × 8.",
          "Write it: 40 + 8 = 48. Ask: how do you know that is right?",
          "Ask your child to try another strategy, like 6 × 8 as 6 × 4 doubled. Do both give 48?",
        ],
        es: [
          "Digan: la tienda tiene 6 paquetes de jugos, con 8 jugos en cada paquete. ¿Cuántos jugos hay?",
          "Pidan a su hijo o hija que descomponga un número. Por ejemplo, 6 × 8 es 5 × 8 más 1 × 8.",
          "Escríbanlo: 40 + 8 = 48. Pregunten: ¿cómo sabes que es correcto?",
          "Pidan que pruebe otra estrategia, como 6 × 8 igual al doble de 6 × 4. ¿Las dos dan 48?",
        ],
      },
    },
  ],
  say_it: [
    { en: "I broke [number] into [part] and [part] because [reason].", es: "Descompuse el [número] en [parte] y [parte] porque [razón]." },
    { en: "I know [fact], so I know [fact].", es: "Sé [operación], entonces sé [operación]." },
    { en: "My strategy works because ___.", es: "Mi estrategia funciona porque ___." },
    { en: "I changed the order, and the product is still [number].", es: "Cambié el orden, y el producto sigue siendo [número]." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Ask \"Is there another way?\" Many ways are right, and your child may know one you never learned.",
      "Let your child draw it. A quick drawing of rows or groups often shows the idea.",
      "Praise the thinking, not only the answer: \"I like how you broke that apart.\"",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Pregunten \"¿hay otra manera?\". Muchas maneras son correctas, y su hijo o hija puede conocer una que ustedes nunca aprendieron.",
      "Dejen que dibuje. Un dibujo rápido de filas o grupos muchas veces muestra la idea.",
      "Celebren el razonamiento, no solo la respuesta: \"Me gustó cómo descompusiste eso\".",
    ],
  },
  home_language: {
    en: "Share how you multiply in your head in Spanish or in the way you learned. Then let your child show you the school way. Words like propiedad, ecuación, estrategia, and paréntesis sound almost the same in English (property, equation, strategy, parentheses), so your child already knows them.",
    es: "Cuenten cómo multiplican ustedes mentalmente, en español o como lo aprendieron. Luego dejen que su hijo o hija les muestre la manera de la escuela. Palabras como propiedad, ecuación, estrategia y paréntesis suenan casi igual en inglés (property, equation, strategy, parentheses), así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child solves a hard fact by breaking it into easy ones and tells you, in any language, why that works.",
    es: "Sabrán que está funcionando cuando su hijo o hija resuelva una multiplicación difícil dividiéndola en partes fáciles y les cuente, en el idioma que quiera, por qué funciona.",
  },
};

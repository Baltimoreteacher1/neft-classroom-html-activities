// BCPSS Family Guide (EN/ES) — g4-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on decimals (tenths, hundredths) and metric conversions. Vocabulary order matches ../units/g4-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning to write tenths and hundredths as decimals, and to change a measurement from a bigger metric unit to a smaller one. It matters when someone counts money, reads a food label, or figures out how far a bus route goes. Your child will explain why the number changes when the unit changes, in any language.",
    es: "Su hijo o hija está aprendiendo a escribir décimos y centésimos como decimales, y a cambiar una medida de una unidad métrica más grande a una más pequeña. Sirve cuando alguien cuenta dinero, lee la etiqueta de un alimento o calcula qué tan lejos llega una ruta de autobús. Su hijo o hija explicará por qué cambia el número cuando cambia la unidad, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can write tenths and hundredths as decimals and compare them.",
      "I can change meters to centimeters, kilometers to meters, and kilograms to grams.",
      "I can explain a cause and its effect with because, so, and as a result.",
    ],
    es: [
      "Puedo escribir décimos y centésimos como decimales y compararlos.",
      "Puedo cambiar metros a centímetros, kilómetros a metros y kilogramos a gramos.",
      "Puedo explicar una causa y su efecto con porque, entonces y como resultado.",
    ],
  },
  vocab: [
    { term: "decimal", def_es: "un número que usa un punto para mostrar décimos, centésimos y partes más pequeñas de un entero", example_es: "El decimal 0.5 es lo mismo que cinco décimos." },
    { term: "tenth", def_es: "una de 10 partes iguales de un entero, como una moneda de diez centavos en un dólar", example_es: "Una moneda de diez centavos es un décimo de dólar." },
    { term: "hundredth", def_es: "una de 100 partes iguales de un entero, como un centavo en un dólar", example_es: "Un centavo es un centésimo de dólar." },
    { term: "decimal point", def_es: "el punto que separa la parte entera de las partes más pequeñas que uno", example_es: "En 3.25, el punto decimal está entre el 3 y el 2." },
    { term: "convert", def_es: "cambiar una medida de una unidad a otra unidad distinta", example_es: "Convierto 3 metros a 300 centímetros." },
    { term: "centimeter", def_es: "una unidad métrica pequeña de longitud; 100 de ellas forman un metro", example_es: "Mi lápiz mide unos 19 centímetros." },
    { term: "meter", def_es: "la unidad métrica básica de longitud, un poco más larga que una yarda", example_es: "El pasillo mide 4 metros de largo." },
    { term: "kilometer", def_es: "una unidad métrica de longitud igual a 1,000 metros", example_es: "La ruta del autobús mide 3 kilómetros." },
    { term: "kilogram", def_es: "una unidad métrica de masa igual a 1,000 gramos", example_es: "La bolsa de arroz pesa 2 kilogramos." },
  ],
  talk: [
    { en: "What did you measure today? Which unit did you use?", es: "¿Qué mediste hoy? ¿Qué unidad usaste?" },
    { en: "Why does the number get bigger when we change meters to centimeters?", es: "¿Por qué el número se hace más grande cuando cambiamos metros a centímetros?" },
    { en: "Which is greater, 0.3 or 0.27? How do you know?", es: "¿Qué es mayor, 0.3 o 0.27? ¿Cómo lo sabes?" },
    { en: "Where do we see decimals in real life?", es: "¿Dónde vemos decimales en la vida real?" },
    { en: "When would we use kilometers instead of meters?", es: "¿Cuándo usaríamos kilómetros en vez de metros?" },
  ],
  try_at_home: [
    {
      title: { en: "Dimes and Pennies", es: "Monedas de diez y de un centavo" },
      minutes: 10,
      materials: { en: "Dimes and pennies (or paper circles), paper and a pencil", es: "Monedas de diez centavos y de un centavo (o círculos de papel), papel y lápiz" },
      steps: {
        en: [
          "Say: 1 dollar is 1 whole. A dime is one tenth of it, or 0.1. A penny is one hundredth, or 0.01.",
          "Show $0.37 with 3 dimes and 7 pennies. Ask: how many tenths? How many hundredths more?",
          "Make $0.30 with 3 dimes and $0.27 with 27 pennies. Ask: which is greater, 0.3 or 0.27?",
          "Say it: \"0.3 is greater than 0.27 because 30 hundredths is more than 27 hundredths.\"",
        ],
        es: [
          "Digan: 1 dólar es 1 entero. Una moneda de diez centavos es un décimo, o 0.1. Un centavo es un centésimo, o 0.01.",
          "Muestren $0.37 con 3 monedas de diez centavos y 7 centavos. Pregunten: ¿cuántos décimos? ¿Cuántos centésimos más?",
          "Formen $0.30 con 3 monedas de diez y $0.27 con 27 centavos. Pregunten: ¿qué es mayor, 0.3 o 0.27?",
          "Díganlo: \"0.3 es mayor que 0.27 porque 30 centésimos es más que 27 centésimos\".",
        ],
      },
    },
    {
      title: { en: "Measure and Convert", es: "Medir y convertir" },
      minutes: 15,
      materials: { en: "A ruler with centimeters, string, paper and a pencil", es: "Una regla con centímetros, hilo, papel y lápiz" },
      steps: {
        en: [
          "Measure the length of something in centimeters, like a table or a book. Write the number.",
          "Say: 100 centimeters make 1 meter. If your table is 150 cm long, how many meters is that? (1 and a half.)",
          "Now go the other way: a hallway is 3 meters long. Multiply: 3 × 100 = 300 centimeters.",
          "Ask: why is the number bigger in centimeters? (Because each centimeter is a smaller unit.)",
        ],
        es: [
          "Midan el largo de algo en centímetros, como una mesa o un libro. Escriban el número.",
          "Digan: 100 centímetros forman 1 metro. Si la mesa mide 150 cm de largo, ¿cuántos metros son? (Uno y medio.)",
          "Ahora al revés: un pasillo mide 3 metros de largo. Multipliquen: 3 × 100 = 300 centímetros.",
          "Pregunten: ¿por qué el número es más grande en centímetros? (Porque cada centímetro es una unidad más pequeña.)",
        ],
      },
    },
    {
      title: { en: "How Far Is the Bus Route?", es: "¿Qué tan larga es la ruta del autobús?" },
      minutes: 10,
      materials: { en: "Paper and a pencil; a bus map if you have one", es: "Papel y lápiz; un mapa del autobús si tienen" },
      steps: {
        en: [
          "Say: a bus route is 3 kilometers long. How many meters is that?",
          "Remember: 1 kilometer is 1,000 meters. Multiply: 3 × 1,000 = 3,000 meters.",
          "Ask: why do we use kilometers for a bus route and not centimeters?",
          "Make up another one: a walk to the park is 2 kilometers. How many meters?",
        ],
        es: [
          "Digan: una ruta de autobús mide 3 kilómetros. ¿Cuántos metros son?",
          "Recuerden: 1 kilómetro es 1,000 metros. Multipliquen: 3 × 1,000 = 3,000 metros.",
          "Pregunten: ¿por qué usamos kilómetros para una ruta de autobús y no centímetros?",
          "Inventen otro: una caminata al parque mide 2 kilómetros. ¿Cuántos metros son?",
        ],
      },
    },
    {
      title: { en: "Grocery Labels in Kilograms", es: "Etiquetas del supermercado en kilogramos" },
      minutes: 10,
      materials: { en: "Food packages with weights in grams (g) or kilograms (kg), paper and a pencil", es: "Empaques de comida con el peso en gramos (g) o kilogramos (kg), papel y lápiz" },
      steps: {
        en: [
          "Find a package that lists kilograms, like a bag of rice, flour, or beans.",
          "Say: 1 kilogram is 1,000 grams. If the bag is 2 kg, how many grams? (2 × 1,000 = 2,000.)",
          "Find a package labeled in grams. Is it more or less than 1 kilogram? How do you know?",
          "Ask: which unit would you use for a bag of rice, and which for a slice of cheese?",
        ],
        es: [
          "Busquen un empaque que diga kilogramos, como una bolsa de arroz, harina o frijoles.",
          "Digan: 1 kilogramo es 1,000 gramos. Si la bolsa pesa 2 kg, ¿cuántos gramos son? (2 × 1,000 = 2,000.)",
          "Busquen un empaque con gramos. ¿Es más o menos de 1 kilogramo? ¿Cómo lo sabes?",
          "Pregunten: ¿qué unidad usarías para una bolsa de arroz y cuál para una rebanada de queso?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because 1 meter equals 100 centimeters, [number] meters equals [number] centimeters.", es: "Como 1 metro es igual a 100 centímetros, [número] metros es igual a [número] centímetros." },
    { en: "[Decimal] is greater than [decimal] because [reason].", es: "[Decimal] es mayor que [decimal] porque [razón]." },
    { en: "I multiplied by [number], so the [object] is [number] [unit].", es: "Multipliqué por [número], entonces [objeto] mide [número] [unidad]." },
    { en: "As a result, the number of units is ___.", es: "Como resultado, el número de unidades es ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Use real things: coins, rulers, grocery labels. Metric units are on almost every package.",
      "Ask \"Why did the number get bigger?\" A smaller unit means more of them.",
      "Say decimals out loud in both languages: \"cero punto tres\" and \"three tenths.\"",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Usen cosas reales: monedas, reglas, etiquetas del supermercado. Las unidades métricas están en casi todos los empaques.",
      "Pregunten \"¿por qué el número se hizo más grande?\". Una unidad más pequeña significa que caben más.",
      "Digan los decimales en voz alta en los dos idiomas: \"cero punto tres\" y \"three tenths\".",
    ],
  },
  home_language: {
    en: "Many families already use the metric system at home. Share the units you know in Spanish: \"un metro, un kilómetro, un kilo.\" Then match them to the English words. Decimal, centímetro, metro, kilómetro, and kilogramo sound almost the same in both languages (decimal, centimeter, meter, kilometer, kilogram), so your child already knows them.",
    es: "Muchas familias ya usan el sistema métrico en casa. Compartan las unidades que conocen en español: \"un metro, un kilómetro, un kilo\". Luego relaciónenlas con las palabras en inglés. Decimal, centímetro, metro, kilómetro y kilogramo suenan casi igual en los dos idiomas (decimal, centimeter, meter, kilometer, kilogram), así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child reads a decimal or a metric label and tells you, in any language, why the number changes when the unit changes.",
    es: "Sabrán que está funcionando cuando su hijo o hija lea un decimal o una etiqueta métrica y les cuente, en el idioma que quiera, por qué cambia el número cuando cambia la unidad.",
  },
};

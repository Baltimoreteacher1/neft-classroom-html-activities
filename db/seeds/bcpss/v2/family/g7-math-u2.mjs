// BCPSS Family Guide (EN/ES) — g7-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on percents and money. Vocabulary order matches ../units/g7-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning to solve money problems with percents: discounts, sales tax, markups and simple interest. They also learn to check that an answer is reasonable. It matters every time you shop a sale, add tax at the register, save money in a bank, or wonder how much a store paid for something.",
    es: "Su hijo o hija está aprendiendo a resolver problemas de dinero con porcentajes: descuentos, impuestos sobre las ventas, márgenes de ganancia e interés simple. También aprende a comprobar que una respuesta sea razonable. Sirve cada vez que se compra en oferta, se suma el impuesto en la caja, se ahorra dinero en un banco o se piensa cuánto pagó una tienda por algo.",
  },
  goals: {
    en: [
      "I can find a discount, sales tax, markup or simple interest using a percent.",
      "I can find a percent error and a percent increase.",
      "I can estimate first and explain why my answer is reasonable.",
    ],
    es: [
      "Puedo hallar un descuento, un impuesto, un margen de ganancia o un interés simple usando un porcentaje.",
      "Puedo hallar un porcentaje de error y un aumento porcentual.",
      "Puedo estimar primero y explicar por qué mi respuesta es razonable.",
    ],
  },
  vocab: [
    { term: "markup", def_es: "el porcentaje extra que una tienda suma a lo que pagó, para poder ganar dinero", example_es: "Un margen de ganancia del 25% en una chaqueta de $40 suma $10." },
    { term: "discount", def_es: "una cantidad que se quita del precio normal", example_es: "Un descuento del 20% en una camisa de $30 ahorra $6." },
    { term: "sales tax", def_es: "un porcentaje del precio que la tienda agrega en la caja y envía al gobierno", example_es: "Maryland cobra 6% de impuesto sobre las ventas, así que un juego de $50 cuesta $3 más." },
    { term: "principal", def_es: "la cantidad de dinero con la que empiezas cuando ahorras o pides prestado", example_es: "El capital inicial es de $200, así que el 5% de interés simple es de $10 por año." },
    { term: "simple interest", def_es: "dinero que se gana o se debe solo sobre la cantidad inicial, con la misma tasa cada año", example_es: "Con 5% de interés simple, $100 ganan $5 cada año." },
    { term: "percent error", def_es: "qué tan lejos está una estimación del valor exacto, escrito como porcentaje del valor exacto", example_es: "Sam calculó $48 para un precio de $50, así que su porcentaje de error es de 4%." },
    { term: "percent increase", def_es: "cuánto crece una cantidad, escrito como porcentaje de la cantidad inicial", example_es: "Un juego que sube de $20 a $25 tiene un aumento porcentual de 25%." },
    { term: "estimate", def_es: "hallar rápido una respuesta cercana con números fáciles", example_es: "Estimo que el 10% de $79 es más o menos $8." },
    { term: "reasonable", def_es: "que tiene sentido y se acerca a lo que esperarías", example_es: "Un descuento de $5 en una chaqueta de $50 es razonable, pero uno de $60 no lo es." },
  ],
  talk: [
    { en: "About how much do you think it will cost after the discount? How did you guess?", es: "¿Más o menos cuánto crees que costará después del descuento? ¿Cómo lo calculaste?" },
    { en: "Is the answer too big or too small? How do you know?", es: "¿La respuesta es demasiado grande o demasiado pequeña? ¿Cómo lo sabes?" },
    { en: "What is 10 percent of this price? Can you use it to find 20 or 5 percent?", es: "¿Cuánto es el 10 por ciento de este precio? ¿Puedes usarlo para hallar el 20 o el 5 por ciento?" },
    { en: "Does the tax make the price go up or down? Why?", es: "¿El impuesto hace que el precio suba o baje? ¿Por qué?" },
    { en: "What did you multiply, and what does the answer mean in dollars?", es: "¿Qué multiplicaste y qué significa la respuesta en dólares?" },
  ],
  try_at_home: [
    {
      title: { en: "Sale Shopping", es: "Compras en oferta" },
      minutes: 15,
      materials: { en: "A store flyer, an online sale page, or price tags; paper and pencil", es: "Un volante de ofertas, una página de ofertas en línea o etiquetas de precio; papel y lápiz" },
      steps: {
        en: [
          "Pick an item with a sale, like a $30 shirt that is 20% off.",
          "Estimate first: 10% of $30 is $3, so 20% is about $6. What is the new price?",
          "Find the exact discount by multiplying $30 by 0.20. Compare to the estimate.",
          "Ask: is the new price reasonable? Try another item together.",
        ],
        es: [
          "Elijan un artículo en oferta, como una camisa de $30 con 20% de descuento.",
          "Estimen primero: el 10% de $30 es $3, así que el 20% es más o menos $6. ¿Cuál es el precio nuevo?",
          "Hallen el descuento exacto multiplicando $30 por 0.20. Comparen con la estimación.",
          "Pregunten: ¿es razonable el precio nuevo? Prueben con otro artículo juntos.",
        ],
      },
    },
    {
      title: { en: "Tax at the Register", es: "El impuesto en la caja" },
      minutes: 10,
      materials: { en: "A receipt that shows sales tax, paper and pencil", es: "Un recibo que muestre el impuesto sobre las ventas, papel y lápiz" },
      steps: {
        en: [
          "Look at a receipt. Find the price before tax and the tax amount.",
          "Ask your child to divide the tax by the price to see the percent. In Maryland, most items are taxed at 6%.",
          "Pick a new price, like $50. Ask: how much is 6% tax? What is the total?",
          "Ask: why is the total always more than the price?",
        ],
        es: [
          "Miren un recibo. Busquen el precio antes del impuesto y la cantidad del impuesto.",
          "Pídanle a su hijo o hija que divida el impuesto entre el precio para ver el porcentaje. En Maryland, la mayoría de los artículos paga 6%.",
          "Elijan un precio nuevo, como $50. Pregunten: ¿cuánto es el 6% de impuesto? ¿Cuál es el total?",
          "Pregunten: ¿por qué el total siempre es mayor que el precio?",
        ],
      },
    },
    {
      title: { en: "Save and Earn", es: "Ahorrar y ganar" },
      minutes: 15,
      materials: { en: "Paper and pencil, optional play money", es: "Papel y lápiz, dinero de juguete si quieren" },
      steps: {
        en: [
          "Pretend you save $200 in a bank that pays 5% simple interest each year.",
          "Ask: how much interest do you earn in 1 year? ($200 × 0.05 = $10.)",
          "Make a table: after 1 year, 2 years, 3 years. How much interest in all?",
          "Say it: \"The interest is $10 each year because 5% of $200 is $10.\"",
        ],
        es: [
          "Imaginen que ahorran $200 en un banco que paga 5% de interés simple cada año.",
          "Pregunten: ¿cuánto interés ganas en 1 año? ($200 × 0.05 = $10.)",
          "Hagan una tabla: después de 1 año, 2 años, 3 años. ¿Cuánto interés hay en total?",
          "Díganlo: \"El interés es de $10 cada año porque el 5% de $200 es $10\".",
        ],
      },
    },
    {
      title: { en: "How Far Off?", es: "¿Qué tan lejos?" },
      minutes: 10,
      materials: { en: "A few real prices from a receipt or flyer, paper and pencil", es: "Algunos precios reales de un recibo o volante, papel y lápiz" },
      steps: {
        en: [
          "Cover a price and ask your child to guess it. Say the real price is $50 and the guess is $48.",
          "Find how far off the guess is: $50 − $48 = $2.",
          "Divide that by the real price: $2 ÷ $50 = 0.04, or 4%. That is the percent error.",
          "Play again with other prices. Who has the smaller percent error?",
        ],
        es: [
          "Tapen un precio y pídanle a su hijo o hija que lo adivine. Digamos que el precio real es $50 y la idea es $48.",
          "Hallen qué tan lejos está: $50 − $48 = $2.",
          "Dividan eso entre el precio real: $2 ÷ $50 = 0.04, o sea 4%. Ese es el porcentaje de error.",
          "Jueguen otra vez con otros precios. ¿Quién tiene el porcentaje de error más pequeño?",
        ],
      },
    },
  ],
  say_it: [
    { en: "I multiplied $[30] by [0.20] because [a 20% discount is 20 out of 100].", es: "Multipliqué $[30] por [0.20] porque [un descuento del 20% es 20 de cada 100]." },
    { en: "The percent error is [4]% because the estimate is off by $[2].", es: "El porcentaje de error es [4]% porque la estimación se aleja por $[2]." },
    { en: "The interest is $[10] each year because [5]% of $[200] is $[10].", es: "El interés es de $[10] cada año porque el [5]% de $[200] es $[10]." },
    { en: "My answer is reasonable since [it is close to my estimate].", es: "Mi respuesta es razonable ya que [se acerca a mi estimación]." },
  ],
  help: {
    en: [
      "You do not need to know percent formulas. Ask your child to show you how they found it.",
      "Practice with real receipts and flyers. Ask \"about how much?\" before calculating.",
      "Ask \"does this make sense?\" A discount should make the price lower, and tax should make it higher.",
      "Let your child check with a calculator, but ask for an estimate first.",
    ],
    es: [
      "No necesitan saber fórmulas de porcentaje. Pídanle a su hijo o hija que les muestre cómo lo halló.",
      "Practiquen con recibos y volantes reales. Pregunten \"¿más o menos cuánto?\" antes de calcular.",
      "Pregunten \"¿tiene sentido?\". Un descuento debe bajar el precio y el impuesto debe subirlo.",
      "Dejen que revise con una calculadora, pero pidan primero una estimación.",
    ],
  },
  home_language: {
    en: "Many of these words are close in both languages: discount (descuento), estimate (estimar), percent (por ciento), reasonable (razonable), principal (capital). Talk about money in the language you know best. Percent is called \"por ciento\" in Spanish, and the math is the same.",
    es: "Muchas de estas palabras son parecidas en los dos idiomas: descuento (discount), estimar (estimate), por ciento (percent), razonable (reasonable), capital (principal). Hablen del dinero en el idioma que mejor conocen. Las matemáticas son las mismas en cualquier idioma.",
  },
  celebrate: {
    en: "You will know it is working when your child can look at a sale tag or a receipt, estimate the new price, and tell you in any language why the answer makes sense.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda mirar una etiqueta de oferta o un recibo, estimar el precio nuevo y decirles, en el idioma que quiera, por qué la respuesta tiene sentido.",
  },
};

// BCPSS Family Guide (EN/ES) — g5-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on multi-digit multiplication and decimal operations. Vocabulary order matches ../units/g5-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning to multiply bigger whole numbers and to add, subtract, multiply, and divide decimals up to hundredths, and to describe every step so someone else can follow and check the work. It matters at the store, when sharing a bill, and when making change. Your child will explain each step in order, in any language.",
    es: "Su hijo o hija está aprendiendo a multiplicar números enteros más grandes y a sumar, restar, multiplicar y dividir decimales hasta los centésimos, y a describir cada paso para que otra persona pueda seguir y comprobar el trabajo. Sirve en la tienda, al repartir una cuenta y al dar cambio. Su hijo o hija explicará cada paso en orden, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can multiply multi-digit numbers and add, subtract, multiply, and divide decimals to hundredths.",
      "I can estimate first and place the decimal point so my answer makes sense.",
      "I can explain my steps in order with first, next, then, and finally.",
    ],
    es: [
      "Puedo multiplicar números de varios dígitos y sumar, restar, multiplicar y dividir decimales hasta los centésimos.",
      "Puedo estimar primero y colocar el punto decimal para que mi respuesta tenga sentido.",
      "Puedo explicar mis pasos en orden con primero, después, luego y por último.",
    ],
  },
  vocab: [
    { term: "estimate", def_es: "hallar una respuesta cercana de forma rápida, muchas veces cambiando los números por otros más fáciles", example_es: "Estimo 4.8 × 6 como 5 × 6 = 30." },
    { term: "factor", def_es: "un número que se multiplica por otro número", example_es: "En 4.8 × 6, los factores son 4.8 y 6." },
    { term: "product", def_es: "la respuesta de una multiplicación", example_es: "El producto de 4.8 × 6 es 28.8." },
    { term: "partial product", def_es: "una parte de una multiplicación, que se halla multiplicando un valor posicional a la vez", example_es: "En 24 × 15, un producto parcial es 24 × 10 = 240." },
    { term: "regroup", def_es: "cambiar el nombre de un número cambiando 10 de un lugar por 1 del siguiente", example_es: "Reagrupo 12 unidades como 1 decena y 2 unidades." },
    { term: "dividend", def_es: "el número que se reparte en una división", example_es: "En 7.5 ÷ 5, el dividendo es 7.5." },
    { term: "divisor", def_es: "el número entre el que divides", example_es: "En 7.5 ÷ 5, el divisor es 5." },
    { term: "quotient", def_es: "la respuesta de una división", example_es: "En 7.5 ÷ 5, el cociente es 1.5." },
    { term: "hundredth", def_es: "una de 100 partes iguales de un entero, como un centavo en un dólar", example_es: "El 9 de 2.49 está en el lugar de los centésimos." },
  ],
  talk: [
    { en: "What was your estimate before you solved? How close was your answer?", es: "¿Cuál fue tu estimación antes de calcular? ¿Qué tan cerca estuvo tu respuesta?" },
    { en: "Walk me through your steps: first, next, then, finally.", es: "Cuéntame tus pasos: primero, después, luego, por último." },
    { en: "How did you decide where to put the decimal point?", es: "¿Cómo decidiste dónde poner el punto decimal?" },
    { en: "How can you check a division answer?", es: "¿Cómo puedes comprobar una división?" },
    { en: "Where do we use decimals at the store?", es: "¿Dónde usamos decimales en la tienda?" },
  ],
  try_at_home: [
    {
      title: { en: "Estimate, Then Multiply", es: "Estimar y luego multiplicar" },
      minutes: 15,
      materials: { en: "Paper and a pencil; a store flyer if you have one", es: "Papel y lápiz; un folleto de la tienda si tienen" },
      steps: {
        en: [
          "Say: apples cost $4.80 a bag. We buy 6 bags. About how much?",
          "Estimate first: $4.80 is close to $5, and 5 × 6 = 30. So the cost is about $30.",
          "Multiply without the decimal: 48 × 6 = 288. Then place the decimal point so the answer is close to 30: 28.8.",
          "Ask: why is the product $28.80 and not $2.88 or $288? Check against the estimate.",
        ],
        es: [
          "Digan: las manzanas cuestan $4.80 la bolsa. Compramos 6 bolsas. ¿Más o menos cuánto cuestan?",
          "Estimen primero: $4.80 está cerca de $5, y 5 × 6 = 30. Entonces el costo es de unos $30.",
          "Multipliquen sin el punto decimal: 48 × 6 = 288. Luego coloquen el punto decimal para que la respuesta quede cerca de 30: 28.8.",
          "Pregunten: ¿por qué el producto es $28.80 y no $2.88 ni $288? Compárenlo con la estimación.",
        ],
      },
    },
    {
      title: { en: "Pencils for Everyone", es: "Lápices para todos" },
      minutes: 15,
      materials: { en: "Paper and a pencil; a ruler to draw a rectangle", es: "Papel y lápiz; una regla para dibujar un rectángulo" },
      steps: {
        en: [
          "Say: 24 students each get 15 pencils. How many pencils?",
          "Break 15 into 10 and 5. Find the partial products: 24 × 10 = 240 and 24 × 5 = 120.",
          "Add the partial products: 240 + 120 = 360.",
          "Ask: how can you check? (Estimate 20 × 15 = 300, or do it a different way.)",
        ],
        es: [
          "Digan: 24 estudiantes reciben 15 lápices cada uno. ¿Cuántos lápices hacen falta?",
          "Separen 15 en 10 y 5. Hallen los productos parciales: 24 × 10 = 240 y 24 × 5 = 120.",
          "Sumen los productos parciales: 240 + 120 = 360.",
          "Pregunten: ¿cómo lo comprueban? (Estimen 20 × 15 = 300, o háganlo de otra manera.)",
        ],
      },
    },
    {
      title: { en: "Share the Bill", es: "Repartir la cuenta" },
      minutes: 10,
      materials: { en: "Paper and a pencil; coins and bills if you have them", es: "Papel y lápiz; monedas y billetes si tienen" },
      steps: {
        en: [
          "Say: 5 friends share a $7.50 snack bill equally. How much does each one pay?",
          "Estimate first: $7.50 is between $5 and $10, so each pays between $1 and $2.",
          "Divide: 7.50 ÷ 5 = 1.50. Place the decimal point so it matches the estimate.",
          "Check by multiplying: 1.50 × 5 = 7.50. Ask: why does that prove the division?",
        ],
        es: [
          "Digan: 5 amigos se reparten por igual una cuenta de $7.50. ¿Cuánto paga cada uno?",
          "Estimen primero: $7.50 está entre $5 y $10, así que cada uno paga entre $1 y $2.",
          "Dividan: 7.50 ÷ 5 = 1.50. Coloquen el punto decimal para que coincida con la estimación.",
          "Comprueben multiplicando: 1.50 × 5 = 7.50. Pregunten: ¿por qué eso demuestra la división?",
        ],
      },
    },
    {
      title: { en: "Making Change", es: "Dar cambio" },
      minutes: 10,
      materials: { en: "Paper and a pencil; play money or real coins (optional)", es: "Papel y lápiz; dinero de juguete o monedas reales (opcional)" },
      steps: {
        en: [
          "Say: a snack costs $2.49 and a drink costs $3.75. First, line up the decimal points and add. What is the total?",
          "Add the hundredths, then the tenths, then the ones. Regroup when you reach 10 or more. The total is $6.24.",
          "Next, you pay with $10. Subtract: 10.00 − 6.24 = 3.76. The change is $3.76.",
          "Finally, check: 6.24 + 3.76 = 10.00. Say why the answer makes sense.",
        ],
        es: [
          "Digan: una merienda cuesta $2.49 y una bebida cuesta $3.75. Primero, alineen los puntos decimales y sumen. ¿Cuál es el total?",
          "Sumen los centésimos, luego los décimos y luego las unidades. Reagrupen cuando lleguen a 10 o más. El total es $6.24.",
          "Después, pagan con $10. Resten: 10.00 − 6.24 = 3.76. El cambio es $3.76.",
          "Por último, comprueben: 6.24 + 3.76 = 10.00. Digan por qué la respuesta tiene sentido.",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, I estimated [problem] to be about [number]. Next, I [action].", es: "Primero, estimé que [problema] es más o menos [número]. Después, [acción]." },
    { en: "Then I placed the decimal point so the [product] is [number].", es: "Luego coloqué el punto decimal para que el [producto] sea [número]." },
    { en: "Finally, I checked by [multiplying], and the answer makes sense because ___.", es: "Por último, comprobé [multiplicando], y la respuesta tiene sentido porque ___." },
    { en: "The partial products are [number] and [number].", es: "Los productos parciales son [número] y [número]." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Ask for an estimate before the exact answer. It helps your child catch a decimal point in the wrong place.",
      "Use real prices from the store or a flyer. Money is decimals your child already knows.",
      "Ask your child to tell the steps in order, then check by doing the opposite operation.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Pidan una estimación antes de la respuesta exacta. Ayuda a notar un punto decimal en el lugar equivocado.",
      "Usen precios reales de la tienda o de un folleto. El dinero son decimales que su hijo o hija ya conoce.",
      "Pidan que cuente los pasos en orden y que luego compruebe con la operación opuesta.",
    ],
  },
  home_language: {
    en: "Talk through a shopping trip in Spanish first: \"son cuatro con ochenta por bolsa, compramos seis.\" Then say the same steps in English. Estimar, factor, producto, divisor, and cociente sound a lot like estimate, factor, product, divisor, and quotient, so your child already knows them.",
    es: "Conversen primero en español sobre una compra: \"son cuatro con ochenta por bolsa, compramos seis\". Luego digan los mismos pasos en inglés. Estimar, factor, producto, divisor y cociente suenan muy parecido a estimate, factor, product, divisor y quotient, así que su hijo o hija ya los conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child estimates a price, calculates it, and explains, in any language, each step in order and why the answer makes sense.",
    es: "Sabrán que está funcionando cuando su hijo o hija estime un precio, lo calcule y explique, en el idioma que quiera, cada paso en orden y por qué la respuesta tiene sentido.",
  },
};

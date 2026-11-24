// BCPSS Family Guide (EN/ES) — g4-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on multi-digit multiplication and division with remainders. Vocabulary order matches ../units/g4-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning to multiply bigger numbers by breaking them into friendly parts (an area model), and to divide with leftovers (remainders). It matters when someone packs boxes, shares cards, or figures out how many buses a trip needs. Your child will explain why a method works, in any language.",
    es: "Su hijo o hija está aprendiendo a multiplicar números más grandes dividiéndolos en partes fáciles (un modelo de área) y a dividir cuando sobra algo (residuos). Sirve cuando alguien empaca cajas, reparte cartas o calcula cuántos autobuses necesita un paseo. Su hijo o hija explicará por qué funciona un método, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can multiply with an area model and add the partial products.",
      "I can divide and tell what the remainder means.",
      "I can explain my method with because, so, and since.",
    ],
    es: [
      "Puedo multiplicar con un modelo de área y sumar los productos parciales.",
      "Puedo dividir y decir qué significa el residuo.",
      "Puedo explicar mi método con porque, entonces y ya que.",
    ],
  },
  vocab: [
    { term: "partial product", def_es: "la respuesta que obtienes al multiplicar una sola parte de un número", example_es: "En 6 × 27, un producto parcial es 6 × 20 = 120." },
    { term: "area model", def_es: "un dibujo de un rectángulo que divide una multiplicación en partes más pequeñas", example_es: "En el modelo de área, cada parte del rectángulo es un producto parcial." },
    { term: "factor", def_es: "un número que se multiplica por otro", example_es: "En 6 × 27, los factores son 6 y 27." },
    { term: "product", def_es: "la respuesta de una multiplicación", example_es: "El producto de 6 × 27 es 162." },
    { term: "dividend", def_es: "el número que se reparte en grupos iguales", example_es: "En 52 ÷ 5, el dividendo es 52." },
    { term: "divisor", def_es: "el número entre el que divides", example_es: "En 52 ÷ 5, el divisor es 5." },
    { term: "quotient", def_es: "la respuesta de una división, sin contar lo que sobra", example_es: "En 52 ÷ 5, el cociente es 10." },
    { term: "remainder", def_es: "lo que sobra después de hacer grupos iguales", example_es: "Al repartir 52 cartas entre 5, el residuo es 2." },
    { term: "estimate", def_es: "hallar una respuesta que está cerca, pero no es exacta", example_es: "Estimo 4 × 30 antes de multiplicar 4 × 29." },
  ],
  talk: [
    { en: "How did you break the number into parts today?", es: "¿Cómo dividiste el número en partes hoy?" },
    { en: "Show me your rectangle. What does each part of it mean?", es: "Muéstrame tu rectángulo. ¿Qué significa cada parte?" },
    { en: "What does the leftover mean in the story?", es: "¿Qué significa lo que sobra en el cuento?" },
    { en: "How can you check a division answer with multiplication?", es: "¿Cómo puedes comprobar una división con multiplicación?" },
    { en: "How do you know your answer is right?", es: "¿Cómo sabes que tu respuesta es correcta?" },
  ],
  try_at_home: [
    {
      title: { en: "Stadium Seats", es: "Asientos del estadio" },
      minutes: 15,
      materials: { en: "Paper, a pencil, a ruler or the edge of a book", es: "Papel, lápiz y una regla o el borde de un libro" },
      steps: {
        en: [
          "Say: a stadium section has 6 rows with 27 seats in each row. How many seats?",
          "Draw a rectangle. Split the 27 side into 20 and 7.",
          "Find each part: 6 × 20 = 120 and 6 × 7 = 42. These are partial products.",
          "Add them: 120 + 42 = 162. Ask: why does splitting the rectangle work?",
        ],
        es: [
          "Digan: una sección del estadio tiene 6 filas con 27 asientos en cada fila. ¿Cuántos asientos hay?",
          "Dibujen un rectángulo. Dividan el lado del 27 en 20 y 7.",
          "Hallen cada parte: 6 × 20 = 120 y 6 × 7 = 42. Estos son productos parciales.",
          "Súmenlos: 120 + 42 = 162. Pregunten: ¿por qué funciona dividir el rectángulo?",
        ],
      },
    },
    {
      title: { en: "Deal the Cards", es: "Repartir las cartas" },
      minutes: 10,
      materials: { en: "A deck of 52 cards, or 52 small items", es: "Una baraja de 52 cartas o 52 objetos pequeños" },
      steps: {
        en: [
          "Say: 5 players share 52 cards equally. Deal the cards one at a time.",
          "Count the cards each player has. (10 each.) That is the quotient.",
          "Count the cards left over. (2.) That is the remainder.",
          "Check: 5 × 10 = 50, and 50 + 2 = 52. Ask: why can the leftover not be dealt?",
        ],
        es: [
          "Digan: 5 jugadores se reparten 52 cartas por igual. Repartan las cartas de una en una.",
          "Cuenten las cartas de cada jugador. (10 cada uno.) Ese es el cociente.",
          "Cuenten las cartas que sobraron. (2.) Ese es el residuo.",
          "Comprueben: 5 × 10 = 50, y 50 + 2 = 52. Pregunten: ¿por qué no se pueden repartir las que sobran?",
        ],
      },
    },
    {
      title: { en: "How Many Buses?", es: "¿Cuántos autobuses?" },
      minutes: 10,
      materials: { en: "Paper and a pencil, 38 small items (optional)", es: "Papel y lápiz, 38 objetos pequeños (opcional)" },
      steps: {
        en: [
          "Say: 38 students are going on a trip. Each bus seats 9. How many buses do we need?",
          "Divide: 38 ÷ 9 = 4 with a remainder of 2. Check: 9 × 4 = 36, and 36 + 2 = 38.",
          "Ask: what do the 2 leftover students do? Do we need 4 buses or 5?",
          "Talk about it: the answer to the problem is 5 buses, because the remainder needs a seat too.",
        ],
        es: [
          "Digan: 38 estudiantes van de paseo. En cada autobús caben 9. ¿Cuántos autobuses necesitamos?",
          "Dividan: 38 ÷ 9 = 4 con residuo de 2. Comprueben: 9 × 4 = 36, y 36 + 2 = 38.",
          "Pregunten: ¿qué hacen los 2 estudiantes que sobran? ¿Necesitamos 4 autobuses o 5?",
          "Conversen: la respuesta al problema es 5 autobuses, porque al residuo también le hace falta un asiento.",
        ],
      },
    },
    {
      title: { en: "Estimate First", es: "Primero estimar" },
      minutes: 10,
      materials: { en: "Paper and a pencil; a sticker or trading-card pack if you have one", es: "Papel y lápiz; un paquete de calcomanías o de tarjetas si tienen" },
      steps: {
        en: [
          "Say: a store sells 4 packs with 29 stickers in each pack. About how many stickers?",
          "Estimate: 29 is close to 30, so 4 × 30 = 120.",
          "Now find the exact product with an area model: 4 × 20 = 80 and 4 × 9 = 36, so 80 + 36 = 116.",
          "Ask: is 116 close to the estimate? Why is it a little less than 120?",
        ],
        es: [
          "Digan: una tienda vende 4 paquetes con 29 calcomanías en cada uno. ¿Más o menos cuántas calcomanías hay?",
          "Estimen: 29 está cerca de 30, así que 4 × 30 = 120.",
          "Ahora hallen el producto exacto con un modelo de área: 4 × 20 = 80 y 4 × 9 = 36, entonces 80 + 36 = 116.",
          "Pregunten: ¿116 está cerca de la estimación? ¿Por qué es un poco menos que 120?",
        ],
      },
    },
  ],
  say_it: [
    { en: "I used an area model because [reason].", es: "Usé un modelo de área porque [razón]." },
    { en: "I added the partial products, so the product is [number].", es: "Sumé los productos parciales, entonces el producto es [número]." },
    { en: "The quotient is [number] and the remainder is [number], so ___.", es: "El cociente es [número] y el residuo es [número], entonces ___." },
    { en: "I checked with [multiplication] since ___.", es: "Comprobé con [multiplicación] ya que ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "You may have learned another way to multiply and divide. That is fine. Ask your child to show the school way and compare.",
      "Let your child draw a rectangle or deal real objects. Pictures and things beat memorizing steps.",
      "Always ask \"What does the leftover mean here?\" It changes with the story.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Tal vez ustedes aprendieron otra manera de multiplicar y dividir. Está bien. Pidan que les muestre la manera de la escuela y comparen.",
      "Dejen que dibuje un rectángulo o reparta objetos reales. Los dibujos y las cosas funcionan mejor que memorizar pasos.",
      "Siempre pregunten \"¿qué significa lo que sobra aquí?\". Cambia según el cuento.",
    ],
  },
  home_language: {
    en: "Compare how you multiply and divide with how your child learned it, and tell the story in Spanish first. Factor, producto, divisor, cociente, and estimar sound a lot like factor, product, divisor, quotient, and estimate, so your child already knows them.",
    es: "Comparen cómo multiplican y dividen ustedes con cómo lo aprendió su hijo o hija, y cuenten primero el cuento en español. Factor, producto, divisor, cociente y estimar suenan muy parecido a factor, product, divisor, quotient y estimate, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child solves a multiplication or division story with a drawing and explains, in any language, why the answer is right.",
    es: "Sabrán que está funcionando cuando su hijo o hija resuelva un cuento de multiplicación o división con un dibujo y explique, en el idioma que quiera, por qué la respuesta es correcta.",
  },
};

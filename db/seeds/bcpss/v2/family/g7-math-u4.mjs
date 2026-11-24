// BCPSS Family Guide (EN/ES) — g7-math-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on expressions, two-step equations and inequalities. Vocabulary order matches ../units/g7-math-u4.mjs.

export default {
  summary: {
    en: "Your child is learning to write math sentences with a letter for an unknown number, and to solve them by undoing each step in the right order. They also learn inequalities, which tell you how much you can spend or how many you can buy. It matters when you plan a budget, compare phone plans, or figure out how many items you can afford.",
    es: "Su hijo o hija está aprendiendo a escribir oraciones matemáticas con una letra para un número desconocido y a resolverlas deshaciendo cada paso en el orden correcto. También aprende las desigualdades, que dicen cuánto se puede gastar o cuántos artículos se pueden comprar. Sirve para planear un presupuesto, comparar planes de teléfono o calcular cuántas cosas se pueden pagar.",
  },
  goals: {
    en: [
      "I can simplify an expression and solve a two-step equation.",
      "I can graph the solutions of an inequality on a number line.",
      "I can explain my steps in order with First, Next, Then and Finally.",
    ],
    es: [
      "Puedo simplificar una expresión y resolver una ecuación de dos pasos.",
      "Puedo graficar las soluciones de una desigualdad en una recta numérica.",
      "Puedo explicar mis pasos en orden con Primero, Luego, Después y Por último.",
    ],
  },
  vocab: [
    { term: "variable", def_es: "una letra que representa un número que puede cambiar o que todavía no conocemos", example_es: "En 5x + 10, la variable x representa el número de clases." },
    { term: "linear expression", def_es: "una frase matemática con variables sin exponentes y sin signo de igual, como 3x + 4", example_es: "La expresión lineal 5x + 10 da el costo de x clases de gimnasio." },
    { term: "term", def_es: "una parte de una expresión, separada por signos de más o de menos", example_es: "La expresión 3x + 7 tiene dos términos: 3x y 7." },
    { term: "coefficient", def_es: "el número que multiplica a una variable", example_es: "En 5x, el coeficiente es 5." },
    { term: "constant", def_es: "un número solo que nunca cambia", example_es: "En 5x + 10, la constante es 10." },
    { term: "equation", def_es: "una oración matemática que dice que dos cantidades son iguales, con un signo de igual", example_es: "La ecuación 5x + 10 = 35 dice que el gimnasio cuesta $35 en total." },
    { term: "inequality", def_es: "una oración matemática que compara dos cantidades que no son iguales, con <, >, ≤ o ≥", example_es: "La desigualdad 5x + 10 ≤ 35 muestra lo máximo que puede gastar Sara." },
    { term: "solution set", def_es: "todos los números que hacen verdadera una ecuación o una desigualdad", example_es: "El conjunto solución de x ≤ 5 es todo número que sea 5 o menor." },
    { term: "distribute", def_es: "multiplicar un número por cada término que está dentro de paréntesis", example_es: "Distribuyo 3 en (x + 4) y obtengo 3x + 12." },
    { term: "inverse operation", def_es: "una operación que deshace otra, como restar deshace sumar", example_es: "La división es la operación inversa de la multiplicación." },
  ],
  talk: [
    { en: "What does the letter stand for in this story?", es: "¿Qué representa la letra en esta historia?" },
    { en: "Which step comes first when you undo the equation, and why?", es: "¿Qué paso va primero cuando deshaces la ecuación y por qué?" },
    { en: "How can you check your answer by putting it back in the equation?", es: "¿Cómo puedes comprobar tu respuesta poniéndola de nuevo en la ecuación?" },
    { en: "Is the number 5 a solution of this inequality? What about 6?", es: "¿El número 5 es una solución de esta desigualdad? ¿Y el 6?" },
    { en: "What does this equation mean in the real situation?", es: "¿Qué significa esta ecuación en la situación real?" },
  ],
  try_at_home: [
    {
      title: { en: "Gym Class Budget", es: "Presupuesto de clases" },
      minutes: 15,
      materials: { en: "Paper and pencil, a price list for classes, a rec center, or an arcade", es: "Papel y lápiz, una lista de precios de clases, un centro recreativo o un salón de juegos" },
      steps: {
        en: [
          "Pretend a gym charges $10 to sign up plus $5 per class. Let x be the number of classes.",
          "Write the expression: 5x + 10. Evaluate it for x = 3. What does the answer mean?",
          "Write the equation 5x + 10 = 35. First subtract 10 from both sides, then divide by 5. What is x?",
          "Check: put x back in. Does 5 times that plus 10 equal 35?",
        ],
        es: [
          "Imaginen que un gimnasio cobra $10 de inscripción más $5 por clase. Sea x el número de clases.",
          "Escriban la expresión: 5x + 10. Evalúenla para x = 3. ¿Qué significa la respuesta?",
          "Escriban la ecuación 5x + 10 = 35. Primero resten 10 en los dos lados y luego dividan entre 5. ¿Cuánto es x?",
          "Comprueben: pongan x de nuevo. ¿5 por esa cantidad más 10 es igual a 35?",
        ],
      },
    },
    {
      title: { en: "How Many Can We Buy?", es: "¿Cuántos podemos comprar?" },
      minutes: 15,
      materials: { en: "A store flyer, paper and pencil, a number line drawn on paper", es: "Un volante de ofertas, papel y lápiz, una recta numérica dibujada en papel" },
      steps: {
        en: [
          "Pick an item that costs $4 and say you have $30 minus a $6 delivery fee. Write 4x + 6 ≤ 30.",
          "Solve: subtract 6, then divide by 4. What are the whole-number answers?",
          "Draw a number line and shade every number that works. Put a solid dot on the end if it is included.",
          "Ask: is 6 a solution? Is 7? How do you know?",
        ],
        es: [
          "Elijan un artículo que cuesta $4 y digan que tienen $30 y hay que pagar $6 de entrega. Escriban 4x + 6 ≤ 30.",
          "Resuelvan: resten 6 y luego dividan entre 4. ¿Cuáles son las respuestas enteras?",
          "Dibujen una recta numérica y sombreen todos los números que sirven. Pongan un punto sólido en el extremo si está incluido.",
          "Pregunten: ¿6 es una solución? ¿Y 7? ¿Cómo lo saben?",
        ],
      },
    },
    {
      title: { en: "Undo It in Order", es: "Deshacerlo en orden" },
      minutes: 10,
      materials: { en: "A paper bag, a few coins or buttons, paper and pencil", es: "Una bolsa de papel, unas monedas o botones, papel y lápiz" },
      steps: {
        en: [
          "Think of a number. Multiply by 2, then add 5. Tell your child only the answer, like 17.",
          "Ask your child to undo the steps in reverse order: subtract 5, then divide by 2.",
          "Write it as an equation: 2x + 5 = 17. Does the equation match the game?",
          "Switch roles. Try a version with subtracting and dividing.",
        ],
        es: [
          "Piensen en un número. Multiplíquenlo por 2 y luego sumen 5. Díganle a su hijo o hija solo el resultado, como 17.",
          "Pídanle que deshaga los pasos en orden inverso: restar 5 y luego dividir entre 2.",
          "Escríbanlo como ecuación: 2x + 5 = 17. ¿La ecuación coincide con el juego?",
          "Cambien de papel. Prueben una versión que reste y divida.",
        ],
      },
    },
    {
      title: { en: "Distribute the Shopping", es: "Distribuir las compras" },
      minutes: 10,
      materials: { en: "Paper and pencil, a store flyer", es: "Papel y lápiz, un volante de ofertas" },
      steps: {
        en: [
          "Say you buy 3 gift sets, and each set has one shirt for $x and one hat for $4.",
          "Write the cost as 3(x + 4). Ask: how much for the shirts and hats together?",
          "Distribute: 3 times x plus 3 times 4 is 3x + 12.",
          "Pick a price for x, like $10, and check that both forms give the same total.",
        ],
        es: [
          "Digan que compran 3 sets de regalo y cada uno tiene una camisa de $x y un gorro de $4.",
          "Escriban el costo como 3(x + 4). Pregunten: ¿cuánto cuestan las camisas y los gorros juntos?",
          "Distribuyan: 3 por x más 3 por 4 es 3x + 12.",
          "Elijan un precio para x, como $10, y comprueben que las dos formas dan el mismo total.",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, I [subtracted] [10] from both sides to get [5x = 25].", es: "Primero, [resté] [10] en los dos lados para obtener [5x = 25]." },
    { en: "Next, I divided both sides by [5], so x = [5].", es: "Luego, dividí los dos lados entre [5], entonces x = [5]." },
    { en: "I checked by putting [5] in for x, and [35] equals [35].", es: "Revisé poniendo [5] en lugar de x, y [35] es igual a [35]." },
    { en: "Finally, I graphed [x ≤ 5] with a [solid] dot at [5].", es: "Por último, grafiqué [x ≤ 5] con un punto [sólido] en [5]." },
  ],
  help: {
    en: [
      "You do not need to know algebra. Ask \"what is the first step?\" and let your child lead.",
      "Use real costs: a fee plus a price for each one. Ask what the letter stands for.",
      "Ask your child to check every answer by putting it back in. This is the best proof.",
      "If your child is stuck, ask \"what is being done to x?\" and \"how do you undo it?\"",
    ],
    es: [
      "No necesitan saber álgebra. Pregunten \"¿cuál es el primer paso?\" y dejen que su hijo o hija lidere.",
      "Usen costos reales: una cuota más un precio por cada uno. Pregunten qué representa la letra.",
      "Pídanle a su hijo o hija que revise cada respuesta poniéndola de nuevo. Esa es la mejor prueba.",
      "Si se atora, pregunten \"¿qué se le está haciendo a x?\" y \"¿cómo se deshace?\".",
    ],
  },
  home_language: {
    en: "Say the steps in Spanish first: \"primero resto, luego divido\". Many words are close in both languages: variable (variable), term (término), coefficient (coeficiente), constant (constante), equation (ecuación), inequality (desigualdad), distribute (distribuir).",
    es: "Digan primero los pasos en español: \"primero resto, luego divido\". Muchas palabras son parecidas en inglés: variable (variable), término (term), coeficiente (coefficient), constante (constant), ecuación (equation), desigualdad (inequality), distribuir (distribute).",
  },
  celebrate: {
    en: "You will know it is working when your child can solve a cost problem step by step in any language, and check the answer by putting it back in.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda resolver un problema de costos paso a paso en el idioma que quiera y comprobar la respuesta poniéndola de nuevo.",
  },
};

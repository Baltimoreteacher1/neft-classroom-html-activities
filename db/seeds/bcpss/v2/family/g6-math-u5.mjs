// BCPSS Family Guide (EN/ES) — g6-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on expressions, equations and inequalities. Vocabulary order matches ../units/g6-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning to use letters to stand for unknown numbers and to solve for them. An equation is like a balanced scale: whatever you do to one side, you do to the other. It matters when you figure out how many hours you must work to earn a certain amount, how many tickets you can buy with a set budget, or how much money is left.",
    es: "Su hijo o hija está aprendiendo a usar letras para representar números desconocidos y a hallarlos. Una ecuación es como una balanza en equilibrio: lo que se hace de un lado, se hace del otro. Sirve para calcular cuántas horas hay que trabajar para ganar cierta cantidad, cuántas entradas se pueden comprar con un presupuesto o cuánto dinero queda.",
  },
  goals: {
    en: [
      "I can write and evaluate expressions, including ones with exponents.",
      "I can solve a one-step equation and check that my answer works.",
      "I can explain why my solution is right with because, since and which proves that.",
    ],
    es: [
      "Puedo escribir y evaluar expresiones, incluso las que tienen exponentes.",
      "Puedo resolver una ecuación de un paso y comprobar que mi respuesta funciona.",
      "Puedo explicar por qué mi solución es correcta con porque, ya que y lo cual demuestra que.",
    ],
  },
  vocab: [
    { term: "variable", def_es: "una letra que representa un número que no conocemos o que puede cambiar", example_es: "En 5n, la letra n es una variable." },
    { term: "coefficient", def_es: "el número que multiplica a una letra", example_es: "En 7y, el coeficiente es 7." },
    { term: "expression", def_es: "una frase matemática con números, letras y operaciones, pero sin signo de igual", example_es: "3n + 2 es una expresión." },
    { term: "equation", def_es: "una oración matemática que dice que dos cantidades son iguales, como una balanza en equilibrio", example_es: "x + 7 = 19 es una ecuación." },
    { term: "equivalent expressions", def_es: "expresiones que valen lo mismo sin importar el número que pongas en la letra", example_es: "3x + 2x y 5x son expresiones equivalentes." },
    { term: "inverse operation", def_es: "una operación que deshace otra, como quitar lo que se puso", example_es: "La resta es la operación inversa de la suma." },
    { term: "exponent", def_es: "un numerito elevado que dice cuántas veces se multiplica un número por sí mismo", example_es: "En 5², el exponente es 2." },
    { term: "inequality", def_es: "una oración matemática que compara dos cantidades con <, >, ≤ o ≥", example_es: "x > 5 es una desigualdad con muchas soluciones." },
    { term: "solution", def_es: "el valor que hace verdadera una ecuación o una desigualdad", example_es: "x = 12 es la solución de x + 7 = 19." },
    { term: "evaluate", def_es: "hallar el valor de una expresión poniendo un número en lugar de la letra", example_es: "Para evaluar 3n cuando n = 4, cambio n por 4 y obtengo 12." },
  ],
  talk: [
    { en: "What number does the letter stand for in your problem?", es: "¿Qué número representa la letra en tu problema?" },
    { en: "What did you do to both sides, and why?", es: "¿Qué hiciste en los dos lados y por qué?" },
    { en: "How can you check that your answer really works?", es: "¿Cómo puedes comprobar que tu respuesta de verdad funciona?" },
    { en: "Is there more than one answer that works for this inequality?", es: "¿Hay más de una respuesta que sirva para esta desigualdad?" },
    { en: "Where could we use a letter for an unknown number at home?", es: "¿Dónde podríamos usar una letra para un número desconocido en casa?" },
  ],
  try_at_home: [
    {
      title: { en: "The Balance Scale", es: "La balanza" },
      minutes: 15,
      materials: { en: "A ruler or hanger as a scale, two small bags, coins or paper clips", es: "Una regla o un gancho de ropa como balanza, dos bolsitas, monedas o clips" },
      steps: {
        en: [
          "Hide some clips in a bag and call that number x. Put the bag and 7 loose clips on one side of the scale, and 19 loose clips on the other side, so it balances.",
          "Tell your child: x + 7 = 19. Take 7 loose clips off both sides. What stays balanced?",
          "Ask: what is x? Check by putting that many clips back in the bag and counting.",
          "Try a new one, like 3x = 15, and ask: what do you do to both sides this time?",
        ],
        es: [
          "Escondan algunos clips en una bolsa y llamen x a esa cantidad. Pongan la bolsa y 7 clips sueltos de un lado de la balanza, y 19 clips sueltos del otro, para que quede en equilibrio.",
          "Díganle a su hijo o hija: x + 7 = 19. Quiten 7 clips sueltos de los dos lados. ¿Qué sigue en equilibrio?",
          "Pregunten: ¿cuánto es x? Comprueben poniendo esa cantidad de clips en la bolsa y contando.",
          "Prueben con otra, como 3x = 15, y pregunten: ¿qué haces en los dos lados esta vez?",
        ],
      },
    },
    {
      title: { en: "Budget Letter", es: "La letra del presupuesto" },
      minutes: 15,
      materials: { en: "Paper and pencil, a store flyer or receipt", es: "Papel y lápiz, un volante de ofertas o un recibo" },
      steps: {
        en: [
          "Pick an item that costs $4 each and a budget of $20. Let n be the number of items.",
          "Write the expression for the cost: 4n. Evaluate it for n = 3. Ask: what does it mean?",
          "Write the inequality 4n ≤ 20. Ask: how many items can we buy? Is 5 a solution? Is 6?",
          "Say aloud: the solution is every number that makes the sentence true.",
        ],
        es: [
          "Elijan un producto que cuesta $4 cada uno y un presupuesto de $20. Sea n la cantidad de productos.",
          "Escriban la expresión del costo: 4n. Evalúenla con n = 3. Pregunten: ¿qué significa?",
          "Escriban la desigualdad 4n ≤ 20. Pregunten: ¿cuántos productos podemos comprar? ¿5 es una solución? ¿Y 6?",
          "Digan en voz alta: la solución es todo número que hace verdadera la oración.",
        ],
      },
    },
    {
      title: { en: "Mystery Number Game", es: "Juego del número misterioso" },
      minutes: 10,
      materials: { en: "Paper, pencil and two players", es: "Papel, lápiz y dos jugadores" },
      steps: {
        en: [
          "One person thinks of a number and gives clues as an equation, like n + 9 = 15.",
          "The other person undoes it with the inverse operation: 15 − 9.",
          "Check by putting the answer back in: does 6 + 9 equal 15?",
          "Switch roles. Try a multiplication clue, like 4n = 28.",
        ],
        es: [
          "Una persona piensa en un número y da pistas como ecuación, por ejemplo n + 9 = 15.",
          "La otra persona lo deshace con la operación inversa: 15 − 9.",
          "Comprueben poniendo la respuesta: ¿6 + 9 es igual a 15?",
          "Cambien de papel. Prueben con una pista de multiplicación, como 4n = 28.",
        ],
      },
    },
    {
      title: { en: "Powers on the Block", es: "Potencias en la cuadra" },
      minutes: 10,
      materials: { en: "Paper and pencil, a floor tile or a small square sheet", es: "Papel y lápiz, una baldosa o una hoja cuadrada pequeña" },
      steps: {
        en: [
          "Pick a square tile with side 5 inches. Its area is 5 × 5, written 5².",
          "Say it aloud: five squared. Ask: what is the exponent, and what does it tell us?",
          "Try a cube with side 2: 2 × 2 × 2 = 2³. Ask: what is the value?",
          "Ask: is 5² the same as 5 × 2? Check both.",
        ],
        es: [
          "Elijan una baldosa cuadrada de 5 pulgadas por lado. Su área es 5 × 5, que se escribe 5².",
          "Díganlo en voz alta: cinco al cuadrado. Pregunten: ¿cuál es el exponente y qué nos dice?",
          "Prueben con un cubo de lado 2: 2 × 2 × 2 = 2³. Pregunten: ¿cuánto vale?",
          "Pregunten: ¿5² es lo mismo que 5 × 2? Revisen los dos.",
        ],
      },
    },
  ],
  say_it: [
    { en: "I [subtracted] [7] from both sides because [it undoes the plus 7].", es: "Les [resté] [7] a los dos lados porque [así se deshace el más 7]." },
    { en: "I checked: [12] + [7] = [19], so the solution is correct.", es: "Revisé: [12] + [7] = [19], entonces la solución es correcta." },
    { en: "The expressions are equivalent because [they have the same value for every number].", es: "Las expresiones son equivalentes porque [valen lo mismo con cualquier número]." },
    { en: "Since [x] stands for [the unknown number], I can [evaluate] when [x = 4].", es: "Como [x] representa [el número desconocido], puedo [evaluar] cuando [x = 4]." },
  ],
  help: {
    en: [
      "You do not need to solve equations. Ask your child to show you what is on each side of the balance.",
      "Ask \"how can you check it?\" Putting the answer back in the equation is the best proof.",
      "Use everyday stories: price times number of items, money left after spending.",
      "If your child is stuck, ask \"what operation undoes this one?\"",
    ],
    es: [
      "No necesitan saber resolver ecuaciones. Pídanle a su hijo o hija que les muestre qué hay en cada lado de la balanza.",
      "Pregunten \"¿cómo puedes comprobarlo?\". Poner la respuesta de nuevo en la ecuación es la mejor prueba.",
      "Usen historias de todos los días: precio por cantidad de productos, dinero que queda después de gastar.",
      "Si se atora, pregunten \"¿qué operación deshace esta?\".",
    ],
  },
  home_language: {
    en: "Say the math story in Spanish first: \"Tengo x galletas y me dan 7 más; ahora tengo 19.\" Then write the equation x + 7 = 19. Variable (variable), expression (expresión), equation (ecuación), exponent (exponente) and solution (solución) sound almost the same in both languages, so your child already knows them.",
    es: "Cuenten primero la historia matemática en español: \"Tengo x galletas y me dan 7 más; ahora tengo 19\". Después escriban la ecuación x + 7 = 19. Variable (variable), expresión (expression), ecuación (equation), exponente (exponent) y solución (solution) suenan casi igual en los dos idiomas, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child can pick a problem with an unknown number, solve it, and prove in any language that the answer works.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda tomar un problema con un número desconocido, resolverlo y demostrar, en el idioma que quiera, que la respuesta funciona.",
  },
};

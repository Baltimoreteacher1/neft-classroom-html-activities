// BCPSS Family Guide (EN/ES) — g2-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 2 unit on add and subtract within 100. Vocabulary order matches ../units/g2-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning to add and subtract numbers within 100 and to check that an answer makes sense. We use tens and ones, regrouping, and number lines. It matters at the store, when we count change, or add up points in a game. Your child will explain the steps with first, then, and because.",
    es: "Su hijo o hija está aprendiendo a sumar y restar números hasta 100 y a comprobar que una respuesta tiene sentido. Usamos decenas y unidades, reagrupar y rectas numéricas. Sirve en la tienda, cuando contamos el cambio o sumamos puntos en un juego. Su hijo o hija explicará los pasos con primero, luego y porque.",
  },
  goals: {
    en: [
      "I can add and subtract numbers within 100.",
      "I can check that my answer makes sense.",
      "I can explain my steps with first, then, and because.",
    ],
    es: [
      "Puedo sumar y restar números hasta 100.",
      "Puedo comprobar que mi respuesta tiene sentido.",
      "Puedo explicar mis pasos con primero, luego y porque.",
    ],
  },
  vocab: [
    { term: "sum", def_es: "la respuesta que sale cuando sumas", example_es: "La suma de 34 y 25 es 59." },
    { term: "difference", def_es: "la respuesta que sale cuando le quitas un número a otro; la resta", example_es: "La diferencia entre 50 y 20 es 30." },
    { term: "tens", def_es: "grupos de diez; en el 47, el 4 representa 4 de estos", example_es: "El 47 tiene 4 decenas." },
    { term: "ones", def_es: "las piezas sueltas que quedan después de hacer grupos de diez; en el 47, el 7", example_es: "El 47 tiene 7 unidades." },
    { term: "regroup", def_es: "reagrupar: cambiar 10 unidades por 1 decena, o 1 decena por 10 unidades", example_es: "Reagrupo 10 unidades como 1 decena." },
    { term: "partial sums", def_es: "sumas parciales: respuestas pequeñas que salen al sumar por separado las decenas y las unidades, y luego juntarlas", example_es: "Con sumas parciales, 34 + 25 es 30 + 20 y 4 + 5, y eso es 50 + 9." },
    { term: "estimate", def_es: "estimar: hacer una idea inteligente que se acerca a la respuesta real", example_es: "Estimo que 48 + 31 es casi 80." },
    { term: "reasonable", def_es: "razonable: que tiene sentido cuando lo revisas", example_es: "Mi respuesta es razonable porque se acerca a mi estimación." },
    { term: "number line", def_es: "una recta numérica: una línea con números en orden por la que puedes saltar para sumar o restar", example_es: "Salto de diez en diez en la recta numérica." },
  ],
  talk: [
    { en: "What did you do first? What did you do then?", es: "¿Qué hiciste primero? ¿Qué hiciste luego?" },
    { en: "Does your answer make sense? How do you know?", es: "¿Tu respuesta tiene sentido? ¿Cómo lo sabes?" },
    { en: "What is your estimate? Is the answer close to it?", es: "¿Cuál es tu estimación? ¿La respuesta se acerca?" },
    { en: "Is there another way to solve it?", es: "¿Hay otra manera de solucionarlo?" },
    { en: "When do we add or subtract at the store or at home?", es: "¿Cuándo sumamos o restamos en la tienda o en la casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Grocery Store Estimate", es: "Estimar en la tienda" },
      minutes: 15,
      materials: { en: "Grocery flyers or real items with prices, paper, a pencil", es: "Folletos de la tienda o productos reales con precio, papel y un lápiz" },
      steps: {
        en: [
          "Pick two items with prices under $100, like $38 and $47.",
          "Ask: about how much will they cost together? Round to tens: 40 plus 50.",
          "Find the exact total together with tens and ones.",
          "Ask: is the exact answer close to your estimate? Does it make sense?",
        ],
        es: [
          "Elijan dos productos con precio menor de $100, como $38 y $47.",
          "Pregunten: ¿cuánto costarán más o menos juntos? Redondeen a decenas: 40 más 50.",
          "Encuentren juntos el total exacto con decenas y unidades.",
          "Pregunten: ¿la respuesta exacta se acerca a tu estimación? ¿Tiene sentido?",
        ],
      },
    },
    {
      title: { en: "Partial Sums with Beans", es: "Sumas parciales con frijoles" },
      minutes: 15,
      materials: { en: "Dry beans, cups, paper, a pencil", es: "Frijoles secos, tazas, papel y un lápiz" },
      steps: {
        en: [
          "Pick an adding problem, like 36 plus 28.",
          "Make tens and ones with beans: 3 tens and 6 ones, 2 tens and 8 ones.",
          "Add the tens: 50. Then add the ones: 14.",
          "Put the parts together: 50 plus 14 is 64. Ask: how did the ones change?",
        ],
        es: [
          "Elijan un problema de suma, como 36 más 28.",
          "Formen decenas y unidades con frijoles: 3 decenas y 6 unidades, 2 decenas y 8 unidades.",
          "Sumen las decenas: 50. Luego sumen las unidades: 14.",
          "Junten las partes: 50 más 14 es 64. Pregunten: ¿cómo cambiaron las unidades?",
        ],
      },
    },
    {
      title: { en: "Hop on the Number Line", es: "Saltos en la recta numérica" },
      minutes: 10,
      materials: { en: "Chalk, tape, or paper to draw a line with numbers", es: "Tiza, cinta o papel para dibujar una línea con números" },
      steps: {
        en: [
          "Draw a number line from 0 to 100 with marks at every 10.",
          "Pick a problem, like 47 plus 23. Start at 47.",
          "Jump 20 (two jumps of ten), then jump 3 more.",
          "Where did you land? Say the sum. Then go back to check.",
        ],
        es: [
          "Dibujen una recta numérica del 0 al 100 con marcas cada 10.",
          "Elijan un problema, como 47 más 23. Empiecen en el 47.",
          "Salten 20 (dos saltos de diez) y luego 3 más.",
          "¿Dónde llegaron? Digan la suma. Luego regresen para comprobar.",
        ],
      },
    },
    {
      title: { en: "Game Score Math", es: "Sumar puntos de un juego" },
      minutes: 10,
      materials: { en: "Any family game with points, or two dice and paper", es: "Cualquier juego familiar con puntos, o dos dados y papel" },
      steps: {
        en: [
          "Play a game and keep score on paper.",
          "After each round, add the new points to the old score.",
          "Ask: how many more points does the leader have? Subtract to find out.",
          "Say: first I added the tens, then the ones, because...",
        ],
        es: [
          "Jueguen y lleven la cuenta de los puntos en un papel.",
          "Después de cada ronda, sumen los puntos nuevos al puntaje anterior.",
          "Pregunten: ¿cuántos puntos más tiene quien va ganando? Resten para averiguarlo.",
          "Digan: primero sumé las decenas, luego las unidades, porque...",
        ],
      },
    },
  ],
  say_it: [
    { en: "First I added the [tens], then I added the [ones].", es: "Primero sumé las [decenas], luego sumé las [unidades]." },
    { en: "I regrouped [number] ones into [number] ten and [number] ones.", es: "Reagrupé [número] unidades en [número] decena y [número] unidades." },
    { en: "My answer is reasonable because my estimate is [number].", es: "Mi respuesta es razonable porque mi estimación es [número]." },
    { en: "The difference is [number] because I jumped back [number].", es: "La diferencia es [número] porque salté hacia atrás [número]." },
  ],
  help: {
    en: [
      "Ask \"does that make sense?\" before you say if it is right. Let your child check.",
      "Use real prices from flyers and store receipts. Real numbers make it matter.",
      "Say \"show me\" and \"why?\" in any language. Explaining out loud helps.",
      "If there is a mistake, ask \"what could you try next?\" Mistakes are part of learning.",
    ],
    es: [
      "Pregunten \"¿tiene sentido?\" antes de decir si está bien. Dejen que su hijo o hija lo compruebe.",
      "Usen precios de verdad de folletos y recibos de la tienda. Los números reales importan más.",
      "Digan \"muéstrame\" y \"¿por qué?\" en cualquier idioma. Explicar en voz alta ayuda.",
      "Si hay un error, pregunten \"¿qué podrías probar ahora?\" Los errores son parte de aprender.",
    ],
  },
  home_language: {
    en: "Tell your child how you add and subtract in your own way, in Spanish. Many families use different methods, and that is a strength! Then find the English words together. \"Estimar\" and \"estimate,\" \"suma\" and \"sum,\" and \"diferencia\" and \"difference\" sound alike.",
    es: "Cuéntenle a su hijo o hija cómo suman y restan ustedes, a su manera, en español. Muchas familias usan métodos distintos, ¡y eso es una fortaleza! Luego busquen juntos las palabras en inglés. \"Estimar\" y \"estimate\", \"suma\" y \"sum\", y \"diferencia\" y \"difference\" suenan parecido.",
  },
  celebrate: {
    en: "You will know it is working when your child adds or subtracts a pair of numbers within 100, tells the steps in order, and checks that the answer makes sense.",
    es: "Sabrán que está funcionando cuando su hijo o hija sume o reste dos números hasta 100, cuente los pasos en orden y compruebe que la respuesta tiene sentido.",
  },
};

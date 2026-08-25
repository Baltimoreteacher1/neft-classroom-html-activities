// Constructive practice items — units 1, 4-3, 7-7. Authored 2026-08-20.
// Each lesson gets one build/construct item per tier: approaching, onLevel, extending.
export default {
  "1-1": {
    approaching: [
      {
        type: "drag-sort",
        instructions: "Sort each thought: does it help a doer of math, or keep a thinker stuck?",
        instructionsEs:
          "Clasifica cada pensamiento: ¿ayuda a un hacedor de matemáticas o mantiene atascado al pensador?",
        label: "Sort each thought by the kind of thinking it shows.",
        labelEs: "Clasifica cada pensamiento según el tipo de razonamiento que muestra.",
        categories: [
          {
            label: "Doer-of-math thinking",
            labelEs: "Pensamiento de hacedor de matemáticas",
            items: [
              "I can't do this... yet.",
              "Mistakes give my brain information.",
              "Let me look for a different entry point.",
              "An estimate first will help me check my answer.",
            ],
            itemsEs: [
              "Todavía no puedo hacer esto... todavía.",
              "Los errores le dan información a mi cerebro.",
              "Voy a buscar otro punto de entrada.",
              "Estimar primero me ayudará a comprobar mi respuesta.",
            ],
          },
          {
            label: "Stuck thinking",
            labelEs: "Pensamiento atascado",
            items: [
              "I'm just not a math person.",
              "If it's hard, I should quit.",
              "There is only one right way to solve it.",
              "Being fast is the same as being smart.",
            ],
            itemsEs: [
              "Simplemente no soy una persona de matemáticas.",
              "Si es difícil, debería rendirme.",
              "Solo hay una forma correcta de resolverlo.",
              "Ser rápido es lo mismo que ser inteligente.",
            ],
          },
        ],
        hints: [
          "Doer-of-math thoughts leave a next step open: try, estimate, look again.",
          "Stuck thoughts close the door: quit, never, only one way.",
        ],
        hintsEs: [
          "Los pensamientos de hacedor dejan abierto un siguiente paso: intentar, estimar, mirar de nuevo.",
          "Los pensamientos atascados cierran la puerta: rendirse, nunca, una sola forma.",
        ],
        explanation:
          "Doer-of-math thoughts keep the problem open — 'yet', 'a different entry point', and 'estimate first' all name a next move. Stuck thoughts end the work before it starts: 'not a math person', 'quit', 'only one way', and 'fast means smart' are all claims this lesson pushes back on.",
        explanationEs:
          "Los pensamientos de hacedor mantienen el problema abierto: 'todavía', 'otro punto de entrada' y 'estimar primero' nombran un siguiente paso. Los pensamientos atascados terminan el trabajo antes de empezar: 'no soy de matemáticas', 'rendirse', 'una sola forma' y 'rápido es inteligente' son ideas que esta lección refuta.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Use mental math to complete each Ferris wheel estimate.",
        labelEs: "Usa cálculo mental para completar cada estimación de la rueda de la fortuna.",
        columns: ["Situation", "Estimate", "Answer"],
        rows: [
          { situation: "20 cars, each holding about 4 riders", estimate: "20 × 4", answer: "80" },
          {
            situation: "About 80 riders each turn, 6 turns in an hour",
            estimate: "80 × 6",
            answer: "480",
          },
          {
            situation: "About 480 riders each hour, for 2 hours",
            estimate: "480 × 2",
            answer: "960",
          },
        ],
        hints: [
          "Each row builds on the row before it — use your last answer as the next start.",
          "Multiples of ten make mental math friendly: 20 × 4, then 80 × 6, then 480 × 2.",
        ],
        hintsEs: [
          "Cada fila se apoya en la anterior: usa tu última respuesta como el siguiente punto de partida.",
          "Los múltiplos de diez facilitan el cálculo mental: 20 × 4, luego 80 × 6, luego 480 × 2.",
        ],
        explanation:
          "20 cars × about 4 riders is about 80 riders per turn. Six turns an hour gives 80 × 6 = 480 riders, and two hours doubles it to 960. Each estimate feeds the next — that is what makes estimation a checking tool, not a guess.",
        explanationEs:
          "20 carros × unas 4 personas son unos 80 pasajeros por vuelta. Seis vueltas por hora dan 80 × 6 = 480 pasajeros, y dos horas lo duplican a 960. Cada estimación alimenta la siguiente: eso convierte la estimación en una herramienta de comprobación, no en una adivinanza.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each number to a correct decomposition.",
        labelEs: "Empareja cada número con una descomposición correcta.",
        columns: 2,
        pairs: [
          { term: "78.5", match: "70 + 8 + 0.5", termEs: "78.5", matchEs: "70 + 8 + 0.5" },
          {
            term: "78.5 using multiplication",
            match: "(7 × 10) + (8 × 1) + (5 × 0.1)",
            termEs: "78.5 con multiplicación",
            matchEs: "(7 × 10) + (8 × 1) + (5 × 0.1)",
          },
          { term: "480", match: "6 × 80", termEs: "480", matchEs: "6 × 80" },
          { term: "12.5", match: "12 + 0.5", termEs: "12.5", matchEs: "12 + 0.5" },
        ],
        hints: [
          "Check each decomposition by computing its value — does it rebuild the original number exactly?",
          "For the multiplication form, each digit is multiplied by its place value: tens, ones, tenths.",
        ],
        hintsEs: [
          "Comprueba cada descomposición calculando su valor: ¿reconstruye exactamente el número original?",
          "En la forma con multiplicación, cada dígito se multiplica por su valor posicional: decenas, unidades, décimas.",
        ],
        explanation:
          "A decomposition is correct when its parts rebuild the whole: 70 + 8 + 0.5 = 78.5, and (7 × 10) + (8 × 1) + (5 × 0.1) writes the same number by place value. 6 × 80 rebuilds 480, and 12 + 0.5 rebuilds 12.5.",
        explanationEs:
          "Una descomposición es correcta cuando sus partes reconstruyen el total: 70 + 8 + 0.5 = 78.5, y (7 × 10) + (8 × 1) + (5 × 0.1) escribe el mismo número por valor posicional. 6 × 80 reconstruye 480, y 12 + 0.5 reconstruye 12.5.",
      },
    ],
  },

  "1-2": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "Each new building is a fraction of One World Trade Center's 540 meters. Sort each plan without computing.",
        instructionsEs:
          "Cada edificio nuevo es una fracción de los 540 metros del One World Trade Center. Clasifica cada plan sin calcular.",
        label: "Sort each building plan: shorter or taller than 540 meters?",
        labelEs: "Clasifica cada plan: ¿más bajo o más alto que 540 metros?",
        categories: [
          {
            label: "Shorter than 540 m (fraction less than 1)",
            labelEs: "Más bajo que 540 m (fracción menor que 1)",
            items: ["9/10 of 540", "5/6 of 540", "3/4 of 540"],
            itemsEs: ["9/10 de 540", "5/6 de 540", "3/4 de 540"],
          },
          {
            label: "Taller than 540 m (fraction greater than 1)",
            labelEs: "Más alto que 540 m (fracción mayor que 1)",
            items: ["6/5 of 540", "11/10 of 540", "7/6 of 540"],
            itemsEs: ["6/5 de 540", "11/10 de 540", "7/6 de 540"],
          },
        ],
        hints: [
          "Compare the numerator to the denominator before you multiply anything.",
          "A fraction less than 1 shrinks the 540; a fraction greater than 1 stretches it.",
        ],
        hintsEs: [
          "Compara el numerador con el denominador antes de multiplicar nada.",
          "Una fracción menor que 1 encoge los 540; una fracción mayor que 1 los estira.",
        ],
        explanation:
          "No computation is needed: when the numerator is smaller than the denominator (9/10, 5/6, 3/4) the fraction is less than 1, so the building is shorter than 540 m. When the numerator is larger (6/5, 11/10, 7/6) the fraction is greater than 1, so the building is taller.",
        explanationEs:
          "No hace falta calcular: cuando el numerador es menor que el denominador (9/10, 5/6, 3/4), la fracción es menor que 1 y el edificio es más bajo que 540 m. Cuando el numerador es mayor (6/5, 11/10, 7/6), la fracción es mayor que 1 y el edificio es más alto.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Compute each building's height as a fraction of 540 meters.",
        labelEs: "Calcula la altura de cada edificio como fracción de 540 metros.",
        columns: ["Building plan", "Fraction of 540 m", "Height (m)"],
        rows: [
          { plan: "Rio de Janeiro", fraction: "9/10 of 540", answer: "486" },
          { plan: "Tokyo", fraction: "6/5 of 540", answer: "648" },
          { plan: "Prototype", fraction: "1/2 of 540", answer: "270" },
        ],
        hints: [
          "Divide 540 by the denominator first, then multiply by the numerator.",
          "540 ÷ 10 = 54 and 540 ÷ 5 = 108 — both divide evenly, which is why these fractions are friendly.",
        ],
        hintsEs: [
          "Divide 540 entre el denominador primero y luego multiplica por el numerador.",
          "540 ÷ 10 = 54 y 540 ÷ 5 = 108: ambos dividen exacto, por eso estas fracciones son amigables.",
        ],
        explanation:
          "For 9/10 of 540: 540 ÷ 10 = 54, then 54 × 9 = 486. For 6/5 of 540: 540 ÷ 5 = 108, then 108 × 6 = 648 — taller than the original, as a fraction greater than 1 predicts. Half of 540 is 270.",
        explanationEs:
          "Para 9/10 de 540: 540 ÷ 10 = 54, luego 54 × 9 = 486. Para 6/5 de 540: 540 ÷ 5 = 108, luego 108 × 6 = 648, más alto que el original, como predice una fracción mayor que 1. La mitad de 540 es 270.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each fraction of 540 to a shortcut that computes it.",
        labelEs: "Empareja cada fracción de 540 con un atajo que la calcula.",
        columns: 2,
        pairs: [
          { term: "9/10 of 540", match: "540 − 54", termEs: "9/10 de 540", matchEs: "540 − 54" },
          { term: "6/5 of 540", match: "540 + 108", termEs: "6/5 de 540", matchEs: "540 + 108" },
          { term: "5/6 of 540", match: "540 − 90", termEs: "5/6 de 540", matchEs: "540 − 90" },
          { term: "1/2 of 540", match: "540 ÷ 2", termEs: "1/2 de 540", matchEs: "540 ÷ 2" },
        ],
        hints: [
          "9/10 is one tenth LESS than the whole — so subtract one tenth of 540.",
          "6/5 is one fifth MORE than the whole — so add one fifth of 540.",
        ],
        hintsEs: [
          "9/10 es una décima MENOS que el total, así que resta una décima de 540.",
          "6/5 es un quinto MÁS que el total, así que suma un quinto de 540.",
        ],
        explanation:
          "Each shortcut rewrites the fraction around the whole: 9/10 = 1 − 1/10, so subtract 54; 6/5 = 1 + 1/5, so add 108; 5/6 = 1 − 1/6, so subtract 90; and 1/2 is simply dividing by 2. Seeing fractions as 'the whole, adjusted' is the strategy-planning move of this lesson.",
        explanationEs:
          "Cada atajo reescribe la fracción alrededor del total: 9/10 = 1 − 1/10, así que resta 54; 6/5 = 1 + 1/5, así que suma 108; 5/6 = 1 − 1/6, así que resta 90; y 1/2 es simplemente dividir entre 2. Ver las fracciones como 'el total, ajustado' es la estrategia de esta lección.",
      },
    ],
  },

  "1-3": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "One tram ride takes 12.5 minutes. Sort each expression: does it equal 125, or not?",
        instructionsEs:
          "Un viaje del teleférico dura 12.5 minutos. Clasifica cada expresión: ¿es igual a 125 o no?",
        label: "Sort each expression by whether it equals 125.",
        labelEs: "Clasifica cada expresión según si es igual a 125.",
        categories: [
          {
            label: "Equals 125",
            labelEs: "Es igual a 125",
            items: ["12.5 × 10", "1.25 × 100", "62.5 × 2"],
            itemsEs: ["12.5 × 10", "1.25 × 100", "62.5 × 2"],
          },
          {
            label: "Does NOT equal 125",
            labelEs: "NO es igual a 125",
            items: ["12.5 × 100", "1.25 × 10", "12.5 + 10"],
            itemsEs: ["12.5 × 100", "1.25 × 10", "12.5 + 10"],
          },
        ],
        hints: [
          "Multiplying by 10 moves the decimal point one place; by 100, two places.",
          "12.5 + 10 is addition, not multiplication — it only reaches 22.5.",
        ],
        hintsEs: [
          "Multiplicar por 10 mueve el punto decimal un lugar; por 100, dos lugares.",
          "12.5 + 10 es una suma, no una multiplicación: solo llega a 22.5.",
        ],
        explanation:
          "12.5 × 10 = 125, 1.25 × 100 = 125, and 62.5 × 2 = 125. The others miss: 12.5 × 100 = 1,250 (decimal moved too far), 1.25 × 10 = 12.5 (not far enough), and 12.5 + 10 = 22.5 (adding is not scaling).",
        explanationEs:
          "12.5 × 10 = 125, 1.25 × 100 = 125 y 62.5 × 2 = 125. Las otras fallan: 12.5 × 100 = 1,250 (el decimal se movió de más), 1.25 × 10 = 12.5 (no se movió lo suficiente) y 12.5 + 10 = 22.5 (sumar no es escalar).",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Each tram ride takes 12.5 minutes. Complete the table of total minutes.",
        labelEs:
          "Cada viaje del teleférico dura 12.5 minutos. Completa la tabla de minutos totales.",
        columns: ["Rides", "Expression", "Total minutes"],
        rows: [
          { rides: "10", expression: "10 × 12.5", answer: "125" },
          { rides: "20", expression: "20 × 12.5", answer: "250" },
          { rides: "50", expression: "50 × 12.5", answer: "625" },
        ],
        hints: [
          "Use the first row to build the others: 20 rides is double 10 rides.",
          "50 rides is 5 × 10 rides — multiply your first answer by 5.",
        ],
        hintsEs: [
          "Usa la primera fila para construir las demás: 20 viajes es el doble de 10 viajes.",
          "50 viajes es 5 × 10 viajes: multiplica tu primera respuesta por 5.",
        ],
        explanation:
          "10 × 12.5 = 125 minutes. Doubling the rides doubles the time: 20 rides take 250 minutes. And 50 rides is five times 10 rides, so 5 × 125 = 625 minutes — the same 625 the lesson converts to about 10.4 hours.",
        explanationEs:
          "10 × 12.5 = 125 minutos. Duplicar los viajes duplica el tiempo: 20 viajes toman 250 minutos. Y 50 viajes son cinco veces 10 viajes, así que 5 × 125 = 625 minutos, los mismos 625 que la lección convierte en unas 10.4 horas.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each tram question to the operation that answers it.",
        labelEs: "Empareja cada pregunta del teleférico con la operación que la responde.",
        columns: 2,
        pairs: [
          {
            term: "Minutes for 40 rides (12.5 min each)",
            match: "40 × 12.5",
            termEs: "Minutos de 40 viajes (12.5 min cada uno)",
            matchEs: "40 × 12.5",
          },
          {
            term: "Rides needed for 400 passengers (80 per ride)",
            match: "400 ÷ 80",
            termEs: "Viajes necesarios para 400 pasajeros (80 por viaje)",
            matchEs: "400 ÷ 80",
          },
          {
            term: "Hours in 625 minutes",
            match: "625 ÷ 60",
            termEs: "Horas en 625 minutos",
            matchEs: "625 ÷ 60",
          },
          {
            term: "Passengers on 30 full rides",
            match: "30 × 80",
            termEs: "Pasajeros en 30 viajes llenos",
            matchEs: "30 × 80",
          },
        ],
        hints: [
          "Repeated groups → multiply. Splitting a total into groups → divide.",
          "Check the units: minutes come from rides × minutes-per-ride; rides come from passengers ÷ passengers-per-ride.",
        ],
        hintsEs: [
          "Grupos repetidos → multiplica. Repartir un total en grupos → divide.",
          "Revisa las unidades: los minutos salen de viajes × minutos por viaje; los viajes salen de pasajeros ÷ pasajeros por viaje.",
        ],
        explanation:
          "Choosing the operation is the modeling step: totals built from equal groups multiply (40 × 12.5 minutes; 30 × 80 passengers), while totals split into equal groups divide (400 ÷ 80 rides; 625 ÷ 60 to convert minutes to hours).",
        explanationEs:
          "Elegir la operación es el paso de modelar: los totales formados por grupos iguales se multiplican (40 × 12.5 minutos; 30 × 80 pasajeros), mientras que los totales repartidos en grupos iguales se dividen (400 ÷ 80 viajes; 625 ÷ 60 para convertir minutos a horas).",
      },
    ],
  },

  "1-4": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "Sort each question: does it ask about covering a surface (area) or filling a space (volume)?",
        instructionsEs:
          "Clasifica cada pregunta: ¿trata de cubrir una superficie (área) o de llenar un espacio (volumen)?",
        label: "Sort each question: area or volume?",
        labelEs: "Clasifica cada pregunta: ¿área o volumen?",
        categories: [
          {
            label: "Volume — cubic units",
            labelEs: "Volumen: unidades cúbicas",
            items: [
              "How much soil fills the garden bed?",
              "How much cereal fits inside the box?",
              "How much water fills the fish tank?",
            ],
            itemsEs: [
              "¿Cuánta tierra llena el cantero del jardín?",
              "¿Cuánto cereal cabe dentro de la caja?",
              "¿Cuánta agua llena la pecera?",
            ],
          },
          {
            label: "Area — square units",
            labelEs: "Área: unidades cuadradas",
            items: [
              "How much paper covers the lid of the box?",
              "How much paint covers one wall?",
              "How much mulch covers the top of the bed?",
            ],
            itemsEs: [
              "¿Cuánto papel cubre la tapa de la caja?",
              "¿Cuánta pintura cubre una pared?",
              "¿Cuánto mantillo cubre la parte de arriba del cantero?",
            ],
          },
        ],
        hints: [
          "'Fill' means the inside of a 3-D shape — that is volume, in cubic units.",
          "'Cover' means a flat surface — that is area, in square units.",
        ],
        hintsEs: [
          "'Llenar' se refiere al interior de una figura 3D: eso es volumen, en unidades cúbicas.",
          "'Cubrir' se refiere a una superficie plana: eso es área, en unidades cuadradas.",
        ],
        explanation:
          "Filling questions need all three dimensions — soil, cereal, and water occupy length × width × height, measured in cubic units. Covering questions are flat — a lid, a wall, and the top of a bed have only length × width, measured in square units. Confusing the two is exactly the '240 square inches' mistake this lesson corrects.",
        explanationEs:
          "Las preguntas de llenar necesitan las tres dimensiones: la tierra, el cereal y el agua ocupan largo × ancho × alto, en unidades cúbicas. Las de cubrir son planas: una tapa, una pared y la parte de arriba de un cantero solo tienen largo × ancho, en unidades cuadradas. Confundirlas es exactamente el error de las '240 pulgadas cuadradas' que esta lección corrige.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Compute the volume of each cereal box.",
        labelEs: "Calcula el volumen de cada caja de cereal.",
        columns: ["Box (l × w × h, inches)", "Volume (cubic inches)"],
        rows: [
          { box: "8 × 3 × 10", answer: "240" },
          { box: "5 × 8 × 10", answer: "400" },
          { box: "6 × 4 × 5", answer: "120" },
        ],
        hints: [
          "Multiply two dimensions first, then multiply the result by the third.",
          "Pick the friendliest pair first: 8 × 10 = 80, then × 5 — order doesn't change the volume.",
        ],
        hintsEs: [
          "Multiplica dos dimensiones primero y luego multiplica el resultado por la tercera.",
          "Elige primero el par más amigable: 8 × 10 = 80, luego × 5; el orden no cambia el volumen.",
        ],
        explanation:
          "Volume multiplies all three dimensions: 8 × 3 × 10 = 240, 5 × 8 × 10 = 400, and 6 × 4 × 5 = 120 cubic inches. These are the large and jumbo boxes from the recommendation argument — the units are cubic because the cereal fills space.",
        explanationEs:
          "El volumen multiplica las tres dimensiones: 8 × 3 × 10 = 240, 5 × 8 × 10 = 400 y 6 × 4 × 5 = 120 pulgadas cúbicas. Son las cajas grande y gigante del argumento de recomendación; las unidades son cúbicas porque el cereal llena un espacio.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each prism to a DIFFERENT prism with the SAME volume.",
        labelEs: "Empareja cada prisma con un prisma DIFERENTE que tenga el MISMO volumen.",
        columns: 2,
        pairs: [
          { term: "8 × 3 × 10", match: "6 × 4 × 10", termEs: "8 × 3 × 10", matchEs: "6 × 4 × 10" },
          { term: "4 × 3 × 2", match: "6 × 2 × 2", termEs: "4 × 3 × 2", matchEs: "6 × 2 × 2" },
          {
            term: "5 × 8 × 10",
            match: "20 × 10 × 2",
            termEs: "5 × 8 × 10",
            matchEs: "20 × 10 × 2",
          },
          { term: "6 × 2 × 4", match: "8 × 3 × 2", termEs: "6 × 2 × 4", matchEs: "8 × 3 × 2" },
        ],
        hints: [
          "Compute each volume first — equal products are the matches.",
          "Different shapes can hold exactly the same amount: that is the counterexample idea from this lesson.",
        ],
        hintsEs: [
          "Calcula cada volumen primero: los productos iguales son las parejas.",
          "Figuras diferentes pueden contener exactamente lo mismo: esa es la idea del contraejemplo de esta lección.",
        ],
        explanation:
          "8 × 3 × 10 and 6 × 4 × 10 both equal 240; 4 × 3 × 2 and 6 × 2 × 2 both equal 24; 5 × 8 × 10 and 20 × 10 × 2 both equal 400; 6 × 2 × 4 and 8 × 3 × 2 both equal 48. Two boxes with different shapes can hold the same amount — a taller box does not always mean more cereal, which is the counterexample that tests the claim in this lesson.",
        explanationEs:
          "8 × 3 × 10 y 6 × 4 × 10 dan 240; 4 × 3 × 2 y 6 × 2 × 2 dan 24; 5 × 8 × 10 y 20 × 10 × 2 dan 400; 6 × 2 × 4 y 8 × 3 × 2 dan 48. Dos cajas con formas distintas pueden contener lo mismo: una caja más alta no siempre significa más cereal, que es el contraejemplo que pone a prueba la afirmación de esta lección.",
      },
    ],
  },

  "1-5": {
    approaching: [
      {
        type: "drag-sort",
        instructions: "Sort each number pattern by its rule.",
        instructionsEs: "Clasifica cada patrón numérico según su regla.",
        label: "Sort each pattern: add the same amount, or multiply by the same amount?",
        labelEs:
          "Clasifica cada patrón: ¿se suma la misma cantidad o se multiplica por la misma cantidad?",
        categories: [
          {
            label: "Add the same amount each time",
            labelEs: "Se suma la misma cantidad cada vez",
            items: ["4, 6, 8, 10, ...", "18, 20, 22, 24, ...", "4.5, 7.0, 9.5, 12.0, ..."],
            itemsEs: ["4, 6, 8, 10, ...", "18, 20, 22, 24, ...", "4.5, 7.0, 9.5, 12.0, ..."],
          },
          {
            label: "Multiply by the same amount each time",
            labelEs: "Se multiplica por la misma cantidad cada vez",
            items: ["2, 4, 8, 16, ...", "1, 3, 9, 27, ...", "5, 50, 500, 5000, ..."],
            itemsEs: ["2, 4, 8, 16, ...", "1, 3, 9, 27, ...", "5, 50, 500, 5000, ..."],
          },
        ],
        hints: [
          "Check the jump between neighbors: is it the same DIFFERENCE, or the same FACTOR?",
          "2 → 4 → 8 doubles each time; 4 → 6 → 8 adds 2 each time.",
        ],
        hintsEs: [
          "Revisa el salto entre vecinos: ¿es la misma DIFERENCIA o el mismo FACTOR?",
          "2 → 4 → 8 se duplica cada vez; 4 → 6 → 8 suma 2 cada vez.",
        ],
        explanation:
          "The first group has a constant difference: +2, +2, and +2.5 respectively — like the whale growing 2.5 cm each day. The second group has a constant factor: ×2, ×3, and ×10 — each term is a multiple of the one before. Naming the rule is what lets a table predict future terms.",
        explanationEs:
          "El primer grupo tiene una diferencia constante: +2, +2 y +2.5 respectivamente, como la ballena que crece 2.5 cm por día. El segundo grupo tiene un factor constante: ×2, ×3 y ×10; cada término es un múltiplo del anterior. Nombrar la regla es lo que permite que una tabla prediga términos futuros.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Player A starts with 18 points and makes two-pointers. Complete the table.",
        labelEs:
          "El Jugador A empieza con 18 puntos y anota canastas de dos puntos. Completa la tabla.",
        columns: ["Two-pointers made", "Rule: 18 + 2 × shots", "Total points"],
        rows: [
          { shots: "1", rule: "18 + 2 × 1", answer: "20" },
          { shots: "5", rule: "18 + 2 × 5", answer: "28" },
          { shots: "10", rule: "18 + 2 × 10", answer: "38" },
        ],
        hints: [
          "Multiply first, then add the starting 18 points.",
          "Each new shot adds exactly 2 — the pattern grows by a constant difference.",
        ],
        hintsEs: [
          "Multiplica primero y luego suma los 18 puntos iniciales.",
          "Cada canasta nueva suma exactamente 2: el patrón crece con una diferencia constante.",
        ],
        explanation:
          "The rule 18 + 2 × shots turns the pattern into a formula: one shot gives 20, five shots give 18 + 10 = 28, and ten shots give 18 + 20 = 38. A table plus a rule lets you jump straight to any term without listing every step between.",
        explanationEs:
          "La regla 18 + 2 × canastas convierte el patrón en una fórmula: una canasta da 20, cinco dan 18 + 10 = 28 y diez dan 18 + 20 = 38. Una tabla más una regla te permite saltar directo a cualquier término sin listar todos los pasos intermedios.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each input-output table to its pattern rule.",
        labelEs: "Empareja cada tabla de entrada y salida con su regla de patrón.",
        columns: 2,
        pairs: [
          {
            term: "In: 1, 2, 3 → Out: 5, 10, 15",
            match: "Multiply by 5",
            termEs: "Entra: 1, 2, 3 → Sale: 5, 10, 15",
            matchEs: "Multiplicar por 5",
          },
          {
            term: "In: 1, 2, 3 → Out: 3, 5, 7",
            match: "Double, then add 1",
            termEs: "Entra: 1, 2, 3 → Sale: 3, 5, 7",
            matchEs: "Duplicar y luego sumar 1",
          },
          {
            term: "In: 2, 4, 6 → Out: 1, 2, 3",
            match: "Divide by 2",
            termEs: "Entra: 2, 4, 6 → Sale: 1, 2, 3",
            matchEs: "Dividir entre 2",
          },
          {
            term: "In: 1, 2, 3 → Out: 2.5, 5, 7.5",
            match: "Multiply by 2.5",
            termEs: "Entra: 1, 2, 3 → Sale: 2.5, 5, 7.5",
            matchEs: "Multiplicar por 2.5",
          },
        ],
        hints: [
          "Test a rule on EVERY pair in the table — one pair is not enough to confirm it.",
          "In: 1 → Out: 3 fits both 'add 2' and 'double plus 1'. The pair 2 → 5 decides between them.",
        ],
        hintsEs: [
          "Prueba la regla con TODOS los pares de la tabla: un solo par no basta para confirmarla.",
          "Entra 1 → Sale 3 cumple tanto 'sumar 2' como 'duplicar más 1'. El par 2 → 5 decide entre las dos.",
        ],
        explanation:
          "A rule must hold for every row: 5, 10, 15 is ×5; 3, 5, 7 is 2n + 1 (the pair 2 → 5 rules out 'add 2'); 1, 2, 3 from 2, 4, 6 is ÷2; and 2.5, 5, 7.5 is ×2.5 — the same kind of decimal rate as the whale's 2.5 cm per day. Checking every pair is how a generalization earns trust.",
        explanationEs:
          "La regla debe cumplirse en cada fila: 5, 10, 15 es ×5; 3, 5, 7 es 2n + 1 (el par 2 → 5 descarta 'sumar 2'); 1, 2, 3 desde 2, 4, 6 es ÷2; y 2.5, 5, 7.5 es ×2.5, la misma tasa decimal que los 2.5 cm diarios de la ballena. Comprobar cada par es lo que hace confiable una generalización.",
      },
    ],
  },

  "1-6": {
    approaching: [
      {
        type: "drag-sort",
        instructions: "Sort each behavior: does it build our math community, or hurt it?",
        instructionsEs:
          "Clasifica cada comportamiento: ¿construye nuestra comunidad matemática o la daña?",
        label: "Sort each behavior by its effect on our math community.",
        labelEs: "Clasifica cada comportamiento según su efecto en nuestra comunidad matemática.",
        categories: [
          {
            label: "Builds our community",
            labelEs: "Construye nuestra comunidad",
            items: [
              "Asking a partner to explain their strategy",
              "Comparing two different approaches to the same problem",
              "Saying 'I disagree, because...' with a reason",
              "Making sure every group member gets to talk",
            ],
            itemsEs: [
              "Pedirle a un compañero que explique su estrategia",
              "Comparar dos enfoques diferentes para el mismo problema",
              "Decir 'No estoy de acuerdo, porque...' con una razón",
              "Asegurarse de que cada miembro del grupo pueda hablar",
            ],
          },
          {
            label: "Hurts our community",
            labelEs: "Daña nuestra comunidad",
            items: [
              "One student doing all the talking",
              "Calling an answer 'wrong' with no reason",
              "Keeping your strategy secret so you finish first",
              "Laughing when someone makes a mistake",
            ],
            itemsEs: [
              "Que un solo estudiante hable todo el tiempo",
              "Decir que una respuesta está 'mal' sin dar una razón",
              "Guardar tu estrategia en secreto para terminar primero",
              "Reírse cuando alguien comete un error",
            ],
          },
        ],
        hints: [
          "Community behaviors invite more voices in; the others shut voices out.",
          "Disagreeing is fine — the difference is whether a REASON comes with it.",
        ],
        hintsEs: [
          "Los comportamientos de comunidad invitan a más voces; los otros las excluyen.",
          "Estar en desacuerdo está bien: la diferencia es si viene acompañado de una RAZÓN.",
        ],
        explanation:
          "Community builders share reasoning and make room for every voice — asking, comparing, disagreeing with reasons, and inviting quiet members in. The hurtful behaviors do the opposite: one voice dominates, judgments come without reasons, strategies get hoarded, and mistakes get mocked instead of used as information.",
        explanationEs:
          "Los que construyen comunidad comparten el razonamiento y hacen espacio para cada voz: preguntar, comparar, discrepar con razones e invitar a los callados. Los comportamientos dañinos hacen lo contrario: una voz domina, los juicios llegan sin razones, las estrategias se esconden y los errores se burlan en vez de usarse como información.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Use the bicycle rack problem to complete the table.",
        labelEs: "Usa el problema del estacionamiento de bicicletas para completar la tabla.",
        columns: ["Question", "Thinking", "Answer"],
        rows: [
          { question: "Wheels on a rack of 8 bikes", thinking: "8 bikes × 2 wheels", answer: "16" },
          {
            question: "Wheels on the bigger rack (6 times as many)",
            thinking: "16 × 6",
            answer: "96",
          },
          { question: "Bikes on the bigger rack", thinking: "96 wheels ÷ 2", answer: "48" },
        ],
        hints: [
          "Each answer becomes the input for the next question — read the table top to bottom.",
          "To go from wheels back to bikes, divide by 2.",
        ],
        hintsEs: [
          "Cada respuesta se convierte en la entrada de la siguiente pregunta: lee la tabla de arriba abajo.",
          "Para pasar de ruedas a bicicletas, divide entre 2.",
        ],
        explanation:
          "8 bikes × 2 wheels = 16 wheels. The bigger rack has 6 times as many: 16 × 6 = 96 wheels. Dividing by 2 wheels per bike returns to bikes: 96 ÷ 2 = 48. Explaining each step — not just the final 48 — is what this lesson calls precise mathematical language.",
        explanationEs:
          "8 bicicletas × 2 ruedas = 16 ruedas. El estacionamiento grande tiene 6 veces más: 16 × 6 = 96 ruedas. Dividir entre 2 ruedas por bicicleta regresa a bicicletas: 96 ÷ 2 = 48. Explicar cada paso, no solo el 48 final, es lo que esta lección llama lenguaje matemático preciso.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each stuck moment to the strategy that gets you unstuck.",
        labelEs: "Empareja cada momento de atasco con la estrategia que te destraba.",
        columns: 2,
        pairs: [
          {
            term: "My strategy is not making progress",
            match: "Try a different entry point",
            termEs: "Mi estrategia no avanza",
            matchEs: "Probar otro punto de entrada",
          },
          {
            term: "I don't understand the problem",
            match: "Restate it in your own words",
            termEs: "No entiendo el problema",
            matchEs: "Decirlo con tus propias palabras",
          },
          {
            term: "My answer looks unreasonable",
            match: "Check it against an estimate",
            termEs: "Mi respuesta no parece razonable",
            matchEs: "Compararla con una estimación",
          },
          {
            term: "My partner got a different answer",
            match: "Compare steps and find where they differ",
            termEs: "Mi compañero obtuvo otra respuesta",
            matchEs: "Comparar los pasos y hallar dónde difieren",
          },
        ],
        hints: [
          "Each strategy answers the specific problem in the stuck moment — match the need, not just any good habit.",
          "A different answer is not a fight; it is a place where two solution paths split.",
        ],
        hintsEs: [
          "Cada estrategia responde al problema específico del atasco: empareja la necesidad, no cualquier buen hábito.",
          "Una respuesta diferente no es una pelea; es el punto donde dos caminos de solución se separan.",
        ],
        explanation:
          "The problem-solving process pairs each kind of stuck with its own move: a stalled strategy needs a new entry point; a confusing problem needs restating; a suspicious answer needs an estimate check; and disagreeing answers need a step-by-step comparison to find where the paths split. Knowing WHICH move fits is what makes the process a tool.",
        explanationEs:
          "El proceso de resolución empareja cada tipo de atasco con su propio movimiento: una estrategia estancada necesita otro punto de entrada; un problema confuso necesita reformularse; una respuesta sospechosa necesita compararse con una estimación; y respuestas distintas necesitan comparar pasos para hallar dónde se separan los caminos. Saber CUÁL movimiento corresponde es lo que convierte el proceso en una herramienta.",
      },
    ],
  },

  "4-3": {
    approaching: [
      {
        type: "drag-sort",
        instructions: "Sort each percent problem by the benchmark that estimates it best.",
        instructionsEs:
          "Clasifica cada problema de porcentaje según el punto de referencia que mejor lo estima.",
        label: "Sort each problem by its best benchmark percent.",
        labelEs: "Clasifica cada problema según su mejor porcentaje de referencia.",
        categories: [
          {
            label: "Use 10% (move the decimal)",
            labelEs: "Usa 10% (mueve el decimal)",
            items: ["8.6% of 216", "11% of 350"],
            itemsEs: ["8.6% de 216", "11% de 350"],
          },
          {
            label: "Use 50% (take half)",
            labelEs: "Usa 50% (toma la mitad)",
            items: ["48% of 90", "52% of 200"],
            itemsEs: ["48% de 90", "52% de 200"],
          },
          {
            label: "Use 25% (take a quarter)",
            labelEs: "Usa 25% (toma un cuarto)",
            items: ["26% of 80", "24% of 400"],
            itemsEs: ["26% de 80", "24% de 400"],
          },
        ],
        hints: [
          "Round the percent to the nearest friendly benchmark: 8.6% is close to 10%, 48% is close to 50%.",
          "The benchmark should be close — 26% is near 25%, not near 50%.",
        ],
        hintsEs: [
          "Redondea el porcentaje al punto de referencia amigable más cercano: 8.6% está cerca de 10%, 48% está cerca de 50%.",
          "El punto de referencia debe estar cerca: 26% está cerca de 25%, no de 50%.",
        ],
        explanation:
          "Estimation starts by rounding the percent to a benchmark you can do mentally: 8.6% and 11% round to 10% (move the decimal one place); 48% and 52% round to 50% (take half); 26% and 24% round to 25% (take a quarter). Choosing the closest benchmark is what keeps the estimate close.",
        explanationEs:
          "La estimación empieza redondeando el porcentaje a un punto de referencia mental: 8.6% y 11% se redondean a 10% (mueve el decimal un lugar); 48% y 52% a 50% (toma la mitad); 26% y 24% a 25% (toma un cuarto). Elegir el punto de referencia más cercano es lo que mantiene la estimación cerca.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Complete the benchmark table for 240.",
        labelEs: "Completa la tabla de puntos de referencia para 240.",
        columns: ["Benchmark", "Shortcut", "Value"],
        rows: [
          { benchmark: "10% of 240", shortcut: "Move decimal left 1 place", answer: "24" },
          { benchmark: "1% of 240", shortcut: "Move decimal left 2 places", answer: "2.4" },
          { benchmark: "50% of 240", shortcut: "Half of 240", answer: "120" },
          { benchmark: "25% of 240", shortcut: "Half of half", answer: "60" },
        ],
        hints: [
          "10% and 1% only move the decimal point — no long computation.",
          "25% is half of 50%: once you have 120, halve it again.",
        ],
        hintsEs: [
          "10% y 1% solo mueven el punto decimal: sin cálculos largos.",
          "25% es la mitad de 50%: cuando tengas 120, divídelo a la mitad otra vez.",
        ],
        explanation:
          "The four benchmarks of 240: 10% moves the decimal to 24; 1% moves it again to 2.4; 50% is half, 120; and 25% halves that to 60. Every harder percent in this lesson is built by combining exactly these four.",
        explanationEs:
          "Los cuatro puntos de referencia de 240: 10% mueve el decimal a 24; 1% lo mueve otra vez a 2.4; 50% es la mitad, 120; y 25% divide eso a la mitad, 60. Cada porcentaje más difícil de esta lección se construye combinando exactamente estos cuatro.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each percent problem to the benchmark combination that estimates it.",
        labelEs:
          "Empareja cada problema de porcentaje con la combinación de referencias que lo estima.",
        columns: 2,
        pairs: [
          {
            term: "15% of 200",
            match: "10% + 5%: 20 + 10 = 30",
            termEs: "15% de 200",
            matchEs: "10% + 5%: 20 + 10 = 30",
          },
          {
            term: "75% of 80",
            match: "50% + 25%: 40 + 20 = 60",
            termEs: "75% de 80",
            matchEs: "50% + 25%: 40 + 20 = 60",
          },
          {
            term: "20% of 350",
            match: "10% doubled: 35 × 2 = 70",
            termEs: "20% de 350",
            matchEs: "10% duplicado: 35 × 2 = 70",
          },
          {
            term: "11% of 400",
            match: "10% + 1%: 40 + 4 = 44",
            termEs: "11% de 400",
            matchEs: "10% + 1%: 40 + 4 = 44",
          },
        ],
        hints: [
          "Break the percent into benchmark pieces first: 15% = 10% + 5%, and 5% is half of 10%.",
          "Check that the pieces really add to the target percent before trusting the estimate.",
        ],
        hintsEs: [
          "Separa el porcentaje en piezas de referencia primero: 15% = 10% + 5%, y 5% es la mitad de 10%.",
          "Verifica que las piezas realmente sumen el porcentaje buscado antes de confiar en la estimación.",
        ],
        explanation:
          "Benchmarks combine like building blocks: 15% is 10% plus its half; 75% is 50% plus 25%; 20% is 10% doubled; 11% is 10% plus 1%. Each combination turns a hard percent into two easy mental moves — the exact strategy behind the Green-Team estimate in this lesson.",
        explanationEs:
          "Los puntos de referencia se combinan como bloques: 15% es 10% más su mitad; 75% es 50% más 25%; 20% es 10% duplicado; 11% es 10% más 1%. Cada combinación convierte un porcentaje difícil en dos pasos mentales fáciles: la misma estrategia de la estimación del Equipo Verde en esta lección.",
      },
    ],
  },

  "7-7": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "Two vertices make a horizontal side when they share a y-coordinate, and a vertical side when they share an x-coordinate. Sort each pair.",
        instructionsEs:
          "Dos vértices forman un lado horizontal cuando comparten la coordenada y, y un lado vertical cuando comparten la coordenada x. Clasifica cada par.",
        label: "Sort each pair of vertices by the kind of side it makes.",
        labelEs: "Clasifica cada par de vértices según el tipo de lado que forma.",
        categories: [
          {
            label: "Vertical side (same x)",
            labelEs: "Lado vertical (misma x)",
            items: ["(5, 3) and (5, −3)", "(−2, 1) and (−2, 6)", "(4, −1) and (4, 7)"],
            itemsEs: ["(5, 3) y (5, −3)", "(−2, 1) y (−2, 6)", "(4, −1) y (4, 7)"],
          },
          {
            label: "Horizontal side (same y)",
            labelEs: "Lado horizontal (misma y)",
            items: ["(−4, 3) and (5, 3)", "(0, −2) and (6, −2)", "(−3, 5) and (2, 5)"],
            itemsEs: ["(−4, 3) y (5, 3)", "(0, −2) y (6, −2)", "(−3, 5) y (2, 5)"],
          },
        ],
        hints: [
          "Look at which coordinate REPEATS in the pair — that is the direction that does not change.",
          "Same x means the points stack up and down; same y means they line up left and right.",
        ],
        hintsEs: [
          "Fíjate en cuál coordenada SE REPITE en el par: esa es la dirección que no cambia.",
          "La misma x significa que los puntos se apilan de arriba abajo; la misma y, que se alinean de izquierda a derecha.",
        ],
        explanation:
          "When the x-coordinate repeats — (5, 3) and (5, −3) — the points differ only vertically, so the side is vertical. When the y-coordinate repeats — (−4, 3) and (5, 3) — the points differ only horizontally. Spotting the repeated coordinate is the first step to finding any side length on the grid.",
        explanationEs:
          "Cuando la coordenada x se repite — (5, 3) y (5, −3) — los puntos solo difieren verticalmente, así que el lado es vertical. Cuando la y se repite — (−4, 3) y (5, 3) — solo difieren horizontalmente. Detectar la coordenada repetida es el primer paso para hallar cualquier longitud de lado en la cuadrícula.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Find the distance between each pair of vertices.",
        labelEs: "Halla la distancia entre cada par de vértices.",
        columns: ["Vertices", "Shared coordinate", "Distance (units)"],
        rows: [
          { vertices: "(−4, 3) and (5, 3)", shared: "y = 3", answer: "9" },
          { vertices: "(5, 3) and (5, −4)", shared: "x = 5", answer: "7" },
          { vertices: "(−2, −1) and (6, −1)", shared: "y = −1", answer: "8" },
        ],
        hints: [
          "Distance across zero adds the two distances from the axis: from −4 to 5 is 4 + 5.",
          "Subtract when signs match, add absolute values when the points sit on opposite sides of the axis.",
        ],
        hintsEs: [
          "La distancia que cruza el cero suma las dos distancias desde el eje: de −4 a 5 es 4 + 5.",
          "Resta cuando los signos coinciden; suma los valores absolutos cuando los puntos están en lados opuestos del eje.",
        ],
        explanation:
          "From (−4, 3) to (5, 3): the x-values sit on opposite sides of zero, so the distance is 4 + 5 = 9. From (5, 3) to (5, −4): 3 + 4 = 7. From (−2, −1) to (6, −1): 2 + 6 = 8. Coordinates turn side lengths into arithmetic — no ruler required.",
        explanationEs:
          "De (−4, 3) a (5, 3): los valores de x están en lados opuestos del cero, así que la distancia es 4 + 5 = 9. De (5, 3) a (5, −4): 3 + 4 = 7. De (−2, −1) a (6, −1): 2 + 6 = 8. Las coordenadas convierten las longitudes en aritmética: no hace falta regla.",
      },
    ],
    extending: [
      {
        type: "coordinate-grid",
        instructions:
          "Plot the four vertices of rectangle PQRS: P(1, 2), Q(6, 2), R(6, 5), S(1, 5).",
        instructionsEs:
          "Ubica los cuatro vértices del rectángulo PQRS: P(1, 2), Q(6, 2), R(6, 5), S(1, 5).",
        label:
          "Plot the vertices of rectangle PQRS, then use the coordinates to find its perimeter.",
        labelEs:
          "Ubica los vértices del rectángulo PQRS y luego usa las coordenadas para hallar su perímetro.",
        xLabel: "x",
        yLabel: "y",
        xMin: 0,
        xMax: 8,
        yMin: 0,
        yMax: 8,
        xStep: 1,
        yStep: 1,
        targets: [
          { x: 1, y: 2, label: "P(1, 2)" },
          { x: 6, y: 2, label: "Q(6, 2)" },
          { x: 6, y: 5, label: "R(6, 5)" },
          { x: 1, y: 5, label: "S(1, 5)" },
        ],
        hints: [
          "Move right for x first, then up for y — every vertex starts at the origin.",
          "After plotting, subtract coordinates: PQ shares y = 2, so its length is 6 − 1 = 5.",
        ],
        hintsEs: [
          "Muévete a la derecha para x primero y luego hacia arriba para y: cada vértice empieza en el origen.",
          "Después de ubicar, resta coordenadas: PQ comparte y = 2, así que su longitud es 6 − 1 = 5.",
        ],
        explanation:
          "P and Q share y = 2, so PQ = 6 − 1 = 5 units; Q and R share x = 6, so QR = 5 − 2 = 3 units. The rectangle is 5 by 3, giving perimeter 2 × (5 + 3) = 16 units and area 5 × 3 = 15 square units — all read straight off the coordinates.",
        explanationEs:
          "P y Q comparten y = 2, así que PQ = 6 − 1 = 5 unidades; Q y R comparten x = 6, así que QR = 5 − 2 = 3 unidades. El rectángulo mide 5 por 3, con perímetro 2 × (5 + 3) = 16 unidades y área 5 × 3 = 15 unidades cuadradas: todo se lee directo de las coordenadas.",
      },
    ],
  },
};

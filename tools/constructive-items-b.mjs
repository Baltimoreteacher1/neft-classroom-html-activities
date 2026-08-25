// Constructive practice items — units 9 and 10. Authored 2026-08-20.
export default {
  "9-1": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "Sort each quantity: is it the independent variable (the input you choose) or the dependent variable (the output that responds)?",
        instructionsEs:
          "Clasifica cada cantidad: ¿es la variable independiente (la entrada que eliges) o la variable dependiente (la salida que responde)?",
        label: "Sort each quantity: independent or dependent?",
        labelEs: "Clasifica cada cantidad: ¿independiente o dependiente?",
        categories: [
          {
            label: "Independent variable (input)",
            labelEs: "Variable independiente (entrada)",
            items: [
              "Hours of sunlight a tray of seedlings gets",
              "Months of gym membership",
              "Minutes spent jogging",
            ],
            itemsEs: [
              "Horas de luz solar que recibe una bandeja de plántulas",
              "Meses de membresía del gimnasio",
              "Minutos dedicados a trotar",
            ],
          },
          {
            label: "Dependent variable (output)",
            labelEs: "Variable dependiente (salida)",
            items: [
              "Height the seedlings grow",
              "Total cost of the membership",
              "Calories burned on the jog",
            ],
            itemsEs: [
              "Altura que crecen las plántulas",
              "Costo total de la membresía",
              "Calorías quemadas al trotar",
            ],
          },
        ],
        hints: [
          "Use the sentence check: 'The ___ depends on the ___.' The first blank is dependent.",
          "The independent variable is the one a person chooses or controls directly.",
        ],
        hintsEs: [
          "Usa la oración de comprobación: 'El/La ___ depende de el/la ___.' El primer espacio es la dependiente.",
          "La variable independiente es la que una persona elige o controla directamente.",
        ],
        explanation:
          "Each pair passes the sentence check: the height depends on the sunlight, the cost depends on the months, and the Calories depend on the minutes. The chosen quantity — sunlight, months, minutes — is independent; the quantity that responds is dependent.",
        explanationEs:
          "Cada par pasa la oración de comprobación: la altura depende de la luz solar, el costo depende de los meses y las calorías dependen de los minutos. La cantidad elegida — luz, meses, minutos — es independiente; la que responde es dependiente.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label:
          "Claire burns Calories at a steady rate: 30 minutes burns 123 Calories. Complete the table.",
        labelEs:
          "Claire quema calorías a un ritmo constante: 30 minutos queman 123 calorías. Completa la tabla.",
        columns: ["Minutes jogged (independent)", "Thinking", "Calories burned (dependent)"],
        rows: [
          { minutes: "30", thinking: "given", answer: "123" },
          { minutes: "60", thinking: "double 123", answer: "246" },
          { minutes: "90", thinking: "triple 123", answer: "369" },
        ],
        hints: [
          "60 minutes is twice 30 minutes, so it burns twice the Calories.",
          "The Calories column DEPENDS on the minutes column — that is what makes it the dependent variable.",
        ],
        hintsEs: [
          "60 minutos es el doble de 30 minutos, así que quema el doble de calorías.",
          "La columna de calorías DEPENDE de la columna de minutos: eso la hace la variable dependiente.",
        ],
        explanation:
          "Because the rate is steady, doubling the minutes doubles the Calories: 60 minutes burns 246, and 90 minutes burns 369. The table shows dependence in action — every value in the Calories column is produced by a value in the minutes column.",
        explanationEs:
          "Como el ritmo es constante, duplicar los minutos duplica las calorías: 60 minutos queman 246 y 90 minutos queman 369. La tabla muestra la dependencia en acción: cada valor de la columna de calorías es producido por un valor de la columna de minutos.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each scenario to its (independent → dependent) pair.",
        labelEs: "Empareja cada situación con su par (independiente → dependiente).",
        columns: 2,
        pairs: [
          {
            term: "Gym membership",
            match: "months → total cost",
            termEs: "Membresía del gimnasio",
            matchEs: "meses → costo total",
          },
          {
            term: "Seedling experiment",
            match: "hours of sunlight → plant height",
            termEs: "Experimento de plántulas",
            matchEs: "horas de luz → altura de la planta",
          },
          {
            term: "Jogging",
            match: "minutes → Calories burned",
            termEs: "Trotar",
            matchEs: "minutos → calorías quemadas",
          },
          {
            term: "Buying movie tickets",
            match: "tickets → total price",
            termEs: "Comprar boletos de cine",
            matchEs: "boletos → precio total",
          },
        ],
        hints: [
          "The arrow points FROM the cause TO the effect: input → output.",
          "Ask which quantity a person directly controls — that one goes on the left of the arrow.",
        ],
        hintsEs: [
          "La flecha apunta de la causa al efecto: entrada → salida.",
          "Pregúntate cuál cantidad controla directamente una persona: esa va a la izquierda de la flecha.",
        ],
        explanation:
          "In every pair the left side is chosen and the right side responds: you choose the months, tickets, minutes, or sunlight hours, and the cost, price, Calories, or height follows. Writing relationships as input → output is the foundation for the tables, graphs, and equations of the next three lessons.",
        explanationEs:
          "En cada par, el lado izquierdo se elige y el derecho responde: eliges los meses, boletos, minutos u horas de luz, y el costo, precio, calorías o altura responde. Escribir relaciones como entrada → salida es la base de las tablas, gráficas y ecuaciones de las próximas tres lecciones.",
      },
    ],
  },

  "9-2": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "Football tickets cost $45 each, so the graph follows c = 45t. Sort each ordered pair: is it on the ticket graph or not?",
        instructionsEs:
          "Los boletos de fútbol americano cuestan $45 cada uno, así que la gráfica sigue c = 45t. Clasifica cada par ordenado: ¿está en la gráfica o no?",
        label: "Sort each ordered pair (tickets, cost): on the graph, or not?",
        labelEs: "Clasifica cada par ordenado (boletos, costo): ¿está en la gráfica o no?",
        categories: [
          {
            label: "On the ticket graph",
            labelEs: "En la gráfica de boletos",
            items: ["(1, 45)", "(2, 90)", "(4, 180)"],
            itemsEs: ["(1, 45)", "(2, 90)", "(4, 180)"],
          },
          {
            label: "NOT on the graph",
            labelEs: "NO está en la gráfica",
            items: ["(3, 120)", "(2, 100)", "(5, 200)"],
            itemsEs: ["(3, 120)", "(2, 100)", "(5, 200)"],
          },
        ],
        hints: [
          "Test each pair: does the cost equal 45 × the tickets?",
          "3 tickets should cost 3 × 45 = 135 — compare that to what the pair claims.",
        ],
        hintsEs: [
          "Prueba cada par: ¿el costo es igual a 45 × los boletos?",
          "3 boletos deberían costar 3 × 45 = 135: compara eso con lo que afirma el par.",
        ],
        explanation:
          "A point belongs on the graph only when its y-value is exactly 45 times its x-value: 45, 90, and 180 pass. The impostors fail the test: 3 tickets cost 135 (not 120), 2 tickets cost 90 (not 100), and 5 tickets cost 225 (not 200). Checking a point against the rule is how a graph is read, not just drawn.",
        explanationEs:
          "Un punto pertenece a la gráfica solo cuando su valor y es exactamente 45 veces su valor x: 45, 90 y 180 pasan. Los impostores fallan: 3 boletos cuestan 135 (no 120), 2 cuestan 90 (no 100) y 5 cuestan 225 (no 200). Verificar un punto contra la regla es la forma de leer una gráfica, no solo de dibujarla.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Tickets cost $45 each. Complete the table that feeds the graph.",
        labelEs: "Los boletos cuestan $45 cada uno. Completa la tabla que alimenta la gráfica.",
        columns: ["Tickets (x)", "Thinking", "Total cost in dollars (y)"],
        rows: [
          { tickets: "2", thinking: "2 × 45", answer: "90" },
          { tickets: "5", thinking: "5 × 45", answer: "225" },
          { tickets: "8", thinking: "8 × 45", answer: "360" },
        ],
        hints: [
          "The independent variable (tickets) goes in column 1; the dependent (cost) responds in the last column.",
          "Each completed row becomes one point on the graph: (tickets, cost).",
        ],
        hintsEs: [
          "La variable independiente (boletos) va en la columna 1; la dependiente (costo) responde en la última columna.",
          "Cada fila completada se convierte en un punto de la gráfica: (boletos, costo).",
        ],
        explanation:
          "Each row multiplies by the $45 rate: (2, 90), (5, 225), (8, 360). Those three rows ARE three points of the graph — a table and a graph are two views of the same relationship, which is the central idea of this lesson.",
        explanationEs:
          "Cada fila multiplica por la tarifa de $45: (2, 90), (5, 225), (8, 360). Esas tres filas son tres puntos de la gráfica: una tabla y una gráfica son dos vistas de la misma relación, la idea central de esta lección.",
      },
    ],
    extending: [
      {
        type: "coordinate-grid",
        instructions:
          "Tickets cost $45 each. Plot the points for 1, 2, 3, and 4 tickets on the graph of tickets vs. total cost.",
        instructionsEs:
          "Los boletos cuestan $45 cada uno. Ubica los puntos para 1, 2, 3 y 4 boletos en la gráfica de boletos contra costo total.",
        label: "Plot the ticket-cost relationship: one point for each number of tickets.",
        labelEs: "Ubica la relación boletos-costo: un punto por cada cantidad de boletos.",
        xLabel: "Tickets",
        yLabel: "Total cost ($)",
        xMin: 0,
        xMax: 6,
        yMin: 0,
        yMax: 270,
        xStep: 1,
        yStep: 45,
        targets: [
          { x: 1, y: 45, label: "(1, 45)" },
          { x: 2, y: 90, label: "(2, 90)" },
          { x: 3, y: 135, label: "(3, 135)" },
          { x: 4, y: 180, label: "(4, 180)" },
        ],
        hints: [
          "Each gridline on the vertical axis is worth $45 — one ticket's price.",
          "After plotting, look at the shape: every extra ticket raises the cost by the same amount.",
        ],
        hintsEs: [
          "Cada línea de la cuadrícula en el eje vertical vale $45: el precio de un boleto.",
          "Después de ubicar los puntos, observa la forma: cada boleto adicional sube el costo la misma cantidad.",
        ],
        explanation:
          "The four points (1, 45), (2, 90), (3, 135), (4, 180) line up on a straight path from the origin: each extra ticket adds exactly $45. That constant climb IS the rate of change, and seeing it in the lined-up points is what 'analyzing a graph' means in this lesson.",
        explanationEs:
          "Los cuatro puntos (1, 45), (2, 90), (3, 135), (4, 180) se alinean en una trayectoria recta desde el origen: cada boleto adicional suma exactamente $45. Esa subida constante ES la tasa de cambio, y verla en los puntos alineados es lo que significa 'analizar una gráfica' en esta lección.",
      },
    ],
  },

  "9-3": {
    approaching: [
      {
        type: "drag-sort",
        instructions: "Sort each equation: does it say 'y is 4 times x', or something different?",
        instructionsEs: "Clasifica cada ecuación: ¿dice 'y es 4 veces x' o dice otra cosa?",
        label: "Sort each equation by what it really says.",
        labelEs: "Clasifica cada ecuación según lo que realmente dice.",
        categories: [
          {
            label: "Says 'y is 4 times x'",
            labelEs: "Dice 'y es 4 veces x'",
            items: ["y = 4x", "y = x × 4", "x = y ÷ 4"],
            itemsEs: ["y = 4x", "y = x × 4", "x = y ÷ 4"],
          },
          {
            label: "Says something different",
            labelEs: "Dice otra cosa",
            items: ["y = x + 4", "x = 4y", "y = 4 ÷ x"],
            itemsEs: ["y = x + 4", "x = 4y", "y = 4 ÷ x"],
          },
        ],
        hints: [
          "Test with a value: if x = 2 and y is 4 times x, then y must be 8. Which equations agree?",
          "x = y ÷ 4 is the same relationship rearranged — undoing '×4' with '÷4'.",
        ],
        hintsEs: [
          "Prueba con un valor: si x = 2 y y es 4 veces x, entonces y debe ser 8. ¿Cuáles ecuaciones concuerdan?",
          "x = y ÷ 4 es la misma relación reacomodada: deshace '×4' con '÷4'.",
        ],
        explanation:
          "Substituting x = 2, y = 8 sorts them: y = 4x, y = x × 4, and x = y ÷ 4 all hold true — they are the same relationship written three ways. The others break: y = x + 4 gives 6, x = 4y would need x thirty-two times bigger, and y = 4 ÷ x gives 2. An equation's meaning lives in the relationship, not the letters' order.",
        explanationEs:
          "Sustituir x = 2, y = 8 las clasifica: y = 4x, y = x × 4 y x = y ÷ 4 se cumplen; son la misma relación escrita de tres formas. Las otras fallan: y = x + 4 da 6, x = 4y necesitaría una x treinta y dos veces mayor, y y = 4 ÷ x da 2. El significado de una ecuación vive en la relación, no en el orden de las letras.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "A canoe rents for $15 per hour: c = 15h. Complete the table.",
        labelEs: "Una canoa se renta a $15 por hora: c = 15h. Completa la tabla.",
        columns: ["Hours (h)", "Substitute", "Cost in dollars (c)"],
        rows: [
          { hours: "2", substitute: "c = 15 × 2", answer: "30" },
          { hours: "5", substitute: "c = 15 × 5", answer: "75" },
          { hours: "8", substitute: "c = 15 × 8", answer: "120" },
        ],
        hints: [
          "Replace h with the number of hours, then multiply by the unit rate 15.",
          "Check with the sentence: cost DEPENDS on hours, so c is alone on the left.",
        ],
        hintsEs: [
          "Sustituye h por el número de horas y luego multiplica por la tarifa unitaria 15.",
          "Comprueba con la oración: el costo DEPENDE de las horas, por eso c está sola a la izquierda.",
        ],
        explanation:
          "The equation c = 15h turns every question into one substitution: 2 hours cost $30, 5 hours cost $75, 8 hours cost $120. The unit rate k = 15 is what multiplies — the same k you would find from any table row by computing c ÷ h.",
        explanationEs:
          "La ecuación c = 15h convierte cada pregunta en una sustitución: 2 horas cuestan $30, 5 horas $75, 8 horas $120. La tarifa unitaria k = 15 es lo que multiplica: la misma k que hallarías en cualquier fila de la tabla calculando c ÷ h.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each scenario to the equation that models it.",
        labelEs: "Empareja cada situación con la ecuación que la modela.",
        columns: 2,
        pairs: [
          {
            term: "Canoe rental: $15 per hour",
            match: "c = 15h",
            termEs: "Renta de canoa: $15 por hora",
            matchEs: "c = 15h",
          },
          {
            term: "Gym membership: $24.95 per month",
            match: "c = 24.95m",
            termEs: "Membresía del gimnasio: $24.95 por mes",
            matchEs: "c = 24.95m",
          },
          {
            term: "Football tickets: $45 each",
            match: "c = 45t",
            termEs: "Boletos de fútbol americano: $45 cada uno",
            matchEs: "c = 45t",
          },
          {
            term: "Tram climbing 1,200 feet per minute",
            match: "d = 1200m",
            termEs: "Teleférico que sube 1,200 pies por minuto",
            matchEs: "d = 1200m",
          },
        ],
        hints: [
          "The unit rate — per hour, per month, per ticket — becomes the number k that multiplies the variable.",
          "The dependent variable stands alone on the left: cost or distance, whatever the situation produces.",
        ],
        hintsEs: [
          "La tarifa unitaria — por hora, por mes, por boleto — se convierte en el número k que multiplica la variable.",
          "La variable dependiente queda sola a la izquierda: costo o distancia, lo que la situación produce.",
        ],
        explanation:
          "Every equation here has the shape y = kx: the unit rate becomes k (15, 24.95, 45, or 1,200) and the independent variable is whatever gets counted (hours, months, tickets, minutes). Recognizing that one shape underneath four different stories is what 'writing an equation from a relationship' means.",
        explanationEs:
          "Cada ecuación aquí tiene la forma y = kx: la tarifa unitaria se convierte en k (15, 24.95, 45 o 1,200) y la variable independiente es lo que se cuenta (horas, meses, boletos, minutos). Reconocer esa única forma debajo de cuatro historias distintas es lo que significa 'escribir una ecuación a partir de una relación'.",
      },
    ],
  },

  "9-4": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "The assembly line follows c = 2.5h, where h is hours and c is cars produced. Sort each statement: true or false?",
        instructionsEs:
          "La línea de ensamblaje sigue c = 2.5h, donde h son horas y c son autos producidos. Clasifica cada afirmación: ¿verdadera o falsa?",
        label: "Sort each statement about c = 2.5h.",
        labelEs: "Clasifica cada afirmación sobre c = 2.5h.",
        categories: [
          {
            label: "True",
            labelEs: "Verdadera",
            items: [
              "In 4 hours the line produces 10 cars",
              "h is the independent variable",
              "The unit rate is 2.5 cars per hour",
            ],
            itemsEs: [
              "En 4 horas la línea produce 10 autos",
              "h es la variable independiente",
              "La tasa unitaria es 2.5 autos por hora",
            ],
          },
          {
            label: "False",
            labelEs: "Falsa",
            items: [
              "In 2 hours the line produces 4 cars",
              "c is the input of the equation",
              "In 5 hours the line produces 25 cars",
            ],
            itemsEs: [
              "En 2 horas la línea produce 4 autos",
              "c es la entrada de la ecuación",
              "En 5 horas la línea produce 25 autos",
            ],
          },
        ],
        hints: [
          "Test the number claims by substituting into c = 2.5h.",
          "The input is what you feed the equation — here, hours.",
        ],
        hintsEs: [
          "Prueba las afirmaciones numéricas sustituyendo en c = 2.5h.",
          "La entrada es lo que le das a la ecuación: aquí, las horas.",
        ],
        explanation:
          "Substitution settles each claim: 2.5 × 4 = 10 ✓, but 2.5 × 2 = 5 (not 4) and 2.5 × 5 = 12.5 (not 25). Hours are chosen, so h is independent and is the input; c is the output that responds at 2.5 cars per hour.",
        explanationEs:
          "La sustitución resuelve cada afirmación: 2.5 × 4 = 10 ✓, pero 2.5 × 2 = 5 (no 4) y 2.5 × 5 = 12.5 (no 25). Las horas se eligen, así que h es independiente y es la entrada; c es la salida que responde a 2.5 autos por hora.",
        explanationNote: "",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "The assembly line produces 2.5 cars per hour. Complete the production table.",
        labelEs:
          "La línea de ensamblaje produce 2.5 autos por hora. Completa la tabla de producción.",
        columns: ["Hours (h)", "Substitute c = 2.5h", "Cars produced (c)"],
        rows: [
          { hours: "4", substitute: "2.5 × 4", answer: "10" },
          { hours: "8 (one shift)", substitute: "2.5 × 8", answer: "20" },
          { hours: "100", substitute: "2.5 × 100", answer: "250" },
        ],
        hints: [
          "Multiplying by 2.5 is multiplying by 2, plus half of the number.",
          "The 8-hour row is one shift — the same 20 cars the lesson's shift equation builds on.",
        ],
        hintsEs: [
          "Multiplicar por 2.5 es multiplicar por 2 y sumar la mitad del número.",
          "La fila de 8 horas es un turno: los mismos 20 autos en los que se basa la ecuación de turnos de la lección.",
        ],
        explanation:
          "c = 2.5h gives 10 cars in 4 hours, 20 cars in an 8-hour shift, and 250 cars in 100 hours. The shift row explains the alternate equation c = 20s: one 8-hour shift bundles 2.5 × 8 into a single rate of 20 cars per shift.",
        explanationEs:
          "c = 2.5h da 10 autos en 4 horas, 20 autos en un turno de 8 horas y 250 autos en 100 horas. La fila del turno explica la ecuación alternativa c = 20s: un turno de 8 horas agrupa 2.5 × 8 en una sola tasa de 20 autos por turno.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label:
          "Connect the four representations of the assembly line: scenario, equation, table, and graph.",
        labelEs:
          "Conecta las cuatro representaciones de la línea de ensamblaje: situación, ecuación, tabla y gráfica.",
        columns: 2,
        pairs: [
          {
            term: "Scenario: 2.5 cars every hour",
            match: "Equation: c = 2.5h",
            termEs: "Situación: 2.5 autos cada hora",
            matchEs: "Ecuación: c = 2.5h",
          },
          {
            term: "Table row: h = 8, c = 20",
            match: "Graph point (8, 20)",
            termEs: "Fila de la tabla: h = 8, c = 20",
            matchEs: "Punto de la gráfica (8, 20)",
          },
          {
            term: "Graph point (400, 1000)",
            match: "The 1,000-car order takes 400 hours",
            termEs: "Punto de la gráfica (400, 1000)",
            matchEs: "El pedido de 1,000 autos toma 400 horas",
          },
          {
            term: "Equation c = 20s",
            match: "Cars counted by 8-hour shifts",
            termEs: "Ecuación c = 20s",
            matchEs: "Autos contados por turnos de 8 horas",
          },
        ],
        hints: [
          "A table row (h, c) and a graph point (x, y) carry identical information.",
          "To interpret a point, read it as a sentence: 'after ___ hours, ___ cars.'",
        ],
        hintsEs: [
          "Una fila de tabla (h, c) y un punto de gráfica (x, y) llevan información idéntica.",
          "Para interpretar un punto, léelo como oración: 'después de ___ horas, ___ autos.'",
        ],
        explanation:
          "The four representations tell one story: the 2.5-cars-per-hour scenario is compressed into c = 2.5h; the table row (8, 20) and the graph point (8, 20) are the same fact in two costumes; the point (400, 1000) answers the order question; and c = 20s re-counts the same production in shifts. Moving fluently between them is the 'apply' skill of this lesson.",
        explanationEs:
          "Las cuatro representaciones cuentan una sola historia: la situación de 2.5 autos por hora se comprime en c = 2.5h; la fila (8, 20) y el punto (8, 20) son el mismo hecho con dos disfraces; el punto (400, 1000) responde la pregunta del pedido; y c = 20s recuenta la misma producción en turnos. Moverse con fluidez entre ellas es la habilidad de 'aplicar' de esta lección.",
      },
    ],
  },

  "10-1": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "The gardener plans a 4 ft by 2 ft planter that is 1 ft deep. Sort each question: area or volume?",
        instructionsEs:
          "El jardinero planea un cantero de 4 pies por 2 pies con 1 pie de profundidad. Clasifica cada pregunta: ¿área o volumen?",
        label: "Sort each gardening question: does it need area or volume?",
        labelEs: "Clasifica cada pregunta de jardinería: ¿necesita área o volumen?",
        categories: [
          {
            label: "Area (square feet)",
            labelEs: "Área (pies cuadrados)",
            items: [
              "How much ground does the planter cover?",
              "How much mesh covers the top against birds?",
              "How much of the yard is left uncovered?",
            ],
            itemsEs: [
              "¿Cuánto terreno cubre el cantero?",
              "¿Cuánta malla cubre la parte de arriba contra los pájaros?",
              "¿Cuánto patio queda sin cubrir?",
            ],
          },
          {
            label: "Volume (cubic feet)",
            labelEs: "Volumen (pies cúbicos)",
            items: [
              "How much soil fills the planter?",
              "How much compost fills a second, deeper planter?",
              "How much water does the full rain barrel hold?",
            ],
            itemsEs: [
              "¿Cuánta tierra llena el cantero?",
              "¿Cuánta composta llena un segundo cantero más profundo?",
              "¿Cuánta agua cabe en el barril de lluvia lleno?",
            ],
          },
        ],
        hints: [
          "Covering flat ground is area; filling a container is volume.",
          "The planter's 4 × 2 base covers 8 square feet; add the 1-foot depth and the soil is 8 cubic feet.",
        ],
        hintsEs: [
          "Cubrir terreno plano es área; llenar un recipiente es volumen.",
          "La base de 4 × 2 del cantero son 8 pies cuadrados; con 1 pie de profundidad, la tierra son 8 pies cúbicos.",
        ],
        explanation:
          "The gardener needs both measures for one planter: covering questions (ground, mesh, yard) are flat and use square feet, while filling questions (soil, compost, water) use all three dimensions and cubic feet. Choosing the right measure before computing is the real-world modeling step.",
        explanationEs:
          "El jardinero necesita ambas medidas para un solo cantero: las preguntas de cubrir (terreno, malla, patio) son planas y usan pies cuadrados, mientras que las de llenar (tierra, composta, agua) usan las tres dimensiones y pies cúbicos. Elegir la medida correcta antes de calcular es el paso de modelado del mundo real.",
        explanationNote: "",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label:
          "Each person who rinses instead of running water saves 8 gallons a day. Complete the table.",
        labelEs:
          "Cada persona que enjuaga en vez de dejar correr el agua ahorra 8 galones al día. Completa la tabla.",
        columns: ["People in the house", "Thinking", "Gallons saved per day"],
        rows: [
          { people: "3", thinking: "3 × 8", answer: "24" },
          { people: "5", thinking: "5 × 8", answer: "40" },
          { people: "8", thinking: "8 × 8", answer: "64" },
        ],
        hints: [
          "Each person contributes the same 8 gallons — equal groups multiply.",
          "To stretch any row to a year, you would multiply by 365 — that is how the 2,920 in this lesson was built.",
        ],
        hintsEs: [
          "Cada persona aporta los mismos 8 galones: los grupos iguales se multiplican.",
          "Para extender cualquier fila a un año, multiplicarías por 365: así se construyó el 2,920 de esta lección.",
        ],
        explanation:
          "The savings scale with the household: 3 people save 24 gallons a day, 5 save 40, and 8 save 64. Multiply any row by 365 days and you get the yearly figures the lesson compares — 8 × 365 = 2,920 gallons per person per year.",
        explanationEs:
          "El ahorro escala con el hogar: 3 personas ahorran 24 galones al día, 5 ahorran 40 y 8 ahorran 64. Multiplica cualquier fila por 365 días y obtienes las cifras anuales que la lección compara: 8 × 365 = 2,920 galones por persona al año.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each person to the math their real-world task uses.",
        labelEs: "Empareja a cada persona con las matemáticas que usa su tarea del mundo real.",
        columns: 2,
        pairs: [
          {
            term: "Chef tripling a recipe",
            match: "Multiply every ingredient by 3",
            termEs: "Chef que triplica una receta",
            matchEs: "Multiplicar cada ingrediente por 3",
          },
          {
            term: "Gardener filling a 4 × 2 × 1 ft planter",
            match: "Volume: 8 cubic feet of soil",
            termEs: "Jardinero que llena un cantero de 4 × 2 × 1 pies",
            matchEs: "Volumen: 8 pies cúbicos de tierra",
          },
          {
            term: "Family tracking water savings",
            match: "8 gallons × 365 days",
            termEs: "Familia que registra su ahorro de agua",
            matchEs: "8 galones × 365 días",
          },
          {
            term: "Shopper comparing two sizes",
            match: "Unit rate: price ÷ quantity",
            termEs: "Comprador que compara dos tamaños",
            matchEs: "Tasa unitaria: precio ÷ cantidad",
          },
        ],
        hints: [
          "Name the quantity each person needs first — amount of ingredients, soil, water, or dollars per unit.",
          "Scaling uses multiplication; comparing uses a rate.",
        ],
        hintsEs: [
          "Nombra primero la cantidad que cada persona necesita: ingredientes, tierra, agua o dólares por unidad.",
          "Escalar usa multiplicación; comparar usa una tasa.",
        ],
        explanation:
          "Each career or chore hides a specific tool: the chef scales by a factor, the gardener computes a volume, the family multiplies a daily rate across a year, and the shopper divides to get a unit rate. 'Math is everywhere' is not a slogan — it is that every one of these decisions is a computation.",
        explanationEs:
          "Cada oficio o tarea esconde una herramienta específica: el chef escala por un factor, el jardinero calcula un volumen, la familia multiplica una tasa diaria por un año y el comprador divide para obtener una tasa unitaria. 'Las matemáticas están en todas partes' no es un eslogan: cada una de estas decisiones es un cálculo.",
      },
    ],
  },

  "10-2": {
    approaching: [
      {
        type: "drag-sort",
        instructions: "Sort each figure: does it have at least one line of symmetry, or none?",
        instructionsEs: "Clasifica cada figura: ¿tiene al menos una línea de simetría o ninguna?",
        label: "Sort each figure by whether it has a line of symmetry.",
        labelEs: "Clasifica cada figura según si tiene una línea de simetría.",
        categories: [
          {
            label: "Has a line of symmetry",
            labelEs: "Tiene línea de simetría",
            items: ["A butterfly with open wings", "The letter A", "A square", "A valentine heart"],
            itemsEs: [
              "Una mariposa con las alas abiertas",
              "La letra A",
              "Un cuadrado",
              "Un corazón de San Valentín",
            ],
          },
          {
            label: "No line of symmetry",
            labelEs: "Sin línea de simetría",
            items: [
              "The letter F",
              "The letter J",
              "The letter R",
              "A flag shape like the letter P",
            ],
            itemsEs: ["La letra F", "La letra J", "La letra R", "Una bandera con forma de letra P"],
          },
        ],
        hints: [
          "Run the mirror test: can you draw a line so each half is the other's mirror image?",
          "Try folding the figure in your mind — symmetric shapes fold onto themselves exactly.",
        ],
        hintsEs: [
          "Haz la prueba del espejo: ¿puedes trazar una línea de modo que cada mitad sea el reflejo de la otra?",
          "Imagina doblar la figura: las formas simétricas se pliegan exactamente sobre sí mismas.",
        ],
        explanation:
          "The butterfly, the letter A, the square, and the heart all pass the mirror test — a vertical fold matches the halves (the square passes four different folds). F, J, R, and P fail every possible fold: no line splits them into mirror images. The mirror test, not appearance or beauty, is what decides.",
        explanationEs:
          "La mariposa, la letra A, el cuadrado y el corazón pasan la prueba del espejo: un doblez vertical hace coincidir las mitades (el cuadrado pasa cuatro dobleces distintos). F, J, R y P fallan con cualquier doblez: ninguna línea las divide en imágenes especulares. La prueba del espejo, no la apariencia ni la belleza, es lo que decide.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "How many lines of symmetry does each figure have?",
        labelEs: "¿Cuántas líneas de simetría tiene cada figura?",
        columns: ["Figure", "Think about the folds", "Lines of symmetry"],
        rows: [
          { figure: "Square", think: "2 through the sides + 2 through the corners", answer: "4" },
          {
            figure: "Rectangle (not a square)",
            think: "through the sides only — corner folds fail",
            answer: "2",
          },
          { figure: "Equilateral triangle", think: "one through each corner", answer: "3" },
          { figure: "The letter H", think: "one vertical + one horizontal", answer: "2" },
        ],
        hints: [
          "Count every fold that maps the figure onto itself — sides AND diagonals.",
          "A rectangle's diagonal fold does NOT match the halves; a square's does.",
        ],
        hintsEs: [
          "Cuenta cada doblez que hace coincidir la figura consigo misma: por los lados Y por las diagonales.",
          "El doblez diagonal de un rectángulo NO hace coincidir las mitades; el de un cuadrado sí.",
        ],
        explanation:
          "A square has 4 lines (two through midpoints, two through corners); a non-square rectangle keeps only the two midpoint lines, because its diagonal folds do not match; an equilateral triangle has 3; the letter H has a vertical and a horizontal line, so 2. Counting folds precisely is what upgrades 'looks symmetric' into geometry.",
        explanationEs:
          "Un cuadrado tiene 4 líneas (dos por los puntos medios y dos por las esquinas); un rectángulo no cuadrado conserva solo las dos de los puntos medios, porque sus dobleces diagonales no coinciden; un triángulo equilátero tiene 3; la letra H tiene una vertical y una horizontal, es decir 2. Contar los dobleces con precisión convierte el 'se ve simétrico' en geometría.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each transformation idea to its description.",
        labelEs: "Empareja cada idea de transformación con su descripción.",
        columns: 2,
        pairs: [
          {
            term: "Reflection",
            match: "Flip across a mirror line",
            termEs: "Reflexión",
            matchEs: "Voltear a través de una línea espejo",
          },
          {
            term: "Rotation",
            match: "Turn around a center point",
            termEs: "Rotación",
            matchEs: "Girar alrededor de un punto central",
          },
          {
            term: "Translation",
            match: "Slide without turning or flipping",
            termEs: "Traslación",
            matchEs: "Deslizar sin girar ni voltear",
          },
          {
            term: "Rotational symmetry",
            match: "Fits onto itself in less than a full turn",
            termEs: "Simetría rotacional",
            matchEs: "Coincide consigo misma en menos de una vuelta completa",
          },
        ],
        hints: [
          "Reflection needs a line; rotation needs a point; translation needs neither — just a direction.",
          "All three transformations preserve side lengths and angle measures.",
        ],
        hintsEs: [
          "La reflexión necesita una línea; la rotación, un punto; la traslación, ninguno: solo una dirección.",
          "Las tres transformaciones conservan las longitudes de los lados y las medidas de los ángulos.",
        ],
        explanation:
          "Reflection flips across a line (the butterfly's symmetry), rotation turns around a point, and translation slides — and because all three preserve lengths and angles, the copies stay congruent. Rotational symmetry is the special case where a turn of less than 360° lands a shape exactly on itself, like a starfish or a pinwheel.",
        explanationEs:
          "La reflexión voltea a través de una línea (la simetría de la mariposa), la rotación gira alrededor de un punto y la traslación desliza; y como las tres conservan longitudes y ángulos, las copias siguen siendo congruentes. La simetría rotacional es el caso especial donde un giro de menos de 360° hace que la figura caiga exactamente sobre sí misma, como una estrella de mar o un molinete.",
      },
    ],
  },

  "10-3": {
    approaching: [
      {
        type: "drag-sort",
        instructions: "Sort each move: is it allowed by the Tower of Hanoi rules, or against them?",
        instructionsEs:
          "Clasifica cada movimiento: ¿lo permiten las reglas de la Torre de Hanói o va en contra de ellas?",
        label: "Sort each move: legal or against the rules?",
        labelEs: "Clasifica cada movimiento: ¿legal o contra las reglas?",
        categories: [
          {
            label: "Legal move",
            labelEs: "Movimiento legal",
            items: [
              "Move the top disc of any stack",
              "Place a small disc on a bigger disc",
              "Move exactly one disc at a time",
            ],
            itemsEs: [
              "Mover el disco de arriba de cualquier pila",
              "Colocar un disco pequeño sobre uno más grande",
              "Mover exactamente un disco a la vez",
            ],
          },
          {
            label: "Against the rules",
            labelEs: "Contra las reglas",
            items: [
              "Move two discs at once",
              "Place a big disc on a smaller disc",
              "Pull a disc out from the middle of a stack",
            ],
            itemsEs: [
              "Mover dos discos a la vez",
              "Colocar un disco grande sobre uno más pequeño",
              "Sacar un disco de en medio de una pila",
            ],
          },
        ],
        hints: [
          "Only the TOP disc of a stack can move, and only one at a time.",
          "The size rule: smaller may rest on bigger, never the reverse.",
        ],
        hintsEs: [
          "Solo el disco de ARRIBA de una pila puede moverse, y solo uno a la vez.",
          "La regla del tamaño: el pequeño puede descansar sobre el grande, nunca al revés.",
        ],
        explanation:
          "The three legal moves are the whole rule set: take only a top disc, move one at a time, and rest smaller on bigger. The illegal moves each break exactly one rule — two at once, big on small, or grabbing from mid-stack. Every 2ⁿ − 1 solution is built from nothing but the legal three.",
        explanationEs:
          "Los tres movimientos legales son todo el reglamento: tomar solo el disco de arriba, mover uno a la vez y apoyar el pequeño sobre el grande. Los ilegales rompen exactamente una regla cada uno: dos a la vez, grande sobre pequeño o sacar de en medio. Cada solución de 2ⁿ − 1 se construye solo con los tres legales.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "Use the doubling pattern to complete the table of fewest moves.",
        labelEs: "Usa el patrón de duplicación para completar la tabla de movimientos mínimos.",
        columns: ["Discs", "Pattern: double the previous, add 1", "Fewest moves"],
        rows: [
          { discs: "3", pattern: "2 × 3 + 1", answer: "7" },
          { discs: "4", pattern: "2 × 7 + 1", answer: "15" },
          { discs: "6", pattern: "2 × 31 + 1", answer: "63" },
        ],
        hints: [
          "Each new disc means: solve the smaller tower, move the big disc, solve the smaller tower again.",
          "That is why the rule is double-plus-one: two copies of the previous answer, plus one move for the biggest disc.",
        ],
        hintsEs: [
          "Cada disco nuevo significa: resolver la torre más pequeña, mover el disco grande y resolver la torre pequeña otra vez.",
          "Por eso la regla es duplicar y sumar uno: dos copias de la respuesta anterior más un movimiento para el disco más grande.",
        ],
        explanation:
          "The recursion is the reason for the rule: to move n discs you solve n − 1 discs (7 moves), carry the biggest disc (1 move), and solve n − 1 again (7 moves) — so 4 discs need 15, 5 need 31, and 6 need 2 × 31 + 1 = 63. The pattern 1, 3, 7, 15, 31, 63 is one less than the doubling numbers 2, 4, 8, 16, 32, 64.",
        explanationEs:
          "La recursión explica la regla: para mover n discos resuelves n − 1 discos (7 movimientos), llevas el disco más grande (1 movimiento) y resuelves n − 1 otra vez (7 movimientos); por eso 4 discos necesitan 15, 5 necesitan 31 y 6 necesitan 2 × 31 + 1 = 63. El patrón 1, 3, 7, 15, 31, 63 es uno menos que los números que se duplican: 2, 4, 8, 16, 32, 64.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each tower to the calculation that gives its fewest moves.",
        labelEs: "Empareja cada torre con el cálculo que da sus movimientos mínimos.",
        columns: 2,
        pairs: [
          {
            term: "4-disc tower",
            match: "2 × 7 + 1 = 15",
            termEs: "Torre de 4 discos",
            matchEs: "2 × 7 + 1 = 15",
          },
          {
            term: "5-disc tower",
            match: "2 × 15 + 1 = 31",
            termEs: "Torre de 5 discos",
            matchEs: "2 × 15 + 1 = 31",
          },
          {
            term: "6-disc tower",
            match: "2 × 31 + 1 = 63",
            termEs: "Torre de 6 discos",
            matchEs: "2 × 31 + 1 = 63",
          },
          {
            term: "Any n-disc tower",
            match: "Double the (n − 1)-disc answer, add 1",
            termEs: "Cualquier torre de n discos",
            matchEs: "Duplicar la respuesta de (n − 1) discos y sumar 1",
          },
        ],
        hints: [
          "Each calculation reuses the answer for one disc fewer — find the chain.",
          "The last card states the general rule; the other three are that rule applied.",
        ],
        hintsEs: [
          "Cada cálculo reutiliza la respuesta de un disco menos: encuentra la cadena.",
          "La última tarjeta enuncia la regla general; las otras tres son esa regla aplicada.",
        ],
        explanation:
          "The chain 7 → 15 → 31 → 63 applies double-plus-one three times, and the fourth card names the general rule that generates the whole sequence. Recognizing a specific pattern AND its general statement as the same idea is the heart of algorithmic thinking in this lesson.",
        explanationEs:
          "La cadena 7 → 15 → 31 → 63 aplica duplicar-más-uno tres veces, y la cuarta tarjeta nombra la regla general que genera toda la secuencia. Reconocer que un patrón específico Y su enunciado general son la misma idea es el corazón del pensamiento algorítmico de esta lección.",
      },
    ],
  },

  "10-4": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "The pedal gear has 48 teeth. Sort each rear gear: does the wheel turn MORE than once per pedal turn, or once or less?",
        instructionsEs:
          "El engranaje del pedal tiene 48 dientes. Clasifica cada engranaje trasero: ¿la rueda gira MÁS de una vez por pedaleo, o una vez o menos?",
        label: "Sort each rear gear by how the wheel responds to one pedal turn.",
        labelEs: "Clasifica cada engranaje trasero según cómo responde la rueda a un pedaleo.",
        categories: [
          {
            label: "More than one wheel rotation",
            labelEs: "Más de una rotación de la rueda",
            items: ["12-tooth rear gear", "16-tooth rear gear", "24-tooth rear gear"],
            itemsEs: [
              "Engranaje trasero de 12 dientes",
              "Engranaje trasero de 16 dientes",
              "Engranaje trasero de 24 dientes",
            ],
          },
          {
            label: "One rotation or less",
            labelEs: "Una rotación o menos",
            items: ["48-tooth rear gear", "60-tooth rear gear", "96-tooth rear gear"],
            itemsEs: [
              "Engranaje trasero de 48 dientes",
              "Engranaje trasero de 60 dientes",
              "Engranaje trasero de 96 dientes",
            ],
          },
        ],
        hints: [
          "Gear ratio = driver teeth ÷ driven teeth = 48 ÷ rear teeth.",
          "A rear gear SMALLER than 48 teeth spins the wheel faster than the pedals.",
        ],
        hintsEs: [
          "Razón de engranajes = dientes del conductor ÷ dientes del conducido = 48 ÷ dientes traseros.",
          "Un engranaje trasero MENOR de 48 dientes hace girar la rueda más rápido que los pedales.",
        ],
        explanation:
          "The ratio 48 ÷ rear-teeth tells the story: 12, 16, and 24 teeth give ratios of 4, 3, and 2 — the wheel outspins the pedals. At 48 teeth the ratio is exactly 1, and at 60 or 96 the ratio drops below 1, so the wheel turns slower than the pedals — more force, less speed. That trade-off is the ingenuity of gears.",
        explanationEs:
          "La razón 48 ÷ dientes traseros cuenta la historia: 12, 16 y 24 dientes dan razones de 4, 3 y 2; la rueda gira más que los pedales. Con 48 dientes la razón es exactamente 1, y con 60 o 96 baja de 1: la rueda gira más lento que los pedales — más fuerza, menos velocidad. Ese intercambio es la ingeniosidad de los engranajes.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label: "The pedal gear has 48 teeth. Complete the table of wheel rotations per pedal turn.",
        labelEs:
          "El engranaje del pedal tiene 48 dientes. Completa la tabla de rotaciones de la rueda por pedaleo.",
        columns: ["Rear gear (teeth)", "Ratio 48 ÷ teeth", "Wheel rotations per pedal turn"],
        rows: [
          { gear: "12", ratio: "48 ÷ 12", answer: "4" },
          { gear: "16", ratio: "48 ÷ 16", answer: "3" },
          { gear: "24", ratio: "48 ÷ 24", answer: "2" },
        ],
        hints: [
          "Divide the driver's 48 teeth by the rear gear's teeth.",
          "Fewer rear teeth → more rotations: the small gear must spin several times to match 48 teeth passing.",
        ],
        hintsEs: [
          "Divide los 48 dientes del conductor entre los dientes del engranaje trasero.",
          "Menos dientes traseros → más rotaciones: el engranaje pequeño debe girar varias veces para igualar los 48 dientes que pasan.",
        ],
        explanation:
          "Every pedal turn pushes 48 teeth of chain, so a 12-tooth gear must rotate 4 times, a 16-tooth gear 3 times, and a 24-tooth gear twice. This is why a gear-driven safety bicycle could match the giant Penny Farthing wheel — the ratio multiplies rotation instead of wheel size.",
        explanationEs:
          "Cada pedaleo empuja 48 dientes de cadena, así que un engranaje de 12 dientes debe rotar 4 veces, uno de 16 dientes 3 veces y uno de 24 dientes dos veces. Por eso una bicicleta con engranajes pudo igualar a la enorme rueda del Penny Farthing: la razón multiplica la rotación en vez del tamaño de la rueda.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Distance = rotations × circumference. Match each ride to its distance.",
        labelEs:
          "Distancia = rotaciones × circunferencia. Empareja cada recorrido con su distancia.",
        columns: 2,
        pairs: [
          {
            term: "4 wheel rotations, 7 ft circumference",
            match: "28 feet",
            termEs: "4 rotaciones de rueda, circunferencia de 7 pies",
            matchEs: "28 pies",
          },
          {
            term: "3 wheel rotations, 6 ft circumference",
            match: "18 feet",
            termEs: "3 rotaciones de rueda, circunferencia de 6 pies",
            matchEs: "18 pies",
          },
          {
            term: "2 wheel rotations, 7 ft circumference",
            match: "14 feet",
            termEs: "2 rotaciones de rueda, circunferencia de 7 pies",
            matchEs: "14 pies",
          },
          {
            term: "48-tooth pedal gear with a 12-tooth rear gear",
            match: "4 rotations per pedal turn",
            termEs: "Engranaje de pedal de 48 dientes con trasero de 12 dientes",
            matchEs: "4 rotaciones por pedaleo",
          },
        ],
        hints: [
          "Multiply rotations by circumference for the distance cards.",
          "The gear card asks for the RATIO, not a distance — 48 ÷ 12.",
        ],
        hintsEs: [
          "Multiplica rotaciones por circunferencia en las tarjetas de distancia.",
          "La tarjeta de engranajes pide la RAZÓN, no una distancia: 48 ÷ 12.",
        ],
        explanation:
          "Distance comes from rotations × circumference: 4 × 7 = 28 ft, 3 × 6 = 18 ft, 2 × 7 = 14 ft. The gear pair 48:12 produces the 4 rotations in the first card — chaining the gear ratio into the distance formula is exactly how a cyclist computes how far one pedal stroke carries them.",
        explanationEs:
          "La distancia viene de rotaciones × circunferencia: 4 × 7 = 28 pies, 3 × 6 = 18 pies, 2 × 7 = 14 pies. El par de engranajes 48:12 produce las 4 rotaciones de la primera tarjeta: encadenar la razón de engranajes con la fórmula de distancia es exactamente cómo un ciclista calcula cuánto avanza con un pedaleo.",
      },
    ],
  },

  "10-5": {
    approaching: [
      {
        type: "drag-sort",
        instructions:
          "A shape tessellates when copies of it cover the plane with no gaps and no overlaps. Sort each regular shape.",
        instructionsEs:
          "Una figura tesela cuando sus copias cubren el plano sin huecos ni superposiciones. Clasifica cada figura regular.",
        label: "Sort each shape: can it tessellate by itself?",
        labelEs: "Clasifica cada figura: ¿puede teselar por sí sola?",
        categories: [
          {
            label: "Tessellates by itself",
            labelEs: "Tesela por sí sola",
            items: ["Squares", "Equilateral triangles", "Regular hexagons"],
            itemsEs: ["Cuadrados", "Triángulos equiláteros", "Hexágonos regulares"],
          },
          {
            label: "Cannot tessellate alone",
            labelEs: "No puede teselar sola",
            items: ["Circles", "Regular pentagons", "Regular octagons"],
            itemsEs: ["Círculos", "Pentágonos regulares", "Octágonos regulares"],
          },
        ],
        hints: [
          "Check the angles meeting at one corner point: they must total exactly 360°.",
          "Squares: 4 × 90° = 360° ✓. Pentagons: 3 × 108° = 324° — a gap is left.",
        ],
        hintsEs: [
          "Revisa los ángulos que se juntan en un vértice: deben sumar exactamente 360°.",
          "Cuadrados: 4 × 90° = 360° ✓. Pentágonos: 3 × 108° = 324°: queda un hueco.",
        ],
        explanation:
          "The 360° vertex test decides everything: squares (4 × 90°), triangles (6 × 60°), and hexagons (3 × 120°) each hit 360° exactly, so they tile with no gaps. Pentagon angles (108°) and octagon angles (135°) cannot combine to 360° alone, and circles always leave curved gaps. Beauty here is arithmetic.",
        explanationEs:
          "La prueba de los 360° en el vértice lo decide todo: cuadrados (4 × 90°), triángulos (6 × 60°) y hexágonos (3 × 120°) llegan exactamente a 360°, así que cubren sin huecos. Los ángulos del pentágono (108°) y del octágono (135°) no pueden combinarse solos hasta 360°, y los círculos siempre dejan huecos curvos. La belleza aquí es aritmética.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label:
          "The border pattern repeats circle, square, triangle. Name the shape at each position.",
        labelEs:
          "El patrón del borde repite círculo, cuadrado, triángulo. Nombra la figura en cada posición.",
        columns: ["Position number", "Thinking with the unit of 3", "Shape"],
        rows: [
          { position: "7", thinking: "7 = 3 + 3 + 1, so it restarts", answer: "circle" },
          { position: "12", thinking: "12 = 3 × 4 exactly, ends a unit", answer: "triangle" },
          { position: "20", thinking: "20 = 3 × 6 + 2, second in the unit", answer: "square" },
        ],
        hints: [
          "The pattern unit has 3 shapes — divide the position by 3 and look at the remainder.",
          "Remainder 1 → circle, remainder 2 → square, remainder 0 → triangle.",
        ],
        hintsEs: [
          "La unidad del patrón tiene 3 figuras: divide la posición entre 3 y mira el residuo.",
          "Residuo 1 → círculo, residuo 2 → cuadrado, residuo 0 → triángulo.",
        ],
        explanation:
          "Division by the pattern unit predicts any position without drawing: 7 ÷ 3 leaves remainder 1 (circle), 12 divides exactly so it closes a unit (triangle), and 20 leaves remainder 2 (square). The remainder — not the drawing — is the prediction tool, which is how a pattern unit gives you shape 25 or shape 1,000 equally fast.",
        explanationEs:
          "La división por la unidad del patrón predice cualquier posición sin dibujar: 7 ÷ 3 deja residuo 1 (círculo), 12 divide exacto y cierra una unidad (triángulo) y 20 deja residuo 2 (cuadrado). El residuo — no el dibujo — es la herramienta de predicción, y así una unidad de patrón te da la figura 25 o la 1,000 con la misma rapidez.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label:
          "Match each vertex arrangement to its angle sum — and what it means for tessellation.",
        labelEs:
          "Empareja cada arreglo de vértice con su suma de ángulos y lo que significa para la teselación.",
        columns: 2,
        pairs: [
          {
            term: "4 squares at a vertex",
            match: "4 × 90° = 360° — no gaps",
            termEs: "4 cuadrados en un vértice",
            matchEs: "4 × 90° = 360°: sin huecos",
          },
          {
            term: "6 equilateral triangles at a vertex",
            match: "6 × 60° = 360° — no gaps",
            termEs: "6 triángulos equiláteros en un vértice",
            matchEs: "6 × 60° = 360°: sin huecos",
          },
          {
            term: "3 regular hexagons at a vertex",
            match: "3 × 120° = 360° — no gaps",
            termEs: "3 hexágonos regulares en un vértice",
            matchEs: "3 × 120° = 360°: sin huecos",
          },
          {
            term: "3 regular pentagons at a vertex",
            match: "3 × 108° = 324° — a gap remains",
            termEs: "3 pentágonos regulares en un vértice",
            matchEs: "3 × 108° = 324°: queda un hueco",
          },
        ],
        hints: [
          "Multiply the number of shapes by one interior angle.",
          "Only a sum of exactly 360° closes the vertex — less leaves a gap, more forces an overlap.",
        ],
        hintsEs: [
          "Multiplica el número de figuras por un ángulo interior.",
          "Solo una suma de exactamente 360° cierra el vértice: menos deja un hueco, más obliga a superponer.",
        ],
        explanation:
          "Each arrangement is a one-line computation: squares, triangles, and hexagons close the vertex at exactly 360°, which is why they are the only regular polygons that tessellate alone. Pentagons stall at 324°, leaving a 36° gap no pentagon can fill — the same 360° rule behind every honeycomb and tiled floor.",
        explanationEs:
          "Cada arreglo es un cálculo de una línea: cuadrados, triángulos y hexágonos cierran el vértice exactamente en 360°, y por eso son los únicos polígonos regulares que teselan solos. Los pentágonos se quedan en 324°, dejando un hueco de 36° que ningún pentágono puede llenar: la misma regla de 360° detrás de cada panal y cada piso de mosaicos.",
      },
    ],
  },

  "10-6": {
    approaching: [
      {
        type: "drag-sort",
        instructions: "Sort each idea from this year into the unit of mathematics it belongs to.",
        instructionsEs:
          "Clasifica cada idea de este año en la unidad de matemáticas a la que pertenece.",
        label: "Sort this year's ideas into their areas of mathematics.",
        labelEs: "Clasifica las ideas de este año en sus áreas de matemáticas.",
        categories: [
          {
            label: "Percents",
            labelEs: "Porcentajes",
            items: ["50% of 157", "The 10% benchmark"],
            itemsEs: ["50% de 157", "El punto de referencia del 10%"],
          },
          {
            label: "Statistics",
            labelEs: "Estadística",
            items: ["The median of a data set", "A dot plot of class data"],
            itemsEs: [
              "La mediana de un conjunto de datos",
              "Un diagrama de puntos con datos de la clase",
            ],
          },
          {
            label: "Algebra",
            labelEs: "Álgebra",
            items: ["The equation y = kx", "The independent variable"],
            itemsEs: ["La ecuación y = kx", "La variable independiente"],
          },
        ],
        hints: [
          "Percents compare to 100; statistics describes data; algebra relates variables.",
          "Ask what each idea is FOR: estimating a part, summarizing data, or connecting two quantities.",
        ],
        hintsEs: [
          "Los porcentajes comparan con 100; la estadística describe datos; el álgebra relaciona variables.",
          "Pregunta para qué sirve cada idea: estimar una parte, resumir datos o conectar dos cantidades.",
        ],
        explanation:
          "This is the year in one sort: percents (50% of 157, benchmarks) compare quantities to 100; statistics (median, dot plots) summarizes collected data; algebra (y = kx, independent variables) connects quantities that change together. In September these were six unknown phrases — now they file themselves.",
        explanationEs:
          "Este es el año en una sola clasificación: los porcentajes (50% de 157, referencias) comparan cantidades con 100; la estadística (mediana, diagramas de puntos) resume datos recolectados; el álgebra (y = kx, variables independientes) conecta cantidades que cambian juntas. En septiembre eran seis frases desconocidas; ahora se clasifican solas.",
      },
    ],
    onLevel: [
      {
        type: "fill-table",
        label:
          "Answer each quick problem with this year's skills — the same numbers you met in Lesson 1-1.",
        labelEs:
          "Responde cada problema rápido con las destrezas de este año: los mismos números que viste en la Lección 1-1.",
        columns: ["Problem from this year", "Thinking", "Answer"],
        rows: [
          { problem: "50% of 157", thinking: "half of 157", answer: "78.5" },
          { problem: "10% of 480", thinking: "move the decimal", answer: "48" },
          { problem: "Riders per hour: 80 per turn × 6 turns", thinking: "80 × 6", answer: "480" },
        ],
        hints: [
          "50% is a half; 10% moves the decimal one place left.",
          "The Ferris wheel numbers are from your September estimate — solve them with June skills.",
        ],
        hintsEs: [
          "50% es la mitad; 10% mueve el decimal un lugar a la izquierda.",
          "Los números de la rueda de la fortuna son de tu estimación de septiembre: resuélvelos con destrezas de junio.",
        ],
        explanation:
          "Half of 157 is 78.5 — the very number Lesson 1-1 asked you to decompose in September. 10% of 480 moves the decimal to 48, and the Ferris wheel still carries 80 × 6 = 480 riders an hour. Same numbers, new power: that difference is the portfolio's evidence of growth.",
        explanationEs:
          "La mitad de 157 es 78.5, el mismísimo número que la Lección 1-1 te pidió descomponer en septiembre. El 10% de 480 mueve el decimal a 48, y la rueda de la fortuna sigue llevando 80 × 6 = 480 pasajeros por hora. Los mismos números con un poder nuevo: esa diferencia es la evidencia de crecimiento del portafolio.",
      },
    ],
    extending: [
      {
        type: "matching-game",
        label: "Match each September estimate to the refined result your math produces now.",
        labelEs:
          "Empareja cada estimación de septiembre con el resultado refinado que tus matemáticas producen ahora.",
        columns: 2,
        pairs: [
          {
            term: "20 cars × about 4 riders each",
            match: "About 80 riders per turn",
            termEs: "20 carros × unas 4 personas cada uno",
            matchEs: "Unos 80 pasajeros por vuelta",
          },
          {
            term: "80 riders × 6 turns each hour",
            match: "480 riders each hour",
            termEs: "80 pasajeros × 6 vueltas por hora",
            matchEs: "480 pasajeros por hora",
          },
          {
            term: "78.5 written by place value",
            match: "(7 × 10) + (8 × 1) + (5 × 0.1)",
            termEs: "78.5 escrito por valor posicional",
            matchEs: "(7 × 10) + (8 × 1) + (5 × 0.1)",
          },
          {
            term: "480 riders per hour for 3 hours",
            match: "1,440 riders",
            termEs: "480 pasajeros por hora durante 3 horas",
            matchEs: "1,440 pasajeros",
          },
        ],
        hints: [
          "Each left card is a September question; each right card is where this year's skills take it.",
          "Chain the estimates: riders per turn → riders per hour → riders per evening.",
        ],
        hintsEs: [
          "Cada tarjeta izquierda es una pregunta de septiembre; cada derecha es adonde la llevan las destrezas de este año.",
          "Encadena las estimaciones: pasajeros por vuelta → por hora → por noche.",
        ],
        explanation:
          "The chain runs from first estimate to full answer: 20 × 4 gives about 80 riders per turn, 80 × 6 gives 480 an hour, and 3 hours carries 1,440 riders — while the place-value decomposition of 78.5 shows the precision you now attach to a number you once only estimated. The September questions did not change; the mathematician did.",
        explanationEs:
          "La cadena va de la primera estimación a la respuesta completa: 20 × 4 da unos 80 pasajeros por vuelta, 80 × 6 da 480 por hora y 3 horas llevan a 1,440 pasajeros, mientras que la descomposición por valor posicional de 78.5 muestra la precisión que ahora le pones a un número que antes solo estimabas. Las preguntas de septiembre no cambiaron; quien cambió fue el matemático.",
      },
    ],
  },
};

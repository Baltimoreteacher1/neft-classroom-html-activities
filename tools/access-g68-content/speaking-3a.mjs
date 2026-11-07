// Grades 6-8 publisher pass, Speaking batch 3a: math talk plus science, maps, civics and the ancient world. Original prompts.
export default [
  {
    id: "s-a-winter-temps-table",
    level: "A",
    strand: "Describe data",
    title: "Describe the Winter Temperatures",
    skill: "Reading temperatures above and below zero from a table and saying warmest and coldest",
    dir: "Look at the table of morning temperatures. Plan what to say, then record yourself.",
    q: "Tell your partner which day was the warmest and which day was the coldest. Say one temperature that is below zero.",
    table: {
      caption: "Morning temperatures in one week",
      headers: ["Day", "Temperature (degrees Celsius)"],
      rows: [
        ["Monday", "4"],
        ["Tuesday", "1"],
        ["Wednesday", "-2"],
        ["Thursday", "-5"],
        ["Friday", "0"],
      ],
    },
    focus: ["the warmest day", "the coldest day", "the word negative for a temperature below zero"],
    models: {
      A: "Monday was the warmest. Thursday was the coldest. It was negative five degrees.",
      B: "The table shows morning temperatures for five days. Monday was the warmest at four degrees, and Thursday was the coldest at negative five degrees. Wednesday was also below zero.",
      C: "This table shows the morning temperature in degrees Celsius for five days. Monday was the warmest at four degrees, and Thursday was the coldest at negative five degrees, which is nine degrees colder than Monday. Wednesday was negative two degrees, so it was below zero too, and Friday was exactly zero.",
    },
    criteria: [
      "I said which day was the warmest.",
      "I said which day was the coldest.",
      "I used the word negative for a temperature below zero.",
    ],
    vocab: [
      ["negative", "a number less than zero", "negativo: un número menor que cero"],
      [
        "temperature",
        "how hot or cold something is",
        "temperatura: qué tan caliente o frío está algo",
      ],
      ["below zero", "colder than zero degrees", "bajo cero: más frío que cero grados"],
    ],
    frames: [
      "___ was the warmest day.",
      "___ was the coldest day. It was negative ___ degrees.",
      "The temperature on ___ was below zero.",
    ],
    wida: ["Inform: describe data from a table", "Use negative numbers in speech"],
    es: [
      "Leer temperaturas sobre y bajo cero en una tabla y decir cuál fue el día más cálido y el más frío",
      "Mira la tabla de temperaturas de la mañana. Planea qué vas a decir y luego grábate.",
    ],
    correct:
      "Good description. You used the table to name the warmest day, the coldest day, and a temperature below zero.",
    hint: "Look down the temperature column. The biggest number is the warmest day. The number farthest below zero is the coldest day.",
  },
  {
    id: "s-a-triangle-missing-angle",
    level: "A",
    strand: "Explain your thinking",
    title: "Find the Missing Angle",
    skill: "Saying how to find the third angle of a triangle from two known angles",
    dir: "Look at the table of triangle angles. Plan what to say, then record yourself.",
    q: "Choose Triangle P. Tell your partner its missing angle and what the three angles of a triangle add up to.",
    table: {
      caption: "Angles in degrees",
      headers: ["Triangle", "Angle 1", "Angle 2", "Angle 3"],
      rows: [
        ["P", "50", "60", "?"],
        ["Q", "90", "30", "?"],
        ["R", "45", "45", "?"],
      ],
    },
    focus: ["the two angles you know", "what the three angles add up to", "the missing angle"],
    models: {
      A: "The missing angle is seventy degrees. The three angles make one hundred eighty.",
      B: "Triangle P has angles of fifty and sixty degrees. Fifty plus sixty is one hundred ten. The three angles add up to one hundred eighty, so the missing angle is seventy degrees.",
      C: "In Triangle P, two angles are fifty degrees and sixty degrees, which add up to one hundred ten. Because the three angles of any triangle add up to one hundred eighty degrees, I subtract one hundred ten from one hundred eighty. The missing angle is seventy degrees. To check, fifty plus sixty plus seventy is one hundred eighty.",
    },
    criteria: [
      "I said the two angles I know.",
      "I said that the three angles add up to a total.",
      "I said the missing angle in degrees.",
    ],
    vocab: [
      [
        "angle",
        "the space between two lines that meet at a point",
        "ángulo: el espacio entre dos líneas que se unen en un punto",
      ],
      [
        "degrees",
        "the unit used to measure angles",
        "grados: la unidad que se usa para medir ángulos",
      ],
      [
        "triangle",
        "a shape with three sides and three angles",
        "triángulo: una figura con tres lados y tres ángulos",
      ],
    ],
    frames: [
      "Two angles are ___ degrees and ___ degrees.",
      "The three angles add up to ___ degrees.",
      "The missing angle is ___ degrees.",
    ],
    wida: ["Explain: say how to find a missing angle", "Use math terms in a short spoken answer"],
    es: [
      "Decir cómo hallar el tercer ángulo de un triángulo a partir de dos ángulos conocidos",
      "Mira la tabla de ángulos de triángulos. Planea qué vas a decir y luego grábate.",
    ],
    correct:
      "Clear explanation. You used the two known angles and the total of the three angles to find the missing one.",
    hint: "Add the two angles you can see. Then think about how much more you need to reach the total for a triangle.",
  },
  {
    id: "s-a-sale-percent-reply",
    level: "A",
    strand: "Everyday school talk",
    type: "multipleChoice",
    title: "Store Counter: Say How Much You Save",
    skill: "Choosing a clear spoken reply that uses a percent of a price",
    dir: "Read the store situation. Choose the best reply. Then say your choice aloud.",
    q: 'A customer holds a $20 shirt with a sign that says 25% off. The customer asks, "How much will I save?" What is the best reply?',
    opts: [
      "You save $5, because 25% of $20 is $5.",
      "You save $25, because the sign says 25% off.",
      "You save some money, but I am not sure how much.",
    ],
    why: [
      "This reply treats the percent as a number of dollars, but 25% means a part of the price, not 25 dollars.",
      "This reply is polite but does not answer the question, so the customer still does not know the amount.",
    ],
    focus: ["the amount saved", "the word because", "the percent and the price"],
    vocab: [
      ["percent", "a number out of one hundred", "por ciento: un número de cada cien"],
      [
        "save",
        "to pay less money than the regular price",
        "ahorrar: pagar menos dinero que el precio normal",
      ],
    ],
    frames: ["You save ___ dollars.", "___ percent of ___ is ___."],
    wida: ["Inform: choose a clear reply with a percent", "Use because in a store role-play"],
    es: [
      "Elegir una respuesta oral clara que use un porcentaje de un precio",
      "Lee la situación de la tienda. Elige la mejor respuesta. Luego di tu elección en voz alta.",
    ],
    correct:
      "Yes. A good reply gives the exact amount saved and uses because to show the percent of the price.",
    hint: "Choose the reply that answers the question with an exact amount and shows how the percent was used.",
  },
  {
    id: "s-b-spinner-probability-table",
    level: "B",
    gw: "g67-task",
    strand: "Explain with data",
    title: "Spinner Results: How Likely Is Blue?",
    skill: "Describing experimental probability from a table of results",
    dir: "Look at the table of spinner results. Plan your answer, then record yourself.",
    q: "A class spun a spinner 20 times and wrote down each color it landed on. Tell which color landed most often. Then use the table to explain the experimental probability of landing on blue.",
    table: {
      caption: "Spinner results",
      headers: ["Color", "Times it landed"],
      rows: [
        ["Red", "8"],
        ["Blue", "6"],
        ["Green", "4"],
        ["Yellow", "2"],
      ],
    },
    focus: [
      "the color that landed most often",
      "the number of blues out of the total spins",
      "the words out of or probability",
      "a connector such as so or because",
    ],
    models: {
      A: "Red landed the most, eight times. Blue landed six times out of twenty.",
      B: "Red landed most often, eight times. Blue landed six times out of twenty spins, so the probability of blue is six out of twenty, or three tenths.",
      C: "The table shows that the spinner landed on red eight times, which is the most often. For blue, the experimental probability is the number of blues divided by the total number of spins, so it is six out of twenty, which simplifies to three tenths, or thirty percent. Because this is only twenty spins, the results might change if the class spun the spinner more times.",
    },
    criteria: [
      "I said which color landed most often and how many times.",
      "I said the number of blues out of the total spins.",
      "I connected the numbers to probability with so or because.",
    ],
    vocab: [
      [
        "probability",
        "how likely it is that something will happen",
        "probabilidad: qué tan posible es que algo suceda",
      ],
      [
        "experimental probability",
        "a probability based on the results of an experiment",
        "probabilidad experimental: una probabilidad basada en los resultados de un experimento",
      ],
      [
        "out of",
        "a way to compare a part to the whole",
        "de cada: una forma de comparar una parte con el total",
      ],
    ],
    frames: [
      "___ landed the most, ___ times.",
      "The spinner landed on blue ___ times out of ___ spins.",
      "The probability of blue is ___ out of ___, so ___.",
    ],
    wida: ["Explain: describe experimental probability", "Use fractions and out of in spoken math"],
    es: [
      "Describir la probabilidad experimental a partir de una tabla de resultados",
      "Mira la tabla de resultados de la ruleta. Planea tu respuesta y luego grábate.",
    ],
    correct:
      "Strong answer. You named the most common color and used blue's count out of the total spins to explain probability.",
    hint: "Add up all the spins to find the total. Then compare the number of blue results to that total.",
  },
  {
    id: "s-b-freezer-lab-partners",
    level: "B",
    gw: "g6-topic",
    strand: "Explain with data",
    title: "Lab Partners: Which Liquid Dropped the Most?",
    skill: "Using integers to compare temperature changes in a science role-play",
    dir: "Look at the table of freezer temperatures. Plan what to say to your lab partner, then record your role-play.",
    q: 'Role-play: You and your lab partner put three liquids in a freezer. Your partner asks, "Which liquid dropped the most, and by how many degrees?" Use the table to answer and explain how you counted.',
    table: {
      caption: "Temperatures in degrees Celsius",
      headers: ["Liquid", "Start", "After freezing"],
      rows: [
        ["Water", "6", "-2"],
        ["Salt water", "6", "-4"],
        ["Juice", "6", "-1"],
      ],
    },
    focus: [
      "the liquid that dropped the most",
      "the start and end temperatures, using negative",
      "how many degrees it dropped",
      "how you counted from the start to the end",
    ],
    models: {
      A: "Salt water dropped the most. It went from six degrees to negative four degrees.",
      B: "Salt water dropped the most. It started at six degrees and ended at negative four degrees, so it dropped ten degrees. I counted six degrees down to zero and four more below zero.",
      C: "I think salt water dropped the most. It started at six degrees Celsius and ended at negative four degrees, so I counted six degrees down to zero and four more below zero, which is ten degrees in all. Water dropped from six to negative two, a change of eight degrees, and juice dropped to negative one, a change of seven degrees. So salt water dropped two degrees more than water and three degrees more than juice.",
    },
    criteria: [
      "I named the liquid that dropped the most.",
      "I said the start and end temperatures and used the word negative.",
      "I explained how I counted the number of degrees.",
    ],
    vocab: [
      ["drop", "to go down to a lower number", "bajar: ir a un número menor"],
      ["negative", "a number less than zero", "negativo: un número menor que cero"],
      [
        "change",
        "the difference between a starting number and an ending number",
        "cambio: la diferencia entre un número inicial y un número final",
      ],
    ],
    frames: [
      "___ dropped the most. It started at ___ and ended at ___.",
      "I counted ___ degrees down to zero and ___ more below zero.",
      "___ dropped ___ degrees more than ___.",
    ],
    wida: ["Explain: compare temperature changes", "Use integer language in a science role-play"],
    es: [
      "Usar números enteros para comparar cambios de temperatura en un juego de roles de ciencias",
      "Mira la tabla de temperaturas del congelador. Planea qué le dirás a tu compañero o compañera de laboratorio y luego graba tu juego de roles.",
    ],
    correct:
      "Good lab talk. You used the start and end temperatures, including a negative number, to find how far the liquid dropped.",
    hint: "For each liquid, think about how far the temperature moved from the start to the end. Remember that it crossed zero.",
  },
  {
    id: "s-b-directions-town-map",
    level: "B",
    strand: "Give directions",
    title: "Give Directions from the School",
    skill: "Giving clear step-by-step walking directions with order words and turns",
    dir: "Look at the table of walking routes. Plan your directions, then record yourself.",
    q: "Role-play: A visitor at the school asks your partner how to get to the library. Your partner asks you to explain. Give step-by-step directions and tell how many blocks in all.",
    table: {
      caption: "Walking routes from the school",
      headers: ["Place", "Step 1", "Step 2"],
      rows: [
        [
          "Library",
          "Walk east on Maple Street for 2 blocks.",
          "Turn left on River Road and walk 3 blocks.",
        ],
        [
          "Park",
          "Walk south on Birch Street for 1 block.",
          "Turn right on Pine Street and walk 4 blocks.",
        ],
        [
          "Museum",
          "Walk east on Maple Street for 4 blocks.",
          "Turn right on Oak Street and walk 1 block.",
        ],
      ],
    },
    focus: [
      "order words such as first, next and then",
      "street names and directions",
      "the turn and the number of blocks",
      "the total number of blocks",
    ],
    models: {
      A: "Walk east on Maple Street for two blocks. Then turn left on River Road and walk three blocks. That is five blocks in all.",
      B: "First, walk east on Maple Street for two blocks. Next, turn left on River Road and walk three blocks. Then you will be at the library. That is five blocks in all.",
      C: "To get to the library from the school, first walk east on Maple Street for two blocks. Then turn left onto River Road, so you are walking north, and walk three more blocks. After that, you will arrive at the library. It is five blocks in all, with only one turn.",
    },
    criteria: [
      "I used order words such as first, next and then.",
      "I named both streets and the turn.",
      "I said the number of blocks for each step.",
    ],
    vocab: [
      [
        "block",
        "the distance along one side of a city street between two corners",
        "cuadra: la distancia a lo largo de una calle entre dos esquinas",
      ],
      ["turn", "to change the way you are walking", "doblar: cambiar la dirección en que caminas"],
      [
        "direction",
        "the way you go, such as north, south, east or west",
        "dirección: el camino que sigues, como norte, sur, este u oeste",
      ],
    ],
    frames: [
      "First, walk ___ on ___ for ___ blocks.",
      "Next, turn ___ on ___ and walk ___ blocks.",
      "It is ___ blocks in all.",
    ],
    wida: ["Inform: give step-by-step directions", "Use order words and directions"],
    es: [
      "Dar indicaciones claras paso a paso con palabras de orden y giros",
      "Mira la tabla de rutas a pie. Planea tus indicaciones y luego grábate.",
    ],
    correct:
      "Clear directions. You used order words, street names, the turn and the number of blocks in the right order.",
    hint: "Find the Library row in the table. Say Step 1, then Step 2, then add the two block numbers together.",
  },
  {
    id: "s-b-rice-ratio-reply",
    level: "B",
    gw: "g6-topic",
    strand: "Explain your thinking",
    type: "multipleChoice",
    title: "Recipe Ratio: Choose the Best Explanation",
    skill: "Choosing a spoken explanation that scales both parts of a ratio",
    dir: "Read the situation. Choose the best explanation. Then say it aloud in your own words.",
    q: "A rice recipe uses 2 cups of rice for every 3 cups of water. Your partner asks how much water to use with 6 cups of rice. Which explanation is best?",
    opts: [
      "Multiply both amounts by 3, so 6 cups of rice needs 9 cups of water.",
      "Add 4 to both amounts, so 6 cups of rice needs 7 cups of water.",
      "Use the same amount of water, so 6 cups of rice needs 6 cups of water.",
    ],
    why: [
      "Adding the same number to both amounts changes the ratio; it stays the same only when both amounts are multiplied by the same number.",
      "This reply ignores the ratio, because the recipe always uses more cups of water than cups of rice.",
    ],
    focus: ["multiply both parts", "the same ratio", "the word so"],
    vocab: [
      ["ratio", "a comparison of two amounts", "razón: una comparación de dos cantidades"],
      [
        "multiply",
        "to add the same number again and again",
        "multiplicar: sumar el mismo número una y otra vez",
      ],
    ],
    frames: ["Multiply both amounts by ___.", "___ cups of rice needs ___ cups of water."],
    wida: ["Explain: choose a ratio explanation", "Use multiply and so in spoken math"],
    es: [
      "Elegir una explicación oral que multiplique las dos partes de una razón",
      "Lee la situación. Elige la mejor explicación. Luego dila en voz alta con tus propias palabras.",
    ],
    correct:
      "Yes. To keep a ratio the same, you multiply both parts by the same number and say how the new amounts match.",
    hint: "Ask how many times bigger the rice amount became. Then decide which reply changes the water the same way.",
  },
  {
    id: "s-c-taxi-fare-equation",
    level: "C",
    gw: "g67-task",
    strand: "Explain your thinking",
    title: "Explain a Taxi Fare Equation",
    skill: "Writing a two-step equation from a table and explaining the solution step by step",
    dir: "Look at the table about a taxi fare. Plan your explanation, then record yourself solving the problem aloud.",
    q: "A taxi charges a fixed fee plus a price for each mile. Use the table to explain how many miles the ride was. Say your equation, solve it one step at a time, and check your answer.",
    table: {
      caption: "Taxi fare facts",
      headers: ["Fixed fee", "Cost per mile", "Total fare"],
      rows: [["$3", "$2", "$17"]],
    },
    focus: [
      "what the variable stands for",
      "the equation that matches the situation",
      "each step and the inverse operation it uses",
      "a check by substituting your answer",
    ],
    models: {
      A: "The ride was seven miles. Two times seven is fourteen, and fourteen plus three is seventeen.",
      B: "I wrote the equation two m plus three equals seventeen. I subtracted three from both sides to get two m equals fourteen. Then I divided both sides by two, so m equals seven miles.",
      C: "Let m be the number of miles. The fare is the fixed fee plus two dollars for each mile, so the equation is two m plus three equals seventeen. First I subtracted three from both sides, because subtraction undoes the fixed fee, which gave two m equals fourteen. Then I divided both sides by two, so m equals seven. To check, two times seven is fourteen, and fourteen plus three is seventeen, which matches the total fare. The ride was seven miles.",
    },
    criteria: [
      "I said what the variable stands for and gave an equation.",
      "I explained each step and why I did it.",
      "I checked my answer by putting it back into the equation.",
      "I said the answer with the unit, miles.",
    ],
    vocab: [
      [
        "variable",
        "a letter that stands for an unknown number",
        "variable: una letra que representa un número desconocido",
      ],
      [
        "fixed fee",
        "a cost that stays the same no matter what",
        "tarifa fija: un costo que no cambia sin importar nada",
      ],
      [
        "check",
        "to put the answer back in the problem to see if it works",
        "comprobar: volver a poner la respuesta en el problema para ver si funciona",
      ],
    ],
    frames: [
      "Let ___ be ___.",
      "I subtracted ___ from both sides because ___.",
      "To check, ___ times ___ plus ___ equals ___, so ___.",
    ],
    wida: ["Explain: justify the steps of a solution", "Use inverse-operation language"],
    es: [
      "Escribir una ecuación de dos pasos a partir de una tabla y explicar la solución paso a paso",
      "Mira la tabla de una tarifa de taxi. Planea tu explicación y luego grábate resolviendo el problema en voz alta.",
    ],
    correct:
      "Thorough explanation. You set up an equation from the table, solved it in order, and checked the answer.",
    hint: "The fixed fee is paid once, and the mile price is paid for every mile. Write that as an equation first, then undo the extra fee before you divide.",
  },
  {
    id: "s-c-gift-box-volume",
    level: "C",
    gw: "g67-task",
    strand: "Present to a group",
    title: "Present the Best Gift Box",
    skill: "Presenting volume calculations and a recommendation from a table of box sizes",
    dir: "Look at the table of gift boxes. Plan a short presentation for the shop owner, then record yourself.",
    q: "Give a short presentation to a shop owner. Tell the volume of each box, say which box holds the most, and explain how you found volume.",
    table: {
      caption: "Gift boxes (centimeters)",
      headers: ["Box", "Length", "Width", "Height"],
      rows: [
        ["A", "5", "4", "3"],
        ["B", "6", "3", "4"],
        ["C", "4", "4", "5"],
      ],
    },
    focus: [
      "how to find volume (length times width times height)",
      "the volume of each box with the unit",
      "a comparison between the boxes",
      "a clear recommendation",
    ],
    models: {
      A: "Box C holds the most. Its volume is eighty cubic centimeters.",
      B: "To find volume, I multiply length, width and height. Box A is sixty cubic centimeters, Box B is seventy-two, and Box C is eighty. Box C holds the most, so I recommend it.",
      C: "Good morning. Volume is length times width times height. Box A is five by four by three, which is sixty cubic centimeters. Box B is six by three by four, which is seventy-two cubic centimeters. Box C is four by four by five, which is eighty cubic centimeters. Box C holds the most, eight more than Box B and twenty more than Box A, so I recommend it for the largest gifts.",
    },
    criteria: [
      "I explained how to find volume.",
      "I said the volume of all three boxes with the unit.",
      "I compared the boxes and ended with a clear recommendation.",
    ],
    vocab: [
      [
        "volume",
        "the amount of space inside a solid shape",
        "volumen: la cantidad de espacio dentro de una figura sólida",
      ],
      [
        "cubic centimeters",
        "the unit used to measure volume",
        "centímetros cúbicos: la unidad que se usa para medir el volumen",
      ],
      ["recommend", "to suggest the best choice", "recomendar: sugerir la mejor opción"],
    ],
    frames: [
      "To find volume, I multiply ___, ___ and ___.",
      "Box ___ has a volume of ___ cubic centimeters.",
      "I recommend Box ___ because ___.",
    ],
    wida: ["Inform: present measurements to a group", "Use volume vocabulary and recommend"],
    es: [
      "Presentar cálculos de volumen y una recomendación a partir de una tabla de tamaños de cajas",
      "Mira la tabla de cajas de regalo. Planea una presentación corta para el dueño de la tienda y luego grábate.",
    ],
    correct:
      "Convincing presentation. You found each volume with the right unit, compared the boxes, and made a clear recommendation.",
    hint: "Multiply the three measurements for one box at a time. Write each answer down before you compare them.",
  },
  {
    id: "s-c-cashier-percent-savings",
    level: "C",
    gw: "g67-task",
    strand: "Explain with data",
    title: "Cashier Role-Play: How Much Will I Save?",
    skill: "Explaining percent discounts, total savings and the final price in a store role-play",
    dir: "Look at the sale table. Plan what you will say as the cashier, then record your role-play.",
    q: "Role-play: You are the cashier. Your partner is a customer who wants the backpack and the headphones. Explain how much each item is discounted, how much the customer saves in all, and what the total price is.",
    table: {
      caption: "Weekend sale",
      headers: ["Item", "Regular price", "Discount"],
      rows: [
        ["Backpack", "$40", "25% off"],
        ["Sneakers", "$60", "10% off"],
        ["Headphones", "$25", "20% off"],
      ],
    },
    focus: [
      "the discount in dollars for each item",
      "the sale price of each item",
      "the total savings",
      "the total price to pay and a polite closing",
    ],
    models: {
      A: "The backpack is ten dollars off. The headphones are five dollars off. You pay fifty dollars.",
      B: "Twenty-five percent of forty dollars is ten dollars, so the backpack costs thirty dollars. Twenty percent of twenty-five dollars is five dollars, so the headphones cost twenty dollars. You save fifteen dollars, and your total is fifty dollars.",
      C: "Welcome. For the backpack, twenty-five percent of forty dollars is ten dollars, so you save ten dollars and the sale price is thirty dollars. For the headphones, twenty percent of twenty-five dollars is five dollars, so you save five dollars and the sale price is twenty dollars. Together you save fifteen dollars, so instead of sixty-five dollars, your total is fifty dollars. Would you like a bag?",
    },
    criteria: [
      "I said the dollar discount for the backpack and the headphones.",
      "I explained how I found a percent of a price.",
      "I said the total savings and the total price to pay.",
      "I used polite store language.",
    ],
    vocab: [
      [
        "discount",
        "an amount taken off the regular price",
        "descuento: una cantidad que se quita del precio normal",
      ],
      [
        "sale price",
        "the price after the discount",
        "precio de oferta: el precio después del descuento",
      ],
      ["total", "all the amounts added together", "total: todas las cantidades sumadas"],
    ],
    frames: [
      "___ percent of ___ dollars is ___ dollars.",
      "You save ___ dollars on the ___, so the sale price is ___ dollars.",
      "Together you save ___ dollars, so your total is ___ dollars.",
    ],
    wida: [
      "Explain: calculate and explain a percent discount",
      "Use polite language in a store role-play",
    ],
    es: [
      "Explicar descuentos en porcentaje, el ahorro total y el precio final en un juego de roles de tienda",
      "Mira la tabla de la oferta. Planea lo que dirás como cajero o cajera y luego graba tu juego de roles.",
    ],
    correct:
      "Excellent cashier talk. You found each percent of a price, added the savings, and stated the final total.",
    hint: "Find the percent of the regular price for one item at a time. Subtract it from the price, then add the two sale prices.",
  },
  {
    id: "s-c-library-sunday-town-meeting",
    level: "C",
    gw: "g78-task",
    strand: "Argue with data",
    title: "Town Meeting: Sunday Hours at the Library",
    skill: "Arguing a position at a town meeting with evidence from a chart and answering a worry",
    dir: "Look at the bar chart of library visits. Plan your speech, then record your role-play.",
    q: "Role-play: You are speaking at a town meeting. The mayor, your partner, asks whether the library should open on Sundays. Take a position, support it with evidence from the chart, and answer one worry about cost.",
    chart: {
      kind: "bar",
      title: "Average Library Visits per Day",
      unit: "visits",
      data: [
        { label: "Monday", value: 85 },
        { label: "Tuesday", value: 90 },
        { label: "Wednesday", value: 110 },
        { label: "Thursday", value: 95 },
        { label: "Friday", value: 130 },
        { label: "Saturday", value: 210 },
      ],
    },
    focus: [
      "a clear position",
      "evidence with numbers from the chart",
      "reasoning that connects the evidence to Sunday",
      "a respectful answer to the worry about cost",
    ],
    models: {
      A: "The library should open on Sundays. Saturday had the most visits, two hundred ten.",
      B: "I think the library should open on Sundays. The chart shows Saturday had the most visits, two hundred ten, which is much more than Friday's one hundred thirty. So many people use the library on weekends, and Sunday would help them too.",
      C: "I support opening the library on Sundays. The chart shows that weekend demand is high: Saturday had two hundred ten visits, which is almost double Wednesday's one hundred ten and eighty more than Friday's. Since so many people visit when they are free, Sunday hours would probably be busy too. Some people worry about the cost of staff. That is a fair concern, but one chart cannot predict Sundays, so the library could try Sunday hours for a few months and check the visit numbers again.",
    },
    criteria: [
      "I stated my position clearly.",
      "I used at least two numbers from the chart as evidence.",
      "I explained why the evidence supports my position.",
      "I answered the worry about cost respectfully.",
    ],
    vocab: [
      [
        "evidence",
        "facts or numbers that support an idea",
        "evidencia: datos o números que apoyan una idea",
      ],
      [
        "demand",
        "how many people want or use something",
        "demanda: cuántas personas quieren o usan algo",
      ],
      [
        "worry",
        "a concern about something that might go wrong",
        "preocupación: algo que podría salir mal y inquieta",
      ],
    ],
    frames: [
      "I support ___ because the chart shows ___.",
      "___ had ___ visits, which is ___ more than ___.",
      "Some people worry about ___, but ___.",
    ],
    wida: ["Argue: support a position with data", "Respond to a concern respectfully"],
    es: [
      "Argumentar una postura en una reunión del pueblo con evidencia de una gráfica y responder a una preocupación",
      "Mira la gráfica de barras de visitas a la biblioteca. Planea tu discurso y luego graba tu juego de roles.",
    ],
    correct:
      "Persuasive speech. You took a position, used numbers from the chart as evidence, and answered the worry about cost.",
    hint: "Find the day with the most visits and compare it to the weekdays. Then ask what that pattern tells you about people's free time.",
  },
  {
    id: "s-c-egypt-mesopotamia-compare",
    level: "C",
    strand: "Compare",
    title: "Compare Two Ancient River Civilizations",
    skill:
      "Comparing two ancient civilizations from a table with similarity and difference language",
    dir: "Look at the table about two ancient civilizations. Plan your comparison, then record yourself.",
    q: "Tell your partner how Ancient Egypt and Ancient Mesopotamia were alike and different. Use the table to give at least one similarity and two differences.",
    table: {
      caption: "Two ancient civilizations",
      headers: ["Feature", "Ancient Egypt", "Ancient Mesopotamia"],
      rows: [
        ["River", "Nile River", "Tigris and Euphrates rivers"],
        ["Writing", "hieroglyphs", "cuneiform"],
        [
          "Government",
          "a pharaoh ruled one kingdom",
          "separate city-states, each with its own ruler",
        ],
        ["Main crops", "wheat, barley and flax", "barley and wheat"],
      ],
    },
    focus: [
      "a similarity, using both or like",
      "two differences, using however or while",
      "specific details from the table",
      "a closing sentence about the rivers",
    ],
    models: {
      A: "Both civilizations grew barley and wheat. Egypt had a pharaoh. Mesopotamia had city-states.",
      B: "Both civilizations grew barley and wheat near rivers. However, Egypt had one pharaoh, while Mesopotamia had separate city-states. Egypt wrote with hieroglyphs, but Mesopotamia wrote with cuneiform.",
      C: "Ancient Egypt and Ancient Mesopotamia were alike because both grew barley and wheat, and both depended on rivers. They were different in how they were ruled: a pharaoh ruled one kingdom in Egypt, while Mesopotamia had separate city-states with their own rulers. They also used different writing, since Egyptians wrote hieroglyphs and Mesopotamians wrote cuneiform. In both places, the rivers gave farmers water, which helped each civilization grow.",
    },
    criteria: [
      "I gave at least one similarity with both or like.",
      "I gave two differences with however or while.",
      "I used details from the table.",
    ],
    vocab: [
      [
        "civilization",
        "a large group of people with cities, laws and writing",
        "civilización: un grupo grande de personas con ciudades, leyes y escritura",
      ],
      [
        "city-state",
        "a city that governs itself and the land around it",
        "ciudad-estado: una ciudad que se gobierna a sí misma y a la tierra a su alrededor",
      ],
      [
        "pharaoh",
        "the king or ruler of ancient Egypt",
        "faraón: el rey o gobernante del antiguo Egipto",
      ],
    ],
    frames: [
      "Both ___ and ___ ___.",
      "___ had ___, while ___ had ___.",
      "However, ___ used ___, but ___ used ___.",
    ],
    wida: [
      "Compare: describe similarities and differences",
      "Use contrast connectors in a spoken comparison",
    ],
    es: [
      "Comparar dos civilizaciones antiguas con una tabla usando lenguaje de semejanzas y diferencias",
      "Mira la tabla sobre dos civilizaciones antiguas. Planea tu comparación y luego grábate.",
    ],
    correct:
      "Strong comparison. You gave a similarity and two differences with table details and clear connecting words.",
    hint: "Look for a row where the two columns are almost the same. Then find two rows where they are clearly different.",
  },
];

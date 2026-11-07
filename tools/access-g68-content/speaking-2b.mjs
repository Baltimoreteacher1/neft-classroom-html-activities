// Grades 6-8 publisher pass, Speaking batch 2b: extended explanations and role-plays, Level C. Original prompts.
export default [
  {
    id: "s-c-best-sale-table",
    level: "C",
    gw: "g78-topic",
    strand: "Explain with data",
    title: "Which Jacket Is the Best Deal?",
    skill: "Comparing sale prices after percent discounts and recommending the best deal",
    dir: "Look at the table of three jacket deals. Plan your recommendation, then record yourself.",
    q: "Your cousin wants to buy a jacket. Explain which store has the lowest price after the discount, and show how you found each sale price.",
    table: {
      caption: "Jacket deals",
      headers: ["Store", "Original price", "Discount"],
      rows: [
        ["Store A", "$80", "25% off"],
        ["Store B", "$70", "10% off"],
        ["Store C", "$65", "No discount"],
      ],
    },
    focus: ["each sale price", "how you found a discount", "a comparison", "a recommendation"],
    models: {
      A: "Store A is the best deal. The jacket costs sixty dollars. Store B costs sixty-three dollars.",
      B: "At Store A, twenty-five percent of eighty is twenty, so the sale price is sixty dollars. At Store B, ten percent of seventy is seven, so the price is sixty-three dollars. Store C is sixty-five dollars. Store A is the cheapest.",
      C: "To compare fairly, I found the sale price at each store. At Store A, twenty-five percent of eighty dollars is twenty dollars, so the jacket costs sixty. At Store B, ten percent of seventy is seven, so it costs sixty-three. Store C has no discount, so it costs sixty-five. Even though Store A has the highest original price, its larger discount makes it the lowest final price, so I recommend Store A.",
    },
    criteria: [
      "I said the sale price for all three stores.",
      "I showed how I found at least one discount.",
      "I gave a clear recommendation with a reason.",
    ],
    vocab: [
      [
        "discount",
        "an amount taken off the price",
        "descuento: una cantidad que se resta del precio",
      ],
      [
        "percent of",
        "a part out of one hundred of a number",
        "por ciento de: una parte de cada cien de un número",
      ],
    ],
    frames: [
      "Twenty-five percent of ___ is ___.",
      "The sale price is ___.",
      "I recommend ___ because ___.",
    ],
    wida: [
      "Explain: justify a recommendation with calculations",
      "Use percent and comparison language",
    ],
    es: [
      "Comparar precios de oferta después de descuentos porcentuales y recomendar la mejor oferta",
      "Mira la tabla de tres ofertas de chaquetas. Planea tu recomendación y luego grábate.",
    ],
    correct:
      "Strong recommendation. You found each sale price and used the numbers to justify your choice.",
    hint: "Find the discount in dollars first, then subtract it from the original price.",
  },
  {
    id: "s-c-fraction-error-roleplay",
    level: "C",
    gw: "g67-task",
    strand: "Explain your thinking",
    title: "Find the Error in 2/3 + 1/4",
    skill: "Politely explaining an error in a classmate's fraction work",
    dir: "Plan how you will explain the mistake. Then record your role-play.",
    q: "Role-play: Your partner says that 2/3 + 1/4 = 3/7 because 2 + 1 = 3 and 3 + 4 = 7. Politely explain the mistake and show the correct way to add.",
    focus: [
      "something kind about your partner's work",
      "why adding the denominators is a mistake",
      "the common denominator 12",
      "the correct answer 11/12",
    ],
    models: {
      A: "I see why you did that. But you cannot add the bottom numbers. I change both to twelfths. The answer is eleven twelfths.",
      B: "I understand your idea, but we cannot add the denominators. First, I find a common denominator, which is twelve. Two thirds is eight twelfths and one fourth is three twelfths. Eight twelfths plus three twelfths is eleven twelfths.",
      C: "I can see how you got that answer, and adding across feels natural. However, the denominators tell the size of each piece, so we cannot add them. We need pieces of the same size first. A common denominator for three and four is twelve. Two thirds equals eight twelfths, and one fourth equals three twelfths. Adding the numerators gives eleven twelfths. We can also check: three sevenths is less than one half, but two thirds alone is already more than one half, so three sevenths cannot be right.",
    },
    criteria: [
      "I said something kind before I pointed out the mistake.",
      "I explained why the denominators cannot be added.",
      "I showed the correct steps and answer.",
    ],
    vocab: [
      [
        "denominator",
        "the bottom number of a fraction",
        "denominador: el número de abajo de una fracción",
      ],
      [
        "common denominator",
        "a number that both denominators divide into",
        "denominador común: un número en el que caben ambos denominadores",
      ],
      [
        "numerator",
        "the top number of a fraction",
        "numerador: el número de arriba de una fracción",
      ],
    ],
    frames: [
      "I can see how you got that, but ___.",
      "First, I find a common denominator, which is ___.",
      "So the answer is ___.",
    ],
    wida: ["Argue: explain an error respectfully", "Use fraction vocabulary precisely"],
    es: [
      "Explicar con respeto un error en el trabajo con fracciones de un compañero",
      "Planea cómo vas a explicar el error. Luego graba tu juego de roles.",
    ],
    correct:
      "Good critique. You were kind, explained why the method fails, and showed the correct steps.",
    hint: "Think about what the denominator tells you. Can you add pieces that are different sizes?",
  },
  {
    id: "s-c-recycling-claim",
    level: "C",
    gw: "g78-task",
    strand: "Argue with data",
    title: "Does the Data Support the Claim?",
    skill: "Evaluating a claim with a data display, including data that does not fit",
    dir: "Look at the bar graph of a school's recycling. Plan, then record your evaluation.",
    q: 'A student claims, "Our school\'s recycling has steadily increased since January." Explain whether the graph fully supports this claim.',
    chart: {
      kind: "bar",
      title: "Pounds of Recycling Collected",
      unit: "pounds",
      data: [
        { label: "Jan", value: 120 },
        { label: "Feb", value: 150 },
        { label: "Mar", value: 135 },
        { label: "Apr", value: 180 },
      ],
    },
    focus: ["numbers from the graph", "the month that does not fit", "a more accurate claim"],
    models: {
      A: "The claim is mostly true. January was one hundred twenty and April was one hundred eighty. But March went down.",
      B: "The graph partly supports the claim. Recycling went from one hundred twenty pounds in January to one hundred eighty in April. However, it did not increase every month, because March was lower than February.",
      C: "The graph partly supports the claim, but not fully. Overall, recycling grew from one hundred twenty pounds in January to one hundred eighty in April, which is an increase of sixty pounds. However, the word steadily is not accurate, because March dropped to one hundred thirty-five pounds from one hundred fifty in February. A more accurate claim would be that recycling increased overall from January to April, with one decrease in March.",
    },
    criteria: [
      "I used at least two numbers from the graph.",
      "I noticed that March does not fit the word steadily.",
      "I suggested a more accurate claim.",
    ],
    vocab: [
      [
        "steadily",
        "in a regular way without stopping",
        "constantemente: de forma regular sin detenerse",
      ],
      ["overall", "when you look at everything together", "en general: cuando miras todo junto"],
      ["support", "to give evidence for an idea", "apoyar: dar evidencia a favor de una idea"],
    ],
    frames: [
      "The graph partly supports the claim because ___.",
      "However, ___ does not fit because ___.",
      "A more accurate claim would be ___.",
    ],
    wida: ["Argue: evaluate a claim against data", "Qualify a claim with however"],
    es: [
      "Evaluar una afirmación con una gráfica de datos, incluidos los datos que no encajan",
      "Mira la gráfica de barras sobre el reciclaje de una escuela. Planea y luego graba tu evaluación.",
    ],
    correct:
      "Careful reasoning. You used the numbers, spotted the month that does not fit, and made the claim more accurate.",
    hint: "Look at each month in order. Does the bar get taller every time?",
  },
  {
    id: "s-c-skate-park-townhall",
    level: "C",
    gw: "g78-task",
    strand: "Argue with data",
    title: "Town Hall: A New Skate Park",
    skill: "Presenting a position with reasons and answering a concern",
    dir: "Choose a side and plan. Then record your role-play at a town hall meeting.",
    q: "Role-play: Your partner is a city council member. Say whether the city should build a skate park on an empty lot, give two reasons, and respond to one concern about noise or cost.",
    focus: ["a clear position", "two reasons", "a response to a concern", "a respectful tone"],
    models: {
      A: "I think the city should build a skate park. Young people need a safe place to skate. A park can be near homes. Noise can be controlled.",
      B: "I believe the city should build a skate park. First, it gives young people a safe place to exercise. Second, it keeps them off busy streets. I understand that noise is a concern, but the park can have hours and trees around it to reduce the sound.",
      C: "I am in favor of building a skate park on the empty lot. First, it would give young people a safe, supervised place to exercise instead of skating on busy streets. Second, it would give the neighborhood a place to meet, which strengthens the community. I understand the concern about cost, but the park could be built in phases, and it would replace an empty lot that currently provides no benefit. Thank you for considering my position.",
    },
    criteria: [
      "I stated my position clearly.",
      "I gave two different reasons.",
      "I responded to a concern respectfully.",
    ],
    vocab: [
      [
        "council member",
        "a person elected to help run a city",
        "concejal: una persona elegida para ayudar a dirigir una ciudad",
      ],
      ["concern", "a worry about something", "preocupación: una inquietud sobre algo"],
      ["in favor of", "supporting an idea", "a favor de: apoyando una idea"],
    ],
    frames: [
      "I am in favor of ___ because ___.",
      "First, ___. Second, ___.",
      "I understand the concern about ___, but ___.",
    ],
    wida: ["Argue: take a position and answer a concern", "Use formal and respectful language"],
    es: [
      "Presentar una postura con razones y responder a una preocupación",
      "Elige un lado y planea. Luego graba tu juego de roles en una reunión del ayuntamiento.",
    ],
    correct:
      "Persuasive and polite. You stated a position, gave two reasons, and answered a concern.",
    hint: "Choose your position first. Then think of two benefits and one worry someone might have.",
  },
  {
    id: "s-c-rectangle-coordinates",
    level: "C",
    gw: "g6-topic",
    strand: "Explain with data",
    title: "Describe a Shape from Its Points",
    skill: "Describing a figure on the coordinate plane and finding its area and perimeter",
    dir: "Look at the table of four points on a coordinate plane. Plan, then record your explanation.",
    q: "The four points are the corners of a shape. Describe the shape, tell how long each side is, and explain how to find its perimeter and area.",
    table: {
      caption: "Corners of a shape",
      headers: ["Point", "x", "y"],
      rows: [
        ["A", "1", "1"],
        ["B", "5", "1"],
        ["C", "5", "4"],
        ["D", "1", "4"],
      ],
    },
    focus: ["the name of the shape", "side lengths from the coordinates", "perimeter", "area"],
    models: {
      A: "The shape is a rectangle. It is four units long and three units wide. The area is twelve square units.",
      B: "The points make a rectangle. Side A to B is four units because the x values go from one to five. Side B to C is three units. The perimeter is fourteen units and the area is twelve square units.",
      C: "These four points form a rectangle. Points A and B have the same y value, so the side between them is horizontal, and its length is the difference between the x values: five minus one is four units. Points B and C have the same x value, so that side is vertical, with length four minus one, which is three units. The perimeter is four plus three plus four plus three, or fourteen units. The area is four times three, which is twelve square units.",
    },
    criteria: [
      "I named the shape.",
      "I explained how I found the side lengths from the coordinates.",
      "I gave the perimeter and the area with correct units.",
    ],
    vocab: [
      [
        "coordinates",
        "numbers that tell the position of a point",
        "coordenadas: números que indican la posición de un punto",
      ],
      ["horizontal", "going straight across", "horizontal: que va de lado a lado"],
      ["vertical", "going straight up and down", "vertical: que va de arriba abajo"],
    ],
    frames: [
      "Points A and B have the same ___ value, so ___.",
      "The length is the difference ___.",
      "The area is ___ times ___.",
    ],
    wida: ["Explain: describe a figure using coordinates", "Use geometry vocabulary precisely"],
    es: [
      "Describir una figura en el plano de coordenadas y hallar su área y su perímetro",
      "Mira la tabla de cuatro puntos en un plano de coordenadas. Planea y luego graba tu explicación.",
    ],
    correct:
      "Precise explanation. You used the coordinates to find the side lengths, then found the perimeter and area.",
    hint: "Look for the points with the same y value or the same x value. Subtract the other coordinate to find a length.",
  },
  {
    id: "s-c-city-growth-table",
    level: "C",
    gw: "g78-task",
    strand: "Explain with data",
    title: "Which City Grew More?",
    skill: "Comparing growth by amount and by percent from a table",
    dir: "Look at the table of three cities. Plan, then record your comparison.",
    q: "Compare how much Riverton and Lakeview grew. Explain why the percent growth can be different even when the amount of growth is the same.",
    table: {
      caption: "City populations",
      headers: ["City", "Population in 2010", "Population in 2020"],
      rows: [
        ["Riverton", "12,000", "15,000"],
        ["Lakeview", "20,000", "23,000"],
        ["Hillcrest", "8,000", "9,200"],
      ],
    },
    focus: [
      "the growth amount for each city",
      "the percent growth for each city",
      "an explanation of why they differ",
    ],
    models: {
      A: "Both cities grew by three thousand. But Riverton started smaller, so its percent is bigger.",
      B: "Riverton grew from twelve thousand to fifteen thousand, which is three thousand. Lakeview also grew by three thousand. But Riverton's percent growth is twenty-five percent, and Lakeview's is fifteen percent, because Riverton started with fewer people.",
      C: "Riverton and Lakeview both grew by three thousand people. However, the percent growth is different because percent compares the growth to the starting population. Riverton grew three thousand out of twelve thousand, which is twenty-five percent. Lakeview grew three thousand out of twenty thousand, which is fifteen percent. The same increase is a bigger fraction of a smaller starting number, so Riverton grew faster in percent terms, even though both added the same number of people.",
    },
    criteria: [
      "I said the growth amount for both cities.",
      "I gave the percent growth for both cities.",
      "I explained why the percent can differ with the same amount.",
    ],
    vocab: [
      [
        "percent growth",
        "how much something grew compared with where it started",
        "crecimiento porcentual: cuánto creció algo comparado con su punto de partida",
      ],
      [
        "population",
        "the number of people who live in a place",
        "población: el número de personas que viven en un lugar",
      ],
      [
        "starting amount",
        "the number you begin with",
        "cantidad inicial: el número con el que empiezas",
      ],
    ],
    frames: [
      "Both cities grew by ___.",
      "Riverton's percent growth is ___ because ___.",
      "A percent compares the growth with the ___ amount.",
    ],
    wida: ["Explain: compare using amounts and percents", "Use comparison and contrast language"],
    es: [
      "Comparar el crecimiento por cantidad y por porcentaje a partir de una tabla",
      "Mira la tabla de tres ciudades. Planea y luego graba tu comparación.",
    ],
    correct:
      "Excellent comparison. You separated the amount of growth from the percent and explained why they can differ.",
    hint: "Subtract 2010 from 2020 for each city. Then ask what fraction of the starting number that growth is.",
  },
  {
    id: "s-c-survey-presentation",
    level: "C",
    gw: "g78-task",
    strand: "Present to a group",
    title: "Present Your Survey Results",
    skill: "Presenting survey data with percents to a small group",
    dir: "Look at the bar graph of a survey. Plan a short presentation, then record it.",
    q: "Role-play: Your partner is a classmate in your small group. Present the survey results, say which subject was most popular, and use at least one percent.",
    chart: {
      kind: "bar",
      title: "Favorite Subject (50 students)",
      unit: "students",
      data: [
        { label: "Math", value: 14 },
        { label: "Science", value: 16 },
        { label: "Art", value: 12 },
        { label: "PE", value: 8 },
      ],
    },
    focus: [
      "the purpose of the survey",
      "the most popular subject with its number",
      "a percent",
      "a closing thought",
    ],
    models: {
      A: "We asked fifty students. Science was the most popular. Sixteen students chose it. Physical education was the least popular.",
      B: "We surveyed fifty students about their favorite subject. Science was the most popular, with sixteen votes, which is thirty-two percent. Physical education was the least popular, with eight votes.",
      C: "For our survey, we asked fifty students to choose a favorite subject. Science was the most popular, with sixteen votes, or thirty-two percent of the group. Math was close behind with fourteen votes, which is twenty-eight percent. Physical education received the fewest votes, only eight, or sixteen percent. This suggests that more students prefer science, but the results are close enough that we should survey more students before drawing a strong conclusion.",
    },
    criteria: [
      "I explained what the survey was about.",
      "I named the most popular subject and its number.",
      "I used at least one percent correctly.",
    ],
    vocab: [
      [
        "survey",
        "a set of questions asked to many people",
        "encuesta: un conjunto de preguntas hechas a muchas personas",
      ],
      ["percent", "a part out of one hundred", "por ciento: una parte de cada cien"],
      ["results", "what you found out", "resultados: lo que descubriste"],
    ],
    frames: [
      "We surveyed ___ students about ___.",
      "___ was the most popular, with ___ votes, which is ___ percent.",
      "This suggests that ___.",
    ],
    wida: ["Inform: present data to a group", "Use percent language in a short presentation"],
    es: [
      "Presentar resultados de una encuesta con porcentajes a un grupo pequeño",
      "Mira la gráfica de barras de una encuesta. Planea una presentación corta y luego grábala.",
    ],
    correct:
      "Clear presentation. You named the topic, the most popular choice, and used a percent.",
    hint: "To find a percent, divide the votes by fifty and think of the answer out of one hundred. Sixteen out of fifty is the same as thirty-two out of one hundred.",
  },
  {
    id: "s-c-interview-method",
    level: "C",
    gw: "g67-task",
    strand: "Explain your thinking",
    title: "Interview a Classmate About a Method",
    skill: "Asking and answering questions about a classmate's problem-solving method",
    dir: "Plan your questions and your answers. Then record both parts of the interview.",
    q: "Role-play: Your partner solved 3x + 2 = 14 and got x = 4. Interview your partner about each step, then answer your partner's questions about how you would check it.",
    focus: [
      "two questions about the steps",
      "the inverse operations",
      "a check by substitution",
      "polite follow-up questions",
    ],
    models: {
      A: "What did you do first? I subtracted two from both sides. Then I divided by three. To check, I put four in the equation.",
      B: "What did you do first, and why? I subtracted two from both sides to undo the plus two. Then I divided both sides by three to get x equals four. To check, I replace x with four. Three times four plus two is fourteen, so it works.",
      C: "Could you walk me through your first step? I subtracted two from both sides, because subtraction undoes addition, and that left three x equals twelve. Why did you divide by three? Division undoes multiplication, so dividing both sides by three gives x equals four. To check, I substitute four for x: three times four is twelve, and twelve plus two is fourteen, which matches the equation. So the solution is correct.",
    },
    criteria: [
      "I asked at least two questions about the steps.",
      "I explained each step with an inverse operation.",
      "I checked the answer by substituting it.",
    ],
    vocab: [
      [
        "inverse operation",
        "an operation that undoes another one",
        "operación inversa: una operación que deshace otra",
      ],
      [
        "substitute",
        "to replace a variable with a number",
        "sustituir: reemplazar una variable por un número",
      ],
      [
        "solution",
        "a value that makes an equation true",
        "solución: un valor que hace verdadera una ecuación",
      ],
    ],
    frames: [
      "Could you walk me through ___?",
      "I used ___ to undo ___.",
      "To check, I substitute ___ for ___.",
    ],
    wida: ["Explain: ask and answer questions about a method", "Use inverse-operation vocabulary"],
    es: [
      "Hacer y responder preguntas sobre el método de resolución de un compañero",
      "Planea tus preguntas y tus respuestas. Luego graba las dos partes de la entrevista.",
    ],
    correct:
      "Thoughtful interview. You asked about each step and checked the solution by substitution.",
    hint: "Ask what was done first and why. Then replace x with the answer and see if both sides match.",
  },
];

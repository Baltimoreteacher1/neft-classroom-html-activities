// Grades 6-8 publisher pass, Listening batch 2c: math language, directions and reasoning. Original scripts.
export default [
  {
    id: "l-a-recipe-ratio",
    level: "A",
    strand: "Math talk: ratios and rates",
    title: "A Recipe Ratio",
    skill: "Hearing a ratio in a recipe",
    dir: "Listen to a student read a recipe. Then choose the best answer.",
    q: "For one cup of sugar, how many cups of flour does the recipe use?",
    script:
      "Here is my family's cookie recipe. For every one cup of sugar, we use two cups of flour. The ratio of sugar to flour is one to two. If I want to make a bigger batch, I need to keep that same ratio. So with two cups of sugar, I use four cups of flour. We also add one egg for every two cups of flour, and we bake the cookies for ten minutes.",
    opts: ["Two cups of flour", "One cup of flour", "Four cups of flour"],
    why: [
      "One cup is the amount of sugar, not the amount of flour that goes with it.",
      "Four cups of flour go with two cups of sugar, which is the bigger batch.",
    ],
    vocab: [
      ["ratio", "a comparison of two amounts", "razón: una comparación de dos cantidades"],
      ["batch", "an amount made at one time", "tanda: una cantidad que se prepara de una vez"],
    ],
    frames: [
      "For every ___ cup of sugar, there are ___ cups of flour.",
      "The ratio is ___ to ___.",
    ],
    focus: ["the words for every", "the ratio of sugar to flour", "the bigger batch"],
    correct: "Yes. The recipe uses two cups of flour for every one cup of sugar.",
    hint: "Listen for the words for every. The amount of sugar comes first and the flour comes second.",
    wida: ["Inform: identify a ratio in spoken text", "Notice for every language"],
    es: [
      "Escuchar una razón en una receta",
      "Escucha a un estudiante leer una receta. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-a-plot-the-point",
    level: "A",
    strand: "Directions and procedures",
    title: "Plot the Point",
    skill: "Following directions on a coordinate plane",
    dir: "Listen to the directions for a coordinate plane. Then choose the best answer.",
    q: "Which ordered pair names the point?",
    script:
      "We are going to plot a point on the coordinate plane. Start at the origin, which is the point where the two axes cross. Move to the right three units along the x-axis. Then move up two units, parallel to the y-axis. Put your dot here. The first number in an ordered pair tells how far to go left or right. The second number tells how far to go up or down.",
    opts: ["(3, 2)", "(2, 3)", "(3, 3)"],
    why: [
      "In this pair the numbers are reversed; the x number, three, comes first because it tells how far to go right.",
      "Both numbers are three, but the teacher says to move right three units and then up two units.",
    ],
    vocab: [
      [
        "origin",
        "the point (0, 0) where the axes meet",
        "origen: el punto (0, 0) donde se cruzan los ejes",
      ],
      [
        "ordered pair",
        "two numbers that name a point",
        "par ordenado: dos números que nombran un punto",
      ],
    ],
    frames: ["I start at the ___.", "I move ___ units right and ___ units up."],
    focus: ["the origin", "right three, up two", "the first number and the second number"],
    correct: "Right. Three units to the right and two units up gives the ordered pair (3, 2).",
    hint: "The first number in an ordered pair is for left or right. The second is for up or down.",
    wida: ["Explain: follow spatial math directions", "Notice direction words"],
    es: [
      "Seguir instrucciones en un plano de coordenadas",
      "Escucha las instrucciones para un plano de coordenadas. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-b-marble-probability",
    level: "B",
    gw: "g67-load",
    strand: "Math talk: statistics and probability",
    title: "Marbles in a Bag",
    skill: "Listening for the data needed to find a probability",
    dir: "Listen to two students solve a probability problem. Then choose the best answer.",
    q: "What is the probability of pulling a blue marble?",
    script:
      "Tariq: There are ten marbles in the bag. Three are red, five are blue, and two are green. Leah: What are the chances of pulling a blue marble without looking? Tariq: Probability is the number of favorable outcomes divided by the total number of outcomes. There are five blue marbles, so five outcomes are favorable. The total is ten. Leah: So the probability is five out of ten. Tariq: Yes, and that simplifies to one half. It means we would expect about half of our pulls to be blue if we put the marble back each time.",
    opts: [
      "Five out of ten, or one half",
      "Five out of five, or one whole",
      "Three out of ten, or three tenths",
    ],
    why: [
      "Five out of five would mean every marble in the bag is blue, but there are ten marbles in all.",
      "Three out of ten is the probability of pulling a red marble, not a blue one.",
    ],
    vocab: [
      [
        "probability",
        "how likely it is that something will happen",
        "probabilidad: qué tan probable es que algo suceda",
      ],
      ["outcome", "one possible result", "resultado: una posibilidad de lo que puede ocurrir"],
      ["favorable", "the result you are looking for", "favorable: el resultado que buscas"],
    ],
    frames: ["There are ___ favorable outcomes out of ___.", "The probability is ___."],
    focus: [
      "the number of each color",
      "favorable outcomes divided by total outcomes",
      "the simplified fraction",
    ],
    correct:
      "Yes. There are five blue marbles out of ten, so the probability is five tenths, which simplifies to one half.",
    hint: "Listen for how many blue marbles there are and how many marbles there are in all.",
    wida: ["Explain: follow a probability explanation", "Notice math vocabulary"],
    es: [
      "Escuchar los datos necesarios para hallar una probabilidad",
      "Escucha a dos estudiantes resolver un problema de probabilidad. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-b-solve-one-step",
    level: "B",
    gw: "g6-topic",
    strand: "Math talk: expressions and equations",
    type: "order",
    title: "Solve x + 7 = 15",
    skill: "Putting the steps of solving an equation in order",
    dir: "Listen to the teacher solve an equation. Put the steps in the order you hear them.",
    q: "Put the steps for solving the equation in order.",
    script:
      "Let's solve the equation x plus seven equals fifteen. An equation is like a balance: both sides must stay equal. First, decide which operation is being done to x. Here, seven is being added. Second, use the inverse operation, subtraction, on both sides. We subtract seven from fifteen and also from x plus seven. Third, simplify. The left side becomes x, and the right side becomes eight. So x equals eight. Finally, check the answer by putting eight back into the original equation: eight plus seven is fifteen, so it works.",
    items: [
      "Decide that seven is being added to x.",
      "Subtract seven from both sides.",
      "Simplify to get x equals eight.",
      "Check by putting eight back into the equation.",
    ],
    vocab: [
      [
        "equation",
        "a math sentence with an equal sign",
        "ecuación: una oración matemática con un signo igual",
      ],
      [
        "inverse operation",
        "an operation that undoes another one",
        "operación inversa: una operación que deshace otra",
      ],
    ],
    frames: ["First, I decide ___.", "Then I ___ on both sides."],
    focus: ["first, second, third, finally", "the inverse operation", "the check"],
    correct:
      "Yes. The teacher names the operation, uses subtraction on both sides, simplifies, and checks the answer.",
    hint: "Listen for first, second, third, and finally. The check comes last.",
    wida: ["Explain: sequence the steps of solving an equation", "Notice sequence words"],
    es: [
      "Poner en orden los pasos para resolver una ecuación",
      "Escucha al maestro resolver una ecuación. Pon los pasos en el orden en que los oyes.",
    ],
  },
  {
    id: "l-b-ratio-table-ideas",
    level: "B",
    gw: "g6-topic",
    strand: "Math talk: ratios and rates",
    type: "multiSelect",
    title: "What a Ratio Table Shows",
    skill: "Finding the true statements in a math mini-lesson",
    dir: "Listen to the teacher. Choose ALL the statements that are true about ratio tables. There is more than one answer.",
    q: "Which statements does the teacher make about ratio tables?",
    script:
      "A ratio table organizes equivalent ratios in rows or columns. Suppose a car washes team washes three cars every hour. The first column shows hours: one, two, three, four. The second column shows cars: three, six, nine, twelve. Notice that to move from one row to the next, you multiply or add the same amount in each column. Every pair of numbers in the table is equivalent to three to one. We can use the table to answer new questions. For example, if the team works five hours, we continue the pattern, and they wash fifteen cars.",
    opts: [
      "A ratio table lists equivalent ratios.",
      "Every row in the table shows the same relationship.",
      "You can extend the table to answer new questions.",
      "Each row must add a different number than the row before.",
      "A ratio table can only have two rows.",
    ],
    ans: 3,
    why: [
      "The pattern stays the same from row to row, so the table does not add a different number each time.",
      "The example uses four rows and then extends to a fifth, so the table can have many rows.",
    ],
    vocab: [
      [
        "ratio table",
        "a table of equivalent ratios",
        "tabla de razones: una tabla de razones equivalentes",
      ],
      [
        "pattern",
        "something that repeats in a regular way",
        "patrón: algo que se repite de forma regular",
      ],
      ["extend", "to continue a pattern", "extender: continuar un patrón"],
    ],
    frames: ["Every row shows the same ___.", "I can extend the table to find ___."],
    focus: ["equivalent ratios", "the hours and cars columns", "continuing the pattern"],
    correct:
      "Yes. The table lists equivalent ratios, every row shows the same relationship, and the pattern can be extended.",
    hint: "Check each statement against the car wash example. Two statements describe things the teacher never says.",
    wida: ["Inform: identify key ideas in a math mini-lesson", "Use ratio table vocabulary"],
    es: [
      "Hallar las afirmaciones verdaderas en una minilección de matemáticas",
      "Escucha al maestro. Elige TODAS las afirmaciones verdaderas sobre las tablas de razones. Hay más de una respuesta.",
    ],
  },
  {
    id: "l-b-garden-grant-news",
    level: "B",
    gw: "g67-load",
    strand: "News and announcements",
    title: "School Garden Grant",
    skill: "Finding the main idea and a key number in a news report",
    dir: "Listen to a short news report. Then choose the best answer.",
    q: "What is the main idea of the report?",
    script:
      "Here is an update from Westfield Middle School. The school garden club has won a grant of twelve hundred dollars from a local hardware store. The students plan to spend the money on three raised beds, a rain barrel, and tools. Club president Mateo Ruiz says the barrel will collect rainwater, so the garden will use less tap water. The club also plans to give half of the vegetables to a nearby food pantry. Planting begins in April, and the club invites anyone to join.",
    opts: [
      "A student club won money and has plans to grow a garden that helps others.",
      "A hardware store is planning to build a garden for the middle school.",
      "A food pantry is asking students for money to buy new vegetables.",
    ],
    why: [
      "The store only gave the grant; the students will build the garden and plan how to spend the money.",
      "The food pantry will receive vegetables as a gift from the club, and it is not asking for money.",
    ],
    vocab: [
      [
        "grant",
        "money given to support a project",
        "subvención: dinero que se da para apoyar un proyecto",
      ],
      [
        "raised bed",
        "a garden box filled with soil",
        "bancal elevado: una caja de jardín llena de tierra",
      ],
      [
        "food pantry",
        "a place that gives food to families",
        "despensa de alimentos: un lugar que da comida a las familias",
      ],
    ],
    frames: ["The club won a ___.", "They plan to ___."],
    focus: ["the amount of the grant", "what the money is for", "who will get the vegetables"],
    correct:
      "Yes. The report is about a club that won a grant and plans a garden that also helps a food pantry.",
    hint: "Think about who won the money and what the students plan to do with it.",
    wida: ["Inform: identify the main idea of a news report", "Notice key numbers"],
    es: [
      "Hallar la idea principal y un número clave en un noticiero corto",
      "Escucha un noticiero corto. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-inequality-dialogue",
    level: "C",
    gw: "g78-task",
    strand: "Math talk: expressions and equations",
    title: "How Many Tickets Can We Buy?",
    skill: "Following reasoning with an inequality in a real situation",
    dir: "Listen to two students plan a purchase. Then choose the best answer.",
    q: "What does the inequality the students write mean?",
    script:
      "Sofia: The class has forty dollars to spend on tickets for the science center. Each ticket costs six dollars. Ravi: Let t be the number of tickets. Then the total cost is six t. We cannot spend more than forty dollars, so six t must be less than or equal to forty. Sofia: Can we buy seven tickets? Ravi: Six times seven is forty-two, and that is more than forty, so no. Six tickets cost thirty-six, which works. Sofia: So t is any number up to six, but not seven. Ravi: Right. And since we cannot buy part of a ticket, t has to be a whole number.",
    opts: [
      "The cost of the tickets can be at most forty dollars.",
      "The cost of the tickets must be exactly forty dollars.",
      "The class must buy at least forty tickets to get a discount.",
    ],
    why: [
      "The inequality uses less than or equal to, so the cost can be below forty as well as equal to forty.",
      "Forty is the amount of money the class has, and the number of tickets is never said to be forty.",
    ],
    vocab: [
      [
        "inequality",
        "a math sentence that compares amounts that are not equal",
        "desigualdad: una oración matemática que compara cantidades que no son iguales",
      ],
      [
        "whole number",
        "a number with no fraction or decimal part",
        "número entero: un número sin parte fraccionaria ni decimal",
      ],
      ["at most", "no more than", "como máximo: no más que"],
    ],
    frames: ["Six t must be ___ forty.", "The class can buy at most ___ tickets."],
    focus: [
      "the words less than or equal to",
      "the cost of seven tickets",
      "the whole number rule",
    ],
    correct:
      "Yes. Six t is less than or equal to forty, so the total can be forty dollars or less.",
    hint: "Listen for the phrase cannot spend more than. What does that say about the cost?",
    wida: ["Explain: interpret an inequality in context", "Follow reasoning with numbers"],
    es: [
      "Seguir un razonamiento con una desigualdad en una situación real",
      "Escucha a dos estudiantes planear una compra. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-percent-increase",
    level: "C",
    gw: "g78-topic",
    strand: "Math talk: percent and money",
    title: "How Much Did the Price Go Up?",
    skill: "Following a percent change calculation in a spoken explanation",
    dir: "Listen to the math teacher explain a price change. Then choose the best answer.",
    q: "By what percent did the price of the skateboard increase?",
    script:
      "Let's look at a percent increase. Last month a skateboard cost twenty dollars. This month it costs twenty-five dollars. To find the percent increase, first find the change: twenty-five minus twenty is five dollars. Next, compare the change to the original price, not the new price. Five divided by twenty is one fourth, which is twenty-five percent. Many students divide by twenty-five by mistake and get twenty percent, but the change should always be compared with where you started. So the price increased by twenty-five percent.",
    opts: ["Twenty-five percent", "Twenty percent or so", "Five percent, or five dollars"],
    why: [
      "Twenty percent comes from dividing by the new price, which is the mistake the teacher warns about.",
      "Five is the change in dollars, not the percent; the change must be compared with the original price.",
    ],
    vocab: [
      [
        "percent increase",
        "how much a number grew compared with the start",
        "aumento porcentual: cuánto creció un número comparado con el inicio",
      ],
      ["original", "first; the one you start with", "original: primero; con el que empiezas"],
      [
        "change",
        "the difference between two amounts",
        "cambio: la diferencia entre dos cantidades",
      ],
    ],
    frames: ["The change is ___ dollars.", "I divide the change by the ___ price."],
    focus: ["the change in dollars", "which price to divide by", "the common mistake"],
    correct:
      "Yes. The change is five dollars, and five divided by the original price of twenty is twenty-five percent.",
    hint: "Listen for which price the teacher says to compare the change with: the original or the new one.",
    wida: ["Explain: follow a multi-step percent calculation", "Notice a common-error warning"],
    es: [
      "Seguir el cálculo de un cambio porcentual en una explicación oral",
      "Escucha al maestro de matemáticas explicar un cambio de precio. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-volume-presentation",
    level: "C",
    gw: "g6-topic",
    strand: "Math talk: geometry",
    title: "A Student Presentation: Volume of a Box",
    skill: "Identifying the reasoning a presenter uses to justify an answer",
    dir: "Listen to a student's math presentation. Then choose the best answer.",
    q: "How does the presenter justify that the volume is thirty cubic units?",
    script:
      "For my presentation, I solved this problem: a box is five units long, three units wide, and two units tall. What is its volume? First, I pictured the bottom layer. It has five cubes in each row and three rows, so one layer has fifteen cubes. Then I noticed the box is two layers tall. Two layers of fifteen cubes is thirty cubes. I also checked using the formula: length times width times height is five times three times two, which equals thirty. Both methods match, so I am confident the volume is thirty cubic units.",
    opts: [
      "She counts the cubes in layers and then checks with the formula.",
      "She measures the box with a ruler and rounds to the nearest ten.",
      "She adds the length, width and height and then doubles the sum.",
    ],
    why: [
      "The problem gives the dimensions, and the presenter never measures or rounds anything.",
      "Adding the dimensions gives ten and doubling gives twenty, which is not what she does or what she gets.",
    ],
    vocab: [
      [
        "volume",
        "how much space a solid shape takes up",
        "volumen: cuánto espacio ocupa una figura sólida",
      ],
      ["layer", "one flat level of cubes", "capa: un nivel plano de cubos"],
      ["cubic units", "units that measure volume", "unidades cúbicas: unidades que miden volumen"],
    ],
    frames: ["One layer has ___ cubes.", "I checked using the formula ___ times ___ times ___."],
    focus: ["the cubes in one layer", "the number of layers", "the formula check"],
    correct:
      "Yes. She finds fifteen cubes in each layer, uses two layers, and then confirms thirty with length times width times height.",
    hint: "Listen to the two methods she describes. She uses one method first and a second method to check.",
    wida: [
      "Explain: identify how a speaker justifies a solution",
      "Follow reasoning with two methods",
    ],
    es: [
      "Identificar el razonamiento que usa un presentador para justificar una respuesta",
      "Escucha la presentación de matemáticas de una estudiante. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-critique-notes",
    level: "C",
    gw: "g78-task",
    strand: "Note-taking from a talk",
    type: "constructed",
    title: "Critique a Classmate's Reasoning",
    skill: "Listening to a classmate's reasoning and writing a respectful critique",
    dir: "Listen to a classmate explain an answer. Write notes about what is correct and what is not. Then write a short critique.",
    q: "Take notes under the headings Claim, Reason, and Problem. Then write a respectful critique in two or three sentences.",
    script:
      "Hector: I think the mean of these test scores is the same as the median. The scores are seventy, seventy-five, eighty, ninety, and ninety-five. I found the median by ordering the scores, and the middle score is eighty. Then I found the mean by adding all the scores and dividing by five. The total is four hundred ten, and four hundred ten divided by five is eighty-two. But I decided that eighty-two is close enough to eighty, so the mean and the median are the same. That means the scores are perfectly balanced.",
    focus: [
      "Hector's claim",
      "his calculations",
      "where his conclusion does not match his numbers",
    ],
    models: {
      A: "Claim: mean and median are the same. Reason: 82 is close to 80. Problem: 82 is not 80, so they are not the same.",
      B: "Hector claims the mean and median are the same. His calculations are correct: the median is 80 and the mean is 82. However, 82 is not equal to 80, so his conclusion is not right. The mean is a little higher than the median.",
      C: "Hector claims the mean and the median are the same. His work is accurate: the median is 80 and the mean is 410 divided by 5, which is 82. However, close is not the same as equal, so his conclusion does not follow from his own numbers. I would suggest that he say the mean is slightly greater than the median, which shows the high scores of 90 and 95 pulling the mean up.",
    },
    criteria: [
      "I said what was correct about Hector's work before what was not.",
      "I used his numbers to explain the problem.",
      "My critique is polite and suggests a better conclusion.",
    ],
    label: "Your notes and critique",
    vocab: [
      [
        "critique",
        "to give careful feedback about someone's work",
        "criticar (analizar): dar comentarios cuidadosos sobre el trabajo de alguien",
      ],
      [
        "mean",
        "the sum of the values divided by how many there are",
        "media: la suma de los valores dividida entre cuántos hay",
      ],
      [
        "conclusion",
        "a final decision based on facts",
        "conclusión: una decisión final basada en hechos",
      ],
    ],
    frames: [
      "Hector's calculations are ___.",
      "However, his conclusion does not follow because ___.",
      "I suggest that he ___.",
    ],
    wida: ["Argue: evaluate a classmate's reasoning", "Use respectful language to disagree"],
    es: [
      "Escuchar el razonamiento de un compañero y escribir una crítica respetuosa",
      "Escucha a un compañero explicar una respuesta. Escribe apuntes sobre lo que es correcto y lo que no. Luego escribe una crítica corta.",
    ],
    correct:
      "Good critique. You noticed what was right, used the speaker's own numbers, and suggested a better conclusion.",
    hint: "Compare the mean the speaker calculates with the median. Are those two numbers really equal?",
  },
];

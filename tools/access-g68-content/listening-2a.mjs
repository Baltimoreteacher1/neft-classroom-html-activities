// Grades 6-8 publisher pass, Listening batch 2a: math language. Original EduWonderLab scripts.
export default [
  {
    id: "l-a-store-sale",
    level: "A",
    strand: "Math talk: percent and money",
    title: "School Store Sale",
    skill: "Catching an item and a percent in an announcement",
    dir: "Listen to the announcement. Then choose the best answer.",
    q: "Which item is on sale, and how much is the discount?",
    script:
      "Attention, shoppers. Our school store is having a sale this week. All notebooks are ten percent off. That means a notebook that usually costs five dollars will cost a little less today. Pencils are not on sale, so they cost the same as always. The sale ends on Friday at three o'clock. Thank you for shopping with us.",
    opts: ["Notebooks, ten percent off", "Pencils, ten percent off", "Notebooks, five dollars off"],
    why: [
      "The speaker says the pencils are not on sale, so only the notebooks have a discount.",
      "Five dollars is the usual price of a notebook, not the amount of the discount.",
    ],
    vocab: [
      ["discount", "a lower price", "descuento: un precio más bajo"],
      ["percent", "a part out of one hundred", "por ciento: una parte de cada cien"],
    ],
    frames: ["The ___ are on sale.", "The discount is ___ percent."],
    focus: ["the item that is on sale", "the words percent off", "the words are not on sale"],
    correct:
      "Yes. The speaker says all notebooks are ten percent off and that pencils are not on sale.",
    hint: "Listen for the word percent. Then listen for which item it goes with.",
    wida: ["Inform: identify details in an announcement", "Notice percent and money words"],
    es: [
      "Captar un artículo y un porcentaje en un anuncio",
      "Escucha el anuncio. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-a-what-is-variable",
    level: "A",
    strand: "Math talk: expressions",
    title: "What Is a Variable?",
    skill: "Understanding a short definition of a math word",
    dir: "Listen to the math teacher. Then choose the best answer.",
    q: "What does the letter n stand for in the teacher's example?",
    script:
      "Today we are learning a new word: variable. A variable is a letter that stands for a number we do not know yet, or a number that can change. Look at this expression: n plus four. The letter n is the variable. If n is three, then n plus four equals seven. If n is ten, then n plus four equals fourteen. The variable can have many different values.",
    opts: [
      "A number that is not known yet",
      "The number four, written as a letter",
      "A word that means plus",
    ],
    why: [
      "The teacher says four is the number being added; the letter n is a different part of the expression.",
      "Plus is the operation in the expression, but the teacher explains that the letter n stands for a number.",
    ],
    vocab: [
      [
        "variable",
        "a letter that stands for a number",
        "variable: una letra que representa un número",
      ],
      [
        "expression",
        "numbers, letters, and operations together",
        "expresión: números, letras y operaciones juntos",
      ],
    ],
    frames: ["A variable is a ___.", "If n is ___, then n plus four is ___."],
    focus: ["the word variable", "the example n plus four", "the values three and ten"],
    correct:
      "Right. The teacher says a variable is a letter that stands for a number we do not know yet or that can change.",
    hint: "Listen for the sentence that begins A variable is.",
    wida: ["Inform: understand a math definition", "Follow an example with numbers"],
    es: [
      "Entender la definición corta de una palabra de matemáticas",
      "Escucha al maestro de matemáticas. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-b-jacket-discount",
    level: "B",
    gw: "g78-topic",
    strand: "Math talk: percent and money",
    title: "Jacket on Sale",
    skill: "Listening for a discount and a sale price in a dialogue",
    dir: "Listen to two friends in a store. Then choose the best answer.",
    q: "What is the sale price of the jacket?",
    script:
      "Camila: Look at this jacket, Andre. The tag says forty dollars, and the sign says twenty-five percent off. Andre: So how much will it cost? Camila: First I find the discount. Twenty-five percent of forty dollars is ten dollars. Andre: Ten dollars is how much we save, right? Camila: Yes. So I subtract the ten dollars from the forty dollars, and the sale price is thirty dollars. Andre: That is less than I thought. Let's ask if they have it in blue.",
    opts: ["Thirty dollars", "Ten dollars", "Sixty-five dollars"],
    why: [
      "Ten dollars is the amount of the discount, the money saved, not the price the customer pays.",
      "The speakers subtract the discount from the original price; they never add the numbers together.",
    ],
    vocab: [
      [
        "sale price",
        "the price after a discount",
        "precio de oferta: el precio después de un descuento",
      ],
      ["subtract", "to take away", "restar: quitar"],
      ["save", "to keep money by paying less", "ahorrar: pagar menos y quedarse con el dinero"],
    ],
    frames: ["The discount is ___ dollars.", "The sale price is ___ minus ___, which is ___."],
    focus: ["the original price", "the amount saved", "the word subtract"],
    correct:
      "Yes. Camila finds a discount of ten dollars and subtracts it from forty dollars to get thirty dollars.",
    hint: "Ask: is the sale price the money saved or the money paid? Listen for the word subtract.",
    wida: [
      "Inform: follow a multi-step money calculation",
      "Distinguish the discount from the sale price",
    ],
    es: [
      "Escuchar un descuento y un precio de oferta en un diálogo",
      "Escucha a dos amigos en una tienda. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-b-find-the-median",
    level: "B",
    gw: "g6-topic",
    strand: "Math talk: statistics",
    type: "order",
    title: "Steps to Find the Median",
    skill: "Putting the steps of a math procedure in order",
    dir: "Listen to the teacher explain how to find the median. Put the steps in the order you hear them.",
    q: "Put the steps for finding the median in order.",
    script:
      "Let me show you how to find the median of a data set. First, write the numbers in order from least to greatest. Second, count how many numbers there are. Third, find the number in the middle. If there is an odd number of values, that middle number is the median. If there is an even number of values, there are two middle numbers, so add them and divide by two. Finally, check that half of the numbers are below the median and half are above it.",
    items: [
      "Write the numbers from least to greatest.",
      "Count how many numbers there are.",
      "Find the number in the middle.",
      "Check that half the numbers are on each side.",
    ],
    vocab: [
      [
        "median",
        "the middle number of an ordered list",
        "mediana: el número del medio de una lista ordenada",
      ],
      ["data set", "a group of numbers or facts", "conjunto de datos: un grupo de números o datos"],
    ],
    frames: ["First, I ___.", "Finally, I ___ to check."],
    focus: [
      "the words first, second, third and finally",
      "putting numbers in order",
      "the middle number",
    ],
    correct:
      "Yes. The teacher orders the numbers first, counts them, finds the middle, and checks both halves last.",
    hint: "Listen for the order words first, second, third, and finally.",
    wida: ["Explain: sequence a math procedure", "Notice order words"],
    es: [
      "Ordenar los pasos de un procedimiento de matemáticas",
      "Escucha al maestro explicar cómo hallar la mediana. Pon los pasos en el orden en que los oyes.",
    ],
  },
  {
    id: "l-b-triangle-area-talk",
    level: "B",
    gw: "g6-topic",
    strand: "Math talk: geometry",
    type: "multiSelect",
    title: "Why Half? The Area of a Triangle",
    skill: "Finding the true statements in a student's geometry explanation",
    dir: "Listen to two students explain the area of a triangle. Choose ALL the statements that are true. There is more than one answer.",
    q: "Which statements about the area of a triangle do the students make?",
    script:
      "Mei: To find the area of a triangle, I multiply the base times the height and then divide by two. Jorge: Why do you divide by two? Mei: Because a triangle is half of a rectangle. If I draw a rectangle with the same base and the same height, I can cut it along the diagonal and get two equal triangles. Jorge: So one triangle is half of the rectangle's area. Mei: Exactly. And the answer is in square units, like square centimeters, because area measures flat space.",
    opts: [
      "Multiply the base by the height, then divide by two.",
      "A triangle is half of a rectangle with the same base and height.",
      "The area is measured in square units.",
      "Add the base and the height to find the area.",
      "The area is measured in cubic units.",
    ],
    ans: 3,
    why: [
      "Mei multiplies the base and the height; she never adds them.",
      "Cubic units measure volume, and Mei says area is measured in square units.",
    ],
    vocab: [
      ["base", "the side a shape rests on", "base: el lado sobre el que descansa una figura"],
      [
        "height",
        "how tall a shape is, straight up from the base",
        "altura: qué tan alta es una figura, en línea recta desde la base",
      ],
      [
        "square units",
        "units that measure flat space",
        "unidades cuadradas: unidades que miden un espacio plano",
      ],
    ],
    frames: ["The area is the base times the ___ divided by ___.", "A triangle is half of a ___."],
    focus: [
      "the word divide",
      "the rectangle with the same base and height",
      "the words square units",
    ],
    correct:
      "Yes. Mei multiplies, divides by two because the triangle is half a rectangle, and gives the answer in square units.",
    hint: "Check each choice against what Mei says. Two choices use words she never says.",
    wida: ["Inform: identify true statements in an explanation", "Notice geometry vocabulary"],
    es: [
      "Hallar las afirmaciones verdaderas en la explicación de geometría de un estudiante",
      "Escucha a dos estudiantes explicar el área de un triángulo. Elige TODAS las afirmaciones verdaderas. Hay más de una respuesta.",
    ],
  },
  {
    id: "l-c-distribute-mistake",
    level: "C",
    gw: "g67-task",
    strand: "Math talk: expressions",
    title: "Find the Mistake: Three Times a Sum",
    skill: "Following a student disagreement and finding the error in reasoning",
    dir: "Listen to two students disagree about a math problem. Then choose the best answer.",
    q: "What mistake did Priya make?",
    script:
      "Teacher: Priya and Daniel are simplifying the expression three times the quantity x plus four. Priya says the answer is three x plus four. Daniel says it is three x plus twelve. Priya, explain your thinking. Priya: I multiplied three by x to get three x, and then I kept the four, because it was already there. Daniel: But the three is outside the parentheses, so it multiplies everything inside, not just the first term. Priya: Oh. So I also have to multiply three by four. Teacher: Exactly. When a number multiplies a sum, it multiplies every term in the sum. Try x equals one to check: the original expression gives fifteen, and three x plus twelve also gives fifteen, but three x plus four gives only seven.",
    opts: [
      "She multiplied the three by only the first term inside the parentheses.",
      "She added three to the x instead of multiplying the two together.",
      "She multiplied the x by four instead of multiplying the three by four.",
    ],
    why: [
      "Priya does get three x correctly by multiplying; the problem is what she did with the four.",
      "Priya multiplies three by x correctly, but she leaves the four unchanged when it should also be multiplied.",
    ],
    vocab: [
      [
        "term",
        "a part of an expression that is added or subtracted",
        "término: una parte de una expresión que se suma o se resta",
      ],
      [
        "parentheses",
        "curved marks that group part of an expression",
        "paréntesis: signos curvos que agrupan parte de una expresión",
      ],
      [
        "simplify",
        "to rewrite in a shorter or easier form",
        "simplificar: reescribir de una forma más corta o más fácil",
      ],
    ],
    frames: [
      "The three multiplies ___ term inside the parentheses.",
      "Priya forgot to multiply ___ by ___.",
    ],
    focus: ["Priya's first answer", "Daniel's explanation", "the check with x equals one"],
    correct:
      "Yes. Priya multiplied only the first term, but the three outside the parentheses multiplies every term inside.",
    hint: "Compare Priya's answer to Daniel's. Which part of the expression did Priya leave unchanged?",
    wida: [
      "Explain: identify an error in math reasoning",
      "Follow a disagreement and its resolution",
    ],
    es: [
      "Seguir un desacuerdo entre estudiantes y encontrar el error en el razonamiento",
      "Escucha a dos estudiantes en desacuerdo sobre un problema de matemáticas. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-unit-rate-lecture",
    level: "C",
    gw: "g6-topic",
    strand: "Math talk: ratios and rates",
    title: "Why Use a Unit Rate?",
    skill: "Understanding why a speaker uses an example",
    dir: "Listen to part of a math lesson. Then choose the best answer.",
    q: "Why does the teacher give the example of the two cyclists?",
    script:
      "When we compare rates, the numbers can be hard to line up. Suppose Ana rides forty-five kilometers in three hours, and Ben rides sixty kilometers in five hours. Who is faster? It is not obvious. So we find a unit rate, which tells how much for one unit. Ana rides fifteen kilometers in one hour. Ben rides twelve kilometers in one hour. Now the comparison is simple: fifteen is greater than twelve, so Ana is faster. A unit rate puts different situations on the same scale, which makes a fair comparison possible.",
    opts: [
      "To show that a unit rate makes two different rates easy to compare",
      "To prove that cyclists who ride for more hours are always faster",
      "To explain how to convert kilometers into hours for each rider",
    ],
    why: [
      "Ben rides for more hours but is slower per hour, so the example shows the opposite of this claim.",
      "Kilometers measure distance and hours measure time, and the teacher never converts one into the other.",
    ],
    vocab: [
      [
        "unit rate",
        "the amount for one unit, such as kilometers in one hour",
        "tasa unitaria: la cantidad por una unidad, como kilómetros en una hora",
      ],
      [
        "compare",
        "to find how things are alike or different",
        "comparar: hallar en qué se parecen o se diferencian las cosas",
      ],
      ["fair", "the same for everyone", "justo: igual para todos"],
    ],
    frames: [
      "A unit rate tells how much for ___.",
      "Ana is faster because ___ is greater than ___.",
    ],
    focus: [
      "the two riders and their numbers",
      "the words unit rate",
      "the final sentence about a fair comparison",
    ],
    correct:
      "Yes. The teacher shows that after finding the unit rates, fifteen and twelve are easy to compare.",
    hint: "Listen to the last two sentences. What does a unit rate make possible?",
    wida: [
      "Explain: identify the purpose of an example",
      "Understand why a speaker gives evidence",
    ],
    es: [
      "Entender por qué un hablante usa un ejemplo",
      "Escucha parte de una lección de matemáticas. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-integer-notes",
    level: "C",
    gw: "g6-topic",
    strand: "Note-taking from a talk",
    type: "cloze",
    title: "Complete the Notes: Absolute Value",
    skill: "Completing notes about a math concept from a spoken explanation",
    dir: "Listen to the teacher. Then complete the notes with the correct words.",
    q: "Complete the notes about absolute value.",
    script:
      "Absolute value tells us how far a number is from zero on a number line. We write it with two straight bars. The absolute value of negative seven is seven, because negative seven is seven steps from zero. The absolute value of seven is also seven. Distance can never be negative, so an absolute value is always zero or greater. Now think about a diver at negative thirty feet and a bird at thirty feet. They are on opposite sides of sea level, but each is the same distance from it. That is why the two numbers have the same absolute value.",
    cloze: [
      "Absolute value is the ",
      ["distance", "direction", "opposite"],
      " of a number from zero. The absolute value of negative seven is ",
      ["seven", "zero", "negative seven"],
      ". An absolute value is never ",
      ["negative", "positive", "equal"],
      ".",
    ],
    vocab: [
      [
        "absolute value",
        "a number's distance from zero",
        "valor absoluto: la distancia de un número a cero",
      ],
      [
        "number line",
        "a line that shows numbers in order",
        "recta numérica: una línea que muestra los números en orden",
      ],
      ["opposite", "on the other side of zero", "opuesto: al otro lado del cero"],
    ],
    frames: [
      "Absolute value is a number's distance from ___.",
      "Negative seven and seven are ___ from zero.",
    ],
    focus: ["the word distance", "the example of negative seven", "the diver and the bird"],
    correct:
      "Right. Absolute value is distance from zero, so negative seven has an absolute value of seven, and distance is never negative.",
    hint: "Listen for how far negative seven is from zero. Distance is a count of steps.",
    wida: ["Inform: complete notes from a math explanation", "Use precise math vocabulary"],
    es: [
      "Completar apuntes sobre un concepto de matemáticas a partir de una explicación oral",
      "Escucha al maestro. Luego completa los apuntes con las palabras correctas.",
    ],
  },
];

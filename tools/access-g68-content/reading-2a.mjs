// Grades 6-8 publisher pass, Reading Room lessons, batch 2a: math reasoning and social studies. Original texts.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "mean-fair-share",
    level: "A",
    title: "The Mean: A Fair Share",
    summary:
      "Four friends share cans equally and discover what the mean tells us about a group of numbers.",
    genre: "Informational text with math",
    subject: "Math (statistics)",
    topics: ["mean", "data sets"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how to find the mean and what it means.",
    languageFeatures: ["sequence words", "math vocabulary", "cause and effect"],
    minutes: 12,
    content:
      "Explain that the mean is the fair share found by adding the values and dividing by how many there are.",
    language: "Use first, then and because to explain a math procedure.",
    essential: "How can one number describe a whole group of numbers?",
    background: "Think about a time you shared something equally with other people.",
    hook: "Four friends have different numbers of cans. How can they make the amounts equal?",
    purpose: "Read to find out how to find the mean and what the mean tells us.",
    vocab: [
      [
        "mean",
        "the fair share found by adding the numbers and dividing",
        "The mean number of cans was five.",
        "media",
      ],
      [
        "data",
        "numbers or facts that people collect",
        "The friends wrote down their data.",
        "datos",
      ],
      ["fair", "equal for everyone", "A fair share is the same for each person.", "justo"],
    ],
    paras: [
      {
        text: "Four friends collected cans for a food drive. Mia collected 3 cans. Jon collected 5 cans. Lena collected 4 cans. Omar collected 8 cans. The friends wanted to know how many cans each person would have if they shared all the cans equally.",
        q: "What problem do the friends want to solve?",
      },
      {
        text: "First, they added the numbers: 3 + 5 + 4 + 8 = 20. Then they divided by the number of friends. Twenty divided by 4 is 5. The answer, 5, is called the mean. It is the fair share for each person.",
        q: "What are the steps for finding the mean?",
      },
      {
        text: "The mean does not have to be one of the numbers in the data. Here, Jon collected exactly 5 cans, but Mia collected only 3. The mean tells us what each amount would be if everyone had the same.",
        q: "What does the mean tell us?",
      },
      {
        text: "Teachers, scientists, and store owners use the mean to describe a group of numbers with one number. It helps them compare one group with another group.",
        q: "Who uses the mean?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many cans did the four friends collect in all?",
        opts: ["20 cans", "5 cans", "4 cans"],
        why: [
          "Five is the mean, the fair share for each friend, and it is not the total.",
          "Four is the number of friends, not the number of cans.",
        ],
        rat: "Paragraph 2 adds 3 + 5 + 4 + 8 and gets 20 cans.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, the mean is called the “fair share.” What does fair mean?",
        opts: ["equal for everyone", "larger than the rest", "hard to find"],
        why: [
          "A fair share is not larger than others; everyone gets the same amount.",
          "The text shows the fair share is easy to find with two steps.",
        ],
        rat: "The fair share is what each friend gets when the cans are shared equally, so fair means equal.",
      },
      {
        kind: "structure",
        phase: "first",
        skill: "Purpose of a paragraph",
        type: "choice",
        prompt: "What is the main job of paragraph 1?",
        opts: [
          "It introduces a problem that the mean can solve.",
          "It explains why scientists collect cans.",
          "It gives the steps for finding the mean.",
        ],
        why: [
          "Cans are used only as an example; scientists are not mentioned until paragraph 4.",
          "The steps for finding the mean come in paragraph 2, after the problem is introduced.",
        ],
        rat: "Paragraph 1 tells about the friends and asks how they can share the cans equally.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that tells how to find the mean.",
        evidence: ["p2"],
        rat: "Paragraph 2 says to add the numbers and then divide by the number of friends.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the procedure",
        type: "choice",
        prompt: "Suppose the friends collected 3, 5, 4 and 4 cans. What is the mean?",
        opts: ["4 cans", "5 cans", "16 cans"],
        why: [
          "Five was the mean for the cans in the passage, but these numbers are different.",
          "Sixteen is the sum of the cans; the mean is the sum divided by four.",
        ],
        rat: "3 + 5 + 4 + 4 = 16, and 16 divided by 4 is 4.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement does paragraph 3 support?",
        opts: [
          "A mean can describe a group even if it is not one of the numbers.",
          "The mean must be the number that most friends collected.",
          "The mean is always the biggest number in the data.",
        ],
        why: [
          "The mean is found by adding and dividing; it is not the number that appears most often.",
          "In the example the biggest number is 8, but the mean is 5.",
        ],
        rat: "Paragraph 3 says the mean does not have to be one of the numbers in the data.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain in your own words",
        type: "short",
        prompt: "Explain how to find the mean of 2, 6 and 10.",
        lookFor: [
          "Adds the numbers to get 18",
          "Divides by 3 because there are three numbers",
          "States that the mean is 6",
        ],
        rubric: ["Uses the correct steps", "Gives the correct sum and mean", "Uses sequence words"],
        frame: "First, I add ___. Then I divide by ___. The mean is ___.",
        model:
          "First, I add 2 + 6 + 10 and get 18. Then I divide 18 by 3, because there are three numbers. The mean is 6.",
      },
    ],
    transfer: {
      prompt:
        "Three runners ran 4, 6 and 8 laps. Explain how to find the mean number of laps and what the mean tells you.",
      lookFor: [
        "Adds 4 + 6 + 8 to get 18",
        "Divides 18 by 3 to get 6",
        "Says the mean is the fair share, or what each runner would run if the laps were equal",
      ],
      frame: "I add ___ and divide by ___. The mean is ___, which tells me ___.",
    },
    guide: {
      mini: "Model the mean with connecting cubes: make four towers of different heights, then level them. Connect the leveling to adding and dividing.",
      discussion: [
        "Why is the mean called a fair share?",
        "Can the mean be a number nobody has?",
        "When would you use the mean to compare two groups?",
      ],
      misconception:
        "Students may find the middle number instead of the mean or forget to divide; the leveling model shows why we divide by the number of people.",
      answerNotes: [
        "The total is 20 because 3 + 5 + 4 + 8 = 20.",
        "The new mean is 4 because 3 + 5 + 4 + 4 = 16 and 16 ÷ 4 = 4.",
      ],
      model:
        "I add the numbers to get 18. Then I divide by 3 because there are three numbers. The mean is 6.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain why we add and then divide to find the mean. You can talk in any language, then ask for a sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique por qué se suma y luego se divide para hallar la media. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["Why do we add the numbers first?", "What does the mean tell us about the group?"],
    ),
    connections: {
      write: "Write a paragraph that explains how to find the mean.",
      speak: "Explain the steps for finding the mean aloud.",
      listen: "Listen to a talk about mean and median.",
    },
  },
  {
    id: "lemonade-ratio-table",
    level: "A",
    title: "Making Lemonade for the School Fair",
    summary: "A family uses a ratio table to make bigger batches of lemonade with the same taste.",
    genre: "Procedural text with a table",
    subject: "Math (ratios)",
    topics: ["ratio tables", "following a recipe"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how a ratio table keeps a recipe the same when the amounts grow.",
    languageFeatures: ["ratio language", "sequence words", "reading a table"],
    minutes: 12,
    content: "Use a ratio table to find equivalent ratios.",
    language: "Read a table and explain a pattern with for every and so.",
    essential: "How can we make a bigger batch and keep the same taste?",
    background: "Think about a recipe you have made. What happens if you need more servings?",
    hook: "A school fair needs much more lemonade than one pitcher.",
    purpose: "Read to learn how a ratio table helps keep a recipe the same.",
    table: {
      headers: ["Cups of lemon juice", "Cups of water"],
      rows: [
        ["2", "6"],
        ["4", "12"],
        ["6", "18"],
        ["8", "24"],
      ],
      description:
        "A ratio table with four rows. Each row has twice, three times, and four times the amounts in the first row.",
    },
    vocab: [
      ["ratio", "a comparison of two amounts", "The ratio of juice to water is 2 to 6.", "razón"],
      ["batch", "an amount made at one time", "A bigger batch needs more of everything.", "tanda"],
      [
        "table",
        "rows and columns that organize information",
        "The table shows the amounts for each batch.",
        "tabla",
      ],
    ],
    paras: [
      {
        text: "Maria's family makes lemonade for the school fair. Their recipe uses 2 cups of lemon juice for every 6 cups of water. This recipe makes one small pitcher, but the fair needs much more.",
        q: "What is the recipe?",
      },
      {
        text: "Maria draws a ratio table to make bigger batches. In the first row she writes 2 and 6. To make a double batch, she multiplies both numbers by 2. The second row shows 4 cups of juice and 12 cups of water.",
        q: "How does Maria make a double batch?",
      },
      {
        text: "She keeps going. For a triple batch, she multiplies both numbers by 3 and gets 6 and 18. For four batches, she gets 8 and 24. Every row has the same ratio, so the lemonade tastes the same each time.",
        q: "Why does the lemonade taste the same?",
      },
      {
        text: "The family needs 30 cups of water for the whole fair. Maria looks at her pattern. Each row adds 2 cups of juice and 6 cups of water. She can use the table to plan exactly how much juice to buy.",
        q: "How can Maria use the pattern?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many cups of water go with 4 cups of lemon juice?",
        opts: ["12 cups", "6 cups", "8 cups"],
        why: [
          "Six cups of water go with only 2 cups of juice, which is the first row.",
          "Eight is the number in the last row for juice, not water.",
        ],
        rat: "The table shows 4 cups of juice and 12 cups of water in the second row.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 1, what does batch mean?",
        opts: [
          "an amount made at one time",
          "a kind of fruit used in drinks",
          "a glass that people drink from",
        ],
        why: [
          "The recipe is about lemonade, but a batch is not a kind of fruit.",
          "Maria makes a pitcher of lemonade; a batch is the amount she makes, not the glass.",
        ],
        rat: "The recipe makes one small pitcher, so a batch is the amount made at one time.",
      },
      {
        kind: "structure",
        phase: "first",
        skill: "How the text is organized",
        type: "choice",
        prompt: "How does the author organize the text?",
        opts: [
          "It starts with a recipe, then shows the steps for bigger batches.",
          "It starts with the fair, then argues for making less lemonade.",
          "It lists many different recipes for lemonade.",
        ],
        why: [
          "The family wants more lemonade, not less, so the text does not argue for less.",
          "The text uses one recipe only and shows how to multiply it.",
        ],
        rat: "Paragraph 1 gives the recipe and paragraphs 2 and 3 show how to make bigger batches.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Read a table",
        type: "choice",
        prompt: "Use the table. How many cups of juice go with 18 cups of water?",
        opts: ["6 cups", "2 cups", "12 cups"],
        why: [
          "Two cups of juice go with only 6 cups of water.",
          "Twelve is the amount of water in the second row, not the amount of juice.",
        ],
        rat: "The row with 18 cups of water has 6 cups of lemon juice.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that explains why the lemonade tastes the same each time.",
        evidence: ["p3"],
        rat: "Paragraph 3 says every row has the same ratio, so the lemonade tastes the same.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Use the pattern",
        type: "choice",
        prompt: "If Maria continues the pattern, how many cups of juice go with 30 cups of water?",
        opts: ["10 cups", "8 cups", "12 cups"],
        why: [
          "Eight cups of juice go with 24 cups of water, which is one row earlier.",
          "Twelve cups of juice would go with 36 cups of water, which is one row later.",
        ],
        rat: "Each row adds 2 cups of juice and 6 cups of water, so the next row after 24 is 30 cups of water and 10 cups of juice.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a pattern",
        type: "short",
        prompt: "Explain how the table shows that the ratios are equivalent. Use two rows.",
        lookFor: [
          "Names two rows with their numbers",
          "Says both numbers are multiplied by the same amount",
          "Says the ratios are equivalent",
        ],
        rubric: [
          "Uses numbers from two rows",
          "Explains multiplication by the same number",
          "Uses ratio vocabulary",
        ],
        frame:
          "In row ___ the numbers are ___ and ___. In row ___ they are ___ and ___. Both numbers were multiplied by ___.",
        model:
          "In row 1 the numbers are 2 and 6. In row 2 they are 4 and 12. Both numbers were multiplied by 2, so the ratios are equivalent.",
      },
    ],
    transfer: {
      prompt:
        "A paint recipe uses 3 cups of blue for every 2 cups of white. Make a ratio table with three rows and explain how you found the numbers.",
      lookFor: [
        "Row 1: 3 and 2; row 2: 6 and 4; row 3: 9 and 6",
        "Says both numbers are multiplied by the same amount each time",
        "Uses the words ratio or equivalent",
      ],
      frame: "I wrote ___ and ___ in the first row. I multiplied both numbers by ___ to get ___.",
    },
    guide: {
      mini: "Build the first two rows of the ratio table on the board and ask students to find the multiplier that connects them. Use color to show that both columns change by the same factor.",
      discussion: [
        "What happens to the taste if we multiply only the juice?",
        "How can you find the juice for 36 cups of water?",
        "Where else do we see ratios in everyday life?",
      ],
      misconception:
        "Students may add the same number to both columns instead of multiplying; compare 2 and 6 with 4 and 8 to show the taste would change.",
      answerNotes: [
        "Row 2 of the table has 4 cups of juice and 12 cups of water.",
        "The next row after 8 and 24 is 10 and 30.",
      ],
      model:
        "In row 1 the numbers are 2 and 6, and in row 2 they are 4 and 12. Both numbers were multiplied by 2, so the ratios are equivalent.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to point to a row in the table and explain how the numbers change. You can talk in any language, then ask for a sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que señale una fila de la tabla y explique cómo cambian los números. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What do you multiply to make a double batch?",
        "How does the table keep the taste the same?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains how to make a double batch.",
      speak: "Explain a ratio table aloud using two rows.",
      listen: "Listen to a recipe with a ratio and find the amounts.",
    },
  },
  {
    id: "percent-discounts",
    level: "B",
    title: "How Percent Discounts Work",
    summary:
      "Learn two ways to find a sale price, and why two discounts do not add up the way you might expect.",
    genre: "Informational text with a data table",
    subject: "Math (percent)",
    topics: ["percent", "discounts", "sale price"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how to calculate a discount and a sale price.",
    languageFeatures: ["sequence words", "cause and effect", "precise math vocabulary"],
    minutes: 15,
    content:
      "Calculate a percent discount and a sale price, and explain why two discounts do not equal their sum.",
    language: "Use first, then, so and however to explain a multi-step calculation.",
    essential: "How can percent help us understand a sale?",
    background: "Think about a sale sign you have seen. What did it promise?",
    hook: "A sign says 20% off, but what will you actually pay?",
    purpose:
      "Read to learn how to find a sale price and what to watch for with more than one discount.",
    table: {
      headers: ["Original price", "Discount", "Sale price"],
      rows: [
        ["$50", "20% off", "$40"],
        ["$80", "25% off", "$60"],
        ["$120", "10% off", "$108"],
      ],
      description:
        "A table of three items showing the original price, the percent discount, and the sale price.",
    },
    vocab: [
      [
        "percent",
        "a part out of one hundred",
        "Twenty percent is twenty out of one hundred.",
        "por ciento",
      ],
      [
        "discount",
        "an amount taken off the price",
        "The discount on the jacket was ten dollars.",
        "descuento",
      ],
      [
        "original price",
        "the price before a discount",
        "The original price was fifty dollars.",
        "precio original",
      ],
      ["reduced", "made smaller or lower", "The price was reduced by twenty percent.", "reducido"],
    ],
    paras: [
      {
        text: "A store sign says “20% off.” That means the price is reduced by 20 out of every 100 parts of the original price. The word percent means “per hundred,” so 20% is the same as 20/100 or 0.20.",
        q: "What does 20% off mean?",
      },
      {
        text: "To find the discount, multiply the original price by the percent written as a decimal. For a $50 jacket, 50 × 0.20 = 10, so the discount is $10. Then subtract the discount from the original price: 50 − 10 = 40. The sale price is $40.",
        q: "What are the two steps?",
      },
      {
        text: "Some shoppers use a shortcut. If the discount is 20%, the customer still pays the other 80%. So they multiply 50 × 0.80 = 40 and find the sale price in one step.",
        q: "What is the shortcut?",
      },
      {
        text: "Be careful when a store takes two discounts. A 20% discount followed by another 10% discount is not the same as 30% off. The second discount is taken from the lower price, so the total savings are a little less than 30%. For the $50 jacket, the price becomes $40 and then $36, which saves $14, or 28%.",
        q: "Why are two discounts not the same as one bigger discount?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 1, what does the word percent mean?",
        opts: ["per hundred parts", "per ten parts", "per dollar spent"],
        why: [
          "Ten is the base for tenths, but the paragraph says percent means per hundred.",
          "A dollar is a unit of money, and percent is not about dollars.",
        ],
        rat: "Paragraph 1 says the word percent means per hundred.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 1, the price is “reduced by 20 out of every 100 parts.” What does reduced mean?",
        opts: ["made lower", "made equal", "made exact"],
        why: [
          "The price does not become equal to anything; it goes down.",
          "Exact means precise, and the sentence is about the price going down.",
        ],
        rat: "A discount lowers the price, so reduced means made lower.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the table",
        type: "choice",
        prompt: "Use the table. How much money is saved on the $80 item?",
        opts: ["$20", "$60", "$25"],
        why: [
          "Sixty dollars is the sale price, not the amount saved.",
          "Twenty-five is the percent discount, not the amount of dollars saved.",
        ],
        rat: "The original price is $80 and the sale price is $60, so the savings are $20.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Role of a paragraph",
        type: "choice",
        prompt: "What does paragraph 3 add to paragraph 2?",
        opts: [
          "A faster way to find the same sale price",
          "A reason that discounts are always unfair",
          "A different problem about a different store",
        ],
        why: [
          "Nothing in the paragraph says discounts are unfair; it shows a shortcut.",
          "The paragraph uses the same $50 jacket, so it is not a different problem.",
        ],
        rat: "Paragraph 3 shows the shortcut of multiplying by 0.80 to get $40 in one step.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that warns readers about a common mistake.",
        evidence: ["p4"],
        rat: "Paragraph 4 warns that two discounts are not the same as one larger discount.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why does a 20% discount followed by a 10% discount save less than 30%?",
        opts: [
          "The second discount is taken from a lower price.",
          "The second discount is only for special customers.",
          "The store takes the first discount back later.",
        ],
        why: [
          "The text never says the second discount is limited to special customers.",
          "The text shows the price going from $50 to $40 to $36, and the store does not take anything back.",
        ],
        rat: "Paragraph 4 says the second discount is taken from the lower price, so it is a smaller amount of money.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a calculation",
        type: "short",
        prompt:
          "Explain how to find the sale price of a $60 item that is 25% off, using the shortcut from paragraph 3.",
        lookFor: [
          "Says the customer pays 75% of the price",
          "Multiplies 60 by 0.75",
          "States the sale price of $45",
        ],
        rubric: [
          "Uses the shortcut correctly",
          "Shows the calculation",
          "States the answer with units",
        ],
        frame: "If the discount is ___, the customer pays ___. I multiply ___ by ___ and get ___.",
        model:
          "If the discount is 25%, the customer pays the other 75%. I multiply 60 by 0.75 and get $45, so the sale price is $45.",
      },
    ],
    transfer: {
      prompt:
        "A store takes 50% off a $30 shirt and then another 10% off the lower price. Explain what the final price is and why it is not 60% off.",
      lookFor: [
        "Finds $15 after the first discount",
        "Finds $13.50 after the second discount",
        "Explains that the second discount is taken from the lower price",
      ],
      frame:
        "After the first discount the price is ___. The second discount is taken from ___, so the final price is ___.",
    },
    guide: {
      mini: "Use a tape diagram divided into ten equal parts to show 20% as two parts removed. Contrast taking 20% and then 10% of the remaining amount with taking 30% of the original.",
      discussion: [
        "Why is multiplying by 0.80 the same as taking 20% off?",
        "How can you check that a sale price is reasonable?",
        "When have you seen two discounts used together?",
      ],
      misconception:
        "Students often add successive percents; use the $50 jacket to show 40 and then 36, which is 28% off.",
      answerNotes: [
        "Savings on the $80 item: $80 − $60 = $20.",
        "Two discounts: $50 to $40 to $36 means a 28% total discount.",
      ],
      model: "If the discount is 25%, the customer pays 75%. I multiply 60 by 0.75 and get $45.",
    },
    family: family(
      "Read one paragraph at a time. Look at a store flyer together and ask your student to find a sale price using the shortcut. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Miren juntos un folleto de una tienda y pida a su estudiante que halle un precio de oferta con el atajo. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What is 20% of 50?", "Why are two discounts not the same as one bigger discount?"],
    ),
    connections: {
      write: "Write a paragraph that explains how to find a sale price.",
      speak: "Compare two sale prices aloud.",
      listen: "Listen to a dialogue about a discount.",
    },
  },
  {
    id: "silk-road-more-than-silk",
    level: "B",
    title: "The Silk Road: More Than Silk",
    summary:
      "Explore the trade routes that carried goods and ideas across Asia for many centuries.",
    genre: "Informational text (social studies)",
    subject: "Social studies (ancient world)",
    topics: ["trade routes", "cultural exchange"],
    keyUse: "Inform",
    eldStandard: "ELD-SS",
    languageFunction: "Explain how trade routes connected people and spread goods and ideas.",
    languageFeatures: ["cause and effect", "compare and contrast", "domain-specific vocabulary"],
    minutes: 15,
    content: "Explain how the Silk Road moved both goods and ideas between distant places.",
    language:
      "Use because, instead and as a result to connect ideas in a social studies explanation.",
    essential: "How do trade routes change the places they connect?",
    background: "Think about something in your home that came from another country.",
    hook: "A bolt of silk could pass through many hands before it reached its last buyer.",
    purpose: "Read to learn what the Silk Road was and what traveled along it.",
    vocab: [
      ["network", "a group of connected parts", "The Silk Road was a network of routes.", "red"],
      [
        "merchant",
        "a person who buys and sells goods",
        "A merchant sold silk in a market.",
        "comerciante",
      ],
      ["oasis", "a place in a desert with water", "Towns grew around an oasis.", "oasis"],
      [
        "technology",
        "tools or methods people invent to do things",
        "Papermaking was an important technology.",
        "tecnología",
      ],
    ],
    paras: [
      {
        text: "The Silk Road was a network of trade routes that connected China to Central Asia, Persia, and lands near the Mediterranean Sea. It was active for many centuries, beginning about two thousand years ago. Few traders traveled the entire distance. Instead, goods passed from merchant to merchant, and each one added to the price.",
        q: "What was the Silk Road?",
      },
      {
        text: "Silk was the most famous product, but travelers also carried spices, jade, glass, and metalwork. Camels were important because they could cross deserts and carry heavy loads while needing little water. Along the routes, towns grew around oases and markets, where travelers rested and traded.",
        q: "What did travelers carry, and how?",
      },
      {
        text: "Ideas traveled too. Buddhism spread from India across Central Asia into China, and the technology of papermaking moved west over time. Travelers also shared stories, music, and ways of farming. A traveler might return home with new words as well as new goods.",
        q: "What else traveled along the routes?",
      },
      {
        text: "Not every part of the trip was safe. Mountains, deserts, and storms were dangers, and travelers sometimes paid for protection. Even so, the routes stayed busy because the possible rewards were large. Historians study the Silk Road to understand how connected distant places already were long ago.",
        q: "Why did people keep traveling?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to paragraph 1, why did few traders travel the whole Silk Road?",
        opts: [
          "Goods passed from merchant to merchant along the way.",
          "The road was closed during most centuries.",
          "Only travelers from China were allowed on the road.",
        ],
        why: [
          "The text says the routes were active for many centuries, not closed.",
          "The text describes many places along the routes, not one country's travelers.",
        ],
        rat: "Paragraph 1 says few traders traveled the entire distance because goods passed from merchant to merchant.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 1, what does network mean?",
        opts: [
          "a group of connected routes",
          "a single long road across Asia",
          "a kind of market in a town",
        ],
        why: [
          "The text calls the Silk Road a network because it was not one road but many routes.",
          "Markets are described in paragraph 2 as places along the routes, not the network itself.",
        ],
        rat: "A network of trade routes means many routes that are connected.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Compare paragraphs",
        type: "choice",
        prompt: "How is paragraph 3 different from paragraph 2?",
        opts: [
          "Paragraph 2 is about goods and animals, and paragraph 3 is about ideas.",
          "Paragraph 2 is about dangers, and paragraph 3 is about prices.",
          "Paragraph 2 is about China, and paragraph 3 is about the Mediterranean.",
        ],
        why: [
          "Dangers are described in paragraph 4, and prices are mentioned in paragraph 1.",
          "Both paragraphs describe the whole network of routes, not one region.",
        ],
        rat: "Paragraph 2 names goods and camels, while paragraph 3 begins with Ideas traveled too.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why were camels important on the Silk Road?",
        opts: [
          "Parts of the routes crossed dry land where water was scarce.",
          "Camels were the only animals people could ride on the routes.",
          "Merchants wanted to sell camels instead of selling silk goods.",
        ],
        why: [
          "The text does not say camels were the only animals; it says they needed little water.",
          "The text lists silk, spices, jade, glass and metalwork as products, not camels.",
        ],
        rat: "Paragraph 2 says camels could cross deserts and carry heavy loads while needing little water.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that explains what risks travelers faced.",
        evidence: ["p4"],
        rat: "Paragraph 4 lists mountains, deserts and storms as dangers.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's word choice",
        type: "choice",
        prompt:
          "In paragraph 3, the author writes that a traveler might return home “with new words as well as new goods.” What does this show?",
        opts: [
          "Travel changed people's language and ideas as well as their belongings.",
          "Travelers usually forgot the language that they spoke back at home.",
          "New goods were always more important to travelers than new words.",
        ],
        why: [
          "The text does not say travelers forgot their own language, only that they learned new words.",
          "The author uses as well as to give both new words and goods weight, not to rank them.",
        ],
        rat: "The phrase as well as shows that travelers brought home new ideas in addition to goods.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain why the Silk Road was about more than trading goods. Use one example from the text.",
        lookFor: [
          "States that ideas or technology also traveled",
          "Uses an example such as Buddhism or papermaking",
          "Connects the example to the claim",
        ],
        rubric: [
          "Makes a clear claim",
          "Uses an accurate detail",
          "Explains how the detail supports the claim",
        ],
        frame:
          "The Silk Road was about more than goods because ___. For example, ___ traveled from ___ to ___.",
        model:
          "The Silk Road was about more than goods because ideas also traveled. For example, Buddhism spread from India into China, and papermaking technology moved west.",
      },
    ],
    transfer: {
      prompt:
        "Today, products and ideas also travel quickly through the internet and by plane. Compare one way the modern world is like the Silk Road and one way it is different.",
      lookFor: [
        "Names one similarity such as goods and ideas moving between places",
        "Names one difference such as speed",
        "Uses a comparison word such as like, but or whereas",
      ],
      frame: "Like the Silk Road, ___. However, ___ is different because ___.",
    },
    guide: {
      mini: "Show a map of Eurasia and trace the network with colored string. Ask students to predict which goods would reach which towns and discuss why merchants passed goods along rather than traveling the full route.",
      discussion: [
        "Why might goods become more expensive as they pass through many merchants?",
        "How can an idea spread without a person carrying an object?",
        "What does it mean that distant places were already connected?",
      ],
      misconception:
        "Students may think the Silk Road was a single paved road; the text calls it a network of routes.",
      answerNotes: [
        "Question 1: the text says goods passed from merchant to merchant.",
        "Question 6: the author's phrase as well as signals that ideas mattered along with goods.",
      ],
      model:
        "The Silk Road was about more than goods because ideas also traveled. For example, Buddhism spread from India into China, and papermaking moved west.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to name something that traveled along the Silk Road and something that did not need to be carried in a bag. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que nombre algo que viajó por la Ruta de la Seda y algo que no necesitaba llevarse en una bolsa. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What goods traveled along the Silk Road?", "What ideas or inventions traveled along it?"],
    ),
    connections: {
      write: "Write a paragraph about how the Silk Road changed the places it connected.",
      speak: "Explain aloud what traveled along the Silk Road.",
      listen: "Listen to a lecture about trade routes.",
    },
  },
];

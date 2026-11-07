// Grades 6-8 publisher pass, Reading Room lessons, batch 5b: procedural text, historical fiction, memoir, poetry, argument, author's craft. Original EduWonderLab texts.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "scale-drawing-desk-steps",
    level: "B",
    title: "How to Make a Scale Drawing of Your Desk",
    summary:
      "Follow four steps to turn real measurements into a scale drawing, and explain why each step matters.",
    genre: "Procedural text (instructions with math)",
    subject: "Math and English language arts",
    topics: ["scale drawings", "following instructions", "measurement"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain the order of steps and the reason for a calculation.",
    languageFeatures: ["sequence words", "commands", "ratio language"],
    minutes: 18,
    content:
      "Follow multi-step instructions and use a scale to turn real lengths into drawing lengths.",
    language:
      "Use first, next, then and finally to explain steps, and use because to give a reason.",
    essential: "How do clear steps help us turn a real object into a small drawing?",
    background: "Think about a floor plan or a map. How can a small picture show a big space?",
    hook: "A desk that is 120 centimeters long can be drawn only 12 centimeters long. How?",
    purpose: "Read to find out the four steps of a scale drawing and why each step is needed.",
    vocab: [
      [
        "scale drawing",
        "a smaller picture of a real object where every length is changed by the same amount",
        "The architect made a scale drawing of the room.",
        "dibujo a escala",
      ],
      [
        "scale",
        "a rule that tells how much real length one unit on the drawing stands for",
        "The scale is 1 centimeter to 10 centimeters.",
        "escala",
      ],
      [
        "width",
        "the distance across a shape from one side to the other",
        "The width of the desk is 60 centimeters.",
        "ancho",
      ],
      [
        "label",
        "to write a name or number on something",
        "Label each side with its length.",
        "rotular",
      ],
    ],
    paras: [
      {
        text: "A scale drawing is a smaller picture of a real object in which every length is shrunk by the same amount. Architects and mapmakers use scale drawings, and you can make one of your own desk with a ruler, graph paper, and a pencil. Follow these steps in order.",
        q: "What is a scale drawing?",
      },
      {
        text: "Step 1: Measure the real desk. Lay a ruler or measuring tape along the longest edge and write down the length in centimeters. Then measure the shorter edge, the width. Suppose your desk is 120 centimeters long and 60 centimeters wide.",
        q: "What do you measure first?",
      },
      {
        text: "Step 2: Choose a scale. A scale tells how much each centimeter on paper stands for in real life. Let's use 1 centimeter on the paper for every 10 centimeters on the desk. Write the scale at the top of your paper so that anyone can read it.",
        q: "What does a scale tell you?",
      },
      {
        text: "Step 3: Change each real measurement into a drawing measurement. Divide by 10, because each centimeter on paper stands for 10 real centimeters. The length becomes 120 ÷ 10 = 12 centimeters, and the width becomes 60 ÷ 10 = 6 centimeters. Remember to use the same scale for both measurements.",
        q: "How do you change the measurements?",
      },
      {
        text: "Step 4: Draw and label. Use a ruler to draw a rectangle that is 12 centimeters long and 6 centimeters wide. Write the real measurements beside each side, with their units. Finally, check your work: measure the drawing, multiply each side by 10, and make sure the answers match the real desk. If they do not, find the mistake and fix it.",
        q: "How do you finish and check?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What do you do in Step 1?",
        opts: [
          "Measure the real desk.",
          "Choose a scale for the drawing.",
          "Draw a rectangle on the paper.",
        ],
        why: [
          "Choosing a scale is Step 2, and it comes after the real desk has been measured.",
          "Drawing the rectangle is the last step, after the measurements have been changed.",
        ],
        rat: "Paragraph 2 says Step 1 is to measure the real desk, writing the length and width in centimeters.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, what does the word scale mean?",
        opts: [
          "a comparison of drawing length to real length",
          "a tool that weighs heavy objects in a store",
          "a list of everything that needs measuring",
        ],
        why: [
          "In this passage scale is about the size of a drawing, not about weighing objects.",
          "The scale does not list items to measure; it tells how a paper centimeter relates to a real distance.",
        ],
        rat: "Paragraph 3 says a scale tells how much each centimeter on paper stands for in real life.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of steps",
        type: "order",
        prompt: "Put these actions in the order the instructions give them.",
        items: [
          "Measure the length and width of the desk.",
          "Choose a scale and write it on the paper.",
          "Divide each real measurement by 10.",
          "Draw the rectangle and label its sides.",
        ],
        rat: "Paragraphs 2 through 5 give the steps in this order: measure, choose a scale, divide by 10, and then draw and label.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Apply the calculation",
        type: "choice",
        prompt:
          "A bookshelf is 150 centimeters wide. Using the same scale, how wide is it on the drawing?",
        opts: ["15 centimeters", "1,500 centimeters", "140 centimeters"],
        why: [
          "Multiplying by 10 would give a longer length, but to go from real size to drawing size you divide.",
          "Subtracting 10 does not follow the scale, because each drawing centimeter stands for 10 real centimeters.",
        ],
        rat: "Step 3 says to divide real measurements by 10, so 150 ÷ 10 = 15 centimeters.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt:
          "Why does the writer begin each step with a label such as “Step 1” and then give a command?",
        opts: [
          "The labels show the order and tell the reader what to do.",
          "The labels make the text sound like a story about a desk.",
          "The labels show that the steps can be done in any order.",
        ],
        why: [
          "Numbered labels show a fixed order and do not tell a story.",
          "The first paragraph says to follow the steps in order, so the order matters.",
        ],
        rat: "Each step starts with a number and a verb, such as Measure, Choose, Change and Draw, which makes the order and the action clear.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why must the same scale be used for the length and the width?",
        opts: [
          "Otherwise the drawing would not match the shape of the real desk.",
          "Otherwise the paper would run out before the drawing was done.",
          "Otherwise the pencil lines would be too thick to read clearly.",
        ],
        why: [
          "The size of the paper is a separate matter; the same scale keeps both measurements matching.",
          "The rule is about matching the real measurements, not about how the pencil lines look.",
        ],
        rat: "Step 3 reminds the reader to use the same scale for both measurements, so that the length and width keep the same relationship as the real desk.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Apply the instructions",
        type: "short",
        prompt:
          "A friend draws a desk that is 120 centimeters long on the paper. Explain what went wrong and how to fix it. Use the scale from the text.",
        lookFor: [
          "Says the friend forgot to use the scale",
          "Explains that each centimeter on paper stands for 10 real centimeters",
          "Gives the correct drawing length of 12 centimeters",
        ],
        rubric: [
          "Names the mistake",
          "Uses the scale correctly",
          "Gives the correct number with a unit",
        ],
        frame:
          "The friend forgot ___. Each centimeter on the paper stands for ___, so the drawing should be ___ long.",
        model:
          "The friend forgot to use the scale. Each centimeter on the paper stands for 10 real centimeters, so the drawing should be 120 ÷ 10 = 12 centimeters long.",
      },
    ],
    transfer: {
      prompt:
        "Your bookshelf is 150 centimeters wide and 30 centimeters deep. Using the same scale, explain how to make a drawing of its top view.",
      lookFor: [
        "Divides each measurement by 10",
        "Finds 15 centimeters and 3 centimeters",
        "Says to draw a rectangle and label the real measurements",
      ],
      frame:
        "First I divide ___ by ___ to get ___. Then I divide ___ by ___ to get ___. Finally I ___.",
    },
    guide: {
      mini: "Make a ratio table on the board with rows for 1 cm to 10 cm and 12 cm to 120 cm. Ask students which operation turns the real length into the drawing length and why.",
      discussion: [
        "Why do we divide in Step 3 instead of multiplying?",
        "What could go wrong if a student skips Step 1?",
        "How could you change the scale so that the drawing is larger?",
      ],
      misconception:
        "Students may multiply by the scale number to go from real to drawing; the table shows that the drawing is smaller, so each real length is divided.",
      answerNotes: [
        "Question 4: 150 ÷ 10 = 15; multiplying gives 1,500, a common error.",
        "Question 3: the steps are measure, choose a scale, divide by 10, draw and label.",
      ],
      model:
        "The friend forgot to use the scale. Each centimeter on paper stands for 10 real centimeters, so the drawing should be 12 centimeters long.",
    },
    family: family(
      "Read the steps one at a time. Ask your student to measure something at home, such as a book, and explain how a scale drawing would shrink it. You can talk in any language, then ask for one sentence in English.",
      "Lean los pasos uno a la vez. Pida a su estudiante que mida algo en casa, como un libro, y explique cómo lo reduciría un dibujo a escala. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What is Step 3, and why do we divide?",
        "What does a scale of 1 centimeter to 10 centimeters mean?",
      ],
    ),
    connections: {
      write: "Write step-by-step instructions for making a scale drawing of a room.",
      speak: "Explain the four steps aloud using first, next, then and finally.",
      listen: "Listen to instructions and put the steps in order.",
    },
  },
  {
    id: "evening-class-1912",
    level: "C",
    title: "The Evening Class on Orchard Street, 1912 (historical fiction)",
    summary:
      "In this invented scene set in 1912, a girl chooses how to help her father in his first English class.",
    genre: "Historical fiction (invented scene)",
    subject: "English language arts and social studies",
    topics: ["setting", "character motivation", "theme"],
    keyUse: "Narrate",
    eldStandard: "ELD-SS",
    languageFunction: "Explain a character's choice and the theme it shows.",
    languageFeatures: ["setting details", "character feelings", "figurative language"],
    minutes: 20,
    content: "Explain how setting and a character's choices work together to show a theme.",
    language: "Use because, so that and shows that to explain why a character acts.",
    essential: "How can helping someone mean knowing when to step back?",
    background: "Many adults who move to a new country learn a new language at evening classes.",
    hook: "Esther knows the answer to the teacher's question, but she keeps her hand almost down. Why?",
    purpose: "Read to find out why Esther holds back and what her father does.",
    vocab: [
      [
        "pushcart",
        "a small cart pushed by hand to sell goods in the street",
        "Esther's mother sold goods from a pushcart.",
        "carrito de venta",
      ],
      ["tailor", "a person who makes or fixes clothes", "A tailor sat in the front row.", "sastre"],
      [
        "accent",
        "the way a person's speech sounds because of the language or place they know best",
        "His accent was thick, but his words were clear.",
        "acento",
      ],
      [
        "eagerly",
        "with strong, excited interest",
        "She did not answer too eagerly.",
        "con entusiasmo",
      ],
    ],
    paras: [
      {
        text: "New York, October 1912. After a long day at her mother's pushcart, thirteen-year-old Esther climbed the steps of the school on Orchard Street, holding her father's hand. In his pocket was a small notebook that he had bought with his own coins. Tonight was his first evening of English class, and he had asked his daughter to come with him, though she already spoke English at school.",
        q: "Where and when does the story happen, and who is in it?",
      },
      {
        text: "The classroom smelled of chalk and wet wool. Rows of adults sat squeezed into desks built for children: tailors, bakers, two sisters who spoke Italian, and a gray-haired man in a worn cap. At the front, Miss Dunleavy wrote one word on the board in careful letters: tomorrow. “Who can tell me what this means?” she asked. No one answered. Esther's father stared at his shoes.",
        q: "What happens in the classroom?",
      },
      {
        text: "Esther knew the answer, but she remembered how, only a week earlier, a shopkeeper had told her father to “speak English” and had not waited for him to find his words. She feared that if she answered too eagerly, her father would feel smaller. So she raised her hand halfway and then lowered it.",
        q: "Why does Esther hold back?",
      },
      {
        text: "Slowly, her father lifted his own hand. In his first language, he whispered his answer to Esther, and she whispered it back to him in English. Then he turned to the teacher and spoke the words himself: “The day after today.” His accent was thick, but every word stood upright.",
        q: "What does Esther's father do?",
      },
      {
        text: "Miss Dunleavy smiled. “Exactly right, Mr. Lazar.” Esther felt something loosen in her chest. On the walk home, her father held the notebook against his coat. “Tomorrow,” he said into the cold air, testing the word like a coin. “Tomorrow, I will say it to the baker.” Esther laughed and squeezed his hand, and the streetlamps seemed to glow brighter.",
        q: "How does the story end?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "Why did Esther go with her father to the school on Orchard Street?",
        opts: [
          "He asked her to come to his first English class.",
          "Her teacher told her to practice English there.",
          "She had to meet her mother after work there.",
        ],
        why: [
          "Esther already speaks English at school, and her own teacher is never mentioned in the story.",
          "Her mother worked at the pushcart earlier in the day, and the text never says they meet at the school.",
        ],
        rat: "Paragraph 1 says it was his first evening of English class and that he had asked his daughter to come with him.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 3, Esther fears her father “would feel smaller.” What does smaller mean here?",
        opts: [
          "less proud and less capable",
          "shorter than the people around him",
          "hungrier after the long day",
        ],
        why: [
          "The sentence is about how he would feel, not about how tall he is.",
          "The passage never mentions hunger; the worry is about his feelings.",
        ],
        rat: "Esther remembers the shopkeeper who did not wait for her father's words, so smaller means less proud and less capable.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why does Esther raise her hand halfway and then lower it?",
        opts: [
          "She wants to give her father the chance to answer first.",
          "She is not sure what the word tomorrow means.",
          "She is afraid that Miss Dunleavy will scold her.",
        ],
        why: [
          "Paragraph 3 says Esther knew the answer, so she is not unsure about the word.",
          "Nothing in the scene shows the teacher scolding anyone; Miss Dunleavy is kind.",
        ],
        rat: "Esther knows the answer but fears her father would feel smaller, so she lowers her hand to leave room for him.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Figurative language",
        type: "choice",
        prompt:
          "The author says that every word of her father's answer “stood upright.” What does this suggest?",
        opts: [
          "He spoke with dignity and confidence.",
          "His accent made the words hard to hear.",
          "He was standing up from his desk.",
        ],
        why: [
          "The author says his accent was thick, but stood upright is about pride, and not about being hard to hear.",
          "The phrase describes how the words sounded and does not say that he left his desk.",
        ],
        rat: "Words that stand upright are strong and steady, which shows that he spoke with dignity even with a thick accent.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select supporting details",
        type: "multi",
        prompt: "Which two details give the reader the time and place of the story?",
        opts: [
          "The opening line names New York and October 1912.",
          "The school is on Orchard Street.",
          "The teacher writes the word tomorrow on the board.",
          "Esther laughs and squeezes her father's hand.",
        ],
        ans: 2,
        why: [
          "Writing the word is an action in the plot, and it does not say when or where the story happens.",
          "Squeezing a hand shows a feeling, not a time or a place.",
        ],
        rat: "Paragraph 1 gives the city, the month and the year, and names the school's street, so those are the setting details.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Why the author included a detail",
        type: "choice",
        prompt: "Why does the author include the memory of the shopkeeper in paragraph 3?",
        opts: [
          "To explain why Esther hesitates to answer",
          "To show that the shopkeeper became her friend",
          "To prove that English is an easy language to learn",
        ],
        why: [
          "The shopkeeper was unkind and does not appear again, so he does not become a friend.",
          "The memory shows how hard speaking English can feel to her father, not how easy it is.",
        ],
        rat: "The memory is the reason Esther fears her father would feel smaller, so it explains her choice.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain character and theme",
        type: "short",
        prompt:
          "How does Esther show respect for her father? Use two details from the story to explain.",
        lookFor: [
          "Says Esther lets her father answer for himself",
          "Uses two details such as lowering her hand and whispering the English words",
          "Explains how the details show respect or care",
        ],
        rubric: [
          "Makes a clear claim about Esther",
          "Uses two accurate details",
          "Connects the details to respect",
        ],
        frame: "Esther shows respect when she ___ and when she ___. This shows that ___.",
        model:
          "Esther shows respect when she lowers her hand so her father can answer, and when she whispers the English words to him without speaking for him. This shows that she wants him to feel proud of his own voice.",
      },
    ],
    transfer: {
      prompt:
        "Write about a time when you helped someone by stepping back instead of taking over. Explain what you did and how it changed the moment.",
      lookFor: [
        "Describes the situation",
        "Explains what you chose not to do",
        "Shows how the other person felt or changed",
      ],
      frame: "I wanted to ___, but I decided to ___ because ___. Then ___.",
    },
    guide: {
      mini: "Explain that this scene is invented for the lesson and is not the story of a real person. Ask students to list the setting clues in paragraphs 1 and 2 and then discuss why the setting matters.",
      discussion: [
        "Why does the author describe the desks as built for children?",
        "What does Esther learn about helping someone?",
        "How would the story change if Esther answered the question herself?",
      ],
      misconception:
        "Students may think Esther is shy or unsure; point out that paragraph 3 says she knew the answer.",
      answerNotes: [
        "Question 5: the date and the school's street give the time and place.",
        "Question 3: Esther lowers her hand to leave room for her father.",
      ],
      model:
        "Esther shows respect when she lowers her hand so her father can answer, and when she whispers the English words to him. This shows that she wants him to feel proud.",
    },
    family: family(
      "This scene was invented for the lesson. Read one paragraph at a time and ask your student why Esther keeps her hand almost down. You can talk in any language, then ask for one sentence in English.",
      "Esta escena fue inventada para la lección. Lean un párrafo a la vez y pregunte a su estudiante por qué Esther casi no levanta la mano. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["Why does Esther let her father answer?", "How does her father feel at the end?"],
    ),
    connections: {
      write: "Write a scene about someone learning a new skill with help from a friend.",
      speak: "Explain aloud why Esther holds back.",
      listen: "Listen to a story and name the setting clues.",
    },
  },
  {
    id: "grandfather-market-scale",
    level: "C",
    title: "My Grandfather's Market Scale (a memoir)",
    summary:
      "A narrator looks back on summer mornings at a vegetable stall, where unit prices and honesty were taught together.",
    genre: "Memoir (first-person narrative)",
    subject: "English language arts and math",
    topics: ["first-person narrator", "unit price", "reflection"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Explain what a narrator learns and how the writer shows it.",
    languageFeatures: ["first-person voice", "reflection", "figurative language"],
    minutes: 20,
    content: "Explain how a memoir uses a memory and an object to show what the narrator learned.",
    language: "Use looking back and what I learned phrases to connect a memory to a lesson.",
    essential: "How can one ordinary object carry a lesson for a lifetime?",
    background: "Think about an object in your home that reminds you of someone you love.",
    hook: "A girl freezes when a customer asks for a pound and a half. What does her grandfather do?",
    purpose: "Read to find out what the narrator learns from the scale and from Grandfather.",
    vocab: [
      [
        "balance scale",
        "a tool that compares the weight of two things",
        "The balance scale tipped when the tomatoes were heavier.",
        "balanza",
      ],
      [
        "customer",
        "a person who buys things from a store or stand",
        "The customer asked for two pounds.",
        "cliente",
      ],
      [
        "trust",
        "a strong belief that someone is honest and fair",
        "Customers had trust in Grandfather.",
        "confianza",
      ],
      [
        "tempted",
        "wanting to do something that you know you should not do",
        "I am tempted to take a shortcut.",
        "tentado",
      ],
    ],
    paras: [
      {
        text: "Every summer when I was eleven, I spent my mornings at my grandfather's vegetable stall at the edge of the city market. He was a quiet man with large, patient hands, and in the center of his table sat the object he loved most: a brass balance scale, dented on one side, with a set of iron weights lined up beside it like a row of small gray bells.",
        q: "What is the setting, and what is the scale?",
      },
      {
        text: "My first job was to read the price sign, which said TOMATOES, $1.50 A POUND. When a customer asked for two pounds, I knew the cost was three dollars. When someone wanted a pound and a half, I froze. Grandfather never rescued me. He only asked, “Half a pound costs half as much. What is half of a dollar fifty?” I stared at the sign until the answer arrived: seventy-five cents.",
        q: "What is the narrator's first job, and what goes wrong?",
      },
      {
        text: "By August, I could work out almost any order in my head. Three pounds cost $4.50. Five pounds cost $7.50. One afternoon a woman asked for three and a half pounds, and I answered, “$5.25,” in a steady voice. Grandfather raised one eyebrow, which from him was a trophy.",
        q: "How does the narrator grow?",
      },
      {
        text: "What I remember most, though, is how he used the scale. He always let the tomatoes tip the pan a little past the weight, so every bag held slightly more than the customer paid for. “A scale should never make a person feel cheated,” he told me. “The extra costs me a few cents. The trust is worth much more.”",
        q: "How does Grandfather use the scale?",
      },
      {
        text: "Grandfather died when I was in college, and the scale now sits on my kitchen shelf. I never use it to weigh anything. Instead, when I am tempted to take a shortcut or to give a little less than I promised, I look at it, and I hear his voice. Math taught me how to count what things cost. He taught me what honesty is worth.",
        q: "What does the scale mean to the narrator now?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What object did Grandfather love most?",
        opts: ["a brass balance scale", "an iron cash box", "a wooden price sign"],
        why: [
          "The narrator mentions iron weights but never a cash box on the table.",
          "The price sign is the narrator's first job to read, but Grandfather's favorite object is something else.",
        ],
        rat: "Paragraph 1 says the object he loved most was a brass balance scale.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, the narrator says, “I froze.” What does froze mean?",
        opts: [
          "stopped, unsure how to answer",
          "shivered in the cold morning air",
          "laughed at the price on the sign",
        ],
        why: [
          "The scene is on a summer morning, so the narrator is not cold; froze describes being stuck.",
          "The narrator is nervous, not amused, and the next sentences say that she stared at the sign.",
        ],
        rat: "The narrator cannot find the cost of a pound and a half, so she stops, which is what froze means here.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Apply the calculation",
        type: "choice",
        prompt:
          "A customer buys 4 pounds of tomatoes at the price on the sign. How much does it cost?",
        opts: ["$6.00", "$5.50", "$7.50"],
        why: [
          "Five dollars fifty adds 4 to the price instead of multiplying the price by 4.",
          "Seven fifty is the cost of five pounds, which paragraph 3 gives.",
        ],
        rat: "At $1.50 a pound, 4 pounds cost 4 × 1.50 = $6.00.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why does Grandfather not give the answer when the narrator freezes?",
        opts: [
          "He wants her to work out the answer herself.",
          "He does not know how to find half of a dollar fifty.",
          "He is angry that she cannot solve the problem.",
        ],
        why: [
          "Grandfather asks a guiding question and later raises an eyebrow in approval, so he knows the math.",
          "Grandfather speaks kindly and never shows anger; he asks a question that helps her.",
        ],
        rat: "He asks, “What is half of a dollar fifty?” which guides her to the answer without saying it.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Figurative language",
        type: "choice",
        prompt:
          "The narrator says Grandfather's raised eyebrow “was a trophy.” What does this comparison show?",
        opts: [
          "His small sign of approval felt like a rare prize.",
          "He handed her a real trophy for her good work.",
          "He wanted her to win a contest at the market.",
        ],
        why: [
          "The comparison is about how much the look meant to her, and Grandfather gives no object.",
          "The text never mentions a contest; it describes one raised eyebrow.",
        ],
        rat: "Grandfather was a quiet man, so his raised eyebrow was a rare sign of praise that she treasured like a prize.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "How does paragraph 5 change the focus of the memoir?",
        opts: [
          "It moves from childhood math skills to a lasting lesson about honesty.",
          "It moves from the market to a story about college classes.",
          "It moves from the scale to a list of Grandfather's prices.",
        ],
        why: [
          "Paragraph 5 mentions college only to say when Grandfather died, and it does not describe classes.",
          "The prices appear in paragraphs 2 and 3, and paragraph 5 does not list them.",
        ],
        rat: "Paragraph 5 looks back from adult life and ends with what Grandfather taught about honesty, beyond the math.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain what a narrator learns",
        type: "short",
        prompt:
          "What did the narrator learn from Grandfather besides how to figure out prices? Use one detail from paragraph 4 or 5.",
        lookFor: [
          "States a lesson such as honesty or trust",
          "Uses a detail such as the extra tomatoes or the scale on the shelf",
          "Connects the detail to the lesson",
        ],
        rubric: [
          "Names a clear lesson",
          "Uses an accurate detail",
          "Explains how the detail shows the lesson",
        ],
        frame: "The narrator also learned that ___. For example, ___. This shows ___.",
        model:
          "The narrator also learned that honesty is worth more than a few cents. For example, Grandfather let the tomatoes tip the scale a little so that no customer would feel cheated. This shows that trust is more valuable than the extra money.",
      },
    ],
    transfer: {
      prompt:
        "At a stand, strawberries cost $3 for 2 pounds. Explain how to find the cost of 5 pounds, and tell why the unit price makes this easier.",
      lookFor: [
        "Finds the unit price of $1.50 per pound",
        "Multiplies 5 by 1.50 to get $7.50",
        "Explains that one pound is the common unit for comparing",
      ],
      frame:
        "First I find the cost of one pound, which is ___. Then I multiply ___ by ___ to get ___.",
    },
    guide: {
      mini: "Make a ratio table for 1, 2, 3, 3.5 and 5 pounds at $1.50 a pound and check the narrator's answers. Then ask which paragraph is about math and which is about character.",
      discussion: [
        "Why does the author tell us about the scale before the price sign?",
        "How does the narrator's voice change between paragraphs 2 and 5?",
        "What object reminds you of a lesson from someone you know?",
      ],
      misconception:
        "Students may think a memoir only lists events; ask them to find the sentence where the narrator reflects on what the memory means.",
      answerNotes: [
        "Question 3: 4 × 1.50 = 6.00; 5.50 comes from adding 4 to 1.50.",
        "Question 7: look for honesty or trust and the detail about extra tomatoes.",
      ],
      model:
        "The narrator also learned that honesty is worth more than a few cents. Grandfather let the tomatoes tip the scale so that no customer felt cheated.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain how Grandfather helped the narrator find the cost of a pound and a half. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique cómo el abuelo ayudó a la narradora a encontrar el costo de una libra y media. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What did Grandfather do with the scale?", "What does the scale remind the narrator of?"],
    ),
    connections: {
      write: "Write a short memoir about an object that holds a lesson.",
      speak: "Tell a partner about an object that reminds you of a person.",
      listen: "Listen to a memoir and name what the narrator learned.",
    },
  },
  {
    id: "what-the-orchard-knows-poem",
    level: "C",
    title: "What the Orchard Knows (a poem)",
    summary: "An original poem that uses a winter orchard to explore patience, growth and trust.",
    genre: "Poetry",
    subject: "English language arts",
    topics: ["figurative language", "theme", "repetition and structure"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Explain how a poet uses images, repetition and structure to build a theme.",
    languageFeatures: ["metaphor and simile", "repetition", "stanza structure"],
    minutes: 18,
    content: "Analyze how images, repetition and a shift in focus build the theme of a poem.",
    language: "Use the words suggests, shifts and builds to explain how a poem works.",
    essential: "What can waiting teach us about growing?",
    background: "Think about a time when you had to wait and trust that something good was coming.",
    hook: "The orchard looks empty in January. The poet says it knows something. What?",
    purpose: "Read to find what the orchard knows and how the speaker's feelings connect to it.",
    vocab: [
      [
        "bud",
        "a small swelling on a branch that will open into a flower or leaf",
        "The buds stay closed until spring.",
        "brote",
      ],
      ["bare", "without covering or leaves", "The branches were bare in winter.", "desnudo"],
      ["patient", "able to wait calmly", "Roots are patient in the winter.", "paciente"],
      [
        "refrain",
        "a line or word that repeats in a poem or song",
        "The word wait is the refrain of stanza 3.",
        "estribillo",
      ],
    ],
    paras: [
      {
        text: "In January the orchard looks like a drawing erased. The trees are black thread against a white sheet, and every branch holds its hands out empty, as if it had given everything away.",
        q: "What does the orchard look like?",
      },
      {
        text: "Do not believe it. Under the hard ground, roots are reading the dark. They drink in the slow news of the snowmelt and pass it upward, quietly, like secrets in a classroom.",
        q: "What is happening underground?",
      },
      {
        text: "Wait, says the orchard. Wait, says the wind that combs the branches. Wait, say the buds, tightly closed, small as the tips of sleeping fists.",
        q: "Who says wait?",
      },
      {
        text: "Then one morning, without a trumpet, the whole orchard exhales. Pink spills down the branches like paint from an overturned jar, and the air begins to hum with bees.",
        q: "What changes?",
      },
      {
        text: "I think of all the winters I have stood in, feeling bare and unfinished, believing that nothing in me was growing. I think of how patient the roots are, and how they never once asked the sky for proof.",
        q: "What does the speaker think about?",
      },
      {
        text: "So when the cold comes, I will take my place in the orchard of myself. I will stand still, and wait, and trust the dark, because the dark is where the spring is practicing.",
        q: "What will the speaker do?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to stanza 2, what are the roots doing under the hard ground?",
        opts: [
          "Taking in water from melting snow",
          "Giving up on the cold winter",
          "Pushing the branches farther up",
        ],
        why: [
          "The poet says the roots are working in the dark, so they have not given up.",
          "The stanza says the roots pass news upward; it does not say they push the branches.",
        ],
        rat: "Stanza 2 says the roots drink in the news of the snowmelt and pass it upward.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In stanza 5, the speaker feels “bare and unfinished.” What does bare mean?",
        opts: [
          "without covering or decoration",
          "full of bright and shining colors",
          "covered in a thick layer of snow",
        ],
        why: [
          "The speaker feels unfinished, which does not match being full of bright color.",
          "The speaker describes feelings and not weather, so snow is not what the word means here.",
        ],
        rat: "The speaker compares the feeling of being bare to the bare winter branches, so bare means without covering.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Figurative language",
        type: "choice",
        prompt:
          "In stanza 1, the orchard looks like “a drawing erased.” What does this comparison suggest?",
        opts: [
          "The trees look faint and empty, as if something was rubbed out.",
          "The trees look bright and freshly drawn with new colored pencils.",
          "The trees look crowded together like a busy picture of a city.",
        ],
        why: [
          "Erased drawings lose their color, so the comparison does not point to bright new lines.",
          "The stanza says the branches hold out empty hands, so the trees are not crowded and busy.",
        ],
        rat: "The black thread against a white sheet and the empty hands show an orchard that looks emptied out, like a drawing that was erased.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Repetition and sound",
        type: "choice",
        prompt: "Stanza 3 repeats the word “Wait.” What effect does the repetition have?",
        opts: [
          "It creates a steady, chant-like sound that stresses patience.",
          "It makes the poem sound angry and very demanding.",
          "It shows that the speaker has forgotten what to say.",
        ],
        why: [
          "The voices are the orchard, the wind and the buds, and they speak calmly, not angrily.",
          "The repeated word is on purpose, and the next stanza shows what waiting brings.",
        ],
        rat: "Each line begins with Wait and a new speaker, which builds a calm chant that supports the theme of patience.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Structure of a poem",
        type: "choice",
        prompt: "How do stanzas 5 and 6 differ from stanzas 1 through 4?",
        opts: [
          "They turn from the orchard to the speaker's own life.",
          "They describe the orchard in summer instead of winter.",
          "They add a new character who plants more trees.",
        ],
        why: [
          "Stanza 4 ends in spring, and the last two stanzas talk about the speaker and not about summer.",
          "Stanzas 5 and 6 use I, and no new character appears in the poem.",
        ],
        rat: "Stanzas 5 and 6 use I and compare the speaker's own winters to the orchard's.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What does the line “the dark is where the spring is practicing” suggest?",
        opts: [
          "Quiet, hard times can be when growth is being prepared.",
          "Winter nights are the best time to plant new trees.",
          "Spring will never arrive for people who fear the dark.",
        ],
        why: [
          "The poem is about waiting and trust and does not give advice about when to plant.",
          "The speaker says to trust the dark, so fear of the dark is not the message of the poem.",
        ],
        rat: "Stanza 2 shows roots working in the dark before spring, so the dark is where growth is being prepared.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a theme",
        type: "short",
        prompt:
          "Explain the theme of the poem. Use one detail about the orchard and one detail from stanza 5 or 6.",
        lookFor: [
          "States a theme such as growth can happen quietly while we wait",
          "Uses a detail about the orchard such as the roots or the buds",
          "Uses a detail from the speaker's own life in stanza 5 or 6",
        ],
        rubric: [
          "Names a clear theme",
          "Uses an orchard detail and a speaker detail",
          "Connects the details to the theme",
        ],
        frame: "The theme is that ___. In the orchard, ___. In stanza ___, the speaker ___.",
        model:
          "The theme is that growth can happen quietly while we wait. In the orchard, the roots keep working under the hard ground even though the branches look empty. In stanza 6, the speaker decides to trust the dark because spring is practicing there.",
      },
    ],
    transfer: {
      prompt:
        "Write a short metaphor that compares a time of waiting in your own life to the orchard in winter. Explain what the two have in common.",
      lookFor: [
        "Writes a metaphor that says one thing is another",
        "Names what waiting and the winter orchard have in common",
        "Uses at least one image from the senses",
      ],
      frame: "My waiting is a ___ because ___. Underneath, ___.",
    },
    guide: {
      mini: "Read the poem aloud and ask students to mark the stanza where the poem turns from the orchard to the speaker. Then ask what the first four stanzas prepare the reader to feel.",
      discussion: [
        "How does the poet make the roots seem alive and thoughtful?",
        "What does the word refrain mean, and where does the poem use one?",
        "How is the speaker like the orchard?",
      ],
      misconception:
        "Students may think the poem is only about trees; ask what the last two stanzas say about the speaker.",
      answerNotes: [
        "Question 5: stanzas 5 and 6 move from the orchard to the speaker's own life.",
        "Question 6: the dark is where growth is being prepared, as the roots show in stanza 2.",
      ],
      model:
        "The theme is that growth can happen quietly while we wait. The roots work under the ground, and the speaker decides to trust the dark.",
    },
    family: family(
      "Read the poem aloud together, one stanza at a time. Ask your student what the orchard knows and how the speaker feels about waiting. You can talk in any language, then ask for one sentence in English.",
      "Lean el poema en voz alta juntos, una estrofa a la vez. Pregunte a su estudiante qué sabe el huerto y qué siente el hablante sobre esperar. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What are the roots doing in winter?", "What does the speaker decide to do?"],
    ),
    connections: {
      write: "Write a short poem that uses a season to show how a person feels.",
      speak: "Read a stanza aloud and explain what one comparison means.",
      listen: "Listen to a poem and notice what the poet repeats.",
    },
  },
  {
    id: "walking-school-bus-speech",
    level: "C",
    title: "Let's Start a Walking School Bus (a persuasive speech)",
    summary:
      "A student speaks to parents and teachers, uses survey numbers and answers a safety worry.",
    genre: "Argument (persuasive speech)",
    subject: "English language arts and math",
    topics: ["claim and evidence", "counterclaim and rebuttal", "rhetorical techniques"],
    keyUse: "Argue",
    eldStandard: "ELD-LA",
    languageFunction: "Explain how a speaker uses evidence and techniques to persuade an audience.",
    languageFeatures: ["rhetorical devices", "counterclaim", "direct address"],
    minutes: 20,
    content:
      "Analyze how a speaker uses numbers, repetition and a response to a worry to persuade.",
    language: "Use the words appeals, evidence and responds to explain how a speech persuades.",
    essential: "How does a speaker earn an audience's trust?",
    background:
      "A walking school bus is a group of students who walk to school together with adults.",
    hook: "What would your morning be like if you walked to school with your friends?",
    purpose: "Read to find the speaker's claim, her evidence and how she answers a safety worry.",
    vocab: [
      [
        "volunteer",
        "a person who helps without being paid",
        "A parent could volunteer to lead a group.",
        "voluntario",
      ],
      [
        "route",
        "the path you follow to get from one place to another",
        "The groups would use the same route every day.",
        "ruta",
      ],
      ["concern", "a worry about something important", "Safety is a fair concern.", "preocupación"],
      [
        "survey",
        "a set of questions asked of many people to learn what they think",
        "The speaker ran a survey of 200 students.",
        "encuesta",
      ],
    ],
    paras: [
      {
        text: "Good evening, members of the PTA, teachers, and fellow students. Imagine a school morning with no traffic jam at the front gate. Imagine students arriving awake, laughing, and ready to learn. Tonight I am asking you to make that morning real by starting a walking school bus at our school.",
        q: "What does the speaker ask for?",
      },
      {
        text: "A walking school bus is simple. A group of students walks to school along a set route, led by adult volunteers who stop at agreed corners to pick up more walkers. In our survey of 200 students, 48 live within one mile of school, and 31 of those 48 said they would walk if an adult walked with them. That is nearly two-thirds of the students who live close enough.",
        q: "What evidence does the speaker give?",
      },
      {
        text: "The benefits are clear. Walking is exercise, and exercise can help students concentrate. Every student who walks is one fewer car in the pickup line, which makes the street safer and cleaner for everyone. Students also get to talk with friends, and that starts the school day with connection.",
        q: "What are the benefits?",
      },
      {
        text: "I know that some of you are worried about safety. That is a fair concern, and it deserves a real answer. Each group would have at most six students and one adult leader, so 31 walkers would need six leaders. The groups would use crosswalks and the same route every day, and we would practice the route together before the first morning.",
        q: "How does the speaker answer the worry?",
      },
      {
        text: "A walking school bus will not fix every problem, but it will fix some of them. It will make our mornings calmer, our street cleaner, and our students healthier. So I ask you tonight: let's not just talk about a better morning. Let's walk to it. Thank you.",
        q: "How does the speaker close?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many of the 200 surveyed students live within one mile of school?",
        opts: ["48 students", "31 students", "200 students"],
        why: [
          "Thirty-one is the number of those students who said they would walk with an adult.",
          "Two hundred is the total number of students in the survey, not only those who live close.",
        ],
        rat: "Paragraph 2 says 48 of the 200 students live within one mile of school.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 4, the speaker says that safety is “a fair concern.” What does concern mean?",
        opts: [
          "a worry about something important",
          "a plan for fixing a problem",
          "a rule that everyone must follow",
        ],
        why: [
          "The speaker answers the concern with a plan, so the concern is the worry the plan responds to.",
          "No one is told to follow a rule here; the speaker names a worry and answers it.",
        ],
        rat: "The speaker says some people are worried about safety and then calls that a fair concern, so concern means a worry.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use numbers from the text",
        type: "choice",
        prompt:
          "Each group has at most six students and one leader. How many leaders do 31 students need?",
        opts: ["6 leaders", "5 leaders", "7 leaders"],
        why: [
          "Five leaders could walk with only 30 students, so one student would be left without a group.",
          "Seven leaders would be more than needed, because six groups of six already cover 31 students.",
        ],
        rat: "31 ÷ 6 is a little more than 5, so 6 leaders are needed, as paragraph 4 says.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Rhetorical technique",
        type: "choice",
        prompt: "In paragraph 1, the speaker repeats the word “Imagine.” Why?",
        opts: [
          "To help the audience picture the morning the speaker wants",
          "To prove that this morning is already happening today",
          "To ask the audience to stop talking and wait quietly",
        ],
        why: [
          "The word imagine means the morning is not yet real, so it does not prove that anything has happened.",
          "The word invites listeners to picture something; it is not a request for silence.",
        ],
        rat: "Repeating Imagine at the start of two sentences invites the audience to picture the benefit before hearing the proposal.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph where the speaker answers a worry from the audience.",
        evidence: ["p4"],
        rat: "Paragraph 4 names the safety worry and answers it with groups, leaders, crosswalks and a practice walk.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why does the speaker call the safety worry “a fair concern”?",
        opts: [
          "To show respect for the other side so listeners stay open",
          "To admit that the plan is unsafe and should be dropped",
          "To avoid giving any answer to the safety question",
        ],
        why: [
          "The speaker goes on to give a safety plan, so the plan is not dropped.",
          "The speaker answers the worry in the very next sentences, so the question is not avoided.",
        ],
        rat: "Calling the worry fair shows respect, which makes the audience more willing to listen to the answer that follows.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Analyze persuasion",
        type: "short",
        prompt:
          "Which part of the speech do you find most persuasive? Use one detail and name one technique, such as repetition, numbers or answering a worry.",
        lookFor: [
          "Chooses one part of the speech",
          "Uses an accurate detail from the speech",
          "Names a technique and explains how it persuades",
        ],
        rubric: [
          "Takes a clear position",
          "Uses an accurate detail",
          "Explains how the technique persuades",
        ],
        frame:
          "The most persuasive part is ___ because ___. The speaker uses ___, which makes the audience ___.",
        model:
          "The most persuasive part is paragraph 4 because the speaker answers the safety worry. She uses a plan with six leaders and crosswalks, which makes the audience feel that the idea has been thought through.",
      },
    ],
    transfer: {
      prompt:
        "Write the opening of a short speech that asks your school to make one change. Use the word imagine twice, and add one number as evidence.",
      lookFor: [
        "States a change that the speaker wants",
        "Uses imagine twice to build a picture",
        "Gives one number as evidence",
      ],
      frame: "Imagine ___. Imagine ___. In our survey, ___ out of ___ said ___.",
    },
    guide: {
      mini: "Mark the speech with three colors: claim, evidence and answer to a worry. Then underline every place where the speaker speaks directly to the audience, such as imagine, I ask you and let's.",
      discussion: [
        "Which number in the speech is most convincing, and why?",
        "How does the speaker treat people who disagree?",
        "What technique would you add to make the closing stronger?",
      ],
      misconception:
        "Students may think a persuasive speech only gives reasons; point out that the speaker also uses feelings and respect to persuade.",
      answerNotes: [
        "Question 3: 31 ÷ 6 is more than 5, so 6 leaders are needed.",
        "Question 5: paragraph 4 is where the speaker answers the safety worry.",
      ],
      model:
        "The most persuasive part is paragraph 4 because the speaker answers the safety worry with a clear plan of leaders and crosswalks.",
    },
    family: family(
      "Read the speech aloud together, one paragraph at a time. Ask your student which part is the most persuasive and why. You can talk in any language, then ask for one sentence in English.",
      "Lean el discurso en voz alta juntos, un párrafo a la vez. Pregunte a su estudiante qué parte es la más convincente y por qué. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What does the speaker want the school to start?",
        "How does the speaker answer the safety worry?",
      ],
    ),
    connections: {
      write: "Write a short persuasive speech that asks your school for a change.",
      speak: "Give the opening of the speech aloud with expression.",
      listen: "Listen to a speech and name one persuasive technique.",
    },
  },
  {
    id: "two-reports-one-game",
    level: "C",
    title: "Two Reports, One Game",
    summary:
      "Compare two school newspaper reports about the same volleyball match and see how word choice reveals point of view.",
    genre: "Paired texts (news reports)",
    subject: "English language arts",
    topics: ["point of view", "word choice and tone", "fact and opinion"],
    keyUse: "Inform",
    eldStandard: "ELD-LA",
    languageFunction: "Compare two reports and explain how word choice shows point of view.",
    languageFeatures: ["connotation", "compare and contrast", "fact and opinion"],
    minutes: 20,
    content:
      "Compare two accounts of the same event and explain how word choice shows each writer's view.",
    language: "Use while, whereas and both to compare two texts precisely.",
    essential: "How can two true reports about the same event sound so different?",
    background: "Think about how two fans of rival teams might describe the same game.",
    hook: "One headline says a team stormed back. The other says the opponents slipped. Same match?",
    purpose: "Read to find what the two reports agree on and how their words differ.",
    vocab: [
      [
        "point of view",
        "the way a writer looks at and feels about a topic",
        "Each reporter has a different point of view.",
        "punto de vista",
      ],
      [
        "connotation",
        "the feeling a word carries beyond its dictionary meaning",
        "The word stunned has a stronger connotation than the word beat.",
        "connotación",
      ],
      ["comeback", "a win after being behind", "The comeback surprised the crowd.", "remontada"],
      [
        "rematch",
        "a second game between the same two teams",
        "The rematch is in October.",
        "revancha",
      ],
    ],
    paras: [
      {
        text: "Report 1, from the Harbor Middle newspaper: HARBOR STORMS BACK TO STUN LINCOLN. On Thursday, Harbor's volleyball team pulled off a thrilling comeback, winning the match three sets to two after trailing by two sets. Refusing to give up, the Harbor players attacked the net with fearless spikes, and their captain, Lena Ortiz, scored the winning point in the fifth set to a roaring crowd.",
        q: "What does Report 1 say happened?",
      },
      {
        text: "The fifth set ended 15 to 13, which shows how close the battle was, but Harbor's determination made the difference. Lincoln's players, who had led comfortably early on, seemed to lose their nerve when the pressure rose. “We never doubted ourselves,” said Coach Ruiz. It was a victory the Harbor fans will remember for years.",
        q: "How does Report 1 explain the result?",
      },
      {
        text: "Report 2, from the Lincoln Middle newspaper: LINCOLN SLIPS IN FIVE-SET LOSS. On Thursday, Lincoln's volleyball team lost to Harbor three sets to two after winning the first two sets. A few unlucky bounces and two close line calls in the fifth set gave Harbor the edge, and the match ended 15 to 13 in the fifth.",
        q: "What does Report 2 say happened?",
      },
      {
        text: "Lincoln played steadily through the first two sets, and the team's passing was the best of the season. In the fifth set, however, several Harbor points came from balls that landed on the line, and Lincoln's coach, Ms. Adeyemi, said the team “did everything right and still came up short.” The players plan to practice their serving before the rematch in October.",
        q: "How does Report 2 explain the result?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to both reports, who won the match and by what score in sets?",
        opts: [
          "Harbor won three sets to two.",
          "Lincoln won three sets to two.",
          "Harbor won three sets to none.",
        ],
        why: [
          "Lincoln led by two sets but lost the match, so it did not win.",
          "Both reports say the match went to five sets, so the score was not three to none.",
        ],
        rat: "Paragraphs 1 and 3 both say Harbor won the match three sets to two.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In the first headline, Harbor “storms back.” What does storms mean here?",
        opts: [
          "comes back with great force and energy",
          "begins to feel angry at the other team",
          "is stopped by bad weather outdoors",
        ],
        why: [
          "The report praises the team's determination and does not say it was angry at Lincoln.",
          "The match is a volleyball game, and the report mentions no weather.",
        ],
        rat: "The report says Harbor refused to give up and attacked the net, so storms back means returned with great force.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Connotation and word choice",
        type: "choice",
        prompt:
          "Compare “STORMS BACK TO STUN” in Report 1 with “SLIPS” in Report 2. What effect does each choice have?",
        opts: [
          "The first makes the win sound powerful, and the second makes the loss sound small.",
          "The first makes the win sound lucky, and the second makes the loss sound huge and shameful.",
          "Both headlines describe the match in exactly the same plain and neutral way.",
        ],
        why: [
          "Storms and stun suggest force and skill, so the first headline does not make the win sound lucky.",
          "The words in the two headlines are very different, so they do not describe the match in the same way.",
        ],
        rat: "Storms and stun have strong, energetic connotations, while slips suggests a small accident.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Fact and opinion",
        type: "sort",
        prompt:
          "Sort each statement by whether it is a fact the reports share or an opinion or loaded wording.",
        cats: ["Fact both reports share", "Opinion or loaded wording"],
        sortItems: [
          ["Harbor won the match three sets to two.", 0],
          ["The fifth set ended 15 to 13.", 0],
          ["Lincoln won the first two sets.", 0],
          ["Lincoln's players seemed to lose their nerve.", 1],
          ["A few unlucky bounces gave Harbor the edge.", 1],
          ["Harbor's determination made the difference.", 1],
        ],
        rat: "The score and the early sets appear in both reports, while seemed to lose their nerve, unlucky bounces and determination are each writer's judgment.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement about the reporters is best supported by the text?",
        opts: [
          "Each reporter chose words that favor his or her own school.",
          "Both reporters tried to be completely neutral about the match.",
          "Neither reporter was present at the match on Thursday.",
        ],
        why: [
          "Words such as stun and unlucky are not neutral, so the reports are not completely neutral.",
          "Both reports describe the match in detail, so there is no sign that either reporter was absent.",
        ],
        rat: "Report 1 praises Harbor's determination, while Report 2 blames bad luck for Lincoln's loss, which favors each reporter's own school.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "How are the two reports organized in a way that helps readers compare them?",
        opts: [
          "Each report states the result first and then explains why it happened.",
          "Each report begins with a coach's quote and then lists the points.",
          "Each report starts with the last point and then goes back to set one.",
        ],
        why: [
          "Neither report begins with a quote; both begin with a headline and the result.",
          "Neither report begins with the final point; both begin with the result of the match.",
        ],
        rat: "Paragraphs 1 and 3 give the result and paragraphs 2 and 4 explain it, so both reports follow the same order.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Analyze point of view",
        type: "short",
        prompt:
          "How does word choice show each reporter's point of view? Use one word or phrase from each report.",
        lookFor: [
          "Says that each reporter favors his or her own school",
          "Uses a phrase from Report 1 such as stun, fearless or lose their nerve",
          "Uses a phrase from Report 2 such as unlucky bounces or came up short",
        ],
        rubric: [
          "Makes a clear claim about point of view",
          "Uses one accurate phrase from each report",
          "Explains how each phrase shows the writer's view",
        ],
        frame:
          "The Harbor reporter shows pride with ___, while the Lincoln reporter shows disappointment with ___.",
        model:
          "The Harbor reporter shows pride with words like stun and fearless, which make Harbor sound brave. The Lincoln reporter blames unlucky bounces, which makes Lincoln's loss sound like bad luck and not a weakness.",
      },
    ],
    transfer: {
      prompt:
        "Write two headlines about the same event, such as a lunchroom event or a class vote. Use one strong word in one headline and a milder word in the other, and explain the difference.",
      lookFor: [
        "Writes two headlines about the same event",
        "Uses a stronger word in one and a milder word in the other",
        "Explains the different feeling each word carries",
      ],
      frame: "Headline 1 uses ___, which feels ___. Headline 2 uses ___, which feels ___.",
    },
    guide: {
      mini: "Put the two headlines side by side. Ask students to list the facts both share and then circle the words that carry feelings. Discuss which words they would change to make each report neutral.",
      discussion: [
        "Which words in Report 1 sound like opinion?",
        "Why might a reporter for a school newspaper favor the home team?",
        "How would you rewrite one headline so that it is neutral?",
      ],
      misconception:
        "Students may think a report is false because it has a point of view; remind them that both reports share the same facts.",
      answerNotes: [
        "Question 3: storms and stun suggest force, while slips suggests a small accident.",
        "Question 4: facts are the score and the early sets; the rest is wording that shows a view.",
      ],
      model:
        "The Harbor reporter shows pride with words like stun and fearless. The Lincoln reporter blames unlucky bounces.",
    },
    family: family(
      "Read the two reports together. Ask your student which words show how each writer feels, and which facts both reports share. You can talk in any language, then ask for one sentence in English.",
      "Lean los dos reportes juntos. Pregunte a su estudiante qué palabras muestran lo que siente cada autor y qué hechos comparten ambos reportes. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["Who won the match, and by what score in sets?", "Which words show a point of view?"],
    ),
    connections: {
      write: "Write two short reports of the same event from different points of view.",
      speak: "Explain aloud how two headlines make the same event feel different.",
      listen: "Listen to two descriptions of one event and compare the words.",
    },
  },
  {
    id: "two-flyers-vacant-lot",
    level: "C",
    title: "Two Flyers, One Vacant Lot: Reading Loaded Language",
    summary:
      "Read two persuasive flyers about the same lot, find the loaded words, and separate feelings from facts.",
    genre: "Argument with analysis (paired flyers)",
    subject: "English language arts and math",
    topics: ["loaded language", "fact and opinion", "evaluating evidence"],
    keyUse: "Argue",
    eldStandard: "ELD-LA",
    languageFunction: "Identify loaded language and explain how it tries to persuade.",
    languageFeatures: ["loaded language", "fact and opinion", "evaluating claims"],
    minutes: 20,
    content:
      "Identify loaded language and separate checkable facts from opinion in persuasive texts.",
    language: "Use the words appeals to, is a fact and is an opinion to analyze persuasion.",
    essential:
      "How can we tell when words are trying to move our feelings instead of giving us evidence?",
    background: "Think about an ad or poster that used strong words to make you feel something.",
    hook: "One flyer says a lot is a nightmare. Another says it is a treasure. Who is right?",
    purpose: "Read to find the loaded words in each flyer and the facts that can be checked.",
    vocab: [
      ["vacant", "empty and not being used", "The vacant lot has no building on it.", "vacío"],
      [
        "loaded language",
        "words that carry strong feelings to persuade people",
        "Greedy is an example of loaded language.",
        "lenguaje cargado",
      ],
      [
        "evidence",
        "facts or details that support an idea",
        "A fact that can be checked is stronger evidence.",
        "evidencia",
      ],
      [
        "bulldoze",
        "to knock down and clear with a heavy machine",
        "The flyer says developers will bulldoze the lot.",
        "demoler",
      ],
    ],
    paras: [
      {
        text: "Flyer A, posted outside the library: SAVE OUR LAST GREEN SPACE! Greedy developers want to bulldoze the beautiful lot on Elm Street and bury it under ugly gray concrete. This lot is the only green space within eight blocks of our homes. Do you want your children to grow up with nothing but cold pavement and exhaust fumes? Stand up for the neighborhood. Say no to the parking lot!",
        q: "What does Flyer A want?",
      },
      {
        text: "Flyer B, handed out at a hardware store: END THE PARKING NIGHTMARE! Every evening, exhausted families circle our crowded streets, searching for a spot. The vacant lot on Elm Street is nothing but weeds and broken glass. A modern lot with thirty new spaces would give 30 of our 120 households a safe place to park. Do the sensible thing. Say yes to progress!",
        q: "What does Flyer B want?",
      },
      {
        text: "Both flyers use strong words to move readers' feelings. Flyer A calls the developers greedy and the concrete ugly, while Flyer B calls the parking situation a nightmare and the lot weeds and broken glass. These words are called loaded language: words that carry strong positive or negative feelings and try to persuade without giving evidence. Words like beautiful, ugly, greedy and sensible are opinions, not facts.",
        q: "What is loaded language?",
      },
      {
        text: "Careful readers separate the loaded words from the facts. A fact can be checked, such as “The lot is the only green space within eight blocks” or “Thirty new spaces would serve 30 of 120 households.” The second fact also shows that three out of four households would still have no space. Readers should ask: What is the writer asking me to feel? What evidence is offered? What is left out?",
        q: "How should careful readers read persuasion?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many parking spaces would the new lot have?",
        opts: ["30 spaces", "120 spaces", "8 spaces"],
        why: [
          "One hundred twenty is the number of households on the street, not the number of spaces.",
          "Eight is the number of blocks that Flyer A mentions, not a number of spaces.",
        ],
        rat: "Paragraph 2 says the modern lot would have thirty new spaces.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, Flyer B calls the lot “vacant.” What does vacant mean?",
        opts: [
          "empty and not being used",
          "full of tall plants and trees",
          "owned by the whole town",
        ],
        why: [
          "Flyer B says the lot is only weeds and broken glass, so it is not full of trees.",
          "The passage never says who owns the lot; vacant describes how the lot is used.",
        ],
        rat: "Flyer B describes the lot as nothing but weeds and broken glass, which shows a lot that is empty and not in use.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Loaded language and facts",
        type: "sort",
        prompt:
          "Sort each phrase from the flyers by whether it is loaded language or a checkable fact.",
        cats: ["Loaded language", "Checkable fact"],
        sortItems: [
          ["greedy developers", 0],
          ["ugly gray concrete", 0],
          ["parking nightmare", 0],
          ["thirty new spaces", 1],
          ["the only green space within eight blocks", 1],
          ["120 households", 1],
        ],
        rat: "Greedy, ugly and nightmare are feelings that cannot be measured, while thirty spaces, eight blocks and 120 households are numbers that can be checked.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use numbers from the text",
        type: "choice",
        prompt:
          "Thirty new spaces would serve 30 of the 120 households. What share of the households would get a space?",
        opts: [
          "One out of four households",
          "One out of three households",
          "Three out of four households",
        ],
        why: [
          "One out of three would be 40 households, and the flyer says 30.",
          "Three out of four is the share left without a space, not the share who would get one.",
        ],
        rat: "30 ÷ 120 = 1/4, so one out of four households would get a space, as paragraph 4 implies.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "How does paragraph 3 relate to paragraphs 1 and 2?",
        opts: [
          "It steps back to explain what the two flyers have in common.",
          "It adds a third flyer that argues for a different plan.",
          "It repeats the claims of both flyers in the same words.",
        ],
        why: [
          "Paragraph 3 talks about both flyers together and does not introduce another flyer.",
          "Paragraph 3 explains and compares the flyers; it does not repeat their claims.",
        ],
        rat: "Paragraph 3 begins with Both flyers and names the loaded words each one uses, so it analyzes the two flyers together.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What can the reader infer about the writer of paragraphs 3 and 4?",
        opts: [
          "The writer wants readers to judge persuasion carefully.",
          "The writer fully agrees with the flyer about the parking lot.",
          "The writer wants the lot to stay empty and unused forever.",
        ],
        why: [
          "The writer criticizes the loaded language in both flyers and does not take the side of the parking flyer.",
          "The writer does not say what should happen to the lot; the focus is on how to read persuasion.",
        ],
        rat: "Paragraph 4 gives readers questions to ask about any persuasive text, so the writer wants careful judging.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Analyze loaded language",
        type: "short",
        prompt:
          "Choose one loaded phrase from either flyer. Explain how it tries to persuade, and then rewrite it as a neutral statement.",
        lookFor: [
          "Names an accurate loaded phrase from a flyer",
          "Explains the feeling it tries to create",
          "Rewrites it as a neutral statement of fact",
        ],
        rubric: [
          "Chooses a loaded phrase",
          "Explains how it appeals to feelings",
          "Gives a neutral, factual rewrite",
        ],
        frame: "The phrase ___ tries to make readers feel ___. A neutral version is ___.",
        model:
          "The phrase ugly gray concrete tries to make readers dislike the parking lot. A neutral version is that the lot would be paved with concrete.",
      },
    ],
    transfer: {
      prompt:
        "Find a short ad or poster, or imagine one for a school event. Pick two loaded words from it and replace each with a fact that can be checked.",
      lookFor: [
        "Names two loaded words",
        "Replaces each with a checkable fact",
        "Explains why the facts are stronger evidence",
      ],
      frame: "The word ___ is loaded because ___. A fact I could use is ___.",
    },
    guide: {
      mini: "Highlight the loaded words in each flyer in one color and the numbers in another. Ask students which color is easier to check and why.",
      discussion: [
        "Which flyer uses stronger loaded words?",
        "What facts would you want before deciding what to do with the lot?",
        "Can a fact be used unfairly? What could be left out?",
      ],
      misconception:
        "Students may think any strong word is loaded language; ask whether the word is trying to move a feeling or is giving a fact.",
      answerNotes: [
        "Question 4: 30 ÷ 120 = 1/4; three out of four is the share without a space.",
        "Question 3: greedy, ugly and nightmare are loaded; the numbers are checkable facts.",
      ],
      model:
        "The phrase ugly gray concrete tries to make readers dislike the parking lot. A neutral version is that the lot would be paved with concrete.",
    },
    family: family(
      "Read the two flyers together. Ask your student which words are meant to make you feel something and which statements are facts you could check. You can talk in any language, then ask for one sentence in English.",
      "Lean los dos volantes juntos. Pregunte a su estudiante qué palabras buscan que uno sienta algo y qué afirmaciones son hechos que se pueden comprobar. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What is loaded language?", "Which facts in the flyers could you check?"],
    ),
    connections: {
      write: "Write a flyer that persuades with facts instead of loaded words.",
      speak: "Explain aloud why a phrase is loaded and give a neutral version.",
      listen: "Listen to an ad and name any loaded words.",
    },
  },
];

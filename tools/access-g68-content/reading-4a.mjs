// Grades 6-8 publisher pass, Reading Room lessons, batch 4a: social studies, data and primary-source style. Original texts.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "nile-flood-seasons",
    level: "A",
    title: "Life Along the Nile: Three Seasons",
    summary:
      "Learn how the yearly flood of the Nile shaped the work, the seasons and the food of ancient Egypt.",
    genre: "Informational text with a table",
    subject: "Social studies (ancient Egypt)",
    topics: ["ancient Egypt", "rivers and farming", "reading a table"],
    keyUse: "Inform",
    eldStandard: "ELD-SS",
    languageFunction: "Describe how a river shaped the way a civilization lived.",
    languageFeatures: ["sequence words", "cause and effect", "reading a table"],
    minutes: 12,
    content: "Explain how the Nile flood created three farming seasons in ancient Egypt.",
    language: "Use sequence words and because to describe a yearly cycle.",
    essential: "How can a river decide the way people live?",
    background:
      "Think about a place where the weather or the water changes during the year. How do people there plan their work?",
    hook: "Egypt is mostly desert, yet farmers there fed a great civilization.",
    purpose:
      "Read to find out how the Nile created three seasons and why the flood had to be the right size.",
    table: {
      headers: ["Season", "What the river and land did", "What farmers did"],
      rows: [
        [
          "Akhet (flood)",
          "The Nile rose and covered the fields.",
          "They repaired tools and canals.",
        ],
        [
          "Peret (growing)",
          "The water went down and left wet soil.",
          "They plowed and planted seeds.",
        ],
        ["Shemu (harvest)", "The land became dry and hot.", "They cut the grain and stored it."],
      ],
      description:
        "A table with three rows for the three Egyptian seasons: Akhet, Peret and Shemu. Each row tells what the river and land did and what farmers did.",
    },
    vocab: [
      [
        "flood",
        "water that rises and covers land that is usually dry",
        "The flood covered the fields every year.",
        "inundación",
      ],
      [
        "soil",
        "the top layer of earth where plants grow",
        "The river left dark, rich soil on the land.",
        "suelo",
      ],
      [
        "harvest",
        "to gather a crop when it is ready",
        "Farmers cut the grain at harvest time.",
        "cosecha",
      ],
      [
        "canal",
        "a channel dug to carry water",
        "Farmers dug a canal to bring water to a field.",
        "canal",
      ],
    ],
    paras: [
      {
        text: "Egypt is mostly desert, but people have farmed there for thousands of years. The reason is the Nile River. Each year the Nile rose and spilled over its banks. When the water went down, it left a layer of dark, rich soil. Egyptians called the farmland the Black Land. They called the dry desert beyond it the Red Land.",
        q: "Why was the Nile important to farmers?",
      },
      {
        text: "Egyptians divided the year into three seasons that followed the river. Akhet was the flood season. Farmers could not plant, so they fixed tools and repaired canals. Peret was the season when the water went down. Farmers plowed the wet soil and planted wheat and barley. Shemu was the harvest season. Farmers cut the grain and stored it.",
        q: "What happened in each of the three seasons?",
      },
      {
        text: "The system worked only when the flood was the right size. If the river rose too little, crops were small and families had less food. If it rose too high, it could wash away homes. So officials measured the river with a tool called a nilometer. The marks on it helped them guess how big the harvest would be.",
        q: "Why did officials measure the river?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 1, why was the land near the Nile good for farming?",
        opts: [
          "The yearly flood left dark, rich soil on the land.",
          "The desert sand stayed wet and soft all year long.",
          "Farmers brought rich soil from far away by boat.",
        ],
        why: [
          "Sand belongs to the Red Land beyond the farms; the text says the soil came from the river.",
          "The text never mentions boats carrying soil; the river itself left the soil behind.",
        ],
        rat: "Paragraph 1 says that when the flood water went down, it left a layer of dark, rich soil.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, farmers repaired canals. What is a canal?",
        opts: [
          "a channel dug to carry water",
          "a basket used to carry grain",
          "a wall built to keep out animals",
        ],
        why: [
          "Farmers did store grain, but a canal is connected to the river and its water, not to baskets.",
          "The season is about the flood, so a canal has to do with water, not with keeping animals out.",
        ],
        rat: "The repairs happen in the flood season, when water is everywhere, so a canal is a channel that carries water.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Read a table",
        type: "choice",
        prompt: "Use the table. What did farmers do in Peret?",
        opts: [
          "They plowed the wet soil and planted seeds.",
          "They cut the grain and stored it for later.",
          "They repaired the tools and the canals.",
        ],
        why: [
          "Cutting and storing grain is listed in the Shemu row, the harvest season.",
          "Repairing tools and canals is listed in the Akhet row, the flood season.",
        ],
        rat: "The Peret row of the table says farmers plowed and planted seeds after the water went down.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "How the text is organized",
        type: "sort",
        prompt: "Sort each job or event into the season when it happened.",
        cats: ["Akhet (flood)", "Peret (growing)", "Shemu (harvest)"],
        sortItems: [
          ["The Nile covers the fields", 0],
          ["Farmers repair canals", 0],
          ["Farmers plant wheat and barley", 1],
          ["Farmers plow the wet soil", 1],
          ["Farmers cut the grain", 2],
          ["Farmers store the grain", 2],
        ],
        rat: "The table and paragraph 2 match each job to a season: repairs in Akhet, planting in Peret and harvesting in Shemu.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What can the reader infer about a year when the river rose too little?",
        opts: [
          "Many families would have less food that year.",
          "Farmers would plant their seeds much earlier.",
          "The Red Land would become the Black Land.",
        ],
        why: [
          "The text does not say planting dates changed; it says crops were small when the river rose too little.",
          "The two lands stay different; the Black Land is the farmland that the flood helps.",
        ],
        rat: "Paragraph 3 says that when the river rose too little, crops were small and families had less food.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain why the Nile flood was both helpful and risky. Use one detail from paragraph 1 and one from paragraph 3.",
        lookFor: [
          "Says the flood left rich soil that helped farming",
          "Says a flood that was too small or too big caused trouble",
          "Connects the two ideas with however or but",
        ],
        rubric: [
          "States one helpful effect with a detail from paragraph 1",
          "States one risk with a detail from paragraph 3",
          "Uses a connecting word to link the two ideas",
        ],
        frame: "The flood was helpful because ___. However, it was risky because ___.",
        model:
          "The flood was helpful because it left dark, rich soil that made the land good for farming. However, it was risky because a river that rose too little caused small crops, and a river that rose too high could wash away homes.",
      },
    ],
    transfer: {
      prompt:
        "Think about a place where weather or water changes with the seasons. Explain how people there plan their work around the change.",
      lookFor: [
        "Names a place and a seasonal change",
        "Describes one job that fits each season or change",
        "Uses a sequence word such as first, then or after",
      ],
      frame: "In ___, people plan their work around ___. First, they ___. Then they ___.",
    },
    guide: {
      mini: "Point to the three rows of the table and trace one finger down the year. Ask students to say what the farmers do in each season before they read paragraph 2.",
      discussion: [
        "Why do you think Egyptians used the river, not the moon or the sun, to name their seasons?",
        "What might officials do if the nilometer showed a small flood?",
        "How is the Nile cycle like a cycle you know from your own home or country?",
      ],
      misconception:
        "Students may think a flood was only a disaster. The text shows it was needed for farming and only dangerous when it was too big or too small.",
      answerNotes: [
        "Question 3: the Peret row of the table is the one about planting.",
        "Question 5: the text says small crops meant less food, so the inference is about families having less to eat.",
      ],
      model:
        "The flood was helpful because it left rich soil for farming. However, it was risky because too little water meant small crops and too much water could wash away homes.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to use the table to tell you what farmers did in each season. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que use la tabla para decirle qué hacían los agricultores en cada estación. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["Why was the Nile flood good for farmers?", "What happened in the harvest season?"],
    ),
    connections: {
      write:
        "Write a paragraph that explains how a river or the weather changes the work people do.",
      speak: "Describe the three Egyptian seasons aloud, using the table.",
      listen: "Listen to a talk about farming and rivers and note the cycle of the year.",
    },
  },
  {
    id: "three-branches-three-jobs",
    level: "A",
    title: "Three Branches, Three Jobs",
    summary:
      "See how the United States divides power among Congress, the President and the courts, and how each one checks the others.",
    genre: "Informational text with a table",
    subject: "Social studies (civics)",
    topics: ["branches of government", "checks and balances", "reading a table"],
    keyUse: "Inform",
    eldStandard: "ELD-SS",
    languageFunction: "Explain who does which job in a government and why power is shared.",
    languageFeatures: ["cause and effect", "reading a table", "civics vocabulary"],
    minutes: 12,
    content:
      "Describe the three branches of the national government and give one example of a check.",
    language: "Use because, so and each to explain why power is divided.",
    essential: "Why do people share power instead of giving it to one person?",
    background:
      "Think about a group project. What can go wrong if one person makes every decision?",
    hook: "The people who wrote the Constitution did not want any one person to have all the power.",
    purpose: "Read to learn the job of each branch and how the branches limit one another.",
    table: {
      headers: ["Branch", "Who is in it", "Main job"],
      rows: [
        ["Legislative", "Congress: the Senate and the House of Representatives", "Makes the laws"],
        [
          "Executive",
          "The President, the Vice President and many agencies",
          "Carries out the laws",
        ],
        ["Judicial", "The Supreme Court and other federal courts", "Decides what laws mean"],
      ],
      description:
        "A table with three rows for the legislative, executive and judicial branches. Each row names who is in the branch and its main job.",
    },
    vocab: [
      [
        "branch",
        "one main part of a larger group",
        "Congress is one branch of the government.",
        "rama",
      ],
      [
        "law",
        "a rule that everyone in a country must follow",
        "A new law set the speed limit near the school.",
        "ley",
      ],
      [
        "veto",
        "to say no to a bill so that it cannot become a law",
        "The President can veto a bill.",
        "vetar",
      ],
      [
        "balance",
        "a fair share of power so no side is too strong",
        "Three branches keep a balance of power.",
        "equilibrio",
      ],
    ],
    paras: [
      {
        text: "The writers of the Constitution had a worry. They did not want one person or one group to hold all the power. So they divided the national government into three parts, called branches. Each branch has its own job, and each one can limit the others.",
        q: "Why are there three branches?",
      },
      {
        text: "The legislative branch is Congress. It has two parts, the Senate and the House of Representatives. Members of Congress make the laws. The executive branch carries out the laws. The President leads this branch, with help from the Vice President and many agencies. The judicial branch is made up of courts. Judges decide what laws mean and whether a law follows the Constitution.",
        q: "What does each branch do?",
      },
      {
        text: "The branches check one another. Suppose Congress passes a bill. The President can veto it, which means saying no. Congress can override the veto if two-thirds of its members vote again for the bill. Later, a court can decide that a law does not follow the Constitution. Because of these checks, no branch can act alone, and the power stays in balance.",
        q: "How do the branches check one another?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt:
          "According to paragraph 1, why did the writers of the Constitution create three branches?",
        opts: [
          "They did not want one person or group to have all the power.",
          "They wanted each branch to make its own set of national laws.",
          "They thought the President needed more help from other leaders.",
        ],
        why: [
          "Only Congress makes laws; the three branches have different jobs, not three lawmaking groups.",
          "The text does not say the President needed help; it says the writers worried about too much power.",
        ],
        rat: "Paragraph 1 says the writers did not want one person or one group to hold all the power.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, the President can veto a bill. What does veto mean?",
        opts: [
          "say no to a bill so it cannot become a law",
          "write a bill so it can become a law soon",
          "read a bill aloud so that people can hear it",
        ],
        why: [
          "Writing a bill is the work of Congress, and the text says veto means saying no.",
          "Nothing in the paragraph is about reading a bill aloud; the next sentence is about overriding the veto.",
        ],
        rat: "Paragraph 3 says veto means saying no, and Congress can then override the veto with a two-thirds vote.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Read a table",
        type: "choice",
        prompt: "Use the table. Which branch carries out the laws?",
        opts: ["The executive branch", "The legislative branch", "The judicial branch"],
        why: [
          "The legislative branch is Congress, and the table says its job is to make the laws.",
          "The judicial branch is the courts, and the table says its job is to decide what laws mean.",
        ],
        rat: "The Executive row of the table says the main job is to carry out the laws.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sort ideas by category",
        type: "sort",
        prompt: "Sort each action into the branch that does it.",
        cats: ["Legislative", "Executive", "Judicial"],
        sortItems: [
          ["The Senate votes on a bill", 0],
          ["The House writes a new law", 0],
          ["The President signs a bill", 1],
          ["An agency carries out a law", 1],
          ["The Supreme Court hears a case", 2],
          ["A judge decides what a law means", 2],
        ],
        rat: "The table and paragraph 2 show that Congress makes laws, the President and agencies carry them out and the courts decide what they mean.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What can the reader infer about the President's veto?",
        opts: [
          "It is a way for one branch to limit Congress.",
          "It is a way for the courts to end a trial.",
          "It is a way for Congress to make a new bill.",
        ],
        why: [
          "Courts decide cases, but the paragraph says the President, not a court, uses the veto.",
          "The veto stops a bill; Congress makes a bill, so the veto is not how bills begin.",
        ],
        rat: "Paragraph 3 shows the President stopping a bill from Congress, which is a check on the legislative branch.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt: "Explain how one branch checks another branch. Use an example from paragraph 3.",
        lookFor: [
          "Names two branches",
          "Describes one check, such as a veto, an override or a court decision",
          "Says the result: power stays in balance",
        ],
        rubric: [
          "Names the branch that checks and the branch that is checked",
          "Gives an accurate example from paragraph 3",
          "Explains why the check keeps power balanced",
        ],
        frame:
          "The ___ branch can check the ___ branch by ___. This keeps power in balance because ___.",
        model:
          "The executive branch can check Congress by vetoing a bill. This keeps power in balance because Congress cannot make a law alone, unless two-thirds of its members vote to override the veto.",
      },
    ],
    transfer: {
      prompt:
        "Your class has a president, a rule-maker and a judge for a class game. Explain why it is better to share these jobs among three students than to give all three jobs to one student.",
      lookFor: [
        "Names the three jobs",
        "Gives a reason sharing the jobs is fair",
        "Uses because or so",
      ],
      frame: "It is better to share the jobs because ___. If one student had all three jobs, ___.",
    },
    guide: {
      mini: "Draw a triangle on the board with the three branches at the corners. Draw one arrow for each check named in paragraph 3 and have students read the arrow aloud.",
      discussion: [
        "Which check in paragraph 3 seems the strongest, and why?",
        "What could happen if one branch could do all three jobs?",
        "How does a school or a sports league share power among different people?",
      ],
      misconception:
        "Students may think the President makes the laws. The table shows that Congress makes laws and the President carries them out.",
      answerNotes: [
        "Question 3: the Executive row says the job is to carry out the laws.",
        "Question 4: a vote on a bill is legislative, a signature or carrying out a law is executive and court cases are judicial.",
      ],
      model:
        "The executive branch can check Congress with a veto. Congress needs the President's signature or a two-thirds vote to make the law, so the power stays in balance.",
    },
    family: family(
      "Read the table together. Ask your student to name a job for each branch in their own words. You can talk in any language, then ask for one sentence in English.",
      "Lean la tabla juntos. Pida a su estudiante que nombre en sus propias palabras un trabajo de cada rama. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["Which branch makes the laws?", "Why is it a good idea to share power?"],
    ),
    connections: {
      write: "Write a paragraph that explains one way the branches of government check each other.",
      speak: "Explain aloud the job of each branch, using the table.",
      listen: "Listen to a short talk about a school election and name who has which job.",
    },
  },
  {
    id: "maya-dots-and-bars",
    level: "B",
    title: "How the Maya Wrote Numbers with Dots and Bars",
    summary:
      "Learn how the Maya used a dot, a bar and a shell to write any number, and how place value works in base 20.",
    genre: "Informational text with math and a table",
    subject: "Social studies and math (ancient Maya)",
    topics: ["ancient Maya", "place value", "number systems"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how a number system works and why zero matters.",
    languageFeatures: ["sequence words", "math vocabulary", "cause and effect"],
    minutes: 15,
    content: "Explain how the Maya number system uses place value and zero.",
    language: "Use first, then, so and because to explain a calculation.",
    essential: "How can a few symbols write any number?",
    background:
      "Think about our own numbers. Why does the 2 in 20 mean something different from the 2 in 2?",
    hook: "The ancient Maya wrote every number they needed with only three symbols.",
    purpose: "Read to learn what each symbol means and how to read a Maya number with two levels.",
    table: {
      headers: ["Number", "How the Maya drew it", "How to read it"],
      rows: [
        ["0", "A shell shape", "Zero, an empty place"],
        ["1", "One dot", "1"],
        ["5", "One bar", "5"],
        ["7", "One bar and two dots", "5 + 2"],
        ["13", "Two bars and three dots", "10 + 3"],
        ["19", "Three bars and four dots", "15 + 4"],
      ],
      description:
        "A table with six rows that shows how the Maya drew the numbers 0, 1, 5, 7, 13 and 19 with dots, bars and a shell, and how to read each one.",
    },
    vocab: [
      [
        "symbol",
        "a mark or picture that stands for something",
        "A dot is a symbol for the number 1.",
        "símbolo",
      ],
      [
        "place value",
        "the idea that where a digit sits changes its value",
        "In place value, a dot in the top level is worth 20.",
        "valor posicional",
      ],
      [
        "scribe",
        "a person whose job was to write and keep records",
        "A Maya scribe wrote numbers on bark paper.",
        "escriba",
      ],
      [
        "stacked",
        "placed one on top of another",
        "The Maya stacked the symbols in levels.",
        "apilado",
      ],
    ],
    paras: [
      {
        text: "The Maya built cities, studied the stars and kept careful calendars in southern Mexico and Central America. To track days and trade goods, their scribes needed a way to write numbers. They invented a system that used only three symbols: a dot, a bar and a shell.",
        q: "Why did the Maya need numbers?",
      },
      {
        text: "A dot stands for 1. A bar stands for 5. A shell shape stands for 0. To write 7, a scribe drew one bar and two dots, because 5 plus 2 equals 7. The symbols were stacked, with the dots above the bars. Three bars and four dots made 19, the largest number that one level could show.",
        q: "What does each symbol mean?",
      },
      {
        text: "To write larger numbers, the Maya stacked levels one above another. The bottom level shows ones. The level above it shows twenties, not tens. So a dot in the second level means 1 times 20, which is 20. A system in which the position of a symbol changes its value is called a place-value system. Our own system works this way too, but ours is built on groups of ten.",
        q: "What does the second level show?",
      },
      {
        text: "Here is an example. Suppose the top level has two dots, and the bottom level has one bar and three dots. The top level is worth 2 times 20, which is 40. The bottom level is worth 5 plus 3, which is 8. Add the two levels: 40 plus 8 equals 48.",
        q: "How is 48 found?",
      },
      {
        text: "The shell mattered because it marked an empty place. Without it, a reader could not tell the difference between 1, one dot alone, and 20, a dot above a shell. The Maya were among the first peoples in history to use a symbol for zero.",
        q: "Why was the shell important?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to paragraph 2, what does one bar stand for?",
        opts: ["5", "1", "20"],
        why: [
          "One dot stands for 1; a bar is worth more than a dot.",
          "Twenty is the value of a dot in the second level, not the value of a bar.",
        ],
        rat: "Paragraph 2 says a dot stands for 1, a bar stands for 5 and a shell stands for 0.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, the symbols were stacked. What does stacked mean?",
        opts: [
          "placed one on top of another",
          "spread out in one long line",
          "crossed out and written again",
        ],
        why: [
          "The text says the dots were above the bars, so the symbols were not in one long line.",
          "Nothing in the paragraph says the scribes made mistakes or wrote symbols again.",
        ],
        rat: "Paragraph 2 says the dots were above the bars, and paragraph 3 says the levels were stacked one above another.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Read a table",
        type: "choice",
        prompt: "Use the table. Which number did the Maya draw with two bars and three dots?",
        opts: ["13", "23", "8"],
        why: [
          "Twenty-three would need a dot in the second level; the table row shows only one level.",
          "Eight is one bar and three dots; two bars are worth 10, so the total is larger.",
        ],
        rat: "The row for 13 in the table shows two bars and three dots, which is 10 plus 3.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use place value",
        type: "choice",
        prompt:
          "A scribe draws one dot in the top level and a shell in the bottom level. Which number is it?",
        opts: ["20", "1", "21"],
        why: [
          "One dot alone is 1, but the shell tells you the dot is in the second level, which is worth 20.",
          "Twenty-one would need a dot in the bottom level too; the shell means that level is empty.",
        ],
        rat: "Paragraph 3 says a dot in the second level means 20, and paragraph 5 says the shell marks an empty bottom level.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why would a number system need a symbol for zero?",
        opts: [
          "to show that a place is empty so numbers are not confused",
          "to show that a number is too large for a scribe to write",
          "to show that a calendar day has ended and a new day begins",
        ],
        why: [
          "Large numbers are written with more levels, so zero is not used to mean a number is too large.",
          "The shell is part of the number system; the text does not connect it to the end of a day.",
        ],
        rat: "Paragraph 5 says that without the shell, a reader could not tell 1 from 20.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "What is the main job of paragraph 4?",
        opts: [
          "It shows a worked example of the idea in paragraph 3.",
          "It argues that the Maya system is better than ours.",
          "It describes how scribes learned to write numbers.",
        ],
        why: [
          "The paragraph never compares the two systems; it just finds the value of one number.",
          "The paragraph is about a calculation, not about how scribes were taught.",
        ],
        rat: "Paragraph 4 begins with Here is an example and uses the two levels explained in paragraph 3 to find 48.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a calculation",
        type: "short",
        prompt:
          "A Maya number has one dot in the top level and one bar and two dots in the bottom level. Explain how to find its value.",
        lookFor: [
          "Says the top level dot is worth 1 times 20, or 20",
          "Says the bottom level is 5 plus 2, or 7",
          "Adds the levels to get 27",
        ],
        rubric: [
          "Finds the value of the top level",
          "Finds the value of the bottom level",
          "Adds the two levels and states 27",
        ],
        frame:
          "The top level is worth ___ because ___. The bottom level is worth ___. I add them to get ___.",
        model:
          "The top level is worth 20 because one dot in the second level means 1 times 20. The bottom level is worth 7 because a bar is 5 and two dots add 2. I add them to get 27.",
      },
    ],
    transfer: {
      prompt:
        "Explain how the value of the digit 3 changes in the numbers 3 and 30 in our own number system. Then compare that idea to the Maya levels.",
      lookFor: [
        "Says the 3 in 30 is worth 30, or three tens",
        "Says position changes the value of a symbol",
        "Compares our groups of ten with the Maya groups of twenty",
      ],
      frame:
        "In 3 the digit is worth ___, but in 30 it is worth ___. The Maya also ___ because ___.",
    },
    guide: {
      mini: "Draw two stacked levels on the board. Write the bottom level as ones and the top level as twenties, then place symbols and have students find the value aloud.",
      discussion: [
        "Why do you think the Maya used groups of twenty instead of ten?",
        "What would be confusing about a number system with no zero?",
        "How is the Maya top level like the tens place in our numbers?",
      ],
      misconception:
        "Students may read the second level as tens. The text says it shows twenties, so one dot there is 20, not 10.",
      answerNotes: [
        "Question 4: one dot in the top level is 20 and a shell in the bottom level adds 0, so the number is 20.",
        "Question 7: 1 times 20 is 20, 5 plus 2 is 7 and 20 plus 7 is 27.",
      ],
      model:
        "The top dot is worth 20 and the bottom bar and two dots are worth 7, so the number is 27.",
    },
    family: family(
      "Read the table together. Ask your student to explain how the Maya wrote 7 and 13. You can talk in any language, then ask for one sentence in English.",
      "Lean la tabla juntos. Pida a su estudiante que explique cómo escribían los mayas el 7 y el 13. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What do the dot, the bar and the shell stand for?", "Why was zero important?"],
    ),
    connections: {
      write: "Write a paragraph that explains how to read a Maya number with two levels.",
      speak: "Explain aloud how the Maya wrote the number 48.",
      listen: "Listen to a talk about number systems and compare them with ours.",
    },
  },
  {
    id: "delegate-letter-1787",
    level: "B",
    title: "A Clerk's Letter from Philadelphia, 1787 (an invented letter)",
    summary:
      "Read an invented letter from a young clerk to learn how the delegates solved a big argument about how states would be represented.",
    genre: "Invented primary-source style letter",
    subject: "Social studies (United States history)",
    topics: ["Constitutional Convention", "compromise", "primary sources"],
    keyUse: "Narrate",
    eldStandard: "ELD-SS",
    languageFunction: "Retell events from one person's point of view and explain a compromise.",
    languageFeatures: ["past tense", "first-person voice", "cause and effect"],
    minutes: 15,
    content: "Explain the compromise that created the House and the Senate.",
    language: "Use past tense and because to retell a disagreement and its solution.",
    essential: "How do people with different needs reach an agreement?",
    background: "Think about a time when two groups wanted different things. How did you decide?",
    hook: "This letter is invented for this lesson. It is not a real document, but the argument it describes really happened.",
    purpose:
      "Read to find out what the states argued about and how the delegates solved the problem.",
    vocab: [
      [
        "delegate",
        "a person chosen to speak and vote for a group",
        "Each state sent delegates to Philadelphia.",
        "delegado",
      ],
      [
        "population",
        "the number of people who live in a place",
        "A state with a large population has many people.",
        "población",
      ],
      [
        "compromise",
        "an agreement in which each side gives up something",
        "The two sides reached a compromise.",
        "compromiso",
      ],
      [
        "clerk",
        "a person whose job is to write, copy and carry papers",
        "The clerk carried papers up the stairs.",
        "escribiente",
      ],
    ],
    paras: [
      {
        text: "This letter is invented for this lesson. Its writer, Marcus Hale, is a made-up young clerk who helps a delegate in the summer of 1787. Leaders from the states met in Philadelphia that summer to talk about how to improve the nation's government.",
        q: "Is this letter a real document?",
      },
      {
        text: "Philadelphia, July 30, 1787. Dear Lena, The State House is so hot that I can hardly hold my pen. The delegates keep the windows shut so that no one outside can hear. They want to speak freely, and they have promised to keep their talk secret. I carry papers up and down the stairs all day, but I cannot tell you what is written on them.",
        q: "Why are the windows shut?",
      },
      {
        text: "I can tell you what the big quarrel was about, since everyone in town knows it. The large states wanted each state to have votes in Congress based on its number of people. The small states were afraid that no one would listen to them. They wanted every state to have the same number of votes. For weeks the men argued, and a few of them talked of going home.",
        q: "What was the quarrel about?",
      },
      {
        text: "Two weeks ago they found a compromise. One part of Congress, the House of Representatives, will count the people of each state. The other part, the Senate, will give every state two members. Nobody was fully happy, but both sides gave up something, and the work goes on. Your loving brother, Marcus.",
        q: "What was the compromise?",
      },
      {
        text: "Marcus is invented, but the compromise was real. The delegates were all men. No women, no Black Americans and no Native nations were in the room, so many people had no voice in these decisions. Historians study letters like this one to learn how people lived, and they also ask whose voices are missing.",
        q: "Whose voices are missing?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 3, what did the large states want?",
        opts: [
          "Votes in Congress based on the number of people in each state.",
          "The same number of votes in Congress for every state.",
          "A secret meeting held in a different city for the delegates.",
        ],
        why: [
          "The same number of votes for every state is what the small states wanted, not the large states.",
          "The meeting place was not part of the argument; the quarrel was about votes in Congress.",
        ],
        rat: "Paragraph 3 says the large states wanted votes based on each state's number of people.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 4, the delegates found a compromise. What is a compromise?",
        opts: [
          "an agreement in which each side gives up something",
          "a vote in which the larger side wins everything",
          "a promise that no one will ever talk about the topic",
        ],
        why: [
          "The paragraph says both sides gave up something, so the larger side did not win everything.",
          "The delegates did keep their talks secret, but a compromise is the agreement they reached.",
        ],
        rat: "Paragraph 4 says nobody was fully happy, but both sides gave up something to reach the agreement.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why do the delegates keep the windows shut even though the room is very hot?",
        opts: [
          "They want to talk freely without being heard outside.",
          "They want the papers to stay cool and dry inside.",
          "They want the clerks to stay close to the desks.",
        ],
        why: [
          "The heat is the writer's complaint, but nothing says the papers need to stay cool.",
          "Nothing in the letter says the clerks must stay near the desks; the writer moves around all day.",
        ],
        rat: "Paragraph 2 says the shut windows keep outsiders from hearing, since the delegates want to speak freely.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's choice",
        type: "choice",
        prompt: "Why might the author tell these events through a clerk's letter to his sister?",
        opts: [
          "A personal letter lets readers see events through one person's eyes.",
          "A personal letter lets the author list every law that was passed.",
          "A personal letter lets the author argue against the delegates.",
        ],
        why: [
          "The letter names only one compromise, so it does not list every law.",
          "Marcus does not argue against anyone; he reports what he saw and heard.",
        ],
        rat: "Marcus describes the heat, the stairs and the quarrel in his own voice, which shows how a person in the room might have seen events.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that explains how the delegates solved the quarrel.",
        evidence: ["p4"],
        rat: "Paragraph 4 explains that the House would count people and the Senate would give each state two members.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain how the compromise gave something to both large states and small states. Use details from paragraph 4.",
        lookFor: [
          "Says the House counts people, which helps large states",
          "Says the Senate gives each state two members, which helps small states",
          "Says each side gave up something",
        ],
        rubric: [
          "Explains what the large states received",
          "Explains what the small states received",
          "Connects both ideas to the word compromise",
        ],
        frame:
          "The large states got ___ because the House ___. The small states got ___ because the Senate ___.",
        model:
          "The large states got more power in the House because it counts the people of each state. The small states got an equal voice in the Senate because every state has two members. Both sides gave up something, so it was a compromise.",
      },
    ],
    transfer: {
      prompt:
        "Two groups in your class want different things for a class party. Explain a compromise that gives each group something, and say what each group gives up.",
      lookFor: [
        "Names the two groups and what each wants",
        "Describes a fair compromise",
        "Says what each group gives up",
      ],
      frame:
        "One group wants ___, and the other wants ___. A compromise could be ___. Each group gives up ___.",
    },
    guide: {
      mini: "Draw two columns on the board, large states and small states. Write what each wanted, then write the House and the Senate and ask which column each part helps.",
      discussion: [
        "Why did the delegates think secrecy would help them reach an agreement?",
        "How does paragraph 5 change the way you read the letter?",
        "What compromise have you made in your own life, and what did each side give up?",
      ],
      misconception:
        "Students may think a compromise means one side wins. The text shows that both sides gave up something to reach a solution.",
      answerNotes: [
        "Question 1: the large states wanted votes based on population.",
        "Question 6: the House helps large states and the Senate helps small states.",
      ],
      model:
        "The House counts people, which helps large states, and the Senate gives each state two members, which helps small states. Both sides gave up something.",
    },
    family: family(
      "Read the letter aloud with your student. Ask them to explain the compromise in their own words. You can talk in any language, then ask for one sentence in English.",
      "Lean la carta en voz alta con su estudiante. Pídale que explique el compromiso con sus propias palabras. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What did the large states and the small states each want?",
        "Why do you think Marcus wrote this letter to his sister?",
      ],
    ),
    connections: {
      write:
        "Write a short invented letter that tells about a compromise from one person's point of view.",
      speak: "Retell the argument and the compromise aloud in order.",
      listen: "Listen to two speakers who disagree and find a compromise.",
    },
  },
  {
    id: "supply-demand-lantern-tickets",
    level: "B",
    title: "Too Many Buyers, Too Few Tickets: Supply and Demand",
    summary:
      "Use a price table for a town festival to see how supply, demand and price work together.",
    genre: "Informational text with a data table",
    subject: "Social studies (economics) and math",
    topics: ["supply and demand", "prices", "percent change"],
    keyUse: "Explain",
    eldStandard: "ELD-SS",
    languageFunction: "Explain how price changes what people buy and what sellers offer.",
    languageFeatures: ["cause and effect", "reading a table", "comparing numbers"],
    minutes: 15,
    content: "Explain how supply, demand and price are connected, using a data table.",
    language: "Use as, so and when to explain a cause-and-effect pattern with numbers.",
    essential: "How does price help decide who gets what?",
    background:
      "Think about something people really want, such as a popular toy. What happens to its price?",
    hook: "A fictional town festival has only 200 tickets, and many more people want one.",
    purpose: "Read to learn what supply and demand mean and to find the price where they match.",
    table: {
      headers: ["Ticket price", "Tickets people want to buy", "Tickets available"],
      rows: [
        ["$4", "400", "200"],
        ["$6", "300", "200"],
        ["$8", "200", "200"],
        ["$10", "120", "200"],
      ],
      description:
        "A table with four rows. Each row gives a ticket price, how many tickets people want to buy at that price and the 200 tickets that are available.",
    },
    vocab: [
      [
        "supply",
        "the amount of something that is for sale",
        "The supply of tickets is 200.",
        "oferta",
      ],
      [
        "demand",
        "the amount of something that people want to buy at a price",
        "Demand is high when the price is low.",
        "demanda",
      ],
      [
        "shortage",
        "not enough of something to meet what people want",
        "A shortage means some people go without.",
        "escasez",
      ],
      [
        "surplus",
        "more of something than people want to buy",
        "A surplus leaves tickets unsold.",
        "excedente",
      ],
    ],
    paras: [
      {
        text: "In the fictional town of Lantern Bay, a winter festival will fill the park with lights. The park can hold only 200 people, so only 200 tickets can be sold. This number is the supply, the amount that is for sale. The festival committee wants to choose a fair price.",
        q: "What is the supply of tickets?",
      },
      {
        text: "People do not all want a ticket at every price. Demand is the number of tickets people want to buy at a certain price. The table shows that at $4, people want 400 tickets. At $6, they want 300. At $8, they want 200. As the price goes up, fewer people want to buy.",
        q: "How does demand change as the price rises?",
      },
      {
        text: "Compare demand with supply. At $4, 400 people want tickets, but only 200 tickets exist. That is a shortage of 200, so many families would be turned away. At $10, only 120 people want tickets, but 200 tickets are for sale. That is a surplus of 80 tickets that nobody buys.",
        q: "What happens at $4 and at $10?",
      },
      {
        text: "At $8, the number of people who want tickets is exactly 200, the same as the supply. There is no shortage and no surplus. Economists call this the balance point. Notice that the demand fell from 400 to 200 when the price rose from $4 to $8. That is a drop of half, or 50%. The committee can use the balance point as a guide, but it may also think about what families can afford.",
        q: "Why is $8 the balance point?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 1, why is the supply of tickets only 200?",
        opts: [
          "The park can hold only 200 people.",
          "The committee wants to raise a lot of money.",
          "Most people in Lantern Bay do not want tickets.",
        ],
        why: [
          "Raising money is not mentioned; the limit comes from how many people fit in the park.",
          "The table shows many more people want tickets at some prices, so the limit is not about interest.",
        ],
        rat: "Paragraph 1 says the park can hold only 200 people, so only 200 tickets can be sold.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, there is a shortage of 200 tickets. What is a shortage?",
        opts: [
          "not enough of something to meet what people want",
          "more of something than people want to buy",
          "a lower price that is set for a few days",
        ],
        why: [
          "That describes a surplus, which the paragraph shows at the $10 price.",
          "The paragraph is about numbers of tickets, not about lowering the price.",
        ],
        rat: "At $4, 400 people want tickets but only 200 exist, so there are not enough for everyone who wants one.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Read a table",
        type: "choice",
        prompt: "Use the table. How many tickets do people want to buy at $6?",
        opts: ["300", "200", "400"],
        why: [
          "Two hundred is the number of tickets available, and it is also the demand at $8.",
          "Four hundred is the number people want at $4, one price lower.",
        ],
        rat: "The $6 row of the table shows 300 tickets people want to buy.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Calculate with table data",
        type: "choice",
        prompt: "Use the table. At $10, how many of the 200 tickets would be left over?",
        opts: ["80 tickets", "120 tickets", "200 tickets"],
        why: [
          "One hundred twenty is the number of tickets people want, not the number left over.",
          "Two hundred is the whole supply, but 120 of those tickets would be sold.",
        ],
        rat: "At $10 the supply is 200 and the demand is 120, and 200 minus 120 equals 80 tickets left over.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What can the reader infer about the committee choosing a price of $4?",
        opts: [
          "Many families who want tickets would not be able to get one.",
          "The committee would have too many tickets left unsold.",
          "The park would be less crowded than it would at $10.",
        ],
        why: [
          "Unsold tickets appear at $10, not at $4, where demand is larger than supply.",
          "At $4 the demand is 400, so all 200 tickets would sell and the park would be full.",
        ],
        rat: "At $4 the demand is 400 but the supply is 200, so there would be a shortage of 200 tickets.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "How the text is organized",
        type: "choice",
        prompt: "How does the writer organize paragraphs 2, 3 and 4?",
        opts: [
          "They move from demand, to a comparison with supply, to the balance point.",
          "They move from the balance point, to demand, to a story about the park.",
          "They move from a shortage, to the festival committee, to a list of prices.",
        ],
        why: [
          "The balance point is the last idea in these paragraphs, and the park story is only in paragraph 1.",
          "A shortage is explained inside the comparison in paragraph 3, and the prices are shown in the table, not in a list paragraph.",
        ],
        rat: "Paragraph 2 explains demand, paragraph 3 compares demand with supply, and paragraph 4 names the balance point at $8.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with data",
        type: "short",
        prompt: "Explain why $8 is called the balance point. Use numbers from the table.",
        lookFor: [
          "Says that at $8 demand is 200 and supply is 200",
          "Says there is no shortage and no surplus",
          "Compares with another price, such as $4 or $10",
        ],
        rubric: [
          "Uses the numbers 200 and 200 from the $8 row",
          "Explains that there is no shortage or surplus",
          "Compares with at least one other price",
        ],
        frame:
          "At $8, demand is ___ and supply is ___, so there is no ___. At ___, there would be a ___.",
        model:
          "At $8, demand is 200 and supply is 200, so there is no shortage and no surplus. At $4, there would be a shortage of 200 tickets, and at $10, there would be a surplus of 80.",
      },
    ],
    transfer: {
      prompt:
        "A bakery bakes 50 muffins each morning. At $2 each, 80 people want one. At $3 each, 50 people want one. Explain which price matches supply and demand, and why.",
      lookFor: [
        "Says $3 matches because 50 people want 50 muffins",
        "Says $2 causes a shortage of 30 muffins",
        "Uses the words supply and demand",
      ],
      frame: "At $___, demand is ___ and supply is ___. That means there is a ___ of ___.",
    },
    guide: {
      mini: "Draw the table on the board and circle the $8 row. Ask students to subtract supply from demand in the $4 and $10 rows to find the shortage and the surplus.",
      discussion: [
        "Why might a committee choose a price lower than the balance point?",
        "What other things, besides price, might change how many tickets people want?",
        "How is the price of a popular item different from the price of one nobody wants?",
      ],
      misconception:
        "Students may think demand means how much a seller has. Supply is what is for sale, and demand is what people want to buy at a price.",
      answerNotes: [
        "Question 4: 200 minus 120 equals 80 left over at $10.",
        "Paragraph 4: from 400 to 200 is a drop of 200, which is half of 400, or 50%.",
      ],
      model:
        "At $8, demand is 200 and supply is 200, so there is no shortage and no surplus. At $4 there is a shortage of 200, and at $10 there is a surplus of 80.",
    },
    family: family(
      "Look at the table together. Ask your student to compare the price and the number of tickets people want, then explain the pattern. You can talk in any language, then ask for one sentence in English.",
      "Miren la tabla juntos. Pida a su estudiante que compare el precio con el número de boletos que la gente quiere y que explique el patrón. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What happens to demand when the price goes up?",
        "What is the difference between a shortage and a surplus?",
      ],
    ),
    connections: {
      write: "Write a paragraph that uses a table to explain supply and demand.",
      speak: "Explain aloud why a very low price can cause a shortage.",
      listen: "Listen to a talk about prices and note one cause and one effect.",
    },
  },
  {
    id: "how-a-bill-becomes-law",
    level: "C",
    title: "From Idea to Law: How a Bill Moves Through Congress",
    summary:
      "Follow a bill through committees, two chambers and the President's desk, and see why the path is long on purpose.",
    genre: "Informational text, process",
    subject: "Social studies (civics)",
    topics: ["lawmaking", "Congress", "checks and balances"],
    keyUse: "Explain",
    eldStandard: "ELD-SS",
    languageFunction: "Explain a multi-step process and evaluate why it is designed that way.",
    languageFeatures: ["sequence words", "cause and effect", "formal civics vocabulary"],
    minutes: 18,
    content: "Explain the steps by which a bill becomes law and the purpose of each check.",
    language: "Use first, next, however and as a result to explain a long process.",
    essential: "Why is it hard to make a national law?",
    background: "Think about a rule in your school. Who had to agree before it began?",
    hook: "Most bills never become laws, and that is not an accident.",
    purpose: "Read to learn the steps a bill follows and why the process is slow and careful.",
    vocab: [
      [
        "bill",
        "a written idea for a law that members of Congress vote on",
        "The bill was introduced in the Senate.",
        "proyecto de ley",
      ],
      [
        "committee",
        "a small group of members who study one subject",
        "The education committee studied the bill.",
        "comité",
      ],
      [
        "override",
        "to pass a bill again after a veto, by a larger vote",
        "Congress needs two-thirds to override a veto.",
        "anular un veto",
      ],
      [
        "deliberate",
        "done carefully and on purpose",
        "The slow process is deliberate.",
        "deliberado",
      ],
    ],
    paras: [
      {
        text: "Every law that governs the United States began as an idea. The idea might come from a citizen, a group, the President or a member of Congress. However, only a member of Congress can formally introduce it. Once a member presents the idea in writing, it is called a bill.",
        q: "Who can introduce a bill?",
      },
      {
        text: "The bill first goes to a committee, a small group of members who study one subject, such as education or transportation. The committee may hold hearings, listen to experts, change the wording or vote to set the bill aside. Many bills end here. In fact, most bills never become law.",
        q: "What can a committee do?",
      },
      {
        text: "If the committee approves, the bill goes to the full chamber, either the House of Representatives or the Senate, where members debate and vote. Usually a simple majority is needed to pass. Then the bill moves to the other chamber, which repeats the steps. If the two chambers pass different versions, members from both meet to settle the differences, and each chamber must vote again on the same final text.",
        q: "What happens after a chamber passes a bill?",
      },
      {
        text: "Finally, the bill reaches the President. The President can sign it, which makes it a law, or veto it, which sends it back with objections. Congress can override a veto, but that requires a two-thirds vote in both chambers. Such votes are difficult to win, so a veto is a strong check on Congress.",
        q: "What can the President do with a bill?",
      },
      {
        text: "This long path is deliberate. Each step gives people a chance to question, improve or stop a bill, which makes it harder for any single group to pass a law carelessly. The cost is that progress can be slow, and critics sometimes argue that important problems wait too long for solutions.",
        q: "What are the benefit and the cost of the long path?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 1, who can formally introduce a bill?",
        opts: [
          "A member of Congress",
          "Any citizen who writes a bill",
          "The President acting on their own",
        ],
        why: [
          "Citizens can have ideas, but the paragraph says only a member of Congress can formally introduce one.",
          "The President can suggest an idea, but the paragraph says a member of Congress must present it.",
        ],
        rat: "Paragraph 1 says that ideas may come from many people, but only a member of Congress can formally introduce a bill.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 5, the long path is deliberate. What does deliberate mean?",
        opts: [
          "done carefully and on purpose",
          "done in secret and without notice",
          "done by accident and without a plan",
        ],
        why: [
          "The steps are public, with hearings and debates, so nothing in the text suggests secrecy.",
          "The paragraph says each step has a purpose, so the path was planned and not an accident.",
        ],
        rat: "Paragraph 5 says each step gives people a chance to question or stop a bill, so the long path was planned on purpose.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of events",
        type: "order",
        prompt: "Put these steps in the order in which a bill follows them.",
        items: [
          "A member of Congress introduces the bill.",
          "A committee studies the bill and votes on it.",
          "The full chamber debates and votes on the bill.",
          "The other chamber repeats the steps and votes.",
          "The President signs the bill or vetoes it.",
        ],
        rat: "Paragraphs 1 to 4 describe the steps in order: introduction, committee, first chamber, second chamber and the President.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement is best supported by paragraph 2?",
        opts: [
          "Committees decide that many bills never reach a full vote.",
          "Committees write every bill that Congress will vote on.",
          "Committees make a bill into law after hearing from experts.",
        ],
        why: [
          "A member of Congress writes and introduces a bill; the committee only studies and changes it.",
          "Making a law takes the full chambers and the President, not a committee alone.",
        ],
        rat: "Paragraph 2 says a committee can set a bill aside and that most bills never become law, so many stop at this step.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select supporting details",
        type: "multi",
        prompt: "Which two details show that the President and Congress limit each other's power?",
        opts: [
          "The President can veto a bill that Congress passed.",
          "Congress can override a veto with a two-thirds vote.",
          "A committee may hold hearings and listen to experts.",
          "Members of the House and Senate meet to settle differences.",
        ],
        ans: 2,
        why: [
          "Hearings are part of a committee's study; they do not show the two branches limiting each other.",
          "Settling differences happens between the two chambers of Congress, not between Congress and the President.",
        ],
        rat: "Paragraph 4 describes the veto and the override, the two ways the President and Congress check each other.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Evaluate with evidence",
        type: "short",
        prompt:
          "Explain one benefit and one cost of the long path a bill must follow. Use details from paragraphs 2 to 5.",
        lookFor: [
          "States one benefit, such as more chances to question or improve a bill",
          "States one cost, such as slow progress on important problems",
          "Uses a detail from the text for each",
        ],
        rubric: [
          "Names a benefit supported by the text",
          "Names a cost supported by the text",
          "Uses a connecting word such as however",
        ],
        frame: "One benefit of the long path is ___. However, one cost is ___.",
        model:
          "One benefit of the long path is that each step gives people a chance to question or improve a bill, so no group can pass a law carelessly. However, one cost is that progress can be slow, and important problems may wait a long time.",
      },
    ],
    transfer: {
      prompt:
        "Your school wants to start a new rule, such as a recycling program. Describe the steps you think the rule should follow before it begins, and explain why each step matters.",
      lookFor: [
        "Names at least three steps in order",
        "Explains the purpose of at least one step",
        "Uses sequence words such as first, next and finally",
      ],
      frame: "First, ___ should ___ because ___. Next, ___. Finally, ___.",
    },
    guide: {
      mini: "Make a flowchart on the board with the five steps. Ask students at which step a bill can stop, and mark the stopping points in a second color.",
      discussion: [
        "Is a slow process a good way to protect fairness, or does it cause problems? Explain.",
        "Why do you think a veto override needs more votes than a regular vote?",
        "How is this process like the way your school or town makes a rule?",
      ],
      misconception:
        "Students may think the President writes the laws. The text shows that members of Congress introduce bills and the President signs or vetoes them.",
      answerNotes: [
        "Question 3: introduction, committee, first chamber, second chamber, President.",
        "Question 5: the veto and the override are the two details in paragraph 4.",
      ],
      model:
        "One benefit is that each step gives people a chance to question or improve a bill. One cost is that progress can be slow.",
    },
    family: family(
      "Read the five paragraphs together. Ask your student to explain the path of a bill using the words first, next and finally. You can talk in any language, then ask for one sentence in English.",
      "Lean los cinco párrafos juntos. Pida a su estudiante que explique el camino de un proyecto de ley con las palabras primero, luego y finalmente. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["Why do most bills never become laws?", "What can the President do with a bill?"],
    ),
    connections: {
      write: "Write a paragraph that explains the steps a bill follows to become a law.",
      speak: "Explain aloud why the lawmaking process is slow on purpose.",
      listen: "Listen to a talk about a local law and note each step it followed.",
    },
  },
  {
    id: "vote-at-sixteen-two-views",
    level: "C",
    title: "Two Views: Should 16-Year-Olds Vote in Local Elections?",
    summary:
      "Compare two arguments, each with a claim, evidence and a response to the other side, and decide how well each one is supported.",
    genre: "Paired-view argument text",
    subject: "Social studies (civics)",
    topics: ["voting rights", "local government", "argument writing"],
    keyUse: "Argue",
    eldStandard: "ELD-SS",
    languageFunction: "Identify a claim, evidence and a counterclaim in an argument.",
    languageFeatures: ["claim and evidence", "counterclaims", "connecting words"],
    minutes: 18,
    content: "Identify and compare two arguments by their claims, evidence and counterclaims.",
    language: "Use claim, evidence, however and although to compare two sides.",
    essential: "How can two people care about the same community and still disagree?",
    background: "Think about a decision in your town or school. Who should help decide it?",
    hook: "Two invented writers, Dana and Omar, give their views on a real question that some towns have faced.",
    purpose: "Read to find each writer's claim, evidence and answer to the other side.",
    vocab: [
      [
        "claim",
        "a statement that a writer wants readers to accept",
        "Dana's claim is that 16-year-olds should vote.",
        "afirmación",
      ],
      [
        "evidence",
        "facts and reasons that support a claim",
        "Her evidence is that teens use the buses.",
        "evidencia",
      ],
      [
        "counterclaim",
        "a point from the other side that a writer answers",
        "Omar answers with a counterclaim about youth councils.",
        "contraargumento",
      ],
      [
        "weigh",
        "to think about how strong or important each point is",
        "Readers should weigh the evidence before they decide.",
        "sopesar",
      ],
    ],
    paras: [
      {
        text: "In most of the United States, a person must be 18 to vote. A few cities, such as Takoma Park, Maryland, let 16-year-olds vote in city elections. Should more towns do the same? Here are two arguments from invented writers, Dana and Omar.",
        q: "What question do the writers answer?",
      },
      {
        text: "Dana says yes. Her claim is that local decisions affect 16-year-olds every day. Cities decide bus routes, park hours and how safe the streets near school are. Teenagers ride the buses and use the parks, and many already have jobs and pay sales taxes. Dana also believes that voting is a habit. A person who votes for the first time at 16, while still living with family, may be more likely to keep voting for life.",
        q: "What is Dana's claim and evidence?",
      },
      {
        text: "Omar says no. His claim is that 18 is a clear and fair line for adult responsibilities. At 18, a person can serve on a jury, sign a contract and live independently. He also worries that younger voters have less time to learn about candidates and might simply copy the opinions of parents or friends.",
        q: "What is Omar's claim and evidence?",
      },
      {
        text: "Each writer answers the other side. Dana admits that any age line is somewhat arbitrary, but she points out that 16-year-olds already take on adult duties, such as driving and working. Omar admits that local issues matter to teenagers, but he argues that they can speak at public meetings and join youth councils without a vote.",
        q: "How does each writer answer the other side?",
      },
      {
        text: "Both writers care about young people and good government. Readers must weigh the evidence. How much do local decisions change teenagers' lives, and is 18 the right moment to start voting? A strong argument does not ignore the other side; it explains why its own evidence matters more.",
        q: "What should readers do with the evidence?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "What is Dana's main claim in paragraph 2?",
        opts: [
          "Local decisions affect 16-year-olds every day.",
          "Eighteen is a clear and fair age to vote.",
          "Youth councils give teens enough of a voice.",
        ],
        why: [
          "That is Omar's claim in paragraph 3, not Dana's claim.",
          "Youth councils are part of Omar's answer to Dana in paragraph 4, not Dana's own claim.",
        ],
        rat: "Paragraph 2 says Dana's claim is that local decisions affect 16-year-olds every day.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 5, readers must weigh the evidence. What does weigh mean here?",
        opts: [
          "think about how strong each point is",
          "measure how heavy each piece of paper is",
          "count how many writers agree with a view",
        ],
        why: [
          "The word is used about ideas, not about objects that have a weight on a scale.",
          "The text says there are only two writers, and the point is how strong the evidence is, not how many agree.",
        ],
        rat: "Paragraph 5 asks readers to decide how much local decisions change teenagers' lives, which means judging how strong the points are.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select supporting details",
        type: "multi",
        prompt: "Which two details does Dana use as evidence for her claim?",
        opts: [
          "Teenagers ride the buses and use the parks.",
          "Many teenagers already have jobs and pay sales taxes.",
          "At 18, a person can serve on a jury.",
          "Younger voters might copy their parents or friends.",
        ],
        ans: 2,
        why: [
          "Jury service at 18 is Omar's evidence that 18 is a clear line for adult duties.",
          "Copying parents or friends is Omar's worry about younger voters, not Dana's evidence.",
        ],
        rat: "Paragraph 2 gives Dana's evidence: teenagers use buses and parks, and many already work and pay sales taxes.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sort ideas by speaker",
        type: "sort",
        prompt: "Sort each point under the writer who makes it.",
        cats: ["Dana (yes)", "Omar (no)"],
        sortItems: [
          ["Teenagers use city buses and parks", 0],
          ["Some teens already drive and work", 0],
          ["Voting for the first time at 16 may become a lifelong habit", 0],
          ["Eighteen is a clear line for adult duties", 1],
          ["Teens can speak at public meetings", 1],
          ["Younger voters have less time to learn about candidates", 1],
        ],
        rat: "Paragraphs 2 to 4 give each writer's points: Dana argues from daily effects and habit, and Omar argues from a clear line and other ways to be heard.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement can the reader infer about both writers?",
        opts: [
          "They want what they think is best for teenagers and the town.",
          "They both believe that the voting age should not change.",
          "They both think teenagers know less than adults do.",
        ],
        why: [
          "Dana wants a lower voting age, so the two writers do not agree about the age.",
          "Only Omar worries about how much teenagers know, and Dana disagrees with him.",
        ],
        rat: "Paragraph 5 says both writers care about young people and good government, although they disagree about the age.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's choice",
        type: "choice",
        prompt: "Why does paragraph 4 show each writer answering the other?",
        opts: [
          "It shows that a strong argument deals with the other side's points.",
          "It shows that the writers agree on all of the main facts.",
          "It shows that one writer has given up on the argument.",
        ],
        why: [
          "The writers still disagree at the end of paragraph 4, so they do not agree on every fact.",
          "Neither writer gives up; each one admits a point and still keeps the original claim.",
        ],
        rat: "Paragraph 4 gives each writer a counterclaim, and paragraph 5 says a strong argument explains why its own evidence matters more.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Argue with evidence",
        type: "short",
        prompt:
          "Choose Dana or Omar. Explain which argument you find stronger, using one piece of evidence and one counterclaim from the text.",
        lookFor: [
          "States clearly which writer's argument is stronger",
          "Uses one accurate piece of evidence from the text",
          "Answers one point from the other side",
        ],
        rubric: [
          "States a clear choice",
          "Supports it with accurate evidence from the passage",
          "Responds to a counterclaim and does not ignore the other side",
        ],
        frame: "I find ___ stronger because ___. Although ___ says ___, I think ___.",
        model:
          "I find Dana stronger because teenagers ride the buses and use the parks, so local decisions affect them every day. Although Omar says teens can speak at public meetings, I think speaking is not the same as having a vote.",
      },
    ],
    transfer: {
      prompt:
        "Choose a school question, such as whether the library should be open at lunch. Write a claim, one piece of evidence and one counterclaim with your answer to it.",
      lookFor: [
        "A clear claim about the school question",
        "At least one piece of evidence",
        "A counterclaim and a response to it",
      ],
      frame: "I believe ___ because ___. Some people say ___, but ___.",
    },
    guide: {
      mini: "Make a chart on the board with columns for Dana and Omar and rows for claim, evidence and counterclaim. Have students fill in each box with a phrase from the text.",
      discussion: [
        "Which piece of evidence from either writer is the hardest to answer?",
        "Is the age of 18 the right line for voting? What evidence would change your mind?",
        "Why is it useful to read both sides before you decide?",
      ],
      misconception:
        "Students may think the writer with the longer paragraph has the stronger argument. Strength comes from relevant evidence and from answering the other side.",
      answerNotes: [
        "Question 3: the buses and parks and the jobs and taxes are the two details in paragraph 2.",
        "Question 4: Dana's points are the first three, and Omar's are the last three.",
      ],
      model:
        "I find Dana stronger because teenagers use the buses and parks, so local decisions affect them. Although Omar says teens can speak at meetings, speaking is not the same as voting.",
    },
    family: family(
      "Read both views aloud. Ask your student to tell you each writer's claim and one reason, then say which one they find stronger. You can talk in any language, then ask for one sentence in English.",
      "Lean los dos puntos de vista en voz alta. Pida a su estudiante que diga la afirmación de cada escritor y una razón, y luego cuál le parece más convincente. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What is Dana's claim, and what is Omar's claim?",
        "Which piece of evidence do you find strongest?",
      ],
    ),
    connections: {
      write:
        "Write a short argument with a claim, evidence and a counterclaim about a school question.",
      speak: "Tell a partner which writer is stronger and why, using the words claim and evidence.",
      listen: "Listen to two speakers who disagree and find each claim.",
    },
  },
  {
    id: "elm-creek-census-table",
    level: "C",
    title: "Reading a Census Table: Is Elm Creek Growing?",
    summary:
      "Use a census table for a fictional town to compare amounts and percents and learn why a number alone can mislead.",
    genre: "Informational text with a data table",
    subject: "Social studies and math (population, percent)",
    topics: ["census", "population", "percent of a whole"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Compare amounts and percents and explain what they show about a community.",
    languageFeatures: ["comparing numbers", "cause and effect", "reading a table"],
    minutes: 20,
    content:
      "Calculate a percent of a population and explain the difference between an amount and a rate of change.",
    language: "Use however, while and because to compare two kinds of change.",
    essential: "Why do we need both numbers and percents to understand a change?",
    background:
      "Think about how your school or neighborhood has changed. How could you measure the change?",
    hook: "The fictional town of Elm Creek added 3,000 people twice, yet the two changes were not equal.",
    purpose: "Read to learn how a census table shows growth and why percents tell a fuller story.",
    table: {
      headers: ["Year", "Population", "Increase from ten years earlier", "Residents under 18"],
      rows: [
        ["2000", "12,000", "Not shown", "3,600"],
        ["2010", "15,000", "3,000", "4,200"],
        ["2020", "18,000", "3,000", "4,500"],
      ],
      description:
        "A table with three rows for the years 2000, 2010 and 2020. Each row shows the town population, the increase from ten years earlier and the number of residents under 18.",
    },
    vocab: [
      [
        "census",
        "an official count of the people who live in a place",
        "The census shows how many people live in Elm Creek.",
        "censo",
      ],
      [
        "population",
        "the number of people who live in a place",
        "The population of Elm Creek grew.",
        "población",
      ],
      [
        "percent",
        "a part out of 100 equal parts",
        "Twenty percent means 20 out of every 100.",
        "por ciento",
      ],
      [
        "resident",
        "a person who lives in a place",
        "Every resident counts in the census.",
        "residente",
      ],
    ],
    paras: [
      {
        text: "Every ten years, the United States counts its people in a census. Local governments use these counts to plan schools, roads and services. In the fictional town of Elm Creek, a census table shows how the town has changed since the year 2000.",
        q: "Why does a town use a census?",
      },
      {
        text: "The table shows steady growth. The population rose from 12,000 in 2000 to 15,000 in 2010, an increase of 3,000. It then rose from 15,000 to 18,000 in 2020, another increase of 3,000. At first glance, the two decades look equal.",
        q: "How did the population change?",
      },
      {
        text: "Percent change tells a different story. The first increase of 3,000 was 25% of the 12,000 residents who lived in town in 2000, because 3,000 divided by 12,000 is 0.25. The second increase of 3,000 was only 20% of 15,000. The amount stayed the same, but the rate of growth slowed, because the same number of new people is a smaller part of a bigger town.",
        q: "Why are the two increases not equal?",
      },
      {
        text: "The table also shows residents under 18. Their number grew from 3,600 to 4,500, so the schools probably needed more space. However, their share of the town shrank from 30% in 2000 to 25% in 2020, because adults grew in number more quickly than children did. Planners watch both kinds of numbers. Counts show how many classrooms or buses are needed, while percents show how the makeup of the community is changing.",
        q: "What do counts and percents each show?",
      },
      {
        text: "Reading a table well takes two steps. First, find the numbers. Second, ask what they are being compared with. A number alone cannot say whether a change is large or small. A change of 3,000 people means more in a town of 12,000 than in a town of 150,000.",
        q: "What are the two steps for reading a table?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "Use the table. What was the population of Elm Creek in 2010?",
        opts: ["15,000", "12,000", "18,000"],
        why: [
          "Twelve thousand is the population in 2000, one row earlier.",
          "Eighteen thousand is the population in 2020, one row later.",
        ],
        rat: "The 2010 row of the table shows a population of 15,000.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 1, the census counts people. What is a census?",
        opts: [
          "an official count of the people in a place",
          "a vote to choose the leaders of a town",
          "a map that shows where roads and schools are",
        ],
        why: [
          "A vote chooses leaders, but the paragraph says the census is a count used for planning.",
          "A map could help a planner, but the text says the census counts the people, not places.",
        ],
        rat: "Paragraph 1 says the United States counts its people every ten years in a census.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Calculate a percent from a table",
        type: "choice",
        prompt: "Use the table. What percent of Elm Creek residents were under 18 in 2010?",
        opts: ["28%", "42%", "35%"],
        why: [
          "Forty-two comes from copying digits of 4,200; divide 4,200 by the whole population of 15,000 instead.",
          "Thirty-five does not match 4,200 out of 15,000; check the division carefully.",
        ],
        rat: "In 2010, 4,200 of the 15,000 residents were under 18, and 4,200 divided by 15,000 is 0.28, or 28%.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Role of a paragraph",
        type: "choice",
        prompt: "Why does the writer explain the 25% and 20% figures in paragraph 3?",
        opts: [
          "To show that an equal increase can be a different rate of growth.",
          "To show that the town lost people between 2010 and 2020.",
          "To show that the census count in 2000 was not correct.",
        ],
        why: [
          "The table shows the population rising in each decade, so the town did not lose people.",
          "The paragraph does not question the 2000 count; it compares percents of two different totals.",
        ],
        rat: "Paragraph 3 says the amount stayed the same but the rate slowed, because 3,000 is 25% of 12,000 and only 20% of 15,000.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which conclusion do the table and paragraph 4 best support?",
        opts: [
          "Elm Creek may need more classroom space even though children are a smaller share.",
          "Elm Creek may need fewer schools because the share of children went down.",
          "Elm Creek may need to count its people less often than every ten years.",
        ],
        why: [
          "The number of children rose from 3,600 to 4,500, so a smaller share does not mean fewer children.",
          "The table and paragraphs say nothing about changing how often the census happens.",
        ],
        rat: "Paragraph 4 says the number of children grew, so schools probably needed more space, while the share fell from 30% to 25%.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with data",
        type: "short",
        prompt:
          "Explain why an increase of 3,000 people was a smaller rate of growth in 2020 than in 2010. Use numbers from the passage.",
        lookFor: [
          "Says 3,000 was 25% of 12,000 and 20% of 15,000",
          "Says the town was larger the second time",
          "Explains that the same amount is a smaller part of a bigger whole",
        ],
        rubric: [
          "Uses the percents 25% and 20%",
          "Names the two starting populations",
          "Explains why a bigger whole makes the rate smaller",
        ],
        frame:
          "The increase was ___ both times, but it was ___% of ___ and only ___% of ___. This is because ___.",
        model:
          "The increase was 3,000 both times, but it was 25% of 12,000 and only 20% of 15,000. This is because the same number of new people is a smaller part of a larger town.",
      },
    ],
    transfer: {
      prompt:
        "A school grows from 500 students to 600 students. A second school grows from 1,000 students to 1,100 students. Explain which school grew by a larger percent, and why.",
      lookFor: [
        "Finds that both schools added 100 students",
        "Finds 20% for the first school and 10% for the second",
        "Explains that 100 is a larger part of 500 than of 1,000",
      ],
      frame:
        "Both schools added ___, but ___ is ___% of ___ and ___% of ___. So the ___ school grew by a larger percent.",
    },
    guide: {
      mini: "Write the table on the board. Compute 3,000 divided by 12,000 and 3,000 divided by 15,000 together, and ask students to say which fraction is larger and why.",
      discussion: [
        "Why might a town planner care about the percent of children, and not only their number?",
        "When is a percent more useful than an amount, and when is the reverse true?",
        "What other numbers about a town could a census table show?",
      ],
      misconception:
        "Students may think an equal increase means equal growth. The same increase is a smaller percent of a larger starting number.",
      answerNotes: [
        "Question 3: 4,200 divided by 15,000 equals 0.28, which is 28%.",
        "Transfer: 100 out of 500 is 20%, while 100 out of 1,000 is 10%.",
      ],
      model:
        "The increase was 3,000 both times, but it was 25% of 12,000 and only 20% of 15,000, because the same number is a smaller part of a bigger town.",
    },
    family: family(
      "Look at the table together. Ask your student to explain why 3,000 new people did not mean the same percent both times. You can talk in any language, then ask for one sentence in English.",
      "Miren la tabla juntos. Pida a su estudiante que explique por qué 3,000 personas nuevas no significaron el mismo porcentaje las dos veces. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What percent of 12,000 is 3,000?", "Why do planners look at both counts and percents?"],
    ),
    connections: {
      write:
        "Write a paragraph that uses a table to compare an amount of change with a percent of change.",
      speak: "Explain aloud why the same increase can be a different percent.",
      listen: "Listen to a talk about a population count and note one amount and one percent.",
    },
  },
];

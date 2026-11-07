// Grades 6-8 publisher pass, Reading Room lessons, batch 4b: social studies, data and primary-source style. Original texts.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "mesopotamia-clay-tablets",
    level: "A",
    title: "Writing in Clay: Scribes of Mesopotamia",
    summary:
      "Learn how people in Mesopotamia pressed marks into clay to keep records, and why some of their writing survives today.",
    genre: "Informational text",
    subject: "Social studies (ancient Mesopotamia)",
    topics: ["ancient Mesopotamia", "writing systems", "historical sources"],
    keyUse: "Inform",
    eldStandard: "ELD-SS",
    languageFunction: "Describe how an ancient people made and used writing.",
    languageFeatures: ["sequence words", "cause and effect", "past tense"],
    minutes: 12,
    content: "Explain how cuneiform was made, who used it and why tablets survive today.",
    language: "Use first, later and because to describe how a tool or practice changed.",
    essential: "Why do people invent writing?",
    background: "Think about a list or a note you wrote this week. What did it help you remember?",
    hook: "More than 5,000 years ago, people in Mesopotamia wrote with a reed on soft clay.",
    purpose: "Read to learn how cuneiform was made, who learned it and why we can still read it.",
    vocab: [
      [
        "scribe",
        "a person whose job was to write and keep records",
        "A scribe wrote down how much grain the farmer sold.",
        "escriba",
      ],
      [
        "tablet",
        "a flat piece of clay used for writing",
        "The tablet dried in the sun.",
        "tablilla",
      ],
      [
        "stylus",
        "a sharp reed used to press marks into clay",
        "The scribe pressed the stylus into the clay.",
        "estilete",
      ],
      [
        "archaeologist",
        "a scientist who studies the past by digging up old objects",
        "An archaeologist found a tablet in the ruins.",
        "arqueólogo",
      ],
    ],
    paras: [
      {
        text: "Mesopotamia means “the land between the rivers.” The rivers are the Tigris and the Euphrates, in what is now Iraq and nearby lands. More than 5,000 years ago, people there built some of the first cities. Farmers grew more grain than their own families needed, so the cities needed a way to keep records.",
        q: "Why did the cities need records?",
      },
      {
        text: "In the south, in a land called Sumer, people wrote with a sharp reed called a stylus. They pressed it into soft, wet clay. Each press made a small wedge-shaped mark. Today this writing is called cuneiform, from a Latin word that means wedge. When the clay dried, the writing stayed.",
        q: "How was cuneiform made?",
      },
      {
        text: "At first, scribes used clay tablets to count goods, such as sacks of grain, jars of oil and sheep. Later they wrote letters, laws, prayers and stories. Learning cuneiform took years, because there were hundreds of signs. Most students were boys from families that could pay for the training.",
        q: "What did scribes write over time?",
      },
      {
        text: "Clay lasts a very long time, so many thousands of tablets have survived. Archaeologists can still read them. The tablets tell us about the prices of goods, how people settled arguments, and even the practice work of students. Without them, we would know much less about life in the first cities.",
        q: "Why can we still learn from the tablets?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 1, why did the first cities need a way to keep records?",
        opts: [
          "Farmers grew more grain than their families needed.",
          "The rivers flooded the cities during every season.",
          "Rulers wanted to send letters to far-away lands.",
        ],
        why: [
          "The paragraph names two rivers, but it never says flooding was the reason for records.",
          "Letters are mentioned later in paragraph 3; paragraph 1 gives a different reason.",
        ],
        rat: "Paragraph 1 says farmers grew more grain than their own families needed, so the cities needed to keep records.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, people wrote with a stylus. What is a stylus?",
        opts: [
          "a sharp reed used to press marks into clay",
          "a flat stone used to smooth wet clay",
          "a thin brush used to paint on tablets",
        ],
        why: [
          "The paragraph says the writing was pressed into the clay, not smoothed with a stone.",
          "Nothing in the paragraph mentions paint; each mark was made by a press of the reed.",
        ],
        rat: "Paragraph 2 says people wrote with a sharp reed called a stylus and pressed it into soft, wet clay.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "How the text is organized",
        type: "choice",
        prompt: "How is paragraph 3 organized?",
        opts: [
          "It tells how tablets were used first and how their uses grew later.",
          "It compares clay tablets with paper used in other lands.",
          "It lists the rules that every student had to follow.",
        ],
        why: [
          "Paper is not mentioned in this text; the paragraph is about how clay tablets were used.",
          "The paragraph says students trained for years, but it does not list any rules.",
        ],
        rat: "Paragraph 3 begins with At first, counting goods, and then says Later, scribes wrote letters, laws, prayers and stories.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What can the reader infer about being a scribe in Sumer?",
        opts: [
          "It was a skilled job that few people were trained to do.",
          "It was an easy job that most children learned at home.",
          "It was a job that ended once paper was invented.",
        ],
        why: [
          "The text says learning took years and cost money, so it was not easy or learned by most children.",
          "Paper is never mentioned, so the text does not support a date when the job ended.",
        ],
        rat: "Paragraph 3 says learning took years because there were hundreds of signs, and most students were boys from families that could pay for the training.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt:
          "Select the paragraph that explains why we can still read Mesopotamian writing today.",
        evidence: ["p4"],
        rat: "Paragraph 4 says clay lasts a very long time, so thousands of tablets have survived and archaeologists can read them.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain how cuneiform was made and why many tablets still exist today. Use details from paragraphs 2 and 4.",
        lookFor: [
          "Says scribes pressed a reed stylus into wet clay",
          "Says clay lasts a very long time",
          "Connects the two ideas with so or because",
        ],
        rubric: [
          "Describes how the marks were made",
          "Gives a reason the tablets survived",
          "Uses a connecting word",
        ],
        frame: "Scribes made cuneiform by ___. Many tablets survive because ___.",
        model:
          "Scribes made cuneiform by pressing a sharp reed into soft, wet clay. Many tablets survive because clay lasts a very long time after it dries, so archaeologists can still read them.",
      },
    ],
    transfer: {
      prompt:
        "Think of something you write or record today, such as a list, a text message or a school record. Explain why it is useful to keep a written record, and compare it to a clay tablet.",
      lookFor: [
        "Names something that is written down today",
        "Gives a reason a record is useful",
        "Compares it to a tablet using like or different from",
      ],
      frame: "Today people write ___ because ___. This is like a clay tablet because ___.",
    },
    guide: {
      mini: "Pass around a small piece of clay or modeling dough and a pencil tip. Have students press three wedge marks, then talk about why the marks would last when dry.",
      discussion: [
        "Why would counting grain and sheep be the first use of writing?",
        "What might we not know about Mesopotamia if the tablets had been made of paper?",
        "How are clay tablets like a school record today?",
      ],
      misconception:
        "Students may think cuneiform is a picture language or a code. It is a writing system made of wedge-shaped signs pressed into clay.",
      answerNotes: [
        "Question 1: paragraph 1 gives the reason: extra grain, so cities needed records.",
        "Question 5: paragraph 4 is the paragraph that explains survival.",
      ],
      model:
        "Scribes made cuneiform by pressing a reed into wet clay. Many tablets survive because clay lasts a long time.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain how scribes wrote on clay and why the tablets last. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique cómo escribían los escribas en arcilla y por qué las tablillas duran tanto. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What did scribes write with, and what did they write on?",
        "Why can we still read these tablets today?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains how cuneiform was made and used.",
      speak: "Explain aloud why the first cities needed written records.",
      listen: "Listen to a talk about ancient writing and note two details.",
    },
  },
  {
    id: "riverton-town-budget",
    level: "A",
    title: "Where Does the Town's Money Go?",
    summary:
      "Read a budget table for a fictional town and use percents to find how many dollars each service receives.",
    genre: "Informational text with a data table",
    subject: "Social studies (local government) and math",
    topics: ["local government", "budgets", "percent of a whole"],
    keyUse: "Inform",
    eldStandard: "ELD-SS",
    languageFunction: "Describe how a community plans its spending and explain a choice.",
    languageFeatures: ["reading a table", "cause and effect", "comparing amounts"],
    minutes: 12,
    content: "Read a budget table, find a percent of a whole and explain a spending trade-off.",
    language: "Use because and if to explain a choice about money.",
    essential: "How does a town decide how to spend its money?",
    background: "Think about money in your family. How do people decide what to buy first?",
    hook: "The fictional town of Riverton has $1,000,000 to spend this year, and everyone wants something different.",
    purpose: "Read to learn what a budget is and how to find the dollars behind each percent.",
    table: {
      headers: ["Service", "Share of the budget", "Dollars"],
      rows: [
        ["Police and fire teams", "35%", "$350,000"],
        ["Roads and trash pickup", "25%", "$250,000"],
        ["Parks and the library", "20%", "$200,000"],
        ["Town offices and other costs", "20%", "$200,000"],
      ],
      description:
        "A table with four rows. Each row names a town service, the percent of the budget it receives and the dollars it receives, out of $1,000,000.",
    },
    vocab: [
      [
        "budget",
        "a plan for how money will be spent in one year",
        "The town budget is $1,000,000.",
        "presupuesto",
      ],
      [
        "tax",
        "money that people pay to the government",
        "Residents pay taxes to the town.",
        "impuesto",
      ],
      [
        "service",
        "work that the government does for the community",
        "Trash pickup is a town service.",
        "servicio",
      ],
      [
        "share",
        "the part of a whole that something receives",
        "Police and fire teams get the largest share.",
        "parte",
      ],
    ],
    paras: [
      {
        text: "A town needs money to pay for services. Residents pay taxes, and the town uses that money to run police and fire teams, fix roads, pick up trash, and keep parks and libraries open. A budget is a plan for how the money will be spent in one year.",
        q: "What is a budget?",
      },
      {
        text: "The leaders of Riverton, a fictional town, plan to spend $1,000,000 this year. The table shows where the money will go. Police and fire teams receive the largest share, 35%. Roads and trash pickup receive 25%. Parks and the library receive 20%, and town offices and other costs receive the last 20%.",
        q: "Which service receives the largest share?",
      },
      {
        text: "Every percent in the table is a part of the same whole. Together, the parts add up to 100%, or the whole $1,000,000. To find a part, multiply the whole by the percent. For example, 20% of $1,000,000 is $200,000.",
        q: "How can you find the dollars for a percent?",
      },
      {
        text: "Riverton holds a public meeting before leaders vote on the budget. Residents can speak. Some may ask for more money for the park, and others may ask for lower taxes. When the total is fixed, spending more in one place means spending less in another.",
        q: "Why is a budget about choices?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 1, what is a budget?",
        opts: [
          "a plan for how money will be spent in one year",
          "a tax that every resident pays to the town each year",
          "a list of the services the town used in the past",
        ],
        why: [
          "A tax is money residents pay; the paragraph says a budget is a plan for spending it.",
          "The paragraph looks ahead to one year of spending, not back at past services.",
        ],
        rat: "Paragraph 1 says a budget is a plan for how the money will be spent in one year.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 2, police and fire teams receive the largest share. What does share mean here?",
        opts: [
          "the part of a whole that something receives",
          "the act of giving a gift to a good friend",
          "the amount of money that a person earns",
        ],
        why: [
          "The paragraph is about parts of one budget, not about gifts between friends.",
          "The word describes how the town divides its money, not what any person earns.",
        ],
        rat: "Paragraph 2 gives each service a percent of the $1,000,000, so a share is the part each one receives.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Read a table",
        type: "choice",
        prompt: "Use the table. How many dollars are planned for roads and trash pickup?",
        opts: ["$250,000", "$350,000", "$200,000"],
        why: [
          "Three hundred fifty thousand dollars is the amount for police and fire teams.",
          "Two hundred thousand dollars is the amount for parks and the library.",
        ],
        rat: "The Roads and trash pickup row of the table shows 25%, which is $250,000.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Find a percent of a whole",
        type: "choice",
        prompt:
          "Riverton wants to add $50,000 to the library. What percent of the $1,000,000 budget is $50,000?",
        opts: ["5%", "50%", "0.5%"],
        why: [
          "Fifty percent would be $500,000, which is half of the budget.",
          "Half of one percent would be only $5,000, much less than $50,000.",
        ],
        rat: "Paragraph 3 says 20% of $1,000,000 is $200,000, so 5%, which is one fourth of 20%, is $50,000.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt:
          "Riverton spends $50,000 more on parks and keeps the total at $1,000,000. What must happen?",
        opts: [
          "It must spend $50,000 less somewhere else.",
          "It must raise the total budget to $1,050,000.",
          "It can spend more without changing anything.",
        ],
        why: [
          "The question says the total stays at $1,000,000, so raising it is not allowed.",
          "The total is fixed, so extra money for parks has to come from another service.",
        ],
        rat: "Paragraph 4 says that when the total is fixed, spending more in one place means spending less in another.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Role of a paragraph",
        type: "choice",
        prompt: "What is the main job of paragraph 3?",
        opts: [
          "It explains how to find a part of the budget, with an example.",
          "It lists the people who will vote on the town budget.",
          "It argues that the town should lower its taxes.",
        ],
        why: [
          "The voting meeting is described in paragraph 4, and paragraph 3 is about calculating.",
          "No paragraph argues for lower taxes; paragraph 4 says only that some residents may ask for it.",
        ],
        rat: "Paragraph 3 explains that you multiply the whole by the percent and gives 20% of $1,000,000 as an example.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with data",
        type: "short",
        prompt:
          "Explain what the table shows about Riverton's priorities. Use two percents from the table.",
        lookFor: [
          "Names the service with the largest share, 35%",
          "Compares it with another percent from the table",
          "Says what this suggests the town values most",
        ],
        rubric: [
          "Uses two accurate percents",
          "Makes a comparison",
          "Connects the numbers to a priority",
        ],
        frame:
          "The largest share, ___%, goes to ___. Compared with ___, which gets ___%, this shows that ___.",
        model:
          "The largest share, 35%, goes to police and fire teams. Compared with parks and the library, which get 20%, this shows that Riverton values safety services the most, although it still spends on other services.",
      },
    ],
    transfer: {
      prompt:
        "A class club has $200 to spend. It plans 50% for supplies, 30% for a snack party and 20% for a prize. Explain how many dollars each part gets and how you know.",
      lookFor: [
        "Finds $100, $60 and $40",
        "Says the percents add up to 100%",
        "Explains that you multiply $200 by each percent",
      ],
      frame:
        "Supplies get ___% of $200, which is $___. The snack party gets $___, and the prize gets $___.",
    },
    guide: {
      mini: "Draw a bar divided into four parts that match the table. Label each part with its percent and then with its dollars, and show that the parts together make the whole bar.",
      discussion: [
        "Which service would you increase if you had $50,000 more, and what would you reduce?",
        "Why do towns hold public meetings before they vote on a budget?",
        "How is a family's budget like a town's budget?",
      ],
      misconception:
        "Students may think percents in a table can be any numbers. In a budget, the percents are parts of one whole and must add up to 100%.",
      answerNotes: [
        "Question 3: the Roads and trash pickup row says $250,000.",
        "Question 4: 5% of $1,000,000 is $50,000, since 10% is $100,000.",
      ],
      model:
        "The largest share, 35%, goes to police and fire teams. Compared with parks and the library at 20%, this shows the town values safety services the most.",
    },
    family: family(
      "Look at the table together. Ask your student to explain what 20% of $1,000,000 means in dollars. You can talk in any language, then ask for one sentence in English.",
      "Miren la tabla juntos. Pida a su estudiante que explique cuánto es el 20% de $1,000,000 en dólares. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "Which service gets the largest share of the budget?",
        "Why does more money for one service mean less for another?",
      ],
    ),
    connections: {
      write: "Write a paragraph that uses a budget table to explain a town's priorities.",
      speak: "Explain aloud how to find 25% of $1,000,000.",
      listen: "Listen to a short talk about a town meeting and note one request.",
    },
  },
  {
    id: "grand-canal-china",
    level: "B",
    title: "The Grand Canal: Moving Grain Across China",
    summary:
      "Learn why China's rulers joined rivers with a long canal, what it carried and what it cost the people who built it.",
    genre: "Informational text with math",
    subject: "Social studies (ancient and medieval China) and math",
    topics: ["Grand Canal", "trade and transportation", "rates and distance"],
    keyUse: "Explain",
    eldStandard: "ELD-SS",
    languageFunction: "Explain a problem, its solution and its costs and benefits.",
    languageFeatures: ["problem and solution", "cause and effect", "however"],
    minutes: 15,
    content:
      "Explain why the Grand Canal was built, what it did and what it cost, and use a rate to find a travel time.",
    language: "Use because, so and however to explain benefits and costs.",
    essential: "Why do people build huge projects, and who pays the cost?",
    background: "Think about a bridge, road or railroad near you. Why was it built?",
    hook: "A canal about 1,800 kilometers long helped to feed a capital city far from the farms.",
    purpose: "Read to find out why the canal was built, what it carried and what it cost people.",
    vocab: [
      ["canal", "a channel dug to carry boats or water", "The canal joined two rivers.", "canal"],
      [
        "grain",
        "the seeds of plants such as rice and wheat",
        "Boats carried grain north.",
        "grano",
      ],
      [
        "dynasty",
        "a line of rulers from one family",
        "The Sui dynasty ruled for a short time.",
        "dinastía",
      ],
      [
        "extend",
        "to make something longer",
        "Later rulers extended the canal to Beijing.",
        "extender",
      ],
    ],
    paras: [
      {
        text: "China's two longest rivers, the Yellow River and the Yangtze, both flow from west to east. A boat could travel along either river, but it could not go north or south from one to the other. For a country that stretches far in both directions, that was a problem.",
        q: "What problem did the rivers cause?",
      },
      {
        text: "To solve it, rulers dug canals that joined rivers and lakes. Some sections are about 2,500 years old. Around the year 600, during the Sui dynasty, workers linked many pieces into one long waterway, now called the Grand Canal. Later dynasties repaired it and extended it to reach Beijing. Today it is about 1,800 kilometers long.",
        q: "How was the Grand Canal made?",
      },
      {
        text: "The canal's main job was moving grain. The warm, wet south grew plenty of rice, while the north had a capital city and armies to feed. Boats carried rice north along the canal, along with salt, cloth and other goods. Moving goods by water cost less than carrying them by road, because one boat could hold as much as many carts.",
        q: "What did the canal carry, and why by water?",
      },
      {
        text: "The canal also had a human cost. Historians say that millions of workers were called to dig it, and many were forced to work by the government. The heavy demands made people angry. The Sui dynasty lasted only about 37 years, and that anger is often named as one reason it fell.",
        q: "What was the human cost?",
      },
      {
        text: "Math helps show the size of the project. Suppose a loaded boat travels 30 kilometers each day. To cover 1,800 kilometers, it would need 1,800 divided by 30, or 60 days. Moving the same grain over land would have needed many more carts, animals and workers.",
        q: "How long would the trip take?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 3, what was the canal's main job?",
        opts: [
          "moving grain from the south to the north",
          "bringing water to farms in the far north",
          "keeping armies from crossing the rivers",
        ],
        why: [
          "The canal joined rivers for boats; the text does not say it watered northern farms.",
          "Armies are mentioned only as people who needed food, not as people the canal was meant to stop.",
        ],
        rat: "Paragraph 3 says the canal's main job was moving grain, since the south grew rice and the north needed to feed a capital and armies.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, later dynasties extended the canal. What does extended mean?",
        opts: ["made it longer", "made it wider", "made it cleaner"],
        why: [
          "The text says it was extended to reach Beijing, which is about distance, not width.",
          "Nothing in the paragraph is about cleaning; the canal grew by reaching a new place.",
        ],
        rat: "Paragraph 2 says later dynasties extended it to reach Beijing, which means they made it longer.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use a rate",
        type: "choice",
        prompt:
          "Another boat travels 20 kilometers each day. How many days would it need to cover 1,800 kilometers?",
        opts: ["90 days", "60 days", "1,780 days"],
        why: [
          "Sixty days is the answer for 30 kilometers each day; a shorter daily distance needs more days.",
          "Subtracting 20 from 1,800 does not tell the days; divide the whole distance by the distance for one day.",
        ],
        rat: "The passage divides the total distance by the daily distance, and 1,800 divided by 20 equals 90 days.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Role of a paragraph",
        type: "choice",
        prompt: "What is the main job of paragraph 4?",
        opts: [
          "It shows the cost of the project for the people who built it.",
          "It explains how boats carried salt and cloth to the north.",
          "It describes how workers joined the rivers and lakes.",
        ],
        why: [
          "Salt and cloth are mentioned in paragraph 3, and paragraph 4 begins with the human cost.",
          "Paragraph 2 describes how the pieces were joined; paragraph 4 is about the people who were called to work.",
        ],
        rat: "Paragraph 4 begins with The canal also had a human cost and describes forced work and anger.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement is best supported by paragraphs 3 and 4 together?",
        opts: [
          "The canal helped the government but also placed heavy demands on its people.",
          "The canal was easy to build, so the government asked little of its workers.",
          "The canal was not useful, so later dynasties let it fall apart.",
        ],
        why: [
          "Paragraph 4 describes heavy demands and anger, so the work was not easy for people.",
          "Paragraph 2 says later dynasties repaired and extended it, so it was not left to fall apart.",
        ],
        rat: "Paragraph 3 describes how the canal helped feed the capital, and paragraph 4 describes forced work and anger.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain one benefit and one cost of the Grand Canal. Use details from paragraphs 3 and 4.",
        lookFor: [
          "Names a benefit, such as moving grain to the north cheaply",
          "Names a cost, such as forced work by millions of people",
          "Connects the two with however",
        ],
        rubric: [
          "States a benefit supported by the text",
          "States a cost supported by the text",
          "Uses however or a similar connecting word",
        ],
        frame: "One benefit of the canal was ___. However, it also cost ___.",
        model:
          "One benefit of the canal was that boats could move grain from the south to the north for less than the cost of carrying it by road. However, it also cost millions of workers their freedom, because many were forced to dig it, and that made people angry.",
      },
    ],
    transfer: {
      prompt:
        "A barge carries 120 tons of rice. A cart carries 2 tons. Explain how many carts would be needed to carry the same rice and why a canal might be useful.",
      lookFor: [
        "Divides 120 by 2 to get 60 carts",
        "Says one barge replaces many carts",
        "Connects the numbers to the usefulness of the canal",
      ],
      frame: "I divide ___ by ___ to get ___ carts. This shows that a canal is useful because ___.",
    },
    guide: {
      mini: "Draw a simple map with two west-to-east rivers and a north-south line joining them. Ask students why a boat on one river could not reach the other without a canal.",
      discussion: [
        "Is a project worth building if it harms many of the workers? What evidence matters?",
        "Why might a government want to feed its capital from far away?",
        "What modern projects move goods or people over long distances?",
      ],
      misconception:
        "Students may think the canal was built in one reign and one piece. The text says some sections were centuries older and later dynasties repaired and extended it.",
      answerNotes: [
        "Question 3: 1,800 divided by 20 equals 90 days.",
        "Question 6: a benefit comes from paragraph 3 and a cost from paragraph 4.",
      ],
      model:
        "One benefit was cheap movement of grain north. However, it cost millions of workers, many of them forced to work.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain one good result and one hard result of building the canal. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique un buen resultado y un resultado difícil de construir el canal. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What did boats carry along the Grand Canal?",
        "How can you find the number of days if you know the distance and the distance for one day?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains one benefit and one cost of a big project.",
      speak:
        "Explain aloud how a distance and a daily distance tell you how many days a trip needs.",
      listen: "Listen to a talk about trade routes and note what each route carried.",
    },
  },
  {
    id: "ellis-island-diary-1907",
    level: "B",
    title: "An Immigrant's Diary, 1907 (an invented diary)",
    summary:
      "Read two invented diary entries to follow a girl's arrival at Ellis Island and learn what newcomers experienced there.",
    genre: "Invented primary-source style diary",
    subject: "Social studies (United States history)",
    topics: ["immigration", "Ellis Island", "primary sources"],
    keyUse: "Narrate",
    eldStandard: "ELD-SS",
    languageFunction: "Retell events in order from one person's point of view.",
    languageFeatures: ["sequence words", "past tense", "first-person voice"],
    minutes: 15,
    content:
      "Retell the order of events at Ellis Island and explain how a diary shows one person's experience.",
    language: "Use first, next, then and at last to retell events in a diary.",
    essential: "What is it like to arrive in a new country?",
    background:
      "Think about a time you came to a new place. What did you see, feel and need to do?",
    hook: "This diary is invented for this lesson. It is not a real diary, but Ellis Island was a real place where millions of newcomers arrived.",
    purpose: "Read to follow the order of events and to notice how a diary shows feelings.",
    vocab: [
      [
        "immigrant",
        "a person who moves to a new country to live",
        "Anya is an immigrant from Europe.",
        "inmigrante",
      ],
      [
        "inspector",
        "a person whose job is to check people or things carefully",
        "The inspector asked questions.",
        "inspector",
      ],
      [
        "interpreter",
        "a person who helps people who speak different languages understand each other",
        "An interpreter repeated each question in Anya's language.",
        "intérprete",
      ],
      ["passage", "a trip by ship", "The passage across the ocean took twelve days.", "travesía"],
    ],
    paras: [
      {
        text: "This diary is invented for this lesson. It is not a real diary. It imagines a twelve-year-old girl named Anya, who sails to New York in March 1907 with her mother and her little brother. Her father is waiting for them in the city.",
        q: "Is this diary real?",
      },
      {
        text: "March 14. We have been on this ship for twelve days. We sleep far below the deck, where the air is warm and heavy. Today everyone ran to the rail. Through the mist I saw a huge green statue holding a torch. Mama cried, and so did many people around us.",
        q: "What did Anya see from the ship?",
      },
      {
        text: "March 15. A ferry carried us to Ellis Island. We climbed a long staircase into a huge hall. Doctors watched us walk past. One doctor made a chalk mark on my brother's coat. Mama was frightened, but a second doctor looked at his eyes and said he was only tired. We were allowed to go on.",
        q: "What happened with the doctors?",
      },
      {
        text: "Next, an inspector asked questions through an interpreter. What is your name? Can you work? Do you have someone waiting for you? Mama answered every question in a quiet voice. At last the inspector let us pass. Papa was standing at the gate, and my brother ran to him.",
        q: "What happened at the end of the day?",
      },
      {
        text: "Anya is invented, but Ellis Island was real. It opened in 1892 and closed in 1954. About twelve million people passed through it. Most were allowed to enter the country, although some were sent back, and some families waited a long time for an answer.",
        q: "What parts of this text are real?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to paragraph 3, what did one doctor do to Anya's brother's coat?",
        opts: [
          "He made a chalk mark on it.",
          "He tore a small hole in it.",
          "He wrote a name tag on it.",
        ],
        why: [
          "Nothing in the paragraph says the coat was damaged; it only says it was marked.",
          "A name tag is not mentioned; the mark was made with chalk and led to a second look.",
        ],
        rat: "Paragraph 3 says one doctor made a chalk mark on the coat, and a second doctor then looked at the boy's eyes.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 4, the inspector asked questions through an interpreter. What is an interpreter?",
        opts: [
          "a person who helps people who speak different languages understand each other",
          "a person who writes down each answer in a large record book kept by the island",
          "a person who checks the health of newcomers and marks their coats with chalk",
        ],
        why: [
          "Writing answers is a different job, and the paragraph says the interpreter helped with the questions.",
          "Checking health was the doctors' job in paragraph 3, not the interpreter's.",
        ],
        rat: "Paragraph 4 says the inspector asked questions through an interpreter, so the interpreter helped the inspector and Mama understand each other.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of events",
        type: "order",
        prompt: "Put these events from the diary in the order they happened.",
        items: [
          "Anya sees a green statue from the ship.",
          "A ferry carries the family to Ellis Island.",
          "Doctors watch the passengers walk past.",
          "An inspector asks questions through an interpreter.",
          "The family meets Papa at the gate.",
        ],
        rat: "Paragraphs 2 to 4 give the order: the statue on March 14, the ferry and doctors on March 15, then the inspector and Papa.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why did Mama cry when she saw the statue?",
        opts: [
          "The statue showed that the long trip was almost over.",
          "The statue reminded her that the doctors would soon arrive.",
          "The statue meant that her husband had already left the city.",
        ],
        why: [
          "The diary does not connect the statue with the doctors; the doctors come on the next day.",
          "Papa is waiting in New York, so the statue does not mean he had left.",
        ],
        rat: "Paragraph 2 says many people cried, and the family had been on the ship for twelve days, so the sight of land showed the trip was almost over.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's choice",
        type: "choice",
        prompt: "Why might the author tell this story in a diary?",
        opts: [
          "A diary lets readers see events and feelings through one person's eyes.",
          "A diary lets readers learn every fact about Ellis Island in one place.",
          "A diary lets readers compare Ellis Island with other ports in 1907.",
        ],
        why: [
          "A diary gives one person's day, so it cannot include every fact about the island.",
          "The diary does not mention other ports; paragraph 5 gives the facts about Ellis Island.",
        ],
        rat: "Anya writes in the first person about the staircase, the chalk mark and her mother's fear, which shows how one newcomer might have felt.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain how paragraphs 1 and 5 help readers tell which parts of this text are invented and which are real.",
        lookFor: [
          "Says paragraph 1 states the diary and Anya are invented",
          "Says paragraph 5 gives real facts, such as the dates and the number of people",
          "Explains why it matters to know the difference",
        ],
        rubric: [
          "Identifies the invented parts",
          "Identifies a real fact from paragraph 5",
          "Explains why readers should know the difference",
        ],
        frame:
          "Paragraph 1 says ___ is invented. Paragraph 5 gives real facts, such as ___. This matters because ___.",
        model:
          "Paragraph 1 says the diary and Anya are invented. Paragraph 5 gives real facts, such as that Ellis Island opened in 1892 and about twelve million people passed through it. This matters because readers should not mistake an invented story for a real record.",
      },
    ],
    transfer: {
      prompt:
        "Write two short diary-style lines about a day when you arrived somewhere new, such as a new school. Use first-person words and one sequence word.",
      lookFor: [
        "Uses I or my",
        "Uses a sequence word such as first, next or at last",
        "Names one feeling and one thing that happened",
      ],
      frame: "First, I ___. Then I felt ___ because ___.",
    },
    guide: {
      mini: "Write the five events on strips of paper and have students put them in order on the board. Then circle the date words that helped them decide.",
      discussion: [
        "What does the diary show that a list of facts about Ellis Island cannot show?",
        "Why do historians care whether a source is real or invented?",
        "What might a person who was sent back have written in a diary?",
      ],
      misconception:
        "Students may think an invented diary is a real source. Paragraphs 1 and 5 state clearly that Anya is invented and that the island is real.",
      answerNotes: [
        "Question 3: statue, ferry, doctors, inspector, Papa.",
        "Question 6: paragraph 1 names the invented parts; paragraph 5 gives the real dates and numbers.",
      ],
      model:
        "Paragraph 1 says the diary is invented. Paragraph 5 gives real facts, so readers can tell the story from the history.",
    },
    family: family(
      "Read the diary aloud together. Ask your student to retell the day using the words first, next and at last. You can talk in any language, then ask for one sentence in English.",
      "Lean el diario en voz alta juntos. Pida a su estudiante que cuente el día con las palabras primero, luego y al final. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What happened first, next and last in the diary?",
        "Which parts of the text are invented, and which are real?",
      ],
    ),
    connections: {
      write:
        "Write a short invented diary entry about arriving somewhere new, and say it is invented.",
      speak: "Retell the events of the diary aloud in order.",
      listen: "Listen to a person tell about moving to a new place and note the order of events.",
    },
  },
  {
    id: "freedmen-school-notice-1867",
    level: "B",
    title: "A Notice for a Free School, 1867 (an invented newspaper notice)",
    summary:
      "Read an invented newspaper notice from Reconstruction to see how communities built schools and what the notice shows about their goals.",
    genre: "Invented primary-source style newspaper notice",
    subject: "Social studies (United States history)",
    topics: ["Reconstruction", "education", "primary sources"],
    keyUse: "Inform",
    eldStandard: "ELD-SS",
    languageFunction: "Explain what a historical document shows about people's goals.",
    languageFeatures: ["reading a notice", "cause and effect", "supporting claims with details"],
    minutes: 15,
    content:
      "Explain what an invented notice shows about the value people placed on education during Reconstruction.",
    language: "Use because and for example to explain what a document shows.",
    essential: "What can a short notice tell us about what people wanted?",
    background: "Think about how a school in your community gets started. Who helps?",
    hook: "This notice is invented for this lesson. It is not a real document, but it imitates the schools that communities really built after the Civil War.",
    purpose:
      "Read to find out what the notice says and what it suggests about the people who wrote it.",
    vocab: [
      [
        "Reconstruction",
        "the years after the Civil War when the nation worked to rebuild",
        "Reconstruction lasted from 1865 to 1877.",
        "Reconstrucción",
      ],
      [
        "committee",
        "a small group chosen to do a job",
        "The committee planned the school.",
        "comité",
      ],
      [
        "amendment",
        "a change or addition to the Constitution",
        "The 13th Amendment ended slavery.",
        "enmienda",
      ],
      [
        "notice",
        "a short public message that tells people about something",
        "The notice told people when the school would open.",
        "aviso",
      ],
    ],
    paras: [
      {
        text: "Before the Civil War, many Southern states made it a crime to teach enslaved people to read. After the war ended in 1865, formerly enslaved people worked hard to start schools. The Freedmen's Bureau, a government agency, helped, and so did Black churches and neighbors. The notice below is invented for this lesson. It imitates the way a small-town newspaper might have announced a school.",
        q: "Is the notice real?",
      },
      {
        text: "NOTICE. A FREE SCHOOL will open on Monday, October 7, 1867, in the basement of Mount Hope Church in Spring Valley. Day classes are for children from five to fourteen years old. Night classes are for grown people who work in the fields and cannot come in daylight. Students will learn reading, writing and arithmetic. Bring a slate and pencil if you have them. If you have none, come anyway. There is no charge.",
        q: "Who is the school for?",
      },
      {
        text: "Teacher: Miss Ruth Allen. Committee: Mr. Samuel Brooks, Mrs. Hannah Freeman and Mr. Peter Lang. The committee asks neighbors for help. Families who can give a bench, a stove or firewood are asked to bring them. Those who can spare money may give it to Mr. Brooks, who will write each gift in a book that anyone may read.",
        q: "How does the committee ask for help?",
      },
      {
        text: "Notices like this one show how much people wanted education. This period is called Reconstruction, the years from 1865 to 1877 when the nation worked to rebuild after the war. The 13th Amendment ended slavery in 1865, and the 14th Amendment, in 1868, made all people born in the United States citizens. In 1877 Reconstruction ended. Soon many Southern states passed unfair laws that took away rights Black citizens had gained.",
        q: "What was Reconstruction?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to paragraph 2, who are the night classes for?",
        opts: [
          "grown people who work in the fields",
          "children from five to fourteen",
          "the teacher and the committee",
        ],
        why: [
          "Children are the students of the day classes, which meet in daylight.",
          "The teacher and the committee organize the school; they are not the night students.",
        ],
        rat: "Paragraph 2 says night classes are for grown people who work in the fields and cannot come in daylight.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, the notice lists a committee. What is a committee?",
        opts: [
          "a small group chosen to do a job",
          "a large crowd that meets in a church",
          "a person who teaches reading and writing",
        ],
        why: [
          "A large crowd is not described; the notice names three people for the committee.",
          "The teacher is named separately as Miss Ruth Allen; the committee is a different group.",
        ],
        rat: "Paragraph 3 names a teacher and then three people as the committee, who ask neighbors for help.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why does the notice say, “If you have none, come anyway”?",
        opts: [
          "It wanted everyone to be able to learn, even without supplies.",
          "It expected most of the students to forget to bring their pencils.",
          "It wanted every student to bring along a teacher from home.",
        ],
        why: [
          "The notice does not say students forget things; it speaks to people who do not own a slate or pencil.",
          "The notice names Miss Ruth Allen as the teacher, so students do not bring teachers.",
        ],
        rat: "The sentence follows Bring a slate and pencil if you have them and the notice says there is no charge, so the goal is to include everyone.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that shows the community helped to pay for the school.",
        evidence: ["p3"],
        rat: "Paragraph 3 asks for a bench, a stove, firewood and gifts of money that Mr. Brooks will record.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Role of a paragraph",
        type: "choice",
        prompt: "Why does the author put paragraphs 1 and 4 before and after the notice?",
        opts: [
          "They give background before the notice and meaning after it.",
          "They repeat the words of the notice so that readers remember them.",
          "They argue that the notice should have been shorter.",
        ],
        why: [
          "Paragraphs 1 and 4 add new information; they do not repeat the notice.",
          "No paragraph criticizes the notice; the author explains why it matters.",
        ],
        rat: "Paragraph 1 explains why schools were needed and says the notice is invented, and paragraph 4 explains what such notices show.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "What does the notice show about how much the community valued education? Use two details from the notice.",
        lookFor: [
          "Names one detail, such as night classes for working adults",
          "Names a second detail, such as families giving benches, firewood or money",
          "Explains what the details show about the goals of the community",
        ],
        rubric: [
          "Uses two accurate details from the notice",
          "Explains what each detail shows",
          "States a clear conclusion about the community's goals",
        ],
        frame:
          "The notice shows that the community valued education because ___. For example, ___ and ___.",
        model:
          "The notice shows that the community valued education because people worked to make the school open to everyone. For example, there are night classes for adults who work in the fields, and families are asked to give benches, firewood and money.",
      },
    ],
    transfer: {
      prompt:
        "Write a short notice, in three or four sentences, that announces a new club or library at your school. Include when and where, who is welcome and how neighbors can help.",
      lookFor: ["States when and where", "States who is welcome", "Says how people can help"],
      frame: "A new ___ will open on ___ at ___. All ___ are welcome. If you can help, please ___.",
    },
    guide: {
      mini: "Circle the four details in the notice on the board: who, when, where and what to bring. Ask students which detail tells the most about the community's goals.",
      discussion: [
        "Why might a school need to say that there is no charge?",
        "What does a notice show that a history book summary might leave out?",
        "Why is it important that paragraph 1 says the notice is invented?",
      ],
      misconception:
        "Students may think the notice is a real historical document. The title and paragraph 1 say it is invented, although schools like it were real.",
      answerNotes: [
        "Question 1: night classes are for grown people who work in the fields.",
        "Question 4: paragraph 3 lists benches, a stove, firewood and money.",
      ],
      model:
        "The notice shows the community valued education. There are night classes for working adults, and neighbors give benches, firewood and money.",
    },
    family: family(
      "Read the notice together. Ask your student to tell you who the school is for and how neighbors could help. You can talk in any language, then ask for one sentence in English.",
      "Lean el aviso juntos. Pida a su estudiante que le diga para quién es la escuela y cómo podían ayudar los vecinos. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "Who could come to the day classes, and who could come to the night classes?",
        "What does the notice show about what the community wanted?",
      ],
    ),
    connections: {
      write:
        "Write a short invented notice that announces a school event, and say that it is invented.",
      speak: "Explain aloud what the notice shows about the community.",
      listen: "Listen to a community announcement and note who, when and where.",
    },
  },
  {
    id: "athens-and-rome-governing",
    level: "C",
    title: "Two Ways to Share Power: Athens and Rome",
    summary:
      "Compare how Athens and Rome governed themselves, who was included and what the United States borrowed from each.",
    genre: "Compare-and-contrast text with a table",
    subject: "Social studies (ancient Greece and Rome)",
    topics: ["ancient Greece", "ancient Rome", "democracy and republic"],
    keyUse: "Explain",
    eldStandard: "ELD-SS",
    languageFunction: "Compare two systems and explain similarities, differences and limits.",
    languageFeatures: ["compare and contrast", "reading a table", "concession words"],
    minutes: 18,
    content:
      "Compare direct democracy in Athens with the republic in Rome and explain who was left out.",
    language: "Use both, while, unlike and however to compare two systems.",
    essential: "Who gets to share power, and who decides?",
    background:
      "Think about how your class makes a decision. Does everyone vote, or do some people speak for others?",
    hook: "About 2,500 years ago, two cities tried new ways of sharing power, and their ideas still shape governments today.",
    purpose:
      "Read to compare how decisions were made in Athens and Rome and to find who was left out.",
    table: {
      headers: ["Question", "Athens", "Rome (the Republic)"],
      rows: [
        [
          "How were decisions made?",
          "Citizens voted directly on laws in an assembly.",
          "Citizens elected officials who led the government.",
        ],
        [
          "Who led?",
          "Many officials were chosen by lottery.",
          "Two consuls were elected each year.",
        ],
        [
          "Who could take part?",
          "Adult male citizens.",
          "Adult male citizens, but wealthy men had more influence in voting.",
        ],
        [
          "Who was left out?",
          "Women, enslaved people and foreigners.",
          "Women, enslaved people and many people in conquered lands.",
        ],
      ],
      description:
        "A table that compares Athens and the Roman Republic in four rows: how decisions were made, who led, who could take part and who was left out.",
    },
    vocab: [
      [
        "democracy",
        "a government in which the people hold the power",
        "Athens developed a democracy.",
        "democracia",
      ],
      [
        "republic",
        "a government in which citizens elect leaders to rule for them",
        "Rome was a republic.",
        "república",
      ],
      [
        "representative",
        "a person who is chosen to speak and act for others",
        "A representative votes for the people who elected her.",
        "representante",
      ],
      [
        "citizen",
        "a person who belongs to a country or city and has its rights",
        "Only some people in Athens were citizens.",
        "ciudadano",
      ],
    ],
    paras: [
      {
        text: "About 2,500 years ago, two cities in the Mediterranean world tried new ways of sharing power. Athens, in Greece, developed a democracy, a word from Greek that means rule by the people. Rome, in Italy, created a republic, in which citizens chose leaders to govern for them. Both ideas still shape governments today, including the government of the United States.",
        q: "What two systems does the text compare?",
      },
      {
        text: "In Athens, citizens made major decisions together. They gathered in an assembly, where any citizen could speak and vote on laws and on war. This is called direct democracy, because people vote on issues themselves instead of through representatives. Many officials were chosen by lottery, so ordinary citizens had a good chance to hold office.",
        q: "How did Athens make decisions?",
      },
      {
        text: "Rome worked differently. After driving out its kings, Rome elected two consuls each year to lead the government, so that no one person could rule for long. A Senate of experienced leaders advised them. Citizens voted for officials in assemblies, but wealthy citizens had more influence in the voting. This was a representative system, since elected leaders acted for the people.",
        q: "How did Rome make decisions?",
      },
      {
        text: "Both systems left out many people. In Athens, only adult male citizens could take part. Women, enslaved people and foreigners could not vote. Rome also excluded women and enslaved people, and many people in conquered lands did not hold citizenship. For this reason, historians note that the word democracy meant something different then than it does today.",
        q: "Who was left out?",
      },
      {
        text: "The United States borrowed from both. Like Rome, it elects representatives and divides power among branches of government instead of holding a vote on every issue. Like Athens, it holds that political power comes from the citizens. Studying these cities shows that ideas about fairness change slowly, and that each generation decides again who is included.",
        q: "What did the United States borrow?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 2, how did Athenian citizens make major decisions?",
        opts: [
          "They gathered in an assembly and voted on laws themselves.",
          "They chose two leaders to decide for them each year.",
          "They asked a Senate of experienced leaders to vote.",
        ],
        why: [
          "Two leaders chosen each year describes the consuls of Rome, not the assembly of Athens.",
          "A Senate that advised the leaders belongs to Rome, as paragraph 3 explains.",
        ],
        rat: "Paragraph 2 says citizens gathered in an assembly where any citizen could speak and vote on laws and on war.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 3, Rome was a representative system. What does representative mean here?",
        opts: [
          "elected leaders act on behalf of the people",
          "every citizen votes on every decision directly",
          "one ruler makes all the decisions alone",
        ],
        why: [
          "Direct voting by everyone describes the Athenian assembly, which paragraph 2 contrasts with representatives.",
          "The paragraph says the consuls shared power and that no one person could rule for long.",
        ],
        rat: "Paragraph 3 explains that elected leaders acted for the people, which is the meaning of a representative system.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Read a table",
        type: "choice",
        prompt: "Use the table. Which feature belonged to Rome but not to Athens?",
        opts: [
          "Two consuls were elected each year.",
          "Many officials were chosen by lottery.",
          "Women were left out of voting.",
        ],
        why: [
          "The table shows lottery selection in the Athens column, not in the Rome column.",
          "The table lists women as left out in both columns, so this was true of Athens too.",
        ],
        rat: "In the table, the consuls appear only in the Rome column, in the row Who led?",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sort ideas by category",
        type: "sort",
        prompt: "Sort each feature into Athens, Rome or Both.",
        cats: ["Athens", "Rome", "Both"],
        sortItems: [
          ["Citizens voted directly on laws", 0],
          ["Many officials were chosen by lottery", 0],
          ["Two consuls led each year", 1],
          ["A Senate advised the leaders", 1],
          ["Women could not vote", 2],
          ["Enslaved people were left out", 2],
        ],
        rat: "The table and paragraphs 2 to 4 show direct voting and lotteries in Athens, consuls and a Senate in Rome, and the exclusion of women and enslaved people in both.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Role of a paragraph",
        type: "choice",
        prompt: "What is the main job of paragraph 4?",
        opts: [
          "It shows a limit that both systems shared.",
          "It explains how the two systems began.",
          "It argues that Rome was better than Athens.",
        ],
        why: [
          "Paragraph 1 introduces the systems; paragraph 4 describes who was left out.",
          "Paragraph 4 does not rank the two cities; it starts with Both systems left out many people.",
        ],
        rat: "Paragraph 4 begins with Both systems left out many people and then names who was excluded in each city.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement does paragraph 5 best support?",
        opts: [
          "The United States uses ideas from both Athens and Rome.",
          "The United States copied Roman government exactly.",
          "The United States rejected the ideas of ancient Greece.",
        ],
        why: [
          "The paragraph says the country borrowed, which is not the same as copying exactly, and it also mentions Athens.",
          "The paragraph says the United States holds that power comes from the citizens, an idea tied to Athens.",
        ],
        rat: "Paragraph 5 says the United States elects representatives like Rome and holds that power comes from citizens like Athens.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Compare with evidence",
        type: "short",
        prompt:
          "Compare how decisions were made in Athens and in Rome. Use one similarity and one difference from the text or table.",
        lookFor: [
          "States a difference, such as direct voting in Athens and elected officials in Rome",
          "States a similarity, such as leaving out women and enslaved people",
          "Uses a comparison word such as both, while or unlike",
        ],
        rubric: [
          "Gives one accurate difference",
          "Gives one accurate similarity",
          "Uses comparison language",
        ],
        frame: "Unlike ___, ___. However, both ___.",
        model:
          "In Athens, citizens voted directly on laws in an assembly, while in Rome citizens elected officials such as consuls to lead for them. However, both cities left out women and enslaved people, so only some people shared power.",
      },
    ],
    transfer: {
      prompt:
        "Your class must choose a field-trip location. Compare deciding by a class vote with deciding through three elected representatives. Give one benefit and one drawback of each.",
      lookFor: [
        "Describes a direct class vote and a vote through representatives",
        "Gives a benefit of each",
        "Gives a drawback of each",
      ],
      frame:
        "A class vote is good because ___, but ___. Representatives are good because ___, but ___.",
    },
    guide: {
      mini: "Draw two columns and label them Athens and Rome. Fill in the first two rows of the table together and have students add one more row from the text.",
      discussion: [
        "Why might direct voting work better in a small city than in a very large country?",
        "Why do historians say the word democracy meant something different in Athens?",
        "Who is included in your community's decisions today, and who might still be missing?",
      ],
      misconception:
        "Students may think Athens was a democracy like ours. The text shows that most people could not vote, and that Rome and Athens chose leaders differently.",
      answerNotes: [
        "Question 3: consuls are listed in the Rome column only.",
        "Question 4: lotteries and direct voting are Athens, consuls and a Senate are Rome, and the exclusion of women and enslaved people is Both.",
      ],
      model:
        "In Athens, citizens voted directly, while in Rome they elected officials. However, both cities left out women and enslaved people.",
    },
    family: family(
      "Look at the table together. Ask your student to explain one way Athens and Rome were different and one way they were the same. You can talk in any language, then ask for one sentence in English.",
      "Miren la tabla juntos. Pida a su estudiante que explique una diferencia y una semejanza entre Atenas y Roma. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What is the difference between direct democracy and a republic?",
        "Who was left out of voting in both cities?",
      ],
    ),
    connections: {
      write: "Write a paragraph that compares two ways to make group decisions.",
      speak: "Explain aloud one similarity and one difference between Athens and Rome.",
      listen:
        "Listen to a talk about a vote and note whether it was direct or through representatives.",
    },
  },
  {
    id: "two-letters-1775",
    level: "C",
    title: "Two Cousins, Two Choices, 1775 (two invented letters)",
    summary:
      "Compare two invented letters from 1775, one from a Loyalist and one from a Patriot, and judge each writer's claim, evidence and response.",
    genre: "Paired invented letters, argument",
    subject: "Social studies (American Revolution)",
    topics: ["American Revolution", "Patriots and Loyalists", "argument and evidence"],
    keyUse: "Argue",
    eldStandard: "ELD-SS",
    languageFunction:
      "Identify claims, evidence and responses to the other side in two points of view.",
    languageFeatures: ["claim and evidence", "counterclaims", "point of view"],
    minutes: 20,
    content:
      "Identify and compare two arguments from different points of view about the American Revolution.",
    language: "Use claim, evidence, although and however to compare two arguments.",
    essential: "Why do people living through the same events disagree about what to do?",
    background:
      "Think about a time when two people you know disagreed about a big decision. What did each one fear?",
    hook: "Both letters are invented for this lesson. They are not real documents, but their arguments come from real debates in 1775.",
    purpose:
      "Read to find each writer's claim and evidence and to decide how each answers the other.",
    vocab: [
      [
        "Patriot",
        "a colonist who wanted to resist British rule",
        "A Patriot argued for liberty.",
        "patriota",
      ],
      [
        "Loyalist",
        "a colonist who stayed loyal to the British king",
        "A Loyalist feared war.",
        "leal a la Corona",
      ],
      [
        "petition",
        "a formal request signed and sent to leaders",
        "The colonists sent a petition to the king.",
        "petición",
      ],
      [
        "representation",
        "having someone speak and vote for you in a government",
        "The colonists wanted representation in Parliament.",
        "representación",
      ],
    ],
    paras: [
      {
        text: "In 1775, colonists in North America disagreed about how to answer Britain's laws and taxes. Some, called Patriots, wanted to resist. Others, called Loyalists, wanted to stay loyal to the king. The two letters below are invented for this lesson, but their arguments come from real debates of the time. They were written by two made-up cousins, Caleb and Ruth Dalton.",
        q: "Are the letters real?",
      },
      {
        text: "Boston, June 1775. Dear Ruth, I cannot join you. Britain defended our towns and ports for many years, and that defense was expensive. It is fair that colonists help to pay for it. I also fear that war will bring ruin. Our trade would stop, our homes might burn and we would face the strongest navy in the world. We should send petitions and wait for the king to listen. Your cousin, Caleb.",
        q: "What is Caleb's claim and evidence?",
      },
      {
        text: "Cambridge, June 1775. Dear Caleb, I understand your fear, but I cannot agree. The question is not whether we pay taxes. It is who decides. Parliament taxes us, yet no one in it speaks for us. We have sent petitions for years, and our complaints have not been answered. You say war will cost us everything, but obeying without a voice may cost us our liberty. In April, blood was already spilled at Lexington and Concord. Your cousin, Ruth.",
        q: "What is Ruth's claim, and how does she answer Caleb?",
      },
      {
        text: "Notice how each writer uses a claim, evidence and an answer to the other side. Caleb's claim is that loyalty and patience are wiser. His evidence is the cost of past defense and the danger of war. Ruth's claim is that the real issue is representation. She answers Caleb's fear by saying that liberty is worth the risk. Neither writer was foolish, and each spoke from hopes and fears that were real. After the war, many Loyalists left the new nation, and families like the Daltons were divided.",
        q: "What does the author say about the two writers?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt:
          "According to Caleb's letter, why is it fair for colonists to help pay for Britain's costs?",
        opts: [
          "Britain defended the colonies for many years at great cost.",
          "Parliament has promised the colonists a vote in the future.",
          "The king has answered every petition that colonists sent.",
        ],
        why: [
          "Caleb never mentions a promise of a vote; Ruth is the one who raises the lack of representation.",
          "Ruth says the petitions were not answered, and Caleb only suggests waiting for the king to listen.",
        ],
        rat: "Paragraph 2 says Britain defended the towns and ports for many years and that the defense was expensive, so colonists should help pay.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, Caleb says colonists should send petitions. What is a petition?",
        opts: [
          "a formal request that is sent to leaders",
          "a tax that is collected by a ruler",
          "a law that is passed by the colonists",
        ],
        why: [
          "A tax is the reason for the quarrel, but a petition is something colonists send to ask for change.",
          "Colonists send petitions to the king; they do not pass them as laws.",
        ],
        rat: "Caleb says to send petitions and wait for the king to listen, so a petition is a request sent to a leader.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sort ideas by speaker",
        type: "sort",
        prompt: "Sort each point under the writer who makes it.",
        cats: ["Caleb (Loyalist)", "Ruth (Patriot)"],
        sortItems: [
          ["Britain paid to defend the colonies", 0],
          ["War would stop trade and burn homes", 0],
          ["The colonists should wait for the king to listen", 0],
          ["No one in Parliament speaks for the colonists", 1],
          ["Petitions have not been answered", 1],
          ["Obeying without a voice may cost liberty", 1],
        ],
        rat: "Paragraph 2 gives Caleb's points about cost, risk and patience, and paragraph 3 gives Ruth's points about representation and liberty.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement can the reader infer about the two cousins?",
        opts: [
          "They disagree about what to do, but each writes honestly about a fear.",
          "They agree about the problem, but they choose different words.",
          "They have stopped writing to each other after their quarrel.",
        ],
        why: [
          "They disagree about the problem itself, since Caleb accepts the taxes and Ruth questions who decides.",
          "Ruth answers Caleb's letter in a friendly tone, so nothing shows that they stopped writing.",
        ],
        rat: "Paragraph 4 says each writer spoke from real hopes and fears, and Ruth begins her answer with I understand your fear.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's choice",
        type: "choice",
        prompt: "Why does the author write two letters instead of one?",
        opts: [
          "Two voices let readers compare both sides of a real debate.",
          "Two letters make the story of the war longer and more exciting.",
          "Two letters prove that the Patriots were correct all along.",
        ],
        why: [
          "The letters are about a disagreement, and paragraph 4 says neither writer was foolish.",
          "Paragraph 4 gives each writer respectful treatment, so the author does not say one side was correct all along.",
        ],
        rat: "Paragraph 4 explains that each writer uses a claim, evidence and an answer, so the two letters let readers compare both sides.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph in which a writer directly answers the other writer's fear.",
        evidence: ["p3"],
        rat: "In paragraph 3, Ruth says that war may cost a lot but that obeying without a voice may cost liberty.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Argue with evidence",
        type: "short",
        prompt:
          "Which writer gives the stronger reason? Use one piece of evidence from that writer and one point from the other writer.",
        lookFor: [
          "States clearly which writer is stronger",
          "Uses accurate evidence from that writer's letter",
          "Mentions a point from the other writer and responds to it",
        ],
        rubric: [
          "States a clear choice",
          "Supports it with evidence from the letters",
          "Responds to the other writer's point",
        ],
        frame:
          "I think ___ gives the stronger reason because ___. Although ___ says ___, I think ___.",
        model:
          "I think Ruth gives the stronger reason because she says that no one in Parliament speaks for the colonists, so the problem is who decides. Although Caleb says Britain paid to defend the colonies, I think paying does not give a government the right to decide without a vote.",
      },
    ],
    transfer: {
      prompt:
        "Two students disagree about whether the school should add a longer lunch. Write two short sentences, one for each side, that each include a claim and one reason.",
      lookFor: [
        "States a claim for each side",
        "Gives a reason for each side",
        "Keeps each point fair and respectful",
      ],
      frame: "One student believes ___ because ___. The other believes ___ because ___.",
    },
    guide: {
      mini: "Make a two-column chart with Caleb and Ruth. Fill in claim, evidence and response with phrases from the letters, then discuss which row is the most persuasive.",
      discussion: [
        "Which piece of evidence do you find most convincing, and why?",
        "Why do you think the author wrote that neither writer was foolish?",
        "How can a family stay close when its members disagree about a big decision?",
      ],
      misconception:
        "Students may think one side was always right because of what happened later. The text shows each writer reasoning from real hopes and fears in 1775.",
      answerNotes: [
        "Question 3: Caleb's points are the first three, and Ruth's are the last three.",
        "Question 6: paragraph 3 shows Ruth responding directly to Caleb's fear of war.",
      ],
      model:
        "I think Ruth is stronger because she names the question of who decides. Although Caleb says Britain paid for defense, paying does not give the right to decide without a vote.",
    },
    family: family(
      "Read both letters aloud with your student. Ask them which cousin they find more convincing and why. You can talk in any language, then ask for one sentence in English.",
      "Lean las dos cartas en voz alta con su estudiante. Pregúntele qué primo le parece más convincente y por qué. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What is Caleb's claim, and what is Ruth's claim?",
        "How does Ruth answer Caleb's fear of war?",
      ],
    ),
    connections: {
      write:
        "Write two short invented letters that give two sides of a school decision, and say they are invented.",
      speak: "Tell a partner which cousin is more convincing and why.",
      listen: "Listen to two speakers who disagree and find each claim and reason.",
    },
  },
];

// Grades 6-8 publisher pass, Reading Room lessons, batch 2b: narrative, poetry, argument, primary-source style, science.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "after-the-rain-poem",
    level: "A",
    title: "After the Rain (a poem)",
    summary: "A short original poem about a street, a puddle, and a gray day that is also bright.",
    genre: "Poetry",
    subject: "English language arts",
    topics: ["figurative language", "mood", "poetry structure"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Explain how comparisons and images create a mood in a poem.",
    languageFeatures: ["figurative language", "descriptive words", "stanzas"],
    minutes: 12,
    content: "Explain how a metaphor and sensory images create meaning in a poem.",
    language: "Use the words because and shows to explain what a comparison means.",
    essential: "How can a poem help us see an ordinary place in a new way?",
    background: "Think about how a street looks and sounds after a rainstorm.",
    hook: "The poet says the wet street is a mirror. What does that make you picture?",
    purpose: "Read to find out what the poet sees, hears and feels after the rain.",
    vocab: [
      ["stanza", "a group of lines in a poem", "This poem has four stanzas.", "estrofa"],
      [
        "reflect",
        "to show an image of something, like a mirror",
        "A wet street can reflect the sky.",
        "reflejar",
      ],
      ["thinning", "becoming less thick", "The clouds are thinning.", "adelgazando"],
    ],
    paras: [
      {
        text: "The rain has stopped. The street is a mirror, holding the gray sky in its hands. A bus rolls by and breaks the picture into a hundred shining pieces.",
        q: "What does the speaker see on the street?",
      },
      {
        text: "Down the block, a boy in yellow boots walks straight into the deepest puddle. Splash! He laughs, and the sound jumps up and bounces off the walls.",
        q: "What does the boy do, and what do we hear?",
      },
      {
        text: "The clouds are thinning now, like old paper. A thin blue stripe appears. The mirror in the street slowly empties, and the whole world begins to dry.",
        q: "What changes in the sky and on the street?",
      },
      {
        text: "I stand at the window and watch it all, warm and quiet, my cheek on the glass, glad that a day can be gray and bright both at the same time.",
        q: "How does the speaker feel?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What does the boy in yellow boots do in stanza 2?",
        opts: [
          "He walks into the deepest puddle.",
          "He jumps over every puddle.",
          "He watches the rain from a window.",
        ],
        why: [
          "The boy walks straight into the puddle instead of jumping over it.",
          "The speaker is the one watching from a window, not the boy.",
        ],
        rat: "Stanza 2 says the boy walks straight into the deepest puddle.",
      },
      {
        kind: "craft",
        phase: "first",
        skill: "Understand a metaphor",
        type: "choice",
        prompt:
          "In stanza 1, the poet says the street is a mirror. Why does the poet make this comparison?",
        opts: [
          "The wet street shows the sky like a mirror does.",
          "The street is made of glass and metal.",
          "The mirror in the poem belongs to the bus.",
        ],
        why: [
          "The street is wet from rain; nothing in the poem says it is made of glass.",
          "The bus only breaks the reflection; it does not own a mirror.",
        ],
        rat: "A wet street can reflect the gray sky, so the poet compares it to a mirror.",
      },
      {
        kind: "vocab",
        phase: "second",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In stanza 3, the clouds are “thinning.” What does thinning mean?",
        opts: ["becoming less thick", "becoming louder over time", "becoming darker over time"],
        why: [
          "Clouds do not make sounds that get louder in this poem; the boy's splash is the sound.",
          "The next lines say a blue stripe appears, so the clouds are not getting darker.",
        ],
        rat: "The thin blue stripe shows the clouds are opening up, so they are becoming less thick.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Structure of a poem",
        type: "choice",
        prompt: "How does the poem move from stanza 1 to stanza 4?",
        opts: [
          "From the end of the rain to the speaker watching at the window",
          "From a sunny morning to a stormy night over the whole town",
          "From the speaker's home to a faraway city across the sea",
        ],
        why: [
          "The poem begins after the rain stops, so it does not start with a sunny morning.",
          "The poem stays on one street and the speaker's window; no faraway city appears.",
        ],
        rat: "The poem begins just after the rain, shows the boy and the clearing sky, and ends with the speaker at the window.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "How does the speaker feel at the end of the poem?",
        opts: ["calm and glad", "angry and tired", "afraid and alone"],
        why: [
          "Words like warm and glad show the speaker is not angry.",
          "The speaker is warm and safe at the window, so there is no fear in the poem.",
        ],
        rat: "The speaker is warm and quiet and says she is glad, so she feels calm and happy.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a line of poetry",
        type: "short",
        prompt:
          "Explain what the poet means by “a day can be gray and bright both at the same time.” Use one detail from the poem.",
        lookFor: [
          "Says the day has gray sky and also bright, happy things",
          "Uses a detail such as the thin blue stripe, the boy's laugh or the shining pieces",
          "Connects the detail to the idea",
        ],
        rubric: [
          "Explains both parts of the line",
          "Uses a detail from the poem",
          "Writes in complete sentences",
        ],
        frame: "The poet means that ___ and ___. For example, ___.",
        model:
          "The poet means that the day has gray clouds but also bright moments. For example, the boy laughs in the puddle and a blue stripe appears in the sky.",
      },
    ],
    transfer: {
      prompt:
        "Write one comparison like “the street is a mirror” to describe something you see after a storm, and explain what it shows.",
      lookFor: [
        "Writes a comparison that says one thing is another thing",
        "Names what the two things have in common",
        "Uses a sense detail",
      ],
      frame: "The ___ is a ___ because ___.",
    },
    guide: {
      mini: "Read the poem aloud twice. Ask students to draw the picture that the first stanza paints, then compare drawings and talk about the word mirror.",
      discussion: [
        "What does the sound in stanza 2 look like?",
        "How does the mood change from stanza 1 to stanza 4?",
        "What other things could the poet compare to the street?",
      ],
      misconception: "Students may take a metaphor literally; ask what the two things share.",
      answerNotes: [
        "Question 2: the metaphor works because the wet street reflects the sky.",
        "Question 5: look for the words warm, quiet and glad.",
      ],
      model:
        "The poet means that the day has gray clouds but also bright moments, like the boy's laugh and the blue stripe in the sky.",
    },
    family: family(
      "Read the poem aloud together, one stanza at a time. Ask your student what picture each stanza paints. You can talk in any language, then ask for one sentence in English.",
      "Lean el poema en voz alta juntos, una estrofa a la vez. Pregunte a su estudiante qué imagen pinta cada estrofa. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "Which line made the best picture in your mind?",
        "What does the poet compare the street to?",
      ],
    ),
    connections: {
      write: "Write your own short comparison poem about weather.",
      speak: "Read a stanza aloud and describe the picture.",
      listen: "Listen to a poem and name the mood.",
    },
  },
  {
    id: "paper-bridge-contest",
    level: "B",
    title: "The Paper Bridge Contest",
    summary: "A science team learns that a failed first design can lead to a stronger second one.",
    genre: "Realistic fiction",
    subject: "English language arts and science",
    topics: ["engineering", "teamwork", "turning point"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Explain how a turning point changes a character.",
    languageFeatures: ["narrative sequence", "character feelings", "dialogue"],
    minutes: 15,
    content: "Identify the turning point of a story and explain how a character changes.",
    language: "Use feeling words and time words to retell events in order.",
    essential: "How can a failure help us improve an idea?",
    background: "Think about a time you tried something and had to change your plan.",
    hook: "The first bridge sagged at 20 pennies. Could a different shape hold more?",
    purpose: "Read to find out what changes Dani's mind and how the bridge improves.",
    vocab: [
      [
        "span",
        "to reach across a space",
        "The bridge had to span 20 centimeters.",
        "cubrir una distancia",
      ],
      ["collapse", "to fall down suddenly", "The flat bridge began to collapse.", "derrumbarse"],
      ["sketch", "a quick drawing", "Ravi made a sketch of his idea.", "boceto"],
      [
        "realize",
        "to understand something suddenly",
        "Dani realized that testing helps.",
        "darse cuenta",
      ],
    ],
    paras: [
      {
        text: "On Friday, Dani's science team had to build a bridge from paper and tape. The rules were simple: the bridge had to span a gap of 20 centimeters and hold as many pennies as possible. Dani's idea was a flat strip of paper, and her teammates agreed to try it.",
        q: "What is the challenge?",
      },
      {
        text: "When the team stacked pennies on the flat bridge, it sagged at 20 pennies and collapsed at 60. Dani felt her face grow hot. “Maybe I should have listened to Ravi,” she thought, remembering that he had wanted to fold the paper.",
        q: "What goes wrong, and how does Dani feel?",
      },
      {
        text: "Ravi shared his idea again, this time with a sketch. He folded a strip into a zigzag of triangles, like the roof of a barn. “Triangles spread out the weight,” he said. Dani smiled and cut new strips. Together, they folded, taped, and tested again.",
        q: "What changes the team's plan?",
      },
      {
        text: "This time the bridge held 140 pennies before it bent. The class cheered. Dani realized that her first idea had not been a waste, because testing it showed the team what to fix. She wrote in her notebook: “Testing shows us what to improve.”",
        q: "What does Dani learn?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many pennies did the first bridge hold before it collapsed?",
        opts: ["60 pennies", "20 pennies", "140 pennies"],
        why: [
          "Twenty pennies is when the bridge began to sag, not when it collapsed.",
          "One hundred forty pennies is how many the second bridge held.",
        ],
        rat: "Paragraph 2 says the flat bridge collapsed at 60 pennies.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 1, the bridge must “span a gap of 20 centimeters.” What does span mean?",
        opts: ["reach across", "fall into", "stand beside"],
        why: [
          "A bridge that falls into the gap would not work as a bridge.",
          "A bridge that stands beside a gap would not connect the two sides.",
        ],
        rat: "A bridge has to reach across the space between two sides.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt:
          "The author writes that “Dani felt her face grow hot.” Why does the author use this detail?",
        opts: [
          "To show that Dani felt embarrassed without saying the word",
          "To show that the room was too warm for the team to test",
          "To show that Dani was angry at the pennies for falling",
        ],
        why: [
          "Nothing in the story describes the room's temperature; the detail is about Dani's feelings.",
          "Dani's thought about Ravi shows she is embarrassed with herself, not angry at the pennies.",
        ],
        rat: "A face growing hot is a common sign of embarrassment, and the next sentence shows Dani doubting her choice.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Turning point",
        type: "choice",
        prompt: "Which event is the turning point of the story?",
        opts: [
          "Ravi shares his sketch of triangles.",
          "The class cheers for the bridge.",
          "Dani writes in her notebook.",
        ],
        why: [
          "The cheers happen after the bridge succeeds, so they are part of the ending.",
          "The notebook entry is Dani's final thought after the problem is solved.",
        ],
        rat: "Paragraph 3 is where the plan changes, because the team decides to use Ravi's triangle design.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use numbers from the text",
        type: "choice",
        prompt:
          "How many more pennies did the second bridge hold than the first bridge held before it collapsed?",
        opts: ["80 pennies", "120 pennies", "140 pennies"],
        why: [
          "One hundred twenty is 140 minus 20, but the first bridge held 60 before it collapsed.",
          "One hundred forty is the total the second bridge held, not how many more.",
        ],
        rat: "140 − 60 = 80, so the second bridge held 80 more pennies.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What can the reader infer about Dani at the end of the story?",
        opts: [
          "She learned to value testing and other people's ideas.",
          "She decided never to build another bridge with her team.",
          "She believed her first idea was perfect from the start.",
        ],
        why: [
          "Dani writes about improving, so she is not quitting.",
          "The first bridge collapsed, so Dani no longer thinks her first idea was perfect.",
        ],
        rat: "Dani realizes the failed test helped, and Ravi's change made the bridge stronger.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a lesson",
        type: "short",
        prompt: "What lesson does Dani learn? Use one detail from the story to explain it.",
        lookFor: [
          "States a lesson such as testing and revising helps",
          "Uses a detail such as the collapse at 60 pennies or the 140 pennies",
          "Connects the detail to the lesson",
        ],
        rubric: [
          "Names a clear lesson",
          "Uses a story detail",
          "Explains how the detail shows the lesson",
        ],
        frame: "Dani learns that ___. For example, ___. This shows ___.",
        model:
          "Dani learns that testing shows what to improve. For example, the first bridge collapsed at 60 pennies, but after the team changed the design it held 140. This shows that a failed test can lead to a better idea.",
      },
    ],
    transfer: {
      prompt:
        "Think about a time something you made or tried did not work at first. Write what you learned and how you changed your plan.",
      lookFor: [
        "Describes what did not work",
        "Describes a change in the plan",
        "States what was learned",
      ],
      frame: "At first ___. Then I changed ___. I learned that ___.",
    },
    guide: {
      mini: "Draw a plot mountain on the board and place the bridge story on it: problem, failure, turning point, success. Ask where the turning point sits and what changes.",
      discussion: [
        "What clue shows how Dani feels after the first test?",
        "Why do triangles help a bridge?",
        "How is the second bridge different from the first?",
      ],
      misconception:
        "Students may name the end as the turning point; the turning point is where the plan changes, not where the story ends.",
      answerNotes: [
        "Question 5: 140 − 60 = 80.",
        "Question 4: the turning point is when the team decides to use triangles.",
      ],
      model:
        "Dani learns that testing shows what to improve. The first bridge collapsed at 60 pennies, but the triangle design held 140.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student how Dani's feelings change from the beginning to the end. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pregunte a su estudiante cómo cambian los sentimientos de Dani del principio al final. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What is the turning point in the story?", "What did the team change, and why?"],
    ),
    connections: {
      write: "Write a narrative about a time a plan changed.",
      speak: "Retell the story with first, then and finally.",
      listen: "Listen to a talk about the engineering design process.",
    },
  },
  {
    id: "school-garden-letter",
    level: "B",
    title: "A Letter to the Principal: Plant a School Garden",
    summary:
      "Read a student's argument, find the claim and evidence, and decide how well the writer answers a worry.",
    genre: "Argument (letter)",
    subject: "English language arts and science",
    topics: ["claim and evidence", "counterclaim", "persuasive writing"],
    keyUse: "Argue",
    eldStandard: "ELD-LA",
    languageFunction: "Identify a claim, evidence and a response to a counterclaim.",
    languageFeatures: ["claim and reasons", "however and although", "persuasive language"],
    minutes: 15,
    content: "Identify the claim, supporting evidence and counterclaim in a persuasive letter.",
    language: "Use however and although to connect an opposing view to a response.",
    essential: "What makes an argument convincing?",
    background: "Think about a change you would like to make at your school.",
    hook: "Which would you rather have beside the gym: grass nobody uses or a garden?",
    purpose:
      "Read to find the writer's claim, the evidence for it, and how the writer answers a worry.",
    vocab: [
      ["propose", "to suggest a plan", "I propose that we build a garden.", "proponer"],
      ["inexpensive", "not costing much money", "Seeds are inexpensive.", "barato"],
      [
        "evidence",
        "facts or details that support an idea",
        "The student gave evidence for the claim.",
        "evidencia",
      ],
      [
        "responsibility",
        "a duty to take care of something",
        "A garden teaches responsibility.",
        "responsabilidad",
      ],
    ],
    paras: [
      {
        text: "Dear Principal Alvarez, our school has an unused patch of grass beside the gym. I propose that we turn it into a vegetable garden. A garden would give students a hands-on place to learn science and help our community.",
        q: "What does the writer propose?",
      },
      {
        text: "First, a garden connects to what we study. Students could measure plant growth, graph the results, and calculate area when they plan the beds. Last year, a nearby school reported that its garden club grew enough lettuce to give 40 bags of salad to a food pantry.",
        q: "What evidence does the writer give?",
      },
      {
        text: "Some people worry that a garden will cost too much and take time from class. However, seeds and soil are inexpensive, and a grant from a local store could pay for tools. Club members could care for the plants during lunch and after school, so no class time would be lost.",
        q: "How does the writer answer the worry?",
      },
      {
        text: "A school garden is more than a patch of plants. It teaches responsibility, brings students together, and shares food with people who need it. For these reasons, I hope you will agree that our school should plant a garden this spring. Sincerely, Imani Brooks",
        q: "How does the writer close?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the claim",
        type: "choice",
        prompt: "What does the writer propose in paragraph 1?",
        opts: [
          "Turn an unused patch of grass into a vegetable garden.",
          "Build a new gym next to the unused patch of grass.",
          "Cancel the science lessons about plants and growth.",
        ],
        why: [
          "The grass is beside the gym, but the writer does not ask for a new gym.",
          "The writer wants the garden to support science lessons, not replace them.",
        ],
        rat: "Paragraph 1 says the writer proposes turning the unused patch into a vegetable garden.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 3, seeds and soil are called inexpensive. What does inexpensive mean?",
        opts: ["not costing much", "very hard to find", "good for the soil"],
        why: [
          "The writer says a grant could pay for tools, so the goal is lowering cost, not finding supplies.",
          "The word is about money, not about the quality of the soil.",
        ],
        rat: "The writer is answering the worry that a garden costs too much, so inexpensive means it does not cost much.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select supporting details",
        type: "multi",
        prompt:
          "Which details support the writer's claim that a garden connects to what students study?",
        opts: [
          "Students could measure and graph plant growth.",
          "Students could calculate area when planning the beds.",
          "The patch of grass is beside the gym.",
          "The writer's name is Imani Brooks.",
        ],
        ans: 2,
        why: [
          "The location of the grass is a fact, but it does not show a connection to what students study.",
          "The name of the writer does not support the claim about learning.",
        ],
        rat: "Paragraph 2 gives measuring, graphing and calculating area as links to science and math.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Role of a paragraph",
        type: "choice",
        prompt: "What is the main job of paragraph 3?",
        opts: [
          "It answers a worry that people might have.",
          "It gives the writer's name and school.",
          "It describes how to plant lettuce.",
        ],
        why: [
          "The name appears at the end of the letter, not in paragraph 3.",
          "The letter never gives steps for planting lettuce.",
        ],
        rat: "Paragraph 3 begins with Some people worry and then responds with However.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt:
          "Why does the writer begin paragraph 3 with “Some people worry” instead of ignoring the worry?",
        opts: [
          "To show that the writer has considered another view",
          "To prove that the garden will cost too much",
          "To make the reader feel afraid of the plan",
        ],
        why: [
          "The writer goes on to answer the cost worry with facts, so the writer does not agree it is too costly.",
          "The tone is calm and the writer tries to reassure the reader, not frighten them.",
        ],
        rat: "Naming the worry and answering it makes the argument fairer and stronger.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why does the writer mention the nearby school's 40 bags of salad?",
        opts: [
          "To show that a school garden can really work",
          "To suggest that the school should sell salad",
          "To complain about the other school's garden",
        ],
        why: [
          "The writer wants to give food to a food pantry, not sell it.",
          "The writer is using the other school as a positive example, not as a complaint.",
        ],
        rat: "A real example from a nearby school is evidence that a garden club can succeed and help the community.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Respond with a reason",
        type: "short",
        prompt:
          "Do you agree that the school should plant a garden? Use one reason from the letter to explain your answer.",
        lookFor: [
          "States a clear opinion",
          "Uses one accurate reason or detail from the letter",
          "Explains why the reason matters",
        ],
        rubric: [
          "Takes a position",
          "Uses evidence from the text",
          "Connects the evidence to the position",
        ],
        frame: "I agree/disagree that ___ because ___. The letter says ___, which shows ___.",
        model:
          "I agree that the school should plant a garden because it would help students learn. The letter says students could measure, graph and calculate area, which connects the garden to science and math.",
      },
    ],
    transfer: {
      prompt:
        "Choose a change you would like to see at your school. State your claim, give one reason, and answer one worry someone might have.",
      lookFor: [
        "States a claim",
        "Gives a reason",
        "Answers a possible worry with however or although",
      ],
      frame: "I propose that ___. One reason is ___. Some people worry ___; however, ___.",
    },
    guide: {
      mini: "Color-code the letter: claim in blue, evidence in green, counterclaim in orange, rebuttal in purple. Discuss how the colors show the structure of an argument.",
      discussion: [
        "Which detail is the strongest evidence?",
        "What makes the worry in paragraph 3 fair?",
        "What would make the argument even stronger?",
      ],
      misconception:
        "Students may think a fact about location is evidence for the claim; ask whether it shows that the garden would help learning.",
      answerNotes: [
        "Question 3: measuring, graphing and calculating area are the details that connect to study.",
        "Question 4: paragraph 3 states a worry and then responds.",
      ],
      model:
        "I agree that the school should plant a garden because it would help students learn. The letter says students could measure, graph and calculate area.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student what the writer wants and which reason is strongest. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pregunte a su estudiante qué quiere la autora y cuál es la razón más fuerte. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What does the writer want?", "How does the writer answer a worry?"],
    ),
    connections: {
      write: "Write a letter that proposes a change.",
      speak: "Present your claim and one reason aloud.",
      listen: "Listen to two speakers who disagree.",
    },
  },
  {
    id: "amount-versus-percent",
    level: "C",
    title: "Two Ways to Describe Change: Amount and Percent",
    summary:
      "Compare the amount of a change with the percent change, and decide which tells the clearer story.",
    genre: "Informational text with math",
    subject: "Math (percent)",
    topics: ["percent change", "comparing quantities"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Compare two ways of describing change and explain when each is useful.",
    languageFeatures: ["compare and contrast", "qualifying with however", "precise vocabulary"],
    minutes: 18,
    content:
      "Explain the difference between absolute change and percent change and when each is more informative.",
    language: "Use however, yet and whereas to compare two ideas precisely.",
    essential: "When does a small number matter, and when does it not?",
    background:
      "Think about whether five dollars is a big change when you are buying a helmet or a car.",
    hook: "Two prices rise by exactly five dollars. Why do they feel so different?",
    purpose: "Read to learn two ways to describe a change and when to use each.",
    vocab: [
      [
        "absolute change",
        "the difference between a new amount and the original amount",
        "The absolute change in the helmet price was five dollars.",
        "cambio absoluto",
      ],
      [
        "percent change",
        "the change compared with the original amount, written as a percent",
        "The percent change was twenty-five percent.",
        "cambio porcentual",
      ],
      [
        "original",
        "the amount you start with",
        "Compare the change with the original price.",
        "original",
      ],
      [
        "measure",
        "a way of describing an amount",
        "Percent change is one measure of change.",
        "medida",
      ],
    ],
    paras: [
      {
        text: "When a quantity changes, we can describe the change in two ways. The absolute change is the difference between the new amount and the original amount. The percent change compares that difference with the original amount. Both are useful, but they answer different questions.",
        q: "What are the two ways to describe change?",
      },
      {
        text: "Consider two prices. A bike shop raised the price of a helmet from $20 to $25. A car dealership raised the price of a car from $20,000 to $20,005. Both prices went up by the same absolute amount, $5, yet the two changes feel very different.",
        q: "What do the two examples have in common?",
      },
      {
        text: "Percent change shows why. The helmet's price increased by 5 ÷ 20 = 0.25, or 25%. The car's price increased by 5 ÷ 20,000 = 0.00025, or 0.025%. A shopper would probably notice the first change and ignore the second.",
        q: "How does percent change explain the difference?",
      },
      {
        text: "However, percent change is not always the better measure. A town that adds 50 people to a population of 100 has grown by 50%, but a city that adds 50 people to a population of 1,000,000 has hardly changed. If planners must decide how many new houses to build, the absolute change may matter more. The clearest reports often give both numbers, so readers can judge for themselves.",
        q: "Why might absolute change matter more?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a definition",
        type: "choice",
        prompt: "According to paragraph 1, what does the percent change compare?",
        opts: [
          "the difference with the original amount",
          "the new amount with another new amount",
          "the original amount with the number of people",
        ],
        why: [
          "Paragraph 1 compares the difference with the original amount, not with a second new amount.",
          "The number of people is only an example in paragraph 4; paragraph 1 is about any quantity.",
        ],
        rat: "Paragraph 1 says the percent change compares the difference with the original amount.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 1, the absolute change is “the difference” between two amounts. What does absolute mean here?",
        opts: [
          "the plain amount, without comparing it to anything",
          "the biggest amount that a change could possibly be",
          "the amount that must always be a positive number",
        ],
        why: [
          "Absolute change is not the biggest change; it can be small, like five dollars.",
          "The text does not say the change must be positive; the word means the amount by itself.",
        ],
        rat: "The absolute change is the plain difference, such as $5, before it is compared with the original amount.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Why the author chose an example",
        type: "choice",
        prompt: "Why does the author compare the helmet and the car?",
        opts: [
          "To show that the same absolute change can have different percent changes",
          "To argue that cars are too expensive for most families to buy",
          "To explain why stores decide to raise their prices every month",
        ],
        why: [
          "The author never argues about the cost of cars; both prices are examples of math.",
          "The passage does not say stores raise prices monthly; it uses one example change.",
        ],
        rat: "Both items rise by $5, but the percent changes are 25% and 0.025%.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Apply the calculation",
        type: "choice",
        prompt: "An item that costs $40 rises to $50. What is the percent change?",
        opts: ["25%", "20%", "10%"],
        why: [
          "Twenty percent comes from dividing the change by the new price, $50, instead of the original price.",
          "Ten is the absolute change in dollars, not the percent change.",
        ],
        rat: "The change is $10, and 10 ÷ 40 = 0.25, or 25%.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt: "Paragraph 4 begins with “However.” What does this word signal?",
        opts: [
          "A limit on the idea in the paragraph before it",
          "A repeat of the same idea that appears in paragraph 3",
          "A switch to a brand new topic about prices and sales",
        ],
        why: [
          "However introduces a limit, so it does not repeat the earlier idea.",
          "Paragraph 4 is still about percent change, using population instead of prices.",
        ],
        rat: "However tells the reader that percent change has a limit, which the paragraph then explains.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement does paragraph 4 best support?",
        opts: [
          "A good report may share both the amount and the percent change.",
          "Percent change is always more useful than absolute change.",
          "Absolute change should be ignored by planners.",
        ],
        why: [
          "Paragraph 4 gives a case where absolute change matters, so percent is not always more useful.",
          "The paragraph says absolute change may matter more for planners, so it should not be ignored.",
        ],
        rat: "The last sentence says the clearest reports often give both numbers.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain when absolute change might be more useful than percent change. Use an example from the text.",
        lookFor: [
          "Names a situation such as planning houses",
          "Uses the example of 50 people in a city of 1,000,000",
          "Explains why the actual number matters",
        ],
        rubric: [
          "Makes a clear claim",
          "Uses an accurate example from paragraph 4",
          "Explains the reasoning",
        ],
        frame: "Absolute change is more useful when ___. For example, ___ because ___.",
        model:
          "Absolute change is more useful when planners need the actual number. For example, a city that adds 50 people has a tiny percent change, but the planners still need to know how many new houses 50 people need.",
      },
    ],
    transfer: {
      prompt:
        "A school club grows from 10 members to 15 members, and a school grows from 1,000 students to 1,005 students. Compare the changes using both absolute change and percent change.",
      lookFor: [
        "Finds 5 for both absolute changes",
        "Finds 50% for the club and 0.5% for the school",
        "Explains why the percents differ",
      ],
      frame:
        "Both changed by ___, but the club's percent change is ___ and the school's is ___ because ___.",
    },
    guide: {
      mini: "Make a two-column chart with absolute change and percent change. Fill it in for the helmet and the car and ask students which column tells the clearer story in each case.",
      discussion: [
        "Why must we divide by the original amount?",
        "Which measure would you use for a news headline?",
        "When would you report both?",
      ],
      misconception:
        "Students may divide by the new amount; use the $40 to $50 problem to show the difference between 25% and 20%.",
      answerNotes: [
        "Question 4: 10 ÷ 40 = 0.25, so the percent change is 25%.",
        "Question 6: the last sentence recommends giving both numbers.",
      ],
      model:
        "Absolute change is more useful when planners need the actual number. For example, 50 new people in a city need houses even though the percent is tiny.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain why a five-dollar change feels different for a helmet and a car. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique por qué un cambio de cinco dólares se siente diferente en un casco y en un carro. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What is the absolute change in the helmet price?",
        "Why is the percent change for the car so small?",
      ],
    ),
    connections: {
      write: "Write a paragraph comparing absolute change and percent change.",
      speak: "Explain aloud why the same change can matter differently.",
      listen: "Listen to a lesson about percent increase.",
    },
  },
  {
    id: "canal-letter-1826",
    level: "C",
    title: "A Letter from Rochester, 1826 (an invented letter)",
    summary:
      "Read an invented letter in the style of a traveler on the Erie Canal and analyze how it shows both benefits and costs of change.",
    genre: "Primary-source style (invented letter)",
    subject: "Social studies (U.S. history)",
    topics: ["Erie Canal", "point of view", "cause and effect"],
    keyUse: "Inform",
    eldStandard: "ELD-SS",
    languageFunction: "Analyze a writer's point of view and the effects of a historical change.",
    languageFeatures: ["point of view", "cause and effect", "formal letter language"],
    minutes: 20,
    content:
      "Analyze how a historical letter shows the effects of the Erie Canal on trade and on different people.",
    language:
      "Use the words because, as a result and however to connect causes, effects and opposing views.",
    essential: "How does a new technology change life for different people?",
    background:
      "A canal is a waterway made by people. Think about how moving goods more cheaply could change a town.",
    hook: "A boat moves no faster than a brisk walk, yet it beats the wagon road by weeks. How can that be?",
    purpose:
      "Read to find how the writer feels about the canal and what effects the writer notices.",
    vocab: [
      [
        "aqueduct",
        "a bridge that carries water across a valley or river",
        "The canal crossed the river on an aqueduct.",
        "acueducto",
      ],
      [
        "marvel",
        "something that amazes people",
        "The canal was a marvel of its time.",
        "maravilla",
      ],
      [
        "towpath",
        "a path beside a canal where animals pull boats",
        "Horses walked along the towpath.",
        "camino de sirga",
      ],
      ["confess", "to admit something", "I confess I felt dizzy.", "confesar"],
    ],
    paras: [
      {
        text: "Rochester, June 1826. Dear Cousin Hannah, I write to you from the middle of a town that did not seem to exist when Father last visited. Since the canal opened, Rochester has grown louder and busier every month. The boat that brought me here from Albany moved no faster than a brisk walk, yet I arrived in less than a week, and the same trip by wagon over muddy roads would have taken far longer.",
        q: "How did the writer travel?",
      },
      {
        text: "The canal itself is a marvel. Horses walk along a path beside the water, pulling our boat by a long rope. At Rochester, the canal rises over the Genesee River on a great stone aqueduct, and I confess I felt dizzy to look down at the river beneath us. Everything about the journey reminded me how much labor went into digging this channel.",
        q: "What impresses the writer about the canal?",
      },
      {
        text: "The effect on trade is plain. Flour mills line the river, and barrels of flour wait on the docks for boats bound east. A merchant I met told me that the cost of sending a barrel to the coast has fallen greatly since last year. Farmers who once struggled to sell their wheat now find ready buyers.",
        q: "What effects on trade does the writer describe?",
      },
      {
        text: "Not everyone is pleased. A farmer near the towpath complained that the boats frighten his cattle, and men who ran wagon lines fear for their business. Still, I believe the canal will change this country. Write soon and tell me whether you will visit. Your affectionate cousin, Eliza",
        q: "Who is not pleased, and what does the writer believe?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How did the writer travel from Albany to Rochester?",
        opts: [
          "By canal boat pulled by horses",
          "By wagon over muddy roads",
          "By a boat powered by sails",
        ],
        why: [
          "The writer says the wagon trip would have taken far longer, so she did not use it.",
          "The text says horses pull the boat by a rope, so sails are not mentioned.",
        ],
        rat: "Paragraph 2 says horses pull the boat by a long rope along a path beside the water.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, the writer calls the canal a “marvel.” What does marvel mean?",
        opts: ["something amazing", "something dangerous", "something ordinary"],
        why: [
          "The writer worries about nothing dangerous in the canal; she is impressed by it.",
          "The writer describes how much labor went into it, so it is not ordinary to her.",
        ],
        rat: "The writer describes the aqueduct and the labor with wonder, so a marvel is something amazing.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt: "Why does the writer say she “felt dizzy to look down” from the aqueduct?",
        opts: [
          "To show how high and impressive the aqueduct seemed to her",
          "To show that she was ill during the whole long journey",
          "To warn her cousin Hannah that the canal is not safe",
        ],
        why: [
          "The writer says she felt dizzy when she looked down, not that she was sick during the trip.",
          "She calls the canal a marvel, so she is not warning anyone about danger.",
        ],
        rat: "A personal reaction in a letter shows how amazing the aqueduct was to her.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that gives the best evidence of the canal's effect on trade.",
        evidence: ["p3"],
        rat: "Paragraph 3 describes flour mills, barrels waiting for boats, lower shipping costs and farmers finding buyers.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Cause and effect",
        type: "choice",
        prompt: "Which statement best explains why Rochester grew so quickly?",
        opts: [
          "The canal made it cheap to ship flour and other goods to buyers.",
          "The wagon roads to Rochester were improved and widened.",
          "Farmers near Rochester stopped growing any wheat after 1825.",
        ],
        why: [
          "The text says wagon trips were slow, and it never says the roads were improved.",
          "The text says farmers who once struggled to sell wheat now find buyers, so they kept growing it.",
        ],
        rat: "Paragraph 3 says the cost of shipping fell greatly and farmers found ready buyers, which helped the town's mills grow.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Point of view",
        type: "choice",
        prompt: "How does paragraph 4 change the picture of the canal?",
        opts: [
          "It shows that some people were unhappy about the change.",
          "It shows that nobody in the whole town liked the canal.",
          "It shows that the canal stopped working for the town.",
        ],
        why: [
          "The writer says not everyone is pleased, which means some people are happy and some are not.",
          "The writer still believes the canal will change the country, so it has not stopped working.",
        ],
        rat: "The farmer and the wagon-line workers show costs of the canal that paragraph 3 did not mention.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain two different effects of the canal that Eliza describes. Include one positive effect and one negative effect.",
        lookFor: [
          "Names a positive effect such as cheaper shipping or growth of Rochester",
          "Names a negative effect such as frightened cattle or lost wagon business",
          "Uses details from the letter to support both",
        ],
        rubric: [
          "Identifies two different effects",
          "Uses accurate details from the letter",
          "Explains who is affected",
        ],
        frame:
          "One positive effect is ___. For example, ___. However, one negative effect is ___ because ___.",
        model:
          "One positive effect is that shipping became cheaper. For example, flour mills in Rochester could send barrels east. However, one negative effect is that men who ran wagon lines feared for their business because boats carried goods instead.",
      },
    ],
    transfer: {
      prompt:
        "A new highway is built beside a small town. Describe one benefit and one cost for different people, using the letter as a model.",
      lookFor: [
        "Names one benefit and who gains",
        "Names one cost and who is affected",
        "Uses however or although to show two sides",
      ],
      frame: "One benefit of ___ is ___ for ___. However, ___ because ___.",
    },
    guide: {
      mini: "Explain that this is an invented letter written for this lesson in the style of travelers' letters, not a real document. Ask students to find the places where Eliza gives facts and where she gives opinions.",
      discussion: [
        "How do we know how Eliza feels about the canal?",
        "Why might the farmer and the wagon drivers disagree with Eliza?",
        "What would make a letter a reliable source of information?",
      ],
      misconception:
        "Students may treat a single writer's view as the whole history; ask whose voices are missing.",
      answerNotes: [
        "Question 5: paragraph 3 links lower shipping costs and ready buyers to Rochester's growth.",
        "Question 6: paragraph 4 balances Eliza's positive view with the costs for some people.",
      ],
      model:
        "One positive effect is cheaper shipping. One negative effect is that wagon-line workers feared losing business.",
    },
    family: family(
      "This letter was invented for the lesson. Read one paragraph at a time and ask your student who might like the canal and who might not. You can talk in any language, then ask for one sentence in English.",
      "Esta carta fue inventada para la lección. Lean un párrafo a la vez y pregunte a su estudiante a quién podría gustarle el canal y a quién no. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What did the canal change about trade?", "Who was unhappy, and why?"],
    ),
    connections: {
      write: "Write a letter from the point of view of a farmer near the canal.",
      speak: "Explain one benefit and one cost of the canal aloud.",
      listen: "Listen to a talk about the Erie Canal.",
    },
  },
  {
    id: "why-the-sky-is-blue",
    level: "C",
    title: "Why Is the Sky Blue?",
    summary:
      "Follow a scientific explanation of why the sky looks blue, why it is not violet, and why sunsets are red.",
    genre: "Science explanation",
    subject: "Science (light and waves)",
    topics: ["light", "scattering", "wavelength"],
    keyUse: "Explain",
    eldStandard: "ELD-SC",
    languageFunction: "Explain a natural phenomenon using cause and effect.",
    languageFeatures: ["cause and effect", "technical vocabulary", "anticipating a question"],
    minutes: 18,
    content:
      "Explain why the sky looks blue and why sunsets look red using the scattering of light.",
    language: "Use because, therefore and as a result to connect causes and effects.",
    essential: "How can one process explain both a blue sky and a red sunset?",
    background: "Think about what color the sky is at noon and at sunset.",
    hook: "Sunlight looks white, but the sky does not. Where does the blue come from?",
    purpose: "Read to learn how air changes the color of sunlight and why the sky is not violet.",
    vocab: [
      [
        "wavelength",
        "the distance between two peaks of a wave",
        "Blue light has a short wavelength.",
        "longitud de onda",
      ],
      ["scatter", "to send in many directions", "Air molecules scatter blue light.", "dispersar"],
      [
        "atmosphere",
        "the layer of gases around Earth",
        "Sunlight enters the atmosphere.",
        "atmósfera",
      ],
      [
        "molecule",
        "a tiny particle of a substance",
        "Nitrogen molecules scatter light.",
        "molécula",
      ],
    ],
    paras: [
      {
        text: "On a clear day the sky looks blue, but sunlight itself looks white. White light is actually a mixture of all the colors of the rainbow. Each color travels as a wave, and different colors have different wavelengths. Violet and blue have short wavelengths, while orange and red have longer ones.",
        q: "What is white light made of?",
      },
      {
        text: "As sunlight enters the atmosphere, it collides with gas molecules such as nitrogen and oxygen. These molecules scatter light in many directions. Short-wavelength light scatters much more than long-wavelength light. Therefore, blue light is scattered all across the sky, and some of it reaches your eyes from every direction.",
        q: "What happens to light in the atmosphere?",
      },
      {
        text: "If violet light is scattered even more than blue, why isn't the sky violet? There are several reasons. The Sun gives off less violet light than blue light, the upper atmosphere absorbs some of the violet, and human eyes are less sensitive to violet than to blue. Together, these effects make blue the color we see.",
        q: "Why is the sky not violet?",
      },
      {
        text: "The same process explains red sunsets. When the Sun is low, its light travels through much more air before reaching you. Most of the blue light is scattered out of the direct beam along the way, leaving the longer red and orange wavelengths to reach your eyes.",
        q: "Why are sunsets red?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to paragraph 1, what is white light?",
        opts: [
          "a mixture of all the colors of the rainbow",
          "a single color with a very long wavelength",
          "a color that only appears at sunset",
        ],
        why: [
          "Paragraph 1 says different colors have different wavelengths, so white light is not a single color.",
          "Sunset color is explained in paragraph 4 and is not the same as white light.",
        ],
        rat: "Paragraph 1 says white light is a mixture of all the colors of the rainbow.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, molecules “scatter” light. What does scatter mean?",
        opts: [
          "send it in many directions",
          "stop it from moving at all",
          "make it move much faster",
        ],
        why: [
          "The text says some blue light still reaches your eyes, so the light is not stopped completely.",
          "The text never says the light speeds up; it says the light is sent in different directions.",
        ],
        rat: "The passage says molecules scatter light in many directions.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt:
          "On a planet with no atmosphere, what would the daytime sky most likely look like from the ground?",
        opts: [
          "dark, because nothing would scatter the sunlight",
          "blue, because the sunlight itself is white all day",
          "red, because the Sun would always be low in the sky",
        ],
        why: [
          "Blue light is scattered by gas molecules, and without an atmosphere there are none.",
          "Red skies happen when a low Sun's light passes through a lot of air, and there would be no air.",
        ],
        rat: "The sky is blue because molecules scatter blue light, so without molecules there is nothing to scatter it.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "What question does paragraph 3 answer?",
        opts: [
          "Why is the sky not violet if violet scatters more?",
          "Why is white light made of many different colors?",
          "Why does the Sun look so red at the end of the day?",
        ],
        why: [
          "The color mixture of white light is explained in paragraph 1.",
          "The red sunset is explained in paragraph 4.",
        ],
        rat: "Paragraph 3 begins with the question about why the sky is not violet.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt: "Why does the author ask a question at the start of paragraph 3?",
        opts: [
          "To address a question a thoughtful reader might already have",
          "To show that scientists still do not know the answer",
          "To introduce a brand new topic about the Moon's light",
        ],
        why: [
          "The paragraph goes on to give three reasons, so scientists do have an answer.",
          "The paragraph stays on sky color; the Moon is never mentioned.",
        ],
        rat: "The question anticipates the reader's objection that violet should look brighter than blue.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that explains why sunsets look red.",
        evidence: ["p4"],
        rat: "Paragraph 4 says the low Sun's light travels through more air, so most blue light is scattered away, leaving red and orange.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt: "Explain why the sky looks blue and not violet. Use two reasons from the text.",
        lookFor: [
          "Says blue light is scattered across the sky",
          "Gives at least two reasons from paragraph 3",
          "Connects the reasons to what we see",
        ],
        rubric: [
          "Explains scattering clearly",
          "Uses accurate reasons",
          "Connects causes to the color we see",
        ],
        frame: "The sky looks blue because ___. It is not violet because ___ and ___.",
        model:
          "The sky looks blue because air molecules scatter short-wavelength blue light across the sky. It is not violet because the Sun gives off less violet light than blue and our eyes are less sensitive to violet.",
      },
    ],
    transfer: {
      prompt:
        "At noon the Sun's light passes through less air than at sunset. Use that fact to explain why the noon sky is blue and the sunset is red.",
      lookFor: [
        "Says blue light scatters across the sky at noon",
        "Says at sunset the light passes through more air so blue is scattered away",
        "Uses because, therefore or as a result",
      ],
      frame: "At noon, ___ because ___. At sunset, ___ because ___.",
    },
    guide: {
      mini: "Use a prism or a diagram to show white light splitting into colors. Ask students to predict which colors air will scatter most before reading paragraph 2.",
      discussion: [
        "Why does a short wavelength scatter more?",
        "How is a red sunset like looking through more air?",
        "What other everyday observations depend on light scattering?",
      ],
      misconception:
        "Students may think the sky reflects the ocean; the passage explains that the color comes from scattered sunlight.",
      answerNotes: [
        "Question 3: with no atmosphere there are no molecules to scatter light.",
        "Question 5: the author asks the question the reader is likely to think.",
      ],
      model:
        "The sky looks blue because air molecules scatter blue light across the sky. It is not violet because the Sun gives off less violet and our eyes are less sensitive to it.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain in their own words why sunsets are red. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique con sus propias palabras por qué los atardeceres son rojos. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What does the air do to sunlight?", "Why is the sunset red?"],
    ),
    connections: {
      write: "Write a cause-and-effect paragraph about the sky.",
      speak: "Explain the blue sky aloud using scatter.",
      listen: "Listen to a science talk about light.",
    },
  },
];

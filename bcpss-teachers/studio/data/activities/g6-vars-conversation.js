// conversation-studio: explain a relationship to a partner and compare representations (6.EE.C.9).
const turn = (id, prompt, moveId, options) => ({ id, speaker: "you", prompt, moveId, options });

export default {
  id: "g6-vars-conversation",
  engine: "conversation-studio",
  title: "Talk It Through: One Hose, Three Ways",
  grade: "6",
  band: "6-8",
  subject: "math",
  lessonId: "g6-math-variables-relationships",
  standards: ["6.EE.C.9"],
  curriculum: {
    status: "district-referenced",
    unitId: "g6-math-u5",
    program: "Reveal Math",
    note: "6.EE.C.9 is one of the standards listed for this BCPSS seed unit. This activity is original practice and is not a publisher lesson.",
  },
  vocabIds: [
    "independent-variable",
    "dependent-variable",
    "rate-of-change",
    "relationship",
    "represent",
    "compare",
    "justify",
  ],
  minutes: 18,
  intro:
    "Prepare and rehearse a partner conversation about a relationship between two quantities. You choose the moves, put them in a useful order, and practice what you would say.",
  topic: {
    title: "One hose, three ways to show it",
    context:
      "A hose fills a rain barrel. A table, a graph and an equation can each show how many gallons y are in the barrel after x minutes. Your partner has only the table and has not seen the graph or the equation yet.",
    claim:
      "The number of gallons depends on the number of minutes, and it goes up by the same amount every minute.",
    visual: {
      kind: "table",
      alt: "A table with minutes x of 1, 2 and 3 and gallons y of 4, 8 and 12.",
      head: ["x (minutes)", "y (gallons)"],
      rows: [
        ["1", "4"],
        ["2", "8"],
        ["3", "12"],
      ],
    },
  },
  roles: [
    {
      id: "explainer",
      label: "Partner A",
      job: "Explains the relationship using the table, the graph or the equation.",
    },
    {
      id: "listener",
      label: "Partner B",
      job: "Listens, asks a question, and says whether the explanation makes sense.",
    },
  ],
  moves: [
    {
      id: "name-variables",
      label: "Name the variables",
      function: "Say which quantity is independent and which is dependent.",
      frames: {
        ee: ["The independent variable is ___.", "The dependent variable is ___."],
        dev: ["___ is the independent variable and ___ is the dependent variable because ___."],
        exp: ["Since ___ depends on ___, the dependent variable is ___."],
        br: ["Here ___ determines ___, so ___ is the dependent variable."],
      },
      wordBank: {
        ee: ["minutes", "gallons", "independent", "dependent"],
        dev: ["depends on", "choose"],
        exp: [],
        br: [],
      },
      example:
        "Minutes is the independent variable and gallons is the dependent variable because the gallons depend on how long the hose runs.",
      listenFor: "Both variables named with their quantities, not just x and y.",
    },
    {
      id: "describe-pattern",
      label: "Describe the pattern",
      function: "Say what happens to one quantity as the other one changes.",
      frames: {
        ee: ["As minutes go up, gallons ___."],
        dev: ["As the minutes increase, the gallons ___ by ___ each time."],
        exp: ["Each time the minutes increase by ___, the gallons increase by ___."],
        br: [
          "The dependent variable grows by a constant amount as the independent variable increases.",
        ],
      },
      wordBank: {
        ee: ["go up", "same", "each minute"],
        dev: ["increase", "pattern"],
        exp: [],
        br: [],
      },
      example: "As the minutes increase, the gallons increase by the same amount each time.",
      listenFor: "A direction (increase or decrease) and a consistent amount.",
    },
    {
      id: "state-rate",
      label: "State the rate of change",
      function:
        "Say how much the dependent variable changes when the independent variable goes up by 1.",
      frames: {
        ee: ["It goes up by ___ each minute."],
        dev: ["The rate of change is ___ gallons per minute."],
        exp: ["The rate of change is ___ because ___ gallons are added for every 1 minute."],
        br: ["The constant rate of change is ___ gallons per minute, as the table shows."],
      },
      wordBank: { ee: ["each", "per", "rate"], dev: ["rate of change"], exp: [], br: [] },
      example:
        "The rate of change is 4 gallons per minute, because 4 gallons are added for every 1 minute.",
      listenFor: "A number with both units.",
    },
    {
      id: "give-pair",
      label: "Give an example pair",
      function: "Use one row of the table to show the pattern is true.",
      frames: {
        ee: ["When x is ___, y is ___."],
        dev: ["For example, when x is ___ minutes, y is ___ gallons."],
        exp: ["In the row where x is ___, y is ___, which shows ___."],
        br: ["The ordered pair (___, ___) confirms that ___."],
      },
      wordBank: { ee: ["when", "row"], dev: ["for example", "pair"], exp: [], br: [] },
      example: "For example, when x is 3 minutes, y is 12 gallons.",
      listenFor: "A real pair from the table with units.",
    },
    {
      id: "use-equation",
      label: "Connect to the equation",
      function: "Say the equation and explain what each part means.",
      frames: {
        ee: ["The equation is y = ___ times x."],
        dev: ["The equation is y = ___x, so y is ___ times x."],
        exp: ["The equation y = ___x says that ___ times the minutes gives the gallons."],
        br: ["The equation y = ___x encodes the rate of change as the coefficient of x."],
      },
      wordBank: { ee: ["equation", "times"], dev: ["multiply"], exp: [], br: [] },
      example: "The equation is y = 4x, so the gallons are 4 times the minutes.",
      listenFor: "The equation and what the number in front of x means.",
    },
    {
      id: "compare-reps",
      label: "Compare two representations",
      function:
        "Say how two ways of showing the relationship are alike and how they are different.",
      frames: {
        ee: ["The table and the graph both show ___."],
        dev: ["The table and the graph are alike because ___, but different because ___."],
        exp: ["Although both the ___ and the ___ show ___, the ___ makes it easier to see ___."],
        br: [
          "Both representations encode the same relationship; the ___ emphasizes ___, whereas the ___ emphasizes ___.",
        ],
      },
      wordBank: {
        ee: ["table", "graph", "same", "different"],
        dev: ["alike", "compare"],
        exp: [],
        br: [],
      },
      example:
        "Both show that the gallons go up by 4 each minute. The table gives exact pairs, and the graph shows the pattern as a straight line.",
      listenFor: "One similarity and one difference, named for both representations.",
    },
    {
      id: "point-to-evidence",
      label: "Point to evidence",
      function: "Show where in the table or graph your statement can be seen.",
      frames: {
        ee: ["In the table, I see ___."],
        dev: ["In the table, the gallons go from ___ to ___ when the minutes go from ___ to ___."],
        exp: ["You can see this in the table where ___, because ___."],
        br: ["The data support this: between x = ___ and x = ___, y changes by ___."],
      },
      wordBank: { ee: ["row", "look at"], dev: ["from", "to"], exp: [], br: [] },
      example:
        "In the table, the gallons go from 8 to 12 when the minutes go from 2 to 3, so they increase by 4.",
      listenFor: "Specific numbers from the representation.",
    },
    {
      id: "justify",
      label: "Justify your conclusion",
      function: "Say what you conclude and give a reason that uses the math.",
      frames: {
        ee: ["I choose the ___ because ___."],
        dev: ["I would use the ___ because ___."],
        exp: ["I conclude that the ___ is best for this question because ___."],
        br: ["Given that ___, the ___ is the most efficient representation because ___."],
      },
      wordBank: { ee: ["choose", "because"], dev: ["use", "reason"], exp: [], br: [] },
      example:
        "I would use the equation y = 4x because 4 times 10 is 40, and the graph does not extend that far.",
      listenFor: "A choice with a reason that uses the numbers.",
    },
    {
      id: "ask-check",
      label: "Check your partner's understanding",
      function: "Ask your partner a question to see whether the explanation made sense.",
      frames: {
        ee: ["Does that make sense?"],
        dev: ["Can you tell me in your own words what I said about ___?"],
        exp: ["What would the table show if the minutes were ___?"],
        br: ["Which part of my explanation would you challenge, and why?"],
      },
      wordBank: { ee: ["make sense", "question"], dev: ["in your own words"], exp: [], br: [] },
      example: "What would the table show if the minutes were 5?",
      listenFor: "A question that needs more than yes or no.",
    },
    {
      id: "share-preference",
      label: "Share a preference",
      function: "Say which representation you like without using the math.",
      frames: {
        ee: ["I like the ___."],
        dev: ["I like the ___ because it looks ___."],
        exp: ["I prefer the ___ because it feels ___."],
        br: ["My personal preference is the ___."],
      },
      example: "I like the graph because it is colorful.",
      notFit:
        "A preference does not explain the relationship. Choose a move that uses numbers, words or a representation.",
    },
  ],
  purposes: [
    {
      id: "explain",
      label: "Explain a relationship",
      description: "Say which quantities are related, what pattern they follow, and how you know.",
      moveIds: [
        "name-variables",
        "describe-pattern",
        "state-rate",
        "give-pair",
        "use-equation",
        "ask-check",
        "share-preference",
      ],
      plan: {
        prompt: "Choose the moves that fit, then put them in the order you would use them.",
        expected: [
          "name-variables",
          "describe-pattern",
          ["state-rate", "give-pair"],
          "use-equation",
          "ask-check",
        ],
        hints: [
          "Think about what a listener needs to know before any pattern makes sense to them.",
          "A strong explanation moves from the quantities, to what happens, to how much, to a general rule. It finishes by involving your partner.",
          "One of the choices is about liking something rather than showing math. Leave it out.",
        ],
        model:
          "Start by saying which quantities are connected, then describe the pattern, then give the amount and one real pair in either order, then connect to the equation, and finish by checking that your partner understood.",
        why: [
          "Your partner first needs to know which two quantities you mean.",
          "Then describe what changes so they can picture the pattern.",
          "The rate and a real pair can come in either order; both make the pattern exact.",
          "The equation sums up the pattern in one sentence.",
          "Checking turns your explanation into a conversation.",
        ],
      },
      rehearsal: {
        intro: "Your partner has the table but has not seen the graph or the equation.",
        turns: [
          {
            id: "p1",
            speaker: "partner",
            say: "I see a table with minutes and gallons for the hose. How are the minutes and the gallons related?",
          },
          turn("y1", "Start by saying which quantities you are talking about.", "name-variables", [
            {
              id: "a",
              text: "Minutes is the independent variable and gallons is the dependent variable, because the gallons depend on how long the hose runs.",
              fit: "strong",
              note: "Names both variables with their quantities and says why one depends on the other.",
            },
            {
              id: "b",
              text: "The minutes and the gallons are the variables.",
              fit: "partial",
              note: "Both variables are named, but not which is independent or dependent, or why.",
            },
            {
              id: "c",
              text: "The barrel is outside near the garden.",
              fit: "off",
              note: "That is a detail from the story, but it does not name the variables or say how they are connected.",
            },
          ]),
          {
            id: "p2",
            speaker: "partner",
            say: "Okay. So what happens to the gallons as the minutes go up?",
          },
          turn("y2", "Describe what changes.", "describe-pattern", [
            {
              id: "a",
              text: "As the minutes increase, the gallons increase by the same amount each time.",
              fit: "strong",
              note: "Gives a direction and says the change is the same each time.",
            },
            {
              id: "b",
              text: "The gallons go up.",
              fit: "partial",
              note: "True, but it does not say whether the increase is steady or how it compares to the minutes.",
            },
            {
              id: "c",
              text: "The minutes are small numbers.",
              fit: "off",
              note: "That describes the size of the numbers, not how the gallons change as the minutes change.",
            },
          ]),
          {
            id: "p3",
            speaker: "partner",
            say: "How much does it go up each minute? Can you show me with a row?",
          },
          turn("y3", "Give the amount and show it with a row from the table.", "state-rate", [
            {
              id: "a",
              text: "The rate of change is 4 gallons per minute. For example, when x is 3 minutes, y is 12 gallons.",
              fit: "strong",
              note: "States the rate with both units and backs it up with a real pair from the table.",
            },
            {
              id: "b",
              text: "It goes up by 4.",
              fit: "partial",
              note: "The amount is right, but it needs units, and a row from the table would show it is true.",
            },
            {
              id: "c",
              text: "It goes up by 3 each minute.",
              fit: "off",
              note: "The 3 is a number in the table, but the gallons increase by a different amount each minute. Check two rows.",
            },
          ]),
          { id: "p4", speaker: "partner", say: "Is there an equation for this relationship?" },
          turn("y4", "Connect the pattern to an equation.", "use-equation", [
            {
              id: "a",
              text: "The equation is y = 4x, so the gallons are 4 times the minutes.",
              fit: "strong",
              note: "Gives the equation and explains what the number in front of x means.",
            },
            {
              id: "b",
              text: "The equation is y equals 4.",
              fit: "partial",
              note: "That leaves out x. The gallons change when the minutes change, so the equation needs both variables.",
            },
            {
              id: "c",
              text: "The equation is x + y = 4.",
              fit: "off",
              note: "Test it with the row where x is 3 and y is 12. Does the equation work for that row?",
            },
          ]),
        ],
      },
    },
    {
      id: "compare",
      label: "Compare representations",
      description:
        "Say how two ways of showing a relationship are alike and different, and justify which one to use.",
      moveIds: [
        "compare-reps",
        "point-to-evidence",
        "justify",
        "ask-check",
        "describe-pattern",
        "share-preference",
      ],
      plan: {
        prompt: "Choose the moves that fit, then put them in the order you would use them.",
        expected: ["compare-reps", "point-to-evidence", "justify", "ask-check"],
        hints: [
          "Begin by setting the two ways of showing the same thing side by side.",
          "Whatever you say needs to be backed by something your partner can see in the numbers or the picture.",
          "End with your conclusion and then hand the conversation to your partner. One choice only repeats a pattern you already know, and one is only a feeling.",
        ],
        model:
          "Open with how the two representations are alike and different, point to a place in one of them that shows it, state which one you would use and why, and finish by asking your partner a question.",
        why: [
          "Comparison is the purpose, so it comes first.",
          "Pointing to specific numbers makes the comparison true instead of just a claim.",
          "Your conclusion should come after you have shown the evidence.",
          "Asking a question lets your partner respond to your reasoning.",
        ],
      },
      rehearsal: {
        intro:
          "You and your partner looked at the same hose. You used the graph and your partner used the table.",
        turns: [
          {
            id: "q1",
            speaker: "partner",
            say: "I used the table and you used the graph for the same hose. What is the same, and what is different?",
          },
          turn("z1", "Say one way they are alike and one way they are different.", "compare-reps", [
            {
              id: "a",
              text: "Both show that the gallons go up by 4 each minute. The table gives exact pairs, and the graph shows the pattern as a straight line.",
              fit: "strong",
              note: "Names one similarity and one difference, and names both representations.",
            },
            {
              id: "b",
              text: "They are both about the hose.",
              fit: "partial",
              note: "True, but it does not say what each representation shows or how they differ.",
            },
            {
              id: "c",
              text: "The graph is prettier than the table.",
              fit: "off",
              note: "That is an opinion about looks. The question asks how the representations show the relationship.",
            },
          ]),
          { id: "q2", speaker: "partner", say: "Where do you see the increase of 4 in the table?" },
          turn("z2", "Point to specific numbers.", "point-to-evidence", [
            {
              id: "a",
              text: "In the table, the gallons go from 8 to 12 when the minutes go from 2 to 3, so they increase by 4.",
              fit: "strong",
              note: "Uses specific numbers from the table and says what they show.",
            },
            {
              id: "b",
              text: "In the table, the numbers get bigger.",
              fit: "partial",
              note: "True, but it does not point to which numbers or show the amount of the increase.",
            },
            {
              id: "c",
              text: "The table has two columns.",
              fit: "off",
              note: "That describes the layout of the table, not the pattern in its numbers.",
            },
          ]),
          {
            id: "q3",
            speaker: "partner",
            say: "Which one would you use to find the gallons after 10 minutes?",
          },
          turn("z3", "State your choice and give a reason with the math.", "justify", [
            {
              id: "a",
              text: "I would use the equation y = 4x because 4 times 10 is 40, and the graph does not extend that far.",
              fit: "strong",
              note: "Makes a choice and gives a reason that uses the numbers.",
            },
            {
              id: "b",
              text: "I would use the graph.",
              fit: "partial",
              note: "That is a choice, but there is no reason. Say why the graph works for this question.",
            },
            {
              id: "c",
              text: "Any of them. They are all the same.",
              fit: "off",
              note: "They show the same relationship, but some are easier to use for a particular question. Choose one and explain why.",
            },
          ]),
        ],
      },
    },
  ],
  successCriteria: [
    {
      id: "s1",
      label: "I named the independent variable and the dependent variable with their quantities.",
    },
    {
      id: "s2",
      label: "I described the pattern and said how much the dependent variable changes.",
    },
    { id: "s3", label: "I used numbers from a table or graph as evidence." },
    { id: "s4", label: "I compared two representations and gave a reason for my choice." },
    { id: "s5", label: "I asked or answered a question that checked understanding." },
  ],
  rubric: {
    criteria: [
      {
        id: "relationship",
        label: "Explains the relationship",
        levels: [
          {
            score: 1,
            descriptor: "Names the quantities but does not say how they change together.",
          },
          {
            score: 2,
            descriptor:
              "Describes how the quantities change, but not the amount or which depends on which.",
          },
          {
            score: 3,
            descriptor:
              "Names independent and dependent variables and describes a constant rate of change.",
          },
          {
            score: 4,
            descriptor: "Connects variables, rate of change and equation in one clear explanation.",
          },
        ],
      },
      {
        id: "evidence",
        label: "Uses evidence",
        levels: [
          { score: 1, descriptor: "Makes statements without numbers." },
          {
            score: 2,
            descriptor:
              "Uses a number from the table or graph with little connection to the claim.",
          },
          {
            score: 3,
            descriptor: "Uses specific values from a table or graph to support the claim.",
          },
          {
            score: 4,
            descriptor:
              "Uses values from more than one representation to support and extend the claim.",
          },
        ],
      },
      {
        id: "language",
        label: "Uses math language",
        levels: [
          { score: 1, descriptor: "Uses everyday words only." },
          { score: 2, descriptor: "Uses some math words but they are not always accurate." },
          {
            score: 3,
            descriptor:
              "Uses independent variable, dependent variable and rate of change accurately.",
          },
          {
            score: 4,
            descriptor:
              "Uses precise math language and relational phrases such as as x increases, y increases.",
          },
        ],
      },
      {
        id: "interaction",
        label: "Interacts with a partner",
        levels: [
          { score: 1, descriptor: "Talks without responding to the partner." },
          { score: 2, descriptor: "Responds to the partner with a short answer." },
          { score: 3, descriptor: "Responds to and builds on what the partner said." },
          {
            score: 4,
            descriptor:
              "Asks a question that moves the thinking forward and responds to the answer.",
          },
        ],
      },
    ],
  },
  reflection: {
    prompt:
      "Which move made your explanation clearer for your partner? What would you add next time?",
    frames: {
      ee: ["The move that helped was ___.", "Next time I will say ___."],
      dev: ["The move that made it clearer was ___ because ___.", "Next time I could add ___."],
      exp: ["Using the ___ move made my explanation clearer because ___; next time I would ___."],
      br: ["I found that ___ strengthened my reasoning because ___, and I would extend it by ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

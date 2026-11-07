// Grades 6-8 publisher pass, Reading Room lessons, batch 1 (sample). Original EduWonderLab texts.
export default [
  {
    id: "map-scale",
    level: "B",
    title: "How a Map Shrinks the World",
    summary: "Learn how a map scale turns a distance on paper into a distance on the ground.",
    genre: "Informational text with math",
    subject: "Math and social studies",
    topics: ["ratios and scale", "reading maps"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how a ratio connects a map distance to a real distance.",
    languageFeatures: ["ratio language", "sequence words", "cause and effect"],
    minutes: 15,
    content: "Explain how a map scale is a ratio that changes a map distance into a real distance.",
    language: "Use ratio vocabulary and sequence words to explain a calculation from a text.",
    essential: "How can a small drawing tell us about a very large place?",
    background: "Think about a map you have used. How could you tell how far away a place was?",
    hook: "A paper map is only a few centimeters across, but the land it shows can be hundreds of kilometers wide.",
    purpose: "Read to find out what a scale is and how readers use it to find a real distance.",
    vocab: [
      [
        "scale",
        "the ratio that compares a map distance with a real distance",
        "The scale on the map is 1 centimeter to 5 kilometers.",
        "escala",
      ],
      [
        "distance",
        "how far one place is from another",
        "The distance from school to the museum is 20 kilometers.",
        "distancia",
      ],
      [
        "ratio",
        "a comparison of two quantities",
        "The ratio of centimeters to kilometers stays the same.",
        "razón",
      ],
      ["detail", "a small piece of information", "A bus map shows many small details.", "detalle"],
    ],
    paras: [
      {
        text: "A map cannot be the same size as the land it shows. Instead, mapmakers shrink everything by the same amount. The scale tells readers how much the map has been shrunk. On one school field-trip map, the scale is 1 centimeter to 5 kilometers. That means every centimeter on the paper stands for 5 kilometers on the ground.",
        q: "What does a scale tell the reader?",
      },
      {
        text: "Suppose the map shows the science museum 4 centimeters from the school. To find the real distance, multiply 4 by 5. The museum is 20 kilometers away. Notice that the calculation uses a ratio: 1 centimeter is to 5 kilometers as 4 centimeters is to 20 kilometers. Both ratios describe the same relationship.",
        q: "How does the writer find the real distance?",
      },
      {
        text: "A scale can also be written without units, such as 1:500,000. This form works with any unit of length. The scale of 1 centimeter to 5 kilometers is the same as 1:500,000, because 5 kilometers equals 500,000 centimeters. However, most people find the numbers easier to understand when the units are kilometers or miles.",
        q: "Why can a scale be written without units?",
      },
      {
        text: "Mapmakers choose a scale to fit the purpose of the map. A city bus map uses a small distance for each centimeter so that streets and stops are easy to see. A map of a whole country uses a much larger distance, so it can show fewer small details. Neither map is wrong. Each one is designed for a different job.",
        q: "Why do mapmakers use different scales?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 1, what does a map scale tell readers?",
        opts: [
          "How much the real distances were shrunk to fit on the map.",
          "How many places the mapmaker decided to put on the map.",
          "How many kilometers a person can walk in one hour.",
        ],
        why: [
          "The scale is about size, not about the number of places; the text says it tells how much the map has been shrunk.",
          "Walking speed is not mentioned in the passage; the scale compares a distance on paper with a distance on the ground.",
        ],
        rat: "Paragraph 1 says the scale tells readers how much the map has been shrunk, so each centimeter stands for a set distance on the ground.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 1, mapmakers “shrink everything by the same amount.” What does shrink mean?",
        opts: ["make something smaller", "make something clearer", "move something farther"],
        why: [
          "The map has to fit on paper, but nothing in the sentence says the map becomes easier to see; it becomes smaller.",
          "The land does not move; the sentence is about the map being a smaller copy of the land.",
        ],
        rat: "A map cannot be the same size as the land, so shrinking the land means making its picture smaller.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the scale to calculate",
        type: "choice",
        prompt:
          "Another map uses the same scale as the passage. The library is 6 centimeters from the school on that map. How far away is the library?",
        opts: ["30 kilometers", "11 kilometers", "6 kilometers"],
        why: [
          "That adds 5 to 6, but the scale tells you to multiply each centimeter by 5 kilometers.",
          "Six centimeters on the paper is not 6 kilometers; each centimeter stands for 5 kilometers.",
        ],
        rat: "Each centimeter stands for 5 kilometers, so 6 centimeters stands for 6 times 5, which is 30 kilometers.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that shows how to turn a map distance into a real distance.",
        evidence: ["p2"],
        rat: "Paragraph 2 gives the worked example: multiply 4 centimeters by 5 to get 20 kilometers.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "How does paragraph 2 connect to paragraph 1?",
        opts: [
          "It gives a worked example that uses the scale explained in paragraph 1.",
          "It disagrees with the scale that paragraph 1 introduced.",
          "It begins a new topic that has nothing to do with the scale.",
        ],
        why: [
          "Paragraph 2 uses the same scale, 1 centimeter to 5 kilometers, so it supports paragraph 1 and does not disagree.",
          "Paragraph 2 keeps the same scale and the same map, so the topic is the same as paragraph 1.",
        ],
        rat: "Paragraph 2 applies the scale from paragraph 1 to a real example, the museum that is 4 centimeters away.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt:
          "Map X has a scale of 1 centimeter to 1 kilometer. Map Y has a scale of 1 centimeter to 5 kilometers. Which statement does paragraph 4 support?",
        opts: [
          "Map X can show more small details because each centimeter covers less land.",
          "Map Y can show more small details because each centimeter covers more land.",
          "Both maps show exactly the same details because both have a scale.",
        ],
        why: [
          "A centimeter on Map Y covers more land, which leaves less room for small details, according to paragraph 4.",
          "Having a scale does not make maps show the same details; paragraph 4 says the scale is chosen for a purpose.",
        ],
        rat: "Paragraph 4 says a smaller distance for each centimeter makes small details easy to see, so Map X can show more of them.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain why neither the city bus map nor the country map is wrong. Use one detail from paragraph 4.",
        lookFor: [
          "A clear claim that both maps can be correct",
          "One accurate detail about scale or purpose from paragraph 4",
          "A reason that connects the detail to the claim",
        ],
        rubric: [
          "States that each map has a different purpose",
          "Uses an accurate detail from the text",
          "Explains how the scale fits the purpose",
        ],
        frame:
          "Neither map is wrong because ___. For example, the bus map ___, while the country map ___.",
        model:
          "Neither map is wrong because each one has a different job. The bus map uses a small distance for each centimeter, so streets and stops are easy to see, while the country map uses a larger distance and shows fewer small details.",
      },
    ],
    transfer: {
      prompt:
        "A scale drawing of a classroom uses 1 centimeter for every 50 centimeters of the real room. A desk is 3 centimeters long on the drawing. Explain how to find its real length and what that number means.",
      lookFor: [
        "Multiplies 3 by 50 to get 150 centimeters",
        "Says that each drawing centimeter stands for 50 real centimeters",
        "Names the unit in the answer",
      ],
      frame:
        "I multiply ___ by ___ because every centimeter on the drawing stands for ___. The desk is ___ long.",
    },
    guide: {
      mini: "Model the calculation in paragraph 2 on the board as a ratio table: 1 cm to 5 km, 4 cm to 20 km. Ask students what stays the same in each row.",
      discussion: [
        "How is a map scale like the ratios we use for recipes?",
        "Why might a mapmaker choose a different scale for a hiking trail than for a country?",
        "What does the scale 1:500,000 mean in kilometers?",
      ],
      misconception:
        "Students may add the scale number to the map distance instead of multiplying; a ratio table shows that every row is multiplied by the same number.",
      answerNotes: [
        "Question 3: 6 times 5 equals 30 kilometers; adding gives 11, a common error.",
        "Question 6: the smaller the distance per centimeter, the more detail a map can show.",
      ],
      model:
        "Neither map is wrong because each is designed for a different job. A bus map shows small details with a small distance per centimeter, and a country map covers much more land with a larger distance per centimeter.",
    },
    family: {
      en: "Read one paragraph at a time. Ask your student to explain how 4 centimeters on the map became 20 kilometers. You can talk in any language, then ask for one sentence in English.",
      es: "Lean un párrafo a la vez. Pida a su estudiante que explique cómo 4 centímetros en el mapa se convirtieron en 20 kilómetros. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      questions: [
        "What does one centimeter on the map stand for?",
        "How do you find the real distance from a map distance?",
      ],
    },
    connections: {
      write: "Write a paragraph that explains how to use a scale to find a real distance.",
      speak: "Explain aloud how 4 centimeters on a map became 20 kilometers.",
      listen: "Listen to a talk about ratios and compare the ideas.",
    },
  },
];

// Language World: The Science Exhibition. One original scenario per grade band, four linked tasks
// (Listening → Reading → Speaking → Writing). Authored content stays English (it is the language being
// practiced); interface text around it is bilingual in the view. Every check in `feedback` is a visible,
// explainable rule over the learner's own words — never a score.
//
// WIDA English Language Development Standards Framework, 2020 Edition: Standard 4, Language for Science.
// Key Language Uses are named per task only where the task genuinely calls for them.

const BAND_68 = {
  id: "clean-water",
  band: "6-8",
  title: "The Clean Water Exhibition",
  setting: "Harbor Middle School Science Exhibition · Room 114",
  summary:
    "Students built layered filters to clean muddy water. Hear the announcement, read an exhibit card, explain how the filter works, then write a recommendation for the school garden.",
  standard: "ELD Standard 4 · Language for Science (grades 6–8 cluster)",
  tasks: {
    listen: {
      domain: "Listening",
      klu: "Inform",
      objective: "I can identify key details (place, time, instructions) in a spoken announcement.",
      script: [
        "Good afternoon, visitors, and welcome to the Clean Water Exhibition.",
        "Please note one change to today's schedule.",
        "The water-filter demonstration has moved from the gym to the science lab, Room 114.",
        "It will begin at 2:15, right after the student poster talks.",
        "Each visitor will test one water sample, so please pick up a sample cup at the front table before you go.",
        "If you would like to vote for the most useful design, use the ballot box beside the exit.",
        "Thank you, and enjoy the exhibition.",
      ],
      questions: [
        {
          id: "where",
          prompt: "Where will the water-filter demonstration happen?",
          options: [
            {
              id: "a",
              text: "In the gym",
              why: "The gym is where it was first planned. Listen for “moved from … to …”: the new place comes after “to”.",
            },
            { id: "b", text: "In the science lab, Room 114", ok: true },
            {
              id: "c",
              text: "At the front table",
              why: "The front table is where you pick up a cup, not where the demonstration happens.",
            },
          ],
        },
        {
          id: "before",
          prompt: "What should visitors do before they go to the demonstration?",
          options: [
            {
              id: "a",
              text: "Vote at the ballot box",
              why: "Voting is optional, and the ballot box is beside the exit. Listen for the word “before”.",
            },
            {
              id: "b",
              text: "Watch the poster talks again",
              why: "The poster talks come first in the schedule, but the speaker does not ask visitors to watch them again.",
            },
            { id: "c", text: "Pick up a sample cup at the front table", ok: true },
          ],
        },
        {
          id: "time",
          prompt: "Why does the speaker say “2:15”?",
          options: [
            { id: "a", text: "It is when the demonstration begins", ok: true },
            {
              id: "b",
              text: "It is when the poster talks begin",
              why: "The demonstration begins right after the poster talks, so 2:15 is the demonstration's start time.",
            },
            {
              id: "c",
              text: "It is when the exhibition closes",
              why: "The announcement never says when the exhibition closes.",
            },
          ],
        },
      ],
      map: ["Gym", "Science lab · Room 114", "Front table", "Library", "Exit"],
      vocab: ["demonstration", "schedule", "sample", "ballot"],
    },
    read: {
      domain: "Reading",
      klu: "Explain",
      objective: "I can explain how a process works and find the sentence that proves a result.",
      cardTitle: "Exhibit 4 · How a Layered Filter Cleans Water",
      sentences: [
        "A layered filter is a column of materials that removes particles from dirty water.",
        "Water is poured into the top, where a layer of gravel traps leaves, twigs, and other large pieces.",
        "Next, the water seeps through coarse sand, which catches smaller particles such as soil.",
        "A final layer of fine sand slows the water down, so even tiny particles settle out.",
        "In our test, water that started out brown came out nearly clear after 6 minutes.",
        "However, a filter like this cannot remove germs, so the water must still be boiled before anyone drinks it.",
      ],
      questions: [
        {
          id: "main",
          kind: "choice",
          prompt: "What does the exhibit card mainly explain?",
          options: [
            { id: "a", text: "How each layer removes smaller and smaller particles", ok: true },
            {
              id: "b",
              text: "Why people should boil all water",
              why: "Boiling is mentioned once, at the end. Most sentences describe what each layer does.",
            },
            {
              id: "c",
              text: "How long it takes to build a filter",
              why: "The card gives a test time (6 minutes), not a building time.",
            },
          ],
        },
        {
          id: "result",
          kind: "evidence",
          prompt: "Select the sentence that best proves the filter worked in the students' test.",
          answer: 4,
          why: "Look for a sentence with a result you could measure or see: a colour change and a time.",
        },
        {
          id: "seeps",
          kind: "choice",
          prompt: "In sentence 3, what does “seeps” mean?",
          options: [
            {
              id: "a",
              text: "Splashes quickly",
              why: "The water is moving through sand. Sand slows water down; it does not make it splash.",
            },
            { id: "b", text: "Flows slowly through", ok: true },
            {
              id: "c",
              text: "Freezes",
              why: "Nothing in the card is cold. Think about how water moves through sand.",
            },
          ],
        },
        {
          id: "limit",
          kind: "evidence",
          prompt: "Select the sentence that shows a limit of this filter.",
          answer: 5,
          why: "A limit is something the filter cannot do. Look for “cannot” or “however”.",
        },
      ],
      diagram: [
        "Gravel · traps large pieces",
        "Coarse sand · catches soil",
        "Fine sand · tiny particles settle",
        "Clearer water",
      ],
      vocab: ["particles", "coarse", "settle", "evidence"],
    },
    speak: {
      domain: "Speaking",
      klu: "Explain",
      objective: "I can explain a process in order, using sequence words and evidence.",
      prompt:
        "A visitor asks: “How does this filter make the water clearer?” Explain the layers in order and use one piece of evidence from the test.",
      plan: [
        ["first", "What happens first?"],
        ["next", "What happens next?"],
        ["evidence", "What did the test show?"],
      ],
      frames: {
        A: [
          "First, the gravel traps ___.",
          "Next, the sand catches ___.",
          "As a result, the water came out ___ after ___.",
        ],
        B: [
          "The filter works in layers. First, ___. Next, ___.",
          "Because ___, the water ___.",
          "In the test, ___.",
        ],
        C: [
          "Start with how the water moves.",
          "Connect each layer to what it removes.",
          "End with evidence, and add one limit if you can.",
        ],
      },
      checks: [
        ["order", "I described the layers in order."],
        ["sequence", "I used sequence words (first, next, then, finally)."],
        ["cause", "I explained with because, so, or as a result."],
        ["evidence", "I used evidence from the test (brown to clear, 6 minutes)."],
      ],
      model:
        "First, the gravel traps big pieces like leaves. Next, the coarse sand catches soil, and the fine sand slows the water so tiny particles settle. As a result, the brown water came out nearly clear after six minutes.",
      improvements: [
        "Add a sequence word",
        "Add evidence from the test",
        "Add one limit of the filter",
      ],
      vocab: ["particles", "layer", "settle", "evidence"],
    },
    write: {
      domain: "Writing",
      klu: "Argue",
      objective:
        "I can state a claim, support it with evidence from sources, and answer a concern.",
      prompt:
        "Your class has $40 to build one filter for the school garden's rain barrel. The garden team will use the water for plants, not for drinking. Should they build the layered sand filter? Write a recommendation of 4–6 sentences: state your claim, give two reasons with evidence from the exhibition, and answer one concern.",
      transfer:
        "The art room needs cleaner water for rinsing paintbrushes. Should the art teacher use a layered sand filter? Write a recommendation of 4–6 sentences with a claim, evidence, and one concern.",
      organizer: [
        ["claim", "My claim (should / should not)"],
        ["reason1", "Reason 1 + evidence"],
        ["reason2", "Reason 2 + evidence"],
        ["concern", "A concern + my answer"],
      ],
      frames: {
        A: [
          "The garden team should ___ because ___.",
          "One reason is that ___. The exhibit shows ___.",
          "Some people may worry that ___. However, ___.",
        ],
        B: ["I recommend ___ because ___.", "For example, ___.", "Although ___, ___."],
        C: [],
      },
      minSentences: 4,
      feedback: [
        {
          id: "claim",
          label: "States a claim",
          test: "\\b(should|recommend|suggest|i think|i believe|the best)\\b",
          next: "Start with one clear claim: “The garden team should …”.",
        },
        {
          id: "reason",
          label: "Gives a reason",
          test: "\\b(because|since|so that|as a result|this means|which means)\\b",
          next: "Connect your claim to a reason with “because” or “as a result”.",
        },
        {
          id: "evidence",
          label: "Uses evidence from the exhibition",
          test: "(6|six) minutes|brown|clear|gravel|sand|particles|layers?|\\$40|forty dollars",
          next: "Add evidence you heard or read: the test result (brown to nearly clear in 6 minutes) or what a layer does.",
        },
        {
          id: "concern",
          label: "Answers a concern",
          test: "\\b(although|even though|however|but|some people|on the other hand)\\b[^.!?]*\\b(germs?|drink|drinking|boil|boiled|safe)\\b|\\b(germs?|drink|drinking|boil|boiled|safe)\\b[^.!?]*\\b(although|even though|however|but)\\b",
          next: "Answer the concern about germs: the filter cannot remove them, but the water is for plants, not for drinking.",
        },
        {
          id: "link",
          label: "Links ideas",
          test: "\\b(also|in addition|for example|for instance|another|finally|therefore)\\b",
          next: "Join your second reason with “also”, “in addition”, or “for example”.",
        },
      ],
      revision: [
        "Is my claim the first sentence?",
        "Does each reason have a piece of evidence?",
        "Did I answer the concern about germs?",
        "Did I use my own words instead of copying a whole sentence?",
      ],
      vocab: ["recommend", "evidence", "concern", "particles"],
    },
  },
};

const BAND_35 = {
  id: "seed-fair",
  band: "3-5",
  title: "The Seed Science Fair",
  setting: "Maple Elementary Science Fair · Library",
  summary:
    "Our class grew two bean plants, one in the light and one in the dark. Hear the announcement, read about the test, tell what happened in order, then write why one plant grew better.",
  standard: "ELD Standard 4 · Language for Science (grades 2–3 and 4–5 clusters)",
  tasks: {
    listen: {
      domain: "Listening",
      klu: "Inform",
      objective: "I can listen for where to go, what to bring, and what to do.",
      script: [
        "Hello, scientists! Welcome to the Seed Science Fair.",
        "The bean plant table is in the library today, not in the gym.",
        "Please go there after lunch.",
        "Bring your science notebook and one pencil.",
        "You will draw what you see.",
        "At the end, put your drawing in the blue basket.",
        "Have fun, scientists!",
      ],
      questions: [
        {
          id: "where",
          prompt: "Where is the bean plant table?",
          options: [
            { id: "a", text: "In the library", ok: true },
            {
              id: "b",
              text: "In the gym",
              why: "The speaker says “not in the gym”. Listen for the place right before “not”.",
            },
            {
              id: "c",
              text: "In the lunchroom",
              why: "Lunch is the time to go, after lunch. It is not the place.",
            },
          ],
        },
        {
          id: "bring",
          prompt: "What should you bring?",
          options: [
            {
              id: "a",
              text: "A lunch box",
              why: "Lunch comes before the fair. Listen for the word “bring”.",
            },
            { id: "b", text: "A science notebook and one pencil", ok: true },
            {
              id: "c",
              text: "The blue basket",
              why: "The blue basket is at the fair. You put your drawing in it.",
            },
          ],
        },
        {
          id: "end",
          prompt: "What do you do at the end?",
          options: [
            {
              id: "a",
              text: "Water the plants",
              why: "The speaker does not ask you to water anything. Listen for “at the end”.",
            },
            { id: "b", text: "Go back to the gym", why: "The gym is not part of the fair today." },
            { id: "c", text: "Put your drawing in the blue basket", ok: true },
          ],
        },
      ],
      map: ["Library", "Gym", "Lunchroom", "Classroom", "Blue basket", "Red basket"],
      vocab: ["scientist", "notebook", "basket", "library"],
    },
    read: {
      domain: "Reading",
      klu: "Explain",
      objective: "I can find the sentence that shows what happened and explain why.",
      cardTitle: "Our Bean Plant Test",
      sentences: [
        "We planted two bean seeds in two cups of soil.",
        "We put Cup A by a sunny window.",
        "We put Cup B in a dark closet.",
        "We gave both cups the same amount of water every day.",
        "After ten days, the plant in Cup A was tall and green.",
        "The plant in Cup B was short, thin, and yellow.",
        "Plants need light to grow strong and green.",
      ],
      questions: [
        {
          id: "main",
          kind: "choice",
          prompt: "What did the class want to find out?",
          options: [
            {
              id: "a",
              text: "Which cup is bigger",
              why: "The cups are the same. Think about what was different: the window or the closet.",
            },
            { id: "b", text: "If plants need light to grow", ok: true },
            {
              id: "c",
              text: "How to plant a seed",
              why: "The class did plant seeds, but the test is about light and dark.",
            },
          ],
        },
        {
          id: "result",
          kind: "evidence",
          prompt: "Select the sentence that shows what happened to the plant with light.",
          answer: 4,
          why: "Cup A had light. Find the sentence that tells how Cup A looked after ten days.",
        },
        {
          id: "thin",
          kind: "choice",
          prompt: "In sentence 6, what does “thin” mean?",
          options: [
            { id: "a", text: "Skinny, not wide", ok: true },
            {
              id: "b",
              text: "Very tall",
              why: "The same sentence says the plant was short. Thin tells how wide it was.",
            },
            { id: "c", text: "Wet", why: "Thin tells about size, not about water." },
          ],
        },
        {
          id: "fair",
          kind: "evidence",
          prompt: "Select the sentence that shows the test was fair.",
          answer: 3,
          why: "A fair test keeps everything the same except one thing. Which sentence says something was the same?",
        },
      ],
      diagram: [
        "Cup A · sunny window",
        "Cup B · dark closet",
        "Same water every day",
        "After ten days",
      ],
      vocab: ["soil", "closet", "fair", "light"],
    },
    speak: {
      domain: "Speaking",
      klu: "Narrate",
      objective: "I can tell what happened in order, using time words.",
      prompt:
        "Tell a partner what happened in the bean plant test, in order. Say what happened to both plants.",
      plan: [
        ["first", "What did we do first?"],
        ["next", "What did we do next?"],
        ["end", "What happened at the end?"],
      ],
      frames: {
        A: ["First, we ___.", "Next, we put ___.", "At the end, the plant with light was ___."],
        B: ["First, ___. Then, ___.", "After ten days, ___, but ___."],
        C: [
          "Tell it in order from the start.",
          "Say what happened to both plants.",
          "Use a science word.",
        ],
      },
      checks: [
        ["order", "I told it in order."],
        ["time", "I used time words (first, next, then, at the end)."],
        ["both", "I said what happened to both plants."],
        ["science", "I used a science word (seed, soil, light, grow)."],
      ],
      model:
        "First, we planted two bean seeds. Next, we put one cup by the window and one cup in the closet. Then we gave them the same water. At the end, the plant with light was tall and green, but the plant in the dark was yellow.",
      improvements: ["Add a time word", "Tell about both plants", "Use a science word"],
      vocab: ["seed", "soil", "light", "grow"],
    },
    write: {
      domain: "Writing",
      klu: "Explain",
      objective: "I can explain why something happened, using evidence.",
      prompt:
        "Why did the plant in Cup A grow better? Write 3–5 sentences. Tell what happened, explain why with “because”, and use evidence from the test.",
      transfer:
        "Your class wants to grow a sunflower. Where should you put it, and why? Write 3–5 sentences using what you learned from the bean test.",
      organizer: [
        ["what", "What happened"],
        ["why", "Why (because …)"],
        ["evidence", "Evidence from the test"],
      ],
      frames: {
        A: [
          "The plant in Cup A grew better because ___.",
          "It was by ___.",
          "The plant in Cup B was ___.",
        ],
        B: ["Cup A grew better because ___.", "For example, ___, but ___."],
        C: [],
      },
      minSentences: 3,
      feedback: [
        {
          id: "what",
          label: "Tells what happened",
          test: "\\b(grew|was|got|became)\\b",
          next: "Tell what happened: “The plant in Cup A grew tall and green.”",
        },
        {
          id: "reason",
          label: "Explains why",
          test: "\\b(because|so|since)\\b",
          next: "Explain why with “because”: “… because it had light.”",
        },
        {
          id: "evidence",
          label: "Uses evidence from the test",
          test: "window|sunny|sun|light|tall|green|yellow|dark|closet|ten days|10 days",
          next: "Add evidence: where Cup A was, or how the plants looked after ten days.",
        },
        {
          id: "compare",
          label: "Compares the two plants",
          test: "\\b(but|and|than|while)\\b[^.!?]*\\b(cup b|other plant|dark|closet|yellow|short)\\b|\\bcup b\\b",
          next: "Compare: tell how the plant in Cup B looked too.",
        },
      ],
      revision: [
        "Did I say which plant grew better?",
        "Did I use “because”?",
        "Did I use evidence from the test?",
        "Did I tell about both plants?",
      ],
      vocab: ["evidence", "light", "grow", "because"],
    },
  },
};

export const EXHIBITIONS = { "6-8": BAND_68, "3-5": BAND_35 };
export const STEP_ORDER = ["listen", "read", "speak", "write"];

/** Word supports: plain English, a Spanish bridge, and an example from the scenario. */
export const EXHIBITION_GLOSSARY = {
  demonstration: [
    "showing how something works, in front of people",
    "demostración",
    "The teacher gave a demonstration of the experiment.",
  ],
  schedule: [
    "a plan that shows when things happen",
    "horario",
    "Our class schedule shows lunch at noon.",
  ],
  sample: [
    "a small amount of something used for a test",
    "muestra",
    "The nurse looked at a sample under the microscope.",
  ],
  ballot: ["a paper or card you use to vote", "boleta", "Each student put a ballot in the box to vote."],
  particles: [
    "very small pieces of something",
    "partículas",
    "Dust is made of tiny particles.",
  ],
  seeps: ["flows slowly through small spaces", "se filtra", "The water seeps through the sand."],
  coarse: [
    "made of larger, rougher pieces",
    "grueso",
    "Coarse salt has bigger pieces than table salt.",
  ],
  settle: [
    "sink down and stay at the bottom",
    "asentarse",
    "Mud will settle to the bottom of a glass of water.",
  ],
  layer: ["one level of material on top of another", "capa", "The gravel layer is on top."],
  evidence: [
    "facts or results that show something is true",
    "evidencia",
    "A wet sidewalk is evidence that it rained.",
  ],
  recommend: ["say what someone should do and why", "recomendar", "I recommend the sand filter."],
  concern: [
    "a worry or a problem someone might have",
    "preocupación",
    "One concern is that the filter cannot remove germs.",
  ],
  scientist: [
    "a person who asks questions and tests ideas",
    "científico, científica",
    "Hello, scientists!",
  ],
  notebook: ["a small book for writing and drawing", "cuaderno", "I write my ideas in a notebook."],
  basket: ["a container to hold things", "canasta", "We keep apples in a basket."],
  library: ["a room with many books", "biblioteca", "We borrow books from the library."],
  soil: ["dirt that plants grow in", "tierra", "We planted seeds in soil."],
  closet: [
    "a small, dark room for keeping things",
    "clóset, armario",
    "We keep coats in the closet.",
  ],
  thin: ["skinny, not wide", "delgado", "The plant in Cup B was thin."],
  fair: [
    "the same for everyone; only one thing changes in a test",
    "justo",
    "In a fair race, everyone starts at the same line.",
  ],
  seed: [
    "the small part of a plant that a new plant grows from",
    "semilla",
    "We planted two bean seeds.",
  ],
  light: [
    "what the sun gives so we can see; plants use it to grow",
    "luz",
    "The sun gives us light.",
  ],
  grow: ["get bigger", "crecer", "The plant in Cup A grew tall."],
  because: ["a word that gives a reason", "porque", "It grew because it had light."],
};

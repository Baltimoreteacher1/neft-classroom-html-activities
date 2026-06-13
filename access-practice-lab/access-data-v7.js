/* access-data-v7.js — Catalog expansion (TPT-style store build-out).
   40 new activities across all five domains in varied formats.
   Merged additively by mergeV7() in app.js. */
window.ACCESS_LAB_V7 = {
 "appendActivities": {
  "Listening": {
   "A": [
    {
     "id": "v7-list-a-labsteps",
     "title": "Lab Safety Steps",
     "skill": "Following spoken multi-step directions",
     "time": "6 min",
     "wida": [
      "Entering: identify everyday words",
      "Emerging: follow short oral directions"
     ],
     "directions": "Listen to your teacher read the lab steps. Put the steps in the correct order.",
     "type": "order",
     "prompt": "Listen carefully. Put the four lab safety steps in the order you hear them.",
     "listenFor": [
      "first, next, then, last",
      "action words like put on, get",
      "one step at a time"
     ],
     "adminScript": "Listen. We will do a science lab. First, put on your safety goggles. Next, get your tray of materials. Then, mix the two liquids in the cup. Last, write what you see in your notebook. (Read once at a slow, clear pace, then repeat one time.)",
     "vocabulary": [
      [
       "goggles",
       "glasses that keep your eyes safe",
       "gafas_es: lentes que protegen los ojos"
      ],
      [
       "materials",
       "the things you use in a lab",
       "materiales_es: las cosas que usas en un laboratorio"
      ],
      [
       "mix",
       "to put things together and stir",
       "mezclar_es: juntar cosas y revolver"
      ]
     ],
     "frames": [
      "First, I ___.",
      "The last step is to ___."
     ],
     "correct": "Great listening! You put the lab steps in the right order.",
     "hint": "Listen for the words first, next, then, and last.",
     "support": "Show four picture cards (goggles, tray, cup, notebook). Point to each as you hear it.",
     "extension": "Tell a partner why goggles come first.",
     "teacher": {
      "use": "Use at the start of a science lab routine to build sequencing.",
      "function": "Sequencing oral directions with signal words.",
      "lower": "Give picture cards to arrange instead of text.",
      "onLevel": "Students order the text strips independently.",
      "challenge": "Have students add a fifth safe step of their own.",
      "noTech": "Print step strips; students physically sort on a desk.",
      "prompt": "Why is it important to do the steps in order?"
     }
    },
    {
     "id": "v7-list-a-weather",
     "title": "Today's Weather Report",
     "skill": "Listening for key details",
     "time": "5 min",
     "wida": [
      "Entering: match words to pictures",
      "Emerging: identify key words in speech"
     ],
     "directions": "Listen to the short weather report. Choose the best answer.",
     "type": "multipleChoice",
     "prompt": "What should students bring to school today?",
     "listenFor": [
      "weather words: rain, cold",
      "what to bring",
      "time words like today"
     ],
     "adminScript": "Good morning. Here is the weather for today. It is cold and cloudy. It will rain this afternoon. Please bring a jacket and an umbrella to school today. (Read slowly twice.)",
     "vocabulary": [
      [
       "cloudy",
       "the sky is full of clouds",
       "nublado_es: el cielo lleno de nubes"
      ],
      [
       "umbrella",
       "a thing you hold to stay dry in rain",
       "paraguas_es: algo que usas para no mojarte"
      ],
      [
       "jacket",
       "a light coat you wear when it is cold",
       "chaqueta_es: un abrigo ligero para el frío"
      ]
     ],
     "frames": [
      "Today the weather is ___.",
      "I should bring a ___."
     ],
     "options": [
      {
       "id": "a",
       "text": "A jacket and an umbrella",
       "visual": "umbrella"
      },
      {
       "id": "b",
       "text": "Sunglasses and water",
       "visual": "sun"
      },
      {
       "id": "c",
       "text": "A swimsuit and a towel",
       "visual": "swim"
      },
      {
       "id": "d",
       "text": "A hat and shorts",
       "visual": "hat"
      }
     ],
     "answer": "a",
     "correct": "Yes! It is cold and rainy, so a jacket and umbrella are best.",
     "hint": "Listen for the weather words and what the speaker says to bring.",
     "support": "Pre-teach rain and cold with picture cards before listening.",
     "extension": "Tell what you would bring on a hot, sunny day.",
     "teacher": {
      "use": "Use during morning meeting to practice real-life listening.",
      "function": "Identifying key details from an informational announcement.",
      "lower": "Offer two answer choices instead of four.",
      "onLevel": "Use all four choices as written.",
      "challenge": "Ask students to retell the full weather report.",
      "noTech": "Read aloud; students point to the correct picture on a sheet.",
      "prompt": "How does the weather change your clothes choice?"
     }
    },
    {
     "id": "v7-list-a-cafeteria",
     "title": "Cafeteria Rules",
     "skill": "Listening to sort information",
     "time": "6 min",
     "wida": [
      "Entering: classify familiar words",
      "Emerging: sort key ideas heard"
     ],
     "directions": "Listen to the cafeteria rules. Sort each action into Do or Don't.",
     "type": "sort",
     "prompt": "Listen to the rules. Sort each action under Do or Don't.",
     "listenFor": [
      "should and should not",
      "rule words: quiet, clean",
      "action verbs"
     ],
     "adminScript": "Here are our cafeteria rules. You should walk to your table. You should clean your space when you finish. You should not run in the line. You should not throw food. (Read slowly, repeat once.)",
     "vocabulary": [
      [
       "cafeteria",
       "the room where students eat lunch",
       "cafetería_es: el cuarto donde se come"
      ],
      [
       "clean",
       "to make a space neat and free of mess",
       "limpiar_es: dejar un lugar ordenado"
      ],
      [
       "rule",
       "a thing you must or must not do",
       "regla_es: algo que debes o no debes hacer"
      ]
     ],
     "frames": [
      "You should ___.",
      "You should not ___."
     ],
     "categories": [
      "Do",
      "Don't"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Walk to your table",
       "answer": "Do"
      },
      {
       "id": "s2",
       "text": "Clean your space",
       "answer": "Do"
      },
      {
       "id": "s3",
       "text": "Run in the line",
       "answer": "Don't"
      },
      {
       "id": "s4",
       "text": "Throw food",
       "answer": "Don't"
      }
     ],
     "correct": "Nice work! You sorted the cafeteria rules correctly.",
     "hint": "Listen for should (Do) and should not (Don't).",
     "support": "Use thumbs up for Do and thumbs down for Don't as you read.",
     "extension": "Add one more cafeteria rule and tell which group it goes in.",
     "teacher": {
      "use": "Use to teach school routines early in the year.",
      "function": "Classifying rules by the modal verbs should / should not.",
      "lower": "Sort only two items at first.",
      "onLevel": "Sort all four items as written.",
      "challenge": "Students write a new rule for each column.",
      "noTech": "Use a two-column pocket chart with action cards.",
      "prompt": "Which rule is most important to you? Why?"
     }
    },
    {
     "id": "v7-list-a-plantparts",
     "title": "Parts of a Plant",
     "skill": "Listening to fill missing words",
     "time": "5 min",
     "wida": [
      "Entering: recognize science nouns",
      "Emerging: complete a heard sentence"
     ],
     "directions": "Listen to the sentences about plants. Choose the word that fills each blank.",
     "type": "cloze",
     "prompt": "Listen and choose the correct word for each blank.",
     "listenFor": [
      "plant part names",
      "what each part does",
      "key nouns: roots, leaves"
     ],
     "adminScript": "Let's talk about plants. The roots hold the plant in the ground and drink water. The stem holds the plant up tall. The leaves use sunlight to make food. (Read slowly, then repeat.)",
     "vocabulary": [
      [
       "roots",
       "the part of a plant under the ground",
       "raíces_es: la parte de la planta bajo tierra"
      ],
      [
       "stem",
       "the part that holds the plant up",
       "tallo_es: la parte que sostiene la planta"
      ],
      [
       "leaves",
       "the flat green parts that make food",
       "hojas_es: las partes verdes que hacen comida"
      ]
     ],
     "frames": [
      "The ___ drink water.",
      "The leaves make ___."
     ],
     "segments": [
      {
       "text": "The "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "roots",
        "options": [
         "roots",
         "leaves",
         "stem"
        ]
       }
      },
      {
       "text": " hold the plant in the ground. The "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "stem",
        "options": [
         "stem",
         "roots",
         "flower"
        ]
       }
      },
      {
       "text": " holds the plant up. The leaves make "
      },
      {
       "blank": {
        "id": "b3",
        "answer": "food",
        "options": [
         "food",
         "water",
         "sand"
        ]
       }
      },
      {
       "text": " using sunlight."
      }
     ],
     "correct": "Excellent! You filled in the plant parts correctly.",
     "hint": "Listen for what each plant part does.",
     "support": "Show a labeled plant diagram while you read.",
     "extension": "Draw a plant and label the three parts in English.",
     "teacher": {
      "use": "Use in a science unit on living things.",
      "function": "Completing cloze sentences from oral science input.",
      "lower": "Provide a word bank picture for each blank.",
      "onLevel": "Use the dropdown options as written.",
      "challenge": "Students explain what would happen with no roots.",
      "noTech": "Students write words on a printed sentence frame.",
      "prompt": "Which plant part do you think is most important?"
     }
    }
   ],
   "B": [
    {
     "id": "v7-list-b-watercycle",
     "title": "The Water Cycle Explained",
     "skill": "Sequencing a spoken process",
     "time": "8 min",
     "wida": [
      "Developing: order steps in a process",
      "Expanding: track academic sequence language"
     ],
     "directions": "Listen to the explanation of the water cycle. Put the four stages in the order described.",
     "type": "order",
     "prompt": "Listen to the explanation. Put the stages of the water cycle in the correct order.",
     "listenFor": [
      "sequence words: first, then, after that, finally",
      "process verbs: evaporate, condense",
      "cause and effect links"
     ],
     "adminScript": "Let me explain how the water cycle moves water around our planet. First, heat from the sun causes water in oceans and lakes to evaporate, turning into water vapor that rises into the air. Then, as that vapor cools high in the sky, it condenses into tiny droplets that form clouds. After that, when the droplets grow heavy enough, precipitation falls as rain or snow. Finally, that water collects in rivers and oceans, and the cycle begins again. (Read at a steady, natural pace, then repeat once.)",
     "vocabulary": [
      [
       "evaporate",
       "to change from liquid water into vapor",
       "evaporar_es: pasar de agua líquida a vapor"
      ],
      [
       "condense",
       "to change from vapor back into liquid drops",
       "condensar_es: pasar de vapor a gotas líquidas"
      ],
      [
       "precipitation",
       "water that falls as rain, snow, or hail",
       "precipitación_es: agua que cae como lluvia o nieve"
      ]
     ],
     "frames": [
      "First, the sun causes water to ___.",
      "After the vapor cools, it ___ into clouds."
     ],
     "items": [
      {
       "id": "i1",
       "text": "The sun heats water and it evaporates into vapor."
      },
      {
       "id": "i2",
       "text": "The vapor cools and condenses into clouds."
      },
      {
       "id": "i3",
       "text": "Precipitation falls as rain or snow."
      },
      {
       "id": "i4",
       "text": "Water collects in rivers and oceans again."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "correct": "Well done! You traced the water cycle in the correct order.",
     "hint": "Listen for first, then, after that, and finally.",
     "support": "Provide a labeled water cycle diagram to follow along.",
     "extension": "Explain to a partner what powers the whole cycle.",
     "teacher": {
      "use": "Use in an Earth science unit on weather and water.",
      "function": "Sequencing a multi-stage academic process from oral text.",
      "lower": "Give a diagram with arrows already drawn.",
      "onLevel": "Students order the four text statements.",
      "challenge": "Students add the term 'collection' and explain it.",
      "noTech": "Sort sentence strips into a cycle on the desk.",
      "prompt": "Why is the water cycle called a cycle and not a line?"
     }
    },
    {
     "id": "v7-list-b-branches",
     "title": "Three Branches of Government",
     "skill": "Listening for multiple key details",
     "time": "8 min",
     "wida": [
      "Developing: identify several details",
      "Expanding: connect ideas across a passage"
     ],
     "directions": "Listen to the explanation of the U.S. government. Select ALL statements that are true.",
     "type": "multiSelect",
     "prompt": "Listen carefully. Select all the statements that are TRUE based on what you heard.",
     "listenFor": [
      "branch names and their jobs",
      "who makes, enforces, judges laws",
      "number words: three"
     ],
     "adminScript": "The United States government has three branches that share power. The legislative branch, called Congress, writes and passes new laws. The executive branch, led by the President, carries out and enforces those laws. The judicial branch, made up of the courts, decides what the laws mean. This system keeps any one branch from becoming too powerful. (Read at a steady pace, then repeat once.)",
     "vocabulary": [
      [
       "legislative",
       "the branch that makes laws",
       "legislativo_es: la rama que hace las leyes"
      ],
      [
       "executive",
       "the branch that carries out laws",
       "ejecutivo_es: la rama que ejecuta las leyes"
      ],
      [
       "judicial",
       "the branch that explains the laws",
       "judicial_es: la rama que interpreta las leyes"
      ]
     ],
     "frames": [
      "The ___ branch makes the laws.",
      "The judicial branch decides what laws ___."
     ],
     "options": [
      {
       "id": "a",
       "text": "Congress writes and passes new laws."
      },
      {
       "id": "b",
       "text": "The President carries out and enforces laws."
      },
      {
       "id": "c",
       "text": "The courts write new laws."
      },
      {
       "id": "d",
       "text": "The three branches share power."
      }
     ],
     "answers": [
      "a",
      "b",
      "d"
     ],
     "correct": "Excellent listening! You found all three true statements.",
     "hint": "One choice swaps the job of a branch. Listen for who does what.",
     "support": "Provide a chart with each branch and its job to follow.",
     "extension": "Explain why sharing power is called checks and balances.",
     "teacher": {
      "use": "Use in a civics or social studies unit.",
      "function": "Identifying multiple accurate details from informational input.",
      "lower": "Reduce to three options with one distractor.",
      "onLevel": "Use all four options as written.",
      "challenge": "Students match a real news event to a branch.",
      "noTech": "Read aloud; students mark true/false on a paper list.",
      "prompt": "Which branch do you think has the hardest job? Why?"
     }
    },
    {
     "id": "v7-list-b-ecosystem",
     "title": "Energy in an Ecosystem",
     "skill": "Listening to identify a main idea",
     "time": "8 min",
     "wida": [
      "Developing: locate a stated main idea",
      "Expanding: distinguish main idea from detail"
     ],
     "directions": "Listen to the passage. Click the sentence that best states the main idea.",
     "type": "hotText",
     "prompt": "Listen to the passage about ecosystems. Click the ONE sentence that gives the main idea.",
     "listenFor": [
      "topic sentence cues",
      "words like all living things, energy",
      "general vs. specific statements"
     ],
     "adminScript": "Every ecosystem depends on a flow of energy that connects all living things. It starts with the sun, which gives energy to plants called producers. Animals known as herbivores eat those plants to gain energy. Then predators eat the herbivores, passing the energy along. When any living thing dies, decomposers like fungi return nutrients to the soil. (Read at a steady pace, then repeat once.)",
     "vocabulary": [
      [
       "producer",
       "a living thing that makes its own food",
       "productor_es: ser vivo que hace su comida"
      ],
      [
       "herbivore",
       "an animal that eats only plants",
       "herbívoro_es: animal que solo come plantas"
      ],
      [
       "decomposer",
       "a living thing that breaks down dead matter",
       "descomponedor_es: ser que descompone lo muerto"
      ]
     ],
     "frames": [
      "The main idea is that ___.",
      "One detail that supports it is ___."
     ],
     "passageTitle": "Energy in an Ecosystem",
     "passage": [
      "Every ecosystem depends on a flow of energy that connects all living things.",
      "It starts with the sun, which gives energy to plants called producers.",
      "Animals known as herbivores eat those plants to gain energy.",
      "When any living thing dies, decomposers return nutrients to the soil."
     ],
     "sentences": [
      {
       "id": "s1",
       "text": "Every ecosystem depends on a flow of energy that connects all living things."
      },
      {
       "id": "s2",
       "text": "It starts with the sun, which gives energy to plants called producers."
      },
      {
       "id": "s3",
       "text": "Animals known as herbivores eat those plants to gain energy."
      },
      {
       "id": "s4",
       "text": "When any living thing dies, decomposers return nutrients to the soil."
      }
     ],
     "answers": [
      "s1"
     ],
     "correct": "Yes! That sentence states the big idea; the others are details.",
     "hint": "The main idea is the broadest sentence; the rest are examples.",
     "support": "Remind students the main idea often comes first and is general.",
     "extension": "Students name two supporting details from the passage.",
     "teacher": {
      "use": "Use in a life science unit on food chains and webs.",
      "function": "Distinguishing a stated main idea from supporting details.",
      "lower": "Highlight the first and last sentences as the only choices.",
      "onLevel": "Students choose among all four sentences.",
      "challenge": "Students rewrite the main idea in their own words.",
      "noTech": "Read aloud; students underline the main idea on a handout.",
      "prompt": "How would the ecosystem change if producers disappeared?"
     }
    },
    {
     "id": "v7-list-b-mathtalk",
     "title": "Math Talk: Comparing Rates",
     "skill": "Listening to academic reasoning",
     "time": "8 min",
     "wida": [
      "Developing: follow a spoken explanation",
      "Expanding: interpret quantitative language"
     ],
     "directions": "Listen to two students compare prices. Then explain in writing who got the better deal and why.",
     "type": "constructed",
     "prompt": "Listen to the math talk. Explain who found the better unit rate and how you know.",
     "listenFor": [
      "unit rate per bottle",
      "which price is lower",
      "the word because for reasoning"
     ],
     "adminScript": "Two students are shopping for juice. Maria says a 6-pack of juice costs 3 dollars, so that is 50 cents per bottle. Daniel says a 10-pack costs 4 dollars, so that is 40 cents per bottle. They want to find the better deal. Maria argues the bigger pack is cheaper for each bottle because 40 cents is less than 50 cents. (Read at a steady pace, then repeat once.)",
     "vocabulary": [
      [
       "unit rate",
       "the cost for one single item",
       "tasa unitaria_es: el costo por un solo artículo"
      ],
      [
       "per",
       "for each one",
       "por_es: por cada uno"
      ],
      [
       "compare",
       "to look at two things to see which is more",
       "comparar_es: ver dos cosas para saber cuál es más"
      ]
     ],
     "frames": [
      "The better deal is the ___ pack.",
      "I know because ___ cents is less than ___ cents."
     ],
     "responseLabel": "Explain who got the better deal and why.",
     "responsePlaceholder": "The better deal is the ___ pack because ___.",
     "correct": "Strong reasoning! The 10-pack is the better unit rate at 40 cents each.",
     "hint": "Compare the cost of one bottle, not the whole pack.",
     "support": "Write both unit rates on the board: 50 cents vs 40 cents.",
     "extension": "Find the cost per bottle if a 12-pack were 5 dollars.",
     "teacher": {
      "use": "Use during a ratios and proportional reasoning unit.",
      "function": "Interpreting and explaining quantitative reasoning from oral input.",
      "lower": "Give a sentence frame and the two numbers to compare.",
      "onLevel": "Students write a two-sentence explanation.",
      "challenge": "Students compute and compare a third unit rate.",
      "noTech": "Students explain aloud to a partner, then write one sentence.",
      "prompt": "Why is comparing the price of one bottle more fair?"
     }
    }
   ]
  },
  "Reading": {
   "A": [
    {
     "id": "v7-read-a-class-pet",
     "title": "Our Class Pet",
     "skill": "Read for key details in a short narrative",
     "time": "6 min",
     "wida": [
      "Identify key details in short illustrated text",
      "Match words to meaning"
     ],
     "directions": "Read the short story. Then choose the best answer.",
     "type": "multipleChoice",
     "prompt": "Why was the class happy at the end of the story?",
     "readFor": [
      "who is in the story",
      "what the class got",
      "how the class felt"
     ],
     "vocabulary": [
      [
       "pet",
       "an animal you keep and care for",
       "mascota: un animal que cuidas en casa o clase"
      ],
      [
       "cage",
       "a box with bars to keep an animal safe",
       "jaula: una caja con barras para un animal"
      ],
      [
       "feed",
       "to give food to someone or something",
       "alimentar: dar comida a alguien o algo"
      ]
     ],
     "frames": [
      "The class got a ___.",
      "At the end, the class felt ___."
     ],
     "passageTitle": "Our Class Pet",
     "passage": [
      "Room 12 got a new class pet.",
      "It was a small brown hamster named Nibbles.",
      "The students made a clean cage for Nibbles.",
      "Each day, two students feed him and give him fresh water.",
      "On Friday, Nibbles ran on his wheel for the first time.",
      "The whole class clapped and smiled."
     ],
     "options": [
      {
       "id": "a",
       "text": "They got a new class pet named Nibbles."
      },
      {
       "id": "b",
       "text": "They went home early."
      },
      {
       "id": "c",
       "text": "They had a math test."
      }
     ],
     "answer": "a",
     "correct": "Yes! The class was happy because they got a new class pet named Nibbles.",
     "hint": "Look at the first sentence and the last sentence.",
     "support": "The pet is a hamster. A hamster is a small animal. The class got the pet, so they were happy.",
     "extension": "Draw Nibbles in his cage and label three things he needs.",
     "teacher": {
      "use": "Warm-up to build confidence reading a short narrative for the main idea.",
      "function": "Identifying central message in a simple story.",
      "lower": "Read the passage aloud and point to the pet's name.",
      "onLevel": "Students read silently, then justify their choice with one sentence.",
      "challenge": "Ask students to retell the story in 3 sentences using past tense.",
      "noTech": "Print the story; students circle the answer and underline the proof sentence.",
      "prompt": "What is one thing the class did to take care of Nibbles?"
     }
    },
    {
     "id": "v7-read-a-water-cycle-evidence",
     "title": "Where Does Rain Come From?",
     "skill": "Cite text evidence in an informational text",
     "time": "7 min",
     "wida": [
      "Locate a supporting sentence in informational text",
      "Connect cause and effect"
     ],
     "directions": "Read the short text about the water cycle. Click the ONE sentence that tells why clouds form.",
     "type": "hotText",
     "prompt": "Click the sentence that explains why clouds form in the sky.",
     "readFor": [
      "how water moves",
      "why clouds form",
      "what makes rain"
     ],
     "vocabulary": [
      [
       "evaporate",
       "when water turns into a gas and rises up",
       "evaporar: cuando el agua se convierte en gas y sube"
      ],
      [
       "cloud",
       "tiny drops of water floating in the sky",
       "nube: gotas pequeñas de agua en el cielo"
      ],
      [
       "rain",
       "water that falls from clouds",
       "lluvia: agua que cae de las nubes"
      ]
     ],
     "frames": [
      "The sun makes water ___.",
      "Clouds form when ___."
     ],
     "passageTitle": "Where Does Rain Come From?",
     "passage": [
      "The sun heats the water in lakes and rivers.",
      "The warm water rises into the air as a gas.",
      "High in the sky, the gas cools and turns back into tiny drops.",
      "These tiny drops join together to make clouds.",
      "When the clouds get heavy, the water falls as rain."
     ],
     "sentences": [
      {
       "id": "s1",
       "text": "The sun heats the water in lakes and rivers."
      },
      {
       "id": "s2",
       "text": "The warm water rises into the air as a gas."
      },
      {
       "id": "s3",
       "text": "High in the sky, the gas cools and turns back into tiny drops."
      },
      {
       "id": "s4",
       "text": "These tiny drops join together to make clouds."
      },
      {
       "id": "s5",
       "text": "When the clouds get heavy, the water falls as rain."
      }
     ],
     "answers": [
      "s4"
     ],
     "correct": "Yes! That sentence shows clouds form when the tiny drops join together.",
     "hint": "Find the sentence with the word \"clouds\" that tells how they are made.",
     "support": "Tiny drops of water join together. When they join, they make a cloud. That sentence is the answer.",
     "extension": "Number the sentences 1-5 to show the order of the water cycle.",
     "teacher": {
      "use": "Introduce text-evidence skills with a familiar science topic.",
      "function": "Citing evidence to answer a cause question.",
      "lower": "Highlight the word \"clouds\" in the passage before students choose.",
      "onLevel": "Students choose the sentence and explain why the others are wrong.",
      "challenge": "Have students cite a second sentence that supports how rain forms.",
      "noTech": "Print the text; students underline the evidence sentence in color.",
      "prompt": "Which sentence proves how clouds are made? Read it aloud."
     }
    },
    {
     "id": "v7-read-a-recess-sort",
     "title": "Fact or Opinion: School Recess",
     "skill": "Sort facts and opinions",
     "time": "6 min",
     "wida": [
      "Distinguish fact from opinion",
      "Categorize short statements"
     ],
     "directions": "Read each sentence about recess. Sort it into Fact or Opinion.",
     "type": "sort",
     "prompt": "Is each sentence a Fact (you can prove it) or an Opinion (what someone thinks)?",
     "readFor": [
      "what can be proven",
      "what is a feeling",
      "signal words like best or fun"
     ],
     "vocabulary": [
      [
       "fact",
       "something true that you can prove",
       "hecho: algo verdadero que se puede probar"
      ],
      [
       "opinion",
       "what a person thinks or feels",
       "opinión: lo que una persona piensa o siente"
      ],
      [
       "recess",
       "a break time to play at school",
       "recreo: tiempo de descanso para jugar en la escuela"
      ]
     ],
     "frames": [
      "This sentence is a ___ because I can prove it.",
      "This sentence is an ___ because it tells a feeling."
     ],
     "categories": [
      "Fact",
      "Opinion"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Recess at our school is 20 minutes long.",
       "answer": "Fact"
      },
      {
       "id": "s2",
       "text": "Recess is the best part of the day.",
       "answer": "Opinion"
      },
      {
       "id": "s3",
       "text": "Students play on the field and the basketball court.",
       "answer": "Fact"
      },
      {
       "id": "s4",
       "text": "Everyone should get a longer recess.",
       "answer": "Opinion"
      }
     ],
     "correct": "Nice sorting! Facts can be checked and proven; opinions tell what someone thinks or wants.",
     "hint": "Words like best and should usually show an opinion.",
     "support": "A fact can be checked, like a clock or a number. An opinion tells what someone likes or wants.",
     "extension": "Write one new fact and one new opinion about your school.",
     "teacher": {
      "use": "Center activity to practice fact vs. opinion before persuasive reading.",
      "function": "Categorizing statements by type.",
      "lower": "Pre-read each sentence aloud and underline signal words.",
      "onLevel": "Students sort independently and explain one choice.",
      "challenge": "Students rewrite an opinion as a fact and a fact as an opinion.",
      "noTech": "Cut the sentences into strips; students place them under two header cards.",
      "prompt": "How do you know s2 is an opinion and not a fact?"
     }
    },
    {
     "id": "v7-read-a-morning-cloze",
     "title": "A Firefighter's Morning",
     "skill": "Use context to choose the right word",
     "time": "6 min",
     "wida": [
      "Use context clues to complete sentences",
      "Read for sequence of a daily routine"
     ],
     "directions": "Read the paragraph. Choose the best word for each blank.",
     "type": "cloze",
     "prompt": "Pick the word that makes the most sense in each blank.",
     "readFor": [
      "the order of the morning",
      "what the firefighter does",
      "words that fit the sentence"
     ],
     "vocabulary": [
      [
       "station",
       "the building where firefighters work",
       "estación: el edificio donde trabajan los bomberos"
      ],
      [
       "alarm",
       "a loud sound that warns of danger",
       "alarma: un sonido fuerte que avisa de un peligro"
      ],
      [
       "equipment",
       "the tools needed for a job",
       "equipo: las herramientas que se necesitan para un trabajo"
      ]
     ],
     "frames": [
      "First, the firefighter ___.",
      "When the alarm rings, she ___."
     ],
     "passageTitle": "A Firefighter's Morning",
     "segments": [
      {
       "text": "Every morning, Maria arrives at the fire "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "station",
        "options": [
         "station",
         "ocean",
         "garden"
        ]
       }
      },
      {
       "text": ". She checks her "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "equipment",
        "options": [
         "equipment",
         "breakfast",
         "homework"
        ]
       }
      },
      {
       "text": " to make sure it is ready. Suddenly, the "
      },
      {
       "blank": {
        "id": "b3",
        "answer": "alarm",
        "options": [
         "alarm",
         "pillow",
         "flower"
        ]
       }
      },
      {
       "text": " rings loudly. Maria and her team rush to the truck to "
      },
      {
       "blank": {
        "id": "b4",
        "answer": "help",
        "options": [
         "help",
         "sleep",
         "paint"
        ]
       }
      },
      {
       "text": " people in need."
      }
     ],
     "correct": "Great work! Each word fits the firefighter's morning and keeps the story making sense.",
     "hint": "Read the whole sentence first, then try each word in the blank.",
     "support": "A firefighter works at a station. The loud sound is an alarm. Firefighters help people.",
     "extension": "Add one more sentence telling what Maria does after she helps.",
     "teacher": {
      "use": "Build context-clue strategy with a high-interest career text.",
      "function": "Selecting words that fit meaning and sequence.",
      "lower": "Cover the wrong options and read each sentence with only the correct word.",
      "onLevel": "Students complete the cloze and reread for fluency.",
      "challenge": "Students explain why each wrong word does not fit.",
      "noTech": "Print with a word bank; students write words in the blanks.",
      "prompt": "Which clue word helped you choose 'alarm'?"
     }
    }
   ],
   "B": [
    {
     "id": "v7-read-b-monarch-evidence",
     "title": "The Monarch's Long Journey",
     "skill": "Cite the strongest evidence in an informational text",
     "time": "9 min",
     "wida": [
      "Identify the sentence that best supports a claim",
      "Analyze evidence in academic text"
     ],
     "directions": "Read the passage about monarch butterflies. Click the ONE sentence that best supports the idea that migration is dangerous for monarchs.",
     "type": "hotText",
     "prompt": "Click the sentence that gives the BEST evidence that the monarch's migration is dangerous.",
     "readFor": [
      "why monarchs migrate",
      "what dangers they face",
      "how far they travel"
     ],
     "vocabulary": [
      [
       "migration",
       "a long trip animals take to find better weather or food",
       "migración: un viaje largo que hacen los animales para buscar mejor clima o comida"
      ],
      [
       "generation",
       "a group born around the same time",
       "generación: un grupo nacido en la misma época"
      ],
      [
       "habitat",
       "the natural home of a plant or animal",
       "hábitat: el hogar natural de una planta o animal"
      ]
     ],
     "frames": [
      "One danger monarchs face is ___.",
      "The best evidence is the sentence about ___ because ___."
     ],
     "passageTitle": "The Monarch's Long Journey",
     "passage": [
      "Each fall, monarch butterflies fly south from Canada and the United States to warm forests in Mexico.",
      "This trip, called migration, can be more than 3,000 miles long.",
      "No single butterfly lives long enough to make the whole round trip, so it takes several generations.",
      "Along the way, storms, cold nights, and a lack of flowers can kill many of the travelers.",
      "When they finally reach Mexico, millions of monarchs cover the trees like orange blankets."
     ],
     "sentences": [
      {
       "id": "s1",
       "text": "Each fall, monarch butterflies fly south from Canada and the United States to warm forests in Mexico."
      },
      {
       "id": "s2",
       "text": "This trip, called migration, can be more than 3,000 miles long."
      },
      {
       "id": "s3",
       "text": "No single butterfly lives long enough to make the whole round trip, so it takes several generations."
      },
      {
       "id": "s4",
       "text": "Along the way, storms, cold nights, and a lack of flowers can kill many of the travelers."
      },
      {
       "id": "s5",
       "text": "When they finally reach Mexico, millions of monarchs cover the trees like orange blankets."
      }
     ],
     "answers": [
      "s4"
     ],
     "correct": "Yes! That sentence names the dangers—storms, cold nights, and no flowers—that can kill the travelers.",
     "hint": "Which sentence names things that can harm or kill the butterflies?",
     "support": "Dangerous means something can cause harm. Look for the sentence that names storms, cold, and no flowers killing the travelers.",
     "extension": "Find a second sentence that shows the journey is difficult but not deadly, and explain the difference.",
     "teacher": {
      "use": "Practice selecting the strongest of several plausible evidence sentences.",
      "function": "Evaluating and citing the best textual evidence for a claim.",
      "lower": "Define 'dangerous' and have students underline harm words first.",
      "onLevel": "Students cite s4 and explain why s2 (distance) is weaker support.",
      "challenge": "Students rank all five sentences from strongest to weakest evidence of danger.",
      "noTech": "Print the passage; students box the best evidence and annotate the margin.",
      "prompt": "Why is the sentence about storms stronger evidence than the sentence about distance?"
     }
    },
    {
     "id": "v7-read-b-revolution-multiselect",
     "title": "Causes of the American Revolution",
     "skill": "Identify multiple supporting details",
     "time": "10 min",
     "wida": [
      "Select multiple details that support a main idea",
      "Read complex social studies text for cause and effect"
     ],
     "directions": "Read the passage. Then select ALL the reasons the colonists were angry with Britain.",
     "type": "multiSelect",
     "prompt": "Which TWO reasons does the text give for why the colonists were angry with Britain? Select two.",
     "readFor": [
      "what Britain did",
      "how colonists reacted",
      "reasons for the conflict"
     ],
     "vocabulary": [
      [
       "colonist",
       "a person who lived in the American colonies",
       "colono: una persona que vivía en las colonias americanas"
      ],
      [
       "tax",
       "money people must pay to a government",
       "impuesto: dinero que las personas deben pagar al gobierno"
      ],
      [
       "represent",
       "to speak or act for a group of people",
       "representar: hablar o actuar por un grupo de personas"
      ]
     ],
     "frames": [
      "The colonists were angry because ___.",
      "Another reason for the conflict was ___."
     ],
     "passageTitle": "Causes of the American Revolution",
     "passage": [
      "In the 1760s, Britain needed money after a long and costly war.",
      "To raise money, Britain placed new taxes on goods like paper, glass, and tea in the American colonies.",
      "The colonists were furious because they had no representatives in the British government to speak for them.",
      "They used the phrase 'no taxation without representation' to protest these unfair rules.",
      "Britain also sent soldiers to live in the colonies, and colonists were sometimes forced to house and feed them.",
      "These growing tensions finally led to war in 1775."
     ],
     "options": [
      {
       "id": "a",
       "text": "Britain placed new taxes on goods without giving colonists representatives."
      },
      {
       "id": "b",
       "text": "Britain forced colonists to house and feed British soldiers."
      },
      {
       "id": "c",
       "text": "The colonists wanted to move back to Britain."
      },
      {
       "id": "d",
       "text": "Britain gave the colonists too much free land."
      }
     ],
     "answers": [
      "a",
      "b"
     ],
     "correct": "Correct! Taxes without representation and being forced to house soldiers both made the colonists angry.",
     "hint": "Look for the sentences about taxes/representation and about soldiers living in colonists' homes.",
     "support": "Two problems made colonists angry: taxes with no one to speak for them, and being forced to house soldiers. Those are answers a and b.",
     "extension": "Explain how 'no taxation without representation' connects to choice a in your own words.",
     "teacher": {
      "use": "Build evidence-gathering across a multi-paragraph social studies text.",
      "function": "Selecting multiple supporting details for a main idea.",
      "lower": "Chunk the passage; read one paragraph at a time and check for a reason.",
      "onLevel": "Students select both answers and underline the supporting sentence for each.",
      "challenge": "Students add a third valid grievance and cite a sentence that hints at it.",
      "noTech": "Print with checkboxes; students mark two and write the line number proof.",
      "prompt": "Which sentence in the text proves choice b is correct?"
     }
    },
    {
     "id": "v7-read-b-volcano-order",
     "title": "How a Volcano Erupts",
     "skill": "Sequence steps in an explanatory text",
     "time": "9 min",
     "wida": [
      "Sequence events in a process",
      "Use signal words to order steps"
     ],
     "directions": "Read the explanation of how a volcano erupts. Put the steps in the correct order.",
     "type": "order",
     "prompt": "Drag the steps into the correct order, from first to last.",
     "readFor": [
      "where magma starts",
      "what builds pressure",
      "what happens at the surface"
     ],
     "vocabulary": [
      [
       "magma",
       "melted rock deep inside the Earth",
       "magma: roca derretida en lo profundo de la Tierra"
      ],
      [
       "pressure",
       "a strong pushing force",
       "presión: una fuerza fuerte que empuja"
      ],
      [
       "erupt",
       "to burst out suddenly",
       "entrar en erupción: estallar de repente"
      ]
     ],
     "frames": [
      "First, ___ happens.",
      "After the pressure builds, ___."
     ],
     "passageTitle": "How a Volcano Erupts",
     "passage": [
      "Deep below the ground, intense heat melts rock into a thick liquid called magma.",
      "Because magma is lighter than the solid rock around it, it slowly rises toward the surface.",
      "As the magma rises, gases trapped inside it build up enormous pressure.",
      "When the pressure becomes too great, the volcano erupts and magma bursts out as lava.",
      "Over time, the cooled lava hardens and adds new layers to the mountain."
     ],
     "items": [
      {
       "id": "i1",
       "text": "Heat melts rock into magma deep underground."
      },
      {
       "id": "i2",
       "text": "The lighter magma rises toward the surface."
      },
      {
       "id": "i3",
       "text": "Trapped gases build up huge pressure."
      },
      {
       "id": "i4",
       "text": "The volcano erupts and lava bursts out."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "correct": "Perfect sequencing! You traced the eruption from melting rock to bursting lava.",
     "hint": "Start deep underground and move up to the surface.",
     "support": "The process goes from deep to high: rock melts, magma rises, pressure builds, then it erupts.",
     "extension": "Add a fifth step that tells what happens to the lava after it bursts out.",
     "teacher": {
      "use": "Practice sequencing a scientific process using signal words.",
      "function": "Ordering steps in an explanatory text.",
      "lower": "Highlight time words (first, as, when) before sequencing.",
      "onLevel": "Students order the steps and reread the passage to self-check.",
      "challenge": "Students rewrite the sequence as a labeled diagram with arrows.",
      "noTech": "Print the steps as strips; students arrange them on a desk in order.",
      "prompt": "Which signal word in the passage tells you when the volcano erupts?"
     }
    },
    {
     "id": "v7-read-b-rosa-parks-constructed",
     "title": "A Seat That Changed History",
     "skill": "Write a short response with text evidence",
     "time": "11 min",
     "wida": [
      "Construct a written response using text evidence",
      "Explain an author's central idea in academic text"
     ],
     "directions": "Read the passage about Rosa Parks. Then write 3-4 sentences explaining why her action was important. Use evidence from the text.",
     "type": "constructed",
     "prompt": "Why was Rosa Parks's decision important? Use at least one detail from the text to support your answer.",
     "readFor": [
      "what Rosa Parks did",
      "why it mattered",
      "what happened afterward"
     ],
     "vocabulary": [
      [
       "segregation",
       "the unfair separation of people by race",
       "segregación: la separación injusta de personas por raza"
      ],
      [
       "boycott",
       "when people refuse to use something to make a change",
       "boicot: cuando las personas se niegan a usar algo para lograr un cambio"
      ],
      [
       "protest",
       "an action to show you disagree with something",
       "protesta: una acción para mostrar que no estás de acuerdo con algo"
      ]
     ],
     "frames": [
      "Rosa Parks's decision was important because ___.",
      "One detail from the text that shows this is ___."
     ],
     "passageTitle": "A Seat That Changed History",
     "passage": [
      "In 1955, in Montgomery, Alabama, laws of segregation forced Black passengers to give up their bus seats to white riders.",
      "One evening, a woman named Rosa Parks refused to give up her seat, and she was arrested.",
      "Her quiet act of courage inspired the people of Montgomery to begin a bus boycott.",
      "For more than a year, thousands of people refused to ride the buses to protest the unfair laws.",
      "In the end, the courts ruled that segregation on buses was against the law."
     ],
     "responseLabel": "Your response",
     "responsePlaceholder": "Rosa Parks's decision was important because...",
     "writeFor": [
      "a clear reason her action mattered",
      "at least one detail from the text",
      "a complete final sentence"
     ],
     "correct": "A strong answer explains that her refusal sparked the bus boycott and helped end bus segregation, and it cites a detail such as the year-long boycott or the court ruling.",
     "hint": "Use one sentence frame, then add a detail from the passage as proof.",
     "support": "Rosa Parks would not give up her seat. This started a boycott. The boycott helped change the unfair law. Use one of those facts.",
     "extension": "Add a sentence connecting Rosa Parks's action to a fair rule you value today.",
     "teacher": {
      "use": "Assess ability to write an evidence-based response after reading informational text.",
      "function": "Constructing a text-based explanation with a claim and evidence.",
      "lower": "Provide both sentence frames and let students fill in with a copied detail.",
      "onLevel": "Students write 3-4 sentences with one cited detail.",
      "challenge": "Students include two details and a concluding sentence about long-term impact.",
      "noTech": "Students handwrite the response on lined paper using the frames.",
      "prompt": "What detail from the text best proves Rosa Parks's action made a difference?"
     }
    }
   ]
  },
  "Writing": {
   "A": [
    {
     "id": "v7-writ-a-opinion-favorite-meal",
     "title": "My Opinion: A Meal I Love",
     "skill": "Writing an opinion sentence with a reason",
     "time": "8-10 min",
     "wida": [
      "Entering: Express an opinion using a labeled word bank and one sentence frame.",
      "Emerging: Add a reason to an opinion using the connector 'because'."
     ],
     "directions": "Write one or two sentences that tell your opinion about a meal you like. Use the word 'because' to give one reason. Use the frames to help you.",
     "type": "constructed",
     "prompt": "What is a meal you love to eat? Tell your opinion and give one reason why you love it.",
     "writeFor": [
      "A clear opinion (what meal you like)",
      "The word 'because' followed by a reason",
      "A capital letter at the start and a period at the end"
     ],
     "vocabulary": [
      [
       "opinion",
       "what you think or feel about something",
       "opinión: lo que piensas o sientes sobre algo"
      ],
      [
       "reason",
       "why you think or feel that way",
       "razón: por qué piensas o sientes así"
      ],
      [
       "favorite",
       "the one you like the most",
       "favorito: el que más te gusta"
      ]
     ],
     "frames": [
      "My favorite meal is ___.",
      "I love it because ___."
     ],
     "correct": "A strong answer states an opinion and gives one reason joined by 'because', for example: 'My favorite meal is rice and beans. I love it because it tastes warm and reminds me of home.'",
     "hint": "Start by naming the meal. Then write 'because' and tell one reason your body or your heart likes it.",
     "support": "Choose your meal from the word bank, fill the first frame, then say 'because' out loud and finish the sentence.",
     "extension": "Add a second reason using the word 'also', for example: 'I also love it because it is easy to share.'",
     "teacher": {
      "use": "Opening writing warm-up to practice opinion + reason structure before a longer opinion paragraph.",
      "function": "Express opinions and give reasons (language of argument).",
      "lower": "Provide the completed first frame and a picture word bank of three meals.",
      "onLevel": "Students write both sentences independently using the frames.",
      "challenge": "Require two reasons and one sensory detail (taste, smell, or look).",
      "noTech": "Students write the two sentences on a sentence-strip and read them to a partner.",
      "prompt": "Ask: What meal do you love, and what is one reason you love it? Push for 'because'."
     }
    },
    {
     "id": "v7-writ-a-cloze-sequence-sandwich",
     "title": "Sequence It: Making a Sandwich",
     "skill": "Choosing sequence words (first, next, then, last)",
     "time": "6-8 min",
     "wida": [
      "Entering: Select time-order words to complete a simple process from a word bank.",
      "Emerging: Use sequence connectors to show the order of steps."
     ],
     "directions": "Read the steps for making a sandwich. Choose the best time-order word for each blank so the steps are in order.",
     "type": "cloze",
     "prompt": "Finish the directions for making a sandwich. Pick the sequence word that fits best in each blank.",
     "writeFor": [
      "Time-order words that show clear order",
      "Words that do not repeat in a confusing way",
      "Steps that make sense from start to finish"
     ],
     "vocabulary": [
      [
       "sequence",
       "the order that things happen in",
       "secuencia: el orden en que pasan las cosas"
      ],
      [
       "step",
       "one action in a process",
       "paso: una acción en un proceso"
      ],
      [
       "finally",
       "the last thing that happens",
       "finalmente: lo último que pasa"
      ]
     ],
     "frames": [
      "First, I ___.",
      "Then I ___."
     ],
     "segments": [
      {
       "text": "To make a sandwich, "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "first",
        "options": [
         "first",
         "because",
         "happy"
        ]
       }
      },
      {
       "text": " you get two slices of bread. "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "next",
        "options": [
         "next",
         "under",
         "loud"
        ]
       }
      },
      {
       "text": " you spread butter on one slice. "
      },
      {
       "blank": {
        "id": "b3",
        "answer": "then",
        "options": [
         "then",
         "never",
         "blue"
        ]
       }
      },
      {
       "text": " you add the cheese and tomato. "
      },
      {
       "blank": {
        "id": "b4",
        "answer": "finally",
        "options": [
         "finally",
         "maybe",
         "slowly"
        ]
       }
      },
      {
       "text": " you put the slices together and eat it."
      }
     ],
     "correct": "Nice sequencing! First, next, then, and finally move the reader through the steps from start to end.",
     "hint": "Look for words that tell WHEN, not how something feels. The first blank starts the process; the last blank ends it.",
     "support": "Number the steps 1, 2, 3, 4 in the margin first, then match each number to a time word.",
     "extension": "Rewrite the directions for a different food (tea, cereal) using your own four sequence words.",
     "teacher": {
      "use": "Mini-lesson on transitions/sequence words before students write a how-to paragraph.",
      "function": "Sequence steps in a process (language of how-to texts).",
      "lower": "Pre-highlight the correct option in each list and have students copy it.",
      "onLevel": "Students choose independently and read the finished steps aloud.",
      "challenge": "Remove the options and have students supply their own sequence words.",
      "noTech": "Print the steps on strips and have students place the time-order word cards.",
      "prompt": "Ask: Which word tells the reader this happens first? Last?"
     }
    },
    {
     "id": "v7-writ-a-order-morning-routine",
     "title": "Put My Morning in Order",
     "skill": "Ordering sentences into a logical narrative",
     "time": "7-9 min",
     "wida": [
      "Entering: Arrange short, illustrated sentences into time order.",
      "Emerging: Sequence simple narrative sentences using time cues."
     ],
     "directions": "These sentences tell about a morning. Put them in the order that makes the most sense, from the start of the morning to leaving for school.",
     "type": "order",
     "prompt": "Drag the sentences into the best order to tell the story of a morning before school.",
     "writeFor": [
      "A beginning that starts the morning",
      "Middle steps in a sensible order",
      "An ending that leaves for school"
     ],
     "vocabulary": [
      [
       "routine",
       "things you do in the same order each day",
       "rutina: cosas que haces en el mismo orden cada día"
      ],
      [
       "order",
       "the way things are arranged from first to last",
       "orden: la forma en que las cosas van de primero a último"
      ],
      [
       "before",
       "earlier than something else",
       "antes: más temprano que otra cosa"
      ]
     ],
     "frames": [
      "First I ___.",
      "After that I ___."
     ],
     "items": [
      {
       "id": "i1",
       "text": "First, I wake up when my alarm rings."
      },
      {
       "id": "i2",
       "text": "Then I brush my teeth and wash my face."
      },
      {
       "id": "i3",
       "text": "Next, I eat breakfast at the kitchen table."
      },
      {
       "id": "i4",
       "text": "After that, I put my books in my backpack."
      },
      {
       "id": "i5",
       "text": "Finally, I leave my house and walk to school."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4",
      "i5"
     ],
     "correct": "Great ordering! The morning moves logically from waking up to walking to school, guided by the time words.",
     "hint": "Find the sentence with 'wake up' to start, and the sentence about leaving the house to end.",
     "support": "Read each sentence aloud and act it out; the action you do first goes first.",
     "extension": "Add one more sentence about something you do in the morning and place it in the right spot.",
     "teacher": {
      "use": "Build narrative sequencing skills before writing a personal-narrative paragraph.",
      "function": "Recount events in time order (narrative language).",
      "lower": "Provide pictures beside each sentence and let students order the pictures.",
      "onLevel": "Students order the sentences and underline the time words.",
      "challenge": "Mix in one sentence that does not belong and have students remove it before ordering.",
      "noTech": "Use printed sentence strips students physically arrange on their desk.",
      "prompt": "Ask: What do you do right after you wake up? What is the last thing before school?"
     }
    },
    {
     "id": "v7-writ-a-sort-strong-weak-detail",
     "title": "Strong Sentence or Weak Sentence?",
     "skill": "Recognizing detailed vs. vague sentences",
     "time": "8-10 min",
     "wida": [
      "Entering: Sort model sentences into strong and weak with teacher support.",
      "Emerging: Identify sentences that add specific details versus vague ones."
     ],
     "directions": "A strong sentence gives clear details a reader can picture. A weak sentence is too short or vague. Sort each sentence into the correct group.",
     "type": "sort",
     "prompt": "Read each sentence about a park. Decide if it is a strong sentence (clear details) or a weak sentence (vague), and sort it.",
     "writeFor": [
      "Strong sentences with specific nouns and details",
      "Weak sentences that are too vague to picture",
      "A reason in your head for each choice"
     ],
     "vocabulary": [
      [
       "detail",
       "a small piece of information that helps a reader picture something",
       "detalle: una pequeña información que ayuda al lector a imaginar algo"
      ],
      [
       "vague",
       "not clear or not specific",
       "vago: no claro o no específico"
      ],
      [
       "specific",
       "exact and clear, not general",
       "específico: exacto y claro, no general"
      ]
     ],
     "frames": [
      "This sentence is strong because ___.",
      "This sentence is weak because ___."
     ],
     "categories": [
      "Strong sentence",
      "Weak sentence"
     ],
     "items": [
      {
       "id": "s1",
       "text": "The red kite climbed high above the green soccer field.",
       "answer": "Strong sentence"
      },
      {
       "id": "s2",
       "text": "It was nice.",
       "answer": "Weak sentence"
      },
      {
       "id": "s3",
       "text": "Two children laughed as they raced down the metal slide.",
       "answer": "Strong sentence"
      },
      {
       "id": "s4",
       "text": "Stuff happened at the park.",
       "answer": "Weak sentence"
      },
      {
       "id": "s5",
       "text": "A cold breeze pushed ripples across the duck pond.",
       "answer": "Strong sentence"
      },
      {
       "id": "s6",
       "text": "There were things there.",
       "answer": "Weak sentence"
      }
     ],
     "correct": "Well sorted! Strong sentences use specific nouns and details; weak ones use vague words like 'nice', 'stuff', and 'things'.",
     "hint": "Ask yourself: Can I draw a picture from this sentence? If yes, it is probably strong.",
     "support": "Underline the naming words; sentences with exact naming words (kite, slide, pond) are usually strong.",
     "extension": "Rewrite each weak sentence to make it strong by adding a specific detail.",
     "teacher": {
      "use": "Sentence-quality sort before revising students' own descriptive writing.",
      "function": "Evaluate and describe with specific detail (language of description).",
      "lower": "Reduce to four sentences and read each aloud before sorting.",
      "onLevel": "Students sort all six and justify one choice in writing.",
      "challenge": "Students rewrite all three weak sentences into strong ones.",
      "noTech": "Use two labeled folders and sentence cards students place by hand.",
      "prompt": "Ask: Can you picture this sentence in your mind? What detail makes it clear?"
     }
    }
   ],
   "B": [
    {
     "id": "v7-writ-b-constructed-argument-recess",
     "title": "Argument: Should Recess Be Longer?",
     "skill": "Writing an academic claim with reasons and evidence",
     "time": "15-18 min",
     "wida": [
      "Developing: State a claim and support it with two reasons using academic connectors.",
      "Expanding: Develop an argument paragraph with evidence and a concluding statement."
     ],
     "directions": "Write one organized paragraph that argues whether your school day should include a longer recess. State a clear claim, give two reasons with evidence, and end with a concluding sentence.",
     "type": "constructed",
     "prompt": "Some students think the school day should include a longer recess. Do you agree or disagree? Write an argument paragraph that states your claim and supports it with reasons and evidence.",
     "writeFor": [
      "A clear claim that takes a position",
      "At least two reasons, each with supporting evidence",
      "Academic connectors and a concluding sentence"
     ],
     "vocabulary": [
      [
       "claim",
       "the position or opinion you are arguing for",
       "afirmación: la posición u opinión que defiendes"
      ],
      [
       "evidence",
       "facts or examples that support a claim",
       "evidencia: hechos o ejemplos que apoyan una afirmación"
      ],
      [
       "counterargument",
       "a reason someone might disagree with you",
       "contraargumento: una razón por la que alguien podría estar en desacuerdo"
      ]
     ],
     "frames": [
      "I believe that ___ because ___.",
      "One reason for this is ___; for example, ___."
     ],
     "responseLabel": "Write your argument paragraph here:",
     "responsePlaceholder": "My claim is that recess should be ___ because ___. For example, ___.",
     "correct": "A strong response opens with a clear claim, supports it with two distinct reasons each backed by an example or fact, uses connectors (because, for example, in addition), and closes with a concluding sentence that restates the position.",
     "hint": "Plan three parts: (1) your claim, (2) two reasons with examples, (3) a closing sentence. Use 'for example' to add evidence.",
     "support": "Use the frames for the claim and first reason, then add a second reason and a one-sentence conclusion.",
     "extension": "Add a sentence that names a counterargument and respond to it: 'Some people say ___, but ___.'",
     "teacher": {
      "use": "Core argument-writing task aligned to WIDA Writing and ACCESS argument prompts.",
      "function": "Argue a claim and justify with evidence (language of argument).",
      "lower": "Provide a paragraph skeleton with labeled blanks for claim, two reasons, and conclusion.",
      "onLevel": "Students write the full paragraph using connectors from a posted bank.",
      "challenge": "Require a counterargument and rebuttal plus precise academic vocabulary.",
      "noTech": "Students plan on a claim-reasons-evidence graphic organizer, then write by hand.",
      "prompt": "Ask: What is your claim? What two reasons and examples prove it? How will you close?"
     }
    },
    {
     "id": "v7-writ-b-order-explanation-paragraph",
     "title": "Build the Explanation Paragraph",
     "skill": "Organizing topic, detail, and concluding sentences",
     "time": "12-15 min",
     "wida": [
      "Developing: Order topic, supporting, and concluding sentences into a coherent paragraph.",
      "Expanding: Sequence academic sentences using cohesive transitions."
     ],
     "directions": "These five sentences form one explanation paragraph about why plants need sunlight. Put them in the best order: topic sentence first, supporting details in the middle, concluding sentence last.",
     "type": "order",
     "prompt": "Arrange the sentences into a well-organized explanation paragraph about why plants need sunlight.",
     "writeFor": [
      "A topic sentence that names the main idea first",
      "Supporting detail sentences in a logical middle",
      "A concluding sentence that wraps up the idea"
     ],
     "vocabulary": [
      [
       "topic sentence",
       "the sentence that states the main idea of a paragraph",
       "oración temática: la oración que expresa la idea principal de un párrafo"
      ],
      [
       "transition",
       "a word or phrase that connects ideas",
       "transición: una palabra o frase que conecta ideas"
      ],
      [
       "conclude",
       "to bring something to an end with a summary",
       "concluir: terminar algo con un resumen"
      ]
     ],
     "frames": [
      "The main idea of this paragraph is ___.",
      "This sentence belongs in the middle because ___."
     ],
     "items": [
      {
       "id": "i1",
       "text": "Plants need sunlight to grow strong and healthy."
      },
      {
       "id": "i2",
       "text": "First, sunlight gives plants the energy to make their own food through photosynthesis."
      },
      {
       "id": "i3",
       "text": "In addition, sunlight helps a plant's leaves turn green and produce chlorophyll."
      },
      {
       "id": "i4",
       "text": "Without enough light, a plant becomes weak, pale, and may stop growing."
      },
      {
       "id": "i5",
       "text": "For these reasons, sunlight is one of the most important things a plant needs to survive."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4",
      "i5"
     ],
     "correct": "Excellent! The topic sentence opens, two details build the explanation, a consequence deepens it, and the conclusion restates the importance.",
     "hint": "The topic sentence states the big idea with no transition word. The conclusion often begins with a phrase like 'For these reasons'.",
     "support": "Find the sentence that gives the main idea for the whole paragraph and place it first; find the summary sentence and place it last.",
     "extension": "Add your own supporting detail sentence with a transition and decide where it belongs.",
     "teacher": {
      "use": "Model paragraph structure before students draft their own explanation paragraphs.",
      "function": "Explain a phenomenon with organized, cohesive text (language of explanation).",
      "lower": "Color-code the topic, detail, and concluding sentences before ordering.",
      "onLevel": "Students order the sentences and label the function of each.",
      "challenge": "Students reorder, then rewrite one detail sentence with a stronger transition.",
      "noTech": "Use sentence strips students arrange into a paragraph on chart paper.",
      "prompt": "Ask: Which sentence tells the main idea? Which one sums everything up?"
     }
    },
    {
     "id": "v7-writ-b-sort-paragraph-parts",
     "title": "Sort the Paragraph Parts",
     "skill": "Classifying topic, detail, and closing sentences",
     "time": "12-14 min",
     "wida": [
      "Developing: Classify academic sentences by their role in a paragraph.",
      "Expanding: Distinguish topic, supporting detail, and concluding sentences in expository text."
     ],
     "directions": "A strong paragraph has a topic sentence, supporting details, and a closing sentence. Read each sentence about recycling and sort it by the job it does in a paragraph.",
     "type": "sort",
     "prompt": "Sort each sentence about recycling into the part of a paragraph it belongs to: Topic, Detail, or Closing.",
     "writeFor": [
      "A topic sentence that introduces the main idea",
      "Detail sentences that explain or give examples",
      "A closing sentence that restates the main point"
     ],
     "vocabulary": [
      [
       "supporting detail",
       "information that explains or proves the main idea",
       "detalle de apoyo: información que explica o prueba la idea principal"
      ],
      [
       "main idea",
       "the most important point of a paragraph",
       "idea principal: el punto más importante de un párrafo"
      ],
      [
       "restate",
       "to say the main idea again in a new way",
       "reformular: decir la idea principal de nuevo de otra manera"
      ]
     ],
     "frames": [
      "This sentence is a ___ because ___.",
      "A closing sentence usually ___."
     ],
     "categories": [
      "Topic",
      "Detail",
      "Closing"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Recycling at school helps our community and the planet.",
       "answer": "Topic"
      },
      {
       "id": "s2",
       "text": "For example, recycling paper saves trees and reduces waste in landfills.",
       "answer": "Detail"
      },
      {
       "id": "s3",
       "text": "In addition, sorting cans and bottles teaches students to be responsible.",
       "answer": "Detail"
      },
      {
       "id": "s4",
       "text": "All in all, recycling is a simple habit that makes a big difference.",
       "answer": "Closing"
      },
      {
       "id": "s5",
       "text": "Recycling also lowers the amount of energy needed to make new products.",
       "answer": "Detail"
      }
     ],
     "correct": "Correct! The topic sentence states the main idea, the details give examples with connectors, and the closing restates the point.",
     "hint": "The topic sentence is broad and opens the paragraph. Closing sentences often begin with phrases like 'All in all' or 'In conclusion'.",
     "support": "Look for connector words: 'For example' and 'In addition' signal details; 'All in all' signals a closing.",
     "extension": "Write one more detail sentence with a transition that would fit this recycling paragraph.",
     "teacher": {
      "use": "Diagnostic sort to check students' grasp of paragraph structure before drafting.",
      "function": "Organize information into structured text (language of explanation).",
      "lower": "Use three sentences (one per category) and read each aloud before sorting.",
      "onLevel": "Students sort all five and explain one classification in writing.",
      "challenge": "Students arrange the sorted sentences into a complete, well-ordered paragraph.",
      "noTech": "Use three labeled bins and sentence cards students place by hand.",
      "prompt": "Ask: Does this sentence introduce, explain, or wrap up the idea?"
     }
    },
    {
     "id": "v7-writ-b-constructed-describe-place",
     "title": "Describe a Place That Matters",
     "skill": "Writing a descriptive paragraph with sensory detail",
     "time": "15-18 min",
     "wida": [
      "Developing: Write a descriptive paragraph using sensory details and precise adjectives.",
      "Expanding: Develop description with varied sentences and figurative language."
     ],
     "directions": "Write one descriptive paragraph about a place that is important to you. Use sensory details (sight, sound, smell, touch) and precise words so a reader can picture and feel the place.",
     "type": "constructed",
     "prompt": "Think of a place that matters to you, such as a kitchen, a park, or a relative's home. Write a descriptive paragraph that helps a reader see, hear, and feel what it is like to be there.",
     "writeFor": [
      "A topic sentence naming the place and why it matters",
      "Sensory details (sight, sound, smell, or touch)",
      "Precise adjectives and a closing sentence"
     ],
     "vocabulary": [
      [
       "sensory detail",
       "a description that uses one of the five senses",
       "detalle sensorial: una descripción que usa uno de los cinco sentidos"
      ],
      [
       "precise",
       "exact and carefully chosen",
       "preciso: exacto y elegido con cuidado"
      ],
      [
       "figurative language",
       "words that compare or paint a picture, like a simile",
       "lenguaje figurado: palabras que comparan o crean una imagen, como un símil"
      ]
     ],
     "frames": [
      "The place that matters to me is ___ because ___.",
      "When I am there, I can see ___ and hear ___."
     ],
     "responseLabel": "Write your descriptive paragraph here:",
     "responsePlaceholder": "My special place is ___ because ___. When I am there, I notice ___.",
     "correct": "A strong response opens by naming the place and its importance, then layers at least two different sensory details with precise adjectives, and closes with a sentence about how the place makes the writer feel.",
     "hint": "Pick two senses and write one detailed sentence for each. Trade vague words like 'nice' for exact words like 'warm', 'salty', or 'echoing'.",
     "support": "Use the two frames to start, then add one more sentence about how the place makes you feel.",
     "extension": "Add one simile that compares the place to something else: 'The kitchen smelled like ___.'",
     "teacher": {
      "use": "Descriptive-writing task aligned to WIDA Writing narrative/descriptive expectations.",
      "function": "Describe people, places, and things with detail (language of description).",
      "lower": "Provide a five-senses graphic organizer and a precise-adjective word bank.",
      "onLevel": "Students write the paragraph using two or more senses and precise adjectives.",
      "challenge": "Require figurative language (simile or metaphor) and varied sentence lengths.",
      "noTech": "Students brainstorm on a senses chart, then write the paragraph by hand.",
      "prompt": "Ask: What can you see, hear, and smell there? Why does this place matter to you?"
     }
    }
   ]
  },
  "Speaking": {
   "A": [
    {
     "id": "v7-spk-a-describe-classroom-picture",
     "title": "Describe the Classroom Picture",
     "skill": "Speaking: Describing a Picture (short oral response)",
     "time": "6-8 min",
     "wida": [
      "Entering: Names objects and people shown in a familiar visual using single words and short phrases.",
      "Emerging: Describes a picture aloud with simple sentences and basic location words."
     ],
     "directions": "Look at a picture of a classroom in your mind: a teacher at the board, students at desks, books and a clock on the wall. Press record (or speak to a partner). Say what you see in 3-4 short sentences. Use a location word in each sentence.",
     "type": "constructed",
     "prompt": "Describe the classroom picture out loud. What people and objects do you see, and where are they?",
     "responseLabel": "What you will say",
     "responsePlaceholder": "I see ___. The ___ is next to the ___.",
     "sayFor": [
      "Names at least three things you see (teacher, desk, clock)",
      "Uses a location word like on, next to, or behind",
      "Speaks in complete sentences, not just single words"
     ],
     "vocabulary": [
      [
       "describe",
       "to use words to tell what something looks like",
       "describir: usar palabras para decir cómo se ve algo"
      ],
      [
       "next to",
       "at the side of something",
       "al lado de: justo a un costado de algo"
      ],
      [
       "object",
       "a thing you can see and touch",
       "objeto: una cosa que puedes ver y tocar"
      ]
     ],
     "frames": [
      "I see ___ in the picture.",
      "The ___ is next to the ___."
     ],
     "correct": "A strong response names several objects and people and tells where they are using location words in full spoken sentences.",
     "hint": "Start at the front of the room and move your eyes left to right so you do not skip anything.",
     "support": "Point to each thing as you name it, then add 'is on/next to/behind' before saying the next word.",
     "extension": "Add a sentence about what one person in the picture is doing right now using 'is + verb-ing'.",
     "teacher": {
      "use": "Warm-up for the WIDA Speaking 'describe a visual' task; works with any classroom or scene image.",
      "function": "Description; using spatial and location language orally.",
      "lower": "Give a word bank of objects and let students name and point before forming sentences.",
      "onLevel": "Require three full sentences, each with a different location word.",
      "challenge": "Ask for five sentences and one inference about how a person feels.",
      "noTech": "Pairs sit back-to-back; one describes, the other sketches, then compare.",
      "prompt": "Tell me everything you see in this picture and where each thing is."
     }
    },
    {
     "id": "v7-spk-a-strongest-opinion-response",
     "title": "Which Answer Sounds Strongest?",
     "skill": "Speaking: Choosing a clear spoken response",
     "time": "5-7 min",
     "wida": [
      "Entering: Recognizes a complete spoken sentence versus a single word.",
      "Emerging: Identifies the spoken response that gives a reason."
     ],
     "directions": "A teacher asks: 'Do you like working in groups?' Read the four answers aloud quietly. Choose the answer that sounds strongest because it is a full sentence and gives a reason.",
     "type": "multipleChoice",
     "prompt": "Which answer sounds strongest when you say it to your teacher?",
     "options": [
      {
       "id": "a",
       "text": "Yes, I like working in groups because I can share ideas with friends."
      },
      {
       "id": "b",
       "text": "Groups."
      },
      {
       "id": "c",
       "text": "Yes."
      },
      {
       "id": "d",
       "text": "I like, um, yeah."
      }
     ],
     "answer": "a",
     "sayFor": [
      "A full sentence with a subject and verb",
      "A reason after the word because",
      "A clear, calm voice with no filler like um"
     ],
     "vocabulary": [
      [
       "opinion",
       "what you think or feel about something",
       "opinión: lo que piensas o sientes sobre algo"
      ],
      [
       "reason",
       "why you think something",
       "razón: por qué piensas algo"
      ],
      [
       "complete sentence",
       "a sentence with a subject and a verb that makes sense alone",
       "oración completa: una oración con sujeto y verbo que tiene sentido sola"
      ]
     ],
     "frames": [
      "Yes, I like ___ because ___.",
      "No, I do not like ___ because ___."
     ],
     "correct": "Option a is strongest because it is a complete sentence and gives a reason with 'because'.",
     "hint": "A strong spoken answer usually has more than one word and tells why.",
     "support": "Say each option out loud; cross out any answer that is only one word.",
     "extension": "Say option a again, then add a second reason starting with 'Also'.",
     "teacher": {
      "use": "Mini-lesson on what makes a spoken answer 'count' on the Speaking test.",
      "function": "Giving an opinion with a reason; self-monitoring spoken responses.",
      "lower": "Read each option aloud to the student and have them give a thumbs up or down.",
      "onLevel": "After choosing, students record their own full-sentence opinion.",
      "challenge": "Students explain why each weak option would lose points.",
      "noTech": "Hold up four cards; students walk to the strongest answer and defend the choice.",
      "prompt": "Which of these answers would you be proud to say to your teacher, and why?"
     }
    },
    {
     "id": "v7-spk-a-order-introduce-yourself",
     "title": "Put the Spoken Introduction in Order",
     "skill": "Speaking: Sequencing a short oral introduction",
     "time": "6-8 min",
     "wida": [
      "Entering: Arranges familiar spoken phrases into a logical order.",
      "Emerging: Produces a short sequenced self-introduction aloud."
     ],
     "directions": "A new student must introduce themselves to the class. The parts of the introduction are mixed up. Put them in the order you would say them aloud. Then practice saying the whole introduction.",
     "type": "order",
     "prompt": "Order the parts so the spoken introduction sounds natural from start to finish.",
     "items": [
      {
       "id": "i1",
       "text": "Hello, my name is Sofia."
      },
      {
       "id": "i2",
       "text": "I am from Guatemala."
      },
      {
       "id": "i3",
       "text": "In my free time, I like to play soccer."
      },
      {
       "id": "i4",
       "text": "It is nice to meet you all."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "sayFor": [
      "A greeting and your name first",
      "Where you are from and something you like",
      "A friendly closing line"
     ],
     "vocabulary": [
      [
       "introduce",
       "to tell people who you are",
       "presentar: decir a las personas quién eres"
      ],
      [
       "greeting",
       "words you say to say hello",
       "saludo: palabras que dices para decir hola"
      ],
      [
       "order",
       "the way things come one after another",
       "orden: la manera en que las cosas vienen una tras otra"
      ]
     ],
     "frames": [
      "Hello, my name is ___.",
      "I am from ___ and I like ___."
     ],
     "correct": "The natural order is greeting and name, where you are from, what you like, then a friendly closing.",
     "hint": "You always say hello before you say goodbye.",
     "support": "Find the greeting first and the goodbye last, then fit the middle parts.",
     "extension": "Add one more middle sentence about your family before you say the closing line.",
     "teacher": {
      "use": "Builds an oral routine students can reuse on the first speaking prompt of the test.",
      "function": "Sequencing; producing connected spoken discourse.",
      "lower": "Use sentence strips students physically slide into order before speaking.",
      "onLevel": "Students reorder, then perform the introduction from memory.",
      "challenge": "Students add transitions like 'First' and 'Also' when they speak.",
      "noTech": "Print the four lines on strips; students arrange on a desk and read aloud.",
      "prompt": "In what order would you say these parts when you introduce yourself?"
     }
    },
    {
     "id": "v7-spk-a-sort-polite-casual",
     "title": "Sort Polite vs. Casual Phrases",
     "skill": "Speaking: Choosing the right tone aloud",
     "time": "6-8 min",
     "wida": [
      "Entering: Distinguishes polite from casual familiar phrases.",
      "Emerging: Selects appropriate spoken phrases for a teacher or a friend."
     ],
     "directions": "You speak differently to a teacher than to a friend. Read each phrase aloud. Decide if it sounds polite (say to a teacher) or casual (say to a friend). Sort it into the correct group.",
     "type": "sort",
     "prompt": "Sort each spoken phrase into Polite (to a teacher) or Casual (to a friend).",
     "categories": [
      "Polite",
      "Casual"
     ],
     "items": [
      {
       "id": "s1",
       "text": "Excuse me, may I ask a question?",
       "answer": "Polite"
      },
      {
       "id": "s2",
       "text": "Hey, what's up?",
       "answer": "Casual"
      },
      {
       "id": "s3",
       "text": "Could you please repeat that?",
       "answer": "Polite"
      },
      {
       "id": "s4",
       "text": "Gimme that one.",
       "answer": "Casual"
      },
      {
       "id": "s5",
       "text": "Thank you very much for your help.",
       "answer": "Polite"
      },
      {
       "id": "s6",
       "text": "Yeah, sure, no problem.",
       "answer": "Casual"
      }
     ],
     "sayFor": [
      "A polite phrase you would say to a teacher",
      "A casual phrase you would say to a friend",
      "Why the polite phrase fits a teacher"
     ],
     "vocabulary": [
      [
       "polite",
       "using kind and respectful words",
       "cortés: usar palabras amables y respetuosas"
      ],
      [
       "casual",
       "relaxed and informal, like with friends",
       "informal: relajado, como con amigos"
      ],
      [
       "tone",
       "the way your words sound to others",
       "tono: la manera en que tus palabras suenan a otros"
      ]
     ],
     "frames": [
      "To a teacher I would say, '___.'",
      "To a friend I would say, '___.'"
     ],
     "correct": "Polite phrases use words like may, could, please, and thank you; casual phrases are relaxed and informal.",
     "hint": "Polite phrases often use 'may', 'could', 'please', or 'thank you'.",
     "support": "Ask yourself: would I say this to the principal? If yes, it is polite.",
     "extension": "Say one casual phrase, then rewrite it aloud as a polite phrase.",
     "teacher": {
      "use": "Teaches register awareness for the Speaking test, where polite forms score higher.",
      "function": "Register and audience; selecting tone in spoken language.",
      "lower": "Sort just four phrases with a picture of a teacher and a friend as anchors.",
      "onLevel": "Students sort all six and say one reason for each choice.",
      "challenge": "Students generate two new phrases of their own and sort them.",
      "noTech": "Two labeled hoops or corners; students stand with their card in the right group.",
      "prompt": "Would you say this to a teacher or to a friend, and why?"
     }
    }
   ],
   "B": [
    {
     "id": "v7-spk-b-compare-two-cities",
     "title": "Compare Two Places (Extended Response)",
     "skill": "Speaking: Comparing and contrasting aloud",
     "time": "9-12 min",
     "wida": [
      "Developing: Compares two topics orally using connected sentences and comparison words.",
      "Expanding: Develops an extended spoken comparison with specific details and academic transitions."
     ],
     "directions": "You will compare two places you know, such as your home country and the United States, or a city and the countryside. Speak for about one minute. Give at least two similarities and two differences. Use comparison words and end with which you prefer and why.",
     "type": "constructed",
     "prompt": "Compare two places you know. How are they alike, how are they different, and which do you prefer?",
     "responseLabel": "What you will say",
     "responsePlaceholder": "Both ___ and ___ have ___. However, ___ is ___ than ___ because ___.",
     "sayFor": [
      "At least two similarities and two differences",
      "Comparison words such as both, however, and -er than",
      "A clear preference with a reason at the end"
     ],
     "vocabulary": [
      [
       "compare",
       "to tell how things are alike and different",
       "comparar: decir en qué se parecen y se diferencian las cosas"
      ],
      [
       "however",
       "a word that shows a difference",
       "sin embargo: una palabra que muestra una diferencia"
      ],
      [
       "prefer",
       "to like one thing more than another",
       "preferir: gustar más una cosa que otra"
      ]
     ],
     "frames": [
      "Both ___ and ___ have ___.",
      "However, ___ is ___ than ___, so I prefer ___."
     ],
     "correct": "A strong response gives two clear similarities and two differences with comparison words and ends with a stated preference and reason.",
     "hint": "Plan two 'same' ideas and two 'different' ideas before you start speaking.",
     "support": "Use a T-chart: list 'same' on one side and 'different' on the other, then speak from it.",
     "extension": "Add a sentence predicting how one place might change in the future.",
     "teacher": {
      "use": "Targets the WIDA Speaking compare/contrast prompt at Developing-Expanding.",
      "function": "Comparing and contrasting; organizing extended oral discourse.",
      "lower": "Provide a completed T-chart and the comparison frames to read from.",
      "onLevel": "Students speak for one minute using their own T-chart.",
      "challenge": "Students speak 90 seconds and weave in academic words like 'in contrast' and 'similarly'.",
      "noTech": "Partner A times one minute while Partner B compares, then they switch and give feedback.",
      "prompt": "Tell me how these two places are alike and different, and which you would choose."
     }
    },
    {
     "id": "v7-spk-b-retell-process-order",
     "title": "Order the Spoken Explanation of a Process",
     "skill": "Speaking: Sequencing an academic explanation",
     "time": "8-10 min",
     "wida": [
      "Developing: Sequences the steps of a process using time-order transitions.",
      "Expanding: Produces a coherent extended spoken explanation of a multi-step process."
     ],
     "directions": "A student is explaining aloud how to do a science experiment: testing which paper towel absorbs the most water. The spoken steps are out of order. Put them in the order they should be said. Then retell the whole process aloud in your own words.",
     "type": "order",
     "prompt": "Put the spoken steps of the experiment explanation in the correct order, then retell it aloud.",
     "items": [
      {
       "id": "i1",
       "text": "First, we chose three different paper towel brands to test."
      },
      {
       "id": "i2",
       "text": "Next, we poured the same amount of water on each towel."
      },
      {
       "id": "i3",
       "text": "Then we measured how much water each towel soaked up."
      },
      {
       "id": "i4",
       "text": "Finally, we compared the results and named the most absorbent brand."
      }
     ],
     "answer": [
      "i1",
      "i2",
      "i3",
      "i4"
     ],
     "sayFor": [
      "Time-order words like first, next, then, and finally",
      "Each step explained in a full sentence",
      "A clear result or conclusion at the end"
     ],
     "vocabulary": [
      [
       "process",
       "a set of steps to do something",
       "proceso: un conjunto de pasos para hacer algo"
      ],
      [
       "absorbent",
       "able to soak up liquid",
       "absorbente: capaz de empapar líquido"
      ],
      [
       "sequence",
       "the order steps happen in",
       "secuencia: el orden en que ocurren los pasos"
      ]
     ],
     "frames": [
      "First, we ___. Next, we ___.",
      "Finally, we found that ___."
     ],
     "correct": "The order is choose the brands, pour equal water, measure absorption, then compare and conclude, signaled by first, next, then, finally.",
     "hint": "Look for the time-order words; 'first' begins and 'finally' ends.",
     "support": "Match each step to a time-order word before you arrange them.",
     "extension": "Retell the process and add why it was fair to use the same amount of water.",
     "teacher": {
      "use": "Prepares students for the Speaking 'explain a process' academic prompt.",
      "function": "Sequencing; explaining procedures with transitions.",
      "lower": "Use step cards with pictures and the transition words already attached.",
      "onLevel": "Students order the steps, then retell using their own words.",
      "challenge": "Students retell the process without looking and add a controlled-variable explanation.",
      "noTech": "Step strips on a desk; students arrange, then narrate to a partner.",
      "prompt": "In what order should these steps be said, and can you retell the whole process?"
     }
    },
    {
     "id": "v7-spk-b-opinion-strongest-evidence",
     "title": "Choose the Best Reasons to Say",
     "skill": "Speaking: Supporting an opinion with strong reasons",
     "time": "8-10 min",
     "wida": [
      "Developing: Identifies reasons that support a stated opinion.",
      "Expanding: Selects the strongest evidence to include in an extended spoken argument."
     ],
     "directions": "Your opinion is: 'Schools should have longer lunch breaks.' You can only use the strongest reasons when you speak. Read all the choices and select the TWO that best support this opinion with specific, logical reasons.",
     "type": "multiSelect",
     "prompt": "Which TWO reasons would make your spoken opinion strongest?",
     "options": [
      {
       "id": "a",
       "text": "Students who eat slowly would have enough time to finish their food and stay focused in afternoon classes."
      },
      {
       "id": "b",
       "text": "Lunch is my favorite time of the day."
      },
      {
       "id": "c",
       "text": "A longer break gives students time to move and rest, which research links to better learning."
      },
      {
       "id": "d",
       "text": "I do not like the cafeteria food anyway."
      },
      {
       "id": "e",
       "text": "Longer lunch just sounds nice."
      }
     ],
     "answers": [
      "a",
      "c"
     ],
     "sayFor": [
      "Two reasons that connect logically to the opinion",
      "Specific details, not just feelings",
      "Words like because, this means, and as a result"
     ],
     "vocabulary": [
      [
       "evidence",
       "facts or reasons that support an idea",
       "evidencia: hechos o razones que apoyan una idea"
      ],
      [
       "support",
       "to give reasons that make an idea stronger",
       "apoyar: dar razones que hacen más fuerte una idea"
      ],
      [
       "logical",
       "makes sense and connects clearly",
       "lógico: que tiene sentido y se conecta claramente"
      ]
     ],
     "frames": [
      "Schools should ___ because ___.",
      "This means that ___, so ___."
     ],
     "correct": "Options a and c are strongest because they give specific, logical reasons tied to learning; the others are personal feelings or off-topic.",
     "hint": "A strong reason explains how the change helps, not just that you like it.",
     "support": "Ask of each reason: does this explain WHY longer lunch helps learning? If not, skip it.",
     "extension": "Say your opinion aloud using both strong reasons connected with 'Furthermore'.",
     "teacher": {
      "use": "Teaches evidence selection before the Speaking 'give an opinion' extended task.",
      "function": "Argumentation; distinguishing strong evidence from weak opinion.",
      "lower": "Compare just two options at a time and decide which is stronger.",
      "onLevel": "Students pick two and then say the full opinion aloud with both reasons.",
      "challenge": "Students explain why each rejected option is weak and add a counterargument.",
      "noTech": "Sort reason cards into 'strong' and 'weak' piles, then debate aloud.",
      "prompt": "Which two reasons would you actually say out loud to convince someone, and why?"
     }
    },
    {
     "id": "v7-spk-b-explain-school-situation-cloze",
     "title": "Complete the Spoken Explanation",
     "skill": "Speaking: Explaining a school situation with academic language",
     "time": "8-10 min",
     "wida": [
      "Developing: Completes connected spoken sentences explaining a school situation.",
      "Expanding: Uses cohesive and academic language to explain a problem and a solution aloud."
     ],
     "directions": "A student is explaining to a counselor why they missed homework and how they will fix it. Choose the best word for each blank so the spoken explanation sounds clear and academic. Then say the whole explanation aloud, smoothly.",
     "type": "cloze",
     "prompt": "Complete the spoken explanation, then read the full thing aloud as if you were talking to the counselor.",
     "segments": [
      {
       "text": "I missed two assignments last week "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "because",
        "options": [
         "because",
         "but",
         "or"
        ]
       }
      },
      {
       "text": " my family was moving to a new apartment. "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "As a result",
        "options": [
         "As a result",
         "For example",
         "In the same way"
        ]
       }
      },
      {
       "text": ", I fell behind in math. To fix this, I will "
      },
      {
       "blank": {
        "id": "b3",
        "answer": "first",
        "options": [
         "first",
         "never",
         "maybe"
        ]
       }
      },
      {
       "text": " ask my teacher for the missing work, "
      },
      {
       "blank": {
        "id": "b4",
        "answer": "and then",
        "options": [
         "and then",
         "instead of",
         "because of"
        ]
       }
      },
      {
       "text": " finish it during study hall this week. I am confident I can catch up."
      }
     ],
     "sayFor": [
      "A clear cause for the problem using because",
      "A consequence using as a result",
      "A two-step plan using first and then"
     ],
     "vocabulary": [
      [
       "explain",
       "to make something clear by giving details",
       "explicar: hacer algo claro dando detalles"
      ],
      [
       "as a result",
       "words that show what happened because of something",
       "como resultado: palabras que muestran lo que pasó por algo"
      ],
      [
       "solution",
       "a way to fix a problem",
       "solución: una manera de arreglar un problema"
      ]
     ],
     "frames": [
      "I had trouble with ___ because ___.",
      "To fix this, I will first ___ and then ___."
     ],
     "correct": "The clear academic version reads: I missed two assignments because my family was moving. As a result, I fell behind. To fix this, I will first ask for the work, and then finish it during study hall.",
     "hint": "Each blank links two ideas; ask whether it shows a cause, a result, or a step.",
     "support": "Read each option aloud in the sentence and keep the one that sounds smooth.",
     "extension": "Retell the explanation without the prompt, adding one sentence about preventing this next time.",
     "teacher": {
      "use": "Models cohesive devices for the Speaking 'explain a situation' academic prompt.",
      "function": "Explaining cause, effect, and solution with cohesive ties.",
      "lower": "Give two answer options per blank instead of three.",
      "onLevel": "Students complete the cloze, then perform the explanation aloud.",
      "challenge": "Students retell from memory and add a sentence about what they learned.",
      "noTech": "Print the paragraph with blanks; students write choices, then read to a partner.",
      "prompt": "Which words make this explanation sound clear and responsible when you say it aloud?"
     }
    }
   ]
  },
  "Model-Test": {
   "6-8-A": [
    {
     "id": "v7-mt-a-direction-words",
     "title": "What Are the Directions Telling You?",
     "skill": "Reading test directions",
     "time": "8 min",
     "wida": [
      "Interpret academic test-direction vocabulary",
      "Determine the action a task requires"
     ],
     "directions": "Read each test direction. Choose the answer that tells what you must DO.",
     "type": "multipleChoice",
     "prompt": "A test says: \"Select the BEST answer and mark only one bubble.\" What should you do?",
     "options": [
      {
       "id": "a",
       "text": "Pick the one answer that fits best and fill in a single bubble."
      },
      {
       "id": "b",
       "text": "Mark every answer that could be true."
      },
      {
       "id": "c",
       "text": "Write a paragraph explaining your choice."
      },
      {
       "id": "d",
       "text": "Skip the question and come back later."
      }
     ],
     "answer": "a",
     "vocabulary": [
      [
       "select",
       "to choose one thing from a group",
       "seleccionar: elegir una cosa de un grupo"
      ],
      [
       "best",
       "the most correct choice of all the choices",
       "mejor: la opción más correcta de todas"
      ],
      [
       "bubble",
       "the small oval you fill in on an answer sheet",
       "burbuja: el óvalo pequeño que rellenas en la hoja de respuestas"
      ]
     ],
     "frames": [
      "The direction word ___ tells me to ___.",
      "Because it says \"only one,\" I will ___."
     ],
     "correct": "Yes. \"Select the best\" means choose one answer, and \"only one bubble\" means mark a single oval.",
     "hint": "Underline the action verb and the number words like \"one\" or \"all.\"",
     "support": "Action words in directions: select = choose; mark = fill in; only one = a single answer.",
     "extension": "Rewrite the direction in your own words for a younger student.",
     "readFor": [
      "the action verb",
      "the words best or only",
      "how many answers to mark"
     ],
     "teacher": {
      "use": "Open the set with direction-word decoding.",
      "function": "Interpreting the verb and quantity in a test direction.",
      "lower": "Read the direction aloud and point to the action verb.",
      "onLevel": "Students decode the direction independently.",
      "challenge": "Have students compare \"select one\" vs. \"select all\" directions.",
      "noTech": "Project the direction; students point to the verb and the number word.",
      "prompt": "Which word in the direction told you how many answers to mark?"
     }
    },
    {
     "id": "v7-mt-a-eliminate-wrong",
     "title": "Cross Out What Cannot Be True",
     "skill": "Elimination strategy",
     "time": "9 min",
     "wida": [
      "Apply process of elimination to reading items",
      "Justify removing distractor answers"
     ],
     "directions": "Read the short passage. Then choose every answer that you can ELIMINATE because the passage does not support it.",
     "type": "multiSelect",
     "passageTitle": "The School Garden",
     "passage": [
      "Room 12 started a garden in March. The students planted tomatoes and beans. By June, the tomatoes were red and ready to pick. The beans were still growing."
     ],
     "prompt": "The question asks: \"What was ready to pick in June?\" Which answers can you ELIMINATE?",
     "options": [
      {
       "id": "a",
       "text": "Beans, because they were still growing."
      },
      {
       "id": "b",
       "text": "Tomatoes, because they were red and ready."
      },
      {
       "id": "c",
       "text": "Corn, because corn is never mentioned."
      },
      {
       "id": "d",
       "text": "Flowers, because flowers are never mentioned."
      }
     ],
     "answers": [
      "a",
      "c",
      "d"
     ],
     "vocabulary": [
      [
       "eliminate",
       "to remove a choice you know is wrong",
       "eliminar: quitar una opción que sabes que está mal"
      ],
      [
       "support",
       "to back up an answer with text proof",
       "respaldar: apoyar una respuesta con pruebas del texto"
      ],
      [
       "distractor",
       "a wrong answer made to look right",
       "distractor: una respuesta incorrecta que parece correcta"
      ]
     ],
     "frames": [
      "I can eliminate ___ because the text ___.",
      "The only answer left is ___."
     ],
     "correct": "Correct. Beans were still growing, and corn and flowers are never in the passage, so all three can be eliminated.",
     "hint": "Eliminate any choice the passage does not actually say.",
     "support": "To eliminate: cross out answers that are off-topic or that the text says the opposite of.",
     "extension": "Explain in one sentence why elimination makes the right answer easier to find.",
     "readFor": [
      "what the text actually says",
      "words like still or not yet",
      "names that never appear in the text"
     ],
     "teacher": {
      "use": "Teach elimination as a reading-test tool.",
      "function": "Removing unsupported distractors before choosing.",
      "lower": "Highlight each choice in the passage together; if it is not there, cross it out.",
      "onLevel": "Students eliminate independently, then name the one survivor.",
      "challenge": "Ask students to label WHY each wrong answer is wrong (off-topic vs. contradicted).",
      "noTech": "Print the passage; students literally cross out eliminated choices with a pencil.",
      "prompt": "After you crossed out three choices, what was the only answer left?"
     }
    },
    {
     "id": "v7-mt-a-cite-evidence",
     "title": "Find the Sentence That Proves It",
     "skill": "Citing text evidence",
     "time": "10 min",
     "wida": [
      "Locate textual evidence for a claim",
      "Distinguish proof sentences from extra detail"
     ],
     "directions": "Read the passage. The claim is below. Click the ONE sentence that proves the claim.",
     "type": "hotText",
     "prompt": "Claim: Maria was late because of a problem with her bus. Click the sentence that proves this claim.",
     "passageTitle": "Why Maria Was Late",
     "passage": [
      "Maria woke up on time on Tuesday.",
      "Her bus, however, broke down two blocks from the stop.",
      "She had to wait twenty minutes for a second bus.",
      "That is why she arrived late to first period."
     ],
     "sentences": [
      {
       "id": "s1",
       "text": "Maria woke up on time on Tuesday."
      },
      {
       "id": "s2",
       "text": "Her bus, however, broke down two blocks from the stop."
      },
      {
       "id": "s3",
       "text": "She had to wait twenty minutes for a second bus."
      },
      {
       "id": "s4",
       "text": "That is why she arrived late to first period."
      }
     ],
     "answers": [
      "s2"
     ],
     "vocabulary": [
      [
       "evidence",
       "facts or words from the text that prove an answer",
       "evidencia: hechos o palabras del texto que prueban una respuesta"
      ],
      [
       "claim",
       "a statement someone says is true",
       "afirmación: una declaración que alguien dice que es verdad"
      ],
      [
       "cite",
       "to point to the exact words that prove your answer",
       "citar: señalar las palabras exactas que prueban tu respuesta"
      ]
     ],
     "frames": [
      "The text says \"___,\" so I know ___.",
      "My evidence is the sentence ___."
     ],
     "correct": "Yes. The broken-down bus is the cause that proves why Maria was late.",
     "hint": "Find the sentence that gives the REASON, not just a detail.",
     "support": "Evidence answers the question \"How do I know?\" Look for the cause sentence.",
     "extension": "Write one sentence starting \"The text says...\" to quote your evidence.",
     "readFor": [
      "the claim you must prove",
      "a cause-and-effect signal like however or that is why",
      "the sentence that gives the reason"
     ],
     "teacher": {
      "use": "Practice pinpointing a single evidence sentence.",
      "function": "Matching a claim to its proof in the text.",
      "lower": "Read the claim, then read each sentence and ask \"Does this prove it?\"",
      "onLevel": "Students select the proof sentence independently.",
      "challenge": "Ask students to rank the other sentences from most to least relevant.",
      "noTech": "Print the passage; students underline the one proof sentence.",
      "prompt": "Which signal words pointed you to the cause sentence?"
     }
    },
    {
     "id": "v7-mt-a-ws-test-toolkit",
     "title": "Worksheet — My Test-Taking Toolkit",
     "skill": "Printable practice",
     "time": "Print & do",
     "type": "worksheet",
     "directions": "Print this page. Complete each section with a pencil before the practice test.",
     "wida": [
      "print-based practice",
      "Self-monitor test-taking strategies"
     ],
     "sheet": [
      {
       "heading": "Match the Direction Word",
       "items": [
        "1. select  →  (a) fill in the oval  (b) choose one",
        "2. mark  →  (a) choose one  (b) fill in the oval",
        "3. support  →  (a) give proof  (b) erase",
        "4. eliminate  →  (a) cross out  (b) circle twice"
       ]
      },
      {
       "heading": "Elimination Drill",
       "items": [
        "5. A reading question has 4 choices. You are sure 2 are wrong. How many are left? ___",
        "6. List one reason an answer choice can be eliminated: ___"
       ]
      },
      {
       "heading": "Answer-Sheet Practice",
       "items": [
        "7. Fill in bubble B for Question 1:  (A) (B) (C) (D)",
        "8. You marked two bubbles by mistake. What do you do first? ___"
       ]
      },
      {
       "heading": "Write",
       "items": [
        "Write one sentence about a test strategy you will use: ___."
       ]
      }
     ]
    }
   ],
   "6-8-B": [
    {
     "id": "v7-mt-b-time-management",
     "title": "How Should You Spend Your Time?",
     "skill": "Test time management",
     "time": "8 min",
     "wida": [
      "Plan time across test sections",
      "Decide when to skip and return"
     ],
     "directions": "Read the situation. Choose the smartest time-management move.",
     "type": "multipleChoice",
     "prompt": "You have 30 minutes and 15 questions. You are stuck on Question 4 after two minutes. What is the best move?",
     "options": [
      {
       "id": "a",
       "text": "Mark it to return to, then keep going so you reach every question."
      },
      {
       "id": "b",
       "text": "Stay on Question 4 until you solve it, even if it takes ten minutes."
      },
      {
       "id": "c",
       "text": "Guess randomly on the rest and stop reading."
      },
      {
       "id": "d",
       "text": "Leave Question 4 blank forever and never come back."
      }
     ],
     "answer": "a",
     "vocabulary": [
      [
       "manage",
       "to use something carefully so it is enough",
       "administrar: usar algo con cuidado para que alcance"
      ],
      [
       "skip",
       "to pass over something for now and return later",
       "saltar: pasar por alto algo por ahora y volver después"
      ],
      [
       "pace",
       "the speed you work at so you finish on time",
       "ritmo: la velocidad a la que trabajas para terminar a tiempo"
      ]
     ],
     "frames": [
      "If I am stuck, I will ___ and come back.",
      "With ___ minutes left, I should ___."
     ],
     "correct": "Yes. Mark the hard one, keep your pace, and return with your leftover time.",
     "hint": "A test rewards finishing all questions, not perfecting one.",
     "support": "Smart pacing: spend about the same time per question; skip and return to hard ones.",
     "extension": "Figure out about how many minutes you can spend per question here.",
     "readFor": [
      "how much time is left",
      "how many questions remain",
      "whether you can return to a question"
     ],
     "teacher": {
      "use": "Teach pacing before a timed model test.",
      "function": "Choosing a skip-and-return strategy.",
      "lower": "Walk through the math: 30 minutes for 15 questions is about 2 each.",
      "onLevel": "Students reason about the trade-off independently.",
      "challenge": "Have students build a one-line time plan for a 45-minute test.",
      "noTech": "Use a classroom clock; students estimate time per question aloud.",
      "prompt": "What does it cost you to spend ten minutes on one question?"
     }
    },
    {
     "id": "v7-mt-b-word-families",
     "title": "Build the Academic Word Family",
     "skill": "Academic word families",
     "time": "9 min",
     "wida": [
      "Use morphology to read academic words",
      "Match word forms to sentence slots"
     ],
     "directions": "Fill each blank with the correct form of the word family (explain, support, observe).",
     "type": "cloze",
     "prompt": "Choose the correct word form so each test sentence makes sense.",
     "segments": [
      {
       "text": "In writing tasks, you must "
      },
      {
       "blank": {
        "id": "b1",
        "answer": "explain",
        "options": [
         "explain",
         "explanation",
         "explained"
        ]
       }
      },
      {
       "text": " your idea clearly. A strong "
      },
      {
       "blank": {
        "id": "b2",
        "answer": "explanation",
        "options": [
         "explanation",
         "explain",
         "explaining"
        ]
       }
      },
      {
       "text": " uses evidence. Good readers also "
      },
      {
       "blank": {
        "id": "b3",
        "answer": "observe",
        "options": [
         "observe",
         "observation",
         "observant"
        ]
       }
      },
      {
       "text": " details and "
      },
      {
       "blank": {
        "id": "b4",
        "answer": "support",
        "options": [
         "support",
         "supportive",
         "supporter"
        ]
       }
      },
      {
       "text": " their answers with proof."
      }
     ],
     "vocabulary": [
      [
       "explain",
       "to make an idea clear with words",
       "explicar: aclarar una idea con palabras"
      ],
      [
       "observe",
       "to notice details by looking closely",
       "observar: notar detalles mirando con atención"
      ],
      [
       "support",
       "to back up a claim with proof",
       "respaldar: apoyar una afirmación con pruebas"
      ]
     ],
     "frames": [
      "The verb form is ___ because it follows ___.",
      "The noun form ___ names the thing, not the action."
     ],
     "correct": "Yes. Verbs follow \"must\" and \"also\"; the noun \"explanation\" follows \"a strong.\"",
     "hint": "After \"a strong\" you need a noun; after \"must\" you need a verb.",
     "support": "Word families: explain (verb) / explanation (noun); same root, different jobs.",
     "extension": "Add one more form for each word and use it in a sentence.",
     "readFor": [
      "whether a verb or noun fits the slot",
      "the word before the blank",
      "the shared root of each word"
     ],
     "teacher": {
      "use": "Strengthen morphology for academic test words.",
      "function": "Selecting the correct word form for context.",
      "lower": "Cover the options; ask \"Is a naming word or an action word missing?\"",
      "onLevel": "Students choose forms independently.",
      "challenge": "Students map the full family (verb, noun, adjective) for each root.",
      "noTech": "Write the sentences on the board; students supply the forms orally.",
      "prompt": "How did the word before the blank tell you which form to use?"
     }
    },
    {
     "id": "v7-mt-b-stem-sort",
     "title": "What Is the Question Really Asking?",
     "skill": "Reading the question stem",
     "time": "10 min",
     "wida": [
      "Classify question stems by the response they require",
      "Connect stems across all four domains"
     ],
     "directions": "Read each question stem. Sort it into the kind of answer it asks you to give.",
     "type": "sort",
     "prompt": "Drag each test question into the response it requires.",
     "categories": [
      "Find one detail",
      "Give an opinion with reasons",
      "Put events in order"
     ],
     "items": [
      {
       "id": "s1",
       "text": "According to the text, where did the story take place?",
       "answer": "Find one detail"
      },
      {
       "id": "s2",
       "text": "Which event happened first, second, and last?",
       "answer": "Put events in order"
      },
      {
       "id": "s3",
       "text": "Do you agree with the author? Support your view.",
       "answer": "Give an opinion with reasons"
      },
      {
       "id": "s4",
       "text": "What time does the speaker say the trip begins?",
       "answer": "Find one detail"
      },
      {
       "id": "s5",
       "text": "List the steps in the order the teacher explains them.",
       "answer": "Put events in order"
      },
      {
       "id": "s6",
       "text": "In your opinion, was the plan fair? Why or why not?",
       "answer": "Give an opinion with reasons"
      }
     ],
     "vocabulary": [
      [
       "stem",
       "the question part that tells you what to do",
       "enunciado: la parte de la pregunta que te dice qué hacer"
      ],
      [
       "according to",
       "based on what the text or speaker says",
       "según: basado en lo que dice el texto o el hablante"
      ],
      [
       "sequence",
       "the order in which things happen",
       "secuencia: el orden en que ocurren las cosas"
      ]
     ],
     "frames": [
      "This stem asks me to ___ because it says ___.",
      "The words \"___\" signal a ___ question."
     ],
     "correct": "Correct. \"According to\" and \"what time\" ask for a detail; \"do you agree\" asks for an opinion; \"order\" and \"steps\" ask for sequence.",
     "hint": "Look for signal words: according to (detail), agree/opinion (opinion), order/steps (sequence).",
     "support": "Stem signals: \"according to\" = find it in the text; \"do you agree\" = give reasons; \"order\" = sequence.",
     "extension": "Write one new stem for each of the three categories.",
     "readFor": [
      "the signal words in the stem",
      "whether it wants text proof or your opinion",
      "whether order matters"
     ],
     "teacher": {
      "use": "Build stem-awareness across listening, reading, and writing.",
      "function": "Categorizing stems by required response type.",
      "lower": "Read each stem aloud and underline the signal phrase together.",
      "onLevel": "Students sort independently and name the signal word.",
      "challenge": "Students add a fourth category (\"compare two things\") and find example stems.",
      "noTech": "Write stems on cards; students physically sort them into three piles.",
      "prompt": "Which signal words told you the question wanted your opinion?"
     }
    },
    {
     "id": "v7-mt-b-ws-stem-decoder",
     "title": "Worksheet — Question-Stem Decoder",
     "skill": "Printable practice",
     "time": "Print & do",
     "type": "worksheet",
     "directions": "Print this page. Read each stem and write what it asks you to do.",
     "wida": [
      "print-based practice",
      "Decode question-stem signal words"
     ],
     "sheet": [
      {
       "heading": "Circle the Signal Word",
       "items": [
        "1. According to the passage, who solved the problem?  (according to / who / problem)",
        "2. List the steps in order.  (list / order / steps)",
        "3. Do you agree? Support your answer.  (agree / support / answer)"
       ]
      },
      {
       "heading": "Name the Task",
       "items": [
        "4. \"What time does the bus leave?\" asks me to: ___",
        "5. \"Why do you think the plan worked?\" asks me to: ___",
        "6. \"Put the events in sequence\" asks me to: ___"
       ]
      },
      {
       "heading": "Time & Bubbles",
       "items": [
        "7. You have 20 minutes for 10 questions. About how long per question? ___",
        "8. Practice: fill in bubble C for Question 1.  (A) (B) (C) (D)"
       ]
      },
      {
       "heading": "Write",
       "items": [
        "Write one sentence telling how a signal word helps you answer faster: ___."
       ]
      }
     ]
    }
   ]
  }
 }
};

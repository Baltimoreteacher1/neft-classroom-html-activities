window.ACCESS_LAB_V3 = {
  appendActivities: {
    Listening: {
      A: [
        {
          id: "v3-l-a-1",
          title: "Follow the Lab Safety Steps",
          skill: "Following one-step oral directions",
          time: "5 min",
          directions:
            "Listen to the teacher. Then choose what you should do first.",
          prompt: "What should you do FIRST before the science experiment?",
          type: "multipleChoice",
          options: [
            { id: "a", text: "Put on safety goggles.", visual: "🥽" },
            { id: "b", text: "Pour the liquid.", visual: "🧪" },
            { id: "c", text: "Leave the room.", visual: "🚪" },
            { id: "d", text: "Eat a snack.", visual: "🍪" },
          ],
          answer: "a",
          correct:
            "Great listening! Safety always comes first, so you put on goggles before you touch anything.",
          hint: "Listen again for the safety word. What protects your eyes?",
          support: 'The teacher says the word "first" to tell you the order.',
          extension: "What is one more way you stay safe in the science room?",
          wida: ["Process simple oral directions", "Identify key words"],
          vocabulary: [
            [
              "goggles",
              "special glasses that protect your eyes",
              "spanish: gafas protectoras",
            ],
            [
              "experiment",
              "a science test to learn something",
              "spanish: experimento",
            ],
            ["safety", "staying free from harm", "spanish: seguridad"],
          ],
          frames: ["First, I should ___.", "I put on ___ to stay safe."],
          listenFor: ["the word first", "a safety action", "the word goggles"],
          adminScript:
            "Listen carefully. Before our science experiment today, there are important steps. First, put on your safety goggles to protect your eyes. Then wait for me to give the liquid. Now answer: What should you do first?",
          teacher: {
            use: "Opening routine before any lab or hands-on task.",
            function: "Following oral directions, sequencing safety steps.",
            lower: "Read the script twice and point to a goggles picture.",
            onLevel: "Read once at a normal pace.",
            challenge: "Ask students to retell all the steps in order.",
            noTech:
              "Read the script aloud and have students hold up fingers for first, second, third.",
            prompt: "Why do you think we put on goggles before anything else?",
          },
        },
        {
          id: "v3-l-a-2",
          title: "Numbers in Math Class",
          skill: "Identifying spoken numbers and quantities",
          time: "5 min",
          directions: "Listen to the teacher. Choose the number you hear.",
          prompt: "How many pencils does the teacher have?",
          type: "multipleChoice",
          options: [
            { id: "a", text: "Twelve pencils", visual: "✏️" },
            { id: "b", text: "Twenty pencils", visual: "✏️" },
            { id: "c", text: "Two pencils", visual: "✏️" },
            { id: "d", text: "Ten pencils", visual: "✏️" },
          ],
          answer: "b",
          correct: "Nice work! You heard the number twenty clearly.",
          hint: 'Listen for the ending sound. Twelve and twenty sound close. Twenty ends with "-ty."',
          support:
            'Numbers that end in "-teen" are smaller. Numbers that end in "-ty" are bigger groups of ten.',
          extension: "Say a number between twenty and thirty out loud.",
          wida: ["Identify numbers in speech", "Match spoken quantity to word"],
          vocabulary: [
            ["twenty", "the number 20", "spanish: veinte"],
            ["twelve", "the number 12", "spanish: doce"],
            ["pencils", "tools you write with", "spanish: lapices"],
          ],
          frames: ["I hear ___ pencils.", "The number is ___."],
          listenFor: ["a number word", "the ending sound", "the noun pencils"],
          adminScript:
            "Listen. I am getting ready for math class. I count my pencils. I have twenty pencils on my desk. Now answer: How many pencils does the teacher have?",
          teacher: {
            use: "Warm-up to practice tricky number pairs (-teen vs -ty).",
            function: "Listening for numbers and quantities.",
            lower: "Hold up a card with 20 written on it after reading.",
            onLevel: "Read at normal speed once.",
            challenge: "Use two-digit numbers and a short word problem.",
            noTech:
              "Read aloud and have students write the number on a whiteboard.",
            prompt: "How is twenty different from twelve when you say them?",
          },
        },
      ],
      B: [
        {
          id: "v3-l-b-1",
          title: "Class Project Directions",
          skill: "Selecting multiple key details from speech",
          time: "6 min",
          directions:
            "Listen to the teacher explain the project. Choose ALL the things you need to bring.",
          prompt:
            "Which materials does the teacher say to bring for the group project?",
          type: "multiSelect",
          options: [
            { id: "a", text: "A poster board" },
            { id: "b", text: "Markers" },
            { id: "c", text: "A calculator" },
            { id: "d", text: "Glue" },
          ],
          answers: ["a", "b", "d"],
          correct:
            "Excellent! You caught all three materials: poster board, markers, and glue.",
          hint: 'Listen again. The teacher lists items with the word "and." The calculator was not on the list.',
          support:
            'When a speaker lists things, listen for the connecting words "and" or "also."',
          extension:
            "What else might a group need that the teacher did not say?",
          wida: [
            "Identify multiple details",
            "Distinguish relevant information",
          ],
          vocabulary: [
            [
              "materials",
              "the supplies you need for a task",
              "spanish: materiales",
            ],
            [
              "poster board",
              "a large stiff paper for displays",
              "spanish: cartulina",
            ],
            [
              "project",
              "a bigger task you build over time",
              "spanish: proyecto",
            ],
          ],
          frames: [
            "We need to bring ___ and ___.",
            "The teacher said to bring ___.",
          ],
          listenFor: [
            "a list of supplies",
            "the word and",
            "things you do not need",
          ],
          adminScript:
            "Listen carefully to the project directions. Tomorrow we start our group project. Please bring a poster board, some markers, and glue. You do not need a calculator for this project. Now choose all the materials the teacher said to bring.",
          teacher: {
            use: "Before launching a multi-day group project.",
            function: "Listening for lists and key details.",
            lower: "Pause after each item and let students check a box.",
            onLevel: "Read once at a steady pace.",
            challenge:
              "Add a distractor mid-list and ask students to explain why it does not belong.",
            noTech: "Read aloud; students raise hands for each correct item.",
            prompt: "Why does the teacher tell you what NOT to bring?",
          },
        },
        {
          id: "v3-l-b-2",
          title: "Steps of the Water Cycle Talk",
          skill: "Sequencing a spoken process",
          time: "6 min",
          directions:
            "Listen to the teacher describe the water cycle. Put the steps in the order you hear them.",
          prompt:
            "Order the steps of the water cycle as the teacher explains them.",
          type: "order",
          items: [
            { id: "i1", text: "The sun heats the water in the ocean." },
            { id: "i2", text: "Water vapor rises and cools into clouds." },
            { id: "i3", text: "Rain falls back to the ground." },
            { id: "i4", text: "Water flows in rivers back to the ocean." },
          ],
          answer: ["i1", "i2", "i3", "i4"],
          correct:
            "Perfect sequencing! You followed the order of evaporation, condensation, precipitation, and runoff.",
          hint: "Listen for order words like first, next, then, and finally.",
          support:
            'Speakers signal order with words such as "first," "then," and "finally."',
          extension: "Which step do you think repeats forever? Why?",
          wida: ["Sequence steps in oral discourse", "Follow signal words"],
          vocabulary: [
            [
              "evaporation",
              "when water turns into vapor and rises",
              "spanish: evaporacion",
            ],
            [
              "condensation",
              "when vapor cools and becomes water drops",
              "spanish: condensacion",
            ],
            [
              "precipitation",
              "rain, snow, or hail that falls",
              "spanish: precipitacion",
            ],
          ],
          frames: ["First, ___.", "Then ___ before ___."],
          listenFor: [
            "order words",
            "what happens to the water",
            "the last step",
          ],
          adminScript:
            "Listen to how the water cycle works. First, the sun heats the water in the ocean. Then the water vapor rises and cools into clouds. Next, rain falls back to the ground. Finally, the water flows in rivers back to the ocean. Now put the steps in order.",
          teacher: {
            use: "Science unit on Earth systems and cycles.",
            function: "Sequencing an oral explanation.",
            lower: "Give cut-apart step strips to move physically.",
            onLevel: "Read once at normal speed.",
            challenge:
              "Remove signal words and ask students to infer the order.",
            noTech: "Read aloud; students number the steps on paper.",
            prompt: "How do signal words help you follow a process?",
          },
        },
      ],
      C: [
        {
          id: "v3-l-c-1",
          title: "Comparing Two Class Surveys",
          skill: "Interpreting comparative data in speech",
          time: "7 min",
          directions:
            "Listen to the teacher compare two surveys. Choose ALL statements that are true.",
          prompt:
            "Which statements match what the teacher said about the two surveys?",
          type: "multiSelect",
          options: [
            { id: "a", text: "More students chose soccer than basketball." },
            { id: "b", text: "Basketball was the least popular sport." },
            { id: "c", text: "Swimming and basketball were tied." },
            { id: "d", text: "Soccer received the most votes overall." },
          ],
          answers: ["a", "d"],
          correct:
            "Strong listening! Soccer led the votes, and more students chose soccer than basketball.",
          hint: 'Listen for comparison words like "more," "fewer," and "the most." Swimming was not tied with basketball.',
          support:
            'Comparative language uses "more than," "fewer than," and "the most" to rank data.',
          extension: "Explain in one sentence how you would graph this data.",
          wida: ["Interpret comparative language", "Evaluate multiple claims"],
          vocabulary: [
            [
              "survey",
              "a set of questions to collect data",
              "spanish: encuesta",
            ],
            ["popular", "liked or chosen by many people", "spanish: popular"],
            [
              "compare",
              "to look at how things are alike or different",
              "spanish: comparar",
            ],
          ],
          frames: [
            "More students chose ___ than ___.",
            "The data shows that ___.",
          ],
          listenFor: [
            "comparison words",
            "the most popular choice",
            "a false statement",
          ],
          adminScript:
            "Listen as I compare our two class surveys. In the first survey, soccer received the most votes. More students chose soccer than basketball. Basketball had more votes than swimming, so swimming was the least popular. Now choose all the statements that are true.",
          teacher: {
            use: "Math or advisory lesson on reading and discussing data.",
            function: "Interpreting comparative oral information.",
            lower: "Provide a simple bar graph to follow along.",
            onLevel: "Read once at a measured pace.",
            challenge: "Add percentages and ask for a written comparison.",
            noTech: "Read aloud; students mark true or false on paper.",
            prompt:
              "Which sentence was hardest to judge true or false, and why?",
          },
        },
        {
          id: "v3-l-c-2",
          title: "Filling Gaps in a Science Lecture",
          skill: "Catching precise academic vocabulary",
          time: "7 min",
          directions:
            "Listen to the short lecture. Then complete the summary by choosing the correct word for each blank.",
          prompt: "Complete the summary of the lecture about ecosystems.",
          type: "cloze",
          segments: [
            { text: "In an ecosystem, plants are called " },
            {
              blank: {
                id: "b1",
                answer: "producers",
                options: ["producers", "consumers", "decomposers"],
              },
            },
            {
              text: " because they make their own food. Animals that eat plants are ",
            },
            {
              blank: {
                id: "b2",
                answer: "consumers",
                options: ["producers", "consumers", "predators"],
              },
            },
            { text: ", and the fungi that break down dead matter are " },
            {
              blank: {
                id: "b3",
                answer: "decomposers",
                options: ["decomposers", "producers", "herbivores"],
              },
            },
            { text: "." },
          ],
          correct:
            "Excellent! You matched producers, consumers, and decomposers to their roles.",
          hint: "Listen again for what each group does: makes food, eats food, or breaks down food.",
          support:
            "Each role connects to an action: producers make, consumers eat, decomposers break down.",
          extension:
            "Give one real example of a decomposer you might find outside.",
          wida: ["Process academic vocabulary", "Connect terms to functions"],
          vocabulary: [
            [
              "producer",
              "an organism that makes its own food",
              "spanish: productor",
            ],
            [
              "consumer",
              "an organism that eats other organisms",
              "spanish: consumidor",
            ],
            [
              "decomposer",
              "an organism that breaks down dead matter",
              "spanish: descomponedor",
            ],
          ],
          frames: [
            "A ___ makes its own food.",
            "A ___ breaks down dead matter.",
          ],
          listenFor: [
            "roles in an ecosystem",
            "what each group does",
            "academic science words",
          ],
          adminScript:
            "Listen to this short lecture about ecosystems. In every ecosystem, plants are producers because they make their own food using sunlight. Animals that eat plants are consumers. Finally, fungi and bacteria are decomposers because they break down dead plants and animals. Now complete the summary.",
          teacher: {
            use: "Life science unit on ecosystems and food webs.",
            function: "Listening for precise academic terms.",
            lower: "Provide a word bank with picture cues.",
            onLevel: "Play once at normal pace.",
            challenge:
              "Remove options and have students recall terms from memory.",
            noTech: "Read aloud; students fill blanks on a printed summary.",
            prompt: "How does each role keep the ecosystem in balance?",
          },
        },
      ],
    },
    Reading: {
      A: [
        {
          id: "v3-r-a-1",
          title: "A Note from the Office",
          skill: "Locating explicit information",
          time: "5 min",
          directions:
            "Read the note. Click the sentence that tells WHEN the assembly starts.",
          prompt: "Click the sentence that tells when the assembly begins.",
          type: "hotText",
          passageTitle: "School Announcement",
          passage: [
            "Good morning, students.",
            "There is a school assembly today.",
            "The assembly starts at ten o'clock in the gym.",
            "Please walk quietly with your class.",
          ],
          sentences: [
            { id: "s1", text: "Good morning, students." },
            { id: "s2", text: "There is a school assembly today." },
            {
              id: "s3",
              text: "The assembly starts at ten o'clock in the gym.",
            },
            { id: "s4", text: "Please walk quietly with your class." },
          ],
          answers: ["s3"],
          correct: "Yes! That sentence gives the time: ten o'clock.",
          hint: 'Look for a time word like "o\'clock" or a number with a clock.',
          support:
            'Time information often includes a number and the word "o\'clock" or "a.m."',
          extension: "What sentence tells you WHERE the assembly is?",
          wida: ["Locate explicit detail", "Identify time information"],
          vocabulary: [
            ["assembly", "a meeting of the whole school", "spanish: asamblea"],
            [
              "gym",
              "the room for sports and big meetings",
              "spanish: gimnasio",
            ],
            ["quietly", "without making noise", "spanish: en silencio"],
          ],
          frames: ["The assembly starts at ___.", "It is in the ___."],
          readFor: ["a time word", "the word assembly", "the place"],
          teacher: {
            use: "Building skill of finding key details in school texts.",
            function: "Locating explicit information in a short notice.",
            lower: "Highlight the time word together first.",
            onLevel: "Let students read independently.",
            challenge: "Ask students to find time and place in one read.",
            noTech: "Print the note and have students underline the time.",
            prompt: "Where else do you read school notices like this?",
          },
        },
        {
          id: "v3-r-a-2",
          title: "Parts of a Plant",
          skill: "Completing a sentence from a short text",
          time: "5 min",
          directions:
            "Read about plants. Then complete the sentence with the correct word.",
          prompt: "Use the text to finish the sentence about plants.",
          type: "cloze",
          passageTitle: "How Plants Grow",
          passage: [
            "Plants have roots under the ground.",
            "The roots take in water from the soil.",
            "The leaves use sunlight to make food.",
          ],
          segments: [
            { text: "The " },
            {
              blank: {
                id: "b1",
                answer: "roots",
                options: ["roots", "leaves", "flowers"],
              },
            },
            { text: " take in water from the soil, and the " },
            {
              blank: {
                id: "b2",
                answer: "leaves",
                options: ["leaves", "roots", "seeds"],
              },
            },
            { text: " use sunlight to make food." },
          ],
          correct: "Well done! Roots take in water and leaves use sunlight.",
          hint: "Reread the text. Which part is under the ground? Which part is up in the sunlight?",
          support: "Match each plant part to its job in the text.",
          extension: "Draw a plant and label the roots and leaves.",
          wida: [
            "Match text detail to a sentence",
            "Identify part-function pairs",
          ],
          vocabulary: [
            [
              "roots",
              "the part of a plant under the ground",
              "spanish: raices",
            ],
            [
              "leaves",
              "the flat green parts that catch sunlight",
              "spanish: hojas",
            ],
            ["soil", "the dirt where plants grow", "spanish: tierra"],
          ],
          frames: ["The ___ take in water.", "The ___ make food."],
          readFor: ["plant parts", "what each part does", "the word water"],
          teacher: {
            use: "Science vocabulary support for newcomers.",
            function: "Reading short informational text for detail.",
            lower: "Show a labeled plant diagram alongside.",
            onLevel: "Read independently then fill blanks.",
            challenge: "Add a third part (stem) and its function.",
            noTech: "Print and have students write the words in.",
            prompt: "Which plant part do you think is most important? Why?",
          },
        },
      ],
      B: [
        {
          id: "v3-r-b-1",
          title: "Finding the Main Reason",
          skill: "Identifying supporting evidence",
          time: "6 min",
          directions:
            "Read the paragraph. Click the TWO sentences that explain why bees are important.",
          prompt:
            "Click the two sentences that give reasons bees are important to people.",
          type: "hotText",
          passageTitle: "Why Bees Matter",
          passage: [
            "Many people are afraid of bees because they can sting.",
            "However, bees do important work for our food supply.",
            "When bees move from flower to flower, they spread pollen so plants can grow fruit.",
            "Without bees, many crops like apples and almonds would produce far less food.",
            "Bees also make honey that people enjoy.",
          ],
          sentences: [
            {
              id: "s1",
              text: "Many people are afraid of bees because they can sting.",
            },
            {
              id: "s2",
              text: "However, bees do important work for our food supply.",
            },
            {
              id: "s3",
              text: "When bees move from flower to flower, they spread pollen so plants can grow fruit.",
            },
            {
              id: "s4",
              text: "Without bees, many crops like apples and almonds would produce far less food.",
            },
            { id: "s5", text: "Bees also make honey that people enjoy." },
          ],
          answers: ["s3", "s4"],
          correct:
            "Great evidence-finding! Spreading pollen and helping crops grow are the key reasons bees matter to our food.",
          hint: "The question asks about FOOD. Which sentences connect bees to growing crops or fruit?",
          support:
            "Evidence sentences directly support the claim. Ask: does this sentence explain the main idea?",
          extension:
            "Which sentence is a fact people FEAR, not a reason bees help us?",
          wida: [
            "Identify supporting evidence",
            "Distinguish main idea from detail",
          ],
          vocabulary: [
            [
              "pollen",
              "a powder bees move so plants make fruit",
              "spanish: polen",
            ],
            ["crops", "plants farmers grow for food", "spanish: cultivos"],
            [
              "supply",
              "the amount of something available",
              "spanish: suministro",
            ],
          ],
          frames: [
            "Bees are important because ___.",
            "One reason is that ___.",
          ],
          readFor: [
            "reasons bees help",
            "the word food or crops",
            "a sentence about fear",
          ],
          teacher: {
            use: "Teaching claim and evidence in informational text.",
            function: "Reading for supporting details.",
            lower: 'Underline the question word "food" first.',
            onLevel: "Students select evidence independently.",
            challenge: "Ask students to rank the two reasons by strength.",
            noTech: "Print and have students box the evidence sentences.",
            prompt: "How would you convince someone bees are worth protecting?",
          },
        },
        {
          id: "v3-r-b-2",
          title: "Picking the Right Word in Context",
          skill: "Using context to choose vocabulary",
          time: "6 min",
          directions:
            "Read the paragraph. Then choose the correct words to complete the summary.",
          prompt: "Complete the summary about volcanoes using the passage.",
          type: "cloze",
          passageTitle: "Mountains of Fire",
          passage: [
            "A volcano is an opening in Earth's surface where hot melted rock can escape.",
            "Below the ground, this melted rock is called magma.",
            "When magma reaches the surface during an eruption, it is called lava.",
            "Over many years, cooled lava can build up and form a tall mountain.",
          ],
          segments: [
            { text: "Melted rock under the ground is called " },
            {
              blank: {
                id: "b1",
                answer: "magma",
                options: ["magma", "lava", "ash"],
              },
            },
            { text: ". When it reaches the surface, it is called " },
            {
              blank: {
                id: "b2",
                answer: "lava",
                options: ["lava", "magma", "smoke"],
              },
            },
            { text: ", and over time it can build a tall " },
            {
              blank: {
                id: "b3",
                answer: "mountain",
                options: ["mountain", "river", "valley"],
              },
            },
            { text: "." },
          ],
          correct:
            "Nicely done! You tracked how magma becomes lava and builds a mountain.",
          hint: "Reread the passage. One word is for melted rock BELOW ground, the other for ABOVE ground.",
          support:
            "Use the surrounding sentences to decide which word fits each blank.",
          extension:
            'Write one sentence using both "magma" and "lava" correctly.',
          wida: ["Use context clues", "Differentiate related terms"],
          vocabulary: [
            ["magma", "melted rock below the ground", "spanish: magma"],
            ["lava", "melted rock that reaches the surface", "spanish: lava"],
            ["eruption", "when a volcano bursts out", "spanish: erupcion"],
          ],
          frames: ["Below ground it is ___.", "On the surface it is ___."],
          readFor: [
            "the word below ground",
            "the word surface",
            "how the mountain forms",
          ],
          teacher: {
            use: "Earth science vocabulary with context support.",
            function: "Reading for precise word meaning.",
            lower: "Color-code below-ground vs surface words.",
            onLevel: "Complete independently after one read.",
            challenge: "Remove options and recall terms.",
            noTech: "Print and fill blanks by hand.",
            prompt:
              "Why do scientists use two different words for the same melted rock?",
          },
        },
      ],
      C: [
        {
          id: "v3-r-c-1",
          title: "Author's Argument and Evidence",
          skill: "Evaluating claim and support",
          time: "7 min",
          directions:
            "Read the editorial. Click the ONE sentence that states the author's main claim.",
          prompt:
            "Click the sentence that best states the author's main argument.",
          type: "hotText",
          passageTitle: "More Time for Recess",
          passage: [
            "Many middle schools have shortened recess to add more class minutes.",
            "Students at our school should have a longer recess break each day.",
            "Studies show that short outdoor breaks help students focus better when they return to class.",
            "Teachers report fewer behavior problems on days when students get to move around.",
            "Even a short walk can lower stress and improve memory.",
          ],
          sentences: [
            {
              id: "s1",
              text: "Many middle schools have shortened recess to add more class minutes.",
            },
            {
              id: "s2",
              text: "Students at our school should have a longer recess break each day.",
            },
            {
              id: "s3",
              text: "Studies show that short outdoor breaks help students focus better when they return to class.",
            },
            {
              id: "s4",
              text: "Teachers report fewer behavior problems on days when students get to move around.",
            },
            {
              id: "s5",
              text: "Even a short walk can lower stress and improve memory.",
            },
          ],
          answers: ["s2"],
          correct:
            "Exactly! That sentence states what the author wants: a longer recess. The others are evidence.",
          hint: "A claim states an opinion or what should happen. Evidence gives facts and studies.",
          support:
            'A main claim often uses words like "should" and states a position, not just a fact.',
          extension:
            "Choose one piece of evidence and explain how it supports the claim.",
          wida: [
            "Distinguish claim from evidence",
            "Analyze argument structure",
          ],
          vocabulary: [
            [
              "claim",
              "the main point the author argues",
              "spanish: afirmacion",
            ],
            ["evidence", "facts that support a point", "spanish: evidencia"],
            [
              "editorial",
              "an article that gives an opinion",
              "spanish: editorial",
            ],
          ],
          frames: [
            "The author's claim is that ___.",
            "This is a claim because ___.",
          ],
          readFor: [
            "the word should",
            "a sentence with an opinion",
            "facts that support it",
          ],
          teacher: {
            use: "Reading argumentative text and analyzing structure.",
            function: "Identifying claim versus supporting evidence.",
            lower: "Define claim with a clear example first.",
            onLevel: "Select the claim independently.",
            challenge: "Ask students to evaluate which evidence is strongest.",
            noTech:
              "Print and have students label C for claim, E for evidence.",
            prompt:
              "Would this argument convince your principal? Why or why not?",
          },
        },
        {
          id: "v3-r-c-2",
          title: "Synthesizing Two Details",
          skill: "Selecting accurate inferences",
          time: "7 min",
          directions:
            "Read the passage about rainforests. Choose ALL statements that the text supports.",
          prompt: "Which statements are supported by the passage?",
          type: "multiSelect",
          passageTitle: "The Layers of the Rainforest",
          passage: [
            "A tropical rainforest has several layers, each with different conditions.",
            "The top layer, the canopy, blocks most sunlight from reaching the ground.",
            "Because little light reaches the forest floor, few plants grow there.",
            "Many animals live high in the canopy where food and sunlight are plentiful.",
            "The forest floor is dark, damp, and covered with decaying leaves.",
          ],
          options: [
            {
              id: "a",
              text: "The canopy receives more sunlight than the forest floor.",
            },
            {
              id: "b",
              text: "Few plants grow on the forest floor because of low light.",
            },
            { id: "c", text: "All rainforest animals live on the ground." },
            { id: "d", text: "The forest floor stays damp and dark." },
          ],
          answers: ["a", "b", "d"],
          correct:
            "Strong synthesis! The text supports that the canopy gets more light, the floor has few plants, and the floor is damp and dark.",
          hint: "One choice overgeneralizes. The text says MANY animals live in the canopy, not that ALL animals live on the ground.",
          support:
            'A supported statement must match the text. Watch for absolute words like "all" that the text does not prove.',
          extension:
            "Write one inference the text suggests but does not state directly.",
          wida: ["Synthesize multiple details", "Evaluate validity of claims"],
          vocabulary: [
            [
              "canopy",
              "the top layer of treetops in a forest",
              "spanish: dosel",
            ],
            [
              "decaying",
              "slowly rotting or breaking down",
              "spanish: en descomposicion",
            ],
            ["plentiful", "available in large amounts", "spanish: abundante"],
          ],
          frames: [
            "The text supports that ___.",
            "This is not supported because ___.",
          ],
          readFor: [
            "which layer gets light",
            "why few plants grow",
            "an overgeneralization",
          ],
          teacher: {
            use: "Reading dense informational text and testing inferences.",
            function: "Synthesizing details and rejecting unsupported claims.",
            lower: "Map each layer on a simple diagram.",
            onLevel: "Select all supported statements independently.",
            challenge:
              "Ask students to rewrite the false choice to make it accurate.",
            noTech: "Print and have students mark true/false with text proof.",
            prompt: "How does limited sunlight shape life in the rainforest?",
          },
        },
      ],
    },
    Writing: {
      A: [
        {
          id: "v3-w-a-1",
          title: "Describe Your Classroom",
          skill: "Writing simple descriptive sentences",
          time: "6 min",
          directions:
            "Write two sentences about your classroom. Use words from the word bank.",
          prompt: "What do you see in your classroom? Write two sentences.",
          type: "constructed",
          responseLabel: "Your sentences",
          responsePlaceholder: "In my classroom, there is a ...",
          wordBank: [
            "desk",
            "board",
            "window",
            "teacher",
            "book",
            "there is",
            "there are",
          ],
          correct:
            "Nice writing! You described your classroom with clear nouns.",
          hint: 'Start with "There is" for one thing or "There are" for many things.',
          support:
            'Use the frame "There is a ___" and add a describing word like big or new.',
          extension: "Add one color word to make your sentence stronger.",
          wida: ["Produce simple descriptive sentences", "Use everyday nouns"],
          vocabulary: [
            ["desk", "a table where you do work", "spanish: escritorio"],
            ["board", "the surface the teacher writes on", "spanish: pizarra"],
            ["window", "the glass opening in the wall", "spanish: ventana"],
          ],
          frames: ["There is a ___.", "There are many ___."],
          teacher: {
            use: "Early writing warm-up for newcomers.",
            function: "Producing simple sentences with there is/there are.",
            lower: "Provide a picture of a classroom to label first.",
            onLevel: "Write two sentences from the word bank.",
            challenge: "Add an adjective to each sentence.",
            noTech: "Write on paper and read aloud to a partner.",
            prompt: "Which part of your classroom do you like best?",
          },
        },
        {
          id: "v3-w-a-2",
          title: "My Morning Routine",
          skill: "Sequencing with time words",
          time: "6 min",
          directions:
            "Write three short sentences about your morning. Use first, then, and last.",
          prompt:
            "What do you do in the morning before school? Write three sentences in order.",
          type: "constructed",
          responseLabel: "Your sentences",
          responsePlaceholder: "First, I wake up.",
          wordBank: [
            "first",
            "then",
            "last",
            "wake up",
            "eat",
            "brush",
            "walk",
            "I",
          ],
          correct:
            "Great sequencing! You used time words to show the order of your morning.",
          hint: "Begin each sentence with a time word: First, Then, Last.",
          support:
            'Use the frame "First, I ___." Then start the next sentence with "Then."',
          extension: "Add what time you do one of these things.",
          wida: ["Sequence events", "Use time-order words"],
          vocabulary: [
            [
              "routine",
              "things you do the same way each day",
              "spanish: rutina",
            ],
            ["first", "the thing you do at the start", "spanish: primero"],
            ["last", "the thing you do at the end", "spanish: ultimo"],
          ],
          frames: ["First, I ___.", "Then I ___.", "Last, I ___."],
          teacher: {
            use: "Practicing narrative sequence with familiar topics.",
            function: "Writing a short ordered sequence.",
            lower: "Provide picture cards to arrange first.",
            onLevel: "Write three ordered sentences.",
            challenge: "Add a fourth step and a time.",
            noTech: "Write on paper and number the steps.",
            prompt: "Which part of your morning is the hardest? Why?",
          },
        },
      ],
      B: [
        {
          id: "v3-w-b-1",
          title: "Explain a Bar Graph",
          skill: "Describing data in writing",
          time: "8 min",
          directions:
            "Imagine a class survey. Write 3-4 sentences that explain what the data shows. Use comparison words.",
          prompt:
            "Our class voted for favorite lunch: pizza got 14 votes, tacos got 9, and salad got 4. Explain what the data shows.",
          type: "constructed",
          responseLabel: "Your explanation",
          responsePlaceholder: "The data shows that ...",
          wordBank: [
            "most",
            "fewer",
            "more than",
            "least",
            "the data shows",
            "compared to",
            "votes",
          ],
          correct:
            "Well explained! You used comparison words to describe the data clearly.",
          hint: 'Use words like "most," "fewer than," and "the least" to compare the numbers.',
          support:
            'Start with "The data shows that ___." Then compare two choices using "more than."',
          extension:
            "Predict what might change if the class voted again next month.",
          wida: ["Describe quantitative data", "Use comparative language"],
          vocabulary: [
            ["data", "facts or numbers you collect", "spanish: datos"],
            ["compare", "to show how things differ", "spanish: comparar"],
            ["popular", "chosen by many people", "spanish: popular"],
          ],
          frames: [
            "The data shows that ___.",
            "More students chose ___ than ___.",
            "The least popular was ___.",
          ],
          teacher: {
            use: "Integrating math data talk into writing.",
            function: "Writing an explanation of comparative data.",
            lower: "Provide the bar graph drawn out.",
            onLevel: "Write 3-4 sentences with comparison words.",
            challenge: "Add the total number of votes and a percentage.",
            noTech: "Write on paper; share with a partner.",
            prompt: "Why might pizza be the most popular choice?",
          },
        },
        {
          id: "v3-w-b-2",
          title: "Summarize a Short Text",
          skill: "Writing a brief summary",
          time: "8 min",
          directions:
            "Read the short text in your head, then write a 3-4 sentence summary in your own words.",
          prompt:
            'Summarize: "Recycling turns used items into new products. It saves energy and keeps trash out of landfills. Many cities now collect paper, plastic, and glass at the curb." Write a summary.',
          type: "constructed",
          responseLabel: "Your summary",
          responsePlaceholder: "This text is mainly about ...",
          wordBank: [
            "main idea",
            "according to the text",
            "the author explains",
            "for example",
            "in summary",
            "recycling",
          ],
          correct:
            "Good summary! You captured the main idea and key details in your own words.",
          hint: "A summary states the main idea first, then one or two key details. Do not copy the text exactly.",
          support:
            'Begin with "This text is mainly about ___." Then add one benefit the author gives.',
          extension:
            "Add one opinion sentence telling whether you think recycling is worth it.",
          wida: ["Summarize informational text", "Paraphrase in own words"],
          vocabulary: [
            [
              "summary",
              "a short retelling of the main points",
              "spanish: resumen",
            ],
            [
              "recycling",
              "making used items into new ones",
              "spanish: reciclaje",
            ],
            ["landfill", "a place where trash is buried", "spanish: vertedero"],
          ],
          frames: [
            "This text is mainly about ___.",
            "According to the text, ___.",
            "In summary, ___.",
          ],
          teacher: {
            use: "Building summary writing across content areas.",
            function: "Writing a concise paraphrased summary.",
            lower: "Provide a sentence starter for each detail.",
            onLevel: "Write a 3-4 sentence summary.",
            challenge: "Limit the summary to exactly two sentences.",
            noTech: "Write on paper and underline the main idea.",
            prompt: "Why is it important to use your own words in a summary?",
          },
        },
      ],
      C: [
        {
          id: "v3-w-c-1",
          title: "Make and Support an Argument",
          skill: "Writing a claim with evidence",
          time: "9 min",
          directions:
            "Write a short paragraph (4-6 sentences) that states a claim and supports it with two reasons.",
          prompt:
            "Should students be allowed to use phones during lunch? State your claim and support it with two reasons.",
          type: "constructed",
          responseLabel: "Your paragraph",
          responsePlaceholder: "I believe that ...",
          wordBank: [
            "I believe",
            "one reason",
            "another reason",
            "for example",
            "therefore",
            "on the other hand",
            "in conclusion",
          ],
          correct:
            "Strong argument! You stated a clear claim and backed it with reasons and a conclusion.",
          hint: "Start with your claim, give two reasons, add an example, and finish with a conclusion sentence.",
          support:
            "Use the structure: claim, reason one, reason two, example, conclusion.",
          extension:
            "Add one sentence that answers a person who disagrees with you.",
          wida: [
            "Develop an argument",
            "Support a claim with reasons",
            "Use cohesive transitions",
          ],
          vocabulary: [
            ["claim", "the position you argue for", "spanish: afirmacion"],
            ["reason", "why your claim is true", "spanish: razon"],
            [
              "conclusion",
              "the sentence that wraps up your idea",
              "spanish: conclusion",
            ],
          ],
          frames: [
            "I believe that ___.",
            "One reason is ___.",
            "Therefore, ___.",
          ],
          teacher: {
            use: "Argument writing across content areas.",
            function:
              "Writing a claim with supporting evidence and transitions.",
            lower: "Provide the paragraph frame to fill in.",
            onLevel: "Write the paragraph using transitions.",
            challenge: "Require a counterargument and rebuttal.",
            noTech: "Write on paper; peer review with a partner.",
            prompt: "What is the strongest reason for your side?",
          },
        },
        {
          id: "v3-w-c-2",
          title: "Compare Two Choices",
          skill: "Writing a compare-and-contrast response",
          time: "9 min",
          directions:
            "Write a paragraph comparing two ways to get to school. Explain which is better and why.",
          prompt:
            "Compare riding the bus and walking to school. Which is better and why? Write 4-6 sentences.",
          type: "constructed",
          responseLabel: "Your paragraph",
          responsePlaceholder: "Both riding the bus and walking ...",
          wordBank: [
            "both",
            "however",
            "while",
            "on the other hand",
            "in contrast",
            "similarly",
            "overall",
          ],
          correct:
            "Excellent comparison! You showed similarities and differences and reached a clear conclusion.",
          hint: "Show one way they are alike and two ways they are different, then state which is better.",
          support:
            'Use "Both ___" to show similarity and "However" or "In contrast" to show difference.',
          extension:
            "Add a sentence about which choice is better in bad weather.",
          wida: ["Compare and contrast", "Organize ideas with transitions"],
          vocabulary: [
            ["compare", "to show how things are alike", "spanish: comparar"],
            [
              "contrast",
              "to show how things are different",
              "spanish: contrastar",
            ],
            [
              "overall",
              "considering everything together",
              "spanish: en general",
            ],
          ],
          frames: [
            "Both ___ and ___ are ___.",
            "However, ___.",
            "Overall, ___ is better because ___.",
          ],
          teacher: {
            use: "Compare-and-contrast writing structure.",
            function: "Writing an organized comparison with a conclusion.",
            lower: "Provide a Venn diagram to plan.",
            onLevel: "Write the comparison paragraph.",
            challenge: "Compare three options instead of two.",
            noTech: "Plan with a Venn diagram on paper, then write.",
            prompt: "How did you decide which choice was better?",
          },
        },
      ],
    },
    Speaking: {
      A: [
        {
          id: "v3-s-a-1",
          title: "Tell About a Picture",
          skill: "Describing what you see orally",
          time: "5 min",
          directions:
            "Look at a picture in your mind of a park. Plan and then say three sentences about it.",
          prompt:
            "Describe a park. Say three sentences about what you see and do there.",
          type: "constructed",
          responseLabel: "Planning notes",
          responsePlaceholder: "I see ... I can ...",
          wordBank: [
            "I see",
            "there is",
            "I can",
            "play",
            "tree",
            "swing",
            "grass",
          ],
          correct:
            "Nice speaking! You described the park with clear nouns and actions.",
          hint: 'Start with "I see" and then say one thing you can do there.',
          support: 'Use "I see a ___" for things and "I can ___" for actions.',
          extension: "Add one feeling word, like happy, to your description.",
          wida: ["Describe a familiar scene", "Use everyday vocabulary"],
          vocabulary: [
            ["park", "an outdoor place to play and relax", "spanish: parque"],
            ["swing", "a seat that moves back and forth", "spanish: columpio"],
            ["grass", "the green plants on the ground", "spanish: cesped"],
          ],
          frames: ["I see a ___.", "There is a ___.", "I can ___."],
          adminScript:
            "Look at the park in your mind. I want you to describe it. Say at least three sentences. Tell me what you see and one thing you can do there. You have one minute to plan and then you will speak.",
          teacher: {
            use: "Oral language warm-up for newcomers.",
            function: "Describing a familiar place aloud.",
            lower: "Provide a real park picture to look at.",
            onLevel: "Plan briefly then speak three sentences.",
            challenge: "Describe two places and compare them.",
            noTech: "Speak to a partner who gives one kind comment.",
            prompt: "What do you like to do at a park?",
          },
        },
        {
          id: "v3-s-a-2",
          title: "Ask for Help Politely",
          skill: "Using polite school phrases",
          time: "5 min",
          directions:
            "Plan what you would say to ask your teacher for help. Then say it aloud.",
          prompt:
            "You do not understand the homework. Ask your teacher for help in two polite sentences.",
          type: "constructed",
          responseLabel: "Planning notes",
          responsePlaceholder: "Excuse me, ...",
          wordBank: [
            "excuse me",
            "could you",
            "please",
            "help me",
            "I don't understand",
            "thank you",
          ],
          correct:
            "Polite and clear! You asked for help the right way and said thank you.",
          hint: 'Begin with "Excuse me" and use the word "please."',
          support: 'Use the frame "Could you please help me with ___?"',
          extension:
            "How would you ask a classmate for help instead of the teacher?",
          wida: ["Use polite request language", "Communicate a need"],
          vocabulary: [
            ["excuse me", "a polite way to get attention", "spanish: disculpe"],
            ["understand", "to know what something means", "spanish: entender"],
            ["polite", "kind and respectful", "spanish: cortes"],
          ],
          frames: [
            "Excuse me, could you please ___?",
            "I don't understand ___.",
            "Thank you.",
          ],
          adminScript:
            "Imagine you do not understand your homework. You need to ask your teacher for help. Plan two polite sentences. Remember to be polite and to say thank you. You have one minute to plan, then you will speak.",
          teacher: {
            use: "Functional language for classroom survival skills.",
            function: "Making a polite request orally.",
            lower: "Model the sentence and have students repeat.",
            onLevel: "Plan then speak two polite sentences.",
            challenge: "Add a specific detail about what is confusing.",
            noTech: "Role-play with a partner as teacher and student.",
            prompt:
              "Why is it important to ask for help when you are confused?",
          },
        },
      ],
      B: [
        {
          id: "v3-s-b-1",
          title: "Explain How to Do Something",
          skill: "Giving sequenced oral directions",
          time: "7 min",
          directions:
            "Plan how to explain a simple process. Then speak 4-5 sentences with order words.",
          prompt:
            "Explain how to make a simple sandwich. Use order words like first, next, then, and finally.",
          type: "constructed",
          responseLabel: "Planning notes",
          responsePlaceholder: "First, you ...",
          wordBank: [
            "first",
            "next",
            "then",
            "after that",
            "finally",
            "you need",
            "put",
            "add",
          ],
          correct:
            "Clear directions! You sequenced the steps with strong order words.",
          hint: "Use a different order word for each step: first, next, then, finally.",
          support:
            'Start each step with an order word, like "First, you take two slices of bread."',
          extension: "Explain what could go wrong if you skip a step.",
          wida: ["Sequence oral directions", "Use procedural language"],
          vocabulary: [
            ["process", "a set of steps to do something", "spanish: proceso"],
            ["sequence", "the order of the steps", "spanish: secuencia"],
            [
              "ingredient",
              "a food item you use in a recipe",
              "spanish: ingrediente",
            ],
          ],
          frames: ["First, you ___.", "Next, you ___.", "Finally, ___."],
          adminScript:
            "I want you to explain how to make a simple sandwich. Speak four or five sentences. Use order words like first, next, then, and finally so I can follow your steps. You have one minute to plan, then you will speak.",
          teacher: {
            use: "Practicing procedural oral language.",
            function: "Explaining a process in sequence.",
            lower: "Provide step pictures to order first.",
            onLevel: "Speak 4-5 sequenced sentences.",
            challenge: "Explain a school process like signing into class.",
            noTech: "Explain to a partner who follows the steps with gestures.",
            prompt: "What makes directions easy to follow?",
          },
        },
        {
          id: "v3-s-b-2",
          title: "Give an Opinion with a Reason",
          skill: "Stating and supporting an opinion orally",
          time: "7 min",
          directions:
            "Plan your opinion and one reason. Then speak 3-4 sentences.",
          prompt:
            "What is the best way to spend a free afternoon? State your opinion and give a reason and example.",
          type: "constructed",
          responseLabel: "Planning notes",
          responsePlaceholder: "In my opinion, ...",
          wordBank: [
            "in my opinion",
            "I think",
            "because",
            "for example",
            "that is why",
            "I prefer",
          ],
          correct:
            "Well said! You stated a clear opinion and backed it with a reason and example.",
          hint: 'After your opinion, use the word "because" to give a reason.',
          support: 'Use the frame "In my opinion, ___ because ___."',
          extension:
            "Add a sentence about a different opinion someone might have.",
          wida: ["Express an opinion", "Provide a reason and example"],
          vocabulary: [
            ["opinion", "what you think or believe", "spanish: opinion"],
            ["reason", "why you think something", "spanish: razon"],
            ["prefer", "to like one thing more", "spanish: preferir"],
          ],
          frames: [
            "In my opinion, ___.",
            "I think this because ___.",
            "For example, ___.",
          ],
          adminScript:
            "Think about the best way to spend a free afternoon. I want to hear your opinion. Speak three or four sentences. State your opinion, give one reason using the word because, and add an example. You have one minute to plan, then speak.",
          teacher: {
            use: "Building opinion and support in speaking.",
            function: "Stating an opinion with a reason and example.",
            lower: "Offer two opinion choices to pick from.",
            onLevel: "Speak 3-4 sentences with a reason.",
            challenge: "Add a counter-opinion and respond to it.",
            noTech: "Share opinions in a small circle.",
            prompt: "How did your reason make your opinion stronger?",
          },
        },
      ],
      C: [
        {
          id: "v3-s-c-1",
          title: "Present and Defend a Position",
          skill: "Delivering a brief persuasive response",
          time: "8 min",
          directions:
            "Plan a short persuasive talk. Then speak 5-6 sentences with a claim, two reasons, and a conclusion.",
          prompt:
            "Should our school have a longer lunch period? Take a position and defend it with two reasons and a conclusion.",
          type: "constructed",
          responseLabel: "Planning notes",
          responsePlaceholder: "I strongly believe ...",
          wordBank: [
            "I strongly believe",
            "first of all",
            "in addition",
            "furthermore",
            "however",
            "in conclusion",
            "evidence",
          ],
          correct:
            "Persuasive and organized! You delivered a claim, two reasons, and a conclusion.",
          hint: 'Open with your claim, use "first of all" and "in addition" for reasons, and close with "in conclusion."',
          support:
            "Structure your talk: claim, reason one, reason two, conclusion.",
          extension: "Add one sentence that answers someone who disagrees.",
          wida: [
            "Deliver a persuasive talk",
            "Organize with transitions",
            "Defend a position",
          ],
          vocabulary: [
            [
              "position",
              "the side you take in an argument",
              "spanish: postura",
            ],
            ["persuade", "to convince someone", "spanish: persuadir"],
            ["furthermore", "in addition to that", "spanish: ademas"],
          ],
          frames: [
            "I strongly believe ___.",
            "First of all, ___.",
            "In conclusion, ___.",
          ],
          adminScript:
            "I want you to give a short persuasive talk about whether our school should have a longer lunch period. Take a clear position. Speak five or six sentences. Include a claim, two reasons, and a conclusion. Use transition words to connect your ideas. You have two minutes to plan, then you will speak.",
          teacher: {
            use: "Persuasive oral presentation practice.",
            function: "Defending a position with organized reasons.",
            lower: "Provide a talk outline to fill in.",
            onLevel: "Speak 5-6 organized sentences.",
            challenge: "Respond live to a counterargument from a peer.",
            noTech: "Present to a small group that votes after.",
            prompt: "Which reason do you think was most convincing?",
          },
        },
        {
          id: "v3-s-c-2",
          title: "Compare and Recommend",
          skill: "Comparing options and recommending one",
          time: "8 min",
          directions:
            "Plan a talk comparing two after-school activities. Then speak 5-6 sentences and recommend one.",
          prompt:
            "Compare joining the science club and joining the soccer team. Compare them and recommend one for a new student.",
          type: "constructed",
          responseLabel: "Planning notes",
          responsePlaceholder: "Both the science club and the soccer team ...",
          wordBank: [
            "both",
            "while",
            "on the other hand",
            "in contrast",
            "I would recommend",
            "because",
            "overall",
          ],
          correct:
            "Excellent! You compared both options fairly and gave a clear recommendation with reasons.",
          hint: "Show one similarity, two differences, then recommend one with a reason.",
          support:
            'Use "Both ___" for similarity and "On the other hand" for difference, then recommend.',
          extension:
            "Explain how your recommendation might change for a different student.",
          wida: [
            "Compare and contrast orally",
            "Make and justify a recommendation",
          ],
          vocabulary: [
            ["recommend", "to suggest as a good choice", "spanish: recomendar"],
            [
              "activity",
              "something you do for fun or learning",
              "spanish: actividad",
            ],
            ["benefit", "a good result of something", "spanish: beneficio"],
          ],
          frames: [
            "Both ___ and ___ are ___.",
            "On the other hand, ___.",
            "I would recommend ___ because ___.",
          ],
          adminScript:
            "Think about two after-school activities: the science club and the soccer team. I want you to compare them and recommend one for a new student. Speak five or six sentences. Show how they are alike and different, then give your recommendation with a reason. You have two minutes to plan, then you will speak.",
          teacher: {
            use: "Comparative speaking with a justified recommendation.",
            function: "Comparing options and recommending with support.",
            lower: "Provide a two-column chart to plan.",
            onLevel: "Speak 5-6 sentences with a recommendation.",
            challenge: "Add cost or time trade-offs to the comparison.",
            noTech: "Plan with a T-chart on paper, then present.",
            prompt: "What information helped you make your recommendation?",
          },
        },
      ],
    },
  },
  tests: [
    {
      id: "model-form-a",
      title: "ACCESS-Style Practice Test — Form A",
      gradeCluster: "6-8",
      tier: "Tier B/C (mid–high)",
      overview:
        "A full practice test in four parts: Listening, Reading, Writing, and Speaking. Work calmly and do your best. The questions get a little harder as you go.",
      sections: [
        {
          domain: "Listening",
          title: "Listening",
          directions:
            "You will hear short talks and conversations read aloud. Listen carefully. You may hear each one one time. After listening, answer the question that follows. Choose the best answer.",
          estMinutes: 18,
          items: [
            {
              id: "fa-l-1",
              title: "Classroom Announcement",
              skill: "Identifying explicit detail",
              prompt: "Where should students go after the announcement?",
              type: "multipleChoice",
              options: [
                { id: "a", text: "To the library", visual: "📚" },
                { id: "b", text: "To the cafeteria", visual: "🍽️" },
                { id: "c", text: "To the gym", visual: "🏀" },
                { id: "d", text: "To the bus", visual: "🚌" },
              ],
              answer: "c",
              correct:
                "Correct. The speaker says to go to the gym for the assembly.",
              hint: "Listen for the place word near the end of the announcement.",
              support: 'The location usually comes with the word "go to."',
              extension: "What time does the assembly start?",
              wida: ["Identify explicit detail"],
              listenFor: [
                "a place word",
                "the word assembly",
                "the word go to",
              ],
              adminScript:
                "Attention students. In five minutes, we will have a special assembly. When you hear the bell, please leave your classroom and go to the gym. Bring nothing with you. Now answer: Where should students go after the announcement?",
              teacher: {
                use: "Test section opener, easiest item.",
                function: "Listening for explicit place detail.",
                lower: "Read twice slowly.",
                onLevel: "Read once.",
                challenge: "Ask for both place and time.",
                noTech: "Read aloud; students point to the answer.",
                prompt: "How did you know it was the gym?",
              },
            },
            {
              id: "fa-l-2",
              title: "Library Rules",
              skill: "Identifying a rule",
              prompt: "What does the librarian ask students NOT to do?",
              type: "multipleChoice",
              options: [
                { id: "a", text: "Read quietly", visual: "📖" },
                { id: "b", text: "Bring food and drinks", visual: "🥤" },
                { id: "c", text: "Return books", visual: "📚" },
                { id: "d", text: "Use the computers", visual: "💻" },
              ],
              answer: "b",
              correct:
                "Correct. The librarian asks students not to bring food and drinks.",
              hint: 'Listen for the words "please do not."',
              support:
                'A rule about what not to do often starts with "do not" or "please do not."',
              extension: "What are students allowed to do in the library?",
              wida: ["Identify a rule", "Process negation"],
              listenFor: [
                "the words do not",
                "what is not allowed",
                "the word library",
              ],
              adminScript:
                "Welcome to the library. You may read, use the computers, and return your books here. Please do not bring food and drinks into the library, because they can damage the books. Now answer: What does the librarian ask students not to do?",
              teacher: {
                use: "Test item with negation processing.",
                function: "Listening for prohibited action.",
                lower: "Emphasize the phrase do not.",
                onLevel: "Read once at normal pace.",
                challenge: "Ask for both allowed and not allowed actions.",
                noTech: "Read aloud; thumbs up/down on each option.",
                prompt: "Why might food be a problem in a library?",
              },
            },
            {
              id: "fa-l-3",
              title: "Science Lab Materials",
              skill: "Identifying multiple details",
              prompt:
                "Which items does the teacher tell students to get for the experiment?",
              type: "multiSelect",
              options: [
                { id: "a", text: "A beaker" },
                { id: "b", text: "Safety goggles" },
                { id: "c", text: "A ruler" },
                { id: "d", text: "A thermometer" },
              ],
              answers: ["a", "b", "d"],
              correct:
                "Correct. The teacher lists a beaker, safety goggles, and a thermometer.",
              hint: 'Listen for the list joined with "and." A ruler was not mentioned.',
              support:
                'When a speaker lists items, track each one and listen for "and."',
              extension: "Why do you think goggles are on the list?",
              wida: ["Identify multiple details", "Track a spoken list"],
              listenFor: [
                "a list of items",
                "the word and",
                "an item not mentioned",
              ],
              adminScript:
                "Before we begin today's experiment, please get the following materials from the cart. You will need a beaker, your safety goggles, and a thermometer to measure the temperature. Now answer: Which items does the teacher tell students to get for the experiment?",
              teacher: {
                use: "Mid-section item requiring list tracking.",
                function: "Listening for multiple key details.",
                lower: "Pause after each item.",
                onLevel: "Read once.",
                challenge: "Add a distractor and ask why it does not belong.",
                noTech: "Read aloud; students check boxes.",
                prompt: "Which item helps measure temperature?",
              },
            },
            {
              id: "fa-l-4",
              title: "Steps to Solve a Problem",
              skill: "Sequencing oral steps",
              prompt:
                "Put the steps in the order the teacher explains for solving a word problem.",
              type: "order",
              items: [
                { id: "i1", text: "Read the problem carefully." },
                { id: "i2", text: "Find the numbers you need." },
                { id: "i3", text: "Choose the right operation." },
                { id: "i4", text: "Check that your answer makes sense." },
              ],
              answer: ["i1", "i2", "i3", "i4"],
              correct:
                "Correct. You followed the order: read, find numbers, choose operation, check.",
              hint: "Listen for order words: first, next, then, finally.",
              support: "Order words signal each step of the process.",
              extension: "Why is checking your answer the last step?",
              wida: ["Sequence steps", "Follow signal words"],
              listenFor: ["order words", "what to do first", "the last step"],
              adminScript:
                "Here is how we solve a math word problem. First, read the problem carefully. Next, find the numbers you need. Then choose the right operation, such as adding or multiplying. Finally, check that your answer makes sense. Now put the steps in order.",
              teacher: {
                use: "Sequencing item using academic math talk.",
                function: "Ordering an oral process.",
                lower: "Use movable step strips.",
                onLevel: "Read once.",
                challenge: "Remove signal words.",
                noTech: "Read aloud; students number steps.",
                prompt: "Which step do students most often skip?",
              },
            },
            {
              id: "fa-l-5",
              title: "Comparing Two Temperatures",
              skill: "Interpreting comparative data",
              prompt: "Complete the summary of the weather report.",
              type: "cloze",
              segments: [
                { text: "On Monday the high was 75 degrees, which was " },
                {
                  blank: {
                    id: "b1",
                    answer: "warmer",
                    options: ["warmer", "cooler", "the same"],
                  },
                },
                {
                  text: " than Tuesday. By Wednesday the temperature was the ",
                },
                {
                  blank: {
                    id: "b2",
                    answer: "coolest",
                    options: ["coolest", "warmest", "highest"],
                  },
                },
                { text: " of the three days." },
              ],
              correct:
                "Correct. Monday was warmer than Tuesday, and Wednesday was the coolest day.",
              hint: "Listen for comparison words: warmer, cooler, coolest.",
              support:
                'Comparatives like "warmer" compare two things; superlatives like "coolest" compare three or more.',
              extension: "Which day would you choose for a picnic? Why?",
              wida: [
                "Interpret comparatives",
                "Process academic temperature language",
              ],
              listenFor: [
                "temperature numbers",
                "comparison words",
                "the coolest day",
              ],
              adminScript:
                "Here is the weather report for this week. On Monday, the high temperature was seventy-five degrees. On Tuesday, it was seventy degrees, so Monday was warmer than Tuesday. On Wednesday, the high dropped to sixty-two degrees, the coolest of the three days. Now complete the summary.",
              teacher: {
                use: "Harder item integrating data and comparison.",
                function: "Listening for comparative temperature data.",
                lower: "Show the three numbers written down.",
                onLevel: "Read once.",
                challenge: "Add a fourth day and ask for the range.",
                noTech: "Read aloud; students fill a printed summary.",
                prompt: "How do you know which day was coolest?",
              },
            },
            {
              id: "fa-l-6",
              title: "A Student Discussion",
              skill: "Drawing a conclusion from dialogue",
              prompt:
                "What do the two students decide to do for their project?",
              type: "multipleChoice",
              options: [
                {
                  id: "a",
                  text: "Make a poster about recycling",
                  visual: "♻️",
                },
                { id: "b", text: "Write a report about cars", visual: "🚗" },
                { id: "c", text: "Build a model volcano", visual: "🌋" },
                { id: "d", text: "Plant a garden", visual: "🌱" },
              ],
              answer: "a",
              correct:
                "Correct. After discussing options, they agree to make a poster about recycling.",
              hint: "Listen to the END of the conversation, where they finally agree.",
              support:
                "In a discussion, the decision usually comes after they weigh choices.",
              extension: "What reason did they give for their choice?",
              wida: ["Draw a conclusion", "Follow a dialogue"],
              listenFor: [
                "two speakers",
                "ideas they consider",
                "the final decision",
              ],
              adminScript:
                'Listen to two students plan a project. Maria says, "We could build a model volcano or make a poster about recycling." Daniel says, "A volcano is messy. I think recycling is more important for our school." Maria answers, "Good point. Let\'s make the recycling poster." Now answer: What do the two students decide to do for their project?',
              teacher: {
                use: "Hardest listening item, requires inference from dialogue.",
                function: "Drawing a conclusion from a conversation.",
                lower: "Read twice and pause at the decision.",
                onLevel: "Read once.",
                challenge: "Ask students to explain the reasoning.",
                noTech: "Read aloud with two voices.",
                prompt: "Whose argument was more convincing, and why?",
              },
            },
          ],
        },
        {
          domain: "Reading",
          title: "Reading",
          directions:
            "Read each passage on your own. Then answer the questions about it. You may look back at the passage as many times as you need. Choose the best answer or click the correct sentence.",
          estMinutes: 22,
          items: [
            {
              id: "fa-r-1",
              title: "Finding a Detail",
              skill: "Locating explicit information",
              prompt:
                "Click the sentence that tells how honeybees communicate where food is.",
              type: "hotText",
              passageTitle: "The Language of Bees",
              passage: [
                "Honeybees live together in large groups called colonies.",
                "When a bee finds flowers full of nectar, it returns to the hive.",
                "There, the bee performs a special movement called the waggle dance to show the others where the food is.",
                "Other bees watch the dance and then fly straight to the flowers.",
              ],
              sentences: [
                {
                  id: "s1",
                  text: "Honeybees live together in large groups called colonies.",
                },
                {
                  id: "s2",
                  text: "When a bee finds flowers full of nectar, it returns to the hive.",
                },
                {
                  id: "s3",
                  text: "There, the bee performs a special movement called the waggle dance to show the others where the food is.",
                },
                {
                  id: "s4",
                  text: "Other bees watch the dance and then fly straight to the flowers.",
                },
              ],
              answers: ["s3"],
              correct:
                "Correct. The waggle dance is how bees show others where food is.",
              hint: 'Find the sentence with the word "dance."',
              support:
                'Scan for the key word "communicate" or a movement that shares information.',
              extension:
                "What do the other bees do after they watch the dance?",
              wida: ["Locate explicit detail"],
              readFor: [
                "the word dance",
                "how bees share information",
                "what others do next",
              ],
              teacher: {
                use: "Easiest reading item, explicit detail.",
                function: "Locating a stated fact.",
                lower: "Highlight the key word together.",
                onLevel: "Independent.",
                challenge: "Find detail and the following action.",
                noTech: "Print and underline.",
                prompt: "Why is the waggle dance useful for the colony?",
              },
            },
            {
              id: "fa-r-2",
              title: "Vocabulary in Context",
              skill: "Using context clues",
              prompt: "Complete the summary using the passage.",
              type: "cloze",
              passageTitle: "The Language of Bees",
              passage: [
                "Honeybees live together in large groups called colonies.",
                "When a bee finds flowers full of nectar, it returns to the hive.",
                "There, the bee performs a special movement called the waggle dance to show the others where the food is.",
                "Other bees watch the dance and then fly straight to the flowers.",
              ],
              segments: [
                { text: "A bee finds the sweet liquid called " },
                {
                  blank: {
                    id: "b1",
                    answer: "nectar",
                    options: ["nectar", "honey", "pollen"],
                  },
                },
                { text: " in flowers, then returns to the " },
                {
                  blank: {
                    id: "b2",
                    answer: "hive",
                    options: ["hive", "colony", "garden"],
                  },
                },
                { text: " to share the location." },
              ],
              correct: "Correct. The bee finds nectar and returns to the hive.",
              hint: "Reread sentence two for the sweet liquid and the place the bee goes.",
              support:
                "Use the words around the blank to choose the term that fits.",
              extension: "What is the difference between nectar and honey?",
              wida: ["Use context clues", "Differentiate related terms"],
              readFor: [
                "the sweet liquid",
                "where the bee goes",
                "the word returns",
              ],
              teacher: {
                use: "Vocabulary-in-context item.",
                function: "Reading for word meaning.",
                lower: "Provide a labeled bee diagram.",
                onLevel: "Independent.",
                challenge: "Remove options.",
                noTech: "Print and fill in.",
                prompt: "How did the passage help you choose nectar?",
              },
            },
            {
              id: "fa-r-3",
              title: "Main Idea",
              skill: "Identifying the central idea",
              prompt:
                "Which sentence best states the main idea of the passage?",
              type: "multipleChoice",
              passageTitle: "Deserts: Life in Dry Lands",
              passage: [
                "Deserts are some of the driest places on Earth, yet many living things survive there.",
                "Cactus plants store water in their thick stems to last through long dry spells.",
                "Some desert animals are active only at night, when the air is cooler.",
                "These special features help plants and animals live where water is scarce.",
              ],
              options: [
                { id: "a", text: "Cactus plants have thick stems." },
                {
                  id: "b",
                  text: "Living things have special features that help them survive in dry deserts.",
                },
                { id: "c", text: "Some animals are active at night." },
                { id: "d", text: "Deserts are found all over the world." },
              ],
              answer: "b",
              correct:
                "Correct. The whole passage is about how living things survive in dry deserts.",
              hint: "The main idea covers the WHOLE passage, not just one detail.",
              support:
                "Details are examples; the main idea is the big point they all support.",
              extension: "Name one detail that supports the main idea.",
              wida: [
                "Identify main idea",
                "Distinguish from supporting detail",
              ],
              readFor: [
                "the big point",
                "what all sentences share",
                "a detail vs the main idea",
              ],
              teacher: {
                use: "Main idea item, increasing difficulty.",
                function: "Identifying the central idea.",
                lower: "Cross out detail-only choices together.",
                onLevel: "Independent.",
                challenge:
                  "Have students restate the main idea in their words.",
                noTech: "Print and discuss choices.",
                prompt: "How are details and main idea different?",
              },
            },
            {
              id: "fa-r-4",
              title: "Cause and Effect",
              skill: "Identifying cause and effect",
              prompt:
                "Click the sentence that explains WHY some desert animals come out at night.",
              type: "hotText",
              passageTitle: "Deserts: Life in Dry Lands",
              passage: [
                "Deserts can be dangerously hot during the day.",
                "To stay safe, some animals rest in shade or burrows while the sun is high.",
                "Many of these animals come out at night because the air is much cooler then.",
                "At night they can search for food without losing too much water.",
              ],
              sentences: [
                {
                  id: "s1",
                  text: "Deserts can be dangerously hot during the day.",
                },
                {
                  id: "s2",
                  text: "To stay safe, some animals rest in shade or burrows while the sun is high.",
                },
                {
                  id: "s3",
                  text: "Many of these animals come out at night because the air is much cooler then.",
                },
                {
                  id: "s4",
                  text: "At night they can search for food without losing too much water.",
                },
              ],
              answers: ["s3"],
              correct:
                "Correct. They come out at night because the air is cooler then.",
              hint: 'Look for the word "because," which signals a reason.',
              support:
                'Cause-and-effect sentences often use "because," "so," or "since."',
              extension:
                "What is the effect of coming out at night, according to the text?",
              wida: ["Identify cause and effect", "Recognize signal words"],
              readFor: [
                "the word because",
                "a reason animals are active at night",
                "the effect",
              ],
              teacher: {
                use: "Cause-effect item.",
                function: "Locating a causal relationship.",
                lower: "Circle the word because.",
                onLevel: "Independent.",
                challenge: "Identify both the cause and its effect.",
                noTech: "Print and box the cause.",
                prompt: "How do cooler nights help desert animals?",
              },
            },
            {
              id: "fa-r-5",
              title: "Inference",
              skill: "Making a supported inference",
              prompt: "Which statements can you infer from the passage?",
              type: "multiSelect",
              passageTitle: "A New Student's First Day",
              passage: [
                "Liam stood at the classroom door, holding his schedule tightly.",
                "He did not know anyone, and the hallways had felt like a maze.",
                "When a girl named Sara waved and pointed to an empty seat beside her, Liam let out a breath and smiled.",
                "By lunchtime, he and Sara were laughing about their confusing first-day adventures.",
              ],
              options: [
                { id: "a", text: "Liam felt nervous at the start of the day." },
                {
                  id: "b",
                  text: "Liam had attended this school for many years.",
                },
                { id: "c", text: "Sara helped Liam feel more comfortable." },
                { id: "d", text: "By lunch, Liam felt more relaxed." },
              ],
              answers: ["a", "c", "d"],
              correct:
                "Correct. The text shows Liam was nervous, that Sara helped, and that he relaxed by lunch.",
              hint: "One choice is the opposite of the text. Liam did NOT know anyone, so he was new.",
              support:
                "An inference is supported by clues, even if the text does not say it directly.",
              extension: "What clue tells you Liam felt nervous at first?",
              wida: ["Make inferences", "Use textual evidence"],
              readFor: [
                "clues about feelings",
                "what Sara does",
                "a statement the text disproves",
              ],
              teacher: {
                use: "Inference item with a narrative passage.",
                function: "Drawing supported inferences.",
                lower: "Discuss clue words for feelings.",
                onLevel: "Independent.",
                challenge: "Cite the exact clue for each answer.",
                noTech: "Print and annotate clues.",
                prompt:
                  "How did the author show Liam's feelings without naming them?",
              },
            },
            {
              id: "fa-r-6",
              title: "Author's Purpose",
              skill: "Determining purpose and tone",
              prompt: "Why did the author most likely write this passage?",
              type: "multipleChoice",
              passageTitle: "A New Student's First Day",
              passage: [
                "Liam stood at the classroom door, holding his schedule tightly.",
                "He did not know anyone, and the hallways had felt like a maze.",
                "When a girl named Sara waved and pointed to an empty seat beside her, Liam let out a breath and smiled.",
                "By lunchtime, he and Sara were laughing about their confusing first-day adventures.",
              ],
              options: [
                { id: "a", text: "To explain how to read a class schedule" },
                {
                  id: "b",
                  text: "To tell a story about how kindness can ease a hard first day",
                },
                { id: "c", text: "To give directions to the cafeteria" },
                { id: "d", text: "To list the rules of the school" },
              ],
              answer: "b",
              correct:
                "Correct. The passage tells a story that shows how a kind classmate made a hard day easier.",
              hint: "Think about the kind of text. Is it a how-to, a list, or a story?",
              support:
                "Author's purpose is often to inform, to persuade, or to entertain with a story.",
              extension: "What lesson might a reader take from this story?",
              wida: ["Determine author's purpose", "Analyze narrative"],
              readFor: [
                "the type of text",
                "what the author wants you to feel",
                "the message",
              ],
              teacher: {
                use: "Hardest reading item, author's purpose.",
                function: "Analyzing why a text was written.",
                lower: "Sort choices by text type first.",
                onLevel: "Independent.",
                challenge: "Compare to the desert passage's purpose.",
                noTech: "Print and discuss in pairs.",
                prompt: "How is a story's purpose different from an article's?",
              },
            },
          ],
        },
        {
          domain: "Writing",
          title: "Writing",
          directions:
            "Read each task carefully. Plan your ideas, then write a clear response in complete sentences. Use the word bank and sentence frames to help you. Take your time and check your work.",
          estMinutes: 25,
          items: [
            {
              id: "fa-w-1",
              title: "Explain a Process",
              skill: "Writing a sequenced explanation",
              prompt:
                "Explain how to take care of a class pet or a plant. Write 4-6 sentences using order words.",
              type: "constructed",
              responseLabel: "Your response",
              responsePlaceholder: "First, you need to ...",
              wordBank: [
                "first",
                "next",
                "then",
                "after that",
                "finally",
                "every day",
                "make sure",
              ],
              correct:
                "Good work. A strong response uses order words and clear, complete sentences.",
              hint: "Use a different order word for each step and explain why each step matters.",
              support:
                "Structure: first, next, then, finally. Begin each sentence with an order word.",
              extension:
                "Add one sentence about what could happen if a step is skipped.",
              wida: [
                "Sequence a process in writing",
                "Use procedural transitions",
              ],
              frames: [
                "First, you need to ___.",
                "Next, ___.",
                "Finally, ___.",
              ],
              teacher: {
                use: "First writing task, procedural.",
                function: "Writing a sequenced explanation.",
                lower: "Provide a frame for each step.",
                onLevel: "Write 4-6 sentences.",
                challenge: "Add reasons for each step.",
                noTech: "Write on paper.",
                prompt: "Why is order important when you explain a process?",
              },
            },
            {
              id: "fa-w-2",
              title: "State and Support an Opinion",
              skill: "Writing an argument with reasons",
              prompt:
                "Some schools want to add 20 more minutes of reading time each day. Do you agree or disagree? Write a paragraph that states your opinion and gives two reasons.",
              type: "constructed",
              responseLabel: "Your response",
              responsePlaceholder: "I believe that ...",
              wordBank: [
                "I believe",
                "one reason",
                "another reason",
                "for example",
                "in addition",
                "in conclusion",
              ],
              correct:
                "Good work. A strong response states a clear opinion and supports it with reasons and a conclusion.",
              hint: "Start with your opinion, give two reasons with examples, and end with a conclusion.",
              support:
                "Structure: claim, reason one, reason two, conclusion. Use transitions to connect ideas.",
              extension:
                "Add a sentence that responds to someone who disagrees.",
              wida: [
                "Develop an argument",
                "Support a claim",
                "Use transitions",
              ],
              frames: [
                "I believe that ___.",
                "One reason is ___.",
                "In conclusion, ___.",
              ],
              teacher: {
                use: "Second writing task, argumentative.",
                function: "Writing a claim with supporting reasons.",
                lower: "Provide a paragraph frame.",
                onLevel: "Write a full paragraph.",
                challenge: "Include a counterargument.",
                noTech: "Write and peer review.",
                prompt: "Which reason do you think is strongest?",
              },
            },
          ],
        },
        {
          domain: "Speaking",
          title: "Speaking",
          directions:
            "You will be given a topic and a short time to plan. Then you will speak your answer aloud in complete sentences. Use the sentence frames to organize your ideas. Speak clearly and stay on the topic.",
          estMinutes: 12,
          items: [
            {
              id: "fa-s-1",
              title: "Describe and Explain",
              skill: "Describing with details",
              prompt:
                "Describe your favorite place at school and explain why you like it. Speak 4-5 sentences.",
              type: "constructed",
              responseLabel: "Planning notes",
              responsePlaceholder: "My favorite place is ...",
              wordBank: [
                "my favorite place",
                "because",
                "I can",
                "for example",
                "it makes me feel",
              ],
              correct:
                "Good work. A strong answer describes the place and gives clear reasons.",
              hint: 'Name the place, describe it, and use "because" to explain why you like it.',
              support: 'Use the frame "My favorite place is ___ because ___."',
              extension: "Compare it to a place you like less.",
              wida: ["Describe with detail", "Give reasons orally"],
              frames: [
                "My favorite place is ___.",
                "I like it because ___.",
                "For example, ___.",
              ],
              adminScript:
                "Think about your favorite place at school. I want you to describe it and explain why you like it. Speak four or five sentences. You have one minute to plan, then you will speak.",
              teacher: {
                use: "First speaking task, descriptive.",
                function: "Describing with supporting reasons.",
                lower: "Offer a sentence starter.",
                onLevel: "Speak 4-5 sentences.",
                challenge: "Add a comparison.",
                noTech: "Speak to a partner.",
                prompt: "What made that place your favorite?",
              },
            },
            {
              id: "fa-s-2",
              title: "Give an Opinion with Reasons",
              skill: "Stating and supporting an opinion",
              prompt:
                "Should students choose their own seats in class? Give your opinion and support it with two reasons. Speak 5-6 sentences.",
              type: "constructed",
              responseLabel: "Planning notes",
              responsePlaceholder: "In my opinion, ...",
              wordBank: [
                "in my opinion",
                "first of all",
                "in addition",
                "because",
                "however",
                "in conclusion",
              ],
              correct:
                "Good work. A strong answer states an opinion and supports it with two clear reasons.",
              hint: 'State your opinion, give two reasons with "because," and end with a conclusion.',
              support:
                "Structure: opinion, reason one, reason two, conclusion.",
              extension:
                "Mention a reason someone might disagree, then respond.",
              wida: [
                "Express an opinion",
                "Support with reasons",
                "Organize a response",
              ],
              frames: [
                "In my opinion, ___.",
                "First of all, ___.",
                "In conclusion, ___.",
              ],
              adminScript:
                "Think about whether students should choose their own seats in class. I want your opinion. Speak five or six sentences. State your opinion and give two reasons using the word because. Finish with a conclusion. You have two minutes to plan, then you will speak.",
              teacher: {
                use: "Final speaking task, opinion with support.",
                function: "Stating and defending an opinion orally.",
                lower: "Provide an opinion outline.",
                onLevel: "Speak 5-6 sentences.",
                challenge: "Respond to a live counterpoint.",
                noTech: "Present to a small group.",
                prompt: "What reason was most convincing to you?",
              },
            },
          ],
        },
      ],
    },
    {
      id: "model-form-b",
      title: "ACCESS-Style Practice Test — Form B",
      gradeCluster: "6-8",
      tier: "Tier B/C (mid–high)",
      overview:
        "A second full practice test with new topics. Listen, read, write, and speak your best. The questions grow more challenging as each part goes on.",
      sections: [
        {
          domain: "Listening",
          title: "Listening",
          directions:
            "You will hear short talks and conversations read aloud. Listen carefully. After each one, answer the question. Choose the best answer or follow the steps in the question.",
          estMinutes: 18,
          items: [
            {
              id: "fb-l-1",
              title: "Field Trip Reminder",
              skill: "Identifying explicit detail",
              prompt: "What should students bring on the field trip?",
              type: "multipleChoice",
              options: [
                { id: "a", text: "A packed lunch", visual: "🍞" },
                { id: "b", text: "Their pets", visual: "🐶" },
                { id: "c", text: "A laptop", visual: "💻" },
                { id: "d", text: "A bicycle", visual: "🚲" },
              ],
              answer: "a",
              correct:
                "Correct. The teacher reminds students to bring a packed lunch.",
              hint: 'Listen for the word "bring."',
              support:
                'The needed item usually follows the word "bring" or "remember."',
              extension: "What time does the bus leave?",
              wida: ["Identify explicit detail"],
              listenFor: ["the word bring", "what to pack", "the word lunch"],
              adminScript:
                "Good morning. Tomorrow is our field trip to the science museum. Remember to bring a packed lunch, because we will eat outside in the park. Wear comfortable shoes for walking. Now answer: What should students bring on the field trip?",
              teacher: {
                use: "Easiest listening item, explicit detail.",
                function: "Listening for a required item.",
                lower: "Read twice slowly.",
                onLevel: "Read once.",
                challenge: "Ask for two details.",
                noTech: "Read aloud; students point.",
                prompt: "Why eat lunch outside on the trip?",
              },
            },
            {
              id: "fb-l-2",
              title: "Gym Class Instructions",
              skill: "Processing a direction",
              prompt: "What does the coach tell students to do before running?",
              type: "multipleChoice",
              options: [
                { id: "a", text: "Drink soda", visual: "🥤" },
                { id: "b", text: "Stretch and warm up", visual: "🤸" },
                { id: "c", text: "Take a nap", visual: "😴" },
                { id: "d", text: "Eat a big meal", visual: "🍔" },
              ],
              answer: "b",
              correct: "Correct. The coach says to stretch and warm up first.",
              hint: 'Listen for what comes "before" running.',
              support: 'The word "before" tells you the order of actions.',
              extension: "Why is warming up important?",
              wida: ["Process a direction", "Follow order words"],
              listenFor: [
                "the word before",
                "what to do first",
                "the word warm up",
              ],
              adminScript:
                "Listen, class. Today we are going to run laps around the track. But before you run, you must stretch and warm up your muscles so you do not get hurt. Take two minutes to stretch now. Now answer: What does the coach tell students to do before running?",
              teacher: {
                use: "Direction-following item.",
                function: "Listening for a preliminary action.",
                lower: "Stress the word before.",
                onLevel: "Read once.",
                challenge: "Ask for the reason given.",
                noTech: "Read aloud; thumbs up on the answer.",
                prompt: "What happens if athletes skip a warm-up?",
              },
            },
            {
              id: "fb-l-3",
              title: "Recipe Ingredients",
              skill: "Identifying multiple details",
              prompt:
                "Which ingredients does the speaker list for the smoothie?",
              type: "multiSelect",
              options: [
                { id: "a", text: "Bananas" },
                { id: "b", text: "Milk" },
                { id: "c", text: "Salt" },
                { id: "d", text: "Strawberries" },
              ],
              answers: ["a", "b", "d"],
              correct:
                "Correct. The smoothie needs bananas, milk, and strawberries.",
              hint: 'Track the list joined by "and." Salt was not mentioned.',
              support:
                "Listen for each item in the list and ignore items that are not said.",
              extension: "What would you add to make it your own?",
              wida: ["Identify multiple details", "Track a list"],
              listenFor: [
                "a list of foods",
                "the word and",
                "an item not said",
              ],
              adminScript:
                "Here is how to make a simple smoothie. Into the blender, put two bananas, one cup of milk, and a handful of strawberries. Then blend until smooth. Now answer: Which ingredients does the speaker list for the smoothie?",
              teacher: {
                use: "List-tracking item.",
                function: "Listening for multiple key details.",
                lower: "Pause after each ingredient.",
                onLevel: "Read once.",
                challenge: "Add a distractor and ask why it is wrong.",
                noTech: "Read aloud; students check boxes.",
                prompt: "Which item gives the smoothie a sweet taste?",
              },
            },
            {
              id: "fb-l-4",
              title: "Steps of an Experiment",
              skill: "Sequencing oral steps",
              prompt:
                "Put the steps of the plant experiment in the order the teacher describes.",
              type: "order",
              items: [
                { id: "i1", text: "Fill two cups with soil." },
                { id: "i2", text: "Plant a seed in each cup." },
                {
                  id: "i3",
                  text: "Place one cup in the sun and one in a dark closet.",
                },
                { id: "i4", text: "Record how the plants grow each day." },
              ],
              answer: ["i1", "i2", "i3", "i4"],
              correct:
                "Correct. You followed the order: fill soil, plant seeds, place cups, record growth.",
              hint: "Listen for order words: first, next, then, finally.",
              support:
                "Each signal word marks the next step in the experiment.",
              extension: "Which cup do you predict will grow taller? Why?",
              wida: ["Sequence steps", "Follow signal words"],
              listenFor: ["order words", "the first step", "what to do last"],
              adminScript:
                "Here is our plant experiment. First, fill two cups with soil. Next, plant one seed in each cup. Then place one cup in the sun and put the other in a dark closet. Finally, record how the plants grow each day in your notebook. Now put the steps in order.",
              teacher: {
                use: "Sequencing item using science procedure.",
                function: "Ordering an oral process.",
                lower: "Use movable step strips.",
                onLevel: "Read once.",
                challenge: "Remove signal words.",
                noTech: "Read aloud; students number steps.",
                prompt: "Why do scientists keep one plant in the dark?",
              },
            },
            {
              id: "fb-l-5",
              title: "Comparing Survey Results",
              skill: "Interpreting comparative data",
              prompt: "Complete the summary of the reading survey.",
              type: "cloze",
              segments: [
                { text: "More students chose mystery books, so mystery was " },
                {
                  blank: {
                    id: "b1",
                    answer: "more popular",
                    options: ["more popular", "less popular", "the same"],
                  },
                },
                { text: " than science fiction. Comic books received the " },
                {
                  blank: {
                    id: "b2",
                    answer: "fewest",
                    options: ["fewest", "most", "second most"],
                  },
                },
                { text: " votes of all." },
              ],
              correct:
                "Correct. Mystery was more popular than science fiction, and comics got the fewest votes.",
              hint: "Listen for comparison words: more popular, fewest.",
              support:
                'Comparatives compare two; superlatives like "fewest" compare all.',
              extension: "How would you display this data in a graph?",
              wida: ["Interpret comparatives", "Process survey data"],
              listenFor: [
                "which book won",
                "comparison words",
                "the lowest result",
              ],
              adminScript:
                "Here are the results of our class reading survey. Mystery books got fourteen votes, science fiction got nine votes, and comic books got only three votes. So mystery was more popular than science fiction, and comic books received the fewest votes. Now complete the summary.",
              teacher: {
                use: "Harder item integrating data and comparison.",
                function: "Listening for comparative survey data.",
                lower: "Show the three numbers written.",
                onLevel: "Read once.",
                challenge: "Ask for the total votes.",
                noTech: "Read aloud; fill printed summary.",
                prompt: "Which result surprised you most?",
              },
            },
            {
              id: "fb-l-6",
              title: "A Group Decision",
              skill: "Drawing a conclusion from dialogue",
              prompt:
                "What do the students decide to do about the broken supplies?",
              type: "multipleChoice",
              options: [
                { id: "a", text: "Throw the supplies away", visual: "🗑️" },
                {
                  id: "b",
                  text: "Tell the teacher and ask for new ones",
                  visual: "🙋",
                },
                { id: "c", text: "Hide the broken supplies", visual: "🙈" },
                { id: "d", text: "Use them anyway", visual: "⚠️" },
              ],
              answer: "b",
              correct:
                "Correct. They agree to tell the teacher and ask for new supplies.",
              hint: "Listen to the END, where they reach a decision.",
              support:
                "The decision in a dialogue usually comes after weighing the options.",
              extension: "Why is telling the teacher the responsible choice?",
              wida: ["Draw a conclusion", "Follow a dialogue"],
              listenFor: [
                "two speakers",
                "options they discuss",
                "the final choice",
              ],
              adminScript:
                'Listen to two students in the art room. Ana says, "These scissors are broken. Should we just use them anyway?" Jordan says, "No, that could be dangerous. We should tell Ms. Lee and ask for new ones." Ana answers, "You\'re right. Let\'s go ask her now." Now answer: What do the students decide to do about the broken supplies?',
              teacher: {
                use: "Hardest listening item, inference from dialogue.",
                function: "Drawing a conclusion from a conversation.",
                lower: "Read twice; pause at the decision.",
                onLevel: "Read once.",
                challenge: "Explain the reasoning.",
                noTech: "Read aloud with two voices.",
                prompt: "Why was Jordan's idea safer?",
              },
            },
          ],
        },
        {
          domain: "Reading",
          title: "Reading",
          directions:
            "Read each passage on your own. Then answer the questions about it. You may look back at the passage. Choose the best answer or click the correct sentence.",
          estMinutes: 22,
          items: [
            {
              id: "fb-r-1",
              title: "Finding a Detail",
              skill: "Locating explicit information",
              prompt:
                "Click the sentence that tells what penguins use their wings for.",
              type: "hotText",
              passageTitle: "Birds That Cannot Fly",
              passage: [
                "Penguins are birds, but they cannot fly through the air like most birds.",
                "Instead, penguins use their strong wings like paddles to swim quickly underwater.",
                "Their smooth feathers keep them warm in the icy ocean.",
                "On land, penguins waddle slowly, but in the water they are fast and graceful.",
              ],
              sentences: [
                {
                  id: "s1",
                  text: "Penguins are birds, but they cannot fly through the air like most birds.",
                },
                {
                  id: "s2",
                  text: "Instead, penguins use their strong wings like paddles to swim quickly underwater.",
                },
                {
                  id: "s3",
                  text: "Their smooth feathers keep them warm in the icy ocean.",
                },
                {
                  id: "s4",
                  text: "On land, penguins waddle slowly, but in the water they are fast and graceful.",
                },
              ],
              answers: ["s2"],
              correct:
                "Correct. Penguins use their wings like paddles to swim.",
              hint: 'Find the sentence with the word "wings."',
              support:
                'Scan for the key word "wings" and read what they do with them.',
              extension: "How do penguins move on land?",
              wida: ["Locate explicit detail"],
              readFor: [
                "the word wings",
                "what wings are used for",
                "the word swim",
              ],
              teacher: {
                use: "Easiest reading item, explicit detail.",
                function: "Locating a stated fact.",
                lower: "Highlight the key word.",
                onLevel: "Independent.",
                challenge: "Find use of wings and feathers.",
                noTech: "Print and underline.",
                prompt: "How are penguins different from most birds?",
              },
            },
            {
              id: "fb-r-2",
              title: "Vocabulary in Context",
              skill: "Using context clues",
              prompt: "Complete the summary using the passage.",
              type: "cloze",
              passageTitle: "Birds That Cannot Fly",
              passage: [
                "Penguins are birds, but they cannot fly through the air like most birds.",
                "Instead, penguins use their strong wings like paddles to swim quickly underwater.",
                "Their smooth feathers keep them warm in the icy ocean.",
                "On land, penguins waddle slowly, but in the water they are fast and graceful.",
              ],
              segments: [
                { text: "Penguins cannot " },
                {
                  blank: {
                    id: "b1",
                    answer: "fly",
                    options: ["fly", "swim", "dive"],
                  },
                },
                { text: ", but their " },
                {
                  blank: {
                    id: "b2",
                    answer: "feathers",
                    options: ["feathers", "wings", "beaks"],
                  },
                },
                { text: " keep them warm in the icy ocean." },
              ],
              correct:
                "Correct. Penguins cannot fly, and their feathers keep them warm.",
              hint: "Reread for what penguins cannot do and what keeps them warm.",
              support:
                "Use the words around each blank to choose the term that fits.",
              extension: "What word describes how penguins move on land?",
              wida: ["Use context clues", "Differentiate related terms"],
              readFor: [
                "what penguins cannot do",
                "what keeps them warm",
                "the word ocean",
              ],
              teacher: {
                use: "Vocabulary-in-context item.",
                function: "Reading for word meaning.",
                lower: "Provide a penguin picture.",
                onLevel: "Independent.",
                challenge: "Remove options.",
                noTech: "Print and fill in.",
                prompt: "How did the passage help you choose feathers?",
              },
            },
            {
              id: "fb-r-3",
              title: "Main Idea",
              skill: "Identifying the central idea",
              prompt:
                "Which sentence best states the main idea of the passage?",
              type: "multipleChoice",
              passageTitle: "The Power of Teamwork",
              passage: [
                "When people work together, they can solve problems no one could solve alone.",
                "A soccer team wins when players pass the ball and support each other.",
                "Scientists often share data so they can make discoveries faster.",
                "In many situations, cooperation leads to better results than working alone.",
              ],
              options: [
                { id: "a", text: "Soccer players pass the ball to win." },
                {
                  id: "b",
                  text: "Working together often leads to better results than working alone.",
                },
                { id: "c", text: "Scientists share data." },
                { id: "d", text: "Some problems are very hard." },
              ],
              answer: "b",
              correct:
                "Correct. The whole passage is about how cooperation leads to better results.",
              hint: "The main idea covers the WHOLE passage, not one example.",
              support:
                "The examples about soccer and scientists support one big point.",
              extension: "Give another example of teamwork from your own life.",
              wida: ["Identify main idea", "Distinguish from detail"],
              readFor: [
                "the big point",
                "what the examples share",
                "a detail vs the main idea",
              ],
              teacher: {
                use: "Main idea item.",
                function: "Identifying the central idea.",
                lower: "Cross out example-only choices.",
                onLevel: "Independent.",
                challenge: "Restate the main idea.",
                noTech: "Print and discuss.",
                prompt: "How do the examples support the main idea?",
              },
            },
            {
              id: "fb-r-4",
              title: "Cause and Effect",
              skill: "Identifying cause and effect",
              prompt:
                "Click the sentence that explains WHY the city built more bike lanes.",
              type: "hotText",
              passageTitle: "Getting Around the City",
              passage: [
                "Last year, traffic in the city became very heavy during rush hour.",
                "Many people complained that the roads were crowded and the air was polluted.",
                "Because so many residents wanted cleaner air and shorter trips, the city built more bike lanes.",
                "Now more people ride bikes to work, and the streets are a little less crowded.",
              ],
              sentences: [
                {
                  id: "s1",
                  text: "Last year, traffic in the city became very heavy during rush hour.",
                },
                {
                  id: "s2",
                  text: "Many people complained that the roads were crowded and the air was polluted.",
                },
                {
                  id: "s3",
                  text: "Because so many residents wanted cleaner air and shorter trips, the city built more bike lanes.",
                },
                {
                  id: "s4",
                  text: "Now more people ride bikes to work, and the streets are a little less crowded.",
                },
              ],
              answers: ["s3"],
              correct:
                "Correct. The city built bike lanes because residents wanted cleaner air and shorter trips.",
              hint: 'Look for the word "because," which signals a reason.',
              support:
                'Cause-and-effect sentences often use "because" or "so."',
              extension: "What was the effect of building bike lanes?",
              wida: ["Identify cause and effect", "Recognize signal words"],
              readFor: [
                "the word because",
                "the reason for bike lanes",
                "the result",
              ],
              teacher: {
                use: "Cause-effect item.",
                function: "Locating a causal relationship.",
                lower: "Circle the word because.",
                onLevel: "Independent.",
                challenge: "Identify cause and effect.",
                noTech: "Print and box the cause.",
                prompt: "How did the bike lanes change the city?",
              },
            },
            {
              id: "fb-r-5",
              title: "Inference",
              skill: "Making a supported inference",
              prompt: "Which statements can you infer from the passage?",
              type: "multiSelect",
              passageTitle: "Maya's Science Fair",
              passage: [
                "Maya spent three weekends testing which paper towel soaked up the most water.",
                "She recorded her results carefully in a notebook and made a neat bar graph.",
                "On the day of the science fair, her hands shook a little as the judges walked up.",
                "When they smiled and asked thoughtful questions, Maya felt proud of all her hard work.",
              ],
              options: [
                { id: "a", text: "Maya worked hard on her project." },
                { id: "b", text: "Maya was a little nervous at the fair." },
                { id: "c", text: "Maya did her project in one hour." },
                { id: "d", text: "Maya organized her data carefully." },
              ],
              answers: ["a", "b", "d"],
              correct:
                "Correct. The text shows Maya worked hard, felt nervous, and organized her data carefully.",
              hint: "One choice is the opposite of the text. She spent three weekends, not one hour.",
              support:
                "An inference is supported by clues, even if not stated directly.",
              extension: "What clue shows Maya was nervous?",
              wida: ["Make inferences", "Use textual evidence"],
              readFor: [
                "clues about effort",
                "clues about feelings",
                "a statement the text disproves",
              ],
              teacher: {
                use: "Inference item with a narrative passage.",
                function: "Drawing supported inferences.",
                lower: "Discuss clue words.",
                onLevel: "Independent.",
                challenge: "Cite the clue for each answer.",
                noTech: "Print and annotate.",
                prompt: "How did the author show Maya's effort?",
              },
            },
            {
              id: "fb-r-6",
              title: "Author's Purpose",
              skill: "Determining purpose",
              prompt: "Why did the author most likely write this passage?",
              type: "multipleChoice",
              passageTitle: "Why You Should Drink Water",
              passage: [
                "Your body needs water to work properly every single day.",
                "Drinking enough water helps you think clearly and stay full of energy.",
                "If you wait until you feel very thirsty, your body is already low on water.",
                "So keep a water bottle nearby and take small sips throughout the day.",
              ],
              options: [
                { id: "a", text: "To tell a funny story about water" },
                { id: "b", text: "To persuade readers to drink enough water" },
                { id: "c", text: "To explain how rain forms" },
                { id: "d", text: "To list the names of rivers" },
              ],
              answer: "b",
              correct:
                "Correct. The author gives reasons and advice to persuade readers to drink enough water.",
              hint: "Notice the advice at the end. The author wants you to DO something.",
              support:
                "When a text gives reasons and tells you to act, the purpose is to persuade.",
              extension: "What advice does the author give at the end?",
              wida: ["Determine author's purpose", "Analyze persuasive text"],
              readFor: [
                "the advice given",
                "what the author wants you to do",
                "the reasons offered",
              ],
              teacher: {
                use: "Hardest reading item, author's purpose.",
                function: "Analyzing why a text was written.",
                lower: "Underline the advice sentence.",
                onLevel: "Independent.",
                challenge: "Compare to the teamwork passage's purpose.",
                noTech: "Print and discuss in pairs.",
                prompt: "How is persuading different from explaining?",
              },
            },
          ],
        },
        {
          domain: "Writing",
          title: "Writing",
          directions:
            "Read each task carefully. Plan your ideas, then write a clear response in complete sentences. Use the word bank and sentence frames to help you. Check your work before you finish.",
          estMinutes: 25,
          items: [
            {
              id: "fb-w-1",
              title: "Describe and Explain",
              skill: "Writing a descriptive explanation",
              prompt:
                "Describe a tool or object you use at school and explain how it helps you. Write 4-6 sentences.",
              type: "constructed",
              responseLabel: "Your response",
              responsePlaceholder: "One object I use is ...",
              wordBank: [
                "one object",
                "it helps me",
                "for example",
                "because",
                "in addition",
                "without it",
              ],
              correct:
                "Good work. A strong response describes the object clearly and explains how it helps.",
              hint: "Name the object, describe it, and explain how it helps you with examples.",
              support:
                'Use the frame "One object I use is ___. It helps me ___ because ___."',
              extension: "Explain what would be harder without this object.",
              wida: ["Describe with detail", "Explain function in writing"],
              frames: [
                "One object I use is ___.",
                "It helps me ___ because ___.",
                "For example, ___.",
              ],
              teacher: {
                use: "First writing task, descriptive-explanatory.",
                function: "Writing a description with function.",
                lower: "Provide sentence frames.",
                onLevel: "Write 4-6 sentences.",
                challenge: "Add a comparison to another tool.",
                noTech: "Write on paper.",
                prompt: "How does this object make your work easier?",
              },
            },
            {
              id: "fb-w-2",
              title: "Compare Two Options",
              skill: "Writing a compare-and-contrast response",
              prompt:
                "Compare doing homework right after school with doing it later in the evening. Which is better and why? Write a paragraph.",
              type: "constructed",
              responseLabel: "Your response",
              responsePlaceholder:
                "Both doing homework after school and in the evening ...",
              wordBank: [
                "both",
                "however",
                "on the other hand",
                "in contrast",
                "overall",
                "because",
              ],
              correct:
                "Good work. A strong response compares both options and reaches a clear conclusion.",
              hint: "Show one similarity, two differences, then say which is better and why.",
              support:
                'Use "Both ___" for similarity and "However" for difference, then conclude with "Overall."',
              extension: "Explain when your answer might change.",
              wida: [
                "Compare and contrast",
                "Organize with transitions",
                "Reach a conclusion",
              ],
              frames: [
                "Both ___ and ___ are ___.",
                "However, ___.",
                "Overall, ___ is better because ___.",
              ],
              teacher: {
                use: "Second writing task, compare-and-contrast.",
                function: "Writing an organized comparison.",
                lower: "Provide a Venn diagram.",
                onLevel: "Write a full paragraph.",
                challenge: "Compare three options.",
                noTech: "Plan with a chart, then write.",
                prompt: "What helped you decide which option was better?",
              },
            },
          ],
        },
        {
          domain: "Speaking",
          title: "Speaking",
          directions:
            "You will be given a topic and a short time to plan. Then you will speak your answer aloud in complete sentences. Use the sentence frames to organize your ideas. Speak clearly and stay on topic.",
          estMinutes: 12,
          items: [
            {
              id: "fb-s-1",
              title: "Explain a Process",
              skill: "Giving sequenced directions orally",
              prompt:
                "Explain how to get ready for a test. Speak 4-5 sentences using order words.",
              type: "constructed",
              responseLabel: "Planning notes",
              responsePlaceholder: "First, you should ...",
              wordBank: [
                "first",
                "next",
                "then",
                "after that",
                "finally",
                "make sure",
              ],
              correct:
                "Good work. A strong answer uses order words and clear steps.",
              hint: "Use a different order word for each step: first, next, then, finally.",
              support:
                'Begin each step with an order word, like "First, you review your notes."',
              extension: "Explain what could happen if you skip studying.",
              wida: ["Sequence oral directions", "Use procedural language"],
              frames: ["First, you should ___.", "Next, ___.", "Finally, ___."],
              adminScript:
                "Think about how you get ready for a test. I want you to explain the steps. Speak four or five sentences and use order words like first, next, then, and finally. You have one minute to plan, then you will speak.",
              teacher: {
                use: "First speaking task, procedural.",
                function: "Explaining a process in sequence.",
                lower: "Offer step pictures.",
                onLevel: "Speak 4-5 sentences.",
                challenge: "Add reasons for each step.",
                noTech: "Explain to a partner.",
                prompt: "Which study step helps you most?",
              },
            },
            {
              id: "fb-s-2",
              title: "Make and Defend a Recommendation",
              skill: "Recommending with reasons",
              prompt:
                "A new student wants to join a club. Recommend one club and explain why with two reasons. Speak 5-6 sentences.",
              type: "constructed",
              responseLabel: "Planning notes",
              responsePlaceholder: "I would recommend ...",
              wordBank: [
                "I would recommend",
                "first of all",
                "in addition",
                "because",
                "for example",
                "in conclusion",
              ],
              correct:
                "Good work. A strong answer recommends a club and supports it with two clear reasons.",
              hint: 'Name the club, give two reasons with "because," and end with a conclusion.',
              support:
                "Structure: recommendation, reason one, reason two, conclusion.",
              extension:
                "Mention one reason a different student might choose another club.",
              wida: [
                "Make a recommendation",
                "Support with reasons",
                "Organize a response",
              ],
              frames: [
                "I would recommend ___.",
                "First of all, ___.",
                "In conclusion, ___.",
              ],
              adminScript:
                "Imagine a new student wants to join a club at your school. I want you to recommend one club and explain why. Speak five or six sentences. Give two reasons using the word because, and finish with a conclusion. You have two minutes to plan, then you will speak.",
              teacher: {
                use: "Final speaking task, recommendation with support.",
                function: "Recommending and justifying orally.",
                lower: "Provide a recommendation outline.",
                onLevel: "Speak 5-6 sentences.",
                challenge: "Respond to a peer who prefers a different club.",
                noTech: "Present to a small group.",
                prompt: "What reason was most convincing?",
              },
            },
          ],
        },
      ],
    },
  ],
};

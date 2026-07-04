/**
 * ACCESS Practice Lab — v10 content module: "Gold Standard" Level A & B pack.
 *
 * A premium, publisher-grade expansion focused ONLY on the two core student
 * pathways:
 *   • A = Newcomer  (WIDA 1.0–2.4)  — short text, heavy visuals + frames
 *   • B = Developing (WIDA 2.5–3.5)  — connected sentences, evidence, reasons
 *
 * Each task is content-area authentic (science, math, social studies, ELA),
 * carries bilingual vocabulary, sentence frames, "what to listen/read for"
 * focus cues, a teacher use-card, and a real auto-gradable answer key that
 * matches gradeItem() in app.js.
 *
 * Merge contract (see mergeV10 in app.js): activities are appended to
 * DATA.domains[domain].levels[A|B].activities, de-duped by id. All ids are
 * prefixed "v10-" so they never collide with earlier modules.
 *
 * Supported types used here: multipleChoice, multiSelect, hotText, cloze,
 * order, sort, constructed.
 */
window.ACCESS_LAB_V10 = {
  appendActivities: {
    // ─────────────────────────── LISTENING ───────────────────────────
    Listening: {
      A: [
        {
          id: "v10-l-a-water-cycle",
          title: "Listen: The Water Cycle",
          skill: "Following multi-step science directions in order",
          time: "6 min",
          directions:
            "Listen to the science teacher describe the water cycle. Then put the steps in order.",
          prompt:
            "Number the steps of the water cycle in the order the teacher says them.",
          type: "order",
          items: [
            { id: "evap", text: "The sun heats the water. Water evaporates." },
            { id: "cond", text: "Water vapor cools and forms clouds." },
            { id: "precip", text: "Clouds get heavy. Rain falls down." },
            { id: "collect", text: "Water collects in rivers and lakes." },
          ],
          answer: ["evap", "cond", "precip", "collect"],
          correct:
            "Excellent listening! You followed all four steps: evaporation, condensation, precipitation, then collection.",
          hint: 'Listen for order words: "first," "next," "then," and "last."',
          support:
            "The teacher uses one order word before each step. Write the order word, then the action.",
          extension:
            "Tell a partner what would happen if the sun did not heat the water.",
          wida: [
            "Process oral directions",
            "Sequence steps",
            "Identify key science words",
          ],
          vocabulary: [
            [
              "evaporate",
              "to change from liquid into vapor (gas)",
              "spanish: evaporar",
            ],
            [
              "condense",
              "to change from vapor back into liquid",
              "spanish: condensar",
            ],
            [
              "precipitation",
              "rain, snow, or hail that falls down",
              "spanish: precipitación",
            ],
          ],
          frames: [
            "First, the water ___.",
            "Next, the vapor ___.",
            "Then the rain ___.",
          ],
          listenFor: ["order words", "the word evaporate", "what the sun does"],
          adminScript:
            "Listen carefully to the water cycle. First, the sun heats the water, and the water evaporates into the air. Next, the water vapor cools high in the sky and forms clouds. Then the clouds get heavy and rain falls down. Last, the water collects in rivers and lakes. Now put the four steps in order.",
          teacher: {
            use: "Science listening warm-up before a water-cycle or weather unit.",
            function:
              "Sequencing oral steps; mapping spoken order words to actions.",
            lower:
              "Read the script twice and point to a simple water-cycle diagram.",
            onLevel: "Read once at a steady pace.",
            challenge: "Have students retell the cycle with no word bank.",
            noTech:
              "Read aloud; students arrange four cut-out step cards on their desk.",
            prompt: "Which step do you think is the most important? Why?",
          },
        },
        {
          id: "v10-l-a-lunch-count",
          title: "Listen: Numbers in the Cafeteria",
          skill: "Identifying multiple spoken quantities",
          time: "5 min",
          directions:
            "Listen to the teacher take the lunch count. Choose ALL the numbers you hear.",
          prompt: "Which lunch counts does the teacher say?",
          type: "multiSelect",
          options: [
            { id: "a", text: "Fifteen students want pizza", visual: "🍕" },
            { id: "b", text: "Thirty students want pizza", visual: "🍕" },
            { id: "c", text: "Twelve students want salad", visual: "🥗" },
            { id: "d", text: "Twenty students want salad", visual: "🥗" },
          ],
          answers: ["a", "c"],
          correct:
            "Great ears! You heard fifteen for pizza and twelve for salad — the tricky “-teen” numbers.",
          hint: 'Listen for the ending. "-teen" numbers are smaller than "-ty" numbers.',
          support:
            'Fifteen ends in "-teen." Twelve is a special teen number. Both are smaller groups.',
          extension: "Say the total number of students out loud (15 + 12).",
          wida: ["Identify numbers in speech", "Distinguish -teen vs -ty"],
          vocabulary: [
            ["fifteen", "the number 15", "spanish: quince"],
            ["twelve", "the number 12", "spanish: doce"],
            [
              "cafeteria",
              "the room where students eat lunch",
              "spanish: cafetería",
            ],
          ],
          frames: [
            "I hear ___ students.",
            "___ want pizza and ___ want salad.",
          ],
          listenFor: ["a -teen number", "the ending sound", "the food word"],
          adminScript:
            "I am taking the lunch count. Listen. Fifteen students want pizza today. Twelve students want salad today. Now choose all the numbers you heard.",
          teacher: {
            use: "Number-listening warm-up; targets the -teen/-ty confusion.",
            function: "Listening for quantities and matching numbers to nouns.",
            lower: "Hold up number cards (15, 12) after reading.",
            onLevel: "Read once at normal speed.",
            challenge: "Add a third item and ask for the total.",
            noTech: "Read aloud; students write each number on a whiteboard.",
            prompt:
              "How do fifteen and fifty sound different when you say them?",
          },
        },
        {
          id: "v10-l-a-map-directions",
          title: "Listen: Find It on the Map",
          skill: "Following oral directions with position words",
          time: "5 min",
          directions:
            "Listen to the directions to the library. Choose where the library is.",
          prompt:
            "The teacher says: 'Walk past the gym. The library is next to the office, across from the cafeteria.' Where is the library?",
          type: "multipleChoice",
          options: [
            { id: "a", text: "Next to the office", visual: "📚" },
            { id: "b", text: "Inside the gym", visual: "🏀" },
            { id: "c", text: "Past the cafeteria doors", visual: "🍽️" },
            { id: "d", text: "Across from the office", visual: "🚪" },
          ],
          answer: "a",
          correct:
            "Correct! You caught the position words: the library is NEXT TO the office.",
          hint: 'Listen for position words: "next to," "across from," "past."',
          support:
            'Position words tell you WHERE. "Next to" means right beside.',
          extension: "Use a position word to tell where YOUR classroom is.",
          wida: ["Process directional language", "Identify position words"],
          vocabulary: [
            ["next to", "right beside something", "spanish: al lado de"],
            ["across from", "on the opposite side", "spanish: enfrente de"],
            ["past", "going beyond a place", "spanish: más allá de"],
          ],
          frames: [
            "The library is ___ the office.",
            "It is ___ the cafeteria.",
          ],
          listenFor: ["a position word", "the word library", "the word office"],
          adminScript:
            "Listen for directions to the library. Walk past the gym. The library is next to the office, across from the cafeteria. Now answer: Where is the library?",
          teacher: {
            use: "Social-studies / school-orientation listening for newcomers.",
            function:
              "Following directional language; mapping spoken position words.",
            lower: "Read twice; point to a simple school map.",
            onLevel: "Read once at a steady pace.",
            challenge: "Give a three-turn route and ask for the end point.",
            noTech: "Read aloud; students trace the route on a paper map.",
            prompt: "What position word helped you the most?",
          },
        },
      ],
      B: [
        {
          id: "v10-l-b-recycling-podcast",
          title: "Listen: The Recycling Podcast",
          skill: "Selecting several supporting details from connected speech",
          time: "7 min",
          directions:
            "Listen to a short class podcast about recycling. Choose ALL the reasons the speaker gives.",
          prompt:
            "Which reasons does the speaker give for recycling at school?",
          type: "multiSelect",
          options: [
            { id: "a", text: "It saves trees and energy." },
            { id: "b", text: "It keeps the cafeteria warmer." },
            { id: "c", text: "It reduces trash in landfills." },
            { id: "d", text: "It can save the school money." },
          ],
          answers: ["a", "c", "d"],
          correct:
            "Strong listening! You found all three reasons: saving resources, less landfill trash, and saving money.",
          hint: 'Listen for reason language: "because," "this helps," and "another reason."',
          support:
            "Speakers signal reasons with words like 'because' and 'another reason is.' The warmer cafeteria was never said.",
          extension:
            "Which reason is most convincing to you? Explain in one sentence.",
          wida: [
            "Identify multiple supporting details",
            "Distinguish stated vs. unstated information",
          ],
          vocabulary: [
            [
              "recycle",
              "to use materials again instead of throwing them away",
              "spanish: reciclar",
            ],
            ["landfill", "a place where trash is buried", "spanish: vertedero"],
            ["reduce", "to make smaller or less", "spanish: reducir"],
          ],
          frames: ["One reason is ___.", "Another reason is ___ because ___."],
          listenFor: [
            "the word because",
            "a reason",
            "the phrase another reason",
          ],
          adminScript:
            "Welcome to our class podcast about recycling. We should recycle at school for three reasons. First, recycling saves trees and energy because we make less new paper and plastic. Another reason is that it reduces the trash that goes to landfills. Finally, recycling can save the school money on trash pickup. Now choose all the reasons you heard.",
          teacher: {
            use: "Developing-level listening for argument and supporting reasons.",
            function: "Tracking multiple reasons across connected speech.",
            lower: "Pause after each reason and restate it.",
            onLevel: "Play or read once, then once more for checking.",
            challenge:
              "Ask students to rank the reasons and justify the order.",
            noTech:
              "Read aloud; students jot one word per reason as they listen.",
            prompt: "Which signal words told you a reason was coming?",
          },
        },
        {
          id: "v10-l-b-debate-rules",
          title: "Listen: Class Debate Rules",
          skill: "Sequencing procedural directions from speech",
          time: "6 min",
          directions:
            "Listen to the teacher explain how the class debate works. Put the steps in order.",
          prompt:
            "Order the steps of the debate the way the teacher explains them.",
          type: "order",
          items: [
            { id: "claim", text: "Team A states its claim." },
            { id: "evidence", text: "Team A gives two pieces of evidence." },
            { id: "respond", text: "Team B responds and asks a question." },
            { id: "vote", text: "The class votes on the strongest argument." },
          ],
          answer: ["claim", "evidence", "respond", "vote"],
          correct:
            "Well sequenced! Claim, then evidence, then the response, and finally the vote.",
          hint: 'Listen for transitions: "to begin," "after that," "then," and "finally."',
          support:
            "Each step starts with a transition word. The claim always comes before the evidence.",
          extension:
            "Why does evidence come AFTER the claim? Explain to a partner.",
          wida: [
            "Sequence procedural steps",
            "Process academic discussion language",
          ],
          vocabulary: [
            ["claim", "a statement you try to prove", "spanish: afirmación"],
            ["evidence", "facts that support a claim", "spanish: evidencia"],
            ["respond", "to answer or reply", "spanish: responder"],
          ],
          frames: ["To begin, ___.", "After that, ___.", "Finally, ___."],
          listenFor: [
            "transition words",
            "the word claim",
            "the word evidence",
          ],
          adminScript:
            "Here is how our debate works. To begin, Team A states its claim. After that, Team A gives two pieces of evidence to support the claim. Then Team B responds and asks one question. Finally, the class votes on the strongest argument. Now put the steps in order.",
          teacher: {
            use: "Set up academic-discussion routines; pairs with a Speaking debate task.",
            function:
              "Following multi-step procedures; tracking transition words.",
            lower: "Read twice; provide the four steps on cards.",
            onLevel: "Read once at a steady pace.",
            challenge: "Add a rebuttal step and ask students to re-order.",
            noTech: "Read aloud; students arrange step cards.",
            prompt: "What is the difference between a claim and evidence?",
          },
        },
        {
          id: "v10-l-b-weather-report",
          title: "Listen: The Weather Report",
          skill: "Listening for details to complete a report",
          time: "6 min",
          directions:
            "Listen to the weather report. Then complete the sentences with the words you heard.",
          prompt:
            "Fill each blank with the correct word from the weather report.",
          type: "cloze",
          segments: [
            { text: "Today will be " },
            {
              blank: {
                id: "b1",
                options: ["sunny", "cloudy", "snowy"],
                answer: "cloudy",
              },
            },
            { text: " with a high temperature of " },
            { blank: { id: "b2", options: ["52", "72", "92"], answer: "72" } },
            { text: " degrees. In the afternoon there is a chance of " },
            {
              blank: {
                id: "b3",
                options: ["rain", "wind", "fog"],
                answer: "rain",
              },
            },
            { text: ", so bring an umbrella." },
          ],
          answer: { b1: "cloudy", b2: "72", b3: "rain" },
          correct:
            "Nice work! You caught all three details: cloudy, 72 degrees, and a chance of rain.",
          hint: "Listen for the sky word, the temperature number, and the afternoon weather.",
          support:
            "The report gives details in order: sky first, then temperature, then afternoon weather.",
          extension:
            "Write one sentence telling what you would wear in this weather.",
          wida: [
            "Listen for specific details",
            "Match spoken words to a written report",
          ],
          vocabulary: [
            ["temperature", "how hot or cold it is", "spanish: temperatura"],
            ["forecast", "a guess about future weather", "spanish: pronóstico"],
            [
              "chance of rain",
              "rain is possible",
              "spanish: probabilidad de lluvia",
            ],
          ],
          frames: [
            "Today will be ___.",
            "The high is ___ degrees.",
            "There is a chance of ___.",
          ],
          listenFor: [
            "the sky word",
            "the temperature number",
            "the afternoon weather",
          ],
          adminScript:
            "Here is today's weather report. Today will be cloudy with a high temperature of seventy-two degrees. In the afternoon there is a chance of rain, so bring an umbrella. Now complete the report.",
          teacher: {
            use: "Detail-listening task tied to weather/measurement vocabulary.",
            function:
              "Catching specific spoken details; numbers and weather words.",
            lower: "Read twice; reveal one blank at a time.",
            onLevel: "Read once, then verify.",
            challenge:
              "Remove the option menus and have students write the words.",
            noTech:
              "Read aloud; students write the three details on a sticky note.",
            prompt: "Which detail was hardest to catch? Why?",
          },
        },
      ],
    },

    // ─────────────────────────── SPEAKING ───────────────────────────
    Speaking: {
      A: [
        {
          id: "v10-s-a-describe-science",
          title: "Speak: Describe the Science Picture",
          skill: "Describing an image with content vocabulary and frames",
          time: "6 min",
          directions:
            "Look at the picture. Use the frames and word bank to describe what you see. Say 2–3 sentences.",
          scene: "🌱🪴☀️💧",
          prompt:
            "Describe the plant in the picture. What does it need to grow?",
          type: "constructed",
          responseLabel: "Plan your sentences (optional)",
          responsePlaceholder: "I see ___. The plant needs ___ and ___.",
          correct:
            "Practice saved! You named what you see and what the plant needs.",
          hint: "Name one thing you see, then name two things the plant needs.",
          support: "Use the word bank: plant, soil, sunlight, water, grow.",
          extension: "Say what would happen to the plant with no water.",
          wida: ["Describe an image", "Use content vocabulary in speech"],
          vocabulary: [
            ["sunlight", "light from the sun", "spanish: luz del sol"],
            ["soil", "the dirt plants grow in", "spanish: tierra"],
            ["grow", "to get bigger over time", "spanish: crecer"],
          ],
          wordBank: ["plant", "soil", "sunlight", "water", "grow"],
          frames: [
            "I see a ___.",
            "The plant needs ___ and ___.",
            "Plants grow when ___.",
          ],
          sayFor: [
            "one thing you see",
            "two things the plant needs",
            "the word grow",
          ],
          teacher: {
            use: "Speaking warm-up for a life-science (plants) lesson.",
            function:
              "Describing images; producing simple subject–verb sentences.",
            lower:
              "Let students point and use single words before full frames.",
            onLevel: "Expect 2–3 frames completed aloud.",
            challenge: "Ask for a cause/effect sentence (no water → wilts).",
            noTech:
              "Partner A describes; Partner B points to matching word cards.",
            prompt: "What is one thing all plants need?",
          },
        },
        {
          id: "v10-s-a-compare-shapes",
          title: "Speak: Compare Two Shapes",
          skill: "Comparing objects using math vocabulary",
          time: "6 min",
          directions:
            "Look at the two shapes. Use the frames to tell how they are the same and different. Say 2–3 sentences.",
          scene: "🔺  🟦",
          prompt: "How are the triangle and the square the same and different?",
          type: "constructed",
          responseLabel: "Plan your comparison (optional)",
          responsePlaceholder:
            "Both shapes ___. The triangle has ___, but the square has ___.",
          correct:
            "Great comparing! You used same/different language with shape words.",
          hint: "Say one way they are the SAME, then one way they are DIFFERENT.",
          support: "Use compare words: both, same, different, sides, corners.",
          extension: "Count the sides of each shape and say the numbers.",
          wida: ["Compare and contrast objects", "Use math vocabulary"],
          vocabulary: [
            ["sides", "the straight edges of a shape", "spanish: lados"],
            ["corners", "where two sides meet (vertices)", "spanish: esquinas"],
            [
              "compare",
              "tell how things are alike or different",
              "spanish: comparar",
            ],
          ],
          wordBank: ["triangle", "square", "sides", "corners", "both"],
          frames: [
            "Both shapes have ___.",
            "The triangle has ___ sides.",
            "But the square has ___ sides.",
          ],
          sayFor: [
            "a 'both' sentence",
            "a 'but' sentence",
            "the number of sides",
          ],
          teacher: {
            use: "Math-talk routine for geometry vocabulary.",
            function: "Comparing/contrasting; using 'both' and 'but'.",
            lower: "Provide the side counts; students fill frames.",
            onLevel: "Expect one same and one different statement.",
            challenge: "Add a third shape and ask which two are most alike.",
            noTech: "Students hold shape cards and trade comparisons in pairs.",
            prompt: "Which shape has more corners?",
          },
        },
        {
          id: "v10-s-a-retell-day",
          title: "Speak: Retell Your School Day",
          skill: "Retelling events in order with time words",
          time: "6 min",
          directions:
            "Tell about your school day in order. Use the time words. Say 3 sentences.",
          prompt: "What do you do first, next, and last at school?",
          type: "constructed",
          responseLabel: "Plan your retell (optional)",
          responsePlaceholder: "First, I ___. Next, I ___. Last, I ___.",
          correct:
            "Nice retell! You used time order words to organize your day.",
          hint: "Use one time word for each sentence: first, next, last.",
          support: "Use the word bank: arrive, class, lunch, learn, leave.",
          extension: "Add one feeling word: I feel ___ when ___.",
          wida: ["Sequence personal events", "Use time-order transitions"],
          vocabulary: [
            ["arrive", "to get to a place", "spanish: llegar"],
            ["schedule", "the plan for your day", "spanish: horario"],
            ["finally", "the last thing", "spanish: finalmente"],
          ],
          wordBank: ["arrive", "class", "lunch", "learn", "leave"],
          frames: ["First, I ___.", "Next, I ___.", "Last, I ___."],
          sayFor: ["the word first", "the word next", "the word last"],
          teacher: {
            use: "Personal-narrative speaking; builds time-order language.",
            function: "Sequencing events aloud with transitions.",
            lower: "Offer a picture schedule to point to while speaking.",
            onLevel: "Expect three ordered sentences.",
            challenge: "Add 'before/after' sentences.",
            noTech: "Partners interview each other and retell to the group.",
            prompt: "What is your favorite part of the school day?",
          },
        },
      ],
      B: [
        {
          id: "v10-s-b-opinion-reasons",
          title: "Speak: State and Support an Opinion",
          skill: "Giving an opinion with two reasons",
          time: "7 min",
          directions:
            "Give your opinion. Support it with TWO reasons using 'because.' Say 4–6 connected sentences.",
          prompt:
            "Should students have a longer lunch break? Give your opinion and two reasons.",
          type: "constructed",
          responseLabel: "Plan your opinion (optional)",
          responsePlaceholder:
            "I think ___ because ___. Another reason is ___. So ___.",
          correct:
            "Strong response! You stated a clear opinion and supported it with reasons.",
          hint: "State your opinion first. Then give two 'because' reasons.",
          support:
            "Use expansion words: because (reason), but (contrast), so (result).",
          extension: "Answer one objection: Some people think ___, but ___.",
          wida: ["State and justify an opinion", "Use cause/result language"],
          vocabulary: [
            ["opinion", "what you think or believe", "spanish: opinión"],
            ["reason", "why you think something", "spanish: razón"],
            ["convince", "to make someone agree", "spanish: convencer"],
          ],
          wordBank: ["opinion", "because", "reason", "however", "therefore"],
          frames: [
            "I think ___ because ___.",
            "Another reason is ___.",
            "So I believe ___.",
          ],
          sayFor: [
            "a clear opinion",
            "two 'because' reasons",
            "a result with 'so'",
          ],
          teacher: {
            use: "Opinion-speaking task; pairs with the Listening debate-rules item.",
            function:
              "Producing claim + supporting reasons in connected speech.",
            lower: "Provide a reason bank to choose from.",
            onLevel: "Expect an opinion and two reasons.",
            challenge: "Require a counter-argument and rebuttal.",
            noTech: "Hold a 2-minute paired debate, then switch sides.",
            prompt: "Which of your two reasons is stronger? Why?",
          },
        },
        {
          id: "v10-s-b-describe-data",
          title: "Speak: Describe the Data",
          skill: "Explaining a simple chart in connected sentences",
          time: "7 min",
          directions:
            "Look at the bar chart. Describe what it shows and what you notice. Say 4–6 sentences.",
          scene: "📊",
          prompt:
            "The bar chart shows favorite sports: Soccer 12, Basketball 8, Swimming 4. Describe the data.",
          type: "constructed",
          responseLabel: "Plan your description (optional)",
          responsePlaceholder:
            "The chart shows ___. The most popular is ___. ___ is the least popular because ___.",
          correct:
            "Excellent data talk! You named the most and least and compared the bars.",
          hint: "Say what the chart shows, then the most and least popular.",
          support: "Use data words: most, least, more than, fewer than, total.",
          extension:
            "How many students were surveyed in total? Say the number.",
          wida: ["Interpret and describe data", "Use comparative language"],
          vocabulary: [
            ["data", "information, often numbers", "spanish: datos"],
            ["popular", "liked by many people", "spanish: popular"],
            ["compare", "tell how things differ", "spanish: comparar"],
          ],
          wordBank: ["chart", "most", "least", "more than", "total"],
          frames: [
            "The chart shows ___.",
            "The most popular is ___.",
            "Soccer has more than ___.",
          ],
          sayFor: [
            "what the chart shows",
            "the most and least",
            "a 'more than' comparison",
          ],
          teacher: {
            use: "Math/science data-talk; integrates graphs with language.",
            function: "Describing data; producing comparative sentences.",
            lower: "Provide the totals; students compare with frames.",
            onLevel: "Expect most/least plus one comparison.",
            challenge: "Ask for the total and a percentage estimate.",
            noTech: "Sketch the bars on the board; students narrate in pairs.",
            prompt: "What is one question this chart does NOT answer?",
          },
        },
        {
          id: "v10-s-b-recommend",
          title: "Speak: Make a Recommendation",
          skill: "Recommending a choice and justifying it",
          time: "7 min",
          directions:
            "A new student asks for advice. Recommend ONE club and explain why. Say 4–6 sentences.",
          prompt:
            "A new student wants to make friends and likes science. Which club do you recommend, and why?",
          type: "constructed",
          responseLabel: "Plan your recommendation (optional)",
          responsePlaceholder:
            "I recommend ___ because ___. In this club, you can ___. So it is a good choice for ___.",
          correct:
            "Persuasive! You recommended a club and justified it for the student's goals.",
          hint: "Name the club, give a reason, then connect it to the student's interest.",
          support:
            "Use advice language: I recommend, you should, this is good because.",
          extension: "Add one more option: You could also try ___, but ___.",
          wida: [
            "Make and justify a recommendation",
            "Connect reasons to a goal",
          ],
          vocabulary: [
            ["recommend", "to suggest something good", "spanish: recomendar"],
            ["interest", "something you like", "spanish: interés"],
            ["benefit", "a good result", "spanish: beneficio"],
          ],
          wordBank: [
            "recommend",
            "because",
            "interest",
            "benefit",
            "therefore",
          ],
          frames: [
            "I recommend ___ because ___.",
            "In this club, you can ___.",
            "So it fits ___.",
          ],
          sayFor: [
            "a clear recommendation",
            "a reason linked to science",
            "a benefit",
          ],
          teacher: {
            use: "Real-world persuasive speaking; community-building theme.",
            function: "Recommending and justifying for an audience and goal.",
            lower: "Provide a club list with one benefit each.",
            onLevel: "Expect a recommendation plus a goal-linked reason.",
            challenge: "Compare two clubs and defend the better fit.",
            noTech: "Role-play: one student asks, one advises, then switch.",
            prompt:
              "Why did you connect your reason to the student's interest?",
          },
        },
      ],
    },

    // ─────────────────────────── READING ───────────────────────────
    Reading: {
      A: [
        {
          id: "v10-r-a-main-idea",
          title: "Read: Find the Main Idea",
          skill: "Identifying the main idea of a short text",
          time: "6 min",
          directions: "Read the short text. Choose the main idea.",
          prompt:
            "Text: Bees are very important. They move pollen from flower to flower. This helps plants make fruit and seeds. Without bees, we would have much less food.",
          type: "multipleChoice",
          options: [
            {
              id: "a",
              text: "Bees are important because they help plants make food.",
              visual: "🐝",
            },
            {
              id: "b",
              text: "Bees are the color yellow and black.",
              visual: "🎨",
            },
            {
              id: "c",
              text: "Flowers smell nice in the spring.",
              visual: "🌸",
            },
            {
              id: "d",
              text: "Bees live in big groups called hives.",
              visual: "🏠",
            },
          ],
          answer: "a",
          correct:
            "Correct! The main idea is the BIG point: bees are important because they help plants make food.",
          hint: "The main idea is the biggest point, not one small detail.",
          support:
            "The first and last sentences often hold the main idea. Color and hives are small details.",
          extension:
            "Write one detail from the text that supports the main idea.",
          wida: ["Identify the main idea", "Separate main idea from detail"],
          vocabulary: [
            [
              "pollen",
              "yellow dust that helps plants make seeds",
              "spanish: polen",
            ],
            ["important", "needed and valuable", "spanish: importante"],
            [
              "main idea",
              "the biggest point of a text",
              "spanish: idea principal",
            ],
          ],
          frames: [
            "The main idea is ___.",
            "One detail that supports it is ___.",
          ],
          readFor: [
            "the biggest point",
            "the first sentence",
            "the last sentence",
          ],
          teacher: {
            use: "Main-idea reading routine with a science text.",
            function: "Distinguishing main idea from supporting detail.",
            lower:
              "Read the text aloud; underline the first and last sentences.",
            onLevel: "Students read independently, then choose.",
            challenge: "Ask for a one-sentence summary in their own words.",
            noTech: "Highlight the main-idea sentence on a printed copy.",
            prompt: "Why is the bee's job important for people?",
          },
        },
        {
          id: "v10-r-a-chart-read",
          title: "Read: Read the Schedule",
          skill: "Finding information in a simple chart",
          time: "6 min",
          directions:
            "Read the class schedule. Match each class to the correct time.",
          prompt:
            "Schedule — Math: 9:00, Science: 10:00, Lunch: 11:30, Reading: 12:30. Sort each class into Morning or Afternoon.",
          type: "sort",
          categories: ["Morning", "Afternoon"],
          items: [
            { id: "math", text: "Math (9:00)", answer: "Morning" },
            { id: "science", text: "Science (10:00)", answer: "Morning" },
            { id: "lunch", text: "Lunch (11:30)", answer: "Morning" },
            { id: "reading", text: "Reading (12:30)", answer: "Afternoon" },
          ],
          answer: {
            math: "Morning",
            science: "Morning",
            lunch: "Morning",
            reading: "Afternoon",
          },
          correct:
            "Nice chart reading! Times before 12:00 are morning; 12:30 is afternoon.",
          hint: "Morning is before 12:00 noon. Afternoon is after 12:00.",
          support: "Look at the number before the colon. Below 12 = morning.",
          extension: "Which class is right after lunch? Write the name.",
          wida: ["Locate information in a chart", "Understand time references"],
          vocabulary: [
            ["schedule", "a plan that shows times", "spanish: horario"],
            ["morning", "before noon", "spanish: mañana"],
            ["afternoon", "after noon", "spanish: tarde"],
          ],
          frames: ["___ is in the morning.", "___ is in the afternoon."],
          readFor: [
            "the time numbers",
            "the word noon",
            "morning vs afternoon",
          ],
          teacher: {
            use: "Functional reading of a schedule; supports school orientation.",
            function: "Extracting data from a chart; time concepts.",
            lower: "Mark a 12:00 line on a printed schedule.",
            onLevel: "Students sort independently.",
            challenge: "Add elapsed-time questions (how long until lunch?).",
            noTech: "Cut-and-sort class cards into two columns.",
            prompt: "How do you know if a time is morning or afternoon?",
          },
        },
        {
          id: "v10-r-a-vocab-context",
          title: "Read: Choose the Right Word",
          skill: "Using context to choose vocabulary",
          time: "6 min",
          directions:
            "Read the sentences. Choose the best word for each blank.",
          prompt: "Fill the blanks with the word that makes sense.",
          type: "cloze",
          segments: [
            { text: "A thermometer is a tool that measures " },
            {
              blank: {
                id: "b1",
                options: ["temperature", "color", "sound"],
                answer: "temperature",
              },
            },
            { text: ". When it is hot, the number goes " },
            {
              blank: {
                id: "b2",
                options: ["up", "down", "away"],
                answer: "up",
              },
            },
            { text: ". Scientists use it to " },
            {
              blank: {
                id: "b3",
                options: ["measure", "paint", "eat"],
                answer: "measure",
              },
            },
            { text: " how warm or cold something is." },
          ],
          answer: { b1: "temperature", b2: "up", b3: "measure" },
          correct:
            "Great word choices! Each word fits the science meaning of the sentence.",
          hint: "Read the whole sentence first. Which word matches a thermometer?",
          support:
            "A thermometer is about heat. That clue helps you choose 'temperature.'",
          extension: "Write one sentence using the word 'measure.'",
          wida: ["Use context clues", "Apply science vocabulary"],
          vocabulary: [
            [
              "thermometer",
              "a tool that measures temperature",
              "spanish: termómetro",
            ],
            ["measure", "to find the size or amount", "spanish: medir"],
            ["temperature", "how hot or cold it is", "spanish: temperatura"],
          ],
          frames: [
            "A thermometer measures ___.",
            "When it is hot, the number goes ___.",
          ],
          readFor: ["the tool word", "the heat clue", "what scientists do"],
          teacher: {
            use: "Context-clue practice with science vocabulary.",
            function: "Selecting words from context; academic vocabulary.",
            lower: "Reveal one blank at a time; reread each sentence.",
            onLevel: "Students complete all blanks, then justify one.",
            challenge: "Remove the menus; students supply words.",
            noTech: "Word-bank cards placed into printed blanks.",
            prompt: "What clue word told you to choose 'temperature'?",
          },
        },
      ],
      B: [
        {
          id: "v10-r-b-evidence-hot",
          title: "Read: Find the Evidence",
          skill: "Selecting the sentence that best supports an answer",
          time: "8 min",
          directions:
            "Read the passage. Then click the sentence that BEST supports the answer.",
          prompt:
            "Question: Why did the city build a new bike path? Click the sentence that gives the best evidence.",
          type: "hotText",
          sentences: [
            {
              id: "s1",
              text: "Last year, more people in the city started riding bikes to work.",
            },
            {
              id: "s2",
              text: "The city wanted to reduce traffic and keep cyclists safe.",
            },
            { id: "s3", text: "The new path is painted bright green." },
            { id: "s4", text: "Some riders enjoy the view of the river." },
          ],
          answers: ["s2"],
          correct:
            "Exactly. Sentence 2 states the reason — reduce traffic and keep cyclists safe — which directly answers WHY.",
          hint: "Which sentence gives a REASON, not just a fact about the path?",
          support:
            "Evidence for a 'why' question explains a purpose or reason. Color and views are details.",
          extension: "Write a sentence: The city built the path because ___.",
          wida: ["Cite text evidence", "Distinguish reasons from details"],
          vocabulary: [
            [
              "evidence",
              "facts from the text that prove an idea",
              "spanish: evidencia",
            ],
            ["purpose", "the reason for doing something", "spanish: propósito"],
            ["reduce", "to make less", "spanish: reducir"],
          ],
          frames: [
            "The best evidence is ___.",
            "The city built the path because ___.",
          ],
          readFor: ["a reason sentence", "the word safe", "the word traffic"],
          teacher: {
            use: "Text-evidence routine for argument/informational reading.",
            function:
              "Citing evidence; separating reason from descriptive detail.",
            lower: "Read aloud; cross out two clearly-detail sentences first.",
            onLevel: "Students select and justify their choice.",
            challenge:
              "Find a second sentence that adds weaker support; rank them.",
            noTech:
              "Highlight the best-evidence sentence on a printed passage.",
            prompt: "How is a reason different from a detail?",
          },
        },
        {
          id: "v10-r-b-compare-texts",
          title: "Read: Compare Two Texts",
          skill: "Identifying shared ideas across two short texts",
          time: "8 min",
          directions:
            "Read both short texts. Choose ALL the ideas that appear in BOTH texts.",
          prompt:
            "Text 1: Walking to school is healthy and saves money. Text 2: Many students walk to school because it is good exercise and costs nothing. Which ideas are in BOTH?",
          type: "multiSelect",
          options: [
            { id: "a", text: "Walking to school is healthy / good exercise." },
            { id: "b", text: "Walking to school saves money / costs nothing." },
            { id: "c", text: "Walking to school is dangerous." },
            { id: "d", text: "Buses are always late." },
          ],
          answers: ["a", "b"],
          correct:
            "Strong comparison! Both texts say walking is healthy AND saves money.",
          hint: "Look for the same idea said in different words in each text.",
          support:
            "'Healthy' and 'good exercise' mean the same. 'Saves money' and 'costs nothing' match too.",
          extension: "Write one idea that is in ONLY one text.",
          wida: ["Compare ideas across texts", "Recognize paraphrase"],
          vocabulary: [
            ["compare", "tell how things are alike", "spanish: comparar"],
            [
              "exercise",
              "activity that keeps you healthy",
              "spanish: ejercicio",
            ],
            ["similar", "almost the same", "spanish: similar"],
          ],
          frames: ["Both texts say ___.", "One idea in only one text is ___."],
          readFor: ["a shared idea", "matching words", "a money idea"],
          teacher: {
            use: "Cross-text synthesis; builds paraphrase recognition.",
            function:
              "Comparing texts; matching ideas across different wording.",
            lower: "Underline matching words in each text before choosing.",
            onLevel: "Students select both shared ideas.",
            challenge: "Write a sentence stating the shared main idea.",
            noTech: "Venn diagram on paper with the two texts.",
            prompt: "How can two texts share an idea but use different words?",
          },
        },
        {
          id: "v10-r-b-sequence-events",
          title: "Read: Put the Events in Order",
          skill: "Sequencing events from a narrative text",
          time: "8 min",
          directions:
            "Read the story. Put the four events in the order they happened.",
          prompt:
            "Story: Maya planted a seed in a cup. She watered it every day. After a week, a small green sprout appeared. Soon she moved the plant to the school garden. Order the events.",
          type: "order",
          items: [
            { id: "plant", text: "Maya planted a seed in a cup." },
            { id: "water", text: "She watered it every day." },
            { id: "sprout", text: "A small green sprout appeared." },
            { id: "garden", text: "She moved the plant to the garden." },
          ],
          answer: ["plant", "water", "sprout", "garden"],
          correct:
            "Well sequenced! You followed Maya's plant from seed to garden.",
          hint: 'Look for time clues: "every day," "after a week," and "soon."',
          support:
            "Events are usually told in time order. Watering comes before the sprout appears.",
          extension: "Predict the next event. Write one sentence.",
          wida: ["Sequence narrative events", "Use time signal words"],
          vocabulary: [
            ["sprout", "a tiny new plant", "spanish: brote"],
            ["sequence", "the order of events", "spanish: secuencia"],
            ["appear", "to come into view", "spanish: aparecer"],
          ],
          frames: ["First, Maya ___.", "After a week, ___.", "Finally, ___."],
          readFor: [
            "time clue words",
            "what happened first",
            "what happened last",
          ],
          teacher: {
            use: "Narrative sequencing tied to a science (plant growth) theme.",
            function: "Ordering events; using temporal signal words.",
            lower: "Read aloud; provide event cards to arrange.",
            onLevel: "Students order independently.",
            challenge: "Retell the story using all four time words.",
            noTech: "Arrange sentence strips in order on the desk.",
            prompt: "Which time clue helped you the most?",
          },
        },
      ],
    },

    // ─────────────────────────── WRITING ───────────────────────────
    Writing: {
      A: [
        {
          id: "v10-w-a-describe-frames",
          title: "Write: Describe a Picture",
          skill: "Writing 2–3 descriptive sentences with frames",
          time: "9 min",
          directions:
            "Look at the picture. Write 2–3 sentences to describe it. Use the frames and word bank.",
          scene: "🏫🌳🚸",
          prompt: "Describe what you see near the school.",
          type: "constructed",
          responseLabel: "Write your description",
          responsePlaceholder: "I see a ___. There is a ___ next to the ___.",
          correct:
            "Saved! You described the picture with clear nouns and position words.",
          hint: "Name two things you see and tell where they are.",
          support:
            "Use the word bank: school, tree, crosswalk, students, near.",
          extension: "Add one color word to one of your sentences.",
          wida: ["Produce descriptive sentences", "Use position words"],
          vocabulary: [
            [
              "crosswalk",
              "lines where people cross the street",
              "spanish: cruce peatonal",
            ],
            ["near", "close to", "spanish: cerca de"],
            [
              "describe",
              "to tell what something is like",
              "spanish: describir",
            ],
          ],
          wordBank: ["school", "tree", "crosswalk", "students", "near"],
          frames: [
            "I see a ___.",
            "There is a ___ near the ___.",
            "The ___ is ___.",
          ],
          teacher: {
            use: "Foundational descriptive writing for newcomers.",
            function:
              "Writing simple S-V-O sentences; spelling from a word bank.",
            lower: "Allow labeling first, then expand to a frame.",
            onLevel: "Expect 2–3 complete frame sentences.",
            challenge: "Add adjectives and a 'because' sentence.",
            noTech: "Students draw and label, then write under the picture.",
            prompt: "What is the most important thing you see? Why?",
          },
        },
        {
          id: "v10-w-a-caption",
          title: "Write: Write a Caption",
          skill: "Writing a caption that explains an image",
          time: "8 min",
          directions:
            "Write a caption (1–2 sentences) that tells what is happening in the picture.",
          scene: "🔬👩‍🔬🧪",
          prompt: "Write a caption for this science class picture.",
          type: "constructed",
          responseLabel: "Write your caption",
          responsePlaceholder:
            "In this picture, a student is ___. She uses a ___ to ___.",
          correct:
            "Nice caption! You told who, what, and why in a short, clear way.",
          hint: "A caption tells WHO is doing WHAT.",
          support:
            "Use the word bank: student, microscope, experiment, observe, learn.",
          extension: "Add why the student is doing the experiment.",
          wida: [
            "Write an explanatory caption",
            "Use present-progressive verbs",
          ],
          vocabulary: [
            [
              "caption",
              "words that explain a picture",
              "spanish: leyenda / pie de foto",
            ],
            ["observe", "to watch carefully", "spanish: observar"],
            ["experiment", "a science test", "spanish: experimento"],
          ],
          wordBank: ["student", "microscope", "experiment", "observe", "learn"],
          frames: ["In this picture, ___ is ___.", "She uses a ___ to ___."],
          teacher: {
            use: "Caption writing connects images to academic verbs.",
            function: "Producing 'who + is + verb-ing' sentences.",
            lower: "Provide the verb in -ing form.",
            onLevel: "Expect a who/what caption.",
            challenge: "Add a purpose clause with 'to' or 'so that.'",
            noTech: "Students caption a magazine science photo.",
            prompt: "What is the student trying to learn?",
          },
        },
        {
          id: "v10-w-a-opinion-short",
          title: "Write: My Favorite Subject",
          skill: "Writing a short opinion with one reason",
          time: "9 min",
          directions:
            "Write 2–3 sentences about your favorite subject. Give ONE reason using 'because.'",
          prompt: "What is your favorite subject, and why?",
          type: "constructed",
          responseLabel: "Write your opinion",
          responsePlaceholder:
            "My favorite subject is ___ because ___. I like it when ___.",
          correct:
            "Saved! You stated an opinion and supported it with a 'because' reason.",
          hint: "Name the subject, then add 'because' and a reason.",
          support: "Use the word bank: favorite, subject, because, learn, fun.",
          extension: "Add a second sentence about what you do in that class.",
          wida: ["State an opinion", "Support with a reason"],
          vocabulary: [
            ["favorite", "the one you like best", "spanish: favorito"],
            [
              "subject",
              "a school class like math or science",
              "spanish: materia",
            ],
            ["reason", "why you think something", "spanish: razón"],
          ],
          wordBank: ["favorite", "subject", "because", "learn", "fun"],
          frames: [
            "My favorite subject is ___.",
            "I like it because ___.",
            "In this class, I ___.",
          ],
          teacher: {
            use: "Entry-level opinion writing with one reason.",
            function: "Opinion + reason structure; using 'because.'",
            lower: "Provide a reason bank to copy and complete.",
            onLevel: "Expect opinion plus one reason.",
            challenge: "Add a second reason and a concluding sentence.",
            noTech: "Quick-write on paper, then share with a partner.",
            prompt: "What is one thing you learned in that subject recently?",
          },
        },
      ],
      B: [
        {
          id: "v10-w-b-explain-evidence",
          title: "Write: Explain with Evidence",
          skill: "Writing an explanation supported by evidence",
          time: "11 min",
          directions:
            "Write 4–6 connected sentences. Make a claim and support it with evidence using 'because,' 'but,' and 'so.'",
          prompt:
            "Should our school start a garden club? Make a claim and support it with at least two reasons.",
          type: "constructed",
          responseLabel: "Write your explanation",
          responsePlaceholder:
            "Our school should ___ because ___. For example, ___. Some people think ___, but ___. So ___.",
          correct:
            "Strong paragraph! You made a clear claim and developed it with evidence and a counter-point.",
          hint: "Claim → reason → example → address an objection → conclusion.",
          support:
            "Use expansion words: because (reason), for example (evidence), but (contrast), so (result).",
          extension: "Add a specific number or fact as evidence.",
          wida: [
            "Write a claim with evidence",
            "Use cohesive/transition language",
          ],
          vocabulary: [
            ["claim", "a statement you support", "spanish: afirmación"],
            ["evidence", "facts that support a claim", "spanish: evidencia"],
            ["however", "a word that shows contrast", "spanish: sin embargo"],
          ],
          wordBank: ["claim", "because", "for example", "however", "therefore"],
          frames: [
            "Our school should ___ because ___.",
            "For example, ___.",
            "Some people think ___, but ___.",
            "So ___.",
          ],
          teacher: {
            use: "Argument writing; pairs with the Speaking opinion task.",
            function: "Claim + evidence + counter-argument; cohesion words.",
            lower: "Provide the four frames as a paragraph skeleton.",
            onLevel: "Expect claim, two reasons, and a conclusion.",
            challenge: "Require a cited fact and a rebuttal sentence.",
            noTech: "Color-code claim/evidence/conclusion on paper.",
            prompt: "Which piece of your evidence is strongest? Why?",
          },
        },
        {
          id: "v10-w-b-compare-write",
          title: "Write: Compare Two Choices",
          skill: "Writing a comparison with transition words",
          time: "11 min",
          directions:
            "Compare two after-school activities. Write 4–6 sentences. Tell how they are alike and different, then choose one.",
          prompt:
            "Compare joining the soccer team and joining the art club. How are they alike and different? Which would you choose, and why?",
          type: "constructed",
          responseLabel: "Write your comparison",
          responsePlaceholder:
            "Both ___ and ___ are ___. However, soccer ___, while art ___. I would choose ___ because ___.",
          correct:
            "Excellent comparison! You used 'both,' 'however,' and 'while,' then justified your choice.",
          hint: "Start with one similarity, then two differences, then your choice.",
          support:
            "Use compare/contrast words: both, alike, however, while, on the other hand.",
          extension: "Add one sentence about who would enjoy each activity.",
          wida: ["Compare and contrast in writing", "Use contrast transitions"],
          vocabulary: [
            ["compare", "tell how things are alike", "spanish: comparar"],
            [
              "contrast",
              "tell how things are different",
              "spanish: contrastar",
            ],
            [
              "while",
              "a word that shows a difference",
              "spanish: mientras que",
            ],
          ],
          wordBank: ["both", "alike", "however", "while", "on the other hand"],
          frames: [
            "Both ___ and ___ are ___.",
            "However, ___ while ___.",
            "I would choose ___ because ___.",
          ],
          teacher: {
            use: "Compare/contrast paragraph with a decision.",
            function: "Organizing similarities and differences; transitions.",
            lower: "Provide a two-column chart to fill before writing.",
            onLevel:
              "Expect a similarity, a difference, and a justified choice.",
            challenge: "Require parallel structure across both differences.",
            noTech: "T-chart on paper, then write the paragraph.",
            prompt: "Which difference mattered most in your choice?",
          },
        },
        {
          id: "v10-w-b-persuade",
          title: "Write: Persuade Your Principal",
          skill: "Writing a short persuasive message to an audience",
          time: "12 min",
          directions:
            "Write a short message (5–6 sentences) to persuade the principal. State your request, give two reasons, and end politely.",
          prompt:
            "Write to your principal asking for more time in the library each week. Give two reasons and a polite ending.",
          type: "constructed",
          responseLabel: "Write your persuasive message",
          responsePlaceholder:
            "Dear Principal ___, I am writing because ___. First, ___. Second, ___. For these reasons, ___. Thank you for ___.",
          correct:
            "Persuasive and polite! You stated a request, gave two reasons, and closed respectfully.",
          hint: "Greeting → request → reason 1 → reason 2 → polite closing.",
          support:
            "Use persuasive language: I am writing because, first/second, for these reasons, thank you.",
          extension:
            "Add a sentence that answers a possible 'no' from the principal.",
          wida: [
            "Write for a specific audience",
            "Organize a persuasive request",
          ],
          vocabulary: [
            ["persuade", "to convince someone to agree", "spanish: persuadir"],
            ["request", "something you politely ask for", "spanish: petición"],
            ["respectful", "polite and considerate", "spanish: respetuoso"],
          ],
          wordBank: ["persuade", "request", "because", "first", "second"],
          frames: [
            "Dear Principal ___, I am writing because ___.",
            "First, ___.",
            "Second, ___.",
            "Thank you for ___.",
          ],
          teacher: {
            use: "Authentic audience writing; letters/email register.",
            function: "Persuasive structure; polite/formal language.",
            lower: "Provide the greeting and closing; students add the middle.",
            onLevel: "Expect request, two reasons, and a closing.",
            challenge: "Require a rebuttal to a likely objection.",
            noTech: "Draft on paper; peer-check for politeness and reasons.",
            prompt: "How did you make your message sound respectful?",
          },
        },
      ],
    },
  },
};

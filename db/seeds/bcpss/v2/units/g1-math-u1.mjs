// BCPSS Language Studio v2 — g1-math-u1 (Grade 1 Math, Reveal Math). Schema: ../schema.mjs

const sup = (l1_2, l3_4, l5_6) => ({ l1_2, l3_4, l5_6 });

export default {
  essential_question: "How can I pick a smart plan and prove my answer is right?",
  can_do: {
    content: "I can add and subtract within 20 with a smart strategy.",
    language: "I can say my strategy and tell why it works.",
  },
  mentor: {
    text: "I solved 6 + 7 with doubles because I know 6 + 6 is 12. So the sum is 13.",
    gist: "The speaker names the strategy, gives a reason, and then says the answer.",
    chunks: [
      { text: "I solved 6 + 7 with doubles", role: "The strategy", tone: "concept", ask: "Which strategy does the speaker use?" },
      { text: "because", role: "The reason word", tone: "connector", ask: "Which little word starts the reason?" },
      { text: "I know 6 + 6 is 12.", role: "The proof", tone: "evidence", ask: "Which fact does the speaker already know?" },
      { text: "So the sum is 13.", role: "The answer", tone: "precision", ask: "What is the sum, and how did 12 turn into 13?" },
    ],
  },
  frames: {
    l1_2: ["I use [doubles].", "[8] + [8] is [16].", "The sum is [number]."],
    l3_4: ["I used [strategy] because [reason].", "I know [fact], so [new fact].", "The [sum / difference] is [number]."],
    l5_6: ["I solved [problem] with [strategy] because [reason].", "First I [step]. Then I [step].", "My answer works because [proof]."],
  },
  connectors: ["because", "so", "then", "first", "next", "and"],
  vocab: [
    { term: "strategy", tier: 2, pos: "noun", icon: "💡", def: "a smart plan for solving a problem", example: "My strategy for 5 + 5 is doubles.", nonexample: "Guessing without thinking is not a strategy.", es: "estrategia", es_note: "Cognate: sounds almost the same.", family: ["strategies"], cue: "A child with a light bulb over their head and a number sentence." },
    { term: "sum", tier: 3, pos: "noun", icon: "➕", def: "the answer when you put numbers together", example: "The sum of 6 and 4 is 10.", nonexample: "The answer to 9 - 4 is not a sum.", es: "suma", es_note: "In Spanish, suma means the adding and the answer.", family: ["sums"], cue: "Two groups of dots with an arrow pointing to one big group." },
    { term: "difference", tier: 3, pos: "noun", icon: "➖", def: "what is left when you take one number away from another", example: "The difference of 9 and 4 is 5.", nonexample: "7 + 2 does not find a difference.", es: "diferencia", es_note: "Cognate: sounds almost the same.", family: ["different"], cue: "Nine counters with four crossed out and five left." },
    { term: "doubles", tier: 3, pos: "noun", icon: "👯", def: "adding a number to itself", example: "4 + 4 is a doubles fact.", nonexample: "4 + 5 is not a doubles fact.", es: "dobles", es_note: "Doble is one; dobles is more than one.", family: ["double"], cue: "Two matching dice side by side, both showing 4." },
    { term: "count on", tier: 3, pos: "phrasal verb", icon: "🔢", def: "start at one number and say the next numbers", example: "To solve 7 + 2, I count on: 8, 9.", nonexample: "Starting at 1 every time is not counting on.", es: "seguir contando", es_note: "Say 'sigo contando desde el número mayor'.", family: ["counts on", "counted on"], cue: "A hand hopping along a number path from 7 to 9." },
    { term: "make a ten", tier: 3, pos: "verb phrase", icon: "🔟", def: "move some counters to fill a ten frame, then add the rest", example: "I make a ten to solve 9 + 4.", nonexample: "Counting every dot one by one is not making a ten.", es: "formar una decena", es_note: "Decena means a group of ten.", family: ["makes a ten", "made a ten"], cue: "A ten frame full of dots with a few dots on the side." },
    { term: "related facts", tier: 3, pos: "noun", icon: "👨‍👩‍👧", def: "number sentences that use the same three numbers", example: "5 + 2 = 7 and 7 - 2 = 5 are related facts.", nonexample: "5 + 2 = 7 and 6 + 3 = 9 are not related facts.", es: "operaciones relacionadas", es_note: "Also called a fact family: familia de operaciones.", family: ["fact family"], cue: "A triangle with 2, 5 and 7 in its corners." },
    { term: "equal", tier: 2, pos: "adjective", icon: "🟰", def: "the same amount", example: "5 + 1 is equal to 6.", nonexample: "5 + 1 is not equal to 7.", es: "igual", es_note: "The = sign says 'es igual a'.", family: ["equals", "equal sign"], cue: "A balance scale with 6 cubes on each side." },
    { term: "add", tier: 2, pos: "verb", icon: "🤝", def: "to put groups together to find how many in all", example: "I add 3 and 4 to get 7.", nonexample: "Taking 3 from 7 is not adding.", es: "sumar", es_note: "Add = sumar. Sum = suma.", family: ["adds", "added", "addition"], cue: "Two groups of birds flying into one tree." },
    { term: "subtract", tier: 2, pos: "verb", icon: "✂️", def: "to take some away to find how many are left", example: "I subtract 2 from 9 to get 7.", nonexample: "Putting 2 more with 9 is not subtracting.", es: "restar", es_note: "Subtract = restar. Not the same as 'substraer' in school math.", family: ["subtracts", "subtracted", "subtraction"], cue: "Nine apples with two apples rolling away." },
  ],
  activities: [
    {
      kind: "dictogloss", domain: "Listening", title: "Boats at the Harbor", minutes: 10, grouping: "Partners",
      mission: "Listen to Jada's story twice. Tell it back!",
      tip: "Read slowly twice while children jot numbers, then partners retell using first, then, and the sum.",
      materials: ["Counters"],
      support: sup("Use counters to show the boats you hear.", "Retell with the numbers and the word sum.", "Retell all the steps and say why the ten helps."),
      payload: {
        text: "Jada sees 9 boats at the Inner Harbor. Then 4 more boats come. Jada makes a ten. 9 plus 1 is 10. Then 10 plus 3 is 13. The sum is 13.",
        key_words: ["boats", "Harbor", "makes", "ten", "sum"],
        frame: "Jada sees ___ boats. Then ___ more come. She makes a ___. The sum is ___.",
        checks: ["Jada sees 9 boats", "4 more boats come", "she makes a ten with 9 plus 1", "the sum is 13"],
      },
    },
    {
      kind: "match", domain: "Vocabulary", title: "Math Word Match-Up", minutes: 8, grouping: "Solo",
      mission: "Tap a word. Tap the picture clue that fits.",
      tip: "Have children say each word aloud and act it out before they tap.",
      materials: [],
      support: sup("Match the first four words.", "Match all eight, then use two in a sentence.", "Match all eight and add a number example to each."),
      payload: {
        left_label: "Word", right_label: "Meaning",
        pairs: [
          { l: "add", r: "🤝 put groups together" },
          { l: "subtract", r: "✂️ take some away" },
          { l: "sum", r: "➕ answer of adding" },
          { l: "difference", r: "➖ what is left" },
          { l: "doubles", r: "👯 5 + 5" },
          { l: "equal", r: "🟰 the same amount" },
          { l: "strategy", r: "💡 a smart plan" },
          { l: "related facts", r: "👨‍👩‍👧 2, 5, 7 family" },
        ],
      },
    },
    {
      kind: "word_sort", domain: "Vocabulary", title: "Pick the Best Plan", minutes: 8, grouping: "Partners",
      mission: "Sort each number sentence by its best strategy.",
      tip: "Listen for 'because'; some facts fit two groups, so accept any true reason.",
      materials: [],
      support: sup("Sort the doubles first. Look for two same numbers.", "Sort all and say a reason for two cards.", "Sort all and explain one fact that fits two groups."),
      payload: {
        categories: [{ name: "👯 Doubles" }, { name: "🔟 Make a ten" }, { name: "🔢 Count on" }],
        items: [
          { text: "3 + 3", cat: 0 }, { text: "6 + 6", cat: 0 }, { text: "8 + 8", cat: 0 }, { text: "9 + 9", cat: 0 },
          { text: "9 + 4", cat: 1 }, { text: "9 + 6", cat: 1 }, { text: "9 + 5", cat: 1 }, { text: "8 + 5", cat: 1 },
          { text: "12 + 1", cat: 2 }, { text: "14 + 2", cat: 2 }, { text: "15 + 3", cat: 2 }, { text: "16 + 1", cat: 2 },
        ],
      },
    },
    {
      kind: "clue_game", domain: "Game", title: "Mystery Math Word", minutes: 10, grouping: "Small Group",
      mission: "Open one clue at a time. Guess the math word!",
      tip: "Fewer clues used earns more points; there is no clock, so let children think.",
      materials: [],
      support: sup("Look at the picture cards to help you guess.", "Guess before you open clue three.", "Write a fourth clue for one card."),
      payload: {
        cards: [
          { term: "sum", clues: ["I am an answer.", "You get me when you put groups together.", "In 5 + 3 = 8, I am the 8."] },
          { term: "difference", clues: ["I am an answer too.", "You get me when you take some away.", "In 9 - 4 = 5, I am the 5."] },
          { term: "doubles", clues: ["I am two of the same number.", "6 + 6 is me.", "4 + 4 and 5 + 5 are me too."] },
          { term: "strategy", clues: ["I am a smart plan.", "I help you solve a problem.", "Making a ten is one of me."] },
          { term: "equal", clues: ["I mean the same amount.", "My sign is two short lines.", "In 4 + 3 = 7, both sides are me."] },
          { term: "make a ten", clues: ["I fill up a ten frame.", "9 + 4 gets easy with me.", "I move 1 to the 9."] },
          { term: "related facts", clues: ["We use the same three numbers.", "3 + 4 = 7 and 7 - 4 = 3 are us.", "We are like a family."] },
        ],
      },
    },
    {
      kind: "talk_cards", domain: "Speaking", title: "Strategy Talk", minutes: 10, grouping: "Partners",
      mission: "Pick a card. Solve it. Tell your partner why!",
      tip: "Model one turn first and listen for the strategy name plus a because reason.",
      materials: ["Counters", "Ten frames"],
      support: sup("Point to the counters and say the frame.", "Say your strategy and one reason.", "Say your strategy, your reason, and a different way."),
      payload: {
        roles: { a: "Solver", b: "Checker" },
        cards: [
          { prompt: "Solve 7 + 7. Which strategy helps?", starter: "I use doubles because ___.", follow_up: "What is 7 + 8 then?" },
          { prompt: "Solve 9 + 3. How can you make a ten?", starter: "I move ___ to the 9.", follow_up: "What is left to add?" },
          { prompt: "Solve 11 + 2. Is counting on a good plan?", starter: "I count on because ___.", follow_up: "Which number do you start at?" },
          { prompt: "Solve 15 - 6. What is the difference?", starter: "The difference is ___.", follow_up: "Which addition fact checks it?" },
          { prompt: "Say a related fact for 8 + 4 = 12.", starter: "A related fact is ___.", follow_up: "Which three numbers are in the family?" },
          { prompt: "Pick a strategy you like for 6 + 8.", starter: "I like ___ because ___.", follow_up: "Can your partner use a different plan?" },
        ],
        moves: [
          { label: "Prove it", stem: "How do you know?" },
          { label: "Another way", stem: "Can you solve it a different way?" },
          { label: "Agree", stem: "I agree because ___." },
        ],
      },
    },
    {
      kind: "info_gap", domain: "Speaking", title: "Same Sum, Two Plans", minutes: 10, grouping: "Partners",
      mission: "Ask your partner questions. Find out how both friends got 14!",
      tip: "Partners hide their cards, ask and answer aloud, then notice that both sums are 14.",
      materials: ["Info cards A and B"],
      support: sup("Use the ask frame word for word.", "Ask in your own words and say the answer back.", "Ask a follow-up, like 'Why did Ben use that plan?'"),
      payload: {
        goal: "Find out the problem, the strategy, and the sum for both friends.",
        a: { title: "Partner A", has: [{ k: "Ana's problem", v: "7 + 7" }, { k: "Ana's strategy", v: "doubles" }, { k: "Ana's sum", v: "14" }], needs: ["Ben's problem", "Ben's strategy", "Ben's sum"] },
        b: { title: "Partner B", has: [{ k: "Ben's problem", v: "9 + 5" }, { k: "Ben's strategy", v: "make a ten" }, { k: "Ben's sum", v: "14" }], needs: ["Ana's problem", "Ana's strategy", "Ana's sum"] },
        ask_frames: ["What is ___'s problem?", "Which strategy did ___ use?"],
        tell_frames: ["___'s problem is ___.", "I am not sure. Let me look again."],
      },
    },
    {
      kind: "read_annotate", domain: "Reading", title: "Crab Cake Counting", minutes: 10, grouping: "Whole Class",
      mission: "Read Dev's story. Find the math words and the numbers.",
      tip: "Read aloud twice; children circle strategy words and underline numbers on a big chart.",
      materials: ["Big chart paper"],
      support: sup("Find only the strategy words.", "Find strategy words and numbers.", "Find both, then write a related fact."),
      payload: {
        text: "Dev has 8 crab cakes. His aunt brings 3 more. Dev counts on from 8. He says 9, 10, 11. The sum is 11. A related fact is 11 - 3 = 8.",
        marks: [
          { label: "Math words", instruction: "Circle the math words.", targets: ["counts on", "sum", "related fact"] },
          { label: "Numbers in the story", instruction: "Underline the numbers that start the story.", targets: ["8 crab cakes", "3 more"] },
        ],
        questions: [
          { q: "Which strategy does Dev use?", options: ["Doubles", "Counts on", "Makes a ten"], answer: 1, why: "He starts at 8 and says the next numbers." },
          { q: "What is the sum?", options: ["8", "3", "11"], answer: 2, why: "8 + 3 = 11, so the sum is 11." },
          { q: "Which fact is related to 8 + 3 = 11?", options: ["11 - 3 = 8", "8 + 8 = 16", "3 + 3 = 6"], answer: 0, why: "It uses the same three numbers: 3, 8 and 11." },
        ],
      },
    },
    {
      kind: "unscramble", domain: "Game", title: "Build a Proof", minutes: 8, grouping: "Partners",
      mission: "Put the pieces in order to build a math sentence.",
      tip: "Ask which piece starts with a capital or a number and which piece has the end mark.",
      materials: [],
      support: sup("Find the piece that starts the sentence.", "Read it aloud to check that it makes sense.", "Build it, then change the numbers to make a new one."),
      payload: {
        items: [
          { parts: ["I used doubles", "because", "4 + 4 is 8."] },
          { parts: ["I made a ten", "to solve", "9 + 5."] },
          { parts: ["The sum", "of 7 and 3", "is 10."] },
          { parts: ["I count on", "from the", "bigger number."] },
          { parts: ["8 + 8", "makes", "16."] },
        ],
      },
    },
    {
      kind: "cloze", domain: "Reading", title: "Ten Frame Story", minutes: 8, grouping: "Solo",
      mission: "Pick the right word or number for each gap.",
      tip: "Two or three bank words are extras; ask children why they do not fit.",
      materials: ["Ten frame"],
      support: sup("Look at the ten frame to help you.", "Fill the gaps, then read the story aloud.", "Fill the gaps, then write one more sentence."),
      payload: {
        text: "Ana has 9 red dots. She adds 5 blue dots. She moves 1 blue dot to the 9 to make a {1}. Then she has 4 blue dots left. 10 plus 4 is 14. The {2} is 14. Ana used a make-a-ten {3}. 14 minus 5 is {4}.",
        answers: ["ten", "sum", "strategy", "9"],
        bank: ["ten", "sum", "strategy", "9", "difference", "doubles", "8"],
      },
    },
    {
      kind: "sequence", domain: "Reading", title: "Make a Ten Steps", minutes: 8, grouping: "Small Group",
      mission: "Put the steps in order to solve 8 + 5.",
      tip: "Use counters on a ten frame; children act out each step as they order it.",
      materials: ["Counters", "Ten frame"],
      support: sup("Look at the ten frame and say first, next, then.", "Order the steps and say each signal word.", "Order the steps, then solve 7 + 6 the same way."),
      payload: {
        title: "How to solve 8 + 5 by making a ten",
        steps: ["First, show 8 and 5.", "Next, move 2 from the 5 to the 8.", "Then, 8 + 2 makes 10.", "Finally, add the 3 left. 10 + 3 is 13."],
        signals: ["First", "Next", "Then", "Finally"],
      },
    },
    {
      kind: "error_analysis", domain: "Reading", title: "Fix the Math Talk", minutes: 10, grouping: "Partners",
      mission: "Find what is wrong. Pick the best fix!",
      tip: "Have partners say why each wrong choice does not fit before they choose.",
      materials: [],
      support: sup("Read the wrong sentence out loud. What sounds off?", "Pick the fix and say why it is better.", "Pick the fix, then write your own reason."),
      payload: {
        items: [
          { wrong: "I used doubles for 9 + 4 because it is hard.", options: ["I made a ten for 9 + 4 because 9 + 1 is 10.", "I used doubles for 9 + 4 because 9 + 4 is 13.", "I used doubles for 9 + 4 because 4 is small."], answer: 0, why: "9 and 4 are not the same number. Making a ten fits, and the reason uses a math fact." },
          { wrong: "The difference of 9 and 4 is 13.", options: ["The sum of 9 and 4 is 5.", "The sum of 9 and 4 is 13.", "The difference of 9 and 4 is 14."], answer: 1, why: "13 comes from adding, so the right word is sum." },
          { wrong: "8 + 3 = 11. I counted on.", options: ["I counted on because the sum is 11.", "I counted on from 8 because I only add 3 more.", "I counted on because I like counting."], answer: 1, why: "A good reason says why the plan fits: counting on works well when you add a small number." },
          { wrong: "6 + 6 = 13 is a doubles fact.", options: ["6 + 6 = 11 is a doubles fact.", "7 + 6 = 12 is a doubles fact.", "6 + 6 = 12 is a doubles fact."], answer: 2, why: "6 + 6 is two of the same number, and that makes 12." },
        ],
      },
    },
    {
      kind: "sentence_combine", domain: "Writing", title: "Join with Because", minutes: 10, grouping: "Partners",
      mission: "Use “because”, “so” and “then” to join 4 pairs of short sentences, starting with “I used doubles”.",
      tip: "Say both sentences, then the joined one; more than one answer can work.",
      materials: [],
      support: sup("Copy the model and change one number.", "Join the sentences and read them aloud.", "Join them, then write a new one with the same joining word."),
      payload: {
        items: [
          { sentences: ["I used doubles.", "6 + 6 is 12."], connector: "because", model: "I used doubles because 6 + 6 is 12." },
          { sentences: ["I made a ten.", "9 + 1 is 10."], connector: "because", model: "I made a ten because 9 + 1 is 10." },
          { sentences: ["I know 7 + 7 is 14.", "7 + 8 is 15."], connector: "so", model: "I know 7 + 7 is 14, so 7 + 8 is 15." },
          { sentences: ["I start at 9.", "I count on 2 more."], connector: "then", model: "I start at 9, then I count on 2 more." },
        ],
      },
    },
    {
      kind: "write_scaffold", domain: "Writing", title: "My Strategy Proof", minutes: 15, grouping: "Solo",
      mission: "Solve 8 + 6. Write your strategy and why it works.",
      tip: "Children may draw a ten frame first; accept labeled drawings and number sentences for emerging writers.",
      materials: ["Ten frame", "Counters"],
      support: sup("Draw the ten frame. Copy the first frame.", "Write your strategy and one reason.", "Write your strategy, two steps, and the sum."),
      payload: {
        prompt: "Solve 8 + 6. Tell your strategy. Tell why it works.",
        structure: [
          { part: "My strategy", frame: "I solved [problem] by [strategy]." },
          { part: "My steps", frame: "First I [step]. Then I [step]." },
          { part: "My proof", frame: "My answer works because [reason]. The sum is [number]." },
        ],
        word_bank: ["strategy", "sum", "make a ten", "doubles", "count on", "because", "first", "then", "equal", "add"],
        checklist: ["I named my strategy.", "I wrote two steps.", "I used the word because.", "I wrote the sum."],
        model: "I solved 8 + 6 by making a ten. I moved 2 from the 6 to the 8. 8 + 2 is 10. Then 10 + 4 is 14. My answer works because 2 and 4 make 6. The sum is 14.",
      },
    },
  ],
  exit_ticket: {
    prompt: "Solve 9 + 7. Tell your strategy and why it works.",
    frame: "I solved [9 + 7] with [strategy] because [reason]. The sum is [number].",
    model: "I solved 9 + 7 by making a ten because 9 + 1 is 10. Then 10 + 6 is 16. The sum is 16.",
    rubric: {
      emerging: "Says the sum with a picture or counters and names a strategy with help.",
      developing: "Names a strategy and the sum, using the frame.",
      proficient: "Names a strategy, gives a reason with because, and states the correct sum.",
    },
  },
  watchouts: [
    { group: "Spanish speakers", issue: "Suma can mean the adding and the answer, so children may say 'sum' when they mean add.", fix: "Pair add with the + action and sum with the answer. Say 'I add. The sum is...'" },
    { group: "All multilingual learners", issue: "Children give the answer but skip the reason, so the sentence has no because.", fix: "Use the frame 'I used ___ because ___' and have partners ask 'How do you know?'" },
  ],
  misconception: {
    pattern: "Children say 'I added' when they really took away, or use doubles for any two numbers.",
    redirect: "Ask 'Are both numbers the same?' and 'Did we put together or take away?' Then name the strategy and the word sum or difference.",
  },
};

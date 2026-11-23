// Vocabulary for "Compare Characters by What They Do": story-analysis words for grade 3. Original content.
// Visual text and alt never contain the entry word, so the pictures can be used as picture-word and type-word prompts.
const entry = (e) => e;

export default {
  id: "g3-ela-compare-characters-actions",
  title: "Words for comparing characters by what they do",
  grade: "3",
  band: "3-5",
  subject: "ela",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS RL.3.3, RL.3.1 and L.3.4; not mapped to a district unit sequence.",
  },
  standards: ["RL.3.3", "RL.3.1", "L.3.4"],
  entries: [
    entry({
      id: "character",
      word: "character",
      pos: "noun",
      pron: "KAIR-ik-ter",
      def: "A person, animal or creature in a story.",
      visual: {
        kind: "scene",
        alt: "Two children standing beside a tray of seeds, the two people the story is about.",
        longDesc:
          "A plain background with two children side by side. A small sprout and a seed sit between them.",
        bg: "plain",
        items: [
          { icon: "student", x: 90, y: 80, s: 130, label: "Girl" },
          { icon: "student", x: 290, y: 80, s: 130, label: "Boy" },
          { icon: "sprout", x: 215, y: 190, s: 60 },
        ],
      },
      context: "Theo is the character who picks up the seeds.",
      nonExample:
        "The wind is part of the story, but it is not a character because it does not think, talk or choose.",
      academicSentence:
        "A character can be a person, an animal or even a talking object in a story.",
      everyday: "In a movie, the people and animals you follow are the ones the story is about.",
      es: {
        word: "personaje",
        def: "Una persona, un animal o una criatura en un cuento.",
        verified: true,
      },
      misconception:
        "Only the main person is a character. Every person or animal in the story is a character.",
      related: ["trait", "action", "motivation"],
      practice: {
        visualPrompt: "Point to the two people in the picture. Say who the story is about.",
        speakWrite:
          "Tell a partner about one character from a story you know, then write one sentence.",
        retrieval: "Who or what does a story follow? Which word names them?",
      },
      tier: 2,
      domains: ["Reading", "Speaking"],
      klu: "Narrate",
    }),
    entry({
      id: "trait",
      word: "trait",
      pron: "TRAYT",
      pos: "noun",
      def: "A word that tells what a person in a story is like, such as kind, brave or patient.",
      visual: {
        kind: "table",
        alt: "A table matching what a girl does with what she is like: sharing crayons shows kind, answering first shows eager.",
        longDesc:
          "Two columns. What the person does: shares crayons with a new classmate; waves her hand to answer first. What the person is like: kind; eager.",
        head: ["What the person does", "What the person is like"],
        rows: [
          ["Shares crayons with a new classmate", "kind"],
          ["Waves a hand to answer first", "eager"],
          ["Tries the puzzle again and again", "determined"],
        ],
      },
      context: "Patient is a good trait for Theo.",
      nonExample:
        "Tall is not a trait that matters in most stories. A story trait tells how a person acts and thinks.",
      academicSentence:
        "A trait is shown by what a character does, says and thinks across the story.",
      everyday: "Your friend who always helps others has the trait of being helpful.",
      es: {
        word: "rasgo de carácter",
        def: "Una palabra que dice cómo es una persona en un cuento, como amable, valiente o paciente.",
        verified: true,
      },
      misconception:
        "A trait is how a character looks. A trait tells how a character acts and thinks.",
      related: ["character", "action", "evidence"],
      practice: {
        visualPrompt: "Cover the right column. Read what the person does and say a trait word.",
        speakWrite:
          "Say a trait for someone in a story you know and what the person did to show it, then write it.",
        retrieval: "What do we call a word like brave or patient that tells what a person is like?",
      },
      tier: 2,
      domains: ["Reading", "Writing"],
      klu: "Inform",
    }),
    entry({
      id: "action",
      word: "action",
      pos: "noun",
      pron: "AK-shun",
      def: "Something a person does, such as running, helping or shouting.",
      visual: {
        kind: "scene",
        alt: "A child with a blue bucket beside them and a caption saying the child picks up the cup.",
        longDesc:
          "A plain background with a child and a blue bucket. A caption under the child reads picks up the cup.",
        bg: "plain",
        items: [
          { icon: "student", x: 110, y: 70, s: 150, label: "Picks up the cup" },
          { icon: "bucket", x: 290, y: 150, s: 80 },
        ],
      },
      context: "Nia's first action was to stomp to the door.",
      nonExample: "Feeling worried is not an action. It is a feeling inside the character.",
      academicSentence:
        "A character's action shows us what the character is like and what happens next.",
      everyday: "Waving, packing a bag and shouting across the yard are all things a person does.",
      es: {
        word: "acción",
        def: "Algo que hace una persona, como correr, ayudar o gritar.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "act", meaning: "to do something" },
          { part: "ion", meaning: "the act or result of" },
        ],
      },
      misconception:
        "An action has to be big. Small actions, such as counting seeds again, tell us a lot.",
      related: ["trait", "event", "effect"],
      practice: {
        visualPrompt: "Point to the person. Say what the person is doing.",
        speakWrite: "Act out one thing a character does. Say it with a verb, then write it.",
        retrieval: "What word names something a character does?",
      },
      tier: 2,
      domains: ["Reading", "Speaking"],
      klu: "Narrate",
    }),
    entry({
      id: "motivation",
      word: "motivation",
      pos: "noun",
      pron: "moh-tuh-VAY-shun",
      def: "The reason a person in a story does something.",
      visual: {
        kind: "flow",
        alt: "A wish to make the team leads to practicing every day after school.",
        longDesc:
          "Two steps with an arrow. A trophy and the words wants to make the team, then a ball and the words practices every day.",
        steps: [
          { label: "Wants to make the team", icon: "trophy" },
          { label: "Practices every day", icon: "soccer-ball" },
        ],
      },
      context: "Theo's motivation is to save the garden for the class.",
      nonExample:
        "Picking up a cup is something Theo does. The reason he does it is a different thing.",
      academicSentence:
        "A character's motivation explains why the character acts in a certain way.",
      everyday:
        "You study for a test because you want to do well. Wanting to do well is the reason.",
      es: {
        word: "motivación",
        def: "La razón por la que una persona en un cuento hace algo.",
        verified: true,
      },
      misconception:
        "Motivation is the same as the action. The action is what a character does; motivation is why.",
      related: ["action", "trait", "problem"],
      practice: {
        visualPrompt: "Point to the wish. Point to what the person does because of it.",
        speakWrite: "Say why a character did something, using because, then write the sentence.",
        retrieval: "What do we call the reason behind what a character does?",
      },
      tier: 3,
      domains: ["Reading", "Speaking", "Writing"],
      klu: "Explain",
    }),
    entry({
      id: "problem",
      word: "problem",
      pos: "noun",
      pron: "PROB-lum",
      def: "Something that goes wrong in a story that the characters have to work out.",
      visual: {
        kind: "table",
        alt: "A table with two stories. In one, a kite is stuck high in a tree. In the other, a seed tray tips over.",
        longDesc:
          "Two columns. What happens in the story: a kite is stuck high in a tree; a tray of seeds tips over. What goes wrong: the kite cannot be reached; the seeds are all over the floor.",
        head: ["What happens in the story", "What goes wrong"],
        rows: [
          ["A kite flies into a tree", "It is too high to reach"],
          ["A tray of seeds tips over", "The seeds roll everywhere"],
        ],
      },
      context: "The problem in the story is that the seeds spilled.",
      nonExample: "A story where everything goes well all day has no problem to solve.",
      academicSentence:
        "In many stories, the characters face a problem and take actions to deal with it.",
      everyday: "Losing a library book is a problem you have to figure out how to fix.",
      es: {
        word: "problema",
        def: "Algo que sale mal en un cuento y que los personajes tienen que resolver.",
        verified: true,
      },
      misconception:
        "The problem is how the story ends. The problem is what goes wrong, usually near the beginning.",
      related: ["solution", "event", "action"],
      practice: {
        visualPrompt: "Read the right column. Say what goes wrong in each story.",
        speakWrite: "Tell a partner one trouble a character had, then write it in a sentence.",
        retrieval: "What word names the trouble the characters must work out?",
      },
      tier: 2,
      domains: ["Reading", "Speaking"],
      klu: "Narrate",
    }),
    entry({
      id: "solution",
      word: "solution",
      pos: "noun",
      pron: "suh-LOO-shun",
      def: "The way a story's trouble gets fixed.",
      visual: {
        kind: "flow",
        alt: "A kite stuck in a tree, then a grown-up reaching up with a long pole, then the kite back on the ground.",
        longDesc:
          "Three steps left to right with arrows: a tree with a kite caught high up, a helper with a long pole, and the kite safely down.",
        steps: [
          { label: "Kite stuck in a tree", icon: "tree" },
          { label: "Helper uses a long pole", icon: "family" },
          { label: "Kite is back down", icon: "check" },
        ],
      },
      context: "Working together was the solution to the spilled seeds.",
      nonExample:
        "Giving up and leaving the seeds on the floor does not fix the trouble, so it is not a solution.",
      academicSentence: "The solution shows how the characters' actions solve the problem.",
      everyday: "Asking a teacher for help with a stuck zipper is one way to fix the trouble.",
      es: {
        word: "solución",
        def: "La manera en que se arregla el problema de un cuento.",
        verified: true,
      },
      misconception:
        "A solution only happens at the very end. Characters may try several actions before one works.",
      related: ["problem", "action", "effect"],
      practice: {
        visualPrompt: "Point to the step that fixes the trouble.",
        speakWrite: "Say how a character fixed a trouble. Use 'solved' or 'fixed', then write it.",
        retrieval: "What do we call the way the trouble gets fixed in a story?",
      },
      tier: 2,
      domains: ["Reading", "Speaking", "Writing"],
      klu: "Narrate",
    }),
    entry({
      id: "event",
      word: "event",
      pos: "noun",
      pron: "ih-VENT",
      def: "Something that happens in a story.",
      visual: {
        kind: "timeline",
        alt: "A timeline of four story moments in order: seeds spill, one child leaves, the other picks up seeds, the first child returns.",
        longDesc:
          "A line with four dots from left to right labelled Seeds spill, Girl leaves, Boy picks up seeds, Girl returns.",
        span: [0, 5],
        events: [
          { at: 1, label: "Seeds spill" },
          { at: 2, label: "Girl leaves" },
          { at: 3, label: "Boy picks up seeds" },
          { at: 4, label: "Girl returns" },
        ],
      },
      context: "The wind tipping the tray is the first event.",
      nonExample:
        "A character's trait, such as patient, is not an event. An event is something that happens at a moment.",
      academicSentence:
        "The events in a story happen in an order, and each one can lead to the next.",
      everyday: "A class trip, a spilled drink and a surprise party are all things that happen.",
      es: { word: "suceso", def: "Algo que pasa en un cuento.", verified: true },
      misconception:
        "An event is only something big. Even a small moment, such as a peek through a door, is an event.",
      related: ["action", "effect", "problem"],
      practice: {
        visualPrompt: "Read the line from left to right. Say what happens first, next and last.",
        speakWrite: "Tell a partner what happened first and next in a story, then write both.",
        retrieval: "What word names something that happens in a story?",
      },
      tier: 2,
      domains: ["Reading", "Writing"],
      klu: "Narrate",
    }),
    entry({
      id: "compare",
      word: "compare",
      pos: "verb",
      pron: "kum-PAIR",
      def: "To look at two things and tell what is the same about them.",
      visual: {
        kind: "venn",
        alt: "Two overlapping circles, cat and dog. The middle part lists what both have: four legs, fur and a tail.",
        longDesc:
          "A Venn diagram. Cat circle: purrs, climbs. Dog circle: barks, fetches. The overlap lists four legs, fur, a tail.",
        sets: [
          { label: "Cat", items: ["purrs", "climbs"] },
          { label: "Dog", items: ["barks", "fetches"] },
        ],
        overlap: ["four legs", "fur", "a tail"],
      },
      context: "When we compare Nia and Theo, we see they both care about the garden.",
      nonExample:
        "Telling only about Nia does not compare her with anyone. You need two things side by side.",
      academicSentence:
        "When you compare two characters, you tell how they are alike using details from the story.",
      everyday: "You compare two backpacks when you say that both have two straps and a zipper.",
      es: { word: "comparar", def: "Mirar dos cosas y decir en qué se parecen.", verified: true },
      misconception:
        "Compare means tell how things are different. Compare tells what is the same; contrast tells what is different.",
      related: ["contrast", "evidence", "trait"],
      practice: {
        visualPrompt: "Point to the middle part of the circles. Say what both animals have.",
        speakWrite: "Tell a partner one way two characters are alike, then write it with 'both'.",
        retrieval: "Which word means to tell how two things are the same?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    }),
    entry({
      id: "contrast",
      word: "contrast",
      pos: "verb",
      pron: "kun-TRAST",
      def: "To look at two things and tell what is different about them.",
      visual: {
        kind: "table",
        alt: "A table with two columns showing a cat and a dog with different sounds and different favorite play.",
        longDesc:
          "Two columns, Cat and Dog. Sound: purrs, barks. Play: chases string, chases balls. Moves: climbs, digs.",
        head: ["Cat", "Dog"],
        rows: [
          ["Purrs", "Barks"],
          ["Chases string", "Chases balls"],
          ["Climbs high", "Digs low"],
        ],
      },
      context: "To contrast them, we say Nia left but Theo stayed.",
      nonExample:
        "Saying that both children like the garden tells how they are alike, not how they are different.",
      academicSentence:
        "When you contrast two characters, you use words such as but, while and however to show a difference.",
      everyday: "You contrast two lunches when you say one is hot but the other is cold.",
      es: {
        word: "contrastar",
        def: "Mirar dos cosas y decir en qué son diferentes.",
        verified: true,
      },
      misconception: "Contrast and compare are the same. Contrast looks for differences.",
      related: ["compare", "evidence", "action"],
      practice: {
        visualPrompt: "Read across one row. Say how the two animals are different.",
        speakWrite: "Say one difference between two characters using 'but', then write it.",
        retrieval: "Which word means to tell what is different about two things?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    }),
    entry({
      id: "evidence",
      word: "evidence",
      pos: "noun",
      pron: "EV-ih-dents",
      def: "Words or details from the text that prove your idea.",
      visual: {
        kind: "table",
        alt: "A table matching words from a story with the idea they prove: stomped to the door shows she was upset.",
        longDesc:
          "Two columns. What the story says: She stomped to the door; He counted the seeds again. What it proves: she was upset; he is careful.",
        head: ["What the story says", "What it proves"],
        rows: [
          ['"She stomped to the door."', "She was upset"],
          ['"He counted them again to be sure."', "He is careful"],
        ],
      },
      context: "The sentence about counting the seeds is evidence that Theo is careful.",
      nonExample:
        '"I just think he is nice" is an opinion. It is not evidence unless you point to the page.',
      academicSentence:
        "Strong evidence comes from the text and shows exactly why your idea is true.",
      everyday: "A wet umbrella by the door is evidence that it rained.",
      es: {
        word: "evidencia",
        def: "Palabras o detalles del texto que prueban tu idea.",
        verified: true,
      },
      misconception:
        "Any sentence from the story is evidence. The sentence has to prove the exact idea you are making.",
      related: ["infer", "trait", "compare"],
      practice: {
        visualPrompt: "Cover the right column. Read the left column and say the idea it proves.",
        speakWrite:
          "Say an idea about a character and the sentence that proves it, then write both.",
        retrieval: "What do we call the words from the story that prove an idea?",
      },
      tier: 2,
      domains: ["Reading", "Speaking", "Writing"],
      klu: "Argue",
    }),
    entry({
      id: "infer",
      word: "infer",
      pos: "verb",
      pron: "in-FUR",
      def: "To figure something out by putting clues from the text together with what you already know.",
      visual: {
        kind: "flow",
        alt: "A wet umbrella, plus knowing umbrellas are used in the rain, leads to the answer that it rained.",
        longDesc:
          "Three steps: an umbrella with drops on it, a head with a spark of thought, and rain falling.",
        steps: [
          { label: "Clue: a wet umbrella", icon: "umbrella" },
          { label: "I know: used in rain", icon: "brain" },
          { label: "So: it rained", icon: "rain" },
        ],
      },
      context: "We infer that Nia felt upset because she stomped away.",
      nonExample:
        "Reading that the tray tipped over is not an inference. The text says it right out.",
      academicSentence:
        "Readers infer a character's feeling by combining an action in the text with what they know.",
      everyday: "When you see a friend slam a locker, you infer the friend is upset.",
      es: {
        word: "inferir",
        def: "Descubrir algo juntando pistas del texto con lo que ya sabes.",
        verified: true,
      },
      misconception: "To infer means to guess anything. An inference needs clues from the text.",
      related: ["evidence", "trait", "motivation"],
      practice: {
        visualPrompt: "Point to the clue, then to what you already know, then to the answer.",
        speakWrite:
          "Tell a partner something you figured out from a clue, then write 'I figured out ___ because ___'.",
        retrieval: "Which word means to figure something out from clues plus what you know?",
      },
      tier: 3,
      domains: ["Reading", "Speaking", "Writing"],
      klu: "Explain",
    }),
    entry({
      id: "effect",
      word: "effect",
      pos: "noun",
      pron: "ih-FEKT",
      def: "What happens because of something else.",
      visual: {
        kind: "flow",
        alt: "Rain falls all day, so the class soccer game moves inside.",
        longDesc:
          "Two steps with an arrow: rain falling, then a soccer ball with the words game moves inside.",
        steps: [
          { label: "Rain falls all day", icon: "rain" },
          { label: "Game moves inside", icon: "soccer-ball" },
        ],
      },
      context: "The effect of Theo's help was that Nia came back.",
      nonExample: "Rain falling is the cause here. The game moving inside is the result.",
      academicSentence:
        "A character's action can have an effect on another character and on what happens next.",
      everyday: "If you forget to charge a tablet, the effect is that it shuts off during class.",
      es: { word: "efecto", def: "Lo que pasa a causa de otra cosa.", verified: true },
      misconception:
        "Effect and cause are the same. The cause comes first and the effect follows from it.",
      related: ["action", "event", "problem"],
      practice: {
        visualPrompt: "Point to what happened first. Point to the result.",
        speakWrite:
          "Say what happened because of something a character did, using 'so', then write it.",
        retrieval: "What do we call what happens because of something else?",
      },
      tier: 2,
      domains: ["Reading", "Writing"],
      klu: "Explain",
    }),
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

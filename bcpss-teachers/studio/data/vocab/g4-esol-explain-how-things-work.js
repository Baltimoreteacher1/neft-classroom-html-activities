// Vocabulary for "Explain How Water Moves": process words, state words and connectors for explaining. Original content.
export default {
  id: "g4-esol-explain-how-things-work",
  title: "Words for explaining how water moves",
  grade: "4",
  band: "3-5",
  subject: "esol",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to WIDA ELD-SC and CCSS speaking standards; not mapped to a district unit sequence.",
  },
  standards: ["ELD-SC", "SL.4.4", "RI.4.3"],
  entries: [
    {
      id: "evaporation",
      word: "evaporation",
      pos: "noun",
      pron: "ih-vap-uh-RAY-shun",
      def: "When heat changes liquid water into water vapor, a gas.",
      visual: {
        kind: "flow",
        alt: "Liquid water, then heat from the sun, then water vapor rising as a gas.",
        longDesc:
          "Three steps from left to right: a drop of liquid water, the sun's heat, and wind-like water vapor rising.",
        steps: [
          { label: "Liquid water", icon: "drop" },
          { label: "Heat from the sun", icon: "sun" },
          { label: "Water vapor rises", icon: "wind" },
        ],
      },
      context: "Evaporation is the first stage of the water cycle.",
      nonExample: "A cold glass with drops on the outside shows condensation, not evaporation.",
      academicSentence:
        "Evaporation happens when the sun warms water and some of it becomes water vapor.",
      everyday: "A wet towel gets dry in the sun because the water evaporates.",
      es: {
        word: "evaporación",
        def: "Cuando el calor convierte el agua líquida en vapor de agua, un gas.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "evaporate", meaning: "to change from liquid into vapor" },
          { part: "-ion", meaning: "the act or process of" },
        ],
      },
      misconception: "The water disappears. It does not disappear; it becomes vapor in the air.",
      related: ["water-vapor", "condensation", "liquid"],
      practice: {
        visualPrompt: "Point to the step in the picture where the water changes into a gas.",
        speakWrite: "Say one sentence about evaporation using the word because, then write it.",
        retrieval: "Yesterday we learned the first stage of the water cycle. Which word names it?",
      },
      tier: 3,
      domains: ["Listening", "Speaking"],
      klu: "Explain",
    },
    {
      id: "water-vapor",
      word: "water vapor",
      pos: "noun",
      pron: "WAW-ter VAY-per",
      def: "Water that has become a gas. You cannot see it.",
      visual: {
        kind: "table",
        alt: "A table comparing liquid water, which you can see and pour, with water vapor, a gas you cannot see.",
        longDesc:
          "Two rows. Liquid water: you can see it and pour it. Water vapor: it is a gas and you cannot see it.",
        head: ["Form of water", "What it is like"],
        rows: [
          ["Liquid water", "You can see it and pour it"],
          ["Water vapor", "A gas you cannot see"],
        ],
      },
      context: "The warm water changes into water vapor and rises.",
      nonExample: "A cloud is not water vapor. A cloud is made of tiny drops of liquid water.",
      academicSentence:
        "Water vapor rises because it is a gas that is lighter than the air near the ground.",
      es: {
        word: "vapor de agua",
        def: "Agua que se ha convertido en gas. No se puede ver.",
        verified: true,
      },
      misconception:
        "Clouds are made of water vapor. Clouds are tiny liquid drops; the vapor itself is invisible.",
      related: ["evaporation", "condensation", "cloud"],
      practice: {
        visualPrompt: "Which row of the table is the one you cannot see?",
        speakWrite:
          "Tell a partner how liquid water and water vapor are different, then write one sentence.",
        retrieval: "What do we call water when it is a gas?",
      },
      tier: 3,
      domains: ["Listening", "Speaking", "Reading"],
      klu: "Inform",
    },
    {
      id: "condensation",
      word: "condensation",
      pos: "noun",
      pron: "kon-den-SAY-shun",
      def: "When water vapor cools and changes into tiny drops of liquid water.",
      visual: {
        kind: "flow",
        alt: "Water vapor rises, cold air cools it, and tiny drops gather to make a cloud.",
        longDesc:
          "Three steps: water vapor rising, cold air shown by a snowflake, and a cloud made of tiny drops.",
        steps: [
          { label: "Water vapor rises", icon: "wind" },
          { label: "Cold air cools it", icon: "snowflake" },
          { label: "Tiny drops make a cloud", icon: "cloud" },
        ],
      },
      context: "Condensation makes clouds high in the sky.",
      nonExample: "A puddle drying in the sun is evaporation, not condensation.",
      academicSentence:
        "Condensation happens because the air high in the sky is cold, so the water vapor cools and turns into drops.",
      everyday:
        "Drops form on the outside of a cold cup of water because the air touching it cools.",
      es: {
        word: "condensación",
        def: "Cuando el vapor de agua se enfría y se convierte en gotas pequeñas de agua líquida.",
        verified: true,
      },
      morphology: {
        parts: [
          { part: "condense", meaning: "to change from gas into liquid" },
          { part: "-ion", meaning: "the act or process of" },
        ],
      },
      related: ["evaporation", "cloud", "water-vapor"],
      practice: {
        visualPrompt: "Which picture in the sequence shows what causes the drops to form?",
        speakWrite: "Explain what causes condensation using because, then write your sentence.",
        retrieval: "Which stage makes clouds? Say its name and one thing that happens there.",
      },
      tier: 3,
      domains: ["Listening", "Speaking"],
      klu: "Explain",
    },
    {
      id: "precipitation",
      word: "precipitation",
      pos: "noun",
      pron: "prih-sip-ih-TAY-shun",
      def: "Water that falls from clouds to the ground as rain, snow, sleet or hail.",
      visual: {
        kind: "scene",
        bg: "sky",
        alt: "A cloud in the sky with rain falling from it and snowflakes falling beside it.",
        items: [
          { icon: "cloud", x: 170, y: 30, s: 130, label: "cloud" },
          { icon: "rain", x: 90, y: 170, s: 80, label: "rain" },
          { icon: "snowflake", x: 310, y: 170, s: 80, label: "snow" },
        ],
      },
      context: "Precipitation falls when the drops in a cloud get too heavy.",
      nonExample: "Water vapor rising from a pot is not precipitation because it is not falling.",
      academicSentence:
        "Precipitation falls from clouds when the drops join together and become heavy.",
      es: {
        word: "precipitación",
        def: "Agua que cae de las nubes al suelo como lluvia, nieve, aguanieve o granizo.",
        verified: true,
      },
      related: ["cloud", "condensation", "collection"],
      practice: {
        visualPrompt: "Name two kinds of precipitation you can see in the picture.",
        speakWrite:
          "Tell a partner what the weather is like when precipitation falls, then write it.",
        retrieval: "Which stage brings rain or snow to the ground?",
      },
      tier: 3,
      domains: ["Listening", "Speaking", "Reading"],
      klu: "Inform",
    },
    {
      id: "collection",
      word: "collection",
      pos: "noun",
      pron: "kuh-LEK-shun",
      def: "When water gathers in rivers, lakes and oceans, or soaks into the ground.",
      visual: {
        kind: "flow",
        alt: "Rain falls, water runs downhill, and the water gathers in the ocean.",
        longDesc:
          "Three steps: rain falling, a drop running downhill, and the earth with a large body of water.",
        steps: [
          { label: "Rain falls", icon: "rain" },
          { label: "Water runs downhill", icon: "drop" },
          { label: "Water gathers", icon: "earth" },
        ],
      },
      context: "In collection, the water gathers and the cycle can start again.",
      nonExample:
        "A collection of stamps is a different meaning of the word; it is not part of the water cycle.",
      academicSentence:
        "In collection, water that fell as rain gathers in rivers, lakes and oceans.",
      related: ["precipitation", "evaporation", "cycle"],
      practice: {
        visualPrompt: "Point to the place in the picture where the water ends up.",
        speakWrite:
          "Say where water goes after it rains, then write one sentence with the word collection.",
        retrieval: "Which stage comes right after precipitation?",
      },
      tier: 2,
      domains: ["Listening", "Speaking"],
      klu: "Inform",
    },
    {
      id: "cloud",
      word: "cloud",
      pos: "noun",
      pron: "klowd",
      def: "A mass of tiny drops of water or ice crystals high in the sky.",
      visual: { kind: "icon", name: "cloud", alt: "A single fluffy white shape floating in the sky." },
      context: "The drops come together and make a cloud.",
      nonExample:
        "Fog is a cloud near the ground, but smoke is not a cloud because it is not made of water.",
      academicSentence: "A cloud forms when water vapor cools and condenses into tiny drops.",
      es: {
        word: "nube",
        def: "Un grupo de gotas pequeñas de agua o cristales de hielo en el cielo.",
        verified: true,
      },
      related: ["condensation", "precipitation", "water-vapor"],
      practice: {
        visualPrompt: "Find the cloud in each picture of the water cycle.",
        speakWrite: "Explain how a cloud forms in one sentence, then write it.",
        retrieval: "What are clouds made of?",
      },
      tier: 1,
      domains: ["Listening", "Speaking"],
      klu: "Inform",
    },
    {
      id: "cycle",
      word: "cycle",
      pos: "noun",
      pron: "SY-kul",
      def: "A set of steps that happen again and again in the same order.",
      visual: {
        kind: "cycle",
        alt: "Four stages in a circle with arrows showing that the last step leads back to the first.",
        longDesc:
          "A circle of four stages named First, Next, Then and Last. The arrow from Last returns to First.",
        stages: [{ label: "First" }, { label: "Next" }, { label: "Then" }, { label: "Last" }],
      },
      context: "The water cycle never stops because the last step leads back to the first.",
      nonExample: "A line of steps that ends, like a recipe, is a sequence but not a cycle.",
      academicSentence: "In a cycle, the last step leads back to the first step.",
      es: {
        word: "ciclo",
        def: "Una serie de pasos que se repiten una y otra vez en el mismo orden.",
        verified: true,
      },
      related: ["sequence", "collection"],
      practice: {
        visualPrompt: "Trace the arrows with your finger. Where do you end up?",
        speakWrite:
          "Tell a partner one other cycle you know and say why it is a cycle, then write it.",
        retrieval: "What makes something a cycle and not just a list of steps?",
      },
      tier: 2,
      domains: ["Listening", "Speaking", "Reading"],
      klu: "Explain",
    },
    {
      id: "liquid",
      word: "liquid",
      pos: "noun",
      pron: "LIK-wid",
      def: "Something that flows and takes the shape of its container, like water.",
      visual: { kind: "icon", name: "drop", alt: "A single blue drop of water." },
      context: "Liquid water changes into water vapor when it is warmed.",
      nonExample: "A rock is a solid, not a liquid, because it does not flow.",
      academicSentence: "Water vapor cools and changes back into a liquid.",
      es: {
        word: "líquido",
        def: "Algo que fluye y toma la forma del recipiente, como el agua.",
        verified: true,
      },
      related: ["water-vapor", "evaporation"],
      practice: {
        visualPrompt: "Point to something in the room that is a liquid.",
        speakWrite: "Name two liquids and say how you know they are liquids, then write one.",
        retrieval: "What do we call water you can see and pour?",
      },
      tier: 2,
      domains: ["Listening", "Reading"],
      klu: "Inform",
    },
    {
      id: "sequence",
      word: "sequence",
      pos: "noun",
      pron: "SEE-kwens",
      def: "The order in which steps or events happen.",
      visual: {
        kind: "flow",
        alt: "A seed, a sprout, a flower and a tree in a row labeled First, Next, Then and Finally.",
        longDesc:
          "Four steps in a row: First a seed, next a sprout, then a flower, finally a tree. Arrows lead from step to step.",
        steps: [
          { label: "First", icon: "seed" },
          { label: "Next", icon: "sprout" },
          { label: "Then", icon: "flower" },
          { label: "Finally", icon: "tree" },
        ],
      },
      context: "Words like first, next, then and finally show the sequence of steps.",
      nonExample: "A pile of pictures in no order is not a sequence.",
      academicSentence:
        "The sequence of the steps matters because each step needs the one before it.",
      es: {
        word: "secuencia",
        def: "El orden en el que ocurren los pasos o los sucesos.",
        verified: true,
      },
      related: ["cycle", "because"],
      practice: {
        visualPrompt: "Say each step in order using the words under the pictures.",
        speakWrite:
          "Tell a partner your morning in sequence with first, next, then and finally, then write it.",
        retrieval: "Which four words help us show the sequence of a process?",
      },
      tier: 2,
      domains: ["Listening", "Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "because",
      word: "because",
      pos: "conjunction",
      pron: "bih-KAWZ",
      def: "A word that tells the reason something happens.",
      visual: {
        kind: "flow",
        alt: "A cause box, the air is cold, with an arrow to a result box, the vapor cools into drops.",
        longDesc:
          "Two boxes joined by an arrow. The first is the cause: the air is cold. The second is the result: the vapor cools into drops.",
        steps: [
          { label: "Cause: the air is cold", icon: "snowflake" },
          { label: "Result: vapor makes drops", icon: "cloud" },
        ],
      },
      context: "The vapor turns into drops because the air high in the sky is cold.",
      nonExample: "First is not a because word. First tells the order, not the reason.",
      academicSentence: "Because the air is cold, the water vapor cools and changes into drops.",
      everyday: "I wore a coat because it was cold.",
      es: {
        word: "porque",
        def: "Una palabra que dice la razón por la que algo pasa.",
        verified: true,
      },
      misconception:
        "Because can go before the result. Put it with the reason, not the result: the vapor cools because the air is cold.",
      related: ["so", "sequence"],
      practice: {
        visualPrompt: "Which box is the cause and which box is the result?",
        speakWrite: "Say a because sentence about the weather, then write it.",
        retrieval: "Which word tells the reason for something?",
      },
      tier: 2,
      domains: ["Listening", "Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "so",
      word: "so",
      pos: "conjunction",
      pron: "soh",
      def: "A word that tells the result of something that just happened.",
      noVisualReason:
        "A connector word. The cause-and-result picture on because shows the same pair of ideas in the opposite direction.",
      context: "The air up there is cold, so the vapor cools.",
      nonExample: "So is not a word for the order of steps; use then or next for order.",
      academicSentence: "The water gets warm, so some of it changes into water vapor.",
      everyday: "It was raining, so we stayed inside.",
      misconception:
        "So and because can be mixed up. Because comes with the reason; so comes with the result.",
      related: ["because", "sequence"],
      practice: {
        visualPrompt: "Look at the cause and result boxes. Say one sentence that uses so.",
        speakWrite: "Say a sentence with so about the weather, then write it.",
        retrieval: "Does so introduce the reason or the result?",
      },
      tier: 1,
      domains: ["Listening", "Speaking", "Writing"],
      klu: "Explain",
    },
  ],
  review: { status: "authored", checks: {} },
};

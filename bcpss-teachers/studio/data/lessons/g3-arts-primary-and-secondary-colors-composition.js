// Lesson pack: Primary and Secondary Colors in a Composition (grade 3 visual arts). Original paintings and text.
import {
  BALANCE,
  CONTRAST_PAIR,
  PRIMARY_ROW,
  SECONDARY_ROW,
  artworkA,
  artworkB,
  colorWheel,
  mixing,
} from "../kits/c8-color-composition.js";

export default {
  id: "g3-arts-primary-and-secondary-colors-composition",
  kind: "lesson",
  title: "Primary and Secondary Colors in a Composition",
  subtitle: "Mix secondary colors from primary colors, then plan a picture with a focal point",
  grade: "3",
  band: "3-5",
  subject: "arts",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the National Core Arts Standards in visual arts: creating (VA:Cr2.1.3a) and responding (VA:Re8.1.3, VA:Re9.1.3); not mapped to a district unit sequence. Both paintings are original.",
  },
  standards: ["VA:Cr2.1.3a", "VA:Re8.1.3", "VA:Re9.1.3"],
  wida: {
    eld: ["ELD-SI"],
    klus: ["Inform", "Explain"],
    domains: ["Speaking", "Listening", "Writing"],
    cluster: "2-3",
  },
  contentObjective:
    "I can mix primary colors to make secondary colors and plan a painting with a focal point, a foreground and a background.",
  languageObjective:
    "I can describe a painting by saying 'I see ___' and 'The artist used ___ to ___', and give a classmate feedback with 'I notice ___ and I wonder ___'.",
  languageDemands: {
    functions: [
      "describe an artwork",
      "explain how a color was made",
      "give kind, specific feedback",
    ],
    structures: [
      "I see ___ in the foreground and ___ in the background.",
      "I mixed ___ and ___ to make ___.",
      "I notice ___. I wonder ___.",
    ],
    discourse:
      "A four-step partner critique: describe what you see, say how the artist made it, say what it makes you feel, and ask one wondering question.",
    barriers: [
      "'mix' means to stir in art but 'mixed up' means confused",
      "'primary' and 'secondary' also mean first and second in school and may suggest 'more' and 'less' important",
      "'foreground' and 'background' are compound words with 'ground' that does not mean the floor",
      "'balance' names a feeling in a picture and also a thing on a scale",
      "color names are common words, but 'focal', 'composition' and 'contrast' are new academic words",
    ],
    oralRehearse: [
      "I mixed yellow and blue to make green.",
      "I see big flowers in the foreground and pale hills in the background.",
      "I notice the red barn. I wonder why the artist put the tree there.",
    ],
    writeScaffold:
      "In my painting the ___ is the focal point because ___. I mixed ___ and ___ to make ___.",
  },
  vocab: {
    collection: "g3-arts-primary-and-secondary-colors-composition",
    ids: [
      "primary-color",
      "secondary-color",
      "color-wheel",
      "mix",
      "composition",
      "focal-point",
      "contrast",
      "balance",
      "overlap",
      "foreground",
      "background",
    ],
  },
  launch: {
    title: "See, Think, Wonder: a farm painting",
    visual: artworkA(),
    prompts: [
      "What do you see first? Why do you think your eyes went there?",
      "What colors do you see? How many colors do you think the artist used?",
      "What do you wonder about this painting?",
    ],
    teacherNote:
      "Show the painting for 30 seconds in silence. Take two noticings and one wondering. Ask 'where did your eyes go first?' and write the answers on the board; most students will name the red barn. Do not teach the words yet. Hold up the question 'why did your eyes go there?' and come back to it after the teaching. Keep a list of the color words students use; you will sort them into primary and secondary after the teaching.",
  },
  teach: {
    model: [
      "Paint has three primary colors: red, yellow and blue. You cannot make them by mixing other paints. Every other paint color starts with these three. Show the three primary colors on a palette and name them chorally.",
      "When you mix two primary colors, you make a secondary color. Red and yellow make orange. Yellow and blue make green. Blue and red make purple. Show each mix with real paint and write the equation on the board: red + yellow = orange. Mix with two colors only. Mixing three or four colors often makes a dull brown.",
      "A color wheel puts the colors in order around a circle: red, orange, yellow, green, blue, purple. Each secondary color sits between the two primary colors that make it. Colors that are across the circle from each other, like red and green, are very different, and they stand out when you put them side by side.",
      "Artists arrange colors and shapes on purpose. That arrangement is the composition. A focal point is the part your eye sees first. Artists make a focal point with a bold or bright color, a strong difference from what is around it (contrast), or a big shape. The farm painting uses a red barn against green, so your eye goes to the barn.",
      "Artists also make things look near or far. The foreground is the part that looks closest. It is big and bold. The background is the part that looks farthest. It is small and pale. When one shape overlaps another, the shape on top looks closer. Balance is when the parts of a picture feel even, for example with matching trees on both sides.",
      "Before painting, artists plan. Draw a small rectangle and sketch where the focal point will go, what is in the foreground and what is in the background. Decide which secondary color you will mix for the focal point. Then paint. A studio habit to practice is 'observe, then envision, then reflect': look carefully, picture what you want, and look back to see if it worked.",
    ],
    moves: [
      "Mix each secondary color in front of the class with two real paints. Add the darker color a little at a time to the lighter one and ask students to predict before you stir.",
      "Keep the color wheel and the two paintings visible all lesson. Point at one part and ask 'foreground or background? How do you know?'",
      "Name the thinking out loud: 'My eye goes to the barn first because it is bright red against green. That is the focal point.'",
      "Teach the critique routine with a sample: 'I see a yellow moon. The artist used a dark sky to make it bright. It makes me feel quiet. I wonder where the boat is going.' Have students repeat each part.",
      "Set up paint stations with washable tempera, newspaper, smocks and cups of water before students move. Cover desks and plan the clean-up routine first.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt: "Which two primary colors make green?",
      choices: ["Red and yellow", "Yellow and blue", "Blue and red", "Red and green"],
      answer: 1,
      hint: "Think about grass. Which two paints would you blend to get that color?",
      supports: {
        ee: {
          frames: ["___ and ___ make green."],
          wordBank: ["yellow", "blue", "red", "mix"],
          visual: mixing("blue", "yellow", "green"),
          oral: "Say the two colors. Then say the new color.",
        },
        dev: { frames: ["I mix ___ and ___ to make ___."], wordBank: ["primary", "secondary"] },
        exp: { frames: ["Green is a secondary color because it is made from ___ and ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "Which of these is a secondary color?",
      choices: ["Red", "Yellow", "Purple", "Blue"],
      answer: 2,
      hint: "A secondary color is made by mixing two other colors. Which one cannot be a primary color?",
      supports: {
        ee: {
          frames: ["___ is a secondary color."],
          wordBank: ["red", "yellow", "purple", "blue"],
          visual: SECONDARY_ROW,
          oral: "Point to the three secondary colors and say each name.",
        },
        dev: { frames: ["Purple is made from ___ and ___."], wordBank: ["red", "blue", "mix"] },
        exp: { frames: ["I know purple is a secondary color because ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt:
        "In a painting, big flowers at the bottom look very close to you. What part of the painting is that?",
      choices: ["Background", "Foreground", "Focal point", "Overlap"],
      answer: 1,
      hint: "Which word names the part of a picture that looks closest to you?",
      supports: {
        ee: {
          frames: ["The flowers look ___."],
          wordBank: ["close", "far", "big"],
          visual: artworkA(),
          oral: "Point to the flowers and say close or far.",
        },
        dev: {
          frames: ["The flowers are in the ___ because they look ___."],
          wordBank: ["foreground", "background"],
        },
        exp: { frames: ["The artist made the flowers look close by making them ___ and ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt:
        "You want a bright yellow sun to stand out in your painting. What color could you paint the sky behind it, and why?",
      answer:
        "A dark color such as navy or dark blue, because a bright color against a dark color has high contrast and stands out.",
      hint: "Think about the picture of yellow on pale yellow and yellow on dark navy. Which one stands out?",
      supports: {
        ee: {
          frames: ["I paint the sky ___.", "The sun stands ___."],
          wordBank: ["dark", "bright", "blue"],
          visual: CONTRAST_PAIR,
          oral: "Point to the picture where the yellow square stands out.",
        },
        dev: {
          frames: ["I would paint the sky ___ because ___."],
          wordBank: ["contrast", "stand out"],
        },
        exp: { frames: ["A ___ sky gives high contrast with the sun, so ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Studio partners: mix three, plan one",
    task: "Partners share one set of red, yellow and blue washable tempera and a paper palette. Together they mix the three secondary colors, write the color equation under each swatch (for example, yellow + blue = green) and check each other's swatches against the color wheel. Then each partner draws a small thumbnail sketch of a painting. The sketch must have one focal point, one thing in the foreground and one thing in the background, and the focal point must use one mixed color. Partners trade sketches and use the critique routine to say what they see, how the artist made the focal point, what it makes them feel and one wondering.",
    roles: ["Mixer", "Recorder"],
    discussionCards: [
      {
        prompt: "Which two primary colors did you mix first? What happened?",
        frame: "We mixed ___ and ___ and made ___.",
      },
      {
        prompt: "Where is the focal point in your partner's sketch? How can you tell?",
        frame: "I think the focal point is ___ because ___.",
      },
      {
        prompt: "Give your partner one kind, helpful idea.",
        frame: "I notice ___. I wonder ___. Maybe you could ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the color wheel and the mixes",
      visualOrModel: colorWheel(),
      teacherNote:
        "Point to red, yellow and blue and call them primary colors. Then point to each secondary color and have students say the two primary colors on each side of it. Place the three mixing pictures under the wheel to connect the pictures to the paint.",
    },
    discuss: {
      title: "Say it: a four-part studio critique",
      visual: artworkB(),
      structure:
        "Partners sit side by side with one painting between them. Partner 1 describes (I see), says how the artist made it (The artist used), says how it feels (It makes me feel) and asks one wondering (I wonder). Partner 2 repeats one thing they heard and adds a suggestion. Swap paintings.",
      frames: [
        "I see ___ in the foreground and ___ in the background.",
        "The artist used ___ to make ___.",
        "It makes me feel ___ because ___.",
        "I notice ___. I wonder ___.",
      ],
    },
    apply: {
      title: "Make it: a small composition",
      task: "Paint a small picture (a landscape, a sea scene or a street) on a half sheet of paper. Mix at least one secondary color from two primary colors. Make the focal point stand out with the color you mixed or with contrast. Put a big, bold shape in the foreground and a smaller, paler shape in the background. When it is dry, write or say two sentences about your painting using 'focal point' and 'I mixed'.",
      successCriteria: [
        "I mixed a secondary color using exactly two primary colors.",
        "My picture has one focal point that stands out.",
        "My picture has a foreground and a background that look different.",
        "I used the words focal point and mixed when I described my painting.",
      ],
    },
  },
  activities: [
    { engine: "visual-match", id: "g3-arts-color-mixing-match" },
    { engine: "concept-builder", id: "g3-arts-composition-label" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "You mix blue paint and red paint. Which secondary color do you make?",
        choices: ["Orange", "Green", "Purple", "Brown"],
        answer: 2,
        explain:
          "Blue and red make purple. Orange is red and yellow, and green is yellow and blue.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "Which group lists only primary colors?",
        choices: [
          "Red, yellow, blue",
          "Orange, green, purple",
          "Red, green, blue",
          "Yellow, orange, blue",
        ],
        answer: 0,
        explain:
          "Red, yellow and blue are the three primary colors. The other groups include a secondary color.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "On the color wheel, which color sits between yellow and blue?",
        choices: ["Orange", "Green", "Purple", "Red"],
        answer: 1,
        explain: "Yellow and blue make green, and green sits between them on the wheel.",
      },
      {
        id: "i4",
        type: "choice",
        prompt:
          "An artist wants your eye to go first to a small red boat. Which choice helps most?",
        choices: [
          "Paint the boat the same color as the water",
          "Paint the boat bright red against dark blue water",
          "Hide the boat behind a big tree",
          "Paint the boat very small and pale",
        ],
        answer: 1,
        explain:
          "A bright red shape against a dark background has strong contrast, so it becomes the focal point.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "Painter A mixes yellow and blue. Painter B mixes yellow, blue and red together. Which painter is more likely to make a clear secondary color?",
        choices: [
          "Painter A, because the mix uses exactly two primary colors",
          "Painter B, because more colors is better",
          "Both make the same color",
          "Neither, because mixing never works",
        ],
        answer: 0,
        explain:
          "A secondary color uses exactly two primary colors. Adding a third usually makes a dull brown.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Describe the composition of the farm painting. Name the focal point, one thing in the foreground and one thing in the background.",
        answer:
          "The focal point is the red barn. The big flowers are in the foreground. The pale hills are in the background.",
        explain:
          "Any accurate focal point with a reason, one foreground object and one background object is correct.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A classmate painted a yellow moon on a dark sky. Write kind feedback with 'I notice' and 'I wonder'.",
        answer:
          "I notice that the yellow moon stands out against the dark sky. I wonder what is happening below the moon.",
        explain:
          "Good feedback is kind and specific: it names something the student sees and asks a wondering question.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Red paint and yellow paint are mixed together. The new color is",
        choices: ["orange", "green", "purple", "blue"],
        answer: 0,
        explain: "Red and yellow make orange, a secondary color.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "What is the focal point of a painting?",
        choices: [
          "The part your eye sees first",
          "The part that is farthest away",
          "The color made from two primary colors",
          "The frame around the painting",
        ],
        answer: 0,
        explain: "The focal point is the part that your eye goes to first.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Tell how a painter can make something in a painting look far away.",
        answer:
          "Make it smaller and paler and put it higher in the picture, behind other shapes that overlap it.",
        explain: "Far things look small and pale, and shapes that overlap them look closer.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you know about color and composition.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "Which two primary colors make orange?",
        choices: ["Red and yellow", "Yellow and blue", "Blue and red", "Red and blue"],
        answer: 0,
        explain: "Red and yellow make orange.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "In a painting, the part that looks closest to you is the",
        choices: ["background", "foreground", "balance", "contrast"],
        answer: 1,
        explain: "The foreground is the part that looks closest.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Write one sentence about your painting. Use focal point and because.",
        answer:
          "The focal point of my painting is the orange sun because it is bright against the dark sky.",
        explain: "Any accurate sentence that names the focal point and gives a reason is correct.",
      },
    ],
    successCriteria: [
      "I named the two primary colors that make a secondary color.",
      "I used foreground or background correctly.",
      "I used focal point and because to describe my painting.",
    ],
  },
  answerKey: {
    notes:
      "For the short items accept any accurate sentence in the student's own words. For critique feedback (i7), look for kindness, one specific noticing and one wondering; do not mark a student down for taste. Do not grade the beauty or skill of a painting: assess the success criteria (a secondary color mixed from two primaries, a focal point, a foreground and a background).",
    items: {
      g1: "Yellow and blue make green.",
      g2: "Purple. It is made from red and blue.",
      g3: "Foreground. It is the part that looks closest.",
      g4: "A dark color such as navy, because bright yellow against dark blue has high contrast and stands out.",
      i1: "Purple. Blue and red make purple.",
      i2: "Red, yellow, blue.",
      i3: "Green.",
      i4: "Paint the boat bright red against dark blue water.",
      i5: "Painter A. A secondary color uses exactly two primary colors.",
      i6: "Sample: The focal point is the red barn, bright against green. The big flowers are in the foreground. The pale hills are in the background.",
      i7: "Sample: I notice that the yellow moon stands out against the dark sky. I wonder what is happening below the moon.",
      f1: "Orange.",
      f2: "The part your eye sees first.",
      f3: "Make it smaller and paler, put it higher up, and let nearer shapes overlap it.",
      e1: "Red and yellow.",
      e2: "Foreground.",
      e3: "Sample: The focal point of my painting is the orange sun because it is bright against the dark sky.",
    },
  },
  extension: {
    title: "A family of one color",
    task: "Choose one secondary color you mixed. Make four swatches: the original mix, a lighter swatch made by adding a small drop of white, a darker swatch made by adding a very small drop of the darkest primary color you used, and a swatch that leans toward one of its primaries. Label each swatch with the colors you used. Then paint a small picture that uses all four so the picture has a focal point. Write one sentence about which swatch is the focal point and why.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo mezclar colores primarios para hacer colores secundarios y describir mi pintura con las palabras punto focal, primer plano y fondo.",
      vocab: [
        { en: "primary color", es: "color primario", verified: false },
        { en: "secondary color", es: "color secundario", verified: false },
        { en: "color wheel", es: "círculo cromático", verified: false },
        { en: "composition", es: "composición", verified: false },
        { en: "focal point", es: "punto focal", verified: false },
        { en: "foreground", es: "primer plano", verified: false },
        { en: "background", es: "fondo", verified: false },
      ],
      familyPrompt:
        "Miren juntos una pintura o una fotografía en casa. Digan dónde van primero los ojos y qué colores primarios o secundarios ven.",
    },
  },
  printables: ["vocab-mat", "sort-match", "gallery-walk", "exit-ticket"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teaching and guided practice 12. Mixing and thumbnail sketch 12. Visual match or label activity 8. Critique pair share 5. Exit ticket 3. Painting the full composition needs a second studio session; the lesson can end at the thumbnail sketch.",
    misconceptions: [
      "Black and white as primaries: students name black and white. Show that they change how light or dark a color is, but they are not on the color wheel.",
      "Secondary means less important: students think secondary colors are worse. Say 'second step' not 'second best'.",
      "Mixing many colors: students stir everything together and get brown. Limit mixing to two colors and add the darker color a little at a time.",
      "Focal point in the middle: students think it must be in the exact center. It is the part that pulls the eye first, wherever it is.",
      "Foreground means most important: students think the foreground is the best part. It is only the nearest part.",
    ],
    differentiation:
      "Entering and Emerging learners use the color wheel, the word bank and the frames and may point and say the color words while mixing. Developing learners label swatches with equations. Expanding and Bridging learners explain why they chose a focal point and critique with a suggestion. The artistic task and the criteria are the same for every tier; only the language support changes.",
    languageNotes:
      "Chorally practice 'primary' and 'secondary' with gestures (one finger and two fingers). Use gestures for near and far. Teach 'mix' with a stirring motion and 'overlap' with two papers. Say 'second step' for secondary to avoid a ranking.",
    studio:
      "Use washable tempera, cover tables, wear smocks, and have a clear clean-up routine. Check for skin sensitivities before painting. Avoid tasting or putting brushes in mouths. Many families use colors with their own meanings; invite students to share what a color means at home, and treat every meaning as valid. Assess the success criteria, never a student's skill or style.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

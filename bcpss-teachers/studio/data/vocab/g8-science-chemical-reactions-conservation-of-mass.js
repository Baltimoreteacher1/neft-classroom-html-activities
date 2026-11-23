// Vocabulary for "Chemical Reactions and Conservation of Mass" (grade 8 science, MS-PS1-2 and MS-PS1-5).
// Original definitions, examples and pictures. Picture text and alt text never print the entry's own word.
const entry = (e) => ({ tier: 3, domains: ["Speaking", "Writing"], klu: "Explain", ...e });

const label = (x, y, text, extra = {}) => ({
  t: "text",
  x,
  y,
  text,
  anchor: "middle",
  fill: "ink",
  size: 16,
  ...extra,
});
const ATOM = { C: ["navy", "paper"], H: ["sky", "ink"], O: ["coral", "paper"] };
/** One atom: a coloured circle with its element letter. */
const atom = (cx, cy, el, r = 20) => [
  { t: "circle", cx, cy, r, fill: ATOM[el][0], stroke: "ink", strokeWidth: 2 },
  label(cx, cy, el, { size: r > 16 ? 17 : 14, weight: 700, fill: ATOM[el][1] }),
];
/** Atoms joined to a centre atom by short bonds. */
const bonded = (cx, cy, centre, arms, r = 20) => [
  ...arms.flatMap(([dx, dy]) => [
    { t: "line", x1: cx, y1: cy, x2: cx + dx, y2: cy + dy, stroke: "ink", strokeWidth: 3 },
  ]),
  ...atom(cx, cy, centre, r),
  ...arms.flatMap(([dx, dy, el]) => atom(cx + dx, cy + dy, el, 15)),
];

/** The methane equation as two highlighted boxes; `side` is "left" or "right". */
const equation = (alt, side, note) => ({
  kind: "shapes",
  alt,
  w: 480,
  h: 220,
  items: [
    {
      t: "rect",
      x: 20,
      y: 70,
      w: 190,
      h: 80,
      rx: 10,
      fill: side === "left" ? "sky" : "paper",
      stroke: "navy",
      strokeWidth: side === "left" ? 4 : 2,
    },
    label(115, 110, "CH4 + 2 O2", { size: 24, weight: 700 }),
    { t: "line", x1: 218, y1: 110, x2: 262, y2: 110, stroke: "ink", strokeWidth: 4 },
    {
      t: "poly",
      points: [
        [262, 98],
        [282, 110],
        [262, 122],
      ],
      fill: "ink",
    },
    {
      t: "rect",
      x: 290,
      y: 70,
      w: 170,
      h: 80,
      rx: 10,
      fill: side === "right" ? "sky" : "paper",
      stroke: "navy",
      strokeWidth: side === "right" ? 4 : 2,
    },
    label(375, 110, "CO2 + 2 H2O", { size: 24, weight: 700 }),
    label(side === "left" ? 115 : 375, 185, note, { size: 16, weight: 700 }),
  ],
});

const beaker = (x, liquid, specks) => [
  { t: "rect", x, y: 60, w: 100, h: 130, rx: 8, fill: "paper", stroke: "ink", strokeWidth: 3 },
  { t: "rect", x: x + 4, y: 100, w: 92, h: 86, fill: liquid, opacity: 0.55 },
  ...specks.map(([dx, dy]) => ({
    t: "circle",
    cx: x + dx,
    cy: dy,
    r: 5,
    fill: "paper",
    stroke: "ink",
    strokeWidth: 1.5,
  })),
];

export default {
  id: "g8-science-chemical-reactions-conservation-of-mass",
  title: "Chemical Reactions and Conservation of Mass: language for evidence and models",
  grade: "8",
  band: "6-8",
  subject: "science",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to NGSS MS-PS1-2 and MS-PS1-5; not mapped to a district unit sequence. Words, examples and pictures are original.",
  },
  standards: ["MS-PS1-2", "MS-PS1-5", "RST.6-8.7"],
  entries: [
    entry({
      id: "chemical-reaction",
      word: "chemical reaction",
      pos: "noun phrase",
      pron: "KEM-ih-kul ree-AK-shun",
      def: "A change in which substances interact and form new substances with different properties.",
      visual: {
        kind: "flow",
        alt: "Two steps joined by an arrow. Step 1: two substances are mixed, baking soda and vinegar. Step 2: new substances appear, gas bubbles and a new liquid.",
        steps: [
          { label: "Baking soda + vinegar", icon: "flask" },
          { label: "Gas bubbles + new liquid", icon: "beaker" },
        ],
        w: 480,
        h: 200,
      },
      context: "Baking soda and vinegar bubble in a chemical reaction.",
      nonExample:
        "Ice melting is not a chemical reaction, because the water is still the same substance.",
      academicSentence: "In a chemical reaction, atoms are rearranged to make new substances.",
      everyday: "Like baking a cake, where the batter turns into something with new properties.",
      es: {
        word: "reacción química",
        def: "Un cambio en el que unas sustancias interactúan y forman sustancias nuevas con propiedades distintas.",
        verified: true,
      },
      misconception:
        "Students think any change they can see, such as melting or dissolving, is a chemical reaction.",
      related: ["physical-change", "reactant", "product", "precipitate"],
      practice: {
        visualPrompt: "What was there before the mixing, and what is there after?",
        speakWrite:
          "Describe a change you have seen at home and say whether new substances formed.",
        retrieval:
          "Which phrase names a change that forms new substances with different properties?",
      },
    }),
    entry({
      id: "physical-change",
      word: "physical change",
      pos: "noun phrase",
      pron: "FIZ-ih-kul CHAYNJ",
      def: "A change in the form or appearance of a substance that does not make a new substance.",
      visual: {
        kind: "flow",
        alt: "Two steps joined by an arrow. Step 1: solid ice. Step 2: liquid water. The same substance is shown in a new form.",
        steps: [
          { label: "Solid ice", icon: "snowflake" },
          { label: "Liquid water: same substance", icon: "drop" },
        ],
        w: 480,
        h: 200,
      },
      context: "Melting ice is a physical change because the water stays water.",
      nonExample:
        "Wood burning is not a physical change, because ash and gases are new substances.",
      academicSentence:
        "A physical change can alter shape, size or state while the substance stays the same.",
      everyday: "Like tearing paper into pieces. It is still paper.",
      es: {
        word: "cambio físico",
        def: "Un cambio en la forma o apariencia de una sustancia que no produce una sustancia nueva.",
        verified: true,
      },
      misconception:
        "Students think dissolving sugar in water makes a new substance because the sugar disappears.",
      related: ["chemical-reaction"],
      practice: {
        visualPrompt: "Is the substance in the second step the same as in the first step?",
        speakWrite: "Name a physical change and explain how you know no new substance formed.",
        retrieval: "Which phrase names a change that does not make a new substance?",
      },
    }),
    entry({
      id: "reactant",
      word: "reactant",
      pos: "noun",
      pron: "ree-AK-tunt",
      def: "A substance that is present at the start of a reaction and is used up or changed by it.",
      visual: equation(
        "A reaction written with an arrow. The group on the left of the arrow, CH4 plus 2 O2, is highlighted and marked as the substances at the start.",
        "left",
        "Substances at the start",
      ),
      context: "Methane is a reactant when it burns.",
      nonExample:
        "Carbon dioxide is not a reactant in burning methane. It is made by the reaction.",
      academicSentence: "The reactants are written on the left side of a chemical equation.",
      everyday: "Like the eggs and flour you put into a bowl before you bake.",
      es: {
        word: "reactivo",
        def: "Una sustancia que está presente al inicio de una reacción y se gasta o se transforma en ella.",
        verified: true,
      },
      related: ["product", "chemical-reaction"],
      practice: {
        visualPrompt: "Which side of the arrow shows the substances at the start?",
        speakWrite: "Name the reactants in a reaction you know, and say what they make.",
        retrieval: "Which word names a substance you start with in a reaction?",
      },
    }),
    entry({
      id: "product",
      word: "product",
      pos: "noun",
      pron: "PROD-ukt",
      def: "A substance that is made by a reaction and was not there at the start.",
      visual: equation(
        "A reaction written with an arrow. The group on the right of the arrow, CO2 plus 2 H2O, is highlighted and marked as the substances that are made.",
        "right",
        "Substances that are made",
      ),
      context: "Carbon dioxide is a product of burning methane.",
      nonExample: "Methane is not a product of burning methane. It is used up by the reaction.",
      academicSentence: "The products are written on the right side of a chemical equation.",
      everyday: "Like the cake that comes out of the oven after baking.",
      es: {
        word: "producto",
        def: "Una sustancia que se forma en una reacción y que no estaba al inicio.",
        verified: true,
      },
      related: ["reactant", "chemical-reaction"],
      practice: {
        visualPrompt: "Which side of the arrow shows the substances that are made?",
        speakWrite: "Name a product of burning a candle and explain why it is a product.",
        retrieval: "Which word names a substance that a reaction makes?",
      },
    }),
    entry({
      id: "atom",
      word: "atom",
      pos: "noun",
      pron: "AT-um",
      def: "The smallest unit of an element that still has that element's properties.",
      visual: {
        kind: "shapes",
        alt: "A drawing of a small dark centre with three small dots circling it on oval paths.",
        w: 480,
        h: 240,
        items: [
          {
            t: "ellipse",
            cx: 240,
            cy: 120,
            rx: 110,
            ry: 40,
            fill: "none",
            stroke: "navy",
            strokeWidth: 2,
          },
          {
            t: "ellipse",
            cx: 240,
            cy: 120,
            rx: 40,
            ry: 100,
            fill: "none",
            stroke: "navy",
            strokeWidth: 2,
          },
          { t: "circle", cx: 240, cy: 120, r: 16, fill: "coral", stroke: "ink", strokeWidth: 2 },
          { t: "circle", cx: 350, cy: 120, r: 8, fill: "sky", stroke: "ink", strokeWidth: 2 },
          { t: "circle", cx: 130, cy: 120, r: 8, fill: "sky", stroke: "ink", strokeWidth: 2 },
          { t: "circle", cx: 240, cy: 20, r: 8, fill: "sky", stroke: "ink", strokeWidth: 2 },
        ],
      },
      context: "Each atom of carbon in the methane ends up in a carbon dioxide molecule.",
      nonExample: "A drop of water is not an atom. It contains billions of them.",
      academicSentence:
        "In a chemical reaction, atoms are rearranged but never created or destroyed.",
      everyday: "Like the same building blocks used to make a different model.",
      es: {
        word: "átomo",
        def: "La unidad más pequeña de un elemento que todavía tiene las propiedades de ese elemento.",
        verified: true,
      },
      misconception: "Students think atoms are used up or turn into energy when something burns.",
      related: ["molecule", "conservation-of-mass"],
      practice: {
        visualPrompt: "What do you notice about the center and the dots around it?",
        speakWrite: "Explain what happens to the atoms when a reaction takes place.",
        retrieval: "Which word names the smallest unit of an element?",
      },
    }),
    entry({
      id: "molecule",
      word: "molecule",
      pos: "noun",
      pron: "MOL-ih-kyool",
      def: "Two or more atoms joined together by bonds.",
      visual: {
        kind: "shapes",
        alt: "One large circle marked O joined by short lines to two small circles marked H, forming a bent shape of three joined circles.",
        w: 480,
        h: 240,
        items: [
          ...bonded(
            240,
            90,
            "O",
            [
              [-60, 70, "H"],
              [60, 70, "H"],
            ],
            28,
          ),
          label(240, 210, "O joined to two H", { size: 17, weight: 700 }),
        ],
      },
      context: "A water molecule has one oxygen atom and two hydrogen atoms.",
      nonExample: "A single oxygen atom floating alone is not a molecule.",
      academicSentence:
        "A chemical reaction breaks the bonds in the molecules of the reactants and forms new molecules.",
      everyday: "Like a few building blocks snapped into one small shape.",
      es: { word: "molécula", def: "Dos o más átomos unidos por enlaces.", verified: true },
      related: ["atom", "chemical-reaction"],
      practice: {
        visualPrompt: "How many atoms are joined in the picture?",
        speakWrite: "Describe a molecule you know by naming the atoms it contains.",
        retrieval: "Which word names atoms joined together?",
      },
    }),
    entry({
      id: "conservation-of-mass",
      word: "conservation of mass",
      pos: "noun phrase",
      pron: "kon-ser-VAY-shun uv MAS",
      def: "The idea that the total mass of everything before a reaction equals the total mass after it.",
      visual: {
        kind: "table",
        alt: "A grid with two columns, before and after. The first row lists the substances: 16 grams plus 64 grams before, and 44 grams plus 36 grams after. The second row gives totals: 80 grams before and 80 grams after.",
        head: ["Before (grams)", "After (grams)"],
        rows: [
          ["16 + 64", "44 + 36"],
          ["80 total", "80 total"],
        ],
        highlight: [
          [1, 0],
          [1, 1],
        ],
      },
      context:
        "Conservation of mass means the total mass before a reaction equals the total mass after it.",
      nonExample:
        "A cup that gets lighter because gas escapes does not break the idea. The gas still has mass outside the cup.",
      academicSentence:
        "Because atoms are only rearranged, the total mass of the products equals the total mass of the reactants.",
      everyday:
        "Like counting every piece of a puzzle before and after you rebuild it into a new picture.",
      es: {
        word: "conservación de la masa",
        def: "La idea de que la masa total de las sustancias antes de una reacción es igual a la masa total después.",
        verified: true,
      },
      misconception: "Students think mass disappears when something burns or a gas is released.",
      related: ["closed-system", "atom", "reactant", "product"],
      practice: {
        visualPrompt: "Compare the two totals. What do you notice?",
        speakWrite:
          "Explain why 16 grams plus 64 grams must equal the mass of the products in a sealed container.",
        retrieval: "Which phrase names the idea that total mass stays the same in a reaction?",
      },
    }),
    entry({
      id: "closed-system",
      word: "closed system",
      pos: "noun phrase",
      pron: "KLOHZD SIS-tum",
      def: "A set of materials in a container where nothing can enter or leave, so all the matter can be measured.",
      visual: {
        kind: "shapes",
        alt: "A sealed jar with gas dots inside. Two arrows from the outside are blocked by crossed lines at the jar's lid and walls, showing that nothing goes in or out.",
        w: 480,
        h: 260,
        items: [
          {
            t: "rect",
            x: 160,
            y: 50,
            w: 160,
            h: 170,
            rx: 14,
            fill: "paper",
            stroke: "ink",
            strokeWidth: 4,
          },
          {
            t: "rect",
            x: 150,
            y: 36,
            w: 180,
            h: 22,
            rx: 6,
            fill: "navy",
            stroke: "ink",
            strokeWidth: 2,
          },
          ...[
            [200, 110],
            [250, 150],
            [290, 100],
            [215, 180],
            [275, 195],
          ].map(([cx, cy]) => ({
            t: "circle",
            cx,
            cy,
            r: 9,
            fill: "sky",
            stroke: "ink",
            strokeWidth: 2,
          })),
          { t: "line", x1: 40, y1: 120, x2: 125, y2: 120, stroke: "ink", strokeWidth: 3 },
          label(150, 124, "X", { size: 26, weight: 700, fill: "coral" }),
          { t: "line", x1: 440, y1: 150, x2: 355, y2: 150, stroke: "ink", strokeWidth: 3 },
          label(330, 154, "X", { size: 26, weight: 700, fill: "coral" }),
          label(240, 245, "Nothing in, nothing out", { size: 16, weight: 700 }),
        ],
      },
      context: "In a closed system, the mass on the balance stays the same during a reaction.",
      nonExample:
        "An open cup on a desk is not a closed system, because gas can escape into the room.",
      academicSentence:
        "To test conservation of mass, scientists measure the mass of a closed system before and after the reaction.",
      everyday: "Like a lunchbox with the lid snapped shut.",
      es: {
        word: "sistema cerrado",
        def: "Un conjunto de materiales en un recipiente del que nada puede entrar ni salir, así que toda la materia se puede medir.",
        verified: true,
      },
      misconception:
        "Students forget that a gas escaping from an open container carries mass away.",
      related: ["conservation-of-mass", "chemical-reaction"],
      practice: {
        visualPrompt: "What stops matter from entering or leaving?",
        speakWrite:
          "Explain why a sealed bag is better than an open cup for testing whether mass changes.",
        retrieval: "Which phrase names a container where nothing enters or leaves?",
      },
    }),
    entry({
      id: "precipitate",
      word: "precipitate",
      pos: "noun",
      pron: "prih-SIP-ih-tut",
      def: "A solid that forms when two liquids are mixed and then settles out of the mixture.",
      visual: {
        kind: "shapes",
        alt: "Two glasses with an arrow between them. The first glass holds clear liquid. The second holds cloudy liquid with white specks sinking to the bottom.",
        w: 480,
        h: 240,
        items: [
          ...beaker(50, "sky", []),
          { t: "icon", name: "arrow-right", x: 190, y: 92, s: 56 },
          ...beaker(300, "sky", [[22, 182], [36, 178], [52, 183], [68, 179], [30, 170], [48, 172], [78, 184]]),
          label(100, 215, "Clear liquid", { size: 15 }),
          label(350, 215, "White solid settles", { size: 15 }),
        ],
      },
      context: "A white precipitate formed when the two clear liquids were mixed.",
      nonExample:
        "Sugar settling at the bottom of a glass is not a precipitate, because it was already a solid before mixing.",
      academicSentence:
        "A precipitate is evidence of a chemical reaction because a new solid appeared from two liquids.",
      everyday: "Like cloudy specks that appear in a clear jar when hard water meets soap.",
      es: {
        word: "precipitado",
        def: "Un sólido que se forma cuando se mezclan dos líquidos y luego se asienta en la mezcla.",
        verified: true,
      },
      related: ["chemical-reaction", "evidence"],
      practice: {
        visualPrompt: "What is in the second glass that was not in the first?",
        speakWrite: "Explain why a precipitate is evidence that a new substance formed.",
        retrieval: "Which word names a solid that forms when liquids are mixed?",
      },
    }),
    entry({
      id: "evidence",
      word: "evidence",
      pos: "noun",
      pron: "EV-ih-dents",
      def: "Facts or measurements you can point to that support an answer.",
      visual: {
        kind: "flow",
        alt: "Three steps in a row. Step 1: measure 150.0 grams before. Step 2: measure 148.6 grams after. Step 3: compare them and find 1.4 grams lost.",
        steps: [
          { label: "Measure: 150.0 g before", icon: "balance-scale" },
          { label: "Measure: 148.6 g after", icon: "balance-scale" },
          { label: "Compare: 1.4 g lost" },
        ],
        w: 480,
        h: 200,
      },
      context: "A mass reading of 150.0 grams before and after is evidence that nothing escaped.",
      nonExample: "'I just think so' is not evidence, because there is nothing to point to.",
      academicSentence:
        "Scientists support a claim with evidence from observations and measurements.",
      everyday: "Like a receipt that proves what you paid.",
      es: {
        word: "evidencia",
        def: "Hechos o mediciones a los que puedes señalar que apoyan una respuesta.",
        verified: true,
      },
      related: ["claim", "reasoning", "precipitate"],
      practice: {
        visualPrompt: "Which numbers could you point to in an explanation?",
        speakWrite: "Name one measurement that would be evidence in a mass experiment.",
        retrieval: "Which word names facts or measurements that support an answer?",
      },
    }),
    entry({
      id: "claim",
      word: "claim",
      pos: "noun",
      pron: "KLAYM",
      def: "A statement that answers a question and can be supported with evidence.",
      visual: {
        kind: "shapes",
        alt: "A speech bubble containing the sentence The total mass stays the same, with a small label under it that says it answers the question.",
        w: 480,
        h: 220,
        items: [
          {
            t: "rect",
            x: 50,
            y: 30,
            w: 380,
            h: 100,
            rx: 22,
            fill: "sky",
            stroke: "navy",
            strokeWidth: 3,
          },
          {
            t: "poly",
            points: [
              [120, 130],
              [160, 130],
              [110, 175],
            ],
            fill: "sky",
            stroke: "navy",
            strokeWidth: 3,
          },
          label(240, 80, "The total mass stays the same.", { size: 22, weight: 700 }),
          label(300, 190, "It answers the question.", { size: 16 }),
        ],
      },
      context: "Her claim was that the mass would stay the same in the sealed bag.",
      nonExample: "A question is not a claim, because it does not give an answer.",
      academicSentence: "A strong claim answers the question and can be tested with evidence.",
      everyday: "Like saying 'this route is faster' before showing the times.",
      es: {
        word: "afirmación",
        def: "Una declaración que responde una pregunta y que se puede apoyar con evidencia.",
        verified: true,
      },
      related: ["evidence", "reasoning"],
      practice: {
        visualPrompt: "Does the sentence in the bubble answer a question?",
        speakWrite:
          "Write a claim that answers: does mass change when baking soda and vinegar react in a sealed bag?",
        retrieval: "Which word names a statement that answers a question?",
      },
    }),
    entry({
      id: "reasoning",
      word: "reasoning",
      pos: "noun",
      pron: "REE-zun-ing",
      def: "The explanation that connects the evidence to the claim using a science idea.",
      visual: {
        kind: "flow",
        alt: "Three steps from top to bottom. A measurement, then a science idea, then the conclusion they lead to.",
        steps: [
          { label: "Data: 150.0 g before and 150.0 g after in a sealed bag" },
          { label: "Idea: atoms are only rearranged" },
          { label: "So: no mass is lost" },
        ],
        vertical: true,
        w: 480,
        h: 320,
      },
      context: "Her reasoning was that atoms are only rearranged, so none are lost.",
      nonExample:
        "Repeating the measurement is not reasoning. Reasoning says why the measurement supports the claim.",
      academicSentence:
        "Good reasoning uses a science idea to explain why the evidence supports the claim.",
      everyday: "Like explaining why a footprint shows someone walked by.",
      es: {
        word: "razonamiento",
        def: "La explicación que conecta la evidencia con la afirmación usando una idea científica.",
        verified: true,
      },
      related: ["evidence", "claim"],
      practice: {
        visualPrompt: "Which step is the science idea that links the data to the conclusion?",
        speakWrite: "Complete: The evidence supports my claim because ___ . Say it, then write it.",
        retrieval: "Which word names the explanation that links evidence to a claim?",
      },
    }),
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

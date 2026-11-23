// Small vocabulary collections used only by the vocabulary view tests. One per explorer template.
// Visual specs follow the kit contract in STUDIO-SPEC.md; tests render them with a stub or the real renderer.

const tape = (a, b) => ({
  kind: "tape",
  alt: `Tape diagram: ${a} units of cats and ${b} units of dogs.`,
  parts: [
    { label: "cats", units: a },
    { label: "dogs", units: b },
  ],
});
const entry = (o) => ({
  pos: "noun",
  pron: o.word.toUpperCase(),
  context: `Use ${o.word} in a sentence.`,
  academicSentence: `We can describe ${o.word} with evidence.`,
  practice: { speakWrite: `Say ${o.word}, then write it.` },
  ...o,
});

export const mathFixture = {
  id: "fx-math-ratios",
  title: "Grade 6 Math: Ratios (fixture)",
  grade: "6",
  band: "6-8",
  subject: "math",
  curriculum: { status: "standards-aligned", note: "Teacher-only curriculum note." },
  standards: ["6.RP.A.1"],
  entries: [
    entry({
      id: "ratio",
      word: "ratio",
      pron: "RAY-shee-oh",
      def: "A comparison of two quantities.",
      context: "The ratio of cats to dogs is 3 to 2.",
      nonExample: "3 + 2 is not a ratio; it adds the quantities.",
      misconception: "Students think a ratio must be written as a fraction.",
      visual: tape(3, 2),
      es: { word: "razón", def: "Una comparación de dos cantidades.", verified: true },
      klu: "Explain",
      tier: 3,
      related: ["unit rate"],
      practice: {
        visualPrompt: "Which picture shows 2 to 3?",
        speakWrite: "Say a ratio about our class, then write it.",
        retrieval: "Yesterday we compared two quantities. Which word names that comparison?",
      },
      explore: {
        math: {
          vars: [
            { id: "a", label: "Units of cats", min: 1, max: 8, step: 1, start: 3 },
            { id: "b", label: "Units of dogs", min: 1, max: 8, step: 1, start: 2 },
          ],
          binds: [
            { path: "parts.0.units", var: "a" },
            { path: "parts.1.units", var: "b" },
          ],
          readout: "Cats: {a} units. Dogs: {b} units. The ratio of cats to dogs is {a} to {b}.",
          match: {
            prompt: "Choose the statement that is true for this picture.",
            options: [
              { text: "The ratio of cats to dogs is {a} to {b}.", ok: "1" },
              { text: "The ratio of cats to dogs is {b} to {a}.", ok: "a == b" },
              { text: "The ratio of cats to dogs is {a+b} to {b}.", ok: "a == 0" },
            ],
          },
          reps: [
            { label: "Picture 1", set: {}, ok: "1" },
            { label: "Picture 2", set: { a: "b", b: "a" }, ok: "a == b" },
          ],
          sentence: "The ratio of cats to dogs is {a} to {b}.",
          target: {
            prompt: "Make a picture that shows a ratio of 4 to 6.",
            ok: "a * 6 == b * 4",
            explain: "4 to 6 compares 4 units to 6 units.",
            hint: "Set cats to 4 and dogs to 6, or find another pair with the same ratio.",
          },
        },
      },
    }),
    entry({
      id: "unit-rate",
      word: "unit rate",
      def: "A rate that tells how much for exactly 1 unit.",
      context: "The unit rate is 4 miles for 1 hour.",
      visual: {
        kind: "numberline",
        alt: "A number line from 0 to 10 with a point.",
        min: 0,
        max: 10,
        step: 1,
        marks: [{ at: 4, label: "4" }],
      },
      es: { word: "tasa unitaria", def: "Una tasa por 1 unidad.", verified: false },
    }),
    entry({
      id: "equivalent",
      word: "equivalent",
      pos: "adjective",
      def: "Equal in value.",
      context: "2 to 3 and 4 to 6 are equivalent ratios.",
      visual: {
        kind: "bars",
        alt: "Bar chart with two bars.",
        data: [
          { label: "A", value: 4 },
          { label: "B", value: 6 },
        ],
        xLabel: "Group",
        yLabel: "Count",
      },
    }),
  ],
  review: { status: "authored", checks: {} },
};

const sci = (subject, extra = {}) => ({
  id: `fx-${subject}`,
  title: `Fixture ${subject}`,
  grade: "4",
  band: "3-5",
  subject,
  curriculum: { status: "standards-aligned", note: "note" },
  standards: [],
  review: { status: "authored", checks: {} },
  ...extra,
});

const pic = (alt) => ({ kind: "icon", name: "leaf", alt });

export const elaFixture = sci("ela", {
  entries: [
    entry({
      id: "reluctant",
      word: "reluctant",
      pos: "adjective",
      def: "Not wanting to do something.",
      context:
        "Mia was reluctant to jump in; she stepped back from the cold water and shook her head.",
      nonExample: "Eager means wanting to do something, not reluctant.",
      visual: pic("A child stepping back from water."),
      explore: {
        ela: {
          clues: ["stepped back", "shook her head"],
          shades: {
            prompt: "Put the words in order from least to most willing.",
            words: ["unwilling", "reluctant", "hesitant", "eager"],
          },
        },
      },
    }),
    entry({
      id: "cautious",
      word: "cautious",
      pos: "adjective",
      def: "Careful to avoid danger.",
      context: "The cautious hiker tested each rock before she stepped.",
      visual: pic("A hiker testing a rock."),
    }),
    entry({
      id: "eager",
      word: "eager",
      pos: "adjective",
      def: "Wanting very much to do something.",
      context: "The eager class lined up before the bell.",
      visual: pic("A line of students."),
    }),
  ],
});

export const socialFixture = sci("social-studies", {
  entries: [
    entry({
      id: "migration",
      word: "migration",
      def: "Moving from one place to live in another.",
      context: "Migration brought many families to the city.",
      visual: {
        kind: "timeline",
        alt: "Timeline of three events.",
        span: [1900, 1930],
        events: [
          { at: 1900, label: "Families leave farms", detail: "Work on farms is hard to find." },
          { at: 1915, label: "Families travel by train", detail: "Trains carry people north." },
          { at: 1930, label: "Neighborhoods grow", detail: "New neighborhoods form in cities." },
        ],
      },
      explore: {
        social: {
          sources: [
            {
              id: "s1",
              text: "A letter written by a traveler in 1915 describing her train ride.",
              type: "primary",
            },
            {
              id: "s2",
              text: "A textbook chapter written today about the great migration.",
              type: "secondary",
            },
          ],
          relations: [
            { from: "farm work disappears", to: "families move", label: "caused" },
            { from: "families move", to: "cities grow", label: "led to" },
          ],
        },
      },
    }),
    entry({
      id: "region",
      word: "region",
      def: "An area with something in common.",
      context: "The coastal region has many ports.",
      visual: {
        kind: "map",
        alt: "Schematic map with three regions.",
        regions: [
          { id: "n", label: "North", rect: [10, 10, 200, 90] },
          { id: "m", label: "Middle", rect: [10, 110, 200, 90] },
          { id: "s", label: "South", rect: [10, 210, 200, 90] },
        ],
      },
      explore: {
        social: {
          places: [
            { region: "North", note: "The region with the coldest winters." },
            { region: "Middle", note: "The region between the other two." },
            { region: "South", note: "The region with the warmest winters." },
          ],
        },
      },
    }),
  ],
});

export const artsFixture = sci("arts", {
  entries: [
    entry({
      id: "contrast",
      word: "contrast",
      def: "A strong difference, like light and dark.",
      context: "The artist used contrast between a dark sky and a bright moon.",
      visual: pic("Dark sky and a bright moon."),
    }),
  ],
});
export const peFixture = sci("health-pe", {
  entries: [
    entry({
      id: "pivot",
      word: "pivot",
      pos: "verb",
      def: "To turn on one foot.",
      context: "Pivot on your back foot while you pass.",
      visual: pic("A player turning."),
      explore: {
        cues: [
          { cue: "Plant one foot.", detail: "Keep it still on the floor." },
          { cue: "Turn on the ball of the foot.", detail: "Keep your knees soft." },
        ],
      },
    }),
  ],
});
export const languageFixture = sci("world-languages", {
  entries: [
    entry({
      id: "casa",
      word: "casa",
      def: "A place where people live.",
      context: "Mi casa es grande.",
      visual: pic("A house."),
    }),
    entry({
      id: "libro",
      word: "libro",
      def: "Pages you read.",
      context: "Leo un libro.",
      visual: pic("A book."),
    }),
    entry({
      id: "mesa",
      word: "mesa",
      def: "A flat top with legs.",
      context: "El libro esta en la mesa.",
      visual: pic("A table."),
    }),
  ],
});
export const kFixture = sci("science", {
  grade: "K",
  band: "k-2",
  title: "Fixture kindergarten",
  entries: [
    entry({
      id: "leaf",
      word: "leaf",
      def: "The flat green part of a plant.",
      context: "The leaf is green.",
      visual: pic("A green leaf."),
    }),
    entry({
      id: "seed",
      word: "seed",
      def: "The part a plant grows from.",
      context: "A seed is small.",
      visual: pic("A small seed."),
    }),
  ],
});

export const allFixtures = [
  mathFixture,
  elaFixture,
  socialFixture,
  artsFixture,
  peFixture,
  languageFixture,
  kFixture,
];

/** Renderer stub: deterministic SVG that carries the spec's alt as title/desc and its numbers as text. */
export function stubRender(spec) {
  const nums = JSON.stringify(spec).match(/\d+/g)?.join(",") || "";
  return `<svg viewBox="0 0 480 320" role="img" xmlns="http://www.w3.org/2000/svg"><title>${spec.alt}</title><desc>${spec.longDesc || spec.alt}</desc><text x="10" y="20" data-kind="${spec.kind}">${nums}</text></svg>`;
}

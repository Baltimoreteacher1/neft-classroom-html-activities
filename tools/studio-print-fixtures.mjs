// Real fixture data for the print tests and QC: one vocabulary set + one lesson for each K-8 age band.
// Authored for testing the Resource Studio only; arithmetic is checked in studio-print.test.mjs.
import { renderIcon } from "../bcpss-teachers/studio/core/icons.js";

const icon = (name, alt) => ({ kind: "icon", name, alt });
const tape = (alt, parts) => ({ kind: "tape", alt, parts });

const entry = (id, word, pos, def, visual, context, extra = {}) => ({
  id,
  word,
  pos,
  pron: extra.pron || "",
  def,
  visual,
  context,
  ...extra,
});

export const FIXTURES = {
  "6-8": {
    grade: "6",
    subject: "math",
    vocab: {
      id: "fx-g6-math-ratios",
      title: "Ratio vocabulary",
      grade: "6",
      subject: "math",
      standards: ["6.RP.A.1"],
      entries: [
        entry(
          "ratio",
          "ratio",
          "noun",
          "A comparison of two quantities.",
          tape("A tape diagram with 3 cat units over 2 dog units", [
            { label: "cats", units: 3 },
            { label: "dogs", units: 2 },
          ]),
          "The ratio of cats to dogs is 3 to 2.",
          {
            pron: "RAY-shee-oh",
            nonExample: "3 + 2 = 5 adds the quantities; it is not a ratio.",
            academicSentence: "A ratio compares one quantity to another quantity.",
            es: { word: "razón", def: "Una comparación de dos cantidades.", verified: true },
          },
        ),
        entry(
          "rate",
          "rate",
          "noun",
          "A ratio that compares two quantities with different units.",
          tape("A tape diagram showing 60 miles for 1 hour", [
            { label: "60 miles", units: 3 },
            { label: "1 hour", units: 1 },
          ]),
          "The car travels 60 miles per hour.",
          {
            pron: "rayt",
            es: {
              word: "tasa",
              def: "Una razón que compara cantidades con unidades distintas.",
              verified: true,
            },
          },
        ),
        entry(
          "unit-rate",
          "unit rate",
          "noun",
          "A rate with 1 as the second quantity.",
          tape("A tape diagram showing 3 dollars for 1 pound", [
            { label: "3 dollars", units: 3 },
            { label: "1 pound", units: 1 },
          ]),
          "12 dollars for 4 pounds is 3 dollars per pound.",
          { pron: "YOO-nit rayt" },
        ),
        entry(
          "equivalent-ratios",
          "equivalent ratios",
          "noun phrase",
          "Ratios that describe the same relationship.",
          tape("Two tape diagrams, 2 to 3 and 4 to 6, of equal proportion", [
            { label: "2", units: 2 },
            { label: "3", units: 3 },
          ]),
          "2:3 and 4:6 are equivalent ratios.",
          {
            pron: "ih-KWIV-uh-lunt RAY-shee-ohs",
            nonExample: "2:3 and 3:4 are not equivalent ratios.",
            es: {
              word: "razones equivalentes",
              def: "Razones que describen la misma relación.",
              verified: true,
            },
          },
        ),
        entry(
          "ratio-table",
          "ratio table",
          "noun phrase",
          "A table that shows equivalent ratios.",
          {
            kind: "table",
            alt: "A ratio table with rows for flour and milk",
            head: ["Flour (cups)", "Milk (cups)"],
            rows: [
              ["2", "3"],
              ["4", "6"],
              ["6", "9"],
            ],
          },
          "The ratio table shows 2 cups flour for every 3 cups milk.",
          { pron: "RAY-shee-oh TAY-bul" },
        ),
        entry(
          "proportion",
          "proportion",
          "noun",
          "An equation that says two ratios are equal.",
          null,
          "2/3 = 4/6 is a proportion.",
          {
            pron: "pruh-POR-shun",
            noVisualReason: "abstract equation",
            es: {
              word: "proporción",
              def: "Una ecuación que dice que dos razones son iguales.",
              verified: false,
            },
          },
        ),
      ],
    },
    lesson: {
      id: "fx-g6-math-ratio-tables",
      title: "Ratio tables",
      grade: "6",
      subject: "math",
      standards: ["6.RP.A.3"],
      source: "Original - The Language Page",
      contentObjective: "I can use a ratio table to find equivalent ratios.",
      languageObjective: "I can explain why two ratios are equivalent using the word because.",
      wida: { klus: ["Explain"] },
      vocab: {
        collection: "fx-g6-math-ratios",
        ids: ["ratio", "rate", "unit-rate", "equivalent-ratios", "ratio-table"],
      },
      launch: {
        visual: tape("A tape diagram for 2 cups flour to 3 cups milk", [
          { label: "flour", units: 2 },
          { label: "milk", units: 3 },
        ]),
        prompts: ["What do you notice about the flour and the milk?"],
      },
      teach: {
        model: [
          "A ratio compares two quantities. A recipe that uses 2 cups of flour for every 3 cups of milk has the ratio 2 to 3.",
          "A ratio table lists equivalent ratios. To make a new row, multiply both numbers in a row by the same number.",
          "Doubling the recipe gives 4 cups of flour and 6 cups of milk. The ratio 4 to 6 is equivalent to 2 to 3.",
          "Adding the same number to both parts does not keep the ratio the same.",
        ],
      },
      guided: [
        {
          id: "g1",
          prompt:
            "A recipe uses 2 cups of flour for every 3 cups of milk. How much milk goes with 6 cups of flour?",
          answer: "9 cups",
          hint: "Find what you multiplied 2 by to get 6.",
          supports: {},
        },
        {
          id: "g2",
          prompt: "3 apples cost 6 dollars. At this rate, how much do 9 apples cost?",
          answer: "18 dollars",
          hint: "How many groups of 3 apples are in 9 apples?",
          supports: {},
        },
      ],
      collaborate: {
        task: "With a partner, build a ratio table for a smoothie recipe and explain how you know each row is equivalent.",
        roles: ["Reader", "Recorder", "Speaker"],
        discussionCards: [
          {
            prompt: "How do you know two ratios are equivalent?",
            frame: "Two ratios are equivalent when ______.",
          },
          {
            prompt: "Why does adding 2 to both parts change the ratio?",
            frame: "Adding changes the ratio because ______.",
          },
        ],
      },
      threeWays: {
        apply: {
          title: "Apply",
          task: "Make a ratio table for 5 pencils for 4 dollars and find the cost of 15 pencils.",
          successCriteria: [
            "My table has at least three equivalent rows.",
            "I used the words ratio and equivalent.",
            "I checked my answer.",
          ],
        },
        discuss: {
          structure: "Explain to your partner how you made the next row of the table.",
          frames: ["I multiplied both numbers by ______."],
        },
      },
      independent: {
        items: [
          {
            id: "i1",
            type: "choice",
            prompt: "Which ratio is equivalent to 4:6?",
            choices: ["2:3", "3:2", "6:8", "8:10"],
            answer: "2:3",
            explain: "Divide both numbers by 2: 4 ÷ 2 = 2 and 6 ÷ 2 = 3.",
          },
          {
            id: "i2",
            type: "short",
            prompt:
              "A bike rider goes 30 miles in 2 hours at a steady rate. How many miles does the rider go in 5 hours?",
            answer: "75 miles",
            explain: "30 ÷ 2 = 15 miles per hour, and 15 × 5 = 75.",
          },
          {
            id: "i3",
            type: "choice",
            prompt:
              "There are 12 boys and 8 girls. What is the ratio of girls to boys in simplest form?",
            choices: ["2:3", "3:2", "8:12", "12:8"],
            answer: "2:3",
            explain: "8:12 divided by 4 on both parts is 2:3.",
          },
          {
            id: "i4",
            type: "short",
            prompt:
              "A store sells 4 notebooks for 10 dollars. What is the unit rate in dollars per notebook?",
            answer: "2.50 dollars per notebook",
            explain: "10 ÷ 4 = 2.5.",
          },
        ],
      },
      formative: {
        items: [
          {
            id: "f1",
            type: "short",
            prompt: "Are 5:8 and 15:24 equivalent? Explain how you know.",
            answer: "Yes; multiply both numbers in 5:8 by 3.",
            explain: "5 × 3 = 15 and 8 × 3 = 24.",
          },
        ],
      },
      exitTicket: {
        prompt: "Check for understanding",
        items: [
          {
            id: "e1",
            type: "short",
            prompt: "Write one ratio equivalent to 3:5 and explain why it is equivalent.",
            answer: "6:10 (multiply both by 2).",
            explain: "3 × 2 = 6 and 5 × 2 = 10, so 6:10 is equivalent.",
          },
        ],
      },
      extension: {
        title: "Extend",
        task: "Find a ratio equivalent to 7:3 with a second number greater than 20.",
      },
      answerKey: {
        notes: "Strong explanations name the multiplier and apply it to both parts.",
        items: {},
      },
      teacherNotes: {
        misconceptions: [
          "Students add the same number to both parts instead of multiplying (2:3 becomes 4:5).",
          "Students reverse the order of the quantities in a ratio.",
        ],
        differentiation:
          "Offer a ratio table with the first row filled for students who need an entry point.",
      },
    },
  },
  "3-5": {
    grade: "4",
    subject: "science",
    vocab: {
      id: "fx-g4-science-water",
      title: "Water cycle words",
      grade: "4",
      subject: "science",
      standards: [],
      entries: [
        entry(
          "evaporation",
          "evaporation",
          "noun",
          "When liquid water heats up and turns into water vapor.",
          icon("sun", "A bright sun warming the ground"),
          "The sun's heat causes evaporation from the ocean.",
          {
            pron: "ih-vap-uh-RAY-shun",
            nonExample: "Ice melting is not evaporation; it stays liquid.",
          },
        ),
        entry(
          "condensation",
          "condensation",
          "noun",
          "When water vapor cools and turns into tiny drops of liquid water.",
          icon("cloud", "A cloud"),
          "Clouds form by condensation high in the sky.",
          { pron: "kon-den-SAY-shun" },
        ),
        entry(
          "precipitation",
          "precipitation",
          "noun",
          "Water that falls from clouds as rain, snow, sleet or hail.",
          icon("rain", "A rain cloud with falling drops"),
          "Precipitation filled the lake after the storm.",
          {
            pron: "pruh-sip-ih-TAY-shun",
            es: {
              word: "precipitación",
              def: "Agua que cae de las nubes como lluvia o nieve.",
              verified: true,
            },
          },
        ),
        entry(
          "collection",
          "collection",
          "noun",
          "When water gathers in oceans, lakes, rivers and underground.",
          icon("drop", "A single water drop"),
          "Rain flows downhill into a river for collection.",
          { pron: "kuh-LEK-shun" },
        ),
      ],
    },
    lesson: {
      id: "fx-g4-science-water-cycle",
      title: "The water cycle",
      grade: "4",
      subject: "science",
      standards: [],
      source: "Original - The Language Page",
      contentObjective: "I can describe how water moves through the water cycle.",
      languageObjective:
        "I can explain the order of the water cycle using first, then and finally.",
      wida: { klus: ["Explain"] },
      vocab: {
        collection: "fx-g4-science-water",
        ids: ["evaporation", "condensation", "precipitation", "collection"],
      },
      launch: {
        visual: {
          kind: "cycle",
          alt: "A cycle diagram: evaporation, condensation, precipitation, collection",
          stages: [
            { label: "Evaporation" },
            { label: "Condensation" },
            { label: "Precipitation" },
            { label: "Collection" },
          ],
        },
        prompts: ["What do you notice about where the water goes?"],
      },
      teach: {
        model: [
          "The sun warms water in oceans and lakes. The water evaporates and rises as water vapor.",
          "High in the air the vapor cools and condenses into tiny drops that form clouds.",
          "When the drops get heavy, they fall as precipitation. The water collects in oceans, lakes and rivers and the cycle starts again.",
        ],
      },
      guided: [
        {
          id: "g1",
          prompt: "Which process turns liquid water into water vapor?",
          type: "choice",
          choices: ["Evaporation", "Condensation", "Precipitation", "Collection"],
          answer: "Evaporation",
          explain: "Heat from the sun turns liquid water into vapor.",
          supports: {},
        },
      ],
      collaborate: {
        task: "With a partner, tell the story of one drop of water through the whole cycle.",
        discussionCards: [
          {
            prompt: "What would happen to the cycle if there were no sun?",
            frame: "Without the sun, ______ because ______.",
          },
        ],
      },
      threeWays: {
        apply: {
          title: "Apply",
          task: "Draw the water cycle and label each step.",
          successCriteria: ["I labeled all four steps.", "I used arrows to show the order."],
        },
      },
      independent: {
        items: [
          {
            id: "i1",
            type: "choice",
            prompt: "What causes water vapor to turn into tiny drops in a cloud?",
            choices: ["Warming", "Cooling", "Freezing", "Wind"],
            answer: "Cooling",
            explain: "Cooling vapor condenses into liquid drops.",
          },
          {
            id: "i2",
            type: "short",
            prompt: "Name two forms of precipitation.",
            answer: "Rain and snow (sleet or hail also count).",
            explain: "Precipitation is water that falls from clouds.",
          },
          {
            id: "i3",
            type: "choice",
            prompt: "Where does most water collect on Earth?",
            choices: ["In clouds", "In oceans", "In puddles", "In soil only"],
            answer: "In oceans",
            explain: "Oceans hold most of Earth's water.",
          },
        ],
      },
      formative: {
        items: [
          {
            id: "f1",
            type: "short",
            prompt: "Explain how a puddle can disappear on a sunny day.",
            answer: "The sun heats the water so it evaporates into the air.",
            explain: "Evaporation changes liquid water to water vapor.",
          },
        ],
      },
      exitTicket: {
        prompt: "Check",
        items: [
          {
            id: "e1",
            type: "short",
            prompt: "Put these in order: precipitation, evaporation, condensation.",
            answer: "Evaporation, condensation, precipitation.",
            explain: "Water rises, cools into clouds, then falls.",
          },
        ],
      },
      answerKey: { notes: "Look for the correct order and the cause of each change.", items: {} },
      teacherNotes: {
        misconceptions: [
          "Students think clouds are made of water vapor; they are made of tiny liquid drops.",
        ],
      },
    },
  },
  "k-2": {
    grade: "1",
    subject: "math",
    vocab: {
      id: "fx-g1-math-add",
      title: "Adding words",
      grade: "1",
      subject: "math",
      standards: ["1.OA.A.1"],
      entries: [
        entry(
          "add",
          "add",
          "verb",
          "Put groups together.",
          icon("ladybug", "A ladybug"),
          "I add 3 ladybugs and 2 ladybugs.",
          { pron: "ad" },
        ),
        entry(
          "total",
          "total",
          "noun",
          "How many in all.",
          icon("bee", "A bee"),
          "The total is 5 bees.",
          { pron: "TOH-tul" },
        ),
        entry(
          "more",
          "more",
          "adjective",
          "A bigger number of things.",
          icon("ant", "An ant"),
          "5 is more than 3.",
          { pron: "mor", es: { word: "más", def: "Una cantidad mayor.", verified: true } },
        ),
        entry(
          "fewer",
          "fewer",
          "adjective",
          "A smaller number of things.",
          icon("snail", "A snail"),
          "3 is fewer than 5.",
          { pron: "FYOO-er" },
        ),
        entry(
          "equal",
          "equal",
          "adjective",
          "The same amount.",
          icon("star", "A star"),
          "2 and 2 are equal.",
          { pron: "EE-kwul" },
        ),
      ],
    },
    lesson: {
      id: "fx-g1-math-add",
      title: "Add to 10",
      grade: "1",
      subject: "math",
      standards: ["1.OA.A.1"],
      source: "Original - The Language Page",
      contentObjective: "I can add two groups to find how many in all.",
      languageObjective: "I can say a number story using and and in all.",
      wida: { klus: ["Explain"] },
      vocab: { collection: "fx-g1-math-add", ids: ["add", "total", "more", "fewer", "equal"] },
      launch: { visual: icon("ladybug", "A ladybug"), prompts: ["What do you see?"] },
      teach: {
        model: [
          "I have 3 ladybugs. 2 more come. I add 3 and 2.",
          "3 and 2 make 5. The total is 5.",
          "Say it: 3 and 2 is 5 in all.",
        ],
      },
      guided: [
        {
          id: "g1",
          prompt: "There are 5 ladybugs on a leaf. 3 more come. How many ladybugs in all?",
          answer: "8",
          hint: "Count on from 5.",
          explain: "5 + 3 = 8.",
          supports: {},
          visual: icon("ladybug", "Ladybugs on a leaf"),
        },
        {
          id: "g2",
          prompt: "There are 4 bees. 4 more bees come. How many bees in all?",
          answer: "8",
          explain: "4 + 4 = 8.",
          supports: {},
          visual: icon("bee", "Bees"),
        },
      ],
      collaborate: {
        task: "Tell your partner a number story about ladybugs.",
        discussionCards: [
          { prompt: "Tell a number story about bees.", frame: "There are ______ and ______ more." },
        ],
      },
      independent: {
        items: [
          {
            id: "i1",
            type: "choice",
            prompt: "2 ants and 3 ants. How many in all?",
            choices: ["4", "5", "6"],
            answer: "5",
            explain: "2 + 3 = 5.",
            visual: icon("ant", "Ants"),
          },
          {
            id: "i2",
            type: "choice",
            prompt: "Which is more, 6 or 4?",
            choices: ["6", "4"],
            answer: "6",
            explain: "6 is more than 4.",
          },
          {
            id: "i3",
            type: "short",
            prompt: "1 snail and 6 snails. How many in all?",
            answer: "7",
            explain: "1 + 6 = 7.",
            visual: icon("snail", "Snails"),
          },
        ],
      },
      formative: {
        items: [
          {
            id: "f1",
            type: "short",
            prompt: "3 stars and 3 stars. How many in all?",
            answer: "6",
            explain: "3 + 3 = 6.",
          },
        ],
      },
      exitTicket: {
        prompt: "Check",
        items: [
          {
            id: "e1",
            type: "short",
            prompt: "2 and 4 make how many?",
            answer: "6",
            explain: "2 + 4 = 6.",
          },
        ],
      },
      answerKey: { notes: "Accept counting on or counting all.", items: {} },
      teacherNotes: {
        misconceptions: ["Students count the first group again instead of counting on."],
      },
    },
  },
};

/** Input for buildDocument from a fixture band. */
export const fixtureInput = (band, extra = {}) => {
  const f = FIXTURES[band];
  return {
    grade: f.grade,
    subject: f.subject,
    lesson: f.lesson,
    vocab: f.vocab,
    tiers: ["dev"],
    visual: "full",
    lang: "en",
    cover: true,
    format: { size: "letter", orientation: "portrait" },
    ...extra,
  };
};

// Stand-in for core/visuals.js renderVisual: real icons, simple diagrams for the other kinds. Plain hex colours only.
const INK = "#182230";
const BRAND = "#1e3a5f";
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
export function stubRenderVisual(spec) {
  const w = spec.w || 480;
  const h = spec.h || 320;
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img"><title>${esc(spec.alt)}</title><desc>${esc(spec.longDesc || spec.alt)}</desc>`;
  if (spec.kind === "icon")
    return `${head}${renderIcon(spec.name, { size: Math.min(w, h) })
      .replace(/^<svg[^>]*>/, `<g transform="translate(${(w - h) / 2} 0) scale(${h / 64})">`)
      .replace(/<\/svg>$/, "</g>")}</svg>`;
  if (spec.kind === "tape") {
    const total = spec.parts.reduce((a, p) => a + p.units, 0);
    let x = 20;
    const bar = spec.parts.map((p) => {
      const pw = ((w - 40) * p.units) / total;
      const r = `<rect x="${x}" y="110" width="${pw}" height="80" fill="#e1f2ef" stroke="${BRAND}" stroke-width="3"/><text x="${x + pw / 2}" y="160" text-anchor="middle" font-size="26" fill="${INK}">${esc(p.label)}</text>`;
      x += pw;
      return r;
    });
    return `${head}${bar.join("")}</svg>`;
  }
  if (spec.kind === "table") {
    const cols = spec.head.length;
    const cw = (w - 40) / cols;
    const cells = [spec.head, ...spec.rows]
      .map((row, ri) =>
        row
          .map(
            (c, ci) =>
              `<rect x="${20 + ci * cw}" y="${20 + ri * 50}" width="${cw}" height="50" fill="${ri ? "#fff" : "#f2efe9"}" stroke="${BRAND}" stroke-width="2"/><text x="${20 + ci * cw + cw / 2}" y="${52 + ri * 50}" text-anchor="middle" font-size="24" fill="${INK}">${esc(c)}</text>`,
          )
          .join(""),
      )
      .join("");
    return `${head}${cells}</svg>`;
  }
  if (spec.kind === "cycle") {
    const n = spec.stages.length;
    const pts = spec.stages.map((s, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      const x = w / 2 + 130 * Math.cos(a);
      const y = h / 2 + 100 * Math.sin(a);
      return `<circle cx="${x}" cy="${y}" r="38" fill="#e1f2ef" stroke="${BRAND}" stroke-width="3"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" fill="${INK}">${esc(s.label.slice(0, 9))}</text>`;
    });
    return `${head}${pts.join("")}</svg>`;
  }
  return `${head}<rect x="10" y="10" width="${w - 20}" height="${h - 20}" fill="none" stroke="${INK}" stroke-width="3"/></svg>`;
}

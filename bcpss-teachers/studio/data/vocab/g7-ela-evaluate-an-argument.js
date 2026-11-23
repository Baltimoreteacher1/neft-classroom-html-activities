// Vocabulary for "Evaluate an Argument" (grade 7 ELA). Original definitions and examples; every picture is a visual-kit spec.
const rect = (x, y, w, h, fill = "paper", stroke = "navy", sw = 2.5) => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 10,
  fill,
  stroke,
  sw,
});
const txt = (x, y, text, o = {}) => ({
  t: "text",
  x,
  y,
  text,
  size: 14,
  fill: "ink",
  weight: 700,
  anchor: "middle",
  ...o,
});
const wrap = (s, w, size) => {
  if (s.includes("\n")) return s;
  const max = Math.max(6, Math.floor((w - 14) / (size * 0.6)));
  const out = [];
  let cur = "";
  for (const word of s.split(" ")) {
    if (cur && `${cur} ${word}`.length > max) {
      out.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  out.push(cur);
  return out.join("\n");
};
const box = (x, y, w, h, text, fill = "paper", size = 14, stroke = "navy") => [
  rect(x, y, w, h, fill, stroke),
  txt(x + w / 2, y + h / 2, wrap(text, w, size), { size }),
];
const line = (x1, y1, x2, y2, o = {}) => ({
  t: "line",
  x1,
  y1,
  x2,
  y2,
  stroke: "ink",
  strokeWidth: 2.5,
  ...o,
});
const tip = (x, y, dir) => ({
  t: "poly",
  fill: "ink",
  points:
    dir === "up"
      ? [
          [x, y],
          [x - 7, y + 12],
          [x + 7, y + 12],
        ]
      : dir === "down"
        ? [
            [x, y],
            [x - 7, y - 12],
            [x + 7, y - 12],
          ]
        : dir === "left"
          ? [
              [x, y],
              [x + 12, y - 7],
              [x + 12, y + 7],
            ]
          : [
              [x, y],
              [x - 12, y - 7],
              [x - 12, y + 7],
            ],
});
const shapes = (alt, items, h = 250, extra = {}) => ({
  kind: "shapes",
  alt,
  w: 480,
  h,
  items: items.flat(Infinity),
  ...extra,
});
const entry = (e) => ({ tier: 2, domains: ["Reading", "Speaking", "Writing"], klu: "Argue", ...e });

export default {
  id: "g7-ela-evaluate-an-argument",
  title: "Evaluate an argument: claims, evidence and reasoning",
  grade: "7",
  band: "6-8",
  subject: "ela",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.7.8, RI.7.1 and W.7.1; not mapped to a district unit sequence. Words, examples and pictures are original.",
  },
  standards: ["RI.7.8", "RI.7.1", "W.7.1"],
  entries: [
    entry({
      id: "claim",
      word: "claim",
      pos: "noun",
      pron: "klaym",
      def: "The position a writer wants readers to accept, which can be argued for or against.",
      visual: shapes(
        "A staircase of three boxes. At the top is the claim: our school should start a recess period. Below it are reasons and below those is evidence, with arrows showing that reasons and evidence hold the claim up.",
        [
          box(90, 8, 300, 56, "Claim: our school should add a daily recess", "teal-soft", 14),
          box(40, 100, 180, 54, "Reason: students focus better after a break", "sky", 12),
          box(260, 100, 180, 54, "Reason: movement supports health", "sky", 12),
          box(40, 188, 180, 52, "Evidence: survey of 200 students", "copper-soft", 12),
          box(260, 188, 180, 52, "Evidence: a daily schedule comparison", "copper-soft", 12),
          line(130, 100, 200, 66),
          tip(202, 64, "up"),
          line(350, 100, 280, 66),
          tip(278, 64, "up"),
          line(130, 188, 130, 156),
          tip(130, 154, "up"),
          line(350, 188, 350, 156),
          tip(350, 154, "up"),
        ],
        256,
      ),
      context: "The claim of the editorial is that the school should add a daily recess.",
      nonExample:
        "Recess is a break in the school day is a fact, not a claim, because no one needs to argue about it.",
      academicSentence: "A claim must be arguable, so a reasonable person could disagree with it.",
      es: {
        word: "afirmación",
        def: "La postura que el escritor quiere que el lector acepte.",
        verified: false,
      },
      misconception: "Students copy a fact from the text and call it the claim.",
      related: ["reason", "evidence", "counterclaim"],
      practice: {
        visualPrompt: "Which box holds the claim? What holds it up?",
        speakWrite:
          "Say a claim about school lunch that a classmate could disagree with, then write it.",
        retrieval: "Which word names the position a writer wants readers to accept?",
      },
    }),
    entry({
      id: "reason",
      word: "reason",
      pos: "noun",
      pron: "REE-zun",
      def: "A statement that explains why the claim is true or why readers should accept it.",
      visual: shapes(
        "A claim box on the left says we should keep the library open at lunch. Two arrows labelled because lead from reason boxes on the right: students need a quiet place, and few other spaces offer computers.",
        [
          box(10, 85, 170, 80, "Claim: keep the library open at lunch", "teal-soft", 13),
          box(300, 30, 170, 70, "Reason 1: students need a quiet place to work", "sky", 12),
          box(300, 150, 170, 70, "Reason 2: few other rooms have computers", "sky", 12),
          line(298, 65, 184, 115),
          tip(182, 116, "left"),
          line(298, 185, 184, 135),
          tip(182, 134, "left"),
          txt(240, 78, "because", { size: 12, weight: 400 }),
          txt(240, 190, "because", { size: 12, weight: 400 }),
        ],
        250,
      ),
      context: "One reason for the recess claim is that students concentrate better after a break.",
      nonExample:
        "Recess is good is not a reason, because it repeats the claim without explaining why.",
      academicSentence:
        "A reason answers the question why, and the evidence then shows that the reason is true.",
      es: {
        word: "razón",
        def: "Una explicación de por qué el lector debe aceptar la afirmación.",
        verified: false,
      },
      misconception: "Students restate the claim in different words and treat it as a reason.",
      related: ["claim", "evidence"],
      practice: {
        visualPrompt: "Follow each because arrow. What does each reason explain?",
        speakWrite: "Give a claim and two reasons using the word because.",
        retrieval: "Which word names a statement that explains why a claim is true?",
      },
    }),
    entry({
      id: "evidence",
      word: "evidence",
      pos: "noun",
      pron: "EV-ih-dents",
      def: "Facts, statistics, examples or expert statements that show a reason is true.",
      visual: {
        kind: "table",
        alt: "A table of three kinds of evidence with an example of each. A statistic: 78 of 120 students said they would visit. An expert statement: the librarian reports she supervised alone. An example: during the trial, 64 students visited each day.",
        w: 480,
        h: 190,
        head: ["Kind of evidence", "Example"],
        rows: [
          ["Statistic", "78 of 120 students said they would visit weekly."],
          ["Expert statement", "The librarian reported supervising alone."],
          ["Specific example", "An average of 64 students visited each day."],
        ],
      },
      context: "The editorial supports its reason with a statistic from a survey of students.",
      nonExample:
        "Everybody knows kids like recess is not evidence, because it gives no fact that can be checked.",
      academicSentence:
        "Strong evidence is specific, checkable and connected to the reason it supports.",
      everyday: "Like showing a photo, a receipt or a score to prove what you say happened.",
      es: {
        word: "evidencia",
        def: "Datos, ejemplos o declaraciones que demuestran que una razón es verdadera.",
        verified: false,
      },
      related: ["relevant", "sufficient", "credible"],
      practice: {
        visualPrompt:
          "Which kind of evidence is a number? Which kind comes from a person with knowledge?",
        speakWrite:
          "Name one piece of evidence that could support the claim that our school needs a longer lunch.",
        retrieval: "Which word names facts, statistics or examples that show a reason is true?",
      },
    }),
    entry({
      id: "relevant",
      word: "relevant",
      pron: "REL-uh-vunt",
      pos: "adjective",
      def: "Directly connected to the claim or reason it is supposed to support.",
      visual: shapes(
        "A claim box in the center says add recess. A solid arrow from a relevant evidence box, students focus better after movement, points to it. A dashed crossed line from an irrelevant box, the cafeteria food is bad, stops short of it.",
        [
          box(170, 90, 140, 70, "Claim: add recess", "teal-soft", 14),
          box(10, 94, 130, 62, "Relevant: focus improves after movement", "copper-soft", 12),
          line(142, 125, 166, 125),
          tip(168, 125, "right"),
          box(340, 94, 130, 62, "Not relevant: cafeteria food is bad", "paper", 12, "coral"),
          line(338, 125, 316, 125, { dash: "5 4", stroke: "coral" }),
          txt(240, 190, "relevant evidence connects to this claim", { size: 12, weight: 400 }),
        ],
        230,
      ),
      context:
        "The sentence about the cafeteria food is true, but it is not relevant to a claim about recess.",
      nonExample: "A true fact about the school bus is not relevant to a claim about the library.",
      academicSentence:
        "Evidence can be true and still not be relevant to the claim it appears beside.",
      es: {
        word: "relevante",
        def: "Directamente relacionado con la afirmación.",
        verified: false,
      },
      misconception:
        "Students accept any true fact as support, even when it is about a different issue.",
      related: ["evidence", "sufficient"],
      practice: {
        visualPrompt:
          "Which box has a line that reaches the claim, and which has a line that stops?",
        speakWrite:
          "Say one fact that is true but not relevant to a claim about a longer school day.",
        retrieval: "Which word means connected to the claim it is supposed to support?",
      },
    }),
    entry({
      id: "sufficient",
      word: "sufficient",
      pron: "suh-FISH-unt",
      pos: "adjective",
      def: "Enough to support the claim; one weak piece of evidence is not sufficient.",
      visual: shapes(
        "Two platforms holding a claim box. On the left a claim rests on a single thin pillar marked one example, and it leans. On the right the claim rests on three pillars marked survey, trial data and expert report, and it stands level.",
        [
          box(20, 30, 180, 44, "Claim", "teal-soft", 14),
          rect(105, 82, 14, 100, "copper-soft", "ink", 2),
          txt(112, 208, "one example: not enough", { size: 12, weight: 400 }),
          line(60, 188, 160, 188),
          box(280, 30, 180, 44, "Claim", "teal-soft", 14),
          rect(300, 82, 14, 100, "copper-soft", "ink", 2),
          rect(364, 82, 14, 100, "copper-soft", "ink", 2),
          rect(428, 82, 14, 100, "copper-soft", "ink", 2),
          txt(370, 208, "three kinds of evidence", { size: 12, weight: 400 }),
          line(290, 188, 450, 188),
        ],
        230,
      ),
      context:
        "One story about a cousin's school is not sufficient to prove that every school should add recess.",
      nonExample:
        "A survey of 200 students, plus trial data, is more than one anecdote, so it is closer to sufficient.",
      academicSentence:
        "Evidence is sufficient when there is enough of it, from enough different sources, to support the claim.",
      es: {
        word: "suficiente",
        def: "Que hay evidencia en cantidad adecuada para apoyar la afirmación.",
        verified: false,
      },
      morphology: { parts: [{ part: "suffic-", meaning: "Latin sufficere, to be enough" }] },
      related: ["relevant", "anecdote", "hasty-generalization"],
      practice: {
        visualPrompt: "Which claim is better supported, and how can you tell?",
        speakWrite: "Explain why one example is not sufficient for a claim about a whole school.",
        retrieval: "Which word means there is enough evidence to support a claim?",
      },
    }),
    entry({
      id: "credible",
      word: "credible",
      pron: "KRED-uh-bul",
      pos: "adjective",
      def: "Believable because the source is informed, fair and shows how it knows what it says.",
      visual: shapes(
        "A vertical checklist of four questions used to judge a source. Who wrote it and what do they know? Why was it written? Is the evidence checkable? Does it consider other views?",
        [
          ...[
            "Who wrote it, and what do they know?",
            "Why was it written?",
            "Can the evidence be checked?",
            "Does it consider other views?",
          ].flatMap((q, i) => [
            rect(40, 12 + i * 58, 400, 46, i % 2 ? "paper" : "sky"),
            { t: "circle", cx: 66, cy: 35 + i * 58, r: 12, fill: "navy", stroke: "paper", sw: 2 },
            txt(66, 35 + i * 58, String(i + 1), { size: 13, fill: "paper" }),
            txt(100, 35 + i * 58, q, { size: 14, anchor: "start", weight: 400 }),
          ]),
        ],
        250,
      ),
      context:
        "A report written by a librarian who counted visitors is more credible than a rumor about library use.",
      nonExample:
        "A post with no author, no date and no source is not credible, even if it sounds confident.",
      academicSentence:
        "A credible source tells readers who made the claim and gives evidence that can be checked.",
      es: {
        word: "creíble",
        def: "Digno de confianza porque la fuente está bien informada.",
        verified: false,
      },
      morphology: {
        parts: [
          { part: "cred-", meaning: "Latin credere, to believe" },
          { part: "-ible", meaning: "able to be" },
        ],
      },
      related: ["bias", "evidence"],
      practice: {
        visualPrompt:
          "Use the four questions on a short text. Which question is hardest to answer?",
        speakWrite:
          "Name two things that make a source credible, then write a sentence using the word.",
        retrieval: "Which word describes a source readers have good reason to trust?",
      },
    }),
    entry({
      id: "anecdote",
      word: "anecdote",
      pron: "AN-ik-dote",
      pos: "noun",
      def: "A short personal story used as evidence, which shows one case and not a pattern.",
      visual: shapes(
        "A comparison. On the left, one student icon with a speech bubble that says my cousin's school added recess. On the right, many student icons under the label survey of 200 students. An arrow points from the one student to a question mark, showing one story cannot prove a pattern.",
        [
          { t: "icon", name: "student", x: 30, y: 60, s: 84 },
          box(18, 18, 140, 40, "My cousin's school", "paper", 12),
          txt(72, 168, "one story", { size: 13 }),
          ...[0, 1, 2, 3, 4].map((i) => ({
            t: "icon",
            name: "student",
            x: 230 + i * 48,
            y: 70,
            s: 44,
          })),
          ...[0, 1, 2, 3, 4].map((i) => ({
            t: "icon",
            name: "student",
            x: 230 + i * 48,
            y: 118,
            s: 44,
          })),
          txt(350, 40, "survey of 200 students", { size: 13 }),
          txt(350, 190, "a pattern across many", { size: 13 }),
          line(190, 110, 214, 110, { dash: "4 4" }),
        ],
        220,
      ),
      context:
        "The writer's story about a cousin's grades is an anecdote, so it cannot prove that recess helps all students.",
      nonExample:
        "A survey of 200 students is not an anecdote, because it reports a pattern across many people.",
      academicSentence:
        "An anecdote can illustrate a claim, but it is not sufficient evidence by itself.",
      es: {
        word: "anécdota",
        def: "Un relato personal corto que muestra un solo caso.",
        verified: false,
      },
      misconception: "Students think a vivid personal story is the strongest evidence.",
      related: ["sufficient", "hasty-generalization"],
      practice: {
        visualPrompt: "Compare the one student and the many students. Which one shows a pattern?",
        speakWrite:
          "Tell a short anecdote about a school rule, then say why it is not enough to prove a claim.",
        retrieval: "Which word names a short personal story used as evidence?",
      },
    }),
    entry({
      id: "counterclaim",
      word: "counterclaim",
      pron: "KOWN-ter-klaym",
      pos: "noun",
      def: "A reasonable opposing position that a careful writer acknowledges and answers.",
      visual: shapes(
        "Two speech bubbles pointing at each other. The left, labelled claim, says add a daily recess. The right, labelled counterclaim, says recess takes time from classes.",
        [
          box(10, 50, 190, 90, "Claim:\nadd a daily recess", "teal-soft", 14),
          box(280, 50, 190, 90, "Counterclaim:\nrecess takes time\nfrom classes", "copper-soft", 14),
          line(204, 85, 274, 85),
          tip(276, 85, "right"),
          line(276, 110, 206, 110),
          tip(204, 110, "left"),
          txt(240, 180, "a fair argument names the other side", { size: 13, weight: 400 }),
        ],
        210,
      ),
      context:
        "The editorial names the counterclaim that recess takes time from classes before it responds.",
      nonExample:
        "A weak insult such as people who disagree do not care is not a counterclaim, because it does not state a reason.",
      academicSentence:
        "A writer who states a counterclaim fairly makes the argument more credible.",
      es: {
        word: "contraargumento",
        def: "Una postura opuesta razonable que el escritor reconoce.",
        verified: false,
      },
      morphology: {
        parts: [
          { part: "counter-", meaning: "against" },
          { part: "claim", meaning: "a position" },
        ],
      },
      related: ["rebuttal", "claim"],
      practice: {
        visualPrompt: "What does the right bubble say? Is it a fair opposing view?",
        speakWrite: "State a counterclaim to the claim that the school day should be longer.",
        retrieval: "Which word names a reasonable opposing view?",
      },
    }),
    entry({
      id: "rebuttal",
      word: "rebuttal",
      pron: "rih-BUT-ul",
      pos: "noun",
      def: "A response that answers a counterclaim with reasons or evidence, not just disagreement.",
      visual: shapes(
        "A three-step flow. Step one acknowledges the counterclaim: some people say recess takes time from classes. Step two responds with evidence: trial classes covered the same lessons. Step three connects back to the claim: so recess is worth the time.",
        [
          box(10, 80, 140, 100, "1. Acknowledge:\nsome say recess\ntakes class time", "copper-soft", 12),
          box(
            170,
            80,
            140,
            100,
            "2. Respond:\ntrial classes still\ncovered every lesson",
            "sky",
            12,
          ),
          box(330, 80, 140, 100, "3. Return:\nso recess is\nworth the time", "teal-soft", 12),
          line(150, 130, 166, 130),
          tip(168, 130, "right"),
          line(310, 130, 326, 130),
          tip(328, 130, "right"),
        ],
        250,
      ),
      context:
        "The writer's rebuttal says classes in the trial still covered every lesson, so recess did not cost learning.",
      nonExample: "That is just wrong is not a rebuttal because it gives no reason or evidence.",
      academicSentence:
        "A strong rebuttal acknowledges the other view fairly and then answers it with evidence.",
      es: {
        word: "refutación",
        def: "Una respuesta que contesta un contraargumento con razones.",
        verified: false,
      },
      related: ["counterclaim", "reason"],
      practice: {
        visualPrompt:
          "Read the three boxes in order. What does the middle box add that disagreement alone does not?",
        speakWrite: "Write a two-sentence rebuttal to the counterclaim that homework is unfair.",
        retrieval: "Which word names an answer to an opposing view, backed by reasons?",
      },
    }),
    entry({
      id: "bias",
      word: "bias",
      pron: "BY-us",
      pos: "noun",
      def: "A one-sided leaning that leads a writer to leave out or twist facts that do not fit.",
      visual: shapes(
        "A balance scale that tips to one side. The heavy side holds facts that favor the writer's view. The light side is nearly empty and labelled facts left out.",
        [
          { t: "line", x1: 240, y1: 40, x2: 240, y2: 190, stroke: "ink", strokeWidth: 5 },
          { t: "line", x1: 120, y1: 84, x2: 360, y2: 56, stroke: "ink", strokeWidth: 5 },
          { t: "line", x1: 120, y1: 84, x2: 90, y2: 140, stroke: "ink", strokeWidth: 2 },
          { t: "line", x1: 120, y1: 84, x2: 150, y2: 140, stroke: "ink", strokeWidth: 2 },
          rect(50, 140, 140, 34, "copper-soft", "ink", 2),
          txt(120, 157, "only favoring facts", { size: 11 }),
          { t: "line", x1: 360, y1: 56, x2: 330, y2: 96, stroke: "ink", strokeWidth: 2 },
          { t: "line", x1: 360, y1: 56, x2: 390, y2: 96, stroke: "ink", strokeWidth: 2 },
          rect(310, 96, 100, 30, "paper", "ink", 2),
          txt(360, 111, "facts left out", { size: 11 }),
          rect(205, 190, 70, 22, "navy", "ink", 2),
        ],
        230,
      ),
      context:
        "An editorial that lists only the benefits of recess and never mentions its costs shows bias.",
      nonExample:
        "Having a position is not bias, because every argument has one. Bias is leaving out or twisting facts.",
      academicSentence: "Bias shows when a text includes only the facts that favor one view.",
      es: {
        word: "sesgo",
        def: "Una inclinación hacia un solo lado que omite hechos.",
        verified: false,
      },
      misconception: "Students call any argument biased because it has an opinion.",
      related: ["credible", "counterclaim"],
      practice: {
        visualPrompt:
          "Which side of the scale has more weight? What is missing from the other side?",
        speakWrite: "Say one way a writer could show bias in a review of a lunch menu.",
        retrieval: "Which word names a one-sided leaning that leaves out facts?",
      },
    }),
    entry({
      id: "hasty-generalization",
      word: "hasty generalization",
      pron: "HAY-stee jen-ur-ul-ih-ZAY-shun",
      pos: "noun",
      def: "A broad conclusion drawn from too few examples.",
      visual: shapes(
        "A flow from a small sample to a huge claim. Three students icons asked lead through an arrow to the claim that everyone agrees. A warning label on the arrow says too few to prove it.",
        [
          ...[0, 1, 2].map((i) => ({ t: "icon", name: "student", x: 22 + i * 54, y: 70, s: 50 })),
          txt(96, 142, "asked 3 students", { size: 13 }),
          line(190, 98, 290, 98, { strokeWidth: 3 }),
          tip(294, 98, "right"),
          txt(240, 74, "too few to prove it", { size: 12, weight: 400 }),
          box(300, 56, 170, 84, "Claim:\nevery student agrees", "copper-soft", 13),
        ],
        200,
      ),
      context: "Asking three friends and then saying everyone agrees is a hasty generalization.",
      nonExample:
        "A survey of 200 students from every grade is not hasty, because it reports on a large, varied sample.",
      academicSentence:
        "A hasty generalization makes a claim about a whole group from a sample that is too small.",
      es: {
        word: "generalización apresurada",
        def: "Una conclusión amplia basada en muy pocos ejemplos.",
        verified: false,
      },
      related: ["sufficient", "anecdote"],
      practice: {
        visualPrompt: "How many students were asked? What does the claim say about?",
        speakWrite:
          "Describe a hasty generalization you have heard, then say what evidence would fix it.",
        retrieval: "Which phrase names a conclusion about a whole group based on too few examples?",
      },
    }),
    entry({
      id: "evaluate",
      word: "evaluate",
      pron: "ih-VAL-yoo-ayt",
      pos: "verb",
      def: "To judge how strong something is by checking it against clear criteria.",
      visual: shapes(
        "A four-step flow for evaluating an argument. Find the claim. Check each piece of evidence for relevance, sufficiency and credibility. Check that the reasoning connects the evidence to the claim. Decide how convincing the argument is overall.",
        [
          box(8, 70, 104, 110, "1. Find the claim", "sky", 12),
          box(126, 70, 104, 110, "2. Check the evidence", "copper-soft", 12),
          box(244, 70, 104, 110, "3. Check the reasoning", "copper-soft", 12),
          box(362, 70, 110, 110, "4. Decide how convincing", "teal-soft", 12),
          line(112, 125, 122, 125),
          tip(124, 125, "right"),
          line(230, 125, 240, 125),
          tip(242, 125, "right"),
          line(348, 125, 358, 125),
          tip(360, 125, "right"),
        ],
        250,
      ),
      context:
        "To evaluate the editorial, check whether each piece of evidence is relevant, sufficient and credible.",
      nonExample:
        "Saying I like it or I do not like it is not evaluating, because it uses no criteria.",
      academicSentence:
        "When you evaluate an argument, you judge its evidence and reasoning, not whether you agree with it.",
      es: {
        word: "evaluar",
        def: "Juzgar qué tan fuerte es algo según criterios claros.",
        verified: false,
      },
      morphology: {
        parts: [
          { part: "e-", meaning: "out" },
          { part: "value", meaning: "worth" },
        ],
      },
      misconception:
        "Students evaluate whether they agree with the claim instead of whether the argument supports it.",
      related: ["relevant", "sufficient", "credible"],
      practice: {
        visualPrompt:
          "Which step lets you say an argument is weak even when you agree with its claim?",
        speakWrite:
          "Evaluate one reason in an argument by saying whether its evidence is relevant, sufficient and credible.",
        retrieval: "Which verb means to judge how strong something is using criteria?",
      },
    }),
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

// Data for the Language Lens: curated academic words, subject technical terms, language-function cues and frames,
// idioms and phrasal verbs, polysemous words, concrete nouns that suggest a picture, and connectors.
// Original lists written for this studio. They are heuristics for teacher planning, not a frequency corpus.

const words = (s) => s.split(/\s+/).filter(Boolean);

/** ~360 high-utility academic words (Tier 2): general words that carry meaning across school subjects. */
export const ACADEMIC_WORDS = words(`
analyze analysis approach appropriate assume assumption aspect assess assessment associate attribute authority available
benefit bias cause category challenge circumstance cite claim classify clarify code coherent collaborate combine
communicate compare comparison compile complex component compose comprehend concept conclude conclusion condition conduct
confirm conflict consequence consider consistent constant constitute construct context contrast contribute controversy
convert convey coordinate core correspond create criteria critical culture data debate decade decline define definition
demonstrate denote depend derive describe design detail detect determine develop device differ dimension diminish discrete
display distinct distribute diverse document domain dominant draft dynamic economy edit element eliminate emerge emphasis
enable encounter enhance ensure environment equate equivalent error establish estimate evaluate eventual evidence evolve
exhibit expand explicit exploit export expose extend external extract factor feature final flexible focus format formula
foundation framework function fundamental generate generalize generation global goal grade guideline highlight hypothesis
identical identify ideology illustrate image impact implement implication imply impose incline include income incorporate
index indicate individual induce infer influence inform initial initiate innovate input insert insight inspect instance
institute integrate integrity intelligent intend interact internal interpret interval invest investigate involve isolate
issue item journal justify label layer lecture legal legislate liberal likewise link locate logic maintain major
manipulate margin maximize mechanism media mediate method migrate minimize minor mode modify monitor motive
mutual negate network neutral nevertheless nonetheless norm notion objective obtain obvious occupy occur offset
ongoing option orient outcome output overall overlap panel paradigm parallel participate partner passive perceive percent
period persist perspective phase phenomenon philosophy physical policy portion positive potential practical precede
precise predict predominant preliminary presume previous primary prime principal principle prior priority proceed process
professional project promote proportion prospect protocol psychology publish purchase pursue qualitative quote radical random
range ratio rational react recover refine region register regulate reinforce reject relate relevant reliable rely remove
require research reside resolve resource respond restore restrict retain reveal revenue reverse revise revolution rigid
role route scenario schedule scheme scope section sector secure seek select sequence series shift significant similar
simulate site sole somewhat source specific specify sphere stable statistic status straightforward strategy stress
structure style submit subsequent subsidy substitute sufficient sum summary summarize supplement survey survive suspend
sustain symbol target task technical technique technology temporary tense terminate text theme theory thereby thesis
topic trace tradition transfer transform transition transmit transport trend trigger ultimate undergo underlie undertake
uniform unify unique utilize valid vary vehicle version via violate virtual visible vision visual volume voluntary whereas widespread
accurate adequate adjacent advocate allocate alter alternative ambiguous apparent arbitrary arrange articulate attempt
capacity cluster commit commodity compensate complement comply concentrate consecutive consist contemporary contradict
convention credible cumulative decrease defend deliberate demonstrate dispute distinguish drastic duration elaborate
eliminate emphasize enormous estimate exceed explicit facilitate hence impartial inevitable inherent insufficient
interpret irrelevant legitimate manifest minimal monitor negotiate norm notable obstacle persuade plausible predict
prejudice principle proportional rationale recur relevant reluctant represent resemble reveal significance sophisticated
spectrum subtle summarize tendency thorough transform underlying valid verify vital
`);

/** Subject technical terms (Tier 3). Multi-word terms are matched as phrases. */
export const SUBJECT_TERMS = {
  math: words(`
    ratio rate proportion equivalent numerator denominator fraction decimal percent integer rational expression equation
    variable coefficient constant term inequality solution evaluate simplify factor multiple prime composite exponent
    base power product quotient sum difference dividend divisor remainder area perimeter volume surface triangle
    quadrilateral rectangle parallelogram trapezoid polygon prism pyramid cylinder cone sphere angle vertex edge face
    parallel perpendicular congruent similar symmetry reflection rotation translation dilation coordinate axis origin
    quadrant slope intercept function domain range graph table plot median mean mode range outlier quartile frequency
    histogram probability outcome event sample population variability deviation distribution estimate approximate
    decompose compose partition array tessellation scale congruence radius diameter circumference sector arc
  `),
  "math-phrases": [
    "unit rate",
    "tape diagram",
    "double number line",
    "ratio table",
    "surface area",
    "number line",
    "absolute value",
    "order of operations",
    "greatest common factor",
    "least common multiple",
    "equivalent ratios",
    "coordinate plane",
    "ordered pair",
    "dot plot",
    "box plot",
    "interquartile range",
    "mean absolute deviation",
    "measure of center",
    "percent of change",
    "scale factor",
    "like terms",
    "distributive property",
    "commutative property",
    "associative property",
    "inverse operation",
    "perfect square",
    "square root",
    "cube root",
    "scientific notation",
    "linear equation",
    "slope-intercept",
    "system of equations",
    "right angle",
    "line segment",
    "place value",
    "unit fraction",
    "mixed number",
    "improper fraction",
    "common denominator",
    "repeating decimal",
  ],
  science: words(`
    cell organism tissue organ system photosynthesis respiration ecosystem habitat population community producer consumer
    decomposer predator prey adaptation inherit trait gene species evolution fossil extinction energy matter atom molecule
    element compound mixture solution solute solvent density mass weight volume temperature pressure force motion velocity
    acceleration friction gravity magnet circuit current voltage conductor insulator wave amplitude frequency wavelength
    reflection refraction absorption heat conduction convection radiation climate weather atmosphere precipitation
    condensation evaporation erosion deposition weathering sediment mineral rock igneous sedimentary metamorphic tectonic
    earthquake volcano orbit rotation revolution eclipse galaxy planet moon hypothesis variable control experiment
    observation inference model prediction independent dependent
  `),
  "science-phrases": [
    "food web",
    "food chain",
    "water cycle",
    "rock cycle",
    "life cycle",
    "natural selection",
    "chemical reaction",
    "physical change",
    "chemical change",
    "states of matter",
    "potential energy",
    "kinetic energy",
    "plate tectonics",
    "scientific method",
    "cause and effect",
    "independent variable",
    "dependent variable",
    "control group",
    "renewable resource",
    "greenhouse effect",
    "carbon dioxide",
    "solar system",
  ],
  "social-studies": words(`
    government democracy republic monarchy constitution amendment legislature executive judicial citizen citizenship
    rights responsibilities election vote federal state local tax law treaty colony colonist settlement migration
    immigration revolution independence empire civilization culture tradition religion trade economy economics
    scarcity resource supply demand market producer consumer export import tariff geography region continent climate
    landform latitude longitude hemisphere map legend scale compass primary secondary source artifact timeline era
    century decade ancient medieval industrial slavery abolition suffrage reform segregation protest conflict treaty
    alliance
  `),
  "social-studies-phrases": [
    "primary source",
    "secondary source",
    "branches of government",
    "checks and balances",
    "bill of rights",
    "supply and demand",
    "natural resources",
    "cause and effect",
    "point of view",
    "civil rights",
    "human rights",
    "city-state",
    "trade route",
    "standard of living",
  ],
  ela: words(`
    character setting plot conflict resolution theme narrator perspective inference evidence claim argument
    counterclaim reasoning summary paraphrase quote citation metaphor simile personification imagery symbolism tone mood
    genre fiction nonfiction poetry stanza verse rhyme rhythm alliteration dialogue figurative literal connotation
    denotation prefix suffix root syllable clause phrase predicate subject noun verb adjective adverb pronoun
    preposition conjunction thesis topic introduction conclusion transition revise edit draft
  `),
  "ela-phrases": [
    "main idea",
    "central idea",
    "text evidence",
    "point of view",
    "text structure",
    "cause and effect",
    "compare and contrast",
    "problem and solution",
    "context clues",
    "figurative language",
    "supporting detail",
    "topic sentence",
    "author's purpose",
    "text feature",
    "narrative arc",
  ],
};

/** Subjects whose technical lists apply. A subject not listed gets only the generic lists. */
export const SUBJECT_LIST_KEYS = {
  math: ["math", "math-phrases"],
  science: ["science", "science-phrases"],
  "social-studies": ["social-studies", "social-studies-phrases"],
  ela: ["ela", "ela-phrases"],
  esol: ["ela", "ela-phrases"],
  interdisciplinary: ["science", "social-studies"],
};

/**
 * Language functions. cues: regex sources (matched case-insensitively against each sentence).
 * taskVerbs: an imperative at the start of a sentence counts double. klu is the closest WIDA Key Language Use (approximate).
 */
export const FUNCTIONS = [
  {
    id: "describe",
    label: "Describe",
    verb: "describe",
    klu: "Inform",
    cues: [
      "\\bdescribe\\b",
      "\\bdescription\\b",
      "\\bobserve[sd]?\\b",
      "\\bnotice\\b",
      "\\bfeatures?\\b",
      "\\bcharacteristics?\\b",
      "\\blooks? like\\b",
      "\\bconsists? of\\b",
      "\\bmade (of|up of)\\b",
      "\\bwhat do you (see|notice)\\b",
    ],
    taskVerbs: ["describe", "observe", "notice", "tell"],
    discourse: "an oral description of at least two details before writing",
    engines: ["visual-match", "language-detective"],
    frames: {
      ee: ["This is a ____. It is ____."],
      dev: ["I see ____. It looks ____ because ____."],
      exp: ["One feature of ____ is ____. Another is ____."],
      br: ["The most noticeable characteristic of ____ is ____, which means ____."],
    },
  },
  {
    id: "define",
    label: "Define",
    verb: "define",
    klu: "Inform",
    cues: [
      "\\bdefine[sd]?\\b",
      "\\bdefinition\\b",
      "\\bmeans\\b",
      "\\bis called\\b",
      "\\brefers? to\\b",
      "\\bis known as\\b",
      "\\bstands for\\b",
    ],
    taskVerbs: ["define"],
    discourse: "say a term, give its meaning in your own words, then an example",
    engines: ["vocab-quest", "visual-match"],
    frames: {
      ee: ["____ means ____."],
      dev: ["____ is a ____ that ____."],
      exp: ["____ refers to ____. An example is ____."],
      br: ["____ is defined as ____, which differs from ____ because ____."],
    },
  },
  {
    id: "identify",
    label: "Identify and label",
    verb: "identify",
    klu: "Inform",
    cues: [
      "\\bidentify\\b",
      "\\blabel\\b",
      "\\bname the\\b",
      "\\bpoint to\\b",
      "\\bcircle\\b",
      "\\bmatch\\b",
      "\\bwhich (one|of)\\b",
    ],
    taskVerbs: ["identify", "label", "name", "circle", "match", "select", "choose", "point"],
    discourse: "point, say the word, and use it in a short phrase",
    engines: ["visual-match", "early-sort"],
    frames: {
      ee: ["This is ____."],
      dev: ["This is a ____. I know because ____."],
      exp: ["The ____ is ____ because it has ____."],
      br: ["I can identify ____ by ____."],
    },
  },
  {
    id: "compare",
    label: "Compare and contrast",
    verb: "compare",
    klu: "Inform",
    cues: [
      "\\bcompare[sd]?\\b",
      "\\bcontrast\\b",
      "\\bsimilar(ity|ities)?\\b",
      "\\bdifferen(t|ce|ces)\\b",
      "\\balike\\b",
      "\\bunlike\\b",
      "\\bin common\\b",
      "\\bwhereas\\b",
      "\\bboth\\b",
      "\\bthan\\b",
      "\\bsame as\\b",
    ],
    taskVerbs: ["compare", "contrast"],
    discourse: "a two-turn partner comparison using a Venn or T-chart",
    engines: ["visual-match", "concept-builder"],
    frames: {
      ee: ["____ and ____ are the same. ____ and ____ are different."],
      dev: ["____ is ____, but ____ is ____."],
      exp: ["Both ____ and ____ are ____; however, ____ is ____ while ____ is ____."],
      br: ["Although ____ and ____ share ____, they differ in that ____."],
    },
  },
  {
    id: "classify",
    label: "Classify and sort",
    verb: "classify",
    klu: "Inform",
    cues: [
      "\\bclassify\\b",
      "\\bcategor(y|ies|ize)\\b",
      "\\bsort(ed)?\\b",
      "\\bgroup(ed|s)?\\b",
      "\\btypes? of\\b",
      "\\bkinds? of\\b",
      "\\bbelongs? (to|in)\\b",
    ],
    taskVerbs: ["classify", "sort", "group", "categorize"],
    discourse: "sort first, then say the rule that defines each group",
    engines: ["visual-match", "early-sort"],
    frames: {
      ee: ["____ goes in this group."],
      dev: ["I put ____ in this group because it ____."],
      exp: ["____ belongs in the group of ____ because it has ____."],
      br: ["Based on ____, I classified ____ as ____ rather than ____."],
    },
  },
  {
    id: "sequence",
    label: "Sequence and order",
    verb: "sequence",
    klu: "Narrate",
    cues: [
      "\\bfirst\\b",
      "\\bsecond\\b",
      "\\bthird\\b",
      "\\bnext\\b",
      "\\bthen\\b",
      "\\bfinally\\b",
      "\\bafter that\\b",
      "\\bafterward\\b",
      "\\bbefore\\b",
      "\\bsteps?\\b",
      "\\bsequence\\b",
      "\\bin order\\b",
    ],
    taskVerbs: ["order", "sequence", "arrange", "list"],
    discourse: "say each step with a sequence word, then retell the whole process",
    engines: ["concept-builder", "conversation-studio"],
    frames: {
      ee: ["First, ____. Then, ____."],
      dev: ["First, ____. Next, ____. Finally, ____."],
      exp: ["Before ____, you must ____. After that, ____."],
      br: ["Once ____ has occurred, the next step is ____, which leads to ____."],
    },
  },
  {
    id: "explain",
    label: "Explain how and why",
    verb: "explain",
    klu: "Explain",
    cues: [
      "\\bexplain\\b",
      "\\bbecause\\b",
      "\\bwhy\\b",
      "\\bhow (does|do|did|can)\\b",
      "\\bcause[sd]?\\b",
      "\\beffect\\b",
      "\\bresults? in\\b",
      "\\bleads? to\\b",
      "\\bdue to\\b",
      "\\btherefore\\b",
      "\\bas a result\\b",
      "\\bso that\\b",
    ],
    taskVerbs: ["explain", "show"],
    discourse: "a two-turn partner explanation: say it, then say why",
    engines: ["concept-builder", "conversation-studio"],
    frames: {
      ee: ["____ happens because ____."],
      dev: ["____ happens because ____. This means ____."],
      exp: ["When ____, ____ happens. This is because ____."],
      br: ["The reason ____ occurs is that ____, which in turn causes ____."],
    },
  },
  {
    id: "justify",
    label: "Justify and argue",
    verb: "justify",
    klu: "Argue",
    cues: [
      "\\bjustify\\b",
      "\\bprove\\b",
      "\\bsupport your\\b",
      "\\bdefend\\b",
      "\\bargue\\b",
      "\\bclaim\\b",
      "\\breasoning\\b",
      "\\bconvince\\b",
      "\\bagree\\b",
      "\\bdisagree\\b",
      "\\bi think\\b",
      "\\bshould\\b",
    ],
    taskVerbs: ["justify", "prove", "defend", "argue", "support", "convince"],
    discourse: "state a claim, give a reason, then answer a partner's question",
    engines: ["argument-builder", "conversation-studio"],
    frames: {
      ee: ["I think ____. I know because ____."],
      dev: ["I think ____ because ____."],
      exp: ["My claim is ____. One reason is ____. This shows ____."],
      br: ["Although some may argue ____, the evidence shows ____ because ____."],
    },
  },
  {
    id: "cite",
    label: "Cite evidence",
    verb: "cite evidence",
    klu: "Argue",
    cues: [
      "\\bcite[sd]?\\b",
      "\\baccording to\\b",
      "\\bthe text (says|states|shows)\\b",
      "\\btext evidence\\b",
      "\\bevidence\\b",
      "\\bquote[sd]?\\b",
      "\\bstates that\\b",
    ],
    taskVerbs: ["cite", "quote", "underline", "highlight"],
    discourse: "point to the exact words, read them aloud, then say what they show",
    engines: ["language-detective", "argument-builder"],
    frames: {
      ee: ["The text says ____."],
      dev: ["The text says ____. This shows ____."],
      exp: ["According to the text, ____. This evidence shows ____."],
      br: ["The author states that ____, which supports the idea that ____."],
    },
  },
  {
    id: "analyze", label: "Analyze and interpret", verb: "analyze", klu: "Explain",
    cues: ["\\banaly[sz]e[sd]?\\b", "\\banalysis\\b", "\\binterpret\\b", "\\bexamine\\b", "\\bpoint of view\\b", "\\bperspective\\b", "\\bprimary source\\b", "\\bpattern\\b", "\\brelationship\\b"],
    taskVerbs: ["analyze", "analyse", "interpret", "examine", "investigate"],
    discourse: "look at the parts, say what each shows, then say what they mean together",
    engines: ["language-detective", "concept-builder"],
    frames: {
      ee: ["I see ____. It shows ____."],
      dev: ["This shows ____ because ____."],
      exp: ["By looking at ____, I notice ____, which suggests ____."],
      br: ["Examining ____ reveals ____, which indicates ____."],
    },
  },
  {
    id: "infer",
    label: "Infer and conclude",
    verb: "infer",
    klu: "Explain",
    cues: [
      "\\binfer(s|red|ence)?\\b",
      "\\bsuggest(s|ed)?\\b",
      "\\bimpl(y|ies|ied)\\b",
      "\\bconclude[sd]?\\b",
      "\\bconclusion\\b",
      "\\bprobably\\b",
      "\\blikely\\b",
      "\\bmust have\\b",
      "\\bit seems\\b",
    ],
    taskVerbs: ["infer", "conclude", "decide"],
    discourse: "combine a clue from the text with what you know, then say your idea",
    engines: ["language-detective"],
    frames: {
      ee: ["I think ____."],
      dev: ["The text says ____. I know ____. So I think ____."],
      exp: ["Based on ____, I can infer that ____."],
      br: ["The evidence suggests that ____, which implies ____."],
    },
  },
  {
    id: "predict",
    label: "Predict",
    verb: "predict",
    klu: "Explain",
    cues: [
      "\\bpredict(s|ed|ion)?\\b",
      "\\bwhat (will|would) happen\\b",
      "\\bexpect(ed)?\\b",
      "\\bforecast\\b",
      "\\bestimate[sd]?\\b",
    ],
    taskVerbs: ["predict", "estimate"],
    discourse: "say a prediction with a reason before testing it",
    engines: ["concept-builder"],
    frames: {
      ee: ["I think ____ will happen."],
      dev: ["I predict ____ because ____."],
      exp: ["If ____, then ____ will probably ____."],
      br: ["Given ____, I predict that ____, because ____."],
    },
  },
  {
    id: "summarize",
    label: "Summarize",
    verb: "summarize",
    klu: "Inform",
    cues: [
      "\\bsummari[sz]e[sd]?\\b",
      "\\bsummary\\b",
      "\\bmain idea\\b",
      "\\bin summary\\b",
      "\\bin conclusion\\b",
      "\\boverall\\b",
      "\\bkey (points?|ideas?)\\b",
    ],
    taskVerbs: ["summarize", "retell", "paraphrase", "restate"],
    discourse: "say the main idea in one sentence, then add two key details",
    engines: ["language-detective", "conversation-studio"],
    frames: {
      ee: ["This is about ____."],
      dev: ["The main idea is ____. One detail is ____."],
      exp: ["This text is mostly about ____. Key details include ____ and ____."],
      br: ["In summary, the author explains that ____, supported by ____."],
    },
  },
  {
    id: "evaluate",
    label: "Evaluate and critique",
    verb: "evaluate",
    klu: "Argue",
    cues: [
      "\\bevaluate\\b",
      "\\bbest\\b",
      "\\bbetter\\b",
      "\\bworse\\b",
      "\\bmost effective\\b",
      "\\bcriteria\\b",
      "\\bcritique\\b",
      "\\bjudge\\b",
      "\\bassess\\b",
      "\\breasonable\\b",
      "\\bvalid\\b",
      "\\bstrongest\\b",
    ],
    taskVerbs: ["evaluate", "critique", "judge", "assess", "rate"],
    discourse: "name the criteria first, then judge against them",
    engines: ["argument-builder"],
    frames: {
      ee: ["____ is better because ____."],
      dev: ["I think ____ is stronger because ____."],
      exp: ["Based on ____, the strongest choice is ____ because ____."],
      br: ["Judged against ____, ____ is more effective than ____ since ____."],
    },
  },
  {
    id: "solve",
    label: "Solve and show work",
    verb: "solve",
    klu: "Explain",
    cues: [
      "\\bsolve\\b",
      "\\bfind\\b",
      "\\bcalculate\\b",
      "\\bcompute\\b",
      "\\bdetermine\\b",
      "\\bsimplify\\b",
      "\\bhow (many|much)\\b",
      "\\bwhat is the (value|total|area|volume|product|sum|difference|quotient|ratio|rate|unit rate)\\b",
    ],
    taskVerbs: ["solve", "find", "calculate", "compute", "determine", "simplify", "write"],
    discourse: "name the strategy, show each step, and say what the answer means",
    engines: ["concept-builder", "escape-challenge"],
    frames: {
      ee: ["First I ____. My answer is ____."],
      dev: ["I solved this by ____. My answer is ____ because ____."],
      exp: ["I used ____ because ____. The answer, ____, means ____."],
      br: ["I chose ____ since ____; verifying by ____ confirms that ____."],
    },
  },
  {
    id: "narrate",
    label: "Retell and narrate",
    verb: "retell",
    klu: "Narrate",
    cues: [
      "\\bretell\\b",
      "\\bstory\\b",
      "\\bcharacter[s]?\\b",
      "\\bsetting\\b",
      "\\bwhat happened\\b",
      "\\bnarrat\\w*\\b",
      "\\bevents?\\b",
    ],
    taskVerbs: ["retell", "tell", "narrate"],
    discourse: "retell in order with who, where, and what happened",
    engines: ["conversation-studio", "language-detective"],
    frames: {
      ee: ["The story is about ____."],
      dev: ["First, ____ happened. Then, ____ happened."],
      exp: ["At the beginning, ____. As the story went on, ____."],
      br: ["The narrative begins with ____ and builds toward ____ when ____."],
    },
  },
];

/** Idioms and figurative phrases with a plain-language gloss. */
export const IDIOMS = [
  ["piece of cake", "very easy"],
  ["rule of thumb", "a rough guide that usually works"],
  ["ballpark", "a rough estimate"],
  ["ballpark figure", "a rough estimate"],
  ["back to square one", "start again from the beginning"],
  ["hit the nail on the head", "say exactly the right thing"],
  ["under the weather", "a little sick"],
  ["by heart", "from memory"],
  ["all of a sudden", "suddenly"],
  ["on the same page", "in agreement"],
  ["the big picture", "the whole idea, not the small parts"],
  ["cut corners", "skip steps to finish faster"],
  ["in the long run", "after a long time"],
  ["on average", "typical, found by combining and sharing out"],
  ["break even", "neither gain nor lose money"],
  ["at stake", "that could be lost or won"],
  ["in a nutshell", "in a few words"],
  ["a grain of salt", "do not fully believe it"],
  ["off the top of your head", "without looking anything up"],
  ["the tip of the iceberg", "only a small visible part of a bigger issue"],
  ["come to terms with", "accept"],
  ["draw a conclusion", "decide using the evidence"],
  ["raise a question", "bring up a question"],
  ["take into account", "think about; include"],
  ["bear in mind", "remember"],
  ["play a role", "have a part in"],
  ["a lot of", "many; much"],
  ["as a matter of fact", "in truth"],
  ["keep track of", "record and follow"],
  ["on the other hand", "from a different point of view"],
  ["in terms of", "when talking about"],
  ["for the most part", "mostly"],
];

/** Phrasal verbs that often block understanding. [phrase regex source, gloss] */
export const PHRASAL_VERBS = [
  ["break(s|ing)? down|broke down", "separate into parts"],
  ["carry(ing|ies)? out|carried out", "do; complete"],
  ["figure(s|d)? out|figuring out", "find the answer"],
  ["work(s|ed|ing)? out", "solve; calculate"],
  ["set(s|ting)? up", "arrange; begin"],
  ["turn(s|ed|ing)? out", "end up; prove to be"],
  ["come(s)? up with|came up with", "think of"],
  ["look(s|ed|ing)? at", "examine"],
  ["point(s|ed|ing)? out", "show; mention"],
  ["find(s|ing)? out|found out", "learn; discover"],
  ["make(s)? up|made up", "form; invent"],
  ["add(s|ed|ing)? up", "total"],
  ["round(s|ed|ing)? off", "estimate to a nearby value"],
  ["take(s|n)? away|took away", "subtract; remove"],
  ["fill(s|ed|ing)? in", "complete"],
  ["talk(s|ed|ing)? over", "discuss"],
  ["carry(ing)? on|carried on", "continue"],
  ["give(s|n)? off|gave off", "release"],
  ["break(s|ing)? up|broke up", "split apart"],
  ["write(s)? down|wrote down", "record"],
  ["cross(es|ed|ing)? out", "mark as removed"],
];

/**
 * Polysemous words: an everyday meaning that competes with the academic one.
 * subjects: subjects where the academic sense is expected. academic/everyday are plain-language senses.
 */
export const POLYSEMY = [
  {
    w: "table",
    s: ["math", "science", "ela"],
    a: "an arrangement of data in rows and columns",
    e: "a piece of furniture",
  },
  {
    w: "base",
    s: ["math", "science"],
    a: "the bottom face of a shape, the number a power is built on, or a chemical that is not an acid",
    e: "the bottom or starting place; a military or baseball base",
  },
  {
    w: "product",
    s: ["math", "social-studies"],
    a: "the answer to a multiplication, or something made for sale",
    e: "an item in a store",
  },
  {
    w: "volume",
    s: ["math", "science"],
    a: "the amount of space inside a solid",
    e: "how loud a sound is; a book",
  },
  {
    w: "degree",
    s: ["math", "science"],
    a: "a unit for angles or temperature",
    e: "a college diploma; how much of something",
  },
  {
    w: "power",
    s: ["math", "science", "social-studies"],
    a: "an exponent; the rate of using energy; authority in government",
    e: "strength; electricity",
  },
  {
    w: "plot",
    s: ["math", "ela"],
    a: "to mark points on a graph, or the events of a story",
    e: "a small piece of land; a secret plan",
  },
  {
    w: "figure",
    s: ["math", "ela"],
    a: "a shape or diagram, or to work something out",
    e: "a person's body; a famous person",
  },
  {
    w: "factor",
    s: ["math"],
    a: "a number that divides another number exactly",
    e: "one thing that affects a result",
  },
  { w: "mean", s: ["math"], a: "the average of a set of numbers", e: "to intend; unkind" },
  {
    w: "range",
    s: ["math", "science"],
    a: "the difference between the greatest and least values",
    e: "a mountain range; a kitchen stove; a variety",
  },
  {
    w: "root",
    s: ["math", "science", "ela"],
    a: "a number that multiplies to a given value, or the base part of a word",
    e: "the part of a plant under the ground",
  },
  {
    w: "square",
    s: ["math"],
    a: "a four-equal-sided shape, or to multiply a number by itself",
    e: "an open area in a town",
  },
  {
    w: "expression",
    s: ["math", "ela"],
    a: "a math phrase with numbers and operations but no equal sign",
    e: "a look on someone's face",
  },
  {
    w: "term",
    s: ["math", "ela"],
    a: "a part of an expression, or a word with a special meaning",
    e: "a school term; a length of time",
  },
  {
    w: "order",
    s: ["math"],
    a: "the arrangement of numbers or steps (order of operations)",
    e: "to ask for food; a command",
  },
  {
    w: "operation",
    s: ["math"],
    a: "adding, subtracting, multiplying or dividing",
    e: "a medical surgery",
  },
  {
    w: "balance",
    s: ["math", "science"],
    a: "to keep both sides of an equation or system equal",
    e: "to stand without falling; the money in an account",
  },
  {
    w: "cell",
    s: ["science", "math"],
    a: "the basic unit of life, or one box in a spreadsheet",
    e: "a small room; a phone",
  },
  {
    w: "force",
    s: ["science"],
    a: "a push or a pull that changes motion",
    e: "to make someone do something",
  },
  {
    w: "matter",
    s: ["science"],
    a: "anything that has mass and takes up space",
    e: "to be important",
  },
  { w: "energy", s: ["science"], a: "the ability to cause change or do work", e: "feeling lively" },
  {
    w: "solution",
    s: ["science", "math"],
    a: "a mixture that is the same throughout, or the answer to an equation",
    e: "an answer to any problem",
  },
  {
    w: "mass",
    s: ["science"],
    a: "the amount of matter in an object",
    e: "a large group; a church service",
  },
  {
    w: "field",
    s: ["science", "math"],
    a: "an area where a force acts, or a set of numbers",
    e: "a grassy area",
  },
  { w: "current", s: ["science"], a: "the flow of electric charge or water", e: "happening now" },
  {
    w: "charge",
    s: ["science"],
    a: "a property of matter that causes electric force",
    e: "the price to pay; to run at someone",
  },
  {
    w: "wave",
    s: ["science"],
    a: "a disturbance that carries energy",
    e: "to move a hand to say hello",
  },
  {
    w: "conduct",
    s: ["science"],
    a: "to let heat or electricity pass through",
    e: "how a person behaves",
  },
  {
    w: "period",
    s: ["science", "social-studies", "math"],
    a: "a length of time, or one full cycle",
    e: "the dot at the end of a sentence; a class period",
  },
  {
    w: "scale",
    s: ["math", "social-studies", "science"],
    a: "the ratio between a drawing and the real thing, or a set of measures",
    e: "a tool for weighing; fish skin",
  },
  {
    w: "revolution",
    s: ["social-studies", "science"],
    a: "a big change in government, or one full orbit around the sun",
    e: "one full turn of a wheel",
  },
  {
    w: "branch",
    s: ["social-studies", "math"],
    a: "a part of government or a part of a diagram",
    e: "a limb of a tree",
  },
  { w: "party", s: ["social-studies"], a: "a political group", e: "a celebration" },
  {
    w: "state",
    s: ["social-studies", "science", "ela"],
    a: "a region of a country, a form of matter, or to say clearly",
    e: "how something is right now",
  },
  {
    w: "right",
    s: ["social-studies", "math"],
    a: "something people are allowed or owed, or a 90 degree angle",
    e: "correct; the opposite of left",
  },
  { w: "bill", s: ["social-studies"], a: "a proposed law", e: "a payment slip; a bird's beak" },
  {
    w: "court",
    s: ["social-studies"],
    a: "a place where laws are decided",
    e: "a place to play basketball",
  },
  {
    w: "colony",
    s: ["social-studies", "science"],
    a: "a settlement ruled by a distant country, or a group of living things",
    e: "a group of ants",
  },
  {
    w: "setting",
    s: ["ela"],
    a: "where and when a story happens",
    e: "a dial position; putting something down",
  },
  {
    w: "character",
    s: ["ela"],
    a: "a person or animal in a story",
    e: "a person's qualities; a written symbol",
  },
  {
    w: "theme",
    s: ["ela"],
    a: "the message about life a text carries",
    e: "a party or room style",
  },
  {
    w: "draft",
    s: ["ela"],
    a: "an early version of writing",
    e: "a current of cold air; being chosen for service",
  },
  { w: "like", s: ["ela"], a: "used in a simile to compare", e: "to enjoy" },
  {
    w: "set",
    s: ["math", "science"],
    a: "a group of numbers or objects",
    e: "to put something down; a TV set",
  },
  {
    w: "plane",
    s: ["math"],
    a: "a flat surface that goes on forever",
    e: "an airplane; a carpenter's tool",
  },
  { w: "face", s: ["math"], a: "a flat surface of a solid", e: "the front of a head" },
  {
    w: "property",
    s: ["math", "science"],
    a: "a rule that is always true, or a feature of a substance",
    e: "land or a building someone owns",
  },
  { w: "even", s: ["math"], a: "divisible by 2", e: "level; also; still" },
  { w: "odd", s: ["math"], a: "not divisible by 2", e: "strange" },
  { w: "mode", s: ["math"], a: "the value that appears most often", e: "a way of doing something" },
  {
    w: "median",
    s: ["math"],
    a: "the middle value of an ordered list",
    e: "a strip dividing a road",
  },
  {
    w: "chord",
    s: ["math"],
    a: "a line segment joining two points on a circle",
    e: "notes played together in music",
  },
  { w: "difference", s: ["math"], a: "the answer to a subtraction", e: "how things are not alike" },
  {
    w: "natural",
    s: ["math", "science"],
    a: "counting numbers, or found in nature",
    e: "normal, as expected",
  },
  { w: "rational", s: ["math"], a: "a number that can be written as a fraction", e: "sensible" },
];

/** Math phrases whose word order does not match the math order, or whose small words carry meaning. */
export const MATH_PHRASES = [
  { re: "\\b(less|fewer|smaller) than\\b", note: "Order reverses: '5 less than 8' is 8 - 5." },
  { re: "\\bsubtracted from\\b", note: "Order reverses: '3 subtracted from 10' is 10 - 3." },
  {
    re: "\\bdivided (by|into)\\b",
    note: "'By' and 'into' point to different divisors: 12 divided by 3 versus 3 divided into 12.",
  },
  {
    re: "\\b(\\d+(\\.\\d+)?%|\\d+/\\d+|half|third|quarter|fraction|percent|\\d+ percent) of\\b",
    note: "'Of' signals multiplication: one half of 12.",
  },
  { re: "\\bper\\b", note: "'Per' means 'for each' and names a rate: 3 miles per hour." },
  { re: "\\bfor every\\b", note: "'For every' names a ratio: 2 red for every 3 blue." },
  {
    re: "\\b(times as (many|much)|as many as)\\b",
    note: "'Times as many' compares by multiplying.",
  },
  { re: "\\bis to\\b", note: "'Is to' states a ratio: 2 is to 3." },
  {
    re: "\\bat least\\b|\\bat most\\b|\\bno more than\\b|\\bno less than\\b",
    note: "Boundary phrases map to inequality symbols.",
  },
  {
    re: "\\bincreased by\\b|\\bdecreased by\\b|\\bdecreased to\\b|\\bincreased to\\b",
    note: "'By' is the amount of change; 'to' is the ending value.",
  },
];

/** Concrete nouns that suggest a picture. [word, category] */
export const CONCRETE = [
  ...words(
    "cat dog bird fish horse cow pig sheep duck frog snake spider ant bee butterfly bear lion tiger elephant rabbit turtle whale shark insect",
  ).map((w) => [w, "animal"]),
  ...words("tree flower leaf seed root stem plant grass fruit vegetable").map((w) => [w, "plant"]),
  ...words(
    "river lake ocean mountain valley island desert forest volcano canyon coast beach glacier cave",
  ).map((w) => [w, "landform"]),
  ...words("sun moon star cloud rain snow wind storm rainbow lightning thunder").map((w) => [
    w,
    "weather",
  ]),
  ...words("heart lung bone muscle brain eye ear hand skin stomach").map((w) => [w, "body"]),
  ...words(
    "school house store hospital bridge road farm factory market library castle pyramid",
  ).map((w) => [w, "place"]),
  ...words(
    "triangle rectangle circle square cube prism pyramid cylinder cone sphere polygon trapezoid",
  ).map((w) => [w, "shape"]),
  ...words("map globe graph chart diagram table timeline compass").map((w) => [
    w,
    "representation",
  ]),
  ...words("magnet battery circuit lever ramp pulley thermometer microscope beaker").map((w) => [
    w,
    "tool",
  ]),
  ...words("cell atom molecule skeleton orbit fossil crystal").map((w) => [w, "science-image"]),
];

/** Words that suggest a specific kind of picture from the visual kit (core/visuals.js). [regex source, kind, advice] */
export const VISUAL_CUES = [
  {
    re: "\\b(ratio|rate|part-to-part|part-to-whole|percent|proportion)\\b",
    kind: "tape",
    advice: "a tape (bar) diagram showing the parts and the whole",
  },
  {
    re: "\\b(number line|fraction|decimal|integer|negative|inequality|absolute value)\\b",
    kind: "numberline",
    advice: "a number line with the key values marked",
  },
  {
    re: "\\b(coordinate|graph|slope|axis|ordered pair|plot)\\b",
    kind: "coord",
    advice: "a labeled coordinate grid",
  },
  {
    re: "\\b(table|frequency|data|survey)\\b",
    kind: "table",
    advice: "a small data table with a title and labeled columns",
  },
  {
    re: "\\b(cycle|life cycle|water cycle|rock cycle|season)\\b",
    kind: "cycle",
    advice: "a cycle diagram with arrows between stages",
  },
  {
    re: "\\b(process|steps?|procedure|sequence|first|then|finally)\\b",
    kind: "flow",
    advice: "a flow of steps with arrows",
  },
  {
    re: "\\b(century|decade|years?|era|ancient|timeline|\\d{3,4})\\b",
    kind: "timeline",
    advice: "a timeline of the events in order",
  },
  {
    re: "\\b(map|region|continent|border|route|north|south|east|west|latitude|longitude)\\b",
    kind: "map",
    advice: "a simple map with a key",
  },
  {
    re: "\\b(compare|contrast|both|similar|different)\\b",
    kind: "venn",
    advice: "a Venn diagram for the two ideas",
  },
  {
    re: "\\b(parts? of|label|structure|diagram|organ|cell|anatomy)\\b",
    kind: "labeled",
    advice: "a labeled diagram of the parts",
  },
  {
    re: "\\b(bar graph|bar chart|pictograph|compare amounts|how many)\\b",
    kind: "bars",
    advice: "a bar graph or pictograph of the amounts",
  },
];

/** Connectors by discourse purpose; used to name the discourse moves a text expects. */
export const CONNECTORS = {
  contrast: [
    "however",
    "although",
    "whereas",
    "while",
    "but",
    "on the other hand",
    "in contrast",
    "yet",
    "even though",
    "despite",
    "unlike",
  ],
  cause: [
    "because",
    "since",
    "therefore",
    "as a result",
    "so",
    "due to",
    "consequently",
    "thus",
    "leads to",
    "results in",
  ],
  sequence: [
    "first",
    "next",
    "then",
    "finally",
    "after",
    "before",
    "meanwhile",
    "later",
    "afterward",
    "once",
  ],
  addition: ["also", "in addition", "furthermore", "moreover", "as well as", "another"],
  example: ["for example", "for instance", "such as", "including", "like"],
  conclusion: ["in conclusion", "overall", "in summary", "to sum up", "as a result"],
  condition: ["if", "unless", "otherwise", "provided that", "as long as", "whenever"],
};

/** Subordinators and relative words used to count clauses. */
export const SUBORDINATORS = [
  "because",
  "although",
  "though",
  "even though",
  "since",
  "while",
  "whereas",
  "when",
  "whenever",
  "if",
  "unless",
  "until",
  "after",
  "before",
  "once",
  "as soon as",
  "so that",
  "which",
  "who",
  "whom",
  "whose",
  "where",
  "wherever",
  "whether",
  "than",
  "as long as",
];

export const FUNCTION_WORDS = new Set(
  words(`
  a an the this that these those each every some any no all both either neither of in on at by for with from to into
  onto over under between among through during about against across around as than like per via and or but nor so yet
  is are was were be been being am has have had do does did can could will would shall should may might must
  it its they them their he she him her his hers we us our you your i me my not
`),
);
export const VERB_BREAKS = new Set(
  words(`
  is are was were be been being has have had do does did can could will would shall should may might must
  and but or nor so yet that which who whom whose because although though while whereas when if unless until
`),
);

export const PRONOUNS = new Set(
  words("it its they them their this that these those he she him her his hers"),
);
export const AGENTLESS_PARTICIPLES = new Set(
  words(
    "made given shown found done taken seen written built drawn held kept told known called used chosen grown broken begun set put cut",
  ),
);
export const NOMINALIZATION_SKIP = new Set(
  words(
    "question questions mention nation station section action position condition addition subtraction multiplication division fraction solution equation operation direction information instruction education",
  ),
);

// Original practice items for the three scaffold tools on the student path (/scaffold/<tool>).
// Written for EduWonderLab: grade 3–5 and 6–8 academic topics, one item per Key Language Use per band per
// tool. Each item names its target, carries the evidence a correct response must show (`answer` is used
// only by the checker and the tests, never rendered), and its hint asks a question instead of giving the
// answer. `tools/access-path.test.mjs` proves every answer passes its own checker and that no feedback,
// hint or frame states it. Content is English practice; the interface around it is English and Spanish.

import { EVIDENCE_ITEMS } from "./scaffold-evidence-items.js";
import { SENTENCE_ITEMS } from "./scaffold-sentence-items.js";

export { EVIDENCE_ITEMS, SENTENCE_ITEMS };
export const SCAFFOLD_VERSION = "2026-11-05.1";

/** The three tools. Ids match the readiness task kinds (src/lang/readiness.js TASK_KINDS). */
export const TOOLS = Object.freeze({
  "sentence-architecture": {
    name: ["Sentence Architecture", "Arquitectura de oraciones"],
    blurb: [
      "Build a sentence from parts, then grow it with a connector.",
      "Construye una oración por partes y amplíala con un conector.",
    ],
    icon: "writing",
    domain: "Writing",
  },
  "evidence-builder": {
    name: ["Evidence Builder", "Constructor de evidencia"],
    blurb: [
      "Pick the evidence that really supports a claim and connect it.",
      "Elige la evidencia que de verdad apoya una afirmación y conéctala.",
    ],
    icon: "evidence",
    domain: "Writing",
  },
  "language-upgrade": {
    name: ["Language Upgrade Lab", "Laboratorio para mejorar el lenguaje"],
    blurb: [
      "Turn an everyday sentence into precise academic language.",
      "Convierte una oración cotidiana en lenguaje académico preciso.",
    ],
    icon: "bulb",
    domain: "Writing",
  },
});

/** Connector tiles for Sentence Architecture and the job each one does. */
export const SENTENCE_CONNECTORS = Object.freeze({
  because: "gives a reason",
  so: "tells a result",
  however: "shows a contrast",
  which: "adds more about the thing just named",
});

/** Connector choices for Evidence Builder and the job each one does. */
export const EVIDENCE_CONNECTORS = Object.freeze({
  "For example,": "introduces an example that supports the claim",
  "The evidence shows that": "points to proof for the claim",
  "However,": "shows a contrast, so it argues against the claim",
  "Instead,": "replaces an idea, so it does not add support",
});

const u = (
  id,
  band,
  use,
  topic,
  informal,
  prompt,
  avoid,
  precision,
  connectors,
  minAdded,
  frame,
  hint,
  answer,
) => ({
  id,
  tool: "language-upgrade",
  band,
  use,
  topic,
  informal,
  prompt,
  avoid,
  precision,
  connectors,
  minAdded,
  frame,
  hint,
  answer,
  target: "Add a detail, use a precise word, and connect two ideas.",
});
const LINKS = [
  "because",
  "so",
  "which",
  "since",
  "as a result",
  "although",
  "however",
  "when",
  "after",
];

export const UPGRADE_ITEMS = Object.freeze([
  u(
    "lu35-explain-plants",
    "3-5",
    "Explain",
    "Plant science",
    "Plants need stuff.",
    "Revise this for a science journal.",
    ["stuff"],
    ["sunlight", "water", "soil", "air", "nutrients", "roots", "leaves"],
    LINKS,
    4,
    "Plants need ___ and ___ because ___.",
    "What exactly do plants take in? Name it instead of saying a general word.",
    "Plants need sunlight, water and soil because they use them to make food and grow.",
  ),
  u(
    "lu35-argue-recess",
    "3-5",
    "Argue",
    "School day",
    "Recess is good.",
    "Revise this so it convinces the principal.",
    ["good"],
    ["healthy", "exercise", "energy", "focus", "helpful", "friends"],
    LINKS,
    4,
    "Recess is ___ because ___.",
    "Why does recess matter? Choose a word that says exactly how it helps.",
    "Recess is helpful because students get exercise and come back to class ready to focus.",
  ),
  u(
    "lu35-inform-whales",
    "3-5",
    "Inform",
    "Ocean animals",
    "Whales are really big.",
    "Revise this for a fact card about whales.",
    ["really", "big"],
    ["enormous", "mammals", "ocean", "feet", "breathe", "heavy", "length"],
    LINKS,
    4,
    "Blue whales are ___, which ___.",
    "How big, exactly? Use a number or a precise word, and add a second fact.",
    "Blue whales are enormous mammals, which can grow longer than 90 feet.",
  ),
  u(
    "lu35-narrate-park",
    "3-5",
    "Narrate",
    "A story",
    "We went to the park and it was fun.",
    "Revise this so a reader can picture the moment.",
    ["fun", "went"],
    ["raced", "kite", "swings", "picnic", "laughed", "afternoon", "slide"],
    LINKS,
    4,
    "After ___, we ___, so ___.",
    "What did you do at the park? Show it with an action word.",
    "After lunch we raced to the park, so we could fly my new kite before the rain started.",
  ),
  u(
    "lu68-explain-ice",
    "6-8",
    "Explain",
    "Physical science",
    "The ice melted cuz it got hot.",
    "Revise this for a lab report.",
    ["cuz", "got"],
    ["temperature", "degrees", "energy", "absorbed", "thawed", "solid", "liquid", "celsius"],
    LINKS,
    6,
    "The ice ___ because the ___ rose ___.",
    "What measurement would explain the melting? Replace the everyday words with science words.",
    "The ice on the pond thawed because the temperature rose above 0 degrees Celsius for three days.",
  ),
  u(
    "lu68-argue-phones",
    "6-8",
    "Argue",
    "School policy",
    "Phones in class are bad.",
    "Revise this for an opinion essay to the school board.",
    ["bad"],
    [
      "distract",
      "distraction",
      "attention",
      "focus",
      "notifications",
      "harmful",
      "learning",
      "concentration",
    ],
    LINKS,
    6,
    "Phones in class can be ___ because ___.",
    "How exactly do phones affect students? Name the effect precisely.",
    "Phones in class can be harmful because notifications distract students and break their focus during lessons.",
  ),
  u(
    "lu68-inform-volcano",
    "6-8",
    "Inform",
    "Earth science",
    "Volcanoes are big and do a lot of stuff.",
    "Revise this for an informational article.",
    ["big", "a lot of", "stuff"],
    ["magma", "lava", "erupt", "ash", "crust", "gases", "eruption"],
    LINKS,
    6,
    "Volcanoes are ___ in Earth's crust, which ___.",
    "What is a volcano, exactly, and what comes out of it?",
    "Volcanoes are openings in Earth's crust, which release magma, ash and gases when they erupt.",
  ),
  u(
    "lu68-narrate-storm",
    "6-8",
    "Narrate",
    "A memorable day",
    "Then the thing happened and it was crazy.",
    "Revise this so the reader feels the moment.",
    ["thing", "crazy"],
    ["suddenly", "storm", "thunder", "flickered", "power", "lights", "silent", "shouted"],
    LINKS,
    6,
    "Suddenly, ___, so ___.",
    "What exactly happened? Name the event and how people reacted.",
    "Suddenly the storm knocked out the power, so the lights flickered and the whole class went silent.",
  ),
]);

/** Worked models for the "We do it together first" condition: a different topic, so the model never answers the item. */
export const MODELS = Object.freeze({
  "sentence-architecture": {
    text: "The bread dough | rose | in the warm kitchen | because | yeast makes tiny gas bubbles.",
    steps: [
      "Start with WHO or WHAT the sentence is about.",
      "Add what it is or does.",
      "Add a detail: where, when or how.",
      "Choose a connector for the job you need: because (reason), so (result), however (contrast), which (more about it).",
      "Finish with the idea the connector introduces.",
    ],
  },
  "evidence-builder": {
    text: "Claim: Exercise helps students learn. The evidence shows that students who walked before a test remembered more words. (A card about favorite sports would not support it.)",
    steps: [
      "Read the claim and ask: what would prove it?",
      "Keep only cards that give a reason or data for the claim.",
      "Leave out cards that are true but about something else.",
      "Choose a connector that adds support, not one that argues against it.",
    ],
  },
  "language-upgrade": {
    text: "Before: The storm was bad. After: The storm was severe because winds reached 60 miles per hour, which knocked down two trees.",
    steps: [
      "Find the general words (bad, thing, stuff, good, big).",
      "Replace them with precise words.",
      "Add a detail: a number, a place, a time or an example.",
      "Join two ideas with a connector such as because, so or which.",
    ],
  },
});

export const ALL_ITEMS = Object.freeze([...SENTENCE_ITEMS, ...EVIDENCE_ITEMS, ...UPGRADE_ITEMS]);
export const itemsFor = (tool, band) => ALL_ITEMS.filter((i) => i.tool === tool && i.band === band);
export const itemById = (id) => ALL_ITEMS.find((i) => i.id === id) || null;

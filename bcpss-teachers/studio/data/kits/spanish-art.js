// Original illustrations for the grade 5 Spanish pack (vocabulary, activities, lesson launch). All drawn from primitives.
import {
  bubble,
  circle,
  ellipse,
  face,
  heart,
  line,
  nameTag,
  outline,
  path,
  person,
  poly,
  rect,
  spec,
  star,
  text,
} from "./content-special-art.js";

const ground = (y = 292) => rect(0, y, 480, 320 - y, "sage");

export const V = {
  hola: spec("Two children face each other and wave. A speech bubble above one says Hola.", [
    ground(),
    person(150, 292, { s: 1.5, shirt: "teal", pose: "wave", mood: "grin" }),
    person(330, 292, {
      s: 1.5,
      shirt: "coral",
      pose: "wave",
      mood: "grin",
      hair: "#1f1a17",
      skin: "#c08a5a",
    }),
    bubble(120, 22, 150, 56, ["¡Hola!"], { side: "l", size: 30 }),
  ]),

  adios: spec(
    "A child on the right waves goodbye while the sun sets low behind a hill. A speech bubble says Adiós.",
    [
      circle(110, 238, 54, "ochre"),
      ellipse(110, 320, 190, 90, "sage"),
      ellipse(380, 330, 200, 70, "sage"),
      person(340, 292, { s: 1.5, shirt: "navy", pose: "wave", mood: "smile", hair: "#5a3a22" }),
      bubble(220, 30, 170, 58, ["¡Adiós!"], { side: "r", size: 30 }),
    ],
  ),

  mucho: spec("Two children shake hands and smile. A speech bubble says Mucho gusto.", [
    ground(),
    person(160, 292, { s: 1.5, shirt: "sky", pose: "rest", mood: "grin" }),
    person(320, 292, {
      s: 1.5,
      shirt: "ochre",
      pose: "rest",
      mood: "grin",
      hair: "#1f1a17",
      skin: "#9a6a44",
    }),
    line(196, 218, 284, 218, "#e8b98a", 12, { cap: "round" }),
    circle(240, 218, 13, "#e8b98a", { stroke: "ink", sw: 3 }),
    bubble(140, 22, 200, 56, ["¡Mucho gusto!"], { side: "l", size: 26 }),
  ]),

  meLlamo: spec(
    "A paper name tag with a coral header that reads Me llamo and the name Sofía written below.",
    [
      nameTag(90, 60, 300, 200, "Me llamo", "Sofía", { color: "coral", size: 44 }),
      circle(240, 56, 8, "line"),
    ],
  ),

  comoTeLlamas: spec(
    "A child asks a classmate a question. The speech bubble says ¿Cómo te llamas? The classmate holds a blank name tag.",
    [
      ground(),
      person(120, 292, { s: 1.45, shirt: "teal", pose: "point", mood: "smile" }),
      person(360, 292, {
        s: 1.45,
        shirt: "coral",
        pose: "rest",
        mood: "smile",
        hair: "#1f1a17",
        skin: "#c08a5a",
      }),
      rect(334, 214, 52, 30, "paper", { rx: 5, stroke: "ink", sw: 3 }),
      line(342, 234, 378, 234, "line", 2),
      bubble(40, 20, 270, 56, ["¿Cómo te llamas?"], { side: "l", size: 28 }),
    ],
  ),

  tengoAnos: spec("A birthday cake with ten lit candles and the words Tengo 10 años.", [
    rect(110, 170, 260, 110, "rose", { rx: 12, stroke: "ink", sw: 3 }),
    rect(110, 170, 260, 28, "paper", { rx: 12, stroke: "ink", sw: 3 }),
    ...Array.from({ length: 10 }, (_, i) => [
      rect(124 + i * 25, 134, 8, 36, i % 2 ? "teal" : "ochre", { stroke: "ink", sw: 1 }),
      ellipse(128 + i * 25, 124, 5, 8, "coral"),
    ]).flat(),
    ellipse(240, 284, 170, 12, "line"),
    text(240, 244, "Tengo 10 años", { size: 30, weight: "bold" }),
  ]),

  meGusta: spec(
    "A child holds a large heart. Around it are a soccer ball, a paintbrush and a music note: things the child likes. The words Me gusta are printed below.",
    [
      person(130, 270, { s: 1.5, shirt: "teal", pose: "point", mood: "grin" }),
      heart(250, 120, 44, "coral"),
      circle(370, 90, 30, "paper", { stroke: "ink", sw: 3 }),
      poly("370,76 383,86 378,102 362,102 357,86", "ink"),
      line(335, 190, 420, 150, "ochre", 8, { cap: "round" }),
      path("M 335 190 Q 322 200 326 214 Q 340 210 345 198 Z", "navy"),
      path("M 380 230 L 380 270 M 380 230 L 410 238 L 410 276", "none", { stroke: "ink", sw: 5 }),
      ellipse(372, 272, 12, 9, "ink"),
      ellipse(402, 278, 12, 9, "ink"),
      text(300, 306, "Me gusta", { size: 28, weight: "bold" }),
    ],
  ),

  soy: spec(
    "A child points to their own chest. A speech bubble says Soy and then a blank line for a describing word.",
    [
      ground(),
      person(150, 292, { s: 1.6, shirt: "navy", pose: "point", mood: "grin" }),
      bubble(230, 70, 220, 90, ["Soy ______"], { side: "l", size: 32 }),
      text(340, 200, "I am", { size: 22, fill: "teal", weight: "bold" }),
    ],
  ),

  yTu: spec(
    "One child says Me llamo Ana, ¿y tú? and turns toward a second child, who is thinking about a reply.",
    [
      ground(),
      person(120, 292, { s: 1.45, shirt: "teal", pose: "point", mood: "smile" }),
      person(360, 292, {
        s: 1.45,
        shirt: "coral",
        pose: "rest",
        mood: "wow",
        hair: "#1f1a17",
        skin: "#c08a5a",
      }),
      bubble(30, 14, 280, 60, ["Me llamo Ana.", "¿Y tú?"], { side: "l", size: 22 }),
      circle(402, 120, 20, "paper", { stroke: "ink", sw: 3 }),
      text(402, 129, "?", { size: 26, weight: "bold" }),
    ],
  ),

  simpatico: spec("Two friendly children smile at each other with a heart between them.", [
    ground(),
    person(150, 292, { s: 1.5, shirt: "sky", pose: "wave", mood: "grin" }),
    person(330, 292, {
      s: 1.5,
      shirt: "sage",
      pose: "wave",
      mood: "grin",
      hair: "#1f1a17",
      skin: "#9a6a44",
    }),
    heart(240, 120, 28, "coral"),
  ]),

  creativo: spec(
    "A child holds a paint palette and brush. A glowing light bulb above shows a new idea.",
    [
      ground(),
      person(140, 292, { s: 1.5, shirt: "ochre", pose: "rest", mood: "grin" }),
      ellipse(290, 230, 70, 50, "#e8c9a0", { stroke: "ink", sw: 3 }),
      circle(260, 218, 9, "coral"),
      circle(290, 205, 9, "teal"),
      circle(320, 218, 9, "navy"),
      circle(310, 245, 9, "sage"),
      line(340, 190, 405, 140, "ink", 6, { cap: "round" }),
      circle(380, 74, 30, "ochre", { stroke: "ink", sw: 3 }),
      rect(368, 102, 24, 14, "line", { stroke: "ink", sw: 2 }),
      line(380, 22, 380, 34, "ochre", 4),
      line(335, 40, 345, 48, "ochre", 4),
      line(425, 40, 415, 48, "ochre", 4),
    ],
  ),

  divertido: spec("A child in a party hat laughs out loud, with confetti falling around.", [
    ground(),
    person(240, 292, { s: 1.7, shirt: "coral", pose: "wave", mood: "grin" }),
    poly("222,70 258,70 240,24", "teal", { stroke: "ink", sw: 3 }),
    circle(240, 22, 6, "ochre"),
    ...[
      [80, 60, "ochre"],
      [120, 130, "teal"],
      [360, 70, "coral"],
      [400, 140, "navy"],
      [320, 30, "sage"],
      [150, 30, "rose"],
    ].map(([x, y, c]) => rect(x, y, 14, 14, c, { rx: 3 })),
  ]),

  inteligente: spec(
    "A child reads an open book and thinks. A thought cloud above the child shows a star and a gear.",
    [
      ground(),
      person(160, 292, { s: 1.5, shirt: "navy", pose: "rest", mood: "calm" }),
      poly("118,238 160,226 160,266 118,276", "paper", { stroke: "ink", sw: 3 }),
      poly("202,238 160,226 160,266 202,276", "paper", { stroke: "ink", sw: 3 }),
      ellipse(330, 90, 90, 52, "paper", { stroke: "ink", sw: 3 }),
      star(300, 90, 24, "ochre"),
      circle(364, 90, 22, "sky", { stroke: "ink", sw: 3 }),
      circle(364, 90, 8, "paper", { stroke: "ink", sw: 2 }),
      circle(230, 150, 8, "paper", { stroke: "ink", sw: 2 }),
      circle(252, 176, 5, "paper", { stroke: "ink", sw: 2 }),
    ],
  ),

  amable: spec(
    "A child holds out a book to a classmate who looks worried. The speech bubble says ¿Te ayudo?",
    [
      ground(),
      person(120, 292, { s: 1.5, shirt: "sage", pose: "point", mood: "smile" }),
      person(370, 292, {
        s: 1.5,
        shirt: "rose",
        pose: "rest",
        mood: "calm",
        hair: "#1f1a17",
        skin: "#c08a5a",
      }),
      rect(214, 214, 44, 32, "ochre", { rx: 4, stroke: "ink", sw: 3 }),
      bubble(40, 22, 190, 56, ["¿Te ayudo?"], { side: "l", size: 28 }),
    ],
  ),

  /** Sentence-builder strip used in the lesson (see: structure of the four self-description sentences). */
  strips: spec(
    "Four sentence strips stacked in colour: Me llamo, Tengo años, Me gusta, Soy. Each strip shows the Spanish starter and its English meaning.",
    [
      ...[
        ["Me llamo ___.", "My name is ___.", "coral"],
        ["Tengo ___ años.", "I am ___ years old.", "teal"],
        ["Me gusta ___.", "I like ___.", "ochre"],
        ["Soy ___.", "I am ___ (a describing word).", "navy"],
      ].map(([es, en, c], i) => [
        rect(24, 20 + i * 72, 432, 60, c, { rx: 12 }),
        text(44, 48 + i * 72, es, { size: 26, fill: "#ffffff", anchor: "start", weight: "bold" }),
        text(44, 70 + i * 72, en, { size: 16, fill: "#ffffff", anchor: "start" }),
      ]),
    ].flat(),
    { bg: "paper" },
  ),

  /** Two ID badges for the launch routine. */
  badges: spec(
    "Two ID badges. The first reads: Hola, me llamo Sofía. Tengo diez años. Me gusta dibujar. Soy creativa. The second reads: Hola, me llamo Mateo. Tengo once años. Me gusta el fútbol. Soy divertido.",
    [
      nameTag(14, 30, 220, 250, "Hola", "Sofía", { color: "coral", size: 30 }),
      text(124, 196, "Tengo diez años.", { size: 15 }),
      text(124, 218, "Me gusta dibujar.", { size: 15 }),
      text(124, 240, "Soy creativa.", { size: 15 }),
      nameTag(246, 30, 220, 250, "Hola", "Mateo", { color: "teal", size: 30 }),
      text(356, 196, "Tengo once años.", { size: 15 }),
      text(356, 218, "Me gusta el fútbol.", { size: 15 }),
      text(356, 240, "Soy divertido.", { size: 15 }),
    ],
  ),

  /** Adjective endings model: -o for a boy or man, -a for a girl or woman, -e the same for everyone. */
  endings: spec(
    "A table with three rows. Creativo for a boy, creativa for a girl. Divertido for a boy, divertida for a girl. Inteligente for both, with no change.",
    [
      ...[
        ["creativo", "creativa", "coral"],
        ["divertido", "divertida", "teal"],
        ["inteligente", "inteligente", "ochre"],
      ].map(([m, f, c], i) => [
        rect(20, 56 + i * 80, 210, 62, c, { rx: 12 }),
        rect(250, 56 + i * 80, 210, 62, c, { rx: 12 }),
        text(125, 96 + i * 80, m, { size: 26, fill: "#ffffff", weight: "bold" }),
        text(355, 96 + i * 80, f, { size: 26, fill: "#ffffff", weight: "bold" }),
      ]),
      text(125, 34, "boy or man", { size: 18, fill: "navy", weight: "bold" }),
      text(355, 34, "girl or woman", { size: 18, fill: "navy", weight: "bold" }),
    ].flat(),
  ),
};

export { outline };

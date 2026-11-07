// Picture scenes for the K–3 bands, drawn in code from a few flat shapes so the youngest learners get large, clear
// pictures without adding image files to the deploy. Every scene is original EduWonderLab art: a neighborhood with a
// community garden, a school and a park. Content names a scene with `scene: "<id>"`; the validator checks that the
// id exists here (tools/validate-access-lab.mjs) and each scene carries English and Spanish alt text.
// Pure strings, no DOM: Node tools import SCENES to validate content.

const SKY = { day: "#cfe9f6", rain: "#b9c6d3", evening: "#f4d9b8" };
const svg = (title, body, sky = "day") =>
  `<svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}" focusable="false"><title>${title}</title><rect width="640" height="400" fill="${SKY[sky]}"/>${body}</svg>`;

const ground = (y = 300, c = "#9cc97a") =>
  `<rect y="${y}" width="640" height="${400 - y}" fill="${c}"/>`;
const sun = (x = 560, y = 70) => `<circle cx="${x}" cy="${y}" r="38" fill="#f7c948"/>`;
const cloud = (x, y, c = "#fff") =>
  `<g fill="${c}"><circle cx="${x}" cy="${y}" r="26"/><circle cx="${x + 30}" cy="${y - 10}" r="32"/><circle cx="${x + 62}" cy="${y}" r="24"/><rect x="${x}" y="${y}" width="62" height="24"/></g>`;
const rain = () =>
  `<g stroke="#4a78a8" stroke-width="4" stroke-linecap="round">${[60, 150, 240, 330, 420, 510, 600]
    .map(
      (x, i) =>
        `<line x1="${x}" y1="${130 + (i % 2) * 30}" x2="${x - 10}" y2="${160 + (i % 2) * 30}"/><line x1="${x + 40}" y1="${200 + (i % 3) * 20}" x2="${x + 30}" y2="${230 + (i % 3) * 20}"/>`,
    )
    .join("")}</g>`;
// A child or adult: head, body, arms, legs. `hold` draws something in the right hand.
function person(
  x,
  y,
  { shirt = "#2e4a94", skin = "#c58c62", hair = "#3b2a20", tall = 1, hold = "" } = {},
) {
  const s = tall;
  const top = y - 150 * s;
  const items = {
    can: `<g transform="translate(${x + 34 * s} ${y - 78 * s})"><rect width="${30 * s}" height="${22 * s}" rx="4" fill="#5c8fb8"/><path d="M${30 * s} ${4 * s} l${16 * s} ${-10 * s}" stroke="#5c8fb8" stroke-width="${5 * s}"/></g>`,
    umbrella: `<g transform="translate(${x + 30 * s} ${y - 150 * s})"><path d="M-46 0 A46 40 0 0 1 46 0 Z" fill="#c2463d"/><line x1="0" y1="0" x2="0" y2="${70 * s}" stroke="#333" stroke-width="4"/></g>`,
    book: `<rect x="${x + 28 * s}" y="${y - 86 * s}" width="${26 * s}" height="${32 * s}" rx="3" fill="#9a4a26"/>`,
    basket: `<g transform="translate(${x + 26 * s} ${y - 74 * s})"><path d="M0 0 h${40 * s} l-6 ${26 * s} h-${28 * s} Z" fill="#b07a3c"/><circle cx="${12 * s}" cy="-2" r="${7 * s}" fill="#d9442b"/><circle cx="${26 * s}" cy="-3" r="${7 * s}" fill="#d9442b"/></g>`,
    shovel: `<g transform="translate(${x + 30 * s} ${y - 96 * s})"><line x1="0" y1="0" x2="${10 * s}" y2="${80 * s}" stroke="#7a5230" stroke-width="${5 * s}"/><path d="M${2 * s} ${78 * s} h${18 * s} l-${8 * s} ${18 * s} Z" fill="#8d99a6"/></g>`,
    ball: `<circle cx="${x + 46 * s}" cy="${y - 70 * s}" r="${14 * s}" fill="#f08a24"/>`,
  };
  return `<g><circle cx="${x}" cy="${top + 22 * s}" r="${22 * s}" fill="${skin}"/><path d="M${x - 22 * s} ${top + 18 * s} a${22 * s} ${20 * s} 0 0 1 ${44 * s} 0 Z" fill="${hair}"/><rect x="${x - 22 * s}" y="${top + 46 * s}" width="${44 * s}" height="${58 * s}" rx="${12 * s}" fill="${shirt}"/><line x1="${x - 20 * s}" y1="${top + 56 * s}" x2="${x - 38 * s}" y2="${top + 92 * s}" stroke="${skin}" stroke-width="${9 * s}" stroke-linecap="round"/><line x1="${x + 20 * s}" y1="${top + 56 * s}" x2="${x + 36 * s}" y2="${top + 84 * s}" stroke="${skin}" stroke-width="${9 * s}" stroke-linecap="round"/><rect x="${x - 18 * s}" y="${top + 102 * s}" width="${14 * s}" height="${48 * s}" fill="#3d4756"/><rect x="${x + 4 * s}" y="${top + 102 * s}" width="${14 * s}" height="${48 * s}" fill="#3d4756"/>${items[hold] || ""}</g>`;
}
const bed = (x, y = 330, w = 150) =>
  `<rect x="${x}" y="${y}" width="${w}" height="44" rx="6" fill="#7a5230"/><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="18" fill="#5a3b22"/>`;
// Plant growth stages: 0 seed, 1 sprout, 2 leaves, 3 flower, 4 tomatoes.
function plant(x, y, stage) {
  if (stage === 0) return `<ellipse cx="${x}" cy="${y - 4}" rx="8" ry="6" fill="#8a5a2b"/>`;
  const h = [0, 26, 56, 80, 92][stage];
  let out = `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="#3f8a3a" stroke-width="5"/><ellipse cx="${x - 12}" cy="${y - h * 0.55}" rx="13" ry="6" fill="#4fa14a"/><ellipse cx="${x + 12}" cy="${y - h * 0.7}" rx="13" ry="6" fill="#4fa14a"/>`;
  if (stage === 3)
    out += `<circle cx="${x}" cy="${y - h}" r="12" fill="#f2b33d"/><circle cx="${x}" cy="${y - h}" r="5" fill="#9a4a26"/>`;
  if (stage === 4)
    out += `<circle cx="${x - 10}" cy="${y - h + 10}" r="11" fill="#d9442b"/><circle cx="${x + 12}" cy="${y - h + 22}" r="11" fill="#d9442b"/>`;
  return out;
}
const fence = () =>
  `<g fill="#e8dcc4">${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 40 + 6}" y="250" width="22" height="60" rx="4"/>`).join("")}<rect y="268" width="640" height="8"/></g>`;
const tree = (x, y = 300) =>
  `<rect x="${x - 10}" y="${y - 90}" width="20" height="90" fill="#7a5230"/><circle cx="${x}" cy="${y - 120}" r="52" fill="#4f9a45"/>`;
const house = (x, c = "#e9a87c") =>
  `<rect x="${x}" y="190" width="130" height="110" fill="${c}"/><path d="M${x - 10} 192 L${x + 65} 130 L${x + 140} 192 Z" fill="#8a3a5c"/><rect x="${x + 50}" y="240" width="32" height="60" fill="#5a3b22"/><rect x="${x + 14}" y="212" width="28" height="24" fill="#fdf6e3"/>`;
const table = (x, y) =>
  `<rect x="${x}" y="${y}" width="220" height="14" fill="#b07a3c"/><rect x="${x + 14}" y="${y + 14}" width="12" height="70" fill="#8a5a2b"/><rect x="${x + 194}" y="${y + 14}" width="12" height="70" fill="#8a5a2b"/>`;

const kid = { shirt: "#2e4a94" };
const kid2 = { shirt: "#c2463d", skin: "#8d5a3b", hair: "#1e1410" };
const kid3 = { shirt: "#3f8a3a", skin: "#e2b48f", hair: "#7a4a1e" };
const grown = { shirt: "#075568", skin: "#a8704a", hair: "#9aa0a6", tall: 1.25 };

const DRAW = {
  garden: () =>
    ground() +
    sun() +
    cloud(80, 70) +
    fence() +
    bed(40) +
    bed(250) +
    bed(460) +
    [80, 130, 290, 340, 500, 550].map((x, i) => plant(x, 336, 2 + (i % 3))).join("") +
    person(200, 360, { ...kid, hold: "can" }) +
    person(420, 360, { ...grown, hold: "shovel" }),
  "seed-plant": () =>
    ground(260, "#8a5a2b") +
    sun() +
    person(170, 330, { ...kid2, hold: "shovel" }) +
    plant(330, 300, 0) +
    plant(400, 300, 0) +
    `<path d="M300 300 q30 -20 60 0" fill="none" stroke="#5a3b22" stroke-width="6"/>`,
  "seed-water": () =>
    ground(260, "#8a5a2b") +
    cloud(60, 60) +
    person(200, 330, { ...kid2, hold: "can" }) +
    plant(330, 300, 0) +
    plant(400, 300, 0) +
    `<g stroke="#4a78a8" stroke-width="4" stroke-linecap="round"><line x1="262" y1="250" x2="300" y2="282"/><line x1="268" y1="262" x2="318" y2="290"/></g>`,
  "seed-sprout": () =>
    ground(260, "#8a5a2b") +
    sun() +
    plant(300, 300, 1) +
    plant(380, 300, 1) +
    plant(460, 300, 2) +
    person(160, 330, kid2),
  "seed-flower": () =>
    ground(260, "#8a5a2b") +
    sun() +
    plant(300, 300, 3) +
    plant(380, 300, 3) +
    plant(460, 300, 4) +
    person(160, 330, { ...kid2, hold: "basket" }),
  classroom: () =>
    `<rect width="640" height="400" fill="#f6efe2"/><rect x="150" y="40" width="340" height="150" rx="8" fill="#2f4f45"/><rect y="320" width="640" height="80" fill="#c9a77c"/>` +
    table(60, 280) +
    table(360, 280) +
    `<rect x="100" y="262" width="40" height="18" fill="#2e4a94"/><rect x="420" y="258" width="34" height="22" fill="#9a4a26"/>` +
    person(560, 340, { ...grown, tall: 1.1 }),
  "park-rain": () =>
    cloud(60, 70, "#e4e9ee") +
    cloud(380, 60, "#e4e9ee") +
    ground(300, "#86b06a") +
    tree(520) +
    rain() +
    person(220, 370, { ...kid3, hold: "umbrella" }) +
    `<ellipse cx="380" cy="350" rx="70" ry="12" fill="#7ea4c8"/>`,
  breakfast: () =>
    `<rect width="640" height="400" fill="#fbeedd"/><rect x="420" y="50" width="160" height="120" fill="#cfe9f6" stroke="#fff" stroke-width="8"/>` +
    table(200, 260) +
    `<ellipse cx="260" cy="252" rx="34" ry="10" fill="#fff"/><rect x="330" y="214" width="28" height="44" rx="4" fill="#f2a33d"/><circle cx="388" cy="248" r="12" fill="#d9442b"/>` +
    person(120, 350, kid) +
    person(540, 360, grown),
  "bus-stop": () =>
    `<rect y="300" width="640" height="100" fill="#8d99a6"/><rect y="292" width="640" height="10" fill="#d6dbe0"/>` +
    sun(80, 60) +
    `<rect x="300" y="170" width="300" height="110" rx="18" fill="#f2b33d"/><rect x="320" y="190" width="60" height="40" fill="#cfe9f6"/><rect x="400" y="190" width="60" height="40" fill="#cfe9f6"/><rect x="480" y="190" width="60" height="40" fill="#cfe9f6"/><circle cx="360" cy="282" r="20" fill="#333"/><circle cx="540" cy="282" r="20" fill="#333"/>` +
    `<rect x="210" y="150" width="8" height="150" fill="#555"/><rect x="190" y="130" width="48" height="30" rx="4" fill="#2e4a94"/>` +
    person(130, 300, { ...kid, hold: "book" }),
  library: () =>
    `<rect width="640" height="400" fill="#efe6d6"/>` +
    [40, 230, 420]
      .map(
        (x) =>
          `<rect x="${x}" y="60" width="170" height="220" fill="#8a5a2b"/>${[80, 150, 220].map((y) => `<rect x="${x + 8}" y="${y}" width="154" height="6" fill="#5a3b22"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${x + 12 + i * 24}" y="${y - 44}" width="18" height="44" fill="${["#2e4a94", "#c2463d", "#3f8a3a", "#f2b33d", "#8a3a5c", "#075568"][i]}"/>`).join("")}`).join("")}`,
      )
      .join("") +
    `<rect y="320" width="640" height="80" fill="#c9a77c"/>` +
    person(320, 380, { ...kid3, hold: "book" }),
  market: () =>
    ground(320, "#d6dbe0") +
    sun() +
    `<rect x="120" y="150" width="400" height="30" fill="#c2463d"/><rect x="120" y="180" width="400" height="20" fill="#fff"/><rect x="140" y="230" width="360" height="90" fill="#b07a3c"/>` +
    [170, 230, 290].map((x) => `<circle cx="${x}" cy="222" r="16" fill="#d9442b"/>`).join("") +
    [360, 420, 470]
      .map((x) => `<ellipse cx="${x}" cy="222" rx="22" ry="12" fill="#f2c94c"/>`)
      .join("") +
    person(80, 380, grown) +
    person(580, 380, kid),
  playground: () =>
    ground() +
    sun(80, 60) +
    `<path d="M380 300 L380 150 L420 150 L560 300" fill="none" stroke="#c2463d" stroke-width="10"/><rect x="370" y="140" width="60" height="12" fill="#2e4a94"/>` +
    `<line x1="120" y1="120" x2="120" y2="300" stroke="#555" stroke-width="8"/><line x1="280" y1="120" x2="280" y2="300" stroke="#555" stroke-width="8"/><line x1="110" y1="120" x2="290" y2="120" stroke="#555" stroke-width="8"/><line x1="180" y1="120" x2="180" y2="240" stroke="#333" stroke-width="3"/><line x1="220" y1="120" x2="220" y2="240" stroke="#333" stroke-width="3"/><rect x="172" y="238" width="56" height="10" fill="#7a5230"/>` +
    person(480, 370, { ...kid2, hold: "ball" }),
  "garden-walk": () =>
    ground() +
    sun() +
    house(40) +
    house(460, "#9ec5d9") +
    tree(330) +
    person(260, 370, { ...grown, hold: "basket" }) +
    person(380, 370, { ...kid3, hold: "can" }),
  "garden-share": () =>
    ground() +
    sun() +
    fence() +
    table(210, 280) +
    [250, 290, 330, 370].map((x) => `<circle cx="${x}" cy="270" r="13" fill="#d9442b"/>`).join("") +
    person(120, 370, kid3) +
    person(530, 370, grown) +
    person(460, 370, { ...kid2, hold: "basket" }),
  "lunch-share": () =>
    `<rect width="640" height="400" fill="#f6efe2"/><rect y="320" width="640" height="80" fill="#c9a77c"/>` +
    table(210, 260) +
    `<rect x="240" y="236" width="50" height="24" rx="4" fill="#3f8a3a"/><rect x="340" y="236" width="50" height="24" rx="4" fill="#2e4a94"/><circle cx="318" cy="248" r="10" fill="#d9442b"/>` +
    person(150, 360, kid) +
    person(500, 360, kid2),
  "lost-mitten": () =>
    ground(300, "#eef3f7") +
    cloud(80, 80, "#e4e9ee") +
    tree(520) +
    `<path d="M300 320 q-14 -40 10 -50 q24 -6 26 30 l4 24 Z" fill="#c2463d"/>` +
    person(180, 370, { ...kid3, shirt: "#8a3a5c" }),
};

const ALT = {
  garden: [
    "A community garden. A child waters plants and a grown-up digs with a shovel.",
    "Un huerto comunitario. Una niña riega las plantas y un adulto cava con una pala.",
  ],
  "seed-plant": [
    "A child digs in the dirt and puts seeds in the ground.",
    "Un niño cava en la tierra y pone semillas en el suelo.",
  ],
  "seed-water": [
    "A child pours water on the seeds from a watering can.",
    "Un niño echa agua a las semillas con una regadera.",
  ],
  "seed-sprout": [
    "Small green sprouts grow out of the dirt.",
    "Pequeños brotes verdes salen de la tierra.",
  ],
  "seed-flower": [
    "The plants are tall with yellow flowers and red tomatoes. A child holds a basket.",
    "Las plantas están altas, con flores amarillas y tomates rojos. Un niño lleva una canasta.",
  ],
  classroom: [
    "A classroom with a board, two tables, a book and a teacher.",
    "Un salón de clases con un pizarrón, dos mesas, un libro y una maestra.",
  ],
  "park-rain": [
    "It is raining in the park. A child holds a red umbrella near a puddle.",
    "Llueve en el parque. Una niña tiene un paraguas rojo cerca de un charco.",
  ],
  breakfast: [
    "A family kitchen. There is a bowl, a glass of juice and an apple on the table.",
    "Una cocina familiar. En la mesa hay un tazón, un vaso de jugo y una manzana.",
  ],
  "bus-stop": [
    "A child with a book waits at the bus stop. A yellow bus is coming.",
    "Un niño con un libro espera en la parada. Viene un autobús amarillo.",
  ],
  library: [
    "A library with tall shelves of books. A child holds a book.",
    "Una biblioteca con estantes altos llenos de libros. Una niña tiene un libro.",
  ],
  market: [
    "A fruit stand at the market with red apples and yellow bananas.",
    "Un puesto de frutas en el mercado con manzanas rojas y plátanos amarillos.",
  ],
  playground: [
    "A playground with a swing and a slide. A child holds a ball.",
    "Un patio de juegos con un columpio y un tobogán. Un niño tiene una pelota.",
  ],
  "garden-walk": [
    "A grandpa and a child walk past houses to the garden. He has a basket and she has a watering can.",
    "Un abuelo y una niña caminan entre casas hacia el huerto. Él lleva una canasta y ella una regadera.",
  ],
  "garden-share": [
    "Neighbors share red tomatoes from the garden on a table.",
    "Los vecinos comparten tomates rojos del huerto en una mesa.",
  ],
  "lunch-share": [
    "Two friends eat lunch at a table at school.",
    "Dos amigos almuerzan en una mesa de la escuela.",
  ],
  "lost-mitten": [
    "A red mitten lies in the snow near a tree. A child is looking for it.",
    "Un guante rojo está en la nieve cerca de un árbol. Una niña lo busca.",
  ],
};

/** Scene ids the content may name. */
export const SCENES = Object.keys(DRAW);

/** [english alt, spanish alt] for a scene, or null. */
export const sceneAlt = (id) => ALT[id] || null;

/** The scene as an inline <svg> string (alt in the chosen language), or "" when the id is unknown. */
export function sceneSVG(id, lang = "en") {
  if (!DRAW[id]) return "";
  const [en, es] = ALT[id];
  const sky = id === "park-rain" ? "rain" : "day";
  return svg((lang === "es" ? es : en).replace(/"/g, "&quot;"), DRAW[id](), sky);
}

/** Pepita, the guide: a round seed with a sprout who reads every direction aloud. */
export function guideSVG({ talking = false } = {}) {
  return `<svg class="early-guide-art${talking ? " is-talking" : ""}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><path d="M60 30 q-4 -18 -22 -20 q4 16 22 20 Z" fill="#4fa14a"/><path d="M60 30 q6 -20 26 -18 q-6 16 -26 18 Z" fill="#3f8a3a"/><ellipse cx="60" cy="72" rx="40" ry="42" fill="#c98a4b"/><ellipse cx="60" cy="78" rx="28" ry="26" fill="#e3b07a"/><circle cx="46" cy="64" r="6" fill="#2a1d14"/><circle cx="74" cy="64" r="6" fill="#2a1d14"/><circle cx="48" cy="62" r="2" fill="#fff"/><circle cx="76" cy="62" r="2" fill="#fff"/><ellipse class="early-guide-mouth" cx="60" cy="86" rx="10" ry="5" fill="#8a3a2b"/><circle cx="36" cy="80" r="5" fill="#e98f7a" opacity=".7"/><circle cx="84" cy="80" r="5" fill="#e98f7a" opacity=".7"/></svg>`;
}

export const GUIDE_NAME = "Pepita";

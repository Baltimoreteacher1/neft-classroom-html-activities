// Picture scenes for the K–3 bands, drawn in code from a few flat shapes so the youngest learners get large, clear
// pictures without adding image files to the deploy. Every scene is original EduWonderLab art: a neighborhood with a
// community garden, a school and a park. Content names a scene with `scene: "<id>"`; the validator checks that the
// id exists here (tools/validate-access-lab.mjs) and each scene carries English and Spanish alt text.
// Pure strings, no DOM: Node tools import SCENES to validate content.

const SKY = { day: "#cfe9f6", rain: "#b9c6d3", evening: "#f4d9b8", night: "#26324f" };
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

const snowfall = () =>
  `<g fill="#fff">${[40, 120, 200, 290, 380, 470, 560, 610].map((x, i) => `<circle cx="${x}" cy="${40 + ((i * 53) % 220)}" r="${4 + (i % 3)}"/>`).join("")}</g>`;
const snowman = (x, y) =>
  `<circle cx="${x}" cy="${y - 30}" r="44" fill="#fff"/><circle cx="${x}" cy="${y - 92}" r="30" fill="#fff"/><circle cx="${x - 10}" cy="${y - 98}" r="3" fill="#222"/><circle cx="${x + 10}" cy="${y - 98}" r="3" fill="#222"/><path d="M${x} ${y - 90} l22 4 l-22 4 Z" fill="#f08a24"/>`;

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
  // ── Science, health, math and feelings scenes (publisher content pass) ───────────────────────────────────
  "snow-day": () =>
    ground(290, "#f4f7fa") +
    snowfall() +
    tree(520, 300).replace("#4f9a45", "#dfe8ee") +
    person(200, 370, { shirt: "#c2463d", skin: "#8d5a3b", hair: "#1e1410" }) +
    `<rect x="176" y="224" width="48" height="12" rx="6" fill="#2e4a94"/>` +
    snowman(400, 330),
  "wind-kite": () =>
    ground(300, "#9cc97a") +
    cloud(60, 90) +
    `<path d="M470 300 Q470 230 520 170" fill="none" stroke="#7a5230" stroke-width="18" stroke-linecap="round"/><circle cx="530" cy="150" r="46" fill="#4f9a45"/><circle cx="490" cy="170" r="34" fill="#4f9a45"/>` +
    `<path d="M300 60 l40 40 l-40 40 l-40 -40 Z" fill="#c2463d"/><path d="M300 140 q-30 60 -60 120 q-20 40 -40 60" fill="none" stroke="#555" stroke-width="3"/><path d="M230 70 q40 10 60 40 M360 110 q40 -10 70 20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
    person(180, 372, { ...kid3 }),
  "ice-melt": () =>
    `<rect width="640" height="400" fill="#fbeedd"/><rect x="440" y="40" width="150" height="130" fill="#cfe9f6" stroke="#fff" stroke-width="8"/>${sun(515, 100).replace('r="38"', 'r="30"')}` +
    table(210, 250) +
    `<ellipse cx="270" cy="244" rx="70" ry="16" fill="#e8eef3"/>${[0, 1, 2].map((i) => `<rect x="${236 + i * 34}" y="${208 - (i % 2) * 6}" width="30" height="30" rx="4" fill="#bfe3f4" stroke="#fff" stroke-width="3"/>`).join("")}` +
    `<ellipse cx="400" cy="244" rx="70" ry="16" fill="#e8eef3"/><ellipse cx="400" cy="242" rx="58" ry="10" fill="#7ea4c8"/>` +
    person(110, 380, kid),
  "steam-pot": () =>
    `<rect width="640" height="400" fill="#f6efe2"/><rect y="300" width="640" height="100" fill="#c9a77c"/><rect x="180" y="250" width="280" height="60" rx="8" fill="#6b7480"/>` +
    `<rect x="240" y="190" width="160" height="62" rx="8" fill="#8d99a6"/><rect x="226" y="196" width="14" height="10" rx="4" fill="#555"/><rect x="400" y="196" width="14" height="10" rx="4" fill="#555"/>` +
    `<g fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".9"><path d="M280 170 q-20 -30 0 -50 q20 -22 0 -50"/><path d="M320 170 q-20 -30 0 -50 q20 -22 0 -50"/><path d="M360 170 q-20 -30 0 -50 q20 -22 0 -50"/></g>` +
    person(540, 372, grown),
  "plant-parts": () =>
    `<rect width="640" height="400" fill="#cfe9f6"/><rect y="230" width="640" height="170" fill="#8a5a2b"/>` +
    `<g stroke="#e8dcc4" stroke-width="6" stroke-linecap="round" fill="none"><path d="M320 230 q-10 50 -50 90"/><path d="M320 230 q0 60 0 120"/><path d="M320 230 q10 50 50 90"/><path d="M300 290 q-30 10 -50 0"/></g>` +
    `<line x1="320" y1="230" x2="320" y2="90" stroke="#3f8a3a" stroke-width="12"/><ellipse cx="270" cy="160" rx="42" ry="16" transform="rotate(-25 270 160)" fill="#4fa14a"/><ellipse cx="372" cy="130" rx="42" ry="16" transform="rotate(25 372 130)" fill="#4fa14a"/>` +
    `<g>${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="320" cy="62" rx="12" ry="26" transform="rotate(${a} 320 80)" fill="#f2b33d"/>`).join("")}<circle cx="320" cy="80" r="16" fill="#9a4a26"/></g>`,
  "pond-life": () =>
    ground(300, "#9cc97a") +
    sun() +
    `<ellipse cx="320" cy="320" rx="270" ry="64" fill="#7ea4c8"/>` +
    `<g><ellipse cx="200" cy="318" rx="34" ry="20" fill="#f7d654"/><circle cx="226" cy="298" r="15" fill="#f7d654"/><path d="M238 298 l16 4 l-16 6 Z" fill="#f08a24"/><circle cx="230" cy="294" r="3" fill="#222"/></g>` +
    `<g><ellipse cx="400" cy="326" rx="40" ry="20" fill="#3f8a3a"/><circle cx="384" cy="304" r="12" fill="#3f8a3a"/><circle cx="414" cy="304" r="12" fill="#3f8a3a"/><circle cx="384" cy="302" r="4" fill="#fff"/><circle cx="414" cy="302" r="4" fill="#fff"/></g>` +
    `<g><ellipse cx="300" cy="350" rx="30" ry="13" fill="#f08a24"/><path d="M330 350 l24 -12 v24 Z" fill="#f08a24"/><circle cx="284" cy="347" r="3" fill="#222"/></g>` +
    `<g fill="#3f8a3a" stroke="#3f8a3a"><rect x="70" y="250" width="6" height="70"/><rect x="560" y="240" width="6" height="80"/></g>`,
  "farm-friends": () =>
    ground(290, "#9cc97a") +
    sun() +
    `<rect x="60" y="130" width="200" height="170" fill="#b8453a"/><path d="M40 134 L160 60 L280 134 Z" fill="#8a3a2b"/><rect x="130" y="200" width="60" height="100" fill="#e8dcc4"/>` +
    `<g><rect x="330" y="250" width="110" height="60" rx="14" fill="#fff"/><circle cx="450" cy="250" r="26" fill="#fff"/><circle cx="360" cy="270" r="12" fill="#333"/><circle cx="400" cy="262" r="10" fill="#333"/><rect x="342" y="302" width="12" height="40" fill="#fff"/><rect x="412" y="302" width="12" height="40" fill="#fff"/><circle cx="458" cy="246" r="3" fill="#222"/></g>` +
    `<g><ellipse cx="540" cy="330" rx="34" ry="28" fill="#f2b33d"/><circle cx="570" cy="304" r="16" fill="#f2b33d"/><path d="M584 304 l14 4 l-14 6 Z" fill="#f08a24"/><circle cx="574" cy="300" r="3" fill="#222"/><path d="M566 288 q4 -12 10 0" fill="#d9442b"/></g>`,
  "night-moon": () =>
    `<rect y="300" width="640" height="100" fill="#1d2640"/>` +
    `<circle cx="480" cy="100" r="50" fill="#f4eccb"/><circle cx="500" cy="88" r="44" fill="#26324f"/>` +
    [70, 150, 240, 330, 400, 560, 600].map((x, i) => `<circle cx="${x}" cy="${40 + ((i * 47) % 150)}" r="4" fill="#fff"/>`).join("") +
    `<rect x="120" y="210" width="150" height="100" fill="#3a4768"/><path d="M110 212 L195 150 L280 212 Z" fill="#2a3452"/><rect x="170" y="238" width="40" height="36" fill="#f7d654"/>` +
    `<ellipse cx="420" cy="300" rx="50" ry="20" fill="#1d2640"/><g fill="#6b7480"><circle cx="420" cy="270" r="22"/><path d="M402 256 l-6 -22 l16 12 Z"/><path d="M438 256 l6 -22 l-16 12 Z"/></g>`,
  lunchroom: () =>
    `<rect width="640" height="400" fill="#f6efe2"/><rect y="320" width="640" height="80" fill="#c9a77c"/>` +
    table(60, 250) +
    table(360, 250) +
    `<rect x="90" y="228" width="60" height="22" rx="4" fill="#e8dcc4"/><circle cx="104" cy="238" r="7" fill="#d9442b"/><circle cx="130" cy="238" r="7" fill="#3f8a3a"/><rect x="390" y="228" width="60" height="22" rx="4" fill="#e8dcc4"/><rect x="470" y="214" width="22" height="34" rx="3" fill="#fff" stroke="#2e4a94" stroke-width="3"/>` +
    person(120, 372, kid) +
    person(430, 372, kid2) +
    person(580, 372, { ...grown, tall: 1.1 }),
  "door-line": () =>
    `<rect width="640" height="400" fill="#f6efe2"/><rect x="470" y="60" width="130" height="260" fill="#8a5a2b"/><rect x="486" y="80" width="98" height="90" fill="#cfe9f6"/><circle cx="500" cy="230" r="7" fill="#f2b33d"/><rect y="320" width="640" height="80" fill="#c9a77c"/>` +
    person(110, 372, { ...kid, shirt: "#c2463d" }) +
    person(210, 372, { ...kid2, shirt: "#3f8a3a" }) +
    person(310, 372, { ...kid3, shirt: "#2e4a94" }) +
    person(400, 372, { ...grown, tall: 1.15 }),
  "family-dinner": () =>
    `<rect width="640" height="400" fill="#fbeedd"/><rect y="330" width="640" height="70" fill="#c9a77c"/>` +
    table(210, 270) +
    `<ellipse cx="320" cy="262" rx="46" ry="14" fill="#fff"/><path d="M280 262 q40 -34 80 0 Z" fill="#c2463d"/><circle cx="250" cy="262" r="10" fill="#e8dcc4"/><circle cx="390" cy="262" r="10" fill="#e8dcc4"/>` +
    person(110, 372, grown) +
    person(180, 372, kid2) +
    person(470, 372, { ...kid3, shirt: "#8a3a5c" }) +
    person(560, 372, { ...grown, shirt: "#9a4a26", skin: "#e2b48f", hair: "#3b2a20" }),
  "kitchen-help": () =>
    `<rect width="640" height="400" fill="#f6efe2"/><rect y="300" width="640" height="100" fill="#c9a77c"/><rect x="360" y="230" width="240" height="80" fill="#8d99a6"/><rect x="380" y="214" width="80" height="18" rx="6" fill="#6b7480"/>` +
    table(60, 250) +
    `<ellipse cx="110" cy="244" rx="26" ry="8" fill="#fff"/><ellipse cx="190" cy="244" rx="26" ry="8" fill="#fff"/><rect x="224" y="232" width="8" height="14" fill="#b07a3c"/>` +
    person(300, 372, kid2) +
    person(520, 372, { ...grown, hold: "basket" }),
  "mail-carrier": () =>
    ground(300, "#d6dbe0") +
    sun(80, 60) +
    `<rect x="330" y="190" width="220" height="100" rx="14" fill="#2e4a94"/><rect x="520" y="204" width="50" height="50" fill="#cfe9f6"/><circle cx="380" cy="292" r="20" fill="#333"/><circle cx="520" cy="292" r="20" fill="#333"/><rect x="350" y="214" width="60" height="30" fill="#fff"/>` +
    `<rect x="140" y="220" width="12" height="90" fill="#555"/><rect x="108" y="190" width="76" height="40" rx="8" fill="#c2463d"/>` +
    person(240, 372, { ...grown, shirt: "#2e4a94" }) +
    `<rect x="280" y="262" width="40" height="52" rx="6" fill="#9a4a26"/>`,
  "doctor-visit": () =>
    `<rect width="640" height="400" fill="#eaf4f5"/><rect y="330" width="640" height="70" fill="#d6dbe0"/><rect x="60" y="60" width="120" height="90" fill="#fff" stroke="#075568" stroke-width="6"/><path d="M120 80 v50 M95 105 h50" stroke="#c2463d" stroke-width="12"/>` +
    person(240, 380, { ...grown, shirt: "#fff", skin: "#8d5a3b", hair: "#1e1410" }) +
    `<path d="M215 255 q-10 50 20 56 q30 -6 20 -56" fill="none" stroke="#075568" stroke-width="5"/>` +
    person(430, 380, { ...kid, shirt: "#f2b33d" }) +
    `<rect x="520" y="270" width="80" height="60" rx="8" fill="#b07a3c"/>`,
  handwash: () =>
    `<rect width="640" height="400" fill="#eaf4f5"/><rect y="320" width="640" height="80" fill="#d6dbe0"/><rect x="330" y="200" width="200" height="30" rx="8" fill="#fff"/><rect x="330" y="230" width="200" height="90" fill="#cfd6dc"/><path d="M430 200 v-60 h40" fill="none" stroke="#8d99a6" stroke-width="12"/>` +
    `<g stroke="#4a78a8" stroke-width="4" stroke-linecap="round"><line x1="470" y1="150" x2="468" y2="196"/><line x1="480" y1="150" x2="478" y2="190"/></g>` +
    [360, 400, 380, 410].map((x, i) => `<circle cx="${x}" cy="${178 - i * 12}" r="${9 + (i % 2) * 4}" fill="#fff" stroke="#9fd0ea" stroke-width="3"/>`).join("") +
    person(200, 380, kid3),
  "bedroom-sleep": () =>
    `<rect width="640" height="400" fill="#3a4768"/><rect x="420" y="50" width="150" height="130" fill="#26324f" stroke="#e8dcc4" stroke-width="8"/><circle cx="500" cy="100" r="22" fill="#f4eccb"/><circle cx="510" cy="94" r="20" fill="#26324f"/><rect y="330" width="640" height="70" fill="#5a3b22"/>` +
    `<rect x="100" y="260" width="300" height="80" rx="10" fill="#7a5230"/><rect x="110" y="236" width="280" height="50" rx="12" fill="#c2463d"/><rect x="116" y="228" width="80" height="30" rx="14" fill="#fff"/><circle cx="150" cy="232" r="18" fill="#c58c62"/><path d="M134 226 a18 14 0 0 1 36 0 Z" fill="#3b2a20"/><path d="M146 234 q4 3 8 0" fill="none" stroke="#3b2a20" stroke-width="2"/>`,
  "healthy-plate": () =>
    `<rect width="640" height="400" fill="#fbeedd"/><circle cx="320" cy="200" r="170" fill="#fff" stroke="#e8dcc4" stroke-width="10"/>` +
    `<g><path d="M320 200 L320 40 A160 160 0 0 1 480 200 Z" fill="#7fbf6a"/><path d="M320 200 L480 200 A160 160 0 0 1 320 360 Z" fill="#e5b45a"/><path d="M320 200 L320 360 A160 160 0 0 1 160 200 Z" fill="#d9644b"/><path d="M320 200 L160 200 A160 160 0 0 1 320 40 Z" fill="#b86bb0"/></g>` +
    `<circle cx="320" cy="200" r="22" fill="#fff"/>`,
  "jump-rope": () =>
    ground() +
    sun() +
    person(240, 330, { ...kid2 }) +
    `<path d="M200 190 q40 -70 80 0 q-40 180 -80 0" fill="none" stroke="#f2b33d" stroke-width="5"/>` +
    person(470, 372, { ...kid3, hold: "ball" }),
  "shapes-table": () =>
    `<rect width="640" height="400" fill="#fbeedd"/><rect x="50" y="260" width="540" height="16" fill="#b07a3c"/><rect x="80" y="276" width="14" height="90" fill="#8a5a2b"/><rect x="546" y="276" width="14" height="90" fill="#8a5a2b"/>` +
    `<circle cx="130" cy="214" r="42" fill="#c2463d"/><rect x="214" y="172" width="86" height="86" fill="#2e4a94"/><path d="M340 258 l50 -88 l50 88 Z" fill="#3f8a3a"/><rect x="470" y="194" width="100" height="64" fill="#f2b33d"/>`,
  "apples-count": () =>
    ground(300, "#d6dbe0") +
    sun() +
    `<path d="M70 260 h200 l-24 90 h-152 Z" fill="#b07a3c"/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="${i < 3 ? 108 + i * 52 : 134 + (i - 3) * 52}" cy="${i < 3 ? 240 : 196}" r="22" fill="#d9442b"/>`).join("")}` +
    `<path d="M370 260 h200 l-24 90 h-152 Z" fill="#b07a3c"/>${[0, 1, 2].map((i) => `<circle cx="${408 + i * 52}" cy="240" r="22" fill="#d9442b"/>`).join("")}`,
  "measure-pencil": () =>
    `<rect width="640" height="400" fill="#f6efe2"/><rect y="250" width="640" height="150" fill="#d6b88c"/>` +
    `<rect x="70" y="190" width="500" height="54" fill="#f2d98a" stroke="#b08a2e" stroke-width="3"/>` +
    Array.from({ length: 13 }, (_, i) => `<line x1="${90 + i * 38}" y1="190" x2="${90 + i * 38}" y2="${i % 2 ? 212 : 224}" stroke="#555" stroke-width="3"/>`).join("") +
    `<rect x="90" y="270" width="228" height="26" fill="#f2b33d"/><path d="M318 270 l36 13 l-36 13 Z" fill="#e8c9a0"/><path d="M342 278 l12 5 l-12 5 Z" fill="#333"/><rect x="72" y="270" width="18" height="26" fill="#d9788a"/>`,
  "more-less": () =>
    `<rect width="640" height="400" fill="#fbeedd"/>` +
    table(40, 270) +
    table(380, 270) +
    `<ellipse cx="150" cy="262" rx="90" ry="16" fill="#fff"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${96 + (i % 3) * 42}" cy="${246 - Math.floor(i / 3) * 34}" r="17" fill="#c58c4b"/>`).join("")}` +
    `<ellipse cx="490" cy="262" rx="90" ry="16" fill="#fff"/>${[0, 1].map((i) => `<circle cx="${466 + i * 42}" cy="246" r="17" fill="#c58c4b"/>`).join("")}`,
  "feel-happy": () =>
    ground() +
    sun() +
    [{ x: 230, c: "#c2463d" }, { x: 270, c: "#2e4a94" }, { x: 310, c: "#f2b33d" }].map((b) => `<line x1="${b.x}" y1="150" x2="250" y2="250" stroke="#555" stroke-width="2"/><ellipse cx="${b.x}" cy="120" rx="24" ry="30" fill="${b.c}"/>`).join("") +
    person(250, 372, { ...kid2 }) +
    `<path d="M240 238 q10 12 20 0" fill="none" stroke="#3b2a20" stroke-width="3"/>`,
  "feel-sad": () =>
    ground() +
    cloud(100, 80, "#e4e9ee") +
    person(260, 372, { ...kid3 }) +
    `<path d="M250 242 q10 -10 20 0" fill="none" stroke="#3b2a20" stroke-width="3"/><circle cx="246" cy="236" r="4" fill="#4a78a8"/>` +
    `<path d="M380 340 l30 -4 l-6 -34 Z" fill="#e8c9a0"/><circle cx="395" cy="334" r="22" fill="#f4a8c0"/><ellipse cx="420" cy="352" rx="40" ry="8" fill="#f4a8c0"/>`,
  "new-friend": () =>
    `<rect width="640" height="400" fill="#f6efe2"/><rect x="40" y="40" width="200" height="130" rx="8" fill="#2f4f45"/><rect y="320" width="640" height="80" fill="#c9a77c"/>` +
    person(180, 372, { ...kid, shirt: "#8a3a5c" }) +
    `<rect x="214" y="252" width="30" height="46" rx="8" fill="#f2b33d"/>` +
    person(400, 372, kid2) +
    `<path d="M436 250 l22 -26" stroke="#8d5a3b" stroke-width="9" stroke-linecap="round"/>` +
    person(540, 372, { ...grown, tall: 1.1 }),
  crosswalk: () =>
    ground(160, "#9cc97a") +
    `<rect y="200" width="640" height="150" fill="#6b7480"/>` +
    Array.from({ length: 8 }, (_, i) => `<rect x="${40 + i * 74}" y="210" width="40" height="130" fill="#fff"/>`).join("") +
    `<rect x="80" y="40" width="8" height="150" fill="#555"/><path d="M60 20 h48 l24 24 v36 l-24 24 h-48 l-24 -24 v-36 Z" fill="#c2463d" transform="translate(-10 0) scale(.8)"/>` +
    person(180, 200, { ...grown, shirt: "#f2b33d" }) +
    person(430, 350, kid) +
    person(520, 350, { ...grown, shirt: "#3f8a3a" }),
};

const SCENE_SKY = { "park-rain": "rain", "snow-day": "rain", "night-moon": "night" };

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
  "snow-day": [
    "It is snowing. A child in a red coat and a blue hat stands next to a snowman.",
    "Está nevando. Un niño con abrigo rojo y gorro azul está junto a un muñeco de nieve.",
  ],
  "wind-kite": [
    "A windy day. A child flies a red kite and the tree bends in the wind.",
    "Un día con viento. Una niña vuela una cometa roja y el árbol se dobla con el viento.",
  ],
  "ice-melt": [
    "On a sunny table, one dish has ice cubes and another dish has water.",
    "En una mesa soleada, un plato tiene cubos de hielo y otro plato tiene agua.",
  ],
  "steam-pot": [
    "A grown-up cooks at a stove. Steam rises from a pot.",
    "Un adulto cocina en una estufa. Sale vapor de una olla.",
  ],
  "plant-parts": [
    "A plant in soil. It has roots under the ground, a stem, two leaves and a yellow flower.",
    "Una planta en la tierra. Tiene raíces bajo el suelo, un tallo, dos hojas y una flor amarilla.",
  ],
  "pond-life": [
    "A pond with a yellow duck, a green frog and an orange fish.",
    "Un estanque con un pato amarillo, una rana verde y un pez anaranjado.",
  ],
  "farm-friends": [
    "A farm with a red barn, a cow with black spots and a yellow hen.",
    "Una granja con un establo rojo, una vaca con manchas negras y una gallina amarilla.",
  ],
  "night-moon": [
    "It is night. A moon and stars shine over a house with one lit window. A cat sits outside.",
    "Es de noche. La luna y las estrellas brillan sobre una casa con una ventana encendida. Un gato está afuera.",
  ],
  lunchroom: [
    "Two children and a teacher in the lunchroom. Food trays and a milk carton are on the tables.",
    "Dos niños y una maestra en el comedor. Hay bandejas de comida y un cartón de leche en las mesas.",
  ],
  "door-line": [
    "Three children stand in a line at the classroom door. The teacher waits at the end of the line.",
    "Tres niños hacen fila en la puerta del salón. La maestra espera al final de la fila.",
  ],
  "family-dinner": [
    "A family of five eats dinner at a table with a pot of food in the middle.",
    "Una familia de cinco cena en una mesa con una olla de comida en el centro.",
  ],
  "kitchen-help": [
    "A child sets the table with plates while a grown-up cooks and carries a basket.",
    "Una niña pone la mesa con platos mientras un adulto cocina y lleva una canasta.",
  ],
  "mail-carrier": [
    "A mail carrier in a blue uniform carries a bag near a blue mail truck and a red mailbox.",
    "Un cartero con uniforme azul lleva una bolsa cerca de un camión de correo azul y un buzón rojo.",
  ],
  "doctor-visit": [
    "A doctor with a stethoscope and a child at a clinic. A first-aid sign is on the wall.",
    "Una doctora con estetoscopio y un niño en una clínica. Hay un letrero de primeros auxilios en la pared.",
  ],
  handwash: [
    "A child washes hands at a sink. Water runs and soap bubbles float up.",
    "Una niña se lava las manos en un lavabo. Corre el agua y suben burbujas de jabón.",
  ],
  "bedroom-sleep": [
    "A child sleeps in bed. The moon shines through the window.",
    "Una niña duerme en su cama. La luna brilla por la ventana.",
  ],
  "healthy-plate": [
    "A round plate with four colored parts for vegetables, grains, fruit and protein foods.",
    "Un plato redondo con cuatro partes de colores para verduras, granos, frutas y proteínas.",
  ],
  "jump-rope": [
    "A child jumps rope on the grass while a friend holds a ball.",
    "Una niña salta la cuerda en el pasto mientras un amigo tiene una pelota.",
  ],
  "shapes-table": [
    "On a table: a red circle, a blue square, a green triangle and a yellow rectangle.",
    "En una mesa: un círculo rojo, un cuadrado azul, un triángulo verde y un rectángulo amarillo.",
  ],
  "apples-count": [
    "Two baskets of red apples. The left basket has five apples. The right basket has three apples.",
    "Dos canastas de manzanas rojas. La canasta de la izquierda tiene cinco manzanas. La de la derecha tiene tres.",
  ],
  "measure-pencil": [
    "A yellow pencil lies next to a ruler. The pencil is a little longer than half the ruler.",
    "Un lápiz amarillo está junto a una regla. El lápiz es un poco más largo que la mitad de la regla.",
  ],
  "more-less": [
    "Two tables with plates of cookies. The left plate has six cookies. The right plate has two cookies.",
    "Dos mesas con platos de galletas. El plato de la izquierda tiene seis galletas. El de la derecha tiene dos.",
  ],
  "feel-happy": [
    "A smiling child holds three balloons: red, blue and yellow.",
    "Una niña sonriente sostiene tres globos: rojo, azul y amarillo.",
  ],
  "feel-sad": [
    "A child looks sad. An ice cream cone has fallen on the ground.",
    "Un niño se ve triste. Un helado se cayó al suelo.",
  ],
  "new-friend": [
    "A new child with a backpack stands in the classroom. Another child waves hello.",
    "Una niña nueva con mochila está en el salón. Otro niño la saluda con la mano.",
  ],
  crosswalk: [
    "A crossing guard with a stop sign helps two children and a grown-up at the crosswalk.",
    "Una guardia de cruce con una señal de alto ayuda a dos niños y a un adulto en el paso peatonal.",
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
  const sky = SCENE_SKY[id] || "day";
  return svg((lang === "es" ? es : en).replace(/"/g, "&quot;"), DRAW[id](), sky);
}

/** Pepita, the guide: a round seed with a sprout who reads every direction aloud. */
export function guideSVG({ talking = false } = {}) {
  return `<svg class="early-guide-art${talking ? " is-talking" : ""}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><path d="M60 30 q-4 -18 -22 -20 q4 16 22 20 Z" fill="#4fa14a"/><path d="M60 30 q6 -20 26 -18 q-6 16 -26 18 Z" fill="#3f8a3a"/><ellipse cx="60" cy="72" rx="40" ry="42" fill="#c98a4b"/><ellipse cx="60" cy="78" rx="28" ry="26" fill="#e3b07a"/><circle cx="46" cy="64" r="6" fill="#2a1d14"/><circle cx="74" cy="64" r="6" fill="#2a1d14"/><circle cx="48" cy="62" r="2" fill="#fff"/><circle cx="76" cy="62" r="2" fill="#fff"/><ellipse class="early-guide-mouth" cx="60" cy="86" rx="10" ry="5" fill="#8a3a2b"/><circle cx="36" cy="80" r="5" fill="#e98f7a" opacity=".7"/><circle cx="84" cy="80" r="5" fill="#e98f7a" opacity=".7"/></svg>`;
}

export const GUIDE_NAME = "Pepita";

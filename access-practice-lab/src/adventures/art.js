// Adventure Worlds art: original inline SVG in the Book Studio style (flat, 2.5px #1b1f3b outlines; no ids, scripts,
// <text> or external refs). Backgrounds 400x300, objects 200x200. The view resolves a key here first, then in
// src/book/art.js, so a world can use either library.

const D = "#1b1f3b";
const NAVY = "#1b2a5c";
const TEAL = "#075568";
const AQUA = "#1fa6a2";
const IVORY = "#fffaf0";
const AMBER = "#f2b134";
const CORAL = "#e86a50";
const SAGE = "#7fb48a";
const ROSE = "#8a3a5c";
const COPPER = "#9a4a26";
const SKY = "#bfe3e0";
const STEEL = "#b8bcc8";
const LEAF = "#5f9a6e";
const SAND = "#f2dfb8";
const NS = 'stroke="none"';

const svg = (vb, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><g fill="none" stroke="${D}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const sq = (b) => svg("0 0 200 200", b);
const wide = (b) => svg("0 0 400 300", b);
const dot = (x, y, r, c = D, o = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"${o < 1 ? ` opacity="${o}"` : ""} ${NS}/>`;
const shade = (d, o = 0.12) => `<path d="${d}" fill="${D}" opacity="${o}" ${NS}/>`;

/** A sea anemone: a column with a ring of tentacles (open) or a closed dome. */
const anemone = (x, y, c, open = true) =>
  open
    ? `<path d="M${x - 9} ${y}v-14h18v14z" fill="${c}"/>` +
      [-14, -7, 0, 7, 14]
        .map(
          (dx) =>
            `<path d="M${x} ${y - 14}q${dx} -10 ${dx * 1.3} -18" stroke="${c}" stroke-width="5"/>`,
        )
        .join("") +
      [-14, -7, 0, 7, 14]
        .map(
          (dx) =>
            `<path d="M${x} ${y - 14}q${dx} -10 ${dx * 1.3} -18" stroke-width="1.2" opacity=".5"/>`,
        )
        .join("")
    : `<path d="M${x - 11} ${y}q0 -16 11 -16q11 0 11 16z" fill="${c}"/>${dot(x - 3, y - 9, 2, IVORY, 0.7)}`;
const star = (x, y, r, c) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    const rad = i % 2 ? r * 0.42 : r;
    d += `${i ? "L" : "M"}${Math.round((x + rad * Math.cos(a)) * 10) / 10} ${Math.round((y + rad * Math.sin(a)) * 10) / 10}`;
  }
  return `<path d="${d}Z" fill="${c}"/>`;
};

const ART_LIST = [
  {
    key: "adv-empty-case",
    en: "An empty display case",
    es: "Una vitrina vacía",
    svg: sq(
      `<rect x="0" y="0" width="200" height="200" fill="#f3e6d6" ${NS}/>` +
        `<rect x="40" y="128" width="120" height="58" fill="${ROSE}"/>${shade("M130 129h29v56h-29z")}` +
        `<rect x="34" y="120" width="132" height="10" rx="2" fill="${IVORY}"/>` +
        `<path d="M44 120V40h112v80" fill="${SKY}" opacity=".55"/><path d="M44 120V40h112v80"/>` +
        `<path d="M58 54l22 -10M58 70l38 -18" stroke="${IVORY}" stroke-width="4" opacity=".9"/>` +
        `<rect x="76" y="104" width="48" height="16" rx="2" fill="${IVORY}"/>` +
        `<ellipse cx="100" cy="102" rx="18" ry="5" fill="${D}" opacity=".18" ${NS}/><ellipse cx="100" cy="102" rx="18" ry="5" stroke-dasharray="4 4" stroke-width="2"/>` +
        `<rect x="140" y="140" width="14" height="18" rx="2" fill="${AMBER}"/><circle cx="147" cy="147" r="2.5" fill="${D}" ${NS}/>` +
        `<rect x="54" y="140" width="56" height="26" rx="2" fill="${IVORY}"/><path d="M60 148h40M60 156h28" stroke-width="2"/>`,
    ),
  },
  {
    key: "adv-compass",
    en: "An old brass compass",
    es: "Una brújula antigua de bronce",
    svg: sq(
      `<circle cx="100" cy="104" r="72" fill="${COPPER}"/><circle cx="100" cy="104" r="60" fill="${AMBER}"/><circle cx="100" cy="104" r="50" fill="${IVORY}"/>` +
        `<rect x="90" y="18" width="20" height="16" rx="5" fill="${AMBER}"/><circle cx="100" cy="16" r="9" stroke-width="5"/><circle cx="100" cy="16" r="9" stroke="${AMBER}" stroke-width="2.5"/>` +
        `<path d="M100 58v8M100 142v8M54 104h8M138 104h8M68 72l5 5M132 72l-5 5M68 136l5 -5M132 136l-5 -5" stroke-width="2"/>` +
        `<path d="M100 66l12 38h-24z" fill="${CORAL}"/><path d="M100 142l12 -38h-24z" fill="${NAVY}"/>` +
        `<circle cx="100" cy="104" r="6" fill="${AMBER}"/>${shade("M150 70a60 60 0 0 1 -6 90a72 72 0 0 0 6 -90z", 0.18)}` +
        `<path d="M64 80q8 -14 22 -20" stroke="#fff" stroke-width="4" opacity=".8"/>`,
    ),
  },
  {
    key: "adv-tide-pool",
    en: "A rocky tide pool",
    es: "Una poza de marea rocosa",
    svg: wide(
      `<rect width="400" height="300" fill="${SKY}" ${NS}/><rect y="70" width="400" height="60" fill="${AQUA}" ${NS}/>` +
        `<path d="M20 92q14 -6 28 0M120 84q14 -6 28 0M250 96q14 -6 28 0M340 86q14 -6 28 0" stroke="${IVORY}" stroke-width="2.5"/>` +
        `<path d="M-4 130q60 -26 120 -10q50 -24 110 -4q70 -26 178 0v188H-4z" fill="#8d8f9e"/>` +
        `<path d="M-4 168q70 -18 140 -6q80 -22 160 0q60 -12 108 2" stroke-width="2" opacity=".35"/>` +
        `<path d="M60 206q0 -40 140 -42q150 2 146 44q-4 44 -146 46q-144 -2 -140 -48z" fill="${TEAL}"/>` +
        `<path d="M74 204q4 -32 126 -34q132 2 132 36" stroke="${SKY}" stroke-width="3" opacity=".6"/>` +
        anemone(120, 236, CORAL) +
        anemone(162, 242, ROSE) +
        anemone(286, 236, AMBER, false) +
        star(228, 226, 18, "#e8743b") +
        `<path d="M300 200q14 -14 26 0q-10 4 -12 14z" fill="${NAVY}"/><path d="M304 214q6 -10 16 -4" fill="${NAVY}"/>` +
        `<g fill="${IVORY}"><path d="M28 156l8 -14l8 14z"/><path d="M46 160l8 -14l8 14z"/><path d="M350 152l8 -14l8 14z"/></g>` +
        `<path d="M200 274q4 -12 10 0q4 -12 10 0" stroke="${LEAF}" stroke-width="4"/><path d="M90 280q4 -14 10 0" stroke="${LEAF}" stroke-width="4"/>`,
    ),
  },
  {
    key: "adv-volcano",
    en: "A volcano with an old slope and a young lava flow",
    es: "Un volcán con una ladera vieja y un flujo de lava joven",
    svg: wide(
      `<rect width="400" height="300" fill="#f6e3c9" ${NS}/>` +
        `<circle cx="330" cy="58" r="22" fill="${AMBER}"/>` +
        `<path d="M60 70h60q10 0 8 -10q-2 -12 -16 -10q-4 -16 -22 -12q-14 4 -14 16q-16 -2 -18 8q0 8 2 8z" fill="#fff"/>` +
        `<path d="M-4 260l160 -170q20 -16 40 -16h10q20 0 40 16l160 170z" fill="#6f6a72"/>` +
        `<path d="M176 76q24 -10 48 0" fill="${NAVY}"/>` +
        `<path d="M206 82q-6 40 10 80q14 40 4 96h52q-6 -50 -30 -96q-20 -40 -24 -80z" fill="#3a3540"/>` +
        `<path d="M216 120q6 30 20 52M228 200q8 26 10 56" stroke="${CORAL}" stroke-width="2" opacity=".7"/>` +
        `<path d="M-4 260l160 -170q14 -10 26 -14q-30 70 -60 120q-40 50 -126 64z" fill="${LEAF}"/>` +
        `<g fill="${SAGE}"><circle cx="40" cy="236" r="14"/><circle cx="70" cy="226" r="16"/><circle cx="104" cy="200" r="13"/><circle cx="130" cy="166" r="11"/></g>` +
        `<path d="M40 250v-14M70 242v-16M104 214v-14" stroke-width="3"/>` +
        `<g fill="${SAGE}"><circle cx="262" cy="232" r="4"/><circle cx="280" cy="210" r="3"/><circle cx="246" cy="246" r="3"/></g>` +
        `<rect x="-4" y="258" width="408" height="46" fill="${SAND}"/>` +
        `<path d="M186 60q-6 -16 6 -26M210 56q8 -14 0 -28" stroke="${STEEL}" stroke-width="4"/>`,
    ),
  },
  {
    key: "adv-seabird",
    en: "A seabird at its burrow",
    es: "Un ave marina en su madriguera",
    svg: sq(
      `<rect width="200" height="200" fill="${SKY}" ${NS}/>` +
        `<path d="M-4 150q60 -30 120 -10q50 -16 88 6v58H-4z" fill="${SAGE}"/>` +
        `<path d="M120 168q14 -26 40 -14q10 6 8 20z" fill="${NAVY}"/>` +
        `<path d="M64 136q-10 -40 22 -52q30 -8 42 18q8 20 -4 34q-30 14 -60 0z" fill="#fff"/>` +
        `<path d="M70 108q-30 -12 -50 6q24 2 40 16z" fill="#3a3540"/><path d="M118 100q30 -26 56 -14q-20 6 -40 30z" fill="#3a3540"/>` +
        `<circle cx="100" cy="80" r="18" fill="#fff"/>${dot(104, 76, 3.2)}` +
        `<path d="M116 82l18 4l-18 6z" fill="${AMBER}"/>` +
        `<path d="M90 150v12M104 150v12" stroke="${CORAL}" stroke-width="4"/>` +
        `<path d="M30 40q8 -8 16 0q8 -8 16 0M140 30q6 -6 12 0q6 -6 12 0" stroke-width="2"/>`,
    ),
  },
  {
    key: "adv-field-notes",
    en: "A field notebook with a bar chart",
    es: "Un cuaderno de campo con una gráfica de barras",
    svg: sq(
      `<rect x="36" y="22" width="128" height="160" rx="8" fill="${IVORY}"/>${shade("M150 23h13v158h-13z")}` +
        `<path d="M36 40h-8M36 70h-8M36 100h-8M36 130h-8M36 160h-8" stroke-width="4"/>` +
        `<path d="M56 150h92M56 150V60" stroke-width="2"/>` +
        `<rect x="64" y="120" width="14" height="30" fill="${STEEL}"/><rect x="84" y="112" width="14" height="38" fill="${AQUA}"/><rect x="104" y="96" width="14" height="54" fill="${AQUA}"/><rect x="124" y="74" width="14" height="76" fill="${TEAL}"/>` +
        `<path d="M64 44h50" stroke-width="3"/>` +
        `<path d="M150 170l26 -40l8 6l-26 40l-10 4z" fill="${AMBER}"/><path d="M176 130l8 6" stroke-width="2"/>`,
    ),
  },
  // ── The Lost City (worlds/lost-city.js) ──
  {
    key: "adv-carved-gate",
    en: "An ancient stone gate with carved panels and a water channel",
    es: "Una antigua puerta de piedra con paneles tallados y un canal de agua",
    svg: sq(
      `<rect width="200" height="200" fill="${SKY}" ${NS}/>` +
        `<path d="M-4 150q50 -14 104 -4q56 -12 104 2v56H-4z" fill="${SAGE}"/>` +
        `<rect x="30" y="58" width="40" height="122" fill="${SAND}"/>${shade("M58 59h11v120h-11z")}` +
        `<rect x="130" y="58" width="40" height="122" fill="${SAND}"/>${shade("M158 59h11v120h-11z")}` +
        `<rect x="22" y="30" width="156" height="30" rx="3" fill="${SAND}"/>${shade("M23 52h154v7H23z", 0.1)}` +
        `<circle cx="100" cy="45" r="9" fill="${AMBER}"/><path d="M97 30v6h6v-6" fill="${SKY}"/>` +
        `<path d="M84 45h-8M116 45h8M88 35l-5 -4M112 35l5 -4" stroke="${COPPER}" stroke-width="2"/>` +
        `<circle cx="50" cy="76" r="7" fill="${AQUA}"/><path d="M50 84q-6 6 0 12q6 6 0 12" stroke="${TEAL}" stroke-width="2.5"/>` +
        `<path d="M36 128h10v-8h10v-8h10" stroke-width="2"/>` +
        `<g fill="${COPPER}"><path d="M136 78h8l-1 9h-6z"/><path d="M146 78h8l-1 9h-6z"/><path d="M156 78h8l-1 9h-6z"/><path d="M141 92h8l-1 9h-6z"/><path d="M151 92h8l-1 9h-6z"/></g>` +
        `<path d="M142 112h16v26h-16z" fill="${D}" opacity=".25" ${NS}/><path d="M142 138v-26h16v26"/>` +
        `<path d="M140 156q6 -10 10 -4l6 -2" stroke-width="2"/><path d="M146 160l4 -8" stroke-width="2"/>` +
        `<path d="M74 196v-14h52v14" fill="#8d8f9e"/><path d="M80 196v-8h40v8" fill="${AQUA}"/>` +
        `<path d="M86 192q5 -3 10 0q5 3 10 0q5 -3 10 0" stroke="${IVORY}" stroke-width="2"/>` +
        `<path d="M30 62q-10 20 -4 44M170 66q10 18 4 40" stroke="${LEAF}" stroke-width="4"/>` +
        `<g fill="${LEAF}"><circle cx="27" cy="82" r="4"/><circle cx="25" cy="98" r="4"/><circle cx="175" cy="84" r="4"/></g>`,
    ),
  },
  {
    key: "adv-water-journal",
    en: "An old water-keeper's notebook with a sketch of a stone channel",
    es: "Un cuaderno antiguo de guardiana del agua con un dibujo de un canal de piedra",
    svg: sq(
      `<path d="M20 44q40 -10 80 4q40 -14 80 -4v124q-40 -10 -80 4q-40 -14 -80 -4z" fill="${IVORY}"/>` +
        `<path d="M100 48v124" stroke-width="2"/>${shade("M100 48q40 -14 80 -4v12q-40 -10 -80 4z", 0.08)}` +
        `<path d="M20 44q40 -10 80 4q40 -14 80 -4" fill="none"/>` +
        `<path d="M32 64h54M32 76h46M32 88h52M32 100h40M32 112h50M32 124h36M32 136h48" stroke="${STEEL}" stroke-width="2"/>` +
        `<path d="M114 140l14 -14h14l14 -14h14" stroke-width="2.5"/>` +
        `<path d="M112 70q8 -10 18 0q8 10 18 0q8 -10 18 0" stroke="${AQUA}" stroke-width="3"/>` +
        `<circle cx="124" cy="96" r="7" fill="${AQUA}"/><path d="M131 96q14 4 18 16q4 12 18 14" stroke="${TEAL}" stroke-width="2.5"/>` +
        `<path d="M150 182l30 -40l8 6l-30 40l-10 4z" fill="${AMBER}"/><path d="M180 142l8 6" stroke-width="2"/>` +
        `<path d="M58 20q4 16 0 30" stroke="${CORAL}" stroke-width="4"/>`,
    ),
  },
  {
    key: "adv-route-map",
    en: "A hand-drawn map of three routes up a ridge: river steps, a cliff path and a channel path",
    es: "Un mapa dibujado a mano de tres rutas por una colina: escalones del río, un sendero del acantilado y un sendero del canal",
    svg: sq(
      `<path d="M16 30l56 -10l56 10l56 -10v150l-56 10l-56 -10l-56 10z" fill="${SAND}"/>` +
        `<path d="M72 20v150M128 30v150" stroke-width="1.5" opacity=".35"/>` +
        `<path d="M30 176q14 -40 4 -80q-8 -40 10 -70" stroke="${AQUA}" stroke-width="7"/>` +
        `<path d="M44 150h8M44 140h8M46 130h8M46 120h8" stroke="${D}" stroke-width="2"/>` +
        `<path d="M96 168l-6 -20l8 -14l-8 -18l8 -16l-6 -18l8 -20" stroke="${COPPER}" stroke-width="3"/>` +
        `<path d="M84 98l14 14M98 98l-14 14" stroke="${CORAL}" stroke-width="4"/>` +
        `<path d="M118 172q30 -10 40 -36q8 -22 -10 -40q-16 -18 4 -40" stroke="${LEAF}" stroke-width="3.5" stroke-dasharray="7 6"/>` +
        `<g fill="${SAGE}"><path d="M136 44h36v8h-36z"/><path d="M140 54h32v8h-32z"/></g>` +
        `<circle cx="154" cy="34" r="7" fill="${AQUA}"/>` +
        `<path d="M100 178l-10 -12h20z" fill="${AMBER}"/>` +
        star(176, 160, 9, AMBER),
    ),
  },
];

export const ADV_ART = Object.freeze(
  ART_LIST.map((a) => ({ key: a.key, cat: "adventure", en: a.en, es: a.es, svg: a.svg })),
);

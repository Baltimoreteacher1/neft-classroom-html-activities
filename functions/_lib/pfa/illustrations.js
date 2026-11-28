// EduWonderLab practice illustration library — one house style: flat, rounded, warm.
// Palette only: navy #17324D, teal #1FA6A2, amber #F2C15B, warm off-white #F7F4EC, plus warm skin
// and wood browns. No purple range (validate:no-purple and tools/pfa/validate-pfa.mjs gate 9).
// Original artwork drawn as code: no stock photos, no fetched images, no copied characters.
// Every exported SVG has role="img" + <title>, or aria-hidden="true" when it is decorative next to
// text that already says the same thing.

const C = {
  navy: "#17324D",
  teal: "#1FA6A2",
  tealSoft: "#BFE6E4",
  amber: "#F2C15B",
  amberSoft: "#FBE7B5",
  paper: "#F7F4EC",
  ink: "#24323F",
  wood: "#B9824F",
  sky: "#DCEFF0",
  grass: "#8CC9A0",
  brick: "#C9785B",
  skins: ["#8D5524", "#C68642", "#E0AC69", "#5C3A21", "#F1C27D"],
};

const svg = (w, h, title, body, cls = "ill") =>
  `<svg class="${cls}" viewBox="0 0 ${w} ${h}" ${title ? `role="img" aria-label="${title.replace(/"/g, "&quot;")}"` : 'aria-hidden="true" focusable="false"'} xmlns="http://www.w3.org/2000/svg">${title ? `<title>${title}</title>` : ""}${body}</svg>`;

// A person, seated or standing, from simple rounded shapes.
function person(x, y, skin, shirt, s = 1, hair = C.navy) {
  return `<g class="ps"><g transform="translate(${x} ${y}) scale(${s})"><rect x="-16" y="0" width="32" height="44" rx="14" fill="${shirt}"/><circle cx="0" cy="-14" r="14" fill="${skin}"/><path d="M-14,-16 a14,14 0 0 1 28,0 q-14,-10 -28,0z" fill="${hair}"/><circle cx="-5" cy="-14" r="1.8" fill="${C.ink}"/><circle cx="5" cy="-14" r="1.8" fill="${C.ink}"/><path d="M-5,-8 q5,4 10,0" stroke="${C.ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></g>`;
}

const SCENES = {
  kitchen: {
    en: "A family cooking together in a kitchen",
    es: "Una familia cocinando junta en la cocina",
    body: () =>
      `<rect width="320" height="160" fill="${C.paper}"/><rect y="104" width="320" height="56" fill="${C.wood}"/><rect x="20" y="24" width="70" height="50" rx="8" fill="${C.sky}"/><rect x="200" y="70" width="90" height="34" rx="6" fill="${C.teal}"/><circle cx="225" cy="70" r="10" fill="${C.navy}"/><circle cx="262" cy="70" r="10" fill="${C.navy}"/><rect x="130" y="84" width="46" height="20" rx="6" fill="${C.amber}"/>${person(120, 60, C.skins[0], C.navy)}${person(170, 66, C.skins[2], C.teal, 0.8)}`,
  },
  store: {
    en: "A corner store counter with prices",
    es: "El mostrador de una tienda de la esquina con precios",
    body: () =>
      `<rect width="320" height="160" fill="${C.paper}"/><rect x="0" y="0" width="320" height="26" fill="${C.teal}"/><path d="M0,26 h320 l-10,14 h-300z" fill="${C.amber}"/><rect x="24" y="50" width="120" height="70" rx="6" fill="${C.tealSoft}"/>${[0, 1, 2].map((i) => `<rect x="${34 + i * 36}" y="${60}" width="26" height="24" rx="4" fill="${[C.amber, C.brick, C.navy][i]}"/><rect x="${34 + i * 36}" y="${90}" width="26" height="22" rx="4" fill="${[C.navy, C.amber, C.brick][i]}"/>`).join("")}<rect x="170" y="98" width="140" height="62" fill="${C.wood}"/><rect x="236" y="70" width="44" height="28" rx="4" fill="${C.navy}"/><rect x="242" y="76" width="32" height="12" rx="2" fill="${C.teal}"/>${person(200, 64, C.skins[3], C.amber)}`,
  },
  bus: {
    en: "A city bus at a stop",
    es: "Un autobús de la ciudad en una parada",
    body: () =>
      `<rect width="320" height="160" fill="${C.sky}"/><rect y="124" width="320" height="36" fill="#9FA9B0"/><rect x="40" y="52" width="210" height="72" rx="14" fill="${C.teal}"/><rect x="40" y="98" width="210" height="10" fill="${C.amber}"/>${[0, 1, 2, 3].map((i) => `<rect x="${56 + i * 46}" y="62" width="36" height="28" rx="4" fill="${C.paper}"/>`).join("")}<circle cx="80" cy="126" r="13" fill="${C.navy}"/><circle cx="212" cy="126" r="13" fill="${C.navy}"/><rect x="276" y="40" width="6" height="84" fill="${C.navy}"/><rect x="262" y="34" width="34" height="22" rx="4" fill="${C.amber}"/>${person(296, 86, C.skins[1], C.navy, 0.8)}`,
  },
  ballfield: {
    en: "A baseball field with a scoreboard",
    es: "Un campo de béisbol con un marcador",
    body: () =>
      `<rect width="320" height="160" fill="${C.sky}"/><path d="M0,160 L160,70 L320,160z" fill="${C.grass}"/><path d="M110,160 L160,118 L210,160z" fill="${C.wood}"/><rect x="200" y="14" width="100" height="50" rx="6" fill="${C.navy}"/><text x="250" y="46" fill="${C.amber}" font-size="22" font-family="sans-serif" text-anchor="middle">7 – 4</text>${person(70, 112, C.skins[4], C.teal, 0.8)}<circle cx="160" cy="118" r="5" fill="${C.paper}"/>`,
  },
  park: {
    en: "A city park with trees and a path",
    es: "Un parque de la ciudad con árboles y un camino",
    body: () =>
      `<rect width="320" height="160" fill="${C.sky}"/><rect y="110" width="320" height="50" fill="${C.grass}"/><path d="M120,160 q40,-40 140,-50" stroke="${C.amberSoft}" stroke-width="18" fill="none"/>${[40, 230, 290].map((x) => `<rect x="${x - 4}" y="80" width="8" height="34" fill="${C.wood}"/><circle cx="${x}" cy="72" r="24" fill="${C.teal}"/>`).join("")}<rect x="140" y="20" width="70" height="40" rx="20" fill="${C.amber}"/>${person(110, 100, C.skins[0], C.amber, 0.8)}${person(150, 104, C.skins[2], C.navy, 0.6)}`,
  },
  harbor: {
    en: "A harbor with a water taxi",
    es: "Un puerto con un taxi acuático",
    body: () =>
      `<rect width="320" height="160" fill="${C.sky}"/><rect y="100" width="320" height="60" fill="${C.teal}"/>${[0, 1, 2].map((i) => `<path d="M${i * 120},120 q30,-8 60,0 t60,0" stroke="${C.tealSoft}" stroke-width="4" fill="none"/>`).join("")}<path d="M90,96 h120 l-14,22 h-92z" fill="${C.paper}"/><rect x="118" y="78" width="64" height="20" rx="4" fill="${C.navy}"/><rect x="0" y="40" width="40" height="60" fill="${C.brick}"/><rect x="40" y="56" width="30" height="44" fill="${C.amber}"/><rect x="250" y="30" width="50" height="70" fill="${C.navy}"/>`,
  },
  classroom: {
    en: "A classroom table with notebooks",
    es: "Una mesa del salón con cuadernos",
    body: () =>
      `<rect width="320" height="160" fill="${C.paper}"/><rect x="30" y="16" width="160" height="70" rx="6" fill="${C.navy}"/><text x="110" y="58" fill="${C.paper}" font-size="22" font-family="sans-serif" text-anchor="middle">3x + 2x</text><rect y="116" width="320" height="44" fill="${C.wood}"/><rect x="200" y="100" width="54" height="16" rx="2" fill="${C.teal}"/><rect x="258" y="104" width="44" height="12" rx="2" fill="${C.amber}"/>${person(230, 70, C.skins[3], C.teal, 0.8)}`,
  },
  home: {
    en: "A family at a kitchen table doing homework together",
    es: "Una familia en la mesa haciendo la tarea junta",
    body: () =>
      `<rect width="320" height="160" fill="${C.amberSoft}"/><rect x="220" y="20" width="70" height="56" rx="6" fill="${C.sky}"/><rect y="112" width="320" height="48" fill="${C.wood}"/><rect x="120" y="100" width="80" height="12" rx="2" fill="${C.paper}"/>${person(90, 70, C.skins[1], C.navy)}${person(160, 76, C.skins[0], C.teal, 0.75)}${person(232, 72, C.skins[2], C.amber, 0.9, "#5C3A21")}`,
  },
};

export function scene(name, lang = null) {
  const s = SCENES[name] || SCENES.home;
  const title = lang ? s[lang] : null;
  return svg(320, 160, title, s.body(), "ill ill-scene");
}
export const SCENE_NAMES = Object.keys(SCENES);

// Pick a scene from the words in a problem (context art, never decoration on its own).
export function sceneFor(text) {
  const t = String(text || "").toLowerCase();
  if (/recipe|cup|rice|cook|kitchen|pizza|snack|trail mix|lemonade|bake|flour/.test(t))
    return "kitchen";
  if (/store|price|cost|\$|sale|discount|buy|ticket|market|bottle/.test(t)) return "store";
  if (/bus|train|light rail|taxi|car|mile|travel|transit/.test(t))
    return /taxi|harbor|boat/.test(t) ? "harbor" : "bus";
  if (/game|score|team|points|basketball|baseball|soccer|field|player|fans|camden/.test(t))
    return "ballfield";
  if (/park|garden|tree|run|walk|trail|path|plant/.test(t)) return "park";
  if (/harbor|water|boat|crab/.test(t)) return "harbor";
  if (/class|student|school|notebook|book|library/.test(t)) return "classroom";
  return null;
}

// Unit header art: a scene plus the unit's own motif.
const UNIT_MOTIF = {
  1: (x) =>
    `<circle cx="${x}" cy="40" r="22" fill="${C.amber}"/><path d="M${x - 10},40 l7,8 l14,-16" stroke="${C.navy}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  2: (x) =>
    [0, 1, 2, 3]
      .map(
        (i) =>
          `<rect x="${x - 30 + i * 16}" y="${60 - [20, 36, 28, 44][i]}" width="12" height="${[20, 36, 28, 44][i]}" rx="2" fill="${i % 2 ? C.teal : C.amber}"/>`,
      )
      .join(""),
  3: (x) =>
    `<circle cx="${x - 14}" cy="40" r="14" fill="${C.teal}"/><circle cx="${x + 18}" cy="40" r="14" fill="${C.teal}"/><circle cx="${x + 18}" cy="40" r="7" fill="${C.amber}"/>`,
  4: (x) =>
    `<circle cx="${x}" cy="40" r="22" fill="${C.tealSoft}"/><path d="M${x},40 L${x},18 A22,22 0 0 1 ${x + 22},40 Z" fill="${C.amber}"/><text x="${x}" y="48" font-size="16" fill="${C.navy}" font-family="sans-serif" text-anchor="middle">%</text>`,
  5: (x) =>
    `<path d="M${x - 24},58 h48 l-12,-36 h-24z" fill="${C.amber}"/><path d="M${x - 12},22 l12,-10 l12,10z" fill="${C.teal}"/>`,
  6: (x) =>
    `<text x="${x}" y="50" font-size="28" fill="${C.navy}" font-family="sans-serif" text-anchor="middle">x²</text>`,
  7: (x) =>
    `<line x1="${x - 30}" y1="40" x2="${x + 30}" y2="40" stroke="${C.navy}" stroke-width="3"/><line x1="${x}" y1="12" x2="${x}" y2="68" stroke="${C.navy}" stroke-width="3"/><circle cx="${x + 16}" cy="26" r="6" fill="${C.amber}"/>`,
  8: (x) =>
    `<path d="M${x - 30},44 h60" stroke="${C.navy}" stroke-width="4"/><path d="M${x},44 v18" stroke="${C.navy}" stroke-width="4"/><rect x="${x - 34}" y="28" width="20" height="14" rx="3" fill="${C.teal}"/><rect x="${x + 14}" y="28" width="20" height="14" rx="3" fill="${C.amber}"/>`,
  9: (x) =>
    `<path d="M${x - 28},62 L${x + 28},18" stroke="${C.teal}" stroke-width="5" stroke-linecap="round"/><circle cx="${x - 10}" cy="48" r="5" fill="${C.amber}"/><circle cx="${x + 10}" cy="32" r="5" fill="${C.amber}"/>`,
  10: (x) =>
    `<path d="M${x},14 l7,16 l17,2 l-13,11 l4,17 l-15,-9 l-15,9 l4,-17 l-13,-11 l17,-2z" fill="${C.amber}"/>`,
};
const UNIT_SCENE = {
  1: "classroom",
  2: "ballfield",
  3: "kitchen",
  4: "store",
  5: "park",
  6: "classroom",
  7: "harbor",
  8: "store",
  9: "bus",
  10: "home",
};
export function unitArt(n, title = null) {
  const sc = SCENES[UNIT_SCENE[n] || "home"];
  return svg(
    320,
    160,
    title,
    `${sc.body()}<g transform="translate(0 0)"><rect x="236" y="8" width="76" height="72" rx="16" fill="${C.paper}" opacity=".92"/><g class="motif">${(UNIT_MOTIF[n] || UNIT_MOTIF[10])(274)}</g></g>`,
    "ill ill-unit",
  );
}

// The guide: "Tally", an original round teal character with an amber scarf and a pencil.
export function guide(mood = "happy", title = null) {
  const mouth =
    mood === "think"
      ? `<path d="M-7,10 h14" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`
      : `<path d="M-9,8 q9,9 18,0" stroke="${C.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const arm =
    mood === "cheer"
      ? `<path class="g-arm" d="M22,6 q16,-16 20,-34" stroke="${C.teal}" stroke-width="8" fill="none" stroke-linecap="round"/>`
      : `<path class="g-arm" d="M22,10 q14,6 18,20" stroke="${C.teal}" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="34" y="22" width="6" height="22" rx="2" fill="${C.amber}" transform="rotate(-20 37 33)"/>`;
  return svg(
    100,
    110,
    title,
    `<g transform="translate(46 58)" class="g-body"><ellipse cx="0" cy="44" rx="26" ry="5" fill="${C.navy}" opacity=".15"/><path d="M-28,-6 a28,32 0 0 1 56,0 v18 a28,26 0 0 1 -56,0z" fill="${C.teal}"/><path d="M-14,-36 l-6,-12 l14,6z M14,-36 l6,-12 l-14,6z" fill="${C.teal}"/><ellipse cx="0" cy="2" rx="20" ry="16" fill="${C.paper}"/><circle cx="-8" cy="-2" r="3.2" fill="${C.ink}"/><circle cx="8" cy="-2" r="3.2" fill="${C.ink}"/><circle cx="-7" cy="-3" r="1" fill="#fff"/><circle cx="9" cy="-3" r="1" fill="#fff"/>${mouth}<path d="M-24,20 q24,12 48,0 v8 q-24,12 -48,0z" fill="${C.amber}"/>${arm}<path d="M-22,10 q-12,6 -14,18" stroke="${C.teal}" stroke-width="8" fill="none" stroke-linecap="round"/></g>`,
    `ill ill-guide guide-${mood}`,
  );
}

// Icons: 24x24, stroke style, currentColor so they follow text color and forced-colors mode.
const ICON = {
  home: "M4 11l8-7 8 7v9h-5v-6h-6v6H4z",
  back: "M15 5l-7 7 7 7",
  print: "M7 9V4h10v5M6 18H4v-7h16v7h-2M7 14h10v6H7z",
  audio: "M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11",
  lang: "M4 5h9M8.5 5v2c0 4-2 7-5 8M6 9c1 3 3 5 6 6M14 20l4-10 4 10M15.5 16.5h5",
  motion: "M5 12h3l2-5 4 10 2-5h3",
  text: "M4 19l5-14 5 14M6 14h6M15 19l3-8 3 8M16 16.5h4",
  copy: "M8 8h11v11H8zM5 16V5h11",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2",
  check: "M5 12l5 5 9-10",
  hint: "M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z",
  retry: "M4 12a8 8 0 0114-5l2 2M20 4v5h-5M20 12a8 8 0 01-14 5l-2-2M4 20v-5h5",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  play: "M8 5l11 7-11 7z",
  pause: "M8 5v14M16 5v14",
  next: "M9 5l7 7-7 7",
  prev: "M15 5l-7 7 7 7",
  replay: "M4 12a8 8 0 108-8H8M8 1L5 4l3 3",
  family:
    "M7 9a3 3 0 100-6 3 3 0 000 6zM17 9a3 3 0 100-6 3 3 0 000 6zM2 21v-4a5 5 0 0110 0v4M12 21v-4a5 5 0 0110 0v4",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19V5",
  key: "M14 10a4 4 0 11-4-4M10 10l9 9M16 16l2-2M18 18l2-2",
  pencil: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  link: "M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1",
  // item types
  mc: "M5 6h2M5 12h2M5 18h2M10 6h9M10 12h9M10 18h9",
  numeric: "M7 4L5 20M15 4l-2 16M4 9h16M3 15h16",
  select: "M4 5h6v6H4zM14 7h6M4 15h6v6H4zM14 17h6M5 18l2 2 3-4",
  match: "M5 6h4M5 18h4M15 6h4M15 18h4M9 6l6 12M9 18l6-12",
  table: "M4 5h16v14H4zM4 10h16M4 15h16M11 5v14",
  error: "M12 4l9 16H3zM12 10v4M12 17v.5",
  explain: "M4 5h16v11H9l-5 4z M8 9h8M8 12h5",
  visual: "M4 18h16M6 18V12M10 18V8M14 18v-5M18 18V6",
  // tiers
  warm: "M12 20a6 6 0 01-6-6c0-4 6-10 6-10s6 6 6 10a6 6 0 01-6 6z",
  build: "M4 20h16M6 20v-6h4v6M10 20V9h4v11M14 20v-8h4v8",
  stretch: "M4 18l6-8 4 4 6-10M14 4h6v6",
};
export function icon(name, cls = "") {
  const d = ICON[name] || ICON.star;
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
export const ICON_NAMES = Object.keys(ICON);
export const PALETTE = C;

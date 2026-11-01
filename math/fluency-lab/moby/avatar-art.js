// Original inline-SVG art for the Moby avatar. Everything is drawn here, in plain shapes: no emoji, no images, no fonts,
// and no violet, purple or magenta. Head-relative art uses "head units": the head is a circle of radius 28 centred on
// (0,0), eyes at y = -2, shoulders at y = 30. avatar.js scales and places the group for each grade look.
const INK = "#17324D";
const line = (w = 2.4) =>
  `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export const SKIN_TONES = Object.freeze({
  tone1: "#FBE3CF",
  tone2: "#F2C8A0",
  tone3: "#E0A878",
  tone4: "#C98B5E",
  tone5: "#A8683F",
  tone6: "#80482B",
  tone7: "#5E3220",
  tone8: "#3F2216",
});
export const HAIR_COLORS = Object.freeze({
  black: "#1E1A1A",
  brown: "#5A3A22",
  auburn: "#8B3A1E",
  blond: "#D9B05A",
  gray: "#9AA0AA",
  copper: "#B5562B",
  blue: "#2F6FB5",
  green: "#3FA36B",
});
export const OUTFIT_COLORS = Object.freeze({
  teal: "#1FA6A2",
  blue: "#2F6FB5",
  green: "#3FA36B",
  orange: "#F08A3C",
  red: "#D1495B",
  gold: "#E3A917",
  navy: "#17324D",
  gray: "#8A94A3",
});
export const HAIR_STYLES = Object.freeze([
  "short",
  "long",
  "curly",
  "bun",
  "braids",
  "afro",
  "none",
]);

export const hairBack = (style, c) =>
  ({
    long: `<path d="M-31 -4Q-35 -36 0 -36Q35 -36 31 -4L35 48H-35Z" fill="${c}" ${line(2)}/>`,
    afro: `<circle cx="0" cy="-8" r="38" fill="${c}" ${line(2)}/>`,
    bun: `<circle cx="0" cy="-36" r="11" fill="${c}" ${line(2)}/>`,
    braids: `<path d="M-30 0Q-40 22 -30 44M30 0Q40 22 30 44" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`,
  })[style] || "";

export const hairFront = (style, c) =>
  style === "none"
    ? ""
    : style === "curly"
      ? `<g fill="${c}" ${line(1.6)}><circle cx="-21" cy="-16" r="10"/><circle cx="-8" cy="-26" r="11"/><circle cx="8" cy="-26" r="11"/><circle cx="21" cy="-16" r="10"/></g>`
      : `<path d="M-28 -6Q-31 -36 0 -36Q31 -36 28 -6Q18 -21 0 -21Q-18 -21 -28 -6Z" fill="${c}" ${line(2)}/>`;

export const HATS = Object.freeze({
  cap: `<path d="M-27 -6Q-24 -40 0 -40Q24 -40 27 -6Z" fill="#E0453A" ${line()}/><path d="M12 -8h24q-3 10 -26 8z" fill="#B6362D" ${line()}/>`,
  party: `<path d="M0 -58L-19 -16H19Z" fill="#F3B61F" ${line()}/><circle cx="0" cy="-58" r="5" fill="#D0674F" ${line(2)}/><path d="M-11 -30l18-9M-15 -22l26-12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  wizard: `<path d="M0 -66L-22 -14H22Z" fill="#1FA6A2" ${line()}/><ellipse cx="0" cy="-14" rx="32" ry="6" fill="${INK}"/><circle cx="-3" cy="-36" r="4.5" fill="#F3B61F"/>`,
  beanie: `<path d="M-27 -6Q-25 -42 0 -42Q25 -42 27 -6Z" fill="#2F6FB5" ${line()}/><rect x="-28" y="-12" width="56" height="9" rx="4" fill="#1D4F86" ${line(2)}/><circle cx="0" cy="-44" r="6" fill="#fff" ${line(2)}/>`,
  tophat: `<rect x="-16" y="-58" width="32" height="44" fill="${INK}"/><rect x="-28" y="-18" width="56" height="8" rx="4" fill="${INK}"/><rect x="-16" y="-30" width="32" height="7" fill="#D1495B"/>`,
  crown: `<path d="M-24 -14L-21 -40L-10 -28L0 -46L10 -28L21 -40L24 -14Z" fill="#F3B61F" stroke="#C98F00" stroke-width="2.4" stroke-linejoin="round"/>`,
});

export const FACES = Object.freeze({
  glasses: `<g fill="none" stroke="#13233A" stroke-width="2.4"><circle cx="-10" cy="-2" r="8"/><circle cx="10" cy="-2" r="8"/><path d="M-2 -2h4"/></g>`,
  goggles: `<rect x="-24" y="-12" width="48" height="19" rx="9.5" fill="#9BD1FF" fill-opacity=".65" stroke="#13233A" stroke-width="2.4"/><path d="M0 -12v19" stroke="#13233A" stroke-width="2.4"/>`,
  mustache: `<path d="M0 10Q-6 3 -16 7Q-12 17 0 10Q12 17 16 7Q6 3 0 10Z" fill="#5A3A22"/>`,
  starshades: [-10, 10]
    .map(
      (x) =>
        `<path transform="translate(${x} -1)" d="M0 -9l2.6 5.6 6.1.7-4.5 4.2 1.2 6L0 4.3-5.4 7.5l1.2-6L-8.7-2.7l6.1-.7z" fill="#F3B61F" stroke="#13233A" stroke-width="1.8"/>`,
    )
    .join(""),
  shades: `<rect x="-22" y="-9" width="19" height="13" rx="5" fill="#13233A"/><rect x="3" y="-9" width="19" height="13" rx="5" fill="#13233A"/><path d="M-3 -5h6" stroke="#13233A" stroke-width="2.4"/>`,
});

// Drawn behind the body, so only the edges show.
export const BACKS = Object.freeze({
  cape: `<path d="M-24 22Q-44 62 -36 92H36Q44 62 24 22Z" fill="#D1495B" ${line()}/>`,
  wings: `<path d="M-22 40Q-62 28 -56 -4Q-34 -2 -20 28ZM22 40Q62 28 56 -4Q34 -2 20 28Z" fill="#F3B61F" stroke="#C98F00" stroke-width="2.4" stroke-linejoin="round"/>`,
  backpack: `<rect x="-34" y="26" width="68" height="62" rx="14" fill="#8A5A2B" ${line()}/><rect x="-22" y="58" width="44" height="18" rx="6" fill="#6D4420"/>`,
  bubbles: `<g fill="#9BD1FF" fill-opacity=".55" stroke="#4A90D9" stroke-width="2"><circle cx="-44" cy="30" r="9"/><circle cx="46" cy="22" r="7"/><circle cx="-40" cy="58" r="6"/><circle cx="44" cy="52" r="10"/></g>`,
  rocket: `<rect x="-42" y="30" width="14" height="42" rx="7" fill="#C9D3E3" ${line(2)}/><rect x="28" y="30" width="14" height="42" rx="7" fill="#C9D3E3" ${line(2)}/><path d="M-40 74q5 14 10 0M30 74q5 14 10 0" fill="#FF8A3D"/>`,
});

const shade = (hex, amount) => {
  const n = Number.parseInt(hex.slice(1), 16);
  const mix = (v) =>
    Math.max(0, Math.min(255, Math.round(v + (amount < 0 ? v : 255 - v) * amount)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => mix(v).toString(16).padStart(2, "0")).join("")}`;
};
export const mixHex = (hex, other, amount) => {
  const a = Number.parseInt(hex.slice(1), 16);
  const b = Number.parseInt(other.slice(1), 16);
  const ch = (shift) =>
    Math.round(((a >> shift) & 255) * (1 - amount) + ((b >> shift) & 255) * amount);
  return `#${[ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// Torso fills and details per outfit, in head units. c = the outfit colour.
export const OUTFITS = Object.freeze({
  tee: (c) =>
    `<path d="M-10 30Q0 42 10 30" fill="none" stroke="${shade(c, -0.3)}" stroke-width="3"/>`,
  hoodie: (c) =>
    `<path d="M-17 30Q0 52 17 30" fill="${shade(c, -0.15)}" ${line(2)}/><rect x="-14" y="62" width="28" height="16" rx="6" fill="${shade(c, -0.12)}"/><path d="M-6 44v12M6 44v12" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
  overalls: (c) =>
    `<path d="M-20 30V58H20V30" fill="${c}" ${line(2)}/><rect x="-10" y="58" width="20" height="14" rx="4" fill="${shade(c, -0.15)}"/><circle cx="-20" cy="32" r="2.6" fill="#fff"/><circle cx="20" cy="32" r="2.6" fill="#fff"/>`,
  labcoat: () =>
    `<path d="M-34 100V44Q-34 30 -20 30H20Q34 30 34 44V100Z" fill="#F4F7FA" ${line(2)}/><path d="M-13 30L0 62L13 30" fill="#fff" ${line(2)}/><rect x="14" y="64" width="14" height="15" rx="3" fill="#E7EDF3" ${line(1.8)}/><path d="M20 64v-6" stroke="#1FA6A2" stroke-width="3" stroke-linecap="round"/>`,
  vest: (c) =>
    `<path d="M-30 100V44Q-30 32 -18 32L-6 62V100ZM30 100V44Q30 32 18 32L6 62V100Z" fill="${c}" ${line(2)}/><circle cx="-18" cy="70" r="2.4" fill="#fff"/><circle cx="18" cy="70" r="2.4" fill="#fff"/>`,
  apron: () =>
    `<path d="M-15 38H15L19 100H-19Z" fill="#F4F7FA" ${line(2)}/><path d="M-15 38L-24 32M15 38L24 32" stroke="#F4F7FA" stroke-width="4" stroke-linecap="round"/><rect x="-9" y="62" width="18" height="12" rx="3" fill="#E7EDF3" ${line(1.6)}/>`,
  scarf: () =>
    `<path d="M-22 28Q0 46 22 28L22 38Q0 56 -22 38Z" fill="#E3A917" ${line(2)}/><path d="M10 44l6 24 8-3-4-24Z" fill="#E3A917" ${line(2)}/>`,
  sash: () =>
    `<path d="M-30 36L30 74V88L-30 50Z" fill="#E3A917" ${line(2)}/><circle cx="20" cy="76" r="5" fill="#F6D04D" ${line(1.6)}/>`,
});
// Outfits drawn as a full coat or panel keep their own fills; the others sit on a tee in the chosen colour.
export const SELF_COLORED = new Set(["labcoat", "vest", "apron"]);

export const COMPANIONS = Object.freeze({
  buddy: `<rect x="-13" y="-14" width="26" height="28" rx="13" fill="#4A90D9" ${line(2)}/><circle cx="-5" cy="-3" r="2.2" fill="#13233A"/><circle cx="5" cy="-3" r="2.2" fill="#13233A"/><path d="M-5 4q5 4 10 0" fill="none" stroke="#13233A" stroke-width="2" stroke-linecap="round"/>`,
  pip: `<circle cx="0" cy="0" r="13" fill="#F3C53F" ${line(2)}/><path d="M-3 2L3 2L0 7Z" fill="#F08A3C" ${line(1.4)}/><circle cx="-5" cy="-3" r="2" fill="#13233A"/><circle cx="5" cy="-3" r="2" fill="#13233A"/>`,
  bun: `<ellipse cx="-6" cy="-15" rx="4" ry="10" fill="#F4E9DD" ${line(2)}/><ellipse cx="6" cy="-15" rx="4" ry="10" fill="#F4E9DD" ${line(2)}/><circle cx="0" cy="0" r="13" fill="#F4E9DD" ${line(2)}/><circle cx="-5" cy="-2" r="2" fill="#13233A"/><circle cx="5" cy="-2" r="2" fill="#13233A"/><path d="M-2 4h4" stroke="#D0674F" stroke-width="2" stroke-linecap="round"/>`,
  pebble: `<path d="M-15 8Q-15 -12 0 -12Q15 -12 15 8Z" fill="#6DAF73" ${line(2)}/><path d="M-6 8V-4M6 8V-4M-15 0H15" stroke="#3F7F4A" stroke-width="1.6" fill="none"/><circle cx="16" cy="3" r="6" fill="#8CC48F" ${line(2)}/><circle cx="18" cy="2" r="1.4" fill="#13233A"/>`,
  ember: `<path d="M-2 -14Q4 -22 8 -12Q4 -10 -2 -14Z" fill="#F3B61F" ${line(1.4)}/><ellipse cx="0" cy="0" rx="15" ry="12" fill="#F08A3C" ${line(2)}/><circle cx="-5" cy="-2" r="2" fill="#13233A"/><circle cx="5" cy="-2" r="2" fill="#13233A"/><path d="M-4 5q4 3 8 0" fill="none" stroke="#13233A" stroke-width="1.8" stroke-linecap="round"/>`,
  nimbus: `<g fill="#EEF3F8" ${line(2)}><circle cx="-9" cy="-3" r="9"/><circle cx="9" cy="-3" r="9"/><circle cx="0" cy="-9" r="9"/></g><circle cx="0" cy="4" r="8" fill="#5A6B7E"/><circle cx="-3" cy="3" r="1.4" fill="#fff"/><circle cx="3" cy="3" r="1.4" fill="#fff"/>`,
  comet: `<path d="M-12 -6L-9 -18L-2 -10ZM12 -6L9 -18L2 -10Z" fill="#F3B61F" ${line(2)}/><circle cx="0" cy="0" r="13" fill="#F3B61F" ${line(2)}/><circle cx="-5" cy="-2" r="2" fill="#13233A"/><circle cx="5" cy="-2" r="2" fill="#13233A"/><path d="M15 -14l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#fff" stroke="#17324D" stroke-width="1"/>`,
});

const books = (y, colors) =>
  colors
    .map(
      (fill, i) =>
        `<rect x="${6 + i * 17}" y="${y}" width="14" height="${22 + (i % 2) * 4}" rx="2" fill="${fill}"/>`,
    )
    .join("");
export const ENVIRONMENTS = Object.freeze({
  meadow: `<rect width="120" height="120" fill="#CFE8F7"/><circle cx="96" cy="24" r="12" fill="#F6D04D"/><ellipse cx="30" cy="124" rx="70" ry="38" fill="#7DBE7B"/><ellipse cx="100" cy="128" rx="60" ry="34" fill="#5FA862"/>`,
  library: `<rect width="120" height="120" fill="#EAD9BC"/><rect y="34" width="120" height="5" fill="#8A5A2B"/><rect y="74" width="120" height="5" fill="#8A5A2B"/>${books(12, ["#2F6FB5", "#D1495B", "#3FA36B", "#F3B61F", "#1FA6A2", "#C9702E", "#4A90D9"])}${books(52, ["#3FA36B", "#F3B61F", "#2F6FB5", "#D1495B", "#1FA6A2", "#8A5A2B", "#F08A3C"])}`,
  workshop: `<rect width="120" height="120" fill="#D9E1E8"/><circle cx="24" cy="28" r="12" fill="none" stroke="#8A94A3" stroke-width="6" stroke-dasharray="4 4"/><circle cx="24" cy="28" r="4" fill="#8A94A3"/><rect x="62" y="14" width="8" height="38" rx="3" fill="#8A94A3"/><rect x="58" y="10" width="16" height="10" rx="3" fill="#6B7684"/><rect x="88" y="20" width="22" height="8" rx="3" fill="#E3A917"/><rect x="0" y="86" width="120" height="34" fill="#B98A5A"/>`,
  observatory: `<rect width="120" height="120" fill="#1B3358"/><circle cx="26" cy="24" r="11" fill="#F6EFD0"/><circle cx="31" cy="21" r="10" fill="#1B3358"/><g fill="#F6EFD0"><circle cx="70" cy="18" r="1.8"/><circle cx="96" cy="34" r="1.4"/><circle cx="56" cy="40" r="1.2"/><circle cx="104" cy="12" r="1.6"/><circle cx="84" cy="52" r="1.2"/><circle cx="14" cy="60" r="1.4"/></g><path d="M0 120V96Q60 74 120 96V120Z" fill="#10213B"/>`,
  garden: `<rect width="120" height="120" fill="#DDF0D6"/><path d="M0 82H120M0 94H120" stroke="#B98A5A" stroke-width="3"/><path d="M14 70V104M44 70V104M76 70V104M106 70V104" stroke="#B98A5A" stroke-width="4"/><g><circle cx="22" cy="38" r="7" fill="#E5677A"/><circle cx="22" cy="38" r="2.6" fill="#F6D04D"/><circle cx="96" cy="30" r="7" fill="#F6D04D"/><circle cx="96" cy="30" r="2.6" fill="#D0674F"/><circle cx="64" cy="22" r="6" fill="#F08A3C"/><circle cx="64" cy="22" r="2.2" fill="#F6D04D"/></g><rect y="104" width="120" height="16" fill="#7DBE7B"/>`,
  harbor: `<rect width="120" height="120" fill="#BFE0F0"/><rect y="68" width="120" height="52" fill="#4A90D9"/><path d="M0 80q10-6 20 0t20 0 20 0 20 0 20 0 20 0" fill="none" stroke="#9BD1FF" stroke-width="3"/><path d="M78 62V30L100 62Z" fill="#fff" stroke="#17324D" stroke-width="2"/><path d="M70 64H108L102 74H76Z" fill="#8A5A2B" stroke="#17324D" stroke-width="2"/><circle cx="20" cy="22" r="9" fill="#F6D04D"/>`,
});

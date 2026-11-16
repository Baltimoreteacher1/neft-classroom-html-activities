// Language Expeditions encounters art: the obstacle on each land's trail, the character who stands at each trailhead,
// the word-card collectibles and the small pictures on a word card. Flat original vector drawings in world units (the
// world is 1000 units tall, the ground line is y = 790; see language-expeditions-world.js). Palette: lab navy, teal,
// amber, off-white, coral, plus neutral browns, greens and stone. No violet, purple, magenta or indigo.
//
// Positions live here (not in the world module) so the explore loop, the plan and the world painter share one source.

const GROUND = 790;
const LW = 4000;
/** Where the obstacle stands in land k: halfway between the first and second stop. */
export const obstacleX = (k) => k * LW + (k < 2 ? 1800 : 2150);
/** How far before (or after) the obstacle the explorer stops when it is still closed. */
export const OB_GAP = 210;
/** Where land k's character stands: just past the trailhead. */
export const charX = (k) => k * LW + 520;
/** Two of the seven collectibles in every land are word cards (collectible index n within the land). */
export const WORD_SLOTS = [1, 4];
export const wordSlot = (gemId) => WORD_SLOTS.indexOf(Number(String(gemId).split("-")[1]));

// ── obstacles (local units: centred on x = 0, standing on y = GROUND) ─────────────────────
const OBSTACLES = {
  "3-5": [
    // a fallen log with a broken branch
    `<rect x="-130" y="${GROUND - 92}" width="250" height="92" rx="46" fill="#6b4a30"/><ellipse cx="118" cy="${GROUND - 46}" rx="22" ry="46" fill="#b48a5e"/><ellipse cx="118" cy="${GROUND - 46}" rx="12" ry="26" fill="none" stroke="#7a5536" stroke-width="5"/><path d="M-40 ${GROUND - 90}l-30 -60M-60 ${GROUND - 128}l-22 -6" stroke="#5a3f2b" stroke-width="12" stroke-linecap="round"/><circle cx="-84" cy="${GROUND - 160}" r="16" fill="#3f7a4f"/><path d="M-110 ${GROUND - 40}h60M10 ${GROUND - 60}h70" stroke="#4e3522" stroke-width="5" stroke-linecap="round"/>`,
    // a locked library door with a pull rope
    `<path d="M-110 ${GROUND}V560Q0 470 110 560V${GROUND}Z" fill="#8d8a82"/><path d="M-76 ${GROUND}V575Q0 505 76 575V${GROUND}Z" fill="#6e4a2e"/><path d="M-38 ${GROUND}V540M0 ${GROUND}V520M38 ${GROUND}V540" stroke="#4e3522" stroke-width="6"/><rect x="-46" y="600" width="70" height="40" rx="6" fill="#f7f4ec"/><path d="M-36 614h50M-36 626h36" stroke="#17324d" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="690" r="12" fill="#f2c15b"/><rect x="45" y="690" width="10" height="20" fill="#f2c15b"/><path d="M90 560Q96 620 88 690" stroke="#d9c49a" stroke-width="8" fill="none"/><circle cx="88" cy="698" r="10" fill="#d9c49a"/>`,
    // a rope bridge pulled up between two posts
    `<rect x="-128" y="560" width="22" height="230" fill="#5a3f2b"/><rect x="106" y="560" width="22" height="230" fill="#5a3f2b"/><path d="M-117 568L117 568" stroke="#d9c49a" stroke-width="7"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${-96 + i * 33}" y="${578 + (i % 2) * 6}" width="26" height="150" rx="4" fill="#9a6a3e"/>`).join("")}<path d="M-117 600Q0 760 117 600" stroke="#d9c49a" stroke-width="6" fill="none"/>`,
    // a tide gate: a wooden sluice between stone posts, with its crank wheel
    `<path d="M-160 ${GROUND + 2}H160V${GROUND + 40}H-160Z" fill="#2b5c86"/><rect x="-140" y="540" width="44" height="250" fill="#8d8a82"/><rect x="96" y="540" width="44" height="250" fill="#8d8a82"/><rect x="-96" y="580" width="192" height="210" fill="#7a5536"/>${[0, 1, 2, 3].map((i) => `<path d="M-96 ${620 + i * 46}H96" stroke="#4e3522" stroke-width="6"/>`).join("")}<circle cx="0" cy="545" r="34" fill="none" stroke="#17324d" stroke-width="9"/><path d="M-34 545H34M0 511V579" stroke="#17324d" stroke-width="6"/>`,
  ],
  "6-8": [
    // a rockslide
    `<path d="M-170 ${GROUND}L-120 690L-60 640L-10 560L50 600L110 650L170 ${GROUND}Z" fill="#7a5a48"/><ellipse cx="-80" cy="${GROUND - 40}" rx="60" ry="42" fill="#8a6a52"/><ellipse cx="40" cy="${GROUND - 60}" rx="74" ry="58" fill="#6b4636"/><ellipse cx="-10" cy="620" rx="42" ry="32" fill="#9a7a60"/><ellipse cx="120" cy="${GROUND - 26}" rx="40" ry="28" fill="#8a6a52"/><path d="M-20 600l20 20M60 700l18 -14" stroke="#4a2e22" stroke-width="5" stroke-linecap="round"/>`,
    // the Archive gate: bars, and a keypad on its right post
    `<rect x="-130" y="520" width="24" height="270" fill="#5a2f25"/><rect x="106" y="520" width="24" height="270" fill="#5a2f25"/><rect x="-106" y="540" width="212" height="14" fill="#2a3a48"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${-96 + i * 38}" y="554" width="10" height="236" fill="#2a3a48"/>`).join("")}<rect x="114" y="620" width="54" height="76" rx="6" fill="#f7f4ec" stroke="#2a3a48" stroke-width="4"/>${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${122 + c * 14}" y="${632 + r * 18}" width="10" height="12" fill="#1fa6a2"/>`).join("")).join("")}`,
    // a wall of wind and blowing sand
    `<ellipse cx="0" cy="${GROUND - 120}" rx="140" ry="130" fill="#e8d3a8" opacity=".35"/><g class="lexp-ob-gust" fill="none" stroke="#f7f4ec" stroke-width="10" stroke-linecap="round" opacity=".75"><path d="M-130 560q60 -30 120 0t120 0"/><path d="M-150 640q60 -30 120 0t120 0"/><path d="M-120 720q60 -30 120 0t120 0"/></g>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${-120 + i * 40}" cy="${600 + ((i * 53) % 160)}" r="7" fill="#c7ad7c"/>`).join("")}`,
    // a locked supply hatch: a reinforced crate with a hatch wheel and padlock
    `<rect x="-120" y="590" width="240" height="200" rx="10" fill="#6e5a48"/><path d="M-120 640H120M-120 740H120" stroke="#2a3a48" stroke-width="10"/><circle cx="0" cy="690" r="46" fill="#8a7460" stroke="#2a3a48" stroke-width="8"/><path d="M-46 690H46M0 644V736" stroke="#2a3a48" stroke-width="6"/><rect x="62" y="660" width="34" height="30" rx="4" fill="#f2c15b"/><path d="M68 660v-12a11 11 0 0 1 22 0v12" stroke="#f2c15b" stroke-width="6" fill="none"/>`,
  ],
};

// ── characters (local units: feet at 0,0, about 220 tall) ─────────────────────────────────
const skin = "#c98b5a";
const skinDk = "#8d5a3b";
const person = (coat, hat, extra = "", face = skin) =>
  `<rect x="-26" y="-70" width="18" height="70" rx="8" fill="#2a3a48"/><rect x="8" y="-70" width="18" height="70" rx="8" fill="#2a3a48"/><rect x="-40" y="-160" width="80" height="100" rx="24" fill="${coat}"/><circle cx="0" cy="-188" r="30" fill="${face}"/><circle cx="-10" cy="-190" r="4" fill="#17324d"/><circle cx="10" cy="-190" r="4" fill="#17324d"/><path d="M-10 -176q10 8 20 0" stroke="#17324d" stroke-width="3" fill="none" stroke-linecap="round"/>${hat}${extra}`;
const CHARS = {
  "3-5": [
    // the fox, sitting
    `<path d="M30 -10Q80 -30 70 -80Q60 -40 20 -30Z" fill="#e2762f" stroke="#fff6e8" stroke-width="4"/><path d="M-40 0Q-50 -90 0 -110Q50 -90 40 0Z" fill="#e2762f"/><path d="M-18 0Q0 -60 18 0Z" fill="#fff6e8"/><circle cx="0" cy="-130" r="34" fill="#e2762f"/><path d="M-30 -150l-8 -36 28 22ZM30 -150l8 -36 -28 22Z" fill="#c45f22"/><path d="M-22 -122q22 26 44 0Z" fill="#fff6e8"/><circle cx="-12" cy="-136" r="4" fill="#2b1a10"/><circle cx="12" cy="-136" r="4" fill="#2b1a10"/><circle cx="0" cy="-120" r="5" fill="#2b1a10"/>`,
    // the owl on a stack of books
    `<rect x="-50" y="-30" width="100" height="30" fill="#c94f3b"/><rect x="-44" y="-56" width="88" height="26" fill="#1fa6a2"/><ellipse cx="0" cy="-120" rx="44" ry="62" fill="#8a5f3c"/><ellipse cx="0" cy="-104" rx="28" ry="40" fill="#d9c49a"/><circle cx="-16" cy="-150" r="15" fill="#f7f4ec"/><circle cx="16" cy="-150" r="15" fill="#f7f4ec"/><circle cx="-16" cy="-150" r="7" fill="#17324d"/><circle cx="16" cy="-150" r="7" fill="#17324d"/><path d="M-5 -136l5 10 5 -10Z" fill="#f2c15b"/><path d="M-40 -176l14 16M40 -176l-14 16" stroke="#8a5f3c" stroke-width="10" stroke-linecap="round"/>`,
    // the canyon bird on a rock
    `<path d="M-60 0Q-50 -50 0 -54Q50 -50 60 0Z" fill="#7d7a73"/><ellipse cx="0" cy="-90" rx="36" ry="30" fill="#f2c15b"/><circle cx="26" cy="-118" r="20" fill="#f2c15b"/><circle cx="32" cy="-122" r="4" fill="#17324d"/><path d="M44 -118l18 6 -18 6Z" fill="#c94f3b"/><path d="M-30 -96Q-70 -110 -64 -76Q-44 -80 -30 -84Z" fill="#c94f3b"/><path d="M-6 -60v12M8 -60v12" stroke="#5a3f2b" stroke-width="4"/>`,
    // the lighthouse keeper with a lantern
    person(
      "#17324d",
      `<path d="M-32 -206Q0 -236 32 -206Z" fill="#f7f4ec"/><rect x="-36" y="-208" width="72" height="8" rx="4" fill="#f7f4ec"/>`,
      `<path d="M40 -120q24 10 24 34" stroke="#17324d" stroke-width="12" fill="none" stroke-linecap="round"/><rect x="52" y="-90" width="26" height="34" rx="6" fill="#f2c15b"/><circle cx="65" cy="-73" r="22" fill="#f2c15b" opacity=".3"/>`,
      skinDk,
    ),
  ],
  "6-8": [
    // the ranger: wide-brimmed hat, teal uniform, radio
    person(
      "#126e6c",
      `<ellipse cx="0" cy="-212" rx="50" ry="10" fill="#8a5f3c"/><path d="M-26 -212Q0 -246 26 -212Z" fill="#8a5f3c"/>`,
      `<rect x="20" y="-140" width="14" height="26" rx="3" fill="#2a3a48"/><rect x="25" y="-156" width="3" height="16" fill="#2a3a48"/>`,
    ),
    // the archivist: cardigan, glasses, a rolled map
    person(
      "#8a5f3c",
      `<path d="M-30 -200Q0 -232 30 -200Q20 -214 0 -216Q-20 -214 -30 -200Z" fill="#6d7e90"/>`,
      `<circle cx="-11" cy="-190" r="9" fill="none" stroke="#17324d" stroke-width="3"/><circle cx="11" cy="-190" r="9" fill="none" stroke="#17324d" stroke-width="3"/><rect x="-60" y="-128" width="120" height="18" rx="9" fill="#f7f4ec" stroke="#d9c49a" stroke-width="4"/>`,
      skinDk,
    ),
    // the cave guide: helmet with a lamp, coral jacket, rope
    person(
      "#c94f3b",
      `<path d="M-32 -200Q0 -240 32 -200Z" fill="#f2c15b"/><rect x="-36" y="-204" width="72" height="8" rx="4" fill="#f2c15b"/><circle cx="0" cy="-216" r="7" fill="#f7f4ec"/>`,
      `<circle cx="-26" cy="-96" r="18" fill="none" stroke="#d9c49a" stroke-width="7"/>`,
    ),
    // the station engineer: hard hat, navy overalls, wrench
    person(
      "#17324d",
      `<path d="M-32 -200Q0 -240 32 -200Z" fill="#f2c15b"/><rect x="-38" y="-204" width="76" height="9" rx="4" fill="#f2c15b"/>`,
      `<rect x="-24" y="-150" width="48" height="10" fill="#1fa6a2"/><path d="M40 -110l30 -30" stroke="#6d7e90" stroke-width="10" stroke-linecap="round"/><circle cx="74" cy="-144" r="10" fill="none" stroke="#6d7e90" stroke-width="7"/>`,
      skinDk,
    ),
  ],
};
const bandKey = (band) => (band === "6-8" ? "6-8" : "3-5");

/** Obstacles and characters for the near layer of the world (decorative; the walk panel carries the words). */
export function encounterArt(band) {
  const b = bandKey(band);
  let out = "";
  for (let k = 0; k < 4; k += 1) {
    out += `<g class="lexp-char" data-char="${k}" transform="translate(${charX(k)} ${GROUND})">${CHARS[b][k]}</g>`;
    out += `<g class="lexp-ob" data-ob="${k}"><g transform="translate(${obstacleX(k)} 0)">${OBSTACLES[b][k]}</g></g>`;
  }
  return out;
}

/** A character drawn as a small portrait for the talk panel. */
export const portrait = (band, k) =>
  `<svg class="lexp-talk-pic" viewBox="-90 -250 180 262" aria-hidden="true" focusable="false">${CHARS[bandKey(band)][k] || ""}</svg>`;

/** A word-card collectible (replaces the firefly/spark look for the two word slots). Keeps data-gem so paint() hides it. */
export const wordGemMark = (g, band) => {
  const edge = bandKey(band) === "6-8" ? "#1fa6a2" : "#f2c15b";
  return `<g class="lexp-gem lexp-wgem" data-gem="${g.id}" transform="translate(${g.x} ${g.y})"><circle r="40" fill="${edge}" opacity=".28"/><g transform="rotate(-8)"><rect x="-24" y="-30" width="48" height="60" rx="7" fill="#f7f4ec" stroke="${edge}" stroke-width="5"/><text y="9" text-anchor="middle" font-size="26" font-weight="700" font-family="system-ui, sans-serif" fill="#17324d">Aa</text></g></g>`;
};

// ── word-card pictures (80 x 80) ──────────────────────────────────────────────────────────
const WORD_ART = {
  firefly: `<rect width="80" height="80" fill="#17324d"/><circle cx="40" cy="44" r="22" fill="#f2c15b" opacity=".3"/><ellipse cx="40" cy="36" rx="9" ry="12" fill="#5a3f2b"/><ellipse cx="40" cy="52" rx="8" ry="9" fill="#ffe9a0"/><path d="M32 32q-14 -10 -16 4M48 32q14 -10 16 4" stroke="#bfe9e6" stroke-width="4" fill="none"/>`,
  bridge: `<rect width="80" height="80" fill="#dcecf3"/><rect y="56" width="80" height="24" fill="#2b5c86"/><path d="M4 44H76V52H4Z" fill="#8a5f3c"/><path d="M10 52V64M70 52V64" stroke="#5a3f2b" stroke-width="6"/><path d="M4 30Q40 50 76 30" stroke="#d9c49a" stroke-width="3" fill="none"/>`,
  ladder: `<rect width="80" height="80" fill="#f7f4ec"/><path d="M26 6L22 76M54 6L58 76" stroke="#8a5f3c" stroke-width="6" stroke-linecap="round"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${25 - i * 0.6} ${16 + i * 14}H${55 + i * 0.6}" stroke="#8a5f3c" stroke-width="5"/>`).join("")}`,
  roof: `<rect width="80" height="80" fill="#dcecf3"/><rect x="18" y="40" width="44" height="34" fill="#f7f4ec"/><path d="M8 42L40 14L72 42Z" fill="#c94f3b"/><rect x="34" y="54" width="12" height="20" fill="#8a5f3c"/>`,
  ledge: `<rect width="80" height="80" fill="#dcecf3"/><path d="M0 80V10H44V40H72V50H44V80Z" fill="#7d7a73"/><path d="M50 40q8 -8 16 0Z" fill="#8a5f3c"/><circle cx="54" cy="38" r="3" fill="#f7f4ec"/>`,
  waterfall: `<rect width="80" height="80" fill="#dcecf3"/><path d="M0 80V20H30V80ZM50 80V20H80V80Z" fill="#7d7a73"/><path d="M30 20H50V70H30Z" fill="#8fd0ea"/><ellipse cx="40" cy="72" rx="26" ry="7" fill="#2b5c86"/>`,
  beacon: `<rect width="80" height="80" fill="#17324d"/><path d="M40 20L74 6V34Z" fill="#f2c15b" opacity=".45"/><path d="M32 76L36 26H44L48 76Z" fill="#f7f4ec"/><path d="M34 46H46M33 60H47" stroke="#c94f3b" stroke-width="6"/><rect x="34" y="18" width="12" height="10" fill="#f2c15b"/>`,
  keeper: `<rect width="80" height="80" fill="#f7f4ec"/><circle cx="40" cy="26" r="12" fill="#8d5a3b"/><rect x="26" y="40" width="28" height="34" rx="10" fill="#17324d"/><rect x="56" y="48" width="12" height="16" rx="3" fill="#f2c15b"/>`,
  ridge: `<rect width="80" height="80" fill="#f3c38a"/><path d="M0 70L20 40L34 46L50 24L66 36L80 30V80H0Z" fill="#b0603f"/><path d="M20 40L34 46L50 24L66 36L80 30" stroke="#f7f4ec" stroke-width="3" fill="none"/>`,
  flood: `<rect width="80" height="80" fill="#dcecf3"/><rect x="14" y="30" width="22" height="30" fill="#f7f4ec"/><path d="M10 32L25 18L40 32Z" fill="#c94f3b"/><path d="M0 50Q20 44 40 50T80 50V80H0Z" fill="#2b5c86"/><path d="M48 40v14" stroke="#3f9b5f" stroke-width="5"/>`,
  archive: `<rect width="80" height="80" fill="#f7f4ec"/><rect x="12" y="12" width="56" height="62" fill="#8a5f3c"/>${[0, 1, 2].map((r) => [0, 1].map((c) => `<rect x="${18 + c * 24}" y="${18 + r * 18}" width="20" height="14" fill="#d9a07a"/><rect x="${25 + c * 24}" y="${24 + r * 18}" width="6" height="3" fill="#17324d"/>`).join("")).join("")}`,
  settlement: `<rect width="80" height="80" fill="#f3c38a"/><rect y="60" width="80" height="20" fill="#b0603f"/>${[8, 32, 56].map((x, i) => `<rect x="${x}" y="${44 - i * 4}" width="18" height="${16 + i * 4}" fill="#e8d3a8"/><path d="M${x - 3} ${44 - i * 4}L${x + 9} ${34 - i * 4}L${x + 21} ${44 - i * 4}Z" fill="#9a4f3a"/>`).join("")}`,
  erosion: `<rect width="80" height="80" fill="#f3c38a"/><path d="M10 80V30Q30 20 40 40Q50 56 70 34V80Z" fill="#a0614a"/><path d="M2 24q10 -6 20 0t20 0M6 36q10 -6 20 0" stroke="#f7f4ec" stroke-width="3" fill="none"/>${[0, 1, 2].map((i) => `<circle cx="${50 + i * 8}" cy="${66 + i * 3}" r="2.5" fill="#e8d3a8"/>`).join("")}`,
  hollow: `<rect width="80" height="80" fill="#f3c38a"/><path d="M6 80Q10 20 40 16Q70 20 74 80Z" fill="#8a4a36"/><path d="M22 80Q26 40 40 38Q54 40 58 80Z" fill="#2a140c"/>`,
  evidence: `<rect width="80" height="80" fill="#f7f4ec"/><rect x="12" y="10" width="40" height="54" rx="4" fill="#dcecf3" stroke="#17324d" stroke-width="3"/><path d="M18 22H44M18 32H44M18 42H36" stroke="#17324d" stroke-width="3"/><circle cx="52" cy="50" r="13" fill="none" stroke="#126e6c" stroke-width="5"/><path d="M61 59L72 70" stroke="#126e6c" stroke-width="6" stroke-linecap="round"/>`,
  signal: `<rect width="80" height="80" fill="#17324d"/><rect x="36" y="38" width="8" height="34" fill="#f7f4ec"/><circle cx="40" cy="34" r="6" fill="#1fa6a2"/><path d="M28 24a17 17 0 0 0 0 20M52 24a17 17 0 0 1 0 20M20 16a28 28 0 0 0 0 36M60 16a28 28 0 0 1 0 36" stroke="#1fa6a2" stroke-width="4" fill="none" stroke-linecap="round"/>`,
};
export const hasWordArt = (key) => key in WORD_ART;
export const wordPic = (key) =>
  `<svg class="lexp-word-pic" viewBox="0 0 80 80" aria-hidden="true" focusable="false">${WORD_ART[key] || ""}</svg>`;

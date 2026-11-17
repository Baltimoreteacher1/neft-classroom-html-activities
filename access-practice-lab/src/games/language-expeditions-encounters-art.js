// Language Expeditions encounters art: the obstacle on each land's trail, the character who stands at each trailhead,
// the word-card collectibles and the small pictures on a word card. Flat original vector drawings in world units (the
// world is 1000 units tall, the ground line is y = 790; see language-expeditions-world.js), in the site illustration
// kit's style: flat layered shapes, a lit side and a shade side, soft contact shadows, no dark outlines; people are the
// kit's person(). Id-free (portraits repeat the same art). Palette: Deep Harbor navy, teal, amber, ivory, coral, plus
// neutral browns, greens and stone. No violet, purple, magenta or indigo.
//
// Positions live here (not in the world module) so the explore loop, the plan and the world painter share one source.

import { HAIR, SKIN, noDefs, person } from "../art/kit.js";

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

// ── obstacles (local units: centred on x = 0, standing on y = GROUND). Light from the right. ───────────────────
const sh = (x, rx, o = 0.32) => `<ellipse cx="${x}" cy="${GROUND + 4}" rx="${rx}" ry="${(rx * 0.09).toFixed(1)}" fill="#050d16" opacity="${o}"/>`;
/** A filled ring (a wheel or a coil) without a stroke: outer disc with the hole cut out. */
const ring = (cx, cy, r, w, fill) =>
  `<path d="M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0ZM${cx - r + w} ${cy}a${r - w} ${r - w} 0 1 1 ${(r - w) * 2} 0a${r - w} ${r - w} 0 1 1 ${-(r - w) * 2} 0Z" fill="${fill}" fill-rule="evenodd"/>`;
const OBSTACLES = {
  "3-5": [
    // a fallen log with a broken branch
    `${sh(0, 150)}<rect x="-130" y="${GROUND - 92}" width="250" height="92" rx="46" fill="#5a3d27"/><rect x="-118" y="${GROUND - 92}" width="236" height="40" rx="20" fill="#7a5536"/><path d="M-100 ${GROUND - 70}h70M-20 ${GROUND - 30}h80M30 ${GROUND - 64}h50" stroke="#3f2a1a" stroke-width="5" stroke-linecap="round" opacity=".6"/><ellipse cx="118" cy="${GROUND - 46}" rx="22" ry="46" fill="#c49a6c"/><ellipse cx="120" cy="${GROUND - 46}" rx="13" ry="28" fill="#a87a50"/><ellipse cx="121" cy="${GROUND - 46}" rx="5" ry="11" fill="#c49a6c"/><path d="M-46 ${GROUND - 86}l-30 -62 12 -4 28 58Z" fill="#5a3d27"/><path d="M-66 ${GROUND - 130}l-24 -8 3 -10 26 8Z" fill="#5a3d27"/><ellipse cx="-86" cy="${GROUND - 162}" rx="18" ry="14" fill="#2f6b4f"/><ellipse cx="-80" cy="${GROUND - 167}" rx="10" ry="7" fill="#4f8f5b"/><ellipse cx="-60" cy="${GROUND - 4}" rx="26" ry="8" fill="#2f5a3a"/><ellipse cx="70" cy="${GROUND - 2}" rx="20" ry="7" fill="#2f5a3a"/>`,
    // a locked library door with a pull rope
    `${sh(0, 130)}<path d="M-110 ${GROUND}V560Q0 470 110 560V${GROUND}Z" fill="#6f7f8c"/><path d="M40 516Q90 528 110 560V${GROUND}H76V575Q66 548 40 536Z" fill="#94a3ae"/><path d="M-110 640h34M-110 720h34M76 660h34M76 740h34" stroke="#4c5b67" stroke-width="3" opacity=".6"/><path d="M-76 ${GROUND}V575Q0 505 76 575V${GROUND}Z" fill="#6e4a2e"/><path d="M0 ${GROUND}V538Q40 546 76 575V${GROUND}Z" fill="#87603e"/><path d="M-38 ${GROUND}V545M0 ${GROUND}V532M38 ${GROUND}V545" stroke="#4e3522" stroke-width="5" opacity=".7"/><rect x="-46" y="602" width="70" height="40" rx="6" fill="#1c2f4a" opacity=".2"/><rect x="-46" y="598" width="70" height="40" rx="6" fill="#f7f4ec"/><path d="M-36 612h50M-36 624h36" stroke="#17324d" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="690" r="12" fill="#f2c15b"/><rect x="45" y="690" width="10" height="20" rx="2" fill="#d99a2b"/><circle cx="53" cy="687" r="4" fill="#fff3c4" opacity=".7"/><path d="M90 560Q96 620 88 690" stroke="#d9c49a" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M92 566Q97 620 90 686" stroke="#f2e6c6" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="88" cy="698" r="10" fill="#c7ad7c"/><circle cx="91" cy="695" r="4" fill="#f2e6c6"/>`,
    // a rope bridge pulled up between two posts
    `${sh(-117, 30)}${sh(117, 30)}<rect x="-128" y="560" width="22" height="230" fill="#46301f"/><rect x="-117" y="560" width="11" height="230" fill="#6b4a30"/><rect x="106" y="560" width="22" height="230" fill="#46301f"/><rect x="117" y="560" width="11" height="230" fill="#6b4a30"/><rect x="-132" y="552" width="30" height="12" rx="4" fill="#8a6343"/><rect x="102" y="552" width="30" height="12" rx="4" fill="#8a6343"/><path d="M-117 568L117 568" stroke="#d9c49a" stroke-width="7" stroke-linecap="round"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${-96 + i * 33}" y="${578 + (i % 2) * 6}" width="26" height="150" rx="4" fill="#8a5c34"/><rect x="${-84 + i * 33}" y="${578 + (i % 2) * 6}" width="14" height="150" rx="4" fill="#a8743f"/><path d="M${-90 + i * 33} ${600 + (i % 2) * 6}v100" stroke="#6b4426" stroke-width="2" opacity=".5"/>`).join("")}<path d="M-117 600Q0 760 117 600" stroke="#d9c49a" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    // a tide gate: a wooden sluice between stone posts, with its crank wheel
    `<path d="M-160 ${GROUND + 2}H160V${GROUND + 40}H-160Z" fill="#2b5c86"/><path d="M-130 ${GROUND + 16}h60M30 ${GROUND + 26}h80" stroke="#8fc1d8" stroke-width="4" stroke-linecap="round" opacity=".6"/><rect x="-140" y="540" width="44" height="250" fill="#6f7f8c"/><rect x="-118" y="540" width="22" height="250" fill="#94a3ae"/><rect x="96" y="540" width="44" height="250" fill="#6f7f8c"/><rect x="118" y="540" width="22" height="250" fill="#94a3ae"/><rect x="-96" y="580" width="192" height="210" fill="#6b4a30"/><rect x="20" y="580" width="76" height="210" fill="#87603e"/>${[0, 1, 2, 3].map((i) => `<rect x="-96" y="${617 + i * 46}" width="192" height="6" fill="#46301f" opacity=".7"/>`).join("")}<rect x="-8" y="545" width="16" height="40" fill="#3a4a58"/>${ring(0, 545, 34, 9, "#3a4a58")}<path d="M-30 542H30V548H-30ZM-3 515H3V575H-3Z" fill="#3a4a58"/><path d="M8 516a30 30 0 0 1 22 18" stroke="#8fa2b1" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  ],
  "6-8": [
    // a rockslide
    `${sh(0, 180, 0.35)}<path d="M-170 ${GROUND}L-120 690L-60 640L-10 560L50 600L110 650L170 ${GROUND}Z" fill="#6e4a3a"/><path d="M-10 560L50 600L110 650L170 ${GROUND}H60Z" fill="#8a6650"/><ellipse cx="-80" cy="${GROUND - 40}" rx="60" ry="42" fill="#7a5a48"/><ellipse cx="-66" cy="${GROUND - 54}" rx="38" ry="24" fill="#9a7a60"/><ellipse cx="40" cy="${GROUND - 60}" rx="74" ry="58" fill="#5e3c2e"/><ellipse cx="58" cy="${GROUND - 78}" rx="46" ry="32" fill="#7f5440"/><ellipse cx="-10" cy="620" rx="42" ry="32" fill="#8a6a52"/><ellipse cx="2" cy="610" rx="24" ry="16" fill="#ab8a6c"/><ellipse cx="120" cy="${GROUND - 26}" rx="40" ry="28" fill="#7a5a48"/><ellipse cx="130" cy="${GROUND - 36}" rx="24" ry="14" fill="#9a7a60"/><path d="M-20 600l20 20M60 700l18 -14" stroke="#4a2e22" stroke-width="5" stroke-linecap="round" opacity=".6"/>${[-140, -110, 150, 160].map((x, i) => `<ellipse cx="${x}" cy="${GROUND - 6}" rx="${10 + i * 2}" ry="7" fill="#8a6a52"/>`).join("")}`,
    // the Archive gate: bars, and a keypad on its right post
    `${sh(0, 140)}<rect x="-130" y="520" width="24" height="270" fill="#5a2f25"/><rect x="-118" y="520" width="12" height="270" fill="#7a4232"/><rect x="106" y="520" width="24" height="270" fill="#5a2f25"/><rect x="118" y="520" width="12" height="270" fill="#7a4232"/><rect x="-106" y="540" width="212" height="14" fill="#2a3a48"/><rect x="-106" y="540" width="212" height="4" fill="#4d6273"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${-96 + i * 38}" y="554" width="10" height="236" fill="#2a3a48"/><rect x="${-91 + i * 38}" y="554" width="4" height="236" fill="#4d6273"/>`).join("")}<rect x="116" y="624" width="54" height="76" rx="6" fill="#1c2f4a" opacity=".25"/><rect x="114" y="620" width="54" height="76" rx="6" fill="#e9e4d8"/><rect x="114" y="620" width="54" height="10" rx="5" fill="#f7f4ec"/>${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${122 + c * 14}" y="${634 + r * 18}" width="10" height="12" rx="2" fill="#1fa6a2"/>`).join("")).join("")}<rect x="96" y="640" width="22" height="26" rx="2" fill="#fff6d6" transform="rotate(-6 107 653)"/>`,
    // a wall of wind and blowing sand
    `<ellipse cx="0" cy="${GROUND - 120}" rx="140" ry="130" fill="#e8d3a8" opacity=".35"/><ellipse cx="20" cy="${GROUND - 150}" rx="90" ry="80" fill="#f3e2bd" opacity=".3"/><g class="lexp-ob-gust" fill="none" stroke="#f7f4ec" stroke-width="10" stroke-linecap="round" opacity=".75"><path d="M-130 560q60 -30 120 0t120 0"/><path d="M-150 640q60 -30 120 0t120 0"/><path d="M-120 720q60 -30 120 0t120 0"/></g>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<ellipse cx="${-120 + i * 40}" cy="${600 + ((i * 53) % 160)}" rx="9" ry="5" fill="#c7ad7c"/>`).join("")}`,
    // a locked supply hatch: a reinforced crate with a hatch wheel and padlock
    `${sh(0, 140)}<rect x="-120" y="590" width="240" height="200" rx="10" fill="#5e4a3a"/><rect x="30" y="590" width="90" height="200" rx="10" fill="#7a6450"/><rect x="-120" y="590" width="240" height="12" rx="6" fill="#8a7460"/><rect x="-120" y="635" width="240" height="10" fill="#2a3a48"/><rect x="-120" y="735" width="240" height="10" fill="#2a3a48"/><circle cx="0" cy="690" r="46" fill="#8a7460"/><circle cx="8" cy="682" r="30" fill="#9e8670" opacity=".6"/>${ring(0, 690, 46, 8, "#2a3a48")}<path d="M-42 687H42V693H-42ZM-3 648H3V732H-3Z" fill="#2a3a48"/><path d="M68 660v-12a11 11 0 0 1 22 0v12" stroke="#c98b2a" stroke-width="6" fill="none"/><rect x="62" y="660" width="34" height="30" rx="4" fill="#f2c15b"/><rect x="80" y="660" width="16" height="30" rx="4" fill="#d99a2b"/><circle cx="79" cy="673" r="3.5" fill="#5a3826"/>`,
  ],
};

// ── characters (local units: feet at 0,0, about 230 tall). People are the site kit's person(), so every face on the
// site shares one family; they face left, toward the explorer arriving from the trailhead. ─────────────────────
const HEAD = -206; // head centre in local units for an adult of that height
const human = (o, hat = "", extra = "") => noDefs(() => person(0, 0, 230, { age: "adult", facing: -1, ...o })) + hat + extra;
const lanternItem = `<path d="M0 0v3" stroke="#3a4a58" stroke-width="1.2"/><rect x="-4.5" y="3" width="9" height="11" rx="2" fill="#f2c15b"/><rect x="-2.5" y="5" width="5" height="7" rx="1" fill="#fff3c4"/><rect x="-5" y="2.5" width="10" height="2" rx="1" fill="#3a4a58"/>`;
const radioItem = `<rect x="-3.5" y="-9" width="7" height="12" rx="1.5" fill="#2a3a48"/><rect x="-1" y="-15" width="1.2" height="7" fill="#2a3a48"/><circle cx="0" cy="-5" r="1.3" fill="#1fa6a2"/>`;
const mapItem = `<rect x="-18" y="-3" width="15" height="7" rx="3.5" fill="#f7f4ec"/><rect x="-18" y="-3" width="15" height="2.5" rx="1.2" fill="#ffffff"/><ellipse cx="-3" cy="0.5" rx="2" ry="3.5" fill="#d9c49a"/>`;
const wrenchItem = `<g transform="rotate(-50)"><rect x="-1.6" y="-2" width="3.2" height="16" rx="1.5" fill="#8fa2b1"/><path d="M-4.5 14a4.5 4.5 0 1 0 9 0l-2 -2h-5Z" fill="#8fa2b1"/></g>`;
const CHARS = {
  "3-5": [
    // the fox, sitting
    `${sh(0, 60)}<path d="M28 -6Q86 -14 78 -76Q74 -44 30 -34Z" fill="#c45f22"/><path d="M62 -64Q80 -70 78 -82Q70 -66 56 -60Z" fill="#fff6e8"/><path d="M-40 0Q-50 -90 0 -110Q50 -90 40 0Z" fill="#c45f22"/><path d="M-8 0Q-22 -86 6 -106Q46 -86 40 0Z" fill="#e2762f"/><path d="M-18 0Q0 -64 18 0Z" fill="#fff6e8"/><ellipse cx="-20" cy="-4" rx="12" ry="6" fill="#3a2418"/><ellipse cx="18" cy="-4" rx="12" ry="6" fill="#3a2418"/><circle cx="0" cy="-130" r="34" fill="#e2762f"/><path d="M-34 -130A34 34 0 0 1 0 -164V-96A34 34 0 0 1 -34 -130Z" fill="#c45f22" opacity=".5"/><path d="M-30 -150l-8 -36 28 22ZM30 -150l8 -36 -28 22Z" fill="#c45f22"/><path d="M-27 -156l-4 -18 12 10ZM27 -156l4 -18 -12 10Z" fill="#fff6e8" opacity=".8"/><path d="M-24 -124q24 30 48 0Q24 -112 0 -116Q-24 -112 -24 -124Z" fill="#fff6e8"/><circle cx="-12" cy="-136" r="4" fill="#2b1a10"/><circle cx="12" cy="-136" r="4" fill="#2b1a10"/><circle cx="-10.5" cy="-137.5" r="1.3" fill="#ffffff"/><circle cx="13.5" cy="-137.5" r="1.3" fill="#ffffff"/><ellipse cx="0" cy="-118" rx="6" ry="4.5" fill="#2b1a10"/><ellipse cx="-20" cy="-124" rx="5" ry="3" fill="#f2a07a" opacity=".5"/><ellipse cx="20" cy="-124" rx="5" ry="3" fill="#f2a07a" opacity=".5"/>`,
    // the owl on a stack of books
    `${sh(0, 64)}<rect x="-50" y="-30" width="100" height="30" rx="3" fill="#a8432f"/><rect x="-50" y="-30" width="100" height="8" rx="3" fill="#c94f3b"/><rect x="40" y="-28" width="8" height="26" fill="#f7f4ec" opacity=".8"/><rect x="-44" y="-56" width="88" height="26" rx="3" fill="#178a87"/><rect x="-44" y="-56" width="88" height="7" rx="3" fill="#1fa6a2"/><rect x="34" y="-54" width="8" height="22" fill="#f7f4ec" opacity=".8"/><path d="M-30 -176l12 22 -18 4ZM30 -176l-12 22 18 4Z" fill="#6e4a2e"/><ellipse cx="0" cy="-120" rx="44" ry="62" fill="#6e4a2e"/><ellipse cx="8" cy="-124" rx="34" ry="56" fill="#8a5f3c"/><ellipse cx="0" cy="-102" rx="28" ry="40" fill="#d9c49a"/><path d="M-14 -110q4 4 8 0M2 -100q4 4 8 0M-10 -86q4 4 8 0M6 -76q4 4 8 0" stroke="#b39b6e" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M-44 -120q-12 30 4 60l10 -50Z" fill="#5a3d27"/><path d="M44 -120q12 30 -4 60l-10 -50Z" fill="#6e4a2e"/><circle cx="-16" cy="-150" r="16" fill="#f7f4ec"/><circle cx="16" cy="-150" r="16" fill="#f7f4ec"/><circle cx="-15" cy="-150" r="8" fill="#17324d"/><circle cx="17" cy="-150" r="8" fill="#17324d"/><circle cx="-12.5" cy="-153" r="2.6" fill="#ffffff"/><circle cx="19.5" cy="-153" r="2.6" fill="#ffffff"/><path d="M-6 -136l6 12 6 -12Z" fill="#f2c15b"/><ellipse cx="-14" cy="-58" rx="8" ry="4" fill="#d99a2b"/><ellipse cx="14" cy="-58" rx="8" ry="4" fill="#d99a2b"/>`,
    // the canyon bird on a rock
    `${sh(0, 64)}<path d="M-60 0Q-50 -50 0 -54Q50 -50 60 0Z" fill="#6f7f8c"/><path d="M0 -54Q50 -50 60 0H14Q20 -30 0 -54Z" fill="#94a3ae"/><path d="M-6 -60v12M8 -60v12" stroke="#5a3f2b" stroke-width="4" stroke-linecap="round"/><path d="M-36 -94Q-74 -100 -70 -70Q-50 -74 -34 -82Z" fill="#a8432f"/><ellipse cx="0" cy="-90" rx="36" ry="30" fill="#d99a2b"/><ellipse cx="6" cy="-96" rx="28" ry="22" fill="#f2c15b"/><ellipse cx="4" cy="-78" rx="20" ry="10" fill="#fbe3a0" opacity=".8"/><circle cx="26" cy="-118" r="20" fill="#f2c15b"/><path d="M6 -118A20 20 0 0 1 26 -138V-98A20 20 0 0 1 6 -118Z" fill="#d99a2b" opacity=".5"/><path d="M14 -136q8 -14 16 -4q-8 -2 -16 4Z" fill="#c94f3b"/><circle cx="32" cy="-122" r="4" fill="#17324d"/><circle cx="33.4" cy="-123.4" r="1.3" fill="#ffffff"/><path d="M44 -120l18 5 -18 7Z" fill="#c94f3b"/><path d="M-30 -96Q-60 -100 -56 -78Q-42 -82 -28 -86Z" fill="#c94f3b"/>`,
    // the lighthouse keeper with a lantern
    human(
      { skin: SKIN[4], hair: HAIR[5], hairStyle: "short", beard: HAIR[5], top: "#123a5c", coat: "#123a5c", bottom: "#2a3a48", item: lanternItem, pose: "stand" },
      `<rect x="-27" y="${HEAD - 40}" width="54" height="24" rx="9" fill="#f7f4ec"/><rect x="6" y="${HEAD - 40}" width="21" height="24" rx="9" fill="#d9d3c4"/><rect x="-25" y="${HEAD - 22}" width="50" height="8" rx="2" fill="#123a5c"/><path d="M-26 ${HEAD - 14}h20q-6 8 -24 6Z" fill="#0c2840"/><circle cx="0" cy="${HEAD - 30}" r="3.5" fill="#f2c15b"/>`,
      `<circle cx="-32" cy="-70" r="24" fill="#f2c15b" opacity=".22"/>`,
    ),
  ],
  "6-8": [
    // the ranger: wide-brimmed hat, teal uniform, radio
    human(
      { skin: SKIN[2], hair: HAIR[1], hairStyle: "bun", top: "#126e6c", bottom: "#5a4a3a", item: radioItem, pose: "think" },
      `<ellipse cx="0" cy="${HEAD - 14}" rx="48" ry="9" fill="#6e4a2e"/><path d="M-24 ${HEAD - 14}Q-20 ${HEAD - 48} 0 ${HEAD - 48}Q20 ${HEAD - 48} 24 ${HEAD - 14}Z" fill="#8a5f3c"/><path d="M0 ${HEAD - 48}Q20 ${HEAD - 48} 24 ${HEAD - 14}H6Z" fill="#6e4a2e" opacity=".6"/><rect x="-24" y="${HEAD - 22}" width="48" height="6" fill="#4a3220"/>`,
    ),
    // the archivist: cardigan, glasses, a rolled map
    human({ skin: SKIN[4], hair: HAIR[5], hairStyle: "curly", top: "#8a5f3c", coat: "#8a5f3c", bottom: "#3e4a5c", glasses: true, item: mapItem, pose: "hold", age: "elder" }),
    // the cave guide: helmet with a lamp, coral jacket, rope
    human(
      { skin: SKIN[1], hair: HAIR[3], hairStyle: "braid", top: "#c94f3b", bottom: "#2f4858", pose: "stand" },
      `<path d="M-27 ${HEAD - 4}Q-26 ${HEAD - 40} 0 ${HEAD - 40}Q26 ${HEAD - 40} 27 ${HEAD - 4}Z" fill="#f2c15b"/><path d="M0 ${HEAD - 40}Q26 ${HEAD - 40} 27 ${HEAD - 4}H8Z" fill="#d99a2b" opacity=".7"/><rect x="-31" y="${HEAD - 8}" width="62" height="7" rx="3.5" fill="#d99a2b"/><circle cx="-6" cy="${HEAD - 26}" r="8" fill="#f7f4ec"/><circle cx="-6" cy="${HEAD - 26}" r="16" fill="#fff6d6" opacity=".3"/>`,
      `${ring(22, -112, 18, 6, "#c7ad7c")}<path d="M10 -124a18 18 0 0 1 22 -4" stroke="#e8d9b4" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    ),
    // the station engineer: hard hat, navy overalls, wrench
    human(
      { skin: SKIN[3], hair: "#2f6b7a", hairStyle: "hijab", top: "#123a5c", bottom: "#123a5c", apron: "#1f4f72", item: wrenchItem, pose: "stand" },
      `<path d="M-28 ${HEAD - 6}Q-27 ${HEAD - 42} 0 ${HEAD - 42}Q27 ${HEAD - 42} 28 ${HEAD - 6}Z" fill="#f2c15b"/><path d="M0 ${HEAD - 42}Q27 ${HEAD - 42} 28 ${HEAD - 6}H8Z" fill="#d99a2b" opacity=".7"/><rect x="-4" y="${HEAD - 42}" width="8" height="36" fill="#d99a2b"/><rect x="-36" y="${HEAD - 10}" width="72" height="8" rx="4" fill="#d99a2b"/>`,
      `<rect x="-20" y="-150" width="40" height="8" fill="#1fa6a2"/>`,
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
  const deep = bandKey(band) === "6-8" ? "#178a87" : "#d99a2b";
  return `<g class="lexp-gem lexp-wgem" data-gem="${g.id}" transform="translate(${g.x} ${g.y})"><circle r="40" fill="${edge}" opacity=".28"/><g transform="rotate(-8)"><rect x="-22" y="-26" width="48" height="60" rx="7" fill="#050d16" opacity=".25"/><rect x="-24" y="-30" width="48" height="60" rx="7" fill="#f7f4ec"/><rect x="-24" y="-30" width="48" height="12" rx="6" fill="${edge}"/><rect x="-24" y="-22" width="48" height="4" fill="${deep}"/><rect x="10" y="-18" width="14" height="48" rx="6" fill="#e6dfcf" opacity=".7"/><text y="17" text-anchor="middle" font-size="24" font-weight="700" font-family="system-ui, sans-serif" fill="#17324d">Aa</text></g></g>`;
};

// ── word-card pictures (80 x 80) ──────────────────────────────────────────────────────────
const night = (fill = "#17324d") => `<rect width="80" height="80" fill="${fill}"/><rect y="48" width="80" height="32" fill="#1d3d5c" opacity=".6"/>`;
const day = (top = "#cfe6f0", low = "#e8f3f6") => `<rect width="80" height="80" fill="${low}"/><rect width="80" height="44" fill="${top}"/>`;
const dusk = `<rect width="80" height="80" fill="#f6d2a2"/><rect width="80" height="40" fill="#f3c38a"/>`;
const WORD_ART = {
  firefly: `${night()}<circle cx="40" cy="48" r="24" fill="#f2c15b" opacity=".2"/><circle cx="40" cy="50" r="14" fill="#ffe9a0" opacity=".35"/><path d="M33 30q-16 -12 -19 3q8 6 19 1Z" fill="#bfe9e6" opacity=".8"/><path d="M47 30q16 -12 19 3q-8 6 -19 1Z" fill="#bfe9e6" opacity=".65"/><ellipse cx="40" cy="36" rx="9" ry="12" fill="#5a3f2b"/><ellipse cx="42" cy="34" rx="5" ry="8" fill="#7a5536"/><circle cx="40" cy="24" r="6" fill="#3a2a1e"/><ellipse cx="40" cy="52" rx="8" ry="9" fill="#ffe9a0"/><circle cx="38" cy="49" r="3" fill="#fffbe8"/>`,
  bridge: `${day()}<rect y="56" width="80" height="24" fill="#2b5c86"/><path d="M8 66h20M46 72h22" stroke="#8fc1d8" stroke-width="2.5" stroke-linecap="round"/><rect x="8" y="50" width="6" height="16" fill="#5a3f2b"/><rect x="66" y="50" width="6" height="16" fill="#5a3f2b"/><rect x="4" y="44" width="72" height="8" fill="#8a5f3c"/><rect x="4" y="44" width="72" height="3" fill="#b07c4c"/><path d="M4 30Q40 50 76 30" stroke="#c7ad7c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M16 36V44M28 41V44M52 41V44M64 36V44" stroke="#c7ad7c" stroke-width="2"/>`,
  ladder: `${day("#e8f3f6", "#f7f4ec")}<rect y="70" width="80" height="10" fill="#d9c49a"/><ellipse cx="40" cy="74" rx="26" ry="3" fill="#1c2f4a" opacity=".18"/><path d="M26 6L22 74M54 6L58 74" stroke="#8a5f3c" stroke-width="6" stroke-linecap="round"/><path d="M28 6L24 74M56 6L60 74" stroke="#b07c4c" stroke-width="2" stroke-linecap="round"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${25 - i * 0.6} ${16 + i * 14}H${55 + i * 0.6}" stroke="#a8743f" stroke-width="5" stroke-linecap="round"/>`).join("")}`,
  roof: `${day()}<rect y="72" width="80" height="8" fill="#9fc79a"/><rect x="18" y="40" width="44" height="34" fill="#f1e4cf"/><rect x="44" y="40" width="18" height="34" fill="#dccbb0"/><path d="M8 42L40 14L72 42Z" fill="#c8553d"/><path d="M40 14L72 42H40Z" fill="#a8432f"/><path d="M8 42h64v4H8z" fill="#8f3a29"/><rect x="34" y="54" width="12" height="20" fill="#8a5f3c"/><rect x="22" y="48" width="9" height="9" fill="#a9d4e8"/>`,
  ledge: `${day()}<path d="M0 80V10H44V40H72V50H44V80Z" fill="#6f7f8c"/><path d="M30 10H44V40H72V44H38Z" fill="#94a3ae"/><path d="M44 50H72V52H44Z" fill="#4c5b67"/><path d="M8 30h20M6 58h28" stroke="#4c5b67" stroke-width="2" opacity=".5"/><path d="M50 40q8 -9 16 0Z" fill="#8a5f3c"/><circle cx="56" cy="37" r="2.6" fill="#f7f4ec"/><circle cx="61" cy="37" r="2.6" fill="#f7f4ec"/>`,
  waterfall: `${day()}<path d="M0 80V20H30V80ZM50 80V20H80V80Z" fill="#6f7f8c"/><path d="M18 20H30V80H22ZM68 20H80V80H72Z" fill="#94a3ae"/><path d="M30 20H50V70H30Z" fill="#8fd0ea"/><path d="M36 22V66M44 22V60" stroke="#e4f6fc" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="40" cy="72" rx="28" ry="8" fill="#2b5c86"/><ellipse cx="40" cy="70" rx="16" ry="4" fill="#bfe3f2"/>`,
  beacon: `${night()}<path d="M40 22L76 6V36Z" fill="#f2c15b" opacity=".45"/><path d="M40 22L4 10V34Z" fill="#f2c15b" opacity=".25"/><ellipse cx="40" cy="76" rx="16" ry="3" fill="#050d16" opacity=".4"/><path d="M32 76L36 26H44L48 76Z" fill="#f7f4ec"/><path d="M40 26H44L48 76H42Z" fill="#cfd6dc"/><path d="M34 46H46M33 60H47" stroke="#c94f3b" stroke-width="6"/><rect x="34" y="17" width="12" height="10" fill="#f2c15b"/><rect x="34" y="17" width="12" height="10" fill="#fff3c4" opacity=".5"/><path d="M33 17h14l-7 -6Z" fill="#c94f3b"/>`,
  keeper: `${day("#e8f3f6", "#f7f4ec")}<ellipse cx="40" cy="76" rx="20" ry="3" fill="#1c2f4a" opacity=".18"/><rect x="26" y="40" width="28" height="36" rx="10" fill="#123a5c"/><rect x="42" y="40" width="12" height="36" rx="6" fill="#0c2840"/><path d="M34 40l6 6 6 -6Z" fill="#f7f4ec"/><circle cx="40" cy="27" r="12" fill="#7d4b2e"/><path d="M40 15A12 12 0 0 1 40 39A8 12 0 0 0 40 15Z" fill="#5f3720" opacity=".5"/><path d="M28 22Q40 6 52 22Z" fill="#f7f4ec"/><rect x="26" y="20" width="28" height="4" rx="2" fill="#123a5c"/><circle cx="36" cy="28" r="1.4" fill="#1d2b3a"/><circle cx="44" cy="28" r="1.4" fill="#1d2b3a"/><path d="M36 33q4 3 8 0" stroke="#3a2418" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="62" cy="56" r="11" fill="#f2c15b" opacity=".3"/><rect x="56" y="48" width="12" height="16" rx="3" fill="#f2c15b"/><rect x="59" y="51" width="6" height="10" rx="2" fill="#fff3c4"/>`,
  ridge: `${dusk}<path d="M0 72L20 44L34 50L50 26L66 38L80 32V80H0Z" fill="#e2a27a" opacity=".6"/><path d="M0 76L20 46L34 52L50 28L66 40L80 34V80H0Z" fill="#b0603f"/><path d="M50 28L66 40L80 34V80H58L54 40Z" fill="#c97a52"/><path d="M20 46L34 52L50 28L66 40L80 34" stroke="#f7e2c4" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
  flood: `${day()}<rect x="14" y="30" width="22" height="30" fill="#f1e4cf"/><rect x="28" y="30" width="8" height="30" fill="#dccbb0"/><path d="M10 32L25 18L40 32Z" fill="#c8553d"/><path d="M25 18L40 32H25Z" fill="#a8432f"/><path d="M0 50Q20 44 40 50T80 50V80H0Z" fill="#2b5c86"/><path d="M6 60q8 -3 16 0M44 66q8 -3 16 0M24 72q8 -3 16 0" stroke="#8fc1d8" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M50 50v-12" stroke="#3f9b5f" stroke-width="3" stroke-linecap="round"/><path d="M50 40q-8 -6 -10 2q6 2 10 -2Z" fill="#5fbf7a"/>`,
  archive: `${day("#efe6d6", "#f7f4ec")}<ellipse cx="40" cy="76" rx="30" ry="3" fill="#1c2f4a" opacity=".18"/><rect x="12" y="12" width="56" height="62" fill="#6e4a2e"/><rect x="54" y="12" width="14" height="62" fill="#87603e"/>${[0, 1, 2].map((r) => [0, 1].map((c) => `<rect x="${18 + c * 24}" y="${18 + r * 18}" width="20" height="14" fill="#d9a07a"/><rect x="${18 + c * 24}" y="${18 + r * 18}" width="20" height="3" fill="#ecc09c"/><rect x="${25 + c * 24}" y="${25 + r * 18}" width="6" height="3" rx="1" fill="#17324d"/>`).join("")).join("")}`,
  settlement: `${dusk}<rect y="60" width="80" height="20" fill="#b0603f"/><rect y="60" width="80" height="3" fill="#c97a52"/>${[8, 32, 56].map((x, i) => `<rect x="${x}" y="${44 - i * 4}" width="18" height="${16 + i * 4}" fill="#e8d3a8"/><rect x="${x + 12}" y="${44 - i * 4}" width="6" height="${16 + i * 4}" fill="#cdb489"/><path d="M${x - 3} ${44 - i * 4}L${x + 9} ${34 - i * 4}L${x + 21} ${44 - i * 4}Z" fill="#9a4f3a"/><rect x="${x + 6}" y="52" width="5" height="8" fill="#6e3428"/>`).join("")}`,
  erosion: `${dusk}<path d="M10 80V30Q30 20 40 40Q50 56 70 34V80Z" fill="#a0614a"/><path d="M40 40Q50 56 70 34V80H52Q56 60 40 40Z" fill="#c47a58"/><path d="M14 46h16M14 60h28" stroke="#7a4232" stroke-width="2" opacity=".5"/><path d="M2 24q10 -6 20 0t20 0M6 36q10 -6 20 0" stroke="#f7f4ec" stroke-width="3" fill="none" stroke-linecap="round"/>${[0, 1, 2].map((i) => `<ellipse cx="${50 + i * 8}" cy="${66 + i * 3}" rx="3" ry="2" fill="#e8d3a8"/>`).join("")}`,
  hollow: `${dusk}<path d="M6 80Q10 20 40 16Q70 20 74 80Z" fill="#8a4a36"/><path d="M40 16Q70 20 74 80H58Q60 40 40 16Z" fill="#b0603f"/><path d="M22 80Q26 40 40 38Q54 40 58 80Z" fill="#2a140c"/><path d="M40 38Q54 40 58 80H50Q50 50 40 38Z" fill="#4a2418"/>`,
  evidence: `${day("#efe6d6", "#f7f4ec")}<rect x="14" y="12" width="40" height="54" rx="4" fill="#1c2f4a" opacity=".15"/><rect x="12" y="10" width="40" height="54" rx="4" fill="#ffffff"/><rect x="12" y="10" width="40" height="8" rx="4" fill="#dcecf3"/><path d="M18 26H44M18 34H44M18 42H34" stroke="#17324d" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M61 59L72 70" stroke="#0d5856" stroke-width="7" stroke-linecap="round"/><circle cx="52" cy="50" r="13" fill="#126e6c"/><circle cx="52" cy="50" r="9" fill="#dff3f1"/><path d="M47 46a6 6 0 0 1 6 -3" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  signal: `${night()}<ellipse cx="40" cy="73" rx="12" ry="2.5" fill="#050d16" opacity=".4"/><rect x="36" y="38" width="8" height="34" fill="#f7f4ec"/><rect x="40" y="38" width="4" height="34" fill="#cfd6dc"/><circle cx="40" cy="34" r="12" fill="#1fa6a2" opacity=".25"/><circle cx="40" cy="34" r="6" fill="#1fa6a2"/><circle cx="38" cy="32" r="2" fill="#bff0ea"/><path d="M28 24a17 17 0 0 0 0 20M52 24a17 17 0 0 1 0 20M20 16a28 28 0 0 0 0 36M60 16a28 28 0 0 1 0 36" stroke="#1fa6a2" stroke-width="4" fill="none" stroke-linecap="round"/>`,
};
export const hasWordArt = (key) => key in WORD_ART;
export const wordPic = (key) =>
  `<svg class="lexp-word-pic" viewBox="0 0 80 80" aria-hidden="true" focusable="false">${WORD_ART[key] || ""}</svg>`;

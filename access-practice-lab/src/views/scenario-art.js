// Real-Life Scenarios art: every scene is drawn as inline SVG from its data. A place (wall, floor and a few props) plus
// characters built from a "look" (skin, hair style, shirt, accessory) and a mood. No images are loaded.
const e = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const PLACES = {
  office: {
    wall: "#e8eef7",
    floor: "#cdbf9f",
    props: `<rect x="40" y="70" width="120" height="70" rx="6" fill="#fffdf8" stroke="#9aa6d2"/><circle cx="100" cy="105" r="22" fill="#fff" stroke="#33447c" stroke-width="3"/><path d="M100 105 V90 M100 105 L112 110" stroke="#33447c" stroke-width="3"/><rect x="200" y="196" width="220" height="40" rx="6" fill="#a87b4f"/><rect x="215" y="180" width="60" height="18" rx="3" fill="#fff"/>`,
  },
  clinic: {
    wall: "#e2f3f0",
    floor: "#d9e3dd",
    props: `<rect x="40" y="60" width="90" height="70" rx="8" fill="#fff" stroke="#15969a"/><path d="M85 76 v38 M66 95 h38" stroke="#15969a" stroke-width="8"/><rect x="190" y="190" width="190" height="34" rx="10" fill="#fff" stroke="#91e2d6" stroke-width="3"/><rect x="190" y="224" width="12" height="30" fill="#9aa6d2"/><rect x="368" y="224" width="12" height="30" fill="#9aa6d2"/>`,
  },
  bus: {
    wall: "#f3dfa8",
    floor: "#7c8190",
    props: `<rect x="30" y="50" width="110" height="72" rx="8" fill="#bfe3f0" stroke="#33447c" stroke-width="3"/><rect x="170" y="50" width="110" height="72" rx="8" fill="#bfe3f0" stroke="#33447c" stroke-width="3"/><rect x="300" y="50" width="110" height="72" rx="8" fill="#bfe3f0" stroke="#33447c" stroke-width="3"/><rect x="40" y="170" width="80" height="60" rx="12" fill="#d28b58"/><rect x="460" y="170" width="80" height="60" rx="12" fill="#d28b58"/><path d="M590 20 V240" stroke="#9aa6d2" stroke-width="6"/>`,
  },
  store: {
    wall: "#fbefe3",
    floor: "#d9c6a6",
    props: `<rect x="30" y="60" width="170" height="14" fill="#a87b4f"/><rect x="30" y="110" width="170" height="14" fill="#a87b4f"/><rect x="44" y="34" width="26" height="26" fill="#d28b58"/><rect x="80" y="38" width="26" height="22" fill="#5a9481"/><rect x="120" y="32" width="30" height="28" fill="#a24f72"/><rect x="50" y="84" width="30" height="26" fill="#2e4a94"/><rect x="100" y="86" width="26" height="24" fill="#d28b58"/><rect x="230" y="190" width="200" height="50" rx="6" fill="#8d6b4a"/><rect x="250" y="172" width="50" height="20" rx="3" fill="#fff" stroke="#33447c"/>`,
  },
  lunch: {
    wall: "#fdf2d8",
    floor: "#e7d6b4",
    props: `<rect x="40" y="190" width="240" height="22" rx="8" fill="#a87b4f"/><rect x="60" y="212" width="12" height="40" fill="#7c5a37"/><rect x="250" y="212" width="12" height="40" fill="#7c5a37"/><rect x="70" y="176" width="70" height="14" rx="5" fill="#d28b58"/><rect x="170" y="176" width="70" height="14" rx="5" fill="#5a9481"/><rect x="380" y="50" width="160" height="60" rx="6" fill="#fff" stroke="#bdb4a6"/>`,
  },
  classroom: {
    wall: "#eceef8",
    floor: "#d6c9a8",
    props: `<rect x="40" y="36" width="260" height="100" rx="6" fill="#264e48"/><path d="M60 70 H200 M60 96 H160" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="360" y="190" width="120" height="14" rx="4" fill="#a87b4f"/><rect x="372" y="204" width="8" height="40" fill="#7c5a37"/><rect x="460" y="204" width="8" height="40" fill="#7c5a37"/>`,
  },
  phone: {
    wall: "#f8ebf0",
    floor: "#d8c3a5",
    props: `<rect x="30" y="170" width="180" height="70" rx="22" fill="#a24f72"/><rect x="40" y="150" width="160" height="40" rx="16" fill="#dba3b9"/><rect x="470" y="60" width="60" height="100" rx="8" fill="#fff" stroke="#33447c" stroke-width="3"/><circle cx="500" cy="145" r="6" fill="#33447c"/><rect x="330" y="96" width="90" height="60" rx="6" fill="#bfe3f0" stroke="#9aa6d2" stroke-width="3"/>`,
  },
  library: {
    wall: "#efe9e4",
    floor: "#cbb994",
    props: `<rect x="30" y="30" width="200" height="130" fill="#7c5a37"/><rect x="38" y="40" width="184" height="26" fill="#a87b4f"/><rect x="38" y="76" width="184" height="26" fill="#a87b4f"/><rect x="38" y="112" width="184" height="26" fill="#a87b4f"/><path d="M50 40 v26 M64 40 v26 M82 40 v26 M110 76 v26 M126 76 v26 M60 112 v26 M90 112 v26 M140 112 v26" stroke="#2e4a94" stroke-width="9"/><rect x="330" y="190" width="160" height="40" rx="6" fill="#a87b4f"/>`,
  },
  hallway: {
    wall: "#e9ebf5",
    floor: "#c9c3b6",
    props: `<rect x="20" y="40" width="46" height="150" rx="3" fill="#455a9a"/><rect x="70" y="40" width="46" height="150" rx="3" fill="#33447c"/><rect x="120" y="40" width="46" height="150" rx="3" fill="#455a9a"/><rect x="170" y="40" width="46" height="150" rx="3" fill="#33447c"/><circle cx="43" cy="110" r="4" fill="#fff"/><circle cx="93" cy="110" r="4" fill="#fff"/><circle cx="143" cy="110" r="4" fill="#fff"/><circle cx="193" cy="110" r="4" fill="#fff"/>`,
  },
  playground: {
    wall: "#cfeaf5",
    floor: "#8fc08a",
    props: `<circle cx="540" cy="50" r="26" fill="#f5d6a8"/><path d="M60 200 L130 80 L150 90 L96 200z" fill="#d28b58"/><rect x="130" y="76" width="40" height="10" fill="#7c5a37"/><path d="M170 86 V200" stroke="#7c5a37" stroke-width="8"/><path d="M300 200 q60 -80 120 0" fill="none" stroke="#a24f72" stroke-width="8"/>`,
  },
  pharmacy: {
    wall: "#e2f3f0",
    floor: "#d9e3dd",
    props: `<rect x="30" y="50" width="220" height="12" fill="#a87b4f"/><rect x="30" y="100" width="220" height="12" fill="#a87b4f"/><rect x="44" y="20" width="18" height="30" rx="4" fill="#d28b58"/><rect x="72" y="26" width="18" height="24" rx="4" fill="#5a9481"/><rect x="100" y="16" width="18" height="34" rx="4" fill="#2e4a94"/><rect x="50" y="72" width="18" height="28" rx="4" fill="#a24f72"/><rect x="290" y="190" width="220" height="44" rx="6" fill="#fff" stroke="#15969a" stroke-width="3"/>`,
  },
  home: {
    wall: "#fbefe3",
    floor: "#d8c3a5",
    props: `<rect x="40" y="160" width="200" height="76" rx="24" fill="#5a9481"/><rect x="52" y="140" width="176" height="40" rx="16" fill="#8fc08a"/><rect x="330" y="50" width="120" height="90" rx="6" fill="#bfe3f0" stroke="#9aa6d2" stroke-width="4"/><path d="M390 50 V140 M330 95 H450" stroke="#9aa6d2" stroke-width="4"/>`,
  },
  street: {
    wall: "#d5e6f2",
    floor: "#9aa0ab",
    props: `<rect x="20" y="30" width="110" height="170" fill="#d28b58"/><rect x="140" y="70" width="90" height="130" fill="#a24f72"/><rect x="250" y="20" width="120" height="180" fill="#455a9a"/><g fill="#fff"><rect x="34" y="48" width="20" height="24"/><rect x="74" y="48" width="20" height="24"/><rect x="34" y="96" width="20" height="24"/><rect x="74" y="96" width="20" height="24"/><rect x="268" y="40" width="20" height="24"/><rect x="310" y="40" width="20" height="24"/></g><path d="M420 232 H620 M440 246 H600" stroke="#fff" stroke-width="8" stroke-dasharray="22 14"/>`,
  },
};

const HAIR = {
  short: (h) =>
    `<path d="M-23 -4 Q-24 -32 0 -33 Q24 -32 23 -4 Q12 -20 0 -20 Q-12 -20 -23 -4z" fill="${h}"/>`,
  long: (h) =>
    `<path d="M-24 8 Q-27 -34 0 -34 Q27 -34 24 8 L26 34 L12 34 L12 -12 Q0 -24 -12 -12 L-12 34 L-26 34z" fill="${h}"/>`,
  curly: (h) =>
    `<g fill="${h}"><circle cx="-20" cy="-14" r="11"/><circle cx="-8" cy="-26" r="11"/><circle cx="8" cy="-26" r="11"/><circle cx="20" cy="-14" r="11"/><circle cx="-24" cy="2" r="8"/><circle cx="24" cy="2" r="8"/></g>`,
  bun: (h) =>
    `<circle cx="0" cy="-40" r="11" fill="${h}"/><path d="M-23 -4 Q-24 -32 0 -33 Q24 -32 23 -4 Q12 -20 0 -20 Q-12 -20 -23 -4z" fill="${h}"/>`,
  braids: (h) =>
    `<path d="M-23 -4 Q-24 -32 0 -33 Q24 -32 23 -4 Q12 -20 0 -20 Q-12 -20 -23 -4z" fill="${h}"/><rect x="-28" y="-4" width="8" height="46" rx="4" fill="${h}"/><rect x="20" y="-4" width="8" height="46" rx="4" fill="${h}"/>`,
  cap: (h) =>
    `<path d="M-24 -6 Q-24 -34 0 -34 Q24 -34 24 -6z" fill="${h}"/><path d="M-4 -8 H34 Q34 -2 22 -2 H-4z" fill="${h}"/>`,
  bald: () => "",
  ponytail: (h) =>
    `<path d="M-23 -4 Q-24 -32 0 -33 Q24 -32 23 -4 Q12 -20 0 -20 Q-12 -20 -23 -4z" fill="${h}"/><path d="M22 -20 Q44 -16 38 14 Q34 -6 20 -8z" fill="${h}"/>`,
  afro: (h) => `<circle cx="0" cy="-12" r="33" fill="${h}"/>`,
  hijab: (h) =>
    `<path d="M-30 14 Q-34 -38 0 -38 Q34 -38 30 14 Q30 38 20 40 L-20 40 Q-30 38 -30 14z" fill="${h}"/>`,
};
const MOUTH = {
  neutral: `<path d="M-7 12 H7" stroke="#3a2418" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  happy: `<path d="M-9 9 Q0 20 9 9" stroke="#3a2418" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  pleased: `<path d="M-8 10 Q0 17 8 10" stroke="#3a2418" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  puzzled: `<path d="M-8 14 q4 -5 8 0 t8 0" stroke="#3a2418" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  concerned: `<path d="M-8 15 Q0 8 8 15" stroke="#3a2418" stroke-width="3" stroke-linecap="round" fill="none"/>`,
};
const BROWS = {
  neutral: "",
  happy: "",
  pleased: "",
  puzzled: `<path d="M-14 -9 H-4 M4 -13 L14 -9" stroke="#3a2418" stroke-width="2.5" stroke-linecap="round"/>`,
  concerned: `<path d="M-14 -8 L-4 -11 M4 -11 L14 -8" stroke="#3a2418" stroke-width="2.5" stroke-linecap="round"/>`,
};

/** One character, centered at (x, y) of its feet, `s` = scale. Hair behind the head for long/afro/hijab, in front otherwise. */
export function characterSVG(look = {}, mood = "neutral", x = 0, y = 0, s = 1, flip = false) {
  const {
    skin = "#e0ac84",
    hair = "#2b1b12",
    style = "short",
    shirt = "#2f6f9f",
    acc = "none",
  } = look;
  const behind = ["long", "afro", "hijab"].includes(style);
  const hairSvg = (HAIR[style] || HAIR.short)(hair);
  const glasses =
    acc === "glasses"
      ? `<g fill="none" stroke="#1d2b58" stroke-width="2.5"><circle cx="-9" cy="-2" r="7"/><circle cx="9" cy="-2" r="7"/><path d="M-2 -2 H2"/></g>`
      : "";
  const phones =
    acc === "headphones"
      ? `<path d="M-26 -4 Q0 -48 26 -4" fill="none" stroke="#1d2b58" stroke-width="5"/><rect x="-32" y="-8" width="9" height="16" rx="4" fill="#1d2b58"/><rect x="23" y="-8" width="9" height="16" rx="4" fill="#1d2b58"/>`
      : "";
  const face = `<g><circle cx="0" cy="0" r="24" fill="${skin}"/><circle cx="-9" cy="-3" r="3" fill="#2b1b12"/><circle cx="9" cy="-3" r="3" fill="#2b1b12"/>${BROWS[mood] ?? ""}${MOUTH[mood] ?? MOUTH.neutral}</g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><rect x="-26" y="-6" width="52" height="64" rx="22" fill="${shirt}"/><rect x="-9" y="-6" width="18" height="12" rx="6" fill="${skin}"/><g transform="translate(0 -44)">${behind ? hairSvg : ""}${face}${behind ? "" : hairSvg}${glasses}${phones}</g></g>`;
}

/** The full scene picture: place, learner on the left, NPC (and optional second NPC) on the right. */
export function sceneSVG(scene, { mood = "neutral", who = "npc", learner = {}, label = "" } = {}) {
  const place = PLACES[scene.place] || PLACES.office;
  const npc = scene.npc;
  const npc2 = scene.npc2;
  const speaker = (k) => (who === k ? mood : "neutral");
  const chars = [
    characterSVG(learner, "neutral", 150, 202, 1.35),
    npc2 ? characterSVG(npc2.look, speaker("npc2"), 400, 202, 1.3, true) : "",
    characterSVG(npc.look, speaker("npc"), npc2 ? 500 : 470, 202, 1.35, true),
  ].join("");
  return `<svg class="scn-svg" viewBox="0 0 640 280" width="640" height="280" role="img" aria-label="${e(label || scene.title)}"><title>${e(label || scene.title)}</title><rect width="640" height="200" fill="${place.wall}"/><rect y="200" width="640" height="80" fill="${place.floor}"/>${place.props}${chars}</svg>`;
}

/** A small place thumbnail for hub cards. */
export const placeThumbSVG = (scene) => {
  const place = PLACES[scene.place] || PLACES.office;
  return `<svg class="scn-thumb" viewBox="0 0 640 280" width="160" height="70" aria-hidden="true" focusable="false"><rect width="640" height="200" fill="${place.wall}"/><rect y="200" width="640" height="80" fill="${place.floor}"/>${place.props}${characterSVG(scene.npc.look, "happy", 470, 202, 1.35, true)}</svg>`;
};

export const PLACE_IDS = Object.keys(PLACES);
export const LEARNER_LOOKS = [
  { skin: "#c68642", hair: "#2b1b12", style: "short", shirt: "#d28b58", acc: "none" },
  { skin: "#f1c9a5", hair: "#8a5a2b", style: "ponytail", shirt: "#2e4a94", acc: "none" },
  { skin: "#8d5524", hair: "#1b1b1b", style: "curly", shirt: "#5a9481", acc: "glasses" },
  { skin: "#e0ac84", hair: "#1b1b1b", style: "hijab", shirt: "#a24f72", acc: "none" },
  { skin: "#5c3a21", hair: "#1b1b1b", style: "braids", shirt: "#33447c", acc: "none" },
  { skin: "#f5d5b8", hair: "#c9892c", style: "cap", shirt: "#075568", acc: "headphones" },
];

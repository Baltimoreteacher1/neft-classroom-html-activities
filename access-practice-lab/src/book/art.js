// Book Studio art library: original inline SVG illustrations (flat editorial style, 2.5px #1b1f3b outlines, no text,
// no ids, no external refs). Characters are 200x300 full body, backgrounds 400x300 (cover-safe), the rest 200x200.

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
const NS = 'stroke="none"';

const svg = (vb, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><g fill="none" stroke="${D}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const sq = (b) => svg("0 0 200 200", b);
const tall = (b) => svg("0 0 200 300", b);
const wide = (b) => svg("0 0 400 300", b);
/** Subtle darker overlay for depth (no gradients allowed). */
const shade = (d, o = 0.12) => `<path d="${d}" fill="${D}" opacity="${o}" ${NS}/>`;
/** Outlined thick line: dark under-stroke plus a colored stroke on top. */
const band = (d, w, c) =>
  `<path d="${d}" stroke-width="${w + 5}"/><path d="${d}" stroke="${c}" stroke-width="${w}"/>`;
const dot = (x, y, r, c = D, o = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"${o < 1 ? ` opacity="${o}"` : ""} ${NS}/>`;
const r1 = (n) => Math.round(n * 10) / 10;
/** Star/burst polygon path. */
const burst = (cx, cy, R, r, n, rot = -90) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (180 / n) * i) * Math.PI) / 180;
    const rad = i % 2 ? r : R;
    d += `${i ? "L" : "M"}${r1(cx + rad * Math.cos(a))} ${r1(cy + rad * Math.sin(a))}`;
  }
  return `${d}Z`;
};

/* ---------- people ---------- */

const face = (x = 100, y = 80) =>
  dot(x - 11, y + 2, 3.3) +
  dot(x + 11, y + 2, 3.3) +
  `<path d="M${x - 7} ${y + 13}q7 6 14 0"/>` +
  dot(x - 19, y + 12, 5, CORAL, 0.3) +
  dot(x + 19, y + 12, 5, CORAL, 0.3);
const glasses = `<circle cx="89" cy="82" r="9.5"/><circle cx="111" cy="82" r="9.5"/><path d="M98.5 82h3M79.5 80l-9-3M120.5 80l9-3"/>`;
const groundShadow = (x = 100, rx = 50) =>
  `<ellipse cx="${x}" cy="283" rx="${rx}" ry="6" fill="${D}" opacity=".12" ${NS}/>`;

/**
 * Standing person, front view, head centered at (100,78).
 * o: skin, shirt, legs, shoes, under, skirt, top, hairBack, head, hairFront, over, hold (item drawn in the raised hand at ~155,114).
 */
function person(o) {
  const sk = o.skin;
  const sh = o.shirt;
  const armL = `<rect x="52" y="120" width="19" height="66" rx="9.5" fill="${sh}" transform="rotate(10 61 124)"/><circle cx="50" cy="189" r="8.5" fill="${sk}"/>`;
  const armR = o.hold
    ? `<rect x="129" y="120" width="19" height="44" rx="9.5" fill="${sh}" transform="rotate(-25 138 124)"/><rect x="146" y="116" width="18" height="48" rx="9" fill="${sh}"/>${o.hold}<circle cx="155" cy="116" r="8.5" fill="${sk}"/>${o.holdOver || ""}`
    : `<rect x="129" y="120" width="19" height="66" rx="9.5" fill="${sh}" transform="rotate(-10 139 124)"/><circle cx="150" cy="189" r="8.5" fill="${sk}"/>`;
  const head =
    o.head ??
    `<circle cx="70" cy="84" r="7" fill="${sk}"/><circle cx="130" cy="84" r="7" fill="${sk}"/><circle cx="100" cy="78" r="31" fill="${sk}"/>`;
  return tall(
    groundShadow() +
      (o.under || "") +
      `<rect x="78" y="188" width="21" height="82" rx="7" fill="${o.legs}"/><rect x="101" y="188" width="21" height="82" rx="7" fill="${o.legs}"/>` +
      `<path d="M99 266v10q0 5-5 5H72q-6 0-4-6q2-9 12-9z" fill="${o.shoes || NAVY}"/><path d="M101 266v10q0 5 5 5h22q6 0 4-6q-2-9-12-9z" fill="${o.shoes || NAVY}"/>` +
      (o.skirt || "") +
      armL +
      armR +
      (o.neck === false
        ? ""
        : `<rect x="91" y="100" width="18" height="20" rx="4" fill="${sk}"/>`) +
      `<path d="M68 134q0-20 22-20h20q22 0 22 20l-2 70H70z" fill="${sh}"/>` +
      shade("M118 115q14 4 14 19l-2 70h-12z") +
      (o.top ?? `<path d="M90 115l10 10l10-10"/>`) +
      (o.hairBack || "") +
      head +
      (o.hairFront || "") +
      face() +
      (o.over || ""),
  );
}

const curls = (pts, c) =>
  pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("");

const CHARACTERS = [
  {
    key: "char-maya",
    en: "Maya",
    es: "Maya",
    svg: person({
      skin: "#8d5524",
      shirt: CORAL,
      legs: TEAL,
      shoes: AMBER,
      top: `<path d="M90 115l10 10l10-10"/>${dot(100, 150, 9, AMBER, 0.9)}`,
      hairBack: curls(
        [
          [70, 92, 12],
          [68, 70, 14],
          [78, 50, 15],
          [100, 41, 17],
          [122, 50, 15],
          [132, 70, 14],
          [130, 92, 12],
        ],
        "#2b1a12",
      ),
      hairFront: curls(
        [
          [84, 56, 10],
          [100, 52, 10],
          [116, 56, 10],
        ],
        "#2b1a12",
      ),
    }),
  },
  {
    key: "char-leo",
    en: "Leo",
    es: "Leo",
    svg: person({
      skin: "#f1c27d",
      shirt: AQUA,
      legs: NAVY,
      shoes: CORAL,
      top: `<path d="M90 115l10 10l10-10"/><path d="M70 160h60" stroke="${IVORY}" stroke-width="6"/><path d="M70 176h60" stroke="${IVORY}" stroke-width="6"/>`,
      hairFront: `<path d="M68 82q-4-40 32-42q36 2 32 40q-6-14-14-18q-10 8-30 6q-14 0-20 14z" fill="#5a3a22"/>`,
      over: glasses,
    }),
  },
  {
    key: "char-amara",
    en: "Amara",
    es: "Amara",
    svg: person({
      skin: "#c68642",
      shirt: SAGE,
      legs: NAVY,
      shoes: COPPER,
      neck: false,
      top: `<path d="M70 200h60l3 22H67z" fill="${SAGE}"/>${shade("M118 200h12l3 22h-13z")}`,
      head: `<path d="M64 84q0-48 36-48t36 48q0 22-8 34q20 4 14 14H58q-6-10 14-14q-8-12-8-34z" fill="${ROSE}"/>${shade("M112 40q24 10 24 44q0 22-8 34q20 4 14 14h-26z", 0.15)}<ellipse cx="100" cy="85" rx="23" ry="27" fill="#c68642"/>`,
    }),
  },
  {
    key: "char-sam",
    en: "Sam",
    es: "Sam",
    svg: tall(
      groundShadow(100, 60) +
        `<circle cx="86" cy="236" r="42" stroke-width="8"/><circle cx="86" cy="236" r="42" stroke="${STEEL}" stroke-width="3"/><circle cx="86" cy="236" r="34" stroke-width="2"/>` +
        `<path d="M86 202v68M52 236h68M62 212l48 48M110 212l-48 48" stroke-width="1.6" opacity=".7"/>` +
        `<circle cx="86" cy="236" r="7" fill="${AQUA}"/>` +
        band("M62 112v88h76", 6, AQUA) +
        `<path d="M62 118h-10" stroke-width="7"/>` +
        band("M138 200l10 66h14", 4, AQUA) +
        `<circle cx="160" cy="278" r="7" fill="${D}"/>` +
        `<path d="M70 134q0-20 20-20h14q20 0 20 20l-2 66H72z" fill="${AMBER}"/>` +
        shade("M112 115q12 4 12 19l-2 66h-10z") +
        `<path d="M88 115l9 9l9-9"/>` +
        `<rect x="78" y="180" width="70" height="25" rx="12" fill="${NAVY}"/>` +
        `<rect x="126" y="190" width="22" height="70" rx="8" fill="${NAVY}"/>` +
        `<path d="M124 256h26q12 0 12 9v5h-38z" fill="${CORAL}"/>` +
        `<rect x="91" y="100" width="18" height="20" rx="4" fill="#5c3a21"/>` +
        `<circle cx="70" cy="84" r="7" fill="#5c3a21"/><circle cx="130" cy="84" r="7" fill="#5c3a21"/><circle cx="100" cy="78" r="31" fill="#5c3a21"/>` +
        `<path d="M68 76q-2-36 32-37q34 1 32 37q-10-12-32-14q-22 2-32 14z" fill="#1b1b22"/>` +
        face() +
        `<rect x="106" y="122" width="19" height="62" rx="9.5" fill="${AMBER}" transform="rotate(-8 115 126)"/><circle cx="121" cy="186" r="8.5" fill="#5c3a21"/>`,
    ),
  },
  {
    key: "char-kai",
    en: "Kai",
    es: "Kai",
    svg: person({
      skin: "#e0ac69",
      shirt: NAVY,
      legs: COPPER,
      shoes: IVORY,
      top: `<path d="M90 115l10 10l10-10"/><rect x="84" y="150" width="32" height="22" rx="6" fill="${AQUA}"/>`,
      hairFront: `<path d="M70 86q-4-10 0-18M130 86q4-10 0-18" stroke="#3a2418" stroke-width="5"/><path d="M68 64q0-30 32-30t32 30z" fill="${AMBER}"/>${shade("M100 34q32 0 32 30h-14q0-22-18-30z", 0.15)}<path d="M64 62q36 8 72 0q5 6-4 9q-32 6-64 0q-9-3-4-9z" fill="${AMBER}"/><circle cx="100" cy="34" r="3.5" fill="${CORAL}"/>`,
    }),
  },
  {
    key: "char-abuela",
    en: "Grandma",
    es: "Abuela",
    svg: person({
      skin: "#e0ac69",
      shirt: ROSE,
      legs: NAVY,
      shoes: COPPER,
      skirt: `<path d="M70 196h60l10 62H60z" fill="${TEAL}"/>${shade("M118 196h12l10 62h-14z")}`,
      top: `<path d="M100 116v86"/>${dot(106, 140, 2.5, IVORY)}${dot(106, 160, 2.5, IVORY)}${dot(106, 180, 2.5, IVORY)}<path d="M86 115l14 12l14-12" fill="${IVORY}"/>`,
      hairBack: `<circle cx="100" cy="43" r="13" fill="#cfccd6"/>`,
      hairFront: `<path d="M68 84q-4-40 32-40q36 0 32 40q-4-18-14-22q-10 6-18 0q-12 4-18 8q-8 4-14 14z" fill="#e2dfe8"/>`,
      over: glasses,
    }),
  },
  {
    key: "char-dad",
    en: "Dad",
    es: "Papá",
    svg: person({
      skin: "#5c3a21",
      shirt: TEAL,
      legs: NAVY,
      shoes: "#3a2418",
      top: `<path d="M88 115l12 11l12-11"/><path d="M100 126v76" opacity=".5"/>`,
      hairFront: `<path d="M69 76q-2-35 31-36q33 1 31 36q-6-16-31-18q-25 2-31 18z" fill="#1b1b22"/>`,
      over: `<path d="M70 86q2 28 30 28t30-28q-6 18-30 18t-30-18z" fill="#1b1b22"/>`,
    }),
  },
  {
    key: "char-mom",
    en: "Mom",
    es: "Mamá",
    svg: person({
      skin: "#f1c27d",
      shirt: CORAL,
      legs: "#c68642",
      shoes: ROSE,
      under: `<path d="M68 70q-10 70 2 92h60q12-22 2-92z" fill="#7a3a1a"/>`,
      skirt: `<path d="M70 196h60l10 50H60z" fill="${AMBER}"/>${shade("M118 196h12l10 50h-14z")}`,
      hairFront: `<path d="M68 84q-4-44 34-44q32 2 30 44q-14-6-22-24q-14 20-42 24z" fill="#7a3a1a"/>`,
      over: dot(70, 96, 3, AMBER) + dot(130, 96, 3, AMBER),
    }),
  },
  {
    key: "char-teacher",
    en: "Teacher",
    es: "Maestra",
    svg: person({
      skin: "#e0ac69",
      shirt: AQUA,
      legs: NAVY,
      shoes: COPPER,
      top: `<path d="M90 115h20l-4 88h-12z" fill="${IVORY}"/><path d="M90 115l10 10l10-10"/>`,
      under: `<path d="M66 78q0-40 34-40t34 40v28q-8 4-14 0V84H80v22q-6 4-14 0z" fill="#3a2418"/>`,
      hairFront: `<path d="M68 80q0-38 32-38t32 38q-22 0-32-16q-10 16-32 16z" fill="#3a2418"/>`,
      hold: `<path d="M136 92h36v42h-36z" fill="${CORAL}"/><path d="M141 92v42" opacity=".6"/><path d="M148 104h18M148 112h14" stroke="${IVORY}" stroke-width="2"/>`,
    }),
  },
  {
    key: "char-robot",
    en: "Robot guide",
    es: "Robot guía",
    svg: tall(
      groundShadow() +
        `<rect x="78" y="214" width="18" height="52" rx="6" fill="${STEEL}"/><rect x="104" y="214" width="18" height="52" rx="6" fill="${STEEL}"/>` +
        `<rect x="70" y="262" width="30" height="18" rx="7" fill="${NAVY}"/><rect x="100" y="262" width="30" height="18" rx="7" fill="${NAVY}"/>` +
        band("M64 142q-18 20-14 52", 10, STEEL) +
        band("M136 142q22-6 28-36", 10, STEEL) +
        `<circle cx="50" cy="198" r="9" fill="${AMBER}"/><circle cx="166" cy="100" r="9" fill="${AMBER}"/>` +
        `<rect x="88" y="112" width="24" height="14" rx="3" fill="${STEEL}"/>` +
        `<rect x="60" y="124" width="80" height="96" rx="18" fill="${AQUA}"/>` +
        shade("M122 125q17 2 17 18v59q0 17-17 17z") +
        `<rect x="78" y="146" width="44" height="34" rx="8" fill="${IVORY}"/>` +
        dot(90, 163, 5, CORAL) +
        dot(110, 163, 5, AMBER) +
        `<path d="M84 196h32" stroke-width="4"/>` +
        `<path d="M100 38v-14"/><circle cx="100" cy="20" r="7" fill="${AMBER}"/>` +
        `<rect x="56" y="58" width="12" height="28" rx="5" fill="${STEEL}"/><rect x="132" y="58" width="12" height="28" rx="5" fill="${STEEL}"/>` +
        `<rect x="62" y="38" width="76" height="72" rx="20" fill="${IVORY}"/>` +
        `<rect x="72" y="52" width="56" height="42" rx="12" fill="${NAVY}"/>` +
        dot(89, 70, 5, "#8fe0dc") +
        dot(111, 70, 5, "#8fe0dc") +
        `<path d="M92 81q8 6 16 0" stroke="#8fe0dc"/>`,
    ),
  },
  {
    key: "char-scientist",
    en: "Scientist",
    es: "Científica",
    svg: person({
      skin: "#8d5524",
      shirt: IVORY,
      legs: NAVY,
      shoes: TEAL,
      top: `<path d="M70 198h60l2 26H68z" fill="${IVORY}"/><path d="M90 115l10 24l10-24z" fill="${AQUA}"/><path d="M100 139v82M110 150h12" />${dot(94, 160, 2.5)}${dot(94, 180, 2.5)}`,
      hairBack: curls(
        [
          [72, 66, 12],
          [84, 50, 13],
          [100, 45, 14],
          [116, 50, 13],
          [128, 66, 12],
        ],
        "#1b1b22",
      ),
      hairFront: `<rect x="74" y="56" width="52" height="14" rx="7" fill="${AQUA}" fill-opacity=".75"/><path d="M100 57v12"/>`,
      hold: `<path d="M150 70h14v16l14 30q3 8-6 8h-30q-9 0-6-8l14-30z" fill="${IVORY}"/><path d="M143 108h28l5 10q2 6-5 6h-28q-7 0-5-6z" fill="${SAGE}"/>${dot(155, 100, 3, SAGE)}${dot(162, 92, 2, SAGE)}`,
    }),
  },
  {
    key: "char-reporter",
    en: "Reporter",
    es: "Reportera",
    svg: person({
      skin: "#f1c27d",
      shirt: NAVY,
      legs: "#3a3f5c",
      shoes: CORAL,
      top: `<path d="M88 115l12 30l12-30z" fill="${IVORY}"/><path d="M88 115l8 40M112 115l-8 40"/>`,
      under: `<path d="M124 56q34 6 26 52q-6-18-20-30z" fill="#4a2a18"/>`,
      hairFront: `<path d="M68 84q-4-44 32-44q36 0 32 44q-6-16-14-22q-24 4-42 0q-6 8-8 22z" fill="#4a2a18"/>`,
      hold: `<rect x="150" y="98" width="10" height="34" rx="3" fill="${D}"/><rect x="145" y="100" width="20" height="13" rx="2" fill="${CORAL}"/><circle cx="155" cy="88" r="12" fill="${STEEL}"/><path d="M147 84h16M146 91h18" opacity=".5"/>`,
    }),
  },
  {
    key: "char-detective",
    en: "Detective",
    es: "Detective",
    svg: person({
      skin: "#5c3a21",
      shirt: "#c79a5b",
      legs: NAVY,
      shoes: "#3a2418",
      top: `<path d="M70 198h60l2 28H68z" fill="#c79a5b"/><path d="M88 115l12 20l12-20" fill="${IVORY}"/><path d="M100 135v90M70 170h60" />${dot(92, 150, 2.5)}${dot(108, 150, 2.5)}`,
      hairFront: `<path d="M76 62q0-28 24-28t24 28z" fill="${COPPER}"/><path d="M76 56h48v6H76z" fill="${D}"/><path d="M62 62h76q4 0 2 6H60q-2-6 2-6z" fill="${COPPER}"/>`,
      hold: `<path d="M156 100l-2 22" stroke-width="9"/><path d="M156 100l-2 22" stroke="${COPPER}" stroke-width="5"/>`,
      holdOver: `<circle cx="160" cy="84" r="17" fill="${SKY}" fill-opacity=".6" stroke-width="5"/><circle cx="160" cy="84" r="17" stroke="${AMBER}" stroke-width="2.5"/><path d="M152 78q4-6 10-6" stroke="${IVORY}" stroke-width="3"/>`,
    }),
  },
  {
    key: "char-cat",
    en: "Cat",
    es: "Gato",
    svg: tall(
      groundShadow(100, 56) +
        band("M134 272q44 4 40-36q-2-22-20-18", 12, AMBER) +
        `<path d="M58 280q-8-74 42-104q50 30 42 104z" fill="${AMBER}"/>` +
        shade("M112 184q36 30 30 96h-22q4-60-8-96z") +
        `<path d="M78 280q-2-40 22-56q24 16 22 56z" fill="${IVORY}"/>` +
        `<path d="M64 236q10 2 14-6M136 236q-10 2-14-6M62 256q10 0 14-6" stroke="${COPPER}" stroke-width="4"/>` +
        `<path d="M66 130l-4-46l32 22zM134 130l4-46l-32 22z" fill="${AMBER}"/><path d="M68 112l-2-18l14 10zM132 112l2-18l-14 10z" fill="${CORAL}" opacity=".7"/>` +
        `<ellipse cx="100" cy="144" rx="44" ry="40" fill="${AMBER}"/>` +
        `<path d="M86 106q4 10 0 18M100 104v18M114 106q-4 10 0 18" stroke="${COPPER}" stroke-width="4"/>` +
        dot(86, 146, 4) +
        dot(114, 146, 4) +
        `<path d="M96 156h8l-4 5z" fill="${CORAL}"/><path d="M100 161q-4 6-9 4M100 161q4 6 9 4"/>` +
        `<path d="M76 158l-22-4M76 164l-20 4M124 158l22-4M124 164l20 4" stroke-width="1.8"/>` +
        dot(76, 162, 5, CORAL, 0.3) +
        dot(124, 162, 5, CORAL, 0.3),
    ),
  },
  {
    key: "char-dog",
    en: "Dog",
    es: "Perro",
    svg: tall(
      groundShadow(100, 58) +
        band("M136 250q30-4 34-36", 10, "#c98d55") +
        `<path d="M56 280q-6-80 44-100q50 20 44 100z" fill="#c98d55"/>` +
        shade("M112 184q36 24 32 96h-22q4-60-10-96z") +
        `<path d="M80 280q-2-46 20-60q22 14 20 60z" fill="${IVORY}"/>` +
        `<rect x="76" y="258" width="20" height="24" rx="9" fill="#c98d55"/><rect x="104" y="258" width="20" height="24" rx="9" fill="#c98d55"/>` +
        `<path d="M74 182q26 12 52 0" stroke-width="9"/><path d="M74 182q26 12 52 0" stroke="${CORAL}" stroke-width="5"/>${dot(100, 194, 6, AMBER)}` +
        `<ellipse cx="100" cy="136" rx="42" ry="40" fill="#c98d55"/>` +
        `<path d="M64 108q-24 6-18 50q4 14 18 4q6-24 6-46z" fill="${COPPER}"/><path d="M136 108q24 6 18 50q-4 14-18 4q-6-24-6-46z" fill="${COPPER}"/>` +
        `<ellipse cx="100" cy="158" rx="22" ry="17" fill="${IVORY}"/>` +
        `<ellipse cx="100" cy="150" rx="8" ry="6" fill="${D}"/>` +
        `<path d="M100 156v6M92 164q8 6 16 0"/>` +
        dot(84, 132, 4) +
        dot(116, 132, 4) +
        dot(78, 146, 5, CORAL, 0.3) +
        dot(122, 146, 5, CORAL, 0.3),
    ),
  },
  {
    key: "char-owl",
    en: "Owl",
    es: "Búho",
    svg: tall(
      band("M24 262h152", 10, COPPER) +
        `<path d="M150 262q10-14 22-12" stroke-width="4"/>` +
        `<ellipse cx="100" cy="188" rx="58" ry="76" fill="${TEAL}"/>` +
        shade("M112 114q46 16 46 74q0 60-46 74z", 0.15) +
        `<path d="M68 196q0-48 32-48t32 48q0 54-32 62q-32-8-32-62z" fill="${IVORY}"/>` +
        `<path d="M84 184q4 6 8 0q4 6 8 0q4 6 8 0q4 6 8 0M80 204q5 6 10 0q5 6 10 0q5 6 10 0q5 6 10 0M84 224q4 6 8 0q4 6 8 0q4 6 8 0q4 6 8 0" stroke="${SAGE}" stroke-width="2"/>` +
        `<path d="M44 168q-10 40 10 76q10-30 6-70z" fill="#0b4252"/><path d="M156 168q10 40-10 76q-10-30-6-70z" fill="#0b4252"/>` +
        `<path d="M50 112l2-34l24 20zM150 112l-2-34l-24 20z" fill="${TEAL}"/>` +
        `<circle cx="78" cy="124" r="20" fill="${IVORY}"/><circle cx="122" cy="124" r="20" fill="${IVORY}"/>` +
        dot(80, 126, 5) +
        dot(120, 126, 5) +
        `<path d="M93 136h14l-7 12z" fill="${AMBER}"/>` +
        `<path d="M84 264v-8M92 264v-8M108 264v-8M116 264v-8" stroke="${AMBER}" stroke-width="4"/>`,
    ),
  },
];

/* ---------- backgrounds (400x300, important detail in the central 60%) ---------- */

const base = (c) => `<rect width="400" height="300" fill="${c}" ${NS}/>`;
const cloud = (x, y, s = 1) =>
  `<path d="M${x} ${y}h${60 * s}q${10 * s} 0 ${10 * s}-${10 * s}t-${14 * s}-${12 * s}q-${4 * s}-${16 * s}-${22 * s}-${14 * s}q-${10 * s}-${10 * s}-${24 * s}-${2 * s}q-${16 * s} 0-${16 * s} ${14 * s}q-${8 * s} ${4 * s}-${4 * s} ${14 * s}z" fill="${IVORY}"/>`;
const tree = (x, y, s = 1, c = SAGE) =>
  `<rect x="${x - 6 * s}" y="${y - 30 * s}" width="${12 * s}" height="${32 * s}" rx="${3 * s}" fill="${COPPER}"/><circle cx="${x}" cy="${y - 48 * s}" r="${28 * s}" fill="${c}"/>${shade(`M${x + 6 * s} ${y - 75 * s}a${28 * s} ${28 * s} 0 0 1 0 ${54 * s}z`, 0.12)}`;
const pine = (x, y, s = 1, c = LEAF) =>
  `<rect x="${x - 5 * s}" y="${y - 16 * s}" width="${10 * s}" height="${18 * s}" fill="${COPPER}"/><path d="M${x} ${y - 100 * s}l${30 * s} ${50 * s}h-${12 * s}l${22 * s} ${36 * s}H${x - 40 * s}l${22 * s}-${36 * s}h-${12 * s}z" fill="${c}"/>`;

const BACKGROUNDS = [
  {
    key: "bg-classroom",
    en: "Classroom",
    es: "Salón de clases",
    svg: wide(
      base("#f3e3c3") +
        `<rect y="228" width="400" height="72" fill="#c98d55" ${NS}/><path d="M0 252h400M0 280h400" stroke="${COPPER}" opacity=".3"/>` +
        `<rect x="-4" y="220" width="408" height="10" fill="#e6cfa3"/>` +
        `<rect x="26" y="62" width="66" height="82" rx="3" fill="${SKY}"/><path d="M59 62v82M26 103h66"/>${cloud(32, 92, 0.5)}` +
        `<rect x="118" y="54" width="164" height="100" rx="5" fill="#a86a3e"/><rect x="127" y="62" width="146" height="82" rx="2" fill="#1f5f55"/>` +
        `<g stroke="${IVORY}" stroke-width="2" opacity=".85"><path d="M144 122l18-34l18 34z"/><circle cx="210" cy="100" r="14"/><path d="M240 86h20M240 100h14M240 114h22M150 132q20-6 40 0"/></g>` +
        `<rect x="118" y="152" width="164" height="7" rx="3" fill="#c98d55"/>` +
        `<circle cx="200" cy="30" r="13" fill="${IVORY}"/><path d="M200 22v8l6 4"/>` +
        `<rect x="306" y="110" width="72" height="112" fill="${COPPER}"/><path d="M306 148h72M306 186h72"/>` +
        `<g stroke-width="2"><rect x="314" y="122" width="10" height="26" fill="${CORAL}"/><rect x="326" y="118" width="10" height="30" fill="${AMBER}"/><rect x="338" y="124" width="10" height="24" fill="${AQUA}"/><rect x="314" y="160" width="12" height="26" fill="${NAVY}"/><rect x="328" y="164" width="10" height="22" fill="${SAGE}"/><rect x="350" y="166" width="20" height="20" fill="${ROSE}"/></g>` +
        `<path d="M354 110q-4-18 6-24q8 8 2 24" fill="${SAGE}"/>` +
        `<rect x="150" y="196" width="100" height="10" rx="3" fill="${AMBER}"/><path d="M160 206v34M240 206v34" stroke-width="5"/>` +
        `<path d="M168 196l4-8h16l4 8" fill="${CORAL}"/>`,
    ),
  },
  {
    key: "bg-city",
    en: "City street",
    es: "Calle de la ciudad",
    svg: wide(
      base(SKY) +
        cloud(60, 60, 0.8) +
        cloud(290, 44, 0.7) +
        `<rect x="10" y="110" width="70" height="140" fill="${ROSE}"/><rect x="80" y="70" width="72" height="180" fill="${TEAL}"/><rect x="152" y="96" width="64" height="154" fill="${AMBER}"/><rect x="216" y="56" width="78" height="194" fill="${NAVY}"/><rect x="294" y="100" width="70" height="150" fill="${CORAL}"/><rect x="364" y="130" width="50" height="120" fill="${SAGE}"/><rect x="-14" y="140" width="24" height="110" fill="${SAGE}"/>` +
        `<g fill="${IVORY}" opacity=".8" ${NS}>` +
        [
          [22, 124],
          [50, 124],
          [22, 154],
          [50, 154],
          [94, 86],
          [124, 86],
          [94, 118],
          [124, 118],
          [94, 150],
          [124, 150],
          [166, 110],
          [192, 110],
          [166, 142],
          [192, 142],
          [232, 72],
          [264, 72],
          [232, 104],
          [264, 104],
          [232, 136],
          [264, 136],
          [308, 116],
          [338, 116],
          [308, 148],
          [338, 148],
        ]
          .map(([x, y]) => `<rect x="${x}" y="${y}" width="16" height="20" rx="2"/>`)
          .join("") +
        `</g>` +
        `<rect x="236" y="190" width="38" height="60" fill="${AMBER}"/><path d="M255 190v60"/>` +
        `<rect y="246" width="400" height="16" fill="#d9d2c4"/><rect y="262" width="400" height="38" fill="#5b6178" ${NS}/>` +
        `<path d="M20 282h40M100 282h40M180 282h40M260 282h40M340 282h40" stroke="${IVORY}" stroke-width="4"/>` +
        tree(168, 250, 0.7) +
        `<path d="M118 246v-74" stroke-width="4"/><rect x="108" y="158" width="20" height="18" rx="4" fill="${AMBER}"/>`,
    ),
  },
  {
    key: "bg-park",
    en: "Park",
    es: "Parque",
    svg: wide(
      base(SKY) +
        `<circle cx="320" cy="60" r="26" fill="${AMBER}"/>` +
        cloud(70, 70, 0.9) +
        `<path d="M-10 190q110-60 230-10t200-10V300H-10z" fill="#a3cc9a"/>` +
        `<path d="M-10 220q140-40 260 0t160-10V300H-10z" fill="${SAGE}"/>` +
        `<path d="M170 300q20-50 60-80q20-10 50-10" stroke-width="27"/><path d="M170 300q20-50 60-80q20-10 50-10" stroke="#e6cfa3" stroke-width="22"/>` +
        tree(70, 230, 1.1) +
        tree(330, 214, 0.9, LEAF) +
        tree(250, 190, 0.6) +
        `<rect x="112" y="226" width="60" height="8" rx="3" fill="${CORAL}"/><rect x="112" y="210" width="60" height="8" rx="3" fill="${CORAL}"/><path d="M118 234v14M166 234v14" stroke-width="4"/>` +
        `<path d="M290 270q-4-12 6-14q6 10-6 14zM40 280q-4-12 6-14q6 10-6 14z" fill="${LEAF}"/>` +
        dot(210, 262, 4, CORAL) +
        dot(222, 272, 4, AMBER) +
        dot(360, 260, 4, ROSE),
    ),
  },
  {
    key: "bg-kitchen",
    en: "Kitchen",
    es: "Cocina",
    svg: wide(
      base("#fbe9cc") +
        `<g stroke="#e3caa0" stroke-width="1.5"><path d="M0 150h400M0 175h400M0 200h400M30 150v50M80 150v50M130 150v50M180 150v50M230 150v50M280 150v50M330 150v50M380 150v50"/></g>` +
        `<rect x="-4" y="30" width="120" height="80" rx="4" fill="${AQUA}"/><path d="M56 30v80"/><circle cx="48" cy="72" r="3" fill="${D}"/><circle cx="64" cy="72" r="3" fill="${D}"/>` +
        `<rect x="284" y="30" width="120" height="80" rx="4" fill="${AQUA}"/><path d="M344 30v80"/><circle cx="336" cy="72" r="3" fill="${D}"/><circle cx="352" cy="72" r="3" fill="${D}"/>` +
        `<rect x="150" y="34" width="100" height="78" rx="4" fill="${SKY}"/><path d="M200 34v78M150 73h100"/><rect x="144" y="110" width="112" height="8" rx="3" fill="${IVORY}"/>` +
        `<path d="M168 110l2-14h16l2 14z" fill="${CORAL}"/><path d="M178 96q-8-16 0-22q8 6 0 22" fill="${SAGE}"/>` +
        `<rect x="-4" y="200" width="408" height="14" fill="${IVORY}"/><rect x="-4" y="214" width="408" height="90" fill="${TEAL}"/>` +
        `<path d="M70 214v90M140 214v90M260 214v90M330 214v90" opacity=".6"/><path d="M96 240h20M166 240h20M286 240h20M356 240h20" stroke-width="4"/>` +
        `<rect x="160" y="214" width="80" height="90" fill="${STEEL}"/><rect x="172" y="232" width="56" height="44" rx="4" fill="#5b6178"/>` +
        `<path d="M176 186h48v14h-48z" fill="${CORAL}"/><path d="M170 186h60" stroke-width="4"/><path d="M190 176q-4-8 2-14M206 176q-4-8 2-14" opacity=".5"/>` +
        `<rect x="290" y="176" width="34" height="24" rx="6" fill="${AMBER}"/><circle cx="96" cy="186" r="14" fill="${CORAL}"/><path d="M96 172q2-6 6-6" stroke="${LEAF}" stroke-width="3"/>`,
    ),
  },
  {
    key: "bg-forest",
    en: "Forest",
    es: "Bosque",
    svg: wide(
      base("#d6ece4") +
        `<path d="M-10 170l50-60l40 40l50-70l60 80l50-50l60 60l50-40l60 50V300H-10z" fill="#a3cc9a" ${NS}/>` +
        pine(30, 220, 0.9, "#8ab88e") +
        pine(150, 210, 0.8, "#8ab88e") +
        pine(300, 214, 1, "#8ab88e") +
        `<rect y="230" width="400" height="70" fill="#6f9a5c"/>` +
        pine(70, 248, 1.4) +
        pine(220, 250, 1.2) +
        pine(360, 252, 1.5) +
        `<path d="M150 300q30-40 60-50q40-8 50-20" stroke="#c9a66b" stroke-width="20" opacity=".9"/>` +
        `<rect x="290" y="262" width="8" height="14" fill="${IVORY}"/><path d="M280 264q14-20 28 0z" fill="${CORAL}"/>${dot(290, 258, 2, IVORY)}${dot(298, 260, 2, IVORY)}` +
        `<rect x="124" y="270" width="6" height="10" fill="${IVORY}"/><path d="M116 272q11-14 22 0z" fill="${AMBER}"/>` +
        `<path d="M10 290q10-14 20 0M372 288q10-14 20 0" fill="${LEAF}"/>`,
    ),
  },
  {
    key: "bg-beach",
    en: "Beach",
    es: "Playa",
    svg: wide(
      base(SKY) +
        `<circle cx="300" cy="70" r="30" fill="${AMBER}"/>` +
        cloud(60, 60, 0.8) +
        `<rect y="140" width="400" height="80" fill="${AQUA}"/><path d="M0 140h400" />` +
        `<path d="M20 165q10-6 20 0t20 0M150 180q10-6 20 0t20 0M290 160q10-6 20 0t20 0M90 200q10-6 20 0t20 0M330 196q10-6 20 0t20 0" stroke="${IVORY}"/>` +
        `<path d="M-10 214q60-14 120 0t120 0t180 0V300H-10z" fill="#f4dca8"/>` +
        `<path d="M-10 214q60-14 120 0t120 0t180 0" stroke="${IVORY}" stroke-width="5"/>` +
        `<path d="M250 280l-24-110" stroke-width="5"/><path d="M180 186q40-50 96-24z" fill="${CORAL}"/><path d="M204 166l16-6l8 20M240 160l10 2" stroke-width="2"/>` +
        `<rect x="146" y="246" width="66" height="18" rx="4" fill="${AMBER}"/><path d="M168 246v18M190 246v18" opacity=".5"/>` +
        `<path d="M86 270q0-16 16-16t16 16z" fill="${ROSE}"/><path d="M90 270h24" />` +
        `<path d="M310 272l8-12l8 12l-8 4z" fill="${CORAL}"/><path d="M318 260v16" stroke-width="2"/>` +
        `<path d="M150 120l14 14h-14z" fill="${IVORY}"/><path d="M146 134h24l-4 6h-16z" fill="${NAVY}"/>`,
    ),
  },
  {
    key: "bg-space",
    en: "Outer space",
    es: "Espacio",
    svg: wide(
      base(NAVY) +
        `<g fill="${IVORY}" ${NS}>${[
          [30, 40, 2],
          [80, 120, 1.5],
          [130, 30, 2.5],
          [190, 90, 1.5],
          [250, 30, 2],
          [370, 50, 2.5],
          [350, 160, 1.5],
          [40, 200, 2],
          [110, 260, 1.5],
          [300, 270, 2],
          [380, 240, 1.5],
          [170, 200, 1.5],
          [230, 250, 2],
          [20, 130, 1.5],
        ]
          .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
          .join("")}</g>` +
        `<path d="${burst(290, 110, 9, 3, 4)}" fill="${AMBER}"/><path d="${burst(70, 70, 7, 2.5, 4)}" fill="${AMBER}"/>` +
        `<circle cx="180" cy="150" r="56" fill="${CORAL}"/>` +
        shade("M196 96a56 56 0 0 1 0 108q30-50 0-108z", 0.18) +
        `<path d="M142 120q20 4 30-4M150 176q28 8 56-4M196 110q10 6 20 2" stroke="${ROSE}" stroke-width="4"/>` +
        `<ellipse cx="180" cy="152" rx="96" ry="20" stroke-width="7" transform="rotate(-14 180 152)"/><ellipse cx="180" cy="152" rx="96" ry="20" stroke="${AMBER}" stroke-width="3" transform="rotate(-14 180 152)"/>` +
        `<circle cx="300" cy="200" r="22" fill="${STEEL}"/><circle cx="292" cy="194" r="5" fill="${D}" opacity=".15"/><circle cx="308" cy="208" r="4" fill="${D}" opacity=".15"/>` +
        `<circle cx="80" cy="200" r="12" fill="${AQUA}"/>`,
    ),
  },
  {
    key: "bg-museum",
    en: "Museum",
    es: "Museo",
    svg: wide(
      base("#efe0cf") +
        `<rect y="228" width="400" height="72" fill="#c8b49c" ${NS}/><path d="M0 254h400M60 228l-30 72M140 228l-14 72M260 228l14 72M340 228l30 72" stroke="#a38d74" opacity=".6"/>` +
        `<rect x="-4" y="220" width="408" height="10" fill="${IVORY}"/>` +
        `<rect x="-4" y="20" width="408" height="14" fill="${ROSE}"/>` +
        `<rect x="40" y="70" width="70" height="56" rx="2" fill="${AMBER}"/><rect x="48" y="78" width="54" height="40" fill="${SKY}"/><path d="M48 118l18-20l12 10l10-8l14 18z" fill="${SAGE}"/>${dot(90, 88, 5, CORAL)}` +
        `<rect x="290" y="70" width="70" height="56" rx="2" fill="${AMBER}"/><rect x="298" y="78" width="54" height="40" fill="${NAVY}"/><circle cx="325" cy="98" r="12" fill="${CORAL}"/><path d="M302 112h46" stroke="${AQUA}" stroke-width="4"/>` +
        `<rect x="138" y="56" width="18" height="164" fill="${IVORY}"/><rect x="244" y="56" width="18" height="164" fill="${IVORY}"/><path d="M144 66v146M150 66v146M250 66v146M256 66v146" stroke-width="1.5" opacity=".4"/><rect x="132" y="48" width="30" height="10" fill="${IVORY}"/><rect x="238" y="48" width="30" height="10" fill="${IVORY}"/>` +
        `<rect x="174" y="170" width="52" height="56" fill="${IVORY}"/>${shade("M210 171h15v54h-15z")}` +
        `<path d="M184 170q-6-20 8-34q-6-10 2-16h12q8 6 2 16q14 14 8 34z" fill="${TEAL}"/><path d="M186 152h28" stroke="${AMBER}" stroke-width="3"/>` +
        `<path d="M110 222v-30M290 222v-30" stroke-width="3"/><circle cx="110" cy="190" r="4" fill="${AMBER}"/><circle cx="290" cy="190" r="4" fill="${AMBER}"/><path d="M110 196q30 16 60 0M230 196q30 16 60 0" stroke="${CORAL}" stroke-width="4"/>`,
    ),
  },
  {
    key: "bg-lab",
    en: "Science lab",
    es: "Laboratorio",
    svg: wide(
      base("#dcefeb") +
        `<rect x="140" y="30" width="120" height="80" rx="4" fill="${SKY}"/><path d="M200 30v80M140 70h120"/>` +
        `<rect x="10" y="60" width="100" height="8" rx="2" fill="${COPPER}"/><rect x="290" y="60" width="100" height="8" rx="2" fill="${COPPER}"/><rect x="10" y="120" width="100" height="8" rx="2" fill="${COPPER}"/><rect x="290" y="120" width="100" height="8" rx="2" fill="${COPPER}"/>` +
        `<g stroke-width="2"><rect x="22" y="36" width="16" height="24" rx="3" fill="${CORAL}"/><rect x="46" y="30" width="12" height="30" rx="3" fill="${AMBER}"/><path d="M70 40h12v6l8 14H62l8-14z" fill="${AQUA}"/>` +
        `<path d="M300 98h12v8l8 14h-28l8-14z" fill="${SAGE}"/><rect x="330" y="92" width="14" height="28" rx="3" fill="${ROSE}"/><rect x="352" y="100" width="24" height="20" rx="3" fill="${AQUA}"/>` +
        `<rect x="304" y="36" width="14" height="24" rx="3" fill="${AQUA}"/><rect x="326" y="40" width="22" height="20" rx="3" fill="${AMBER}"/><rect x="24" y="96" width="24" height="24" rx="3" fill="${SAGE}"/><rect x="58" y="100" width="12" height="20" rx="3" fill="${CORAL}"/></g>` +
        `<rect x="-4" y="196" width="408" height="14" fill="${NAVY}"/><rect x="-4" y="210" width="408" height="94" fill="${STEEL}"/><path d="M100 210v94M200 210v94M300 210v94" opacity=".5"/><path d="M140 240h20M240 240h20M40 240h20M340 240h20" stroke-width="4"/>` +
        `<path d="M150 196v-10h26l18 -30q4-6 10 0l6 6" stroke-width="5"/><rect x="140" y="186" width="46" height="10" rx="2" fill="${NAVY}"/><rect x="200" y="140" width="16" height="30" rx="4" fill="${NAVY}" transform="rotate(30 208 155)"/>` +
        `<path d="M238 150h20v12l14 26q3 8-6 8h-36q-9 0-6-8l14-26z" fill="${IVORY}"/><path d="M232 176h32l6 12q2 8-6 8h-32q-8 0-6-8z" fill="${CORAL}"/>${dot(246, 168, 3, CORAL)}${dot(252, 158, 2, CORAL)}`,
    ),
  },
  {
    key: "bg-night",
    en: "Night sky",
    es: "Cielo de noche",
    svg: wide(
      base("#24346e") +
        `<g fill="${IVORY}" ${NS}>${[
          [40, 40],
          [100, 90],
          [150, 30],
          [210, 70],
          [260, 26],
          [360, 100],
          [20, 120],
          [180, 120],
          [320, 40],
          [380, 20],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`)
          .join("")}</g>` +
        `<path d="${burst(240, 110, 8, 3, 4)}" fill="${AMBER}"/><path d="${burst(80, 50, 6, 2, 4)}" fill="${AMBER}"/>` +
        `<path d="M300 50a34 34 0 1 0 30 50a28 28 0 1 1-30-50z" fill="#fbe7b0"/>` +
        `<path d="M-10 200q100-40 200 0t220-10V300H-10z" fill="#18264f"/>` +
        `<rect x="60" y="180" width="60" height="70" fill="${TEAL}"/><path d="M52 184l38-32l38 32z" fill="${ROSE}"/>` +
        `<rect x="150" y="190" width="100" height="60" fill="${NAVY}"/><path d="M142 194l58-44l58 44z" fill="${COPPER}"/>` +
        `<rect x="280" y="170" width="56" height="80" fill="${TEAL}"/><path d="M274 174l34-28l34 28z" fill="${ROSE}"/>` +
        `<g fill="${AMBER}"><rect x="74" y="196" width="14" height="16"/><rect x="94" y="196" width="14" height="16"/><rect x="164" y="204" width="18" height="18"/><rect x="218" y="204" width="18" height="18"/><rect x="292" y="186" width="14" height="16"/><rect x="292" y="214" width="14" height="16" fill="#3a4a80"/><rect x="314" y="186" width="14" height="16"/></g>` +
        `<rect x="190" y="222" width="20" height="28" fill="${AMBER}"/>` +
        `<rect y="248" width="400" height="52" fill="#121c3d"/>`,
    ),
  },
  {
    key: "bg-market",
    en: "Market",
    es: "Mercado",
    svg: wide(
      base(SKY) +
        cloud(170, 40, 0.7) +
        `<path d="M-10 22q60 22 120 6t120 6t180-4" stroke-width="2"/>` +
        `<g stroke-width="1.5"><path d="M20 26l8 16l8-14z" fill="${CORAL}"/><path d="M80 30l8 16l8-14z" fill="${AMBER}"/><path d="M140 30l8 16l8-14z" fill="${AQUA}"/><path d="M260 32l8 16l8-14z" fill="${SAGE}"/><path d="M330 28l8 16l8-14z" fill="${CORAL}"/></g>` +
        `<rect y="240" width="400" height="60" fill="#d9c6a6" ${NS}/>` +
        `<path d="M24 120v120M176 120v120M224 120v120M376 120v120" stroke-width="5"/>` +
        `<path d="M10 92h180l-10 32H20z" fill="${IVORY}"/><path d="M28 92l-8 32h20l6-32zM64 92l-4 32h20l2-32zM100 92v32h20v-32zM136 92l4 32h20l-2-32zM172 92l8 32" fill="${CORAL}"/>` +
        `<path d="M210 92h180l-10 32H220z" fill="${IVORY}"/><path d="M228 92l-8 32h20l6-32zM264 92l-4 32h20l2-32zM300 92v32h20v-32zM336 92l4 32h20l-2-32zM372 92l8 32" fill="${AQUA}"/>` +
        `<rect x="16" y="190" width="168" height="54" fill="${COPPER}"/><rect x="216" y="190" width="168" height="54" fill="${COPPER}"/><path d="M16 214h168M216 214h168" opacity=".4"/>` +
        `<g stroke-width="2">${[30, 50, 70, 90].map((x) => `<circle cx="${x}" cy="184" r="10" fill="${CORAL}"/>`).join("")}${[118, 138, 158].map((x) => `<circle cx="${x}" cy="184" r="10" fill="${AMBER}"/>`).join("")}` +
        `${[234, 254, 274].map((x) => `<circle cx="${x}" cy="184" r="10" fill="${SAGE}"/>`).join("")}<path d="M300 192q20-30 40 0z" fill="${AMBER}"/><path d="M346 192q10-26 30 0z" fill="${ROSE}"/></g>` +
        `<rect x="60" y="140" width="80" height="12" rx="2" fill="${AMBER}" opacity=".9"/><rect x="260" y="140" width="80" height="12" rx="2" fill="${CORAL}" opacity=".9"/>`,
    ),
  },
  {
    key: "bg-home",
    en: "Living room",
    es: "Sala de la casa",
    svg: wide(
      base("#f6dcc6") +
        `<rect y="234" width="400" height="66" fill="#b97d4b" ${NS}/><rect x="-4" y="226" width="408" height="10" fill="${IVORY}"/>` +
        `<rect x="30" y="50" width="76" height="96" rx="3" fill="${SKY}"/><path d="M68 50v96M30 98h76"/><path d="M24 44h88" stroke-width="5"/><path d="M28 46q-6 60 6 110M108 46q6 60-6 110" stroke="${CORAL}" stroke-width="8"/>` +
        `<rect x="164" y="56" width="72" height="54" rx="3" fill="${AMBER}"/><rect x="172" y="64" width="56" height="38" fill="${IVORY}"/><path d="M178 98l14-18l10 10l8-8l12 16z" fill="${SAGE}"/>${dot(214, 74, 5, CORAL)}` +
        `<path d="M118 238q0-10 10-10h144q10 0 10 10z" fill="${CORAL}" opacity=".8"/>` +
        `<rect x="114" y="150" width="172" height="52" rx="16" fill="${TEAL}"/><rect x="102" y="170" width="28" height="56" rx="12" fill="${TEAL}"/><rect x="270" y="170" width="28" height="56" rx="12" fill="${TEAL}"/><rect x="126" y="188" width="148" height="34" rx="8" fill="${AQUA}"/><path d="M200 190v32" opacity=".5"/><path d="M110 226v8M290 226v8" stroke-width="5"/>` +
        `<rect x="140" y="160" width="30" height="24" rx="6" fill="${AMBER}"/>` +
        `<path d="M328 226v-110" stroke-width="4"/><path d="M308 116h40l-8-30h-24z" fill="${AMBER}"/><path d="M314 226h28" stroke-width="5"/>` +
        `<path d="M48 228l4-30h28l4 30z" fill="${COPPER}"/><path d="M66 198q-20-20-10-40q10 10 10 40q0-30 14-44q8 22-14 44" fill="${SAGE}"/>`,
    ),
  },
  {
    key: "bg-island",
    en: "Island",
    es: "Isla",
    svg: wide(
      base(SKY) +
        `<circle cx="80" cy="64" r="28" fill="${AMBER}"/>` +
        cloud(260, 56, 0.9) +
        `<rect y="160" width="400" height="140" fill="${AQUA}" ${NS}/><path d="M0 160h400"/>` +
        `<path d="M30 190q10-6 20 0t20 0M320 200q10-6 20 0t20 0M60 260q10-6 20 0t20 0M300 270q10-6 20 0t20 0M190 280q10-6 20 0t20 0" stroke="${IVORY}"/>` +
        `<path d="M110 232q20-46 90-48t90 48z" fill="#f4dca8"/><path d="M104 232h192" stroke="${IVORY}" stroke-width="5"/>` +
        `<path d="M184 196q-4-50 14-80" stroke-width="9"/><path d="M184 196q-4-50 14-80" stroke="${COPPER}" stroke-width="5"/>` +
        `<path d="M198 116q-30-8-46 12q24-6 46-12zM198 116q30-10 48 8q-26-4-48-8zM198 116q-14-24-40-22q20 6 40 22zM198 116q16-24 42-18q-22 4-42 18z" fill="${LEAF}"/>` +
        `<path d="M238 202q4-32 22-50" stroke-width="7"/><path d="M238 202q4-32 22-50" stroke="${COPPER}" stroke-width="3"/><path d="M260 152q-20-4-30 8q16-4 30-8zM260 152q20-8 32 4q-18-2-32-4zM260 152q8-16 26-14q-14 4-26 14z" fill="${SAGE}"/>` +
        `<circle cx="196" cy="124" r="4" fill="${COPPER}"/><circle cx="203" cy="122" r="4" fill="${COPPER}"/>` +
        `<path d="M318 214h44l-8 12h-30z" fill="${CORAL}"/><path d="M336 214v-36l18 30z" fill="${IVORY}"/>`,
    ),
  },
  {
    key: "bg-newsroom",
    en: "Newsroom",
    es: "Sala de noticias",
    svg: wide(
      base(NAVY) +
        `<rect y="0" width="400" height="20" fill="#14204a" ${NS}/><g fill="${AMBER}" opacity=".7" ${NS}><circle cx="60" cy="14" r="5"/><circle cx="140" cy="14" r="5"/><circle cx="260" cy="14" r="5"/><circle cx="340" cy="14" r="5"/></g>` +
        `<rect x="110" y="40" width="180" height="110" rx="6" fill="${TEAL}"/><rect x="120" y="50" width="160" height="90" rx="3" fill="${AQUA}"/>` +
        `<circle cx="200" cy="95" r="34" fill="${SKY}"/><path d="M180 72q14 8 8 20q-10 4-6 16q-12-6-14-20M210 66q14 4 18 18q-10-2-12 10q-10 2-12-8q8-6 6-20M200 110q12-2 16 10q-10 8-18 2z" fill="${SAGE}"/><path d="M166 95h68M200 61v68" stroke-width="1.5" opacity=".5"/>` +
        `<rect x="128" y="124" width="48" height="8" rx="2" fill="${CORAL}" ${NS}/>` +
        `<rect x="20" y="70" width="60" height="44" rx="4" fill="${TEAL}"/><rect x="26" y="76" width="48" height="32" fill="${CORAL}"/><rect x="320" y="70" width="60" height="44" rx="4" fill="${TEAL}"/><rect x="326" y="76" width="48" height="32" fill="${AMBER}"/>` +
        `<rect y="200" width="400" height="100" fill="#3a3f5c" ${NS}/>` +
        `<path d="M60 194h280l-14 70H74z" fill="${IVORY}"/><path d="M60 194h280v10H60z" fill="${ROSE}"/>${shade("M300 204h40l-14 60h-40z")}` +
        `<path d="M110 214h180" stroke="${CORAL}" stroke-width="5"/>` +
        `<rect x="90" y="166" width="54" height="30" rx="3" fill="#5b6178"/><rect x="95" y="170" width="44" height="22" fill="${SKY}"/><path d="M117 196v-2" />` +
        `<rect x="256" y="174" width="50" height="22" rx="2" fill="${IVORY}"/><path d="M262 182h38M262 188h26" stroke-width="2"/>` +
        `<path d="M200 194v-16" stroke-width="3"/><circle cx="200" cy="172" r="7" fill="${STEEL}"/>`,
    ),
  },
];

/* ---------- objects (200x200) ---------- */

const OBJECTS = [
  {
    key: "obj-book",
    en: "Book",
    es: "Libro",
    svg: sq(
      `<path d="M18 52v106q42-6 82 12q40-18 82-12V52z" fill="${CORAL}"/>` +
        `<path d="M100 58q-32-18-74-12v104q42-6 74 12z" fill="${IVORY}"/><path d="M100 58q32-18 74-12v104q-42-6-74 12z" fill="${IVORY}"/>` +
        shade("M100 58q32-18 74-12v104q-42-6-74 12z", 0.06) +
        `<path d="M100 58v104"/>` +
        `<g stroke="${STEEL}" stroke-width="3"><path d="M40 70q24-4 46 4M40 88q24-4 46 4M40 106q24-4 46 4M40 124q16-3 30 2M114 74q22-8 46-4M114 92q22-8 46-4M114 110q22-8 46-4"/></g>` +
        `<path d="M134 46v34l8-6l8 6V44" fill="${AMBER}"/>`,
    ),
  },
  {
    key: "obj-magnifier",
    en: "Magnifying glass",
    es: "Lupa",
    svg: sq(
      band("M118 118l50 50", 16, COPPER) +
        `<circle cx="84" cy="84" r="46" fill="${SKY}" fill-opacity=".7" stroke-width="16"/><circle cx="84" cy="84" r="46" stroke="${AMBER}" stroke-width="10"/>` +
        `<path d="M62 70q8-16 26-18" stroke="${IVORY}" stroke-width="6"/>`,
    ),
  },
  {
    key: "obj-lightbulb",
    en: "Light bulb",
    es: "Foco",
    svg: sq(
      `<path d="M100 22a52 52 0 0 0-32 93q8 8 8 24h48q0-16 8-24a52 52 0 0 0-32-93z" fill="${AMBER}"/>` +
        shade("M108 23a52 52 0 0 1 24 92q-8 8-8 24h-12q0-20 8-30q22-30-12-86z") +
        `<path d="M88 138v-30l-10-22M112 138v-30l10-22M88 108q12 10 24 0" stroke="${COPPER}"/>` +
        `<rect x="76" y="138" width="48" height="14" rx="4" fill="${STEEL}"/><rect x="80" y="152" width="40" height="12" rx="4" fill="${STEEL}"/><path d="M88 164h24l-6 10h-12z" fill="${D}"/>` +
        `<path d="M70 62q8-18 26-22" stroke="${IVORY}" stroke-width="6"/>`,
    ),
  },
  {
    key: "obj-globe",
    en: "Globe",
    es: "Globo terráqueo",
    svg: sq(
      `<path d="M62 168h76l-6 14H68z" fill="${COPPER}"/><path d="M100 150v18" stroke-width="7"/>` +
        `<circle cx="100" cy="86" r="58" fill="${AQUA}"/>` +
        `<path d="M66 50q20 0 24 14q-10 12 4 22q-6 14-22 10q-12-20-24-12q2-20 18-34zM112 40q22 2 34 20q-14-2-16 10q-14 6-20-6q10-10 2-24zM120 96q18-6 30 6q-6 24-26 32q-4-18-4-38zM72 116q10 0 14 10q-6 6-12 4z" fill="${SAGE}"/>` +
        shade("M112 29a58 58 0 0 1 0 114q34-56 0-114z") +
        `<path d="M40 86a60 60 0 0 0 120 0" stroke-width="7" transform="rotate(-20 100 86)"/><path d="M40 86a60 60 0 0 0 120 0" stroke="${COPPER}" stroke-width="3" transform="rotate(-20 100 86)"/>`,
    ),
  },
  {
    key: "obj-map",
    en: "Map",
    es: "Mapa",
    svg: sq(
      `<path d="M20 50l52-16v120l-52 16z" fill="#f4dca8"/><path d="M72 34l56 16v120l-56-16z" fill="${IVORY}"/><path d="M128 50l52-16v120l-52 16z" fill="#f4dca8"/>` +
        shade("M72 34l56 16v120l-56-16z", 0.06) +
        `<path d="M30 70q20-10 30 4q-4 20-20 16q-14 0-10-20zM100 120q16-10 24 4q-2 22-20 18q-10-6-4-22zM142 60q18-6 28 8q-8 18-24 10z" fill="${SAGE}"/>` +
        `<path d="M40 130q30 0 40-30t40-40t30 50" stroke="${CORAL}" stroke-width="3.5" stroke-dasharray="7 8"/>` +
        `<path d="M140 104l14 14M154 104l-14 14" stroke="${CORAL}" stroke-width="5"/>${dot(40, 130, 5, NAVY)}`,
    ),
  },
  {
    key: "obj-trophy",
    en: "Trophy",
    es: "Trofeo",
    svg: sq(
      band("M60 50q-30 0-24 30q4 18 30 22M140 50q30 0 24 30q-4 18-30 22", 6, AMBER) +
        `<path d="M58 34h84v40q0 46-42 50q-42-4-42-50z" fill="${AMBER}"/>` +
        shade("M112 35h30v40q0 40-34 48q22-30 4-88z") +
        `<path d="M92 122h16v24H92z" fill="${AMBER}"/><path d="M66 146h68v12H66z" fill="${COPPER}"/><rect x="56" y="158" width="88" height="20" rx="4" fill="${NAVY}"/>` +
        `<path d="${burst(100, 74, 20, 8.5, 5)}" fill="${IVORY}"/>` +
        `<rect x="82" y="164" width="36" height="8" rx="2" fill="${AMBER}" ${NS}/>`,
    ),
  },
  {
    key: "obj-camera",
    en: "Camera",
    es: "Cámara",
    svg: sq(
      `<path d="M72 58l10-16h36l10 16z" fill="${STEEL}"/><rect x="134" y="48" width="22" height="12" rx="3" fill="${AMBER}"/>` +
        `<rect x="26" y="58" width="148" height="100" rx="16" fill="${NAVY}"/><rect x="26" y="78" width="148" height="56" fill="${CORAL}"/>` +
        `<circle cx="100" cy="106" r="40" fill="${IVORY}"/><circle cx="100" cy="106" r="28" fill="#3a3f5c"/><circle cx="100" cy="106" r="16" fill="${TEAL}"/>` +
        `<path d="M90 96q6-6 14-4" stroke="${IVORY}" stroke-width="4"/>` +
        `<circle cx="150" cy="70" r="5" fill="${IVORY}"/><rect x="38" y="66" width="20" height="8" rx="2" fill="${STEEL}"/>`,
    ),
  },
  {
    key: "obj-microphone",
    en: "Microphone",
    es: "Micrófono",
    svg: sq(
      `<path d="M100 132v32M70 172h60" stroke-width="7"/><path d="M100 132v32M70 172h60" stroke="${STEEL}" stroke-width="3"/>` +
        `<path d="M62 92q0 40 38 40t38-40" stroke-width="5"/>` +
        `<rect x="74" y="24" width="52" height="94" rx="26" fill="${STEEL}"/>` +
        shade("M108 25q18 4 18 26v40q0 22-18 26z") +
        `<path d="M78 52h44M76 66h48M76 80h48" opacity=".5"/>` +
        `<rect x="74" y="88" width="52" height="16" fill="${CORAL}"/>` +
        `<path d="M88 34q-6 6-6 16" stroke="${IVORY}" stroke-width="4"/>`,
    ),
  },
  {
    key: "obj-pencil",
    en: "Pencil",
    es: "Lápiz",
    svg: sq(
      `<g transform="rotate(-45 100 100)">` +
        `<rect x="40" y="84" width="104" height="32" fill="${AMBER}"/><path d="M40 95h104" stroke="#d9952a" stroke-width="2"/><path d="M40 106h104" stroke="#d9952a" stroke-width="2"/>` +
        `<path d="M144 84l34 16l-34 16z" fill="#f4dca8"/><path d="M166 94l12 6l-12 6z" fill="${D}"/>` +
        `<rect x="26" y="82" width="16" height="36" fill="${STEEL}"/><path d="M32 82v36" opacity=".5"/>` +
        `<path d="M26 82h-6q-8 0-8 8v20q0 8 8 8h6z" fill="${CORAL}"/></g>`,
    ),
  },
  {
    key: "obj-heart",
    en: "Heart",
    es: "Corazón",
    svg: sq(
      `<path d="M100 170q-74-46-78-96q-2-36 34-42q30-4 44 26q14-30 44-26q36 6 34 42q-4 50-78 96z" fill="${CORAL}"/>` +
        shade("M140 32q36 6 34 42q-4 50-74 96q60-60 40-138z") +
        `<path d="M48 62q4-14 20-16" stroke="${IVORY}" stroke-width="7"/>`,
    ),
  },
  {
    key: "obj-star",
    en: "Star",
    es: "Estrella",
    svg: sq(
      `<path d="M100 22L120 76.5L178 79.3L132.3 114.5L148 172L100 140L52 172L67.7 114.5L22 79.3L80 76.5Z" fill="${AMBER}"/>` +
        shade("M100 22L120 76.5L178 79.3L132.3 114.5L148 172L100 140z") +
        `<path d="M86 66l6-16" stroke="${IVORY}" stroke-width="6"/>`,
    ),
  },
  {
    key: "obj-clock",
    en: "Clock",
    es: "Reloj",
    svg: sq(
      `<path d="M44 52l-10-12M156 52l10-12" stroke-width="7"/><circle cx="40" cy="40" r="16" fill="${CORAL}"/><circle cx="160" cy="40" r="16" fill="${CORAL}"/>` +
        `<path d="M60 168l-10 14M140 168l10 14" stroke-width="6"/>` +
        `<circle cx="100" cy="106" r="70" fill="${TEAL}"/><circle cx="100" cy="106" r="56" fill="${IVORY}"/>` +
        `<path d="M100 56v10M100 146v10M50 106h10M140 106h10M75 63l4 7M125 63l-4 7M75 149l4-7M125 149l-4-7M57 81l7 4M143 81l-7 4M57 131l7-4M143 131l-7-4" stroke-width="3"/>` +
        `<path d="M100 106V72M100 106l24 14" stroke-width="5"/>${dot(100, 106, 5)}`,
    ),
  },
  {
    key: "obj-question",
    en: "Question mark",
    es: "Signo de pregunta",
    svg: sq(
      band("M66 70q0-38 36-38t34 36q0 22-22 32q-14 6-14 24v8", 22, AMBER) +
        `<circle cx="100" cy="166" r="15" fill="${AMBER}"/>`,
    ),
  },
  {
    key: "obj-food-bowl",
    en: "Bowl of food",
    es: "Plato de comida",
    svg: sq(
      `<path d="M80 54q-8-12 0-24M100 50q-8-12 0-24M120 54q-8-12 0-24" stroke="${STEEL}" stroke-width="4"/>` +
        `<path d="M30 96q10-34 70-34t70 34z" fill="${IVORY}"/>` +
        `<circle cx="74" cy="80" r="10" fill="${SAGE}"/><circle cx="122" cy="76" r="9" fill="${CORAL}"/><path d="M92 82q8-14 20-4" fill="${AMBER}"/><circle cx="140" cy="86" r="7" fill="${SAGE}"/><circle cx="56" cy="90" r="6" fill="${CORAL}"/>` +
        `<path d="M24 96h152q-6 66-76 66T24 96z" fill="${CORAL}"/>` +
        shade("M140 97h36q-6 66-76 66q60-20 40-66z") +
        `<path d="M44 118q56 20 112 0" stroke="${IVORY}" stroke-width="5"/>` +
        `<path d="M72 162h56l-6 12H78z" fill="${COPPER}"/>`,
    ),
  },
  {
    key: "obj-house",
    en: "House",
    es: "Casa",
    svg: sq(
      `<rect x="128" y="36" width="20" height="40" fill="${COPPER}"/>` +
        `<rect x="44" y="90" width="112" height="80" fill="${IVORY}"/>` +
        shade("M120 91h35v78h-35z", 0.08) +
        `<path d="M28 98l72-62l72 62z" fill="${CORAL}"/>` +
        `<rect x="86" y="118" width="30" height="52" rx="3" fill="${TEAL}"/>${dot(108, 146, 3, AMBER)}` +
        `<rect x="54" y="110" width="22" height="22" rx="2" fill="${AMBER}"/><path d="M65 110v22M54 121h22" stroke-width="2"/>` +
        `<rect x="126" y="110" width="22" height="22" rx="2" fill="${AMBER}"/><path d="M137 110v22M126 121h22" stroke-width="2"/>` +
        `<path d="M24 170h152" stroke-width="4"/>`,
    ),
  },
  {
    key: "obj-flag",
    en: "Flag",
    es: "Bandera",
    svg: sq(
      `<path d="M50 30v150" stroke-width="9"/><path d="M50 30v150" stroke="${COPPER}" stroke-width="5"/><circle cx="50" cy="26" r="7" fill="${AMBER}"/>` +
        `<path d="M54 40q30-14 60 0t60 0v70q-30 14-60 0t-60 0z" fill="${AQUA}"/>` +
        `<path d="M54 64q30-14 60 0t60 0v22q-30 14-60 0t-60 0z" fill="${AMBER}"/>` +
        shade("M114 40q30 14 60 0v70q-30 14-60 0z", 0.1) +
        `<path d="M36 182h28" stroke-width="5"/>`,
    ),
  },
  {
    key: "obj-newspaper",
    en: "Newspaper",
    es: "Periódico",
    svg: sq(
      `<path d="M30 40h128v120q0 12 12 12H42q-12 0-12-12z" fill="${IVORY}"/><path d="M158 70h12v90q0 12-12 12" fill="#f4dca8"/>` +
        `<rect x="44" y="52" width="100" height="14" rx="2" fill="${NAVY}"/>` +
        `<rect x="44" y="76" width="46" height="40" rx="2" fill="${SAGE}"/><circle cx="58" cy="90" r="6" fill="${AMBER}" ${NS}/><path d="M44 116l16-14l10 8l12-10l8 8v8z" fill="${TEAL}" ${NS}/>` +
        `<g stroke="${STEEL}" stroke-width="3.5"><path d="M100 80h44M100 92h44M100 104h44M100 116h30M44 130h100M44 142h100M44 154h70"/></g>`,
    ),
  },
  {
    key: "obj-key",
    en: "Key",
    es: "Llave",
    svg: sq(
      `<g transform="rotate(-35 100 100)">` +
        `<path d="M86 90h96v20H86z" fill="${AMBER}"/><path d="M150 110v20h12v-20M168 110v14h10v-14" fill="${AMBER}"/>` +
        `<circle cx="58" cy="100" r="36" fill="${AMBER}"/><circle cx="58" cy="100" r="14" fill="${IVORY}"/>` +
        shade("M58 64a36 36 0 0 1 0 72a22 22 0 0 0 0-72z") +
        `<path d="M36 82q8-10 20-12" stroke="${IVORY}" stroke-width="5"/></g>`,
    ),
  },
  {
    key: "obj-gift",
    en: "Gift",
    es: "Regalo",
    svg: sq(
      `<rect x="36" y="88" width="128" height="86" rx="4" fill="${CORAL}"/>` +
        shade("M130 89h33v84h-33z") +
        `<rect x="28" y="66" width="144" height="26" rx="4" fill="${CORAL}"/>` +
        `<rect x="88" y="66" width="24" height="108" fill="${AMBER}"/>` +
        `<path d="M100 66q-40-36-50-12q-6 16 50 12zM100 66q40-36 50-12q6 16-50 12z" fill="${AMBER}"/>` +
        `<path d="M28 92h144"/>`,
    ),
  },
  {
    key: "obj-music",
    en: "Music notes",
    es: "Notas musicales",
    svg: sq(
      band("M72 136V46l84-18v92", 6, NAVY) +
        `<path d="M72 46l84-18v22l-84 18z" fill="${NAVY}"/>` +
        `<ellipse cx="56" cy="138" rx="20" ry="15" fill="${NAVY}" transform="rotate(-20 56 138)"/><ellipse cx="140" cy="122" rx="20" ry="15" fill="${NAVY}" transform="rotate(-20 140 122)"/>` +
        `<path d="M48 132q4-6 10-6M132 116q4-6 10-6" stroke="${IVORY}" stroke-width="3"/>` +
        dot(170, 160, 6, AMBER) +
        dot(30, 70, 5, CORAL) +
        `<path d="${burst(160, 70, 9, 3.5, 4)}" fill="${AQUA}"/>`,
    ),
  },
];

/* ---------- nature ---------- */

const NATURE = [
  {
    key: "nat-tree",
    en: "Tree",
    es: "Árbol",
    svg: sq(
      `<ellipse cx="100" cy="182" rx="50" ry="6" fill="${D}" opacity=".12" ${NS}/>` +
        `<path d="M88 182q4-40 0-70h24q-4 30 0 70z" fill="${COPPER}"/><path d="M100 130l-18-16M104 120l16-14" stroke-width="5"/>` +
        `<circle cx="70" cy="96" r="32" fill="${SAGE}"/><circle cx="130" cy="96" r="32" fill="${SAGE}"/><circle cx="100" cy="62" r="40" fill="${SAGE}"/><circle cx="100" cy="106" r="28" fill="${SAGE}"/>` +
        shade("M128 66q34 4 34 30t-32 32q20-30-2-62z") +
        `<path d="M78 50q8-12 20-14" stroke="${IVORY}" stroke-width="5" opacity=".6"/>` +
        dot(76, 88, 5, CORAL) +
        dot(124, 74, 5, CORAL) +
        dot(110, 108, 5, CORAL),
    ),
  },
  {
    key: "nat-sun",
    en: "Sun",
    es: "Sol",
    svg: sq(
      [0, 45, 90, 135, 180, 225, 270, 315]
        .map(
          (a) => `<path d="M100 14l12 24h-24z" fill="${AMBER}" transform="rotate(${a} 100 100)"/>`,
        )
        .join("") +
        `<circle cx="100" cy="100" r="50" fill="${AMBER}"/>` +
        `<circle cx="100" cy="100" r="38" fill="#f7c95c" ${NS}/>` +
        `<path d="M74 82q8-14 22-16" stroke="${IVORY}" stroke-width="6"/>`,
    ),
  },
  {
    key: "nat-cloud",
    en: "Cloud",
    es: "Nube",
    svg: sq(
      `<path d="M40 140h120q24 0 24-24t-26-26q-4-34-38-32q-14-24-42-16q-26 8-26 36q-30 2-30 32t18 30z" fill="${IVORY}"/>` +
        shade("M52 126h104q18 0 24-12q2 26-20 26H40q-16 0-22-18q12 4 34 4z", 0.1),
    ),
  },
  {
    key: "nat-rain",
    en: "Rain",
    es: "Lluvia",
    svg: sq(
      `<path d="M40 110h120q22 0 22-22t-24-24q-4-30-36-28q-14-22-40-14q-24 8-24 32q-28 2-28 28t10 28z" fill="#d6dbe8"/>` +
        shade("M48 98h108q16 0 24-10q0 22-20 22H40q-12 0-18-14q8 2 26 2z", 0.12) +
        [
          [58, 132],
          [96, 140],
          [134, 132],
          [76, 166],
          [116, 172],
        ]
          .map(
            ([x, y]) =>
              `<path d="M${x} ${y - 14}q10 14 10 20a10 10 0 0 1-20 0q0-6 10-20z" fill="${AQUA}"/>`,
          )
          .join(""),
    ),
  },
  {
    key: "nat-flower",
    en: "Flower",
    es: "Flor",
    svg: sq(
      band("M100 100q-4 40 2 84", 5, LEAF) +
        `<path d="M102 160q30-30 50-20q-20 30-50 20zM100 142q-30-24-50-12q22 26 50 12z" fill="${SAGE}"/>` +
        [0, 60, 120, 180, 240, 300]
          .map(
            (a) =>
              `<ellipse cx="100" cy="58" rx="16" ry="24" fill="${CORAL}" transform="rotate(${a} 100 82)"/>`,
          )
          .join("") +
        `<circle cx="100" cy="82" r="18" fill="${AMBER}"/>` +
        dot(94, 78, 2.5, COPPER) +
        dot(106, 80, 2.5, COPPER) +
        dot(100, 88, 2.5, COPPER),
    ),
  },
  {
    key: "nat-mountain",
    en: "Mountain",
    es: "Montaña",
    svg: sq(
      `<path d="M10 170l56-90l30 46l30-70l64 114z" fill="${TEAL}"/>` +
        shade("M126 56l64 114h-50l-14-60z", 0.18) +
        `<path d="M126 56l16 28l-10 6l-8-8l-8 10l-6-6z" fill="${IVORY}"/><path d="M66 80l14 22l-8 4l-6-6l-6 6l-6-4z" fill="${IVORY}"/>` +
        `<path d="M4 170q50-20 96-6t96 6v10H4z" fill="${SAGE}"/>`,
    ),
  },
  {
    key: "nat-butterfly",
    en: "Butterfly",
    es: "Mariposa",
    svg: sq(
      `<path d="M96 96q-30-60-66-50q-18 6-6 40q10 22 72 14z" fill="${ROSE}"/><path d="M104 96q30-60 66-50q18 6 6 40q-10 22-72 14z" fill="${ROSE}"/>` +
        `<path d="M96 104q-50 0-56 30q-4 24 22 26q24-4 34-48z" fill="${AMBER}"/><path d="M104 104q50 0 56 30q4 24-22 26q-24-4-34-48z" fill="${AMBER}"/>` +
        dot(58, 74, 9, IVORY, 0.8) +
        dot(142, 74, 9, IVORY, 0.8) +
        dot(66, 136, 6, CORAL) +
        dot(134, 136, 6, CORAL) +
        `<rect x="92" y="64" width="16" height="96" rx="8" fill="${NAVY}"/>` +
        `<path d="M96 66q-8-24-22-30M104 66q8-24 22-30"/>${dot(73, 35, 4)}${dot(127, 35, 4)}`,
    ),
  },
  {
    key: "nat-leaf",
    en: "Leaf",
    es: "Hoja",
    svg: sq(
      `<path d="M40 160q-10-90 70-120q40-14 56-10q4 40-14 80q-30 60-112 50z" fill="${SAGE}"/>` +
        shade("M166 30q4 40-14 80q-30 60-112 50q80-30 126-130z") +
        `<path d="M24 178l26-26q50-50 100-110M76 128q-6-26 0-46M100 104q20 4 40 0M106 96q-6-26 4-44M124 76q14 4 30 0"/>`,
    ),
  },
];

/* ---------- science ---------- */

const SCIENCE = [
  {
    key: "sci-flask",
    en: "Flask",
    es: "Matraz",
    svg: sq(
      `<path d="M80 26h40v50l42 76q8 20-14 20H52q-22 0-14-20l42-76z" fill="${IVORY}" fill-opacity=".9"/>` +
        `<path d="M58 118h84l20 34q8 20-14 20H52q-22 0-14-20z" fill="${AQUA}"/>` +
        shade("M120 76l42 76q8 20-14 20h-20q30-10 10-50q-18-30-18-46z", 0.1) +
        `<rect x="74" y="20" width="52" height="12" rx="4" fill="${STEEL}"/>` +
        `<circle cx="84" cy="146" r="7" fill="${IVORY}" opacity=".8"/><circle cx="110" cy="136" r="5" fill="${IVORY}" opacity=".8"/><circle cx="98" cy="100" r="5" fill="${SKY}"/><circle cx="106" cy="80" r="3.5" fill="${SKY}"/>` +
        `<path d="M92 40v28" stroke="${IVORY}" stroke-width="4" opacity=".8"/>`,
    ),
  },
  {
    key: "sci-plant",
    en: "Seedling",
    es: "Plántula",
    svg: sq(
      band("M100 120V70", 5, LEAF) +
        `<path d="M100 84q-6-36-46-34q4 34 46 34zM100 72q8-36 50-34q-4 36-50 34z" fill="${SAGE}"/>` +
        `<path d="M100 84q-24-6-36-24M100 72q24-6 38-24" stroke-width="1.8"/>` +
        `<path d="M50 118h100l-12 60H62z" fill="${COPPER}"/>${shade("M124 119h26l-12 58h-22z", 0.15)}` +
        `<rect x="44" y="110" width="112" height="18" rx="4" fill="#b8643a"/>` +
        `<path d="M58 112q42-10 84 0" fill="#5c3a21"/>`,
    ),
  },
  {
    key: "sci-magnet",
    en: "Magnet",
    es: "Imán",
    svg: sq(
      `<path d="M36 76q0-56 64-56t64 56v60h-34V78q0-24-30-24T70 78v58H36z" fill="${CORAL}"/>` +
        shade("M124 28q40 14 40 48v60h-14V80q0-40-26-52z") +
        `<rect x="36" y="136" width="34" height="30" fill="${STEEL}"/><rect x="130" y="136" width="34" height="30" fill="${STEEL}"/>` +
        `<g stroke="${AQUA}" stroke-width="3" stroke-dasharray="6 7"><path d="M53 176q0 20 47 20t47-20"/><path d="M30 172q-14 10-14 22"/><path d="M170 172q14 10 14 22"/></g>`,
    ),
  },
  {
    key: "sci-thermometer",
    en: "Thermometer",
    es: "Termómetro",
    svg: sq(
      `<path d="M84 140V36a16 16 0 0 1 32 0v104a28 28 0 1 1-32 0z" fill="${IVORY}"/>` +
        `<path d="M93 146V80h14v66" fill="${CORAL}" ${NS}/><circle cx="100" cy="162" r="18" fill="${CORAL}"/><rect x="93" y="80" width="14" height="70" fill="${CORAL}" ${NS}/>` +
        `<path d="M93 80h14"/><path d="M122 50h14M122 70h10M122 90h14M122 110h10M122 130h14" stroke-width="3"/>` +
        `<path d="M92 156q2-6 8-8" stroke="${IVORY}" stroke-width="4"/>`,
    ),
  },
  {
    key: "sci-rocket",
    en: "Rocket",
    es: "Cohete",
    svg: sq(
      `<g transform="rotate(30 100 100) translate(0 -8)">` +
        `<path d="M82 148q18 52 18 52t18-52z" fill="${AMBER}"/><path d="M91 150q9 30 9 30t9-30z" fill="${CORAL}" ${NS}/>` +
        `<path d="M74 118l-22 30l26-6zM126 118l22 30l-26-6z" fill="${CORAL}"/>` +
        `<path d="M100 14q34 30 30 104l-8 34H78l-8-34q-4-74 30-104z" fill="${IVORY}"/>` +
        shade("M100 14q34 30 30 104l-8 34h-12q22-60-10-138z", 0.08) +
        `<path d="M100 14q20 18 26 42H74q6-24 26-42z" fill="${CORAL}"/>` +
        `<circle cx="100" cy="88" r="15" fill="${AQUA}"/><path d="M93 82q4-5 10-4" stroke="${IVORY}" stroke-width="3"/>` +
        `<path d="M92 152v-30M108 152v-30" stroke-width="1.5" opacity=".4"/></g>`,
    ),
  },
  {
    key: "sci-microscope",
    en: "Microscope",
    es: "Microscopio",
    svg: sq(
      `<rect x="40" y="166" width="120" height="18" rx="6" fill="${NAVY}"/>` +
        band("M140 166v-54q0-36-40-48", 12, NAVY) +
        `<rect x="56" y="118" width="84" height="9" rx="3" fill="${STEEL}"/><rect x="80" y="113" width="30" height="5" rx="2" fill="${SKY}"/>` +
        `<path d="M98 127v39" stroke-width="5"/>` +
        `<rect x="91" y="98" width="10" height="14" rx="2" fill="${STEEL}" transform="rotate(-20 96 105)"/>` +
        `<rect x="70" y="36" width="28" height="70" rx="6" fill="${AQUA}" transform="rotate(-20 84 71)"/>` +
        `<rect x="62" y="24" width="26" height="16" rx="4" fill="${NAVY}" transform="rotate(-20 84 71)"/>` +
        `<circle cx="140" cy="120" r="9" fill="${AMBER}"/>`,
    ),
  },
  {
    key: "sci-earth",
    en: "Planet Earth",
    es: "Planeta Tierra",
    svg: sq(
      `<circle cx="100" cy="100" r="72" fill="#3b8fc4"/>` +
        `<path d="M56 50q26-8 34 10q-12 16 6 28q-6 20-28 16q-16-20-36-10q0-26 24-44zM118 36q30 4 42 28q-18-2-22 14q-18 6-24-8q14-14 4-34zM126 104q22-8 38 6q-8 30-34 40q-6-22-4-46zM62 130q16 0 22 14q-8 10-20 6q-8-8-2-20z" fill="${SAGE}"/>` +
        shade("M114 30a72 72 0 0 1 0 140q44-70 0-140z", 0.16) +
        `<path d="M44 124q24 8 30 0M120 160q16-4 24-12" stroke="${IVORY}" stroke-width="5" opacity=".7"/>`,
    ),
  },
  {
    key: "sci-battery",
    en: "Battery",
    es: "Batería",
    svg: sq(
      `<rect x="160" y="78" width="16" height="44" rx="4" fill="${STEEL}"/>` +
        `<rect x="22" y="56" width="140" height="88" rx="14" fill="${IVORY}"/>` +
        `<rect x="34" y="68" width="80" height="64" rx="6" fill="${SAGE}"/>` +
        `<path d="M86 64l-20 40h18l-10 34l32-46h-18l10-28z" fill="${AMBER}"/>` +
        shade("M128 57h20q13 0 13 13v60q0 13-13 13h-20z", 0.08),
    ),
  },
];

/* ---------- comic effects ---------- */

const COMIC = [
  {
    key: "fx-pow",
    en: "Pow burst",
    es: "Estallido",
    svg: sq(
      `<path d="${burst(100, 100, 92, 58, 12, -80)}" fill="${CORAL}"/><path d="${burst(100, 100, 60, 38, 10, -70)}" fill="${AMBER}"/>${dot(100, 100, 22, IVORY)}`,
    ),
  },
  {
    key: "fx-zoom",
    en: "Zoom lines",
    es: "Líneas de velocidad",
    svg: sq(
      band("M20 70h90M10 100h120M30 130h80", 7, AQUA) +
        `<circle cx="154" cy="100" r="30" fill="${AMBER}"/>` +
        shade("M164 72a30 30 0 0 1 0 56q16-28 0-56z", 0.15) +
        `<path d="M142 88q6-8 14-8" stroke="${IVORY}" stroke-width="5"/>` +
        `<circle cx="22" cy="160" r="8" fill="${IVORY}"/><circle cx="44" cy="166" r="6" fill="${IVORY}"/><circle cx="12" cy="40" r="5" fill="${IVORY}"/>`,
    ),
  },
  {
    key: "fx-idea",
    en: "Idea!",
    es: "¡Idea!",
    svg: sq(
      [-60, -30, 0, 30, 60]
        .map((a) =>
          band("M100 32V14", 5, AMBER).replace(
            /<path /g,
            `<path transform="rotate(${a} 100 100)" `,
          ),
        )
        .join("") +
        `<path d="M100 54a38 38 0 0 0-24 68q6 6 6 18h36q0-12 6-18a38 38 0 0 0-24-68z" fill="${AMBER}"/>` +
        `<rect x="82" y="140" width="36" height="12" rx="4" fill="${STEEL}"/><rect x="86" y="152" width="28" height="10" rx="4" fill="${STEEL}"/>` +
        `<path d="M86 80q6-12 18-14" stroke="${IVORY}" stroke-width="5"/>`,
    ),
  },
  {
    key: "fx-question-burst",
    en: "Question burst",
    es: "Estallido de pregunta",
    svg: sq(
      `<path d="${burst(100, 100, 90, 64, 14, -90)}" fill="${AQUA}"/>` +
        band("M78 78q0-24 24-24t22 22q0 14-14 20q-10 4-10 16v4", 13, IVORY) +
        `<circle cx="100" cy="138" r="9" fill="${IVORY}"/>`,
    ),
  },
  {
    key: "fx-sparkles",
    en: "Sparkles",
    es: "Destellos",
    svg: sq(
      `<path d="M96 30q6 48 50 54q-44 6-50 54q-6-48-50-54q44-6 50-54z" fill="${AMBER}"/>` +
        `<path d="M150 110q4 26 26 30q-22 4-26 30q-4-26-26-30q22-4 26-30z" fill="${CORAL}"/>` +
        `<path d="M46 130q3 18 18 20q-15 3-18 20q-3-17-18-20q15-2 18-20z" fill="${AQUA}"/>` +
        dot(160, 46, 5, AMBER) +
        dot(36, 60, 4, CORAL),
    ),
  },
  {
    key: "fx-arrow-curve",
    en: "Curved arrow",
    es: "Flecha curva",
    svg: sq(
      band("M30 160q0-110 106-110", 14, CORAL) +
        `<path d="M126 22l52 28l-52 30z" fill="${CORAL}"/>`,
    ),
  },
];

const tag = (cat, list) => list.map((a) => ({ key: a.key, cat, en: a.en, es: a.es, svg: a.svg }));

export const ART = Object.freeze([
  ...tag("character", CHARACTERS),
  ...tag("background", BACKGROUNDS),
  ...tag("object", OBJECTS),
  ...tag("nature", NATURE),
  ...tag("science", SCIENCE),
  ...tag("comic", COMIC),
]);

export const ART_CATS = Object.freeze([
  { id: "character", en: "Characters", es: "Personajes" },
  { id: "background", en: "Backgrounds", es: "Fondos" },
  { id: "object", en: "Objects", es: "Objetos" },
  { id: "nature", en: "Nature", es: "Naturaleza" },
  { id: "science", en: "Science", es: "Ciencia" },
  { id: "comic", en: "Comic effects", es: "Efectos de cómic" },
]);

// Ten unit hero scenes. 1200x320 wide band, drawn to crop well: the story lives in x 250-950 (what a 390px phone
// shows with preserveAspectRatio="xMidYMid slice"), the edges only carry sky, trees and shapes.
// Decorative: aria-hidden. Shape carries meaning; hue is decoration.
import { bush, cloud, confetti, ground, place, shadow, sun, svg, tree } from "./family-art-kit.mjs";

const SKY = '<rect width="1200" height="320" class="xt"/>';
const hills = (c = "xf") =>
  `<path d="M0 238Q220 186 430 226T840 214T1200 228V320H0z" class="${c}"/>`;
const floor = `${ground(1200, 262, 58)}`;
const pennant = (i, x, y) =>
  `<path d="M${x - 14} ${y}h28l-14 30z" class="${["xa", "xy", "xw", "xr"][i % 4]}"/>`;

/** a fence behind the action: one path of round-capped pickets */
const fence = (x0, x1, y) => {
  let d = "";
  for (let x = x0; x < x1; x += 24) d += `M${x} ${y + 8}V${256}`;
  return `<path d="${d}" class="qw" stroke-width="15" stroke-opacity=".75"/><path d="M${x0 - 6} ${y + 34}H${x1}" class="qw" stroke-width="8"/>`;
};

const frame = (inner) => SKY + inner;

const scenes = {
  // 1: Math is... (a table of friends, patterns, a speech bubble with an open ellipsis)
  1: () => {
    let bunting = '<path d="M236 30Q600 130 964 30" class="qk" stroke-width="2.5"/>';
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      bunting += pennant(i, 236 + 728 * t, 30 + 200 * t * (1 - t));
    }
    let tiles = "";
    for (let i = 0; i < 7; i++)
      tiles +=
        i % 2
          ? `<circle cx="${602 + i * 20}" cy="222" r="8" class="xy"/>`
          : `<rect x="${594 + i * 20}" y="214" width="16" height="16" rx="3" class="xa"/>`;
    return frame(
      hills() +
        cloud(150, 80) +
        cloud(1060, 110, 0.8) +
        bunting +
        floor +
        tree(200, 262, 1.1) +
        tree(1010, 262, 0.9) +
        confetti([
          [300, 160],
          [340, 120],
          [880, 150],
          [930, 190],
          [260, 214],
          [980, 100],
        ]) +
        place(500, 262, { skin: 3, hair: "afro", top: "a", L: [-22, -58], R: [24, -58] }) +
        place(590, 262, { skin: 1, hair: "long", hc: 2, top: "y", R: [30, -104] }) +
        place(690, 262, {
          skin: 5,
          scarf: "n",
          top: "r",
          dress: true,
          L: [-22, -58],
          R: [22, -58],
        }) +
        '<rect x="420" y="230" width="370" height="14" rx="6" class="xw"/><rect x="436" y="244" width="338" height="18" rx="6" class="xw"/>' +
        tiles +
        '<rect x="444" y="214" width="44" height="16" rx="3" class="xt"/><path d="M452 220h28M452 225h18" class="qk" stroke-width="2"/>' +
        place(850, 262, { skin: 2, hair: "short", hc: 3, top: "b", glasses: true, R: [30, -104] }) +
        '<path d="M744 56a52 36 0 1 1 8 52l-26 14 8-18a52 36 0 0 1 10-48z" class="xw"/><circle cx="728" cy="86" r="5.5" class="xk"/><circle cx="748" cy="86" r="5.5" class="xk"/><circle cx="768" cy="86" r="5.5" class="xk"/>' +
        '<ellipse cx="446" cy="112" rx="52" ry="26" class="xw"/><circle cx="478" cy="146" r="5" class="xw"/><circle cx="486" cy="158" r="3" class="xw"/><path d="M416 124l12-22 12 22z" class="xa"/><circle cx="450" cy="112" r="11" class="xy"/><rect x="466" y="102" width="20" height="20" rx="4" class="xr"/>',
    );
  },

  // 2: Statistics (court, hoop, bar graph, a kid with a clipboard)
  2: () => {
    const bars = [40, 78, 112, 64, 92]
      .map(
        (h, i) =>
          `<rect x="${666 + i * 40}" y="${200 - h}" width="28" height="${h}" rx="4" class="xa"/>`,
      )
      .join("");
    return frame(
      '<rect y="0" width="1200" height="230" class="xp" fill-opacity=".5"/>' +
        '<path d="M0 74h1200M0 150h1200" class="qk" stroke-width="2" stroke-opacity=".08"/>' +
        `<rect y="250" width="1200" height="70" class="xg"/><path d="M0 250h1200" class="qk" stroke-width="3" stroke-opacity=".2"/><path d="M360 320a150 80 0 0 1 480 0" class="qw" stroke-width="5"/>` +
        // hoop
        '<rect x="326" y="40" width="70" height="50" rx="5" class="xw"/><rect x="346" y="62" width="30" height="24" class="qk" stroke-width="2.5"/><path d="M361 90v172" class="qk" stroke-width="7"/><ellipse cx="361" cy="100" rx="24" ry="6" class="qr" stroke-width="4"/><path d="M337 102l8 24h32l8-24" class="qk" stroke-width="1.8" stroke-opacity=".6"/>' +
        '<path d="M498 196Q470 60 384 98" class="qk" stroke-width="2.5" stroke-dasharray="2 7"/><circle cx="454" cy="103" r="12" class="xr"/><path d="M442 103h24M454 91v24" class="qk" stroke-width="1.5"/>' +
        // bar graph board
        '<rect x="640" y="56" width="236" height="170" rx="12" class="xw"/><path d="M656 204h204M656 204V76" class="qk" stroke-width="3"/>' +
        '<path d="M656 164h204M656 124h204M656 84h204" class="qk" stroke-width="1" stroke-opacity=".15"/>' +
        bars +
        '<path d="M700 226v36M820 226v36" class="qk" stroke-width="6"/>' +
        place(470, 262, { skin: 5, hair: "locs", top: "a", L: [-24, -20], R: [30, -64] }) +
        place(570, 262, {
          skin: 1,
          hair: "short",
          hc: 4,
          top: "w",
          bot: "a",
          R: [30, -64],
          L: [-14, -56],
        }) +
        '<rect x="544" y="176" width="28" height="38" rx="4" class="xy"/><rect x="549" y="182" width="18" height="28" rx="2" class="xw"/><path d="M552 190h12M552 196h12M552 202h7" class="qk" stroke-width="2"/>' +
        place(935, 262, { skin: 3, hair: "afro", hc: 1, top: "b", L: [-40, -92], R: [20, -44] }) +
        shadow(361, 262, 22),
    );
  },

  // 3: Ratios (kitchen counter, two pitchers, a 2:3 token card)
  3: () => {
    const jars = [430, 478, 526, 574]
      .map((x, i) =>
        `<rect x="${x}" y="70" width="34" height="${i % 2 ? 30 : 40}" rx="6" class="xw"/><rect x="${x + 4}" y="${i % 2 ? 62 : 58}" width="26" height="10" rx="3" class="${i % 2 ? "xa" : "xy"}"/>`.replace(
          'y="70"',
          `y="${i % 2 ? 70 : 60}"`,
        ),
      )
      .join("");
    return frame(
      '<rect y="0" width="1200" height="236" class="xp" fill-opacity=".45"/>' +
        floor +
        '<rect x="410" y="100" width="260" height="8" rx="4" class="xs3"/>' +
        jars +
        '<rect x="760" y="46" width="96" height="70" rx="8" class="xw"/><path d="M776 66h64M776 80h64M776 94h40" class="qk" stroke-width="3" stroke-opacity=".5"/><circle cx="808" cy="46" r="5" class="xr"/>' +
        place(440, 262, { skin: 3, hair: "locs", top: "y", L: [-16, -52], R: [38, -62] }) +
        place(810, 262, {
          skin: 2,
          hair: "short",
          hc: 3,
          top: "r",
          glasses: true,
          L: [-30, -56],
          R: [20, -56],
        }) +
        '<rect x="372" y="228" width="460" height="14" rx="7" class="xw"/><rect x="384" y="242" width="436" height="20" rx="8" class="xa"/>' +
        '<path d="M520 228l-8-52h38l-8 52z" class="xy"/><path d="M550 186q18 0 16 18" class="qy" stroke-width="5"/><path d="M588 228l-8-52h38l-8 52z" class="xb"/><path d="M618 186q18 0 16 18" class="qb" stroke-width="5"/>' +
        '<rect x="660" y="172" width="126" height="54" rx="8" class="xw"/><circle cx="688" cy="190" r="9" class="xy"/><circle cx="712" cy="190" r="9" class="xy"/><circle cx="688" cy="210" r="9" class="xb"/><circle cx="712" cy="210" r="9" class="xb"/><circle cx="736" cy="210" r="9" class="xb"/><path d="M752 184v36" class="qk" stroke-width="2" stroke-dasharray="3 5"/>' +
        confetti([
          [260, 120],
          [300, 190],
          [920, 130],
          [960, 200],
          [220, 70],
        ]) +
        bush(210, 262, 1.2) +
        bush(1000, 262, 1.1),
    );
  },

  // 4: Percent (storefront, sale tag, a 10x10 grid sign)
  4: () => {
    let awn = "";
    for (let i = 0; i < 9; i++)
      awn += `<path d="M${520 + i * 40} 84h40v26a20 20 0 0 1-40 0z" class="${i % 2 ? "xw" : "xa"}"/>`;
    let grid = "";
    for (let i = 1; i < 10; i++) grid += `M${928 + i * 10} 116v100M928 ${116 + i * 10}h100`;
    const shoes = [570, 628, 686]
      .map(
        (x, i) =>
          `<path d="M${x} 196v-18q0-4 4-4h9l6 9 16 4q7 2 7 9z" class="${["xr", "xy", "xa"][i]}"/><rect x="${x - 1}" y="194" width="44" height="5" rx="2.5" class="xk"/>`,
      )
      .join("");
    return frame(
      hills() +
        floor +
        tree(220, 262, 1.1) +
        '<rect x="520" y="84" width="360" height="178" rx="6" class="xw"/>' +
        awn +
        '<rect x="548" y="148" width="190" height="90" rx="6" class="xt"/><path d="M548 198h190" class="qk" stroke-width="3" stroke-opacity=".3"/>' +
        shoes +
        '<rect x="770" y="152" width="74" height="110" rx="6" class="xs3"/><circle cx="828" cy="208" r="4" class="xy"/>' +
        // sale tag
        '<path d="M672 30l0 24" class="qk" stroke-width="2"/><rect x="636" y="52" width="76" height="48" rx="12" class="xy" transform="rotate(-6 674 76)"/><circle cx="660" cy="68" r="5.5" class="qk" stroke-width="3"/><circle cx="688" cy="86" r="5.5" class="qk" stroke-width="3"/><path d="M690 62L658 92" class="qk" stroke-width="3.5"/>' +
        // 10x10 sign
        '<path d="M978 216v46" class="qk" stroke-width="7"/><rect x="920" y="108" width="116" height="116" rx="8" class="xw"/><rect x="928" y="116" width="100" height="60" rx="2" class="xa" fill-opacity=".7"/>' +
        `<path d="${grid}" class="qk" stroke-width="1" stroke-opacity=".35"/>` +
        place(450, 262, { skin: 4, hair: "short", hc: 1, top: "a", L: [-24, -44], R: [28, -26] }) +
        '<path d="M466 236l-4-26h26l-4 26z" class="xy"/><path d="M470 210q4-10 10 0" class="qk" stroke-width="2"/>' +
        place(
          380,
          262,
          { skin: 2, hair: "bun", hc: 2, top: "r", dress: true, R: [30, -86] },
          0.75,
        ) +
        confetti([
          [300, 150],
          [340, 90],
          [1090, 130],
          [1060, 250],
        ]),
    );
  },

  // 5: Area and volume (garden beds with a grid, a big box, a yardstick)
  5: () => {
    let soil = "";
    for (let i = 1; i < 4; i++) soil += `M${340 + i * 42.5} 208v54`;
    soil += "M340 235h170";
    let sprouts = "";
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 4; c++)
        sprouts += `<path d="M${361 + c * 42.5} ${224 + r * 27}v-10m0 0q-9-2-10-9m10 9q9-2 10-9" class="qn" stroke-width="3"/>`;
    return frame(
      hills() +
        fence(262, 1000, 150) +
        floor +
        '<rect x="340" y="208" width="170" height="54" rx="7" class="xs4"/>' +
        `<path d="${soil}" class="qs5" stroke-width="2"/>` +
        sprouts +
        '<rect x="332" y="204" width="186" height="8" rx="4" class="xs2"/>' +
        place(584, 262, { skin: 2, hair: "short", hc: 1, top: "n", L: [-26, -40], R: [32, -34] }) +
        '<path d="M606 236h22l-3 14h-16z" class="xb"/><path d="M628 240l14-6" class="qb" stroke-width="3"/>' +
        '<rect x="730" y="186" width="94" height="76" class="xs2"/><path d="M730 186l32-28h94l-32 28z" class="xs1"/><path d="M824 186l32-28v76l-32 28z" class="xs3"/><path d="M777 186v76M777 186l32-28" class="qy" stroke-width="7" stroke-opacity=".8"/>' +
        place(690, 262, { skin: 5, hair: "afro", top: "a", L: [-18, -44], R: [28, -100] }) +
        '<rect x="708" y="152" width="9" height="110" rx="2" class="xy"/><path d="M708 166h6M708 180h9M708 194h6M708 208h9M708 222h6M708 236h9" class="qk" stroke-width="1.6"/>' +
        place(
          900,
          262,
          { skin: 3, scarf: "y", top: "w", dress: true, L: [-24, -56], R: [26, -56] },
          0.95,
        ) +
        confetti([
          [260, 110],
          [300, 160],
          [1000, 90],
          [1050, 150],
        ]) +
        tree(180, 262, 1.2),
    );
  },

  // 6: Expressions and exponents (square arrays 1, 4, 9, and a child filling the next)
  6: () => {
    const grp = (x0, k, cls) => {
      let s = "";
      for (let r = 0; r < k; r++)
        for (let c = 0; c < k; c++)
          s += `<rect x="${x0 + c * 27}" y="${262 - (r + 1) * 27 + 1}" width="25" height="25" rx="5" class="${cls}"/>`;
      return s;
    };
    let next = "";
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        const done = r * 4 + c < 10;
        const x = 650 + c * 27;
        const y = 262 - (r + 1) * 27 + 1;
        next += done
          ? `<rect x="${x}" y="${y}" width="25" height="25" rx="5" class="xr"/>`
          : `<rect x="${x}" y="${y}" width="25" height="25" rx="5" class="qk" stroke-width="2" stroke-dasharray="3 4" stroke-opacity=".5"/>`;
      }
    return frame(
      hills() +
        cloud(220, 80) +
        floor +
        grp(344, 1, "xa") +
        grp(400, 2, "xy") +
        grp(500, 3, "xb") +
        next +
        place(
          300,
          262,
          { skin: 1, hair: "short", hc: 2, top: "a", L: [-20, -44], R: [28, -88] },
          0.9,
        ) +
        place(800, 262, { skin: 4, hair: "afro", top: "n", L: [-26, -52], R: [-48, -94] }) +
        '<rect x="738" y="162" width="25" height="25" rx="5" class="xr"/>' +
        place(900, 262, { skin: 2, hair: "bun", hc: 1, top: "y", dress: true, R: [20, -52] }, 0.8) +
        tree(1040, 262, 1.1) +
        confetti([
          [240, 150],
          [940, 120],
          [1100, 180],
          [180, 220],
        ]),
    );
  },

  // 7: Integers and the coordinate plane (thermometer, a route on a map board, a bus stop)
  7: () => {
    let ticks = "";
    for (let i = 0; i < 9; i++) ticks += `M342 ${84 + i * 18}h${i === 4 ? 20 : 11}`;
    return frame(
      hills() +
        floor +
        '<rect x="320" y="56" width="20" height="170" rx="10" class="xw"/><circle cx="330" cy="236" r="18" class="xr"/><rect x="325" y="140" width="10" height="96" class="xr"/>' +
        `<path d="${ticks}" class="qk" stroke-width="2.4"/>` +
        '<path d="M570 262l24-66M776 262l-24-66" class="qs4" stroke-width="7"/><rect x="520" y="56" width="262" height="170" rx="12" class="xw"/>' +
        '<path d="M570 76v132M520 140h262M630 76v132M690 76v132M750 76v132M550 106h200M550 174h200" class="qk" stroke-width="1" stroke-opacity=".18"/><path d="M521 140h260M651 57v168" class="qk" stroke-width="3"/>' +
        '<path d="M580 188L630 150L690 170L740 96" class="qa" stroke-width="5"/><circle cx="630" cy="150" r="6" class="xk"/><circle cx="690" cy="170" r="6" class="xk"/><circle cx="580" cy="188" r="6" class="xk"/><path d="M740 96q-12-14-12-26a12 12 0 0 1 24 0q0 12-12 26z" class="xr"/><circle cx="740" cy="70" r="4.5" class="xw"/>' +
        place(460, 262, { skin: 1, hair: "long", hc: 2, top: "b", L: [-20, -50], R: [34, -100] }) +
        '<path d="M878 262V90" class="qk" stroke-width="7"/><rect x="852" y="76" width="54" height="64" rx="10" class="xy"/><rect x="862" y="88" width="34" height="22" rx="5" class="xw"/><circle cx="870" cy="124" r="4" class="xk"/><circle cx="889" cy="124" r="4" class="xk"/>' +
        place(960, 262, { skin: 4, hair: "short", hc: 1, top: "a", L: [-20, -50], R: [30, -100] }) +
        tree(190, 262, 1.1) +
        confetti([
          [250, 130],
          [290, 200],
          [1090, 110],
          [1060, 220],
        ]),
    );
  },

  // 8: Equations and inequalities (a level seesaw: two friends and a sack balance blocks)
  8: () => {
    const blocks =
      '<rect x="668" y="174" width="24" height="22" rx="4" class="xr"/><rect x="694" y="174" width="24" height="22" rx="4" class="xy"/><rect x="681" y="152" width="24" height="22" rx="4" class="xb"/>';
    return frame(
      hills() +
        fence(220, 400, 170) +
        floor +
        '<path d="M960 262l30-132M1060 262l-30-132M1000 130h60M1040 130l0 0" class="qk" stroke-width="6"/><path d="M1005 130v78M1045 130v78" class="qk" stroke-width="2"/><rect x="995" y="206" width="60" height="9" rx="4" class="xy"/>' +
        '<path d="M572 262l28-56 28 56z" class="xa"/><rect x="372" y="196" width="456" height="12" rx="6" class="xy"/>' +
        place(430, 232, {
          skin: 4,
          hair: "locs",
          top: "r",
          sit: true,
          L: [20, -46],
          R: [26, -44],
        }) +
        '<path d="M470 196q-8-30 4-44h26q12 14 4 44z" class="xs2"/><path d="M478 152q10-12 20 0" class="qs4" stroke-width="4"/>' +
        place(
          770,
          232,
          { skin: 1, hair: "short", hc: 4, top: "b", sit: true, L: [20, -46], R: [26, -44] },
          1,
          true,
        ) +
        blocks +
        '<circle cx="600" cy="202" r="6" class="xk"/>' +
        confetti([
          [250, 90],
          [320, 130],
          [900, 100],
          [940, 170],
          [1120, 150],
        ]) +
        tree(130, 262, 1.2),
    );
  },

  // 9: Two variables (a graph climbing in steps, and a friend on a bike)
  9: () => {
    const dots = [
      [424, 196],
      [466, 168],
      [508, 140],
      [550, 112],
      [592, 84],
    ];
    return frame(
      hills() +
        cloud(220, 70) +
        floor +
        '<rect y="262" width="1200" height="16" class="xk" fill-opacity=".12"/>' +
        '<rect x="360" y="48" width="270" height="194" rx="12" class="xw"/><path d="M392 214V74M392 214H610" class="qk" stroke-width="3"/><path d="M392 186H610M392 158H610M392 130H610M392 102H610M446 214V74M500 214V74M554 214V74" class="qk" stroke-width="1" stroke-opacity=".15"/>' +
        `<path d="M${dots.map((d) => d.join(" ")).join("L")}" class="qa" stroke-width="5"/>` +
        dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" class="xr"/>`).join("") +
        '<path d="M495 242v20M495 242l4-8" class="qk" stroke-width="0"/>' +
        place(690, 262, { skin: 3, hair: "afro", hc: 1, top: "y", L: [-26, -50], R: [-44, -92] }) +
        // the bike
        '<circle cx="850" cy="240" r="22" class="qk" stroke-width="5"/><circle cx="936" cy="240" r="22" class="qk" stroke-width="5"/><path d="M850 240L880 204H920L936 240M880 204L896 240H850M920 204l-6-18h14" class="qa" stroke-width="5"/><path d="M866 196h26" class="qk" stroke-width="6"/>' +
        place(
          884,
          238,
          { skin: 2, hair: "cap", cap: "a", top: "r", sit: true, L: [34, -50], R: [38, -50] },
          0.78,
        ) +
        shadow(893, 264, 62, 5) +
        confetti([
          [260, 150],
          [300, 210],
          [1050, 90],
          [1100, 170],
        ]) +
        tree(180, 262, 1.1),
    );
  },

  // 10: Math is... (sunrise over the hill; a family looks up, a kite, a constellation, an open "Math is...")
  10: () => {
    let rays = "";
    for (let i = 0; i < 11; i++) {
      const a = (-170 + i * 16) * (Math.PI / 180);
      rays += `M${(600 + Math.cos(a) * 112).toFixed(1)} ${(236 + Math.sin(a) * 112).toFixed(1)}L${(600 + Math.cos(a) * 136).toFixed(1)} ${(236 + Math.sin(a) * 136).toFixed(1)}`;
    }
    return frame(
      '<path d="M0 0h1200v140H0z" class="xy" fill-opacity=".14"/>' +
        `<path d="${rays}" class="qy" stroke-width="7"/>` +
        sun(600, 236, 92) +
        '<path d="M190 66L238 96L296 74L338 116L394 92" class="qk" stroke-width="2" stroke-opacity=".35"/>' +
        [
          [190, 66],
          [238, 96],
          [296, 74],
          [338, 116],
          [394, 92],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" class="xy"/>`)
          .join("") +
        '<path d="M0 262Q260 196 560 240T1200 214V320H0z" class="xn"/><path d="M0 286Q300 236 640 270T1200 250V320H0z" class="xa" fill-opacity=".35"/>' +
        // the kite
        '<path d="M810 34l30 38-30 44-30-44z" class="xr"/><path d="M810 34v82M780 72h60" class="qw" stroke-width="2"/><path d="M810 116q-14 22 2 44t-6 42" class="qk" stroke-width="2"/><path d="M808 134l-10 6 10 6zM812 166l10 6-10 6z" class="xw"/>' +
        place(470, 262, {
          skin: 4,
          scarf: "a",
          top: "w",
          dress: true,
          L: [-30, -90],
          R: [22, -50],
        }) +
        place(
          540,
          262,
          { skin: 2, hair: "bun", hc: 1, top: "y", dress: true, R: [28, -90] },
          0.72,
        ) +
        place(
          700,
          262,
          { skin: 5, hair: "short", hc: 1, top: "b", L: [-20, -54], R: [30, -120] },
          0.95,
        ) +
        '<path d="M728 142Q770 160 800 204" class="qk" stroke-width="1.6" stroke-opacity=".5"/>' +
        '<path d="M300 138a46 32 0 1 1 6 46l-22 12 6-16a46 32 0 0 1 10-42z" class="xw"/><circle cx="288" cy="160" r="5" class="xk"/><circle cx="306" cy="160" r="5" class="xk"/><circle cx="324" cy="160" r="5" class="xk"/>' +
        '<path d="M900 140q30-30 60 0v70q-30-16-60 0zM960 140q30-30 60 0v70q-30-16-60 0z" class="xw"/><path d="M960 150v62" class="qk" stroke-width="2" stroke-opacity=".3"/>' +
        confetti(
          [
            [250, 190],
            [1110, 120],
            [1080, 200],
          ],
          "xw",
        ),
    );
  },
};

export const SCENE_IDS = Object.keys(scenes).map(Number);
/** The scene as a body fragment (used inside the Open Graph card). */
export const sceneBody = (n) => scenes[n]();
export const renderScene = (n) => svg({ w: 1200, h: 320, slice: true, body: sceneBody(n) });

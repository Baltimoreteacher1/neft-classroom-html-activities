// Adventure Worlds art: original inline SVG in the site illustration style (src/art/kit.js: flat editorial
// shapes with no outlines, form from a lit and a shade side, soft contact shadows, one warm light; thin strokes
// only for real line details such as ink, string and water ripples). No ids, scripts, <text> or external refs:
// every picture is drawn inside noDefs(). Backgrounds 400x300, objects 200x200. The view resolves a key here
// first, then in src/book/art.js, so a world can use either library.
import {
  P,
  circle,
  cloud,
  contact,
  ellipse,
  light,
  noDefs,
  path,
  poly,
  rect,
  rrect,
  shade,
  stroke,
  tree,
  tuft,
} from "../art/kit.js";

const SKY = "#cfe8ee";
const SAND = "#ecd3a0";
const ROCK = "#8f949c";
const LAVA = "#34383f";

const svg = (vb, draw) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${noDefs(draw)}</svg>`;
const sq = (draw) => svg("0 0 200 200", draw);
const wide = (draw) => svg("0 0 400 300", draw);

/** A sea anemone: a column with a ring of tentacles (open) or a closed dome. */
const anemone = (x, y, c, open = true) =>
  open
    ? contact(x, y, 12, 3) +
      path(`M${x - 9} ${y}v-14h18v14z`, shade(c, 0.15)) +
      rect(x - 9, y - 14, 6, 14, light(c, 0.2)) +
      [-14, -7, 0, 7, 14]
        .map((dx) =>
          stroke(`M${x} ${y - 14}q${dx} -10 ${dx * 1.3} -18`, dx > 0 ? shade(c, 0.1) : c, 5),
        )
        .join("") +
      [-14, -7, 0, 7, 14].map((dx) => circle(x + dx * 1.3, y - 32, 2.6, light(c, 0.4))).join("")
    : contact(x, y, 13, 3) +
      path(`M${x - 11} ${y}q0 -16 11 -16q11 0 11 16z`, c) +
      path(`M${x} ${y - 16}q11 0 11 16h-8q0 -12 -3 -16z`, shade(c, 0.2)) +
      circle(x - 4, y - 9, 2.4, light(c, 0.5));
const star = (x, y, r, c) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    const rad = i % 2 ? r * 0.42 : r;
    d += `${i ? "L" : "M"}${Math.round((x + rad * Math.cos(a)) * 10) / 10} ${Math.round((y + rad * Math.sin(a)) * 10) / 10}`;
  }
  return path(`${d}Z`, c) + circle(x, y, r * 0.3, light(c, 0.3));
};
/** Pencil lying diagonally, tip at the lower left. */
const pencil = (x, y, len = 50) =>
  `<g transform="translate(${x} ${y}) rotate(-56)">${rrect(1, 3, len, 10, 3, "#1c2f4a", 'opacity=".16"')}${rect(0, 0, len, 10, P.gold)}${rect(0, 5, len, 5, shade(P.gold, 0.2))}${rect(len, 0, 7, 10, P.coralLight)}${path("M0 0L-12 5L0 10Z", "#f0d6b0")}${path("M-8 3.3L-12 5L-8 6.7Z", P.ink)}</g>`;
/** Lined paper strokes (ink lines are genuine line details). */
const lines = (x, y, ws, c = "#a9b4be", gap = 12) =>
  stroke(ws.map((w, i) => `M${x} ${y + i * gap}h${w}`).join(""), c, 2);

const ART_LIST = [
  {
    key: "adv-empty-case",
    en: "An empty display case",
    es: "Una vitrina vacía",
    svg: sq(
      () =>
        rect(0, 0, 200, 200, "#f1e2cc") +
        rect(0, 176, 200, 24, "#d9bd93") +
        rect(0, 176, 200, 3, light("#d9bd93", 0.3)) +
        contact(100, 188, 72, 7, 0.25) +
        rect(40, 128, 120, 58, P.navy) +
        rect(124, 128, 36, 58, shade(P.navy, 0.2)) +
        rrect(54, 140, 56, 26, 2, P.ivory) +
        lines(60, 149, [40, 28], "#7f8b97", 8) +
        rrect(138, 140, 14, 18, 2, P.gold) +
        circle(145, 147, 2.4, P.ink) +
        rrect(34, 120, 132, 10, 2, P.ivory) +
        rect(34, 126, 132, 4, shade(P.ivory, 0.15)) +
        rect(44, 40, 112, 80, "#cfe8f0", 'opacity=".55"') +
        rect(44, 40, 112, 4, "#ffffff", 'opacity=".8"') +
        rect(150, 40, 6, 80, "#9fc6d4", 'opacity=".6"') +
        stroke("M58 56l24 -10M58 74l40 -20", "#ffffff", 4, 'opacity=".85"') +
        rect(76, 104, 48, 16, P.ivory) +
        rect(76, 114, 48, 6, shade(P.ivory, 0.12)) +
        ellipse(100, 103, 18, 5, "#1c2f4a", 'opacity=".12"') +
        `<ellipse cx="100" cy="103" rx="18" ry="5" fill="none" stroke="#8a96a3" stroke-width="1.6" stroke-dasharray="4 3"/>`,
    ),
  },
  {
    key: "adv-compass",
    en: "An old brass compass",
    es: "Una brújula antigua de bronce",
    svg: sq(
      () =>
        contact(100, 182, 64, 8, 0.22) +
        `<circle cx="100" cy="16" r="9" fill="none" stroke="${shade(P.gold, 0.25)}" stroke-width="5"/>` +
        rrect(90, 20, 20, 16, 5, P.gold) +
        rect(102, 20, 8, 16, shade(P.gold, 0.2)) +
        circle(100, 106, 72, shade("#b9772f", 0.2)) +
        circle(98, 104, 72, "#b9772f") +
        circle(100, 104, 60, P.gold) +
        path("M150 70a60 60 0 0 1 -6 90a72 72 0 0 0 6 -90z", shade(P.gold, 0.25)) +
        circle(100, 104, 50, P.ivory) +
        circle(103, 107, 46, shade(P.ivory, 0.05)) +
        stroke(
          "M100 58v8M100 142v8M54 104h8M138 104h8M68 72l5 5M132 72l-5 5M68 136l5 -5M132 136l-5 -5",
          P.navy,
          2,
        ) +
        poly(
          [
            [100, 66],
            [112, 104],
            [88, 104],
          ],
          P.coral,
        ) +
        poly(
          [
            [100, 66],
            [112, 104],
            [100, 104],
          ],
          shade(P.coral, 0.2),
        ) +
        poly(
          [
            [100, 142],
            [112, 104],
            [88, 104],
          ],
          P.navy,
        ) +
        poly(
          [
            [100, 142],
            [112, 104],
            [100, 104],
          ],
          shade(P.navy, 0.25),
        ) +
        circle(100, 104, 6, P.gold) +
        stroke("M58 80q10 -16 26 -22", "#ffffff", 5, 'opacity=".75"'),
    ),
  },
  {
    key: "adv-tide-pool",
    en: "A rocky tide pool",
    es: "Una poza de marea rocosa",
    svg: wide(
      () =>
        rect(0, 0, 400, 80, SKY) +
        rect(0, 70, 400, 62, P.teal) +
        rect(0, 70, 400, 8, P.tealLight) +
        stroke(
          "M20 92q14 -6 28 0M120 86q14 -6 28 0M250 98q14 -6 28 0M340 88q14 -6 28 0",
          P.ivory,
          2.5,
        ) +
        path("M-4 130q60 -26 120 -10q50 -24 110 -4q70 -26 178 0v188H-4z", ROCK) +
        path(
          "M-4 136q60 -24 120 -8q50 -22 110 -4q70 -24 178 0v-12q-108 -26 -178 0q-60 -20 -110 4q-60 -16 -120 10z",
          light(ROCK, 0.3),
        ) +
        path("M-4 190q90 -14 160 0q90 -18 248 4v110H-4z", shade(ROCK, 0.15)) +
        ellipse(200, 214, 144, 48, shade(ROCK, 0.35)) +
        path("M60 206q0 -40 140 -42q150 2 146 44q-4 44 -146 46q-144 -2 -140 -48z", shade(ROCK, 0.45)) +
        path("M66 210q4 -34 134 -38q138 2 140 38q-6 38 -140 40q-130 -2 -134 -40z", "#1f6f80") +
        stroke("M84 198q20 -20 116 -22q100 2 120 24", SKY, 3, 'opacity=".55"') +
        anemone(120, 238, P.coral) +
        anemone(162, 244, P.coralLight) +
        anemone(286, 238, P.gold, false) +
        star(228, 228, 18, P.orange) +
        path("M300 202q14 -14 26 0q-10 4 -12 14z", P.navyDeep) +
        path("M304 214q6 -10 16 -4l-4 8z", shade(P.navyDeep, 0.1)) +
        circle(312, 200, 2, "#5b7a99") +
        [
          [28, 156],
          [46, 160],
          [350, 152],
        ]
          .map(
            ([x, y]) =>
              poly(
                [
                  [x, y],
                  [x + 8, y - 14],
                  [x + 16, y],
                ],
                P.ivory,
              ) +
              poly(
                [
                  [x + 8, y - 14],
                  [x + 16, y],
                  [x + 8, y],
                ],
                shade(P.ivory, 0.15),
              ),
          )
          .join("") +
        stroke("M200 284q4 -12 10 0q4 -12 10 0M90 290q4 -14 10 0", P.leaf, 4),
    ),
  },
  {
    key: "adv-volcano",
    en: "A volcano with an old slope and a young lava flow",
    es: "Un volcán con una ladera vieja y un flujo de lava joven",
    svg: wide(
      () =>
        rect(0, 0, 400, 300, "#f6e3c9") +
        circle(330, 58, 34, "#fbeccf") +
        circle(330, 58, 22, P.gold) +
        circle(326, 54, 16, P.goldLight) +
        cloud(92, 62, 0.55) +
        path("M-4 260l160 -170q20 -16 40 -16h10q20 0 40 16l160 170z", "#7a767c") +
        path("M210 74q20 0 40 16l160 170H230q-6 -100 -20 -186z", shade("#7a767c", 0.18)) +
        path("M176 76q24 -10 48 0q-24 8 -48 0z", P.navyDeep) +
        path("M206 82q-6 40 10 80q14 40 4 96h52q-6 -50 -30 -96q-20 -40 -24 -80z", LAVA) +
        path(
          "M214 86q6 36 18 70q20 44 16 102h-8q2 -56 -16 -98q-14 -36 -10 -74z",
          light(LAVA, 0.12),
        ) +
        stroke("M216 120q6 30 20 52M228 200q8 26 10 56", P.coral, 2, 'opacity=".7"') +
        path("M-4 260l160 -170q14 -10 26 -14q-30 70 -60 120q-40 50 -126 64z", P.leaf) +
        path("M-4 260l160 -170q8 -6 14 -8q-46 80 -90 130q-40 40 -84 48z", light(P.leaf, 0.15)) +
        tree(40, 254, 0.5, { kind: "bush", tone: P.grass }) +
        tree(80, 236, 0.5, { kind: "bush" }) +
        tree(112, 206, 0.42, { kind: "bush", tone: P.grass }) +
        tree(138, 170, 0.32, { kind: "bush" }) +
        [
          [262, 232, 4],
          [280, 210, 3],
          [246, 246, 3],
        ]
          .map(([x, y, r]) => circle(x, y, r, P.grassLight))
          .join("") +
        rect(-4, 258, 408, 46, SAND) +
        rect(-4, 258, 408, 4, light(SAND, 0.3)) +
        tuft(330, 288) +
        stroke("M186 60q-6 -16 6 -26M210 56q8 -14 0 -28", "#c3c6cc", 4),
    ),
  },
  {
    key: "adv-seabird",
    en: "A seabird at its burrow",
    es: "Un ave marina en su madriguera",
    svg: sq(
      () =>
        rect(0, 0, 200, 200, SKY) +
        cloud(150, 40, 0.3) +
        stroke("M30 40q8 -8 16 0q8 -8 16 0M118 26q6 -6 12 0q6 -6 12 0", P.navy, 2) +
        path("M-4 150q60 -30 120 -10q50 -16 88 6v58H-4z", P.grass) +
        path("M-4 150q60 -30 120 -10q50 -16 88 6v8q-40 -18 -88 -4q-60 -22 -120 8z", P.grassLight) +
        tuft(20, 196) +
        ellipse(146, 168, 24, 14, shade(P.soil, 0.2)) +
        path("M124 172q12 -24 36 -14q10 6 8 18q-20 -10 -44 -4z", P.navyDeep) +
        contact(98, 162, 30, 5, 0.25) +
        stroke("M90 150v12M104 150v12", P.coralLight, 4) +
        path("M70 108q-30 -12 -50 6q24 2 40 16z", "#4a4650") +
        path("M118 100q30 -26 56 -14q-20 6 -40 30z", "#3a3640") +
        path("M64 136q-10 -40 22 -52q30 -8 42 18q8 20 -4 34q-30 14 -60 0z", "#ffffff") +
        path("M108 92q24 6 22 30q-4 20 -8 24q8 -26 -14 -54z", "#dde6ec") +
        circle(100, 80, 18, "#ffffff") +
        path("M106 64a18 18 0 0 1 12 18q-8 -12 -12 -18z", "#dde6ec") +
        circle(104, 76, 3.2, P.ink) +
        circle(105, 75, 1, "#ffffff") +
        path("M116 80l18 4l-18 6z", "#5d5a63") +
        path("M116 85l18 -1l-18 6z", shade("#5d5a63", 0.2)),
    ),
  },
  {
    key: "adv-field-notes",
    en: "A field notebook with a bar chart",
    es: "Un cuaderno de campo con una gráfica de barras",
    svg: sq(
      () =>
        contact(100, 186, 70, 6, 0.22) +
        rrect(40, 26, 128, 160, 8, "#1c2f4a", 'opacity=".14"') +
        rrect(36, 22, 128, 160, 8, P.ivory) +
        rect(150, 22, 14, 160, shade(P.ivory, 0.08), 'rx="4"') +
        [40, 70, 100, 130, 160]
          .map((y) => rrect(26, y - 3, 16, 6, 3, shade(P.stone, 0.3)))
          .join("") +
        stroke("M56 150h92M56 150V60", P.navy, 2) +
        rect(64, 120, 14, 30, P.stone) +
        rect(84, 112, 14, 38, P.tealLight) +
        rect(104, 96, 14, 54, P.teal) +
        rect(124, 74, 14, 76, shade(P.teal, 0.3)) +
        [
          [64, 30],
          [84, 38],
          [104, 54],
          [124, 76],
        ]
          .map(([x, h]) => rect(x + 10, 150 - h, 4, h, "#1c2f4a", 'opacity=".12"'))
          .join("") +
        stroke("M64 44h50", P.navy, 3) +
        pencil(166, 176, 48),
    ),
  },
  // ── The Lost City (worlds/lost-city.js) ──
  {
    key: "adv-carved-gate",
    en: "An ancient stone gate with carved panels and a water channel",
    es: "Una antigua puerta de piedra con paneles tallados y un canal de agua",
    svg: sq(() => {
      const stoneC = "#e2c99a";
      const pillar = (x) =>
        rect(x, 58, 44, 124, stoneC) +
        rect(x + 32, 58, 12, 124, shade(stoneC, 0.16)) +
        rect(x, 58, 4, 124, light(stoneC, 0.3));
      const carve = shade(stoneC, 0.38);
      return (
        rect(0, 0, 200, 200, SKY) +
        path("M-4 150q50 -14 104 -4q56 -12 104 2v56H-4z", P.grass) +
        contact(48, 182, 30, 4, 0.25) +
        contact(152, 182, 30, 4, 0.25) +
        pillar(26) +
        pillar(130) +
        rect(18, 30, 164, 30, stoneC) +
        rect(18, 52, 164, 8, shade(stoneC, 0.16)) +
        rect(18, 30, 164, 4, light(stoneC, 0.3)) +
        // Panel 3 (lintel): a sun under a narrow notch
        rect(97, 30, 6, 7, SKY) +
        circle(100, 46, 8, P.gold) +
        circle(98, 44, 4, P.goldLight) +
        stroke("M86 46h-7M114 46h7M90 38l-4 -4M110 38l4 -4", carve, 2) +
        // Panel 1 (left pillar): a circle with wavy water flowing down steps
        circle(48, 74, 7, P.tealLight) +
        stroke("M48 82q-5 5 0 10q5 5 0 10q-5 5 2 10", P.teal, 2.4) +
        stroke("M34 134h10v-8h10v-8h10", carve, 2.4) +
        stroke("M50 112q2 6 6 8", P.teal, 2) +
        // Panel 2 (right pillar): seven baskets in a row above a doorway
        Array.from({ length: 7 }, (_, i) =>
          path(`M${134 + i * 5.4} 74h4.6l-0.8 6h-3z`, P.coral),
        ).join("") +
        path("M142 108v-14h20v14z", shade(stoneC, 0.45)) +
        rect(144, 96, 16, 12, shade(stoneC, 0.62)) +
        // Panel 4 (right pillar): one person holding out a cup to another
        circle(140, 136, 3.2, carve) +
        path("M137 140h6l1 14h-8z", carve) +
        stroke("M143 144h6", carve, 2) +
        path("M149 141h5l-1 5h-3z", P.gold) +
        circle(162, 136, 3.2, carve) +
        path("M159 140h6l1 14h-8z", carve) +
        stroke("M159 144h-4", carve, 2) +
        // the stone channel beside the path
        rect(72, 182, 56, 14, P.stone) +
        rect(78, 186, 44, 10, P.water) +
        stroke("M84 191q5 -3 10 0q5 3 10 0q5 -3 10 0", P.waterLight, 2) +
        stroke("M30 62q-10 20 -4 44M170 66q10 18 4 40", P.leafDark, 3) +
        [
          [27, 82],
          [25, 98],
          [175, 84],
        ]
          .map(([x, y]) => ellipse(x, y, 4.5, 3, P.leaf))
          .join("")
      );
    }),
  },
  {
    key: "adv-water-journal",
    en: "An old water-keeper's notebook with a sketch of a stone channel",
    es: "Un cuaderno antiguo de guardiana del agua con un dibujo de un canal de piedra",
    svg: sq(
      () =>
        contact(100, 180, 84, 7, 0.22) +
        path(
          "M18 46q40 -10 82 4q42 -14 82 -4v126q-40 -10 -82 4q-42 -14 -82 -4z",
          shade("#e8dcc0", 0.15),
        ) +
        path("M20 44q40 -10 80 4q40 -14 80 -4v124q-40 -10 -80 4q-40 -14 -80 -4z", "#f6ecd6") +
        path("M100 48q40 -14 80 -4v124q-40 -10 -80 4z", P.ivory) +
        path("M92 48h16v124h-16z", shade("#f6ecd6", 0.1), 'opacity=".6"') +
        lines(32, 64, [54, 46, 52, 40, 50, 36, 48], "#a39a88") +
        stroke("M114 140l14 -14h14l14 -14h14", P.stoneDark, 2.5) +
        stroke("M112 70q8 -10 18 0q8 10 18 0q8 -10 18 0", P.teal, 3) +
        circle(124, 96, 7, P.tealLight) +
        stroke("M131 96q14 4 18 16q4 12 18 14", P.teal, 2.5) +
        path("M54 18h8v34l-4 -5l-4 5z", P.coral) +
        pencil(170, 186, 50),
    ),
  },
  {
    key: "adv-route-map",
    en: "A hand-drawn map of three routes up a ridge: river steps, a cliff path and a channel path",
    es: "Un mapa dibujado a mano de tres rutas por una colina: escalones del río, un sendero del acantilado y un sendero del canal",
    svg: sq(
      () =>
        contact(100, 186, 86, 7, 0.22) +
        path("M16 30l56 -10l56 10l56 -10v150l-56 10l-56 -10l-56 10z", SAND) +
        path("M72 20l56 10v150l-56 -10z", shade(SAND, 0.1)) +
        path("M128 30l56 -10v150l-56 10z", light(SAND, 0.2)) +
        stroke("M30 176q14 -40 4 -80q-8 -40 10 -70", P.water, 7) +
        stroke("M30 176q14 -40 4 -80q-8 -40 10 -70", P.waterLight, 2) +
        stroke("M44 150h8M44 140h8M46 130h8M46 120h8", P.navy, 2) +
        stroke("M96 168l-6 -20l8 -14l-8 -18l8 -16l-6 -18l8 -20", "#8a5a2f", 3) +
        stroke("M84 98l14 14M98 98l-14 14", P.red, 4) +
        stroke(
          "M118 172q30 -10 40 -36q8 -22 -10 -40q-16 -18 4 -40",
          P.leaf,
          3.5,
          'stroke-dasharray="7 6"',
        ) +
        rect(136, 44, 36, 8, P.grassLight) +
        rect(140, 54, 32, 8, P.grass) +
        circle(154, 34, 7, P.tealLight) +
        poly(
          [
            [100, 178],
            [90, 166],
            [110, 166],
          ],
          P.gold,
        ) +
        star(176, 160, 9, P.gold),
    ),
  },
];

export const ADV_ART = Object.freeze(
  ART_LIST.map((a) => ({ key: a.key, cat: "adventure", en: a.en, es: a.es, svg: a.svg })),
);

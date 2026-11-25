// Teach It Back: small labelled drawings for the few ideas a picture truly helps. Inline SVG, no external files.
// Shapes take their colour from CSS classes in teach-back.css (tokens only). Every drawing has a text description,
// so it is never the only way to get the idea. The text in a drawing is English, the language being practiced.
const A = (x1, y1, x2, y2) => `<line class="tb-v-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#tb-arrow)"/>`;
const T = (x, y, s, cls = "") => `<text class="tb-v-text ${cls}" x="${x}" y="${y}">${s}</text>`;

const DRAWINGS = {
  "area-perimeter": {
    w: 360,
    alt: "A rectangle 4 units long and 3 units wide. The squares inside it show the area, 12 square units. The outline around it shows the perimeter, 14 units.",
    body: () =>
      `${Array.from({ length: 12 }, (_, i) => `<rect class="tb-v-fill" x="${20 + (i % 4) * 40}" y="${24 + Math.floor(i / 4) * 40}" width="40" height="40"/>`).join("")}` +
      `<rect class="tb-v-outline" x="20" y="24" width="160" height="120"/>` +
      T(100, 168, "4 units long", "mid") + T(190, 88, "3 units wide") +
      T(200, 40, "Area: the squares") + T(200, 58, "inside (12 square units)") +
      T(200, 120, "Perimeter: the way") + T(200, 138, "around (14 units)"),
  },
  "fraction-division": {
    h: 170,
    alt: "One bar cut into 4 equal parts with 3 parts shaded. The picture shows 3 divided by 4 equals three fourths.",
    body: () =>
      [0, 1, 2, 3].map((i) => `<rect class="${i < 3 ? "tb-v-fill-strong" : "tb-v-fill"}" x="${40 + i * 60}" y="40" width="60" height="50"/>`).join("") +
      `<rect class="tb-v-outline" x="40" y="40" width="240" height="50"/>` +
      T(160, 124, "3 ÷ 4 = 3/4", "mid big") + T(160, 150, "3 shared by 4 equal parts", "mid"),
  },
  "water-cycle": {
    w: 360,
    alt: "The water cycle: the Sun heats water so it evaporates and rises as vapor; the vapor cools into a cloud (condensation); the cloud drops rain or snow (precipitation) that flows back to the water.",
    body: () =>
      `<circle class="tb-v-fill-strong" cx="48" cy="40" r="22"/>` + T(48, 84, "Sun", "mid") +
      `<path class="tb-v-fill" d="M190 54a22 22 0 0 1 40-12a20 20 0 0 1 36 10a16 16 0 0 1-4 30h-68a16 16 0 0 1-4-28z"/>` +
      T(228, 20, "Condensation", "mid") +
      `<path class="tb-v-fill" d="M0 150q45-14 90 0t90 0t90 0t90 0v30H0z"/>` +
      A(120, 140, 160, 84) + T(14, 124, "Evaporation") +
      A(228, 104, 228, 140) + T(240, 126, "Precipitation"),
  },
  "food-web": {
    alt: "A food web. Arrows point from grass to rabbit and mouse, from rabbit and mouse to fox, and from mouse to owl, showing the direction energy moves.",
    body: () =>
      T(22, 92, "Grass") + T(140, 52, "Rabbit") + T(140, 132, "Mouse") + T(262, 72, "Fox") + T(262, 150, "Owl") +
      A(64, 84, 132, 56) + A(64, 94, 132, 126) + A(190, 52, 252, 70) + A(190, 128, 252, 80) + A(190, 138, 252, 148) +
      T(160, 176, "Arrows point the way energy goes.", "mid"),
  },
  "map-scale": {
    h: 150,
    alt: "A scale bar labeled 0, 10, 20, and 30 miles. One inch on the map stands for 10 miles.",
    body: () =>
      [0, 1, 2].map((i) => `<rect class="${i % 2 ? "tb-v-fill" : "tb-v-fill-strong"}" x="${40 + i * 80}" y="60" width="80" height="22"/>`).join("") +
      `<rect class="tb-v-outline" x="40" y="60" width="240" height="22"/>` +
      [0, 10, 20, 30].map((m, i) => T(40 + i * 80, 108, String(m), "mid")).join("") +
      T(160, 134, "miles", "mid") + T(160, 36, "1 inch on the map = 10 miles", "mid"),
  },
  "number-line": {
    h: 130,
    alt: "A number line from negative 5 to 5. Numbers to the left of zero are negative and get smaller the farther left they are.",
    body: () =>
      `<line class="tb-v-line" x1="20" y1="80" x2="300" y2="80"/>` +
      Array.from({ length: 11 }, (_, i) => `<line class="tb-v-line" x1="${30 + i * 26}" y1="72" x2="${30 + i * 26}" y2="88"/>${T(30 + i * 26, 112, String(i - 5), "mid")}`).join("") +
      T(80, 44, "smaller", "mid") + T(240, 44, "larger", "mid") + A(110, 52, 40, 52) + A(210, 52, 280, 52),
  },
};

export const hasVisual = (key) => Boolean(DRAWINGS[key]);
export const visualAlt = (key) => DRAWINGS[key]?.alt || "";

/** The drawing as an SVG string (labelled for screen readers), or "" for a concept without one. */
export function visualSVG(key, titleId) {
  const d = DRAWINGS[key];
  if (!d) return "";
  return `<svg class="tb-visual" viewBox="0 0 ${d.w || 320} ${d.h || 190}" role="img" aria-labelledby="${titleId}" focusable="false"><title id="${titleId}">${d.alt}</title><defs><marker id="tb-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="tb-v-head" d="M0 0L10 5L0 10z"/></marker></defs>${d.body()}</svg>`;
}

// Shared pictures for the grade 3 arts lesson on primary and secondary colors and composition (worker c8).
// Colors are the traditional paint wheel: red, yellow and blue are primary; orange, green and purple are mixed from pairs of them.
// Every color is also named in words, so color is never the only signal.

export const C = {
  red: "#D6322E",
  yellow: "#F2C51B",
  blue: "#2563B8",
  orange: "#F28A1E",
  green: "#2F9E54",
  purple: "#7B4AA3",
};

const r1 = (n) => Math.round(n * 10) / 10;
const txt = (x, y, text, size = 16, weight = 700, fill = "ink") => ({
  t: "text",
  x,
  y,
  text,
  size,
  weight,
  fill,
});
const circ = (cx, cy, r, fill, extra = {}) => ({
  t: "circle",
  cx,
  cy,
  r,
  fill,
  stroke: "ink",
  sw: 3,
  ...extra,
});

/** Two overlapping circles whose overlap is the mixed color. `say` adds the result word under the picture. */
export function mixing(a, b, result, say = false) {
  const r = 78;
  const x1 = 175;
  const x2 = 265;
  const cy = 150;
  const half = (x2 - x1) / 2;
  const hh = Math.sqrt(r * r - half * half);
  const xm = (x1 + x2) / 2;
  const lens = `M${r1(xm)} ${r1(cy - hh)} A${r} ${r} 0 0 0 ${r1(xm)} ${r1(cy + hh)} A${r} ${r} 0 0 0 ${r1(xm)} ${r1(cy - hh)} Z`;
  return {
    kind: "shapes",
    w: 440,
    h: 290,
    alt: `Two overlapping circles. The left circle is ${a}, the right circle is ${b}, and the place where they overlap is ${say ? result : "a new mixed color"}.`,
    items: [
      circ(x1, cy, r, C[a]),
      circ(x2, cy, r, C[b]),
      { t: "path", d: lens, fill: C[result], stroke: "ink", sw: 3 },
      txt(x1 - 30, 48, a, 20),
      txt(x2 + 30, 48, b, 20),
      ...(say
        ? [txt(220, 270, `${a} + ${b} = ${result}`, 22)]
        : [txt(220, 270, `${a} + ${b} = ?`, 22)]),
    ],
  };
}

/** Three swatches in a row. */
const swatches = (names, alt, extra = {}) => ({
  kind: "shapes",
  w: 480,
  h: 220,
  alt,
  items: names.flatMap((n, i) => [
    circ(90 + i * 150, 100, 52, C[n]),
    txt(90 + i * 150, 190, n, 20),
  ]),
  ...extra,
});

export const PRIMARY_ROW = swatches(
  ["red", "yellow", "blue"],
  "Three circles in a row: red, yellow and blue, each with its name underneath.",
);

export const SECONDARY_ROW = {
  kind: "shapes",
  w: 480,
  h: 250,
  alt: "Three small mixing pictures in a row. Red and yellow make orange. Yellow and blue make green. Blue and red make purple.",
  items: [
    ["red", "yellow", "orange"],
    ["yellow", "blue", "green"],
    ["blue", "red", "purple"],
  ].flatMap(([a, b, c], i) => {
    const cx = 80 + i * 160;
    return [
      circ(cx - 20, 90, 34, C[a]),
      circ(cx + 20, 90, 34, C[b]),
      {
        t: "path",
        d: `M${cx} ${r1(90 - 27.5)} A34 34 0 0 0 ${cx} ${r1(90 + 27.5)} A34 34 0 0 0 ${cx} ${r1(90 - 27.5)} Z`,
        fill: C[c],
        stroke: "ink",
        sw: 2.5,
      },
      txt(cx, 170, `${a} + ${b}`, 15),
      txt(cx, 200, "makes", 14, 400),
      circ(cx, 222, 14, C[c], { sw: 2.5 }),
    ];
  }),
};

/** The color wheel: six wedges, primary colors marked with a dot and the words printed on each. */
export function colorWheel() {
  const cx = 240;
  const cy = 165;
  const R = 130;
  const order = ["red", "orange", "yellow", "green", "blue", "purple"];
  const P = (deg, rad) => [
    r1(cx + rad * Math.cos((deg * Math.PI) / 180)),
    r1(cy + rad * Math.sin((deg * Math.PI) / 180)),
  ];
  const items = [];
  order.forEach((name, i) => {
    const mid = -90 + 60 * i;
    const [x1, y1] = P(mid - 30, R);
    const [x2, y2] = P(mid + 30, R);
    items.push({
      t: "path",
      d: `M${cx} ${cy} L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`,
      fill: C[name],
      stroke: "ink",
      sw: 3,
    });
    const [lx, ly] = P(mid, 82);
    items.push(
      txt(
        lx,
        ly + 5,
        name,
        15,
        700,
        ["blue", "purple", "red", "green"].includes(name) ? "paper" : "ink",
      ),
    );
    if (["red", "yellow", "blue"].includes(name)) {
      const [dx, dy] = P(mid, R + 14);
      items.push({ t: "circle", cx: dx, cy: dy, r: 6, fill: "ink" });
    }
  });
  items.push(txt(240, 318, "A dot marks each primary color", 14, 700));
  return {
    kind: "shapes",
    w: 480,
    h: 330,
    alt: "A color wheel with six wedges in order around the circle: red, orange, yellow, green, blue and purple. Each wedge has its name. Small dots outside the red, yellow and blue wedges mark the primary colors.",
    items,
  };
}

/** Two matching squares on different backgrounds to show contrast. */
export const CONTRAST_PAIR = {
  kind: "shapes",
  w: 480,
  h: 260,
  alt: "Two panels. The left panel has a yellow square on a very pale yellow background and is hard to see, labeled low contrast. The right panel has a yellow square on a dark navy background and stands out, labeled high contrast.",
  items: [
    { t: "rect", x: 20, y: 20, w: 205, h: 180, rx: 8, fill: "#FBF1C4", stroke: "ink", sw: 3 },
    { t: "rect", x: 72, y: 62, w: 100, h: 100, fill: C.yellow, stroke: "ink", sw: 2 },
    txt(122, 232, "low contrast", 17),
    { t: "rect", x: 255, y: 20, w: 205, h: 180, rx: 8, fill: "#1B2A4A", stroke: "ink", sw: 3 },
    { t: "rect", x: 307, y: 62, w: 100, h: 100, fill: C.yellow, stroke: "ink", sw: 2 },
    txt(357, 232, "high contrast", 17),
  ],
};

/** A balance beam with matching shapes on both ends. */
export const BALANCE = {
  kind: "shapes",
  w: 480,
  h: 260,
  alt: "A level beam resting on a triangle. A red circle of the same size sits at each end, so both sides look equal. Below it is the word balanced.",
  items: [
    {
      t: "poly",
      points: [
        [240, 120],
        [208, 190],
        [272, 190],
      ],
      fill: "#E9E2D0",
      stroke: "ink",
      sw: 3,
    },
    { t: "rect", x: 60, y: 112, w: 360, h: 10, rx: 4, fill: "ink" },
    circ(110, 80, 30, C.red),
    circ(370, 80, 30, C.red),
    txt(240, 232, "balanced: both sides look equal", 17),
  ],
};

/** A blue circle partly covered by a red circle. */
export const OVERLAP = {
  kind: "shapes",
  w: 480,
  h: 260,
  alt: "A blue circle partly hidden behind a red circle. The red circle sits on top and covers part of the blue circle.",
  items: [
    circ(200, 120, 70, C.blue),
    circ(270, 120, 70, C.red),
    txt(240, 232, "the red covers part of the blue", 17),
  ],
};

// ---- Artwork A: a farm scene used for the label-the-composition activity and the vocabulary pictures ----
const barn = [
  { t: "rect", x: 240, y: 138, w: 100, h: 72, fill: "#C0392B", stroke: "ink", sw: 3 },
  {
    t: "poly",
    points: [
      [230, 140],
      [290, 98],
      [350, 140],
    ],
    fill: "#7F2A22",
    stroke: "ink",
    sw: 3,
  },
  { t: "rect", x: 276, y: 168, w: 30, h: 42, fill: "#F2E2C4", stroke: "ink", sw: 2 },
];
export const ARTWORK_A_ITEMS = [
  { t: "rect", x: 0, y: 0, w: 480, h: 205, fill: "#CFE6F7" },
  { t: "ellipse", cx: 90, cy: 44, rx: 44, ry: 16, fill: "#FFFFFF" },
  { t: "ellipse", cx: 390, cy: 36, rx: 38, ry: 13, fill: "#FFFFFF" },
  {
    t: "path",
    d: "M0 205 Q60 130 130 172 Q200 118 280 176 Q380 128 480 182 L480 205 Z",
    fill: "#9CC5A1",
    stroke: "ink",
    sw: 2,
  },
  { t: "rect", x: 0, y: 205, w: 480, h: 115, fill: "#5C9E5A" },
  ...barn,
  { t: "rect", x: 338, y: 150, w: 14, h: 60, fill: "#6B4423", stroke: "ink", sw: 2 },
  circ(345, 138, 34, "#2E7D32"),
  { t: "icon", name: "flower", x: 12, y: 232, s: 84 },
  { t: "icon", name: "sunflower", x: 96, y: 246, s: 70 },
  { t: "icon", name: "flower", x: 170, y: 252, s: 62 },
];
export const ARTWORK_A_ALT =
  "A painting of a farm. Pale hills and sky are far away. A red barn with a dark roof stands in the middle, and a tree in front overlaps its right edge. Big flowers fill the bottom left corner.";
export const artworkA = (extra = {}) => ({
  kind: "shapes",
  w: 480,
  h: 320,
  alt: ARTWORK_A_ALT,
  items: ARTWORK_A_ITEMS,
  ...extra,
});

/** Artwork A with a callout label. */
export const artworkCallout = (text, x, y, tx, ty, alt) => ({
  kind: "labeled",
  w: 480,
  h: 320,
  alt,
  base: artworkA(),
  labels: [{ text, x, y, tx, ty }],
});

// ---- Artwork B: a boat at night, used for the second label task ----
const pine = (cx, base) => ({
  t: "poly",
  points: [
    [cx, base - 110],
    [cx - 34, base],
    [cx + 34, base],
  ],
  fill: "#1E5631",
  stroke: "ink",
  sw: 2,
});
export const ARTWORK_B_ITEMS = [
  { t: "rect", x: 0, y: 0, w: 480, h: 320, fill: "#1B2A4A" },
  { t: "rect", x: 0, y: 220, w: 480, h: 100, fill: "#243B6B" },
  circ(240, 100, 46, "#F4D03F"),
  { t: "rect", x: 205, y: 232, w: 70, h: 6, rx: 3, fill: "#F4D03F" },
  { t: "rect", x: 220, y: 248, w: 40, h: 6, rx: 3, fill: "#F4D03F" },
  pine(70, 220),
  pine(410, 220),
  { t: "rect", x: 64, y: 220, w: 12, h: 20, fill: "#4A2F1B" },
  { t: "rect", x: 404, y: 220, w: 12, h: 20, fill: "#4A2F1B" },
  { t: "path", d: "M190 282 L290 282 L270 304 L210 304 Z", fill: "#8E2B22", stroke: "ink", sw: 2 },
  {
    t: "poly",
    points: [
      [240, 232],
      [240, 280],
      [284, 280],
    ],
    fill: "#F7F1E1",
    stroke: "ink",
    sw: 2,
  },
  { t: "line", x1: 240, y1: 232, x2: 240, y2: 282, stroke: "ink", sw: 3 },
];
export const ARTWORK_B_ALT =
  "A painting of a boat at night. A bright yellow moon hangs in a dark navy sky. Two matching dark green trees stand at the left and right edges. A small boat with a white sail floats on the water below the moon.";
export const artworkB = (extra = {}) => ({
  kind: "shapes",
  w: 480,
  h: 320,
  alt: ARTWORK_B_ALT,
  items: ARTWORK_B_ITEMS,
  ...extra,
});

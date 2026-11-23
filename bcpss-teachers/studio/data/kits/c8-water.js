// Shared pictures for the grade 4 interdisciplinary lesson "Water in Our Community" (worker c8).
// Rates used in this lesson (a sink faucet at 2 gallons a minute and so on) are sample values for practice, not measurements.

export const COMMUNITY = {
  kind: "scene",
  bg: "field",
  w: 480,
  h: 320,
  alt: "A small town. A house, a school, a hospital, a fire truck, a store and a farm each have a water drop above them, showing that everyone in a community uses water. A tree stands at the bottom.",
  items: [
    ...["house:home", "school:school", "hospital:hospital", "fire-truck:truck", "store:store", "farm:farm"].flatMap((pair, i) => {
      const [icon, label] = pair.split(":");
      const x = 14 + i * 77;
      return [
        { icon, x, y: 150, s: 58, label },
        { icon: "drop", x: x + 14, y: 104, s: 30 },
      ];
    }),
    { icon: "tree", x: 210, y: 250, s: 52 },
  ],
};

const lake = (cx, cy, rx, ry) => ({
  t: "ellipse",
  cx,
  cy,
  rx,
  ry,
  fill: "sky",
  stroke: "ink",
  sw: 3,
});
export const SOURCES = {
  kind: "shapes",
  w: 480,
  h: 280,
  alt: "Three places a community can get water. A large lake called a reservoir on the left, a winding river in the middle and a well that goes down into the ground on the right.",
  items: [
    { t: "rect", x: 0, y: 0, w: 480, h: 280, fill: "#EAF4E4" },
    lake(95, 120, 80, 48),
    { t: "text", x: 95, y: 200, text: "reservoir or lake", size: 16, weight: 700 },
    {
      t: "path",
      d: "M215 20 Q260 70 215 110 Q170 150 230 190 Q280 225 250 262",
      fill: "none",
      stroke: "#4A90C8",
      sw: 14,
      cap: "round",
    },
    { t: "text", x: 250, y: 272, text: "river", size: 16, weight: 700 },
    { t: "rect", x: 372, y: 60, w: 70, h: 40, rx: 4, fill: "#B8B3A6", stroke: "ink", sw: 3 },
    { t: "rect", x: 380, y: 100, w: 54, h: 112, fill: "#8B6F4E", stroke: "ink", sw: 3 },
    { t: "rect", x: 396, y: 140, w: 22, h: 72, fill: "sky", stroke: "ink", sw: 2 },
    { t: "text", x: 408, y: 240, text: "well", size: 16, weight: 700 },
  ],
};

export const RESERVOIR_CALLOUT = {
  kind: "labeled",
  w: 480,
  h: 300,
  alt: "A large lake held between green hills with a callout labeled reservoir.",
  base: {
    kind: "shapes",
    w: 480,
    h: 300,
    alt: "Green hills around a large lake.",
    items: [
      { t: "rect", x: 0, y: 0, w: 480, h: 300, fill: "#CFE6F7" },
      {
        t: "path",
        d: "M0 180 Q80 90 160 160 Q240 100 320 150 Q400 90 480 170 L480 300 L0 300 Z",
        fill: "#7FB77E",
        stroke: "ink",
        sw: 3,
      },
      { t: "ellipse", cx: 250, cy: 220, rx: 150, ry: 50, fill: "sky", stroke: "ink", sw: 3 },
      { t: "ellipse", cx: 250, cy: 214, rx: 100, ry: 28, fill: "#BFD9F2", opacity: 0.8 },
    ],
  },
  labels: [{ text: "reservoir", x: 250, y: 222, tx: 120, ty: 60 }],
};

export const TREATMENT_FLOW = {
  kind: "flow",
  w: 480,
  h: 300,
  alt: "Six steps in order. 1 Water source. 2 Screen out leaves and sticks. 3 Clump and settle. 4 Filter. 5 Disinfect. 6 Pipes to homes and schools.",
  steps: [
    { label: "Water source", icon: "drop" },
    { label: "Screen out leaves", icon: "magnifier" },
    { label: "Clump and settle", icon: "beaker" },
    { label: "Filter", icon: "flask" },
    { label: "Disinfect", icon: "test-tube" },
    { label: "Pipes to homes", icon: "house" },
  ],
};

export const FILTER_LAYERS = {
  kind: "shapes",
  w: 480,
  h: 300,
  alt: "A cutaway of a filter. Cloudy water pours in at the top, flows through a layer of sand and then a layer of gravel, and clear water drips out at the bottom.",
  items: [
    { t: "rect", x: 140, y: 20, w: 200, h: 50, fill: "#B8A77A", stroke: "ink", sw: 3 },
    { t: "text", x: 240, y: 52, text: "cloudy water", size: 16, weight: 700 },
    { t: "rect", x: 140, y: 80, w: 200, h: 60, fill: "#E3D3A3", stroke: "ink", sw: 3 },
    { t: "text", x: 240, y: 116, text: "sand", size: 16, weight: 700 },
    { t: "rect", x: 140, y: 140, w: 200, h: 60, fill: "#9E9889", stroke: "ink", sw: 3 },
    { t: "text", x: 240, y: 176, text: "gravel", size: 16, weight: 700 },
    { t: "rect", x: 140, y: 210, w: 200, h: 50, fill: "sky", stroke: "ink", sw: 3 },
    { t: "text", x: 240, y: 242, text: "clear water", size: 16, weight: 700 },
  ],
};

export const WASTE_FLOW = {
  kind: "flow",
  w: 480,
  h: 220,
  alt: "Four steps in order. 1 Used water leaves a home. 2 Sewer pipes carry it away. 3 A wastewater plant cleans it. 4 Clean water returns to a river.",
  steps: [
    { label: "Used water leaves a home", icon: "house" },
    { label: "Sewer pipes", icon: "arrow-right" },
    { label: "Wastewater plant cleans it", icon: "beaker" },
    { label: "Clean water returns to a river", icon: "drop" },
  ],
};

export const CYCLE = {
  kind: "cycle",
  w: 480,
  h: 320,
  alt: "The water cycle in four stages in a circle: evaporation, condensation, precipitation and collection, with an arrow from each stage to the next.",
  stages: [
    { label: "Evaporation", icon: "sun" },
    { label: "Condensation", icon: "cloud" },
    { label: "Precipitation", icon: "rain" },
    { label: "Collection", icon: "drop" },
  ],
};

export const EVAPORATION = {
  kind: "scene",
  bg: "water",
  w: 480,
  h: 300,
  alt: "A bright sun over a lake. Three arrows rise from the water toward the sky, showing water turning into vapor.",
  items: [
    { icon: "sun", x: 350, y: 20, s: 80 },
    { icon: "arrow-up", x: 80, y: 90, s: 56 },
    { icon: "arrow-up", x: 180, y: 70, s: 56 },
    { icon: "arrow-up", x: 280, y: 90, s: 56 },
  ],
};

export const CONDENSATION = {
  kind: "scene",
  bg: "sky",
  w: 480,
  h: 300,
  alt: "Water vapor rising as small drops toward a cloud. Three small drops gather together under a growing cloud.",
  items: [
    { icon: "cloud", x: 160, y: 30, s: 150 },
    { icon: "drop", x: 120, y: 190, s: 34 },
    { icon: "drop", x: 220, y: 170, s: 34 },
    { icon: "drop", x: 310, y: 190, s: 34 },
    { icon: "arrow-up", x: 200, y: 215, s: 48 },
  ],
};

export const PRECIPITATION = {
  kind: "scene",
  bg: "sky",
  w: 480,
  h: 300,
  alt: "A gray rain cloud with raindrops falling from it onto the ground.",
  items: [
    { icon: "rain", x: 150, y: 20, s: 170 },
    { icon: "drop", x: 140, y: 210, s: 32 },
    { icon: "drop", x: 220, y: 230, s: 32 },
    { icon: "drop", x: 300, y: 205, s: 32 },
  ],
};

export const GALLON = {
  kind: "tape",
  w: 480,
  h: 180,
  alt: "A bar for 1 gallon split into four equal parts. Each part is labeled 1 quart, so 4 quarts make 1 gallon.",
  parts: [1, 2, 3, 4].map(() => ({ label: "1 quart", units: 1, color: "sky" })),
  total: 4,
};

export const QUART = {
  kind: "tape",
  w: 480,
  h: 180,
  alt: "A bar for 1 gallon split into four equal parts. One part is shaded and labeled 1 quart, which is one fourth of a gallon.",
  parts: [
    { label: "1 quart", units: 1, color: "teal" },
    { label: "", units: 3, color: "line" },
  ],
  total: 4,
};

export const UNITS_TABLE = {
  kind: "table",
  alt: "A table of liquid measures. 1 gallon equals 4 quarts. 1 quart equals 2 pints. 1 pint equals 2 cups. 1 gallon equals 16 cups.",
  head: ["Larger unit", "Equals"],
  rows: [
    ["1 gallon", "4 quarts"],
    ["1 quart", "2 pints"],
    ["1 pint", "2 cups"],
    ["1 gallon", "16 cups"],
  ],
};

export const USE_BARS = {
  kind: "bars",
  w: 480,
  h: 300,
  alt: "A bar chart of sample water use in gallons per minute. A sink faucet 2, a shower 3, a garden hose 10.",
  xLabel: "Water tool",
  yLabel: "Water used",
  unit: "gallons per minute",
  data: [
    { label: "Sink faucet", value: 2 },
    { label: "Shower", value: 3 },
    { label: "Garden hose", value: 10 },
  ],
};

export const SAVE_BARS = {
  kind: "bars",
  w: 480,
  h: 300,
  alt: "A bar chart of sample water used for brushing teeth in gallons. Tap left running for 2 minutes: 4 gallons. Tap turned off while brushing and used for a half minute to rinse: 1 gallon.",
  xLabel: "How the tap is used",
  yLabel: "Gallons used",
  unit: "gallons",
  data: [
    { label: "Tap left running", value: 4 },
    { label: "Tap turned off", value: 1 },
  ],
};

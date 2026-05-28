// Generates self-contained SVG vocab illustrations into assets/vocab-images/.
// Palette mirrors assets/design-tokens.css. ViewBox 0 0 160 120.
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "assets", "vocab-images");
mkdirSync(OUT, { recursive: true });

const C = {
  navy: "#12355b",
  navyLight: "#18466f",
  teal: "#1fa6a2",
  tealLight: "#dff2ee",
  amber: "#f2c15b",
  amberLight: "#fef7e0",
  cream: "#f7f4ec",
  coral: "#d9795d",
  coralLight: "#fce6de",
  ink: "#21313f",
  line: "#d7e2ed",
  white: "#ffffff",
};

function svg(title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" role="img" aria-labelledby="t">
<title id="t">${title}</title>
<rect x="0" y="0" width="160" height="120" rx="10" fill="${C.cream}"/>
${body}
</svg>
`;
}

const T = (x, y, s, fill, txt, weight = 800, anchor = "middle") =>
  `<text x="${x}" y="${y}" font-family="Outfit, system-ui, sans-serif" font-size="${s}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;

const items = {};

// ---- Ratios / proportions ----
items["ratio"] = svg(
  "Ratio: two groups compared with a colon",
  `${[0, 1, 2].map((i) => `<circle cx="${24 + i * 20}" cy="50" r="9" fill="${C.teal}"/>`).join("")}
${[0, 1].map((i) => `<rect x="${96 + i * 20}" y="41" width="18" height="18" rx="4" fill="${C.coral}"/>`).join("")}
${T(80, 56, 22, C.navy, ":")}
${T(80, 92, 14, C.ink, "3 : 2")}`
);

items["unit-rate"] = svg(
  "Unit rate: amount per one unit",
  `<rect x="20" y="30" width="50" height="34" rx="6" fill="${C.teal}"/>
${T(45, 52, 13, C.white, "$6")}
${T(45, 78, 11, C.navy, "3 items")}
${T(82, 56, 18, C.navy, "→")}
<rect x="96" y="30" width="44" height="34" rx="6" fill="${C.amber}"/>
${T(118, 52, 13, C.ink, "$2")}
${T(118, 78, 11, C.navy, "1 item")}`
);
items["rate"] = items["unit-rate"];

items["proportion"] = svg(
  "Proportion: two equal ratios",
  `<rect x="16" y="40" width="44" height="40" rx="6" fill="${C.white}" stroke="${C.teal}" stroke-width="2"/>
${T(38, 65, 16, C.navy, "1/2")}
${T(80, 67, 20, C.coral, "=")}
<rect x="100" y="40" width="44" height="40" rx="6" fill="${C.white}" stroke="${C.teal}" stroke-width="2"/>
${T(122, 65, 16, C.navy, "2/4")}`
);

items["percent"] = svg(
  "Percent: part out of one hundred",
  `<circle cx="60" cy="60" r="36" fill="${C.tealLight}"/>
<path d="M60 60 L60 24 A36 36 0 0 1 91 78 Z" fill="${C.teal}"/>
${T(118, 64, 22, C.navy, "%")}
${T(60, 108, 11, C.ink, "75 out of 100")}`
);

items["discount"] = svg(
  "Discount: price reduced",
  `${T(40, 50, 16, C.muted || C.line, "$40", 800)}
<line x1="22" y1="46" x2="60" y2="46" stroke="${C.coral}" stroke-width="3"/>
${T(40, 50, 16, C.ink, "$40")}
<line x1="22" y1="46" x2="60" y2="46" stroke="${C.coral}" stroke-width="3"/>
<rect x="78" y="34" width="62" height="30" rx="6" fill="${C.coral}"/>
${T(109, 54, 15, C.white, "$28")}
${T(80, 96, 13, C.navy, "30% off")}`
);

items["scale-factor"] = svg(
  "Scale factor: figure enlarged",
  `<rect x="18" y="62" width="26" height="26" rx="3" fill="${C.teal}"/>
${T(72, 64, 16, C.navy, "×2")}
<rect x="92" y="36" width="52" height="52" rx="4" fill="${C.amber}"/>`
);

// ---- Fractions / decimals ----
items["fraction"] = svg(
  "Fraction: part of a whole",
  `<circle cx="60" cy="58" r="38" fill="${C.tealLight}" stroke="${C.teal}" stroke-width="2"/>
<path d="M60 58 L60 20 A38 38 0 0 1 98 58 Z" fill="${C.teal}"/>
<path d="M60 58 L98 58 A38 38 0 0 1 60 96 Z" fill="${C.amber}"/>
${T(124, 62, 15, C.navy, "3/4")}`
);
items["numerator"] = svg(
  "Numerator: top number of a fraction",
  `<rect x="40" y="28" width="80" height="58" rx="8" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
${T(80, 52, 26, C.coral, "3")}
<line x1="54" y1="58" x2="106" y2="58" stroke="${C.navy}" stroke-width="3"/>
${T(80, 80, 22, C.navy, "4")}
${T(80, 104, 10, C.coral, "top = numerator")}`
);

items["decimal"] = svg(
  "Decimal: tenths and hundredths grid",
  `<g>${Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / 10),
      c = i % 10;
    const filled = i < 37;
    return `<rect x="${30 + c * 10}" y="${20 + r * 8}" width="9" height="7" fill="${filled ? C.teal : C.white}" stroke="${C.line}" stroke-width="0.6"/>`;
  }).join("")}</g>
${T(80, 116, 11, C.navy, "0.37")}`
);

// ---- Integers / number line ----
function numberLine(title, markX, label) {
  const ticks = [-3, -2, -1, 0, 1, 2, 3];
  const sx = 80 - 3 * 18;
  const body = `<line x1="14" y1="60" x2="146" y2="60" stroke="${C.navy}" stroke-width="2.5"/>
<polygon points="146,60 138,55 138,65" fill="${C.navy}"/>
<polygon points="14,60 22,55 22,65" fill="${C.navy}"/>
${ticks
    .map((n) => {
      const x = sx + (n + 3) * 18;
      return `<line x1="${x}" y1="54" x2="${x}" y2="66" stroke="${C.navy}" stroke-width="1.5"/>${T(x, 82, 9, C.ink, String(n))}`;
    })
    .join("")}
<circle cx="${sx + (markX + 3) * 18}" cy="60" r="6" fill="${C.coral}"/>
${label ? T(80, 26, 11, C.navy, label) : ""}`;
  return svg(title, body);
}
items["number-line"] = numberLine("Number line with a marked point", 2, "");
items["integer"] = numberLine("Integer: a point on the number line", -2, "…-2, -1, 0, 1, 2…");
items["negative"] = numberLine("Negative: left of zero", -3, "negative ← 0");
items["positive"] = numberLine("Positive: right of zero", 3, "0 → positive");
items["opposite"] = svg(
  "Opposite: same distance from zero",
  numberLine("", 0, "").match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1].replace(
    /<circle[^>]*\/>/,
    `<circle cx="${80 - 3 * 18}" cy="60" r="6" fill="${C.coral}"/><circle cx="${80 + 3 * 18}" cy="60" r="6" fill="${C.teal}"/>` +
      T(80, 26, 11, C.navy, "-3 and 3 are opposites")
  )
);
items["absolute-value"] = svg(
  "Absolute value: distance from zero",
  `<line x1="14" y1="64" x2="146" y2="64" stroke="${C.navy}" stroke-width="2.5"/>
${[-3, 0, 3].map((n) => {
    const x = 80 + n * 20;
    return `<line x1="${x}" y1="58" x2="${x}" y2="70" stroke="${C.navy}" stroke-width="1.5"/>${T(x, 86, 9, C.ink, String(n))}`;
  }).join("")}
<circle cx="${80 - 3 * 20}" cy="64" r="6" fill="${C.coral}"/>
<path d="M20 44 H80" stroke="${C.coral}" stroke-width="2" fill="none" stroke-dasharray="3 3"/>
${T(50, 38, 11, C.coral, "3 units")}
${T(80, 110, 12, C.navy, "|-3| = 3")}`
);

// ---- Geometry: area / volume / shapes ----
function gridRect(w, h, color) {
  const cw = 14,
    ch = 14;
  const ox = 80 - (w * cw) / 2,
    oy = 60 - (h * ch) / 2;
  let cells = "";
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++)
      cells += `<rect x="${ox + c * cw}" y="${oy + r * ch}" width="${cw}" height="${ch}" fill="${color}" stroke="${C.white}" stroke-width="1.5"/>`;
  return cells;
}
items["area"] = svg(
  "Area: square units filling a rectangle",
  `${gridRect(5, 3, C.teal)}${T(80, 112, 11, C.navy, "Area = 15 square units")}`
);
items["square-unit"] = svg(
  "Square unit: one unit square",
  `<rect x="56" y="36" width="48" height="48" fill="${C.teal}" stroke="${C.white}" stroke-width="2"/>
${T(80, 65, 11, C.white, "1 unit²")}
${T(80, 104, 10, C.navy, "1 by 1 square")}`
);
items["perimeter"] = svg(
  "Perimeter: distance around a shape",
  `<rect x="40" y="36" width="80" height="48" fill="none" stroke="${C.coral}" stroke-width="4"/>
${T(80, 64, 11, C.navy, "around")}
${T(80, 104, 10, C.coral, "Perimeter")}`
);

items["volume"] = svg(
  "Volume: stack of unit cubes",
  cubeStack()
);
function cubeStack() {
  const c = [];
  const dx = 14,
    dy = 14,
    dz = 8;
  function cube(x, y) {
    return `<polygon points="${x},${y} ${x + dx},${y - dz} ${x + dx + dz},${y - dz + dy / 2} ${x + dz},${y + dy / 2}" fill="${C.tealLight}"/>
<polygon points="${x},${y} ${x},${y + dy} ${x + dz},${y + dy + dy / 2} ${x + dz},${y + dy / 2}" fill="${C.teal}"/>
<polygon points="${x + dz},${y + dy / 2} ${x + dz + dx},${y + dy / 2 - dz} ${x + dz + dx},${y + dy + dy / 2 - dz} ${x + dz},${y + dy + dy / 2}" fill="${C.navy}"/>`;
  }
  for (let z = 0; z < 2; z++)
    for (let r = 1; r >= 0; r--)
      for (let col = 0; col < 3; col++) {
        const x = 44 + col * dx - z * dz;
        const y = 56 + r * dy - z * dz;
        c.push(cube(x, y));
      }
  return c.join("") + T(80, 112, 11, C.navy, "unit cubes");
}

items["composite-figure"] = svg(
  "Composite figure: shapes combined",
  `<rect x="40" y="50" width="50" height="38" fill="${C.teal}"/>
<rect x="90" y="62" width="34" height="26" fill="${C.amber}"/>
<line x1="90" y1="50" x2="90" y2="88" stroke="${C.white}" stroke-width="2" stroke-dasharray="3 3"/>
${T(80, 104, 10, C.navy, "two shapes joined")}`
);

items["triangle"] = svg(
  "Triangle: three-sided polygon",
  `<polygon points="80,30 122,86 38,86" fill="${C.teal}"/>
<line x1="80" y1="30" x2="80" y2="86" stroke="${C.white}" stroke-width="1.5" stroke-dasharray="3 3"/>
${T(80, 104, 10, C.navy, "base × height ÷ 2")}`
);
items["parallelogram"] = svg(
  "Parallelogram: slanted four-sided shape",
  `<polygon points="44,82 70,38 132,38 106,82" fill="${C.amber}"/>
${T(88, 100, 10, C.navy, "base × height")}`
);
items["trapezoid"] = svg(
  "Trapezoid: two parallel bases",
  `<polygon points="36,82 56,38 110,38 134,82" fill="${C.coral}"/>
${T(83, 34, 9, C.navy, "b₁")}
${T(85, 96, 9, C.navy, "b₂")}`
);
items["rectangular-prism"] = svg(
  "Rectangular prism: 3D box",
  `<polygon points="40,52 100,52 100,90 40,90" fill="${C.teal}"/>
<polygon points="40,52 58,36 118,36 100,52" fill="${C.tealLight}"/>
<polygon points="100,52 118,36 118,74 100,90" fill="${C.navy}"/>
${T(80, 108, 10, C.navy, "length × width × height")}`
);
items["pyramid"] = svg(
  "Pyramid: faces meeting at an apex",
  `<polygon points="80,28 116,84 44,84" fill="${C.amber}"/>
<polygon points="80,28 116,84 132,72" fill="${C.coral}"/>
<line x1="80" y1="28" x2="98" y2="84" stroke="${C.white}" stroke-width="1.2" stroke-dasharray="2 2"/>
${T(80, 102, 10, C.navy, "apex on top")}`
);
items["net"] = svg(
  "Net: unfolded 3D shape",
  `<rect x="64" y="20" width="26" height="26" fill="${C.teal}"/>
<rect x="38" y="46" width="26" height="26" fill="${C.tealLight}"/>
<rect x="64" y="46" width="26" height="26" fill="${C.teal}"/>
<rect x="90" y="46" width="26" height="26" fill="${C.tealLight}"/>
<rect x="116" y="46" width="26" height="26" fill="${C.teal}"/>
<rect x="64" y="72" width="26" height="26" fill="${C.tealLight}"/>
${T(80, 112, 10, C.navy, "flattened faces")}`
);
items["surface-area"] = svg(
  "Surface area: total area of all faces",
  `<polygon points="40,54 96,54 96,90 40,90" fill="${C.coral}"/>
<polygon points="40,54 58,38 114,38 96,54" fill="${C.coralLight}"/>
<polygon points="96,54 114,38 114,74 96,90" fill="${C.amber}"/>
${T(80, 108, 10, C.navy, "add every face")}`
);
items["dimensions"] = svg(
  "Dimensions: length, width, height",
  `<polygon points="40,52 100,52 100,86 40,86" fill="${C.teal}"/>
<polygon points="40,52 58,38 118,38 100,52" fill="${C.tealLight}"/>
<polygon points="100,52 118,38 118,72 100,86" fill="${C.navy}"/>
${T(70, 100, 9, C.navy, "l")}${T(112, 80, 9, C.navy, "h")}${T(80, 48, 9, C.white, "w")}`
);

// ---- Statistics ----
items["mean"] = svg(
  "Mean: values balanced and leveled",
  `${[26, 26, 26, 26].map((h, i) => `<rect x="${30 + i * 26}" y="${88 - 26}" width="18" height="26" fill="${C.teal}"/>`).join("")}
<line x1="22" y1="62" x2="146" y2="62" stroke="${C.coral}" stroke-width="2" stroke-dasharray="4 3"/>
${T(80, 110, 11, C.navy, "equal share")}`
);
items["median"] = svg(
  "Median: middle value when ordered",
  `${[1, 2, 3, 4, 5].map((n, i) => `<rect x="${26 + i * 24}" y="${88 - n * 10}" width="16" height="${n * 10}" fill="${i === 2 ? C.coral : C.teal}"/>`).join("")}
${T(80, 22, 11, C.coral, "middle")}
<polygon points="80,28 74,38 86,38" fill="${C.coral}"/>`
);
items["mode"] = svg(
  "Mode: value that appears most",
  `${[
    [1, C.teal],
    [3, C.coral],
    [3, C.coral],
    [1, C.teal],
  ]
    .map(([n, col], i) => `<rect x="${30 + i * 26}" y="${88 - n * 14}" width="18" height="${n * 14}" fill="${col}"/>`)
    .join("")}
${T(80, 24, 11, C.coral, "most often")}`
);
items["range"] = svg(
  "Range: spread from lowest to highest",
  `<line x1="22" y1="60" x2="146" y2="60" stroke="${C.navy}" stroke-width="2"/>
<circle cx="34" cy="60" r="6" fill="${C.teal}"/>
<circle cx="132" cy="60" r="6" fill="${C.coral}"/>
<line x1="34" y1="40" x2="132" y2="40" stroke="${C.amber}" stroke-width="3"/>
${T(83, 34, 10, C.navy, "high − low")}`
);
items["spread"] = items["range"];
items["histogram"] = svg(
  "Histogram: bars showing frequency",
  `${[20, 38, 30, 46, 24].map((h, i) => `<rect x="${28 + i * 22}" y="${90 - h}" width="20" height="${h}" fill="${C.teal}" stroke="${C.white}" stroke-width="1"/>`).join("")}
<line x1="24" y1="90" x2="146" y2="90" stroke="${C.navy}" stroke-width="2"/>`
);
items["box-plot"] = svg(
  "Box plot: five-number summary",
  `<line x1="24" y1="60" x2="136" y2="60" stroke="${C.navy}" stroke-width="2"/>
<line x1="24" y1="50" x2="24" y2="70" stroke="${C.navy}" stroke-width="2"/>
<line x1="136" y1="50" x2="136" y2="70" stroke="${C.navy}" stroke-width="2"/>
<rect x="54" y="46" width="56" height="28" fill="${C.tealLight}" stroke="${C.teal}" stroke-width="2"/>
<line x1="82" y1="46" x2="82" y2="74" stroke="${C.coral}" stroke-width="3"/>
${T(80, 100, 10, C.navy, "min · Q1 · med · Q3 · max")}`
);
items["data"] = svg(
  "Data: collected values",
  `<rect x="30" y="30" width="100" height="60" rx="6" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
${[0, 1, 2].map((r) => `<line x1="30" y1="${50 + r * 13}" x2="130" y2="${50 + r * 13}" stroke="${C.line}" stroke-width="1"/>`).join("")}
<line x1="64" y1="30" x2="64" y2="90" stroke="${C.line}" stroke-width="1"/>
${T(47, 45, 9, C.teal, "8")}${T(47, 58, 9, C.teal, "5")}${T(97, 45, 9, C.coral, "12")}${T(97, 58, 9, C.coral, "9")}`
);

// ---- Coordinate plane ----
items["coordinate-plane"] = svg(
  "Coordinate plane: x and y axes",
  `<line x1="20" y1="60" x2="140" y2="60" stroke="${C.navy}" stroke-width="2"/>
<line x1="80" y1="14" x2="80" y2="106" stroke="${C.navy}" stroke-width="2"/>
<polygon points="140,60 132,55 132,65" fill="${C.navy}"/>
<polygon points="80,14 75,22 85,22" fill="${C.navy}"/>
<circle cx="104" cy="40" r="5" fill="${C.coral}"/>
<line x1="80" y1="40" x2="104" y2="40" stroke="${C.coral}" stroke-width="1" stroke-dasharray="2 2"/>
<line x1="104" y1="60" x2="104" y2="40" stroke="${C.coral}" stroke-width="1" stroke-dasharray="2 2"/>
${T(132, 74, 9, C.navy, "x")}${T(90, 22, 9, C.navy, "y")}`
);
items["ordered-pair"] = svg(
  "Ordered pair: (x, y) point",
  `<line x1="24" y1="84" x2="140" y2="84" stroke="${C.navy}" stroke-width="2"/>
<line x1="40" y1="20" x2="40" y2="100" stroke="${C.navy}" stroke-width="2"/>
<circle cx="100" cy="44" r="6" fill="${C.coral}"/>
<line x1="40" y1="44" x2="100" y2="44" stroke="${C.coral}" stroke-width="1" stroke-dasharray="2 2"/>
<line x1="100" y1="84" x2="100" y2="44" stroke="${C.coral}" stroke-width="1" stroke-dasharray="2 2"/>
${T(108, 38, 11, C.navy, "(4, 3)")}`
);
items["quadrant"] = svg(
  "Quadrant: four regions of the plane",
  `<rect x="80" y="20" width="60" height="40" fill="${C.tealLight}"/>
<rect x="20" y="20" width="60" height="40" fill="${C.amberLight}"/>
<rect x="20" y="60" width="60" height="40" fill="${C.coralLight}"/>
<rect x="80" y="60" width="60" height="40" fill="${C.cream}"/>
<line x1="20" y1="60" x2="140" y2="60" stroke="${C.navy}" stroke-width="2"/>
<line x1="80" y1="20" x2="80" y2="100" stroke="${C.navy}" stroke-width="2"/>
${T(110, 44, 11, C.navy, "I")}${T(50, 44, 11, C.navy, "II")}${T(50, 86, 11, C.navy, "III")}${T(110, 86, 11, C.navy, "IV")}`
);
items["origin"] = svg(
  "Origin: the point (0, 0)",
  `<line x1="20" y1="60" x2="140" y2="60" stroke="${C.navy}" stroke-width="2"/>
<line x1="80" y1="16" x2="80" y2="104" stroke="${C.navy}" stroke-width="2"/>
<circle cx="80" cy="60" r="7" fill="${C.coral}"/>
${T(102, 76, 12, C.navy, "(0, 0)")}`
);
items["axis"] = svg(
  "Axis: a number line on the grid",
  `<line x1="20" y1="60" x2="140" y2="60" stroke="${C.teal}" stroke-width="3"/>
<line x1="80" y1="16" x2="80" y2="104" stroke="${C.coral}" stroke-width="3"/>
<polygon points="140,60 132,55 132,65" fill="${C.teal}"/>
<polygon points="80,16 75,24 85,24" fill="${C.coral}"/>
${T(128, 78, 10, C.teal, "x-axis")}${T(94, 24, 10, C.coral, "y-axis")}`
);

// ---- Algebra ----
items["expression"] = svg(
  "Expression: numbers and a variable",
  `${T(80, 60, 24, C.navy, "3x + 5")}
${T(80, 92, 10, C.teal, "no equal sign")}`
);
items["variable"] = svg(
  "Variable: a letter for an unknown",
  `<rect x="52" y="34" width="56" height="44" rx="8" fill="${C.amber}"/>
${T(80, 66, 26, C.navy, "x")}
${T(80, 100, 10, C.navy, "stands for a number")}`
);
items["coefficient"] = svg(
  "Coefficient: number multiplying a variable",
  `${T(72, 62, 30, C.coral, "4")}${T(96, 62, 30, C.navy, "x")}
<path d="M58 70 q14 12 28 0" stroke="${C.coral}" stroke-width="2" fill="none"/>
${T(80, 100, 10, C.coral, "coefficient = 4")}`
);
items["equation"] = svg(
  "Equation: two sides that are equal",
  `${T(48, 60, 20, C.navy, "x + 2")}
${T(80, 60, 22, C.coral, "=")}
${T(112, 60, 20, C.navy, "7")}
${T(80, 94, 10, C.teal, "balanced with =")}`
);
items["inequality"] = svg(
  "Inequality: values compared with < or >",
  `<line x1="20" y1="64" x2="140" y2="64" stroke="${C.navy}" stroke-width="2"/>
${[40, 70, 100].map((x) => `<line x1="${x}" y1="58" x2="${x}" y2="70" stroke="${C.navy}" stroke-width="1.5"/>`).join("")}
<circle cx="70" cy="64" r="6" fill="${C.white}" stroke="${C.coral}" stroke-width="3"/>
<line x1="70" y1="64" x2="140" y2="64" stroke="${C.coral}" stroke-width="4"/>
${T(80, 96, 12, C.navy, "x > 2")}`
);
items["exponent"] = svg(
  "Exponent: repeated multiplication",
  `${T(64, 64, 30, C.navy, "5")}${T(86, 46, 18, C.coral, "3")}
${T(80, 98, 11, C.teal, "5 × 5 × 5")}`
);
items["distributive-property"] = svg(
  "Distributive property: multiply across",
  `${T(80, 50, 16, C.navy, "3(x + 2)")}
<path d="M60 56 q8 14 18 0" stroke="${C.coral}" stroke-width="2" fill="none"/>
<path d="M60 56 q20 22 36 0" stroke="${C.teal}" stroke-width="2" fill="none"/>
${T(80, 92, 15, C.navy, "3x + 6")}`
);
items["pattern"] = svg(
  "Pattern: a repeating or growing sequence",
  `${[1, 2, 3, 4].map((n, i) => `<g>${Array.from({ length: n }, (_, k) => `<circle cx="${24 + i * 32}" cy="${84 - k * 12}" r="5" fill="${C.teal}"/>`).join("")}</g>`).join("")}
${T(80, 104, 10, C.navy, "+1 each step")}`
);

// ---- Operations / factors ----
items["multiply"] = svg(
  "Multiply: equal groups",
  `${[0, 1, 2].map((g) => `<g>${[0, 1].map((i) => `<circle cx="${30 + g * 38}" cy="${48 + i * 18}" r="7" fill="${C.teal}"/>`).join("")}</g>`).join("")}
${T(80, 100, 12, C.navy, "3 × 2 = 6")}`
);
items["divide"] = svg(
  "Divide: sharing into equal groups",
  `${[0, 1, 2].map((g) => `<rect x="${26 + g * 38}" y="40" width="30" height="40" rx="6" fill="none" stroke="${C.teal}" stroke-width="2"/>`).join("")}
${[0, 1, 2].map((g) => [0, 1].map((i) => `<circle cx="${41 + g * 38}" cy="${52 + i * 16}" r="5" fill="${C.coral}"/>`).join("")).join("")}
${T(80, 100, 12, C.navy, "6 ÷ 3 = 2")}`
);
items["factor"] = svg(
  "Factor: numbers multiplied together",
  `${T(40, 58, 22, C.teal, "3")}${T(60, 58, 18, C.navy, "×")}${T(80, 58, 22, C.teal, "4")}${T(100, 58, 18, C.navy, "=")}${T(122, 58, 22, C.coral, "12")}
${T(80, 92, 10, C.navy, "3 and 4 are factors")}`
);
items["multiple"] = svg(
  "Multiple: skip-counting results",
  `<line x1="16" y1="60" x2="146" y2="60" stroke="${C.navy}" stroke-width="2"/>
${[3, 6, 9, 12].map((n, i) => `<circle cx="${34 + i * 32}" cy="60" r="7" fill="${C.teal}"/>${T(34 + i * 32, 84, 9, C.navy, String(n))}`).join("")}
${T(80, 26, 10, C.coral, "multiples of 3")}`
);
items["prime-number"] = svg(
  "Prime number: only two factors",
  `<circle cx="80" cy="54" r="30" fill="${C.amber}"/>
${T(80, 62, 26, C.navy, "7")}
${T(80, 102, 10, C.navy, "factors: 1 and 7")}`
);
items["reciprocal"] = svg(
  "Reciprocal: flip the fraction",
  `${T(48, 56, 18, C.navy, "3/4")}
${T(80, 58, 18, C.coral, "→")}
${T(112, 56, 18, C.teal, "4/3")}
${T(80, 92, 10, C.navy, "flip top and bottom")}`
);

// ---- Generic helpers used by synonyms ----
items["operation"] = svg(
  "Operation: a math action",
  `${["+", "−", "×", "÷"].map((s, i) => `<circle cx="${40 + i * 28}" cy="56" r="14" fill="${[C.teal, C.amber, C.coral, C.navy][i]}"/>${T(40 + i * 28, 62, 16, C.white, s)}`).join("")}`
);
items["measurement"] = svg(
  "Measurement: a ruler with units",
  `<rect x="20" y="48" width="120" height="24" rx="4" fill="${C.amber}"/>
${Array.from({ length: 13 }, (_, i) => `<line x1="${24 + i * 9.3}" y1="48" x2="${24 + i * 9.3}" y2="${i % 2 ? 60 : 64}" stroke="${C.navy}" stroke-width="1.2"/>`).join("")}
${T(80, 92, 11, C.navy, "units of length")}`
);
items["number"] = svg(
  "Number: a place-value value",
  `<rect x="30" y="40" width="100" height="40" rx="8" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
${T(80, 70, 28, C.navy, "247")}
${T(80, 102, 10, C.teal, "hundreds tens ones")}`
);
items["bar-model"] = svg(
  "Bar model: parts forming a whole",
  `<rect x="24" y="40" width="112" height="22" rx="4" fill="${C.navy}"/>
<rect x="24" y="68" width="64" height="22" rx="4" fill="${C.teal}"/>
<rect x="90" y="68" width="46" height="22" rx="4" fill="${C.amber}"/>
${T(56, 84, 10, C.white, "part")}${T(113, 84, 10, C.navy, "part")}`
);

// ---- Category fallbacks ----
items["cat-number"] = svg(
  "Number concept",
  `<circle cx="80" cy="56" r="34" fill="${C.tealLight}"/>
${T(80, 66, 30, C.navy, "#")}
${T(80, 104, 10, C.teal, "number")}`
);
items["cat-shape"] = svg(
  "Shape concept",
  `<polygon points="80,28 110,50 98,86 62,86 50,50" fill="${C.teal}"/>
${T(80, 106, 10, C.navy, "shape")}`
);
items["cat-operation"] = svg(
  "Operation concept",
  `${["+", "−", "×", "÷"].map((s, i) => `<circle cx="${40 + i * 28}" cy="52" r="13" fill="${[C.teal, C.amber, C.coral, C.navy][i]}"/>${T(40 + i * 28, 58, 15, C.white, s)}`).join("")}
${T(80, 96, 10, C.navy, "operation")}`
);
items["cat-data"] = svg(
  "Data concept",
  `${[24, 40, 30, 48].map((h, i) => `<rect x="${36 + i * 24}" y="${88 - h}" width="18" height="${h}" fill="${C.teal}"/>`).join("")}
<line x1="30" y1="88" x2="138" y2="88" stroke="${C.navy}" stroke-width="2"/>
${T(80, 108, 10, C.navy, "data")}`
);
items["cat-measurement"] = svg(
  "Measurement concept",
  `<rect x="20" y="50" width="120" height="22" rx="4" fill="${C.amber}"/>
${Array.from({ length: 13 }, (_, i) => `<line x1="${24 + i * 9.3}" y1="50" x2="${24 + i * 9.3}" y2="${i % 2 ? 60 : 64}" stroke="${C.navy}" stroke-width="1.2"/>`).join("")}
${T(80, 96, 10, C.navy, "measurement")}`
);

let count = 0;
for (const [slug, content] of Object.entries(items)) {
  writeFileSync(resolve(OUT, `${slug}.svg`), content, "utf8");
  count++;
}
console.log(`Wrote ${count} SVG files to ${OUT}`);

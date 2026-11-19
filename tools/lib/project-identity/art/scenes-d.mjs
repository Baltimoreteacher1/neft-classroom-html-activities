import { alpha, darken, lighten, mix } from "../color.mjs";

/* Group D: statistics-a, statistics-b, world-architect, statistics-life, synthesis */

const n1 = (v) => Number(v.toFixed(1));
/** Polar point, 0 degrees = up, clockwise. */
const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [n1(cx + r * Math.sin(a)), n1(cy - r * Math.cos(a))];
};
const wedge = (cx, cy, r0, r1, a0, a1) => {
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${r1} ${r1} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${large} 0 ${x3} ${y3}Z`;
};
const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const gearPath = (cx, cy, ro, ri, teeth) => {
  const pitch = 360 / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    pts.push(
      polar(cx, cy, ri, a - 0.3 * pitch),
      polar(cx, cy, ro, a - 0.17 * pitch),
      polar(cx, cy, ro, a + 0.17 * pitch),
      polar(cx, cy, ri, a + 0.3 * pitch),
    );
  }
  return `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
};
const star4 = (x, y, r, fill) =>
  `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill}"/>`;

/* ------------------------------------------------------------------ statistics-a */

/** Storybook page: a histogram built from stacked blocks, the matching box plot beneath, gears and a lightbulb. */
function makerStory(p) {
  const counts = [1, 3, 5, 8, 6, 3, 2]; // n = 28: min bin 1, Q1 bin 3, median bin 4, Q3 bin 5, max bin 7
  const palette = [p.accent, p.glow, p.accentB];
  const bw = 52;
  const bh = 25;
  const pitch = 62;
  const x0 = 653;
  const base = 360;
  const cxOf = (k) => x0 + (k - 1) * pitch + bw / 2;
  const block = (x, y, c) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6" fill="${c}"/><rect x="${x}" y="${y + bh - 6}" width="${bw}" height="6" rx="3" fill="${darken(c, 0.16)}"/><rect x="${x + 4}" y="${y + 3}" width="${bw - 8}" height="5" rx="2.5" fill="#fff" opacity=".35"/>`;
  const bars = counts
    .map((n, i) => {
      const c = palette[i % 3];
      return Array.from({ length: n }, (_, j) =>
        block(x0 + i * pitch, base - (j + 1) * (bh + 4) + 4, c),
      ).join("");
    })
    .join("");
  const ticks = counts
    .map(
      (_, i) =>
        `<circle cx="${cxOf(i + 1)}" cy="${base + 14}" r="3" fill="${alpha(p.ink, 0.45)}"/>`,
    )
    .join("");
  const guides = counts
    .map(
      (_, i) =>
        `<path d="M${cxOf(i + 1)} ${base + 24} V486" stroke="${alpha(p.ink, 0.16)}" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round"/>`,
    )
    .join("");
  const [q1, med, q3, mn, mx] = [cxOf(3), cxOf(4), cxOf(5), cxOf(1), cxOf(7)];
  const boxY = 410;
  const boxH = 44;
  const gear = (cx, cy, ro, ri, t, c) =>
    `<path d="${gearPath(cx, cy, ro, ri, t)}" fill="${c}" stroke="${darken(c, 0.25)}" stroke-width="3" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${ri * 0.62}" fill="none" stroke="${lighten(c, 0.4)}" stroke-width="4" opacity=".7"/><circle cx="${cx}" cy="${cy}" r="${ri * 0.28}" fill="${p.paper}" stroke="${darken(c, 0.25)}" stroke-width="3"/>`;
  const bulb = (cx, cy) => `
    <circle cx="${cx}" cy="${cy}" r="72" fill="url(#glw)"/>
    <path d="M${cx - 17} ${cy + 24} L${cx - 12} ${cy + 46} L${cx + 12} ${cy + 46} L${cx + 17} ${cy + 24}Z" fill="${lighten(p.glow, 0.55)}" stroke="${alpha(p.ink, 0.35)}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="31" fill="${lighten(p.glow, 0.5)}" stroke="${alpha(p.ink, 0.35)}" stroke-width="3"/>
    <path d="M${cx - 9} ${cy + 24} V${cy + 2} Q${cx - 9} ${cy - 10} ${cx - 3} ${cy - 4} Q${cx} ${cy} ${cx + 3} ${cy - 4} Q${cx + 9} ${cy - 10} ${cx + 9} ${cy + 2} V${cy + 24}" fill="none" stroke="${p.accentB}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M${cx - 18} ${cy - 16} Q${cx - 14} ${cy - 24} ${cx - 6} ${cy - 25}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    <rect x="${cx - 14}" y="${cy + 46}" width="28" height="7" rx="3.5" fill="${p.deep}"/><rect x="${cx - 12}" y="${cy + 54}" width="24" height="7" rx="3.5" fill="${darken(p.deep, 0.15)}"/><rect x="${cx - 7}" y="${cy + 62}" width="14" height="6" rx="3" fill="${darken(p.deep, 0.3)}"/>
    ${[-62, -34, 0, 34, 62]
      .map((a) => {
        const [ax, ay] = polar(cx, cy - 2, 42, a);
        const [bx, by] = polar(cx, cy - 2, 54, a);
        return `<path d="M${ax} ${ay} L${bx} ${by}" stroke="${p.accentB}" stroke-width="4" stroke-linecap="round"/>`;
      })
      .join("")}`;
  const faintGear = (cx, cy, ro, t) =>
    `<path d="${gearPath(cx, cy, ro, ro * 0.84, t)}" fill="none" stroke="${alpha(p.deep, 0.14)}" stroke-width="3" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${ro * 0.45}" fill="none" stroke="${alpha(p.deep, 0.1)}" stroke-width="3"/>`;
  return `
    <defs><radialGradient id="glw"><stop offset="0" stop-color="${p.glow}" stop-opacity=".5"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient></defs>
    ${faintGear(330, 470, 130, 14)}${faintGear(180, 150, 80, 11)}
    <path d="M40 330 Q220 280 400 340 T520 300" fill="none" stroke="${alpha(p.deep, 0.14)}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
    <ellipse cx="870" cy="556" rx="310" ry="15" fill="${alpha(p.ink, 0.16)}"/>
    <g transform="rotate(2.4 870 300)"><rect x="596" y="68" width="560" height="480" rx="24" fill="${mix(p.paper, p.deep, 0.28)}"/></g>
    <g transform="rotate(-1.6 870 300)"><rect x="588" y="64" width="562" height="482" rx="24" fill="${mix(p.paper, p.deep, 0.14)}" stroke="${alpha(p.ink, 0.12)}" stroke-width="2"/></g>
    <rect x="590" y="60" width="560" height="484" rx="24" fill="${p.paper}" stroke="${alpha(p.ink, 0.18)}" stroke-width="3"/>
    <rect x="604" y="74" width="532" height="456" rx="16" fill="none" stroke="${alpha(p.accent, 0.38)}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
    <path d="M618 60 V150 L632 136 L646 150 V60Z" fill="${p.accentB}"/><path d="M618 60 V150 L632 136 L646 150 V60Z" fill="#fff" opacity=".12"/>
    <path d="M${x0 - 14} ${base + 2} H${x0 + 6 * pitch + bw + 14}" stroke="${alpha(p.ink, 0.55)}" stroke-width="5" stroke-linecap="round"/>
    ${bars}${ticks}${guides}
    <path d="M${mn} ${boxY + boxH / 2} H${mx}" stroke="${alpha(p.ink, 0.65)}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${mn} ${boxY + 10} V${boxY + boxH - 10} M${mx} ${boxY + 10} V${boxY + boxH - 10}" stroke="${alpha(p.ink, 0.65)}" stroke-width="5" stroke-linecap="round"/>
    <rect x="${q1}" y="${boxY}" width="${q3 - q1}" height="${boxH}" rx="10" fill="${lighten(p.glow, 0.35)}" stroke="${alpha(p.ink, 0.65)}" stroke-width="4"/>
    <rect x="${q1 + 6}" y="${boxY + 6}" width="${q3 - q1 - 12}" height="7" rx="3.5" fill="#fff" opacity=".5"/>
    <path d="M${med} ${boxY} V${boxY + boxH}" stroke="${p.accentB}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${x0 - 14} 492 H${x0 + 6 * pitch + bw + 14}" stroke="${alpha(p.ink, 0.55)}" stroke-width="4" stroke-linecap="round"/>
    ${counts.map((_, i) => `<path d="M${cxOf(i + 1)} 492 v9" stroke="${alpha(p.ink, 0.55)}" stroke-width="3" stroke-linecap="round"/>`).join("")}
    ${bulb(700, 128)}
    ${gear(1070, 142, 52, 43, 12, p.accent)}${gear(1002, 100, 34, 28, 9, p.accentB)}
    ${star4(930, 112, 12, p.glow)}${star4(960, 150, 7, p.glow)}${star4(780, 92, 8, p.accentB)}`;
}

/* ------------------------------------------------------------------ statistics-b */

/** Neighbourhood seen from above, survey dots clustered by zone, with a bar chart and dot plot inset. */
function neighbourhoodMap(p) {
  const MX = 572;
  const MY = 52;
  const MW = 486;
  const MH = 496;
  const rand = rng(7);
  const xs = [MX, 632, 742, 846, 944, MX + MW];
  const ys = [MY, 112, 212, 322, 436, MY + MH];
  const tones = [
    mix(p.paper, p.deep, 0.2),
    mix(p.paper, p.deep, 0.34),
    mix(p.paper, p.accentB, 0.28),
  ];
  const shadowC = alpha(p.ink, 0.16);
  let blocks = "";
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const x = xs[i] + (i === 0 ? 0 : 8);
      const y = ys[j] + (j === 0 ? 0 : 8);
      const w = xs[i + 1] - (i === 4 ? 0 : 8) - x;
      const h = ys[j + 1] - (j === 4 ? 0 : 8) - y;
      if (i === 1 && j === 1) {
        blocks += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#a9c47c"/><path d="M${x} ${y + h - 20} Q${x + w / 2} ${y + 10} ${x + w} ${y + 24}" stroke="${lighten(p.paper, 0.3)}" stroke-width="7" fill="none"/>${[
          [18, 20, 15],
          [70, 22, 12],
          [30, 66, 14],
          [78, 70, 16],
          [52, 44, 10],
        ]
          .map(
            ([dx, dy, r]) =>
              `<circle cx="${x + dx}" cy="${y + dy}" r="${r}" fill="#6f9a4a"/><circle cx="${x + dx - 3}" cy="${y + dy - 3}" r="${r * 0.55}" fill="#8cb862"/>`,
          )
          .join("")}`;
        continue;
      }
      if (i === 3 && j === 3) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        blocks += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lighten(p.paper, 0.2)}"/><circle cx="${cx}" cy="${cy}" r="40" fill="${lighten(p.glow, 0.5)}" stroke="${p.accentB}" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="22" fill="${lighten(p.glow, 0.1)}"/><circle cx="${cx}" cy="${cy}" r="8" fill="#fff"/>`;
        continue;
      }
      const cols = w > 110 ? 2 : 1;
      const rows = h > 100 ? 2 : 1;
      const bwid = (w - (cols + 1) * 5) / cols;
      const bhei = (h - (rows + 1) * 5) / rows;
      for (let a = 0; a < cols; a++)
        for (let b = 0; b < rows; b++) {
          const bx = x + 5 + a * (bwid + 5);
          const by = y + 5 + b * (bhei + 5);
          const c = tones[Math.floor(rand() * 3)];
          blocks += `<rect x="${bx + 4}" y="${by + 4}" width="${bwid}" height="${bhei}" rx="3" fill="${shadowC}"/><rect x="${bx}" y="${by}" width="${bwid}" height="${bhei}" rx="3" fill="${c}"/><rect x="${bx + 5}" y="${by + 5}" width="${bwid - 10}" height="${bhei - 10}" rx="2" fill="none" stroke="${lighten(c, 0.3)}" stroke-width="2"/>`;
        }
    }
  }
  const streets = [
    ...xs.slice(1, 5).map((x) => `M${x} ${MY} V${MY + MH}`),
    ...ys.slice(1, 5).map((y) => `M${MX} ${y} H${MX + MW}`),
  ].join("");
  const zones = [
    { x: 680, y: 172, n: 14 },
    { x: 892, y: 268, n: 9 },
    { x: 790, y: 482, n: 11 },
    { x: 990, y: 384, n: 6 },
  ];
  const halo = zones
    .map(
      (z) =>
        `<circle cx="${z.x}" cy="${z.y}" r="62" fill="${alpha(p.glow, 0.3)}"/><circle cx="${z.x}" cy="${z.y}" r="62" fill="none" stroke="${alpha(p.accentB, 0.35)}" stroke-width="2" stroke-dasharray="4 7"/>`,
    )
    .join("");
  const dots = zones
    .map((z) =>
      Array.from({ length: z.n }, () => {
        const ang = rand() * Math.PI * 2;
        const rad = 8 + (rand() + rand()) * 24;
        return `<circle cx="${n1(z.x + Math.cos(ang) * rad)}" cy="${n1(z.y + Math.sin(ang) * rad)}" r="6.5" fill="${p.accentB}" stroke="#fff" stroke-width="2.5"/>`;
      }).join(""),
    )
    .join("");
  const pin = (x, y) =>
    `<g transform="translate(${x} ${y})"><path d="M0 0 C-18 -22 -16 -40 0 -40 C16 -40 18 -22 0 0Z" fill="${darken(p.accent, 0.25)}"/><circle cy="-27" r="6" fill="${p.paper}"/></g>`;
  const card = (x, y, w, h) =>
    `<rect x="${x + 5}" y="${y + 7}" width="${w}" height="${h}" rx="16" fill="${alpha("#000", 0.3)}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${p.paper}"/><rect x="${x + 18}" y="${y + 18}" width="86" height="9" rx="4.5" fill="${alpha(p.ink, 0.55)}"/><rect x="${x + 18}" y="${y + 33}" width="52" height="7" rx="3.5" fill="${alpha(p.ink, 0.22)}"/><circle cx="${x + w - 28}" cy="${y + 28}" r="9" fill="${p.glow}"/>`;
  const bx = 930;
  const by = 66;
  const bAxis = by + 176 - 28;
  const barUnit = 6;
  const bars = zones
    .map((z, i) => {
      const h = z.n * barUnit;
      const x = bx + 30 + i * 50;
      return `<rect x="${x}" y="${bAxis - h}" width="36" height="${h}" rx="5" fill="${p.accentB}"/><rect x="${x + 5}" y="${bAxis - h + 4}" width="26" height="5" rx="2.5" fill="#fff" opacity=".35"/>`;
    })
    .join("");
  const grid = [1, 2, 3]
    .map(
      (k) =>
        `<path d="M${bx + 16} ${bAxis - k * 36} H${bx + 216}" stroke="${alpha(p.ink, 0.12)}" stroke-width="2" stroke-dasharray="3 6"/>`,
    )
    .join("");
  const dx = 920;
  const dy = 318;
  const dAxis = dy + 208 - 26;
  const dcounts = [2, 4, 7, 5, 3, 1];
  const dplot = dcounts
    .map(
      (n, i) =>
        Array.from(
          { length: n },
          (_, j) =>
            `<circle cx="${dx + 42 + i * 32}" cy="${dAxis - 14 - j * 17}" r="7.5" fill="${j === 0 && false ? p.glow : p.accentB}" stroke="${lighten(p.accentB, 0.5)}" stroke-width="1.5"/>`,
        ).join("") +
        `<path d="M${dx + 42 + i * 32} ${dAxis + 2} v7" stroke="${alpha(p.ink, 0.5)}" stroke-width="3" stroke-linecap="round"/>`,
    )
    .join("");
  return `
    <path d="M40 120 H500 M40 250 H520 M40 400 H480 M110 40 V560 M250 40 V560 M390 40 V560" stroke="${alpha(p.paper, 0.06)}" stroke-width="2"/>
    <path d="M60 470 Q200 380 330 430 T500 360" fill="none" stroke="${alpha(p.glow, 0.22)}" stroke-width="3" stroke-dasharray="3 10" stroke-linecap="round"/>
    ${[
      [150, 200],
      [190, 215],
      [170, 235],
      [330, 150],
      [350, 170],
      [220, 470],
      [250, 455],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${alpha(p.glow, 0.28)}"/>`)
      .join("")}
    <rect x="${MX + 8}" y="${MY + 12}" width="${MW}" height="${MH}" rx="26" fill="${alpha("#000", 0.35)}"/>
    <clipPath id="mapclip"><rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" rx="26"/></clipPath>
    <g clip-path="url(#mapclip)">
      <rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" fill="${lighten(p.paper, 0.35)}"/>
      <path d="${streets}" stroke="${alpha(p.deep, 0.35)}" stroke-width="2" stroke-dasharray="10 12" fill="none"/>
      ${blocks}
      <path d="M${MX - 20} ${MY + MH - 50} L${MX + MW + 20} ${MY + 80}" stroke="${lighten(p.paper, 0.5)}" stroke-width="24"/>
      <path d="M${MX - 20} ${MY + MH - 50} L${MX + MW + 20} ${MY + 80}" stroke="${alpha(p.deep, 0.55)}" stroke-width="3" stroke-dasharray="14 10" fill="none"/>
      ${halo}${dots}
    </g>
    <rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" rx="26" fill="none" stroke="${lighten(p.paper, 0.2)}" stroke-width="5"/>
    ${pin(742, 332)}${pin(858, 134)}
    ${card(bx, by, 232, 176)}${grid}<path d="M${bx + 16} ${bAxis} H${bx + 216}" stroke="${alpha(p.ink, 0.6)}" stroke-width="4" stroke-linecap="round"/>${bars}
    ${card(dx, dy, 242, 208)}<path d="M${dx + 24} ${dAxis} H${dx + 218}" stroke="${alpha(p.ink, 0.6)}" stroke-width="4" stroke-linecap="round"/>${dplot}`;
}

/* ------------------------------------------------------------------ world-architect */

/** Gold-and-teal engraved globe, four solids standing on its rim, a dotted route arc, compass rose behind. */
function worldArchitect(p) {
  const cx = 900;
  const cy = 372;
  const R = 148;
  const route = 240;
  const gold = p.glow;
  const goldL = lighten(gold, 0.35);
  const goldD = darken(gold, 0.38);
  const cream = mix(p.paper, gold, 0.18);
  const creamD = mix(p.paper, p.deep, 0.55);
  // compass rose
  const kites = Array.from({ length: 8 }, (_, i) => {
    const a = i * 45;
    const long = i % 2 === 0 ? 330 : 215;
    const wd = i % 2 === 0 ? 24 : 16;
    const tip = polar(cx, cy, long, a);
    const l = polar(cx, cy, wd, a - 45);
    const r = polar(cx, cy, wd, a + 45);
    return `<path d="M${cx} ${cy} L${l.join(" ")} L${tip.join(" ")}Z" fill="${alpha(gold, 0.1)}"/><path d="M${cx} ${cy} L${r.join(" ")} L${tip.join(" ")}Z" fill="${alpha(gold, 0.24)}"/><path d="M${l.join(" ")} L${tip.join(" ")} L${r.join(" ")}" fill="none" stroke="${alpha(gold, 0.45)}" stroke-width="1.5"/>`;
  }).join("");
  const rimTicks = Array.from({ length: 72 }, (_, i) => {
    const a = i * 5;
    const len = i % 9 === 0 ? 20 : i % 3 === 0 ? 12 : 7;
    const [x0, y0] = polar(cx, cy, 300, a);
    const [x1, y1] = polar(cx, cy, 300 - len, a);
    return `M${x0} ${y0} L${x1} ${y1}`;
  }).join("");
  // globe interior
  const lat = [-0.62, -0.3, 0, 0.3, 0.62]
    .map((t) => {
      const dy = t * R;
      const rx = Math.sqrt(R * R - dy * dy);
      return `<ellipse cx="${cx}" cy="${cy + dy}" rx="${rx.toFixed(1)}" ry="${(rx * 0.16).toFixed(1)}" fill="none" stroke="${alpha(p.paper, 0.3)}" stroke-width="1.5"/>`;
    })
    .join("");
  const mer = [0.3, 0.62, 0.9]
    .map(
      (t) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${(R * t).toFixed(1)}" ry="${R}" fill="none" stroke="${alpha(p.paper, 0.26)}" stroke-width="1.5"/>`,
    )
    .join("");
  const land = [
    "M-120 -40 C-90 -90 -30 -80 -10 -50 C10 -30 -20 0 -50 10 C-70 40 -110 30 -125 0Z",
    "M30 -90 C70 -100 110 -70 100 -30 C90 0 50 -10 40 -40 C30 -55 20 -75 30 -90Z",
    "M-20 50 C20 30 80 40 90 80 C80 120 20 130 -10 100 C-25 85 -30 65 -20 50Z",
    "M-100 80 C-80 70 -60 85 -70 105 C-85 115 -105 100 -100 80Z",
  ]
    .map(
      (d) =>
        `<path d="${d}" transform="translate(${cx} ${cy})" fill="${alpha(mix(gold, p.accent, 0.4), 0.55)}" stroke="${alpha(goldL, 0.6)}" stroke-width="2"/>`,
    )
    .join("");
  // buildings: local origin on the surface, up = -y
  const solids = {
    pyramid: `<polygon points="-42,0 0,-68 0,10" fill="${goldL}"/><polygon points="0,-68 0,10 42,0" fill="${goldD}"/><path d="M-42 0 L0 -68 L42 0 L0 10Z" fill="none" stroke="${darken(gold, 0.55)}" stroke-width="2" stroke-linejoin="round"/><path d="M0 -68 L0 10" stroke="${darken(gold, 0.55)}" stroke-width="2"/>`,
    tower: `<polygon points="-18,2 -18,-70 6,-70 6,2" fill="${cream}"/><polygon points="6,2 6,-70 20,-76 20,-4" fill="${creamD}"/><polygon points="-18,-70 6,-70 20,-76 -4,-76" fill="${lighten(cream, 0.3)}"/><polygon points="-18,-76 20,-76 0,-104" fill="${goldL}" transform="translate(-1 0)"/><path d="M-1 -104 V-122" stroke="${gold}" stroke-width="3" stroke-linecap="round"/>${[-56, -40, -24, -8].map((y) => `<path d="M-18 ${y} H6" stroke="${alpha(creamD, 0.55)}" stroke-width="2.5"/>`).join("")}<polygon points="-18,2 -18,-70 6,-70 6,2" fill="none" stroke="${darken(gold, 0.55)}" stroke-width="2"/>`,
    dome: `<path d="M-32 -30 L-32 0 A32 8 0 0 0 32 0 L32 -30Z" fill="url(#dg)"/>${[-20, -7, 7, 20].map((x) => `<path d="M${x} -28 V2" stroke="${alpha(goldD, 0.6)}" stroke-width="3"/>`).join("")}<path d="M-34 -30 A34 34 0 0 1 34 -30Z" fill="url(#dg)"/><path d="M-22 -40 A24 24 0 0 1 -2 -57" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/><rect x="-5" y="-72" width="10" height="9" fill="${goldD}"/><circle cy="-76" r="6" fill="${goldL}"/><rect x="-36" y="-32" width="72" height="5" rx="2.5" fill="${goldD}"/>`,
    silo: `<path d="M-22 -62 L-22 0 A22 6 0 0 0 22 0 L22 -62Z" fill="url(#sg)"/><path d="M-22 -22 Q0 -16 22 -22 M-22 -42 Q0 -36 22 -42" fill="none" stroke="${alpha(creamD, 0.7)}" stroke-width="2.5"/><path d="M-25 -62 Q0 -70 25 -62 L0 -92Z" fill="${goldL}"/><path d="M0 -92 L25 -62 Q12 -60 0 -62Z" fill="${goldD}"/>`,
  };
  const spots = [
    { a: -48, k: "pyramid", h: 70, s: 1.15 },
    { a: -16, k: "tower", h: 124, s: 0.86 },
    { a: 17, k: "dome", h: 82, s: 1.1 },
    { a: 50, k: "silo", h: 92, s: 1.08 },
  ];
  const buildings = spots
    .map(({ a, k, s: sc }) => {
      const [x, y] = polar(cx, cy, R - 3, a);
      return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${sc})"><ellipse cy="3" rx="40" ry="7" fill="${alpha("#000", 0.35)}"/>${solids[k]}</g>`;
    })
    .join("");
  const pins = spots
    .map(({ a, h, s: sc }) => {
      const [x0, y0] = polar(cx, cy, R + h * sc + 8, a);
      const [x1, y1] = polar(cx, cy, route - 6, a);
      const [px, py] = polar(cx, cy, route, a);
      return `<path d="M${x0} ${y0} L${x1} ${y1}" stroke="${alpha(gold, 0.7)}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round"/><circle cx="${px}" cy="${py}" r="9" fill="${p.ink}" stroke="${gold}" stroke-width="3"/><circle cx="${px}" cy="${py}" r="3.5" fill="${gold}"/>`;
    })
    .join("");
  const [rs, re] = [polar(cx, cy, route, -62), polar(cx, cy, route, 62)];
  const [px, py] = polar(cx, cy, route, 2);
  const stars = [
    [640, 70],
    [700, 150],
    [1150, 120],
    [1170, 280],
    [660, 440],
    [740, 560],
    [1130, 530],
    [1080, 60],
  ]
    .map(([x, y], i) => star4(x, y, i % 2 ? 6 : 9, alpha(goldL, 0.7)))
    .join("");
  return `
    <defs>
      <radialGradient id="gb" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${lighten(p.accent, 0.3)}"/><stop offset=".6" stop-color="${p.accent}"/><stop offset="1" stop-color="${darken(p.ink, 0.1)}"/></radialGradient>
      <linearGradient id="sg"><stop offset="0" stop-color="${lighten(cream, 0.25)}"/><stop offset=".45" stop-color="${cream}"/><stop offset="1" stop-color="${creamD}"/></linearGradient>
      <linearGradient id="dg"><stop offset="0" stop-color="${goldL}"/><stop offset=".5" stop-color="${gold}"/><stop offset="1" stop-color="${goldD}"/></linearGradient>
      <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 0 V6" stroke="${alpha(p.ink, 0.55)}" stroke-width="1.6"/></pattern>
      <clipPath id="gc"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
    </defs>
    ${stars}
    <circle cx="${cx}" cy="${cy}" r="300" fill="none" stroke="${alpha(gold, 0.5)}" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="282" fill="none" stroke="${alpha(gold, 0.3)}" stroke-width="1.5" stroke-dasharray="2 6"/>
    <path d="${rimTicks}" stroke="${alpha(gold, 0.55)}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="214" fill="none" stroke="${alpha(gold, 0.22)}" stroke-width="1.5"/>
    ${kites}
    <ellipse cx="${cx}" cy="${cy + R + 36}" rx="130" ry="12" fill="${alpha("#000", 0.35)}"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 14}" fill="none" stroke="${gold}" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 22}" fill="none" stroke="${alpha(goldL, 0.4)}" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#gb)"/>
    <g clip-path="url(#gc)">
      ${mer}${lat}${land}
      <path fill-rule="evenodd" d="M${cx - R - 2} ${cy}a${R + 2} ${R + 2} 0 1 0 ${2 * R + 4} 0a${R + 2} ${R + 2} 0 1 0 ${-2 * R - 4} 0ZM${cx - R + 54} ${cy - 40}a${R + 12} ${R + 12} 0 1 0 ${2 * R + 24} 0a${R + 12} ${R + 12} 0 1 0 ${-2 * R - 24} 0Z" fill="url(#hatch)"/>
      <ellipse cx="${cx - 58}" cy="${cy - 70}" rx="46" ry="26" fill="#fff" opacity=".1" transform="rotate(-30 ${cx - 58} ${cy - 70})"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${alpha(goldL, 0.8)}" stroke-width="3"/>
    <path d="M${cx - R - 30} ${cy + 44} L${cx + R + 30} ${cy - 44}" stroke="${alpha(gold, 0)}"/>
    ${buildings}
    <path d="M${rs.join(" ")} A${route} ${route} 0 0 1 ${re.join(" ")}" fill="none" stroke="${gold}" stroke-width="4" stroke-dasharray="0.1 11" stroke-linecap="round"/>
    ${pins}
    <g transform="translate(${px} ${py}) rotate(2)"><path d="M-16 7 L17 0 L-16 -7 L-9 0Z" fill="${p.paper}"/><path d="M-9 0 L17 0 L-16 -7Z" fill="${alpha(p.deep, 0.35)}"/></g>`;
}

/* ------------------------------------------------------------------ statistics-life */

/** 24-hour radial chart on a dark teal ground: wedges proportional to hours, clock-style rim, dot plot beside it. */
function dayClock(p) {
  const cx = 770;
  const cy = 306;
  const Ro = 184;
  const Ri = 106;
  const ink = darken(p.ink, 0.3);
  const segs = [
    { h: 7, c: mix(p.paper, p.accent, 0.42), icon: "moon" },
    { h: 1, c: lighten(p.accentB, 0.32), icon: "plate" },
    { h: 7, c: mix(p.paper, p.deep, 0.18), icon: "book" },
    { h: 3, c: p.glow, icon: "ball" },
    { h: 1, c: lighten(p.accentB, 0.32), icon: "plate" },
    { h: 2, c: mix(p.paper, p.deep, 0.5), icon: "pencil" },
    { h: 1, c: lighten(p.accentB, 0.62), icon: "screen" },
    { h: 2, c: mix(p.paper, p.accent, 0.42), icon: "moon" },
  ];
  const icons = {
    moon: (c) => `<circle r="12" fill="${c}"/><circle cx="6" cy="-4" r="10" fill="BG"/>`,
    plate: (c) =>
      `<circle r="11" fill="none" stroke="${c}" stroke-width="3.5"/><circle r="4.5" fill="${c}"/>`,
    book: (c) =>
      `<path d="M-17 -10 L0 -5 L0 13 L-17 8Z M17 -10 L0 -5 L0 13 L17 8Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`,
    ball: (c) =>
      `<circle r="13" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M-13 0 H13 M0 -13 Q9 0 0 13 M0 -13 Q-9 0 0 13" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    pencil: (c) =>
      `<g transform="rotate(-45)"><rect x="-4.5" y="-15" width="9" height="20" rx="1.5" fill="${c}"/><path d="M-4.5 7 H4.5 L0 15Z" fill="${c}"/></g>`,
    screen: (c) =>
      `<rect x="-12" y="-10" width="24" height="16" rx="3" fill="none" stroke="${c}" stroke-width="3"/><rect x="-7" y="9" width="14" height="3.5" rx="1.75" fill="${c}"/>`,
  };
  let acc = 0;
  let wedges = "";
  let marks = "";
  for (const s of segs) {
    const a0 = acc * 15;
    const a1 = (acc + s.h) * 15;
    acc += s.h;
    const mid = (a0 + a1) / 2;
    const ex = s.icon === "book" ? 9 : 0;
    const [ox, oy] = polar(0, 0, ex, mid);
    wedges += `<path d="${wedge(cx + ox, cy + oy, Ri, Ro, a0, a1)}" fill="${s.c}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`;
    const [mx, my] = polar(cx + ox, cy + oy, (Ri + Ro) / 2 + 2, mid);
    const dark = s.c === p.glow ? ink : ink;
    marks += `<g transform="translate(${mx} ${my}) scale(${s.h < 2 ? 0.75 : 1})">${icons[s.icon](dark).replace("BG", s.c)}</g>`;
    // soft inner highlight along the outer edge
    wedges += `<path d="${wedge(cx + ox, cy + oy, Ro - 9, Ro - 3, a0 + 1, a1 - 1)}" fill="#fff" opacity=".28"/>`;
  }
  if (Math.round(acc) !== 24) throw new Error("dayClock: wedge hours must total 24");
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = i * 7.5;
    const hour = i % 2 === 0;
    const major = i % 12 === 0;
    const mid = i % 6 === 0;
    const len = major ? 24 : mid ? 17 : hour ? 11 : 6;
    const [x0, y0] = polar(cx, cy, Ro + 14, a);
    const [x1, y1] = polar(cx, cy, Ro + 14 + len, a);
    return `<path d="M${x0} ${y0} L${x1} ${y1}" stroke="${alpha(p.paper, major ? 0.9 : mid ? 0.7 : 0.45)}" stroke-width="${major ? 4 : mid ? 3 : 2}" stroke-linecap="round"/>`;
  }).join("");
  const dayNight = `<path d="${wedge(cx, cy, Ro + 5, Ro + 10, 7 * 15, 19 * 15)}" fill="${p.glow}"/><path d="${wedge(cx, cy, Ro + 5, Ro + 10, 19 * 15, 24 * 15)}" fill="${alpha(p.paper, 0.3)}"/><path d="${wedge(cx, cy, Ro + 5, Ro + 10, 0, 7 * 15)}" fill="${alpha(p.paper, 0.3)}"/>`;
  const hourDots = Array.from({ length: 24 }, (_, i) => {
    const [x, y] = polar(cx, cy, Ri - 16, i * 15);
    return `<circle cx="${x}" cy="${y}" r="${i % 6 === 0 ? 3.6 : 2.2}" fill="${alpha(p.paper, i % 6 === 0 ? 0.9 : 0.5)}"/>`;
  }).join("");
  const [hx, hy] = polar(cx, cy, 54, 8 * 15);
  const [mx2, my2] = polar(cx, cy, 72, 0 + 40);
  const hub = `<circle cx="${cx}" cy="${cy}" r="${Ri - 5}" fill="${ink}"/><circle cx="${cx}" cy="${cy}" r="${Ri - 5}" fill="none" stroke="${alpha(p.paper, 0.2)}" stroke-width="2"/>${hourDots}
    <path d="M${cx} ${cy} L${hx} ${hy}" stroke="${p.glow}" stroke-width="7" stroke-linecap="round"/><path d="M${cx} ${cy} L${mx2} ${my2}" stroke="${p.paper}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="8" fill="${p.glow}" stroke="${ink}" stroke-width="3"/>`;
  // dot plot card
  const dx = 1004;
  const dy = 196;
  const dw = 172;
  const dh = 226;
  const counts = [1, 3, 6, 5, 3, 2];
  const axis = dy + dh - 32;
  const dots = counts
    .map((n, i) => {
      const x = dx + 31 + i * 22.5;
      return (
        Array.from(
          { length: n },
          (_, j) =>
            `<circle cx="${x}" cy="${axis - 13 - j * 18}" r="9" fill="${p.paper}" stroke="${mix(p.paper, p.accent, 0.5)}" stroke-width="2"/>`,
        ).join("") +
        `<path d="M${x} ${axis + 2} v8" stroke="${alpha(p.paper, 0.6)}" stroke-width="3" stroke-linecap="round"/>`
      );
    })
    .join("");
  const card = `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="18" fill="${alpha(ink, 0.7)}" stroke="${alpha(p.paper, 0.28)}" stroke-width="2"/>
    <g transform="translate(${dx + 30} ${dy + 32}) scale(.8)">${icons.moon(mix(p.paper, p.accent, 0.42)).replace("BG", alpha(ink, 1))}</g>
    <rect x="${dx + 54}" y="${dy + 24}" width="70" height="8" rx="4" fill="${alpha(p.paper, 0.6)}"/><rect x="${dx + 54}" y="${dy + 38}" width="40" height="6" rx="3" fill="${alpha(p.paper, 0.28)}"/>
    <path d="M${dx + 14} ${axis} H${dx + dw - 14}" stroke="${alpha(p.paper, 0.7)}" stroke-width="4" stroke-linecap="round"/>${dots}`;
  return `
    <circle cx="300" cy="320" r="260" fill="none" stroke="${alpha(p.paper, 0.05)}" stroke-width="2"/>
    <circle cx="300" cy="320" r="190" fill="none" stroke="${alpha(p.paper, 0.06)}" stroke-width="2" stroke-dasharray="3 9"/>
    <circle cx="300" cy="320" r="120" fill="none" stroke="${alpha(p.glow, 0.08)}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${Ro + 56}" fill="${alpha(p.deep, 0.22)}"/>
    <circle cx="${cx + 6}" cy="${cy + 10}" r="${Ro + 4}" fill="${alpha("#000", 0.3)}"/>
    ${ticks}${dayNight}${wedges}${marks}${hub}${card}
    ${star4(1090, 100, 10, alpha(p.glow, 0.8))}${star4(1130, 140, 6, alpha(p.paper, 0.6))}${star4(590, 520, 7, alpha(p.glow, 0.6))}`;
}

/* ------------------------------------------------------------------ synthesis */

/** Overhead block plan: five maths strands as mosaic tiles (coordinates, percent, area, ratio, 3D prism) plus park and street. */
function blockPlan(p) {
  const OX = 590;
  const OY = 55;
  const CW = 96;
  const CH = 98;
  const tile = (c, r, w, h, fill) => {
    const x = OX + c * CW + 3;
    const y = OY + r * CH + 3;
    const ww = w * CW - 6;
    const hh = h * CH - 6;
    return {
      x,
      y,
      w: ww,
      h: hh,
      bg: `<rect x="${x}" y="${y + 5}" width="${ww}" height="${hh}" rx="11" fill="${alpha("#000", 0.38)}"/><rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="11" fill="${fill}"/><rect x="${x + 1.5}" y="${y + 1.5}" width="${ww - 3}" height="${hh - 3}" rx="10" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`,
    };
  };
  // 1. coordinate map
  const t1 = tile(0, 0, 3, 2, mix(p.paper, p.accentB, 0.16));
  const u = 24;
  const ox1 = t1.x + 16;
  const oy1 = t1.y + t1.h - 16;
  const pt = ([a, b]) => `${ox1 + a * u},${oy1 - b * u}`;
  const poly = [
    [1, 1],
    [6, 1],
    [9, 3],
    [6, 5],
    [2, 5],
  ];
  const grid1 =
    Array.from(
      { length: 11 },
      (_, i) =>
        `<path d="M${ox1 + i * u} ${oy1} V${oy1 - 6 * u}" stroke="${alpha(p.accentB, 0.22)}" stroke-width="2"/>`,
    ).join("") +
    Array.from(
      { length: 7 },
      (_, i) =>
        `<path d="M${ox1} ${oy1 - i * u} H${ox1 + 10 * u}" stroke="${alpha(p.accentB, 0.22)}" stroke-width="2"/>`,
    ).join("");
  const coord = `${t1.bg}${grid1}<path d="M${ox1} ${oy1 - 6 * u - 4} V${oy1} H${ox1 + 10 * u + 4}" fill="none" stroke="${p.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="${poly.map(pt).join(" ")}" fill="${alpha(p.accent, 0.34)}" stroke="${p.accent}" stroke-width="4" stroke-linejoin="round"/>
    ${poly
      .map((q) => {
        const [a, b] = pt(q).split(",").map(Number);
        return `<circle cx="${a}" cy="${b}" r="7" fill="${p.accentB}" stroke="#fff" stroke-width="3"/>`;
      })
      .join("")}
    <path d="M${ox1 + 1 * u} ${oy1} V${oy1 - u}" stroke="${p.accentB}" stroke-width="3" stroke-dasharray="3 4"/>`;
  // 2. percent donut
  const t2 = tile(3, 0, 2, 2, mix(p.paper, p.accent, 0.12));
  const dcx = t2.x + t2.w / 2;
  const dcy = t2.y + t2.h / 2;
  const parts = [
    { f: 0.6, c: p.accent },
    { f: 0.25, c: p.glow },
    { f: 0.15, c: p.accentB },
  ];
  let ang = 0;
  const donut = parts
    .map((s) => {
      const a0 = ang;
      ang += s.f * 360;
      return `<path d="${wedge(dcx, dcy, 36, 68, a0, ang - 0.01)}" fill="${s.c}" stroke="${t2.bg ? mix(p.paper, p.accent, 0.12) : ""}" stroke-width="3" stroke-linejoin="round"/>`;
    })
    .join("");
  const donutTicks = Array.from({ length: 20 }, (_, i) => {
    const [a, b] = polar(dcx, dcy, 74, i * 18);
    const [c, d] = polar(dcx, dcy, 80, i * 18);
    return `M${a} ${b} L${c} ${d}`;
  }).join("");
  const pct = `${t2.bg}<path d="${donutTicks}" stroke="${alpha(p.ink, 0.4)}" stroke-width="2.5" stroke-linecap="round"/>${donut}<circle cx="${dcx}" cy="${dcy}" r="22" fill="${p.paper}"/><path d="${wedge(dcx, dcy, 6, 22, 0, 216)}" fill="${alpha(p.accent, 0.25)}"/><circle cx="${dcx}" cy="${dcy}" r="5" fill="${p.ink}"/>`;
  // 3. park
  const t3 = tile(5, 0, 1, 3, "#3f7d4e");
  const trees = [
    [26, 34, 20],
    [60, 54, 16],
    [28, 96, 18],
    [62, 128, 20],
    [30, 172, 17],
    [58, 214, 19],
    [28, 252, 15],
  ];
  const park = `${t3.bg}<path d="M${t3.x + 14} ${t3.y + 280} C${t3.x + 70} ${t3.y + 200} ${t3.x + 10} ${t3.y + 140} ${t3.x + 76} ${t3.y + 10}" fill="none" stroke="${lighten("#3f7d4e", 0.55)}" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 0"/>${trees.map(([dx, dy, r]) => `<circle cx="${t3.x + dx + 3}" cy="${t3.y + dy + 4}" r="${r}" fill="${alpha("#000", 0.22)}"/><circle cx="${t3.x + dx}" cy="${t3.y + dy}" r="${r}" fill="#2f6a40"/><circle cx="${t3.x + dx - r * 0.25}" cy="${t3.y + dy - r * 0.25}" r="${r * 0.6}" fill="#58a064"/>`).join("")}`;
  // 4. 3D prism building
  const t4 = tile(3, 2, 2, 3, mix(p.deep, "#fff", 0.08));
  const bcx = t4.x + t4.w / 2;
  const by = t4.y + t4.h / 2 + 62;
  const hw = 56;
  const tl = 28;
  const H = 108;
  const F = [bcx, by];
  const L = [bcx - hw, by - tl];
  const Rr = [bcx + hw, by - tl];
  const K = [bcx, by - 2 * tl];
  const up = (q) => [q[0], q[1] - H];
  const P = (q) => q.join(",");
  const win = (a, b, rows, cols, c) => {
    let s = "";
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const u0 = (i + 0.2) / cols;
        const u1 = (i + 0.8) / cols;
        const v0 = (j + 0.2) / rows;
        const v1 = (j + 0.75) / rows;
        const pnt = (uu, vv) => [a[0] + (b[0] - a[0]) * uu, a[1] + (b[1] - a[1]) * uu - vv * H];
        s += `<polygon points="${[pnt(u0, v0), pnt(u1, v0), pnt(u1, v1), pnt(u0, v1)].map(P).join(" ")}" fill="${c}"/>`;
      }
    return s;
  };
  const plaza = Array.from(
    { length: 5 },
    (_, i) =>
      `<path d="M${t4.x + 10} ${t4.y + 40 + i * 48} H${t4.x + t4.w - 10}" stroke="${alpha("#fff", 0.07)}" stroke-width="2"/>`,
  ).join("");
  const prism = `${t4.bg}${plaza}
    <polygon points="${[F, Rr, [Rr[0] + 34, Rr[1] + 22], [F[0] + 34, F[1] + 22]].map(P).join(" ")}" fill="${alpha("#000", 0.28)}"/>
    <polygon points="${[F, L, up(L), up(F)].map(P).join(" ")}" fill="${mix(p.paper, p.accentB, 0.35)}"/>
    <polygon points="${[F, Rr, up(Rr), up(F)].map(P).join(" ")}" fill="${mix(p.accentB, "#000", 0.2)}"/>
    ${win(F, L, 5, 3, alpha("#fff", 0.55))}${win(F, Rr, 5, 3, alpha(p.glow, 0.8))}
    <polygon points="${[up(L), up(F), up(Rr), up(K)].map(P).join(" ")}" fill="${mix(p.paper, p.deep, 0.1)}" stroke="${alpha(p.ink, 0.4)}" stroke-width="2" stroke-linejoin="round"/>
    <polygon points="${[
      [bcx, by - H - 12],
      [bcx + 24, by - H - 24],
      [bcx, by - H - 36],
      [bcx - 24, by - H - 24],
    ]
      .map(P)
      .join(" ")}" fill="${p.accent}"/>`;
  // 5. ratio tape diagrams
  const t5 = tile(0, 2, 3, 1, mix(p.paper, p.glow, 0.5));
  const tape = (y, unit, a, b) =>
    `${Array.from({ length: a }, (_, i) => `<rect x="${t5.x + 16 + i * unit}" y="${y}" width="${unit}" height="24" fill="${p.accent}" stroke="${p.paper}" stroke-width="3"/>`).join("")}${Array.from({ length: b }, (_, i) => `<rect x="${t5.x + 16 + (a + i) * unit}" y="${y}" width="${unit}" height="24" fill="${p.accentB}" stroke="${p.paper}" stroke-width="3"/>`).join("")}`;
  const ratio = `${t5.bg}${tape(t5.y + 14, 50, 3, 2)}${tape(t5.y + 54, 25, 6, 4)}<rect x="${t5.x + 16}" y="${t5.y + 14}" width="250" height="5" rx="2.5" fill="#fff" opacity=".4"/>`;
  // 6. area grid (L-shaped composite)
  const t6 = tile(0, 3, 3, 2, mix(p.paper, "#fff", 0.1));
  const au = 22;
  const ax = t6.x + 22;
  const ay = t6.y + 18;
  const cells = [];
  for (let c = 0; c < 11; c++)
    for (let r = 0; r < 7; r++) {
      const inA = c < 6;
      const inB = c >= 6 && r >= 3;
      if (!inA && !inB) continue;
      cells.push(
        `<rect x="${ax + c * au}" y="${ay + r * au}" width="${au}" height="${au}" fill="${inA ? alpha(p.accentB, 0.3) : alpha(p.glow, 0.7)}" stroke="${alpha(p.ink, 0.35)}" stroke-width="1.5"/>`,
      );
    }
  const area = `${t6.bg}${cells.join("")}
    <path d="M${ax + 6 * au} ${ay} V${ay + 7 * au}" stroke="${p.ink}" stroke-width="3" stroke-dasharray="6 5"/>
    <path d="M${ax - 10} ${ay} v${7 * au} M${ax - 15} ${ay} h10 M${ax - 15} ${ay + 7 * au} h10" fill="none" stroke="${alpha(p.ink, 0.7)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M${ax} ${ay + 7 * au + 9} h${11 * au} M${ax} ${ay + 7 * au + 4} v10 M${ax + 11 * au} ${ay + 7 * au + 4} v10" fill="none" stroke="${alpha(p.ink, 0.7)}" stroke-width="3" stroke-linecap="round"/>`;
  // 7. street filler
  const t7 = tile(5, 3, 1, 2, mix(p.ink, p.deep, 0.35));
  const sx = t7.x + t7.w / 2;
  const street = `${t7.bg}<path d="M${sx} ${t7.y + 8} V${t7.y + t7.h - 8}" stroke="${p.glow}" stroke-width="4" stroke-dasharray="14 10"/>${Array.from({ length: 5 }, (_, i) => `<rect x="${t7.x + 10 + i * 14}" y="${t7.y + 74}" width="9" height="34" rx="2" fill="${alpha(p.paper, 0.8)}"/>`).join("")}
    <rect x="${sx - 28}" y="${t7.y + 130}" width="22" height="40" rx="7" fill="${p.accent}"/><rect x="${sx - 25}" y="${t7.y + 138}" width="16" height="12" rx="3" fill="${alpha(p.paper, 0.7)}"/>`;
  return `
    <path d="${[100, 200, 300, 400, 500].map((y) => `M0 ${y} H540`).join("")}${[60, 160, 260, 360, 460].map((x) => `M${x} 0 V600`).join("")}" stroke="${alpha(p.paper, 0.045)}" stroke-width="2"/>
    <circle cx="260" cy="330" r="150" fill="none" stroke="${alpha(p.glow, 0.07)}" stroke-width="2" stroke-dasharray="3 9"/>
    <rect x="${OX - 12}" y="${OY - 12}" width="${6 * CW + 24}" height="${5 * CH + 24}" rx="26" fill="${alpha("#000", 0.25)}" stroke="${alpha(p.paper, 0.22)}" stroke-width="2" stroke-dasharray="6 8"/>
    ${coord}${pct}${park}${prism}${ratio}${area}${street}`;
}

export const SCENES_D = {
  "statistics-a": makerStory,
  "statistics-b": neighbourhoodMap,
  "world-architect": worldArchitect,
  "statistics-life": dayClock,
  synthesis: blockPlan,
};

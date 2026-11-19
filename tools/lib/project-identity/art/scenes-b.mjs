import { alpha, darken, lighten, mix } from "../color.mjs";

/* Group B: unit-4-a, unit-4-b, unit-5-a, unit-5-b, unit-6-a, unit-6-b, unit-7-a, unit-7-b */

const f = (n) => +n.toFixed(1);
const rad = (d) => (d * Math.PI) / 180;

/** Pie slice from 12 o'clock, clockwise; frac is a fraction of one full turn. */
function pieSlice(cx, cy, r, frac, fill) {
  if (frac >= 1) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  const a = frac * 2 * Math.PI;
  const x = f(cx + r * Math.sin(a));
  const y = f(cy - r * Math.cos(a));
  return `<path d="M${cx} ${cy}L${cx} ${f(cy - r)}A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y}Z" fill="${fill}"/>`;
}

/** Percent chip: a pie cut into four equal parts, frac of it filled, optional donut hole. */
function chip(cx, cy, r, frac, base, slice, hole, line = "#000") {
  const quarters = `<path d="M${cx} ${cy - r}V${cy + r}M${cx - r} ${cy}H${cx + r}" stroke="${line}" stroke-opacity=".28" stroke-width="1.6"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${base}"/>${pieSlice(cx, cy, r, frac, slice)}${quarters}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${line}" stroke-opacity=".35" stroke-width="2"/>${hole ? `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.4)}" fill="${hole}"/>` : ""}`;
}

/** Hang tag outline centred on x = 0; hole sits at (0, top + 12). */
function tagPath(w = 28, top = -34, bottom = 44) {
  return `M${-w} ${top + 20}L${-w / 2} ${top}L${w / 2} ${top}L${w} ${top + 20}L${w} ${bottom - 6}Q${w} ${bottom} ${w - 6} ${bottom}L${-w + 6} ${bottom}Q${-w} ${bottom} ${-w} ${bottom - 6}Z`;
}

/** Star burst polygon points. */
function burstPts(cx, cy, R, r, n, rot = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rad(rot + (i * 180) / n);
    const rr = i % 2 ? r : R;
    pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
  }
  return pts.join(" ");
}

/** Catmull-Rom spline through points: returns the path and a list of sampled points. */
function spline(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  const samples = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${p2[0]} ${p2[1]}`;
    for (let k = 0; k < 20; k++) {
      const t = k / 20;
      const mt = 1 - t;
      samples.push([
        mt ** 3 * p1[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * p2[0],
        mt ** 3 * p1[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * p2[1],
      ]);
    }
  }
  samples.push(pts[pts.length - 1]);
  return { d, samples };
}

/* ------------------------------------------------------------------ unit-4-a */

/** Night market stall: striped awning, string bulbs, crates of fruit, tags with 25/50/75 percent donuts. */
function popUpShop(p) {
  const wood = "#b98a55";
  const orange = "#f08a24";
  const apple = "#d6403a";
  const leaf = "#7fb24a";
  const lemon = "#f5d04a";
  const kraft = "#c9a06a";
  const sA = p.glow;
  const sB = p.paper;
  const awning = Array.from({ length: 12 }, (_, i) => {
    const c = i % 2 ? sB : sA;
    const tl = 600 + 45 * i;
    const bl = 570 + 50 * i;
    return `<polygon points="${tl},120 ${tl + 45},120 ${bl + 50},235 ${bl},235" fill="${c}"/><ellipse cx="${bl + 25}" cy="235" rx="25" ry="19" fill="${c}"/>`;
  }).join("");
  const awningShade = Array.from(
    { length: 12 },
    (_, i) => `<ellipse cx="${595 + 50 * i}" cy="238" rx="25" ry="17" fill="url(#shadeS)"/>`,
  ).join("");

  const bulbs = Array.from({ length: 11 }, (_, i) => {
    const t = (i + 0.5) / 11;
    const mt = 1 - t;
    const x = f(mt * mt * 619 + 2 * mt * t * 880 + t * t * 1121);
    const y = f(mt * mt * 62 + 2 * mt * t * 112 + t * t * 62);
    const c = i % 3 === 0 ? lighten(p.glow, 0.55) : i % 3 === 1 ? "#ffe9a8" : lighten(p.glow, 0.25);
    return `<circle cx="${x}" cy="${f(y + 9)}" r="24" fill="${alpha(c, 0.1)}"/><rect x="${f(x - 3)}" y="${f(y - 3)}" width="6" height="8" rx="1.5" fill="${darken(p.ink, 0.1)}"/><ellipse cx="${x}" cy="${f(y + 9)}" rx="6.5" ry="8" fill="${c}"/><ellipse cx="${f(x - 2)}" cy="${f(y + 6)}" rx="1.8" ry="2.6" fill="#fff" opacity=".8"/>`;
  }).join("");

  const crate = (x, y, w, h) => {
    const s = (h - 6) / 3;
    const slats = [0, 1, 2]
      .map(
        (i) =>
          `<rect x="${x}" y="${f(y + 3 + i * s)}" width="${w}" height="${f(s - 2)}" rx="2" fill="${i === 1 ? darken(wood, 0.1) : wood}"/>`,
      )
      .join("");
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${darken(wood, 0.45)}"/>${slats}<rect x="${x}" y="${y}" width="9" height="${h}" rx="2" fill="${darken(wood, 0.28)}"/><rect x="${x + w - 9}" y="${y}" width="9" height="${h}" rx="2" fill="${darken(wood, 0.28)}"/>`;
  };
  const fruit = (cx, cy, r, c, hl = true) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/><path d="M${cx - r + 2} ${cy + 3}A${r} ${r} 0 0 0 ${cx + r - 2} ${cy + 3}A${r} ${r} 0 0 1 ${cx - r + 2} ${cy + 3}Z" fill="#000" opacity=".16"/>${hl ? `<circle cx="${f(cx - r * 0.35)}" cy="${f(cy - r * 0.35)}" r="${f(r * 0.28)}" fill="#fff" opacity=".45"/>` : ""}`;
  const pile = (cx, base, r, cols, colors) => {
    const row1 = [-1.5, -0.5, 0.5, 1.5]
      .map((k, i) => fruit(f(cx + k * r * 2), base - r, r, colors[i % colors.length]))
      .join("");
    const row2 = [-1, 0, 1]
      .map((k, i) =>
        fruit(f(cx + k * r * 2), base - r * 2.7, r, colors[(i + cols) % colors.length]),
      )
      .join("");
    return row1 + row2;
  };

  const tags = [
    { x: 742, frac: 0.25, rot: -5 },
    { x: 880, frac: 0.5, rot: 3 },
    { x: 1020, frac: 0.75, rot: -3 },
  ]
    .map(
      ({ x, frac, rot }) => `<g transform="translate(${x} 296) rotate(${rot} 0 -28) scale(1.12)">
      <path d="M0 -30L0 -22" stroke="${alpha(p.paper, 0.6)}" stroke-width="2"/>
      <path d="${tagPath()}" transform="translate(3 4)" fill="#000" opacity=".28"/>
      <path d="${tagPath()}" fill="${p.paper}"/>
      <circle cx="0" cy="-22" r="4.5" fill="${p.deep}"/>
      ${chip(0, 14, 19, frac, p.tint, p.accent, p.paper, p.ink)}
      <rect x="-17" y="38" width="34" height="3" rx="1.5" fill="${alpha(p.ink, 0.25)}"/></g>`,
    )
    .join("");

  const scale = [0.25, 0.5, 0.75, 1]
    .map((fr, i) =>
      chip(716 + i * 120, 485, 15, fr, alpha(p.paper, 0.18), alpha(p.paper, 0.78), "", p.paper),
    )
    .join("");

  const faint = [
    [110, 130, 60],
    [250, 420, 90],
    [400, 220, 40],
    [160, 520, 34],
    [470, 90, 28],
    [60, 330, 44],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${alpha(p.glow, 0.07)}"/>`)
    .join("");

  return `
    <defs>
      <linearGradient id="shadeS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
      <linearGradient id="awnG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></linearGradient>
      <radialGradient id="warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p.glow}" stop-opacity=".34"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
      <linearGradient id="under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    </defs>
    ${faint}
    <ellipse cx="880" cy="300" rx="420" ry="300" fill="url(#warm)"/>
    <rect y="515" width="1200" height="85" fill="${alpha("#000", 0.38)}"/>
    <rect y="515" width="1200" height="3" fill="${alpha(p.glow, 0.28)}"/>
    <rect x="628" y="232" width="488" height="200" rx="4" fill="${mix(p.ink, "#000", 0.35)}"/>
    <rect x="628" y="232" width="488" height="90" fill="url(#under)"/>
    <rect x="612" y="60" width="14" height="456" rx="4" fill="${darken(p.accentB, 0.1)}"/><rect x="617" y="60" width="4" height="456" fill="#fff" opacity=".16"/>
    <rect x="1114" y="60" width="14" height="456" rx="4" fill="${darken(p.accentB, 0.1)}"/><rect x="1119" y="60" width="4" height="456" fill="#fff" opacity=".16"/>
    <rect x="590" y="102" width="560" height="22" rx="8" fill="${p.accent}"/>
    <rect x="590" y="102" width="560" height="6" rx="3" fill="#fff" opacity=".22"/>
    ${awning}<polygon points="600,120 1140,120 1170,235 570,235" fill="url(#awnG)"/>${awningShade}
    <path d="M619 62Q880 162 1121 62" fill="none" stroke="${alpha(p.paper, 0.4)}" stroke-width="2.4"/>
    ${bulbs}
    <rect x="636" y="250" width="468" height="5" rx="2.5" fill="${alpha(p.paper, 0.45)}"/>
    ${tags}
    ${crate(646, 380, 128, 50)}${pile(710, 388, 14, 0, [orange, "#f59a3a", orange, "#e8791a"])}
    ${crate(790, 380, 128, 50)}${pile(854, 388, 14, 0, [apple, leaf, apple, apple])}
    <rect x="938" y="394" width="84" height="36" rx="3" fill="${kraft}"/><rect x="938" y="394" width="84" height="8" fill="${lighten(kraft, 0.25)}"/><rect x="974" y="394" width="14" height="36" fill="${lighten(kraft, 0.38)}" opacity=".7"/>
    <g transform="rotate(-3 980 377)"><rect x="945" y="360" width="70" height="34" rx="3" fill="${darken(kraft, 0.1)}"/><rect x="945" y="360" width="70" height="8" fill="${kraft}"/><rect x="973" y="360" width="14" height="34" fill="${lighten(kraft, 0.3)}" opacity=".7"/></g>
    <g transform="rotate(4 980 346)"><rect x="952" y="330" width="56" height="30" rx="3" fill="${lighten(kraft, 0.12)}"/><rect x="952" y="330" width="56" height="7" fill="${lighten(kraft, 0.3)}"/>${chip(980, 348, 8, 0.25, p.paper, p.accentB, "", p.ink)}</g>
    ${crate(1036, 380, 90, 50)}${[-1, 0, 1].map((k) => fruit(1081 + k * 28, 366, 14, lemon)).join("")}${[-0.5, 0.5].map((k) => fruit(1081 + k * 28, 340, 14, "#f7dc6b")).join("")}
    <rect x="596" y="430" width="572" height="22" rx="4" fill="${lighten(wood, 0.2)}"/><rect x="596" y="430" width="572" height="5" fill="#fff" opacity=".28"/>
    <rect x="604" y="452" width="556" height="63" fill="${darken(p.accent, 0.12)}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<rect x="${604 + i * 46.3}" y="452" width="2" height="63" fill="#000" opacity=".22"/>`).join("")}
    <rect x="604" y="452" width="556" height="6" fill="#000" opacity=".25"/>
    ${scale}
    <ellipse cx="880" cy="518" rx="300" ry="7" fill="#000" opacity=".3"/>`;
}

/* ------------------------------------------------------------------ unit-4-b */

/** Comic-pop sale: halftone, starburst, shopping cart loaded with boxes, tags with discount pies. */
function smartShopper(p) {
  const ink = p.ink;
  const hard = (shape, dx = 8, dy = 9) =>
    `<g transform="translate(${dx} ${dy})" fill="${ink}" stroke="${ink}" stroke-width="7" stroke-linejoin="round">${shape}</g>`;
  const dots = [];
  for (let gy = -1; gy < 26; gy++) {
    for (let gx = 0; gx < 26; gx++) {
      const x = 520 + gx * 26 + (gy % 2) * 13;
      const y = gy * 24 + 6;
      const d = Math.hypot(1230 - x, 640 - y) / 760;
      const r = 9 * (1 - d) ** 1.3 - 1.2;
      if (r > 1.1 && x > 540) dots.push(`<circle cx="${x}" cy="${y}" r="${f(r)}"/>`);
    }
  }
  const dots2 = [];
  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      const x = 560 + gx * 22 + (gy % 2) * 11;
      const y = 20 + gy * 20;
      const r = 6.5 * (1 - Math.hypot(x - 560, y - 20) / 190) - 0.5;
      if (r > 1) dots2.push(`<circle cx="${x}" cy="${y}" r="${f(r)}"/>`);
    }
  }
  const outer = burstPts(880, 290, 262, 196, 22, 4);
  const inner = burstPts(880, 290, 226, 172, 22, 4);

  const box = (x, y, w, h, rot, c) =>
    `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c}" stroke="${ink}" stroke-width="5"/><rect x="${x + 7}" y="${y + 7}" width="${w - 14}" height="8" rx="3" fill="#fff" opacity=".4"/><rect x="${x + w * 0.42}" y="${y}" width="${w * 0.16}" height="${h}" fill="#fff" opacity=".28"/></g>`;
  const tag = (
    x,
    y,
    rot,
    frac,
    slice,
    scale = 1,
  ) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">
    <path d="${tagPath(30, -38, 50)}" transform="translate(6 7)" fill="${ink}"/>
    <path d="${tagPath(30, -38, 50)}" fill="${p.paper}" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="0" cy="-25" r="5" fill="${p.tint}" stroke="${ink}" stroke-width="3"/>
    ${chip(0, 14, 21, frac, p.tint, slice, p.paper, ink)}
    <rect x="-18" y="40" width="36" height="4" rx="2" fill="${ink}" opacity=".35"/></g>`;

  const wires =
    [0, 1, 2, 3, 4, 5]
      .map((i) => `<path d="M${f(752 + i * 41)} 252L${f(796 + i * 31)} 360" />`)
      .join("") +
    [0, 1, 2]
      .map((i) => `<path d="M${f(760 + i * 12)} ${284 + i * 36}H${f(986 - i * 12)}" />`)
      .join("");
  const sparkle = (x, y, s, c) =>
    `<path d="M${x} ${y - s}Q${x + s * 0.15} ${y - s * 0.15} ${x + s} ${y}Q${x + s * 0.15} ${y + s * 0.15} ${x} ${y + s}Q${x - s * 0.15} ${y + s * 0.15} ${x - s} ${y}Q${x - s * 0.15} ${y - s * 0.15} ${x} ${y - s}Z" fill="${c}"/>`;

  return `
    <g fill="${alpha(p.accent, 0.42)}">${dots.join("")}</g>
    <g fill="${alpha(p.accentB, 0.28)}">${dots2.join("")}</g>
    ${hard(`<polygon points="${outer}"/>`, 10, 12)}
    <polygon points="${outer}" fill="${p.glow}" stroke="${ink}" stroke-width="7" stroke-linejoin="round"/>
    <polygon points="${inner}" fill="${lighten(p.glow, 0.5)}"/>
    <polygon points="${inner}" fill="none" stroke="${alpha(p.deep, 0.5)}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
    <g stroke="${ink}" stroke-width="6" stroke-linecap="round" opacity=".55"><path d="M640 330H714M624 366H700M650 402H718M668 296H724"/></g>
    <g transform="translate(-129.8 -49.5) scale(1.15)"><g transform="translate(-4 4)">
      ${box(808, 168, 62, 74, -10, p.accent)}
      ${box(866, 150, 54, 92, 8, p.accentB)}
      <g transform="rotate(-6 924 214)"><path d="M898 244L904 192Q924 180 944 192L952 244Z" fill="${lighten(p.glow, 0.15)}" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/><path d="M906 196Q924 186 942 196" fill="none" stroke="${ink}" stroke-width="4"/>${chip(926, 218, 12, 0.5, p.paper, p.accent, "", ink)}</g>
    </g>
    ${hard(`<path d="M742 246L988 246L954 362L794 362Z"/><circle cx="822" cy="438" r="22"/><circle cx="936" cy="438" r="22"/>`, 8, 9)}
    <path d="M742 246L988 246L954 362L794 362Z" fill="${alpha(p.paper, 0.78)}"/>
    <path d="M742 246L988 246L954 362L794 362Z" fill="none" stroke="${ink}" stroke-width="7" stroke-linejoin="round"/>
    <g stroke="${ink}" stroke-width="4" stroke-linecap="round" opacity=".5" clip-path="url(#basket)">${wires}</g>
    <clipPath id="basket"><path d="M742 246L988 246L954 362L794 362Z"/></clipPath>
    <path d="M746 246L712 196L664 196" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M746 246L712 196L664 196" fill="none" stroke="${p.accentB}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M796 362L806 412L950 412L956 362" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M796 362L806 412L950 412L956 362" fill="none" stroke="${p.accentB}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M742 246H988" stroke="${p.accentB}" stroke-width="6" stroke-linecap="round" opacity=".9"/>
    <circle cx="822" cy="438" r="22" fill="${p.deep}" stroke="${ink}" stroke-width="5"/><circle cx="822" cy="438" r="8" fill="${p.paper}"/>
    <circle cx="936" cy="438" r="22" fill="${p.deep}" stroke="${ink}" stroke-width="5"/><circle cx="936" cy="438" r="8" fill="${p.paper}"/>
    ${tag(828, 330, -8, 0.25, p.accent)}</g>
    ${tag(1062, 152, 12, 0.5, p.accentB, 1.25)}
    ${tag(1050, 428, -10, 0.75, p.accent, 1.1)}
    ${sparkle(660, 120, 22, p.paper)}${sparkle(1120, 296, 18, p.paper)}${sparkle(700, 486, 16, p.accentB)}${sparkle(588, 250, 12, p.accent)}`;
}

/* ------------------------------------------------------------------ unit-5-a */

/** Warm architectural floor plan with a 6 by 4 rug counted in unit squares. */
function dreamRoom(p) {
  const wall = darken(p.accentB, 0.4);
  const line = p.accentB;
  const floor = lighten(p.paper, 0.4);
  const fill = alpha(p.glow, 0.28);
  const stroke = (w = 3) =>
    `fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round"`;
  const wr = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;

  const bx = 890;
  const by = 96;
  const cell = 28;
  const grid = [];
  for (let i = 0; i <= 9; i++) grid.push(`<path d="M${bx + i * cell} ${by}V${by + 7 * cell}"/>`);
  for (let j = 0; j <= 7; j++) grid.push(`<path d="M${bx} ${by + j * cell}H${bx + 9 * cell}"/>`);
  const rugX = bx;
  const rugY = by + cell;
  const rugCells = [];
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 4; j++)
      rugCells.push(
        `<circle cx="${rugX + i * cell + cell / 2}" cy="${rugY + j * cell + cell / 2}" r="3.2"/>`,
      );
  const rugGrid = [];
  for (let i = 0; i <= 6; i++)
    rugGrid.push(`<path d="M${rugX + i * cell} ${rugY}V${rugY + 4 * cell}"/>`);
  for (let j = 0; j <= 4; j++)
    rugGrid.push(`<path d="M${rugX} ${rugY + j * cell}H${rugX + 6 * cell}"/>`);

  const faintGrid = [];
  for (let x = 586; x < 880; x += 28) faintGrid.push(`<path d="M${x} 96V494"/>`);
  for (let y = 96; y < 494; y += 28) faintGrid.push(`<path d="M586 ${y}H874"/>`);

  const ruler = Array.from(
    { length: 57 },
    (_, i) => `<path d="M${594 + i * 10} 536v${i % 5 === 0 ? 16 : 9}"/>`,
  ).join("");
  const burners = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ]
    .map(([i, j]) =>
      `<circle cx="${1010 + i * 26}" cy="${470 + j * 0}" r="7"/>`.replace(
        `cy="${470}"`,
        `cy="${462 + j * 18}"`,
      ),
    )
    .join("");
  const chairs = [
    [750, 396],
    [780, 396],
    [810, 396],
    [750, 458],
    [780, 458],
    [810, 458],
  ]
    .map(
      ([x, y]) => `<rect x="${x - 11}" y="${y - 9}" width="22" height="18" rx="5" ${stroke(2.5)}/>`,
    )
    .join("");
  const faintLeft = [
    [80, 480, 200],
    [260, 120, 120],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${alpha(p.deep, 0.1)}" stroke-width="2" stroke-dasharray="4 12"/>`,
    )
    .join("");

  return `
    <g stroke="${alpha(p.deep, 0.1)}" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 48} 0V600"/>`).join("")}${Array.from({ length: 13 }, (_, j) => `<path d="M0 ${j * 48}H1200"/>`).join("")}</g>
    ${faintLeft}
    <rect x="590" y="94" width="572" height="424" rx="4" fill="${alpha(p.deep, 0.14)}"/>
    <rect x="574" y="84" width="582" height="422" fill="${floor}"/>
    <g stroke="${alpha(p.accentB, 0.14)}" stroke-width="1">${faintGrid.join("")}</g>
    <g stroke="${alpha(p.accentB, 0.34)}" stroke-width="1.2">${grid.join("")}</g>
    <rect x="${rugX}" y="${rugY}" width="${6 * cell}" height="${4 * cell}" fill="${alpha(p.glow, 0.5)}"/>
    <g stroke="${alpha(p.accentB, 0.7)}" stroke-width="1.8">${rugGrid.join("")}</g>
    <g fill="${p.accentB}">${rugCells.join("")}</g>
    <rect x="${rugX}" y="${rugY}" width="${6 * cell}" height="${4 * cell}" fill="none" stroke="${p.accentB}" stroke-width="3.5"/>
    <g stroke="${p.accentB}" stroke-width="2.4" stroke-linecap="round" fill="none">
      <path d="M${rugX} ${rugY + 4 * cell + 14}H${rugX + 6 * cell}M${rugX} ${rugY + 4 * cell + 8}V${rugY + 4 * cell + 20}M${rugX + 6 * cell} ${rugY + 4 * cell + 8}V${rugY + 4 * cell + 20}"/>
      <path d="M${rugX + 6 * cell + 14} ${rugY}V${rugY + 4 * cell}M${rugX + 6 * cell + 8} ${rugY}H${rugX + 6 * cell + 20}M${rugX + 6 * cell + 8} ${rugY + 4 * cell}H${rugX + 6 * cell + 20}"/>
    </g>
    <g ${stroke()}>
      <rect x="1062" y="${by + 4}" width="${3 * cell}" height="${4 * cell - 8}" rx="6"/>
      <rect x="1068" y="${by + 10}" width="${3 * cell - 12}" height="34" rx="8"/>
      <rect x="1048" y="${by + 6}" width="12" height="12" rx="2"/>
      <rect x="896" y="${by + 6}" width="${3 * cell}" height="16" rx="3"/>
      <rect x="896" y="${by + 188}" width="${5 * cell}" height="0" />
    </g>
    <g ${stroke()}>
      <rect x="600" y="150" width="46" height="150" rx="10"/><rect x="600" y="150" width="14" height="150" rx="6"/>
      <rect x="676" y="160" width="160" height="130" rx="8" fill="${alpha(p.deep, 0.14)}" stroke="${line}" stroke-width="2" stroke-dasharray="7 6"/>
      <rect x="704" y="202" width="86" height="46" rx="6"/>
      <rect x="738" y="378" width="86" height="64" rx="6"/>${chairs}
      <circle cx="846" cy="124" r="17" fill="${alpha(p.accent, 0.4)}"/><circle cx="846" cy="124" r="8" fill="${alpha(p.accent, 0.6)}"/>
      <rect x="600" y="388" width="50" height="50" rx="4"/>
    </g>
    <g ${stroke()}>
      <rect x="892" y="454" width="248" height="38" rx="3"/><path d="M964 454V492M1036 454V492" fill="none"/>
      <rect x="1096" y="312" width="42" height="42" rx="3"/>
      <rect x="946" y="378" width="120" height="46" rx="6"/>
      <circle cx="928" cy="474" r="12" fill="${alpha(p.accent, 0.3)}"/>
    </g>
    <g fill="none" stroke="${line}" stroke-width="2.5">${burners}</g>
    <g fill="${wall}">
      <path fill-rule="evenodd" d="M574 84H1156V506H574ZM586 96V494H1144V96Z"/>
      ${wr(874, 90, 12, 154)}${wr(874, 292, 12, 14)}${wr(886, 294, 114, 12)}${wr(1060, 294, 90, 12)}
      <path d="M574 494H650V506H574Z"/>
    </g>
    <rect x="650" y="494" width="48" height="12" fill="${floor}"/>
    <g fill="${floor}" stroke="${wall}" stroke-width="2"><rect x="700" y="84" width="100" height="12"/><rect x="1000" y="84" width="100" height="12"/><rect x="574" y="340" width="12" height="80"/><path d="M700 90H800M1000 90H1100M574 380H586" stroke-width="1.2" fill="none"/></g>
    <g fill="none" stroke="${line}" stroke-width="2.2">
      <path d="M650 494V452M698 494A48 48 0 0 0 650 452" stroke-dasharray="1 0"/>
      <path d="M880 244H928M928 244A48 48 0 0 1 880 292"/>
    </g>
    <g stroke="${wall}" stroke-width="5" stroke-linecap="round"><path d="M650 497V452M880 244H928"/></g>
    <rect x="590" y="530" width="570" height="32" rx="3" fill="${lighten(p.glow, 0.55)}" stroke="${line}" stroke-width="2.5"/>
    <g stroke="${line}" stroke-width="1.8">${ruler}</g>`;
}

/* ------------------------------------------------------------------ unit-5-b */

/** Cutaway room elevation: half-painted wall, roller, paint can, swatch fan, tile floor and plain price tags. */
function roomMakeover(p) {
  const tan = mix(p.tint, "#ffffff", 0.2);
  const painted = p.accentB;
  const tagFill = p.paper;
  const swatch = [
    darken(p.accentB, 0.15),
    p.accentB,
    lighten(p.accentB, 0.25),
    p.glow,
    lighten(p.glow, 0.5),
    lighten(p.accent, 0.5),
    p.accent,
  ];
  const fan = swatch
    .map((c, i) => {
      const a = -146 + i * 13;
      return `<g transform="translate(1080 484) rotate(${a})"><rect x="0" y="-23" width="198" height="46" rx="9" fill="${darken(c, 0.2)}"/><rect x="0" y="-23" width="198" height="40" rx="9" fill="${c}"/><rect x="132" y="-17" width="58" height="28" rx="5" fill="#fff" opacity=".2"/><circle cx="26" cy="-3" r="5" fill="${alpha("#000", 0.3)}"/></g>`;
    })
    .join("");
  const rows = [0, 0.26, 0.6, 1];
  const edge = (v, i, n) => {
    const l = 610 - 40 * v;
    const r = 1160 + 40 * v;
    return [f(l + ((r - l) * i) / n), f(400 + 100 * v)];
  };
  const tiles = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      const a = edge(rows[r], c, 8);
      const b = edge(rows[r], c + 1, 8);
      const d = edge(rows[r + 1], c + 1, 8);
      const e = edge(rows[r + 1], c, 8);
      const col = (r + c) % 2 ? mix(p.accent, p.paper, 0.45) : mix(p.accent, p.paper, 0.18);
      tiles.push(
        `<polygon points="${a} ${b} ${d} ${e}" fill="${col}" stroke="${alpha(p.ink, 0.5)}" stroke-width="2.5" stroke-linejoin="round"/>`,
      );
    }
  }
  const tag = (x, y, rot) =>
    `<g transform="translate(${x} ${y}) rotate(${rot} 0 -24)"><path d="M0 -42L0 -24" stroke="${alpha(p.paper, 0.7)}" stroke-width="2"/><path d="${tagPath(22, -26, 34)}" transform="translate(3 4)" fill="#000" opacity=".3"/><path d="${tagPath(22, -26, 34)}" fill="${tagFill}"/><circle cx="0" cy="-14" r="3.6" fill="${p.deep}"/><rect x="-12" y="2" width="24" height="5" rx="2.5" fill="${p.accentB}"/><rect x="-12" y="13" width="15" height="4" rx="2" fill="${alpha(p.ink, 0.3)}"/><circle cx="12" cy="23" r="4" fill="${p.accent}" opacity=".75"/></g>`;

  return `
    <defs>
      <pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="${mix(p.deep, p.ink, 0.25)}"/><path d="M0 0V12" stroke="${alpha(p.paper, 0.55)}" stroke-width="2"/></pattern>
      <linearGradient id="wallG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>
      <clipPath id="roomC"><rect x="610" y="100" width="550" height="300"/></clipPath>
    </defs>
    <g fill="none" stroke="${alpha(p.paper, 0.1)}" stroke-width="1.5"><path d="M60 120H500M60 200H500M60 280H500" stroke-dasharray="3 10"/></g>
    <rect x="580" y="66" width="620" height="34" fill="url(#hatch)"/>
    <rect x="580" y="100" width="30" height="420" fill="url(#hatch)"/>
    <rect x="560" y="500" width="640" height="40" fill="url(#hatch)"/>
    <rect x="1160" y="100" width="30" height="400" fill="url(#hatch)"/>
    <rect x="580" y="64" width="620" height="3" fill="${p.paper}" opacity=".6"/>
    <rect x="610" y="100" width="550" height="300" fill="${tan}"/>
    <g clip-path="url(#roomC)">
      <rect x="610" y="100" width="150" height="300" fill="${painted}"/>
      <rect x="760" y="100" width="100" height="94" fill="${painted}"/>
      <rect x="760" y="100" width="100" height="94" fill="${lighten(painted, 0.3)}" opacity=".25"/>
      <rect x="760" y="186" width="100" height="10" fill="${lighten(painted, 0.35)}" opacity=".55"/>
      <rect x="610" y="100" width="550" height="300" fill="url(#wallG)"/>
      <rect x="1004" y="130" width="116" height="110" rx="4" fill="${mix(p.deep, p.ink, 0.2)}"/><rect x="1010" y="136" width="104" height="98" fill="${mix(p.glow, p.paper, 0.55)}"/><rect x="1010" y="136" width="104" height="98" fill="${mix(p.deep, "#7ad", 0.2)}" opacity=".25"/><path d="M1062 136V234M1010 185H1114" stroke="${mix(p.deep, p.ink, 0.2)}" stroke-width="6"/><rect x="996" y="236" width="132" height="10" rx="3" fill="${mix(p.deep, p.paper, 0.3)}"/>
      <rect x="610" y="388" width="550" height="14" fill="${mix(p.paper, p.deep, 0.15)}"/><rect x="610" y="388" width="550" height="3" fill="#fff" opacity=".5"/>
    </g>
    <path d="M760 100V400" stroke="${alpha(p.ink, 0.1)}" stroke-width="2" clip-path="url(#roomC)"/>
    ${tiles.join("")}
    <g>
      <path d="M862 193H892V240L912 306" fill="none" stroke="${darken(p.paper, 0.5)}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M912 306L930 382" stroke="${p.ink}" stroke-width="22" stroke-linecap="round"/><path d="M912 306L930 382" stroke="${lighten(p.accent, 0.1)}" stroke-width="16" stroke-linecap="round"/><path d="M912 306L918 330" stroke="${lighten(p.accent, 0.5)}" stroke-width="5" stroke-linecap="round"/>
      <rect x="750" y="174" width="116" height="40" rx="14" fill="${painted}"/><rect x="750" y="174" width="116" height="16" rx="8" fill="${lighten(painted, 0.35)}" opacity=".7"/>
      <path d="M776 176l10 36M806 176l10 36M836 176l10 36" stroke="${lighten(painted, 0.5)}" stroke-width="3" opacity=".5"/>
      <rect x="744" y="170" width="12" height="48" rx="5" fill="${darken(p.paper, 0.45)}"/><rect x="860" y="170" width="12" height="48" rx="5" fill="${darken(p.paper, 0.45)}"/>
    </g>
    <g>
      <ellipse cx="702" cy="474" rx="48" ry="9" fill="#000" opacity=".3"/>
      <rect x="664" y="410" width="76" height="62" rx="6" fill="#c9ced3"/>
      <rect x="664" y="410" width="22" height="62" rx="6" fill="#fff" opacity=".35"/>
      <rect x="664" y="436" width="76" height="14" fill="${painted}"/>
      <path d="M676 408V436q0 12 6 12t6-12V408ZM716 408V430q0 10 5 10t5-10V408Z" fill="${lighten(painted, 0.15)}"/>
      <ellipse cx="702" cy="410" rx="40" ry="9" fill="#9aa1a8"/><ellipse cx="702" cy="410" rx="32" ry="6" fill="${lighten(painted, 0.2)}"/>
      <path d="M664 416Q702 372 740 416" fill="none" stroke="#7d848b" stroke-width="3.5"/>
      ${tag(666, 452, 14)}
    </g>
    ${fan}
    <circle cx="1080" cy="484" r="9" fill="${darken(p.paper, 0.4)}"/><circle cx="1080" cy="484" r="3.5" fill="#fff" opacity=".6"/>
    ${tag(1118, 470, -8)}`;
}

/* ------------------------------------------------------------------ unit-6-a */

/** Pixel-art arcade cabinet beside a scoreboard of variable-block groups (x, x, x + 3 tokens). */
function gameStudio(p) {
  const U = 12;
  const ox = 640;
  const oy = 56;
  const gold = "#ffd23f";
  const R = (c, r, w, h, fill) =>
    `<rect x="${ox + c * U}" y="${oy + r * U}" width="${w * U}" height="${h * U}" fill="${fill}"/>`;
  const sprite = (rows, x, y, s, fill) =>
    rows
      .map((row, j) => {
        const out = [];
        let i = 0;
        while (i < row.length) {
          if (row[i] === "x") {
            let k = i;
            while (k < row.length && row[k] === "x") k++;
            out.push(
              `<rect x="${x + i * s}" y="${y + j * s}" width="${(k - i) * s}" height="${s}"/>`,
            );
            i = k;
          } else i++;
        }
        return out.join("");
      })
      .join("")
      .replace(/^/, `<g fill="${fill}">`)
      .concat("</g>");
  const inv = [
    "..x.....x..",
    "...x...x...",
    "..xxxxxxx..",
    ".xx.xxx.xx.",
    "xxxxxxxxxxx",
    "x.xxxxxxx.x",
    "x.x.....x.x",
    "...xx.xx...",
  ];
  const ship = ["...x...", "..xxx..", ".xxxxx.", "xxxxxxx"];
  const body = p.accent;
  const marq = p.accentB;
  const dark = mix(p.ink, "#000", 0.3);
  const bez = mix(p.deep, p.ink, 0.55);
  const zig = [29, 30, 31, 32, 33, 34, 35, 36]
    .map((r, i) => R(i % 2 ? 1 : 2, r, 1, 1, p.glow) + R(i % 2 ? 18 : 17, r, 1, 1, p.glow))
    .join("");
  const scan = Array.from(
    { length: 26 },
    (_, i) => `<rect x="${ox + 3 * U}" y="${oy + 10 * U + i * 6}" width="${14 * U}" height="1.6"/>`,
  ).join("");
  const stars = [
    [2, 1],
    [11, 3],
    [6, 6],
    [13, 8],
    [3, 10],
    [9, 11],
    [1, 5],
  ]
    .map(
      ([a, b]) =>
        `<rect x="${ox + 3 * U + a * 11 + 4}" y="${oy + 10 * U + b * 12 + 36}" width="3" height="3" fill="${alpha(p.paper, 0.7)}"/>`,
    )
    .join("");

  const board = { x: 898, y: 100, w: 288, h: 380 };
  const V = (x, y, s = 38) =>
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${darken(p.accentB, 0.25)}"/><rect x="${x}" y="${y}" width="${s}" height="${s - 5}" fill="${p.accentB}"/><rect x="${x}" y="${y}" width="${s}" height="5" fill="${lighten(p.accentB, 0.45)}"/><rect x="${x + 9}" y="${y + 9}" width="${s - 18}" height="${s - 18}" fill="${p.ink}"/><rect x="${x + s / 2 - 3}" y="${y + s / 2 - 3}" width="6" height="6" fill="${p.glow}"/>`;
  const T = (x, y, s = 16) =>
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${darken(gold, 0.3)}"/><rect x="${x}" y="${y}" width="${s}" height="${s - 3}" fill="${gold}"/><rect x="${x + 2}" y="${y + 2}" width="5" height="5" fill="#fff6c8"/>`;
  const plus = (x, y) =>
    `<rect x="${x}" y="${y + 7}" width="20" height="6" fill="${p.paper}"/><rect x="${x + 7}" y="${y}" width="6" height="20" fill="${p.paper}"/>`;
  const rowOf = (y, nv, nt) => {
    let x = 930;
    let out = "";
    for (let i = 0; i < nv; i++) {
      out += V(x, y);
      x += 46;
    }
    x += 4;
    out += plus(x, y + 9);
    x += 32;
    for (let i = 0; i < nt; i++) {
      out += T(x, y + 11);
      x += 22;
    }
    return out;
  };
  const confetti = [
    [560, 90, p.glow],
    [640, 560, p.accentB],
    [1180, 60, p.glow],
    [1170, 540, p.accent],
    [860, 70, p.accentB],
    [540, 300, p.glow],
    [180, 150, p.glow],
    [320, 480, p.accentB],
    [420, 80, p.paper],
    [90, 400, p.paper],
  ]
    .map(([x, y, c]) => `<rect x="${x}" y="${y}" width="10" height="10" fill="${alpha(c, 0.7)}"/>`)
    .join("");
  const checker = Array.from({ length: 50 }, (_, i) =>
    i % 2
      ? `<rect x="${i * 24}" y="552" width="24" height="24" fill="${alpha(p.paper, 0.05)}"/><rect x="${i * 24 - 24}" y="576" width="24" height="24" fill="${alpha(p.paper, 0.05)}"/>`
      : "",
  ).join("");

  return `
    <defs><filter id="neon" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter></defs>
    ${checker}${confetti}
    <ellipse cx="760" cy="546" rx="170" ry="12" fill="#000" opacity=".4"/>
    <g filter="url(#neon)" opacity="1">${R(1, 0, 18, 6, p.accentB)}<rect x="${ox + 3 * U}" y="${oy + 10 * U}" width="${14 * U}" height="${13 * U}" fill="${p.glow}" opacity=".7"/></g>
    ${R(3, 0, 14, 1, lighten(marq, 0.3))}${R(2, 1, 16, 1, marq)}${R(1, 2, 18, 4, marq)}${R(2, 2, 16, 3, dark)}
    ${R(4, 3, 2, 2, p.glow)}${R(9, 3, 2, 2, lighten(marq, 0.4))}${R(14, 3, 2, 2, p.glow)}${R(1, 5, 18, 1, darken(marq, 0.3))}
    ${R(1, 6, 18, 4, body)}${R(1, 6, 18, 1, lighten(body, 0.25))}
    ${R(0, 7, 1, 20, lighten(body, 0.2))}${R(19, 7, 1, 20, darken(body, 0.3))}
    ${R(2, 9, 16, 15, bez)}${R(3, 10, 14, 13, p.ink)}
    <g fill="${alpha(p.paper, 0.1)}">${scan}</g>${stars}
    ${sprite(inv, ox + 3 * U + 12, oy + 10 * U + 16, 6, p.glow)}${sprite(inv, ox + 3 * U + 90, oy + 10 * U + 16, 6, lighten(marq, 0.35))}
    ${sprite(inv, ox + 3 * U + 12, oy + 10 * U + 76, 6, lighten(marq, 0.35))}${sprite(inv, ox + 3 * U + 90, oy + 10 * U + 76, 6, p.glow)}
    ${sprite(ship, ox + 3 * U + 63, oy + 10 * U + 128, 6, gold)}<rect x="${ox + 3 * U + 80}" y="${oy + 10 * U + 100}" width="4" height="14" fill="${p.paper}"/>
    ${R(1, 24, 18, 4, darken(body, 0.2))}${R(1, 24, 18, 1, lighten(body, 0.1))}${R(0, 25, 1, 3, darken(body, 0.2))}${R(19, 25, 1, 3, darken(body, 0.45))}
    ${R(4, 25, 2, 2, "#e8394a")}${R(4, 25, 1, 1, "#ff9aa0")}${R(10, 25, 2, 2, p.glow)}${R(13, 25, 2, 2, lighten(marq, 0.3))}${R(16, 25, 2, 2, gold)}
    ${R(1, 28, 18, 12, darken(body, 0.35))}${R(1, 28, 1, 12, darken(body, 0.15))}${R(18, 28, 1, 12, darken(body, 0.55))}${zig}
    ${R(7, 31, 6, 5, dark)}${R(9, 32, 2, 3, gold)}${R(9, 34, 2, 1, "#e8394a")}${R(1, 37, 18, 3, darken(body, 0.55))}
    <g filter="url(#neon)" opacity=".7"><rect x="${board.x}" y="${board.y}" width="${board.w}" height="${board.h}" fill="${p.glow}"/></g>
    <g fill="${p.glow}"><rect x="${board.x + 12}" y="${board.y}" width="${board.w - 24}" height="${board.h}"/><rect x="${board.x}" y="${board.y + 12}" width="${board.w}" height="${board.h - 24}"/></g>
    <g fill="${p.ink}"><rect x="${board.x + 20}" y="${board.y + 8}" width="${board.w - 40}" height="${board.h - 16}"/><rect x="${board.x + 8}" y="${board.y + 20}" width="${board.w - 16}" height="${board.h - 40}"/></g>
    <g fill="${alpha(p.paper, 0.14)}">${[0, 1].map((i) => `<rect x="${board.x + 30}" y="${board.y + 140 + i * 104}" width="${board.w - 60}" height="4"/>`).join("")}</g>
    ${[0, 1, 2].map((i) => `<rect x="${board.x + 30 + i * 22}" y="${board.y + 26}" width="14" height="14" fill="${i === 1 ? lighten(p.accentB, 0.35) : p.glow}"/>`).join("")}
    ${rowOf(170, 3, 3)}${rowOf(274, 2, 5)}${rowOf(378, 4, 1)}`;
}

/* ------------------------------------------------------------------ unit-6-b */

/** Flat UI: two tilted phones with toggles, slider and price chips, plus a formula built from coloured blocks. */
function appPricing(p) {
  const bar = (x, y, w, c = alpha(p.ink, 0.16), h = 8) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c}"/>`;
  const toggle = (x, y, on) =>
    `<rect x="${x}" y="${y}" width="40" height="22" rx="11" fill="${on ? p.accent : alpha(p.ink, 0.22)}"/><circle cx="${on ? x + 29 : x + 11}" cy="${y + 11}" r="8.5" fill="#fff"/>`;
  const phone = (
    x,
    y,
    w,
    h,
    rot,
    inner,
  ) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
    <rect x="${x}" y="${y + 20}" width="${w}" height="${h}" rx="38" fill="#000" opacity=".16" filter="url(#soft)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="38" fill="${p.ink}"/>
    <rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="36" fill="${mix(p.ink, p.deep, 0.5)}"/>
    <rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="30" fill="${p.paper}"/>
    <rect x="${x + w / 2 - 26}" y="${y + 15}" width="52" height="12" rx="6" fill="${p.ink}"/>
    ${inner}</g>`;

  const x1 = 640;
  const y1 = 56;
  const phone1 = phone(
    x1,
    y1,
    196,
    390,
    -4,
    `
    ${bar(x1 + 24, y1 + 44, 30, alpha(p.ink, 0.3), 7)}<rect x="${x1 + 140}" y="${y1 + 43}" width="26" height="9" rx="3" fill="${alpha(p.ink, 0.3)}"/>
    <rect x="${x1 + 20}" y="${y1 + 64}" width="156" height="64" rx="16" fill="${p.accent}"/><circle cx="${x1 + 50}" cy="${y1 + 96}" r="16" fill="${p.glow}"/>${bar(x1 + 76, y1 + 86, 70, alpha("#fff", 0.85), 9)}${bar(x1 + 76, y1 + 104, 48, alpha("#fff", 0.45), 7)}
    ${[0, 1, 2].map((i) => `${bar(x1 + 24, y1 + 154 + i * 40, 74 - i * 10, alpha(p.ink, 0.22), 9)}${toggle(x1 + 132, y1 + 148 + i * 40, i !== 1)}`).join("")}
    <rect x="${x1 + 24}" y="${y1 + 282}" width="148" height="8" rx="4" fill="${alpha(p.ink, 0.14)}"/><rect x="${x1 + 24}" y="${y1 + 282}" width="92" height="8" rx="4" fill="${p.accentB}"/>
    <circle cx="${x1 + 116}" cy="${y1 + 286}" r="12" fill="#fff" stroke="${p.accentB}" stroke-width="5"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${x1 + 24 + i * 37}" y="${y1 + 303}" width="2" height="6" fill="${alpha(p.ink, 0.3)}"/>`).join("")}
    <rect x="${x1 + 24}" y="${y1 + 330}" width="148" height="34" rx="17" fill="${p.accent}"/>${bar(x1 + 62, y1 + 343, 72, alpha("#fff", 0.85), 8)}`,
  );

  const x2 = 906;
  const y2 = 96;
  const plan = (i, sel) => {
    const yy = y2 + 62 + i * 82;
    return `<rect x="${x2 + 20}" y="${yy}" width="156" height="70" rx="16" fill="${sel ? lighten(p.glow, 0.7) : "#fff"}" stroke="${sel ? p.accentB : alpha(p.ink, 0.14)}" stroke-width="${sel ? 4 : 2}"/>
      <circle cx="${x2 + 46}" cy="${yy + 35}" r="14" fill="${[p.accent, p.glow, p.accentB][i]}"/>
      ${bar(x2 + 70, yy + 18, 48 + i * 6, alpha(p.ink, 0.28), 9)}${bar(x2 + 70, yy + 36, 40, alpha(p.ink, 0.14), 7)}
      <rect x="${x2 + 122}" y="${yy + 44}" width="44" height="18" rx="9" fill="${p.deep}"/>${[
        0, 1, 2,
      ]
        .map(
          (k) =>
            `<circle cx="${x2 + 134 + k * 10}" cy="${yy + 53}" r="2.6" fill="#fff" opacity=".9"/>`,
        )
        .slice(0, i + 1)
        .join("")}`;
  };
  const phone2 = phone(
    x2,
    y2,
    196,
    390,
    5,
    `
    ${bar(x2 + 24, y2 + 44, 30, alpha(p.ink, 0.3), 7)}<rect x="${x2 + 140}" y="${y2 + 43}" width="26" height="9" rx="3" fill="${alpha(p.ink, 0.3)}"/>
    ${plan(0, false)}${plan(1, true)}${plan(2, false)}
    <rect x="${x2 + 24}" y="${y2 + 318}" width="148" height="42" rx="21" fill="${p.accentB}"/><circle cx="${x2 + 48}" cy="${y2 + 339}" r="9" fill="#fff" opacity=".9"/>${bar(x2 + 68, y2 + 335, 78, alpha("#fff", 0.88), 9)}`,
  );

  const fx = 706;
  const fy = 432;
  const op = {
    plus: (x, y) =>
      `<rect x="${x - 11}" y="${y - 3}" width="22" height="6" rx="3" fill="${p.ink}"/><rect x="${x - 3}" y="${y - 11}" width="6" height="22" rx="3" fill="${p.ink}"/>`,
    times: (x, y) =>
      `<g transform="rotate(45 ${x} ${y})"><rect x="${x - 11}" y="${y - 3}" width="22" height="6" rx="3" fill="${p.ink}"/><rect x="${x - 3}" y="${y - 11}" width="6" height="22" rx="3" fill="${p.ink}"/></g>`,
    eq: (x, y) =>
      `<rect x="${x - 11}" y="${y - 9}" width="22" height="6" rx="3" fill="${p.ink}"/><rect x="${x - 11}" y="${y + 3}" width="22" height="6" rx="3" fill="${p.ink}"/>`,
  };
  const blk = (x, y, s, c) =>
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="9" fill="${c}"/><rect x="${x + 4}" y="${y + 4}" width="${s - 8}" height="${f(s * 0.28)}" rx="5" fill="#fff" opacity=".3"/>`;
  const formula = `
    <rect x="${fx}" y="${fy + 12}" width="430" height="92" rx="26" fill="#000" opacity=".16" filter="url(#soft)"/>
    <rect x="${fx}" y="${fy}" width="430" height="92" rx="26" fill="#fff" stroke="${alpha(p.ink, 0.12)}" stroke-width="2"/>
    ${blk(fx + 24, fy + 20, 52, p.accent)}${op.plus(fx + 100, fy + 46)}${blk(fx + 124, fy + 30, 32, p.accentB)}${op.times(fx + 178, fy + 46)}
    ${[0, 1, 2].map((i) => blk(fx + 202 + i * 40, fy + 30, 32, lighten(p.accent, 0.45))).join("")}${op.eq(fx + 334, fy + 46)}
    <rect x="${fx + 358}" y="${fy + 24}" width="54" height="44" rx="14" fill="${p.glow}"/><rect x="${fx + 366}" y="${fy + 32}" width="38" height="8" rx="4" fill="#fff" opacity=".75"/><rect x="${fx + 366}" y="${fy + 48}" width="24" height="7" rx="3.5" fill="${alpha(p.ink, 0.35)}"/>`;

  const rings = [
    [1100, 90, 120],
    [1100, 90, 80],
    [610, 520, 70],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${alpha(p.accent, 0.18)}" stroke-width="2"/>`,
    )
    .join("");
  const priceChip = (x, y, c, n) =>
    `<g><rect x="${x}" y="${y}" width="${52 + n * 10}" height="30" rx="15" fill="#fff" stroke="${alpha(p.ink, 0.1)}" stroke-width="2"/><circle cx="${x + 16}" cy="${y + 15}" r="7" fill="${c}"/>${bar(x + 30, y + 11, 12 + n * 10, alpha(p.ink, 0.25), 8)}</g>`;

  return `
    <defs><filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter></defs>
    <circle cx="930" cy="290" r="280" fill="${alpha("#fff", 0.45)}"/>${rings}
    ${[
      [580, 150, 8],
      [1160, 330, 10],
      [596, 330, 6],
      [1130, 480, 8],
    ]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${alpha(p.glow, 0.7)}"/>`)
      .join("")}
    ${phone1}${phone2}
    ${priceChip(1104, 58, p.accentB, 1)}${priceChip(592, 440, p.glow, 0)}
    <g transform="translate(1110 170)"><circle r="24" fill="${p.accent}"/><path d="M-10 0L-3 8L11 -8" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g>
    ${formula}`;
}

/* ------------------------------------------------------------------ unit-7-a */

/** Vintage park map on a coordinate grid: ferris wheel at (4, 6), tent at (2, 2), roller-coaster peak at (8, 6). */
function parkMap(p) {
  const O = [650, 480];
  const u = 40;
  const X = (x) => O[0] + u * x;
  const Y = (y) => O[1] - u * y;
  const parch = mix(p.paper, "#ead9a6", 0.55);
  const lawn = mix(p.accent, parch, 0.82);
  const line = alpha(p.ink, 0.5);
  const gridLines = [];
  for (let i = 1; i <= 12; i++)
    gridLines.push(
      `<path d="M${X(i)} ${Y(0)}V${Y(10)}" stroke-opacity="${i % 5 === 0 ? 0.3 : 0.15}"/>`,
    );
  for (let j = 1; j <= 10; j++)
    gridLines.push(
      `<path d="M${X(0)} ${Y(j)}H${X(12)}" stroke-opacity="${j % 5 === 0 ? 0.3 : 0.15}"/>`,
    );
  const ticks = [];
  for (let i = 1; i <= 12; i++) ticks.push(`<path d="M${X(i)} ${Y(0)}v${i % 5 === 0 ? 14 : 8}"/>`);
  for (let j = 1; j <= 10; j++)
    ticks.push(`<path d="M${X(0)} ${Y(j)}h${j % 5 === 0 ? -14 : -8}"/>`);

  const track = spline([
    [X(7), Y(2)],
    [X(8), Y(6)],
    [X(9), Y(3)],
    [X(10), Y(7)],
    [X(11), Y(4)],
    [X(11.7), Y(2)],
  ]);
  const supports = track.samples
    .filter((_, i) => i % 5 === 0)
    .filter(([, y]) => y < Y(2) - 6)
    .map(([x, y]) => `<path d="M${f(x)} ${f(y)}V${Y(2)}"/>`)
    .join("");
  const cars = [0.0, 0.034, 0.068]
    .map((_, k) => {
      const idx = 30 + k * 4;
      const [x, y] = track.samples[idx];
      const [x2, y2] = track.samples[idx + 2];
      const a = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><rect x="-9" y="-14" width="18" height="11" rx="4" fill="${[p.glow, p.accentB, p.glow][k]}" stroke="${p.ink}" stroke-width="1.6"/></g>`;
    })
    .join("");

  const wheel = (() => {
    const cx = X(4);
    const cy = Y(6);
    const R = 70;
    const spokes = Array.from(
      { length: 12 },
      (_, i) =>
        `<path d="M${cx} ${cy}L${f(cx + R * Math.cos(rad(i * 30)))} ${f(cy + R * Math.sin(rad(i * 30)))}"/>`,
    ).join("");
    const gond = Array.from({ length: 12 }, (_, i) => {
      const gx = cx + R * Math.cos(rad(i * 30 + 15));
      const gy = cy + R * Math.sin(rad(i * 30 + 15));
      return `<path d="M${f(gx)} ${f(gy)}v6" stroke="${p.ink}" stroke-width="1.6"/><rect x="${f(gx - 7)}" y="${f(gy + 5)}" width="14" height="11" rx="3.5" fill="${[p.accentB, p.glow, p.accent][i % 3]}" stroke="${p.ink}" stroke-width="1.6"/>`;
    }).join("");
    return `<path d="M${cx} ${cy}L${cx - 36} ${cy + 94}M${cx} ${cy}L${cx + 36} ${cy + 94}M${cx - 46} ${cy + 94}H${cx + 46}" fill="none" stroke="${p.ink}" stroke-width="5" stroke-linecap="round"/>
      <g stroke="${alpha(p.ink, 0.6)}" stroke-width="1.8">${spokes}</g>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${p.ink}" stroke-width="4.5"/><circle cx="${cx}" cy="${cy}" r="${R - 12}" fill="none" stroke="${alpha(p.ink, 0.5)}" stroke-width="2"/>
      ${gond}<circle cx="${cx}" cy="${cy}" r="9" fill="${p.paper}" stroke="${p.ink}" stroke-width="3.5"/>`;
  })();

  const tent = (() => {
    const cx = X(2);
    const by = Y(2);
    const wedges = Array.from(
      { length: 6 },
      (_, i) =>
        `<polygon points="${cx},${by - 70} ${cx - 46 + i * 15.33},${by - 28} ${cx - 46 + (i + 1) * 15.33},${by - 28}" fill="${i % 2 ? p.paper : p.accentB}"/>`,
    ).join("");
    const walls = Array.from(
      { length: 6 },
      (_, i) =>
        `<rect x="${cx - 42 + i * 14}" y="${by - 28}" width="14" height="28" fill="${i % 2 ? p.paper : lighten(p.accentB, 0.1)}"/>`,
    ).join("");
    const skirt = Array.from(
      { length: 6 },
      (_, i) =>
        `<ellipse cx="${cx - 35 + i * 14.4}" cy="${by - 28}" rx="7.4" ry="7" fill="${i % 2 ? p.paper : p.accentB}"/>`,
    ).join("");
    return `${walls}${skirt}${wedges}<path d="M${cx - 8} ${by}V${by - 14}Q${cx} ${by - 24} ${cx + 8} ${by - 14}V${by}Z" fill="${darken(p.ink, 0.2)}"/><path d="M${cx} ${by - 70}V${by - 90}" stroke="${p.ink}" stroke-width="2.4"/><path d="M${cx} ${by - 90}L${cx + 20} ${by - 83}L${cx} ${by - 76}Z" fill="${p.glow}" stroke="${p.ink}" stroke-width="1.4"/><polygon points="${cx},${by - 70} ${cx - 46},${by - 28} ${cx + 46},${by - 28}" fill="none" stroke="${p.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  })();

  const trees = [
    [1.4, 5.2],
    [0.9, 7.4],
    [2.3, 8.6],
    [5.6, 9.1],
    [6.4, 4.2],
    [11.6, 6.6],
    [5.2, 1.2],
    [9.3, 1.1],
    [3.2, 0.8],
  ]
    .map(
      ([x, y]) =>
        `<g transform="translate(${f(X(x))} ${f(Y(y))})"><ellipse cy="14" rx="12" ry="4" fill="${alpha(p.ink, 0.15)}"/><rect x="-2" y="2" width="4" height="12" fill="${darken(p.accentB, 0.3)}"/><circle cy="-4" r="14" fill="${mix(p.deep, parch, 0.15)}"/><circle cx="-4" cy="-8" r="6" fill="${mix(p.deep, parch, 0.45)}" opacity=".7"/></g>`,
    )
    .join("");

  const pt = (
    gx,
    gy,
  ) => `<g><path d="M${X(gx)} ${Y(gy)}V${Y(0)}M${X(gx)} ${Y(gy)}H${X(0)}" fill="none" stroke="${p.accentB}" stroke-width="2.6" stroke-dasharray="7 5" stroke-linecap="round"/>
    <path d="M${X(gx)} ${Y(0) - 7}l-7 14h14Z" fill="${p.accentB}"/><path d="M${X(0) + 7} ${Y(gy)}l-14 -7v14Z" fill="${p.accentB}"/>
    <circle cx="${X(gx)}" cy="${Y(gy)}" r="9" fill="${p.accentB}" stroke="#fff" stroke-width="3.5"/></g>`;

  const compass = `<g transform="translate(1114 112)"><circle r="30" fill="none" stroke="${line}" stroke-width="2"/><path d="M0 -28L6 0L0 28L-6 0Z" fill="${alpha(p.ink, 0.7)}"/><path d="M-28 0L0 -6L28 0L0 6Z" fill="${alpha(p.ink, 0.3)}"/><path d="M0 -28L6 0L-6 0Z" fill="${p.accentB}"/></g>`;

  return `
    <g fill="none" stroke="${alpha(p.deep, 0.1)}" stroke-width="1.5"><circle cx="150" cy="450" r="170" stroke-dasharray="4 12"/><circle cx="150" cy="450" r="110"/><path d="M0 200Q200 150 400 220T560 160" stroke-dasharray="3 10"/></g>
    <rect x="606" y="64" width="574" height="492" rx="12" fill="#000" opacity=".1"/>
    <rect x="596" y="52" width="574" height="492" rx="12" fill="${parch}" stroke="${line}" stroke-width="3"/>
    <rect x="606" y="62" width="554" height="472" rx="8" fill="none" stroke="${alpha(p.ink, 0.35)}" stroke-width="1.4"/>
    <rect x="${X(0)}" y="${Y(10)}" width="${u * 12}" height="${u * 10}" fill="${lawn}"/>
    <ellipse cx="${X(7.4)}" cy="${Y(8.8)}" rx="74" ry="30" fill="${mix(p.accent, parch, 0.55)}" stroke="${alpha(p.accent, 0.6)}" stroke-width="2.5"/><path d="M${X(6.6)} ${Y(8.8)}q14 -6 28 0M${X(7.6)} ${Y(8.4)}q14 -6 28 0" fill="none" stroke="${alpha("#fff", 0.7)}" stroke-width="2.4" stroke-linecap="round"/>
    <g fill="none" stroke="${p.ink}" stroke-width="1">${gridLines.join("")}</g>
    <path d="M${X(1)} ${Y(1)}Q${X(2.4)} ${Y(1)} ${X(2)} ${Y(2.6)}Q${X(1.8)} ${Y(3.6)} ${X(4)} ${Y(3.8)}Q${X(5.6)} ${Y(4)} ${X(6)} ${Y(3)}Q${X(6.4)} ${Y(1.6)} ${X(7)} ${Y(2)}Q${X(9)} ${Y(0.6)} ${X(11)} ${Y(1.6)}" fill="none" stroke="#c7ac6b" stroke-width="9" stroke-linecap="round"/>
    <path d="M${X(1)} ${Y(1)}Q${X(2.4)} ${Y(1)} ${X(2)} ${Y(2.6)}Q${X(1.8)} ${Y(3.6)} ${X(4)} ${Y(3.8)}Q${X(5.6)} ${Y(4)} ${X(6)} ${Y(3)}Q${X(6.4)} ${Y(1.6)} ${X(7)} ${Y(2)}Q${X(9)} ${Y(0.6)} ${X(11)} ${Y(1.6)}" fill="none" stroke="${alpha("#fff", 0.7)}" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>
    ${trees}
    <g fill="none" stroke="${alpha(p.accentB, 0.55)}" stroke-width="2">${supports}</g>
    <path d="${track.d}" fill="none" stroke="${p.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${track.d}" fill="none" stroke="${p.accentB}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${cars}
    ${wheel}${tent}
    <g stroke="${p.ink}" stroke-width="2.6" stroke-linecap="round"><path d="M${X(0)} ${Y(0)}H${X(12) + 26}M${X(0)} ${Y(0)}V${Y(10) - 26}"/></g>
    <path d="M${X(12) + 34} ${Y(0)}l-14 -7v14Z" fill="${p.ink}"/><path d="M${X(0)} ${Y(10) - 34}l-7 14h14Z" fill="${p.ink}"/>
    <g stroke="${p.ink}" stroke-width="2.4" stroke-linecap="round">${ticks.join("")}</g>
    ${pt(2, 2)}${pt(4, 6)}${pt(8, 6)}
    <circle cx="${X(0)}" cy="${Y(0)}" r="6" fill="${p.ink}"/>
    ${compass}`;
}

/* ------------------------------------------------------------------ unit-7-b */

/** Sonar scope: concentric rings on a coordinate grid, fading sweep, submarine, pings at grid points. */
function subControl(p) {
  const cx = 880;
  const cy = 300;
  const R = 250;
  const u = 50;
  const g = [];
  for (let i = -5; i <= 5; i++) {
    g.push(`<path d="M${cx + i * u} ${cy - R}V${cy + R}"/>`);
    g.push(`<path d="M${cx - R} ${cy + i * u}H${cx + R}"/>`);
  }
  const rings = [1, 2, 3, 4, 5]
    .map(
      (k) =>
        `<circle cx="${cx}" cy="${cy}" r="${k * u}" fill="none" stroke="${alpha(p.glow, k === 5 ? 0.85 : 0.34)}" stroke-width="${k === 5 ? 3 : 1.8}"/>`,
    )
    .join("");
  const a0 = -52;
  const slices = Array.from({ length: 30 }, (_, i) => {
    const s = rad(a0 - 3 * (i + 1));
    const e = rad(a0 - 3 * i);
    return `<path d="M${cx} ${cy}L${f(cx + R * Math.cos(s))} ${f(cy + R * Math.sin(s))}A${R} ${R} 0 0 1 ${f(cx + R * Math.cos(e))} ${f(cy + R * Math.sin(e))}Z" fill="${p.glow}" fill-opacity="${f(0.6 * (1 - i / 30) ** 1.05)}"/>`;
  }).join("");
  const bezel = Array.from({ length: 36 }, (_, i) => {
    const a = rad(i * 10);
    const l = i % 3 === 0 ? 18 : 9;
    return `<path d="M${f(cx + (R + 8) * Math.cos(a))} ${f(cy + (R + 8) * Math.sin(a))}L${f(cx + (R + 8 + l) * Math.cos(a))} ${f(cy + (R + 8 + l) * Math.sin(a))}"/>`;
  }).join("");
  const axisTicks = Array.from({ length: 10 }, (_, i) => {
    const k = i < 5 ? i - 5 : i - 4;
    return `<path d="M${cx + k * u} ${cy - 6}v12M${cx - 6} ${cy + k * u}h12"/>`;
  }).join("");
  const ping = (gx, gy, big) => {
    const x = cx + gx * u;
    const y = cy - gy * u;
    return `<circle cx="${x}" cy="${y}" r="${big ? 34 : 24}" fill="none" stroke="${alpha(p.glow, 0.28)}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${big ? 20 : 14}" fill="${alpha(p.glow, 0.22)}" stroke="${alpha(p.glow, 0.6)}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${big ? 8 : 6}" fill="${lighten(p.glow, 0.45)}"/>`;
  };
  const sub = `<g transform="translate(${cx} ${cy}) scale(.9)">
    <path d="M-120 -4L-150 -34L-136 -34L-108 -12Z M-120 6L-150 36L-136 36L-108 14Z" fill="${mix(p.deep, p.ink, 0.3)}" stroke="${alpha(p.glow, 0.7)}" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="-28" y="-72" width="54" height="42" rx="12" fill="${mix(p.deep, p.ink, 0.3)}" stroke="${alpha(p.glow, 0.7)}" stroke-width="2.4"/>
    <path d="M0 -72V-100H18" fill="none" stroke="${alpha(p.glow, 0.8)}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-120 0C-120 -34 -70 -38 -14 -38H80C128 -38 156 -18 156 0C156 18 128 38 80 38H-14C-70 38 -120 34 -120 0Z" fill="${mix(p.deep, p.ink, 0.3)}" stroke="${alpha(p.glow, 0.85)}" stroke-width="2.6"/>
    <path d="M-100 -14C-80 -28 -30 -30 60 -30C110 -30 136 -20 146 -8C110 -16 20 -18 -100 -14Z" fill="${p.accent}" opacity=".7"/>
    <g fill="${alpha(p.glow, 0.85)}">${[10, 44, 78].map((x) => `<circle cx="${x}" cy="2" r="7"/>`).join("")}</g>
    <g fill="${alpha(p.ink, 0.6)}">${[10, 44, 78].map((x) => `<circle cx="${x}" cy="2" r="3.6"/>`).join("")}</g>
    <ellipse cx="-124" cy="0" rx="8" ry="22" fill="${alpha(p.glow, 0.7)}"/></g>`;
  const bubbles = [
    [120, 520, 8],
    [170, 440, 12],
    [140, 330, 6],
    [260, 190, 10],
    [420, 500, 9],
    [470, 400, 6],
    [90, 90, 14],
    [330, 90, 7],
    [1170, 520, 9],
    [1150, 80, 8],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${alpha(p.glow, 0.28)}" stroke-width="2.4"/>`,
    )
    .join("");
  const rays = [
    [420, 0, 520, 600, 0.06],
    [620, 0, 640, 600, 0.04],
  ]
    .map(
      ([x1, y1, x2, y2, o]) =>
        `<path d="M${x1} ${y1}L${x1 + 80} ${y1}L${x2} ${y2}L${x2 - 120} ${y2}Z" fill="${alpha(p.glow, o)}"/>`,
    )
    .join("");
  const seabed = `<path d="M0 600V560Q80 530 160 552T330 548T520 560T700 540T900 562T1080 546T1200 556V600Z" fill="${alpha("#000", 0.35)}"/><g stroke="${alpha(p.glow, 0.3)}" stroke-width="5" stroke-linecap="round" fill="none"><path d="M120 556Q108 528 124 506M136 556Q150 524 138 496M760 548Q748 524 764 502"/></g>`;

  return `
    <defs><clipPath id="scope"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath><radialGradient id="screen" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p.accent}" stop-opacity=".5"/><stop offset="1" stop-color="${p.ink}" stop-opacity=".85"/></radialGradient></defs>
    ${rays}${bubbles}${seabed}
    <circle cx="${cx}" cy="${cy}" r="${R + 34}" fill="${alpha(p.ink, 0.5)}" stroke="${alpha(p.glow, 0.25)}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#screen)"/>
    <g clip-path="url(#scope)">
      <g stroke="${alpha(p.glow, 0.17)}" stroke-width="1.4">${g.join("")}</g>${slices}
      <path d="M${cx} ${cy}L${cx} ${cy}" />
    </g>
    <g stroke="${alpha(p.glow, 0.7)}" stroke-width="2.4"><path d="M${cx - R} ${cy}H${cx + R}M${cx} ${cy - R}V${cy + R}"/>${axisTicks}</g>
    ${rings}
    <path d="M${cx} ${cy}L${f(cx + R * Math.cos(rad(a0)))} ${f(cy + R * Math.sin(rad(a0)))}" stroke="${lighten(p.glow, 0.4)}" stroke-width="3.2" stroke-linecap="round"/>
    <g stroke="${alpha(p.glow, 0.65)}" stroke-width="2.2">${bezel}</g>
    ${ping(3, 2, true)}${ping(-2, 3)}${ping(-4, -1)}${ping(1, -3)}${ping(4, -2)}${ping(-1, -4)}${ping(2, 4)}
    ${sub}`;
}

export const SCENES_B = {
  "unit-4-a": popUpShop,
  "unit-4-b": smartShopper,
  "unit-5-a": dreamRoom,
  "unit-5-b": roomMakeover,
  "unit-6-a": gameStudio,
  "unit-6-b": appPricing,
  "unit-7-a": parkMap,
  "unit-7-b": subControl,
};

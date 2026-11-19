import { alpha, darken, lighten, mix } from "../color.mjs";

/* Group A: discovery, pre-unit-a, unit-1-a, unit-1-b, unit-1-c, unit-2-a, unit-2-b, unit-3-a, unit-3-b */

/** Three smoothie cups in a 3:2 fruit-to-banana ratio, with the ratio drawn as dots underneath. */
function smoothieBar(p) {
  const berry = "#d93a56";
  const banana = "#ffd75e";
  const cup = (cx, top, h, id, layers) => {
    const tw = 74;
    const bw = 54;
    const bottom = top + h;
    const path = `M${cx - tw} ${top} L${cx + tw} ${top} L${cx + bw} ${bottom} Q${cx} ${bottom + 12} ${cx - bw} ${bottom} Z`;
    let y = bottom + 12;
    const total = layers.reduce((s, l) => s + l.parts, 0);
    const fills = layers
      .map((l) => {
        const lh = ((h + 12) * l.parts) / total;
        y -= lh;
        return `<rect x="${cx - tw - 4}" y="${y.toFixed(1)}" width="${tw * 2 + 8}" height="${(lh + 1).toFixed(1)}" fill="${l.color}"/>`;
      })
      .join("");
    return `<clipPath id="${id}"><path d="${path}"/></clipPath>
      <g clip-path="url(#${id})">${fills}<rect x="${cx - tw}" y="${top}" width="${tw * 2}" height="22" fill="#fff" opacity=".55"/></g>
      <path d="${path}" fill="#fff" opacity=".22"/>
      <path d="M${cx - tw + 14} ${top + 26} L${cx - bw + 10} ${bottom - 14}" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".5"/>
      <path d="${path}" fill="none" stroke="${p.ink}" stroke-opacity=".22" stroke-width="3"/>
      <rect x="${cx - tw - 8}" y="${top - 16}" width="${tw * 2 + 16}" height="18" rx="9" fill="${p.accent}"/>
      <rect x="${cx + 14}" y="${top - 118}" width="14" height="112" rx="7" fill="${p.accentB}" transform="rotate(10 ${cx + 21} ${top - 6})"/>`;
  };
  const dots = (cx, y, a, b, r = 10, gap = 24) => {
    const n = a + b;
    const x0 = cx - ((n - 1) * gap) / 2;
    return Array.from(
      { length: n },
      (_, i) =>
        `<circle cx="${x0 + i * gap}" cy="${y}" r="${r}" fill="${i < a ? berry : banana}" stroke="${p.ink}" stroke-opacity=".25" stroke-width="2"/>`,
    ).join("");
  };
  const slice = (cx, cy, r, c) => {
    const segs = Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `<path d="M${cx} ${cy} L${(cx + Math.cos(a) * (r - 7)).toFixed(1)} ${(cy + Math.sin(a) * (r - 7)).toFixed(1)}" stroke="${lighten(c, 0.45)}" stroke-width="3"/>`;
    }).join("");
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${darken(c, 0.12)}"/><circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="${c}"/>${segs}`;
  };
  const bubbles = [
    [420, 150, 26],
    [500, 250, 14],
    [450, 380, 20],
    [560, 120, 10],
    [590, 470, 16],
    [400, 520, 12],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${alpha(p.accent, 0.35)}" stroke-width="3"/>`,
    )
    .join("");
  const floor = `<rect y="462" width="1200" height="138" fill="${alpha(p.accent, 0.16)}"/><rect y="462" width="1200" height="6" fill="${alpha(p.accent, 0.35)}"/>`;
  return `
    <circle cx="880" cy="290" r="268" fill="${lighten(p.glow, 0.55)}"/>
    <circle cx="880" cy="290" r="210" fill="none" stroke="${alpha(p.glow, 0.9)}" stroke-width="3" stroke-dasharray="3 14" stroke-linecap="round"/>
    ${bubbles}${floor}
    <ellipse cx="740" cy="476" rx="104" ry="13" fill="${alpha(p.ink, 0.2)}"/><ellipse cx="900" cy="486" rx="112" ry="14" fill="${alpha(p.ink, 0.22)}"/><ellipse cx="1060" cy="476" rx="104" ry="13" fill="${alpha(p.ink, 0.2)}"/>
    ${cup(740, 190, 270, "cupA", [
      { parts: 3, color: berry },
      { parts: 2, color: banana },
    ])}
    ${cup(900, 128, 340, "cupB", [
      { parts: 6, color: berry },
      { parts: 4, color: banana },
    ])}
    ${cup(1060, 190, 270, "cupC", [
      { parts: 3, color: berry },
      { parts: 2, color: banana },
    ])}
    ${dots(740, 536, 3, 2)}${dots(900, 536, 6, 4, 7, 18)}${dots(1060, 536, 3, 2)}
    ${slice(626, 440, 36, "#ff9d3b")}${slice(1150, 430, 30, "#9ad04a")}
    <g transform="translate(560 392)"><path d="M0 -34 C34 -40 48 -6 28 28 C16 48 0 54 0 54 C0 54 -16 48 -28 28 C-48 -6 -34 -40 0 -34Z" fill="${berry}"/>
      <path d="M-22 -34 L0 -52 L22 -34 L8 -30 L0 -42 L-8 -30Z" fill="${p.accentB}"/>
      ${[
        [-12, -10],
        [10, -14],
        [0, 6],
        [-16, 14],
        [14, 10],
        [0, 28],
      ]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="4.5" fill="${banana}"/>`)
        .join("")}</g>
    <path d="M628 318 Q690 296 726 252 Q716 332 640 352 Q618 346 628 318Z" fill="${banana}" stroke="${darken(banana, 0.3)}" stroke-width="3" stroke-linejoin="round" transform="translate(-110 20) rotate(-8 680 300)"/>`;
}

/** discovery: a patchwork exhibit of paper-cut tiles, each tile a different dot or grouping pattern. */
function discoveryQuilt(p) {
  const paperTone = [
    p.paper,
    lighten(p.glow, 0.45),
    mix(p.accentB, "#ffffff", 0.55),
    mix(p.accent, "#ffffff", 0.6),
    mix(p.glow, p.accent, 0.3),
    mix(p.accentB, p.glow, 0.5),
  ];
  const dot = (x, y, r, c) =>
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}"/>`;
  const dice = (w, h, n, c) => {
    const [a, b, m] = [w * 0.28, w * 0.72, w / 2];
    const [ya, yb, ym] = [h * 0.28, h * 0.72, h / 2];
    const map = {
      1: [[m, ym]],
      2: [
        [a, ya],
        [b, yb],
      ],
      3: [
        [a, ya],
        [m, ym],
        [b, yb],
      ],
      4: [
        [a, ya],
        [b, ya],
        [a, yb],
        [b, yb],
      ],
      5: [
        [a, ya],
        [b, ya],
        [m, ym],
        [a, yb],
        [b, yb],
      ],
      6: [
        [a, ya],
        [b, ya],
        [a, ym],
        [b, ym],
        [a, yb],
        [b, yb],
      ],
    };
    return map[n].map(([x, y]) => dot(x, y, 12, c)).join("");
  };
  const array = (w, h, rows, cols, c) => {
    const gx = w / (cols + 1);
    const gy = h / (rows + 1);
    return Array.from({ length: rows * cols }, (_, i) =>
      dot(gx * ((i % cols) + 1), gy * (Math.floor(i / cols) + 1), 8.5, c),
    ).join("");
  };
  const tenFrame = (w, h, n, c, line) => {
    const cw = (w - 28) / 5;
    const ch = (h - 40) / 2;
    return Array.from({ length: 10 }, (_, i) => {
      const x = 14 + (i % 5) * cw;
      const y = 20 + Math.floor(i / 5) * ch;
      return `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="none" stroke="${line}" stroke-width="3"/>${i < n ? dot(x + cw / 2, y + ch / 2, Math.min(cw, ch) * 0.3, c) : ""}`;
    }).join("");
  };
  const groupsOf4 = (cx, cy, r, c, ring) => {
    const o = r * 0.4;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ring}" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>${[
      [-o, -o],
      [o, -o],
      [-o, o],
      [o, o],
    ]
      .map(([x, y]) => dot(cx + x, cy + y, r * 0.2, c))
      .join("")}`;
  };
  const tile = (x, y, w, h, rot, fill, body, i) => {
    const wob = (k) => ((i * 7 + k * 13) % 5) - 2;
    const pts = `M${wob(1)} ${wob(2)} L${w + wob(3)} ${wob(4)} L${w + wob(5)} ${h + wob(6)} L${wob(7)} ${h + wob(8)}Z`;
    return `<g transform="translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2})">
      <path d="${pts}" transform="translate(5 8)" fill="${alpha("#000000", 0.28)}" stroke="${alpha("#000000", 0.28)}" stroke-width="10" stroke-linejoin="round"/>
      <path d="${pts}" fill="${fill}" stroke="${fill}" stroke-width="10" stroke-linejoin="round"/>
      <path d="M0 0 L${w} 0" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
      ${body}</g>`;
  };
  const line = alpha(p.ink, 0.35);
  const D = darken(p.deep, 0.1);
  const big = (() => {
    const fill = lighten(p.glow, 0.55);
    const groups = [
      [84, 84],
      [196, 84],
      [84, 196],
      [196, 196],
    ]
      .map(([x, y]) => groupsOf4(x, y, 44, p.accent, p.deep))
      .join("");
    const extra = [
      [248, 252],
      [268, 232],
      [270, 262],
    ]
      .map(([x, y]) => dot(x, y, 8, p.accentB))
      .join("");
    return tile(
      740,
      130,
      290,
      290,
      -2,
      fill,
      `${groups}${extra}<path d="M232 220 Q262 214 282 240" stroke="${p.accentB}" stroke-width="3" fill="none" stroke-dasharray="3 6" stroke-linecap="round"/>`,
      3,
    );
  })();
  const arch = `<path d="M590 560 L590 270 A290 290 0 0 1 1170 270 L1170 560Z" fill="${alpha(p.glow, 0.1)}"/><path d="M620 560 L620 270 A260 260 0 0 1 1140 270 L1140 560Z" fill="none" stroke="${alpha(p.glow, 0.5)}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  const confetti = [
    [660, 28, 14, 20],
    [1110, 30, 12, -30],
    [560, 220, 12, 10],
    [558, 400, 10, 40],
    [720, 578, 10, 0],
    [1110, 575, 12, 0],
  ]
    .map(
      ([x, y, r, rot], i) =>
        `<path d="M0 ${-r} L${r * 0.3} ${-r * 0.3} L${r} 0 L${r * 0.3} ${r * 0.3} L0 ${r} L${-r * 0.3} ${r * 0.3} L${-r} 0 L${-r * 0.3} ${-r * 0.3}Z" transform="translate(${x} ${y}) rotate(${rot})" fill="${i % 2 ? p.glow : lighten(p.accentB, 0.5)}" opacity=".85"/>`,
    )
    .join("");
  return `${arch}
    ${tile(580, 56, 150, 150, -3, paperTone[0], dice(150, 150, 6, p.accent), 0)}
    ${tile(1050, 60, 130, 150, 3, paperTone[2], array(130, 150, 3, 3, p.deep), 1)}
    ${tile(590, 222, 140, 150, 2, paperTone[3], array(140, 150, 2, 4, p.deep), 2)}
    ${big}
    ${tile(1046, 224, 140, 170, -3, paperTone[1], tenFrame(140, 170, 7, p.accent, line), 4)}
    ${tile(582, 392, 140, 150, -2, paperTone[5], dice(140, 150, 5, p.ink), 5)}
    ${tile(742, 446, 140, 100, 2, paperTone[0], `${groupsOf4(34, 50, 34, p.accent, p.deep)}${groupsOf4(104, 50, 34, p.accentB, p.deep)}`, 6)}
    ${tile(902, 440, 130, 110, -2, paperTone[4], array(130, 110, 3, 4, D), 7)}
    ${tile(1048, 414, 130, 130, 3, paperTone[2], dice(130, 130, 3, p.deep), 8)}
    ${confetti}`;
}

/** pre-unit-a: isometric supply depot; a pallet of 12 crates split into three equal pallets of 4. */
function supplyDepot(p) {
  const U = 36;
  const OX = 872;
  const OY = 192;
  const pt = (x, y, z) => [OX + (x - y) * U * 0.866, OY + (x + y) * U * 0.5 - z * U];
  const J = (a) => a.map((n) => Math.round(n)).join(" ");
  const poly = (pts, fill, extra = "") =>
    `<path d="M${pts.map((q) => q.map((n) => Math.round(n)).join(" ")).join(" L")}Z" fill="${fill}" ${extra}/>`;
  const box = (x, y, z, w, d, h, c, o = {}) => {
    const top = o.top ?? lighten(c, 0.22);
    const left = o.left ?? c;
    const right = o.right ?? darken(c, 0.22);
    const body = `${poly([pt(x, y, z + h), pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], top)}${poly([pt(x, y + d, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], left)}${poly([pt(x + w, y, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x + w, y, z + h)], right)}`;
    return o.stroke
      ? `<g stroke="${o.stroke}" stroke-width="1.5" stroke-linejoin="round">${body}</g>`
      : body;
  };
  const card = "#d09a58";
  const crate = (x, y, z) => {
    const w = 0.9;
    const tape = lighten(card, 0.45);
    return `${box(x, y, z, w, w, w, card, { stroke: darken(card, 0.35) })}${poly([pt(x + w * 0.4, y, z + w), pt(x + w * 0.6, y, z + w), pt(x + w * 0.6, y + w, z + w), pt(x + w * 0.4, y + w, z + w)], tape)}${poly([pt(x + w * 0.4, y + w, z + w), pt(x + w * 0.6, y + w, z + w), pt(x + w * 0.6, y + w, z + w * 0.62), pt(x + w * 0.4, y + w, z + w * 0.62)], tape)}`;
  };
  const wallC = mix(p.deep, "#ffffff", 0.1);
  const floorC = mix(p.deep, p.accent, 0.45);
  const W = 10;
  const D = 7;
  const WH = 3.4;
  let g = "";
  // walls
  g += poly([pt(0, 0, 0), pt(W, 0, 0), pt(W, 0, WH), pt(0, 0, WH)], wallC);
  g += poly([pt(0, 0, 0), pt(0, D, 0), pt(0, D, WH), pt(0, 0, WH)], darken(wallC, 0.28));
  // wall ribs
  for (let i = 1; i < W; i++)
    g += `<path d="M${J(pt(i, 0, 0))} L${pt(i, 0, WH).join(" ")}" stroke="${alpha("#fff", 0.05)}" stroke-width="3"/>`;
  g += `<path d="M${pt(0, 0, WH).join(" ")} L${pt(W, 0, WH).join(" ")}" stroke="${alpha(p.glow, 0.5)}" stroke-width="4"/>`;
  // floor slab
  g += poly([pt(0, 0, 0), pt(W, 0, 0), pt(W, D, 0), pt(0, D, 0)], floorC);
  g += poly([pt(0, D, 0), pt(W, D, 0), pt(W, D, -0.35), pt(0, D, -0.35)], darken(floorC, 0.35));
  g += poly([pt(W, 0, 0), pt(W, D, 0), pt(W, D, -0.35), pt(W, 0, -0.35)], darken(floorC, 0.5));
  for (let i = 1; i < D; i++)
    g += `<path d="M${pt(0, i, 0).join(" ")} L${pt(W, i, 0).join(" ")}" stroke="${alpha("#fff", 0.05)}" stroke-width="2"/>`;
  for (let i = 1; i < W; i++)
    g += `<path d="M${J(pt(i, 0, 0))} L${pt(i, D, 0).join(" ")}" stroke="${alpha("#fff", 0.05)}" stroke-width="2"/>`;
  // safety walkway line
  g += poly(
    [pt(0.2, 2.1, 0), pt(W - 0.2, 2.1, 0), pt(W - 0.2, 2.2, 0), pt(0.2, 2.2, 0)],
    alpha(p.glow, 0.55),
  );
  // loading dock door in the back-right wall
  g += poly([pt(7.6, 0, 0), pt(9.6, 0, 0), pt(9.6, 0, 2.3), pt(7.6, 0, 2.3)], darken(p.ink, 0.1));
  for (let k = 0; k < 7; k++)
    g += `<path d="M${pt(7.6, 0, 0.3 + k * 0.3).join(" ")} L${pt(9.6, 0, 0.3 + k * 0.3).join(" ")}" stroke="${alpha(p.accent, 0.7)}" stroke-width="3"/>`;
  g += poly([pt(7.6, 0, 2.3), pt(9.6, 0, 2.3), pt(9.6, 0, 2.5), pt(7.6, 0, 2.5)], p.glow);
  for (let k = 0; k < 10; k++) {
    const a = 7.6 + k * 0.2;
    g += poly(
      [pt(a, 0.0, 0), pt(a + 0.1, 0.0, 0), pt(a + 0.1, 0.55, 0), pt(a, 0.55, 0)],
      k % 2 ? p.ink : p.glow,
    );
  }
  // shelving along the back wall: planks + crates, uprights
  const bays = [
    [0.4, 3.0],
    [3.4, 6.0],
  ];
  const upright = (x, y) =>
    box(x, y, 0, 0.1, 0.1, 3.0, p.accent, {
      top: lighten(p.accent, 0.4),
      stroke: alpha("#000", 0.2),
    });
  g += upright(0.4, 0.0) + upright(3.0, 0.0) + upright(5.9, 0.0);
  const fill = [
    [3, 3, 2],
    [3, 2, 3],
  ];
  bays.forEach(([x0, x1], bi) => {
    [0, 1, 2].forEach((lv) => {
      const z = 0.55 + lv * 0.95;
      g += box(x0, 0.0, z - 0.1, x1 - x0, 1.0, 0.1, mix(p.accentB, p.glow, 0.25), {
        stroke: alpha("#000", 0.2),
      });
      const n = fill[bi][lv];
      for (let i = 0; i < n; i++)
        g += crate(x0 + 0.1 + i * 0.95 - (n === 2 ? -0.45 : 0) * 0, 0.05, z);
    });
  });
  g += upright(0.4, 0.9) + upright(3.0, 0.9) + upright(5.9, 0.9);
  // source pallet 2 x 3 x 2 = 12 crates
  const pal = (x, y, w, d) =>
    box(x, y, 0, w, d, 0.16, mix(p.accentB, p.glow, 0.35), { stroke: alpha("#000", 0.25) });
  const stack = (x, y, nx, ny, nz) => {
    let s2 = pal(x, y, nx * 0.95 + 0.1, ny * 0.95 + 0.1);
    for (let k = 0; k < nz; k++)
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++)
          s2 += crate(x + 0.08 + i * 0.95, y + 0.08 + j * 0.95, 0.16 + k * 0.9);
    return s2;
  };
  // split bus on the floor: one line from the source to three branches, one per equal pallet
  const bus = [pt(2.8, 5.0, 0.02), pt(9.3, 5.0, 0.02)];
  g += `<path d="M${J(bus[0])} L${J(bus[1])}" stroke="${p.glow}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`;
  [4.1, 6.4, 8.7].forEach((bx) => {
    const a = pt(bx, 4.95, 0.02);
    const b = pt(bx, 4.7, 0.02);
    g += `<path d="M${J(a)} L${J(b)}" stroke="${p.glow}" stroke-width="3" stroke-linecap="round"/><path d="M${J([b[0] - 9, b[1] + 3])} L${J([b[0] + 9, b[1] + 3])} L${J([b[0], b[1] - 12])}Z" fill="${p.glow}"/>`;
  });
  g += stack(0.4, 3.4, 2, 3, 2);
  g += stack(3.2, 2.4, 2, 2, 1) + stack(5.5, 2.4, 2, 2, 1) + stack(7.8, 2.4, 2, 2, 1);
  // hanging lamps
  const lamps = [
    [2.5, 2],
    [6.5, 2.2],
  ].map(([x, y]) => {
    const t = pt(x, y, WH + 0.6);
    const b = pt(x, y, WH - 0.1);
    return `<path d="M${J(t)} L${J(b)}" stroke="${alpha("#fff", 0.3)}" stroke-width="2"/><path d="M${J([b[0] - 18, b[1] + 10])} L${J([b[0] + 18, b[1] + 10])} L${J([b[0] + 10, b[1]])} L${J([b[0] - 10, b[1]])}Z" fill="${p.glow}"/><ellipse cx="${Math.round(b[0])}" cy="${Math.round(b[1] + 12)}" rx="12" ry="4" fill="${lighten(p.glow, 0.6)}"/>`;
  });
  const halo = `<ellipse cx="${OX}" cy="${OY + 190}" rx="340" ry="190" fill="${alpha(p.glow, 0.05)}"/>`;
  return `${halo}${g}${lamps.join("")}`;
}

/** unit-1-a: top-down block party plan; six round tables with six chairs each, bunting, string lights, a stage. */
function blockParty(p) {
  const road = mix(p.tint, p.deep, 0.2);
  const walk = lighten(p.tint, 0.5);
  const leaf = "#5aa469";
  const cloths = [p.accent, p.accentB, mix(p.glow, p.accent, 0.25)];
  let g = `<rect x="556" y="30" width="660" height="540" rx="26" fill="${walk}"/>
    <rect x="556" y="112" width="660" height="376" fill="${road}"/>
    <path d="M556 300 L1076 300" stroke="${alpha("#fff", 0.7)}" stroke-width="5" stroke-dasharray="34 26"/>
    <path d="M556 112 L1216 112 M556 488 L1216 488" stroke="${alpha(p.ink, 0.25)}" stroke-width="4"/>`;
  // rooftops along the top and bottom edges
  const roofs = [
    [600, 38, 80, 60],
    [700, 38, 110, 60],
    [830, 38, 90, 60],
    [940, 38, 120, 60],
    [600, 502, 100, 56],
    [720, 502, 80, 56],
    [820, 502, 120, 56],
    [960, 502, 100, 56],
  ];
  roofs.forEach(([x, y, w, h], i) => {
    const c = [
      mix(p.deep, p.tint, 0.45),
      mix(p.accentB, p.tint, 0.55),
      mix(p.accent, p.tint, 0.55),
      mix(p.glow, p.tint, 0.3),
    ][i % 4];
    g += `<rect x="${x + 4}" y="${y + 6}" width="${w}" height="${h}" rx="6" fill="${alpha(p.ink, 0.14)}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c}"/><path d="M${x} ${y + h / 2} L${x + w} ${y + h / 2}" stroke="${alpha("#fff", 0.45)}" stroke-width="3"/>`;
  });
  [
    [1100, 66],
    [1160, 524],
  ].forEach(
    ([x, y]) =>
      (g += `<circle cx="${x + 4}" cy="${y + 5}" r="22" fill="${alpha(p.ink, 0.15)}"/><circle cx="${x}" cy="${y}" r="22" fill="${leaf}"/><circle cx="${x - 6}" cy="${y - 6}" r="11" fill="${lighten(leaf, 0.3)}"/>`),
  );
  // string lights between the table columns
  [760, 900, 1040].forEach((x, i) => {
    const bow = i % 2 ? 14 : -14;
    g += `<path d="M${x} 112 Q${x + bow} 300 ${x} 488" fill="none" stroke="${alpha(p.ink, 0.28)}" stroke-width="2"/>`;
    for (let k = 1; k < 17; k++) {
      const t = k / 17;
      const px = x + 2 * bow * t * (1 - t) * 1;
      const py = 112 + 376 * t;
      g += `<circle cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" r="9" fill="${alpha(p.glow, 0.35)}"/><circle cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" r="4" fill="${k % 2 ? p.glow : lighten(p.glow, 0.5)}"/>`;
    }
  });
  // tables: 2 rows x 3 columns, six chairs each
  [
    [690, 225],
    [830, 225],
    [970, 225],
    [690, 375],
    [830, 375],
    [970, 375],
  ].forEach(([cx, cy], i) => {
    const cloth = cloths[i % 3];
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 + 0.5;
      const x = cx + Math.cos(a) * 50;
      const y = cy + Math.sin(a) * 50;
      g += `<circle cx="${(x + 2).toFixed(0)}" cy="${(y + 3).toFixed(0)}" r="10" fill="${alpha(p.ink, 0.18)}"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="10" fill="${mix(p.ink, p.deep, 0.5)}"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="5" fill="${alpha("#fff", 0.25)}"/>`;
    }
    g += `<circle cx="${cx + 4}" cy="${cy + 6}" r="34" fill="${alpha(p.ink, 0.22)}"/><circle cx="${cx}" cy="${cy}" r="34" fill="${cloth}"/><circle cx="${cx}" cy="${cy}" r="24" fill="none" stroke="${alpha("#fff", 0.55)}" stroke-width="3" stroke-dasharray="4 7"/><circle cx="${cx}" cy="${cy}" r="9" fill="${lighten(cloth, 0.55)}"/><circle cx="${cx - 2}" cy="${cy - 2}" r="4" fill="${p.glow}"/>`;
  });
  // stage
  g += `<g transform="translate(-18 0)"><rect x="1088" y="170" width="116" height="260" rx="8" fill="${alpha(p.ink, 0.25)}" transform="translate(6 8)"/>
    <rect x="1088" y="170" width="116" height="260" rx="8" fill="${mix(p.deep, p.ink, 0.25)}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<path d="M${1088} ${184 + k * 26} L1204 ${184 + k * 26}" stroke="${alpha("#fff", 0.1)}" stroke-width="2"/>`).join("")}
    <rect x="1170" y="170" width="34" height="260" rx="8" fill="${p.accent}"/>
    ${Array.from({ length: 8 }, (_, k) => `<circle cx="1187" cy="${192 + k * 32}" r="12" fill="${k % 2 ? lighten(p.accent, 0.25) : darken(p.accent, 0.12)}"/>`).join("")}
    <circle cx="1128" cy="300" r="52" fill="${alpha(p.glow, 0.28)}"/><circle cx="1128" cy="300" r="30" fill="${alpha(p.glow, 0.35)}"/>
    <rect x="1100" y="240" width="8" height="8" rx="4" fill="${p.glow}"/><circle cx="1124" cy="300" r="7" fill="${lighten(p.glow, 0.5)}"/>
    <rect x="1070" y="262" width="20" height="76" rx="3" fill="${alpha(p.ink, 0.2)}" transform="translate(3 4)"/>
    ${[-1, 0, 1].map((k) => `<rect x="1068" y="${288 + k * 26}" width="18" height="20" rx="3" fill="${lighten(p.deep, 0.1)}"/>`).join("")}
    </g>`;
  // bunting along both edges
  const bunting = (y, dir) => {
    let b = `<path d="M556 ${y} Q870 ${y + dir * 26} 1216 ${y}" fill="none" stroke="${alpha(p.ink, 0.4)}" stroke-width="2.5"/>`;
    const cs = [p.accent, p.glow, p.accentB, lighten(p.accent, 0.4)];
    for (let k = 0; k < 20; k++) {
      const t = (k + 0.5) / 20;
      const x = 556 + 660 * t;
      const yy = y + dir * 52 * t * (1 - t);
      b += `<path d="M${(x - 11).toFixed(0)} ${yy.toFixed(0)} L${(x + 11).toFixed(0)} ${yy.toFixed(0)} L${x.toFixed(0)} ${(yy + dir * 24).toFixed(0)}Z" fill="${cs[k % 4]}"/>`;
    }
    return b;
  };
  g += bunting(112, 1) + bunting(488, -1);
  return g;
}

/** unit-1-b: blueprint of a robot built from parts, each part tied to a plain price tag (coins show the price). */
function botBlueprint(p) {
  const L = p.glow;
  const fillA = alpha(L, 0.08);
  const warm = lighten(p.accentB, 0.62);
  const grid = (x0, y0, x1, y1, step, c, w) => {
    let d = "";
    for (let x = x0; x <= x1; x += step) d += `M${x} ${y0} L${x} ${y1}`;
    for (let y = y0; y <= y1; y += step) d += `M${x0} ${y} L${x1} ${y}`;
    return `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none"/>`;
  };
  const part = (shape) =>
    `<g fill="${fillA}" stroke="${L}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${shape}</g>`;
  const rect = (x, y, w, h, r = 10) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const sheet = `<rect x="560" y="30" width="624" height="540" rx="18" fill="${alpha(p.ink, 0.45)}" stroke="${alpha(L, 0.4)}" stroke-width="2"/>${grid(580, 50, 1164, 550, 40, alpha(L, 0.1), 1.5)}${grid(600, 50, 1160, 550, 200, alpha(L, 0.18), 2)}`;
  const corners = [
    [560, 30, 1, 1],
    [1184, 30, -1, 1],
    [560, 570, 1, -1],
    [1184, 570, -1, -1],
  ]
    .map(
      ([x, y, a, b]) =>
        `<path d="M${x + 26 * a} ${y} L${x} ${y} L${x} ${y + 26 * b}" stroke="${L}" stroke-width="4" fill="none"/>`,
    )
    .join("");
  const bot = `<g transform="translate(790 308)">
    <path d="M0 -250 L0 -214" stroke="${L}" stroke-width="3"/><circle cx="0" cy="-262" r="14" fill="${alpha(p.glow, 0.5)}" stroke="${L}" stroke-width="3"/>
    ${part(rect(-72, -214, 144, 108, 24))}
    ${part(`<circle cx="-30" cy="-172" r="17"/><circle cx="30" cy="-172" r="17"/>`)}
    <circle cx="-30" cy="-172" r="6" fill="${L}"/><circle cx="30" cy="-172" r="6" fill="${L}"/>
    <path d="M-34 -134 L34 -134 M-34 -124 L34 -124 M-34 -144 L34 -144" stroke="${L}" stroke-width="3" stroke-linecap="round"/>
    ${part(rect(-18, -106, 36, 22, 4))}
    ${part(rect(-100, -84, 200, 170, 20))}
    ${part(`<circle cx="0" cy="-10" r="42"/>`)}
    <path d="M0 -10 L24 -26 M0 -10 L0 -44" stroke="${L}" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-10" r="5" fill="${L}"/>
    <path d="M-80 52 L-30 52 M30 52 L80 52 M-80 68 L-44 68 M44 68 L80 68" stroke="${alpha(L, 0.6)}" stroke-width="3" stroke-linecap="round"/>
    ${part(`<circle cx="-118" cy="-52" r="20"/><circle cx="118" cy="-52" r="20"/>`)}
    ${part(rect(-146, -34, 36, 112, 14) + rect(110, -34, 36, 112, 14))}
    ${part(`<path d="M-148 78 L-108 78 L-108 106 L-120 106 L-120 92 L-136 92 L-136 106 L-148 106Z"/><path d="M108 78 L148 78 L148 106 L136 106 L136 92 L120 92 L120 106 L108 106Z"/>`)}
    ${part(rect(-78, 86, 52, 112, 10) + rect(26, 86, 52, 112, 10))}
    ${part(`<path d="M-90 198 L-14 198 L-6 226 L-98 226Z"/><path d="M14 198 L90 198 L98 226 L6 226Z"/>`)}
    <g stroke="${L}" stroke-width="2" fill="none" stroke-dasharray="6 7" opacity=".7"><path d="M-170 -214 L-170 226"/><path d="M-100 250 L100 250"/></g>
    <g stroke="${L}" stroke-width="3"><path d="M-178 -214 L-162 -214 M-178 226 L-162 226"/><path d="M-100 242 L-100 258 M100 242 L100 258"/></g>
  </g>`;
  const coins = (cx, cy, n) =>
    Array.from(
      { length: n },
      (_, i) =>
        `<circle cx="${cx + (i % 3) * 18}" cy="${cy + Math.floor(i / 3) * 18}" r="6" fill="${warm}" stroke="${darken(warm, 0.3)}" stroke-width="1.5"/>`,
    ).join("");
  const tag = (
    x,
    y,
    w,
    h,
    n,
    tx,
    ty,
  ) => `<path d="M${tx} ${ty} L${x} ${y + h / 2}" stroke="${alpha(L, 0.7)}" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="6" fill="${L}"/>
    <path d="M${x} ${y + h / 2} L${x + 20} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x + 20} ${y + h}Z" fill="${alpha(p.ink, 0.7)}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><circle cx="${x + 20}" cy="${y + h / 2}" r="5" fill="none" stroke="${L}" stroke-width="2.5"/>${coins(x + 40, y + h / 2 - (n > 3 ? 9 : 0), n)}`;
  const tags = [
    tag(1010, 70, 150, 50, 3, 862, 150),
    tag(1020, 160, 140, 62, 6, 832, 298),
    tag(1000, 266, 160, 50, 2, 936, 256),
    tag(1020, 356, 140, 50, 3, 920, 396),
    tag(1000, 450, 160, 62, 4, 870, 496),
  ];
  return `${sheet}${corners}${bot}${tags.join("")}`;
}

/** unit-1-c: a space station with 12 supply pods in three equal clusters of 4, orbit rings, a planet. */
function spaceStation(p) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 70 }, () => {
    const x = Math.round(rnd() * 1200);
    const y = Math.round(rnd() * 600);
    const r = (0.8 + rnd() * 1.8).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${rnd() > 0.8 ? p.glow : "#fff"}" opacity="${(0.25 + rnd() * 0.6).toFixed(2)}"/>`;
  }).join("");
  const metal = mix(p.paper, p.deep, 0.25);
  const planet = `<defs><radialGradient id="pl" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="${mix(p.glow, p.accentB, 0.4)}"/><stop offset=".55" stop-color="${p.accentB}"/><stop offset="1" stop-color="${darken(p.accentB, 0.6)}"/></radialGradient></defs>
    <circle cx="1130" cy="720" r="320" fill="${alpha(p.glow, 0.12)}"/><circle cx="1130" cy="720" r="290" fill="url(#pl)"/>
    <path d="M900 560 Q1100 500 1190 540" stroke="${alpha("#fff", 0.2)}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M880 610 Q1080 560 1190 600" stroke="${alpha("#000", 0.18)}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  const rings = `<g transform="rotate(-14 880 290)" fill="none"><ellipse cx="880" cy="290" rx="330" ry="124" stroke="${alpha(p.glow, 0.4)}" stroke-width="2.5" stroke-dasharray="3 12" stroke-linecap="round"/><ellipse cx="880" cy="290" rx="250" ry="90" stroke="${alpha("#fff", 0.16)}" stroke-width="2"/></g>`;
  const panel = (x) =>
    `<g><rect x="${x}" y="236" width="58" height="128" rx="3" fill="${mix(p.accent, p.ink, 0.45)}" stroke="${lighten(p.accent, 0.4)}" stroke-width="2"/>${[1, 2, 3].map((k) => `<path d="M${x} ${236 + k * 32} L${x + 58} ${236 + k * 32}" stroke="${alpha("#fff", 0.28)}" stroke-width="1.5"/>`).join("")}<path d="M${x + 29} 236 L${x + 29} 364" stroke="${alpha("#fff", 0.28)}" stroke-width="1.5"/><path d="M${x + 4} ${240} L${x + 22} 240 L${x + 6} 300Z" fill="${alpha("#fff", 0.16)}"/></g>`;
  const station = `<g transform="rotate(-10 900 300)">
    <rect x="730" y="294" width="340" height="12" rx="6" fill="${darken(metal, 0.3)}"/>
    ${panel(740)}${panel(802)}${panel(940)}${panel(1002)}
    <rect x="876" y="196" width="48" height="208" rx="22" fill="${metal}"/><rect x="876" y="196" width="16" height="208" rx="8" fill="${alpha("#fff", 0.35)}"/>
    <path d="M876 232 L924 232 M876 368 L924 368" stroke="${darken(metal, 0.3)}" stroke-width="4"/>
    <ellipse cx="900" cy="300" rx="96" ry="28" fill="none" stroke="${darken(metal, 0.35)}" stroke-width="14"/>
    <ellipse cx="900" cy="300" rx="96" ry="28" fill="none" stroke="${metal}" stroke-width="9" stroke-dasharray="3 0"/>
    <path d="M804 300 A96 28 0 0 0 996 300" fill="none" stroke="${lighten(metal, 0.25)}" stroke-width="4"/>
    <circle cx="900" cy="300" r="34" fill="${lighten(metal, 0.15)}"/><circle cx="900" cy="300" r="24" fill="${mix(p.accent, p.ink, 0.4)}"/><circle cx="900" cy="300" r="24" fill="none" stroke="${p.glow}" stroke-width="3"/><circle cx="892" cy="292" r="7" fill="${alpha("#fff", 0.6)}"/>
    <path d="M900 196 L900 166" stroke="${metal}" stroke-width="4"/><path d="M878 160 Q900 186 922 160 Z" fill="${lighten(metal, 0.3)}"/><circle cx="900" cy="164" r="4" fill="${p.glow}"/>
    <rect x="884" y="396" width="32" height="14" rx="4" fill="${p.accentB}"/><circle cx="900" cy="418" r="6" fill="${alpha(p.glow, 0.7)}"/>
  </g>`;
  const pod = (x, y) =>
    `<rect x="${x}" y="${y}" width="44" height="26" rx="12" fill="${metal}"/><rect x="${x}" y="${y}" width="44" height="9" rx="4.5" fill="${alpha("#fff", 0.3)}"/><rect x="${x + 28}" y="${y}" width="9" height="26" fill="${p.glow}" opacity=".85"/><rect x="${x + 7}" y="${y + 9}" width="16" height="9" rx="4.5" fill="${mix(p.accent, p.ink, 0.35)}"/><rect x="${x + 10}" y="${y + 11}" width="6" height="2.5" rx="1.2" fill="${alpha("#fff", 0.6)}"/>`;
  const cluster = (cx, cy) =>
    `<circle cx="${cx}" cy="${cy}" r="62" fill="${alpha(p.glow, 0.06)}" stroke="${alpha(p.glow, 0.55)}" stroke-width="2.5" stroke-dasharray="2 9" stroke-linecap="round"/>${pod(cx - 50, cy - 33)}${pod(cx + 6, cy - 33)}${pod(cx - 50, cy + 7)}${pod(cx + 6, cy + 7)}`;
  const clusters = cluster(1030, 128) + cluster(790, 482) + cluster(1086, 392);
  const tethers = `<g stroke="${alpha(p.glow, 0.35)}" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"><path d="M1000 184 L940 250"/><path d="M810 430 L860 350"/><path d="M1034 366 L968 330"/></g>`;
  return `${stars}${planet}${rings}${tethers}${station}${clusters}`;
}

/** unit-2-a: evidence corkboard; index cards with dot plots, red string between pins, a magnifying glass. */
function evidenceBoard(p) {
  const cork = mix("#c8955a", p.tint, 0.2);
  const wood = "#8a5a34";
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const specks = Array.from(
    { length: 90 },
    () =>
      `<circle cx="${Math.round(586 + rnd() * 580)}" cy="${Math.round(56 + rnd() * 488)}" r="${(1 + rnd() * 2.4).toFixed(1)}" fill="${rnd() > 0.5 ? darken(cork, 0.18) : lighten(cork, 0.25)}" opacity=".6"/>`,
  ).join("");
  const board = `<rect x="574" y="38" width="606" height="524" rx="16" fill="${alpha(p.ink, 0.2)}" transform="translate(7 9)"/><rect x="574" y="38" width="606" height="524" rx="16" fill="${wood}"/><rect x="574" y="38" width="606" height="10" rx="5" fill="${lighten(wood, 0.25)}"/><rect x="588" y="52" width="578" height="496" rx="8" fill="${cork}"/>${specks}`;
  const dotplot = (w, h, counts, c) => {
    const base = h - 26;
    const step = (w - 36) / (counts.length - 1 || 1);
    let d = `<path d="M16 ${base} L${w - 16} ${base}" stroke="${p.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
    counts.forEach((n, i) => {
      const x = 18 + i * step;
      d += `<path d="M${x} ${base - 4} L${x} ${base + 5}" stroke="${p.ink}" stroke-width="2"/>`;
      for (let k = 0; k < n; k++)
        d += `<circle cx="${x.toFixed(0)}" cy="${base - 12 - k * 13}" r="5.5" fill="${c}"/>`;
    });
    return d;
  };
  const cards = [
    [600, 74, 180, 132, -3, [2, 4, 6, 3, 1], p.accentB],
    [806, 62, 168, 132, 2, [1, 3, 5, 4, 2, 1], p.accent],
    [992, 78, 164, 132, -2, [4, 6, 3, 2], p.accentB],
    [622, 296, 176, 132, 2, [1, 2, 4, 5, 3], p.accent],
    [992, 290, 164, 132, -3, [3, 5, 5, 2, 1], p.accentB],
  ];
  const note = [826, 310, 118, 118, -4];
  let g = board;
  const pins = [];
  const cardMarkup = cards.map(([x, y, w, h, rot, counts, c]) => {
    pins.push([x + w / 2 + (rot > 0 ? 3 : -3), y + 12]);
    return `<g transform="translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2})"><rect x="5" y="7" width="${w}" height="${h}" rx="4" fill="${alpha(p.ink, 0.22)}"/><rect width="${w}" height="${h}" rx="4" fill="${p.paper}"/><path d="M0 24 L${w} 24" stroke="${alpha(p.accent, 0.4)}" stroke-width="2"/>${dotplot(w, h, counts, c)}</g>`;
  });
  const [nx, ny, nw, nh, nr] = note;
  pins.splice(3, 0, [nx + nw / 2, ny + 12]);
  const noteMarkup = `<g transform="translate(${nx} ${ny}) rotate(${nr} ${nw / 2} ${nh / 2})"><rect x="5" y="7" width="${nw}" height="${nh}" fill="${alpha(p.ink, 0.22)}"/><rect width="${nw}" height="${nh}" fill="${p.glow}"/><path d="M0 ${nh - 24} L${nw} ${nh - 24} L${nw} ${nh} L${nw - 24} ${nh}Z" fill="${darken(p.glow, 0.1)}"/>${[0, 1, 2, 3].map((k) => `<circle cx="${28 + k * 21}" cy="${62 - (k % 2) * 14}" r="6" fill="${p.ink}"/>`).join("")}<path d="M16 86 L${nw - 16} 86" stroke="${alpha(p.ink, 0.5)}" stroke-width="2.5"/></g>`;
  const [a, b, c2, n, d, e] = [pins[0], pins[1], pins[2], pins[3], pins[4], pins[5]];
  const route = [a, b, c2, e, n, d, a];
  const strings = `<path d="M${route.map((q) => q.join(" ")).join(" L")}" fill="none" stroke="${alpha(p.ink, 0.25)}" stroke-width="5" stroke-linejoin="round" transform="translate(3 5)"/><path d="M${route.map((q) => q.join(" ")).join(" L")}" fill="none" stroke="${p.accent}" stroke-width="3.5" stroke-linejoin="round"/>`;
  const pinMarkup = pins
    .map(
      ([x, y], i) =>
        `<circle cx="${x + 2}" cy="${y + 4}" r="9" fill="${alpha(p.ink, 0.3)}"/><circle cx="${x}" cy="${y}" r="9" fill="${[p.accent, p.accentB, darken(p.glow, 0.15)][i % 3]}"/><circle cx="${x - 3}" cy="${y - 3}" r="3" fill="${alpha("#fff", 0.7)}"/>`,
    )
    .join("");
  const lens = `<g transform="rotate(-38 1040 470)"><rect x="1030" y="520" width="20" height="76" rx="10" fill="${p.ink}"/><rect x="1034" y="526" width="6" height="64" rx="3" fill="${alpha("#fff", 0.2)}"/><rect x="1026" y="512" width="28" height="14" rx="5" fill="${p.deep}"/></g>
    <circle cx="1046" cy="478" r="70" fill="${alpha(p.ink, 0.22)}" transform="translate(8 10)"/>
    <circle cx="1040" cy="470" r="66" fill="${alpha(p.paper, 0.78)}"/>
    <clipPath id="lensClip"><circle cx="1040" cy="470" r="58"/></clipPath>
    <g clip-path="url(#lensClip)"><path d="M982 498 L1098 498" stroke="${p.ink}" stroke-width="4" stroke-linecap="round"/>${[
      [1004, 2],
      [1040, 4],
      [1076, 3],
    ]
      .map(([x, n]) =>
        Array.from(
          { length: n },
          (_, k) => `<circle cx="${x}" cy="${480 - k * 21}" r="9.5" fill="${p.accent}"/>`,
        ).join(""),
      )
      .join("")}<path d="M990 424 Q1030 410 1070 420 L1040 440Z" fill="${alpha("#fff", 0.55)}"/></g>
    <circle cx="1040" cy="470" r="66" fill="none" stroke="${p.ink}" stroke-width="10"/><circle cx="1040" cy="470" r="66" fill="none" stroke="${alpha("#fff", 0.18)}" stroke-width="3"/>`;
  return `${g}${cardMarkup.slice(0, 3).join("")}${noteMarkup}${cardMarkup.slice(3).join("")}${strings}${pinMarkup}${lens}`;
}

/** unit-2-b: weather map with isobar contours, sun / cloud / rain symbols, and a temperature line chart. */
function weatherDesk(p) {
  const L = lighten(p.deep, 0.55);
  const blob = (cx, cy, r, ph, k) => {
    const pts = Array.from({ length: 56 }, (_, i) => {
      const a = (i / 56) * Math.PI * 2;
      const rr = r * (1 + 0.13 * Math.sin(2 * a + ph) + 0.07 * Math.sin(3 * a + ph * 2));
      return `${Math.round(cx + Math.cos(a) * rr * 1.45)} ${Math.round(cy + Math.sin(a) * rr)}`;
    });
    return `<path d="M${pts.join(" L")}Z" fill="none" stroke="${k}" stroke-width="2.5" stroke-linejoin="round"/>`;
  };
  const cloudPath = (x, y, s2) =>
    `M${x - 34 * s2} ${y + 16 * s2} A${16 * s2} ${16 * s2} 0 0 1 ${x - 26 * s2} ${y - 14 * s2} A${22 * s2} ${22 * s2} 0 0 1 ${x + 14 * s2} ${y - 22 * s2} A${20 * s2} ${20 * s2} 0 0 1 ${x + 38 * s2} ${y + 16 * s2}Z`;
  const cloud = (x, y, s2, fill) =>
    `<path d="${cloudPath(x, y, s2)}" fill="${fill}" stroke="${alpha("#fff", 0.55)}" stroke-width="3" stroke-linejoin="round"/>`;
  const sun = (x, y) =>
    `<g>${Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return `<path d="M${Math.round(x + Math.cos(a) * 34)} ${Math.round(y + Math.sin(a) * 34)} L${Math.round(x + Math.cos(a) * 48)} ${Math.round(y + Math.sin(a) * 48)}" stroke="${p.glow}" stroke-width="5" stroke-linecap="round"/>`;
    }).join(
      "",
    )}<circle cx="${x}" cy="${y}" r="24" fill="${p.glow}"/><circle cx="${x - 7}" cy="${y - 7}" r="8" fill="${alpha("#fff", 0.5)}"/></g>`;
  const rain = (x, y) =>
    [-20, 0, 20]
      .map(
        (d, i) =>
          `<path d="M${x + d} ${y + 28 + i * 3} L${x + d - 7} ${y + 46 + i * 3}" stroke="${lighten(p.accent, 0.5)}" stroke-width="4" stroke-linecap="round"/>`,
      )
      .join("");
  const lows = [0.6, 1.1, 1.6, 2.1, 2.6, 3.1]
    .map((k, i) => blob(840, 168, 24 + i * 26, k, alpha(L, 0.65 - i * 0.07)))
    .join("");
  const highs = [0.4, 0.9, 1.4, 1.9]
    .map((k, i) => blob(1090, 250, 22 + i * 24, k + 2, alpha(p.glow, 0.5 - i * 0.08)))
    .join("");
  const panelMap = `<defs><clipPath id="mapC"><rect x="580" y="36" width="604" height="300" rx="18"/></clipPath></defs>
    <rect x="580" y="36" width="604" height="300" rx="18" fill="${alpha(p.ink, 0.45)}" stroke="${alpha(L, 0.4)}" stroke-width="2"/>
    <g clip-path="url(#mapC)"><path d="M580 300 Q760 240 900 290 T1184 220 L1184 336 L580 336Z" fill="${alpha(p.accent, 0.3)}"/><path d="M580 300 Q760 240 900 290 T1184 220" fill="none" stroke="${alpha(L, 0.4)}" stroke-width="2.5"/>${lows}${highs}
    <path d="M700 36 Q760 140 700 230 Q660 290 700 336" fill="none" stroke="${p.glow}" stroke-width="3" stroke-dasharray="3 8" stroke-linecap="round" opacity=".8"/>
    ${[
      [722, 90],
      [726, 150],
      [715, 215],
    ]
      .map(([x, y]) => `<path d="M${x} ${y} l16 10 l-16 10z" fill="${lighten(p.accent, 0.5)}"/>`)
      .join("")}</g>
    ${sun(1110, 108)}
    ${cloud(980, 78, 1, alpha("#fff", 0.9))}
    ${cloud(780, 252, 1.15, lighten(p.deep, 0.35))}${rain(780, 252)}
    ${cloud(1050, 300, 0.7, alpha("#fff", 0.75))}`;
  const pts = [14, 17, 15, 21, 24, 22, 27].map((t, i) => [630 + i * 84, 540 - (t - 10) * 8]);
  const line = pts.map(([x, y]) => `${x} ${y}`).join(" L");
  const panelChart = `<rect x="580" y="352" width="604" height="214" rx="18" fill="${alpha(p.ink, 0.45)}" stroke="${alpha(L, 0.4)}" stroke-width="2"/>
    ${[0, 1, 2, 3].map((k) => `<path d="M610 ${390 + k * 44} L1156 ${390 + k * 44}" stroke="${alpha(L, 0.2)}" stroke-width="2"/>`).join("")}
    ${pts.map(([x]) => `<path d="M${x} 380 L${x} 548" stroke="${alpha(L, 0.1)}" stroke-width="2"/>`).join("")}
    <path d="M610 380 L610 548 L1156 548" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>
    <path d="M${line} L${pts[6][0]} 548 L${pts[0][0]} 548Z" fill="${alpha(p.glow, 0.14)}"/>
    <path d="M${line}" fill="none" stroke="${p.glow}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${p.ink}" stroke="${p.glow}" stroke-width="4"/>`).join("")}`;
  return `${panelMap}${panelChart}`;
}

/** unit-3-b: top-down pitch with 6 yellow : 4 white players (3:2), and a scouting clipboard showing the same ratio in bars. */
function scoutPitch(p) {
  const g1 = mix(p.deep, p.accent, 0.35);
  const g2 = mix(p.deep, p.accent, 0.12);
  const X0 = 586;
  const Y0 = 60;
  const W = 480;
  const H = 340;
  const line = alpha("#fff", 0.8);
  const stripes = Array.from(
    { length: 8 },
    (_, i) =>
      `<rect x="${X0 + (i * W) / 8}" y="${Y0}" width="${W / 8}" height="${H}" fill="${i % 2 ? g1 : g2}"/>`,
  ).join("");
  const cy = Y0 + H / 2;
  const cx = X0 + W / 2;
  const marks = `<g fill="none" stroke="${line}" stroke-width="3.5" stroke-linejoin="round">
    <rect x="${X0}" y="${Y0}" width="${W}" height="${H}"/>
    <path d="M${cx} ${Y0} L${cx} ${Y0 + H}"/><circle cx="${cx}" cy="${cy}" r="52"/>
    <rect x="${X0}" y="${cy - 88}" width="92" height="176"/><rect x="${X0}" y="${cy - 40}" width="34" height="80"/>
    <rect x="${X0 + W - 92}" y="${cy - 88}" width="92" height="176"/><rect x="${X0 + W - 34}" y="${cy - 40}" width="34" height="80"/>
    <path d="M${X0 + 92} ${cy - 36} A50 50 0 0 1 ${X0 + 92} ${cy + 36}"/><path d="M${X0 + W - 92} ${cy - 36} A50 50 0 0 0 ${X0 + W - 92} ${cy + 36}"/>
    <path d="M${X0} ${Y0 + 14} A14 14 0 0 0 ${X0 + 14} ${Y0}"/><path d="M${X0 + W - 14} ${Y0} A14 14 0 0 0 ${X0 + W} ${Y0 + 14}"/><path d="M${X0} ${Y0 + H - 14} A14 14 0 0 1 ${X0 + 14} ${Y0 + H}"/><path d="M${X0 + W - 14} ${Y0 + H} A14 14 0 0 1 ${X0 + W} ${Y0 + H - 14}"/></g>
    <circle cx="${cx}" cy="${cy}" r="5" fill="${line}"/>
    <rect x="${X0 - 14}" y="${cy - 28}" width="14" height="56" fill="none" stroke="${alpha("#fff", 0.55)}" stroke-width="3"/><rect x="${X0 + W}" y="${cy - 28}" width="14" height="56" fill="none" stroke="${alpha("#fff", 0.55)}" stroke-width="3"/>`;
  const pitch = `<rect x="${X0 - 8}" y="${Y0 - 8}" width="${W + 16}" height="${H + 16}" rx="10" fill="${alpha("#000", 0.3)}" transform="translate(6 8)"/><rect x="${X0 - 8}" y="${Y0 - 8}" width="${W + 16}" height="${H + 16}" rx="10" fill="${darken(p.deep, 0.15)}"/>${stripes}${marks}`;
  const A = [
    [680, 140],
    [750, 230],
    [690, 320],
    [840, 150],
    [870, 290],
    [960, 230],
  ];
  const B = [
    [790, 340],
    [900, 105],
    [945, 345],
    [1012, 150],
  ];
  const player = (x, y, c, ring) =>
    `<ellipse cx="${x + 3}" cy="${y + 7}" rx="17" ry="9" fill="${alpha("#000", 0.3)}"/><circle cx="${x}" cy="${y}" r="16" fill="${c}" stroke="${ring}" stroke-width="3.5"/><circle cx="${x - 5}" cy="${y - 5}" r="5" fill="${alpha("#fff", 0.55)}"/>`;
  const yel = p.glow;
  const wht = p.paper;
  const players =
    A.map(([x, y]) => player(x, y, yel, darken(yel, 0.35))).join("") +
    B.map(([x, y]) => player(x, y, wht, darken(p.deep, 0.1))).join("");
  const moves = `<path d="M750 230 Q800 180 840 150" fill="none" stroke="${alpha("#fff", 0.7)}" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/><path d="M870 290 Q920 270 960 230" fill="none" stroke="${alpha("#fff", 0.7)}" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>`;
  const ball = `<circle cx="810" cy="262" r="9" fill="#fff" stroke="${p.ink}" stroke-width="2"/><path d="M806 259 l6 -2 l3 6 l-6 4z" fill="${p.ink}"/>`;
  const bar = (y, n, c) =>
    `<path d="M0 ${y + 18} L0 ${y - 2}" stroke="none"/>${Array.from({ length: n }, (_, i) => `<rect x="${18 + i * 52}" y="${y}" width="46" height="26" rx="4" fill="${c}" stroke="${alpha(p.ink, 0.55)}" stroke-width="2.5"/>`).join("")}`;
  const clip = `<g transform="translate(209.6 78.4) scale(.84)"><g transform="rotate(5 1040 450)"><rect x="936" y="318" width="210" height="272" rx="14" fill="${alpha("#000", 0.3)}" transform="translate(7 9)"/>
    <rect x="936" y="318" width="210" height="272" rx="14" fill="#a9754a"/><rect x="936" y="318" width="210" height="14" rx="7" fill="${alpha("#fff", 0.2)}"/>
    <rect x="952" y="346" width="178" height="228" rx="6" fill="${p.paper}"/>
    <g transform="translate(952 346)">
      ${bar(26, 3, yel)}${bar(66, 2, wht)}
      <path d="M18 112 L160 112" stroke="${alpha(p.ink, 0.3)}" stroke-width="2"/>
      ${[
        [18, 40],
        [50, 66],
        [82, 28],
        [114, 52],
        [146, 76],
      ]
        .map(
          ([x, h], i) =>
            `<rect x="${x}" y="${216 - h}" width="22" height="${h}" rx="3" fill="${i % 2 ? p.accentB : p.accent}"/>`,
        )
        .join("")}
      <path d="M12 216 L168 216" stroke="${p.ink}" stroke-width="3" stroke-linecap="round"/>
    </g>
    <rect x="996" y="306" width="90" height="34" rx="8" fill="#b9c2c8"/><rect x="1008" y="296" width="66" height="22" rx="8" fill="#d4dbe0"/><rect x="1012" y="324" width="58" height="5" rx="2.5" fill="#8d979d"/></g></g>`;
  return `${pitch}${moves}${players}${ball}${clip}`;
}

export const SCENES_A = {
  "unit-3-b": scoutPitch,
  "unit-2-b": weatherDesk,
  "unit-2-a": evidenceBoard,
  "unit-1-c": spaceStation,
  "unit-1-b": botBlueprint,
  "unit-1-a": blockParty,
  "pre-unit-a": supplyDepot,
  discovery: discoveryQuilt,
  "unit-3-a": smoothieBar,
};

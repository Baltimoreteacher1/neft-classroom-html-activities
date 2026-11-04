#!/usr/bin/env node
/**
 * Draws the Living Language Studio hero: the Language Exhibition hall, with four lit stations
 * (Sound Dome, Reading Atelier, Expression Stage, Composition Desk). Two lighting registers share
 * one composition so the hotspot coordinates in src/views/home-hero.js stay valid for both:
 *
 *   hall-68.svg  night exhibition (Grades 6–8: cooler, editorial)
 *   hall-35.svg  late-afternoon exhibition (Grades 3–5: warmer, brighter)
 *
 *   node tools/access-hall-art.mjs           writes pictures/ds/hall-{68,35}.svg and domain-*.svg
 *   node tools/access-hall-art.mjs --check   fails when the committed files differ from this script
 *
 * Station centres (percent of the 1200×760 canvas) are exported for the hero hotspots and pinned by
 * tools/access-living-studio.test.mjs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const W = 1200;
export const H = 760;
export const STATIONS = {
  Listening: { x: 285, y: 470 },
  Reading: { x: 600, y: 330 },
  Speaking: { x: 870, y: 480 },
  Writing: { x: 1040, y: 650 },
};

const REGISTERS = {
  68: {
    title:
      "The Language Exhibition at night: a sound dome, a reading atelier, a speaking stage and a writing desk, each lit in its own colour",
    wallTop: "#080E25",
    wallBottom: "#1D2B58",
    skyTop: "#121C3F",
    skyBottom: "#455A9A",
    floorTop: "#1A2650",
    floorBottom: "#080E25",
    star: 0.75,
    paper: "#FFFDF8",
    shelf: "#24336A",
    rim: "#9AA6D2",
    sun: null,
  },
  35: {
    title:
      "The Language Exhibition in the afternoon: a sound dome, a reading atelier, a speaking stage and a writing desk, each lit in its own colour",
    wallTop: "#1D2B58",
    wallBottom: "#455A9A",
    skyTop: "#F5D6A8",
    skyBottom: "#DBA3B9",
    floorTop: "#33447C",
    floorBottom: "#1D2B58",
    star: 0,
    paper: "#FFFDF8",
    shelf: "#2C3D78",
    rim: "#D5DCEB",
    sun: "#FFE9C4",
  },
};

const f = (n) => Math.round(n * 10) / 10;
const BOOKS = [
  "#805395",
  "#D28B58",
  "#5A9481",
  "#15969A",
  "#D5DCEB",
  "#884326",
  "#DBA3B9",
  "#455A9A",
];

function books(x0, y, width, seed) {
  let x = x0;
  let i = seed;
  let out = "";
  while (x < x0 + width - 10) {
    const w = 9 + ((i * 7) % 8);
    const h = 30 + ((i * 13) % 16);
    const lean = i % 9 === 4;
    out += lean
      ? `<rect x="${x + 2}" y="${y - h + 2}" width="${w}" height="${h}" rx="1.5" fill="${BOOKS[i % BOOKS.length]}" transform="rotate(-8 ${x + w} ${y})"/>`
      : `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="1.5" fill="${BOOKS[i % BOOKS.length]}"/>`;
    x += w + 2 + (lean ? 6 : 0);
    i++;
  }
  return out;
}

function person({ x, y, s = 1, len = 118, skin, shirt, hair, extra = "" }) {
  // Calm, non-caricatured figures: head, hair cap, shoulders. Scale s sets depth.
  const r = 21 * s;
  return `<g>${extra}<path d="M${f(x - 30 * s)} ${f(y + len * s)}C${f(x - 30 * s)} ${f(y + 52 * s)} ${f(x - 22 * s)} ${f(y + 34 * s)} ${x} ${f(y + 34 * s)}C${f(x + 22 * s)} ${f(y + 34 * s)} ${f(x + 30 * s)} ${f(y + 52 * s)} ${f(x + 30 * s)} ${f(y + len * s)}Z" fill="${shirt}"/><rect x="${f(x - 6 * s)}" y="${f(y + 14 * s)}" width="${f(12 * s)}" height="${f(16 * s)}" rx="${f(4 * s)}" fill="${skin}"/><circle cx="${x}" cy="${y}" r="${f(r)}" fill="${skin}"/><path d="M${f(x - r)} ${f(y - 2 * s)}C${f(x - r)} ${f(y - 26 * s)} ${f(x + r)} ${f(y - 26 * s)} ${f(x + r)} ${f(y - 2 * s)}C${f(x + 8 * s)} ${f(y - 12 * s)} ${f(x - 8 * s)} ${f(y - 12 * s)} ${f(x - r)} ${f(y - 2 * s)}Z" fill="${hair}"/></g>`;
}

function chip(x, y, text, fill, ink, lang = "") {
  const w = 22 + text.length * 8.6;
  return `<g${lang ? ` xml:lang="${lang}"` : ""}><rect x="${f(x - w / 2)}" y="${y - 17}" width="${f(w)}" height="34" rx="17" fill="${fill}"/><text x="${x}" y="${y + 5.5}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="16" font-style="italic" fill="${ink}">${text}</text></g>`;
}

export function hallSVG(band) {
  const R = REGISTERS[band];
  const vp = { x: 600, y: 300 };
  const floorY = 470;
  // perspective floor lines toward the vanishing point
  const rays = [-700, -300, 0, 250, 450, 750, 950, 1200, 1500, 1900]
    .map((bx) => {
      const t = (floorY - vp.y) / (H - vp.y);
      const x1 = vp.x + (bx - vp.x) * t;
      return `<line x1="${f(x1)}" y1="${floorY}" x2="${bx}" y2="${H}"/>`;
    })
    .join("");
  const rows = [490, 520, 565, 630, 720]
    .map(
      (y, i) => `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke-opacity="${0.05 + i * 0.03}"/>`,
    )
    .join("");
  const stars = R.star
    ? [
        [130, 120],
        [210, 96],
        [248, 168],
        [160, 210],
        [1000, 110],
        [1060, 150],
        [955, 190],
        [1080, 240],
        [190, 300],
        [1020, 320],
      ]
        .map(
          ([x, y], i) =>
            `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.4 : 2.2}" fill="#fff" opacity="${R.star - (i % 4) * 0.12}"/>`,
        )
        .join("")
    : "";
  const sun = R.sun
    ? `<circle cx="1050" cy="250" r="46" fill="${R.sun}" opacity=".85"/><circle cx="1050" cy="250" r="80" fill="${R.sun}" opacity=".18"/>`
    : "";
  const arch = (x0, x1, top, bottom) => {
    const r = (x1 - x0) / 2;
    return `M${x0} ${bottom}V${top + r}A${r} ${r} 0 0 1 ${x1} ${top + r}V${bottom}Z`;
  };
  const mullions = (x0, x1, top, bottom) => {
    const cx = (x0 + x1) / 2;
    const r = (x1 - x0) / 2;
    return `<path d="M${cx} ${top}V${bottom}M${x0} ${top + r + 60}H${x1}M${x0} ${top + r + 150}H${x1}" stroke="${R.rim}" stroke-opacity=".35" stroke-width="3" fill="none"/><path d="${arch(x0, x1, top, bottom)}" fill="none" stroke="${R.rim}" stroke-opacity=".45" stroke-width="5"/>`;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${R.title}"><title>${R.title}</title>
<defs>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${R.wallTop}"/><stop offset="1" stop-color="${R.wallBottom}"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${R.skyTop}"/><stop offset="1" stop-color="${R.skyBottom}"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${R.floorTop}"/><stop offset="1" stop-color="${R.floorBottom}"/></linearGradient>
<radialGradient id="poolOcean"><stop offset="0" stop-color="#91E2D6" stop-opacity=".55"/><stop offset="1" stop-color="#15969A" stop-opacity="0"/></radialGradient>
<radialGradient id="poolIvory"><stop offset="0" stop-color="#FFFDF8" stop-opacity=".5"/><stop offset="1" stop-color="#D5DCEB" stop-opacity="0"/></radialGradient>
<radialGradient id="poolOrchid"><stop offset="0" stop-color="#DBA3B9" stop-opacity=".55"/><stop offset="1" stop-color="#805395" stop-opacity="0"/></radialGradient>
<radialGradient id="poolCopper"><stop offset="0" stop-color="#F5D6A8" stop-opacity=".6"/><stop offset="1" stop-color="#D28B58" stop-opacity="0"/></radialGradient>
<linearGradient id="beamIvory" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF8" stop-opacity=".22"/><stop offset="1" stop-color="#FFFDF8" stop-opacity="0"/></linearGradient>
<linearGradient id="beamOrchid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DBA3B9" stop-opacity=".34"/><stop offset="1" stop-color="#DBA3B9" stop-opacity=".02"/></linearGradient>
<linearGradient id="beamCopper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5D6A8" stop-opacity=".7"/><stop offset="1" stop-color="#F5D6A8" stop-opacity="0"/></linearGradient>
<radialGradient id="dome" cx=".5" cy=".85" r=".8"><stop offset="0" stop-color="#91E2D6" stop-opacity=".42"/><stop offset="1" stop-color="#15969A" stop-opacity=".08"/></radialGradient>
<linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9562E"/><stop offset="1" stop-color="#5E2C17"/></linearGradient>
<linearGradient id="page" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EFE9E4"/><stop offset="1" stop-color="#FFFDF8"/></linearGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect width="${W}" height="${floorY}" fill="url(#wall)"/>
<path d="${arch(80, 300, 70, 430)}" fill="url(#sky)"/><path d="${arch(900, 1120, 70, 430)}" fill="url(#sky)"/>
<clipPath id="winR"><path d="${arch(900, 1120, 70, 430)}"/></clipPath>
${stars}<g clip-path="url(#winR)">${sun}</g>
${mullions(80, 300, 70, 430)}${mullions(900, 1120, 70, 430)}
<path d="M0 0H${W}V42L${vp.x} 120L0 42Z" fill="#080E25" opacity=".55"/>
<path d="M0 42L${vp.x} 120M${W} 42L${vp.x} 120M300 0L${vp.x} 120M900 0L${vp.x} 120" stroke="${R.rim}" stroke-opacity=".18" stroke-width="2"/>
<path d="${arch(450, 750, 96, floorY)}" fill="#080E25" opacity=".45"/>
<path d="${arch(450, 750, 96, floorY)}" fill="none" stroke="${R.rim}" stroke-opacity=".5" stroke-width="4"/>
<g>
<rect x="472" y="240" width="256" height="8" fill="${R.shelf}"/><rect x="472" y="320" width="256" height="8" fill="${R.shelf}"/><rect x="472" y="400" width="256" height="8" fill="${R.shelf}"/>
${books(478, 240, 244, 1)}${books(478, 320, 244, 5)}${books(478, 400, 244, 9)}
</g>
<path d="M560 96H640L760 ${floorY}H440Z" fill="url(#beamIvory)"/>
<rect y="${floorY}" width="${W}" height="${H - floorY}" fill="url(#floor)"/>
<g stroke="${R.rim}" stroke-opacity=".14" stroke-width="1.5">${rays}</g>
<g stroke="${R.rim}" stroke-width="1.5">${rows}</g>
<ellipse cx="285" cy="610" rx="230" ry="62" fill="url(#poolOcean)"/>
<ellipse cx="600" cy="520" rx="210" ry="44" fill="url(#poolIvory)"/>
<ellipse cx="870" cy="620" rx="210" ry="58" fill="url(#poolOrchid)"/>
<ellipse cx="1040" cy="735" rx="230" ry="60" fill="url(#poolCopper)"/>
<g>
<rect x="566" y="420" width="68" height="84" rx="6" fill="#2C3D78"/><path d="M548 420H652L640 404H560Z" fill="#455A9A"/>
<path d="M600 404L536 388L540 366L600 380Z" fill="url(#page)"/><path d="M600 404L664 388L660 366L600 380Z" fill="#FFFDF8"/>
<path d="M548 380L590 389M548 388L590 397M610 389L652 380M610 397L652 388" stroke="#9AA6D2" stroke-width="2"/>
</g>
${person({ x: 676, y: 386, s: 0.62, skin: "#8A5A3C", shirt: "#5A9481", hair: "#1B1410" })}
<g>
<rect x="232" y="540" width="106" height="66" rx="8" fill="#0B3F4E"/><ellipse cx="285" cy="540" rx="58" ry="12" fill="#15969A"/>
<path d="M200 540A85 85 0 0 1 370 540Z" fill="url(#dome)" stroke="#91E2D6" stroke-opacity=".7" stroke-width="2.5"/>
<path d="M226 520A60 60 0 0 1 344 520" fill="none" stroke="#FFFDF8" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
<circle cx="285" cy="500" r="14" fill="#075568" stroke="#91E2D6" stroke-width="3"/>
<g fill="none" stroke="#91E2D6" stroke-linecap="round" stroke-width="3"><path d="M305 484A26 26 0 0 1 305 516" opacity=".9"/><path d="M318 474A42 42 0 0 1 318 526" opacity=".6"/><path d="M265 484A26 26 0 0 0 265 516" opacity=".9"/><path d="M252 474A42 42 0 0 0 252 526" opacity=".6"/></g>
<g fill="#91E2D6">${[6, 14, 22, 12, 26, 18, 8, 20, 12, 6].map((h, i) => `<rect x="${246 + i * 8}" y="${578 - h / 2}" width="4" height="${h}" rx="2"/>`).join("")}</g>
</g>
<g><path d="M80 180L120 160V214L80 196Z" fill="#455A9A"/><rect x="66" y="176" width="16" height="22" rx="3" fill="#33447C"/><path d="M134 168A24 24 0 0 1 134 206M146 158A40 40 0 0 1 146 216" fill="none" stroke="#91E2D6" stroke-width="3" stroke-linecap="round" opacity=".75"/></g>
${person({
  x: 150,
  y: 470,
  s: 1,
  skin: "#C68A62",
  shirt: "#15969A",
  hair: "#2A1C14",
  extra: "",
})}<path d="M128 466A22 22 0 0 1 172 466" fill="none" stroke="#075568" stroke-width="5"/><rect x="122" y="462" width="9" height="16" rx="4" fill="#075568"/><rect x="169" y="462" width="9" height="16" rx="4" fill="#075568"/>
<path d="M840 0H900L990 610H750Z" fill="url(#beamOrchid)"/>
<ellipse cx="870" cy="612" rx="130" ry="26" fill="#3C244D"/><ellipse cx="870" cy="604" rx="130" ry="26" fill="#805395"/><ellipse cx="870" cy="602" rx="112" ry="19" fill="#93659F" opacity=".7"/>
<g><path d="M842 604V520" stroke="#D5DCEB" stroke-width="4"/><path d="M826 604H858" stroke="#D5DCEB" stroke-width="4" stroke-linecap="round"/><rect x="834" y="494" width="16" height="30" rx="8" fill="#EFE9E4"/></g>
${person({ x: 896, y: 440, s: 1.02, len: 162, skin: "#6E4630", shirt: "#3C244D", hair: "#120C0A" })}
<path d="M872 520L854 506" stroke="#6E4630" stroke-width="12" stroke-linecap="round"/>
<g><rect x="914" y="352" width="210" height="58" rx="18" fill="#FFFDF8"/><path d="M936 408L926 430L956 410Z" fill="#FFFDF8"/><text x="1019" y="388" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="20" fill="#3C244D">I noticed that…</text></g>
<g><path d="M960 760L1010 660H1200V760Z" fill="url(#desk)"/><path d="M1010 660H1200V676H1004Z" fill="#C06A3B"/></g>
<path d="M1108 500L1156 474L1220 690H990Z" fill="url(#beamCopper)" opacity=".75"/>
<g><path d="M1170 662V560L1130 470" fill="none" stroke="#3B2216" stroke-width="7" stroke-linecap="round"/><path d="M1100 490L1142 460L1162 484L1116 512Z" fill="#D28B58"/><circle cx="1132" cy="470" r="6" fill="#3B2216"/></g>
<g transform="rotate(-7 1060 672)"><rect x="1018" y="642" width="96" height="62" rx="3" fill="#EFE9E4"/></g>
<g transform="rotate(4 1085 680)"><rect x="1036" y="648" width="100" height="64" rx="3" fill="#FFFDF8"/><path d="M1048 664H1120M1048 676H1124M1048 688H1112M1048 700H1096" stroke="#D28B58" stroke-width="2.4" stroke-linecap="round"/></g>
<path d="M1140 720L1176 672" stroke="#1D2B58" stroke-width="5" stroke-linecap="round"/><path d="M1176 672L1182 664" stroke="#D28B58" stroke-width="5" stroke-linecap="round"/>
<g opacity=".95">${chip(392, 404, "First,", "#E2F3F0", "#075568")}${chip(500, 186, "evidence", "#FFFDF8", "#2F3F8C")}${chip(760, 300, "¿Por qué?", "#F5ECF6", "#693F7F", "es")}${chip(940, 640, "therefore", "#FBEFE3", "#884326")}</g>
<g><ellipse cx="40" cy="640" rx="16" ry="70" fill="#162A2A" transform="rotate(-28 40 640)"/><ellipse cx="92" cy="628" rx="15" ry="74" fill="#1B3A36" transform="rotate(12 92 628)"/><ellipse cx="140" cy="676" rx="13" ry="58" fill="#162A2A" transform="rotate(38 140 676)"/><ellipse cx="18" cy="700" rx="13" ry="52" fill="#1B3A36" transform="rotate(-58 18 700)"/><ellipse cx="70" cy="598" rx="12" ry="60" fill="#264E48" transform="rotate(-4 70 598)"/><ellipse cx="118" cy="612" rx="11" ry="52" fill="#264E48" transform="rotate(26 118 612)"/><path d="M40 760C46 720 58 690 70 650M70 760C78 720 92 690 96 640M100 760C110 730 124 706 140 690" stroke="#264E48" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M0 760V735C40 728 140 728 180 735V760Z" fill="#080E25"/></g>
</svg>
`;
}

const here = fileURLToPath(new URL(".", import.meta.url));
const out = (name) => join(here, "..", "access-practice-lab", "pictures", "ds", name);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes("--check");
  let stale = 0;
  const jobs = [
    ...["68", "35"].map((band) => [`hall-${band}.svg`, hallSVG(band)]),
    ...["listening", "reading", "speaking", "writing"].map((d) => [
      `domain-${d}.svg`,
      studioSVG(d),
    ]),
  ];
  for (const [name, svg] of jobs) {
    if (check) {
      let current = "";
      try {
        current = readFileSync(out(name), "utf8");
      } catch {}
      if (current !== svg) {
        stale++;
        console.error(`${name} is stale: run node tools/access-hall-art.mjs`);
      }
    } else {
      writeFileSync(out(name), svg);
      console.log(`wrote ${name} (${svg.length} bytes)`);
    }
  }
  if (stale) process.exit(1);
}

/**
 * Studio illustrations (480×360) for the four skill rooms, in the same materials as the home portals.
 * They replace pictures/ds/domain-{listening,reading,speaking,writing}.svg (same names, same callers).
 */
export function studioSVG(domain) {
  const T = {
    listening: "The Sound Studio: headphones over a glowing sound wave on ocean glass",
    reading: "The Reading Atelier: an open folio with one sentence highlighted as evidence",
    speaking: "The Expression Studio: a microphone inside voice rings beside a speech bubble",
    writing:
      "The Composition Studio: a manuscript page with a margin rule, a revision mark and a pen",
  }[domain];
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360" role="img" aria-label="${T}"><title>${T}</title>`;
  if (domain === "listening") {
    const bars = [
      10, 22, 40, 64, 36, 82, 54, 30, 70, 96, 50, 26, 60, 40, 18, 46, 74, 34, 16, 42, 24, 12,
    ]
      .map(
        (h, i) => `<rect x="${86 + i * 14}" y="${f(232 - h / 2)}" width="6" height="${h}" rx="3"/>`,
      )
      .join("");
    return `${head}<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B4B5B"/><stop offset="1" stop-color="#062C38"/></linearGradient><radialGradient id="l" cx=".25" cy=".2" r=".8"><stop offset="0" stop-color="#15969A" stop-opacity=".55"/><stop offset="1" stop-color="#15969A" stop-opacity="0"/></radialGradient></defs>
<rect x="8" y="8" width="464" height="344" rx="28" fill="url(#g)"/><rect x="8" y="8" width="464" height="344" rx="28" fill="url(#l)"/>
<g stroke="#91E2D6" stroke-opacity=".08">${[60, 100, 140, 180, 220, 260, 300].map((y) => `<line x1="30" y1="${y}" x2="450" y2="${y}"/>`).join("")}</g>
<g fill="#91E2D6">${bars}</g>
<path d="M176 132a64 64 0 0 1 128 0" fill="none" stroke="#FFFDF8" stroke-width="12" stroke-linecap="round"/>
<rect x="158" y="120" width="34" height="56" rx="14" fill="#FFFDF8"/><rect x="288" y="120" width="34" height="56" rx="14" fill="#FFFDF8"/>
<rect x="166" y="130" width="18" height="36" rx="8" fill="#15969A"/><rect x="296" y="130" width="18" height="36" rx="8" fill="#15969A"/>
<g fill="none" stroke="#91E2D6" stroke-linecap="round" stroke-width="4" opacity=".7"><path d="M118 116a90 90 0 0 0 0 52"/><path d="M362 116a90 90 0 0 1 0 52"/></g>
</svg>
`;
  }
  if (domain === "reading") {
    return `${head}<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4E8F2"/><stop offset="1" stop-color="#D5DCEB"/></linearGradient></defs>
<rect x="8" y="8" width="464" height="344" rx="28" fill="url(#g)"/>
<ellipse cx="240" cy="300" rx="170" ry="18" fill="#1D2B58" opacity=".12"/>
<g transform="rotate(-3 240 180)"><path d="M240 92C200 76 140 74 92 84V286C140 276 200 278 240 294Z" fill="#EFE9E4"/><path d="M240 92C280 76 340 74 388 84V286C340 276 280 278 240 294Z" fill="#FFFDF8"/><path d="M240 92V294" stroke="#C9CFE0" stroke-width="2"/>
<rect x="112" y="108" width="84" height="10" rx="3" fill="#34459A"/>
<g fill="#C9CFE0">${[134, 152, 170, 188, 206, 224, 242].map((y, i) => `<rect x="112" y="${y}" width="${i % 3 === 2 ? 86 : 108}" height="6" rx="3"/>`).join("")}</g>
<rect x="258" y="152" width="112" height="16" rx="4" fill="#F5D6A8"/>
<g fill="#C9CFE0">${[110, 128, 158, 188, 206, 224, 242].map((y, i) => `<rect x="262" y="${y}" width="${i % 3 === 1 ? 84 : 104}" height="6" rx="3"/>`).join("")}</g><rect x="262" y="157" width="104" height="6" rx="3" fill="#884326" opacity=".55"/></g>
<g transform="translate(352 220) rotate(-35)"><rect x="-6" y="0" width="12" height="70" rx="4" fill="#D28B58"/><path d="M-6 70H6L0 84Z" fill="#884326"/></g>
</svg>
`;
  }
  if (domain === "speaking") {
    return `${head}<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5D3A72"/><stop offset="1" stop-color="#3C244D"/></linearGradient><radialGradient id="l" cx=".7" cy=".15" r=".7"><stop offset="0" stop-color="#DBA3B9" stop-opacity=".45"/><stop offset="1" stop-color="#DBA3B9" stop-opacity="0"/></radialGradient></defs>
<rect x="8" y="8" width="464" height="344" rx="28" fill="url(#g)"/><rect x="8" y="8" width="464" height="344" rx="28" fill="url(#l)"/>
<g fill="none" stroke="#DBA3B9"><circle cx="190" cy="190" r="118" stroke-opacity=".2" stroke-width="2"/><circle cx="190" cy="190" r="88" stroke-opacity=".4" stroke-width="2"/></g>
<circle cx="190" cy="190" r="60" fill="#FFFDF8"/>
<rect x="174" y="150" width="32" height="54" rx="16" fill="#805395"/><path d="M162 190a28 28 0 0 0 56 0" fill="none" stroke="#3C244D" stroke-width="6" stroke-linecap="round"/><path d="M190 218v14" stroke="#3C244D" stroke-width="6" stroke-linecap="round"/>
<path d="M286 70H432A18 18 0 0 1 450 88V136A18 18 0 0 1 432 154H330L304 176L310 154H286A18 18 0 0 1 268 136V88A18 18 0 0 1 286 70Z" fill="#FFFDF8"/>
<rect x="290" y="94" width="120" height="9" rx="4" fill="#805395"/><rect x="290" y="114" width="138" height="7" rx="3" fill="#DBA3B9"/><rect x="290" y="130" width="96" height="7" rx="3" fill="#DBA3B9"/>
</svg>
`;
  }
  return `${head}<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCF5EA"/><stop offset="1" stop-color="#F3E4CF"/></linearGradient></defs>
<rect x="8" y="8" width="464" height="344" rx="28" fill="url(#g)"/>
<ellipse cx="236" cy="306" rx="160" ry="16" fill="#884326" opacity=".12"/>
<g transform="rotate(2 236 180)"><rect x="120" y="56" width="236" height="244" rx="8" fill="#FFFDF8"/><path d="M152 56V300" stroke="#D28B58" stroke-width="3" opacity=".7"/>
<g stroke="#E5D3BC" stroke-width="2">${[96, 126, 156, 186, 216, 246, 276].map((y) => `<line x1="134" y1="${y}" x2="342" y2="${y}"/>`).join("")}</g>
<rect x="166" y="80" width="120" height="9" rx="3" fill="#9A4A26"/><rect x="166" y="110" width="150" height="8" rx="3" fill="#C5B29B"/><path d="M164 114H320" stroke="#884326" stroke-width="3"/>
<rect x="166" y="140" width="164" height="8" rx="3" fill="#9A4A26"/><path d="M160 146l-8 8M160 146l8 8" stroke="#884326" stroke-width="3" stroke-linecap="round"/>
<rect x="166" y="170" width="130" height="8" rx="3" fill="#C5B29B"/><rect x="166" y="200" width="150" height="8" rx="3" fill="#C5B29B"/><rect x="166" y="230" width="2.5" height="22" fill="#884326"/></g>
<g transform="translate(372 168) rotate(32)"><rect x="-7" y="-70" width="14" height="110" rx="5" fill="#1D2B58"/><path d="M-7 40H7L0 60Z" fill="#D28B58"/></g>
</svg>
`;
}

// Print style system: page geometry, age-band typography and the restrained subject accent.
// Colours mirror access-practice-lab/ds.css tokens (DS_SOURCE names them; the test proves they agree)
// because a .docx and a rasterised visual cannot read CSS custom properties.

export const DS_SOURCE = {
  ink: "--text-primary",
  ink2: "--text-secondary",
  line: "--border-subtle",
  control: "--border-control",
  tint: "--bg-subtle",
  brand: "--brand-primary",
  teal: "--brand-accent",
  listening: "--listening-ink",
  reading: "--reading-ink",
  speaking: "--speaking-ink",
  writing: "--writing-ink",
};

export const HEX = {
  ink: "182230",
  ink2: "475467",
  line: "e4e0d8",
  control: "7c8799",
  tint: "f2efe9",
  brand: "1e3a5f",
  teal: "0f766e",
  listening: "075568",
  reading: "2a4386",
  speaking: "7d3354",
  writing: "884326",
};

/** Subject -> accent colour key. One restrained accent per resource. */
export const SUBJECT_ACCENT = {
  ela: "writing",
  math: "brand",
  science: "listening",
  "social-studies": "reading",
  esol: "speaking",
  sped: "teal",
  "world-languages": "speaking",
  "health-pe": "teal",
  arts: "writing",
  cte: "brand",
  interdisciplinary: "teal",
};
export const accentKey = (subject) => SUBJECT_ACCENT[subject] || "brand";
export const accentHex = (subject) => HEX[accentKey(subject)];
export const accentCss = (subject) => `var(${DS_SOURCE[accentKey(subject)]},#${accentHex(subject)})`;

export const PAGE_SIZES = {
  letter: { label: "Letter (8.5 x 11 in)", wMm: 215.9, hMm: 279.4, cssName: "letter" },
  a4: { label: "A4 (210 x 297 mm)", wMm: 210, hMm: 297, cssName: "A4" },
};

export function pageGeometry(format = {}) {
  const base = PAGE_SIZES[format.size] || PAGE_SIZES.letter;
  const landscape = format.orientation === "landscape";
  const wMm = landscape ? base.hMm : base.wMm;
  const hMm = landscape ? base.wMm : base.hMm;
  const marginMm = 15;
  return {
    size: PAGE_SIZES[format.size] ? format.size : "letter",
    orientation: landscape ? "landscape" : "portrait",
    wMm,
    hMm,
    marginMm,
    cssSize: `${base.cssName} ${landscape ? "landscape" : "portrait"}`,
    twipsW: Math.round((wMm / 25.4) * 1440),
    twipsH: Math.round((hMm / 25.4) * 1440),
    twipsMargin: Math.round((marginMm / 25.4) * 1440),
  };
}

/**
 * Type per age band (K-8). Floors: body >= 12pt, >= 14pt for K-2.
 * lineMm = height of one writing line; primary = baseline + dashed midline (handwriting rules).
 */
export const BAND_STYLE = {
  "k-2": { bodyPt: 15, headPt: 26, smallPt: 12, lineMm: 12.5, lineKind: "primary", trace: true, picFirst: true, floorPt: 14 },
  "3-5": { bodyPt: 13, headPt: 21, smallPt: 10, lineMm: 9.5, lineKind: "ruled", trace: false, picFirst: false, floorPt: 12 },
  "6-8": { bodyPt: 12, headPt: 20, smallPt: 10, lineMm: 8.5, lineKind: "ruled", trace: false, picFirst: false, floorPt: 12 },
};
export const styleFor = (band) => BAND_STYLE[band] || BAND_STYLE["6-8"];
/** Chrome (running header/footer, cut labels) may be smaller than body type but never below this. */
export const CHROME_FLOOR_PT = 8;

export const mmToTwips = (mm) => Math.round((mm / 25.4) * 1440);
export const mmToEmu = (mm) => Math.round(mm * 36000);

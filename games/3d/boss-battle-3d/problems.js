/**
 * Boss Battle 3D — phase metadata, one boss per Grade 6 Reveal unit.
 *
 * The 8-question multiple-choice BANK that used to live here was retired on
 * 2026-10-08 when the battle became construction-based: rounds are now built
 * procedurally by ./generators.js and checked by ./mechanics.js.
 */

/**
 * Per-unit metadata: the boss "phase" for each unit, MCAP standard, theme color.
 * Phases are ordered 1→10 so difficulty climbs with the curriculum.
 */
export const UNITS = [
  {
    u: 1,
    standard: "6.AT.A.1–3",
    theme: "Ratios & Unit Rates",
    title: "Ratio Wraith",
    color: 0x1fa6a2,
  },
  {
    u: 2,
    standard: "6.NOS.A.1",
    theme: "Dividing Fractions",
    title: "Fraction Phantom",
    color: 0xe07b53,
  },
  {
    u: 3,
    standard: "6.AT.A.2–3",
    theme: "Percents & Rates",
    title: "Percent Prowler",
    color: 0xf2c15b,
  },
  {
    u: 4,
    standard: "6.NOS.B.2–4",
    theme: "Decimals, GCF & LCM",
    title: "Factor Fiend",
    color: 0x7c5cff,
  },
  {
    u: 5,
    standard: "6.GR.A.1",
    theme: "Area of Polygons",
    title: "Area Aberration",
    color: 0x49c06a,
  },
  {
    u: 6,
    standard: "6.AT.B.5–4",
    theme: "Expressions & Exponents",
    title: "Expression Engine",
    color: 0xff6f9c,
  },
  {
    u: 7,
    standard: "6.NOS.C.5–7",
    theme: "Integers & Absolute Value",
    title: "Integer Leviathan",
    color: 0x2f7fff,
  },
  {
    u: 8,
    standard: "6.DS.A–B",
    theme: "Statistics & Data",
    title: "Data Specter",
    color: 0x36c5d6,
  },
  {
    u: 9,
    standard: "6.NOS.C.6, 8",
    theme: "The Coordinate Plane",
    title: "Quadrant Quaker",
    color: 0xc77dff,
  },
  {
    u: 10,
    standard: "6.GR.A.2",
    theme: "Volume of Prisms",
    title: "Volume Vault Golem",
    color: 0xffa94d,
  },
];

/** All units 1..10 as a flat list, validated for shape. */
export function allUnits() {
  return UNITS.map((m) => m.u);
}

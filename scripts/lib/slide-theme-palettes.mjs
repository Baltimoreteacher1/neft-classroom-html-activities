/**
 * Unit-based color palettes inspired by reference PPTX (5.2 Session 1).
 * Reference colors: navy #1C2E42, teal #387F84, warm sand #E8E4D8, sage #EDF2E8
 */

export const UNIT_PALETTES = {
  1: { navy: '#1C2E42', teal: '#387F84', tealLight: '#E0F0F1', amber: '#C8A050', bg: '#F5F0E6', bgWarm: '#FCF5E0', coral: '#F5EAE7', accent: '#5C8A5A', name: 'Number Sense' },
  2: { navy: '#1C2E42', teal: '#387F84', tealLight: '#EAF2F7', amber: '#F2C15B', bg: '#F7F4EC', bgWarm: '#FCF5E0', coral: '#FCE6DE', accent: '#5C656E', name: 'Fractions' },
  3: { navy: '#17324D', teal: '#1FA6A2', tealLight: '#DFF2EE', amber: '#E4C050', bg: '#F5F0E6', bgWarm: '#FFF8E8', coral: '#FCE6DE', accent: '#D9795D', name: 'Ratios' },
  4: { navy: '#1C2E42', teal: '#387F84', tealLight: '#E0F0F1', amber: '#F2C15B', bg: '#F7F4EC', bgWarm: '#FCF5E0', coral: '#F5EAE7', accent: '#5C8A5A', name: 'Percents' },
  5: { navy: '#1C2E42', teal: '#387F84', tealLight: '#E8EDF3', amber: '#C8A050', bg: '#E8E4D8', bgWarm: '#EDF2E8', coral: '#F5EAE7', accent: '#5C8A5A', name: 'Geometry' },
  6: { navy: '#17324D', teal: '#1FA6A2', tealLight: '#DFF2EE', amber: '#F2C15B', bg: '#F0F4F8', bgWarm: '#EAF2F7', coral: '#FCE6DE', accent: '#387F84', name: 'Expressions' },
  7: { navy: '#1C2E42', teal: '#387F84', tealLight: '#E0F0F1', amber: '#F2C15B', bg: '#F5F0E6', bgWarm: '#FCF5E0', coral: '#FCE6DE', accent: '#5C656E', name: 'Equations' },
  8: { navy: '#17324D', teal: '#1FA6A2', tealLight: '#DFF2EE', amber: '#E4C050', bg: '#F0F4EC', bgWarm: '#EDF2E8', coral: '#FCE6DE', accent: '#5C8A5A', name: 'Statistics' },
  9: { navy: '#1C2E42', teal: '#387F84', tealLight: '#EAF2F7', amber: '#F2C15B', bg: '#F0F4F8', bgWarm: '#E8EDF3', coral: '#FCE6DE', accent: '#C07070', name: 'Coordinates' },
  10: { navy: '#1C2E42', teal: '#387F84', tealLight: '#E8EDF3', amber: '#C8A050', bg: '#E8E4D8', bgWarm: '#EDF2E8', coral: '#F5EAE7', accent: '#5C8A5A', name: 'Volume' },
};

export function getUnitPalette(unit) {
  return UNIT_PALETTES[unit] || UNIT_PALETTES[3];
}

export function paletteToCssVars(palette, themeColor) {
  return `
      --navy: ${palette.navy};
      --teal: ${palette.teal};
      --teal-light: ${palette.tealLight};
      --amber: ${palette.amber};
      --bg: ${palette.bg};
      --bg-warm: ${palette.bgWarm};
      --coral: ${palette.coral};
      --accent: ${palette.accent};
      --body-text: #24323F;
      --gray: #8A96A3;
      --white: #FFFFFF;
      --shadow: 0 4px 20px rgba(28, 46, 66, 0.08);
      --google-gray: #f1f3f4;
      --google-blue: #1a73e8;
      --theme-color: ${themeColor};`;
}

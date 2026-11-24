// Language Studio print icon set: small, crisp, stroke-based inline SVGs (24x24 viewBox, currentColor).
// One icon per domain plus a few utility marks. Pure strings so any renderer (HTML now, PNG for Word later) can use them.

const STROKE =
  'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  // Listening: ear with inner curl and sound waves
  ear: `<g ${STROKE}><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 3.2-2.2 4-3.2 6.2-.7 1.6-1.2 3.3-3.3 3.3a2.6 2.6 0 0 1-2.6-2.6"/><path d="M9.8 10a2.2 2.2 0 0 1 4.4 0c0 1.7-2.2 1.9-2.2 3.6"/></g>`,
  // Speaking: speech bubble with three dots
  speech: `<g ${STROKE}><path d="M4 5.5h16v11h-8.4L7 20.5v-4H4z"/></g><g fill="currentColor"><circle cx="8.6" cy="11" r="1.15"/><circle cx="12" cy="11" r="1.15"/><circle cx="15.4" cy="11" r="1.15"/></g>`,
  // Reading: open book
  book: `<g ${STROKE}><path d="M12 6.2C9.9 4.8 7 4.3 3.8 4.3v13.6c3.2 0 6.1.5 8.2 1.9 2.1-1.4 5-1.9 8.2-1.9V4.3c-3.2 0-6.1.5-8.2 1.9z"/><path d="M12 6.2v13.6"/></g>`,
  // Writing: pencil
  pencil: `<g ${STROKE}><path d="M4 20l1.1-4.9L16.4 3.8l3.8 3.8L8.9 18.9z"/><path d="M14.2 6l3.8 3.8"/></g>`,
  // Vocabulary: three letter blocks
  abc: `<g ${STROKE}><rect x="3" y="12.5" width="8" height="8" rx="1.6"/><rect x="13" y="12.5" width="8" height="8" rx="1.6"/><rect x="8" y="3.5" width="8" height="8" rx="1.6"/></g><g fill="currentColor" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="6.2" text-anchor="middle"><text x="7" y="18.4">A</text><text x="17" y="18.4">C</text><text x="12" y="9.4">B</text></g>`,
  // Game: die with pips
  game: `<g ${STROKE}><rect x="3.5" y="3.5" width="17" height="17" rx="4"/></g><g fill="currentColor"><circle cx="8.4" cy="8.4" r="1.45"/><circle cx="15.6" cy="8.4" r="1.45"/><circle cx="12" cy="12" r="1.45"/><circle cx="8.4" cy="15.6" r="1.45"/><circle cx="15.6" cy="15.6" r="1.45"/></g>`,
  // Utility marks
  scissors: `<g ${STROKE}><circle cx="6" cy="6.5" r="2.6"/><circle cx="6" cy="17.5" r="2.6"/><path d="M8.2 8l12 9.4M8.2 16l12-9.4"/></g>`,
  check: `<g ${STROKE}><path d="M4.5 12.5l5 5 10-11"/></g>`,
  star: `<g fill="currentColor"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.5l-5.4 3 1.1-6.1-4.5-4.2 6.1-.8z"/></g>`,
  people: `<g ${STROKE}><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.8 19c.3-3.4 2.4-5.2 5.2-5.2s4.9 1.8 5.2 5.2M14.5 14.4c2.7-.5 5.9.7 6.7 4.4"/></g>`,
  bulb: `<g ${STROKE}><path d="M9 17.5h6M10 20.5h4M12 3.5a5.6 5.6 0 0 0-3.4 10c.6.5.9 1.1.9 2v.5h5v-.5c0-.9.3-1.5.9-2A5.6 5.6 0 0 0 12 3.5z"/></g>`,
};

export const ICON_NAMES = Object.keys(ICONS);

export function iconSvg(name, { size = 24, color = "currentColor", label = "" } = {}) {
  const body = ICONS[name] || ICONS.star;
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="color:${color}" ${aria}>${body}</svg>`;
}

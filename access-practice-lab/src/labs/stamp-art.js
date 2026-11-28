// Discovery-stamp seals for the Lab Notebook. One round seal with a glyph per stamp; colour comes from CSS
// (currentColor), so an earned stamp is inked and an unearned one is a dashed outline. Decorative: the stamp's
// name and state are always real text beside it.
import { raw } from "../util.js";

const GLYPHS = {
  see: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  explore:
    '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2.2" fill="currentColor"/><circle cx="15" cy="12" r="2.2" fill="currentColor"/><circle cx="8" cy="17" r="2.2" fill="currentColor"/>',
  example: '<path d="M3 20h6v-5h6v-5h6V5"/><circle cx="21" cy="4" r="1.6" fill="currentColor"/>',
  practice: '<path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4"/>',
  task: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
  solo: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  first: '<path d="M3 8h18v9H3zM3 12.5h18M9 8v4.5M15 12.5V17"/>',
  again:
    '<path d="M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5"/>',
};

export const stampSVG = (kind, earned) =>
  raw(`<svg class="llp-seal${earned ? " is-inked" : ""}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="${earned ? 2.4 : 1.6}" stroke-dasharray="${earned ? "2.4 2.8" : "4 4"}"/>
    <circle cx="32" cy="32" r="23.5" fill="${earned ? "var(--ivory,#fffcf5)" : "none"}" stroke="currentColor" stroke-width="1.6"/>
    <g transform="translate(20 20)" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" opacity="${earned ? 1 : 0.55}">${GLYPHS[kind] || GLYPHS.solo}</g>
  </svg>`);

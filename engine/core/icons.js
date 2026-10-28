/**
 * icons.js — the lesson chrome's one icon set.
 *
 * Style guide §7: one line-icon family (24px grid, 2px stroke, rounded caps and
 * joins), drawn in `currentColor` so every icon inherits the contrast of the
 * text beside it, always paired with a text label where meaning matters.
 *
 * WHY A MAPPING FROM EMOJI. The lesson data and a dozen renderers already carry
 * an `icon: "📓"` string. Rewriting every config to a new vocabulary would be a
 * content migration with a large blast radius; mapping the few emoji the chrome
 * actually uses to icons is one change in one place. `ico()` is what a renderer
 * calls instead of interpolating the raw emoji: an emoji we have an icon for
 * becomes an <svg>, anything else (a story emoji inside lesson prose, an
 * unknown glyph) is returned untouched.
 */

const A =
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** name -> inner SVG markup on a 24x24 grid. */
export const ICON_PATHS = {
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  notebook: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4M12 12h4"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3M14 9l2 2"/>',
  rocket:
    '<path d="M12 3c3 2 5 5 5 9l-2 4H9l-2-4c0-4 2-7 5-9z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 16l-2 4M15 16l2 4M10 19h4"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="m14 7 3 3"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  books: '<path d="M5 4h4v16H5zM11 4h4v16h-4z"/><path d="m17 6 3.5 1-3.5 13-3.5-1"/>',
  book: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/>',
  note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  speaker:
    '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  "eye-off":
    '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/><path d="m4 4 16 16"/>',
  access:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.5" r="1.2"/><path d="M7.5 10.5h9M12 10.5V15M10 19l2-4 2 4"/>',
  toolbox:
    '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18M11 13v2h2v-2"/>',
  puzzle:
    '<path d="M10 4a2 2 0 0 1 4 0v2h4v4h-2a2 2 0 0 0 0 4h2v4h-4v-2a2 2 0 0 0-4 0v2H6v-4h2a2 2 0 0 0 0-4H6V6h4z"/>',
  calculator:
    '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  star: '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.5-2.5 1.8-2.5.8-2.5 1.8 1 1.7 2.5 1.7 2.5-.7 2.5-1.7"/>',
  ruler: '<path d="m4 16 12-12 4 4L8 20z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  flask:
    '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
  talk: '<path d="M4 5h11v8H9l-3 3v-3H4z"/><path d="M17 9h3v8h-2v3l-3-3h-5v-2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  cross: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  marker: '<path d="m4 20 4-1 10-10-3-3L5 16z"/><path d="m13 6 3 3M4 20h6"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
};

/** Emoji the chrome uses -> icon name. Variation selectors are stripped before lookup. */
export const EMOJI_TO_ICON = {
  "⚡": "bolt",
  "📓": "notebook",
  "🎯": "target",
  "🤔": "chat",
  "🔑": "key",
  "🚀": "rocket",
  "💡": "bulb",
  "🔍": "search",
  "✏": "pencil",
  "🌎": "globe",
  "🌍": "globe",
  "📚": "books",
  "📖": "book",
  "📘": "book",
  "📝": "note",
  "🔊": "speaker",
  "🙈": "eye-off",
  "♿": "access",
  "🧰": "toolbox",
  "🧩": "puzzle",
  "🧮": "calculator",
  "💾": "save",
  "⭐": "star",
  "🪙": "coin",
  "📐": "ruler",
  "🧪": "flask",
  "🗣": "talk",
  "⏹": "stop",
  "🖍": "marker",
};

const VS16 = /️/g;

/** The inline SVG for a named icon; empty string for an unknown name. */
export function iconSvg(name, { label } = {}) {
  const body = ICON_PATHS[name];
  if (!body) return "";
  const a11y = label
    ? `role="img" aria-label="${label.replace(/"/g, "&quot;")}"`
    : 'aria-hidden="true" focusable="false"';
  return `<svg class="ds-icon ds-icon-${name}" viewBox="0 0 24 24" width="20" height="20" ${A} ${a11y}>${body}</svg>`;
}

/**
 * Render a chrome icon. Pass the emoji a renderer already holds ("📓") or an icon
 * name ("notebook"). Unmapped input is returned as given so lesson prose that
 * carries its own story emoji is never altered.
 */
export function ico(emojiOrName) {
  if (typeof emojiOrName !== "string" || !emojiOrName) return "";
  const key = emojiOrName.trim().replace(VS16, "");
  const name = ICON_PATHS[key] ? key : EMOJI_TO_ICON[key];
  return name ? iconSvg(name) : emojiOrName;
}

/** Replace a LEADING mapped emoji in a label ("🔊 Read Aloud") with its icon. */
export function icoLead(text) {
  if (typeof text !== "string") return text;
  const m = text.match(/^(\S+)\s+([\s\S]*)$/);
  if (!m) return text;
  const swapped = ico(m[1]);
  return swapped === m[1] ? text : `${swapped} ${m[2]}`;
}

/** Stylesheet text for the icon family; mounted once by the v2 layer. */
export const ICON_CSS = `.ds-icon{display:inline-block;width:1.15em;height:1.15em;vertical-align:-0.2em;flex:none}`;

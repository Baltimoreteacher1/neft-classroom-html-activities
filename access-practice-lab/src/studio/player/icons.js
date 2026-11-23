// Small inline icons (decorative: always aria-hidden). Meaning is carried by the words beside them.

import { sv } from "./util.js";

const PATHS = {
  speaker: "M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  cross: "M6 6l12 12M18 6L6 18",
  bulb: "M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.9 1 .9 1.7V16h5.2v-.4c0-.7.4-1.3.9-1.7A6 6 0 0 0 12 3z",
  up: "M6 14l6-6 6 6",
  down: "M6 10l6 6 6-6",
  play: "M8 5v14l11-7z",
  pause: "M8 5v14M16 5v14",
  flag: "M6 21V4m0 1h11l-2 4 2 4H6",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  undo: "M9 7L4 12l5 5M4 12h10a6 6 0 0 1 0 12",
  arrow: "M5 12h14m-6-6l6 6-6 6",
  gear: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10l2 2M19 5l-2 2M7 17l-2 2",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  leaf: "M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19l7-7",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  puzzle: "M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z",
};

/** @param {keyof PATHS} name */
export function glyph(name, size = 20) {
  return sv(
    "svg",
    {
      class: "sp-icon",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false",
    },
    sv("path", { d: PATHS[name] || PATHS.star }),
  );
}

// Language Studio Player — tiny stroke icons (chrome icons are SVG, never emoji).
const NS = "http://www.w3.org/2000/svg";

const PATHS = {
  Listening:
    "M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H5.5A1.5 1.5 0 0 1 4 18.5zM20 15h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5z",
  Speaking: "M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  Reading: "M12 6.5C10 5 7 4.5 4 4.5v14c3 0 6 .5 8 2 2-1.5 5-2 8-2v-14c-3 0-6 .5-8 2zM12 6.5v14",
  Writing: "M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19zM14 7l3 3",
  Vocabulary: "M4 19L12 4l8 15M7.5 13.5h9",
  Game: "M7 8.5h10a4.5 4.5 0 0 1 4.5 4.5v2.2a2.6 2.6 0 0 1-4.4 1.9L15.2 15H8.8l-1.9 2.1A2.6 2.6 0 0 1 2.5 15.2V13A4.5 4.5 0 0 1 7 8.5zM8 11v4M6 13h4M16.5 12.2h.01M18.5 14.2h.01",
  speaker: "M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11",
  flip: "M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  print:
    "M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  people:
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 19a6 6 0 0 1 12 0M16 11a2.5 2.5 0 1 0 0-5M17.5 19a5 5 0 0 0-2.5-4.3",
  book: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",
  cards:
    "M8 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM4 8v11a2 2 0 0 0 2 2h9",
  play: "M8 5.5v13l11-6.5z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  eyeOff:
    "M3 3l18 18M10.6 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.9 3.5M6.3 7.2A15 15 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4.100-1",
  shuffle:
    "M4 7h3.5c5 0 4 10 9 10H20M4 17h3.5c1.600 0 2.600-1 3.400-2.200M20 7h-3.500c-1.600 0-2.600 1-3.400 2.200M17.500 4.500L20 7l-2.500 2.500M17.500 14.500L20 17l-2.500 2.500",
};

/** Build an inline SVG icon by name (a domain name or one of the keys above). */
export function icon(name, size = 20, { filled = false } = {}) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", PATHS[name] || PATHS.Vocabulary);
  path.setAttribute("fill", filled ? "currentColor" : "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.9");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}

// Create · line icons (24px grid, stroke = currentColor), built with DOM calls (no innerHTML anywhere in Create).
// Decorative: every icon is aria-hidden, the text beside it carries the meaning.

const NS = "http://www.w3.org/2000/svg";

/** name -> list of SVG path `d` strings (plus optional circles as "c:cx,cy,r"). */
const ICONS = {
  interactive: ["M3 5h18v11H3z", "M8 20h8", "M12 16v4", "M10 9l3 2-3 2z"],
  worksheet: ["M6 3h9l4 4v14H6z", "M15 3v4h4", "M9 11h7", "M9 14h7", "M9 17h4"],
  game: [
    "M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-5.2 2L14 14h-4l-1.8 2A3 3 0 0 1 3 14v-2a3 3 0 0 1 3-3z",
    "M8 11v3",
    "M6.5 12.5h3",
    "c:16,12,0.8",
    "c:18,14,0.8",
  ],
  vocab: ["M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z", "M4 21V5", "M9 13l2-6 2 6", "M9.7 11h2.6"],
  check: ["M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z", "M9 13l2 2 4-4"],
  speaking: ["M4 5h16v10H9l-5 4z", "M8 9h8", "M8 12h5"],
  writing: ["M4 20l4-1 11-11-3-3L5 16z", "M14 7l3 3", "M4 20h16"],
  recipe: ["M5 4h11l3 3v13H5z", "M8 9h3", "M8 13h8", "M8 17h6", "M14 9l1 1 2-2"],
  open: ["M4 4h7", "M4 4v16h16v-7", "M13 3h8v8", "M21 3l-9 9"],
  packet: ["M7 7h13v13H7z", "M4 4h13v3", "M4 4v13h3"],
  html: ["M12 3v12", "M7 10l5 5 5-5", "M4 19h16"],
  print: ["M7 8V3h10v5", "M5 8h14a2 2 0 0 1 2 2v6h-4", "M7 16H3v-6a2 2 0 0 1 2-2", "M7 13h10v8H7z"],
  word: ["M5 3h10l4 4v14H5z", "M8 10l1.5 6L11 12l1.5 4L14 10"],
  key: ["c:8,14,4", "M11 11l9-9", "M17 5l2 2", "M15 7l2 2"],
  slides: ["M3 4h18v12H3z", "M12 16v4", "M8 20h8", "M7 8h6", "M7 11h10"],
  pptx: ["M4 4h16v12H4z", "M9 20h6", "M12 16v4", "M10 7v6", "M10 7h2.5a1.8 1.8 0 0 1 0 3.6H10"],
  scorm: ["M2 9l10-5 10 5-10 5z", "M6 11v5c3 2 9 2 12 0v-5", "M22 9v5"],
  zip: ["M4 7h16v13H4z", "M3 3h18v4H3z", "M10 11h4"],
  upload: ["M12 15V3", "M7 8l5-5 5 5", "M4 15v5h16v-5"],
  speaker: ["M4 9h4l5-4v14l-5-4H4z", "M16 9a4 4 0 0 1 0 6", "M18.5 6.5a8 8 0 0 1 0 11"],
  frame: ["M4 6h16", "M4 12h9", "M15 12h5", "M4 18h5", "M11 18h9"],
  bank: ["M3 9l9-5 9 5", "M5 9v8", "M10 9v8", "M14 9v8", "M19 9v8", "M3 20h18"],
  globe: ["c:12,12,9", "M3 12h18", "M12 3a14 14 0 0 1 0 18", "M12 3a14 14 0 0 0 0 18"],
  picture: ["M4 5h16v14H4z", "c:9,10,1.6", "M4 17l5-5 4 4 3-3 4 4"],
  chunk: ["M4 5h16v4H4z", "M4 11h16v4H4z", "M4 17h10"],
  steps: ["M4 18h5v-4h5v-4h6", "M4 6h4"],
  cards: ["M3 7h13v13H3z", "M7 4h14v13", "M9.5 11v5", "M7 13.5h5"],
  level: ["M5 20V14", "M10 20V10", "M15 20V6", "M20 20V3"],
  bingo: ["M4 4h16v16H4z", "M9.3 4v16", "M14.7 4v16", "M4 9.3h16", "M4 14.7h16", "c:12,12,1.6"],
  chain: ["M10 14a4 4 0 0 1 0-5.6l2.4-2.4a4 4 0 0 1 5.6 5.6L16.6 13", "M14 10a4 4 0 0 1 0 5.6l-2.4 2.4a4 4 0 0 1-5.6-5.6L7.4 11"],
  ticket: ["M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z", "M8 12h6", "M8 15h4"],
  sort: ["M3 5h7v6H3z", "M14 5h7v6h-7z", "M3 15h7v4H3z", "M14 15h7v4h-7z", "M10 8h4", "M10 17h4"],
  kit: ["M4 8h16v12H4z", "M9 8V5h6v3", "M4 13h16", "M11 12h2v3h-2z"],
  team: ["c:8,8,3", "c:16,8,3", "M2 20a6 6 0 0 1 12 0", "M10 20a6 6 0 0 1 12 0"],
  sparkle: ["M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"],
};

/** An inline SVG icon element. Unknown names give an empty (still valid) icon. */
export function icon(name, cls = "cr-ico") {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", cls);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  for (const d of ICONS[name] || []) {
    if (d.startsWith("c:")) {
      const [cx, cy, r] = d.slice(2).split(",");
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", cx);
      c.setAttribute("cy", cy);
      c.setAttribute("r", r);
      svg.append(c);
    } else {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      svg.append(p);
    }
  }
  return svg;
}

export const ICON_NAMES = Object.freeze(Object.keys(ICONS));

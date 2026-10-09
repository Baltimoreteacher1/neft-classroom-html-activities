/** Shared, static navigation for curriculum discovery. No browser JS required. */
const destinations = [
  ["home", "/curriculum/", "Dashboard"],
  ["units", "/curriculum/units/", "Lessons"],
  ["practice", "/curriculum/practice-workbooks/", "Practice"],
  ["games", "/curriculum/arcade/", "Games"],
  ["labs", "/curriculum/learning-labs/", "Learning labs"],
  ["families", "/curriculum/family-connections/", "Homework"],
  ["help", "/curriculum/extra-help/", "Extra Help"],
  ["fluency", "/curriculum/fluency/", "Fluency"],
];
/* Pages whose bar carries the reading-supports control (see courseNav). */
export const readingSupportPages = new Set(["curriculum/index.html"]);
export const shellPages = new Map([
  ["curriculum/index.html", "home"],
  ["curriculum/extra-help/index.html", "help"],
  ["curriculum/fluency/index.html", "fluency"],
  ["curriculum/units/index.html", "units"],
  ["curriculum/arcade/index.html", "games"],
  ["curriculum/projects/index.html", ""],
  ["curriculum/learning-labs/index.html", "labs"],
  ["curriculum/practice-workbooks/index.html", "practice"],
  ["curriculum/manipulatives/index.html", "practice"],
  ["curriculum/my-progress/index.html", ""],
  ["curriculum/family-connections/index.html", "families"],
]);
/* On a phone the bar shows the first destinations inline and the rest behind a
 * native <details> "More" disclosure: keyboard- and screen-reader-operable with
 * no script. Those links render twice in the markup and CSS shows exactly one
 * copy per width (display:none removes the other from the accessibility tree),
 * so nothing is ever off-screen without a cue. From Games onward is the
 * overflow; between 401px and 780px Games stays inline and its More copy hides. */
const OVERFLOW_FROM = 3;
const link = ([key, href, label], active) =>
  `<li><a href="${href}"${key === active ? ' aria-current="page"' : ""}>${label}</a></li>`;

/* The hub's reading preferences live in the bar so they are reachable at every
 * width. Behaviour is assets/curriculum-hub-pedagogy.js (toggleUdlMenu and the
 * two toggles); only the hub loads it, so only the hub asks for the slot. */
const READING_SUPPORTS = `<div class="ewl-course-tools"><div class="hub-reading-control"><button id="udlFloatingLauncher" type="button" aria-expanded="false" aria-controls="udlMenuPopover" onclick="toggleUdlMenu()">Reading supports</button><div id="udlMenuPopover" role="region" aria-labelledby="udlMenuTitle" style="display: none"><h2 id="udlMenuTitle">Reading and language supports</h2><label><span>Atkinson headings and controls</span><input type="checkbox" id="chkDyslexiaFont" onchange="toggleDyslexiaFont(this.checked)" /></label><label><span>High contrast</span><input type="checkbox" id="chkHighContrast" onchange="toggleHighContrast(this.checked)" /></label><a href="/esol/">Open language supports</a></div></div></div>`;

export function courseNav(active = "", { readingSupports = false } = {}) {
  const overflow = destinations.slice(OVERFLOW_FROM);
  const moreCurrent = overflow.some(([key]) => key === active) ? " ewl-course-more--current" : "";
  return `<nav class="ewl-course-nav" aria-label="Curriculum navigation"><div class="ewl-course-nav__inner"><a class="ewl-course-brand" href="/curriculum/"><img src="/assets/favicon.svg" width="28" height="28" alt="">EduWonderLab<span>Grade 6 math</span></a><div class="ewl-course-menu"><ul class="ewl-course-links">${destinations.map((d) => link(d, active)).join("")}</ul><details class="ewl-course-more${moreCurrent}"><summary>More</summary><ul>${overflow.map((d) => link(d, active)).join("")}</ul></details></div>${readingSupports ? READING_SUPPORTS : ""}</div></nav>`;
}
export function withCurriculumShell(html, active = "", options = {}) {
  html = html.replace(
    /<!-- curriculum-shell:begin -->[\s\S]*?<!-- curriculum-shell:end -->\s*/g,
    "",
  );
  if (!html.includes("/assets/fonts/hub-curriculum.css"))
    html = html.replace(
      "</head>",
      '<link rel="stylesheet" href="/assets/fonts/hub-curriculum.css">\n</head>',
    );
  if (!html.includes("/assets/curriculum-system.css"))
    html = html.replace(
      "</head>",
      '<link rel="stylesheet" href="/assets/curriculum-system.css">\n</head>',
    );
  html = html.replace(/<body([^>]*)>/, (match, attributes) => {
    if (/class=/.test(attributes))
      return match.replace(
        /class="([^"]*)"/,
        (_, classes) =>
          `class="${classes
            .split(" ")
            .filter((c) => c !== "curriculum-product")
            .concat("curriculum-product")
            .join(" ")}"`,
      );
    return `<body${attributes} class="curriculum-product">`;
  });
  if (!/<main[^>]*\bid=/.test(html))
    html = html.replace(/<main\b/, '<main id="curriculum-content"');
  const target = /<main[^>]*\bid="([^"]+)"/.exec(html)?.[1];
  const skip =
    target && !/class="skip-link"/.test(html)
      ? `<a class="ewl-skip" href="#${target}">Skip to main content</a>`
      : "";
  const nav = `<!-- curriculum-shell:begin -->\n${skip}${courseNav(active, options)}\n<!-- curriculum-shell:end -->\n`;
  return html.replace(/(<body[^>]*>)\s*/, `$1\n${nav}`);
}

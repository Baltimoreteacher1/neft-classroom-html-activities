/** Shared, static navigation for curriculum discovery. No browser JS required. */
const destinations = [
  ["home", "/curriculum/", "Dashboard"],
  ["units", "/curriculum/units/", "Lessons"],
  ["practice", "/curriculum/practice-workbooks/", "Practice"],
  ["games", "/curriculum/arcade/", "Games"],
  ["labs", "/curriculum/learning-labs/", "Learning labs"],
  ["families", "/curriculum/family-connections/", "Homework"],
];
export const shellPages = new Map([
  ["curriculum/index.html", "home"],
  ["curriculum/extra-help/index.html", ""],
  ["curriculum/units/index.html", "units"],
  ["curriculum/arcade/index.html", "games"],
  ["curriculum/projects/index.html", ""],
  ["curriculum/learning-labs/index.html", "labs"],
  ["curriculum/practice-workbooks/index.html", "practice"],
  ["curriculum/manipulatives/index.html", "practice"],
  ["curriculum/my-progress/index.html", ""],
  ["curriculum/family-connections/index.html", "families"],
]);
export function courseNav(active = "") {
  return `<nav class="ewl-course-nav" aria-label="Curriculum navigation"><div class="ewl-course-nav__inner"><a class="ewl-course-brand" href="/curriculum/"><img src="/assets/favicon.svg" width="28" height="28" alt="">EduWonderLab<span>Grade 6 math</span></a><ul>${destinations.map(([key, href, label]) => `<li><a href="${href}"${key === active ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}</ul></div></nav>`;
}
export function withCurriculumShell(html, active = "") {
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
  const nav = `<!-- curriculum-shell:begin -->\n${skip}${courseNav(active)}\n<!-- curriculum-shell:end -->\n`;
  return html.replace(/(<body[^>]*>)\s*/, `$1\n${nav}`);
}

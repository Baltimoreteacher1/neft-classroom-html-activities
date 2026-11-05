// Three student destinations over the existing views: Home (choose a grade and skill, then the skill itself),
// My Learning (progress, practice, mistakes to fix, the grade's own page) and Explore (games, models, writing,
// Math Reality). Views and ?view= links are unchanged; this file only decides which destination a view belongs
// to and what its sub-navigation is. Teachers and families have their own links beside the three.
export const DESTINATIONS = [
  { id: "home", view: "library", views: ["workspace"] },
  { id: "learning", view: "path", views: ["path", "practice", "notebook"] },
  { id: "explore", view: "games", views: ["games", "models", "write"] },
];

const SUBNAV = {
  learning: [
    { view: "path", label: (t) => t("My progress") },
    { view: "library", label: (t) => t("My grade") },
    { view: "practice", label: (t) => t("Practice") },
    { view: "notebook", label: (t) => t("Fix my mistakes") },
  ],
  explore: [
    { view: "games", label: (t) => t("Games") },
    { view: "models", label: (t) => t("Model Lab") },
    { view: "write", label: (t) => t("Writing Studio") },
    { href: "reality/", label: (t) => t("Math Reality") },
    { href: "reality/lab/", label: (t) => t("Reality Lab") },
  ],
};

// The library view is Home while it shows the grade-and-skill picker, and the learner's grade page otherwise.
export function destinationFor(view, { landing = false } = {}) {
  if (view === "library") return landing ? "home" : "learning";
  return DESTINATIONS.find((destination) => destination.views.includes(view))?.id || null;
}

export function subnavFor(view, options) {
  return SUBNAV[destinationFor(view, options)] || [];
}

// Fills the sub-navigation row; hidden when the destination has a single area.
export function renderSubnav(host, view, t, options = {}) {
  const items = subnavFor(view, options);
  host.hidden = items.length === 0;
  host.replaceChildren(
    ...items.map((item) => {
      const node = document.createElement(item.href ? "a" : "button");
      if (item.href) node.href = item.href;
      else {
        node.type = "button";
        node.dataset.view = item.view;
      }
      node.textContent = item.label(t);
      if (item.view === view) node.setAttribute("aria-current", "page");
      return node;
    }),
  );
}

// Marks the primary destination that owns the current view.
export function markDestinations(nav, view, options = {}) {
  const current = destinationFor(view, options);
  for (const button of nav.querySelectorAll("[data-dest], button[data-view]")) {
    const own = button.dataset.dest
      ? button.dataset.dest === current
      : button.dataset.view === view;
    if (own) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
}

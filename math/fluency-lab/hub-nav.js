// Four student destinations over the existing views: Today (the recommended grade journey), Practice (the
// adaptive set and mistake repair), Explore (games, models, writing and Math Reality) and My Growth (the evidence
// path). Views and ?view= links are unchanged. Teachers and families remain separate adult links.
export const DESTINATIONS = [
  { id: "today", view: "library", views: ["library", "workspace"] },
  { id: "practice", view: "practice", views: ["practice", "notebook"] },
  { id: "explore", view: "games", views: ["games", "models", "write"] },
  { id: "growth", view: "path", views: ["path"] },
];

const SUBNAV = {
  practice: [
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

export function destinationFor(view) {
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

// Three student destinations over the existing views. Home is the no-setup grade and skill picker;
// My Learning holds Today, the grade library, practice, mistake repair and growth; Explore holds
// games, models, writing and Math Reality. Existing views and ?view= links remain supported.
export const DESTINATIONS = [
  { id: "home", view: "library", views: [] },
  { id: "learning", view: "library", views: ["library", "workspace", "practice", "notebook", "path"] },
  { id: "explore", view: "games", views: ["games", "models", "write"] },
];

const SUBNAV = {
  learning: [
    { view: "library", label: (t) => t("Today") },
    { view: "practice", label: (t) => t("Practice") },
    { view: "path", label: (t) => t("My Growth") },
    { view: "notebook", label: (t) => t("Fix my mistakes") },
  ],
  explore: [
    { view: "games", label: (t) => t("Games") },
    { view: "models", label: (t) => t("Model Lab") },
    { view: "write", label: (t) => t("Writing Studio") },
    { href: "reality/", label: (t) => t("Math Reality") },
    { href: "reality/lab/", label: (t) => t("Reality Lab") },
    { href: "mathsense/", label: (t) => t("MathSense") },
  ],
};

export function destinationFor(view) {
  return DESTINATIONS.find((destination) => destination.views.includes(view))?.id || null;
}

export function subnavFor(view, options) {
  if (options?.landing) return [];
  if (view === "library" || ["workspace", "practice", "notebook", "path"].includes(view)) return SUBNAV.learning;
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
  const current = options.landing ? "home" : view === "library" || ["workspace", "practice", "notebook", "path"].includes(view) ? "learning" : destinationFor(view, options);
  for (const button of nav.querySelectorAll("[data-dest], button[data-view]")) {
    const own = button.dataset.dest
      ? button.dataset.dest === current
      : button.dataset.view === view;
    if (own) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
}

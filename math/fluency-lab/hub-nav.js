// Five student destinations over the existing views. Views and ?view= links are unchanged;
// this file only decides which destination a view belongs to and what its sub-navigation is.
export const DESTINATIONS = [
  { id: "home", view: "library", views: ["library", "workspace"] },
  { id: "learn", view: "models", views: ["models", "write"] },
  { id: "practice", view: "practice", views: ["practice", "notebook"] },
  { id: "play", view: "games", views: ["games"] },
  { id: "growth", view: "path", views: ["path"] },
];

const SUBNAV = {
  learn: [
    { view: "models", label: (t) => t("Model Lab") },
    { view: "write", label: (t) => t("Writing Studio") },
  ],
  practice: [
    { view: "practice", label: (t) => t("Start practicing") },
    { view: "notebook", label: (t) => t("Fix my mistakes") },
  ],
};

export function destinationFor(view) {
  return DESTINATIONS.find((destination) => destination.views.includes(view))?.id || null;
}

export function subnavFor(view) {
  return SUBNAV[destinationFor(view)] || [];
}

// Fills the sub-navigation row; hidden when the destination has a single area.
export function renderSubnav(host, view, t) {
  const items = subnavFor(view);
  host.hidden = items.length === 0;
  host.replaceChildren(
    ...items.map((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.view = item.view;
      button.textContent = item.label(t);
      if (item.view === view) button.setAttribute("aria-current", "page");
      return button;
    }),
  );
}

// Marks the primary destination that owns the current view.
export function markDestinations(nav, view) {
  const current = destinationFor(view);
  const target = DESTINATIONS.find((destination) => destination.id === current)?.view;
  for (const button of nav.querySelectorAll("button")) {
    const own = button.dataset.view === view || button.dataset.view === target;
    if (own) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
}

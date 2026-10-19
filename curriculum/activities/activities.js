(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const query = $("activity-query");
  const type = $("activity-type");
  const unit = $("activity-unit");
  const status = $("activity-status");
  const results = $("activity-results");
  const more = $("activity-more");
  const kind = {
    Activity: "activity", Enrichment: "activity", Practice: "practice", Game: "game",
    Project: "project", "Math Tool": "tool", Review: "review", "On-Ramp": "review", "Study Guide": "review",
  };
  const names = { activity: "Explore and apply", practice: "Practice", game: "Game", project: "Project", tool: "Math tool", review: "Review and get ready" };
  let entries = [];
  let matches = [];
  let shown = 0;

  function safePath(path) { return typeof path === "string" && /^\/(?!\/)[^\\\u0000-\u001f]*$/.test(path); }
  function normalized(value) { return String(value || "").toLocaleLowerCase().trim(); }
  function syncUrl() {
    const params = new URLSearchParams();
    if (query.value.trim()) params.set("q", query.value.trim());
    if (type.value !== "all") params.set("type", type.value);
    if (unit.value !== "all") params.set("unit", unit.value);
    history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
  }
  function card(entry) {
    const anchor = document.createElement("a");
    anchor.className = "activity-card";
    anchor.href = entry.path;
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const detail = document.createElement("span");
    detail.textContent = [names[kind[entry.category]], entry.unit ? `Unit ${entry.unit}` : "Across units", entry.standard || ""].filter(Boolean).join(" · ");
    anchor.append(title, detail);
    return anchor;
  }
  function showMore() {
    const next = matches.slice(shown, shown + 24);
    results.append(...next.map(card));
    shown += next.length;
    more.hidden = shown >= matches.length;
    more.textContent = `Show more activities (${matches.length - shown} left)`;
    if (matches.length) status.textContent = `${matches.length} activities found. Showing ${shown}.`;
  }
  function render() {
    const q = normalized(query.value);
    matches = entries.filter((entry) =>
      (type.value === "all" || kind[entry.category] === type.value) &&
      (unit.value === "all" || entry.unit === Number(unit.value)) &&
      (!q || normalized(`${entry.title} ${entry.keywords} ${entry.standard} ${entry.path}`).includes(q)),
    );
    results.replaceChildren();
    shown = 0;
    if (!matches.length) status.textContent = "No activities match these filters. Try a different topic or clear the filters.";
    showMore();
    syncUrl();
  }
  $("activity-filters").addEventListener("input", render);
  $("activity-filters").addEventListener("change", render);
  $("activity-filters").addEventListener("reset", () => setTimeout(render, 0));
  $("activity-filters").addEventListener("submit", (event) => event.preventDefault());
  more.addEventListener("click", showMore);
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(location.search);
    query.value = params.get("q") || "";
    type.value = params.get("type") || "all";
    unit.value = params.get("unit") || "all";
    render();
  });
  fetch("/data/catalog.json")
    .then((response) => { if (!response.ok) throw new Error("Catalog unavailable"); return response.json(); })
    .then((catalog) => {
      entries = (catalog.entries || []).filter((entry) => entry.audience === "student" && kind[entry.category] && safePath(entry.path));
      entries.sort((a, b) => (a.unit || 99) - (b.unit || 99) || a.title.localeCompare(b.title));
      const params = new URLSearchParams(location.search);
      query.value = params.get("q") || "";
      type.value = params.get("type") || "all";
      unit.value = params.get("unit") || "all";
      render();
    })
    .catch(() => { status.textContent = "The activity list could not load. Browse the units or try again later."; });
})();
